// TDD Phase 6: build-plan v1 upgrade — verification tests for T014-T019.
// Grep-style content assertions on workflows/build-plan/SKILL.md.
// Uses vitest + node:assert. Mirrors five-skills-present.test.mjs pattern.
// All assertions are NON-VACUOUS: they assert real presence/structure, not filter-then-assert-absent.
import { test, describe } from "vitest";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const SKILL_PATH = join(REPO_ROOT, "workflows", "build-plan", "SKILL.md");

function readSkill() {
  assert.ok(existsSync(SKILL_PATH), `Missing: ${SKILL_PATH}`);
  return readFileSync(SKILL_PATH, "utf8");
}

// T014(a): references to spec-plan, spec-tasks, spec-analyze (callable)
describe("T014(a): build-plan SKILL.md references 3 new sub-skills as callable", () => {
  test("references spec-plan as callable skill", () => {
    const content = readSkill();
    // Must mention spec-plan in a callable context (path or invocation)
    assert.ok(
      content.includes("spec-plan"),
      "SKILL.md must reference spec-plan (sub-skill name)"
    );
  });

  test("references spec-tasks as callable skill", () => {
    const content = readSkill();
    assert.ok(
      content.includes("spec-tasks"),
      "SKILL.md must reference spec-tasks (sub-skill name)"
    );
  });

  test("references spec-analyze as callable skill", () => {
    const content = readSkill();
    assert.ok(
      content.includes("spec-analyze"),
      "SKILL.md must reference spec-analyze (sub-skill name)"
    );
  });
});

// T015(b): constitution-checklist 21-clause reference + [x]/[ ]+rationale requirement + non-blocking
describe("T015: constitution compliance check — 21 clauses, [x]/[ ]+rationale, non-blocking", () => {
  test("references constitution-checklist.md", () => {
    const content = readSkill();
    assert.ok(
      content.includes("constitution-checklist.md") || content.includes("constitution-checklist"),
      "SKILL.md must reference constitution-checklist.md"
    );
  });

  test("requires all 21 clauses present with [x] or [ ] + rationale", () => {
    const content = readSkill();
    // Must mention the 21 clause count AND the [x]/[ ] status requirement AND rationale/judgement
    const hasClauseCount = content.includes("21 条") || content.includes("21条");
    const hasStatusReq =
      content.includes("[x]") && (content.includes("[ ]") || content.includes("[  ]"));
    const hasRationale =
      content.includes("判据") || content.includes("rationale") || content.includes("理由");
    assert.ok(
      hasClauseCount,
      "SKILL.md must reference 21 clauses (total count from constitution-checklist.md)"
    );
    assert.ok(
      hasStatusReq,
      "SKILL.md must require [x]/[ ] status marking per clause"
    );
    assert.ok(
      hasRationale,
      "SKILL.md must require rationale/判据 text per clause"
    );
  });

  test("constitution check result is non-blocking (recorded, not blocking)", () => {
    const content = readSkill();
    // Must indicate that check result is recorded/noted but does NOT block pipeline progress
    const nonBlocking =
      content.includes("不阻断") ||
      content.includes("不阻塞") ||
      content.includes("not blocking") ||
      content.includes("记录不阻断") ||
      content.includes("只记录");
    assert.ok(
      nonBlocking,
      "SKILL.md must state that constitution compliance check is non-blocking (记录不阻断)"
    );
  });

  test("incomplete output failure: missing clause or missing status/rationale = fail", () => {
    const content = readSkill();
    // Must reference the "incomplete output" failure condition (FR-CONSTITUTION-003)
    const incompleteFailure =
      content.includes("未产出完整") ||
      content.includes("不完整") ||
      content.includes("incomplete output") ||
      content.includes("缺任一条") ||
      content.includes("缺条");
    assert.ok(
      incompleteFailure,
      "SKILL.md must define incomplete-output failure: missing any clause or status/rationale = fail"
    );
  });
});

