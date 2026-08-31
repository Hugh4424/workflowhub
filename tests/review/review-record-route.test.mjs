import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { recordSimpleReviewResult } from "../../runtime/review/review-record-route.mjs";
import { validateSchema } from "../../runtime/review/schema-validator.mjs";
import { runSimpleReview } from "../../skills/wh-review/scripts/simple-review-runner.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function makeTask() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "review-record-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub review record test"]);
  git(["config", "user.email", "review-record@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "review record fixture\n", "utf8");
  git(["add", "."]);
  git(["commit", "-qm", "fixture"]);
  const taskId = randomUUID();
  const task = createTask({
    storageRoot: root,
    taskPath: join(root, "Projects", "workflowhub", "tasks", taskId),
    manifest: {
      schema_version: "1.0.0",
      project_name: "workflowhub",
      task_id: taskId,
      created_at: "2026-08-21T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const candidateWorkspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidateWorkspace.worktreeRoot, task);
  const kernel = createTaskKernel(task, { candidateWorkspace, artifacts });
  return { task, kernel };
}

function baseResult() {
  return {
    status: "available",
    stage: "build-code",
    review_track: null,
    review_kind: null,
    material_id: "8192849eab3a861772ed1e409e72ff43eae462b16bc6437193483fc905d8260d",
    runtime_id: "runtime-123",
    outcome: "partial",
    provider_results: [
      {
        provider: "codex/luna",
        status: "completed",
        identity: { provider: "codex/luna", adapter: "codex", source_id: "codex/luna", config_id: "cfg", model: "gpt-5.6-luna" },
        error: null,
        timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 },
        usage: null,
        evidence_anchor_valid: [true],
      },
    ],
    findings: [
      {
        severity: "major",
        path: "materials/06-implementation_summary.md",
        line: 1,
        issue: "implementation material is thin",
        recommendation: "add real code",
        root_cause: "smoke test",
        evidence_kind: "direct",
        evidence: "only summary text",
        provider: "codex/luna",
      },
    ],
  };
}

function contentHash(text) {
  return createHash("sha256").update(text).digest("hex");
}

describe("review record route", () => {
  it("persists an available simple review result", async () => {
    const { task, kernel } = makeTask();
    const result = baseResult();
    const identity = { snapshot: kernel.currentVNextSnapshot(), materialRevision: kernel.currentVNextMaterialRevision() };
    const refs = recordSimpleReviewResult({ task, result, kernel });
    expect(refs.result_ref).toMatch(/^quality\/reviews\/results\//);
    expect(refs.attempt_ref).toMatch(/^quality\/reviews\/attempts\//);

    const attemptRaw = task.readRecord(refs.attempt_ref);
    const attempt = JSON.parse(attemptRaw);
    validateSchema("attempt", attempt);
    expect(attempt.terminal_status).toBe("semantic");

    const resultRecord = JSON.parse(task.readRecord(refs.result_ref));
    validateSchema("result", resultRecord);
    expect(resultRecord.findings).toHaveLength(1);
    expect(resultRecord.findings[0].id).toMatch(/^F-[a-f0-9]{12}$/);
    expect(resultRecord.attempt_ref).toBe(refs.attempt_ref);
    expect(attempt.snapshot_tree).toBe(identity.snapshot.tree);
    expect(attempt.material_id).toBe(result.material_id);
    expect(attempt.material_revision).toBe(identity.materialRevision);
    expect(resultRecord.snapshot_tree).toBe(identity.snapshot.tree);
    expect(resultRecord.material_id).toBe(result.material_id);
    expect(resultRecord.material_revision).toBe(identity.materialRevision);
    expect(resultRecord.source).toEqual({
      target_commit: identity.snapshot.head,
      base_commit: identity.snapshot.commit,
      base_tree: identity.snapshot.tree,
      captured_head: identity.snapshot.head,
    });
    expect(resultRecord.snapshot_tree).not.toBe(result.material_id);

    const providerOutput = JSON.parse(task.readRecord(attempt.provider_attempts[0].output_ref));
    expect(providerOutput.schema_version).toBe("wh-review-provider-output.v1");
    expect(providerOutput.content_hash).toBe(contentHash(providerOutput.content));
  });

  it("persists an unavailable simple review result", async () => {
    const { task, kernel } = makeTask();
    const result = {
      status: "unavailable",
      stage: "build-code",
      review_track: null,
      review_kind: null,
      material_id: "8192849eab3a861772ed1e409e72ff43eae462b16bc6437193483fc905d8260d",
      runtime_id: "runtime-456",
      outcome: "partial",
      provider_results: [],
      findings: [],
      error: { code: "ROUTE_UNAVAILABLE", message: "no route" },
    };
    const identity = { snapshot: kernel.currentVNextSnapshot(), materialRevision: kernel.currentVNextMaterialRevision() };
    const refs = recordSimpleReviewResult({ task, result, kernel });
    expect(refs.attempt_ref).toMatch(/^quality\/reviews\/attempts\//);
    expect(refs.result_ref).toBeNull();

    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    validateSchema("attempt", attempt);
    expect(attempt.terminal_status).toBe("unavailable");
    expect(attempt.error.code).toBe("ROUTE_UNAVAILABLE");
    expect(attempt.snapshot_tree).toBe(identity.snapshot.tree);
    expect(attempt.material_id).toBe(result.material_id);
    expect(attempt.material_revision).toBe(identity.materialRevision);
    expect(attempt.source).toEqual({
      target_commit: identity.snapshot.head,
      base_commit: identity.snapshot.commit,
      base_tree: identity.snapshot.tree,
      captured_head: identity.snapshot.head,
    });
  });

  it("persists the actual producer shape when route loading is unavailable", async () => {
    const { task, kernel } = makeTask();
    const result = await runSimpleReview({
      stage: "verify-code",
      host_provider: "codex/luna",
      materials: { implementation: "implementation bytes" },
    }, {
      loadConfig: () => { throw new Error("route config is unavailable"); },
    });
    const refs = recordSimpleReviewResult({ task, result, kernel });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    expect(attempt.terminal_status).toBe("unavailable");
    expect(attempt.error.code).toBe("ROUTE_UNAVAILABLE");
    expect(attempt.material_id).toBe(result.material_id);
  });

  it("keeps failed provider facts out of semantic results when a sibling provider succeeds", () => {
    const { task, kernel } = makeTask();
    const result = baseResult();
    result.provider_results = [
      ...result.provider_results,
      {
        provider: "opencode/pax3.8",
        status: "failed",
        identity: { provider: "opencode/pax3.8", adapter: "opencode", source_id: "opencode/pax3.8", config_id: "cfg-pax", model: "pax/qwen3.8" },
        error: { code: "PROVIDER_NO_TERMINAL_RESULT", message: "provider session ended without a terminal result" },
        timing: { started_at_ms: 3, completed_at_ms: 4, duration_ms: 1 },
        usage: null,
      },
    ];
    const refs = recordSimpleReviewResult({ task, result, kernel });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    const semantic = JSON.parse(task.readRecord(refs.result_ref));
    const failed = attempt.provider_attempts.find((item) => item.provider === "opencode/pax3.8");
    expect(failed).toMatchObject({ status: "failed", output_ref: null, error: { code: "PROVIDER_NO_TERMINAL_RESULT" } });
    expect(semantic.provider_results.map((item) => item.provider)).toEqual(["codex/luna"]);
    expect(semantic.findings).toHaveLength(1);
  });

  it("keeps the DSH adapter identity aligned with the canonical provider alias", () => {
    const { task, kernel } = makeTask();
    const result = baseResult();
    result.stage = "verify-code";
    result.provider_results = [{
      provider: "dsh-code-review",
      status: "completed",
      identity: { provider: "dsh-code-review", adapter: "dsh", source_id: "codex-session-dsh-review", config_id: "dsh-config", model: null },
            error: null,
            timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 },
            usage: null,
            evidence_anchor_valid: [],
    }];
    result.findings = [];
    const refs = recordSimpleReviewResult({ task, result, kernel });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    expect(attempt.provider_attempts[0].identity).toMatchObject({ provider: "dsh-code-review", adapter: "dsh" });
    expect(attempt.provider_attempts[0].execution.adapter).toBe("dsh");
  });

  it("fails loudly on invalid input", async () => {
    const { task, kernel } = makeTask();
    expect(() => recordSimpleReviewResult({ task, result: {} })).toThrow();
    expect(() => recordSimpleReviewResult({ task, result: { status: "available", stage: "build-code" } })).toThrow();
    expect(() => recordSimpleReviewResult({ task, result: baseResult() })).toThrow(/TaskKernel|snapshot|material revision/i);
    const spoofed = baseResult();
    spoofed.snapshot_tree = "f".repeat(40);
    expect(() => recordSimpleReviewResult({ task, result: spoofed, kernel })).toThrow(/identity fields must come from the authenticated current context/i);
    const duplicate = baseResult();
    duplicate.provider_results = [...duplicate.provider_results, { ...duplicate.provider_results[0] }];
    expect(() => recordSimpleReviewResult({ task, result: duplicate, kernel })).toThrow(/provider is duplicated/i);
  });
});
