/**
 * protected-paths.mjs
 *
 * Decoupled from scripts/check-path-guard.mjs — pure path-matching functions only.
 * No CLI shell, no process.argv, no process.exit, no file I/O.
 *
 * Purpose: runtime non-blocking reminder (used by boundary-confirm).
 * Not a CI guard — does not block anything.
 */

// ---------------------------------------------------------------------------
// Protected-path list (declarative — add paths here to protect them)
// ---------------------------------------------------------------------------

// ponytail: flat array sufficient for current scale; convert to pattern-match
// (glob/regex) if path count exceeds ~20 or wildcard semantics are needed.
export const PROTECTED_PATHS = [
  // Constitution — source of truth for design constraints
  "CONSTITUTION.md",
  // Agent contract files
  "AGENTS.md",
  "CONTEXT.md",
];

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
 * NOT match the protected entry "AGENTS.md".
 *
 * @param {string} changedFile
 * @returns {string|null}
 */
export function findViolation(changedFile) {
  const normalised = normalisePath(changedFile);
  for (const protected_ of PROTECTED_PATHS) {
    if (normalised === protected_) {
      return protected_;
    }
  }
  return null;
}
