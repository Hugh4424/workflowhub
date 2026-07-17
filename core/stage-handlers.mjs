import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { validateAcceptanceEvidence } from "./canonical-receipt-writer.mjs";
import { minimumReviewersFor } from "../skills/wh-review/scripts/review-materials.mjs";
import { parseReviewerOutput } from "../skills/wh-review/scripts/review-output.mjs";
import { aggregateProviderResults } from "../skills/wh-review/scripts/review-result.mjs";
import { validateSchema } from "../skills/wh-review/scripts/schema-validator.mjs";

const HANDLERS = new Map();
const hashText = (value) => createHash("sha256").update(value).digest("hex");
const RECEIPT_SCHEMA = "workflowhub-receipt.v1";
const NAMESPACE = Object.freeze({
  decision: "receipts/", spec: "receipts/", plan: "receipts/", tasks: "receipts/",
  implementation: "receipts/", tests: "receipts/", review: "reviews/results/",
  direction_review: "reviews/results/", detail_review: "reviews/results/", evidence: "evidence/",
});
const EXPECTED_COMPONENT = Object.freeze({ decision: "decision", spec: "spec", plan: "plan", tasks: "tasks", implementation: "implementation", evidence: "evidence" });
const object = (value, label) => { if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`); return value; };
const text = (value, label) => { if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be non-empty`); return value; };
function receipt(worker, invocation, name) {
  const ref = text(object(invocation.receipts, "receipts")[name], `${name} receipt ref`);
  const namespace = NAMESPACE[name];
  if (!namespace || !ref.startsWith(namespace) || ref.includes("..") || !ref.endsWith(".json")) {
    throw new Error(`${name} receipt ref is outside its canonical ${namespace ?? "unknown"} namespace`);
  }
  const record = object(worker.readReceipt(ref), `${name} receipt record`);
  const value = object(record.value, `${name} receipt`);
  text(record.sha256, `${name} receipt hash`);
  if (name === "review" || name.endsWith("_review")) {
    validateSchema("result", value);
  } else {
    if (value.schema_version !== RECEIPT_SCHEMA) throw new Error(`${name} receipt schema_version must be ${RECEIPT_SCHEMA}`);
    const producer = object(value.producer, `${name} receipt producer provenance`);
    text(producer.component, `${name} receipt producer.component`);
    text(producer.version, `${name} receipt producer.version`);
    if (producer.stage !== worker.stage) throw new Error(`${name} receipt producer stage mismatch`);
    if (producer.component !== EXPECTED_COMPONENT[name] && name !== "tests") throw new Error(`${name} receipt producer component is not official`);
  }
  if (value.task_id !== worker.identity.taskId) throw new Error(`${name} receipt task mismatch`);
  if (value.stage !== worker.stage) throw new Error(`${name} receipt stage mismatch`);
  return { ref, value, evidence: { ref, sha256: record.sha256 } };
}
function testFacts(worker, invocation) { const item = receipt(worker, invocation, "tests"); text(item.value.command, "tests.command"); if (!Number.isInteger(item.value.exit_code)) throw new TypeError("tests.exit_code must be integer"); for (const key of ["command_hash", "snapshot_head", "snapshot_tree", "snapshot_commit", "started_at", "completed_at", "output_ref", "output_hash"]) text(item.value[key], `tests.${key}`); if (!item.value.output_ref.startsWith("evidence/") || item.value.output_ref.includes("..")) throw new Error("tests.output_ref must use canonical evidence namespace"); return { facts: { command: item.value.command, exit_code: item.value.exit_code, command_hash: item.value.command_hash, snapshot_head: item.value.snapshot_head, snapshot_tree: item.value.snapshot_tree, snapshot_commit: item.value.snapshot_commit, started_at: item.value.started_at, completed_at: item.value.completed_at, receipt_ref: item.ref, receipt_hash: item.evidence.sha256, output_ref: item.value.output_ref, output_hash: item.value.output_hash }, evidence: item.evidence }; }
function verifyReviewChain(worker, result, expectedTrack) {
  const attemptRecord = object(worker.readReceipt(result.attempt_ref), "review attempt record");
  const attempt = object(attemptRecord.value, "review attempt");
  validateSchema("attempt", attempt);
  const attemptId = result.attempt_ref.match(/^reviews\/attempts\/([a-zA-Z0-9._-]+)\/attempt\.json$/)?.[1];
  if (!attemptId || attempt.attempt_id !== attemptId) throw new Error("review attempt_ref identity mismatch");
  for (const key of ["task_id", "stage", "review_track", "snapshot_tree", "material_id"]) {
    if (attempt[key] !== result[key]) throw new Error(`review attempt/result ${key} mismatch`);
  }
  if (attempt.terminal_status !== "semantic" || attempt.error !== null) throw new Error("review attempt did not produce a semantic result");
  const minimumReviewers = minimumReviewersFor(worker.stage, expectedTrack ?? null);
  if (result.provider_results.length < minimumReviewers) throw new Error("review result has too few independent providers");
  const providers = new Set();
  const parsedResults = [];
  for (const providerResult of result.provider_results) {
    if (providers.has(providerResult.provider)) throw new Error(`duplicate review provider: ${providerResult.provider}`);
    providers.add(providerResult.provider);
    const providerAttempt = [...attempt.provider_attempts].reverse().find((entry) => entry.provider === providerResult.provider && entry.status === "completed" && typeof entry.output_ref === "string");
    if (!providerAttempt) throw new Error(`review provider ${providerResult.provider} has no completed attempt evidence`);
    const outputRecord = object(worker.readReceipt(providerAttempt.output_ref), `review provider ${providerResult.provider} output record`);
    const output = object(outputRecord.value, `review provider ${providerResult.provider} output`);
    if (output.schema_version !== "wh-review-provider-output.v1" || output.task_id !== worker.identity.taskId || output.stage !== worker.stage || output.attempt_id !== attemptId || output.provider !== providerResult.provider || typeof output.content !== "string" || output.content_hash !== hashText(output.content)) {
      throw new Error(`review provider ${providerResult.provider} output provenance mismatch`);
    }
    const parsed = parseReviewerOutput(output.content);
    if (!isDeepStrictEqual(parsed, providerResult.output)) throw new Error(`review provider ${providerResult.provider} semantic output mismatch`);
    parsedResults.push({ provider: providerResult.provider, review: parsed });
  }
  const aggregation = aggregateProviderResults(parsedResults, minimumReviewers);
  if (aggregation.status !== "semantic" || aggregation.verdict !== result.verdict) throw new Error("review result verdict does not match provider outputs");
  const expectedProviderResults = aggregation.valid.map((item) => ({ provider: item.provider, output: item.review }));
  const expectedFindings = expectedProviderResults.flatMap((item) => item.output.findings.map((finding) => ({ provider: item.provider, ...finding })));
  if (!isDeepStrictEqual(result.provider_results, expectedProviderResults) || !isDeepStrictEqual(result.findings, expectedFindings)) throw new Error("review result aggregation does not match provider outputs");
}
function reviewFacts(worker, invocation, name = "review", expectedTrack) { const item = receipt(worker, invocation, name); if (expectedTrack !== undefined && item.value.review_track !== expectedTrack) throw new Error(`${name} must use wh-review ${expectedTrack} track`); verifyReviewChain(worker, item.value, expectedTrack); return { facts: { verdict: item.value.verdict, result_ref: item.ref, result_hash: item.evidence.sha256, snapshot_tree: item.value.snapshot_tree, ...(expectedTrack === undefined ? {} : { review_track: expectedTrack }) }, evidence: item.evidence }; }

