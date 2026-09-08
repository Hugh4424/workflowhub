import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { execFileSync } from "node:child_process";
import Ajv2020 from "ajv/dist/2020.js";

import { isHumanConfirmationVersion, validateCanonicalFullTestReceipt, validateCanonicalTestReceipt, validateHumanConfirmation, validateStageOutcomeProducerIdentity, validateStageOutcomeProof, deriveAcceptanceExecutionAssertions, validateAcceptanceExecutionEvidence, validateCanonicalQualityFact } from "./canonical-evidence-validators.mjs";
import { validateAcceptanceEvidence } from "./acceptance-evidence-validator.mjs";
import browserQaSchema from "../schemas/browser-qa-evidence.v1.json" with { type: "json" };
import { validateSchema } from "../review/schema-validator.mjs";
import { isStageSnapshotCurrent, STAGE_ADVISORY_PREDICATES, STAGE_FACT_MATERIALS, STAGE_PREDICATES } from "../stage/completion-predicates.mjs";
import { ensureGitSnapshotObjectStore, isMaterialOnlySnapshotDelta } from "../task/git-worktree-snapshot.mjs";
import { canonicalReviewFindings, isActionableSeriousFinding } from "../review/stage-review-disposition.mjs";
import { authenticateCanonicalReviewResult } from "../review/canonical-review-result.mjs";
import { parseReviewerOutput } from "../review/review-output.mjs";
import { createSimpleReviewPacket } from "../../skills/wh-review/scripts/simple-review-runner.mjs";
import { createQualityFact, qualityFactDigest } from "./quality-fact.mjs";
import { materialRevisionFromValues } from "../task/git-worktree-snapshot.mjs";

function readTypedExecutionFact(selection, fact, read, dependencies, key) {
  if (!selection || !HASH.test(selection.sha256 ?? "")
      || selection.ref !== `quality/evidence/stage-quality/build-code/acceptance_execution-${selection.sha256}.json`
      || !/^quality\/facts\/[a-f0-9]{64}\.json$/.test(selection.quality_fact_ref ?? "")) throw new Error("execution review source selection is invalid");
  const factKey = `${key}:execution-fact`;
  let raw;
  try { raw = read(selection.quality_fact_ref); }
  catch (error) { if (error?.code === "ENOENT") dependencies[factKey] = "missing"; throw error; }
  const executionFact = validateCanonicalQualityFact(JSON.parse(raw));
  if (executionFact.schema_version !== "quality-fact.v1"
      || executionFact.fact_id !== `quality-${qualityFactDigest(executionFact)}`
      || selection.quality_fact_ref !== `quality/facts/${qualityFactDigest(executionFact)}.json`
      || executionFact.task_id !== fact.task_id || executionFact.stage !== "build-code"
      || executionFact.kind !== "acceptance_criterion" || executionFact.subject !== "acceptance_execution"
      || executionFact.status !== "passed" || executionFact.material_revision !== fact.material_revision
      || executionFact.snapshot_tree !== fact.snapshot_tree || executionFact.evidence?.length !== 1
      || executionFact.evidence[0].evidence_type !== "acceptance_evidence") throw new Error("execution typed fact binding is invalid");
  createQualityFact({ taskId: executionFact.task_id, stage: executionFact.stage, materialRevision: executionFact.material_revision,
    materialScope: executionFact.material_scope, materialScopeRevision: executionFact.material_scope_revision,
    snapshotTree: executionFact.snapshot_tree, kind: executionFact.kind, subject: executionFact.subject,
    status: executionFact.status, evidence: executionFact.evidence, recordedAt: executionFact.recorded_at });
  const wrapperRef = executionFact.evidence[0];
  const wrapper = readBoundJson(wrapperRef, read, dependencies, `${key}:execution-wrapper`);
  if (!wrapper) throw new Error("execution acceptance wrapper is unavailable");
  validateAcceptanceEvidence(wrapper);
  if (wrapper.acceptance_criterion_id !== "acceptance_execution" || wrapper.result !== "pass"
      || wrapper.snapshot_tree !== fact.snapshot_tree || wrapper.refs.length !== 1
      || wrapper.refs[0].ref !== selection.ref || wrapper.refs[0].sha256 !== selection.sha256) throw new Error("execution wrapper refers to another aggregate");
  const aggregate = readBoundJson(selection, read, dependencies, `${key}:execution-aggregate`);
  if (!aggregate || aggregate.status !== "passed") throw new Error("execution aggregate is unavailable or did not pass");
  const actor = authenticateE2eExecutionStageQuality(aggregate, fact, read, dependencies, `${key}:execution-aggregate`);
  dependencies[factKey] = "current";
  dependencies[`${key}:execution-wrapper`] = "current";
  dependencies[`${key}:execution-aggregate`] = "current";
  return { aggregate, actor, wrapperReference: { ref: wrapperRef.ref, sha256: wrapperRef.sha256 }, executionFact };
}

