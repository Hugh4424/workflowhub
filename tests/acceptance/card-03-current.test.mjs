import { describe, expect, it, vi } from "vitest";
import { spawnSync, execFileSync } from "node:child_process";
import { resolve, join } from "node:path";
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync, realpathSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { resolveWorkflowHubIdentity } from "../../tools/cli/stage-runtime.mjs";

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
  runScopedVitest,
  runSkillClosure,
  produceCard03Current,
} from "./card-03-current.mjs";

const cwd = resolve(import.meta.dirname, "../..");

// Reporter data below is constructed. TaskHandle, record I/O and linked-worktree
// validation are real; only the identity resolver selects the disposable task.
function fixtureGit(cwd, ...args) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  return execFileSync("git", args, { cwd, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
async function controlledProduce(options = {}) {
  const { fixtureWrongTask = false, fixtureWrongWorktree = false, fixtureBadDeclaration = false, ...producerOptions } = options;
  const root = realpathSync(mkdtempSync(join(tmpdir(), "card03-p6-controlled-")));
  const repo = join(root, "repo"), linked = join(root, "linked"), storage = join(root, "storage");
  let linkedCreated = false, output;
  try {
  for (const path of [repo, storage]) mkdirSync(path);
  fixtureGit(repo, "init", "-q", "-b", "main");
  fixtureGit(repo, "config", "user.name", "Owned acceptance fixture");
  fixtureGit(repo, "config", "user.email", "owned@test.invalid");
  writeFileSync(join(repo, "README.md"), "Constructed acceptance inputs; no real coverage claim.\n");
  fixtureGit(repo, "add", "README.md");
  fixtureGit(repo, "commit", "-qm", "owned baseline");
  fixtureGit(repo, "worktree", "add", "-q", "-b", "controlled", linked);
  linkedCreated = true;
  const write = (path, bytes) => { const absolute = join(linked, path); mkdirSync(resolve(absolute, ".."), { recursive: true }); writeFileSync(absolute, bytes); };
  // Source text is explicitly constructed parser input, never TARGET_OBSERVATIONS injected as output.
  for (const stage of STAGES) write(`workflows/${stage}/SKILL.md`,
    `# Controlled ${stage}\n## 按工作类型派子代理\n见 AGENTS.md；G-1\n${stage === "build-code" ? "原实施子代理；连续上下文；G-1；停并行；重排；作废批次\n" : ""}`);
  write("skills/controlled/skill-bundle.json", JSON.stringify({ files: ["SKILL.md"] }));
  write("skills/spec-plan/templates/phase-template.md", "接口符号；合并责任；progress_cursor\n");
  write("AGENTS.md", "不整份继承上下文；不空转轮询；跨 Phase 不绑定全量快照\n");
  write("workflows/build-prd/SKILL.md", "Do not add `build-prd` to the canonical five stages\n");
  write("runtime/task/task-store.mjs", `const STAGES = new Set(${JSON.stringify(STAGES)})`);
  write("specs/workflowhub-thin-core-card-03-20260919/spec.md", "工作包声明：读集、写集、文件 owner、接口符号清单、合并责任\n");
  write("specs/workflowhub-thin-core-card-03-20260919/decision-log.md",
    "### 二、阶段豁免表与「大量读写」的可指认阈值\n500 字；目录级批量扫描；≥3 个文件\n### 八、G-1 演练记录\n①停并行；②主会话重排；③作废批次登记\n| R-006 | deferred |\n");
  for (const file of ROOT_PROGRESS_FILES) write(`docs/archive/retired-root-progress/${file}`, "Constructed archived input\n");
  // Only this exact original declaration is reused; no archive document/tree snapshot.
  const original = readFileSync(resolve(cwd, "specs/archive/workflowhub-thin-core-card-03-20260919/phases/P6.md"), "utf8");
  const declaration = original.split("\n").find((line) => line.startsWith("- **repair_affected_scope**"));
  if (!declaration) throw new Error("original repair_affected_scope declaration missing");
  write("specs/workflowhub-thin-core-card-03-20260919/phases/P6.md", `# Constructed parser input\n\n${fixtureBadDeclaration ? declaration.replace("completion-predicates.mjs", "unowned.mjs") : declaration}\n`);

  const task = await createTask({ storageRoot: storage, manifest: { schema_version: "1.0.0", project_name: "P6ControlledUnit",
    task_id: "workflowhub-thin-core-card-03-20260919", created_at: "2026-09-30T00:00:00.000Z",
    target_repo_root: repo, workspace_mode: "existing", workspace_root: linked, execution_mode: "per_invocation",
    issue_ids: [], inputs: {}, record_model: "vnext-single-write", activation_cohort: "post" } });
  const names = Array.from({ length: 7 }, (_, i) => `tests/contract/build-code-targeted-capture.test.mjs > controlled original > historical failure ${i}`);
  const raw = names.map((name) => ` FAIL  ${name}`).join("\n") + "\n";
  const outputHash = createHash("sha256").update(raw).digest("hex");
  await task.createRecord("quality/tests/controlled-original.output", raw);
  await expect(task.createRecord("quality/tests/controlled-original.output", "conflicting bytes")).rejects.toThrow();
  expect(task.readRecordBytes("quality/tests/controlled-original.output")).toEqual(Buffer.from(raw));
  await task.createRecord("quality/tests/controlled-receipt.json", JSON.stringify({ output_ref: "quality/tests/controlled-original.output", output_hash: outputHash }));
  await task.createRecord("quality/evidence/card03/P3/independent-targeted-restored-baseline-v2-test-metadata.json",
    JSON.stringify({ current_failed_names: names, receipt_ref: "quality/tests/controlled-receipt.json", output_hash: outputHash }));
  vi.resetModules();
  vi.doMock("../../tools/cli/stage-runtime.mjs", async () => ({ ...(await vi.importActual("../../tools/cli/stage-runtime.mjs")),
    resolveWorkflowHubIdentity: () => ({ taskPath: task.taskPath, project: "P6ControlledUnit", task: fixtureWrongTask ? "wrong-task" : task.identity.taskId }) }));
    const isolated = await import("./card-03-current.mjs");
    output = await isolated.produceCard03Current({ ...producerOptions, cwd: fixtureWrongWorktree ? repo : linked });
    const records = {};
    for (const command of output.commands) for (const saved of Object.values(command.raw_evidence))
      records[saved.ref] = task.readRecordBytes(saved.ref);
    output.unit_raw_records = records;
    output.unit_task_path = task.taskPath;
    output.unit_worktree_path = linked;
    return output;
  } finally {
    vi.doUnmock("../../tools/cli/stage-runtime.mjs");
    vi.resetModules();
    if (linkedCreated) fixtureGit(repo, "worktree", "remove", "--force", linked);
    rmSync(root, { recursive: true, force: true });
    if (output) output.unit_cleanup = { linked_removed: !existsSync(linked), root_removed: !existsSync(root) };
  }
}


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
  make_decision_material_set: ["decision-log.md", "spec.md", "phases/index.md"],
  c2_irreversible_rules_present: false,
  threshold_registered: true,
  g1_drill_steps: ["①停并行", "②主会话重排", "③作废批次登记"],
  r006_deferred_registered: true,
  spec_work_package_declaration: true,
  canonical_stages: [...STAGES],
  build_prd_na_reason: true,
  mechanism_readback: ["M1", "M2", "M3", "M4", "M5", ...Array.from({ length: 16 }, (_, i) => `E${i + 1}`)]
    .map((id) => ({ id, present: true })),
  dispatch_evidence: { status: "verified", independent_initial_contexts: true, independent_role_contexts: true,
    concurrent_running_packages: 3, repair_to_original: true, main_activity_compliant: true },
  g1_actual_demonstration: true,
});

