import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { STAGE_CONTRACT_MAP } from "../lib/safe-id.mjs";
import { resolveRequiredSkills } from "../required-skill-resolver.mjs";

describe("wh-review v4 Phase 1 contract foundation", () => {
  it("uses the workflow stage names as the only contract names", () => {
    expect(STAGE_CONTRACT_MAP).toEqual({
      "make-decision": "make-decision.md",
      "build-spec": "build-spec.md",
      "build-plan": "build-plan.md",
      "build-code": "build-code.md",
      "verify-code": "verify-code.md",
    });
  });

  it("rejects an external skill root instead of resolving host or gstack skills", () => {
    const outside = mkdtempSync(join(tmpdir(), "external-skills-"));
    mkdirSync(join(outside, "review"));
    writeFileSync(join(outside, "review", "SKILL.md"), "external review");

    expect(() => resolveRequiredSkills({ stage: "build-plan", roots: [outside] })).toThrow(/repository skills root/i);
  });

  it("maps make-decision tracks and keeps UI review optional", () => {
    const plan = JSON.parse(readFileSync(new URL("../../stage-skill-plan.json", import.meta.url), "utf8"));
    expect(Object.keys(plan.stages["make-decision"].tracks).sort()).toEqual(["detail", "direction"]);
    expect(plan.stages["build-spec"].optional_skills).toEqual([{ name: "plan-design-review", when: "ui" }]);
    expect(plan.stages["build-plan"].required_skills).toContain("spec-analyze");
    expect(plan.stages["verify-code"].required_skills).toContain("verify-change");
  });

  it("keeps every bundled review skill self-contained and report-only", () => {
    for (const name of ["plan-ceo-review", "review", "plan-design-review", "plan-eng-review", "qa-only", "spec-analyze", "verify-change"]) {
      const body = readFileSync(new URL(`../../../${name}/SKILL.md`, import.meta.url), "utf8");
      const bundle = JSON.parse(readFileSync(new URL(`../../../${name}/review-bundle.json`, import.meta.url), "utf8"));
      expect(bundle).toMatchObject({ version: 1, files: ["SKILL.md"] });
      if (name === "spec-analyze" || name === "verify-change") {
        expect(bundle).toMatchObject({ mode: "lens-only", delivery_mode: "file_only" });
      }
      expect(body).toMatch(/report-only/i);
      expect(body).not.toMatch(/gstack|telemetry|spawn\(|child_process|curl\s|fetch\(|git\s+(diff|status|log)|task worktree|task_tracking_root|absolute path|落盘/i);
    }
  });
});
