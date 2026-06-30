// TDD Phase 1 (m13-make-decision-v1): Stage 2 structural assertions — T002+T003+T004.
// Asserts on text content of workflows/make-decision/SKILL.md and reuse-registry.md.
// Uses vitest + node:assert. Mirrors m12-build-plan-v1.test.mjs pattern.
import { test, describe } from "vitest";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const SKILL_PATH = join(REPO_ROOT, "workflows", "make-decision", "SKILL.md");
const REGISTRY_PATH = join(REPO_ROOT, "reuse-registry.md");
const YAML_CONFIG_PATH = join(REPO_ROOT, "config", "workflowhub.yaml");

function readSkill() {
  assert.ok(existsSync(SKILL_PATH), `Missing: ${SKILL_PATH}`);
  return readFileSync(SKILL_PATH, "utf8");
}

function readRegistry() {
  assert.ok(existsSync(REGISTRY_PATH), `Missing: ${REGISTRY_PATH}`);
  return readFileSync(REGISTRY_PATH, "utf8");
}

// T002(a): frontmatter contains name, version, description fields
describe("T002(a): SKILL.md frontmatter — name/version/description", () => {
  test("frontmatter block exists (--- delimited)", () => {
    const content = readSkill();
    const hasFrontmatter = content.startsWith("---") && content.indexOf("---", 3) !== -1;
    assert.ok(hasFrontmatter, "SKILL.md must start with --- frontmatter block");
  });

  test("frontmatter contains 'name' field", () => {
    const content = readSkill();
    const fmEnd = content.indexOf("---", 3);
    const frontmatter = content.slice(0, fmEnd);
    assert.ok(
      frontmatter.includes("name:"),
      "frontmatter must contain 'name:' field"
    );
  });

  test("frontmatter contains 'version' field", () => {
    const content = readSkill();
    const fmEnd = content.indexOf("---", 3);
    const frontmatter = content.slice(0, fmEnd);
    assert.ok(
      frontmatter.includes("version:"),
      "frontmatter must contain 'version:' field"
    );
  });

  test("frontmatter contains 'description' field", () => {
    const content = readSkill();
    const fmEnd = content.indexOf("---", 3);
    const frontmatter = content.slice(0, fmEnd);
    assert.ok(
      frontmatter.includes("description:"),
      "frontmatter must contain 'description:' field"
    );
  });
});

// T002(b): 6 env vars each present with default value and override explanation
describe("T002(b): SKILL.md — 6 env vars with defaults and override", () => {
  const ENV_VARS = [
    "MAKE_DECISION_DEBATE_PATH",
    "MAKE_DECISION_SKIP_DEBATE",
    "MAKE_DECISION_SKIP_BLIND_REVIEW",
    "THIRD_REVIEW_RUNNER",
    "REVIEW_DISPATCH_CONFIG",
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS",
  ];

  for (const envVar of ENV_VARS) {
    test(`env var ${envVar} present in SKILL.md`, () => {
      const content = readSkill();
      assert.ok(
        content.includes(envVar),
        `SKILL.md must mention env var ${envVar}`
      );
    });
  }

  test("env var section mentions default values", () => {
    const content = readSkill();
    const hasDefault =
      content.includes("默认") ||
      content.includes("default") ||
      content.includes("Default") ||
      content.includes("默认值") ||
      content.includes("缺省");
    assert.ok(hasDefault, "SKILL.md must document default values for env vars");
  });

  test("env var section mentions override method", () => {
    const content = readSkill();
    const hasOverride = content.includes("export");
    assert.ok(hasOverride, "SKILL.md must document how to override env vars");
  });

  test("per-var precise defaults/semantics present in SKILL.md", () => {
    const content = readSkill();

    // MAKE_DECISION_DEBATE_PATH
    assert.ok(
      content.includes("/Users/Hugh/Hugh/Project/debate"),
      "SKILL.md must contain default path /Users/Hugh/Hugh/Project/debate for MAKE_DECISION_DEBATE_PATH"
    );
    assert.ok(
      content.includes("debate_path_invalid"),
      "SKILL.md must contain error token debate_path_invalid for MAKE_DECISION_DEBATE_PATH"
    );

    // MAKE_DECISION_SKIP_DEBATE — default 0 and =1 semantics
    const skipDebateIdx = content.indexOf("MAKE_DECISION_SKIP_DEBATE");
    assert.ok(skipDebateIdx !== -1, "MAKE_DECISION_SKIP_DEBATE must appear in SKILL.md");
    const skipDebateSection = content.slice(skipDebateIdx, skipDebateIdx + 400);
    assert.ok(
      skipDebateSection.includes("0"),
      "SKILL.md section for MAKE_DECISION_SKIP_DEBATE must show default value 0"
    );
    assert.ok(
      content.includes("=1"),
      "SKILL.md must contain =1 to document override semantics for skip vars"
    );

    // MAKE_DECISION_SKIP_BLIND_REVIEW — =1 semantics
    const skipBlindIdx = content.indexOf("MAKE_DECISION_SKIP_BLIND_REVIEW");
    assert.ok(skipBlindIdx !== -1, "MAKE_DECISION_SKIP_BLIND_REVIEW must appear in SKILL.md");
    const skipBlindSection = content.slice(skipBlindIdx, skipBlindIdx + 400);
    assert.ok(
      skipBlindSection.includes("=1") || content.slice(Math.max(0, skipBlindIdx - 200), skipBlindIdx + 400).includes("=1"),
      "SKILL.md must contain =1 near MAKE_DECISION_SKIP_BLIND_REVIEW"
    );

    // THIRD_REVIEW_RUNNER
    assert.ok(
      content.includes("run-heterologous-review.mjs"),
      "SKILL.md must contain default script run-heterologous-review.mjs for THIRD_REVIEW_RUNNER"
    );
    assert.ok(
      content.includes("runner_invalid"),
      "SKILL.md must contain error token runner_invalid for THIRD_REVIEW_RUNNER"
    );

    // REVIEW_DISPATCH_CONFIG
    assert.ok(
      content.includes("dispatch_config_invalid"),
      "SKILL.md must contain error token dispatch_config_invalid for REVIEW_DISPATCH_CONFIG"
    );
    assert.ok(
      content.includes("配置文件路径") || content.includes("JSON") || content.includes("YAML"),
      "SKILL.md must describe REVIEW_DISPATCH_CONFIG as a config file path (JSON/YAML)"
    );

    // CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS
    assert.ok(
      content.includes("五方法庭"),
      "SKILL.md must mention 五方法庭 in context of CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS"
    );
    assert.ok(
      content.includes("单人三档"),
      "SKILL.md must mention 单人三档 in context of CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS"
    );
    assert.ok(
      content.includes("不读此变量控制 S1") ||
      content.includes("不用此变量控制 S1") ||
      content.includes("不读此变量"),
      "SKILL.md must clarify that CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS does not control S1"
    );
  });

  test("SKILL.md contains entry-check anchors for THIRD_REVIEW_RUNNER, REVIEW_DISPATCH_CONFIG, and CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS", () => {
    const content = readSkill();
    assert.ok(
      content.includes("入口检测（THIRD_REVIEW_RUNNER）"),
      "SKILL.md must contain 入口检测（THIRD_REVIEW_RUNNER）"
    );
    assert.ok(
      content.includes("入口检测（REVIEW_DISPATCH_CONFIG）"),
      "SKILL.md must contain 入口检测（REVIEW_DISPATCH_CONFIG）"
    );
    assert.ok(
      content.includes("入口检测（CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS）"),
      "SKILL.md must contain 入口检测（CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS）"
    );
  });
});

// T002(c): config/workflowhub.yaml NOT modified — no new env var registration there
describe("T002(c): config/workflowhub.yaml must NOT register the 6 new env vars", () => {
  const ENV_VARS_NO_YAML = [
    "MAKE_DECISION_DEBATE_PATH",
    "MAKE_DECISION_SKIP_DEBATE",
    "MAKE_DECISION_SKIP_BLIND_REVIEW",
    "THIRD_REVIEW_RUNNER",
    "REVIEW_DISPATCH_CONFIG",
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS",
  ];

  for (const envVar of ENV_VARS_NO_YAML) {
    test(`${envVar} not in workflowhub.yaml`, () => {
      if (!existsSync(YAML_CONFIG_PATH)) return; // file may not exist
      const yaml = readFileSync(YAML_CONFIG_PATH, "utf8");
      assert.ok(
        !yaml.includes(envVar),
        `config/workflowhub.yaml must NOT register ${envVar}`
      );
    });
  }
});

// T004: SKILL.md first executable step calls recordSkeleton with M4 10 core fields
describe("T004: SKILL.md — recordSkeleton call at stage start with M4 10 core fields", () => {
  test("SKILL.md mentions recordSkeleton", () => {
    const content = readSkill();
    assert.ok(
      content.includes("recordSkeleton"),
      "SKILL.md must instruct calling recordSkeleton at stage start"
    );
  });

  test("recordSkeleton call references metrics/collector.mjs", () => {
    const content = readSkill();
    assert.ok(
      content.includes("metrics/collector.mjs") || content.includes("collector.mjs"),
      "SKILL.md must reference metrics/collector.mjs for recordSkeleton"
    );
  });

  test("recordSkeleton appears before S0 / first action step", () => {
    const content = readSkill();
    const rsIdx = content.indexOf("recordSkeleton");
    assert.ok(rsIdx !== -1, "recordSkeleton must appear in SKILL.md");
    // It should appear in the first 3000 chars (front matter + early steps section)
    assert.ok(
      rsIdx < 3000,
      `recordSkeleton should appear near the top of SKILL.md (found at char ${rsIdx})`
    );
  });

  const M4_FIELDS = [
    "execution_id",
    "skill_or_stage",
    "stage",
    "skill_version",
    "executed",
    "tokens",
    "duration_ms",
    "rework_rounds",
    "human_intervention",
    "friction_ref",
  ];

  test("all 10 M4 core fields present in SKILL.md", () => {
    const content = readSkill();
    const missing = M4_FIELDS.filter((f) => !content.includes(f));
    assert.ok(
      missing.length === 0,
      `SKILL.md must list all 10 M4 core fields. Missing (${missing.length}): ${missing.join(", ")}`
    );
  });
});

