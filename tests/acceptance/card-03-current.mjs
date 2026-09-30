// CARD-03 当前范围验收（P6/T015，ORACLE-ACC-001）。
// 只读当前工作区事实并真跑一次有范围的 vitest 与 skill-closure，逐条产出 {id, expected, actual}。
// 不写 Task facts、不新增门、schema 字段或 CLI 动词；验收结论仍由独立上下文判读。
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ACCEPTANCE_CRITERION_ID = "AC-ACC-001";
export const CARD_DIR = "specs/workflowhub-thin-core-card-03-20260919";
export const STAGES = Object.freeze(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
export const ROOT_PROGRESS_FILES = Object.freeze([
  "HANDOFF-make-decision-card07.md", "HANDOFF-make-decision.md", "findings.md", "progress.md", "task_plan.md",
]);
export const RETIRED_ROOT_PROGRESS_DIR = "docs/archive/retired-root-progress";
export const RETIRED_TEMPLATES = Object.freeze([
  "skills/spec-plan/templates/plan-template.md", "skills/spec-tasks/templates/tasks-template.md",
]);
export const PHASE_TEMPLATE_FIELDS = Object.freeze(["接口符号", "合并责任", "progress_cursor"]);
export const FROZEN_VALIDATOR_RESULTS = Object.freeze([
  "pass", "fail", "inconclusive", "deferred", "missing", "inconsistent", "incomplete", "unavailable",
]);

// 基线：/tmp/pb-land/evidence/baseline.txt.files 与 baseline-failures.txt 原样固化（33 文件、38 条失败）。
export const BASELINE_FILES = Object.freeze([
  "tests/build-code-diff-only.test.mjs",
  "tests/contract/acceptance-result-machine-classes.test.mjs",
  "tests/contract/build-code-apply-contract.test.mjs",
  "tests/contract/card04-final-aggregate.test.mjs",
  "tests/contract/census-upstream-authoring.test.mjs",
  "tests/contract/filled-plan-task-production.test.mjs",
  "tests/contract/four-material-non-gate-contract.test.mjs",
  "tests/contract/freeze-classification-budget-usage-protocol.test.mjs",
  "tests/contract/governance-review-dispatch-boundary.test.mjs",
  "tests/contract/material-producer-consumer-roundtrip.test.mjs",
  "tests/contract/phase-quality-handoff.test.mjs",
  "tests/contract/plan-acceptance-task-gate.test.mjs",
  "tests/contract/post-cohort-authoring-files.test.mjs",
  "tests/contract/post-cohort-executable-authoring.test.mjs",
  "tests/contract/post-cohort-governance-materials.test.mjs",
  "tests/contract/post-cohort-spec-design-authority.test.mjs",
  "tests/contract/post-phase-contract.test.mjs",
  "tests/contract/review-materials-contract.test.mjs",
  "tests/contract/session-binding-removed.test.mjs",
  "tests/contract/spec-stage-artifact-closure.test.mjs",
  "tests/contract/stage-interaction-batching.test.mjs",
  "tests/contract/stage-reflection-e2e-constructed.test.mjs",
  "tests/contract/stage-reflection-skill-contract.test.mjs",
  "tests/contract/stage-routing-and-concrete-testing.test.mjs",
  "tests/contract/stage-skill-consumer-contract.test.mjs",
  "tests/contract/stage-skill-invocation-contract.test.mjs",
  "tests/contract/tier-c-deletion-boundary.test.mjs",
  "tests/contract/workflow-quality-regression.test.mjs",
  "tests/decision-log-content-contract.test.mjs",
  "tests/integration/distribution-closure.test.mjs",
  "tests/requirements-completeness-audit-acceptance.test.mjs",
  "tests/skill-provenance-strict.test.mjs",
  "tests/step-manifest.test.mjs",
]);
export const BASELINE_FAILURES = Object.freeze([
  "tests/contract/build-code-apply-contract.test.mjs > build-code apply quality contract > records task strategy and execution facts in the canonical step manifest",
  "tests/contract/build-code-apply-contract.test.mjs > build-code apply quality contract > requires per-phase execution facts and a final task strategy summary",
  "tests/contract/build-code-apply-contract.test.mjs > build-code apply quality contract > uses the plan route as a baseline and reroutes concrete testing against real scope",
  "tests/contract/card04-final-aggregate.test.mjs > ORACLE-CARD04-FINAL-AGGREGATE: P13/T024 ordinary final report > delivers a distinct final rendering and an independently authored, unchanged plain-language narrative",
  "tests/contract/card04-final-aggregate.test.mjs > ORACLE-CARD04-FINAL-AGGREGATE: P13/T024 ordinary final report > rejects absent, stale, displaced bad-news and unknown-laundered refs without creating receipts",
  "tests/contract/card04-final-aggregate.test.mjs > ORACLE-CARD04-FINAL-AGGREGATE: P13/T024 ordinary final report > requires the actual final artifact after P1–P12, with canonical gate and task identities",
  "tests/contract/freeze-classification-budget-usage-protocol.test.mjs > P7 AC-REBIND-001..003 freeze and confirmation text contracts > AC-REBIND-001 freezes make-decision materials after step 10 and removes the four agent-created sections",
  "tests/contract/freeze-classification-budget-usage-protocol.test.mjs > P7 AC-REBIND-001..003 freeze and confirmation text contracts > AC-REBIND-003 makes tasks.md execution status the only post-confirmation writable area",
  "tests/contract/freeze-classification-budget-usage-protocol.test.mjs > Phase 3 canonical review reuse and explicit retry contracts > keeps phase review lineage separate from the integration review lineage",
  "tests/contract/governance-review-dispatch-boundary.test.mjs > governance review dispatch boundary > keeps standard workflow without a unified budget gate",
  "tests/contract/material-producer-consumer-roundtrip.test.mjs > material producer and consumer round-trip > RED: makes the phase the sole engineering body and tasks a pure execution index",
  "tests/contract/phase-quality-handoff.test.mjs > Phase quality and handoff contract > keeps the post Phase index pointer-only",
  "tests/contract/phase-quality-handoff.test.mjs > Phase quality and handoff contract > renders post-cohort handoff pointers without resurrecting plan/tasks",
  "tests/contract/post-phase-contract.test.mjs > post-cohort independent Phase authority > accepts independent parallel Phases with no artificial serial edge",
  "tests/contract/post-phase-contract.test.mjs > post-cohort independent Phase authority > accepts two separate Phase files with one pure pointer index",
  "tests/contract/post-phase-contract.test.mjs > post-cohort independent Phase authority > keeps an explicitly deferred AC visible in history but outside current formal coverage",
  "tests/contract/post-phase-contract.test.mjs > post-cohort independent Phase authority > uses the Phase files as the strict post build-plan analysis inputs",
  "tests/contract/review-materials-contract.test.mjs > current review material and capture contracts > delivers external implementation and test shards with manifest and packet-plan bindings",
  "tests/contract/review-materials-contract.test.mjs > current review material and capture contracts > selects every reviewable implementation and test diff above 486777B",
  "tests/contract/stage-reflection-skill-contract.test.mjs > stage-reflection skill contract > declares the v2 six-block judgment protocol and a valid bundle",
  "tests/contract/stage-routing-and-concrete-testing.test.mjs > D-015 stage routing and concrete testing contract > declares real build-code route facts while quality limits completion",
  "tests/contract/tier-c-deletion-boundary.test.mjs > Tier-C quality verify deletion boundary > updates active governance and the public-behavior fixture without rewriting immutable history",
  "tests/contract/workflow-quality-regression.test.mjs > workflow quality regression and historical replay > keeps spec-analyze on authoring stages and code review on verify-code",
  "tests/integration/distribution-closure.test.mjs > P5 released workflow source rejects missing bytes after a valid baseline",
  "tests/integration/distribution-closure.test.mjs > P5 released workflow source rejects tampered bytes after a valid baseline",
  "tests/integration/distribution-closure.test.mjs > carries the canonical shared definitions owner through the runner import closure",
  "tests/integration/distribution-closure.test.mjs > portable build-prd workflow closure > contains the five workflows and their declared skill closure only",
  "tests/integration/distribution-closure.test.mjs > portable build-prd workflow closure > rejects a forbidden declared asset instead of silently dropping it",
  "tests/integration/distribution-closure.test.mjs > portable build-prd workflow closure > rejects an unsafe release manifest file",
  "tests/integration/distribution-closure.test.mjs > portable build-prd workflow closure > rejects hard-linked release source files",
  "tests/integration/distribution-closure.test.mjs > portable build-prd workflow closure > rejects removal of the persisted portable workflow closure",
  "tests/integration/distribution-closure.test.mjs > portable build-prd workflow closure > rejects unmanifested files in a closed release",
  "tests/integration/distribution-closure.test.mjs > portable build-prd workflow closure > rejects valid-hash extra files added to the manifest and disk",
  "tests/requirements-completeness-audit-acceptance.test.mjs > requirements-completeness-audit current acceptance matrix > AC-015: current four materials are authoritative",
  "tests/requirements-completeness-audit-acceptance.test.mjs > requirements-completeness-audit current acceptance matrix > AC-025: content skills and templates are consumed",
  "tests/requirements-completeness-audit-acceptance.test.mjs > requirements-completeness-audit current acceptance matrix > AC-029: restored content skills have auditable provenance",
  "tests/step-manifest.test.mjs > canonical step manifest > RED: establishes the OI before research and keeps the three consumer duties separate",
  "tests/step-manifest.test.mjs > canonical step manifest > keeps all five portable manifests on four materials and quality facts without legacy control-plane containers",
]);

// 本卡各 Phase 声称要转绿的整文件（P1/T002、P2/T004、P5/T014）。
export const CLAIMED_GREEN_FILES = Object.freeze({
  "tests/p0-foundation-contracts.test.mjs": "P1/T002",
  "tests/contract/material-producer-consumer-roundtrip.test.mjs": "P2/T004",
  "tests/contract/build-code-apply-contract.test.mjs": "P5/T014",
  "tests/contract/review-step-forward-progress.test.mjs": "P5/T014",
  "tests/contract/post-phase-contract.test.mjs": "P5/T014",
  "tests/contract/phase-quality-handoff.test.mjs": "P5/T014",
});

const DISPATCH = "tests/contract/card03-dispatch-method.test.mjs";
const REVIEW = "tests/contract/card03-review-orchestration.test.mjs";
const SCHEMA = "tests/contract/ac-evidence-schema-domain.test.mjs";
const MATERIAL = "tests/contract/material-set-per-stage.test.mjs";
const RUNTIME_BINDING = "tests/contract/card03-runtime-binding.test.mjs";

export const ORACLE_DESCRIBES = Object.freeze({
  "ORACLE-DISP-001": [DISPATCH, "card-03 T001 dispatch method text (ORACLE-DISP-001)"],
  "ORACLE-DISP-003": [DISPATCH, "card-03 T002 document realignment (ORACLE-DISP-003)"],
  "ORACLE-REV-001": [REVIEW, "ORACLE-REV-001 review request precheck, bad results and packet narrowing"],
  "ORACLE-REV-002": [REVIEW, "ORACLE-REV-002 partial coverage and same-triple reuse"],
  "ORACLE-SKL-003": [REVIEW, "ORACLE-SKL-003 runner reviewer skills follow stage-skill-plan.json"],
  "ORACLE-FIX-002": [SCHEMA, "ORACLE-FIX-002 ac-evidence-summary schema domain matches the frozen validator"],
});

export const ORACLE_WHOLE_FILES = Object.freeze({
  "ORACLE-SKL-001": ["tests/skill-provenance-strict.test.mjs"],
  "ORACLE-SKL-002": ["tests/contract/material-producer-consumer-roundtrip.test.mjs"],
  "ORACLE-RT-001": [RUNTIME_BINDING],
  "ORACLE-RT-002": ["tests/contract/review-budget-deletion.test.mjs"],
  "ORACLE-FIX-001": [MATERIAL],
  "ORACLE-FIX-003": ["tests/build-code-diff-only.test.mjs"],
  "ORACLE-FIX-004": [
    "tests/contract/build-code-apply-contract.test.mjs", "tests/contract/review-step-forward-progress.test.mjs",
    "tests/contract/post-phase-contract.test.mjs", "tests/contract/phase-quality-handoff.test.mjs",
  ],
});

export const ORACLE_IDS = Object.freeze([
  "ORACLE-DISP-001", "ORACLE-DISP-003", "ORACLE-SKL-001", "ORACLE-SKL-002", "ORACLE-DISP-002", "ORACLE-RT-001",
  "ORACLE-RT-002", "ORACLE-REV-001", "ORACLE-REV-002", "ORACLE-SKL-003", "ORACLE-FIX-002", "ORACLE-FIX-001",
  "ORACLE-FIX-003", "ORACLE-FIX-004",
]);
export const PRD_ACS = Object.freeze(["AC-11", "AC-12", "AC-13", "AC-14", "AC-15"]);

// 一次有范围的 vitest：基线 33 文件 + 本卡新增/改动测试；不含本验收测试自身，不跑全量。
export const RUN_FILES = Object.freeze([...new Set([
  ...BASELINE_FILES, DISPATCH, REVIEW, SCHEMA, MATERIAL, RUNTIME_BINDING,
  "tests/p0-foundation-contracts.test.mjs", "tests/contract/review-step-forward-progress.test.mjs",
  "tests/contract/review-budget-deletion.test.mjs", "tests/contract/review-material-change-redispatch.test.mjs",
])]);

const read = (cwd, path) => readFileSync(join(cwd, path), "utf8");
const readOptional = (cwd, path) => (existsSync(join(cwd, path)) ? read(cwd, path) : "");

export function dispatchSection(text) {
  const lines = String(text ?? "").split("\n");
  const start = lines.findIndex((line) => /^#{2,3} .*按工作类型派子代理/.test(line));
  if (start < 0) return null;
  const level = lines[start].match(/^#+/)[0].length;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => {
    const heading = line.match(/^(#+) /);
    return heading && heading[1].length <= level;
  });
  return [lines[start], ...(end < 0 ? rest : rest.slice(0, end))].join("\n");
}

function criterionEnums(schema) {
  const stack = [schema];
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;
    const props = node.properties;
    if (props && props.result && props.leaf_result && props.status) {
      return { result: props.result.enum ?? [], leaf_result: props.leaf_result.enum ?? [], status: props.status.enum ?? [] };
    }
    stack.push(...Object.values(node));
  }
  return null;
}

// 当前工作区的可观察事实（纯读 + 一次纯函数调用），与 vitest 结果无关。
export async function observeWorkspace(cwd = process.cwd()) {
  const skills = Object.fromEntries(STAGES.map((stage) => [stage, readOptional(cwd, `workflows/${stage}/SKILL.md`)]));
  const sections = Object.fromEntries(STAGES.map((stage) => [stage, dispatchSection(skills[stage])]));
  const agents = readOptional(cwd, "AGENTS.md");
  const decisionLog = readOptional(cwd, `${CARD_DIR}/decision-log.md`);
  const phaseTemplate = readOptional(cwd, "skills/spec-plan/templates/phase-template.md");
  const spec = readOptional(cwd, `${CARD_DIR}/spec.md`);

  const bundleShaPaths = [];
  let bundleCount = 0;
  for (const name of readdirSync(join(cwd, "skills")).sort()) {
    const path = `skills/${name}/skill-bundle.json`;
    if (!existsSync(join(cwd, path))) continue;
    bundleCount += 1;
    const bundle = JSON.parse(read(cwd, path));
    if ((bundle.files ?? []).some((file) => file && Object.hasOwn(file, "sha256"))) bundleShaPaths.push(path);
  }

  let schemaMissing;
  try {
    const enums = criterionEnums(JSON.parse(read(cwd, "runtime/review/schemas/ac-evidence-summary.schema.json")));
    const validator = read(cwd, "runtime/evidence/acceptance-evidence-validator.mjs")
      .match(/const ACCEPTANCE_RESULTS = (\[[^\]]*\]);/);
    const values = validator ? JSON.parse(validator[1].replace(/'/g, "\"")) : null;
    schemaMissing = enums && values
      ? Object.fromEntries(Object.entries(enums).map(([field, allowed]) => [field, values.filter((v) => !allowed.includes(v))]))
      : { error: "criterion enums or validator domain not found" };
    if (values && JSON.stringify(values) !== JSON.stringify(FROZEN_VALIDATOR_RESULTS)) schemaMissing = { error: "validator domain changed" };
  } catch (error) {
    schemaMissing = { error: error.message };
  }

  let makeDecisionMaterialSet;
  try {
    const mod = await import(pathToFileURL(join(cwd, "runtime/task/material-workspace.mjs")).href);
    makeDecisionMaterialSet = [...mod.materialFilesForCohort("post", { "decision-log.md": "# d\n" }, { stage: "make-decision" })];
  } catch (error) {
    makeDecisionMaterialSet = { error: error.message };
  }

  const stageSource = readOptional(cwd, "runtime/task/task-store.mjs").match(/const STAGES = new Set\((\[[^\]]*\])\)/);
  const buildCode = skills["build-code"];
  return {
    dispatch_sections_citing_agents: STAGES.filter((stage) => sections[stage] && sections[stage].includes("AGENTS.md")),
    build_code_original_implementer: Boolean(sections["build-code"]
      && sections["build-code"].includes("原实施子代理") && sections["build-code"].includes("连续上下文")),
    g1_method_terms: {
      build_code: ["G-1", "停并行", "重排", "作废批次"].filter((term) => buildCode.includes(term)),
      build_plan: ["G-1"].filter((term) => skills["build-plan"].includes(term)),
    },
    agents_clauses: [
      /不整份继承[^\n]*上下文/.test(agents) && "不整份继承上下文",
      /不空转轮询/.test(agents) && "不空转轮询",
      /跨 Phase 不[^\n]*全量快照/.test(agents) && "跨 Phase 不绑定全量快照",
    ].filter(Boolean),
    root_progress_in_root: ROOT_PROGRESS_FILES.filter((file) => existsSync(join(cwd, file))),
    root_progress_archived: ROOT_PROGRESS_FILES.filter((file) => existsSync(join(cwd, RETIRED_ROOT_PROGRESS_DIR, file))),
    bundle_count: bundleCount,
    bundle_per_file_sha_paths: bundleShaPaths,
    retired_templates_present: RETIRED_TEMPLATES.filter((file) => existsSync(join(cwd, file))),
    phase_template_fields_missing: PHASE_TEMPLATE_FIELDS.filter((field) => !phaseTemplate.includes(field)),
    stage_runtime_review_budget: readOptional(cwd, "tools/cli/stage-runtime.mjs").includes("\"review_budget\""),
    schema_missing: schemaMissing,
    make_decision_material_set: makeDecisionMaterialSet,
    c2_irreversible_rules_present: readOptional(cwd, "workflows/build-code/diff-scanner.mjs").includes("C2_IRREVERSIBLE_GIT_RULES"),
    threshold_registered: /### 二、阶段豁免表与「大量读写」的可指认阈值/.test(decisionLog)
      && ["500 字", "目录级批量扫描", "≥3 个文件"].every((term) => decisionLog.includes(term)),
    g1_drill_steps: /### 八、G-1 演练记录/.test(decisionLog)
      ? ["①停并行", "②主会话重排", "③作废批次登记"].filter((step) => decisionLog.includes(step)) : [],
    r006_deferred_registered: /^\| R-006 \| deferred \|/m.test(decisionLog),
    spec_work_package_declaration: /工作包声明：读集、写集、文件 owner、接口符号清单、合并责任/.test(spec),
    canonical_stages: stageSource ? JSON.parse(stageSource[1]) : null,
    build_prd_na_reason: readOptional(cwd, "workflows/build-prd/SKILL.md")
      .includes("Do not add `build-prd` to the canonical five stages"),
  };
}

// 把 vitest JSON 报告折叠成 file -> [{name, describe, status}]；导入即失败的文件记一条文件级失败。
export function summarizeVitestReport(report, cwd) {
  const byFile = new Map();
  for (const file of report?.testResults ?? []) {
    const path = relative(cwd, file.name).split("\\").join("/");
    const tests = (file.assertionResults ?? []).map((a) => ({
      name: `${path} > ${[...(a.ancestorTitles ?? []), a.title].join(" > ")}`,
      describe: (a.ancestorTitles ?? [])[0] ?? null,
      status: a.status,
    }));
    if (tests.length === 0 && file.status === "failed") tests.push({ name: `${path} > <file error>`, describe: null, status: "failed" });
    byFile.set(path, tests);
  }
  return byFile;
}

const wholeFileStatus = (byFile, file) => {
  const tests = byFile.get(file);
  if (!tests) return "missing";
  return tests.some((t) => t.status === "passed") && !tests.some((t) => t.status === "failed") ? "passed" : "failed";
};
const describeStatus = (byFile, file, title) => {
  const tests = (byFile.get(file) ?? []).filter((t) => t.describe === title);
  if (tests.length === 0) return "missing";
  return tests.some((t) => t.status === "passed") && !tests.some((t) => t.status === "failed") ? "passed" : "failed";
};

export function deriveCard03Entry({ vitest, closure, observations, cwd }) {
  const byFile = summarizeVitestReport(vitest?.report, cwd);
  const o = observations;
  const passed = { status: "passed" };
  const a = (id, expected, actual) => ({ id, expected, actual });
  const failing = [...byFile.values()].flat().filter((t) => t.status === "failed").map((t) => t.name);
  const baseline = new Set(BASELINE_FAILURES);

  const assertions = [
    a("BASELINE:vitest-report-parsed", true, Boolean(vitest?.report) && !vitest?.timed_out && [0, 1].includes(vitest?.exit_code)),
    a("BASELINE:all-run-files-executed", [], RUN_FILES.filter((file) => !byFile.has(file))),
    a("BASELINE:no-new-failures", [], failing.filter((name) => !baseline.has(name)).sort()),
    ...Object.entries(CLAIMED_GREEN_FILES).map(([file, owner]) =>
      a(`BASELINE:claimed-green:${owner}:${file}`, passed, { status: wholeFileStatus(byFile, file) })),

    a("ORACLE-DISP-001:five-dispatch-sections-cite-agents", [...STAGES], o.dispatch_sections_citing_agents),
    a("ORACLE-DISP-003:root-progress-archived", { in_root: [], archived: [...ROOT_PROGRESS_FILES] },
      { in_root: o.root_progress_in_root, archived: o.root_progress_archived }),
    a("ORACLE-SKL-001:no-per-file-sha", { bundles_present: true, per_file_sha: [] },
      { bundles_present: o.bundle_count > 0, per_file_sha: o.bundle_per_file_sha_paths }),
    a("ORACLE-SKL-002:retired-templates-absent", [], o.retired_templates_present),
    a("ORACLE-SKL-002:skill-closure", { exit_code: 0, stderr: "" },
      { exit_code: closure?.exit_code ?? null, stderr: String(closure?.stderr ?? "").trim() }),
    a("ORACLE-DISP-002:phase-template-fields", [], o.phase_template_fields_missing),
    a("ORACLE-RT-002:no-review-budget-run-field", false, o.stage_runtime_review_budget),
    a("ORACLE-FIX-002:schema-covers-validator", { result: [], leaf_result: [], status: [] }, o.schema_missing),
    a("ORACLE-FIX-001:make-decision-needs-decision-log-only", ["decision-log.md"], o.make_decision_material_set),
    a("ORACLE-FIX-003:no-c2-irreversible-rules", false, o.c2_irreversible_rules_present),
    ...Object.entries(ORACLE_DESCRIBES).map(([oracle, [file, title]]) =>
      a(`${oracle}:describe:${file}`, passed, { status: describeStatus(byFile, file, title) })),
    ...Object.entries(ORACLE_WHOLE_FILES).flatMap(([oracle, files]) =>
      files.map((file) => a(`${oracle}:file:${file}`, passed, { status: wholeFileStatus(byFile, file) }))),

    // 母 PRD 验收第 11–15 条：每条至少一条能真实失败的观察。
    a("PRD-AC-11:repair-returns-to-original-implementer", true, o.build_code_original_implementer),
    a("PRD-AC-11:real-multi-package-run-deferral-registered", true, o.r006_deferred_registered),
    a("PRD-AC-12:agents-delegation-clauses", ["不整份继承上下文", "不空转轮询", "跨 Phase 不绑定全量快照"], o.agents_clauses),
    a("PRD-AC-12:bulk-read-write-threshold-registered", true, o.threshold_registered),
    a("PRD-AC-13:work-package-declaration", { template_missing: [], spec_declared: true },
      { template_missing: o.phase_template_fields_missing, spec_declared: o.spec_work_package_declaration }),
    a("PRD-AC-14:g1-drill-record", ["①停并行", "②主会话重排", "③作废批次登记"], o.g1_drill_steps),
    a("PRD-AC-14:g1-method-text", { build_code: ["G-1", "停并行", "重排", "作废批次"], build_plan: ["G-1"] }, o.g1_method_terms),
    a("PRD-AC-15:five-stage-dispatch-instances", { canonical: [...STAGES], dispatch: [...STAGES] },
      { canonical: o.canonical_stages, dispatch: o.dispatch_sections_citing_agents }),
    a("PRD-AC-15:build-prd-not-applicable-reason", true, o.build_prd_na_reason && !(o.canonical_stages ?? []).includes("build-prd")),
  ];
  const failed = assertions.filter((x) => JSON.stringify(x.expected) !== JSON.stringify(x.actual)).map((x) => x.id);
  return {
    acceptance_criterion_id: ACCEPTANCE_CRITERION_ID,
    outcome: failed.length === 0 ? "achieved" : "incomplete",
    ...(failed.length === 0 ? {} : { owner: "CARD-03 P6/T015", reason: `observable assertions not met: ${failed.join(", ")}` }),
    assertions,
  };
}

function capture(result, extra = {}) {
  return {
    ...extra,
    exit_code: Number.isInteger(result.status) ? result.status : null,
    signal: result.signal ?? null,
    timed_out: result.error?.code === "ETIMEDOUT",
    error: result.error ? { code: result.error.code ?? "CHILD_PROCESS_ERROR", message: result.error.message } : null,
    stderr: String(result.stderr ?? "").slice(-4000),
  };
}

export function runScopedVitest({ run = spawnSync, cwd = process.cwd(), timeoutMs = 600000 } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "card03-acceptance-"));
  const outputFile = join(dir, "vitest-report.json");
  try {
    const args = ["--no-install", "vitest", "run", ...RUN_FILES, "--reporter=json", `--outputFile=${outputFile}`];
    const result = run("npx", args, { cwd, encoding: "utf8", timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
    const report = existsSync(outputFile) ? JSON.parse(readFileSync(outputFile, "utf8")) : null;
    return { ...capture(result, { command: "npx", args: args.map((arg) => (arg === `--outputFile=${outputFile}` ? "--outputFile=<tmp>" : arg)) }), report };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function runSkillClosure({ run = spawnSync, cwd = process.cwd() } = {}) {
  const args = ["runtime/evidence/check-skill-closure.mjs"];
  return capture(run(process.execPath, args, { cwd, encoding: "utf8", timeout: 60000, stdio: ["ignore", "pipe", "pipe"] }), { command: "node", args });
}

export async function produceCard03Current({ cwd = process.cwd(), run = spawnSync } = {}) {
  const vitest = runScopedVitest({ run, cwd });
  const closure = runSkillClosure({ run, cwd });
  const observations = await observeWorkspace(cwd);
  const entry = deriveCard03Entry({ vitest, closure, observations, cwd });
  const { report, ...vitestFacts } = vitest;
  return {
    schema_version: "card03-current-acceptance.v1",
    commands: [{ ...vitestFacts, failed_tests: report?.numFailedTests ?? null }, closure],
    observations,
    prd_acceptance: Object.fromEntries(PRD_ACS.map((ac) => [ac, entry.assertions.filter((x) => x.id.startsWith(`PRD-${ac}:`)).map((x) => x.id)])),
    entries: [entry],
  };
}

async function main() {
  const output = await produceCard03Current();
  process.stdout.write(`${JSON.stringify(output)}\n`);
  process.exitCode = output.entries.every((entry) => entry.outcome === "achieved") ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) await main();
