/**
 * check-path-guard.mjs  (FR-PATHG-001 / FR-PATHG-002 / FR-PATHG-003)
 *
 * Declarative protected-path guard for workflowhub.
 * Accepts an explicit changed-files list and reports any paths that match
 * the built-in protected list.  Pure read — writes NO files (FR-PATHG-002).
 *
 * Exit codes:
 *   0 — no violations (or --known-gaps / --self-test passed)
 *   1 — one or more protected paths found in changed-files
 *   2 — internal error
 *
 * CLI:
 *   node scripts/check-path-guard.mjs --files f1 f2 ...
 *   node scripts/check-path-guard.mjs --known-gaps
 *   node scripts/check-path-guard.mjs --self-test
 *
 * FR-PATHG-003 — known gaps (honest capability declaration):
 *   This script reliably intercepts explicit file-path arguments passed via
 *   --files.  It CANNOT reliably intercept:
 *     • bash heredoc writes (cat <<'EOF' > file)
 *     • dynamic variable path construction  (path = base + suffix; fs.write(path))
 *     • external process or script writes   (python script.py, curl -o file)
 *     • in-process monkey-patching of fs APIs
 *   These bypass methods are documented here (FR-PATHG-003), not blocked.
 */

// ---------------------------------------------------------------------------
// Protected-path list (declarative — add paths here to protect them)
// ---------------------------------------------------------------------------

// ponytail: flat array sufficient for current scale; convert to pattern-match
// (glob/regex) if path count exceeds ~20 or wildcard semantics are needed.
const PROTECTED_PATHS = [
  // Core configuration / schema
  "config/workflowhub.yaml",
  // Constitution — source of truth for design constraints
  "CONSTITUTION.md",
  // Agent contract files
  "AGENTS.md",
  "CONTEXT.md",
];

// ---------------------------------------------------------------------------
// Known-gaps declaration (FR-PATHG-003)
// ---------------------------------------------------------------------------

const KNOWN_GAPS_TEXT = `
check-path-guard: known gaps (FR-PATHG-003)
============================================
This guard checks paths explicitly supplied via --files.
It does NOT reliably intercept:

  1. bash heredoc writes
       e.g.  cat <<'EOF' > config/workflowhub.yaml
             ...content...
             EOF
     The path never surfaces as a --files argument.

  2. Dynamic variable path construction
       e.g.  const target = prefix + "/workflowhub.yaml";
             fs.writeFileSync(target, data);
     String assembly at runtime is invisible to static path matching.

  3. External process or script writes
       e.g.  python update-config.py
             curl -o CONSTITUTION.md https://...
     Writes performed by a child process or external tool bypass this check.

  4. In-process fs API monkey-patching
     If fs.writeFileSync is overridden before this check runs, writes may
     not be visible.

These bypass methods are intentionally undeclared rather than falsely blocked.
Run this check as part of CI with git-diff-generated --files for reliable coverage.
`.trimStart();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a path string for matching: strip leading ./ and collapse slashes.
 * We do NOT resolve to absolute paths — matching is purely string-based against
 * the protected list, which also uses relative paths.
 */
function normalisePath(p) {
  return p.replace(/^\.\//, "").replace(/\/+/g, "/");
}

/**
 * Check a single changed-file path against the protected list.
 * Returns the matching protected entry, or null.
 *
 * Matching is repo-relative exact equality only — PROTECTED_PATHS entries are
 * precise relative paths, not suffix patterns.  A file at docs/AGENTS.md must
 * NOT match the protected entry "AGENTS.md" (FR-PATHG-001 pass-through).
 */
function findViolation(changedFile) {
  const normalised = normalisePath(changedFile);
  for (const protected_ of PROTECTED_PATHS) {
    if (normalised === protected_) {
      return protected_;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// --self-test: prove the protected list catches a known bad sample
// ---------------------------------------------------------------------------

function runSelfTest() {
  // Use the first entry in PROTECTED_PATHS as the bad sample
  const badSample = PROTECTED_PATHS[0];
  const hit = findViolation(badSample);
  if (hit) {
    console.log(
      `check-path-guard self-test: CAUGHT — "${badSample}" detected as protected path`
    );
    console.log("self-test PASSED");
    process.exit(0);
  } else {
    console.error(
      `check-path-guard self-test: FAILED — "${badSample}" was NOT detected`
    );
    process.exit(2);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);

  // --known-gaps: print honest capability declaration and exit 0
  if (args.includes("--known-gaps")) {
    process.stdout.write(KNOWN_GAPS_TEXT);
    process.exit(0);
  }

  // --self-test: prove detection works on a built-in bad sample
  if (args.includes("--self-test")) {
    runSelfTest();
    return;
  }

  // --files f1 f2 ...: scan explicit changed-files list
  const filesIdx = args.indexOf("--files");
  if (filesIdx === -1) {
    console.error(
      "check-path-guard: error: --files <path...> required (or --known-gaps / --self-test)"
    );
    process.exit(2);
  }

  const filesToCheck = args.slice(filesIdx + 1).filter((a) => !a.startsWith("--"));
  if (filesToCheck.length === 0) {
    // No files to check — nothing to violate
    console.log("check-path-guard: OK — no files provided");
    process.exit(0);
  }

  // Check each file
  const violations = [];
  for (const f of filesToCheck) {
    const hit = findViolation(f);
    if (hit) {
      violations.push({ file: f, protected: hit });
    }
  }

  if (violations.length === 0) {
    console.log(
      `check-path-guard: OK — ${filesToCheck.length} file(s) checked, no violations`
    );
    process.exit(0);
  }

  // Report violations
  console.log(
    `check-path-guard: VIOLATIONS — ${violations.length} protected path(s) in changed-files:`
  );
  for (const v of violations) {
    console.log(`  PROTECTED  ${v.file}  (matches: ${v.protected})`);
  }
  process.exit(1);
}

main();
