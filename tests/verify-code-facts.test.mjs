import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { readCommand, assembleVerifyAttempt } from "../workflows/verify-code/facts-assembly.mjs";
import { createTaskProjection } from "../workflows/verify-code/design-alignment.mjs";
import * as qualityStore from "../runtime/evidence/quality-store.mjs";
import { validateVerifyLeaves } from "../runtime/evidence/quality-store.mjs";
import { buildDirectionReviewInput, partitionVerifyReviewConclusions, readPhaseReviewResultRef } from "../runtime/stage/stage-handlers.mjs";
import { createTask } from "../runtime/task/task-handle.mjs";
import { initializeTaskStore } from "../runtime/task/task-store.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("verify-code accepted-input and append-only attempt facts", () => {
  it("reads the fresh command only from the accepted build-code attempt facts", () => {
    expect(readCommand({ facts: { tests: { command: "npm test" } } })).toBe("npm test");
    expect(() => readCommand({ facts: { tests: {} } })).toThrow(/command/i);
  });

  it("assembles an identity-bound verify-code attempt, not a mutable stage-result", () => {
    const attempt = assembleVerifyAttempt({
      taskId: "demo-task",
      createdAt: "2026-07-16T00:00:00.000Z",
      facts: { tests: { command: "npm test", exit_code: 0 } },
      evidenceRefs: ["evidence/verify/test.json"],
      missingItems: [],
      reason: "fresh verification recorded",
    });
    expect(attempt).toMatchObject({
      task_id: "demo-task",
      stage: "verify-code",
      facts: { tests: { command: "npm test", exit_code: 0 } },
      missing_items: [],
    });
    expect(attempt).not.toHaveProperty("user_decision");
    expect(attempt).not.toHaveProperty("status", "pass");
  });

  it("rejects absolute, traversal, and specs evidence references", () => {
    const base = { taskId: "demo-task", createdAt: "2026-07-16T00:00:00.000Z", facts: {}, missingItems: [] };
    for (const evidenceRef of ["/tmp/x", "../x", "specs/demo/x"]) {
      expect(() => assembleVerifyAttempt({ ...base, evidenceRefs: [evidenceRef] }))
        .toThrow(/evidence|relative|traversal|specs/i);
    }
  });

  it("requires the task projection to use accepted versioned reference bindings", () => {
    const ref = {
      artifact_kind: "spec",
      ref: "specs/demo/spec.md",
      hash: "a".repeat(64),
      id: "AC-15",
    };
    const result = createTaskProjection({
      task: { id: "T008", versioned_refs: [ref] },
      selectedRefs: [ref],
      acceptedRefs: [ref],
    });

    expect(result).toMatchObject({ status: "ready", selected_refs: [ref] });
  });

  it("accepts one source-bound verify leaf per AC and rejects duplicate or incomplete leaves", () => {
    const sourceDigest = "b".repeat(64);
    const leaf = {
      acceptance_criterion_id: "AC-15", result: "pass", source_digest: sourceDigest,
      acceptance_leaf: { ref: "evidence/ac-15.json", sha256: "c".repeat(64) },
      nested_evidence: [{ ref: "quality/tests/ac-15-test.json", sha256: "d".repeat(64) }],
      scenario: "保存后读取", oracle: "值一致", actual_outcome: "值一致",
      evidence_type: "structured_observation", coverage_limits: ["未覆盖断电"], exceptions: ["无"],
      implementation_anchor: { id: "impl-ac-15", path: "src/save.mjs", start_line: 1, end_line: 2, role: "implementation" },
      verification_anchor: { id: "test-ac-15", path: "tests/save.test.mjs", start_line: 1, end_line: 2, role: "verification" },
    };
    expect(validateVerifyLeaves([leaf], { sourceDigest })).toMatchObject([{ status: "passed", acceptance_criterion_id: "AC-15" }]);
    expect(() => validateVerifyLeaves([leaf, leaf], { sourceDigest })).toThrow(/incomplete or duplicated/i);
    expect(() => validateVerifyLeaves([{ ...leaf, source_digest: "e".repeat(64) }], { sourceDigest })).toThrow(/incomplete or duplicated/i);
  });

  it("does not publish a second verify summary object", () => {
    expect(qualityStore.publishVerifySummary).toBeUndefined();
  });

  it("downgrades a pass claim without implementation and test anchors", () => {
    const sourceDigest = "b".repeat(64);
    const leaf = {
      acceptance_criterion_id: "AC-15", result: "pass", source_digest: sourceDigest,
      acceptance_leaf: { ref: "evidence/ac-15.json", sha256: "c".repeat(64) },
      nested_evidence: [{ ref: "evidence/ac-15-test.json", sha256: "d".repeat(64) }],
      scenario: "保存后读取", oracle: "值一致", actual_outcome: "值一致", evidence_type: "structured_observation",
      coverage_limits: ["未覆盖断电"], exceptions: ["无"],
    };
    expect(validateVerifyLeaves([leaf], { sourceDigest })[0].status).toBe("incomplete");
  });

  it("downgrades wrong anchor roles and overlapping physical proof ranges", () => {
    const sourceDigest = "b".repeat(64);
    const base = {
      result: "pass", source_digest: sourceDigest,
      acceptance_leaf: { ref: "evidence/ac.json", sha256: "c".repeat(64) },
      nested_evidence: [{ ref: "evidence/test.json", sha256: "d".repeat(64) }],
      scenario: "执行用户流程", oracle: "得到预期结果", actual_outcome: "得到预期结果",
      evidence_type: "structured_observation", coverage_limits: ["未覆盖异常网络"], exceptions: ["无"],
      implementation_anchor: { id: "impl", path: "src/feature.mjs", start_line: 10, end_line: 20, role: "implementation" },
      verification_anchor: { id: "test", path: "tests/feature.test.mjs", start_line: 10, end_line: 20, role: "verification" },
    };
    const wrongRole = validateVerifyLeaves([{
      ...base, acceptance_criterion_id: "AC-WRONG", implementation_anchor: { ...base.implementation_anchor, role: "verification" },
    }], { sourceDigest });
    expect(wrongRole[0].status).toBe("incomplete");
    const overlapping = validateVerifyLeaves([
      { ...base, acceptance_criterion_id: "AC-1" },
      {
        ...base,
        acceptance_criterion_id: "AC-2",
        acceptance_leaf: { ref: "evidence/ac-2.json", sha256: "e".repeat(64) },
        nested_evidence: [{ ref: "evidence/test-2.json", sha256: "f".repeat(64) }],
        implementation_anchor: { ...base.implementation_anchor, id: "impl-2", start_line: 18, end_line: 25 },
      },
    ], { sourceDigest });
    expect(overlapping.map((item) => item.status)).toEqual(["incomplete", "incomplete"]);
    expect(validateVerifyLeaves(overlapping, { sourceDigest }).map((item) => item.status)).toEqual(["incomplete", "incomplete"]);
  });

  it("downgrades criterion claims that reuse generic semantics or nested proof", () => {
    const sourceDigest = "b".repeat(64);
    const base = {
      result: "pass", source_digest: sourceDigest,
      acceptance_leaf: { ref: "evidence/ac.json", sha256: "c".repeat(64) },
      nested_evidence: [{ ref: "quality/tests/shared.json", sha256: "d".repeat(64) }],
      scenario: "执行当前验收流程", oracle: "结果符合预期", actual_outcome: "测试通过",
      evidence_type: "structured_observation", coverage_limits: ["未覆盖外部宿主"], exceptions: ["无"],
      implementation_anchor: { id: "impl-1", path: "src/feature.mjs", start_line: 10, end_line: 12, role: "implementation" },
      verification_anchor: { id: "test-1", path: "tests/feature.test.mjs", start_line: 10, end_line: 12, role: "verification" },
    };
    const output = validateVerifyLeaves([
      { ...base, acceptance_criterion_id: "AC-1" },
      {
        ...base,
        acceptance_criterion_id: "AC-2",
        acceptance_leaf: { ref: "evidence/ac-2.json", sha256: "e".repeat(64) },
        implementation_anchor: { ...base.implementation_anchor, id: "impl-2", start_line: 20, end_line: 22 },
        verification_anchor: { ...base.verification_anchor, id: "test-2", start_line: 20, end_line: 22 },
      },
    ], { sourceDigest });
    expect(output.map((item) => item.status)).toEqual(["incomplete", "incomplete"]);
    expect(output.every((item) => item.exceptions.some((reason) => /generic semantics|nested evidence/i.test(reason)))).toBe(true);
  });

  it("reads an existing build-code Phase review ref without mixing it with verify-code review facts", () => {
    const resultRef = "quality/reviews/results/build-code-phase.json";
    const resultHash = "a".repeat(64);
    const worker = {
      readReceipt: (ref) => ref === resultRef
        ? { sha256: resultHash, value: { stage: "build-code", subject_kind: "phase", review_scope: "phase", phase_id: "C4" } }
        : null,
    };
    const phase = readPhaseReviewResultRef(worker, { receipts: { review: resultRef } });
    expect(phase).toEqual({
      source: "build-code-phase-review",
      result_ref: resultRef,
      result_hash: resultHash,
      subject_kind: "phase",
      phase_id: "C4",
      review_scope: "phase",
    });
    expect(partitionVerifyReviewConclusions({
      phaseReview: { facts: { status: "recorded", result_ref: resultRef, result_hash: resultHash } },
      codeReview: { facts: { status: "recorded", result_ref: "quality/reviews/results/verify-code.json", result_hash: "b".repeat(64) } },
    })).toMatchObject({
      phase_review: { source: "build-code-phase-review", result_ref: resultRef },
      verify_code: { source: "verify-code-code-review", result_ref: "quality/reviews/results/verify-code.json" },
    });

    expect(readPhaseReviewResultRef({
      readReceipt: () => ({ sha256: resultHash, value: { stage: "build-code", subject_kind: "phase", review_scope: "integration", phase_id: null } }),
    }, { receipts: { review: "quality/reviews/results/integration.json" } })).toBeNull();
    expect(readPhaseReviewResultRef({
      readReceipt: () => ({ sha256: resultHash, value: { stage: "build-code", subject_kind: "phase", review_scope: "phase", phase_id: "C4" } }),
    }, { receipts: { review: "quality/reviews/attempts/a/attempt.json" } })).toBeNull();
  });

  it("rejects OI-shaped input that is not present in the current decision-log authority", () => {
    const decisionLog = "```yaml\nois:\n  - oi_id: OI-001\n    task_id: verify-facts\n    outline_version: v1\n```\n";
    const entry = { oi_id: "OI-999", category: "scope", source: "R-999", question: "伪造问题", status: "open" };
    const input = buildDirectionReviewInput({
      decisionLog,
      directionReview: { convergence_outline: { entries: [entry] } },
      interactionAggregate: { ref: "quality/evidence/interactions/" + "c".repeat(64) + ".json", evidence: { ref: "quality/evidence/interactions/" + "c".repeat(64) + ".json", sha256: "c".repeat(64) }, value: {} },
    });
    expect(input.status).toBe("unavailable");
    expect(input.errors.join("; ")).toMatch(/not in the current decision-log OI authority|official contract/i);
  });

  it("binds direction review input to the decision revision, every OI, and the official interaction aggregate binding", () => {
    const decisionLog = [
      "# 当前决策",
      "",
      "```yaml",
      "ois:",
      "  - oi_id: OI-001",
      "    task_id: verify-facts",
      "    outline_version: v1",
      "    category: complete_user_flow",
      "    source: R-001",
      "    question: 范围到哪里？",
      "    status: confirmed",
      "    selected_disposition: 保持范围",
      "    evidence: F-001",
      "    acceptance: 范围清楚",
      "    counterexample: 超出范围",
      "    impact_dimensions: [scope]",
      "    requires_user_decision: true",
      "    visible_group_id: group-scope",
      "```",
    ].join("\n");
    const decisionHash = createHash("sha256").update(decisionLog).digest("hex");
    const aggregateHash = "c".repeat(64);
    const aggregateRef = `quality/evidence/interactions/${aggregateHash}.json`;
    const card = { card_ref: "conversation/card-1", card_hash: "a".repeat(64), round: 1 };
    const reply = { ...card, source: "user", reply_ref: "host-message://reply-1", reply_hash: "b".repeat(64) };
    const question = {
      question_id: "scope", axis: "scope", independent: true,
      options: [
        { number: 1, label: "保守", meaning: "先少做一点", consequence: "范围较小", risk: "收益延后" },
        { number: 2, label: "推荐", meaning: "解决当前问题", consequence: "一次完成", risk: "改动较多" },
      ],
      recommended_option: 2, recommendation_reason: "当前事实支持",
    };
    const talkRound = {
      interaction_type: "talk",
      events: [
        { event: "ask", ...card, questions: [question] },
        { event: "wait", ...card, status: "waiting-for-user" },
        { event: "reply", ...reply, answers: [{ question_id: "scope", number: 2 }], remaining_question_ids: [], re_ranked: true },
        { event: "resume", ...reply, status: "resumed" },
      ],
    };
    const grillRound = {
      interaction_type: "grill",
      events: [
        { event: "ask", ...card, questions: [
          { ...question, question_id: "frontier-a", frontier_id: "frontier-a", axis: "frontier-a" },
          { ...question, question_id: "frontier-b", frontier_id: "frontier-b", axis: "frontier-b" },
        ] },
        { event: "wait", ...card, status: "waiting-for-user" },
        { event: "reply", ...reply, answers: [
          { frontier_id: "frontier-a", answer: "保留", number: 1 },
          { frontier_id: "frontier-b", answer: "确认", number: 2 },
        ], remaining_frontier_ids: [], re_ranked: true },
        { event: "resume", ...reply, status: "resumed" },
      ],
    };
    const aggregateValue = {
      schema_version: "workflowhub-interaction-aggregate.v1",
      task_id: "verify-facts",
      stage: "make-decision",
      snapshot_tree: "d".repeat(40),
      original_requirement: { ref: "quality/evidence/original-requirement.txt", hash: "e".repeat(64) },
      decision: { ref: "specs/verify-facts/decision-log.md", hash: decisionHash, revision: `revision-${"f".repeat(64)}` },
      confirmation: { ref: `quality/confirmations/${"a".repeat(64)}.json`, hash: "b".repeat(64), result: "accepted" },
      talk: { status: "completed", round_count: 1, lifecycle_rounds: [talkRound] },
      grill: { status: "completed", summary: "范围冲突已处理", lifecycle_rounds: [grillRound] },
      advice: { status: "unavailable", reason: "本次没有可用的独立建议运输" },
      oi_dispositions: [{ task_id: "verify-facts", outline_version: "v1", oi_id: "OI-001", visible_group_id: "group-scope", selected_disposition: "保持范围" }],
    };
    const entry = { oi_id: "OI-001", category: "complete_user_flow", source: "R-001", question: "范围到哪里？", status: "open" };
    const input = buildDirectionReviewInput({
      decisionLog,
      directionReview: { task_id: "verify-facts", outline_version: "v1", convergence_outline: { entries: [entry] } },
      interactionAggregate: { ref: aggregateRef, value: aggregateValue, evidence: { ref: aggregateRef, sha256: aggregateHash } },
    });
    expect(input).toMatchObject({
      direction_integrity_instruction: expect.stringMatching(/方向完整性|direction integrity/i),
      decision_revision: expect.any(String),
      oi_snapshot: [{ ref: "decision-log.md#OI-001", sha256: expect.stringMatching(/^[a-f0-9]{64}$/) }],
      interaction_aggregate: { ref: aggregateRef, sha256: aggregateHash },
      status: "ready",
    });
    expect(input.decision_revision).toBe(decisionHash);

    const mutated = buildDirectionReviewInput({
      decisionLog,
      directionReview: {
        task_id: "verify-facts",
        outline_version: "v1",
        convergence_outline: { entries: [{ ...entry, question: "伪造问题" }] },
      },
      interactionAggregate: { ref: aggregateRef, value: aggregateValue, evidence: { ref: aggregateRef, sha256: aggregateHash } },
    });
    expect(mutated.status).toBe("unavailable");
    expect(mutated.errors.join("; ")).toMatch(/does not match the current .*OI|does not match the current decision-log OI/i);
  });
});
