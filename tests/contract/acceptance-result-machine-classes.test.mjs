// CARD-04 / P7 / T015 — acceptance `result` 枚举升级（机器判定类）预置测试，build-plan 期冻结。
//
// 用户 2026-09-23 裁定：现在就升级 `acceptance.result`，把 4 值
// `pass | fail | inconclusive | deferred` 扩成 8 值，新增 D-004 机器判定类
// `missing | inconsistent | incomplete | unavailable`（语义上 `fail` ≙ D-004 的
// `failed`），并把 `deferred` 的语义收窄为 not_applicable。
//
// 权威设计：<facts>/quality/reviews/a1-acceptance-enum-design-20260923.md
//   —— §4.1（C1 校验器白名单）、§4.2（C2 freshness 生死线）、§4.9（C9 quality-store）、
//      §6.2（RED 断言组 A / C / F）、§4.11（明确不改 core/task-close.mjs）。
//
// 冻结规则：本文件是预置 RED 规格，实现者只读。RED 必须由目标条件本身造成，
// 不得是 import 错 / 路径拼错 / collection error。不得为了变绿放宽断言。
//
// 覆盖的改动面（本相位允许改的）：`runtime/evidence/**` 与 `core/task-close.mjs`。
// 断言分四组：
//   A. 校验器接受 8 值（正控 + `bogus` 负控且消息列出全部允许值 + 冻结性）
//   B. quality-store 不得把 4 个机器类判成 passed（终态负控 pass/fail）
//   C. 非终态不得被当通过——走真实导出路径 `authenticateQualityFactRecord`
//      （内部命中模块私有 `expectedPassed`，即设计 §4.2 生死线）
//   D. core/task-close.mjs 侧口径：只用共享校验器，无本地 result 白名单
//
// ─────────────────────────────────────────────────────────────────────────────
// 断言选择申报（对应任务书第 3、4 条）
// ─────────────────────────────────────────────────────────────────────────────
// 【第 3 条 / `expectedPassed`（`runtime/evidence/freshness.mjs:297-306`，模块私有未导出）】
//   选择：**真实导出路径行为断言**，不退让为源码文本断言。
//   路径：`authenticateQualityFactRecord`（`runtime/evidence/freshness.mjs:781`），
//         以 `status:"missing"` 的 `acceptance_criterion` 质量事实绑定一个
//         `evidence_type:"acceptance_evidence"` 的叶子；该路径在
//         `runtime/evidence/freshness.mjs:713` 真实调用
//         `expectedPassed(fact.status, result === "pass", result === "fail", result)`。
//   理由：夹具成本可接受——`tests/deferred-acceptance-semantics.test.mjs:60-90` 已给出
//         可复用的 `createQualityFact` + `read` 注入配方，本文件直接沿用同一配方。
//         未选 `authenticateAcceptanceExecutionAggregate`（`:546`）：它要求完整
//         e2e execution/review/confirmation 三件套链，夹具成本远高于收益。
//   注意：`runtime/evidence/freshness.mjs:709-713` 位于 `authenticateNested` 的
//         `try { … } catch { dependencies[key] = "stale" }` 之内，因此**不会抛到调用方**；
//         mismatch 表现为 `evaluated.authenticated === false`、`status !== "recorded"`、
//         以及 `dependencies["evidence:<ref>"] === "stale"`。断言直接钉这三个可观测值。
//   未被该路径覆盖：`runtime/evidence/freshness.mjs:647`（test outcome）与
//         `:764`（confirmation outcome）的**三参调用**（`nonterminal === undefined`）。
//         本文件不构造 test receipt / human confirmation 夹具，故
//         `expectedPassed(status, …, undefined) === false` 这条负控**未断言**；
//         设计 §4.2 判定这两处行为不变，风险受控。
//
// 【第 4 条 / core/task-close.mjs】
//   选择：**源码文本契约断言**，不做行为断言。
//   理由：`validateAcceptanceEvidence` 的两处生产调用（`core/task-close.mjs:334`、`:649`）
//         都位于模块私有函数内部（`authenticateStageQualityLeaf` 与 mini-task 验收分支），
//         未导出；可达的导出入口（`closeTask` 等）需要完整 task store / worktree 夹具，
//         成本远超收益。故按任务书许可退让为源码文本断言。
//   预期基线与实现后行为（设计 §4.11 R6/R7）：本组**当前即为 GREEN，实现后仍应为 GREEN**
//         —— task-close 本轮**不需要改动**。它是一条防「好心加白名单」的回归锁：
//         若有人把 4 值（或 8 值）acceptance result 白名单搬进 task-close，本组立即转 RED。
//
// ─────────────────────────────────────────────────────────────────────────────
// 未断言的延后站点（任务书第 5 条逐条登记；不计入本文件断言面）
// ─────────────────────────────────────────────────────────────────────────────
// 以下站点属 **CARD-05 拥有的文件**（跨卡时序依赖，本相位只登记不实现），
// 在这些站点改造之前，机器类取值的**生产侧仍不可达**（写侧仍只会落旧 4 值）：
//   - runtime/stage/stage-runner.mjs:1744        acceptanceResultForSubjectStatus 的映射表
//   - runtime/stage/stage-runner.mjs:2828        subject status 白名单
//   - runtime/stage/stage-runner.mjs:2029-2038   spec-analyze subject status 推导 + publish
//   - runtime/stage/stage-runner.mjs:2950-2952   build-code 逐 AC status → result
//   - runtime/stage/stage-handlers.mjs:626-628   subjectFact() 状态白名单
//   - runtime/stage/stage-handlers.mjs:642-647   classifyAcceptanceEvidenceResult() 映射
// 本文件因此**不导入** `runtime/stage/stage-runner.mjs` /
// `runtime/stage/stage-handlers.mjs`，也**不修改** `runtime/**` 生产代码。
// 直接后果：本文件只证明「消费侧已能接受并正确处置机器类」，**不证明生产侧会产生它们**。
// 生产侧可达性必须由 CARD-05 落地后的端到端事实另行证明。
//
// 另外两个本轮明确**不覆盖**的站点（超出本相位范围，不设为断言以免扩大改动面）：
//   - skills/wh-review/scripts/ac-evidence-summary.mjs:181-187 / :217-220
//     （设计 §7.5 的 P1 静默降级；材料生成器，非校验器）
//   - runtime/stage/stage-end-report.mjs 报告层投影（T007 面，由冻结的
//     runtime/stage/stage-end-report.test.mjs 承载）

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { validateAcceptanceEvidence } from "../../runtime/evidence/acceptance-evidence-validator.mjs";
import { authenticateQualityFactRecord } from "../../runtime/evidence/freshness.mjs";
import { createQualityFact } from "../../runtime/evidence/quality-fact.mjs";
import { validateVerifyLeaves } from "../../runtime/evidence/quality-store.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const TASK_CLOSE_PATH = resolve(REPO_ROOT, "core/task-close.mjs");
const SHA256_STUB = "a".repeat(64);

