import { describe, expect, it } from "vitest";
import { EventEmitter } from "node:events";
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
    const client = new BrokerClient({ command: ["node", "/broker/scripts/3rd-review.mjs"], config: "/cfg.json", spawnImpl() { throw new Error("must not spawn"); } });
    await expect(client.run({ request: { version: 4, host_provider: "codex", prompt: "p", continuation: null }, attachments: { version: 1, entries: [] }, attachmentDelivery: "file_only" }))
      .rejects.toThrow(/ATTACHMENT_UNSUPPORTED/);
    await expect(client.cancel({ runtime_id: "r", provider: "kimi", source: "workflow_shutdown" })).rejects.toThrow(/CANCEL_SOURCE_UNSUPPORTED/);
  });

  it("uses Phase2 attachment and cancel-source flags only when capability is explicitly declared", async () => {
    const calls = [];
    const client = new BrokerClient({ command: ["node", "/phase2/3rd-review.mjs"], config: "/cfg.json", attachmentRoot: "/repo", capabilities: { attachments: true, cancel_source: true }, spawnImpl(command, args) {
      calls.push(args); const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
      queueMicrotask(() => { child.stdout.emit("data", '{"version":4,"providers":[]}'); child.emit("close", 0); }); return child;
    } });
    await client.run({ request: { version: 4, host_provider: "codex", prompt: "p", continuation: null }, attachments: { version: 1, bundle_id: "b", entries: [] }, attachmentDelivery: "file_only" });
    expect(calls[0].some((arg) => arg.startsWith("--attachments="))).toBe(true);
    await client.cancel({ runtime_id: "r", provider: "kimi", source: "workflow_shutdown" });
    expect(calls[1]).toContain("--source=workflow_shutdown");
  });
});
