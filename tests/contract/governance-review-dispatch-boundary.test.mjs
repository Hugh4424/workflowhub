import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const adr0007 = readFileSync(new URL("../../docs/adr/0007-phase-and-integration-review-material-architecture.md", import.meta.url), "utf8");
const workflow = readFileSync(new URL("../../docs/standard-workflow.md", import.meta.url), "utf8");
const adr0025 = new URL("../../docs/adr/0025-review-dispatch-preflight-boundaries.md", import.meta.url);

describe("governance review dispatch boundary", () => {
  it("publishes ADR 0025 and preserves non-gate/runtime-owned semantics", () => {
    const text = readFileSync(adr0025, "utf8");
    expect(text).toMatch(/ADR 0025/i);
    expect(text).toMatch(/preflight/i);
    expect(text).toMatch(/unavailable|unknown/i);
    expect(text).toMatch(/non.?gate|非 gate/i);
    expect(text).toMatch(/runtime.?owned|运行时.*拥有|status/i);
    expect(text).not.toMatch(/outer wall.?clock budget|统一预算 gate|新增.*gate/i);
  });

  it("keeps ADR 0007 packet telemetry and public status polling boundaries", () => {
    expect(adr0007).toMatch(/packet-plan.*不设 byte、token、时间/);
    expect(adr0007).toMatch(/request ID 轮询公共 status/);
    expect(adr0007).toMatch(/不是\s*WorkflowHub 阶段通过状态|不是\s*阶段 pass gate/);
  });

  it("keeps standard workflow without a unified budget gate", () => {
    expect(workflow).toMatch(/不可得就写 `unavailable`，不设统一预算 gate/);
    expect(workflow).toMatch(/健康的 provider 由 3rd-review 自己监管/);
  });
});
