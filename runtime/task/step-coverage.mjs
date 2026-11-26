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
import { lstatSync } from "node:fs";
import { join } from "node:path";

// Record-model boundary exclusion (explicit and auditable, never a silent skip).
//
// A stage can be declared by the complex route while the task's facts carry no
// stage row for it, because stage rows exist only after this record model was
// introduced. When that stage's own declared outputs are still readable in the
// material root and a later declared stage really ran (so the outputs were
// consumed downstream), its steps are a record-model boundary, not current
// missing steps. Four conditions must ALL hold before a stage is excluded:
//   1. the stage is in `declared_stages` but has no row in `actual_stages`
//      (no stage fact at all);
//   2. at least one later declared stage is actual (downstream work happened);
//   3. every row of that stage is `unavailable` (no contrary quality fact);
//   4. every declared output below is a readable non-empty file under the
//      report's material root.
// "该跑没跑" stays red: a stage that is last, whose downstream never ran, that
// carries any `completed`/`incomplete` row, or whose outputs are missing is
// never excluded. The exclusion, its owner and its conditions are reported in
// `excluded_steps`/`excluded_stages`; the rows themselves stay in
// `workflow_steps`, so nothing disappears from the report.
const STAGE_RECORD_MODEL_OUTPUTS = Object.freeze({
  "build-plan": Object.freeze(["spec.md", "phases/index.md"]),
});
const RECORD_MODEL_EXCLUSION_OWNER = "记录模型 owner（stage 行引入前的历史任务）";
const RECORD_MODEL_EXCLUSION_REASON = "阶段在复杂路线被声明，但任务 facts 没有它的 stage 行（记录模型历史边界）；其声明产出仍可读且下游阶段真实发生；该阶段所有步无相反质量事实。不是当前缺步。";
const stageOfSource = source => /^workflows\/([^/]+)\/steps\.json$/.exec(String(source ?? ""))?.[1] ?? null;

function recordModelExcluded(report) {
  const metrics = report?.workflow_metrics;
  const declared = Array.isArray(metrics?.declared_stages) ? metrics.declared_stages : [];
  const actual = new Set((Array.isArray(metrics?.actual_stages) ? metrics.actual_stages : [])
    .map(row => (row && typeof row === "object" ? row.stage : row))
    .filter(stage => typeof stage === "string" && stage));
  const root = typeof report?.material_root === "string" ? report.material_root : null;
  if (!root || declared.length === 0) return new Map();
  const rowsByStage = new Map();
  for (const row of Array.isArray(report.workflow_steps) ? report.workflow_steps : []) {
    if (!row || typeof row.stage !== "string" || !row.stage) continue;
    if (!rowsByStage.has(row.stage)) rowsByStage.set(row.stage, []);
    rowsByStage.get(row.stage).push(row);
  }
  const excluded = new Map();
  declared.forEach((stage, index) => {
    const outputs = STAGE_RECORD_MODEL_OUTPUTS[stage];
    if (!outputs || actual.has(stage)) return;                                  // 1
    const downstream = declared.slice(index + 1).filter(name => actual.has(name));
    if (downstream.length === 0) return;                                        // 2
    const rows = rowsByStage.get(stage) ?? [];
    if (rows.length === 0 || rows.some(row => row.state !== "unavailable")) return; // 3
    const readable = outputs.filter(path => {
      try { const stat = lstatSync(join(root, path)); return stat.isFile() && stat.size > 0; } catch { return false; }
    });
    if (readable.length !== outputs.length) return;                             // 4
    excluded.set(stage, {
      stage, outputs: readable, downstream, rows,
      owner: RECORD_MODEL_EXCLUSION_OWNER,
      reason: RECORD_MODEL_EXCLUSION_REASON,
      conditions: [
        "declared_stages 含该阶段且 actual_stages 不含（无 stage 行）",
        `下游已声明阶段实际发生：${downstream.join("、")}`,
        "该阶段全部步 state=unavailable（无相反质量事实）",
        `声明产出在 material_root 下可读：${readable.join("、")}`,
        "若「该跑没跑」、下游未发生、出现非 unavailable 行或产出缺失，则不排除，仍按缺失红",
      ],
    });
  });
  return excluded;
}

// Apply the same exclusion to the report's coverage metrics so a caller that
// prints `workflow_metrics` shows the reduced denominator. Pure projection: the
// report rows and the excluded-set decision stay the single implementation
// above; this never rewrites evidence or declares a step completed.
export function applyRecordModelExclusions(report) {
  const excluded = recordModelExcluded(report);
  if (excluded.size === 0 || !report?.workflow_metrics || typeof report.workflow_metrics !== "object") return report;
  const metrics = report.workflow_metrics;
  const keep = row => !excluded.has(stageOfSource(row?.source));
  for (const key of ["declared_steps", "applicable_steps", "attested_steps"]) {
    if (Array.isArray(metrics[key])) metrics[key] = metrics[key].filter(keep);
  }
  const dropped = [...excluded.values()]
    .reduce((sum, entry) => sum + entry.rows.filter(row => row.state !== "not_applicable").length, 0);
  if (Number.isInteger(metrics.step_attestation_denominator)) {
    metrics.step_attestation_denominator = Math.max(0, metrics.step_attestation_denominator - dropped);
    const numerator = Number.isInteger(metrics.step_attestation_numerator) ? metrics.step_attestation_numerator : 0;
    metrics.step_attestation_coverage = metrics.step_attestation_denominator
      ? numerator / metrics.step_attestation_denominator : null;
  }
  metrics.excluded_stages = [...excluded.keys()];
  metrics.excluded_step_count = dropped;
  return report;
}

export function declaredStepCoverage(report, { failClosed = false } = {}) {
  if (!Array.isArray(report?.workflow_steps)) throw new TypeError("workflow_steps report is required");
  const stages = new Map();
  const definition_unavailable = [];
  const declared = [];
  const excluded = recordModelExcluded(report);
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
    // A record-model boundary stage keeps its rows visible in workflow_steps
    // and in excluded_steps, but never in the missing-step set or denominator.
    if (excluded.has(row.stage)) continue;
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
    ...(excluded.size ? {
      excluded_steps: [...excluded.values()].flatMap(entry => entry.rows.map(row => ({
        source: row.source, step_slug: row.step_slug, stage: entry.stage, reason: entry.reason, owner: entry.owner,
      }))),
      excluded_stages: [...excluded.values()].map(entry => ({
        stage: entry.stage, steps: entry.rows.length, outputs: entry.outputs,
        downstream: entry.downstream, conditions: entry.conditions, reason: entry.reason, owner: entry.owner,
      })),
    } : {}),
    ...(definition_unavailable.length ? {
      definition_unavailable: {
        stages: definition_unavailable,
        summary: `${definition_unavailable.length} 个阶段未判定：读不到步骤定义`,
      },
    } : {}),
  };
}
