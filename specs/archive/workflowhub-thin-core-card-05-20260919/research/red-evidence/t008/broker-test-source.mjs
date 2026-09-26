import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import test from "node:test";
import { Broker } from "../lib/broker.mjs";
import { validateConfig } from "../lib/config.mjs";
import { cleanup, createRuntime, currentOwnerIdentity, ensureRuntimeGuardian, isAlive, processIdentity, readRuntime, terminateProcess, updateRuntime } from "../lib/runtime.mjs";

const fake = path.resolve("test/fake-cli.mjs");
const slow = path.resolve("test/slow-cli.mjs");
const slowSuccess = path.resolve("test/slow-success-cli.mjs");
const silent = path.resolve("test/silent-cli.mjs");
const stream = path.resolve("test/stream-cli.mjs");
const kimiRetry = path.resolve("test/kimi-retry-cli.mjs");
const providerFailure = path.resolve("test/provider-failure-cli.mjs");
const hugeOutput = path.resolve("test/huge-output-cli.mjs");
const terminalRecovery = path.resolve("test/fake-opencode-terminal-recovery-cli.mjs");
function config(root, tiers = [["claude-code", "kimi", "codex", "opencode"]]) {
  const ids = [...new Set(tiers.flat())];
  return validateConfig({ version: 4, runtime: { root, ttl_hours: 24, max_prompt_bytes: 10000, max_output_bytes: 100000, liveness_interval_ms: 5 }, tiers, providers: Object.fromEntries(ids.map((id) => [id, { enabled: true, command: fake, model: null, effort: null, thinking: null, auth: { type: "native" }, env: [] }])) });
}
function temp() { return fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-v4-test-")); }
async function eventually(check, timeoutMs = 3_000) { const deadline = Date.now() + timeoutMs; while (Date.now() < deadline) { if (check()) return; await new Promise((resolve) => setTimeout(resolve, 20)); } assert.fail("condition did not become true"); }

test("legacy elapsed-time configuration is rejected", () => {
  const value = config(temp(), [["kimi"]]);
  assert.equal(value.runtime.max_wall_clock_ms, null);
  for (const invalid of [123, 0, -1, 1.5, "1000"]) { value.providers.kimi.deadline_ms = invalid; assert.throws(() => validateConfig(value), /deadline_ms is no longer supported/); }
  value.providers.kimi.deadline_ms = null; assert.equal(validateConfig(value).providers.kimi.deadline_ms, null);
  value.runtime.max_wall_clock_ms = null; assert.equal(validateConfig(value).runtime.max_wall_clock_ms, null);
  for (const legacy of [900_000, 0, -1, 1.5, "1000"]) { value.runtime.max_wall_clock_ms = legacy; assert.equal(validateConfig(value).runtime.max_wall_clock_ms, null); }
  delete value.runtime.max_wall_clock_ms; value.runtime.idle_timeout_ms = 1; assert.throws(() => validateConfig(value), /no longer supported/);
  delete value.runtime.idle_timeout_ms; value.runtime.max_duration_ms = 1; assert.throws(() => validateConfig(value), /no longer supported/);
});

test("a provider deadline cannot reintroduce a second execution timer", () => {
  const value = config(temp(), [["kimi"]]); value.providers.kimi.deadline_ms = 60;
  assert.throws(() => validateConfig(value), /deadline_ms is no longer supported/);
});

test("config keeps usable tiers when dormant providers or duplicate routes exist", () => {
  const value = config(temp(), [["kimi", "codex"]]);
  value.providers.opencode = { ...value.providers.kimi, id: "opencode" };
  value.tiers = [["kimi", "codex"], ["kimi", "opencode", "kimi"]];
  const normalized = validateConfig(value);
  assert.deepEqual(normalized.tiers, [["kimi", "codex"], ["opencode"]]);
  assert.ok(normalized.providers.opencode);

  value.tiers = [["unknown-provider"]];
  assert.throws(() => validateConfig(value), /references unknown provider/);
});

test("direction flow material without review_flow fails before provider dispatch", async () => {
  const runtime = temp();
  const source = temp();
  const flow = {
    version: "direction-review.v1",
    public_request_count: 1,
    steps: [
      { id: "reconstruct", visible: ["raw_requirement", "objective_facts"], hidden_until: "reveal" },
      { id: "reveal", after: ["reconstruct"], visible: ["current_selection", "alternatives", "selection_rationale", "key_assumptions", "independent_reconstruction"] },
      { id: "challenge", after: ["reveal"], visible: ["revealed_choice", "independent_reconstruction"], output: "findings" },
    ],
    output: { one_logical_fact: true, one_provider_result: true },
  };
  fs.writeFileSync(path.join(source, "direction_flow.json"), `${JSON.stringify(flow)}\n`);
  fs.writeFileSync(path.join(source, "manifest.json"), "{}\n");
  const entries = ["direction_flow.json", "manifest.json"].map((name) => {
    const bytes = fs.readFileSync(path.join(source, name));
    return { source: name, destination: name, size: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), embed: false };
  });
  const value = config(runtime, [["kimi"]]);
  value.attachment_roots = [{ root: source, sources: ["direction_flow.json", "manifest.json"] }];
  const starts = [];
  const broker = new Broker(value, { onStart: () => starts.push(true) });

  await assert.rejects(() => broker.run({
    version: 4,
    host_provider: "codex",
    required_result_protocol: "workflowhub-result.v3",
    provider_allowlist: ["kimi"],
    review_mode: "single_round",
    prompt: "review the supplied direction flow",
    continuation: null,
    attachments: { root: source, delivery: "file_only", manifest: { version: 1, bundle_id: "direction-flow-missing-request", entries } },
  }), { code: "MATERIAL_INCOMPLETE" });
  assert.deepEqual(starts, []);
});