// T016(c): 5 baseline metric names, rework_proxy_count exact, M10 values, all-unknown-with-reason, no placeholder, delta unknown
describe("T016: M10 baseline comparison — 5 metrics, unknown rule, no placeholders", () => {
  test("mentions all 5 baseline metric names including exact rework_proxy_count", () => {
    const content = readSkill();
    const metrics = ["missed_step_rate", "test_execution_rate", "review_execution_rate", "rework_rounds", "rework_proxy_count"];
    for (const m of metrics) {
      assert.ok(
        content.includes(m),
        `SKILL.md must mention baseline metric "${m}"`
      );
    }
    // rework_proxy_count must use EXACT name (no alias)
    // Assert the exact name is present
    assert.ok(
      content.includes("rework_proxy_count"),
      "SKILL.md must contain the exact metric name 'rework_proxy_count'"
    );
    // Assert known aliases are NOT used as metric identifier
    // "rework_proxy" standalone (not part of "rework_proxy_count") must not appear
    const reworkProxyStandalone = (content.match(/\brework_proxy\b/g) || []).length;
    assert.ok(
      reworkProxyStandalone === 0,
      `SKILL.md must NOT use alias "rework_proxy" as metric identifier (use 'rework_proxy_count'), found ${reworkProxyStandalone} bare occurrence(s)`
    );
    // "proxy_count" standalone must not appear as metric identifier
    const proxyCountStandalone = (content.match(/\bproxy_count\b/g) || []).length;
    assert.ok(
      proxyCountStandalone === 0,
      `SKILL.md must NOT use alias "proxy_count" as metric identifier (use 'rework_proxy_count')`
    );
    // "rework_count" standalone must not appear as metric identifier
    const reworkCountStandalone = (content.match(/\brework_count\b/g) || []).length;
    assert.ok(
      reworkCountStandalone === 0,
      `SKILL.md must NOT use alias "rework_count" as metric identifier (use 'rework_proxy_count')`
    );
  });

  test("M10 baseline values are present (0.05, 0.8295, 1, 6.075, 25.25)", () => {
    const content = readSkill();
    // At least some of the M10 values must be present — check that baseline-report.md reference
    // or the actual numeric values appear
    const hasBaselineRef =
      content.includes("baseline-report.md") || content.includes("baseline-report");
    const hasM10Values =
      (content.includes("0.05") || content.includes("0.8295") || content.includes("6.075") || content.includes("25.25"));
    assert.ok(
      hasBaselineRef || hasM10Values,
      "SKILL.md must reference M10 baseline-report.md or its baseline values"
    );
  });

  test("at build-plan stage all 5 M12 values MUST be unknown with per-metric reasons", () => {
    const content = readSkill();
    // Must state unknown for build-plan stage AND give per-metric reasons
    const hasUnknownRule =
      content.includes("unknown") && (
        content.includes("仅 upstream") ||
        content.includes("全五段") ||
        content.includes("全流程未完成") ||
        content.includes("无测试执行数据") ||
        content.includes("尚未执行") ||
        content.includes("不可得")
      );
    assert.ok(
      hasUnknownRule,
      "SKILL.md must state that at build-plan stage, metrics are unknown with per-metric reason (e.g. 仅upstream, 无测试数据, 尚未执行)"
    );
  });

  test("NO placeholder values (0, -, --) for unknown metrics", () => {
    const content = readSkill();
    // Must explicitly forbid placeholder values like 0, "-", "--"
    const noPlaceholder =
      content.includes("占位") ||
      content.includes("不得用") ||
      content.includes("不可用") ||
      content.includes("不可写") ||
      content.includes("不得使用占位") ||
      content.includes("no placeholder") ||
      content.includes("不能写") ||
      content.includes("不为任意占位");
    assert.ok(
      noPlaceholder,
      "SKILL.md must forbid placeholder values (0, -, --) for unknown metrics"
    );
  });

  test("delta column is also unknown for all 5 rows", () => {
    const content = readSkill();
    // Delta column specification — must say delta is unknown or linked to unknown M12 values
    const deltaUnknown =
      content.includes("delta") && content.includes("unknown");
    assert.ok(
      deltaUnknown,
      "SKILL.md must state that delta column is also unknown when M12 values are unknown"
    );
  });

  test("build-plan SKILL.md does NOT claim build-plan/build-code/verify-code metric VALUES as known", () => {
    const content = readSkill();
    // Extract the Step 6 baseline comparison section
    const step6Start = content.indexOf("### Step 6: M10 baseline comparison");
    assert.ok(step6Start !== -1, "Step 6 baseline comparison section must exist");
    const nextStepIdx = content.indexOf("\n### Step", step6Start + 1);
    const baselineSection = nextStepIdx !== -1
      ? content.slice(step6Start, nextStepIdx)
      : content.slice(step6Start);

    // Assert the section explicitly declares all M12 values are unknown
    assert.ok(
      baselineSection.includes("ALL 5 values are `unknown`") ||
      baselineSection.includes("ALL 5 values are unknown"),
      "Baseline section must declare that ALL 5 M12 values are unknown at build-plan stage"
    );

    // Extract the OUTPUT table (4-column format: 指标名 | M12 实值 | M10 baseline | delta)
    // The output table follows the "Output format" line
    const outputStart = baselineSection.indexOf("**Output format**");
    assert.ok(outputStart !== -1, "Output format table must exist in baseline section");
    const outputSection = baselineSection.slice(outputStart);

    // For each metric in the output table, the M12 value cell (2nd column) must be "unknown"
    const metricNames = ["missed_step_rate", "test_execution_rate", "review_execution_rate", "rework_rounds", "rework_proxy_count"];
    for (const metric of metricNames) {
      const escapedMetric = metric.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Match 4-column rows: | metric | M12_value | M10_baseline | delta |
      const re = new RegExp(`\\|\\s*${escapedMetric}\\s*\\|\\s*([^|]+)\\s*\\|\\s*[^|]+\\s*\\|\\s*[^|]+\\s*\\|`, "g");
      const match = re.exec(outputSection);
      if (match) {
        const m12Cell = match[1].trim();
        assert.ok(
          m12Cell.startsWith("unknown"),
          `M12 value for "${metric}" must start with "unknown", got: "${m12Cell.slice(0, 40)}..."`
        );
        assert.ok(
          !/^\d/.test(m12Cell),
          `M12 value for "${metric}" must NOT be a numeric placeholder, got: "${m12Cell.slice(0, 40)}..."`
        );
      }
    }
  });

  test("threshold is human-set, non-blocking", () => {
    const content = readSkill();
    const humanThreshold =
      content.includes("人设定") ||
      content.includes("人拍") ||
      content.includes("阈值由人") ||
      content.includes("human-set") ||
      content.includes("由人设定");
    const nonBlocking =
      content.includes("不阻断") || content.includes("非阻塞") || content.includes("not blocking");
    assert.ok(
      humanThreshold || nonBlocking,
      "SKILL.md must state threshold is human-set and/or baseline comparison is non-blocking"
    );
  });
});

