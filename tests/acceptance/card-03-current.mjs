// CARD-03 当前范围验收（P6/T015，ORACLE-ACC-001）。
// 只读当前工作区事实并真跑一次有范围的 vitest 与 skill-closure，逐条产出 {id, expected, actual}。
// 不写 Task facts、不新增门、schema 字段或 CLI 动词；验收结论仍由独立上下文判读。
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { resolveWorkflowHubIdentity } from "../../tools/cli/stage-runtime.mjs";
import { openTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync } from "node:fs";
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
  "tests/integration/distribution-closure.test.mjs": "P2/T004",
  "tests/integration/runner-clean-install.test.mjs": "P2/T004",
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
  "ORACLE-FIX-001": ["tests/contract/stage-reflection-e2e-constructed.test.mjs", "CARD-03 P6 post decision-only make-decision public reflection (ORACLE-FIX-001)"],
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
    "tests/contract/verify-code-binding-derivation.test.mjs",
  ],
});

export const ORACLE_IDS = Object.freeze([
  "ORACLE-DISP-001", "ORACLE-DISP-003", "ORACLE-SKL-001", "ORACLE-SKL-002", "ORACLE-DISP-002", "ORACLE-RT-001",
  "ORACLE-RT-002", "ORACLE-REV-001", "ORACLE-REV-002", "ORACLE-SKL-003", "ORACLE-FIX-002", "ORACLE-FIX-001",
  "ORACLE-FIX-003", "ORACLE-FIX-004",
]);
export const PRD_ACS = Object.freeze(["AC-11", "AC-12", "AC-13", "AC-14", "AC-15"]);

