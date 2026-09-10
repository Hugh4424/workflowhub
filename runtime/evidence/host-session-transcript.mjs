import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

import { createRegisteredCodexSource, parseRegisteredRequirementTranscript } from "./codex-transcript-adapter.mjs";
import { createTranscriptSourceReader } from "./fact-collector.mjs";
import { readDshTranscriptText } from "./dsh-transcript.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

/**
 * Host session transcript contract (host-agnostic).
 *
 * A host session log is a JSONL event stream. A requirement message is an
 * event whose `type` is `user/message` and whose host-written
 * `data.source.kind` is exactly `user`. Injected content — agent and subagent
 * notifications, goal rounds, plugin context, session references and
 * instruction blocks — carries other kinds and is never accepted.
 *
 * Selection is mechanical: the caller cannot choose which messages count as
 * requirements. Missing transcript, unreadable transcript, or zero matching
 * messages all stay `null`/empty and are never replaced by a fabricated
 * projection.
 */
export function hostSessionRequirementMessages(raw, { taskId, stage, sessionId } = {}) {
  const expectedIdentity = [taskId, stage, sessionId];
  if (expectedIdentity.some((value) => typeof value !== "string" || value.trim() === "")) return [];
  const picked = [];
  for (const line of String(raw ?? "").split(/\r?\n/)) {
    if (!line.trim()) continue;
    let value;
    try { value = JSON.parse(line); } catch { continue; }
    if (value?.type !== "user/message") continue;
    const data = value.data ?? {};
    if (data?.source?.kind !== "user") continue;
    // Identity must come from the producer-owned transcript event.  The
    // descriptor only supplies the expected current identity; it cannot turn
    // an unbound or replayed event into a current requirement message.
    if (data.task_id !== taskId || data.session_id !== sessionId || data.stage !== stage) continue;
    const content = Array.isArray(data.content)
      ? data.content.map((part) => part?.text ?? "").join("")
      : String(data.content ?? "");
    if (content.trim() === "" || typeof data.id !== "string" || data.id.trim() === "") continue;
    picked.push({
      id: data.id,
      type: "requirement_message",
      source_version: "v1",
      task_id: data.task_id,
      session_id: data.session_id,
      stage: data.stage,
      order: picked.length + 1,
      content,
      content_hash: sha256(content),
    });
  }
  return picked;
}

/** Read a host session transcript, transparently handling `.zstd`. */
export function readHostSessionTranscript(path) {
  if (typeof path !== "string" || path.trim() === "" || !existsSync(path)) return null;
  try {
    return path.endsWith(".zstd") ? readDshTranscriptText(path) : readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

/**
 * Build the host-authenticated requirement projection from a session
 * transcript. Returns `null` whenever the projection cannot be produced; the
 * caller must keep that fact visible instead of substituting content.
 */
export function buildHostRequirementAuthentication({ transcriptPath, taskId, runId, stage, sessionId, sourceId, sourceRef } = {}) {
  const raw = readHostSessionTranscript(transcriptPath);
  if (raw === null) return null;
  const messages = hostSessionRequirementMessages(raw, { taskId, stage, sessionId });
  if (messages.length === 0) return null;
  // The registered reader must re-read the producer-owned source. Feeding it
  // the already projected messages would only authenticate a caller-created
  // projection and would miss a source mutation between selection and auth.
  const reader = createTranscriptSourceReader(() => {
    const currentRaw = readHostSessionTranscript(transcriptPath);
    if (currentRaw === null) throw new Error("host session transcript is unavailable");
    const currentMessages = hostSessionRequirementMessages(currentRaw, { taskId, stage, sessionId });
    if (currentMessages.length === 0) throw new Error("host session transcript contains no requirement messages");
    return currentMessages.map((entry) => JSON.stringify(entry)).join("\n");
  });
  const source = createRegisteredCodexSource({
    source_id: sourceId,
    source_ref: sourceRef,
    registration_id: `host-session-registration-${sessionId}`,
    required: true,
    task_id: taskId,
    run_id: runId,
    session_id: sessionId,
    source_format: "jsonl",
    source_version: "v1",
    cli_version: "host-session",
    adapter_version: "v1",
    capabilities: ["requirement_message"],
    reader,
  });
  return parseRegisteredRequirementTranscript(source, { stage });
}
