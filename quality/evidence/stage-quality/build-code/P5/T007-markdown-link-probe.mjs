import assert from "node:assert/strict";
import MarkdownIt from "markdown-it";
import { buildStageEndReportFacts, renderStageEndReport } from "../../../../../runtime/stage/stage-end-report.mjs";

const input = "[review](https://example.test/link) ![pixel](https://example.test/pixel)";
const facts = buildStageEndReportFacts({
  chainRows: [],
  stageResult: { quality_missing: [input], quality_status: "incomplete" },
});
const before = JSON.stringify(facts);
const markdown = renderStageEndReport(facts);
assert.equal(JSON.stringify(facts), before, "render must not mutate facts");
assert.ok(markdown.includes("review") && markdown.includes("pixel"), "visible labels remain readable");
const modes = [false, true].map((html) => {
  const rendered = new MarkdownIt({ html }).render(markdown);
  const links = (rendered.match(/<a\b/g) ?? []).length;
  const images = (rendered.match(/<img\b/g) ?? []).length;
  return { html, links, images };
});
console.log(JSON.stringify({ markdown_it: "14.1.0", modes, facts_unchanged: true }));
for (const mode of modes) {
  assert.equal(mode.links, 0, `html=${mode.html}: caller link must remain inert`);
  assert.equal(mode.images, 0, `html=${mode.html}: caller image must remain inert`);
}
