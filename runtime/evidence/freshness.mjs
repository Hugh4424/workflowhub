import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import Ajv2020 from "ajv/dist/2020.js";

import { isHumanConfirmationVersion, validateCanonicalFullTestReceipt, validateCanonicalTestReceipt, validateHumanConfirmation } from "./canonical-evidence-validators.mjs";
import { validateAcceptanceEvidence } from "./acceptance-evidence-validator.mjs";
import browserQaSchema from "../schemas/browser-qa-evidence.v1.json" with { type: "json" };
import { validateSchema } from "../review/schema-validator.mjs";
import { STAGE_ADVISORY_PREDICATES, STAGE_FACT_MATERIALS, STAGE_PREDICATES } from "../stage/completion-predicates.mjs";
import { isMaterialOnlySnapshotDelta } from "../task/git-worktree-snapshot.mjs";
import { canonicalReviewFindings, isActionableSeriousFinding } from "../review/stage-review-disposition.mjs";

const HASH = /^[a-f0-9]{64}$/;
const QUALITY_STATUSES = new Set(["passed", "failed", "unavailable", "missing", "recorded"]);
const REVIEW_STATUSES = new Set(["clean", "findings", "resolved", "unavailable"]);
const CLOSE_PLAN_REF = /^operations\/close\/plans\/[a-f0-9]{64}\/plan\.json$/;
const browserQaValidator = new Ajv2020({ allErrors: true, strict: false }).compile(browserQaSchema);

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

function authenticateE2eExecutionStageQuality(value, fact, read, dependencies, key) {
  if (!value || typeof value !== "object" || Array.isArray(value)
      || value.schema_version !== "stage-quality-evidence.v1"
      || value.task_id !== fact.task_id || value.stage !== "build-code"
      || value.subject !== "acceptance_execution" || value.status !== "passed"
      || value.material_revision !== fact.material_revision || value.snapshot_tree !== fact.snapshot_tree
      || value.subject_fact?.status !== "passed"
      || !Array.isArray(value.subject_fact?.execution_items) || value.subject_fact.execution_items.length === 0) {
    throw new Error("nested acceptance execution stage evidence is invalid");
  }
  const executionBinding = value.subject_fact.execution_binding;
  if (!executionBinding || typeof executionBinding.stage_outcome_ref !== "string"
      || !/^quality\/evidence\/stage-outcomes\/build-code\/[a-f0-9]{64}\.json$/.test(executionBinding.stage_outcome_ref)
      || !HASH.test(executionBinding.stage_outcome_hash ?? "")) {
    throw new Error("nested acceptance execution stage outcome binding is invalid");
  }
  const outcomeKey = `${key}:stage-outcome`;
  const outcome = readBoundJson({ ref: executionBinding.stage_outcome_ref, sha256: executionBinding.stage_outcome_hash }, read, dependencies, outcomeKey);
  if (!outcome || outcome.schema_version !== "workflowhub-stage-outcomes.v1"
      || outcome.task_id !== fact.task_id || outcome.stage !== "build-code"
      || outcome.status !== "completed" || outcome.material_revision !== fact.material_revision
      || outcome.snapshot_tree !== fact.snapshot_tree) {
    throw new Error("nested acceptance execution stage outcome is not current");
  }
  const seen = new Set();
  for (const [index, item] of value.subject_fact.execution_items.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)
        || item.task_id !== fact.task_id || item.status !== "executed" || item.tier !== "browser"
        || typeof item.source !== "string" || item.source.trim() === ""
        || typeof item.sample !== "string" || item.sample.trim() === ""
        || typeof item.scenario !== "string" || item.scenario.trim() === ""
        || !Array.isArray(item.evidence_refs) || item.evidence_refs.length === 0) {
      throw new Error(`nested acceptance execution item ${index + 1} is invalid`);
    }
    const scenarioKey = JSON.stringify([item.source, item.sample, item.scenario, item.tier]);
    if (seen.has(scenarioKey)) throw new Error("nested acceptance execution contains duplicate scenarios");
    seen.add(scenarioKey);
    for (const [refIndex, reference] of item.evidence_refs.entries()) {
      const browserKey = `${key}:browser:${index}:${refIndex}`;
      if (!/^quality\/evidence\/browser-qa\/[A-Za-z0-9._-]+\.json$/.test(reference?.ref ?? "")) {
        throw new Error("nested browser evidence ref is outside the canonical namespace");
      }
      const browser = readBoundJson(reference, read, dependencies, browserKey);
      if (!browser) throw new Error("nested browser evidence is unavailable");
      authenticateBrowserAcceptance(browser, fact, item, read, dependencies, browserKey);
    }
  }
}

