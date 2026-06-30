/**
 * m13b-build-spec-deepening.test.mjs
 * AC-01..AC-22 grep verification for build-spec SKILL.md deepening.
 * Organised in three phases matching tasks.md Stage 1/2/3.
 */
import { test, describe } from "vitest";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const SKILL_PATH = join(REPO_ROOT, "workflows", "build-spec", "SKILL.md");
const COUNT_PATH = join(REPO_ROOT, "specs", "m13b-build-spec-deepening", "spec-acceptance-count.json");

function skill() {
  return readFileSync(SKILL_PATH, "utf8");
}

// ─── Phase 1: Foundation ────────────────────────────────────────────────────

describe("Phase 1 / AC-06: TASK_TRACKING_ROOT env var declared", () => {
  test("SKILL.md contains TASK_TRACKING_ROOT", () => {
    assert.ok(skill().includes("TASK_TRACKING_ROOT"),
      "TASK_TRACKING_ROOT must appear in build-spec SKILL.md (FR-TRACKING-001)");
  });
  test("SKILL.md declares default path ~/Knowledge/workflowhub/", () => {
    assert.ok(skill().includes("Knowledge/workflowhub"),
      "Default TASK_TRACKING_ROOT path must be declared (FR-TRACKING-001)");
  });
  test("SKILL.md states warn-not-stop behaviour for missing TASK_TRACKING_ROOT", () => {
    const c = skill();
    assert.ok(c.includes("TASK_TRACKING_ROOT") && (c.includes("warn") || c.includes("警告")),
      "SKILL.md must declare warn (not stop) on missing TASK_TRACKING_ROOT (FR-TRACKING-001)");
  });
});

describe("Phase 1 / AC-13: --task-dir parameter convention", () => {
  test("SKILL.md declares --task-dir parameter", () => {
    assert.ok(skill().includes("--task-dir"),
      "--task-dir parameter must be declared in build-spec SKILL.md (FR-TASKDIR-001)");
  });
  test("SKILL.md states fallback behaviour for missing --task-dir", () => {
    const c = skill();
    assert.ok(c.includes("--task-dir") && (c.includes("回退") || c.includes("fallback") || c.includes("默认路径")),
      "SKILL.md must declare fallback/default path when --task-dir is absent (FR-TASKDIR-001)");
  });
});

describe("Phase 1 / AC-20: three-layer spec structure", () => {
  test("SKILL.md declares 速读卡 (layer 1)", () => {
    const c = skill();
    assert.ok(c.includes("速读卡") || c.includes("层 1") || c.includes("层1"),
      "SKILL.md must declare 速读卡/层1 in three-layer structure (FR-STRUCTURE-001)");
  });
  test("SKILL.md declares 附录 (layer 3)", () => {
    const c = skill();
    assert.ok(c.includes("附录") || c.includes("层 3") || c.includes("层3"),
      "SKILL.md must declare 附录/层3 in three-layer structure (FR-STRUCTURE-001)");
  });
  test("SKILL.md declares 正文 (layer 2)", () => {
    const c = skill();
    assert.ok(c.includes("正文") || c.includes("层 2") || c.includes("层2"),
      "SKILL.md must declare 正文/层2 in three-layer structure (FR-STRUCTURE-001)");
  });
});

describe("Phase 1 / AC-14: Known Gaps section requirement", () => {
  test("SKILL.md requires Known Gaps section in spec output", () => {
    assert.ok(skill().includes("Known Gaps"),
      "SKILL.md must require Known Gaps section (FR-STRUCTURE-002)");
  });
});

describe("Phase 1 / AC-07: FR-{DOMAIN}-NNN numbering format", () => {
  test("SKILL.md declares FR-{DOMAIN}-NNN format", () => {
    const c = skill();
    assert.ok(
      c.includes("FR-{DOMAIN}") || c.includes("DOMAIN}-NNN") || c.includes("FR-NUMBERING"),
      "SKILL.md must declare FR-{DOMAIN}-NNN numbering format (FR-NUMBERING-001)");
  });
});

