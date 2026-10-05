#!/usr/bin/env node

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const bundle = process.argv[2];
if (!bundle) process.exit(2);

let bundleRoot;
try { bundleRoot = fs.realpathSync(bundle); }
catch { process.exit(2); }

// A prompt-only review has no frozen bundle and therefore no control file.
// The server must still start and advertise an empty file set: exiting here
// makes Cursor report the allowlisted MCP server as missing, which provokes
// retries and degraded tool events that supervision cannot attribute.
const controlFile = path.join(bundleRoot, "attachments-manifest.json");
let allowed = new Map();
if (fs.existsSync(controlFile)) try {
  const control = JSON.parse(fs.readFileSync(controlFile, "utf8"));
  if (!Array.isArray(control.files) || control.files.length === 0) throw new Error();
  allowed = new Map(control.files.map((file) => {
    if (!file || typeof file.target !== "string" || !file.target || path.isAbsolute(file.target) || file.target.split(/[\\/]/).includes("..") || !/^[a-f0-9]{64}$/.test(file.sha256) || !Number.isSafeInteger(file.size) || file.size < 0) throw new Error();
    return [file.target, { sha256: file.sha256, size: file.size }];
  }));
  if (allowed.size !== control.files.length) throw new Error();
} catch { process.exit(2); }

function resolveFile(relative) {
  if (typeof relative !== "string" || !relative || path.isAbsolute(relative) || relative.startsWith("~") || relative.split(/[\\/]/).includes("..")) throw new Error("path must be relative to the frozen bundle");
  if (!allowed.has(relative)) throw new Error("path is not declared by the broker attachment manifest");
  const target = fs.realpathSync(path.join(bundleRoot, relative));
  if (target !== bundleRoot && !target.startsWith(`${bundleRoot}${path.sep}`)) throw new Error("path escapes the frozen bundle");
  if (!fs.statSync(target).isFile()) throw new Error("path is not a regular file");
  return target;
}

function readFile(relative) {
  const contents = fs.readFileSync(resolveFile(relative), "utf8");
  const expected = allowed.get(relative);
  if (Buffer.byteLength(contents) !== expected.size || createHash("sha256").update(contents).digest("hex") !== expected.sha256) throw new Error("file no longer matches the broker attachment manifest");
  return contents;
}

const DEFAULT_MAX_BYTES = 24_000;

function boundedRead(relative, options = {}) {
  const contents = readFile(relative);
  const startLine = options.start_line === undefined ? 1 : options.start_line;
  const maxLines = options.max_lines === undefined ? Number.MAX_SAFE_INTEGER : options.max_lines;
  const maxBytes = options.max_bytes === undefined ? DEFAULT_MAX_BYTES : options.max_bytes;
  if (!Number.isSafeInteger(startLine) || startLine < 1 || !Number.isSafeInteger(maxLines) || maxLines < 1 || !Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > DEFAULT_MAX_BYTES) throw new Error("invalid bounded read range");
  const lines = contents.split(/(?<=\n)/);
  const selected = lines.slice(startLine - 1, startLine - 1 + maxLines);
  let text = selected.join("");
  let bytes = Buffer.from(text, "utf8");
  let byteTruncated = false;
  if (bytes.byteLength > maxBytes) {
    byteTruncated = true;
    bytes = bytes.subarray(0, maxBytes);
    while (bytes.length > 0 && (bytes[bytes.length - 1] & 0xc0) === 0x80) bytes = bytes.subarray(0, -1);
    text = bytes.toString("utf8");
  }
  const nextLine = startLine + selected.length;
  const lineTruncated = nextLine <= lines.length;
  if (byteTruncated || lineTruncated) text += `\n[truncated; continue with start_line=${nextLine}]\n`;
  return text;
}

function searchBundle(relative, pattern, flags = "", maxMatches = 100) {
  if (typeof pattern !== "string" || pattern.length === 0 || pattern.length > 2000 || !/^[gimsuy]*$/.test(flags) || !Number.isSafeInteger(maxMatches) || maxMatches < 1 || maxMatches > 100) throw new Error("invalid bundle search arguments");
  const matcher = new RegExp(pattern, flags.replace("g", ""));
  const matches = [];
  for (const [index, line] of readFile(relative).split(/\r?\n/).entries()) {
    if (!matcher.test(line)) continue;
    matches.push(`${index + 1}:${line}`);
    if (matches.length >= maxMatches) break;
  }
  const output = matches.join("\n");
  return Buffer.byteLength(output) <= DEFAULT_MAX_BYTES
    ? output
    : `${Buffer.from(output).subarray(0, DEFAULT_MAX_BYTES).toString("utf8")}\n[truncated]`;
}

const tools = [
  {
    name: "list_bundle",
    description: "List the immutable review files available in the hash-verified bundle.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "read_bundle",
    description: "Read a bounded UTF-8 chunk from one review file. Repeat with start_line after truncation.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative path returned by list_bundle" },
        start_line: { type: "integer", minimum: 1 },
        max_lines: { type: "integer", minimum: 1, maximum: 1000 },
        max_bytes: { type: "integer", minimum: 1, maximum: DEFAULT_MAX_BYTES },
      },
      required: ["path"],
      additionalProperties: false,
    },
  },
  {
    name: "search_bundle",
    description: "Search one immutable review file with a bounded regular expression and return matching lines.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        pattern: { type: "string", minLength: 1, maxLength: 2000 },
        flags: { type: "string", pattern: "^[gimsuy]*$" },
        max_matches: { type: "integer", minimum: 1, maximum: 100 },
      },
      required: ["path", "pattern"],
      additionalProperties: false,
    },
  },
];

function result(id, value) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result: value })}\n`);
}

function error(id, message) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32602, message } })}\n`);
}

function handle(message) {
  if (!message || message.jsonrpc !== "2.0") return;
  if (message.method === "initialize") {
    result(message.id, {
      protocolVersion: message.params?.protocolVersion ?? "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "third-review-bundle", version: "1.0.0" },
    });
    return;
  }
  if (message.method === "notifications/initialized") return;
  if (message.method === "ping") { result(message.id, {}); return; }
  if (message.method === "tools/list") { result(message.id, { tools }); return; }
  if (message.method === "tools/call") {
    try {
      if (message.params?.name === "list_bundle") {
        result(message.id, { content: [{ type: "text", text: [...allowed.keys()].sort().join("\n") }] });
        return;
      }
      if (message.params?.name === "read_bundle") {
        const text = boundedRead(message.params?.arguments?.path, message.params?.arguments ?? {});
        result(message.id, { content: [{ type: "text", text }] });
        return;
      }
      if (message.params?.name === "search_bundle") {
        const args = message.params?.arguments ?? {};
        const text = searchBundle(args.path, args.pattern, args.flags ?? "", args.max_matches ?? 100);
        result(message.id, { content: [{ type: "text", text }] });
        return;
      }
      throw new Error("unknown bundle tool");
    } catch {
      result(message.id, { isError: true, content: [{ type: "text", text: "bundle request rejected" }] });
    }
    return;
  }
  if (Object.hasOwn(message, "id")) error(message.id, "method not found");
}

let buffered = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffered += chunk;
  const lines = buffered.split(/\r?\n/); buffered = lines.pop();
  for (const line of lines) {
    if (!line.trim()) continue;
    try { handle(JSON.parse(line)); } catch {}
  }
});