HANDLERS.set("make-decision", async (worker, input) => { const item = receipt(worker, input, "decision"), direction = reviewFacts(worker, input, "direction_review", "direction"), detail = reviewFacts(worker, input, "detail_review", "detail"); if (typeof item.value.decision_log !== "string" || item.value.decision_log.trim() === "" || item.value.content_hash !== hashText(item.value.decision_log)) throw new Error("decision-log content hash mismatch"); if (!worker.candidateWorkspace) throw new Error("verified CandidateWorkspace required"); const snapshot = worker.candidateWorkspace.captureSnapshot(); if (detail.facts.snapshot_tree !== snapshot.tree) throw new Error("detail review and CandidateWorkspace must bind the same snapshot tree"); return { facts: { worktree_root: worker.candidateWorkspace.worktreeRoot, baseline_commit: worker.candidateWorkspace.baselineCommit, snapshot_tree: snapshot.tree, decision_ref: item.ref, decision_hash: item.evidence.sha256, reviews: { direction: direction.facts, detail: detail.facts } }, evidence_refs: [item.evidence, direction.evidence, detail.evidence] }; });
HANDLERS.set("build-spec", async (worker, input) => { const item = receipt(worker, input, "spec"), review = reviewFacts(worker, input); text(item.value.content, "spec content"); if (item.value.content_hash !== hashText(item.value.content)) throw new Error("spec content hash mismatch"); worker.writeArtifact("spec.md", item.value.content); const checkpoint = worker.createCheckpoint("build-spec"); if (review.facts.snapshot_tree !== worker.snapshotWorkspace().tree) throw new Error("spec review and Workspace must bind the same snapshot tree"); return { facts: { spec_ref: worker.artifactRef("spec.md"), checkpoint, review: review.facts }, evidence_refs: [item.evidence, review.evidence] }; });
HANDLERS.set("build-plan", async (worker, input) => { const plan = receipt(worker, input, "plan"), tasks = receipt(worker, input, "tasks"), review = reviewFacts(worker, input); text(plan.value.content, "plan content"); text(tasks.value.content, "tasks content"); if (plan.value.content_hash !== hashText(plan.value.content) || tasks.value.content_hash !== hashText(tasks.value.content)) throw new Error("plan/tasks content hash mismatch"); worker.writeArtifact("plan.md", plan.value.content); worker.writeArtifact("tasks.md", tasks.value.content); const checkpoint = worker.createCheckpoint("build-plan"); if (review.facts.snapshot_tree !== worker.snapshotWorkspace().tree) throw new Error("plan review and Workspace must bind the same snapshot tree"); return { facts: { plan_ref: worker.artifactRef("plan.md"), tasks_ref: worker.artifactRef("tasks.md"), checkpoint, review: review.facts }, evidence_refs: [plan.evidence, tasks.evidence, review.evidence] }; });
HANDLERS.set("build-code", async (worker, input) => { const impl = receipt(worker, input, "implementation"), tests = testFacts(worker, input), review = reviewFacts(worker, input); if (!Array.isArray(impl.value.changed)) throw new TypeError("implementation.changed must be array"); for (const key of ["snapshot_head", "snapshot_tree", "snapshot_commit", "diff_ref", "diff_hash"]) text(impl.value[key], `implementation.${key}`); if (impl.value.snapshot_tree !== tests.facts.snapshot_tree || review.facts.snapshot_tree !== tests.facts.snapshot_tree) throw new Error("implementation, tests, and review must bind the same Workspace snapshot tree"); const phase = impl.value.phase_completion; if (typeof phase !== "boolean" && (!phase || typeof phase !== "object" || Array.isArray(phase))) throw new TypeError("invalid phase_completion"); return { facts: { changed: impl.value.changed, tests: tests.facts, review: review.facts, phase_completion: phase }, evidence_refs: [impl.evidence, { ref: impl.value.diff_ref, sha256: impl.value.diff_hash }, tests.evidence, review.evidence] }; });
HANDLERS.set("verify-code", async (worker, input) => { const tests = testFacts(worker, input), review = reviewFacts(worker, input), evidence = receipt(worker, input, "evidence"); const current = worker.snapshotWorkspace(); if (tests.facts.snapshot_tree !== review.facts.snapshot_tree || current.tree !== tests.facts.snapshot_tree) throw new Error("tests, review, and current Workspace snapshot must match"); if (!Array.isArray(evidence.value.refs)) throw new TypeError("evidence.refs must be array"); const criterionIds = new Set(), nestedEvidence = []; for (const [index, ref] of evidence.value.refs.entries()) { object(ref, `evidence.refs[${index}]`); text(ref.ref, `evidence.refs[${index}].ref`); text(ref.sha256, `evidence.refs[${index}].sha256`); if (!ref.ref.startsWith("evidence/") || ref.ref.includes("..")) throw new Error("evidence ref must use canonical evidence namespace"); const entity = object(worker.readReceipt(ref.ref), `evidence.refs[${index}] record`); if (entity.sha256 !== ref.sha256) throw new Error(`evidence.refs[${index}] hash mismatch`); const acceptance = validateAcceptanceEvidence(entity.value, `acceptance evidence schema at evidence.refs[${index}]`); if (criterionIds.has(acceptance.acceptance_criterion_id)) throw new Error(`duplicate acceptance_criterion_id: ${acceptance.acceptance_criterion_id}`); criterionIds.add(acceptance.acceptance_criterion_id); for (const [nestedIndex, nested] of acceptance.refs.entries()) { if (typeof worker.readEvidence !== "function") throw new Error("acceptance evidence schema requires authenticated evidence reader"); const nestedRecord = object(worker.readEvidence(nested.ref), `${ref.ref} refs[${nestedIndex}] record`); if (nestedRecord.sha256 !== nested.sha256) throw new Error(`${ref.ref} refs[${nestedIndex}] hash mismatch`); nestedEvidence.push(nested); } } return { facts: { tests: tests.facts, review: review.facts, evidence_refs: evidence.value.refs }, evidence_refs: [tests.evidence, review.evidence, evidence.evidence, ...evidence.value.refs, ...nestedEvidence] }; });

export function officialStageHandler(stage) { const handler = HANDLERS.get(stage); if (!handler) throw new TypeError(`no official handler for stage: ${stage}`); return async (worker, invocation) => { const refs = object(invocation?.receipts, "receipts"); for (const [name, ref] of Object.entries(refs)) { const namespace = NAMESPACE[name]; if (!namespace || typeof ref !== "string" || !ref.startsWith(namespace) || ref.includes("..") || !ref.endsWith(".json")) throw new Error(`${name} receipt ref is outside its canonical namespace`); } return handler(worker, invocation); }; }
