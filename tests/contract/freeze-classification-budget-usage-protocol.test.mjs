import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { aggregateCanonicalProviderResults } from "../../runtime/review/canonical-review-result.mjs";
import { validateReportableFindingDispositions } from "../../runtime/review/stage-review-disposition.mjs";
import { officialStageHandler } from "../../runtime/stage/stage-handlers.mjs";
import { separateAttemptFindingFacts, validateFindingDispositionState } from "../../runtime/stage/completion-predicates.mjs";
import { deriveContextProxyMetrics, validateReviewAttemptObservation, validateReviewBudget } from "../../runtime/evidence/stage-content-evidence.mjs";
import {
  classifyFinding,
  deriveGapId,
  normalizeGapReasons,
  validateDecisionFreeze,
  validateFallbackProtocol,
  validateFindingRouting,
} from "../../runtime/stage/stage-content-contracts.mjs";

const current = Object.freeze({ material_revision: "revision-current", snapshot_tree: "tree-current" });
const hash = (value) => createHash("sha256").update(value).digest("hex");
const boundAttempt = (kind, suffix, extra = {}) => ({
  kind,
  material_revision: "rev-1",
  status: "executed",
  attempt_id: `attempt-${suffix}`,
  attempt_ref: `quality/reviews/attempts/attempt-${suffix}/attempt.json`,
  attempt_hash: "a".repeat(64),
  ...extra,
});

function frozenDecision(overrides = {}) {
  return {
    approval_binding: {
      status: "accepted",
      material_revision: current.material_revision,
      snapshot_tree: current.snapshot_tree,
      decision_id: "D-501",
    },
    final_confirmation: {
      status: "accepted",
      material_revision: current.material_revision,
      snapshot_tree: current.snapshot_tree,
    },
    step_11: {
      status: "accepted",
      material_revision: current.material_revision,
      snapshot_tree: current.snapshot_tree,
    },
    unresolved_direction_questions: [],
    freeze_packet: {
      coverage: ["user_flow", "data_states", "success_failure_boundaries", "non_goals"],
    },
    ...overrides,
  };
}

