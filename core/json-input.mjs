const DEFAULT_MAX_BYTES = 1024 * 1024;

export class JsonInputError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "JsonInputError";
    this.code = code;
    this.exitCode = code === "INPUT_TOO_LARGE" || code.startsWith("SCHEMA_") ? 10 : 2;
    this.safeForCli = true;
  }
}

const INPUT_SCHEMA_ID = "https://workflowhub.dev/schemas/cli-input.v1.schema.json";
const INPUT_COMMANDS = new Set(["doctor", "task", "stage", "commit", "close", "release", "routing", "admin-repin", "status"]);

export function assertCliInput(value, { source, command } = {}) {
  const allowed = new Set(["schema_id", "schema_version", "command", "input_source", "payload"]);
  const taskPayloadFields = new Set(["schema_id", "schema_version", "project_name", "task_id", "source_ref", "target_repository_ref", "stage_payload", "operation_payload"]);
  const validObject = value && typeof value === "object" && !Array.isArray(value);
  const payloadObject = value?.payload === undefined || (value.payload && typeof value.payload === "object" && !Array.isArray(value.payload)
    && Object.keys(value.payload).every((key) => taskPayloadFields.has(key)));
  if (!validObject
    || Object.keys(value).some((key) => !allowed.has(key))
    || value.schema_id !== INPUT_SCHEMA_ID
    || value.schema_version !== "1.0.0"
    || !INPUT_COMMANDS.has(value.command)
    || !/^(@-|staging:[A-Za-z0-9._/-]+)$/.test(value.input_source ?? "")
    || !payloadObject) {
    throw new JsonInputError("SCHEMA_INVALID_INPUT", "JSON input does not match cli-input.v1");
  }
  const expectedCommand = command === "admin" ? "admin-repin" : command;
  if (source !== undefined && value.input_source !== source) throw new JsonInputError("SCHEMA_INPUT_SOURCE_MISMATCH", "JSON input source does not match argv");
  if (expectedCommand !== undefined && value.command !== expectedCommand) throw new JsonInputError("SCHEMA_COMMAND_MISMATCH", "JSON input command does not match argv");
  return value;
}

function byteLength(value) {
  return Buffer.isBuffer(value) ? value.byteLength : Buffer.byteLength(String(value ?? ""));
}

export async function readJsonInput({
  source,
  stdin = "",
  authorizedStagingRefs = [],
  stagedPayload,
  stagingLoader,
  maxBytes = DEFAULT_MAX_BYTES,
  command,
} = {}) {
  let raw;
  if (source === "@-") {
    raw = stdin;
  } else if (typeof source === "string" && source.startsWith("staging:")) {
    if (!authorizedStagingRefs.includes(source)) {
      throw new JsonInputError("USAGE_UNAUTHORIZED_STAGING_REF", "staging ref is not launcher-authorized");
    }
    raw = stagedPayload ?? await stagingLoader?.(source);
  } else {
    throw new JsonInputError("USAGE_INVALID_INPUT_SOURCE", "JSON input source must be @- or an authorized staging ref");
  }

  if (raw === undefined || raw === null) throw new JsonInputError("USAGE_INPUT_REQUIRED", "JSON input is required");
  if (byteLength(raw) > maxBytes) throw new JsonInputError("INPUT_TOO_LARGE", `JSON input exceeds ${maxBytes} bytes`);
  try {
    const value = typeof raw === "string" || Buffer.isBuffer(raw) ? JSON.parse(raw.toString()) : raw;
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("root must be an object");
    return assertCliInput(value, { source, command });
  } catch (error) {
    if (error instanceof JsonInputError) throw error;
    throw new JsonInputError("SCHEMA_INVALID_JSON", `invalid JSON input: ${error.message}`);
  }
}

export const JSON_INPUT_MAX_BYTES = DEFAULT_MAX_BYTES;
