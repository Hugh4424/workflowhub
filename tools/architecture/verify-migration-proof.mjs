#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  existsSync, lstatSync, readFileSync, readdirSync, readlinkSync, realpathSync,
} from "node:fs";
import { createRequire } from "node:module";
import { basename, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const CASES = Object.freeze({
  supported: "legacy-supported.json",
  idempotent: "legacy-supported.json",
  "missing-identity": "legacy-missing-identity.json",
  "hash-conflict": "legacy-hash-conflict.json",
  "current-conflict": "legacy-current-conflict.json",
  "unknown-source": "legacy-unknown-source.json",
});
const DISPOSITIONS = new Set(["import", "archive", "reject"]);
export const GREEN_PROOF_CONTRACT = Object.freeze({
  schema_version: "workflowhub-legacy-migration-green-proof.v1",
  binds: Object.freeze([
    "inventory_payload_sha256",
    "source_aggregate_sha256",
    "all_project_task_stable_ids",
    "one_user_confirmed_disposition_per_item",
    "post_action_receipts",
  ]),
  required_result: "legacy-source-zero-with-source-aggregate-unchanged",
});
const LOCATOR_SALT = "workflowhub-legacy-inventory:v1";
const DEFAULT_TASKS_ROOT = "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks";
const INVENTORY_PATH = "docs/architecture/legacy-task-inventory.json";
const PROOF_PATH = "docs/architecture/legacy-import-proof.json";

function sha256(raw) { return createHash("sha256").update(raw).digest("hex"); }
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
function args(argv) {
  const out = {};
  for (const arg of argv) {
    const [key, value] = arg.includes("=") ? arg.split("=", 2) : [arg, true];
    if (!key.startsWith("--")) throw new TypeError(`invalid argument: ${arg}`);
    out[key.slice(2)] = value;
  }
  return out;
}
function aggregate(items, key) {
  return sha256(`${canonical(items.map((item) => ({
    project: item.project, task_id: item.task_id, locator_hash: item.locator_hash, manifest: item[key],
  })))}\n`);
}
function assertHash(value, label) {
  if (!/^[a-f0-9]{64}$/.test(value ?? "")) throw new Error(`${label} is invalid`);
}
function stableId(item) { return `${item.project}\0${item.task_id}`; }

// Task-only inline scanner: mirrors core/legacy-reader.mjs manifest/locator rules so the
// verifier still runs after the legacy reader/importer scaffolding is deleted in T016.
function filesBelow(root, current = root) {
  const out = [];
  for (const name of readdirSync(current).sort()) {
    const path = join(current, name);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) out.push({ path, link: readlinkSync(path) });
    else if (stat.isDirectory()) out.push(...filesBelow(root, path));
    else if (stat.isFile()) out.push({ path });
  }
  return out;
}
function directoryManifest(taskPath) {
  const entries = filesBelow(taskPath).map(({ path, link }) => {
    if (link !== undefined) {
      return { ref: relative(taskPath, path), kind: "symlink", sha256: sha256(link), bytes: Buffer.byteLength(link) };
    }
    const raw = readFileSync(path);
    return { ref: relative(taskPath, path), kind: "file", sha256: sha256(raw), bytes: raw.byteLength };
  });
  return Object.freeze({
    file_count: entries.length,
    content_sha256: sha256(`${JSON.stringify(entries)}\n`),
  });
}
export function currentTreeItems(tasksRoot) {
  const root = realpathSync(tasksRoot);
  const items = [];
  for (const name of readdirSync(root).sort()) {
    const taskPath = join(root, name);
    if (!lstatSync(taskPath).isDirectory()) continue;
    let project = "unknown";
    let taskId = name;
    const manifestPath = join(taskPath, "task.json");
    if (existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
        if (typeof manifest.project_name === "string" && manifest.project_name !== "") project = manifest.project_name;
        if (typeof manifest.task_id === "string" && manifest.task_id === basename(taskPath)) taskId = manifest.task_id;
      } catch { /* unreadable identity falls back to directory name and fails closed downstream */ }
    }
    items.push(Object.freeze({
      project,
      task_id: taskId,
      locator_hash: sha256(`${LOCATOR_SALT}\0${realpathSync(taskPath)}`),
      manifest: directoryManifest(taskPath),
    }));
  }
  return Object.freeze(items);
}
function aggregateTree(items) {
  return sha256(`${canonical(items.map((item) => ({
    project: item.project, task_id: item.task_id, locator_hash: item.locator_hash, manifest: item.manifest,
  })))}\n`);
}

