import { describe, expect, it } from "vitest";
import { EventEmitter } from "node:events";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BrokerClient } from "../broker-client.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

describe("BrokerClient", () => {
  it("discovers, normalizes, freezes, and caches broker-owned capabilities from doctor stdout", async () => {
    let calls = 0;
    const client = new BrokerClient({ command: ["node", "/broker/scripts/3rd-review.mjs"], config: "/cfg.json", spawnImpl() {
      calls += 1; const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
      queueMicrotask(() => { child.stdout.emit("data", JSON.stringify({ version: 4, capabilities: { attachments: true, cancel_source: true }, verification: "executable_only", providers: [
        { provider: "opencode", status: "ready", capabilities: { continuation: true, attachment_delivery: ["always_embed"] } },
        { provider: "kimi", status: "disabled", capabilities: { continuation: true, attachment_delivery: ["file_only"] } },
      ] })); child.emit("close", 0); }); return child;
    } });
    const first = await client.discoverCapabilities();
    expect(first).toEqual({ version: 4, capabilities: { attachments: true, cancel_source: true }, providers: [
      { provider: "kimi", status: "disabled", capabilities: { continuation: true, attachment_delivery: ["file_only"] } },
      { provider: "opencode", status: "ready", capabilities: { continuation: true, attachment_delivery: ["always_embed"] } },
    ] });
    expect(Object.isFrozen(first)).toBe(true); expect(Object.isFrozen(first.providers[0].capabilities.attachment_delivery)).toBe(true);
    await expect(client.discoverCapabilities()).resolves.toBe(first); expect(calls).toBe(1);
  });

  it("passes its fixed packet root to doctor before accepting attachment capability", async () => {
    const calls = [];
    const client = new BrokerClient({ command: ["node", "/broker/scripts/3rd-review.mjs"], config: "/cfg.json", attachmentRoot: "/approved/packet-root", spawnImpl(command, args) {
      calls.push({ command, args }); const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
      queueMicrotask(() => { child.stdout.emit("data", JSON.stringify({ version: 4, capabilities: { attachments: true, cancel_source: true }, attachment_root: { status: "ready" }, providers: [] })); child.emit("close", 0); }); return child;
    } });
    await expect(client.discoverCapabilities()).resolves.toMatchObject({ capabilities: { attachments: true } });
    expect(calls[0].args).toContain("--attachments-root=/approved/packet-root");
  });

  it("accepts additive doctor capabilities but projects only the v4 capabilities it owns", async () => {
    const client = new BrokerClient({ command: ["node", "/broker/scripts/3rd-review.mjs"], config: "/cfg.json", spawnImpl() {
      const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
      queueMicrotask(() => { child.stdout.emit("data", JSON.stringify({
        version: 4,
        capabilities: { attachments: true, cancel_source: true, packet_integrity: { algorithm: "sha256" } },
        providers: [{ provider: "opencode", status: "ready", capabilities: {
          continuation: true, attachment_delivery: ["always_embed"], prompt_stdin: true,
        } }],
      })); child.emit("close", 0); }); return child;
    } });
    await expect(client.discoverCapabilities()).resolves.toEqual({ version: 4, capabilities: { attachments: true, cancel_source: true }, providers: [
      { provider: "opencode", status: "ready", capabilities: { continuation: true, attachment_delivery: ["always_embed"] } },
    ] });
  });

  it("fails closed when doctor cannot verify the fixed packet root", async () => {
    const client = new BrokerClient({ command: ["node", "/broker/scripts/3rd-review.mjs"], config: "/cfg.json", attachmentRoot: "/approved/packet-root", spawnImpl() {
      const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
      queueMicrotask(() => { child.stdout.emit("data", JSON.stringify({ version: 4, capabilities: { attachments: true, cancel_source: true }, attachment_root: { status: "unavailable", error: { code: "ATTACHMENT_ROOT_FORBIDDEN" } }, providers: [] })); child.emit("close", 0); }); return child;
    } });
    await expect(client.discoverCapabilities()).rejects.toThrow(/attachment root.*ready/i);
  });

  it.each([
    [{ version: 3, capabilities: { attachments: true, cancel_source: true }, providers: [] }, /version/],
    [{ version: 4, capabilities: { attachments: true }, providers: [] }, /capabilities/],
    [{ version: 4, capabilities: { attachments: true, cancel_source: true }, providers: [{ provider: "kimi", status: "ready", capabilities: { continuation: true, attachment_delivery: ["file_only"] } }, { provider: "kimi", status: "ready", capabilities: { continuation: true, attachment_delivery: ["file_only"] } }] }, /duplicate/],
    [{ version: 4, capabilities: { attachments: true, cancel_source: true }, providers: [{ provider: "kimi", status: "online", capabilities: { continuation: true, attachment_delivery: ["file_only"] } }] }, /status/],
    [{ version: 4, capabilities: { attachments: true, cancel_source: true }, providers: [{ provider: "kimi", status: "ready", capabilities: { continuation: "yes", attachment_delivery: ["file_only"] } }] }, /continuation/],
    [{ version: 4, capabilities: { attachments: true, cancel_source: true }, providers: [{ provider: "kimi", status: "ready", capabilities: { continuation: true, attachment_delivery: ["auto"] } }] }, /attachment_delivery/],
  ])("rejects malformed doctor capability snapshots", async (stdout, error) => {
    const client = new BrokerClient({ command: ["node", "/broker/scripts/3rd-review.mjs"], config: "/cfg.json", spawnImpl() {
      const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); queueMicrotask(() => { child.stdout.emit("data", JSON.stringify(stdout)); child.emit("close", 0); }); return child;
    } });
    await expect(client.discoverCapabilities()).rejects.toThrow(error);
  });
  it("uses only the v4 run/config/request CLI boundary and leaves timeout ownership to broker", async () => {
    const calls = [];
    const client = new BrokerClient({ command: ["node", "/broker/scripts/3rd-review.mjs"], config: "/cfg.json", spawnImpl(command, args) {
      calls.push({ command, args }); const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
      queueMicrotask(() => { child.stdout.emit("data", '{"version":4,"runtime_id":"r","providers":[]}'); child.emit("close", 0); }); return child;
    } });
    await expect(client.run({ request: { version: 4, host_provider: "codex", prompt: "p", continuation: null } })).resolves.toMatchObject({ version: 4 });
    expect(calls[0]).toMatchObject({ command: "node" });
    expect(calls[0].args).toContain("run"); expect(calls[0].args).toContain("--config=/cfg.json");
    expect(calls[0].args.some((arg) => arg.startsWith("--request="))).toBe(true);
    expect(calls[0].args.join(" ")).not.toMatch(/run-heterologous|--diff=|--output=|timeout/i);
  });

  it.each(["opencode", "kimi"])("copies %s original stdout/stderr from private broker state and preserves its hashes", async (provider) => {
    const root = mkdtempSync(join(tmpdir(), "wh-review-raw-audit-"));
    try {
      const runtimeRoot = join(root, "runtime"); const runtimeId = "11111111-1111-4111-8111-111111111111";
      const runtime = join(runtimeRoot, runtimeId); const rawDir = join(runtime, "raw", provider); mkdirSync(rawDir, { recursive: true });
      const stdout = `wire ${provider} stdout\\n{\"verdict\":\"pass\"}\\n`; const stderr = `${provider} stderr\\n`;
      writeFileSync(join(rawDir, "stdout"), stdout); writeFileSync(join(rawDir, "stderr"), stderr);
      writeFileSync(join(runtime, "state.json"), JSON.stringify({ runtime_id: runtimeId, providers: { [provider]: {
        raw_stdout_ref: `raw/${provider}/stdout`, raw_stdout_sha256: sha256(stdout), raw_stderr_ref: `raw/${provider}/stderr`, raw_stderr_sha256: sha256(stderr),
      } } }));
      const config = join(root, "config.json"); writeFileSync(config, JSON.stringify({ version: 4, runtime: { root: runtimeRoot } }));
      const client = new BrokerClient({ command: ["node", "/broker/scripts/3rd-review.mjs"], config, spawnImpl() {
        const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
        queueMicrotask(() => { child.stdout.emit("data", JSON.stringify({ version: 4, runtime_id: runtimeId, providers: [{ provider, status: "completed", raw_stdout_sha256: sha256(stdout), raw_stderr_sha256: sha256(stderr), output: "parsed provider output" }] })); child.emit("close", 0); }); return child;
      } });
      const privateRawDirectory = join(root, "task", "reviews", "private", "round-1", "provider-raw");
      const result = await client.run({ request: { version: 4, host_provider: "codex", prompt: "p", continuation: null }, privateRawDirectory });
      const outcome = result.providers[0];
      expect(readFileSync(outcome.raw_stdout_ref, "utf8")).toBe(stdout); expect(readFileSync(outcome.raw_stderr_ref, "utf8")).toBe(stderr);
      expect(sha256(readFileSync(outcome.raw_stdout_ref))).toBe(outcome.raw_stdout_sha256);
      expect(sha256(readFileSync(outcome.raw_stderr_ref))).toBe(outcome.raw_stderr_sha256);
      expect(outcome.output).toBe("parsed provider output"); expect(existsSync(outcome.raw_stdout_ref)).toBe(true);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it("preserves broker wire evidence and marks a raw-byte mismatch material-insufficient", async () => {
    const root = mkdtempSync(join(tmpdir(), "wh-review-raw-audit-bad-"));
    try {
      const runtimeRoot = join(root, "runtime"); const runtimeId = "22222222-2222-4222-8222-222222222222"; const runtime = join(runtimeRoot, runtimeId); mkdirSync(join(runtime, "raw", "opencode"), { recursive: true });
      writeFileSync(join(runtime, "raw", "opencode", "stdout"), "tampered"); writeFileSync(join(runtime, "raw", "opencode", "stderr"), "stderr");
      writeFileSync(join(runtime, "state.json"), JSON.stringify({ runtime_id: runtimeId, providers: { opencode: { raw_stdout_ref: "raw/opencode/stdout", raw_stdout_sha256: sha256("expected"), raw_stderr_ref: "raw/opencode/stderr", raw_stderr_sha256: sha256("stderr") } } }));
      const config = join(root, "config.json"); writeFileSync(config, JSON.stringify({ version: 4, runtime: { root: runtimeRoot } }));
      const client = new BrokerClient({ command: ["node", "/broker/scripts/3rd-review.mjs"], config, spawnImpl() { const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); queueMicrotask(() => { child.stdout.emit("data", JSON.stringify({ version: 4, runtime_id: runtimeId, providers: [{ provider: "opencode", status: "completed", raw_stdout_sha256: sha256("expected"), raw_stderr_sha256: sha256("stderr") }] })); child.emit("close", 0); }); return child; } });
      const privateRawDirectory = join(root, "task", "private");
      const result = await client.run({ request: { version: 4, host_provider: "codex", prompt: "p", continuation: null }, privateRawDirectory });
      expect(result.providers[0]).toMatchObject({ provider: "opencode", status: "completed", raw_audit_error: { code: "BROKER_RAW_AUDIT_UNAVAILABLE" } });
      expect(readFileSync(result.broker_raw_stdout_ref, "utf8")).toContain('"runtime_id"');
      expect(sha256(readFileSync(result.broker_raw_stdout_ref))).toBe(result.broker_raw_stdout_sha256);
      expect(sha256(readFileSync(result.broker_raw_stderr_ref))).toBe(result.broker_raw_stderr_sha256);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it("records a bare Kimi CANCELLED as caller cancellation, not a provider timeout", async () => {
    const root = mkdtempSync(join(tmpdir(), "wh-review-cancelled-"));
    try {
      const runtimeId = "33333333-3333-4333-8333-333333333333"; const runtimeRoot = join(root, "runtime"); const runtime = join(runtimeRoot, runtimeId); mkdirSync(runtime, { recursive: true });
      writeFileSync(join(runtime, "state.json"), JSON.stringify({ runtime_id: runtimeId, providers: {} }));
      const config = join(root, "config.json"); writeFileSync(config, JSON.stringify({ version: 4, runtime: { root: runtimeRoot } }));
      const client = new BrokerClient({ command: ["node", "/broker/scripts/3rd-review.mjs"], config, spawnImpl() { const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); queueMicrotask(() => { child.stdout.emit("data", JSON.stringify({ version: 4, runtime_id: runtimeId, providers: [{ provider: "kimi", status: "cancelled", error: { code: "CANCELLED" } }] })); child.emit("close", 0); }); return child; } });
      const result = await client.run({ request: { version: 4, host_provider: "codex", prompt: "p", continuation: null }, privateRawDirectory: join(root, "task", "private") });
      expect(result.providers[0]).toMatchObject({ provider: "kimi", status: "cancelled", error: { code: "CANCELLED", source: "workflow_shutdown" } });
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it("fails loud before passing Phase2-only attachment or cancel-source flags to the base CLI", async () => {
    const client = new BrokerClient({ command: ["node", "/broker/scripts/3rd-review.mjs"], config: "/cfg.json", spawnImpl(command, args) {
      const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
      queueMicrotask(() => { child.stdout.emit("data", '{"version":4,"capabilities":{"attachments":false,"cancel_source":false},"providers":[]}'); child.emit("close", 0); }); return child;
    } });
    await expect(client.run({ request: { version: 4, host_provider: "codex", prompt: "p", continuation: null }, attachments: { version: 1, entries: [] }, attachmentDelivery: "file_only" }))
      .rejects.toThrow(/ATTACHMENT_UNSUPPORTED/);
    await expect(client.cancel({ runtime_id: "r", provider: "kimi", source: "workflow_shutdown" })).rejects.toThrow(/CANCEL_SOURCE_UNSUPPORTED/);
  });

  it("rejects a cancel source outside the broker's documented enum before spawning", async () => {
    let calls = 0;
    const client = new BrokerClient({ command: ["node", "/broker/scripts/3rd-review.mjs"], config: "/cfg.json", spawnImpl() { calls += 1; throw new Error("must not spawn"); } });
    await expect(client.cancel({ runtime_id: "r", provider: "kimi", source: "workflowhub" })).rejects.toThrow(/cancel source.*user.*workflow_shutdown.*broker_idle_timeout.*broker_max_duration/i);
    expect(calls).toBe(0);
  });

  it("uses Phase2 attachment and cancel-source flags only when doctor declares them", async () => {
    const calls = [];
    const client = new BrokerClient({ command: ["node", "/phase2/3rd-review.mjs"], config: "/cfg.json", attachmentRoot: "/repo", spawnImpl(command, args) {
      calls.push(args); const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
      queueMicrotask(() => { child.stdout.emit("data", args.includes("doctor") ? '{"version":4,"capabilities":{"attachments":true,"cancel_source":true},"attachment_root":{"status":"ready"},"providers":[]}' : '{"version":4,"providers":[]}'); child.emit("close", 0); }); return child;
    } });
    await client.run({ request: { version: 4, host_provider: "codex", prompt: "p", continuation: null }, attachments: { version: 1, bundle_id: "b", entries: [] }, attachmentDelivery: "file_only" });
    expect(calls[1].some((arg) => arg.startsWith("--attachments="))).toBe(true);
    await client.cancel({ runtime_id: "r", provider: "kimi", source: "workflow_shutdown" });
    expect(calls[2]).toContain("--source=workflow_shutdown");
  });

  it.each(["file_only", "always_embed"])("passes the stage-resolved %s delivery policy to the broker", async (policy) => {
    const calls = [];
    const client = new BrokerClient({ command: ["node", "/phase2/3rd-review.mjs"], config: "/cfg.json", attachmentRoot: "/repo", spawnImpl(command, args) {
      calls.push(args); const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
      queueMicrotask(() => { child.stdout.emit("data", args.includes("doctor") ? '{"version":4,"capabilities":{"attachments":true,"cancel_source":true},"attachment_root":{"status":"ready"},"providers":[]}' : '{"version":4,"providers":[]}'); child.emit("close", 0); }); return child;
    } });
    await client.run({ request: { version: 4, host_provider: "codex", prompt: "p", continuation: null }, attachments: { version: 1, bundle_id: "b", entries: [] }, attachmentDelivery: policy });
    expect(calls[1]).toContain(`--attachment-delivery=${policy}`);
  });

  it("rejects an undeclared attachment interface through a real subprocess fixture", async () => {
    const root = mkdtempSync(join(tmpdir(), "wh-review-real-doctor-"));
    try {
      const config = join(root, "config.json");
      writeFileSync(config, JSON.stringify({ version: 4, runtime: { root: join(root, "runtime") }, tiers: [["opencode"]], providers: { opencode: { enabled: false, command: process.execPath, auth: { type: "native" }, env: [] } } }));
      const script = join(root, "3rd-review.mjs");
      writeFileSync(script, 'process.stdout.write(JSON.stringify({version:4,capabilities:{attachments:false,cancel_source:false},attachment_root:{status:"ready"},providers:[]}));\n');
      const client = new BrokerClient({ command: [process.execPath, script], config, attachmentRoot: root });
      await expect(client.run({ request: { version: 4, host_provider: "codex", prompt: "p", continuation: null }, attachments: { version: 1, bundle_id: "b", entries: [] }, attachmentDelivery: "file_only" })).rejects.toThrow(/ATTACHMENT_UNSUPPORTED/);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
