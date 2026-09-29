import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { deriveDecisionLogOriginalSourceCensus } from "../../runtime/stage/stage-content-contracts.mjs";
import { buildPostAcceptanceChainRows } from "../../runtime/stage/stage-runner.mjs";

const taskMaterials = "../../specs/workflowhub-thin-core-card-04-20260919/";
const decisionLog = readFileSync(new URL(`${taskMaterials}decision-log.md`, import.meta.url), "utf8");
const spec = readFileSync(new URL(`${taskMaterials}spec.md`, import.meta.url), "utf8");
const expectedSources = Array.from({ length: 6 }, (_, index) => `U-006-${String(index + 1).padStart(2, "0")}`);

describe("post acceptance chain uses the current original-source index", () => {
  it("keeps the six authenticated AC-29 source IDs and discloses an AC without an indexed edge", () => {
    const census = deriveDecisionLogOriginalSourceCensus(decisionLog);
    expect(census.status).toBe("present");
    expect(census.errors).toEqual([]);
    const originalIds = new Set(census.entries.map((entry) => entry.id));
    const r009 = census.index_entries.find((entry) => entry.id === "R-009");
    expect(r009).toBeDefined();
    expect(r009.source_refs.filter((id) => originalIds.has(id))).toEqual(expectedSources);
    expect(spec).toMatch(/\| R-009 \|[^\n]*\| AC-29\.\.AC-34 \|/);

    const output = buildPostAcceptanceChainRows({
      rows: [
        { acceptance_criterion_id: "AC-29", coverage_limits: [] },
        { acceptance_criterion_id: "AC-18", coverage_limits: [] },
      ],
      spec,
      decisionLog,
      boundEvidenceRefs: [],
      materialRevision: "current-material-probe",
      snapshotTree: "t".repeat(40),
      taskId: "workflowhub-thin-core-card-04-20260919",
      tests: null,
    });
    const indexed = output.find((row) => row.acceptance_criterion_id === "AC-29");
    const withoutEdge = output.find((row) => row.acceptance_criterion_id === "AC-18");
    expect(indexed.source_ids).toEqual(expectedSources);
    expect(withoutEdge.source_ids).toEqual([]);
    expect(withoutEdge.coverage_limits.join("\n")).toMatch(/AC-18: 未得到可认证原始来源 ID/);
  });
});
