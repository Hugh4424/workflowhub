import assert from "node:assert/strict";
import { test } from "vitest";
import { projectWorkflowHubMemberV3 } from "../lib/workflowhub-result-v3.mjs";

const context = {
  runtime_id: "runtime-v3",
  material_id: "material-sha",
  contract_id: "build-code/v3",
  contract_hash: "contract-sha",
  semantic_hash: "semantic-sha",
  source_id: "opencode/v4flash",
  config_id: "config-sha",
  adapter: "opencode",
  model: null,
  deadline_ms: null,
  attempts: [],
};

function member(overrides = {}, extraContext = {}) {
  return projectWorkflowHubMemberV3({
    provider: "opencode/v4flash",
    adapter: "opencode",
    status: "failed",
    output: null,
    error: { code: "PROCESS_DEAD", message: "provider did not return a terminal result" },
    ...overrides,
  }, { ...context, ...extraContext });
}

test("v3 keeps unknown deadline and timing as null instead of inventing telemetry", () => {
  const value = member();
  assert.equal(value.deadline_ms, null);
  assert.deepEqual(value.timing, { started_at_ms: null, completed_at_ms: null, duration_ms: null });
});

test("v3 rejects private absolute paths in serialized and plain member output", () => {
  for (const path of ["/Users/alice/review.md", "/workspace/subject.md", "/srv/review/subject.md", "/data/review/subject.md", "file://host/review.json"]) {
    assert.throws(() => member({ output: JSON.stringify({ path }) }), { code: "PUBLIC_RESULT_INVALID" });
    assert.throws(() => member({ output: `finding: ${path}` }), { code: "PUBLIC_RESULT_INVALID" });
    assert.throws(() => member({ model: path, output: "ok" }), { code: "PUBLIC_RESULT_INVALID" });
  }
});

test("v3 keeps an explicit logical API route without allowing arbitrary absolute paths", () => {
  assert.doesNotThrow(() => member({ output: JSON.stringify({ path: "/api/items/42" }) }));
  assert.doesNotThrow(() => member({ output: "Review the code / AC mapping and `</li>` markup." }));
  assert.doesNotThrow(() => member({ output: "The phrase /secret is not itself a filesystem path." }));
});

test("v3 rejects inconsistent timing and usage telemetry at the producer boundary", () => {
  assert.throws(() => member({ timing: { started_at_ms: 10, completed_at_ms: 20, duration_ms: 9 } }, { attempts: [] }), { code: "PUBLIC_RESULT_INVALID" });
  assert.throws(() => member({ usage: { total: "14" } }), { code: "PUBLIC_RESULT_INVALID" });
});

test("v3 preserves finite decimal provider cost telemetry without weakening token usage", () => {
  const usage = {
    input: 10,
    output: 4,
    total: 14,
    cost: { input: 0.0000014, output: 0.00058156, total: 0.0005908448 },
  };
  assert.deepEqual(member({ usage }).usage, usage);
  assert.throws(() => member({ usage: { total: 14.5 } }), { code: "PUBLIC_RESULT_INVALID" });
  assert.throws(() => member({ usage: { cost: { total: -0.1 } } }), { code: "PUBLIC_RESULT_INVALID" });
  assert.throws(() => member({ usage: { cost: { total: Infinity } } }), { code: "PUBLIC_RESULT_INVALID" });
});

test("v3 drops descriptive provider metadata from numeric usage", () => {
  const usage = {
    input_tokens: 10,
    output_tokens: 4,
    service_tier: "standard",
    inference_geo: "",
    iterations: [],
    speed: "standard",
  };
  assert.deepEqual(member({ usage }).usage, {
    input_tokens: 10,
    output_tokens: 4,
  });
  assert.equal(member({ usage: { service_tier: "standard" } }).usage, null);
});
