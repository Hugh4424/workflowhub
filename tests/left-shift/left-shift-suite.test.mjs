import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { runSimpleReview } from "../../skills/wh-review/scripts/simple-review-runner.mjs";

describe("left-shift suite (T7)", () => {
  it("FR-LEFT-001: stage-runner source contains write-boundary identity and cwd assertions", () => {
    const src = readFileSync(fileURLToPath(new URL("../../runtime/stage/stage-runner.mjs", import.meta.url)), "utf8");
    expect(src).toContain("function assertWriteBoundary(");
    expect(src).toContain("kernel.task !== task");
    expect(src).toContain("cwd is outside the task worktree");
    expect(src).toContain("assertWriteBoundary(ctx);");
  });

  it("FR-LEFT-002/003: simple-review-runner classifies invalid input vs unavailable route", async () => {
    await expect(runSimpleReview(null)).rejects.toThrow(TypeError);
    await expect(runSimpleReview({ stage: "build-code", host_provider: "dsh", materials: {} })).rejects.toThrow(TypeError);
    await expect(runSimpleReview({ stage: "", host_provider: "dsh", materials: { a: "b" } })).rejects.toThrow(TypeError);
    await expect(runSimpleReview({ stage: "build-code", host_provider: "", materials: { a: "b" } })).rejects.toThrow(TypeError);

    const result = await runSimpleReview(
      { stage: "build-code", host_provider: "dsh", materials: { a: "b" }, review_track: "default" },
      { resolveRoute: () => null },
    );
    expect(result.status).toBe("unavailable");
    expect(result.error.code).toBe("ROUTE_UNAVAILABLE");
  }, 2000);

  it("FR-LEFT-003: four fallback consumers do not regex-guess error codes", () => {
    for (const file of [
      "../../tools/cli/stage-runtime.mjs",
      "../../runtime/stage/stage-runner.mjs",
      "../../runtime/stage/stage-agent-outcome-adapter.mjs",
      "../../tools/host/workflowhub-stage-agent-bridge.mjs",
    ]) {
      const src = readFileSync(fileURLToPath(new URL(file, import.meta.url)), "utf8");
      expect(src).not.toMatch(/match\(.*error\.message.*\)/i);
      expect(src).not.toMatch(/message\.match\(/i);
    }
  });

  it("FR-LEFT-004/005: explicit code_review and agent outcome receipt consumers exist", () => {
    const bridge = readFileSync(fileURLToPath(new URL("../../tools/host/workflowhub-stage-agent-bridge.mjs", import.meta.url)), "utf8");
    expect(bridge).toContain("agent_run_id");
    const outcomeAdapter = readFileSync(fileURLToPath(new URL("../../runtime/stage/stage-agent-outcome-adapter.mjs", import.meta.url)), "utf8");
    expect(outcomeAdapter).toContain("code_review");
    expect(outcomeAdapter).toContain("publishUnavailableStageAgentOutcome");
    const stageRunner = readFileSync(fileURLToPath(new URL("../../runtime/stage/stage-runner.mjs", import.meta.url)), "utf8");
    expect(stageRunner).toContain("agent_outcome");
  });
});
