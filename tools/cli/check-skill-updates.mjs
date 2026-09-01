#!/usr/bin/env node
import { createHash } from "node:crypto";
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

function fail(code, summary) { const error = new Error(summary); error.code = code; return error; }
function parse(argv) { const out = {}; for (const arg of argv) { const i = arg.indexOf("="); if (!arg.startsWith("--") || i < 3) throw fail("invalid_input", `invalid argument: ${arg}`); out[arg.slice(2, i)] = arg.slice(i + 1); } return out; }
function required(value, name) { if (typeof value !== "string" || value.trim() === "") throw fail("invalid_input", `${name} is required`); return value; }
function hash(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function plain(value) { if (value === null || typeof value !== "object") return value; if (Array.isArray(value)) return value.map(plain); return Object.fromEntries(Object.keys(value).sort().map((key) => [key, plain(value[key])])); }
function canonical(value) { const walk = (node) => node && typeof node === "object" ? (Array.isArray(node) ? `[${node.map(walk).join(",")}]` : `{${Object.entries(node).map(([key, child]) => `${JSON.stringify(key)}:${walk(child)}`).join(",")}}`) : JSON.stringify(node); return walk(plain(value)); }
function readJson(path, name) { try { return JSON.parse(readFileSync(resolve(path), "utf8")); } catch (error) { throw fail("unavailable", `${name} is unreadable: ${error.message}`); } }
function identity(value, name) {
  const skillId = required(value.skill_id ?? value.name, `${name}.skill_id`); const version = required(value.version ?? value.local_version, `${name}.version`); const contentSha256 = required(value.content_sha256 ?? value.local_bundle_hash, `${name}.content_sha256`);
  if (!/^[a-f0-9]{64}$/.test(contentSha256)) throw fail("invalid_input", `${name}.content_sha256 is invalid`);
  const authority = value.authority ?? value.catalog_ref ?? value.bundle_ref ?? value.upstream ?? null;
  return { skill_id: skillId, version, content_sha256: contentSha256, authority: plain(authority) };
}
function writeReceipt(root, receipt) {
  const receiptId = `skill-update-check.v1:${hash(canonical(receipt))}`; const value = { ...receipt, receipt_id: receiptId }; const raw = `${canonical(value)}\n`; mkdirSync(root, { recursive: true });
  const path = join(root, `${receiptId.slice(receiptId.indexOf(":") + 1)}.json`); if (existsSync(path)) { if (readFileSync(path, "utf8") !== raw) throw fail("identity_conflict", "receipt identity collides with different bytes"); return { path, value }; }
  const tmp = `${path}.tmp-${process.pid}`; const fd = openSync(tmp, "wx"); try { writeFileSync(fd, raw); fsyncSync(fd); } finally { closeSync(fd); }
  renameSync(tmp, path); const parent = openSync(dirname(path), "r"); try { fsyncSync(parent); } finally { closeSync(parent); } return { path, value };
}

async function main() {
  const options = parse(process.argv.slice(2));
  if (!options.installed && !options["catalog-entry"] && !options["receipt-root"] && !options.network) { console.log(JSON.stringify({ status: "not_checked", reason: "explicit skill check inputs were not supplied", checked: false })); return; }
  const network = required(options.network, "--network"); if (!["allow", "deny"].includes(network)) throw fail("invalid_input", "--network must be allow or deny");
  const receiptRoot = resolve(required(options["receipt-root"], "--receipt-root")); const checkedAt = required(options.now, "--now"); if (!Number.isFinite(Date.parse(checkedAt))) throw fail("invalid_input", "--now must be an ISO timestamp");
  const installedRaw = readJson(required(options.installed, "--installed"), "installed skill"); const catalogRaw = readJson(required(options["catalog-entry"], "--catalog-entry"), "catalog entry");
  const installed = identity(installedRaw, "installed"); const catalog = identity(catalogRaw, "catalog");
  let status = "unavailable"; let reason = "network_denied"; let upstream = null; let upstreamUrl = null; let upstreamResponseSha256 = null;
  if (installed.skill_id !== catalog.skill_id || installed.version !== catalog.version || installed.content_sha256 !== catalog.content_sha256 || canonical(installed.authority) !== canonical(catalog.authority)) reason = "installed_catalog_identity_mismatch";
  else if (network === "allow") {
    const declaredUpstream = catalogRaw.upstream_url ?? catalogRaw.upstream?.url ?? catalogRaw.authority?.upstream_url;
    upstreamUrl = required(options["upstream-url"] ?? declaredUpstream, "catalog declared upstream URL");
    if (declaredUpstream && options["upstream-url"] && options["upstream-url"] !== declaredUpstream) throw fail("stale_source", "requested upstream is not the catalog-declared authority");
    const timeoutMs = Number(options["timeout-ms"] ?? 10_000); if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) throw fail("invalid_input", "--timeout-ms must be an integer from 1 to 60000");
    try { const response = await fetch(upstreamUrl, { redirect: "error", signal: AbortSignal.timeout(timeoutMs) }); if (!response.ok) throw new Error(`HTTP ${response.status}`); const responseBytes = await response.text(); upstreamResponseSha256 = hash(responseBytes); upstream = identity(JSON.parse(responseBytes), "upstream"); if (upstream.skill_id !== installed.skill_id) { status = "unavailable"; reason = "upstream_identity_mismatch"; } else { status = upstream.version === installed.version && upstream.content_sha256 === installed.content_sha256 ? "current" : "update_available"; reason = null; } }
    catch (error) { status = "unavailable"; reason = `transport_unavailable:${error.message}`; }
  }
  const receipt = { schema_version: "skill-update-check.v1", checked_at: checkedAt, status, checked: network === "allow" && upstream !== null, network, reason, installed_identity: installed, catalog_identity: catalog, upstream_url: upstreamUrl, upstream_response_sha256: upstreamResponseSha256, upstream_identity: upstream, mutating_actions: [] };
  const written = writeReceipt(receiptRoot, receipt); console.log(JSON.stringify({ ...written.value, receipt_path: written.path }));
}

try { await main(); } catch (error) { console.log(JSON.stringify({ status: error.code ?? "unavailable", checked: false, error: { code: error.code ?? "unavailable", summary: error.message } })); process.exitCode = 1; }