// ─── Phase 2: S0–S4 structural assertions (T005–T010) ─────────────────────────

// T005: S0 背景扎根 section + journal event
describe("T005: SKILL.md — S0 背景扎根 section", () => {
  test("S0 section header exists", () => {
    const content = readSkill();
    const hasS0 =
      content.includes("## S0") ||
      content.includes("## S0 ") ||
      content.includes("S0 背景扎根") ||
      content.includes("S0: 背景扎根") ||
      content.includes("### S0");
    assert.ok(hasS0, "SKILL.md must contain S0 背景扎根 section");
  });

  test("S0 section mentions loading context (CONTEXT.md / decision-log / task-id)", () => {
    const content = readSkill();
    const hasContext =
      content.includes("CONTEXT.md") ||
      content.includes("task-id") ||
      content.includes("背景") ||
      content.includes("context");
    assert.ok(hasContext, "S0 section must describe loading background context");
  });

  test("S0 journal event s0_context_loaded present", () => {
    const content = readSkill();
    assert.ok(
      content.includes("s0_context_loaded"),
      "SKILL.md must specify journal event s0_context_loaded in S0"
    );
  });
});

// T006: S0.5 scope-triage lite/full section + journal event
describe("T006: SKILL.md — S0.5 scope-triage lite/full", () => {
  test("S0.5 section header exists", () => {
    const content = readSkill();
    const hasS05 =
      content.includes("S0.5") ||
      content.includes("scope-triage") ||
      content.includes("scope_triage");
    assert.ok(hasS05, "SKILL.md must contain S0.5 scope-triage section");
  });

  test("S0.5 mentions lite and full tiers", () => {
    const content = readSkill();
    assert.ok(content.includes("lite"), "S0.5 must mention lite tier");
    assert.ok(content.includes("full"), "S0.5 must mention full tier");
  });

  test("S0.5 no quick tier (quick 档概念不存在)", () => {
    const content = readSkill();
    // scope=quick must not appear as a valid tier value
    assert.ok(
      !content.includes("scope=quick") && !content.includes("scope: quick"),
      "S0.5 must NOT introduce a 'quick' tier (scope=quick must not appear)"
    );
  });

  test("S0.5 lite skips S1 internal research", () => {
    const content = readSkill();
    // S1 paragraph must contain a skip instruction with scope=lite event key
    const s1Idx = content.indexOf("## S1");
    assert.ok(s1Idx !== -1, "SKILL.md must contain S1 section");
    const s1Section = content.slice(s1Idx, s1Idx + 1000);
    const hasLiteSkipS1 =
      s1Section.includes("skipped: scope=lite") ||
      s1Section.includes("s1: skipped: scope=lite") ||
      s1Section.includes("scope=lite");
    assert.ok(hasLiteSkipS1, "S1 section must contain lite skip instruction with scope=lite event key");
  });

  test("S0.5 lite skips S3 external research", () => {
    const content = readSkill();
    // S3 paragraph must contain a skip instruction with scope=lite event key
    const s3Idx = content.indexOf("## S3");
    assert.ok(s3Idx !== -1, "SKILL.md must contain S3 section");
    const s3Section = content.slice(s3Idx, s3Idx + 1000);
    const hasLiteSkipS3 =
      s3Section.includes("skipped: scope=lite") ||
      s3Section.includes("s3: skipped: scope=lite") ||
      s3Section.includes("scope=lite");
    assert.ok(hasLiteSkipS3, "S3 section must contain lite skip instruction with scope=lite event key");
  });

  test("S0.5 journal event s0_5_scope present", () => {
    const content = readSkill();
    assert.ok(
      content.includes("s0_5_scope"),
      "SKILL.md must specify journal event s0_5_scope in S0.5"
    );
  });
});

// T007: S1 内部调研 (full 档专属) section
describe("T007: SKILL.md — S1 内部调研 full 档专属", () => {
  test("S1 section header exists", () => {
    const content = readSkill();
    const hasS1 =
      content.includes("## S1") ||
      content.includes("S1 内部调研") ||
      content.includes("S1: 内部调研") ||
      content.includes("### S1");
    assert.ok(hasS1, "SKILL.md must contain S1 内部调研 section");
  });

  test("S1 is full 档专属 (only runs when full)", () => {
    const content = readSkill();
    const hasFull =
      content.includes("full 档") ||
      content.includes("full 档专属") ||
      (content.includes("S1") && content.includes("full"));
    assert.ok(hasFull, "S1 must be marked as full tier exclusive");
  });

  test("S1 requires >= 3 concurrent sub-agents", () => {
    const content = readSkill();
    const hasSubagents =
      content.includes("≥3") ||
      content.includes("≥ 3") ||
      content.includes(">= 3") ||
      content.includes("3 sub-agent") ||
      content.includes("3个 sub-agent") ||
      content.includes("三个 sub-agent");
    assert.ok(hasSubagents, "S1 must require >= 3 concurrent sub-agents");
  });

  test("S1 covers all 5 content categories", () => {
    const content = readSkill();
    // Must mention the 5 categories of internal research
    const has1 = content.includes("领域背景") || content.includes("术语澄清") || content.includes("domain");
    const has2 = content.includes("历史先例") || content.includes("经验教训") || content.includes("先例");
    const has3 = content.includes("codebase") || content.includes("当前实现") || content.includes("接口") || content.includes("约束");
    const has4 = content.includes("最佳实践") || content.includes("外部生态") || content.includes("best practice");
    const has5 = content.includes("风险") || content.includes("反向案例") || content.includes("known risk");
    assert.ok(has1, "S1 must cover category 1: 领域背景/术语澄清");
    assert.ok(has2, "S1 must cover category 2: 历史先例/经验教训");
    assert.ok(has3, "S1 must cover category 3: codebase 相关实现");
    assert.ok(has4, "S1 must cover category 4: 外部生态最佳实践");
    assert.ok(has5, "S1 must cover category 5: 风险/反向案例");
  });

  test("S1 produces internal-research-summary.md", () => {
    const content = readSkill();
    assert.ok(
      content.includes("internal-research-summary.md"),
      "S1 must produce tasks/{task-id}/research/internal-research-summary.md"
    );
  });

  test("S1 handles total failure: s1_all_agents_failed event", () => {
    const content = readSkill();
    assert.ok(
      content.includes("s1_all_agents_failed"),
      "S1 must record s1_all_agents_failed journal event when all sub-agents fail"
    );
  });

  test("S1 continues to S2 even when all agents fail (non-blocking)", () => {
    const content = readSkill();
    // must say it continues, is non-blocking
    const hasNonBlock =
      content.includes("非阻断") ||
      content.includes("继续") ||
      content.includes("continue") ||
      content.includes("non-blocking");
    assert.ok(hasNonBlock, "S1 failure must be non-blocking — must continue to S2");
  });
});

// T008: S2 talk#1 section
describe("T008: SKILL.md — S2 talk#1", () => {
  test("S2 section header exists", () => {
    const content = readSkill();
    const hasS2 =
      content.includes("## S2") ||
      content.includes("S2 talk") ||
      content.includes("S2: talk") ||
      content.includes("### S2");
    assert.ok(hasS2, "SKILL.md must contain S2 talk#1 section");
  });

  test("S2 asks questions one at a time (一次一问)", () => {
    const content = readSkill();
    const hasOneAtATime =
      content.includes("一次一问") ||
      content.includes("一次只问") ||
      content.includes("one question") ||
      content.includes("one at a time");
    assert.ok(hasOneAtATime, "S2 must enforce asking one question at a time (FR-TALK-01)");
  });

  test("S2 mentions three-round structure (三轮结构)", () => {
    const content = readSkill();
    const hasThreeRound =
      content.includes("三轮") ||
      content.includes("three round") ||
      content.includes("Q1") ||
      content.includes("talk#1") ||
      content.includes("talk#2") ||
      content.includes("talk#3");
    assert.ok(hasThreeRound, "S2 must be part of three-round talk structure");
  });

  test("S2 presents internal research summary to user first", () => {
    const content = readSkill();
    // S2 must present the internal-research-summary before asking Q1
    const hasPresent =
      content.includes("internal-research-summary") ||
      content.includes("内部调研摘要") ||
      content.includes("呈现") ||
      (content.includes("S2") && content.includes("summary"));
    assert.ok(hasPresent, "S2 must present internal-research-summary.md to user before Q1");
  });

  test("S2 asks Q1 about external research need", () => {
    const content = readSkill();
    const hasQ1 =
      content.includes("外部调研") ||
      content.includes("外部双路") ||
      content.includes("external research") ||
      content.includes("Q1");
    assert.ok(hasQ1, "S2 Q1 must ask about need for external research");
  });

  test("S2 sorts questions by impact (按影响排序, FR-TALK-02)", () => {
    const content = readSkill();
    const hasSorted =
      content.includes("按影响排序") ||
      content.includes("影响排序") ||
      content.includes("impact") ||
      content.includes("排序");
    assert.ok(hasSorted, "S2 must sort questions by impact (FR-TALK-02)");
  });
});

