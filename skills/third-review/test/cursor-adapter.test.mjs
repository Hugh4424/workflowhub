import { fileURLToPath as migratedFilePath } from "node:url";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import cursor from "../lib/adapters/cursor.mjs";
import { canonicalDeliveryManifestHash, canonicalInnerManifestHash, canonicalMaterialManifestHash, canonicalPacketHash } from "../lib/attachments.mjs";
import { Broker } from "../lib/broker.mjs";
import { validateConfig } from "../lib/config.mjs";
import { execute } from "../lib/process.mjs";
import { nodeFixtureCommand } from "./node-fixture-command.mjs";

const fakeCursor = nodeFixtureCommand(migratedFilePath(new URL("../test/fake-cursor-cli.mjs", import.meta.url)));
const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-cursor-adapter-"));
const provider = { id: "cursor/grok", command: fakeCursor, model: "cursor-grok-4.5-high", effort: null, thinking: null, allow_host_state: true, auth: { env: [] }, env: [] };
const sha = (value) => createHash("sha256").update(value).digest("hex");

function material(delivery) {
  const root = temp(); const embed = delivery === "always_embed"; const bundle_id = `cursor-${delivery}`;
  const diff = `DIFF_FOR_${delivery}\n`;
  const materialManifestHash = canonicalMaterialManifestHash(bundle_id, [{ target: "changes.diff", sha256: sha(diff), size: Buffer.byteLength(diff), embed }]);
  const packet = { version: "review-packet.v1", manifest_hash: materialManifestHash, diff_sha256: sha(diff) };
  packet.packet_hash = canonicalPacketHash(packet);
  const files = [["review-packet.v1.json", `${JSON.stringify(packet)}\n`], ["changes.diff", diff]];
  for (const [name, contents] of files) fs.writeFileSync(path.join(root, name), contents);
  const attachments = files.map(([destination, contents]) => ({ destination, sha256: sha(contents), size: Buffer.byteLength(contents) }));
  const outer = [...attachments.map(({ destination: target, sha256, size }) => ({ target, sha256, size, embed })), { target: "manifest.json", sha256: "0".repeat(64), size: 0, embed }];
  const manifest = { version: "review-attachment-manifest.v1", delivery_mode: delivery, packet_hash: packet.packet_hash, manifest_hash: packet.manifest_hash, diff_sha256: packet.diff_sha256, attachments, delivery_manifest_hash: canonicalDeliveryManifestHash(bundle_id, outer, delivery) };
  manifest.inner_manifest_hash = canonicalInnerManifestHash(manifest);
  const manifestText = `${JSON.stringify(manifest)}\n`; fs.writeFileSync(path.join(root, "manifest.json"), manifestText);
  const all = [...files, ["manifest.json", manifestText]];
  return { root, manifest: { version: 1, bundle_id, entries: all.map(([source, contents]) => ({ source, destination: source, size: Buffer.byteLength(contents), sha256: sha(contents), embed })) } };
}

function brokerConfig(runtime, input) {
  return validateConfig({
    version: 4,
    runtime: { root: runtime, ttl_hours: 24, max_output_bytes: 100_000, max_attachment_bytes: 100_000, liveness_interval_ms: 5, orphan_timeout_ms: 100 },
    attachment_roots: [{ root: input.root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] }],
    tiers: [["cursor/grok"]],
    providers: {
      "cursor/grok": {
        enabled: true, allow_host_state: true, command: fakeCursor, model: "cursor-grok-4.5-high",
        effort: null, thinking: null, auth: { type: "native" }, env: [],
      },
    },
  });
}