/** Read the same immutable ordinary review and the exact execution it saw. */
export function authenticateOrdinaryExecutionReview(review, fact, read, dependencies = {}, key = "execution-review", reviewReference = null) {
  validateSchema("result", review);
  if (review.task_id !== fact.task_id || review.stage !== "verify-code" || review.snapshot_tree !== fact.snapshot_tree
      || review.material_revision !== fact.material_revision || !review.e2e_binding) throw new Error("ordinary execution review is not current or has no execution binding");
  const binding = review.e2e_binding;
  if (!/^quality\/reviews\/attempts\/[A-Za-z0-9._-]+\/attempt\.json$/.test(review.attempt_ref ?? "")) throw new Error("ordinary execution review attempt ref is invalid");
  let attemptRaw;
  try { attemptRaw = read(review.attempt_ref); }
  catch (error) { if (error?.code === "ENOENT") dependencies[`${key}:attempt`] = "missing"; throw error; }
  const attempt = JSON.parse(attemptRaw);
  validateSchema("attempt", attempt);
  if (review.attempt_ref !== `quality/reviews/attempts/${attempt.attempt_id}/attempt.json`
      || reviewReference?.ref !== `quality/reviews/results/verify-code-simple-${attempt.attempt_id}.json`) throw new Error("ordinary execution review canonical ref does not match its producing attempt");
  if (JSON.stringify(attempt.e2e_binding) !== JSON.stringify(binding) || attempt.terminal_status !== "semantic"
      || attempt.material_id !== review.material_id || attempt.material_revision !== fact.material_revision || attempt.snapshot_tree !== fact.snapshot_tree) throw new Error("ordinary review attempt binding mismatch");
  const outputs = attempt.provider_attempts.filter((provider) => provider.status === "completed").map((provider, index) => {
    const outputKey = `${key}:provider:${index}`;
    let raw;
    try { raw = read(provider.output_ref); }
    catch (error) { if (error?.code === "ENOENT") dependencies[outputKey] = "missing"; throw error; }
    const output = JSON.parse(raw);
    if (output.schema_version !== "wh-review-provider-output.v1" || output.task_id !== fact.task_id
        || output.stage !== "verify-code" || output.attempt_id !== attempt.attempt_id || output.provider !== provider.provider
        || typeof output.content !== "string" || sha256(output.content) !== output.content_hash) throw new Error("ordinary execution review provider output is invalid");
    dependencies[outputKey] = "current";
    return { ref: provider.output_ref, provider: provider.provider, review: JSON.parse(output.content), evidenceAnchors: output.evidence_anchor_valid };
  });
  authenticateCanonicalReviewResult({ attempt, result: review, providerOutputs: outputs });
  const frozenRef = binding.frozen_material;
  if (frozenRef.ref !== `quality/evidence/review-materials/${frozenRef.sha256}.json`) throw new Error("frozen execution review ref is not content addressed");
  const frozen = readBoundJson(frozenRef, read, dependencies, `${key}:frozen-material`);
  if (!frozen || frozen.schema_version !== "workflowhub-frozen-review-material.v1" || frozen.content_encoding !== "base64"
      || typeof frozen.content_base64 !== "string") throw new Error("frozen execution review material is unavailable");
  const bytes = Buffer.from(frozen.content_base64, "base64");
  if (bytes.toString("base64") !== frozen.content_base64 || sha256(bytes) !== frozen.content_sha256
      || frozen.content_sha256 !== frozenRef.provider_input_sha256) throw new Error("frozen execution review original bytes hash mismatch");
  const request = JSON.parse(bytes.toString("utf8"));
  if (request.stage !== "verify-code" || createSimpleReviewPacket(request).material_id !== review.material_id
      || materialRevisionFromValues(["decision-log.md", "spec.md", "plan.md", "tasks.md"].map((name) => [name, request.materials.runtime_current_materials?.[name]])) !== fact.material_revision) throw new Error("ordinary review did not consume the bound material bundle");
  const execution = readTypedExecutionFact(request.reviewed_execution, fact, read, dependencies, key);
  if (binding.reviewed_execution.ref !== request.reviewed_execution.ref
      || binding.reviewed_execution.sha256 !== request.reviewed_execution.sha256
      || !sameActor(binding.reviewed_execution.actor, execution.actor)
      || request.materials.runtime_execution?.raw !== read(binding.reviewed_execution.ref)) throw new Error("ordinary review execution does not match its frozen bundle");
  for (const item of execution.aggregate.subject_fact.execution_items) {
    for (const reference of item.evidence_refs) {
      const frozenRecord = request.materials.runtime_execution_records?.find((entry) => entry.ref === reference.ref && entry.sha256 === reference.sha256);
      if (!frozenRecord || frozenRecord.raw !== read(reference.ref)) throw new Error("ordinary review omitted actual per-AC execution bytes");
    }
  }
  const reviewer = binding.reviewer_actor;
  if (reviewer.source_kind !== "review_provider" || !attempt.provider_attempts.some((provider) => provider.status === "completed"
      && provider.identity?.source_id === reviewer.source_id && provider.runtime_id === reviewer.run_id)
      || reviewer.source_id.split("/")[0] === execution.actor.source_id.split("/")[0]) throw new Error("ordinary execution reviewer is not an independent authenticated actor");
  dependencies[`${key}:attempt`] = "current";
  dependencies[`${key}:frozen-material`] = "current";
  return { execution, binding, request };
}

export function authenticateExecutionConfirmation(confirmation, reference, reviewReference, fact, read, dependencies = {}, key = "execution-confirmation") {
  validateHumanConfirmation(confirmation, { taskId: fact.task_id, stage: "verify-code", requireAccepted: true });
  if (confirmation.schema_version !== "human-confirmation.v3" || confirmation.subject_ref !== reviewReference.ref
      || confirmation.material_revision !== fact.material_revision || confirmation.snapshot_tree !== fact.snapshot_tree
      || reference.ref !== `quality/confirmations/${reference.sha256}.json`) throw new Error("execution confirmation is not bound to the current ordinary review");
  const expected = createQualityFact({ taskId: fact.task_id, stage: "verify-code", materialRevision: fact.material_revision,
    materialScope: STAGE_FACT_MATERIALS["verify-code"], materialScopeRevision: fact.material_scope_revision,
    snapshotTree: fact.snapshot_tree, kind: "confirmation", status: "passed", subject: "human_confirmation",
    evidence: [{ ref: reference.ref, sha256: reference.sha256, evidence_type: "human_confirmation" }], recordedAt: confirmation.confirmed_at });
  const value = readBoundJson(expected, read, dependencies, `${key}:typed-fact`);
  if (value) validateCanonicalQualityFact(value);
  if (!value || value.fact_id !== expected.value.fact_id || qualityFactDigest(value) !== qualityFactDigest(expected.value)) throw new Error("execution confirmation typed fact is unavailable or invalid");
  dependencies[`${key}:typed-fact`] = "current";
  return expected.ref;
}

const HASH = /^[a-f0-9]{64}$/;
const QUALITY_STATUSES = new Set(["passed", "failed", "unavailable", "missing", "recorded"]);
const REVIEW_STATUSES = new Set(["clean", "findings", "resolved", "unavailable"]);
const CLOSE_PLAN_REF = /^operations\/close\/plans\/[a-f0-9]{64}\/plan\.json$/;
const browserQaValidator = new Ajv2020({ allErrors: true, strict: false }).compile(browserQaSchema);