test("default route runs every heterologous provider in its first tier", async () => {
  const broker = new Broker(config(temp())); const result = await broker.run({ version: 4, host_provider: "claude-code", prompt: "review", continuation: null });
  assert.deepEqual(result.providers.map((item) => item.provider), ["kimi", "codex", "opencode"]); assert.ok(result.providers.every((item) => item.status === "completed"));
  assert.equal(result.outcome, "completed"); assert.equal(result.round, 1); assert.equal(result.selected_tier, 0);
});

test("default route dispatches every provider in a tier concurrently", async () => {
  const value = config(temp(), [["kimi/one", "kimi/two"]]);
  value.providers["kimi/one"].command = slowSuccess; value.providers["kimi/two"].command = slowSuccess;
  const starts = [];
  const result = await new Broker(value, { onStart: () => starts.push(Date.now()) }).run({ version: 4, host_provider: "codex", prompt: "review", continuation: null });
  assert.deepEqual(result.providers.map((item) => item.provider), ["kimi/one", "kimi/two"]); assert.ok(result.providers.every((item) => item.status === "completed"));
  assert.equal(starts.length, 2); assert.ok(Math.max(...starts) - Math.min(...starts) < 120, `provider starts were not concurrent: ${starts.join(", ")}`);
});

test("continuation uses only each provider's own native session", async () => {
  const broker = new Broker(config(temp(), [["kimi", "codex"]])); const first = await broker.run({ version: 4, host_provider: "claude-code", prompt: "one", continuation: null });
  const second = await broker.run({ version: 4, host_provider: "claude-code", prompt: "two", continuation: { runtime_id: first.runtime_id } });
  assert.equal(second.round, 2); assert.equal(second.selected_tier, null); assert.deepEqual(second.providers.map((item) => item.provider), ["kimi", "codex"]); assert.ok(second.providers.every((item) => item.status === "completed"));
});

test("falls through only after an entire tier has no success", async () => {
  const root = temp(); const value = config(root, [["claude-code"], ["kimi"]]); value.providers["claude-code"].command = "/does/not/exist";
  const result = await new Broker(value).run({ version: 4, host_provider: "codex", prompt: "review", continuation: null });
  assert.equal(result.selected_tier, 1); assert.equal(result.providers[0].status, "failed"); assert.equal(result.providers[1].provider, "kimi"); assert.equal(result.providers[1].status, "completed");
});

