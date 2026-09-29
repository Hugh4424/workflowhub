import { createHash, randomUUID } from "node:crypto";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import { resolveWorkflowHubIdentity } from "../../tools/cli/stage-runtime.mjs";
import { openTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { capturePreExecutionTaskChangeScope } from "./change-scope.mjs";
import { readCurrentTestAssetRegistry } from "./test-asset-inventory.mjs";
import { selectAffectedCases } from "./case-selection.mjs";
import { runTargetedCases } from "./targeted-runner.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const CATALOG_REF = "docs/quality/business-case-catalog.json";
const SHA_REVISION = /^sha256:[a-f0-9]{64}$/;

function readWorktreeFile(root, path) {
  if (typeof path !== "string" || path.trim() === "" || isAbsolute(path)
      || path.split("/").some((part) => part === "." || part === "..")) {
    throw new Error(`unsafe worktree source path: ${path}`);
  }
  const file = resolve(root, path);
  const inside = relative(root, file);
  if (inside === "" || inside === ".." || inside.startsWith(`..${sep}`)
      || isAbsolute(inside) || realpathSync(file) !== file || !statSync(file).isFile()) {
    throw new Error(`worktree source is not a regular file: ${path}`);
  }
  return readFileSync(file);
}

function readSourceBoundCatalog(root, task) {
  const raw = readWorktreeFile(root, CATALOG_REF);
  let catalog;
  try { catalog = JSON.parse(raw); }
  catch { throw new Error("business case catalog JSON is invalid"); }
  if (catalog?.schema !== "workflowhub-business-case-catalog.v1"
      || catalog.project !== task.identity.projectName
      || typeof catalog.revision !== "string" || !catalog.revision.trim()
      || !Array.isArray(catalog.cases) || catalog.cases.length === 0) {
    throw new Error("business case catalog identity is invalid");
  }
  const ids = new Set();
  for (const entry of catalog.cases) {
    if (typeof entry?.id !== "string" || !entry.id.trim() || ids.has(entry.id)
        || !Array.isArray(entry.phase_ids) || entry.phase_ids.length !== 1
        || !/^P[1-9][0-9]*$/.test(entry.phase_ids[0])
        || !SHA_REVISION.test(entry.source?.revision ?? "")
        || !SHA_REVISION.test(entry.rule?.revision ?? "")) {
      throw new Error("business case source or rule binding is incomplete");
    }
    ids.add(entry.id);
    const rulePath = entry.rule.path ?? `specs/${task.identity.taskId}/phases/${entry.phase_ids[0]}.md`;
    if (entry.source.revision !== `sha256:${sha256(readWorktreeFile(root, entry.source.path))}`
        || entry.rule.revision !== `sha256:${sha256(readWorktreeFile(root, rulePath))}`) {
      throw new Error(`business case source or rule revision is stale: ${entry.id}`);
    }
  }
  return { catalog, ref: CATALOG_REF, sha256: sha256(raw) };
}

function sameScope(left, right) {
  return left?.status === "recorded" && right?.status === "recorded"
    && ["task_id", "start_commit", "start_tree", "snapshot_head", "snapshot_commit", "snapshot_tree", "source_digest"]
      .every((field) => left[field] === right[field])
    && JSON.stringify(left.changed_paths) === JSON.stringify(right.changed_paths);
}

/** Private fixed-command child. It never creates a second canonical capture. */
export async function runPrivateTargetedCapture(cwd = process.cwd()) {
  if (process.env.WORKFLOWHUB_TARGETED_INHERIT_GROUP !== "1") {
    throw new Error("fixed targeted capture requires the outer capture process group");
  }
  const identity = resolveWorkflowHubIdentity({}, cwd);
  const task = openTask(identity.taskPath, identity.project, identity.task);
  const workspace = openCurrentTaskWorkspace(task);
  const root = workspace.worktreeRoot;
  if (realpathSync(cwd) !== root) throw new Error("fixed targeted capture cwd differs from the authenticated task worktree");
  const kernel = createTaskKernel(task, { workspace });
  const materialRevision = kernel.currentVNextMaterialRevision();
  const pre = capturePreExecutionTaskChangeScope({ task, workspace });
  if (pre.status !== "recorded") throw new Error(`unknown_change_scope: ${pre.reason ?? "pre-run source unavailable"}`);
  const registry = readCurrentTestAssetRegistry({ task, workspace });
  const boundRegistry = { ...registry, task_id: task.identity.taskId,
    snapshot_tree: pre.snapshot_tree, source_digest: pre.source_digest };
  const sourceCatalog = readSourceBoundCatalog(root, task);
  const selection = selectAffectedCases({ changeScope: pre, catalog: sourceCatalog.catalog, registry: boundRegistry });
  if (selection.status !== "selected" || selection.test_execution_status !== "not_run") {
    throw new Error(`targeted case selection unavailable: ${selection.reason ?? "unknown"}`);
  }
  // The runner refuses duplicate physical targets for one batch. Keep that
  // invariant when we run each selected case separately to retain its own raw
  // reporter bytes; otherwise one file could be run twice and attributed to
  // two cases.
  const selectedTargets = selection.cases.map((entry) => {
    readWorktreeFile(root, entry.execution?.target);
    return realpathSync(resolve(root, entry.execution.target));
  });
  if (new Set(selectedTargets).size !== selectedTargets.length) {
    throw new Error("shared selected test target cannot be attributed to separate cases");
  }
  const runId = randomUUID();
  const targetExecutions = [];
  for (const entry of selection.cases) {
    const run = await runTargetedCases({ selection: { ...selection, cases: [entry] }, workspaceRoot: root,
      runner: { executable: process.execPath, fixedArgs: ["--test", "--test-reporter=tap"] } });
    if (run.status !== "completed" || run.execution?.exit_code !== 0
        || run.observations.some((row) => row.status !== "passed")) {
      throw new Error(`targeted test execution unavailable for ${entry.id}: ${run.reason ?? "unknown"}`);
    }
    const raw = run.execution.raw_output;
    if (sha256(raw) !== run.execution.raw_output_sha256) throw new Error("targeted raw reporter hash mismatch");
    const rawRef = `quality/evidence/build-code-targeted/raw-${sha256(raw)}.txt`;
    kernel.publishCanonicalRecord(rawRef, raw);
    const caseRecord = {
      schema_version: "workflowhub-targeted-case-execution.v1", run_id: runId,
      task_id: task.identity.taskId, snapshot_tree: pre.snapshot_tree,
      material_revision: materialRevision, case_id: entry.id,
      target: entry.execution.target,
      registered_test_ids: entry.execution.registered_test_ids,
      argv: run.execution.argv[0], exit_code: run.execution.exit_code,
      raw_output_ref: rawRef, raw_output_sha256: sha256(raw),
      observations: run.observations,
      canonical_receipt: false,
    };
    const recordRaw = `${JSON.stringify(caseRecord, null, 2)}\n`;
    const recordHash = sha256(recordRaw);
    const recordRef = `quality/evidence/build-code-targeted/case-${recordHash}.json`;
    kernel.publishCanonicalRecord(recordRef, recordRaw);
    targetExecutions.push({ entry, run, raw, rawRef, recordRef, recordHash });
  }
  const post = capturePreExecutionTaskChangeScope({ task, workspace });
  if (!sameScope(pre, post) || kernel.currentVNextMaterialRevision() !== materialRevision
      || readCurrentTestAssetRegistry({ task, workspace }).registry_sha256 !== registry.registry_sha256
      || readSourceBoundCatalog(root, task).sha256 !== sourceCatalog.sha256) {
    throw new Error("targeted test source, material, registry, or catalog changed during execution");
  }
  const raw = targetExecutions.map((item) => item.raw).join("\n");
  const rawRef = `quality/evidence/build-code-targeted/raw-${sha256(raw)}.txt`;
  kernel.publishCanonicalRecord(rawRef, raw);
  const observations = targetExecutions.flatMap((item) => item.run.observations);
  const execution = { executable: process.execPath,
    argv: targetExecutions.map((item) => item.run.execution.argv[0]),
    exit_code: 0, test_count: observations.length, raw_output_sha256: sha256(raw),
    raw_stderr: targetExecutions.map((item) => item.run.execution.raw_stderr).join("\n"),
    source: "direct_runner", canonical_receipt: false };
  const manifest = {
    schema_version: "workflowhub-targeted-capture.v1", run_id: runId,
    task_id: task.identity.taskId, project: task.identity.projectName,
    snapshot_tree: pre.snapshot_tree, source_digest: pre.source_digest,
    material_revision: materialRevision,
    catalog_ref: sourceCatalog.ref, catalog_sha256: sourceCatalog.sha256,
    catalog_revision: sourceCatalog.catalog.revision,
    registry_ref: registry.registry_ref, registry_sha256: registry.registry_sha256,
    registry_revision: registry.revision,
    selected_case_ids: selection.cases.map((entry) => entry.id),
    selection_status: selection.status, test_execution_status: "observed_noncanonical",
    business_effect_status: "unknown", execution: { ...execution, raw_output_ref: rawRef },
    observations,
    reports: targetExecutions.map(({ entry, run, rawRef: targetRawRef, recordRef, recordHash }) => ({
      case_id: entry.id, target: entry.execution.target,
      record_ref: recordRef, record_hash: recordHash,
      raw_ref: targetRawRef,
      raw_sha256: run.execution.raw_output_sha256,
      argv: run.execution.argv[0], exit_code: run.execution.exit_code,
      full_ids: run.observations.map((row) => row.full_id),
      test_count: run.observations.length,
      canonical_receipt: false,
    })),
  };
  const manifestRaw = `${JSON.stringify(manifest, null, 2)}\n`;
  const manifestHash = sha256(manifestRaw);
  const manifestRef = `quality/evidence/build-code-targeted/manifest-${manifestHash}.json`;
  kernel.publishCanonicalRecord(manifestRef, manifestRaw);
  return { schema_version: "workflowhub-targeted-capture-pointer.v1", run_id: runId,
    task_id: task.identity.taskId, snapshot_tree: pre.snapshot_tree,
    material_revision: materialRevision, manifest_ref: manifestRef, manifest_hash: manifestHash,
    reports: manifest.reports.map(({ case_id, target, record_ref, record_hash, raw_ref, raw_sha256, argv, exit_code, full_ids }) => ({
      case_id, target, record_ref, record_hash, raw_ref, raw_sha256, argv, exit_code, full_ids,
    })) };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  runPrivateTargetedCapture().then((result) => {
    process.stdout.write(`${JSON.stringify(result)}\n`);
  }).catch((error) => {
    process.stderr.write(`${error?.message ?? error}\n`);
    process.exitCode = 1;
  });
}