describe("Phase 1 / AC-08: spec-acceptance-count.json production", () => {
  test("SKILL.md declares spec-acceptance-count.json output step", () => {
    assert.ok(skill().includes("spec-acceptance-count.json"),
      "SKILL.md must declare spec-acceptance-count.json output (FR-ACCOUNT-001)");
  });
  test("SKILL.md declares ac_count field", () => {
    assert.ok(skill().includes("ac_count"),
      "SKILL.md must declare ac_count field in spec-acceptance-count.json (FR-ACCOUNT-001)");
  });
  test("SKILL.md declares fr_count field", () => {
    assert.ok(skill().includes("fr_count"),
      "SKILL.md must declare fr_count field (FR-ACCOUNT-001)");
  });
  test("SKILL.md declares counted_at field", () => {
    assert.ok(skill().includes("counted_at"),
      "SKILL.md must declare counted_at field (FR-ACCOUNT-001)");
  });
});

// ─── Phase 2: Core ──────────────────────────────────────────────────────────

describe("Phase 2 / AC-01: 质量事实契约 5 items", () => {
  test("SKILL.md declares 质量事实契约 section", () => {
    assert.ok(skill().includes("质量事实契约"),
      "SKILL.md must declare 质量事实契约 section (FR-CONTRACT-001)");
  });
  test("SKILL.md includes scope 边界 as contract item 1", () => {
    const c = skill();
    assert.ok(c.includes("scope 边界") || c.includes("scope boundary") || c.includes("scope边界"),
      "契约 item 1: scope 边界 (FR-CONTRACT-001)");
  });
  test("SKILL.md includes 自检结果 as contract item 2", () => {
    assert.ok(skill().includes("自检结果"),
      "契约 item 2: 自检结果 (FR-CONTRACT-001)");
  });
  test("SKILL.md includes 独立审查摘要 as contract item 3", () => {
    const c = skill();
    assert.ok(c.includes("独立审查摘要") || c.includes("审查摘要"),
      "契约 item 3: 独立审查摘要 (FR-CONTRACT-001)");
  });
  test("SKILL.md includes 未解风险 as contract item 4", () => {
    assert.ok(skill().includes("未解风险"),
      "契约 item 4: 未解风险 (FR-CONTRACT-001)");
  });
  test("SKILL.md includes handoff required_reads as contract item 5", () => {
    const c = skill();
    assert.ok(c.includes("required_reads") || c.includes("handoff") && c.includes("required"),
      "契约 item 5: handoff required_reads (FR-CONTRACT-001)");
  });
  test("SKILL.md declares contract items are non-blocking (FR-CONTRACT-002)", () => {
    const c = skill();
    assert.ok(
      c.includes("FR-CONTRACT-002") || (c.includes("质量事实契约") && (c.includes("非阻断") || c.includes("记录+浮现") || c.includes("不阻断"))),
      "契约必须明确为非阻断 (FR-CONTRACT-002)");
  });
});

describe("Phase 2 / AC-02: spec-ladder A/B/C 档", () => {
  test("SKILL.md declares spec-ladder", () => {
    const c = skill();
    assert.ok(c.includes("spec-ladder") || c.includes("档位"),
      "SKILL.md must declare spec-ladder (FR-LADDER-001)");
  });
  test("SKILL.md defines A 档", () => {
    assert.ok(skill().includes("A 档") || skill().includes("A档"),
      "SKILL.md must define A 档 (FR-LADDER-001)");
  });
  test("SKILL.md defines B 档", () => {
    assert.ok(skill().includes("B 档") || skill().includes("B档"),
      "SKILL.md must define B 档 (FR-LADDER-001)");
  });
  test("SKILL.md defines C 档", () => {
    assert.ok(skill().includes("C 档") || skill().includes("C档"),
      "SKILL.md must define C 档 (FR-LADDER-001)");
  });
  test("SKILL.md declares F10 four-question at ladder stage (FR-LADDER-002)", () => {
    const c = skill();
    assert.ok(
      c.includes("FR-LADDER-002") || (c.includes("档位") && (c.includes("Maintenance cost") || c.includes("维护成本") || c.includes("long-term"))),
      "SKILL.md must include F10 four-question in ladder judgment (FR-LADDER-002)");
  });
});

