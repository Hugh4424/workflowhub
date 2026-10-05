import { fileURLToPath as migratedFilePath } from "node:url";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { test } from "vitest";
import { isAlive, readRuntime } from "../lib/runtime.mjs";

const slow = migratedFilePath(new URL("../test/slow-cli.mjs", import.meta.url));
const slowSuccess = migratedFilePath(new URL("../test/slow-success-cli.mjs", import.meta.url));
const fake = migratedFilePath(new URL("../test/fake-cli.mjs", import.meta.url));
const cli = migratedFilePath(new URL("../scripts/3rd-review.mjs", import.meta.url));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function temp() { return fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-cli-lifecycle-")); }
async function waitForRuntime(root) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const runtime = fs.readdirSync(root).find((name) => /^[0-9a-f-]{36}$/i.test(name));
    if (runtime) {
      try { const state = readRuntime(root, runtime); if (state.providers.kimi?.status === "running") return { runtime, state }; } catch { /* runtime creation publishes state immediately after its directory */ }
    }
    await delay(10);
  }
  throw new Error("provider did not enter running state");
}
function collect(command, args, env = {}) {
  return new Promise((resolve) => { const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, ...env } }); let stdout = ""; let stderr = ""; child.stdout.on("data", (chunk) => { stdout += chunk; }); child.stderr.on("data", (chunk) => { stderr += chunk; }); child.once("close", (code) => resolve({ code, stdout, stderr })); });
}

function packet(root) {
  const source = path.join(root, "source"); const contents = "review packet"; fs.mkdirSync(source); fs.writeFileSync(path.join(source, "review-instructions.md"), contents);
  const sha256 = createHash("sha256").update(contents).digest("hex");
  return { source, attachments: { root: source, delivery: "file_only", manifest: { version: 1, bundle_id: "cli-public-result", entries: [{ source: "review-instructions.md", destination: "review-instructions.md", size: Buffer.byteLength(contents), sha256, embed: false }] } } };
}

test("SIGTERM to broker cancels its provider tree with workflow_shutdown provenance", async () => {
  const root = temp(); const config = path.join(root, "config.json"); const request = path.join(root, "request.json");
  fs.writeFileSync(config, JSON.stringify({ version: 4, runtime: { root, ttl_hours: 24, max_prompt_bytes: 10_000, max_output_bytes: 100_000, liveness_interval_ms: 5, orphan_timeout_ms: 100 }, tiers: [["kimi"]], providers: { kimi: { enabled: true, command: slow, model: null, effort: null, thinking: null, auth: { type: "native" }, env: [] } } }));
  fs.writeFileSync(request, JSON.stringify({ version: 4, host_provider: "codex", prompt: "review", continuation: null }));
  const broker = spawn(process.execPath, [cli, "run", `--config=${config}`, `--request=${request}`], { stdio: "ignore" });
  const { runtime, state: running } = await waitForRuntime(root);
  assert.equal(broker.kill("SIGTERM"), true);
  await new Promise((resolve) => broker.once("close", resolve));
  const settled = readRuntime(root, runtime).providers.kimi;
  assert.equal(settled.status, "cancelled");
  assert.equal(settled.error.code, "CANCELLED");
  assert.equal(settled.cancellation_source, "workflow_shutdown");
  await delay(30);
  assert.equal(isAlive(running.providers.kimi.pid), false);
});

test("concurrent continuation atomically claims a provider and preserves unique rounds", async () => {
  const root = temp(); const config = path.join(root, "config.json"); const firstRequest = path.join(root, "first.json"); const nextRequest = path.join(root, "next.json");
  fs.writeFileSync(config, JSON.stringify({ version: 4, runtime: { root, ttl_hours: 24, max_prompt_bytes: 10_000, max_output_bytes: 100_000, liveness_interval_ms: 5, orphan_timeout_ms: 100 }, tiers: [["kimi"]], providers: { kimi: { enabled: true, command: slowSuccess, model: null, effort: null, thinking: null, auth: { type: "native" }, env: [] } } }));
  fs.writeFileSync(firstRequest, JSON.stringify({ version: 4, host_provider: "codex", prompt: "first", continuation: null }));
  const first = await collect(process.execPath, [cli, "run", `--config=${config}`, `--request=${firstRequest}`]); assert.equal(first.code, 0); const initial = JSON.parse(first.stdout); assert.equal(initial.providers[0].status, "completed");
  fs.writeFileSync(nextRequest, JSON.stringify({ version: 4, host_provider: "codex", prompt: "continue", provider_allowlist: ["kimi"], continuation: { runtime_id: initial.runtime_id } }));
  const calls = await Promise.all([collect(process.execPath, [cli, "run", `--config=${config}`, `--request=${nextRequest}`]), collect(process.execPath, [cli, "run", `--config=${config}`, `--request=${nextRequest}`])]); assert.deepEqual(calls.map((item) => item.code).sort(), [0, 3]); const results = calls.map((item) => JSON.parse(item.stdout));
  assert.deepEqual(results.map((item) => item.round).sort(), [2, 3]); assert.equal(readRuntime(root, initial.runtime_id).round, 3);
  const providers = results.map((item) => item.providers[0]); assert.equal(providers.filter((item) => item.status === "completed").length, 1); assert.equal(providers.filter((item) => item.error?.code === "PROVIDER_BUSY").length, 1);
});

