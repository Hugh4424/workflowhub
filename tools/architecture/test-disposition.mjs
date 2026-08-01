import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { listDeliveryFiles } from "./inventory.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const OUTPUT = resolve(ROOT, "docs/architecture/test-disposition.tsv");
export const PROTECTED = new Set([
  "tests/e2e/five-stage-normal.test.mjs",
  "tests/e2e/five-stage-material-revision.test.mjs",
  "tests/e2e/five-stage-idempotent-resume.test.mjs",
  "tests/integration/atomic-write-faults.test.mjs",
  "tests/contract/legacy-zero.test.mjs",
]);
const HEADER = "path\tdisposition\treason\toracle\treplacement_ref";
const DISPOSITIONS = new Set(["keep", "merge", "move", "delete"]);

export function listTestFiles({ root = ROOT, env = process.env } = {}) {
  return listDeliveryFiles({ root, env }).filter((path) => /\.test\.[^/]+$/.test(path) || path.includes("/__tests__/"));
}

function defaultRow(path) {
  if (PROTECTED.has(path)) return [path, "keep", "protected behavioral oracle", "protected-oracle", "-"];
  if (path === "tests/integration/deletion-slices-summary.test.mjs") {
    return [path, "keep", "Phase 5 KEEP proof has no replacement oracle", "phase5-keep-proof", "-"];
  }
  if (path.startsWith("tests/e2e/")) return [path, "keep", "retained end-to-end behavior", "five-stage-e2e", "-"];
  if (path.startsWith("tests/integration/")) return [path, "keep", "retained integration quality predicate", "integration-quality", "-"];
  return [path, "keep", "retained contract quality predicate", "contract-quality", "-"];
}

export function renderDisposition({ root = ROOT, env = process.env } = {}) {
  const rows = listTestFiles({ root, env }).map(defaultRow);
  return `${[HEADER, ...rows.map((row) => row.join("\t"))].join("\n")}\n`;
}

export function validateDisposition(
  text = readFileSync(OUTPUT, "utf8"),
  { root = ROOT, env = process.env, requireAll = false } = {},
) {
  const errors = [];
  const lines = text.trimEnd() === "" ? [] : text.trimEnd().split("\n");
  if (lines.shift() !== HEADER) errors.push("test disposition header is invalid");
  const rows = new Map();
  for (const [index, line] of lines.entries()) {
    const parts = line.split("\t");
    if (parts.length !== 5) {
      errors.push(`row ${index + 2} must contain five TSV columns`);
      continue;
    }
    const [path, disposition, reason, oracle, replacement] = parts;
    if (!path || path.startsWith("/") || path.split(/[\\/]/).includes("..")) errors.push(`invalid test path: ${path}`);
    if (rows.has(path)) errors.push(`duplicate test path: ${path}`);
    if (!DISPOSITIONS.has(disposition)) errors.push(`invalid disposition for ${path}: ${disposition}`);
    if (!reason) errors.push(`missing reason for ${path}`);
    if (!oracle) errors.push(`missing oracle for ${path}`);
    if (disposition === "keep" && replacement !== "-") errors.push(`keep row must use '-' replacement: ${path}`);
    if (disposition !== "keep" && (!replacement || replacement === "-")) errors.push(`non-keep row requires replacement oracle: ${path}`);
    if (disposition !== "keep" && replacement !== "-" && !replacement.startsWith("evidence/") && !replacement.startsWith("tests/")) {
      errors.push(`replacement oracle must be evidence/ or tests/: ${path}`);
    }
    if (PROTECTED.has(path) && disposition !== "keep") errors.push(`protected test cannot be ${disposition}: ${path}`);
    rows.set(path, { disposition, replacement });
  }
  if (requireAll) {
    const current = listTestFiles({ root, env });
    for (const path of current) if (!rows.has(path)) errors.push(`unclassified test: ${path}`);
    for (const path of rows.keys()) if (!current.includes(path)) errors.push(`stale test row: ${path}`);
    if (rows.size !== current.length) errors.push(`test disposition row count ${rows.size} does not match test count ${current.length}`);
  }
  return errors;
}

function main() {
  if (process.argv.includes("--check")) {
    const errors = validateDisposition(readFileSync(OUTPUT, "utf8"), { requireAll: process.argv.includes("--require-all-inventory-tests") });
    if (errors.length) {
      for (const error of errors) console.error(error);
      process.exitCode = 1;
      return;
    }
    console.log(`test disposition ok: ${listTestFiles().length} test files, exactly one disposition each`);
    return;
  }
  writeFileSync(OUTPUT, renderDisposition(), "utf8");
  console.log(`wrote ${OUTPUT}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
