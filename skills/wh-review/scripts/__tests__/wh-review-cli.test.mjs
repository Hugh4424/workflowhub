import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const cli = new URL("../wh-review-cli.mjs", import.meta.url);
const phaseCli = new URL("../wh-review.mjs", import.meta.url);

describe("wh-review production CLI", () => {
  it("keeps the public phase CLI to the three identity selectors", async () => {
    const { parsePhaseReviewArgv } = await import(phaseCli.href);
    expect(parsePhaseReviewArgv(["--project=Demo", "--task=t", "--phase-id=phase-0"])).toEqual({
      project_name: "Demo", task_id: "t", stage: "build-code", phase_id: "phase-0",
    });
    for (const injected of [
      "--materials=x", "--approved-spec=x", "--provider=claude", "--task-path=/tmp/t",
      "--subject=/tmp/subject.json", "--receipt=/tmp/receipt.json", "--config=/tmp/config.json",
    ]) {
      expect(() => parsePhaseReviewArgv(["--project=Demo", "--task=t", "--phase-id=phase-0", injected])).toThrow(/rejects argument/);
    }
  });

  it("assembles trusted phase materials before constructing the provider client", () => {
    const source = readFileSync(cli, "utf8");
    const bootstrap = source.indexOf("trustedTaskWorktree(input)");
    const assemble = source.indexOf("assembleTrustedPhaseMaterials(trusted.context, input.phase_id)");
    const provider = source.indexOf("providerClient();", bootstrap);
    const attempt = source.indexOf("runReview({", provider);
    expect(bootstrap).toBeGreaterThan(-1);
    expect(assemble).toBeGreaterThan(bootstrap);
    expect(provider).toBeGreaterThan(bootstrap);
    expect(assemble).toBeLessThan(attempt);
    expect(source).toContain('context.kernel.readAccepted("build-plan")');
    expect(source).toContain('context.artifacts.read("spec.md")');
    expect(source).toContain('context.artifacts.read("plan.md")');
    expect(source).toContain('context.artifacts.read("tasks.md")');
    expect(source).toContain("receipt.snapshot_tree !== subject.value.implementation.tree_oid");
  });

  it("rejects every non-canonical field in phase production mode before bootstrap", async () => {
    const { runReviewRound } = await import(cli.href);
    await expect(runReviewRound({ project_name: "Demo", task_id: "t", stage: "build-code", phase_id: "phase-0", task_path: "/tmp/x" })).rejects.toThrow(/accepts only|rejected/);
    await expect(runReviewRound({ projectName: "Demo", taskId: "t", stage: "build-code", phaseId: "phase-0" })).rejects.toThrow(/accepts only|rejected/);
    await expect(runReviewRound({ project_name: "Demo", task_id: "t", stage: "build-code", phase_id: "phase-0", materials: {} })).rejects.toThrow(/accepts only|rejected/);
  });
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

  it("accepts only phase_id as the phase scope selector", async () => {
    const { runReviewRound } = await import(cli.href);
    for (const field of ["path_filter", "paths", "base_commit", "candidate_commit", "commit_range", "diff"]) {
      await expect(runReviewRound({ [field]: "forged", task_path: "/tmp/task", stage: "build-code" })).rejects.toThrow(/forbidden/);
    }
  });
});
