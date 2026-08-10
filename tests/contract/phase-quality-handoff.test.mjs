import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("Phase quality and handoff contract", () => {
  it("keeps blueprint design in build-plan before stateless routing", () => {
    const deps = read("workflows/build-plan/skill-deps.yaml");
    const steps = JSON.parse(read("workflows/build-plan/steps.json"));
    const blueprint = deps.indexOf("testing-system-blueprint");
    const route = deps.indexOf("test-routing-advisor");
    expect(blueprint).toBeGreaterThanOrEqual(0);
    expect(route).toBeGreaterThan(blueprint);
    const slugs = steps.steps.map((step) => step.step_slug);
    expect(slugs.indexOf("testing-system-blueprint")).toBeGreaterThan(-1);
    expect(slugs.indexOf("test-routing-advisor")).toBeGreaterThan(slugs.indexOf("testing-system-blueprint"));
    expect(slugs).not.toContain("grill-with-docs");
    expect(read("workflows/build-plan/SKILL.md")).toMatch(/Do not run Talk, Clarify, or Grill/);
    expect(read("workflows/build-plan/SKILL.md")).toMatch(/Do not implement code or execute RED\/GREEN/);
  });

  it("keeps blueprint advisory and concrete testing single-choice in build-code", () => {
    const blueprint = read("skills/testing-system-blueprint/SKILL.md");
    const buildCode = read("workflows/build-code/SKILL.md");
    expect(blueprint).toMatch(/build-plan/);
    expect(blueprint).toMatch(/不.*gate|不是测试通过门/);
    expect(blueprint).toMatch(/不.*ledger|不.*receipt/);
    expect(buildCode).toMatch(/Use exactly one applicable concrete testing skill directly/);
    expect(buildCode).toMatch(/once for every behavior Phase/);
    expect(read("workflows/build-code/skill-deps.yaml")).toMatch(/every_behavior_phase_actual_scope/);
    expect(buildCode).toMatch(/backend-testing.*frontend-testing.*fullstack-slice-testing/s);
    expect(buildCode).toMatch(/A current Phase review is required as a recorded quality fact/);
    expect(buildCode).toMatch(/not a progression gate/);
  });

  it("preserves the four-material and task-card boundary", () => {
    const tasks = read("skills/spec-tasks/SKILL.md");
    const template = read("skills/spec-tasks/templates/tasks-template.md");
    expect(tasks).toMatch(/only these fields/);
    expect(tasks).toMatch(/Do not add workflow summaries,[\s\S]*second\s+completion ledger/);
    expect(template).toMatch(/paired_task/);
    expect(template).toMatch(/gate_cmd/);
    expect(template).toMatch(/oracle/);
  });
});
