import { describe, expect, it } from "vitest";
import { validateStageFacts } from "../core/task-kernel.mjs";

const taskSnapshot=()=>({schema_id:"https://workflowhub.dev/schemas/task-snapshot.v1.schema.json",schema_version:"1.0.0",task_id:"task",baseline_commit:"a".repeat(40),tree_oid:"b".repeat(40),diff_ref:`git-diff:sha256:${"c".repeat(64)}`,diff_hash:"c".repeat(64),blob_refs:[],worktree_status:[],captured_at:"2026-07-16T00:00:00.000Z"});
const testFacts=(prefix)=>({ command: "npm test", exit_code: 0, command_hash: "1".repeat(64), snapshot_head:"a".repeat(40),snapshot_tree: "a".repeat(40),snapshot_ref:`snapshots/${prefix}.json`,snapshot_hash:"5".repeat(64),started_at:"2026-07-16T00:00:00.000Z",completed_at:"2026-07-16T00:00:01.000Z", receipt_ref: `receipts/${prefix}-receipt.json`, receipt_hash: "2".repeat(64), output_ref: `evidence/${prefix}-output.txt`, output_hash: "3".repeat(64) });
const valid = {
  "make-decision": { worktree_root: "/repo/worktree", baseline_commit: "a".repeat(40), decision: "go" },
  "build-spec": { spec_ref: "specs/task/spec.md", checkpoint: taskSnapshot() },
  "build-plan": { plan_ref: "specs/task/plan.md", tasks_ref: "specs/task/tasks.md", checkpoint: taskSnapshot() },
  "build-code": {
    changed: [], phase_completion: true,
    tests: testFacts("build-test"),
    review: { verdict: "pass", result_ref: "reviews/results/build-code.json", result_hash: "4".repeat(64), snapshot_tree: "a".repeat(40) },
  },
  "verify-code": {
    tests: testFacts("test"),
    review: { verdict: "pass", result_ref: "reviews/results/verify.json", result_hash: "4".repeat(64), snapshot_tree: "a".repeat(40) },
    evidence_refs: [{ ref: "evidence/test-receipt.json", sha256: "2".repeat(64) }, { ref: "evidence/test-output.txt", sha256: "3".repeat(64) }],
  },
};

describe("five-stage facts v2 schema", () => {
  it.each(Object.entries(valid))("accepts %s required facts", (stage, facts) => {
    expect(validateStageFacts(stage, facts)).toBe(facts);
  });
  it.each(Object.keys(valid))("rejects incomplete %s facts without inventing defaults", (stage) => {
    expect(() => validateStageFacts(stage, {})).toThrow(/missing required keys/);
  });
  it("rejects a stale or non-string build-code test command", () => {
    expect(() => validateStageFacts("build-code", { ...valid["build-code"], tests: { command: 7, exit_code: 0 } })).toThrow(/tests|command/i);
  });
  it("rejects copied review verdicts without a formal result ref and snapshot",()=>{
    expect(()=>validateStageFacts("verify-code",{...valid["verify-code"],review:{verdict:"pass"}})).toThrow(/result_ref|hash|snapshot|review/i);
  });
  it("rejects test claims without physical freshness evidence",()=>{
    expect(()=>validateStageFacts("verify-code",{...valid["verify-code"],tests:{command:"npm test",exit_code:0}})).toThrow(/fresh|hash|receipt|output|snapshot|tests/i);
  });
  it("rejects arbitrary evidence references that are not authenticated task records",()=>{
    expect(()=>validateStageFacts("verify-code",{...valid["verify-code"],evidence_refs:["made-up.json"]})).toThrow(/evidence|reference|authenticated/i);
  });
});
