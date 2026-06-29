/**
 * m12-subskill-exclusion.test.mjs — Guard test for sub-skill marker-gated
 * skip in scanSkillMetrics (check-stage-quality.mjs).
 *
 * FALSIFIABLE in both directions:
 *   (a) SKILL.md WITH `kind: sub-skill` marker but NO metrics wiring →
 *       scanSkillMetrics returns found:false (skipped — helper metrics covered
 *       by orchestrator per plan S4).
 *   (b) SKILL.md WITHOUT the marker and NO metrics wiring →
 *       scanSkillMetrics returns found:true (STILL flagged — exclusion is
 *       marker-gated, not a blanket "skip if unwired").
 *
 * Proves the exclusion is marker-gated, not a blanket bypass.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

let workDir;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), "m12-subskill-exclusion-"));
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// (a) Marker present → SKIPPED: helper sub-skill, no wiring needed
// ---------------------------------------------------------------------------

describe("sub-skill marker exclusion — marker present (skipped)", () => {
  it("scanSkillMetrics returns found:false for SKILL.md with kind:sub-skill marker but NO metrics wiring", async () => {
    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
    const skillDir = join(workDir, "workflows", "helper-skill");
    mkdirSync(skillDir, { recursive: true });
    const skillPath = join(skillDir, "SKILL.md");
    writeFileSync(skillPath, `---
kind: sub-skill  # helper invoked within build-plan; metrics covered by orchestrator
name: helper-skill
description: A helper sub-skill with no metrics wiring — must be skipped by scan.
---

# helper-skill

## Goal

Do some internal work for the parent stage. Does NOT produce its own stage-result.
No recordSkeleton, no updateOwnResult, no collector.mjs — by design.
`, "utf8");

    const result = scanSkillMetrics(skillPath);
    // Marker-gated skip: kind:sub-skill → found:false even without wiring
    // FALSIFIABLE: if the marker check were broken, this returns found:true → test fails
    expect(result.found).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// (b) Marker absent → STILL FLAGGED: no marker, no wiring → violation
// ---------------------------------------------------------------------------

describe("sub-skill marker exclusion — marker absent (still flagged)", () => {
  it("scanSkillMetrics returns found:true for SKILL.md WITHOUT kind:sub-skill marker and NO metrics wiring", async () => {
    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
    const skillDir = join(workDir, "workflows", "plain-skill");
    mkdirSync(skillDir, { recursive: true });
    const skillPath = join(skillDir, "SKILL.md");
    writeFileSync(skillPath, `---
name: plain-skill
description: A plain skill with no kind marker and no metrics wiring.
---

# plain-skill

## Goal

Do some work and produce a result. Missing recordSkeleton/updateOwnResult.
`, "utf8");

    const result = scanSkillMetrics(skillPath);
    // No marker → old behavior: unwired skill is still flagged
    // FALSIFIABLE: if the scanner blindly skips all unwired skills, this returns
    // found:false and the test fails
    expect(result.found).toBe(true);
    expect(result.missingSkill).toMatch(/plain-skill/);
  });
});
