import { createHash } from "node:crypto";

import { validateCanonicalTestReceipt, validateHumanConfirmation } from "../../core/canonical-evidence-validators.mjs";
import { validateAcceptanceEvidence } from "../../core/task-kernel-implementation.mjs";
import { validateSchema } from "../../skills/wh-review/scripts/schema-validator.mjs";

const HASH = /^[a-f0-9]{64}$/;

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

function expectedPassed(status, passed, failed) {
  if (status === "passed") return passed;
  if (status === "failed") return failed;
  return false;
}

function authenticateNested(fact, evidence, raw, { read, dependencies, key }) {
  let value;
  try { value = JSON.parse(raw); } catch {
    dependencies[key] = "stale";
    return;
  }
  try {
    if (evidence.evidence_type === "test_receipt") {
      validateCanonicalTestReceipt(value, {
        taskId: fact.task_id, stage: fact.stage, snapshotTree: fact.snapshot_tree,
        subject: fact.subject, requirePassed: false,
      });
      if (!expectedPassed(fact.status, value.exit_code === 0, value.exit_code !== 0)) throw new Error("test outcome mismatch");
      const outputKey = `${key}:output:${value.output_ref}`;
      const outputRaw = readBound({ ref: value.output_ref, sha256: value.output_hash }, read, dependencies, outputKey);
      if (outputRaw !== undefined) dependencies[outputKey] = "current";
    } else if (evidence.evidence_type === "review_result") {
      validateSchema("result", value);
      if (value.task_id !== fact.task_id || value.stage !== fact.stage || value.snapshot_tree !== fact.snapshot_tree) {
        throw new Error("review provenance mismatch");
      }
      const subjectMatches = fact.subject === "phase_reviews"
        ? value.subject_kind === "phase" && value.review_scope === "phase"
        : fact.subject === "integration_review"
          ? value.subject_kind === "worktree" && value.review_scope === "integration"
          : value.subject_kind === "worktree";
      if (!subjectMatches) throw new Error("review subject mismatch");
      if (!expectedPassed(fact.status, value.verdict === "pass", value.verdict === "revise_required")) throw new Error("review outcome mismatch");
    } else if (evidence.evidence_type === "acceptance_evidence") {
      const acceptance = validateAcceptanceEvidence(value);
      if (acceptance.acceptance_criterion_id !== fact.subject) throw new Error("acceptance subject mismatch");
      if (acceptance.snapshot_tree !== undefined && acceptance.snapshot_tree !== fact.snapshot_tree) throw new Error("acceptance tree mismatch");
      if (!expectedPassed(fact.status, acceptance.result === "pass", acceptance.result === "fail")) throw new Error("acceptance outcome mismatch");
      for (const nested of acceptance.refs) {
        const nestedKey = `${key}:nested:${nested.ref}`;
        const nestedRaw = readBound(nested, read, dependencies, nestedKey);
        if (nestedRaw !== undefined) dependencies[nestedKey] = "current";
      }
    } else if (evidence.evidence_type === "human_confirmation") {
      validateHumanConfirmation(value, {
        taskId: fact.task_id, stage: fact.stage, subject: value.attempt_ref, requireAccepted: false,
      });
      if (fact.subject !== "human_confirmation") throw new Error("confirmation subject mismatch");
      if (!expectedPassed(fact.status, value.decision === "accepted", value.decision === "rejected")) throw new Error("confirmation outcome mismatch");
    } else {
      throw new Error(`unsupported canonical evidence_type: ${evidence.evidence_type}`);
    }
    dependencies[key] = "current";
  } catch {
    dependencies[key] = "stale";
  }
}

export function evaluateFactFreshness(fact, current, { read }) {
  const dependencies = {
    material: fact.material_revision === current.material_revision ? "current" : "stale",
    tree: fact.snapshot_tree === current.snapshot_tree ? "current" : "stale",
    fact: "current",
  };
  const factRaw = readBound(fact, read, dependencies, "fact");
  if (factRaw !== undefined) {
    try {
      const parsed = JSON.parse(factRaw);
      for (const field of ["schema_version", "fact_id", "task_id", "stage", "material_revision", "snapshot_tree", "kind", "subject", "status"]) {
        if (parsed[field] !== fact[field]) dependencies.fact = "stale";
      }
      if (parsed.schema_version !== "quality-fact.v1") dependencies.fact = "stale";
    } catch { dependencies.fact = "stale"; }
  }
  for (const evidence of fact.evidence ?? []) {
    const key = `evidence:${evidence.ref}`;
    const raw = readBound(evidence, read, dependencies, key);
    if (raw !== undefined) authenticateNested(fact, evidence, raw, { read, dependencies, key });
  }
  const values = Object.values(dependencies);
  const status = values.includes("missing") ? "missing" : values.every((value) => value === "current") ? "current" : "stale";
  return Object.freeze({
    fact_ref: fact.ref, status, authenticated: status === "current",
    dependencies: Object.freeze(dependencies),
  });
}