// 目标取值域：4 个旧值 + 4 个 D-004 机器判定类。这是本升级的**冻结契约**，
// 实现者不得增删（`fail` ≙ D-004 `failed` 是跨层拼写差，不新增 `failed` 同义值）。
const LEGACY_RESULTS = ["pass", "fail", "inconclusive", "deferred"];
const MACHINE_RESULTS = ["missing", "inconsistent", "incomplete", "unavailable"];
const ACCEPTANCE_RESULTS = [...LEGACY_RESULTS, ...MACHINE_RESULTS];
// 「非终态」= 既不是通过也不是实现失败，不得被任何读侧当成通过。
const NONTERMINAL_RESULTS = ["inconclusive", "deferred", ...MACHINE_RESULTS];

const hash = (raw) => createHash("sha256").update(raw).digest("hex");

/** 把「抛错」也变成可比较的值，让 RED 输出带 expected/actual 而不是裸堆栈。 */
function asOutcome(run) {
  try {
    return { ok: true, value: run() };
  } catch (error) {
    return { ok: false, error: `${error?.name ?? "Error"}: ${error?.message ?? error}` };
  }
}

/** 最小合法 `acceptance-evidence.v1`；ref 形状与 sha256 位数取自该模块的 EVIDENCE_REF / SHA256_HEX。 */
function acceptanceEvidence(result) {
  return {
    schema_version: "acceptance-evidence.v1",
    acceptance_criterion_id: "AC-21",
    result,
    refs: [{ ref: "quality/evidence/observation.json", sha256: SHA256_STUB }],
  };
}

