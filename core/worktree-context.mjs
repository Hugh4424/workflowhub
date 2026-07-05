/**
 * worktree-context.mjs — validate and print a worktree JSON descriptor.
 *
 * CLI: node core/worktree-context.mjs <path-to-worktree.json>
 *
 * If the JSON at that path has both `target_repo_root` and `worktree_root`
 * fields present → print the JSON to stdout, exit 0.
 * If either field is missing → print error to stderr, exit 1.
 *
 * @module worktree-context
 */

import { readFileSync } from "node:fs";

const [, , jsonPath] = process.argv;

if (!jsonPath) {
  process.stderr.write(
    "[worktree-context] error: missing argument — usage: node core/worktree-context.mjs <worktree.json>\n"
  );
  process.exit(1);
}

let raw;
try {
  raw = readFileSync(jsonPath, "utf8");
} catch (err) {
  process.stderr.write(
    `[worktree-context] error: cannot read file ${jsonPath} — ${err.message}\n`
  );
  process.exit(1);
}

let obj;
try {
  obj = JSON.parse(raw);
} catch (err) {
  process.stderr.write(
    `[worktree-context] error: invalid JSON in ${jsonPath} — ${err.message}\n`
  );
  process.exit(1);
}

const missing = [];
if (!Object.prototype.hasOwnProperty.call(obj, "target_repo_root")) {
  missing.push("target_repo_root");
}
if (!Object.prototype.hasOwnProperty.call(obj, "worktree_root")) {
  missing.push("worktree_root");
}

if (missing.length > 0) {
  process.stderr.write(
    `[worktree-context] error: required field(s) missing in ${jsonPath}: ${missing.join(", ")}\n`
  );
  process.exit(1);
}

process.stdout.write(JSON.stringify(obj) + "\n");