// 一次有范围的 vitest：基线 33 文件 + 本卡新增/改动测试；不含本验收测试自身，不跑全量。
export const RUN_FILES = Object.freeze([
  "core/__tests__/check-skill-closure.test.mjs",
  "core/__tests__/stage-skill-runtime.test.mjs",
  "scripts/__tests__/smoke-local-skill-dispatch.test.mjs",
  "tests/build-code-diff-only.test.mjs",
  "tests/contract/ac-evidence-schema-domain.test.mjs",
  "tests/contract/acceptance-result-machine-classes.test.mjs",
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
  "tests/contract/stage-reflection-e2e-constructed.test.mjs",
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
const RESTRICTED = Object.freeze([
  { file: "core/__tests__/stage-skill-runtime.test.mjs", pattern: "uses current aggregate bytes rather than a legacy per-asset hash", expected: 1 },
  { file: "tests/contract/review-history-canonical-reader.test.mjs", pattern: "A①|A②|B foreign|C 负控|D 负控|E 形状|rejects .* within an otherwise eligible legacy partial shape", expected: 9 },
  { file: "tests/contract/build-code-targeted-capture.test.mjs", expected: 24, legacy_failures: 7 },
]);
const NODE_ONLY = "tests/contract/ui-frontend-governance.test.mjs";
const FULL_VITEST_FILES = Object.freeze(RUN_FILES.filter((file) => file !== NODE_ONLY && !RESTRICTED.some((scope) => scope.file === file)));
const MECHANISMS = Object.freeze([
  {
    "id": "M1",
    "path": "workflows/build-plan/SKILL.md",
    "anchor": "确认问题按**三选一**提出"
  },
  {
    "id": "M2",
    "path": "workflows/build-code/SKILL.md",
    "anchor": "执行本 Phase 记录的那条 route 与其 `gate_cmd`，命令按字面跑，不换成别的命令，也不用全量回归代替"
  },
  {
    "id": "M3",
    "path": "workflows/build-code/SKILL.md",
    "anchor": "重试前自述一行并写进本 Phase 的 task facts"
  },
  {
    "id": "M4",
    "path": "skills/plan-eng-review/SKILL.md",
    "anchor": "加删同价的读数（report-only）"
  },
  {
    "id": "M5",
    "path": "workflows/build-code/SKILL.md",
    "anchor": "整树丢弃类动作（`git restore/reset/checkout -- :/`）与 delete+add 整体替换权威材料属于**销毁性动作**"
  },
  {
    "id": "E1",
    "path": "skills/spec-plan/SKILL.md",
    "anchor": "One Task is one user-perceivable delivery increment"
  },
  {
    "id": "E2",
    "path": "skills/spec-plan/SKILL.md",
    "anchor": "A superseded full-text body does not stay in this file either"
  },
  {
    "id": "E3",
    "path": "skills/decision-log/SKILL.md",
    "anchor": "The main document and every accepted omission use the same"
  },
  {
    "id": "E4",
    "path": "skills/decision-log/SKILL.md",
    "anchor": "load-bearing review finding, and load-bearing decision."
  },
  {
    "id": "E5",
    "path": "workflows/build-plan/SKILL.md",
    "anchor": "is a legitimate registration, not a gap to close."
  },
  {
    "id": "E6",
    "path": "workflows/build-plan/SKILL.md",
    "anchor": "the split must pass two checks — there is at least one slice"
  },
  {
    "id": "E7",
    "path": "skills/spec-plan/templates/phase-template.md",
    "anchor": "本来可以成为要做的目标、但本 Phase 明确不选的项，写清不选的理由；不要写成否定句"
  },
  {
    "id": "E8",
    "path": "skills/spec-plan/templates/phase-template.md",
    "anchor": "最可能让本 Phase 返工的一件事，以及**若因它返工，替代走法是什么**"
  },
  {
    "id": "E9",
    "path": "skills/spec-plan/templates/phase-template.md",
    "anchor": "验收项必须写成**没参与实现的人能用一条命令重放**的判据"
  },
  {
    "id": "E10",
    "path": "workflows/build-code/SKILL.md",
    "anchor": "续跑的第一步是**先对现实**：跑 `git status --short`，再跑本 Phase"
  },
  {
    "id": "E11",
    "path": "workflows/build-code/SKILL.md",
    "anchor": "`remaining risks` 段必须对本期**失败信号**给一句成句解读"
  },
  {
    "id": "E12",
    "path": "workflows/build-code/SKILL.md",
    "anchor": "**进展 = 交付锚**（新提交或新证据），不是动作次数"
  },
  {
    "id": "E13",
    "path": "docs/standard-workflow.md",
    "anchor": "**完成声明的上限 = 独立来源的结论**；该结论为 `adverse` 或 `unavailable` 时，只能声明到该结论允许的程度"
  },
  {
    "id": "E14",
    "path": "skills/simplicity-guard/SKILL.md",
    "anchor": "的结论在写作流程里有三处调用点，全部落在既有字段上，不新增产物或字段"
  },
  {
    "id": "E15",
    "path": "skills/spec-specify/SKILL.md",
    "anchor": "self-check with `simplicity-guard`'s core questions (has this layer earned its place"
  },
  {
    "id": "E16",
    "path": "skills/spec-plan/SKILL.md",
    "anchor": "run the same self-check with `simplicity-guard`'s core questions"
  }
]);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

function actualTaskContext(cwd) {
  const root = realpathSync(cwd), identity = resolveWorkflowHubIdentity({}, root);
  const task = openTask(identity.taskPath, identity.project, identity.task);
  const workspace = openCurrentTaskWorkspace(task);
  if (workspace.worktreeRoot !== root || identity.task !== CARD_DIR.split("/").at(-1)) throw new Error("acceptance task/worktree identity mismatch");
  return { task, workspace, kernel: createTaskKernel(task, { workspace }) };
}

function mechanismReadback(cwd) {
  return MECHANISMS.map(({ id, path, anchor }) => {
    try {
      const bytes = readFileSync(join(cwd, path));
      const matches = bytes.toString("utf8").split(/\r?\n/).flatMap((text, index) => text.includes(anchor) ? [{ line: index + 1, text }] : []);
      return { id, path, anchor, present: matches.length > 0, file_sha256: hash(bytes), matches };
    } catch (error) { return { id, path, anchor, present: false, error: error.message, matches: [] }; }
  });
}

function nativeDispatchReadback(cwd) {
  try {
    const { task } = actualTaskContext(cwd);
    const ref = "quality/evidence/card03/host-collaboration-source/selection-index.json";
    const raw = task.readRecord(ref), index = JSON.parse(raw);
    const nativePath = realpathSync(index.source_path);
    const nativeRoot = realpathSync(join(homedir(), ".codex", "sessions"));
    if (!nativePath.startsWith(`${nativeRoot}/`) || !nativePath.endsWith(".jsonl")) throw new Error("native source is not a host session log");
    const length = index.observed_prefix?.length_bytes;
    if (!Number.isSafeInteger(length) || length < 1 || length > 64 * 1024 * 1024) throw new Error("native prefix bound is invalid");
    const prefix = readFileSync(nativePath).subarray(0, length);
    if (prefix.length !== length || hash(prefix) !== index.observed_prefix.sha256) throw new Error("native prefix hash mismatch");
    const nativeLines = prefix.toString("utf8").split(/(?<=\n)/);
    const selectedRaw = readFileSync(index.raw_ref);
    if (realpathSync(index.raw_ref) !== realpathSync(join(task.taskPath, "quality/evidence/card03/host-collaboration-source/native-prefix-selected-lines.jsonl"))
        || hash(selectedRaw) !== index.raw_sha256) throw new Error("native selected attachment identity/hash mismatch");
    const expectedLines = index.line_index.map((entry) => {
      const bytes = Buffer.from(nativeLines[entry.source_line - 1] ?? "");
      if (bytes.length !== entry.bytes || hash(bytes) !== entry.sha256) throw new Error("native selected line hash mismatch");
      return bytes;
    });
    if (!Buffer.concat(expectedLines).equals(selectedRaw)) throw new Error("selected attachment differs from original native lines");
    const rows = selectedRaw.toString("utf8").trimEnd().split("\n").map((line) => JSON.parse(line));
    const session = rows.find((row) => row.type === "session_meta")?.payload;
    if (!session || session.id !== index.root_session.id || session.thread_source !== "user") throw new Error("native root context identity mismatch");
    const returns = new Map(rows.filter((row) => row.payload?.type === "function_call_output").map((row) => [row.payload.call_id, row.payload.output]));
    const actors = [], forks = [];
    for (const row of rows) {
      if (row.payload?.type !== "function_call" || row.payload.name !== "spawn_agent") continue;
      const args = JSON.parse(row.payload.arguments), result = JSON.parse(returns.get(row.payload.call_id) ?? "null");
      if (!result?.task_name?.startsWith("/root/") || !args.task_name || !result.task_name.endsWith(`/${args.task_name}`)) throw new Error("native actor matched return is unavailable");
      actors.push(`${session.id}:${result.task_name}`); forks.push(args.fork_turns ?? "all");
    }
    if (actors.length < 2 || new Set(actors).size !== actors.length) throw new Error("native multi-actor fanout incomplete");
    return { status: "verified", source_ref: ref, source_sha256: hash(raw), native_prefix_sha256: hash(prefix),
      selected_raw_sha256: hash(selectedRaw), root_context_id: session.id, canonical_actor_contexts: actors,
      initial_fork_modes: forks, independent_initial_contexts: forks.every((mode) => mode === "none"),
      concurrent_running_packages: "unknown", independent_role_contexts: "unknown", repair_to_original: "unknown",
      main_activity_compliant: "unknown", token_savings: "unknown",
      limitation: "Native root UUID + canonical agent names only; encrypted message bodies/child UUIDs/actual concurrency are not proved." };
  } catch (error) { return { status: "unknown", reason: error.message, independent_initial_contexts: "unknown" }; }
}

function archiveRaw(context, raw, scope) {
  const facts = {};
  for (const stream of ["stdout", "stderr"]) {
    const bytes = raw[stream];
    if (!Buffer.isBuffer(bytes)) throw new Error("acceptance child stream must retain original bytes");
    const sha = hash(bytes), ref = `quality/evidence/stage-quality/build-code/acceptance-${stream}-${sha}.bin`;
    const saved = context.kernel.publishCanonicalRecord(ref, bytes);
    if (!readFileSync(join(context.task.taskPath, ref)).equals(bytes)) throw new Error("acceptance stream archive readback mismatch");
    facts[stream] = { ...saved, bytes: bytes.length, original_sha256: sha };
  }
  if (Buffer.isBuffer(raw.report)) {
    const sha = hash(raw.report), text = raw.report.toString("utf8"), lossless = Buffer.from(text).equals(raw.report) && text.length > 0;
    const ref = `quality/tests/card03/P6/${scope}-report-${sha}.${lossless ? "json" : "base64.txt"}`;
    const saved = context.kernel.publishCanonicalRecord(ref, lossless ? text : `${raw.report.toString("base64")}\n`);
    const archived = readFileSync(join(context.task.taskPath, ref));
    const decoded = lossless ? archived : Buffer.from(archived.toString("utf8").trim(), "base64");
    if (!decoded.equals(raw.report)) throw new Error("acceptance JSON original bytes archive mismatch");
    facts.report = { ...saved, encoding: lossless ? "utf8" : "base64", original_sha256: sha, bytes: raw.report.length };
  }
  return facts;
}

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
    mechanism_readback: mechanismReadback(cwd),
    dispatch_evidence: nativeDispatchReadback(cwd),
    g1_actual_demonstration: "unknown",
    build_prd_na_reason: readOptional(cwd, "workflows/build-prd/SKILL.md")
      .includes("Do not add `build-prd` to the canonical five stages"),
  };
}

