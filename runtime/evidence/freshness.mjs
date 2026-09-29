import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { SHA256_HEX } from "./canonical-utils.mjs";
import { Buffer } from "node:buffer";
import { execFileSync } from "node:child_process";
import Ajv2020 from "ajv/dist/2020.js";

import { CLOSE_PLAN_REF, WORKFLOWHUB_CURRENT_SESSION_SOURCE_ID, WORKFLOWHUB_CURRENT_SESSION_BINDING_KIND, acceptanceExecutionOutcomeStatus, deriveAcceptanceExecutionAssertions, isHumanConfirmationVersion, validateAcceptanceExecutionEvidence, validateCanonicalFullTestReceipt, validateCanonicalImplementationReceipt, validateCanonicalQualityFact, validateCanonicalTestReceipt, validateHumanConfirmation, validateStageOutcomeProducerIdentity, validateStageOutcomeProof } from "./canonical-evidence-validators.mjs";
import { validateAcceptanceEvidence } from "./acceptance-evidence-validator.mjs";
import browserQaSchema from "../schemas/browser-qa-evidence.v1.json" with { type: "json" };
import { validateSchema } from "../review/schema-validator.mjs";
import { STAGE_FACT_MATERIALS, stageFactMaterialFiles, stageMaterialScopeRevision } from "../stage/completion-predicates.mjs";
import { buildStageEndReportFacts, renderStageEndReport } from "../stage/stage-end-report.mjs";
import { captureWorkspaceSnapshot } from "./canonical-receipt-writer.mjs";
import { openCurrentTaskWorkspace } from "../task/workspace.mjs";
import { assertTaskHandle } from "../task/task-handle.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { ensureGitSnapshotObjectStore } from "../task/git-worktree-snapshot.mjs";
import { canonicalReviewFindings, deriveSeriousReviewPause, isActionableSeriousFinding, validateRiskAcceptance } from "../review/stage-review-disposition.mjs";
import { aggregateCanonicalProviderResults, authenticateCanonicalReviewResult } from "../review/canonical-review-result.mjs";
import { parseReviewerOutput } from "../review/review-output.mjs";
import { authenticatedEvidenceDigest } from "../review/review-packet-identity.mjs";
import { createQualityFact, qualityFactDigest } from "./quality-fact.mjs";
import { materialRevisionFromValues } from "../task/git-worktree-snapshot.mjs";
import { CURRENT_MATERIAL_FILES, materialFilesForCohort, phaseFilesFromIndex } from "../task/material-workspace.mjs";

export function ordinaryReviewMaterialRevision(materials, materialScope = null) {
  if (!materials || typeof materials !== "object" || Array.isArray(materials)) throw new TypeError("ordinary review materials must be a map");
  const post = Array.isArray(materialScope) && materialScope.includes("phases/index.md");
  const names = post ? materialFilesForCohort("post", materials) : CURRENT_MATERIAL_FILES;
  if (post && JSON.stringify(materialScope) !== JSON.stringify(names)) throw new Error("ordinary review post material scope does not match indexed Phase files");
  if (names.some((name) => typeof materials[name] !== "string" || materials[name].trim() === "")) {
    throw new Error("ordinary review material bundle is incomplete");
  }
  return materialRevisionFromValues(names.map((name) => [name, materials[name]]));
}

function readTypedExecutionFact(selection, fact, read, dependencies, key) {
  if (!selection || !SHA256_HEX.test(selection.sha256 ?? "")
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
  if (review.attempt_ref !== `quality/reviews/attempts/${attempt.attempt_id}/attempt.json`) throw new Error("ordinary execution review canonical ref does not match its producing attempt");
  if (Object.hasOwn(review, "result_ref") || Object.hasOwn(attempt, "result_ref")) {
    // Content binding, not path binding: the result record and its producing
    // attempt must interlink the same result_ref, but the path a caller used to
    // read those bytes is not part of the identity. A content-identical alias
    // (for example a verification-shaped copy) stays acceptable; a record whose
    // own interlink disagrees with its attempt does not.
    if (review.result_ref !== attempt.result_ref) {
      throw new Error(`ordinary review result/attempt path identity mismatch: result_ref ${String(review.result_ref)} does not interlink attempt result_ref ${String(attempt.result_ref)} (selected ${String(reviewReference?.ref)})`);
    }
  }
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
  const executionEvidence = request.authenticated_evidence;
  if (request.stage !== "verify-code") throw new Error("ordinary execution review frozen request is not verify-code");
  // The ordinary OCR route projects a task-bound packet; the frozen host
  // request is broader than those provider-visible bytes. Its generic packet
  // hash is therefore not the dispatched packet identity. Authenticate the
  // recorder's canonical packet attestation against both immutable records
  // and the exact evidence bytes retained in the frozen request instead.
  const closure = attempt.closure_manifest;
  const evidenceHash = authenticatedEvidenceDigest(executionEvidence);
  if (!closure || closure.version !== "wh-review-closure.v1"
      || closure.packet_sha256 !== review.material_id || closure.material_id !== review.material_id
      || closure.snapshot_tree !== fact.snapshot_tree || closure.material_revision !== fact.material_revision
      || closure.authenticated_evidence_sha256 !== evidenceHash
      || attempt.authenticated_evidence_sha256 !== evidenceHash
      || review.authenticated_evidence_sha256 !== evidenceHash) {
    throw new Error("ordinary execution review OCR packet identity mismatch");
  }
  if (ordinaryReviewMaterialRevision(executionEvidence?.runtime_current_materials, fact.material_scope) !== fact.material_revision) {
    throw new Error("ordinary execution review material revision does not match the current bound materials");
  }
  const execution = readTypedExecutionFact(request.reviewed_execution, fact, read, dependencies, key);
  if (binding.reviewed_execution.ref !== request.reviewed_execution.ref
      || binding.reviewed_execution.sha256 !== request.reviewed_execution.sha256
      || !sameActor(binding.reviewed_execution.actor, execution.actor)
      || executionEvidence?.runtime_execution?.raw !== read(binding.reviewed_execution.ref)) throw new Error("ordinary review execution does not match its frozen bundle");
  for (const item of execution.aggregate.subject_fact.execution_items) {
    for (const reference of item.evidence_refs) {
      const frozenRecord = executionEvidence?.runtime_execution_records?.find((entry) => entry.ref === reference.ref && entry.sha256 === reference.sha256);
      if (!frozenRecord || frozenRecord.raw !== read(reference.ref)) throw new Error("ordinary review omitted actual per-AC execution bytes");
    }
  }
  const reviewer = binding.reviewer_actor;
  if (reviewer.source_kind !== "review_provider" || !attempt.provider_attempts.some((provider) => provider.status === "completed"
      && provider.identity?.source_id === reviewer.source_id && provider.runtime_id === reviewer.run_id)) throw new Error("ordinary execution reviewer is not an authenticated provider actor");
  dependencies[`${key}:attempt`] = "current";
  dependencies[`${key}:frozen-material`] = "current";
  return { execution, binding, request };
}

export function authenticateExecutionConfirmation(confirmation, reference, reviewReference, fact, read, dependencies = {}, key = "execution-confirmation") {
  validateHumanConfirmation(confirmation, { taskId: fact.task_id, stage: "verify-code", requireAccepted: true });
  if (confirmation.schema_version !== "human-confirmation.v3" || confirmation.subject_ref !== reviewReference.ref
      || confirmation.material_revision !== fact.material_revision || confirmation.snapshot_tree !== fact.snapshot_tree
      || reference.ref !== `quality/confirmations/${reference.sha256}.json`) throw new Error("execution confirmation is not bound to the current ordinary review");
  const materialScope = Array.isArray(fact.material_scope) && fact.material_scope.length > 0
    ? fact.material_scope
    : STAGE_FACT_MATERIALS["verify-code"];
  const expected = createQualityFact({ taskId: fact.task_id, stage: "verify-code", materialRevision: fact.material_revision,
    materialScope, materialScopeRevision: fact.material_scope_revision,
    snapshotTree: fact.snapshot_tree, kind: "confirmation", status: "passed", subject: "human_confirmation",
    evidence: [{ ref: reference.ref, sha256: reference.sha256, evidence_type: "human_confirmation" }], recordedAt: confirmation.confirmed_at });
  const value = readBoundJson(expected, read, dependencies, `${key}:typed-fact`);
  if (value) validateCanonicalQualityFact(value);
  if (!value || value.fact_id !== expected.value.fact_id || qualityFactDigest(value) !== qualityFactDigest(expected.value)) throw new Error("execution confirmation typed fact is unavailable or invalid");
  dependencies[`${key}:typed-fact`] = "current";
  return expected.ref;
}

const QUALITY_STATUSES = new Set(["passed", "failed", "unavailable", "missing", "recorded"]);
const REVIEW_STATUSES = new Set(["clean", "findings", "resolved", "unavailable"]);
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
  // source_strength is derived from the authenticated provider union. Older
  // immutable summaries can omit it; present values and all other fields
  // still undergo the original strict comparison. Never alter source bytes.
  const comparison = structuredClone(result);
  return authenticateCanonicalReviewResult({ attempt, result: comparison, providerOutputs,
    assess: (eligibleProviders) => {
      if (comparison.adjudication !== undefined) {
        const derived = aggregateCanonicalProviderResults(eligibleProviders);
        const byId = new Map(derived.findings.map((finding) => [finding.id, finding]));
        for (const finding of [...comparison.findings, ...comparison.adjudication.clusters]) {
          if (!Object.hasOwn(finding, "source_strength") && byId.has(finding.id)) {
            finding.source_strength = byId.get(finding.id).source_strength;
          }
        }
      }
      return eligibleProviders;
    } });
}

/**
 * Existing verify-code repair dispositions bind current source and affected
 * checks. The bridge, outcome reader and fact writer share this read-only
 * contract; it does not create a receipt or judge whether a fix is correct.
 * Owner: verify-code outcome producer. Consumers: those three boundaries.
 * Retain until the existing disposition contract is replaced; no new store.
 */
export function authenticateCodeReviewRepairs({ review, result, taskId, snapshotTree, materialRevision, workspaceRoot, read, includeNonblocking = false }) {
  const findings = canonicalReviewFindings(review).filter((finding) => (
    includeNonblocking ? typeof finding?.id === "string" : isActionableSeriousFinding(finding)
  ));
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
          || (source.sha256 !== null && !SHA256_HEX.test(source.sha256 ?? ""))) throw new Error("review repair source ref is invalid");
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
          || !SHA256_HEX.test(check.sha256 ?? "") || checks.has(check.ref)) throw new Error("review repair check ref is invalid");
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

export const sha256 = (value) => createHash("sha256").update(value).digest("hex");

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
  // A missing quality fact can carry any nonterminal acceptance result.
  // Preserve the bound leaf without treating it as a pass or implementation failure.
  if (status === "missing") return ["inconclusive", "deferred", "missing", "inconsistent", "incomplete", "unavailable"].includes(nonterminal);
  return false;
}

