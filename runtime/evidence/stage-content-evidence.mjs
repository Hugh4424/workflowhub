import { createHash } from "node:crypto";

import Ajv2020 from "ajv/dist/2020.js";

import envelopeSchema from "../schemas/stage-content-evidence.v1.json" with { type: "json" };
import interactionSchema from "../schemas/interaction-completion.v1.json" with { type: "json" };
import ambiguitySchema from "../schemas/ambiguity-ledger.v1.json" with { type: "json" };
import ambiguityV2Schema from "../schemas/ambiguity-ledger.v2.json" with { type: "json" };
import decisionEntrySchema from "../schemas/decision-entry.v1.json" with { type: "json" };
import decisionCoverageSchema from "../schemas/decision-coverage-audit.v1.json" with { type: "json" };
import omissionSchema from "../schemas/decision-omission-acceptance.v1.json" with { type: "json" };
import correctionSchema from "../schemas/decision-correction-appendix.v1.json" with { type: "json" };
import decisionLogSchema from "../schemas/decision-log-contract.v1.json" with { type: "json" };
import planTaskSchema from "../schemas/plan-task-contract.v1.json" with { type: "json" };
import planTaskV2Schema from "../schemas/plan-task-contract.v2.json" with { type: "json" };
import completionSchema from "../schemas/stage-completion-facts.v1.json" with { type: "json" };
import browserQaSchema from "../schemas/browser-qa-evidence.v1.json" with { type: "json" };
import { validateAmbiguityLedgerV2, validateInteractionQuestionBatch } from "../stage/stage-content-contracts.mjs";
import { assertTaskHandle } from "../task/task-handle.mjs";

const HASH = /^[a-f0-9]{64}$/;
const TREE = /^[a-f0-9]{40}$/i;
const EVIDENCE_REF = /^evidence\/stage-content\/[a-f0-9]{64}\/[a-z0-9][a-z0-9.-]*\.json$/;
const HOST_VISIBLE_REF = Object.freeze({
  ask: /^host-message:\/\/ask\/[a-zA-Z0-9][a-zA-Z0-9._~/-]*$/,
  reply: /^host-message:\/\/reply\/[a-zA-Z0-9][a-zA-Z0-9._~/-]*$/,
  rerank: /^host-message:\/\/rerank\/[a-zA-Z0-9][a-zA-Z0-9._~/-]*$/,
});
const payloadSchemas = new Map([
  ["interaction-completion.v1", interactionSchema],
  ["ambiguity-ledger.v1", ambiguitySchema],
  ["ambiguity-ledger.v2", ambiguityV2Schema],
  ["decision-entry.v1", decisionEntrySchema],
  ["decision-coverage-audit.v1", decisionCoverageSchema],
  ["decision-omission-acceptance.v1", omissionSchema],
  ["decision-correction-appendix.v1", correctionSchema],
  ["decision-log-contract.v1", decisionLogSchema],
  ["plan-task-contract.v1", planTaskSchema],
  ["plan-task-contract.v2", planTaskV2Schema],
  ["stage-completion-facts.v1", completionSchema],
  ["browser-qa-evidence.v1", browserQaSchema],
]);
const ajv = new Ajv2020({ allErrors: true, strict: false, formats: { "date-time": true } });
const validateEnvelope = ajv.compile(envelopeSchema);
const payloadValidators = new Map([...payloadSchemas].map(([kind, schema]) => [kind, ajv.compile(schema)]));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function schemaErrors(validate) {
  return (validate.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message}`).join("; ");
}

function requireBinding(value, label) {
  if (!value || typeof value !== "object"
      || typeof value.ref !== "string" || value.ref.trim() === ""
      || !HASH.test(value.hash ?? "")) {
    throw new TypeError(`${label} must contain a non-empty ref and sha256 hash`);
  }
}

function requireHostVisibleBinding(value, event, label) {
  requireBinding(value, label);
  if (!HOST_VISIBLE_REF[event].test(value.ref)) {
    throw new TypeError(`${label}.ref must use the host-message://${event}/ scheme`);
  }
}

