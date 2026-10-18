import { fileURLToPath as migratedFilePath } from "node:url";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { test, vi, beforeEach, afterEach } from "vitest";
afterEach(() => vi.restoreAllMocks());
import { Broker } from "../lib/broker.mjs";
import { validateConfig } from "../lib/config.mjs";
import { cleanup, createRuntime, currentOwnerIdentity, ensureRuntimeGuardian, isAlive, processIdentity, readRuntime, removeRuntimeDirectory, terminateProcess, updateRuntime } from "../lib/runtime.mjs";

const fake = migratedFilePath(new URL("../test/fake-cli.mjs", import.meta.url));
const slow = migratedFilePath(new URL("../test/slow-cli.mjs", import.meta.url));
const slowSuccess = migratedFilePath(new URL("../test/slow-success-cli.mjs", import.meta.url));
const silent = migratedFilePath(new URL("../test/silent-cli.mjs", import.meta.url));
const stream = migratedFilePath(new URL("../test/stream-cli.mjs", import.meta.url));
const kimiRetry = migratedFilePath(new URL("../test/kimi-retry-cli.mjs", import.meta.url));
const providerFailure = migratedFilePath(new URL("../test/provider-failure-cli.mjs", import.meta.url));
const hugeOutput = migratedFilePath(new URL("../test/huge-output-cli.mjs", import.meta.url));
const terminalRecovery = migratedFilePath(new URL("../test/fake-opencode-terminal-recovery-cli.mjs", import.meta.url));
function config(root, tiers = [["claude-code", "kimi", "codex", "opencode"]]) {
  const ids = [...new Set(tiers.flat())];
  return validateConfig({ version: 4, runtime: { root, ttl_hours: 24, max_prompt_bytes: 10000, max_output_bytes: 100000, liveness_interval_ms: 5 }, tiers, providers: Object.fromEntries(ids.map((id) => [id, { enabled: true, command: fake, model: null, effort: null, thinking: null, auth: { type: "native" }, env: [] }])) });
}
function temp() { return fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-v4-test-")); }
function fileOnlyAttachment(value) {
  const root = temp(); const name = "review.md"; const contents = "bounded route test material";
  fs.writeFileSync(path.join(root, name), contents);
  const sha256 = createHash("sha256").update(contents).digest("hex");
  value.attachment_roots = [{ root, sources: [name] }];
  return { root, delivery: "file_only", manifest: { version: 1, bundle_id: `route-test-${sha256.slice(0, 12)}`, entries: [{ source: name, destination: name, size: Buffer.byteLength(contents), sha256, embed: false }] } };
}
async function eventually(check, timeoutMs = 3_000) { const deadline = Date.now() + timeoutMs; while (Date.now() < deadline) { if (check()) return; await new Promise((resolve) => setTimeout(resolve, 20)); } assert.fail("condition did not become true"); }


// TCR260: these named legacy tests cover controlled child lifecycle, not
// native capability. Derive the real native guarded plan first; replace only
// its execution copy with the original direct child (which had no supervisor).
import controlledOpenCode from "../lib/adapters/opencode.mjs";
import { prepareAttachments as prepareControlledPacket, prepareWritableAttachmentView as controlledPacketView } from "../lib/attachments.mjs";
const controlledLegacyCases = new Set(["default route runs every heterologous provider in its first tier", "persists OpenCode terminal failure classification and observed session identity", "recovers an OpenCode no-terminal result in the same native session", "fails closed when OpenCode terminal recovery changes its session", "accepts one fenced JSON object from OpenCode terminal recovery", "keeps terminal recovery evidence when the recovered output still leaks a private path", "preserves the original OpenCode no-terminal error when recovery fails", "provider terminal recovery completes without an elapsed-time cutoff", "does not recover an OpenCode terminal failure without a session id", "runtime keeps process liveness and output progress as separate timestamps", "broker updates last progress for parsed stream output"]);
const guardedLegacyStart = controlledOpenCode.start;
const guardedLegacyResume = controlledOpenCode.resume;
let controlledPacketCleanup = [];
let controlledAllowsSyntheticPacket = false;
function controlledLegacyPlan(provider, cwd, prompt, session = null) {
  let guardCwd = cwd;
  if (!fs.existsSync(path.join(cwd, "bundle", "attachments-manifest.json"))) {
    if (!controlledAllowsSyntheticPacket) throw new Error("real packet-bearing caller did not supply its guarded bundle root");
    // Prompt-only generic broker tests have no real packet. Their isolated
    // synthetic guard packet makes no claim that native prompt-only is safe.
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "legacy-guard-")));
    controlledPacketCleanup.push(root);
    const source = path.join(root, "source"); fs.mkdirSync(source);
    const text = "controlled generic lifecycle guard input"; fs.writeFileSync(path.join(source, "input.md"), text);
    const runtime = path.join(root, "runtime"); fs.mkdirSync(runtime);
    const stored = prepareControlledPacket({ root: source, delivery: "file_only", manifest: {version: 1, bundle_id: "controlled-legacy", entries: [{source: "input.md", destination: "input.md", size: Buffer.byteLength(text), sha256: createHash("sha256").update(text).digest("hex"), embed: false}]}}, runtime, "opencode", 10000, [{root: source, sources: ["input.md"]}]);
    guardCwd = controlledPacketView(runtime, "opencode", stored).cwd;
  }
  const actual = {...provider, command: "/Users/Hugh/.opencode/bin/opencode"};
  const guarded = session === null ? guardedLegacyStart(actual, guardCwd, prompt, null) : guardedLegacyResume(actual, guardCwd, session, prompt, null);
  const argv = [...guarded.clientArgv]; const attach = argv.indexOf("--attach"); if (attach >= 0) argv.splice(attach, 2);
  return {...guarded, command: provider.command, argv, cwd, healthServer: undefined, probeSession: undefined};
}
beforeEach(({task}) => {
  if (!controlledLegacyCases.has(task.name)) return;
  controlledAllowsSyntheticPacket = true;
  vi.spyOn(controlledOpenCode, "start").mockImplementation((p,cwd,prompt) => controlledLegacyPlan(p,cwd,prompt));
  vi.spyOn(controlledOpenCode, "resume").mockImplementation((p,cwd,session,prompt) => controlledLegacyPlan(p,cwd,prompt,session));
});
afterEach(() => {
  vi.restoreAllMocks();
  const unlock = root => { for (const e of fs.readdirSync(root,{withFileTypes:true})) {const f=path.join(root,e.name);if(e.isDirectory())unlock(f);if(!e.isSymbolicLink())fs.chmodSync(f,e.isDirectory()?0o700:0o600);}fs.chmodSync(root,0o700); };
  for (const root of controlledPacketCleanup) {unlock(root);fs.rmSync(root,{recursive:true,force:true});}
  controlledPacketCleanup = [];
});

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

