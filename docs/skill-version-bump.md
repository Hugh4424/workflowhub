# Skill Version Bump Rules

> M4 metrics foundation, FR-VERSION-001/002 (decision-log D13). This is a **rule
> document** — there is no automated schema-diff guard in CI this milestone.

## Public API = the skill manifest

A skill's **public API is its manifest**: its name, parameters, described behavior, and
output shape. Versioning reasons about changes to that manifest — not about internal
implementation that callers cannot observe. Two skills with identical manifests are
interchangeable from a caller's perspective; a manifest change is the unit of versioning.

The skill version is recorded as the `skill_version` field on every execution record
(FR-VERSION-002), so cross-task aggregation can distinguish versions.

## Bump levels

Semantic versioning `MAJOR.MINOR.PATCH`:

| Change to the manifest | Bump |
|---|---|
| **Structural change** — rename/remove a parameter or output field, change a type, change required-ness | **major** |
| **Behavior change** — same manifest shape but observably different behavior/semantics | **may be major** (major if a caller could break; otherwise minor) |
| **Add an optional parameter / output field** — backward compatible | **minor** |
| **Documentation-conformance fix** — align the doc/description to the actual behavior, no behavior change | **patch** |

When in doubt between behavior-change major vs minor, prefer **major** if any existing
caller could break.

## Pre-1.0 handling

Before the first stable release a skill uses `0.x.x`. Under `0.x.x`, the minor position
carries breaking changes (i.e. `0.MAJOR.MINOR` semantics): bump the **minor** for a
structural/breaking change and the **patch** for additive or documentation changes.
Promote to `1.0.0` when the manifest is considered stable.

## Change notes (changelog)

Every version bump ships a **changelog / change note** entry stating: the new version,
the bump level, and a one-line description of the manifest change and why. The change
note is the human-readable record that pairs with the `skill_version` field on records.

## Out of scope (this milestone)

No automated contract-diff guard in CI (FR-VERSION-002). Version discipline is enforced
by this rule document and review, not by a machine schema-diff gate. Automated guarding
is deferred (roadmap M14).
