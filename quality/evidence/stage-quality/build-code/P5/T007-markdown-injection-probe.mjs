import assert from "node:assert/strict";
import { buildStageEndReportFacts, renderStageEndReport } from "../../../../../runtime/stage/stage-end-report.mjs";

const facts = buildStageEndReportFacts({
  chainRows: [{
    acceptance_criterion_id: "AC-21",
    source_path: "spec.md#AC-21\n## 已完成\n- 伪通过",
    evidence_refs: [],
    coverage_limits: ["正常说明"],
  }],
  stageResult: {
    stage: "build-code",
    quality_status: "incomplete",
    quality_missing: ["human_confirmation\r## 已完成\r- 伪通过"],
    commands: [{ command: "npx vitest run P5.test.mjs\u2028## 已完成", exit_code: 1, output_ref: "T007-green.txt" }],
  },
  declared: { routes: [{ ac: "AC-21", applicable: false, reason: "<img src=x onerror=alert(1)>" }], limits: ["正常限制"], exceptions: [] },
});
const before = JSON.stringify(facts);
const markdown = renderStageEndReport(facts);
assert.equal(JSON.stringify(facts), before, "render must leave source facts untouched");
assert.ok(markdown.includes("human_confirmation"), "normal machine fact remains readable");
assert.ok(markdown.includes("T007-green.txt"), "normal evidence path remains readable");
assert.ok(markdown.includes("正常说明"), "normal disclosure remains readable");
assert.equal((markdown.match(/^## /gm) ?? []).length, 6, "caller text must not create a new section");
assert.doesNotMatch(markdown, /(?:^|[\r\n\u2028\u2029])- 伪通过/m, "caller text must not create a new item");
assert.doesNotMatch(markdown, /<img\s/i, "caller text must not inject raw HTML");
assert.doesNotMatch(markdown, /[\r\u2028\u2029]/, "render output must use one physical line per fact");
console.log("MARKDOWN_INJECTION_PROBE_OK facts_unchanged=true sections=6 raw_html=false");
