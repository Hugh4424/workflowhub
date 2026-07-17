const LEGACY_SCHEMAS = new Set(["task-attempt.v2", "task-accepted.v2", "human-confirmation.v1"]);

export function isLegacyRecord(value) {
  return Boolean(value && typeof value === "object" && LEGACY_SCHEMAS.has(value.schema_version));
}

export function readLegacyRecord(raw, { expectedSchema } = {}) {
  let value;
  try { value = JSON.parse(raw); }
  catch (error) { throw new Error(`invalid legacy record JSON: ${error.message}`); }
  if (!isLegacyRecord(value)) throw new Error("record is not a supported read-only legacy schema");
  if (expectedSchema !== undefined && value.schema_version !== expectedSchema) throw new Error(`legacy record schema mismatch: expected ${expectedSchema}`);
  return Object.freeze(structuredClone(value));
}

export function writeLegacyRecord() {
  throw new Error("legacy record writers are permanently disabled");
}
