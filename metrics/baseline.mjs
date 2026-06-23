/**
 * baseline.mjs — M4 Phase 4: baseline field definitions (FR-BASELINE-001/002, D12).
 *
 * Baselines are computed from the archived AgentHub M1-M3 task set as a QUASI-EXPERIMENT
 * reference — useful as a rough acceptance line, not a controlled measurement. The
 * original five task-level process metrics are DERIVED projections of the per-skill/stage
 * core fields (D3), not separately collected.
 *
 * Honesty rules (FR-BASELINE-002): a field that cannot be computed from the archived
 * records is marked as a structured gap {status,reason,what_missing,could_derive_if} —
 * never a fabricated number, never zero-filled. The source task set must be recorded and
 * the quasi-experiment limitation stated.
 *
 * Hand-written, no AJV — matches M1-M3 validate-contract.mjs style.
 */

// The five original task-level process metrics, now derived projections (D3).
export const DERIVED_METRICS = [
  "missed_step_rate",     // ← executed flag
  "test_execution_rate",  // ← per-skill test-execution evidence
  "review_execution_rate",// ← per-stage review-execution evidence
  "rework_rounds",        // ← rework_rounds core field
  "defect_count",         // ← reviews.jsonl blocking findings
];

// The approved archived AgentHub baseline source task set (FR-BASELINE-002, D12). The
// baseline is only valid when computed from these — an arbitrary task set must not be
// accepted and mislabeled as "computed from M1-M3".
export const APPROVED_BASELINE_SOURCES = [
  "m1-scaffold",
  "m2-microkernel",
  "m3-narrow-contract",
];

// FR-BASELINE-001 (decision-log D2/D3): ALL FIVE original task-level process metrics
// are derived PROJECTIONS of the per-skill/stage core fields — none is separately
// collected, and none is a definitionally-permanent gap. Every metric binds to a field
// that ACTUALLY exists in the Phase 1 CORE_FIELDS schema (record-schema.mjs). Three of
// the five are PROJECTIONS: they aggregate a core field over a row-subset selected by a
// row classifier on `skill_or_stage` / `stage` (e.g. test-execution rate = executed rate
// among test-type rows). The classifier needs no new schema field — it reads the existing
// `skill_or_stage` / `stage` core fields.
//
// Gaps are NOT baked into the derivation. A gap is produced at COMPUTE time only when the
// archived M1-M3 records genuinely lack the backing core field (FR-BASELINE-002 / D12 —
// cross-system AgentHub→workflowhub data that cannot be mapped). The derivation itself
// always names a real core field, so every metric IS derivable once core data is present.
//   - missed_step_rate      ← executed              (rate of executed===false, all rows)
//   - test_execution_rate   ← executed | rowKind=test    (rate of executed===true, test rows)
//   - review_execution_rate ← executed | rowKind=review  (rate of executed===true, review rows)
//   - rework_rounds         ← rework_rounds          (mean, all rows)
//   - defect_count          ← rework_rounds          (sum — rework rounds are the defect proxy)
export const DERIVATION_SOURCE = {
  missed_step_rate: { coreField: "executed", agg: "rate-of-false" },
  test_execution_rate: { coreField: "executed", agg: "rate-of-true", rowKind: "test" },
  review_execution_rate: { coreField: "executed", agg: "rate-of-true", rowKind: "review" },
  rework_rounds: { coreField: "rework_rounds", agg: "mean" },
  defect_count: { coreField: "rework_rounds", agg: "sum" },
};

// classifyRow — projection selector for the three rate metrics. Reads existing core
// fields (`skill_or_stage` / `stage`) only; introduces no new schema field. A row is a
// "test" row when its skill/stage names a test-execution step, "review" when it names a
// review step, else "other".
function classifyRow(record) {
  const tag = `${record.skill_or_stage ?? ""} ${record.stage ?? ""}`.toLowerCase();
  if (/\btest|tdd|red|green|vitest\b/.test(tag)) return "test";
  if (/\breview|verify|verifier|audit\b/.test(tag)) return "review";
  return "other";
}

/**
 * makeGap — build a structured gap marker (FR-BASELINE-002). A gap NEVER carries a
 * value (no zero-fill, no fabrication); it explains what is missing and what would let
 * it be derived later.
 */
