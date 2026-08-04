import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateInventory } from "./inventory.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const PLAN = "docs/architecture/deletion-plan.json";
const RETENTION = "docs/architecture/retention-manifest.json";
const MOVE_MAP = "docs/architecture/move-map.json";
const HISTORY = "docs/architecture/history-inventory.json";
const SLICES = new Set(["topology", "recovery", "pointer", "phase", "review", "journal", "projection"]);

const sliceFor = (id) => ({
  "DEL-01": "review", "DEL-02": "phase", "DEL-03": "pointer", "DEL-04": "recovery", "DEL-05": "recovery",
  "DEL-06": "recovery", "DEL-07": "recovery", "DEL-08": "recovery", "DEL-09": "projection", "DEL-10": "journal",
  "DEL-11": "pointer", "DEL-12": "topology",
}[id] ?? null);

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function validateDeletionDisposition({ root = ROOT } = {}) {
  const errors = [];
  let plan;
  try { plan = JSON.parse(readFileSync(resolve(root, PLAN), "utf8")); }
  catch (error) { return [`cannot read ${PLAN}: ${error.message}`]; }
  if (plan?.schema_version !== "workflowhub-deletion-plan.v1") errors.push("deletion plan schema is invalid");
  if (!Array.isArray(plan?.candidates) || plan.candidates.length === 0) errors.push("deletion plan candidates are required");
  const seen = new Set();
  for (const [index, entry] of (plan.candidates ?? []).entries()) {
    const label = `deletion candidate ${index + 1}`;
    if (!entry?.id || seen.has(entry.id)) errors.push(`${label} id is missing or duplicated`);
    seen.add(entry?.id);
    if (!Array.isArray(entry.candidatePaths) || entry.candidatePaths.length === 0) errors.push(`${label} paths are required`);
    if (!["KEEP", "DELETE AFTER PROOF", "MOVE AFTER PROOF"].includes(entry.decision)) errors.push(`${label} decision is invalid`);
    if (entry.decision !== "KEEP" && entry.agentDecision?.status !== "proof_verified") errors.push(`${label} lacks proof_verified disposition`);
  }
  for (const path of [RETENTION, MOVE_MAP]) if (!existsSync(resolve(root, path))) errors.push(`required governance manifest missing: ${path}`);
  if (!existsSync(resolve(root, HISTORY))) errors.push(`required governance manifest missing: ${HISTORY}`);
  if (existsSync(resolve(root, RETENTION))) {
    let retention;
    try { retention = JSON.parse(readFileSync(resolve(root, RETENTION), "utf8")); } catch (error) { errors.push(`retention manifest is invalid: ${error.message}`); }
    const frozen = retention?.frozen_sources ?? {};
    for (const [key, expected] of [["deletion_plan", PLAN], ["history_inventory", HISTORY], ["move_map", MOVE_MAP]]) {
      const entry = frozen[key];
      if (entry?.ref !== expected) errors.push(`retention ${key} ref is not frozen`);
      else if (entry.content_hash !== sha256File(resolve(root, expected))) errors.push(`retention ${key} content hash drift`);
    }
  }
  return errors;
}

export function validatePhase0Governance({ root = ROOT } = {}) {
  const errors = validateDeletionDisposition({ root });
  const inventoryPath = resolve(root, "docs/architecture/repository-inventory.tsv");
  if (existsSync(inventoryPath)) errors.push(...validateInventory(readFileSync(inventoryPath, "utf8"), { root }));
  return errors;
}

function main() {
  if (!process.argv.includes("--check")) throw new TypeError("usage: phase0-deletion-disposition.mjs --check [--slice=<slice,...>]");
  const sliceArg = process.argv.find((arg) => arg.startsWith("--slice="));
  const slices = sliceArg ? sliceArg.slice("--slice=".length).split(",").filter(Boolean) : [];
  const errors = validatePhase0Governance();
  for (const slice of slices) if (!SLICES.has(slice)) errors.push(`unknown deletion slice: ${slice}`);
  if (slices.length) {
    const plan = JSON.parse(readFileSync(resolve(ROOT, PLAN), "utf8"));
    for (const slice of slices) {
      const matches = plan.candidates.filter((entry) => sliceFor(entry.id) === slice);
      if (matches.length === 0) errors.push(`deletion slice has no frozen candidates: ${slice}`);
      if (matches.some((entry) => entry.decision !== "KEEP" && entry.agentDecision?.status !== "proof_verified")) errors.push(`deletion slice lacks proof disposition: ${slice}`);
    }
  }
  if (errors.length) { for (const error of errors) console.error(error); process.exitCode = 1; return; }
  console.log("deletion disposition and Phase 0 governance manifests are valid");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