function buildSpecRoutingFixture({ gap, fallback_protocol } = {}) {
  const taskId = "handler-routing-task";
  const tree = "a".repeat(40);
  const materialId = "b".repeat(64);
  const attemptId = "routing-attempt";
  const resultRef = "quality/reviews/results/routing-result.json";
  const attemptRef = `quality/reviews/attempts/${attemptId}/attempt.json`;
  const outputRef = `quality/reviews/attempts/${attemptId}/providers/p-fixture.output.json`;
  const provider = "fixture-provider";
  const providerReview = {
    findings: [{
      severity: "major",
      path: "runtime/example.mjs",
      issue: "fixture implementation finding",
      root_cause: "fixture root cause",
      recommendation: "fixture recommendation",
      evidence_kind: "direct",
      evidence: "fixture evidence",
    }],
  };
  const aggregation = aggregateCanonicalProviderResults([{ provider, review: providerReview }], 1);
  const result = {
    version: "wh-review-result.v1",
    task_id: taskId,
    stage: "build-spec",
    review_track: null,
    source: { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree },
    snapshot_tree: tree,
    subject_kind: "worktree",
    phase_id: null,
    review_scope: null,
    base_tree: tree,
    candidate_tree: tree,
    material_id: materialId,
    attempt_ref: attemptRef,
    provider_results: [{ provider, output: providerReview }],
    findings: aggregation.findings.map((finding) => ({ provider: finding.providers[0], ...finding })),
    adjudication: { version: aggregation.adjudication.version, clusters: aggregation.adjudication.clusters },
  };
  const attempt = {
    version: "wh-review-attempt.v1",
    attempt_id: attemptId,
    task_id: taskId,
    stage: "build-spec",
    review_track: null,
    source: { target_commit: tree, base_commit: tree, base_tree: tree, captured_head: tree },
    snapshot_tree: tree,
    material_id: materialId,
    subject_kind: "worktree",
    phase_id: null,
    review_scope: null,
    base_tree: tree,
    candidate_tree: tree,
    provider_attempts: [{ provider, status: "completed", session_id: "fixture-session", runtime_id: "fixture-runtime", output_ref: outputRef, error: null }],
    terminal_status: "semantic",
    error: null,
  };
  const outputContent = JSON.stringify(providerReview);
  const values = new Map([
    [resultRef, { value: result, sha256: hash(JSON.stringify(result)) }],
    [attemptRef, { value: attempt, sha256: hash(JSON.stringify(attempt)) }],
    [outputRef, { value: {
      schema_version: "wh-review-provider-output.v1",
      task_id: taskId,
      stage: "build-spec",
      attempt_id: attemptId,
      provider,
      content: outputContent,
      content_hash: hash(outputContent),
      evidence_anchor_valid: [true],
    }, sha256: "c".repeat(64) }],
  ]);
  const spec = "# Spec\n";
  const decisionLog = `## UI applicability\n\n\`\`\`json\n${JSON.stringify({
    result: "non_ui",
    sources: {
      raw_requirement: "backend contract",
      project_inventory: "no page consumer",
      planned_or_changed_frontend_fact: "no frontend change",
    },
  })}\n\`\`\`\n`;
  const findingId = result.findings[0].id;
  const disposition = {
    finding_id: findingId,
    original_fact: "fixture finding",
    source: "wh-review",
    consequence: "fixture consequence",
    status: "fixed",
    next_action: "continue current stage",
    evidence_ref: resultRef,
    owner: "runtime/stage",
    consumer: "build-spec completion",
    retain_or_delete: "retain",
    classification: "implementation_defect",
    kind: "implementation_defect",
    impact_dimensions: ["runtime"],
    evidence_refs: [resultRef],
    ...(gap === undefined ? {} : { gap }),
  };
  return {
    result,
    worker: {
      stage: "build-spec",
      identity: { taskId },
      manifest: { record_model: "vnext-single-write" },
      currentMaterialRevision: current.material_revision,
      readArtifact: (name) => name === "spec.md" ? spec : decisionLog,
      artifactRef: (name) => `specs/${taskId}/${name}`,
      snapshotWorkspace: () => ({ tree }),
      readReceipt: (ref) => values.get(ref),
    },
    input: {
      receipts: { review: resultRef },
      finding_dispositions: [disposition],
      ...(fallback_protocol ? { fallback_protocol } : {}),
    },
  };
}

