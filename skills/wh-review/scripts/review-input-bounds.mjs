import { createHash } from "node:crypto";

/**
 * Keep the complete diff in the provider input. Provider capability, rather
 * than a local byte ceiling, decides whether delivery is possible.
 */
export function compactReviewDiff(diff) {
  if (typeof diff !== "string") throw new TypeError("review diff must be text");
  return {
    diff,
    index: {
      mode: "full",
      full_diff_bytes: Buffer.byteLength(diff, "utf8"),
      full_diff_sha256: createHash("sha256").update(diff).digest("hex"),
    },
  };
}

/**
 * Preserve the complete caller material. This compatibility seam keeps its
 * return shape, but no longer rewrites or rejects material by local size.
 */
export function compactVerifyCodeMaterials(materials) {
  return { materials, diff: null };
}
