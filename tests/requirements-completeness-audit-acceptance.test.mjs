import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(path, "utf8");
const spec = read("specs/requirements-completeness-audit-20260804/spec.md");
const tasks = read("specs/requirements-completeness-audit-20260804/tasks.md");

// This is an executable index, not a second requirements ledger. Each row
// names the real implementation contract and the real test case that proves
// the corresponding current AC. The referenced test files are also executed
// by the normal Vitest run.
const cases = [
  ["AC-001", "make-decision only reads current material", "runtime/stage/stage-handlers.mjs", "current_materials", "tests/e2e/vnext-five-stage-current.test.mjs", "confirms make-decision before future-stage materials exist"],
  ["AC-002", "non-ENOENT material errors remain loud", "runtime/stage/stage-handlers.mjs", "MATERIAL_INCOMPLETE", "tests/e2e/vnext-five-stage-current.test.mjs", "fails loudly on non-ENOENT current-material reads and does not create future materials"],
  ["AC-003", "all original sources are replayed", "runtime/stage/stage-handlers.mjs", "function requirementReplayFacts", "tests/verify-requirement-replay-contract.test.mjs", "requires reverse replay of requirements, design, and the full user journey"],
  ["AC-004", "user communication belongs to the main agent", "workflows/make-decision/SKILL.md", "Only the main agent may execute user-facing Talk", "tests/stage-interaction-contract.test.mjs", "keeps user-facing communication in the main agent"],
  ["AC-005", "stage summaries require a real handoff", "runtime/evidence/stage-completion-facts.mjs", "confirmation_summary", "tests/stage-completion-facts.test.mjs", "projects a plain-language stage handoff summary into the user view"],
  ["AC-006", "specification stays source-bound", "runtime/stage/stage-content-contracts.mjs", "validateAcceptanceDesignMinimum", "tests/spec-content-profile.test.mjs", "requires an observable scenario and oracle before build-plan"],
  ["AC-007", "verify binds one leaf per AC", "runtime/evidence/quality-store.mjs", "validateVerifyLeaves", "tests/verify-code-facts.test.mjs", "accepts one source-bound verify leaf per AC"],
  ["AC-008", "quality facts do not block same-task repair", "runtime/stage/completion-predicates.mjs", "quality_status", "tests/e2e/vnext-five-stage-current.test.mjs", "records failed or unavailable evidence without blocking stage progression"],
  ["AC-009", "structural receipt errors fail loudly", "runtime/evidence/canonical-receipt-writer.mjs", "publishIdempotently", "tests/official-component-receipts.test.mjs", "rejects caller boolean phase completion"],
  ["AC-010", "review failure provenance is preserved", "skills/wh-review/scripts/review-runner.mjs", "attempt", "skills/wh-review/scripts/__tests__/review-runner.test.mjs", "keeps attempt failures separate from finding quality facts"],
  ["AC-011", "provider route configuration is preserved", "skills/wh-review/scripts/third-review-host-config.mjs", "single_round", "skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs", "preserves make-decision single_round routes"],
  ["AC-012", "stage content uses CAS latest", "runtime/evidence/stage-content-evidence.mjs", "stage content latest pointer", "tests/e2e/vnext-five-stage-current.test.mjs", "advances an immutable stage-content revision through the CAS latest pointer"],
  ["AC-013", "five report identities remain visible", "specs/requirements-completeness-audit-20260804/decision-log.md", "F15-1", "tests/decision-log-content-contract.test.mjs", "keeps the decision index complete"],
  ["AC-014", "historical facts cannot prove current work", "runtime/evidence/freshness.mjs", "stale", "tests/verify-code-freshness.test.mjs", "does not treat a stale current snapshot as fresh verification evidence"],
  ["AC-015", "current four materials are authoritative", "runtime/task/material-workspace.mjs", "CURRENT_MATERIAL_FILES", "tests/workflow-v2-contract.test.mjs", "makes current materials authoritative and historical records audit-only"],
  ["AC-016", "business delivery and formal close stay separate", "runtime/evidence/stage-completion-facts.mjs", "completion_effect", "tests/stage-risk-acceptance.test.mjs", "separates ordinary progress, structurally authentic publication, and fail-closed completion"],
  ["AC-017", "decision entries retain their load-bearing fields", "runtime/stage/stage-content-contracts.mjs", "decision", "tests/stage-decision-contract.test.mjs", "accepts a complete main document with one source covered exactly once"],
  ["AC-018", "public review protocol failures are classified", "skills/wh-review/scripts/review-provider-client.mjs", "PUBLIC_RESULT_INVALID", "skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs", "keeps protocol mismatch and invalid format non-semantic"],
  ["AC-019", "each finding has an explicit disposition", "runtime/review/stage-review-disposition.mjs", "finding", "tests/stage-risk-acceptance.test.mjs", "uses canonical reportable findings instead of non-adopted adjudication clusters"],
  ["AC-020", "stale material cannot overwrite a new decision", "runtime/task/task-kernel-implementation.mjs", "material", "tests/e2e/vnext-five-stage-current.test.mjs", "keeps material revision and repair on the same task"],
  ["AC-021", "v2 maps are checked before provider dispatch", "skills/wh-review/scripts/review-materials.mjs", "MATERIAL_INCOMPLETE", "tests/contract/review-materials-contract.test.mjs", "keeps canonical manifests deterministic and rejects generic AC maps"],
  ["AC-022", "revise_required is not a progression gate", "runtime/review/review-controller.mjs", "revise_required", "tests/stage-review-cost-policy.test.mjs", "keeps code review's changed-snapshot policy unchanged"],
  ["AC-023", "changed early-stage material uses one delta review", "runtime/review/review-controller.mjs", "incremental", "tests/stage-review-cost-policy.test.mjs", "uses one incremental review for changed first-three-stage material after a pass"],
  ["AC-024", "scope revision is one bounded review", "runtime/review/scope-revision-contract.mjs", "SCOPE_REVISION_REVIEW_KIND", "tests/contract/scope-revision-contract.test.mjs", "uses a dedicated prompt and only permits one initial review"],
  ["AC-025", "content skills and templates are consumed", "workflows/build-spec/skill-deps.yaml", "spec-specify", "tests/contract/spec-stage-artifact-closure.test.mjs", "keeps the recovered content skills declared by their owning stage"],
  ["AC-026", "apply phases retain quality facts", "workflows/build-code/SKILL.md", "Phase Card", "tests/contract/build-code-apply-contract.test.mjs", "requires per-phase execution facts and a final task strategy summary"],
  ["AC-027", "build-plan writes a complete test strategy", "skills/spec-tasks/templates/tasks-template.md", "test_strategy", "tests/contract/spec-stage-artifact-closure.test.mjs", "requires every current task card to carry an executable, source-bound strategy"],
  ["AC-028", "build-code executes the recorded strategy", "workflows/build-code/steps.json", "test_strategy", "tests/contract/build-code-apply-contract.test.mjs", "consumes the task strategy instead of designing tests during execution"],
  ["AC-029", "restored content skills have auditable provenance", "specs/requirements-completeness-audit-20260804/decision-log.md", "c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf", "tests/contract/spec-stage-artifact-closure.test.mjs", "retains the high-value template fields without creating a second authority"],
  ["AC-030", "stage progress and exact paths are explicit", "runtime/stage/completion-predicates.mjs", "validateWorkflowHubStageProgress", "tests/contract/stage-progress-contract.test.mjs", "requires plan and tasks to expose their own stage progress rows"],
  ["AC-031", "missing semantic evidence stays incomplete", "runtime/stage/stage-handlers.mjs", "semantic proof is incomplete", "tests/verify-requirement-replay-contract.test.mjs", "requires reverse replay of requirements, design, and the full user journey"],
];