const assertion = (file, suites, status = "passed") => ({ ancestorTitles: suites.slice(0, -1), title: suites.at(-1), status });

// 夹具：每个 RUN_FILES 都出现；描述块/整文件都绿；基线失败原样保留（去掉本卡声称转绿的文件）。
function greenReport({ extraFailures = [], dropFile = null, keepClaimedRed = null, reportRoot = cwd } = {}) {
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
      name: resolve(reportRoot, file),
      status: assertionResults.some((a) => a.status === "failed") ? "failed" : "passed",
      assertionResults,
    })),
  };
}

const vitestFacts = (report) => ({ exit_code: 1, timed_out: false, report,
  node: { passed: true }, scopes: [{ files: [...RUN_FILES], raw_persisted: true }] });
const closureGreen = { exit_code: 0, stderr: "" };
const failedIds = (entry) => entry.assertions.filter((a) => JSON.stringify(a.expected) !== JSON.stringify(a.actual)).map((a) => a.id);

describe("CARD-03 current acceptance producer (ORACLE-ACC-001)", () => {
  it("pins the 33-file / 38-failure baseline and runs a scoped file list, never the whole suite", () => {
    expect(BASELINE_FILES).toHaveLength(33);
    expect(BASELINE_FAILURES).toHaveLength(38);
    expect(new Set(BASELINE_FAILURES.map((name) => name.split(" > ")[0])).size).toBe(15);
    expect(RUN_FILES.length).toBeGreaterThan(BASELINE_FILES.length);
    expect(RUN_FILES).not.toContain("tests/acceptance/card-03-current.test.mjs");
    expect(RUN_FILES.every((file) => (file.startsWith("tests/") || file.startsWith("core/__tests__/")
      || file.startsWith("scripts/__tests__/")) && file.endsWith(".test.mjs"))).toBe(true);
    expect(ORACLE_IDS).toHaveLength(13);
  });

  it("returns one runner-readable entry with original public reflection explicitly uncovered", () => {
    const entry = deriveCard03Entry({ vitest: vitestFacts(greenReport()), closure: closureGreen, observations: TARGET_OBSERVATIONS, cwd });
    expect(failedIds(entry)).toEqual(["ORACLE-FIX-001:original-public-reflection-coverage"]);
    expect(entry.outcome).toBe("incomplete");
    expect(entry.acceptance_criterion_id).toBe(ACCEPTANCE_CRITERION_ID);
    expect(entry.assertions.length).toBeGreaterThan(0);
    expect(new Set(entry.assertions.map((a) => a.id)).size).toBe(entry.assertions.length);
    expect(entry.assertions.filter((a) => JSON.stringify(a.expected) !== JSON.stringify(a.actual))).toHaveLength(1);
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
    expect(entry.acceptance_criterion_id).toBe(ACCEPTANCE_CRITERION_ID);
    expect(new Set(entry.assertions.map((a) => a.id)).size).toBe(entry.assertions.length);
    expect(entry.assertions.every((a) => Object.hasOwn(a, "expected") && Object.hasOwn(a, "actual"))).toBe(true);
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
      "ORACLE-SKL-001:no-per-file-sha", "ORACLE-SKL-002:skill-closure", "ORACLE-FIX-001:original-public-reflection-coverage", "PRD-AC-14:g1-drill-record",
    ]);
    expect(dispatchSection("# t\n## 按工作类型派子代理\n见 AGENTS.md\n## 下一节\n")).toBe("## 按工作类型派子代理\n见 AGENTS.md");
    expect(dispatchSection("## 其他\n")).toBeNull();
  });
});

