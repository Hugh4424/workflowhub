import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, resolve } from "node:path";
import { zstdDecompressSync } from "node:zlib";

/**
 * DSH (DeepSeek Harness) transcript support.
 *
 * DSH persists each session as `<home>/.dsh/sessions/<cwd-key>/<session-id>/session.jsonl.zstd`:
 * a JSONL event log appended over time as concatenated zstd frames.  Node's
 * one-shot and streaming zstd APIs both stop at the first frame, so this
 * module walks the zstd frame format explicitly and decompresses frame by
 * frame.  User requirements are authenticated the same way as the Codex
 * rollout path: the binding freezes {id, order, content_hash}, and the
 * registered source re-reads the authentic transcript and re-derives content
 * for hash verification.  Nothing here writes or rewrites transcript bytes.
 */

const ZSTD_MAGIC = 0xfd2fb528;
const SKIPPABLE_MAGIC_MASK = 0xfffffff0;
const SKIPPABLE_MAGIC = 0x184d2a50;

function frameLength(buffer, offset) {
  if (offset + 4 > buffer.length) throw new Error("truncated zstd frame magic");
  const magic = buffer.readUInt32LE(offset);
  if ((magic & SKIPPABLE_MAGIC_MASK) === SKIPPABLE_MAGIC) {
    if (offset + 8 > buffer.length) throw new Error("truncated zstd skippable frame");
    return 8 + buffer.readUInt32LE(offset + 4);
  }
  if (magic !== ZSTD_MAGIC) throw new Error(`invalid zstd frame magic at offset ${offset}`);
  let cursor = offset + 4;
  if (cursor >= buffer.length) throw new Error("truncated zstd frame header");
  const descriptor = buffer.readUInt8(cursor);
  cursor += 1;
  const fcsFlag = descriptor >> 6;
  const singleSegment = (descriptor & 0x20) !== 0;
  const checksumFlag = (descriptor & 0x04) !== 0;
  const didFlag = descriptor & 0x03;
  if (!singleSegment) cursor += 1; // Window_Descriptor
  cursor += [0, 1, 2, 4][didFlag];
  cursor += fcsFlag === 0 ? (singleSegment ? 1 : 0) : [0, 1, 2, 4][fcsFlag];
  if (cursor > buffer.length) throw new Error("truncated zstd frame header fields");
  while (true) {
    if (cursor + 3 > buffer.length) throw new Error("truncated zstd block header");
    const blockHeader = buffer.readUIntLE(cursor, 3);
    cursor += 3;
    const lastBlock = (blockHeader & 0x01) !== 0;
    const blockType = (blockHeader >> 1) & 0x03;
    const blockSize = blockHeader >>> 3;
    if (blockType === 3) throw new Error("reserved zstd block type");
    cursor += blockType === 1 ? 1 : blockSize;
    if (cursor > buffer.length) throw new Error("truncated zstd block payload");
    if (lastBlock) break;
  }
  if (checksumFlag) cursor += 4;
  return cursor - offset;
}

/** Decompress a buffer of one or more concatenated zstd frames. */
export function decompressZstdFrames(buffer) {
  if (!Buffer.isBuffer(buffer)) throw new TypeError("zstd input must be a Buffer");
  const parts = [];
  let offset = 0;
  while (offset < buffer.length) {
    const length = frameLength(buffer, offset);
    const frame = buffer.subarray(offset, offset + length);
    const magic = frame.readUInt32LE(0);
    if ((magic & SKIPPABLE_MAGIC_MASK) !== SKIPPABLE_MAGIC) parts.push(zstdDecompressSync(frame));
    offset += length;
  }
  return Buffer.concat(parts);
}

export function dshSessionsRoot(home = homedir()) {
  return resolve(home, ".dsh", "sessions");
}

/**
 * A DSH transcript must live at <home>/.dsh/sessions/<cwd-key>/<session-dir>/session.jsonl.zstd.
 * When sessionId is given, the parent directory must name that session.
 */
export function isDshTranscriptPath(candidate, { home = homedir(), sessionId = null } = {}) {
  if (typeof candidate !== "string" || candidate.trim() === "") return null;
  const target = resolve(candidate);
  const root = dshSessionsRoot(home);
  if (!isAbsolute(target) || !target.startsWith(`${root}/`)) return null;
  if (basename(target) !== "session.jsonl.zstd") return null;
  if (sessionId !== null && basename(dirname(target)) !== sessionId) return null;
  return target;
}

/**
 * Shape-only check for already-validated paths (e.g. a transcript_path read
 * back from the session handoff, which was validated at registration time).
 * Registration and locate boundaries must keep using isDshTranscriptPath.
 */
