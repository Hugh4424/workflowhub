const freshExecutionCodes = new Set([
  "PROCESS_START_FAILED",
  "PROCESS_DEAD",
  "PROCESS_STDIN_FAILED",
  "NETWORK_UNAVAILABLE",
]);

const sameSessionRepairCodes = new Set([
  "PROVIDER_OUTPUT_INVALID",
  "PROVIDER_NO_TERMINAL_RESULT",
  "PUBLIC_RESULT_INVALID",
]);

const integer = (value) => Number.isSafeInteger(value) && value >= 0 ? value : 0;

export function decideRecovery({
  code,
  resume_available = true,
  fresh_execution_retry_count = 0,
  same_session_repair_count = 0,
} = {}) {
  const freshExecutionAllowed = integer(fresh_execution_retry_count) < 1;
  if (freshExecutionCodes.has(code)) {
    return { action: "fresh_execution", allowed: freshExecutionAllowed, reason: code };
  }
  if (sameSessionRepairCodes.has(code)) {
    if (resume_available === false) {
      return { action: "none", allowed: false, reason: code };
    }
    return { action: "same_session_repair", allowed: integer(same_session_repair_count) < 1, reason: code };
  }
  return { action: "none", allowed: false, reason: typeof code === "string" && code.length > 0 ? code : "UNKNOWN" };
}

export function recoveryCounters({ retry_count, attempts = [] } = {}) {
  const list = Array.isArray(attempts) ? attempts : [];
  const providerInternal = Number.isSafeInteger(retry_count) && retry_count >= 0
    ? retry_count
    : list.reduce((total, attempt) => total + integer(attempt?.provider_retry_count), 0);
  return {
    provider_internal_retry_count: providerInternal,
    fresh_execution_retry_count: list.filter((attempt) => attempt?.kind === "fresh_execution").length,
    same_session_repair_count: list.filter((attempt) => attempt?.kind === "same_session_repair").length,
  };
}

export const RECOVERY_LIMITS = Object.freeze({
  fresh_execution_retry_count: 1,
  same_session_repair_count: 1,
});