test("Cursor Agent uses read-only streamed headless arguments and parses success", async () => {
  const runtime = temp(); const execution = cursor.start(provider, temp(), "review", runtime);
  assert.deepEqual(execution.clientArgv, [
    "-p", "--trust", "--workspace", execution.cwd, "--output-format", "stream-json",
    "--sandbox", "enabled", "--disable-indexing", "--disable-codebase-ref",
    "--approve-mcps",
    "--data-dir", path.join(runtime, "cursor%2Fgrok", "cursor-data"),
    "--mode", "ask",
    "--model", "cursor-grok-4.5-high",
  ]);
  assert.match(execution.input, /review$/);
  assert.equal(execution.env.HOME, path.join(runtime, "cursor%2Fgrok", "home"));
  assert.equal(execution.env.XDG_CONFIG_HOME, path.join(runtime, "cursor%2Fgrok", "xdg-config"));
  assert.equal(fs.realpathSync(path.join(execution.env.HOME, "Library", "Keychains", "login.keychain-db")), fs.realpathSync(path.join(process.env.HOME, "Library", "Keychains", "login.keychain-db")));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(execution.cwd, ".cursor", "cli.json"), "utf8")), {
    permissions: {
      allow: ["Mcp(third-review-bundle:*)", "Shell(rg)", "Shell(head)", "Shell(sed)", "Shell(wc)", "Shell(grep)", "Shell(cat)"],
      deny: [
        "Read(**)", "Write(**)", "WebFetch(*)",
      ],
    },
  });
  const mcp = JSON.parse(fs.readFileSync(path.join(execution.cwd, ".cursor", "mcp.json"), "utf8"));
  assert.equal(mcp.mcpServers["third-review-bundle"].command, process.execPath);
  assert.match(mcp.mcpServers["third-review-bundle"].args[0], /cursor-bundle-mcp\.mjs$/);
  const isolatedConfig = JSON.parse(fs.readFileSync(path.join(execution.env.XDG_CONFIG_HOME, "cursor", "cli-config.json"), "utf8"));
  assert.equal(isolatedConfig.approvalMode, "unrestricted");
  assert.deepEqual(isolatedConfig.permissions, JSON.parse(fs.readFileSync(path.join(execution.cwd, ".cursor", "cli.json"), "utf8")).permissions);
  assert.deepEqual(cursor.capabilities.attachment_delivery, ["file_only", "always_embed"]);
  assert.equal(cursor.promptViaStdin, true);
  const result = await execute(execution, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
  assert.equal(result.ok, true);
  assert.equal(cursor.parse(result.stdout).text, "CURSOR_FINAL");
  assert.equal(cursor.parse(result.stdout).session_id, "cursor-session");
});

test("Cursor Agent resumes a specific session", () => {
  const execution = cursor.resume(provider, temp(), "cursor-session", "continue", temp());
  assert.equal(execution.clientArgv[execution.clientArgv.indexOf("--resume") + 1], "cursor-session");
});

test("Cursor Agent rejects malformed, failed, duplicate, and empty terminals", () => {
  assert.equal(cursor.parse("not-json\n").ok, false);
  const init = JSON.stringify({ type: "system", subtype: "init", session_id: "s" });
  assert.equal(cursor.parse(`${init}\n${JSON.stringify({ type: "result", subtype: "error", is_error: true, session_id: "s" })}\n`).ok, false);
  assert.equal(cursor.parse(`${init}\n${JSON.stringify({ type: "result", subtype: "success", is_error: false, result: "", session_id: "s" })}\n`).ok, false);
  const result = JSON.stringify({ type: "result", subtype: "success", is_error: false, result: "x", session_id: "s" });
  assert.equal(cursor.parse(`${init}\n${result}\n${result}\n`).ok, false);
  assert.equal(cursor.parse(`${result}\n`).ok, false);
  assert.equal(cursor.parse(`${JSON.stringify({ type: "system", session_id: "s1" })}\n${JSON.stringify({ type: "result", subtype: "success", is_error: false, result: "x", session_id: "s2" })}\n`).ok, false);
  assert.equal(cursor.parse(`${init}\n${result}\n`, "", "another-session").ok, false);
});

test("Cursor bundle MCP reads only regular files below its frozen root", async () => {
  const root = temp(); const contents = "BUNDLE_ONLY\n";
  fs.writeFileSync(path.join(root, "allowed.txt"), contents);
  fs.writeFileSync(path.join(root, "host-only.txt"), "PRIVATE_CONTROL\n");
  fs.writeFileSync(path.join(root, "attachments-manifest.json"), JSON.stringify({
    version: 1, files: [{ target: "allowed.txt", sha256: sha(contents), size: Buffer.byteLength(contents), embed: false }],
  }));
  const execution = cursor.start(provider, temp(), "review", temp());
  const server = JSON.parse(fs.readFileSync(path.join(execution.cwd, ".cursor", "mcp.json"), "utf8")).mcpServers["third-review-bundle"].args[0];
  const messages = [
    { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05" } },
    { jsonrpc: "2.0", method: "notifications/initialized" },
    { jsonrpc: "2.0", id: 2, method: "tools/list" },
    { jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "list_bundle", arguments: {} } },
    { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "read_bundle", arguments: { path: "allowed.txt" } } },
    { jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "search_bundle", arguments: { path: "allowed.txt", pattern: "BUNDLE" } } },
    { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "read_bundle", arguments: { path: "../outside.txt" } } },
  ];
  const result = await execute({
    command: process.execPath, argv: [server, root], cwd: root,
    input: `${messages.map(JSON.stringify).join("\n")}\n`, env: process.env, redact: [],
  }, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
  assert.equal(result.ok, true);
  const responses = result.stdout.trim().split("\n").map(JSON.parse);
  assert.equal(responses.find((item) => item.id === 2).result.tools.length, 3);
  assert.equal(responses.find((item) => item.id === 5).result.content[0].text, "allowed.txt");
  assert.equal(responses.find((item) => item.id === 3).result.content[0].text, "BUNDLE_ONLY\n");
  assert.equal(responses.find((item) => item.id === 6).result.content[0].text, "1:BUNDLE_ONLY");
  assert.equal(responses.find((item) => item.id === 4).result.isError, true);
});