test("falls through after every provider in a tier fails", async () => {
  const root = temp(); const value = config(root, [["claude-code", "opencode"], ["kimi"]]);
  value.providers["claude-code"].command = "/does/not/exist"; value.providers.opencode.auth = { type: "env", env: ["THIRD_REVIEW_TEST_MISSING_KEY"] };
  const result = await new Broker(value).run({ version: 4, host_provider: "codex", prompt: "review", continuation: null });
  assert.deepEqual(result.providers.map((item) => item.provider), ["claude-code", "opencode", "kimi"]);
  assert.equal(result.providers[0].error.code, "PROCESS_START_FAILED"); assert.equal(result.providers[1].error.code, "AUTH_ENV_MISSING"); assert.equal(result.providers[2].status, "completed");
  assert.equal(result.selected_tier, 1);
});

test("reports missing environment authentication without running the provider", async () => {
  const value = config(temp(), [["kimi"]]); value.providers.kimi.auth = { type: "env", env: ["THIRD_REVIEW_TEST_MISSING_KEY"] };
  const result = await new Broker(value).run({ version: 4, host_provider: "codex", prompt: "review", continuation: null });
  assert.equal(result.providers[0].error.code, "AUTH_ENV_MISSING"); assert.equal(result.providers.length, 1); assert.equal(result.outcome, "invalid_output");
});

test("bounds private raw capture and preserves an explicit output-limit failure", async () => {
  const root = temp(); const value = config(root, [["kimi"]]); value.providers.kimi.command = hugeOutput;
  const result = await new Broker(value).run({ version: 4, host_provider: "codex", prompt: "review", continuation: null });
  assert.equal(result.providers[0].status, "failed");
  assert.equal(result.providers[0].error.code, "PROVIDER_OUTPUT_LIMIT");
  const state = readRuntime(root, result.runtime_id);
  assert.ok(state.providers.kimi.raw_stdout_ref);
  const rawSize = fs.statSync(path.join(root, result.runtime_id, state.providers.kimi.raw_stdout_ref)).size;
  assert.ok(rawSize > 0 && rawSize <= 100_000);
});

test("persists OpenCode terminal failure classification and observed session identity", async () => {
  const root = temp(); const value = config(root, [["opencode"]]); value.providers.opencode.command = providerFailure;
  const result = await new Broker(value).run({ version: 4, host_provider: "codex", prompt: "review", continuation: null });
  assert.equal(result.providers[0].error.code, "PROVIDER_HEALTH_FAILED");
  assert.equal(result.providers[0].session_id, "ses_failure_fixture");
  assert.equal(result.providers[0].error.message, "provider session reported a terminal failure");
  assert.equal(result.providers[0].diagnostic, "provider session reported a terminal failure");
  assert.doesNotMatch(JSON.stringify(result), /\/Users\/private\/credential/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, result.runtime_id, "state.json"), "utf8")).providers.opencode.session_id, "ses_failure_fixture");
});

test("recovers an OpenCode no-terminal result in the same native session", async () => {
  const root = temp(); const value = config(root, [["opencode"]]); value.providers.opencode.command = terminalRecovery; value.providers.opencode.model = "recovery-success";
  const result = await new Broker(value).run({ version: 4, review_mode: "single_round", host_provider: "codex", prompt: "review", continuation: null });
  const provider = result.providers[0]; assert.equal(provider.status, "completed"); assert.equal(provider.session_id, "terminal-recovery-session"); assert.equal(JSON.parse(provider.output).verdict, "pass");
  assert.equal(provider.retry_count, 1); assert.equal(Object.hasOwn(provider, "terminal_recovery"), false);
  const state = JSON.parse(fs.readFileSync(path.join(root, result.runtime_id, "state.json"), "utf8")); const recovery = state.providers.opencode.terminal_recovery;
  assert.equal(recovery.attempted, true); assert.equal(recovery.recovered, true); assert.equal(recovery.session_id, "terminal-recovery-session");
  assert.notEqual(recovery.initial_raw_output_refs.raw_stdout_ref, recovery.recovery_raw_output_refs.raw_stdout_ref);
  assert.ok(fs.existsSync(path.join(root, result.runtime_id, recovery.initial_raw_output_refs.raw_stdout_ref)));
  assert.ok(fs.existsSync(path.join(root, result.runtime_id, recovery.recovery_raw_output_refs.raw_stdout_ref)));
});