test("a dead provider claim is reclaimed before continuation", async () => {
  const root = temp(); const config = path.join(root, "config.json"); const firstRequest = path.join(root, "first.json"); const nextRequest = path.join(root, "next.json");
  fs.writeFileSync(config, JSON.stringify({ version: 4, runtime: { root, orphan_timeout_ms: 100 }, tiers: [["kimi"]], providers: { kimi: { command: slowSuccess, auth: { type: "native" } } } })); fs.writeFileSync(firstRequest, JSON.stringify({ version: 4, host_provider: "codex", prompt: "first", continuation: null }));
  const initial = JSON.parse((await collect(process.execPath, [cli, "run", `--config=${config}`, `--request=${firstRequest}`])).stdout); const claim = path.join(root, initial.runtime_id, ".claims", "kimi"); fs.mkdirSync(claim, { recursive: true }); fs.writeFileSync(path.join(claim, "owner.json"), JSON.stringify({ version: 1, token: "dead", pid: 999_999_999, created_at_ms: 1 }));
  fs.writeFileSync(nextRequest, JSON.stringify({ version: 4, host_provider: "codex", prompt: "continue", continuation: { runtime_id: initial.runtime_id } })); const result = JSON.parse((await collect(process.execPath, [cli, "run", `--config=${config}`, `--request=${nextRequest}`])).stdout);
  assert.equal(result.providers[0].status, "completed"); assert.equal(fs.existsSync(claim), false);
});

test("CLI returns a parseable v2 group instead of exit 2 when one provider output contains a private path", async () => {
  const root = temp(); const config = path.join(root, "config.json"); const request = path.join(root, "request.json"); const material = packet(root);
  fs.writeFileSync(config, JSON.stringify({ version: 4, runtime: { root, ttl_hours: 24, max_prompt_bytes: 10_000, max_output_bytes: 100_000, liveness_interval_ms: 5, orphan_timeout_ms: 100 }, attachment_roots: [{ root: material.source, sources: ["review-instructions.md"] }], tiers: [["codex/terra", "kimi/k3", "claude-code/opus"]], providers: {
    "codex/terra": { enabled: true, command: fake, model: null, effort: null, thinking: null, auth: { type: "native" }, env: [] },
    "kimi/k3": { enabled: true, command: fake, model: null, effort: null, thinking: null, auth: { type: "native" }, env: ["THIRD_REVIEW_FAKE_KIMI_OUTPUT"] },
    "claude-code/opus": { enabled: true, command: fake, model: null, effort: null, thinking: null, auth: { type: "native" }, env: [] },
  } }));
  fs.writeFileSync(request, JSON.stringify({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v2", provider_allowlist: ["codex/terra", "kimi/k3", "claude-code/opus"], prompt: "review", continuation: null, attachments: material.attachments }));
  const call = await collect(process.execPath, [cli, "run", `--config=${config}`, `--request=${request}`], { THIRD_REVIEW_FAKE_KIMI_OUTPUT: "contains /private/provider-secret" });
  assert.equal(call.code, 0, call.stderr); const result = JSON.parse(call.stdout); const [hostProfile, polluted, normal] = result.providers;
  assert.equal(hostProfile.status, "failed"); assert.equal(hostProfile.error.code, "ATTACHMENT_DELIVERY_UNSUPPORTED"); assert.equal(polluted.error.code, "PUBLIC_RESULT_INVALID"); assert.equal(polluted.output, null); assert.equal(normal.status, "completed");
  assert.equal(JSON.stringify(result).includes("/private/provider-secret"), false);
});
