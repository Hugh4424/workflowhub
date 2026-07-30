import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { officialStageHandler } from "../core/stage-handlers.mjs";
import { validateStageFacts } from "../core/task-kernel.mjs";
import { aggregateProviderResults } from "../skills/wh-review/scripts/review-result.mjs";
import { buildNonGateReviewResponseRecord } from "../skills/wh-review/scripts/review-controller.mjs";
import { buildRiskAcceptance, deriveSeriousReviewPause } from "../core/stage-review-disposition.mjs";

describe("final cutover guard contracts", () => {
  const sha = "a".repeat(64), tree = "b".repeat(40);
  const canonicalHash = (value) => createHash("sha256").update(`${JSON.stringify(value, null, 2)}\n`).digest("hex");
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
- **evidence_refs**：\`[{"kind":"task_record","ref":"receipts/tests.json","sha256":"${sha}"},{"kind":"task_record","ref":"receipts/implementation.json","sha256":"${sha}"},{"kind":"task_record","ref":"evidence/ac1.json","sha256":"${sha}"}]\`
- **covered_ac**：AC1
- **review_fact**：reviews/results/review.json
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
  const testsReceipt = (stage, snapshotTree = tree) => canonical(stage, { command: "true", exit_code: 0, command_hash: sha, snapshot_head: tree, snapshot_tree: snapshotTree, snapshot_commit: tree, started_at: "2026-07-19T00:00:00.000Z", completed_at: "2026-07-19T00:00:01.000Z", output_ref: "evidence/test.txt", output_hash: sha });
  const reviewReceipt = (stage, verdict = "pass", snapshotTree = tree, subjectKind = "worktree") => {
    const reviewStage = stage === "verify-code" ? "build-code" : stage;
    const reviewScope = reviewStage === "build-code" ? (subjectKind === "phase" ? "phase" : "integration") : null;
    const providerFinding = { severity: "major", path: "fixture", issue: "fixture", root_cause: "fixture review identifies an anchored issue", recommendation: "revise", evidence_kind: "direct", evidence: "fixture evidence is anchored to the fixture path" };
    const providerOutput = { verdict, summary: "fixture review", findings: verdict === "revise_required" ? [providerFinding] : (verdict === "invented" ? [{ severity: "minor", path: "fixture", issue: "fixture", recommendation: "revise" }] : []) };
    const aggregation = ["pass", "revise_required"].includes(verdict) ? aggregateProviderResults([{ provider: "fixture-provider", review: providerOutput }], 1) : null;
    const resultVerdict = aggregation?.verdict ?? verdict;
    return { version: "wh-review-result.v1", task_id: "task", stage: reviewStage, review_track: null,
      source: { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree }, snapshot_tree: snapshotTree,
      subject_kind: subjectKind, phase_id: subjectKind === "phase" ? "phase-1" : null, review_scope: reviewScope, base_tree: tree, candidate_tree: snapshotTree,
      material_id: sha, attempt_ref: `reviews/attempts/${stage}-attempt/attempt.json`,
      provider_results: [{ provider: "fixture-provider", output: providerOutput }], verdict: resultVerdict,
      findings: aggregation ? aggregation.adjudication.reportFindings.map((item) => ({ provider: item.providers[0], ...item })) : (verdict === "invented" ? [{ provider: "fixture-provider", severity: "minor", path: "fixture", issue: "fixture", recommendation: "revise" }] : []),
      ...(aggregation ? { adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters } } : {}) };
  };
  const qualityReviewReceipt = (snapshotTree = tree) => ({
    ...reviewReceipt("build-code", "pass", snapshotTree),
    stage: "verify-code", review_scope: null, phase_id: null,
    attempt_ref: "reviews/attempts/quality-attempt/attempt.json",
  });
  const reviewFlow = (resultRef, result, overrides = {}) => ({
    version: "wh-review-flow-event.v1",
    event_kind: "semantic_result",
    event_ref: `reviews/flows/${"f".repeat(64)}/event-0001.json`,
    identity: {
      task_id: "task", workflow_run_id: "fixture:attempt-0001", stage: result.stage,
      review_track: result.review_track ?? null, subject_kind: result.subject_kind,
      phase_id: result.phase_id ?? null, review_scope: result.review_scope ?? null,
    },
    root_result_ref: result.review_chain?.root_result_ref ?? resultRef,
    head_result_ref: resultRef,
    result_sha256: sha,
    verdict: result.verdict ?? null,
    ...overrides,
  });
  const workerFor = (stage, values, currentTree = tree) => {
    const workflowRunId = "fixture:attempt-0001";
    const auditRef = `evidence/audits/${stage}/${"f".repeat(64)}.json`;
    if (!values[auditRef]) {
      const audit = {
        schema_version: "v1", task_id: "task", stage_slug: stage, verdict: "pass",
        summary_hash: sha, workflow_run_id: workflowRunId, snapshot_tree: currentTree,
        content_evidence_refs: [],
        ...(stage === "make-decision" ? { through_step_id: 10, audit_scope: "pre_confirmation" } : {}),
      };
      if (stage === "make-decision" && values["receipts/decision.json"]?.decision_ref && values["receipts/decision.json"]?.decision_hash) {
        const decision = values["receipts/decision.json"];
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
    if (stage === "verify-code" && !values["reviews/results/quality.json"]) {
      qualityReviewRef = "reviews/results/quality.json";
      values[qualityReviewRef] = qualityReviewReceipt(currentTree);
    } else if (stage === "verify-code") {
      qualityReviewRef = "reviews/results/quality.json";
    }
    for (const result of Object.values(values).filter((value) => value?.version === "wh-review-result.v1")) {
      const attemptId = result.attempt_ref.split("/")[2], outputRef = `reviews/attempts/${attemptId}/providers/fixture-provider.output.json`;
      const content = JSON.stringify(result.provider_results[0].output);
      values[result.attempt_ref] = { version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: "task", stage: result.stage, review_track: result.review_track ?? null,
        source: result.source, snapshot_tree: result.snapshot_tree, material_id: result.material_id,
        subject_kind: result.subject_kind, phase_id: result.phase_id, review_scope: result.review_scope, base_tree: result.base_tree, candidate_tree: result.candidate_tree,
        ...(result.review_chain ? { review_chain: result.review_chain } : {}),
        provider_attempts: [{ provider: "fixture-provider", status: "completed", session_id: "fixture", runtime_id: "fixture", output_ref: outputRef, error: null }], terminal_status: "semantic", error: null };
      values[outputRef] = { schema_version: "wh-review-provider-output.v1", task_id: "task", stage: result.stage, attempt_id: attemptId,
        provider: "fixture-provider", content, content_hash: createHash("sha256").update(content).digest("hex") };
    }
    return {
      stage,
      workflowRunId,
      identity: { taskId: "task" },
      readCompletionInvocationFacts: () => ({
        declaredComponents: [],
        invocationFacts: [],
      }),
      readReceipt: (ref) => ({
        value: values[ref],
        sha256: stage === "build-spec" && ref === "receipts/spec.json" ? canonicalHash(values[ref]) : sha,
      }),
      readOptionalReceipt: (ref) => values[ref] === undefined ? null : ({
        value: values[ref],
        sha256: stage === "build-spec" && ref === "receipts/spec.json" ? canonicalHash(values[ref]) : sha,
      }),
      readEvidence: (ref) => ({ value: values[ref], sha256: values[`${ref}:sha256`] ?? sha }),
      readAuthenticatedReviewFlow: (subject) => {
        const entry = Object.entries(values).find(([ref, value]) => ref.startsWith("reviews/results/")
          && value?.version === "wh-review-result.v1"
          && value.stage === subject.stage
          && (value.review_track ?? null) === (subject.review_track ?? null)
          && value.subject_kind === subject.subject_kind
          && (value.phase_id ?? null) === (subject.phase_id ?? null)
          && (value.review_scope ?? null) === (subject.review_scope ?? null));
        if (entry) return reviewFlow(entry[0], entry[1]);
        const attempt = Object.entries(values).find(([ref, value]) => ref.startsWith("reviews/attempts/") && ref.endsWith("/attempt.json")
          && value?.terminal_status === "unavailable"
          && value.stage === subject.stage
          && (value.review_track ?? null) === (subject.review_track ?? null)
          && value.subject_kind === subject.subject_kind
          && (value.phase_id ?? null) === (subject.phase_id ?? null)
          && (value.review_scope ?? null) === (subject.review_scope ?? null));
        if (!attempt) throw new Error("fixture authenticated review flow not found");
        return reviewFlow("reviews/results/none.json", attempt[1], {
          event_kind: "provider_attempt",
          action_ref: attempt[0],
          action_sha256: sha,
          root_result_ref: null,
          head_result_ref: null,
          result_sha256: null,
        });
      },
      snapshotWorkspace: () => ({ tree: currentTree }),
      readAcceptedBuildCode: () => ({ facts: { tests: { snapshot_tree: tree }, acceptance_coverage: { snapshot_tree: tree, accepted_criterion_ids: ["AC-1"], items: [] }, review: { result_ref: "reviews/results/review.json", result_hash: sha, snapshot_tree: tree, subject_kind: "worktree", phase_id: null, review_scope: "integration" } } }),
      auditRef,
      qualityReviewRef,
    };
  };

  it.each([
    ["tests", "notes/tests.json"],
    ["review", "evidence/review.json"],
    ["evidence", "reviews/results/evidence.json"],
  ])("rejects a %s receipt outside its canonical namespace", async (kind, badRef) => {
    const values = {
      "notes/tests.json": { command: "true", exit_code: 0, command_hash: "a".repeat(64), snapshot_tree: "b".repeat(40), output_ref: "evidence/out", output_hash: "c".repeat(64) },
      "evidence/review.json": { version: "wh-review-result.v1", verdict: "pass", snapshot_tree: "b".repeat(40) },
      "reviews/results/evidence.json": { refs: [] },
    };
    const worker = { stage: "verify-code", identity: { taskId: "task" }, readReceipt: (ref) => ({ value: values[ref], sha256: "d".repeat(64) }) };
    const receipts = { tests: "notes/tests.json", review: "evidence/review.json", evidence: "reviews/results/evidence.json" };
    const valid = { tests: "receipts/tests.json", review: "reviews/results/review.json", evidence: "evidence/manifest.json" };
    for (const [name, ref] of Object.entries(valid)) if (name !== kind) { receipts[name] = ref; values[ref] = name === "tests" ? values["notes/tests.json"] : name === "review" ? values["evidence/review.json"] : values["reviews/results/evidence.json"]; }
    await expect(officialStageHandler("verify-code")(worker, { receipts })).rejects.toThrow(/namespace|canonical|receipt.*ref/i);
  });

  it("requires receipt schema and producer provenance instead of accepting shape-only JSON", async () => {
    const auditRef = `evidence/audits/build-spec/${"f".repeat(64)}.json`;
    const audit = { schema_version: "v1", task_id: "task", stage_slug: "build-spec", verdict: "pass", summary_hash: sha, workflow_run_id: "fixture:attempt-0001", snapshot_tree: tree, content_evidence_refs: [] };
    const worker = { stage: "build-spec", identity: { taskId: "task" }, writeArtifact() {}, createCheckpoint() { return {}; }, readReceipt: (ref) => ({ value: ref === auditRef ? audit : { content: "fake" }, sha256: "a".repeat(64) }) };
    await expect(officialStageHandler("build-spec")(worker, { receipts: { spec: "receipts/spec.json", audit: auditRef } }))
      .rejects.toThrow(/schema|producer|provenance/i);
  });

  it("publishes build-spec business facts while disclosing unavailable audit support", async () => {
    const content = "# Spec\n";
    const values = {
      "receipts/spec.json": canonical("build-spec", {
        producer: { stage: "build-spec", component: "spec", version: "1" },
        content,
        content_hash: createHash("sha256").update(content).digest("hex"),
      }),
      "reviews/results/review.json": reviewReceipt("build-spec"),
    };
    const worker = {
      ...workerFor("build-spec", values),
      readArtifact: () => content,
      artifactRef: () => "specs/task/spec.md",
      createCheckpoint: () => ({ plan_hash: sha }),
    };
    const result = await officialStageHandler("build-spec")(worker, {
      receipts: { spec: "receipts/spec.json", review: "reviews/results/review.json" },
    });
    expect(result.facts).not.toHaveProperty("audit_summary_ref");
    expect(result.missing_items).toEqual(expect.arrayContaining([
      "support:audit",
      expect.stringMatching(/audit unavailable\/unverified\/mismatch/i),
    ]));
  });

  it.each([
    ["make-decision", { decision: "receipts/decision.json" }],
    ["build-spec", { spec: "receipts/spec.json" }],
    ["build-plan", { plan: "receipts/plan.json", tasks: "receipts/tasks.json" }],
  ])("refuses to publish %s without its formal review receipts", async (stage, receipts) => {
    const values = Object.fromEntries(Object.values(receipts).map((ref) => [ref, canonical(stage, {
      producer: { stage, component: ref.includes("decision") ? "decision" : ref.includes("tasks") ? "tasks" : ref.includes("plan") ? "plan" : "spec", version: "1" },
      content: "content\n", content_hash: "unused",
    })]));
    const auditRef = `evidence/audits/${stage}/${"f".repeat(64)}.json`;
    values[auditRef] = { schema_version: "v1", task_id: "task", stage_slug: stage, verdict: "pass", summary_hash: sha, workflow_run_id: "fixture:attempt-0001", snapshot_tree: tree, content_evidence_refs: [], ...(stage === "make-decision" ? { through_step_id: 10, audit_scope: "pre_confirmation" } : {}) };
    receipts.audit = auditRef;
    const worker = { stage, identity: { taskId: "task" }, readReceipt: (ref) => ({ value: values[ref], sha256: sha }) };
    await expect(officialStageHandler(stage)(worker, { receipts })).rejects.toThrow(/review.*receipt ref/i);
  });

  it("rejects caller-owned workflow identity and an untracked make-decision resolution field", async () => {
    const worker = { stage: "make-decision", identity: { taskId: "task" } };
    await expect(officialStageHandler("make-decision")(worker, {
      receipts: {}, workflow_run_id: "caller-forged",
    })).rejects.toThrow(/unknown fields.*workflow_run_id/i);
    await expect(officialStageHandler("make-decision")(worker, {
      receipts: { review_resolution: `reviews/resolutions/${"d".repeat(64)}.json` },
    })).rejects.toThrow(/unexpected receipt fields.*review_resolution/i);
  });

  it.each([
    ["make-decision", "spec", "receipts/spec.json"],
    ["build-spec", "plan", "receipts/plan.json"],
    ["build-plan", "decision", "receipts/decision.json"],
    ["build-code", "evidence", "evidence/verify-evidence.json"],
    ["verify-code", "implementation", "receipts/implementation.json"],
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
    ["missing spec", "build-spec", { spec: "receipts/spec.json", review: "reviews/results/review.json" }, { spec: "# Spec\n" }, {}],
    ["different spec", "build-spec", { spec: "receipts/spec.json", review: "reviews/results/review.json" }, { spec: "# Spec\n" }, { "spec.md": "wrong\n" }],
    ["missing tasks", "build-plan", { plan: "receipts/plan.json", tasks: "receipts/tasks.json", review: "reviews/results/review.json" }, { plan: "# Plan\n", tasks: "# Tasks\n" }, { "plan.md": "# Plan\n" }],
    ["different tasks", "build-plan", { plan: "receipts/plan.json", tasks: "receipts/tasks.json", review: "reviews/results/review.json" }, { plan: "# Plan\n", tasks: "# Tasks\n" }, { "plan.md": "# Plan\n", "tasks.md": "wrong\n" }],
  ])("rejects %s when the reviewed design artifact differs from its final receipt without mutating the Workspace", async (_case, stage, receipts, contents, artifacts) => {
    const values = { "reviews/results/review.json": reviewReceipt(stage) };
    for (const [component, content] of Object.entries(contents)) values[`receipts/${component}.json`] = canonical(stage, {
      producer: { stage, component, version: "1" }, content, content_hash: createHash("sha256").update(content).digest("hex"),
    });
    let checkpointCalls = 0, writeCalls = 0;
    const worker = {
      ...workerFor(stage, values),
      readArtifact: (name) => artifacts[name],
      writeArtifact: () => { writeCalls += 1; },
      createCheckpoint: () => { checkpointCalls += 1; return {}; },
      artifactRef: (name) => `specs/task/${name}`,
    };
    receipts.audit = worker.auditRef;
    await expect(officialStageHandler(stage)(worker, { receipts })).rejects.toThrow(/artifact.*receipt|differ/i);
    expect(writeCalls).toBe(0);
    expect(checkpointCalls).toBe(0);
  });

  it("rejects a stale build-spec review that is not bound to the final spec snapshot", async () => {
    const stage = "build-spec", content = "# Spec\n", values = {
      "receipts/spec.json": canonical(stage, { producer: { stage, component: "spec", version: "1" }, content, content_hash: createHash("sha256").update(content).digest("hex") }),
      "reviews/results/review.json": reviewReceipt(stage, "revise_required"),
    };
    let checkpointCalls = 0;
    const worker = {
      ...workerFor(stage, values, "c".repeat(40)),
      readAuthenticatedReviewFlow: () => reviewFlow("reviews/results/review.json", values["reviews/results/review.json"]),
      readArtifact: () => content,
      createCheckpoint: () => { checkpointCalls += 1; return {}; },
      artifactRef: () => "specs/task/spec.md",
    };
    await expect(officialStageHandler(stage)(worker, { receipts: { spec: "receipts/spec.json", review: "reviews/results/review.json", audit: worker.auditRef } }))
      .rejects.toThrow(/current.*snapshot|snapshot.*resolution|review.*final spec|SERIOUS_REVIEW_PAUSE/i);
    expect(checkpointCalls).toBe(0);
  });

  it("accepts a stale prior review only through a verified canonical delta resolution bound to the current snapshot", async () => {
    const stage = "build-spec", content = "# Spec v2\n", currentTree = "c".repeat(40);
    const reviewRef = "reviews/results/review.json", resolutionRef = `reviews/resolutions/${"d".repeat(64)}.json`;
    const prior = reviewReceipt(stage, "pass");
    const ledger = {
      version: "wh-review-response-ledger.v1", previous_result_ref: reviewRef,
      previous_snapshot_tree: prior.snapshot_tree, current_snapshot_tree: currentTree,
      change: {
        changed_dimensions: [], rationale: "clarified wording without changing the contract",
        evidence_refs: ["receipts/spec.json"],
      },
      responses: [],
    };
    const resolution = buildNonGateReviewResponseRecord({
      taskId: "task", stage, previousResult: { ...prior, result_ref: reviewRef },
      previousResultSha256: sha, ledger, currentSnapshotTree: currentTree,
    });
    const values = {
      "receipts/spec.json": canonical(stage, { producer: { stage, component: "spec", version: "1" }, content, content_hash: createHash("sha256").update(content).digest("hex") }),
      [reviewRef]: prior,
      [resolutionRef]: resolution,
    };
    const worker = {
      ...workerFor(stage, values, currentTree),
      readAuthenticatedReviewFlow: () => reviewFlow(reviewRef, prior, {
        event_kind: "resolution", event_ref: `reviews/flows/${"f".repeat(64)}/event-0002.json`,
        action_ref: resolutionRef, action_sha256: sha,
      }),
      readArtifact: () => content,
      createCheckpoint: () => ({}),
      artifactRef: () => "specs/task/spec.md",
    };
    await expect(officialStageHandler(stage)(worker, { receipts: { spec: "receipts/spec.json", review: reviewRef, review_resolution: resolutionRef, audit: worker.auditRef } }))
      .resolves.toMatchObject({
        facts: { review: { result_ref: reviewRef } },
        evidence_refs: expect.arrayContaining([{ ref: resolutionRef, sha256: sha }]),
      });
  });

  it("rejects a delta resolution whose prior result hash is not exact", async () => {
    const stage = "build-spec", content = "# Spec v2\n", currentTree = "c".repeat(40);
    const reviewRef = "reviews/results/review.json", resolutionRef = `reviews/resolutions/${"d".repeat(64)}.json`;
    const prior = reviewReceipt(stage, "pass");
    const ledger = {
      version: "wh-review-response-ledger.v1", previous_result_ref: reviewRef,
      previous_snapshot_tree: prior.snapshot_tree, current_snapshot_tree: currentTree,
      change: {
        changed_dimensions: [], rationale: "clarified wording without changing the contract",
        evidence_refs: ["receipts/spec.json"],
      },
      responses: [],
    };
    const resolution = buildNonGateReviewResponseRecord({
      taskId: "task", stage, previousResult: { ...prior, result_ref: reviewRef },
      previousResultSha256: sha, ledger, currentSnapshotTree: currentTree,
    });
    resolution.previous_result_sha256 = "e".repeat(64);
    const values = {
      "receipts/spec.json": canonical(stage, { producer: { stage, component: "spec", version: "1" }, content, content_hash: createHash("sha256").update(content).digest("hex") }),
      [reviewRef]: prior, [resolutionRef]: resolution,
    };
    const worker = {
      ...workerFor(stage, values, currentTree),
      readAuthenticatedReviewFlow: () => reviewFlow(reviewRef, prior, {
        event_kind: "resolution", event_ref: `reviews/flows/${"f".repeat(64)}/event-0002.json`,
        action_ref: resolutionRef, action_sha256: sha,
      }),
      readArtifact: () => content,
      createCheckpoint: () => ({}),
      artifactRef: () => "specs/task/spec.md",
    };
    await expect(officialStageHandler(stage)(worker, { receipts: { spec: "receipts/spec.json", review: reviewRef, review_resolution: resolutionRef, audit: worker.auditRef } }))
      .rejects.toThrow(/prior review ref\/hash\/snapshot/i);
  });

  it("accepts a current structural full review only when its canonical parent result is hash-bound", async () => {
    const stage = "build-spec", content = "# Structural spec\n", currentTree = "c".repeat(40);
    const priorRef = "reviews/results/prior.json", fullRef = "reviews/results/full.json";
    const prior = reviewReceipt(stage, "pass");
    prior.attempt_ref = "reviews/attempts/prior-attempt/attempt.json";
    const full = reviewReceipt(stage, "pass", currentTree);
    full.attempt_ref = "reviews/attempts/full-attempt/attempt.json";
    full.review_chain = {
      version: "wh-review-chain.v1", round: "full", parent_result_ref: priorRef, root_result_ref: priorRef,
      prior_snapshot_tree: tree, current_snapshot_tree: currentTree,
      response_ledger_sha256: sha, source_diff_sha256: sha,
    };
    const values = {
      "receipts/spec.json": canonical(stage, { producer: { stage, component: "spec", version: "1" }, content, content_hash: createHash("sha256").update(content).digest("hex") }),
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
    await expect(officialStageHandler(stage)(worker, { receipts: { spec: "receipts/spec.json", review: fullRef, audit: worker.auditRef } }))
      .resolves.toMatchObject({
        facts: { review: { result_ref: fullRef, snapshot_tree: currentTree } },
        evidence_refs: expect.arrayContaining([{ ref: priorRef, sha256: sha }]),
      });
  });

  it.each([
    ["head", { head_result_ref: "reviews/results/other.json" }, /authenticated flow head/i],
    ["hash", { result_sha256: "e".repeat(64) }, /authenticated flow hash/i],
    ["root", { root_result_ref: "reviews/results/other.json" }, /authenticated flow root/i],
  ])("rejects a current build-spec review detached from the authenticated flow %s", async (_label, flowOverride, error) => {
    const stage = "build-spec", content = "# Spec\n", reviewRef = "reviews/results/review.json";
    const review = reviewReceipt(stage, "pass");
    const values = {
      "receipts/spec.json": canonical(stage, { producer: { stage, component: "spec", version: "1" }, content, content_hash: createHash("sha256").update(content).digest("hex") }),
      [reviewRef]: review,
    };
    let checkpointCalls = 0;
    const worker = {
      ...workerFor(stage, values),
      readAuthenticatedReviewFlow: () => reviewFlow(reviewRef, review, flowOverride),
      readArtifact: () => content,
      createCheckpoint: () => { checkpointCalls += 1; return {}; },
      artifactRef: () => "specs/task/spec.md",
    };
    await expect(officialStageHandler(stage)(worker, { receipts: { spec: "receipts/spec.json", review: reviewRef, audit: worker.auditRef } }))
      .rejects.toThrow(/authenticated (?:review-)?flow head|authenticated flow hash|authenticated flow root/i);
    expect(checkpointCalls).toBe(0);
  });

  it("surfaces accepted risk from external audit at the build-plan human boundary without making it a stage fact", async () => {
    const stage = "build-plan", plan = "# Plan\n", tasks = "# Tasks\n", auditRef = `reviews/resolutions/${"c".repeat(64)}.json`;
    const values = {
      "receipts/plan.json": canonical(stage, { producer: { stage, component: "plan", version: "1" }, content: plan, content_hash: createHash("sha256").update(plan).digest("hex") }),
      "receipts/tasks.json": canonical(stage, { producer: { stage, component: "tasks", version: "1" }, content: tasks, content_hash: createHash("sha256").update(tasks).digest("hex") }),
      "reviews/results/review.json": reviewReceipt(stage),
    };
    const worker = {
      ...workerFor(stage, values), readArtifact: (name) => name === "plan.md" ? plan : tasks,
      createCheckpoint: () => ({}), artifactRef: (name) => `specs/task/${name}`,
      listReviewAuditRefs: () => [auditRef],
      readReviewAudit: () => ({ value: { version: "wh-review-resolution.v1", task_id: "task", stage, outcome: "recorded_non_gate_response", accepted_risk_count: 1 }, sha256: sha }),
    };
    const outcome = await officialStageHandler(stage)(worker, { receipts: { plan: "receipts/plan.json", tasks: "receipts/tasks.json", review: "reviews/results/review.json", audit: worker.auditRef } });
    expect(outcome.facts).not.toHaveProperty("review_audit");
    expect(outcome.missing_items).toContain(`accepted risk recorded in external wh-review audit: ${auditRef}; present it to the human confirmer`);
  });

  it("rejects a build-plan review that is not the authenticated flow head", async () => {
    const stage = "build-plan", plan = "# Plan\n", tasks = "# Tasks\n";
    const reviewRef = "reviews/results/review.json";
    const review = reviewReceipt(stage);
    const values = {
      "receipts/plan.json": canonical(stage, { producer: { stage, component: "plan", version: "1" }, content: plan, content_hash: createHash("sha256").update(plan).digest("hex") }),
      "receipts/tasks.json": canonical(stage, { producer: { stage, component: "tasks", version: "1" }, content: tasks, content_hash: createHash("sha256").update(tasks).digest("hex") }),
      [reviewRef]: review,
    };
    const worker = {
      ...workerFor(stage, values),
      readAuthenticatedReviewFlow: () => reviewFlow(reviewRef, review, {
        identity: {
          task_id: "task", workflow_run_id: "build-spec:attempt-0001", stage,
          review_track: null, subject_kind: "worktree", phase_id: null, review_scope: null,
        },
        head_result_ref: "reviews/results/other.json",
      }),
      readArtifact: (name) => name === "plan.md" ? plan : tasks,
      createCheckpoint: () => ({}),
      artifactRef: (name) => `specs/task/${name}`,
    };
    await expect(officialStageHandler(stage)(worker, {
      receipts: { plan: "receipts/plan.json", tasks: "receipts/tasks.json", review: reviewRef, audit: worker.auditRef },
    })).rejects.toThrow(/authenticated (?:review-)?flow head/i);
  });

  it("rejects build-plan publication when a newer authenticated flow action is not consumed", async () => {
    const stage = "build-plan", plan = "# Plan\n", tasks = "# Tasks\n";
    const reviewRef = "reviews/results/review.json";
    const review = reviewReceipt(stage);
    const values = {
      "receipts/plan.json": canonical(stage, { producer: { stage, component: "plan", version: "1" }, content: plan, content_hash: createHash("sha256").update(plan).digest("hex") }),
      "receipts/tasks.json": canonical(stage, { producer: { stage, component: "tasks", version: "1" }, content: tasks, content_hash: createHash("sha256").update(tasks).digest("hex") }),
      [reviewRef]: review,
    };
    const worker = {
      ...workerFor(stage, values),
      readAuthenticatedReviewFlow: () => reviewFlow(reviewRef, review, {
        event_kind: "resolution",
        event_ref: `reviews/flows/${"f".repeat(64)}/event-0002.json`,
        action_ref: `reviews/resolutions/${"d".repeat(64)}.json`,
        action_sha256: "e".repeat(64),
      }),
      readArtifact: (name) => name === "plan.md" ? plan : tasks,
      createCheckpoint: () => ({}),
      artifactRef: (name) => `specs/task/${name}`,
    };
    await expect(officialStageHandler(stage)(worker, {
      receipts: { plan: "receipts/plan.json", tasks: "receipts/tasks.json", review: reviewRef, audit: worker.auditRef },
    })).rejects.toThrow(/latest authenticated flow action|resolution/i);
  });

  it("consumes direction and detail resolutions only through their dedicated latest flow actions", async () => {
    const stage = "make-decision", currentTree = "c".repeat(40);
    const decisionLog = "# Decision\n\nGo.\n";
    const directionRef = "reviews/results/direction.json";
    const detailRef = "reviews/results/detail.json";
    const direction = reviewReceipt(stage, "pass");
    direction.review_track = "direction";
    direction.attempt_ref = "reviews/attempts/direction-attempt/attempt.json";
    const detail = reviewReceipt(stage, "pass", currentTree);
    detail.review_track = "detail";
    detail.attempt_ref = "reviews/attempts/detail-attempt/attempt.json";
    const ledger = {
      version: "wh-review-response-ledger.v1", previous_result_ref: directionRef,
      previous_snapshot_tree: direction.snapshot_tree, current_snapshot_tree: currentTree,
      change: { changed_dimensions: [], rationale: "clarified wording", evidence_refs: ["receipts/decision.json"] },
      responses: [],
    };
    const directionResolution = buildNonGateReviewResponseRecord({
      taskId: "task", stage, reviewTrack: "direction",
      previousResult: { ...direction, result_ref: directionRef },
      previousResultSha256: sha, ledger, currentSnapshotTree: currentTree,
    });
    const directionResolutionRef = `reviews/resolutions/${"d".repeat(64)}.json`;
    const values = {
      "receipts/decision.json": canonical(stage, {
        producer: { stage, component: "decision", version: "1" },
        decision_ref: `receipts/decision-log/${createHash("sha256").update(decisionLog).digest("hex")}.md`,
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
          event_kind: "resolution", event_ref: `reviews/flows/${"f".repeat(64)}/event-0002.json`,
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
        decision: "receipts/decision.json",
        direction_review: directionRef,
        direction_review_resolution: directionResolutionRef,
        detail_review: detailRef,
        audit: worker.auditRef,
      },
    })).resolves.toMatchObject({
      evidence_refs: expect.arrayContaining([{ ref: directionResolutionRef, sha256: sha }]),
    });
  });

  it("clears a make-decision revise finding only after verified same-flow resolution", async () => {
    const stage = "make-decision", currentTree = "c".repeat(40), workflowRunId = "fixture:make-decision-resolution";
    const decisionLog = "# Decision\n\nGo.\n", decisionHash = createHash("sha256").update(decisionLog).digest("hex");
    const directionRef = "reviews/results/direction-resolution.json", detailRef = "reviews/results/detail-resolution.json";
    const direction = reviewReceipt(stage, "revise_required", currentTree); direction.review_track = "direction"; direction.attempt_ref = "reviews/attempts/direction-resolution-attempt/attempt.json";
    const detail = reviewReceipt(stage, "pass", currentTree); detail.review_track = "detail"; detail.attempt_ref = "reviews/attempts/detail-resolution-attempt/attempt.json";
    const findingId = direction.findings[0].id;
    const ledger = { version: "wh-review-response-ledger.v1", previous_result_ref: directionRef, previous_snapshot_tree: currentTree, current_snapshot_tree: currentTree, responses: [{ finding_id: findingId, status: "fixed", rationale: "Focused resolution evidence was rerun and verified.", changed_dimensions: [], evidence_refs: ["evidence/resolution.json"] }] };
    const directionResolution = buildNonGateReviewResponseRecord({ taskId: "task", stage, reviewTrack: "direction", previousResult: { ...direction, result_ref: directionRef }, previousResultSha256: sha, ledger, currentSnapshotTree: currentTree });
    const directionResolutionRef = `reviews/resolutions/${"d".repeat(64)}.json`;
    const interactionPayload = { interaction_type: "aggregate", workspace_tree: currentTree, decision_ref: `receipts/decision-log/${decisionHash}.md`, decision_hash: decisionHash };
    const interaction = { schema_version: "stage-content-evidence.v1", kind: "interaction-completion.v1", task_id: "task", stage, workflow_run_id: workflowRunId, snapshot_tree: currentTree, content_hash: createHash("sha256").update(JSON.stringify(interactionPayload)).digest("hex"), payload: interactionPayload };
    const audit = { schema_version: "v1", task_id: "task", stage_slug: stage, verdict: "pass", summary_hash: sha, workflow_run_id: workflowRunId, snapshot_tree: currentTree, through_step_id: 10, audit_scope: "pre_confirmation", content_evidence_refs: [{ kind: "interaction-completion.v1", ref: "evidence/interaction.json", hash: sha }] };
    const values = {
      "receipts/decision.json": canonical(stage, { producer: { stage, component: "decision", version: "1" }, decision_ref: `receipts/decision-log/${decisionHash}.md`, decision_hash: decisionHash, content_hash: decisionHash, contract_refs: [] }),
      "evidence/interaction.json": interaction,
      [`evidence/audits/make-decision/${"e".repeat(64)}.json`]: audit,
      [directionRef]: direction, [detailRef]: detail, [directionResolutionRef]: directionResolution,
    };
    const worker = { ...workerFor(stage, values, currentTree), workflowRunId, candidateWorkspace: { worktreeRoot: "/tmp/candidate", baselineCommit: tree, captureSnapshot: () => ({ tree: currentTree }) }, readEvidence: (ref) => ref === `receipts/decision-log/${decisionHash}.md` ? { bytes: decisionLog, sha256: decisionHash } : { bytes: "interaction", sha256: sha }, readAuthenticatedReviewFlow: (subject) => subject.review_track === "direction" ? reviewFlow(directionRef, direction, { event_kind: "resolution", event_ref: `reviews/flows/${"f".repeat(64)}/event-0002.json`, action_ref: directionResolutionRef, action_sha256: sha, identity: { task_id: "task", workflow_run_id: workflowRunId, stage, review_track: "direction", subject_kind: "worktree", phase_id: null, review_scope: null } }) : reviewFlow(detailRef, detail, { identity: { task_id: "task", workflow_run_id: workflowRunId, stage, review_track: "detail", subject_kind: "worktree", phase_id: null, review_scope: null } }) };
    const result = await officialStageHandler(stage)(worker, { receipts: { decision: "receipts/decision.json", audit: `evidence/audits/make-decision/${"e".repeat(64)}.json`, direction_review: directionRef, direction_review_resolution: directionResolutionRef, detail_review: detailRef } });
    expect(result).toMatchObject({ missing_items: [], facts: { reviews: { direction: { verdict: "revise_required" } } } });
  });

  it("records a real failing test command as a quality fact", async () => {
    const stage = "verify-code";
    const values = {
      "receipts/tests.json": testsReceipt(stage),
      "reviews/results/review.json": reviewReceipt(stage),
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    values["receipts/tests.json"].exit_code = 1;
    const worker = workerFor(stage, values);
    await expect(officialStageHandler(stage)(worker, { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", quality_review: worker.qualityReviewRef, evidence: "evidence/manifest.json", audit: worker.auditRef } }))
      .resolves.toMatchObject({ facts: { tests: { exit_code: 1 } } });
  });

  it("pauses when a revise_required build-code review has no verified resolution", async () => {
    const stage = "verify-code", values = {
      "receipts/tests.json": testsReceipt(stage),
      "reviews/results/review.json": reviewReceipt(stage, "revise_required"),
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    const worker = workerFor(stage, values);
    await expect(officialStageHandler(stage)(worker, { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", quality_review: worker.qualityReviewRef, evidence: "evidence/manifest.json", audit: worker.auditRef } })).rejects.toThrow(/SERIOUS_REVIEW_PAUSE/);
  });

  it("preserves an authenticated unavailable build-code review as a non-gate quality fact", async () => {
    const stage = "verify-code", attemptRef = "reviews/attempts/verify-unavailable/attempt.json";
    const earlierOutputRef = "reviews/attempts/verify-unavailable/providers/fixture-provider.output.json";
    const earlierContent = JSON.stringify({ verdict: "pass", summary: "superseded output", findings: [] });
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
      "receipts/tests.json": testsReceipt(stage),
      [attemptRef]: unavailable,
      [earlierOutputRef]: {
        schema_version: "wh-review-provider-output.v1", task_id: "task", stage: "build-code", attempt_id: "verify-unavailable",
        provider: "fixture-provider", content: earlierContent, content_hash: createHash("sha256").update(earlierContent).digest("hex"),
      },
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
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
      receipts: { tests: "receipts/tests.json", review: attemptRef, quality_review: worker.qualityReviewRef, evidence: "evidence/manifest.json", audit: worker.auditRef },
    });
    expect(result).toMatchObject({
      facts: { review: { status: "unavailable" } },
    });
    expect(result.missing_items.join("\n")).not.toMatch(/review unavailable/i);
    expect(result.completion.system.verification.conclusion).toMatch(/build-code final=unavailable.*verify-code independent=pass/i);
    expect(result.completion.system.verification.conclusion).not.toMatch(/质量审查通过/);
    expect(result.reason).toMatch(/snapshot/i);
    expect(result.reason).not.toMatch(/unavailable|integration review/i);
  });

  it("describes revise_required as a bound quality fact instead of review pass", async () => {
    const stage = "verify-code";
    const finding = {
      severity: "major", path: "fixture", issue: "major quality advice",
      root_cause: "fixture detail", recommendation: "consider cleanup",
      evidence_kind: "direct", evidence: "fixture anchor",
    };
    const providerOutput = { verdict: "revise_required", summary: "minor advice", findings: [finding] };
    const aggregation = aggregateProviderResults([{ provider: "fixture-provider", review: providerOutput }], 1);
    const quality = {
      ...qualityReviewReceipt(),
      provider_results: [{ provider: "fixture-provider", output: providerOutput }],
      verdict: aggregation.verdict,
      findings: aggregation.adjudication.reportFindings.map((item) => ({ provider: item.providers[0], ...item })),
      adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters },
    };
    const values = {
      "receipts/tests.json": testsReceipt(stage),
      "reviews/results/review.json": reviewReceipt(stage),
      "reviews/results/quality.json": quality,
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    const worker = workerFor(stage, values);
    const pause = deriveSeriousReviewPause({
      taskId: "task", stage: "verify-code", reviewRef: "reviews/results/quality.json",
      reviewHash: sha, result: quality, workflowRunId: "fixture:attempt-0001",
    });
    const riskRef = `evidence/risk-acceptances/${"e".repeat(64)}.json`;
    values[riskRef] = buildRiskAcceptance({
      pause,
      findingId: pause.findings[0].finding_id,
      cardRef: "evidence/review-risk-cards/fixture.json",
      cardHash: pause.findings[0].card_hash,
      selectedOption: "accept-risk",
      replyRef: "evidence/review-risk-replies/fixture.json",
      replyHash: "d".repeat(64),
      acceptedAt: "2026-07-19T00:00:02.000Z",
    });
    const result = await officialStageHandler(stage)(worker, {
      receipts: {
        tests: "receipts/tests.json", review: "reviews/results/review.json",
        quality_review: worker.qualityReviewRef, quality_risk_acceptance: riskRef,
        evidence: "evidence/manifest.json", audit: worker.auditRef,
      },
    });
    expect(result.completion.system.verification.conclusion).toMatch(/verify-code independent=revise_required.*认证质量事实/i);
    expect(result.completion.system.verification.conclusion).not.toMatch(/质量审查通过/);
  });

  it("rejects an unavailable attempt when the latest provider output is a sufficient pass", async () => {
    const stage = "verify-code", attemptId = "false-unavailable", attemptRef = `reviews/attempts/${attemptId}/attempt.json`;
    const outputRef = `reviews/attempts/${attemptId}/providers/fixture-provider.output.json`;
    const content = JSON.stringify({ verdict: "pass", summary: "review passed", findings: [] });
    const values = {
      "receipts/tests.json": testsReceipt(stage),
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
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    const worker = workerFor(stage, values);
    await expect(officialStageHandler(stage)(worker, {
      receipts: { tests: "receipts/tests.json", review: attemptRef, quality_review: worker.qualityReviewRef, evidence: "evidence/manifest.json", audit: worker.auditRef },
    })).rejects.toThrow(/claims unavailable.*semantic result/i);
  });

  it("still rejects an unknown formal review verdict as an integrity error", async () => {
    const stage = "verify-code", values = {
      "receipts/tests.json": testsReceipt(stage),
      "reviews/results/review.json": reviewReceipt(stage, "invented"),
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    const worker = workerFor(stage, values);
    await expect(officialStageHandler(stage)(worker, { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", quality_review: worker.qualityReviewRef, evidence: "evidence/manifest.json", audit: worker.auditRef } })).rejects.toThrow(/SCHEMA_VALIDATION_FAILED.*verdict/i);
  });

  it("rejects a review result detached from its attempt/provider evidence chain", async () => {
    const stage = "verify-code", values = {
      "receipts/tests.json": testsReceipt(stage), "reviews/results/review.json": reviewReceipt(stage),
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    const worker = workerFor(stage, values);
    values[values["reviews/results/review.json"].attempt_ref].material_id = "0".repeat(64);
    await expect(officialStageHandler(stage)(worker, { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", quality_review: worker.qualityReviewRef, evidence: "evidence/manifest.json", audit: worker.auditRef } })).rejects.toThrow(/attempt\/result material_id mismatch/i);
  });

  it("rejects a worktree result backed by a Phase review attempt", async () => {
    const stage = "build-code", values = {
      "receipts/implementation.json": canonical(stage, { producer: { stage, component: "implementation", version: "1" }, changed: [], snapshot_head: tree, snapshot_tree: tree, snapshot_commit: tree, diff_ref: "evidence/diff.patch", diff_hash: sha, phase_completion: true }),
      "receipts/tests.json": testsReceipt(stage),
      "reviews/results/review.json": reviewReceipt(stage),
    };
    const worker = workerFor(stage, values);
    const attempt = values[values["reviews/results/review.json"].attempt_ref];
    attempt.subject_kind = "phase";
    attempt.phase_id = "phase-1";
    attempt.review_scope = "phase";
    await expect(officialStageHandler(stage)(worker, { receipts: { implementation: "receipts/implementation.json", tests: "receipts/tests.json", review: "reviews/results/review.json", audit: worker.auditRef } }))
      .rejects.toThrow(/attempt\/result (subject_kind|phase_id) mismatch/i);
  });

  it("rejects an integration result backed by an attempt with a different review scope", async () => {
    const stage = "build-code", values = {
      "receipts/implementation.json": canonical(stage, { producer: { stage, component: "implementation", version: "1" }, changed: [], snapshot_head: tree, snapshot_tree: tree, snapshot_commit: tree, diff_ref: "evidence/diff.patch", diff_hash: sha, phase_completion: true }),
      "receipts/tests.json": testsReceipt(stage),
      "reviews/results/review.json": reviewReceipt(stage),
    };
    const worker = workerFor(stage, values);
    values[values["reviews/results/review.json"].attempt_ref].review_scope = null;
    await expect(officialStageHandler(stage)(worker, { receipts: { implementation: "receipts/implementation.json", tests: "receipts/tests.json", review: "reviews/results/review.json", audit: worker.auditRef } }))
      .rejects.toThrow(/attempt\/result review_scope mismatch/i);
  });

  it("rejects a pass result when the provider's final raw output requires revision", async () => {
    const stage = "verify-code", values = {
      "receipts/tests.json": testsReceipt(stage), "reviews/results/review.json": reviewReceipt(stage),
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    const worker = workerFor(stage, values), attempt = values[values["reviews/results/review.json"].attempt_ref];
    const output = values[attempt.provider_attempts[0].output_ref];
    output.content = JSON.stringify({ verdict: "revise_required", summary: "must revise", findings: [{ severity: "major", path: "src/a.js", issue: "bug", recommendation: "fix it" }] });
    output.content_hash = createHash("sha256").update(output.content).digest("hex");
    await expect(officialStageHandler(stage)(worker, { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", quality_review: worker.qualityReviewRef, evidence: "evidence/manifest.json", audit: worker.auditRef } })).rejects.toThrow(/semantic output mismatch|verdict does not match|OUTPUT_INVALID/i);
  });

  it("rejects build-code receipts bound to different snapshot trees", async () => {
    const stage = "build-code", values = {
      "receipts/implementation.json": canonical(stage, { producer: { stage, component: "implementation", version: "1" }, changed: [], snapshot_head: tree, snapshot_tree: tree, snapshot_commit: tree, diff_ref: "evidence/diff.patch", diff_hash: sha, phase_completion: true }),
      "receipts/tests.json": testsReceipt(stage, "c".repeat(40)),
      "reviews/results/review.json": reviewReceipt(stage),
    };
    const worker = workerFor(stage, values);
    await expect(officialStageHandler(stage)(worker, { receipts: { implementation: "receipts/implementation.json", tests: "receipts/tests.json", review: "reviews/results/review.json", audit: worker.auditRef } })).rejects.toThrow(/same.*snapshot|snapshot.*tree|final current snapshot/i);
  });

  it("rejects a Phase review as the final build-code review", async () => {
    const stage = "build-code", values = {
      "receipts/implementation.json": canonical(stage, { producer: { stage, component: "implementation", version: "1" }, changed: [], snapshot_head: tree, snapshot_tree: tree, snapshot_commit: tree, diff_ref: "evidence/diff.patch", diff_hash: sha, phase_completion: true }),
      "receipts/tests.json": testsReceipt(stage),
      "reviews/results/review.json": reviewReceipt(stage, "pass", tree, "phase"),
    };
    const worker = workerFor(stage, values);
    await expect(officialStageHandler(stage)(worker, { receipts: { implementation: "receipts/implementation.json", tests: "receipts/tests.json", review: "reviews/results/review.json", audit: worker.auditRef }, acceptance_coverage: { snapshot_tree: tree, accepted_criterion_ids: ["AC-1"], items: [{ acceptance_criterion_id: "AC-1", status: "unknown", evidence_refs: [] }] } }))
      .rejects.toThrow(/MATERIAL_INCOMPLETE.*integration review.*build-code/i);
  });

  it("rejects a legacy worktree final review with no integration scope", async () => {
    const stage = "build-code", values = {
      "receipts/implementation.json": canonical(stage, { producer: { stage, component: "implementation", version: "1" }, changed: [], snapshot_head: tree, snapshot_tree: tree, snapshot_commit: tree, diff_ref: "evidence/diff.patch", diff_hash: sha, phase_completion: true }),
      "receipts/tests.json": testsReceipt(stage),
      "reviews/results/review.json": reviewReceipt(stage),
    };
    delete values["reviews/results/review.json"].review_scope;
    const worker = workerFor(stage, values);
    await expect(officialStageHandler(stage)(worker, { receipts: { implementation: "receipts/implementation.json", tests: "receipts/tests.json", review: "reviews/results/review.json", audit: worker.auditRef }, acceptance_coverage: { snapshot_tree: tree, accepted_criterion_ids: ["AC-1"], items: [{ acceptance_criterion_id: "AC-1", status: "unknown", evidence_refs: [] }] } }))
      .rejects.toThrow(/MATERIAL_INCOMPLETE.*integration review.*build-code/i);
  });

  it("records integration scope in accepted final build-code facts", async () => {
    const stage = "build-code";
    const diffEvidence = JSON.stringify({ schema_version: "workflowhub-diff-evidence.v1", baseline_commit: "HEAD", snapshot_tree: tree });
    const diffHash = createHash("sha256").update(diffEvidence).digest("hex");
    const values = {
      "receipts/implementation.json": canonical(stage, { producer: { stage, component: "implementation", version: "1" }, changed: [], snapshot_head: tree, snapshot_tree: tree, snapshot_commit: "HEAD", diff_ref: "evidence/diff.patch", diff_hash: diffHash, phase_completion: true }),
      "receipts/tests.json": testsReceipt(stage),
      "reviews/results/review.json": reviewReceipt(stage),
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
    await expect(officialStageHandler(stage)(worker, { receipts: { implementation: "receipts/implementation.json", tests: "receipts/tests.json", review: "reviews/results/review.json", audit: worker.auditRef }, acceptance_coverage: { snapshot_tree: tree, accepted_criterion_ids: ["AC1"], items: [{ acceptance_criterion_id: "AC1", status: "covered", evidence_refs: [{ ref: "evidence/ac1.json", sha256: sha }] }] } }))
      .resolves.toMatchObject({ facts: { review: { subject_kind: "worktree", phase_id: null, review_scope: "integration" } } });
  });

  it("consumes a canonical pre-dispatch unavailable integration review without inventing provider attempts", async () => {
    const stage = "build-code";
    const attemptRef = "reviews/attempts/material-incomplete/attempt.json";
    const diffEvidence = JSON.stringify({ schema_version: "workflowhub-diff-evidence.v1", baseline_commit: "HEAD", snapshot_tree: tree });
    const diffHash = createHash("sha256").update(diffEvidence).digest("hex");
    const values = {
      "receipts/implementation.json": canonical(stage, { producer: { stage, component: "implementation", version: "1" }, changed: [], snapshot_head: tree, snapshot_tree: tree, snapshot_commit: "HEAD", diff_ref: "evidence/diff.patch", diff_hash: diffHash, phase_completion: true }),
      "receipts/tests.json": testsReceipt(stage),
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
      receipts: { implementation: "receipts/implementation.json", tests: "receipts/tests.json", review: attemptRef, audit: worker.auditRef },
      acceptance_coverage: { snapshot_tree: tree, accepted_criterion_ids: ["AC1"], items: [{ acceptance_criterion_id: "AC1", status: "covered", evidence_refs: [{ ref: "evidence/ac1.json", sha256: sha }] }] },
    })).resolves.toMatchObject({
      facts: { review: { status: "unavailable", error: { code: "MATERIAL_INCOMPLETE" } } },
      missing_items: [expect.stringMatching(/review unavailable: MATERIAL_INCOMPLETE/i)],
    });
  });

  it("rejects an empty-provider unavailable attempt that is not a material preflight fact", async () => {
    const stage = "build-code", attemptRef = "reviews/attempts/false-predispatch/attempt.json";
    const values = {
      "receipts/implementation.json": canonical(stage, { producer: { stage, component: "implementation", version: "1" }, changed: [], snapshot_head: tree, snapshot_tree: tree, snapshot_commit: tree, diff_ref: "evidence/diff.patch", diff_hash: sha, phase_completion: true }),
      "receipts/tests.json": testsReceipt(stage),
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
      receipts: { implementation: "receipts/implementation.json", tests: "receipts/tests.json", review: attemptRef, audit: worker.auditRef },
      acceptance_coverage: { snapshot_tree: tree, accepted_criterion_ids: ["AC1"], items: [] },
    })).rejects.toThrow(/must contain provider attempts/i);
  });

  it("rejects verify-code when the accepted build has legacy review facts without scope", async () => {
    const stage = "verify-code", values = {
      "receipts/tests.json": testsReceipt(stage),
      "reviews/results/review.json": reviewReceipt(stage),
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    const worker = workerFor(stage, values);
    worker.readAcceptedBuildCode = () => ({ facts: { tests: { snapshot_tree: tree }, review: { result_ref: "reviews/results/review.json", result_hash: sha, snapshot_tree: tree } } });
    await expect(officialStageHandler(stage)(worker, { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", quality_review: worker.qualityReviewRef, evidence: "evidence/manifest.json", audit: worker.auditRef } }))
      .resolves.toMatchObject({ verification_failure: true, missing_items: expect.arrayContaining([expect.stringMatching(/accepted build-code lacks.*integration review/i)]) });
  });

  it("rejects verify-code when tests/review no longer match the current tree", async () => {
    const stage = "verify-code", values = {
      "receipts/tests.json": testsReceipt(stage),
      "reviews/results/review.json": reviewReceipt(stage),
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [] }),
    };
    const worker = workerFor(stage, values, "c".repeat(40));
    const result = await officialStageHandler(stage)(worker, { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", quality_review: worker.qualityReviewRef, evidence: "evidence/manifest.json", audit: worker.auditRef } });
    expect(result).toMatchObject({
      verification_failure: true,
      missing_items: expect.arrayContaining([
        expect.stringMatching(/tasks\.md independent completion check failed/i),
        expect.stringMatching(/complete test command/i),
        expect.stringMatching(/acceptance evidence criterion set/i),
        expect.stringMatching(/snapshot/i),
      ]),
    });
    expect(result.missing_items).toHaveLength(5);
  });

  it("consumes the latest verify-code quality review resolution", async () => {
    const stage = "verify-code";
    const previousTree = "c".repeat(40);
    const qualityRef = "reviews/results/quality.json";
    const resolutionRef = `reviews/resolutions/${"d".repeat(64)}.json`;
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
      "receipts/tests.json": testsReceipt(stage),
      "reviews/results/review.json": reviewReceipt(stage),
      [qualityRef]: quality,
      [resolutionRef]: resolution,
      "evidence/proof.txt": "proof",
      "evidence/manifest.json": canonical(stage, {
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
        tests: "receipts/tests.json",
        review: "reviews/results/review.json",
        quality_review: qualityRef,
        quality_review_resolution: resolutionRef,
        evidence: "evidence/manifest.json",
        audit: worker.auditRef,
      },
    })).resolves.toMatchObject({
      evidence_refs: expect.arrayContaining([{ ref: resolutionRef, sha256: sha }]),
    });
  });

  it("rejects acceptance evidence without stable criterion identity and schema", async () => {
    const stage = "verify-code", values = {
      "receipts/tests.json": testsReceipt(stage),
      "reviews/results/review.json": reviewReceipt(stage),
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [{ ref: "evidence/ac.txt", sha256: sha }] }),
      "evidence/ac.txt": { result: "pass", refs: [] },
    };
    const worker = workerFor(stage, values);
    await expect(officialStageHandler(stage)(worker, { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", quality_review: worker.qualityReviewRef, evidence: "evidence/manifest.json", audit: worker.auditRef } })).rejects.toThrow(/acceptance_criterion_id|acceptance.*schema|criterion identity/i);
  });

  it.each([
    ["duplicate criterion id", [{ ref: "evidence/ac-1.json", sha256: sha }, { ref: "evidence/ac-2.json", sha256: sha }], { "evidence/ac-1.json": { schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: "evidence/proof.txt", sha256: sha }] }, "evidence/ac-2.json": { schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: "evidence/proof.txt", sha256: sha }] }, "evidence/proof.txt": "proof" }, /duplicate acceptance_criterion_id/i],
    ["nested evidence hash mismatch", [{ ref: "evidence/ac-1.json", sha256: sha }], { "evidence/ac-1.json": { schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", refs: [{ ref: "evidence/proof.txt", sha256: sha }] }, "evidence/proof.txt": "proof", "evidence/proof.txt:sha256": "0".repeat(64) }, /hash mismatch/i],
  ])("rejects invalid acceptance-evidence.v1: %s", async (_label, refs, entities, error) => {
    const stage = "verify-code", values = {
      "receipts/tests.json": testsReceipt(stage), "reviews/results/review.json": reviewReceipt(stage),
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs }), ...entities,
    };
    const worker = workerFor(stage, values);
    await expect(officialStageHandler(stage)(worker, { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", quality_review: worker.qualityReviewRef, evidence: "evidence/manifest.json", audit: worker.auditRef } })).rejects.toThrow(error);
  });

  it("records a failed acceptance criterion without blocking verification publication", async () => {
    const stage = "verify-code", values = {
      "receipts/tests.json": testsReceipt(stage), "reviews/results/review.json": reviewReceipt(stage),
      "evidence/manifest.json": canonical(stage, { producer: { stage, component: "evidence", version: "1" }, refs: [{ ref: "evidence/ac-1.json", sha256: sha }] }),
      "evidence/ac-1.json": { schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "fail", refs: [{ ref: "evidence/proof.txt", sha256: sha }] },
      "evidence/proof.txt": "proof",
    };
    const worker = workerFor(stage, values);
    await expect(officialStageHandler(stage)(worker, { receipts: { tests: "receipts/tests.json", review: "reviews/results/review.json", quality_review: worker.qualityReviewRef, evidence: "evidence/manifest.json", audit: worker.auditRef } })).resolves.toMatchObject({ facts: { evidence_refs: [{ ref: "evidence/ac-1.json" }] } });
  });

  it("verifies every referenced file exists and matches its declared hash", () => {
    const runner = readFileSync(resolve("core/stage-runner.mjs"), "utf8");
    expect(runner).toMatch(/(?:verify|assert).*Evidence|evidence.*(?:exists|hash)/i);
    expect(runner).toMatch(/output_ref[\s\S]*(?:readRecord|sha256)/i);
  });

  it("uses an epoch-bound quiescing protocol before switching storage roots", () => {
    const source = readFileSync(resolve("scripts/migrate-task-v2.mjs"), "utf8");
    expect(source).toMatch(/assertMigrationAuthority[\s\S]*expectedEpoch:\s*options\.epoch/);
    const authority = readFileSync(resolve("core/runtime-mode.mjs"), "utf8");
    expect(authority).toMatch(/assertMigrationAuthority[\s\S]*quiescing[\s\S]*epoch/i);
  });

  it("keeps checkpoint refs unpublished until a plan-hash-bound confirmation is accepted", () => {
    const checkpoint = readFileSync(resolve("core/git-checkpoint.mjs"), "utf8");
    const kernel = readFileSync(resolve("core/task-kernel-implementation.mjs"), "utf8");
    expect(checkpoint).not.toMatch(/update-ref/);
    expect(kernel).toMatch(/confirmation[^\n]*plan_hash|plan_hash[^\n]*confirmation/i);
    expect(kernel).toMatch(/acceptAttempt[\s\S]*update-ref/);
    expect(kernel).toMatch(/reject[\s\S]*(?:delete-ref|no ref|unpublished)/i);
  });

  it("verifies checkpoint ancestry at acceptance", () => {
    const kernel = readFileSync(resolve("core/task-kernel-implementation.mjs"), "utf8");
    expect(kernel).toMatch(/acceptAttempt[\s\S]*(?:merge-base|isAncestor|ancestry)/i);
  });

  it("does not exempt test directories wholesale and keeps fixture exceptions file-scoped", () => {
    const source = readFileSync(resolve("scripts/check-task-record-paths.mjs"), "utf8");
    expect(source).not.toMatch(/rel\.includes\("\/__tests__\/"\)|\(\?:\^\|\\\/\)tests\?\\\//);
    expect(source).toMatch(/FIXTURE_ALLOWLIST/);
  });

  it("allows specs task-path construction only inside ArtifactDir", () => {
    const source = readFileSync(resolve("scripts/check-task-record-paths.mjs"), "utf8");
    expect(source).toMatch(/specs[\s\S]+ArtifactDir product authority/);
    expect(source).toMatch(/literal specs path derivation is only legal in core\/artifact-dir\.mjs/);
  });
});
