/**
 * human-confirmation.test.mjs — T011b (FR-D2-001)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  writeHumanConfirmation,
  readHumanConfirmation,
  isHumanConfirmed,
  humanConfirmationPathFor,
} from "../human-confirmation.mjs";

const TASK_ID = "wh-review-rebuild-test";
const STAGE = "build-plan";
const FLOW = "flow-abc123";

let root;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "human-confirmation-test-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("writeHumanConfirmation", () => {
  it("persists exactly approved_by/approved_at/stage/review_flow_id/total_round at the canonical path", () => {
    const record = writeHumanConfirmation({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 2,
      approvedBy: "hugh", taskTrackingRoot: root,
    });
    const path = humanConfirmationPathFor({ taskTrackingRoot: root, taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 2 });
    expect(existsSync(path)).toBe(true);
    expect(record.approved_by).toBe("hugh");
    expect(typeof record.approved_at).toBe("string");
    expect(record.stage).toBe(STAGE);
    expect(record.review_flow_id).toBe(FLOW);
    expect(record.total_round).toBe(2);
    // no verdict/awaiting_since fields — must not conflate with round-state "awaiting" semantics
    expect(record.verdict).toBeUndefined();
    expect(record.awaiting_since).toBeUndefined();

    const onDisk = JSON.parse(readFileSync(path, "utf8"));
    expect(onDisk).toEqual(record);
  });

  it("fails loud when approvedBy is empty", () => {
    expect(() =>
      writeHumanConfirmation({ taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 1, approvedBy: "", taskTrackingRoot: root })
    ).toThrow(FailLoudPattern());
  });

  it("fails loud on unsafe stage", () => {
    expect(() =>
      writeHumanConfirmation({ taskId: TASK_ID, stage: "not-a-stage", reviewFlowId: FLOW, totalRound: 1, approvedBy: "x", taskTrackingRoot: root })
    ).toThrow();
  });
});

describe("readHumanConfirmation", () => {
  it("returns null before approval", () => {
    const record = readHumanConfirmation({ taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 1, taskTrackingRoot: root });
    expect(record).toBeNull();
  });

  it("returns the persisted record after approval", () => {
    writeHumanConfirmation({ taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 3, approvedBy: "hugh", taskTrackingRoot: root });
    const record = readHumanConfirmation({ taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 3, taskTrackingRoot: root });
    expect(record.approved_by).toBe("hugh");
    expect(record.total_round).toBe(3);
  });
});

describe("isHumanConfirmed (AC8-3/AC8-4 sole basis for 'approved, safe to advance')", () => {
  it("false when no artifact exists yet", () => {
    expect(isHumanConfirmed({ taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 1, taskTrackingRoot: root })).toBe(false);
  });

  it("true when artifact exists and stage/review_flow_id/total_round all match", () => {
    writeHumanConfirmation({ taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 1, approvedBy: "hugh", taskTrackingRoot: root });
    expect(isHumanConfirmed({ taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 1, taskTrackingRoot: root })).toBe(true);
  });

  it("false when total_round does not match (new round since approval, gate re-armed)", () => {
    writeHumanConfirmation({ taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 1, approvedBy: "hugh", taskTrackingRoot: root });
    expect(isHumanConfirmed({ taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 2, taskTrackingRoot: root })).toBe(false);
  });

  it("false when review_flow_id does not match (new review flow, old approval stale)", () => {
    writeHumanConfirmation({ taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 1, approvedBy: "hugh", taskTrackingRoot: root });
    expect(isHumanConfirmed({ taskId: TASK_ID, stage: STAGE, reviewFlowId: "flow-different", totalRound: 1, taskTrackingRoot: root })).toBe(false);
  });
});

function FailLoudPattern() {
  return /non-empty string|approvedBy/;
}
