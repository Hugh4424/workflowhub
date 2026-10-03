import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runSimpleReview } from "../../skills/wh-review/scripts/simple-review-runner.mjs";

function currentPhaseRequest() {
  return { stage: "build-code", activation_cohort: "post", subject_kind: "phase", phase_id: "P1", surface: "code",
    review_scope: "phase", review_track: null,
    materials: { approved_spec: "# Approved current scope\n\nAC-OWNED: preserve the submitted task result.\n",
      acceptance_criteria: "AC-OWNED: verify the actual submitted scope.\n", test_evidence: "Current test evidence is unknown; no completion is inferred.\n" } };
}

describe("left-shift current input and typed failures", () => {
  it("FR-LEFT-002/003: actual review rejects malformed inputs and retired integration identity as TypeError", async () => {
    await expect(runSimpleReview(null)).rejects.toThrow(TypeError);
    await expect(runSimpleReview({ ...currentPhaseRequest(), materials: {} })).rejects.toThrow(TypeError);
    await expect(runSimpleReview({ ...currentPhaseRequest(), materials: [] })).rejects.toThrow(TypeError);
    await expect(runSimpleReview({ ...currentPhaseRequest(), stage: "" })).rejects.toThrow(TypeError);
    await expect(runSimpleReview({ ...currentPhaseRequest(), review_scope: "integration" })).rejects.toThrow(TypeError);
    await expect(runSimpleReview({ ...currentPhaseRequest(), review_track: "direction" })).rejects.toThrow(TypeError);
  });

  it("FR-LEFT-003: current phase route absence and host config failure stay typed unavailable before preparation or dispatch", async () => {
    const input = currentPhaseRequest(), original = JSON.stringify(input); let bundleCalls = 0, dispatchCalls = 0;
    const owned = { loadConfig: () => ({ whReview: {}, config: "/owned-unused-no-dispatch.json", command: ["owned-never-launched"] }),
      resolveRoute: () => null, buildBundle() { bundleCalls += 1; throw new Error("owned bundle must not be reached"); },
      client: { runGroup() { dispatchCalls += 1; throw new Error("owned provider must not be reached"); } } };
    const missing = await runSimpleReview(input, owned);
    expect(missing.status).toBe("unavailable"); expect(missing.error.code).toBe("ROUTE_UNAVAILABLE");
    const config = await runSimpleReview(input, { ...owned, loadConfig() { throw Object.assign(new Error("MATERIAL_FORBIDDEN invalid input parser message is owned diagnostic only"), { code: "OWNED_CONFIG_ERROR" }); } });
    expect(config.status).toBe("unavailable"); expect(config.error.code).toBe("ROUTE_UNAVAILABLE");
    expect(config.error.message).toContain("MATERIAL_FORBIDDEN invalid input parser message");
    expect(bundleCalls).toBe(0); expect(dispatchCalls).toBe(0); expect(JSON.stringify(input)).toBe(original);
  });

  it("FR-LEFT-003: surviving fallback consumers do not regex-guess control errors from messages", () => {
    for (const file of ["../../tools/cli/stage-runtime.mjs", "../../skills/wh-review/scripts/simple-review-runner.mjs", "../../runtime/review/review-record-route.mjs"]) {
      const src = readFileSync(fileURLToPath(new URL(file, import.meta.url)), "utf8");
      expect(src).not.toMatch(/match\(.*error\.message.*\)/i); expect(src).not.toMatch(/message\.match\(/i);
    }
  });

  it("FR-C5-002/003: current TaskHandle and task-close retain no retired source-card path", () => {
    for (const file of ["../../runtime/task/task-handle.mjs", "../../tools/cli/task-close.mjs"]) {
      const src = readFileSync(fileURLToPath(new URL(file, import.meta.url)), "utf8");
      expect(src).not.toMatch(/path-card|path card|PATH_CARD|createPathCardRecord|persistWriteBoundaryPathCard/i);
    }
  });
});