export function validateMigrationProof(proof, inventory) {
  if (proof?.schema_version !== GREEN_PROOF_CONTRACT.schema_version) {
    throw new Error("legacy migration green proof schema is invalid");
  }
  if (proof.result !== GREEN_PROOF_CONTRACT.required_result) {
    throw new Error("legacy migration green proof result is invalid");
  }
  if (proof.inventory_payload_sha256 !== inventory.receipt.inventory_payload_sha256
      || proof.inventory_source_aggregate_sha256 !== inventory.receipt.source_before_aggregate) {
    throw new Error("legacy migration green proof does not bind the frozen inventory");
  }
  assertHash(proof.frozen_source_aggregate_sha256, "legacy frozen source aggregate");
  const confirmation = proof.confirmation;
  if (confirmation?.user_confirmed !== true
      || typeof confirmation.confirmed_by !== "string" || confirmation.confirmed_by === ""
      || typeof confirmation.decision !== "string" || confirmation.decision === "") {
    throw new Error("legacy migration green proof user confirmation is invalid");
  }
  const inventoryIds = new Set(inventory.items.map(stableId));
  if (!Array.isArray(proof.stable_ids) || proof.stable_ids.length !== inventory.items.length
      || new Set(proof.stable_ids).size !== inventory.items.length
      || !proof.stable_ids.every((id) => inventoryIds.has(id))) {
    throw new Error("legacy migration green proof stable ids do not cover the inventory");
  }
  if (!Array.isArray(proof.in_progress_items)
      || !proof.in_progress_items.every((id) => inventoryIds.has(id))) {
    throw new Error("legacy migration green proof in-progress items are invalid");
  }
  if (!Array.isArray(proof.dispositions) || proof.dispositions.length !== inventory.items.length) {
    throw new Error("legacy migration green proof dispositions are incomplete");
  }
  const byLocator = new Map(inventory.items.map((item) => [item.locator_hash, item]));
  const seen = new Set();
  for (const entry of proof.dispositions) {
    const item = byLocator.get(entry?.locator_hash);
    if (!item || seen.has(entry.locator_hash)) {
      throw new Error("legacy migration green proof disposition locator is unknown or duplicated");
    }
    seen.add(entry.locator_hash);
    if (entry.project !== item.project || entry.task_id !== item.task_id
        || entry.disposition !== item.proposed_disposition || entry.user_confirmed !== true) {
      throw new Error(`legacy disposition for ${item.task_id} does not match the confirmed inventory`);
    }
    const manifest = entry.source_manifest;
    if (!Number.isInteger(manifest?.file_count) || manifest.file_count < 0) {
      throw new Error(`legacy disposition for ${item.task_id} has an invalid manifest count`);
    }
    assertHash(manifest?.content_sha256, `legacy disposition ${item.task_id} manifest hash`);
    const receipts = entry.post_action_receipts;
    if (!receipts || typeof receipts !== "object" || typeof receipts.action !== "string"
        || receipts.source_untouched !== true) {
      throw new Error(`legacy disposition for ${item.task_id} has invalid post-action receipts`);
    }
    if (entry.disposition === "import") {
      assertHash(receipts.identity_manifest_sha256, `legacy import ${item.task_id} identity hash`);
    } else if (entry.disposition === "archive") {
      assertHash(receipts.closure_evidence_sha256, `legacy archive ${item.task_id} closure hash`);
    } else if (typeof receipts.reason !== "string" || receipts.reason === "") {
      throw new Error(`legacy reject disposition for ${item.task_id} is missing its reason`);
    }
  }
  return Object.freeze({
    dispositions: proof.dispositions.length,
    frozen_source_aggregate_sha256: proof.frozen_source_aggregate_sha256,
    proof_sha256: sha256(`${canonical(proof)}\n`),
  });
}

