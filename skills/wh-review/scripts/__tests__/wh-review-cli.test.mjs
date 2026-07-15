import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const cli = new URL("../wh-review-cli.mjs", import.meta.url);

describe("wh-review production CLI", () => {
  it("exports only run and verify-final operations", async () => {
    const mod = await import(cli.href);
    expect(typeof mod.runReviewRound).toBe("function");
    expect(typeof mod.verifyFinalReview).toBe("function");
    expect(mod.resetReviewFlow).toBeUndefined();
    expect(mod.recoverReviewProjections).toBeUndefined();
  });

  it("uses the simple runner and no V4 facade or legacy argv", () => {
    const source = readFileSync(cli, "utf8");
    expect(source).toContain('new Set(["run", "verify-final"])');
    expect(source).toContain("ReviewProviderClient");
    expect(source).toContain("runReview");
    for (const forbidden of ["ReviewRoundFacade", "BrokerClient", "resetReviewFlow", "recoverReviewProjections", "run-heterologous", "--diff", "--output"]) expect(source).not.toContain(forbidden);
  });

  it("requires an absolute task tracking root before loading host config", async () => {
    const { runReviewRound, verifyFinalReview } = await import(cli.href);
    await expect(runReviewRound({ task_tracking_root: "relative", task_id: "task" })).rejects.toThrow(/absolute/);
    expect(() => verifyFinalReview({ task_tracking_root: "relative", task_id: "task" })).toThrow(/absolute/);
  });
});
