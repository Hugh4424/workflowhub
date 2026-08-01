import { describe, expect, it } from "vitest";
import { validateStageFacts } from "../runtime/task/task-kernel.mjs";

const checkpoint=(stage,path)=>({schema_version:"git-checkpoint-plan.v1",stage,parent_commit:"a".repeat(40),artifacts:[{path,blob_oid:"b".repeat(40),content_hash:"c".repeat(64)}],plan_hash:"d".repeat(64)});
const testFacts=(prefix)=>({ command: "npm test", exit_code: 0, command_hash: "1".repeat(64), snapshot_head:"a".repeat(40),snapshot_tree: "a".repeat(40),snapshot_commit: "b".repeat(40),started_at:"2026-07-16T00:00:00.000Z",completed_at:"2026-07-16T00:00:01.000Z", receipt_ref: `receipts/${prefix}-receipt.json`, receipt_hash: "2".repeat(64), output_ref: `evidence/${prefix}-output.txt`, output_hash: "3".repeat(64) });
const acceptanceCoverage={ snapshot_tree:"a".repeat(40), accepted_criterion_ids:["AC-1"], items:[{ acceptance_criterion_id:"AC-1", status:"unknown", evidence_refs:[] }] };
const audit=(stage)=>({
  audit_contract_version:"v1",
  audit_summary_ref:`evidence/audits/${stage}/${"5".repeat(64)}.json`,
  audit_summary_hash:"5".repeat(64),
  audit_verdict:"pass",
  content_evidence_refs:[],
});
const valid = {
  "make-decision": { worktree_root: "/repo/worktree", baseline_commit: "a".repeat(40), decision: "go", ...audit("make-decision") },
  "build-spec": { spec_ref: "specs/task/spec.md", checkpoint: checkpoint("build-spec","specs/task/spec.md"), ...audit("build-spec") },
  "build-plan": { plan_ref: "specs/task/plan.md", tasks_ref: "specs/task/tasks.md", checkpoint: {...checkpoint("build-plan","specs/task/plan.md"),artifacts:[{path:"specs/task/plan.md",blob_oid:"b".repeat(40),content_hash:"c".repeat(64)},{path:"specs/task/tasks.md",blob_oid:"c".repeat(40),content_hash:"d".repeat(64)}]}, ...audit("build-plan") },
  "build-code": {
    changed: [], phase_completion: {
      status: "completed",
      evidence_ref: "specs/task/tasks.md",
      evidence_hash: "6".repeat(64),
      integration_review: { ref: "reviews/results/build-code.json", sha256: "4".repeat(64) },
      formal_record_status: { status: "unavailable", reason: "legacy fixture has no Phase history" },
    },
    tests: testFacts("build-test"),
    review: { verdict: "pass", result_ref: "reviews/results/build-code.json", result_hash: "4".repeat(64), snapshot_tree: "a".repeat(40) },
    acceptance_coverage: acceptanceCoverage,
    ...audit("build-code"),
  },
  "verify-code": {
    tests: testFacts("test"),
    review: { verdict: "pass", result_ref: "reviews/results/verify.json", result_hash: "4".repeat(64), snapshot_tree: "a".repeat(40) },
    evidence_refs: [{ ref: "evidence/test-receipt.json", sha256: "2".repeat(64) }, { ref: "evidence/test-output.txt", sha256: "3".repeat(64) }],
    ...audit("verify-code"),
  },
};

const verifyItem = (id, status = "pass") => ({
  id,
  status,
  evidence_refs: status === "not_applicable" ? [] : [{
    ref: `evidence/verify/${id}.json`,
    sha256: "7".repeat(64),
  }],
  reason: status === "not_applicable" ? `${id} does not apply to this task` : `${id} was verified`,
});
const requiredVerifyItemIds = [
  "current_materials",
  "diff_scope",
  "risk_tests",
  "acceptance_criteria",
  "tasks_completion",
  "browser_qa",
  "independent_review_resolution",
  "core_gaps",
  "human_handoff",
];
const deepVerifyFacts = {
  ...valid["verify-code"],
  verification_items: requiredVerifyItemIds.map((id) => verifyItem(
    id,
    id === "browser_qa" ? "not_applicable" : "pass",
  )),
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
  it("accepts the documented structured phase completion", () => {
    const phase_completion = {
      status: "completed",
      evidence_ref: "evidence/phase-summary.json",
      evidence_hash: "6".repeat(64),
      integration_review: { ref: "reviews/results/build-code.json", sha256: "4".repeat(64) },
      formal_record_status: { status: "unavailable", reason: "legacy fixture has no Phase history" },
    };
    expect(validateStageFacts("build-code", { ...valid["build-code"], phase_completion }).phase_completion).toBe(phase_completion);
  });
  it("allows legacy build-code facts only for an explicit controlled-reopen read", () => {
    const legacy = { ...valid["build-code"], phase_completion: true };
    delete legacy.acceptance_coverage;
    expect(() => validateStageFacts("build-code", legacy)).toThrow(/acceptance_coverage/i);
    expect(validateStageFacts("build-code", legacy, { allowLegacyBuildCode: true })).toBe(legacy);
  });
  it("rejects phase details that omit the documented status and evidence ref", () => {
    expect(() => validateStageFacts("build-code", { ...valid["build-code"], phase_completion: { phases: [], acceptance: [] } })).toThrow(/phase_completion.*(?:unknown|status|evidence_ref)/i);
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
  it("accepts a canonical browser QA evidence binding without making it a Gate",()=>{
    const facts = {
      ...valid["verify-code"],
      browser_qa: {
        ref: `evidence/stage-content/${"a".repeat(64)}/browser-qa-evidence.v1.json`,
        hash: "b".repeat(64),
      },
    };
    expect(validateStageFacts("verify-code", facts)).toBe(facts);
  });
  it("does not accept a bare browser QA payload in verify facts",()=>{
    const facts = {
      ...valid["verify-code"],
      browser_qa: {
        applicability: "ui",
        result: "pass",
        route: "/settings",
      },
    };
    expect(()=>validateStageFacts("verify-code", facts)).toThrow(/browser|scenario|evidence|incomplete|required/i);
  });

  it("accepts a complete itemized verify result with status, evidence, and reason per item", () => {
    expect(
      validateStageFacts("verify-code", deepVerifyFacts),
      "ORACLE-VERIFY: verify-code must expose all nine itemized checks",
    ).toBe(deepVerifyFacts);
  });

  it.each(requiredVerifyItemIds)("rejects a passing verify result that omits %s", (missingId) => {
    const facts = {
      ...deepVerifyFacts,
      verification_items: deepVerifyFacts.verification_items.filter(({ id }) => id !== missingId),
    };
    expect(
      () => validateStageFacts("verify-code", facts),
      `ORACLE-VERIFY: missing verify item ${missingId} cannot pass`,
    ).toThrow(new RegExp(`missing verify item: ${missingId}`, "i"));
  });

  it("keeps review unavailable and audit missing as disclosures, not business failures", () => {
    const facts = {
      ...valid["verify-code"],
      review: {
        verdict: "unavailable",
        result_ref: "reviews/results/verify-unavailable.json",
        result_hash: "4".repeat(64),
        snapshot_tree: "a".repeat(40),
      },
      audit_verdict: "fail",
    };
    expect(validateStageFacts("verify-code", facts)).toBe(facts);
  });
});