// T009: S3 双路外部调研 section
describe("T009: SKILL.md — S3 双路外部调研", () => {
  test("S3 section header exists", () => {
    const content = readSkill();
    const hasS3 =
      content.includes("## S3") ||
      content.includes("S3 外部调研") ||
      content.includes("S3: 外部调研") ||
      content.includes("S3 双路") ||
      content.includes("### S3");
    assert.ok(hasS3, "SKILL.md must contain S3 外部调研 section");
  });

  test("S3 mentions muyu-search-mcp", () => {
    const content = readSkill();
    assert.ok(
      content.includes("muyu-search-mcp") || content.includes("muyu"),
      "S3 must mention muyu-search-mcp as one of the two research paths"
    );
  });

  test("S3 mentions anysearch", () => {
    const content = readSkill();
    assert.ok(
      content.includes("anysearch"),
      "S3 must mention anysearch as the second research path"
    );
  });

  test("S3 lite skips with skip event", () => {
    const content = readSkill();
    const hasSkip = content.includes("skipped: scope=lite");
    assert.ok(hasSkip, "S3 must record skip event when scope=lite");
  });

  test("S3 muyu requires extra_sources 3", () => {
    const content = readSkill();
    assert.ok(
      content.includes("extra_sources") || content.includes("extra_sources 3"),
      "S3 muyu call must pass extra_sources 3 (FR-RESEARCH-01)"
    );
  });

  test("S3 dual-empty records dual_research_empty flag (FR-RESEARCH-03)", () => {
    const content = readSkill();
    assert.ok(
      content.includes("dual_research_empty"),
      "S3 must record dual_research_empty when both paths return empty (FR-RESEARCH-03)"
    );
  });

  test("S3 dual-empty writes artifacts file with dual_research_empty:true (FR-RESEARCH-03)", () => {
    const content = readSkill();
    // spec.md:130 requires artifacts record dual_research_empty:true, not only journal
    const hasDualEmptyArtifact =
      content.includes("make-decision-dual-research-empty.md") ||
      (content.includes("artifacts") && content.includes("dual_research_empty: true"));
    assert.ok(
      hasDualEmptyArtifact,
      "S3 dual-empty stop flow must write an artifacts file containing dual_research_empty: true (FR-RESEARCH-03)"
    );
  });

  test("S3 dual-empty stops flow — does not synthesize summary (FR-RESEARCH-03)", () => {
    const content = readSkill();
    // Find the dual_research_empty branch text
    const dualEmptyIdx = content.indexOf("dual_research_empty");
    assert.ok(dualEmptyIdx !== -1, "dual_research_empty must appear in S3");
    // The section around dual_research_empty must contain stop/report/wait semantics
    const window = content.slice(Math.max(0, dualEmptyIdx - 200), dualEmptyIdx + 800);
    const hasStop = window.includes("停止") || window.includes("stop") || window.includes("不得进入") || window.includes("halt");
    const hasReport = window.includes("向用户报告") || window.includes("report") || window.includes("告知用户");
    const hasWait = window.includes("等待指令") || window.includes("等用户") || window.includes("显式") || window.includes("explicit");
    assert.ok(
      hasStop,
      "S3 dual_research_empty branch must contain stop semantics (停止/stop/不得进入/halt)"
    );
    assert.ok(
      hasReport,
      "S3 dual_research_empty branch must contain report-to-user semantics (向用户报告/report/告知用户)"
    );
    assert.ok(
      hasWait,
      "S3 dual_research_empty branch must contain wait-for-instruction semantics (等待指令/显式/explicit)"
    );
  });

  test("S3 summary synthesis only runs when not dual-empty (FR-RESEARCH-03)", () => {
    const content = readSkill();
    // The summary write step must be conditional — it must NOT appear as an unconditional
    // step that follows dual_research_empty without a guard.
    // We check that the synthesis line (external-research-summary) is NOT placed
    // as an unconditional sibling after the dual_research_empty stop block.
    // Specifically: the dual_research_empty stop branch must precede the summary step
    // with a guard (conditional marker, else/otherwise, or the summary step must
    // only appear in a non-dual-empty branch).
    const dualEmptyIdx = content.indexOf("dual_research_empty");
    const summaryIdx = content.indexOf("external-research-summary");
    assert.ok(dualEmptyIdx !== -1, "dual_research_empty must exist");
    assert.ok(summaryIdx !== -1, "external-research-summary must exist in S3");
    // The stop/wait block around dual_research_empty must come BEFORE any
    // unconditional summary synthesis, and there must be a conditional guard
    // separating them (not/only-if/否则/非双路空 language, or summary placed in else branch).
    const between = content.slice(dualEmptyIdx, summaryIdx);
    const hasGuard =
      between.includes("否则") ||
      between.includes("非双路空") ||
      between.includes("only if") ||
      between.includes("only when") ||
      between.includes("如果") ||
      between.includes("若") ||
      between.includes("不为空") ||
      between.includes("至少一路") ||
      between.includes("else") ||
      between.includes("not both empty") ||
      between.includes("条件") ||
      between.includes("仅在") ||
      between.includes("only");
    assert.ok(
      hasGuard,
      "S3 summary synthesis (external-research-summary) must be guarded — only runs when not dual-empty"
    );
  });
});

// T010: S4 section
describe("T010: SKILL.md — S4 方向收敛 talk#2", () => {
  test("S4 section header exists", () => {
    const content = readSkill();
    const hasS4 =
      content.includes("## S4") ||
      content.includes("S4 ") ||
      content.includes("S4:") ||
      content.includes("### S4");
    assert.ok(hasS4, "SKILL.md must contain S4 section");
  });

  test("S4 journal event s4_baseline_recorded", () => {
    const content = readSkill();
    assert.ok(
      content.includes("s4_baseline_recorded"),
      "S4 must record journal event s4_baseline_recorded"
    );
  });

  test("S4 produces make-decision-original-context.md (ledger render point 1)", () => {
    const content = readSkill();
    assert.ok(
      content.includes("make-decision-original-context.md"),
      "S4 must produce tasks/{task-id}/artifacts/make-decision-original-context.md (FR-LEDGER-01 render point 1)"
    );
  });

  test("S4 asks Q2 to converge direction", () => {
    const content = readSkill();
    const hasQ2 =
      content.includes("Q2") ||
      (content.includes("S4") && content.includes("收敛")) ||
      (content.includes("S4") && content.includes("方向"));
    assert.ok(hasQ2, "S4 must ask Q2 to converge direction");
  });
});

// T002(d): AGENT_TEAMS controls debate mode (not S1), REVIEW_DISPATCH_CONFIG file-path + dispatch_config_invalid
describe("T002(d): env var semantic alignment — AGENT_TEAMS/REVIEW_DISPATCH_CONFIG", () => {
  test("CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS controls debate 五方法庭/单人三档 mode", () => {
    const content = readSkill();
    // The env var description must tie AGENT_TEAMS to debate mode (五方法庭 or 单人三档)
    const hasFivePanel =
      content.includes("五方法庭") || content.includes("five-panel") || content.includes("debate.*五方法庭");
    const hasSingleMode =
      content.includes("单人三档") || content.includes("single.*three") || content.includes("单人");
    assert.ok(
      hasFivePanel || hasSingleMode,
      "SKILL.md must describe AGENT_TEAMS controlling debate 五方法庭/单人三档 mode"
    );
  });

  test("CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS does NOT control S1 research mode", () => {
    const content = readSkill();
    const s1Idx = content.indexOf("## S1");
    assert.ok(s1Idx !== -1, "SKILL.md must contain S1 section");
    const s1Section = content.slice(s1Idx, s1Idx + 3000);
    // S1 must NOT reference AGENT_TEAMS for mode selection
    assert.ok(
      !s1Section.includes("CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS"),
      "S1 must NOT read CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS to choose mode; S1 uses runtime teams capability detection"
    );
  });

  test("S1 mode selection uses runtime capability detection (not AGENT_TEAMS)", () => {
    const content = readSkill();
    const s1Idx = content.indexOf("## S1");
    const s1Section = content.slice(s1Idx, s1Idx + 3000);
    const hasRuntimeDetection =
      s1Section.includes("运行时") ||
      s1Section.includes("runtime") ||
      s1Section.includes("teams 能力") ||
      s1Section.includes("自动判定");
    assert.ok(
      hasRuntimeDetection,
      "S1 mode selection must use runtime teams capability detection (not env var)"
    );
  });

  test("REVIEW_DISPATCH_CONFIG accepts config file path (not JSON string)", () => {
    const content = readSkill();
    // The env table must describe REVIEW_DISPATCH_CONFIG as accepting a file path
    const reviewIdx = content.indexOf("REVIEW_DISPATCH_CONFIG");
    assert.ok(reviewIdx !== -1, "SKILL.md must mention REVIEW_DISPATCH_CONFIG");
    const window = content.slice(reviewIdx, reviewIdx + 400);
    const hasFilePath =
      window.includes("文件路径") ||
      window.includes("file path") ||
      window.includes("配置文件路径") ||
      window.includes("/path/to");
    assert.ok(hasFilePath, "REVIEW_DISPATCH_CONFIG must document config file path semantics (not JSON string)");
  });

  test("REVIEW_DISPATCH_CONFIG invalid path records dispatch_config_invalid", () => {
    const content = readSkill();
    assert.ok(
      content.includes("dispatch_config_invalid"),
      "SKILL.md must document dispatch_config_invalid event when REVIEW_DISPATCH_CONFIG path is unreachable"
    );
  });

  test("REVIEW_DISPATCH_CONFIG empty default uses built-in dispatch", () => {
    const content = readSkill();
    const reviewIdx = content.indexOf("REVIEW_DISPATCH_CONFIG");
    assert.ok(reviewIdx !== -1, "SKILL.md must mention REVIEW_DISPATCH_CONFIG");
    const window = content.slice(reviewIdx, reviewIdx + 400);
    // Default must NOT be `{}` JSON literal; must describe empty/default-dispatch semantics
    const hasEmptyDefault =
      window.includes("空") ||
      window.includes("内置默认") ||
      window.includes("走内置") ||
      window.includes("default");
    assert.ok(hasEmptyDefault, "REVIEW_DISPATCH_CONFIG default must be empty (use built-in dispatch), not {} JSON string");
    // Explicitly ensure the old {} default is not used
    const windowBeforeNextPipe = window.split("|")[0] + (window.split("|")[1] || "");
    // The description right after REVIEW_DISPATCH_CONFIG in the table must not say `{}` as default
    const hasJsonDefault = window.slice(0, 80).includes("| `{}`") || window.slice(0, 80).includes("| {}");
    assert.ok(!hasJsonDefault, "REVIEW_DISPATCH_CONFIG must NOT have `{}` as documented default in env table");
  });

  test("MAKE_DECISION_DEBATE_PATH unreachable records debate_path_invalid (not debate_path_unavailable)", () => {
    const content = readSkill();
    assert.ok(
      content.includes("debate_path_invalid"),
      "SKILL.md must record event 'debate_path_invalid' when MAKE_DECISION_DEBATE_PATH is unreachable"
    );
    assert.ok(
      !content.includes("debate_path_unavailable"),
      "SKILL.md must NOT use old event name 'debate_path_unavailable' — use 'debate_path_invalid'"
    );
  });
});

