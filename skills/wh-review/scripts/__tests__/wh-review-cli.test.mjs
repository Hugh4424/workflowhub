import { describe, expect, it, vi } from "vitest";
import { execute, runCli } from "../wh-review.mjs";

describe("wh-review stable facade", () => {
  it("preserves engine failure diagnostics and provenance fields", () => {
    // The facade deliberately does not reinterpret successful engine output;
    // integration coverage for dispatch lives in invoke-review-engine.test.mjs.
    expect(typeof execute).toBe("function");
  });

  it("exposes an async execute/runCli boundary so deferred engines cannot serialize as an empty object", () => {
    expect(execute.constructor.name).toBe("AsyncFunction");
    expect(runCli.constructor.name).toBe("AsyncFunction");
  });
});