describe("Phase 2 / AC-19: spec pipeline steps", () => {
  test("SKILL.md mentions spec-specify as pipeline step", () => {
    assert.ok(skill().includes("spec-specify"),
      "SKILL.md must include spec-specify as pipeline step (FR-BUILD-001)");
  });
  test("SKILL.md mentions spec-clarify as pipeline step", () => {
    assert.ok(skill().includes("spec-clarify"),
      "SKILL.md must include spec-clarify as pipeline step (FR-BUILD-001)");
  });
  test("SKILL.md declares spec pipeline order (spec-specify → spec-clarify → ...)", () => {
    const c = skill();
    const specifyIdx = c.indexOf("spec-specify");
    const clarifyIdx = c.indexOf("spec-clarify");
    assert.ok(specifyIdx !== -1 && clarifyIdx !== -1 && specifyIdx < clarifyIdx,
      "spec-specify must appear before spec-clarify in SKILL.md (FR-BUILD-001)");
  });
});

describe("Phase 2 / AC-03: 7 self-check items", () => {
  test("SKILL.md declares 7 self-check (7 条自检)", () => {
    const c = skill();
    assert.ok(c.includes("7 条自检") || c.includes("7条自检") || (c.includes("自检") && c.includes("7")),
      "SKILL.md must declare 7-item self-check (FR-SELFCHECK-001)");
  });
  test("SKILL.md includes self-check item for FR numbering format", () => {
    const c = skill();
    assert.ok(
      c.includes("FR-{DOMAIN}-NNN") || c.includes("FR 使用") || c.includes("FR 格式"),
      "7条自检 must include FR format check (FR-SELFCHECK-001 item 2)");
  });
  test("SKILL.md includes self-check item for Given/When/Then scenes", () => {
    const c = skill();
    assert.ok(c.includes("Given") && c.includes("When") && c.includes("Then"),
      "7条自检 must include Given/When/Then check (FR-SELFCHECK-001 item 3)");
  });
});

describe("Phase 2 / AC-04: Spec-Purity grep", () => {
  test("SKILL.md declares Spec-Purity grep", () => {
    const c = skill();
    assert.ok(c.includes("Spec-Purity") || c.includes("spec-purity"),
      "SKILL.md must declare Spec-Purity grep (FR-SELFCHECK-002)");
  });
  test("SKILL.md states Spec-Purity is non-blocking", () => {
    const c = skill();
    assert.ok(
      c.includes("Spec-Purity") && (c.includes("不阻断") || c.includes("非阻断") || c.includes("warn")),
      "Spec-Purity must be declared as non-blocking (FR-SELFCHECK-002)");
  });
});

describe("Phase 2 / AC-05: 异源 3rd-review 独立审查", () => {
  test("SKILL.md declares 3rd-review or 异源独立审查", () => {
    const c = skill();
    assert.ok(c.includes("3rd-review") || c.includes("异源独立审查") || c.includes("异源审查"),
      "SKILL.md must declare 3rd-review/异源独立审查 (FR-REVIEW-001)");
  });
  test("SKILL.md prohibits self-review (FR-REVIEW-002)", () => {
    const c = skill();
    assert.ok(
      c.includes("FR-REVIEW-002") || c.includes("禁止自审自判") || (c.includes("独立上下文") && c.includes("异源")),
      "SKILL.md must prohibit self-review (FR-REVIEW-002)");
  });
  test("SKILL.md declares review is non-blocking", () => {
    const c = skill();
    assert.ok(
      (c.includes("3rd-review") || c.includes("异源")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("降级")),
      "3rd-review must be non-blocking with degraded mode (FR-REVIEW-001)");
  });
});

