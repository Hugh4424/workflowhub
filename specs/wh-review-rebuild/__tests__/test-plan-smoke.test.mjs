// test-plan-smoke.test.mjs
//
// round22 修复：本文件只做 test-plan.md 的文档结构自检，不是冒烟基线/smoke baseline
// ——它不触发任何 stage、不调用 wh-review/3rd-review、不生成 tasks/{task-id} 产物，
// 与 AC11-2 要求的端到端能力验证是两回事。本文件的实际作用是确保 Phase 3 checkpoint
// （见 plan.md）引用的这个测试文件真实存在且能跑通，而不是引用一个从未生成过的路径。
//
// 真正满足 AC11-2 的最小可执行冒烟用例验收标准定义见 test-plan.md"冒烟用例"一节
// （build-plan 阶段交付门槛：本阶段只定义确定性的验收标准，具体可跑通的执行版本
// 留待 build-code 阶段完成 T010-T023 后，由 T025 把该节断言接入本文件实际执行、
// 断言 exitCode===0，不得保留本文档自检实现充数）。
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testPlanPath = path.join(__dirname, "..", "test-plan.md");

describe("test-plan.md document structure self-check (build-plan stage)", () => {
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
