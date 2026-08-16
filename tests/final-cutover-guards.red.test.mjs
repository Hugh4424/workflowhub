import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { certifyBuildCodeQualityBasis, officialStageHandler } from "../runtime/stage/stage-handlers.mjs";
import { validateStageFacts } from "../runtime/task/task-kernel.mjs";
import { aggregateProviderResults } from "../skills/wh-review/scripts/review-result.mjs";
import { buildRiskAcceptance, deriveSeriousReviewPause } from "../runtime/review/stage-review-disposition.mjs";

// Retired resolution records are only fixture data here; production no longer
// has a builder or a consumer for them.
const buildNonGateReviewResponseRecord = () => ({});

describe("final cutover guard contracts", () => {
  const sha = createHash("sha256").update("true").digest("hex"), tree = "b".repeat(40);
  const providerFilePart = (provider) => `p-${Buffer.from(provider, "utf8").toString("base64url")}`;
  const canonicalHash = (value) => createHash("sha256").update(`${JSON.stringify(value, null, 2)}\n`).digest("hex");

  it("does not certify build-code completion from an unrecorded review quality fact", () => {
    expect(certifyBuildCodeQualityBasis({
      changedFiles: [],
      plannedChanges: [],
      tests: { exit_code: 0 },
      review: { status: "unknown", result_ref: "quality/reviews/results/review.json", result_hash: sha },
      expectedAc: ["AC1"],
      coveredAc: ["AC1"],
    })).toMatchObject({ quality_gaps: ["integration review is not passing"] });
  });
  it("keeps an unavailable integration review visible without creating a build-code progression gate", () => {
    expect(certifyBuildCodeQualityBasis({
      changedFiles: [],
      plannedChanges: [],
      tests: { exit_code: 0 },
      review: { status: "unavailable", attempt_ref: "quality/reviews/attempts/review/attempt.json", attempt_hash: sha },
      expectedAc: ["AC1"],
      coveredAc: ["AC1"],
    })).toMatchObject({ review: { status: "unavailable" } });
  });
  const canonical = (stage, overrides = {}) => ({ schema_version: "workflowhub-receipt.v1", producer: { stage, component: "tests", version: "1" }, task_id: "task", stage, ...overrides });
  const completedBuildCodeDocuments = () => {
    const spec = `# Specification

## Requirements
- **FR-DEMO-001**: bind the final integration review.

## Acceptance
- **AC1**: the accepted facts retain integration scope. ← FR-DEMO-001
`;
    const plan = `# Implementation Plan

## Technical Context
Node.js, ESM, Vitest.
## Global Constraints
No product mutation outside the declared task.
## Modules, Interfaces, and Data Contracts
The build-code handler consumes authenticated receipts and current task completion.
## Implementation Order
T001 RED precedes T002 GREEN.
## Test Strategy
Run the exact focused command.
## Rollback and Recovery
Revert only the fixture.
## FR to AC to Step Traceability
FR-DEMO-001 → T001, T002 → AC1.
## Constitution Check
F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 Q1 Q2 Q3 S1 S2 S3 S4 S5 S6 S7 S8.
## Complexity Trade-offs
Reuse the production handler.

## Phase 1: Integration scope
### Goal
Retain authenticated integration scope.
### Files
No changed product files.
### Tasks
T001, T002.
### Verify
true.
### Knowledge
The fixture supplies current authenticated facts.
### STOP
Stop on fixture setup failure.
`;
    const completion = `##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：\`completed\`
- **actual_changes**：\`[]\`
- **executed_commands**：\`[{"command":"true","exit_code":0}]\`
- **evidence_refs**：\`[{"kind":"task_record","ref":"quality/tests/tests.json","sha256":"${sha}"},{"kind":"task_record","ref":"quality/evidence/implementation.json","sha256":"${sha}"},{"kind":"task_record","ref":"evidence/ac1.json","sha256":"${sha}"}]\`
- **covered_ac**：AC1
- **review_fact**：quality/reviews/results/review.json
- **completed_at**：2026-07-29T12:00:00.000Z`;
    const task = (id, title, expectedExit, dependency) => `#### ${id} — ${title}
- **ID**: ${id}
- **动作**: Exercise the integration-scope contract.
- **精确文件**: tests/final-cutover-guards.red.test.mjs
- **输入**: FR-DEMO-001
- **输出**: focused evidence
- **依赖**: ${dependency}
- **并行**: no
- **FR**: FR-DEMO-001
- **AC**: AC1
- **gate_cmd**: true
- **expected_exit**: ${expectedExit}
- **oracle**: The accepted review fact retains integration scope.
- **evidence_path**: apply/evidence/${id}.stdout

${completion}`;
    return {
      spec,
      plan,
      tasks: `# Tasks

${task("T001", "contract RED", 1, "none")}

${task("T002", "contract GREEN", 0, "T001")}
`,
    };
  };
  const testsReceipt = (stage, snapshotTree = tree) => canonical(stage, { command: "true", exit_code: 0, command_hash: sha, snapshot_head: tree, snapshot_tree: snapshotTree, snapshot_commit: tree, started_at: "2026-07-19T00:00:00.000Z", completed_at: "2026-07-19T00:00:01.000Z", output_ref: "quality/tests/output/test.txt", output_hash: sha });
  const reviewReceipt = (stage, verdict = "pass", snapshotTree = tree, subjectKind = "worktree") => {
    const reviewStage = stage === "verify-code" ? "build-code" : stage;
    const reviewScope = reviewStage === "build-code" ? (subjectKind === "phase" ? "phase" : "integration") : null;
    const providerFinding = { severity: "major", path: "fixture", issue: "fixture", root_cause: "fixture review identifies an anchored issue", recommendation: "revise", evidence_kind: "direct", evidence: "fixture evidence is anchored to the fixture path" };
    const providerOutput = verdict === "invented"
      ? { verdict, findings: [{ severity: "minor", path: "fixture", issue: "fixture", recommendation: "revise" }] }
      : { findings: verdict === "revise_required" ? [providerFinding] : [] };
    const aggregation = verdict === "invented" ? null : aggregateProviderResults([{ provider: "fixture-provider", review: providerOutput }], 1);
    return { version: "wh-review-result.v1", task_id: "task", stage: reviewStage, review_track: null,
      source: { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree }, snapshot_tree: snapshotTree,
      subject_kind: subjectKind, phase_id: subjectKind === "phase" ? "phase-1" : null, review_scope: reviewScope, base_tree: tree, candidate_tree: snapshotTree,
      material_id: sha, attempt_ref: `quality/reviews/attempts/${stage}-attempt/attempt.json`,
      provider_results: [{ provider: "fixture-provider", output: providerOutput }],
      ...(verdict === "invented" ? { verdict } : {}),
      findings: aggregation ? aggregation.findings.map((item) => ({ provider: item.providers[0], ...item })) : (verdict === "invented" ? [{ provider: "fixture-provider", severity: "minor", path: "fixture", issue: "fixture", recommendation: "revise" }] : []),
      ...(aggregation ? { adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters } } : {}) };
  };
  const qualityReviewReceipt = (snapshotTree = tree) => ({
    ...reviewReceipt("build-code", "pass", snapshotTree),
    stage: "verify-code", review_scope: null, phase_id: null,
    attempt_ref: "quality/reviews/attempts/quality-attempt/attempt.json",
  });
  const reviewFlow = (resultRef, result, overrides = {}) => ({
    version: "wh-review-flow-event.v1",
    event_kind: "semantic_result",
    event_ref: `quality/reviews/flows/${"f".repeat(64)}/event-0001.json`,
    identity: {
      task_id: "task", workflow_run_id: "fixture:attempt-0001", stage: result.stage,
      review_track: result.review_track ?? null, subject_kind: result.subject_kind,
      phase_id: result.phase_id ?? null, review_scope: result.review_scope ?? null,
    },
    root_result_ref: resultRef,
    head_result_ref: resultRef,
    result_sha256: sha,
    ...overrides,
  });
  const workerFor = (stage, values, currentTree = tree) => {
    const documents = completedBuildCodeDocuments();
    const workflowRunId = "fixture:attempt-0001";
    const auditRef = `quality/evidence/audits/${stage}/${"f".repeat(64)}.json`;
    if (!values[auditRef]) {
      const audit = {
        schema_version: "v1", task_id: "task", stage_slug: stage, verdict: "pass",
        summary_hash: sha, workflow_run_id: workflowRunId, snapshot_tree: currentTree,
        content_evidence_refs: [],
        ...(stage === "make-decision" ? { through_step_id: 10, audit_scope: "pre_confirmation" } : {}),
      };
      if (stage === "make-decision" && values["quality/evidence/decision.json"]?.decision_ref && values["quality/evidence/decision.json"]?.decision_hash) {
        const decision = values["quality/evidence/decision.json"];
        const payload = {
          interaction_type: "aggregate", workspace_tree: currentTree,
          decision_ref: decision.decision_ref, decision_hash: decision.decision_hash,
        };
        if (!values["evidence/interaction.json"]) values["evidence/interaction.json"] = {
          schema_version: "stage-content-evidence.v1", kind: "interaction-completion.v1",
          task_id: "task", stage, workflow_run_id: workflowRunId, snapshot_tree: currentTree,
          content_hash: createHash("sha256").update(JSON.stringify(payload)).digest("hex"), payload,
        };
        audit.content_evidence_refs = [{ kind: "interaction-completion.v1", ref: "evidence/interaction.json", hash: sha }];
        values[decision.decision_ref] = "# Decision fixture\n";
      }
      values[auditRef] = audit;
    }
    let qualityReviewRef = null;
    if (stage === "verify-code" && !values["quality/reviews/results/quality.json"]) {
      qualityReviewRef = "quality/reviews/results/quality.json";
      values[qualityReviewRef] = qualityReviewReceipt(currentTree);
    } else if (stage === "verify-code") {
      qualityReviewRef = "quality/reviews/results/quality.json";
    }
    for (const result of Object.values(values).filter((value) => value?.version === "wh-review-result.v1")) {
      const attemptId = result.attempt_ref.split("/")[3], outputRef = `quality/reviews/attempts/${attemptId}/providers/${providerFilePart("fixture-provider")}.output.json`;
      const content = JSON.stringify(result.provider_results[0].output);
      values[result.attempt_ref] = { version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: "task", stage: result.stage, review_track: result.review_track ?? null,
        source: result.source, snapshot_tree: result.snapshot_tree, material_id: result.material_id,
        subject_kind: result.subject_kind, phase_id: result.phase_id, review_scope: result.review_scope, base_tree: result.base_tree, candidate_tree: result.candidate_tree,
        provider_attempts: [{ provider: "fixture-provider", status: "completed", session_id: "fixture", runtime_id: "fixture", output_ref: outputRef, error: null }], terminal_status: "semantic", error: null };
      values[outputRef] = { schema_version: "wh-review-provider-output.v1", task_id: "task", stage: result.stage, attempt_id: attemptId,
        provider: "fixture-provider", content, content_hash: createHash("sha256").update(content).digest("hex") };
    }
    // Build-code now authenticates the execution-baseline diff before it can
    // reach the review-chain assertions below.  These fixtures use HEAD as a
    // stable synthetic baseline and an empty diff; tests that need a special
    // diff override readEvidence after this helper returns.
    if (stage === "build-code" && values["quality/evidence/implementation.json"]?.diff_ref) {
      const implementation = values["quality/evidence/implementation.json"];
      implementation.snapshot_commit = "HEAD";
      const diffRef = implementation.diff_ref;
      if (!values[diffRef]) values[diffRef] = JSON.stringify({
        schema_version: "workflowhub-diff-evidence.v1",
        baseline_commit: "HEAD",
        snapshot_tree: implementation.snapshot_tree,
      });
    }
    return {
      stage,
      workflowRunId,
      identity: { taskId: "task" },
      workspace: { worktreeRoot: resolve(".") },
      readArtifact: (name) => documents[name.replace(/\.md$/, "")],
      artifactRef: (name) => `specs/task/${name}`,
      readCompletionInvocationFacts: () => ({
        declaredComponents: [],
        invocationFacts: [],
      }),
      readReceipt: (ref) => ({
        value: values[ref],
        sha256: stage === "build-spec" && ref === "quality/evidence/spec.json" ? canonicalHash(values[ref]) : sha,
      }),
      readOptionalReceipt: (ref) => values[ref] === undefined ? null : ({
        value: values[ref],
        sha256: stage === "build-spec" && ref === "quality/evidence/spec.json" ? canonicalHash(values[ref]) : sha,
      }),
      readEvidence: (ref) => ({
        bytes: values[ref], value: values[ref],
        sha256: values[`${ref}:sha256`] ?? sha,
      }),
      readAuthenticatedReviewFlow: (subject) => {
        const entry = Object.entries(values).find(([ref, value]) => ref.startsWith("quality/reviews/results/")
          && value?.version === "wh-review-result.v1"
          && value.stage === subject.stage
          && (value.review_track ?? null) === (subject.review_track ?? null)
          && value.subject_kind === subject.subject_kind
          && (value.phase_id ?? null) === (subject.phase_id ?? null)
          && (value.review_scope ?? null) === (subject.review_scope ?? null));
        if (entry) return reviewFlow(entry[0], entry[1]);
        const attempt = Object.entries(values).find(([ref, value]) => ref.startsWith("quality/reviews/attempts/") && ref.endsWith("/attempt.json")
          && value?.terminal_status === "unavailable"
          && value.stage === subject.stage
          && (value.review_track ?? null) === (subject.review_track ?? null)
          && value.subject_kind === subject.subject_kind
          && (value.phase_id ?? null) === (subject.phase_id ?? null)
          && (value.review_scope ?? null) === (subject.review_scope ?? null));
        if (!attempt) throw new Error("fixture authenticated review flow not found");
        return reviewFlow("quality/reviews/results/none.json", attempt[1], {
          event_kind: "provider_attempt",
          action_ref: attempt[0],
          action_sha256: sha,
          root_result_ref: null,
          head_result_ref: null,
          result_sha256: null,
        });
      },
      snapshotWorkspace: () => ({ tree: currentTree }),
      readAcceptedBuildCode: () => ({ facts: { tests: { snapshot_tree: tree }, acceptance_coverage: { snapshot_tree: tree, accepted_criterion_ids: ["AC-1"], items: [] }, review: { result_ref: "quality/reviews/results/review.json", result_hash: sha, snapshot_tree: tree, subject_kind: "worktree", phase_id: null, review_scope: "integration" } } }),
      auditRef,
      qualityReviewRef,
    };
  };

  it.each([
    ["tests", "notes/tests.json"],
    ["review", "evidence/review.json"],
    ["evidence", "quality/reviews/results/evidence.json"],
  ])("rejects a %s receipt outside its canonical namespace", async (kind, badRef) => {
    const values = {
      "notes/tests.json": { command: "true", exit_code: 0, command_hash: "a".repeat(64), snapshot_tree: "b".repeat(40), output_ref: "evidence/out", output_hash: "c".repeat(64) },
      "evidence/review.json": { version: "wh-review-result.v1", verdict: "pass", snapshot_tree: "b".repeat(40) },
      "quality/reviews/results/evidence.json": { refs: [] },
    };
    const worker = { stage: "verify-code", identity: { taskId: "task" }, readReceipt: (ref) => ({ value: values[ref], sha256: "d".repeat(64) }) };
    const receipts = { tests: "notes/tests.json", review: "evidence/review.json", evidence: "quality/reviews/results/evidence.json" };
    const valid = { tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json", evidence: "quality/evidence/evidence.json" };
    for (const [name, ref] of Object.entries(valid)) if (name !== kind) { receipts[name] = ref; values[ref] = name === "tests" ? values["notes/tests.json"] : name === "review" ? values["evidence/review.json"] : values["quality/reviews/results/evidence.json"]; }
    await expect(officialStageHandler("verify-code")(worker, { receipts })).rejects.toThrow(/namespace|canonical|receipt.*ref/i);
  });

  it("requires receipt schema and producer provenance instead of accepting shape-only JSON", async () => {
    const auditRef = `quality/evidence/audits/build-spec/${"f".repeat(64)}.json`;
    const audit = { schema_version: "v1", task_id: "task", stage_slug: "build-spec", verdict: "pass", summary_hash: sha, workflow_run_id: "fixture:attempt-0001", snapshot_tree: tree, content_evidence_refs: [] };
    const worker = { stage: "build-spec", identity: { taskId: "task" }, writeArtifact() {}, createCheckpoint() { return {}; }, readReceipt: (ref) => ({ value: ref === auditRef ? audit : { content: "fake" }, sha256: "a".repeat(64) }) };
    await expect(officialStageHandler("build-spec")(worker, { receipts: { spec: "quality/evidence/spec.json", audit: auditRef } }))
      .rejects.toThrow(/schema|producer|provenance/i);
  });

  it("publishes build-spec business facts while disclosing unavailable audit support", async () => {
    const content = "# Spec\n";
    const values = {
      "quality/evidence/spec.json": canonical("build-spec", {
        producer: { stage: "build-spec", component: "spec", version: "1" },
        content,
        content_hash: createHash("sha256").update(content).digest("hex"),
      }),
      "quality/reviews/results/review.json": reviewReceipt("build-spec"),
    };
    const worker = {
      ...workerFor("build-spec", values),
      readArtifact: () => content,
      artifactRef: () => "specs/task/spec.md",
      createCheckpoint: () => ({ plan_hash: sha }),
    };
    const result = await officialStageHandler("build-spec")(worker, {
      receipts: { spec: "quality/evidence/spec.json", review: "quality/reviews/results/review.json" },
    });
    expect(result.facts).not.toHaveProperty("audit_summary_ref");
    expect(result.facts.audit_gaps).toEqual(expect.arrayContaining([
      "support:audit",
      expect.stringMatching(/audit unavailable\/unverified\/mismatch/i),
    ]));
    expect(result.missing_items).not.toEqual(expect.arrayContaining(["support:audit"]));
  });

  it("rejects caller-owned workflow identity and an untracked make-decision resolution field", async () => {
    const worker = { stage: "make-decision", identity: { taskId: "task" } };
    await expect(officialStageHandler("make-decision")(worker, {
      receipts: {}, workflow_run_id: "caller-forged",
    })).rejects.toThrow(/unknown fields.*workflow_run_id/i);
    await expect(officialStageHandler("make-decision")(worker, {
      receipts: { review_resolution: `quality/reviews/resolutions/${"d".repeat(64)}.json` },
    })).rejects.toThrow(/unexpected receipt fields.*review_resolution/i);
  });

  it.each([
    ["make-decision", "spec", "quality/evidence/spec.json"],
    ["build-spec", "plan", "quality/evidence/plan.json"],
    ["build-plan", "decision", "quality/evidence/decision.json"],
    ["build-code", "evidence", "evidence/verify-evidence.json"],
    ["verify-code", "implementation", "quality/evidence/implementation.json"],
  ])("rejects foreign and unknown receipt fields for %s before reading records", async (stage, foreignName, foreignRef) => {
    let reads = 0;
    const worker = {
      stage, identity: { taskId: "task" },
      readReceipt: () => { reads += 1; throw new Error("record read must not occur"); },
    };
    await expect(officialStageHandler(stage)(worker, {
      receipts: { [foreignName]: foreignRef },
    })).rejects.toThrow(new RegExp(`unexpected receipt fields.*${foreignName}`, "i"));
    await expect(officialStageHandler(stage)(worker, {
      receipts: { unknown_receipt: "receipts/unknown.json" },
    })).rejects.toThrow(/unexpected receipt fields.*unknown_receipt/i);
    expect(reads).toBe(0);
  });

  it.each([
    ["missing spec", "build-spec", { spec: "quality/evidence/spec.json", review: "quality/reviews/results/review.json" }, { spec: "# Spec\n" }, {}],
    ["different spec", "build-spec", { spec: "quality/evidence/spec.json", review: "quality/reviews/results/review.json" }, { spec: "# Spec\n" }, { "spec.md": "wrong\n" }],
    ["missing tasks", "build-plan", { plan: "quality/evidence/plan.json", tasks: "quality/evidence/tasks.json", review: "quality/reviews/results/review.json" }, { plan: completedBuildCodeDocuments().plan, tasks: completedBuildCodeDocuments().tasks }, { "plan.md": completedBuildCodeDocuments().plan }],
    ["different tasks", "build-plan", { plan: "quality/evidence/plan.json", tasks: "quality/evidence/tasks.json", review: "quality/reviews/results/review.json" }, { plan: completedBuildCodeDocuments().plan, tasks: completedBuildCodeDocuments().tasks }, { "plan.md": completedBuildCodeDocuments().plan, "tasks.md": "wrong\n" }],
  ])("rejects %s when the reviewed design artifact differs from its final receipt without mutating the Workspace", async (_case, stage, receipts, contents, artifacts) => {
    const values = { "quality/reviews/results/review.json": reviewReceipt(stage) };
    for (const [component, content] of Object.entries(contents)) values[`quality/evidence/${component}.json`] = canonical(stage, {
      producer: { stage, component, version: "1" }, content, content_hash: createHash("sha256").update(content).digest("hex"),
    });
    let checkpointCalls = 0, writeCalls = 0;
    const worker = {
      ...workerFor(stage, values),
      readArtifact: (name) => {
        if (name === "decision-log.md") return "# Decision\n\nProceed.\n";
        if (name === "spec.md") return completedBuildCodeDocuments().spec;
        return artifacts[name];
      },
      writeArtifact: () => { writeCalls += 1; },
      createCheckpoint: () => { checkpointCalls += 1; return {}; },
      artifactRef: (name) => `specs/task/${name}`,
    };
    receipts.audit = worker.auditRef;
    await expect(officialStageHandler(stage)(worker, { receipts }))
      .rejects.toThrow(/artifact.*receipt|differ|content must be non-empty|minimum executable contract/i);
    expect(writeCalls).toBe(0);
    expect(checkpointCalls).toBe(0);
  });

  it("retains a stale build-spec review as advice instead of forcing a rerun", async () => {
    const stage = "build-spec", content = "# Spec\n", values = {
      "quality/evidence/spec.json": canonical(stage, { producer: { stage, component: "spec", version: "1" }, content, content_hash: createHash("sha256").update(content).digest("hex") }),
      "quality/reviews/results/review.json": reviewReceipt(stage, "revise_required"),
    };
    let checkpointCalls = 0;
    const worker = {
      ...workerFor(stage, values, "c".repeat(40)),
      readAuthenticatedReviewFlow: () => reviewFlow("quality/reviews/results/review.json", values["quality/reviews/results/review.json"]),
      readArtifact: () => content,
      createCheckpoint: () => { checkpointCalls += 1; return {}; },
      artifactRef: () => "specs/task/spec.md",
    };
    const result = await officialStageHandler(stage)(worker, { receipts: { spec: "quality/evidence/spec.json", review: "quality/reviews/results/review.json", audit: worker.auditRef } });
    expect(result.facts.review).toMatchObject({ status: "recorded", snapshot_tree: tree });
    expect(result.missing_items).toEqual(expect.arrayContaining([
      expect.stringMatching(/finding disposition is missing/i),
    ]));
    expect(checkpointCalls).toBe(0);
  });

  it("rejects a retired response-ledger even when it claims a verified canonical delta", async () => {
    const stage = "build-spec", content = "# Spec v2\n", currentTree = "c".repeat(40);
    const reviewRef = "quality/reviews/results/review.json", resolutionRef = `quality/reviews/resolutions/${"d".repeat(64)}.json`;
    const prior = reviewReceipt(stage, "revise_required");
    const ledger = {
      version: "wh-review-response-ledger.v1", previous_result_ref: reviewRef,
      previous_snapshot_tree: prior.snapshot_tree, current_snapshot_tree: currentTree,
      change: {
        changed_dimensions: [], rationale: "clarified wording without changing the contract",
        evidence_refs: ["quality/evidence/spec.json"],
      },
      responses: [{ finding_id: prior.findings[0].id, status: "fixed", rationale: "Clarified wording and verified the current specification.", changed_dimensions: [], evidence_refs: ["quality/evidence/spec.json"] }],
    };
    const resolution = buildNonGateReviewResponseRecord({
      taskId: "task", stage, previousResult: { ...prior, result_ref: reviewRef },
      previousResultSha256: sha, ledger, currentSnapshotTree: currentTree,
    });
    const values = {
      "quality/evidence/spec.json": canonical(stage, { producer: { stage, component: "spec", version: "1" }, content, content_hash: createHash("sha256").update(content).digest("hex") }),
      [reviewRef]: prior,
      [resolutionRef]: resolution,
    };
    const worker = {
      ...workerFor(stage, values, currentTree),
      readAuthenticatedReviewFlow: () => reviewFlow(reviewRef, prior, {
        event_kind: "resolution", event_ref: `quality/reviews/flows/${"f".repeat(64)}/event-0002.json`,
        action_ref: resolutionRef, action_sha256: sha,
      }),
      readArtifact: () => content,
      createCheckpoint: () => ({}),
      artifactRef: () => "specs/task/spec.md",
    };
    await expect(officialStageHandler(stage)(worker, { receipts: { spec: "quality/evidence/spec.json", review: reviewRef, review_resolution: resolutionRef, audit: worker.auditRef } }))
      .rejects.toThrow(/unexpected receipt fields.*review_resolution/i);
  });

  it("rejects a retired delta-resolution input whose prior result hash is not exact", async () => {
    const stage = "build-spec", content = "# Spec v2\n", currentTree = "c".repeat(40);
    const reviewRef = "quality/reviews/results/review.json", resolutionRef = `quality/reviews/resolutions/${"d".repeat(64)}.json`;
    const prior = reviewReceipt(stage, "revise_required");
    const ledger = {
      version: "wh-review-response-ledger.v1", previous_result_ref: reviewRef,
      previous_snapshot_tree: prior.snapshot_tree, current_snapshot_tree: currentTree,
      change: {
        changed_dimensions: [], rationale: "clarified wording without changing the contract",
        evidence_refs: ["quality/evidence/spec.json"],
      },
      responses: [{ finding_id: prior.findings[0].id, status: "fixed", rationale: "Clarified wording and verified the current specification.", changed_dimensions: [], evidence_refs: ["quality/evidence/spec.json"] }],
    };
    const resolution = buildNonGateReviewResponseRecord({
      taskId: "task", stage, previousResult: { ...prior, result_ref: reviewRef },
      previousResultSha256: sha, ledger, currentSnapshotTree: currentTree,
    });
    resolution.previous_result_sha256 = "e".repeat(64);
    const values = {
      "quality/evidence/spec.json": canonical(stage, { producer: { stage, component: "spec", version: "1" }, content, content_hash: createHash("sha256").update(content).digest("hex") }),
      [reviewRef]: prior, [resolutionRef]: resolution,
    };
    const worker = {
      ...workerFor(stage, values, currentTree),
      readAuthenticatedReviewFlow: () => reviewFlow(reviewRef, prior, {
        event_kind: "resolution", event_ref: `quality/reviews/flows/${"f".repeat(64)}/event-0002.json`,
        action_ref: resolutionRef, action_sha256: sha,
      }),
      readArtifact: () => content,
      createCheckpoint: () => ({}),
      artifactRef: () => "specs/task/spec.md",
    };
    await expect(officialStageHandler(stage)(worker, { receipts: { spec: "quality/evidence/spec.json", review: reviewRef, review_resolution: resolutionRef, audit: worker.auditRef } }))
      .rejects.toThrow(/unexpected receipt fields.*review_resolution/i);
  });

  it("accepts a current structural full review without persisted parent lineage", async () => {
    const stage = "build-spec", content = "# Structural spec\n", currentTree = "c".repeat(40);
    const priorRef = "quality/reviews/results/prior.json", fullRef = "quality/reviews/results/full.json";
    const prior = reviewReceipt(stage, "pass");
    prior.attempt_ref = "quality/reviews/attempts/prior-attempt/attempt.json";
    const full = reviewReceipt(stage, "pass", currentTree);
    full.attempt_ref = "quality/reviews/attempts/full-attempt/attempt.json";
    const values = {
      "quality/evidence/spec.json": canonical(stage, { producer: { stage, component: "spec", version: "1" }, content, content_hash: createHash("sha256").update(content).digest("hex") }),
      [priorRef]: prior,
      [fullRef]: full,
    };
    const worker = {
      ...workerFor(stage, values, currentTree),
      readAuthenticatedReviewFlow: () => reviewFlow(fullRef, full),
      readArtifact: () => content,
      createCheckpoint: () => ({}),
      artifactRef: () => "specs/task/spec.md",
    };
    await expect(officialStageHandler(stage)(worker, { receipts: { spec: "quality/evidence/spec.json", review: fullRef, audit: worker.auditRef } }))
      .resolves.toMatchObject({
        facts: { review: { result_ref: fullRef, snapshot_tree: currentTree } },
      });
  });

  it("surfaces accepted risk from external audit at the build-plan human boundary without making it a stage fact", async () => {
    const documents = completedBuildCodeDocuments();
    const stage = "build-plan", plan = documents.plan, tasks = documents.tasks, auditRef = `quality/reviews/resolutions/${"c".repeat(64)}.json`;
    const values = {
      "quality/evidence/plan.json": canonical(stage, { producer: { stage, component: "plan", version: "1" }, content: plan, content_hash: createHash("sha256").update(plan).digest("hex") }),
      "quality/evidence/tasks.json": canonical(stage, { producer: { stage, component: "tasks", version: "1" }, content: tasks, content_hash: createHash("sha256").update(tasks).digest("hex") }),
      "quality/reviews/results/review.json": reviewReceipt(stage),
    };
    const worker = {
      ...workerFor(stage, values), readArtifact: (name) => name === "plan.md" ? plan : tasks,
      createCheckpoint: () => ({}), artifactRef: (name) => `specs/task/${name}`,
      listReviewAuditRefs: () => [auditRef],
      readReviewAudit: () => ({ value: { version: "wh-review-resolution.v1", task_id: "task", stage, outcome: "recorded_non_gate_response", accepted_risk_count: 1 }, sha256: sha }),
    };
    const outcome = await officialStageHandler(stage)(worker, { receipts: { plan: "quality/evidence/plan.json", tasks: "quality/evidence/tasks.json", review: "quality/reviews/results/review.json", audit: worker.auditRef } });
    expect(outcome.facts).not.toHaveProperty("review_audit");
    expect(outcome.missing_items).not.toContain(`accepted risk recorded in external wh-review audit: ${auditRef}; present it to the human confirmer`);
  });

  it("rejects retired direction response-ledger input instead of consuming it", async () => {
    const stage = "make-decision", currentTree = "c".repeat(40);
    const decisionLog = "# Decision\n\nGo.\n";
    const directionRef = "quality/reviews/results/direction.json";
    const detailRef = "quality/reviews/results/detail.json";
    const direction = reviewReceipt(stage, "revise_required");
    direction.review_track = "direction";
    direction.attempt_ref = "quality/reviews/attempts/direction-attempt/attempt.json";
    const detail = reviewReceipt(stage, "pass", currentTree);
    detail.review_track = "detail";
    detail.attempt_ref = "quality/reviews/attempts/detail-attempt/attempt.json";
    const ledger = {
      version: "wh-review-response-ledger.v1", previous_result_ref: directionRef,
      previous_snapshot_tree: direction.snapshot_tree, current_snapshot_tree: currentTree,
      change: { changed_dimensions: [], rationale: "clarified wording", evidence_refs: ["quality/evidence/decision.json"] },
      responses: [{ finding_id: direction.findings[0].id, status: "fixed", rationale: "Clarified wording and verified the current decision.", changed_dimensions: [], evidence_refs: ["quality/evidence/decision.json"] }],
    };
    const directionResolution = buildNonGateReviewResponseRecord({
      taskId: "task", stage, reviewTrack: "direction",
      previousResult: { ...direction, result_ref: directionRef },
      previousResultSha256: sha, ledger, currentSnapshotTree: currentTree,
    });
    const directionResolutionRef = `quality/reviews/resolutions/${"d".repeat(64)}.json`;
    const values = {
      "quality/evidence/decision.json": canonical(stage, {
        producer: { stage, component: "decision", version: "1" },
        decision_ref: `quality/evidence/${createHash("sha256").update(decisionLog).digest("hex")}.md`,
        decision_hash: createHash("sha256").update(decisionLog).digest("hex"),
        content_hash: createHash("sha256").update(decisionLog).digest("hex"), contract_refs: [],
      }),
      [directionRef]: direction,
      [detailRef]: detail,
      [directionResolutionRef]: directionResolution,
    };
    const worker = {
      ...workerFor(stage, values, currentTree),
      readEvidence: () => ({ bytes: decisionLog, sha256: createHash("sha256").update(decisionLog).digest("hex") }),
      readAuthenticatedReviewFlow: (subject) => subject.review_track === "direction"
        ? reviewFlow(directionRef, direction, {
          event_kind: "resolution", event_ref: `quality/reviews/flows/${"f".repeat(64)}/event-0002.json`,
          action_ref: directionResolutionRef, action_sha256: sha,
        })
        : reviewFlow(detailRef, detail),
      candidateWorkspace: {
        worktreeRoot: "/tmp/candidate", baselineCommit: tree,
        captureSnapshot: () => ({ tree: currentTree }),
      },
    };
    await expect(officialStageHandler(stage)(worker, {
      receipts: {
        decision: "quality/evidence/decision.json",
        direction_review: directionRef,
        direction_review_resolution: directionResolutionRef,
        detail_review: detailRef,
        audit: worker.auditRef,
      },
    })).rejects.toThrow(/unexpected receipt fields.*direction_review_resolution/i);
  });

  it("rejects retired make-decision response-ledger input instead of clearing a finding", async () => {
    const stage = "make-decision", currentTree = "c".repeat(40), workflowRunId = "fixture:make-decision-resolution";
    const decisionLog = "# Decision\n\nGo.\n", decisionHash = createHash("sha256").update(decisionLog).digest("hex");
    const directionRef = "quality/reviews/results/direction-resolution.json", detailRef = "quality/reviews/results/detail-resolution.json";
    const direction = reviewReceipt(stage, "revise_required", currentTree); direction.review_track = "direction"; direction.attempt_ref = "quality/reviews/attempts/direction-resolution-attempt/attempt.json";
    const detail = reviewReceipt(stage, "pass", currentTree); detail.review_track = "detail"; detail.attempt_ref = "quality/reviews/attempts/detail-resolution-attempt/attempt.json";
    const findingId = direction.findings[0].id;
    const ledger = { version: "wh-review-response-ledger.v1", previous_result_ref: directionRef, previous_snapshot_tree: currentTree, current_snapshot_tree: currentTree, responses: [{ finding_id: findingId, status: "fixed", rationale: "Focused resolution evidence was rerun and verified.", changed_dimensions: [], evidence_refs: ["evidence/resolution.json"] }] };
    const directionResolution = buildNonGateReviewResponseRecord({ taskId: "task", stage, reviewTrack: "direction", previousResult: { ...direction, result_ref: directionRef }, previousResultSha256: sha, ledger, currentSnapshotTree: currentTree });
    const directionResolutionRef = `quality/reviews/resolutions/${"d".repeat(64)}.json`;
    const interactionPayload = { interaction_type: "aggregate", workspace_tree: currentTree, decision_ref: `quality/evidence/${decisionHash}.md`, decision_hash: decisionHash };
    const interaction = { schema_version: "stage-content-evidence.v1", kind: "interaction-completion.v1", task_id: "task", stage, workflow_run_id: workflowRunId, snapshot_tree: currentTree, content_hash: createHash("sha256").update(JSON.stringify(interactionPayload)).digest("hex"), payload: interactionPayload };
    const audit = { schema_version: "v1", task_id: "task", stage_slug: stage, verdict: "pass", summary_hash: sha, workflow_run_id: workflowRunId, snapshot_tree: currentTree, through_step_id: 10, audit_scope: "pre_confirmation", content_evidence_refs: [{ kind: "interaction-completion.v1", ref: "evidence/interaction.json", hash: sha }] };
    const values = {
      "quality/evidence/decision.json": canonical(stage, { producer: { stage, component: "decision", version: "1" }, decision_ref: `quality/evidence/${decisionHash}.md`, decision_hash: decisionHash, content_hash: decisionHash, contract_refs: [] }),
      "evidence/interaction.json": interaction,
      [`quality/evidence/audits/make-decision/${"e".repeat(64)}.json`]: audit,
      [directionRef]: direction, [detailRef]: detail, [directionResolutionRef]: directionResolution,
    };
    const worker = { ...workerFor(stage, values, currentTree), workflowRunId, candidateWorkspace: { worktreeRoot: "/tmp/candidate", baselineCommit: tree, captureSnapshot: () => ({ tree: currentTree }) }, readEvidence: (ref) => ref === `quality/evidence/${decisionHash}.md` ? { bytes: decisionLog, sha256: decisionHash } : { bytes: "interaction", sha256: sha }, readAuthenticatedReviewFlow: (subject) => subject.review_track === "direction" ? reviewFlow(directionRef, direction, { event_kind: "resolution", event_ref: `quality/reviews/flows/${"f".repeat(64)}/event-0002.json`, action_ref: directionResolutionRef, action_sha256: sha, identity: { task_id: "task", workflow_run_id: workflowRunId, stage, review_track: "direction", subject_kind: "worktree", phase_id: null, review_scope: null } }) : reviewFlow(detailRef, detail, { identity: { task_id: "task", workflow_run_id: workflowRunId, stage, review_track: "detail", subject_kind: "worktree", phase_id: null, review_scope: null } }) };
    await expect(officialStageHandler(stage)(worker, { receipts: { decision: "quality/evidence/decision.json", audit: `quality/evidence/audits/make-decision/${"e".repeat(64)}.json`, direction_review: directionRef, direction_review_resolution: directionResolutionRef, detail_review: detailRef } }))
      .rejects.toThrow(/unexpected receipt fields.*direction_review_resolution/i);
  });

  it("records a real failing test command as a quality fact", async () => {
    const stage = "verify-code";
    const values = {
      "quality/tests/tests.json": testsReceipt(stage),
      "quality/reviews/results/review.json": reviewReceipt(stage),
      "quality/evidence/evidence.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    values["quality/tests/tests.json"].exit_code = 1;
    const worker = workerFor(stage, values);
    await expect(officialStageHandler(stage)(worker, { receipts: { tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json", quality_review: worker.qualityReviewRef, evidence: "quality/evidence/evidence.json", audit: worker.auditRef } }))
      .resolves.toMatchObject({ facts: { tests: { exit_code: 1 } } });
  });

  it("keeps a revise_required build-code review as audit-only during verify-code", async () => {
    const historicalTree = "a".repeat(40);
    const stage = "verify-code", values = {
      "quality/tests/tests.json": testsReceipt(stage),
      "quality/reviews/results/review.json": reviewReceipt("build-code", "revise_required", historicalTree),
      "quality/evidence/evidence.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    const worker = workerFor(stage, values);
    const result = await officialStageHandler(stage)(worker, { receipts: { tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json", quality_review: worker.qualityReviewRef, evidence: "quality/evidence/evidence.json", audit: worker.auditRef } });
    expect(result.verification_failure).toBe(true);
    expect(result.reason).not.toMatch(/SERIOUS_REVIEW_PAUSE/);
    expect(result.facts.review.status).toBe("recorded");
    expect(result.facts.finding_dispositions).toMatchObject({ status: "not_applicable", items: [] });
    expect(result.missing_items).not.toEqual(expect.arrayContaining([
      expect.stringMatching(/finding disposition is missing/i),
    ]));
    expect(result.missing_items).not.toContain("serious review finding accepted as explicit risk; verdict remains revise_required");
  });

  it("preserves an authenticated unavailable build-code review as a non-gate quality fact", async () => {
    const stage = "verify-code", attemptRef = "quality/reviews/attempts/verify-unavailable/attempt.json";
    const earlierOutputRef = `quality/reviews/attempts/verify-unavailable/providers/${providerFilePart("fixture-provider")}.output.json`;
    const earlierContent = JSON.stringify({ findings: [] });
    const unavailable = {
      version: "wh-review-attempt.v1", attempt_id: "verify-unavailable", task_id: "task", stage: "build-code", review_track: null,
      source: { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree }, snapshot_tree: tree,
      subject_kind: "worktree", phase_id: null, review_scope: "integration", base_tree: tree, candidate_tree: tree,
      material_id: sha, provider_attempts: [{
        provider: "fixture-provider", status: "completed", session_id: "old", runtime_id: "old", output_ref: earlierOutputRef, error: null,
      }, {
        provider: "fixture-provider", status: "failed", session_id: null, runtime_id: null, output_ref: null,
        error: { code: "PROVIDER_UNAVAILABLE", message: "provider timed out" },
      }], terminal_status: "unavailable",
      error: { code: "PROVIDER_UNAVAILABLE", message: "provider timed out" },
    };
    const values = {
      "quality/tests/tests.json": testsReceipt(stage),
      [attemptRef]: unavailable,
      [earlierOutputRef]: {
        schema_version: "wh-review-provider-output.v1", task_id: "task", stage: "build-code", attempt_id: "verify-unavailable",
        provider: "fixture-provider", content: earlierContent, content_hash: createHash("sha256").update(earlierContent).digest("hex"),
      },
      "quality/evidence/evidence.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    const worker = workerFor(stage, values);
    worker.readAcceptedBuildCode = () => ({ facts: {
      tests: { snapshot_tree: tree },
      acceptance_coverage: { snapshot_tree: tree, accepted_criterion_ids: ["AC-1"], items: [] },
      review: {
        status: "unavailable", attempt_ref: attemptRef, attempt_hash: sha,
        snapshot_tree: tree, material_id: sha,
        error: { code: "PROVIDER_UNAVAILABLE", message: "provider timed out" },
        subject_kind: "worktree", phase_id: null, review_scope: "integration",
      },
    } });
    const result = await officialStageHandler(stage)(worker, {
      receipts: { tests: "quality/tests/tests.json", review: attemptRef, quality_review: worker.qualityReviewRef, evidence: "quality/evidence/evidence.json", audit: worker.auditRef },
    });
    expect(result).toMatchObject({
      facts: { review: { status: "unavailable" } },
    });
    expect(result.missing_items.join("\n")).not.toMatch(/build-code integration review is unavailable/i);
    expect(result.completion.system.verification.conclusion).toMatch(/build-code final=unavailable.*verify-code independent=recorded/i);
    expect(result.completion.system.verification.conclusion).not.toMatch(/质量审查通过/);
    expect(result.missing_items.join("\n")).not.toMatch(/unavailable|integration review/i);
  });

  it("describes revise_required as a bound quality fact instead of review pass", async () => {
    const stage = "verify-code";
    const finding = {
      severity: "major", path: "fixture", issue: "major quality advice",
      root_cause: "fixture detail", recommendation: "consider cleanup",
      evidence_kind: "direct", evidence: "fixture anchor",
    };
    const providerOutput = { findings: [finding] };
    const aggregation = aggregateProviderResults([{ provider: "fixture-provider", review: providerOutput }], 1);
    const quality = {
      ...qualityReviewReceipt(),
      provider_results: [{ provider: "fixture-provider", output: providerOutput }],
      findings: aggregation.findings.map((item) => ({ provider: item.providers[0], ...item })),
      adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters },
    };
    const values = {
      "quality/tests/tests.json": testsReceipt(stage),
      "quality/reviews/results/review.json": reviewReceipt(stage),
      "quality/reviews/results/quality.json": quality,
      "quality/evidence/evidence.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    const worker = workerFor(stage, values);
    const pause = deriveSeriousReviewPause({
      taskId: "task", stage: "verify-code", reviewRef: "quality/reviews/results/quality.json",
      reviewHash: sha, result: quality, workflowRunId: "fixture:attempt-0001",
    });
    const riskRef = `quality/evidence/risk-acceptances/${"e".repeat(64)}.json`;
    values[riskRef] = buildRiskAcceptance({
      pause,
      findingId: pause.findings[0].finding_id,
      cardRef: `quality/evidence/risk-cards/${pause.findings[0].card_hash}.json`,
      cardHash: pause.findings[0].card_hash,
      selectedOption: "accept-risk",
      replyRef: `quality/evidence/risk-replies/${"d".repeat(64)}.json`,
      replyHash: "d".repeat(64),
      acceptedAt: "2026-07-19T00:00:02.000Z",
    });
    const result = await officialStageHandler(stage)(worker, {
      receipts: {
        tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json",
        quality_review: worker.qualityReviewRef, quality_risk_acceptance: riskRef,
        evidence: "quality/evidence/evidence.json", audit: worker.auditRef,
      },
    });
    expect(result.completion.system.verification.conclusion).toMatch(/独立验证发现未满足项.*verify-code independent=recorded.*认证质量事实/i);
    expect(result.completion.system.verification.conclusion).not.toMatch(/质量审查通过/);
  });

  it("rejects an unavailable attempt when the latest provider output is a sufficient pass", async () => {
    const stage = "verify-code", attemptId = "false-unavailable", attemptRef = `quality/reviews/attempts/${attemptId}/attempt.json`;
    const outputRef = `quality/reviews/attempts/${attemptId}/providers/${providerFilePart("fixture-provider")}.output.json`;
    const content = JSON.stringify({ findings: [] });
    const values = {
      "quality/tests/tests.json": testsReceipt(stage),
      [attemptRef]: {
        version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: "task", stage: "build-code", review_track: null,
        source: { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree }, snapshot_tree: tree,
        material_id: sha, provider_attempts: [{
          provider: "fixture-provider", status: "completed", session_id: "session", runtime_id: "runtime", output_ref: outputRef, error: null,
        }], terminal_status: "unavailable", error: { code: "PROVIDER_UNAVAILABLE", message: "claimed unavailable" },
      },
      [outputRef]: {
        schema_version: "wh-review-provider-output.v1", task_id: "task", stage: "build-code", attempt_id: attemptId,
        provider: "fixture-provider", content, content_hash: createHash("sha256").update(content).digest("hex"),
      },
      "quality/evidence/evidence.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    const worker = workerFor(stage, values);
    await expect(officialStageHandler(stage)(worker, {
      receipts: { tests: "quality/tests/tests.json", review: attemptRef, quality_review: worker.qualityReviewRef, evidence: "quality/evidence/evidence.json", audit: worker.auditRef },
    })).rejects.toThrow(/claims unavailable.*semantic result/i);
  });

  it("still rejects an unknown formal review verdict as an integrity error", async () => {
    const stage = "verify-code", values = {
      "quality/tests/tests.json": testsReceipt(stage),
      "quality/reviews/results/review.json": reviewReceipt(stage, "invented"),
      "quality/evidence/evidence.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    const worker = workerFor(stage, values);
    await expect(officialStageHandler(stage)(worker, { receipts: { tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json", quality_review: worker.qualityReviewRef, evidence: "quality/evidence/evidence.json", audit: worker.auditRef } })).rejects.toThrow(/SCHEMA_VALIDATION_FAILED.*verdict/i);
  });

  it("rejects a review result detached from its attempt/provider evidence chain", async () => {
    const stage = "verify-code", values = {
      "quality/tests/tests.json": testsReceipt(stage), "quality/reviews/results/review.json": reviewReceipt(stage),
      "quality/evidence/evidence.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    const worker = workerFor(stage, values);
    values[values["quality/reviews/results/review.json"].attempt_ref].material_id = "0".repeat(64);
    await expect(officialStageHandler(stage)(worker, { receipts: { tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json", quality_review: worker.qualityReviewRef, evidence: "quality/evidence/evidence.json", audit: worker.auditRef } })).rejects.toThrow(/attempt\/result material_id mismatch/i);
  });

  it("rejects a worktree result backed by a Phase review attempt", async () => {
    const stage = "build-code", values = {
      "quality/evidence/implementation.json": canonical(stage, { producer: { stage, component: "implementation", version: "1" }, changed: [], snapshot_head: tree, snapshot_tree: tree, snapshot_commit: tree, diff_ref: "evidence/diff.patch", diff_hash: sha, phase_completion: true }),
      "quality/tests/tests.json": testsReceipt(stage),
      "quality/reviews/results/review.json": reviewReceipt(stage),
    };
    const worker = workerFor(stage, values);
    const attempt = values[values["quality/reviews/results/review.json"].attempt_ref];
    attempt.subject_kind = "phase";
    attempt.phase_id = "phase-1";
    attempt.review_scope = "phase";
    await expect(officialStageHandler(stage)(worker, { receipts: { implementation: "quality/evidence/implementation.json", tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json", audit: worker.auditRef } }))
      .rejects.toThrow(/attempt\/result (subject_kind|phase_id) mismatch/i);
  });

  it("rejects an integration result backed by an attempt with a different review scope", async () => {
    const stage = "build-code", values = {
      "quality/evidence/implementation.json": canonical(stage, { producer: { stage, component: "implementation", version: "1" }, changed: [], snapshot_head: tree, snapshot_tree: tree, snapshot_commit: tree, diff_ref: "evidence/diff.patch", diff_hash: sha, phase_completion: true }),
      "quality/tests/tests.json": testsReceipt(stage),
      "quality/reviews/results/review.json": reviewReceipt(stage),
    };
    const worker = workerFor(stage, values);
    values[values["quality/reviews/results/review.json"].attempt_ref].review_scope = null;
    await expect(officialStageHandler(stage)(worker, { receipts: { implementation: "quality/evidence/implementation.json", tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json", audit: worker.auditRef } }))
      .rejects.toThrow(/attempt\/result review_scope mismatch/i);
  });

  it("rejects a pass result when the provider's final raw output requires revision", async () => {
    const stage = "verify-code", values = {
      "quality/tests/tests.json": testsReceipt(stage), "quality/reviews/results/review.json": reviewReceipt(stage),
      "quality/evidence/evidence.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    const worker = workerFor(stage, values), attempt = values[values["quality/reviews/results/review.json"].attempt_ref];
    const output = values[attempt.provider_attempts[0].output_ref];
    output.content = JSON.stringify({ findings: [{ severity: "major", path: "src/a.js", issue: "bug", recommendation: "fix it" }] });
    output.content_hash = createHash("sha256").update(output.content).digest("hex");
    await expect(officialStageHandler(stage)(worker, { receipts: { tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json", quality_review: worker.qualityReviewRef, evidence: "quality/evidence/evidence.json", audit: worker.auditRef } })).rejects.toThrow(/semantic output mismatch|verdict does not match|OUTPUT_INVALID/i);
  });

  it("records build-code receipts bound to different snapshot trees as a quality gap", async () => {
    const stage = "build-code", values = {
      "quality/evidence/implementation.json": canonical(stage, { producer: { stage, component: "implementation", version: "1" }, changed: [], snapshot_head: tree, snapshot_tree: tree, snapshot_commit: tree, diff_ref: "evidence/diff.patch", diff_hash: sha, phase_completion: true }),
      "quality/tests/tests.json": testsReceipt(stage, "c".repeat(40)),
      "quality/reviews/results/review.json": reviewReceipt(stage),
    };
    const worker = workerFor(stage, values);
    await expect(officialStageHandler(stage)(worker, { receipts: { implementation: "quality/evidence/implementation.json", tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json", audit: worker.auditRef } })).resolves.toMatchObject({
      completion: { system: { result: "incomplete" } },
      missing_items: expect.arrayContaining([expect.stringMatching(/snapshot/i)]),
    });
  });

  it("records a Phase review as a non-gating final build-code quality gap", async () => {
    const stage = "build-code", values = {
      "quality/evidence/implementation.json": canonical(stage, { producer: { stage, component: "implementation", version: "1" }, changed: [], snapshot_head: tree, snapshot_tree: tree, snapshot_commit: tree, diff_ref: "evidence/diff.patch", diff_hash: sha, phase_completion: true }),
      "quality/tests/tests.json": testsReceipt(stage),
      "quality/reviews/results/review.json": reviewReceipt(stage, "pass", tree, "phase"),
    };
    const worker = workerFor(stage, values);
    await expect(officialStageHandler(stage)(worker, { receipts: { implementation: "quality/evidence/implementation.json", tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json", audit: worker.auditRef }, acceptance_coverage: { snapshot_tree: tree, accepted_criterion_ids: ["AC-1"], items: [{ acceptance_criterion_id: "AC-1", status: "unknown", evidence_refs: [] }] } }))
      .resolves.toMatchObject({
        completion: { system: { result: "incomplete" } },
        missing_items: expect.arrayContaining([expect.stringMatching(/not a same-snapshot full-worktree integration review/i)]),
      });
  });

  it("records a legacy worktree final review with no integration scope as a quality gap", async () => {
    const stage = "build-code", values = {
      "quality/evidence/implementation.json": canonical(stage, { producer: { stage, component: "implementation", version: "1" }, changed: [], snapshot_head: tree, snapshot_tree: tree, snapshot_commit: tree, diff_ref: "evidence/diff.patch", diff_hash: sha, phase_completion: true }),
      "quality/tests/tests.json": testsReceipt(stage),
      "quality/reviews/results/review.json": reviewReceipt(stage),
    };
    delete values["quality/reviews/results/review.json"].review_scope;
    const worker = workerFor(stage, values);
    await expect(officialStageHandler(stage)(worker, { receipts: { implementation: "quality/evidence/implementation.json", tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json", audit: worker.auditRef }, acceptance_coverage: { snapshot_tree: tree, accepted_criterion_ids: ["AC-1"], items: [{ acceptance_criterion_id: "AC-1", status: "unknown", evidence_refs: [] }] } }))
      .resolves.toMatchObject({
        completion: { system: { result: "incomplete" } },
        missing_items: expect.arrayContaining([expect.stringMatching(/not a same-snapshot full-worktree integration review/i)]),
      });
  });

  it("records integration scope in accepted final build-code facts", async () => {
    const stage = "build-code";
    const diffEvidence = JSON.stringify({ schema_version: "workflowhub-diff-evidence.v1", baseline_commit: "HEAD", snapshot_tree: tree });
    const diffHash = createHash("sha256").update(diffEvidence).digest("hex");
    const values = {
      "quality/evidence/implementation.json": canonical(stage, { producer: { stage, component: "implementation", version: "1" }, changed: [], snapshot_head: tree, snapshot_tree: tree, snapshot_commit: "HEAD", diff_ref: "evidence/diff.patch", diff_hash: diffHash, phase_completion: true }),
      "quality/tests/tests.json": testsReceipt(stage),
      "quality/reviews/results/review.json": reviewReceipt(stage),
      "evidence/diff.patch": diffEvidence,
      "evidence/ac1.json": { result: "pass" },
    };
    const documents = completedBuildCodeDocuments();
    const worker = {
      ...workerFor(stage, values),
      workspace: { worktreeRoot: resolve(".") },
      readArtifact: (name) => documents[name.replace(/\.md$/, "")],
      artifactRef: (name) => `specs/task/${name}`,
      readEvidence: (ref) => ref === "evidence/diff.patch"
        ? ({ bytes: values[ref], sha256: createHash("sha256").update(values[ref]).digest("hex") })
        : ({ bytes: JSON.stringify(values[ref]), sha256: sha }),
    };
    await expect(officialStageHandler(stage)(worker, { receipts: { implementation: "quality/evidence/implementation.json", tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json", audit: worker.auditRef }, acceptance_coverage: { snapshot_tree: tree, accepted_criterion_ids: ["AC1"], items: [{ acceptance_criterion_id: "AC1", status: "covered", evidence_refs: [{ ref: "evidence/ac1.json", sha256: sha }] }] } }))
      .resolves.toMatchObject({ facts: { review: { subject_kind: "worktree", phase_id: null, review_scope: "integration" } } });
  });

  it("rejects a forged current global test receipt before task audit is considered", async () => {
    const stage = "build-code";
    const forgedTests = testsReceipt(stage);
    forgedTests.producer.stage = "verify-code";
    const values = {
      "quality/evidence/implementation.json": canonical(stage, { producer: { stage, component: "implementation", version: "1" }, changed: [], snapshot_head: tree, snapshot_tree: tree, snapshot_commit: tree, diff_ref: "evidence/diff.patch", diff_hash: sha, phase_completion: true }),
      "quality/tests/tests.json": forgedTests,
      "quality/reviews/results/review.json": reviewReceipt(stage),
    };
    const worker = workerFor(stage, values);
    await expect(officialStageHandler(stage)(worker, {
      receipts: { implementation: "quality/evidence/implementation.json", tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json", audit: worker.auditRef },
      acceptance_coverage: { snapshot_tree: tree, accepted_criterion_ids: ["AC1"], items: [{ acceptance_criterion_id: "AC1", status: "covered", evidence_refs: [{ ref: "evidence/ac1.json", sha256: sha }] }] },
    })).rejects.toThrow(/tests receipt producer stage mismatch/i);
  });

  it("rejects forged current AC evidence even when task audit rows are complete", async () => {
    const stage = "build-code";
    const values = {
      "quality/evidence/implementation.json": canonical(stage, { producer: { stage, component: "implementation", version: "1" }, changed: [], snapshot_head: tree, snapshot_tree: tree, snapshot_commit: tree, diff_ref: "evidence/diff.patch", diff_hash: sha, phase_completion: true }),
      "quality/tests/tests.json": testsReceipt(stage),
      "quality/reviews/results/review.json": reviewReceipt(stage),
      "evidence/ac1.json": { result: "pass" },
    };
    const worker = workerFor(stage, values);
    const readReceipt = worker.readReceipt;
    worker.readReceipt = (ref) => {
      const record = readReceipt(ref);
      return ref === "evidence/ac1.json" ? { ...record, sha256: "0".repeat(64) } : record;
    };
    await expect(officialStageHandler(stage)(worker, {
      receipts: { implementation: "quality/evidence/implementation.json", tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json", audit: worker.auditRef },
      acceptance_coverage: { snapshot_tree: tree, accepted_criterion_ids: ["AC1"], items: [{ acceptance_criterion_id: "AC1", status: "covered", evidence_refs: [{ ref: "evidence/ac1.json", sha256: sha }] }] },
    })).rejects.toThrow(/acceptance_coverage AC1 evidence hash mismatch/i);
  });

  it("publishes a revise_required build-code integration review as an audit-only quality gap", async () => {
    const stage = "build-code";
    const diffEvidence = JSON.stringify({ schema_version: "workflowhub-diff-evidence.v1", baseline_commit: "HEAD", snapshot_tree: tree });
    const diffHash = createHash("sha256").update(diffEvidence).digest("hex");
    const values = {
      "quality/evidence/implementation.json": canonical(stage, { producer: { stage, component: "implementation", version: "1" }, changed: [], snapshot_head: tree, snapshot_tree: tree, snapshot_commit: "HEAD", diff_ref: "evidence/diff.patch", diff_hash: diffHash, phase_completion: true }),
      "quality/tests/tests.json": testsReceipt(stage),
      "quality/reviews/results/review.json": reviewReceipt(stage, "revise_required"),
      "evidence/diff.patch": diffEvidence,
      "evidence/ac1.json": { result: "pass" },
    };
    const documents = completedBuildCodeDocuments();
    const worker = {
      ...workerFor(stage, values),
      workspace: { worktreeRoot: resolve(".") },
      readArtifact: (name) => documents[name.replace(/\.md$/, "")],
      artifactRef: (name) => `specs/task/${name}`,
      readEvidence: (ref) => ref === "evidence/diff.patch"
        ? ({ bytes: values[ref], sha256: createHash("sha256").update(values[ref]).digest("hex") })
        : ({ bytes: JSON.stringify(values[ref]), sha256: sha }),
    };
    await expect(officialStageHandler(stage)(worker, {
      receipts: { implementation: "quality/evidence/implementation.json", tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json", audit: worker.auditRef },
      acceptance_coverage: { snapshot_tree: tree, accepted_criterion_ids: ["AC1"], items: [{ acceptance_criterion_id: "AC1", status: "covered", evidence_refs: [{ ref: "evidence/ac1.json", sha256: sha }] }] },
    })).resolves.toMatchObject({
      completion: { system: { result: "incomplete" } },
      missing_items: expect.arrayContaining([expect.stringMatching(/finding disposition is missing/i)]),
    });
  });

  it("records every supplied finding disposition without changing the review quality status", async () => {
    const stage = "build-code";
    const diffEvidence = JSON.stringify({ schema_version: "workflowhub-diff-evidence.v1", baseline_commit: "HEAD", snapshot_tree: tree });
    const diffHash = createHash("sha256").update(diffEvidence).digest("hex");
    const review = reviewReceipt(stage, "revise_required");
    const finding = review.findings[0];
    const values = {
      "quality/evidence/implementation.json": canonical(stage, { producer: { stage, component: "implementation", version: "1" }, changed: [], snapshot_head: tree, snapshot_tree: tree, snapshot_commit: "HEAD", diff_ref: "evidence/diff.patch", diff_hash: diffHash, phase_completion: true }),
      "quality/tests/tests.json": testsReceipt(stage),
      "quality/reviews/results/review.json": review,
      "evidence/diff.patch": diffEvidence,
      "evidence/ac1.json": { result: "pass" },
    };
    const worker = {
      ...workerFor(stage, values),
      workspace: { worktreeRoot: resolve(".") },
      readArtifact: (name) => completedBuildCodeDocuments()[name.replace(/\.md$/, "")],
      artifactRef: (name) => `specs/task/${name}`,
      readEvidence: (ref) => ref === "evidence/diff.patch"
        ? ({ bytes: values[ref], sha256: diffHash })
        : ({ bytes: JSON.stringify(values[ref]), sha256: sha }),
    };
    const result = await officialStageHandler(stage)(worker, {
      receipts: { implementation: "quality/evidence/implementation.json", tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json", audit: worker.auditRef },
      acceptance_coverage: { snapshot_tree: tree, accepted_criterion_ids: ["AC1"], items: [{ acceptance_criterion_id: "AC1", status: "covered", evidence_refs: [{ ref: "evidence/ac1.json", sha256: sha }] }] },
      finding_dispositions: [{
        finding_id: finding.id, original_fact: finding.issue, source: finding.path,
        consequence: "保留为当前质量风险", status: "needs_human", next_action: "在 verify-code 前由用户决定",
        evidence_ref: "evidence/ac1.json", owner: "task owner", consumer: "verify-code", retain_or_delete: "retain",
      }],
    });
    expect(result.facts.finding_dispositions).toMatchObject({ status: "recorded", items: [{ finding_id: finding.id, status: "needs_human" }] });
    expect(result.facts.review.status).toBe("recorded");
    expect(result.facts.review).not.toHaveProperty("verdict");
    expect(result.missing_items).not.toEqual(expect.arrayContaining([expect.stringMatching(/finding disposition is missing/i)]));
  });

  it("keeps an authenticated unavailable integration review visible without blocking build-code publication", async () => {
    const stage = "build-code";
    const attemptRef = "quality/reviews/attempts/material-incomplete/attempt.json";
    const diffEvidence = JSON.stringify({ schema_version: "workflowhub-diff-evidence.v1", baseline_commit: "HEAD", snapshot_tree: tree });
    const diffHash = createHash("sha256").update(diffEvidence).digest("hex");
    const values = {
      "quality/evidence/implementation.json": canonical(stage, { producer: { stage, component: "implementation", version: "1" }, changed: [], snapshot_head: tree, snapshot_tree: tree, snapshot_commit: "HEAD", diff_ref: "evidence/diff.patch", diff_hash: diffHash, phase_completion: true }),
      "quality/tests/tests.json": testsReceipt(stage),
      [attemptRef]: {
        version: "wh-review-attempt.v1", attempt_id: "material-incomplete", task_id: "task", stage, review_track: null,
        source: { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree }, snapshot_tree: tree,
        subject_kind: "worktree", phase_id: null, review_scope: "integration", base_tree: tree, candidate_tree: tree,
        material_id: sha, provider_attempts: [], terminal_status: "unavailable",
        error: { code: "MATERIAL_INCOMPLETE", message: "integration audit enrichment is incomplete" },
      },
      "evidence/diff.patch": diffEvidence,
      "evidence/ac1.json": { result: "pass" },
    };
    const documents = completedBuildCodeDocuments();
    const worker = {
      ...workerFor(stage, values),
      workspace: { worktreeRoot: resolve(".") },
      readArtifact: (name) => documents[name.replace(/\.md$/, "")],
      artifactRef: (name) => `specs/task/${name}`,
      readEvidence: (ref) => ref === "evidence/diff.patch"
        ? ({ bytes: values[ref], sha256: createHash("sha256").update(values[ref]).digest("hex") })
        : ({ bytes: JSON.stringify(values[ref]), sha256: sha }),
    };
    await expect(officialStageHandler(stage)(worker, {
      receipts: { implementation: "quality/evidence/implementation.json", tests: "quality/tests/tests.json", review: attemptRef, audit: worker.auditRef },
      acceptance_coverage: { snapshot_tree: tree, accepted_criterion_ids: ["AC1"], items: [{ acceptance_criterion_id: "AC1", status: "covered", evidence_refs: [{ ref: "evidence/ac1.json", sha256: sha }] }] },
    })).resolves.toMatchObject({
      facts: { review: { status: "unavailable" } },
      missing_items: [],
      completion: { system: { result: "incomplete" } },
    });
  });

  it("publishes an unavailable final review without integration scope as an explicit quality gap", async () => {
    const stage = "build-code", attemptRef = "quality/reviews/attempts/material-incomplete-no-scope/attempt.json";
    const diffEvidence = JSON.stringify({ schema_version: "workflowhub-diff-evidence.v1", baseline_commit: "HEAD", snapshot_tree: tree });
    const diffHash = createHash("sha256").update(diffEvidence).digest("hex");
    const values = {
      "quality/evidence/implementation.json": canonical(stage, { producer: { stage, component: "implementation", version: "1" }, changed: [], snapshot_head: tree, snapshot_tree: tree, snapshot_commit: "HEAD", diff_ref: "evidence/diff.patch", diff_hash: diffHash, phase_completion: true }),
      "quality/tests/tests.json": testsReceipt(stage),
      [attemptRef]: {
        version: "wh-review-attempt.v1", attempt_id: "material-incomplete-no-scope", task_id: "task", stage, review_track: null,
        source: { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree }, snapshot_tree: tree,
        subject_kind: "worktree", phase_id: null, base_tree: tree, candidate_tree: tree,
        material_id: sha, provider_attempts: [], terminal_status: "unavailable",
        error: { code: "MATERIAL_INCOMPLETE", message: "integration audit enrichment is incomplete" },
      },
      "evidence/diff.patch": diffEvidence,
      "evidence/ac1.json": { result: "pass" },
    };
    const documents = completedBuildCodeDocuments();
    const worker = {
      ...workerFor(stage, values),
      workspace: { worktreeRoot: resolve(".") },
      readArtifact: (name) => documents[name.replace(/\.md$/, "")],
      artifactRef: (name) => `specs/task/${name}`,
      readEvidence: (ref) => ref === "evidence/diff.patch"
        ? ({ bytes: values[ref], sha256: createHash("sha256").update(values[ref]).digest("hex") })
        : ({ bytes: JSON.stringify(values[ref]), sha256: sha }),
    };
    await expect(officialStageHandler(stage)(worker, {
      receipts: { implementation: "quality/evidence/implementation.json", tests: "quality/tests/tests.json", review: attemptRef, audit: worker.auditRef },
      acceptance_coverage: { snapshot_tree: tree, accepted_criterion_ids: ["AC1"], items: [{ acceptance_criterion_id: "AC1", status: "covered", evidence_refs: [{ ref: "evidence/ac1.json", sha256: sha }] }] },
    })).resolves.toMatchObject({
      completion: { system: { result: "incomplete" } },
      missing_items: expect.arrayContaining([expect.stringMatching(/not a same-snapshot full-worktree integration review/i)]),
    });
  });

  it("rejects an empty-provider unavailable attempt that is not a material preflight fact", async () => {
    const stage = "build-code", attemptRef = "quality/reviews/attempts/false-predispatch/attempt.json";
    const values = {
      "quality/evidence/implementation.json": canonical(stage, { producer: { stage, component: "implementation", version: "1" }, changed: [], snapshot_head: tree, snapshot_tree: tree, snapshot_commit: tree, diff_ref: "evidence/diff.patch", diff_hash: sha, phase_completion: true }),
      "quality/tests/tests.json": testsReceipt(stage),
      [attemptRef]: {
        version: "wh-review-attempt.v1", attempt_id: "false-predispatch", task_id: "task", stage, review_track: null,
        source: { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree }, snapshot_tree: tree,
        subject_kind: "worktree", phase_id: null, review_scope: "integration", base_tree: tree, candidate_tree: tree,
        material_id: sha, provider_attempts: [], terminal_status: "unavailable",
        error: { code: "PROVIDER_UNAVAILABLE", message: "claimed provider failure without an attempt" },
      },
    };
    const worker = workerFor(stage, values);
    await expect(officialStageHandler(stage)(worker, {
      receipts: { implementation: "quality/evidence/implementation.json", tests: "quality/tests/tests.json", review: attemptRef, audit: worker.auditRef },
      acceptance_coverage: { snapshot_tree: tree, accepted_criterion_ids: ["AC1"], items: [] },
    })).rejects.toThrow(/must contain provider attempts/i);
  });

  it("uses the current supplied integration review instead of legacy accepted review facts", async () => {
    const stage = "verify-code", values = {
      // verify-code may reuse the complete same-snapshot suite produced by
      // build-code; it must not force a second full regression run.
      "quality/tests/tests.json": testsReceipt("build-code"),
      "quality/reviews/results/review.json": reviewReceipt(stage),
      "quality/evidence/evidence.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    const worker = workerFor(stage, values);
    worker.readAcceptedBuildCode = () => { throw new Error("legacy accepted facts must not be read"); };
    await expect(officialStageHandler(stage)(worker, { receipts: { tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json", quality_review: worker.qualityReviewRef, evidence: "quality/evidence/evidence.json", audit: worker.auditRef } }))
      .resolves.toMatchObject({ verification_failure: true, facts: { tests: { command: "true", snapshot_tree: tree } } });
  });

  it("does not let an unavailable historical review erase current verify finding dispositions", async () => {
    const stage = "verify-code";
    const unavailableRef = "quality/reviews/attempts/build-code-unavailable/attempt.json";
    const qualityRef = "quality/reviews/results/quality.json";
    const values = {
      "quality/tests/tests.json": testsReceipt(stage),
      [unavailableRef]: {
        version: "wh-review-attempt.v1", attempt_id: "build-code-unavailable", task_id: "task", stage: "build-code", review_track: null,
        source: { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree }, snapshot_tree: tree,
        subject_kind: "worktree", phase_id: null, review_scope: "integration", base_tree: tree, candidate_tree: tree,
        material_id: sha, provider_attempts: [], terminal_status: "unavailable",
        error: { code: "MATERIAL_INCOMPLETE", message: "historical integration review is unavailable" },
      },
      [qualityRef]: qualityReviewReceipt(),
      "quality/evidence/evidence.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    const worker = workerFor(stage, values);
    const result = await officialStageHandler(stage)(worker, {
      receipts: { tests: "quality/tests/tests.json", review: unavailableRef, quality_review: qualityRef, evidence: "quality/evidence/evidence.json", audit: worker.auditRef },
    });
    expect(result.facts.finding_dispositions).toMatchObject({ status: "not_applicable", items: [] });
    expect(result.missing_items).not.toEqual(expect.arrayContaining([expect.stringMatching(/finding disposition is missing/i)]));
    expect(result.facts.review.status).toBe("unavailable");
    expect(result.facts.quality_note.status).toBe("recorded");
  });

  it("does not use a recorded historical review when the current verify review is unavailable", async () => {
    const stage = "verify-code";
    const unavailableRef = "quality/reviews/attempts/verify-code-unavailable/attempt.json";
    const values = {
      "quality/tests/tests.json": testsReceipt(stage),
      "quality/reviews/results/review.json": reviewReceipt("build-code", "revise_required"),
      [unavailableRef]: {
        version: "wh-review-attempt.v1", attempt_id: "verify-code-unavailable", task_id: "task", stage: "verify-code", review_track: null,
        source: { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree }, snapshot_tree: tree,
        subject_kind: "worktree", phase_id: null, review_scope: null, base_tree: tree, candidate_tree: tree,
        material_id: sha, provider_attempts: [], terminal_status: "unavailable",
        error: { code: "MATERIAL_INCOMPLETE", message: "current verify review is unavailable" },
      },
      "quality/evidence/evidence.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    const worker = workerFor(stage, values);
    const result = await officialStageHandler(stage)(worker, {
      receipts: { tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json", quality_review: unavailableRef, evidence: "quality/evidence/evidence.json", audit: worker.auditRef },
    });
    expect(result.facts.finding_dispositions.status).toBe("missing");
    expect(result.missing_items).toEqual(expect.arrayContaining([expect.stringMatching(/current review result is unavailable/i)]));
    expect(result.facts.review.status).toBe("recorded");
    expect(result.facts.quality_note.status).toBe("unavailable");
  });

  it("keeps finding dispositions missing when both historical and current reviews are unavailable", async () => {
    const stage = "verify-code";
    const historicalRef = "quality/reviews/attempts/build-code-unavailable-both/attempt.json";
    const currentRef = "quality/reviews/attempts/verify-code-unavailable-both/attempt.json";
    const unavailableAttempt = (attemptId, attemptStage) => ({
      version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: "task", stage: attemptStage, review_track: null,
      source: { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree }, snapshot_tree: tree,
      subject_kind: "worktree", phase_id: null, review_scope: attemptStage === "build-code" ? "integration" : null,
      base_tree: tree, candidate_tree: tree, material_id: sha, provider_attempts: [], terminal_status: "unavailable",
      error: { code: "MATERIAL_INCOMPLETE", message: `${attemptStage} review is unavailable` },
    });
    const values = {
      "quality/tests/tests.json": testsReceipt(stage),
      [historicalRef]: unavailableAttempt("build-code-unavailable-both", "build-code"),
      [currentRef]: unavailableAttempt("verify-code-unavailable-both", "verify-code"),
      "quality/evidence/evidence.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    const worker = workerFor(stage, values);
    const result = await officialStageHandler(stage)(worker, {
      receipts: { tests: "quality/tests/tests.json", review: historicalRef, quality_review: currentRef, evidence: "quality/evidence/evidence.json", audit: worker.auditRef },
    });
    expect(result.facts.finding_dispositions).toMatchObject({ status: "missing", items: [] });
    expect(result.facts.review.status).toBe("unavailable");
    expect(result.facts.quality_note.status).toBe("unavailable");
    expect(result.missing_items).toEqual(expect.arrayContaining([expect.stringMatching(/current review result is unavailable/i)]));
  });

  it("replays every source ID present in decision-log before reporting verification", async () => {
    const stage = "verify-code";
    const values = {
      "quality/tests/tests.json": testsReceipt(stage),
      "quality/reviews/results/review.json": reviewReceipt(stage),
      "quality/evidence/evidence.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
      "quality/evidence/verification.json": canonical(stage, {
        producer: { stage, component: "verification", version: "1" },
        items: [],
        requirement_replay: [
          { source_id: "R-001", status: "pass", snapshot_tree: tree, linked_ids: ["D-001"], evidence_refs: [{ ref: "evidence/replay-r1.json", sha256: sha }], reason: "当前流程已覆盖", scenario: "执行 R-001 对应流程", oracle: "返回当前任务结果", actual_outcome: "当前流程可回放", coverage_limits: "仅覆盖 CLI 流程", implementation_anchor: { id: "impl-r1", path: "runtime/stage/stage-handlers.mjs", start_line: 1, end_line: 2, role: "implementation" }, verification_anchor: { id: "test-r1", path: "tests/final-cutover-guards.red.test.mjs", start_line: 1, end_line: 2, role: "verification" } },
          { source_id: "D-001", status: "pass", snapshot_tree: tree, linked_ids: ["R-001"], evidence_refs: [{ ref: "evidence/replay-d1.json", sha256: sha }], reason: "决策已绑定", scenario: "读取 D-001 决策", oracle: "D-001 与 R-001 绑定", actual_outcome: "关系存在", coverage_limits: "仅覆盖关系", implementation_anchor: { id: "impl-d1", path: "specs/task/spec.md", start_line: 1, end_line: 2, role: "implementation" }, verification_anchor: { id: "test-d1", path: "tests/final-cutover-guards.red.test.mjs", start_line: 3, end_line: 4, role: "verification" } },
          { source_id: "INC-001", status: "deferred", snapshot_tree: tree, linked_ids: ["D-001"], evidence_refs: [], reason: "延期到隔离维护任务" },
          { source_id: "F15-1", status: "deferred", snapshot_tree: tree, linked_ids: ["D-001"], evidence_refs: [], reason: "后续业务项目范围" },
        ],
      }),
      "evidence/replay-r1.json": { observed: true },
      "evidence/replay-d1.json": { observed: true },
    };
    const worker = workerFor(stage, values);
    const baseReadArtifact = worker.readArtifact;
    worker.readArtifact = (name) => name === "decision-log.md"
      ? "R-001 D-001 INC-001 F15-1\n"
      : baseReadArtifact(name);
    const result = await officialStageHandler(stage)(worker, {
      receipts: { tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json", quality_review: worker.qualityReviewRef, evidence: "quality/evidence/evidence.json", verification: "quality/evidence/verification.json", audit: worker.auditRef },
    });
    expect(result.facts.requirement_replay).toMatchObject({ status: "recorded", items: expect.arrayContaining([
      expect.objectContaining({ source_id: "R-001", status: "pass" }),
      expect.objectContaining({ source_id: "F15-1", status: "deferred" }),
    ]) });
    expect(result.missing_items).not.toEqual(expect.arrayContaining([expect.stringMatching(/requirement replay is missing/i)]));
  });

  it("publishes a truthful incomplete attempt when historical build-code acceptance is absent", async () => {
    const stage = "verify-code";
    const acceptanceRef = "evidence/ac1.json";
    const sourceRef = "evidence/ac1-source.json";
    const values = {
      "quality/tests/tests.json": testsReceipt(stage),
      "quality/reviews/results/review.json": reviewReceipt(stage),
      [acceptanceRef]: {
        schema_version: "acceptance-evidence.v1",
        acceptance_criterion_id: "AC1",
        result: "pass",
        refs: [{ ref: sourceRef, sha256: sha }],
        snapshot_tree: tree,
      },
      [sourceRef]: canonical(stage, { producer: { stage, component: "evidence", version: "1" }, snapshot_tree: tree }),
      "quality/evidence/evidence.json": canonical(stage, {
        producer: { stage, component: "evidence", version: "1" },
        refs: [{ ref: acceptanceRef, sha256: sha }],
        snapshot_tree: tree,
      }),
    };
    const worker = workerFor(stage, values);
    const readReceipt = worker.readReceipt;
    let legacyLookup = false;
    worker.readReceipt = (ref) => {
      if (ref === "results/build-code/accepted.json") {
        legacyLookup = true;
        throw new Error("historical build-code acceptance must not be read");
      }
      return readReceipt(ref);
    };
    worker.readAcceptedBuildCode = () => {
      legacyLookup = true;
      throw new Error("historical build-code acceptance must not be read");
    };

    const result = await officialStageHandler(stage)(worker, {
      receipts: {
        tests: "quality/tests/tests.json",
        review: "quality/reviews/results/review.json",
        quality_review: worker.qualityReviewRef,
        evidence: "quality/evidence/evidence.json",
        audit: worker.auditRef,
      },
    });

    expect(legacyLookup).toBe(false);
    expect(result).toMatchObject({
      verification_failure: true,
      facts: {
        tests: { exit_code: 0, snapshot_tree: tree },
        review: { snapshot_tree: tree },
        evidence_refs: [{ ref: acceptanceRef, sha256: sha }],
      },
      completion: { system: { result: "incomplete" } },
    });
    expect(result.missing_items).toContain("canonical verification receipt is missing");
    expect(result.missing_items.join("\n")).not.toMatch(/results\/build-code\/accepted\.json|accepted build-code/i);
  });

  it("does not mark acceptance covered when the verification item passes but the current AC set is empty", async () => {
    const stage = "verify-code";
    const values = {
      "quality/tests/tests.json": testsReceipt(stage),
      "quality/reviews/results/review.json": reviewReceipt(stage),
      "quality/evidence/evidence.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
      "quality/evidence/verification.json": canonical(stage, {
        producer: { stage, component: "verification", version: "1" },
        items: [
          "current_materials", "diff_scope", "risk_tests", "acceptance_criteria",
          "tasks_completion", "browser_qa", "independent_review_resolution", "core_gaps", "human_handoff",
        ].map((id) => ({ id, status: id === "acceptance_criteria" ? "pass" : "not_applicable", reason: "fixture summary only", evidence_refs: [] })),
      }),
    };
    const worker = workerFor(stage, values);
    const result = await officialStageHandler(stage)(worker, {
      receipts: {
        tests: "quality/tests/tests.json",
        review: "quality/reviews/results/review.json",
        quality_review: worker.qualityReviewRef,
        evidence: "quality/evidence/evidence.json",
        verification: "quality/evidence/verification.json",
        audit: worker.auditRef,
      },
    });
    expect(result.verification_failure).toBe(true);
    expect(result.completion.system.business_facts.acceptance_criteria).toBe("unknown");
  });

  it("reports verify-code failure when current tests and reviews no longer match the Workspace", async () => {
    const stage = "verify-code", values = {
      "quality/tests/tests.json": testsReceipt(stage),
      "quality/reviews/results/review.json": reviewReceipt(stage),
      "quality/evidence/evidence.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    const worker = workerFor(stage, values, "c".repeat(40));
    const result = await officialStageHandler(stage)(worker, { receipts: { tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json", quality_review: worker.qualityReviewRef, evidence: "quality/evidence/evidence.json", audit: worker.auditRef } });
    expect(result).toMatchObject({
      verification_failure: true,
      missing_items: expect.arrayContaining([
        expect.stringMatching(/acceptance evidence criterion set/i),
        expect.stringMatching(/snapshot/i),
        expect.stringMatching(/canonical verification receipt is missing/i),
      ]),
    });
    // A stale integration review is audit-only under the current verify
    // contract; the actionable set is acceptance, snapshot, and receipt.
    expect(result.missing_items).toHaveLength(3);
  });

  it("rejects retired verify-code quality review resolution input", async () => {
    const stage = "verify-code";
    const previousTree = "c".repeat(40);
    const qualityRef = "quality/reviews/results/quality.json";
    const resolutionRef = `quality/reviews/resolutions/${"d".repeat(64)}.json`;
    const quality = qualityReviewReceipt(previousTree);
    const ledger = {
      version: "wh-review-response-ledger.v1",
      previous_result_ref: qualityRef,
      previous_snapshot_tree: previousTree,
      current_snapshot_tree: tree,
      responses: [],
      change: {
        changed_dimensions: [],
        rationale: "focused quality findings verified",
        evidence_refs: ["evidence/proof.txt"],
      },
    };
    const resolution = buildNonGateReviewResponseRecord({
      taskId: "task",
      stage,
      previousResult: { ...quality, result_ref: qualityRef },
      previousAttempt: {
        version: "wh-review-attempt.v1",
        task_id: "task",
        stage,
        snapshot_tree: previousTree,
      },
      previousResultSha256: sha,
      ledger,
      currentSnapshotTree: tree,
    });
    const values = {
      "quality/tests/tests.json": testsReceipt(stage),
      "quality/reviews/results/review.json": reviewReceipt(stage),
      [qualityRef]: quality,
      [resolutionRef]: resolution,
      "evidence/proof.txt": "proof",
      "quality/evidence/evidence.json": canonical(stage, {
        producer: { stage, component: "evidence", version: "1" },
        refs: [],
      }),
    };
    const worker = workerFor(stage, values);
    const readFlow = worker.readAuthenticatedReviewFlow;
    worker.readAuthenticatedReviewFlow = (subject) => subject.stage === stage
      ? reviewFlow(qualityRef, quality, {
        event_kind: "resolution",
        action_ref: resolutionRef,
        action_sha256: sha,
      })
      : readFlow(subject);
    await expect(officialStageHandler(stage)(worker, {
      receipts: {
        tests: "quality/tests/tests.json",
        review: "quality/reviews/results/review.json",
        quality_review: qualityRef,
        quality_review_resolution: resolutionRef,
        evidence: "quality/evidence/evidence.json",
        audit: worker.auditRef,
      },
    })).rejects.toThrow(/unexpected receipt fields.*quality_review_resolution/i);
  });

  it("rejects acceptance evidence without stable criterion identity and schema", async () => {
    const stage = "verify-code", values = {
      "quality/tests/tests.json": testsReceipt(stage),
      "quality/reviews/results/review.json": reviewReceipt(stage),
      "quality/evidence/evidence.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [{ ref: "evidence/ac.txt", sha256: sha }] }),
      "evidence/ac.txt": { result: "pass", refs: [] },
    };
    const worker = workerFor(stage, values);
    await expect(officialStageHandler(stage)(worker, { receipts: { tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json", quality_review: worker.qualityReviewRef, evidence: "quality/evidence/evidence.json", audit: worker.auditRef } })).rejects.toThrow(/acceptance_criterion_id|acceptance.*schema|criterion identity/i);
  });

  it.each([
    ["duplicate criterion id", [{ ref: "evidence/ac-1.json", sha256: sha }, { ref: "evidence/ac-2.json", sha256: sha }], { "evidence/ac-1.json": { schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: "evidence/proof.txt", sha256: sha }] }, "evidence/ac-2.json": { schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: "evidence/proof.txt", sha256: sha }] }, "evidence/proof.txt": "proof" }, /duplicate acceptance_criterion_id/i],
    ["nested evidence hash mismatch", [{ ref: "evidence/ac-1.json", sha256: sha }], { "evidence/ac-1.json": { schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: "evidence/proof.txt", sha256: sha }] }, "evidence/proof.txt": "proof", "evidence/proof.txt:sha256": "0".repeat(64) }, /hash mismatch/i],
  ])("rejects invalid acceptance-evidence.v1: %s", async (_label, refs, entities, error) => {
    const stage = "verify-code", values = {
      "quality/tests/tests.json": testsReceipt(stage), "quality/reviews/results/review.json": reviewReceipt(stage),
      "quality/evidence/evidence.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs }), ...entities,
    };
    const worker = workerFor(stage, values);
    await expect(officialStageHandler(stage)(worker, { receipts: { tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json", quality_review: worker.qualityReviewRef, evidence: "quality/evidence/evidence.json", audit: worker.auditRef } })).rejects.toThrow(error);
  });

  it("records a failed acceptance criterion without blocking verification publication", async () => {
    const stage = "verify-code", values = {
      "quality/tests/tests.json": testsReceipt(stage), "quality/reviews/results/review.json": reviewReceipt(stage),
      "quality/evidence/evidence.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [{ ref: "evidence/ac-1.json", sha256: sha }] }),
      "evidence/ac-1.json": { schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "fail", refs: [{ ref: "evidence/proof.txt", sha256: sha }] },
      "evidence/proof.txt": "proof",
    };
    const worker = workerFor(stage, values);
    await expect(officialStageHandler(stage)(worker, { receipts: { tests: "quality/tests/tests.json", review: "quality/reviews/results/review.json", quality_review: worker.qualityReviewRef, evidence: "quality/evidence/evidence.json", audit: worker.auditRef } })).resolves.toMatchObject({ facts: { evidence_refs: [{ ref: "evidence/ac-1.json" }] } });
  });

  it("verifies every referenced file exists and matches its declared hash", () => {
    const runner = readFileSync(resolve("runtime/stage/stage-runner.mjs"), "utf8");
    expect(runner).toMatch(/(?:verify|assert).*Evidence|evidence.*(?:exists|hash)/i);
    expect(runner).toMatch(/output_ref[\s\S]*(?:readRecord|sha256)/i);
  });

  it("does not expose the removed task migration entrypoints", () => {
    const cliEntries = readdirSync(resolve("tools/cli"));
    expect(cliEntries).not.toEqual(expect.arrayContaining(["migrate-task-v2.mjs", "task-migrate-target-repo.mjs"]));
  });

  it("does not retain the removed accepted writer in the runtime kernel", () => {
    const kernel = readFileSync(resolve("runtime/task/task-kernel-implementation.mjs"), "utf8");
    expect(existsSync(resolve("runtime/task/git-checkpoint.mjs"))).toBe(false);
    expect(kernel).toMatch(/current-four-materials/);
    expect(kernel).not.toMatch(/acceptAttempt|publishAttempt/);
    expect(kernel).not.toMatch(/createCheckpoint|checkpoint/);
    expect(kernel).toMatch(/immutable quality facts/);
  });

  it("does not expose the historical accepted projection writer", () => {
    const kernel = readFileSync(resolve("runtime/task/task-kernel-implementation.mjs"), "utf8");
    expect(kernel).not.toMatch(/^\s*(?:publishAttempt|acceptAttempt|confirmAttempt)\s*\(/m);
  });

  it("does not exempt test directories wholesale and keeps fixture exceptions file-scoped", () => {
    const source = readFileSync(resolve("tools/cli/check-task-record-paths.mjs"), "utf8");
    expect(source).not.toMatch(/rel\.includes\("\/__tests__\/"\)|\(\?:\^\|\\\/\)tests\?\\\//);
    expect(source).toMatch(/FIXTURE_ALLOWLIST/);
  });

  it("allows specs task-path construction only inside ArtifactDir", () => {
    const source = readFileSync(resolve("tools/cli/check-task-record-paths.mjs"), "utf8");
    expect(source).toMatch(/specs[\s\S]+ArtifactDir product authority/);
    expect(source).toMatch(/literal specs path derivation is only legal in core\/artifact-dir\.mjs/);
  });
});
