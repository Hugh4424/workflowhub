const SEVERITY_RANK = { minor: 1, important: 2, blocking: 3 };

function clone(value) { return structuredClone(value); }
function isBlocking(finding) {
  // A late finding is explicitly capped at minor. Its original hard-rule id
  // remains useful provenance, but must not recreate a blocking gate.
  if (finding?.late_finding === true) return false;
  return finding?.severity === "blocking" || /^H[1-9][0-9]*$/.test(finding?.rule_id ?? "") || /^(?:DIR|DET)-H[1-9][0-9]*$/.test(finding?.rule_id ?? "");
}

/**
 * Reconcile provider findings with the previous round's closure state.
 * The function is deliberately pure: callers persist its result in the
 * private round receipt and may decide how to expose the projection.
 */
export function reconcileFindingState({ previousFindings = [], currentFindings = [], closureEvidence = [], businessRound = 1, introducedBlockingIds = new Set(), previouslyImpossibleIds = new Set() } = {}) {
  const previous = new Map(previousFindings.map((item) => [item.finding_id, item]));
  const closure = new Map(closureEvidence.map((item) => [item.finding_id, item]));
  const output = [];
  for (const old of previous.values()) {
    const evidence = closure.get(old.finding_id);
    if (evidence) {
      output.push({ ...clone(old), status: "closed", blocking_streak: 0, closure_evidence: evidence.evidence });
      continue;
    }
    const wasBlocking = isBlocking(old);
    const streak = wasBlocking ? Math.max(1, Number.isInteger(old.blocking_streak) ? old.blocking_streak + 1 : 2) : 0;
    output.push({ ...clone(old), status: "open", blocking_streak: streak });
  }
  for (const candidate of currentFindings) {
    if (previous.has(candidate.finding_id)) continue;
    const item = clone(candidate); item.status = "open";
    if (isBlocking(item) && !introducedBlockingIds.has(item.finding_id) && !previouslyImpossibleIds.has(item.finding_id)) {
      item.severity = "minor"; item.late_finding = true;
    }
    item.blocking_streak = isBlocking(item) ? 1 : 0;
    output.push(item);
  }
  const openBlocking = output.filter((item) => item.status === "open" && isBlocking(item));
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
