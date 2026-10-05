import assert from "node:assert/strict";
import { test } from "vitest";
import { lastProviderMaterial, providerHasContinuationPredecessor, recordContinuationMaterial, releaseContinuationMaterial, reserveContinuationMaterial } from "../lib/continuation-materials.mjs";

const initial = "i".repeat(64);
const material = (sequence, previous = null, label = "a") => ({ sequence, bundle_id: `bundle-${label}`, manifest_hash: `${label}`.repeat(64), delivery_manifest_hash: `${String.fromCharCode(label.charCodeAt(0) + 1)}`.repeat(64), initial_material_manifest_hash: initial, previous_delivery_manifest_hash: previous });

test("R1 to R3 preserves the same provider native-session material chain", () => {
  const r2 = material(1); let state = { attachments: { manifest_hash: initial }, continuation_materials: [] };
  state = reserveContinuationMaterial(state, r2, "opencode", "native-1"); state = recordContinuationMaterial(state, r2, "opencode", "native-1");
  assert.equal(lastProviderMaterial(state, "opencode", "native-1").manifest_hash, r2.manifest_hash);
  const r3 = material(2, r2.delivery_manifest_hash, "c"); state = reserveContinuationMaterial(state, r3, "opencode", "native-1"); state = recordContinuationMaterial(state, r3, "opencode", "native-1");
  assert.equal(state.continuation_materials.length, 2); assert.equal(lastProviderMaterial(state, "opencode", "native-1").manifest_hash, r3.manifest_hash);
});

test("reservation rejects different concurrent delta and rolls back failed setup", () => {
  const r2 = material(1); const conflicting = material(1, null, "d"); let state = reserveContinuationMaterial({ continuation_materials: [] }, r2, "opencode", "native-1");
  assert.throws(() => reserveContinuationMaterial(state, conflicting, "kimi", "native-2"), { code: "MATERIAL_INCOMPLETE" });
  state = releaseContinuationMaterial(state, r2, "opencode", "native-1"); assert.equal(state.continuation_reservation, null);
  assert.doesNotThrow(() => reserveContinuationMaterial(state, conflicting, "kimi", "native-2"));
});

test("provider session fork cannot inherit a prior delta material", () => {
  const r2 = material(1); let state = reserveContinuationMaterial({ continuation_materials: [] }, r2, "opencode", "native-1"); state = recordContinuationMaterial(state, r2, "opencode", "native-1");
  assert.equal(lastProviderMaterial(state, "opencode", "native-2"), null); assert.equal(lastProviderMaterial(state, "opencode", "native-1").delivery_manifest_hash, r2.delivery_manifest_hash);
});

test("reservation rejects a different sealed material chain", () => {
  const r2 = material(1); const state = reserveContinuationMaterial({ continuation_materials: [] }, r2, "opencode", "native-1");
  assert.throws(() => reserveContinuationMaterial(state, { ...r2, manifest_hash: "z".repeat(64) }, "kimi", "native-2"), { code: "MATERIAL_INCOMPLETE" });
});

test("bundle id is part of the reserved continuation binding", () => {
  const r2 = material(1); const state = reserveContinuationMaterial({ continuation_materials: [] }, r2, "opencode", "native-1");
  assert.throws(() => reserveContinuationMaterial(state, { ...r2, bundle_id: "different-bundle" }, "kimi", "native-2"), { code: "MATERIAL_INCOMPLETE" });
  assert.throws(() => recordContinuationMaterial({ ...state, continuation_reservation: { ...state.continuation_reservation, bundle_id: "tampered-bundle" } }, r2, "opencode", "native-1"), { code: "MATERIAL_INCOMPLETE" });
});

test("R3 selects only provider sessions that completed R2", () => {
  const r2 = material(1); let state = { continuation_materials: [] };
  state = reserveContinuationMaterial(state, r2, "opencode", "open-session"); state = recordContinuationMaterial(state, r2, "opencode", "open-session");
  assert.equal(providerHasContinuationPredecessor(state, "opencode", "open-session", 2), true);
  assert.equal(providerHasContinuationPredecessor(state, "codex", "codex-session", 2), false);
  assert.equal(providerHasContinuationPredecessor(state, "opencode", "other-session", 2), false);
  assert.equal(providerHasContinuationPredecessor(state, "codex", "codex-session", 1), true);
});
