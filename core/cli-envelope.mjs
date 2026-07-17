const OUTPUT_SCHEMA_ID = "https://workflowhub.dev/schemas/cli-output.v1.schema.json";

export function okCliEnvelope({ resultRef, exitCode = 0 } = {}) {
  const envelope = {
    schema_id: OUTPUT_SCHEMA_ID,
    schema_version: "1.0.0",
    status: "ok",
    exit_code: exitCode,
  };
  if (resultRef !== undefined) envelope.result_ref = resultRef;
  return Object.freeze(envelope);
}

export function errorCliEnvelope(error) {
  const safe = error?.safeForCli === true;
  return Object.freeze({
    schema_id: OUTPUT_SCHEMA_ID,
    schema_version: "1.0.0",
    status: "error",
    exit_code: safe && Number.isInteger(error?.exitCode) ? error.exitCode : 40,
    error: {
      code: safe && typeof error?.code === "string" ? error.code : "INTERNAL_ERROR",
      message: safe && typeof error?.message === "string" ? error.message : "internal error",
    },
  });
}

export function serializeCliEnvelope(envelope) {
  return `${JSON.stringify(envelope)}\n`;
}