// 把 vitest JSON 报告折叠成 file -> [{name, describe, status}]；导入即失败的文件记一条文件级失败。
export function summarizeVitestReport(report, cwd) {
  const byFile = new Map();
  for (const file of Array.isArray(report?.testResults) ? report.testResults : []) {
    const path = relative(cwd, file.name).split("\\").join("/");
    const tests = (Array.isArray(file.assertionResults) ? file.assertionResults : []).map((a) => ({
      name: `${path} > ${[...(a.ancestorTitles ?? []), a.title].join(" > ")}`,
      describe: (a.ancestorTitles ?? [])[0] ?? null,
      status: a.status,
    }));
    if (file.status === "failed" && !tests.some((test) => test.status === "failed")) tests.push({ name: `${path} > <file error>`, describe: null, status: "failed" });
    byFile.set(path, tests);
  }
  return byFile;
}

const wholeFileStatus = (byFile, file) => {
  const tests = byFile.get(file);
  if (!tests) return "missing";
  return tests.length > 0 && tests.every((t) => t.status === "passed") ? "passed" : "failed";
};
const describeStatus = (byFile, file, title) => {
  const tests = (byFile.get(file) ?? []).filter((t) => t.describe === title);
  if (tests.length === 0) return "missing";
  return tests.length > 0 && tests.every((t) => t.status === "passed") ? "passed" : "failed";
};

