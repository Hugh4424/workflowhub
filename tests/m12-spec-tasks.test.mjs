// TDD Phase 4: spec-tasks SKILL.md — structural contract verification.
// Uses vitest + node:assert (compatible with vitest).
import { test, describe } from "vitest";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// Minimal YAML frontmatter field extractor — handles simple key: value lines.
function extractFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const block = match[1];
  const result = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^(\w[\w-]*):\s*(.*?)\s*$/);
    if (m) result[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return result;
}

const REPO_ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const SKILL_PATH = join(REPO_ROOT, "skills", "spec-tasks", "SKILL.md");

// Helper — reads SKILL.md body (content after YAML frontmatter)
function readSkillBody() {
  const raw = readFileSync(SKILL_PATH, "utf8");
  // Strip YAML frontmatter (first --- block)
  const bodyMatch = raw.replace(/^---[\s\S]*?---\r?\n/, "");
  return bodyMatch;
}

// --- (a) SKILL.md exists ---
describe("spec-tasks SKILL.md existence and frontmatter", () => {
  test("skills/spec-tasks/SKILL.md exists", () => {
    assert.ok(existsSync(SKILL_PATH), `Missing: ${SKILL_PATH}`);
  });

  test("frontmatter name is spec-tasks", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    const fm = extractFrontmatter(content);
    assert.ok(fm, "No valid YAML frontmatter in skills/spec-tasks/SKILL.md");
    assert.equal(fm.name, "spec-tasks", `frontmatter.name should be "spec-tasks", got "${fm.name}"`);
  });

  test("frontmatter description is non-empty string", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    const fm = extractFrontmatter(content);
    assert.ok(fm, "No valid YAML frontmatter");
    assert.ok(
      typeof fm.description === "string" && fm.description.trim().length > 0,
      `frontmatter.description must be a non-empty string, got "${fm.description}"`
    );
  });
});

// --- (b) fail-loud for missing task-id ---
describe("spec-tasks SKILL.md fail-loud for missing task-id", () => {
  test("missing task-id triggers fail-loud error message", () => {
    const body = readSkillBody();
    const hasFailLoud =
      body.includes("task-id required") ||
      body.includes("task-id缺失") ||
      body.includes("task-id 缺失") ||
      body.includes("缺少 task-id");
    assert.ok(
      hasFailLoud,
      "spec-tasks/SKILL.md must fail-loud on missing task-id: 'task-id required' or Chinese equivalent"
    );
  });

  test("missing task-id specifies non-zero exit", () => {
    const body = readSkillBody();
    const hasNonZeroExit =
      body.includes("非 0") ||
      body.includes("非零") ||
      body.includes("exit 非 0") ||
      body.includes("exit code 为非 0") ||
      body.includes("停止执行") ||
      body.includes("fail") ||
      body.includes("报错");
    assert.ok(
      hasNonZeroExit,
      "spec-tasks/SKILL.md must specify non-zero exit for missing task-id"
    );
  });
});

// --- (c) fail-loud for missing spec.md / plan.md ---
describe("spec-tasks SKILL.md fail-loud for missing spec.md/plan.md", () => {
  test("body mentions missing spec.md as failure condition", () => {
    const body = readSkillBody();
    const hasMissingSpec =
      body.includes("spec.md") &&
      (body.includes("不存在") ||
       body.includes("missing") ||
       body.includes("缺失") ||
       body.includes("not found"));
    assert.ok(
      hasMissingSpec,
      "spec-tasks/SKILL.md must mention missing spec.md as a failure condition"
    );
  });

  test("body mentions missing plan.md as failure condition", () => {
    const body = readSkillBody();
    const hasMissingPlan =
      body.includes("plan.md") &&
      (body.includes("不存在") ||
       body.includes("missing") ||
       body.includes("缺失") ||
       body.includes("not found"));
    assert.ok(
      hasMissingPlan,
      "spec-tasks/SKILL.md must mention missing plan.md as a failure condition"
    );
  });
});

