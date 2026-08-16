import { createHash } from "node:crypto";

import { assertTaskHandle } from "../../../runtime/task/task-handle.mjs";
import { validateAcceptanceEvidence } from "../../../runtime/task/task-kernel-implementation.mjs";
import { validateSchema } from "./schema-validator.mjs";

const HASH = /^[a-f0-9]{64}$/;
const OID = /^[a-f0-9]{40,64}$/;
const EVIDENCE_REF = /^(?:evidence|quality\/evidence)\/[A-Za-z0-9][A-Za-z0-9._/-]*$/;
const RECEIPT_REF = /^quality\/tests\/[A-Za-z0-9][A-Za-z0-9._/-]*$/;
const CRITERION_ID = /\bAC-[A-Za-z0-9][A-Za-z0-9._-]*\b/g;
const ANCHOR_PATH = /^(?:[A-Za-z0-9][A-Za-z0-9._-]*)(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/;

function sha256(raw) { return createHash("sha256").update(raw).digest("hex"); }

function parseJson(raw, label) {
  try { return JSON.parse(raw); }
  catch { throw new Error(`MATERIAL_INCOMPLETE: ${label} is not JSON`); }
}

function parseOptionalJson(raw) {
  try { return JSON.parse(raw); }
  catch { return null; }
}

function normalizedHash(value, label) {
  const hash = typeof value === "string" ? value.replace(/^sha256:/, "") : "";
  if (!HASH.test(hash)) throw new Error(`MATERIAL_INCOMPLETE: ${label} hash is invalid`);
  return hash;
}

function authenticatedRecord(task, ref, expectedHash, label, pattern, { requireJson = true } = {}) {
  if (typeof ref !== "string" || !pattern.test(ref) || ref.includes("..")) throw new Error(`MATERIAL_INCOMPLETE: ${label} ref is invalid`);
  const hash = normalizedHash(expectedHash, label);
  let raw;
  try { raw = task.readRecord(ref); }
  catch (error) { throw new Error(`MATERIAL_INCOMPLETE: ${label} is unavailable: ${error.message}`); }
  if (sha256(raw) !== hash) throw new Error(`MATERIAL_INCOMPLETE: ${label} hash mismatch`);
  return { ref, sha256: hash, raw, value: requireJson ? parseJson(raw, label) : parseOptionalJson(raw) };
}

function acceptedCriterionIds(value) {
  if (typeof value !== "string") throw new Error("MATERIAL_INCOMPLETE: acceptance_criteria must be text for AC summary generation");
  const ids = [...value.matchAll(CRITERION_ID)].map(([id]) => id);
  const unique = [...new Set(ids)];
  if (unique.length === 0) throw new Error("MATERIAL_INCOMPLETE: acceptance_criteria has no stable AC ids");
  return unique;
}

function semanticAnchor(value, label) {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`MATERIAL_INCOMPLETE: ${label} must be an anchor object`);
  const allowed = new Set(["id", "path", "start_line", "end_line", "role", "reason"]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) throw new Error(`MATERIAL_INCOMPLETE: ${label} has unknown field ${key}`);
  const expectedRole = label.endsWith(".implementation_anchor") ? "implementation"
    : label.endsWith(".verification_anchor") ? "verification" : null;
  if (typeof value.id !== "string" || value.id.trim() === ""
      || typeof value.path !== "string" || !ANCHOR_PATH.test(value.path) || value.path.includes("..")
      || !Number.isSafeInteger(value.start_line) || value.start_line < 1
      || !Number.isSafeInteger(value.end_line) || value.end_line < value.start_line
      || typeof value.role !== "string" || value.role.trim() === ""
      || (expectedRole !== null && value.role !== expectedRole)) {
    throw new Error(`MATERIAL_INCOMPLETE: ${label} requires id, relative path, line range, and role`);
  }
  if (value.reason !== undefined && (typeof value.reason !== "string" || value.reason.trim() === "")) {
    throw new Error(`MATERIAL_INCOMPLETE: ${label}.reason must be non-empty text`);
  }
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

function structuredFields(value, label) {
  if (value === undefined) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`MATERIAL_INCOMPLETE: ${label} must be structured metadata`);
  const allowed = new Set(["scenario", "oracle", "actual_outcome", "evidence_type", "coverage_limits", "exceptions", "implementation_anchor", "verification_anchor"]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) throw new Error(`MATERIAL_INCOMPLETE: ${label} has unknown field ${key}`);
  const scalar = (key) => {
    if (value[key] === undefined) return undefined;
    if (typeof value[key] !== "string" || value[key].trim() === "") throw new Error(`MATERIAL_INCOMPLETE: ${label}.${key} must be non-empty text`);
    return value[key];
  };
  const list = (key) => {
    if (value[key] === undefined) return undefined;
    if (!Array.isArray(value[key]) || value[key].length === 0 || value[key].some((item) => typeof item !== "string" || item.trim() === "")) throw new Error(`MATERIAL_INCOMPLETE: ${label}.${key} must be a non-empty text array`);
    return [...value[key]];
  };
  return {
    scenario: scalar("scenario"),
    oracle: scalar("oracle"),
    actual_outcome: scalar("actual_outcome"),
    evidence_type: scalar("evidence_type"),
    coverage_limits: list("coverage_limits"),
    exceptions: list("exceptions"),
    implementation_anchor: semanticAnchor(value.implementation_anchor, `${label}.implementation_anchor`),
    verification_anchor: semanticAnchor(value.verification_anchor, `${label}.verification_anchor`),
  };
}

