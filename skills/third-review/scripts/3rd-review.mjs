#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { Broker } from "../lib/broker.mjs";
import { loadConfig } from "../lib/config.mjs";
import { publicError, ReviewError } from "../lib/errors.mjs";

function value(name) { const prefix = `--${name}=`; return process.argv.slice(3).find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? null; }
function required(name) { const result = value(name); if (!result) throw new ReviewError("REQUEST_INVALID", `--${name} is required`); return result; }
function json(file) { try { return JSON.parse(fs.readFileSync(path.resolve(file), "utf8")); } catch (error) { throw new ReviewError("REQUEST_INVALID", `cannot read ${file}: ${error.message}`); } }
function usage() { return "Usage: 3rd-review <doctor|run|start|status|cancel> --config=<config.json> [--request=<request.json>]\n  doctor: verify CLI executables without a model call; optional --attachments-root verifies the configured root\n  run: optional first-round --attachments=<manifest.json> --attachments-root=<absolute-dir> --attachment-delivery=<file_only|always_embed|negotiated>\n  start: managed workflowhub-result.v2 group; requires --request-id=<opaque-id>\n  status: --runtime-id=<uuid>\n  cancel: managed --runtime-id=<uuid>, or legacy --runtime-id=<uuid> --provider=<id> [--source=<source>]"; }
function validateArgs(command) {
  const allowed = { doctor: new Set(["config", "attachments-root"]), run: new Set(["config", "request", "attachments", "attachments-root", "attachment-delivery"]), start: new Set(["config", "request", "request-id", "attachments", "attachments-root", "attachment-delivery"]), status: new Set(["config", "runtime-id"]), cancel: new Set(["config", "runtime-id", "provider", "source"]) }[command];
  if (!allowed) throw new ReviewError("REQUEST_INVALID", `unknown command: ${command}`);
  for (const arg of process.argv.slice(3)) {
    const match = arg.match(/^--([a-z-]+)=.+$/);
    if (!match || !allowed.has(match[1])) throw new ReviewError("REQUEST_INVALID", `unsupported argument for ${command}: ${arg}`);
  }
}
function runRequest() {
  const result = json(required("request")); const manifest = value("attachments"); const root = value("attachments-root"); const delivery = value("attachment-delivery");
  if (manifest || root || delivery) {
    if (!manifest || !root || !delivery) throw new ReviewError("REQUEST_INVALID", "--attachments, --attachments-root, and --attachment-delivery are required together");
    result.attachments = { manifest: json(manifest), root: path.resolve(root), delivery };
  }
  return result;
}

let activeBroker = null;
let shutdownSignal = null;
let forcedExit = null;
function shutdown(signal) {
  if (shutdownSignal) return;
  shutdownSignal = signal;
  activeBroker?.shutdown();
  forcedExit = setTimeout(() => process.exit(128 + (signal === "SIGINT" ? 2 : 15)), 6_000);
  forcedExit.unref();
}
process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

async function main() {
  const command = process.argv[2]; if (!command || command === "help" || command === "--help") { console.log(usage()); return; }
  validateArgs(command);
  const broker = new Broker(loadConfig(value("config") ?? undefined)); activeBroker = broker;
  if (command === "doctor") console.log(JSON.stringify(await broker.doctor({ attachmentRoot: value("attachments-root") ? path.resolve(value("attachments-root")) : null }), null, 2));
  else if (command === "run") {
    const result = await broker.run(runRequest());
    console.log(JSON.stringify(result, null, 2));
    // v3 callers consume partial/unavailable groups as structured public
    // facts. Keep the legacy exit-code contract for v1/v2 callers only.
    if (result.outcome !== "completed" && result.version !== "workflowhub-result.v3") process.exitCode = 3;
  }
  else if (command === "start") console.log(JSON.stringify(broker.startManaged(runRequest(), required("request-id")), null, 2));
  else if (command === "status") {
    const runtimeId = required("runtime-id");
    try { console.log(JSON.stringify(broker.managedStatus(runtimeId), null, 2)); }
    catch (error) { if (error?.code !== "RUNTIME_NOT_MANAGED") throw error; console.log(JSON.stringify(broker.status(runtimeId), null, 2)); }
  }
  else if (command === "cancel") {
    const runtimeId = required("runtime-id"); const provider = value("provider");
    console.log(JSON.stringify(provider ? broker.cancel(runtimeId, provider, value("source") ?? "user") : broker.cancelManaged(runtimeId), null, 2));
  }
}
main().catch((error) => { console.error(JSON.stringify({ error: publicError(error) })); process.exitCode = 2; }).finally(() => {
  if (forcedExit) clearTimeout(forcedExit);
  if (shutdownSignal) process.exitCode = 128 + (shutdownSignal === "SIGINT" ? 2 : 15);
});