describe("Phase 2 / AC-11: scope-triage 高危词浮现", () => {
  test("SKILL.md declares scope-triage high-risk word surfacing", () => {
    const c = skill();
    assert.ok(c.includes("scope-triage") || c.includes("高危词"),
      "SKILL.md must declare scope-triage 高危词浮现 (FR-SCOPETRIAGE-001)");
  });
  test("SKILL.md declares scope-triage is non-blocking", () => {
    const c = skill();
    assert.ok(
      (c.includes("scope-triage") || c.includes("高危词")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("不构成阻断")),
      "scope-triage must be non-blocking (FR-SCOPETRIAGE-001)");
  });
});

describe("Phase 2 / AC-12: spec↔decision-log 一致性检查", () => {
  test("SKILL.md declares decision-log consistency check", () => {
    const c = skill();
    assert.ok(
      c.includes("一致性") || c.includes("FR-ALIGN") || c.includes("KEEP"),
      "SKILL.md must declare spec↔decision-log consistency check (FR-ALIGN-001)");
  });
  test("SKILL.md declares consistency check is non-blocking", () => {
    const c = skill();
    assert.ok(
      (c.includes("一致性") || c.includes("FR-ALIGN")) && (c.includes("不阻断") || c.includes("非阻断") || c.includes("记录")),
      "Consistency check must be non-blocking (FR-ALIGN-001)");
  });
});

// ─── Phase 3: Auxiliary & Verification ──────────────────────────────────────

describe("Phase 3 / AC-09: artifact-first standard", () => {
  test("SKILL.md declares artifact-first / 只传路径 standard", () => {
    const c = skill();
    assert.ok(
      c.includes("artifact-first") || c.includes("只传路径") || c.includes("写入文件后只传"),
      "SKILL.md must declare artifact-first standard (FR-ARTIFACT-001)");
  });
});

describe("Phase 3 / AC-10: REQ-COMM-01/02 communication rules", () => {
  test("SKILL.md declares REQ-COMM-01 or 大白话 rule", () => {
    const c = skill();
    assert.ok(
      c.includes("REQ-COMM-01") || c.includes("FR-COMM-001") || (c.includes("大白话") && c.includes("选项")),
      "SKILL.md must declare REQ-COMM-01 plain language rule (FR-COMM-001)");
  });
  test("SKILL.md declares REQ-COMM-02 or 进度报告 rule", () => {
    const c = skill();
    assert.ok(
      c.includes("REQ-COMM-02") || c.includes("FR-COMM-002") || c.includes("进度"),
      "SKILL.md must declare REQ-COMM-02 progress reporting rule (FR-COMM-002)");
  });
});

describe("Phase 3 / AC-15: [FRICTION] capture format", () => {
  test("SKILL.md declares [FRICTION] entry format", () => {
    const c = skill();
    assert.ok(c.includes("[FRICTION]") || c.includes("FRICTION"),
      "SKILL.md must declare [FRICTION] capture format (FR-FRICTION-001)");
  });
});

