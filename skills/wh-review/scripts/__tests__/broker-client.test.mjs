import { describe, expect, it } from "vitest";
import { EventEmitter } from "node:events";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BrokerClient } from "../broker-client.mjs";

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

  it("fails loud before passing Phase2-only attachment or cancel-source flags to the base CLI", async () => {
    const client = new BrokerClient({ command: ["node", "/broker/scripts/3rd-review.mjs"], config: "/cfg.json", spawnImpl(command, args) {
      const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
      queueMicrotask(() => { child.stdout.emit("data", '{"version":4,"capabilities":{}}'); child.emit("close", 0); }); return child;
    } });
    await expect(client.run({ request: { version: 4, host_provider: "codex", prompt: "p", continuation: null }, attachments: { version: 1, entries: [] }, attachmentDelivery: "file_only" }))
      .rejects.toThrow(/ATTACHMENT_UNSUPPORTED/);
    await expect(client.cancel({ runtime_id: "r", provider: "kimi", source: "workflow_shutdown" })).rejects.toThrow(/CANCEL_SOURCE_UNSUPPORTED/);
  });

  it("uses Phase2 attachment and cancel-source flags only when doctor declares them", async () => {
    const calls = [];
    const client = new BrokerClient({ command: ["node", "/phase2/3rd-review.mjs"], config: "/cfg.json", attachmentRoot: "/repo", spawnImpl(command, args) {
      calls.push(args); const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
      queueMicrotask(() => { child.stdout.emit("data", args.includes("doctor") ? '{"version":4,"capabilities":{"attachments":true,"cancel_source":true}}' : '{"version":4,"providers":[]}'); child.emit("close", 0); }); return child;
    } });
    await client.run({ request: { version: 4, host_provider: "codex", prompt: "p", continuation: null }, attachments: { version: 1, bundle_id: "b", entries: [] }, attachmentDelivery: "file_only" });
    expect(calls[1].some((arg) => arg.startsWith("--attachments="))).toBe(true);
    await client.cancel({ runtime_id: "r", provider: "kimi", source: "workflow_shutdown" });
    expect(calls[2]).toContain("--source=workflow_shutdown");
  });

  it("rejects an undeclared attachment interface through a real subprocess fixture", async () => {
    const root = mkdtempSync(join(tmpdir(), "wh-review-real-doctor-"));
    try {
      const config = join(root, "config.json");
      writeFileSync(config, JSON.stringify({ version: 4, runtime: { root: join(root, "runtime") }, tiers: [["opencode"]], providers: { opencode: { enabled: false, command: process.execPath, auth: { type: "native" }, env: [] } } }));
      const script = join(root, "3rd-review.mjs");
      writeFileSync(script, 'process.stdout.write(JSON.stringify({version:4,capabilities:{}}));\n');
      const client = new BrokerClient({ command: [process.execPath, script], config, attachmentRoot: root });
      await expect(client.run({ request: { version: 4, host_provider: "codex", prompt: "p", continuation: null }, attachments: { version: 1, bundle_id: "b", entries: [] }, attachmentDelivery: "file_only" })).rejects.toThrow(/ATTACHMENT_UNSUPPORTED/);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
