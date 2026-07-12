import { linkSync, mkdtempSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { STAGE_CONTRACT_MAP } from "../lib/safe-id.mjs";
import { resolveRequiredSkills, validateReviewBundle } from "../required-skill-resolver.mjs";
import { validateReviewerOutput } from "../reviewer-output-validator.mjs";

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
    const manifest = JSON.parse(readFileSync(new URL("../../manifest.json", import.meta.url), "utf8"));
    expect(manifest.contracts["build-spec"].optional_skills).toEqual([{ name: "plan-design-review", when: "ui" }]);
    expect(plan.stages["build-plan"].required_skills).toContain("spec-analyze");
    expect(plan.stages["verify-code"].required_skills).toContain("verify-change");
  });

  it("keeps every bundled review skill self-contained and report-only", () => {
    for (const name of ["plan-ceo-review", "review", "plan-design-review", "plan-eng-review", "qa-only", "spec-analyze", "verify-change"]) {
      const body = readFileSync(new URL(`../../../${name}/SKILL.md`, import.meta.url), "utf8");
      const bundle = JSON.parse(readFileSync(new URL(`../../../${name}/review-bundle.json`, import.meta.url), "utf8"));
      expect(bundle).toMatchObject({ version: 1 });
      expect(bundle.files).toContain(name === "spec-analyze" ? "packet-lens.md" : "SKILL.md");
      if (name === "spec-analyze" || name === "verify-change") {
        expect(bundle).toMatchObject({ mode: "lens-only", delivery_mode: "file_only" });
      }
      expect(body).toMatch(/report-only/i);
      expect(body).not.toMatch(/gstack|telemetry|spawn\(|child_process|curl\s|fetch\(|git\s+(diff|status|log)|task worktree|task_tracking_root|absolute path|落盘/i);
    }
  });

  it("limits every stage contract to packet fields and artifact anchors", () => {
    const requiredFields = {
      "make-decision": ["raw_requirement", "decision_log_excerpt", "host_verified_facts"],
      "build-spec": ["raw_requirement", "acceptance_design_excerpt", "planning_artifacts"],
      "build-plan": ["planning_artifacts", "acceptance_design_excerpt", "changed_files"],
      "build-code": ["unified_diff", "changed_files", "test_evidence"],
      "verify-code": ["acceptance_design_excerpt", "test_evidence", "verification_closure"],
    };
    for (const [stage, fields] of Object.entries(requiredFields)) {
      const contract = readFileSync(new URL(`../../contracts/${stage}.md`, import.meta.url), "utf8");
      expect(contract).toContain("review-packet.v1");
      for (const field of fields) expect(contract).toContain(`\`${field}\``);
      expect(contract).not.toMatch(/git\s+(diff|status|log)|\bgrep\b|\bls\b|执行命令|完整\s*Read|tasks\/|task[-_]id|task_tracking|WORKFLOWHUB/i);
    }
  });

  it("makes packet fields conditional for make-decision tracks", () => {
    const schema = JSON.parse(readFileSync(new URL("../../schemas/review-packet.schema.json", import.meta.url), "utf8"));
    expect(schema.required).not.toContain("decision_log_excerpt");
    expect(JSON.stringify(schema.allOf)).toContain("direction");
    expect(JSON.stringify(schema.allOf)).toContain("detail");
    expect(schema.required).not.toEqual(expect.arrayContaining(["planning_artifacts", "verification_closure", "test_evidence"]));
    const directionRule = schema.allOf.find((rule) => rule.if?.properties?.review_track?.const === "direction");
    expect(JSON.stringify(directionRule.then)).toContain("planning_artifacts");
    expect(JSON.stringify(directionRule.then)).toContain("verification_closure");
    expect(JSON.stringify(directionRule.then)).toContain("test_evidence");
    const contract = readFileSync(new URL("../../contracts/make-decision.md", import.meta.url), "utf8");
    const direction = contract.slice(contract.indexOf("review_track: direction"), contract.indexOf("review_track: detail"));
    expect(direction).not.toContain("acceptance_design_excerpt");
  });

  it("rejects empty skill results for stages with required packet lenses", () => {
    const outcome = validateReviewerOutput({
      stage: "build-plan",
      output: { findings: [], checklist: [], skillResults: [] },
    });
    expect(outcome.valid).toBe(false);
    expect(outcome.errors).toContain("missing required skill result: spec-analyze");
  });

  it("forbids dot-dot in review intent identifiers", () => {
    const schema = JSON.parse(readFileSync(new URL("../../schemas/review-intent.schema.json", import.meta.url), "utf8"));
    expect(schema.properties.task_id.pattern).toContain("(?!.*\\.\\.)");
    expect(schema.properties.review_flow_id.pattern).toContain("(?!.*\\.\\.)");
  });

  it("rejects traversal, symlink, hardlink, and directory bundle entries", () => {
    const root = mkdtempSync(join(tmpdir(), "bundle-attack-"));
    const skill = join(root, "review");
    mkdirSync(skill);
    writeFileSync(join(skill, "SKILL.md"), "skill");
    writeFileSync(join(skill, "outside.md"), "outside");
    const linked = join(skill, "linked.md");
    const hardlinked = join(skill, "hardlinked.md");
    symlinkSync(join(skill, "outside.md"), linked);
    linkSync(join(skill, "outside.md"), hardlinked);
    for (const files of [["../outside.md"], ["SKILL.md", "dir"], ["SKILL.md", "linked.md"], ["SKILL.md", "hardlinked.md"]]) {
      if (files.includes("dir")) mkdirSync(join(skill, "dir"), { recursive: true });
      writeFileSync(join(skill, "review-bundle.json"), JSON.stringify({ version: 1, files }));
      expect(() => validateReviewBundle({ skillDir: skill, name: "review" })).toThrow(/bundle/i);
    }
  });
});