describe("Phase 1 freeze and classification contracts", () => {
  it("rejects non-unique approval, stale material binding, and open direction work", () => {
    expect(validateDecisionFreeze({ decisionLog: frozenDecision({ approval_binding: { status: "pending" } }), ...current })).toMatchObject({
      ok: false,
      status: "paused",
    });
    expect(validateDecisionFreeze({ decisionLog: frozenDecision({ approval_binding: { status: "accepted", material_revision: "old", snapshot_tree: current.snapshot_tree } }), ...current })).toMatchObject({
      ok: false,
      status: "paused",
    });
    expect(validateDecisionFreeze({ decisionLog: frozenDecision({ unresolved_direction_questions: ["one open decision"] }), ...current })).toMatchObject({
      ok: false,
      status: "paused",
    });
  });

  it("accepts a current three-way freeze and a valid incremental renewal without requiring historical re-confirmation", () => {
    const result = validateDecisionFreeze({
      decisionLog: frozenDecision({
        incremental_renewals: [{
          status: "accepted",
          decision_id: "D-502",
          reply_ref: "quality/confirmations/reply.json",
          material_revision: current.material_revision,
          snapshot_tree: current.snapshot_tree,
        }],
      }),
      ...current,
    });
    expect(result).toMatchObject({ ok: true, status: "passed", material_revision: current.material_revision, snapshot_tree: current.snapshot_tree });
  });

  it("rejects an incremental renewal without a user reply receipt", () => {
    expect(validateDecisionFreeze({
      decisionLog: frozenDecision({
        incremental_renewals: [{ status: "accepted", decision_id: "D-502", material_revision: current.material_revision, snapshot_tree: current.snapshot_tree }],
      }),
      ...current,
    })).toMatchObject({ ok: false, status: "paused" });
  });

  it("parses only explicit accepted status from a decision-log section and rejects missing bindings", () => {
    const markdown = `### M6\n- approval_binding 已 accepted\n- decision: freeze packet covers 用户流程/数据状态/成败边界/非目标\n\n## 最终确认\n- 状态：**accepted**\n\n## step 11-v4 approve-decision\n- confirmation receipt accepted`;
    expect(validateDecisionFreeze({ decisionLog: markdown, ...current })).toMatchObject({ ok: false, status: "paused" });
    expect(validateDecisionFreeze({ decisionLog: `### M6\n- approval_binding 已 accepted\n- decision_id: D-501\n- material_revision: ${current.material_revision}\n- snapshot_tree: ${current.snapshot_tree}\n- decision: freeze packet covers 用户流程/数据状态/成败边界/非目标\n\n## 最终确认\n- 状态：**accepted**\n- material_revision: ${current.material_revision}\n- snapshot_tree: ${current.snapshot_tree}\n\n## step 11-v4 approve-decision\n- status: accepted\n- material_revision: ${current.material_revision}\n- snapshot_tree: ${current.snapshot_tree}`, ...current })).toMatchObject({ ok: true, status: "passed", decision_id: "D-501" });
    expect(validateDecisionFreeze({ decisionLog: `### M6\n- approval_binding 已 accepted\n- decision_id: D-501\n- material_revision: ${current.material_revision}\n- snapshot_tree: ${current.snapshot_tree}\n- decision: freeze packet covers 用户流程/数据状态/成败边界/非目标\n\n## 最终确认\n- 状态：**accepted**\n- material_revision: ${current.material_revision}\n- snapshot_tree: ${current.snapshot_tree}\n\n## step 11-v4 approve-decision\n- status: not accepted\n- material_revision: ${current.material_revision}\n- snapshot_tree: ${current.snapshot_tree}`, ...current })).toMatchObject({ ok: false, status: "paused" });
    expect(validateDecisionFreeze({ decisionLog: `### M6\n- approval_binding 已 accepted\n- decision_id: D-501\n- material_revision: ${current.material_revision}\n- snapshot_tree: ${current.snapshot_tree}\n- decision: freeze packet covers 用户流程/数据状态/成败边界/非目标\n\n## 最终确认\n- 状态：**accepted**\n- material_revision: ${current.material_revision}\n- snapshot_tree: ${current.snapshot_tree}\n\n## step 11-v4 approve-decision\n- status: accepted\n- material_revision: ${current.material_revision}\n- snapshot_tree: ${current.snapshot_tree}`, ...current })).toMatchObject({ ok: true, status: "passed", decision_id: "D-501" });
  });

  it("classifies findings by evidence-backed dimensions and rejects route mismatches", () => {
    const finding = { finding_id: "f-1", kind: "spec_ambiguity", impact_dimensions: ["acceptance_boundary"], evidence_refs: ["quality/reviews/result.json"] };
    expect(classifyFinding(finding)).toMatchObject({ classification: "spec_ambiguity" });
    expect(validateFindingRouting({ finding, classification: "spec_ambiguity", disposition: { status: "fixed" } })).toMatchObject({ ok: false });
    expect(validateFindingRouting({ finding, classification: "spec_ambiguity", disposition: { status: "user_decided", reply_ref: "quality/confirmations/reply.json" } })).toMatchObject({ ok: true });
  });

  it("does not allow direction-level findings to be marked fixed and keeps gap ids deterministic", () => {
    const finding = { finding_id: "f-2", kind: "implementation_defect", impact_dimensions: ["direction_change"], evidence_refs: ["quality/reviews/result.json"] };
    expect(classifyFinding(finding)).toMatchObject({ classification: "direction_change" });
    expect(validateFindingRouting({ finding, classification: "direction_change", disposition: { status: "fixed" } })).toMatchObject({ ok: false });

    const first = deriveGapId({ task_id: "task-1", material_revision: "revision-1", gap_kind: "review", content: "  same   gap  " });
    const second = deriveGapId({ task_id: "task-1", material_revision: "revision-1", gap_kind: "review", content: "same gap" });
    expect(first.gap_id).toBe(second.gap_id);
    expect(normalizeGapReasons(["z", "a", "z"])).toEqual(["a", "z"]);
  });

  it("rejects empty evidence and empty route references", () => {
    expect(classifyFinding({ kind: "implementation_defect", impact_dimensions: ["runtime"], evidence_refs: [""] })).toMatchObject({ classification: "invalid_finding", status: "incomplete" });
    const finding = { finding_id: "f-3", kind: "spec_ambiguity", impact_dimensions: ["acceptance_boundary"], evidence_refs: ["quality/reviews/result.json"] };
    expect(validateFindingRouting({ finding, classification: "spec_ambiguity", disposition: { status: "user_decided", reply_ref: "" } })).toMatchObject({ ok: false });
  });

  it("gives invalid evidence precedence and rejects invalid gap identities", () => {
    expect(classifyFinding({ kind: "implementation_defect", impact_dimensions: ["runtime"], evidence_status: "invalid_anchor", evidence_refs: ["quality/reviews/result.json"] })).toMatchObject({ classification: "invalid_finding", status: "classified" });
    const finding = { kind: "implementation_defect", impact_dimensions: ["runtime"], evidence_refs: ["quality/reviews/result.json"] };
    expect(validateFindingRouting({ finding, classification: "implementation_defect", disposition: { status: "fixed" } })).toMatchObject({ ok: true });
    expect(deriveGapId({ task_id: "task-1", material_revision: "", gap_kind: "review", content: "gap" })).toMatchObject({ ok: false, reason: "invalid_gap_identity" });
  });

  it("publishes handler routing facts and blocks an invalid gap identity", async () => {
    const recorded = buildSpecRoutingFixture();
    const recordedResult = await officialStageHandler("build-spec")(recorded.worker, recorded.input);
    expect(recordedResult.facts.finding_dispositions.routing).toMatchObject({ status: "recorded", items: [{ status: "recorded", classification: "implementation_defect" }] });

    const incomplete = buildSpecRoutingFixture({ gap: { task_id: "handler-routing-task", gap_kind: "review", content: "missing material revision" } });
    const incompleteResult = await officialStageHandler("build-spec")(incomplete.worker, incomplete.input);
    expect(incompleteResult.facts.finding_dispositions.routing).toMatchObject({ status: "incomplete", items: [{ status: "incomplete", gap: { ok: false, reason: "invalid_gap_identity" } }] });
    expect(incompleteResult.missing_items.join("; ")).toContain("invalid_gap_identity");
  });
});

