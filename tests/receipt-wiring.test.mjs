import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const workflows = [
  {
    stage: "make-decision",
    path: "workflows/make-decision/SKILL.md",
    stageResultMarker: "## Produce a stage-result",
  },
  {
    stage: "build-spec",
    path: "workflows/build-spec/SKILL.md",
    stageResultMarker: "## Produce a stage-result",
  },
  {
    stage: "build-plan",
    path: "workflows/build-plan/SKILL.md",
    stageResultMarker: "## Produce a stage-result",
  },
  {
    stage: "build-code",
    path: "workflows/build-code/SKILL.md",
    stageResultMarker: "write the final stage-result to",
    nextStageMarker: "proceed automatically into `verify-code`",
  },
  {
    stage: "verify-code",
    path: "workflows/verify-code/SKILL.md",
    stageResultMarker: "### 12. stage-result 落盘",
  },
];

describe("receipt wiring in workflow skills", () => {
  for (const workflow of workflows) {
    it(`${workflow.stage} calls verifyReceipts after stage-result write`, () => {
      const content = readFileSync(resolve(workflow.path), "utf8");
      const markerIndex = content.indexOf(workflow.stageResultMarker);
      const receiptIndex = content.indexOf("verifyReceipts", markerIndex);

      expect(markerIndex, `${workflow.path} stage-result marker`).toBeGreaterThanOrEqual(0);
      expect(receiptIndex, `${workflow.path} verifyReceipts call`).toBeGreaterThan(markerIndex);
      expect(content).toContain("../../scripts/validate-stage-result.mjs");
      expect(content).toContain(`verifyReceipts("${workflow.stage}"`);
      expect(content).toContain("process.exit(1)");
      if (workflow.nextStageMarker) {
        const nextStageIndex = content.indexOf(workflow.nextStageMarker, markerIndex);
        expect(nextStageIndex, `${workflow.path} next-stage marker`).toBeGreaterThan(receiptIndex);
      }
    });
  }
});

describe("build-code committed-diff receipt base", () => {
  it("requires WORKFLOWHUB_DIFF_BASE and passes baseRef to verifyReceipts", () => {
    const content = readFileSync(resolve("workflows/build-code/SKILL.md"), "utf8");
    expect(content).toContain("WORKFLOWHUB_DIFF_BASE");
    expect(content).toContain("const baseRef = process.env.WORKFLOWHUB_DIFF_BASE");
    expect(content).toContain('verifyReceipts("build-code", "<stageResultPath>", "<worktreeRoot>", { baseRef })');
  });
});

describe("Phase 2 observed-fact receipt wiring", () => {
  for (const workflow of workflows) {
    it(`${workflow.stage} writes manifest-bound entry and exit receipts with one shared attempt identity`, () => {
      const content = readFileSync(resolve(workflow.path), "utf8");
      expect(content).toContain("writeEntryReceipt");
      expect(content).toContain("writeExitReceipt");
      expect(content).toContain("workflow_run_id");
      expect(content).toContain("attempt_id");
      expect(content).toContain("step_id");
    });
  }
});

describe("single final implementation commit wiring", () => {
  const earlyStages = ["build-spec", "build-plan", "make-decision"];

  it.each(earlyStages)("forbids commit or merge until the final gate", (stage) => {
    const content = readFileSync(resolve(`workflows/${stage}/SKILL.md`), "utf8");
    expect(content).toContain("审查修复完成");
    expect(content).toContain("`git add`");
    expect(content).toContain("`git commit`");
    expect(content).toContain("`git merge`");
    expect(content).not.toContain(`workflowhub(${stage})`);
    expect(content).toContain("published semantic `pass`");
    expect(content).toContain("`verify-final`");
    expect(content).toContain("人工明确确认继续");
    expect(content).toContain('workflowhub(verify-code): finalize {task-id}');
  });

  it("places the ordinary commit after verify-final and explicit human confirmation", () => {
    const content = readFileSync(resolve("workflows/verify-code/SKILL.md"), "utf8");
    const verifyFinal = content.indexOf("wh-review-cli.mjs verify-final");
    const confirmation = content.indexOf("User confirms（选择\"继续\"）");
    const commit = content.indexOf('git add -A && git commit -m "workflowhub(verify-code): finalize {task-id}"');

    expect(verifyFinal).toBeGreaterThanOrEqual(0);
    expect(confirmation).toBeGreaterThan(verifyFinal);
    expect(commit).toBeGreaterThan(confirmation);
  });
});
