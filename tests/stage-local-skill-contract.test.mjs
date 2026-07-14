import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const root = join(import.meta.dirname, "..");
const readStage = (name) => readFileSync(join(root, "workflows", name, "SKILL.md"), "utf8");
const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];

describe("stage-local skill invocation contract", () => {
  for (const stage of stages) {
    test(`${stage} resolves repository-local skills with a complete payload`, () => {
      const skill = readStage(stage);
      expect(skill).toContain("workflowhub_package_root");
      expect(skill).toContain("skill-deps.yaml");
      expect(skill).toContain("resolved_skill_path");
      expect(skill).toContain("resolved_bundle_paths");
      expect(skill).toContain("bundle_hash");
      expect(skill).toContain("source_manifest");
      expect(skill).toContain("package_root");
      expect(skill).toContain("[FRICTION]");
      expect(skill).toContain("friction_ref");
    });
  }

  test("make-decision uses local optional debate and the current review path", () => {
    const skill = readStage("make-decision");
    expect(skill).toContain("skills/debate/SKILL.md");
    expect(skill).toContain("debate_execution_failed");
    expect(skill).toContain("只有用户明确选择跳过 grill 才能继续");
    expect(skill).not.toContain("MAKE_DECISION_DEBATE_PATH");
    expect(skill).not.toContain("intake-review-orchestrator");
  });

  test("build-code uses local routing, debugging, and review response skills", () => {
    const skill = readStage("build-code");
    expect(skill).toContain("skills/test-routing-advisor/SKILL.md");
    expect(skill).toContain("skills/diagnosing-bugs/SKILL.md");
    expect(skill).toContain("skills/review-response/SKILL.md");
    expect(skill).not.toMatch(/AgentHub|Worker-Mode|issue-tracker/);
  });

  test("verify-code invokes the local browser QA skill", () => {
    const skill = readStage("verify-code");
    expect(skill).toContain("skills/isolated-browser-qa/SKILL.md");
    expect(skill).not.toContain("workflows/verify-code/isolated-browser-qa.md");
  });
});