describe("Phase 2 needs_human and attempt separation contracts", () => {
  it("keeps needs_human paused and requires a next action", () => {
    expect(validateFindingDispositionState({ status: "needs_human", finding_id: "F-1" })).toMatchObject({ ok: false, status: "incomplete" });
    expect(validateFindingDispositionState({ status: "needs_human", next_action: "ask_user", finding_id: "F-1" })).toMatchObject({ ok: true, status: "paused" });
    expect(validateFindingDispositionState({ status: "needs_human", next_action: "ask_user", completion_status: "completed", finding_id: "F-1" })).toMatchObject({ ok: false, status: "incomplete" });
  });

  it("allows only bound terminal routes and keeps unavailable attempts out of findings", () => {
    expect(validateFindingDispositionState({ status: "accepted_risk", finding_id: "F-1" })).toMatchObject({ ok: false, status: "incomplete" });
    expect(validateFindingDispositionState({ status: "accepted_risk", finding_id: "F-1", risk_acceptance_ref: "quality/evidence/risk-acceptances/r.json", risk_ref: "quality/evidence/gaps/g.json" }, { authorizedRiskFindingIds: ["F-1"] })).toMatchObject({ ok: true, status: "terminal" });
    expect(validateFindingDispositionState({ status: "user_decided", finding_id: "F-1", card_hash: "a".repeat(64), reply_ref: "quality/confirmations/r.json" })).toMatchObject({ ok: true, status: "terminal" });
    expect(separateAttemptFindingFacts({ attempt_status: "unavailable", findings: [{ id: "F-1" }] })).toMatchObject({ attempt: { status: "unavailable" }, findings: [], errors: expect.arrayContaining(["attempt_unavailable_does_not_create_findings"]) });
    expect(separateAttemptFindingFacts({ attempt_status: "executed", findings: [{ id: "F-1" }] })).toMatchObject({ attempt: { status: "executed" }, findings: [{ id: "F-1" }], errors: [] });
  });

  it("keeps the finding card hash separate from the user reply hash", () => {
    const cardHash = "a".repeat(64);
    const replyHash = "b".repeat(64);
    const disposition = {
      finding_id: "F-card",
      original_fact: "authenticated finding",
      source: "wh-review",
      consequence: "must pause",
      status: "needs_human",
      next_action: "ask_user",
      evidence_ref: "quality/reviews/results/current.json",
      owner: "runtime/stage",
      consumer: "stage completion",
      retain_or_delete: "retain",
      card_hash: cardHash,
    };
    expect(validateReportableFindingDispositions({
      result: { findings: [{ id: "F-card" }] },
      dispositions: [disposition],
      userReply: { finding_id: "F-card", reply_ref: "quality/confirmations/reply.json", reply_hash: replyHash },
    })).toMatchObject({
      facts: { items: [{ status: "user_decided", card_hash: cardHash, reply_ref: "quality/confirmations/reply.json" }] },
      reply_bindings: [{ finding_id: "F-card", reply_hash: replyHash }],
    });
  });
});

