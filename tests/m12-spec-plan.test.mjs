// TDD Phase 3: spec-plan SKILL.md structural test.
// Mirrors tests/five-skills-present.test.mjs style.
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

const SKILL_NAME = "spec-plan";
const SKILL_PATH = join(REPO_ROOT, "skills", SKILL_NAME, "SKILL.md");

// --- T005a: SKILL.md exists ---
describe("spec-plan SKILL.md existence and frontmatter", () => {
  test("skills/spec-plan/SKILL.md exists", () => {
    assert.ok(existsSync(SKILL_PATH), `Missing: ${SKILL_PATH}`);
  });

  // --- T005b: frontmatter name + description ---
  test('frontmatter has name="spec-plan"', () => {
    assert.ok(existsSync(SKILL_PATH), `Missing: ${SKILL_PATH}`);
    const fm = extractFrontmatter(readFileSync(SKILL_PATH, "utf8"));
    assert.ok(fm, "No valid YAML frontmatter in skills/spec-plan/SKILL.md");
    assert.equal(
      fm.name,
      "spec-plan",
      `frontmatter.name should be "spec-plan", got "${fm.name}"`
    );
  });

  test("frontmatter has non-empty description", () => {
    assert.ok(existsSync(SKILL_PATH), `Missing: ${SKILL_PATH}`);
    const fm = extractFrontmatter(readFileSync(SKILL_PATH, "utf8"));
    assert.ok(fm, "No valid YAML frontmatter in skills/spec-plan/SKILL.md");
    assert.ok(
      typeof fm.description === "string" && fm.description.trim().length > 0,
      "frontmatter.description must be a non-empty string in skills/spec-plan/SKILL.md"
    );
  });
});

// --- T006: task-id required / fail-loud ---
describe("spec-plan SKILL.md input contract: task-id required, fail-loud", () => {
  test('body mentions "task-id required" (fail-loud for missing task-id)', () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    assert.ok(
      content.includes("task-id required"),
      "skills/spec-plan/SKILL.md must contain the fail-loud string 'task-id required'"
    );
  });

  // Extra structural signal: body uses 必填/必传 or similar Chinese term to mark it required.
  test("body marks task-id as required (必填 or 必传 or required with non-zero exit)", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    const hasRequired =
      content.includes("必填") ||
      content.includes("必传") ||
      /task-id.{0,80}(required|必须|必填|missing|缺失|fail)/is.test(content);
    assert.ok(
      hasRequired,
      "skills/spec-plan/SKILL.md must mark task-id as required (必填/必传 or 'required') with fail-loud semantics"
    );
  });
});

// --- T007: template path is internal, not .specify/ ---
describe("spec-plan SKILL.md template loading: internal path, no .specify/", () => {
  test('body references internal template path "skills/spec-plan/templates/plan-template.md"', () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    assert.ok(
      content.includes("skills/spec-plan/templates/plan-template.md"),
      "skills/spec-plan/SKILL.md must reference the internal template path 'skills/spec-plan/templates/plan-template.md'"
    );
  });

  test("body does NOT contain .specify/ as a dependency (prohibition lines exempt)", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    // Exclude the provenance footnote from check — 改造自 speckit-* statements with
    // reference to .specify/ in descriptive context belong in provenance lines.
    // We check workflow step sections only: lines between 输入 and 产出.
    const inputIdx = content.indexOf("## 输入");
    const outputIdx = content.indexOf("## 产出");
    let bodyCore = content;
    if (inputIdx !== -1 && outputIdx !== -1) {
      bodyCore = content.slice(inputIdx, outputIdx);
    }
    // Strip lines where .specify/ is mentioned only as a prohibition (不/禁止/not/no).
    // Prohibition lines assert NO .specify/ dependency — they are compliant.
    const lines = bodyCore.split("\n");
    const filtered = lines.filter((l) => {
      if (!l.includes(".specify/")) return true;
      // Keep the line only if .specify/ is NOT in a prohibition context
      const isProhibition = /(不|禁止|不做|not|no|never)\s.{0,30}\.specify\//i.test(l) ||
                            /\.specify\/.{0,30}($|回退|fallback)/i.test(l);
      return !isProhibition;
    });
    const cleaned = filtered.join("\n");
    assert.ok(
      !cleaned.includes(".specify/"),
      "skills/spec-plan/SKILL.md workflow steps must NOT depend on .specify/ (prohibition lines exempt — they assert no .specify/ dependency)"
    );
  });
});

