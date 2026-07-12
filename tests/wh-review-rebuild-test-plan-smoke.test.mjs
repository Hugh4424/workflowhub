// test-plan-smoke.test.mjs
//
// round22 修复：本文件此前只做 test-plan.md 的文档结构自检，不是冒烟基线/smoke baseline
// ——它不触发任何 stage、不调用 wh-review/3rd-review、不生成 tasks/{task-id} 产物，
// 与 AC11-2 要求的端到端能力验证是两回事。第一个 describe 块保留这份文档结构自检
// （确保 Phase 3 checkpoint 引用的这个测试文件真实存在且能跑通）。
//
// T025：test-plan.md"冒烟用例"一节定义的 AC11-2 最小可执行冒烟用例验收标准，
// 在 T010-T023（wh-review/3rd-review 实现 5 stage 迁移）落地后，由本文件第二个
// describe 块真正接入执行：build-spec 全链路——wh-review 两段式写 route-decision
// → invoke-review-engine.mjs 调 3rd-review（THIRD_REVIEW_RUNNER 指向确定性 stub，
// 固定 pass）→ round-state 落盘 → 渲染报告 → build-spec 非 D2 门自动 auto_advance，
// 断言 exitCode===0 及三类产物路径真实落盘存在。
//
// round-review finding (真实异源审查 codex, cfe72075-301a-4e81-b464-7137e9f90ece round-2, blocking)：
// 此前 exitCode 是手写常量 `0` 再断言，永远为绿，不能证明真实执行链的进程退出码。这里改为把整条
// 冒烟链路（prepareRoundState -> assembleAndInvokeReviewEngine -> recordRoundOutcome ->
// writeReviewReport）写进一个真实子进程 driver 脚本，用 spawnSync 拉起该子进程，断言其
// `status`（真实进程退出码）=== 0；链路内部任何一步失败都会让子进程以非零码退出，driver 脚本把
// 结果通过 stdout 输出 JSON 供父进程做产物一致性断言。
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const testPlanPath = join(__dirname, "..", "specs", "archive", "wh-review-rebuild", "test-plan.md");

const ROUND_STATE_URL = pathToFileURL(
  join(__dirname, "..", "skills", "wh-review", "scripts", "round-state.mjs")
).href;
const ENGINE_URL = pathToFileURL(
  join(__dirname, "..", "skills", "wh-review", "scripts", "invoke-review-engine.mjs")
).href;
const REPORT_URL = pathToFileURL(
  join(__dirname, "..", "skills", "wh-review", "scripts", "render-review-report.mjs")
).href;