test("Cursor Agent reports terminal health", () => {
  const completed = cursor.observeLine("stdout", JSON.stringify({ type: "result", subtype: "success", is_error: false, result: "x", session_id: "s" }));
  assert.deepEqual(completed.terminal, { state: "completed", session_id: "s" });
  const failed = cursor.observeLine("stdout", JSON.stringify({ type: "result", subtype: "error", is_error: true, session_id: "s" }));
  assert.equal(failed.terminal.state, "failed");
  assert.deepEqual(cursor.observeLine("stdout", JSON.stringify({ type: "retry", subtype: "starting", session_id: "s" })), {
    liveness: true, progress: true, retry_count: 1, event: "retry", session_id: "s",
  });
  assert.equal(cursor.observeLine("stdout", JSON.stringify({ type: "system", session_id: "s" })).progress, false);
  const observer = cursor.start(provider, temp(), "review", temp()).observeLine;
  const allowedMcp = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: "mcp-1",
    tool_call: { mcpToolCall: { args: { serverIdentifier: "third-review-bundle", providerIdentifier: "third-review-bundle", toolName: "read_bundle" } } },
  }));
  assert.equal(allowedMcp.terminal, undefined);
  const allowedCompletion = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "completed", session_id: "s", call_id: "mcp-1",
    tool_call: { mcpToolCall: { args: { serverIdentifier: "third-review-bundle", providerIdentifier: "third-review-bundle", toolName: "read_bundle" } } },
  }));
  assert.equal(allowedCompletion.terminal, undefined);
  const allowedDiscovery = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: "mcp-discovery",
    tool_call: { getMcpToolsToolCall: { args: { server: "third-review-bundle" } } },
  }));
  assert.equal(allowedDiscovery.terminal, undefined);
  const orphanCompletion = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "completed", session_id: "s", call_id: "orphan",
    tool_call: { mcpToolCall: { args: { serverIdentifier: "third-review-bundle", providerIdentifier: "third-review-bundle", toolName: "read_bundle" } } },
  }));
  assert.equal(orphanCompletion.terminal.error.code, "PROVIDER_MCP_PROTOCOL_INVALID");
  const benignArgumentProbe = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "completed", session_id: "s", call_id: "cursor-probe",
    tool_call: { mcpToolCall: { result: { error: { error: "Tool execution error", readToolDefReminder: "Invalid arguments:\nserver: Required\ntoolName: Required" } } } },
  }));
  assert.equal(benignArgumentProbe.terminal, undefined);
  const benignJsonProbe = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "completed", session_id: "s", call_id: "cursor-json-probe",
    tool_call: { mcpToolCall: { result: { error: { error: "Tool execution error", readToolDefReminder: "Failed to parse arguments string as JSON object. Re-issue the call with `arguments` as a JSON object literal rather than a quoted string." } } } },
  }));
  assert.equal(benignJsonProbe.terminal, undefined);
  const nativeRead = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: "native",
    tool_call: { readToolCall: { args: { path: "/etc/hosts" } } },
  }));
  assert.equal(nativeRead.terminal.state, "failed");
  assert.equal(nativeRead.terminal.error.code, "PROVIDER_PERMISSION_DENIED");
  const interaction = observer("stdout", JSON.stringify({ type: "interaction_query", subtype: "request", session_id: "s" }));
  assert.equal(interaction.terminal.error.code, "PROVIDER_PERMISSION_DENIED");
});