describe("CARD-03 current source readback preserves original expected values without claiming acceptance", () => {
  it("reports actual workspace differences and unavailable historical sources as incomplete", async () => {
    const observations = await observeWorkspace(cwd);
    const closure = runSkillClosure({ cwd });
    const entry = deriveCard03Entry({ vitest: vitestFacts(greenReport()), closure, observations, cwd });
    expect(entry.outcome).toBe("incomplete");
    const byId = new Map(entry.assertions.map((row) => [row.id, row]));
    expect(byId.get("ORACLE-DISP-001:five-dispatch-sections-cite-agents"))
      .toEqual({ id: "ORACLE-DISP-001:five-dispatch-sections-cite-agents", expected: [...STAGES], actual: observations.dispatch_sections_citing_agents });
    expect(byId.get("PRD-AC-15:five-stage-dispatch-instances")?.actual)
      .toEqual({ canonical: observations.canonical_stages, dispatch: observations.dispatch_sections_citing_agents });
    expect(byId.get("PRD-AC-12:agents-delegation-clauses")?.expected).toEqual(TARGET_OBSERVATIONS.agents_clauses);
    expect(byId.get("PRD-AC-12:agents-delegation-clauses")?.actual).toEqual(observations.agents_clauses);
    expect(byId.get("ORACLE-DISP-002:phase-template-fields")?.actual).toEqual(observations.phase_template_fields_missing);
    expect(byId.get("ORACLE-SKL-001:no-per-file-sha")?.actual)
      .toEqual({ bundles_present: observations.bundle_count > 0, per_file_sha: observations.bundle_per_file_sha_paths });
    expect(byId.get("ORACLE-FIX-001:make-decision-needs-decision-log-only")?.expected).toEqual(["decision-log.md", "spec.md", "phases/index.md"]);
    expect(byId.get("ORACLE-SKL-002:skill-closure")?.expected).toEqual({ exit_code: 0, stderr: "" });
    expect(byId.get("ORACLE-SKL-002:skill-closure")?.actual).toEqual({ exit_code: closure.exit_code, stderr: closure.stderr.trim() });
    expect(observations.historical_inventory_source.status).toBe("unknown");
    expect(observations.historical_inventory_source.reason).toEqual(expect.any(String));
    expect(observations.historical_inventory_source.reason.length).toBeGreaterThan(0);
    expect(failedIds(entry)).toContain("ORACLE-FIX-001:original-public-reflection-coverage");
  });

  it("parses explicitly constructed text inputs while keeping their native execution evidence unknown", async () => {
    const output = await controlledProduce({ run: mappedControlledRun() });
    const o = output.observations;
    expect(o.canonical_stages).toEqual([...STAGES]);
    expect(o.build_prd_na_reason).toBe(true);
    expect(o.dispatch_sections_citing_agents).toEqual([...STAGES]);
    expect(o.agents_clauses).toEqual(TARGET_OBSERVATIONS.agents_clauses);
    expect(o.build_code_original_implementer).toBe(true);
    expect(o.g1_method_terms).toEqual(TARGET_OBSERVATIONS.g1_method_terms);
    expect(o.threshold_registered).toBe(true);
    expect(o.g1_drill_steps).toEqual(TARGET_OBSERVATIONS.g1_drill_steps);
    expect(o.r006_deferred_registered).toBe(true);
    expect(o.spec_work_package_declaration).toBe(true);
    expect(o.phase_template_fields_missing).toEqual([]);
    expect({ in_root: o.root_progress_in_root, archived: o.root_progress_archived })
      .toEqual({ in_root: [], archived: [...ROOT_PROGRESS_FILES] });
    expect(o.bundle_count).toBeGreaterThan(0);
    expect(o.bundle_per_file_sha_paths).toEqual([]);
    expect(o.retired_templates_present).toEqual([]);
    expect(o.stage_runtime_review_budget).toBe(false);
    expect(o.make_decision_material_set).toEqual(["decision-log.md", "spec.md", "phases/index.md"]);
    expect(o.c2_irreversible_rules_present).toBe(false);
    expect(o.dispatch_evidence.status).toBe("unknown");
    expect(o.g1_actual_demonstration).toBe("unknown");
    expect(nativeRow(output, "AC-ACC-001")?.outcome).toBe("incomplete");
  });
});


// Controlled unit facts only: no actual acceptance aggregate or Task publication.
describe("CARD-03 P6 current producer target boundaries (ORACLE-ACC-001)", () => {
  it("includes all 54 declared logical consumers and eight whole claimed files", () => {
    expect(RUN_FILES).toHaveLength(54);
    expect(Object.keys(CLAIMED_GREEN_FILES)).toHaveLength(8);
    expect(RUN_FILES).toEqual(expect.arrayContaining([
      "core/__tests__/stage-skill-runtime.test.mjs", "scripts/__tests__/smoke-local-skill-dispatch.test.mjs",
      "tests/contract/build-code-case-reconciliation.test.mjs", "tests/contract/ui-frontend-governance.test.mjs",
      "tests/integration/runner-clean-install.test.mjs",
    ]));
  });

  it("does not call a whole claimed file green when one real leaf is skipped beside a pass", () => {
    const report = greenReport();
    const claimed = report.testResults.find((file) => file.name.endsWith("post-phase-contract.test.mjs"));
    claimed.assertionResults.push(assertion("tests/contract/post-phase-contract.test.mjs", ["fixture suite", "unexecuted leaf"], "pending"));
    const entry = deriveCard03Entry({ vitest: vitestFacts(report), closure: closureGreen, observations: TARGET_OBSERVATIONS, cwd });
    expect(entry.outcome).toBe("incomplete");
    expect(failedIds(entry)).toContain("BASELINE:claimed-green:P5/T014:tests/contract/post-phase-contract.test.mjs");
  });

  it("does not use a method paragraph or deferred registration as actual multi-actor execution evidence", () => {
    const observations = { ...TARGET_OBSERVATIONS, dispatch_evidence: { status: "unknown", reason: "no native source" } };
    const entry = deriveCard03Entry({ vitest: vitestFacts(greenReport()), closure: closureGreen, observations, cwd });
    expect(entry.outcome).toBe("incomplete");
    expect(failedIds(entry)).toContain("PRD-AC-11:real-dispatch-evidence");
  });

  it("keeps an actual all-history inheritance violation incomplete despite later independent checks", () => {
    const observations = { ...TARGET_OBSERVATIONS, dispatch_evidence: {
      status: "verified", initial_fork_modes: ["all", "all", "none"], independent_initial_contexts: false,
      later_independent_checks: true,
    } };
    const entry = deriveCard03Entry({ vitest: vitestFacts(greenReport()), closure: closureGreen, observations, cwd });
    expect(entry.outcome).toBe("incomplete");
    expect(failedIds(entry)).toContain("PRD-AC-11:initial-contexts-no-history");
  });

  it("keeps G-1 demonstration unproven when only the static drill text exists", () => {
    const observations = { ...TARGET_OBSERVATIONS, dispatch_evidence: { status: "unknown" }, g1_actual_demonstration: "unknown" };
    const entry = deriveCard03Entry({ vitest: vitestFacts(greenReport()), closure: closureGreen, observations, cwd });
    expect(entry.outcome).toBe("incomplete");
    expect(failedIds(entry)).toContain("PRD-AC-14:g1-actual-demonstration");
  });

  it("requires every one of the 21 live mechanism anchors instead of accepting an omitted group", () => {
    const observations = { ...TARGET_OBSERVATIONS, mechanism_readback: [] };
    const entry = deriveCard03Entry({ vitest: vitestFacts(greenReport()), closure: closureGreen, observations, cwd });
    expect(entry.outcome).toBe("incomplete");
    const missing = failedIds(entry).filter((id) => id.startsWith("MECH:"));
    expect(missing).toHaveLength(21);
  });

  for (const pattern of [undefined, "binding regression|actual selected leaf"]) {
  it(`preserves full child streams and exact OS argv before private temporary cleanup (${pattern ? "restricted pattern" : "default scope"})`, () => {
    const stdout = Buffer.from([0xff, 0x00, 0x41]);
    const stderr = Buffer.from("untruncated child stderr\n".repeat(600));
    const reportRaw = Buffer.from(`${JSON.stringify(greenReport())}\n`);
    let invocations = 0, actualArgs, actualOutput;
    const run = (command, args) => {
      invocations += 1;
      actualArgs = [...args];
      expect(command).toBe("npx");
      expect(args).toContain("--no-install");
      const output = args.find((arg) => arg.startsWith("--outputFile=")).slice("--outputFile=".length);
      actualOutput = output;
      expect(resolve(output)).toBe(output);
      writeFileSync(output, reportRaw);
      return { status: 1, signal: null, stdout, stderr };
    };
    const result = runScopedVitest({ run, cwd, pattern });
    expect(invocations).toBe(1);
    expect(result.args).toEqual(actualArgs);
    expect(result.args).toContain(`--outputFile=${actualOutput}`);
    expect(result.args).not.toContain("--outputFile=<tmp>");
    if (pattern) expect(result.args.slice(result.args.indexOf("-t"), result.args.indexOf("-t") + 2)).toEqual(["-t", pattern]);
    else expect(result.args).not.toContain("-t");
    expect(existsSync(actualOutput)).toBe(false);
    expect(result.raw?.stdout).toEqual(stdout);
    expect(result.raw?.stderr).toEqual(stderr);
    expect(result.raw?.report).toEqual(reportRaw);
  });
  }
});