function validateCandidateQueue(queue, label) {
  if (!Array.isArray(queue)) throw new TypeError(`${label} candidate_queue must be an array`);
  const seen = new Set();
  for (const [index, item] of queue.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)
        || typeof item.item_id !== "string" || item.item_id.trim() === ""
        || !new Set(["high", "medium", "low"]).has(item.impact)
        || !new Set(["asked", "answered", "evidence-resolved", "not-applicable", "non-blocking", "open"]).has(item.status)
        || typeof item.reason !== "string" || item.reason.trim() === "") {
      throw new TypeError(`${label} candidate_queue item ${index + 1} is incomplete`);
    }
    if (seen.has(item.item_id)) throw new TypeError(`${label} candidate_queue contains a duplicate item_id`);
    seen.add(item.item_id);
  }
}

function validateTalkQuestion(question, label) {
  if (!question || typeof question !== "object" || Array.isArray(question)
      || typeof question.question_id !== "string" || question.question_id.trim() === ""
      || !Number.isInteger(question.question_number) || question.question_number < 1
      || !HASH.test(question.card_hash ?? "")) {
    throw new TypeError(`${label} must bind a question id, question number, and card hash`);
  }
  for (const event of ["ask", "reply", "rerank"]) {
    requireHostVisibleBinding(question[event], event, `${label}.${event}`);
  }
}

function validatePersistedInteractionBatch(questions, interactionType, label, batchVersion = null) {
  // Older immutable records only contain question ids/card bindings. Keep
  // those records readable. New records must opt into the shared contract
  // explicitly; content sniffing is not a compatibility discriminator.
  if (batchVersion === undefined || batchVersion === null) return null;
  if (batchVersion !== "rich-v1") throw new TypeError(`${label} question_batch_version is unsupported: ${batchVersion}`);
  if (!Array.isArray(questions)) throw new TypeError(`${label} question batch is required for question_batch_version=rich-v1`);
  const batch = validateInteractionQuestionBatch(questions, { interactionType });
  if (!batch.ok) throw new TypeError(`${label} question batch is invalid: ${batch.errors.join("; ")}`);
  return batch;
}

function hasRichQuestionBatch(payload) {
  return payload?.question_batch_version === "rich-v1";
}

function validateQuestionBatchVersion(payload) {
  if (Object.prototype.hasOwnProperty.call(payload ?? {}, "question_batch_version")
      && payload.question_batch_version !== "rich-v1") {
    throw new TypeError(`interaction question_batch_version is unsupported: ${payload.question_batch_version}`);
  }
}

function validateGrillFacts(grill) {
  if (!grill || typeof grill !== "object" || Array.isArray(grill)) {
    throw new TypeError("grill interaction requires complete exit facts");
  }
  if (!new Set(["changed", "no-change"]).has(grill.context?.status)
      || typeof grill.context?.reason !== "string" || grill.context.reason.trim() === "") {
    throw new TypeError("grill context exit fact is incomplete");
  }
  if (!new Set(["created", "not-needed"]).has(grill.adr?.status)
      || typeof grill.adr?.reason !== "string" || grill.adr.reason.trim() === "") {
    throw new TypeError("grill ADR exit fact is incomplete");
  }
  if (!new Set(["resolved", "none"]).has(grill.conflicts?.status)
      || typeof grill.conflicts?.reason !== "string" || grill.conflicts.reason.trim() === "") {
    throw new TypeError("grill conflict exit fact is incomplete");
  }
  if (!Array.isArray(grill.file_references)
      || grill.file_references.some((ref) => typeof ref !== "string" || ref.trim() === "")) {
    throw new TypeError("grill file reference exit fact is incomplete");
  }
  if (grill.file_references.length === 0
      && (typeof grill.no_file_reason !== "string" || grill.no_file_reason.trim() === "")) {
    throw new TypeError("grill requires file_references or an explicit no_file_reason");
  }
  const checks = grill.exit_checks;
  if (!checks || typeof checks !== "object"
      || checks.context_checked !== true || checks.adr_checked !== true
      || checks.conflicts_checked !== true || checks.file_references_checked !== true) {
    throw new TypeError("grill requires all four exit checks");
  }
}