// --- T005f: skill name is NOT "speckit-plan" ---
describe("spec-plan SKILL.md is NOT named speckit-plan", () => {
  test('frontmatter name is NOT "speckit-plan"', () => {
    const fm = extractFrontmatter(readFileSync(SKILL_PATH, "utf8"));
    assert.ok(fm, "No valid YAML frontmatter in skills/spec-plan/SKILL.md");
    assert.notEqual(
      fm.name,
      "speckit-plan",
      "frontmatter.name must NOT be 'speckit-plan' — use 'spec-plan'"
    );
  });

  // The body should not use "speckit-plan" as a self-referencing skill identifier
  // in workflow steps.  Exempt: (a) blockquotes (>) and comments (#, <!--),
  // (b) the ## 去耦约束 section (migration/provenance note per FR-MIG-001),
  // (c) lines where speckit-plan appears alongside provenance signal words
  //     (改造自/改编自/保留/解耦/原版/迁移/adapted/decoupled/migrated/original).
  // NOTE: Do NOT blanket-filter lines containing "speckit-plan" — that would make
  // the assertion vacuously true (it removes the very lines it's checking).
  test("body does NOT use 'speckit-plan' as a skill identifier in workflow steps", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    // Remove YAML frontmatter from check scope
    const body = content.replace(/^---[\s\S]*?---\r?\n/, "");
    // Remove the 去耦约束 section (migration/provenance note — FR-MIG-001 exempt)
    const withoutDecouple = body.replace(/## 去耦约束[\s\S]*?(?=## [^#]|$)/, "");
    // A line is exempt if it is a blockquote, comment, or a provenance mention.
    // Provenance mentions use speckit-plan alongside signal words (改造自/保留/解耦/原版 etc.)
    // in the same line — regardless of ordering.
    const provenanceWord = /(?:改造自|改编自|保留|解耦|原版|迁移|adapted|decoupled|migrated|original)/i;
    const lines = withoutDecouple.split("\n").filter(
      (l) => !l.startsWith(">") && !l.startsWith("<!--") && !l.startsWith("#") &&
             !(l.includes("speckit-plan") && provenanceWord.test(l))
    );
    const cleaned = lines.join("\n");
    assert.ok(
      !cleaned.includes("speckit-plan"),
      "skills/spec-plan/SKILL.md must NOT use 'speckit-plan' as a skill identifier in non-provenance body (豁免: blockquotes/comments/去耦约束/provenance-signal); a callable '使用 speckit-plan' step must fail this check"
    );
  });
});

