// CARD-03 P4 预写测试：T008（ORACLE-REV-001）、T009（ORACLE-REV-002）、T010（ORACLE-SKL-003）。
// 夹具沿用 tests/contract/review-material-change-redispatch.test.mjs 的最小任务仓。
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { compactReviewDiff } from "../../runtime/review/review-input-bounds.mjs";
import { recordSimpleReviewRequest, recordSimpleReviewResult } from "../../runtime/review/review-record-route.mjs";
import { reviewPacketMaterialId } from "../../runtime/review/review-packet-identity.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { reviewInstructionsFor } from "../../skills/wh-review/scripts/review-materials.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const readRepo = (path) => readFileSync(resolve(repoRoot, path), "utf8");
const roots = [];

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-card03-review-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub card03 test"]);
  git(["config", "user.email", "card03@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "card03 review fixture\n", "utf8");
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
      created_at: "2026-09-19T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const workspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  for (const [name, content] of Object.entries({
    "decision-log.md": "# Decision\n", "spec.md": "# Spec\n", "plan.md": "# Plan\n", "tasks.md": "# Tasks\n",
  })) artifacts.writeAtomic(name, content);
  return { task, kernel: createTaskKernel(task, { candidateWorkspace: workspace, artifacts }) };
}

const route = () => ({ route_identity: "a".repeat(64) });

function reviewResult(input, overrides = {}) {
  return {
    status: "available",
    stage: input.stage,
    material_id: reviewPacketMaterialId(input),
    runtime_id: "card03-review-fixture",
    outcome: "completed",
    provider_results: [{
      provider: "codex/luna",
      status: "completed",
      identity: { provider: "codex/luna", adapter: "codex", source_id: "codex/luna", config_id: "fixture-config", model: "gpt-5.6-luna" },
      error: null,
      timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 },
      usage: null,
      evidence_anchor_valid: [],
    }],
    findings: [],
    ...overrides,
  };
}

const attemptCount = (task) => task.listCanonicalReviewAttemptRefs().length;
const goodRequest = { stage: "build-code", host_provider: "codex/luna", materials: { approved_spec: "spec.md" } };

async function expectRejectedBeforeDispatch(request, reason) {
  const state = fixture();
  let dispatches = 0;
  const startedAt = Date.now();
  await expect(recordSimpleReviewRequest({
    task: state.task, kernel: state.kernel, request, resolveRouteIdentity: route,
    runRound: async (input) => { dispatches += 1; return reviewResult(input); },
  })).rejects.toThrow(reason);
  expect(Date.now() - startedAt).toBeLessThan(1000);
  expect(dispatches).toBe(0);
  expect(attemptCount(state.task)).toBe(0);
}

