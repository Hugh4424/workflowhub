import { expect, test } from "vitest";
import { runReviewRecovery } from "../../skills/wh-review/scripts/wh-review-cli.mjs";

test("WorkflowHub sends one broker request and preserves unavailable instead of adding retries", async () => {
  let calls = 0;
  const result = await runReviewRecovery({ snapshot_tree: "tree", material_id: "material" }, {
    runRound: async () => {
      calls += 1;
      return { status: "unavailable", error_code: "PROCESS_DEAD", snapshot_tree: "tree", material_id: "material" };
    },
  });
  expect(calls).toBe(1);
  expect(result.status).toBe("unavailable");
  expect(result.recovery).not.toBe("same_source_fallback");
});
