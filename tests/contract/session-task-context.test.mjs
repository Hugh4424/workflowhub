import { describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, realpathSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  bindCodexSessionTask,
  buildWorkflowHubSessionInput,
  finishCodexSessionEvent,
  registerCodexSession,
  sessionHandoffPath,
  startCodexSessionEvent,
} from "../../tools/host/workflowhub-codex-session-state.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-session-task-context-"));
  const cwd = join(root, "workspace");
  const oldTaskPath = join(root, "old-task");
  const targetTaskPath = join(root, "target-task");
  mkdirSync(cwd, { recursive: true });
  mkdirSync(oldTaskPath);
  mkdirSync(targetTaskPath);
  mkdirSync(join(cwd, "workflows", "verify-code"), { recursive: true });
  writeFileSync(
    join(cwd, "workflows", "verify-code", "steps.json"),
    readFileSync(join(process.cwd(), "workflows", "verify-code", "steps.json")),
  );
  writeFileSync(
    join(cwd, "workflows", "verify-code", "skill-deps.yaml"),
    readFileSync(join(process.cwd(), "workflows", "verify-code", "skill-deps.yaml")),
  );
  return {
    root,
    cwd,
    oldTaskPath,
    targetTaskPath,
    sessionId: `session-task-context-${process.pid}-${Date.now()}`,
  };
}

describe("WorkflowHub session task context selection", () => {
  it("allows explicit target selection in a reused session without mixing task events", () => {
    const state = fixture();
    try {
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: null, cwd: state.cwd, observedAtMs: 0 });
      bindCodexSessionTask({
        projectName: "workflowhub",
        taskId: "old-task",
        taskPath: state.oldTaskPath,
        cwd: state.cwd,
        sessionId: state.sessionId,
        boundAtMs: 1,
      });
      startCodexSessionEvent({
        taskId: "old-task",
        stage: "verify-code",
        subjectKind: "step",
        subjectId: "read-current-materials-and-code",
        cwd: state.cwd,
        sessionId: state.sessionId,
        startedAtMs: 10,
      });
      finishCodexSessionEvent({
        taskId: "old-task",
        stage: "verify-code",
        subjectKind: "step",
        subjectId: "read-current-materials-and-code",
        cwd: state.cwd,
        sessionId: state.sessionId,
        endedAtMs: 20,
      });

      const selected = bindCodexSessionTask({
        projectName: "workflowhub",
        taskId: "target-task",
        taskPath: state.targetTaskPath,
        cwd: state.cwd,
        sessionId: state.sessionId,
        boundAtMs: 30,
      });
      expect(selected).toMatchObject({
        status: "bound",
        task_binding: { task_id: "target-task", task_path: realpathSync(state.targetTaskPath) },
      });
      const persistedAfterSelection = JSON.parse(readFileSync(sessionHandoffPath(state.cwd), "utf8"));
      expect(persistedAfterSelection.sessions[0].task_binding).toMatchObject({
        task_id: "target-task",
        task_path: realpathSync(state.targetTaskPath),
      });

      // A UserPromptSubmit hook may refresh the same session from an older
      // checkout.  Its legacy reader only preserves task_binding, so the
      // active selection must survive that refresh boundary.
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: null, cwd: state.cwd, observedAtMs: 35 });
      expect(buildWorkflowHubSessionInput({ cwd: state.cwd, stage: "verify-code", sessionId: state.sessionId })).toMatchObject({
        status: "present",
        task_id: "target-task",
      });

      startCodexSessionEvent({
        stage: "verify-code",
        subjectKind: "step",
        subjectId: "read-current-materials-and-code",
        cwd: state.cwd,
        sessionId: state.sessionId,
        startedAtMs: 40,
      });
      finishCodexSessionEvent({
        stage: "verify-code",
        subjectKind: "step",
        subjectId: "read-current-materials-and-code",
        cwd: state.cwd,
        sessionId: state.sessionId,
        endedAtMs: 50,
      });

      expect(buildWorkflowHubSessionInput({ taskId: "old-task", cwd: state.cwd, stage: "verify-code", sessionId: state.sessionId })).toMatchObject({
        status: "present",
        task_id: "old-task",
        events: [expect.objectContaining({ task_id: "old-task" })],
      });
      expect(buildWorkflowHubSessionInput({ taskId: "target-task", cwd: state.cwd, stage: "verify-code", sessionId: state.sessionId })).toMatchObject({
        status: "present",
        task_id: "target-task",
        events: [expect.objectContaining({ task_id: "target-task" })],
      });
      expect(buildWorkflowHubSessionInput({ cwd: state.cwd, stage: "verify-code", sessionId: state.sessionId })).toMatchObject({
        status: "present",
        task_id: "target-task",
        events: [expect.objectContaining({ task_id: "target-task" })],
      });
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("rejects an unselected task instead of accepting arbitrary session task ids", () => {
    const state = fixture();
    try {
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: null, cwd: state.cwd, observedAtMs: 0 });
      bindCodexSessionTask({
        projectName: "workflowhub",
        taskId: "target-task",
        taskPath: state.targetTaskPath,
        cwd: state.cwd,
        sessionId: state.sessionId,
        boundAtMs: 1,
      });
      expect(() => startCodexSessionEvent({
        taskId: "unselected-task",
        stage: "verify-code",
        subjectKind: "step",
        subjectId: "read-current-materials-and-code",
        cwd: state.cwd,
        sessionId: state.sessionId,
        startedAtMs: 10,
      })).toThrow(/task context|binding/i);
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });

  it("validates stage order only against the selected task context", () => {
    const state = fixture();
    try {
      registerCodexSession({ sessionId: state.sessionId, transcriptPath: null, cwd: state.cwd, observedAtMs: 0 });
      bindCodexSessionTask({
        projectName: "workflowhub",
        taskId: "old-task",
        taskPath: state.oldTaskPath,
        cwd: state.cwd,
        sessionId: state.sessionId,
        boundAtMs: 1,
      });
      startCodexSessionEvent({
        taskId: "old-task",
        stage: "verify-code",
        subjectKind: "step",
        subjectId: "read-current-materials-and-code",
        cwd: state.cwd,
        sessionId: state.sessionId,
        startedAtMs: 10,
      });

      bindCodexSessionTask({
        projectName: "workflowhub",
        taskId: "target-task",
        taskPath: state.targetTaskPath,
        cwd: state.cwd,
        sessionId: state.sessionId,
        boundAtMs: 20,
      });
      expect(() => startCodexSessionEvent({
        taskId: "target-task",
        stage: "verify-code",
        subjectKind: "step",
        subjectId: "read-current-materials-and-code",
        cwd: state.cwd,
        sessionId: state.sessionId,
        startedAtMs: 30,
      })).not.toThrow();
    } finally {
      rmSync(sessionHandoffPath(state.cwd), { force: true });
      rmSync(state.root, { recursive: true, force: true });
    }
  });
});