describe("Phase 3 / AC-16: high-risk words not used as execution gate semantics", () => {
  test("SKILL.md does not use 不能进 as an execution gate (only allowed in blacklist/example context)", () => {
    const c = skill();
    // 不能进 may appear in the high-risk-word blacklist enumeration (黑名单) — that is fine.
    // It must NOT appear as a hard gate controlling execution flow outside that context.
    const gateLines = c.split("\n").filter(
      l => l.includes("不能进") && !l.includes("黑名单") && !l.includes("示例") && !l.includes("例如")
    );
    assert.ok(gateLines.length === 0,
      `SKILL.md must not use 不能进 as execution gate (AC-16); found outside blacklist/example context: ${gateLines.join(" | ")}`);
  });
  test("SKILL.md does not use Chinese 阻断 as a hard execution gate", () => {
    const c = skill();
    // 阻断 may appear as: 不阻断/非阻断 (negated), blacklist listing (黑名单),
    // detection description (检测阻断), constitution refs (Q1/F3/F4/F5), 而非阻断 (explanatory).
    // A hard gate like 若X则阻断流程 MUST be rejected.
    const hardGateLines = c.split("\n").filter(l => {
      if (!l.includes("阻断")) return false;
      // Negated forms
      if (l.includes("不阻断") || l.includes("非阻断") || l.includes("不构成阻断") ||
          l.includes("不作为阻断") || l.includes("不得阻断") || l.includes("而非阻断")) return false;
      // Detection / blacklist / explanation context
      if (l.includes("黑名单") || l.includes("检测阻断") || l.includes("阻断语义") ||
          l.includes("禁止附加") || l.includes("记录事实")) return false;
      // Constitution principle references
      if (l.match(/Q[0-9]|F[0-9]|CONSTITUTION/)) return false;
      return true;
    });
    assert.ok(hardGateLines.length === 0,
      `SKILL.md must not use 阻断 as hard execution gate (AC-16); suspect lines: ${hardGateLines.slice(0,3).join(" | ")}`);
  });
  test("SKILL.md does not use BLOCK or blocking as a hard execution gate (only non-blocking or blacklist context)", () => {
    const c = skill();
    // Lines with BLOCK/blocking are fine when negated or in blacklist/explanation context.
    // Allowed: 不阻断, non-blocking, do not block, NOT block, don't block, 黑名单, 不构成阻断
    const hardGateLines = c.split("\n").filter(l => {
      if (!l.match(/\bBLOCK\b|blocking/i)) return false;
      // Chinese negation forms
      if (l.includes("不阻断") || l.includes("非阻断") || l.includes("不构成阻断") ||
          l.includes("不作为阻断") || l.includes("阻断语义") || l.includes("黑名单")) return false;
      // English negation forms (do not block, NOT block, non-blocking, won't block)
      if (l.match(/non.?block|not block|do not block|does not block|don.t block|won.t block/i)) return false;
      // Explanation / principle context (constitution refs, rule notes)
      if (l.includes("Q1") || l.includes("F3") || l.includes("F4") || l.includes("F5")) return false;
      return true;
    });
    assert.ok(hardGateLines.length === 0,
      `SKILL.md must not use BLOCK/blocking as hard gate (AC-16); suspect lines: ${hardGateLines.slice(0,3).join(" | ")}`);
  });
});

