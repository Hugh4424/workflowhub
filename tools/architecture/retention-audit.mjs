import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { snapshot, verifyUnchanged } from "./history-inventory.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const HISTORY_INVENTORY = "docs/architecture/history-inventory.json";
const RETENTION_MANIFEST = "docs/architecture/retention-manifest.json";
const RUNTIME_ROOTS = Object.freeze(["core", "runtime", "scripts", "workflows", "skills", "config"]);
const HISTORY_PATHS = Object.freeze(["specs/archive/", "docs/architecture/legacy-"]);
const LEARNING = Object.freeze([
  { id: "M14a", refs: ["specs/archive/m14a-audit-contract-layer/"] },
  { id: "M14b", refs: ["specs/archive/m14b-fact-collection/", "specs/archive/m14b-fact-collection-g2/"] },
  { id: "M15", refs: ["specs/archive/multica-ZHI-102/", "specs/archive/multica-ZHI-831-v2/"] },
  { id: "M16", refs: ["specs/archive/m16*/", "docs/**/M16*"] },
  { id: "M17a", refs: ["specs/archive/m17a*/", "docs/**/M17a*"] },
  { id: "M17b", refs: ["specs/archive/m17b*/", "docs/**/M17b*"] },
]);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function walkFiles(root, relative = "") {
  const absolute = resolve(root, relative);
  if (!existsSync(absolute)) return [];
  if (lstatSync(absolute).isFile()) return [relative];
  return readdirSync(absolute).flatMap((name) => walkFiles(root, relative ? `${relative}/${name}` : name));
}

function learningEntry(root, entry) {
  const present = entry.refs.filter((ref) => ref.endsWith("/") && existsSync(resolve(root, ref.slice(0, -1))));
  if (present.length) return { id: entry.id, status: "present", refs: present };
  return { id: entry.id, status: "unknown", refs: entry.refs, reason: "no current locator matched; this is non-gating" };
}

export function discoverLearning({ root = ROOT } = {}) {
  return LEARNING.map((entry) => learningEntry(root, entry));
}

export function auditRuntimeHistoryReferences({ root = ROOT } = {}) {
  const findings = [];
  for (const directory of RUNTIME_ROOTS) {
    for (const path of walkFiles(root, directory)) {
      const text = readFileSync(resolve(root, path), "utf8");
      for (const marker of HISTORY_PATHS) if (text.includes(marker)) findings.push({ path, type: "historical_path_reference", marker });
      if (/\b(?:history-inventory\.json|retention-manifest\.json)\b/.test(text)) {
        findings.push({ path, type: "historical_inventory_reference" });
      }
      if (/\bdual[-_ ]write\b|\bdualWrite\b/i.test(text)) findings.push({ path, type: "dual_write_marker" });
      if (/\b(?:legacy|historical)(?:[-_ ](?:history|task|archive))?[-_ ]?(?:reader|importer)\b|\b(?:read|load|import)(?:Legacy|Historical)(?:History|Task|Archive)?\b/i.test(text)) {
        findings.push({ path, type: "legacy_reader_or_importer_marker" });
      }
    }
  }
  return findings;
}

export function auditRetention({ root = ROOT } = {}) {
  const errors = [];
  const historyPath = resolve(root, HISTORY_INVENTORY);
  const retentionPath = resolve(root, RETENTION_MANIFEST);
  let history;
  let retention;
  try { history = JSON.parse(readFileSync(historyPath, "utf8")); } catch (error) { errors.push(`history inventory unreadable: ${error.message}`); }
  try { retention = JSON.parse(readFileSync(retentionPath, "utf8")); } catch (error) { errors.push(`retention manifest unreadable: ${error.message}`); }
  if (history && retention) {
    const frozen = retention.frozen_sources?.history_inventory;
    if (frozen?.ref !== HISTORY_INVENTORY) errors.push("retention history_inventory ref is not frozen");
    else if (frozen.content_hash !== sha256(readFileSync(historyPath))) errors.push("retention history_inventory content hash drift");
  }
  for (const [index, entry] of (retention?.keep_until_migration ?? []).entries()) {
    for (const field of ["target", "slice", "owner", "publication_unit", "disposition", "planned_task", "proof", "close_condition"]) {
      if (typeof entry?.[field] !== "string" || entry[field].trim() === "") errors.push(`keep_until_migration[${index}] missing ${field}`);
    }
    if (entry?.disposition !== "KEEP_UNTIL_MIGRATION") errors.push(`keep_until_migration[${index}] disposition must be KEEP_UNTIL_MIGRATION`);
    if (entry?.proof !== "evidence/repair/r001-reconciliation.json") errors.push(`keep_until_migration[${index}] proof must bind R001 reconciliation`);
    if (typeof entry?.proof === "string" && (entry.proof.startsWith("/") || entry.proof.split("/").includes(".."))) {
      errors.push(`keep_until_migration[${index}] proof path is unsafe`);
    } else if (typeof entry?.proof === "string" && !existsSync(resolve(root, entry.proof))) {
      errors.push(`keep_until_migration[${index}] proof does not exist: ${entry.proof}`);
    }
  }
  const historyCheck = verifyUnchanged({ root });
  if (!historyCheck.ok) errors.push(...historyCheck.errors);
  const runtimeFindings = auditRuntimeHistoryReferences({ root });
  if (runtimeFindings.length) errors.push(...runtimeFindings.map((item) => `${item.type}: ${item.path}`));
  const learning = discoverLearning({ root });
  const current = snapshot({ root, baseline: history?.baseline_commit ?? null });
  return {
    schema_version: "workflowhub-retention-audit.v1",
    non_gating: true,
    history: { inventory_ref: HISTORY_INVENTORY, file_count: history?.file_count ?? null, current_file_count: current.file_count, unchanged: historyCheck.ok },
    learning,
    unknown_learning: learning.filter(({ status }) => status === "unknown").map(({ id }) => id),
    runtime_history_references: runtimeFindings,
    errors,
    content_hash: sha256(JSON.stringify({ historyCheck, learning, runtimeFindings, errors })),
  };
}

function main() {
  if (!process.argv.includes("--check")) throw new TypeError("usage: retention-audit.mjs --check");
  const result = auditRetention();
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
