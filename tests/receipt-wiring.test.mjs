import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const workflows = [
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