test("Cursor bundle MCP bounds large reads and exposes resumable line chunks", async () => {
  const cwd = temp();
  const root = path.join(cwd, "bundle");
  fs.mkdirSync(root, { recursive: true });
  const contents = Array.from({ length: 2000 }, (_, index) => `line-${index + 1}\n`).join("");
  fs.writeFileSync(path.join(root, "large.txt"), contents);
  fs.writeFileSync(path.join(root, "attachments-manifest.json"), JSON.stringify({
    version: 1, files: [{ target: "large.txt", sha256: sha(contents), size: Buffer.byteLength(contents), embed: false }],
  }));
  const execution = cursor.start(provider, cwd, "review", temp());
  const server = JSON.parse(fs.readFileSync(path.join(execution.cwd, ".cursor", "mcp.json"), "utf8")).mcpServers["third-review-bundle"];
  const result = await execute({
    command: server.command, argv: server.args, cwd: server.args[1], input: `${JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "read_bundle", arguments: { path: "large.txt", start_line: 101, max_bytes: 100 } },
    })}\n`, env: process.env, redact: [],
  }, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
  assert.equal(result.ok, true);
  const text = JSON.parse(result.stdout).result.content[0].text;
  assert.match(text, /^line-101/);
  assert.match(text, /truncated; continue with start_line=/);
  assert.ok(Buffer.byteLength(text) < 300);
});

test("Cursor bundle MCP serves an empty prompt-only bundle instead of exiting", async () => {
  const runtime = temp();
  const execution = cursor.start(provider, temp(), "review", runtime);
  const server = JSON.parse(fs.readFileSync(path.join(execution.cwd, ".cursor", "mcp.json"), "utf8")).mcpServers["third-review-bundle"];
  // A prompt-only run points the server at an empty bundle with no control
  // file. It must still start, or Cursor reports the allowlisted server as
  // missing and the agent's discovery attempt fails the whole review.
  assert.equal(fs.existsSync(path.join(server.args[1], "attachments-manifest.json")), false);
  const messages = [
    { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05" } },
    { jsonrpc: "2.0", id: 2, method: "tools/list" },
    { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "list_bundle", arguments: {} } },
    { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "read_bundle", arguments: { path: "anything.txt" } } },
  ];
  const result = await execute({
    command: server.command, argv: server.args, cwd: server.args[1],
    input: `${messages.map(JSON.stringify).join("\n")}\n`, env: process.env, redact: [],
  }, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
  assert.equal(result.ok, true);
  const responses = result.stdout.trim().split("\n").map(JSON.parse);
  assert.equal(responses.find((item) => item.id === 1).result.serverInfo.name, "third-review-bundle");
  assert.equal(responses.find((item) => item.id === 2).result.tools.length, 3);
  assert.equal(responses.find((item) => item.id === 3).result.content[0].text, "");
  // An empty manifest still declares nothing readable.
  assert.equal(responses.find((item) => item.id === 4).result.isError, true);
});

test("Cursor bundle MCP still refuses a malformed attachment control file", async () => {
  const root = temp();
  fs.writeFileSync(path.join(root, "attachments-manifest.json"), JSON.stringify({ version: 1, files: [{ target: "../escape.txt", sha256: "0".repeat(64), size: 1 }] }));
  const result = await execute({
    command: process.execPath, argv: [migratedFilePath(new URL("../lib/adapters/cursor-bundle-mcp.mjs", import.meta.url)), root], cwd: root,
    input: `${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" })}\n`, env: process.env, redact: [],
  }, { maxOutputBytes: 100_000, healthCheckIntervalMs: 10_000 });
  assert.equal(result.ok, false);
  assert.equal(result.stdout.trim(), "");
});

test("Cursor Agent admits a scoped tool call whose completion event drops its arguments", () => {
  const observer = cursor.start(provider, temp(), "review", temp()).observeLine;
  // Observed from real cursor-agent output: the completion event for an
  // allowlisted discovery call reports args {toolCallId:"unknown-tool-call-id"}
  // and an error, with no server field. The started event is the admission
  // gate, so the completion must not be re-judged as an escape.
  const callId = "call-6609431f-0\nfc_93db8abe_0";
  const started = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: callId,
    tool_call: { getMcpToolsToolCall: { args: { server: "third-review-bundle", toolCallId: callId } } },
  }));
  assert.equal(started.terminal, undefined);
  const completed = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "completed", session_id: "s", call_id: callId,
    tool_call: { getMcpToolsToolCall: { args: { toolCallId: "unknown-tool-call-id" }, result: { error: { error: 'MCP server "third-review-bundle" not found.' } } } },
  }));
  assert.equal(completed.terminal, undefined);
  // The admission is single-use: a replayed completion is still a denial.
  const replayed = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "completed", session_id: "s", call_id: callId,
    tool_call: { getMcpToolsToolCall: { args: { toolCallId: "unknown-tool-call-id" } } },
  }));
  assert.equal(replayed.terminal.error.code, "PROVIDER_MCP_PROTOCOL_INVALID");
});

