import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const readStage = (stage) => readFileSync(join(root, "workflows", stage, "SKILL.md"), "utf8");

describe("five-stage v2 business contract", () => {
  it.each(stages)("%s has valid identity and one TaskContext bootstrap", (stage) => {
    const skill = readStage(stage);
    expect(skill).toMatch(new RegExp(`^---[\\s\\S]*name: ${stage}[\\s\\S]*version: 2\\.0\\.0[\\s\\S]*---`));
    expect(skill).toContain("core/stage-context.mjs");
    expect(skill).toContain(`bootstrapStage(\"${stage}\"`);
    expect(skill).toContain("StageContext");
    expect(skill).not.toMatch(/parseTaskDir|resolveTaskRecordPaths|task_tracking_root|worktree\.json/);
  });

  it("keeps human confirmation and visible quality facts without an automatic quality gate", () => {
    for (const stage of stages) {
      const skill = readStage(stage);
      expect(skill).toMatch(/human\s+(?:confirmation|decision)|user|用户|人工/i);
    }
    expect(readStage("make-decision")).toMatch(/Quality facts are recorded, not converted into automatic quality gates/i);
    expect(readStage("build-code")).toMatch(/Before each phase[\s\S]*human confirmation/i);
    expect(readStage("verify-code")).toMatch(/Quality failures remain visible facts/i);
  });

  it("keeps named design artifacts and component isolation", () => {
    expect(readStage("build-spec")).toMatch(/spec\.md[\s\S]*ArtifactDir/i);
    expect(readStage("build-plan")).toMatch(/spec\.md[\s\S]*plan\.md[\s\S]*tasks\.md/i);
    expect(readStage("build-code")).toMatch(/spec\.md[\s\S]*plan\.md[\s\S]*tasks\.md/i);
    for (const stage of ["build-spec", "build-plan", "build-code"]) {
      expect(readStage(stage)).toMatch(/frozen|controlled|ArtifactDir/i);
    }
  });

  it("keeps independent review, fresh tests, browser QA, and confirmed close", () => {
    expect(readStage("make-decision")).toMatch(/independent direction review/i);
    expect(readStage("build-code")).toMatch(/independent code review[\s\S]*fresh test/i);
    expect(readStage("verify-code")).toMatch(/isolated-browser-qa[\s\S]*independent verification review/i);
    expect(readStage("verify-code")).toMatch(/hashed close plan[\s\S]*user/i);
  });

  it("uses append-only attempts and accepted lineage instead of mutable stage results", () => {
    for (const stage of stages) expect(readStage(stage)).toMatch(/append-only|attempt/i);
    for (const stage of stages.slice(1)) expect(readStage(stage)).toMatch(/accepted/i);
    for (const stage of stages) expect(readStage(stage)).not.toMatch(/stage-result-[a-z-]+\.json/);
  });
});
