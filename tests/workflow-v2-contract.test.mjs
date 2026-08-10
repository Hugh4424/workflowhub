import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const materials = ["decision-log.md", "spec.md", "plan.md", "tasks.md"];
const readStage = (stage) => readFileSync(join(root, "workflows", stage, "SKILL.md"), "utf8");
const hasAny = (text, patterns) => patterns.some((pattern) => pattern.test(text));

function expectConcept(text, patterns, label) {
  expect(hasAny(text, patterns), label).toBe(true);
}

function expectFourMaterials(text, stage) {
  for (const material of materials) expect(text, `${stage}: ${material}`).toContain(material);
}

describe("five-stage current-material contract", () => {
  it.each(stages)("%s has a current skill identity", (stage) => {
    const skill = readStage(stage);
    expect(skill).toMatch(new RegExp(`^---[\\s\\S]*name: ${stage}[\\s\\S]*version: [0-9]+\\.[0-9]+\\.[0-9]+[\\s\\S]*---`));
  });

  it("uses the four materials as the current work authority", () => {
    for (const stage of stages) expectFourMaterials(readStage(stage), stage);

    for (const stage of ["build-spec", "build-plan"]) {
      expectConcept(readStage(stage), [
        /only current work truth/i,
        /only current (?:work )?authority/i,
      ], `${stage}: current materials are authoritative`);
    }
    expectConcept(readStage("build-code"), [
      /only these current materials define the work/i,
    ], "build-code: current materials define work");
    expectConcept(readStage("verify-code"), [
      /当前 task 的以下四份材料存在且可读，就直接开始或继续验收/,
    ], "verify-code: readable materials permit work");
  });

  it("keeps old facts read-only and outside work eligibility", () => {
    const decision = readStage("make-decision");
    const code = readStage("build-code");
    const verify = readStage("verify-code");

    expectConcept(decision, [/audit facts only/i], "make-decision: old facts are audit-only");
    expectConcept(decision, [/neither authorize nor\s+block/i], "make-decision: old facts are not permits");
    expectConcept(code, [/facts, not work permits/i], "build-code: auxiliary facts are not permits");
    expectConcept(code, [/never freeze implementation or same-task\s+repair/i], "build-code: old facts cannot freeze work");
    expectConcept(verify, [/只作背景，不是工作许可证/], "verify-code: old facts are background only");
    expectConcept(verify, [/不能冻结.*同 task 修复/s], "verify-code: old facts cannot freeze repair");
  });

  it("keeps Talk, Clarify, research, and Grill owned by make-decision", () => {
    const decision = readStage("make-decision");
    for (const dependency of ["talk-with-zhipeng", "grill-with-docs", "decision-log", "wh-review"]) {
      expect(decision).toContain(dependency);
    }
    expectConcept(decision, [/Do not invent user answers/i], "make-decision: confirmation is real");
    expectConcept(decision, [/Research only when the answer could materially change/i], "make-decision: research is proportional");

    const plan = readStage("build-plan");
    expectConcept(plan, [/Do not run Talk, Clarify, or Grill/i], "build-plan: decision activities stay upstream");
    expectConcept(plan, [/Trace every decision, FR, and AC/i], "build-plan: implementation traceability remains");
    expectConcept(plan, [/obtain the user's actual reply[\s\S]{0,120}before claiming/i], "build-plan: normal confirmation remains real");
    expect(plan).not.toMatch(/Do not invent or claim to obtain the user's actual reply/i);
    expectConcept(plan, [/does not turn confirmation\s+into a machine work permit/i], "build-plan: confirmation is not work eligibility");
  });

  it("keeps one minimal task status inside tasks.md instead of a runtime ledger", () => {
    const skill = readFileSync(join(root, "skills", "spec-tasks", "SKILL.md"), "utf8");
    const template = readFileSync(join(root, "skills", "spec-tasks", "templates", "tasks-template.md"), "utf8");
    expect(skill).toMatch(/`status`[\s\S]*`pending`, `in_progress`, or `completed`/);
    expect(skill).toMatch(/sole current material for task-card details|authoritative `tasks\.md` material/);
    expect(skill).toMatch(/Do not add workflow summaries[\s\S]*second\s+completion ledger/i);
    expect(template.match(/- \*\*status\*\*：`pending`/g)).toHaveLength(3);
    expect(template.match(/- \*\*执行事实\*\*：N\/A — not started/g)).toHaveLength(3);
  });

  it("records unavailable review honestly without turning it into pass", () => {
    for (const stage of stages) {
      const skill = readStage(stage);
      expect(skill, `${stage}: records unavailable`).toContain("unavailable");
      expectConcept(skill, [
        /unavailable[\s\S]{0,140}(?:never|not)[\s\S]{0,40}`?pass`?/i,
        /Never turn[\s\S]{0,100}quality evidence[\s\S]{0,80}`?pass`?/i,
        /unavailable[\s\S]{0,140}(?:绝不是|不能)[\s\S]{0,40}`?pass`?/i,
      ], `${stage}: unavailable is not pass`);
    }
  });

  it("separates completion claims from permission to continue work", () => {
    const expectations = {
      "make-decision": [/limit only the\s+completion claim/i, /do\s+not\s+prevent continued Talk/i],
      "build-spec": [/lowers the completion claim/i, /continue drafting or\s+repairing this same task/i],
      "build-plan": [/lowers the completion claim/i, /continue research, planning, or repair in this\s+same task/i],
      "build-code": [/limits the completion claim/i, /still allows same-task repair and the\s+next safe work item/i],
      "verify-code": [/缺质量事实只限制完成声明/, /不限制继续验收和修复/],
    };

    for (const [stage, concepts] of Object.entries(expectations)) {
      const skill = readStage(stage);
      for (const concept of concepts) expectConcept(skill, [concept], `${stage}: completion/work split`);
    }
  });

  it("repairs the same task instead of creating replacement or continuation tasks", () => {
    const sameTaskContracts = {
      "make-decision": [/continue in the same task/i],
      "build-spec": [/does not create a new task/i],
      "build-plan": [/does not create a new task/i],
      "build-code": [/never require a new task/i],
      "verify-code": [/不能触发新建[\s\S]*(?:successor|continuation) task/i, /回同一 task 修复，不新建任务/],
    };

    for (const [stage, alternatives] of Object.entries(sameTaskContracts)) {
      expectConcept(readStage(stage), alternatives, `${stage}: same-task repair without replacement`);
    }
  });

  it("keeps context and the atomic-step inventory free of retired progression permits", () => {
    const context = readFileSync(join(root, "CONTEXT.md"), "utf8");
    const inventory = readFileSync(join(root, "docs/stage-atomic-step-inventory.md"), "utf8");
    expect(context).toMatch(/历史恢复记录（仅审计）/);
    expect(context).toMatch(/不授权、阻止或改变普通工作/);
    expect(context).not.toMatch(/Phase pointer 等业务状态恢复仍使用恢复代次/);
    expect(context).not.toMatch(/在通过\*\*恢复门禁\*\*后才可成为当前事实/);
    expect(inventory).not.toMatch(/controlled build-code reopen|plan-hash-bound operation|automatic acceptance/i);
    expect(inventory).toMatch(/never creates a reopen or recovery permit/i);
  });

  it("keeps integration review independent of an accepted checkpoint", () => {
    const adr = readFileSync(join(root, "docs/adr/0007-phase-and-integration-review-material-architecture.md"), "utf8");
    expect(adr).toMatch(/当前四份材料、当前代码树、fresh test/);
    expect(adr).toMatch(/不再\s*要求 accepted build-plan checkpoint/);
    expect(adr).toMatch(/不成为编辑、修复或进入下一阶段的许可门槛/);
    expect(adr).not.toMatch(/必须从 accepted build-plan checkpoint/);
  });
});
