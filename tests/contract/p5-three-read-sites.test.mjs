// ORACLE-P6-TERMINAL-RECOMPUTE / ORACLE-P6-THREE-SITES
// The terminal chain recomputes the card status with the same pure function and
// compares the stored contract's fingerprint; the three read faces (material
// check, terminal chain, close) must name the same deleted reference in the same
// fingerprint. The archive baseline must not move.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runFinalChainCheck } from "../../runtime/task/final-chain-runner.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const archiveMaterial = join(repoRoot, "specs/archive/delivery-quality-code-20261124");
const T4 = process.env.P6_T4_TASK_ROOT ?? "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-code-20261124";
const TASK_ROOT = process.env.P6_TASK_ROOT ?? "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/delivery-quality-acceptance-20261126";
const HEX64 = /^[a-f0-9]{64}$/;

describe("terminal chain recomputes the same card status", () => {
  it("carries the shared fingerprint and report, and keeps the archive baseline", () => {
    const report = runFinalChainCheck({ taskPath: T4, materialRoot: archiveMaterial });
    expect(report.ac_status).toBeTruthy();
    expect(report.ac_status.fingerprint).toMatch(HEX64);
    expect(report.ac_status.counts).toEqual({ pass: 61, incomplete: 11, partial: 2, inconclusive: 1, unavailable: 1, inconsistent: 2 });
    // The stored task-4 contract predates the card status, so it is honestly
    // "unknown" rather than invented as a match.
    expect(report.ac_status.original).toBe("unknown");
    // Recorded P5 archive baseline: ring 5 stays completed; the divergence is
    // recorded (material_unclean) but only as a limit, never a new gate.
    expect(report.rings[5].state).toBe("completed");
    expect(report.report.declared_total).toBe(78);
    expect(report.report.parts_sum).toBe(76);
    expect(report.report.diff).toBe(2);
    expect(report.report.source).toBe("summary-line");
  });
});

describe("three read sites agree after one reference is deleted", () => {
  it("records one fingerprint and names AC-P9-003 in material check, terminal chain and close", () => {
    const path = join(TASK_ROOT, "quality/evidence/p5-replay/three-sites.json");
    const evidence = JSON.parse(readFileSync(path, "utf8"));
    expect(evidence.a.fingerprint).toMatch(HEX64);
    expect(evidence.b.fingerprint).toBe(evidence.a.fingerprint);
    // The close face does not persist a full fingerprint; its refusal message
    // carries the same fingerprint's first 12 hex, which must match A and B.
    expect(evidence.c.fingerprint_prefix).toBe(evidence.a.fingerprint.slice(0, 12));
    for (const face of ["a", "b", "c"]) {
      expect(Array.isArray(evidence[face].named_ids), face).toBe(true);
      expect(evidence[face].named_ids, face).toContain("AC-P9-003");
      expect(evidence[face].source_kind, face).toBeTruthy();
    }
    expect(evidence.clean_pass_before).toBe(55);
    expect(evidence.clean_pass_after).toBe(54);
    expect(evidence.delete_patch_sha256).toMatch(HEX64);
    expect(evidence.script_sha256).toMatch(HEX64);
    expect(evidence.copy_root_outside_worktree).toBe(true);
  });
});
