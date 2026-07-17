import { contentHash, createCanonicalSource } from "../../core/canonical-source.mjs";
import { createAdapterPort } from "../port.mjs";

const HASH = /^[a-f0-9]{64}$/;
const DECISIONS = new Set(["accepted", "rejected", "timeout"]);

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} is required`);
  return value;
}

export function normalizeOfflineSource(input) {
  const source = requireObject(input, "offline source");
  return createCanonicalSource({ source_type: "offline-fixture", source_id: source.source_id, revision: source.revision, completeness: source.completeness, requirements: source.requirements, evidence_refs: source.evidence_refs ?? [] });
}

function requiredString(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} is required`);
  return value;
}

export async function authenticateOfflineEvent(request, capabilities = {}) {
  const eventRef = requiredString(request?.event_ref, "event_ref");
  if (typeof capabilities.readEvent !== "function" || typeof capabilities.verifyHumanEvent !== "function") {
    throw new TypeError("offline readEvent and event verification capabilities are required");
  }
  const event = requireObject(await capabilities.readEvent(eventRef), "human event readback");
  if (event.ref !== eventRef) throw new Error("offline human event identity mismatch");
  const verified = await capabilities.verifyHumanEvent(event);
  if (!verified?.authenticated) throw new Error("offline human event authentication failed");
  const actorId = requiredString(verified.actor_id, "stable human actor id");
  if (verified.actor_type !== "human") throw new Error("offline human event actor must be human");
  if (!DECISIONS.has(verified.decision)) throw new Error("offline human event decision is invalid");
  const occurredAt = requiredString(verified.occurred_at, "source event occurred_at");
  const verifiedAt = requiredString(verified.verified_at, "authentication verified_at");
  if (!Number.isFinite(Date.parse(occurredAt)) || !Number.isFinite(Date.parse(verifiedAt))) throw new TypeError("offline event timestamps must be date-time values");
  const eventHash = requiredString(verified.sha256, "source event sha256");
  const proofHash = requiredString(verified.proof_hash, "authentication proof_hash");
  if (!HASH.test(eventHash) || !HASH.test(proofHash) || !HASH.test(request?.bound_hash ?? "")) throw new TypeError("offline confirmation hashes must be sha256 hashes");
  const envelope = {
    schema_id: "https://workflowhub.dev/schemas/human-confirmation-envelope.v1.schema.json",
    schema_version: "1.0.0",
    purpose: requiredString(request?.purpose, "confirmation purpose"),
    task_id: requiredString(request?.task_id, "confirmation task_id"),
    bound_ref: requiredString(request?.bound_ref, "confirmation bound_ref"),
    bound_hash: request.bound_hash,
    actor: Object.freeze({ id: actorId, type: "human" }),
    source_event: Object.freeze({ ref: eventRef, sha256: eventHash, occurred_at: occurredAt }),
    authentication: { method: "signature", verified_at: verifiedAt, proof_ref: requiredString(verified.proof_ref, "authentication proof_ref"), proof_hash: proofHash, signature: "0".repeat(64) },
    decision: verified.decision,
    confirmed_at: verifiedAt,
  };
  if (typeof capabilities.signConfirmation !== "function") throw new TypeError("offline trusted signConfirmation capability is required");
  envelope.authentication.signature = await capabilities.signConfirmation(envelope);
  if (!HASH.test(envelope.authentication.signature)) throw new TypeError("offline confirmation signature must be a sha256-sized HMAC");
  return Object.freeze({ ...envelope, actor: Object.freeze(envelope.actor), source_event: Object.freeze(envelope.source_event), authentication: Object.freeze(envelope.authentication) });
}

export async function dispatchOfflineCommand(request, capabilities = {}) {
  requireObject(request, "public CLI command");
  if (typeof capabilities.publicCli !== "function") throw new TypeError("public CLI dispatch capability is required");
  return capabilities.publicCli(request);
}

export async function projectOfflineStatus(projection, capabilities = {}) {
  requireObject(projection, "canonical status");
  if (typeof capabilities.projectStatus !== "function") throw new TypeError("status projection capability is required");
  try {
    return { dispatched: true, projection: await capabilities.projectStatus(projection) };
  } catch (error) {
    return { dispatched: false, canonical_stage_changed: false, diagnostic: error?.code ?? "STATUS_PROJECTION_FAILED" };
  }
}

export function createOfflineAdapter(capabilities = {}) {
  return createAdapterPort({
    adapterId: "offline-fixture",
    adapterVersion: "1.0.0",
    normalizeSource: normalizeOfflineSource,
    authenticateEvent: (request) => authenticateOfflineEvent(request, capabilities),
    dispatch: (request) => dispatchOfflineCommand(request, capabilities),
    projectStatus: (projection) => projectOfflineStatus(projection, capabilities),
  });
}

export function createOfflineSourceEnvelope(sourceRef, payload) {
  if (typeof sourceRef !== "string" || sourceRef.length === 0) throw new TypeError("sourceRef is required");
  return Object.freeze({ schema_id: "https://workflowhub.dev/schemas/source-envelope.v1.schema.json", schema_version: "1.0.0", source_type: "offline-fixture", source_ref: sourceRef, payload_hash: contentHash(payload) });
}
