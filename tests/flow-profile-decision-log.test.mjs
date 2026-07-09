import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const SKILL_PATH = join(REPO_ROOT, "workflows", "make-decision", "SKILL.md");

function readSkill() {
  return readFileSync(SKILL_PATH, "utf8");
}

function sliceBetween(content, start, end) {
  const startIndex = content.indexOf(start);
  expect(startIndex, `missing start marker: ${start}`).toBeGreaterThanOrEqual(0);
  const endIndex = content.indexOf(end, startIndex + start.length);
  expect(endIndex, `missing end marker: ${end}`).toBeGreaterThan(startIndex);
  return content.slice(startIndex, endIndex);
}

function expectAll(section, tokens) {
  for (const token of tokens) {
    expect(section, `missing token: ${token}`).toContain(token);
  }
}

describe("FR-FLOWPROFILE-001: make-decision flow_profile contract", () => {
  it("instructs decision-log.md to persist flow_profile with the decision record", () => {
    const content = readSkill();
    const phaseB = sliceBetween(content, "### Phase B", "## Produce stage-result");

    expectAll(phaseB, [
      "flow_profile",
      "decision-log.md",
      "字符串",
      "full_vibecoding",
      "fast_make_decision_to_code",
    ]);
  });

  it("requires stage-result facts.flow_profile as a string and rejects missing/non-string values", () => {
    const content = readSkill();
    const stageResult = sliceBetween(content, "## Produce stage-result", "## S5");

    expectAll(stageResult, [
      "\"flow_profile\"",
      "字符串",
      "缺失",
      "非字符串",
      "fail-loud",
    ]);
  });

  it("documents downstream flow_profile use as read-only with no write, validation, branching, or blocking behavior", () => {
    const content = readSkill();
    const stageResult = sliceBetween(content, "## Produce stage-result", "## S5");

    expectAll(stageResult, [
      "build-spec/build-plan/build-code/verify-code",
      "只读",
      "不得写入",
      "不得校验",
      "不得据此分支",
      "不得阻断",
    ]);
  });

  it("keeps flow_profile enum handling deferred instead of adding current-round enum validation", () => {
    const content = readSkill();
    const stageResult = sliceBetween(content, "## Produce stage-result", "## S5");

    expectAll(stageResult, [
      "不做枚举约束",
      "枚举校验逻辑接入推迟",
      "本轮不驱动任何行为差异",
    ]);
  });
});