// T003: reuse-registry.md contains debate external skill entry
describe("T003: reuse-registry.md — debate external skill entry", () => {
  test("reuse-registry.md mentions 'debate' skill", () => {
    const content = readRegistry();
    assert.ok(
      content.includes("debate"),
      "reuse-registry.md must contain a debate skill entry"
    );
  });

  test("debate entry contains MAKE_DECISION_DEBATE_PATH variable name", () => {
    const content = readRegistry();
    assert.ok(
      content.includes("MAKE_DECISION_DEBATE_PATH"),
      "reuse-registry.md debate entry must reference MAKE_DECISION_DEBATE_PATH"
    );
  });

  test("debate entry contains default path", () => {
    const content = readRegistry();
    // default path should include a recognizable path pattern
    const hasDefaultPath =
      content.includes("skills/debate") ||
      content.includes("debate/SKILL.md") ||
      content.includes("默认路径") ||
      content.includes("default path") ||
      content.includes("~/.claude") ||
      content.includes("packages/");
    assert.ok(
      hasDefaultPath,
      "reuse-registry.md debate entry must specify a default path"
    );
  });

  // FR-DEBATE-03 (spec.md:52): debate 外部源默认路径必须是 /Users/Hugh/Hugh/Project/debate
  test("debate entry default path is /Users/Hugh/Hugh/Project/debate", () => {
    const content = readRegistry();
    assert.ok(
      content.includes("/Users/Hugh/Hugh/Project/debate"),
      "reuse-registry.md debate entry must reference /Users/Hugh/Hugh/Project/debate as default path (FR-DEBATE-03)"
    );
  });

  test("debate entry describes fallback/degradation behavior", () => {
    const content = readRegistry();
    const hasFallback =
      content.includes("降级") ||
      content.includes("fallback") ||
      content.includes("skipped") ||
      content.includes("跳过") ||
      content.includes("不可达") ||
      content.includes("unavailable");
    assert.ok(
      hasFallback,
      "reuse-registry.md debate entry must describe fallback/degradation behavior"
    );
  });
});

// ─── Phase 3: S5/S6/S7 护城河动作 assertions (T011–T013) ──────────────────────

// T011: S5 三角度异源盲审 + 第一次 debate 门控
describe("T011: SKILL.md — S5 三角度异源盲审 + debate 门控", () => {
  test("S5 section header exists", () => {
    const content = readSkill();
    const hasS5 =
      content.includes("## S5") ||
      content.includes("S5 ") ||
      content.includes("S5:") ||
      content.includes("### S5");
    assert.ok(hasS5, "SKILL.md must contain S5 section");
  });

  test("S5 runs three parallel independent 3rd-review chains", () => {
    const content = readSkill();
    const hasThreeReview =
      content.includes("intake-direction-review") &&
      content.includes("intake-framing-challenge") &&
      content.includes("intake-scope-review");
    assert.ok(hasThreeReview, "S5 must mention all three parallel review chains: intake-direction-review, intake-framing-challenge, intake-scope-review");
  });

  test("S5 requires three agent inputs to be mutually isolated", () => {
    const content = readSkill();
    const hasIsolation =
      content.includes("隔离") ||
      content.includes("互不可见") ||
      content.includes("isolated") ||
      content.includes("inputs mutually invisible");
    assert.ok(hasIsolation, "S5 must require three agent inputs to be mutually isolated (互不可见)");
  });

  test("S5 review result contains reviewer_runtime_id field", () => {
    const content = readSkill();
    assert.ok(
      content.includes("reviewer_runtime_id"),
      "S5 review result must contain reviewer_runtime_id field"
    );
  });

  test("S5 review result contains reviewer_source field", () => {
    const content = readSkill();
    assert.ok(
      content.includes("reviewer_source"),
      "S5 review result must contain reviewer_source field"
    );
  });

  test("S5 review result contains source_family field", () => {
    const content = readSkill();
    assert.ok(
      content.includes("source_family"),
      "S5 review result must contain source_family field"
    );
  });

  test("S5 requires three source_family values to be pairwise distinct", () => {
    const content = readSkill();
    const hasPairwiseDistinct =
      content.includes("两两不同") ||
      content.includes("pairwise distinct") ||
      content.includes("三个 source_family 两两不同") ||
      content.includes("source_family 两两不同");
    assert.ok(hasPairwiseDistinct, "S5 must require three source_family values to be pairwise distinct (两两不同)");
  });

  test("S5 review result contains fallback_used field", () => {
    const content = readSkill();
    assert.ok(
      content.includes("fallback_used"),
      "S5 review result must contain fallback_used field"
    );
  });

  test("S5 review result contains input_hash field", () => {
    const content = readSkill();
    assert.ok(
      content.includes("input_hash"),
      "S5 review result must contain input_hash field"
    );
  });

  test("S5 output contains direction_divergence marker", () => {
    const content = readSkill();
    assert.ok(
      content.includes("direction_divergence"),
      "S5 output must contain direction_divergence marker"
    );
  });

  test("S5 output contains findings list", () => {
    const content = readSkill();
    assert.ok(
      content.includes("findings"),
      "S5 output must contain findings list"
    );
  });

  test("S5 blocking 留痕 uses fixed three-line format: 反对 X / 决定 Y / 理由 Z", () => {
    const content = readSkill();
    const hasFormat =
      (content.includes("反对") && content.includes("决定") && content.includes("理由")) ||
      content.includes("反对 X / 决定 Y / 理由 Z") ||
      content.includes("反对 X / 决定 Y / 理由 Z；缺则留痕不完整");
    assert.ok(hasFormat, "S5 blocking 留痕 must use fixed three-line format: 反对 X / 决定 Y / 理由 Z");
  });

  test("S5 blocking 留痕 incomplete must be completed before S10", () => {
    const content = readSkill();
    const s5Idx = content.indexOf("## S5");
    assert.ok(s5Idx !== -1, "SKILL.md must contain S5 section");
    const s5Section = content.slice(s5Idx, s5Idx + 3000);
    // Must assert the actual required phrases: "S10 落盘前须补全" + "incomplete blocking 留痕"
    const hasBeforeS10 = s5Section.includes("S10 落盘前须补全") || s5Section.includes("S10 落盘前完成");
    const hasIncomplete = s5Section.includes("incomplete blocking 留痕") || s5Section.includes("留痕不完整");
    assert.ok(
      hasBeforeS10,
      "S5 must state incomplete blocking 留痕 must be supplemented before S10 (phrase: 'S10 落盘前须补全' or 'S10 落盘前完成')"
    );
    assert.ok(
      hasIncomplete,
      "S5 must describe the incomplete blocking 留痕 consequence (phrase: 'incomplete blocking 留痕' or '留痕不完整')"
    );
  });

  test("S5 fallback_used:true causes that angle to fail, stops merging, reports to user", () => {
    const content = readSkill();
    const s5Idx = content.indexOf("## S5");
    assert.ok(s5Idx !== -1, "SKILL.md must contain S5 section");
    const s5Section = content.slice(s5Idx, s5Idx + 4000);
    // Must assert all required failure semantics, not just field presence
    const hasFallbackField =
      s5Section.includes("fallback_used:true") ||
      s5Section.includes("fallback_used: true");
    const hasAngleFail =
      s5Section.includes("视为该角度审查失败") ||
      s5Section.includes("角度审查失败") ||
      s5Section.includes("angle failure");
    const hasMergeStop =
      s5Section.includes("结果不进合并") ||
      s5Section.includes("停止合并") ||
      s5Section.includes("stops merging");
    const hasUserReport =
      s5Section.includes("立即停下报告用户") ||
      s5Section.includes("报告用户") ||
      s5Section.includes("reports to user");
    const hasNoSilentDowngrade =
      s5Section.includes("禁止静默降级") ||
      s5Section.includes("no silent downgrade");
    assert.ok(hasFallbackField, "S5 must mention fallback_used:true field");
    assert.ok(hasAngleFail, "S5 must state fallback_used:true causes that angle to fail (视为该角度审查失败)");
    assert.ok(hasMergeStop, "S5 must state angle failure stops merging (结果不进合并)");
    assert.ok(hasUserReport, "S5 must state failure is reported to user immediately (立即停下报告用户)");
    assert.ok(hasNoSilentDowngrade, "S5 must prohibit silent downgrade (禁止静默降级)");
  });

  test("S5 same source_family causes angle failure (no silent downgrade)", () => {
    const content = readSkill();
    const hasNoSilentDowngrade =
      content.includes("禁止静默降级") ||
      content.includes("no silent downgrade") ||
      (content.includes("source_family") && content.includes("相同"));
    assert.ok(hasNoSilentDowngrade, "S5 must prohibit silent downgrade when source_family clash");
  });

  test("S5 debate gate: delegates trigger decision to debate skill (not inline self-judgement)", () => {
    const content = readSkill();
    const s5Idx = content.indexOf("## S5");
    assert.ok(s5Idx !== -1, "SKILL.md must contain S5 section");
    const s5Section = content.slice(s5Idx, s5Idx + 5000);
    // Must mention delegation to debate skill (not inline self-judgement)
    const hasDelegation =
      s5Section.includes("委托 debate 技能") ||
      s5Section.includes("delegate") ||
      (s5Section.includes("debate 技能") && s5Section.includes("判断"));
    assert.ok(hasDelegation, "S5 debate gate must delegate trigger decision to debate skill, not use inline self-judgement");
    // Must NOT contain the old inline trigger conditions (条件A/B / direction_divergence → debate)
    const hasInlineTrigger =
      s5Section.includes("条件A") ||
      s5Section.includes("条件B") ||
      s5Section.includes("direction_divergence.*debate") ||
      (s5Section.includes("> 2 条") && s5Section.includes("blocking"));
    assert.ok(!hasInlineTrigger, "S5 debate gate must NOT use inline trigger conditions (条件A/B removed)");
  });

  test("S5 debate gate: triggered output goes to tasks/{task-id}/artifacts/make-decision-debate-1.md", () => {
    const content = readSkill();
    assert.ok(
      content.includes("make-decision-debate-1.md"),
      "S5 debate gate must produce tasks/{task-id}/artifacts/make-decision-debate-1.md when triggered"
    );
  });

  test("S5 debate gate: not triggered records debate_1: skipped", () => {
    const content = readSkill();
    assert.ok(
      content.includes("debate_1: skipped") || content.includes("debate_1:skipped"),
      "S5 must record debate_1: skipped when debate not triggered"
    );
  });

  test("S5 debate gate: path unreachable records reason and degrades gracefully", () => {
    const content = readSkill();
    const hasPathUnreachable =
      content.includes("路径不可达") ||
      content.includes("path unreachable") ||
      (content.includes("不可达") && content.includes("降级继续"));
    assert.ok(hasPathUnreachable, "S5 must record reason and degrade gracefully when debate path unreachable");
  });

  test("S5 depends on make-decision-original-context.md existing", () => {
    const content = readSkill();
    assert.ok(
      content.includes("make-decision-original-context.md"),
      "S5 must depend on tasks/{task-id}/artifacts/make-decision-original-context.md existing"
    );
  });
});

