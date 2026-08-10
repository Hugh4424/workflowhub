import { readFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), "utf8");

describe("build-code apply quality contract", () => {
  it("uses the plan route as a baseline and reroutes concrete testing against real scope", () => {
    const skill = read("workflows/build-code/SKILL.md");
    const manifest = read("workflows/build-code/skill-deps.yaml");
    for (const name of ["test-routing-advisor", "backend-testing", "frontend-testing", "fullstack-slice-testing"]) expect(manifest).toContain(name);
    expect(manifest).not.toContain("testing-system-blueprint");
    expect(manifest).toContain("wh-review");
    expect(skill).toMatch(/tasks\.md/);
    expect(skill).toMatch(/predesigned[\s\S]*route/i);
    expect(skill).toMatch(/actual[\s\S]{0,80}changed files[\s\S]{0,300}(?:reroute|route)/i);
    expect(skill).toMatch(/concrete testing skill/i);
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
    expect(skill).toMatch(/test-routing-advisor/);
    expect(skill).toMatch(/final full test is a build-code handoff fact/);
    expect(skill).toMatch(/current Phase review is required as a recorded quality\s+fact/i);
    expect(skill).toMatch(/final aggregate strategy/);
    expect(skill).toContain("publish no completion");
    expect(skill).toContain("`revise_required`");
    expect(skill).toContain("`unavailable`");
  });

  it("does not reintroduce AgentHub pass, commit, or full-suite gates", () => {
    const skill = read("workflows/build-code/SKILL.md");
    expect(skill).toMatch(/verdict is not a progression gate/i);
    expect(skill).not.toMatch(/cannot hand off until the current[\s\S]{0,80}review result is `pass`/i);
    expect(skill).not.toMatch(/clean worktree.*required.*progress/i);
    expect(skill).not.toMatch(/commit.*required.*progress/i);
    expect(skill).not.toMatch(/full[- ]suite.*every (?:phase|task)/i);
  });

  it("records task strategy and execution facts in the canonical step manifest", () => {
    const steps = JSON.parse(read("workflows/build-code/steps.json"));
    const route = steps.steps.find((step) => step.step_slug === "inspect-and-route-actual-tests");
    expect(route.completion_evidence.map((item) => item.kind)).toEqual(expect.arrayContaining(["changed_files", "test_routing"]));
    expect(route.completion_evidence.map((item) => item.kind)).not.toContain("skill_invocation");
    expect(route.observable_result).toMatch(/actual changed files/i);
    const concrete = steps.steps.find((step) => step.step_slug === "invoke-concrete-testing-skill");
    expect(concrete.completion_evidence.map((item) => item.kind)).toEqual(["test_strategy"]);
    expect(concrete.observable_result).toMatch(/backend\/frontend\/fullstack/);
    const runTests = steps.steps.find((step) => step.step_slug === "run-tests");
    expect(runTests.entry_conditions.map((item) => item.kind)).toEqual(["test_strategy"]);
    expect(runTests.completion_evidence.map((item) => item.kind)).toContain("test");
    expect(runTests.observable_result).toMatch(/concrete testing strategy/);
    const publish = steps.steps.find((step) => step.step_slug === "publish-code-result");
    expect(publish.completion_evidence.map((item) => item.kind)).toEqual(["tasks", "test", "review"]);
    expect(publish.completion_evidence.map((item) => item.uri_or_path)).toEqual([
      "tasks.md", "quality/tests/", "quality/reviews/",
    ]);
    expect(publish.observable_result).toMatch(/plain-language handoff/);
  });

  it("keeps testing skills in build-plan design only, not build-code execution metadata", () => {
    const registry = read("skills/reuse-registry.md");
    expect(registry).toMatch(/`test-routing-advisor`.*build-plan.*build-code.*changed files/s);
    expect(registry).toMatch(/`testing-system-blueprint`.*build-plan.*advisory/s);
    expect(registry).toMatch(/`backend-testing`.*build-code/s);
    expect(registry).toMatch(/`frontend-testing`.*build-code/s);
    expect(registry).toMatch(/`fullstack-slice-testing`.*build-code/s);
  });
});