describe("test-plan.md document self-check (build-plan stage)", () => {
  it("test-plan.md exists", () => {
    expect(existsSync(testPlanPath)).toBe(true);
  });

  it("test-plan.md contains the '## 冒烟用例' and '## 未覆盖 stage' section headers", () => {
    const content = readFileSync(testPlanPath, "utf8");
    expect(content).toMatch(/^## 冒烟用例/m);
    expect(content).toMatch(/^## 未覆盖 stage/m);
  });
});

// 确定性 stub runner：固定返回 verdict=pass，actual_mode 回显 payload.mode，
// 写法沿用 skills/wh-review/scripts/__tests__/invoke-review-engine.test.mjs 的现成范例。
const SUCCESS_STUB = `import { readFileSync, writeFileSync } from "node:fs";
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const payload = JSON.parse(readFileSync(args.diff, "utf8"));
writeFileSync(args.output, JSON.stringify({
  verdict: "pass",
  findings: [],
  actual_mode: payload.mode,
}));
process.exit(0);
`;

// 真实子进程 driver：在独立 node 进程里完整跑一遍冒烟链路，任何一步失败都 process.exit(1)，
// 成功时把关键结果通过 stdout JSON 交给父进程（父进程只负责真实退出码断言 + 产物落盘校验）。
const SMOKE_DRIVER = `import { prepareRoundState, recordRoundOutcome } from ${JSON.stringify(ROUND_STATE_URL)};
import { assembleAndInvokeReviewEngine } from ${JSON.stringify(ENGINE_URL)};
import { writeReviewReport, reportPathFor } from ${JSON.stringify(REPORT_URL)};
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const [, , taskTrackingRoot, taskId, stage, runnerPath] = process.argv;

try {
  // 步骤1：wh-review 两段式写 route-decision —— prepare 半段。
  const prep = prepareRoundState({ taskId, stage, taskTrackingRoot });
  if (prep.status !== "ready") throw new Error("prepare status !== ready: " + prep.status);
  const { review_flow_id: reviewFlowId, total_round: totalRound } = prep;

  // assembleReviewPayload() 要求的 prompt 补充上下文文件必须先于调用存在。
  const promptPath = join(taskTrackingRoot, taskId, "reviews", \`prompt-\${reviewFlowId}-r\${totalRound}.md\`);
  mkdirSync(dirname(promptPath), { recursive: true });
  writeFileSync(promptPath, "supplementary context for build-spec smoke test");

  // 步骤2：invoke-review-engine.mjs 调 3rd-review（确定性 stub，固定 pass）。
  const result = assembleAndInvokeReviewEngine({
    taskId, stage, reviewFlowId, totalRound, taskTrackingRoot,
    docType: "doc", doc: "design",
    currentContent: "# build-spec smoke test content, round 1",
    env: { THIRD_REVIEW_RUNNER: runnerPath },
  });
  if (result.verdict !== "pass") throw new Error("verdict !== pass: " + result.verdict);
  if (result.actual_mode !== "full") throw new Error("actual_mode !== full: " + result.actual_mode);

  // 步骤3：round-state 落盘（先按 Contract 4/AC4-2 公式算出预期报告路径，交叉校验）。
  const expectedReportPath = reportPathFor({ taskTrackingRoot, taskId, stage, reviewFlowId, totalRound, verdict: result.verdict });

  const roundState = recordRoundOutcome({
    taskId, stage, reviewFlowId, totalRound, taskTrackingRoot,
    actualMode: result.actual_mode, verdict: result.verdict,
    reportPath: expectedReportPath, rawFindings: result.findings,
    docType: "doc", doc: "design", currentContent: "# build-spec smoke test content, round 1",
  });
  if (roundState.report_path !== expectedReportPath) throw new Error("round-state report_path mismatch: " + roundState.report_path);

  // 步骤4：渲染报告，交叉验证与 round-state 记录的 report_path 一致。
  const { path: reportPath } = writeReviewReport({
    taskId, stage, reviewFlowId, totalRound, taskTrackingRoot,
    verdict: roundState.verdict, mode: roundState.mode, actualMode: roundState.actual_mode,
    heterologousRound: roundState.heterologous_round, sameSourceRound: roundState.same_source_round,
    findings: [], passItems: ["build-spec smoke test round 1 passed"],
    contractPath: "skills/wh-review/contracts/build-spec.md",
    contractHash: "sha256:test-plan-smoke",
    timestamp: new Date().toISOString(),
  });
  if (reportPath !== roundState.report_path) throw new Error("report path mismatch with round-state: " + reportPath);

  // 步骤5：build-spec 非 D2 门，pass 自动 auto_advance。
  if (roundState.post_review_action !== "auto_advance") throw new Error("post_review_action !== auto_advance: " + roundState.post_review_action);

  process.stdout.write(JSON.stringify({
    reviewFlowId, totalRound,
    verdict: roundState.verdict,
    actualMode: roundState.actual_mode,
    reportPath,
    postReviewAction: roundState.post_review_action,
  }));
  process.exit(0);
} catch (err) {
  process.stderr.write(String(err && err.stack ? err.stack : err));
  process.exit(1);
}
`;

describe("冒烟用例：build-spec 全链路 (AC11-2, T025)", () => {
  it("route-decision 两段式写入 + invoke-review-engine(stub pass) + round-state 落盘 + 渲染报告 + build-spec auto_advance, 真实子进程 exitCode===0", () => {
    const taskTrackingRoot = mkdtempSync(join(tmpdir(), "test-plan-smoke-root-"));
    const stubDir = mkdtempSync(join(tmpdir(), "test-plan-smoke-runner-"));
    const taskId = `test-plan-smoke-${Date.now()}`;
    const stage = "build-spec";

    try {
      const runnerPath = join(stubDir, "stub-runner.mjs");
      writeFileSync(runnerPath, SUCCESS_STUB);

      const driverPath = join(stubDir, "smoke-driver.mjs");
      writeFileSync(driverPath, SMOKE_DRIVER);

      // 真实子进程运行整条冒烟链路——断言的是子进程实际退出码，不是手写常量。
      const spawnResult = spawnSync(
        process.execPath,
        [driverPath, taskTrackingRoot, taskId, stage, runnerPath],
        { encoding: "utf8" }
      );
      expect(spawnResult.status, spawnResult.stderr).toBe(0);

      const output = JSON.parse(spawnResult.stdout);
      expect(output.verdict).toBe("pass");
      expect(output.actualMode).toBe("full");
      expect(output.postReviewAction).toBe("auto_advance");

      const { reviewFlowId, totalRound, reportPath } = output;

      // 三类产物路径真实落盘存在。
      const routeDecisionPath = join(
        taskTrackingRoot,
        taskId,
        "reviews",
        `route-decision-${stage}-${reviewFlowId}.json`
      );
      const verdictRawPath = join(
        taskTrackingRoot,
        taskId,
        "reviews",
        `verdict-${stage}-${reviewFlowId}-round-${totalRound}.raw.json`
      );
      expect(existsSync(routeDecisionPath)).toBe(true);
      expect(existsSync(verdictRawPath)).toBe(true);
      expect(existsSync(reportPath)).toBe(true);

      // route-decision 两段式确实完整：execute 半段已回填非空 review_input_hash。
      const routeDecision = JSON.parse(readFileSync(routeDecisionPath, "utf8"));
      expect(routeDecision.review_input_hash).not.toBe("");
    } finally {
      rmSync(taskTrackingRoot, { recursive: true, force: true });
      rmSync(stubDir, { recursive: true, force: true });
    }
  });
});
