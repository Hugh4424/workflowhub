import { constants, closeSync, fstatSync, lstatSync, openSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { reviewIdentityFromInput } from "../../../runtime/review/review-policy.mjs";
import { parseReviewerOutput } from "../../../runtime/review/review-output.mjs";

function normalizeDirectionSelection(value) {
  if (typeof value === "string" && value.trim() !== "") return Object.freeze({ current_selection: value });
  if (!value || typeof value !== "object" || Array.isArray(value) || typeof value.current_selection !== "string" || value.current_selection.trim() === "") {
    throw new TypeError("current_selection is required for direction review");
  }
  return Object.freeze(structuredClone(value));
}

/**
 * Direction review is one broker request containing an internal, ordered flow.
 * The broker must enforce the reveal boundary; WorkflowHub must not emulate it
 * with two public calls because that violates the one-round review contract.
 */
export function planDirectionReviewRequests({ raw_requirement, objective_facts, current_selection, reconstruction_result = null } = {}) {
  if (typeof raw_requirement !== "string" || raw_requirement.trim() === "") throw new TypeError("raw_requirement is required");
  const selection = normalizeDirectionSelection(current_selection);
  const facts = objective_facts === undefined ? null : structuredClone(objective_facts);
  const flow = Object.freeze({
    version: "direction-review.v1",
    public_request_count: 1,
    steps: Object.freeze([
      Object.freeze({ id: "reconstruct", visible: Object.freeze(["raw_requirement", "objective_facts"]), hidden_until: "reveal" }),
      Object.freeze({ id: "reveal", after: Object.freeze(["reconstruct"]), visible: Object.freeze(["current_selection", "alternatives", "selection_rationale", "key_assumptions", "independent_reconstruction"]) }),
      Object.freeze({ id: "challenge", after: Object.freeze(["reveal"]), visible: Object.freeze(["revealed_choice", "independent_reconstruction"]), output: "findings" }),
    ]),
    output: Object.freeze({ one_provider_result: true, one_logical_fact: true }),
  });
  const request = Object.freeze({
    request_id: "direction-review",
    public_request_count: 1,
    flow,
    input: Object.freeze({ ...selection, raw_requirement, objective_facts: facts, ...(reconstruction_result === null ? {} : { independent_reconstruction: structuredClone(reconstruction_result) }) }),
    prompt: "在同一次 public request 内严格执行 reconstruct → reveal → challenge：reconstruct 阶段不得读取当前选择；reveal 后才呈现当前选择和独立重建；challenge 只报告真实交付风险。不要拆成第二次 public request。",
  });
  return Object.freeze({ requests: Object.freeze([request]), request, flow, logical_fact_count: 1 });
}
function findingSignature(finding) {
  return `${finding?.id ?? ""}\u0000${finding?.path ?? ""}\u0000${finding?.line ?? ""}\u0000${String(finding?.issue ?? "").trim().toLocaleLowerCase("en")}`;
}
/**
 * Serious means the existing adjudication says the finding is actionable and
 * the existing severity is major or blocking. Transport failures and
 * non-actionable advice are deliberately not treated as clean findings.
 */
export function actionableSeriousFindings(result) {
  const findings = [
    ...(Array.isArray(result?.findings) ? result.findings : []),
    ...(Array.isArray(result?.adjudication?.clusters) ? result.adjudication.clusters : []),
  ];
  const seen = new Set();
  return findings.filter((finding) => {
    if (finding?.disposition !== "actionable" || !["major", "blocking"].includes(finding?.severity)) return false;
    const signature = findingSignature(finding);
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
}

function isTrustedTerminalSemanticResult(result) {
  if (!result || !["available", "available-with-failures"].includes(result.status)) return false;
  // runSimpleReview returns the public \`available\` status after it has
  // consumed the broker's terminal lifecycle. Canonical result projections
  // may additionally carry terminal_status; when present it must agree.
  return result.terminal_status === undefined || result.terminal_status === "semantic";
}

/**
 * Return the recorded advice fact for one completed review step. Finding
 * disposition and later subject changes belong to downstream workflow steps;
 * they do not dispatch this review step again.
 */
export function reviewCycleDecision({ stage, result } = {}) {
  if (!isTrustedTerminalSemanticResult(result)) {
    return Object.freeze({ stage, status: "incomplete", action: "advance", reason: "provider_no_trusted_terminal_result", important_findings: [] });
  }
  if (!Array.isArray(result.findings) && !Array.isArray(result?.adjudication?.clusters)) {
    return Object.freeze({ stage, status: "incomplete", action: "advance", reason: "semantic_review_result_required", important_findings: [] });
  }
  return Object.freeze({
    stage,
    status: "advice_recorded",
    action: "advance",
    reason: "review_step_completed",
    important_findings: actionableSeriousFindings(result),
  });
}

/** Read an explicitly named report. Historical bytes are facts, never a current
 * snapshot permit, reusable result selector, or a new stage completion. */
export function verifyFinalSubject({ result, taskId = null, stage = null, reviewTrack = undefined } = {}) {
  const identity = reviewIdentityFromInput(result);
  if (taskId !== null && result.task_id !== taskId) throw new Error("RESULT_REF_INVALID: task does not match result");
  if (stage !== null && identity.stage !== stage) throw new Error("RESULT_REF_INVALID: stage does not match result");
  if (reviewTrack !== undefined && identity.reviewTrack !== reviewTrack) throw new Error("RESULT_REF_INVALID: track does not match result");
  if (!["available", "available-with-failures", "unavailable", "incomplete"].includes(result.status)) throw new Error("RESULT_REF_INVALID: result status is missing or invalid");
  if (["available", "available-with-failures"].includes(result.status)) {
    parseReviewerOutput(JSON.stringify({ findings: result.findings }), { requireEvidence: true });
    if (!Array.isArray(result.provider_results) || result.provider_results.length === 0) throw new Error("RESULT_REF_INVALID: semantic result has no provider provenance");
  }
  return { status: result.status, advice: result.findings ?? null, authoritative: false, stage: identity.stage,
    review_scope: identity.reviewScope, subject_kind: result.subject_kind ?? null, phase_id: result.phase_id ?? null };
}

export function verifyFinal({ taskDir, resultRef, taskId = null, stage = null, reviewTrack = undefined } = {}) {
  if (typeof taskDir !== "string" || typeof resultRef !== "string" || isAbsolute(resultRef) || !resultRef.startsWith("quality/reviews/") || resultRef.split(/[\\/]/).some(x => x === ".." || x === "." || x === "")) throw new Error("RESULT_REF_INVALID: explicit task-local review ref required");
  const root = resolve(taskDir); if (realpathSync(root) !== root) throw new Error("RESULT_REF_INVALID: task path alias");
  const path = resolve(root, resultRef); if (relative(root,path).startsWith("..")) throw new Error("RESULT_REF_INVALID: result escapes task");
  let cursor=root;
  for (const part of resultRef.split("/")) { cursor=join(cursor,part); const st=lstatSync(cursor); if(st.isSymbolicLink() || realpathSync(cursor)!==cursor) throw new Error("RESULT_REF_INVALID: result path alias"); }
  const named=lstatSync(path); if(!named.isFile() || named.nlink!==1) throw new Error("RESULT_REF_INVALID: ordinary single-link result required");
  const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);
  let result;
  try { const opened=fstatSync(fd); if(opened.dev!==named.dev || opened.ino!==named.ino) throw new Error("RESULT_REF_INVALID: result replaced"); result=JSON.parse(readFileSync(fd,"utf8")); }
  finally { closeSync(fd); }
  return { ...verifyFinalSubject({result,taskId,stage,reviewTrack}), result_ref: resultRef };
}