describe("CARD-03 P6 authenticated source and raw persistence (ORACLE-ACC-001)", () => {
  it("freezes all 54 historical inventory paths in order without claiming authenticated historical origin", () => {
    expect(RUN_FILES).toEqual([
  "core/__tests__/check-skill-closure.test.mjs",
  "core/__tests__/stage-skill-runtime.test.mjs",
  "scripts/__tests__/smoke-local-skill-dispatch.test.mjs",
  "tests/build-code-diff-only.test.mjs",
  "tests/contract/build-code-apply-contract.test.mjs",
  "tests/contract/build-code-case-reconciliation.test.mjs",
  "tests/contract/build-code-targeted-capture.test.mjs",
  "tests/contract/business-case-catalog.test.mjs",
  "tests/contract/business-case-source-binding.test.mjs",
  "tests/contract/card03-dispatch-method.test.mjs",
  "tests/contract/card03-review-orchestration.test.mjs",
  "tests/contract/card03-runtime-binding.test.mjs",
  "tests/contract/card03-skill-bundle-closure.test.mjs",
  "tests/contract/card04-final-aggregate.test.mjs",
  "tests/contract/census-upstream-authoring.test.mjs",
  "tests/contract/filled-plan-task-production.test.mjs",
  "tests/contract/four-material-non-gate-contract.test.mjs",
  "tests/contract/freeze-classification-budget-usage-protocol.test.mjs",
  "tests/contract/governance-review-dispatch-boundary.test.mjs",
  "tests/contract/material-producer-consumer-roundtrip.test.mjs",
  "tests/contract/material-set-per-stage.test.mjs",
  "tests/contract/phase-quality-handoff.test.mjs",
  "tests/contract/plan-acceptance-task-gate.test.mjs",
  "tests/contract/post-cohort-authoring-files.test.mjs",
  "tests/contract/post-cohort-executable-authoring.test.mjs",
  "tests/contract/post-cohort-governance-materials.test.mjs",
  "tests/contract/post-cohort-spec-design-authority.test.mjs",
  "tests/contract/post-phase-contract.test.mjs",
  "tests/contract/research-report.test.mjs",
  "tests/contract/review-budget-deletion.test.mjs",
  "tests/contract/review-history-canonical-reader.test.mjs",
  "tests/contract/review-material-change-redispatch.test.mjs",
  "tests/contract/review-materials-contract.test.mjs",
  "tests/contract/review-step-forward-progress.test.mjs",
  "tests/contract/session-binding-removed.test.mjs",
  "tests/contract/spec-prd-skill-contract.test.mjs",
  "tests/contract/spec-stage-artifact-closure.test.mjs",
  "tests/contract/stage-interaction-batching.test.mjs",
  "tests/contract/stage-closeout-step-contract.test.mjs",
  "tests/contract/stage-reflection-skill-contract.test.mjs",
  "tests/contract/stage-routing-and-concrete-testing.test.mjs",
  "tests/contract/stage-skill-consumer-contract.test.mjs",
  "tests/contract/stage-skill-invocation-contract.test.mjs",
  "tests/contract/tier-c-deletion-boundary.test.mjs",
  "tests/contract/ui-frontend-governance.test.mjs",
  "tests/contract/workflow-quality-regression.test.mjs",
  "tests/decision-log-content-contract.test.mjs",
  "tests/integration/distribution-closure.test.mjs",
  "tests/integration/runner-clean-install.test.mjs",
  "tests/p0-foundation-contracts.test.mjs",
  "tests/requirements-completeness-audit-acceptance.test.mjs",
  "tests/skill-provenance-strict.test.mjs",
  "tests/step-manifest.test.mjs",
  "tests/contract/verify-code-binding-derivation.test.mjs",
    ]);
    expect(RUN_FILES.every((file) => file.endsWith(".test.mjs"))).toBe(true);
  });
  it("keeps the original historical inventory source condition explicitly unknown when unreadable", async () => {
    const observed = (await observeWorkspace(cwd)).historical_inventory_source;
    expect(observed.source_ref).toBe("quality/evidence/card03/P6/test-scope-union-audit.json");
    expect(observed.status).toBe("unknown");
    expect(observed.reason).toEqual(expect.any(String));
    expect(observed.reason.length).toBeGreaterThan(0);
    expect(observed.status).not.toBe("verified");
  });

  it("does not exempt a new targeted failure just because its filename has seven historical failures", () => {
    const extra = "tests/contract/build-code-targeted-capture.test.mjs > fixture suite > new source safety failure";
    const entry = deriveCard03Entry({ vitest: { ...vitestFacts(greenReport({ extraFailures: [extra] })),
      targeted_legacy_verified: true, targeted_legacy_failures: ["some genuine older named failure"] },
      closure: closureGreen, observations: TARGET_OBSERVATIONS, cwd });
    expect(entry.outcome).toBe("incomplete");
    expect(entry.assertions.find((row) => row.id === "BASELINE:no-new-failures").actual).toEqual([extra]);
  });

  it("persists exact raw bytes through the existing task writer and ignores caller-supplied acceptance observations", async () => {
    const identity = resolveWorkflowHubIdentity({}, cwd), stdout = Buffer.from([0xff, 0x00, 0x41]);
    const stderr = Buffer.from("unit-only raw original\n".repeat(600));
    let calls = 0;
    const run = (command, args, runOptions) => {
      calls += 1;
      const reportArg = args.find((arg) => arg.startsWith("--outputFile="));
      if (reportArg) writeFileSync(reportArg.slice("--outputFile=".length), `${JSON.stringify(greenReport({ reportRoot: runOptions.cwd }))}\n`);
      if (args.includes("--test")) return { status: 0, signal: null,
        stdout: Buffer.from("# tests 4\n# pass 4\n# fail 0\n# skipped 0\n"), stderr: Buffer.alloc(0) };
      if (args[0] === "runtime/evidence/check-skill-closure.mjs") return { status: 0, signal: null, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) };
      return { status: 1, signal: null, stdout, stderr };
    };
    const output = await controlledProduce({ cwd, run, observations: TARGET_OBSERVATIONS });
    expect(calls).toBe(6); // Four bounded Vitest invocations, Node-only, closure; all controlled mocks.
    for (const [stream, original] of [["stdout", stdout], ["stderr", stderr]]) {
      const saved = output.commands[0].raw_evidence[stream];
      const bytes = output.unit_raw_records[saved.ref];
      expect(bytes).toEqual(original);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(saved.original_sha256);
    }
    const report = output.commands[0].raw_evidence.report;
    const reportBytes = output.unit_raw_records[report.ref];
    expect(createHash("sha256").update(reportBytes).digest("hex")).toBe(report.original_sha256);
    expect(output.observations.dispatch_evidence.status).toBe("unknown"); // No fabricated native positive source in fixture.
    expect(output.unit_task_path).not.toBe(identity.taskPath);
    expect(existsSync(output.unit_task_path)).toBe(false);
    expect(output.unit_cleanup).toEqual({ linked_removed: true, root_removed: true });
    expect(existsSync(output.unit_worktree_path)).toBe(false);
    expect(output.observations.g1_actual_demonstration).toBe("unknown");
    expect(output.entries[0].outcome).toBe("incomplete");
  });
});


