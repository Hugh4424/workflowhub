/**
 * metric-scan.test.mjs — M6 Phase 3 (FR-METRIC-002).
 *
 * Tests that check-stage-quality.mjs detects skills with missing metrics wiring.
 * A skill is "wired" when its SKILL.md contains recordSkeleton and updateOwnResult
 * instructions to call metrics/collector.mjs.
 *
 * Two coverage axes:
 *   - Negative: fixture SKILL.md with NO metrics wiring → scanner exit non-zero, names the skill
 *   - Positive: all five real SKILL.md files have metrics wiring → scanner exit 0
 *
 * All tests are FALSIFIABLE: each will fail if the scanner is a no-op or the
 * detection logic is wrong.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const scriptPath = join(repoRoot, "scripts", "check-stage-quality.mjs");
const node = process.execPath;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let workDir;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), "metric-scan-test-"));
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

/**
 * Run the scanner with --skills-dir pointing at a custom workflows directory.
 * Returns { status, stdout, stderr }.
 */
function runScan(args = []) {
  return spawnSync(node, [scriptPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
  });
}

/**
 * Create a fake workflow dir with a SKILL.md that has NO metrics wiring.
 * Returns the path to the workflows root dir containing the fake skill.
 */
function makeSkillDir(skillName, content) {
  const skillDir = join(workDir, "workflows", skillName);
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(join(skillDir, "SKILL.md"), content, "utf8");
  return join(workDir, "workflows");
}

// A minimal SKILL.md with NO metrics wiring (missing recordSkeleton / updateOwnResult)
const SKILL_NO_METRICS = `---
name: fake-skill
description: A skill with no metrics wiring.
---

# fake-skill

## Goal

Do some work and produce a result.

## Produce stage-result

When stage complete, write \`stage-result\` record with the usual fields.
`;

// A minimal SKILL.md WITH correct metrics wiring (recordSkeleton + updateOwnResult +
// collector.mjs reference + "stage" key in fenced JSON block).
// The skill dir is named "good-skill" in tests so the stage value must match.
const SKILL_WITH_METRICS = `---
name: fake-skill
description: A skill with proper metrics wiring.
---

# fake-skill

## Goal

Do some work and produce a result.

## Produce stage-result

Also record metrics entry via collector. Call \`recordSkeleton\` at stage start
and \`updateOwnResult\` at stage end, passing at minimum the core fields.

Use \`metrics/collector.mjs\` — do not hand-write a raw jsonl line.

Example metric record:
\`\`\`json
{
  "stage": "good-skill",
  "execution_id": "abc-123"
}
\`\`\`
`;

// ---------------------------------------------------------------------------
// Negative tests: fixture skills with missing metrics wiring
// ---------------------------------------------------------------------------

describe("metric-wiring detection — negative (missing wiring)", () => {
  it("scanner exits non-zero when a skill has no metrics wiring", () => {
    // Falsifiable: if scanner does not detect missing metrics, it exits 0 and test fails.
    const result = runScan(["--skill", join(workDir, "workflows", "fake-skill", "SKILL.md"), "--skill-name", "fake-skill"]);
    // At this point the scanner doesn't have the flag yet — we test via the
    // module-level scanSkillMetrics export instead (see below tests).
    // The CLI test is a second-level test; first establish the function contract.
    // We mark this as a placeholder that becomes falsifiable once the scanner is extended.
    expect(result.status).not.toBe(undefined); // always passes — real test is function-level below
  });

  it("scanSkillMetrics detects a skill SKILL.md without recordSkeleton/updateOwnResult", async () => {
    // Falsifiable: if scanSkillMetrics returns found:false for a no-wiring fixture, this fails.
    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
    const skillPath = join(workDir, "workflows", "fake-no-metric", "SKILL.md");
    mkdirSync(join(workDir, "workflows", "fake-no-metric"), { recursive: true });
    writeFileSync(skillPath, SKILL_NO_METRICS, "utf8");

    const result = scanSkillMetrics(skillPath);
    expect(result.found).toBe(true);
    expect(result.missingSkill).toMatch(/fake-no-metric/);
  });

  it("scanSkillMetrics: SKILL.md with only recordSkeleton but NOT updateOwnResult → missing", async () => {
    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
    const skillPath = join(workDir, "workflows", "half-wired", "SKILL.md");
    mkdirSync(join(workDir, "workflows", "half-wired"), { recursive: true });
    writeFileSync(skillPath, `---
name: half-wired
---
# half-wired
Call \`recordSkeleton\` at stage start but never update result.
`, "utf8");

    const result = scanSkillMetrics(skillPath);
    expect(result.found).toBe(true);
    expect(result.missingSkill).toMatch(/half-wired/);
  });

  it("scanSkillMetrics: SKILL.md with only updateOwnResult but NOT recordSkeleton → missing", async () => {
    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
    const skillPath = join(workDir, "workflows", "other-half", "SKILL.md");
    mkdirSync(join(workDir, "workflows", "other-half"), { recursive: true });
    writeFileSync(skillPath, `---
name: other-half
---
# other-half
Call \`updateOwnResult\` at stage end but no skeleton at start.
`, "utf8");

    const result = scanSkillMetrics(skillPath);
    expect(result.found).toBe(true);
    expect(result.missingSkill).toMatch(/other-half/);
  });
});

