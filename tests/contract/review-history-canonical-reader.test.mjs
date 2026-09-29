// ============================================================================
// CARD-04 / P6 / T014 —— 「canonical 评审历史读取器」预置测试：**政策对齐重写版**
// ----------------------------------------------------------------------------
// 本文件是**政策对齐重写版**，不是原版。
//
// 原版（5 个 it）要求本卡自己修 `runtime/review/review-record-route.mjs` 的读取器
// 缺陷（合法历史被误判为 "canonical review pair member binding is invalid"），
// 且其中两条负控与 CARD-05 已落库的 foreign-pair 政策直接冲突（互相打架的雷）。
// 用户 2026-09-23 裁定：**重叠实现让出给 CARD-05**（该文件修复归 CARD-05），
// 本卡不得改 `runtime/**`，只做**消费/核验**。因此本文件按 CARD-05 的政策重写，
// **原版已撤回**；撤回前的原始复现证据见
// `<事实目录>/quality/evidence/prewritten-red/P6-T014-reader-defect-repro.txt`。
//
// ## 被测政策（CARD-05 落库的政策，本卡只消费）
//   1) 「foreign pair」（不属于本次请求命名空间的旧 pair）即使某个成员在**现快照规则**
//      下被省略/无法重建，也**不得**阻断本次请求；历史只被跳过，不被删除。
//   2) 「current pair」（属于本次请求命名空间）保持严格：成员报告丢失 role binding、
//      或被伪造 coverage，都必须 fail-closed（零派发），不得被静默接受。
//   3) 结构合法但历史形态特殊（pair 成员 `terminal_status="unavailable"`、pair 摘要记
//      `semantic_status="available"` / `coverage="incomplete"` / `result_ref=null`）
//      的历史是**合法历史**，读取器不得判它损坏。
//
// ## 跨卡耦合（重要，供下游与审查者）
//   * it[B]（以及 it[A2]）依赖 CARD-05 落地的 foreign-pair 政策：夹具保证了该政策的
//     **前置条件真实发生** —— 旧 pair 的一个 partial 成员在现快照规则下确实被省略
//     （见下面的「历史投影归一化」）。若 CARD-05 最终落地形态与该政策不同（例如
//     foreign pair 仍参与阻断、或改成删除历史），it[B] 会红 —— 这是**有意的跨卡守卫**，
//     不得为让它变绿而放宽断言。
//   * 已实测：把 CARD-05 的两个政策 hunk 应用到 HEAD 的副本上，it[A2]/it[B] 转绿，
//     其余 it 保持绿；只应用 hunk 2（覆盖规则）而**不**应用 hunk 1（foreign pair 跳过）
//     时 it[A2]/it[B] 仍红，证明本 it 真正守卫 hunk 1，不是空转。
//
// ## 夹具为什么要把历史「归一化」回升级前投影（必读）
//   本文件的断言必须在**两种写入器政策**下都成立：本卡 HEAD（升级前）与 CARD-05 落地后。
//   但「合法的 partial 历史」这一形态本身会随写入器政策漂移：
//     * `runtime/review/review-record-route.mjs:1653`（HEAD）要求**配对**写入必须声明
//       `minimum_heterologous`，否则抛 "role review policy minimum is required"；
//     * CARD-05 新增的 `hasDeclaredQuorum`（同文件 :1729 一带）把「声明了 quorum 的
//       partial 成员」视为**已覆盖**，于是同一个夹具在 CARD-05 之后会写出
//       `coverage="satisfied"` 的成员，而不再是本卡要断言的 `coverage="incomplete"`。
//   因此夹具先用**公开 API**写入（`recordSimpleReviewResult`），再把成员记录归一化回
//   「升级前写入器本来会写下的投影」：成员报告 coverage → `"incomplete"`、成员 attempt
//   记录 `terminal_status` → `"unavailable"`（并去掉 `result_ref`）、pair 摘要里该 role
//   的条目 `coverage → "incomplete"` / `result_ref → null`。
//   在 HEAD 上这些归一化是 **no-op**（写入器本来就写这个形态，实测一致）；在 CARD-05
//   之后它们把记录还原成升级前写入器写下的历史形态 —— 这正是 CARD-05 政策针对的、
//   系统中真实存在过的历史。归一化只改「读取器要读的形态字段」，不改变 pair 的命名空间
//   归属（快照推进后它依旧是 foreign）。
//
// ## 自始为绿的不变式（在重写当时的 HEAD 上即为绿，且必须一直保持绿）
//   * it[A1] 形态自证（合法历史形态）
//   * it[C]  负控：current pair 丢失 role binding → fail-closed + 零派发
//   * it[D]  负控：current pair 的成员报告 coverage 绑定被伪造 → fail-closed + 零派发
//   * it[E]  形状自证：结构完整的 current pair 正常读回并派发一次
//   目标 RED（在重写当时的 HEAD 上必须红、CARD-05 落库后转绿）：it[A2]、it[B]。
//
// ## 与卡面文字的解读分歧（有意为之，已上报）
//   卡面 C 项要求「以 `REVIEW_HISTORY_UNAVAILABLE` 失败」。但在 HEAD 与 CARD-05 的现行
//   实现里，**当前命名空间**的 pair 损坏会在 `recordSimpleReviewRequest` 的
//   `review_attempt_ref` 分类路径上被升级为**更具体的** `REVIEW_RECORD_INCOMPLETE`
//   （CARD-05 自己的负控测试断言的也是 `REVIEW_RECORD_INCOMPLETE`）；
//   `REVIEW_HISTORY_UNAVAILABLE` 是**跨命名空间**损坏的通用裁决。
//   因此 it[C]/it[D] 断言的是**政策不变式**——fail-closed 裁决落在闭集
//   `[REVIEW_RECORD_INCOMPLETE, REVIEW_HISTORY_UNAVAILABLE]` 内 + `dispatches === 0`
//   + 不是静默成功——而不锁死其中某一个码的实现细节（卡面要求「对齐政策，而不是对齐
//   CARD-05 的实现细节」）。事实断言（派发次数）见 it[F] 的要求，逐 it 落具体数字。
//
// 约束：本卡只改这一个仓库文件；不得改 `runtime/**`、`tools/**`、其它测试；不新增依赖。
// 断言对象是**读取器裁决**，不是 provider 成败（夹具无真实 provider，派发结果按不可用记录
// 是允许的）。
// ============================================================================

