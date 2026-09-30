import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { deriveAcceptanceExecutionAssertions } from "../../runtime/evidence/canonical-evidence-validators.mjs";
import {
  ACCEPTANCE_CRITERION_ID,
  BASELINE_FAILURES,
  BASELINE_FILES,
  CLAIMED_GREEN_FILES,
  ORACLE_DESCRIBES,
  ORACLE_IDS,
  ORACLE_WHOLE_FILES,
  PRD_ACS,
  ROOT_PROGRESS_FILES,
  RUN_FILES,
  STAGES,
  deriveCard03Entry,
  dispatchSection,
  observeWorkspace,
  summarizeVitestReport,
} from "./card-03-current.mjs";

const cwd = resolve(import.meta.dirname, "../..");

// 目标态观察：全部 ORACLE / 母 PRD 验收第 11–15 条都达成时的形状。
const TARGET_OBSERVATIONS = Object.freeze({
  dispatch_sections_citing_agents: [...STAGES],
  build_code_original_implementer: true,
  g1_method_terms: { build_code: ["G-1", "停并行", "重排", "作废批次"], build_plan: ["G-1"] },
  agents_clauses: ["不整份继承上下文", "不空转轮询", "跨 Phase 不绑定全量快照"],
  root_progress_in_root: [],
  root_progress_archived: [...ROOT_PROGRESS_FILES],
  bundle_count: 39,
  bundle_per_file_sha_paths: [],
  retired_templates_present: [],
  phase_template_fields_missing: [],
  stage_runtime_review_budget: false,
  schema_missing: { result: [], leaf_result: [], status: [] },
  make_decision_material_set: ["decision-log.md"],
  c2_irreversible_rules_present: false,
  threshold_registered: true,
  g1_drill_steps: ["①停并行", "②主会话重排", "③作废批次登记"],
  r006_deferred_registered: true,
  spec_work_package_declaration: true,
  canonical_stages: [...STAGES],
  build_prd_na_reason: true,
});

const assertion = (file, suites, status = "passed") => ({ ancestorTitles: suites.slice(0, -1), title: suites.at(-1), status });

// 夹具：每个 RUN_FILES 都出现；描述块/整文件都绿；基线失败原样保留（去掉本卡声称转绿的文件）。
function greenReport({ extraFailures = [], dropFile = null, keepClaimedRed = null } = {}) {
  const claimed = new Set(Object.keys(CLAIMED_GREEN_FILES));
  const byFile = new Map(RUN_FILES.map((file) => [file, [assertion(file, ["fixture suite", "fixture passes"])]]));
  for (const [file, title] of Object.values(ORACLE_DESCRIBES)) byFile.get(file).push(assertion(file, [title, "fixture oracle passes"]));
  for (const name of BASELINE_FAILURES) {
    const [file, ...titles] = name.split(" > ");
    if (claimed.has(file) && file !== keepClaimedRed) continue;
    byFile.get(file).push(assertion(file, titles, "failed"));
  }
  for (const name of extraFailures) {
    const [file, ...titles] = name.split(" > ");
    byFile.get(file).push(assertion(file, titles, "failed"));
  }
  if (dropFile) byFile.delete(dropFile);
  return {
    testResults: [...byFile].map(([file, assertionResults]) => ({
      name: resolve(cwd, file),
      status: assertionResults.some((a) => a.status === "failed") ? "failed" : "passed",
      assertionResults,
    })),
  };
}

const vitestFacts = (report) => ({ exit_code: 1, timed_out: false, report });
const closureGreen = { exit_code: 0, stderr: "" };
const failedIds = (entry) => entry.assertions.filter((a) => JSON.stringify(a.expected) !== JSON.stringify(a.actual)).map((a) => a.id);