function structuredObservation(value, criterionId, snapshotTree, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) || value.schema_version !== "acceptance-observation.v1") return null;
  const allowed = new Set(["schema_version", "acceptance_criterion_id", "snapshot_tree", "summary"]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) throw new Error(`MATERIAL_INCOMPLETE: ${label} has unknown field ${key}`);
  if (value.acceptance_criterion_id !== criterionId) throw new Error(`MATERIAL_INCOMPLETE: ${label} criterion does not match its leaf`);
  if (value.snapshot_tree !== snapshotTree) throw new Error(`MATERIAL_INCOMPLETE: ${label} snapshot does not match test receipt`);
  return structuredFields(value.summary, `${label}.summary`);
}

function mergeMetadata(sources, result) {
  const merged = {
    scenario: "unknown", oracle: "unknown", actual_outcome: "unknown",
    evidence_type: "acceptance_leaf", coverage_limits: ["unknown"], exceptions: ["unknown"],
  };
  for (const source of sources.filter(Boolean)) {
    for (const key of ["scenario", "oracle", "actual_outcome", "evidence_type", "coverage_limits", "exceptions", "implementation_anchor", "verification_anchor"]) {
      const value = source[key];
      if (value === undefined) continue;
      const current = merged[key];
      const unknown = current === undefined
        || (Array.isArray(current) && current.length === 1 && current[0] === "unknown")
        || current === "unknown"
        || (key === "evidence_type" && current === "acceptance_leaf");
      if (!unknown && JSON.stringify(current) !== JSON.stringify(value)) throw new Error(`MATERIAL_INCOMPLETE: structured evidence conflicts on ${key}`);
      merged[key] = value;
    }
  }
  if (merged.evidence_type === "acceptance_leaf" && sources.some(Boolean)) merged.evidence_type = "structured_observation";
  if (!["acceptance_leaf", "structured_observation", "unknown"].includes(merged.evidence_type)) throw new Error("MATERIAL_INCOMPLETE: evidence_type is unsupported");
  return merged;
}

