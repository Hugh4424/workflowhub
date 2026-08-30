import { createHash } from "node:crypto";

const READERS = new WeakSet();
const REQUIREMENT_MESSAGE_CLASSES = new Set([
  "goal",
  "flow_or_surface",
  "data_or_state",
  "success_failure_acceptance",
  "constraint_non_goal_defer",
]);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

/** Minted only by a launcher (or a controlled test fixture); paths never leave this capability. */
export function createTranscriptSourceReader(read) {
  if (typeof read !== "function") throw new TypeError("transcript reader must be a function");
  const reader = Object.freeze({ read: () => read() });
  READERS.add(reader);
  return reader;
}

/** Check a launcher-issued reader without exposing the private path it closes over. */
export function isTranscriptSourceReader(reader) {
  return READERS.has(reader);
}

function requirementMessageError(code, message) {
  return `${code}: ${message}`;
}

function requirementMessageStatus(status, source, errors, messages, expected) {
  return Object.freeze({
    status,
    source_id: source?.source_id ?? null,
    source_ref: source?.source_ref ?? null,
    source_version: source?.source_version ?? null,
    messages: Object.freeze(messages),
    errors: Object.freeze(errors),
    coverage: Object.freeze({ observed: messages.length, expected }),
  });
}

/**
 * Authenticate the narrow requirement-message seam owned by the launcher.
 *
 * The runtime checks only source identity, order, version and content hash.
 * It deliberately returns metadata without the message body. In particular,
 * host capture never assigns product classes; the product skill classifies an
 * authenticated message in its coverage output.
 */
export function authenticateRegisteredRequirementMessages(source, { stage = null } = {}) {
  if (!source || typeof source !== "object" || !isTranscriptSourceReader(source.reader)) {
    return requirementMessageStatus("unsupported", source, [requirementMessageError("SOURCE_REGISTRATION_INVALID", "registered transcript reader is required")], [], 0);
  }
  if (source.source_format !== "jsonl" || source.source_version !== "v1") {
    return requirementMessageStatus("unsupported", source, [requirementMessageError("UNSUPPORTED_FORMAT", "registered transcript format is unsupported")], [], 0);
  }
  let raw;
  try {
    raw = source.reader.read();
  } catch (error) {
    const missing = error?.code === "ENOENT";
    return requirementMessageStatus(missing ? "missing" : "unavailable", source, [requirementMessageError(missing ? "NOT_FOUND" : "READ_ERROR", missing ? "registered transcript was not found" : "registered transcript could not be read")], [], 0);
  }

  const messages = [];
  const errors = [];
  const seenIds = new Set();
  let expectedOrder = 1;
  for (const [lineIndex, line] of String(raw).split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    let value;
    try { value = JSON.parse(line); }
    catch { errors.push(requirementMessageError("MALFORMED_LINE", `requirement message line ${lineIndex + 1} is not valid JSON`)); continue; }
    if (value?.type !== "requirement_message") continue;

    const lineErrors = [];
    if (typeof value.id !== "string" || value.id.trim() === "") lineErrors.push("message id is required");
    if (seenIds.has(value.id)) lineErrors.push("message id is duplicated");
    if (value.source_version !== source.source_version) lineErrors.push("source version mismatch");
    if (value.task_id !== source.task_id) lineErrors.push("task identity mismatch");
    if (value.session_id !== source.session_id) lineErrors.push("session identity mismatch");
    if (stage !== null && value.stage !== stage) lineErrors.push("stage identity mismatch");
    if (!Number.isSafeInteger(value.order) || value.order !== expectedOrder) lineErrors.push("message order is not contiguous");
    if (typeof value.content !== "string" || value.content.trim() === "") lineErrors.push("message content is required for hash verification");
    const actualHash = typeof value.content === "string" ? sha256(value.content) : null;
    if (!/^[a-f0-9]{64}$/.test(value.content_hash ?? "") || value.content_hash !== actualHash) lineErrors.push("message content hash mismatch");
    if (lineErrors.length) {
      errors.push(requirementMessageError("MESSAGE_AUTHENTICATION_FAILED", `line ${lineIndex + 1}: ${lineErrors.join(", ")}`));
      continue;
    }
    seenIds.add(value.id);
    messages.push(Object.freeze({
      id: value.id,
      order: value.order,
      ...(REQUIREMENT_MESSAGE_CLASSES.has(value.message_class) ? { message_class: value.message_class } : {}),
      content_hash: value.content_hash,
      source_id: source.source_id,
      source_ref: source.source_ref,
      source_version: source.source_version,
      task_id: source.task_id,
      session_id: source.session_id,
      stage: value.stage ?? null,
    }));
    expectedOrder += 1;
  }

  if (messages.length === 0 && errors.length === 0) {
    errors.push(requirementMessageError("NO_REQUIREMENT_MESSAGES", "registered transcript contains no requirement messages"));
  }
  const status = errors.length > 0 ? (errors.some((error) => /identity|order|hash|version/i.test(error)) ? "conflict" : "incomplete") : "present";
  return requirementMessageStatus(status, source, errors, messages, messages.length + errors.length);
}