describe("ORACLE-REV-001 review request precheck, bad results and packet narrowing", () => {
  it("rejects a request that also carries a result before any attempt exists", async () => {
    await expectRejectedBeforeDispatch({ ...goodRequest, result: { findings: [] } }, /result/);
  });

  it("rejects host-owned identity fields before any attempt exists", async () => {
    await expectRejectedBeforeDispatch({ ...goodRequest, snapshot_tree: "b".repeat(40) }, /host-owned: snapshot_tree/);
  });

  it("rejects a stage without semantic_fields in stage-materials.json before any attempt exists", async () => {
    await expectRejectedBeforeDispatch({ ...goodRequest, stage: "no-such-stage" }, /no-such-stage/);
  });

  it("rejects material keys outside the stage semantic fields before any attempt exists", async () => {
    await expectRejectedBeforeDispatch(
      { ...goodRequest, materials: { approved_spec: "spec.md", not_a_semantic_field: "x" } },
      /not_a_semantic_field/,
    );
  });

  it("dispatches a request without a caller host_provider instead of requiring one", async () => {
    // card-03 reversed the old expectation: host_provider is no longer part of a
    // review request, so omitting it (and even sending an empty value) must
    // dispatch and record normally, and no reachable path may fail with
    // "host_provider is required".
    for (const request of [
      { stage: "build-code", materials: { approved_spec: "spec.md" } },
      { ...goodRequest, host_provider: "" },
    ]) {
      const state = fixture();
      let dispatches = 0;
      const recorded = await recordSimpleReviewRequest({
        task: state.task, kernel: state.kernel, request, resolveRouteIdentity: route,
        runRound: async (input) => { dispatches += 1; return reviewResult(input); },
      });
      expect(dispatches).toBe(1);
      expect(recorded).toMatchObject({ status: "recorded", dispatch_state: "dispatched", reused: false });
      expect(attemptCount(state.task)).toBe(1);
    }
    const reachable = [
      readRepo("runtime/review/review-record-route.mjs"),
      readRepo("skills/wh-review/scripts/simple-review-runner.mjs"),
      readRepo("skills/wh-review/scripts/third-review-host-config.mjs"),
    ];
    for (const source of reachable) expect(source).not.toMatch(/host_provider is required/);
  });

  it("records a malformed provider result as unavailable with a reason and does not redispatch it", async () => {
    const state = fixture();
    let dispatches = 0;
    const runRound = async (input) => { dispatches += 1; return reviewResult(input, { findings: "not-an-array" }); };
    const first = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: goodRequest, resolveRouteIdentity: route, runRound });
    const attempt = JSON.parse(state.task.readRecord(first.attempt_ref));
    expect(attempt.terminal_status).toBe("unavailable");
    expect(attempt.error?.code).toMatch(/^[A-Z_]+$/);
    expect(attempt.error?.message).toBeTruthy();
    expect(first.result_ref ?? null).toBeNull();

    const repeated = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: goodRequest, resolveRouteIdentity: route, runRound });
    expect(dispatches).toBe(1);
    expect(repeated).toMatchObject({ reused: true, attempt_ref: first.attempt_ref });
  });

  it("adds no CLI verb and no dispatch_state value for asynchronous review", () => {
    const cli = readRepo("tools/cli/stage-runtime.mjs");
    expect(cli).not.toMatch(/--async\b/);
    expect(cli).not.toMatch(/["']collect["']/);
    const attemptSchema = readRepo("runtime/review/schemas/attempt.schema.json");
    const dispatchState = JSON.parse(attemptSchema).properties?.dispatch_state?.enum
      ?? JSON.parse(attemptSchema.match(/"dispatch_state"\s*:\s*(\{[^}]*\})/)[1]).enum;
    expect(dispatchState).toEqual(["dispatched", "blocked_before_dispatch", "sent_unparsed", "reused"]);
    expect(attemptSchema).not.toMatch(/result_invalid/);
  });

  it("narrows the review packet to declared write set ∩ real diff without binding identity", () => {
    const section = (path) => `diff --git a/${path} b/${path}\n--- a/${path}\n+++ b/${path}\n@@ -1 +1 @@\n-old\n+new\n`;
    const diff = [section("runtime/review/in-scope.mjs"), section("docs/out-of-scope.md")].join("");
    const compacted = compactReviewDiff(diff, { writeSet: ["runtime/review/in-scope.mjs", "runtime/review/untouched.mjs"] });
    expect(compacted.diff).toContain("runtime/review/in-scope.mjs");
    expect(compacted.diff).not.toContain("docs/out-of-scope.md");
    expect(compacted.diff).not.toContain("runtime/review/untouched.mjs");
    expect(JSON.stringify(compacted.index)).not.toMatch(/material_id|snapshot_tree|material_revision|task_id/);
  });
});

// 缺陷③ 夹具：当前命名空间的一对 canonical 评审记录（red/blue），写入后把其中一个
// 成员记录的 pair 绑定字段（material_id）改坏。这不是 foreign 记录（stage/snapshot/
// material_revision/review_scope 都与本次请求同命名空间），所以读取器不能按
// 「旧 pair 跳过」处理。
const DAMAGED_PAIR_ID = "card03-rev-002-damaged-pair";
const DAMAGED_PAIR_REQUEST_KEY = "p".repeat(64);
const DAMAGED_PAIR_MATERIAL_ID = "c".repeat(64);

function pairMember(role, provider) {
  const adapter = provider.startsWith("claude/") ? "claude" : "codex";
  const identity = { provider, adapter, source_id: provider, config_id: "fixture-config", model: "gpt-5.6-luna" };
  return {
    status: "available",
    stage: "build-code",
    review_track: null,
    review_kind: null,
    review_scope: "integration",
    subject_kind: "worktree",
    role,
    pair_id: DAMAGED_PAIR_ID,
    minimum_heterologous: 1,
    material_id: DAMAGED_PAIR_MATERIAL_ID,
    runtime_id: "card03-review-fixture",
    outcome: "completed",
    provider_results: [{
      provider,
      status: "completed",
      identity,
      error: null,
      timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 },
      usage: null,
      evidence_anchor_valid: [],
    }],
    findings: [],
    provider_selection: { providers: [provider], provider_identities: { [provider]: identity } },
  };
}