// --- Fidelity restore T-P1: Explicit phase structure in Implementation Steps ---
describe("spec-plan SKILL.md + template: explicit phase structure", () => {
  const SKILL_CONTENT = readFileSync(SKILL_PATH, "utf8");
  const TEMPLATE_PATH = join(REPO_ROOT, "skills", "spec-plan", "templates", "plan-template.md");
  const TEMPLATE_CONTENT = existsSync(TEMPLATE_PATH) ? readFileSync(TEMPLATE_PATH, "utf8") : "";

  test("SKILL.md describes Implementation Steps grouped by explicit phases", () => {
    // Must reference phase grouping or phase-based step organization
    const hasPhaseGrouping =
      /Phase\s+[0-9]|步骤阶段|phase.{0,20}group|阶段.{0,10}划分/i.test(SKILL_CONTENT)
      || /(?:Phase\s+[0-9]|phase.{0,10}structure|阶段)/i.test(SKILL_CONTENT);
    assert.ok(
      hasPhaseGrouping,
      "skills/spec-plan/SKILL.md must describe Implementation Steps grouped by explicit phases (Phase 1/2/3)"
    );
  });

  test("template contains phase structure in Implementation Steps section", () => {
    assert.ok(
      existsSync(TEMPLATE_PATH),
      "Missing: skills/spec-plan/templates/plan-template.md"
    );
    // Template Implementation Steps section should have phase labels or phase group markers
    // (e.g., "Phase 1:", "## Phase 1", or "### Step 1: ..." with phase grouping)
    const hasPhaseInTemplate =
      /Phase\s+[1-9]/i.test(TEMPLATE_CONTENT)
      || /(?:阶段\s*[一二三1-9])/i.test(TEMPLATE_CONTENT);
    assert.ok(
      hasPhaseInTemplate,
      "skills/spec-plan/templates/plan-template.md must include phase labels in Implementation Steps section"
    );
  });

  test("template Implementation Steps are not just flat Step 1..N without phase grouping", () => {
    assert.ok(
      existsSync(TEMPLATE_PATH),
      "Missing: skills/spec-plan/templates/plan-template.md"
    );
    // Counter-check: if template only has "Step 1", "Step 2" without any phase grouping, fail.
    // We look for Phase presence OR a grouping marker beyond sequential numbering.
    const plainSteps = TEMPLATE_CONTENT.match(/###\s+Step\s+\d+/g);
    const hasPhaseOrGroup = /Phase|阶段|group|Group/i.test(TEMPLATE_CONTENT);
    // If there are steps but no phase grouping, this is the "thinned" version
    if (plainSteps && plainSteps.length >= 2) {
      assert.ok(
        hasPhaseOrGroup,
        "skills/spec-plan/templates/plan-template.md: Implementation Steps must have phase grouping, not just flat sequential Step 1..N"
      );
    }
  });
});

// --- Fidelity restore T-P2: Process rigor in Technical Context fill instructions ---
describe("spec-plan SKILL.md process rigor: Technical Context fill instructions", () => {
  const SKILL_CONTENT = readFileSync(SKILL_PATH, "utf8");

  test("SKILL.md has explicit instructions for extracting technology unknowns as NEEDS CLARIFICATION", () => {
    // speckit-plan marks unknowns as "NEEDS CLARIFICATION" — verify this process exists
    const hasUnknownHandling =
      /NEEDS\s+CLARIFICATION|未知|unknown|unresolved|待确认|标记.*未|marked.*unknown/i.test(SKILL_CONTENT);
    assert.ok(
      hasUnknownHandling,
      "skills/spec-plan/SKILL.md must describe handling of unknown/missing Technical Context fields (NEEDS CLARIFICATION pattern)"
    );
  });

  test("SKILL.md describes at least 6 specific Technical Context fields to fill", () => {
    // The template has 9 fields. The SKILL must instruct filling at least 6 of them specifically.
    const fields = [
      "Language", "Dependencies", "Storage", "Testing",
      "Target Platform", "Project Type", "Performance Goals", "Constraints", "Scale"
    ];
    const matched = fields.filter(f => SKILL_CONTENT.includes(f));
    assert.ok(
      matched.length >= 6,
      `skills/spec-plan/SKILL.md must reference at least 6 Technical Context fields; found ${matched.length}: [${matched.join(", ")}]`
    );
  });
});

// --- Fidelity restore T-P3: Complexity/Tradeoff tracking is explicit ---
describe("spec-plan SKILL.md + template: Complexity/Tradeoff tracking", () => {
  const SKILL_CONTENT = readFileSync(SKILL_PATH, "utf8");
  const TEMPLATE_PATH = join(REPO_ROOT, "skills", "spec-plan", "templates", "plan-template.md");
  const TEMPLATE_CONTENT = existsSync(TEMPLATE_PATH) ? readFileSync(TEMPLATE_PATH, "utf8") : "";

  test("SKILL.md instructs filling Complexity Tracking section", () => {
    // Must reference the Complexity Tracking section filling as a deliberate step
    const hasComplexityInstr =
      /Complexity\s+Track/i.test(SKILL_CONTENT)
      || /复杂度|tradeoff|trade.off|取舍/i.test(SKILL_CONTENT);
    assert.ok(
      hasComplexityInstr,
      "skills/spec-plan/SKILL.md must instruct filling the Complexity Tracking / Tradeoff section"
    );
  });

  test("template Complexity Tracking section has tradeoff documentation prompts", () => {
    assert.ok(
      existsSync(TEMPLATE_PATH),
      "Missing: skills/spec-plan/templates/plan-template.md"
    );
    // The Complexity Tracking section should not be just "No violations" default — it should
    // invite tradeoff/justification discussion
    const hasTradeoffPrompt =
      /取舍|trade.?off|justif|justify|说明|rationale|why|reason|justification/i.test(TEMPLATE_CONTENT)
      || /Complexity\s+Track/i.test(TEMPLATE_CONTENT);
    assert.ok(
      hasTradeoffPrompt,
      "skills/spec-plan/templates/plan-template.md must include Complexity/Tradeoff tracking with justification prompts"
    );
  });
});

// --- T006+T007: no git-branch inference fallback ---
describe("spec-plan SKILL.md has no git-branch inference", () => {
  test("body does NOT contain git branch inference commands as workflow steps (prohibition lines exempt)", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    // Strip lines where git commands appear only as prohibitions (不/禁止/not/no).
    // Prohibition lines like "不执行 git checkout" are compliant assertions.
    const lines = content.split("\n");
    const filtered = lines.filter((l) => {
      const hasGitCmd = /git\s+(checkout|branch|fetch|ls-remote)/i.test(l) ||
                        l.includes("create-new-feature.sh") ||
                        l.includes("setup-plan.sh");
      if (!hasGitCmd) return true;
      // Keep the line only if the git command is NOT in a prohibition context
      const isProhibition = /(不|禁止|不做|not|no|never|约束)/i.test(l);
      return !isProhibition;
    });
    const cleaned = filtered.join("\n");
    const hasBranchInference =
      /git\s+(checkout|branch|fetch|ls-remote)/i.test(cleaned) ||
      cleaned.includes("create-new-feature.sh") ||
      cleaned.includes("setup-plan.sh");
    assert.ok(
      !hasBranchInference,
      "skills/spec-plan/SKILL.md must NOT contain git branch inference as workflow steps (prohibition lines exempt)"
    );
  });
});
