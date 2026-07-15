#!/usr/bin/env node
import { mkdtempSync, mkdirSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runReviewFixture } from "../skills/wh-review/scripts/review-runner.mjs";
import { createTask } from "../core/task-handle.mjs";

const oid = "1".repeat(40); const materialId = "a".repeat(64);
const source = Object.freeze({ targetCommit: oid, baseCommit: oid, baseTree: oid, capturedHead: oid, snapshotTree: oid });
const stages = [["make-decision", "direction"], ["make-decision", "detail"], ["build-spec", null], ["build-plan", null], ["build-code", null], ["verify-code", null]];
const pass = JSON.stringify({ verdict: "pass", summary: "fake E2E completed", findings: [] });

/** Test fixture only. This never constitutes provider or external-project E2E evidence. */
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
    const providerClient = { run: async ({ provider }) => ({ runtimeId: `runtime-${stage}-${reviewTrack ?? "default"}`, provider: { provider, status: "completed", session_id: "fake-session", output: pass, error: null } }) };
    const result = await runReviewFixture({ task, attachmentRoot, taskId: "audit-e2e", stage, reviewTrack, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, attachmentRoot, sourcePrefix: ".wh-review-packets/fake", materialId, manifest: [] }) });
    records.push({ stage, review_track: reviewTrack, status: result.status, verdict: result.verdict, snapshot_tree: result.snapshotTree, material_id: result.materialId, attempt_ref: result.attemptRef, result_ref: result.resultRef });
  }
  const evidenceRef = "fixtures/fake-broker-audit.json";
  task.createRecordAtomic(evidenceRef, `${JSON.stringify({ version: 1, kind: "fake-broker", fixture_only: true, is_real_e2e: false, records }, null, 2)}\n`);
  return { ok: records.every((item) => item.verdict === "pass"), evidence_ref: evidenceRef, records };
}

/** @deprecated Test compatibility alias. Never report this as real E2E. */
export const runAuditE2E = runAuditFixture;

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const arg = process.argv.find((value) => value.startsWith("--output="));
  runAuditFixture({ outputRoot: arg?.slice("--output=".length) }).then((value) => process.stdout.write(`${JSON.stringify({ ...value, fixture_only: true }, null, 2)}\n`)).catch((error) => { process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1; });
}
