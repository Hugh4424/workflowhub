import { expect, test } from "vitest";
import { ReviewProviderClient } from "../review-provider-client.mjs";
import { runSimpleReview } from "../simple-review-runner.mjs";

const materials = {
  bundleRoot: "/tmp/wh-review-contract-bundle",
  materialId: "a".repeat(64),
  deliveryManifest: [],
};

function clientWithWire(wire) {
  return new ReviewProviderClient({ invoke: async () => wire });
}

function provider(provider, { status = "completed", output = null, error = null } = {}) {
  return {
    provider,
    status,
    identity: { provider, adapter: provider, source_id: provider, config_id: `${provider}-config`, model: null },
    output,
    error,
    timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 },
    usage: null,
  };
}

function simpleReviewDependencies(client, providers = ["model-a"]) {
  return {
    loadConfig: () => ({ whReview: {}, config: "/unused/config.json", attachmentRoot: "/tmp/wh-review-contract" }),
    resolveRoute: () => ({ initial: providers, mode: "single_round" }),
    selectProviders: () => ({ providers }),
    client,
  };
}

test("0-byte and invalid broker JSON are internal contract failures with private raw evidence", async () => {
  for (const stdout of ["", "not-json"]) {
    const error = await clientWithWire({
      exitCode: 2,
      stdout,
      stderr: "provider failed at /private/provider/raw.log",
    }).runGroup({
      hostProvider: "codex/terra",
      providers: ["codex/luna"],
      materials,
      prompt: "review",
    }).catch((value) => value);

    expect(error).toMatchObject({ code: "PROTOCOL_INCOMPATIBLE" });
    expect(error.diagnostic).toMatchObject({
      classification: "contract_failure",
      raw_stdout: stdout,
      raw_stderr: "provider failed at /private/provider/raw.log",
    });
    expect(Object.keys(error)).not.toContain("diagnostic");
    expect(JSON.stringify(error)).not.toContain("/private/provider/raw.log");
  }
});

test("the five terminal states stay truthful and one unchanged input is dispatched once", async () => {
  const finding = JSON.stringify({ findings: [{
    severity: "major",
    path: "materials/01-implementation.md",
    line: 1,
    issue: "partial provider evidence",
    recommendation: "repair the failed provider",
    root_cause: "provider transport failure",
    evidence_kind: "direct",
    evidence: "the submitted implementation is present",
  }] });
  const cases = [
    {
      name: "timeout",
      code: "PROCESS_TIMEOUT",
      message: "broker timeout",
      expectedCode: "REVIEW_EXECUTION_TIMEOUT",
      result: () => { throw Object.assign(new Error("broker timeout"), { code: "PROCESS_TIMEOUT" }); },
    },
    {
      name: "public result invalid",
      code: "PUBLIC_RESULT_INVALID",
      message: "broker exposed /private/provider.json",
      expectedCode: "PUBLIC_RESULT_INVALID",
      result: () => { throw Object.assign(new Error("broker exposed /private/provider.json"), { code: "PUBLIC_RESULT_INVALID" }); },
    },
    {
      name: "zero-byte contract failure",
      code: "PROTOCOL_INCOMPATIBLE",
      message: "broker did not return JSON",
      expectedCode: "PROTOCOL_INCOMPATIBLE",
      result: () => { throw Object.assign(new Error("broker did not return JSON"), { code: "PROTOCOL_INCOMPATIBLE" }); },
    },
    {
      name: "host unavailable",
      code: "BROKER_SPAWN_FAILED",
      message: "broker could not start",
      expectedCode: "REVIEW_BROKER_START_FAILED",
      result: () => { throw Object.assign(new Error("broker could not start"), { code: "BROKER_SPAWN_FAILED" }); },
    },
    {
      name: "partial",
      result: () => ({
        runtimeId: "runtime-partial",
        outcome: "partial",
        providers: [
          provider("model-a", { output: finding }),
          provider("model-b", { status: "failed", error: { code: "PROCESS_DEAD", message: "failed at /private/provider.log" } }),
        ],
      }),
      expectedCode: null,
    },
  ];

  for (const current of cases) {
    let calls = 0;
    const client = {
      async runGroup() {
        calls += 1;
        return current.result();
      },
    };
    const result = await runSimpleReview({
      stage: "build-code",
      host_provider: "codex/terra",
      material_fingerprint: "same-input",
      materials: { implementation: "current implementation" },
    }, simpleReviewDependencies(client, current.name === "partial" ? ["model-a", "model-b"] : ["model-a"]));

    expect(calls, current.name).toBe(1);
    expect(JSON.stringify(result), current.name).not.toContain("/private/provider");
    if (current.name === "partial") {
      expect(result).toMatchObject({ status: "available", outcome: "partial" });
      expect(result.provider_results.find((item) => item.provider === "model-b")).toMatchObject({
        status: "failed",
        error: { code: "PROCESS_DEAD" },
      });
      expect(result).not.toHaveProperty("pass");
    } else {
      expect(result).toMatchObject({ status: "unavailable", error: { code: current.expectedCode } });
    }
  }
});

test("timeout remains the existing bounded client terminal without a contract-failure label", async () => {
  const error = await clientWithWire({ exitCode: null, stdout: "", stderr: "", timedOut: true }).runGroup({
    hostProvider: "codex/terra",
    providers: ["codex/luna"],
    materials,
    prompt: "review",
  }).catch((value) => value);

  expect(error).toMatchObject({ code: "PROCESS_TIMEOUT" });
  expect(error).not.toHaveProperty("diagnostic");
});
