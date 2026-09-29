import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildStageEndReportFacts, collectStageEndReportFacts } from "../../../../../runtime/stage/stage-end-report.mjs";

const root = mkdtempSync(join(import.meta.dirname, "T007-source-binding-fixture-"));
let direct;
let collected;
try {
  const evidenceDir = join(root, "evidence");
  mkdirSync(evidenceDir);
  writeFileSync(join(evidenceDir, "forged.output"), "Tests 1 passed\n");
  const stageResult = {
    task_id: "forged-task",
    stage: "build-code",
    snapshot_tree: "f".repeat(40),
    quality_status: "passed",
    execution_outcome: "completed",
    commands: [{ command: "npx vitest run tests/forged.test.mjs", exit_code: 0,
      output_ref: "evidence/forged.output" }],
  };
  const stageResultPath = join(root, "stage-result.json");
  writeFileSync(stageResultPath, JSON.stringify(stageResult));
  direct = buildStageEndReportFacts({ stageResult });
  collected = await collectStageEndReportFacts({ stageResultPath, evidenceDir });
} finally { rmSync(root, { recursive: true, force: true }); }

const hasBindingGap = (facts) => facts.not_done.some((entry) =>
  entry.item === "source_binding" && entry.status === "unavailable");
const hasBindingLimit = (facts) => facts.coverage_limits.some((entry) =>
  /来源绑定不可用|canonical receipt/.test(entry.reason));
console.log(JSON.stringify({
  direct_binding_gap: hasBindingGap(direct), direct_binding_limit: hasBindingLimit(direct),
  collected_binding_gap: hasBindingGap(collected), collected_binding_limit: hasBindingLimit(collected),
  collected_exit_zero_candidate: collected.executions.some((entry) => entry.exit_code === 0),
  collected_existing_output_candidate: collected.sources.some((entry) => entry.kind === "execution_output"),
}));
assert.ok(hasBindingGap(direct) && hasBindingLimit(direct), "direct caller stageResult must disclose unavailable source_binding");
assert.ok(hasBindingGap(collected) && hasBindingLimit(collected), "file collector must disclose unavailable source_binding even with existing exit-0 output");
assert.ok(collected.executions.some((entry) => entry.exit_code === 0));
