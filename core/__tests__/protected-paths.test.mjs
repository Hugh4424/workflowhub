/**
 * protected-paths.test.mjs
 *
 * Pure-function tests for core/protected-paths.mjs.
 * These replace the CLI-layer tests that lived in check-path-guard.test.mjs.
 */

import { describe, it, expect } from "vitest";
import { findViolation, PROTECTED_PATHS } from "../protected-paths.mjs";

describe("findViolation — protected paths", () => {
  it("CONSTITUTION.md (protected) returns matching entry", () => {
    const result = findViolation("CONSTITUTION.md");
    expect(result).toBe("CONSTITUTION.md");
  });

  it("AGENTS.md (protected) returns matching entry", () => {
    const result = findViolation("AGENTS.md");
    expect(result).toBe("AGENTS.md");
  });

  it("CONTEXT.md (protected) returns matching entry", () => {
    const result = findViolation("CONTEXT.md");
    expect(result).toBe("CONTEXT.md");
  });
});

describe("findViolation — non-protected paths", () => {
  it("some/random.mjs (unprotected) returns null", () => {
    const result = findViolation("some/random.mjs");
    expect(result).toBeNull();
  });

  it("docs/AGENTS.md (same filename, different path) returns null — exact match only", () => {
    // FR-PATHG-001: protected list uses exact repo-relative paths, not suffix patterns.
    const result = findViolation("docs/AGENTS.md");
    expect(result).toBeNull();
  });

  it("subdir/CONSTITUTION.md returns null — nested path must not match root entry", () => {
    const result = findViolation("subdir/CONSTITUTION.md");
    expect(result).toBeNull();
  });
});

describe("findViolation — falsifiability check", () => {
  it("PROTECTED_PATHS is non-empty (list has entries to match against)", () => {
    // Guard: if PROTECTED_PATHS were empty, all findViolation calls would return null
    // and the above tests would be vacuously true.
    expect(PROTECTED_PATHS.length).toBeGreaterThan(0);
  });
});
