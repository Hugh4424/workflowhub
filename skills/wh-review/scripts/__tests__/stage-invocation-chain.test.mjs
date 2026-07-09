/**
 * stage-invocation-chain.test.mjs — T025a (test-plan.md "## 未覆盖 stage" 补充验证)
 *
 * test-plan-smoke.test.mjs already exercises build-spec's AC11-2 smoke-case as the
 * lead stage. This file covers the remaining 4 migrated stages — make-decision /
 * build-plan / build-code / verify-code — per the "## 未覆盖 stage" section's
 * requirement: drive each stage's real invocation chain via a stub runner (fixed
 * `verdict=pass`), and for D2 human-confirmation-gate stages (make-decision /
 * build-plan / verify-code, FR-D2-001) additionally assert that
 * `post_review_action=await_human_confirmation` is correctly written.
 *
 * Chain driven per stage: prepareRoundState() (writes route-decision
 * prepare-phase record) -> assembleAndInvokeReviewEngine() (stub runner via
 * THIRD_REVIEW_RUNNER, backfills route-decision's execute phase, persists a
 * verdict raw artifact) -> recordRoundOutcome() (writes post_review_action into
 * round-state). Each test uses its own mkdtempSync taskTrackingRoot, cleaned up in
 * afterEach — never touches the real tasks/ directory.
 *
 * round-review finding (真实异源审查 codex, cfe72075-301a-4e81-b464-7137e9f90ece round-2,
 * blocking)：此前 exitCode 是手写常量 `0` 再断言，永远为绿，不能证明真实执行链的进程退出码。
 * 这里改为把整条调用链写进一个真实子进程 driver 脚本，用 spawnSync 拉起该子进程，断言其
 * `status`（真实进程退出码）=== 0；链路内部任何一步失败都会让子进程以非零码退出。
 *
 * round-review finding (round-1 minor, round-2 未变化)：route-decision 的 execute 阶段应
 * 回填非空 `review_input_hash`——本文件此前只断言 route-decision/verdict raw 文件存在，未显式
 * 校验该字段，这里补上。
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TASK_ID = "wh-review-rebuild-t025a";
const D2_GATE_STAGES = ["make-decision", "build-plan", "verify-code"];
const NON_GATE_STAGES = ["build-code"];
const STAGES = [...D2_GATE_STAGES, ...NON_GATE_STAGES];

const ROUND_STATE_URL = pathToFileURL(join(__dirname, "../round-state.mjs")).href;
const ENGINE_URL = pathToFileURL(join(__dirname, "../invoke-review-engine.mjs")).href;

// Same shape as invoke-review-engine.test.mjs's SUCCESS_STUB (dynamically written to a
// mkdtempSync temp dir per test, never checked in as a standalone stub file).
const PASS_STUB = `
import { readFileSync, writeFileSync } from "node:fs";
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, "").split("=")));
const payload = JSON.parse(readFileSync(args.diff, "utf8"));
writeFileSync(args.output, JSON.stringify({
  verdict: "pass",
  findings: [],
  actual_mode: payload.mode,
}));
process.exit(0);
`;

// 真实子进程 driver：在独立 node 进程里完整跑一遍 prepareRoundState ->
// assembleAndInvokeReviewEngine -> recordRoundOutcome，任何一步失败都 process.exit(1)，
// 成功时把结果通过 stdout JSON 交给父进程做产物/字段断言。
const CHAIN_DRIVER = `import { prepareRoundState, recordRoundOutcome } from ${JSON.stringify(ROUND_STATE_URL)};
import { assembleAndInvokeReviewEngine } from ${JSON.stringify(ENGINE_URL)};
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const [, , taskTrackingRoot, taskId, stage, runnerPath] = process.argv;

try {
  const prep = prepareRoundState({ taskId, stage, taskTrackingRoot });
  if (prep.status !== "ready") throw new Error("prepare status !== ready: " + prep.status);
  const { review_flow_id: reviewFlowId, total_round: totalRound } = prep;

  const promptPath = join(taskTrackingRoot, taskId, "reviews", \`prompt-\${reviewFlowId}-r\${totalRound}.md\`);
  mkdirSync(dirname(promptPath), { recursive: true });
  writeFileSync(promptPath, "supplementary context (stub)");

  const result = assembleAndInvokeReviewEngine({
    taskId, stage, reviewFlowId, totalRound, taskTrackingRoot,
    currentContent: "some materials content",
    gitSha: "sha1",
    coveredPaths: [],
    env: { THIRD_REVIEW_RUNNER: runnerPath },
  });
  if (result.verdict !== "pass") throw new Error("verdict !== pass: " + result.verdict);

  const outcome = recordRoundOutcome({
    taskId, stage, reviewFlowId, totalRound, taskTrackingRoot,
    actualMode: result.actual_mode, verdict: result.verdict,
    reportPath: "r1.md", rawFindings: result.findings, docType: "non-doc",
  });

  process.stdout.write(JSON.stringify({
    reviewFlowId, totalRound,
    verdict: outcome.verdict,
    postReviewAction: outcome.post_review_action,
  }));
  process.exit(0);
} catch (err) {
  process.stderr.write(String(err && err.stack ? err.stack : err));
  process.exit(1);
}
`;

let root;
let stubDir;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stage-invocation-chain-root-"));
  stubDir = mkdtempSync(join(tmpdir(), "stage-invocation-chain-stub-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  rmSync(stubDir, { recursive: true, force: true });
});

function writeStubRunner() {
  const stubPath = join(stubDir, "stub-runner.mjs");
  writeFileSync(stubPath, PASS_STUB);
  return stubPath;
}

function writeChainDriver() {
  const driverPath = join(stubDir, "chain-driver.mjs");
  writeFileSync(driverPath, CHAIN_DRIVER);
  return driverPath;
}

describe.each(STAGES)("stage invocation chain — %s", (stage) => {
  it("prepareRoundState -> assembleAndInvokeReviewEngine (stub pass) -> recordRoundOutcome persists route-decision + verdict raw artifacts, 真实子进程 exitCode===0", () => {
    const runnerPath = writeStubRunner();
    const driverPath = writeChainDriver();

    // 真实子进程运行整条调用链——断言的是子进程实际退出码，不是手写常量。
    const spawnResult = spawnSync(
      process.execPath,
      [driverPath, root, TASK_ID, stage, runnerPath],
      { encoding: "utf8" }
    );
    expect(spawnResult.status, spawnResult.stderr).toBe(0);

    const output = JSON.parse(spawnResult.stdout);
    expect(output.verdict).toBe("pass");

    const { reviewFlowId, totalRound, postReviewAction } = output;

    const routeDecisionPath = join(
      root,
      TASK_ID,
      "reviews",
      `route-decision-${stage}-${reviewFlowId}.json`
    );
    const verdictRawPath = join(
      root,
      TASK_ID,
      "reviews",
      `verdict-${stage}-${reviewFlowId}-round-${totalRound}.raw.json`
    );
    expect(existsSync(routeDecisionPath)).toBe(true);
    expect(existsSync(verdictRawPath)).toBe(true);

    // minor finding：route-decision 的 execute 阶段应回填非空 review_input_hash（不是空字符串）。
    const routeDecision = JSON.parse(readFileSync(routeDecisionPath, "utf8"));
    expect(typeof routeDecision.review_input_hash).toBe("string");
    expect(routeDecision.review_input_hash).not.toBe("");

    if (D2_GATE_STAGES.includes(stage)) {
      expect(postReviewAction).toBe("await_human_confirmation");
    } else {
      expect(postReviewAction).toBe("auto_advance");
    }
  });
});
