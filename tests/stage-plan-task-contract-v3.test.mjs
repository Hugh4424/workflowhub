import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  validateTasksOnlyCompletionSeam,
  validatePlanTaskContract,
  validatePlanTaskContractV2,
  validateExecutablePlanTaskMinimum,
} from "../runtime/stage/stage-content-contracts.mjs";
import { certifyCurrentTaskCompletion } from "../runtime/stage/stage-handlers.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const spec = `
# Specification
- **FR-DEMO-001**: observable behavior.
- **AC1**: behavior is accepted.
`;

const files = `- **NEW**：\`tests/demo.test.mjs\`
- **MODIFY**：\`core/demo.mjs\`
- **DO NOT TOUCH**：\`core/authority.mjs\``;

const constitutionClauses = [
  ..."F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11".split(" "),
  ..."Q1 Q2 Q3".split(" "),
  ..."S1 S2 S3 S4 S5 S6 S7 S8".split(" "),
].map((id) => `- ${id} is satisfied.`).join("\n");

const plan = `
# Plan
- **Template version**：\`plan-task.v3\`

## 1. 速读卡
- **Goal**：One observable result.
- **Non-goals**：no unrelated runtime change. 来源：FR-DEMO-001
- **Before**：The behavior fails.
- **After**：The behavior passes.
- **Main risk**：RED may fail for the wrong reason.
- **Next step**：Run T001.

## 2. Technical Context and Constraints
Node.js, ESM, Vitest.
### Global Constraints
No unrelated file changes.

## 3. Code Anchors and Reuse
Reuse core/demo.mjs after verifying its signature.

## 4. Solution Design
The test calls one exported function and observes its result.

## 5. File Boundary
### NEW
- \`tests/demo.test.mjs\`
### MODIFY
- \`core/demo.mjs\`
### DO NOT TOUCH
- \`core/authority.mjs\`

## 6. Technical Decisions
### DEC-001
- **Selected**: new
- **F10 real threat**: false success.
- **F10 existing cover**: current unit test.
- **F10 bypassable**: no.
- **F10 maintenance cost**: one fixture.

## 7. Test Strategy
Use the same narrow command for RED and GREEN.

## 8. Rollback and Recovery
Revert only current implementation bytes.
### Engineering Risk Handoff
- **PLAN-RISK-001**: false RED
  - **Affected IDs**: FR-DEMO-001, AC1
  - **Trigger**: RED fails before the target assertion.
  - **Consequence**: implementation starts from false evidence.
  - **Mitigation or STOP**: stop and repair the fixture.
  - **Handling Stage**: build-code
  - **Verification**: RED output identifies the target assertion.

## 9. Implementation Order
T001 RED before T002 GREEN.

## Phase 1：Contract
### Goal
Make the contract observable.
### Files
${files}
### Tasks
T001 then T002.
### Verify
npx vitest run tests/demo.test.mjs.
### Knowledge
The verified export is core/demo.mjs.
### STOP
Stop if RED fails for setup reasons.
### Done
The same assertion moves from RED to GREEN.
### Risks and rollback
Risk is false RED; remove only current implementation on rollback.

## 10. Dependencies and Parallelism
T001 → T002.

## 11. Requirement and Verification Traceability
| FR | Task IDs | AC IDs | Phase | Gate / evidence |
|---|---|---|---|---|
| FR-DEMO-001 | T001, T002 | AC1 | Phase 1 | demo evidence |

## 12. Governance Synchronization Matrix
| Governance surface | Actual files | Change / no change | Task IDs | Reason |
|---|---|---|---|---|
| Automation gates | tests/demo.test.mjs | change | T001 | contract |

## Appendix A. Constitution Check
- **Constitution binding**：\`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","id":"CONSTITUTION","version":"1.6.0","clause_count":22}\`
${constitutionClauses}
`;

const specHash = sha256(spec);
const planHash = sha256(plan);