export function looksLikeDshTranscriptPath(candidate) {
  if (typeof candidate !== "string" || !isAbsolute(candidate)) return false;
  return basename(candidate) === "session.jsonl.zstd"
    && candidate.split("/").slice(-5, -3).join("/") === ".dsh/sessions";
}

export function readDshTranscriptText(path) {
  return decompressZstdFrames(readFileSync(path)).toString("utf8");
}

/**
 * Only genuine user-typed messages are requirement candidates.  Plugin
 * notices, agent instructions, skill catalogs, and subagent relays all arrive
 * as user-role messages in DSH but are host-generated context, not user
 * requirements; they carry data.source.kind values other than "user".
 */
export function dshUserMessageText(outer) {
  const data = outer?.data;
  if (outer?.type !== "user/message" || data?.role !== "user" || data?.source?.kind !== "user") return null;
  if (!Array.isArray(data.content)) return null;
  const parts = data.content
    .filter((part) => part?.type === "text" && typeof part.text === "string" && part.text.trim() !== "")
    .map((part) => part.text);
  return parts.length > 0 ? parts.join("\n") : null;
}

export function dshUserMessageId(outer, lineIndex) {
  const candidate = outer?.data?.id;
  return typeof candidate === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(candidate)
    ? candidate
    : `dsh-user-${lineIndex + 1}`;
}

function dshUserMessageTime(outer) {
  const value = outer?.time;
  return Number.isSafeInteger(value) ? value : null;
}

function* dshUserMessages(text) {
  const usedIds = new Set();
  for (const [lineIndex, line] of String(text).split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    let outer;
    try { outer = JSON.parse(line); }
    catch { continue; }
    const content = dshUserMessageText(outer);
    if (content === null) continue;
    let id = dshUserMessageId(outer, lineIndex);
    if (usedIds.has(id)) id = `dsh-user-${lineIndex + 1}`;
    usedIds.add(id);
    yield { id, content, time: dshUserMessageTime(outer) };
  }
}

/** Freeze {id, order, content_hash} for genuine user messages at or before boundAtMs. */
export function snapshotDshRequirementMessages(text, boundAtMs) {
  if (!Number.isSafeInteger(boundAtMs)) return [];
  const messages = [];
  for (const message of dshUserMessages(text)) {
    if (message.time === null || message.time > boundAtMs) continue;
    messages.push(Object.freeze({
      id: message.id,
      order: messages.length + 1,
      content_hash: createHash("sha256").update(message.content).digest("hex"),
    }));
  }
  return messages;
}

function selectedDshRequirementMessages(value) {
  if (!Array.isArray(value)) return [];
  const messages = [];
  const ids = new Set();
  for (const [index, message] of value.entries()) {
    if (!message || typeof message !== "object" || Array.isArray(message)
      || typeof message.id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(message.id)
      || ids.has(message.id)
      || message.order !== index + 1
      || !/^[a-f0-9]{64}$/.test(message.content_hash ?? "")) return [];
    ids.add(message.id);
    messages.push(message);
  }
  return messages;
}

/**
 * Normalize a DSH transcript into requirement_message JSONL records bound to
 * the frozen binding snapshot.  Mirrors the Codex rollout contract: only
 * frozen ids are emitted, content is re-derived from the authentic
 * transcript, and a frozen message missing from the transcript is emitted
 * with empty content so the hash check fails honestly instead of dropping
 * the requirement.
 */
export function normalizeDshTranscript(text, { taskId, runId, attemptId = null, stage = null, sessionId, requirementMessages = [] } = {}) {
  const selected = selectedDshRequirementMessages(requirementMessages);
  const selectedById = new Map(selected.map((message) => [message.id, message]));
  const emitted = new Set();
  const records = [];
  const common = {
    task_id: taskId,
    run_id: runId,
    stage,
    ...(attemptId ? { attempt_id: attemptId } : {}),
  };
  for (const message of dshUserMessages(text)) {
    const frozen = selectedById.get(message.id);
    if (!frozen) continue;
    records.push(JSON.stringify({
      id: frozen.id,
      type: "requirement_message",
      ...common,
      session_id: sessionId,
      source_version: "v1",
      order: frozen.order,
      content: message.content,
      content_hash: frozen.content_hash,
    }));
    emitted.add(frozen.id);
  }
  for (const message of selected) {
    if (emitted.has(message.id)) continue;
    records.push(JSON.stringify({
      id: message.id,
      type: "requirement_message",
      ...common,
      session_id: sessionId,
      source_version: "v1",
      order: message.order,
      content: "",
      content_hash: message.content_hash,
    }));
  }
  return records.join("\n");
}
