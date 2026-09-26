import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { recordSimpleReviewRequest } from "../../runtime/review/review-record-route.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { createSimpleReviewPacket, runSimpleReview } from "../../skills/wh-review/scripts/simple-review-runner.mjs";

// Controlled provider output exercises the public route and canonical writer.
// It is not an independent LLM quality verdict. These stores are intentionally
// retained so the task owner can read the original attempt/result/output files.
const providers = ["review/alpha", "other/beta", "third/gamma"];
const identities = Object.fromEntries(providers.map((provider, index) => [provider, {
  provider, adapter: provider.split("/")[0], source_id: `experiment-source-${index}`,
  config_id: `experiment-config-${index}`, model: `experiment-model-${index}`,
}]));
const finding = (line, issue) => ({
  severity: "major", path: "materials/03-draft_spec.md", line, issue,
  root_cause: issue, recommendation: "repair the identified branch",
  evidence_kind: "direct", evidence: "controlled fixture source line",
});

function isolatedTask() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "ocr-ac002-007-")));
  const repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "OCR experiment"]);
  git(["config", "user.email", "ocr-experiment@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "isolated OCR experiment\n");
  git(["add", "."]);
  git(["commit", "-qm", "fixture"]);
  const taskId = randomUUID();
  const task = createTask({
    storageRoot: root,
    taskPath: join(root, "Projects", "workflowhub", "tasks", taskId),
    manifest: {
      schema_version: "1.0.0", project_name: "workflowhub", task_id: taskId,
      created_at: new Date().toISOString(), target_repo_root: repo,
      issue_ids: [], inputs: {}, record_model: "vnext-single-write",
    },
  });
  const workspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  const kernel = createTaskKernel(task, { candidateWorkspace: workspace, artifacts });
  return { root, task, kernel };
}

async function runExperiment(label) {
    const { root, task, kernel } = isolatedTask();
    const request = {
      stage: "build-spec", host_provider: "codex",
      materials: {
        raw_requirement: "Review the controlled specification.",
        approved_decision: "Use this experiment to check canonical review bookkeeping.",
        draft_spec: "first line\nsecond line\nthird line\n",
      },
    };
    const requestMaterialId = createSimpleReviewPacket(request).material_id;
    const calls = [];
    const controlledGroup = {
      version: 4, round: 1, runtimeId: "controlled-runtime-1", outcome: "partial",
      providers: [
        {
          provider: providers[0], identity: identities[providers[0]], status: "completed", error: null,
          output: JSON.stringify({ findings: [finding(1, "shared claim"), finding(2, "alpha only claim")] }),
          timing: { started_at_ms: 10, completed_at_ms: 20, duration_ms: 10 }, usage: { input_tokens: 123, output_tokens: 45 },
        },
        {
          provider: providers[1], identity: identities[providers[1]], status: "completed", error: null,
          output: JSON.stringify({ findings: [finding(1, "shared claim"), finding(3, "beta only claim")] }),
          timing: { started_at_ms: 11, completed_at_ms: 21, duration_ms: 10 }, usage: null,
        },
        {
          provider: providers[2], identity: identities[providers[2]], status: "failed",
          error: { code: "OUTPUT_CAPTURE_LIMIT", message: "controlled output exceeded 64 byte capture limit", truncated: true },
          timing: { started_at_ms: 12, completed_at_ms: 22, duration_ms: 10 }, usage: null,
        },
      ],
    };
    const routeDependencies = {
      loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot: root, command: ["unused"] }),
      resolveRoute: () => ({ initial: providers, mode: "single_round", minimum_heterologous: 1 }),
      selectProviders: () => ({
        providers, eligible_profiles: providers,
        provider_identities: Object.fromEntries(providers.map((p) => [p, { source_id: identities[p].source_id, config_id: identities[p].config_id }])),
        provider_models: Object.fromEntries(providers.map((p) => [p, identities[p].model])),
      }),
    };
    const recorded = await recordSimpleReviewRequest({
      task, kernel, request, routeDependencies,
      runRound: (input) => runSimpleReview(input, {
        ...routeDependencies,
        client: { async runGroup(value) {
          calls.push({ providers: value.providers, minimumHeterologous: value.minimumHeterologous,
            materialId: value.materials.materialId, deliveryManifest: value.materials.deliveryManifest });
          return { ...controlledGroup, materialId: value.materials.materialId };
        } },
      }),
    });
    const attemptPath = recorded.attempt_ref ? task.recordPath(recorded.attempt_ref) : null;
    const resultPath = recorded.result_ref ? task.recordPath(recorded.result_ref) : null;
    const reportPath = recorded.report_ref ? task.recordPath(recorded.report_ref) : null;
    const callLog = join(root, "controlled-provider-calls.json");
    const callLogBytes = JSON.stringify({ request, requestMaterialId, controlledGroup, calls, recorded }, null, 2);
    writeFileSync(callLog, callLogBytes);
    const attemptBytes = attemptPath ? readFileSync(attemptPath, "utf8") : null;
    const resultBytes = resultPath ? readFileSync(resultPath, "utf8") : null;
    const reportBytes = reportPath ? readFileSync(reportPath, "utf8") : null;
    const attempt = attemptBytes ? JSON.parse(attemptBytes) : null;
    const result = resultBytes ? JSON.parse(resultBytes) : null;
    const publicResultAndCoverage = reportBytes
      ? JSON.parse(reportBytes.match(/## Public result and coverage\n\n```json\n([\s\S]*?)\n```/)?.[1] ?? "null")
      : null;
    const outputs = (attempt?.provider_attempts ?? []).filter((member) => member.output_ref).map((member) => {
      const path = task.recordPath(member.output_ref);
      const bytes = readFileSync(path, "utf8");
      return { provider: member.provider, path, sha256: createHash("sha256").update(bytes).digest("hex"), bytes };
    });
    const artifactDir = join(process.cwd(), ".cache", "card05-experiments", "ac002-007");
    mkdirSync(artifactDir, { recursive: true });
    const artifactPath = join(artifactDir, `${label}-${task.identity.taskId}.json`);
    const artifact = {
      label, controlled_provider_only: true, root, task_store: task.taskPath,
      input: request, request_material_id: requestMaterialId,
      call_log: { path: callLog, sha256: createHash("sha256").update(callLogBytes).digest("hex"), bytes: callLogBytes },
      canonical_attempt: { path: attemptPath, sha256: attemptBytes && createHash("sha256").update(attemptBytes).digest("hex"), bytes: attemptBytes },
      canonical_result: { path: resultPath, sha256: resultBytes && createHash("sha256").update(resultBytes).digest("hex"), bytes: resultBytes },
      canonical_report: { path: reportPath, sha256: reportBytes && createHash("sha256").update(reportBytes).digest("hex"), bytes: reportBytes },
      provider_outputs: outputs, recorded,
    };
    writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
    console.log("OCR_AC002_007_EVIDENCE", JSON.stringify({ label, artifactPath, root, taskStore: task.taskPath,
      callLog, attemptPath, resultPath, reportPath, artifactSha256: createHash("sha256").update(readFileSync(artifactPath)).digest("hex") }));
    return { task, requestMaterialId, calls, recorded, attempt, result, publicResultAndCoverage, outputs, artifactPath };
}

describe("AC-REVIEW-002/007 controlled public-route experiment", () => {
  it("ORACLE-AC002-UNION: reads shared, unique and failed members from canonical originals", async () => {
    const { calls, requestMaterialId, recorded, attempt, result, outputs } = await runExperiment("ac002-union");
    expect(calls).toHaveLength(1);
    expect(calls[0].providers).toEqual(providers);
    expect(calls[0].materialId).toBe(requestMaterialId);
    expect(recorded.result_ref).toBeTruthy();
    expect(result.attempt_ref).toBe(recorded.attempt_ref);
    expect(attempt.provider_attempts).toHaveLength(3);
    expect(attempt.provider_attempts.map((member) => member.status)).toEqual(["completed", "completed", "failed"]);
    expect(attempt.provider_attempts[2].error.code).toBe("OUTPUT_CAPTURE_LIMIT");
    expect(result.provider_results.map((member) => member.provider)).toEqual([...providers.slice(0, 2)].sort());
    const byLine = new Map(result.findings.map((entry) => [entry.line, entry]));
    expect([...byLine.keys()].sort((a, b) => a - b)).toEqual([1, 2, 3]);
    expect(byLine.get(1)).toMatchObject({ providers: [...providers.slice(0, 2)].sort(), source_strength: "corroborated" });
    expect(byLine.get(2)).toMatchObject({ providers: [providers[0]], source_strength: "single_source" });
    expect(byLine.get(3)).toMatchObject({ providers: [providers[1]], source_strength: "single_source" });
    expect(outputs.map((output) => output.provider)).toEqual(providers.slice(0, 2));
  });

  it("ORACLE-AC007-LEDGER: reads identity, known and absent usage, and capture-limit fact", async () => {
    const { recorded, requestMaterialId, calls, attempt, result, publicResultAndCoverage, outputs } = await runExperiment("ac007-ledger");
    expect(recorded.result_ref).toBeTruthy();
    expect(result.attempt_ref).toBe(recorded.attempt_ref);
    expect(attempt.closure_manifest).toMatchObject({
      version: "wh-review-closure.v1", material_id: requestMaterialId,
      packet_sha256: requestMaterialId,
    });
    expect(attempt.review_policy.requested_profiles).toEqual(providers);
    expect(attempt.review_policy.eligible_profiles).toEqual(providers);
    expect(calls[0].deliveryManifest.map((entry) => entry.path)).toContain("materials/03-draft_spec.md");
    expect(publicResultAndCoverage).toMatchObject({
      semantic_status: "available", coverage: "satisfied",
      public_result: {
        dispatch_state: "dispatched", outcome: "partial", minimum_heterologous: 1,
        provider_selection: { providers },
      },
    });
    // This coverage reports route/quorum and delivered bundle declarations.
    // None of these fields attests that a provider read every delivered file.
    expect(attempt.provider_attempts.map((member) => member.identity.source_id)).toEqual(providers.map((provider) => identities[provider].source_id));
    expect(attempt.provider_attempts.map((member) => member.execution.timing.duration_ms)).toEqual([10, 10, 10]);
    expect(attempt.provider_attempts[0].execution.usage).toEqual({ input_tokens: 123, output_tokens: 45 });
    expect(attempt.provider_attempts[1].execution.usage).toBeNull();
    expect(attempt.provider_attempts[2].execution.usage).toBeNull();
    expect(outputs).toHaveLength(2);
    expect(outputs.every((output) => output.bytes.includes("findings"))).toBe(true);
    expect(attempt.provider_attempts[2]).toMatchObject({
      status: "failed", output_ref: null,
      error: { code: "OUTPUT_CAPTURE_LIMIT", message: expect.stringMatching(/64 byte capture limit/) },
    });
    expect(result.provider_results.map((member) => member.provider)).toEqual([...providers.slice(0, 2)].sort());
    expect(result.findings).toHaveLength(3);
    expect(result.findings.map((entry) => entry.source_strength).sort()).toEqual([
      "corroborated", "single_source", "single_source",
    ]);
    expect(result.findings.every((entry) => !entry.providers.includes(providers[2]))).toBe(true);
  });
});
