// test-plan-smoke.test.mjs
//
// build-plan 阶段的最小占位版：在 T010-T023（wh-review 实现 + 5 stage 迁移）落地之前，
// test-plan.md 描述的 stage 调用链还不能被真实执行。本占位版只校验
// specs/wh-review-rebuild/test-plan.md 的文档结构，确保 Phase 3 checkpoint
// （见 plan.md）引用的这个测试文件真实存在且能跑通，而不是引用一个从未生成过的路径。
//
// T025 落地 T010-T023 之后，必须把本文件扩写为真正执行 test-plan.md 定义的那条
// stage 调用链、断言 exitCode===0 的版本，不得保留本占位实现充数。
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testPlanPath = path.join(__dirname, "..", "test-plan.md");

describe("test-plan.md smoke placeholder (build-plan stage)", () => {
  it("test-plan.md exists", () => {
    expect(fs.existsSync(testPlanPath)).toBe(true);
  });

  it("documents at least one end-to-end smoke case", () => {
    const content = fs.readFileSync(testPlanPath, "utf8");
    expect(content).toMatch(/^## 冒烟用例/m);
  });

  it("documents the stage(s) not directly covered by the smoke case", () => {
    const content = fs.readFileSync(testPlanPath, "utf8");
    expect(content).toMatch(/^## 未覆盖 stage/m);
  });
});