describe("Phase 3 budget and usage observation contracts", () => {
  it("T009 rejects an unchanged initial review and keeps the phase budget separate", () => {
    const attempts = [boundAttempt("initial", "initial")];
    expect(validateReviewBudget({ material_revision: "rev-1", attempts, request: { kind: "initial", changed: false } })).toMatchObject({
      ok: false,
      status: "incomplete",
      reason: "budget_exceeded",
      attempt_created: false,
    });
    expect(validateReviewBudget({ material_revision: "rev-1", attempts, request: { kind: "phase", phase_id: "P3", changed: false } })).toMatchObject({
      ok: true,
      status: "ready",
      budget_scope: "phase",
    });
  });

  it("T010 allows one focused review after a real material change and one narrow diff reconciliation", () => {
    const attempts = [
      boundAttempt("initial", "initial"),
      boundAttempt("focused", "focused", { changed: true }),
    ];
    expect(validateReviewBudget({
      material_revision: "rev-1",
      attempts,
      request: { kind: "narrow_diff", changed: true, changed_paths: ["runtime/stage/example.mjs"], allowed_paths: ["runtime/stage/example.mjs"] },
    })).toMatchObject({ ok: true, status: "ready", route: "narrow_diff_reconciled" });
    expect(validateReviewBudget({
      material_revision: "rev-1",
      attempts: [...attempts, boundAttempt("narrow_diff", "narrow")],
      request: { kind: "narrow_diff", changed: true, changed_paths: ["runtime/stage/example.mjs"], allowed_paths: ["runtime/stage/example.mjs"] },
    })).toMatchObject({ ok: false, reason: "budget_exceeded" });
  });

  it("rejects review budget entries that are not bound to canonical attempt records", () => {
    expect(validateReviewBudget({
      material_revision: "rev-1",
      attempts: [{ kind: "initial", material_revision: "rev-1", status: "executed" }],
      request: { kind: "initial" },
    })).toMatchObject({ ok: false, reason: "budget_input_invalid", errors: expect.arrayContaining(["attempt_1_id_missing", "attempt_1_ref_invalid", "attempt_1_hash_invalid"]) });
    const currentAttempt = boundAttempt("initial", "canonical");
    expect(validateReviewBudget({
      material_revision: "rev-1",
      attempts: [],
      canonical_attempts: [currentAttempt],
      request: { kind: "initial" },
    })).toMatchObject({ ok: false, reason: "budget_input_invalid", errors: expect.arrayContaining(["attempt_history_incomplete"]) });
  });

  it("T011 records missing provider usage as unavailable and never as zero", () => {
    const observation = validateReviewAttemptObservation({
      attempt: {
        material_revision: "rev-1",
        status: "executed",
        provider_attempts: [{ provider: "fixture", status: "completed", execution: { usage: null, timing: { started_at_ms: null, completed_at_ms: null, duration_ms: null } } }],
      },
      proxy_metrics: { full_reread_count: 1, subagent_input_bytes: 10, review_material_bytes: 20 },
    });
    expect(observation).toMatchObject({ status: "incomplete", usage: [{ provider: "fixture", status: "unavailable", reason: "usage_missing" }] });
    expect(observation.usage[0]).not.toHaveProperty("tokens", 0);
  });

  it("T012 derives the three character proxy metrics and preserves their bindings", () => {
    expect(deriveContextProxyMetrics({
      packet_events: [{ packet_ref: "packet-1", packet_hash: "a".repeat(64), material_revision: "rev-1", snapshot_tree: "b".repeat(40), packet_injected_chars: 120 }],
      full_reread_events: [{ material_name: "spec", material_revision: "rev-1", snapshot_tree: "b".repeat(40), read_chars: 30 }],
      subagent_input_bytes: 80,
      review_material_bytes: 200,
      baseline_chars: 500,
    })).toMatchObject({
      status: "recorded",
      packet_injected_chars: 120,
      full_reread_count: 1,
      current_chars: 150,
      subagent_input_bytes: 80,
      review_material_bytes: 200,
      conclusion: "observed_lower",
    });
    expect(deriveContextProxyMetrics({
      packet_events: [{ material_revision: "old-revision", snapshot_tree: "b".repeat(40), packet_injected_chars: 1 }],
      full_reread_events: [],
      subagent_input_bytes: 1,
      review_material_bytes: 1,
      baseline_chars: 2,
      expected_material_revision: "rev-1",
      expected_snapshot_tree: "b".repeat(40),
    })).toMatchObject({ status: "incomplete", errors: expect.arrayContaining(["packet[0]_material_revision_mismatch"]) });
  });
});

