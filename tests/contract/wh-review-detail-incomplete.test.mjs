// T067 / AC-P12-001: the make-decision detail track is the one document surface
// whose caller material contract is closed (raw_requirement + approved_direction,
// runtime/review/stage-materials.json). Before T067 a detail request that named
// no known key was dispatched as a complete review, and a request missing a
// required key was blocked with a computed, non-null material_id. These five
// cases judge the runner result fields the record layer persists; they never
// judge a process exit code (that chain exits 0 today).
import { existsSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { runSimpleReview } from "../../skills/wh-review/scripts/simple-review-runner.mjs";

const roots = [];
afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

const PROVIDERS = ["source-a/model-a", "source-b/model-b"];

// The host boundary is controlled; the production runner still decides whether
// any provider call happens, which fields the blocked result owns and whether a
// packet is created under the attachment root.
function controlledDependencies(attachmentRoot, calls) {
  return {
    loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot, command: ["unused"] }),
    resolveRoute: () => ({ initial: PROVIDERS, mode: "single_round" }),
    selectProviders: () => ({
      providers: PROVIDERS,
      provider_models: { [PROVIDERS[0]]: "model-a", [PROVIDERS[1]]: "model-b" },
    }),
    client: {
      async runGroup() {
        calls.push(1);
        return {
          runtimeId: "controlled-p12-detail",
          outcome: "completed",
          providers: PROVIDERS.map((provider, index) => ({
            provider,
            status: "completed",
            identity: { provider, model: index === 0 ? "model-a" : "model-b" },
            error: null,
            output: JSON.stringify({ findings: [] }),
            timing: null,
            usage: null,
          })),
        };
      },
    },
  };
}

async function review(input) {
  const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "p12-detail-incomplete-")));
  roots.push(attachmentRoot);
  const calls = [];
  const result = await runSimpleReview(input, controlledDependencies(attachmentRoot, calls));
  return { attachmentRoot, calls, result };
}

function expectBlockedBeforeDispatch(result, calls, attachmentRoot, field) {
  expect(result.status).toBe("unavailable");
  expect(result.error.code).toBe("MATERIAL_INCOMPLETE");
  expect(result.error.diagnostic.field).toBe(field);
  expect(result.error.message).toContain(field);
  expect(result.provider_results).toEqual([]);
  expect(result.dispatch_state).toBe("blocked_before_dispatch");
  expect(calls).toHaveLength(0);
  expect(existsSync(join(attachmentRoot, ".wh-review-packets"))).toBe(false);
}

describe("make-decision detail material incompleteness", () => {
  it("ORACLE-P12-DETAIL-INCOMPLETE-1 refuses an instructions-only request before dispatch", async () => {
    const { attachmentRoot, calls, result } = await review({
      stage: "make-decision",
      review_track: "detail",
      materials: { instructions: "Only an instruction string is supplied." },
    });
    expectBlockedBeforeDispatch(result, calls, attachmentRoot, "raw_requirement");
    // A blocked request has no authenticated material identity.
    expect(result.material_id).toBeNull();
  });

  it("ORACLE-P12-DETAIL-INCOMPLETE-2 names approved_direction and drops the material id", async () => {
    const { attachmentRoot, calls, result } = await review({
      stage: "make-decision",
      review_track: "detail",
      materials: { raw_requirement: "The current raw requirement is supplied." },
    });
    expectBlockedBeforeDispatch(result, calls, attachmentRoot, "approved_direction");
    // The missing-key branch owns material_id=null in every activation cohort,
    // not only the terminal one; make-decision has no cohort.
    expect(result.material_id).toBeNull();
  });

  it("ORACLE-P12-DETAIL-INCOMPLETE-3 names raw_requirement when only the direction is supplied", async () => {
    const { attachmentRoot, calls, result } = await review({
      stage: "make-decision",
      review_track: "detail",
      materials: { approved_direction: "The approved direction is supplied." },
    });
    // One key is not enough: the existing required-material branch still names
    // the first missing required key in contract order.
    expectBlockedBeforeDispatch(result, calls, attachmentRoot, "raw_requirement");
  });

  it("ORACLE-P12-DETAIL-INCOMPLETE-4 keeps a complete request available with two providers", async () => {
    const { attachmentRoot, calls, result } = await review({
      stage: "make-decision",
      review_track: "detail",
      materials: {
        raw_requirement: "The current raw requirement is supplied.",
        approved_direction: "The approved direction is supplied.",
      },
    });
    expect(result.status).toBe("available");
    expect(result.provider_results).toHaveLength(2);
    expect(result.provider_results.every((member) => member.status === "completed")).toBe(true);
    expect(result.material_id).toMatch(/^[a-f0-9]{64}$/);
    expect(calls).toHaveLength(1);
    expect(existsSync(join(attachmentRoot, ".wh-review-packets"))).toBe(true);
  });

  it("ORACLE-P12-DETAIL-INCOMPLETE-5 keeps build-prd unknown-key material forbidden", async () => {
    const { calls, result } = await review({
      stage: "build-prd",
      review_kind: "build_prd",
      materials: { junk_material: "x" },
    });
    // This is the forbidden boundary, not an incomplete one: the detail-only
    // branch must not turn build-prd unknown keys into MATERIAL_INCOMPLETE.
    expect(result.status).toBe("unavailable");
    expect(result.error.code).toBe("MATERIAL_FORBIDDEN");
    expect(result.error.diagnostic.field).toBe("junk_material");
    expect(result.provider_results).toEqual([]);
    expect(calls).toHaveLength(0);
  });
});
