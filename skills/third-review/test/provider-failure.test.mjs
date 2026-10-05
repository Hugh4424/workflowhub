import assert from "node:assert/strict";
import { test } from "vitest";
import { failureCode, failureDetails, failureMessage } from "../lib/provider-failure.mjs";

test("provider usage and billing failures are classified as non-retryable rate limits", () => {
  for (const stderr of [
    "HTTP 403 usage limit reached",
    "usage limit reached for the current billing cycle",
    "credits exhausted",
    "spending limit exceeded",
  ]) {
    assert.equal(failureCode(stderr), "RATE_LIMITED", stderr);
    assert.equal(failureMessage(failureCode(stderr)), "provider rate limit was reached");
  }
});

test("authentication failures remain distinct from generic forbidden responses", () => {
  assert.equal(failureCode("HTTP 403 forbidden: invalid API key"), "AUTHENTICATION_FAILED");
  assert.equal(failureCode("No API key found for kimi-coding"), "AUTHENTICATION_FAILED");
  assert.equal(failureCode("HTTP 403 forbidden"), "PROCESS_EXIT_NONZERO");
});

test("RED: print timeout is exposed as PROCESS_TIMEOUT with its original cause", async () => {
  const { default: antigravity } = await import("../lib/adapters/antigravity.mjs");
  const parsed = antigravity.parse("", "provider print timeout");
  assert.equal(parsed.error.code, "PROCESS_TIMEOUT");
  assert.equal(parsed.error.cause_code, "PROVIDER_PRINT_TIMEOUT");
  assert.notEqual(parsed.error.code, "PROVIDER_PRINT_TIMEOUT");
  assert.deepEqual(failureDetails("provider print timeout", "fallback").error, {
    code: "PROCESS_TIMEOUT",
    message: "provider print timeout",
    cause_code: "PROVIDER_PRINT_TIMEOUT",
  });
});