// T012: S6 展示盲审/debate 结果给用户
describe("T012: SKILL.md — S6 展示盲审/debate 结果", () => {
  test("S6 section header exists", () => {
    const content = readSkill();
    const hasS6 =
      content.includes("## S6") ||
      content.includes("S6 ") ||
      content.includes("S6:") ||
      content.includes("### S6");
    assert.ok(hasS6, "SKILL.md must contain S6 section");
  });

  test("S6 is an independent display step", () => {
    const content = readSkill();
    const hasIndependent =
      content.includes("独立展示") ||
      content.includes("独立展示步骤") ||
      (content.includes("S6") && content.includes("独立"));
    assert.ok(hasIndependent, "S6 must be an independent display step (独立展示步骤)");
  });

  test("S6 shows three-angle blind review findings summary to user", () => {
    const content = readSkill();
    const hasFindings =
      (content.includes("S6") && content.includes("三角度") && content.includes("findings")) ||
      (content.includes("S6") && content.includes("盲审") && content.includes("findings")) ||
      content.includes("三角度盲审 findings 摘要");
    assert.ok(hasFindings, "S6 must show three-angle blind review findings summary to user");
  });

  test("S6 shows direction_divergence status", () => {
    const content = readSkill();
    // S6 must display direction_divergence — already checked it exists in S5, here check S6 shows it
    const idx6 = content.indexOf("## S6");
    const hasS6DivShow = idx6 !== -1 && content.slice(idx6).includes("direction_divergence");
    assert.ok(hasS6DivShow, "S6 must display direction_divergence status to user");
  });

  test("S6 shows debate verdict or skip reason", () => {
    const content = readSkill();
    const idx6 = content.indexOf("## S6");
    const s6Section = idx6 !== -1 ? content.slice(idx6, idx6 + 2000) : "";
    const hasDebateResult =
      s6Section.includes("debate") ||
      s6Section.includes("裁决") ||
      s6Section.includes("skip") ||
      s6Section.includes("skipped");
    assert.ok(hasDebateResult, "S6 must show debate verdict or skip reason");
  });

  test("S6 records journal event s6_results_shown", () => {
    const content = readSkill();
    assert.ok(
      content.includes("s6_results_shown"),
      "S6 must record journal event s6_results_shown"
    );
  });

  test("S6 does not wait for user confirmation before continuing", () => {
    const content = readSkill();
    const idx6 = content.indexOf("## S6");
    const s6Section = idx6 !== -1 ? content.slice(idx6, idx6 + 2000) : "";
    const hasNoWait =
      s6Section.includes("不等确认") ||
      s6Section.includes("展示完即继续") ||
      s6Section.includes("no wait") ||
      s6Section.includes("continue immediately");
    assert.ok(hasNoWait, "S6 must not wait for user confirmation before continuing (展示完即继续)");
  });
});

