import assert from "node:assert/strict";
import { buildStageEndReportFacts, renderStageEndReport } from "../../../../../runtime/stage/stage-end-report.mjs";

const marker = "`x".repeat(150_000);
const facts = buildStageEndReportFacts({
  chainRows: [],
  stageResult: {},
  evidenceIndex: [],
  declared: { limits: [marker] },
});
const rendered = renderStageEndReport(facts);
assert.ok(rendered.includes("## 没做到"));
assert.ok(rendered.includes("## 覆盖限制"));
console.log("T007_LONG_BACKTICK_RENDERED");