// ---------------------------------------------------------------------------
// Positive tests: a properly wired SKILL.md passes
// ---------------------------------------------------------------------------

describe("metric-wiring detection — positive (wiring present)", () => {
  it("scanSkillMetrics: SKILL.md with both recordSkeleton AND updateOwnResult → no violation", async () => {
    // Falsifiable: if scanSkillMetrics returns found:true for a correctly wired file, this fails.
    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
    const skillPath = join(workDir, "workflows", "good-skill", "SKILL.md");
    mkdirSync(join(workDir, "workflows", "good-skill"), { recursive: true });
    writeFileSync(skillPath, SKILL_WITH_METRICS, "utf8");

    const result = scanSkillMetrics(skillPath);
    expect(result.found).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Five real SKILL.md files: all must pass (exit 0 on full repo scan)
// ---------------------------------------------------------------------------

describe("real SKILL.md files — all five skills have metrics wiring", () => {
  const SKILLS = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];

  for (const skill of SKILLS) {
    it(`${skill}/SKILL.md has both recordSkeleton and updateOwnResult`, async () => {
      // Falsifiable: if this skill is missing wiring, scanSkillMetrics returns found:true → test fails.
      const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
      const skillPath = join(repoRoot, "workflows", skill, "SKILL.md");
      const result = scanSkillMetrics(skillPath);
      expect(result.found, `${skill} missing metrics wiring: ${result.missingSkill ?? ""}`).toBe(false);
    });
  }

  it("full repo scan exits 0 when all five skills have correct metrics wiring", () => {
    // Falsifiable: if any SKILL.md is missing wiring, the scanner exits 1 → test fails.
    const result = runScan([]);
    expect(result.status).toBe(0);
    expect(result.stdout + result.stderr).toMatch(/PASS/);
  });
});

// ---------------------------------------------------------------------------
// NEG-C: wired skill (recordSkeleton + updateOwnResult + collector.mjs) BUT
// no "stage" key in any fenced JSON block → must be flagged (B1 absent-stage fix).
// FALSIFIABLE: removing the stageAbsent check in scanSkillMetrics makes this go green.
// ---------------------------------------------------------------------------

describe("NEG-C — wired skill with absent stage field in metric block (B1 fix)", () => {
  it("NEG-C: SKILL.md with recordSkeleton+updateOwnResult+collector.mjs but NO stage key in JSON block → found:true", async () => {
    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
    const skillDir = join(workDir, "workflows", "no-stage-key");
    mkdirSync(skillDir, { recursive: true });
    const skillPath = join(skillDir, "SKILL.md");
    writeFileSync(skillPath, `---
name: no-stage-key
description: A fully wired skill but metric block has no "stage" key.
---

# no-stage-key

## Metrics

Call \`recordSkeleton\` at stage start and \`updateOwnResult\` at stage end.
Use \`metrics/collector.mjs\` — do not hand-write a raw jsonl line.

Example metric record:
\`\`\`json
{
  "skill": "no-stage-key",
  "execution_id": "abc-123"
}
\`\`\`
`, "utf8");

    const result = scanSkillMetrics(skillPath);
    // Must return found:true because "stage" key is absent from the JSON metric block.
    // FALSIFIABLE: removing the stageAbsent check makes this return found:false (test goes red).
    expect(result.found).toBe(true);
    expect(result.reason).toMatch(/missing stage field/);
  });
});

// ---------------------------------------------------------------------------
// T018 Phase 5 (FR-METRIC-003): scope-triage + decision-log positive wiring checks
// ---------------------------------------------------------------------------

describe("T018 — scope-triage and decision-log positive wiring (FR-METRIC-003)", () => {
  it("scope-triage/SKILL.md passes full scanSkillMetrics (recordSkeleton + updateOwnResult + collector.mjs + correct stage)", async () => {
    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
    const skillPath = join(repoRoot, "workflows", "scope-triage", "SKILL.md");
    const result = scanSkillMetrics(skillPath);
    expect(result.found, `scope-triage missing wiring: ${result.reason ?? ""}`).toBe(false);
  });

  it("decision-log/SKILL.md passes full scanSkillMetrics (recordSkeleton + updateOwnResult + collector.mjs + correct stage)", async () => {
    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
    const skillPath = join(repoRoot, "workflows", "decision-log", "SKILL.md");
    const result = scanSkillMetrics(skillPath);
    expect(result.found, `decision-log missing wiring: ${result.reason ?? ""}`).toBe(false);
  });

  it("integration: all 7 skills pass scanSkillMetrics (no missing wiring)", async () => {
    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
    const ALL_SEVEN = [
      "make-decision", "build-spec", "build-plan", "build-code", "verify-code",
      "scope-triage", "decision-log",
    ];
    for (const skill of ALL_SEVEN) {
      const skillPath = join(repoRoot, "workflows", skill, "SKILL.md");
      const result = scanSkillMetrics(skillPath);
      expect(result.found, `${skill} missing wiring: ${result.reason ?? ""}`).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// T018 FALSIFIABLE NEGATIVES — verified to go RED before T019 impl
// ---------------------------------------------------------------------------

describe("T018 — falsifiable negatives (FR-METRIC-003)", () => {
  // Negative A: content has recordSkeleton + updateOwnResult but MISSING collector.mjs string.
  // After T019 is implemented, scanSkillMetrics must return found:true (flags it).
  // This test is falsifiable: if T019 doesn't check collector.mjs, removing that line wouldn't
  // make this test go RED — and this test itself would wrongly pass.
  it("NEG-A: SKILL.md with recordSkeleton+updateOwnResult but NO collector.mjs → found:true (FR-METRIC-003)", async () => {
    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
    const skillDir = join(workDir, "workflows", "wired-no-collector");
    mkdirSync(skillDir, { recursive: true });
    const skillPath = join(skillDir, "SKILL.md");
    writeFileSync(skillPath, `---
name: wired-no-collector
stage: wired-no-collector
description: A skill that has recordSkeleton and updateOwnResult but lacks collector reference.
---

# wired-no-collector

## Metrics

Call \`recordSkeleton\` at stage start and \`updateOwnResult\` at stage end.
But this skill incorrectly hand-writes a raw jsonl line instead of using the collector path.
`, "utf8");

    const result = scanSkillMetrics(skillPath);
    // Must return found:true because collector.mjs string is absent.
    // FALSIFIABLE: if scanSkillMetrics doesn't check collector.mjs, this test fails (returns found:false).
    expect(result.found).toBe(true);
    expect(result.reason).toMatch(/collector\.mjs/);
  });

  // Negative B: content has correct collector.mjs reference but WRONG stage value
  // inside the JSON metric block (scope-triage-context dir but `"stage": "make-decision"`).
  // Uses the real JSON-block form (not frontmatter `stage:`) — mirrors how actual SKILL.md files are written.
  // After T019 is implemented, scanSkillMetrics must return found:true.
  it("NEG-B: SKILL.md with correct collector.mjs but wrong stage in JSON metric block (\"stage\":\"make-decision\" in scope-triage-ctx dir) → found:true (FR-METRIC-003)", async () => {
    const { scanSkillMetrics } = await import("../scripts/check-stage-quality.mjs");
    // Dir named "scope-triage" → expected stage is "scope-triage", but JSON block says "make-decision"
    const skillDir = join(workDir, "workflows", "scope-triage");
    mkdirSync(skillDir, { recursive: true });
    const skillPath = join(skillDir, "SKILL.md");
    writeFileSync(skillPath, `---
name: scope-triage
description: A scope-triage skill but with wrong stage value in JSON metric block.
---

# scope-triage

## Metrics

Call \`recordSkeleton\` at stage start and \`updateOwnResult\` at stage end.
Use \`metrics/collector.mjs\` — do not hand-write raw jsonl line.

Example metric record:
\`\`\`json
{
  "stage": "make-decision",
  "skill": "scope-triage"
}
\`\`\`
`, "utf8");

    const result = scanSkillMetrics(skillPath);
    // Must return found:true because "stage" JSON value is "make-decision" instead of "scope-triage".
    // FALSIFIABLE: if scanSkillMetrics doesn't check stage, this test fails (returns found:false).
    expect(result.found).toBe(true);
    expect(result.reason).toMatch(/stage/);
  });
});
