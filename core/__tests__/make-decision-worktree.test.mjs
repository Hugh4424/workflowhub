import { describe, it, expect } from "vitest";
import { branchSlugFromTaskId, normalizeRemoteUrl } from "../make-decision-worktree.mjs";

describe("make-decision-worktree helpers", () => {
  it("normalizes equivalent GitHub remote URL forms", () => {
    expect(normalizeRemoteUrl("https://github.com/Hugh4424/workflowhub.git")).toBe(
      "https://github.com/Hugh4424/workflowhub"
    );
    expect(normalizeRemoteUrl("https://github.com/Hugh4424/workflowhub/")).toBe(
      "https://github.com/Hugh4424/workflowhub"
    );
  });

  it("derives a downstream-valid branch slug from an M-series task id", () => {
    expect(branchSlugFromTaskId("m14a-audit-contract-layer")).toBe("audit-contract-layer");
  });

  it("keeps already-valid task ids unchanged", () => {
    expect(branchSlugFromTaskId("worktree-unification")).toBe("worktree-unification");
  });

  it("fails when no valid lowercase alphabetic 2-3 word slug can be derived", () => {
    expect(() => branchSlugFromTaskId("m14a")).toThrow(/cannot derive a branch slug/);
  });
});
