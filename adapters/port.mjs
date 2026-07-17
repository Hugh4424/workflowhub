export const ADAPTER_PORT_VERSION = "1.0.0";
export const ADAPTER_ENVELOPE_SCHEMA_ID = "https://workflowhub.dev/schemas/adapter-envelope.v1.schema.json";

const SOURCE_ENVELOPE_SCHEMA_ID = "https://workflowhub.dev/schemas/source-envelope.v1.schema.json";
const OPERATIONS = new Set(["normalize-source", "authenticate-event", "dispatch", "project-status"]);
const PORT_KEYS = new Set([
  "adapterId",
  "adapterVersion",
  "normalizeSource",
  "authenticateEvent",
  "dispatch",
  "projectStatus",
]);
const SOURCE_KEYS = new Set(["schema_id", "schema_version", "source_type", "source_ref", "payload_hash"]);
const REQUEST_KEYS = new Set([
  "schema_id",
  "schema_version",
  "adapter_id",
  "adapter_version",
  "operation",
  "source_ref",
]);

function contractError(message) {
  return new Error(`ADAPTER_CONTRACT_INVALID: ${message}`);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertExactKeys(value, allowed, label) {
  if (!isRecord(value)) throw contractError(`${label} must be an object`);
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) throw contractError(`${label} contains private or unknown fields: ${unknown.join(", ")}`);
}

function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || value.length === 0) throw contractError(`${label} must be a non-empty string`);
}

function assertSemanticVersion(value, label) {
  if (typeof value !== "string" || !/^\d+\.\d+\.\d+$/.test(value)) {
    throw contractError(`${label} must be an exact semantic version`);
  }
}

export function validateAdapterEnvelope(request) {
  assertExactKeys(request, REQUEST_KEYS, "adapter envelope");
  if (request.schema_id !== ADAPTER_ENVELOPE_SCHEMA_ID || request.schema_version !== "1.0.0") {
    throw contractError("unsupported adapter envelope schema");
  }
  assertNonEmptyString(request.adapter_id, "adapter_id");
  assertSemanticVersion(request.adapter_version, "adapter_version");
  if (!OPERATIONS.has(request.operation)) throw contractError("unsupported adapter operation");
  assertNonEmptyString(request.source_ref, "source_ref");
  return request;
}

export function validateCanonicalSource(source, expectedSourceRef) {
  assertExactKeys(source, SOURCE_KEYS, "canonical source");
  if (source.schema_id !== SOURCE_ENVELOPE_SCHEMA_ID || source.schema_version !== "1.0.0") {
    throw contractError("unsupported source envelope schema");
  }
  if (source.source_type !== "multica" && source.source_type !== "offline-fixture") {
    throw contractError("unsupported canonical source type");
  }
  assertNonEmptyString(source.source_ref, "source.source_ref");
  if (expectedSourceRef !== undefined && source.source_ref !== expectedSourceRef) {
    throw contractError("source_ref does not match adapter envelope");
  }
  if (typeof source.payload_hash !== "string" || !/^[a-f0-9]{64}$/.test(source.payload_hash)) {
    throw contractError("payload_hash must be a lowercase SHA-256 digest");
  }
  return source;
}

export function createAdapterPort(definition) {
  assertExactKeys(definition, PORT_KEYS, "adapter port definition");
  assertNonEmptyString(definition.adapterId, "adapterId");
  assertSemanticVersion(definition.adapterVersion, "adapterVersion");
  for (const method of ["normalizeSource", "authenticateEvent", "dispatch", "projectStatus"]) {
    if (typeof definition[method] !== "function") throw contractError(`${method} must be a function`);
  }

  return Object.freeze({
    adapterId: definition.adapterId,
    adapterVersion: definition.adapterVersion,
    portVersion: ADAPTER_PORT_VERSION,
    normalizeSource: definition.normalizeSource,
    authenticateEvent: definition.authenticateEvent,
    dispatch: definition.dispatch,
    projectStatus: definition.projectStatus,
  });
}

function publicDispatcher(publicCli) {
  if (typeof publicCli === "function") return publicCli;
  if (isRecord(publicCli) && typeof publicCli.dispatch === "function") {
    return publicCli.dispatch.bind(publicCli);
  }
  throw contractError("dispatch requires the public CLI capability");
}

export async function dispatchAdapterEvent({
  request,
  source,
  publicCli,
  maliciousExtension,
  injectCrash,
} = {}) {
  validateAdapterEnvelope(request);
  if (request.operation !== "dispatch") throw contractError("dispatch requires operation=dispatch");
  if (maliciousExtension !== undefined) {
    throw contractError("adapter authority extension is forbidden");
  }
  if (source !== undefined) validateCanonicalSource(source, request.source_ref);
  if (injectCrash === "dispatch") {
    return Object.freeze({ source, dispatched: false, canonical_stage_changed: false });
  }

  if (source === undefined) throw contractError("dispatch requires a canonical source");
  const dispatch = publicDispatcher(publicCli);
  const result = await dispatch(Object.freeze({ request, source }));
  if (Number.isInteger(result?.exit_code) && result.exit_code !== 0) {
    return Object.freeze({ source, dispatched: false, canonical_stage_changed: false, result });
  }
  return Object.freeze({ source, dispatched: true, result });
}