// --- (d) no git ops, no .specify/---
describe("spec-tasks SKILL.md no git / no .specify/ constraint", () => {
  test("template loaded from internal path, NOT .specify/templates/", () => {
    const body = readSkillBody();
    // Must reference internal template path
    assert.ok(
      body.includes("skills/spec-tasks/templates/tasks-template.md"),
      "spec-tasks/SKILL.md must load template from internal path skills/spec-tasks/templates/tasks-template.md"
    );
    // Must NOT use .specify/templates/ as the template source path
    assert.ok(
      !body.includes(".specify/templates/"),
      "spec-tasks/SKILL.md must NOT use .specify/templates/ as template source (FR-DECOUPLE-002)"
    );
  });

  test("body prohibits git operations as positive instructions", () => {
    const body = readSkillBody();
    // The skill should not give positive instructions to run git commands.
    // Prohibition notes (e.g. "不执行 git checkout") are fine and expected.
    // Check that there is no sentence like "Run git checkout" or "Execute create-new-feature.sh"
    // without a preceding negative marker in the same sentence.
    const positivePatterns = [
      /执行\s*git\s+branch/,
      /执行\s*git\s+checkout/,
      /执行\s*git\s+rev-parse/,
      /执行\s*create-new-feature/,
      /执行\s*check-prerequisites/,
      /运行\s*git\s+branch/,
      /运行\s*git\s+checkout/,
      /运行\s*create-new-feature/,
      /Run\s+git\s+branch/,
      /Run\s+git\s+checkout/,
      /Run\s+create-new-feature/,
    ];
    const hasPositiveGitOp = positivePatterns.some((p) => p.test(body));
    assert.ok(
      !hasPositiveGitOp,
      "spec-tasks/SKILL.md must NOT contain positive instructions to run git commands (FR-DECOUPLE-001)"
    );
  });
});

// --- (e) internal template path, no speckit-* naming ---
describe("spec-tasks SKILL.md internal template and naming", () => {
  test("template loaded from skills/spec-tasks/templates/tasks-template.md", () => {
    const body = readSkillBody();
    assert.ok(
      body.includes("skills/spec-tasks/templates/tasks-template.md"),
      "spec-tasks/SKILL.md must reference internal template path skills/spec-tasks/templates/tasks-template.md"
    );
  });

  test("skill name is NOT speckit-tasks in frontmatter", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    const fm = extractFrontmatter(content);
    assert.ok(fm, "No valid YAML frontmatter");
    assert.notEqual(
      fm.name,
      "speckit-tasks",
      "skill name must NOT be speckit-tasks — should be spec-tasks (FR-MIG-001)"
    );
  });

  test("body does NOT identify self as speckit-tasks in headings/role", () => {
    const body = readSkillBody();
    // The skill may mention speckit-tasks in provenance/migration notes (exempt per FR-MIG-001).
    // It must NOT present itself as speckit-tasks in headings (lines starting with #) or
    // self-referential role descriptions.
    const headingMatch = body.match(/^#\s+.*speckit-tasks/m);
    assert.ok(
      !headingMatch,
      "spec-tasks SKILL.md heading must NOT say speckit-tasks (FR-MIG-001)"
    );
    // Check the skill name in the callable/identity context — body should call itself spec-tasks
    assert.ok(
      body.includes("spec-tasks"),
      "spec-tasks SKILL.md body must self-identify as spec-tasks (FR-MIG-001)"
    );
  });
});

