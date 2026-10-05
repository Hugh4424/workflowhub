import { fileURLToPath as migratedFilePath } from "node:url";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";
import { Broker, publicV2Error, sumUsage } from "../lib/broker.mjs";
import { canonicalDeliveryManifestHash, canonicalInnerManifestHash, canonicalMaterialManifestHash, canonicalPacketHash, canonicalWorkflowHubMaterialId, planDelivery, prepareAttachments, probeAttachmentWorkspace, validateAttachments } from "../lib/attachments.mjs";
import { validateConfig } from "../lib/config.mjs";
import { cancellationRequested, cancellationSource, createRuntime, requestCancellation } from "../lib/runtime.mjs";

const fake = migratedFilePath(new URL("../test/fake-cli.mjs", import.meta.url));
const slow = migratedFilePath(new URL("../test/slow-cli.mjs", import.meta.url));
const stdinOpenCode = migratedFilePath(new URL("../test/stdin-opencode-cli.mjs", import.meta.url));
const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-attachments-"));
const sha = (value) => createHash("sha256").update(value).digest("hex");
function packet(root, delivery = "file_only", embed = delivery === "always_embed") {
  const innerPath = path.join(root, "manifest.json"); const inner = JSON.parse(fs.readFileSync(innerPath, "utf8")); inner.delivery_mode = delivery; const outer = ["skills/review/SKILL.md", "review-packet.v1.json", "changes.diff", "manifest.json"].filter((source) => fs.existsSync(path.join(root, source))).map((target) => { const value = fs.readFileSync(path.join(root, target)); return { target, sha256: sha(value), size: value.length, embed }; }); inner.delivery_manifest_hash = canonicalDeliveryManifestHash("bundle-1", outer, delivery); inner.inner_manifest_hash = canonicalInnerManifestHash(inner); fs.writeFileSync(innerPath, `${JSON.stringify(inner)}\n`);
  const names = ["skills/review/SKILL.md", "review-packet.v1.json", "changes.diff", "manifest.json"];
  return { root, delivery, manifest: { version: 1, bundle_id: "bundle-1", entries: names.map((source) => { const value = fs.readFileSync(path.join(root, source)); return { source, destination: source, size: value.length, sha256: sha(value), embed }; }) } };
}
function simplePacket(root) {
  const entries = ["review-instructions.md", "requirements/raw_requirement.md", "manifest.json"].map((source) => { const value = fs.readFileSync(path.join(root, source)); return { source, destination: source, size: value.length, sha256: sha(value), embed: false }; });
  return { root, delivery: "file_only", manifest: { version: 1, bundle_id: "simple-direction", entries } };
}
function simpleSource() {
  const root = temp(); fs.mkdirSync(path.join(root, "requirements")); fs.writeFileSync(path.join(root, "review-instructions.md"), "one"); fs.writeFileSync(path.join(root, "requirements/raw_requirement.md"), "need"); fs.writeFileSync(path.join(root, "manifest.json"), "[]"); return root;
}
function source(delivery = "file_only", diff = "DIFF_HEAD\nDIFF_TAIL\n") { const root = temp(); const embed = delivery === "always_embed"; const materialHash = canonicalMaterialManifestHash("bundle-1", [{ target: "skills/review/SKILL.md", sha256: sha("lens"), size: 4, embed }, { target: "changes.diff", sha256: sha(diff), size: Buffer.byteLength(diff), embed }]); const review = { version: "review-packet.v1", manifest_hash: materialHash, diff_sha256: sha(diff) }; review.packet_hash = canonicalPacketHash(review); const packet = `${JSON.stringify(review)}\n`; const files = [["skills/review/SKILL.md", "lens"], ["review-packet.v1.json", packet], ["changes.diff", diff]]; for (const [name, contents] of files) { fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true }); fs.writeFileSync(path.join(root, name), contents); } const attachments = files.map(([destination, contents]) => ({ destination, sha256: sha(contents), size: Buffer.byteLength(contents) })); const outer = [...attachments.map(({ destination: target, sha256, size }) => ({ target, sha256, size, embed })), { target: "manifest.json", sha256: "0".repeat(64), size: 0, embed }]; const manifest = { version: "review-attachment-manifest.v1", delivery_mode: delivery, packet_hash: review.packet_hash, manifest_hash: review.manifest_hash, diff_sha256: review.diff_sha256, attachments, delivery_manifest_hash: canonicalDeliveryManifestHash("bundle-1", outer, delivery) }; manifest.inner_manifest_hash = canonicalInnerManifestHash(manifest); fs.writeFileSync(path.join(root, "manifest.json"), `${JSON.stringify(manifest)}\n`); return root; }
function config(root, tiers, attachmentRoot = null) {
  const ids = [...new Set(tiers.flat())];
  return validateConfig({ version: 4, runtime: { root, ttl_hours: 24, max_prompt_bytes: 10000, max_output_bytes: 100000, max_attachment_bytes: 10000, liveness_interval_ms: 5, orphan_timeout_ms: 100 }, attachment_roots: attachmentRoot ? [{ root: attachmentRoot, sources: ["skills", "contracts", "requirements", "review-instructions.md", "review-packet.v1.json", "changes.diff", "manifest.json"] }] : [], tiers, providers: Object.fromEntries(ids.map((id) => [id, { enabled: true, command: fake, model: null, effort: null, thinking: null, auth: { type: "native" }, env: [] }])) });
}

test("workflowhub material id binds semantic files and ignores transport wrappers", () => {
  const files = [
    { target: "review-instructions.md", size: 3, sha256: sha("one"), embed: false },
    { target: "manifest.json", size: 3, sha256: sha("two"), embed: false },
  ];
  const expected = canonicalWorkflowHubMaterialId(files);
  assert.equal(expected, "2459e73e3f3a754519fc84a9e9e616010c0e43e80d3e218a10316665d84922bf");
  assert.equal(canonicalWorkflowHubMaterialId([...files].reverse().map((item) => ({ ...item, embed: true }))), expected);
  assert.equal(canonicalWorkflowHubMaterialId(files.map((item, index) => index === 1 ? { ...item, sha256: sha("changed") } : item)), expected);
  assert.notEqual(canonicalWorkflowHubMaterialId(files.map((item, index) => index === 0 ? { ...item, sha256: sha("changed") } : item)), expected);
  assert.notEqual(canonicalWorkflowHubMaterialId([...files, { target: "review-packet.v1.json", size: 5, sha256: sha("three"), embed: false }]), expected);
  assert.equal(canonicalWorkflowHubMaterialId([...files, { target: "canonical-evidence.json", size: 5, sha256: sha("audit"), embed: false }]), expected);
});

