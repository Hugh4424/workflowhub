import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { deriveStageCompletion, STAGE_PREDICATES } from "../../runtime/stage/completion-predicates.mjs";
import { acceptanceModeFor, requiresHumanConfirmation } from "../../runtime/stage/stage-acceptance-policy.mjs";
import { validateHumanConfirmation } from "../../runtime/evidence/canonical-evidence-validators.mjs";
import { officialStageHandler } from "../../runtime/stage/stage-handlers.mjs";
import { stageRuntimeCliMain } from "../../tools/cli/stage-runtime.mjs";

const hash = (value) => createHash("sha256").update(value).digest("hex");
const PLAN_HANDLER_MATERIALS = Object.freeze({
  "decision-log.md": "# Decision Log\n",
  "spec.md": "# Specification\n## Requirements\n- **FR-001**: first behavior.\n## Acceptance\n- **AC-001**: first behavior. ← FR-001\n",
  "plan.md": `# Implementation Plan
## Technical Context
Node.js.
## Global Constraints
No host identity discovery.
## Modules, Interfaces, and Data Contracts
One validator.
## Implementation Order
Phase 1 RED precedes Phase 2 GREEN.
## Test Strategy
Run the exact command.
## Rollback and Recovery
Revert current implementation.
## FR to AC to Step Traceability
FR-001 → T001 → AC-001.
## Constitution Check
F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 Q1 Q2 Q3 S1 S2 S3 S4 S5 S6 S7 S8.
## Complexity Trade-offs
Reuse existing code.
## Phase 1: Contract RED
### Goal
Prove the old implementation accepts a gap.
### Files
runtime/example.mjs.
### Tasks
T001.
### Verify
npx vitest run tests/contract/confirmation-authorization.test.mjs; expected exit 1.
### Knowledge
No external facts.
### STOP
Stop on invalid evidence.
## Phase 2: Contract GREEN
### Goal
Reject the gap.
### Files
runtime/example.mjs.
### Tasks
T002.
### Verify
npx vitest run tests/contract/confirmation-authorization.test.mjs; expected exit 0.
### Knowledge
T001 is the RED oracle.
### STOP
Stop on invalid evidence.
`,
  "tasks.md": `# Tasks
#### T001 — contract RED
- **ID**: T001
- **动作**: Add a failing fixture.
- **精确文件**: tests/contract/confirmation-authorization.test.mjs
- **输入**: FR-001
- **输出**: RED evidence
- **依赖**: none
- **并行**: no
- **FR**: FR-001
- **AC**: AC-001
- **gate_cmd**: npx vitest run tests/contract/confirmation-authorization.test.mjs
- **expected_exit**: 1
- **oracle**: Old implementation accepts invalid fixture.
- **evidence_path**: quality/tests/T001.json

#### T002 — contract GREEN
- **ID**: T002
- **动作**: Implement deterministic validation.
- **精确文件**: runtime/example.mjs
- **输入**: T001 fixtures
- **输出**: GREEN evidence
- **依赖**: T001
- **并行**: no
- **FR**: FR-001
- **AC**: AC-001
- **gate_cmd**: npx vitest run tests/contract/confirmation-authorization.test.mjs
- **expected_exit**: 0
- **oracle**: Valid fixture passes and invalid fixture fails.
- **evidence_path**: quality/tests/T002.json
`,
});

function planHandlerFixture(value) {
  const raw = `${JSON.stringify(value)}\n`;
  const confirmationHash = hash(raw);
  const confirmationRef = `quality/confirmations/${confirmationHash}.json`;
  const snapshot = { tree: "a".repeat(40), source_digest: "b".repeat(64) };
  return {
    confirmationRef,
    confirmationHash,
    worker: {
      stage: "build-plan",
      identity: { taskId: "task" },
      manifest: { record_model: "vnext-single-write" },
      readArtifact(name) { return PLAN_HANDLER_MATERIALS[name]; },
      artifactRef(name) { return name; },
      snapshotWorkspace() { return snapshot; },
      readReceipt(ref) {
        if (ref !== confirmationRef) {
          const error = new Error(`missing fixture receipt: ${ref}`);
          error.code = "ENOENT";
          throw error;
        }
        return { value, sha256: confirmationHash };
      },
    },
  };
}