test("fails closed when OpenCode terminal recovery changes its session", async () => {
  const root = temp(); const value = config(root, [["opencode"]]); value.providers.opencode.command = terminalRecovery; value.providers.opencode.model = "recovery-mismatch";
  const result = await new Broker(value).run({ version: 4, host_provider: "codex", prompt: "review", continuation: null });
  assert.equal(result.providers[0].status, "failed"); assert.equal(result.providers[0].error.code, "PROVIDER_SESSION_MISMATCH"); assert.equal(result.providers[0].output, undefined); assert.equal(result.providers[0].retry_count, 1);
  const state = JSON.parse(fs.readFileSync(path.join(root, result.runtime_id, "state.json"), "utf8")); assert.equal(state.providers.opencode.terminal_recovery.recovery_error.code, "PROVIDER_SESSION_MISMATCH");
});

test("accepts one fenced JSON object from OpenCode terminal recovery", async () => {
  const root = temp(); const value = config(root, [["opencode"]]); value.providers.opencode.command = terminalRecovery; value.providers.opencode.model = "recovery-invalid";
  const result = await new Broker(value).run({ version: 4, host_provider: "codex", prompt: "review", continuation: null });
  assert.equal(result.providers[0].status, "completed"); assert.equal(JSON.parse(result.providers[0].output).verdict, "pass"); assert.equal(result.providers[0].retry_count, 1);
  const state = JSON.parse(fs.readFileSync(path.join(root, result.runtime_id, "state.json"), "utf8")); assert.equal(state.providers.opencode.terminal_recovery.recovered, true);
});

test("keeps terminal recovery evidence when the recovered output still leaks a private path", async () => {
  const root = temp(); const value = config(root, [["opencode"]]); value.providers.opencode.command = terminalRecovery; value.providers.opencode.model = "recovery-private";
  const result = await new Broker(value).run({ version: 4, host_provider: "codex", prompt: "review", continuation: null });
  const provider = result.providers[0]; assert.equal(provider.status, "failed"); assert.equal(provider.error.code, "PUBLIC_RESULT_INVALID"); assert.equal(provider.output, undefined); assert.equal(provider.retry_count, 1);
  const state = JSON.parse(fs.readFileSync(path.join(root, result.runtime_id, "state.json"), "utf8")); assert.equal(state.providers.opencode.terminal_recovery.recovered, true); assert.equal(state.providers.opencode.public_output_rewrite_count, 1);
  assert.equal(JSON.stringify(result).includes("/private/recovery"), false);
});

test("preserves the original OpenCode no-terminal error when recovery fails", async () => {
  const root = temp(); const value = config(root, [["opencode"]]); value.providers.opencode.command = terminalRecovery; value.providers.opencode.model = "recovery-fail";
  const result = await new Broker(value).run({ version: 4, host_provider: "codex", prompt: "review", continuation: null });
  assert.equal(result.providers[0].status, "failed"); assert.equal(result.providers[0].error.code, "PROVIDER_NO_TERMINAL_RESULT"); assert.equal(result.providers[0].output, undefined); assert.equal(result.providers[0].retry_count, 1);
  const state = JSON.parse(fs.readFileSync(path.join(root, result.runtime_id, "state.json"), "utf8")); const recovery = state.providers.opencode.terminal_recovery;
  assert.equal(recovery.recovery_error.code, "PROVIDER_NO_TERMINAL_RESULT"); assert.ok(recovery.recovery_raw_output_refs.raw_stdout_ref);
});

