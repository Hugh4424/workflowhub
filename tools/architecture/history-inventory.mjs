import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const HISTORY_ROOTS = Object.freeze(["specs/archive/", "docs/architecture/legacy-"]);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const outputPath = (root) => resolve(root, "docs/architecture/history-inventory.json");

function filesAt(root = ROOT) {
  const found = new Set();
  const visit = (absolute, relative) => {
    if (!existsSync(absolute)) return;
    const stat = lstatSync(absolute);
    if (stat.isFile()) { found.add(relative); return; }
    if (!stat.isDirectory()) return;
    for (const name of readdirSync(absolute)) visit(resolve(absolute, name), `${relative}/${name}`);
  };
  for (const prefix of HISTORY_ROOTS) {
    if (prefix.endsWith("/")) visit(resolve(root, prefix), prefix.slice(0, -1));
    else {
      const parent = prefix.slice(0, prefix.lastIndexOf("/") + 1);
      if (!existsSync(resolve(root, parent))) continue;
      for (const name of readdirSync(resolve(root, parent))) {
        const relative = `${parent}${name}`;
        if (relative.startsWith(prefix)) visit(resolve(root, relative), relative);
      }
    }
  }
  return [...found].sort();
}

export function snapshot({ root = ROOT, baseline = null } = {}) {
  const files = filesAt(root).map((path) => {
    const bytes = readFileSync(resolve(root, path));
    return { path, bytes: bytes.length, sha256: sha256(bytes) };
  });
  return {
    schema_version: "workflowhub-history-inventory.v1",
    baseline_commit: baseline ?? execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
    roots: HISTORY_ROOTS,
    files,
    file_count: files.length,
  };
}

export function captureBefore({ root = ROOT, baseline = null } = {}) {
  if (existsSync(outputPath(root))) {
    throw new Error(`history inventory already exists; refusing to overwrite: ${outputPath(root)}`);
  }
  const value = snapshot({ root, baseline });
  writeFileSync(outputPath(root), `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return value;
}

export function verifyUnchanged({ root = ROOT } = {}) {
  const output = outputPath(root);
  if (!existsSync(output)) return { ok: false, errors: ["history inventory is missing"] };
  const before = JSON.parse(readFileSync(output, "utf8"));
  const after = snapshot({ root, baseline: before.baseline_commit });
  const expected = new Map((before.files ?? []).map((entry) => [entry.path, entry]));
  const actual = new Map(after.files.map((entry) => [entry.path, entry]));
  const errors = [];
  for (const [path, entry] of expected) {
    const current = actual.get(path);
    if (!current) errors.push(`historical file missing: ${path}`);
    else if (current.bytes !== entry.bytes || current.sha256 !== entry.sha256) errors.push(`historical file changed: ${path}`);
  }
  for (const path of actual.keys()) if (!expected.has(path)) errors.push(`new historical file appeared: ${path}`);
  return { ok: errors.length === 0, before_count: expected.size, after_count: actual.size, errors };
}

function main() {
  const command = process.argv[2];
  const result = command === "capture-before" ? captureBefore() : command === "verify-unchanged" ? verifyUnchanged() : null;
  if (!result) throw new TypeError("usage: history-inventory.mjs <capture-before|verify-unchanged>");
  console.log(JSON.stringify(result, null, 2));
  if (result.ok === false) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
