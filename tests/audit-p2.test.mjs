import { describe, expect, it } from "vitest";
import { createCanonicalSource, createSourceManifest } from "../runtime/evidence/canonical-source.mjs";
import { createRequirementLedger, createRequirementsCoverage } from "../runtime/evidence/requirement-ledger.mjs";
import { buildAuditSummaryFromJournalEvents } from "../core/audit-aggregator.mjs";

const hash = (letter) => letter.repeat(64);
const ref = (kind, id, content_hash = hash("a")) => ({ kind, uri_or_path: `evidence://${kind}/${id}`, content_hash });

function sourceManifest() {
  const source = createCanonicalSource({ source_type: "offline_fixture", source_id: "p2", revision: "r1", requirements: ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9", "R10"] });
  const atoms = Array.from({ length: 10 }, (_, index) => ({
    requirement_id: `R${index + 1}`, text: `requirement ${index + 1}`, owner: "product", authority: "user", derived_from: index ? [`R${index}`] : [], supersedes: [], status: index === 9 ? "withdrawn" : "accepted", stale: false,
  }));
  const result = createSourceManifest({ canonical_source: source, atoms });
  expect(result.ok).toBe(true);
  return result.manifest;
}

function ledger() {
  const manifest = sourceManifest();
  const mappings = Object.fromEntries(manifest.atoms.map((atom) => [atom.requirement_id, {
    decision_ref: ref("decision", atom.requirement_id, hash("b")),
    artifact_refs: atom.status === "accepted" ? [ref("artifact", atom.requirement_id, hash("c"))] : [],
    acceptance_criteria_refs: atom.status === "accepted" ? [ref("ac", atom.requirement_id, hash("d"))] : [],
  }]));
  const result = createRequirementLedger({ source_manifest: manifest, mappings });
  expect(result.ok).toBe(true);
  return result.ledger;
}

function manifest() { return { schema_version: "2.0.0", stage_slug: "build-code", manifest_hash: hash("e"), steps: [{ step_id: 1, order: 1, attempt_id: "a1", depends_on: [] }, { step_id: 2, order: 2, attempt_id: "a2", depends_on: [1] }] }; }
function events() {
  return [
    { event_type: "step_entry", workflow_run_id: "run", stage_slug: "build-code", step_id: 1, attempt_id: "a1", timestamp: "2026-07-13T00:00:00Z", journal_entry_id: "entry-1", entry_evidence: ref("log", "entry-1") },
    { event_type: "step_exit", workflow_run_id: "run", stage_slug: "build-code", step_id: 1, attempt_id: "a1", timestamp: "2026-07-13T00:01:00Z", entry_journal_entry_id: "entry-1", terminal_status: "success", completion_evidence: ref("log", "exit-1") },
    { event_type: "step_entry", workflow_run_id: "run", stage_slug: "build-code", step_id: 2, attempt_id: "a2", timestamp: "2026-07-13T00:02:00Z", journal_entry_id: "entry-2", entry_evidence: ref("log", "entry-2") },
    { event_type: "step_exit", workflow_run_id: "run", stage_slug: "build-code", step_id: 2, attempt_id: "a2", timestamp: "2026-07-13T00:03:00Z", entry_journal_entry_id: "entry-2", terminal_status: "success", completion_evidence: ref("log", "exit-2") },
  ];
}

describe("P2 source lineage and audit aggregation", () => {
  it("builds a deterministic source manifest, R1-R9 ledger coverage, and passing summary", () => {
    const first = sourceManifest(); const second = sourceManifest(); const currentLedger = ledger();
    expect(first).toEqual(second);
    expect(createRequirementsCoverage(currentLedger)).toMatchObject({ covered: 9, total: 9, withdrawn: 1, missing_ids: [] });
    expect(buildAuditSummaryFromJournalEvents(events(), "build-code", "run", { manifest: manifest(), ledger: currentLedger }).audit_summary).toMatchObject({ verdict: "pass", requirement_coverage: { covered: 9, total: 9, withdrawn: 1 } });
  });

  it("fails closed without the authority inputs; observed receipts never become topology or coverage", () => {
    const summary = buildAuditSummaryFromJournalEvents(events(), "build-code", "run", {}).audit_summary;
    expect(summary.verdict).toBe("fail");
    expect(summary.expected_steps).toEqual([]);
    expect(summary.requirement_coverage).toMatchObject({ covered: 0, total: 0 });
    expect(summary.facts.unknown.map((item) => item.type)).toEqual(expect.arrayContaining(["MANIFEST_REQUIRED", "LEDGER_REQUIRED_OR_INVALID"]));
  });

  it.each([
    ["skipped", (items) => { items[3].terminal_status = "skipped"; items[3].skip_reason = "not applicable"; }],
    ["blocked", (items) => { items[3].terminal_status = "blocked"; }],
    ["retry", (items) => { items[2].retry_of_attempt_id = "a1"; }],
    ["cross attempt", (items) => { items[3].entry_journal_entry_id = "entry-1"; }],
    ["dependency", (items) => { [items[0], items[1], items[2], items[3]] = [items[2], items[3], items[0], items[1]]; }],
  ])("fails closed on %s facts", (_label, mutate) => {
    const input = events(); mutate(input);
    expect(buildAuditSummaryFromJournalEvents(input, "build-code", "run", { manifest: manifest(), ledger: ledger() }).audit_summary.verdict).toBe("fail");
  });
});