function authenticateE2eAcceptanceStageQuality(value, fact, read, dependencies, key) {
  if (!value || typeof value !== "object" || Array.isArray(value)
      || value.schema_version !== "stage-quality-evidence.v1"
      || value.task_id !== fact.task_id || value.stage !== "verify-code"
      || value.subject !== "e2e_acceptance" || value.status !== "passed"
      || value.material_revision !== fact.material_revision || value.snapshot_tree !== fact.snapshot_tree
      || value.subject_fact?.status !== "passed" || !Array.isArray(value.subject_fact?.evidence_refs)) {
    throw new Error("nested e2e acceptance stage evidence is invalid");
  }
  const refs = value.subject_fact.evidence_refs;
  const required = { execution: false, review: false, confirmation: false };
  if (refs.length !== 3) throw new Error("nested e2e acceptance must bind execution, review, and confirmation");
  for (const [index, reference] of refs.entries()) {
    const nestedKey = `${key}:chain:${index}`;
    const ref = reference?.ref ?? "";
    const nested = readBoundJson(reference, read, dependencies, nestedKey);
    if (!nested) throw new Error("nested e2e acceptance chain record is unavailable");
    if (/^quality\/evidence\/acceptance\/build-code\//.test(ref)) {
      if (required.execution) throw new Error("nested e2e acceptance has duplicate execution evidence");
      required.execution = true;
      const acceptance = validateAcceptanceEvidence(nested);
      if (acceptance.acceptance_criterion_id !== "acceptance_execution" || acceptance.result !== "pass"
          || acceptance.snapshot_tree !== fact.snapshot_tree || acceptance.refs.length !== 1
          || acceptance.freshness?.status !== "current"
          || acceptance.freshness?.snapshot_tree !== fact.snapshot_tree
          || acceptance.freshness?.material_revision !== fact.material_revision) {
        throw new Error("nested execution acceptance is not current");
      }
      const executionKey = `${nestedKey}:execution-stage`;
      const executionStage = readBoundJson(acceptance.refs[0], read, dependencies, executionKey);
      if (!executionStage) throw new Error("nested execution stage evidence is unavailable");
      authenticateE2eExecutionStageQuality(executionStage, fact, read, dependencies, executionKey);
    } else if (/^quality\/reviews\/results\//.test(ref)) {
      if (required.review) throw new Error("nested e2e acceptance has duplicate review evidence");
      required.review = true;
      validateSchema("result", nested);
      if (nested.task_id !== fact.task_id || nested.stage !== "verify-code"
          || nested.material_revision !== fact.material_revision || nested.snapshot_tree !== fact.snapshot_tree
          || Object.hasOwn(nested, "verdict")) throw new Error("nested e2e review provenance is invalid");
    } else if (/^quality\/confirmations\//.test(ref)) {
      if (required.confirmation) throw new Error("nested e2e acceptance has duplicate confirmation evidence");
      required.confirmation = true;
      validateHumanConfirmation(nested, { taskId: fact.task_id, stage: "verify-code", requireAccepted: true });
      if (nested.material_revision !== fact.material_revision || nested.snapshot_tree !== fact.snapshot_tree) {
        throw new Error("nested e2e confirmation provenance is invalid");
      }
    } else {
      throw new Error("nested e2e acceptance chain ref is outside its canonical namespace");
    }
  }
  if (!required.execution || !required.review || !required.confirmation) {
    throw new Error("nested e2e acceptance chain is incomplete");
  }
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
  const recordOnly = !adviceReview
    && isRegisteredStagePredicate(fact)
    && workspaceRoot
    && typeof taskId === "string"
    && isMaterialOnlySnapshotDelta(workspaceRoot, fact.snapshot_tree, current.snapshot_tree, taskId);
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
    tree: adviceReview || recordOnly || fact.snapshot_tree === current.snapshot_tree ? "current" : "stale",
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
