import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const json = (relative) => JSON.parse(read(relative));
const deps = (stage) => yaml.load(read(`workflows/${stage}/skill-deps.yaml`)).skills;
const names = (stage) => deps(stage).map(({ name }) => name);
const skillSteps = (stage) => json(`workflows/${stage}/steps.json`).steps.flatMap((step) =>
  step.completion_evidence
    .filter((entry) => entry.kind === "skill_invocation")
    .map((entry) => entry.uri_or_path.replace(/^skill:\/\//, ""))
);

describe("D-015 stage routing and concrete testing contract", () => {
  it("records the user requirement and current material handoff", () => {
    const log = read("specs/archive/multica-issues-monitoring-g6-g7-20260805/decision-log.md");
    const spec = read("specs/archive/multica-issues-monitoring-g6-g7-20260805/spec.md");
    const plan = read("specs/archive/multica-issues-monitoring-g6-g7-20260805/plan.md");
    const tasks = read("specs/archive/multica-issues-monitoring-g6-g7-20260805/tasks.md");
    expect(log).toMatch(/R-011/);
    expect(log).toMatch(/D-015/);
    expect(spec).toMatch(/FR-WH-009/);
    expect(spec).toMatch(/FR-WH-010/);
    expect(plan).toMatch(/Phase P5/);
    expect(tasks).toMatch(/T013/);
    expect(tasks).toMatch(/T014/);
  });

  it("keeps build-spec direct order and wh-review as the only provider reviewer", () => {
    expect(names("build-spec")).toEqual([
      "spec-specify", "spec-clarify", "simplicity-guard", "plan-ceo-review",
      "plan-design-review", "wh-review",
    ]);
    expect(deps("build-spec").find(({ name }) => name === "plan-design-review"))
      .toMatchObject({ invocation: "conditional", trigger: "ui_scope" });
    expect(names("build-spec")).not.toContain("spec-analyze");
    expect(skillSteps("build-spec")).toEqual([
      "spec-specify", "spec-clarify", "simplicity-guard", "plan-ceo-review",
      "plan-design-review", "wh-review",
    ]);
    expect(json("skills/wh-review/stage-skill-plan.json").stages["build-spec"].required_skills)
      .toEqual(["review"]);
  });

  it("binds make-decision Talk/Grill/review calls to ordered invocation keys", () => {
    expect(skillSteps("make-decision")).toEqual([
      "talk-with-zhipeng", "talk-with-zhipeng", "talk-with-zhipeng",
      "grill-with-docs", "decision-log", "wh-review",
    ]);
    expect(json("workflows/make-decision/steps.json").steps.filter((step) =>
      step.completion_evidence.some((entry) => entry.uri_or_path === "skill://talk-with-zhipeng")
    ).map((step) => step.completion_evidence.find((entry) => entry.uri_or_path === "skill://talk-with-zhipeng").invocation_key))
      .toEqual(["talk-1", "talk-2", "talk-3"]);
  });

  it("keeps build-plan order and excludes blueprint/concrete testing skills", () => {
    expect(names("build-plan")).toEqual([
      "spec-research", "spec-plan", "simplicity-guard", "plan-eng-review",
      "test-routing-advisor", "spec-tasks", "spec-analyze", "wh-review",
    ]);
    expect(deps("build-plan").find(({ name }) => name === "spec-research"))
      .toMatchObject({ invocation: "conditional", trigger: "real_research_question" });
    for (const forbidden of ["backend-testing", "frontend-testing", "fullstack-slice-testing", "testing-system-blueprint"])
      expect(names("build-plan")).not.toContain(forbidden);
    expect(skillSteps("build-plan")).toEqual([
      "spec-research", "spec-plan", "simplicity-guard", "plan-eng-review",
      "test-routing-advisor", "spec-tasks", "spec-analyze", "wh-review",
    ]);
    expect(json("skills/wh-review/stage-skill-plan.json").stages["build-plan"].required_skills)
      .toEqual(["review"]);
  });

  it("requires handoff comments to expose inherited process facts and the plain-language plan", () => {
    const protocol = read("skills/workflowhub-host-protocol/SKILL.md");
    for (const label of [
      "talk-with-zhipeng",
      "grill-with-docs",
      "research",
      "blind review",
      "detail review",
      "decision-log",
      "整体方案",
      "unavailable",
      "inherited from make-decision",
    ]) {
      expect(protocol, `host protocol must keep the handoff process index: ${label}`).toContain(label);
    }
    expect(protocol).toMatch(/不得重复发起 Talk/);
    expect(protocol).toMatch(/不得重复发起 Grill/);
    expect(protocol).toMatch(/做什么、怎么做、预期效果\/非目标/);
  });

  it("routes build-code against actual scope and invokes one concrete testing skill", () => {
    expect(names("build-code")).toEqual([
      "test-routing-advisor", "backend-testing", "frontend-testing",
      "fullstack-slice-testing", "wh-review",
    ]);
    for (const name of ["test-routing-advisor", "backend-testing", "frontend-testing", "fullstack-slice-testing"])
      expect(deps("build-code").find((dependency) => dependency.name === name))
        .toMatchObject({ invocation: "conditional", owner: "stage", dispatch: "stage" });
    expect(skillSteps("build-code")).toContain("test-routing-advisor");
    expect(skillSteps("build-code")).toContain("concrete-testing");
    expect(read("runtime/stage/stage-skill-runtime.mjs")).toMatch(/dispatchOrderedStageSkills/);
    expect(read("runtime/stage/stage-runner.mjs")).toMatch(/dispatchOrderedStageSkills/);
    expect(read("tools/cli/stage-runtime.mjs")).toMatch(/stage_skill_dispatch/);
    expect(read("tools/cli/stage-runtime.mjs")).toMatch(/createStageSkillDispatchPublication/);
    for (const skill of ["backend-testing", "frontend-testing", "fullstack-slice-testing"])
      expect(read(`skills/${skill}/SKILL.md`)).toMatch(/build-code/);
    expect(read("skills/testing-system-blueprint/SKILL.md")).toMatch(/不属于本任务/);
  });

  it("declares the real build-code route handoff and disposition-based completion", () => {
    const steps = json("workflows/build-code/steps.json").steps;
    const skillStepsWithOrder = steps
      .filter((step) => step.completion_evidence.some((entry) => entry.uri_or_path.startsWith("skill://")))
      .map((step) => ({ step_slug: step.step_slug, skill: step.completion_evidence.find((entry) => entry.uri_or_path.startsWith("skill://")).uri_or_path }));
    expect(skillStepsWithOrder).toEqual([
      { step_slug: "inspect-and-route-actual-tests", skill: "skill://test-routing-advisor" },
      { step_slug: "invoke-concrete-testing-skill", skill: "skill://concrete-testing" },
      { step_slug: "review-change", skill: "skill://wh-review" },
    ]);
    expect(steps.find((step) => step.step_slug === "authenticate-current-task-completion").observable_result)
      .toMatch(/current-snapshot review fact and every finding disposition/i);
    expect(read("workflows/build-code/SKILL.md")).toMatch(/task-local handoff condition[\s\S]*new public[\s\S]*runtime gate/i);
    expect(read("workflows/build-code/SKILL.md")).toMatch(/controls\.selectedTestingSkill/);
  });

  it("allows an explicitly explained non-code route without pretending a concrete skill ran", () => {
    expect(read("runtime/stage/stage-skill-runtime.mjs")).toMatch(/testingNotApplicableReason/);
    expect(read("workflows/build-code/SKILL.md")).toMatch(/testing_not_applicable=true/);
  });

  it("requires verify-code to reverse-check requirements, design, flow, and unknown evidence", () => {
    const verify = read("workflows/verify-code/SKILL.md");
    for (const phrase of ["原始需求回放", "完整用户流程", "Design", "unknown", "证据缺失不能算 pass"])
      expect(verify).toContain(phrase);
  });
});
