export const PROVIDER_FAILURE_PREFIX = "3RD_REVIEW_FAILURE ";

const structuredCodes = new Set([
  "AUTHENTICATION_FAILED",
  "NETWORK_TLS_CERTIFICATE",
  "NETWORK_UNAVAILABLE",
  "PROCESS_DEAD",
  "PROCESS_EXIT_NONZERO",
  "PROCESS_START_FAILED",
  "PROCESS_STDIN_FAILED",
  "PROCESS_TIMEOUT",
  "PROBE_ABORTED",
  "PROBE_DEADLINE",
  "PROBE_FAILED",
  "PROVIDER_HEALTH_FAILED",
  "PROVIDER_NO_TERMINAL_RESULT",
  "PROVIDER_OUTPUT_INVALID",
  "PROVIDER_PERMISSION_DENIED",
  "PROVIDER_SESSION_MISMATCH",
  "RATE_LIMITED",
  "SESSION_UNKNOWN",
]);

const safeMessages = Object.freeze({
  AUTHENTICATION_FAILED: "provider authentication failed",
  NETWORK_UNAVAILABLE: "provider network unavailable",
  NETWORK_TLS_CERTIFICATE: "provider TLS certificate validation failed",
  PROCESS_DEAD: "provider process was terminated",
  PROCESS_EXIT_NONZERO: "provider process exited with a non-zero status",
  PROCESS_START_FAILED: "provider process could not be started",
  PROCESS_STDIN_FAILED: "provider stdin failed",
  PROCESS_TIMEOUT: "provider process exceeded its review deadline",
  PROBE_ABORTED: "provider health probe was aborted",
  PROBE_DEADLINE: "provider health probe exceeded its deadline",
  PROBE_FAILED: "provider health probe failed",
  PROVIDER_HEALTH_FAILED: "provider session reported a terminal failure",
  PROVIDER_NO_TERMINAL_RESULT: "provider session ended without a terminal assistant result",
  PROVIDER_OUTPUT_INVALID: "provider emitted invalid output",
  PROVIDER_PERMISSION_DENIED: "provider permission was denied",
  PROVIDER_SESSION_MISMATCH: "provider session identity changed during recovery",
  RATE_LIMITED: "provider rate limit was reached",
  SESSION_UNKNOWN: "provider exited without a session id",
});

export function failureMessage(code) { return safeMessages[code] ?? "provider failure was reported"; }

function structuredFailure(text) {
  for (const line of String(text ?? "").split(/\r?\n/).reverse()) {
    if (!line.startsWith(PROVIDER_FAILURE_PREFIX)) continue;
    try {
      const value = JSON.parse(line.slice(PROVIDER_FAILURE_PREFIX.length));
      if (value?.version !== 1 || !structuredCodes.has(value.code)) continue;
      return { code: value.code, message: failureMessage(value.code), session_id: typeof value.session_id === "string" && value.session_id.length > 0 ? value.session_id : null };
    } catch {
      // Ignore malformed provider records and fall through to the conservative
      // non-zero exit classification below.
    }
  }
  return null;
}

export function failureCode(stderr) {
  const structured = structuredFailure(stderr);
  if (structured) return structured.code;
  const value = String(stderr ?? "").toLowerCase();
  if (/process_timeout|provider exceeded max duration|provider made no observable progress/.test(value)) return "PROCESS_TIMEOUT";
  if (/provider_print_timeout|\bprint timeout\b/.test(value)) return "PROCESS_TIMEOUT";
  if (/pi emitted (an invalid|malformed|agent_end without|an event larger)/.test(value)) return "PROVIDER_OUTPUT_INVALID";
  if (/unauthorized|authentication failed|invalid api key|no api key|missing api key|login required|not logged in/.test(value)) return "AUTHENTICATION_FAILED";
  if (/certificate verification|unable to verify|self[- ]signed/.test(value)) return "NETWORK_TLS_CERTIFICATE";
  if (/\b429\b|rate limit|too many requests|quota exceeded|usage limit|billing cycle|credits? (?:exhausted|depleted)|spending limit|engine is currently overloaded|provider is currently overloaded/.test(value)
    || /\b403\b[^\n]*(?:usage|quota|limit|billing|credit)/.test(value)
    || /(?:usage|quota|billing|credit)[^\n]*\b403\b/.test(value)) return "RATE_LIMITED";
  if (/enotfound|econnrefused|econnreset|network is unreachable|network error/.test(value)) return "NETWORK_UNAVAILABLE";
  if (/permission denied|operation not permitted/.test(value)) return "PROVIDER_PERMISSION_DENIED";
  return "PROCESS_EXIT_NONZERO";
}

export function failureDetails(stderr, fallbackMessage) {
  const structured = structuredFailure(stderr);
  if (structured) return { error: { code: structured.code, message: structured.message }, session_id: structured.session_id };
  const diagnostic = String(stderr ?? "").split(/\r?\n/).map((line) => line.trim()).find((line) => /provider_print_timeout|\bprint timeout\b/i.test(line));
  const code = failureCode(stderr);
  return { error: { code, message: diagnostic || fallbackMessage, ...(code === "PROCESS_TIMEOUT" && diagnostic && /provider_print_timeout|\bprint timeout\b/i.test(diagnostic) ? { cause_code: "PROVIDER_PRINT_TIMEOUT" } : {}) }, session_id: null };
}
