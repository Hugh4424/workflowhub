// TDD Phase 5: spec-analyze SKILL.md structural test.
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

const SKILL_NAME = "spec-analyze";
const SKILL_PATH = join(REPO_ROOT, "skills", SKILL_NAME, "SKILL.md");

// --- T011a: SKILL.md exists ---
describe("spec-analyze SKILL.md existence and frontmatter", () => {
  test("skills/spec-analyze/SKILL.md exists", () => {
    assert.ok(existsSync(SKILL_PATH), `Missing: ${SKILL_PATH}`);
  });

  // --- T011b: frontmatter name + description ---
  test('frontmatter has name="spec-analyze"', () => {
    assert.ok(existsSync(SKILL_PATH), `Missing: ${SKILL_PATH}`);
    const fm = extractFrontmatter(readFileSync(SKILL_PATH, "utf8"));
    assert.ok(fm, "No valid YAML frontmatter in skills/spec-analyze/SKILL.md");
    assert.equal(
      fm.name,
      "spec-analyze",
      `frontmatter.name should be "spec-analyze", got "${fm.name}"`
    );
  });

  test("frontmatter has non-empty description", () => {
    assert.ok(existsSync(SKILL_PATH), `Missing: ${SKILL_PATH}`);
    const fm = extractFrontmatter(readFileSync(SKILL_PATH, "utf8"));
    assert.ok(fm, "No valid YAML frontmatter in skills/spec-analyze/SKILL.md");
    assert.ok(
      typeof fm.description === "string" && fm.description.trim().length > 0,
      "frontmatter.description must be a non-empty string in skills/spec-analyze/SKILL.md"
    );
  });
});

// --- T011c: body covers 4 problem types ---
describe("spec-analyze SKILL.md covers 4 problem types", () => {
  test("body mentions 'inconsistency' (不一致)", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    const hasInconsistency =
      content.includes("inconsistency") || content.includes("不一致");
    assert.ok(
      hasInconsistency,
      "skills/spec-analyze/SKILL.md must cover problem type 'inconsistency' (不一致)"
    );
  });

  test("body mentions 'duplicate' (重复)", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    const hasDuplicate =
      content.includes("duplicate") || content.includes("重复");
    assert.ok(
      hasDuplicate,
      "skills/spec-analyze/SKILL.md must cover problem type 'duplicate' (重复)"
    );
  });

  test("body mentions 'ambiguity' (歧义)", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    const hasAmbiguity =
      content.includes("ambiguity") || content.includes("歧义");
    assert.ok(
      hasAmbiguity,
      "skills/spec-analyze/SKILL.md must cover problem type 'ambiguity' (歧义)"
    );
  });

  test("body mentions 'underdefined' (欠定义)", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    const hasUnderdefined =
      content.includes("underdefined") || content.includes("欠定义");
    assert.ok(
      hasUnderdefined,
      "skills/spec-analyze/SKILL.md must cover problem type 'underdefined' (欠定义)"
    );
  });
});

// --- T011d+T012: body requires all 5 finding fields for non-summary findings ---
describe("spec-analyze SKILL.md requires 5 finding fields", () => {
  test("body mentions 'type' as a required finding field", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    assert.ok(
      content.includes("type"),
      "skills/spec-analyze/SKILL.md must reference 'type' as a required finding field"
    );
  });

  test("body mentions 'source_artifact' as a required finding field", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    assert.ok(
      content.includes("source_artifact"),
      "skills/spec-analyze/SKILL.md must reference 'source_artifact' as a required finding field"
    );
  });

  test("body mentions 'target_artifact' as a required finding field", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    assert.ok(
      content.includes("target_artifact"),
      "skills/spec-analyze/SKILL.md must reference 'target_artifact' as a required finding field"
    );
  });

  test("body mentions 'fr_or_task_id' as a required finding field", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    assert.ok(
      content.includes("fr_or_task_id"),
      "skills/spec-analyze/SKILL.md must reference 'fr_or_task_id' as a required finding field"
    );
  });

  test("body mentions 'line_or_anchor' as a required finding field", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    assert.ok(
      content.includes("line_or_anchor"),
      "skills/spec-analyze/SKILL.md must reference 'line_or_anchor' as a required finding field"
    );
  });

  // T012: missing-field finding = invalid (report non-compliant)
  test("body states missing-field finding is invalid/non-compliant", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    const hasNonCompliant =
      content.includes("无效") ||
      content.includes("non-compliant") ||
      content.includes("未达标") ||
      content.includes("noncompliant");
    assert.ok(
      hasNonCompliant,
      "skills/spec-analyze/SKILL.md must state that findings missing required fields are invalid/non-compliant"
    );
  });
});

