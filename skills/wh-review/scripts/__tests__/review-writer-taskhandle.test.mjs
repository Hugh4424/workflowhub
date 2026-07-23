import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask } from "../../../../core/task-handle.mjs";
import { writeAttempt, writeSemanticResult } from "../review-result.mjs";
import { validateSchema } from "../schema-validator.mjs";

const temporary = [];
function fixture() {
  const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-review-writer-")));
  temporary.push(storageRoot);
  return createTask({ storageRoot, taskPath: join(storageRoot, "Projects", "Demo", "tasks", "review-task"), manifest: {
    schema_version: "1.0.0", project_name: "Demo", task_id: "review-task",
    created_at: "2026-07-16T00:00:00.000Z", target_repo_root: join(storageRoot, "repo"), issue_ids: [], inputs: {},
  } });
}
afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });

describe("review writer TaskHandle boundary", () => {
  it("rejects path strings and fake handles", () => {
    expect(() => writeAttempt("/tmp/review.json", {})).toThrow(/TaskHandle|capability/i);
    expect(() => writeAttempt({}, "reviews/a.json", {})).toThrow(/TaskHandle|capability/i);
  });
  it("writes create-only review records through controlled TaskHandle I/O", () => {
    const task = fixture();
    const source={target_commit:"a".repeat(40),base_commit:"a".repeat(40),base_tree:"a".repeat(40),captured_head:"a".repeat(40)};
    const provenance={task_id:"review-task",stage:"build-code",review_track:null,source,snapshot_tree:"b".repeat(40),material_id:"c".repeat(64)};
    const attempt={version:"wh-review-attempt.v1",attempt_id:"a",...provenance,provider_attempts:[],terminal_status:"semantic",error:null};
    const result={version:"wh-review-result.v1",...provenance,attempt_ref:"reviews/attempts/a/attempt.json",provider_results:[{provider:"fixture",output:{verdict:"pass",summary:"ok",findings:[]}}],verdict:"pass",findings:[]};
    writeAttempt(task, "reviews/attempts/a/attempt.json", attempt);
    writeSemanticResult(task, "reviews/results/a.json", result);
    expect(JSON.parse(task.readRecord("reviews/attempts/a/attempt.json"))).toEqual(attempt);
    expect(() => writeSemanticResult(task, "reviews/results/a.json", result)).toThrow(/exist|create-only/i);
  });

  it("keeps legacy session-artifact attempts readable but rejects new writes", () => {
    const task = fixture();
    const source={target_commit:"a".repeat(40),base_commit:"a".repeat(40),base_tree:"a".repeat(40),captured_head:"a".repeat(40)};
    const legacy={
      version:"wh-review-attempt.v1",attempt_id:"legacy",task_id:"review-task",stage:"build-code",review_track:null,source,
      snapshot_tree:"b".repeat(40),material_id:"c".repeat(64),terminal_status:"unavailable",error:{code:"PROVIDER_UNAVAILABLE",message:"old transport"},
      provider_attempts:[{provider:"kimi",status:"failed",session_id:null,runtime_id:"runtime",session_artifact_path:"/legacy/broker/state.json",execution:null,unavailable_diagnostics:null,output_ref:null,error:{code:"PROVIDER_UNAVAILABLE",message:"old transport"}}],
    };
    expect(validateSchema("attempt", legacy)).toBe(legacy);
    expect(() => writeAttempt(task, "reviews/attempts/legacy/attempt.json", legacy)).toThrow(/legacy-only/i);
  });
});