test("provider terminal recovery stays within its scoped recovery budget", async () => {
  const root = temp(); const value = config(root, [["opencode"]]);
  value.providers.opencode.command = terminalRecovery; value.providers.opencode.model = "deadline";
  const result = await new Broker(value, { terminationGraceMs: 10 }).run({ version: 4, host_provider: "codex", prompt: "review", continuation: null });
  const state = readRuntime(root, result.runtime_id); const provider = state.providers.opencode;
  assert.equal(result.providers[0].status, "completed");
  assert.equal(provider.attempts.length, 2);
  assert.equal(provider.attempts[0].error.code, "PROVIDER_NO_TERMINAL_RESULT");
  assert.equal(provider.attempts[1].error, null);
});

test("bounded terminal recovery fails closed when the resumed provider never terminates", async () => {
  const root = temp(); const value = config(root, [["opencode"]]);
  value.providers.opencode.command = terminalRecovery; value.providers.opencode.model = "recovery-hang";
  const result = await new Broker(value, { terminalRecoveryTimeoutMs: 20, terminationGraceMs: 10 }).run({ version: 4, host_provider: "codex", prompt: "review", continuation: null });
  assert.equal(result.providers[0].status, "failed");
  assert.equal(result.providers[0].error.code, "PROVIDER_NO_TERMINAL_RESULT");
  const state = readRuntime(root, result.runtime_id); const recovery = state.providers.opencode.terminal_recovery;
  assert.equal(recovery.recovered, undefined);
  assert.equal(recovery.recovery_error.code, "PROVIDER_NO_TERMINAL_RESULT");
  assert.ok(recovery.recovery_raw_output_refs.raw_stdout_ref);
  assert.ok(state.providers.opencode.attempts[1].duration_ms < 500);
});

test("does not recover an OpenCode terminal failure without a session id", async () => {
  const root = temp(); const value = config(root, [["opencode"]]); value.providers.opencode.command = terminalRecovery; value.providers.opencode.model = "no-session";
  const result = await new Broker(value).run({ version: 4, host_provider: "codex", prompt: "review", continuation: null });
  assert.equal(result.providers[0].status, "failed"); assert.equal(result.providers[0].error.code, "PROVIDER_NO_TERMINAL_RESULT"); assert.equal(result.providers[0].retry_count, 0);
  const state = JSON.parse(fs.readFileSync(path.join(root, result.runtime_id, "state.json"), "utf8")); assert.equal(Object.hasOwn(state.providers.opencode, "terminal_recovery"), false);
});

test("continuation excludes providers removed from the current config", async () => {
  const root = temp(); const first = await new Broker(config(root, [["kimi", "codex"]])).run({ version: 4, host_provider: "claude-code", prompt: "one", continuation: null });
  const changed = config(root, [["kimi"]]); delete changed.providers.codex;
  const result = await new Broker(changed).run({ version: 4, host_provider: "claude-code", prompt: "two", continuation: { runtime_id: first.runtime_id } });
  assert.deepEqual(result.providers.map((item) => item.provider), ["kimi"]); assert.equal(result.providers[0].status, "completed");
});

test("cleanup removes expired inactive state", () => {
  const root = temp(); const old = path.join(root, "old"); fs.mkdirSync(old, { recursive: true }); fs.writeFileSync(path.join(old, "state.json"), JSON.stringify({ providers: {}, expires_at_ms: 0 }));
  assert.deepEqual(cleanup(root, 24), ["old"]); assert.equal(fs.existsSync(old), false);
});

test("cancel persists an independent cancellation marker", async () => {
  const root = temp(); const value = config(root, [["kimi"]]); value.providers.kimi.command = slow;
  const broker = new Broker(value); const running = broker.run({ version: 4, host_provider: "codex", prompt: "review", continuation: null });
  await new Promise((resolve) => setTimeout(resolve, 80));
  const runtime_id = fs.readdirSync(root).find((name) => /^[0-9a-f-]{36}$/i.test(name));
  assert.deepEqual(broker.cancel(runtime_id, "kimi"), { cancelled: true });
  const result = await running;
  assert.equal(result.providers[0].status, "cancelled"); assert.equal(result.providers[0].error.code, "CANCELLED");
  const settled = broker.status(runtime_id).providers.kimi.process_alive_at_ms;
  assert.equal(typeof settled, "number");
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(broker.status(runtime_id).providers.kimi.process_alive_at_ms, settled);
});

