import { fileURLToPath as migratedFilePath } from "node:url";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import { canonicalDeliveryManifestHash, canonicalInnerManifestHash, canonicalMaterialManifestHash, canonicalPacketHash } from "../lib/attachments.mjs";
import { Broker } from "../lib/broker.mjs";
import { validateConfig } from "../lib/config.mjs";
import { parseProviderId, SUPPORTED_PROVIDER_IDS } from "../lib/provider-ids.mjs";
import { cancellationRequested, createRuntime, readRuntime, updateRuntime } from "../lib/runtime.mjs";
import { nodeFixtureCommand } from "./node-fixture-command.mjs";

const agy = nodeFixtureCommand(migratedFilePath(new URL("../test/fake-antigravity-cli.mjs", import.meta.url)));
const pi = nodeFixtureCommand(migratedFilePath(new URL("../test/fake-pi-cli.mjs", import.meta.url)));
const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-new-runtime-"));
const sha = (value) => createHash("sha256").update(value).digest("hex");

function source(delivery) {
  const root = temp(); const embed = delivery === "always_embed"; const diff = "DIFF\n";
  const materialHash = canonicalMaterialManifestHash("new-runtime-bundle", [{ target: "changes.diff", sha256: sha(diff), size: Buffer.byteLength(diff), embed }]);
  const review = { version: "review-packet.v1", manifest_hash: materialHash, diff_sha256: sha(diff) }; review.packet_hash = canonicalPacketHash(review);
  for (const [name, contents] of [["review-packet.v1.json", `${JSON.stringify(review)}\n`], ["changes.diff", diff]]) fs.writeFileSync(path.join(root, name), contents);
  const attachments = ["review-packet.v1.json", "changes.diff"].map((target) => { const value = fs.readFileSync(path.join(root, target)); return { destination: target, sha256: sha(value), size: value.length }; });
  const outer = [...attachments.map(({ destination: target, sha256, size }) => ({ target, sha256, size, embed })), { target: "manifest.json", sha256: "0".repeat(64), size: 0, embed }];
  const inner = { version: "review-attachment-manifest.v1", delivery_mode: delivery, packet_hash: review.packet_hash, manifest_hash: review.manifest_hash, diff_sha256: review.diff_sha256, attachments, delivery_manifest_hash: canonicalDeliveryManifestHash("new-runtime-bundle", outer, delivery) };
  inner.inner_manifest_hash = canonicalInnerManifestHash(inner); fs.writeFileSync(path.join(root, "manifest.json"), `${JSON.stringify(inner)}\n`);
  return root;
}

function packet(root, delivery) {
  const embed = delivery === "always_embed"; const innerPath = path.join(root, "manifest.json"); const inner = JSON.parse(fs.readFileSync(innerPath, "utf8"));
  const names = ["review-packet.v1.json", "changes.diff", "manifest.json"]; const files = names.map((target) => { const value = fs.readFileSync(path.join(root, target)); return { target, sha256: sha(value), size: value.length, embed }; });
  inner.delivery_mode = delivery; inner.delivery_manifest_hash = canonicalDeliveryManifestHash("new-runtime-bundle", files, delivery); inner.inner_manifest_hash = canonicalInnerManifestHash(inner); fs.writeFileSync(innerPath, `${JSON.stringify(inner)}\n`);
  return { root, delivery, manifest: { version: 1, bundle_id: "new-runtime-bundle", entries: names.map((source) => { const value = fs.readFileSync(path.join(root, source)); return { source, destination: source, size: value.length, sha256: sha(value), embed }; }) } };
}

function config(runtime, root, providers, tiers = [Object.keys(providers)]) {
  return validateConfig({ version: 4, runtime: { root: runtime, ttl_hours: 24, max_prompt_bytes: 100_000, max_output_bytes: 100_000, max_attachment_bytes: 100_000, liveness_interval_ms: 5 }, attachment_roots: [{ root, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] }], tiers, providers });
}

function provider(id, command, extra = {}) { return { enabled: true, command, model: id === "antigravity" ? "Gemini 3.5 Flash (Low)" : "deepseek/deepseek-v4-flash", effort: id === "pi" ? "low" : null, thinking: null, allow_host_state: id === "antigravity" || id === "cursor", auth: { type: "native" }, env: [], ...extra }; }

test("supported provider IDs have one config and request contract", () => {
  const runtime = temp(); const root = source("file_only");
  const providers = Object.fromEntries(SUPPORTED_PROVIDER_IDS.map((id) => [id, provider(id, id === "antigravity" ? agy : pi)]));
  const value = config(runtime, root, providers, [SUPPORTED_PROVIDER_IDS]);
  assert.deepEqual(Object.keys(value.providers).sort(), [...SUPPORTED_PROVIDER_IDS].sort());
  assert.equal(parseProviderId("opencode/512mac").profile, "512mac");
  assert.equal(parseProviderId("opencode/pax3.8").profile, "pax3.8");
});

