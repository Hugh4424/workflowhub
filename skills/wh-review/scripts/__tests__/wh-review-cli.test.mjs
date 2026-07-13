import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const cli = new URL("../wh-review-cli.mjs", import.meta.url);

describe("wh-review v4 CLI", () => {
  it("exports only the V4 run/reset workflow boundary", async () => {
    const mod = await import(cli.href);
    expect(typeof mod.runReviewRound).toBe("function");
    expect(typeof mod.resetReviewFlow).toBe("function");
    expect(mod.prepareReview).toBeUndefined();
    expect(mod.executeReview).toBeUndefined();
  });

  it("does not import a legacy runner or expose its argv", () => {
    const source = readFileSync(cli, "utf8");
    for (const forbidden of ["invoke-review-engine", "prepareRoundState", "run-heterologous", "--diff", "--output"]) expect(source).not.toContain(forbidden);
    expect(source).toContain("BrokerClient");
    expect(source).toContain('command !== "run" && command !== "reset"');
    expect(source).not.toMatch(/provider_capabilities|providerCapabilities/);
  });
});
