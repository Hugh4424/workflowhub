import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const readStage = (stage) => readFileSync(join(root, "workflows", stage, "SKILL.md"), "utf8");
const compact = (text) => text.replace(/\s+/g, " ");

describe("five-stage current-material contract", () => {
  it.each(stages)("%s has a current skill identity", (stage) => {
    const skill = readStage(stage);
    expect(skill).toMatch(new RegExp(`^---[\\s\\S]*name: ${stage}[\\s\\S]*version: [0-9]+\\.[0-9]+\\.[0-9]+[\\s\\S]*---`));
  });

  it("makes current materials authoritative and historical records audit-only", () => {
    for (const stage of stages) {
      const skill = readStage(stage);
      expect(skill, stage).toMatch(/current (?:four )?materials/i);
      expect(skill, stage).toMatch(/audit/i);
    }
    expect(compact(readStage("build-code"))).toMatch(/never authorize or block ordinary implementation/i);
    expect(compact(readStage("verify-code"))).toMatch(/never block a new verification attempt/i);
  });

  it("keeps real decisions, review, and human confirmation where they matter", () => {
    const decision = readStage("make-decision");
    expect(decision).toMatch(/real `talk-with-zhipeng` conversation/i);
    expect(decision).toMatch(/Research only when it can materially change/i);
    expect(decision).toMatch(/independent review through `wh-review`/i);
    expect(decision).toMatch(/real human answer/i);

    const plan = readStage("build-plan");
    expect(plan).toMatch(/every FR\/AC/i);
    expect(plan).toMatch(/independent `wh-review`/i);
    expect(plan).toMatch(/explicit user accept or reject/i);
  });

  it("keeps specification ambiguity, review, and revision honest", () => {
    const spec = readStage("build-spec");
    expect(spec).toMatch(/material ambiguity/i);
    expect(spec).toMatch(/one independent `wh-review`/i);
    expect(spec).toMatch(/Never loop reviews to manufacture a pass/i);
    expect(spec).toMatch(/current-material revision note/i);
  });

  it("keeps implementation scoped to current tasks and uses proportionate tests", () => {
    const code = readStage("build-code");
    expect(code).toMatch(/Tasks\.md is the only Task completion authority/i);
    expect(code).toMatch(/focused test command/i);
    expect(compact(code)).toMatch(/`build-code` does not require the complete regression command.*final `verify-code` boundary/i);
    expect(code).toMatch(/one independent `wh-review` for the completed Phase/i);
    expect(compact(code)).toMatch(/does not stop the same task or the next Task/i);
    expect(compact(code)).toMatch(/Do not create a successor, rebind, continuation, recovery bridge, synthetic checkpoint, or replacement task/i);
  });

  it("keeps verification independent, per-AC, and separately authorized for close", () => {
    const verify = readStage("verify-code");
    expect(verify).toMatch(/complete-test fact/i);
    expect(verify).toMatch(/every applicable acceptance criterion/i);
    expect(verify).toMatch(/one independent `wh-review` semantic\/code review/i);
    expect(verify).toMatch(/normal verify-code confirmation/i);
    expect(verify).toMatch(/separate explicit authorization/i);
    expect(verify).toMatch(/Keep it simple/i);
  });

  it("forbids old history from becoming a normal-work permit", () => {
    expect(compact(readStage("build-spec"))).toMatch(/Do not create replacement tasks, continuation chains, invalidations, rebinding, or recovery machinery to revise a current specification/i);
    expect(compact(readStage("build-code"))).toMatch(/Do not create a successor, rebind, continuation, recovery bridge, synthetic checkpoint, or replacement task/i);
    expect(compact(readStage("verify-code"))).toMatch(/Do not create another task or any historical-evidence progression mechanism/i);
  });

  it("keeps active context and step inventory free of retired progression permits", () => {
    const context = readFileSync(join(root, "CONTEXT.md"), "utf8");
    const inventory = readFileSync(join(root, "docs/stage-atomic-step-inventory.md"), "utf8");
    expect(context).toMatch(/历史恢复记录（仅审计）/);
    expect(context).toMatch(/不授权、阻止或改变普通工作/);
    expect(context).not.toMatch(/Phase pointer 等业务状态恢复仍使用恢复代次/);
    expect(context).not.toMatch(/在通过\*\*恢复门禁\*\*后才可成为当前事实/);
    expect(inventory).not.toMatch(/controlled build-code reopen|plan-hash-bound operation|automatic acceptance/i);
    expect(inventory).toMatch(/never creates a reopen or recovery permit/i);
  });

  it("does not make integration review depend on an accepted checkpoint", () => {
    const adr = readFileSync(join(root, "docs/adr/0007-phase-and-integration-review-material-architecture.md"), "utf8");
    expect(adr).toMatch(/当前四份材料、当前代码树、fresh test/);
    expect(adr).toMatch(/不再\s*要求 accepted build-plan checkpoint/);
    expect(adr).toMatch(/不成为编辑、修复或进入下一阶段的许可门槛/);
    expect(adr).not.toMatch(/必须从 accepted build-plan checkpoint/);
  });
});
