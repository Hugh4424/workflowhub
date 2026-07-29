// TDD Phase 1+2: m12 template files existence and structure.
// Mirrors the assertion style of tests/five-skills-present.test.mjs.
import { test, describe } from "vitest";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

function inlineJson(content, label) {
  const match = content.match(new RegExp(`^\\s*-\\s+\\*\\*${label}\\*\\*\\s*[:：]\\s*` + "`(\\{.*\\}|\\[.*\\])`\\s*$", "mi"));
  assert.ok(match, `${label} must be one inline JSON value`);
  let value;
  assert.doesNotThrow(() => { value = JSON.parse(match[1]); }, `${label} must parse as JSON`);
  return value;
}

function templateVersion(content) {
  return content.match(/^\s*(?:-\s+)?\*\*Template version\*\*\s*[:：]\s*`?([^`\s]+)`?\s*$/mi)?.[1] ?? null;
}

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
    assert.ok(content.includes("## 9. File Boundary"));
    assert.ok(content.includes("Phase.Files"));
  });

  test("plan-template.md keeps a bound constitution appendix", () => {
    const content = readFileSync(planPath, "utf8");
    assert.ok(content.includes("## 3. Constitution Check"));
    const binding = inlineJson(content, "Constitution binding");
    for (const field of ["artifact_kind", "ref", "hash", "id", "version", "clause_count"]) {
      assert.ok(Object.hasOwn(binding, field), `missing Constitution binding.${field}`);
    }
    assert.equal(binding.artifact_kind, "constitution");
    assert.match(binding.ref, /\S/);
    assert.equal(binding.hash, "[填写：真实 SHA-256]");
    assert.match(binding.id, /\S/);
    assert.match(binding.version, /\S/);
    assert.ok(Number.isInteger(binding.clause_count));
    assert.equal(binding.clause_count, 21);
  });

  test("plan-template.md uses the runtime-recognized v3 template version", () => {
    const content = readFileSync(planPath, "utf8");
    assert.equal(templateVersion(content), "plan-task.v3");
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
      "## 6. Solution Design",
      "## 5. Technical Decisions",
      "## 13. Test Strategy",
      "## 12. Rollback and Recovery",
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
    assert.ok(content.includes("## 16. Requirement and Verification Traceability"));
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

  test("tasks-template.md contains one flat authoritative card", () => {
    const content = readFileSync(tasksPath, "utf8");
    for (const field of [
      "ID", "Phase", "goal", "design_state", "versioned_refs", "输入", "依赖",
      "并行", "FR", "AC", "动作", "精确文件", "boundary", "输出", "Knowledge",
      "verification_role", "paired_task", "gate_cmd", "expected_exit", "oracle",
      "evidence_path", "STOP", "recovery", "task risk",
    ]) {
      assert.ok(content.includes(`**${field}**`), `missing ${field}`);
    }
    assert.equal((content.match(/^#### T001 /gm) ?? []).length, 1);
    assert.ok(!content.includes("##### T001"), "task card must stay flat and scannable");
    assert.ok(!content.includes("For the v2 contract, add"));
  });

  test("tasks-template.md demonstrates a reciprocal RED/GREEN pair", () => {
    const content = readFileSync(tasksPath, "utf8");
    assert.match(content, /^#### T001 — RED：/m);
    assert.match(content, /^#### T002 — GREEN：/m);
    assert.ok(content.includes("- **paired_task**：T002"));
    assert.ok(content.includes("- **paired_task**：T001"));
    assert.ok(content.includes("- **依赖**：T001"));
  });

  test("tasks-template.md documents reasoned non-behavior N/A without weakening RED/GREEN", () => {
    const content = readFileSync(tasksPath, "utf8");
    assert.ok(content.includes("N/A — non-behavior change"));
    assert.ok(content.includes("非行为任务仍须真实 gate"));
  });

  test('tasks-template.md documents [P] parallel marker convention', () => {
    const content = readFileSync(tasksPath, "utf8");
    assert.ok(content.includes("可并行"), "tasks-template.md must document parallel ownership");
  });

  test("tasks-template.md preserves FR/AC and versioned references", () => {
    const content = readFileSync(tasksPath, "utf8");
    for (const field of ["**versioned_refs**", "**FR**", "**AC**"]) assert.ok(content.includes(field));
    const refs = inlineJson(content, "versioned_refs");
    assert.ok(Array.isArray(refs) && refs.length > 0, "versioned_refs must be a non-empty array");
    for (const field of ["artifact_kind", "ref", "hash", "id"]) {
      assert.ok(Object.hasOwn(refs[0], field), `missing versioned_refs[0].${field}`);
    }
    assert.equal(refs[0].hash, "[填写：真实 SHA-256]");
  });

  test("tasks-template.md uses the runtime-recognized v3 template version", () => {
    const content = readFileSync(tasksPath, "utf8");
    assert.equal(templateVersion(content), "plan-task.v3");
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
    assert.ok(content.includes("只读导入"));
  });
});