// New native mapping contract: controlled children only, never real aggregate.
const NATIVE_AC_IDS = ["AC-DISP-001", "AC-DISP-002", "AC-DISP-003", "AC-SKL-001", "AC-SKL-002", "AC-SKL-003",
  "AC-RT-001", "AC-RT-002", "AC-REV-001", "AC-REV-002", "AC-FIX-001", "AC-FIX-003", "AC-FIX-004", "AC-ACC-001"];
const BINDING_CONSUMER = "tests/contract/verify-code-binding-derivation.test.mjs";
function mappedControlledRun({ fault = null } = {}) {
  return (command, args, runOptions) => {
    if (args.includes("--test")) return { status: 0, stdout: Buffer.from("# tests 4\n# pass 4\n# fail 0\n# skipped 0\n"), stderr: Buffer.alloc(0) };
    if (args[0] === "runtime/evidence/check-skill-closure.mjs") return { status: 0, stdout: Buffer.alloc(0), stderr: Buffer.alloc(0) };
    const files = args.filter((arg) => arg.endsWith(".test.mjs"));
    const all = greenReport({ reportRoot: runOptions.cwd });
    const report = { testResults: files.map((file) => {
      const original = all.testResults.find((row) => row.name === resolve(runOptions.cwd, file));
      const assertionResults = (original?.assertionResults ?? [assertion(file, ["fixture suite", "binding passes"])])
        .filter((row) => row.status === "passed");
      if (file === "tests/contract/card03-skill-bundle-closure.test.mjs") {
        for (const title of ["T003 ORACLE-SKL-001 skill 包只保留运行时聚合摘要", "T004 ORACLE-SKL-002 旧模板删除且 skill 闭包转绿", "T005 ORACLE-DISP-002 phase 模板声明工作包事实字段"])
          assertionResults.push(assertion(file, [title, "mapping fixture passes"]));
      }
      if (file === "tests/contract/stage-closeout-step-contract.test.mjs") {
        // greenReport also follows ORACLE_DESCRIBES; replace this controlled seam
        // explicitly so missing cannot inherit an automatic nominal pass.
        for (let i = assertionResults.length - 1; i >= 0; i -= 1)
          if (assertionResults[i].ancestorTitles[0] === "ORACLE-P1-CLOSEOUT-STEP stage closeout step and method contract") assertionResults.splice(i, 1);
      }
      if (file === "tests/contract/stage-closeout-step-contract.test.mjs" && fault !== "reflect-missing")
        assertionResults.push(assertion(file, ["ORACLE-P1-CLOSEOUT-STEP stage closeout step and method contract", "closeout wiring/method text fact fixture"],
          fault === "reflect-skipped" ? "pending" : fault === "reflect-failed" ? "failed" : "passed"));
      if (file === BINDING_CONSUMER && fault === "binding-failed") assertionResults.push(assertion(file, ["fixture suite", "binding regression"], "failed"));
      if (file === BINDING_CONSUMER && fault === "binding-skipped") assertionResults.push(assertion(file, ["fixture suite", "binding not executed"], "pending"));
      if (file.endsWith("card03-dispatch-method.test.mjs") && fault === "disp-describe-skipped")
        for (const row of assertionResults) if (row.ancestorTitles[0] === ORACLE_DESCRIBES["ORACLE-DISP-001"][1]) row.status = "pending";
      return { name: resolve(runOptions.cwd, file), status: file === BINDING_CONSUMER && fault === "binding-file-error" ? "failed" : "passed",
        ...(file === BINDING_CONSUMER && fault === "binding-file-error" ? { message: "Error: afterAll actual file-level failure" } : {}), assertionResults };
    }) };
    if (fault === "binding-missing") report.testResults = report.testResults.filter((row) => row.name !== resolve(runOptions.cwd, BINDING_CONSUMER));
    const output = args.find((arg) => arg.startsWith("--outputFile=")).slice("--outputFile=".length);
    writeFileSync(output, fault === "unreadable-report" ? "{broken actual child JSON" : JSON.stringify(report));
    return { status: fault === "child-error" ? null : 0, stdout: Buffer.from("controlled same-run raw\n"), stderr: Buffer.alloc(0),
      ...(fault === "child-error" ? { error: { code: "ETIMEDOUT", message: "controlled real child boundary timeout" } } : {}) };
  };
}
const nativeRow = (output, id) => output.entries.find((entry) => entry.acceptance_criterion_id === id);