test("Cursor Agent admits Cursor's isolated MCP spill-file readback only", () => {
  const runtime = temp();
  const execution = cursor.start(provider, temp(), "review", runtime);
  const spill = path.join(execution.env.CURSOR_DATA_DIR, "projects", "review", "agent-tools", "mcp-output.txt");
  fs.mkdirSync(path.dirname(spill), { recursive: true });
  fs.writeFileSync(spill, "large MCP result\n");
  const observer = execution.observeLine;
  const callId = "mcp-spill-1";
  assert.equal(observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: callId,
    tool_call: { mcpToolCall: { args: { serverIdentifier: "third-review-bundle", providerIdentifier: "third-review-bundle", toolName: "read_bundle" } } },
  })).terminal, undefined);
  assert.equal(observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "completed", session_id: "s", call_id: callId,
    tool_call: { mcpToolCall: { result: { success: { content: [{ text: { outputLocation: { filePath: spill } } }] } } } },
  })).terminal, undefined);
  const readId = "native-spill-read-1";
  assert.equal(observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: readId,
    tool_call: { readToolCall: { args: { path: spill, limit: 250 } } },
  })).terminal, undefined);
  assert.equal(observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "completed", session_id: "s", call_id: readId,
    tool_call: { readToolCall: { args: { path: spill } } },
  })).terminal, undefined);

  const outside = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: "native-outside",
    tool_call: { readToolCall: { args: { path: "/etc/hosts" } } },
  }));
  assert.equal(outside.terminal.error.code, "PROVIDER_PERMISSION_DENIED");
  const sibling = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: "native-sibling",
    tool_call: { readToolCall: { args: { path: `${spill}.other` } } },
  }));
  assert.equal(sibling.terminal.error.code, "PROVIDER_PERMISSION_DENIED");
});

test("Cursor Agent admits isolated spill-file readback from a large list_bundle result", () => {
  const runtime = temp();
  const execution = cursor.start(provider, temp(), "review", runtime);
  const spill = path.join(execution.env.CURSOR_DATA_DIR, "projects", "review", "agent-tools", "list-output.txt");
  fs.mkdirSync(path.dirname(spill), { recursive: true });
  fs.writeFileSync(spill, "large bundle listing\n");
  const observer = execution.observeLine;
  const callId = "mcp-list-spill-1";
  observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: callId,
    tool_call: { mcpToolCall: { args: { serverIdentifier: "third-review-bundle", providerIdentifier: "third-review-bundle", toolName: "list_bundle" } } },
  }));
  observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "completed", session_id: "s", call_id: callId,
    tool_call: { mcpToolCall: { result: { success: { content: [{ text: { outputLocation: { filePath: spill } } }] } } } },
  }));
  const readback = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: "native-list-spill-read-1",
    tool_call: { readToolCall: { args: { path: spill, limit: 250 } } },
  }));
  assert.equal(readback.terminal, undefined);
});

test("Cursor Agent admits a read-only shell inspection of an admitted spill file", () => {
  const runtime = temp();
  const execution = cursor.start(provider, temp(), "review", runtime);
  const spill = path.join(execution.env.CURSOR_DATA_DIR, "projects", "review", "agent-tools", "shell-output.txt");
  fs.mkdirSync(path.dirname(spill), { recursive: true });
  fs.writeFileSync(spill, "large bundle listing\n");
  const observer = execution.observeLine;
  const mcpId = "mcp-shell-spill";
  observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: mcpId,
    tool_call: { mcpToolCall: { args: { serverIdentifier: "third-review-bundle", providerIdentifier: "third-review-bundle", toolName: "list_bundle" } } },
  }));
  observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "completed", session_id: "s", call_id: mcpId,
    tool_call: { mcpToolCall: { result: { success: { content: [{ text: { outputLocation: { filePath: spill } } }] } } } },
  }));
  const shell = {
    command: `head -n 5 "${spill}"`,
    simpleCommands: ["head"],
    hasInputRedirect: false,
    hasOutputRedirect: false,
    parsingResult: {
      parsingFailed: false,
      hasRedirects: false,
      hasCommandSubstitution: false,
      executableCommands: [{ name: "head", args: [{ type: "string", value: `"${spill}"` }] }],
    },
  };
  const allowed = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: "shell-spill-1",
    tool_call: { shellToolCall: { args: shell } },
  }));
  assert.equal(allowed.terminal, undefined);
  const changed = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: "shell-spill-2",
    tool_call: { shellToolCall: { args: shell } },
  }));
  assert.equal(changed.terminal, undefined);
  const changedCompletion = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "completed", session_id: "s", call_id: "shell-spill-2",
    tool_call: { shellToolCall: { args: { ...shell, command: "head -n 5 /etc/hosts" } } },
  }));
  assert.equal(changedCompletion.terminal.error.code, "PROVIDER_PERMISSION_DENIED");
  const outside = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: "shell-outside-1",
    tool_call: { shellToolCall: { args: { ...shell, command: "cat /etc/hosts" } } },
  }));
  assert.equal(outside.terminal.error.code, "PROVIDER_PERMISSION_DENIED");
});

