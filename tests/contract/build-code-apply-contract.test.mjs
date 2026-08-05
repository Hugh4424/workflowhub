import { readFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), "utf8");

describe("build-code apply quality contract", () => {
  it("consumes the task strategy instead of designing tests during execution", () => {
    const skill = read("workflows/build-code/SKILL.md");
    const manifest = read("workflows/build-code/skill-deps.yaml");
    for (const name of ["test-routing-advisor", "testing-system-blueprint", "backend-testing", "frontend-testing", "fullstack-slice-testing"]) {
      expect(manifest).not.toContain(name);
    }
    expect(manifest).toContain("wh-review");
    expect(skill).toMatch(/tasks\.md/);
    expect(skill).toMatch(/predesigned[\s\S]*test_strategy/);
    expect(skill).toMatch(/must not re-route or[\s\S]*redesign/i);
    expect(skill).toMatch(/Phase Card/);
    expect(skill).toMatch(/RED/);
    expect(skill).toMatch(/GREEN/);
    expect(skill).toMatch(/exact allowed files/);
    expect(skill).toMatch(/plain-language handoff/);
  });

  it("requires per-phase execution facts and a final task strategy summary", () => {
    const skill = read("workflows/build-code/SKILL.md");
    expect(skill).toMatch(/Every completed Phase executes/);
    expect(skill).toMatch(/final aggregate strategy/);
    expect(skill).toMatch(/dedicated final Task\/Phase card/);
    expect(skill).toMatch(/does not run a second route\/blueprint\/executor design\s+loop/);
    expect(skill).toMatch(/Full regression belongs to\s+verify-code/);
    expect(skill).toMatch(/not a build-code progression gate/);
  });

  it("does not reintroduce AgentHub pass, commit, or full-suite gates", () => {
    const skill = read("workflows/build-code/SKILL.md");
    expect(skill).not.toMatch(/must be pass to (?:enter|advance|continue)/i);
    expect(skill).not.toMatch(/clean worktree.*required.*progress/i);
    expect(skill).not.toMatch(/commit.*required.*progress/i);
    expect(skill).not.toMatch(/full[- ]suite.*every (?:phase|task)/i);
  });

  it("records task strategy and execution facts in the canonical step manifest", () => {
    const buildPlan = yaml.load(read("workflows/build-plan/skill-deps.yaml"));
    const steps = JSON.parse(read("workflows/build-code/steps.json"));
    const runTests = steps.steps.find((step) => step.step_slug === "run-tests");
    expect(runTests.completion_evidence.map((item) => item.kind)).toEqual(expect.arrayContaining(["test_strategy", "test"]));
    expect(runTests.observable_result).toMatch(/predesigned test strategy from tasks\.md/);
    expect(runTests.observable_result).toMatch(/scenario/);
    const publish = steps.steps.find((step) => step.step_slug === "publish-code-result");
    expect(publish.completion_evidence.map((item) => item.kind)).toContain("final_test_summary");
    expect(publish.completion_evidence.map((item) => item.kind)).toEqual(expect.arrayContaining(["final_test_strategy", "final_test_result"]));
    expect(publish.observable_result).toMatch(/final strategy card authored in tasks\.md/i);
    expect(publish.observable_result).not.toMatch(/freshly routed/i);
  });
});