const REPAIR_INPUT = { changed_paths: ["runtime/stage/stage-content-contracts.mjs", "runtime/stage/stage-runner.mjs",
  "runtime/stage/stage-handlers.mjs", "runtime/stage/completion-predicates.mjs"] };
const repairCaseNames = [
  ["reuses byte-authenticated execution for metadata-only rerun while retaining unavailable review source",
    "projects this canonical subject_fact scenario and incomplete without filling independent proofs",
    "projects this canonical subject_fact scenario and failed without filling independent proofs"],
  ["preserves a real multi-T decision cell string with explicitly constructed quoted source",
    "retains legacy multi-D and mixed explicit D/T list tokens without new decision fields",
    "does not authenticate an unknown syntactically valid decision just because its index token is readable",
    "reads all twenty real current R rows while derived edges and unauthenticated originals stay incomplete"],
];
function repairControlledRun({ fault = null } = {}) {
  return (command, args, runOptions) => {
    const file = args.find((arg) => arg.endsWith(".test.mjs"));
    if (!file || args.filter((arg) => arg.endsWith(".test.mjs")).length !== 1 || !args.includes("-t"))
      throw new Error("controlled repair must execute one explicit consumer scope");
    const index = file.endsWith("card03-runtime-binding.test.mjs") ? 0 : 1;
    const title = index === 0 ? "CARD-03 stage-end existing native acceptance projection (ORACLE-RT-001)"
      : "CARD-03 census multiple decision cell keeps original trace (ORACLE-RT-001)";
    let leaves = repairCaseNames[index].map((name, i) => assertion(file, [title, name], fault === "failed" && i === 0 ? "failed" : "passed"));
    if (fault === "missing") leaves = leaves.slice(0, 1);
    if (fault === "wrong") leaves = [assertion(file, [title, "unrelated case passes"])];
    if (fault === "skipped") leaves = leaves.map((leaf) => ({ ...leaf, status: "pending" }));
    leaves.push(assertion(file, ["unrelated excluded scope", "does not prove the original whole file"], "pending"));
    const report = { testResults: [{ name: resolve(runOptions.cwd, file), status: fault === "failed" ? "failed" : "passed", assertionResults: leaves }] };
    writeFileSync(args.find((arg) => arg.startsWith("--outputFile=")).slice("--outputFile=".length), JSON.stringify(report));
    return { status: fault === "failed" ? 1 : 0, stdout: Buffer.from("controlled repair source\n"), stderr: Buffer.alloc(0) };
  };
}

describe("CARD-03 P6 affected repair execution boundary", () => {
  it("rejects a changed original P6 declaration through the real parser before any child", async () => {
    let executed = false;
    await expect(controlledProduce({ fixtureBadDeclaration: true, affected_scope: REPAIR_INPUT,
      run: () => { executed = true; throw new Error("unexpected child"); } })).rejects.toThrow(/approved repair/);
    expect(executed).toBe(false);
  });

  it("runs only the approved consumer cases and keeps all original AC oracles incomplete", async () => {
    const output = await controlledProduce({ affected_scope: REPAIR_INPUT, run: repairControlledRun() });
    expect(output.commands).toHaveLength(2);
    expect(output.commands.every((command) => command.files.length === 1 && command.pattern)).toBe(true);
    expect(output.affected_scope.scopes.map((scope) => scope.selected_test_names.length)).toEqual([3, 4]);
    expect(output.entries.map((row) => row.acceptance_criterion_id)).toEqual(NATIVE_AC_IDS);
    expect(output.entries.every((row) => row.outcome === "incomplete")).toBe(true);
    expect(output.entries.every((row) => row.assertions.length > 0 && new Set(row.assertions.map((a) => a.id)).size === row.assertions.length)).toBe(true);
    expect(output.entries.every((row) => row.assertions.every((a) => JSON.stringify(a.expected) === JSON.stringify(a.actual)))).toBe(true);
    expect(output.affected_scope.original_oracle_coverage.every((row) => row.uncovered_scopes.length && row.unevaluated_original_assertion_ids.length)).toBe(true);
    expect(output.commands.some((command) => command.args.includes("--test") || command.args.includes("runtime/evidence/check-skill-closure.mjs"))).toBe(false);
    for (const command of output.commands) for (const saved of Object.values(command.raw_evidence))
      expect(createHash("sha256").update(output.unit_raw_records[saved.ref]).digest("hex")).toBe(saved.original_sha256);
  });
  for (const fault of ["missing", "wrong", "skipped"]) {
    it(`keeps ${fault} selected leaves unknown without inventing failed original assertions`, async () => {
      const output = await controlledProduce({ affected_scope: REPAIR_INPUT, run: repairControlledRun({ fault }) });
      expect(output.entries.every((row) => row.outcome === "incomplete")).toBe(true);
      expect(output.affected_scope.scopes.every((scope) => scope.uncovered_test_names.length > 0)).toBe(true);
      expect(output.entries.map((row) => row.acceptance_criterion_id)).toEqual(NATIVE_AC_IDS);
      expect(output.entries.every((row) => row.assertions.length > 0 && new Set(row.assertions.map((a) => a.id)).size === row.assertions.length)).toBe(true);
      expect(output.entries.every((row) => row.assertions.every((a) => JSON.stringify(a.expected) === JSON.stringify(a.actual)))).toBe(true);
    });
  }
  it("preserves actual selected leaf failures without poisoning unrelated criteria", async () => {
    const output = await controlledProduce({ affected_scope: REPAIR_INPUT, run: repairControlledRun({ fault: "failed" }) });
    expect(failedIds(nativeRow(output, "AC-RT-001")).some((id) => id.includes("affected-leaf"))).toBe(true);
    expect(failedIds(nativeRow(output, "AC-DISP-001"))).toEqual([]);
    expect(output.commands.every((command) => command.exit_code === 1)).toBe(true);
  });
  for (const input of [{ changed_paths: [] }, { changed_paths: [...REPAIR_INPUT.changed_paths, REPAIR_INPUT.changed_paths[0]] },
    { changed_paths: [...REPAIR_INPUT.changed_paths.slice(0, 3), "runtime/unowned.mjs"] },
    { ...REPAIR_INPUT, files: ["tests/p0-foundation-contracts.test.mjs"] }]) {
    it(`rejects an invalid caller repair scope before child execution: ${JSON.stringify(input)}`, async () => {
      let executed = false;
      await expect(produceCard03Current({ cwd, affected_scope: input, run: () => { executed = true; throw new Error("no child authorized"); } }))
        .rejects.toThrow(/affected_scope/);
      expect(executed).toBe(false);
    });
  }
});

