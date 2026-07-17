import { describe, expect, it } from "vitest";
import { loadPhaseCapability } from "./helpers/side-effect-snapshot.mjs";
import { createTrustedSignatureProof, createTrustedSignatureVerifier } from "../core/human-confirmation.mjs";

const signingKey = "workflowhub-human-confirmation-test-key-v1";

const envelope = {
  schema_id: "https://workflowhub.dev/schemas/human-confirmation-envelope.v1.schema.json",
  schema_version: "1.0.0",
  purpose: "stage",
  task_id: "task-a",
  bound_ref: "results/verify-code/attempt-0001.json",
  bound_hash: "a".repeat(64),
  actor: { id: "human-1", type: "human" },
  source_event: { ref: "source-events/comment-42.json", sha256: "b".repeat(64), occurred_at: "2026-07-17T00:00:00.000Z" },
  authentication: { method: "platform-readback", verified_at: "2026-07-17T00:00:01.000Z", proof_ref: "authentication/comment-42.json", proof_hash: "c".repeat(64) },
  decision: "accepted",
  confirmed_at: "2026-07-17T00:00:02.000Z",
};
const context = { purpose: "stage", taskId: "task-a", boundRef: envelope.bound_ref, boundHash: envelope.bound_hash, consumedEvents: new Set(), verifyPlatformReadback: () => true };

describe("AC-004/005/006 confirmation envelope", () => {
  it("accepts one authenticated human event for its exact purpose/ref/hash", async () => {
    const consume = await loadPhaseCapability("../core/human-confirmation.mjs", "consumeHumanConfirmation");
    expect(consume(envelope, context)).toMatchObject({ accepted: true });
  });

  it.each([
    ["cross-purpose reuse", { ...envelope, purpose: "commit" }, { purpose: "close" }],
    ["hash drift", envelope, { purpose: "stage", boundHash: "b".repeat(64) }],
    ["agent self-approval", { ...envelope, actor: { id: "agent-1", type: "agent" } }, {}],
    ["unauthenticated event", { ...envelope, authentication: null }, {}],
    ["unverified authentication proof", envelope, { verifyPlatformReadback: () => false }],
    ["replayed event", envelope, { purpose: "stage", consumedEvents: new Set([envelope.source_event.ref]) }],
  ])("rejects %s without creating confirmation", async (_label, value, expected) => {
    const consume = await loadPhaseCapability("../core/human-confirmation.mjs", "consumeHumanConfirmation");
    expect(() => consume(value, { ...context, ...expected })).toThrow(/purpose|hash|human|auth|replay|consum/i);
  });

  it("consumes an authenticated source event only once", async () => {
    const consume = await loadPhaseCapability("../core/human-confirmation.mjs", "consumeHumanConfirmation");
    const consumedEvents = new Set();
    expect(consume(envelope, { ...context, consumedEvents })).toMatchObject({ accepted: true });
    expect(() => consume(envelope, { ...context, consumedEvents })).toThrow(/replay|consum/i);
  });

  it("accepts a trusted signature capability and records non-positive decisions without accepting", async () => {
    const consume = await loadPhaseCapability("../core/human-confirmation.mjs", "consumeHumanConfirmation");
    const signed = { ...envelope, source_event: { ...envelope.source_event, ref: "source-events/signed-42.json" }, authentication: { ...envelope.authentication, method: "signature", signature: "0".repeat(64) } };
    signed.authentication.signature = createTrustedSignatureProof(signingKey, signed);
    expect(consume(signed, { ...context, consumedEvents: new Set(), verifyTrustedSignature: createTrustedSignatureVerifier(signingKey) })).toMatchObject({ accepted: true });
    expect(consume({ ...envelope, decision: "rejected" }, { ...context, consumedEvents: new Set() })).toMatchObject({ accepted: false, decision: "rejected" });
    expect(consume({ ...envelope, decision: "timeout", source_event: { ...envelope.source_event, ref: "source-events/timeout.json" } }, { ...context, consumedEvents: new Set() })).toMatchObject({ accepted: false, decision: "timeout" });
  });

  it.each([
    ["actor", (value) => ({ ...value, actor: { id: "forged-human", type: "human" } })],
    ["event", (value) => ({ ...value, source_event: { ...value.source_event, sha256: "0".repeat(64) } })],
    ["proof ref", (value) => ({ ...value, authentication: { ...value.authentication, proof_ref: "authentication/forged.json" } })],
    ["platform proof hash", (value) => ({ ...value, authentication: { ...value.authentication, proof_hash: "0".repeat(64) } })],
    ["signature", (value) => ({ ...value, authentication: { ...value.authentication, signature: "0".repeat(64) } })],
  ])("rejects forged signed %s", async (_label, forge) => {
    const consume = await loadPhaseCapability("../core/human-confirmation.mjs", "consumeHumanConfirmation");
    const signed = { ...envelope, authentication: { ...envelope.authentication, method: "signature", signature: "0".repeat(64) } };
    signed.authentication.signature = createTrustedSignatureProof(signingKey, signed);
    expect(() => consume(forge(signed), { ...context, consumedEvents: new Set(), verifyTrustedSignature: createTrustedSignatureVerifier(signingKey) })).toThrow(/signature|authentication|proof/i);
  });

  it("fails loud when no launcher-issued verifier exists", async () => {
    const consume = await loadPhaseCapability("../core/human-confirmation.mjs", "consumeHumanConfirmation");
    const signed = { ...envelope, authentication: { ...envelope.authentication, method: "signature", signature: "0".repeat(64) } };
    signed.authentication.signature = createTrustedSignatureProof(signingKey, signed);
    expect(() => consume(signed, { ...context, consumedEvents: new Set(), verifyTrustedSignature: undefined })).toThrow(/trusted signature proof is invalid/i);
  });

  it.each([
    ["missing stable actor", { ...envelope, actor: { id: "", type: "human" } }],
    ["invalid event occurred_at", { ...envelope, source_event: { ...envelope.source_event, occurred_at: "later" } }],
    ["non-canonical proof ref", { ...envelope, authentication: { ...envelope.authentication, proof_ref: "../proof.json" } }],
    ["invalid proof hash", { ...envelope, authentication: { ...envelope.authentication, proof_hash: "not-a-hash" } }],
    ["wrong task policy", envelope],
  ])("rejects %s", async (label, value) => {
    const consume = await loadPhaseCapability("../core/human-confirmation.mjs", "consumeHumanConfirmation");
    const override = label === "wrong task policy" ? { taskId: "task-b" } : {};
    expect(() => consume(value, { ...context, ...override, consumedEvents: new Set() })).toThrow(/actor|occurred_at|proof|hash|task policy/i);
  });

  it("requires confirmation for human stages and forbids it for automatic stages", async () => {
    const policy = await loadPhaseCapability("../core/human-confirmation.mjs", "assertStageConfirmationPolicy");
    expect(() => policy("verify-code", envelope)).not.toThrow();
    expect(() => policy("build-code", envelope)).toThrow(/automatic|confirmation/i);
    expect(() => policy("build-plan", null)).toThrow(/required|confirmation/i);
  });
});