// --- T011e: non-blocking/read-only + "无一致性问题" summary ---
describe("spec-analyze SKILL.md non-blocking + read-only semantics", () => {
  test("body states report is read-only (只读/read-only)", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    const hasReadOnly =
      content.includes("只读") ||
      content.includes("read-only") ||
      content.includes("READ-ONLY") ||
      content.includes("read only");
    assert.ok(
      hasReadOnly,
      "skills/spec-analyze/SKILL.md must state the report is read-only"
    );
  });

  test("body states report does not block downstream (不阻断/does not block)", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    const hasNonBlocking =
      content.includes("不阻断") ||
      content.includes("不阻塞") ||
      content.includes("does not block") ||
      content.includes("不卡") ||
      content.includes("非阻断");
    assert.ok(
      hasNonBlocking,
      "skills/spec-analyze/SKILL.md must state the report does not block downstream"
    );
  });

  test('body contains "无一致性问题" (zero-problems summary path)', () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    assert.ok(
      content.includes("无一致性问题"),
      'skills/spec-analyze/SKILL.md must contain the summary line "无一致性问题"'
    );
  });
});

// --- T013: task-id derivation, no .specify/, no git branch ---
describe("spec-analyze SKILL.md artifact location: task-id derivation", () => {
  test('body references "specs/{task-id}/" path pattern for artifact location', () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    const hasTaskIdPath =
      content.includes("specs/{task-id}") ||
      content.includes("specs/<task-id>") ||
      content.includes("specs/「task-id」");
    assert.ok(
      hasTaskIdPath,
      "skills/spec-analyze/SKILL.md must use task-id derivation for artifact paths (specs/{task-id}/)"
    );
  });

  test("body does NOT contain .specify/ (no .specify/ scaffold dependency)", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    // Exclude provenance footnotes from check
    const inputIdx = content.indexOf("## 输入");
    const outputIdx = content.indexOf("## 产出");
    let bodyCore = content;
    if (inputIdx !== -1 && outputIdx !== -1) {
      bodyCore = content.slice(inputIdx, outputIdx);
    }
    assert.ok(
      !bodyCore.includes(".specify/"),
      "skills/spec-analyze/SKILL.md workflow steps must NOT reference .specify/"
    );
  });

  test("body does NOT contain git branch inference commands (git checkout/branch/fetch)", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    const hasBranchInference =
      /git\s+(checkout|branch|fetch|ls-remote)/i.test(content) ||
      content.includes("check-prerequisites.sh");
    assert.ok(
      !hasBranchInference,
      "skills/spec-analyze/SKILL.md must NOT contain git branch inference commands"
    );
  });
});

// --- T011g: output path + facts.analysis_ref ---
describe("spec-analyze SKILL.md output path and stage-result reference", () => {
  test('body references output path "specs/{task-id}/cross-artifact-analysis.md"', () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    assert.ok(
      content.includes("cross-artifact-analysis.md"),
      "skills/spec-analyze/SKILL.md must reference output path 'cross-artifact-analysis.md'"
    );
  });

  test('body references "facts.analysis_ref" for stage-result integration', () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    assert.ok(
      content.includes("analysis_ref"),
      "skills/spec-analyze/SKILL.md must reference 'analysis_ref' in stage-result facts"
    );
  });
});

// --- T011h: skill name is NOT "speckit-analyze" ---
describe("spec-analyze SKILL.md is NOT named speckit-analyze", () => {
  test('frontmatter name is NOT "speckit-analyze"', () => {
    const fm = extractFrontmatter(readFileSync(SKILL_PATH, "utf8"));
    assert.ok(fm, "No valid YAML frontmatter in skills/spec-analyze/SKILL.md");
    assert.notEqual(
      fm.name,
      "speckit-analyze",
      "frontmatter.name must NOT be 'speckit-analyze' — use 'spec-analyze'"
    );
  });

  // The body should not use "speckit-analyze" as a self-referencing skill identifier
  // in workflow steps.  Exempt: (a) blockquotes (>) and comments (#, <!--),
  // (b) the ## 去耦约束 section (migration/provenance note per FR-MIG-001),
  // (c) lines where speckit-analyze appears alongside provenance signal words
  //     (改造自/改编自/保留/解耦/原版/迁移/adapted/decoupled/migrated/original).
  // NOTE: Do NOT blanket-filter lines containing "speckit-analyze" — that would make
  // the assertion vacuously true (it removes the very lines it's checking).
  test("body does NOT use 'speckit-analyze' as a skill identifier in workflow steps", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    // Remove YAML frontmatter from check scope
    const body = content.replace(/^---[\s\S]*?---\r?\n/, "");
    // Remove the 去耦约束 section (migration/provenance note — FR-MIG-001 exempt)
    const withoutDecouple = body.replace(/## 去耦约束[\s\S]*?(?=## [^#]|$)/, "");
    // A line is exempt if it is a blockquote, comment, or a provenance mention.
    // Provenance mentions use speckit-analyze alongside signal words (改造自/保留/解耦/原版 etc.)
    // in the same line — regardless of ordering.
    const provenanceWord = /(?:改造自|改编自|保留|解耦|原版|迁移|adapted|decoupled|migrated|original)/i;
    const lines = withoutDecouple.split("\n").filter(
      (l) => !l.startsWith(">") && !l.startsWith("<!--") && !l.startsWith("#") &&
             !(l.includes("speckit-analyze") && provenanceWord.test(l))
    );
    const cleaned = lines.join("\n");
    assert.ok(
      !cleaned.includes("speckit-analyze"),
      "skills/spec-analyze/SKILL.md must NOT use 'speckit-analyze' as a skill identifier in non-provenance body (豁免: blockquotes/comments/去耦约束/provenance-signal); a callable '调用 speckit-analyze' step must fail this check"
    );
  });
});

