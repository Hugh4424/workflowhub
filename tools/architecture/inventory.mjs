import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUTPUT = resolve(ROOT, "docs/architecture/repository-inventory.tsv");
const INVENTORY_PATH = "docs/architecture/repository-inventory.tsv";
const DISPOSITIONS = new Set(["keep", "move", "merge", "delete", "generate", "archive"]);

const ZERO_GATES = Object.freeze({
  "legacy-runtime": Object.freeze({
    // Immutable migration evidence and its task-only verifier may mention legacy;
    // every other delivery path and all runtime code must be legacy-free after T016.
    allowedPaths: Object.freeze(new Set([
      "docs/architecture/legacy-task-inventory.json",
      "docs/architecture/legacy-import-proof.json",
      "tools/architecture/verify-migration-proof.mjs",
    ])),
    runtimeRoots: ["core/", "scripts/", "schemas/", "skills/", "workflows/"],
    forbiddenContent: /legacy-reader|legacy-import|normalizeLegacyTask|legacy-import-proof/,
  }),
  // T054's accepted plan names this same post-migration hard gate
  // `task-only-governance`; retain the alias so the recorded gate command
  // remains executable without introducing a second policy.
  "task-only-governance": Object.freeze({
    allowedPaths: Object.freeze(new Set([
      "docs/architecture/legacy-task-inventory.json",
      "docs/architecture/legacy-import-proof.json",
      "tools/architecture/verify-migration-proof.mjs",
    ])),
    runtimeRoots: ["core/", "scripts/", "schemas/", "skills/", "workflows/"],
    forbiddenContent: /legacy-reader|legacy-import|normalizeLegacyTask|legacy-import-proof/,
  }),
});

function zeroGateErrors(name, { root = ROOT, env = process.env } = {}) {
  const gate = ZERO_GATES[name];
  if (!gate) return [`unknown zero gate: ${name}`];
  const errors = [];
  const files = listDeliveryFiles({ root, env });
  for (const path of files) {
    if (/legacy/i.test(path) && !gate.allowedPaths.has(path) && !path.startsWith("specs/archive/")) {
      errors.push(`legacy path still present in delivery tree: ${path}`);
    }
  }
  for (const path of files) {
    if (!gate.runtimeRoots.some((prefix) => path.startsWith(prefix))) continue;
    if (gate.allowedPaths.has(path)) continue;
    const text = readFileSync(resolve(root, path), "utf8");
    if (gate.forbiddenContent.test(text)) errors.push(`legacy runtime reference still present: ${path}`);
  }
  return errors;
}

export function listDeliveryFiles({ root = ROOT, env = process.env } = {}) {
  return execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
    cwd: root,
    env,
  })
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .sort();
}

function dispositionFor(path) {
  if (path.startsWith("specs/archive/")) return ["archive", "historical accepted design material"];
  return ["keep", "no approved deletion or move proof in Phase 0"];
}

function sha256(root, path) {
  return createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
}

export function renderInventory({ root = ROOT, env = process.env } = {}) {
  const rows = listDeliveryFiles({ root, env }).map((path) => {
    const [disposition, reason] = dispositionFor(path);
    const digest = path === INVENTORY_PATH ? "SELF" : sha256(root, path);
    return [path, disposition, reason, digest];
  });
  const header = ["path", "disposition", "reason", "sha256"];
  return `${[header, ...rows].map((row) => row.join("\t")).join("\n")}\n`;
}

export function validateInventory(
  text = readFileSync(OUTPUT, "utf8"),
  { root = ROOT, env = process.env } = {},
) {
  const lines = text.trimEnd().split("\n");
  const errors = [];
  if (lines.shift() !== "path\tdisposition\treason\tsha256") {
    errors.push("inventory header is invalid");
  }
  const rows = new Map();
  for (const [index, line] of lines.entries()) {
    const parts = line.split("\t");
    if (parts.length !== 4) {
      errors.push(`row ${index + 2} must contain four TSV columns`);
      continue;
    }
    const [path, disposition, reason, digest] = parts;
    if (rows.has(path)) errors.push(`duplicate path: ${path}`);
    if (!DISPOSITIONS.has(disposition)) errors.push(`invalid disposition for ${path}: ${disposition}`);
    if (!reason) errors.push(`missing reason for ${path}`);
    if (path === INVENTORY_PATH) {
      if (digest !== "SELF") errors.push("inventory self row must use SELF instead of a recursive digest");
    } else if (!/^[a-f0-9]{64}$/.test(digest)) {
      errors.push(`invalid sha256 for ${path}`);
    }
    rows.set(path, { disposition, digest });
  }

  const current = listDeliveryFiles({ root, env });
  for (const path of current) {
    if (!rows.has(path)) errors.push(`unclassified tracked file: ${path}`);
  }
  for (const path of rows.keys()) {
    if (!current.includes(path)) errors.push(`inventory contains non-delivery file: ${path}`);
  }
  if (rows.size !== current.length) {
    errors.push(`inventory row count ${rows.size} does not match delivery file count ${current.length}`);
  }
  return errors;
}

function main() {
  const check = process.argv.includes("--check");
  if (check) {
    const expected = renderInventory();
    const actual = readFileSync(OUTPUT, "utf8");
    const errors = validateInventory(actual);
    if (actual !== expected) errors.push("inventory bytes are stale for the current tracked tree");
    const zeroArg = process.argv.find((value) => value.startsWith("--require-zero="));
    if (zeroArg) errors.push(...zeroGateErrors(zeroArg.slice("--require-zero=".length)));
    if (errors.length) {
      for (const error of errors) console.error(error);
      process.exitCode = 1;
      return;
    }
    console.log(`inventory ok: ${listDeliveryFiles().length} delivery files, exactly one disposition each`);
    return;
  }
  writeFileSync(OUTPUT, renderInventory(), "utf8");
  console.log(`wrote ${relative(ROOT, OUTPUT)}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
