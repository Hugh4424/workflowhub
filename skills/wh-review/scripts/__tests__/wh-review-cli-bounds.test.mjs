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

test("compactReviewDiff keeps provider diff below budget and preserves implementation/test coverage", () => {
  const full = section("runtime/review.mjs", 120 * 1024) + section("tests/review.test.mjs", 120 * 1024) + section("README.md", 80 * 1024);
  const result = compactReviewDiff(full);
  expect(result.index.mode).toBe("bounded");
  expect(Buffer.byteLength(result.diff, "utf8")).toBeLessThanOrEqual(180 * 1024);
  expect(result.diff).toContain("diff --git a/runtime/review.mjs b/runtime/review.mjs");
  expect(result.diff).toContain("WH_REVIEW_TRUNCATED_SECTION");
  expect(result.index.full_diff_bytes).toBe(Buffer.byteLength(full, "utf8"));
  expect(result.index.omitted_paths).toEqual(expect.arrayContaining([
    expect.objectContaining({ path: "README.md", kind: "summary" }),
  ]));
});

test("compactReviewDiff leaves a small diff byte-identical", () => {
  const full = section("runtime/review.mjs", 10);
  const result = compactReviewDiff(full);
  expect(result.index.mode).toBe("full");
  expect(result.diff).toBe(full);
});

test("compactVerifyCodeMaterials projects an oversized implementation diff and records its full hash", () => {
  const full = section("runtime/review.mjs", 200 * 1024);
  const result = compactVerifyCodeMaterials({ "implementation-diff.patch": full, "review-scope": "current code" });
  expect(result.diff.mode).toBe("bounded");
  expect(result.materials["implementation-diff.patch"]).toContain("diff --git a/runtime/review.mjs");
  expect(result.materials["implementation-index"].delivery.full_diff_sha256).toBe(result.diff.full_diff_sha256);
  expect(Buffer.byteLength(result.materials["implementation-diff.patch"], "utf8")).toBeLessThanOrEqual(180 * 1024);
});
