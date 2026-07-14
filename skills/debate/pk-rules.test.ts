// pk-rules.test.ts — 用 node assert 跑，无需额外依赖
import assert from "node:assert/strict";
import { classifyByMr2, shouldTriggerPK, shouldExitPK } from "./pk-rules.ts";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${(e as Error).message}`);
    failed++;
  }
}

// ── classifyByMr2 ────────────────────────────────────────────────────────────
console.log("\nclassifyByMr2");

test("problem_change 正例：含'problem'", () => {
  assert.equal(classifyByMr2("这个 problem 没有被正确识别"), "problem_change");
});

test("scope_priority 正例：含'优先级'", () => {
  assert.equal(classifyByMr2("我们需要重新考虑这个功能的优先级"), "scope_priority");
});

test("requirement_interpretation 正例：含'理解不同'", () => {
  assert.equal(classifyByMr2("双方对需求的理解不同，存在歧义"), "requirement_interpretation");
});

test("无匹配关键词 → implementation_only", () => {
  assert.equal(classifyByMr2("这个变量命名可以更清晰"), "implementation_only");
});

test("多类关键词并列时 problem_change 优先（同命中数按顺序取第一）", () => {
  // problem 命中 problem_change；优先级 命中 scope_priority；各命中1次，并列取 problem_change
  assert.equal(classifyByMr2("核心 problem 的优先级"), "problem_change");
});

// ── shouldTriggerPK ──────────────────────────────────────────────────────────
console.log("\nshouldTriggerPK");

test("含方向级 finding → triggered:true", () => {
  const result = shouldTriggerPK([
    { id: "f1", description: "核心问题方向不同", category: "problem_change" },
  ]);
  assert.equal(result.triggered, true);
});

test("纯 implementation_only → triggered:false", () => {
  const result = shouldTriggerPK([
    { id: "f1", description: "变量命名", category: "implementation_only" },
  ]);
  assert.equal(result.triggered, false);
});

test("空数组 → triggered:false", () => {
  const result = shouldTriggerPK([]);
  assert.equal(result.triggered, false);
});

test("混合 findings：有方向级就触发", () => {
  const result = shouldTriggerPK([
    { id: "f1", description: "命名", category: "implementation_only" },
    { id: "f2", description: "范围分歧", category: "scope_priority" },
  ]);
  assert.equal(result.triggered, true);
});

// ── shouldExitPK ─────────────────────────────────────────────────────────────
console.log("\nshouldExitPK");

test("verdict_produced → exit:true, reason:verdict_produced", () => {
  const r = shouldExitPK(0, true, false);
  assert.equal(r.exit, true);
  assert.equal(r.reason, "verdict_produced");
  assert.equal(r.requiresHumanArbitration, false);
});

test("all_proposals_resolved → exit:true, reason:all_proposals_resolved", () => {
  const r = shouldExitPK(1, false, true);
  assert.equal(r.exit, true);
  assert.equal(r.reason, "all_proposals_resolved");
  assert.equal(r.requiresHumanArbitration, false);
});

test("round>=2 无裁决有未决 → requiresHumanArbitration:true (D25)", () => {
  const r = shouldExitPK(2, false, false);
  assert.equal(r.exit, true);
  assert.equal(r.reason, "max_rounds_reached");
  assert.equal(r.requiresHumanArbitration, true);
});

test("round>=2 但 verdictProduced → requiresHumanArbitration:false", () => {
  const r = shouldExitPK(2, true, false);
  assert.equal(r.requiresHumanArbitration, false);
});

test("round<2 未完成 → 不退出", () => {
  const r = shouldExitPK(1, false, false);
  assert.equal(r.exit, false);
  assert.equal(r.reason, null);
  assert.equal(r.requiresHumanArbitration, false);
});

// ── 汇总 ─────────────────────────────────────────────────────────────────────
console.log(`\n结果：${passed} 通过 / ${failed} 失败`);
if (failed > 0) process.exit(1);
