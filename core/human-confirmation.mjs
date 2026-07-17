import { acceptanceModeFor } from "./stage-acceptance-policy.mjs";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { assertTaskHandle } from "./task-handle.mjs";

const SCHEMA_ID = "https://workflowhub.dev/schemas/human-confirmation-envelope.v1.schema.json";
const HASH = /^[a-f0-9]{64}$/;
const CANONICAL_REF = /^(?![/:]|.*(?:^|\/)\.\.(?:\/|$))[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/;
const PURPOSES = new Set(["stage", "commit", "close", "admin-repin", "switch"]);
const DECISIONS = new Set(["accepted", "rejected", "timeout"]);

function record(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

function exactKeys(value, allowed, label) {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`${label} contains unknown fields: ${unknown.join(", ")}`);
}

function nonempty(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} is required`);
  return value;
}

function dateTime(value, label) {
  nonempty(value, label);
  if (!Number.isFinite(Date.parse(value))) throw new TypeError(`${label} must be a date-time`);
}

function canonicalRef(value, label) {
  nonempty(value, label);
  if (!CANONICAL_REF.test(value) || value.includes("//")) throw new TypeError(`${label} must be a canonical ref`);
}

function hash(value, label) {
  if (!HASH.test(value ?? "")) throw new TypeError(`${label} must be a sha256 hash`);
}

function canonical(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}

function signatureKey(value) {
  if (typeof value !== "string" || Buffer.byteLength(value, "utf8") < 32) throw new TypeError("trusted confirmation signing key must contain at least 32 bytes");
  return value;
}

function signatureMaterial(envelope) {
  return {
    schema_id: envelope.schema_id, schema_version: envelope.schema_version,
    purpose: envelope.purpose, task_id: envelope.task_id,
    bound_ref: envelope.bound_ref, bound_hash: envelope.bound_hash,
    actor: envelope.actor, source_event: envelope.source_event,
    authentication: {
      method: envelope.authentication?.method,
      verified_at: envelope.authentication?.verified_at,
      proof_ref: envelope.authentication?.proof_ref,
      proof_hash: envelope.authentication?.proof_hash,
    },
    decision: envelope.decision, confirmed_at: envelope.confirmed_at,
  };
}

/** HMAC proof for an offline confirmation. The secret is launcher/platform authority, never task input. */
export function createTrustedSignatureProof(signingKey, envelope) {
  signatureKey(signingKey);
  return createHmac("sha256", signingKey).update(canonical(signatureMaterial(record(envelope, "human confirmation")))).digest("hex");
}

/** Mint the verifier capability injected by a trusted launcher. */
export function createTrustedSignatureVerifier(signingKey) {
  signatureKey(signingKey);
  return (envelope) => {
    try {
      const expected = Buffer.from(createTrustedSignatureProof(signingKey, envelope), "hex");
      const actual = Buffer.from(envelope?.authentication?.signature ?? "", "hex");
      return actual.length === expected.length && timingSafeEqual(actual, expected);
    } catch { return false; }
  };
}

function verifyAuthentication(envelope, context) {
  const authentication = record(envelope.authentication, "authentication");
  exactKeys(authentication, new Set(["method", "verified_at", "proof_ref", "proof_hash", "signature"]), "authentication");
  dateTime(authentication.verified_at, "authentication verified_at");
  canonicalRef(authentication.proof_ref, "authentication proof_ref");
  hash(authentication.proof_hash, "authentication proof_hash");

  const input = Object.freeze(structuredClone(envelope));
  if (authentication.method === "platform-readback") {
    if (typeof context.verifyPlatformReadback !== "function" || context.verifyPlatformReadback(input) !== true) {
      throw new Error("authentication platform readback proof is invalid");
    }
    return;
  }
  if (authentication.method === "signature") {
    hash(authentication.signature, "authentication signature");
    if (typeof context.verifyTrustedSignature !== "function" || context.verifyTrustedSignature(input) !== true) {
      throw new Error("authentication trusted signature proof is invalid");
    }
    return;
  }
  throw new Error("authentication method is unsupported");
}

export function consumeHumanConfirmation(value, context = {}) {
  const envelope = record(value, "human confirmation");
  const policy = record(context, "confirmation context");
  exactKeys(envelope, new Set([
    "schema_id", "schema_version", "purpose", "task_id", "bound_ref", "bound_hash",
    "actor", "source_event", "authentication", "decision", "confirmed_at",
  ]), "human confirmation");
  if (envelope.schema_id !== SCHEMA_ID || envelope.schema_version !== "1.0.0") throw new Error("human confirmation schema is invalid");
  if (!PURPOSES.has(envelope.purpose)) throw new Error("confirmation purpose is invalid");
  if (envelope.purpose !== policy.purpose) throw new Error("confirmation purpose does not match task policy");
  nonempty(envelope.task_id, "confirmation task_id");
  if (policy.taskId !== undefined && envelope.task_id !== policy.taskId) throw new Error("confirmation task policy identity mismatch");
  canonicalRef(envelope.bound_ref, "confirmation bound_ref");
  if (envelope.bound_ref !== policy.boundRef) throw new Error("confirmation bound ref does not match purpose");
  hash(envelope.bound_hash, "confirmation bound_hash");
  if (envelope.bound_hash !== policy.boundHash) throw new Error("confirmation bound hash mismatch");

  const actor = record(envelope.actor, "confirmation actor");
  exactKeys(actor, new Set(["id", "type"]), "confirmation actor");
  nonempty(actor.id, "stable human actor id");
  if (actor.type !== "human") throw new Error("confirmation actor must be human");

  const event = record(envelope.source_event, "source event");
  exactKeys(event, new Set(["ref", "sha256", "occurred_at"]), "source event");
  canonicalRef(event.ref, "source event ref");
  hash(event.sha256, "source event hash");
  dateTime(event.occurred_at, "source event occurred_at");
  dateTime(envelope.confirmed_at, "confirmation confirmed_at");
  if (!DECISIONS.has(envelope.decision)) throw new Error("confirmation decision is invalid");

  if (!(policy.consumedEvents instanceof Set)) throw new TypeError("consumedEvents Set is required for source event consumption");
  if (policy.consumedEvents.has(event.ref)) throw new Error("source event replay already consumed");
  verifyAuthentication(envelope, policy);
  if (Date.parse(event.occurred_at) > Date.parse(envelope.authentication.verified_at)
    || Date.parse(envelope.authentication.verified_at) > Date.parse(envelope.confirmed_at)) {
    throw new Error("source event occurred_at, authentication verified_at, and confirmed_at are out of order");
  }
  policy.consumedEvents.add(event.ref);
  return Object.freeze({ accepted: envelope.decision === "accepted", decision: envelope.decision, purpose: envelope.purpose, taskId: envelope.task_id, sourceEventRef: event.ref });
}

function eventRefDigest(ref) {
  return createHash("sha256").update(String(ref), "utf8").digest("hex");
}

function readOptional(task, ref) {
  try { return task.readRecord(ref); }
  catch (error) { if (error?.code === "ENOENT") return undefined; throw error; }
}

/**
 * Authenticate and durably consume one platform event.  Identity is keyed by
 * the canonical event ref, while the asserted event hash is recorded and must
 * remain identical on every replay attempt.
 */
export function consumeTaskHumanConfirmation(taskHandle, envelope, policy = {}) {
  const task = assertTaskHandle(taskHandle);
  const eventRef = envelope?.source_event?.ref;
  canonicalRef(eventRef, "source event ref");
  const consumeRef = `confirmations/source-events/${eventRefDigest(eventRef)}.json`;
  return task.withRecordLock("locks/human-confirmation.consume.lock", () => {
    const priorRaw = readOptional(task, consumeRef);
    if (priorRaw !== undefined) {
      const prior = JSON.parse(priorRaw);
      if (prior.source_event?.ref !== eventRef || prior.source_event?.sha256 !== envelope.source_event?.sha256) {
        throw new Error("source event ref was previously observed with a different event hash");
      }
      throw new Error("source event replay already consumed");
    }
    const consumedEvents = new Set();
    const outcome = consumeHumanConfirmation(envelope, { ...policy, consumedEvents });
    // One create-only record is both the authenticated confirmation and the
    // consumption marker.  This removes the crash window between two writes.
    task.createRecordAtomic(consumeRef, `${JSON.stringify(envelope, null, 2)}\n`);
    return Object.freeze({ ...outcome, confirmationRef: consumeRef, consumeRef });
  });
}

export function assertStageConfirmationPolicy(stage, confirmation) {
  const mode = acceptanceModeFor(stage);
  if (mode === "automatic" && confirmation != null) throw new Error(`${stage} is automatic and forbids human confirmation`);
  if (mode === "human" && confirmation == null) throw new Error(`${stage} requires human confirmation`);
  return Object.freeze({ stage, acceptanceMode: mode });
}
