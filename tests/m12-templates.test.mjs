// TDD Phase 1+2: m12 template files existence and structure.
// Mirrors the assertion style of tests/five-skills-present.test.mjs.
import { test, describe } from "vitest";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

// --- Existence: both template files must exist ---

describe("m12 template files exist", () => {
  test("skills/spec-plan/templates/plan-template.md exists", () => {
    const p = join(REPO_ROOT, "skills", "spec-plan", "templates", "plan-template.md");
    assert.ok(existsSync(p), `Missing: ${p}`);
  });

  test("skills/spec-tasks/templates/tasks-template.md exists", () => {
    const p = join(REPO_ROOT, "skills", "spec-tasks", "templates", "tasks-template.md");
    assert.ok(existsSync(p), `Missing: ${p}`);
  });
});

// --- plan-template.md: all 7 required section headings (spec §6 + plan.md) ---

describe("plan-template.md contains all required sections", () => {
  const planPath = join(REPO_ROOT, "skills", "spec-plan", "templates", "plan-template.md");

  test("plan-template.md contains ## Summary heading", () => {
    const content = readFileSync(planPath, "utf8");
    assert.ok(content.includes("## Summary"), "plan-template.md must contain '## Summary' heading");
  });

  test("plan-template.md contains ## Technical Context heading", () => {
    const content = readFileSync(planPath, "utf8");
    assert.ok(content.includes("## Technical Context"), "plan-template.md must contain '## Technical Context' heading");
  });

  test("plan-template.md contains ## Constitution Check heading", () => {
    const content = readFileSync(planPath, "utf8");
    assert.ok(content.includes("## Constitution Check"), "plan-template.md must contain '## Constitution Check' heading");
  });

  test("plan-template.md contains F, Q, S clause groups for 21-clause coverage", () => {
    const content = readFileSync(planPath, "utf8");
    const hasF = content.includes("Framework Principles") || content.includes("框架原则");
    const hasQ = content.includes("Quality Principles") || content.includes("质量原则");
    const hasS = content.includes("Skill Principles") || content.includes("技能原则");
    assert.ok(hasF && hasQ && hasS,
      "plan-template.md must define F (Framework), Q (Quality), S (Skill) clause groups for 21-clause coverage");
  });

  test("plan-template.md contains ## Project Structure heading", () => {
    const content = readFileSync(planPath, "utf8");
    assert.ok(content.includes("## Project Structure"), "plan-template.md must contain '## Project Structure' heading");
  });

  test("plan-template.md contains ## Implementation Steps heading", () => {
    const content = readFileSync(planPath, "utf8");
    assert.ok(content.includes("## Implementation Steps"), "plan-template.md must contain '## Implementation Steps' heading");
  });

  test("plan-template.md contains ## F10 Anti-Over-Engineering Gate heading", () => {
    const content = readFileSync(planPath, "utf8");
    assert.ok(
      content.includes("## F10 Anti-Over-Engineering Gate") || content.includes("## F10"),
      "plan-template.md must contain F10 gate heading");
  });

  test("plan-template.md contains ## Verification Mapping heading", () => {
    const content = readFileSync(planPath, "utf8");
    assert.ok(content.includes("## Verification Mapping"), "plan-template.md must contain '## Verification Mapping' heading");
  });

  test("plan-template.md contains F10 4-question gate table columns", () => {
    const content = readFileSync(planPath, "utf8");
    const hasThreat = content.includes("real threat") || content.includes("真实威胁") || content.includes("Real threat");
    const hasCover = content.includes("Existing cover") || content.includes("已有覆盖") || content.includes("existing");
    const hasBypass = content.includes("Bypassable") || content.includes("可绕过") || content.includes("bypass");
    const hasMaint = content.includes("Maintenance cost") || content.includes("长期维护") || content.includes("维护成本") || content.includes("maintenance");
    assert.ok(hasThreat && hasCover && hasBypass && hasMaint,
      "plan-template.md must list all 4 F10 gate questions: real threat, existing cover, bypassable, maintenance cost");
  });
});

// --- tasks-template.md: phases, [P] marker, FR mapping, stage-block syntax ---

describe("tasks-template.md contains all required elements", () => {
  const tasksPath = join(REPO_ROOT, "skills", "spec-tasks", "templates", "tasks-template.md");

  test("tasks-template.md contains Setup phase heading", () => {
    const content = readFileSync(tasksPath, "utf8");
    assert.ok(
      content.includes("Phase 1: Setup") || content.includes("## Phase 1"),
      "tasks-template.md must contain Setup phase (Phase 1)");
  });

  test("tasks-template.md contains Foundational phase heading", () => {
    const content = readFileSync(tasksPath, "utf8");
    assert.ok(
      content.includes("Phase 2: Foundational") || content.includes("## Phase 2"),
      "tasks-template.md must contain Foundational phase (Phase 2)");
  });

  test("tasks-template.md contains User Story phase pattern", () => {
    const content = readFileSync(tasksPath, "utf8");
    assert.ok(
      content.includes("User Story") || content.includes("US"),
      "tasks-template.md must contain User Story phase pattern");
  });

  test("tasks-template.md contains Polish phase heading", () => {
    const content = readFileSync(tasksPath, "utf8");
    assert.ok(
      content.includes("Polish") || content.includes("Cross-Cutting"),
      "tasks-template.md must contain Polish phase");
  });

  test('tasks-template.md documents [P] parallel marker convention', () => {
    const content = readFileSync(tasksPath, "utf8");
    assert.ok(content.includes("[P]"), "tasks-template.md must document [P] parallel marker convention");
  });

  test("tasks-template.md documents FR mapping per task convention", () => {
    const content = readFileSync(tasksPath, "utf8");
    assert.ok(
      content.includes("FR:") || content.includes("FR mapping") || content.includes("FR-MIG"),
      "tasks-template.md must document FR mapping per task");
  });

  test("tasks-template.md documents ## Stage N block syntax", () => {
    const content = readFileSync(tasksPath, "utf8");
    assert.ok(
      content.includes("## Stage") || content.includes("Stage N") || content.includes("stage block"),
      "tasks-template.md must document ## Stage N block syntax");
  });

  test("tasks-template.md documents (stage:N, depends:...) annotation format", () => {
    const content = readFileSync(tasksPath, "utf8");
    assert.ok(
      content.includes("stage:") && content.includes("depends:"),
      "tasks-template.md must document stage annotation with (stage:N, depends:...) format");
  });
});
