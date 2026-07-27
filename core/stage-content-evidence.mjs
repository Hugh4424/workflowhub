import { createHash } from "node:crypto";

import Ajv2020 from "ajv/dist/2020.js";

import envelopeSchema from "./schemas/stage-content-evidence.v1.json" with { type: "json" };
import interactionSchema from "./schemas/interaction-completion.v1.json" with { type: "json" };
import ambiguitySchema from "./schemas/ambiguity-ledger.v1.json" with { type: "json" };
import decisionEntrySchema from "./schemas/decision-entry.v1.json" with { type: "json" };
import decisionCoverageSchema from "./schemas/decision-coverage-audit.v1.json" with { type: "json" };
import omissionSchema from "./schemas/decision-omission-acceptance.v1.json" with { type: "json" };
import correctionSchema from "./schemas/decision-correction-appendix.v1.json" with { type: "json" };
import decisionLogSchema from "./schemas/decision-log-contract.v1.json" with { type: "json" };
import planTaskSchema from "./schemas/plan-task-contract.v1.json" with { type: "json" };
import completionSchema from "./schemas/stage-completion-facts.v1.json" with { type: "json" };
import { assertTaskHandle } from "./task-handle.mjs";
import { createTaskKernel } from "./task-kernel.mjs";
import { captureGitWorktreeSnapshot } from "./git-worktree-snapshot.mjs";
import { assertCandidateWorkspace, assertWorkspace } from "./workspace.mjs";

const STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const HASH = /^[a-f0-9]{64}$/;
const TREE = /^[a-f0-9]{40}$/i;
const EVIDENCE_REF = /^evidence\/stage-content\/[a-f0-9]{64}\/[a-z0-9][a-z0-9.-]*\.json$/;
const DECISION_LOG_REF = /^receipts\/decision-log\/([a-f0-9]{64})\.md$/;
const HOST_VISIBLE_REF = Object.freeze({
  ask: /^host-message:\/\/ask\/[a-zA-Z0-9][a-zA-Z0-9._~/-]*$/,
  reply: /^host-message:\/\/reply\/[a-zA-Z0-9][a-zA-Z0-9._~/-]*$/,
  rerank: /^host-message:\/\/rerank\/[a-zA-Z0-9][a-zA-Z0-9._~/-]*$/,
});
const REVISIONABLE_KINDS = new Set([
  "ambiguity-ledger.v1", "decision-entry.v1", "decision-coverage-audit.v1",
  "decision-omission-acceptance.v1", "decision-correction-appendix.v1",
  "decision-log-contract.v1", "plan-task-contract.v1", "stage-completion-facts.v1",
]);
const revisionable = (kind, payload) => REVISIONABLE_KINDS.has(kind)
  || (kind === "interaction-completion.v1" && payload?.interaction_type === "aggregate");
const FORBIDDEN_IDENTITY_KEYS = new Set([
  "task_id", "stage", "workflow_run_id", "producer",
  "snapshot_head", "snapshot_tree", "snapshot_commit",
  "root", "task_path", "taskPath", "cwd", "repository", "repo_root",
]);
const PRIVATE_KEYS = /^(?:private(?:_|$)|secret(?:_|$)|token$|password$|authorization$|cookie$|full_card$|session(?:_|$)|api_?key$)/i;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const payloadSchemas = new Map([
  ["interaction-completion.v1", interactionSchema],
  ["ambiguity-ledger.v1", ambiguitySchema],
  ["decision-entry.v1", decisionEntrySchema],
  ["decision-coverage-audit.v1", decisionCoverageSchema],
  ["decision-omission-acceptance.v1", omissionSchema],
  ["decision-correction-appendix.v1", correctionSchema],
  ["decision-log-contract.v1", decisionLogSchema],
  ["plan-task-contract.v1", planTaskSchema],
  ["stage-completion-facts.v1", completionSchema],
]);
const REQUIRED_STAGE_CONTENT_KINDS = Object.freeze({
  "make-decision": Object.freeze(["interaction-completion.v1", "decision-coverage-audit.v1"]),
  "build-spec": Object.freeze([]),
  "build-plan": Object.freeze([]),
  "build-code": Object.freeze([]),
  "verify-code": Object.freeze([]),
});
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateEnvelope = ajv.compile(envelopeSchema);
const payloadValidators = new Map([...payloadSchemas].map(([kind, schema]) => [kind, ajv.compile(schema)]));