function validateInteractionSemantics(payload) {
  validateQuestionBatchVersion(payload);
  if (payload.interaction_type === "talk") {
    if (!Array.isArray(payload.rounds) || payload.rounds.length !== 1) {
      throw new TypeError("talk interaction must contain exactly one round");
    }
    const round = payload.rounds[0];
    if (!round || typeof round !== "object" || Array.isArray(round)
        || !Number.isInteger(round.round_number) || round.round_number < 1 || round.round_number > 3
        || !Array.isArray(round.questions)) {
      throw new TypeError("talk interaction round number/questions are invalid");
    }
    validateCandidateQueue(round.candidate_queue, `talk round ${round.round_number}`);
    if (!Number.isInteger(round.questions_already_asked) || round.questions_already_asked < 0
        || !Number.isInteger(round.open_direction_changing_questions) || round.open_direction_changing_questions < 0
        || !Number.isInteger(round.current_total) || round.current_total < 0
        || round.current_total !== round.questions_already_asked + round.open_direction_changing_questions
        || typeof round.end_reason !== "string" || round.end_reason.trim() === "") {
      throw new TypeError(`talk round ${round.round_number} queue totals/end_reason are incomplete`);
    }
    const openItems = round.candidate_queue.filter((item) => item.status === "open").length;
    if (openItems !== round.open_direction_changing_questions) {
      throw new TypeError(`talk round ${round.round_number} candidate_queue/open count mismatch`);
    }
    if (round.questions.length === 0) {
      if (typeof round.zero_question_reason !== "string" || round.zero_question_reason.trim() === ""
          || round.questions_already_asked !== 0 || round.open_direction_changing_questions !== 0
          || round.current_total !== 0) {
        throw new TypeError("zero-question talk round requires an explicit factual reason and closed queue");
      }
    } else {
      if (round.zero_question_reason !== null) throw new TypeError("answered talk round cannot claim a zero-question reason");
      if (hasRichQuestionBatch(payload)) {
        validatePersistedInteractionBatch(round.questions, "Talk", `talk round ${round.round_number}`, payload.question_batch_version);
      }
      round.questions.forEach((question, index) => validateTalkQuestion(question, `talk question ${index + 1}`));
      if (round.questions_already_asked !== round.questions.length
          || round.questions.some((question, index) => question.question_number !== index + 1)) {
        throw new TypeError("talk round question count/order does not match queue facts");
      }
    }
    if (payload.grill !== null) throw new TypeError("talk interaction cannot contain grill facts");
    return;
  }
  if (payload.interaction_type === "grill" || payload.interaction_type === "grill-revalidation") {
    if (!Array.isArray(payload.rounds) || payload.rounds.length !== 0) {
      throw new TypeError("grill interaction cannot contain talk rounds");
    }
    validateGrillFacts(payload.grill);
    if (payload.interaction_type === "grill-revalidation") {
      requireBinding(payload.previous_grill, "grill revalidation previous grill");
      requireBinding(payload.material_revision, "grill revalidation material revision");
      if (payload.supersedes_revalidation !== undefined) {
        requireBinding(payload.supersedes_revalidation, "superseded grill revalidation");
      }
    }
    const questions = payload.grill?.questions ?? payload.grill?.frontier_questions;
    if (hasRichQuestionBatch(payload) && questions === undefined) {
      throw new TypeError("rich grill interaction requires a persisted question batch");
    }
    if (questions !== undefined && hasRichQuestionBatch(payload)) validatePersistedInteractionBatch(questions, "Grill", "grill", payload.question_batch_version);
    return;
  }
  if (payload.interaction_type === "spec-clarify") {
    if (!Array.isArray(payload.rounds)) throw new TypeError("spec-clarify interaction requires rounds");
    for (const [index, round] of payload.rounds.entries()) {
      if (!hasRichQuestionBatch(payload)) continue;
      if (Array.isArray(round?.questions) && round.questions.length === 0) {
        if (typeof round.zero_question_reason !== "string" || round.zero_question_reason.trim() === "") {
          throw new TypeError(`spec-clarify round ${index + 1} zero-question terminal requires an explicit reason`);
        }
        continue;
      }
      validatePersistedInteractionBatch(round?.questions, "Clarify", `spec-clarify round ${index + 1}`, payload.question_batch_version);
    }
    return;
  }
  if (payload.interaction_type === "aggregate") {
    if (!Array.isArray(payload.rounds) || payload.rounds.length !== 3) {
      throw new TypeError("interaction aggregate requires exactly three ordered talk rounds");
    }
    payload.rounds.forEach((binding, index) => requireBinding(binding, `aggregate talk round ${index + 1}`));
    requireBinding(payload.grill, "aggregate grill");
  }
}

