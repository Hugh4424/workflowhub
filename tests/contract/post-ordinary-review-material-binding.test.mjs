import { describe, expect, it } from "vitest";
import { materialRevisionFromValues } from "../../runtime/task/git-worktree-snapshot.mjs";
import { ordinaryReviewMaterialRevision } from "../../runtime/evidence/freshness.mjs";

const post = {
  "decision-log.md": "decision", "spec.md": "spec",
  "phases/index.md": "## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n| `P1` | `phases/P1.md` |\n| `P2` | `phases/P2.md` |\n",
  "phases/P1.md": "one", "phases/P2.md": "two",
};
const scope = Object.keys(post);

describe("post ordinary review material binding", () => {
  it("binds every indexed Phase from the canonical quality fact scope", () => {
    const before = ordinaryReviewMaterialRevision(post, scope);
    expect(before).toBe(materialRevisionFromValues(scope.map((file) => [file, post[file]])));
    expect(ordinaryReviewMaterialRevision({ ...post, "phases/P2.md": "changed" }, scope)).not.toBe(before);
  });

  it("rejects an omitted or unindexed Phase instead of falling back to four materials", () => {
    expect(() => ordinaryReviewMaterialRevision({ ...post, "phases/P2.md": undefined }, scope)).toThrow();
    expect(() => ordinaryReviewMaterialRevision({ ...post, "phases/P3.md": "extra" }, scope)).toThrow();
    expect(() => ordinaryReviewMaterialRevision(post, scope.slice(0, -1))).toThrow();
    expect(() => ordinaryReviewMaterialRevision(post)).toThrow();
  });

  it("keeps a scope-less historical pre review bound to four materials", () => {
    const pre = { "decision-log.md": "decision", "spec.md": "spec", "plan.md": "plan", "tasks.md": "tasks" };
    expect(ordinaryReviewMaterialRevision(pre)).toBe(materialRevisionFromValues(Object.entries(pre)));
  });
});