export function deriveCard03Entry({ vitest, closure, observations, cwd }) {
  const byFile = summarizeVitestReport(vitest?.report, cwd);
  const o = observations;
  const passed = { status: "passed" };
  const a = (id, expected, actual) => ({ id, expected, actual });
  const failing = [...byFile.values()].flat().filter((t) => t.status === "failed").map((t) => t.name);
  const baseline = new Set(BASELINE_FAILURES);
  const scopes = vitest?.scopes ?? [];
  const legacyFailureNames = new Set(vitest?.targeted_legacy_verified ? vitest?.targeted_legacy_failures ?? [] : []);
  const dispatch = o.dispatch_evidence ?? { status: "unknown" };

  const assertions = [
    a("BASELINE:vitest-report-parsed", true, (vitest?.report_valid ?? Array.isArray(vitest?.report?.testResults)) && !vitest?.timed_out && [0, 1].includes(vitest?.exit_code)),
    a("BASELINE:all-run-files-executed", [], RUN_FILES.filter((file) => file === NODE_ONLY ? vitest?.node?.passed !== true : !byFile.has(file))),
    a("BASELINE:no-new-failures", [], failing.filter((name) => !baseline.has(name) && !legacyFailureNames.has(name)).sort()),
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

    ...MECHANISMS.map((mechanism) => a(`MECH:${mechanism.id}`, true,
      (o.mechanism_readback ?? []).find((row) => row.id === mechanism.id)?.present === true)),
    a("PRD-AC-11:real-dispatch-evidence", "verified", dispatch.status),
    a("PRD-AC-11:initial-contexts-no-history", true, dispatch.independent_initial_contexts ?? "unknown"),
    a("PRD-AC-11:independent-role-contexts", true, dispatch.independent_role_contexts ?? "unknown"),
    a("PRD-AC-11:actual-concurrency-2-to-5", true, Number.isInteger(dispatch.concurrent_running_packages)
      ? dispatch.concurrent_running_packages >= 2 && dispatch.concurrent_running_packages <= 5 : "unknown"),
    a("PRD-AC-11:actual-repair-original-context", true, dispatch.repair_to_original ?? "unknown"),
    a("PRD-AC-12:actual-main-activity", true, dispatch.main_activity_compliant ?? "unknown"),
    a("PRD-AC-14:g1-actual-demonstration", true, o.g1_actual_demonstration ?? "unknown"),
    a("BASELINE:scoped-raw-coverage", [], RUN_FILES.filter((file) => !scopes.some((scope) => scope.files.includes(file) && scope.raw_persisted === true))),
    a("BASELINE:whole-scope-no-skipped-leaves", [], FULL_VITEST_FILES.filter((file) => {
      const leaves = byFile.get(file); return !leaves?.length || leaves.some((leaf) => !["passed", "failed"].includes(leaf.status));
    })),
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


// Physical P6 mapping: project actual assertions and required current scopes only.
// Historical Phase receipts support provenance; they cannot fill this execution's leaves.
const TECHNICAL_AC_SCOPES = Object.freeze([
  {
    "id": "AC-DISP-001",
    "assertion_ids": [
      "ORACLE-DISP-001:five-dispatch-sections-cite-agents",
      "ORACLE-DISP-001:describe:tests/contract/card03-dispatch-method.test.mjs"
    ],
    "scopes": [
      {
        "file": "tests/contract/card03-dispatch-method.test.mjs",
        "describe": "card-03 T001 dispatch method text (ORACLE-DISP-001)"
      }
    ]
  },
  {
    "id": "AC-DISP-002",
    "assertion_ids": [
      "ORACLE-DISP-002:phase-template-fields"
    ],
    "scopes": [
      {
        "file": "tests/contract/card03-skill-bundle-closure.test.mjs",
        "describe": "T005 ORACLE-DISP-002 phase 模板声明工作包事实字段"
      }
    ]
  },
  {
    "id": "AC-DISP-003",
    "assertion_ids": [
      "ORACLE-DISP-003:root-progress-archived",
      "ORACLE-DISP-003:describe:tests/contract/card03-dispatch-method.test.mjs"
    ],
    "scopes": [
      {
        "file": "tests/contract/card03-dispatch-method.test.mjs",
        "describe": "card-03 T002 document realignment (ORACLE-DISP-003)"
      },
      {
        "file": "tests/p0-foundation-contracts.test.mjs"
      }
    ]
  },
  {
    "id": "AC-SKL-001",
    "assertion_ids": [
      "ORACLE-SKL-001:no-per-file-sha",
      "ORACLE-SKL-001:file:tests/skill-provenance-strict.test.mjs"
    ],
    "scopes": [
      {
        "file": "tests/skill-provenance-strict.test.mjs"
      },
      {
        "file": "tests/contract/card03-skill-bundle-closure.test.mjs",
        "describe": "T003 ORACLE-SKL-001 skill 包只保留运行时聚合摘要"
      },
      {
        "file": "core/__tests__/check-skill-closure.test.mjs"
      }
    ]
  },
  {
    "id": "AC-SKL-002",
    "assertion_ids": [
      "ORACLE-SKL-002:retired-templates-absent",
      "ORACLE-SKL-002:skill-closure",
      "ORACLE-SKL-002:file:tests/contract/material-producer-consumer-roundtrip.test.mjs"
    ],
    "scopes": [
      {
        "file": "tests/contract/material-producer-consumer-roundtrip.test.mjs"
      },
      {
        "file": "tests/contract/card03-skill-bundle-closure.test.mjs",
        "describe": "T004 ORACLE-SKL-002 旧模板删除且 skill 闭包转绿"
      },
      {
        "file": "tests/integration/distribution-closure.test.mjs"
      },
      {
        "file": "tests/integration/runner-clean-install.test.mjs"
      }
    ]
  },
  {
    "id": "AC-SKL-003",
    "assertion_ids": [
      "ORACLE-SKL-003:describe:tests/contract/card03-review-orchestration.test.mjs"
    ],
    "scopes": [
      {
        "file": "tests/contract/card03-review-orchestration.test.mjs",
        "describe": "ORACLE-SKL-003 runner reviewer skills follow stage-skill-plan.json"
      }
    ]
  },
  {
    "id": "AC-RT-001",
    "assertion_ids": [
      "ORACLE-RT-001:file:tests/contract/card03-runtime-binding.test.mjs"
    ],
    "scopes": [
      {
        "file": "tests/contract/card03-runtime-binding.test.mjs"
      },
      {
        "file": "tests/contract/business-case-source-binding.test.mjs"
      },
      {
        "file": "tests/contract/business-case-catalog.test.mjs"
      },
      {
        "file": "tests/contract/acceptance-result-machine-classes.test.mjs"
      },
      {
        "file": "tests/contract/build-code-case-reconciliation.test.mjs"
      },
      {
        "file": "tests/contract/research-report.test.mjs"
      }
    ]
  },
  {
    "id": "AC-RT-002",
    "assertion_ids": [
      "ORACLE-RT-002:no-review-budget-run-field",
      "ORACLE-RT-002:file:tests/contract/review-budget-deletion.test.mjs"
    ],
    "scopes": [
      {
        "file": "tests/contract/review-budget-deletion.test.mjs"
      }
    ]
  },
  {
    "id": "AC-REV-001",
    "assertion_ids": [
      "ORACLE-REV-001:describe:tests/contract/card03-review-orchestration.test.mjs"
    ],
    "scopes": [
      {
        "file": "tests/contract/card03-review-orchestration.test.mjs",
        "describe": "ORACLE-REV-001 review request precheck, bad results and packet narrowing"
      },
      {
        "file": "tests/contract/card03-runtime-binding.test.mjs"
      }
    ]
  },
  {
    "id": "AC-REV-002",
    "assertion_ids": [
      "ORACLE-REV-002:describe:tests/contract/card03-review-orchestration.test.mjs"
    ],
    "scopes": [
      {
        "file": "tests/contract/card03-review-orchestration.test.mjs",
        "describe": "ORACLE-REV-002 partial coverage and same-triple reuse"
      }
    ]
  },
  {
    "id": "AC-FIX-001",
    "assertion_ids": [
      "ORACLE-FIX-001:make-decision-needs-decision-log-only",
      "ORACLE-FIX-001:file:tests/contract/material-set-per-stage.test.mjs",
      "ORACLE-FIX-001:describe:tests/contract/stage-reflection-e2e-constructed.test.mjs"
    ],
    "scopes": [
      {
        "file": "tests/contract/material-set-per-stage.test.mjs"
      },
      {
        "file": "tests/contract/stage-reflection-e2e-constructed.test.mjs",
        "describe": "CARD-03 P6 post decision-only make-decision public reflection (ORACLE-FIX-001)"
      }
    ]
  },
  {
    "id": "AC-FIX-002",
    "assertion_ids": [
      "ORACLE-FIX-002:schema-covers-validator",
      "ORACLE-FIX-002:describe:tests/contract/ac-evidence-schema-domain.test.mjs"
    ],
    "scopes": [
      {
        "file": "tests/contract/ac-evidence-schema-domain.test.mjs",
        "describe": "ORACLE-FIX-002 ac-evidence-summary schema domain matches the frozen validator"
      },
      {
        "file": "tests/contract/acceptance-result-machine-classes.test.mjs"
      }
    ]
  },
  {
    "id": "AC-FIX-003",
    "assertion_ids": [
      "ORACLE-FIX-003:no-c2-irreversible-rules",
      "ORACLE-FIX-003:file:tests/build-code-diff-only.test.mjs"
    ],
    "scopes": [
      {
        "file": "tests/build-code-diff-only.test.mjs"
      }
    ]
  },
  {
    "id": "AC-FIX-004",
    "assertion_ids": [
      "ORACLE-FIX-004:file:tests/contract/build-code-apply-contract.test.mjs",
      "ORACLE-FIX-004:file:tests/contract/review-step-forward-progress.test.mjs",
      "ORACLE-FIX-004:file:tests/contract/post-phase-contract.test.mjs",
      "ORACLE-FIX-004:file:tests/contract/phase-quality-handoff.test.mjs",
      "ORACLE-FIX-004:file:tests/contract/verify-code-binding-derivation.test.mjs"
    ],
    "scopes": [
      {
        "file": "tests/contract/build-code-apply-contract.test.mjs"
      },
      {
        "file": "tests/contract/review-step-forward-progress.test.mjs"
      },
      {
        "file": "tests/contract/post-phase-contract.test.mjs"
      },
      {
        "file": "tests/contract/phase-quality-handoff.test.mjs"
      },
      {
        "file": "tests/contract/verify-code-binding-derivation.test.mjs"
      }
    ]
  }
]);

function deriveTechnicalEntries(aggregate, vitest, cwd) {
  const byFile = summarizeVitestReport(vitest.report, cwd);
  return TECHNICAL_AC_SCOPES.map((subject) => {
    const assertions = subject.assertion_ids.map((id) => {
      const original = aggregate.assertions.find((row) => row.id === id);
      return original ?? { id: `${subject.id}:missing-original-assertion:${id}`, expected: "present", actual: "missing" };
    });
    const requiredFiles = [...new Set(subject.scopes.map((scope) => scope.file))];
    const currentScope = (file) => vitest.scopes.find((scope) => scope.files.includes(file));
    const sourceReadable = requiredFiles.every((file) => {
      const scope = currentScope(file);
      return scope?.report_valid === true && !scope.timed_out && !scope.error && !scope.signal
        && [0, 1].includes(scope.exit_code);
    });
    const rawMissing = requiredFiles.filter((file) => {
      const scope = currentScope(file);
      return scope?.raw_persisted !== true || !scope.raw_evidence?.stdout || !scope.raw_evidence?.stderr
        || !scope.raw_evidence?.report || !scope.report_files?.includes(file) || !byFile.has(file);
    });
    const leafFailures = subject.scopes.flatMap((scope) => {
      const leaves = (byFile.get(scope.file) ?? []).filter((leaf) => !scope.describe || leaf.describe === scope.describe);
      if (!leaves.length) return [`${scope.file}${scope.describe ? ` > ${scope.describe}` : ""} > <missing scope>`];
      return leaves.filter((leaf) => leaf.status !== "passed").map((leaf) => leaf.name);
    });
    for (const scope of subject.scopes) assertions.push({ id: `${subject.id}:scope:${scope.file}${scope.describe ? `:${scope.describe}` : ""}`,
      expected: { status: "passed" }, actual: { status: scope.describe ? describeStatus(byFile, scope.file, scope.describe) : wholeFileStatus(byFile, scope.file) } });
    assertions.push({ id: `${subject.id}:source-report-readable`, expected: true, actual: sourceReadable },
      { id: `${subject.id}:required-scope-raw-missing`, expected: [], actual: rawMissing },
      { id: `${subject.id}:required-scope-leaf-failures`, expected: [], actual: leafFailures });
    const failed = assertions.filter((row) => JSON.stringify(row.expected) !== JSON.stringify(row.actual)).map((row) => row.id);
    return { acceptance_criterion_id: subject.id, outcome: failed.length ? "incomplete" : "achieved", assertions,
      ...(failed.length ? { owner: "CARD-03 P6/T015", reason: `observable assertions not met: ${failed.join(", ")}` } : {}) };
  });
}

function capture(result, extra = {}) {
  const stdout = Buffer.isBuffer(result.stdout) ? result.stdout : Buffer.from(result.stdout ?? "");
  const stderr = Buffer.isBuffer(result.stderr) ? result.stderr : Buffer.from(result.stderr ?? "");
  return { ...extra, exit_code: Number.isInteger(result.status) ? result.status : null, signal: result.signal ?? null,
    timed_out: result.error?.code === "ETIMEDOUT", error: result.error ? { code: result.error.code ?? "CHILD_PROCESS_ERROR", message: result.error.message } : null,
    stderr: stderr.toString("utf8"), raw: { stdout, stderr } };
}

export function runScopedVitest({ run = spawnSync, cwd = process.cwd(), timeoutMs = 1800000, files = FULL_VITEST_FILES, pattern } = {}) {
  if (!files.length || files.some((file) => !RUN_FILES.includes(file) || file === NODE_ONLY)) throw new Error("Vitest scope is outside declared acceptance inventory");
  const dir = mkdtempSync(join(tmpdir(), "card03-acceptance-")), outputFile = join(dir, "vitest-report.json");
  try {
    const args = ["--no-install", "vitest", "run", ...files, ...(pattern ? ["-t", pattern] : []), "--reporter=json", `--outputFile=${outputFile}`];
    const result = capture(run("npx", args, { cwd, timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] }),
      { command: "npx", args, files, pattern: pattern ?? null });
    const raw = existsSync(outputFile) ? readFileSync(outputFile) : null;
    let report = null, reportError = null;
    try { if (raw) report = JSON.parse(raw.toString("utf8")); } catch (error) { reportError = error.message; }
    return { ...result, report, report_error: reportError, raw: { ...result.raw, report: raw } };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

export function runSkillClosure({ run = spawnSync, cwd = process.cwd() } = {}) {
  const args = ["runtime/evidence/check-skill-closure.mjs"];
  return capture(run(process.execPath, args, { cwd, timeout: 60000, stdio: ["ignore", "pipe", "pipe"] }), { command: "node", args });
}

const REPAIR_CHANGED_PATHS = Object.freeze([
  "runtime/stage/stage-content-contracts.mjs", "runtime/stage/stage-runner.mjs",
  "runtime/stage/stage-handlers.mjs", "runtime/stage/completion-predicates.mjs",
]);
const REPAIR_SCOPES = Object.freeze([
  { file: RUNTIME_BINDING, pattern: "reuses byte-authenticated execution for metadata-only rerun while retaining unavailable review source|projects this canonical subject_fact scenario and (incomplete|failed) without filling independent proofs" },
  { file: "tests/contract/census-upstream-authoring.test.mjs", pattern: "preserves a real multi-T decision cell string with explicitly constructed quoted source|retains legacy multi-D and mixed explicit D/T list tokens without new decision fields|does not authenticate an unknown syntactically valid decision just because its index token is readable|reads all twenty real current R rows while derived edges and unauthenticated originals stay incomplete" },
]);
const REPAIR_CASE_NAMES = Object.freeze([
  { describe: "CARD-03 stage-end existing native acceptance projection (ORACLE-RT-001)", names: [
    "reuses byte-authenticated execution for metadata-only rerun while retaining unavailable review source",
    "projects this canonical subject_fact scenario and incomplete without filling independent proofs",
    "projects this canonical subject_fact scenario and failed without filling independent proofs",
  ] },
  { describe: "CARD-03 census multiple decision cell keeps original trace (ORACLE-RT-001)", names: [
    "preserves a real multi-T decision cell string with explicitly constructed quoted source",
    "retains legacy multi-D and mixed explicit D/T list tokens without new decision fields",
    "does not authenticate an unknown syntactically valid decision just because its index token is readable",
    "reads all twenty real current R rows while derived edges and unauthenticated originals stay incomplete",
  ] },
]);

function currentRepairScope(cwd, input) {
  if (!input || typeof input !== "object" || Array.isArray(input)
      || Object.keys(input).length !== 1 || !Array.isArray(input.changed_paths)
      || input.changed_paths.length !== REPAIR_CHANGED_PATHS.length
      || new Set(input.changed_paths).size !== input.changed_paths.length
      || input.changed_paths.some((path) => !REPAIR_CHANGED_PATHS.includes(path))) {
    throw new Error("affected_scope requires the four unique declared repair changed_paths");
  }
  const material = readFileSync(join(cwd, CARD_DIR, "phases/P6.md"), "utf8");
  const declarations = [...material.matchAll(/^- \*\*repair_affected_scope\*\*：`([^\n]+)`\s*$/gm)];
  if (declarations.length !== 1) throw new Error("affected_scope requires one current P6 repair_affected_scope declaration");
  const declaration = JSON.parse(declarations[0][1]);
  if (JSON.stringify(declaration) !== JSON.stringify({ changed_paths: [...REPAIR_CHANGED_PATHS], scopes: [...REPAIR_SCOPES] })) {
    throw new Error("affected_scope differs from the approved repair producer-consumer mapping");
  }
  return declaration;
}

async function produceAffectedCard03Current({ cwd, run, affected_scope }) {
  const declaration = currentRepairScope(cwd, affected_scope);
  const context = actualTaskContext(cwd);
  const commands = declaration.scopes.map(({ file, pattern }) => runScopedVitest({ run, cwd, files: [file], pattern }));
  const scopes = commands.map((command, index) => {
    command.raw_evidence = archiveRaw(context, command.raw, `repair-scope-${index}`);
    const reportFiles = (command.report?.testResults ?? []).map((file) => relative(cwd, file.name).split("\\").join("/"));
    const leaves = [...summarizeVitestReport(command.report, cwd).values()].flat();
    const selected = leaves.filter((leaf) => !["pending", "skipped"].includes(leaf.status));
    const reportValid = reportFiles.length === 1 && reportFiles[0] === command.files[0];
    const expectedNames = REPAIR_CASE_NAMES[index].names.map((name) => `${command.files[0]} > ${REPAIR_CASE_NAMES[index].describe} > ${name}`);
    return { files: command.files, pattern: command.pattern, report_valid: reportValid,
      selected_test_names: selected.map((leaf) => leaf.name),
      expected_test_names: expectedNames,
      uncovered_test_names: expectedNames.filter((name) => !selected.some((leaf) => leaf.name === name)),
      unexpected_test_names: selected.filter((leaf) => !expectedNames.includes(leaf.name)).map((leaf) => leaf.name),
      excluded_test_names: leaves.filter((leaf) => ["pending", "skipped"].includes(leaf.status)).map((leaf) => leaf.name),
      raw_persisted: true, raw_evidence: command.raw_evidence, report_files: reportFiles,
      exit_code: command.exit_code, timed_out: command.timed_out, error: command.error, signal: command.signal,
      coverage: "explicit_consumer_scope", leaves: selected };
  });
  const observations = await observeWorkspace(cwd);
  const aggregate = deriveCard03Entry({ vitest: { report: { testResults: [] }, scopes: [] }, observations, cwd });
  const subjects = [...TECHNICAL_AC_SCOPES, { id: ACCEPTANCE_CRITERION_ID,
    assertion_ids: aggregate.assertions.map((assertion) => assertion.id), scopes: RUN_FILES.map((file) => ({ file })) }];
  const entries = subjects.map((subject) => {
    const observed = scopes.filter((scope) => subject.scopes.some((required) => scope.files.includes(required.file)));
    const assertions = [{ id: `${subject.id}:affected-scope-observation`,
      expected: declaration.scopes.filter((scope) => subject.scopes.some((required) => required.file === scope.file)),
      actual: observed.map((scope) => ({ file: scope.files[0], pattern: scope.pattern })) }];
    for (const scope of observed) {
      assertions.push({ id: `${subject.id}:affected-report:${scope.files[0]}`, expected: true, actual: scope.report_valid },
        { id: `${subject.id}:affected-process:${scope.files[0]}`, expected: { settled: true },
          actual: { settled: [0, 1].includes(scope.exit_code) && !scope.timed_out && !scope.error && !scope.signal } });
      for (const leaf of scope.leaves.filter((leaf) => scope.expected_test_names.includes(leaf.name) || leaf.name.endsWith(" > <file error>"))) assertions.push({ id: `${subject.id}:affected-leaf:${leaf.name}`,
        expected: { status: "passed" }, actual: { status: leaf.status } });
    }
    return { acceptance_criterion_id: subject.id, outcome: "incomplete", owner: "CARD-03 P6/T015",
      reason: "Only the declared repair consumer cases were evaluated; the original complete AC oracle was not rerun.", assertions };
  });
  return { schema_version: "card03-current-acceptance.v1",
    commands: commands.map(({ raw, report: ignoredReport, ...command }) => command), observations,
    prd_acceptance: {}, entries,
    affected_scope: { changed_paths: declaration.changed_paths, scopes: scopes.map(({ leaves, ...scope }) => scope),
      original_oracle_coverage: subjects.map((subject) => ({ acceptance_criterion_id: subject.id,
        required_scopes: subject.scopes, uncovered_scopes: subject.scopes,
        unevaluated_original_assertion_ids: subject.assertion_ids,
        owner: "CARD-03 P6/T015", reason: "A selected case pass does not satisfy the original whole-file or complete AC oracle." })) } };
}

export async function produceCard03Current({ cwd = process.cwd(), run = spawnSync, affected_scope } = {}) {
  if (affected_scope !== undefined) return produceAffectedCard03Current({ cwd, run, affected_scope });
  const context = actualTaskContext(cwd);
  const started = Date.now(), budget = 1800000, remaining = () => Math.max(1, budget - (Date.now() - started));
  const batches = [runScopedVitest({ run, cwd, timeoutMs: remaining() })];
  for (const scope of RESTRICTED) batches.push(runScopedVitest({ run, cwd, files: [scope.file], pattern: scope.pattern, timeoutMs: remaining() }));
  const nodeArgs = ["--test", "--test-reporter=tap", NODE_ONLY];
  const node = capture(run(process.execPath, nodeArgs, { cwd, timeout: remaining(), maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] }), { command: "node", args: nodeArgs, files: [NODE_ONLY] });
  const tap = node.raw.stdout.toString("utf8");
  node.passed = node.exit_code === 0 && /^# tests 4$/m.test(tap) && /^# pass 4$/m.test(tap) && /^# fail 0$/m.test(tap) && /^# skipped 0$/m.test(tap);
  const closure = runSkillClosure({ run, cwd });
  const allCommands = [...batches, node, closure], scopes = [];
  for (const [i, command] of allCommands.entries()) {
    command.raw_evidence = archiveRaw(context, command.raw, `scope-${i}`);
    if (command.files) scopes.push({ files: command.files, pattern: command.pattern ?? null, raw_persisted: true,
      selected_test_names: (command.report?.testResults ?? []).flatMap((file) => (file.assertionResults ?? []).filter((row) => row.status !== "pending" && row.status !== "skipped").map((row) => row.fullName ?? [...(row.ancestorTitles ?? []), row.title].join(" > "))),
      excluded_test_names: (command.report?.testResults ?? []).flatMap((file) => (file.assertionResults ?? []).filter((row) => row.status === "pending" || row.status === "skipped").map((row) => row.fullName ?? [...(row.ancestorTitles ?? []), row.title].join(" > "))),
      exit_code: command.exit_code, timed_out: command.timed_out, error: command.error, signal: command.signal,
      report_files: (command.report?.testResults ?? []).map((file) => relative(cwd, file.name).split("\\").join("/")),
      report_valid: Array.isArray(command.report?.testResults) && command.report.testResults.length === command.files.length
        && new Set(command.report.testResults.map((file) => file.name)).size === command.files.length
        && command.report.testResults.every((file) => command.files.includes(relative(cwd, file.name).split("\\").join("/"))),
      coverage: command.files.some((file) => RESTRICTED.some((scope) => scope.file === file)) ? "explicit_consumer_scope" : command.files[0] === NODE_ONLY ? "node_only" : "whole_files", raw_evidence: command.raw_evidence });
  }
  const report = { testResults: batches.flatMap((batch) => batch.report?.testResults ?? []) };
  const targeted = batches.at(-1), currentFailures = [...summarizeVitestReport(targeted.report, cwd).values()].flat().filter((row) => row.status === "failed").map((row) => row.name).sort();
  const baselineRaw = context.task.readRecord("quality/evidence/card03/P3/independent-targeted-restored-baseline-v2-test-metadata.json");
  const legacy = JSON.parse(baselineRaw);
  const expectedFailures = (legacy.current_failed_names ?? []).map((name) => name.replace(/^FAIL  /, ""));
  const legacyReceipt = JSON.parse(context.task.readRecord(legacy.receipt_ref));
  const legacyOutput = context.task.readRecord(legacyReceipt.output_ref);
  if (hash(legacyOutput) !== legacyReceipt.output_hash || legacyReceipt.output_hash !== legacy.output_hash)
    throw new Error("targeted original failure source hash mismatch");
  const namesInOriginal = [...legacyOutput.matchAll(/^ FAIL  (.+)$/gm)].map((match) => match[1]).sort();
  if (JSON.stringify(namesInOriginal) !== JSON.stringify([...expectedFailures].sort())) throw new Error("targeted failure names differ from original captured bytes");
  const legacyVerified = expectedFailures.length === 7 && currentFailures.every((name) => expectedFailures.includes(name));
  const observations = await observeWorkspace(cwd);
  const grep = observations.mechanism_readback.flatMap((row) => row.matches.map((match) => `${row.id}\t${row.path}:${match.line}\t${match.text}\tsha256=${row.file_sha256}`)).join("\n") + "\n";
  const grepRecord = context.kernel.publishCanonicalRecord("quality/tests/card03/P6/mech-readback/anchor-grep.txt", grep);
  observations.mechanism_grep = grepRecord;
  const boundedReportErrors = batches.flatMap((batch) => {
    if (!Array.isArray(batch.report?.testResults)) return [{ files: batch.files, reason: "report not parsed" }];
    const names = batch.report.testResults.map((file) => relative(cwd, file.name).split("\\").join("/"));
    return names.length !== batch.files.length || new Set(names).size !== names.length
      || names.some((file) => !batch.files.includes(file))
      ? [{ files: batch.files, reason: "report files differ from command scope", observed: names }] : [];
  });
  const vitest = { report, report_valid: boundedReportErrors.length === 0, exit_code: batches.every((batch) => [0, 1].includes(batch.exit_code)) ? 1 : null,
    timed_out: batches.some((batch) => batch.timed_out) || Date.now() - started > budget, scopes, node, targeted_legacy_verified: legacyVerified, targeted_legacy_failures: expectedFailures };
  const entry = deriveCard03Entry({ vitest, closure, observations, cwd });
  for (const [index, scope] of RESTRICTED.entries()) {
    const batch = batches[index + 1], leaves = [...summarizeVitestReport(batch.report, cwd).values()].flat();
    const selected = leaves.filter((row) => !["pending", "skipped"].includes(row.status));
    const ok = selected.length === scope.expected && (scope.legacy_failures ? legacyVerified : selected.every((row) => row.status === "passed"));
    entry.assertions.push({ id: `BASELINE:restricted:${scope.file}`, expected: true, actual: ok });
  }
  entry.assertions.push({ id: "BASELINE:node-only-consumer", expected: true, actual: node.passed });
  entry.assertions.push({ id: "BASELINE:bounded-reporter-files", expected: [], actual: boundedReportErrors });
  const failed = entry.assertions.filter((a) => JSON.stringify(a.expected) !== JSON.stringify(a.actual)).map((a) => a.id);
  if (failed.length) { entry.outcome = "incomplete"; entry.owner = "CARD-03 P6/T015"; entry.reason = `observable assertions not met: ${failed.join(", ")}`; }
  return { schema_version: "card03-current-acceptance.v1", commands: allCommands.map(({ raw, report: ignoredReport, ...command }) => command),
    observations, prd_acceptance: Object.fromEntries(PRD_ACS.map((ac) => [ac, entry.assertions.filter((a) => a.id.startsWith(`PRD-${ac}:`)).map((a) => a.id)])), entries: [...deriveTechnicalEntries(entry, vitest, cwd), entry] };
}

async function main() {
  const output = await produceCard03Current();
  process.stdout.write(`${JSON.stringify(output)}\n`);
  process.exitCode = output.entries.every((entry) => entry.outcome === "achieved") ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) await main();
