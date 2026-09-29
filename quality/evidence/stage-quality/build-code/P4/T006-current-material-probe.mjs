import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildPostAcceptanceChainRows } from "../../../../../runtime/stage/stage-runner.mjs";

const root = "specs/workflowhub-thin-core-card-04-20260919";
const spec = readFileSync(`${root}/spec.md`, "utf8");
const decisionLog = readFileSync(`${root}/decision-log.md`, "utf8");
const rows = buildPostAcceptanceChainRows({
  rows: [
    { acceptance_criterion_id: "AC-29", coverage_limits: "", task_ids: ["T017"] },
    { acceptance_criterion_id: "AC-18", coverage_limits: "", task_ids: ["T006"] },
  ],
  spec,
  decisionLog,
  boundEvidenceRefs: [],
  materialRevision: "probe-only",
  snapshotTree: "a".repeat(40),
  taskId: "workflowhub-thin-core-card-04-20260919",
  tests: null,
});
const [ac29, ac18] = rows;
assert.deepEqual(ac29.source_ids, ["U-006-01", "U-006-02", "U-006-03", "U-006-04", "U-006-05", "U-006-06"]);
assert.match(ac29.coverage_limits, /R-010.*R-018.*未写入 source_ids/);
assert.deepEqual(ac18.source_ids, []);
assert.match(ac18.coverage_limits, /未得到可认证原始来源 ID/);
console.log(JSON.stringify({
  ac29_source_ids: ac29.source_ids,
  ac29_unmapped_disclosed: true,
  ac18_source_ids: ac18.source_ids,
  ac18_gap_disclosed: true,
}));