describe("requirements-completeness-audit current acceptance matrix", () => {
  for (const [id, title, implementationPath, implementationMarker, testPath, testMarker] of cases) {
    it(`${id}: ${title}`, () => {
      expect(spec).toContain(id);
      expect(tasks).toContain(id);
      expect(read(implementationPath)).toContain(implementationMarker);
      expect(read(testPath)).toContain(testMarker);
    });
  }

  it("AC-003 binds the mandatory research receipt and its fixed hash", () => {
    const skill = read("workflows/verify-code/SKILL.md");
    const decision = read("specs/requirements-completeness-audit-20260804/decision-log.md");
    expect(skill).toContain("quality/tests/research.json");
    expect(skill).toContain("422f4044bfc68952c8ca917057e6930e51f7825943b49a0727e1b2936457ffe0");
    expect(decision).toContain("13 个研究角色");
    expect(decision).toContain("五份报告均已读");
  });

  it("AC-018 names all four required public failure classifications", () => {
    const source = read("skills/wh-review/scripts/review-result.mjs");
    for (const code of ["PUBLIC_RESULT_INVALID", "PROTOCOL_INCOMPATIBLE", "MATERIAL_INCOMPLETE", "PROFILE_MISMATCH"]) {
      expect(source).toContain(code);
    }
  });
});

export { cases };
