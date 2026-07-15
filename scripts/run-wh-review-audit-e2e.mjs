#!/usr/bin/env node
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runReview } from "../skills/wh-review/scripts/review-runner.mjs";

const oid = "1".repeat(40); const materialId = "a".repeat(64);
const source = Object.freeze({ targetCommit: oid, baseCommit: oid, baseTree: oid, capturedHead: oid, snapshotTree: oid });
const stages = [["make-decision", "direction"], ["make-decision", "detail"], ["build-spec", null], ["build-plan", null], ["build-code", null], ["verify-code", null]];
const pass = JSON.stringify({ verdict: "pass", summary: "fake E2E completed", findings: [] });

export async function runAuditE2E({ outputRoot } = {}) {
  const output = resolve(outputRoot ?? mkdtempSync(join(tmpdir(), "wh-review-audit-e2e-"))); mkdirSync(output, { recursive: true });
  const records = [];
  for (const [stage, reviewTrack] of stages) {
    const reviewDataRoot = join(output, `${stage}-${reviewTrack ?? "default"}`); const attachmentRoot = join(output, "attachments"); mkdirSync(reviewDataRoot, { recursive: true }); mkdirSync(attachmentRoot, { recursive: true });
    const providerClient = { run: async ({ provider }) => ({ runtimeId: `runtime-${stage}-${reviewTrack ?? "default"}`, provider: { provider, status: "completed", session_id: "fake-session", output: pass, error: null } }) };
    const result = await runReview({ reviewDataRoot, attachmentRoot, taskId: "audit-e2e", stage, reviewTrack, hostProvider: "codex", providers: ["kimi"], providerClient,
      captureSource: () => source, buildMaterials: () => ({ bundleRoot: attachmentRoot, attachmentRoot, sourcePrefix: ".wh-review-packets/fake", materialId, manifest: [] }) });
    records.push({ stage, review_track: reviewTrack, status: result.status, verdict: result.verdict, snapshot_tree: result.snapshotTree, material_id: result.materialId, attempt_path: result.attemptPath, result_path: result.resultPath });
  }
  const evidencePath = join(output, "audit-e2e-evidence.json"); writeFileSync(evidencePath, `${JSON.stringify({ version: 1, kind: "fake-broker", records }, null, 2)}\n`);
  return { ok: records.every((item) => item.verdict === "pass"), evidence_path: evidencePath, records };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const arg = process.argv.find((value) => value.startsWith("--output="));
  runAuditE2E({ outputRoot: arg?.slice("--output=".length) }).then((value) => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)).catch((error) => { process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1; });
}
