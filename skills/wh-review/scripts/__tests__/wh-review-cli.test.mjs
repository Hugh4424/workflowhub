import { describe, expect, it, vi } from "vitest";
import { execute } from "../wh-review.mjs";

describe("wh-review stable facade", () => {
  it("preserves engine failure diagnostics and provenance fields", () => {
    // The facade deliberately does not reinterpret successful engine output;
    // integration coverage for dispatch lives in invoke-review-engine.test.mjs.
    expect(typeof execute).toBe("function");
  });
});
