import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  buildWorkflowHubSessionInput,
  bindCodexSessionTask,
  endCodexSession,
  finishCodexSessionEvent,
  recordCodexSessionSpecAnalyze,
  registerCodexSession,
  readCurrentCodexSession,
  sessionHandoffPath,
  startCodexSessionEvent,
} from "../tools/host/workflowhub-codex-session-state.mjs";
import { resolveDefaultMonitoringSource } from "../tools/cli/stage-runtime.mjs";
import { createRegisteredCodexSource, parseRegisteredRequirementTranscript } from "../runtime/evidence/codex-transcript-adapter.mjs";
import { createTranscriptSourceReader } from "../runtime/evidence/fact-collector.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-codex-hook-test-"));
  const home = join(root, "home");
  const cwd = join(root, "workspace");
  const rollout = join(home, ".codex", "sessions", "2026", "08", "18", "rollout-2026-08-18T00-00-00-session-auto-test-123.jsonl");
  mkdirSync(cwd, { recursive: true });
  const taskPath = join(root, "task");
  mkdirSync(taskPath, { recursive: true });
  mkdirSync(join(home, ".codex", "sessions", "2026", "08", "18"), { recursive: true });
  writeFileSync(rollout, `${JSON.stringify({
    timestamp: "1970-01-01T00:00:01.500Z",
    type: "event_msg",
    payload: { type: "token_count", info: { last_token_usage: { input_tokens: 7, output_tokens: 3, total_tokens: 10 } } },
  })}\n`);
  return { root, home, cwd, rollout, taskPath, sessionId: "session-auto-test-123", taskId: "task-hook-source" };
}

function bind(state, taskId = state.taskId) {
  return bindCodexSessionTask({ projectName: "workflowhub", taskId, taskPath: state.taskPath, cwd: state.cwd });
}

function appendCodexUserMessage(state, { id = "msg-requirement-source-1", text = "把这个任务按真实用户流程完成。", timestamp = "1970-01-01T00:00:01.000Z" } = {}) {
  appendFileSync(state.rollout, `${JSON.stringify({
    timestamp,
    type: "response_item",
    payload: {
      type: "message",
      id,
      role: "user",
      content: [{ type: "input_text", text }],
    },
  })}\n`);
}

