import { describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { zstdCompressSync } from "node:zlib";

import {
  decompressZstdFrames,
  dshUserMessageText,
  isDshTranscriptPath,
  normalizeDshTranscript,
  readDshTranscriptText,
  snapshotDshRequirementMessages,
} from "../runtime/evidence/dsh-transcript.mjs";
import {
  bindCodexSessionTask,
  readCurrentCodexSession,
  registerCodexSession,
} from "../tools/host/workflowhub-codex-session-state.mjs";
import { resolveRequirementSource } from "../tools/cli/stage-runtime.mjs";
import { parseRegisteredRequirementTranscript } from "../runtime/evidence/codex-transcript-adapter.mjs";

function dshUserLine({ id, text, time, kind = "user" }) {
  return JSON.stringify({
    type: "user/message",
    seq: 1,
    time,
    data: {
      content: [{ type: "text", text }],
      ...(kind === "user" ? { source: { kind: "user", rpcId: "rpc-1" } } : { source: { kind } }),
      role: "user",
      id,
    },
  });
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-dsh-transcript-test-"));
  const home = join(root, "home");
  const cwd = join(root, "workspace");
  // Unique session id per fixture: the session locator is a shared-tmpdir
  // registry, and reusing an id across fixtures would resolve a stale
  // locator from an earlier test's handoff file.
  const sessionId = `session-dsh-test-${root.split("-").pop()}`;
  const transcript = join(home, ".dsh", "sessions", "--workspace--", sessionId, "session.jsonl.zstd");
  mkdirSync(cwd, { recursive: true });
  mkdirSync(join(home, ".dsh", "sessions", "--workspace--", sessionId), { recursive: true });
  const taskPath = join(root, "task");
  mkdirSync(taskPath, { recursive: true });
  return { root, home, cwd, sessionId, transcript, taskPath, taskId: "task-dsh-source" };
}

function writeTranscript(state, frames) {
  writeFileSync(state.transcript, Buffer.concat(frames.map((frame) => zstdCompressSync(Buffer.from(frame, "utf8")))));
  return state.transcript;
}

describe("dsh transcript zstd frame handling", () => {
  it("decompresses concatenated frames, not just the first one", () => {
    const one = zstdCompressSync(Buffer.from('{"a":1}\n'));
    const two = zstdCompressSync(Buffer.from('{"b":2}\n'));
    const three = zstdCompressSync(Buffer.from('{"c":3}\n'));
    const out = decompressZstdFrames(Buffer.concat([one, two, three])).toString("utf8");
    expect(out).toBe('{"a":1}\n{"b":2}\n{"c":3}\n');
  });

  it("ignores skippable frames and rejects truncated data", () => {
    const skippable = Buffer.alloc(12);
    skippable.writeUInt32LE(0x184d2a50, 0);
    skippable.writeUInt32LE(4, 4);
    skippable.writeUInt32LE(0xdeadbeef, 8);
    const frame = zstdCompressSync(Buffer.from("payload\n"));
    expect(decompressZstdFrames(Buffer.concat([skippable, frame])).toString("utf8")).toBe("payload\n");
    expect(() => decompressZstdFrames(Buffer.from([0x28, 0xb5]))).toThrow(/truncated|invalid/);
  });
});

describe("dsh user message extraction", () => {
  it("keeps only genuine user-typed messages", () => {
    expect(dshUserMessageText(JSON.parse(dshUserLine({ id: "m1", text: "真实需求", time: 100 })))).toBe("真实需求");
    expect(dshUserMessageText(JSON.parse(dshUserLine({ id: "m2", text: "plugin notice", time: 100, kind: "plugin" })))).toBeNull();
    expect(dshUserMessageText(JSON.parse(dshUserLine({ id: "m3", text: "agent instructions", time: 100, kind: "agent-instructions" })))).toBeNull();
    expect(dshUserMessageText(JSON.parse(dshUserLine({ id: "m4", text: "subagent", time: 100, kind: "subagent-report" })))).toBeNull();
  });

  it("freezes requirement messages at the binding time with content hashes", () => {
    const text = [
      dshUserLine({ id: "m1", text: "第一条需求", time: 100 }),
      dshUserLine({ id: "m2", text: "第二条需求", time: 200 }),
      dshUserLine({ id: "m3", text: "绑定后补充", time: 300 }),
      dshUserLine({ id: "m4", text: "插件噪音", time: 150, kind: "plugin" }),
    ].join("\n");
    const frozen = snapshotDshRequirementMessages(text, 200);
    expect(frozen).toEqual([
      { id: "m1", order: 1, content_hash: createHash("sha256").update("第一条需求").digest("hex") },
      { id: "m2", order: 2, content_hash: createHash("sha256").update("第二条需求").digest("hex") },
    ]);
  });
});

describe("dsh requirement authentication through the registered source", () => {
  it("normalizes frozen messages and passes collector authentication", () => {
    const state = fixture();
    const lines = [
      dshUserLine({ id: "m1", text: "第一条需求", time: 100 }),
      dshUserLine({ id: "m2", text: "第二条需求", time: 200 }),
    ].join("\n");
    const frozen = snapshotDshRequirementMessages(lines, 200);
    const normalized = normalizeDshTranscript(lines, {
      taskId: state.taskId,
      runId: "run-1",
      stage: "make-decision",
      sessionId: state.sessionId,
      requirementMessages: frozen,
    });
    expect(normalized.split("\n")).toHaveLength(2);
    const emitted = JSON.parse(normalized.split("\n")[0]);
    expect(emitted.type).toBe("requirement_message");
    expect(emitted.content).toBe("第一条需求");
  });

  it("emits an honest empty-content record when a frozen message left the transcript", () => {
    const frozen = snapshotDshRequirementMessages(dshUserLine({ id: "m1", text: "需求", time: 100 }), 100);
    const normalized = normalizeDshTranscript("", {
      taskId: "task", runId: "run", sessionId: "s", requirementMessages: frozen,
    });
    const emitted = JSON.parse(normalized);
    expect(emitted.content).toBe("");
    expect(emitted.content_hash).toBe(frozen[0].content_hash);
  });
});

describe("dsh host session binding and requirement source", () => {
  it("registers a dsh transcript path and snapshots requirements at bind time", () => {
    const state = fixture();
    writeTranscript(state, [
      `${dshUserLine({ id: "m1", text: "开工需求", time: 100 })}\n`,
      `${dshUserLine({ id: "m2", text: "绑定后消息", time: 999999 })}\n`,
    ]);
    registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.transcript, cwd: state.cwd, home: state.home, observedAtMs: 0 });
    const bound = bindCodexSessionTask({ projectName: "workflowhub", taskId: state.taskId, taskPath: state.taskPath, cwd: state.cwd, boundAtMs: 500 });
    expect(bound.status).toBe("bound");
    expect(bound.task_binding.requirement_messages).toEqual([
      { id: "m1", order: 1, content_hash: createHash("sha256").update("开工需求").digest("hex") },
    ]);
  });

  it("repairs an empty frozen snapshot once an authentic transcript is registered", () => {
    const state = fixture();
    registerCodexSession({ sessionId: state.sessionId, transcriptPath: null, cwd: state.cwd, home: state.home, observedAtMs: 0 });
    const bound = bindCodexSessionTask({ projectName: "workflowhub", taskId: state.taskId, taskPath: state.taskPath, cwd: state.cwd, boundAtMs: 500 });
    expect(bound.task_binding.requirement_messages).toEqual([]);
    writeTranscript(state, [`${dshUserLine({ id: "m1", text: "开工需求", time: 100 })}\n`]);
    registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.transcript, cwd: state.cwd, home: state.home, observedAtMs: 1 });
    const rebound = bindCodexSessionTask({ projectName: "workflowhub", taskId: state.taskId, taskPath: state.taskPath, cwd: state.cwd, boundAtMs: 600 });
    expect(rebound.status).toBe("already_bound");
    expect(rebound.task_binding.requirement_messages).toEqual([
      { id: "m1", order: 1, content_hash: createHash("sha256").update("开工需求").digest("hex") },
    ]);
  });

  it("authenticates requirement messages via resolveRequirementSource", () => {
    const state = fixture();
    writeTranscript(state, [`${dshUserLine({ id: "m1", text: "开工需求", time: 100 })}\n`]);
    registerCodexSession({ sessionId: state.sessionId, transcriptPath: state.transcript, cwd: state.cwd, home: state.home, observedAtMs: 0 });
    const bound = bindCodexSessionTask({ projectName: "workflowhub", taskId: state.taskId, taskPath: state.taskPath, cwd: state.cwd, boundAtMs: 500 });
    const source = resolveRequirementSource({
      task_id: state.taskId,
      run_id: "run-1",
      stage: "make-decision",
      env: { CODEX_SESSION_ID: state.sessionId },
      home: state.home,
      cwd: state.cwd,
    });
    expect(source?.adapter_version).toBe("dsh-transcript-adapter.v1");
    const result = parseRegisteredRequirementTranscript(source, { stage: "make-decision" });
    expect(result.status).toBe("present");
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].content_hash).toBe(bound.task_binding.requirement_messages[0].content_hash);
  });
});
