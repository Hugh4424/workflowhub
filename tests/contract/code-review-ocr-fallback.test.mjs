// build-plan 预写测试（冻结）：断言变更须走 test change request + 独立审查
//
// T021 / ADR-021 目标契约（现行实现下必 RED）：
// - doctor 输出含 OCR 可用性项（ocr 项：installed / not_installed），
//   检测以调用时 PATH 为准（ocr 缺失或 ocr --version < 1.12.9 → not_installed）。
// - 代码面审查路由：OCR 未安装 → 由 wh-review 执行同一审查面，审查记录
//   （attempt 与 canonical result）带 fallback 字段 {from:"ocr", reason, detected_by}
//   写明 OCR 未安装事实，且记录的执行者（provider）为 wh-review。
// - OCR 已安装但 provider 调用失败 → 记录 evaluation 为 unavailable，
//   无 fallback 字段、不走 wh-review。

import { execFileSync } from "node:child_process";
import { accessSync, constants as fsConstants, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { stageRuntimeCliMain, stageRuntimeMain } from "../../tools/cli/stage-runtime.mjs";

const roots = [];

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "code-review-ocr-fallback-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub OCR fallback test"]);
  git(repo, ["config", "user.email", "ocr-fallback@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "ocr fallback fixture\n", "utf8");
  git(repo, ["add", "README.md"]);
  git(repo, ["commit", "-qm", "fixture"]);
  const taskId = `code-review-ocr-fallback-${Math.random().toString(16).slice(2)}`;
  const task = createTask({
    storageRoot: root,
    taskPath: join(root, "Projects", "workflowhub", "tasks", taskId),
    manifest: {
      schema_version: "1.0.0", execution_mode: "per_invocation", record_model: "vnext-single-write",
      project_name: "workflowhub", task_id: taskId, created_at: "2026-09-25T00:00:00.000Z",
      target_repo_root: repo, issue_ids: [], inputs: {},
    },
  });
  const workspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  artifacts.writeAtomic("decision-log.md", "# Decision log\n\n## 任务身份\n\n- **任务类型**：普通任务\n");
  for (const name of ["spec.md", "plan.md", "tasks.md"]) artifacts.writeAtomic(name, `# ${name}\n`);

  // host config：third_review/wh_review 可解析，但 provider 命令指向不存在路径
  // （「config 无可用 provider」）。
  const home = join(root, "home");
  const hostDir = join(home, ".config", "workflowhub");
  mkdirSync(hostDir, { recursive: true });
  const attachmentRoot = join(root, "attachments");
  mkdirSync(attachmentRoot);
  const configPath = join(root, "providers.json");
  writeFileSync(configPath, JSON.stringify({
    tiers: [["codex/luna"]],
    providers: { "codex/luna": { enabled: true, model: "reviewer-model", command: join(root, "missing-ocr-provider") } },
    attachment_roots: [{ root: attachmentRoot, sources: [".wh-review-packets"] }],
  }));
  writeFileSync(join(hostDir, "config.json"), JSON.stringify({
    task_dir: root,
    third_review: { command: [join(root, "missing-wh-review-broker")], config: configPath, attachment_root: attachmentRoot },
    wh_review: { version: 2, stages: { "build-code": { initial: ["codex/luna"], mode: "full_only", minimum_heterologous: 1 } } },
  }));
  return { root, home, task, workspace };
}

const ENV_KEYS = [
  "HOME", "WORKFLOWHUB_TASK_DIR", "PATH",
  "CODEX_SESSION_ID", "CODEX_THREAD_ID", "CODEX_ROLLOUT_PATH", "WORKFLOWHUB_CODEX_ROLLOUT_PATH",
];

async function withRuntimeEnvironment(updates, action) {
  const previous = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  for (const key of ENV_KEYS) {
    if (updates[key] === undefined) delete process.env[key];
    else process.env[key] = updates[key];
  }
  try {
    return await action();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

// PATH 中无可用 ocr（本机可能装有真实 ocr，须逐目录剔除）。
function pathWithoutOcr() {
  return (process.env.PATH ?? "").split(":").filter(Boolean).filter((dir) => {
    try {
      accessSync(join(dir, "ocr"), fsConstants.X_OK);
      return false;
    } catch {
      return true;
    }
  }).join(":");
}

function writeOcrStub(dir, version) {
  mkdirSync(dir);
  const stub = join(dir, "ocr");
  writeFileSync(stub, `#!/bin/sh
if [ "$1" = "--version" ]; then
  printf 'open-code-review v${version} (test-stub) darwin/arm64\\n'
  exit 0
fi
exit 1
`, { mode: 0o700 });
  return dir;
}

function reviewRequest() {
  return {
    stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P3",
    host_provider: "codex/luna",
    materials: { acceptance_criteria: "AC-1: the fallback review records the OCR availability fact." },
  };
}

function whReviewCompletedResult(request, materialId) {
  return {
    status: "available", stage: request.stage, review_track: null, review_kind: null,
    subject_kind: request.subject_kind, phase_id: request.phase_id ?? null,
    review_scope: request.review_scope ?? null,
    material_id: materialId, runtime_id: "wh-review-fallback-fixture", outcome: "completed",
    ocr: { version: "fixture-ocr", preview: { reviewable_files: [] }, rules: { rules: [] }, manifest: [] },
    provider_results: [{
      provider: "wh-review", status: "completed",
      identity: { provider: "wh-review", adapter: "wh-review", source_id: "wh-review", config_id: "fixture-config", model: "wh-review-runner" },
      error: null, timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null,
      evidence_anchor_valid: [],
    }],
    findings: [],
  };
}

function unavailableOcrResult(request, materialId) {
  return {
    status: "unavailable", stage: request.stage, review_track: null, review_kind: null,
    subject_kind: request.subject_kind, phase_id: request.phase_id ?? null,
    review_scope: request.review_scope ?? null,
    material_id: materialId, runtime_id: "ocr-unavailable-fixture", outcome: "unavailable",
    ocr: { version: "fixture-ocr", preview: { reviewable_files: [] }, rules: { rules: [] }, manifest: [] },
    findings: [], dispatch_state: "dispatched",
    error: { code: "OCR_ALL_PROVIDERS_FAILED", message: "controlled OCR provider failure" },
    provider_results: [{
      provider: "codex/luna", status: "failed",
      identity: { provider: "codex/luna", adapter: "codex", source_id: "fixture/source", config_id: "fixture/config", model: "fixture-model" },
      error: { code: "PROCESS_FAILED", message: "controlled OCR provider failure" },
      timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null,
      evidence_anchor_valid: [],
    }],
  };
}

const NOT_INSTALLED_FACT = /not[ _-]?installed|not found|未安装|enoent|missing|version/i;

describe("doctor reports OCR availability (T021)", () => {
  it.each([
    ["no ocr on PATH", null, "not_installed"],
    ["ocr stub at the minimum version 1.12.9 on PATH", "1.12.9", "installed"],
    ["ocr stub below the minimum version on PATH", "1.12.8", "not_installed"],
  ])("reports %s as %s", async (_label, stubVersion, expected) => {
    const state = fixture();
    const stubDir = stubVersion === null ? null : writeOcrStub(join(state.root, "bin"), stubVersion);
    const path = stubDir === null ? pathWithoutOcr() : `${stubDir}:${pathWithoutOcr()}`;
    await withRuntimeEnvironment(
      { HOME: state.home, WORKFLOWHUB_TASK_DIR: state.root, PATH: path },
      async () => {
        const doctor = await stageRuntimeMain([
          "doctor", "--stage=build-code", "--project=workflowhub", `--task=${state.task.identity.taskId}`,
        ], { cwd: state.workspace.worktreeRoot });
        expect(doctor.ocr).toBeDefined();
        expect(doctor.ocr.status).toBe(expected);
      });
  });
});

describe("code review falls back to wh-review only when OCR is not installed (T021)", () => {
  it("executes the same review surface through wh-review and records the fallback fact when OCR is missing", async () => {
    const state = fixture();
    const request = reviewRequest();
    const inputPath = join(state.root, "fallback-review.json");
    writeFileSync(inputPath, JSON.stringify({ request }));
    const materialId = "a".repeat(64);
    const calls = { ocr: 0, whReview: 0 };
    let whReviewRequest = null;
    await withRuntimeEnvironment(
      { HOME: state.home, WORKFLOWHUB_TASK_DIR: state.root, PATH: pathWithoutOcr() },
      async () => {
        const recorded = await stageRuntimeCliMain([
          "review", "--action=record", "--stage=build-code", "--project=workflowhub",
          `--task=${state.task.identity.taskId}`, `--input=${inputPath}`,
        ], {
          cwd: state.workspace.worktreeRoot,
          services: {
            resolveRouteIdentity: () => ({ route_identity: "b".repeat(64) }),
            materialIdForRequest: () => materialId,
            runOcrDelegationRound: async () => {
              calls.ocr += 1;
              return unavailableOcrResult(request, materialId);
            },
            runReviewRound: async (roundRequest) => {
              calls.whReview += 1;
              whReviewRequest = roundRequest;
              return whReviewCompletedResult(roundRequest, materialId);
            },
          },
        });

        // 回退：同一审查面由 wh-review 执行，OCR 路由未走。
        expect(calls).toEqual({ ocr: 0, whReview: 1 });
        expect(whReviewRequest).toMatchObject({
          stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: "P3",
        });
        expect(recorded.status).toBe("recorded");
        expect(recorded.result_ref).not.toBeNull();

        const attempt = JSON.parse(state.task.readRecord(recorded.attempt_ref));
        expect(attempt.provider_attempts).toHaveLength(1);
        expect(attempt.provider_attempts[0].provider).toBe("wh-review");
        expect(attempt.fallback).toBeDefined();
        expect(attempt.fallback.from).toBe("ocr");
        expect(String(attempt.fallback.reason)).toMatch(NOT_INSTALLED_FACT);
        expect(typeof attempt.fallback.detected_by).toBe("string");
        expect(attempt.fallback.detected_by.length).toBeGreaterThan(0);

        const review = JSON.parse(state.task.readRecord(recorded.result_ref));
        expect(review.provider_results[0].provider).toBe("wh-review");
        expect(review.fallback).toBeDefined();
        expect(review.fallback.from).toBe("ocr");
      });
  });

  it("records unavailable without fallback and without wh-review when OCR is installed but the provider fails", async () => {
    const state = fixture();
    const stubDir = writeOcrStub(join(state.root, "bin"), "1.12.9");
    const request = reviewRequest();
    const inputPath = join(state.root, "installed-failing-review.json");
    writeFileSync(inputPath, JSON.stringify({ request }));
    const materialId = "d".repeat(64);
    const calls = { ocr: 0, whReview: 0 };
    await withRuntimeEnvironment(
      { HOME: state.home, WORKFLOWHUB_TASK_DIR: state.root, PATH: `${stubDir}:${pathWithoutOcr()}` },
      async () => {
        const recorded = await stageRuntimeCliMain([
          "review", "--action=record", "--stage=build-code", "--project=workflowhub",
          `--task=${state.task.identity.taskId}`, `--input=${inputPath}`,
        ], {
          cwd: state.workspace.worktreeRoot,
          services: {
            resolveRouteIdentity: () => ({ route_identity: "e".repeat(64) }),
            materialIdForRequest: () => materialId,
            runOcrDelegationRound: async () => {
              calls.ocr += 1;
              return unavailableOcrResult(request, materialId);
            },
            runReviewRound: async (roundRequest) => {
              calls.whReview += 1;
              return whReviewCompletedResult(roundRequest, materialId);
            },
          },
        });

        expect(calls).toEqual({ ocr: 1, whReview: 0 });
        expect(recorded.result_ref).toBeNull();
        const attempt = JSON.parse(state.task.readRecord(recorded.attempt_ref));
        expect(attempt).toMatchObject({ terminal_status: "unavailable" });
        expect(attempt).not.toHaveProperty("fallback");
      });
  });
});