// T013: S7 talk#3 → grill → draft → orchestrator → debate-2
describe("T013: SKILL.md — S7 talk#3 → grill → draft → orchestrator → debate-2", () => {
  test("S7 section header exists", () => {
    const content = readSkill();
    const hasS7 =
      content.includes("## S7") ||
      content.includes("S7 ") ||
      content.includes("S7:") ||
      content.includes("### S7");
    assert.ok(hasS7, "SKILL.md must contain S7 section");
  });

  test("S7 executes steps in strict order: talk#3 → grill → draft → orchestrator", () => {
    const content = readSkill();
    const idx7 = content.indexOf("## S7");
    const s7Section = idx7 !== -1 ? content.slice(idx7, idx7 + 5000) : "";
    const talk3Idx = s7Section.indexOf("talk#3");
    const grillIdx = s7Section.indexOf("grill");
    const draftIdx = s7Section.indexOf("draft");
    const orchIdx = s7Section.indexOf("orchestrator");
    assert.ok(talk3Idx !== -1, "S7 must contain talk#3");
    assert.ok(grillIdx !== -1, "S7 must contain grill");
    assert.ok(draftIdx !== -1, "S7 must contain draft");
    assert.ok(orchIdx !== -1, "S7 must contain orchestrator");
    assert.ok(talk3Idx < grillIdx, "S7 talk#3 must come before grill");
    assert.ok(grillIdx < draftIdx, "S7 grill must come before draft");
    assert.ok(draftIdx < orchIdx, "S7 draft must come before orchestrator");
  });

  test("S7 talk#3 sorts questions Q3 by impact", () => {
    const content = readSkill();
    const idx7 = content.indexOf("## S7");
    const s7Section = idx7 !== -1 ? content.slice(idx7, idx7 + 5000) : "";
    const hasQ3Impact =
      s7Section.includes("Q3") &&
      (s7Section.includes("按影响排序") || s7Section.includes("impact") || s7Section.includes("排序"));
    assert.ok(hasQ3Impact, "S7 talk#3 must sort questions Q3 by impact (按影响排序)");
  });

  test("S7 talk#3 depends on S5/S6 outputs", () => {
    const content = readSkill();
    const idx7 = content.indexOf("## S7");
    const s7Section = idx7 !== -1 ? content.slice(idx7, idx7 + 5000) : "";
    const hasDependency =
      s7Section.includes("S5") ||
      s7Section.includes("S6") ||
      (s7Section.includes("talk#3") && s7Section.includes("依赖"));
    assert.ok(hasDependency, "S7 talk#3 must depend on S5/S6 outputs");
  });

  test("S7 talk#3 must not execute before S7", () => {
    const content = readSkill();
    const idx7 = content.indexOf("## S7");
    const s7Section = idx7 !== -1 ? content.slice(idx7, idx7 + 5000) : "";
    const hasNotBefore =
      s7Section.includes("不得在 S7 之前执行") ||
      s7Section.includes("must not execute before S7") ||
      s7Section.includes("S7 之前");
    assert.ok(hasNotBefore, "S7 must state talk#3 must not execute before S7");
  });

  test("S7 grill delegates to grill-with-docs-lite (pure delegation)", () => {
    const content = readSkill();
    assert.ok(
      content.includes("grill-with-docs-lite"),
      "S7 grill step must delegate to grill-with-docs-lite"
    );
  });

  test("S7 grill produces make-decision-grill-with-docs.md", () => {
    const content = readSkill();
    assert.ok(
      content.includes("make-decision-grill-with-docs.md"),
      "S7 grill must produce tasks/{task-id}/artifacts/make-decision-grill-with-docs.md"
    );
  });

  test("S7 draft produces make-decision-decision-log-draft.md", () => {
    const content = readSkill();
    assert.ok(
      content.includes("make-decision-decision-log-draft.md"),
      "S7 draft must produce tasks/{task-id}/artifacts/make-decision-decision-log-draft.md"
    );
  });

  test("S7 draft contains 7 sections (原始需求/问题与目标/决策/假设/明确不做/开放问题/验收标准)", () => {
    const content = readSkill();
    const idx7 = content.indexOf("## S7");
    const s7Section = idx7 !== -1 ? content.slice(idx7, idx7 + 6000) : "";
    const has1 = s7Section.includes("原始需求");
    const has2 = s7Section.includes("问题与目标");
    const has3 = s7Section.includes("决策");
    const has4 = s7Section.includes("假设");
    const has5 = s7Section.includes("明确不做");
    const has6 = s7Section.includes("开放问题");
    const has7 = s7Section.includes("验收标准");
    assert.ok(has1, "S7 draft must include section: 原始需求");
    assert.ok(has2, "S7 draft must include section: 问题与目标");
    assert.ok(has3, "S7 draft must include section: 决策");
    assert.ok(has4, "S7 draft must include section: 假设");
    assert.ok(has5, "S7 draft must include section: 明确不做");
    assert.ok(has6, "S7 draft must include section: 开放问题");
    assert.ok(has7, "S7 draft must include section: 验收标准");
  });

  test("S7 draft body references make-decision-grill-with-docs.md path", () => {
    const content = readSkill();
    const idx7 = content.indexOf("## S7");
    const s7Section = idx7 !== -1 ? content.slice(idx7, idx7 + 6000) : "";
    assert.ok(
      s7Section.includes("make-decision-grill-with-docs.md"),
      "S7 draft must reference make-decision-grill-with-docs.md path in draft body"
    );
  });

  test("S7 orchestrator blocking triggers debate-2, attaches to draft ## orchestrator-findings", () => {
    const content = readSkill();
    const idx7 = content.indexOf("## S7");
    const s7Section = idx7 !== -1 ? content.slice(idx7, idx7 + 6000) : "";
    const hasOrchestratorFindings =
      s7Section.includes("orchestrator-findings") ||
      s7Section.includes("## orchestrator-findings");
    assert.ok(hasOrchestratorFindings, "S7 orchestrator blocking must attach findings to ## orchestrator-findings section of draft");
  });

  test("S7 orchestrator blocking triggers debate-2 output: make-decision-debate-2.md", () => {
    const content = readSkill();
    assert.ok(
      content.includes("make-decision-debate-2.md"),
      "S7 orchestrator blocking must produce make-decision-debate-2.md"
    );
  });

  test("S7 orchestrator blocking does not overwrite draft body", () => {
    const content = readSkill();
    const idx7 = content.indexOf("## S7");
    const s7Section = idx7 !== -1 ? content.slice(idx7, idx7 + 6000) : "";
    const hasNoOverwrite =
      s7Section.includes("不覆盖正文") ||
      s7Section.includes("does not overwrite") ||
      s7Section.includes("不覆盖");
    assert.ok(hasNoOverwrite, "S7 orchestrator debate-2 findings must not overwrite draft body");
  });

  test("S7 journal event s7_talk3_done", () => {
    const content = readSkill();
    assert.ok(content.includes("s7_talk3_done"), "S7 must record journal event s7_talk3_done");
  });

  test("S7 journal event s7_grill_done", () => {
    const content = readSkill();
    assert.ok(content.includes("s7_grill_done"), "S7 must record journal event s7_grill_done");
  });

  test("S7 journal event s7_draft_complete", () => {
    const content = readSkill();
    assert.ok(content.includes("s7_draft_complete"), "S7 must record journal event s7_draft_complete");
  });

  test("S7 journal event debate_2_triggered or debate_2_skipped", () => {
    const content = readSkill();
    const hasDebate2Event =
      content.includes("debate_2_triggered") ||
      content.includes("debate_2_skipped");
    assert.ok(hasDebate2Event, "S7 must record journal event debate_2_triggered or debate_2_skipped");
  });

  test("S7 debate-2 delegates unconditionally to debate skill (no inline blocking check)", () => {
    const content = readSkill();
    const idx7 = content.indexOf("## S7");
    const s7Section = idx7 !== -1 ? content.slice(idx7, idx7 + 6000) : "";
    // S7 must NOT use blocking presence to decide whether to call debate
    const hasInlineBlockingGate =
      s7Section.includes("若有 blocking 意见") ||
      s7Section.includes("若无 blocking");
    assert.ok(
      !hasInlineBlockingGate,
      "S7 must NOT gate debate-2 on blocking presence — delegate unconditionally to debate skill Step 1"
    );
    // S7 must still SKIP on MAKE_DECISION_SKIP_DEBATE=1 or unreachable path
    const hasSkipDebate = s7Section.includes("MAKE_DECISION_SKIP_DEBATE");
    const hasPathCheck = s7Section.includes("MAKE_DECISION_DEBATE_PATH");
    assert.ok(hasSkipDebate, "S7 debate-2 gate must still handle MAKE_DECISION_SKIP_DEBATE");
    assert.ok(hasPathCheck, "S7 debate-2 gate must still handle MAKE_DECISION_DEBATE_PATH reachability");
  });

  test("S7 debate-2 reads verdict from debate skill (not make-decision self-judgment)", () => {
    const content = readSkill();
    const idx7 = content.indexOf("## S7");
    const s7Section = idx7 !== -1 ? content.slice(idx7, idx7 + 6000) : "";
    const delegatesToDebate =
      s7Section.includes("debate 技能") ||
      s7Section.includes("debate skill") ||
      s7Section.includes("调用 debate");
    assert.ok(
      delegatesToDebate,
      "S7 must delegate to debate skill for trigger judgment, not self-judge based on blocking"
    );
    // Must still produce/reference make-decision-debate-2.md
    assert.ok(
      s7Section.includes("make-decision-debate-2.md"),
      "S7 debate-2 must reference artifact make-decision-debate-2.md"
    );
  });
});

// ─── Phase 4: S8/S9/S10 + journal completeness (T014–T017) ──────────────────

// T014: S8 台账渲染点② + CONTEXT 同步
describe("T014: SKILL.md S8 台账渲染点② + CONTEXT 同步", () => {
  test("S8 section header exists", () => {
    const content = readSkill();
    const hasS8 =
      content.includes("## S8") ||
      content.includes("S8 台账") ||
      content.includes("S8: 台账") ||
      content.includes("### S8");
    assert.ok(hasS8, "SKILL.md must contain S8 section");
  });

  test("S8 mentions ledger render point 2 (台账渲染点②)", () => {
    const content = readSkill();
    const idx8 = content.indexOf("## S8");
    const s8Section = idx8 !== -1 ? content.slice(idx8, idx8 + 3000) : "";
    const hasRender2 =
      s8Section.includes("渲染点②") ||
      s8Section.includes("渲染点2") ||
      s8Section.includes("render point 2") ||
      s8Section.includes("台账渲染");
    assert.ok(hasRender2, "S8 must mention ledger render point 2 (台账渲染点②)");
  });

  test("S8 requires no '状态未知' entries in ledger (FR-LEDGER-02)", () => {
    const content = readSkill();
    const idx8 = content.indexOf("## S8");
    const s8Section = idx8 !== -1 ? content.slice(idx8, idx8 + 3000) : "";
    const hasNoUnknown =
      s8Section.includes("状态未知") ||
      s8Section.includes("FR-LEDGER-02") ||
      s8Section.includes("驳回理由") ||
      s8Section.includes("禁静默丢弃");
    assert.ok(hasNoUnknown, "S8 must enforce no '状态未知' entries and require rejection reasons (FR-LEDGER-02)");
  });

  test("S8 new-idea backtrack produces candidate list (FR-LEDGER-03)", () => {
    const content = readSkill();
    const idx8 = content.indexOf("## S8");
    const s8Section = idx8 !== -1 ? content.slice(idx8, idx8 + 3000) : "";
    const hasFR03 =
      s8Section.includes("FR-LEDGER-03") ||
      s8Section.includes("新想法") ||
      (s8Section.includes("候选列表") && s8Section.includes("回退"));
    assert.ok(hasFR03, "S8 must produce new-idea candidate list and route via backtrack path (FR-LEDGER-03)");
  });

  test("S8 syncs CONTEXT.md, ADR, project-memory.json", () => {
    const content = readSkill();
    const idx8 = content.indexOf("## S8");
    const s8Section = idx8 !== -1 ? content.slice(idx8, idx8 + 3000) : "";
    const hasSync =
      s8Section.includes("CONTEXT.md") &&
      s8Section.includes("ADR") &&
      s8Section.includes("project-memory.json");
    assert.ok(hasSync, "S8 must sync CONTEXT.md, ADR, and project-memory.json");
  });

  test("S8 journal event s8_context_synced or s8_context_no_change", () => {
    const content = readSkill();
    const hasS8Journal =
      content.includes("s8_context_synced") ||
      content.includes("s8_context_no_change");
    assert.ok(hasS8Journal, "S8 must record journal event s8_context_synced or s8_context_no_change");
  });
});

