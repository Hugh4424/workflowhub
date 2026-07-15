import { describe, expect, it } from "vitest";
import { EventEmitter } from "node:events";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BrokerClient } from "../broker-client.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const slash = String.fromCharCode(47);
const rooted = (...parts) => `${slash}${parts.join(slash)}`;
const brokerCommand = () => ["node", rooted("broker", "scripts", "3rd-review.mjs")];
const materialProtocol = { material_protocol: { version: 5, delivery_attestation: "sealed-exact-copy.v1" } };

function exactCopyFixture({ publicSession = "session-1" } = {}) {
  const root = mkdtempSync(join(tmpdir(), "wh-review-exact-copy-"));
  const runtimeRoot = join(root, "runtime"); const runtimeId = "33333333-3333-4333-8333-333333333333";
  const runtime = join(runtimeRoot, runtimeId); const workspace = join(runtime, "workspace", "opencode");
  const bytes = Buffer.from("diff bytes\n"); const digest = sha256(bytes); const bundleId = "bundle-1"; const manifestHash = "a".repeat(64);
  const hostRecord = { source: "packet/changes.diff", destination: "changes.diff", sha256: digest, size: bytes.length, embed: false };
  const visible = [{ destination: "changes.diff", sha256: digest, size: bytes.length }];
  const delivery = { delivery_mode: "file_only", sealed_manifest_hash: manifestHash, provider_visible_manifest_hash: manifestHash, byte_identity: "verified", material_total_bytes: bytes.length, provider_visible_attachment_manifest: visible };
  mkdirSync(workspace, { recursive: true }); writeFileSync(join(workspace, "changes.diff"), bytes);
  writeFileSync(join(workspace, "attachments-manifest.json"), JSON.stringify({ version: 1, bundle_id: bundleId, manifest_hash: manifestHash, files: [{ target: "changes.diff", sha256: digest, size: bytes.length, embed: false }] }));
  const raw = join(runtime, "raw", "opencode"); mkdirSync(raw, { recursive: true }); writeFileSync(join(raw, "stdout"), "stdout\n"); writeFileSync(join(raw, "stderr"), "stderr\n");
  const privateProvider = { status: "completed", session_id: "session-1", raw_stdout_ref: "raw/opencode/stdout", raw_stdout_sha256: sha256("stdout\n"), raw_stderr_ref: "raw/opencode/stderr", raw_stderr_sha256: sha256("stderr\n"), delivery };
  const publicProvider = { provider: "opencode", status: "completed", session_id: publicSession, raw_stdout_sha256: sha256("stdout\n"), raw_stderr_sha256: sha256("stderr\n"), delivery: structuredClone(delivery) };
  writeFileSync(join(runtime, "state.json"), JSON.stringify({ runtime_id: runtimeId, providers: { opencode: privateProvider } }));
  const config = join(root, "config.json"); writeFileSync(config, JSON.stringify({ runtime: { root: runtimeRoot } }));
  const client = new BrokerClient({ command: brokerCommand(), config, attachmentRoot: root, spawnImpl(command, args) {
    const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
    queueMicrotask(() => { child.stdout.emit("data", args.includes("doctor") ? JSON.stringify({ version: 4, ...materialProtocol, capabilities: { attachments: true, cancel_source: true }, attachment_root: { status: "ready" }, providers: [] }) : JSON.stringify({ version: 4, runtime_id: runtimeId, providers: [publicProvider] })); child.emit("close", 0); }); return child;
  } });
  const request = { version: 4, host_provider: "codex", prompt: "review", continuation: null, material_manifest_sha256: manifestHash, attachment_ids: [{ destination: "changes.diff", sha256: digest }] };
  const attachments = { version: 1, bundle_id: bundleId, entries: [hostRecord] };
  return { root, runtimeId, runtime, workspace, client, request, attachments, privateProvider, publicProvider };
}

