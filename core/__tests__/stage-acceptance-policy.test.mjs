import { describe, expect, it } from "vitest";

import { acceptanceModeFor, requiresHumanConfirmation } from "../../runtime/stage/stage-acceptance-policy.mjs";

describe("stage acceptance policy", () => {
  it.each([
    ["make-decision", "human"],
    ["build-spec", "automatic"],
    ["build-plan", "human"],
    ["build-code", "automatic"],
    ["verify-code", "human"],
  ])("maps %s to %s acceptance", (stage, mode) => {
    expect(acceptanceModeFor(stage)).toBe(mode);
    expect(requiresHumanConfirmation(stage)).toBe(mode === "human");
  });

  it("rejects unknown stages", () => {
    expect(() => acceptanceModeFor("unknown")).toThrow(/unsupported stage/i);
  });
});