// --- (f) --stage N contract coverage ---
describe("spec-tasks SKILL.md --stage N contract (FR-MIG-003)", () => {
  const body = readSkillBody();

  test("--stage N parameter documented as positive integer N >= 1", () => {
    const hasPositiveInt =
      body.includes("正整数") ||
      body.includes("positive integer") ||
      (body.includes("N >= 1") || body.includes("N≥1") || body.includes("N ≥ 1"));
    assert.ok(
      hasPositiveInt,
      "spec-tasks/SKILL.md must document --stage N as positive integer N >= 1"
    );
  });

  test("stage blocks use ## Stage N headers with consecutive numbering", () => {
    const hasConsecutive =
      body.includes("连续") || body.includes("consecutive") ||
      (body.includes("Stage 1") && (body.includes("Stage 2") || body.includes("Stage N")));
    assert.ok(
      hasConsecutive,
      "spec-tasks/SKILL.md must specify ## Stage N blocks with consecutive stage numbers from 1"
    );
  });

  test("actual stage count <= N (don't force N blocks)", () => {
    const hasStageCcaN =
      body.includes("≤") || body.includes("<=") ||
      body.includes("不超过") || body.includes("最多") ||
      body.includes("不得大于") || body.includes("不大于") ||
      body.includes("stage count") || body.includes("阶段数") || body.includes("块数");
    const hasNoForce =
      body.includes("不强制") || body.includes("不机械") || body.includes("不凑") ||
      body.includes("不强制凑") || body.includes("不得为凑齐") ||
      body.includes("实际") || body.includes("actual");
    assert.ok(
      hasStageCcaN && hasNoForce,
      "spec-tasks/SKILL.md must specify actual stage count <= N and not force N blocks"
    );
  });

  test("--stage omitted → no stage block headers but keep dependency sorting", () => {
    const hasOmitStage =
      body.includes("省略") || body.includes("omit") || body.includes("不传") ||
      body.includes("未传入") || body.includes("不输出") || body.includes("不出现");
    const hasKeepDepSort =
      body.includes("依赖排序") || body.includes("dependency") || body.includes("dependency sort") ||
      body.includes("仍按依赖") || body.includes("keep dependency");
    assert.ok(
      hasOmitStage,
      "spec-tasks/SKILL.md must document that omitting --stage omits stage block headers"
    );
    assert.ok(
      hasKeepDepSort,
      "spec-tasks/SKILL.md must document that dependency sorting is kept when --stage is omitted"
    );
  });
});

// --- (g) dependency annotation format (stage:N, depends:<task-ids>) ---
describe("spec-tasks SKILL.md dependency annotation convention", () => {
  test("body documents (stage:N, depends:<task-ids>) annotation format", () => {
    const body = readSkillBody();
    assert.ok(
      body.includes("(stage:") || body.includes("（stage："),
      "spec-tasks/SKILL.md must document (stage:N, depends:<task-ids>) annotation convention"
    );
    assert.ok(
      body.includes("depends:") || body.includes("依赖：") || body.includes("depends："),
      "spec-tasks/SKILL.md must document depends:<task-ids> in task annotations"
    );
  });

  test("depends tasks must exist and their stage <= current stage", () => {
    const body = readSkillBody();
    const hasDepExists =
      body.includes("必须存在") || body.includes("must exist") || body.includes("被依赖") ||
      body.includes("依赖的任务必须存在") || body.includes("已存在");
    const hasStageOrder =
      body.includes("stage <=") || body.includes("stage≤") || body.includes("阶段排在前") ||
      body.includes("不晚于") || body.includes("earlier") || body.includes("earlier stage") ||
      body.includes("排在前面");
    assert.ok(
      hasDepExists,
      "spec-tasks/SKILL.md must specify depends tasks must exist"
    );
    assert.ok(
      hasStageOrder,
      "spec-tasks/SKILL.md must specify depends task stage <= current task stage"
    );
  });
});

// --- (h) FR mapping per task ---
describe("spec-tasks SKILL.md FR mapping and dependency ordering", () => {
  test("body documents FR mapping per task", () => {
    const body = readSkillBody();
    assert.ok(
      body.includes("FR") || body.includes("功能需求"),
      "spec-tasks/SKILL.md must reference FR mapping for tasks"
    );
  });

  test("body documents dependency-ordered task generation", () => {
    const body = readSkillBody();
    const hasDepOrder =
      body.includes("依赖排序") || body.includes("dependency order") || body.includes("dependency-ordered") ||
      body.includes("按依赖排序") || body.includes("按 FR 依赖") || body.includes("依赖关系排序");
    assert.ok(
      hasDepOrder,
      "spec-tasks/SKILL.md must document dependency-ordered task generation"
    );
  });
});