test("Cursor Agent admits grepToolCall and rg patterns containing slash text without false denial", () => {
  const runtime = temp();
  const execution = cursor.start(provider, temp(), "review", runtime);
  const spill = path.join(execution.env.CURSOR_DATA_DIR, "projects", "review", "agent-tools", "grep-output.txt");
  fs.mkdirSync(path.dirname(spill), { recursive: true });
  fs.writeFileSync(spill, "accepted.json results/ non.?empty AC\n");
  const observer = execution.observeLine;
  const admit = (callId) => {
    observer("stdout", JSON.stringify({
      type: "tool_call", subtype: "started", session_id: "s", call_id: callId,
      tool_call: { mcpToolCall: { args: { serverIdentifier: "third-review-bundle", providerIdentifier: "third-review-bundle", toolName: "read_bundle" } } },
    }));
    observer("stdout", JSON.stringify({
      type: "tool_call", subtype: "completed", session_id: "s", call_id: callId,
      tool_call: { mcpToolCall: { result: { success: { content: [{ text: { outputLocation: { filePath: spill } } }] } } } },
    }));
  };
  admit("mcp-grep-spill");
  const grep = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: "grep-spill",
    tool_call: { grepToolCall: { args: { path: spill, pattern: "results/|non.?empty|AC" } } },
  }));
  assert.equal(grep.terminal, undefined);
  assert.equal(observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "completed", session_id: "s", call_id: "grep-spill",
    tool_call: { grepToolCall: { args: { path: spill } } },
  })).terminal, undefined);

  const rg = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: "rg-spill",
    tool_call: { shellToolCall: { args: {
      command: `rg -n "accepted\\.json|results/|non.?empty|AC " "${spill}"`,
      simpleCommands: ["rg"], hasInputRedirect: false, hasOutputRedirect: false,
      parsingResult: {
        parsingFailed: false, hasRedirects: false, hasCommandSubstitution: false,
        executableCommands: [{ name: "rg", args: [
          { type: "word", value: "-n" },
          { type: "string", value: '"accepted\\.json|results/|non.?empty|AC "' },
          { type: "string", value: `"${spill}"` },
        ] }],
      },
    } } },
  }));
  assert.equal(rg.terminal, undefined);
});

test("Cursor Agent reports spill identity changes separately from permissions", () => {
  const runtime = temp();
  const execution = cursor.start(provider, temp(), "review", runtime);
  const spill = path.join(execution.env.CURSOR_DATA_DIR, "projects", "review", "agent-tools", "identity.txt");
  fs.mkdirSync(path.dirname(spill), { recursive: true });
  fs.writeFileSync(spill, "original\n");
  const observer = execution.observeLine;
  observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: "mcp-identity",
    tool_call: { mcpToolCall: { args: { serverIdentifier: "third-review-bundle", providerIdentifier: "third-review-bundle", toolName: "read_bundle" } } },
  }));
  observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "completed", session_id: "s", call_id: "mcp-identity",
    tool_call: { mcpToolCall: { result: { success: { content: [{ text: { outputLocation: { filePath: spill } } }] } } } },
  }));
  observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: "read-identity",
    tool_call: { readToolCall: { args: { path: spill } } },
  }));
  fs.writeFileSync(spill, "replaced-content\n");
  const changed = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "completed", session_id: "s", call_id: "read-identity",
    tool_call: { readToolCall: { args: { path: spill } } },
  }));
  assert.equal(changed.terminal.error.code, "PROVIDER_SPILL_IDENTITY_CHANGED");
});

test("Cursor Agent rejects a spill path that resolves through a symlink", () => {
  const runtime = temp();
  const execution = cursor.start(provider, temp(), "review", runtime);
  const spill = path.join(execution.env.CURSOR_DATA_DIR, "projects", "review", "agent-tools", "escape.txt");
  fs.mkdirSync(path.dirname(spill), { recursive: true });
  fs.symlinkSync("/etc/hosts", spill);
  const observer = execution.observeLine;
  const callId = "mcp-spill-symlink";
  observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: callId,
    tool_call: { mcpToolCall: { args: { serverIdentifier: "third-review-bundle", providerIdentifier: "third-review-bundle", toolName: "read_bundle" } } },
  }));
  observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "completed", session_id: "s", call_id: callId,
    tool_call: { mcpToolCall: { result: { success: { content: [{ text: { outputLocation: { filePath: spill } } }] } } } },
  }));
  const denied = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: "native-symlink",
    tool_call: { readToolCall: { args: { path: spill } } },
  }));
  assert.equal(denied.terminal.error.code, "PROVIDER_PERMISSION_DENIED");
});