function readBoundJson(binding, read, dependencies, key) {
  if (!binding || typeof binding !== "object" || Array.isArray(binding)
      || typeof binding.ref !== "string" || binding.ref.trim() === ""
      || !SHA256_HEX.test(binding.sha256 ?? "")) {
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
      || typeof binding.ref !== "string" || !SHA256_HEX.test(binding.sha256 ?? "")) {
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
      || !SHA256_HEX.test(publication.content_sha256 ?? "")
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
  if (typeof value.test?.output_ref !== "string" || !SHA256_HEX.test(value.test?.output_hash ?? "")) {
    throw new Error("browser acceptance test output binding is invalid");
  }
  const outputRaw = readBound({ ref: value.test.output_ref, sha256: value.test.output_hash }, read, dependencies, `${key}:test-output`);
  if (outputRaw === undefined) throw new Error("browser acceptance test output is unavailable");
}

function authenticateBrowserUiQaProjection(projection, browserSources, browserItems, binding, fact, aggregateStatus) {
  if (browserSources.length === 0) {
    if (projection === undefined) return;
    const unavailableBrowser = browserItems.length > 0 && browserItems.every((item) =>
      new Set(["unavailable", "failed"]).has(item.status) && item.evidence_refs.length === 0);
    if (unavailableBrowser && aggregateStatus === "missing" && fact.status === "missing"
        && projection && typeof projection === "object" && !Array.isArray(projection)
        && projection.status === "unknown" && typeof projection.reason === "string"
        && projection.reason.trim() && Array.isArray(projection.items) && projection.items.length === 0) return;
    throw new Error("UI QA projection has no browser execution source");
  }
  // Old non-passing browser aggregates remain readable. A current passing
  // aggregate must carry the projection in these same immutable bytes.
  const postMaterial = Array.isArray(fact.material_scope) && fact.material_scope.includes("phases/index.md");
  if (projection === undefined && (!postMaterial || aggregateStatus !== "passed")) return;
  if (!projection || typeof projection !== "object" || Array.isArray(projection)
      || !Array.isArray(projection.items)) throw new Error("browser UI QA projection is missing or invalid");
  if (aggregateStatus !== "passed") {
    if (projection.status !== "unknown" || typeof projection.reason !== "string"
        || !projection.reason.trim() || projection.items.length !== 0) {
      throw new Error("non-passing browser UI QA projection is inconsistent");
    }
    return;
  }
  if (projection.status !== "passed" || projection.items.length !== browserSources.length
      || binding?.kind !== WORKFLOWHUB_CURRENT_SESSION_BINDING_KIND
      || typeof binding.attempt_id !== "string" || !binding.attempt_id.trim()) {
    throw new Error("passing browser UI QA projection has no unique current source");
  }
  const seenCases = new Set();
  const seenRefs = new Set();
  for (const { item, reference, browser } of browserSources) {
    const caseValue = { source: item.source, sample: item.sample, scenario: item.scenario, tier: "browser" };
    const caseKey = JSON.stringify(caseValue);
    if (seenCases.has(caseKey) || !Array.isArray(item.acceptance_criterion_ids)
        || item.acceptance_criterion_ids.length !== 1
        || browser.acceptance_criterion_id !== item.acceptance_criterion_ids[0]
        || browser.attempt_id !== binding.attempt_id || browser.task_id !== fact.task_id
        || browser.material_revision !== fact.material_revision || browser.snapshot_tree !== fact.snapshot_tree
        || browser.test?.exit_code !== 0 || browser.result !== "pass"
        || browser.fixture?.fixture_only !== false || browser.data_identity?.fixture_only !== false
        || browser.cancellation?.status !== "not_cancelled" || browser.cleanup?.status !== "completed") {
      throw new Error("browser UI QA projection source identity or result is invalid");
    }
    seenCases.add(caseKey);
    const matching = projection.items.filter((entry) => entry?.evidence_ref === reference.ref
      && entry?.evidence_hash === reference.sha256);
    if (matching.length !== 1 || seenRefs.has(reference.ref)
        || reference.ref !== `quality/evidence/browser-qa/${reference.sha256}.json`) {
      throw new Error("browser UI QA projection ref/hash does not uniquely match execution");
    }
    seenRefs.add(reference.ref);
    const entry = matching[0];
    if (!sameAcceptanceScenario(entry.case, caseValue)
        || !Array.isArray(entry.acceptance_criterion_ids)
        || JSON.stringify(entry.acceptance_criterion_ids) !== JSON.stringify(item.acceptance_criterion_ids)
        || entry.task_id !== browser.task_id || entry.attempt_id !== browser.attempt_id
        || entry.material_revision !== browser.material_revision || entry.snapshot_tree !== browser.snapshot_tree
        || entry.result !== browser.result || entry.status !== "passed"
        || ["service_identity", "api_identity", "dto_identity"].some((field) => !browser[field]
          || JSON.stringify(entry[field]) !== JSON.stringify(browser[field]))) {
      throw new Error("browser UI QA projection disagrees with raw source or execution item");
    }
  }
}

function authenticateExecutionActor(binding, fact, read, dependencies, key) {
  if (binding?.kind === WORKFLOWHUB_CURRENT_SESSION_BINDING_KIND) {
    const expectedRunId = `vnext-${sha256(`${fact.task_id}\0build-code`).slice(0, 32)}`;
    if (binding.task_id !== fact.task_id || binding.stage !== "build-code"
        || binding.snapshot_tree !== fact.snapshot_tree
        || binding.material_revision !== fact.material_revision
        || typeof binding.attempt_id !== "string" || !binding.attempt_id.trim()
        || binding.run_id !== expectedRunId) throw new Error("current-session acceptance execution binding is not current");
    dependencies[`${key}:current-session`] = "current";
    return {
      source_kind: "workflowhub-session",
      source_id: WORKFLOWHUB_CURRENT_SESSION_SOURCE_ID,
      run_id: binding.run_id,
    };
  }
  if (!binding || !SHA256_HEX.test(binding.stage_outcome_hash ?? "")
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

function sameExecutionBinding(left, right) {
  if (!left || !right) return false;
  if (left.kind === WORKFLOWHUB_CURRENT_SESSION_BINDING_KIND || right.kind === WORKFLOWHUB_CURRENT_SESSION_BINDING_KIND) {
    return left.kind === WORKFLOWHUB_CURRENT_SESSION_BINDING_KIND
      && right.kind === WORKFLOWHUB_CURRENT_SESSION_BINDING_KIND
      && left.task_id === right.task_id
      && left.stage === right.stage
      && left.attempt_id === right.attempt_id
      && left.run_id === right.run_id
      && left.snapshot_tree === right.snapshot_tree
      && left.material_revision === right.material_revision;
  }
  return left.stage_outcome_ref === right.stage_outcome_ref && left.stage_outcome_hash === right.stage_outcome_hash;
}

function authenticateExecutionLeaf(value, fact, read, dependencies, key, scenario = null, aggregateBinding = null) {
  validateAcceptanceExecutionEvidence(value);
  if (value.task_id !== fact.task_id || value.material_revision !== fact.material_revision || value.snapshot_tree !== fact.snapshot_tree) throw new Error("nested per-AC execution provenance mismatch");
  const subject = value.subject_fact, execution = subject.execution;
  if (scenario && (["tier", "source", "sample", "scenario"].some((field) => execution[field] !== scenario[field])
      || !scenario.acceptance_criterion_ids?.includes(value.subject))) throw new Error("nested per-AC scenario mismatch");
  if (aggregateBinding && !sameExecutionBinding(subject.execution_binding, aggregateBinding)) throw new Error("nested per-AC actor is from another execution");
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
  if (["passed", "deferred", "unavailable"].includes(subject.status)) {
    const ids = scenario?.acceptance_criterion_ids ?? (() => {
      const parsed = JSON.parse(Buffer.isBuffer(stdout) ? new TextDecoder("utf-8", { fatal: true }).decode(stdout) : stdout);
      return parsed.entries.map((entry) => entry.acceptance_criterion_id);
    })();
    const rows = deriveAcceptanceExecutionAssertions(stdout, ids);
    const actual = rows.find((row) => row.acceptance_criterion_id === value.subject);
    const declaredOutcome = subject.outcome ?? (subject.status === "passed" ? "achieved" : null);
    if (!actual || JSON.stringify(actual.assertions) !== JSON.stringify(subject.assertions)
        || declaredOutcome === null || actual.outcome !== declaredOutcome
        || acceptanceExecutionOutcomeStatus(actual.outcome) !== subject.status) {
      throw new Error("nested assertions or outcome do not match the actual child output");
    }
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
  const browserSources = [];
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
      if (item.tier === "browser") {
        authenticateBrowserAcceptance(nested, fact, item, read, dependencies, nestedKey);
        browserSources.push({ item, reference, browser: nested });
      }
      else {
        if (criterionIds.has(nested.subject)) throw new Error("nested execution has duplicate AC evidence");
        criterionIds.add(nested.subject);
        const leafActor = authenticateExecutionLeaf(nested, fact, read, dependencies, nestedKey, item, binding);
        if (!sameActor(actor, leafActor)) throw new Error("nested execution AC actor does not match the aggregate actor");
      }
      dependencies[nestedKey] = "current";
    }
    if (item.tier !== "browser" && item.status === "executed"
        && (!Array.isArray(item.acceptance_criterion_ids) || item.acceptance_criterion_ids.length !== criterionIds.size
          || item.acceptance_criterion_ids.some((id) => !criterionIds.has(id)))) throw new Error("nested execution omits declared AC evidence");
  }
  authenticateBrowserUiQaProjection(value.subject_fact.ui_qa_projection, browserSources,
    value.subject_fact.execution_items.filter((item) => item.tier === "browser"), binding, fact, value.status);
  return actor;
}

// One full aggregate authenticator is shared by review material, E2E
// verification, and later freshness consumers. A wrapper/binding-only check
// must not admit a foreign task, forged actor, or missing per-AC leaf.
export function authenticateAcceptanceExecutionAggregate(value, fact, read, dependencies = {}, key = "acceptance-execution") {
  return authenticateE2eExecutionStageQuality(value, fact, read, dependencies, key);
}

function authenticateE2eAcceptanceStageQuality(value, fact, read, dependencies, key) {
  if (!value || value.schema_version !== "stage-quality-evidence.v1" || value.task_id !== fact.task_id
      || value.stage !== "verify-code" || value.subject !== "e2e_acceptance"
      || value.material_revision !== fact.material_revision || value.snapshot_tree !== fact.snapshot_tree) {
    throw new Error("nested e2e acceptance stage evidence is invalid");
  }
  // A missing/deferred E2E result is still an authenticated current fact. It
  // must be visible as missing, not discarded as stale; empty refs ensure it
  // cannot be mistaken for an execution/review/confirmation chain.
  if (value.status === "missing") {
    if (fact.status !== "missing" || value.subject_fact?.status !== "missing"
        || !Array.isArray(value.subject_fact.evidence_refs) || value.subject_fact.evidence_refs.length !== 0) {
      throw new Error("nested missing e2e acceptance evidence is invalid");
    }
    return;
  }
  if (value.status !== "passed" || fact.status !== "passed"
      || value.subject_fact?.status !== "passed" || value.subject_fact.evidence_refs?.length !== 3) {
    throw new Error("nested e2e acceptance stage evidence is invalid");
  }
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
    // Material revision is provenance, not a validity switch for recorded
    // stage/phase reviews. Only the verify-code terminal code review retains
    // a current snapshot guard; build-code integration and all other review
    // facts remain readable when their source material or ordinary snapshot
    // moves. E2E/acceptance execution paths have their own stricter bindings.
    const requiresCurrentCodeSnapshot = fact.stage === "verify-code"
      && fact.subject === "code_review"
      && !crossStageReview;
    // The stage runner writes this immutable marker when a predicate has no
    // canonical handler evidence. It is itself the truthful evidence for a
    // `missing` fact; do not route it through the review/test/acceptance
    // evidence validators, which would incorrectly turn the current missing
    // observation into a stale fact and let an older green observation win.
    if (value.schema_version === "stage-quality-missing.v1") {
      if (fact.status !== "missing"
          || value.task_id !== fact.task_id
          || value.stage !== fact.stage
          || value.subject !== fact.subject
          || value.snapshot_tree !== fact.snapshot_tree) {
        throw new Error("stage-quality-missing evidence does not bind the missing quality fact");
      }
      dependencies[key] = "current";
      return;
    }
    if (value.schema_version === "stage-quality-unavailable.v1") {
      if (fact.status !== "unavailable"
          || value.task_id !== fact.task_id
          || value.stage !== fact.stage
          || value.subject !== fact.subject
          || value.snapshot_tree !== fact.snapshot_tree
          || JSON.stringify(value.error) !== JSON.stringify(fact.error)) {
        throw new Error("stage-quality-unavailable evidence does not bind the unavailable quality fact");
      }
      dependencies[key] = "current";
      return;
    }
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
      if (value.runtime_profile !== undefined && (value.runtime_profile_status !== "ready" || value.runtime_profile_authenticated !== true)) {
        throw new Error("test receipt runtime profile is unavailable");
      }
      if (!expectedPassed(fact.status, value.exit_code === 0, value.exit_code !== 0)) throw new Error("test outcome mismatch");
      const outputKey = `${key}:output:${value.output_ref}`;
      const outputRaw = readBound({ ref: value.output_ref, sha256: value.output_hash }, read, dependencies, outputKey);
      if (outputRaw !== undefined) dependencies[outputKey] = "current";
    } else if (evidence.evidence_type === "review_result") {
      if (!/^quality\/reviews\/(?:results\/[^/]+\.json|attempts\/[^/]+\/attempt\.json)$/.test(evidence.ref)) {
        throw new Error("review evidence ref is outside the canonical wh-review namespace");
      }
      if (value.version === "wh-review-attempt.v1") {
        validateSchema("attempt", value);
        if (value.task_id !== fact.task_id || value.stage !== reviewStage
            || (requiresCurrentCodeSnapshot && value.snapshot_tree !== fact.snapshot_tree)
            || value.terminal_status !== "unavailable" || fact.status !== "unavailable") {
          throw new Error("unavailable review provenance mismatch");
        }
      } else {
        validateSchema("result", value);
        const repairedReview = fact.stage === "verify-code"
          && fact.subject === "code_review"
          && fact.review_status === "resolved";
        if (value.task_id !== fact.task_id || value.stage !== reviewStage
            || (!allowMaterialOnlySnapshot && !repairedReview && requiresCurrentCodeSnapshot && value.snapshot_tree !== fact.snapshot_tree)) {
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
        const hasReportableFinding = canonicalReviewFindings(value).some((finding) => typeof finding?.id === "string");
        if (fact.stage === "verify-code" && fact.subject === "code_review"
            && hasActionableFinding && !repairedReview) {
          throw new Error("verify-code code_review has actionable serious findings");
        }
        // A resolved current-session repair may close a nonblocking finding as
        // well as a serious one. The writer authenticates every reportable
        // finding when it records `review_status=resolved`; the read-back
        // consumer must preserve that same disposition instead of requiring a
        // serious finding that the immutable provider result never had.
        if (repairedReview && !hasReportableFinding) throw new Error("resolved verify-code review must retain its reportable findings");
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
              const acReferences = nestedValue.subject_fact?.evidence_refs ?? [];
              const executionWrappers = acReferences.filter((reference) =>
                /^quality\/evidence\/acceptance\/build-code\/acceptance_execution-[a-f0-9]{64}\.json$/.test(reference?.ref ?? ""));
              const browserReferences = acReferences.filter((reference) =>
                /^quality\/evidence\/browser-qa\/[a-f0-9]{64}\.json$/.test(reference?.ref ?? ""));
              const postAc = Array.isArray(fact.material_scope) && fact.material_scope.includes("phases/index.md")
                && /^AC-/.test(fact.subject);
              if (postAc && fact.status === "passed" && acReferences.length === 0
                  && !new Set(["zero_review_findings", "not_applicable"]).has(nestedValue.subject_fact?.evidence_state)) {
                throw new Error("passed AC has no current source evidence");
              }
              if (executionWrappers.length > 0 || browserReferences.length > 0) {
                if (executionWrappers.length !== 1) throw new Error("browser AC has no unique execution wrapper");
                const wrapperKey = `${nestedKey}:execution-wrapper`;
                const wrapper = readBoundJson(executionWrappers[0], read, dependencies, wrapperKey);
                if (!wrapper) throw new Error("browser AC execution wrapper is unavailable");
                validateAcceptanceEvidence(wrapper);
                if (wrapper.acceptance_criterion_id !== "acceptance_execution" || wrapper.refs.length !== 1
                    || wrapper.snapshot_tree !== fact.snapshot_tree
                    || wrapper.freshness?.material_revision !== fact.material_revision
                    || (fact.status === "passed" && wrapper.result !== "pass")) {
                  throw new Error("browser AC execution wrapper identity is invalid");
                }
                const aggregateReference = wrapper.refs[0];
                if (aggregateReference.ref !== `quality/evidence/stage-quality/build-code/acceptance_execution-${aggregateReference.sha256}.json`) {
                  throw new Error("browser AC wrapper does not point to a canonical aggregate");
                }
                const aggregateKey = `${nestedKey}:execution-aggregate`;
                const aggregate = readBoundJson(aggregateReference, read, dependencies, aggregateKey);
                if (!aggregate) throw new Error("browser AC execution aggregate is unavailable");
                authenticateE2eExecutionStageQuality(aggregate, fact, read, dependencies, aggregateKey);
                const required = aggregate.subject_fact.execution_items.filter((item) =>
                  item.tier === "browser" && item.acceptance_criterion_ids?.includes(fact.subject));
                const commandReferences = acReferences.filter((reference) =>
                  reference?.ref?.startsWith(`quality/evidence/stage-quality/build-code/${fact.subject}-`));
                const requiredCommandReferences = aggregate.subject_fact.execution_items
                  .filter((item) => item.tier !== "browser" && item.acceptance_criterion_ids?.includes(fact.subject))
                  .flatMap((item) => item.evidence_refs ?? [])
                  .filter((reference) => reference?.ref?.startsWith(`quality/evidence/stage-quality/build-code/${fact.subject}-`));
                if (fact.status === "passed" && (commandReferences.length !== requiredCommandReferences.length
                    || commandReferences.some((reference) => !requiredCommandReferences.some((expected) =>
                      reference.ref === expected.ref && reference.sha256 === expected.sha256))
                    || requiredCommandReferences.some((expected) => !commandReferences.some((reference) =>
                      reference.ref === expected.ref && reference.sha256 === expected.sha256)))) {
                  throw new Error("passed mixed AC omits or borrows a command source from this execution");
                }
                if (fact.status === "passed" && (aggregate.status !== "passed" || required.length === 0
                    || browserReferences.length !== required.length)) {
                  throw new Error("passed browser AC is absent from this execution aggregate");
                }
                if (fact.status !== "passed") {
                  const declared = required.flatMap((item) => item.evidence_refs ?? []);
                  if (browserReferences.some((reference) => !declared.some((source) =>
                    source.ref === reference.ref && source.sha256 === reference.sha256))) {
                    throw new Error("non-passing browser AC cites a foreign raw source");
                  }
                  dependencies[wrapperKey] = "current";
                  dependencies[aggregateKey] = "current";
                } else {
                  const matched = new Set();
                  for (const [index, item] of required.entries()) {
                    if (item.acceptance_criterion_ids?.length !== 1 || item.evidence_refs?.length !== 1) {
                      throw new Error("browser AC execution item is not unique");
                    }
                    const reference = item.evidence_refs[0];
                    if (!browserReferences.some((source) => source.ref === reference.ref && source.sha256 === reference.sha256)
                        || matched.has(reference.ref)) throw new Error("browser AC raw source belongs to another run or AC");
                    matched.add(reference.ref);
                    const browserKey = `${nestedKey}:browser:${index}`;
                    const browser = readBoundJson(reference, read, dependencies, browserKey);
                    if (!browser) throw new Error("browser AC raw source is unavailable");
                    authenticateBrowserAcceptance(browser, fact, item, read, dependencies, browserKey);
                    if (browser.acceptance_criterion_id !== fact.subject
                        || browser.attempt_id !== aggregate.subject_fact.execution_binding?.attempt_id
                        || browser.result !== "pass" || browser.test?.exit_code !== 0) {
                      throw new Error("browser AC raw source identity or result is invalid");
                    }
                    dependencies[browserKey] = "current";
                  }
                  dependencies[wrapperKey] = "current";
                  dependencies[aggregateKey] = "current";
                }
              }
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

/**
 * Authenticate a recorded quality fact and its immutable evidence chain.
 *
 * This reader deliberately has no current material or worktree input.  The
 * fact's material/snapshot fields remain part of its own proof binding, while
 * later material edits are not treated as an invalidation signal.
 */
export function authenticateQualityFactRecord(fact, { read } = {}) {
  if (!fact || typeof fact !== "object" || Array.isArray(fact)
      || typeof fact.ref !== "string" || typeof fact.sha256 !== "string"
      || typeof read !== "function") {
    return Object.freeze({ fact_ref: fact?.ref ?? null, status: "unavailable", authenticated: false, dependencies: Object.freeze({ fact: "unavailable" }) });
  }
  const dependencies = { fact: "current" };
  const factRaw = readBound(fact, read, dependencies, "fact");
  if (factRaw === undefined) {
    return Object.freeze({ fact_ref: fact.ref, status: dependencies.fact === "missing" ? "missing" : "unavailable", authenticated: false, dependencies: Object.freeze(dependencies) });
  }
  let parsed;
  try {
    parsed = validateCanonicalQualityFact(JSON.parse(factRaw));
    const digest = qualityFactDigest(parsed);
    if (fact.ref !== `quality/facts/${digest}.json` || parsed.fact_id !== `quality-${digest}`) throw new Error("quality fact ref identity mismatch");
    if (sha256(factRaw) !== fact.sha256) throw new Error("quality fact hash mismatch");
  } catch {
    dependencies.fact = "stale";
    return Object.freeze({ fact_ref: fact.ref, status: "unavailable", authenticated: false, dependencies: Object.freeze(dependencies) });
  }

  let reviewStatus = parsed.review_status ?? null;
  for (const evidence of parsed.evidence) {
    const key = `evidence:${evidence.ref}`;
    const raw = readBound(evidence, read, dependencies, key);
    if (raw === undefined) continue;
    if (evidence.evidence_type === "review_result"
        && ((parsed.stage === "verify-code" && parsed.subject === "code_review")
          || (parsed.stage === "build-code" && parsed.subject === "integration_review"))) {
      try {
        const value = JSON.parse(raw);
        if (value?.version === "wh-review-result.v1" && Array.isArray(value.findings)) {
          reviewStatus ??= canonicalReviewFindings(value).some(isActionableSeriousFinding) ? "findings" : "clean";
        }
      } catch {
        // authenticateNested below records the integrity failure.
      }
    }
    authenticateNested(parsed, evidence, raw, { read, dependencies, key });
  }
  const values = Object.values(dependencies);
  const missing = values.includes("missing");
  const authenticated = values.every((value) => value === "current");
  return Object.freeze({
    fact_ref: fact.ref,
    status: authenticated ? "recorded" : missing ? "missing" : "unavailable",
    authenticated,
    dependencies: Object.freeze(dependencies),
    ...(reviewStatus ? { review_status: reviewStatus } : {}),
  });
}

// A deferred leaf is an execution judgment, not business acceptance. Only a
// criterion explicitly assigned to the next stage by the current spec qualifies.
export function isFutureStageAcceptanceDeferred({ spec, activeCriterionIds, criterionId, outcome, owner } = {}) {
  if (outcome !== "deferred" || owner !== "verify-code" || typeof spec !== "string"
      || !Array.isArray(activeCriterionIds) || !activeCriterionIds.includes(criterionId)) return false;
  const declarations = [...spec.matchAll(/^(?:[ \t]*[-*][ \t]*(?:\[[ xX]\][ \t]*)?|#{1,6}[ \t]+)(?:\*\*)?(AC-[A-Za-z0-9-]+)(?=$|[\s*（(:：])[^\n]*/gm)];
  const matches = declarations.filter((match) => match[1] === criterionId);
  if (matches.length !== 1) return false;
  const declaration = matches[0], next = declarations.find((match) => match.index > declaration.index);
  const body = declaration[0] + spec.slice(declaration.index + declaration[0].length, next?.index ?? spec.length).split(/^#{1,6}\s+/m)[0];
  // Counterexamples and ordinary mentions cannot assign an AC to a later stage.
  const normative = body.split(/(?:失败场景|失败条件|负控|failure\s+(?:scenario|condition)|negative\s+control)\s*[:=：]?/i)[0].replace(/[*`]/g, "");
  if (/(?:无需|不需要|不要求|not\s+(?:required|needed))[^。;；\n]*verify-code/i.test(normative)) return false;
  const condition = normative.match(/(?:条件|precondition)\s*[:=：]([^。;；\n]+)/i)?.[1];
  if (!condition) return false;
  const action = "(?:独立|independent\\s+)?(?:语义(?:抽查|审查)|semantic\\s+(?:review|spot-check)|审查|抽查|授权|review|authorization|execution)";
  return new RegExp(`verify-code\\s*(?:阶段|stage)?\\s*${action}\\s*(?:均)?(?:已产生|已完成|completed|produced)`, "i").test(condition);
}

/** Compose existing immutable readers for build-code completion, not quality pass.
 * The stage supplies the existing unavailable-review verifier as an internal
 * dependency; no user field or terminal label substitutes for that verifier. */
export function authenticateBuildCodeCompletion({ task: taskHandle, read, currentMaterialRevision, snapshotTree, spec,
  activeCriterionIds, observations = [], verifyUnavailableReview } = {}) {
  let unavailablePhaseReview = false, acceptanceExecutionComplete = false;
  try {
    const task = assertTaskHandle(taskHandle), taskId = task.identity.taskId;
    if (typeof read !== "function" || !Array.isArray(observations) || !Array.isArray(activeCriterionIds)
        || activeCriterionIds.length === 0 || new Set(activeCriterionIds).size !== activeCriterionIds.length) throw new Error("completion sources are unavailable");
    const select = (subject) => {
      const entries = observations.filter((entry) => (entry?.fact?.value ?? entry?.fact)?.stage === "build-code"
        && (entry?.fact?.value ?? entry?.fact)?.subject === subject);
      if (entries.length === 1) return entries[0];
      const ranked = entries.map((entry) => ({ entry, time: Date.parse((entry.fact.value ?? entry.fact).recorded_at) }));
      if (ranked.some(({ time }) => !Number.isFinite(time))) return null;
      const latest = ranked.filter(({ time }) => time === Math.max(...ranked.map(({ time }) => time)));
      return latest.length === 1 ? latest[0].entry : null;
    };
    const authenticate = (entry, current = true) => {
      if (!entry?.fact?.ref) throw new Error("completion fact is missing");
      const raw = read(entry.fact.ref), fact = JSON.parse(raw);
      if (JSON.stringify(fact) !== JSON.stringify(entry.fact.value ?? entry.fact) || fact.task_id !== taskId
          || fact.stage !== "build-code" || (current && (fact.material_revision !== currentMaterialRevision || fact.snapshot_tree !== snapshotTree))
          || !authenticateQualityFactRecord({ ...fact, ref: entry.fact.ref, sha256: sha256(raw) }, { read }).authenticated) throw new Error("completion fact is unauthenticated");
      return fact;
    };
    try {
      const disposition = authenticate(select("finding_dispositions"));
      const phaseReview = authenticate(select("phase_review"), false);
      if (disposition.status !== "missing" || phaseReview.kind !== "review" || phaseReview.status !== "unavailable"
          || phaseReview.evidence.length !== 1 || typeof verifyUnavailableReview !== "function") throw new Error("unavailable review exception does not apply");
      const evidence = phaseReview.evidence[0], raw = read(evidence.ref), attempt = JSON.parse(raw);
      validateSchema("attempt", attempt);
      if (sha256(raw) !== evidence.sha256 || attempt.task_id !== taskId || attempt.stage !== "build-code"
          || attempt.subject_kind !== "phase" || attempt.review_scope !== "phase" || !/^P[1-9]\d*$/.test(attempt.phase_id ?? "")) throw new Error("unavailable Phase review identity mismatch");
      verifyUnavailableReview({ identity: { taskId }, stage: "build-code", readReceipt: (ref) => {
        const bytes = read(ref); return { value: JSON.parse(bytes), sha256: sha256(bytes) };
      } }, { ref: evidence.ref, value: attempt, evidence }, attempt.review_track, "build-code");
      unavailablePhaseReview = true;
    } catch { /* Keep missing/false/semantic review facts as completion gaps. */ }
    try {
      const fact = authenticate(select("acceptance_execution"));
      if (fact.kind !== "acceptance_criterion" || fact.status !== "passed" || fact.evidence.length !== 1) throw new Error("execution did not complete");
      const wrapper = readBoundJson(fact.evidence[0], read, {}, "completion-wrapper");
      const refs = wrapper?.refs?.filter((ref) => /^quality\/evidence\/stage-quality\/build-code\/acceptance_execution-[a-f0-9]{64}\.json$/.test(ref.ref));
      if (refs?.length !== 1) throw new Error("execution aggregate is missing");
      const aggregate = readBoundJson(refs[0], read, {}, "completion-aggregate");
      authenticateAcceptanceExecutionAggregate(aggregate, fact, read);
      const covered = new Set(), placeholder = (value) => value === "not-read" || (value && typeof value === "object"
        && (value.status === "not-read" || Object.values(value).some(placeholder)));
      for (const item of aggregate.subject_fact.execution_items) {
        if (item.status !== "executed" || !Array.isArray(item.acceptance_criterion_ids) || item.acceptance_criterion_ids.length === 0
            || item.acceptance_criterion_ids.some((id) => !activeCriterionIds.includes(id))) throw new Error("execution AC set is invalid");
        if (item.tier === "browser") { item.acceptance_criterion_ids.forEach((id) => covered.add(id)); continue; }
        for (const ref of item.evidence_refs) {
          const leaf = readBoundJson(ref, read, {}, "completion-leaf"), subject = leaf.subject_fact, execution = subject.execution;
          if (!activeCriterionIds.includes(leaf.subject) || execution.exit_code !== 0 || execution.signal !== null
              || execution.timed_out || execution.cancelled || execution.cleanup?.status !== "completed" || execution.error
              || subject.assertions.length === 0 || subject.assertions.some((assertion) => assertion.result !== "passed"
                || placeholder(assertion.expected) || placeholder(assertion.actual))
              || !(subject.status === "passed" || (subject.status === "deferred" && isFutureStageAcceptanceDeferred({
                spec, activeCriterionIds, criterionId: leaf.subject, outcome: subject.outcome, owner: subject.outcome_owner })))) throw new Error("current acceptance judgment is not complete");
          covered.add(leaf.subject);
        }
      }
      if (covered.size !== activeCriterionIds.length || activeCriterionIds.some((id) => !covered.has(id))) throw new Error("execution does not cover the spec denominator");
      acceptanceExecutionComplete = true;
    } catch { /* Actual failure, cancellation, or missing AC stays incomplete. */ }
  } catch { /* No authenticated context means no exception. */ }
  return Object.freeze({ unavailable_phase_review: unavailablePhaseReview, acceptance_execution_complete: acceptanceExecutionComplete });
}

const P10_CONSUMPTION_REF = /^quality\/evidence\/stage-quality\/build-code\/p10-consumption-([a-f0-9]{64})\.json$/;
const P10_QUALITY_FACT_REF = /^quality\/facts\/[a-f0-9]{64}\.json$/;

/** Authenticate one explicit P10 run-consumption source through TaskHandle.
 * The source names records; their bytes, the final stage row, and every
 * selected AC fact must still match this caller's already authenticated
 * fixed test receipt. This does not independently prove who wrote the source.
 */
export function authenticateP10RunConsumption({ task: taskHandle, locator, taskId,
  snapshotTree, materialRevision, sourceDigest, capture, receipt, acceptedAcIds } = {}) {
  try {
    const task = assertTaskHandle(taskHandle);
    if (task.identity.taskId !== taskId || !(acceptedAcIds instanceof Set)
        || acceptedAcIds.size === 0 || [...acceptedAcIds].some((ac) => typeof ac !== "string" || !ac)) return null;
    const match = typeof locator?.ref === "string" ? P10_CONSUMPTION_REF.exec(locator.ref) : null;
    if (!match || locator.sha256 !== match[1]) return null;
    // Read the current row both before and after all referenced records. An
    // interleaved run that replaces it cannot make this read look current.
    const stageRowsBefore = task.readRecord("facts.jsonl");
    const raw = task.readRecord(locator.ref);
    if (sha256(raw) !== locator.sha256) return null;
    const source = JSON.parse(raw);
    if (source.schema_version !== "workflowhub-p10-run-consumption.v1"
        || source.task_id !== taskId || source.stage !== "build-code"
        || source.snapshot_tree !== snapshotTree || source.material_revision !== materialRevision
        || source.source_digest !== sourceDigest
        || source.test_receipt?.ref !== capture.receipt_ref
        || source.test_receipt?.sha256 !== capture.receipt_hash
        || source.test_output?.ref !== receipt.output_ref
        || source.test_output?.sha256 !== receipt.output_hash) return null;
    const output = task.readRecord(source.test_output.ref);
    if (sha256(output) !== source.test_output.sha256) return null;

    const rowIndex = /^facts\.jsonl#([1-9][0-9]*)$/.exec(source.stage_row?.ref ?? "");
    if (!rowIndex || !SHA256_HEX.test(source.stage_row?.sha256 ?? "")) return null;
    const lines = stageRowsBefore.split("\n");
    if (lines.at(-1) !== "") return null;
    lines.pop();
    const index = Number(rowIndex[1]) - 1;
    if (!Number.isSafeInteger(index) || index < 0 || index >= lines.length
        || sha256(`${lines[index]}\n`) !== source.stage_row.sha256) return null;
    const rows = lines.map((line) => JSON.parse(line));
    const currentRows = rows.filter((row) => row.record_kind === "stage" && row.stage === "build-code");
    const row = rows[index];
    if (currentRows.length !== 1 || currentRows[0] !== row
        || row.task_id !== taskId || row.source !== "stage-end:build-code"
        || row.snapshot_tree?.value !== snapshotTree
        || row.phase_progress?.phase_id !== "P10" || row.phase_progress?.task_id !== "T021"
        || row.phase_progress?.material_revision !== materialRevision) return null;

    if (!Array.isArray(source.quality_facts) || source.quality_facts.length === 0) return null;
    const seen = new Set(), byAc = new Map();
    let testFactCount = 0;
    for (const binding of source.quality_facts) {
      if (!P10_QUALITY_FACT_REF.test(binding?.ref ?? "")
          || !SHA256_HEX.test(binding.sha256 ?? "") || seen.has(binding.ref)) return null;
      seen.add(binding.ref);
      const factRaw = task.readRecord(binding.ref);
      if (sha256(factRaw) !== binding.sha256) return null;
      const authenticated = authenticateQualityFactRecord(binding,
        { read: (ref) => task.readRecord(ref) });
      if (!authenticated.authenticated) return null;
      const fact = JSON.parse(factRaw);
      if (fact.task_id !== taskId || fact.stage !== "build-code"
          || fact.snapshot_tree !== snapshotTree || fact.material_revision !== materialRevision) return null;
      if (fact.kind === "test" && fact.subject === "risk_tests_fresh") {
        if (fact.status !== "passed" || !fact.evidence.some((evidence) =>
          evidence.ref === capture.receipt_ref && evidence.sha256 === capture.receipt_hash)) return null;
        testFactCount += 1;
      }
      if (fact.kind === "acceptance_criterion" && acceptedAcIds.has(fact.subject)) {
        if (byAc.has(fact.subject)) return null;
        byAc.set(fact.subject, binding);
      }
    }
    if (testFactCount !== 1 || [...acceptedAcIds].some((ac) => !byAc.has(ac))
        || task.readRecord("facts.jsonl") !== stageRowsBefore) return null;
    return Object.freeze({ byAc });
  } catch { return null; }
}

const P5_REPORT_ROOT = "quality/evidence/stage-quality/build-code/P5";
const p5Unavailable = (reason) => Object.freeze({ status: "unavailable", authenticated: false, reason });
const p5Missing = (reason) => Object.freeze({ status: "missing", authenticated: false, reason });
const p5Require = (condition, reason) => {
  if (!condition) throw new Error(reason);
};

/** P5-only reconstruction: persist original bindings, never enriched objects. */
function p5AcceptanceCandidates({ read, taskId, snapshotTree, materialRevision, stageResult,
  qualityBindings, advisoryBindings }) {
  p5Require(Array.isArray(qualityBindings)
    && JSON.stringify(qualityBindings.map((binding) => binding.ref)) === JSON.stringify(stageResult.quality_fact_refs),
  "P5 acceptance quality binding list is not the same-run result");
  const originals = new Map();
  for (const binding of [...qualityBindings, ...advisoryBindings]) {
    p5Require(typeof binding?.ref === "string" && SHA256_HEX.test(binding.sha256 ?? "")
      && (!originals.has(binding.ref) || originals.get(binding.ref).sha256 === binding.sha256),
    "P5 acceptance quality binding is invalid or conflicting");
    originals.set(binding.ref, binding);
  }
  const candidates = new Map();
  for (const binding of originals.values()) {
    const raw = read(binding.ref);
    const fact = validateCanonicalQualityFact(JSON.parse(raw));
    p5Require(sha256(raw) === binding.sha256
      && binding.ref === `quality/facts/${qualityFactDigest(fact)}.json`
      && fact.fact_id === `quality-${qualityFactDigest(fact)}`
      && fact.task_id === taskId && fact.stage === "build-code"
      && fact.snapshot_tree === snapshotTree && fact.material_revision === materialRevision,
    "P5 acceptance quality fact hash or identity is invalid");
    if (fact.kind !== "acceptance_criterion") {
      p5Require(!fact.evidence.some((entry) => entry.evidence_type === "acceptance_evidence"),
        "P5 acceptance evidence has the wrong quality fact kind");
      continue;
    }
    p5Require(fact.evidence.length === 1 && fact.evidence[0].evidence_type === "acceptance_evidence",
      "P5 acceptance quality fact evidence list is incomplete");
    const wrapperBinding = fact.evidence[0];
    p5Require(SHA256_HEX.test(wrapperBinding.sha256 ?? "")
      && wrapperBinding.ref === `quality/evidence/acceptance/build-code/${fact.subject}-${wrapperBinding.sha256}.json`,
    "P5 acceptance wrapper ref/hash identity is invalid");
    const wrapperRaw = read(wrapperBinding.ref);
    p5Require(sha256(wrapperRaw) === wrapperBinding.sha256, "P5 acceptance wrapper hash mismatch");
    const wrapper = validateAcceptanceEvidence(JSON.parse(wrapperRaw));
    p5Require(wrapper.acceptance_criterion_id === fact.subject && wrapper.snapshot_tree === snapshotTree
      && wrapper.refs.length === 1 && wrapper.freshness?.status === "current"
      && wrapper.freshness.evaluated_at === fact.recorded_at
      && wrapper.freshness.snapshot_tree === snapshotTree
      && wrapper.freshness.material_revision === materialRevision
      && wrapper.freshness.evidence_freshness?.length === 1,
    "P5 acceptance wrapper identity or same-run freshness is invalid");
    const stageBinding = wrapper.refs[0];
    const freshnessBinding = wrapper.freshness.evidence_freshness[0];
    p5Require(stageBinding.ref === `quality/evidence/stage-quality/build-code/${fact.subject}-${stageBinding.sha256}.json`
      && freshnessBinding.ref === stageBinding.ref && freshnessBinding.sha256 === stageBinding.sha256
      && freshnessBinding.status === "current", "P5 acceptance stage-quality ref identity is invalid");
    const stageRaw = read(stageBinding.ref);
    p5Require(sha256(stageRaw) === stageBinding.sha256, "P5 acceptance stage-quality hash mismatch");
    const stage = JSON.parse(stageRaw);
    p5Require(stage.schema_version === "stage-quality-evidence.v1" && stage.task_id === taskId
      && stage.stage === "build-code" && stage.subject === fact.subject
      && stage.snapshot_tree === snapshotTree && stage.material_revision === materialRevision,
    "P5 acceptance stage-quality identity is invalid");
    p5Require(typeof stage.status === "string" && stage.status.trim()
      && stage.status === stage.subject_fact?.status,
    "P5 acceptance raw status conflicts with subject_fact.status");
    // Canonical facts historically normalize unsupported subject states to
    // missing. The raw state remains authoritative for report disclosure.
    const normalized = stage.status === "not_applicable" ? "passed"
      : new Set(["passed", "failed", "missing"]).has(stage.status) ? stage.status : "missing";
    p5Require(fact.status === normalized, "P5 acceptance canonical/raw status is inconsistent");
    candidates.set(wrapperBinding.ref, { path: wrapperBinding.ref, kind: "acceptance_evidence_candidate",
      acceptance: JSON.parse(wrapperRaw), stage_quality: { path: stageBinding.ref, record: stage } });
  }
  return [...candidates.values()];
}

/** Private P5 provenance check. The stage writer supplies its same-run result;
 * the report reader supplies the immutable source/certificate bindings. */
export function authenticateP5AdvisorySources({ read, taskId, snapshotTree, materialRevision, stageResult, bindings = null,
  qualityBindings = null, acceptanceCandidates = null }) {
  p5Require(typeof read === "function" && typeof taskId === "string" && taskId.trim()
    && typeof snapshotTree === "string" && snapshotTree.trim()
    && typeof materialRevision === "string" && materialRevision.trim(),
  "P5 advisory source context is incomplete");
  const refs = stageResult?.quality_advisory_fact_refs;
  const advisories = stageResult?.quality_advisories ?? [];
  p5Require(stageResult?.stage === "build-code" && Array.isArray(refs) && refs.length > 0
    && Array.isArray(advisories) && advisories.every((value) => typeof value === "string")
    && new Set(refs).size === refs.length,
  "P5 advisory fact list is absent, duplicated, or invalid");
  p5Require(bindings === null || (Array.isArray(bindings) && bindings.length === refs.length
    && refs.every((ref, index) => bindings[index]?.ref === ref
      && SHA256_HEX.test(bindings[index]?.sha256 ?? ""))),
  "P5 advisory source binding list does not match the same-run result");
  const digest = (raw) => sha256(raw);
  const selected = [];
  const verified = refs.map((ref, index) => {
    p5Require(/^quality\/facts\/[a-f0-9]{64}\.json$/.test(ref), `P5 advisory fact ref is invalid: ${ref}`);
    const raw = read(ref);
    const fact = validateCanonicalQualityFact(JSON.parse(raw));
    const factHash = digest(raw);
    p5Require((bindings === null || bindings[index].sha256 === factHash)
      && ref === `quality/facts/${qualityFactDigest(fact)}.json`
      && fact.fact_id === `quality-${qualityFactDigest(fact)}`
      && fact.task_id === taskId && fact.stage === "build-code"
      && fact.material_revision === materialRevision && fact.snapshot_tree === snapshotTree,
    `P5 advisory fact hash or current identity is invalid: ${ref}`);
    if (fact.subject === "stage_end_spec_analyze") selected.push(fact);
    return { ref, sha256: factHash };
  });
  p5Require(selected.length === 1, "P5 advisory source must contain exactly one stage-end spec-analyze fact");
  const fact = selected[0];
  p5Require(fact.kind === "acceptance_criterion" && fact.evidence?.length === 1
    && fact.evidence[0].evidence_type === "acceptance_evidence",
  "P5 stage-end advisory fact kind or evidence list is invalid");
  const wrapperBinding = fact.evidence[0];
  p5Require(SHA256_HEX.test(wrapperBinding.sha256 ?? "")
    && wrapperBinding.ref === `quality/evidence/acceptance/build-code/stage_end_spec_analyze-${wrapperBinding.sha256}.json`,
  "P5 stage-end acceptance wrapper ref is invalid");
  const wrapperRaw = read(wrapperBinding.ref);
  p5Require(digest(wrapperRaw) === wrapperBinding.sha256, "P5 stage-end acceptance wrapper hash is invalid");
  const wrapper = JSON.parse(wrapperRaw);
  p5Require(wrapper.schema_version === "acceptance-evidence.v1"
    && wrapper.acceptance_criterion_id === "stage_end_spec_analyze"
    && wrapper.snapshot_tree === snapshotTree && wrapper.refs?.length === 1
    && wrapper.freshness?.status === "current"
    && wrapper.freshness.snapshot_tree === snapshotTree
    && wrapper.freshness.material_revision === materialRevision
    && wrapper.freshness.evidence_freshness?.length === 1,
  "P5 stage-end acceptance wrapper identity or freshness is invalid");
  const stageBinding = wrapper.refs[0];
  const freshnessBinding = wrapper.freshness.evidence_freshness[0];
  p5Require(SHA256_HEX.test(stageBinding.sha256 ?? "")
    && stageBinding.ref === `quality/evidence/stage-quality/build-code/stage_end_spec_analyze-${stageBinding.sha256}.json`
    && freshnessBinding.ref === stageBinding.ref
    && freshnessBinding.sha256 === stageBinding.sha256
    && freshnessBinding.status === "current",
  "P5 stage-end stage-quality ref or freshness binding is invalid");
  const stageRaw = read(stageBinding.ref);
  p5Require(digest(stageRaw) === stageBinding.sha256, "P5 stage-end stage-quality original hash is invalid");
  const stage = JSON.parse(stageRaw);
  const verdict = stage.subject_fact?.analysis_result?.status;
  const expected = {
    consistent: { status: "passed", result: "pass" },
    material_incomplete: { status: "missing", result: "incomplete" },
    inconsistent: { status: "missing", result: "inconsistent" },
    unavailable: { status: "missing", result: "unavailable" },
  }[verdict];
  p5Require(expected && stage.schema_version === "stage-quality-evidence.v1"
    && stage.task_id === taskId && stage.stage === "build-code"
    && stage.subject === "stage_end_spec_analyze"
    && stage.snapshot_tree === snapshotTree && stage.material_revision === materialRevision
    && stage.status === expected.status && stage.subject_fact.status === expected.status
    && fact.status === expected.status && wrapper.result === expected.result
    && wrapper.summary?.actual_outcome === verdict
    && (stage.subject_fact.evidence_state === undefined || stage.subject_fact.evidence_state === verdict),
  "P5 stage-end advisory verdict or status does not match its originals");
  const sameSubject = advisories.filter((value) => typeof value === "string" && value.startsWith("stage-end-spec-analyze:"));
  p5Require(sameSubject.length === (verdict === "consistent" ? 0 : 1)
    && (verdict === "consistent" || sameSubject[0] === `stage-end-spec-analyze:${verdict}`),
  "P5 same-run advisory verdict is absent, duplicated, or conflicts with its original");
  if (acceptanceCandidates !== null) {
    p5Require(Array.isArray(acceptanceCandidates), "P5 acceptance in-memory candidate index is invalid");
    acceptanceCandidates.push(...p5AcceptanceCandidates({ read, taskId, snapshotTree, materialRevision,
      stageResult, qualityBindings, advisoryBindings: verified }));
  }
  return verified;
}

/** Discover one actual current audit only in the existing private namespace. */
function p5CurrentAuditRef(context) {
  const task = assertTaskHandle(context.task);
  let path = task.taskPath;
  for (const segment of ["quality", "evidence", "audits", "build-code"]) {
    path = join(path, segment);
    let stat;
    try { stat = lstatSync(path); }
    catch (error) { if (error.code === "ENOENT") throw new Error("P5 actual scoped audit is missing"); throw error; }
    p5Require(stat.isDirectory() && !stat.isSymbolicLink(), "P5 audit directory is not a real directory");
  }
  const before = lstatSync(path);
  const scope = { task_id: task.identity.taskId, phase_id: "P5", material_revision: context.materialRevision,
    snapshot_tree: context.snapshot.tree, report_scope: "p5_intermediate" };
  const matches = [];
  for (const name of readdirSync(path).sort()) {
    const stat = lstatSync(join(path, name));
    p5Require(/^[a-f0-9]{64}\.json$/.test(name) && stat.isFile() && !stat.isSymbolicLink(),
      `P5 audit original ref is invalid: ${name}`);
    const ref = `quality/evidence/audits/build-code/${name}`;
    const raw = task.readRecord(ref);
    p5Require(name === `${sha256(raw)}.json`, `P5 audit original hash mismatch: ${ref}`);
    const audit = JSON.parse(raw);
    const candidate = audit.exception_census?.scope;
    if (audit.task_id === task.identity.taskId && audit.stage_slug === "build-code"
        && candidate && Object.keys(candidate).length === 5
        && Object.keys(scope).every((key) => candidate[key] === scope[key])) matches.push(ref);
  }
  const after = lstatSync(path);
  p5Require(before.ino === after.ino && before.mtimeMs === after.mtimeMs && before.ctimeMs === after.ctimeMs,
    "P5 audit directory changed during enumeration");
  p5Require(matches.length === 1, `P5 scoped audit must be unique; found ${matches.length}`);
  return matches[0];
}

/** Fixed private census, not a new Task API or a caller-selected directory. */
function p5RiskRefs(task) {
  let path = task.taskPath;
  for (const segment of ["quality", "evidence", "risk-acceptances"]) {
    path = join(path, segment);
    let stat;
    try { stat = lstatSync(path); }
    catch (error) { if (error.code === "ENOENT") return []; throw error; }
    p5Require(stat.isDirectory() && !stat.isSymbolicLink(), "P5 risk census directory is not a real directory");
  }
  const before = lstatSync(path);
  const names = readdirSync(path).sort();
  const refs = names.map((name) => {
    const stat = lstatSync(join(path, name));
    p5Require(/^[a-f0-9]{64}\.json$/.test(name) && stat.isFile() && !stat.isSymbolicLink(),
      `P5 risk census has an unclassified original: ${name}`);
    return `quality/evidence/risk-acceptances/${name}`;
  });
  const after = lstatSync(path);
  p5Require(before.ino === after.ino && before.mtimeMs === after.mtimeMs
    && before.ctimeMs === after.ctimeMs, "P5 risk census changed during enumeration");
  return refs;
}

function p5Permission(task, decisionRaw, refs, declaration = null) {
  const raw = {};
  for (const name of ["question", "answer"]) {
    const binding = refs?.[name];
    p5Require(/^quality\/evidence\/[A-Za-z0-9_./-]+\.jsonl$/.test(binding?.ref ?? "")
      && !binding.ref.includes("..") && SHA256_HEX.test(binding.sha256 ?? "")
      && decisionRaw.includes(binding.sha256)
      && (decisionRaw.includes(binding.ref) || (decisionRaw.includes(basename(binding.ref))
        && Object.values(refs).some((entry) => dirname(entry.ref) === dirname(binding.ref)
          && decisionRaw.includes(entry.ref)))), "P5 permission is not cited by the current owning material");
    raw[name] = task.readRecord(binding.ref);
    p5Require(sha256(raw[name]) === binding.sha256, `P5 permission ${name} hash mismatch`);
    p5Require(raw[name].trim().split("\n").length === 1, "P5 permission original must be one complete transcript event");
  }
  const question = JSON.parse(raw.question);
  const answer = JSON.parse(raw.answer);
  const call = question.payload;
  p5Require(question.type === "response_item" && call?.type === "function_call"
    && call.name === "request_user_input_async" && typeof call.call_id === "string"
    && answer.type === "response_item" && answer.payload?.type === "message"
    && answer.payload.role === "user", "P5 permission originals are not a question and user reply");
  const questions = JSON.parse(call.arguments).questions;
  const texts = answer.payload.content?.filter((item) => item.type === "input_text").map((item) => item.text) ?? [];
  p5Require(texts.length === 1, "P5 permission user reply is ambiguous");
  const match = /^<send_user_message_question_reply>\s*([\s\S]+?)\s*<\/send_user_message_question_reply>$/.exec(texts[0]);
  p5Require(match, "P5 permission reply has no original structured answer");
  const replies = JSON.parse(match[1]);
  p5Require(Array.isArray(replies) && replies.length === 1, "P5 permission answer is ambiguous");
  const reply = replies[0];
  const item = JSON.parse(reply.questionItemId);
  const title = questions?.[item?.[2]]?.title;
  p5Require(Array.isArray(item) && item.length === 3 && item[0] === call.name && item[1] === call.call_id
    && Number.isInteger(item[2]) && item[2] >= 0 && title === reply.question
    && typeof title === "string", "P5 permission reply does not match its original question/call");
  if (declaration) {
    p5Require(title.startsWith("是否批准以下人工例外声明？\n") && reply.answer === "批准这项人工例外",
      "P5 reply is not approval of the specific human exception");
    const proposed = JSON.parse(title.slice(title.indexOf("\n") + 1));
    const expected = { subject: { task_id: task.identity.taskId, phase_id: "P5", declaration_type: "human_exception" },
      declared_by: declaration.declared_by, reason: declaration.reason, impact_scope: declaration.scope,
      expiry_stage: declaration.expires_at_phase, owner: declaration.owner, verbatim: declaration.verbatim };
    p5Require(Object.keys(proposed).length === Object.keys(expected).length
      && Object.keys(expected).every((key) => key === "subject"
        ? proposed.subject && Object.keys(proposed.subject).length === 3
          && Object.keys(expected.subject).every((field) => proposed.subject[field] === expected.subject[field])
        : proposed[key] === expected[key]), "P5 approval question does not bind the exact declaration fields");
  } else p5Require(/核查后.*没有例外/.test(title) && reply.answer === "可以，写明没有例外",
    "P5 user reply does not permit the conditional zero-exception wording");
  return Object.fromEntries(["question", "answer"].map((name) => [name,
    { ref: refs[name].ref, sha256: refs[name].sha256 }]));
}

function p5NoExceptions(decisionRaw, context) {
  const { task: handle, artifacts, snapshot, materialRevision, auditInputRef, existing, captureAudit,
    publicationFacts, requiredRefs = [] } = context;
  const task = assertTaskHandle(handle);
  p5Require(publicationFacts && SHA256_HEX.test(publicationFacts.sha256 ?? "")
    && publicationFacts.ref === `${P5_REPORT_ROOT}/facts-${publicationFacts.sha256}.jsonl`,
  "P5 none publication facts binding is missing");
  const read = (ref) => ref === publicationFacts.ref && typeof publicationFacts.raw === "string"
    ? publicationFacts.raw : task.readRecord(ref);
  p5Require(sha256(read(publicationFacts.ref)) === publicationFacts.sha256, "P5 none publication facts hash mismatch");
  let savedAudit = null;
  if (existing) {
    p5Require(existing.kind === "none" && SHA256_HEX.test(existing.audit_sha256 ?? "")
      && existing.audit_ref === `${P5_REPORT_ROOT}/audit-${existing.audit_sha256}.json`, "P5 none audit ref is invalid");
    const raw = read(existing.audit_ref);
    p5Require(sha256(raw) === existing.audit_sha256, "P5 none audit hash mismatch");
    savedAudit = JSON.parse(raw);
  }
  const inputRef = auditInputRef ?? savedAudit?.classification_source?.ref;
  p5Require(/^quality\/evidence\/audits\/build-code\/[a-f0-9]{64}\.json$/.test(inputRef ?? ""),
    "P5 finite scope has no actual material classification audit");
  const inputRaw = read(inputRef);
  const inputHash = sha256(inputRaw);
  p5Require(inputRef.endsWith(`/${inputHash}.json`), "P5 material classification audit hash mismatch");
  const input = JSON.parse(inputRaw);
  const census = input.exception_census;
  const scope = { task_id: task.identity.taskId, phase_id: "P5", material_revision: materialRevision,
    snapshot_tree: snapshot.tree, report_scope: "p5_intermediate" };
  p5Require(input.schema_version === "v1" && input.task_id === scope.task_id
    && input.stage_slug === "build-code" && input.verdict === "pass"
    && SHA256_HEX.test(input.summary_hash ?? "") && Array.isArray(input.content_evidence_refs)
    && census && census.scope && Object.keys(census.scope).length === 5
    && Object.keys(scope).every((key) => census.scope[key] === scope[key]), "P5 classification scope is absent, stale or not intermediate");
  const permission = p5Permission(task, decisionRaw, census.permission_refs);
  const base = Object.fromEntries(["decision-log.md", "spec.md", "phases/index.md"].map((name) => [name, artifacts.read(name)]));
  const materialFiles = materialFilesForCohort("post", base);
  const sources = new Map();
  const materialRaw = new Map(materialFiles.map((name) => [artifacts.reference(name), artifacts.read(name)]));
  const addBasis = (binding) => {
    p5Require(typeof binding?.ref === "string" && !binding.ref.includes("..")
      && SHA256_HEX.test(binding.sha256 ?? ""), "P5 material resolution basis is invalid");
    const ref = binding.ref.split("#")[0];
    const raw = materialRaw.has(ref) ? materialRaw.get(ref) : read(ref);
    p5Require(sha256(raw) === binding.sha256, `P5 material resolution basis hash mismatch: ${ref}`);
    if (!materialRaw.has(ref)) sources.set(ref, { ref, sha256: binding.sha256, kind: "classification_basis" });
  };
  const classifications = census.classifications;
  p5Require(Array.isArray(classifications), "P5 material classifications are absent");
  for (const name of materialFiles) {
    const ref = artifacts.reference(name);
    const raw = artifacts.read(name);
    const digest = sha256(raw);
    const found = classifications.filter((entry) => entry?.ref === ref);
    p5Require(found.length === 1 && found[0].sha256 === digest && new Set(["no_exception", "resolved"]).has(found[0].result)
      && typeof found[0].reason === "string" && found[0].reason.trim(),
      `P5 material exception classification is incomplete or unknown: ${ref}`);
    p5Require(found[0].result !== "resolved" || (Array.isArray(found[0].resolution_refs)
      && found[0].resolution_refs.length > 0), `P5 historical exception has no actual resolution basis: ${ref}`);
    p5Require(found[0].resolution_refs === undefined || Array.isArray(found[0].resolution_refs),
      `P5 material resolution references are invalid: ${ref}`);
    for (const binding of found[0].resolution_refs ?? []) addBasis(binding);
    sources.set(ref, { ref, sha256: digest, kind: "material" });
  }
  p5Require(classifications.length === materialFiles.length, "P5 material classification has extra or duplicated scope");
  let refs;
  if (existing) {
    p5Require(Array.isArray(savedAudit.sources) && savedAudit.sources.length > 0
      && new Set(savedAudit.sources.map((entry) => entry.ref)).size === savedAudit.sources.length,
    "P5 none publication source set is absent or duplicated");
    refs = savedAudit.sources.filter((entry) => entry.kind === "task_original").map((entry) => entry.ref).sort();
    p5Require([publicationFacts.ref, ...requiredRefs].every((ref) => refs.includes(ref)),
      "P5 none publication source set lacks a required original");
  } else {
    refs = [...new Set([publicationFacts.ref, ...task.listCanonicalQualityFactRefs(),
      ...task.listCanonicalReviewResultRefs(), ...task.listCanonicalReviewAttemptRefs(),
      ...task.listCanonicalAuthorizationRefs(), ...p5RiskRefs(task)])].sort();
  }
  const inspectRisk = (value, ref) => {
    if (Array.isArray(value)) { value.forEach((entry) => inspectRisk(entry, ref)); return; }
    if (!value || typeof value !== "object") return;
    p5Require(value.status !== "accepted_risk" && value.disposition !== "accepted_risk"
      && value.selected_option !== "accept-risk", `P5 still applicable or unclassified accepted risk: ${ref}`);
    Object.values(value).forEach((entry) => inspectRisk(entry, ref));
  };
  for (const ref of refs) {
    const raw = read(ref);
    const digest = sha256(raw);
    if (existing) p5Require(savedAudit.sources.some((entry) => entry.ref === ref && entry.sha256 === digest),
      `P5 none publication original hash mismatch: ${ref}`);
    const records = ref === publicationFacts.ref ? raw.split("\n").filter(Boolean).map((line) => JSON.parse(line)) : [JSON.parse(raw)];
    for (const record of records) {
      p5Require(record.task_id === task.identity.taskId, `P5 census original has the wrong Task: ${ref}`);
      if (ref.startsWith("quality/facts/")) {
        validateCanonicalQualityFact(record);
        p5Require(ref === `quality/facts/${qualityFactDigest(record)}.json`, "P5 census quality fact ref is invalid");
      }
      if (ref.startsWith("quality/reviews/results/")) authenticateStageReviewResult(record, { taskId: task.identity.taskId, read });
      if (ref.startsWith("quality/reviews/attempts/")) validateSchema("attempt", record);
      if (ref.startsWith("quality/evidence/risk-acceptances/")) {
        p5Require(ref.endsWith(`/${digest}.json`), "P5 risk original hash mismatch");
        const reviewRaw = read(record.review_ref);
        const review = JSON.parse(reviewRaw);
        authenticateStageReviewResult(review, { taskId: task.identity.taskId, read });
        const pause = deriveSeriousReviewPause({ taskId: task.identity.taskId, stage: record.stage,
          reviewRef: record.review_ref, reviewHash: sha256(reviewRaw), result: review, workflowRunId: record.workflow_run_id });
        const cardRaw = read(record.card_ref);
        p5Require(sha256(cardRaw) === record.card_hash && sha256(read(record.reply_ref)) === record.reply_hash,
          "P5 risk card or reply hash mismatch");
        const finding = pause.findings.find((entry) => entry.finding_id === record.finding_id);
        p5Require(finding, "P5 risk finding is absent from its original review");
        validateRiskAcceptance({ acceptance: record, pause: { ...pause,
          findings: pause.findings.map((entry) => entry === finding ? { ...entry, card_hash: record.card_hash } : entry) } });
      }
      inspectRisk(record, ref);
    }
    sources.set(ref, { ref, sha256: digest, kind: "task_original" });
  }
  const audit = { scope, permission_refs: permission,
    classification_source: { ref: inputRef, sha256: inputHash }, sources: [...sources.values()].sort((a, b) => a.ref.localeCompare(b.ref)), result: "none" };
  const auditRaw = `${JSON.stringify(audit, null, 2)}\n`;
  const auditHash = sha256(auditRaw);
  const auditRef = `${P5_REPORT_ROOT}/audit-${auditHash}.json`;
  const candidate = { kind: "none", permission_refs: permission, audit_ref: auditRef, audit_sha256: auditHash, scope };
  if (existing) {
    p5Require(read(existing.audit_ref) === auditRaw && JSON.stringify(existing) === JSON.stringify(candidate),
      "P5 none audit source set or classification does not match publication originals");
  } else if (typeof captureAudit === "function") captureAudit({ ref: auditRef, raw: auditRaw });
  else task.writeRecordAtomic(auditRef, auditRaw, { createOnly: true });
  return candidate;
}

function p5DeclaredException(decisionRaw, indexRaw, acceptanceChain, sourceRef, context) {
  const task = assertTaskHandle(context.task);
  const declaration = parseP5HumanExceptionDeclaration(decisionRaw, indexRaw, acceptanceChain, sourceRef);
  p5Require(!declaration.fixture_only, "P5 fixture_only declaration is not a human approval source");
  const ref = context.auditInputRef ?? context.existing?.audit_ref;
  p5Require(/^quality\/evidence\/audits\/build-code\/[a-f0-9]{64}\.json$/.test(ref ?? ""),
    "P5 human exception has no specific approval audit");
  const raw = task.readRecord(ref);
  const digest = sha256(raw);
  p5Require(ref.endsWith(`/${digest}.json`), "P5 human exception audit hash mismatch");
  const audit = JSON.parse(raw);
  const scope = { task_id: task.identity.taskId, phase_id: "P5", material_revision: context.materialRevision,
    snapshot_tree: context.snapshot.tree, report_scope: "p5_intermediate" };
  const census = audit.exception_census;
  p5Require(audit.schema_version === "v1" && audit.task_id === scope.task_id && audit.stage_slug === "build-code"
    && audit.verdict === "pass" && SHA256_HEX.test(audit.summary_hash ?? "") && Array.isArray(audit.content_evidence_refs)
    && census?.kind === "declared" && census.scope && Object.keys(census.scope).length === 5
    && Object.keys(scope).every((key) => census.scope[key] === scope[key]), "P5 human exception approval scope is absent or stale");
  const approval = p5Permission(task, decisionRaw, census.permission_refs, declaration);
  const candidate = { ...declaration, kind: "declared", approval_refs: approval,
    audit_ref: ref, audit_sha256: digest, approval_scope: scope };
  if (context.existing) p5Require(JSON.stringify(candidate) === JSON.stringify(context.existing),
    "P5 specific human exception original sources do not reproduce the claimed declaration");
  return candidate;
}

/** A parsed declaration alone has no user approval; context performs the private finite census. */
export function parseP5HumanExceptionDeclaration(decisionRaw, indexRaw, acceptanceChain, sourceRef, context = null) {
  if (context) {
    if (!context.auditInputRef && !context.existing) context = { ...context, auditInputRef: p5CurrentAuditRef(context) };
    const ref = context.auditInputRef ?? context.existing?.audit_ref;
    if (context.existing?.kind === "declared" || (ref && /^quality\/evidence\/audits\/build-code\/[a-f0-9]{64}\.json$/.test(ref)
        && JSON.parse(context.task.readRecord(ref)).exception_census?.kind === "declared")) {
      return p5DeclaredException(decisionRaw, indexRaw, acceptanceChain, sourceRef, context);
    }
    return p5NoExceptions(decisionRaw, context);
  }
  p5Require(typeof decisionRaw === "string" && typeof sourceRef === "string" && sourceRef.trim(),
    "P5 human exception material source is absent");
  const headings = [...decisionRaw.matchAll(/^ {0,3}## 人工例外声明[^\n]*$/gm)];
  p5Require(headings.length === 1, "P5 human exception source must contain one declaration heading");
  const afterHeading = decisionRaw.slice(headings[0].index + headings[0][0].length);
  const nextSection = /^ {0,3}#{1,2}[ \t]+\S/gm.exec(afterHeading);
  const section = nextSection ? afterHeading.slice(0, nextSection.index) : afterHeading;
  const fences = [...section.matchAll(/^[ \t]*```[^\r\n]*$/gm)];
  const blocks = [...section.matchAll(/^[ \t]*```json[ \t]*\r?\n([\s\S]*?)\r?\n[ \t]*```[ \t]*\r?$/gm)];
  p5Require(fences.length === 2 && blocks.length === 1,
    "P5 human exception source must contain exactly one JSON declaration block in its section");
  const declaration = JSON.parse(blocks[0][1]);
  p5Require(Array.isArray(declaration?.declarations) && declaration.declarations.length === 1,
    "P5 human exception declaration is ambiguous");
  const entry = declaration.declarations[0];
  p5Require(entry && typeof entry === "object" && !Array.isArray(entry)
    && ["declared_by", "reason", "scope", "expires_at_phase", "owner", "verbatim"].every((name) =>
      typeof entry[name] === "string" && entry[name].trim())
    && (entry.status === undefined), "P5 human exception fields are incomplete");
  const indexed = phaseFilesFromIndex(indexRaw);
  p5Require(indexed.includes(`phases/${entry.expires_at_phase}.md`)
    && /^P[1-9][0-9]*$/.test(entry.expires_at_phase)
    && Number(entry.expires_at_phase.slice(1)) >= 5,
  "P5 human exception expiry is not a current indexed Phase");
  const actualIds = new Set((Array.isArray(acceptanceChain) ? acceptanceChain : [])
    .map((row) => row?.acceptance_criterion_id).filter((value) => typeof value === "string"));
  const scopedIds = [...entry.scope.matchAll(/(?:^|[^A-Za-z0-9_-])(AC-[A-Za-z0-9_-]+)(?=$|[^A-Za-z0-9_-])/g)]
    .map((match) => match[1]);
  p5Require(scopedIds.length > 0 && scopedIds.every((id) => actualIds.has(id)),
    "P5 human exception scope includes an absent acceptance criterion");
  return {
    declared_by: entry.declared_by, reason: entry.reason, scope: entry.scope,
    expires_at_phase: entry.expires_at_phase, owner: entry.owner, verbatim: entry.verbatim,
    source_ref: sourceRef, source_sha256: sha256(decisionRaw),
    source_path: `${sourceRef}#human-exception-declaration`,
    fixture_only: declaration.kind === "fixture_only",
  };
}

/** Internal P5 reader shared with its same-run writer and contract fixture. */
export function isCompleteP5T007VitestOutput(output) {
  if (typeof output !== "string") return false;
  const lines = output.replace(/\u001b\[[0-9;]*m/g, "").split(/\r?\n/).map((line) => line.trim());
  const run = lines.filter((line) => /^RUN\s+v\d+\.\d+\.\d+\s+\S+/.test(line));
  const fileResults = lines.filter((line) => /^[✓❯↓]\s+.*\.test\.[cm]?[jt]s\b/u.test(line));
  const fileSummary = lines.filter((line) => /^Test Files\b/.test(line));
  const testSummary = lines.filter((line) => /^Tests\b/.test(line));
  if (run.length !== 1 || fileResults.length !== 1 || fileSummary.length !== 1 || testSummary.length !== 1
      || !/^Test Files\s+1 passed \(1\)$/.test(fileSummary[0])
      || lines.some((line) => /^(?:FAIL\b|×\s+)/u.test(line))) return false;
  const file = /^✓\s+runtime\/stage\/stage-end-report\.test\.mjs \((\d+) tests\)\s+\d+(?:\.\d+)?ms$/u.exec(fileResults[0]);
  const tests = /^Tests\s+(\d+) passed \((\d+)\)$/.exec(testSummary[0]);
  if (!file || !tests) return false;
  const count = Number(tests[1]);
  return Number.isSafeInteger(count) && count >= 15 && count === Number(tests[2]) && count === Number(file[1]);
}

/** Read blobs as data from the one publication tree; never load old code. */
function p5PublicationMaterials(task, source, certificate, worktree) {
  p5Require(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(source.snapshot_tree ?? "")
    && /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(source.snapshot_head ?? "")
    && SHA256_HEX.test(source.source_digest ?? ""), "P5 publication snapshot identity is invalid");
  ensureGitSnapshotObjectStore(worktree);
  const git = (args) => execFileSync("git", args, { cwd: worktree, stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
  const unavailable = (message) => {
    const error = new Error(message);
    error.code = "P5_PUBLICATION_VERSION_UNAVAILABLE";
    throw error;
  };
  const blob = (path) => {
    let entry;
    try { entry = git(["ls-tree", "-z", source.snapshot_tree, "--", path]).toString("utf8"); }
    catch { unavailable(`P5 publication Git blob unavailable: ${path}`); }
    if (!/^(?:100644|100755) blob [a-f0-9]+\t/.test(entry)
        || entry.split("\0").filter(Boolean).length !== 1) unavailable(`P5 publication Git blob unavailable: ${path}`);
    try { return git(["show", `${source.snapshot_tree}:${path}`]); }
    catch { unavailable(`P5 publication Git blob unavailable: ${path}`); }
  };
  const currentArtifacts = ArtifactDir.open(worktree, task);
  const bindings = source.publication_materials;
  p5Require(Array.isArray(bindings) && bindings.length > 0
    && JSON.stringify(bindings) === JSON.stringify(certificate.publication_materials),
  "P5 publication material bindings are absent or inconsistent");
  const values = {}, seen = new Set();
  for (const binding of bindings) {
    p5Require(typeof binding?.name === "string" && !seen.has(binding.name)
      && binding.source_ref === currentArtifacts.reference(binding.name)
      && SHA256_HEX.test(binding.sha256 ?? "")
      && binding.ref === `${P5_REPORT_ROOT}/material-${binding.sha256}.txt`,
    "P5 publication material source binding is invalid");
    seen.add(binding.name);
    const raw = task.readRecord(binding.ref);
    p5Require(sha256(raw) === binding.sha256, `P5 publication material original hash mismatch: ${binding.name}`);
    values[binding.name] = raw;
  }
  const names = materialFilesForCohort("post", values);
  p5Require(JSON.stringify(bindings.map(({ name }) => name)) === JSON.stringify(names)
    && materialRevisionFromValues(names.map((name) => [name, values[name]])) === source.material_revision,
  "P5 publication material scope or revision is invalid");
  p5Require(names.includes("phases/P5.md") && /### T007\b/.test(values["phases/P5.md"])
    && /### T008\b/.test(values["phases/P5.md"]), "P5 publication authority is absent");
  for (const [path, host] of [
    ["runtime/stage/stage-end-report.mjs", new URL("../stage/stage-end-report.mjs", import.meta.url)],
    ["runtime/evidence/acceptance-evidence-validator.mjs", new URL("./acceptance-evidence-validator.mjs", import.meta.url)],
    ["runtime/evidence/canonical-utils.mjs", new URL("./canonical-utils.mjs", import.meta.url)],
  ]) {
    if (!blob(path).equals(readFileSync(host))) unavailable(`P5 converter version unavailable for reproduction: ${path}`);
  }
  // The old test file is an input of its original receipt, not code to run.
  blob("runtime/stage/stage-end-report.test.mjs");
  return { values, names, git, artifacts: { read: (name) => values[name], reference: (name) => currentArtifacts.reference(name) } };
}

function p5PublicationFacts(task, source, certificate, read) {
  const binding = source.publication_facts;
  p5Require(binding && Object.keys(binding).sort().join() === "ref,sha256"
    && SHA256_HEX.test(binding.sha256 ?? "")
    && binding.ref === `${P5_REPORT_ROOT}/facts-${binding.sha256}.jsonl`
    && JSON.stringify(certificate.publication_facts) === JSON.stringify(binding),
  "P5 publication facts binding is absent or invalid");
  const raw = read(binding.ref);
  p5Require(sha256(raw) === binding.sha256, "P5 publication facts hash mismatch");
  const records = raw.split("\n").filter(Boolean).map((line) => JSON.parse(line));
  p5Require(records.length > 0 && records.every((record) => record.task_id === task.identity.taskId),
    "P5 publication facts Task identity is invalid");
  const rows = records.filter((record) => record.record_kind === "stage" && record.stage === "build-code");
  p5Require(rows.length === 1, "P5 publication facts stage row is absent or duplicated");
  return { ...binding, raw, row: rows[0] };
}

/** Current state is a separate observation; it never replaces publication data. */
function p5CurrentBinding(task, workspace, source, publicationFacts) {
  try {
    const current = captureWorkspaceSnapshot(workspace, task.identity.taskId, "post");
    const currentFacts = task.readRecord("facts.jsonl");
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
    const currentRevision = materialRevisionFromValues(source.publication_materials
      .map(({ name }) => [name, artifacts.read(name)]));
    const branch = execFileSync("git", ["branch", "--show-current"], { cwd: workspace.worktreeRoot, encoding: "utf8" }).trim();
    const matches = current.head === source.snapshot_head && current.tree === source.snapshot_tree
      && current.source_digest === source.source_digest && currentFacts === publicationFacts.raw && branch === source.branch
      && currentRevision === source.material_revision;
    return { status: matches ? "current" : "stale", reason: matches
      ? "the publication workspace and stage facts still match"
      : "current workspace or stage facts differ; the report remains publication-time evidence" };
  } catch (error) { return { status: "unavailable", reason: `current binding cannot be observed: ${error.message}` }; }
}

/** Authenticate the one immutable P5 publication, without certifying current quality. */
export function authenticateP5StageEndReport(taskHandle) {
  let task;
  try { task = assertTaskHandle(taskHandle); }
  catch (error) { return p5Unavailable(`authenticated TaskHandle unavailable: ${error.message}`); }
  const markerRef = `${P5_REPORT_ROOT}/report-facts.json`;
  let factsRaw;
  try { factsRaw = task.readRecord(markerRef); }
  catch (error) {
    return error?.code === "ENOENT"
      ? p5Missing("P5 report-facts.json commit marker is missing")
      : p5Unavailable(`P5 commit marker cannot be read: ${error.message}`);
  }
  try {
    const read = (ref) => task.readRecord(ref);
    const readJson = (ref) => JSON.parse(read(ref));
    const deliveryRef = `${P5_REPORT_ROOT}/T008-delivery.txt`;
    const reportRef = `${P5_REPORT_ROOT}/report.md`;
    const delivery = readJson(deliveryRef);
    p5Require(delivery.schema_version === "workflowhub-p5-delivery-index.v1"
      && delivery.task_id === task.identity.taskId && delivery.phase_id === "P5"
      && SHA256_HEX.test(delivery.source_sha256 ?? "")
      && SHA256_HEX.test(delivery.certificate_sha256 ?? "")
      && delivery.source_ref === `${P5_REPORT_ROOT}/source-${delivery.source_sha256}.json`
      && delivery.certificate_ref === `${P5_REPORT_ROOT}/certificate-${delivery.certificate_sha256}.json`,
    "P5 delivery index identity is invalid");
    const sourceRaw = read(delivery.source_ref);
    const certificateRaw = read(delivery.certificate_ref);
    const reportRaw = read(reportRef);
    p5Require(sha256(sourceRaw) === delivery.source_sha256
      && sha256(certificateRaw) === delivery.certificate_sha256
      && sha256(factsRaw) === delivery.facts_sha256
      && sha256(reportRaw) === delivery.report_sha256,
    "P5 report ref/hash binding is invalid");
    const source = JSON.parse(sourceRaw);
    const certificate = JSON.parse(certificateRaw);
    p5Require(source.schema_version === "workflowhub-p5-same-run-source.v1"
      && certificate.schema_version === "workflowhub-p5-source-certificate.v1"
      && source.project_name === task.identity.projectName
      && source.task_id === task.identity.taskId && source.stage === "build-code"
      && source.phase_id === "P5" && source.phase_task_id === "T008"
      && certificate.task_id === task.identity.taskId && certificate.stage === "build-code"
      && certificate.phase_id === "P5" && certificate.source_ref === delivery.source_ref
      && certificate.source_sha256 === delivery.source_sha256
      && certificate.facts_sha256 === delivery.facts_sha256
      && certificate.report_sha256 === delivery.report_sha256,
    "P5 source/certificate identity is invalid");

    const publicationFacts = p5PublicationFacts(task, source, certificate, read);
    const workspace = openCurrentTaskWorkspace(task);
    const worktree = workspace.worktreeRoot;
    p5Require(source.worktree === worktree && typeof source.branch === "string" && source.branch.trim(),
      "P5 publication workspace identity is invalid");
    const publication = p5PublicationMaterials(task, source, certificate, worktree);
    const materials = publication.values;
    const artifacts = publication.artifacts;
    const materialRevision = materialRevisionFromValues(publication.names.map((name) => [name, materials[name]]));
    const scopeRevision = stageMaterialScopeRevision("build-code", materials, { activationCohort: "post" });
    const snapshot = { head: source.snapshot_head, tree: source.snapshot_tree, source_digest: source.source_digest };
    const row = publicationFacts.row;
    p5Require(source.material_revision === materialRevision
      && certificate.snapshot_tree === snapshot.tree && certificate.material_revision === materialRevision
      && row.source === "stage-end:build-code" && row.created_at === source.stage_row_created_at
      && row.snapshot_tree?.value === snapshot.tree
      && row.material_digest?.value === scopeRevision.replace(/^revision-/, "")
      && row.phase_progress?.phase_id === "P5" && row.phase_progress?.task_id === "T008"
      && row.phase_progress?.material_revision === materialRevision && row.evidence?.value?.[0]?.exit_code === 0,
    "P5 publication Task/material/snapshot/stage row binding is invalid");

    const receiptBindings = source.receipts;
    p5Require(receiptBindings && ["implementation", "tests", "review"].every((name) =>
      typeof receiptBindings[name]?.ref === "string" && SHA256_HEX.test(receiptBindings[name]?.sha256 ?? ""))
      && JSON.stringify(certificate.receipt_refs) === JSON.stringify(receiptBindings),
    "P5 receipt binding is incomplete");
    const receiptRaw = Object.fromEntries(Object.entries(receiptBindings).map(([name, binding]) => {
      const raw = read(binding.ref);
      p5Require(sha256(raw) === binding.sha256, `P5 ${name} receipt hash mismatch`);
      return [name, raw];
    }));
    const implementation = JSON.parse(receiptRaw.implementation);
    const tests = JSON.parse(receiptRaw.tests);
    const review = JSON.parse(receiptRaw.review);
    validateCanonicalImplementationReceipt(implementation, { taskId: task.identity.taskId,
      snapshotTree: snapshot.tree, read });
    validateCanonicalTestReceipt(tests, { taskId: task.identity.taskId, stage: "build-code",
      snapshotTree: snapshot.tree, expectedProducerComponent: "build-code-test-capture", requirePassed: true });
    const testCommand = /^(?:npx |\.\/node_modules\/\.bin\/)vitest run runtime\/stage\/stage-end-report\.test\.mjs(?: --config vitest\.config\.mjs --poolOptions\.forks\.singleFork --no-fileParallelism)?$/;
    const output = read(tests.output_ref);
    p5Require(testCommand.test(tests.command) && isCompleteP5T007VitestOutput(output)
      && sha256(output) === tests.output_hash && tests.snapshot_head === snapshot.head
      && tests.source_digest === snapshot.source_digest && implementation.snapshot_head === snapshot.head
      && implementation.changed.includes("runtime/stage/stage-end-report.mjs")
      && source.implementation_diff?.ref === implementation.diff_ref
      && source.implementation_diff?.sha256 === implementation.diff_hash
      && source.test_output?.ref === tests.output_ref && source.test_output?.sha256 === tests.output_hash,
    "P5 T007 implementation/test/output binding is invalid");
    for (const receipt of [implementation, tests]) {
      p5Require(publication.git(["rev-parse", `${receipt.snapshot_commit}^{tree}`]).toString("utf8").trim() === snapshot.tree
        && publication.git(["show", "-s", "--format=%P", receipt.snapshot_commit]).toString("utf8").trim() === snapshot.head,
      "P5 publication receipt snapshot commit does not bind its tree/head");
    }
    p5Require(review.task_id === task.identity.taskId && review.stage === "build-code"
      && review.phase_id === "P5" && review.review_scope === "phase"
      && review.subject_kind === "phase" && review.result_ref === receiptBindings.review.ref,
    "P5 review Task/phase provenance is invalid");
    const originalAttempt = JSON.parse(read(review.attempt_ref));
    p5Require(originalAttempt.material_revision === review.material_revision,
      "P5 original review attempt/material binding is invalid");
    authenticateStageReviewResult(review, { taskId: task.identity.taskId, read });

    const qualityBindings = source.quality_facts;
    p5Require(Array.isArray(qualityBindings) && qualityBindings.length > 0
      && JSON.stringify(certificate.quality_fact_refs) === JSON.stringify(qualityBindings)
      && JSON.stringify(source.stage_result?.quality_fact_refs) === JSON.stringify(qualityBindings.map((entry) => entry.ref))
      && source.stage_result?.stage === "build-code" && !source.stage_result?.stage_reflection?.stage_row_error,
    "P5 stage result/quality fact binding is invalid");
    let phaseReviewFact = false;
    let phaseReviewCount = 0;
    const staleReviewWarning = "phase_review:stale-review-snapshot";
    const staleReview = review.snapshot_tree !== snapshot.tree || review.material_revision !== materialRevision;
    p5Require((source.stage_result?.quality_warnings ?? []).filter((value) => value === staleReviewWarning).length
      === (staleReview ? 1 : 0), "P5 original review freshness is not disclosed accurately");
    p5Require((source.stage_result?.quality_warnings ?? []).filter((value) =>
      value === "phase_review:original-material-replay-unavailable").length === 1,
    "P5 original review material replay limit is not disclosed accurately");
    for (const binding of qualityBindings) {
      p5Require(typeof binding?.ref === "string" && SHA256_HEX.test(binding.sha256 ?? ""), "P5 quality fact ref is invalid");
      const raw = read(binding.ref);
      const fact = validateCanonicalQualityFact(JSON.parse(raw));
      p5Require(sha256(raw) === binding.sha256
        && binding.ref === `quality/facts/${qualityFactDigest(fact)}.json`
        && fact.fact_id === `quality-${qualityFactDigest(fact)}`
        && fact.task_id === task.identity.taskId && fact.stage === "build-code"
        && fact.material_revision === materialRevision && fact.snapshot_tree === snapshot.tree,
      "P5 quality fact is not current");
      if (fact.subject === "phase_review") {
        phaseReviewCount += 1;
        phaseReviewFact = fact.status === "recorded"
          ? fact.evidence?.some((evidence) => evidence.ref === receiptBindings.review.ref
            && evidence.sha256 === receiptBindings.review.sha256)
          : ["missing", "unavailable"].includes(fact.status);
      }
    }
    p5Require(phaseReviewCount === 1 && phaseReviewFact, "P5 same-run phase review quality fact is absent or invalid");

    p5Require(Array.isArray(source.quality_advisory_facts)
      && JSON.stringify(certificate.quality_advisory_fact_refs) === JSON.stringify(source.quality_advisory_facts),
    "P5 source/certificate advisory binding list does not match");
    const acceptanceCandidates = [];
    authenticateP5AdvisorySources({ read, taskId: task.identity.taskId,
      snapshotTree: snapshot.tree, materialRevision, stageResult: source.stage_result,
      bindings: source.quality_advisory_facts, qualityBindings, acceptanceCandidates });

    const exception = parseP5HumanExceptionDeclaration(materials["decision-log.md"],
      materials["phases/index.md"], source.acceptance_chain, artifacts.reference("decision-log.md"),
      new Set(["none", "declared"]).has(source.human_exception_source?.kind) ? { task, artifacts, snapshot, materialRevision,
        existing: source.human_exception_source, publicationFacts,
        requiredRefs: [...qualityBindings, ...source.quality_advisory_facts].map((binding) => binding.ref).concat(receiptBindings.review.ref) } : null);
    p5Require(JSON.stringify(source.human_exception_source) === JSON.stringify(exception),
      "P5 human exception original source does not match");

    const evidenceIndex = [
      ...Object.values(receiptBindings).map(({ ref }) => ({ path: ref, kind: "canonical_receipt" })),
      { path: tests.output_ref, kind: "canonical_test_output" },
      ...qualityBindings.map(({ ref }) => ({ path: ref, kind: "quality_fact" })),
      ...acceptanceCandidates,
      { path: exception.kind === "none" ? exception.audit_ref : exception.source_ref,
        kind: exception.kind === "none" ? "no_exception_audit_candidate" : "human_exception_material" },
      ...Object.values(exception.approval_refs ?? {}).map(({ ref }) => ({ path: ref, kind: "human_exception_approval" })),
    ];
    const rebuilt = buildStageEndReportFacts({ chainRows: source.acceptance_chain,
      stageResult: source.stage_result, stageResultPath: `${delivery.source_ref}#stage_result`, evidenceIndex,
      declared: { routes: [], limits: [], ...(exception.kind === "none"
        ? { exceptions: [], no_exceptions: exception } : { exceptions: [{ declared_by: exception.declared_by,
        reason: exception.reason, scope: exception.scope, expires_at_phase: exception.expires_at_phase,
        owner: exception.owner, verbatim: exception.verbatim, source_path: exception.source_path }] }) } });
    p5Require(factsRaw === `${JSON.stringify(rebuilt, null, 2)}\n`
      && reportRaw === renderStageEndReport(rebuilt), "P5 report facts/render do not reproduce original bytes");
    if (exception.kind === "none" || exception.kind === "declared") return Object.freeze({ status: "recorded", authenticated: true,
      facts: rebuilt, source_ref: delivery.source_ref, source_sha256: delivery.source_sha256,
      certificate_ref: delivery.certificate_ref, certificate_sha256: delivery.certificate_sha256,
      material_revision: materialRevision, snapshot_tree: snapshot.tree,
      freshness: p5CurrentBinding(task, workspace, source, publicationFacts),
      current_quality: { status: "unknown", reason: "P5 publication authentication does not certify current Phase or whole-task quality" } });
    // These bytes can be rechecked, but their decision-log declaration has no
    // independent user confirmation bound to this particular P5 exception.
    // Neither fixture_only nor self-described human fields are formal approval.
    return p5Missing("P5 human exception has no independently authenticated user confirmation source");
  } catch (error) {
    return new Set(["EACCES", "EPERM", "EIO", "P5_PUBLICATION_VERSION_UNAVAILABLE"]).has(error?.code)
      ? p5Unavailable(`P5 source read is unavailable: ${error.message}`)
      : p5Missing(`P5 report cannot be authenticated: ${error.message}`);
  }
}