test("CLI/model provider instances use one adapter and isolated runtime keys", async () => {
  const root = source("file_only"); const runtime = temp(); const providers = {
    "pi/deepseek": provider("pi", pi, { model: "deepseek/deepseek-v4-pro", effort: "high" }),
    "pi/k3": provider("pi", pi, { model: "kimi-coding/k3", effort: null, thinking: true }),
    "pi/coding": provider("pi", pi, { model: "kimi-coding/kimi-for-coding", effort: null, thinking: true }),
    "antigravity/flash": provider("antigravity", agy, { model: "Gemini 3.6 Flash (High)", allow_host_state: true }),
  };
  const value = config(runtime, root, providers, [["pi/deepseek", "pi/k3", "pi/coding"], ["antigravity/flash"]]);
  assert.deepEqual(Object.fromEntries(Object.entries(value.providers).map(([id, item]) => [id, [item.adapter, item.runtime_key]])), {
    "pi/deepseek": ["pi", "pi%2Fdeepseek"], "pi/k3": ["pi", "pi%2Fk3"], "pi/coding": ["pi", "pi%2Fcoding"], "antigravity/flash": ["antigravity", "antigravity%2Fflash"],
  });
  const broker = new Broker(value); const first = await broker.run({ version: 4, host_provider: "codex", provider_allowlist: ["pi/deepseek"], prompt: "R1", continuation: null, attachments: packet(root, "file_only") });
  assert.equal(first.providers[0].provider, "pi/deepseek"); assert.equal(first.providers[0].status, "completed");
  assert.equal(fs.existsSync(path.join(runtime, first.runtime_id, "work", "pi%2Fdeepseek", "bundle", "changes.diff")), true);
  assert.equal(fs.existsSync(path.join(runtime, first.runtime_id, "work", "pi", "deepseek")), false);
  const second = await broker.run({ version: 4, host_provider: "codex", provider_allowlist: ["pi/deepseek"], prompt: "R2", continuation: { runtime_id: first.runtime_id, reuse_frozen_material: true } });
  assert.equal(second.providers[0].provider, "pi/deepseek"); assert.equal(second.providers[0].session_id, first.providers[0].session_id);
  await assert.rejects(broker.run({ version: 4, host_provider: "pi/k3", provider_allowlist: ["pi/deepseek"], prompt: "review", continuation: null }), { code: "REQUEST_INVALID" });
  for (const invalid of ["pi/", "pi//k3", "pi/../k3", "unknown/model"]) assert.throws(() => config(temp(), root, { [invalid]: provider("pi", pi) }, [[invalid]]), { code: "CONFIG_INVALID" });
});

test("Pi completes file_only, always_embed, and native continuation through its supervised stream", async () => {
  const fileRoot = source("file_only"); const runtime = temp(); const value = config(runtime, fileRoot, { pi: provider("pi", pi) }); const broker = new Broker(value);
  const first = await broker.run({ version: 4, host_provider: "antigravity", provider_allowlist: ["pi"], prompt: "R1", continuation: null, attachments: packet(fileRoot, "file_only") });
  assert.equal(first.providers[0].status, "completed"); assert.equal(first.providers[0].delivery_used, "file_only"); assert.match(first.providers[0].output, /R1/); assert.match(first.providers[0].session_id, /^[0-9a-f-]{36}$/i);
  const piBundle = path.join(runtime, first.runtime_id, "work", "pi", "bundle", "changes.diff"); assert.equal(fs.existsSync(piBundle), true, piBundle);
  const second = await broker.run({ version: 4, host_provider: "antigravity", provider_allowlist: ["pi"], prompt: "R2", continuation: { runtime_id: first.runtime_id, reuse_frozen_material: true } });
  assert.equal(second.providers[0].status, "completed"); assert.equal(second.providers[0].session_id, first.providers[0].session_id);
  const embedRoot = source("always_embed"); const embedRuntime = temp(); const embedBroker = new Broker(config(embedRuntime, embedRoot, { pi: provider("pi", pi) }));
  const embedded = await embedBroker.run({ version: 4, host_provider: "antigravity", provider_allowlist: ["pi"], prompt: "EMBED", continuation: null, attachments: packet(embedRoot, "always_embed") });
  assert.equal(embedded.providers[0].status, "completed"); assert.equal(embedded.providers[0].delivery_used, "always_embed"); assert.match(embedded.providers[0].output, /<attachments mode="always_embed">/);
});

