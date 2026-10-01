import { describe, expect, it } from "vitest";
import { buildPostAcceptanceChainRows } from "../../runtime/stage/stage-runner.mjs";
import { deriveDecisionLogOriginalSourceCensus } from "../../runtime/stage/stage-content-contracts.mjs";

// Explicit constructed unit materials, never a claim about current Task sources.
const decisionLog = `## 需求变更记录
### U-001
> Preserve an authentic source edge.
## 原始需求索引
| R-001 | U-001 | D-001 |
| R-002 | U-999 | D-001 |
## 逐字声明层（verbatim）
| V-001 | 用户 | unit | unrelated unindexed quotation |
## 决定
### D-001
Accepted constructed choice.
`;
const spec = `## 来源与决策映射
| 来源 | 决策 | FR | AC |
| --- | --- | --- | --- |
| R-001 | D-001 | FR-001 | AC-001 |
| R-002 | D-001 | FR-002 | AC-002 |
`;
const project = (log = decisionLog) => buildPostAcceptanceChainRows({
  rows: [{ acceptance_criterion_id: "AC-001" }, { acceptance_criterion_id: "AC-002" }],
  spec, decisionLog: log, boundEvidenceRefs: [], materialRevision: "unit", snapshotTree: "a".repeat(40), taskId: "unit", tests: null,
});
describe("CARD-03 local source defects do not erase unrelated trace edges", () => {
  it("keeps a present original source while retaining whole-census errors", () => {
    const census = deriveDecisionLogOriginalSourceCensus(decisionLog);
    expect(census.errors).toContain("verbatim source is absent from R index: V-001");
    expect(census.errors).toContain("R index row cites absent U/V source: R-002 -> U-999");
    const rows = project();
    expect(rows[0].source_ids).toEqual(["U-001"]);
    expect(rows[1].source_ids).toEqual([]);
    expect(rows[1].coverage_limits).toContain("没有可认证 U/V 边");
  });
  it("does not let an invalid duplicate decision row disappear before ambiguity detection", () => {
    const log = decisionLog.replace("## 逐字声明层", "| R-001 | U-001 | bogus |\n## 逐字声明层");
    expect(deriveDecisionLogOriginalSourceCensus(log).errors).toContain("duplicate R requirement index row: R-001");
    expect(project(log)[0].source_ids).toEqual([]);
  });
  it("rejects ambiguous duplicate index edges instead of selecting the last row", () => {
    const log = decisionLog.replace("## 逐字声明层", "| R-001 | U-001 | D-001 |\n## 逐字声明层");
    expect(project(log)[0].source_ids).toEqual([]);
  });
});
