import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(path, "utf8");
const historicalSpec = "specs/archive/requirements-completeness-audit-20260804/spec.md";
const historicalTasks = "specs/archive/requirements-completeness-audit-20260804/tasks.md";
const historicalDecisionLog = "specs/archive/requirements-completeness-audit-20260804/decision-log.md";
const spec = read(historicalSpec);
const tasks = read(historicalTasks);

// This is an executable index, not a second requirements ledger. Each row
// names the real implementation contract and the real test case that proves
// the corresponding current AC. The referenced test files are also executed
// by the normal Vitest run.
const cases = [
  ["AC-001", "make-decision only reads current material", "runtime/stage/stage-handlers.mjs", "current_materials", "tests/e2e/vnext-five-stage-current.test.mjs", "confirms make-decision before future-stage materials exist"],
  ["AC-002", "non-ENOENT material errors remain loud", "runtime/stage/stage-handlers.mjs", "MATERIAL_INCOMPLETE", "tests/e2e/vnext-five-stage-current.test.mjs", "fails loudly on non-ENOENT current-material reads and does not create future materials"],
  ["AC-003", "all original sources are replayed", "runtime/stage/stage-handlers.mjs", "function requirementReplayFacts", "tests/verify-requirement-replay-contract.test.mjs", "requires a reverse trace from the requirement through every applicable AC"],
  ["AC-004", "Talk and Grill belong only to make-decision", "workflows/make-decision/SKILL.md", "Only the main agent may execute user-facing Talk", "tests/stage-interaction-contract.test.mjs", "keeps Talk and Grill exclusively in make-decision"],
  ["AC-005", "stage-end communication informs humans without gating work", "skills/workflowhub-host-protocol/SKILL.md", "评论是给人看的通知，不是第二套状态机", "tests/stage-interaction-contract.test.mjs", "keeps stage-end communication informative without making it a work gate"],
  ["AC-006", "specification stays source-bound", "runtime/stage/stage-content-contracts.mjs", "validateAcceptanceDesignMinimum", "tests/spec-content-profile.test.mjs", "requires an observable scenario and oracle before build-plan"],
  ["AC-007", "verify binds one leaf per AC", "runtime/evidence/quality-store.mjs", "validateVerifyLeaves", "tests/verify-code-facts.test.mjs", "accepts one source-bound verify leaf per AC"],
  ["AC-008", "quality facts do not block same-task repair", "runtime/stage/completion-predicates.mjs", "Work readiness is deliberately separate", "tests/e2e/vnext-five-stage-current.test.mjs", "keeps work ready but reports incomplete quality until failure is repaired"],
  ["AC-009", "structural fact-write errors fail loudly without freezing work", "skills/workflowhub-host-protocol/SKILL.md", "失败只拒绝该次事实写入，不冻结工作", "tests/contract/four-material-non-gate-contract.test.mjs", "keeps same-task work ready"],
  ["AC-010", "review failure provenance is preserved", "skills/wh-review/scripts/review-runner.mjs", "attempt", "skills/wh-review/scripts/__tests__/review-runner.test.mjs", "keeps provider failures separate from finding quality facts"],
  ["AC-011", "provider route configuration is preserved", "skills/wh-review/scripts/third-review-host-config.mjs", "single_round", "skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs", "preserves make-decision single_round routes"],
  ["AC-012", "stage content has no mutable current projection", "runtime/evidence/stage-content-evidence.mjs", "Historical stage-content records are readable only through an explicit", "tests/contract/four-material-non-gate-contract.test.mjs", "keeps legacy stage-content access explicit and immutable"],
  ["AC-013", "five report identities remain visible", historicalDecisionLog, "F15-1", "tests/decision-log-content-contract.test.mjs", "keeps the decision index complete"],
  ["AC-014", "historical facts cannot prove current work", "runtime/evidence/freshness.mjs", "stale", "tests/verify-code-freshness.test.mjs", "does not treat a stale current snapshot as fresh verification evidence"],
  ["AC-015", "current four materials are authoritative", "runtime/task/material-workspace.mjs", "CURRENT_MATERIAL_FILES", "tests/workflow-v2-contract.test.mjs", "uses the four materials as the current work authority"],
  ["AC-016", "business delivery and formal close stay separate", "runtime/evidence/stage-completion-facts.mjs", "completion_effect", "tests/stage-risk-acceptance.test.mjs", "separates ordinary progress, structurally authentic publication, and fail-closed completion"],
  ["AC-017", "decision entries retain their load-bearing fields", "runtime/stage/stage-content-contracts.mjs", "decision", "tests/stage-decision-contract.test.mjs", "accepts a complete main document with one source covered exactly once"],
  ["AC-018", "public review protocol failures are classified", "skills/wh-review/scripts/review-provider-client.mjs", "PUBLIC_RESULT_INVALID", "skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs", "keeps protocol mismatch and invalid format non-semantic"],
  ["AC-019", "each finding has an explicit disposition", "runtime/review/stage-review-disposition.mjs", "finding", "tests/stage-risk-acceptance.test.mjs", "uses canonical reportable findings instead of non-adopted adjudication clusters"],
  ["AC-020", "stale material cannot overwrite a new decision", "runtime/task/task-kernel-implementation.mjs", "material", "tests/e2e/vnext-five-stage-current.test.mjs", "keeps material revision and repair on the same task"],
  ["AC-021", "optional maps stay path and anchor safe", "skills/wh-review/scripts/review-materials.mjs", "validateAuthorityMap", "tests/contract/review-materials-contract.test.mjs", "rejects one shared proving anchor"],
  ["AC-022", "review findings are not a progression gate", "workflows/build-code/SKILL.md", "findings and transport status are not a progression gate", "tests/stage-review-cost-policy.test.mjs", "keeps review as quality evidence, not work permission"],
  ["AC-023", "changed early-stage material keeps review advisory", "workflows/build-spec/SKILL.md", "Review is a quality fact", "tests/stage-review-cost-policy.test.mjs", "keeps review as quality evidence, not work permission"],
  ["AC-024", "scope revision public input is removed", "skills/wh-review/scripts/wh-review-cli.mjs", "materials.scope_revision is unsupported", "skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs", "rejects the removed scope revision public input"],
  ["AC-025", "content skills and templates are consumed", "workflows/build-spec/skill-deps.yaml", "spec-specify", "tests/contract/spec-stage-artifact-closure.test.mjs", "keeps the recovered content skills declared by their owning stage"],
  ["AC-026", "apply phases retain quality facts", "workflows/build-code/SKILL.md", "Phase Card", "tests/contract/build-code-apply-contract.test.mjs", "requires per-phase execution facts and a final task strategy summary"],
  ["AC-027", "build-plan designs verification without fixed runtime fields", "workflows/build-plan/SKILL.md", "Do not implement code or execute RED/GREEN", "tests/contract/spec-stage-artifact-closure.test.mjs", "keeps plan and task templates design-only without runtime sediment"],
  ["AC-028", "build-code executes checks against the actual changed scope", "workflows/build-code/SKILL.md", "actual changed files", "tests/contract/build-code-apply-contract.test.mjs", "reroutes concrete testing against real scope"],
  ["AC-029", "restored content skills have auditable provenance", historicalDecisionLog, "c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf", "tests/contract/spec-stage-artifact-closure.test.mjs", "keeps the recovered content skills declared by their owning stage"],
  ["AC-030", "work readiness derives only from current material presence", "runtime/stage/completion-predicates.mjs", "deriveStageProgress", "tests/contract/stage-progress-contract.test.mjs", "derives only work readiness from material presence"],
  ["AC-031", "missing semantic evidence stays incomplete", "runtime/stage/stage-handlers.mjs", "semantic proof is incomplete", "tests/verify-requirement-replay-contract.test.mjs", "requires a reverse trace from the requirement through every applicable AC"],
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

  it("AC-003 keeps research conditional and missing research evidence incomplete", () => {
    const skill = read("workflows/verify-code/SKILL.md");
    const decision = read(historicalDecisionLog);
    expect(skill).toMatch(/decision-log\s*明确引用了研究/);
    expect(skill).toMatch(/unknown\/incomplete/);
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
