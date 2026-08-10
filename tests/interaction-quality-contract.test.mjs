import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  deriveStageCompletion,
  deriveStageProgress,
} from "../runtime/stage/completion-predicates.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
const stage = (name) => readFileSync(join(root, "workflows", name, "SKILL.md"), "utf8");
const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const materials = {
  "decision-log.md": "current decision",
  "spec.md": "current specification",
  "plan.md": "current plan",
  "tasks.md": "current tasks",
};

const unavailableReview = [{
  authenticated: true,
  freshness: { status: "stale" },
  fact: {
    ref: "quality/reviews/unavailable.json",
    stage: "build-code",
    subject: "integration_review",
    kind: "review",
    status: "unavailable",
  },
}];

describe("current-material workflow contracts", () => {
  it("lists the four authoritative materials in every workflow", () => {
    for (const name of stages) {
      const skill = stage(name);
      for (const material of Object.keys(materials)) expect(skill, `${name}: ${material}`).toContain(material);
    }
  });

  it("derives work eligibility from current materials, not old quality facts", () => {
    const progress = deriveStageProgress("build-code", unavailableReview, materials);

    expect(progress).toMatchObject({
      work_status: "ready",
      work_authority: "current-four-materials-and-plan-tasks",
      readiness_source: "current-material-presence",
      missing_materials: [],
    });
  });

  it("keeps formal completion separate from work eligibility", () => {
    const readiness = deriveStageProgress("build-code", unavailableReview, materials);
    expect(readiness.work_status).toBe("ready");
    expect(readiness).not.toHaveProperty("status");
    expect(deriveStageCompletion("build-code", unavailableReview)).toMatchObject({
      status: "in_progress",
      missing: expect.arrayContaining(["integration_review"]),
    });
  });

  it("waits only for a required current material when work is not ready", () => {
    const progress = deriveStageProgress("build-code", unavailableReview, {
      ...materials,
      "tasks.md": "",
    });

    expect(progress).toMatchObject({
      work_status: "blocked_by_missing_material",
      missing_materials: ["tasks.md"],
    });
  });

  it("does not let an unavailable review become pass or stop same-task repair", () => {
    const docs = [stage("build-spec"), stage("build-plan"), stage("build-code"), stage("verify-code")];

    for (const skill of docs) {
      expect(skill).toContain("unavailable");
      expect(skill).toMatch(/same task|same-task|同一 task/i);
    }
    expect(stage("build-code")).toMatch(/`unavailable` is never `pass`/i);
    expect(stage("verify-code")).toMatch(/`unavailable` 绝不是 `pass`/i);
  });

  it("continues the same task instead of creating a replacement task", () => {
    expect(stage("build-spec")).toMatch(/does not create a new task/i);
    expect(stage("build-plan")).toMatch(/does not create a new task/i);
    expect(stage("build-code")).toMatch(/never require a new task/i);
    expect(stage("verify-code")).toMatch(/回同一 task 修复，不新建任务/);
  });
});