test("Pi rewrites one private-path final in the same session before public projection", async () => {
  const root = source("file_only"); const runtime = temp(); const promptLog = path.join(runtime, "pi-prompts.jsonl");
  const value = config(runtime, root, { "pi/coding": provider("pi", pi, { model: "kimi-coding/kimi-for-coding", thinking: true, env: ["PI_FAKE_OUTPUT_CASE", "PI_FAKE_PROMPT_LOG"] }) }, [["pi/coding"]]);
  const forbidden = `finding=${String.fromCharCode(47, 112, 114, 105, 118, 97, 116, 101, 47, 102, 105, 120, 116, 117, 114, 101)}`;
  const safeOutput = '{"verdict":"pass","summary":"safe","findings":[]}';
  process.env.PI_FAKE_OUTPUT_CASE = "private-then-safe"; process.env.PI_FAKE_PROMPT_LOG = promptLog;
  try {
    const result = await new Broker(value).run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v2", provider_allowlist: ["pi/coding"], prompt: "review", continuation: null, attachments: packet(root, "file_only") });
    const providerResult = result.providers[0];
    assert.equal(providerResult.status, "completed"); assert.equal(providerResult.output, safeOutput);
    assert.deepEqual(providerResult.usage, { totalTokens: 14 }); assert.equal(providerResult.retry.count, 0); assert.ok(providerResult.retry.progress_events >= 2);
    const prompts = fs.readFileSync(promptLog, "utf8").trim().split("\n").map((line) => JSON.parse(line));
    assert.equal(prompts.length, 2); assert.equal(prompts[0].session, prompts[1].session);
    assert.equal(prompts[1].prompt.includes(forbidden), false); assert.match(prompts[1].prompt, /host-path fixture/);
    const state = readRuntime(runtime, result.runtime_id).providers["pi/coding"];
    assert.equal(state.public_output_rewrite_count, 1); assert.ok(state.initial_raw_output_refs?.raw_stdout_ref);
    const rawDirectory = path.join(runtime, result.runtime_id, "raw", "pi%2Fcoding"); assert.equal(fs.readdirSync(rawDirectory).filter((name) => name.endsWith(".stdout")).length, 2);
    assert.equal(JSON.stringify(result).includes(forbidden), false); assert.equal(JSON.stringify(result).includes(runtime), false);
  } finally { delete process.env.PI_FAKE_OUTPUT_CASE; delete process.env.PI_FAKE_PROMPT_LOG; }
});

test("Pi keeps a twice-private final unavailable after one rewrite", async () => {
  const root = source("file_only"); const runtime = temp();
  const value = config(runtime, root, { "pi/coding": provider("pi", pi, { model: "kimi-coding/kimi-for-coding", thinking: true, env: ["PI_FAKE_OUTPUT_CASE"] }) }, [["pi/coding"]]);
  const forbidden = `finding=${String.fromCharCode(47, 112, 114, 105, 118, 97, 116, 101, 47, 102, 105, 120, 116, 117, 114, 101)}`;
  process.env.PI_FAKE_OUTPUT_CASE = "private-twice";
  try {
    const result = await new Broker(value).run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v2", provider_allowlist: ["pi/coding"], prompt: "review", continuation: null, attachments: packet(root, "file_only") });
    const providerResult = result.providers[0];
    assert.equal(providerResult.status, "failed"); assert.equal(providerResult.error.code, "PUBLIC_RESULT_INVALID"); assert.equal(providerResult.output, null);
    assert.equal(JSON.stringify(result).includes(forbidden), false);
    const rawDirectory = path.join(runtime, result.runtime_id, "raw", "pi%2Fcoding"); assert.equal(fs.readdirSync(rawDirectory).filter((name) => name.endsWith(".stdout")).length, 2);
  } finally { delete process.env.PI_FAKE_OUTPUT_CASE; }
});

test("Pi preserves a rewrite transport failure instead of projecting a semantic result", async () => {
  const root = source("file_only"); const runtime = temp();
  const value = config(runtime, root, { "pi/coding": provider("pi", pi, { model: "kimi-coding/kimi-for-coding", thinking: true, env: ["PI_FAKE_OUTPUT_CASE", "PI_FAKE_REWRITE_NO_SETTLED"] }) }, [["pi/coding"]]);
  process.env.PI_FAKE_OUTPUT_CASE = "private-then-safe"; process.env.PI_FAKE_REWRITE_NO_SETTLED = "1";
  try {
    const result = await new Broker(value).run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v2", provider_allowlist: ["pi/coding"], prompt: "review", continuation: null, attachments: packet(root, "file_only") });
    const providerResult = result.providers[0];
    assert.equal(providerResult.status, "failed"); assert.equal(providerResult.error.code, "PROVIDER_OUTPUT_INVALID"); assert.equal(providerResult.output, null);
  } finally { delete process.env.PI_FAKE_OUTPUT_CASE; delete process.env.PI_FAKE_REWRITE_NO_SETTLED; }
});