describe("CARD-03 current acceptance producer (ORACLE-ACC-001)", () => {
  it("pins the 33-file / 38-failure baseline and runs a scoped file list, never the whole suite", () => {
    expect(BASELINE_FILES).toHaveLength(33);
    expect(BASELINE_FAILURES).toHaveLength(38);
    expect(new Set(BASELINE_FAILURES.map((name) => name.split(" > ")[0])).size).toBe(15);
    expect(RUN_FILES.length).toBeGreaterThan(BASELINE_FILES.length);
    expect(RUN_FILES).not.toContain("tests/acceptance/card-03-current.test.mjs");
    expect(RUN_FILES.every((file) => file.startsWith("tests/") && file.endsWith(".test.mjs"))).toBe(true);
    expect(ORACLE_IDS).toHaveLength(14);
  });

  it("returns exactly one runner-readable entry and achieves it only when every observable matches", () => {
    const entry = deriveCard03Entry({ vitest: vitestFacts(greenReport()), closure: closureGreen, observations: TARGET_OBSERVATIONS, cwd });
    expect(failedIds(entry)).toEqual([]);
    expect(entry.outcome).toBe("achieved");
    const [derived] = deriveAcceptanceExecutionAssertions(JSON.stringify({ entries: [entry] }), [ACCEPTANCE_CRITERION_ID]);
    expect(derived.assertions.every((a) => a.result === "passed")).toBe(true);
    for (const oracle of ORACLE_IDS) expect(entry.assertions.some((a) => a.id.startsWith(`${oracle}:`)), oracle).toBe(true);
    for (const ac of PRD_ACS) expect(entry.assertions.some((a) => a.id.startsWith(`PRD-${ac}:`)), ac).toBe(true);
  });

  it("fails on a new red outside the baseline and on a claimed-green file that stays red", () => {
    const extra = "tests/contract/review-materials-contract.test.mjs > fixture suite > brand new regression";
    const entry = deriveCard03Entry({
      vitest: vitestFacts(greenReport({ extraFailures: [extra], keepClaimedRed: "tests/contract/post-phase-contract.test.mjs" })),
      closure: closureGreen, observations: TARGET_OBSERVATIONS, cwd,
    });
    expect(entry.outcome).toBe("incomplete");
    expect(entry.owner).toBe("CARD-03 P6/T015");
    expect(failedIds(entry)).toEqual(expect.arrayContaining([
      "BASELINE:no-new-failures",
      "BASELINE:claimed-green:P5/T014:tests/contract/post-phase-contract.test.mjs",
      "ORACLE-FIX-004:file:tests/contract/post-phase-contract.test.mjs",
    ]));
    const newFailures = entry.assertions.find((a) => a.id === "BASELINE:no-new-failures").actual;
    expect(newFailures).toEqual([extra]);
    expect(() => deriveAcceptanceExecutionAssertions(JSON.stringify({ entries: [entry] }), [ACCEPTANCE_CRITERION_ID])).not.toThrow();
  });

  it("treats a silently skipped file or a missing oracle describe block as failure, not as green", () => {
    const report = greenReport({ dropFile: "tests/contract/card03-runtime-binding.test.mjs" });
    const review = report.testResults.find((f) => f.name.endsWith("card03-review-orchestration.test.mjs"));
    review.assertionResults = review.assertionResults.filter((a) => a.ancestorTitles[0] !== ORACLE_DESCRIBES["ORACLE-REV-002"][1]);
    const entry = deriveCard03Entry({ vitest: vitestFacts(report), closure: closureGreen, observations: TARGET_OBSERVATIONS, cwd });
    expect(failedIds(entry)).toEqual(expect.arrayContaining([
      "BASELINE:all-run-files-executed",
      "ORACLE-RT-001:file:tests/contract/card03-runtime-binding.test.mjs",
      "ORACLE-REV-002:describe:tests/contract/card03-review-orchestration.test.mjs",
    ]));
    expect(summarizeVitestReport(report, cwd).has("tests/contract/card03-runtime-binding.test.mjs")).toBe(false);
  });

  it("does not let a green test run stand in for missing material facts", () => {
    const observations = { ...TARGET_OBSERVATIONS, g1_drill_steps: ["①停并行"], bundle_per_file_sha_paths: ["skills/x/skill-bundle.json"] };
    const entry = deriveCard03Entry({ vitest: vitestFacts(greenReport()), closure: { exit_code: 1, stderr: "- build-code: x" }, observations, cwd });
    expect(failedIds(entry)).toEqual([
      "ORACLE-SKL-001:no-per-file-sha", "ORACLE-SKL-002:skill-closure", "PRD-AC-14:g1-drill-record",
    ]);
    expect(dispatchSection("# t\n## 按工作类型派子代理\n见 AGENTS.md\n## 下一节\n")).toBe("## 按工作类型派子代理\n见 AGENTS.md");
    expect(dispatchSection("## 其他\n")).toBeNull();
  });
});

describe("CARD-03 current workspace reaches the target observables (ORACLE-ACC-001)", () => {
  it("five formal stages each carry a dispatch section citing AGENTS.md (母 PRD 验收第 15 条)", async () => {
    const o = await observeWorkspace(cwd);
    expect(o.canonical_stages).toEqual([...STAGES]);
    expect(o.build_prd_na_reason).toBe(true);
    expect(o.dispatch_sections_citing_agents).toEqual([...STAGES]);
  });

  it("delegation clauses, repair routing and G-1 text are in place (母 PRD 验收第 11、12、14 条)", async () => {
    const o = await observeWorkspace(cwd);
    expect(o.agents_clauses).toEqual(TARGET_OBSERVATIONS.agents_clauses);
    expect(o.build_code_original_implementer).toBe(true);
    expect(o.g1_method_terms).toEqual(TARGET_OBSERVATIONS.g1_method_terms);
    expect(o.threshold_registered).toBe(true);
    expect(o.g1_drill_steps).toEqual(TARGET_OBSERVATIONS.g1_drill_steps);
    expect(o.r006_deferred_registered).toBe(true);
  });

  it("phase template declares interface symbols, merge owner and progress cursor (母 PRD 验收第 13 条)", async () => {
    const o = await observeWorkspace(cwd);
    expect(o.spec_work_package_declaration).toBe(true);
    expect(o.phase_template_fields_missing).toEqual([]);
  });

  it("root progress files retired, bundles carry no per-file sha, retired templates removed", async () => {
    const o = await observeWorkspace(cwd);
    expect({ in_root: o.root_progress_in_root, archived: o.root_progress_archived })
      .toEqual({ in_root: [], archived: [...ROOT_PROGRESS_FILES] });
    expect(o.bundle_count).toBeGreaterThan(0);
    expect(o.bundle_per_file_sha_paths).toEqual([]);
    expect(o.retired_templates_present).toEqual([]);
  });

  it("runtime and schema fixes are observable in current code", async () => {
    const o = await observeWorkspace(cwd);
    expect(o.stage_runtime_review_budget).toBe(false);
    expect(o.schema_missing).toEqual({ result: [], leaf_result: [], status: [] });
    expect(o.make_decision_material_set).toEqual(["decision-log.md"]);
    expect(o.c2_irreversible_rules_present).toBe(false);
  });

  it("skill closure check exits 0 with no undeclared or external skill references", () => {
    const result = spawnSync(process.execPath, ["runtime/evidence/check-skill-closure.mjs"], { cwd, encoding: "utf8", timeout: 60000 });
    expect({ exit_code: result.status, stderr: result.stderr.trim() }).toEqual({ exit_code: 0, stderr: "" });
  });
});