// --- Fidelity restore T-A1: Severity classification per finding ---
describe("spec-analyze SKILL.md severity classification: CRITICAL/HIGH/MEDIUM/LOW", () => {
  test("body mentions CRITICAL/HIGH/MEDIUM/LOW in severity context", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    // CRITICAL must appear near "severity" or in a severity table/list — not just as any English word.
    // Use a composite check: all 4 severity labels exist AND at least one appears near "severity".
    const hasCritical = content.includes("CRITICAL");
    const hasHigh = /HIGH(?!-)/.test(content); // HIGH but not HIGH- (as in HIGH-LEVEL)
    const hasMedium = content.includes("MEDIUM");
    const hasLow = /\bLOW\b/.test(content); // LOW as a word
    const allFour = hasCritical && hasHigh && hasMedium && hasLow;
    // Counter-check: if the labels don't appear in a severity section, the test should fail.
    // We check that "severity" or "严重" appears within 200 chars of at least one label.
    const severityNear = /(?:severity|严重|级别|Severity)[\s\S]{0,200}(?:CRITICAL|HIGH|MEDIUM|LOW)/i.test(content)
      || /(?:CRITICAL|HIGH|MEDIUM|LOW)[\s\S]{0,200}(?:severity|严重|级别|Severity)/i.test(content);
    assert.ok(
      allFour && severityNear,
      "skills/spec-analyze/SKILL.md must include CRITICAL, HIGH, MEDIUM, LOW severity labels in a severity context (near 'severity' or 级别)"
    );
  });

  test("body has severity heuristics/rules describing what each level means", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    // Must have at least 2 severity levels with explanation text nearby
    // (verifies they are not just bare labels)
    const criticalExplained = /CRITICAL.{0,80}(?:violates|阻断|block|core|must|MUST|constitution|宪法)/is.test(content);
    const highExplained = /HIGH.{0,80}(?:conflict|ambigu|security|performance|重复|冲突)/is.test(content);
    const mediumExplained = /MEDIUM.{0,80}(?:terminology|naming|missing|edge|coverage|术语|缺失)/is.test(content);
    const explainedCount = [criticalExplained, highExplained, mediumExplained].filter(Boolean).length;
    assert.ok(
      explainedCount >= 2,
      `skills/spec-analyze/SKILL.md must explain at least 2 severity levels with heuristics; got ${explainedCount}`
    );
  });
});

// --- Fidelity restore T-A2: Coverage Summary / Metrics block ---
describe("spec-analyze SKILL.md Coverage Summary and Metrics", () => {
  test("body has Coverage Summary or Metrics section with quantitative counts", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    // Must have a metrics/coverage block with at least 2 of: Total Requirements, Total Tasks, Coverage %, Ambiguity Count, Duplication Count, Critical Issues Count
    const hasTotalReqs = /Total\s+Requirements|需求总数|total.*requirements/i.test(content);
    const hasTotalTasks = /Total\s+Tasks|任务总数|total.*tasks/i.test(content);
    const hasCoverage = /Coverage\s*%|覆盖率|coverage.*%|coverage.*percent/i.test(content);
    const matchCount = [hasTotalReqs, hasTotalTasks, hasCoverage].filter(Boolean).length;
    assert.ok(
      matchCount >= 2,
      `skills/spec-analyze/SKILL.md must include a Coverage Summary/Metrics block with quantitative counts; found ${matchCount}/3 key terms`
    );
  });
});

