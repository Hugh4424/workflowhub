import { createHash } from "node:crypto";

import { expect, test } from "vitest";
import { compactReviewDiff, compactVerifyCodeMaterials } from "../review-input-bounds.mjs";

function section(path, bytes) {
  return "diff --git a/" + path + " b/" + path + "\n"
    + "index 0000000..1111111 100644\n"
    + "--- a/" + path + "\n"
    + "+++ b/" + path + "\n"
    + "@@ -1 +1 @@\n"
    + "+" + "x".repeat(bytes) + "\n";
}

test("keeps a provider diff above 486777B byte-identical without a local truncation marker", () => {
  const full = section("runtime/review.mjs", 260 * 1024)
    + section("tests/review.test.mjs", 260 * 1024)
    + section("README.md", 80 * 1024);
  expect(Buffer.byteLength(full, "utf8")).toBeGreaterThan(486777);

  const result = compactReviewDiff(full);

  expect(result.diff).toBe(full);
  expect(result.index).toEqual({
    mode: "full",
    full_diff_bytes: Buffer.byteLength(full, "utf8"),
    full_diff_sha256: createHash("sha256").update(full).digest("hex"),
  });
  expect(result.diff).not.toContain("WH_REVIEW_TRUNCATED_SECTION");
});

test("keeps oversized verify-code materials byte-identical without a local size failure", () => {
  const full = section("runtime/review.mjs", 260 * 1024)
    + section("tests/review.test.mjs", 260 * 1024);
  const materials = {
    "implementation-diff.patch": full,
    runtime_current_materials: {
      "decision-log.md": "d".repeat(64 * 1024),
      "spec.md": "s".repeat(64 * 1024),
      "plan.md": "p".repeat(64 * 1024),
      "tasks.md": "t".repeat(64 * 1024),
    },
  };
  expect(Buffer.byteLength(JSON.stringify(materials), "utf8")).toBeGreaterThan(486777);

  const result = compactVerifyCodeMaterials(materials);

  expect(result).toEqual({ materials, diff: null });
  expect(result.materials).toBe(materials);
  expect(JSON.stringify(result.materials)).not.toContain("WH_REVIEW_TRUNCATED_SECTION");
  expect(JSON.stringify(result.materials)).not.toContain("Bounded verify-code context:");
});
