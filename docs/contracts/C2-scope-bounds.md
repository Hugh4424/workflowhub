# C2 Bounded-Change Contract

## Purpose

This document is the canonical text of the **FR-DIFF-002** bounded-change contract enforced by
`workflows/build-code/diff-scanner.mjs` (`scanDiff()`). `scanDiff()` is a pure function — it takes
`git diff` text as input, performs no IO and has no side effects, and returns a list of
`{ type, pattern, line }` violations plus a `safe` boolean (`safe: violations.length === 0`). It is
the general safety net that every phase's diff is scanned against before the phase can proceed;
if it reports any violation, `workflows/build-code/SKILL.md` requires an immediate STOP and explicit
human confirmation before continuing — there is no automated bypass.

There are three rule categories: `irreversible_git`, `external_dep`, and `prod_config`. Each
violation entry carries the category as its `type`.

## Rule categories

### 1. `irreversible_git` — irreversible git operations

These are literal string patterns matched against **added content lines** of the diff (see
"Matching semantics" below) — they represent git commands appearing as code/script content, not
file paths. The scanner checks each added line against the patterns in this exact order and stops
at the first match (`break`), so **more-specific patterns are listed before less-specific patterns
they are a substring of**:

1. `git push --force-with-lease`
2. `git push --force`
3. `git push --delete`
4. `git push -f`
5. `git push` (base form — catches any remaining `git push` variant not matched above)
6. `git branch -d`
7. `git branch -D`
8. `git reset --hard`

Example: a line containing `git push --force` matches pattern 2 (`git push --force`), not pattern 5
(`git push`), because pattern 2 is checked first and the loop breaks on first match.

### 2. `external_dep` — external dependency manifests

**File-path rules** (matched against the changed file's **basename**, i.e. filename only, no
directory component):

- `package.json`
- `pnpm-lock.yaml`
- `go.mod`
- `go.sum`

A file triggers this rule when its basename exactly equals one of the above, regardless of which
directory it lives in.

**Content regex rule — `plugin-semver-bump`:**

This rule fires only on an added or removed line (`+`/`-` prefix, excluding `+++`/`---` diff
headers) that:

- belongs to a file whose basename is exactly `package.json` (the rule is a no-op for any other
  file — e.g. a `+const VERSION = "1.2.3"` added inside a `.mjs` file does **not** trigger it), and
- contains a semver-like version string: an optional `^` prefix and optional surrounding quotes,
  followed by `\d+.\d+.\d+` (regex: `["']?\^?\d+\.\d+\.\d+["']?`).

### 3. `prod_config` — production configuration and infrastructure

**File-path rules** (matched against the changed file's **basename**):

- `.env.production` — checked before `.env` so the more specific pattern is reported first, though
  both checks run independently (no `break` between them).
- `.env` — matches only when the basename is exactly `.env` (this does not also match
  `.env.production`, which has its own separate rule above).

**Path-segment regex rules** (matched against the full changed **file path**, not content lines).
A path segment is any component between `/` separators (directory name or filename); the match is
anchored to path boundaries so a partial word match mid-segment does not fire:

- `deploy*` — regex `(?:^|\/)deploy[^/]*(?:\/|$)` — matches any path segment starting with
  `deploy` (e.g. `deploy/`, `deployment.yml`), but not `mydeployment` where `deploy` is not at the
  start of the segment.
- `infra*` — regex `(?:^|\/)infra[^/]*(?:\/|$)` — matches any path segment starting with `infra`
  (e.g. `infra/terraform.tf`).
- `ci*` — regex `(?:^|\/)ci[^/]*(?:\/|$)` — matches any path segment starting with `ci`, anchored
  to avoid false positives inside words like `special` or `explicit`.

## Matching semantics

- **File-path rules** (`external_dep` manifest rules, `prod_config` `.env`/`.env.production` rules,
  and the `deploy*`/`infra*`/`ci*` regex rules) are evaluated against the **changed file path**
  extracted from the diff header line (`diff --git a/... b/...`, using the `b/` side). They fire
  once per file the moment its header is seen, independent of the file's content.
- **Content rules** (`irreversible_git` patterns and the `plugin-semver-bump` regex rule) are
  evaluated **only against added lines** — lines starting with `+` that are not a `+++` file
  header. Context lines (starting with a space) and removed lines (starting with `-`) never
  trigger a content-rule violation:
  - Context lines are pre-existing surrounding code, not something the developer is introducing.
  - Removed lines represent code being deleted; deleting a git op is not itself a new violation.
- Each distinct `(pattern, line-or-file)` combination is deduplicated so the same violation is not
  reported more than once for the same location.

## Scope of this contract

This is a **general, repo-wide safety-net contract** applied uniformly to every phase's diff by
`scanDiff()` — it is not aware of any single task's specific allow-list. It is a separate concern
from a per-task file allow-list (for example, a task-specific allow-list script such as the T026
allow-list referenced in an individual phase issue), which independently constrains which files a
given phase is permitted to touch. A diff can pass this C2 contract and still be rejected by a
task's own narrower allow-list, and vice versa is not possible — this contract's rules apply
regardless of task scope.