// --- Fidelity restore T-A3: Next Actions / remediation guidance ---
describe("spec-analyze SKILL.md Next Actions / remediation guidance", () => {
  test("body has Next Actions section with severity-based guidance", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    // Must mention Next Actions or remediation or 后续行动 or 下一步动作 within a guidance context
    const hasNextActions = /Next\s+Actions|后续行动|remediation|补救|处置建议/i.test(content);
    assert.ok(
      hasNextActions,
      "skills/spec-analyze/SKILL.md must include a Next Actions / remediation-guidance block"
    );
  });

  test("body mentions resolving CRITICAL before implementation in guidance", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    // Guidance for CRITICAL issues: resolve before implement, or similar
    const hasCriticalGuidance = /CRITICAL.{0,100}(?:resolve|解决|implement|before|先|before|implement)/is.test(content)
      || /(?:resolve|解决|先).{0,100}CRITICAL/is.test(content);
    // Also accept: guidance that mentions severity-based priority
    const hasSeverityBasedGuidance = /(?:severity|级别).{0,100}(?:guidance|建议|action|proceed|resolve|解决)/is.test(content);
    assert.ok(
      hasCriticalGuidance || hasSeverityBasedGuidance,
      "skills/spec-analyze/SKILL.md must provide severity-based guidance (e.g., resolve CRITICAL before implementation)"
    );
  });
});

// --- Fidelity restore T-A4: Finding cap with overflow note ---
describe("spec-analyze SKILL.md finding cap with overflow note", () => {
  test("body mentions a finding count limit (50) with overflow/summary handling", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    // Must mention a numeric cap (close to 50) near "overflow" or "summary" or "limit" or "cap"
    const hasCap = /\b5[0-9]\b|上限|cap|limit|最多\s*\d/i.test(content);
    const hasOverflow = /overflow|summary|余|截断|超过|aggregate|excess/i.test(content);
    assert.ok(
      hasCap && hasOverflow,
      "skills/spec-analyze/SKILL.md must include a finding cap (~50) with overflow/summary handling for excess findings"
    );
  });
});

// --- Fidelity restore T-A5: Constitution alignment detection category ---
describe("spec-analyze SKILL.md constitution-alignment detection category", () => {
  test("body includes constitution-alignment as a named detection category", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    // Must reference constitution alignment as a detection / scan category
    const hasConstitutionAlign = /constitution.{0,40}align|宪法.{0,10}符合|constitution.{0,20}check|constitution.{0,20}detect/i.test(content)
      || /(?:constitution|宪法).{0,60}(?:conflict|violat|违背|违反|misalign)/is.test(content);
    assert.ok(
      hasConstitutionAlign,
      "skills/spec-analyze/SKILL.md must include constitution-alignment as a named detection/scan category (RECORD-only, not a blocking gate)"
    );
  });

  // Counter-check: constitution alignment mentions MUST be in record-only context (FR-XARTIFACT-002)
  test("body states constitution findings are record-only, not blocking", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    const exists = content.includes("constitution");
    if (exists) {
      // If constitution is mentioned, nearby text must confirm non-blocking
      const nonBlocking = /constitution.{0,200}(?:记录|record|不阻断|non.block|flag|标记)/is.test(content)
        || /constitution.{0,200}(?:read.only|只读|informational)/is.test(content);
      assert.ok(
        nonBlocking,
        "skills/spec-analyze/SKILL.md: constitution-related findings must be documented as record-only, non-blocking"
      );
    }
  });
});

// --- T011: input contract — 3 artifacts must ALL exist, fail-loud if any missing ---
describe("spec-analyze SKILL.md input contract: 3 artifacts required", () => {
  test("body requires spec.md, plan.md, and tasks.md all exist (fail-loud)", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    const hasSpecMd = content.includes("spec.md");
    const hasPlanMd = content.includes("plan.md");
    const hasTasksMd = content.includes("tasks.md");
    assert.ok(
      hasSpecMd && hasPlanMd && hasTasksMd,
      "skills/spec-analyze/SKILL.md must reference all 3 required artifacts: spec.md, plan.md, tasks.md"
    );
  });

  test("body states fail-loud if any artifact is missing", () => {
    const content = readFileSync(SKILL_PATH, "utf8");
    const hasFailLoud =
      content.includes("fail-loud") ||
      content.includes("报错") ||
      content.includes("失败") ||
      content.includes("missing") ||
      content.includes("不存在") ||
      content.includes("not found");
    assert.ok(
      hasFailLoud,
      "skills/spec-analyze/SKILL.md must state fail-loud on missing artifacts"
    );
  });
});