function verifyCurrentTree(proof, tasksRoot) {
  const items = currentTreeItems(tasksRoot);
  const proofLocators = new Set(proof.dispositions.map((entry) => entry.locator_hash));
  const currentLocators = new Set(items.map((item) => item.locator_hash));
  if (proofLocators.size !== currentLocators.size
      || ![...proofLocators].every((locator) => currentLocators.has(locator))) {
    throw new Error("legacy source tree locator set changed after the frozen proof");
  }
  const excluded = new Set(proof.in_progress_items);
  for (const id of excluded) {
    if (!items.some((item) => stableId(item) === id)) {
      throw new Error(`legacy in-progress task is missing from the source tree: ${id}`);
    }
  }
  const frozen = items.filter((item) => !excluded.has(stableId(item)));
  const actual = aggregateTree(frozen);
  if (actual !== proof.frozen_source_aggregate_sha256) {
    throw new Error("legacy source tree changed after the frozen proof (in-progress tasks excluded)");
  }
  return Object.freeze({ current_tree_items: items.length, excluded_in_progress: excluded.size });
}

export function validateLegacyInventory(inventory) {
  if (inventory?.schema_version !== "workflowhub-legacy-task-inventory.v2"
      || !Array.isArray(inventory.items) || inventory.items.length === 0
      || inventory.task_count !== inventory.items.length
      || inventory.user_confirmation !== "pending") {
    throw new Error("legacy inventory schema or count is invalid");
  }
  const stableIds = new Set();
  for (const item of inventory.items) {
    for (const field of [
      "project", "task_id", "source_schema", "execution_mode", "record_model",
      "material_current", "classification", "classification_reason", "active_criterion",
    ]) if (typeof item[field] !== "string" || item[field] === "") throw new Error(`legacy inventory item ${field} is invalid`);
    if (typeof item.active !== "boolean" || !DISPOSITIONS.has(item.proposed_disposition)
        || item.locator_scheme !== "salted-sha256:v1" || item.source_unchanged !== true) {
      throw new Error("legacy inventory item contract is invalid");
    }
    assertHash(item.locator_hash, "legacy inventory locator hash");
    const id = `${item.project}\0${item.task_id}`;
    if (stableIds.has(id)) throw new Error("legacy inventory stable identity is duplicated");
    stableIds.add(id);
    for (const key of ["source_manifest_before", "source_manifest_after"]) {
      const manifest = item[key];
      if (!Number.isInteger(manifest?.file_count) || manifest.file_count < 0) throw new Error("legacy manifest count is invalid");
      assertHash(manifest?.content_sha256, "legacy manifest hash");
    }
    if (canonical(item.source_manifest_before) !== canonical(item.source_manifest_after)) {
      throw new Error("legacy task source changed during inventory");
    }
  }
  const actualCounts = Object.fromEntries([...new Set(inventory.items.map((item) => item.classification))]
    .sort().map((name) => [name, inventory.items.filter((item) => item.classification === name).length]));
  if (canonical(actualCounts) !== canonical(inventory.counts)
      || inventory.active_count !== inventory.items.filter((item) => item.active).length) {
    throw new Error("legacy inventory aggregate counts are invalid");
  }
  const { receipt, ...payload } = inventory;
  if (receipt?.schema_version !== "workflowhub-legacy-inventory-receipt.v1"
      || receipt.item_count !== inventory.items.length || receipt.read_only !== true
      || receipt.contents_redacted !== true
      || receipt.source_root_identity?.locator_scheme !== "salted-sha256:v1") {
    throw new Error("legacy inventory receipt is invalid");
  }
  for (const [value, label] of [
    [receipt.source_root_identity.locator_hash, "legacy source root hash"],
    [receipt.source_before_aggregate, "legacy before aggregate"],
    [receipt.source_after_aggregate, "legacy after aggregate"],
    [receipt.inventory_payload_sha256, "legacy inventory payload hash"],
  ]) assertHash(value, label);
  const before = aggregate(inventory.items, "source_manifest_before");
  const after = aggregate(inventory.items, "source_manifest_after");
  if (before !== after || before !== receipt.source_before_aggregate || after !== receipt.source_after_aggregate
      || sha256(`${canonical(payload)}\n`) !== receipt.inventory_payload_sha256) {
    throw new Error("legacy inventory receipt does not bind the current inventory");
  }
  return Object.freeze({
    item_count: inventory.items.length,
    inventory_payload_sha256: receipt.inventory_payload_sha256,
    source_aggregate_sha256: before,
  });
}