const VERIFY_SOURCE_DIGEST = "b".repeat(64);

/** 最小合法 verify leaf；键集合必须完整落在 quality-store 的 VERIFY_LEAF_KEYS 内。 */
function verifyLeaf(result) {
  return {
    acceptance_criterion_id: "AC-21",
    result,
    source_digest: VERIFY_SOURCE_DIGEST,
    acceptance_leaf: { ref: "quality/evidence/ac-21.json", sha256: "a".repeat(64) },
    nested_evidence: [{ ref: "quality/evidence/observation.json", sha256: "c".repeat(64) }],
    scenario: "机器判定类必须能被机器读取",
    oracle: "非终态不得被判成通过",
    actual_outcome: result,
    evidence_type: "structured_observation",
    coverage_limits: ["未覆盖 CARD-05 拥有的写侧站点"],
    exceptions: ["写侧生产可达性待 CARD-05"],
    implementation_anchor: {
      id: "impl-verify-leaf-status",
      path: "runtime/evidence/quality-store.mjs",
      start_line: 117,
      end_line: 126,
      role: "implementation",
    },
    verification_anchor: {
      id: "test-acceptance-result-machine-classes",
      path: "tests/contract/acceptance-result-machine-classes.test.mjs",
      start_line: 1,
      end_line: 2,
      role: "verification",
    },
  };
}

const BOUND_ACCEPTANCE_REF = "quality/evidence/ac-21.json";
const BOUND_PROOF_REF = "quality/evidence/proof.txt";
const BOUND_PROOF_RAW = "proof\n";

/**
 * 真实读回路径：`status` 的 acceptance_criterion 质量事实绑定一个叶子
 * acceptance 事实，内部命中 `runtime/evidence/freshness.mjs:713` 的
 * `expectedPassed(fact.status, result === "pass", result === "fail", result)`。
 * 配方沿袭 tests/deferred-acceptance-semantics.test.mjs:60-90。
 */
function authenticateBoundAcceptanceLeaf(factStatus, result) {
  const acceptanceRaw = JSON.stringify({
    schema_version: "acceptance-evidence.v1",
    acceptance_criterion_id: "AC-21",
    result,
    refs: [{ ref: BOUND_PROOF_REF, sha256: hash(BOUND_PROOF_RAW) }],
  });
  const fact = createQualityFact({
    taskId: "acceptance-enum-task",
    stage: "verify-code",
    materialRevision: `revision-${"d".repeat(64)}`,
    snapshotTree: "e".repeat(40),
    kind: "acceptance_criterion",
    status: factStatus,
    subject: "AC-21",
    evidence: [{ ref: BOUND_ACCEPTANCE_REF, sha256: hash(acceptanceRaw), evidence_type: "acceptance_evidence" }],
  });
  return authenticateQualityFactRecord({ ...fact.value, ref: fact.ref, sha256: fact.sha256 }, {
    read: (entry) => entry === fact.ref ? fact.raw
      : entry === BOUND_ACCEPTANCE_REF ? acceptanceRaw
        : entry === BOUND_PROOF_REF ? BOUND_PROOF_RAW
          : undefined,
  });
}

const dependenciesOf = (evaluated) => JSON.stringify(evaluated.dependencies);

