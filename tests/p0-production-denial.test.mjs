import { describe, expect, it } from "vitest";
import { loadPhaseCapability } from "./helpers/side-effect-snapshot.mjs";

const switchPlan = { schema_id: "https://workflowhub.dev/schemas/switch-plan.v1.schema.json", schema_version: "1.0.0", from_routing_hash: "a".repeat(64), to_routing_hash: "b".repeat(64), release_manifest_ref: "releases/preview.json", release_manifest_hash: "c".repeat(64), fact_packet_ref: "facts/production-switch.json", fact_packet_hash: "d".repeat(64), rollback_target_ref: "routing/previous.json", rollback_target_hash: "e".repeat(64), live_pointer_ref: "routing/production.json", expected_live_pointer_hash: "f".repeat(64), current_live_pointer_hash: "f".repeat(64), plan_hash: "0".repeat(64) };

describe("AC-018/021 P0 production denial", () => {
  it("allows an immutable preview release in isolated preview mode", async () => {
    const authorize = await loadPhaseCapability("../core/production-switch.mjs", "authorizeProductionSwitch");
    expect(authorize({ switchPlan, release_kind: "preview", target: "isolated-preview", evidence: {} })).toMatchObject({ allowed: true, production: false });
  });

  it("rejects P0 production switching before routing writes", async () => {
    const authorize = await loadPhaseCapability("../core/production-switch.mjs", "authorizeProductionSwitch");
    const writes = [];
    expect(() => authorize({ switchPlan, release_kind: "preview", target: "production", evidence: {}, writes })).toThrow(/P0|preview|production/i);
    expect(writes).toEqual([]);
  });

  it("rejects P1 eligibility with any missing structural evidence", async () => {
    const authorize = await loadPhaseCapability("../core/production-switch.mjs", "authorizeProductionSwitch");
    expect(() => authorize({ switchPlan, release_kind: "candidate", target: "production", evidence: { execution: true, metrics: true } })).toThrow(/evidence|eligibility|missing/i);
  });
});
