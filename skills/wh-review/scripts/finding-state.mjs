import { createHash } from "node:crypto";

const SEVERITY_RANK = { minor: 1, important: 2, blocking: 3 };
const sha = (value) => createHash("sha256").update(value).digest("hex");

function clone(value) { return structuredClone(value); }
function nonEmpty(value) { return typeof value === "string" && value.trim().length > 0; }
function safeRelativePath(value) { return nonEmpty(value) && !value.includes("\\") && !value.startsWith("/") && !value.split("/").some((part) => !part || part === "." || part === ".."); }
export function isBlocking(finding, contractHardIds = []) {
  // A late finding is explicitly capped at minor. Its original hard-rule id
  // remains useful provenance, but must not recreate a blocking gate.
  if (finding?.late_finding === true) return false;
  const hardIds = contractHardIds instanceof Set ? contractHardIds : new Set(contractHardIds);
  return finding?.severity === "blocking" || hardIds.has(finding?.rule_id);
}

/**
 * After a blocking finding has survived two rounds, a free-form assertion is
 * not closure evidence. The bundle is intentionally tied to host-derived
 * delta bytes and current file hashes; it contains no provider paths or ids.
 */
export function validateClosureBundle({ finding, closure, delta, contractHardIds = [] } = {}) {
  if (!isBlocking(finding, contractHardIds) || Number(finding?.blocking_streak ?? 0) < 2) return { valid: true, reason: null };
  const bundle = closure?.closure_bundle;
  if (!bundle || typeof bundle !== "object" || Array.isArray(bundle)) return { valid: false, reason: "CLOSURE_BUNDLE_REQUIRED" };
  const allowed = new Set(["version", "root_cause", "scanned_scope", "counterexample_matrix", "closure_checklist", "anchors", "current_delta"]);
  if (Object.keys(bundle).some((key) => !allowed.has(key)) || bundle.version !== 1 || !nonEmpty(bundle.root_cause)
    || !Array.isArray(bundle.scanned_scope) || bundle.scanned_scope.length === 0 || !bundle.scanned_scope.every(safeRelativePath)
    || !Array.isArray(bundle.counterexample_matrix) || bundle.counterexample_matrix.length === 0
    || !bundle.counterexample_matrix.every((item) => item && typeof item === "object" && Object.keys(item).length === 3 && nonEmpty(item.case_id) && nonEmpty(item.expected) && nonEmpty(item.observed))
    || !Array.isArray(bundle.closure_checklist) || bundle.closure_checklist.length === 0
    || !bundle.closure_checklist.every((item) => item && typeof item === "object" && Object.keys(item).length === 2 && nonEmpty(item.item) && nonEmpty(item.evidence))
    || !Array.isArray(bundle.anchors) || bundle.anchors.length === 0
    || !bundle.current_delta || typeof bundle.current_delta !== "object" || Array.isArray(bundle.current_delta)) return { valid: false, reason: "CLOSURE_BUNDLE_INVALID" };
  const currentFiles = (delta?.changed_files ?? []).filter((item) => safeRelativePath(item?.path) && /^[a-f0-9]{64}$/.test(item?.sha256 ?? "")).map(({ path, sha256 }) => ({ path, sha256 })).sort((left, right) => left.path.localeCompare(right.path));
  const expectedDiffHash = typeof delta?.unified_diff === "string" ? sha(delta.unified_diff) : null;
  const declaredFiles = Array.isArray(bundle.current_delta.changed_files) ? bundle.current_delta.changed_files.map((item) => ({ path: item?.path, sha256: item?.sha256 })).sort((left, right) => String(left.path).localeCompare(String(right.path))) : null;
  if (Object.keys(bundle.current_delta).some((key) => key !== "diff_sha256" && key !== "changed_files") || bundle.current_delta.diff_sha256 !== expectedDiffHash
    || JSON.stringify(declaredFiles) !== JSON.stringify(currentFiles)) return { valid: false, reason: "CLOSURE_BUNDLE_DELTA_MISMATCH" };
  const filesByPath = new Map(currentFiles.map((item) => [item.path, item.sha256])); const seen = new Set();
  for (const anchor of bundle.anchors) {
    if (!anchor || typeof anchor !== "object" || Object.keys(anchor).length !== 3 || !safeRelativePath(anchor.file) || !Number.isSafeInteger(anchor.line) || anchor.line < 1 || !/^[a-f0-9]{64}$/.test(anchor.sha256 ?? "")
      || filesByPath.get(anchor.file) !== anchor.sha256 || !bundle.scanned_scope.includes(anchor.file) || seen.has(`${anchor.file}:${anchor.line}:${anchor.sha256}`)) return { valid: false, reason: "CLOSURE_BUNDLE_ANCHOR_MISMATCH" };
    seen.add(`${anchor.file}:${anchor.line}:${anchor.sha256}`);
  }
  return { valid: true, reason: null };
}

