import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUTPUT = resolve(ROOT, "docs/architecture/repository-inventory.tsv");
const INVENTORY_PATH = "docs/architecture/repository-inventory.tsv";
const DELETIONS_PROOF_PATH = "docs/architecture/deletions-proof.json";
const DERIVED_GOVERNANCE_FILES = Object.freeze(new Set([
  INVENTORY_PATH,
  "docs/architecture/complexity-baseline.json",
  "docs/architecture/final-complexity-report.json",
  "docs/architecture/final-coverage-audit.md",
]));
const PHASE9_EVIDENCE_PREFIX = "evidence/phase-9/";
const DISPOSITIONS = new Set(["keep", "move", "merge", "delete", "generate", "archive"]);
const TEST_PATH = /(?:^|\/)(?:__tests__\/.*\.test\.[cm]?[jt]sx?$|tests\/.*\.test\.[cm]?[jt]sx?$)/;

// These are the only task-only artifacts named by the accepted Phase-9 plan.
// Archived migration evidence is deliberately not included: it is permanent
// historical evidence, not a task-only delivery path.
export const TASK_ONLY_GOVERNANCE_PATHS = Object.freeze([
  "tools/architecture/deletion-proof.mjs",
  "tools/architecture/test-disposition.mjs",
  "tools/architecture/verify-migration-proof.mjs",
  "tests/contract/deletion-proof.test.mjs",
  "tests/contract/test-disposition.test.mjs",
  "docs/architecture/test-disposition.tsv",
]);
const TASK_ONLY_PROOF_REF = "tools/architecture/inventory.mjs#task-only-governance";
const TASK_ONLY_AUTHORIZATION_REF = "specs/workflowhub-complexity-governance-v2/tasks.md#T054";
const TASK_ONLY_REVERSE_REFERENCE_ROOTS = Object.freeze([
  "core/",
  "runtime/",
  "scripts/",
  "skills/",
  "workflows/",
  "tools/",
]);

const ZERO_GATES = Object.freeze({
  "legacy-runtime": Object.freeze({
    // Immutable migration evidence may mention legacy; every other delivery path
    // and all runtime code must be legacy-free after T016.
    allowedPaths: Object.freeze(new Set([
      "docs/architecture/legacy-task-inventory.json",
      "docs/architecture/legacy-import-proof.json",
      "tests/contract/legacy-zero.test.mjs",
    ])),
    runtimeRoots: ["core/", "scripts/", "schemas/", "skills/", "workflows/"],
    forbiddenContent: /legacy-reader|legacy-import|normalizeLegacyTask|legacy-import-proof/,
  }),
  "task-only-governance": Object.freeze({
    taskOnlyPaths: TASK_ONLY_GOVERNANCE_PATHS,
  }),
});

