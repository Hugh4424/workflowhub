/**
 * Shared AuditSummary carrier for stage-result producers and consumers.
 * `audit-aggregator` is the only component that makes an audit verdict;
 * callers here only preserve and verify its published tuple.
 */
import { createHash } from "node:crypto";
import { isAbsolute } from "node:path";
import { assertTaskReadCapability } from "../task/task-capability.mjs";

export const AUDIT_CARRIER_VERSION = "v1";

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

export function hashAuditSummary(summary) {
  const { summary_hash, ...unsigned } = summary ?? {};
  return createHash("sha256").update(canonicalJson(unsigned), "utf8").digest("hex");
}

function safeRelativeRef(ref) {
  return typeof ref === "string" && ref.trim() !== "" && !isAbsolute(ref) && !ref.split(/[\\/]+/).includes("..");
}

export function carryAuditSummary(auditSummaryRef, auditSummary) {
  const check = verifyAuditSummary(auditSummaryRef, auditSummary);
  if (!check.ok) throw new TypeError(check.errors.join("; "));
  return { audit_contract_version: AUDIT_CARRIER_VERSION, audit_summary_ref: auditSummaryRef, audit_summary_hash: auditSummary.summary_hash, audit_verdict: auditSummary.verdict };
}

/** Verify identity/integrity only. It never derives a verdict. */
export function verifyAuditSummary(auditSummaryRef, auditSummary, expected = {}) {
  const errors = [];
  if (!safeRelativeRef(auditSummaryRef)) errors.push("audit_summary_ref must be a non-empty relative path without traversal");
  if (!auditSummary || typeof auditSummary !== "object") errors.push("published audit summary must be an object");
  else {
    if (!['pass', 'fail'].includes(auditSummary.verdict)) errors.push("published audit summary has invalid verdict");
    if (typeof auditSummary.summary_hash !== "string" || !/^[a-f0-9]{64}$/.test(auditSummary.summary_hash)) errors.push("published audit summary has invalid summary_hash");
    else if (hashAuditSummary(auditSummary) !== auditSummary.summary_hash) errors.push("HASH_MISMATCH: published audit summary hash does not match content");
    if (expected.hash && auditSummary.summary_hash !== expected.hash) errors.push("HASH_MISMATCH: audit_summary_hash does not match published summary");
    if (expected.verdict && auditSummary.verdict !== expected.verdict) errors.push("audit_verdict does not match published summary");
  }
  return { ok: errors.length === 0, errors };
}

export function loadAuditSummary(task, auditSummaryRef, expected = {}) {
  const taskHandle = assertTaskReadCapability(task);
  if (!safeRelativeRef(auditSummaryRef)) return { ok: false, errors: ["audit_summary_ref must be a task-relative path"] };
  try {
    const auditSummary = JSON.parse(taskHandle.readRecord(auditSummaryRef));
    const result = verifyAuditSummary(auditSummaryRef, auditSummary, expected);
    return { ...result, audit_summary: auditSummary, ref: auditSummaryRef };
  } catch (error) { return { ok: false, errors: [`cannot read published audit summary: ${error.message}`] }; }
}

/** Unversioned receipts remain explicit migration input, not fabricated passes. */
export function verifyAuditCarrier(facts = {}) {
  const hasAny = ['audit_contract_version', 'audit_summary_ref', 'audit_summary_hash', 'audit_verdict'].some((key) => Object.hasOwn(facts, key));
  if (!hasAny) return { ok: true, legacy: true, errors: [], migration_hint: "use audit_contract_version:v1 with audit_summary_ref, audit_summary_hash, audit_verdict" };
  const errors = [];
  if (facts.audit_contract_version !== AUDIT_CARRIER_VERSION) errors.push("LEGACY_FIELDS_MISSING: audit_contract_version must be v1; migration_hint=publish the v1 audit carrier tuple");
  if (!safeRelativeRef(facts.audit_summary_ref)) errors.push("audit_summary_ref must be a non-empty relative path without traversal");
  if (typeof facts.audit_summary_hash !== "string" || !/^[a-f0-9]{64}$/.test(facts.audit_summary_hash)) errors.push("audit_summary_hash must be a lowercase 64-hex SHA-256");
  if (!['pass', 'fail'].includes(facts.audit_verdict)) errors.push("audit_verdict must be pass or fail from the published audit summary");
  return { ok: errors.length === 0, legacy: false, errors };
}
