import assert from "node:assert/strict";
import { test } from "vitest";
import { decideRecovery, recoveryCounters } from "../lib/recovery-policy.mjs";

test("startup/death/transport recovery allows one fresh execution only", () => {
  for (const code of ["PROCESS_START_FAILED", "PROCESS_DEAD", "PROCESS_STDIN_FAILED", "NETWORK_UNAVAILABLE"]) {
    assert.deepEqual(decideRecovery({ code, fresh_execution_retry_count: 0, same_session_repair_count: 0 }), {
      action: "fresh_execution",
      allowed: true,
      reason: code,
    });
    assert.equal(decideRecovery({ code, fresh_execution_retry_count: 1, same_session_repair_count: 0 }).allowed, false);
  }
});

test("format/schema recovery allows one same-session repair only", () => {
  for (const code of ["PROVIDER_OUTPUT_INVALID", "PROVIDER_NO_TERMINAL_RESULT", "PUBLIC_RESULT_INVALID"]) {
    assert.deepEqual(decideRecovery({ code, fresh_execution_retry_count: 0, same_session_repair_count: 0 }), {
      action: "same_session_repair",
      allowed: true,
      reason: code,
    });
    assert.equal(decideRecovery({ code, fresh_execution_retry_count: 0, same_session_repair_count: 1 }).allowed, false);
  }
});

test("format recovery allows one same-session repair and never fresh fallback", () => {
  assert.deepEqual(decideRecovery({
    code: "PROVIDER_OUTPUT_INVALID",
    fresh_execution_retry_count: 0,
    same_session_repair_count: 0,
  }), {
    action: "same_session_repair",
    allowed: true,
    reason: "PROVIDER_OUTPUT_INVALID",
  });
});

test("format failures without a resumable session do not start a fresh execution", () => {
  assert.deepEqual(decideRecovery({
    code: "PROVIDER_OUTPUT_INVALID",
    resume_available: false,
    fresh_execution_retry_count: 0,
    same_session_repair_count: 0,
  }), {
    action: "none",
    allowed: false,
    reason: "PROVIDER_OUTPUT_INVALID",
  });
});

test("provider timeout is never retried", () => {
  assert.deepEqual(decideRecovery({
    code: "PROCESS_TIMEOUT",
    fresh_execution_retry_count: 0,
    same_session_repair_count: 0,
  }), {
    action: "none",
    allowed: false,
    reason: "PROCESS_TIMEOUT",
  });
});

test("configuration, authentication, timeout, and packet errors never recover", () => {
  for (const code of ["CONFIG_INVALID", "AUTHENTICATION_FAILED", "PROCESS_TIMEOUT", "PACKET_TOO_LARGE", "MATERIAL_INCOMPLETE"]) {
    assert.deepEqual(decideRecovery({ code, fresh_execution_retry_count: 0, same_session_repair_count: 0 }), {
      action: "none",
      allowed: false,
      reason: code,
    });
  }
});

test("recovery counters remain separate and do not multiply", () => {
  assert.deepEqual(recoveryCounters({ retry_count: 3, attempts: [
    { kind: "initial", provider_retry_count: 3 },
    { kind: "fresh_execution", provider_retry_count: 0 },
    { kind: "same_session_repair", provider_retry_count: 1 },
  ] }), {
    provider_internal_retry_count: 3,
    fresh_execution_retry_count: 1,
    same_session_repair_count: 1,
  });
});