export function verifyMigrationProof(values) {
  const requested = String(values["require-cases"] ?? "").split(",").filter(Boolean);
  for (const name of requested) if (!CASES[name]) throw new Error(`unknown migration proof case: ${name}`);
  if (requested.length > 0) {
    // Fixture cases exist only while the task-only importer scaffolding is present (T015/T016);
    // after same-phase deletion the gate runs without cases and must not touch the importer.
    const require = createRequire(import.meta.url);
    const { normalizeLegacyTask } = require("../migrations/import-legacy-task.mjs");
    const fixture = (name) => JSON.parse(readFileSync(resolve("tests/fixtures", CASES[name]), "utf8"));
    for (const name of requested) {
      if (name === "supported") normalizeLegacyTask(fixture(name));
      else if (name === "idempotent") {
        const first = normalizeLegacyTask(fixture(name));
        const second = normalizeLegacyTask(fixture(name));
        if (JSON.stringify(first) !== JSON.stringify(second)) throw new Error("legacy import is not idempotent");
      } else {
        let rejected = false;
        try { normalizeLegacyTask(fixture(name)); } catch { rejected = true; }
        if (!rejected) throw new Error(`legacy bad case did not fail: ${name}`);
      }
    }
  }
  const inventory = JSON.parse(readFileSync(resolve(INVENTORY_PATH), "utf8"));
  const validation = validateLegacyInventory(inventory);
  if (values["require-real-task-inventory"] && validation.item_count === 0) throw new Error("real task inventory is missing");
  const proofPath = resolve(typeof values.proof === "string" ? values.proof : PROOF_PATH);
  let proofSummary;
  if (values["phase-gate"]) {
    if (!existsSync(proofPath)) {
      const error = new Error(
        `LEGACY_MIGRATION_INCOMPLETE: ${GREEN_PROOF_CONTRACT.schema_version} is pending for ${validation.inventory_payload_sha256}`,
      );
      error.code = "LEGACY_MIGRATION_INCOMPLETE";
      throw error;
    }
    const proof = JSON.parse(readFileSync(proofPath, "utf8"));
    proofSummary = validateMigrationProof(proof, inventory);
    if (values["require-current-tree"]) {
      const tasksRoot = resolve(typeof values["tasks-root"] === "string" ? values["tasks-root"] : DEFAULT_TASKS_ROOT);
      proofSummary = Object.freeze({ ...proofSummary, ...verifyCurrentTree(proof, tasksRoot) });
    }
  } else if (values["require-current-tree"]) {
    throw new Error("--require-current-tree requires --phase-gate with a frozen green proof");
  }
  return { status: "verified", cases: requested, ...validation, ...(proofSummary ? { proof: proofSummary } : {}) };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.stdout.write(`${JSON.stringify(verifyMigrationProof(args(process.argv.slice(2))), null, 2)}\n`); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