// T015: S9 用户批准（唯一硬门）
describe("T015: SKILL.md S9 用户批准（唯一硬门）", () => {
  test("S9 section header exists", () => {
    const content = readSkill();
    const hasS9 =
      content.includes("## S9") ||
      content.includes("S9 用户") ||
      content.includes("S9: 用户") ||
      content.includes("### S9");
    assert.ok(hasS9, "SKILL.md must contain S9 section");
  });

  test("S9 is the only mandatory hard gate in the flow (FR-ACCEPT-02)", () => {
    const content = readSkill();
    const idx9 = content.indexOf("## S9");
    const s9Section = idx9 !== -1 ? content.slice(idx9, idx9 + 3000) : "";
    const hasHardGate =
      s9Section.includes("FR-ACCEPT-02") ||
      s9Section.includes("唯一硬门") ||
      s9Section.includes("唯一强制") ||
      s9Section.includes("hard gate");
    assert.ok(hasHardGate, "S9 must be declared the only mandatory hard gate (FR-ACCEPT-02)");
  });

  test("S9 shows full decision summary with ledger checklist (FR-ACCEPT-03)", () => {
    const content = readSkill();
    const idx9 = content.indexOf("## S9");
    const s9Section = idx9 !== -1 ? content.slice(idx9, idx9 + 3000) : "";
    const hasSummary =
      s9Section.includes("FR-ACCEPT-03") ||
      (s9Section.includes("决策摘要") && s9Section.includes("台账")) ||
      (s9Section.includes("方向") && s9Section.includes("范围") && s9Section.includes("约束"));
    assert.ok(hasSummary, "S9 must display full decision summary including ledger line items (FR-ACCEPT-03)");
  });

  test("S9 waits indefinitely for user explicit approval", () => {
    const content = readSkill();
    const idx9 = content.indexOf("## S9");
    const s9Section = idx9 !== -1 ? content.slice(idx9, idx9 + 3000) : "";
    const hasWait =
      s9Section.includes("无限等待") ||
      s9Section.includes("不得自动通过") ||
      (s9Section.includes("等待") && s9Section.includes("明确"));
    assert.ok(hasWait, "S9 must wait indefinitely for user explicit approval and must not auto-approve");
  });

  test("S9 skipping to S10 is declared an error", () => {
    const content = readSkill();
    const idx9 = content.indexOf("## S9");
    const s9Section = idx9 !== -1 ? content.slice(idx9, idx9 + 3000) : "";
    const hasErrorDecl =
      s9Section.includes("视为错误") ||
      s9Section.includes("错误") ||
      s9Section.includes("error");
    assert.ok(hasErrorDecl, "S9 must explicitly state that skipping S9 directly to S10 is an error");
  });

  test("S9 journal event s9_user_approved: true", () => {
    const content = readSkill();
    const hasS9Journal =
      content.includes("s9_user_approved") &&
      (content.includes("s9_user_approved: true") || content.includes("s9_user_approved:true"));
    assert.ok(hasS9Journal, "S9 must record journal event s9_user_approved: true");
  });
});

// T016: S10 decision-log 落盘 + updateOwnResult
describe("T016: SKILL.md S10 decision-log 落盘 + updateOwnResult", () => {
  test("S10 section header exists", () => {
    const content = readSkill();
    const hasS10 =
      content.includes("## S10") ||
      content.includes("S10 decision") ||
      content.includes("S10: decision") ||
      content.includes("### S10");
    assert.ok(hasS10, "SKILL.md must contain S10 section");
  });

  test("S10 pre-commit check: blocking 留痕 requires three-line format before marking complete", () => {
    const content = readSkill();
    const idx10 = content.indexOf("## S10");
    const s10Section = idx10 !== -1 ? content.slice(idx10, idx10 + 3000) : "";
    const hasPreCheck =
      (s10Section.includes("severity") && s10Section.includes("blocking")) ||
      (s10Section.includes("落盘前") && s10Section.includes("留痕")) ||
      s10Section.includes("落盘完整");
    assert.ok(hasPreCheck, "S10 must check blocking 留痕 completeness before marking decision-log complete");
  });

  test("S10 produces tasks/{task-id}/decision-log.md with user_decision: true", () => {
    const content = readSkill();
    const idx10 = content.indexOf("## S10");
    const s10Section = idx10 !== -1 ? content.slice(idx10, idx10 + 3000) : "";
    const hasOutput =
      s10Section.includes("decision-log.md") &&
      (s10Section.includes("user_decision: true") || s10Section.includes("user_decision:true"));
    assert.ok(hasOutput, "S10 must produce tasks/{task-id}/decision-log.md with user_decision: true");
  });

  test("S10 decision-log has 7 sections structure", () => {
    const content = readSkill();
    const idx10 = content.indexOf("## S10");
    const s10Section = idx10 !== -1 ? content.slice(idx10, idx10 + 3000) : "";
    const has1 = s10Section.includes("原始需求");
    const has2 = s10Section.includes("问题与目标");
    const has3 = s10Section.includes("决策记录") || s10Section.includes("决策");
    const has4 = s10Section.includes("假设");
    const has5 = s10Section.includes("明确不做");
    const has6 = s10Section.includes("开放问题");
    const has7 = s10Section.includes("验收标准");
    assert.ok(has1 && has2 && has3 && has4 && has5 && has6 && has7,
      "S10 decision-log must have 7 sections: 原始需求/问题与目标/决策记录/假设/明确不做/开放问题/验收标准");
  });

  test("S10 decision-log structure contains 执行环境 field", () => {
    const content = readSkill();
    const idx10 = content.indexOf("## S10");
    const s10Section = idx10 !== -1 ? content.slice(idx10, idx10 + 3000) : "";
    assert.ok(
      s10Section.includes("执行环境"),
      "S10 decision-log must include '执行环境' field/section"
    );
  });

  test("S10 decision-log 执行环境 field requires env var detection results", () => {
    const content = readSkill();
    const idx10 = content.indexOf("## S10");
    const s10Section = idx10 !== -1 ? content.slice(idx10, idx10 + 3000) : "";
    const hasEnvDetection =
      s10Section.includes("env var") ||
      s10Section.includes("检测结果") ||
      s10Section.includes("dispatch_config_invalid") ||
      s10Section.includes("debate_path_invalid") ||
      s10Section.includes("runner_invalid");
    assert.ok(
      hasEnvDetection,
      "S10 执行环境 field must document env var detection results (including degradation events like dispatch_config_invalid/debate_path_invalid/runner_invalid)"
    );
  });

  test("S10 calls metrics/collector.mjs updateOwnResult with M4 10 core fields", () => {
    const content = readSkill();
    const idx10 = content.indexOf("## S10");
    const s10Section = idx10 !== -1 ? content.slice(idx10, idx10 + 3000) : "";
    const hasCollector =
      s10Section.includes("collector.mjs") &&
      s10Section.includes("updateOwnResult");
    assert.ok(hasCollector, "S10 must call metrics/collector.mjs updateOwnResult");
  });

  test("S10 collector write failure warns but does not throw", () => {
    const content = readSkill();
    const idx10 = content.indexOf("## S10");
    const s10Section = idx10 !== -1 ? content.slice(idx10, idx10 + 3000) : "";
    const hasWarnNotThrow =
      (s10Section.includes("warn") && s10Section.includes("throw")) ||
      s10Section.includes("写失败 warn 不 throw") ||
      (s10Section.includes("warn") && s10Section.includes("不 throw")) ||
      (s10Section.includes("warn") && s10Section.includes("not throw"));
    assert.ok(hasWarnNotThrow, "S10 collector write failure must warn but not throw");
  });
});

// T017: Journal 事件流规范（S0–S10 全覆盖）
describe("T017: SKILL.md journal event stream S0–S10 complete coverage", () => {
  test("Journal section exists in SKILL.md", () => {
    const content = readSkill();
    const hasJournalSection =
      content.includes("## Journal") ||
      content.includes("## journal") ||
      content.includes("Journal 事件") ||
      content.includes("journal 事件流");
    assert.ok(hasJournalSection, "SKILL.md must contain a Journal event stream section");
  });

  test("Journal section lists s0_ prefixed event", () => {
    const content = readSkill();
    const idx = content.indexOf("## Journal") !== -1 ? content.indexOf("## Journal") : content.indexOf("## journal");
    const journalSection = idx !== -1 ? content.slice(idx, idx + 4000) : content;
    assert.ok(journalSection.includes("s0_"), "Journal section must list s0_ prefixed event");
  });

  test("Journal section lists s1_skipped or s1_ event", () => {
    const content = readSkill();
    const hasS1Event =
      content.includes("s1_skipped") ||
      content.includes("s1: skipped") ||
      content.includes("s1_all_agents_failed") ||
      content.includes("s1_complete");
    assert.ok(hasS1Event, "Journal section must list s1_ journal event");
  });

  test("Journal section lists s3_skipped or s3_ event", () => {
    const content = readSkill();
    const hasS3Event =
      content.includes("s3_skipped") ||
      content.includes("s3: skipped") ||
      content.includes("s3_complete") ||
      content.includes("s3_research");
    assert.ok(hasS3Event, "Journal section must list s3_ journal event");
  });

  test("Journal section covers s4_baseline_recorded", () => {
    const content = readSkill();
    assert.ok(content.includes("s4_baseline_recorded"), "Journal must cover s4_baseline_recorded");
  });

  test("Journal section covers s6_results_shown", () => {
    const content = readSkill();
    assert.ok(content.includes("s6_results_shown"), "Journal must cover s6_results_shown");
  });

  test("Journal section covers s7_draft_complete", () => {
    const content = readSkill();
    assert.ok(content.includes("s7_draft_complete"), "Journal must cover s7_draft_complete");
  });

  test("Journal section covers s8 events", () => {
    const content = readSkill();
    const hasS8 =
      content.includes("s8_context_synced") ||
      content.includes("s8_context_no_change");
    assert.ok(hasS8, "Journal must cover s8 context sync events");
  });

  test("Journal section covers s9_user_approved", () => {
    const content = readSkill();
    assert.ok(content.includes("s9_user_approved"), "Journal must cover s9_user_approved");
  });

  test("Journal section covers s10 event", () => {
    const content = readSkill();
    const hasS10Event =
      content.includes("s10_") ||
      content.includes("s10_decision_log") ||
      content.includes("s10_complete");
    assert.ok(hasS10Event, "Journal must cover s10_ event");
  });

  test("lite-skipped S1 has journal event (skipped: scope=lite)", () => {
    const content = readSkill();
    assert.ok(
      content.includes("skipped: scope=lite") || content.includes("scope=lite"),
      "lite-skipped S1/S3 must have explicit skipped: scope=lite journal event"
    );
  });

  test("Journal section covers s7_talk3_done", () => {
    const content = readSkill();
    assert.ok(content.includes("s7_talk3_done"), "Journal master list must include s7_talent_done");
  });
});