export function zeroGateErrors(name, { root = ROOT, env = process.env } = {}) {
  const gate = ZERO_GATES[name];
  if (!gate) return [`unknown zero gate: ${name}`];

  // Unlike the legacy-runtime gate, this is an exact absence check.  It must
  // inspect the live filesystem so untracked leftovers cannot pass merely
  // because they are absent from `git ls-files`.
  if (name === "task-only-governance") {
    return gate.taskOnlyPaths
      .filter((path) => existsSync(resolve(root, path)))
      .map((path) => `task-only governance path still present: ${path}`);
  }

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

export function taskOnlyConsumerReferenceErrors({ root = ROOT, env = process.env } = {}) {
  const errors = [];
  const files = listDeliveryFiles({ root, env });
  for (const path of files) {
    if (!TASK_ONLY_REVERSE_REFERENCE_ROOTS.some((prefix) => path.startsWith(prefix))) continue;
    // This permanent checker names the retired paths only to reject them; it
    // is audit data, not a consumer of the deleted implementation.
    if (path === "tools/architecture/inventory.mjs") continue;
    const text = readFileSync(resolve(root, path), "utf8");
    for (const taskOnlyPath of TASK_ONLY_GOVERNANCE_PATHS) {
      if (text.includes(taskOnlyPath)) {
        errors.push(`task-only governance consumer remains: ${path} -> ${taskOnlyPath}`);
      }
    }
  }
  return errors;
}

function baselineContains({ root, env, commit, path }) {
  try {
    execFileSync("git", ["cat-file", "-e", `${commit}:${path}`], { cwd: root, env, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function listDeliveryFiles({ root = ROOT, env = process.env } = {}) {
  // Inventory is a release manifest: it describes only files Git will carry.
  // Scratch evidence and other untracked files are intentionally audited by
  // clean-install as a separate concern; they must never make the manifest
  // nondeterministic or look like deliverable source.
  return execFileSync("git", ["ls-files", "-z"], {
    cwd: root,
    env,
  })
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .filter((path) => existsSync(resolve(root, path)))
    .sort();
}

export function listUntrackedFiles({ root = ROOT, env = process.env } = {}) {
  return execFileSync("git", ["ls-files", "--others", "--exclude-standard", "-z"], {
    cwd: root,
    env,
  })
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .filter((path) => existsSync(resolve(root, path)))
    .sort();
}

export function trackedTreeHash({ root = ROOT, env = process.env, exclude = [], excludePath = null } = {}) {
  const excluded = new Set(exclude);
  const payload = listDeliveryFiles({ root, env })
    .filter((path) => !excluded.has(path) && !excludePath?.(path))
    .map((path) => `${path}\0${sha256(root, path)}\n`)
    .join("");
  return createHash("sha256").update(payload).digest("hex");
}

export function governanceTreeHash({ root = ROOT, env = process.env } = {}) {
  // Phase-9 evidence is immutable release evidence about this exact tree, not
  // source that the evidence is allowed to authenticate. Excluding the whole
  // archived evidence prefix prevents a stored snapshot/hash from changing
  // its own identity after Git adds the final packet.
  return trackedTreeHash({
    root,
    env,
    exclude: DERIVED_GOVERNANCE_FILES,
    excludePath: (path) => path.startsWith(PHASE9_EVIDENCE_PREFIX),
  });
}

function dispositionFor(path) {
  if (path.startsWith("specs/archive/")) return ["archive", "historical accepted design material"];
  if ([
    "docs/architecture/legacy-task-inventory.json",
    "docs/architecture/legacy-import-proof.json",
  ].includes(path)) return ["archive", "immutable migration audit evidence"];
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

export function validateTrackedTestDispositions(
  text = readFileSync(OUTPUT, "utf8"),
  { root = ROOT, env = process.env } = {},
) {
  const rows = new Map();
  for (const line of text.trimEnd().split("\n").slice(1)) {
    const [file, disposition] = line.split("\t");
    if (!file || !TEST_PATH.test(file)) continue;
    if (rows.has(file)) return [`tracked test has duplicate dispositions: ${file}`];
    rows.set(file, disposition);
  }
  const trackedTests = listDeliveryFiles({ root, env }).filter((file) => TEST_PATH.test(file));
  const errors = [];
  for (const file of trackedTests) {
    if (!rows.has(file)) errors.push(`tracked test has no disposition: ${file}`);
    else if (!DISPOSITIONS.has(rows.get(file))) errors.push(`tracked test has invalid disposition: ${file}`);
  }
  for (const file of rows.keys()) {
    if (!trackedTests.includes(file)) errors.push(`test disposition names a non-delivery file: ${file}`);
  }
  return errors;
}

export function validateDeletionProof({ root = ROOT, env = process.env } = {}) {
  const errors = [];
  const proofPath = resolve(root, DELETIONS_PROOF_PATH);
  if (!existsSync(proofPath)) return [`deletions proof is missing: ${DELETIONS_PROOF_PATH}`];
  let proof;
  try { proof = JSON.parse(readFileSync(proofPath, "utf8")); } catch { return ["deletions proof is not valid JSON"]; }
  if (proof?.schema_version !== "workflowhub-deletions-proof.v1") errors.push("deletions proof schema is invalid");
  if (!/^[a-f0-9]{40}$/.test(proof?.baseline?.commit ?? "") || !/^[a-f0-9]{40}$/.test(proof?.baseline?.tree ?? "")) {
    errors.push("deletions proof baseline identity is invalid");
  }
  const confirmation = proof?.user_confirmation;
  if (confirmation?.ref !== "docs/architecture/legacy-import-proof.json" || !existsSync(resolve(root, confirmation?.ref ?? ""))) {
    errors.push("deletions proof user confirmation reference is invalid");
  } else {
    try {
      if (JSON.parse(readFileSync(resolve(root, confirmation.ref), "utf8"))?.confirmation?.user_confirmed !== true) {
        errors.push("deletions proof user confirmation is not confirmed");
      }
    } catch { errors.push("deletions proof user confirmation is unreadable"); }
  }
  if (!Array.isArray(proof?.deletions) || proof.deletions.length === 0) {
    errors.push("deletions proof must contain deletions");
    return errors;
  }
  const seen = new Set();
  const delivery = new Set(listDeliveryFiles({ root, env }));
  const taskOnlyProofPaths = new Set();
  for (const [index, entry] of proof.deletions.entries()) {
    const label = `deletions proof entry ${index + 1}`;
    if (!entry || typeof entry.path !== "string" || !entry.path || seen.has(entry.path)) {
      errors.push(`${label} path is invalid or duplicated`);
      continue;
    }
    seen.add(entry.path);
    if (entry.absent !== true || existsSync(resolve(root, entry.path)) || delivery.has(entry.path)) {
      errors.push(`${label} path is not absent: ${entry.path}`);
    }
    if (typeof entry.replacement_oracle !== "string" || !existsSync(resolve(root, entry.replacement_oracle))) {
      errors.push(`${label} replacement oracle is missing`);
    }
    if (TASK_ONLY_GOVERNANCE_PATHS.includes(entry.path)) {
      taskOnlyProofPaths.add(entry.path);
      if (!baselineContains({ root, env, commit: proof.baseline.commit, path: entry.path })) {
        errors.push(`${label} is absent from the declared historical baseline`);
      }
      if (entry.consumer_zero_ref !== TASK_ONLY_PROOF_REF) {
        errors.push(`${label} must cite the task-only live-zero audit`);
      }
      if (entry.reverse_reference_count !== 0) {
        errors.push(`${label} reverse-reference count must be zero`);
      }
      if (entry.authorization_ref !== TASK_ONLY_AUTHORIZATION_REF) {
        errors.push(`${label} must cite the T054 deletion authorization`);
      }
    } else if (entry.consumer_zero_ref !== "docs/architecture/complexity-baseline.json#/hard_gates/dedicated_recovery_state") {
      errors.push(`${label} must cite the precise hard-zero audit`);
    }
  }
  for (const path of TASK_ONLY_GOVERNANCE_PATHS) {
    if (!taskOnlyProofPaths.has(path)) errors.push(`deletions proof lacks task-only entry: ${path}`);
  }
  errors.push(...taskOnlyConsumerReferenceErrors({ root, env }));
  return errors;
}

function main() {
  const check = process.argv.includes("--check");
  if (check) {
    const expected = renderInventory();
    const actual = readFileSync(OUTPUT, "utf8");
    const errors = validateInventory(actual);
    errors.push(...validateTrackedTestDispositions(actual));
    errors.push(...validateDeletionProof());
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