describe("Phase 4 unified fallback protocol [P4]", () => {
  const finding = (classification) => ({
    finding_id: `F-${classification}`,
    classification,
    evidence_refs: ["quality/reviews/results/current.json"],
  });

  it("T013 maps all five routes to an owner and keeps completion incomplete without a full-stage rerun", () => {
    const cases = [
      ["implementation_defect", "build-code", "repair_current_stage"],
      ["spec_ambiguity", "build-spec", "clarify_once"],
      ["direction_change", "make-decision", "incremental_decision"],
      ["material_gap", "build-plan", "repair_material_owner"],
      ["environment_unavailable", "build-code", "record_attempt_unavailable"],
    ];
    for (const [classification, owner_stage, next_action] of cases) {
      expect(validateFallbackProtocol({
        stage: "build-code",
        finding: finding(classification),
        route: { classification, owner_stage, next_action, rerun_scope: "same_task_local", continuation_allowed: true },
        completion: { status: "incomplete" },
      })).toMatchObject({ ok: true, status: "incomplete", route: { owner_stage, next_action, continuation_allowed: true, rerun_scope: "same_task_local" } });
    }
  });

  it("T013 rejects a wrong owner or full-stage rerun while preserving the repair path", () => {
    expect(validateFallbackProtocol({
      stage: "build-spec",
      finding: finding("direction_change"),
      route: { classification: "direction_change", owner_stage: "build-spec", next_action: "mark_fixed", rerun_scope: "full_stage", continuation_allowed: false },
      completion: { status: "completed" },
    })).toMatchObject({ ok: false, status: "incomplete", reason: "fallback_mismatch", continuation_allowed: true });
  });

  it("T014 keeps a handler completion incomplete when the supplied fallback route is wrong", async () => {
    const fixture = buildSpecRoutingFixture({
      fallback_protocol: {
        finding: { classification: "direction_change" },
        route: { classification: "direction_change", owner_stage: "build-spec", next_action: "mark_fixed", rerun_scope: "full_stage", continuation_allowed: false },
        completion: { status: "completed" },
      },
    });
    const result = await officialStageHandler("build-spec")(fixture.worker, fixture.input);
    expect(result.facts.fallback_protocol).toMatchObject({ status: "incomplete", reason: "fallback_mismatch", continuation_allowed: true });
    expect(result.missing_items.join("; ")).toMatch(/fallback protocol is incomplete/i);
    expect(result.completion.facts.result).toBe("completed_with_open_items");
    expect(result.completion.facts.risks.join("; ")).toMatch(/fallback protocol is incomplete/i);
  });

  it("keeps an otherwise valid active fallback incomplete until its continuation is consumed", async () => {
    const fixture = buildSpecRoutingFixture({
      fallback_protocol: {
        finding: { classification: "spec_ambiguity" },
        route: { classification: "spec_ambiguity", owner_stage: "build-spec", next_action: "clarify_once", rerun_scope: "same_task_local", continuation_allowed: true },
        completion: { status: "incomplete" },
      },
    });
    const result = await officialStageHandler("build-spec")(fixture.worker, fixture.input);
    expect(result.facts.fallback_protocol).toMatchObject({ status: "incomplete", ok: true });
    expect(result.missing_items.join("; ")).toMatch(/fallback protocol remains incomplete/i);
  });
});


