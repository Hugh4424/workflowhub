import { describe, expect, it } from "vitest";
import { validateStageFacts } from "../core/task-kernel.mjs";

const checkpoint=(stage,path)=>({schema_version:"git-checkpoint-plan.v1",stage,parent_commit:"a".repeat(40),artifacts:[{path,blob_oid:"b".repeat(40),content_hash:"c".repeat(64)}],plan_hash:"d".repeat(64)});
const testFacts=(prefix)=>({ command: "npm test", exit_code: 0, command_hash: "1".repeat(64), snapshot_head:"a".repeat(40),snapshot_tree: "a".repeat(40),snapshot_commit: "b".repeat(40),started_at:"2026-07-16T00:00:00.000Z",completed_at:"2026-07-16T00:00:01.000Z", receipt_ref: `receipts/${prefix}-receipt.json`, receipt_hash: "2".repeat(64), output_ref: `evidence/${prefix}-output.txt`, output_hash: "3".repeat(64) });
const valid = {
  "make-decision": { worktree_root: "/repo/worktree", baseline_commit: "a".repeat(40), decision: "go" },
  "build-spec": { spec_ref: "specs/task/spec.md", checkpoint: checkpoint("build-spec","specs/task/spec.md") },
  "build-plan": { plan_ref: "specs/task/plan.md", tasks_ref: "specs/task/tasks.md", revision: 1, pair_id: "pair-1", research: { status: "pass", result_ref: "evidence/research.json", result_hash: "4".repeat(64) }, analysis: { status: "pass", result_ref: "evidence/analysis.json", result_hash: "4".repeat(64) }, simplicity: { status: "pass", result_ref: "evidence/simplicity.json", result_hash: "4".repeat(64) }, review: { verdict: "pass", result_ref: "reviews/results/build-plan.json", result_hash: "4".repeat(64), snapshot_tree: "a".repeat(40) }, checkpoint: {...checkpoint("build-plan","specs/task/plan.md"),artifacts:[{path:"specs/task/plan.md",blob_oid:"b".repeat(40),content_hash:"c".repeat(64)},{path:"specs/task/tasks.md",blob_oid:"c".repeat(40),content_hash:"d".repeat(64)}]} },
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
