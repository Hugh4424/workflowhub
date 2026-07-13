import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const cli = new URL("../wh-review-cli.mjs", import.meta.url);

describe("wh-review v4 CLI", () => {
  it("exports only the V4 run/reset/verify-final workflow boundary", async () => {
    const mod = await import(cli.href);
    expect(typeof mod.runReviewRound).toBe("function");
    expect(typeof mod.resetReviewFlow).toBe("function");
    expect(typeof mod.verifyFinalReview).toBe("function");
    expect(mod.prepareReview).toBeUndefined();
    expect(mod.executeReview).toBeUndefined();
  });

  it("does not import a legacy runner or expose its argv", () => {
    const source = readFileSync(cli, "utf8");
    for (const forbidden of ["invoke-review-engine", "prepareRoundState", "run-heterologous", "--diff", "--output"]) expect(source).not.toContain(forbidden);
    expect(source).toContain("BrokerClient");
    expect(source).toContain('command !== "run" && command !== "reset" && command !== "verify-final"');
    expect(source).not.toMatch(/provider_capabilities:\s*input|providerCapabilities:\s*input|attachment_delivery:\s*input|attachmentDelivery:\s*input/);
  });

  it.each(["provider_capabilities", "providerCapabilities", "attachment_delivery", "attachmentDelivery"])("rejects caller-owned %s instead of forwarding it", async (field) => {
    const { runReviewRound } = await import(cli.href);
    await expect(runReviewRound({ [field]: {}, task_tracking_root: "/tmp", third_review: { command: "broker", config: "/cfg" } })).rejects.toThrow(field.toLowerCase().includes("delivery") ? /stage-skill-plan/ : /broker-owned/);
  });

  it("rejects broker command, config, and packet root supplied through CLI input", async () => {
    const { runReviewRound } = await import(cli.href);
    await expect(runReviewRound({ task_tracking_root: "/tmp", third_review: { command: "broker", config: "/config.json", attachment_root: "/packets" } })).rejects.toThrow(/host-configured/);
    await expect(runReviewRound({ task_tracking_root: "/tmp", attachment_root: "/packets" })).rejects.toThrow(/host-configured/);
  });

  it.each([
    ["top-level diff", { unified_diff: "forged" }],
    ["packet hash", { packet: { packet_hash: "0".repeat(64) } }],
    ["repository root", { repository_root: "/tmp/forged-repo" }],
    ["source root alias", { sourceRoot: "/tmp/forged-repo" }],
  ])("rejects caller-supplied %s before loading host configuration", async (_label, fields) => {
    const { runReviewRound } = await import(cli.href);
    await expect(runReviewRound({ task_tracking_root: "/tmp", task_id: "safe-task", ...fields })).rejects.toThrow(/SOURCE_FIELDS_FORBIDDEN/);
  });
});
