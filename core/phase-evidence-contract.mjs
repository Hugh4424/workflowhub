import Ajv2020 from "ajv/dist/2020.js";
import subjectSchema from "../schemas/phase-subject.v1.schema.json" with { type: "json" };
import diffSchema from "../schemas/phase-diff-scan.v1.schema.json" with { type: "json" };
import resultSchema from "../schemas/phase-result.v1.schema.json" with { type: "json" };

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validators = Object.freeze({ subject: ajv.compile(subjectSchema), diff: ajv.compile(diffSchema), result: ajv.compile(resultSchema) });
export function validatePhaseEvidence(kind, value) {
  const validate = validators[kind]; if (!validate) throw new TypeError(`unknown phase evidence kind: ${kind}`);
  if (!validate(value)) throw new TypeError(`phase ${kind} contract invalid: ${ajv.errorsText(validate.errors, { separator: "; " })}`);
  return value;
}