function card({
  id,
  title,
  action,
  file,
  dependency,
  role,
  pair,
  exit,
}) {
  return `#### ${id} — ${title}
- **ID**：${id}
- **Phase**：Phase 1：Contract
- **goal**：Move one observable contract state.
- **design_state**：ready
- **versioned_refs**：\`[{"artifact_kind":"spec","ref":"spec.md","hash":"${specHash}","id":"FR-DEMO-001"},{"artifact_kind":"plan","ref":"plan.md","hash":"${planHash}","id":"DEC-001"}]\`
- **输入**：FR-DEMO-001
- **依赖**：${dependency}
- **并行**：否 — ordered RED/GREEN
- **FR**：FR-DEMO-001
- **AC**：AC1
- **动作**：${action}
- **精确文件**：\`${file}\`
- **boundary**：files: \`${file}\`; symbols/regions: only the declared symbol.
- **输出**：Contract evidence.
- **Knowledge**：Verified local interface.
- **verification_role**：${role}
- **paired_task**：${pair}
- **gate_cmd**：\`npx vitest run tests/demo.test.mjs\`
- **expected_exit**：${exit}
- **oracle**：ORACLE-DEMO — the same assertion reports the intended state.
- **evidence_path**：apply/evidence/${id}.stdout
- **STOP**：Stop on setup failure.
- **recovery**：Revert current task bytes.
- **task risk**：False test result.

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：\`pending\`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — not reviewed
- **completed_at**：N/A — not completed`;
}

const tasks = `
# Tasks
- **Template version**：\`plan-task.v3\`

## 1. 执行摘要
T001 then T002.

## 2. Global Constraints
Use exact accepted boundaries.

## Phase 1：Contract
### Goal
Make the contract observable.
### Files
${files}
### Tasks
${card({
  id: "T001",
  title: "RED",
  action: "Add the failing behavioral fixture.",
  file: "tests/demo.test.mjs",
  dependency: "N/A — first task",
  role: "RED",
  pair: "T002",
  exit: "2",
})}

${card({
  id: "T002",
  title: "GREEN",
  action: "Implement the behavior.",
  file: "core/demo.mjs",
  dependency: "T001",
  role: "GREEN",
  pair: "T001",
  exit: "0",
})}
### Verify
npx vitest run tests/demo.test.mjs.
### Knowledge
The verified export is core/demo.mjs.
### STOP
Stop on boundary drift.
### Done
The assertion is GREEN.
### Risks and rollback
Revert current implementation bytes.

## 3. Dependency Graph
T001 → T002.

## 4. Requirement and Verification Traceability
| FR | Task IDs | AC IDs | Phase | Gate / evidence |
|---|---|---|---|---|
| FR-DEMO-001 | T001, T002 | AC1 | Phase 1 | demo evidence |

## 5. Final Boundary Check
All checks complete.

## Appendix A. Legacy import
Legacy input is read-only.
`;

function validate(overrides = {}) {
  return validatePlanTaskContract({ spec, plan, tasks, ...overrides });
}

