import { createHash } from "node:crypto";
import { createTrustedSignatureProof, createTrustedSignatureVerifier } from "../../core/human-confirmation.mjs";

let sequence = 0;
export const TEST_CONFIRMATION_SIGNING_KEY = "workflowhub-test-confirmation-signing-key-v1";
export const testConfirmationVerification = Object.freeze({ verifyTrustedSignature: createTrustedSignatureVerifier(TEST_CONFIRMATION_SIGNING_KEY) });

export function writeHumanConfirmation(kernel, stage, attempt, decision = "accepted") {
  sequence += 1;
  const attemptRef = typeof attempt === "string" ? attempt : attempt.attempt_ref;
  const attemptPath = `results/${stage}/${attemptRef}`;
  const attemptRaw = kernel.task.readRecord(attemptPath);
  const proofRef = `evidence/authentication/test-proof-${sequence}.json`;
  const proofRaw = `${JSON.stringify({ schema_version: "test-signature-proof.v1", sequence })}\n`;
  kernel.publishCanonicalRecord(proofRef, proofRaw);
  const envelope = {
    schema_id: "https://workflowhub.dev/schemas/human-confirmation-envelope.v1.schema.json", schema_version: "1.0.0",
    purpose: "stage", task_id: kernel.task.identity.taskId, bound_ref: attemptPath,
    bound_hash: createHash("sha256").update(attemptRaw).digest("hex"),
    actor: { id: "test-human", type: "human" },
    source_event: { ref: `source-events/test-${sequence}.json`, sha256: createHash("sha256").update(`event-${sequence}`).digest("hex"), occurred_at: new Date().toISOString() },
    authentication: { method: "signature", verified_at: new Date().toISOString(), proof_ref: proofRef, proof_hash: createHash("sha256").update(proofRaw).digest("hex"), signature: "0".repeat(64) },
    decision, confirmed_at: new Date().toISOString(),
  };
  envelope.authentication.signature = createTrustedSignatureProof(TEST_CONFIRMATION_SIGNING_KEY, envelope);
  return kernel.confirmAttempt(stage, attemptRef, envelope).ref;
}