function writeDamagedPair(state) {
  const red = pairMember("red", "codex/luna");
  const blue = pairMember("blue", "claude/opus");
  const summary = recordSimpleReviewResult({
    task: state.task,
    kernel: state.kernel,
    requestKey: DAMAGED_PAIR_REQUEST_KEY,
    result: {
      status: "available",
      stage: "build-code",
      review_track: null,
      review_kind: null,
      review_scope: "integration",
      subject_kind: "worktree",
      pair_id: DAMAGED_PAIR_ID,
      minimum_heterologous: 1,
      material_id: DAMAGED_PAIR_MATERIAL_ID,
      runtime_id: null,
      outcome: "completed",
      provider_results: [...red.provider_results, ...blue.provider_results],
      findings: [],
      role_results: { red, blue },
    },
  });
  const damagedRef = summary.role_results.blue.attempt_ref;
  const damaged = JSON.parse(state.task.readRecord(damagedRef));
  // 只改坏「这条成员记录与那一对记录的绑定字段」，不改报告里的语义/覆盖声明：
  // 这不是伪造 coverage（那仍须 fail-closed），而是配对链接断掉。
  damaged.material_id = "d".repeat(64);
  state.task.writeRecordAtomic(damagedRef, JSON.stringify(damaged));
  return { summary, damagedRef, damagedBytes: state.task.readRecord(damagedRef) };
}

describe("ORACLE-REV-002 partial coverage and same-triple reuse", () => {
  it("no longer lets the historical flag release partial coverage", () => {
    expect(readRepo("runtime/review/review-record-route.mjs")).not.toMatch(/allowHistoricalPartialCoverage/);
  });

  it("reuses an existing semantic result for the same review triple instead of dispatching", async () => {
    const state = fixture();
    let dispatches = 0;
    const runRound = async (input) => { dispatches += 1; return reviewResult(input); };
    const first = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: goodRequest, resolveRouteIdentity: route, runRound });
    const repeated = await recordSimpleReviewRequest({ task: state.task, kernel: state.kernel, request: goodRequest, resolveRouteIdentity: route, runRound });
    expect(dispatches).toBe(1);
    expect(repeated).toMatchObject({ reused: true, dispatch_state: "reused", attempt_ref: first.attempt_ref, result_ref: first.result_ref });
    expect(attemptCount(state.task)).toBe(1);
  });

  it("does not let one damaged pair member abort the whole history read", async () => {
    const state = fixture();
    // 同一命名空间里已有一条健康的历史（这一次请求自己的语义结果）。
    const healthy = await recordSimpleReviewRequest({
      task: state.task, kernel: state.kernel, request: goodRequest, resolveRouteIdentity: route,
      runRound: async (input) => reviewResult(input),
    });
    // 再放进一对成员记录被改坏的同命名空间 pair。
    const { damagedRef, damagedBytes } = writeDamagedPair(state);

    let dispatches = 0;
    const settled = await recordSimpleReviewRequest({
      task: state.task, kernel: state.kernel, request: goodRequest, resolveRouteIdentity: route,
      runRound: async (input) => { dispatches += 1; return reviewResult(input); },
    }).then((value) => ({ value }), (error) => ({ error }));

    // 一条损坏的 pair 成员只该让那一对记录被跳过：整次历史读取不得中断，同命名空间
    // 里另一条健康的成员记录必须照常读回并被复用（零派发）。
    expect(
      settled.error,
      `一条损坏的 pair 成员拖垮了整次历史读取：${settled.error?.code ?? ""} ${String(settled.error?.message ?? "")}`,
    ).toBeUndefined();
    expect(settled.value, "损坏成员所在的那对记录之外的健康成员必须照常读回").toMatchObject({
      reused: true, dispatch_state: "reused", attempt_ref: healthy.attempt_ref, result_ref: healthy.result_ref,
    });
    expect(dispatches).toBe(0);
    // 容忍 ≠ 删除：损坏记录原样保留，不被静默改写。
    expect(state.task.readRecord(damagedRef)).toBe(damagedBytes);
  });
});

describe("ORACLE-SKL-003 runner reviewer skills follow stage-skill-plan.json", () => {
  const plan = JSON.parse(readRepo("skills/wh-review/stage-skill-plan.json"));
  for (const stage of ["build-plan", "build-code", "verify-code"]) {
    it(`${stage} instructions name exactly the plan required_skills`, () => {
      const required = plan.stages[stage].required_skills;
      const text = reviewInstructionsFor(stage);
      for (const name of required) expect(text).toContain(`skills/${name}/SKILL.md`);
      expect(text).not.toContain("skills/plan-eng-review/SKILL.md");
    });
  }

  it("keeps the frozen build-plan plan entry unchanged", () => {
    expect(plan.stages["build-plan"].required_skills).toEqual(["review"]);
  });
});