/** Authenticate the existing immutable review chain before consuming it. */
export function authenticateStageReviewResult(result, { taskId, read }) {
  validateSchema("result", result);
  const attempt = JSON.parse(read(result.attempt_ref));
  validateSchema("attempt", attempt);
  if (attempt.task_id !== taskId
      || attempt.stage !== result.stage
      || attempt.review_track !== result.review_track
      || attempt.snapshot_tree !== result.snapshot_tree
      || attempt.material_id !== result.material_id
      || attempt.terminal_status !== "semantic"
      || attempt.error !== null) {
    throw new Error("review attempt/result binding is invalid");
  }
  const attemptId = result.attempt_ref.match(/^quality\/reviews\/attempts\/([A-Za-z0-9][A-Za-z0-9._-]*)\/attempt\.json$/)?.[1];
  if (!attemptId || attempt.attempt_id !== attemptId) throw new Error("review attempt identity is invalid");
  const latest = new Map();
  for (const providerAttempt of attempt.provider_attempts) latest.set(providerAttempt.provider, providerAttempt);
  const providerOutputs = [];
  for (const providerAttempt of latest.values()) {
    if (providerAttempt.status !== "completed" || typeof providerAttempt.output_ref !== "string") continue;
    const output = JSON.parse(read(providerAttempt.output_ref));
    if (output.schema_version !== "wh-review-provider-output.v1"
        || output.task_id !== taskId
        || output.stage !== attempt.stage
        || output.attempt_id !== attemptId
        || output.provider !== providerAttempt.provider
        || typeof output.content !== "string"
        || output.content_hash !== sha256(output.content)) {
      throw new Error(`review provider output provenance is invalid: ${providerAttempt.provider}`);
    }
    providerOutputs.push({
      ref: providerAttempt.output_ref, provider: providerAttempt.provider,
      ...(providerAttempt.identity ? { identity: providerAttempt.identity } : {}),
      ...(providerAttempt.execution ? { execution: providerAttempt.execution } : {}),
      ...(output.evidence_anchor_valid === undefined ? {} : { evidenceAnchors: output.evidence_anchor_valid }),
      review: parseReviewerOutput(output.content, { requireEvidence: result.adjudication !== undefined }),
    });
  }
  return authenticateCanonicalReviewResult({ attempt, result, providerOutputs });
}

/**
 * Existing verify-code repair dispositions bind current source and affected
 * checks. The bridge, outcome reader and fact writer share this read-only
 * contract; it does not create a receipt or judge whether a fix is correct.
 * Owner: verify-code outcome producer. Consumers: those three boundaries.
 * Retain until the existing disposition contract is replaced; no new store.
 */
