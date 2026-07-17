import { createHmac, timingSafeEqual } from "node:crypto";
import { contentHash } from "../../core/canonical-source.mjs";
import { createTrustedSignatureProof } from "../../core/human-confirmation.mjs";

export const OFFLINE_TEST_SIGNING_KEY = "workflowhub-offline-fixture-signing-key-v1";

function unsignedEvent(event) {
  const { signature: _signature, ...unsigned } = event;
  return unsigned;
}

function signatureFor(key, event) {
  return createHmac("sha256", key).update(JSON.stringify(unsignedEvent(event))).digest("hex");
}

export function createOfflinePlatformFixture({ failProjection = false, signingKey = OFFLINE_TEST_SIGNING_KEY } = {}) {
  const dispatches = [];
  const projections = [];
  const events = new Map();
  return Object.freeze({
    dispatches,
    projections,
    signHumanEvent(event) {
      const signed = Object.freeze({ ...event, signature: signatureFor(signingKey, event) });
      events.set(signed.ref, signed);
      return signed;
    },
    readEvent(eventRef) { return events.get(eventRef); },
    verifyHumanEvent(event) {
      const expected = Buffer.from(signatureFor(signingKey, event), "hex"), actual = Buffer.from(event?.signature ?? "", "hex");
      if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return { authenticated: false };
      const proof = { actor_id: event.actor_id, actor_type: event.actor_type, decision: event.decision, ref: event.ref, occurred_at: event.occurred_at, signature: event.signature };
      return Object.freeze({ authenticated: true, ...proof, sha256: contentHash(event), verified_at: "2026-07-17T00:00:01.000Z", proof_ref: `offline-proof:${event.ref}`, proof_hash: contentHash(proof) });
    },
    signConfirmation(envelope) { return createTrustedSignatureProof(signingKey, envelope); },
    async publicCli(command) { dispatches.push(command); return { result_ref: "projects/Demo/tasks/one/status" }; },
    async projectStatus(status) {
      if (failProjection) throw Object.assign(new Error("fixture projection failure"), { code: "FIXTURE_PROJECTION_FAILED" });
      projections.push(status);
      return { projected: true };
    },
  });
}