describe("CARD-03 P6 native per-AC same-execution projection (ORACLE-ACC-001)", () => {
  for (const invalid of [{ fixtureWrongTask: true }, { fixtureWrongWorktree: true }]) {
    it(`rejects real task/worktree identity mismatch before child execution: ${JSON.stringify(invalid)}`, async () => {
      let executed = false;
      await expect(controlledProduce({ ...invalid, run: () => { executed = true; throw new Error("unexpected child"); } }))
        .rejects.toThrow(/identity|workspace|task storage/);
      expect(executed).toBe(false);
    });
  }

  it("returns the complete thirteen technical ACs plus aggregate in literal order while native adverse ACC stays incomplete", async () => {
    const output = await controlledProduce({ cwd, run: mappedControlledRun() });
    expect(output.entries.map((row) => row.acceptance_criterion_id)).toEqual(NATIVE_AC_IDS);
    expect(output.entries.every((row) => row.assertions.length > 0)).toBe(true);
    for (const id of NATIVE_AC_IDS.slice(0, -1)) expect(nativeRow(output, id)?.outcome, id).toBe(id === "AC-FIX-001" ? "incomplete" : "achieved");
    expect(nativeRow(output, "AC-ACC-001")?.outcome).toBe("incomplete");
    expect(failedIds(nativeRow(output, "AC-ACC-001"))).toContain("PRD-AC-11:initial-contexts-no-history");
    expect(output.entries.map((row) => row.acceptance_criterion_id)).toEqual(NATIVE_AC_IDS);
    expect(new Set(output.entries.map((row) => row.acceptance_criterion_id)).size).toBe(NATIVE_AC_IDS.length);
    expect(output.entries.every((row) => new Set(row.assertions.map((a) => a.id)).size === row.assertions.length
      && row.assertions.every((a) => Object.hasOwn(a, "expected") && Object.hasOwn(a, "actual")))).toBe(true);
  });

  it("requires the added P5 binding whole-file consumer in the same current FIX004 execution", async () => {
    const output = await controlledProduce({ cwd, run: mappedControlledRun({ fault: "binding-skipped" }) });
    expect(output.commands[0].files).toContain(BINDING_CONSUMER);
    const row = nativeRow(output, "AC-FIX-004");
    expect(row?.outcome).toBe("incomplete");
    expect(row?.assertions.some((a) => a.id.includes(BINDING_CONSUMER) && JSON.stringify(a.expected) !== JSON.stringify(a.actual))).toBe(true);
    expect(nativeRow(output, "AC-DISP-001")?.outcome).toBe("achieved");
  });

  it("keeps a real binding leaf failure confined to its FIX004 technical row", async () => {
    const output = await controlledProduce({ cwd, run: mappedControlledRun({ fault: "binding-failed" }) });
    expect(nativeRow(output, "AC-FIX-004")?.outcome).toBe("incomplete");
    expect(nativeRow(output, "AC-DISP-001")?.outcome).toBe("achieved");
    expect(nativeRow(output, "AC-FIX-004")?.assertions.find((a) => a.id.endsWith(":required-scope-leaf-failures"))?.actual.length).toBeGreaterThan(0);
  });

  it("cannot fill missing same-run binding coverage from an earlier P5 receipt", async () => {
    const output = await controlledProduce({ cwd, run: mappedControlledRun({ fault: "binding-missing" }) });
    const row = nativeRow(output, "AC-FIX-004");
    expect(row?.outcome).toBe("incomplete");
    expect(row?.assertions.find((a) => a.id.endsWith(":required-scope-raw-missing"))?.actual).toContain(BINDING_CONSUMER);
  });

  it("isolates a skipped DISP001 describe from a genuinely executed distinct DISP003 describe", async () => {
    const output = await controlledProduce({ cwd, run: mappedControlledRun({ fault: "disp-describe-skipped" }) });
    expect(nativeRow(output, "AC-DISP-001")?.outcome).toBe("incomplete");
    expect(nativeRow(output, "AC-DISP-003")?.outcome).toBe("achieved");
    expect(nativeRow(output, "AC-DISP-001")?.assertions.find((a) => a.id.endsWith(":required-scope-leaf-failures"))?.actual.length).toBeGreaterThan(0);
  });

  it("keeps every technical row incomplete when its current reporter JSON cannot be read", async () => {
    const output = await controlledProduce({ cwd, run: mappedControlledRun({ fault: "unreadable-report" }) });
    expect(output.entries.map((row) => row.acceptance_criterion_id)).toEqual(NATIVE_AC_IDS);
    for (const id of NATIVE_AC_IDS.slice(0, -1)) {
      const row = nativeRow(output, id);
      expect(row?.outcome, id).toBe("incomplete");
      expect(row?.assertions.find((a) => a.id.endsWith(":source-report-readable"))?.actual, id).toBe(false);
    }
  });

  it("never upgrades readable mock reports from timed-out child execution to achieved technical rows", async () => {
    const output = await controlledProduce({ cwd, run: mappedControlledRun({ fault: "child-error" }) });
    for (const id of NATIVE_AC_IDS.slice(0, -1)) {
      expect(nativeRow(output, id)?.outcome, id).toBe("incomplete");
      expect(nativeRow(output, id)?.assertions.find((a) => a.id.endsWith(":source-report-readable"))?.actual, id).toBe(false);
    }
  });
});


