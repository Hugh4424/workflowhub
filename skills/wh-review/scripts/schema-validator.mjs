import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";

const SCHEMAS = {
  "review-packet": "review-packet.schema.json",
  "review-intent": "review-intent.schema.json",
  "reviewer-output": "reviewer-output.schema.json",
  dispositions: "dispositions.schema.json",
  "round-run-result": "round-run-result.schema.json",
};

// Conditional `required` clauses intentionally target properties declared at
// the schema root, so strictRequired is the one strict check that is not
// applicable. Every other Ajv strict-mode compilation check remains enabled.
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
const validators = new Map();

for (const [name, filename] of Object.entries(SCHEMAS)) {
  const schema = JSON.parse(readFileSync(new URL(`../schemas/${filename}`, import.meta.url), "utf8"));
  ajv.addSchema(schema, filename);
  validators.set(name, ajv.getSchema(filename));
}

function escapePointer(value) {
  return String(value).replaceAll("~", "~0").replaceAll("/", "~1");
}

function errorPointer(error) {
  if (error.keyword === "required") return `${error.instancePath}/${escapePointer(error.params.missingProperty)}`;
  if (error.keyword === "additionalProperties") return `${error.instancePath}/${escapePointer(error.params.additionalProperty)}`;
  return error.instancePath || "";
}

export class SchemaValidationError extends Error {
  constructor(schema, error) {
    const pointer = errorPointer(error);
    super(`SCHEMA_VALIDATION_FAILED ${schema} ${pointer || "/"} ${error.keyword}`);
    this.name = "SchemaValidationError";
    this.code = "SCHEMA_VALIDATION_FAILED";
    this.schema = schema;
    this.pointer = pointer;
  }
}

export const compiledSchemaNames = Object.freeze([...validators.keys()]);

export function validateSchema(name, value) {
  const validate = validators.get(name);
  if (!validate) throw new TypeError(`unknown schema: ${name}`);
  if (!validate(value)) {
    const error = validate.errors.find((item) => item.keyword === "additionalProperties") ?? validate.errors[0];
    throw new SchemaValidationError(name, error);
  }
  return value;
}
