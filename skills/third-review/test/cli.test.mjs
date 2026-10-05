import { fileURLToPath as migratedFilePath } from "node:url";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { test } from "vitest";

test("CLI rejects the obsolete host-provider argument", () => {
  const cli = migratedFilePath(new URL("../scripts/3rd-review.mjs", import.meta.url));
  const result = spawnSync(process.execPath, [cli, "run", "--host-provider=codex"], { encoding: "utf8" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /unsupported argument for run/);
});

test("CLI accepts attachment flags on run and source on cancel", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-cli-flags-")); const cli = migratedFilePath(new URL("../scripts/3rd-review.mjs", import.meta.url)); const config = path.join(root, "config.json");
  fs.writeFileSync(config, JSON.stringify({ version: 4, runtime: { root: path.join(root, "runtime") }, tiers: [["kimi"]], providers: { kimi: { command: migratedFilePath(new URL("../test/fake-cli.mjs", import.meta.url)), auth: { type: "native" } } } }));
  const run = spawnSync(process.execPath, [cli, "run", `--config=${config}`, "--attachments=manifest.json", "--attachments-root=/tmp", "--attachment-delivery=file_only"], { encoding: "utf8" });
  assert.equal(run.status, 2); assert.doesNotMatch(run.stderr, /unsupported argument for run/); assert.match(run.stderr, /--request is required/);
  const cancel = spawnSync(process.execPath, [cli, "cancel", "--source=workflowhub"], { encoding: "utf8" });
  assert.equal(cancel.status, 2); assert.doesNotMatch(cancel.stderr, /unsupported argument for cancel/);
});

test("CLI requires all three attachment flags together", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-cli-attachments-")); const cli = migratedFilePath(new URL("../scripts/3rd-review.mjs", import.meta.url)); const config = path.join(root, "config.json"); const request = path.join(root, "request.json");
  fs.writeFileSync(config, JSON.stringify({ version: 4, runtime: { root: path.join(root, "runtime") }, tiers: [["kimi"]], providers: { kimi: { command: migratedFilePath(new URL("../test/fake-cli.mjs", import.meta.url)), auth: { type: "native" } } } })); fs.writeFileSync(request, JSON.stringify({ version: 4, host_provider: "codex", prompt: "review", continuation: null }));
  const result = spawnSync(process.execPath, [cli, "run", `--config=${config}`, `--request=${request}`, "--attachments=manifest.json"], { encoding: "utf8" });
  assert.equal(result.status, 2); assert.match(result.stderr, /required together/);
});

test("CLI doctor verifies the supplied attachment root against configuration", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-cli-doctor-")); const cli = migratedFilePath(new URL("../scripts/3rd-review.mjs", import.meta.url)); const config = path.join(root, "config.json");
  fs.writeFileSync(config, JSON.stringify({ version: 4, runtime: { root: path.join(root, "runtime") }, attachment_roots: [{ root, sources: ["packets"] }], tiers: [["kimi"]], providers: { kimi: { command: migratedFilePath(new URL("../test/fake-cli.mjs", import.meta.url)), auth: { type: "native" } } } }));
  const result = spawnSync(process.execPath, [cli, "doctor", `--config=${config}`, `--attachments-root=${root}`], { encoding: "utf8" });
  assert.equal(result.status, 0); const output = JSON.parse(result.stdout); assert.deepEqual(output.capabilities, { attachments: true, cancel_source: true }); assert.deepEqual(output.material_protocol, { version: 5, delivery_attestation: "sealed-exact-copy.v1" }); assert.deepEqual(output.attachment_root, { status: "ready" });
});

test("CLI maps completed semantic output, provider failure, and preflight to 0, 3, and 2", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-cli-outcomes-")); const cli = migratedFilePath(new URL("../scripts/3rd-review.mjs", import.meta.url));
  const request = path.join(root, "request.json"); fs.writeFileSync(request, JSON.stringify({ version: 4, host_provider: "codex", prompt: "revise_required", continuation: null }));
  const config = (command, name) => { const file = path.join(root, name); fs.writeFileSync(file, JSON.stringify({ version: 4, runtime: { root: path.join(root, `runtime-${name}`) }, tiers: [["opencode"]], providers: { opencode: { command, auth: { type: "native" } } } })); return file; };
  const completed = spawnSync(process.execPath, [cli, "run", `--config=${config(migratedFilePath(new URL("../test/fake-cli.mjs", import.meta.url)), "ok.json")}`, `--request=${request}`], { encoding: "utf8" });
  assert.equal(completed.status, 0, completed.stderr); assert.equal(JSON.parse(completed.stdout).outcome, "completed");
  const failed = spawnSync(process.execPath, [cli, "run", `--config=${config("/does/not/exist", "failed.json")}`, `--request=${request}`], { encoding: "utf8" });
  assert.equal(failed.status, 3, failed.stderr); assert.equal(JSON.parse(failed.stdout).outcome, "unavailable");
  const preflight = spawnSync(process.execPath, [cli, "run", `--config=${config(migratedFilePath(new URL("../test/fake-cli.mjs", import.meta.url)), "preflight.json")}`], { encoding: "utf8" });
  assert.equal(preflight.status, 2); assert.match(preflight.stderr, /--request is required/);
});