export function buildAcEvidenceSummary({ task, acceptanceCriteria, acceptanceEvidence } = {}) {
  const handle = assertTaskHandle(task);
  const criterionIds = acceptedCriterionIds(acceptanceCriteria);
  if (!acceptanceEvidence || typeof acceptanceEvidence !== "object" || Array.isArray(acceptanceEvidence)) throw new Error("MATERIAL_INCOMPLETE: verify-code acceptance_evidence requires authenticated roots");
  const test = authenticatedRecord(handle, acceptanceEvidence.test_receipt_ref, acceptanceEvidence.test_receipt_hash, "test receipt", RECEIPT_REF);
  if (test.value?.schema_version !== "workflowhub-receipt.v1" || test.value.task_id !== handle.identity.taskId
      || !["verify-code", "build-code"].includes(test.value.stage)
      || test.value.producer?.stage !== test.value.stage
      || !OID.test(test.value.snapshot_tree ?? "")) {
    throw new Error("MATERIAL_INCOMPLETE: test receipt provenance is invalid");
  }
  const sourceDigest = normalizedHash(acceptanceEvidence.source_digest ?? test.value.source_digest, "source digest");
  if (test.value.source_digest !== undefined && test.value.source_digest !== sourceDigest) throw new Error("MATERIAL_INCOMPLETE: test receipt source digest mismatch");
  const testExitCode = test.value.exit_code;
  const aggregate = authenticatedRecord(handle, acceptanceEvidence.evidence_ref, acceptanceEvidence.evidence_hash, "acceptance evidence aggregate", EVIDENCE_REF);
  if (aggregate.value?.schema_version !== "workflowhub-receipt.v1" || aggregate.value.task_id !== handle.identity.taskId || aggregate.value.stage !== "verify-code" || aggregate.value.producer?.component !== "evidence" || !Array.isArray(aggregate.value.refs)) {
    throw new Error("MATERIAL_INCOMPLETE: acceptance evidence aggregate provenance is invalid");
  }
  const leaves = new Map();
  for (const entry of aggregate.value.refs) {
    const leaf = authenticatedRecord(handle, entry?.ref, entry?.sha256, "acceptance evidence leaf", EVIDENCE_REF);
    const evidence = validateAcceptanceEvidence(leaf.value, "acceptance evidence leaf");
    if (leaves.has(evidence.acceptance_criterion_id)) throw new Error(`MATERIAL_INCOMPLETE: duplicate acceptance criterion ${evidence.acceptance_criterion_id}`);
    if (evidence.snapshot_tree !== undefined && evidence.snapshot_tree !== test.value.snapshot_tree) throw new Error("MATERIAL_INCOMPLETE: acceptance leaf snapshot does not match test receipt");
    if (evidence.source_digest !== sourceDigest) throw new Error(`MATERIAL_INCOMPLETE: acceptance leaf ${evidence.acceptance_criterion_id} source digest does not match the test receipt`);
    const nested = evidence.refs.map((entry) => authenticatedRecord(handle, entry.ref, entry.sha256, "nested acceptance evidence", EVIDENCE_REF, { requireJson: false }));
    const metadata = [structuredFields(evidence.summary, "acceptance leaf summary")];
    for (const record of nested) metadata.push(structuredObservation(record.value, evidence.acceptance_criterion_id, test.value.snapshot_tree, "nested acceptance observation"));
    leaves.set(evidence.acceptance_criterion_id, { leaf, evidence, nested, metadata });
  }
  if (leaves.size !== criterionIds.length || criterionIds.some((id) => !leaves.has(id))) throw new Error("MATERIAL_INCOMPLETE: acceptance evidence does not cover accepted ACs exactly once");
  const summary = {
    schema_version: "ac-evidence-summary.v1",
    snapshot_tree: test.value.snapshot_tree,
    source_digest: sourceDigest,
    test_receipt: { ref: test.ref, sha256: test.sha256 },
    criteria: criterionIds.map((id) => {
      const item = leaves.get(id);
      const metadata = mergeMetadata(item.metadata, item.evidence.result);
      const metadataIncomplete = Object.values(metadata).some((value) => Array.isArray(value) ? value.includes("unknown") : value === "unknown")
        || !metadata.implementation_anchor
        || !metadata.verification_anchor;
      const testIncomplete = !Number.isInteger(testExitCode) || testExitCode !== 0;
      const incomplete = metadataIncomplete || testIncomplete;
      return {
        acceptance_criterion_id: id,
        // A leaf claim is not a verified pass when structured evidence or the
        // authenticated test receipt is incomplete. Preserve the claim for
        // provenance instead of silently presenting it as final proof.
        result: item.evidence.result === "fail" ? "fail" : incomplete ? "unknown" : "pass",
        leaf_result: item.evidence.result,
        status: item.evidence.result === "fail" ? "failed" : incomplete ? "incomplete" : "passed",
        source_digest: sourceDigest,
        acceptance_leaf: { ref: item.leaf.ref, sha256: item.leaf.sha256 },
        nested_evidence: item.nested.map(({ ref, sha256 }) => ({ ref, sha256 })),
        ...metadata,
      };
    }),
  };
  // A distinct leaf hash is not enough when every criterion carries the same
  // generic prose and the same nested evidence.  Keep the leaf claim for
  // provenance, but downgrade the provider-facing result so verify-code
  // cannot present one shared proof as criterion-specific verification.
  if (summary.criteria.length > 1) {
    const normalizeCriterion = (value) => String(value ?? "").replace(/\bAC-[A-Za-z0-9][A-Za-z0-9._-]*\b/g, "AC-*");
    const prose = summary.criteria.map((item) => JSON.stringify([
      normalizeCriterion(item.scenario),
      normalizeCriterion(item.oracle),
      normalizeCriterion(item.actual_outcome),
    ]));
    const actualOutcomes = summary.criteria.map((item) => normalizeCriterion(item.actual_outcome));
    const nested = summary.criteria.map((item) => JSON.stringify(item.nested_evidence));
    const genericProse = new Set(prose).size === 1;
    const genericActualOutcome = actualOutcomes.every((value) => /^(?:pass|passed|result|通过|测试通过|当前快照测试通过)$/i.test(value.trim()));
    const sharedNestedEvidence = new Set(nested).size === 1;
    const implementationAnchors = summary.criteria.map((item) => JSON.stringify(item.implementation_anchor ?? null));
    const verificationAnchors = summary.criteria.map((item) => JSON.stringify(item.verification_anchor ?? null));
    const sharedImplementationAnchor = new Set(implementationAnchors).size === 1 && implementationAnchors[0] !== "null";
    const sharedVerificationAnchor = new Set(verificationAnchors).size === 1 && verificationAnchors[0] !== "null";
    if (genericProse || genericActualOutcome || sharedNestedEvidence || sharedImplementationAnchor || sharedVerificationAnchor) {
      for (const item of summary.criteria) {
        item.result = item.leaf_result === "fail" ? "fail" : "unknown";
        item.status = item.leaf_result === "fail" ? "failed" : "incomplete";
        item.exceptions = [
          ...item.exceptions,
          ...(genericProse ? ["per-AC verification prose is generic"] : []),
          ...(genericActualOutcome ? ["per-AC actual outcomes are generic"] : []),
          ...(sharedNestedEvidence ? ["nested evidence is shared across ACs"] : []),
          ...(sharedImplementationAnchor ? ["implementation proof anchor is shared across ACs"] : []),
          ...(sharedVerificationAnchor ? ["verification/test assertion anchor is shared across ACs"] : []),
        ];
      }
    }
  }
  return validateSchema("ac_evidence_summary", summary);
}
