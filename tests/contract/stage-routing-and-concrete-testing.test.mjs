import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const STAGES = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const DOWNSTREAM_STAGES = STAGES.filter((stage) => stage !== "make-decision");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const json = (relative) => JSON.parse(read(relative));
const deps = (stage) => yaml.load(read(`workflows/${stage}/skill-deps.yaml`)).skills;
const names = (stage) => deps(stage).map(({ name }) => name);
const steps = (stage) => json(`workflows/${stage}/steps.json`).steps;
const stepSlugs = (stage) => steps(stage).map(({ step_slug }) => step_slug);
const evidenceKinds = (stage) => steps(stage).flatMap((step) =>
  step.completion_evidence.map(({ kind }) => kind)
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
      "spec-research", "spec-clarify", "spec-specify", "simplicity-guard", "plan-ceo-review",
      "ui-project-init", "design-source-readiness", "frontend-prototype-render",
      "plan-design-review", "wh-review", "spec-analyze", "stage-reflection",
    ]);
    expect(stepSlugs("build-spec")).toEqual(expect.arrayContaining([
      "conditional-spec-research", "spec-clarify", "spec-specify",
    ]));
    expect(stepSlugs("build-spec").indexOf("conditional-spec-research"))
      .toBeLessThan(stepSlugs("build-spec").indexOf("spec-clarify"));
    expect(stepSlugs("build-spec").indexOf("spec-clarify"))
      .toBeLessThan(stepSlugs("build-spec").indexOf("spec-specify"));
    expect(deps("build-spec").find(({ name }) => name === "spec-research"))
      .toMatchObject({ execution: "independent", trigger: "conditional_research", owner: "stage" });
    expect(deps("build-spec").find(({ name }) => name === "spec-clarify"))
      .toMatchObject({ execution: "inline", trigger: "spec_ambiguity", owner: "stage" });
    expect(deps("build-spec").find(({ name }) => name === "plan-design-review"))
      .toMatchObject({ execution: "independent", trigger: "ui_scope", owner: "stage" });
    expect(names("build-spec")).toContain("spec-analyze");
    expect(deps("build-spec").find(({ name }) => name === "spec-analyze"))
      .toMatchObject({ execution: "inline", trigger: "stage_end_consistency", owner: "stage" });
    expect(evidenceKinds("build-spec")).not.toContain("skill_invocation");
    expect(json("skills/wh-review/stage-skill-plan.json").stages["build-spec"].required_skills)
      .toEqual(["review"]);
  });

  it("keeps Talk and Grill owned exclusively by make-decision", () => {
    expect(names("make-decision")).toEqual([
      "talk-with-zhipeng", "grill-with-docs", "decision-log", "wh-review", "spec-analyze", "stage-reflection",
    ]);
    expect(stepSlugs("make-decision")).toEqual(expect.arrayContaining([
      "talk-round-1", "talk-round-2", "talk-round-3", "grill-with-docs",
    ]));
    for (const stage of DOWNSTREAM_STAGES) {
      expect(names(stage)).not.toContain("talk-with-zhipeng");
      expect(names(stage)).not.toContain("grill-with-docs");
      expect(stepSlugs(stage)).not.toContain("talk-with-zhipeng");
      expect(stepSlugs(stage)).not.toContain("grill-with-docs");
    }
  });

  it("keeps build-plan design-only and excludes concrete test execution", () => {
    expect(names("build-plan")).toEqual([
      "spec-research", "spec-plan", "simplicity-guard", "plan-eng-review",
      "testing-system-blueprint",
      "frontend-component-quality",
      "test-routing-advisor", "spec-tasks", "spec-analyze", "wh-review", "stage-reflection",
    ]);
    expect(deps("build-plan").find(({ name }) => name === "spec-research"))
      .toMatchObject({ execution: "independent", trigger: "real_research_question", owner: "stage" });
    for (const forbidden of ["backend-testing", "frontend-testing", "fullstack-slice-testing"])
      expect(names("build-plan")).not.toContain(forbidden);
    expect(evidenceKinds("build-plan")).not.toContain("test");
    expect(evidenceKinds("build-plan")).not.toContain("skill_invocation");
    expect(JSON.stringify(steps("build-plan"))).not.toContain("test_strategy");
    const skill = read("workflows/build-plan/SKILL.md");
    expect(skill).toMatch(/This stage owns only `plan\.md` and\s+`tasks\.md`/i);
    expect(skill).toMatch(/Do not implement code or execute RED\/GREEN/i);
    expect(skill).toMatch(/plan the test scenarios, commands,[\s\S]*for `build-code` to execute later/i);
    expect(read("workflows/build-spec/SKILL.md")).toMatch(/Do not run Talk or Grill in this stage/i);
    expect(json("skills/wh-review/stage-skill-plan.json").stages["build-plan"].required_skills)
      .toEqual(["review"]);
  });

  it("makes comments result explanations rather than a process index or gate", () => {
    const protocol = read("skills/workflowhub-host-protocol/SKILL.md");
    expect(protocol).toContain("Issue 评论只向人说明进展与结果");
    expect(protocol).toContain("评论是给人看的通知，不是第二套状态机");
    expect(protocol).toContain("不要求 receipt、评论模板或过程索引");
    expect(protocol).toContain("不要要求下游评论重复或证明上游的 Talk、Grill、调研与 review 过程");
    expect(protocol).toContain("`unavailable` 可以成为真实质量事实，但不是工作 gate");
  });

  it("lets every stage consume its declared portable packages directly", () => {
    for (const stage of STAGES) {
      for (const dependency of deps(stage)) {
        expect(dependency.owner, `${stage}/${dependency.name} must remain stage-owned`).toBe("stage");
        expect(["inline", "independent"]).toContain(dependency.execution);
        expect(dependency.trigger).toEqual(expect.any(String));
        expect(dependency).not.toHaveProperty("invocation");
        expect(dependency).not.toHaveProperty("dispatch");
        expect(dependency.path).toBe(`skills/${dependency.name}/SKILL.md`);
        expect(dependency.bundle).toBe(`skills/${dependency.name}/skill-bundle.json`);
        expect(fs.existsSync(path.join(root, dependency.path))).toBe(true);
        expect(fs.existsSync(path.join(root, dependency.bundle))).toBe(true);
      }
      expect(evidenceKinds(stage)).not.toContain("skill_invocation");
      expect(JSON.stringify(steps(stage))).not.toContain("invocation_key");
    }
    const protocol = read("skills/workflowhub-host-protocol/SKILL.md");
    expect(protocol).toContain("每个 Stage Agent 直接读取并执行 `workflows/<stage>/SKILL.md`");
    expect(protocol).toContain("直接读取该阶段 `skill-deps.yaml` 声明的 portable skill package");
  });

  it("starts downstream stages from the current four-material handoff", () => {
    const expectedInputs = {
      "build-spec": ["decision-log"],
      "build-plan": ["decision-log.md", "spec.md"],
      "build-code": ["decision-log.md", "spec.md", "plan.md", "tasks.md"],
      "verify-code": ["decision-log.md", "spec.md", "plan.md", "tasks.md"],
    };
    for (const [stage, materials] of Object.entries(expectedInputs)) {
      const firstStepInputs = JSON.stringify(json(`workflows/${stage}/steps.json`).steps[0].entry_conditions);
      for (const material of materials) expect(firstStepInputs, `${stage} must read ${material}`).toContain(material);
    }
    expect(read("skills/workflowhub-host-protocol/SKILL.md"))
      .toContain("阶段之间只通过当前 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 传递工作真相");
  });

  it("routes build-code against actual scope and directly uses one concrete testing package", () => {
    expect(names("build-code")).toEqual([
      "test-routing-advisor", "backend-testing", "frontend-testing",
      "frontend-component-quality",
      "fullstack-slice-testing", "wh-review", "spec-analyze", "stage-reflection",
    ]);
    expect(stepSlugs("build-code")).toContain("inspect-and-route-actual-tests");
    expect(stepSlugs("build-code")).toContain("invoke-concrete-testing-skill");
    expect(evidenceKinds("build-code")).not.toContain("skill_invocation");
    for (const skill of ["backend-testing", "frontend-testing", "fullstack-slice-testing"])
      expect(read(`skills/${skill}/SKILL.md`)).toMatch(/build-code/);
    expect(read("skills/testing-system-blueprint/SKILL.md")).toMatch(/build-plan[\s\S]*不是测试通过门/);
  });

  it("declares real build-code route facts while quality limits completion", () => {
    const buildCodeSteps = steps("build-code");
    expect(buildCodeSteps.find((step) => step.step_slug === "inspect-and-route-actual-tests")
      .completion_evidence.map(({ kind }) => kind)).toEqual(["changed_files", "test_routing", "stage_outcome"]);
    expect(buildCodeSteps.find((step) => step.step_slug === "run-tests")
      .completion_evidence.map(({ kind }) => kind)).toContain("test");
    expect(buildCodeSteps.find((step) => step.step_slug === "authenticate-current-task-completion").observable_result)
      .toMatch(/tasks\.md is marked completed only when actual changes, tests, AC evidence, and review dispositions support that claim/i);
    const skill = read("workflows/build-code/SKILL.md");
    expect(skill).toMatch(/findings\s+and\s+transport status are not a progression gate/i);
    expect(skill).toMatch(/limits the completion claim[\s\S]*allows same-task repair/i);
    expect(skill).toMatch(/final tests[\s\S]*AC trace[\s\S]*integration review/i);
    expect(skill).toMatch(/no important findings/i);
    expect(skill).toMatch(/never.*provider.*pass/i);
    const finalReview = buildCodeSteps.find((step) => step.step_slug === "final-integration-review");
    expect(finalReview).toBeDefined();
    expect(finalReview.order).toBeGreaterThan(buildCodeSteps.find((step) => step.step_slug === "run-tests").order);
    expect(stepSlugs("build-code").indexOf("stage-end-spec-analyze")).toBeGreaterThan(stepSlugs("build-code").indexOf("final-integration-review"));
  });

  it("declares a stage-outcome evidence binding on every step", () => {
    for (const stage of STAGES) {
      for (const step of steps(stage)) {
        const outcome = step.completion_evidence.find(({ kind }) => kind === "stage_outcome");
        expect(outcome, `${stage}/${step.step_slug} must declare stage outcome evidence`).toMatchObject({
          uri_or_path: `quality/evidence/stage-outcomes/${stage}/<sha256>.json`,
        });
      }
    }
  });

  it("allows an explicitly explained non-code route without pretending a concrete skill ran", () => {
    expect(read("workflows/build-code/SKILL.md")).toMatch(/may mark testing not applicable with a plain\s+reason/i);
  });

  it("keeps verify-code focused on current implementation code review", () => {
    const verify = read("workflows/verify-code/SKILL.md");
    expect(verify).toMatch(/只审查代码，不做材料审计、AC 覆盖审计或证据树审计/);
    expect(verify).toMatch(/真实入口、真实 consumer/);
    expect(verify).toMatch(/生命周期、并发、取消/);
    expect(verify).toMatch(/权限、安全边界/);
    expect(verify).not.toContain("stage-end-spec-analyze");
    expect(verify).not.toMatch(/逐条.*AC/);
  });

  it("uses four-material readiness while real quality facts limit only completion", () => {
    const protocol = read("skills/workflowhub-host-protocol/SKILL.md");
    expect(protocol).toContain("`build-code`：四材料可读即可在任务 worktree 实现、测试和修复");
    expect(protocol).toContain("`verify-code`：四材料可读即可做当前实现的代码、consumer、生命周期、安全和失败边界 review；不做逐 AC 或 evidence tree 审计。");
    expect(protocol).toContain("材料存在只证明可以工作，不证明质量完成");
    expect(protocol).toContain("不能阻止同一 task 修复");
  });
});