test("negotiated delivery keeps one shared material identity and chooses the existing file_only capability", () => {
  const root = source(); const input = packet(root, "negotiated");
  const checked = validateAttachments(input, 10_000, [{ root, sources: ["skills", "review-packet.v1.json", "changes.diff", "manifest.json"] }]);
  const planned = planDelivery({ capabilities: { attachment_delivery: ["file_only", "always_embed"] } }, checked, "review", 10_000, { requireTriad: false });
  const embedded = planDelivery({ capabilities: { attachment_delivery: ["always_embed"] } }, checked, "review", 10_000, { requireTriad: false });
  assert.equal(planned.delivery_mode, "file_only");
  assert.equal(planned.material_manifest_hash, checked.manifest_hash);
  assert.equal(embedded.delivery_mode, "always_embed");
  assert.equal(embedded.material_manifest_hash, checked.manifest_hash);
  assert.match(embedded.provider_prompt, /<attachments mode="always_embed">/);
});

test("usage recovery preserves decimal cost but rejects misplaced decimal fields", () => {
  assert.deepEqual(sumUsage(
    { input: 10, cost: { total: 0.1 } },
    { input: 5, cost: { total: 0.2 } },
  ), { input: 15, cost: { total: 0.30000000000000004 } });
  assert.equal(sumUsage({ input: 1, nested: { cost: 0.1 } }, { input: 1, nested: { cost: 0.2 } }), null);
});

test("doctor requires configured attachment roots and verifies the requested root", async () => {
  const unconfigured = await new Broker(config(temp(), [["kimi", "opencode"]])).doctor();
  assert.deepEqual(unconfigured.material_protocol, { version: 5, delivery_attestation: "sealed-exact-copy.v1" });
  assert.deepEqual(unconfigured.capabilities, { attachments: false, cancel_source: true });
  assert.deepEqual(unconfigured.attachment_root, { status: "unavailable", error: { code: "ATTACHMENT_ROOT_UNCONFIGURED" } });
  const root = source(); const broker = new Broker(config(temp(), [["kimi", "opencode"]], root));
  const result = await broker.doctor({ attachmentRoot: root });
  assert.deepEqual(result.result_protocols, ["workflowhub-result.v1", "workflowhub-result.v2", "workflowhub-result.v3"]);
  assert.deepEqual(result.material_protocol, { version: 5, delivery_attestation: "sealed-exact-copy.v1" });
  assert.deepEqual(result.capabilities, { attachments: true, cancel_source: true });
  assert.deepEqual(result.attachment_root, { status: "ready" });
  assert.deepEqual(result.providers.map((item) => item.provider), ["kimi", "opencode"]);
  assert.equal(result.verification, "workspace_copy_only");
  const forbidden = await broker.doctor({ attachmentRoot: temp() });
  assert.deepEqual(forbidden.capabilities, { attachments: false, cancel_source: true });
  assert.equal(forbidden.attachment_root.status, "unavailable");
  assert.equal(forbidden.attachment_root.error.code, "ATTACHMENT_ROOT_FORBIDDEN");
  assert.deepEqual(result.providers.find((item) => item.provider === "kimi").capabilities, { continuation: true, attachment_delivery: ["file_only"] });
  assert.deepEqual(result.providers.find((item) => item.provider === "opencode").capabilities, { continuation: true, terminal_recovery: true, attachment_delivery: ["file_only", "always_embed"] });
});