describe("acceptance result enum — D-004 machine verdict classes", () => {
  describe("A. 共享校验器接受 8 值（runtime/evidence/acceptance-evidence-validator.mjs）", () => {
    it.each(ACCEPTANCE_RESULTS)("accepts acceptance result %s and returns a frozen value", (result) => {
      const validated = asOutcome(() => validateAcceptanceEvidence(acceptanceEvidence(result)));
      expect(
        validated.ok ? validated.value.result : `REJECTED: ${validated.error}`,
      ).toBe(result);
      expect(Object.isFrozen(validated.value)).toBe(true);
    });

    it("rejects an unknown result with a message that names every allowed result", () => {
      const rejected = asOutcome(() => validateAcceptanceEvidence(acceptanceEvidence("bogus")));
      expect(rejected.ok, "an unknown result must still throw").toBe(false);
      const message = rejected.ok ? "" : rejected.error;
      for (const result of ACCEPTANCE_RESULTS) {
        expect(message, `rejection message must list the allowed value ${result}`).toContain(result);
      }
    });
  });

  describe("B. quality-store 不得把机器判定类当成 passed（runtime/evidence/quality-store.mjs）", () => {
    it.each(MACHINE_RESULTS)("keeps machine class %s incomplete instead of passed", (result) => {
      const outcome = asOutcome(() => validateVerifyLeaves([verifyLeaf(result)], { sourceDigest: VERIFY_SOURCE_DIGEST })[0].status);
      expect(outcome.ok ? outcome.value : `REJECTED: ${outcome.error}`).toBe("incomplete");
    });

    it.each([["pass", "passed"], ["fail", "failed"]])(
      "keeps the terminal result %s as %s",
      (result, status) => {
        const outcome = asOutcome(() => validateVerifyLeaves([verifyLeaf(result)], { sourceDigest: VERIFY_SOURCE_DIGEST })[0].status);
        expect(outcome.ok ? outcome.value : `REJECTED: ${outcome.error}`).toBe(status);
      },
    );
  });

  describe("C. 非终态不得被当通过（runtime/evidence/freshness.mjs:297-306 经 :713 真实生效）", () => {
    it.each(NONTERMINAL_RESULTS)(
      "authenticates a missing quality fact bound to nonterminal result %s",
      (result) => {
        const evaluated = authenticateBoundAcceptanceLeaf("missing", result);
        expect(evaluated.status, `dependencies: ${dependenciesOf(evaluated)}`).toBe("recorded");
        expect(evaluated.authenticated, `dependencies: ${dependenciesOf(evaluated)}`).toBe(true);
      },
    );

    it.each([["passed", "pass"], ["failed", "fail"]])(
      "still authenticates a %s fact bound to its own terminal result %s",
      (factStatus, result) => {
        const evaluated = authenticateBoundAcceptanceLeaf(factStatus, result);
        expect(evaluated.status, `dependencies: ${dependenciesOf(evaluated)}`).toBe("recorded");
        expect(evaluated.authenticated).toBe(true);
      },
    );

    it.each(["pass", "fail"])(
      "never authenticates a missing quality fact bound to terminal result %s",
      (result) => {
        const evaluated = authenticateBoundAcceptanceLeaf("missing", result);
        expect(
          evaluated.authenticated,
          `a missing fact must not be satisfied by a ${result} leaf; dependencies: ${dependenciesOf(evaluated)}`,
        ).toBe(false);
      },
    );
  });

  describe("D. core/task-close.mjs 侧口径：只用共享校验器，不得自建 result 白名单", () => {
    // 读取放在 it 内部：路径问题必须表现为断言失败，而不是 collection error。
    const taskCloseText = () => readFileSync(TASK_CLOSE_PATH, "utf8");

    it("imports the shared acceptance evidence validator instead of owning the enum", () => {
      const text = taskCloseText();
      expect(text).toMatch(
        /import\s*\{\s*validateAcceptanceEvidence\s*\}\s*from\s*"\.\.\/runtime\/evidence\/acceptance-evidence-validator\.mjs"/,
      );
      expect([...text.matchAll(/validateAcceptanceEvidence\(/g)].length).toBeGreaterThanOrEqual(2);
    });

    it("carries no local acceptance result whitelist", () => {
      const text = taskCloseText();
      // 实测基线：本文件当前对 `"inconclusive"` / `"deferred"` 的**带引号字面量**命中数为 0；
      // 唯一的 `deferred` 出现在 delivery risk 的 `risk.deferred_items`（:2274-2275），
      // 与 acceptance result 无关，因此不受本条约束。
      expect(text).not.toContain('"inconclusive"');
      expect(text).not.toContain('"deferred"');
      expect(text).not.toMatch(/new Set\(\[\s*"pass"\s*,\s*"fail"/);
    });

    it("compares acceptance.result only against pass and treats every other value as missing", () => {
      const text = taskCloseText();
      const compared = [...text.matchAll(/acceptance\.result\s*[!=]==\s*"([^"]*)"/g)].map((match) => match[1]);
      expect(compared.length).toBeGreaterThanOrEqual(1);
      expect([...new Set(compared)]).toEqual(["pass"]);
      // 闸门层口径：非 pass ⇒ 质量事实 status 落到三值闸门词表的 "missing"。
      expect(text).toMatch(/acceptance\.result === "pass"\s*\?\s*"passed"\s*:\s*"missing"/);
    });
  });
});
