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

// --- plan-template.md: readable v3 structure without contract loss ---

describe("plan-template.md contains all required sections", () => {
  const planPath = join(REPO_ROOT, "skills", "spec-plan", "templates", "plan-template.md");

  test("plan-template.md starts with a quick-read section", () => {
    const content = readFileSync(planPath, "utf8");
    assert.ok(content.includes("## 1. 速读卡"));
    assert.ok(content.includes("- **Non-goals**"));
    assert.ok(content.includes("- **Before**"));
    assert.ok(content.includes("- **After**"));
  });

  test("plan-template.md keeps technical context and exact file authority", () => {
    const content = readFileSync(planPath, "utf8");
    assert.ok(content.includes("## 2. Technical Context and Constraints"));
    assert.ok(content.includes("## 5. File Boundary"));
    assert.ok(content.includes("Phase.Files"));
  });

  test("plan-template.md keeps a bound constitution appendix", () => {
    const content = readFileSync(planPath, "utf8");
    assert.ok(content.includes("## Appendix A. Constitution Check"));
    for (const field of ["ref", "hash", "version", "clause_count"]) assert.ok(content.includes(`\"${field}\"`));
  });

  test("plan-template.md contains F, Q, S clause groups for 21-clause coverage", () => {
    const content = readFileSync(planPath, "utf8");
    const hasF = content.includes("Framework Principles") || content.includes("框架原则");
    const hasQ = content.includes("Quality Principles") || content.includes("质量原则");
    const hasS = content.includes("Skill Principles") || content.includes("技能原则");
    assert.ok(hasF && hasQ && hasS,
      "plan-template.md must define F (Framework), Q (Quality), S (Skill) clause groups for 21-clause coverage");
  });

  test("plan-template.md keeps solution, decisions, tests, and recovery", () => {
    const content = readFileSync(planPath, "utf8");
    for (const heading of [
      "## 4. Solution Design",
      "## 6. Technical Decisions",
      "## 7. Test Strategy",
      "## 8. Rollback and Recovery",
      "## Phase 1",
    ]) assert.ok(content.includes(heading), `missing ${heading}`);
  });

  test("plan-template.md keeps the complete engineering risk handoff", () => {
    const content = readFileSync(planPath, "utf8");
    for (const field of [
      "Affected IDs", "Trigger", "Consequence", "Mitigation or STOP",
      "Handling Stage", "Verification",
    ]) assert.ok(content.includes(`**${field}**`), `missing ${field}`);
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

  test("plan-template.md uses one traceability authority", () => {
    const content = readFileSync(planPath, "utf8");
    assert.ok(content.includes("## 11. Requirement and Verification Traceability"));
    assert.ok(!content.includes("## Verification Mapping"));
  });

  test("plan-template.md keeps all eight Phase sections", () => {
    const content = readFileSync(planPath, "utf8");
    for (const heading of [
      "### Goal", "### Files", "### Tasks", "### Verify", "### Knowledge",
      "### STOP", "### Done", "### Risks and rollback",
    ]) assert.ok(content.includes(heading), `missing ${heading}`);
  });
});

// --- tasks-template.md: one v3 card, eight-section phases, read-only legacy ---

describe("tasks-template.md contains all required elements", () => {
  const tasksPath = join(REPO_ROOT, "skills", "spec-tasks", "templates", "tasks-template.md");

  test("tasks-template.md contains a plan-derived Phase", () => {
    const content = readFileSync(tasksPath, "utf8");
    assert.ok(content.includes("## Phase 1"));
    assert.ok(content.includes("逐字一致"));
  });

  test("tasks-template.md contains one four-group authoritative card", () => {
    const content = readFileSync(tasksPath, "utf8");
    for (const group of ["身份", "追溯", "执行", "验证与失败"]) {
      assert.ok(content.includes(`##### T001 ${group}`), `missing ${group}`);
    }
    assert.ok(!content.includes("For the v2 contract, add"));
  });

  test("tasks-template.md documents reasoned non-behavior N/A without weakening RED/GREEN", () => {
    const content = readFileSync(tasksPath, "utf8");
    assert.ok(content.includes("N/A — non-behavior change"));
    assert.ok(content.includes("仍须提供真实 gate_cmd"));
  });

  test('tasks-template.md documents [P] parallel marker convention', () => {
    const content = readFileSync(tasksPath, "utf8");
    assert.ok(content.includes("[P]"), "tasks-template.md must document [P] parallel marker convention");
  });

  test("tasks-template.md preserves FR/AC and versioned references", () => {
    const content = readFileSync(tasksPath, "utf8");
    for (const field of ["**versioned_refs**", "**FR**", "**AC**"]) assert.ok(content.includes(field));
  });

  test("tasks-template.md keeps all eight Phase sections", () => {
    const content = readFileSync(tasksPath, "utf8");
    for (const heading of [
      "### Goal", "### Files", "### Tasks", "### Verify", "### Knowledge",
      "### STOP", "### Done", "### Risks and rollback",
    ]) assert.ok(content.includes(heading), `missing ${heading}`);
  });

  test("tasks-template.md marks Stage syntax read-only", () => {
    const content = readFileSync(tasksPath, "utf8");
    assert.ok(content.includes("## Stage N"));
    assert.ok(content.includes("stage:N") && content.includes("depends:"));
    assert.ok(content.includes("只读导入"));
  });
});