test("cancelling a tier does not fall through to the next tier", async () => {
  const root = temp(); const value = config(root, [["kimi"], ["opencode"]]); value.providers.kimi.command = slow;
  const broker = new Broker(value); const running = broker.run({ version: 4, host_provider: "codex", prompt: "review", continuation: null });
  await new Promise((resolve) => setTimeout(resolve, 80));
  const runtime_id = fs.readdirSync(root).find((name) => /^[0-9a-f-]{36}$/i.test(name));
  assert.deepEqual(broker.cancel(runtime_id, "kimi"), { cancelled: true });
  const result = await running;
  assert.equal(result.outcome, "cancelled"); assert.deepEqual(result.providers.map((item) => item.provider), ["kimi"]); assert.equal(result.providers[0].status, "cancelled");
  assert.equal(broker.status(runtime_id).providers.opencode, undefined);
});

test("runtime keeps process liveness and output progress as separate timestamps", async () => {
  const root = temp(); const value = config(root, [["opencode"]]); value.providers.opencode.command = silent;
  const broker = new Broker(value); const running = broker.run({ version: 4, host_provider: "codex", prompt: "review", continuation: null });
  await new Promise((resolve) => setTimeout(resolve, 40));
  const runtime_id = fs.readdirSync(root).find((name) => /^[0-9a-f-]{36}$/i.test(name)); const first = broker.status(runtime_id).providers.opencode;
  await new Promise((resolve) => setTimeout(resolve, 30));
  const second = broker.status(runtime_id).providers.opencode;
  assert.ok(second.process_alive_at_ms > first.process_alive_at_ms);
  assert.equal(second.last_progress_at_ms, first.last_progress_at_ms);
  await running;
});

test("providers receive isolated workspaces and independent review inputs", async () => {
  const root = temp(); const value = config(root, [["kimi", "opencode"]]);
  const result = await new Broker(value).run({ version: 4, host_provider: "codex", prompt: "UNIQUE_REVIEW_PACKET", continuation: null });
  const runtime = path.join(root, result.runtime_id, "workspace");
  const kimiInput = fs.readFileSync(path.join(runtime, "kimi", "review-input.md"), "utf8"); assert.match(kimiInput, /^Review only the supplied instruction/); assert.match(kimiInput, /UNIQUE_REVIEW_PACKET$/);
  assert.equal(fs.existsSync(path.join(runtime, "opencode", "review-input.md")), false);
  assert.equal(fs.existsSync(path.join(runtime, "review-input.md")), false);
});

test("cleanup reaps an orphaned broker process and records ORPHANED_BROKER", async () => {
  const root = temp(); const runtime = createRuntime(root, 24, "codex");
  const orphan = spawn(process.execPath, [slow], { detached: true, stdio: "ignore" }); orphan.unref();
  updateRuntime(root, runtime.runtime_id, (state) => ({ ...state, owner: { ...currentOwnerIdentity(), pid: 999_999_999, started_at_ms: 1 }, providers: { kimi: { provider: "kimi", status: "running", pid: orphan.pid, worker: processIdentity(orphan.pid), started_at_ms: 1, process_alive_at_ms: 1, last_progress_at_ms: 1 } } }));
  cleanup(root, 24);
  const state = readRuntime(root, runtime.runtime_id);
  assert.equal(state.providers.kimi.status, "failed");
  assert.equal(state.providers.kimi.error.code, "ORPHANED_BROKER");
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(isAlive(orphan.pid), false);
});

