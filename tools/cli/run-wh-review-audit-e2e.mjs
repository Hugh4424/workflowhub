#!/usr/bin/env node
import { mkdtempSync, mkdirSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runSimpleReview } from "../../skills/wh-review/scripts/simple-review-runner.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";

const oid = "1".repeat(40); const materialId = "a".repeat(64);
const source = Object.freeze({ targetCommit: oid, baseCommit: oid, baseTree: oid, capturedHead: oid, snapshotTree: oid });
const stages = [["make-decision", "direction"], ["make-decision", "detail"], ["build-spec", null], ["build-plan", null], ["build-code", null], ["verify-code", null]];
const pass = JSON.stringify({ findings: [] });
function providerResult(provider) {
  return { provider, status: "completed", identity: {
    provider,
    adapter: provider.split("/", 1)[0],
    source_id: `fixture-${provider}-source`,
    config_id: `fixture-${provider}-config`,
    model: null,
  }, session_id: "fake-session", output: pass, error: null,
    execution: { adapter: provider.split("/", 1)[0], model: null, effort: null, thinking: null,
      timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null,
      retry: { count: 0, progress_events: 0 }, runtime_id: "runtime" } };
}

/** Test fixture only. This never constitutes provider or external-project E2E evidence. */
export async function writeAuditEvidenceRecord(task, evidenceRef, data) {
  // Keep the fixture's publication boundary observable. TaskHandle is
  // currently synchronous, but awaiting here also preserves correct ordering
  // if the storage implementation becomes asynchronous; failures must reject
  // the audit instead of being lost as an unhandled fire-and-forget write.
  await task.createRecordAtomic(evidenceRef, data);
}

export async function runAuditFixture({ outputRoot } = {}) {
  const requestedOutput = resolve(outputRoot ?? mkdtempSync(join(tmpdir(), "wh-review-audit-e2e-"))); mkdirSync(requestedOutput, { recursive: true });
  const output = realpathSync(requestedOutput);
  const attachmentRoot = join(output, "attachments"); mkdirSync(attachmentRoot, { recursive: true });
  const task = createTask({ storageRoot: output, manifest: {
    schema_version: "1.0.0", project_name: "AuditE2E", task_id: "audit-e2e",
    created_at: new Date().toISOString(), target_repo_root: output, issue_ids: [], inputs: {},
  } });
  const records = [];
  for (const [stage, reviewTrack] of stages) {
    const providerClient = { runGroup: async ({ providers }) => ({ runtimeId: `runtime-${stage}-${reviewTrack ?? "default"}`, outcome: "completed", providers: providers.map(providerResult) }) };
    const result = await runSimpleReview({
      stage,
      review_track: reviewTrack,
      host_provider: "codex",
      materials: {
        raw_requirement: "fixture requirement",
        ...(stage === "make-decision" && reviewTrack === "direction" ? {
          objective_facts: ["fixture fact"],
          current_selection: "fixture choice",
          selection_rationale: "fixture only",
          convergence_outline: "fixture convergence outline",
        } : {}),
        ...(stage === "make-decision" && reviewTrack === "detail" ? {
          approved_direction: "fixture approved direction",
          draft_spec_or_acceptance: "fixture draft acceptance",
        } : {}),
        ...(stage === "build-spec" ? {
          approved_decision: "fixture approved decision",
          draft_spec: "fixture draft spec",
        } : {}),
        ...(stage === "build-plan" ? {
          approved_spec: "fixture approved spec",
          acceptance_criteria: "fixture acceptance criteria",
          draft_plan: "fixture draft plan",
          draft_tasks: "fixture draft tasks",
        } : {}),
      },
    }, {
      loadConfig: () => ({ attachmentRoot, whReview: {}, config: {} }),
      resolveRoute: () => ({ mode: "single_round", initial: ["kimi"], minimum_heterologous: 1 }),
      selectProviders: () => ({ providers: ["kimi"] }),
      client: providerClient,
    });
    records.push({ stage, review_track: reviewTrack, status: result.status, snapshot_tree: source.snapshotTree, material_id: result.material_id ?? materialId, attempt_ref: null, result_ref: null });
  }
  const evidenceRef = "fixtures/fake-broker-audit.json";
  await writeAuditEvidenceRecord(task, evidenceRef, `${JSON.stringify({ version: 1, kind: "fake-broker", fixture_only: true, is_real_e2e: false, records }, null, 2)}\n`);
  return { ok: records.every((item) => item.status === "available"), evidence_ref: evidenceRef, records };
}

/** @deprecated Test compatibility alias. Never report this as real E2E. */
export const runAuditE2E = runAuditFixture;

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const arg = process.argv.find((value) => value.startsWith("--output="));
  runAuditFixture({ outputRoot: arg?.slice("--output=".length) }).then((value) => process.stdout.write(`${JSON.stringify({ ...value, fixture_only: true }, null, 2)}\n`)).catch((error) => { process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1; });
}
