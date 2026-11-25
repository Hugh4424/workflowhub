// Shared report projection for declared-step coverage.
//
// Owner: build-code stage gate (P9/T059). Consumer: tools/cli/run-checks.mjs
// (report face) and core/task-close.mjs (close face). This module is the single
// implementation of the declared-step decision; the CLI and core only adapt
// their inputs. It adds no persistent state and no second evidence ledger.
//
// A step is "declared" exactly when its report row carries a non-empty `skill`
// string. That is the same declaration the producer reads, so a table copied
// without `skill` cannot silently shrink the gate. Steps with no report row are
// not in this report and are therefore not in the denominator (not applicable),
// and an unreadable definition row stays outside the missing-step set while
// being reported as `definition_unavailable`/`evaluable:false`.
export function declaredStepCoverage(report, { failClosed = false } = {}) {
  if (!Array.isArray(report?.workflow_steps)) throw new TypeError("workflow_steps report is required");
  const stages = new Map();
  const definition_unavailable = [];
  const declared = [];
  for (const row of report.workflow_steps) {
    if (!row || typeof row.stage !== "string" || !row.stage || typeof row.source !== "string"
        || typeof row.step_slug !== "string" || typeof row.state !== "string") {
      throw new TypeError("workflow step identity/state is required");
    }
    // A definition failure is not a declared step. The final-chain runner keeps
    // its <definition-unavailable> sentinel outside the evaluated denominator,
    // so it must not be reported here as a missing (or unattested) step. Its
    // stage stays visible as undetermined, never as clean coverage.
    if (row.definition_status === "unreadable") {
      if (!definition_unavailable.includes(row.stage)) definition_unavailable.push(row.stage);
      continue;
    }
    if (!stages.has(row.stage)) stages.set(row.stage, []);
    stages.get(row.stage).push(row);
    if (typeof row.skill === "string" && row.skill.trim()) declared.push(row);
  }
  const missing_steps = [], steps_unattested = [];
  for (const [stage, rows] of stages) {
    const attested = rows.some(row => row.state === "completed" || row.state === "not_applicable");
    if (!attested) {
      steps_unattested.push({ stage, declared_steps: rows.length });
    }
    for (const { source, step_slug, state } of rows) {
      if (state !== "completed" && state !== "not_applicable") missing_steps.push({ source, step_slug, state });
    }
  }
  const declaredMissing = declared.filter(row => row.state !== "completed" && row.state !== "not_applicable")
    .map(({ source, step_slug, state, skill }) => ({ source, step_slug, state, skill }));
  // S4 keeps its pre-existing named make-decision evidence gap as a failing
  // condition even when that row declares no skill; ordinary undeclared steps
  // stay report-only. Declared-step gaps are added on top of it, never instead
  // of it. `named_evidence_gap` tells a consumer which cause produced exit 1, so
  // a close rejection is not misreported as a declared-step failure.
  const namedEvidenceGap = (stages.get('make-decision') ?? []).some((row) =>
    row.state === 'incomplete' && Array.isArray(row.basis)
    && row.basis.some(item => item && item.conclusion === 'incomplete'));
  const evaluable = definition_unavailable.length === 0;
  const blocked = namedEvidenceGap || declaredMissing.length > 0 || (failClosed && definition_unavailable.length > 0);
  return {
    exit_code: blocked ? 1 : 0, missing_steps, steps_unattested, declared: declaredMissing, evaluable,
    named_evidence_gap: namedEvidenceGap,
    ...(definition_unavailable.length ? {
      definition_unavailable: {
        stages: definition_unavailable,
        summary: `${definition_unavailable.length} 个阶段未判定：读不到步骤定义`,
      },
    } : {}),
  };
}