test("cleanup does not reap an active provider only because its heartbeat is stale", async () => {
  const root = temp(); const runtime = createRuntime(root, 24, "codex");
  const active = spawn(process.execPath, [slow], { detached: true, stdio: "ignore" }); active.unref();
  updateRuntime(root, runtime.runtime_id, (state) => ({ ...state, owner: { pid: process.pid, started_at_ms: 1 }, providers: { kimi: { provider: "kimi", status: "running", pid: active.pid, started_at_ms: 1, process_alive_at_ms: 1, last_progress_at_ms: 1 } } }));
  cleanup(root, 24);
  assert.equal(readRuntime(root, runtime.runtime_id).providers.kimi.status, "running");
  assert.equal(isAlive(active.pid), true);
  terminateProcess(active.pid);
});

test("detached guardian reaps only after its owner identity is confirmed dead", async () => {
  const root = temp(); const runtime = createRuntime(root, 24, "codex");
  const active = spawn(process.execPath, [slow], { detached: true, stdio: "ignore" }); active.unref();
  updateRuntime(root, runtime.runtime_id, (state) => ({ ...state, owner: { ...currentOwnerIdentity(), pid: 999_999_999, started_at_ms: 1 }, providers: { kimi: { provider: "kimi", status: "running", pid: active.pid, worker: processIdentity(active.pid), started_at_ms: 1, process_alive_at_ms: 1, last_progress_at_ms: 1 } } }));
  assert.equal(ensureRuntimeGuardian(root, runtime.runtime_id), true);
  await eventually(() => readRuntime(root, runtime.runtime_id).providers.kimi.status === "failed");
  assert.equal(readRuntime(root, runtime.runtime_id).providers.kimi.error.code, "ORPHANED_BROKER");
  await eventually(() => !isAlive(active.pid));
});

test("detached guardian stays active until a later owner death", async () => {
  const root = temp(); const runtime = createRuntime(root, 24, "codex");
  const active = spawn(process.execPath, [slow], { detached: true, stdio: "ignore" }); active.unref();
  updateRuntime(root, runtime.runtime_id, (state) => ({ ...state, owner: { ...currentOwnerIdentity(), started_at_ms: 1 }, providers: { kimi: { provider: "kimi", status: "running", pid: active.pid, worker: processIdentity(active.pid), started_at_ms: 1, process_alive_at_ms: 1, last_progress_at_ms: 1 } } }));
  assert.equal(ensureRuntimeGuardian(root, runtime.runtime_id), true);
  await new Promise((resolve) => setTimeout(resolve, 50)); assert.equal(readRuntime(root, runtime.runtime_id).providers.kimi.status, "running");
  updateRuntime(root, runtime.runtime_id, (state) => ({ ...state, owner: { ...currentOwnerIdentity(), pid: 999_999_999, started_at_ms: 1 } }));
  await eventually(() => readRuntime(root, runtime.runtime_id).providers.kimi.status === "failed");
  await eventually(() => !isAlive(active.pid));
});

test("guardian records a reused worker identity as orphaned without signalling that PID", async () => {
  const root = temp(); const runtime = createRuntime(root, 24, "codex");
  const active = spawn(process.execPath, [slow], { detached: true, stdio: "ignore" }); active.unref();
  updateRuntime(root, runtime.runtime_id, (state) => ({ ...state, owner: { ...currentOwnerIdentity(), pid: 999_999_999, started_at_ms: 1 }, providers: { kimi: { provider: "kimi", status: "running", pid: active.pid, worker: { ...processIdentity(active.pid), started: "forged-worker-start" }, started_at_ms: 1, process_alive_at_ms: 1, last_progress_at_ms: 1 } } }));
  assert.equal(ensureRuntimeGuardian(root, runtime.runtime_id), true);
  await eventually(() => readRuntime(root, runtime.runtime_id).providers.kimi.status === "failed");
  assert.equal(readRuntime(root, runtime.runtime_id).providers.kimi.error.code, "ORPHANED_BROKER");
  assert.equal(isAlive(active.pid), true);
  terminateProcess(active.pid);
});

