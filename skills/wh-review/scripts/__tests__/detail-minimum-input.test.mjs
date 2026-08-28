import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildReviewMaterials, reviewInstructionsFor, validateDetailReviewInput } from "../review-materials.mjs";
import { runReviewFixture } from "../review-runner.mjs";
import { createTask } from "../../../../runtime/task/task-handle.mjs";

const source = {
  targetCommit: "1".repeat(40),
  baseCommit: "2".repeat(40),
  baseTree: "3".repeat(40),
  capturedHead: "4".repeat(40),
  snapshotTree: "5".repeat(40),
  changedFiles: [],
  dispose() {},
};
const pass = JSON.stringify({ findings: [] });
const revision = `revision-${"d".repeat(64)}`;
const decisionLog = "## 原始需求\n\n需要清楚的治理流程。\n\n## 决定\n\n采用最小修复。\n\n## Grill\n\n没有新增范围。\n";
const roots = [];

function fixture(prefix = "workflowhub-detail-") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  roots.push(root);
  const task = createTask({
    storageRoot: root,
    taskPath: join(root, "Projects", "Demo", "tasks", "task"),
    manifest: {
      schema_version: "1.0.0", project_name: "Demo", task_id: "task",
      created_at: "2026-08-27T00:00:00.000Z", target_repo_root: join(root, "repo"),
      issue_ids: [], inputs: {},
    },
  });
  const attachmentRoot = join(root, "attachments");
  mkdirSync(attachmentRoot);
  return { root, attachmentRoot, task };
}

function validMaterials() {
  return {
    raw_requirement: "需要清楚的治理流程。",
    approved_direction: decisionLog,
    draft_spec_or_acceptance: "当前待审说明：错误要在 provider 前暴露。",
  };
}

function providerClient(calls) {
  return {
    runGroup: async (request) => {
      calls.push(request);
      return {
        runtimeId: `detail-runtime-${calls.length}`,
        providers: [{
          adapter: "kimi", continuable: false, effort: null, error: null,
          material_id: "a".repeat(64), model: null, output: pass, provider: "kimi",
          raw_output_ref: null, result_protocol: "workflowhub-result.v2", retry: { count: 0, progress_events: 0 },
          runtime_id: `detail-runtime-${calls.length}`, session_file_path: null, status: "completed",
          session_id: "detail-session", thinking: null, timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 },
          unavailable_diagnostics: null, usage: null,
        }],
      };
    },
  };
}

function runDetail({ materials = validMaterials(), currentMaterialRevision = revision, calls = [] } = {}) {
  const { attachmentRoot, task } = fixture();
  return runReviewFixture({
    task, attachmentRoot, taskId: "task", stage: "make-decision", reviewTrack: "detail",
    materials, currentDecisionLog: decisionLog, materialRevision: currentMaterialRevision,
    hostProvider: "codex", providers: ["kimi"], providerClient: providerClient(calls),
    captureSource: () => source,
  }).then((result) => ({ result, task }));
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("make-decision detail public minimum input", () => {
  it("accepts only the public three-material input and sends the complete current decision", async () => {
    const calls = [];
    const { result } = await runDetail({ calls });
    expect(result.status).toBe("available");
    expect(calls).toHaveLength(1);
    const approved = readFileSync(join(calls[0].materials.bundleRoot, "requirements/approved_direction.md"), "utf8");
    expect(approved).toBe(decisionLog);
    expect(readFileSync(join(calls[0].materials.bundleRoot, "review-instructions.md"), "utf8"))
      .toContain("approved direction");
  });

  it.each([
    ["missing", { approved_direction: decisionLog, draft_spec_or_acceptance: "待审" }, /missing.*raw_requirement/i],
    ["empty", { raw_requirement: " ", approved_direction: decisionLog, draft_spec_or_acceptance: "待审" }, /empty.*raw_requirement/i],
    ["forbidden", { ...validMaterials(), review_instructions: "caller supplied" }, /forbidden.*review_instructions/i],
    ["type", { raw_requirement: 42, approved_direction: decisionLog, draft_spec_or_acceptance: "待审" }, /type.*raw_requirement/i],
    ["identity", { ...validMaterials(), approved_direction: "旧的压缩方向" }, /identity.*approved_direction.*decision-log/i],
    ["freshness", validMaterials(), /freshness.*material revision/i, null],
  ])("reports %s before provider dispatch", async (_name, materials, message, currentMaterialRevision = revision) => {
    const calls = [];
    const { result, task } = await runDetail({ materials, currentMaterialRevision, calls });
    expect(result).toMatchObject({ status: "unavailable" });
    expect(calls).toHaveLength(0);
    const attempt = JSON.parse(task.readRecord(result.attemptRef));
    expect(attempt.error.code).toBe("MATERIAL_INCOMPLETE");
    expect(attempt.error.message).toMatch(message);
  });

  it("does not reuse an earlier detail result when the same stage is executed again", async () => {
    const calls = [];
    const { result: first } = await runDetail({ calls });
    const { result: second } = await runDetail({ calls });
    expect(first.status).toBe("available");
    expect(second).toMatchObject({ status: "available" });
    expect(second.reused).not.toBe(true);
    expect(second.resultRef).not.toBe(first.resultRef);
    expect(calls).toHaveLength(2);
  });

  it("keeps the lower-level material contract aligned with the public minimum", () => {
    const { attachmentRoot, task } = fixture("workflowhub-detail-contract-");
    expect(() => buildReviewMaterials({
      reviewDataRoot: attachmentRoot, attachmentRoot, source, task, taskId: "task",
      stage: "make-decision", reviewTrack: "detail", materials: {
        ...validMaterials(), review_instructions: reviewInstructionsFor("make-decision", "detail"),
      },
    })).not.toThrow();
    expect(() => validateDetailReviewInput({ materials: validMaterials(), currentDecisionLog: decisionLog, currentMaterialRevision: revision })).not.toThrow();
  });
});