function plain(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

function validateRunId(value) {
  if (typeof value !== "string" || value.trim() === "" || value.length > 256 || /[\u0000-\u001f]/.test(value)) {
    throw new TypeError("workflowRunId must be non-empty controlled text");
  }
  return value;
}

function workspaceCapability(value) {
  try { return assertWorkspace(value); }
  catch (workspaceError) {
    try { return assertCandidateWorkspace(value); }
    catch { throw workspaceError; }
  }
}

function captureSnapshot(workspace) {
  return typeof workspace.captureSnapshot === "function"
    ? workspace.captureSnapshot()
    : captureGitWorktreeSnapshot(workspace.worktreeRoot);
}

function readOptional(task, ref) {
  try { return task.readRecord(ref); }
  catch (error) {
    if (error?.code === "ENOENT") return undefined;
    throw error;
  }
}

function rejectIdentityKeys(value, label, allowEvidenceBinding = false) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => rejectIdentityKeys(entry, `${label}[${index}]`, allowEvidenceBinding));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const isAggregateRoundBinding = allowEvidenceBinding
      && (/^payload\.rounds\[\d+\]$/.test(label) || label === "payload.grill")
      && (key === "ref" || key === "hash");
    const isDecisionCoverageLocation = /^payload\.items\[\d+\]\.decision_location$/.test(label)
      && key === "ref";
    if ((FORBIDDEN_IDENTITY_KEYS.has(key) || ((key === "ref" || key === "hash") && label === "payload"))
      && !isAggregateRoundBinding && !isDecisionCoverageLocation) {
      throw new TypeError(`${label}.${key} is a caller-forbidden identity or path field`);
    }
    rejectIdentityKeys(child, `${label}.${key}`, allowEvidenceBinding);
  }
}

function minimize(value) {
  if (Array.isArray(value)) return value.map(minimize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !PRIVATE_KEYS.test(key))
    .map(([key, child]) => [key, minimize(child)]));
}