test("a reused worker PID is never signalled by cleanup or cancel", async () => {
  const root = temp(); const runtime = createRuntime(root, 24, "codex");
  const active = spawn(process.execPath, [slow], { detached: true, stdio: "ignore" }); active.unref();
  updateRuntime(root, runtime.runtime_id, (state) => ({ ...state, owner: { ...currentOwnerIdentity(), pid: 999_999_999, started_at_ms: 1 }, providers: { kimi: { provider: "kimi", status: "running", pid: active.pid, worker: { ...processIdentity(active.pid), started: "forged-worker-start" }, started_at_ms: 1, process_alive_at_ms: 1, last_progress_at_ms: 1 } } }));
  cleanup(root, 24); assert.equal(isAlive(active.pid), true);
  const broker = new Broker(config(root, [["kimi"]]));
  assert.equal(readRuntime(root, runtime.runtime_id).providers.kimi.error.code, "ORPHANED_BROKER");
  assert.deepEqual(broker.cancel(runtime.runtime_id, "kimi"), { cancelled: false, reason: "NOT_ACTIVE" });
  const continuation = await broker.run({ version: 4, host_provider: "codex", prompt: "follow up", continuation: { runtime_id: runtime.runtime_id } });
  assert.notEqual(continuation.providers[0].error.code, "PROVIDER_BUSY");
  terminateProcess(active.pid);
});

test("owner PID reuse is distinguished by its recorded process start identity", async () => {
  const root = temp(); const runtime = createRuntime(root, 24, "codex");
  const active = spawn(process.execPath, [slow], { detached: true, stdio: "ignore" }); active.unref();
  const reused = { ...currentOwnerIdentity(), started: "forged-process-start", started_at_ms: 1 };
  updateRuntime(root, runtime.runtime_id, (state) => ({ ...state, owner: reused, providers: { kimi: { provider: "kimi", status: "running", pid: active.pid, worker: processIdentity(active.pid), started_at_ms: 1, process_alive_at_ms: 1, last_progress_at_ms: 1 } } }));
  cleanup(root, 24);
  assert.equal(readRuntime(root, runtime.runtime_id).providers.kimi.error.code, "ORPHANED_BROKER");
  await eventually(() => !isAlive(active.pid));
});

test("broker updates last progress for parsed stream output", async () => {
  const root = temp(); const value = config(root, [["opencode"]]); value.providers.opencode.command = stream;
  const broker = new Broker(value); const result = await broker.run({ version: 4, host_provider: "codex", prompt: "review", continuation: null });
  const state = broker.status(result.runtime_id).providers.opencode;
  assert.ok(state.last_progress_at_ms >= state.started_at_ms); assert.ok(state.progress_events > 0);
});

test("Kimi records stream progress and APIEmptyResponseError retries", async () => {
  const root = temp(); const value = config(root, [["kimi"]]); value.providers.kimi.command = kimiRetry;
  const result = await new Broker(value).run({ version: 4, host_provider: "codex", prompt: "review", continuation: null });
  const item = result.providers[0];
  assert.equal(item.status, "completed");
  assert.equal(item.retry_count, 2);
  assert.equal(item.api_empty_response_count, 2);
  assert.ok(item.progress_events >= 2);
  assert.equal(typeof item.last_progress_at_ms, "number");
});

test("a dead health probe does not terminate an otherwise live Kimi process", async () => {
  const root = temp(); const value = config(root, [["kimi"]]); value.providers.kimi.command = slow;
  const broker = new Broker(value, { healthCheckIntervalMs: 10, probeSession: async () => ({ status: "dead", session_id: null, cursor: null, raw: null, error: { code: "PROCESS_DEAD" }, evidence: "test probe" }) });
  const running = broker.run({ version: 4, host_provider: "codex", prompt: "review", continuation: null });
  await new Promise((resolve) => setTimeout(resolve, 40));
  const runtimeId = fs.readdirSync(root).find((id) => /^[0-9a-f-]{36}$/i.test(id)); const state = readRuntime(root, runtimeId).providers.kimi;
  assert.equal(state.status, "running"); assert.equal(isAlive(state.pid), true);
  broker.cancel(runtimeId, "kimi"); const result = await running;
  assert.equal(result.providers[0].status, "cancelled");
});