describe("plan-task.v3 structural contract", () => {
  it("accepts one readable authority with eight-section phases and paired RED/GREEN", () => {
    expect(validate()).toMatchObject({
      ok: true,
      errors: [],
      facts: {
        template_version: "plan-task.v3",
        phase_count: 1,
        task_count: 2,
        task_completion: {
          total_count: 2,
          completed_count: 0,
          pending_ids: ["T001", "T002"],
        },
      },
    });
  });

  it("accepts named robust acceptance criterion identifiers", () => {
    const robustSpec = spec.replaceAll("AC1", "AC-ROBUST-001");
    const robustPlan = plan.replaceAll("AC1", "AC-ROBUST-001");
    const robustTasks = tasks.replaceAll("AC1", "AC-ROBUST-001");
    const result = validatePlanTaskContract({ spec: robustSpec, plan: robustPlan, tasks: robustTasks });
    expect(result).toMatchObject({
      ok: true,
      errors: [],
      facts: { ac_coverage: { accepted_ids: ["AC-ROBUST-001"], covered_ids: ["AC-ROBUST-001"] } },
    });
  });

  it("uses the same namespaced AC grammar in structural and executable validation", () => {
    const namespacedSpec = spec.replaceAll("AC1", "AC-REV-004");
    const namespacedPlan = plan.replaceAll("AC1", "AC-REV-004");
    const namespacedTasks = tasks.replaceAll("AC1", "AC-REV-004");
    expect(validatePlanTaskContract({ spec: namespacedSpec, plan: namespacedPlan, tasks: namespacedTasks })).toMatchObject({
      ok: true,
      facts: { ac_coverage: { accepted_ids: ["AC-REV-004"], covered_ids: ["AC-REV-004"] } },
    });
    expect(validateExecutablePlanTaskMinimum({
      spec: namespacedSpec,
      plan: namespacedPlan,
      tasks: namespacedTasks,
    })).toMatchObject({ ok: true, errors: [] });
  });

  it("does not treat accepted history as task completion and rejects contradictory completed claims", () => {
    const contradictory = tasks
      .replace("- [ ] **任务完成**", "- [x] **任务完成**")
      .replace("- **status**：`pending`", "- **status**：`in_progress`");
    const result = validate({ tasks: contradictory });
    expect(result.ok).toBe(true);
    expect(result.facts.task_completion.tasks[0]).toMatchObject({
      id: "T001",
      checked: true,
      status: "in_progress",
      complete: false,
      claim_valid: false,
    });
    expect(result.facts.task_completion.tasks[0].errors.join("\n")).toMatch(/checkbox.*status/i);
  });

  it("requires every completion field and parseable task-relative evidence bindings", () => {
    const incomplete = tasks
      .replace("- [ ] **任务完成**", "- [x] **任务完成**")
      .replace("- **status**：`pending`", "- **status**：`completed`")
      .replace("- **actual_changes**：N/A — not started", "- **actual_changes**：core/demo.mjs")
      .replace("- **executed_commands**：N/A — not started", "- **executed_commands**：npx vitest run tests/demo.test.mjs; exit 0")
      .replace("- **covered_ac**：N/A — not started", "- **covered_ac**：AC1")
      .replace("- **review_fact**：N/A — not reviewed", "- **review_fact**：reviews/results/phase-1.json")
      .replace("- **completed_at**：N/A — not completed", "- **completed_at**：2026-07-29T12:00:00.000Z");
    const result = validate({ tasks: incomplete });
    expect(result.facts.task_completion.tasks[0]).toMatchObject({
      status: "completed",
      complete: false,
      claim_valid: false,
    });
    expect(result.facts.task_completion.tasks[0].errors.join("\n")).toMatch(/evidence_refs/i);
  });

  it("authenticates a completed task only against supplied canonical evidence", () => {
    const evidenceRaw = "focused proof\n";
    const evidenceRef = "apply/evidence/T001-proof.txt";
    const completed = tasks
      .replace("- [ ] **任务完成**", "- [x] **任务完成**")
      .replace("- **status**：`pending`", "- **status**：`completed`")
      .replace("- **actual_changes**：N/A — not started", "- **actual_changes**：core/demo.mjs")
      .replace("- **executed_commands**：N/A — not started", "- **executed_commands**：npx vitest run tests/demo.test.mjs; exit 0")
      .replace("- **evidence_refs**：N/A — not started", `- **evidence_refs**：\`[{"ref":"${evidenceRef}","sha256":"${sha256(evidenceRaw)}"}]\``)
      .replace("- **covered_ac**：N/A — not started", "- **covered_ac**：AC1")
      .replace("- **review_fact**：N/A — not reviewed", "- **review_fact**：reviews/results/phase-1.json")
      .replace("- **completed_at**：N/A — not completed", "- **completed_at**：2026-07-29T12:00:00.000Z");
    const result = validate({
      tasks: completed,
      completionEvidence: ({ ref }) => ref === evidenceRef ? evidenceRaw : undefined,
    });
    expect(result.facts.task_completion.tasks[0]).toMatchObject({
      id: "T001",
      complete: true,
      claim_valid: true,
    });
    expect(result.facts.task_completion.completed_count).toBe(1);
  });

  it("records a current product diff outside completed task boundaries without blocking", () => {
    const evidenceRaw = "authenticated but semantically false completion\n";
    const evidenceRef = "apply/evidence/fake-completion.txt";
    const fakeCompleted = tasks
      .replaceAll("- [ ] **任务完成**", "- [x] **任务完成**")
      .replaceAll("- **status**：`pending`", "- **status**：`completed`")
      .replace("- **actual_changes**：N/A — not started", "- **actual_changes**：`tests/demo.test.mjs`")
      .replace("- **actual_changes**：N/A — not started", "- **actual_changes**：`core/demo.mjs`")
      .replaceAll("- **executed_commands**：N/A — not started", "- **executed_commands**：`npx vitest run tests/demo.test.mjs`; exit 0")
      .replaceAll("- **evidence_refs**：N/A — not started", `- **evidence_refs**：\`[{"ref":"${evidenceRef}","sha256":"${sha256(evidenceRaw)}"}]\``)
      .replaceAll("- **covered_ac**：N/A — not started", "- **covered_ac**：AC1")
      .replaceAll("- **review_fact**：N/A — not reviewed", "- **review_fact**：reviews/results/phase-1.json")
      .replaceAll("- **completed_at**：N/A — not completed", "- **completed_at**：2026-07-29T12:00:00.000Z");
    const worker = {
      identity: { taskId: "demo" },
      readArtifact: (name) => ({ "spec.md": spec, "plan.md": plan, "tasks.md": fakeCompleted })[name],
      readEvidence: (ref) => {
        if (ref !== evidenceRef) throw Object.assign(new Error("missing"), { code: "ENOENT" });
        return { bytes: evidenceRaw };
      },
      artifactRef: (name) => `specs/demo/${name}`,
    };
    const evidenceHash = sha256(evidenceRaw);
    const result = certifyCurrentTaskCompletion(worker, {
      changedFiles: ["core/outside.mjs"],
      tests: {
        command: "npx vitest run tests/demo.test.mjs",
        exit_code: 0,
        receipt_ref: evidenceRef,
        receipt_hash: evidenceHash,
      },
      review: { status: "recorded", result_ref: "reviews/results/phase-1.json", result_hash: sha256("review") },
      acceptanceCoverage: {
        accepted_criterion_ids: ["AC1"],
        items: [{
          acceptance_criterion_id: "AC1",
          status: "covered",
          evidence_refs: [{ ref: evidenceRef, sha256: evidenceHash }],
        }],
      },
    });
    expect(result).toMatchObject({ status: "completed" });
    expect(result.audit_gaps).toEqual(["current diff includes files outside historical task boundaries: core/outside.mjs"]);
  });

  it("permits prose actual_changes and historical task audit references", () => {
    const evidenceRaw = "authenticated completion\n";
    const evidenceRef = "apply/evidence/prose-completion.txt";
    const proseCompleted = tasks
      .replaceAll("- [ ] **任务完成**", "- [x] **任务完成**")
      .replaceAll("- **status**：`pending`", "- **status**：`completed`")
      .replace("- **actual_changes**：N/A — not started", "- **actual_changes**：Added the focused behavioral fixture.")
      .replace("- **actual_changes**：N/A — not started", "- **actual_changes**：Implemented the corresponding behavior.")
      .replaceAll("- **executed_commands**：N/A — not started", "- **executed_commands**：`npx vitest run tests/demo.test.mjs`; exit 0")
      .replaceAll("- **evidence_refs**：N/A — not started", `- **evidence_refs**：\`[{"ref":"${evidenceRef}","sha256":"${sha256(evidenceRaw)}"}]\``)
      .replaceAll("- **covered_ac**：N/A — not started", "- **covered_ac**：AC1")
      .replaceAll("- **review_fact**：N/A — not reviewed", "- **review_fact**：reviews/results/phase-1.json")
      .replaceAll("- **completed_at**：N/A — not completed", "- **completed_at**：2026-07-29T12:00:00.000Z");
    const worker = {
      identity: { taskId: "demo" },
      readArtifact: (name) => ({ "spec.md": spec, "plan.md": plan, "tasks.md": proseCompleted })[name],
      readEvidence: () => { throw Object.assign(new Error("historical evidence unavailable"), { code: "ENOENT" }); },
      artifactRef: (name) => `specs/demo/${name}`,
    };
    const evidenceHash = sha256(evidenceRaw);
    expect(() => certifyCurrentTaskCompletion(worker, {
      changedFiles: ["core/demo.mjs"],
      tests: {
        command: "npx vitest run tests/demo.test.mjs",
        exit_code: 0,
        receipt_ref: evidenceRef,
        receipt_hash: evidenceHash,
      },
      review: { status: "recorded", result_ref: "reviews/results/phase-1.json", result_hash: sha256("review") },
      acceptanceCoverage: {
        accepted_criterion_ids: ["AC1"],
        items: [{
          acceptance_criterion_id: "AC1",
          status: "covered",
          evidence_refs: [{ ref: evidenceRef, sha256: evidenceHash }],
        }],
      },
    })).not.toThrow();
  });

  it("does not block build-code on pending historical Task rows", () => {
    const worker = {
      identity: { taskId: "demo" },
      readArtifact: (name) => ({ "spec.md": spec, "plan.md": plan, "tasks.md": tasks })[name],
      readEvidence: () => { throw Object.assign(new Error("historical evidence unavailable"), { code: "ENOENT" }); },
      artifactRef: (name) => `specs/demo/${name}`,
    };
    const result = certifyCurrentTaskCompletion(worker, {
      changedFiles: ["core/demo.mjs"],
      tests: {
        command: "npx vitest run tests/demo.test.mjs",
        exit_code: 0,
        receipt_ref: "receipts/current-tests.json",
        receipt_hash: sha256("current-tests"),
      },
      review: { status: "recorded", result_ref: "reviews/results/current.json", result_hash: sha256("review") },
      acceptanceCoverage: {
        accepted_criterion_ids: ["AC1"],
        items: [{
          acceptance_criterion_id: "AC1",
          status: "covered",
          evidence_refs: [{ ref: "receipts/current-tests.json", sha256: sha256("current-tests") }],
        }],
      },
    });
    expect(result.status).toBe("completed");
    expect(result.formal_record_status.status).toBe("unavailable");
    expect(result.audit_gaps[0]).toMatch(/tasks\.md completion history is incomplete/);
  });

  it("does not require task audit evidence to duplicate the current test receipt", () => {
    const evidenceRaw = "authenticated completion\n";
    const evidenceRef = "apply/evidence/current-completion.txt";
    const receiptRef = "receipts/current-tests.json";
    const receiptRaw = "current test receipt\n";
    const completed = tasks
      .replaceAll("- [ ] **任务完成**", "- [x] **任务完成**")
      .replaceAll("- **status**：`pending`", "- **status**：`completed`")
      .replace("- **actual_changes**：N/A — not started", "- **actual_changes**：`tests/demo.test.mjs`")
      .replace("- **actual_changes**：N/A — not started", "- **actual_changes**：`core/demo.mjs`")
      .replaceAll("- **executed_commands**：N/A — not started", "- **executed_commands**：`npx vitest run tests/demo.test.mjs`; exit 0")
      .replaceAll("- **evidence_refs**：N/A — not started", `- **evidence_refs**：\`[{"ref":"${evidenceRef}","sha256":"${sha256(evidenceRaw)}"}]\``)
      .replaceAll("- **covered_ac**：N/A — not started", "- **covered_ac**：AC1")
      .replaceAll("- **review_fact**：N/A — not reviewed", "- **review_fact**：reviews/results/phase-1.json")
      .replaceAll("- **completed_at**：N/A — not completed", "- **completed_at**：2026-07-29T12:00:00.000Z");
    const worker = {
      identity: { taskId: "demo" },
      readArtifact: (name) => ({ "spec.md": spec, "plan.md": plan, "tasks.md": completed })[name],
      readEvidence: () => { throw Object.assign(new Error("historical evidence unavailable"), { code: "ENOENT" }); },
      artifactRef: (name) => `specs/demo/${name}`,
    };
    expect(() => certifyCurrentTaskCompletion(worker, {
      changedFiles: ["tests/demo.test.mjs", "core/demo.mjs"],
      tests: {
        command: "npx vitest run tests/demo.test.mjs",
        exit_code: 0,
        receipt_ref: receiptRef,
        receipt_hash: sha256(receiptRaw),
      },
      review: { status: "recorded", result_ref: "reviews/results/phase-1.json", result_hash: sha256("review") },
      acceptanceCoverage: {
        accepted_criterion_ids: ["AC1"],
        items: [{
          acceptance_criterion_id: "AC1",
          status: "covered",
          evidence_refs: [{ ref: evidenceRef, sha256: sha256(evidenceRaw) }],
        }],
      },
    })).not.toThrow();
  });

  it("permits a post-review tasks-only update only in the selected completion block", () => {
    const evidenceRaw = "phase completion evidence\n";
    const evidenceRef = "apply/evidence/T001.txt";
    const after = tasks
      .replace("- [ ] **任务完成**", "- [x] **任务完成**")
      .replace("- **status**：`pending`", "- **status**：`completed`")
      .replace("- **actual_changes**：N/A — not started", "- **actual_changes**：core/demo.mjs")
      .replace("- **executed_commands**：N/A — not started", "- **executed_commands**：npx vitest run tests/demo.test.mjs; exit 0")
      .replace("- **evidence_refs**：N/A — not started", `- **evidence_refs**：\`[{"ref":"${evidenceRef}","sha256":"${sha256(evidenceRaw)}"}]\``)
      .replace("- **covered_ac**：N/A — not started", "- **covered_ac**：AC1")
      .replace("- **review_fact**：N/A — not reviewed", "- **review_fact**：reviews/results/phase-1.json")
      .replace("- **completed_at**：N/A — not completed", "- **completed_at**：2026-07-29T12:00:00.000Z");
    const completionEvidence = ({ ref }) => ref === evidenceRef ? evidenceRaw : undefined;
    expect(validateTasksOnlyCompletionSeam({ before: tasks, after, taskId: "T001", completionEvidence })).toMatchObject({
      ok: true,
      changed_task_ids: ["T001"],
      requires_repeat_review: false,
    });
    expect(validateTasksOnlyCompletionSeam({
      before: tasks,
      after: after.replace("Implement the behavior.", "Implement unrelated behavior."),
      taskId: "T001",
      completionEvidence,
    })).toMatchObject({ ok: false });
    expect(validateTasksOnlyCompletionSeam({
      before: tasks,
      after,
      allowedTaskIds: ["T002"],
      completionEvidence,
    })).toMatchObject({ ok: false });
    expect(validateTasksOnlyCompletionSeam({
      before: tasks,
      after,
      allowedTaskIds: ["T001"],
      requiredBindings: [{ ref: "receipts/phase-tests.json", sha256: "a".repeat(64) }],
      completionEvidence,
    })).toMatchObject({
      ok: false,
      errors: [expect.stringMatching(/does not bind receipts\/phase-tests\.json/i)],
    });
  });

  it("permits live plan hash refreshes in derived versioned_refs", () => {
    const evidenceRaw = "phase completion evidence\n";
    const evidenceRef = "apply/evidence/T001-derived.txt";
    const after = tasks
      .replace(`"hash":"${planHash}"`, `"hash":"${"b".repeat(64)}"`)
      .replace("- [ ] **任务完成**", "- [x] **任务完成**")
      .replace("- **status**：`pending`", "- **status**：`completed`")
      .replace("- **actual_changes**：N/A — not started", "- **actual_changes**：core/demo.mjs")
      .replace("- **executed_commands**：N/A — not started", "- **executed_commands**：npx vitest run tests/demo.test.mjs; exit 0")
      .replace("- **evidence_refs**：N/A — not started", `- **evidence_refs**：\`[{"ref":"${evidenceRef}","sha256":"${sha256(evidenceRaw)}"}]\``)
      .replace("- **covered_ac**：N/A — not started", "- **covered_ac**：AC1")
      .replace("- **review_fact**：N/A — not reviewed", "- **review_fact**：reviews/results/phase-1.json")
      .replace("- **completed_at**：N/A — not completed", "- **completed_at**：2026-07-31T12:00:00.000Z");
    const completionEvidence = ({ ref }) => ref === evidenceRef ? evidenceRaw : undefined;
    expect(validateTasksOnlyCompletionSeam({ before: tasks, after, taskId: "T001", completionEvidence })).toMatchObject({
      ok: true,
      changed_task_ids: ["T001"],
    });
    const nonTargetStart = after.indexOf("#### T002");
    const tamperedNonTarget = after.slice(0, nonTargetStart)
      + after.slice(nonTargetStart).replace(`"hash":"${planHash}"`, `"hash":"${"c".repeat(64)}"`);
    expect(tamperedNonTarget).not.toBe(after);
    expect(validateTasksOnlyCompletionSeam({
      before: tasks,
      after: tamperedNonTarget,
      taskId: "T001",
      completionEvidence,
    })).toMatchObject({ ok: false });
  });

  it("keeps the current 30-source map closed in spec, plan, and tasks", () => {
    const material = (name) => readFileSync(new URL(`../specs/review-flow-reset/${name}`, import.meta.url), "utf8");
    const result = validatePlanTaskContract({
      spec: material("spec.md"),
      plan: material("plan.md"),
      tasks: material("tasks.md"),
    });
    expect(result.facts.source_coverage).toMatchObject({
      source_count: 30,
      missing_sources: [],
      orphan_sources: [],
      reverse_missing: [],
    });
  });

  it("accepts the rendered inline-code ReferenceBindings through the production v2 validator", () => {
    expect(validatePlanTaskContractV2({
      spec,
      plan,
      tasks,
      specRef: "spec.md",
      specHash,
      planRef: "plan.md",
      planHash,
      tasksRef: "tasks.md",
      tasksHash: sha256(tasks),
    })).toMatchObject({ ok: true, errors: [] });
  });

  it("rejects loss of Done or Risks and rollback", () => {
    const result = validate({ plan: plan.replace("### Done\nThe same assertion moves from RED to GREEN.\n", "") });
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/Done/);
  });

  it("requires risk handoff fields inside the named subsection", () => {
    const misplaced = validate({ plan: plan.replace("### Engineering Risk Handoff\n", "### Notes\n") });
    expect(misplaced.errors.join("\n")).toMatch(/missing Engineering Risk Handoff/);
  });

  it("requires inherited Global Constraints inside Technical Context", () => {
    const missing = validate({ plan: plan.replace(
      "### Global Constraints\nNo unrelated file changes.\n",
      "",
    ) });
    expect(missing.errors.join("\n")).toMatch(/Global Constraints/);
  });

  it("rejects plan/tasks Phase.Files drift and task boundary widening", () => {
    const drift = validate({ tasks: tasks.replace("core/authority.mjs", "core/other-protected.mjs") });
    expect(drift.errors.join("\n")).toMatch(/byte-for-byte/);
    const widened = validate({ tasks: tasks.replace(
      "- **精确文件**：`core/demo.mjs`",
      "- **精确文件**：`core/outside.mjs`",
    ) });
    expect(widened.errors.join("\n")).toMatch(/outside.*NEW\/MODIFY/);
    const orphan = validate({ tasks: tasks.replace(
      "- **精确文件**：`core/demo.mjs`",
      "- **精确文件**：`tests/demo.test.mjs`",
    ).replace(
      "- **boundary**：files: `core/demo.mjs`",
      "- **boundary**：files: `tests/demo.test.mjs`",
    ) });
    expect(orphan.errors.join("\n")).toMatch(/planned file has no owning task.*core\/demo\.mjs/);
    const falseUnion = validate({ plan: plan.replace(
      "- `core/demo.mjs`\n### DO NOT TOUCH",
      "- `core/outside.mjs`\n### DO NOT TOUCH",
    ) });
    expect(falseUnion.errors.join("\n")).toMatch(/global File Boundary/);
  });

  it("detects parallel overlap declared only through boundary", () => {
    const overlapping = validate({ tasks: tasks
      .replaceAll("- **并行**：否 — ordered RED/GREEN", "- **并行**：yes")
      .replace(
        "- **boundary**：files: `core/demo.mjs`; symbols/regions: only the declared symbol.",
        "- **boundary**：files: `core/demo.mjs`, `tests/demo.test.mjs`; symbols/regions: only the declared symbol.",
      ) });
    expect(overlapping.errors.join("\n")).toMatch(/parallel tasks.*overlap files.*tests\/demo\.test\.mjs/);
  });

  it("rejects forward dependencies and RED/GREEN oracle drift", () => {
    const forward = validate({ tasks: tasks.replace("N/A — first task", "T002") });
    expect(forward.errors.join("\n")).toMatch(/before its consumer/);
    const oracle = validate({ tasks: tasks.replace(
      "ORACLE-DEMO — the same assertion reports the intended state.",
      "ORACLE-OTHER — the same assertion reports the intended state.",
    ) });
    expect(oracle.errors.join("\n")).toMatch(/same oracle identity/);
    const frDrift = validate({ tasks: tasks.replace(
      "- **FR**：FR-DEMO-001\n- **AC**：AC1\n- **动作**：Implement",
      "- **FR**：FR-OTHER-001\n- **AC**：AC1\n- **动作**：Implement",
    ) });
    expect(frDrift.errors.join("\n")).toMatch(/same FR IDs|unknown FR/);
  });

  it("rejects zero-exit RED and retained template noise", () => {
    const red = validate({ tasks: tasks.replace("- **expected_exit**：2", "- **expected_exit**：0") });
    expect(red.errors.join("\n")).toMatch(/RED expected_exit/);
    const noisy = validate({ plan: `${plan}\n<!-- fill this -->` });
    expect(noisy.errors.join("\n")).toMatch(/template comments/);
    const codeBraces = validate({ plan: plan.replace(
      "Node.js, ESM, Vitest.",
      "Node.js with `const value = { current: true }` and Vitest.",
    ) });
    expect(codeBraces.ok).toBe(true);
    const textFenceNoise = validate({ plan: plan.replace(
      "Node.js, ESM, Vitest.",
      "Node.js, ESM, Vitest.\n```text\n{producer} → {consumer}\n```",
    ) });
    expect(textFenceNoise.errors.join("\n")).toMatch(/placeholder|template/i);
  });

  it("requires reasoned non-behavior N/A and rejects unsupported versions or empty identity", () => {
    const bypass = validate({ tasks: tasks
      .replace("- **verification_role**：RED", "- **verification_role**：N/A")
      .replace("- **paired_task**：T002", "- **paired_task**：N/A") });
    expect(bypass.errors.join("\n")).toMatch(/N\/A — non-behavior change/);

    const unknownVersion = validate({
      plan: plan.replace("plan-task.v3", "plan-task.v4"),
      tasks: tasks.replace("plan-task.v3", "plan-task.v4"),
    });
    expect(unknownVersion.errors.join("\n")).toMatch(/unsupported explicit template version/);

    const emptySpec = validate({ spec: "# Specification without stable identities" });
    expect(emptySpec.errors.join("\n")).toMatch(/at least one accepted FR.*at least one accepted AC/s);
  });

  it("requires F10 only for each decision that selects new", () => {
    const reuse = validate({ plan: plan
      .replace("- **Selected**: new", "- **Selected**: reuse")
      .replace(/- \*\*F10 real threat\*\*:[^\n]*\n/, "")
      .replace(/- \*\*F10 existing cover\*\*:[^\n]*\n/, "")
      .replace(/- \*\*F10 bypassable\*\*:[^\n]*\n/, "")
      .replace(/- \*\*F10 maintenance cost\*\*:[^\n]*\n/, "") });
    expect(reuse.ok).toBe(true);

    const incompleteNew = validate({ plan: plan.replace(
      "- **F10 maintenance cost**: one fixture.\n",
      "",
    ) });
    expect(incompleteNew.errors.join("\n")).toMatch(/DEC-001.*F10 maintenance cost/);
  });
});