describe("CARD-03 P6 closeout wiring/method text facts; original public reflection 未覆盖 (ORACLE-ACC-001)", () => {
  const file = "tests/contract/stage-closeout-step-contract.test.mjs";
  const id = `ORACLE-FIX-001:describe:${file}`;
  it("records passed closeout wiring/method text while original public reflection stays uncovered", async () => {
    const output = await controlledProduce({ cwd, run: mappedControlledRun() });
    expect(nativeRow(output, "AC-FIX-001")?.outcome).toBe("incomplete");
    const coverage = nativeRow(output, "AC-FIX-001")?.assertions.find((row) => row.id === "ORACLE-FIX-001:original-public-reflection-coverage");
    expect(coverage).toEqual({ id: "ORACLE-FIX-001:original-public-reflection-coverage", expected: "covered", actual: "未覆盖" });
    for (const ac of ["AC-FIX-001", "AC-ACC-001"]) {
      const observed = nativeRow(output, ac)?.assertions.find((row) => row.id === id);
      expect(observed, ac).toEqual({ id, expected: { status: "passed" }, actual: { status: "passed" } });
    }
    expect(nativeRow(output, "AC-ACC-001")?.outcome).toBe("incomplete"); // Existing authenticated native adverse context remains.
  });
  for (const fault of ["reflect-missing", "reflect-skipped", "reflect-failed"]) {
    it(`rejects ${fault} closeout text scope in FIX001 and aggregate independently of uncovered original behavior`, async () => {
      const output = await controlledProduce({ cwd, run: mappedControlledRun({ fault }) });
      expect(nativeRow(output, "AC-FIX-001")?.outcome).toBe("incomplete");
      for (const ac of ["AC-FIX-001", "AC-ACC-001"]) {
        const row = nativeRow(output, ac);
        expect(failedIds(row), ac).toContain(id);
        expect(row.assertions.find((assertion) => assertion.id === id)?.actual).toEqual({ status: fault === "reflect-missing" ? "missing" : "failed" });
      }
      const details = nativeRow(output, "AC-FIX-001")?.assertions.find((row) => row.id.endsWith(":required-scope-leaf-failures"))?.actual;
      expect(details).toEqual([`${file} > ORACLE-P1-CLOSEOUT-STEP stage closeout step and method contract > ${fault === "reflect-missing" ? "<missing scope>" : "closeout wiring/method text fact fixture"}`]);
    });
  }
});


describe("CARD-03 P6 review repair file-status and FIX004 oracle regression", () => {
  it("retains failed file status with passed leaves as an aggregate file error", () => {
    const report = greenReport();
    const file = report.testResults.find((row) => row.name === resolve(cwd, BINDING_CONSUMER));
    file.assertionResults = file.assertionResults.filter((row) => row.status === "passed");
    file.status = "failed";
    file.message = "Error: afterAll actual file-level failure";
    const facts = summarizeVitestReport(report, cwd).get(BINDING_CONSUMER);
    expect(facts.some((row) => row.status === "failed")).toBe(true);
    const entry = deriveCard03Entry({ vitest: vitestFacts(report), closure: closureGreen, observations: TARGET_OBSERVATIONS, cwd });
    expect(entry.outcome).toBe("incomplete");
    expect(entry.assertions.find((row) => row.id === "BASELINE:no-new-failures").actual).toContain(`${BINDING_CONSUMER} > <file error>`);
  });

  it("does not duplicate file errors already represented by the frozen failed leaves", () => {
    const report = greenReport();
    const reduced = summarizeVitestReport(report, cwd);
    const failures = [...reduced.values()].flat().filter((row) => row.status === "failed").map((row) => row.name);
    expect(failures.every((name) => BASELINE_FAILURES.includes(name))).toBe(true);
    expect(failures.some((name) => name.endsWith("<file error>"))).toBe(false);
  });

  for (const fault of [null, "binding-file-error"]) {
    it(`maps the same binding whole-file oracle into FIX004 and ACC for ${fault ?? "passed file"}`, async () => {
      const output = await controlledProduce({ cwd, run: mappedControlledRun({ fault }) });
      const id = `ORACLE-FIX-004:file:${BINDING_CONSUMER}`;
      for (const ac of ["AC-FIX-004", "AC-ACC-001"]) {
        expect(nativeRow(output, ac)?.assertions.find((row) => row.id === id), ac).toEqual({
          id, expected: { status: "passed" }, actual: { status: fault ? "failed" : "passed" },
        });
      }
      expect(nativeRow(output, "AC-FIX-004")?.outcome).toBe(fault ? "incomplete" : "achieved");
      expect(nativeRow(output, "AC-DISP-001")?.outcome).toBe("achieved");
      if (fault) expect(nativeRow(output, "AC-FIX-004")?.assertions.find((row) => row.id.endsWith(":required-scope-leaf-failures"))?.actual.length).toBeGreaterThan(0);
    });
  }
});


describe("CARD-03 P6 real native source read-only boundary", () => {
  it("reports missing native historical source as unknown rather than fabricating authenticated inheritance", async () => {
    const observations = await observeWorkspace(cwd);
    expect(observations.dispatch_evidence.status).toBe("unknown");
    expect(observations.dispatch_evidence.reason).toEqual(expect.any(String));
    expect(observations.dispatch_evidence.reason.length).toBeGreaterThan(0);
    expect(observations.dispatch_evidence.independent_initial_contexts).toBe("unknown");
    expect(observations.g1_actual_demonstration).toBe("unknown");
  });
});