test("cancel preserves intent while a same-session Pi rewrite is pending", () => {
  const runtime = temp(); const state = createRuntime(runtime, 24, "codex");
  updateRuntime(runtime, state.runtime_id, (current) => ({ ...current, providers: { "pi/coding": { provider: "pi/coding", status: "running", pid: 999999, worker: { pid: 999999, started: "stale" } } } }));
  const broker = new Broker(config(runtime, source("file_only"), { "pi/coding": provider("pi", pi) }, [["pi/coding"]]));
  assert.deepEqual(broker.cancel(state.runtime_id, "pi/coding"), { cancelled: true });
  assert.equal(cancellationRequested(runtime, state.runtime_id, "pi/coding"), true);
});

test("Pi fails closed when the CLI returns a session other than the planned native session", async () => {
  const runtime = temp(); const root = source("file_only"); const value = config(runtime, root, { pi: provider("pi", pi, { env: ["PI_FAKE_SESSION_ID"] }) });
  process.env.PI_FAKE_SESSION_ID = "wrong-pi-session";
  try {
    const result = await new Broker(value).run({ version: 4, host_provider: "antigravity", provider_allowlist: ["pi"], prompt: "review", continuation: null });
    assert.equal(result.providers[0].status, "failed"); assert.equal(result.providers[0].error.code, "PROVIDER_OUTPUT_INVALID");
  } finally { delete process.env.PI_FAKE_SESSION_ID; }
});

test("Pi surfaces wrapper protocol violations as invalid provider output", async () => {
  const runtime = temp(); const root = source("file_only"); const value = config(runtime, root, { pi: provider("pi", pi, { env: ["PI_FAKE_MISSING_WILL_RETRY"] }) });
  process.env.PI_FAKE_MISSING_WILL_RETRY = "1";
  try {
    const result = await new Broker(value).run({ version: 4, host_provider: "antigravity", provider_allowlist: ["pi"], prompt: "review", continuation: null });
    assert.equal(result.providers[0].status, "failed"); assert.equal(result.providers[0].error.code, "PROVIDER_OUTPUT_INVALID");
  } finally { delete process.env.PI_FAKE_MISSING_WILL_RETRY; }
});

test("Antigravity runs only file_only and is explicitly not continuable", async () => {
  const root = source("file_only"); const runtime = temp(); const value = config(runtime, root, { antigravity: provider("antigravity", agy, { env: ["AGY_FAKE_CWD_MODE"] }) }); const broker = new Broker(value);
  process.env.AGY_FAKE_CWD_MODE = "true";
  try {
    const first = await broker.run({ version: 4, host_provider: "pi", provider_allowlist: ["antigravity"], prompt: "R1", continuation: null, attachments: packet(root, "file_only") });
    assert.equal(first.providers[0].status, "completed"); assert.equal(first.providers[0].session_id, null); assert.equal(first.providers[0].delivery_used, "file_only"); assert.match(first.providers[0].output, /workspace\/antigravity$/);
    const second = await broker.run({ version: 4, host_provider: "pi", provider_allowlist: ["antigravity"], prompt: "R2", continuation: { runtime_id: first.runtime_id } });
    assert.equal(second.providers[0].error.code, "NO_CONTINUABLE_SESSION");
    const embedRoot = source("always_embed"); value.attachment_roots.push({ root: embedRoot, sources: ["review-packet.v1.json", "changes.diff", "manifest.json"] }); const embed = await broker.run({ version: 4, host_provider: "pi", provider_allowlist: ["antigravity"], prompt: "embed", continuation: null, attachments: packet(embedRoot, "always_embed") });
    assert.equal(embed.providers[0].error.code, "ATTACHMENT_DELIVERY_UNSUPPORTED");
  } finally { delete process.env.AGY_FAKE_CWD_MODE; }
});

test("Antigravity requires an explicit native-profile acknowledgement", async () => {
  const root = source("file_only"); const value = config(temp(), root, { antigravity: provider("antigravity", agy, { allow_host_state: false }) });
  const result = await new Broker(value).run({ version: 4, host_provider: "pi", provider_allowlist: ["antigravity"], prompt: "review", continuation: null });
  assert.equal(result.providers[0].status, "failed"); assert.equal(result.providers[0].error.code, "PROVIDER_HOST_STATE_UNACKNOWLEDGED");
});
