import { authenticateRegisteredRequirementMessages, isTranscriptSourceReader } from "./fact-collector.mjs";

const SAFE_REF = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const REQUIREMENT_CAPABILITY = "requirement_message";
const REGISTERED_SOURCES = new WeakSet();
const AUTHENTICATED_REQUIREMENT_RESULTS = new WeakSet();

/**
 * Keep the Codex adapter as the single entry seam for requirement-message
 * authentication. The collector owns the identity/hash checks; this wrapper
 * prevents callers from reaching around the registered Codex source adapter.
 */
export function parseRegisteredRequirementTranscript(source, options = {}) {
  const mark = (value) => {
    AUTHENTICATED_REQUIREMENT_RESULTS.add(value);
    return value;
  };
  if (!sourceShape(source)) {
    return mark({
      status: "unsupported",
      source_id: null,
      source_ref: null,
      source_version: null,
      messages: Object.freeze([]),
      errors: Object.freeze(["SOURCE_REGISTRATION_INVALID: registered transcript source is not launcher-registered"]),
      coverage: Object.freeze({ observed: 0, expected: 0 }),
    });
  }
  return mark(authenticateRegisteredRequirementMessages(source, options));
}

export function isAuthenticatedRequirementResult(value) {
  return AUTHENTICATED_REQUIREMENT_RESULTS.has(value);
}

function text(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be a non-empty string`);
  return value;
}

function publicRef(value) {
  text(value, "source_ref");
  if (!SAFE_REF.test(value)) throw new Error("source ref must be opaque, not a raw path");
  return value;
}

export function createRegisteredCodexSource(input = {}) {
  const allowed = new Set(["source_id", "source_ref", "registration_id", "required", "task_id", "run_id", "session_id", "source_format", "source_version", "cli_version", "adapter_version", "capabilities", "reader"]);
  const unknown = Object.keys(input).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`registered source contains unsupported fields: ${unknown.join(", ")}`);
  publicRef(input.source_ref);
  for (const key of ["source_id", "source_ref", "registration_id", "task_id", "run_id", "session_id", "source_format", "source_version", "cli_version", "adapter_version"]) {
    text(input[key], key);
    if (["source_id", "source_ref", "registration_id", "task_id", "run_id", "session_id"].includes(key) && !SAFE_REF.test(input[key])) throw new Error(`${key} must be an opaque identifier`);
  }
  if (typeof input.required !== "boolean") throw new TypeError("registered Codex source required semantic is required");
  if (input.source_format !== "jsonl" || input.source_version !== "v1") throw new Error("registered Codex source format is unsupported");
  if (input.capabilities !== undefined && input.capabilities !== null) {
    if (!Array.isArray(input.capabilities) || input.capabilities.some((value) => value !== REQUIREMENT_CAPABILITY)) throw new TypeError("registered Codex source capabilities are invalid");
    if (new Set(input.capabilities).size !== input.capabilities.length) throw new TypeError("registered Codex source capabilities contain duplicates");
  }
  if (!isTranscriptSourceReader(input.reader)) throw new TypeError("launcher-issued transcript reader capability required");
  const source = Object.freeze({ ...input, capabilities: input.capabilities === undefined ? null : input.capabilities });
  REGISTERED_SOURCES.add(source);
  return source;
}

function sourceShape(source) {
  return source && typeof source === "object" && !Array.isArray(source)
    && REGISTERED_SOURCES.has(source);
}