describe("T001 explicit current-material ownership", () => {
  it.each([
    ["decision-log.md", "make-decision"],
    ["spec.md", "build-spec"],
    ["plan.md", "build-plan"],
    ["tasks.md", "build-plan"],
  ])("routes a declared %s gap only to %s", (target_artifact, owner_stage) => {
    const input = {
      stage: "build-code",
      finding: { classification: "material_gap", target_artifact },
      route: { classification: "material_gap", owner_stage, next_action: "repair_material_owner", rerun_scope: "same_task_local", continuation_allowed: true },
      completion: { status: "incomplete" },
    };
    expect(validateFallbackProtocol(input).ok).toBe(true);
    input.route.owner_stage = "build-code";
    expect(validateFallbackProtocol(input).ok,
      "T001: an explicit authored material gap cannot be reassigned to the executor").toBe(false);
  });
});


describe("P1 review explicit material ownership", () => {
  it.each(["unknown.md", "", 42])("rejects an explicit unrecognized target %s instead of assigning it to the executor", (target_artifact) => {
    expect(validateFallbackProtocol({
      stage: "build-code", finding: { classification: "material_gap", target_artifact },
      route: { classification: "material_gap", owner_stage: "build-code", next_action: "repair_material_owner", rerun_scope: "same_task_local", continuation_allowed: true },
      completion: { status: "incomplete" },
    }).ok).toBe(false);
  });
});