export function authenticateCodeReviewRepairs({ review, result, taskId, snapshotTree, materialRevision, workspaceRoot, read }) {
  const findings = canonicalReviewFindings(review).filter(isActionableSeriousFinding);
  if (findings.length === 0) return result?.status === "unavailable" ? "unavailable" : "clean";
  if (result?.status !== "findings" || !Array.isArray(result.repairs)) return "findings";
  if (review.task_id !== taskId || review.stage !== "verify-code" || review.material_revision !== materialRevision
      || review.subject_kind !== "worktree" || review.phase_id !== null || review.review_scope !== null) {
    throw new Error("review repair task, stage or material binding mismatch");
  }
  const ids = new Set(findings.map((finding) => finding.id));
  const terminal = result.repairs.filter((repair) => ["fixed", "rejected_invalid"].includes(repair?.status));
  if (terminal.length === 0) return "findings";
  authenticateStageReviewResult(review, { taskId, read });
  if (typeof workspaceRoot !== "string" || !workspaceRoot || typeof read !== "function"
      || !/^[a-f0-9]{40,64}$/.test(snapshotTree ?? "") || !/^[a-f0-9]{40,64}$/.test(review.snapshot_tree ?? "")) {
    throw new Error("review repair requires an authenticated source workspace and snapshots");
  }
  ensureGitSnapshotObjectStore(workspaceRoot);
  const git = (args) => execFileSync("git", args, { cwd: workspaceRoot, stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
  for (const tree of new Set([snapshotTree, review.snapshot_tree])) git(["cat-file", "-e", `${tree}^{tree}`]);
  const sourceHash = (tree, path) => {
    const entry = git(["ls-tree", "-z", tree, "--", path]).toString("utf8");
    if (entry === "") return null;
    if (!/^\d+ blob [a-f0-9]+\t/.test(entry) || entry.split("\0").filter(Boolean).length !== 1) throw new Error("review repair source must name one file");
    return sha256(git(["show", `${tree}:${path}`]));
  };
  const completed = new Set();
  for (const repair of terminal) {
    const id = repair.finding_id ?? repair.id;
    if (!ids.has(id) || completed.has(id)) throw new Error("review repair has an unknown or duplicate finding id");
    if (typeof repair.reason !== "string" || !repair.reason.trim()) throw new Error("review repair reason is required");
    if (!Array.isArray(repair.source_refs) || repair.source_refs.length === 0) throw new Error("review repair source_refs are required");
    let changed = false;
    const paths = new Set();
    for (const source of repair.source_refs) {
      if (typeof source?.path !== "string" || !source.path || source.path.startsWith("/") || source.path.includes("\\")
          || source.path.split("/").some((part) => ["", ".", ".."].includes(part)) || paths.has(source.path)
          || (source.sha256 !== null && !HASH.test(source.sha256 ?? ""))) throw new Error("review repair source ref is invalid");
      paths.add(source.path);
      const currentHash = sourceHash(snapshotTree, source.path), reviewedHash = sourceHash(review.snapshot_tree, source.path);
      if (currentHash !== source.sha256 || (currentHash === null && reviewedHash === null)) throw new Error("review repair source hash does not match the current snapshot");
      changed ||= currentHash !== reviewedHash;
    }
    if (repair.status === "fixed" && !changed) throw new Error("fixed review repair requires a change in its referenced source");
    if (!Array.isArray(repair.check_refs) || repair.check_refs.length === 0) throw new Error("review repair affected check_refs are required");
    const checks = new Set();
    for (const check of repair.check_refs) {
      if (!/^quality\/tests\/[A-Za-z0-9._/-]+\.json$/.test(check?.ref ?? "") || check.ref.split("/").includes("..")
          || !HASH.test(check.sha256 ?? "") || checks.has(check.ref)) throw new Error("review repair check ref is invalid");
      checks.add(check.ref);
      const raw = read(check.ref);
      if (sha256(raw) !== check.sha256) throw new Error("review repair check hash mismatch");
      const receipt = JSON.parse(raw);
      if (!["build-code", "verify-code"].includes(receipt.stage)) throw new Error("review repair check stage is invalid");
      validateCanonicalTestReceipt(receipt, { taskId, stage: receipt.stage, snapshotTree,
        expectedProducerComponent: `${receipt.stage}-test-capture`, requirePassed: true });
      if (receipt.material_revision !== undefined && receipt.material_revision !== materialRevision) throw new Error("review repair check material mismatch");
      if (sha256(read(receipt.output_ref)) !== receipt.output_hash) throw new Error("review repair check output hash mismatch");
    }
    completed.add(id);
  }
  return completed.size === ids.size && terminal.length === result.repairs.length ? "resolved" : "findings";
}

function validateBrowserQaEvidence(value) {
  if (!browserQaValidator(value)) {
    throw new Error(`browser QA evidence schema is invalid: ${(browserQaValidator.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message}`).join("; ")}`);
  }
  return value;
}

// Only reviews explicitly declared advisory by the stage contract can survive
// an arbitrary later snapshot. Required verify-code facts still go stale for
// real material changes, but the narrow executor-only tasks.md writeback is
// record keeping and may reuse the same quality fact.
function isAdviceReviewFact(fact) {
  return fact?.kind === "review"
    && fact?.status === "recorded"
    && Object.hasOwn(STAGE_ADVISORY_PREDICATES[fact.stage] ?? {}, fact.subject);
}

// An execution-status writeback is intentionally reusable only for a
// registered formal stage predicate. Arbitrary quality facts must still go
// stale when material identity changes; this keeps the existing bookkeeping
// exception narrow without adding another control plane.
function isRegisteredStagePredicate(fact) {
  return STAGE_PREDICATES[fact?.stage]?.[fact?.subject] === fact?.kind;
}

export const sha256 = (value) => createHash("sha256").update(value).digest("hex");

export function bindFreshness({ ref, raw, snapshotTree }) {
  if (typeof ref !== "string" || ref.trim() === "") throw new TypeError("freshness ref is required");
  if (typeof raw !== "string") throw new TypeError("freshness raw bytes are required");
  if (typeof snapshotTree !== "string" || snapshotTree.trim() === "") throw new TypeError("freshness snapshot_tree is required");
  return Object.freeze({ ref, sha256: sha256(raw), snapshot_tree: snapshotTree });
}

export function assertFresh(binding, { read, snapshotTree }) {
  if (!binding || typeof binding !== "object" || !HASH.test(binding.sha256 ?? "")) {
    throw new TypeError("freshness binding is invalid");
  }
  if (binding.snapshot_tree !== snapshotTree) throw new Error("STALE_FACT: snapshot_tree changed");
  let raw;
  try { raw = read(binding.ref); } catch (error) {
    if (error?.code === "ENOENT") throw new Error(`STALE_FACT: missing ${binding.ref}`);
    throw error;
  }
  if (sha256(raw) !== binding.sha256) throw new Error(`STALE_FACT: hash changed for ${binding.ref}`);
  return true;
}

function readBound(binding, read, dependencies, key) {
  let raw;
  try { raw = read(binding.ref); } catch (error) {
    if (error?.code === "ENOENT") {
      dependencies[key] = "missing";
      return undefined;
    }
    throw error;
  }
  if (sha256(raw) !== binding.sha256) {
    dependencies[key] = "stale";
    return undefined;
  }
  return raw;
}

function expectedPassed(status, passed, failed, nonterminal) {
  if (status === "passed") return passed;
  if (status === "failed") return failed;
  // A missing quality fact is the canonical projection for an acceptance
  // subject that is inconclusive/deferred. Preserve that distinction in the
  // bound leaf without treating it as either a pass or an implementation
  // failure.
  if (status === "missing") return nonterminal === "inconclusive" || nonterminal === "deferred";
  return false;
}

function readBoundJson(binding, read, dependencies, key) {
  if (!binding || typeof binding !== "object" || Array.isArray(binding)
      || typeof binding.ref !== "string" || binding.ref.trim() === ""
      || !HASH.test(binding.sha256 ?? "")) {
    dependencies[key] = "stale";
    return null;
  }
  const raw = readBound(binding, read, dependencies, key);
  if (raw === undefined) return null;
  try {
    return JSON.parse(raw);
  } catch {
    dependencies[key] = "stale";
    return null;
  }
}

function sameAcceptanceScenario(left, right) {
  return left && typeof left === "object" && !Array.isArray(left)
    && right && typeof right === "object" && !Array.isArray(right)
    && ["source", "sample", "scenario", "tier"].every((field) => left[field] === right[field]);
}

function authenticatePublishedAttachment(binding, read, dependencies, key) {
  if (!binding || typeof binding !== "object" || Array.isArray(binding)
      || typeof binding.ref !== "string" || !HASH.test(binding.sha256 ?? "")) {
    throw new Error("browser attachment binding is invalid");
  }
  const publication = readBoundJson(binding, read, dependencies, key);
  if (!publication) throw new Error("browser attachment is unavailable");
  const allowed = new Set([
    "schema_version", "source_path", "content_sha256", "content_encoding", "content_base64", "publisher", "recorded_at",
  ]);
  if (Object.keys(publication).some((field) => !allowed.has(field))
      || publication.schema_version !== "workflowhub-evidence-publication.v1"
      || typeof publication.source_path !== "string" || publication.source_path.trim() === ""
      || publication.source_path.startsWith("/") || publication.source_path.split(/[\\/]/).includes("..")
      || !HASH.test(publication.content_sha256 ?? "")
      || publication.content_encoding !== "base64"
      || typeof publication.content_base64 !== "string"
      || typeof publication.publisher !== "string" || publication.publisher.trim() === ""
      || typeof publication.recorded_at !== "string" || publication.recorded_at.trim() === "") {
    throw new Error("browser attachment publication metadata is invalid");
  }
  const bytes = Buffer.from(publication.content_base64, "base64");
  if (bytes.toString("base64") !== publication.content_base64
      || sha256(bytes) !== publication.content_sha256
      || binding.ref !== `quality/evidence/browser-qa/${publication.content_sha256}.json`) {
    throw new Error("browser attachment publication content is not authenticated");
  }
}

function authenticateBrowserAcceptance(value, fact, scenario, read, dependencies, key) {
  validateBrowserQaEvidence(value);
  if (value.task_id !== fact.task_id || value.stage !== "build-code"
      || value.material_revision !== fact.material_revision || value.snapshot_tree !== fact.snapshot_tree
      || value.result !== "pass" || value.acceptance_scenario?.tier !== "browser"
      || !sameAcceptanceScenario(value.acceptance_scenario, scenario)
      || value.cancellation?.status !== "not_cancelled"
      || value.cleanup?.status !== "completed"
      || value.fixture?.fixture_only !== false
      || value.data_identity?.source !== scenario.source
      || value.data_identity?.dataset_id !== scenario.sample
      || value.data_identity?.fixture_only !== false
      || String(value.service_identity?.instance ?? "").toLowerCase() === "fixture") {
    throw new Error("browser acceptance identity or outcome is not current");
  }
  const screenshots = Array.isArray(value.screenshots) ? value.screenshots : [];
  const screenshotRefs = Array.isArray(value.visual?.screenshot_refs) ? value.visual.screenshot_refs : [];
  if (screenshots.length === 0 || screenshotRefs.length !== screenshots.length
      || new Set(screenshots.map((entry) => entry?.ref)).size !== screenshots.length
      || new Set(screenshotRefs).size !== screenshotRefs.length
      || screenshots.some((entry) => !screenshotRefs.includes(entry?.ref))) {
    throw new Error("browser acceptance screenshots are incomplete");
  }
  screenshots.forEach((screenshot, index) => authenticatePublishedAttachment(
    { ref: screenshot?.ref, sha256: screenshot?.hash }, read, dependencies, `${key}:screenshot:${index}`,
  ));
  if (typeof value.test?.output_ref !== "string" || !HASH.test(value.test?.output_hash ?? "")) {
    throw new Error("browser acceptance test output binding is invalid");
  }
  const outputRaw = readBound({ ref: value.test.output_ref, sha256: value.test.output_hash }, read, dependencies, `${key}:test-output`);
  if (outputRaw === undefined) throw new Error("browser acceptance test output is unavailable");
}

function authenticateExecutionActor(binding, fact, read, dependencies, key) {
  if (!binding || !HASH.test(binding.stage_outcome_hash ?? "")
      || binding.stage_outcome_ref !== `quality/evidence/stage-outcomes/build-code/${binding.stage_outcome_hash}.json`) throw new Error("nested acceptance execution stage outcome binding is invalid");
  const outcomeKey = `${key}:stage-outcome`;
  const reference = { ref: binding.stage_outcome_ref, sha256: binding.stage_outcome_hash };
  const outcome = readBoundJson(reference, read, dependencies, outcomeKey);
  if (!outcome || outcome.schema_version !== "workflowhub-stage-outcomes.v1"
      || outcome.task_id !== fact.task_id || outcome.stage !== "build-code"
      || !new Set(["completed", "incomplete"]).has(outcome.status)
      || outcome.material_revision !== fact.material_revision || outcome.snapshot_tree !== fact.snapshot_tree
      || outcome.run_id !== `vnext-${sha256(`${fact.task_id}\0build-code`).slice(0, 32)}`
      || typeof outcome.attempt_id !== "string" || !outcome.attempt_id.trim()) throw new Error("nested acceptance execution stage outcome is not current");
  const producer = validateStageOutcomeProducerIdentity(outcome, "build-code", { requireSource: true });
  let proofs = 0;
  for (const [kind, rows, idKey] of [["step", outcome.step_outcomes, "step_slug"], ["skill", outcome.skill_outcomes, "skill_id"]]) {
    if (!Array.isArray(rows)) throw new Error("nested stage outcome subjects are invalid");
    const subjects = new Set();
    for (const row of rows) {
      if (typeof row?.[idKey] !== "string" || !row[idKey].trim() || subjects.has(row[idKey])
          || !Array.isArray(row.evidence_refs) || typeof row.result_summary !== "string" || !row.result_summary.trim()
          || (row.status === "completed" && row.evidence_refs.length === 0)) throw new Error("nested stage outcome subject has no valid proof binding");
      subjects.add(row[idKey]);
      for (const [index, proofRef] of row.evidence_refs.entries()) {
        const proofKey = `${outcomeKey}:${kind}:${row[idKey]}:${index}`;
        const raw = readBound(proofRef, read, dependencies, proofKey);
        if (raw === undefined) throw new Error("nested stage outcome producer proof is unavailable");
        validateStageOutcomeProof(raw, proofRef, { taskId: fact.task_id, stage: "build-code", attemptId: outcome.attempt_id,
          materialRevision: fact.material_revision, snapshotTree: fact.snapshot_tree, subjectKind: kind,
          subjectId: row[idKey], outcomeStatus: row.status, resultSummary: row.result_summary, producerIdentity: outcome.producer });
        dependencies[proofKey] = "current";
        proofs++;
      }
    }
  }
  if (proofs === 0) throw new Error("nested acceptance execution actor has no producer proof");
  dependencies[outcomeKey] = "current";
  return { source_kind: producer.kind, source_id: producer.sourceId, run_id: producer.agentRunId };
}

function sameActor(left, right) {
  return left?.source_kind === right?.source_kind && left?.source_id === right?.source_id && left?.run_id === right?.run_id;
}

function authenticateExecutionLeaf(value, fact, read, dependencies, key, scenario = null, aggregateBinding = null) {
  validateAcceptanceExecutionEvidence(value);
  if (value.task_id !== fact.task_id || value.material_revision !== fact.material_revision || value.snapshot_tree !== fact.snapshot_tree) throw new Error("nested per-AC execution provenance mismatch");
  const subject = value.subject_fact, execution = subject.execution;
  if (scenario && (["tier", "source", "sample", "scenario"].some((field) => execution[field] !== scenario[field])
      || !scenario.acceptance_criterion_ids?.includes(value.subject))) throw new Error("nested per-AC scenario mismatch");
  if (aggregateBinding && (subject.execution_binding.stage_outcome_ref !== aggregateBinding.stage_outcome_ref
      || subject.execution_binding.stage_outcome_hash !== aggregateBinding.stage_outcome_hash)) throw new Error("nested per-AC actor is from another execution");
  const actor = authenticateExecutionActor(subject.execution_binding, fact, read, dependencies, key);
  if (!sameActor(actor, subject.executor_actor)) throw new Error("nested per-AC actor does not match its producer proof");
  let stdout;
  for (const stream of ["stdout", "stderr"]) {
    const outputKey = `${key}:${stream}`;
    const raw = readBound({ ref: execution[`${stream}_ref`], sha256: execution[`${stream}_hash`] }, read, dependencies, outputKey);
    if (raw === undefined) throw new Error(`nested acceptance ${stream} is unavailable`);
    if (stream === "stdout") stdout = raw;
    dependencies[outputKey] = "current";
  }
  if (subject.status === "passed") {
    const ids = scenario?.acceptance_criterion_ids ?? (() => {
      const parsed = JSON.parse(Buffer.isBuffer(stdout) ? new TextDecoder("utf-8", { fatal: true }).decode(stdout) : stdout);
      return parsed.entries.map((entry) => entry.acceptance_criterion_id);
    })();
    const rows = deriveAcceptanceExecutionAssertions(stdout, ids);
    const actual = rows.find((row) => row.acceptance_criterion_id === value.subject);
    if (!actual || JSON.stringify(actual.assertions) !== JSON.stringify(subject.assertions)) throw new Error("nested assertions do not match the actual child output");
  }
  return actor;
}

function authenticateE2eExecutionStageQuality(value, fact, read, dependencies, key) {
  if (!value || value.schema_version !== "stage-quality-evidence.v1" || value.task_id !== fact.task_id
      || value.stage !== "build-code" || value.subject !== "acceptance_execution"
      || !new Set(["passed", "failed", "missing"]).has(value.status) || value.subject_fact?.status !== value.status
      || value.material_revision !== fact.material_revision || value.snapshot_tree !== fact.snapshot_tree
      || !Array.isArray(value.subject_fact.execution_items)) throw new Error("nested acceptance execution stage evidence is invalid");
  const binding = value.subject_fact.execution_binding;
  const actor = binding ? authenticateExecutionActor(binding, fact, read, dependencies, key) : null;
  if (value.status === "passed" && (!actor || value.subject_fact.execution_items.length === 0)) throw new Error("passed execution requires a real actor and scenario");
  const seen = new Set();
  for (const [index, item] of value.subject_fact.execution_items.entries()) {
    if (!item || item.task_id !== fact.task_id || !new Set(["executed", "failed", "unavailable"]).has(item.status)
        || !new Set(["command", "service", "browser"]).has(item.tier)
        || !["source", "sample", "scenario"].every((field) => typeof item[field] === "string" && item[field].trim())
        || !Array.isArray(item.evidence_refs) || (item.status === "executed" && item.evidence_refs.length === 0)
        || (value.status === "passed" && item.status !== "executed")) throw new Error("nested acceptance execution item is invalid");
    const scenarioKey = JSON.stringify([item.source, item.sample, item.scenario, item.tier]);
    if (seen.has(scenarioKey)) throw new Error("nested acceptance execution contains duplicate scenarios");
    seen.add(scenarioKey);
    const criterionIds = new Set();
    for (const [refIndex, reference] of item.evidence_refs.entries()) {
      const nestedKey = `${key}:${item.tier}:${index}:${refIndex}`;
      const expected = item.tier === "browser" ? /^quality\/evidence\/browser-qa\/[A-Za-z0-9._-]+\.json$/
        : /^quality\/evidence\/stage-quality\/build-code\/AC-[A-Za-z0-9._-]+-([a-f0-9]{64})\.json$/;
      const match = expected.exec(reference?.ref ?? "");
      if (!match || (item.tier !== "browser" && match[1] !== reference.sha256)) throw new Error("nested execution evidence ref is invalid");
      const nested = readBoundJson(reference, read, dependencies, nestedKey);
      if (!nested) throw new Error("nested acceptance execution evidence is unavailable");
      if (item.tier === "browser") authenticateBrowserAcceptance(nested, fact, item, read, dependencies, nestedKey);
      else {
        if (criterionIds.has(nested.subject)) throw new Error("nested execution has duplicate AC evidence");
        criterionIds.add(nested.subject);
        const leafActor = authenticateExecutionLeaf(nested, fact, read, dependencies, nestedKey, item, binding);
        if (!sameActor(actor, leafActor) || (value.status === "passed" && nested.status !== "passed")) throw new Error("nested execution AC did not pass under the aggregate actor");
      }
      dependencies[nestedKey] = "current";
    }
    if (item.tier !== "browser" && item.status === "executed"
        && (!Array.isArray(item.acceptance_criterion_ids) || item.acceptance_criterion_ids.length !== criterionIds.size
          || item.acceptance_criterion_ids.some((id) => !criterionIds.has(id)))) throw new Error("nested execution omits declared AC evidence");
  }
  return actor;
}

function authenticateE2eAcceptanceStageQuality(value, fact, read, dependencies, key) {
  if (!value || value.schema_version !== "stage-quality-evidence.v1" || value.task_id !== fact.task_id
      || value.stage !== "verify-code" || value.subject !== "e2e_acceptance" || value.status !== "passed"
      || value.material_revision !== fact.material_revision || value.snapshot_tree !== fact.snapshot_tree
      || value.subject_fact?.status !== "passed" || value.subject_fact.evidence_refs?.length !== 3) throw new Error("nested e2e acceptance stage evidence is invalid");
  const selected = {};
  for (const [index, reference] of value.subject_fact.evidence_refs.entries()) {
    const kind = /^quality\/evidence\/acceptance\/build-code\/acceptance_execution-/.test(reference.ref) ? "execution"
      : /^quality\/reviews\/results\//.test(reference.ref) ? "review"
      : /^quality\/confirmations\//.test(reference.ref) ? "confirmation" : null;
    if (!kind || selected[kind]) throw new Error("nested E2E acceptance has invalid or duplicate source refs");
    const nestedKey = `${key}:${kind}:${index}`;
    const nested = readBoundJson(reference, read, dependencies, nestedKey);
    if (!nested) throw new Error(`nested E2E ${kind} evidence is unavailable`);
    selected[kind] = { reference, value: nested };
    dependencies[nestedKey] = "current";
  }
  if (!selected.execution || !selected.review || !selected.confirmation) throw new Error("nested E2E acceptance chain is incomplete");
  const authenticated = authenticateOrdinaryExecutionReview(selected.review.value, fact, read, dependencies, `${key}:review`, selected.review.reference);
  if (authenticated.execution.wrapperReference.ref !== selected.execution.reference.ref
      || authenticated.execution.wrapperReference.sha256 !== selected.execution.reference.sha256) throw new Error("E2E review binds another execution wrapper");
  authenticateExecutionConfirmation(selected.confirmation.value, selected.confirmation.reference, selected.review.reference, fact, read, dependencies, `${key}:confirmation`);
}

function authenticateNested(fact, evidence, raw, { read, dependencies, key, allowMaterialOnlySnapshot = false }) {
  let value;
  try { value = JSON.parse(raw); } catch {
    dependencies[key] = "stale";
    return;
  }
  try {
    const crossStageReview = fact.kind === "review"
      && fact.stage === "verify-code"
      && value.stage === "build-code"
      && (fact.subject === "same_build_integration_review"
        || value.review_kind === "mini_task.implementation");
    const reviewStage = crossStageReview ? "build-code" : fact.stage;
    if (evidence.evidence_type === "test_receipt") {
      if (fact.stage === "verify-code" && fact.subject === "full_tests_fresh") {
        validateCanonicalFullTestReceipt(value, { taskId: fact.task_id, snapshotTree: fact.snapshot_tree, requirePassed: false });
      } else {
        const receiptStage = fact.stage;
        const expectedProducerComponent = receiptStage === "build-code"
          ? "build-code-test-capture"
          : receiptStage === "verify-code"
            ? "verify-code-test-capture"
            : undefined;
        if (value.stage !== receiptStage || expectedProducerComponent === undefined) {
          throw new Error("test receipt stage is not bound to the quality fact");
        }
        validateCanonicalTestReceipt(value, {
          taskId: fact.task_id,
          stage: receiptStage,
          snapshotTree: fact.snapshot_tree,
          expectedProducerComponent,
          requirePassed: false,
        });
      }
      if (!expectedPassed(fact.status, value.exit_code === 0, value.exit_code !== 0)) throw new Error("test outcome mismatch");
      const outputKey = `${key}:output:${value.output_ref}`;
      const outputRaw = readBound({ ref: value.output_ref, sha256: value.output_hash }, read, dependencies, outputKey);
      if (outputRaw !== undefined) dependencies[outputKey] = "current";
    } else if (evidence.evidence_type === "review_result") {
      if (!/^quality\/reviews\/(?:results\/[^/]+\.json|attempts\/[^/]+\/attempt\.json)$/.test(evidence.ref)) {
        throw new Error("review evidence ref is outside the canonical wh-review namespace");
      }
      const adviceReview = isAdviceReviewFact(fact);
      if (value.version === "wh-review-attempt.v1") {
        validateSchema("attempt", value);
        if (value.task_id !== fact.task_id || value.stage !== reviewStage || value.snapshot_tree !== fact.snapshot_tree || value.terminal_status !== "unavailable" || fact.status !== "unavailable") {
          throw new Error("unavailable review provenance mismatch");
        }
      } else {
        validateSchema("result", value);
        const repairedReview = fact.stage === "verify-code"
          && fact.subject === "code_review"
          && fact.review_status === "resolved";
        if (value.task_id !== fact.task_id || value.stage !== reviewStage
            || (value.material_revision !== undefined && value.material_revision !== fact.material_revision)
            || (!adviceReview && !allowMaterialOnlySnapshot && !repairedReview && value.snapshot_tree !== fact.snapshot_tree)) {
          throw new Error("review provenance mismatch");
        }
        // review_kind is optional for the five formal stages.  Older and
        // current wh-review writers may omit it rather than serializing null;
        // both forms mean "formal stage review", while mini-task kinds remain
        // explicit and must never satisfy a formal-stage subject.
        const reviewKind = value.review_kind ?? null;
        const subjectMatches = fact.subject === "same_build_integration_review"
            ? reviewKind === null
              && value.subject_kind === "worktree"
              && value.phase_id === null
              && value.review_scope === "integration"
            : fact.subject === "integration_review"
              ? reviewKind === null
                && value.subject_kind === "worktree"
                && value.phase_id === null
                && value.review_scope === "integration"
            : reviewKind === "mini_task.implementation"
              ? value.subject_kind === "phase"
                && value.phase_id === "mini-task-implementation"
                && value.review_scope === "phase"
              : reviewKind === null
                && value.subject_kind === "worktree"
                && value.phase_id === null;
        if (!subjectMatches) throw new Error("review subject mismatch");
        if (Object.hasOwn(value, "verdict")) throw new Error("current review result must not expose reviewer verdict");
        if (fact.status !== "recorded") throw new Error("review result requires a recorded review fact");
        const hasActionableFinding = canonicalReviewFindings(value).some(isActionableSeriousFinding);
        if (fact.stage === "verify-code" && fact.subject === "code_review"
            && hasActionableFinding && !repairedReview) {
          throw new Error("verify-code code_review has actionable serious findings");
        }
        if (repairedReview && !hasActionableFinding) throw new Error("resolved verify-code review must retain its actionable findings");
      }
    } else if (evidence.evidence_type === "acceptance_evidence") {
      const acceptance = validateAcceptanceEvidence(value);
      if (acceptance.acceptance_criterion_id !== fact.subject) throw new Error("acceptance subject mismatch");
      if (acceptance.snapshot_tree !== undefined && acceptance.snapshot_tree !== fact.snapshot_tree) throw new Error("acceptance tree mismatch");
      if (!expectedPassed(fact.status, acceptance.result === "pass", acceptance.result === "fail", acceptance.result)) throw new Error("acceptance outcome mismatch");
      for (const nested of acceptance.refs) {
        const nestedKey = `${key}:nested:${nested.ref}`;
        const nestedRaw = readBound(nested, read, dependencies, nestedKey);
        if (nestedRaw !== undefined) {
          if (fact.stage === "verify-code" && fact.subject === "e2e_acceptance") {
            let nestedValue;
            try { nestedValue = JSON.parse(nestedRaw); } catch { throw new Error("nested e2e acceptance stage evidence is not JSON"); }
            authenticateE2eAcceptanceStageQuality(nestedValue, fact, read, dependencies, nestedKey);
          } else if (fact.stage === "build-code" && /^quality\/evidence\/stage-quality\/build-code\//.test(nested.ref)) {
            const nestedValue = JSON.parse(nestedRaw);
            if (nestedValue.subject !== fact.subject || nestedValue.status !== fact.status
                || nestedValue.task_id !== fact.task_id || nestedValue.snapshot_tree !== fact.snapshot_tree
                || nestedValue.material_revision !== fact.material_revision) throw new Error("nested stage-quality acceptance binding mismatch");
            if (nestedValue.subject === "acceptance_execution") {
              authenticateE2eExecutionStageQuality(nestedValue, fact, read, dependencies, nestedKey);
            } else if (nestedValue.subject_fact?.execution) {
              authenticateExecutionLeaf(nestedValue, fact, read, dependencies, nestedKey);
            } else {
              for (const [index, reference] of (nestedValue.subject_fact?.evidence_refs ?? []).entries()) {
                if (!/^quality\/evidence\/stage-quality\/build-code\/AC-/.test(reference?.ref ?? "")) continue;
                const leafKey = `${nestedKey}:leaf:${index}`;
                const leaf = readBoundJson(reference, read, dependencies, leafKey);
                if (!leaf) throw new Error("nested AC evidence is unavailable");
                authenticateExecutionLeaf(leaf, fact, read, dependencies, leafKey);
                if (fact.status === "passed" && leaf.status !== "passed") throw new Error("passed acceptance includes failed AC evidence");
                dependencies[leafKey] = "current";
              }
            }
          }
          dependencies[nestedKey] = "current";
        }
      }
    } else if (evidence.evidence_type === "human_confirmation") {
      const closeConfirmation = fact.subject === "close_confirmation";
      validateHumanConfirmation(value, {
        taskId: fact.task_id,
        stage: fact.stage,
        subject: closeConfirmation ? undefined : value.attempt_ref,
        requireAccepted: false,
        // Stage confirmation facts may confirm the current stage outcome
        // without pointing at a provider attempt. Close/irreversible
        // authorization has its own stricter subject_ref validation.
        requireSubjectRef: closeConfirmation,
      });
      if (!closeConfirmation && fact.subject !== "human_confirmation") throw new Error("confirmation subject mismatch");
      if (closeConfirmation && !CLOSE_PLAN_REF.test(value.subject_ref ?? "")) throw new Error("close confirmation subject mismatch");
      if (isHumanConfirmationVersion(value, { current: true })
        && (value.material_revision !== fact.material_revision || value.snapshot_tree !== fact.snapshot_tree)) {
        throw new Error("confirmation provenance mismatch");
      }
      if (!expectedPassed(fact.status, value.decision === "accepted", value.decision === "rejected")) throw new Error("confirmation outcome mismatch");
    } else {
      throw new Error(`unsupported canonical evidence_type: ${evidence.evidence_type}`);
    }
    dependencies[key] = "current";
  } catch {
    dependencies[key] = "stale";
  }
}

export function evaluateFactFreshness(fact, current, { read, workspaceRoot = null, taskId = null } = {}) {
  const adviceReview = isAdviceReviewFact(fact);
  const stageScopedSnapshot = !adviceReview
    && workspaceRoot
    && typeof taskId === "string"
    && isRegisteredStagePredicate(fact)
    && isStageSnapshotCurrent(fact.stage, fact.snapshot_tree, current.snapshot_tree, { snapshotRoot: workspaceRoot, taskId });
  const recordOnly = stageScopedSnapshot && isRegisteredStagePredicate(fact);
  const scopeMatchesStage = fact.material_scope === undefined
    || JSON.stringify(fact.material_scope) === JSON.stringify(STAGE_FACT_MATERIALS[fact.stage]);
  const scopedMaterialCurrent = scopeMatchesStage
    && fact.material_scope_revision !== undefined
    && current.material_scope_revisions
    && fact.material_scope_revision === current.material_scope_revisions[fact.stage];
  const materialCurrent = scopedMaterialCurrent
    || (fact.material_scope === undefined
      && fact.material_scope_revision === undefined
      && fact.material_revision === current.material_revision);
  const dependencies = {
    material: adviceReview || recordOnly || materialCurrent ? "current" : "stale",
    tree: adviceReview || stageScopedSnapshot || fact.snapshot_tree === current.snapshot_tree ? "current" : "stale",
    fact: "current",
  };
  const factRaw = readBound(fact, read, dependencies, "fact");
  if (factRaw !== undefined) {
    try {
      const parsed = JSON.parse(factRaw);
      for (const field of ["schema_version", "fact_id", "task_id", "stage", "material_revision", "material_scope", "material_scope_revision", "snapshot_tree", "kind", "status", "review_status", "subject"]) {
        if (JSON.stringify(parsed[field]) !== JSON.stringify(fact[field])) dependencies.fact = "stale";
      }
      if (parsed.schema_version !== "quality-fact.v1") dependencies.fact = "stale";
      if (!QUALITY_STATUSES.has(parsed.status)
          || (parsed.status === "recorded" && parsed.kind !== "review")) dependencies.fact = "stale";
      if (parsed.review_status !== undefined
          && (parsed.kind !== "review" || !REVIEW_STATUSES.has(parsed.review_status))) dependencies.fact = "stale";
    } catch { dependencies.fact = "stale"; }
  }
  let reviewStatus = fact.review_status ?? null;
  for (const evidence of fact.evidence ?? []) {
    const key = `evidence:${evidence.ref}`;
    const raw = readBound(evidence, read, dependencies, key);
    if (raw !== undefined
        && ((fact.stage === "verify-code" && fact.subject === "code_review")
          || (fact.stage === "build-code" && fact.subject === "integration_review"))
        && evidence.evidence_type === "review_result") {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.version === "wh-review-result.v1" && Array.isArray(parsed.findings)) {
          if (reviewStatus === null) reviewStatus = canonicalReviewFindings(parsed).some(isActionableSeriousFinding) ? "findings" : "clean";
        }
      } catch {
        // authenticateNested records the actual integrity failure below.
      }
    }
    if (raw !== undefined) authenticateNested(fact, evidence, raw, { read, dependencies, key, allowMaterialOnlySnapshot: recordOnly });
  }
  const values = Object.values(dependencies);
  const status = values.includes("missing") ? "missing" : values.every((value) => value === "current") ? "current" : "stale";
  return Object.freeze({
    fact_ref: fact.ref, status, authenticated: status === "current",
    dependencies: Object.freeze(dependencies),
    ...(reviewStatus ? { review_status: reviewStatus } : {}),
  });
}
