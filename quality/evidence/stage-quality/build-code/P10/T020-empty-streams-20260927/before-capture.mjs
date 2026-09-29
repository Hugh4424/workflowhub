import { createHash, randomUUID } from "node:crypto";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createCanonicalReceiptWriter } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { capturePreExecutionTaskChangeScope, captureTaskChangeScope, taskWorkspaceMatches } from "./change-scope.mjs";
import { readCurrentTestAssetRegistry } from "./test-asset-inventory.mjs";
import { selectAffectedCases } from "./case-selection.mjs";

const quote = (value) => `'${value.replaceAll("'", `'\\''`)}'`;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const FIXED_TARGETED_CAPTURE_COMMAND = `WORKFLOWHUB_TARGETED_INHERIT_GROUP=1 ${quote(process.execPath)} ${quote(fileURLToPath(new URL("./targeted-capture.mjs", import.meta.url)))}`;

function readCatalog(workspace) {
  const path = resolve(workspace.worktreeRoot, "docs/quality/business-case-catalog.json");
  if (realpathSync(path) !== path || !statSync(path).isFile()) throw new Error("business catalog path is unsafe");
  const raw = readFileSync(path);
  const value = JSON.parse(raw);
  return { value, sha256: sha256(raw) };
}

function sameSource(pre, post) {
  return pre.status === "recorded" && post.status === "recorded"
    && ["task_id", "start_commit", "start_tree", "snapshot_head", "snapshot_commit", "snapshot_tree", "source_digest"]
      .every((key) => pre[key] === post[key])
    && JSON.stringify(pre.changed_paths) === JSON.stringify(post.changed_paths);
}

function readFailedTargetedOutput({ task, receipt, selection, pre, materialRevision,
  catalogSha256, registrySha256 }) {
  const output = task.readRecord(receipt.output_ref);
  if (sha256(output) !== receipt.output_hash) throw new Error("failed targeted outer output hash mismatch");
  let failure;
  try { failure = JSON.parse(output.trim()); }
  catch { return null; }
  if (failure?.status !== "unavailable" || !Array.isArray(failure.reports)) return null;
  if (failure.task_id !== task.identity.taskId || failure.snapshot_tree !== pre.snapshot_tree
      || failure.source_digest !== pre.source_digest || failure.material_revision !== materialRevision
      || failure.catalog_sha256 !== catalogSha256 || failure.registry_sha256 !== registrySha256
      || typeof failure.run_id !== "string" || !/^[0-9a-f-]{36}$/.test(failure.run_id)
      || JSON.stringify(failure.selected_case_ids) !== JSON.stringify(selection.cases.map((item) => item.id))
      || JSON.stringify(failure.unmapped_changed_paths ?? [])
        !== JSON.stringify(selection.unmapped_changed_paths ?? [])
      || failure.reports.length === 0 || failure.reports.length > selection.cases.length
      || failure.business_effect_status !== "unknown") {
    throw new Error("failed targeted child output identity is invalid");
  }
  for (const [index, report] of failure.reports.entries()) {
    const selected = selection.cases[index];
    const last = index === failure.reports.length - 1;
    if (report.case_id !== selected.id || report.target !== selected.execution.target
        || report.status !== (last ? "failed" : "passed")
        || typeof report.record_ref !== "string" || typeof report.raw_ref !== "string"
        || typeof report.stderr_ref !== "string"
        || !/^[a-f0-9]{64}$/.test(report.record_hash ?? "")
        || !/^[a-f0-9]{64}$/.test(report.raw_sha256 ?? "")
        || !/^[a-f0-9]{64}$/.test(report.stderr_sha256 ?? "")
        || report.record_ref !== `quality/evidence/build-code-targeted/case-${report.record_hash}.json`
        || report.raw_ref !== `quality/evidence/build-code-targeted/raw-${report.raw_sha256}.txt`
        || report.stderr_ref !== `quality/evidence/build-code-targeted/raw-${report.stderr_sha256}.txt`
        || !Array.isArray(report.argv)) throw new Error("failed targeted case binding is invalid");
    const recordRaw = task.readRecord(report.record_ref);
    const raw = task.readRecord(report.raw_ref);
    const stderr = task.readRecord(report.stderr_ref);
    if (sha256(recordRaw) !== report.record_hash || sha256(raw) !== report.raw_sha256
        || sha256(stderr) !== report.stderr_sha256) throw new Error("failed targeted case bytes differ");
    const record = JSON.parse(recordRaw);
    if (record.schema_version !== "workflowhub-targeted-case-execution.v1"
        || record.run_id !== failure.run_id || record.task_id !== task.identity.taskId
        || record.snapshot_tree !== pre.snapshot_tree || record.material_revision !== materialRevision
        || record.case_id !== selected.id || record.target !== selected.execution.target
        || record.raw_output_ref !== report.raw_ref || record.raw_output_sha256 !== report.raw_sha256
        || record.exit_code !== report.exit_code || record.canonical_receipt !== false
        || JSON.stringify(record.registered_test_ids) !== JSON.stringify(selected.execution.registered_test_ids)
        || JSON.stringify(record.argv) !== JSON.stringify(report.argv)
        || !Array.isArray(record.observations)
        || (!last && (report.exit_code !== 0 || record.observations.some((item) => item.status !== "passed")))) {
      throw new Error("failed targeted case record identity is invalid");
    }
  }
  return failure;
}

/** Recheck reporter semantics from bytes, not the child's self-reported rows. */
export function verifyFixedTargetedReporter({ workspaceRoot, selection, manifest, rawReports, aggregateRaw } = {}) {
  if (!Array.isArray(selection?.cases) || selection.cases.length === 0
      || !Array.isArray(manifest?.reports)
      || !Array.isArray(rawReports)
      || manifest.reports.length !== selection.cases.length
      || rawReports.length !== selection.cases.length
      || typeof aggregateRaw !== "string"
      || aggregateRaw !== rawReports.join("\n")
      || sha256(aggregateRaw) !== manifest.execution?.raw_output_sha256) {
    throw new Error("targeted aggregate does not equal the ordered per-target reporter bytes");
  }
  for (const [index, selected] of selection.cases.entries()) {
    const declaration = manifest.reports[index];
    const raw = rawReports[index];
    const expected = selected.execution?.registered_test_ids;
    if (declaration?.case_id !== selected.id || declaration.target !== selected.execution?.target
        || declaration.exit_code !== 0 || typeof raw !== "string"
        || sha256(raw) !== declaration.raw_sha256
        || !Array.isArray(expected) || expected.length === 0
        || new Set(expected).size !== expected.length) {
      throw new Error("targeted per-case reporter binding is invalid");
    }
    let report;
    try { report = JSON.parse(raw.trim()); }
    catch { throw new Error("targeted reporter is not one JSON document"); }
    const file = report?.testResults?.[0];
    const assertions = file?.assertionResults;
    if (!Array.isArray(report?.testResults) || report.testResults.length !== 1
        || file.name !== resolve(workspaceRoot, selected.execution.target)
        || !Array.isArray(assertions) || assertions.length !== expected.length
        || report.numTotalTests !== assertions.length
        || report.numPassedTests !== assertions.length
        || report.numFailedTests !== 0 || report.numPendingTests !== 0
        || report.numTodoTests !== 0 || report.numTotalTestSuites !== 1
        || report.numPassedTestSuites !== 1 || report.numFailedTestSuites !== 0
        || report.success !== true || file.status !== "passed") {
      throw new Error("targeted reporter file, leaf count, status, or totals disagree");
    }
    const actualIds = [];
    for (const assertion of assertions) {
      if (!Array.isArray(assertion?.ancestorTitles)
          || assertion.ancestorTitles.some((name) => typeof name !== "string" || !name.trim())
          || typeof assertion.title !== "string" || !assertion.title.trim()
          || assertion.fullName !== [...assertion.ancestorTitles, assertion.title].join(" ")
          || assertion.status !== "passed") {
        throw new Error("targeted reporter contains an invalid or nonpassing leaf");
      }
      actualIds.push([selected.execution.target, ...assertion.ancestorTitles, assertion.title].join(" > "));
    }
    if (new Set(actualIds).size !== actualIds.length
        || actualIds.some((id) => !expected.includes(id))
        || expected.some((id) => !actualIds.includes(id))
        || JSON.stringify(declaration.full_ids) !== JSON.stringify(actualIds)) {
      throw new Error("targeted reporter leaf identities differ from the registered set");
    }
    const observed = manifest.observations?.filter((row) => row.case_id === selected.id);
    if (!Array.isArray(observed) || observed.length !== actualIds.length
        || observed.some((row) => row.status !== "passed" || row.exit_code !== 0
          || row.raw_report_sha256 !== declaration.raw_sha256)
        || JSON.stringify(observed.map((row) => row.full_id)) !== JSON.stringify(actualIds)) {
      throw new Error("targeted reporter leaves differ from the child's observations");
    }
  }
  return true;
}

async function runFixedTargetedCapture(receiptRef, { workspace, task, now, timeoutMs, outputRef, registeredTestIds }) {
  if (!/^quality\/tests\/[A-Za-z0-9._/-]+\.json$/.test(receiptRef ?? "")
      || outputRef !== undefined || registeredTestIds !== undefined) {
    throw new Error("fixed targeted capture requires a canonical request ref and owns its fresh output ref");
  }
  const pre = capturePreExecutionTaskChangeScope({ task, workspace });
  if (pre.status !== "recorded") return Object.freeze({ change_scope: pre,
    targeted_capture: { status: "unavailable", reason: pre.reason ?? "unknown_change_scope" } });
  const kernel = createTaskKernel(task, { workspace });
  const materialRevision = kernel.currentVNextMaterialRevision();
  let registry, catalog;
  try {
    registry = readCurrentTestAssetRegistry({ task, workspace });
    catalog = readCatalog(workspace);
  } catch (error) {
    return Object.freeze({ change_scope: pre,
      targeted_capture: { status: "unavailable", reason: error.message }, exit_code: 1 });
  }
  const selection = selectAffectedCases({ changeScope: pre, catalog: catalog.value,
    registry: { ...registry, task_id: task.identity.taskId,
      snapshot_tree: pre.snapshot_tree, source_digest: pre.source_digest } });
  const partial = selection.status === "unavailable" && selection.reason === "unmapped_changed_path"
    && selection.cases.length > 0 && selection.unmapped_changed_paths?.length > 0;
  if (selection.status !== "selected" && !partial) return Object.freeze({ change_scope: pre,
    targeted_capture: { status: "unavailable", reason: selection.reason }, exit_code: 1 });
  const runId = randomUUID();
  const freshRef = `quality/tests/targeted/${runId}.json`;
  const freshOutputRef = `quality/tests/output/targeted-${runId}.output`;
  const behaviorFingerprint = { task_id: task.identity.taskId, snapshot_tree: pre.snapshot_tree,
    source_digest: pre.source_digest, material_revision: materialRevision,
    catalog_revision: catalog.value.revision, catalog_sha256: catalog.sha256,
    registry_revision: registry.revision, registry_sha256: registry.registry_sha256,
    run_id: runId };
  const receipt = await createCanonicalReceiptWriter({ task, workspace, stage: "build-code",
    component: "build-code-test-capture", now }).captureTests({ command: FIXED_TARGETED_CAPTURE_COMMAND,
    receiptRef: freshRef, outputRef: freshOutputRef, behaviorFingerprint,
    ...(timeoutMs === undefined ? {} : { timeoutMs }) });
  const post = captureTaskChangeScope({ task, workspace, receipt });
  if (!sameSource(pre, post) || kernel.currentVNextMaterialRevision() !== materialRevision
      || readCurrentTestAssetRegistry({ task, workspace }).registry_sha256 !== registry.registry_sha256
      || readCatalog(workspace).sha256 !== catalog.sha256) {
    throw new Error("fixed targeted capture source, material, registry, or catalog changed during execution");
  }
  if (receipt.dispatch_state === "reused" || receipt.receipt_ref !== freshRef
      || receipt.behavior_fingerprint?.run_id !== runId) {
    return Object.freeze({ ...receipt, change_scope: post,
      targeted_capture: { status: "unavailable", reason: "reused_or_unbound_capture" } });
  }
  if (receipt.exit_code !== 0) {
    const failure = readFailedTargetedOutput({ task, receipt, selection, pre, materialRevision,
      catalogSha256: catalog.sha256, registrySha256: registry.registry_sha256 });
    return Object.freeze({ ...receipt, change_scope: post,
      targeted_capture: failure
        ? { status: "unavailable", reason: "targeted_test_failed", business_effect_status: "unknown",
          runner_reason: failure.reason, run_id: failure.run_id,
          selected_case_ids: failure.selected_case_ids,
          ...(partial ? { unmapped_changed_paths: selection.unmapped_changed_paths } : {}),
          failure_output_ref: receipt.output_ref, failure_output_sha256: receipt.output_hash,
          failure_reports: failure.reports }
        : { status: "unavailable", reason: "fixed_targeted_child_failed",
          ...(partial ? { selected_case_ids: selection.cases.map((entry) => entry.id),
            unmapped_changed_paths: selection.unmapped_changed_paths } : {}) } });
  }
  const output = task.readRecord(receipt.output_ref);
  if (sha256(output) !== receipt.output_hash) throw new Error("fixed targeted outer output hash mismatch");
  let pointer;
  try { pointer = JSON.parse(output.trim()); }
  catch { throw new Error("fixed targeted child output is not one JSON pointer"); }
  if (pointer?.schema_version !== "workflowhub-targeted-capture-pointer.v1"
      || pointer.task_id !== task.identity.taskId
      || pointer.snapshot_tree !== pre.snapshot_tree
      || pointer.material_revision !== materialRevision
      || typeof pointer.run_id !== "string" || !/^[a-f0-9]{64}$/.test(pointer.manifest_hash ?? "")) {
    throw new Error("fixed targeted child pointer identity is invalid");
  }
  const manifestRaw = task.readRecord(pointer.manifest_ref);
  if (sha256(manifestRaw) !== pointer.manifest_hash) throw new Error("fixed targeted child manifest hash mismatch");
  const manifest = JSON.parse(manifestRaw);
  if (manifest.schema_version !== "workflowhub-targeted-capture.v1"
      || manifest.run_id !== pointer.run_id || manifest.task_id !== task.identity.taskId
      || manifest.snapshot_tree !== pre.snapshot_tree || manifest.source_digest !== pre.source_digest
      || manifest.material_revision !== materialRevision
      || manifest.registry_sha256 !== registry.registry_sha256
      || manifest.catalog_sha256 !== catalog.sha256
      || manifest.selection_status !== selection.status
      || manifest.business_effect_status !== "unknown"
      || JSON.stringify(manifest.selected_case_ids) !== JSON.stringify(selection.cases.map((entry) => entry.id))
      || !Array.isArray(manifest.reports)
      || manifest.reports.length !== selection.cases.length
      || !Array.isArray(pointer.reports)
      || JSON.stringify(pointer.reports) !== JSON.stringify(manifest.reports.map(
        ({ case_id, target, record_ref, record_hash, raw_ref, raw_sha256, argv, exit_code, full_ids }) => ({
          case_id, target, record_ref, record_hash, raw_ref, raw_sha256, argv, exit_code, full_ids,
        })))
      || !Array.isArray(manifest.execution?.argv)
      || manifest.execution.argv.length !== selection.cases.length
      || manifest.execution.argv.some((argv, index) => !Array.isArray(argv)
        || !argv.includes(selection.cases[index].execution.target)
        || !argv.includes("--reporter=json"))
      || !Array.isArray(manifest.observations)
      || manifest.observations.length !== selection.cases.reduce((count, entry) =>
        count + entry.execution.registered_test_ids.length, 0)) {
    throw new Error("fixed targeted inner execution does not match authenticated inputs");
  }
  const raw = task.readRecord(manifest.execution.raw_output_ref);
  if (sha256(raw) !== manifest.execution.raw_output_sha256) {
    throw new Error("fixed targeted raw reporter ref/hash mismatch");
  }
  const rawReports = [];
  for (const [index, target] of manifest.reports.entries()) {
    const selected = selection.cases[index];
    if (target.case_id !== selected.id || target.target !== selected.execution.target
        || !/^[a-f0-9]{64}$/.test(target.record_hash ?? "")
        || target.exit_code !== 0
        || JSON.stringify(target.argv) !== JSON.stringify(manifest.execution.argv[index])
        || JSON.stringify(target.full_ids) !== JSON.stringify(selected.execution.registered_test_ids)) {
      throw new Error("fixed targeted per-case record identity is invalid");
    }
    const caseRaw = task.readRecord(target.record_ref);
    if (sha256(caseRaw) !== target.record_hash) throw new Error("fixed targeted per-case record hash mismatch");
    const record = JSON.parse(caseRaw);
    const report = task.readRecord(target.raw_ref);
    rawReports.push(report);
    if (record.schema_version !== "workflowhub-targeted-case-execution.v1"
        || record.run_id !== pointer.run_id || record.task_id !== task.identity.taskId
        || record.snapshot_tree !== pre.snapshot_tree || record.material_revision !== materialRevision
        || record.case_id !== selected.id || record.target !== selected.execution.target
        || record.canonical_receipt !== false || record.exit_code !== 0
        || JSON.stringify(record.registered_test_ids) !== JSON.stringify(selected.execution.registered_test_ids)
        || JSON.stringify(record.argv) !== JSON.stringify(manifest.execution.argv[index])
        || record.raw_output_ref !== target.raw_ref
        || record.raw_output_sha256 !== target.raw_sha256
        || sha256(report) !== target.raw_sha256
        || !Array.isArray(record.observations)
        || record.observations.length !== selected.execution.registered_test_ids.length
        || JSON.stringify(record.observations.map((row) => row.full_id)) !== JSON.stringify(target.full_ids)
        || record.observations.some((row) => row.case_id !== selected.id || row.status !== "passed"
          || row.exit_code !== 0 || row.raw_report_sha256 !== target.raw_sha256)
        || JSON.stringify(record.observations) !== JSON.stringify(manifest.observations.filter((row) => row.case_id === selected.id))) {
      throw new Error("fixed targeted per-case raw reporter is not bound to the selection");
    }
  }
  verifyFixedTargetedReporter({ workspaceRoot: workspace.worktreeRoot, selection,
    manifest, rawReports, aggregateRaw: raw });
  const completed = Object.freeze({ ...receipt, dispatch_state: "executed", change_scope: post,
    targeted_capture: { status: partial ? "unavailable" : "executed",
      ...(partial ? { reason: "unmapped_changed_path",
        unmapped_changed_paths: selection.unmapped_changed_paths } : {}),
      task_id: task.identity.taskId,
      snapshot_tree: pre.snapshot_tree, material_revision: materialRevision,
      run_id: pointer.run_id, selected_case_ids: manifest.selected_case_ids,
      manifest_ref: pointer.manifest_ref, manifest_hash: pointer.manifest_hash,
      raw_report_ref: manifest.execution.raw_output_ref,
      raw_report_sha256: manifest.execution.raw_output_sha256,
      reports: manifest.reports,
      business_effect_status: "unknown" } });
  // Only this invocation still holds the writer's fresh return value. The
  // independent reader deliberately treats the same immutable bytes as
  // historical when called later; do not persist or infer dispatch_state.
  const { reconcileCurrentTaskCases } = await import("./case-reconciliation.mjs");
  const readback = reconcileCurrentTaskCases({ task, workspace, capture: completed });
  if (readback.status !== "unavailable") {
    throw new Error("same-call case readback returned an unexpected status");
  }
  // A valid test receipt can still lack a valid business-case mapping. Keep
  // that rejection visible, without upgrading any entry to this call's run.
  if (readback.reason !== "current_execution_unverified") {
    return Object.freeze({ ...completed, case_reconciliation: readback });
  }
  if (readback.execution_freshness !== "unknown"
      || readback.receipt_ref !== receipt.receipt_ref
      || readback.manifest_ref !== pointer.manifest_ref
      || !Array.isArray(readback.entries) || readback.entries.length === 0) {
    throw new Error("same-call case readback did not authenticate the fresh targeted execution");
  }
  return Object.freeze({ ...completed, case_reconciliation: Object.freeze({
    ...readback, reason: "business_effect_unavailable", execution_freshness: "observed_now",
    parent_run_id: runId, child_run_id: pointer.run_id,
    entries: Object.freeze(readback.entries.map((entry) => Object.freeze({ ...entry,
      status: "observed_this_call" }))),
  }) });
}

// The local stage runner is only an outcome transport helper. Test receipts
// remain owned by this canonical capture writer.
/** Execute tests and publish an authority-bound canonical receipt. */
export async function runCapture(command, receiptRef, { workspace, task, outputRef, now, registeredTestIds, timeoutMs } = {}) {
  // The canonical writer authenticates each capability, but it does not pair
  // a TaskHandle with the caller's Workspace. Refuse a foreign pair before
  // it can publish a test receipt under the wrong task.
  if (!taskWorkspaceMatches({ task, workspace })) {
    return Object.freeze({ change_scope: captureTaskChangeScope({ task, workspace }) });
  }
  if (command === FIXED_TARGETED_CAPTURE_COMMAND) {
    return runFixedTargetedCapture(receiptRef, { workspace, task, outputRef, now, registeredTestIds, timeoutMs });
  }
  const receiptName = String(receiptRef ?? "").replace(/^quality\/tests\//, "").replace(/\.json$/, "").replaceAll("/", "-");
  const currentOutputRef = outputRef ?? (task?.manifest?.record_model === "vnext-single-write"
    ? `quality/tests/output/${receiptName}.output`
    : `evidence/${receiptName}.output`);
  const receipt = await createCanonicalReceiptWriter({ task, workspace, stage: "build-code", component: "build-code-test-capture", now })
    .captureTests({ command, receiptRef, outputRef: currentOutputRef });
  const change_scope = captureTaskChangeScope({ task, workspace, receipt });
  if (registeredTestIds === undefined) return Object.freeze({ ...receipt, change_scope });
  // T019 supplies the independent provider. Load it only when the caller has
  // provided that separate registry; missing provider or parse failure must
  // surface, never become an apparently empty inventory.
  const { collectTestInventory } = await import("./test-asset-inventory.mjs");
  const test_inventory = await collectTestInventory({ task, workspace, receipt, registeredTestIds });
  return Object.freeze({ ...receipt, change_scope, test_inventory });
}