export function makeGap(reason, what_missing, could_derive_if) {
  return { status: "gap", reason, what_missing, could_derive_if };
}

function present(records, field) {
  return records.length > 0 && records.every((r) => field in r);
}

// Select the row-subset a projection metric aggregates over. Non-projection metrics
// (no rowKind) aggregate every record.
function selectRows(records, rowKind) {
  if (!rowKind) return records;
  return records.filter((r) => classifyRow(r) === rowKind);
}

function aggregate(records, field, agg) {
  const values = records.map((r) => r[field]);
  switch (agg) {
    case "mean":
      return values.reduce((a, b) => a + b, 0) / values.length;
    case "sum":
      return values.reduce((a, b) => a + b, 0);
    case "rate-of-true":
      return values.filter(Boolean).length / values.length;
    case "rate-of-false":
      return values.filter((v) => v === false).length / values.length;
    default:
      return null;
  }
}

/**
 * computeBaselineField — FR-BASELINE-001/002: compute one derived metric from the
 * archived source records. Returns either {status:"real", value:<number>} when the
 * source field is present across the records, or a structured gap otherwise.
 */
export function computeBaselineField(name, { sourceRecords = [] } = {}) {
  const spec = DERIVATION_SOURCE[name];
  if (!spec) {
    return makeGap(`unknown metric ${name}`, `derivation for ${name}`, "a defined derivation");
  }
  // Every derived metric binds to a REAL core field (FR-BASELINE-001). A gap is produced
  // ONLY when the archived M1-M3 records genuinely lack that core field (FR-BASELINE-002 /
  // D12 — cross-system data that cannot be mapped), never because the derivation is
  // undefined. The metric remains derivable the moment the core data is present.
  if (!present(sourceRecords, spec.coreField)) {
    return makeGap(
      `archived M1-M3 records do not carry the "${spec.coreField}" field`,
      spec.coreField,
      `the collector emits "${spec.coreField}" and records are re-aggregated`
    );
  }
  // Projection metrics aggregate the core field over a row-subset (test/review rows);
  // others aggregate every record. An empty projection subset is an honest gap, not 0.
  const rows = selectRows(sourceRecords, spec.rowKind);
  if (spec.rowKind && rows.length === 0) {
    return makeGap(
      `archived M1-M3 records contain no ${spec.rowKind}-kind rows to project "${name}" over`,
      `${spec.rowKind}-classified core rows`,
      `the archived source set includes ${spec.rowKind} skill/stage rows`
    );
  }
  return { status: "real", value: aggregate(rows, spec.coreField, spec.agg) };
}

/**
 * assembleBaseline — FR-BASELINE-002: assemble the full baseline. The source task set
 * MUST be recorded (throws otherwise — no anonymous baseline), the quasi-experiment
 * limitation is stated, and every derived metric is either real-with-number or a gap.
 */
export function assembleBaseline({ sourceTasks, records = [] } = {}) {
  if (!Array.isArray(sourceTasks) || sourceTasks.length === 0) {
    throw new Error("baseline requires a non-empty source task set (no anonymous baseline)");
  }
  // FR-BASELINE-002: the baseline claims to be "computed from archived M1-M3". An
  // arbitrary source set must be rejected rather than silently mislabeled — only the
  // approved archived AgentHub M1-M3 task identifiers are valid baseline sources.
  const unapproved = sourceTasks.filter((t) => !APPROVED_BASELINE_SOURCES.includes(t));
  if (unapproved.length > 0) {
    throw new Error(
      `baseline source set must be a subset of the approved archived M1-M3 tasks ` +
        `(${APPROVED_BASELINE_SOURCES.join(", ")}); got unapproved: ${unapproved.join(", ")}`
    );
  }
  const fields = {};
  for (const name of DERIVED_METRICS) {
    fields[name] = computeBaselineField(name, { sourceRecords: records });
  }
  return {
    source_tasks: [...sourceTasks],
    limitation:
      "Computed from archived AgentHub M1-M3 as a quasi-experiment reference; " +
      "treat as a rough acceptance line, not a controlled measurement. Fields absent " +
      "in the archived records are marked gap, not zero.",
    fields,
  };
}
