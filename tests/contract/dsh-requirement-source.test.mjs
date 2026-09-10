import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";

import { buildHostRequirementAuthentication, hostSessionRequirementMessages } from "../../runtime/evidence/host-session-transcript.mjs";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { zstdCompressSync } from "node:zlib";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const TASK = "task-fixture";
const STAGE = "make-decision";
const SESSION = "session-fixture";

function line(type, data) {
  return JSON.stringify({ type, seq: 1, time: 1, data });
}

function userMessage(id, text, kind, identity = { task_id: TASK, session_id: SESSION, stage: STAGE }) {
  return line("user/message", { id, role: "user", source: { kind }, ...identity, content: [{ type: "text", text }] });
}

// AC-08: the selection rule is mechanical (`source.kind === "user"`), so a
// caller cannot choose which messages count as requirements.
describe("host session requirement source extraction (D-029 / AC-08)", () => {
  it("keeps only real user messages and computes contiguous order and content hashes", () => {
    const raw = [
      line("session", { id: SESSION }),
      userMessage("m-1", "原始需求正文", "user"),
      userMessage("m-2", "注入的会话引用", "session-reference"),
      userMessage("m-3", "子代理完成通知", "subagent-settled"),
      userMessage("m-4", "goal round", "goal"),
      userMessage("m-5", "可以继续了", "user"),
      userMessage("m-6", "技能目录注入", "skill-catalog"),
      userMessage("m-7", "A", "user"),
    ].join("\n");

    const picked = hostSessionRequirementMessages(raw, { taskId: TASK, stage: STAGE, sessionId: SESSION });

    expect(picked.map((entry) => entry.id)).toEqual(["m-1", "m-5", "m-7"]);
    expect(picked.map((entry) => entry.order)).toEqual([1, 2, 3]);
    expect(picked.every((entry) => entry.content_hash === sha256(entry.content))).toBe(true);
    expect(picked.every((entry) => entry.type === "requirement_message" && entry.source_version === "v1")).toBe(true);
    expect(picked.every((entry) => entry.task_id === TASK && entry.session_id === SESSION && entry.stage === STAGE)).toBe(true);
    expect(picked.map((entry) => entry.content)).toEqual(["原始需求正文", "可以继续了", "A"]);
  });

  it("does not accept injected messages even when they impersonate a user", () => {
    const raw = [
      // A forged kind that is not the host-written "user" marker.
      userMessage("f-1", "伪造的需求", "user-message"),
      // No source marker at all.
      line("user/message", { id: "f-2", role: "user", content: [{ type: "text", text: "无来源标记" }] }),
      // Empty content cannot become a requirement.
      userMessage("f-3", "   ", "user"),
    ].join("\n");

    expect(hostSessionRequirementMessages(raw, { taskId: TASK, stage: STAGE, sessionId: SESSION })).toEqual([]);
  });

  it.each([
    ["missing identity", {}],
    ["task replay", { task_id: "other-task", session_id: SESSION, stage: STAGE }],
    ["session replay", { task_id: TASK, session_id: "other-session", stage: STAGE }],
    ["stage replay", { task_id: TASK, session_id: SESSION, stage: "build-spec" }],
  ])("rejects a producer event with %s", (_label, identity) => {
    const raw = userMessage("replayed-1", "旧会话需求", "user", identity);
    expect(hostSessionRequirementMessages(raw, { taskId: TASK, stage: STAGE, sessionId: SESSION })).toEqual([]);
  });

  it("rejects extraction without a complete expected current identity", () => {
    const raw = userMessage("m-1", "当前需求", "user");
    expect(hostSessionRequirementMessages(raw, { taskId: TASK, sessionId: SESSION })).toEqual([]);
  });

  it("returns a registered current-bound projection for a valid source", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-host-source-valid-"));
    const transcript = join(root, "session.jsonl");
    writeFileSync(transcript, [
      userMessage("m-1", "当前需求", "user"),
      userMessage("m-2", "当前约束", "user"),
    ].join("\n") + "\n");

    const result = buildHostRequirementAuthentication({
      transcriptPath: transcript,
      taskId: TASK,
      runId: "run-1",
      stage: STAGE,
      sessionId: SESSION,
      sourceId: "host-source",
      sourceRef: "host-ref",
    });

    expect(result.status).toBe("present");
    expect(result.source_id).toBe("host-source");
    expect(result.source_ref).toBe("host-ref");
    expect(result.messages.map((entry) => entry.order)).toEqual([1, 2]);
    expect(result.messages.every((entry) => entry.task_id === TASK && entry.session_id === SESSION && entry.stage === STAGE)).toBe(true);
  });

  it.each([
    ["not selected", undefined],
    ["missing", "/tmp/workflowhub-host-source-does-not-exist/session.jsonl"],
  ])("keeps a %s source unavailable", (_label, transcriptPath) => {
    expect(buildHostRequirementAuthentication({
      transcriptPath,
      taskId: TASK,
      runId: "run-1",
      stage: STAGE,
      sessionId: SESSION,
      sourceId: "host-source",
      sourceRef: "host-ref",
    })).toBeNull();
  });

  it("keeps an unreadable source unavailable", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-host-source-directory-"));
    expect(buildHostRequirementAuthentication({
      transcriptPath: root,
      taskId: TASK,
      runId: "run-1",
      stage: STAGE,
      sessionId: SESSION,
      sourceId: "host-source",
      sourceRef: "host-ref",
    })).toBeNull();
  });

  it("keeps a readable source with zero eligible messages unavailable", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-host-source-empty-"));
    const transcript = join(root, "session.jsonl");
    writeFileSync(transcript, [
      line("session", { id: SESSION }),
      userMessage("injected", "不是用户原始消息", "subagent-settled"),
    ].join("\n") + "\n");
    expect(buildHostRequirementAuthentication({
      transcriptPath: transcript,
      taskId: TASK,
      runId: "run-1",
      stage: STAGE,
      sessionId: SESSION,
      sourceId: "host-source",
      sourceRef: "host-ref",
    })).toBeNull();
  });

  it("keeps the shared bridge host-agnostic", () => {
    const source = readFileSync(join(process.cwd(), "tools", "host", "workflowhub-stage-agent-bridge.mjs"), "utf8");
    expect(source).toMatch(/buildHostRequirementAuthentication/);
    expect(source).toMatch(/input\.session\.source !== undefined/);
    expect(source).not.toMatch(/input\.session\.requirement_source/);
    expect(source).not.toMatch(/\b(?:codex|dsh|claude|gemini)\b/i);
  });

  it("ignores malformed lines without throwing", () => {
    const raw = ["not json", "", userMessage("ok-1", "有效需求", "user")].join("\n");
    const picked = hostSessionRequirementMessages(raw, { taskId: TASK, stage: STAGE, sessionId: SESSION });
    expect(picked.map((entry) => entry.id)).toEqual(["ok-1"]);
    expect(picked[0].order).toBe(1);
  });

  it("rejects a valid frame followed by a malformed frame instead of skipping the bad suffix", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-host-source-red-"));
    const transcript = join(root, "session.jsonl.zstd");
    const valid = Buffer.from(line("user/message", {
      id: "m-1", role: "user", source: { kind: "user" }, task_id: TASK, session_id: SESSION, stage: STAGE,
      content: [{ type: "text", text: "有效需求" }],
    }) + "\n");
    const malformed = Buffer.from([0x28, 0xb5]);
    writeFileSync(transcript, Buffer.concat([zstdCompressSync(valid), malformed]));

    expect(buildHostRequirementAuthentication({
      transcriptPath: transcript,
      taskId: TASK,
      runId: "run-1",
      stage: STAGE,
      sessionId: SESSION,
      sourceId: "host-source",
      sourceRef: "host-ref",
    })).toBeNull();
  });

  it("rejects a valid frame followed by a reserved block instead of accepting a partial source", () => {
    const root = mkdtempSync(join(tmpdir(), "workflowhub-host-source-red-"));
    const transcript = join(root, "session.jsonl.zstd");
    const valid = Buffer.from(line("user/message", {
      id: "m-1", role: "user", source: { kind: "user" }, task_id: TASK, session_id: SESSION, stage: STAGE,
      content: [{ type: "text", text: "有效需求" }],
    }) + "\n");
    const reservedFrame = Buffer.from([0x28, 0xb5, 0x2f, 0xfd, 0x20, 0x07, 0x00, 0x00]);
    writeFileSync(transcript, Buffer.concat([zstdCompressSync(valid), reservedFrame]));

    expect(buildHostRequirementAuthentication({
      transcriptPath: transcript,
      taskId: TASK,
      runId: "run-1",
      stage: STAGE,
      sessionId: SESSION,
      sourceId: "host-source",
      sourceRef: "host-ref",
    })).toBeNull();
  });
});