test("active provider survives elapsed execution time and remains explicitly cancellable", async (t) => {
  const runtime = temp();
  const value = config(runtime, [["kimi"]]);
  value.providers.kimi.command = slow;
  let providerPid = null;
  const broker = new Broker(value);
  const existingRuntimes = new Set(fs.readdirSync(runtime));
  const execution = broker.run({ version: 4, host_provider: "codex", prompt: "remain active until cancelled", continuation: null });
  const runtimeId = fs.readdirSync(runtime).find((candidate) => !existingRuntimes.has(candidate));

  try {
    assert.ok(runtimeId, "run should create one runtime synchronously");
    await eventually(() => {
      const provider = readRuntime(runtime, runtimeId).providers?.kimi;
      if (provider?.status !== "running") return false;
      providerPid = provider.pid;
      return true;
    });
    const beforeJump = Date.now();
    vi.spyOn(Date, "now").mockImplementation(() => beforeJump + 600_001);
    let afterElapsed;
    let aliveAfterElapsed;
    try {
      assert.ok(Date.now() - beforeJump > 600_000);
      afterElapsed = readRuntime(runtime, runtimeId).providers.kimi;
      aliveAfterElapsed = isAlive(providerPid);
    } finally {
      vi.restoreAllMocks();
    }
    const cancelled = broker.cancel(runtimeId, "kimi");
    const result = await execution;
    const member = result.providers.find((item) => item.provider === "kimi");

    assert.deepEqual({
      status_after_elapsed: afterElapsed.status,
      alive_after_elapsed: aliveAfterElapsed,
      explicit_cancelled: cancelled.cancelled,
      final_status: member?.status,
      final_error: member?.error?.code,
    }, {
      status_after_elapsed: "running",
      alive_after_elapsed: true,
      explicit_cancelled: true,
      final_status: "cancelled",
      final_error: "CANCELLED",
    });
  } finally {
    vi.restoreAllMocks();
    if (runtimeId) {
      try {
        if (readRuntime(runtime, runtimeId).providers?.kimi?.status === "running") broker.shutdown();
      } catch {}
    }
    await execution.catch(() => {});
  }
});

