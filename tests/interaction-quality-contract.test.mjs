import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const stage = (name) => readFileSync(join(root, "workflows", name, "SKILL.md"), "utf8").replace(/\s+/g, " ");
const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];

describe("current-material workflow contracts", () => {
  it("makes the four current materials authoritative in every workflow", () => {
    for (const name of stages) {
      const skill = stage(name);
      expect(skill).toMatch(/decision-log\.md[\s\S]{0,220}spec\.md[\s\S]{0,220}plan\.md[\s\S]{0,220}tasks\.md/i);
    }
  });

  it("keeps accepted history audit-only and out of ordinary progress decisions", () => {
    for (const name of stages) {
      const skill = stage(name);
      expect(skill).toMatch(/(?:accepted|historical|old)[\s\S]{0,180}(?:audit|read-only)[\s\S]{0,220}(?:never|do not)[\s\S]{0,100}(?:license|authoriz|block|decide)/i);
    }
  });

  it("requires actual review facts without manufacturing a pass", () => {
    for (const name of stages) {
      const skill = stage(name);
      expect(skill).toMatch(/(?:unavailable|failed|invalid)/i);
      expect(skill).toMatch(/(?:never|do not)[\s\S]{0,180}pass/i);
    }
  });

  it("keeps formal completion fail-closed on stale current quality facts", () => {
    const buildCode = stage("build-code");
    const verifyCode = stage("verify-code");

    expect(buildCode).toMatch(/same current snapshot[\s\S]{0,320}current test evidence[\s\S]{0,320}integration review/i);
    expect(buildCode).toMatch(/stale, missing, or mismatched[\s\S]{0,160}publish no completion/i);
    expect(buildCode).toMatch(/material makes old quality facts stale[\s\S]{0,160}never becomes a work permit check/i);
    expect(verifyCode).toMatch(/current complete test command/i);
    expect(verifyCode).toMatch(/current materials/i);
    expect(verifyCode).toMatch(/failure never authorizes close/i);
  });

  it("forbids historical workflow machinery from replacing a current-material revision", () => {
    const buildSpec = stage("build-spec");
    const buildCode = stage("build-code");

    expect(buildSpec).toMatch(/Do not create replacement tasks, continuation chains, invalidations, rebinding, or recovery machinery/i);
    expect(buildCode).toMatch(/Do not create a successor, rebind, continuation, recovery bridge, synthetic checkpoint, or replacement task/i);
  });
});
