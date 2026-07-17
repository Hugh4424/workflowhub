import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import { createOfflineAdapter, createOfflineSourceEnvelope } from "../adapters/offline-fixture/index.mjs";
import { createOfflinePlatformFixture, OFFLINE_TEST_SIGNING_KEY } from "./fixtures/offline-platform.mjs";
import { consumeHumanConfirmation, createTrustedSignatureVerifier } from "../core/human-confirmation.mjs";
import { loadPhaseCapability } from "./helpers/side-effect-snapshot.mjs";

describe("AC-002 adapter port", () => {
  it("normalizes, authenticates and dispatches a generic source", async () => {
    const dispatch = await loadPhaseCapability("../adapters/port.mjs", "dispatchAdapterEvent");
    const request = { schema_id: "https://workflowhub.dev/schemas/adapter-envelope.v1.schema.json", schema_version: "1.0.0", adapter_id: "offline", adapter_version: "1.0.0", operation: "dispatch", source_ref: "sources/event-1.json" };
    const source = { schema_id: "https://workflowhub.dev/schemas/source-envelope.v1.schema.json", schema_version: "1.0.0", source_type: "offline-fixture", source_ref: request.source_ref, payload_hash: "a".repeat(64) };
    const publicCli = vi.fn(async () => ({ exit_code: 0 }));
    const result = await dispatch({ request, source, publicCli });
    expect(result).toMatchObject({ source, dispatched: true });
    expect(result).not.toHaveProperty("canonical_stage_changed");
    expect(publicCli).toHaveBeenCalledOnce();
  });

  it("does not claim canonical stage change when the public CLI rejects dispatch", async () => {
    const dispatch = await loadPhaseCapability("../adapters/port.mjs", "dispatchAdapterEvent");
    const request = { schema_id: "https://workflowhub.dev/schemas/adapter-envelope.v1.schema.json", schema_version: "1.0.0", adapter_id: "offline", adapter_version: "1.0.0", operation: "dispatch", source_ref: "sources/event-failed.json" };
    const source = { schema_id: "https://workflowhub.dev/schemas/source-envelope.v1.schema.json", schema_version: "1.0.0", source_type: "offline-fixture", source_ref: request.source_ref, payload_hash: "a".repeat(64) };
    await expect(dispatch({ request, source, publicCli: async () => ({ exit_code: 12 }) })).resolves.toMatchObject({ dispatched: false, canonical_stage_changed: false });
  });

  it.each([
    ["accepted writer", { requested_capability: "write-accepted" }],
    ["coverage calculator", { requested_capability: "compute-coverage" }],
    ["platform-private field", { source: { multica_issue_internal_id: "private" } }],
  ])("rejects adapter %s authority", async (_label, event) => {
    const dispatch = await loadPhaseCapability("../adapters/port.mjs", "dispatchAdapterEvent");
    const request = { schema_id: "https://workflowhub.dev/schemas/adapter-envelope.v1.schema.json", schema_version: "1.0.0", adapter_id: "multica", adapter_version: "1.0.0", operation: "dispatch", source_ref: "sources/event.json" };
    await expect(dispatch({ request, maliciousExtension: event })).rejects.toThrow(/adapter|authority|private|contract/i);
  });

  it("records dispatch failure without claiming the stage was triggered", async () => {
    const dispatch = await loadPhaseCapability("../adapters/port.mjs", "dispatchAdapterEvent");
    const request = { schema_id: "https://workflowhub.dev/schemas/adapter-envelope.v1.schema.json", schema_version: "1.0.0", adapter_id: "offline", adapter_version: "1.0.0", operation: "dispatch", source_ref: "sources/event-2.json" };
    expect(await dispatch({ request, injectCrash: "dispatch" })).toMatchObject({ dispatched: false, canonical_stage_changed: false });
  });

  it("exposes only the versioned four-method adapter port", async () => {
    const createPort = await loadPhaseCapability("../adapters/port.mjs", "createAdapterPort");
    const method = vi.fn();
    const port = createPort({
      adapterId: "offline",
      adapterVersion: "1.0.0",
      normalizeSource: method,
      authenticateEvent: method,
      dispatch: method,
      projectStatus: method,
    });
    expect(Object.keys(port).sort()).toEqual([
      "adapterId",
      "adapterVersion",
      "authenticateEvent",
      "dispatch",
      "normalizeSource",
      "portVersion",
      "projectStatus",
    ]);
    expect(port.portVersion).toBe("1.0.0");
    expect(Object.isFrozen(port)).toBe(true);
    expect(() => createPort({ ...port, writeAccepted: method })).toThrow(/adapter|contract/i);
  });

  it("does not import canonical writers, coverage, audit or metrics", async () => {
    const source = await readFile(new URL("../adapters/port.mjs", import.meta.url), "utf8");
    expect(source).not.toMatch(/(?:from|import\s*\()[^\n]*(?:writer|coverage|audit|metrics)/i);
  });

  it("drives source, signed human auth, public CLI dispatch and status projection through the offline port", async () => {
    const platform = createOfflinePlatformFixture();
    const adapter = createOfflineAdapter(platform);
    const sourceInput = { source_id: "event-3", revision: "v1", completeness: "complete", requirements: [{ requirement_id: "R1", content: "Keep identity stable." }] };
    expect(adapter.normalizeSource(sourceInput)).toMatchObject({ ok: true, source_type: "offline-fixture", source_id: "event-3" });
    expect(createOfflineSourceEnvelope("sources/event-3.json", sourceInput)).toMatchObject({ source_type: "offline-fixture", payload_hash: expect.stringMatching(/^[a-f0-9]{64}$/) });

    platform.signHumanEvent({ ref: "events/confirm-1", actor_id: "humans/reviewer-1", actor_type: "human", decision: "accepted", occurred_at: "2026-07-17T00:00:00.000Z" });
    const confirmation = await adapter.authenticateEvent({ event_ref: "events/confirm-1", purpose: "stage", task_id: "one", bound_ref: "results/make-decision/attempt-0001.json", bound_hash: "a".repeat(64) });
    expect(confirmation).toMatchObject({
      schema_id: "https://workflowhub.dev/schemas/human-confirmation-envelope.v1.schema.json",
      schema_version: "1.0.0",
      purpose: "stage",
      task_id: "one",
      actor: { id: "humans/reviewer-1", type: "human" },
      source_event: { ref: "events/confirm-1" },
      authentication: { method: "signature" },
      decision: "accepted",
    });
    expect(consumeHumanConfirmation(confirmation, { purpose: "stage", taskId: "one", boundRef: confirmation.bound_ref, boundHash: confirmation.bound_hash, consumedEvents: new Set(), verifyTrustedSignature: createTrustedSignatureVerifier(OFFLINE_TEST_SIGNING_KEY) })).toMatchObject({ accepted: true });
    await expect(adapter.dispatch({ argv: ["status", "--project", "Demo", "--task", "one"] })).resolves.toMatchObject({ result_ref: "projects/Demo/tasks/one/status" });
    await expect(adapter.projectStatus({ task_ref: "projects/Demo/tasks/one", state: "active" })).resolves.toMatchObject({ dispatched: true });
    expect(platform.dispatches).toHaveLength(1);
    expect(platform.projections).toHaveLength(1);
  });

  it("keeps projection failure outside canonical stage state", async () => {
    const platform = createOfflinePlatformFixture({ failProjection: true });
    const adapter = createOfflineAdapter(platform);
    await expect(adapter.projectStatus({ task_ref: "projects/Demo/tasks/one", state: "active" })).resolves.toEqual({ dispatched: false, canonical_stage_changed: false, diagnostic: "FIXTURE_PROJECTION_FAILED" });
  });

  it("keeps offline and Multica adapters method-signature compatible", async () => {
    const { createMulticaAdapter } = await import("../adapters/multica/index.mjs");
    const methodNames = ["normalizeSource", "authenticateEvent", "dispatch", "projectStatus"];
    const offline = createOfflineAdapter(createOfflinePlatformFixture());
    const multica = createMulticaAdapter({ readbackEvent: async () => ({}), verifyPlatformEvent: async () => true, signConfirmation: async () => "0".repeat(64), publicCli: async () => ({}), writeStatus: async () => {} });
    expect(methodNames.map((name) => offline[name].length)).toEqual(methodNames.map((name) => multica[name].length));
  });
});
