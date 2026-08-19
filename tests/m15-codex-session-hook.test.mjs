import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

describe("WorkflowHub current Codex session handoff", () => {
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
        expect(session).toMatchObject({ status: "present", session_id: state.sessionId, task_id: state.taskId, status_value: "incomplete" });
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

  it("private event CLI uses CODEX_THREAD_ID when the stage cwd changes", () => {
    const state = fixture();
    const alternateCwd = join(state.root, "alternate-workspace");
    mkdirSync(alternateCwd, { recursive: true });
    const event = join(process.cwd(), "tools", "host", "workflowhub-codex-session-event.mjs");
    try {
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.rollout, cwd: state.cwd, home: state.home, observedAtMs: 0 });
      bind(state);
      const env = { ...process.env, HOME: state.home, CODEX_THREAD_ID: state.sessionId };
      const start = spawnSync(process.execPath, [event, "start", "--stage=build-plan", "--subject-kind=step", "--subject-id=plan-step"], {
        cwd: alternateCwd, encoding: "utf8", env,
      });
      expect(start.status, start.stderr).toBe(0);
      const finish = spawnSync(process.execPath, [event, "finish", "--stage=build-plan", "--subject-kind=step", "--subject-id=plan-step", "--status=completed"], {
        cwd: alternateCwd, encoding: "utf8", env,
      });
      expect(finish.status, finish.stderr).toBe(0);
      expect(buildWorkflowHubSessionInput({ taskId: state.taskId, cwd: alternateCwd, stage: "build-plan", sessionId: state.sessionId }).events).toEqual([
        expect.objectContaining({ subject_kind: "step", subject_id: "plan-step", status: "completed" }),
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
      const eventEnv = { ...process.env, HOME: state.home, CODEX_THREAD_ID: state.sessionId };
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