function factsFor(stage) {
  return Object.entries(STAGE_PREDICATES[stage]).map(([subject, kind], index) => ({
    fact: {
      ref: `quality/${subject}.json`,
      value: { task_id: "task", stage, material_revision: "revision", snapshot_tree: "tree", kind, subject, status: kind === "review" ? "recorded" : "passed", fact_id: `fact-${index}` },
    },
    freshness: { status: "current" },
    authenticated: true,
    ...(stage === "verify-code" && subject === "code_review" ? { review_status: "clean" } : {}),
  }));
}

describe("confirmation and authorization boundary", () => {
  it("does not treat authorization as human confirmation", () => {
    const facts = factsFor("verify-code").filter(({ fact }) => fact.value.subject !== "human_confirmation");
    facts.push({
      fact: {
        ref: "authorization/decision.json",
        value: { task_id: "task", stage: "verify-code", material_revision: "revision", snapshot_tree: "tree", kind: "authorization", subject: "human_confirmation", status: "passed", fact_id: "authorization-fact" },
      },
      freshness: { status: "current" },
      authenticated: true,
    });

    expect(deriveStageCompletion("verify-code", facts)).toMatchObject({ status: "in_progress", missing: ["human_confirmation"] });
  });

  it("keeps confirmation requirements separate from automatic stage acceptance", () => {
    expect(acceptanceModeFor("verify-code")).toBe("human");
    expect(requiresHumanConfirmation("verify-code")).toBe(true);
    expect(acceptanceModeFor("build-code")).toBe("automatic");
    expect(requiresHumanConfirmation("build-code")).toBe(false);
  });

  it("does not add a second close action to the authorize operation set", async () => {
    const help = await stageRuntimeCliMain(["--help"]);
    expect(help.actions.authorize).toEqual(["commit", "push", "merge", "archive", "cleanup"]);
  });

  it("requires a non-empty subject_ref for formal confirmation facts", () => {
    const value = {
      schema_version: "human-confirmation.v2",
      task_id: "task",
      stage: "verify-code",
      decision: "accepted",
      material_revision: `revision-${"a".repeat(64)}`,
      snapshot_tree: "b".repeat(40),
      confirmed_at: "2026-08-16T00:00:00.000Z",
    };
    expect(() => validateHumanConfirmation(value, { taskId: "task", stage: "verify-code", requireAccepted: true, requireSubjectRef: true }))
      .toThrow(/binding is invalid/);
  });

  it("checks an expected confirmation subject when the caller supplies one", () => {
    const value = {
      schema_version: "human-confirmation.v2",
      task_id: "task",
      stage: "verify-code",
      decision: "accepted",
      subject_ref: "operations/close/plans/current.json",
      material_revision: `revision-${"a".repeat(64)}`,
      snapshot_tree: "b".repeat(40),
      confirmed_at: "2026-08-16T00:00:00.000Z",
    };
    expect(() => validateHumanConfirmation(value, { taskId: "task", stage: "verify-code", subject: "operations/close/plans/other.json", requireSubjectRef: true }))
      .toThrow(/binding is invalid/);
    expect(validateHumanConfirmation(value, { taskId: "task", stage: "verify-code", subject: "operations/close/plans/current.json", requireSubjectRef: true }))
      .toBe(value);
  });

  it("lets the official build-plan handler consume the current v2 confirmation", async () => {
    const value = {
      schema_version: "human-confirmation.v2",
      task_id: "task",
      stage: "build-plan",
      decision: "accepted",
      subject_ref: null,
      material_revision: `revision-${"c".repeat(64)}`,
      snapshot_tree: "a".repeat(40),
      confirmed_at: "2026-08-21T00:00:00.000Z",
    };
    const fixture = planHandlerFixture(value);
    const result = await officialStageHandler("build-plan")(fixture.worker, {
      receipts: { confirmation: fixture.confirmationRef },
    });

    expect(result.facts.human_confirmation).toMatchObject({
      decision: "accepted",
      confirmation_ref: fixture.confirmationRef,
      confirmation_hash: fixture.confirmationHash,
      snapshot_tree: value.snapshot_tree,
    });
    expect(result.evidence_refs).toContainEqual({ ref: fixture.confirmationRef, sha256: fixture.confirmationHash });
  });

  it("rejects a legacy confirmation schema on the build-plan handler path", async () => {
    const fixture = planHandlerFixture({
      schema_version: "human-confirmation.v1",
      task_id: "task",
      stage: "build-plan",
      decision: "accepted",
      confirmed_at: "2026-08-21T00:00:00.000Z",
    });

    await expect(officialStageHandler("build-plan")(fixture.worker, {
      receipts: { confirmation: fixture.confirmationRef },
    })).rejects.toThrow(/human-confirmation\.v2/);
  });
});