import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { recordSimpleReviewRequest, recordSimpleReviewResult } from "../../runtime/review/review-record-route.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { createSimpleReviewPacket } from "../../skills/wh-review/scripts/simple-review-runner.mjs";

const PAIR_ID = "card-04-p6-t014-pair";
const REQUEST_KEY = "k".repeat(64);
const HISTORY_UNAVAILABLE = "REVIEW_HISTORY_UNAVAILABLE";
const RECORD_INCOMPLETE = "REVIEW_RECORD_INCOMPLETE";
// 见文件头「解读分歧」：fail-closed 的**闭集**，不锁死单一实现码。
const FAIL_CLOSED_HISTORY_CODES = [RECORD_INCOMPLETE, HISTORY_UNAVAILABLE];
const PAIR_BINDING_MESSAGE = "canonical review pair member binding is invalid";
const REPORT_BINDING_MESSAGE = "canonical review report binding is invalid";
const MISSING_ATTEMPT_REF = "quality/reviews/attempts/missing/attempt.json";
const PUBLIC_BLOCK_ANCHOR = "## Public result and coverage";
const JSON_FENCE = "```json\n";

const roots = [];

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop(), { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// 记录读写小工具：只动 JSON 围栏里的那一个块，围栏外的字节原样保留。
// （写入器用 `JSON.stringify(body, null, 2)` 落盘，所以这样重写与原文逐字节一致。）
// ---------------------------------------------------------------------------

function readFencedJson(raw, anchor) {
  const anchorIndex = raw.indexOf(anchor);
  if (anchorIndex < 0) throw new Error(`fixture: anchor is missing: ${anchor}`);
  const bodyStart = raw.indexOf(JSON_FENCE, anchorIndex) + JSON_FENCE.length;
  const bodyEnd = raw.indexOf("\n```", bodyStart);
  if (bodyEnd < 0) throw new Error("fixture: json fence is unterminated");
  return { bodyStart, bodyEnd, body: JSON.parse(raw.slice(bodyStart, bodyEnd)) };
}

function rewriteFencedJson(task, ref, anchor, mutate) {
  const raw = task.readRecord(ref);
  const { bodyStart, bodyEnd, body } = readFencedJson(raw, anchor);
  mutate(body);
  task.writeRecordAtomic(ref, `${raw.slice(0, bodyStart)}${JSON.stringify(body, null, 2)}${raw.slice(bodyEnd)}`);
}

function publicBlock(task, ref) {
  return readFencedJson(task.readRecord(ref), PUBLIC_BLOCK_ANCHOR).body;
}

// ---------------------------------------------------------------------------
// 夹具：经**公开 API**（createTask / prepareTaskWorkspace / ArtifactDir / recordSimpleReviewResult）
// 写入真实历史，然后经 recordSimpleReviewRequest 发起请求。夹具不注入 provider。
// ---------------------------------------------------------------------------

function makeFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "card-04-review-history-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "card-04"]);
  git(["config", "user.email", "card-04@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "review history fixture\n", "utf8");
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
      created_at: "2026-09-23T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const candidateWorkspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidateWorkspace.worktreeRoot, task);
  const kernel = createTaskKernel(task, { candidateWorkspace, artifacts });
  return { task, kernel, artifacts };
}

function providerResult(overrides = {}) {
  return {
    provider: "codex/luna",
    status: "completed",
    identity: { provider: "codex/luna", adapter: "codex", source_id: "codex/luna", config_id: "cfg", model: "gpt-5.6-luna" },
    error: null,
    timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 },
    usage: null,
    evidence_anchor_valid: [],
    ...overrides,
  };
}

function baseResult() {
  return {
    status: "available",
    stage: "make-decision",
    review_track: "detail",
    review_kind: null,
    material_id: "8192849eab3a861772ed1e409e72ff43eae462b16bc6437193483fc905d8260d",
    runtime_id: "runtime-123",
    outcome: "completed",
    provider_results: [providerResult({ evidence_anchor_valid: [true] })],
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

// 合法的「覆盖不完整」成员：1 个 provider 失败 + 2 个成功、声明了 minimum_heterologous
// （配对写入在 HEAD 上要求它，见 runtime/review/review-record-route.mjs:1653）。
// 归一化后的形态正是真实事故里被判成「pair 成员绑定损坏」的那一种
// （见 P6-T014-reader-defect-repro.txt）。
function partialBlueMember() {
  const providers = ["claude/opus", "gemini/pro", "qwen/max"];
  const results = [
    providerResult({
      provider: providers[0],
      identity: { provider: providers[0], adapter: "claude", source_id: providers[0], config_id: "cfg", model: "opus-4" },
      status: "failed",
      error: { code: "PROCESS_DEAD", message: "blue provider failed" },
    }),
    providerResult({
      provider: providers[1],
      identity: { provider: providers[1], adapter: "gemini", source_id: providers[1], config_id: "cfg", model: "pro-3" },
    }),
    providerResult({
      provider: providers[2],
      identity: { provider: providers[2], adapter: "qwen", source_id: providers[2], config_id: "cfg", model: "max" },
    }),
  ];
  return {
    results,
    selection: {
      providers,
      provider_identities: Object.fromEntries(results.map((item) => [item.provider, { ...item.identity }])),
    },
  };
}

function pairResult({ complete }) {
  const red = { ...baseResult(), role: "red", pair_id: PAIR_ID, minimum_heterologous: 1 };
  red.provider_selection = {
    providers: ["codex/luna"],
    provider_identities: { "codex/luna": { ...red.provider_results[0].identity } },
  };
  let blue;
  if (complete) {
    blue = {
      ...baseResult(),
      role: "blue",
      pair_id: PAIR_ID,
      minimum_heterologous: 1,
      outcome: "completed",
      findings: [],
      provider_results: [
        providerResult({
          provider: "claude/opus",
          identity: { provider: "claude/opus", adapter: "claude", source_id: "claude/opus", config_id: "cfg", model: "opus-4" },
        }),
      ],
    };
    blue.provider_selection = {
      providers: ["claude/opus"],
      provider_identities: { "claude/opus": { ...blue.provider_results[0].identity } },
    };
  } else {
    const { results, selection } = partialBlueMember();
    blue = {
      ...baseResult(),
      role: "blue",
      pair_id: PAIR_ID,
      minimum_heterologous: 1,
      status: "available-with-failures",
      outcome: "partial",
      findings: [],
      provider_results: results,
      provider_selection: selection,
    };
  }
  return {
    status: complete ? "available" : "available-with-failures",
    stage: "make-decision",
    review_track: "detail",
    review_kind: null,
    pair_id: PAIR_ID,
    material_id: red.material_id,
    runtime_id: null,
    outcome: complete ? "completed" : "partial",
    provider_results: [...red.provider_results, ...blue.provider_results],
    findings: red.findings,
    role_results: { red, blue },
  };
}

// 写入一对评审结果，返回写入器给回的 pair 摘要（含每个 role 的 refs）。
function writePair({ complete = false, blueMinimum = null } = {}) {
  const fixture = makeFixture();
  const result = pairResult({ complete });
  if (blueMinimum !== null) result.role_results.blue.minimum_heterologous = blueMinimum;
  const written = recordSimpleReviewResult({
    task: fixture.task,
    kernel: fixture.kernel,
    result,
    requestKey: REQUEST_KEY,
  });
  return { ...fixture, written, blue: written.role_results.blue, red: written.role_results.red };
}

// 把记录归一化回「升级前（pre-CARD-05）写入器」的投影；在 HEAD 上是 no-op。
// 见文件头「夹具为什么要把历史归一化回升级前投影」。只改读取器要读的形态字段：
// 成员报告的 coverage、成员 attempt 的 terminal_status / result_ref、pair 摘要里该 role 的条目。
function normalizeToLegacyProjection({ task, written, blue }) {
  const attempt = JSON.parse(task.readRecord(blue.attempt_ref));
  const { result_ref: _droppedResultRef, ...legacyAttempt } = attempt;
  task.writeRecordAtomic(blue.attempt_ref, JSON.stringify({
    ...legacyAttempt,
    terminal_status: "unavailable",
    error: attempt.error ?? { code: "REVIEW_QUORUM_INCOMPLETE", message: "semantic member outputs retained; independent review coverage is incomplete" },
  }));
  rewriteFencedJson(task, blue.report_ref, PUBLIC_BLOCK_ANCHOR, (block) => {
    block.coverage = "incomplete";
  });
  rewriteFencedJson(task, written.report_ref, JSON_FENCE, (summary) => {
    summary.role_results.blue.coverage = "incomplete";
    summary.role_results.blue.result_ref = null;
  });
  // 同步内存里的摘要视图（writePair 返回的就是同一个对象），让夹具自证与磁盘记录一致。
  written.role_results.blue.coverage = "incomplete";
  written.role_results.blue.result_ref = null;
}

// 一份「升级前写入器写下的合法历史」：一个覆盖不完整的成员 + 一个完整成员。
function writeLegalPartialHistory() {
  const fixture = writePair();
  normalizeToLegacyProjection(fixture);
  return fixture;
}

// The historical d1 red result predates source_strength in the derived
// aggregation. Keep a byte-accurate old projection in this AC-25 fixture.
function normalizeLegacySourceStrength({ task, red }) {
  const result = JSON.parse(task.readRecord(red.result_ref));
  for (const finding of result.findings) delete finding.source_strength;
  for (const cluster of result.adjudication.clusters) delete cluster.source_strength;
  task.writeRecordAtomic(red.result_ref, JSON.stringify(result));
  const report = task.readRecord(red.report_ref);
  const first = /```json\n([^\n]+)\n```/.exec(report);
  if (!first) throw new Error("fixture: compact canonical result block is missing");
  const body = JSON.parse(first[1]);
  for (const finding of body.findings) delete finding.source_strength;
  task.writeRecordAtomic(red.report_ref, report.slice(0, first.index)
    + "```json\n" + JSON.stringify(body) + "\n```"
    + report.slice(first.index + first[0].length));
}

function normalizeLegacyPartialReport({ task, blue }) {
  const attempt = JSON.parse(task.readRecord(blue.attempt_ref));
  const report = task.readRecord(blue.report_ref);
  const publicStart = report.indexOf("\n## Public result and coverage\n");
  const canonicalBlock = report.indexOf("\n\n```json\n");
  if (publicStart < 0 || canonicalBlock < 0 || canonicalBlock >= publicStart) {
    throw new Error("fixture: published partial report shape is missing");
  }
  const header = report.slice(0, canonicalBlock)
    .replace("status: available", "status: unavailable")
    .replace("terminal_status: semantic", "terminal_status: unavailable")
    .replace("error: null", `error: ${JSON.stringify(attempt.error)}`);
  task.writeRecordAtomic(blue.report_ref, header + "\n" + report.slice(publicStart));
  // The old writer did not publish a canonical result for this member.
  unlinkSync(join(task.taskPath, `quality/reviews/results/make-decision-simple-${attempt.attempt_id}.json`));
}

// 推进快照树：任何 artifact 写入都会让 kernel.currentVNextSnapshot().tree 变成新值，
// 于是此前写入的 pair 在**现快照规则**下不再属于本次请求的命名空间（= foreign），
// 且其 partial 成员在历史读取时无法按现快照规则重建 → 该成员被省略（foreign 丢弃）。
function advanceSnapshot(artifacts) {
  artifacts.writeAtomic("tasks.md", "# Task bookkeeping after the paired review\n");
}

function makeDecisionRequest() {
  return { stage: "make-decision", host_provider: "codex", review_track: "detail", materials: { decision: "current decision" } };
}

function buildPlanRequest() {
  return { stage: "build-plan", host_provider: "codex/luna", materials: { plan: "current plan" } };
}

async function settle(promise) {
  try {
    return { result: await promise };
  } catch (error) {
    return { threw: error };
  }
}

function verdictCode(settled) {
  return settled.threw?.code ?? settled.result?.error?.code ?? null;
}

function verdictMessage(settled) {
  const raw = settled.threw?.message ?? settled.result?.error?.message ?? "";
  return String(raw);
}

function verdictOf(settled, dispatches) {
  return JSON.stringify({
    threw: settled.threw ? { code: settled.threw.code ?? null, message: String(settled.threw.message ?? settled.threw) } : null,
    result: settled.result
      ? {
          status: settled.result.status ?? null,
          dispatch_state: settled.result.dispatch_state ?? null,
          error_code: settled.result.error?.code ?? null,
          error_message: settled.result.error?.message ?? null,
          result_ref: settled.result.result_ref ?? null,
        }
      : null,
    dispatches,
  });
}

// 发起一次评审请求。夹具无真实 provider：available=false 时本轮按「不可用」记录
// （这是允许的，断言对象是读取器是否放行，而不是 provider 成败）。
async function issueRequest({ task, kernel, request, available = false }) {
  let dispatches = 0;
  const runRound = async (input) => {
    dispatches += 1;
    const common = {
      ...baseResult(),
      stage: input.stage,
      review_track: input.review_track ?? null,
      review_kind: input.review_kind ?? null,
      material_id: createSimpleReviewPacket(input).material_id,
    };
    if (available) return common;
    return {
      ...common,
      status: "unavailable",
      provider_results: [],
      findings: [],
      error: { code: "PROCESS_TIMEOUT", message: "fixture round unavailable" },
    };
  };
  const settled = await settle(
    recordSimpleReviewRequest({
      task,
      kernel,
      request,
      resolveRouteIdentity: () => ({ route_identity: "a".repeat(64) }),
      materialIdForRequest: (input) => createSimpleReviewPacket(input).material_id,
      runRound,
    }),
  );
  return { ...settled, dispatches };
}

describe("canonical 评审历史读取器：政策对齐重写版（T014 gate）", () => {
  it("A① 形态自证（自始为绿）：夹具写出的合法历史形态 = unavailable 成员 + 摘要 available/incomplete/result_ref=null", async () => {
    const { task, written, blue, red } = writeLegalPartialHistory();

    // 合法历史形态本身：一个成员在语义上可用但覆盖不完整（没有 canonical result），
    // 因此没有 result_ref、成员记录是 unavailable 终态；pair 摘要如实记下这些事实。
    expect(blue.semantic_status).toBe("available");
    expect(blue.coverage).toBe("incomplete");
    expect(blue.result_ref, "摘要里覆盖不完整的成员不得带 result_ref").toBeNull();
    expect(publicBlock(task, blue.report_ref).coverage).toBe("incomplete");
    expect(publicBlock(task, blue.report_ref).semantic_status).toBe("available");
    const blueAttempt = JSON.parse(task.readRecord(blue.attempt_ref));
    expect(blueAttempt.terminal_status).toBe("unavailable");
    expect(Object.hasOwn(blueAttempt, "result_ref"), "升级前投影的 unavailable 成员不带 result_ref").toBe(false);

    expect(red.coverage).toBe("satisfied");
    expect(red.result_ref, "完全覆盖的成员必须带 result_ref").toBeTruthy();
    expect(JSON.parse(task.readRecord(red.attempt_ref)).terminal_status).toBe("semantic");

    expect(written.pair_id).toBe(PAIR_ID);
    expect(written.semantic_status).toBe("available");
    expect(written.partial).toBe(true);
    expect(task.readRecord(written.report_ref)).toContain(PAIR_ID);
    expect(Object.keys(written.role_results).sort().join(",")).toBe("blue,red");
  });

  it("AC-25 同快照合法 partial pair 可读，缺报告与伪造 canonical ref 仍拒绝", async () => {
    const { task, kernel, written, blue, red } = writeLegalPartialHistory();
    normalizeLegacySourceStrength({ task, red });
    normalizeLegacyPartialReport({ task, blue });
    const originalAttempt = task.readRecord(blue.attempt_ref);
    const originalPair = task.readRecord(written.report_ref);
    const readable = await issueRequest({ task, kernel, request: makeDecisionRequest() });
    const verdict = `${verdictOf(readable, readable.dispatches)} ref=${readable.threw?.review_attempt_ref ?? "none"}`;
    expect(verdictCode(readable), `合法同快照 pair 不应被判为损坏：${verdict}`).not.toBe(HISTORY_UNAVAILABLE);
    expect(verdictCode(readable), `合法同快照 pair 不应被判为损坏：${verdict}`).not.toBe(RECORD_INCOMPLETE);
    expect(verdictMessage(readable), `合法同快照 pair 报告绑定错误：${verdict}`).not.toContain(REPORT_BINDING_MESSAGE);
    expect(task.readRecord(blue.attempt_ref)).toBe(originalAttempt);
    expect(task.readRecord(written.report_ref)).toBe(originalPair);

    for (const damage of ["missing_report", "forged_result_ref"]) {
      const fixture = writeLegalPartialHistory();
      const memberRef = damage === "missing_report" ? fixture.blue.attempt_ref : fixture.red.attempt_ref;
      const attempt = JSON.parse(fixture.task.readRecord(memberRef));
      if (damage === "missing_report") {
        attempt.report_ref = "quality/reviews/reports/missing-ac25.md";
      } else {
        expect(attempt.terminal_status).toBe("semantic");
        attempt.result_ref = "quality/reviews/results/forged-ac25.json";
      }
      fixture.task.writeRecordAtomic(memberRef, JSON.stringify(attempt));
      const rejected = await issueRequest({ task: fixture.task, kernel: fixture.kernel, request: makeDecisionRequest() });
      const rejectedVerdict = verdictOf(rejected, rejected.dispatches);
      expect(rejected.dispatches, `${damage}: ${rejectedVerdict}`).toBe(0);
      expect(FAIL_CLOSED_HISTORY_CODES, `${damage}: ${rejectedVerdict}`).toContain(verdictCode(rejected));
    }

    const current = writePair({ complete: true });
    normalizeLegacySourceStrength(current);
    const sourceStrengthDamage = await issueRequest({
      task: current.task, kernel: current.kernel, request: makeDecisionRequest(),
    });
    const sourceStrengthVerdict = verdictOf(sourceStrengthDamage, sourceStrengthDamage.dispatches);
    expect(sourceStrengthDamage.dispatches, `当前 pair 同时删 result/report source_strength：${sourceStrengthVerdict}`).toBe(0);
    expect(FAIL_CLOSED_HISTORY_CODES, `当前 pair 同时删 result/report source_strength：${sourceStrengthVerdict}`)
      .toContain(verdictCode(sourceStrengthDamage));

    const belowQuorum = writePair({ blueMinimum: 3 });
    normalizeLegacySourceStrength(belowQuorum);
    const belowQuorumDamage = await issueRequest({
      task: belowQuorum.task, kernel: belowQuorum.kernel, request: makeDecisionRequest(),
    });
    const belowQuorumVerdict = verdictOf(belowQuorumDamage, belowQuorumDamage.dispatches);
    expect(belowQuorumDamage.dispatches, `当代真实未达 quorum 的 pair 删 source_strength：${belowQuorumVerdict}`).toBe(0);
    expect(FAIL_CLOSED_HISTORY_CODES, `当代真实未达 quorum 的 pair 删 source_strength：${belowQuorumVerdict}`)
      .toContain(verdictCode(belowQuorumDamage));
  });

  it("A② 合法历史可读：快照推进后（同命名空间）的旧 pair 不得被当成损坏的历史", async () => {
    const { task, kernel, artifacts, written, blue } = writeLegalPartialHistory();
    const before = { attempt: task.readRecord(blue.attempt_ref), report: task.readRecord(written.report_ref) };
    advanceSnapshot(artifacts);

    const settled = await issueRequest({ task, kernel, request: makeDecisionRequest() });
    const verdict = verdictOf(settled, settled.dispatches);
    expect(
      verdictCode(settled),
      `合法历史被误判为损坏：读取器以历史不可用拒绝了本次请求 —— ${verdict}`,
    ).not.toBe(HISTORY_UNAVAILABLE);
    expect(verdictMessage(settled), `诊断文本指认了 pair 成员绑定损坏：${verdict}`).not.toContain(PAIR_BINDING_MESSAGE);
    expect(verdictMessage(settled), `诊断文本指认了成员报告绑定损坏：${verdict}`).not.toContain(REPORT_BINDING_MESSAGE);
    expect(settled.dispatches, `读取器放行后本次请求必须真的派发了一次：${verdict}`).toBe(1);

    // 容忍 ≠ 删除：历史必须原样保留（跳过旧 pair 不等于抹掉旧 pair）。
    expect(task.readRecord(blue.attempt_ref), "旧 pair 成员记录被改写").toBe(before.attempt);
    expect(task.readRecord(written.report_ref), "旧 pair 摘要被删除或改写").toBe(before.report);
  });

  it("B foreign 旧 pair 的成员在现快照下缺失时不得阻断当前请求（跨卡守卫）", async () => {
    const { task, kernel, artifacts, written, blue } = writeLegalPartialHistory();
    advanceSnapshot(artifacts);

    // 前提：这个旧 pair 的 partial 成员在现快照规则下确实无法按现规则重建、会被省略
    // —— 否则本 it 只是空转，不足以充当 CARD-05 foreign-pair 政策的跨卡守卫。
    // 该前提由 it[A1]（形态）与 it[A2]（在 HEAD 上必须 RED）共同固定。
    const settled = await issueRequest({ task, kernel, request: buildPlanRequest(), available: true });
    const verdict = verdictOf(settled, settled.dispatches);
    expect(
      verdictCode(settled),
      `无关的 foreign 旧 pair 阻断了当前请求（CARD-05 的 foreign-pair 政策未落地或形态不同）—— ${verdict}`,
    ).not.toBe(HISTORY_UNAVAILABLE);
    expect(settled.dispatches, `foreign 旧 pair 不得阻断当前请求：${verdict}`).toBe(1);
    expect(settled.result?.result_ref ?? null, `当前请求必须真的评审完成并留下 result_ref：${verdict}`).toBeTruthy();
    expect(task.readRecord(written.report_ref), "foreign 旧 pair 只应被跳过，不得被删除").toContain(PAIR_ID);
    expect(JSON.parse(task.readRecord(blue.attempt_ref)).terminal_status, "旧 pair 成员记录被改写").toBe("unavailable");
  });

  it("C 负控（自始为绿）：当前命名空间 pair 丢失 role binding 仍必须 fail-closed 且零派发", async () => {
    const { task, kernel, written, blue } = writePair();
    // 破坏 pair 摘要里 blue 成员的 attempt_ref（role binding 丢失）。
    rewriteFencedJson(task, written.report_ref, JSON_FENCE, (summary) => {
      summary.role_results.blue.attempt_ref = MISSING_ATTEMPT_REF;
    });
    expect(task.readRecord(written.report_ref)).toContain(MISSING_ATTEMPT_REF);
    expect(blue.attempt_ref, "夹具前提：blue 成员原本的真实 attempt_ref 必须与伪造值不同").not.toBe(MISSING_ATTEMPT_REF);

    const settled = await issueRequest({ task, kernel, request: makeDecisionRequest() });
    const verdict = verdictOf(settled, settled.dispatches);
    expect(settled.dispatches, `当前 pair 损坏必须零派发：${verdict}`).toBe(0);
    expect(FAIL_CLOSED_HISTORY_CODES, `当前 pair 损坏必须 fail-closed（历史完整性裁决）：${verdict}`).toContain(verdictCode(settled));
    const succeeded = !settled.threw && settled.result?.error == null;
    expect(succeeded, `损坏的当前 pair 不得被静默接受：${verdict}`).toBe(false);
  });

  it("D 负控（自始为绿）：当前 pair 的成员报告被伪造 coverage 仍必须 fail-closed 且零派发", async () => {
    const { task, kernel, blue } = writePair();
    // 伪造 coverage 绑定：把 blue 成员报告里的 coverage 改成读取器按现快照规则**不会**
    // 重算出的那个值。写入器政策不同则原值不同（见文件头「历史投影归一化」），
    // 因此这里取「相反值」，让两种政策下都构成一次真实的绑定破坏。
    const original = publicBlock(task, blue.report_ref).coverage;
    const forged = original === "incomplete" ? "satisfied" : "incomplete";
    rewriteFencedJson(task, blue.report_ref, PUBLIC_BLOCK_ANCHOR, (block) => {
      block.coverage = forged;
    });
    expect(publicBlock(task, blue.report_ref).coverage, "夹具前提：伪造必须真的落到记录上").toBe(forged);

    const settled = await issueRequest({ task, kernel, request: makeDecisionRequest() });
    const verdict = verdictOf(settled, settled.dispatches);
    expect(settled.dispatches, `当前 pair 的伪造 coverage 必须零派发：${verdict}`).toBe(0);
    expect(FAIL_CLOSED_HISTORY_CODES, `当前 pair 的伪造 coverage 必须 fail-closed：${verdict}`).toContain(verdictCode(settled));
    const succeeded = !settled.threw && settled.result?.error == null;
    expect(succeeded, `伪造 coverage 不得被静默接受：${verdict}`).toBe(false);
  });

  it("E 形状自证（自始为绿）：结构完整的当前 pair 能正常读回并派发一次", async () => {
    const { task, kernel } = writePair({ complete: true });

    const settled = await issueRequest({ task, kernel, request: makeDecisionRequest(), available: true });
    const verdict = verdictOf(settled, settled.dispatches);
    expect(verdictCode(settled), `结构完整的当前 pair 不得被判成历史损坏：${verdict}`).not.toBe(HISTORY_UNAVAILABLE);
    expect(verdictMessage(settled), `结构完整的当前 pair 不得被指认绑定损坏：${verdict}`).not.toContain(PAIR_BINDING_MESSAGE);
    expect(verdictMessage(settled), `结构完整的当前 pair 不得被指认报告绑定损坏：${verdict}`).not.toContain(REPORT_BINDING_MESSAGE);
    expect(settled.dispatches, `结构完整的当前 pair 必须正常派发一次：${verdict}`).toBe(1);
    expect(settled.result?.result_ref ?? null, `结构完整时本次请求必须留下 result_ref：${verdict}`).toBeTruthy();
  });
});

// Finite review-finding check: mutable old pair fields never excuse nonderived damage.
describe("ORACLE-P6-LEGACY-DERIVED-STRENGTH-BOUNDARY", () => {
  it.each(["present_wrong_strength", "changed_finding", "changed_provider_original"])(
    "rejects %s within an otherwise eligible legacy partial shape", async (damage) => {
      const fixture = writeLegalPartialHistory();
      normalizeLegacySourceStrength(fixture);
      normalizeLegacyPartialReport(fixture);
      const { task, kernel, red, blue, written } = fixture;
      const preserved = { attempt: task.readRecord(red.attempt_ref),
        blue: task.readRecord(blue.attempt_ref), pair: task.readRecord(written.report_ref) };
      if (damage === "changed_provider_original") {
        const attempt = JSON.parse(preserved.attempt);
        const provider = attempt.provider_attempts.find((entry) => entry.output_ref);
        const value = JSON.parse(task.readRecord(provider.output_ref));
        const content = JSON.parse(value.content);
        content.findings[0].issue = "provider original rewritten under the same pair identity";
        value.content = JSON.stringify(content);
        const { createHash } = await import("node:crypto");
        value.content_hash = createHash("sha256").update(value.content).digest("hex");
        task.writeRecordAtomic(provider.output_ref, JSON.stringify(value));
      } else {
        const result = JSON.parse(task.readRecord(red.result_ref));
        if (damage === "present_wrong_strength") result.findings[0].source_strength = "invented_strength";
        else result.findings[0].issue = "non-derived finding text rewritten under the same pair identity";
        task.writeRecordAtomic(red.result_ref, JSON.stringify(result));
        const report = task.readRecord(red.report_ref);
        const first = /```json\n([^\n]+)\n```/.exec(report);
        const value = JSON.parse(first[1]);
        if (damage === "present_wrong_strength") value.findings[0].source_strength = "invented_strength";
        else value.findings[0].issue = result.findings[0].issue;
        task.writeRecordAtomic(red.report_ref, report.slice(0, first.index)
          + "```json\n" + JSON.stringify(value) + "\n```"
          + report.slice(first.index + first[0].length));
      }
      const rejected = await issueRequest({ task, kernel, request: makeDecisionRequest() });
      expect(rejected.dispatches, verdictOf(rejected, rejected.dispatches)).toBe(0);
      expect(FAIL_CLOSED_HISTORY_CODES).toContain(verdictCode(rejected));
      expect(task.readRecord(red.attempt_ref)).toBe(preserved.attempt);
      expect(task.readRecord(blue.attempt_ref)).toBe(preserved.blue);
      expect(task.readRecord(written.report_ref)).toBe(preserved.pair);
    });
});
