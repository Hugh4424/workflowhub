import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runSimpleReview } from "../../skills/wh-review/scripts/simple-review-runner.mjs";

// P3/T003: frozen behavior oracle from decision D-010 and AC-003.
// The host route and terminal provider boundary are controlled; the actual
// candidate-worktree runner decides how many public group calls to make.
const roots = [];
afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

async function dispatch(track) {
  const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "n3-detail-dispatch-")));
  roots.push(attachmentRoot);
  const profiles = ["source-a/model-a", "source-b/model-b"];
  const calls = [];
  const result = await runSimpleReview({
    stage: "make-decision",
    review_track: track,
    materials: track === "detail"
      ? { raw_requirement: "Each configured reviewer examines the complete detail once.", approved_direction: "Keep direction paired; remove detail pairing." }
      : { raw_requirement: "Review the user need independently.", objective_facts: "Two explicit profiles are configured.", convergence_outline: "Need, boundary, failure, and smaller reversible option.", current_selection: "Preserve independent red and blue direction roles." },
  }, {
    loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
    resolveRoute: () => ({ initial: profiles, mode: "single_round", minimum_heterologous: 1 }),
    selectProviders: () => ({ providers: profiles, provider_models: { [profiles[0]]: "model-a", [profiles[1]]: "model-b" } }),
    client: {
      async runGroup(request) {
        calls.push({ profiles: [...request.providers], pairId: request.pair_id, role: request.role });
        return {
          runtimeId: `controlled-${track}-${calls.length}`,
          outcome: "completed",
          providers: profiles.map((provider, index) => ({
            provider, status: "completed", identity: { provider, model: index === 0 ? "model-a" : "model-b" },
            error: null, output: JSON.stringify({ findings: [] }), timing: null, usage: null,
          })),
        };
      },
    },
  });
  // A setup/material/identity failure must not masquerade as the target RED.
  expect(result.status, "controlled provider boundary reaches a usable terminal result").toBe("available");
  return { result, calls, profiles };
}

describe("N3 AC-003 public dispatch behavior", () => {
  it("ORACLE-N3-DETAIL-ONCE: dispatches every configured detail profile exactly once", async () => {
    const { result, calls, profiles } = await dispatch("detail");
    for (const profile of profiles) {
      expect(calls.filter(call => call.profiles.includes(profile)), `ORACLE-N3-DETAIL-ONCE ${profile}`).toHaveLength(1);
    }
    expect(calls).toHaveLength(1);
    expect(calls[0].role).toBeFalsy();
    expect(calls[0].pairId).toBeFalsy();
    expect(result.role_results).toBeUndefined();
  });

  it("ORACLE-N3-DIRECTION-PAIRED: preserves both independent roles for every direction profile", async () => {
    const { result, calls, profiles } = await dispatch("direction");
    expect(calls).toHaveLength(2);
    for (const profile of profiles) {
      expect(calls.filter(call => call.profiles.includes(profile))).toHaveLength(2);
    }
    expect(calls.map(call => call.role).sort()).toEqual(["blue", "red"]);
    expect(new Set(calls.map(call => call.pairId)).size).toBe(1);
    expect(calls[0].pairId).toEqual(expect.any(String));
    expect(result.role_results.red.role).toBe("red");
    expect(result.role_results.blue.role).toBe("blue");
  });
});