describe("BrokerClient", () => {
  it.each([
    ["missing", undefined],
    ["wrong version", { version: 4, delivery_attestation: "sealed-exact-copy.v1" }],
    ["wrong attestation", { version: 5, delivery_attestation: "redacted-derived.v1" }],
  ])("fails before provider run when doctor material protocol is %s", async (_label, protocol) => {
    const calls = [];
    const client = new BrokerClient({ command: brokerCommand(), config: rooted("cfg.json"), attachmentRoot: rooted("packets"), spawnImpl(command, args) {
      calls.push(args); const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
      queueMicrotask(() => { child.stdout.emit("data", JSON.stringify({ version: 4, ...(protocol ? { material_protocol: protocol } : {}), capabilities: { attachments: true, cancel_source: true }, attachment_root: { status: "ready" }, providers: [] })); child.emit("close", 0); }); return child;
    } });
    await expect(client.run({ request: { version: 4, host_provider: "codex", prompt: "review" }, attachments: { version: 1, bundle_id: "b", entries: [] }, attachmentDelivery: "file_only" })).rejects.toThrow(/^MATERIAL_PROTOCOL_MISMATCH:/);
    expect(calls).toHaveLength(1); expect(calls[0]).toContain("doctor"); expect(calls[0]).not.toContain("run");
  });

  it("keeps additive material protocol metadata out of the capability snapshot", async () => {
    const client = new BrokerClient({ command: brokerCommand(), config: rooted("cfg.json"), spawnImpl() {
      const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
      queueMicrotask(() => { child.stdout.emit("data", JSON.stringify({ version: 4, ...materialProtocol, capabilities: { attachments: true, cancel_source: true }, providers: [] })); child.emit("close", 0); }); return child;
    } });
    const snapshot = await client.discoverCapabilities();
    expect(snapshot).toEqual({ version: 4, capabilities: { attachments: true, cancel_source: true }, providers: [] });
    expect(snapshot).not.toHaveProperty("material_protocol");
  });

  it("audits exact-copy material and re-audits it for same-session format correction", async () => {
    const fixture = exactCopyFixture();
    try {
      const first = await fixture.client.run({ request: fixture.request, attachments: fixture.attachments, attachmentDelivery: "file_only", privateRawDirectory: join(fixture.root, "private-1") });
      expect(first.providers[0].delivery).toMatchObject({ sealed_manifest_hash: "a".repeat(64), byte_identity: "verified" });
      const correction = await fixture.client.run({ request: { ...fixture.request, prompt: "correct", continuation: { runtime_id: fixture.runtimeId, reuse_frozen_material: true }, provider_allowlist: ["opencode"] }, privateRawDirectory: join(fixture.root, "private-2") });
      expect(correction.providers[0]).toMatchObject({ status: "completed", session_id: "session-1", delivery: { byte_identity: "verified" } });
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  });

  it("rejects a run receipt with the negotiated protocol but an old incomplete delivery record", async () => {
    const fixture = exactCopyFixture();
    try {
      delete fixture.privateProvider.delivery.byte_identity; delete fixture.publicProvider.delivery.byte_identity;
      writeFileSync(join(fixture.runtime, "state.json"), JSON.stringify({ runtime_id: fixture.runtimeId, providers: { opencode: fixture.privateProvider } }));
      await expect(fixture.client.run({ request: fixture.request, attachments: fixture.attachments, attachmentDelivery: "file_only", privateRawDirectory: join(fixture.root, "private") })).rejects.toThrow(/exact-copy receipt is incomplete/i);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  });

  it("rejects a provider-visible workspace whose material bytes changed", async () => {
    const fixture = exactCopyFixture();
    try {
      writeFileSync(join(fixture.workspace, "changes.diff"), "tampered bytes\n");
      await expect(fixture.client.run({ request: fixture.request, attachments: fixture.attachments, attachmentDelivery: "file_only", privateRawDirectory: join(fixture.root, "private") })).rejects.toThrow(/exact-copy workspace is missing or ambiguous/i);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  });

  it("rejects a public delivery hash that differs from private broker state", async () => {
    const fixture = exactCopyFixture();
    try {
      fixture.publicProvider.delivery.provider_visible_manifest_hash = "b".repeat(64);
      await expect(fixture.client.run({ request: fixture.request, attachments: fixture.attachments, attachmentDelivery: "file_only", privateRawDirectory: join(fixture.root, "private") })).rejects.toThrow(/delivery differs from private broker state/i);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  });

  it("re-audits established correction binding and rejects later workspace damage", async () => {
    const fixture = exactCopyFixture();
    try {
      await fixture.client.run({ request: fixture.request, attachments: fixture.attachments, attachmentDelivery: "file_only", privateRawDirectory: join(fixture.root, "private-1") });
      writeFileSync(join(fixture.workspace, "changes.diff"), "damaged after initial audit\n");
      await expect(fixture.client.run({ request: { ...fixture.request, prompt: "correct", continuation: { runtime_id: fixture.runtimeId, reuse_frozen_material: true }, provider_allowlist: ["opencode"] }, privateRawDirectory: join(fixture.root, "private-2") })).rejects.toThrow(/exact-copy workspace is missing or ambiguous/i);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  });

  it("rejects an exact-copy receipt whose public session differs from private state", async () => {
    const fixture = exactCopyFixture({ publicSession: "forged-session" });
    try { await expect(fixture.client.run({ request: fixture.request, attachments: fixture.attachments, attachmentDelivery: "file_only", privateRawDirectory: join(fixture.root, "private") })).rejects.toThrow(/session differs from private broker state/); }
    finally { rmSync(fixture.root, { recursive: true, force: true }); }
  });

  it("rejects frozen-material correction before a successful initial material audit", async () => {
    const fixture = exactCopyFixture();
    try {
      await expect(fixture.client.run({ request: { ...fixture.request, prompt: "correct", continuation: { runtime_id: fixture.runtimeId, reuse_frozen_material: true }, provider_allowlist: ["opencode"] }, privateRawDirectory: join(fixture.root, "private") })).rejects.toThrow(/host request binding is incomplete/);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  });

  it("discovers, normalizes, freezes, and caches broker-owned capabilities from doctor stdout", async () => {
    let calls = 0;
    const client = new BrokerClient({ command: brokerCommand(), config: rooted("cfg.json"), spawnImpl() {
      calls += 1; const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
      queueMicrotask(() => { child.stdout.emit("data", JSON.stringify({ version: 4, ...materialProtocol, capabilities: { attachments: true, cancel_source: true }, verification: "executable_only", providers: [
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
    const client = new BrokerClient({ command: brokerCommand(), config: rooted("cfg.json"), attachmentRoot: rooted("approved", "packet-root"), spawnImpl(command, args) {
      calls.push({ command, args }); const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
      queueMicrotask(() => { child.stdout.emit("data", JSON.stringify({ version: 4, ...materialProtocol, capabilities: { attachments: true, cancel_source: true }, attachment_root: { status: "ready" }, providers: [] })); child.emit("close", 0); }); return child;
    } });
    await expect(client.discoverCapabilities()).resolves.toMatchObject({ capabilities: { attachments: true } });
    expect(calls[0].args).toContain(`--attachments-root=${rooted("approved", "packet-root")}`);
  });

  it("accepts additive doctor capabilities but projects only the v4 capabilities it owns", async () => {
    const client = new BrokerClient({ command: brokerCommand(), config: rooted("cfg.json"), spawnImpl() {
      const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
      queueMicrotask(() => { child.stdout.emit("data", JSON.stringify({
        version: 4,
        ...materialProtocol,
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
    const client = new BrokerClient({ command: brokerCommand(), config: rooted("cfg.json"), attachmentRoot: rooted("approved", "packet-root"), spawnImpl() {
      const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
      queueMicrotask(() => { child.stdout.emit("data", JSON.stringify({ version: 4, ...materialProtocol, capabilities: { attachments: true, cancel_source: true }, attachment_root: { status: "unavailable", error: { code: "ATTACHMENT_ROOT_FORBIDDEN" } }, providers: [] })); child.emit("close", 0); }); return child;
    } });
    await expect(client.discoverCapabilities()).rejects.toThrow(/attachment root.*ready/i);
  });

  it.each([
    [{ version: 3, capabilities: { attachments: true, cancel_source: true }, providers: [] }, /version/],
    [{ version: 4, ...materialProtocol, capabilities: { attachments: true }, providers: [] }, /capabilities/],
    [{ version: 4, ...materialProtocol, capabilities: { attachments: true, cancel_source: true }, providers: [{ provider: "kimi", status: "ready", capabilities: { continuation: true, attachment_delivery: ["file_only"] } }, { provider: "kimi", status: "ready", capabilities: { continuation: true, attachment_delivery: ["file_only"] } }] }, /duplicate/],
    [{ version: 4, ...materialProtocol, capabilities: { attachments: true, cancel_source: true }, providers: [{ provider: "kimi", status: "online", capabilities: { continuation: true, attachment_delivery: ["file_only"] } }] }, /status/],
    [{ version: 4, ...materialProtocol, capabilities: { attachments: true, cancel_source: true }, providers: [{ provider: "kimi", status: "ready", capabilities: { continuation: "yes", attachment_delivery: ["file_only"] } }] }, /continuation/],
    [{ version: 4, ...materialProtocol, capabilities: { attachments: true, cancel_source: true }, providers: [{ provider: "kimi", status: "ready", capabilities: { continuation: true, attachment_delivery: ["auto"] } }] }, /attachment_delivery/],
  ])("rejects malformed doctor capability snapshots", async (stdout, error) => {
    const client = new BrokerClient({ command: brokerCommand(), config: rooted("cfg.json"), spawnImpl() {
      const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); queueMicrotask(() => { child.stdout.emit("data", JSON.stringify(stdout)); child.emit("close", 0); }); return child;
    } });
    await expect(client.discoverCapabilities()).rejects.toThrow(error);
  });
  it("uses only the v4 run/config/request CLI boundary and leaves timeout ownership to broker", async () => {
    const calls = [];
    const client = new BrokerClient({ command: brokerCommand(), config: rooted("cfg.json"), spawnImpl(command, args) {
      calls.push({ command, args }); const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
      queueMicrotask(() => { child.stdout.emit("data", '{"version":4,"runtime_id":"r","providers":[]}'); child.emit("close", 0); }); return child;
    } });
    await expect(client.run({ request: { version: 4, host_provider: "codex", prompt: "p", continuation: null } })).resolves.toMatchObject({ version: 4 });
    expect(calls[0]).toMatchObject({ command: "node" });
    expect(calls[0].args).toContain("run"); expect(calls[0].args).toContain(`--config=${rooted("cfg.json")}`);
    expect(calls[0].args.some((arg) => arg.startsWith("--request="))).toBe(true);
    expect(calls[0].args.join(" ")).not.toMatch(/run-heterologous|--diff=|--output=|timeout/i);
  });

  it("writes provider_allowlist only in the V4 request JSON passed to the broker", async () => {
    const seen = [];
    const client = new BrokerClient({ command: brokerCommand(), config: rooted("cfg.json"), spawnImpl(command, args) {
      const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
      if (args.includes("doctor")) queueMicrotask(() => { child.stdout.emit("data", JSON.stringify({ version: 4, ...materialProtocol, capabilities: { attachments: true, cancel_source: true }, providers: [] })); child.emit("close", 0); });
      else {
        const requestPath = args.find((arg) => arg.startsWith("--request=")).slice("--request=".length);
        seen.push(JSON.parse(readFileSync(requestPath, "utf8")));
        queueMicrotask(() => { child.stdout.emit("data", '{"version":4,"runtime_id":"r","providers":[]}'); child.emit("close", 0); });
      }
      return child;
    } });
    await client.run({ request: { version: 4, host_provider: "codex", prompt: "short instruction", continuation: null, provider_allowlist: ["kimi", "opencode"], material_manifest_sha256: "a".repeat(64), attachment_ids: [{ destination: "changes.diff", sha256: "b".repeat(64) }] } });
    expect(seen).toEqual([expect.objectContaining({ provider_allowlist: ["kimi", "opencode"], prompt: "short instruction", attachment_ids: [{ destination: "changes.diff", sha256: "b".repeat(64) }] })]);
  });

  it.each(["opencode", "kimi"])("copies %s original stdout/stderr from private broker state and preserves its hashes", async (provider) => {
    const root = mkdtempSync(join(tmpdir(), "wh-review-raw-audit-"));
    try {
      const seenRequests = [];
      const runtimeRoot = join(root, "runtime"); const runtimeId = "11111111-1111-4111-8111-111111111111";
      const runtime = join(runtimeRoot, runtimeId); const rawDir = join(runtime, "raw", provider); mkdirSync(rawDir, { recursive: true });
      const stdout = `wire ${provider} stdout\\n{\"verdict\":\"pass\"}\\n`; const stderr = `${provider} stderr\\n`;
      writeFileSync(join(rawDir, "stdout"), stdout); writeFileSync(join(rawDir, "stderr"), stderr);
      writeFileSync(join(runtime, "state.json"), JSON.stringify({ runtime_id: runtimeId, providers: { [provider]: {
        raw_stdout_ref: `raw/${provider}/stdout`, raw_stdout_sha256: sha256(stdout), raw_stderr_ref: `raw/${provider}/stderr`, raw_stderr_sha256: sha256(stderr),
      } } }));
      const config = join(root, "config.json"); writeFileSync(config, JSON.stringify({ version: 4, runtime: { root: runtimeRoot } }));
      const client = new BrokerClient({ command: brokerCommand(), config, spawnImpl(command, args) {
        const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
        const requestPath = args.find((arg) => arg.startsWith("--request=")).slice("--request=".length);
        seenRequests.push(JSON.parse(readFileSync(requestPath, "utf8")));
        queueMicrotask(() => { child.stdout.emit("data", JSON.stringify({ version: 4, runtime_id: runtimeId, providers: [{ provider, status: "completed", raw_stdout_sha256: sha256(stdout), raw_stderr_sha256: sha256(stderr), output: "parsed provider output" }] })); child.emit("close", 0); }); return child;
      } });
      const privateRawDirectory = join(root, "task", "reviews", "private", "round-1", "provider-raw");
      const result = await client.run({ request: { version: 4, host_provider: "codex", prompt: "p", continuation: null, provider_allowlist: [provider] }, privateRawDirectory });
      const outcome = result.providers[0];
      expect(seenRequests).toEqual([expect.objectContaining({ provider_allowlist: [provider] })]);
      expect(readFileSync(outcome.raw_stdout_ref, "utf8")).toBe(stdout); expect(readFileSync(outcome.raw_stderr_ref, "utf8")).toBe(stderr);
      expect(sha256(readFileSync(outcome.raw_stdout_ref))).toBe(outcome.raw_stdout_sha256);
      expect(sha256(readFileSync(outcome.raw_stderr_ref))).toBe(outcome.raw_stderr_sha256);
      expect(outcome.output).toBe("parsed provider output"); expect(existsSync(outcome.raw_stdout_ref)).toBe(true);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it("binds each continuation attempt to that attempt's public hashes and current private state", async () => {
    const root = mkdtempSync(join(tmpdir(), "wh-review-raw-audit-continuation-"));
    try {
      const runtimeRoot = join(root, "runtime"); const runtimeId = "19191919-1919-4919-8919-191919191919";
      const runtime = join(runtimeRoot, runtimeId); const rawDir = join(runtime, "raw", "kimi"); mkdirSync(rawDir, { recursive: true });
      const config = join(root, "config.json"); writeFileSync(config, JSON.stringify({ version: 4, runtime: { root: runtimeRoot } }));
      const attempts = [
        { stdout: "initial stdout", stderr: "initial stderr" },
        { stdout: "corrected stdout", stderr: "corrected stderr" },
      ];
      let call = 0;
      const client = new BrokerClient({ command: brokerCommand(), config, spawnImpl() {
        const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
        const attempt = attempts[call++];
        queueMicrotask(() => {
          const suffix = `attempt-${call}`;
          writeFileSync(join(rawDir, `${suffix}.stdout`), attempt.stdout); writeFileSync(join(rawDir, `${suffix}.stderr`), attempt.stderr);
          writeFileSync(join(runtime, "state.json"), JSON.stringify({ runtime_id: runtimeId, providers: { kimi: {
            raw_stdout_ref: `raw/kimi/${suffix}.stdout`, raw_stdout_sha256: sha256(attempt.stdout),
            raw_stderr_ref: `raw/kimi/${suffix}.stderr`, raw_stderr_sha256: sha256(attempt.stderr),
          } } }));
          child.stdout.emit("data", JSON.stringify({ version: 4, runtime_id: runtimeId, providers: [{
            provider: "kimi", status: "completed", raw_stdout_sha256: sha256(attempt.stdout), raw_stderr_sha256: sha256(attempt.stderr),
          }] }));
          child.emit("close", 0);
        });
        return child;
      } });
      const initial = await client.run({ request: { version: 4, host_provider: "codex", prompt: "review", continuation: null }, privateRawDirectory: join(root, "attempt-1") });
      const correction = await client.run({ request: { version: 4, host_provider: "codex", prompt: "correct", continuation: { runtime_id: runtimeId, reuse_frozen_material: true } }, privateRawDirectory: join(root, "attempt-2") });
      expect(readFileSync(initial.providers[0].raw_stdout_ref, "utf8")).toBe("initial stdout");
      expect(readFileSync(correction.providers[0].raw_stdout_ref, "utf8")).toBe("corrected stdout");
      expect(correction.providers[0].raw_stdout_sha256).toBe(sha256("corrected stdout"));
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it("does not attach prior raw evidence to a setup failure that announces no raw streams", async () => {
    const root = mkdtempSync(join(tmpdir(), "wh-review-raw-audit-setup-failure-"));
    try {
      const runtimeRoot = join(root, "runtime"); const runtimeId = "29292929-2929-4929-8929-292929292929";
      const runtime = join(runtimeRoot, runtimeId); const rawDir = join(runtime, "raw", "kimi"); mkdirSync(rawDir, { recursive: true });
      const stdout = "prior stdout"; const stderr = "prior stderr";
      writeFileSync(join(rawDir, "prior.stdout"), stdout); writeFileSync(join(rawDir, "prior.stderr"), stderr);
      writeFileSync(join(runtime, "state.json"), JSON.stringify({ runtime_id: runtimeId, providers: { kimi: {
        status: "completed", raw_stdout_ref: "raw/kimi/prior.stdout", raw_stdout_sha256: sha256(stdout),
        raw_stderr_ref: "raw/kimi/prior.stderr", raw_stderr_sha256: sha256(stderr),
      } } }));
      const config = join(root, "config.json"); writeFileSync(config, JSON.stringify({ version: 4, runtime: { root: runtimeRoot } }));
      const client = new BrokerClient({ command: brokerCommand(), config, spawnImpl() {
        const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
        queueMicrotask(() => {
          child.stdout.emit("data", JSON.stringify({ version: 4, runtime_id: runtimeId, providers: [{
            provider: "kimi", status: "failed", error: { code: "MATERIAL_INCOMPLETE", message: "frozen material unavailable" },
          }] }));
          child.emit("close", 0);
        });
        return child;
      } });
      const result = await client.run({ request: { version: 4, host_provider: "codex", prompt: "correct", continuation: { runtime_id: runtimeId, reuse_frozen_material: true } }, privateRawDirectory: join(root, "attempt-2") });
      expect(result.providers[0]).toEqual({ provider: "kimi", status: "failed", error: { code: "MATERIAL_INCOMPLETE", message: "frozen material unavailable" } });
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it("fails closed when private broker bytes do not match the advertised raw stdout hash", async () => {
    const root = mkdtempSync(join(tmpdir(), "wh-review-raw-audit-bad-"));
    try {
      const runtimeRoot = join(root, "runtime"); const runtimeId = "22222222-2222-4222-8222-222222222222"; const runtime = join(runtimeRoot, runtimeId); mkdirSync(join(runtime, "raw", "opencode"), { recursive: true });
      writeFileSync(join(runtime, "raw", "opencode", "stdout"), "tampered"); writeFileSync(join(runtime, "raw", "opencode", "stderr"), "stderr");
      writeFileSync(join(runtime, "state.json"), JSON.stringify({ runtime_id: runtimeId, providers: { opencode: { raw_stdout_ref: "raw/opencode/stdout", raw_stdout_sha256: sha256("expected"), raw_stderr_ref: "raw/opencode/stderr", raw_stderr_sha256: sha256("stderr") } } }));
      const config = join(root, "config.json"); writeFileSync(config, JSON.stringify({ version: 4, runtime: { root: runtimeRoot } }));
      const client = new BrokerClient({ command: brokerCommand(), config, spawnImpl() { const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); queueMicrotask(() => { child.stdout.emit("data", JSON.stringify({ version: 4, runtime_id: runtimeId, providers: [{ provider: "opencode", status: "completed", raw_stdout_sha256: sha256("expected"), raw_stderr_sha256: sha256("stderr") }] })); child.emit("close", 0); }); return child; } });
      await expect(client.run({ request: { version: 4, host_provider: "codex", prompt: "p", continuation: null }, privateRawDirectory: join(root, "task", "private") })).rejects.toThrow(/BROKER_RAW_AUDIT_UNAVAILABLE.*bytes/i);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it("fails loud before passing Phase2-only attachment or cancel-source flags to the base CLI", async () => {
    const client = new BrokerClient({ command: brokerCommand(), config: rooted("cfg.json"), spawnImpl(command, args) {
      const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
      queueMicrotask(() => { child.stdout.emit("data", JSON.stringify({ version: 4, ...materialProtocol, capabilities: { attachments: false, cancel_source: false }, providers: [] })); child.emit("close", 0); }); return child;
    } });
    await expect(client.run({ request: { version: 4, host_provider: "codex", prompt: "p", continuation: null }, attachments: { version: 1, entries: [] }, attachmentDelivery: "file_only" }))
      .rejects.toThrow(/ATTACHMENT_UNSUPPORTED/);
    await expect(client.cancel({ runtime_id: "r", provider: "kimi", source: "workflow_shutdown" })).rejects.toThrow(/CANCEL_SOURCE_UNSUPPORTED/);
  });

  it("rejects a cancel source outside the broker's documented enum before spawning", async () => {
    let calls = 0;
    const client = new BrokerClient({ command: brokerCommand(), config: rooted("cfg.json"), spawnImpl() { calls += 1; throw new Error("must not spawn"); } });
    await expect(client.cancel({ runtime_id: "r", provider: "kimi", source: "workflowhub" })).rejects.toThrow(/cancel source.*user.*workflow_shutdown.*broker_idle_timeout.*broker_max_duration/i);
    expect(calls).toBe(0);
  });

  it("uses Phase2 attachment and cancel-source flags only when doctor declares them", async () => {
    const calls = [];
    const client = new BrokerClient({ command: ["node", rooted("phase2", "3rd-review.mjs")], config: rooted("cfg.json"), attachmentRoot: rooted("repo"), spawnImpl(command, args) {
      calls.push(args); const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
      queueMicrotask(() => { child.stdout.emit("data", args.includes("doctor") ? JSON.stringify({ version: 4, ...materialProtocol, capabilities: { attachments: true, cancel_source: true }, attachment_root: { status: "ready" }, providers: [] }) : '{"version":4,"providers":[]}'); child.emit("close", 0); }); return child;
    } });
    await client.run({ request: { version: 4, host_provider: "codex", prompt: "p", continuation: null }, attachments: { version: 1, bundle_id: "b", entries: [] }, attachmentDelivery: "file_only" });
    expect(calls[1].some((arg) => arg.startsWith("--attachments="))).toBe(true);
    await client.cancel({ runtime_id: "r", provider: "kimi", source: "workflow_shutdown" });
    expect(calls[2]).toContain("--source=workflow_shutdown");
  });

  it.each(["file_only", "always_embed"])("passes the stage-resolved %s delivery policy to the broker", async (policy) => {
    const calls = [];
    const client = new BrokerClient({ command: ["node", rooted("phase2", "3rd-review.mjs")], config: rooted("cfg.json"), attachmentRoot: rooted("repo"), spawnImpl(command, args) {
      calls.push(args); const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
      queueMicrotask(() => { child.stdout.emit("data", args.includes("doctor") ? JSON.stringify({ version: 4, ...materialProtocol, capabilities: { attachments: true, cancel_source: true }, attachment_root: { status: "ready" }, providers: [] }) : '{"version":4,"providers":[]}'); child.emit("close", 0); }); return child;
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
      writeFileSync(script, 'process.stdout.write(JSON.stringify({version:4,material_protocol:{version:5,delivery_attestation:"sealed-exact-copy.v1"},capabilities:{attachments:false,cancel_source:false},attachment_root:{status:"ready"},providers:[]}));\n');
      const client = new BrokerClient({ command: [process.execPath, script], config, attachmentRoot: root });
      await expect(client.run({ request: { version: 4, host_provider: "codex", prompt: "p", continuation: null }, attachments: { version: 1, bundle_id: "b", entries: [] }, attachmentDelivery: "file_only" })).rejects.toThrow(/ATTACHMENT_UNSUPPORTED/);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
