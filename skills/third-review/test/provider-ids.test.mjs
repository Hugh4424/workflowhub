import { fileURLToPath as migratedFilePath } from "node:url";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";

import { adapter } from "../lib/adapters/index.mjs";
import { Broker } from "../lib/broker.mjs";
import { validateConfig } from "../lib/config.mjs";
import { adapterForProviderId, isSupportedProviderId, parseProviderId, providerRuntimeKey } from "../lib/provider-ids.mjs";

const fake = migratedFilePath(new URL("../test/fake-cli.mjs", import.meta.url));
function config(root) {
  return validateConfig({ version: 4, runtime: { root, ttl_hours: 24, max_prompt_bytes: 10000, max_output_bytes: 100000, liveness_interval_ms: 5 }, tiers: [["kimi"]], providers: { kimi: { enabled: true, command: fake, model: null, effort: null, thinking: null, auth: { type: "native" }, env: [] } } });
}
function temp() { return fs.mkdtempSync(path.join(os.tmpdir(), "3rd-review-dsh-test-")); }

test("dsh is a supported provider id with its own adapter family", () => {
  assert.equal(isSupportedProviderId("dsh"), true);
  assert.deepEqual(parseProviderId("dsh"), { id: "dsh", adapter: "dsh", profile: null, runtime_key: "dsh" });
  assert.deepEqual(parseProviderId("dsh/k3"), { id: "dsh/k3", adapter: "dsh", profile: "k3", runtime_key: "dsh%2Fk3" });
  assert.equal(adapterForProviderId("dsh"), "dsh");
  assert.equal(providerRuntimeKey("dsh"), "dsh");
});

test("dsh registry entry is a host identity that fails loudly as a reviewer", () => {
  const worker = adapter("dsh");
  assert.equal(worker.host_identity_only, true);
  assert.equal(worker.capabilities.continuation, false);
  for (const fn of [worker.doctor, worker.start, worker.resume, worker.parse, worker.observeLine]) {
    assert.throws(() => fn(), /host identity/);
  }
});

test("broker accepts host_provider dsh and applies same-source exclusion", async () => {
  const broker = new Broker(config(temp()));
  const result = await broker.run({ version: 4, host_provider: "dsh", prompt: "review", continuation: null });
  assert.notEqual(result.error?.code, "REQUEST_INVALID");
  assert.ok(result.runtime_id);
});

test("broker still rejects an unknown host_provider", async () => {
  const broker = new Broker(config(temp()));
  await assert.rejects(() => broker.run({ version: 4, host_provider: "unknown-host", prompt: "review", continuation: null }), (error) => error?.code === "REQUEST_INVALID");
});