describe("WorkflowHub current Codex session handoff", () => {
  it("authenticates requirement messages without retaining raw transcript content", () => {
    const state = fixture();
    const content = "用户要把当前需求完整落实到五阶段流程。";
    const source = createRegisteredCodexSource({
      source_id: "codex-requirements",
      source_ref: "codex-requirements-ref",
      registration_id: "registration-requirements",
      required: true,
      task_id: state.taskId,
      run_id: "run-requirements",
      session_id: state.sessionId,
      source_format: "jsonl",
      source_version: "v1",
      cli_version: "codex-test",
      adapter_version: "adapter-test",
      reader: createTranscriptSourceReader(() => JSON.stringify({
        id: "requirement-1",
        type: "requirement_message",
        source_version: "v1",
        task_id: state.taskId,
        session_id: state.sessionId,
        stage: "make-decision",
        order: 1,
        message_class: "goal",
        content,
        content_hash: createHash("sha256").update(content).digest("hex"),
      })),
    });
    try {
      const result = parseRegisteredRequirementTranscript(source, { stage: "make-decision" });
      expect(result).toMatchObject({ status: "present", source_id: "codex-requirements" });
      expect(result.messages).toEqual([expect.objectContaining({
        id: "requirement-1",
        order: 1,
        message_class: "goal",
        content_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
        task_id: state.taskId,
        session_id: state.sessionId,
        stage: "make-decision",
      })]);
      expect(result.messages[0].content).toBeUndefined();
    } finally {
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("rejects an unregistered requirement transcript source before authentication", () => {
    const result = parseRegisteredRequirementTranscript({ reader: () => "{}" }, { stage: "make-decision", task_id: "task-hook-source" });
    expect(result).toMatchObject({
      status: "unsupported",
      source_id: null,
      source_ref: null,
      source_version: null,
      messages: [],
      errors: ["SOURCE_REGISTRATION_INVALID: registered transcript source is not launcher-registered"],
      coverage: { observed: 0, expected: 0 },
    });
  });

  it("rejects a requirement message with wrong identity, order, or content hash", () => {
    const state = fixture();
    const source = createRegisteredCodexSource({
      source_id: "codex-requirements",
      source_ref: "codex-requirements-ref",
      registration_id: "registration-requirements",
      required: true,
      task_id: state.taskId,
      run_id: "run-requirements",
      session_id: state.sessionId,
      source_format: "jsonl",
      source_version: "v1",
      cli_version: "codex-test",
      adapter_version: "adapter-test",
      reader: createTranscriptSourceReader(() => JSON.stringify({
        id: "requirement-1",
        type: "requirement_message",
        source_version: "v1",
        task_id: "other-task",
        session_id: state.sessionId,
        stage: "make-decision",
        order: 2,
        message_class: "goal",
        content: "原始需求",
        content_hash: "0".repeat(64),
      })),
    });
    try {
      const result = parseRegisteredRequirementTranscript(source, { stage: "make-decision" });
      expect(result.status).toBe("conflict");
      expect(result.errors.join("; ")).toMatch(/task|order|hash/i);
      expect(result.messages).toEqual([]);
    } finally {
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("registers the exact hook transcript and measures a semantic event without a second agent", () => {
    const state = fixture();
    try {
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.rollout, cwd: state.cwd, home: state.home, observedAtMs: 0 });
      bind(state);
      startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "run-tests", cwd: state.cwd, startedAtMs: 1000 });
      finishCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "run-tests", cwd: state.cwd, endedAtMs: 2000, status: "completed", resultSummary: "focused tests ran", evidenceRefs: ["quality/tests/current.json"] });
      const session = buildWorkflowHubSessionInput({ cwd: state.cwd, stage: "build-code" });
      expect(session).toMatchObject({ status: "present", session_id: state.sessionId, source_ref: `codex-rollout-${state.sessionId}` });
      expect(session.events).toEqual([expect.objectContaining({
        subject_kind: "step",
        subject_id: "run-tests",
        status: "completed",
        usage: { input_tokens: 7, output_tokens: 3, total_tokens: 10 },
      })]);
      expect(session.events[0].evidence).toEqual([{ ref: "quality/tests/current.json" }]);
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("freezes real pre-binding Codex user messages as hash-checked requirements", () => {
    const state = fixture();
    const text = "把这项需求覆盖到完整的产品流程和验收边界。";
    try {
      appendCodexUserMessage(state, { text });
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.rollout, cwd: state.cwd, home: state.home, observedAtMs: 0 });
      bind(state);
      const session = buildWorkflowHubSessionInput({ taskId: state.taskId, cwd: state.cwd, stage: "make-decision", sessionId: state.sessionId });
      expect(session.requirement_messages).toEqual([{
        id: "msg-requirement-source-1",
        order: 1,
        content_hash: createHash("sha256").update(text).digest("hex"),
      }]);

      // A concurrent sub-agent thread must not steal the session handoff.
      const source = resolveDefaultMonitoringSource({
        context: { stage: "make-decision" },
        task_id: state.taskId,
        run_id: "run-real-user-requirement",
        attempt_id: "attempt-real-user-requirement",
        env: { CODEX_SESSION_ID: state.sessionId, CODEX_THREAD_ID: "session-other-thread-456" },
        home: state.home,
        cwd: state.cwd,
        startedAtMs: Date.now(),
      });
      const authenticated = parseRegisteredRequirementTranscript(source, { stage: "make-decision" });
      expect(authenticated).toMatchObject({ status: "present", messages: [expect.objectContaining({
        id: "msg-requirement-source-1",
        content_hash: createHash("sha256").update(text).digest("hex"),
      })] });
      expect(authenticated.messages[0].content).toBeUndefined();
      expect(authenticated.messages[0].message_class).toBeUndefined();

      const explicitSource = resolveDefaultMonitoringSource({
        context: { stage: "make-decision" },
        task_id: state.taskId,
        run_id: "run-explicit-real-user-requirement",
        attempt_id: "attempt-explicit-real-user-requirement",
        env: {
          CODEX_SESSION_ID: state.sessionId,
          CODEX_THREAD_ID: "session-other-thread-456",
          CODEX_ROLLOUT_PATH: state.rollout,
        },
        home: state.home,
        cwd: state.cwd,
        startedAtMs: Date.now(),
      });
      expect(parseRegisteredRequirementTranscript(explicitSource, { stage: "make-decision" })).toMatchObject({
        status: "present",
        messages: [expect.objectContaining({ id: "msg-requirement-source-1" })],
      });

      appendCodexUserMessage(state, { id: "msg-late-user-prompt-2", text: "这是绑定后的 Talk 回复，不能变成原始需求。", timestamp: "1970-01-01T00:00:02.000Z" });
      appendFileSync(state.rollout, `${JSON.stringify({
        timestamp: "1970-01-01T00:00:03.000Z",
        type: "event_msg",
        payload: {
          type: "requirement_message",
          id: "forged-late-requirement",
          content: "不能伪造原始需求",
          content_hash: createHash("sha256").update("不能伪造原始需求").digest("hex"),
        },
      })}\n`);
      expect(parseRegisteredRequirementTranscript(source, { stage: "make-decision" }).messages).toHaveLength(1);
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("backfills the frozen requirement snapshot for an existing task binding", () => {
    const state = fixture();
    const text = "旧会话也必须保留绑定前的原始需求。";
    try {
      appendCodexUserMessage(state, { text });
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.rollout, cwd: state.cwd, home: state.home, observedAtMs: 0 });
      bind(state);
      const handoffPath = sessionHandoffPath(state.cwd);
      const raw = JSON.parse(readFileSync(handoffPath, "utf8"));
      delete raw.sessions[0].task_binding.requirement_messages;
      writeFileSync(handoffPath, `${JSON.stringify(raw, null, 2)}\n`);

      bind(state);
      expect(buildWorkflowHubSessionInput({ taskId: state.taskId, cwd: state.cwd, stage: "make-decision", sessionId: state.sessionId }).requirement_messages).toEqual([
        expect.objectContaining({ id: "msg-requirement-source-1", content_hash: createHash("sha256").update(text).digest("hex") }),
      ]);
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("quarantines old workflow-as-skill markers instead of crashing the stage publisher", () => {
    const state = fixture();
    try {
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.rollout, cwd: state.cwd, home: state.home, observedAtMs: 0 });
      bind(state);
      startCodexSessionEvent({ stage: "make-decision", subjectKind: "skill", subjectId: "make-decision", cwd: state.cwd, startedAtMs: 1000 });
      finishCodexSessionEvent({ stage: "make-decision", subjectKind: "skill", subjectId: "make-decision", cwd: state.cwd, endedAtMs: 2000, status: "completed" });
      startCodexSessionEvent({ stage: "make-decision", subjectKind: "skill", subjectId: "build-plan", cwd: state.cwd, startedAtMs: 3000 });
      finishCodexSessionEvent({ stage: "make-decision", subjectKind: "skill", subjectId: "build-plan", cwd: state.cwd, endedAtMs: 4000, status: "completed" });
      const session = buildWorkflowHubSessionInput({ taskId: state.taskId, cwd: state.cwd, stage: "make-decision", sessionId: state.sessionId });
      expect(session.events).toEqual([]);
      expect(session.rejected_events).toEqual(expect.arrayContaining([expect.objectContaining({
        subject_kind: "skill",
        subject_id: "make-decision",
        reason: "workflow_name_recorded_as_skill",
      }), expect.objectContaining({ subject_id: "build-plan" })]));
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("uses half-open transcript windows so a boundary token is not counted twice", () => {
    const state = fixture();
    try {
      appendFileSync(state.rollout, `${JSON.stringify({
        timestamp: "1970-01-01T00:00:02.000Z",
        type: "event_msg",
        payload: { type: "token_count", info: { last_token_usage: { input_tokens: 100, output_tokens: 10, total_tokens: 110 } } },
      })}\n`);
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.rollout, cwd: state.cwd, home: state.home, observedAtMs: 0 });
      bind(state);
      startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "run-tests", cwd: state.cwd, startedAtMs: 1000 });
      finishCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "run-tests", cwd: state.cwd, endedAtMs: 2000, status: "completed", resultSummary: "boundary test" });
      expect(buildWorkflowHubSessionInput({ cwd: state.cwd, stage: "build-code" }).events[0].usage).toEqual({ input_tokens: 7, output_tokens: 3, total_tokens: 10 });
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("same session across stage workspaces keeps one source binding", () => {
    const state = fixture();
    const alternateCwd = join(state.root, "alternate-workspace");
    mkdirSync(alternateCwd, { recursive: true });
    try {
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.rollout, cwd: state.cwd, home: state.home, observedAtMs: 0 });
      bind(state);
      const laterStage = buildWorkflowHubSessionInput({
        taskId: state.taskId,
        cwd: alternateCwd,
        stage: "build-plan",
        sessionId: state.sessionId,
      });
      expect(laterStage).toMatchObject({
        status: "present",
        session_id: state.sessionId,
        task_id: state.taskId,
      });
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("fails closed instead of falling back to another session for an unknown exact id", () => {
    const state = fixture();
    try {
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.rollout, cwd: state.cwd, home: state.home, observedAtMs: 0 });
      bind(state);
      const unknown = buildWorkflowHubSessionInput({
        taskId: state.taskId,
        cwd: state.cwd,
        stage: "build-code",
        sessionId: "session-unknown-exact-id",
      });
      expect(unknown).toMatchObject({ status: "unregistered" });
      expect(unknown.session_id).toBeUndefined();
      expect(() => startCodexSessionEvent({
        taskId: state.taskId,
        stage: "build-code",
        subjectKind: "step",
        subjectId: "should-not-write",
        cwd: state.cwd,
        sessionId: "session-unknown-exact-id",
      })).toThrow(/unregistered/i);
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("invalidates the exact locator when a session ends", () => {
    const state = fixture();
    const nextCwd = join(state.root, "next-workspace");
    mkdirSync(nextCwd, { recursive: true });
    try {
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.rollout, cwd: state.cwd, home: state.home, observedAtMs: 0 });
      expect(endCodexSession({ sessionId: state.sessionId, cwd: state.cwd, endedAtMs: 1000 }).ended).toBe(true);
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.rollout, cwd: nextCwd, home: state.home, observedAtMs: 2000 });
      expect(readCurrentCodexSession({ cwd: nextCwd, sessionId: state.sessionId })).toMatchObject({
        status: "present",
        cwd: expect.stringContaining("next-workspace"),
      });
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(sessionHandoffPath(nextCwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("reuses the same source for all five stages when the CLI cwd changes", () => {
    const state = fixture();
    const alternateCwd = join(state.root, "alternate-workspace");
    mkdirSync(alternateCwd, { recursive: true });
    const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
    try {
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.rollout, cwd: state.cwd, home: state.home, observedAtMs: 0 });
      bind(state);
      for (const stage of stages) {
        startCodexSessionEvent({ taskId: state.taskId, stage, subjectKind: "step", subjectId: `${stage}-step`, cwd: state.cwd, sessionId: state.sessionId, startedAtMs: 1000 });
        finishCodexSessionEvent({ taskId: state.taskId, stage, subjectKind: "step", subjectId: `${stage}-step`, cwd: state.cwd, sessionId: state.sessionId, endedAtMs: 2000, status: "completed", resultSummary: `${stage} completed` });
        const session = buildWorkflowHubSessionInput({ taskId: state.taskId, cwd: alternateCwd, stage, sessionId: state.sessionId });
        expect(session).toMatchObject({
          status: "present",
          session_id: state.sessionId,
          task_id: state.taskId,
          // verify-code has no spec-analyze step; its lifecycle projection is
          // complete when all of its own declared subjects are terminal.
          status_value: stage === "verify-code" ? "completed" : "incomplete",
        });
        const source = resolveDefaultMonitoringSource({
          context: { stage },
          task_id: state.taskId,
          run_id: `run-${stage}`,
          attempt_id: `attempt-${stage}`,
          env: { CODEX_THREAD_ID: state.sessionId },
          home: state.home,
          cwd: alternateCwd,
          startedAtMs: 0,
        });
        expect(source).toMatchObject({ session_id: state.sessionId, source_ref: `codex-rollout-${state.sessionId}` });
      }
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("private event CLI prefers CODEX_SESSION_ID when the stage cwd changes", () => {
    const state = fixture();
    const alternateCwd = join(state.root, "alternate-workspace");
    mkdirSync(alternateCwd, { recursive: true });
    const event = join(process.cwd(), "tools", "host", "workflowhub-codex-session-event.mjs");
    try {
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.rollout, cwd: state.cwd, home: state.home, observedAtMs: 0 });
      bind(state);
      const env = { ...process.env, HOME: state.home, CODEX_SESSION_ID: state.sessionId, CODEX_THREAD_ID: "session-other-thread-456" };
      const start = spawnSync(process.execPath, [event, "start", "--stage=build-plan", "--subject-kind=step", "--subject-id=read-current-materials"], {
        cwd: alternateCwd, encoding: "utf8", env,
      });
      expect(start.status, start.stderr).toBe(0);
      const finish = spawnSync(process.execPath, [event, "finish", "--stage=build-plan", "--subject-kind=step", "--subject-id=read-current-materials", "--status=completed"], {
        cwd: alternateCwd, encoding: "utf8", env,
      });
      expect(finish.status, finish.stderr).toBe(0);
      expect(buildWorkflowHubSessionInput({ taskId: state.taskId, cwd: alternateCwd, stage: "build-plan", sessionId: state.sessionId }).events).toEqual([
        expect.objectContaining({ subject_kind: "step", subject_id: "read-current-materials", status: "completed" }),
      ]);
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("uses the project hook payload and then resolves that exact source for monitoring", () => {
    const state = fixture();
    const hook = join(process.cwd(), "tools", "host", "workflowhub-codex-session-hook.mjs");
    try {
      const result = spawnSync(process.execPath, [hook], {
        cwd: state.cwd,
        input: JSON.stringify({ hook_event_name: "SessionStart", session_id: state.sessionId, transcript_path: state.rollout, cwd: state.cwd, model: "test-model" }),
        encoding: "utf8",
        env: { ...process.env, HOME: state.home },
      });
      expect(result.status).toBe(0);
      expect(JSON.parse(readFileSync(sessionHandoffPath(state.cwd), "utf8")).sessions[0]).toMatchObject({ session_id: state.sessionId, transcript_path: state.rollout });
      const source = resolveDefaultMonitoringSource({
        context: { stage: "build-code" },
        task_id: "task-hook-source",
        run_id: "run-hook-source",
        attempt_id: "attempt-hook-source",
        env: {},
        home: state.home,
        cwd: state.cwd,
        startedAtMs: 0,
      });
      expect(source).toMatchObject({ session_id: state.sessionId, source_ref: `codex-rollout-${state.sessionId}` });
      expect(source.source_ref).not.toContain("/");
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("does not create a transcript source from a late user prompt", () => {
    const state = fixture();
    const hook = join(process.cwd(), "tools", "host", "workflowhub-codex-session-hook.mjs");
    try {
      const result = spawnSync(process.execPath, [hook], {
        cwd: state.cwd,
        input: JSON.stringify({ hook_event_name: "UserPromptSubmit", session_id: state.sessionId, transcript_path: state.rollout, cwd: state.cwd, model: "test-model" }),
        encoding: "utf8",
        env: { ...process.env, HOME: state.home },
      });
      expect(result.status).toBe(0);
      expect(readCurrentCodexSession({ cwd: state.cwd, sessionId: state.sessionId })).toMatchObject({ status: "unregistered" });
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("refreshes only a live session and never reopens it after SessionEnd", () => {
    const state = fixture();
    const hook = join(process.cwd(), "tools", "host", "workflowhub-codex-session-hook.mjs");
    const invoke = (hookEventName, transcriptPath = state.rollout) => spawnSync(process.execPath, [hook], {
      cwd: state.cwd,
      input: JSON.stringify({ hook_event_name: hookEventName, session_id: state.sessionId, transcript_path: transcriptPath, cwd: state.cwd, model: "test-model" }),
      encoding: "utf8",
      env: { ...process.env, HOME: state.home },
    });
    try {
      expect(invoke("SessionStart").status).toBe(0);
      expect(readCurrentCodexSession({ cwd: state.cwd, sessionId: state.sessionId })).toMatchObject({ status: "present", transcript_path: state.rollout });
      expect(invoke("UserPromptSubmit", null).status).toBe(0);
      expect(readCurrentCodexSession({ cwd: state.cwd, sessionId: state.sessionId })).toMatchObject({ status: "present", transcript_path: state.rollout });
      expect(invoke("SessionEnd").status).toBe(0);
      expect(readCurrentCodexSession({ cwd: state.cwd, sessionId: state.sessionId })).toMatchObject({ status: "unregistered" });
      expect(invoke("UserPromptSubmit").status).toBe(0);
      expect(readCurrentCodexSession({ cwd: state.cwd, sessionId: state.sessionId })).toMatchObject({ status: "unregistered" });
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("keeps duration capture when Codex does not expose a transcript path", () => {
    const state = fixture();
    const hook = join(process.cwd(), "tools", "host", "workflowhub-codex-session-hook.mjs");
    try {
      const result = spawnSync(process.execPath, [hook], {
        cwd: state.cwd,
        input: JSON.stringify({ hook_event_name: "SessionStart", session_id: state.sessionId, transcript_path: null, cwd: state.cwd }),
        encoding: "utf8",
        env: { ...process.env, HOME: state.home },
      });
      expect(result.status).toBe(0);
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: null, cwd: state.cwd, home: state.home, observedAtMs: 0 });
      bind(state);
      startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "run-tests", cwd: state.cwd, startedAtMs: 1000 });
      finishCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "run-tests", cwd: state.cwd, endedAtMs: 2500, status: "completed", resultSummary: "duration measured", evidenceRefs: ["quality/tests/current.json"] });
      const session = buildWorkflowHubSessionInput({ cwd: state.cwd, stage: "build-code" });
      expect(session).toMatchObject({ status: "present", source_ref: `codex-session-${state.sessionId}` });
      expect(session.events[0]).toMatchObject({ subject_id: "run-tests", status: "completed", started_at_ms: 1000, ended_at_ms: 2500 });
      expect(session.events[0].usage).toBeUndefined();
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("does not discard a known transcript when a later hook omits it", () => {
    const state = fixture();
    try {
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.rollout, cwd: state.cwd, home: state.home, observedAtMs: 0 });
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: null, cwd: state.cwd, home: state.home, observedAtMs: 1 });
      bind(state);
      expect(buildWorkflowHubSessionInput({ cwd: state.cwd, stage: "build-code" })).toMatchObject({
        status: "present",
        source_ref: `codex-rollout-${state.sessionId}`,
      });
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("runs the same private commands that workflow skills use", () => {
    const state = fixture();
    const hook = join(process.cwd(), "tools", "host", "workflowhub-codex-session-hook.mjs");
    const event = join(process.cwd(), "tools", "host", "workflowhub-codex-session-event.mjs");
    try {
      const hookResult = spawnSync(process.execPath, [hook], {
        cwd: state.cwd,
        input: JSON.stringify({ hook_event_name: "SessionStart", session_id: state.sessionId, transcript_path: state.rollout, cwd: state.cwd }),
        encoding: "utf8",
        env: { ...process.env, HOME: state.home },
      });
      expect(hookResult.status).toBe(0);
      expect(JSON.parse(readFileSync(sessionHandoffPath(state.cwd), "utf8")).sessions).toHaveLength(1);
      bind(state);
      expect(buildWorkflowHubSessionInput({ cwd: state.cwd, stage: "build-code" }).status).toBe("present");
      const eventEnv = { ...process.env, HOME: state.home, CODEX_SESSION_ID: state.sessionId, CODEX_THREAD_ID: "session-other-thread-456" };
      const rejected = spawnSync(process.execPath, [event, "start", "--stage=make-decision", "--subject-kind=skill", "--subject-id=make-decision"], { cwd: state.cwd, encoding: "utf8", env: eventEnv });
      expect(rejected.status).toBe(1);
      expect(rejected.stderr).toMatch(/make-decision skill is not declared/i);
      const start = spawnSync(process.execPath, [event, "start", "--stage=build-code", "--subject-kind=skill", "--subject-id=backend-testing"], { cwd: state.cwd, encoding: "utf8", env: eventEnv });
      expect(start.status, start.stderr).toBe(0);
      const finish = spawnSync(process.execPath, [event, "finish", "--stage=build-code", "--subject-kind=skill", "--subject-id=backend-testing", "--status=not_applicable", "--reason=本次改动不是后端行为", "--trigger=false", "--executed=false"], { cwd: state.cwd, encoding: "utf8", env: eventEnv });
      expect(finish.status, finish.stderr).toBe(0);
      expect(buildWorkflowHubSessionInput({ taskId: state.taskId, cwd: state.cwd, stage: "build-code" }).events).toEqual([expect.objectContaining({ subject_kind: "skill", subject_id: "backend-testing", status: "not_applicable", trigger: false, executed: false })]);
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("fails closed when two sessions are active in one workspace", () => {
    const state = fixture();
    try {
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.rollout, cwd: state.cwd, home: state.home });
      registerCodexSession({ sessionId: "session-auto-test-456", transcriptPath: state.rollout, cwd: state.cwd, home: state.home });
      expect(buildWorkflowHubSessionInput({ taskId: state.taskId, cwd: state.cwd, stage: "build-code" }).status).toBe("conflict");
      expect(readCurrentCodexSession({ cwd: state.cwd, sessionId: state.sessionId })).toMatchObject({ status: "present", session_id: state.sessionId });
      expect(() => startCodexSessionEvent({ taskId: state.taskId, stage: "build-code", subjectKind: "step", subjectId: "run-tests", cwd: state.cwd })).toThrow(/multiple active|conflict/i);
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("does not mix events or spec analysis from another task in the same session", () => {
    const state = fixture();
    try {
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.rollout, cwd: state.cwd, home: state.home, observedAtMs: 0 });
      bind(state, "task-alpha");
      startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "alpha-step", cwd: state.cwd, startedAtMs: 1000 });
      finishCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "alpha-step", cwd: state.cwd, endedAtMs: 2000, status: "completed", resultSummary: "alpha" });
      expect(() => startCodexSessionEvent({ taskId: "task-beta", stage: "build-code", subjectKind: "step", subjectId: "beta-step", cwd: state.cwd, startedAtMs: 3000 })).toThrow(/does not match|switch/i);
      const alpha = buildWorkflowHubSessionInput({ cwd: state.cwd, stage: "build-code" });
      expect(alpha.events).toEqual([expect.objectContaining({ subject_id: "alpha-step" })]);
      expect(alpha.events).not.toEqual(expect.arrayContaining([expect.objectContaining({ subject_id: "beta-step" })]));
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("projects only the requested stage in chronological lifecycle order", () => {
    const state = fixture();
    try {
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.rollout, cwd: state.cwd, home: state.home, observedAtMs: 0 });
      bind(state);
      startCodexSessionEvent({ stage: "build-spec", subjectKind: "step", subjectId: "read-decision-log", cwd: state.cwd, startedAtMs: 3000 });
      finishCodexSessionEvent({ stage: "build-spec", subjectKind: "step", subjectId: "read-decision-log", cwd: state.cwd, endedAtMs: 4000, status: "completed" });
      startCodexSessionEvent({ stage: "build-spec", subjectKind: "step", subjectId: "conditional-spec-research", cwd: state.cwd, startedAtMs: 1000 });
      finishCodexSessionEvent({ stage: "build-spec", subjectKind: "step", subjectId: "conditional-spec-research", cwd: state.cwd, endedAtMs: 2000, status: "skipped", reason: "没有新增研究问题" });
      startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "run-tests", cwd: state.cwd, startedAtMs: 5000 });
      finishCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "run-tests", cwd: state.cwd, endedAtMs: 6000, status: "completed" });

      const session = buildWorkflowHubSessionInput({ taskId: state.taskId, cwd: state.cwd, stage: "build-spec" });
      expect(session.events.map((entry) => entry.subject_id)).toEqual(["conditional-spec-research", "read-decision-log"]);
      expect(session.events.every((entry) => entry.stage === "build-spec")).toBe(true);
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("does not claim a task is completed when its current task has no lifecycle events", () => {
    const state = fixture();
    try {
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.rollout, cwd: state.cwd, home: state.home });
      bind(state);
      const session = buildWorkflowHubSessionInput({ cwd: state.cwd, stage: "build-code" });
      expect(session).toMatchObject({ status: "present", status_value: "incomplete", events: [], spec_analyze: null });
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("keeps a task incomplete when a lifecycle event ended with a non-completed status", () => {
    const state = fixture();
    try {
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.rollout, cwd: state.cwd, home: state.home });
      bind(state);
      startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "run-tests", cwd: state.cwd, startedAtMs: 1000 });
      finishCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "run-tests", cwd: state.cwd, endedAtMs: 2000, status: "failed", reason: "真实测试失败" });
      const session = buildWorkflowHubSessionInput({ cwd: state.cwd, stage: "build-code" });
      expect(session.status_value).toBe("incomplete");
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("projects only the repaired terminal lifecycle while retaining its failed predecessor", () => {
    const state = fixture();
    try {
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.rollout, cwd: state.cwd, home: state.home });
      bind(state);
      startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "run-tests", cwd: state.cwd, startedAtMs: 1000 });
      finishCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "run-tests", cwd: state.cwd, endedAtMs: 2000, status: "failed", reason: "首次测试失败" });
      startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "run-tests", cwd: state.cwd, startedAtMs: 3000 });
      finishCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "run-tests", cwd: state.cwd, endedAtMs: 4000, status: "completed", resultSummary: "修复后测试通过" });
      recordCodexSessionSpecAnalyze({ stage: "build-code", value: { marker: "repaired" }, cwd: state.cwd });

      const raw = readCurrentCodexSession({ cwd: state.cwd, stage: "build-code", sessionId: state.sessionId });
      expect(raw.events).toHaveLength(2);
      expect(raw.events.map((entry) => entry.status)).toEqual(["failed", "completed"]);

      const session = buildWorkflowHubSessionInput({ cwd: state.cwd, stage: "build-code" });
      expect(session).toMatchObject({ status_value: "completed" });
      expect(session.events).toEqual([expect.objectContaining({ subject_id: "run-tests", status: "completed", result_summary: "修复后测试通过" })]);
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("keeps a repaired subject incomplete while its newer lifecycle is still open", () => {
    const state = fixture();
    try {
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.rollout, cwd: state.cwd, home: state.home });
      bind(state);
      startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "run-tests", cwd: state.cwd, startedAtMs: 1000 });
      finishCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "run-tests", cwd: state.cwd, endedAtMs: 2000, status: "completed" });
      recordCodexSessionSpecAnalyze({ stage: "build-code", value: { marker: "first-pass" }, cwd: state.cwd });
      startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "run-tests", cwd: state.cwd, startedAtMs: 3000 });

      const session = buildWorkflowHubSessionInput({ cwd: state.cwd, stage: "build-code" });
      expect(session).toMatchObject({ status_value: "incomplete" });
      expect(session.events).toEqual([expect.objectContaining({ subject_id: "run-tests", status: "completed" })]);
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("requires the bound task and keeps spec analysis separated by stage", () => {
    const state = fixture();
    try {
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.rollout, cwd: state.cwd, home: state.home });
      expect(() => startCodexSessionEvent({ stage: "build-code", subjectKind: "step", subjectId: "run-tests", cwd: state.cwd })).toThrow(/no active task binding/i);
      bind(state);
      recordCodexSessionSpecAnalyze({ stage: "make-decision", value: { marker: "decision" }, cwd: state.cwd });
      recordCodexSessionSpecAnalyze({ stage: "build-code", value: { marker: "code" }, cwd: state.cwd });
      expect(buildWorkflowHubSessionInput({ cwd: state.cwd, stage: "make-decision" }).spec_analyze).toEqual({ marker: "decision" });
      expect(buildWorkflowHubSessionInput({ cwd: state.cwd, stage: "build-code" }).spec_analyze).toEqual({ marker: "code" });
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });
});
