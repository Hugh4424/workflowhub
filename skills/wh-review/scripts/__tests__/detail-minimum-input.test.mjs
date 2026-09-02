import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createSimpleReviewPacket, serializeProviderInput } from "../simple-review-runner.mjs";
import { validateDetailReviewInput } from "../review-materials.mjs";

const roots = [];
const revision = `revision-${"d".repeat(64)}`;
const decisionLog = "## 原始需求\n\n需要清楚的治理流程。\n\n## 决定\n\n采用最小修复。\n";
const validMaterials = {
  raw_requirement: "需要清楚的治理流程。",
  approved_direction: decisionLog,
  draft_spec_or_acceptance: "当前待审说明：错误要在 provider 前暴露。",
};
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("current detail review input boundary", () => {
  it("uses the public stage, track, host, and material fields", () => {
    const packet = createSimpleReviewPacket({
      stage: "make-decision",
      review_track: "detail",
      host_provider: "codex",
      materials: { decision: "current decision bytes" },
    });
    expect(packet).toMatchObject({ schema_version: "wh-review-simple-packet.v1", stage: "make-decision", review_track: "detail" });
    expect(packet.materials).toHaveLength(1);
  });

  it("serializes only the current simple review packet and ignores legacy task fields", () => {
    const packet = createSimpleReviewPacket({ stage: "make-decision", review_track: "detail", materials: { decision: "bytes" } });
    const bytes = serializeProviderInput({
      packet,
      host_provider: "codex",
      providers: ["reviewer/model"],
      review_mode: "single_round",
      task_path: "/legacy/task",
      project_name: "legacy-project",
      task_id: "legacy-task",
    });
    const encoded = bytes.toString("utf8");
    expect(encoded).toContain('"schema_version":"wh-review-provider-input.v1"');
    expect(encoded).not.toContain("legacy-task");
    expect(encoded).not.toContain("task_path");
  });

  it("keeps packet identity stable when re-created from the same current materials", () => {
    const input = { stage: "make-decision", review_track: "detail", materials: { decision: "bytes" } };
    expect(createSimpleReviewPacket(input).material_id).toBe(createSimpleReviewPacket(input).material_id);
    const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-detail-boundary-")));
    roots.push(root);
  });

  it.each([
    ["missing", { approved_direction: decisionLog, draft_spec_or_acceptance: "待审" }, /missing.*raw_requirement/i, revision],
    ["empty", { ...validMaterials, raw_requirement: " " }, /empty.*raw_requirement/i, revision],
    ["forbidden", { ...validMaterials, review_instructions: "caller supplied" }, /forbidden.*review_instructions/i, revision],
    ["type", { ...validMaterials, raw_requirement: 42 }, /type.*raw_requirement/i, revision],
    ["identity", { ...validMaterials, approved_direction: "旧的压缩方向" }, /identity.*approved_direction.*decision-log/i, revision],
    ["freshness", validMaterials, /freshness.*material revision/i, null],
  ])("rejects %s detail input before provider dispatch", (_name, materials, expected, currentMaterialRevision) => {
    expect(() => validateDetailReviewInput({ materials, currentDecisionLog: decisionLog, currentMaterialRevision })).toThrow(expected);
  });
});