test("Cursor Agent normalizes equivalent cursor-data path spellings", () => {
  const realRuntime = temp();
  const aliasRoot = temp();
  const aliasedRuntime = path.join(aliasRoot, "runtime-alias");
  fs.symlinkSync(realRuntime, aliasedRuntime);
  const execution = cursor.start(provider, temp(), "review", aliasedRuntime);
  const lexicalSpill = path.join(execution.env.CURSOR_DATA_DIR, "projects", "review", "agent-tools", "mcp-output.txt");
  const canonicalSpill = path.join(fs.realpathSync(execution.env.CURSOR_DATA_DIR), "projects", "review", "agent-tools", "mcp-output.txt");
  fs.mkdirSync(path.dirname(lexicalSpill), { recursive: true });
  fs.writeFileSync(lexicalSpill, "large MCP result\n");
  const observer = execution.observeLine;
  const mcpId = "mcp-spill-alias";
  observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: mcpId,
    tool_call: { mcpToolCall: { args: { serverIdentifier: "third-review-bundle", providerIdentifier: "third-review-bundle", toolName: "read_bundle" } } },
  }));
  observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "completed", session_id: "s", call_id: mcpId,
    tool_call: { mcpToolCall: { result: { success: { content: [{ text: { outputLocation: { filePath: canonicalSpill } } }] } } } },
  }));
  const readback = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: "native-spill-alias",
    tool_call: { readToolCall: { args: { path: lexicalSpill, limit: 250 } } },
  }));
  assert.equal(readback.terminal, undefined);
});

test("Cursor Agent still denies an out-of-scope call whose start event is unscoped", () => {
  const observer = cursor.start(provider, temp(), "review", temp()).observeLine;
  // A native read must never be admitted, so its completion can never be
  // laundered by the relaxed completion rule.
  const started = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: "native-1",
    tool_call: { readToolCall: { args: { path: "/etc/hosts" } } },
  }));
  assert.equal(started.terminal.error.code, "PROVIDER_PERMISSION_DENIED");
  const completed = observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "completed", session_id: "s", call_id: "native-1",
    tool_call: { readToolCall: { args: { path: "/etc/hosts" } } },
  }));
  assert.equal(completed.terminal.error.code, "PROVIDER_MCP_PROTOCOL_INVALID");
  // Another server's MCP call is likewise never admitted.
  assert.equal(observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: "other-1",
    tool_call: { mcpToolCall: { args: { serverIdentifier: "other", providerIdentifier: "other", toolName: "read_bundle" } } },
  })).terminal.error.code, "PROVIDER_PERMISSION_DENIED");
  // A scoped server with an undeclared tool stays denied.
  assert.equal(observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s", call_id: "escalate-1",
    tool_call: { mcpToolCall: { args: { serverIdentifier: "third-review-bundle", providerIdentifier: "third-review-bundle", toolName: "write_bundle" } } },
  })).terminal.error.code, "PROVIDER_PERMISSION_DENIED");
  // A missing call_id is a protocol error, not a path-permission error.
  assert.equal(observer("stdout", JSON.stringify({
    type: "tool_call", subtype: "started", session_id: "s",
    tool_call: { getMcpToolsToolCall: { args: { server: "third-review-bundle" } } },
  })).terminal.error.code, "PROVIDER_MCP_PROTOCOL_INVALID");
});

test("Cursor Agent tells a prompt-only review to call no tools", () => {
  assert.match(cursor.modelInstruction, /no attached material/);
  assert.match(cursor.modelInstruction, /call no tools at all/);
});

test("Cursor Agent injects a no-tools constraint into a prompt-only request", () => {
  const cwd = temp();
  const prompt = "Assess the regression at lib/broker.mjs:746 and lib/adapters/cursor.mjs:55.";
  const execution = cursor.start(provider, cwd, prompt, temp());
  // The caller must not have to remember the constraint: the adapter states it.
  assert.match(execution.input, /^TEXT-ONLY REVIEW\./);
  assert.match(execution.input, /Do not call any tool/);
  assert.match(execution.input, /literal quoted text/);
  assert.ok(execution.input.endsWith(prompt), "the caller prompt is preserved verbatim after the constraint");
  // `ask` is the CLI's read-only mode; there is no native no-tools switch.
  assert.equal(execution.clientArgv[execution.clientArgv.indexOf("--mode") + 1], "ask");
  // The run declares itself retryable so a denial is not terminal.
  assert.equal(execution.promptOnlyRetry, true);

  // A file_only run keeps its unchanged prompt, tool surface, and guardrails,
  // and must never advertise the prompt-only retry.
  const bundled = temp();
  fs.mkdirSync(path.join(bundled, "bundle"), { recursive: true });
  const withBundle = cursor.start(provider, bundled, prompt, temp());
  assert.equal(withBundle.input, prompt);
  assert.equal(withBundle.clientArgv.includes("--mode"), false);
  assert.equal(withBundle.promptOnlyRetry, undefined);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(bundled, ".cursor", "cli.json"), "utf8")).permissions.deny, [
    "Read(**)", "Write(**)", "WebFetch(*)",
  ]);
});