/**
 * Reconcile provider findings with the previous round's closure state.
 * The function is deliberately pure: callers persist its result in the
 * private round receipt and may decide how to expose the projection.
 */
export function reconcileFindingState({ previousFindings = [], currentFindings = [], closureEvidence = [], unverifiedClosureFindingIds = new Set(), businessRound = 1, introducedBlockingIds = new Set(), previouslyImpossibleIds = new Set(), contractHardIds = [] } = {}) {
  const previous = new Map(previousFindings.map((item) => [item.finding_id, item]));
  const closure = new Map(closureEvidence.map((item) => [item.finding_id, item]));
  const output = [];
  for (const old of previous.values()) {
    const evidence = closure.get(old.finding_id);
    if (evidence && !unverifiedClosureFindingIds.has(old.finding_id)) {
      output.push({ ...clone(old), status: "closed", blocking_streak: 0, closure_evidence: evidence.evidence });
      continue;
    }
    const wasBlocking = isBlocking(old, contractHardIds);
    const streak = wasBlocking ? Math.max(1, Number.isInteger(old.blocking_streak) ? old.blocking_streak + 1 : 2) : 0;
    output.push({ ...clone(old), status: "open", blocking_streak: streak });
  }
  for (const candidate of currentFindings) {
    if (previous.has(candidate.finding_id)) continue;
    const item = clone(candidate); item.status = "open";
    if (isBlocking(item, contractHardIds) && (!introducedBlockingIds.has(item.finding_id) || !previouslyImpossibleIds.has(item.finding_id))) {
      item.severity = "minor"; item.late_finding = true;
    }
    item.blocking_streak = isBlocking(item, contractHardIds) ? 1 : 0;
    output.push(item);
  }
  const openBlocking = output.filter((item) => item.status === "open" && isBlocking(item, contractHardIds));
  return {
    findings: output,
    open_blocking: openBlocking,
    requires_closure_bundle: openBlocking.some((item) => item.blocking_streak >= 2),
    escalate_to_human: businessRound >= 3 && openBlocking.some((item) => item.blocking_streak >= 3),
  };
}

export function mergeCrossStageCarryovers(previous = [], current = []) {
  const merged = new Map();
  for (const item of previous) merged.set(item.carryover_id, clone(item));
  for (const item of current) {
    if (!item?.carryover_id) throw new Error("carryover_id is required");
    merged.set(item.carryover_id, clone(item));
  }
  return [...merged.values()];
}

export function aggregateMakeDecisionTracks({ direction, detail } = {}) {
  const tracks = { direction, detail };
  const findings = [];
  const byId = new Map();
  for (const [track, result] of Object.entries(tracks)) {
    for (const finding of result?.merged_findings ?? []) {
      const item = byId.get(finding.finding_id);
      const evidence = { track, evidence: finding.evidence };
      if (!item) { byId.set(finding.finding_id, { ...clone(finding), evidence_by_track: [evidence] }); continue; }
      item.evidence_by_track.push(evidence);
      if ((SEVERITY_RANK[finding.severity] ?? 0) > (SEVERITY_RANK[item.severity] ?? 0)) item.severity = finding.severity;
    }
  }
  findings.push(...byId.values());
  const directionVerdict = direction?.semantic_verdict ?? null;
  const detailVerdict = detail?.semantic_verdict ?? null;
  const directionHard = (direction?.hard_gates ?? []).length > 0;
  const conflict = directionVerdict && detailVerdict && directionVerdict !== detailVerdict;
  let semantic_verdict;
  if (directionHard || directionVerdict === "revise_required") semantic_verdict = "revise_required";
  else if (conflict || directionVerdict === "escalate_to_human" || detailVerdict === "escalate_to_human") semantic_verdict = "escalate_to_human";
  else if (detailVerdict === "revise_required") semantic_verdict = "revise_required";
  else semantic_verdict = directionVerdict ?? detailVerdict ?? null;
  return { semantic_verdict, needs_human: semantic_verdict === "escalate_to_human", findings };
}