describe("Phase 3 / AC-21: D3 deleted items not present as active mechanisms", () => {
  test("SKILL.md does NOT use gate.sh as an active execution call", () => {
    assert.ok(!skill().includes("gate.sh"),
      "gate.sh must not appear as active mechanism in SKILL.md (AC-21)");
  });
  test("SKILL.md does NOT use post_review_pass as an active gate", () => {
    assert.ok(!skill().includes("post_review_pass"),
      "post_review_pass must not appear in SKILL.md (AC-21)");
  });
  test("SKILL.md does NOT use [DECOMP] telemetry emission", () => {
    assert.ok(!skill().includes("[DECOMP]"),
      "[DECOMP] must not appear in SKILL.md as mechanism (AC-21)");
  });
  test("SKILL.md does NOT contain TodoWrite template call as active mechanism", () => {
    // TodoWrite is a D3 deleted item — must not appear as an active step/call
    // (explanatory references to the concept are allowed, same semantics as AC-16)
    const c = skill();
    const twLines = c.split("\n").filter(
      l => l.includes("TodoWrite") && !l.includes("//") && !l.includes("注：") && !l.includes("例如")
    );
    assert.ok(twLines.length === 0,
      `TodoWrite must not appear as active mechanism in SKILL.md (AC-21); found: ${twLines.slice(0,2).join(" | ")}`);
  });
  test("SKILL.md does NOT contain duplicate Exit Conditions sections as mechanism steps", () => {
    // At most one Exit Conditions heading is allowed; a duplicate signals a D3 gate pattern
    const c = skill();
    const exitCondMatches = (c.match(/## Exit Conditions|## 退出条件|stage_exit/g) || []);
    assert.ok(exitCondMatches.length <= 1,
      `Duplicate Exit Conditions/stage_exit sections detected (${exitCondMatches.length}) — D3 gate pattern violation (AC-21)`);
  });
});

describe("Phase 3 / AC-17: spec-acceptance-count.json file validity", () => {
  test("spec-acceptance-count.json exists", () => {
    assert.ok(existsSync(COUNT_PATH),
      "specs/m13b-build-spec-deepening/spec-acceptance-count.json must exist (FR-ACCOUNT-001 AC-17)");
  });
  test("spec-acceptance-count.json has non-null ac_count", () => {
    const obj = JSON.parse(readFileSync(COUNT_PATH, "utf8"));
    assert.ok(obj.ac_count != null && typeof obj.ac_count === "number",
      "ac_count must be a non-null number (AC-17)");
  });
  test("spec-acceptance-count.json has non-null fr_count", () => {
    const obj = JSON.parse(readFileSync(COUNT_PATH, "utf8"));
    assert.ok(obj.fr_count != null && typeof obj.fr_count === "number",
      "fr_count must be a non-null number (AC-17)");
  });
  test("spec-acceptance-count.json has non-null counted_at ISO8601", () => {
    const obj = JSON.parse(readFileSync(COUNT_PATH, "utf8"));
    assert.ok(obj.counted_at != null && typeof obj.counted_at === "string" && obj.counted_at.includes("T"),
      "counted_at must be a non-null ISO8601 string (AC-17)");
  });
});

describe("Phase 3 / AC-18: all FR numbers use FR-[A-Z]+-[0-9]{3} format", () => {
  test("all FR-* identifiers in SKILL.md match FR-[A-Z]+-[0-9]{3} regex", () => {
    const c = skill();
    // Extract every FR-XXX-NNN token (uppercase domain, exactly 3 digits)
    const allFR = (c.match(/FR-[A-Z0-9]+-[0-9]+/g) || []);
    const badFR = allFR.filter(fr => !/^FR-[A-Z]+-[0-9]{3}$/.test(fr));
    assert.ok(badFR.length === 0,
      `FR numbers not matching FR-[A-Z]+-[0-9]{3}: ${badFR.join(", ")} (AC-18 FR-NUMBERING-001)`);
    assert.ok(allFR.length > 0, "SKILL.md must contain at least one FR-* identifier (AC-18)");
  });
  test("build-spec SKILL.md has version field in frontmatter (S6 version traceability)", () => {
    const c = skill();
    const match = c.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(match, "SKILL.md must have YAML frontmatter");
    assert.ok(match[1].includes("version"), "SKILL.md frontmatter must have version field (S6 traceability)");
  });
});

describe("Phase 3 / AC-22: TASK_TRACKING_ROOT used, no hardcoded tracking absolute paths", () => {
  test("SKILL.md references TASK_TRACKING_ROOT for tracking file paths", () => {
    assert.ok(skill().includes("TASK_TRACKING_ROOT"),
      "SKILL.md must reference TASK_TRACKING_ROOT for tracking paths (FR-TRACKING-001/002 AC-22)");
  });
  test("SKILL.md does not use ~/Knowledge/ as a hardcoded write path (only allowed as default-value declaration)", () => {
    const c = skill();
    // Count occurrences of ~/Knowledge/ — it's allowed once as default value declaration.
    // Active hardcoded tracking write paths would appear multiple times or alongside write/mkdir calls.
    const count = (c.match(/~\/Knowledge\//g) || []).length;
    // At most 2 occurrences tolerated (declaration + example). More suggests hardcoding.
    assert.ok(count <= 2,
      `~/Knowledge/ appears ${count} times — likely hardcoded tracking paths beyond default declaration (AC-22)`);
  });
});