test("Cursor Agent escalates the constraint on a denied prompt-only retry", () => {
  const cwd = temp();
  const prompt = "Assess the regression at lib/broker.mjs:746.";
  const retry = cursor.retryPromptOnly(provider, cwd, prompt, temp());
  assert.match(retry.input, /^STOP\./);
  assert.match(retry.input, /terminated because you tried to call a tool/);
  assert.match(retry.input, /zero tool calls/);
  assert.ok(retry.input.endsWith(prompt));
  assert.equal(retry.clientArgv[retry.clientArgv.indexOf("--mode") + 1], "ask");
  // The retry starts a fresh turn: the denied session was killed mid tool call.
  assert.equal(retry.clientArgv.includes("--resume"), false);
  assert.equal(retry.expectedSession, null);
  // The escalation is single-shot; it cannot request another retry.
  assert.equal(retry.promptOnlyRetry, undefined);
});

test("Broker retries a denied prompt-only Cursor review once with a hardened prompt", async () => {
  const runtime = temp();
  const config = validateConfig({
    version: 4,
    runtime: { root: runtime, ttl_hours: 24, max_output_bytes: 100_000, max_attachment_bytes: 100_000, liveness_interval_ms: 5, orphan_timeout_ms: 100 },
    tiers: [["cursor/grok"]],
    providers: {
      "cursor/grok": {
        enabled: true, allow_host_state: true, command: fakeCursor, model: "cursor-grok-4.5-high",
        effort: null, thinking: null, auth: { type: "native" }, env: [],
      },
    },
  });
  // The fixture attempts a native read on the first turn (denied by
  // supervision) and complies only once the escalated constraint arrives.
  const result = await new Broker(config).run({
    version: 4, host_provider: "claude-code", provider_allowlist: ["cursor/grok"],
    prompt: "DENY_ONCE review lib/broker.mjs:746", continuation: null,
  });
  assert.equal(result.outcome, "completed");
  assert.equal(result.providers[0].status, "completed");
  assert.equal(result.providers[0].output, "CURSOR_AFTER_ESCALATION");
  // The extra turn is recorded, not hidden.
  assert.equal(result.providers[0].retry_count, 1);
});

test("Broker does not retry a denied file_only Cursor review", async () => {
  const input = material("file_only"); const runtime = temp();
  const config = brokerConfig(runtime, input);
  // DENY_ALWAYS makes the fixture attempt a native read on every turn. A
  // bundled run carries no prompt-only retry, so the denial stays terminal.
  const result = await new Broker(config).run({
    version: 4, host_provider: "codex", provider_allowlist: ["cursor/grok"],
    prompt: "DENY_ALWAYS review", continuation: null,
    attachments: { root: input.root, delivery: "file_only", manifest: input.manifest },
  });
  assert.equal(result.providers[0].status, "failed");
  assert.equal(result.providers[0].error.code, "PROVIDER_PERMISSION_DENIED");
});

for (const delivery of ["file_only", "always_embed"]) {
  test(`Cursor Agent completes Broker ${delivery} attachment delivery`, async () => {
    const input = material(delivery); const runtime = temp();
    const result = await new Broker(brokerConfig(runtime, input)).run({
      version: 4, host_provider: "codex", provider_allowlist: ["cursor/grok"],
      prompt: "review", continuation: null, attachments: { root: input.root, delivery, manifest: input.manifest },
    });
    assert.equal(result.outcome, "completed");
    assert.equal(result.providers[0].status, "completed");
    assert.equal(result.providers[0].delivery_used, delivery);
    assert.equal(result.providers[0].delivery.byte_identity, "verified");
    assert.equal(result.providers[0].output, delivery === "file_only"
      ? "FILE_ONLY:DIFF_FOR_file_only"
      : "ALWAYS_EMBED:DIFF_FOR_always_embed");
  });
}

test("Cursor Agent rejects unsupported generic effort and thinking-off", () => {
  assert.throws(() => cursor.start({ ...provider, effort: "high" }, temp(), "review", temp()), { code: "PROVIDER_OPTION_UNSUPPORTED" });
  assert.throws(() => cursor.start({ ...provider, thinking: false }, temp(), "review", temp()), { code: "PROVIDER_OPTION_UNSUPPORTED" });
  assert.throws(() => cursor.start({ ...provider, allow_host_state: false }, temp(), "review", temp()), { code: "PROVIDER_HOST_STATE_UNACKNOWLEDGED" });
  assert.throws(() => cursor.start(provider, temp(), "review"), { code: "RUNTIME_UNAVAILABLE" });
});

test("Cursor Agent env authentication does not require the host keychain bridge", () => {
  const runtime = temp();
  const execution = cursor.start({ ...provider, auth: { type: "env", env: [] } }, temp(), "review", runtime);
  assert.equal(fs.existsSync(path.join(execution.env.HOME, "Library", "Keychains", "login.keychain-db")), false);
});