test("workflowhub result is an additive public projection bound to broker-verified material", async () => {
  const attachmentsRoot = source(); const runtime = temp(); const broker = new Broker(config(runtime, [["kimi"]], attachmentsRoot));
  const request = { version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v1", prompt: "review", continuation: null, attachments: packet(attachmentsRoot) };
  const result = await broker.run(request); const provider = result.providers[0];
  const checked = validateAttachments(request.attachments, 10_000, [{ root: attachmentsRoot, sources: ["skills", "contracts", "review-packet.v1.json", "changes.diff", "manifest.json"] }]);
  assert.equal(provider.result_protocol, "workflowhub-result.v1"); assert.equal(provider.material_id, checked.material_id);
  assert.equal(provider.status, "completed"); assert.equal(provider.output, "kimi opinion"); assert.equal(typeof provider.session_id, "string"); assert.equal(provider.error, null);
  assert.deepEqual(Object.keys(provider).sort(), ["error", "material_id", "output", "provider", "result_protocol", "session_id", "status"]);
  assert.equal(JSON.stringify(provider).includes("delivery"), false);
  assert.equal(JSON.stringify(provider).includes("raw_"), false);
  assert.doesNotMatch(JSON.stringify(result), new RegExp(runtime.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("workflowhub result v2 exposes public effective profile and telemetry without runtime paths", async () => {
  const attachmentsRoot = source(); const runtime = temp(); const value = config(runtime, [["kimi"]], attachmentsRoot);
  Object.assign(value.providers.kimi, { model: "kimi-code/k3", effort: "high", thinking: true });
  const result = await new Broker(value).run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v2", provider_allowlist: ["kimi"], prompt: "review", continuation: null, attachments: packet(attachmentsRoot) });
  const provider = result.providers[0];
  assert.equal(provider.result_protocol, "workflowhub-result.v2");
  assert.equal(provider.provider, "kimi"); assert.equal(provider.adapter, "kimi");
  assert.equal(provider.model, "kimi-code/k3"); assert.equal(provider.effort, "high"); assert.equal(provider.thinking, true);
  assert.equal(provider.status, "completed"); assert.equal(provider.output, "kimi opinion");
  assert.equal(provider.session_file_path, null); assert.equal(provider.continuable, true);
  assert.equal(Number.isSafeInteger(provider.timing.started_at_ms), true);
  assert.equal(Number.isSafeInteger(provider.timing.completed_at_ms), true);
  assert.equal(Number.isSafeInteger(provider.timing.duration_ms), true);
  assert.deepEqual(provider.usage, null); assert.deepEqual(provider.retry, { count: 0, progress_events: 1 });
  assert.equal(provider.unavailable_diagnostics, null);
  assert.deepEqual(provider.raw_output_ref.version, "broker-output-ref.v1");
  assert.match(provider.raw_output_ref.stdout_sha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(Object.keys(provider).sort(), ["adapter", "continuable", "effort", "error", "material_id", "model", "output", "provider", "raw_output_ref", "result_protocol", "retry", "runtime_id", "session_file_path", "session_id", "status", "thinking", "timing", "unavailable_diagnostics", "usage"]);
  assert.equal(JSON.stringify(result).includes(runtime), false);
  assert.equal(JSON.stringify(result).includes("raw_stdout_ref"), false);
});

test("workflowhub result v3 accepts the configured same-source member and records SAME_SOURCE", async () => {
  const attachmentsRoot = source(); const runtime = temp();
  const value = config(runtime, [["codex", "kimi"]], attachmentsRoot);
  const result = await new Broker(value).run({
    version: 4,
    host_provider: "codex",
    required_result_protocol: "workflowhub-result.v3",
    provider_allowlist: ["codex", "kimi"],
    prompt: "review",
    continuation: null,
    attachments: packet(attachmentsRoot),
  });
  assert.equal(result.version, "workflowhub-result.v3");
  assert.deepEqual(result.providers.map(({ identity, status, error }) => ({ provider: identity.provider, status, code: error?.code ?? null })), [
    { provider: "codex", status: "failed", code: "SAME_SOURCE" },
    { provider: "kimi", status: "completed", code: null },
  ]);
});

test("workflowhub result v3 publishes safe parse/process outcomes without private runtime fields", async () => {
  const attachmentsRoot = source(); const runtime = temp(); const value = config(runtime, [["kimi"]], attachmentsRoot);
  const result = await new Broker(value, { managedSession: true }).run({
    version: 4,
    host_provider: "codex",
    required_result_protocol: "workflowhub-result.v3",
    provider_allowlist: ["kimi"],
    prompt: "review",
    continuation: null,
    attachments: packet(attachmentsRoot),
  });
  const publicAttempt = result.providers[0].attempts[0];
  const privateAttempt = JSON.parse(fs.readFileSync(path.join(runtime, result.runtime_id, "state.json"), "utf8")).providers.kimi.attempts[0];
  assert.equal(privateAttempt.process_outcome, "ok");
  assert.equal(privateAttempt.parse_outcome, "ok");
  assert.equal(publicAttempt.process_outcome, "ok");
  assert.equal(publicAttempt.parse_outcome, "ok");
  assert.deepEqual(Object.keys(publicAttempt).sort(), [
    "attempt_id", "completed_at_ms", "duration_ms", "error", "kind",
    "parse_outcome", "process_outcome", "provider_retry_count", "session_id", "started_at_ms", "status",
  ]);
  assert.equal(JSON.stringify(publicAttempt).includes(runtime), false);
  assert.equal(JSON.stringify(publicAttempt).includes("review"), false);
});

test("workflowhub result v2 gives public unavailable diagnostics without fabricated telemetry", async () => {
  const attachmentsRoot = source(); const runtime = temp(); const value = config(runtime, [["kimi"]], attachmentsRoot);
  value.providers.kimi.command = path.join(runtime, "missing-provider");
  const result = await new Broker(value).run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v2", provider_allowlist: ["kimi"], prompt: "review", continuation: null, attachments: packet(attachmentsRoot) });
  const provider = result.providers[0];
  assert.equal(provider.status, "failed"); assert.equal(provider.error.code, "PROCESS_START_FAILED");
  assert.equal(provider.error.message, "provider error message omitted because it contained a private absolute path");
  assert.equal(JSON.stringify(result).includes(runtime), false);
  assert.deepEqual(provider.unavailable_diagnostics, { code: "PROCESS_START_FAILED", message: provider.error.message });
  assert.deepEqual(provider.usage, null); assert.deepEqual(provider.retry, { count: 0, progress_events: 0 });
  assert.equal(provider.session_id, null); assert.equal(provider.session_file_path, null); assert.equal(provider.continuable, false);
  for (const value of Object.values(provider.timing)) assert.equal(value === null || Number.isSafeInteger(value), true);
});

test("workflowhub result v2 gives missing provider error messages a non-empty safe public replacement", () => {
  assert.deepEqual(publicV2Error({ code: "PROBE_FAILED" }), { code: "PROBE_FAILED", message: "provider error message is unavailable" });
  assert.deepEqual(publicV2Error({ code: "PROBE_FAILED", message: "   " }), { code: "PROBE_FAILED", message: "provider error message is unavailable" });
  assert.deepEqual(publicV2Error(null), { code: "RESULT_UNAVAILABLE", message: "provider error message is unavailable" });
  for (const message of ["failure=/private/provider", "failure:/private/provider", "failure file:///private/provider"]) {
    const projected = publicV2Error({ code: "PROBE_FAILED", message });
    assert.equal(projected.message, "provider error message omitted because it contained a private absolute path");
    assert.equal(projected.message.includes("/private/provider"), false);
  }
});

test("workflowhub result v2 requires a candidate group and executes every configured member", async () => {
  const attachmentsRoot = source(); const runtime = temp(); const broker = new Broker(config(runtime, [["kimi", "opencode"]], attachmentsRoot)); const input = { version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v2", prompt: "review", continuation: null, attachments: packet(attachmentsRoot) };
  await assert.rejects(() => broker.run(input), { code: "REQUEST_INVALID" });
  const result = await broker.run({ ...input, provider_allowlist: ["opencode", "kimi"] });
  assert.deepEqual(result.providers.map((provider) => provider.provider), ["opencode", "kimi"]);
  assert.ok(result.providers.every((provider) => provider.result_protocol === "workflowhub-result.v2" && provider.status === "completed"));
  assert.ok(result.providers.every((provider) => Number.isSafeInteger(provider.timing.started_at_ms) && Number.isSafeInteger(provider.timing.completed_at_ms)));
});

test("Kimi attachment access paths stay provider-private in workflowhub result v2", async () => {
  const attachmentsRoot = source(); const runtime = temp(); const broker = new Broker(config(runtime, [["kimi"]], attachmentsRoot));
  const result = await broker.run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v2", provider_allowlist: ["kimi"], prompt: "review", continuation: null, attachments: packet(attachmentsRoot) });
  assert.equal(result.providers[0].status, "completed");
  const publicResult = JSON.stringify(result);
  assert.equal(publicResult.includes(runtime), false);
  assert.equal(publicResult.includes(attachmentsRoot), false);
  assert.equal(publicResult.includes(path.join(runtime, result.runtime_id, "work", "kimi", "bundle")), false);
});

test("workflowhub result v2 executes every configured profile beside heterologous results", async () => {
  const attachmentsRoot = source(); const runtime = temp(); const broker = new Broker(config(runtime, [["codex/terra", "kimi"]], attachmentsRoot));
  const result = await broker.run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v2", provider_allowlist: ["codex/terra", "kimi"], prompt: "review", continuation: null, attachments: packet(attachmentsRoot) });
  assert.deepEqual(result.providers.map((provider) => provider.provider), ["codex/terra", "kimi"]);
  assert.equal(result.providers[0].status, "completed");
  assert.equal(result.providers[1].status, "completed"); assert.equal(result.outcome, "completed");
});

test("workflowhub result v2 isolates a private-path provider failure without leaking or aborting its group", async () => {
  for (const output of ["finding=/private/provider-secret", "finding=/data/provider-secret", "finding=/workspace/provider-secret", "finding:/private/provider-secret", "finding file:///private/provider-secret"]) {
    const attachmentsRoot = source(); const runtime = temp(); const value = config(runtime, [["codex/terra", "kimi/k3", "claude-code/opus"]], attachmentsRoot);
    value.providers["kimi/k3"].env = ["THIRD_REVIEW_FAKE_KIMI_OUTPUT"];
    process.env.THIRD_REVIEW_FAKE_KIMI_OUTPUT = output;
    try {
      const result = await new Broker(value).run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v2", provider_allowlist: ["codex/terra", "kimi/k3", "claude-code/opus"], prompt: "review", continuation: null, attachments: packet(attachmentsRoot) });
      assert.doesNotThrow(() => JSON.parse(JSON.stringify(result)));
      assert.deepEqual(result.providers.map((provider) => provider.provider), ["codex/terra", "kimi/k3", "claude-code/opus"]);
      const [sameProfile, polluted, normal] = result.providers;
      assert.equal(sameProfile.status, "completed");
      assert.equal(polluted.status, "failed"); assert.equal(polluted.output, null); assert.equal(polluted.error.code, "PUBLIC_RESULT_INVALID"); assert.equal(polluted.continuable, false);
      assert.equal(normal.status, "completed"); assert.equal(normal.output, "claude opinion"); assert.equal(result.outcome, "completed");
      const publicResult = JSON.stringify(result); assert.equal(publicResult.includes("/private/provider-secret"), false); assert.equal(publicResult.includes(runtime), false);
      const rawDirectory = path.join(runtime, result.runtime_id, "raw", "kimi%2Fk3"); const raw = fs.readdirSync(rawDirectory).find((name) => name.endsWith(".stdout"));
      assert.ok(fs.readFileSync(path.join(rawDirectory, raw), "utf8").includes(output), "private raw evidence is preserved for diagnosis");
    } finally { delete process.env.THIRD_REVIEW_FAKE_KIMI_OUTPUT; }
  }
});

test("workflowhub result v2 repairs a private-path review through the adapter's same-session rewrite", async () => {
  const attachmentsRoot = source(); const runtime = temp(); const value = config(runtime, [["kimi/k3"]], attachmentsRoot);
  value.providers["kimi/k3"].env = ["THIRD_REVIEW_FAKE_KIMI_OUTPUT", "THIRD_REVIEW_FAKE_KIMI_REWRITE_OUTPUT"];
  process.env.THIRD_REVIEW_FAKE_KIMI_OUTPUT = "{\"verdict\":\"pass\",\"summary\":\"leaked /private/provider-secret\",\"findings\":[]}";
  process.env.THIRD_REVIEW_FAKE_KIMI_REWRITE_OUTPUT = "{\"verdict\":\"pass\",\"summary\":\"review completed without host paths\",\"findings\":[]}";
  try {
    const result = await new Broker(value).run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v2", provider_allowlist: ["kimi/k3"], prompt: "review", continuation: null, attachments: packet(attachmentsRoot) });
    const provider = result.providers[0];
    assert.equal(provider.status, "completed");
    assert.equal(JSON.parse(provider.output).verdict, "pass");
    assert.equal(provider.public_output_rewrite_count, undefined);
    assert.equal(JSON.stringify(result).includes("/private/provider-secret"), false);
  } finally {
    delete process.env.THIRD_REVIEW_FAKE_KIMI_OUTPUT;
    delete process.env.THIRD_REVIEW_FAKE_KIMI_REWRITE_OUTPUT;
  }
});

test("workflowhub result v2 allows ordinary slash-separated review terminology", async () => {
  const attachmentsRoot = source(); const runtime = temp(); const value = config(runtime, [["kimi/k3"]], attachmentsRoot);
  value.providers["kimi/k3"].env = ["THIRD_REVIEW_FAKE_KIMI_OUTPUT"];
  process.env.THIRD_REVIEW_FAKE_KIMI_OUTPUT = "材料矩阵/map/AC 已逐项覆盖";
  try {
    const result = await new Broker(value).run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v2", provider_allowlist: ["kimi/k3"], prompt: "review", continuation: null, attachments: packet(attachmentsRoot) });
    assert.equal(result.providers[0].status, "completed"); assert.equal(result.providers[0].output, "材料矩阵/map/AC 已逐项覆盖");
  } finally { delete process.env.THIRD_REVIEW_FAKE_KIMI_OUTPUT; }
});

test("workflowhub result v2 isolates projection-field path violations without rejecting the candidate group", async () => {
  const cases = [
    { name: "profile model", configure: (value) => { value.providers["kimi/k3"].model = "model=/private/profile"; }, polluted: "kimi/k3", normal: "claude-code/opus", marker: "/private/profile" },
    { name: "session", configure: (value) => { value.providers["claude-code/opus"].model = "emit-private-session"; }, polluted: "claude-code/opus", normal: "kimi/k3", marker: "/private/session" },
    { name: "usage", configure: (value) => { value.providers["claude-code/opus"].model = "emit-private-usage"; }, polluted: "claude-code/opus", normal: "kimi/k3", marker: "/private/usage" },
  ];
  for (const scenario of cases) {
    const attachmentsRoot = source(); const runtime = temp(); const value = config(runtime, [["codex/terra", "kimi/k3", "claude-code/opus"]], attachmentsRoot); scenario.configure(value);
    const result = await new Broker(value).run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v2", provider_allowlist: ["codex/terra", "kimi/k3", "claude-code/opus"], prompt: "review", continuation: null, attachments: packet(attachmentsRoot) });
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(result)), scenario.name);
    const providers = Object.fromEntries(result.providers.map((provider) => [provider.provider, provider]));
    assert.equal(providers["codex/terra"].status, "completed", scenario.name);
    assert.equal(providers[scenario.polluted].status, "failed", scenario.name); assert.equal(providers[scenario.polluted].error.code, "PUBLIC_RESULT_INVALID", scenario.name); assert.equal(providers[scenario.polluted].output, null, scenario.name); assert.equal(providers[scenario.polluted].continuable, false, scenario.name);
    assert.equal(providers[scenario.normal].status, "completed", scenario.name); assert.equal(result.outcome, "completed", scenario.name); assert.equal(JSON.stringify(result).includes(scenario.marker), false, scenario.name);
  }
});

test("workflowhub result v3 isolates projection-field path violations without rejecting the candidate group", async () => {
  const cases = [
    { name: "profile model", configure: (value) => { value.providers["kimi/k3"].model = "model=/private/profile"; }, polluted: "kimi/k3", normal: "claude-code/opus", marker: "/private/profile" },
    { name: "session", configure: (value) => { value.providers["claude-code/opus"].model = "emit-private-session"; }, polluted: "claude-code/opus", normal: "kimi/k3", marker: "/private/session" },
    { name: "usage", configure: (value) => { value.providers["claude-code/opus"].model = "emit-private-usage"; }, polluted: "claude-code/opus", normal: "kimi/k3", marker: "/private/usage" },
  ];
  for (const scenario of cases) {
    const attachmentsRoot = source(); const runtime = temp(); const value = config(runtime, [["codex/terra", "kimi/k3", "claude-code/opus"]], attachmentsRoot); scenario.configure(value);
    const result = await new Broker(value).run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v3", provider_allowlist: ["codex/terra", "kimi/k3", "claude-code/opus"], prompt: "review", continuation: null, attachments: packet(attachmentsRoot) });
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(result)), scenario.name);
    const providers = Object.fromEntries(result.providers.map((provider) => [provider.identity.provider, provider]));
    assert.equal(providers["codex/terra"].status, "completed", scenario.name);
    assert.equal(providers[scenario.polluted].status, "failed", scenario.name); assert.equal(providers[scenario.polluted].error.code, "PUBLIC_RESULT_INVALID", scenario.name); assert.equal(providers[scenario.polluted].error.cause_code, "PUBLIC_RESULT_INVALID", scenario.name); assert.equal(providers[scenario.polluted].output, null, scenario.name); assert.equal(providers[scenario.polluted].continuable, false, scenario.name);
    assert.equal(providers[scenario.normal].status, "completed", scenario.name); assert.equal(result.outcome, "partial", scenario.name); assert.equal(JSON.stringify(result).includes(scenario.marker), false, scenario.name);
  }
});

test("workflowhub result v3 rejects private paths in provider review output", async () => {
  const attachmentsRoot = source(); const runtime = temp(); const value = config(runtime, [["kimi/k3", "claude-code/opus"]], attachmentsRoot);
  value.providers["kimi/k3"].env = ["THIRD_REVIEW_FAKE_KIMI_OUTPUT"];
  process.env.THIRD_REVIEW_FAKE_KIMI_OUTPUT = "finding=/data/provider-secret";
  try {
    const result = await new Broker(value).run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v3", provider_allowlist: ["kimi/k3", "claude-code/opus"], prompt: "review", continuation: null, attachments: packet(attachmentsRoot) });
    const providers = Object.fromEntries(result.providers.map((provider) => [provider.identity.provider, provider]));
    assert.equal(providers["kimi/k3"].status, "failed"); assert.equal(providers["kimi/k3"].error.code, "PUBLIC_RESULT_INVALID"); assert.equal(providers["kimi/k3"].output, null);
    assert.equal(providers["claude-code/opus"].status, "completed"); assert.equal(result.outcome, "partial"); assert.equal(JSON.stringify(result).includes("/data/provider-secret"), false);
  } finally { delete process.env.THIRD_REVIEW_FAKE_KIMI_OUTPUT; }
});

test("workflowhub result v3 isolates a private output path from a structured provider violation", async () => {
  const attachmentsRoot = source(); const runtime = temp(); const value = config(runtime, [["kimi/k3", "claude-code/opus"]], attachmentsRoot);
  value.providers["kimi/k3"].env = ["THIRD_REVIEW_FAKE_KIMI_OUTPUT"];
  process.env.THIRD_REVIEW_FAKE_KIMI_OUTPUT = "finding=/data/provider-secret";
  value.providers["claude-code/opus"].model = "emit-private-session";
  try {
    const result = await new Broker(value).run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v3", provider_allowlist: ["kimi/k3", "claude-code/opus"], prompt: "review", continuation: null, attachments: packet(attachmentsRoot) });
    assert.equal(result.outcome, "unavailable"); assert.equal(result.providers.length, 2);
    assert.equal(result.providers.find((provider) => provider.identity.provider === "kimi/k3").status, "failed");
    assert.equal(result.providers.find((provider) => provider.identity.provider === "kimi/k3").output, null);
    assert.equal(result.providers.find((provider) => provider.identity.provider === "claude-code/opus").error.code, "PUBLIC_RESULT_INVALID");
    assert.equal(JSON.stringify(result).includes("/data/provider-secret"), false); assert.equal(JSON.stringify(result).includes("/private/session"), false);
  } finally { delete process.env.THIRD_REVIEW_FAKE_KIMI_OUTPUT; }
});

test("workflowhub result v3 isolates an empty Kimi TextPart without discarding another provider review", async () => {
  const attachmentsRoot = source(); const runtime = temp(); const value = config(runtime, [["kimi/k3", "claude-code/opus"]], attachmentsRoot);
  value.providers["kimi/k3"].env = ["THIRD_REVIEW_FAKE_KIMI_OUTPUT"];
  process.env.THIRD_REVIEW_FAKE_KIMI_OUTPUT = "";
  try {
    const result = await new Broker(value).run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v3", provider_allowlist: ["kimi/k3", "claude-code/opus"], prompt: "review", continuation: null, attachments: packet(attachmentsRoot) });
    const providers = Object.fromEntries(result.providers.map((provider) => [provider.identity.provider, provider]));
    assert.equal(providers["kimi/k3"].status, "failed"); assert.equal(providers["kimi/k3"].error.code, "PROVIDER_OUTPUT_INVALID"); assert.equal(providers["kimi/k3"].output, null);
    assert.equal(providers["claude-code/opus"].status, "completed"); assert.equal(providers["claude-code/opus"].output, "claude opinion"); assert.equal(result.outcome, "partial");
  } finally { delete process.env.THIRD_REVIEW_FAKE_KIMI_OUTPUT; }
});

test("workflowhub result v1 turns a private provider output into a safe provider failure", async () => {
  const attachmentsRoot = source(); const runtime = temp(); const value = config(runtime, [["kimi/k3"]], attachmentsRoot); value.providers["kimi/k3"].env = ["THIRD_REVIEW_FAKE_KIMI_OUTPUT"];
  process.env.THIRD_REVIEW_FAKE_KIMI_OUTPUT = "finding file://host/private/v1-output";
  try {
    const result = await new Broker(value).run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v1", provider_allowlist: ["kimi/k3"], prompt: "review", continuation: null, attachments: packet(attachmentsRoot) }); const provider = result.providers[0];
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(result)));
    assert.equal(provider.status, "failed"); assert.equal(provider.error.code, "PUBLIC_RESULT_INVALID"); assert.equal(provider.output, null); assert.equal(JSON.stringify(result).includes("file://host/private/v1-output"), false);
  } finally { delete process.env.THIRD_REVIEW_FAKE_KIMI_OUTPUT; }
});

test("workflowhub result v2 runs every configured profile in initial and continuation groups", async () => {
  const attachmentsRoot = source(); const runtime = temp(); const broker = new Broker(config(runtime, [["kimi/k3", "kimi/coding", "opencode/glm"]], attachmentsRoot));
  const request = { version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v2", provider_allowlist: ["kimi/k3", "kimi/coding", "opencode/glm"], prompt: "review", attachments: packet(attachmentsRoot) };
  const initial = await broker.run({ ...request, continuation: null });
  assert.deepEqual(initial.providers.map((provider) => provider.provider), request.provider_allowlist);
  assert.equal(initial.providers[0].status, "completed");
  assert.equal(initial.providers[1].status, "completed");
  assert.equal(initial.providers[2].status, "completed");
  let state = JSON.parse(fs.readFileSync(path.join(runtime, initial.runtime_id, "state.json"), "utf8"));
  assert.equal(state.providers["kimi/coding"].status, "completed");
  assert.equal(fs.existsSync(path.join(runtime, initial.runtime_id, "workspace", "kimi%2Fcoding")), true);

  const continuation = await broker.run({ ...request, prompt: "follow up", continuation: { runtime_id: initial.runtime_id }, attachments: packet(attachmentsRoot) });
  assert.deepEqual(continuation.providers.map((provider) => provider.provider), request.provider_allowlist);
  assert.equal(continuation.providers[0].status, "completed");
  assert.equal(continuation.providers[1].status, "completed");
  assert.equal(continuation.providers[2].status, "completed");
  state = JSON.parse(fs.readFileSync(path.join(runtime, initial.runtime_id, "state.json"), "utf8"));
  assert.equal(state.providers["kimi/coding"].status, "completed");
  assert.equal(fs.existsSync(path.join(runtime, initial.runtime_id, "workspace", "kimi%2Fcoding")), true);
});

test("workflowhub result v1 keeps its existing same-adapter profile routing", async () => {
  const attachmentsRoot = source(); const broker = new Broker(config(temp(), [["kimi/k3", "kimi/coding"]], attachmentsRoot));
  const result = await broker.run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v1", provider_allowlist: ["kimi/k3", "kimi/coding"], prompt: "review", continuation: null, attachments: packet(attachmentsRoot) });
  assert.deepEqual(result.providers.map((provider) => provider.provider), ["kimi/k3", "kimi/coding"]);
  assert.ok(result.providers.every((provider) => provider.status === "completed"));
});

test("workflowhub result accepts a complete direction bundle without the legacy triad", async () => {
  const attachmentsRoot = simpleSource(); const broker = new Broker(config(temp(), [["kimi"]], attachmentsRoot)); const attachments = simplePacket(attachmentsRoot);
  const result = await broker.run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v1", prompt: "review", continuation: null, attachments });
  assert.equal(result.providers[0].status, "completed"); assert.equal(result.providers[0].material_id, canonicalWorkflowHubMaterialId(attachments.manifest.entries.map(({ destination: target, size, sha256, embed }) => ({ target, size, sha256, embed }))));
});

test("workflowhub failed result keeps material identity without inventing semantic output", async () => {
  const attachmentsRoot = source(); const runtime = temp(); const value = config(runtime, [["kimi"]], attachmentsRoot); value.providers.kimi.command = path.join(runtime, "missing-provider");
  const result = await new Broker(value).run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v1", prompt: "review", continuation: null, attachments: packet(attachmentsRoot) });
  const provider = result.providers[0]; assert.equal(provider.result_protocol, "workflowhub-result.v1"); assert.match(provider.material_id, /^[a-f0-9]{64}$/);
  assert.equal(provider.status, "failed"); assert.equal(provider.session_id, null); assert.equal(provider.output, null); assert.equal(provider.error.code, "PUBLIC_RESULT_INVALID"); assert.equal(JSON.stringify(result).includes(runtime), false);
});

test("unknown workflowhub result protocol fails before runtime or provider creation", async () => {
  const attachmentsRoot = source(); const runtime = temp(); const broker = new Broker(config(runtime, [["kimi"]], attachmentsRoot));
  await assert.rejects(() => broker.run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v9", prompt: "review", continuation: null, attachments: packet(attachmentsRoot) }), { code: "PROTOCOL_INCOMPATIBLE" });
  assert.deepEqual(fs.readdirSync(runtime), []);
});

test("workflowhub continuation sends a complete new bundle through the same native session", async () => {
  const firstRoot = source("file_only", "FIRST\n"); const secondRoot = source("file_only", "SECOND\n"); const runtime = temp();
  const value = config(runtime, [["kimi"]], firstRoot); value.attachment_roots.push({ root: secondRoot, sources: ["skills", "contracts", "review-packet.v1.json", "changes.diff", "manifest.json"] }); const broker = new Broker(value);
  const first = await broker.run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v1", prompt: "R1", continuation: null, attachments: packet(firstRoot) });
  const second = await broker.run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v1", prompt: "R2", continuation: { runtime_id: first.runtime_id }, attachments: packet(secondRoot) });
  assert.equal(second.providers[0].status, "completed"); assert.equal(second.providers[0].session_id, first.providers[0].session_id); assert.notEqual(second.providers[0].material_id, first.providers[0].material_id);
});

test("workflowhub continuation without a session names the requested provider", async () => {
  const attachmentsRoot = simpleSource(); const runtime = temp(); const value = config(runtime, [["opencode"]], attachmentsRoot); value.providers.opencode.command = path.join(runtime, "missing-provider"); const broker = new Broker(value); const attachments = simplePacket(attachmentsRoot);
  const first = await broker.run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v1", provider_allowlist: ["opencode"], prompt: "R1", continuation: null, attachments });
  const second = await broker.run({ version: 4, host_provider: "codex", required_result_protocol: "workflowhub-result.v1", provider_allowlist: ["opencode"], prompt: "R2", continuation: { runtime_id: first.runtime_id }, attachments });
  assert.equal(second.providers[0].provider, "opencode"); assert.equal(second.providers[0].error.code, "NO_CONTINUABLE_SESSION");
});

test("doctor and default run follow configured tier order", async () => {
  const root = source(); const value = config(temp(), [["opencode"], ["kimi"]], root); const broker = new Broker(value);
  const doctor = await broker.doctor({ attachmentRoot: root }); assert.deepEqual(doctor.providers.map((item) => item.provider), ["opencode", "kimi"]);
  const result = await broker.run({ version: 4, host_provider: "codex", prompt: "review", continuation: null, attachments: packet(root, "file_only", false) });
  assert.deepEqual(result.providers.map((item) => item.provider), ["opencode"]);
});

test("doctor attachment probe copies and locks a private bundle without touching the packet root", () => {
  const runtime = temp(); const packetRoot = source(); const before = fs.readdirSync(packetRoot);
  for (const provider of ["kimi", "opencode"]) probeAttachmentWorkspace(runtime, provider, 1);
  assert.deepEqual(fs.readdirSync(packetRoot), before);
  assert.equal(fs.readdirSync(runtime).some((name) => name.startsWith("attachment-probe-")), false);
  const file = path.join(runtime, "not-a-directory"); fs.writeFileSync(file, "x");
  assert.throws(() => probeAttachmentWorkspace(file, "kimi", 1), { code: "ATTACHMENT_PROBE_FAILED" });
});

test("attachment validation rejects unsafe roots, sources, traversal, links, and hashes without a size gate", () => {
  const root = source(); const runtime = temp(); const allow = [{ root, sources: ["skills", "review-packet.v1.json", "changes.diff", "manifest.json"] }]; const input = packet(root);
  const prepared = prepareAttachments(input, runtime, "kimi", 10_000, allow);
  assert.equal(fs.readFileSync(path.join(prepared.cwd, "skills/review/SKILL.md"), "utf8"), "lens");
  assert.equal(fs.statSync(prepared.cwd).mode & 0o777, 0o500);
  assert.throws(() => prepareAttachments({ ...input, root: temp() }, temp(), "kimi", 10_000, allow), { code: "ATTACHMENT_ROOT_FORBIDDEN" });
  assert.throws(() => prepareAttachments({ ...input, manifest: { ...input.manifest, entries: [{ ...input.manifest.entries[0], source: "README.md" }] } }, temp(), "kimi", 10_000, allow), { code: "ATTACHMENT_SOURCE_FORBIDDEN" });
  assert.throws(() => prepareAttachments({ ...input, manifest: { ...input.manifest, entries: [{ ...input.manifest.entries[0], destination: "../escape" }] } }, temp(), "kimi", 10_000, allow), { code: "ATTACHMENT_INVALID" });
  assert.throws(() => prepareAttachments({ ...input, manifest: { ...input.manifest, entries: [{ ...input.manifest.entries[0], sha256: sha("bad!") }] } }, temp(), "kimi", 10_000, allow), { code: "ATTACHMENT_HASH_MISMATCH" });
  assert.doesNotThrow(() => prepareAttachments(input, temp(), "kimi", 3, allow));
  fs.symlinkSync("SKILL.md", path.join(root, "skills/review/link"));
  const linked = { ...input, manifest: { ...input.manifest, entries: [{ ...input.manifest.entries[0], source: "skills/review/link" }] } };
  assert.throws(() => prepareAttachments(linked, temp(), "kimi", 10_000, allow), { code: "ATTACHMENT_INVALID" });
});

test("attachment validation rejects duplicate destinations and hard links", () => {
  const root = source(); const allow = [{ root, sources: ["skills"] }]; const input = packet(root); const duplicate = { ...input, manifest: { ...input.manifest, entries: [input.manifest.entries[0], { ...input.manifest.entries[0], source: "skills/review/SKILL.md" }] } };
  assert.throws(() => prepareAttachments(duplicate, temp(), "kimi", 100, allow), { code: "ATTACHMENT_INVALID" });
  fs.linkSync(path.join(root, "skills/review/SKILL.md"), path.join(root, "skills/review/hard.md")); const hard = { ...input, manifest: { ...input.manifest, entries: [{ ...input.manifest.entries[0], source: "skills/review/hard.md" }] } };
  assert.throws(() => prepareAttachments(hard, temp(), "kimi", 100, allow), { code: "ATTACHMENT_INVALID" });
});

test("attachment validation does not render always_embed material before delivery planning", () => {
  const root = temp(); const contents = "x".repeat(512 * 1024); fs.mkdirSync(path.join(root, "skills")); fs.writeFileSync(path.join(root, "skills", "large.md"), contents); const input = { root, delivery: "always_embed", manifest: { version: 1, bundle_id: "large", entries: [{ source: "skills/large.md", destination: "skills/large.md", size: Buffer.byteLength(contents), sha256: sha(contents), embed: true }] } };
  assert.doesNotThrow(() => validateAttachments(input, 1024 * 1024, [{ root, sources: ["skills"] }]));
});

test("file_only runs Kimi and OpenCode from frozen provider-private workspaces", async () => {
  const attachmentsRoot = source(); const runtime = temp(); const broker = new Broker(config(runtime, [["kimi", "opencode"]], attachmentsRoot));
  const result = await broker.run({ version: 4, host_provider: "codex", prompt: "review", continuation: null, provider_allowlist: ["kimi", "opencode"], attachments: packet(attachmentsRoot, "file_only", false) });
  assert.equal(result.providers.find((item) => item.provider === "kimi").status, "completed");
  const openCode = result.providers.find((item) => item.provider === "opencode"); assert.equal(openCode.status, "completed"); assert.equal(openCode.delivery_used, "file_only");
  assert.equal(fs.existsSync(path.join(runtime, result.runtime_id, "workspace/kimi/skills/review/SKILL.md")), true);
  const kimiWork = path.join(runtime, result.runtime_id, "work/kimi"); const kimiBundle = path.join(kimiWork, "bundle");
  assert.equal(fs.statSync(kimiWork).mode & 0o200, 0o200);
  assert.equal(fs.statSync(kimiBundle).mode & 0o222, 0);
  assert.equal(fs.statSync(path.join(kimiBundle, "changes.diff")).mode & 0o222, 0);
  assert.equal(fs.existsSync(path.join(runtime, result.runtime_id, "embed/opencode")), false);
});

test("first-round provider_allowlist is a strict route intersection", async () => {
  const attachmentsRoot = source(); const runtime = temp(); const broker = new Broker(config(runtime, [["kimi", "opencode"]], attachmentsRoot));
  const result = await broker.run({ version: 4, host_provider: "codex", prompt: "review", continuation: null, provider_allowlist: ["kimi"], attachments: packet(attachmentsRoot, "file_only", false) });
  assert.deepEqual(result.providers.map((item) => item.provider), ["kimi"]);
  assert.equal(result.providers[0].delivery_used, "file_only");
});

test("continuation intersects its frozen allowlist with completed sessions only", async () => {
  const runtime = temp(); const broker = new Broker(config(runtime, [["kimi", "opencode"]]));
  const first = await broker.run({ version: 4, host_provider: "codex", prompt: "review", continuation: null, provider_allowlist: ["kimi", "opencode"] });
  const statePath = path.join(runtime, first.runtime_id, "state.json"); const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  state.providers.opencode.status = "running"; fs.writeFileSync(statePath, `${JSON.stringify(state)}\n`);
  const resumed = await broker.run({ version: 4, host_provider: "codex", prompt: "delta", continuation: { runtime_id: first.runtime_id }, provider_allowlist: ["kimi", "opencode"] });
  assert.deepEqual(resumed.providers.map((item) => item.provider), ["kimi"]);
  assert.equal(resumed.providers[0].session_id, first.providers.find((item) => item.provider === "kimi").session_id);
});

test("Kimi file_only rejects an incomplete review triad before provider execution", async () => {
  const attachmentsRoot = source(); const extra = ["contracts/review.md", "CONTRACT"]; fs.mkdirSync(path.join(attachmentsRoot, "contracts"), { recursive: true }); fs.writeFileSync(path.join(attachmentsRoot, extra[0]), extra[1]); const included = ["review-packet.v1.json", "changes.diff", "skills/review/SKILL.md", extra[0]]; const inner = JSON.parse(fs.readFileSync(path.join(attachmentsRoot, "manifest.json"), "utf8")); inner.attachments = included.map((destination) => { const contents = fs.readFileSync(path.join(attachmentsRoot, destination)); return { destination, size: contents.length, sha256: sha(contents) }; }); const outer = [...inner.attachments.map(({ destination: target, sha256, size }) => ({ target, sha256, size, embed: false })), { target: "manifest.json", sha256: "0".repeat(64), size: 0, embed: false }]; inner.delivery_manifest_hash = canonicalDeliveryManifestHash("complete", outer, "file_only"); inner.inner_manifest_hash = canonicalInnerManifestHash(inner); fs.writeFileSync(path.join(attachmentsRoot, "manifest.json"), `${JSON.stringify(inner)}\n`); const files = [...included, "manifest.json"].map((name) => [name, fs.readFileSync(path.join(attachmentsRoot, name), "utf8")]); const manifest = { version: 1, bundle_id: "complete", entries: files.map(([name, contents]) => ({ source: name, destination: name, size: Buffer.byteLength(contents), sha256: sha(contents), embed: false })) }; const runtime = temp(); const broker = new Broker(config(runtime, [["kimi"]], attachmentsRoot));
  await assert.rejects(() => broker.run({ version: 4, host_provider: "codex", prompt: "review", continuation: null, attachments: { root: attachmentsRoot, delivery: "file_only", manifest } }), { code: "MATERIAL_INCOMPLETE" });
});

test("always_embed rejects a single-file pseudo packet", async () => {
  const attachmentsRoot = temp(); const contents = `ATTACHMENT_HEAD\n${"x".repeat(80 * 1024)}\nATTACHMENT_TAIL`; fs.mkdirSync(path.join(attachmentsRoot, "skills")); fs.writeFileSync(path.join(attachmentsRoot, "skills", "packet.md"), contents); const runtime = temp(); const value = config(runtime, [["opencode"]], attachmentsRoot); value.runtime.max_prompt_bytes = 100_000; value.runtime.max_attachment_bytes = 100_000; value.providers.opencode.command = stdinOpenCode; const broker = new Broker(value); const input = { root: attachmentsRoot, delivery: "always_embed", manifest: { version: 1, bundle_id: "large-packet", entries: [{ source: "skills/packet.md", destination: "review-packet.v1.json", size: Buffer.byteLength(contents), sha256: sha(contents), embed: true }] } };
  await assert.rejects(() => broker.run({ version: 4, host_provider: "codex", prompt: "PROMPT_HEAD review the complete packet", continuation: null, attachments: input }), { code: "MATERIAL_INCOMPLETE" });
});

test("OpenCode stdin delivery ignores legacy max_prompt_bytes", async () => {
  const attachmentsRoot = source("always_embed"); const runtime = temp(); const value = config(runtime, [["opencode"]], attachmentsRoot); value.runtime.max_prompt_bytes = 20; const broker = new Broker(value);
  const result = await broker.run({ version: 4, host_provider: "codex", prompt: "review", continuation: null, attachments: packet(attachmentsRoot, "always_embed", true) }); assert.equal(result.providers[0].status, "completed"); assert.equal(result.providers[0].delivery_used, "always_embed");
  const privateState = JSON.parse(fs.readFileSync(path.join(runtime, result.runtime_id, "state.json"), "utf8")); assert.equal(privateState.providers.opencode.delivery_used, "always_embed");
});

test("an always_embed continuation uses the small delta prompt and preserves its session", async () => {
  const attachmentsRoot = source("always_embed"); const runtime = temp();
  const first = await new Broker(config(runtime, [["opencode"]], attachmentsRoot)).run({ version: 4, host_provider: "codex", prompt: "first", continuation: null, attachments: packet(attachmentsRoot, "always_embed", true) });
  const constrained = config(runtime, [["opencode"]], attachmentsRoot); constrained.runtime.max_prompt_bytes = 20;
  await assert.rejects(() => new Broker(constrained).run({ version: 4, host_provider: "codex", prompt: "continue", continuation: { runtime_id: first.runtime_id } }), { code: "MATERIAL_INCOMPLETE" });
});

test("file_only rejects bundles without the required triad", async () => {
  const attachmentsRoot = source(); const runtime = temp(); const broker = new Broker(config(runtime, [["opencode"]], attachmentsRoot));
  await assert.rejects(() => broker.run({ version: 4, host_provider: "codex", prompt: "review", continuation: null, attachments: { root: attachmentsRoot, delivery: "file_only", manifest: { version: 1, bundle_id: "incomplete", entries: [packet(attachmentsRoot).manifest.entries[0]] } } }), { code: "MATERIAL_INCOMPLETE" }); assert.deepEqual(fs.readdirSync(runtime), []);
});

test("file_only Kimi creates a native continuation session", async () => {
  const attachmentsRoot = source(); const runtime = temp(); const broker = new Broker(config(runtime, [["kimi"]], attachmentsRoot));
  const first = await broker.run({ version: 4, host_provider: "codex", prompt: "review", continuation: null, attachments: packet(attachmentsRoot) });
  assert.equal(first.providers[0].status, "completed");
  assert.equal(typeof first.providers[0].session_id, "string");
});

test("raw output is private and public status does not leak refs, output, sessions or absolute paths", async () => {
  const runtime = temp(); const broker = new Broker(config(runtime, [["kimi"]])); const result = await broker.run({ version: 4, host_provider: "codex", prompt: "review", continuation: null });
  const privateState = JSON.parse(fs.readFileSync(path.join(runtime, result.runtime_id, "state.json"), "utf8"));
  assert.equal(typeof privateState.providers.kimi.raw_stdout_ref, "string");
  assert.equal(typeof privateState.providers.kimi.raw_stderr_ref, "string");
  assert.equal(fs.statSync(path.join(runtime, result.runtime_id, privateState.providers.kimi.raw_stdout_ref)).mode & 0o777, 0o400);
  assert.doesNotMatch(JSON.stringify(result), /raw_stdout_ref|raw_stderr_ref/);
  const text = JSON.stringify(broker.status(result.runtime_id)); assert.doesNotMatch(text, /session_id|raw_stdout_ref|raw_stderr_ref|kimi opinion/); assert.equal(text.includes(runtime), false);
});

test("cancel source is persisted and projected on CANCELLED error", async () => {
  const runtime = temp(); const value = config(runtime, [["kimi"]]); value.providers.kimi.command = slow; const broker = new Broker(value);
  const running = broker.run({ version: 4, host_provider: "codex", prompt: "review", continuation: null }); await new Promise((resolve) => setTimeout(resolve, 80));
  const runtimeId = fs.readdirSync(runtime).find((name) => /^[0-9a-f-]{36}$/i.test(name)); assert.deepEqual(broker.cancel(runtimeId, "kimi", "workflow_shutdown"), { cancelled: true, source: "workflow_shutdown" });
  const result = await running; assert.equal(result.providers[0].error.source, "workflow_shutdown"); assert.equal(result.providers[0].cancellation_source, "workflow_shutdown");
});

test("cancellation provenance is limited to the documented enum", () => {
  const runtime = temp(); const state = createRuntime(runtime, 24, "codex");
  assert.throws(() => requestCancellation(runtime, state.runtime_id, "kimi", "workflowhub"), { code: "REQUEST_INVALID" });
  for (const source of ["user", "workflow_shutdown", "broker_idle_timeout", "broker_max_duration"]) {
    assert.doesNotThrow(() => requestCancellation(runtime, state.runtime_id, "kimi", source));
  }
});

test("a tampered cancellation marker remains explicit instead of defaulting to user", () => {
  const runtime = temp(); const state = createRuntime(runtime, 24, "codex");
  fs.writeFileSync(path.join(runtime, state.runtime_id, ".cancel-kimi"), JSON.stringify({ version: 1, source: "forged" }));
  assert.equal(cancellationRequested(runtime, state.runtime_id, "kimi"), true);
  assert.equal(cancellationSource(runtime, state.runtime_id, "kimi"), "invalid");
});
