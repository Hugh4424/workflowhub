import { describe, expect, it } from "vitest";

import { phaseTraceMatchesCanonicalScan } from "../phase-review-subject.mjs";

describe("published Phase trace diff-scan bindings", () => {
  it("accepts the official guarded C2 fields when they match the canonical scan", () => {
    const scan = {
      allowed_files: ["runtime/example.mjs"],
      changed_files: ["runtime/example.mjs"],
      guarded_c2_paths: ["package.json", "tools/cli/ci-chain-check.mjs"],
      guarded_changes: [{ path: "package.json", reason: "phase-local-c2-path-rule-exception" }],
    };

    expect(phaseTraceMatchesCanonicalScan({ ...scan }, scan)).toBe(true);
  });

  it("rejects a trace that drops or changes guarded C2 bindings", () => {
    const scan = {
      allowed_files: ["runtime/example.mjs"],
      changed_files: ["runtime/example.mjs"],
      guarded_c2_paths: ["package.json"],
      guarded_changes: [{ path: "package.json", reason: "phase-local-c2-path-rule-exception" }],
    };

    expect(phaseTraceMatchesCanonicalScan({ ...scan, guarded_c2_paths: [] }, scan)).toBe(false);
    expect(phaseTraceMatchesCanonicalScan({
      ...scan,
      guarded_changes: [{ path: "package.json", reason: "tampered" }],
    }, scan)).toBe(false);
  });

  it("keeps legacy traces compatible when both scans have no guarded fields", () => {
    const scan = {
      allowed_files: ["runtime/example.mjs"],
      changed_files: ["runtime/example.mjs"],
    };

    expect(phaseTraceMatchesCanonicalScan({ ...scan }, scan)).toBe(true);
  });
});