test("explicit cancel stops an active provider", async () => {
  const runtime = temp();
  const value = config(runtime, [["kimi"]]);
  value.providers.kimi.command = slow;
  const broker = new Broker(value);
  const existingRuntimes = new Set(fs.readdirSync(runtime));
  const execution = broker.run({ version: 4, host_provider: "codex", prompt: "stop only when explicitly cancelled", continuation: null });
  const runtimeId = fs.readdirSync(runtime).find((candidate) => !existingRuntimes.has(candidate));

  try {
    assert.ok(runtimeId, "run should create one runtime synchronously");
    await eventually(() => readRuntime(runtime, runtimeId).providers?.kimi?.status === "running");
    const cancelled = broker.cancel(runtimeId, "kimi");
    const result = await execution;
    assert.equal(cancelled.cancelled, true);
    assert.equal(result.providers[0].status, "cancelled");
    assert.equal(result.providers[0].error.code, "CANCELLED");
  } finally {
    if (runtimeId) {
      try {
        if (readRuntime(runtime, runtimeId).providers?.kimi?.status === "running") broker.shutdown();
      } catch {}
    }
    await execution.catch(() => {});
  }
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

test("immediate provider failure preserves a successful sibling and v3 keeps deadline_ms null", async () => {
  const runtime = temp();
  const value = config(runtime, [["kimi", "claude-code"]]);
  value.providers.kimi.command = providerFailure;
  value.providers["claude-code"].command = fake;
  const attachments = fileOnlyAttachment(value);
  const broker = new Broker(value);
  const result = await broker.run({
    version: 4, host_provider: "opencode", required_result_protocol: "workflowhub-result.v3",
    provider_allowlist: ["kimi", "claude-code"], prompt: "parallel provider failure", review_mode: "single_round", continuation: null, attachments,
  });
  const members = Object.fromEntries(result.providers.map((item) => [item.identity.provider, item]));
  assert.equal(result.outcome, "partial");
  assert.equal(members.kimi.status, "failed");
  assert.equal(members.kimi.error.code, "PROVIDER_HEALTH_FAILED");
  assert.equal(members["claude-code"].status, "completed");
  assert.ok(result.providers.every((item) => item.deadline_ms === null));
  const persisted = readRuntime(value.runtime.root, result.runtime_id).providers.kimi;
  assert.equal(persisted.status, "failed");
  assert.equal(persisted.error.code, "PROVIDER_HEALTH_FAILED");
});

test("workflowhub provider allowlists reject every unconfigured provider", async () => {
  const broker = new Broker(config(temp(), [["kimi"]]));
  await assert.rejects(() => broker.run({
    version: 4,
    host_provider: "codex",
    provider_allowlist: ["kimi", "unknown/provider"],
    prompt: "review",
    continuation: null,
  }), { code: "PROTOCOL_INCOMPATIBLE" });
  await assert.rejects(() => broker.run({
    version: 4,
    host_provider: "codex",
    provider_allowlist: ["unknown/provider"],
    prompt: "review",
    continuation: null,
  }), { code: "PROTOCOL_INCOMPATIBLE" });
});

test("provider allowlist validation does not bypass frozen-material reuse validation", async () => {
  const broker = new Broker(config(temp(), [["kimi"]]));
  await assert.rejects(() => broker.run({
    version: 4,
    host_provider: "codex",
    provider_allowlist: ["kimi"],
    prompt: "review",
    continuation: { runtime_id: "11111111-1111-4111-8111-111111111111", reuse_frozen_material: false },
  }), { code: "REQUEST_INVALID" });
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

test("provider terminal recovery completes without an elapsed-time cutoff", async () => {
  const root = temp(); const value = config(root, [["opencode"]]);
  value.providers.opencode.command = terminalRecovery; value.providers.opencode.model = "deadline";
  const result = await new Broker(value).run({ version: 4, host_provider: "codex", prompt: "review", continuation: null });
  const state = readRuntime(root, result.runtime_id); const provider = state.providers.opencode;
  assert.equal(result.providers[0].status, "completed");
  assert.equal(provider.attempts.length, 2);
  assert.equal(provider.attempts[0].error.code, "PROVIDER_NO_TERMINAL_RESULT");
  assert.equal(provider.attempts[1].error, null);
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


// Independent ORACLE-N3-P2: provider protocol's blind -> reveal -> challenge contract.
// The adapter boundary is controlled; Broker.run, process execution and attachment
// preparation are real. These cases do not claim a native permission guard.
import kimiDirectionWorker from "../lib/adapters/kimi.mjs";
import { buildReviewMaterials as buildN3DirectionMaterials } from "../../wh-review/scripts/review-materials.mjs";
import { planDirectionReviewRequests as planN3Direction } from "../../wh-review/scripts/review-runner.mjs";

async function n3DirectionScenario({ mode = "normal", cancel = false, native = false } = {}) {
  const root = fs.realpathSync(temp()); const runtime = path.join(root, "runtime"); fs.mkdirSync(runtime);
  const selection = "SELECTION_ONLY_AFTER_RECONSTRUCTION_74291";
  const materials = { raw_requirement: "Deliver reliable reports", objective_facts: "The queue has two independent consumers", convergence_outline: "Which path avoids loss?", current_selection: selection, alternatives: "B", selection_rationale: "durability", key_assumptions: "bounded input" };
  const flow = planN3Direction(materials).flow;
  const packet = buildN3DirectionMaterials({ attachmentRoot: root, stage: "make-decision", reviewTrack: "direction", materials: { ...materials, direction_flow: flow } });
  const ids = native ? ["antigravity", "opencode"] : ["kimi/red", "kimi/blue"];
  const value = config(runtime, [ids]);
  if(native) value.providers.antigravity.allow_host_state = true;
  value.runtime.max_attachment_bytes = 2_000_000;
  value.attachment_roots = [{ root, sources: [".wh-review-packets"] }];
  const observations = []; const counts = new Map(); const transcript = [];
  const scan = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(item => item.isDirectory() ? scan(path.join(dir,item.name)) : item.isFile() ? [{ path: path.join(dir,item.name), text: fs.readFileSync(path.join(dir,item.name), "utf8") }] : []);
  vi.spyOn(kimiDirectionWorker, "start").mockImplementation((provider, cwd, prompt) => {
    const n = (counts.get(provider.id) ?? 0) + 1; counts.set(provider.id,n);
    const files = scan(cwd);
    const rawFiles = fs.existsSync(runtime) ? scan(runtime).filter(f => f.path.includes(`${path.sep}raw${path.sep}`)) : [];
    observations.push({ role: provider.id, n, cwd, text: prompt + files.map(f=>f.text).join("\n"), raw: rawFiles.map(f=>f.text).join("\n") });
    const text = mode === "invalid" && provider.id === "kimi/red" && n === 1 ? "INVALID_INTERMEDIATE" : JSON.stringify({ findings: n === 3 ? [{ severity: "minor", path: "requirements/raw_requirement.md", line: 1, issue: `${provider.id} final challenge`, recommendation: "retain evidence" }] : [] });
    transcript.push(text);
    const fail = mode === "failure" && provider.id === "kimi/red" && n === 1;
    const hang = cancel && provider.id === "kimi/red" && n === 1;
    const code = hang ? 'process.stdout.write("CANCEL_RAW");setInterval(()=>{},1000)' : `process.stdout.write(${JSON.stringify(text)});process.stderr.write("step-stderr-${n}");process.exit(${fail ? 7 : 0})`;
    return { command: process.execPath, argv: ["-e", code], cwd, input: null, env: {}, redact: [] };
  });
  vi.spyOn(kimiDirectionWorker, "parse").mockImplementation((stdout) => {
    try { JSON.parse(stdout); return { ok: true, text: stdout, session_id: "controlled-direction", usage: null }; }
    catch { return { ok: false, parse_outcome: "invalid", error: { code: "PROVIDER_OUTPUT_INVALID", message: "invalid controlled JSON" } }; }
  });
  const unsafeStarts=[];
  const broker = new Broker(value, {onStart: (info)=>unsafeStarts.push(info)});
  try {
    const execution = broker.run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v3", provider_allowlist: ids, review_mode: "single_round", prompt: "Review using the supplied direction protocol", review_flow: flow, continuation: null, attachments: { root, delivery: "file_only", manifest: { version: 1, bundle_id: "n3-direction", entries: packet.deliveryManifest.map(({path: name,bytes,sha256})=>({source: `${packet.sourcePrefix}/${name}`,destination:name,size:bytes,sha256,embed:false})) } } });
    if (cancel) {
      await eventually(() => observations.some(o=>o.role==="kimi/red"));
      const id = fs.readdirSync(runtime).find(name => fs.existsSync(path.join(runtime,name,"runtime.json"))) ?? fs.readdirSync(runtime)[0];
      await eventually(() => readRuntime(runtime,id).providers?.["kimi/red"]?.status === "running");
      await eventually(() => scan(runtime).some(f=>f.path.includes(`${path.sep}raw${path.sep}`) && f.text.includes("CANCEL_RAW")));
      broker.cancel(id,"kimi/red");
    }
    const result = await execution;
    const originals = scan(runtime).filter(f=>f.path.includes(`${path.sep}raw${path.sep}`));
    return { result, observations, originals, selection, counts, root, packet, transcript, unsafeStarts };
  } catch (error) { packet.dispose(); fs.rmSync(root,{recursive:true,force:true}); throw error; }
}
function n3Dispose(s) { s.packet.dispose(); const r=path.join(s.root,"runtime"); for(const id of fs.readdirSync(r)) if (/^[0-9a-f-]{36}$/i.test(id)) removeRuntimeDirectory(r,id); fs.rmSync(s.root,{recursive:true,force:true,maxRetries:10,retryDelay:30}); }

test("N3 P2 direction lifecycle: one public group executes each independent role three times with genuinely blind packets and durable raw outputs", async () => {
  const s = await n3DirectionScenario();
  try {
    assert.deepEqual([...s.counts], [["kimi/red",3],["kimi/blue",3]], "each configured role must execute reconstruct, reveal and challenge inside this one public call");
    assert.equal(s.result.providers.length,2);
    for (const role of ["kimi/red","kimi/blue"]) {
      const steps=s.observations.filter(o=>o.role===role);
      assert.equal(steps[0].text.includes(s.selection),false,"blind provider cannot read current choice through any packet file or prompt");
      assert.equal(steps[1].text.includes(s.selection),true,"reveal receives the actual choice");
      assert.equal(new Set(steps.map(o=>o.cwd)).size,3,"different step packets must be real workspaces");
      assert.ok(steps[1].raw.includes('{"findings":[]}'),"reconstruction raw bytes must be saved before reveal is created");
      const member=s.result.providers.find(p=>p.identity.provider===role);
      assert.equal(member.status,"completed");
      assert.match(member.output,/final challenge/);
    }
    assert.ok(s.originals.some(f=>f.text.includes('step-stderr-1')));
    assert.ok(s.originals.some(f=>f.text.includes('final challenge')));
    s.packet.dispose();
    for(const original of s.originals) assert.equal(fs.readFileSync(original.path,"utf8"),original.text,"packet cleanup must preserve original process output references");
  } finally { n3Dispose(s); }
});
for (const mode of ["invalid","failure"]) test(`N3 P2 direction lifecycle: ${mode} reconstruction stops that role and preserves successful concurrent sibling`, async()=>{
  const s=await n3DirectionScenario({mode});
  try {
    assert.equal(s.counts.get("kimi/red"),1,"invalid or failed intermediate output must not start reveal");
    assert.equal(s.counts.get("kimi/blue"),3,"one failed role cannot cancel its sibling");
    assert.equal(s.result.providers.find(p=>p.identity.provider==="kimi/red").status,"failed");
    assert.equal(s.result.providers.find(p=>p.identity.provider==="kimi/blue").status,"completed");
    assert.ok(s.originals.some(f=>f.text.includes(mode==="invalid" ? "INVALID_INTERMEDIATE" : '{"findings":[]}')));
  } finally { n3Dispose(s); }
});
test("N3 P2 direction lifecycle: cancellation stops progression without killing the other role or losing emitted bytes", async()=>{
  const s=await n3DirectionScenario({cancel:true});
  try {
    assert.equal(s.counts.get("kimi/red"),1);
    assert.equal(s.counts.get("kimi/blue"),3);
    assert.equal(s.result.providers.find(p=>p.identity.provider==="kimi/red").status,"cancelled");
    assert.equal(s.result.providers.find(p=>p.identity.provider==="kimi/blue").status,"completed");
    assert.ok(s.originals.some(f=>f.text.includes("CANCEL_RAW")));
  } finally { n3Dispose(s); }
});

test("N3 P2 direction lifecycle: native adapters without proved hard guard stay unavailable before any unsafe process starts", async()=>{
  const s=await n3DirectionScenario({native:true});
  try {
    assert.equal(s.unsafeStarts.length,0,"plan mode, chmod and prompt restrictions do not authorize an unguarded provider start");
    assert.equal(s.result.outcome,"unavailable");
    assert.ok(s.result.providers.every(p=>p.status!=="completed" && p.output===null));
    assert.ok(s.result.providers.every(p=>p.error && /guard|capability|read.only|sandbox|unavailable/i.test(p.error.code+" "+p.error.message)),"each unavailable route must expose the missing hard boundary");
  } finally { n3Dispose(s); }
});

import n3CorrectionAg from "../lib/adapters/antigravity.mjs";
// Public Broker, step delivery and AG startup policy are real. Only execution
// after guarded plan construction becomes a controlled child; no model runs.
async function n3CorrectionDirection(mode) {
  const root=fs.realpathSync(temp()),runtime=path.join(root,"runtime");fs.mkdirSync(runtime);
  const materials={raw_requirement:"Keep delivered reports",objective_facts:"Two real queue consumers",convergence_outline:"Which path preserves reports?",current_selection:"CORRECTION_SELECTION_HIDDEN",alternatives:"B",selection_rationale:"durability",key_assumptions:"bounded queue"};
  const flow=planN3Direction(materials).flow;
  const packet=buildN3DirectionMaterials({attachmentRoot:root,stage:"make-decision",reviewTrack:"direction",materials:{...materials,direction_flow:flow}});
  const value=config(runtime,[["antigravity"]]);value.providers.antigravity.command="/Users/Hugh/.local/bin/agy";value.providers.antigravity.allow_host_state=true;
  value.attachment_roots=[{root,sources:[".wh-review-packets"]}];
  const starts=[];const original=n3CorrectionAg.start;
  vi.spyOn(n3CorrectionAg,"start").mockImplementation((p,cwd,prompt,r)=>{
    const guarded=original(p,cwd,prompt,r);const manifest=JSON.parse(fs.readFileSync(path.join(cwd,"bundle","attachments-manifest.json"),"utf8"));
    const n=starts.length+1;const target=manifest.files.find(f=>/^materials\/\d+-raw_requirement\./.test(f.target)).target;
    starts.push({cwd,prompt:guarded.argv[guarded.argv.indexOf("-p")+1],files:manifest.files.map(f=>f.target),target});
    const findingPath=mode==="packet-path" ? path.join(cwd,"bundle",target) : mode==="host-path" ? "/etc/n3-private-host-config" : `bundle/${target}`;
    const response=JSON.stringify(n===3 ? {findings:[{severity:"minor",path:findingPath,line:1,issue:"Preserve source trace",recommendation:"Keep the packet reference"}]} : {independent_observation:`step-${n}`});
    const stdout=JSON.stringify({event:"result",result:{status:"SUCCESS",response}})+"\n";
    return {...guarded,command:process.execPath,argv:["-e",`process.stdout.write(${JSON.stringify(stdout)})`]};
  });
  try {
    const result=await new Broker(value).run({version:4,host_provider:"codex",required_result_protocol:"workflowhub-result.v3",provider_allowlist:["antigravity"],review_mode:"single_round",prompt:"Review supplied direction materials",review_flow:flow,continuation:null,attachments:{root,delivery:"file_only",manifest:{version:1,bundle_id:"n3-native-correction",entries:packet.deliveryManifest.map(({path:name,bytes,sha256})=>({source:`${packet.sourcePrefix}/${name}`,destination:name,size:bytes,sha256,embed:false}))}}});
    return {result,starts,root,packet};
  } catch(error) {n3Dispose({root,packet});throw error;}
}
test("N3 P2 native correction: actual first AG launch prompt locates every admitted blind bundle member",async()=>{
  const s=await n3CorrectionDirection("prompt");try {
    assert.equal(s.result.providers[0].status,"completed");assert.equal(s.starts.length,3);
    const first=s.starts[0];assert.equal(first.prompt.includes("CORRECTION_SELECTION_HIDDEN"),false);
    for(const target of first.files)assert.ok(first.prompt.includes(`bundle/${target}`),`native -p prompt must locate admitted read-only bundle/${target}`);
  }finally{n3Dispose(s);}
});
test("N3 P2 native correction: challenge returns a current packet absolute path as a relative reference",async()=>{
  const s=await n3CorrectionDirection("packet-path");try {
    assert.equal(s.starts.length,3);const result=s.result.providers[0];
    assert.equal(result.status,"completed","a legitimate current challenge packet reference must be normalized before the private-path guard");
    assert.equal(JSON.parse(result.output).findings[0].path,`bundle/${s.starts[2].target}`);
    assert.equal(result.output.includes(s.starts[2].cwd),false);
  }finally{n3Dispose(s);}
});
test("N3 P2 native correction: challenge still rejects an absolute host reference outside the packet",async()=>{
  const s=await n3CorrectionDirection("host-path");try {
    assert.equal(s.starts.length,3);const result=s.result.providers[0];
    assert.equal(result.status,"failed");assert.equal(result.output,null);assert.ok(result.error);
    assert.equal(JSON.stringify(s.result).includes("/etc/n3-private-host-config"),false);
  }finally{n3Dispose(s);}
});


// Independent carrier oracle: provider-protocol.md permits one whole JSON
// object or one whole fenced JSON object. Never extract candidates from prose.
async function n3CarrierDirection(wrap) {
  const root=fs.realpathSync(temp()),runtime=path.join(root,"runtime");fs.mkdirSync(runtime);
  const selection="CARRIER_SELECTION_ONLY_AFTER_REVEAL";
  const materials={raw_requirement:"Preserve reports",objective_facts:"Two independent consumers",convergence_outline:"Which path avoids loss?",current_selection:selection,alternatives:"B",selection_rationale:"durability",key_assumptions:"bounded input"};
  const flow=planN3Direction(materials).flow;
  const packet=buildN3DirectionMaterials({attachmentRoot:root,stage:"make-decision",reviewTrack:"direction",materials:{...materials,direction_flow:flow}});
  const value=config(runtime,[["antigravity"]]);value.providers.antigravity.command="/Users/Hugh/.local/bin/agy";value.providers.antigravity.allow_host_state=true;value.attachment_roots=[{root,sources:[".wh-review-packets"]}];
  const starts=[],original=n3CorrectionAg.start;
  vi.spyOn(n3CorrectionAg,"start").mockImplementation((p,cwd,prompt,r)=>{
    const guarded=original(p,cwd,prompt,r),n=starts.length+1;
    const files=fs.readdirSync(path.join(cwd,"bundle"),{recursive:true}).filter(f=>fs.statSync(path.join(cwd,"bundle",f)).isFile()).map(f=>fs.readFileSync(path.join(cwd,"bundle",f),"utf8")).join("\n");
    const object=n===3?{findings:[{severity:"minor",path:"materials/raw_requirement.md",line:1,issue:"Keep reports",recommendation:"Retain evidence"}]}:n===1?{problem:"Preserve reports",constraints:["Two consumers"],non_goals:[],questions:[],unknowns:[]}:{agreements:["Preserve reports"],differences:[],unknowns:[]};
    const response=wrap(JSON.stringify(object),n);starts.push({cwd,prompt,files,response});
    const stdout=JSON.stringify({event:"result",result:{status:"SUCCESS",response}})+"\n";
    return {...guarded,command:process.execPath,argv:["-e",'process.stdout.write('+JSON.stringify(stdout)+')']};
  });
  try {
    const result=await new Broker(value).run({version:4,host_provider:"codex",required_result_protocol:"workflowhub-result.v3",provider_allowlist:["antigravity"],review_mode:"single_round",prompt:"Review current direction",review_flow:flow,continuation:null,attachments:{root,delivery:"file_only",manifest:{version:1,bundle_id:"n3-carrier",entries:packet.deliveryManifest.map(({path:name,bytes,sha256})=>({source:packet.sourcePrefix+"/"+name,destination:name,size:bytes,sha256,embed:false}))}}});
    const id=result.runtime_id,state=readRuntime(runtime,id);return {root,packet,result,starts,state,selection};
  }catch(error){n3Dispose({root,packet});throw error;}
}
for(const form of ["plain","fenced"])test("N3 P2 carrier contract: accepts whole "+form+" JSON at all three native terminal steps",async()=>{
  const s=await n3CarrierDirection(text=>form==="plain"?text:"\x60\x60\x60json\n"+text+"\n\x60\x60\x60");try{
    assert.equal(s.result.providers[0].status,"completed","one whole fenced JSON object is an existing permitted carrier");assert.equal(s.starts.length,3);
    assert.equal((s.starts[0].prompt+s.starts[0].files).includes(s.selection),false);assert.equal(s.starts[1].files.includes(s.selection),true);
    assert.equal(JSON.parse(s.result.providers[0].output).findings[0].issue,"Keep reports");
    const attempts=s.state.providers.antigravity.attempts;assert.equal(attempts.length,3);
    for(let i=0;i<3;i++){const raw=fs.readFileSync(path.join(s.root,"runtime",s.result.runtime_id,attempts[i].raw_stdout_ref),"utf8");assert.equal(JSON.parse(raw.trim()).result.response,s.starts[i].response,"native carrier bytes must remain recoverable from the process original");}
  }finally{n3Dispose(s);}
});
const n3BadCarriers={malformed:()=>"\x60\x60\x60json\n{bad}\n\x60\x60\x60",multiple:text=>text+"\n"+text,prefix:text=>"Explanation\n\x60\x60\x60json\n"+text+"\n\x60\x60\x60",suffix:text=>"\x60\x60\x60json\n"+text+"\n\x60\x60\x60\nExplanation",two_fences:text=>"\x60\x60\x60json\n"+text+"\n\x60\x60\x60\n\x60\x60\x60json\n"+text+"\n\x60\x60\x60",array:()=>"[]",empty_object:()=>"{}"};
for(const [name,wrap]of Object.entries(n3BadCarriers))test("N3 P2 carrier contract: rejects "+name+" without reveal or challenge",async()=>{
  const s=await n3CarrierDirection(wrap);try{assert.equal(s.starts.length,1);assert.equal(s.result.providers[0].status,"failed");assert.equal(s.result.providers[0].output,null);assert.equal(s.result.providers[0].error.code,"PROVIDER_OUTPUT_INVALID");assert.equal(s.state.providers.antigravity.attempts.length,1);}finally{n3Dispose(s);}
});

test.each([{ delivery: "file_only" }, { delivery: "always_embed" }, { delivery: "file_only", managed: true }, { delivery: "file_only", detail: true }, { delivery: "file_only", malformed: true }, { delivery: "file_only", lingering: true }, { delivery: "file_only", tamper: "missing" }, { delivery: "file_only", tamper: "invalid" }, { delivery: "file_only", tamper: "mismatch" }, { delivery: "file_only", contracts: true }])("direction managed provider physically hides the choice until reconstruction completes (%j)", async ({ delivery, managed = false, detail = false, malformed = false, lingering = false, tamper = null, contracts = false }) => {
  const root = temp(), materialRoot = temp(), fixtureRoot = temp();
  const trace = path.join(fixtureRoot, "visible.jsonl"), cli = path.join(fixtureRoot, "direction-cli.mjs");
  const secret = "CHOICE_ONLY_AFTER_RECONSTRUCTION_7491";
  fs.writeFileSync(cli, `#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';import http from 'node:http';
// Controlled CLI implements native guard readback, never actual model capability.
const nativeArgs=process.argv.slice(2),terminalFile=${JSON.stringify(path.join(fixtureRoot, 'terminal.json'))};
if(nativeArgs.includes('--version')){console.log('1.19.0');process.exit(0);}
if(nativeArgs.includes('debug')){const config=JSON.parse(process.env.OPENCODE_CONFIG_CONTENT),permission=JSON.parse(process.env.OPENCODE_PERMISSION);if(JSON.stringify(config.permission)!==JSON.stringify(permission))throw Error('guard config differs');console.log(JSON.stringify({name:'build',tools:{read:true},permission:[{permission:'*',pattern:'*',action:permission['*']},...Object.entries(permission.read).map(([pattern,action])=>({permission:'read',pattern,action}))]}));process.exit(0);}
if(nativeArgs[0]==='serve'){http.createServer((req,res)=>{const value=fs.existsSync(terminalFile)?JSON.parse(fs.readFileSync(terminalFile,'utf8')):null;res.setHeader('content-type','application/json');if(req.url==='/global/health')res.end(JSON.stringify({healthy:true}));else if(req.url==='/session/status')res.end(JSON.stringify(value?{[value.id]:{type:'idle'}}:{}));else if(req.url.includes('/message'))res.end(JSON.stringify(value?[{info:{sessionID:value.id,role:'assistant',time:{completed:1},finish:'stop'},parts:[{type:'text',text:value.text}]}]:[]));else res.end('[]');}).listen(Number(nativeArgs[nativeArgs.indexOf('--port')+1]),'127.0.0.1');await new Promise(()=>{});}
// external_directory remains denied by the actual config above.
let prompt='';for await(const chunk of process.stdin)prompt+=chunk;
const args=process.argv.slice(2),cwd=(args[args.indexOf('--dir')+1]??process.cwd()).replaceAll('%25','%');
const read=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?read(path.join(dir,e.name)):[{path:path.relative(cwd,path.join(dir,e.name)),body:fs.readFileSync(path.join(dir,e.name),'utf8')}]);
const files=read(cwd),step=prompt.match(/Private direction-review\\.v1 step: (reconstruct|reveal|challenge)/)?.[1]??'combined';
let previous_child_alive=false;const childFile=${JSON.stringify(path.join(fixtureRoot, 'child.pid'))};if(step!=='reconstruct'&&fs.existsSync(childFile)){try{process.kill(Number(fs.readFileSync(childFile,'utf8')),0);previous_child_alive=true}catch{}}
fs.appendFileSync(${JSON.stringify(trace)},JSON.stringify({step,previous_child_alive,admitted_contracts:files.map(f=>({path:f.path.replace(/^bundle\\//,''),body:f.body})).filter(f=>['contracts/make-decision.md','contracts/provider-protocol.md'].includes(f.path)),choice_present:files.some(f=>f.body.includes(${JSON.stringify(secret)})),prompt_choice_present:prompt.includes(${JSON.stringify(secret)}),navigation_choice_present:files.some(f=>/manifest|instructions/.test(f.path)&&f.body.includes(${JSON.stringify(secret)})),choice_path_present:files.some(f=>f.path.includes('current_selection')),reconstruction_present:files.some(f=>f.body.includes('fixture-independent-reconstruction'))||prompt.includes('fixture-independent-reconstruction'),reveal_present:files.some(f=>f.body.includes('fixture-revealed-choice'))||prompt.includes('fixture-revealed-choice')})+'\\n');
const text=step==='reconstruct'?(${JSON.stringify(malformed)}?'INVALID_INTERMEDIATE_JSON':JSON.stringify({independent_reconstruction:'fixture-independent-reconstruction'})):step==='reveal'?JSON.stringify({revealed_choice:'fixture-revealed-choice'}):JSON.stringify({findings:[]});
let background=null;if(${JSON.stringify(lingering)}&&step==='reconstruct'){background=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});console.log('ready');setInterval(()=>{},1000)"],{stdio:['ignore','pipe','ignore']});await new Promise(resolve=>background.stdout.once('data',resolve));fs.writeFileSync(childFile,String(background.pid));}
fs.writeFileSync(terminalFile,JSON.stringify({id:'fixture-'+step,text}));console.log(JSON.stringify({type:'session.completed',session_id:'fixture-'+step,text}));if(background)setInterval(()=>{},1000);
`, { mode: 0o700 });
  const flow = { version: "direction-review.v1", public_request_count: 1, steps: [
    { id: "reconstruct", visible: ["raw_requirement", "objective_facts"], hidden_until: "reveal" },
    { id: "reveal", after: ["reconstruct"], visible: ["current_selection", "alternatives", "selection_rationale", "key_assumptions", "independent_reconstruction"] },
    { id: "challenge", after: ["reveal"], visible: ["revealed_choice", "independent_reconstruction"], output: "findings" },
  ], output: { one_provider_result: true, one_logical_fact: true } };
  const material = { "materials/01-raw_requirement.md": "Trim user input.", "materials/02-objective_facts.md": "No implementation exists.", "materials/03-current_selection.md": secret, "direction_flow.json": JSON.stringify(flow), "manifest.json": JSON.stringify({ navigation: secret }), "review-instructions.md": "Revealed selection: " + secret };
  const expectedContracts = [
    {path:"contracts/make-decision.md",body:"Frozen direction scope and constraints"},
    {path:"contracts/provider-protocol.md",body:"Return one complete JSON object using the supplied independent role"},
  ];
  if (contracts) for (const {path: name,body} of expectedContracts) material[name] = body;
  if (detail || tamper === "missing") delete material["direction_flow.json"];
  if (tamper === "invalid") material["direction_flow.json"] = "invalid-json";
  if (tamper === "mismatch") material["direction_flow.json"] = JSON.stringify({ ...flow, public_request_count: 2 });
  const entries = Object.entries(material).map(([destination, body]) => { const file = path.join(materialRoot, destination); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, body); return { source: destination, destination, size: Buffer.byteLength(body), sha256: createHash("sha256").update(body).digest("hex"), embed: delivery === "always_embed" }; });
  const value = config(root, [["opencode"]]); value.providers.opencode.command = cli; value.providers.opencode.model = "fixture"; value.attachment_roots = [{ root: materialRoot, sources: entries.map(e => e.source) }];
  const intermediateStates = [];
  const broker = new Broker(value, { ...(lingering ? { terminationGraceMs: 200, healthCheckIntervalMs: 500, probeSession: async ({ session_id }) => {
    if (!session_id) return { status: "busy", session_id: null, cursor: null, raw: null, error: null };
    const step = session_id.slice("fixture-".length), text = step === "reconstruct" ? JSON.stringify({ independent_reconstruction: "fixture-independent-reconstruction" }) : step === "reveal" ? JSON.stringify({ revealed_choice: "fixture-revealed-choice" }) : JSON.stringify({ findings: [] });
    return { status: "completed", session_id, cursor: null, raw: { stdout: JSON.stringify({ type: "session.completed", session_id, text }) + "\n", stderr: "" }, error: null };
  } } : {}), onStart() { const id = fs.readdirSync(root).find(name => /^[0-9a-f-]{36}$/.test(name)); const previous = id ? readRuntime(root, id).providers?.opencode : null; if (previous?.attempts?.length) intermediateStates.push({ status: previous.status, output: previous.output }); } });
  const request = { version: 4, host_provider: "dsh", required_result_protocol: "workflowhub-result.v3", provider_allowlist: ["opencode"], review_mode: "single_round", ...(detail ? {} : { review_flow: flow }), prompt: "Review direction and return findings. Current choice: " + secret + "\nPaired review role: red. " + secret, attachments: { root: materialRoot, delivery, manifest: { version: 1, bundle_id: "direction-fixture", entries } } };
  if (tamper) {
    await assert.rejects(broker.run(request), error => error.code === "MATERIAL_INCOMPLETE");
    assert.throws(() => broker.startManaged(request, "invalid-direction-" + Date.now()), error => error.code === "MATERIAL_INCOMPLETE");
    assert.equal(fs.existsSync(trace), false); assert.equal(intermediateStates.length, 0);
    return;
  }
  let result;
  if (managed) {
    const started = broker.startManaged(request, "direction-fixture-" + Date.now());
    await eventually(() => broker.managedStatus(started.runtime_id).state === "terminal");
    result = broker.managedStatus(started.runtime_id).group;
  } else result = await broker.run(request);
  if (malformed) {
    assert.equal(result.providers[0].status, "failed"); assert.equal(result.providers[0].error.code, "PROVIDER_OUTPUT_INVALID");
    const records = fs.readFileSync(trace, "utf8").trim().split("\n").map(line => JSON.parse(line));
    assert.equal(records.length, 1); assert.equal(records[0].choice_present, false);
    assert.equal(result.providers[0].attempts[0].parse_outcome, "invalid");
    assert.equal(fs.existsSync(path.join(root, result.runtime_id, "workspace", "opencode-direction-reveal")), false);
    return;
  }
  if (detail) {
    assert.equal(result.providers[0].status, "completed"); assert.equal(result.providers[0].attempts.length, 1);
    const records = fs.readFileSync(trace, "utf8").trim().split("\n").map(line => JSON.parse(line));
    assert.equal(records.length, 1); assert.equal(records[0].choice_present, true); assert.equal(records[0].step, "combined");
    return;
  }
  assert.equal(result.providers[0].status, "completed", JSON.stringify(result.providers[0].error));
  const visible = fs.readFileSync(trace, "utf8").trim().split("\n").map(line => JSON.parse(line));
  assert.equal(visible[0].choice_present, false, "initial physical provider packet must not contain revealed choice bytes");
  assert.equal(visible[0].prompt_choice_present, false, "blind prompt must not reveal choice bytes");
  assert.equal(visible[0].navigation_choice_present, false, "blind manifest/navigation must not reveal choice bytes");
  assert.equal(visible[0].choice_path_present, false, "blind cwd must not contain a choice attachment");
  if (!managed) assert.deepEqual(intermediateStates, [{ status: "running", output: undefined }, { status: "running", output: undefined }]);
  assert.deepEqual(visible.map(row => row.step), ["reconstruct", "reveal", "challenge"]);
  if (contracts) for (const row of visible) {
    assert.equal(new Set(row.admitted_contracts.map(file=>file.path)).size,2,"each physical step must contain both unique contract paths");
    assert.deepEqual(row.admitted_contracts.sort((a,b)=>a.path.localeCompare(b.path)),expectedContracts,"each physical step must preserve both full contract bodies");
  }
  assert.equal(visible[1].choice_present || visible[1].prompt_choice_present, true); assert.equal(visible[1].reconstruction_present, true);
  assert.equal(visible[2].reveal_present, true);
  if (lingering) assert.equal(visible[1].previous_child_alive, false, "reveal cannot be created while a previous native process-group child survives");
  assert.equal(result.providers.length, 1); assert.equal(result.providers[0].status, "completed");
  assert.deepEqual(JSON.parse(result.providers[0].output), { findings: [] });
  assert.equal(result.providers[0].attempts.length, 3);
  for (let index = 1; index < 3; index += 1) assert.ok(result.providers[0].attempts[index - 1].completed_at_ms <= result.providers[0].attempts[index].started_at_ms);
  const stored = readRuntime(root, result.runtime_id).providers.opencode;
  assert.deepEqual(stored.attempts[0].delivery.provider_visible_attachment_manifest.map(file => file.destination), ["materials/01-raw_requirement.md", "materials/02-objective_facts.md", ...(contracts ? expectedContracts.map(file=>file.path) : [])]);
  assert.ok(stored.attempts.every(attempt => attempt.raw_stdout_ref && fs.existsSync(path.join(root, result.runtime_id, attempt.raw_stdout_ref))));
  assert.ok(stored.attempts.every(attempt => attempt.raw_input_ref));
  const nativeInput = fs.readFileSync(path.join(root, result.runtime_id, stored.attempts[0].raw_input_ref), "utf8");
  assert.equal(nativeInput.includes(secret), false, "actual native wire input must not contain choice bytes");
  assert.deepEqual(result.providers[0].attempts.map(item => item.session_id), ["fixture-reconstruct", "fixture-reveal", "fixture-challenge"]);
});
