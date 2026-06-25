import { describe, it, expect } from "vitest";
import { truncateWords } from "../core/text-utils.mjs";

describe("truncateWords", () => {
  it("truncates to maxWords and appends ellipsis", () => {
    expect(truncateWords("hello world foo", 2)).toBe("hello world…");
  });

  it("returns original string when under limit", () => {
    expect(truncateWords("short", 5)).toBe("short");
  });

  it("handles maxWords=0 boundary", () => {
    expect(truncateWords("a b c d e", 0)).toBe("…");
  });

  it("returns empty string for empty input", () => {
    expect(truncateWords("", 3)).toBe("");
  });
});
