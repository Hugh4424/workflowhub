import { describe, expect, it } from "vitest";
import { EventEmitter } from "node:events";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { BrokerClient } from "../broker-client.mjs";

describe("BrokerClient", () => {
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

  it("probes the real current 3rd-review CLI and rejects its undeclared attachment interface", async () => {
    const root = mkdtempSync(join(tmpdir(), "wh-review-real-doctor-"));
    try {
      const config = join(root, "config.json");
      writeFileSync(config, JSON.stringify({ version: 4, runtime: { root: join(root, "runtime") }, tiers: [["opencode"]], providers: { opencode: { enabled: false, command: process.execPath, auth: { type: "native" }, env: [] } } }));
      const script = resolve(process.cwd(), "../3rd-review/scripts/3rd-review.mjs");
      const client = new BrokerClient({ command: [process.execPath, script], config, attachmentRoot: root });
      await expect(client.run({ request: { version: 4, host_provider: "codex", prompt: "p", continuation: null }, attachments: { version: 1, bundle_id: "b", entries: [] }, attachmentDelivery: "file_only" })).rejects.toThrow(/ATTACHMENT_UNSUPPORTED/);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