function validatePayload(kind, payload) {
  const validate = payloadValidators.get(kind);
  if (!validate) throw new TypeError(`unknown stage content evidence kind: ${kind}`);
  if (!validate(payload)) throw new TypeError(`${kind} payload does not match its schema: ${schemaErrors(validate)}`);
  if (kind === "interaction-completion.v1") validateInteractionSemantics(payload);
  if (kind === "ambiguity-ledger.v2") {
    const contract = validateAmbiguityLedgerV2(payload);
    if (!contract.ok) throw new TypeError(`${kind} payload violates identity contract: ${contract.errors.join("; ")}`);
  }
}

/** Validate one complete browser QA observation without publishing a second record. */
export function validateBrowserQaEvidence(value) {
  validatePayload("browser-qa-evidence.v1", value);
  return Object.freeze(value);
}

function validateValue(value) {
  if (!validateEnvelope(value)) throw new Error(`stage content envelope is invalid: ${schemaErrors(validateEnvelope)}`);
  validatePayload(value.kind, value.payload);
  if (value.content_hash !== sha256(JSON.stringify(value.payload))) throw new Error("stage content payload hash mismatch");
  return value;
}

// Historical stage-content records are readable only through an explicit
// immutable ref/hash pair. vNext stage code must not discover a "latest"
// projection; it uses the four current materials and quality/ facts instead.
export function verifyStageContentEvidence({
  task, ref, hash, expectedStage, expectedRunId, expectedTree, expectedKind,
} = {}) {
  const safeTask = assertTaskHandle(task);
  if (!EVIDENCE_REF.test(ref ?? "")) throw new TypeError("stage content evidence ref is invalid");
  if (!HASH.test(hash ?? "")) throw new TypeError("stage content evidence hash is invalid");
  const raw = safeTask.readRecord(ref);
  if (sha256(raw) !== hash) throw new Error("stage content evidence integrity hash mismatch");
  let value;
  try { value = JSON.parse(raw); }
  catch { throw new Error("stage content evidence is not valid JSON"); }
  validateValue(value);
  if (value.task_id !== safeTask.identity.taskId) throw new Error("stage content evidence task binding mismatch");
  if (expectedStage !== undefined && value.stage !== expectedStage) throw new Error("stage content evidence stage binding mismatch");
  if (expectedRunId !== undefined && value.workflow_run_id !== expectedRunId) throw new Error("stage content evidence run binding mismatch");
  if (expectedTree !== undefined && (!TREE.test(expectedTree) || value.snapshot_tree !== expectedTree)) {
    throw new Error("stage content evidence snapshot tree binding mismatch");
  }
  if (expectedKind !== undefined && value.kind !== expectedKind) throw new Error("stage content evidence kind binding mismatch");
  return Object.freeze(value);
}
