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
      "spec-research", "simplicity-guard", "plan-ceo-review",
      "ui-project-init", "design-source-readiness", "frontend-prototype-render",
      "plan-design-review", "wh-review", "spec-analyze", "stage-reflection", "stage-handoff",
    ]);
    expect(names("build-spec")).not.toEqual(expect.arrayContaining(["spec-clarify", "spec-specify"]));
    expect(deps("build-spec").find(({ name }) => name === "spec-research"))
      .toMatchObject({ execution: "independent", trigger: "conditional_research", owner: "stage" });
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
      "talk-with-zhipeng", "grill-with-docs", "decision-log", "deep-research", "wh-review", "spec-analyze", "stage-reflection", "stage-handoff",
    ]);
    expect(stepSlugs("make-decision")).toEqual(expect.arrayContaining([
      "research-and-diverge", "outline-talk", "module-convergence", "grill-with-docs",
    ]));
    expect(stepSlugs("make-decision").some((slug) => /^talk-round-\d+$/.test(slug))).toBe(false);
    for (const stage of DOWNSTREAM_STAGES) {
      expect(names(stage)).not.toContain("talk-with-zhipeng");
      expect(names(stage)).not.toContain("grill-with-docs");
      expect(stepSlugs(stage)).not.toContain("talk-with-zhipeng");
      expect(stepSlugs(stage)).not.toContain("grill-with-docs");
    }
  });

  it("keeps build-plan design-only and excludes concrete test execution", () => {
    expect(names("build-plan")).toEqual([
      "spec-research", "spec-clarify", "spec-specify", "spec-plan", "simplicity-guard", "plan-eng-review",
      "testing-system-blueprint",
      "frontend-component-quality",
      "test-routing-advisor", "spec-tasks", "spec-analyze", "wh-review", "stage-reflection", "stage-handoff",
    ]);
    expect(deps("build-plan").find(({ name }) => name === "spec-research"))
      .toMatchObject({ execution: "independent", trigger: "real_research_question", owner: "stage" });
    for (const forbidden of ["backend-testing", "frontend-testing", "fullstack-slice-testing"])
      expect(names("build-plan")).not.toContain(forbidden);
    expect(evidenceKinds("build-plan")).not.toContain("test");
    expect(evidenceKinds("build-plan")).not.toContain("skill_invocation");
    expect(JSON.stringify(steps("build-plan"))).not.toContain("test_strategy");
    const skill = read("workflows/build-plan/SKILL.md");
    expect(skill).toMatch(/For pre-cohort tasks[\s\S]{0,100}`plan\.md`\/`tasks\.md` contract/i);
    expect(skill).toMatch(/For post-cohort tasks[\s\S]{0,160}`spec\.md`[\s\S]{0,90}`phases\/P<n>\.md`[\s\S]{0,70}`phases\/index\.md`/i);
    expect(skill).toMatch(/No post-cohort plan\/tasks dual write/i);
    expect(skill).toMatch(/build-plan author writes a real[\s\S]*test and executes its scoped command to establish target RED/i);
    expect(skill).toMatch(/Build-code uses[\s\S]*same test GREEN/i);
    expect(read("workflows/build-spec/SKILL.md")).toMatch(/Do not run Talk or Grill in this stage/i);
    expect(json("skills/wh-review/stage-skill-plan.json").stages["build-plan"].required_skills)
      .toEqual(["review"]);
  });

  it("makes comments result explanations rather than a process index or gate", () => {
    const protocol = read("skills/workflowhub-host-protocol/SKILL.md");
    expect(protocol).toContain("评论是给人看的通知，不是第二套状态机");
    expect(protocol).toMatch(/不要\s+要求评论重复或证明 Talk、Grill、调研、review、session 或 stage outcome 过程/);
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
    expect(protocol).toContain("当前 WorkflowHub 会话在认证 task worktree 中读取并执行对应的");
    expect(protocol).toContain("`workflows/<stage>/SKILL.md` 和 `skill-deps.yaml`");
  });

  it("starts downstream stages from cohort-specific current materials", () => {
    const expectedInputs = {
      "build-spec": ["decision-log"],
      "build-plan": ["decision-log.md"],
      "build-code": ["decision-log.md", "spec.md", "phases/index.md", "phases/P<n>.md"],
      "verify-code": ["decision-log.md", "spec.md", "phases/index.md", "phases/P<n>.md"],
    };
    for (const [stage, materials] of Object.entries(expectedInputs)) {
      const firstStepInputs = JSON.stringify(json(`workflows/${stage}/steps.json`).steps[0].entry_conditions);
      for (const material of materials) expect(firstStepInputs, `${stage} must read ${material}`).toContain(material);
    }
    for (const stage of ["build-code", "verify-code"]) {
      const firstStepInputs = JSON.stringify(json(`workflows/${stage}/steps.json`).steps[0].entry_conditions);
      expect(firstStepInputs).not.toContain('"uri_or_path":"plan.md"');
      expect(firstStepInputs).not.toContain('"uri_or_path":"tasks.md"');
      expect(read(`workflows/${stage}/SKILL.md`)).toMatch(/pre\/history[\s\S]{0,130}`plan\.md`[\s\S]{0,55}`tasks\.md`/i);
    }
  });

  it("routes build-code against actual scope and directly uses one concrete testing package", () => {
    expect(names("build-code")).toEqual([
      "test-routing-advisor", "backend-testing", "frontend-testing",
      "frontend-component-quality",
      "fullstack-slice-testing", "spec-analyze", "stage-reflection", "stage-handoff",
    ]);
    expect(names("build-code")).not.toContain("wh-review");
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
      .completion_evidence.map(({ kind }) => kind)).toEqual(["changed_files", "test_routing"]);
    expect(buildCodeSteps.find((step) => step.step_slug === "run-tests")
      .completion_evidence.map(({ kind }) => kind)).toContain("test");
    expect(buildCodeSteps.find((step) => step.step_slug === "authenticate-current-task-completion").observable_result)
      .toMatch(/current task facts is marked completed only when actual changes, tests, AC evidence, and review dispositions support that claim/i);
    expect(buildCodeSteps.find((step) => step.step_slug === "authenticate-current-task-completion").completion_evidence)
      .not.toContainEqual(expect.objectContaining({ uri_or_path: "tasks.md" }));
    expect(read("workflows/build-code/SKILL.md")).toMatch(/For pre\/history,[\s\S]*task card's `执行状态填写区`/i);
    expect(read("workflows/build-code/SKILL.md")).toMatch(/For post,[\s\S]*task facts\/quality evidence/i);
    const skill = read("workflows/build-code/SKILL.md");
    expect(skill).toMatch(/findings\s+and\s+transport status are not a progression gate/i);
    expect(skill).toMatch(/limits the completion claim[\s\S]*allows same-task repair/i);
    expect(skill).toMatch(/final test[\s\S]*AC facts[\s\S]*stage-end-spec-analyze/i);
    expect(skill).toMatch(/Historical integration review outcomes stay visible but[\s\S]*do not require a new dispatch/i);
    expect(skill).toMatch(/Completion:\s*no finding is unexplained/i);
    expect(skill).toMatch(/never.*provider.*pass/i);
    expect(stepSlugs("build-code")).not.toContain("final-integration-review");
    expect(stepSlugs("build-code")).not.toContain("integration-review");
    const phaseReview = buildCodeSteps.find((step) => step.step_slug === "review-change");
    expect(phaseReview.observable_result).toMatch(/review_scope=phase/);
    expect(phaseReview.order).toBeGreaterThan(buildCodeSteps.find((step) => step.step_slug === "run-tests").order);
    const aggregate = buildCodeSteps.find((step) => step.step_slug === "run-final-aggregate-and-ac-trace");
    expect(aggregate.completion_evidence.map(({ kind }) => kind)).toContain("test");
    expect(aggregate.order).toBeGreaterThan(phaseReview.order);
    expect(stepSlugs("build-code").indexOf("stage-end-spec-analyze")).toBeGreaterThan(stepSlugs("build-code").indexOf(aggregate.step_slug));
    const verifySteps = steps("verify-code");
    const finalReview = verifySteps.find((step) => step.step_slug === "ocr-code-review");
    expect(finalReview.observable_result).toMatch(/一次 OCR 独立代码审查/);
    expect(verifySteps.find((step) => step.step_slug === "publish-code-review-fact").observable_result)
      .toMatch(/code_review 质量事实/);
  });

  it("does not make an external stage outcome part of any active step contract", () => {
    for (const stage of STAGES) {
      for (const step of steps(stage)) {
        const outcome = step.completion_evidence.find(({ kind }) => kind === "stage_outcome");
        expect(outcome, `${stage}/${step.step_slug} must not require external stage outcome evidence`).toBeUndefined();
      }
    }
  });

  it("allows an explicitly explained non-code route without pretending a concrete skill ran", () => {
    expect(read("workflows/build-code/SKILL.md")).toMatch(/may mark testing not applicable with a plain\s+reason/i);
  });

  it("keeps verify-code focused on implementation while checking original-requirement drift", () => {
    const verify = read("workflows/verify-code/SKILL.md");
    expect(verify).toMatch(/原始需求|原话/);
    expect(verify).toMatch(/遗漏|错绑|强度/);
    expect(verify).toMatch(/真实入口、真实 consumer/);
    expect(verify).toMatch(/生命周期、并发、取消/);
    expect(verify).toMatch(/权限、安全边界/);
    expect(verify).not.toContain("stage-end-spec-analyze");
  });

  it("uses four-material readiness while real quality facts limit only completion", () => {
    const protocol = read("skills/workflowhub-host-protocol/SKILL.md");
    expect(protocol).toContain("`build-code`：四材料可读即可在任务 worktree 实现、测试和修复");
    expect(protocol).toContain("`verify-code`：四材料可读即可审查当前实现");
    expect(protocol).toContain("材料存在只证明可以工作，不证明质量完成");
    expect(protocol).toMatch(/不阻止同一 task\s+修复/);
  });

  it("T003 routes build-plan through exactly one merged review and rejects old split review/analyze consumers", () => {
    const planned = names("build-plan");
    expect(planned.filter((name) => name === "wh-review")).toEqual(["wh-review"]);
    expect(stepSlugs("build-plan")).toContain("merged-review");
    expect(stepSlugs("build-plan")).not.toContain("plan-design-review");
    expect(stepSlugs("build-plan")).not.toContain("plan-eng-review");
    expect(read("workflows/build-plan/SKILL.md"))
      .toMatch(/only concrete failure[\s\S]*changed[\s\S]*retry/i);
  });
});
