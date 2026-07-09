/**
 * snapshot-writer.test.mjs — T010b (FR-WHREVIEW-006, Contract 10 / Contract 12)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  writeDocSnapshot,
  readDocSnapshot,
  docSnapshotPathFor,
  computeDocSnapshotDiff,
  unifiedTextDiff,
  writeMaterialsBaseline,
  readMaterialsBaseline,
  materialsBaselinePathFor,
  materialsSnapshotPathFor,
} from "../snapshot-writer.mjs";

const TASK_ID = "wh-review-rebuild-test";
const STAGE = "build-code";
const FLOW = "flow-abc123";

let root;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "snapshot-writer-test-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("doc snapshot (Contract 10)", () => {
  it("writes and reads back a snapshot at the canonical path", () => {
    const { path } = writeDocSnapshot({
      taskId: TASK_ID,
      doc: "spec",
      reviewFlowId: FLOW,
      totalRound: 1,
      content: "# spec v1\ncontent\n",
      taskTrackingRoot: root,
    });
    expect(path).toBe(docSnapshotPathFor({ taskTrackingRoot: root, taskId: TASK_ID, doc: "spec", reviewFlowId: FLOW, totalRound: 1 }));
    expect(existsSync(path)).toBe(true);
    const read = readDocSnapshot({ taskId: TASK_ID, doc: "spec", reviewFlowId: FLOW, totalRound: 1, taskTrackingRoot: root });
    expect(read).toBe("# spec v1\ncontent\n");
  });

  it("fails loud when writing over an existing snapshot (immutability)", () => {
    writeDocSnapshot({ taskId: TASK_ID, doc: "spec", reviewFlowId: FLOW, totalRound: 1, content: "v1", taskTrackingRoot: root });
    expect(() =>
      writeDocSnapshot({ taskId: TASK_ID, doc: "spec", reviewFlowId: FLOW, totalRound: 1, content: "v2", taskTrackingRoot: root })
    ).toThrow(/immutable/);
  });

  it("fails loud reading a snapshot that was never written", () => {
    expect(() =>
      readDocSnapshot({ taskId: TASK_ID, doc: "spec", reviewFlowId: FLOW, totalRound: 1, taskTrackingRoot: root })
    ).toThrow(/not found/);
  });
});

describe("unifiedTextDiff", () => {
  it("marks unchanged lines as context, changed lines as -/+", () => {
    const diff = unifiedTextDiff("line1\nline2\nline3", "line1\nchanged\nline3");
    expect(diff).toContain("  line1");
    expect(diff).toContain("- line2");
    expect(diff).toContain("+ changed");
    expect(diff).toContain("  line3");
  });
});

describe("computeDocSnapshotDiff (Contract 10, total_round>=2)", () => {
  it("diffs round(N-1) snapshot against current content", () => {
    writeDocSnapshot({ taskId: TASK_ID, doc: "spec", reviewFlowId: FLOW, totalRound: 1, content: "line1\nline2\n", taskTrackingRoot: root });
    const diff = computeDocSnapshotDiff({
      taskId: TASK_ID,
      doc: "spec",
      reviewFlowId: FLOW,
      totalRound: 2,
      currentContent: "line1\nline2-changed\n",
      taskTrackingRoot: root,
    });
    expect(diff).toContain("- line2");
    expect(diff).toContain("+ line2-changed");
  });

  it("fails loud when round(N-1) snapshot is missing (no silent full-text fallback)", () => {
    expect(() =>
      computeDocSnapshotDiff({
        taskId: TASK_ID,
        doc: "spec",
        reviewFlowId: FLOW,
        totalRound: 2,
        currentContent: "whatever",
        taskTrackingRoot: root,
      })
    ).toThrow(/not found/);
  });

  it("rejects total_round<2", () => {
    expect(() =>
      computeDocSnapshotDiff({
        taskId: TASK_ID,
        doc: "spec",
        reviewFlowId: FLOW,
        totalRound: 1,
        currentContent: "whatever",
        taskTrackingRoot: root,
      })
    ).toThrow(/total_round>=2/);
  });
});

describe("materials baseline (Contract 12)", () => {
  it("writes JSON metadata + full-text snapshot, and reads them back together", () => {
    const { jsonPath, snapshotPath, record } = writeMaterialsBaseline({
      taskId: TASK_ID,
      stage: STAGE,
      reviewFlowId: FLOW,
      totalRound: 1,
      gitSha: "abc123",
      materialsContent: "diff --git a/foo.js b/foo.js\n+added line\n",
      coveredPaths: ["foo.js"],
      taskTrackingRoot: root,
    });

    expect(jsonPath).toBe(materialsBaselinePathFor({ taskTrackingRoot: root, taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 1 }));
    expect(snapshotPath).toBe(materialsSnapshotPathFor({ taskTrackingRoot: root, taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 1 }));
    expect(existsSync(jsonPath)).toBe(true);
    expect(existsSync(snapshotPath)).toBe(true);
    expect(record.git_sha).toBe("abc123");
    expect(record.covered_paths).toEqual(["foo.js"]);
    expect(record.materials_content_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(record.materials_snapshot_path).toBe(`reviews/snapshots/materials-${STAGE}-${FLOW}-r1.txt`);

    const baseline = readMaterialsBaseline({ taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 1, taskTrackingRoot: root });
    expect(baseline.materialsContent).toBe("diff --git a/foo.js b/foo.js\n+added line\n");
    expect(baseline.git_sha).toBe("abc123");
  });

  it("fails loud when writing over an existing baseline (immutability)", () => {
    writeMaterialsBaseline({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 1,
      gitSha: "abc", materialsContent: "m1", coveredPaths: [], taskTrackingRoot: root,
    });
    expect(() =>
      writeMaterialsBaseline({
        taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 1,
        gitSha: "def", materialsContent: "m2", coveredPaths: [], taskTrackingRoot: root,
      })
    ).toThrow(/immutable/);
  });

  it("fails loud with a distinct partial-write message (not the immutability message) when only the .txt snapshot half exists from a crashed prior write (regression: previously this was misdiagnosed as 'already exists/immutable', wedging the flow with no way to retry)", () => {
    const snapshotPath = materialsSnapshotPathFor({ taskTrackingRoot: root, taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 1 });
    mkdirSync(join(snapshotPath, ".."), { recursive: true });
    writeFileSync(snapshotPath, "leftover-from-crash");

    expect(() =>
      writeMaterialsBaseline({
        taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 1,
        gitSha: "abc", materialsContent: "m1", coveredPaths: [], taskTrackingRoot: root,
      })
    ).toThrow(/partial|wedged/i);
    expect(() =>
      readMaterialsBaseline({ taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 1, taskTrackingRoot: root })
    ).toThrow(/not found/);
  });

  it("fails loud reading a baseline that was never written", () => {
    expect(() =>
      readMaterialsBaseline({ taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 1, taskTrackingRoot: root })
    ).toThrow(/not found/);
  });

  it("fails loud when JSON exists but the referenced snapshot file was deleted", () => {
    const { snapshotPath } = writeMaterialsBaseline({
      taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 1,
      gitSha: "abc", materialsContent: "m1", coveredPaths: [], taskTrackingRoot: root,
    });
    rmSync(snapshotPath);
    expect(() =>
      readMaterialsBaseline({ taskId: TASK_ID, stage: STAGE, reviewFlowId: FLOW, totalRound: 1, taskTrackingRoot: root })
    ).toThrow(/snapshot missing/);
  });
});