function schemaErrors(validate) {
  return (validate.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message}`).join("; ");
}

function validatePayload(kind, payload) {
  const validate = payloadValidators.get(kind);
  if (!validate) throw new TypeError(`unknown stage content evidence kind: ${kind}`);
  if (!validate(payload)) throw new TypeError(`${kind} payload does not match its schema: ${schemaErrors(validate)}`);
  if (kind === "interaction-completion.v1") validateInteractionSemantics(payload);
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
      if (typeof round.zero_question_reason !== "string" || round.zero_question_reason.trim() === "") {
        throw new TypeError("zero-question talk round requires an explicit factual reason");
      }
      if (round.questions_already_asked !== 0 || round.open_direction_changing_questions !== 0
        || round.current_total !== 0) {
        throw new TypeError("zero-question talk round requires a closed zero-total candidate queue");
      }
    } else {
      if (round.zero_question_reason !== null) {
        throw new TypeError("answered talk round cannot claim a zero-question reason");
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
  if (payload.interaction_type === "grill") {
    if (!Array.isArray(payload.rounds) || payload.rounds.length !== 0) {
      throw new TypeError("grill interaction cannot contain talk rounds");
    }
    validateGrillFacts(payload.grill);
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

function validateValue(value) {
  if (!validateEnvelope(value)) throw new Error(`stage content envelope is invalid: ${schemaErrors(validateEnvelope)}`);
  validatePayload(value.kind, value.payload);
  if (value.content_hash !== sha256(JSON.stringify(value.payload))) throw new Error("stage content payload hash mismatch");
  return value;
}

export function createStageContentEvidenceWriter(options = {}) {
  plain(options, "stage content writer options");
  const allowed = new Set(["task", "workspace", "stage", "workflowRunId", "now"]);
  const unexpected = Object.keys(options).filter((key) => !allowed.has(key));
  if (unexpected.length) throw new TypeError(`stage content writer caller fields are forbidden: ${unexpected.join(", ")}`);
  const task = assertTaskHandle(options.task);
  const workspace = workspaceCapability(options.workspace);
  const stage = options.stage;
  if (!STAGES.has(stage)) throw new TypeError(`unsupported stage content stage: ${stage}`);
  const workflowRunId = validateRunId(options.workflowRunId);
  const now = options.now ?? (() => new Date().toISOString());
  if (typeof now !== "function") throw new TypeError("stage content writer now must be a function");
  const kernel = createTaskKernel(task);
  const refRoot = `evidence/stage-content/${sha256(`${task.identity.taskId}\0${stage}\0${workflowRunId}`)}`;

  function interactionRef(payload) {
    const type = payload.interaction_type;
    if (type === "grill" || type === "aggregate") {
      return `${refRoot}/interaction-completion.${type}.json`;
    }
    const prefix = `${refRoot}/interaction-completion.${type}-`;
    const limit = type === "talk" ? 3 : 9999;
    for (let sequence = 1; sequence <= limit; sequence += 1) {
      const candidate = `${prefix}${String(sequence).padStart(4, "0")}.json`;
      const existing = readOptional(task, candidate);
      if (existing === undefined) return candidate;
      try {
        const value = JSON.parse(existing);
        if (value.kind === "interaction-completion.v1"
          && value.content_hash === sha256(JSON.stringify(payload))) return candidate;
      } catch {
        throw new Error(`existing interaction evidence is invalid: ${candidate}`);
      }
    }
    throw new Error(`${type} interaction sequence is complete for this workflow run`);
  }

  function validateAggregateBindings(payload) {
    if (payload.interaction_type !== "aggregate") return;
    const questionIds = new Set();
    const hostMessageRefs = new Set();
    let preGrillTree;
    const bindings = [
      ...payload.rounds.map((binding, index) => [`round ${index + 1}`, binding, "talk", index + 1]),
      ["grill", payload.grill, "grill", null],
    ];
    for (const [label, binding, expectedType, expectedRound] of bindings) {
      if (!binding || typeof binding !== "object"
        || Object.keys(binding).some((key) => key !== "ref" && key !== "hash")
        || !EVIDENCE_REF.test(binding.ref ?? "")
        || !HASH.test(binding.hash ?? "")) {
        throw new TypeError(`aggregate ${label} binding must contain only a canonical ref and hash`);
      }
      const child = verifyStageContentEvidence({
        task,
        ref: binding.ref,
        hash: binding.hash,
        expectedStage: stage,
        expectedRunId: workflowRunId,
        ...(expectedType === "grill" ? { expectedTree: payload.workspace_tree } : {}),
        expectedKind: "interaction-completion.v1",
      });
      if (child.payload?.interaction_type !== expectedType) {
        throw new Error(`aggregate ${label} binds the wrong interaction type`);
      }
      if (expectedRound !== null && child.payload.rounds?.[0]?.round_number !== expectedRound) {
        throw new Error(`aggregate ${label} is out of order`);
      }
      if (expectedType === "talk") {
        if (child.payload?.workspace_tree !== child.snapshot_tree) {
          throw new Error(`aggregate ${label} payload tree binding mismatch`);
        }
        if (preGrillTree === undefined) preGrillTree = child.snapshot_tree;
        else if (child.snapshot_tree !== preGrillTree) {
          throw new Error("interaction aggregate talk rounds must bind one common pre-grill tree");
        }
        for (const question of child.payload.rounds[0].questions) {
          if (questionIds.has(question.question_id)) {
            throw new Error("interaction aggregate question_id values must be globally unique");
          }
          questionIds.add(question.question_id);
          for (const event of ["ask", "reply", "rerank"]) {
            const hostRef = question[event].ref;
            if (hostMessageRefs.has(hostRef)) {
              throw new Error("interaction aggregate host-message refs must be globally unique");
            }
            hostMessageRefs.add(hostRef);
          }
        }
      } else if (child.payload?.workspace_tree !== payload.workspace_tree) {
        throw new Error("aggregate grill must bind the final post-grill tree");
      }
    }
    const decisionMatch = DECISION_LOG_REF.exec(payload.decision_ref ?? "");
    if (!decisionMatch || decisionMatch[1] !== payload.decision_hash) {
      throw new Error("interaction aggregate decision_ref/hash binding is invalid");
    }
    const decisionLog = readOptional(task, payload.decision_ref);
    if (decisionLog === undefined || decisionLog.trim() === ""
      || sha256(decisionLog) !== payload.decision_hash) {
      throw new Error("interaction aggregate decision-log artifact is missing or hash-mismatched");
    }
  }

  const ref = (kind, payload) => kind === "interaction-completion.v1"
    ? interactionRef(payload)
    : `${refRoot}/${kind}.json`;
  const latestRef = (kind) => `${refRoot}/${kind}.latest.json`;
  const revisionRef = (kind, number) => `${refRoot}/${kind}.revision-${String(number).padStart(4, "0")}.json`;

  function parseLatest(kind) {
    const pointerRef = latestRef(kind);
    const raw = readOptional(task, pointerRef);
    if (raw === undefined) return undefined;
    let value;
    try { value = JSON.parse(raw); } catch { throw new Error(`stage content latest pointer is invalid: ${pointerRef}`); }
    if (value?.schema_version !== "stage-content-latest.v1"
      || value.task_id !== task.identity.taskId || value.stage !== stage
      || value.workflow_run_id !== workflowRunId || value.kind !== kind
      || !Number.isInteger(value.revision) || value.revision < 1
      || !EVIDENCE_REF.test(value.ref ?? "") || !HASH.test(value.hash ?? "")
      || !value.ref.startsWith(`${refRoot}/`)) {
      throw new Error(`stage content latest pointer binding is invalid: ${pointerRef}`);
    }
    const target = verifyStageContentEvidence({
      task, ref: value.ref, hash: value.hash, expectedStage: stage,
      expectedRunId: workflowRunId, expectedKind: kind,
    });
    return { ref: pointerRef, raw, value, target };
  }

  return Object.freeze({
    publish(input = {}) {
      plain(input, "stage content publish input");
      const unexpectedInput = Object.keys(input).filter((key) => !new Set(["kind", "payload", "revision"]).has(key));
      if (unexpectedInput.length) throw new TypeError(`stage content publish caller fields are forbidden: ${unexpectedInput.join(", ")}`);
      if (!payloadSchemas.has(input.kind)) throw new TypeError(`unknown stage content evidence kind: ${input.kind}`);
      if (input.revision !== undefined
        && (!Number.isInteger(input.revision) || input.revision < 2 || !revisionable(input.kind, input.payload))) {
        throw new TypeError("trusted stage content revision is invalid or forbidden for this kind");
      }
      if (input.kind === "interaction-completion.v1"
        && input.payload.interaction_type !== "aggregate" && input.revision !== undefined) {
        throw new TypeError("talk/grill interaction evidence is create-only and cannot be revised");
      }
      plain(input.payload, "stage content payload");
      const aggregate = input.kind === "interaction-completion.v1"
        && input.payload.interaction_type === "aggregate";
      rejectIdentityKeys(input.payload, "payload", aggregate);
      const payload = minimize(structuredClone(input.payload));
      validatePayload(input.kind, payload);
      validateAggregateBindings(payload);
      const snapshot = captureSnapshot(workspace);
      if (input.kind === "interaction-completion.v1" && payload.workspace_tree !== snapshot.tree) {
        throw new Error("interaction completion workspace tree does not match the current Workspace");
      }
      const createdAt = now();
      if (!Number.isFinite(Date.parse(createdAt))) throw new TypeError("stage content created_at must be an ISO timestamp");
      const baseRef = ref(input.kind, payload);
      let previous;
      let evidenceRef = baseRef;
      if (input.revision !== undefined) {
        const latest = parseLatest(input.kind);
        if (latest) {
          if (latest.value.revision !== input.revision - 1) throw new Error("stage content revision CAS is stale");
          previous = { ref: latest.value.ref, hash: latest.value.hash, pointer: latest };
        } else {
          const baseRaw = readOptional(task, baseRef);
          if (input.revision !== 2 || baseRaw === undefined) throw new Error("stage content revision has no trusted predecessor");
          previous = { ref: baseRef, hash: sha256(baseRaw) };
          verifyStageContentEvidence({
            task, ref: baseRef, hash: previous.hash, expectedStage: stage,
            expectedRunId: workflowRunId, expectedKind: input.kind,
          });
        }
        evidenceRef = revisionRef(input.kind, input.revision);
      }
      const value = {
        schema_version: "stage-content-evidence.v1",
        kind: input.kind,
        task_id: task.identity.taskId,
        stage,
        workflow_run_id: workflowRunId,
        producer: { stage, component: "stage-content-evidence", version: "1.0.0" },
        content_hash: sha256(JSON.stringify(payload)),
        snapshot_head: snapshot.head,
        snapshot_tree: snapshot.tree,
        created_at: createdAt,
        ...(previous ? { revision: {
          number: input.revision,
          previous_ref: previous.ref,
          previous_hash: previous.hash,
        } } : {}),
        payload,
      };
      validateValue(value);
      const after = captureSnapshot(workspace);
      if (after.head !== snapshot.head || after.tree !== snapshot.tree) throw new Error("Workspace changed before stage content publication");
      const raw = `${JSON.stringify(value, null, 2)}\n`;
      const existing = readOptional(task, evidenceRef);
      if (existing !== undefined) {
        if (existing === raw) return Object.freeze({ ref: evidenceRef, hash: sha256(raw), value: Object.freeze(value) });
        throw new Error(`create-only stage content evidence already exists with conflicting content: ${evidenceRef}`);
      }
      kernel.publishCanonicalRecord(evidenceRef, raw);
      if (revisionable(input.kind, payload)) {
        const recordHash = sha256(raw);
        const pointerValue = {
          schema_version: "stage-content-latest.v1",
          task_id: task.identity.taskId,
          stage,
          workflow_run_id: workflowRunId,
          kind: input.kind,
          revision: input.revision ?? 1,
          ref: evidenceRef,
          hash: recordHash,
        };
        const pointerRaw = `${JSON.stringify(pointerValue, null, 2)}\n`;
        const pointerRef = latestRef(input.kind);
        if (previous?.pointer) {
          kernel.replaceStageContentLatestPointer(pointerRef, pointerRaw, {
            expectedPriorRaw: previous.pointer.raw,
            validator: (phase) => {
              const current = parseLatest(input.kind);
              const expected = phase === "post" ? pointerRaw : previous.pointer.raw;
              if (current?.raw !== expected) throw new Error("stage content latest pointer CAS is stale");
            },
          });
        } else if (readOptional(task, pointerRef) === undefined) {
          kernel.publishCanonicalRecord(pointerRef, pointerRaw);
        } else {
          throw new Error("stage content latest pointer CAS is stale");
        }
      }
      return Object.freeze({ ref: evidenceRef, hash: sha256(raw), value: Object.freeze(value) });
    },
  });
}

export function readLatestStageContentEvidence({ task, stage, workflowRunId, kind } = {}) {
  const safeTask = assertTaskHandle(task);
  if (!STAGES.has(stage) || !payloadSchemas.has(kind)) {
    throw new TypeError("latest stage content lookup requires a revisionable kind");
  }
  const root = `evidence/stage-content/${sha256(`${safeTask.identity.taskId}\0${stage}\0${validateRunId(workflowRunId)}`)}`;
  const pointerRef = `${root}/${kind}.latest.json`;
  const pointerRaw = readOptional(safeTask, pointerRef);
  if (pointerRaw === undefined) return undefined;
  let pointer;
  try { pointer = JSON.parse(pointerRaw); } catch { throw new Error("stage content latest pointer is invalid"); }
  if (pointer?.schema_version !== "stage-content-latest.v1" || pointer.task_id !== safeTask.identity.taskId
    || pointer.stage !== stage || pointer.workflow_run_id !== workflowRunId || pointer.kind !== kind
    || !pointer.ref?.startsWith(`${root}/`) || !HASH.test(pointer.hash ?? "")) {
    throw new Error("stage content latest pointer binding is invalid");
  }
  const value = verifyStageContentEvidence({
    task: safeTask, ref: pointer.ref, hash: pointer.hash,
    expectedStage: stage, expectedRunId: workflowRunId, expectedKind: kind,
  });
  if (kind === "interaction-completion.v1" && value.payload?.interaction_type !== "aggregate") {
    throw new Error("latest interaction completion must be the aggregate");
  }
  return Object.freeze({ ref: pointer.ref, hash: pointer.hash, value, pointer_ref: pointerRef });
}

export function verifyStageContentEvidence({
  task, ref, hash, expectedStage, expectedRunId, expectedTree, expectedKind,
} = {}) {
  const safeTask = assertTaskHandle(task);
  if (!EVIDENCE_REF.test(ref ?? "")) throw new TypeError("stage content evidence ref is invalid");
  if (!HASH.test(hash ?? "")) throw new TypeError("stage content evidence hash is invalid");
  const raw = safeTask.readRecord(ref);
  if (sha256(raw) !== hash) throw new Error("stage content evidence integrity hash mismatch");
  let value;
  try { value = JSON.parse(raw); } catch { throw new Error("stage content evidence is not valid JSON"); }
  validateValue(value);
  if (value.task_id !== safeTask.identity.taskId) throw new Error("stage content evidence task binding mismatch");
  if (expectedStage !== undefined && value.stage !== expectedStage) throw new Error("stage content evidence stage binding mismatch");
  if (expectedRunId !== undefined && value.workflow_run_id !== expectedRunId) throw new Error("stage content evidence run binding mismatch");
  if (expectedTree !== undefined && (!TREE.test(expectedTree) || value.snapshot_tree !== expectedTree)) throw new Error("stage content evidence snapshot tree binding mismatch");
  if (expectedKind !== undefined && value.kind !== expectedKind) throw new Error("stage content evidence kind binding mismatch");
  return Object.freeze(value);
}

export function requiredStageContentKinds(stage) {
  if (!STAGES.has(stage)) throw new TypeError(`unsupported stage content stage: ${stage}`);
  return REQUIRED_STAGE_CONTENT_KINDS[stage];
}
