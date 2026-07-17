import { createHash } from "node:crypto";

import { createCanonicalSource } from "../../core/canonical-source.mjs";
import { createAdapterPort } from "../port.mjs";

const HASH = /^[a-f0-9]{64}$/;
const DECISIONS = new Set(["accepted", "rejected", "timeout"]);

function requiredString(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} is required`);
  return value;
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function selectFields(value, fields) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  return Object.fromEntries(fields.filter((field) => Object.hasOwn(value, field)).map((field) => [field, value[field]]));
}

function canonicalEvidenceRef(value) {
  return selectFields(value, ["kind", "uri_or_path", "content_hash"]);
}

function canonicalRequirement(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const requirement = selectFields(value, [
    "requirement_id", "content", "text", "owner", "authority", "status", "stale",
    "derived_from", "supersedes", "content_hash", "evidence_refs",
  ]);
  if (Array.isArray(requirement.evidence_refs)) requirement.evidence_refs = requirement.evidence_refs.map(canonicalEvidenceRef);
  return requirement;
}

/** Translate the selected public Multica source fields into the canonical source contract. */
export function normalizeMulticaSource(source) {
  return createCanonicalSource({
    source_type: "multica",
    source_id: source?.issue_id,
    revision: source?.revision ?? source?.source_version,
    requirements: Array.isArray(source?.requirements) ? source.requirements.map(canonicalRequirement) : source?.requirements,
    completeness: source?.completeness ?? "incomplete",
    evidence_refs: Array.isArray(source?.evidence_refs) ? source.evidence_refs.map(canonicalEvidenceRef) : [],
  });
}

/**
 * Authenticate a human action from a trusted platform readback. Caller-supplied
 * actor, decision, timestamps, proof and hashes are deliberately ignored.
 */
export async function authenticateMulticaEvent(request, capabilities = {}) {
  const eventRef = requiredString(request?.event_ref, "event_ref");
  if (typeof capabilities.readbackEvent !== "function") throw new TypeError("trusted platform readbackEvent capability is required");
  if (typeof capabilities.verifyPlatformEvent !== "function") throw new TypeError("trusted platform verifyPlatformEvent capability is required");
  if (typeof capabilities.signConfirmation !== "function") throw new TypeError("trusted launcher signConfirmation capability is required");
  const event = await capabilities.readbackEvent(eventRef);
  if (!event || typeof event !== "object" || Array.isArray(event)) throw new Error("trusted platform event readback failed");
  if (event.ref !== eventRef) throw new Error("trusted platform event identity mismatch");
  if (await capabilities.verifyPlatformEvent(event) !== true) throw new Error("trusted platform event verification failed");
  const actorId = requiredString(event.actor_id, "stable human actor id");
  if (event.actor_type !== "human") throw new Error("trusted platform event actor must be human");
  if (!DECISIONS.has(event.decision)) throw new Error("trusted platform event decision is invalid");
  requiredString(event.occurred_at, "source event occurred_at");
  if (!Number.isFinite(Date.parse(event.occurred_at))) throw new TypeError("source event occurred_at must be a date-time");

  const proofRef = requiredString(event.proof_ref, "platform readback proof_ref");
  const proofHash = event.proof_hash ?? sha256(JSON.stringify(event));
  if (!HASH.test(proofHash)) throw new TypeError("platform readback proof_hash must be a sha256 hash");
  const eventHash = event.sha256 ?? sha256(JSON.stringify(event));
  if (!HASH.test(eventHash)) throw new TypeError("source event sha256 must be a sha256 hash");
  if (!HASH.test(request?.bound_hash ?? "")) throw new TypeError("confirmation bound_hash must be a sha256 hash");
  const verifiedAt = capabilities.now?.() ?? new Date().toISOString();
  if (!Number.isFinite(Date.parse(verifiedAt))) throw new TypeError("verified_at must be a date-time");

  const envelope = {
    schema_id: "https://workflowhub.dev/schemas/human-confirmation-envelope.v1.schema.json",
    schema_version: "1.0.0",
    purpose: requiredString(request?.purpose, "confirmation purpose"),
    task_id: requiredString(request?.task_id, "confirmation task_id"),
    bound_ref: requiredString(request?.bound_ref, "confirmation bound_ref"),
    bound_hash: requiredString(request?.bound_hash, "confirmation bound_hash"),
    actor: Object.freeze({ id: actorId, type: "human" }),
    source_event: Object.freeze({ ref: eventRef, sha256: eventHash, occurred_at: event.occurred_at }),
    authentication: { method: "signature", verified_at: verifiedAt, proof_ref: proofRef, proof_hash: proofHash, signature: "0".repeat(64) },
    decision: event.decision,
    confirmed_at: verifiedAt,
  };
  envelope.authentication.signature = await capabilities.signConfirmation(envelope);
  if (!HASH.test(envelope.authentication.signature)) throw new TypeError("Multica confirmation signature must be a sha256-sized HMAC");
  return Object.freeze({ ...envelope, actor: Object.freeze(envelope.actor), source_event: Object.freeze(envelope.source_event), authentication: Object.freeze(envelope.authentication) });
}

/** Invoke only the injected public CLI boundary; no task writer is available here. */
export async function dispatchMulticaCommand(request, capabilities = {}) {
  if (typeof capabilities.publicCli !== "function") throw new TypeError("public CLI dispatch capability is required");
  try {
    const result = await capabilities.publicCli(request);
    return Object.freeze({ dispatched: true, result });
  } catch {
    return Object.freeze({ dispatched: false, code: "DISPATCH_FAILED" });
  }
}

/** Retry only the platform projection. Canonical task state is never an input writer. */
export async function projectMulticaStatus(projection, capabilities = {}) {
  if (typeof capabilities.writeStatus !== "function") throw new TypeError("platform status projection capability is required");
  const maxAttempts = Number.isInteger(capabilities.maxAttempts) && capabilities.maxAttempts > 0
    ? capabilities.maxAttempts
    : 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await capabilities.writeStatus(projection);
      return Object.freeze({ dispatched: true, attempts: attempt });
    } catch {
      if (attempt === maxAttempts) {
        return Object.freeze({ dispatched: false, code: "PROJECTION_FAILED", attempts: attempt });
      }
    }
  }
}

export function createMulticaAdapter(capabilities = {}) {
  return createAdapterPort({
    adapterId: "multica",
    adapterVersion: "1.0.0",
    normalizeSource: normalizeMulticaSource,
    authenticateEvent: (request) => authenticateMulticaEvent(request, capabilities),
    dispatch: (request) => dispatchMulticaCommand(request, capabilities),
    projectStatus: (projection) => projectMulticaStatus(projection, capabilities),
  });
}