// ─── Phase 4: spec-align-fix assertions (R2 codex findings) ─────────────────

// FIX-01: S5 debate gate — no inline五方/三档 conditions; delegate source-ID judgment to debate
describe("FIX-01: S5 debate gate delegates to debate skill, no inline mode decisions", () => {
  test("S5 debate gate does NOT inline 五方法庭/单人三档 mode selection logic", () => {
    const content = readSkill();
    const s5Idx = content.indexOf("## S5");
    assert.ok(s5Idx !== -1, "SKILL.md must contain S5 section");
    const s5End = content.indexOf("## S6");
    const s5Section = content.slice(s5Idx, s5End !== -1 ? s5End : s5Idx + 8000);
    // S5 must NOT contain inline mode decision like "若=1启用五方" or "若=0降级单人"
    const hasInlineModeLogic =
      s5Section.includes("若=1启用") ||
      s5Section.includes("若 =1 启用") ||
      s5Section.includes("=1 时启用五方") ||
      s5Section.includes("=0 时降级单人") ||
      s5Section.includes("=0时降级");
    assert.ok(
      !hasInlineModeLogic,
      "S5 must NOT inline 五方法庭/单人三档 mode selection — must delegate to debate skill"
    );
  });

  test("S5 debate gate does not self-skip on missing artifact-sourced finding IDs", () => {
    const content = readSkill();
    const s5Idx = content.indexOf("## S5");
    const s5End = content.indexOf("## S6");
    const s5Section = content.slice(s5Idx, s5End !== -1 ? s5End : s5Idx + 8000);
    assert.ok(
      !s5Section.includes("debate_triggered_invalid"),
      "S5 must not self-judge missing finding IDs as debate_triggered_invalid; debate Step 1 owns that judgment"
    );
  });

  test("S5 debate gate passes finding ID list from artifacts to debate skill", () => {
    const content = readSkill();
    const s5Idx = content.indexOf("## S5");
    const s5End = content.indexOf("## S6");
    const s5Section = content.slice(s5Idx, s5End !== -1 ? s5End : s5Idx + 8000);
    const hasIdList =
      s5Section.includes("ID 列表") ||
      s5Section.includes("finding ID") ||
      s5Section.includes("id 列表") ||
      s5Section.includes("争点来源") ||
      s5Section.includes("来源 ID");
    assert.ok(
      hasIdList,
      "S5 debate gate must pass artifact-based finding ID list to debate skill as 争点来源"
    );
  });
});

// FIX-02: AGENT_TEAMS controls debate mode only, not S1
describe("FIX-02: CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS controls debate mode, not S1", () => {
  test("env table CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS says it controls debate mode not S1", () => {
    const content = readSkill();
    // Find the env table row for CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS
    const idx = content.indexOf("CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS");
    assert.ok(idx !== -1, "SKILL.md must mention CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS");
    const window = content.slice(idx, idx + 400);
    const controlsDebate =
      window.includes("debate") &&
      (window.includes("五方法庭") || window.includes("单人三档") || window.includes("debate 技能"));
    assert.ok(
      controlsDebate,
      "env table CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS must state it controls debate mode (五方法庭/单人三档)"
    );
    // Must NOT say it controls S1
    const s1Idx = content.indexOf("## S1");
    assert.ok(s1Idx !== -1, "SKILL.md must contain S1 section");
    const s1Section = content.slice(s1Idx, s1Idx + 3000);
    assert.ok(
      !s1Section.includes("CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS"),
      "S1 section must NOT reference CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS — S1 uses runtime teams capability detection"
    );
  });
});

// FIX-03: REVIEW_DISPATCH_CONFIG is a config file path, failure records dispatch_config_invalid
describe("FIX-03: REVIEW_DISPATCH_CONFIG accepts config file path, failure → dispatch_config_invalid", () => {
  test("REVIEW_DISPATCH_CONFIG env row describes config file path semantics", () => {
    const content = readSkill();
    const idx = content.indexOf("REVIEW_DISPATCH_CONFIG");
    assert.ok(idx !== -1, "SKILL.md must mention REVIEW_DISPATCH_CONFIG");
    const window = content.slice(idx, idx + 500);
    const hasFilePath =
      window.includes("配置文件路径") ||
      window.includes("config file path") ||
      window.includes("文件路径");
    assert.ok(hasFilePath, "REVIEW_DISPATCH_CONFIG must describe config file path semantics (not JSON string)");
  });

  test("REVIEW_DISPATCH_CONFIG failure records dispatch_config_invalid", () => {
    const content = readSkill();
    assert.ok(
      content.includes("dispatch_config_invalid"),
      "SKILL.md must record dispatch_config_invalid when REVIEW_DISPATCH_CONFIG file unreachable or parse fails"
    );
  });

  test("REVIEW_DISPATCH_CONFIG default is empty (not a JSON object {})", () => {
    const content = readSkill();
    const idx = content.indexOf("REVIEW_DISPATCH_CONFIG");
    assert.ok(idx !== -1, "SKILL.md must mention REVIEW_DISPATCH_CONFIG");
    const window = content.slice(idx, idx + 300);
    // Default must be empty/blank, not {}
    const hasJsonObjectDefault =
      window.slice(0, 100).includes("| `{}`") ||
      window.slice(0, 100).includes("| {}");
    assert.ok(!hasJsonObjectDefault, "REVIEW_DISPATCH_CONFIG default must NOT be {} JSON object");
  });
});

// FIX-04: FR-RESEARCH-03 dual-research-empty must truly stop, not silently continue
describe("FIX-04: FR-RESEARCH-03 dual-research-empty — true stop, not false-green", () => {
  test("S3 dual_research_empty stop flow includes artifacts entry dual_research_empty: true", () => {
    const content = readSkill();
    const s3Idx = content.indexOf("## S3");
    assert.ok(s3Idx !== -1, "SKILL.md must contain S3 section");
    const s3Section = content.slice(s3Idx, s3Idx + 4000);
    assert.ok(
      s3Section.includes("dual_research_empty: true"),
      "S3 dual_research_empty stop flow must write artifacts with dual_research_empty: true field"
    );
  });

  test("S3 dual_research_empty stop flow must write s3_dual_research_empty journal event", () => {
    const content = readSkill();
    assert.ok(
      content.includes("s3_dual_research_empty"),
      "S3 dual_research_empty stop flow must write journal event s3_dual_research_empty"
    );
  });

  test("S3 dual_research_empty stop flow must halt and wait for user instruction before S4", () => {
    const content = readSkill();
    const s3Idx = content.indexOf("## S3");
    const s3Section = content.slice(s3Idx, s3Idx + 4000);
    const hasExplicitWait =
      s3Section.includes("等待用户显式指令") ||
      s3Section.includes("用户显式解决前") ||
      (s3Section.includes("不得进入 S4") && s3Section.includes("用户显式"));
    assert.ok(
      hasExplicitWait,
      "S3 dual_research_empty stop flow must require explicit user instruction before S4 — not auto-continue"
    );
  });

  test("S3 summary synthesis is guarded — only runs when not dual-empty", () => {
    const content = readSkill();
    const dualEmptyIdx = content.indexOf("dual_research_empty");
    const summaryIdx = content.indexOf("external-research-summary.md");
    assert.ok(dualEmptyIdx !== -1, "dual_research_empty must exist in S3");
    assert.ok(summaryIdx !== -1, "external-research-summary.md must exist in S3");
    const between = content.slice(dualEmptyIdx, summaryIdx);
    const hasGuard =
      between.includes("仅在非双路空") ||
      between.includes("否则") ||
      between.includes("only if") ||
      between.includes("only when") ||
      between.includes("若") ||
      between.includes("不为空") ||
      between.includes("至少一路") ||
      between.includes("else") ||
      between.includes("条件") ||
      between.includes("仅在");
    assert.ok(
      hasGuard,
      "S3 external-research-summary.md synthesis must be guarded — only runs when not dual-empty"
    );
  });
});

// FIX-05: debate source-ID validation is delegated to debate skill
describe("FIX-05: debate source-ID validation is delegated to debate skill", () => {
  test("SKILL.md does not contain make-decision layer debate_triggered_invalid self-judgment", () => {
    const content = readSkill();
    assert.ok(
      !content.includes("debate_triggered_invalid"),
      "make-decision must not contain debate_triggered_invalid self-judgment; source-ID validity belongs to debate Step 1"
    );
  });

  test("S7 debate gate does not self-skip on missing orchestrator finding IDs", () => {
    const content = readSkill();
    const s7Idx = content.indexOf("## S7");
    const s7End = content.indexOf("## S8");
    const s7Section = content.slice(s7Idx, s7End !== -1 ? s7End : s7Idx + 8000);
    assert.ok(
      !s7Section.includes("debate_triggered_invalid"),
      "S7 must not self-judge missing finding IDs as debate_triggered_invalid; debate Step 1 owns that judgment"
    );
  });
});