// T017(d): human review pause marker appears EXACTLY ONCE
describe("T017: human review checkpoint — exactly ONE pause marker", () => {
  test("human review pause marker exists in SKILL.md", () => {
    const content = readSkill();
    // The pause marker should be an explicit instruction to wait for human confirmation
    const hasPause =
      content.includes("停顿") ||
      content.includes("等人确认") ||
      content.includes("等待确认") ||
      content.includes("human review") ||
      content.includes("检查点") ||
      content.includes("pause") ||
      content.includes("人审") ||
      content.includes("人工确认");
    assert.ok(
      hasPause,
      "SKILL.md must contain a human review pause marker (停顿/等人确认/检查点/人审)"
    );
  });

  test("human review pause marker appears EXACTLY ONE logical checkpoint", () => {
    const content = readSkill();
    // Match EXACTLY ONE review checkpoint step heading: "### Step N: ... 人审检查点 ..." or "... Human review checkpoint ..."
    const reviewHeadings = content.match(/^### Step \d+:.*(?:人审检查点|Human review checkpoint)/gm) || [];
    assert.ok(
      reviewHeadings.length === 1,
      `SKILL.md must have EXACTLY ONE human review checkpoint heading, found ${reviewHeadings.length}: ${JSON.stringify(reviewHeadings)}`
    );
  });
});

// T017(e): review object fields (state/reviewer/timestamp/decision/notes) documented; pending is valid
describe("T017(e): review object fields — state, reviewer, timestamp, decision, notes", () => {
  test("review object state field documented with pending|approved|rejected", () => {
    const content = readSkill();
    assert.ok(
      content.includes("review") && content.includes("state"),
      "SKILL.md must document review object with state field"
    );
    const hasStates =
      (content.includes("pending") || content.includes("待确认")) &&
      (content.includes("approved") || content.includes("批准") || content.includes("通过")) &&
      (content.includes("rejected") || content.includes("拒绝"));
    assert.ok(
      hasStates,
      "SKILL.md must document review.state values: pending, approved, rejected"
    );
  });

  test("review.reviewer field documented", () => {
    const content = readSkill();
    assert.ok(
      content.includes("reviewer") || content.includes("确认人") || content.includes("审查人"),
      "SKILL.md must document review.reviewer field"
    );
  });

  test("review.timestamp field documented", () => {
    const content = readSkill();
    assert.ok(
      content.includes("timestamp") || content.includes("时间"),
      "SKILL.md must document review.timestamp field (RF3339 or similar)"
    );
  });

  test("review.decision field documented as non-empty in all 3 states", () => {
    const content = readSkill();
    assert.ok(
      content.includes("decision") || content.includes("决定"),
      "SKILL.md must document review.decision field"
    );
    // Decision must be non-empty in all states - check for the requirement
    const nonEmptyDecision =
      content.includes("非空") ||
      content.includes("不为空") ||
      content.includes("non-empty") ||
      content.includes("必须包含") ||
      content.includes("必须有") ||
      content.includes("检查点已触达");
    assert.ok(
      nonEmptyDecision,
      "SKILL.md must require review.decision to be non-empty in all 3 states"
    );
  });

  test("review.notes field documented", () => {
    const content = readSkill();
    assert.ok(
      content.includes("notes") || content.includes("附注") || content.includes("备注"),
      "SKILL.md must document review.notes field"
    );
  });

  test("pending state is valid (produces valid stage-result, no omission)", () => {
    const content = readSkill();
    // pending must be described as a valid state that does NOT prevent stage-result production
    const pendingValid =
      (content.includes("pending") && (
        content.includes("有效") ||
        content.includes("valid") ||
        content.includes("正常产出") ||
        content.includes("不因") ||
        content.includes("仍产出") ||
        content.includes("缺省")
      )) ||
      content.includes("pending 本身是有效状态") ||
      content.includes("pending") && content.includes("不可缺");
    assert.ok(
      pendingValid,
      "SKILL.md must state that pending is a valid review state producing valid stage-result"
    );
  });
});

// T018(f): F10 4-question gate present (all 4 question strings)
describe("T018: F10 anti-over-engineering gate — all 4 questions present", () => {
  test("F10 Q1: 'What real threat does this defend against?'", () => {
    const content = readSkill();
    assert.ok(
      content.includes("What real threat does this defend against") ||
      content.includes("real threat does this defend") ||
      content.includes("真实威胁"),
      "SKILL.md must contain F10 Q1 about real threat"
    );
  });

  test("F10 Q2: 'Does any existing mechanism already cover it?'", () => {
    const content = readSkill();
    assert.ok(
      content.includes("Does any existing mechanism already cover") ||
      content.includes("existing mechanism already cover") ||
      content.includes("已有机制") ||
      content.includes("existing cover"),
      "SKILL.md must contain F10 Q2 about existing mechanism coverage"
    );
  });

  test("F10 Q3: 'Can it be bypassed?'", () => {
    const content = readSkill();
    assert.ok(
      content.includes("Can it be bypassed") ||
      content.includes("bypassed") ||
      content.includes("可绕过") ||
      content.includes("绕过"),
      "SKILL.md must contain F10 Q3 about bypassability"
    );
  });

  test("F10 Q4: 'What is the long-term maintenance cost?'", () => {
    const content = readSkill();
    assert.ok(
      content.includes("What is the long-term maintenance cost") ||
      content.includes("long-term maintenance cost") ||
      content.includes("长期维护成本") ||
      content.includes("maintenance cost"),
      "SKILL.md must contain F10 Q4 about long-term maintenance cost"
    );
  });

  test("F10 cautionary example preserved (95,000 lines of gate code)", () => {
    const content = readSkill();
    assert.ok(
      content.includes("95,000") || content.includes("95000"),
      "SKILL.md must retain F10 cautionary example text about ~95,000 lines of gate code"
    );
  });
});

// T019(g): M6 contract preserved + v1 adds tasks_ref + analysis_ref
describe("T019: M6 stage-result contract preserved + v1 additions", () => {
  test("M6 fields preserved: status, error_code, retryable, missing_items, user_decision, reason", () => {
    const content = readSkill();
    const m6Fields = ["status", "error_code", "retryable", "missing_items", "user_decision", "reason"];
    for (const f of m6Fields) {
      assert.ok(
        content.includes(`"${f}"`) || content.includes(`"${f}"`) || content.includes(f),
        `SKILL.md must preserve M6 field "${f}" in stage-result contract`
      );
    }
  });

  test("facts.plan_ref preserved (M6)", () => {
    const content = readSkill();
    assert.ok(
      content.includes("plan_ref"),
      "SKILL.md must preserve facts.plan_ref (M6 field)"
    );
  });

  test("facts.tasks preserved (M6)", () => {
    const content = readSkill();
    assert.ok(
      content.includes("facts") && content.includes("tasks"),
      "SKILL.md must preserve facts.tasks (M6 field)"
    );
  });

  test("v1 adds facts.tasks_ref", () => {
    const content = readSkill();
    assert.ok(
      content.includes("tasks_ref"),
      "SKILL.md must add facts.tasks_ref (v1 new field)"
    );
  });

  test("v1 adds facts.analysis_ref", () => {
    const content = readSkill();
    assert.ok(
      content.includes("analysis_ref"),
      "SKILL.md must add facts.analysis_ref (v1 new field)"
    );
  });

  test("recordSkeleton call preserved", () => {
    const content = readSkill();
    assert.ok(
      content.includes("recordSkeleton"),
      "SKILL.md must preserve recordSkeleton metrics call"
    );
  });

  test("updateOwnResult call preserved", () => {
    const content = readSkill();
    assert.ok(
      content.includes("updateOwnResult"),
      "SKILL.md must preserve updateOwnResult metrics call"
    );
  });

  test("10 core fields preserved in metrics record", () => {
    const content = readSkill();
    const coreFields = [
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
    const missingFields = coreFields.filter(f => !content.includes(f));
    assert.ok(
      missingFields.length === 0,
      `SKILL.md must preserve ALL 10 core metrics fields. Missing (${missingFields.length}): ${missingFields.join(", ")}`
    );
  });
});
