import { describe, expect, it } from "vitest";
import { readFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

import { validateInteractionLifecycleContract, validateInteractionLifecycleSequence } from "../../runtime/stage/stage-content-contracts.mjs";
import { validateStageAgentInteractionRounds } from "../../runtime/stage/stage-agent-outcome-adapter.mjs";
import {
  buildWorkflowHubSessionInput,
  bindCodexSessionTask,
  finishCodexSessionEvent,
  recordCodexSessionSpecAnalyze,
  registerCodexSession,
  readCurrentCodexSession,
  sessionHandoffPath,
  startCodexSessionEvent,
} from "../../tools/host/workflowhub-codex-session-state.mjs";

function eventFixture({ stageEndStep = null, stageEndBlocking = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-stage-order-contract-"));
  const cwd = join(root, "workspace");
  const taskPath = join(root, "task");
  mkdirSync(join(cwd, "workflows", "build-code"), { recursive: true });
  mkdirSync(taskPath, { recursive: true });
  writeFileSync(join(cwd, "workflows", "build-code", "steps.json"), JSON.stringify({
    schema_version: "2.0.0",
    stage_slug: "build-code",
    steps: [
      { step_id: 1, step_slug: "read-current-task-documents", order: 1, depends_on: [] },
      { step_id: 2, step_slug: "write-red-tests", order: 2, depends_on: [1], ...(stageEndStep === "write-red-tests" ? { on_stage_end: true, blocking: stageEndBlocking } : {}) },
      { step_id: 3, step_slug: "implement-change", order: 3, depends_on: [2] },
      { step_id: 4, step_slug: "publish-current-result", order: 4, depends_on: [3] },
    ],
  }));
  const sessionId = `stage-order-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  registerCodexSession({ sessionId, transcriptPath: null, cwd, observedAtMs: 0 });
  bindCodexSessionTask({ projectName: "workflowhub", taskId: "stage-order-task", taskPath, cwd });
  return { root, cwd, sessionId };
}

const root = resolve(new URL("../..", import.meta.url).pathname);
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");
const readJson = (...parts) => JSON.parse(read(...parts));
const hash = "a".repeat(64);

function lifecycle(interaction_type) {
  const card = { card_ref: `conversation/${interaction_type}/card-1`, card_hash: hash, round: 1 };
  const reply = { ...card, source: "user", reply_ref: `host-message://${interaction_type}/reply-1`, reply_hash: "b".repeat(64) };
  const question = (question_id) => ({
    question_id,
    frontier_id: interaction_type === "grill" ? question_id : undefined,
    axis: question_id,
    independent: true,
    options: [
      { number: 1, label: "保守", meaning: "先少做", consequence: "范围较小", risk: "收益较慢" },
      { number: 2, label: "推荐", meaning: "直接修复", consequence: "一次解决", risk: "改动较多" },
    ],
    recommended_option: 2,
    recommendation_reason: "当前事实支持",
  });
  const questions = [question("scope"), question("risk")];
  return {
    interaction_type,
    events: [
      { event: "ask", ...card, questions },
      { event: "wait", ...card, status: "waiting-for-user" },
      { event: "reply", ...reply, answers: questions.map((item) => ({
        [interaction_type === "grill" ? "frontier_id" : "question_id"]: item.question_id,
        number: 2,
      })), ...(interaction_type === "grill"
        ? { remaining_frontier_ids: [] }
        : { remaining_question_ids: [] }), re_ranked: true },
      { event: "resume", ...reply, status: "resumed" },
    ],
  };
}

describe("P1 stage order and real host interaction contract", () => {
  it("accepts ordered rounds for one declared interaction and rejects a duplicate lifecycle", () => {
    const first = lifecycle("talk");
    const second = lifecycle("talk");
    second.events.forEach((event) => { event.round = 2; event.card_ref = "conversation/talk/card-2"; event.reply_ref = "host-message://talk/reply-2"; });
    expect(validateStageAgentInteractionRounds({ interaction_type: "talk", rounds: [first, second] })).toMatchObject({ ok: true });

    const duplicate = lifecycle("talk");
    expect(() => validateStageAgentInteractionRounds({ interaction_type: "talk", rounds: [first, duplicate] })).toThrow(/duplicate|started more than once|invalid/i);
  });

  it("requires every Talk round to use the real ask-wait-reply-resume seam", () => {
    const makeDecision = read("workflows", "make-decision", "SKILL.md");
    expect(makeDecision).toMatch(/Talk round 1[\s\S]{0,240}real[\s\S]*ask[\s\S]*wait[\s\S]*user reply[\s\S]*resume/i);
    expect(makeDecision).toMatch(/Talk round 2[\s\S]{0,240}real[\s\S]*ask[\s\S]*wait[\s\S]*user reply[\s\S]*resume/i);
    expect(makeDecision).toMatch(/Talk round 3[\s\S]{0,240}real[\s\S]*ask[\s\S]*wait[\s\S]*user reply[\s\S]*resume/i);
  });

  it("keeps the fixed advice and Grill order while Clarify stays in build-spec", () => {
    const makeSteps = readJson("workflows", "make-decision", "steps.json").steps;
    const buildSpecSteps = readJson("workflows", "build-spec", "steps.json").steps;
    const order = (slug) => makeSteps.find((step) => step.step_slug === slug).order;
    expect(order("talk-round-2")).toBeLessThan(order("direction-advice"));
    expect(order("direction-advice")).toBeLessThan(order("talk-round-3"));
    expect(order("talk-round-3")).toBeLessThan(order("grill-with-docs"));
    expect(order("grill-with-docs")).toBeLessThan(order("detail-advice"));
    expect(buildSpecSteps.find((step) => step.step_slug === "spec-clarify").observable_result)
      .toMatch(/real ask.*wait.*matching user reply.*resume/i);
    expect(read("workflows", "build-spec", "SKILL.md"))
      .toMatch(/missing\s+reply,\s+wrong\s+card,\s+stale\s+hash,\s+or\s+interrupted\s+resume\s+stays\s+`incomplete`/i);
  });

  it("requires a real user reply for Talk, Grill, and Clarify before resume", () => {
    for (const kind of ["talk", "grill", "spec-clarify"]) {
      expect(validateInteractionLifecycleContract(lifecycle(kind)), kind).toMatchObject({ ok: true });
      const fake = lifecycle(kind);
      fake.events[2].source = "agent";
      expect(validateInteractionLifecycleContract(fake).ok, `${kind} fake reply`).toBe(false);
    }
  });

  it("keeps batching, consequence/risk cards, re-ranking, and no-review Grill behavior explicit", () => {
    const makeDecision = read("workflows", "make-decision", "SKILL.md");
    const talk = read("skills", "talk-with-zhipeng", "SKILL.md");
    const grill = read("skills", "grill-with-docs", "SKILL.md");
    const clarify = read("skills", "spec-clarify", "SKILL.md");
    expect(makeDecision).toMatch(/Talk groups independent decision axes in one batch/i);
    expect(talk).toMatch(/每题 2[～-]3 个互斥选项/);
    expect(talk).toMatch(/consequences and risks|后果和风险/i);
    expect(grill).toMatch(/(?:must not call wh-review|绝不调用 wh-review)[\s\S]{0,80}(?:review fact|review finding|review 结论)/i);
    expect(clarify).toMatch(/Publishing a batch card ends the current invocation/i);
  });

  it("rejects a later step while its predecessor is open and leaves the sidecar unchanged", () => {
    const state = eventFixture();
    try {
      startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "read-current-task-documents", cwd: state.cwd, sessionId: state.sessionId, startedAtMs: 1000 });
      const before = JSON.parse(readFileSync(sessionHandoffPath(state.cwd), "utf8"));
      expect(() => startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "write-red-tests", cwd: state.cwd, sessionId: state.sessionId, startedAtMs: 1100 }))
        .toThrow(/sequence invalid|still open|preced/i);
      const after = JSON.parse(readFileSync(sessionHandoffPath(state.cwd), "utf8"));
      expect(after.sessions[0].events).toEqual(before.sessions[0].events);
      finishCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "read-current-task-documents", cwd: state.cwd, sessionId: state.sessionId, endedAtMs: 1200 });
      expect(() => startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "write-red-tests", cwd: state.cwd, sessionId: state.sessionId, startedAtMs: 1300 })).not.toThrow();
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("bypasses a failed predecessor only for an explicitly non-blocking stage-end step", () => {
    const blocking = eventFixture({ stageEndStep: "write-red-tests", stageEndBlocking: true });
    try {
      startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "read-current-task-documents", cwd: blocking.cwd, sessionId: blocking.sessionId, startedAtMs: 3000 });
      finishCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "read-current-task-documents", cwd: blocking.cwd, sessionId: blocking.sessionId, endedAtMs: 3100, status: "failed", reason: "fixture failure" });
      expect(() => startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "write-red-tests", cwd: blocking.cwd, sessionId: blocking.sessionId, startedAtMs: 3200 }))
        .toThrow(/dependency .* must be completed/i);
    } finally {
      rmSync(sessionHandoffPath(blocking.cwd), { force: true });
      rmSync(blocking.root, { recursive: true, force: true });
    }

    const nonBlocking = eventFixture({ stageEndStep: "write-red-tests", stageEndBlocking: false });
    try {
      startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "read-current-task-documents", cwd: nonBlocking.cwd, sessionId: nonBlocking.sessionId, startedAtMs: 4000 });
      finishCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "read-current-task-documents", cwd: nonBlocking.cwd, sessionId: nonBlocking.sessionId, endedAtMs: 4100, status: "failed", reason: "fixture failure" });
      expect(() => startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "write-red-tests", cwd: nonBlocking.cwd, sessionId: nonBlocking.sessionId, startedAtMs: 4200 })).not.toThrow();
    } finally {
      rmSync(sessionHandoffPath(nonBlocking.cwd), { force: true });
      rmSync(nonBlocking.root, { recursive: true, force: true });
    }
  });

  it("keeps a skill bound to its open parent step and rejects an unrelated parent", () => {
    const state = eventFixture();
    try {
      startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "read-current-task-documents", cwd: state.cwd, sessionId: state.sessionId, startedAtMs: 2000 });
      const skill = startCodexSessionEvent({ stage: "build-code", subjectKind: "skill", subjectId: "frontend-testing", parentSubjectId: "read-current-task-documents", cwd: state.cwd, sessionId: state.sessionId, startedAtMs: 2100 });
      expect(skill.event_id).toMatch(/^event-/);
      expect(readCurrentCodexSession({ cwd: state.cwd, stage: "build-code", sessionId: state.sessionId }).events)
        .toEqual(expect.arrayContaining([expect.objectContaining({ subject_kind: "skill", parent_subject_id: "read-current-task-documents" })]));
      expect(() => startCodexSessionEvent({ stage: "build-code", subjectKind: "skill", subjectId: "backend-testing", parentSubjectId: "write-red-tests", cwd: state.cwd, sessionId: state.sessionId, startedAtMs: 2200 }))
        .toThrow(/nested|parent step/i);
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("rejects an undeclared skill before writing a host event", () => {
    const state = eventFixture();
    try {
      writeFileSync(join(state.cwd, "workflows", "build-code", "skill-deps.yaml"), [
        "stage: build-code",
        "skills:",
        "  - name: backend-testing",
        "    consumer:",
        "      target: stage-handlers#testFacts",
        "      inputs: [receipts.tests]",
        "      identity: [task_id, stage, material_revision, snapshot_tree]",
      ].join("\n"));
      const before = JSON.parse(readFileSync(sessionHandoffPath(state.cwd), "utf8"));
      expect(() => startCodexSessionEvent({
        stage: "build-code", subjectKind: "skill", subjectId: "frontend-testing",
        cwd: state.cwd, sessionId: state.sessionId, startedAtMs: 2300,
      })).toThrow(/skill frontend-testing is not declared/i);
      const after = JSON.parse(readFileSync(sessionHandoffPath(state.cwd), "utf8"));
      expect(after.sessions[0].events).toEqual(before.sessions[0].events);
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("does not project a declared skill as complete when its event is absent", () => {
    const state = eventFixture();
    try {
      writeFileSync(join(state.cwd, "workflows", "build-code", "skill-deps.yaml"), [
        "stage: build-code",
        "skills:",
        "  - name: backend-testing",
        "    consumer:",
        "      target: stage-handlers#testFacts",
        "      inputs: [receipts.tests]",
        "      identity: [task_id, stage, material_revision, snapshot_tree]",
      ].join("\n"));
      const steps = [
        "read-current-task-documents",
        "write-red-tests",
        "implement-change",
        "publish-current-result",
      ];
      steps.forEach((subjectId, index) => {
        const startedAtMs = 3000 + index * 100;
        startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId, cwd: state.cwd, sessionId: state.sessionId, startedAtMs });
        finishCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId, cwd: state.cwd, sessionId: state.sessionId, endedAtMs: startedAtMs + 10, status: "completed", resultSummary: subjectId });
      });
      recordCodexSessionSpecAnalyze({ stage: "build-code", value: { marker: "complete-steps-only" }, cwd: state.cwd, sessionId: state.sessionId });
      expect(buildWorkflowHubSessionInput({ cwd: state.cwd, stage: "build-code", sessionId: state.sessionId })).toMatchObject({ status_value: "incomplete" });
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("projects skipped steps and not-applicable skills as terminal without inventing completion", () => {
    const state = eventFixture();
    try {
      writeFileSync(join(state.cwd, "workflows", "build-code", "skill-deps.yaml"), [
        "stage: build-code",
        "skills:",
        "  - name: backend-testing",
        "    consumer:",
        "      target: stage-handlers#testFacts",
        "      inputs: [receipts.tests]",
        "      identity: [task_id, stage, material_revision, snapshot_tree]",
      ].join("\n"));
      const steps = [
        "read-current-task-documents",
        "write-red-tests",
        "implement-change",
        "publish-current-result",
      ];
      startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: steps[0], cwd: state.cwd, sessionId: state.sessionId, startedAtMs: 4000 });
      startCodexSessionEvent({ stage: "build-code", subjectKind: "skill", subjectId: "backend-testing", cwd: state.cwd, sessionId: state.sessionId, startedAtMs: 4010 });
      finishCodexSessionEvent({ stage: "build-code", subjectKind: "skill", subjectId: "backend-testing", cwd: state.cwd, sessionId: state.sessionId, endedAtMs: 4020, status: "not_applicable", reason: "当前改动没有后端测试范围", trigger: false, executed: false });
      finishCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: steps[0], cwd: state.cwd, sessionId: state.sessionId, endedAtMs: 4030, status: "completed", resultSummary: steps[0] });
      steps.slice(1, 3).forEach((subjectId, index) => {
        const startedAtMs = 4100 + index * 100;
        startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId, cwd: state.cwd, sessionId: state.sessionId, startedAtMs });
        finishCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId, cwd: state.cwd, sessionId: state.sessionId, endedAtMs: startedAtMs + 10, status: "completed", resultSummary: subjectId });
      });
      startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: steps[3], cwd: state.cwd, sessionId: state.sessionId, startedAtMs: 4350 });
      finishCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: steps[3], cwd: state.cwd, sessionId: state.sessionId, endedAtMs: 4360, status: "skipped", reason: "当前步骤不适用" });
      recordCodexSessionSpecAnalyze({ stage: "build-code", value: { marker: "terminal-skipped-and-na" }, cwd: state.cwd, sessionId: state.sessionId });
      expect(buildWorkflowHubSessionInput({ cwd: state.cwd, stage: "build-code", sessionId: state.sessionId })).toMatchObject({ status_value: "completed" });
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("fails closed when historical completed step intervals overlap", () => {
    const state = eventFixture();
    try {
      startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "read-current-task-documents", cwd: state.cwd, sessionId: state.sessionId, startedAtMs: 1000 });
      finishCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "read-current-task-documents", cwd: state.cwd, sessionId: state.sessionId, endedAtMs: 3000 });
      // The old preflight allowed a caller to backdate the next step.  Once
      // both events are terminal, the next start must expose that corrupt
      // history instead of extending it.
      startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "write-red-tests", cwd: state.cwd, sessionId: state.sessionId, startedAtMs: 2000 });
      finishCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "write-red-tests", cwd: state.cwd, sessionId: state.sessionId, endedAtMs: 4000 });
      expect(() => startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "implement-change", cwd: state.cwd, sessionId: state.sessionId, startedAtMs: 5000 }))
        .toThrow(/history invalid|overlap/i);
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("restarts from an affected step without reusing later results from the previous pass", () => {
    const state = eventFixture();
    const complete = (subjectId, startedAtMs, endedAtMs, resultSummary = "") => {
      startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId, cwd: state.cwd, sessionId: state.sessionId, startedAtMs });
      finishCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId, cwd: state.cwd, sessionId: state.sessionId, endedAtMs, status: "completed", resultSummary });
    };
    try {
      complete("read-current-task-documents", 1000, 1000);
      complete("write-red-tests", 1200, 1200, "old-red");
      complete("implement-change", 1600, 1600, "old-implementation");
      complete("publish-current-result", 1700, 1700, "old-publication");
      recordCodexSessionSpecAnalyze({ stage: "build-code", value: { marker: "old-pass" }, cwd: state.cwd, sessionId: state.sessionId });
      expect(buildWorkflowHubSessionInput({ cwd: state.cwd, stage: "build-code", sessionId: state.sessionId }).status_value).toBe("completed");

      expect(() => startCodexSessionEvent({
        stage: "build-code", subjectKind: "step", subjectId: "write-red-tests",
        cwd: state.cwd, sessionId: state.sessionId, startedAtMs: 500,
      })).not.toThrow();

      const restarted = buildWorkflowHubSessionInput({ cwd: state.cwd, stage: "build-code", sessionId: state.sessionId });
      expect(restarted).toMatchObject({ status_value: "incomplete", spec_analyze: null });
      expect(restarted.events.map((entry) => entry.subject_id)).toEqual(["read-current-task-documents"]);

      finishCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "write-red-tests", cwd: state.cwd, sessionId: state.sessionId, endedAtMs: 500, status: "completed", resultSummary: "new-red" });
      expect(() => startCodexSessionEvent({
        stage: "build-code", subjectKind: "step", subjectId: "publish-current-result",
        cwd: state.cwd, sessionId: state.sessionId, startedAtMs: 400,
      })).toThrow(/dependency.*implement-change/i);

      complete("implement-change", 300, 300, "new-implementation");
      complete("publish-current-result", 200, 200, "new-publication");
      recordCodexSessionSpecAnalyze({ stage: "build-code", value: { marker: "current-pass" }, cwd: state.cwd, sessionId: state.sessionId });

      const raw = readCurrentCodexSession({ cwd: state.cwd, stage: "build-code", sessionId: state.sessionId });
      expect(raw.events.filter((entry) => entry.subject_kind === "step")).toHaveLength(7);
      const current = buildWorkflowHubSessionInput({ cwd: state.cwd, stage: "build-code", sessionId: state.sessionId });
      expect(current).toMatchObject({ status_value: "completed", spec_analyze: { marker: "current-pass" } });
      expect(current.events.map((entry) => entry.subject_id)).toEqual([
        "read-current-task-documents", "write-red-tests", "implement-change", "publish-current-result",
      ]);
      expect(current.events.slice(1).map((entry) => entry.result_summary)).toEqual(["new-red", "new-implementation", "new-publication"]);
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("rejects duplicate manifest step orders before recording an event", () => {
    const state = eventFixture();
    try {
      const manifestPath = join(state.cwd, "workflows", "build-code", "steps.json");
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      manifest.steps[1].order = manifest.steps[0].order;
      writeFileSync(manifestPath, JSON.stringify(manifest));
      expect(() => startCodexSessionEvent({
        stage: "build-code", subjectKind: "step", subjectId: "read-current-task-documents",
        cwd: state.cwd, sessionId: state.sessionId, startedAtMs: 1000,
      })).toThrow(/duplicate or invalid step order/i);
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });
});
