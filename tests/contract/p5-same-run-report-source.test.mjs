import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join } from "node:path";
import { createRequire, syncBuiltinESMExports } from "node:module";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { initializeTaskStore, writeStageRow } from "../../runtime/task/task-store.mjs";
import { createCanonicalReceiptWriter, writeOfficialComponentReceipt } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { recordSimpleReviewRequest } from "../../runtime/review/review-record-route.mjs";
import { runOfficialStage } from "../../runtime/stage/stage-runner.mjs";
import { buildStageEndReportFacts, renderStageEndReport } from "../../runtime/stage/stage-end-report.mjs";
import * as freshness from "../../runtime/evidence/freshness.mjs";
import { qualityFactDigest } from "../../runtime/evidence/quality-fact.mjs";
import { validatePostPhaseContract } from "../../runtime/stage/stage-content-contracts.mjs";
import { createSimpleReviewPacket } from "../../skills/wh-review/scripts/simple-review-runner.mjs";

const roots = [];
const pendingFixtureExports = [];
let retainedTaskPath = null;
const reportRoot = "quality/evidence/stage-quality/build-code/P5";
const hash = (raw) => createHash("sha256").update(raw).digest("hex");
const git = (cwd, args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
const require = createRequire(import.meta.url);
const t007Command = "./node_modules/.bin/vitest run runtime/stage/stage-end-report.test.mjs --config vitest.config.mjs --poolOptions.forks.singleFork --no-fileParallelism";
function installedNodeModules() {
  let parent = dirname(require.resolve("vitest/package.json"));
  while (parent !== dirname(parent)) {
    if (existsSync(join(parent, ".bin", "vitest"))) return parent;
    parent = dirname(parent);
  }
  throw new Error("the installed Vitest runtime is unavailable for the isolated T007 fixture");
}

function exportFixtureRecords({ state, refs }) {
  const requested = process.env.WORKFLOWHUB_P5_FIXTURE_EVIDENCE_ROOT;
  if (!requested) return;
  if (!isAbsolute(requested) || !requested.endsWith("/quality/evidence/stage-quality/build-code/P5/T008-real-t007-fixture-20260927")) {
    throw new Error("P5 fixture evidence destination is outside the dedicated Task evidence directory");
  }
  const destination = realpathSync(requested);
  const runRoot = join(destination, "nested-canonical-runs");
  mkdirSync(runRoot, { recursive: true });
  const runDir = mkdtempSync(join(runRoot, "fixture-"));
  const files = [];
  const save = (name, bytes) => {
    const raw = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
    const path = join(runDir, name);
    writeFileSync(path, raw, { flag: "wx" });
    files.push({ path: name, bytes: raw.length, sha256: hash(raw) });
  };
  const implementationRaw = state.task.readRecord(refs.implementation);
  const testsRaw = state.task.readRecord(refs.tests);
  const reviewRaw = state.task.readRecord(refs.review);
  const tests = JSON.parse(testsRaw);
  save("implementation-receipt.json", implementationRaw);
  save("test-receipt.json", testsRaw);
  save("test-output.txt", state.task.readRecord(tests.output_ref));
  save("phase-review-result.json", reviewRaw);
  save("task.json", readFileSync(join(state.task.taskPath, "task.json")));
  const decisionLog = state.artifacts.read("decision-log.md");
  save("fixture-exception-source.md", decisionLog);
  const snapshot = state.kernel.currentVNextSnapshot();
  const materialFiles = ["decision-log.md", "spec.md", "phases/index.md",
    ...Array.from({ length: 5 }, (_, index) => `phases/P${index + 1}.md`)];
  const materials = materialFiles.map((name) => ({
    path: name, sha256: hash(state.artifacts.read(name)),
  }));
  const manifest = {
    scope: "isolated fixture only; not a CARD04 user declaration or independent review verdict",
    task_id: state.task.identity.taskId,
    project_name: state.task.identity.projectName,
    worktree: realpathSync(state.candidateWorkspace.worktreeRoot),
    branch: git(state.candidateWorkspace.worktreeRoot, ["branch", "--show-current"]),
    snapshot: { head: snapshot.head, tree: snapshot.tree, commit: snapshot.commit, source_digest: snapshot.source_digest },
    material_revision: state.kernel.currentVNextMaterialRevision(),
    materials,
    refs: {
      implementation: { ref: refs.implementation, sha256: hash(implementationRaw) },
      tests: { ref: refs.tests, sha256: hash(testsRaw) },
      test_output: { ref: tests.output_ref, sha256: hash(state.task.readRecord(tests.output_ref)) },
      review: { ref: refs.review, sha256: hash(reviewRaw) },
    },
    exception_verbatim: "For this isolated fixture, defer the AC-001 business verdict until P6.",
    files,
  };
  save("manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
}

afterEach(() => {
  let exportError = null;
  while (pendingFixtureExports.length) {
    try { exportFixtureRecords(pendingFixtureExports.pop()); }
    catch (error) { exportError ??= error; }
  }
  const handoff = process.env.WORKFLOWHUB_P5_RETAINED_STATE_PATH;
  if (handoff && retainedTaskPath) {
    const parent = realpathSync(dirname(handoff));
    const temporaryRoot = realpathSync(tmpdir());
    if (!isAbsolute(handoff) || !parent.startsWith(`${temporaryRoot}/`) || !handoff.endsWith("/p5-task-path.txt")) {
      throw new Error("P5 retained fixture handoff must be a dedicated temporary state file");
    }
    writeFileSync(handoff, `${retainedTaskPath}\n`, { flag: "wx", mode: 0o600 });
  }
  while (roots.length) {
    const root = roots.pop();
    if (retainedTaskPath && retainedTaskPath.startsWith(`${root}/`)) continue;
    rmSync(root, { recursive: true, force: true });
  }
  retainedTaskPath = null;
  if (exportError) throw exportError;
});

function fixture({ p5 = true, humanException = true, phaseCount = 5,
  taskId = "p5-source-fixture", declarationKind = "fixture_only",
  exceptionScope = "AC-001 in this isolated Task only", exceptionExpiresAt = "P6",
  exceptionVerbatim = "For this isolated fixture, defer the AC-001 business verdict until P6." } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p5-source-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q"]);
  git(repo, ["config", "user.name", "WorkflowHub Tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "base.mjs"), "export const value = 1;\n");
  writeFileSync(join(repo, ".gitignore"), "node_modules\n.vite/vitest/results.json\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "base"]);
  const task = createTask({ storageRoot: root, manifest: {
    schema_version: "1.0.0", project_name: "workflowhub", task_id: taskId,
    created_at: "2026-09-27T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {},
    record_model: "vnext-single-write", activation_cohort: "post",
  } });
  initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
  const candidateWorkspace = prepareTaskWorkspace(task);
  const workspace = openCurrentTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidateWorkspace.worktreeRoot, task);
  artifacts.writeAtomic("decision-log.md", `# Decision

## 核心需求

- **任务类型**：普通任务

## 需求变更记录

### D-001 — report

## 原始需求索引

| requirement_id | 真实来源锚点 | 主要决定 |
|---|---|---|
| R-001 | U-001 | D-001 |

## 逐字声明层（verbatim）

| V-ID | 说出者 | 场景 | 逐字原文 |
|---|---|---|---|
| V-001 | 用户 | 原话 | Show the report. |

${p5 && humanException ? `## 人工例外声明（测试夹具，非 CARD04 用户批准）

\`\`\`json
{"kind":"${declarationKind}","declarations":[{"declared_by":"Fixture User","owner":"Fixture Owner","scope":"${exceptionScope}","expires_at_phase":"${exceptionExpiresAt}","verbatim":"${exceptionVerbatim}","reason":"The fixture has no real page or service."}]}
\`\`\`
` : ""}`);
  artifacts.writeAtomic("spec.md", "# Spec\n\n- **FR-001**：Show the report.\n- [ ] **AC-001 — Report**：Show the real result.\n\n## 来源与决策映射\n\n| 来源 | 决策 | FR | AC |\n|---|---|---|---|\n| R-001 | D-001 | FR-001 | AC-001 |\n");
  const count = p5 ? phaseCount : 1;
  artifacts.writeAtomic("phases/index.md", `# Phase index\n\n## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n${Array.from({ length: count }, (_, index) => `| \`P${index + 1}\` | \`phases/P${index + 1}.md\` |`).join("\n")}\n`);
  for (let index = 1; index <= count; index += 1) {
    artifacts.writeAtomic(`phases/P${index}.md`, `# Phase P${index}\n\n### T001 — Work\n\n- **gate_cmd**：\`node --test tests/report.test.mjs\`\n${index === 5 ? "\n### T007 — Report facts\n\n### T008 — Same-run source\n" : ""}`);
  }
  artifacts.writeAtomic("tests/report.test.mjs", "import { test } from 'node:test'; test('report', () => {});\n");
  mkdirSync(join(candidateWorkspace.worktreeRoot, "runtime", "stage"), { recursive: true });
  for (const name of ["stage-end-report.mjs", "stage-end-report.test.mjs"]) {
    writeFileSync(join(candidateWorkspace.worktreeRoot, "runtime", "stage", name),
      readFileSync(new URL(`../../runtime/stage/${name}`, import.meta.url)));
  }
  // The isolated T007 suite uses the real validator and its pure constants.
  mkdirSync(join(candidateWorkspace.worktreeRoot, "runtime", "evidence"), { recursive: true });
  for (const name of ["acceptance-evidence-validator.mjs", "canonical-utils.mjs"]) {
    writeFileSync(join(candidateWorkspace.worktreeRoot, "runtime", "evidence", name),
      readFileSync(new URL(`../../runtime/evidence/${name}`, import.meta.url)));
  }
  writeFileSync(join(candidateWorkspace.worktreeRoot, "vitest.config.mjs"), readFileSync(new URL("../../vitest.config.mjs", import.meta.url)));
  symlinkSync(installedNodeModules(), join(candidateWorkspace.worktreeRoot, "node_modules"), "dir");
  const kernel = createTaskKernel(task, { candidateWorkspace, artifacts });
  const context = { stage: "build-code", task, kernel, identity: task.identity, manifest: task.manifest,
    workflowRunId: kernel.deriveStageWorkflowRunId("build-code"), candidateWorkspace, workspace, artifacts };
  return { root, task, candidateWorkspace, workspace, artifacts, kernel, context, phaseCount: count };
}

async function phaseReview(state, phaseId = "P5") {
  const { task, kernel } = state;
  const recorded = await recordSimpleReviewRequest({
    task, kernel,
    request: { stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: phaseId,
      host_provider: "codex/luna", materials: { approved_spec: `fixture review of ${phaseId}` } },
    resolveRouteIdentity: () => ({ route_identity: "a".repeat(64) }),
    runRound: async (request) => ({
      status: "available", stage: "build-code", review_track: null, review_kind: null,
      subject_kind: "phase", phase_id: request.phase_id, review_scope: "phase",
      material_id: createSimpleReviewPacket(request).material_id, runtime_id: "fixture-review", outcome: "completed",
      ocr: { version: "fixture", preview: { reviewable_files: [] }, rules: { rules: [] }, manifest: [] },
      findings: [], provider_results: [{ provider: "codex/luna", status: "completed",
        identity: { provider: "codex/luna", adapter: "codex", source_id: "fixture/source", config_id: "fixture/config", model: "fixture-model" },
        error: null, timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null, evidence_anchor_valid: [] }],
    }),
  });
  return recorded.result_ref;
}

function receipts(state) {
  const implementation = writeOfficialComponentReceipt({ task: state.task, workspace: state.workspace,
    stage: "build-code", component: "implementation", payload: {} });
  const tests = createCanonicalReceiptWriter({ task: state.task, workspace: state.workspace,
    stage: "build-code", component: "build-code-test-capture" }).captureTests({
      command: t007Command,
      receiptRef: "quality/tests/p5-report-fixture.json",
      outputRef: "quality/tests/output/p5-report-fixture.output",
    });
  if (tests.exit_code !== 0) throw new Error(`real T007 fixture test failed: ${state.task.readRecord(tests.output_ref)}`);
  if (!freshness.isCompleteP5T007VitestOutput(state.task.readRecord(tests.output_ref))) {
    throw new Error("real T007 fixture did not execute one complete suite of at least fifteen passing assertions");
  }
  return { implementation: implementation.ref, tests: tests.receipt_ref,
    ...(state.permission ? { audit: fixtureAudit(state) } : {}) };
}

// Complete and mutually hash-bound report files in an isolated Task. These
// synthetic bytes deliberately have no official receipts or user confirmation.
function syntheticReportEnvelope(state) {
  const put = (ref, raw) => {
    const path = join(state.task.taskPath, ref);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, raw);
    return { ref, path, sha256: hash(raw) };
  };
  const factsRaw = `${JSON.stringify({ fixture_only: true, status: "missing" })}\n`;
  const reportRaw = "# Isolated P5 report fixture\n";
  const sourceRaw = `${JSON.stringify({ schema_version: "workflowhub-p5-same-run-source.v1",
    project_name: state.task.identity.projectName, task_id: state.task.identity.taskId,
    stage: "build-code", phase_id: "P5", phase_task_id: "T008", fixture_only: true })}\n`;
  const source = put(`${reportRoot}/source-${hash(sourceRaw)}.json`, sourceRaw);
  const facts = put(`${reportRoot}/report-facts.json`, factsRaw);
  const report = put(`${reportRoot}/report.md`, reportRaw);
  const certificateRaw = `${JSON.stringify({ schema_version: "workflowhub-p5-source-certificate.v1",
    task_id: state.task.identity.taskId, stage: "build-code", phase_id: "P5",
    source_ref: source.ref, source_sha256: source.sha256,
    facts_sha256: facts.sha256, report_sha256: report.sha256, fixture_only: true })}\n`;
  const certificate = put(`${reportRoot}/certificate-${hash(certificateRaw)}.json`, certificateRaw);
  const delivery = put(`${reportRoot}/T008-delivery.txt`, `${JSON.stringify({
    schema_version: "workflowhub-p5-delivery-index.v1", task_id: state.task.identity.taskId,
    phase_id: "P5", source_ref: source.ref, source_sha256: source.sha256,
    certificate_ref: certificate.ref, certificate_sha256: certificate.sha256,
    facts_sha256: facts.sha256, report_sha256: report.sha256,
  })}\n`);
  return { facts, report, source, certificate, delivery };
}

// A separate Task exercises the protocol. These synthetic question/reply bytes
// are test inputs, never evidence of CARD04's current exception state.
function noneFixture({ defect = null, phaseCount = 5 } = {}) {
  const state = fixture({ humanException: false, phaseCount });
  mkdirSync(join(state.task.taskPath, "quality/evidence/risk-acceptances"), { recursive: true });
  const question = "最终报告如果核查后确实没有例外，例外栏写“没有例外”可以吗？";
  const callId = "isolated-permission-call";
  const questionRaw = `${JSON.stringify({ type: "response_item", payload: {
    type: "function_call", name: "request_user_input_async", call_id: callId,
    arguments: JSON.stringify({ questions: [{ title: question, options: ["可以，写明没有例外"] }] }),
  } })}\n`;
  const answerRaw = `${JSON.stringify({ type: "response_item", payload: {
    type: "message", role: "user", content: [{ type: "input_text", text:
      `<send_user_message_question_reply>\n${JSON.stringify([{ questionItemId: JSON.stringify([
        "request_user_input_async", defect === "wrong-call" ? "unrelated-call" : callId, 0]), question,
        answer: defect === "refused" ? "必须先由我逐项确认" : "可以，写明没有例外" }])}\n</send_user_message_question_reply>` }],
  } })}\n`;
  const permission = { question: { ref: "quality/evidence/permission/isolated-question.jsonl", sha256: hash(questionRaw) },
    answer: { ref: "quality/evidence/permission/isolated-answer.jsonl", sha256: hash(answerRaw) } };
  state.task.writeRecordAtomic(permission.question.ref, questionRaw);
  state.task.writeRecordAtomic(permission.answer.ref, answerRaw);
  state.artifacts.writeAtomic("decision-log.md", `${state.artifacts.read("decision-log.md")}\n## 无例外表达条件许可（隔离测试）\n\n\`${permission.question.ref}\` sha256 \`${permission.question.sha256}\`\n\`${permission.answer.ref}\` sha256 \`${permission.answer.sha256}\`\n`);
  if (defect === "unknown-material") state.artifacts.writeAtomic("spec.md",
    `${state.artifacts.read("spec.md")}\n本任务可能需要豁免实际验证，但还没有查清。\n`);
  if (defect === "missing-answer") rmSync(join(state.task.taskPath, permission.answer.ref));
  if (defect === "tampered-answer") writeFileSync(join(state.task.taskPath, permission.answer.ref), `${answerRaw} `);
  if (defect === "unreferenced-risk") {
    const raw = `${JSON.stringify({ schema_version: "risk-acceptance.v1", task_id: state.task.identity.taskId,
      stage: "build-code", selected_option: "accept-risk", finding_id: "isolated-unreferenced-risk",
      review_ref: "quality/reviews/results/absent.json" })}\n`;
    state.task.writeRecordAtomic(`quality/evidence/risk-acceptances/${hash(raw)}.json`, raw);
  }
  state.context.workflowRunId = state.kernel.deriveStageWorkflowRunId("build-code");
  return { ...state, permission };
}

function fixtureAudit(state) {
  const materials = ["decision-log.md", "spec.md", "phases/index.md",
    ...Array.from({ length: state.phaseCount }, (_, index) => `phases/P${index + 1}.md`)];
  const scope = { task_id: state.task.identity.taskId, phase_id: "P5",
    material_revision: state.kernel.currentVNextMaterialRevision(), snapshot_tree: state.kernel.currentVNextSnapshot().tree,
    report_scope: "p5_intermediate" };
  const classifications = materials.map((name) => ({ ref: state.artifacts.reference(name),
    sha256: hash(state.artifacts.read(name)), result: state.artifacts.read(name).includes("还没有查清") ? "unknown" : "no_exception",
    reason: "Isolated fixture classification of this complete material; not CARD04 evidence." }));
  const auditRaw = `${JSON.stringify({ schema_version: "v1", task_id: scope.task_id, stage_slug: "build-code",
    verdict: "pass", summary_hash: hash("isolated material classifications"), content_evidence_refs: classifications,
    exception_census: { scope, permission_refs: state.permission,
      ...(state.humanApproval ? { kind: "declared" } : { classifications }) } })}\n`;
  const auditRef = `quality/evidence/audits/build-code/${hash(auditRaw)}.json`;
  state.task.writeRecordAtomic(auditRef, auditRaw);
  return auditRef;
}

async function executeNoneFixture(state, { publicCli = false } = {}) {
  writeStageRow(state.task.taskPath, { stage: "build-code", source: "fixture",
    phase_progress: { phase_id: "P5", task_id: "T008", material_revision: state.kernel.currentVNextMaterialRevision(),
      recorded_at: "2026-09-27T00:00:00.000Z" } });
  const review = await phaseReview(state);
  if (publicCli) {
    const supplied = receipts(state);
    delete supplied.audit;
    const inputPath = join(state.root, "public-p5-run.json");
    writeFileSync(inputPath, JSON.stringify({ receipts: { ...supplied, review } }));
    const cliHome = join(state.root, "cli-home");
    mkdirSync(cliHome);
    const cliEnv = { ...process.env, HOME: cliHome, XDG_CONFIG_HOME: join(cliHome, ".config"), WORKFLOWHUB_TASK_DIR: state.root };
    delete cliEnv.WORKFLOWHUB_CUTOVER_EPOCH;
    return JSON.parse(execFileSync(process.execPath, [new URL("../../tools/cli/stage-runtime.mjs", import.meta.url).pathname,
      "run", "--action=execute", "--stage=build-code", "--project=workflowhub",
      `--task=${state.task.identity.taskId}`, `--input=${inputPath}`], {
      cwd: state.candidateWorkspace.worktreeRoot, env: cliEnv, encoding: "utf8",
    }));
  }
  return runOfficialStage("build-code", state.context, { receipts: { ...receipts(state), review } }, {
    runSpecAnalyze: async () => { throw new Error("isolated fixture analyzer unavailable"); },
  });
}

function humanFixture({ defect = null, expiresAt = "P5", phaseCount = 5 } = {}) {
  const state = fixture({ declarationKind: defect === "fixture-only" ? "fixture_only" : "human_declaration",
    exceptionExpiresAt: expiresAt, phaseCount });
  const declared = freshness.parseP5HumanExceptionDeclaration(state.artifacts.read("decision-log.md"),
    state.artifacts.read("phases/index.md"), [{ acceptance_criterion_id: "AC-001" }], state.artifacts.reference("decision-log.md"));
  const subject = { task_id: state.task.identity.taskId, phase_id: "P5", declaration_type: "human_exception" };
  const fields = { subject, declared_by: declared.declared_by, reason: declared.reason,
    impact_scope: declared.scope, expiry_stage: declared.expires_at_phase, owner: declared.owner, verbatim: declared.verbatim };
  if (defect === "wrong-declaration") fields.reason = "A different and unapproved reason.";
  const title = `是否批准以下人工例外声明？\n${JSON.stringify(fields)}`;
  const callId = "isolated-specific-exception-call";
  const questionRaw = `${JSON.stringify({ type: "response_item", payload: { type: "function_call",
    name: "request_user_input_async", call_id: callId,
    arguments: JSON.stringify({ questions: [{ title, options: ["批准这项人工例外", "不批准"] }] }) } })}\n`;
  const answerRaw = `${JSON.stringify({ type: "response_item", payload: { type: "message", role: "user",
    content: [{ type: "input_text", text: `<send_user_message_question_reply>\n${JSON.stringify([{
      questionItemId: JSON.stringify(["request_user_input_async", defect === "wrong-call" ? "other-call" : callId, 0]),
      question: title, answer: defect === "generic-permission" ? "可以，写明没有例外" : "批准这项人工例外",
    }])}\n</send_user_message_question_reply>` }] } })}\n`;
  const permission = { question: { ref: "quality/evidence/permission/specific-question.jsonl", sha256: hash(questionRaw) },
    answer: { ref: "quality/evidence/permission/specific-answer.jsonl", sha256: hash(answerRaw) } };
  for (const [name, raw] of [["question", questionRaw], ["answer", answerRaw]]) state.task.writeRecordAtomic(permission[name].ref, raw);
  state.artifacts.writeAtomic("decision-log.md", `${state.artifacts.read("decision-log.md")}\n## 例外批准来源（隔离协议夹具；不是 CARD04 授权）\n\n\`${permission.question.ref}\` sha256 \`${permission.question.sha256}\`\n\`${permission.answer.ref}\` sha256 \`${permission.answer.sha256}\`\n`);
  state.context.workflowRunId = state.kernel.deriveStageWorkflowRunId("build-code");
  return { ...state, permission, humanApproval: true };
}

describe("P5 specifically approved human exception", () => {
  it("publishes and independently authenticates the exact single declaration approved by its original question/reply", async () => {
    const state = humanFixture();
    await executeNoneFixture(state);
    const facts = JSON.parse(state.task.readRecord(`${reportRoot}/report-facts.json`));
    expect(facts.no_exceptions).toBeUndefined();
    expect(facts.exceptions).toHaveLength(1);
    expect(facts.exceptions[0]).toMatchObject({ declared_by: "Fixture User", owner: "Fixture Owner",
      scope: "AC-001 in this isolated Task only", expires_at_phase: "P5",
      reason: "The fixture has no real page or service.",
      verbatim: "For this isolated fixture, defer the AC-001 business verdict until P6." });
    expect(facts.not_done).toEqual(expect.arrayContaining([expect.objectContaining({ item: "source_binding" })]));
    expect(freshness.authenticateP5StageEndReport(state.task)).toMatchObject({ status: "recorded", authenticated: true });
    writeFileSync(join(state.task.taskPath, state.permission.answer.ref), "{\"human_approved\":true}\n");
    expect(freshness.authenticateP5StageEndReport(state.task)).toMatchObject({ authenticated: false });
  });
  it.each(["generic-permission", "wrong-declaration", "wrong-call", "fixture-only"])(
    "rejects the %s approval candidate", async (defect) => {
      const state = humanFixture({ defect });
      await executeNoneFixture(state);
      expect(existsSync(join(state.task.taskPath, reportRoot, "report-facts.json"))).toBe(false);
    });
});

describe("P5 public run source consumer", () => {
  it.each(["none", "declared"])("reaches the %s report consumer through actual CLI without caller audit", async (kind) => {
    const state = kind === "none" ? noneFixture() : humanFixture();
    // Public topology reads the controlled label from the identity section.
    // Only these new CLI fixtures require this change to their authored input.
    state.artifacts.writeAtomic("decision-log.md", state.artifacts.read("decision-log.md")
      .replace("## 核心需求", "## 任务身份"));
    state.context.workflowRunId = state.kernel.deriveStageWorkflowRunId("build-code");
    const result = await executeNoneFixture(state, { publicCli: true });
    expect(result.stage).toBe("build-code");
    expect(freshness.authenticateP5StageEndReport(state.task)).toMatchObject({ status: "recorded", authenticated: true });
    const facts = JSON.parse(state.task.readRecord(`${reportRoot}/report-facts.json`));
    expect(kind === "none" ? facts.no_exceptions.kind : facts.exceptions.length).toBe(kind === "none" ? "none" : 1);
    expect(JSON.parse(readFileSync(join(state.root, "public-p5-run.json"))).receipts.audit).toBeUndefined();
    const delivery = JSON.parse(state.task.readRecord(`${reportRoot}/T008-delivery.txt`));
    const source = JSON.parse(state.task.readRecord(delivery.source_ref));
    expect(source.receipts).not.toHaveProperty("audit");
    expect(result.status).not.toBe("completed");
    const observed = [...new Map([...source.quality_facts, ...source.quality_advisory_facts]
      .map((binding) => [binding.ref, binding])).values()].map((binding) => ({ ...binding,
        fact: JSON.parse(state.task.readRecord(binding.ref)) }));
    // Record the real public source census. Absence of an audit subject means
    // this projection cannot prove that diagnostic's status, never "passed".
    console.info("P5 public generic audit source observation", JSON.stringify({ kind,
      published_subjects: observed.map(({ ref, sha256, fact }) => ({ ref, sha256, subject: fact.subject, status: fact.status })),
      audit_facts: observed.filter(({ fact }) => new Set(["audit", "support:audit"]).has(fact.subject)) }));
    expect(facts.not_done.length).toBeGreaterThan(0);
  });
});

describe("P5 finite zero-exception sources", () => {
  it("publishes and independently reads finite none while preserving unfinished machine facts", async () => {
    const state = noneFixture();
    await executeNoneFixture(state);
    const raw = state.task.readRecord(`${reportRoot}/report-facts.json`);
    const facts = JSON.parse(raw);
    expect(facts.exceptions).toEqual([]);
    expect(facts.no_exceptions).toMatchObject({ kind: "none", permission_refs: state.permission,
      scope: { task_id: state.task.identity.taskId, phase_id: "P5", report_scope: "p5_intermediate" } });
    expect(facts.not_done).toEqual(expect.arrayContaining([expect.objectContaining({ item: "source_binding" }),
      expect.objectContaining({ status: "unavailable" })]));
    expect(state.task.readRecord(`${reportRoot}/report.md`)).toContain("最终仍待 P13 核查");
    expect(freshness.authenticateP5StageEndReport(state.task)).toMatchObject({ status: "recorded", authenticated: true });
    const delivery = JSON.parse(state.task.readRecord(`${reportRoot}/T008-delivery.txt`));
    const source = JSON.parse(state.task.readRecord(delivery.source_ref));
    expect(source.human_exception_source).toEqual(facts.no_exceptions);
    const audit = JSON.parse(state.task.readRecord(facts.no_exceptions.audit_ref));
    expect(audit.sources.some((entry) => entry.ref.startsWith("quality/reviews/results/"))).toBe(true);
    expect(audit.sources.some((entry) => entry.ref.startsWith("quality/reviews/attempts/"))).toBe(true);
    expect(audit.sources.some((entry) => entry.ref.startsWith("quality/facts/"))).toBe(true);
    // A later risk cannot rewrite the authenticated publication-time census.
    const riskRaw = `${JSON.stringify({ schema_version: "risk-acceptance.v1", task_id: state.task.identity.taskId,
      selected_option: "accept-risk", finding_id: "later-risk" })}\n`;
    state.task.writeRecordAtomic(`quality/evidence/risk-acceptances/${hash(riskRaw)}.json`, riskRaw);
    expect(freshness.authenticateP5StageEndReport(state.task)).toMatchObject({ authenticated: true,
      current_quality: { status: "unknown" } });
  });

  it.each(["wrong-call", "refused", "missing-answer", "tampered-answer", "unknown-material", "unreferenced-risk"])(
    "does not publish none with %s", async (defect) => {
      const state = noneFixture({ defect });
      await executeNoneFixture(state);
      expect(existsSync(join(state.task.taskPath, reportRoot, "report-facts.json"))).toBe(false);
      expect(freshness.authenticateP5StageEndReport(state.task)).toMatchObject({ authenticated: false });
    });

  it("rejects a self-labelled complete audit, source omissions and corrupt permission bytes on readback", async () => {
    const state = noneFixture();
    await executeNoneFixture(state);
    const facts = JSON.parse(state.task.readRecord(`${reportRoot}/report-facts.json`));
    const path = join(state.task.taskPath, facts.no_exceptions.audit_ref);
    const original = readFileSync(path);
    const audit = JSON.parse(original);
    writeFileSync(path, JSON.stringify({ ...audit, complete: true, sources: [] }));
    expect(freshness.authenticateP5StageEndReport(state.task)).toMatchObject({ authenticated: false });
    writeFileSync(path, original);
    writeFileSync(join(state.task.taskPath, state.permission.answer.ref), "{\"human_approved\":true}\n");
    expect(freshness.authenticateP5StageEndReport(state.task)).toMatchObject({ authenticated: false });
  });
});

describe("P5 same-run report source", () => {
  it("fails closed and separates read faults from missing or corrupt report originals", () => {
    const state = fixture();
    const files = syntheticReportEnvelope(state);
    const baseline = freshness.authenticateP5StageEndReport(state.task);
    expect(baseline).toMatchObject({ status: "missing", authenticated: false });
    expect(baseline.reason).toMatch(/publication facts.*(?:absent|missing|binding)/i);
    for (const code of ["EACCES", "EPERM", "EIO"]) {
      for (const [name, original] of Object.entries(files)) {
        const priorOpen = fs.openSync;
        let injected = false;
        fs.openSync = (path, ...args) => {
          if (path === original.path) {
            injected = true;
            const error = new Error(`injected ${code} while reading ${name}`);
            error.code = code;
            throw error;
          }
          return priorOpen(path, ...args);
        };
        syncBuiltinESMExports();
        try {
          const result = freshness.authenticateP5StageEndReport(state.task);
          expect(injected).toBe(true);
          expect(result).toMatchObject({ status: "unavailable", authenticated: false });
          expect(result.reason).toContain(`injected ${code} while reading ${name}`);
        } finally {
          fs.openSync = priorOpen;
          syncBuiltinESMExports();
        }
      }
    }
    renameSync(files.report.path, `${files.report.path}.missing`);
    const absent = freshness.authenticateP5StageEndReport(state.task);
    expect(absent).toMatchObject({ status: "missing", authenticated: false });
    expect(absent.reason).toMatch(/ENOENT/);
    renameSync(`${files.report.path}.missing`, files.report.path);
    writeFileSync(files.report.path, "# Tampered fixture report\n");
    const corrupt = freshness.authenticateP5StageEndReport(state.task);
    expect(corrupt).toMatchObject({ status: "missing", authenticated: false });
    expect(corrupt.reason).toMatch(/ref\/hash binding/);
  });
  const p5Index = "## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n"
    + Array.from({ length: 5 }, (_, n) => `| \`P${n + 1}\` | \`phases/P${n + 1}.md\` |`).join("\n");
  it.each([
    ["two JSON fences in the same declaration section", (json) =>
      `## 人工例外声明\n\n\`\`\`json\n${json}\n\`\`\`\n\n\`\`\`json\n${json}\n\`\`\`\n`],
    ["an empty declaration section followed by JSON in a different section", (json) =>
      `## 人工例外声明\n\n## 其他章节\n\n\`\`\`json\n${json}\n\`\`\`\n`],
  ])("rejects %s", (_label, document) => {
    const entry = { declared_by: "Fixture User", reason: "No page", scope: "AC-001",
      expires_at_phase: "P5", owner: "Fixture Owner", verbatim: "Fixture text." };
    const raw = document(JSON.stringify({ kind: "fixture_only", declarations: [entry] }));
    const index = "## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n"
      + Array.from({ length: 5 }, (_, n) => `| \`P${n + 1}\` | \`phases/P${n + 1}.md\` |`).join("\n");
    expect(() => freshness.parseP5HumanExceptionDeclaration(raw, index,
      [{ acceptance_criterion_id: "AC-001" }], "specs/fixture/decision-log.md")).toThrow();
  });
  it.each([1, 2, 3])("parses one declaration with an indented heading of %s spaces", (width) => {
    const entry = { declared_by: "Fixture User", reason: "No page", scope: "AC-001",
      expires_at_phase: "P5", owner: "Fixture Owner", verbatim: "Fixture text." };
    const raw = `${" ".repeat(width)}## 人工例外声明\n\n\`\`\`json\n${JSON.stringify({ kind: "fixture_only", declarations: [entry] })}\n\`\`\`\n`;
    expect(freshness.parseP5HumanExceptionDeclaration(raw, p5Index,
      [{ acceptance_criterion_id: "AC-001" }], "specs/fixture/decision-log.md")).toMatchObject(entry);
  });
  it.each([1, 2, 3])("rejects JSON after an empty declaration and an indented next heading of %s spaces", (width) => {
    const entry = { declared_by: "Fixture User", reason: "No page", scope: "AC-001",
      expires_at_phase: "P5", owner: "Fixture Owner", verbatim: "Fixture text." };
    const raw = `## 人工例外声明\n\n${" ".repeat(width)}## 其他章节\n\n\`\`\`json\n${JSON.stringify({ kind: "fixture_only", declarations: [entry] })}\n\`\`\`\n`;
    expect(() => freshness.parseP5HumanExceptionDeclaration(raw, p5Index,
      [{ acceptance_criterion_id: "AC-001" }], "specs/fixture/decision-log.md")).toThrow();
  });
  it.each([1, 2, 3])("rejects an indented duplicate declaration heading of %s spaces", (width) => {
    const entry = { declared_by: "Fixture User", reason: "No page", scope: "AC-001",
      expires_at_phase: "P5", owner: "Fixture Owner", verbatim: "Fixture text." };
    const block = `\`\`\`json\n${JSON.stringify({ kind: "fixture_only", declarations: [entry] })}\n\`\`\`\n`;
    const raw = `## 人工例外声明\n\n${block}\n${" ".repeat(width)}## 人工例外声明\n`;
    expect(() => freshness.parseP5HumanExceptionDeclaration(raw, p5Index,
      [{ acceptance_criterion_id: "AC-001" }], "specs/fixture/decision-log.md")).toThrow();
  });
  it("does not treat four leading spaces as a declaration heading", () => {
    expect(() => freshness.parseP5HumanExceptionDeclaration("    ## 人工例外声明\n", p5Index,
      [{ acceptance_criterion_id: "AC-001" }], "specs/fixture/decision-log.md")).toThrow();
  });
  it("parses one isolated declaration with all six report fields and checks every scoped AC and indexed expiry", () => {
    const index = "## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n"
      + Array.from({ length: 6 }, (_, n) => `| \`P${n + 1}\` | \`phases/P${n + 1}.md\` |`).join("\n");
    const makeLog = (entry, declarations = [entry]) => `# Decision\n\n## 人工例外声明\n\n\`\`\`json\n${JSON.stringify({ kind: "fixture_only", declarations })}\n\`\`\`\n`;
    const entry = { declared_by: "Fixture User", reason: "No page", scope: "AC-001 and AC-002",
      expires_at_phase: "P6", owner: "Fixture Owner", verbatim: "I agree in this isolated fixture." };
    const chain = [{ acceptance_criterion_id: "AC-001" }, { acceptance_criterion_id: "AC-002" }];
    const sourceRef = "specs/fixture/decision-log.md";
    const parsed = freshness.parseP5HumanExceptionDeclaration(makeLog(entry), index, chain, sourceRef);
    expect(parsed).toMatchObject({ ...entry, source_ref: sourceRef,
      source_sha256: hash(makeLog(entry)), fixture_only: true });
    expect(parsed.source_path).toBe(`${sourceRef}#human-exception-declaration`);
    const facts = buildStageEndReportFacts({ declared: { exceptions: [parsed] } });
    expect(facts.exceptions[0]).toMatchObject({ ...entry, source: parsed.source_path });
    expect(renderStageEndReport(facts)).toContain(entry.verbatim);
    for (const invalid of [
      [makeLog({ ...entry, owner: "" }), index, chain],
      [makeLog({ ...entry, scope: "AC-001 and AC-999" }), index, chain],
      [makeLog({ ...entry, scope: "AC-0010" }), index, chain],
      [makeLog({ ...entry, expires_at_phase: "P99" }), index, chain],
      [makeLog({ ...entry, expires_at_phase: "P4" }), index, chain],
      [makeLog(entry, [entry, entry]), index, chain],
      [makeLog(entry) + makeLog(entry), index, chain],
      [makeLog(entry), index.replace("| `P6` | `phases/P6.md` |", "| `P6` | `phases/P5.md` |"), chain],
    ]) expect(() => freshness.parseP5HumanExceptionDeclaration(...invalid, sourceRef)).toThrow();
  });
  it.each([
    ["CARD04-shaped Task identity with fixture_only text", { taskId: "workflowhub-thin-core-card-04-20260919" }],
    ["unsupported human approval claim in the isolated fixture", { declarationKind: "human_approved" }],
  ])("does not publish a formal report from %s", async (_label, options) => {
    const state = fixture(options);
    writeStageRow(state.task.taskPath, { stage: "build-code", source: "fixture",
      phase_progress: { phase_id: "P5", task_id: "T008", material_revision: state.kernel.currentVNextMaterialRevision(),
        recorded_at: "2026-09-27T00:00:00.000Z" } });
    const review = await phaseReview(state);
    await runOfficialStage("build-code", state.context, { receipts: { ...receipts(state), review } });
    const marker = join(state.task.taskPath, reportRoot, "report-facts.json");
    if (process.env.WORKFLOWHUB_P5_RETAINED_STATE_PATH && existsSync(marker)) retainedTaskPath = state.task.taskPath;
    expect(existsSync(marker)).toBe(false);
    expect(freshness.authenticateP5StageEndReport(state.task)).toMatchObject({ status: "missing", authenticated: false });
  });

  it("validates a single complete T007 Vitest summary and rejects misleading output", () => {
    const valid = [
      " RUN  v2.1.9 /fixture/repo",
      " ✓ runtime/stage/stage-end-report.test.mjs (20 tests) 13ms",
      " Test Files  1 passed (1)",
      "      Tests  20 passed (20)",
      "   Duration  120ms",
    ].join("\n");
    expect(typeof freshness.isCompleteP5T007VitestOutput).toBe("function");
    expect(freshness.isCompleteP5T007VitestOutput(valid)).toBe(true);
    for (const misleading of [
      valid.replaceAll("20", "14"),
      valid.replace("20 passed (20)", "20 passed (21)"),
      valid.replace("(20 tests)", "(19 tests)"),
      `${valid}\n Test Files  1 failed (1)`,
      `${valid}\n      Tests  1 failed (21)`,
      `${valid}\n      Tests  20 passed (20)`,
      valid.replace("20 passed (20)", "20 passed (20) 1 skipped"),
      valid.replace(" ✓ runtime", " ❯ runtime"),
      "logger: Tests  20 passed (20)",
    ]) expect(freshness.isCompleteP5T007VitestOutput(misleading)).toBe(false);
  });

  it("writes no P5 report for a P1-only task even with a P5 cursor claim", async () => {
    const state = fixture({ p5: false });
    writeStageRow(state.task.taskPath, { stage: "build-code", source: "fixture",
      phase_progress: { phase_id: "P5", task_id: "T008", material_revision: state.kernel.currentVNextMaterialRevision(),
        recorded_at: "2026-09-27T00:00:00.000Z" } });
    const review = await phaseReview(state, "P1");
    await runOfficialStage("build-code", state.context, { receipts: { ...receipts(state), review } });
    expect(existsSync(join(state.task.taskPath, reportRoot))).toBe(false);
  });

  it("writes no P5 report when the current P5 review is unavailable", async () => {
    const state = fixture();
    writeStageRow(state.task.taskPath, { stage: "build-code", source: "fixture",
      phase_progress: { phase_id: "P5", task_id: "T008", material_revision: state.kernel.currentVNextMaterialRevision(),
        recorded_at: "2026-09-27T00:00:00.000Z" } });
    await runOfficialStage("build-code", state.context, { receipts: receipts(state) });
    expect(existsSync(join(state.task.taskPath, reportRoot))).toBe(false);
  });

  it("writes no P5 report without an explicit human exception declaration", async () => {
    const state = fixture({ humanException: false });
    writeStageRow(state.task.taskPath, { stage: "build-code", source: "fixture",
      phase_progress: { phase_id: "P5", task_id: "T008", material_revision: state.kernel.currentVNextMaterialRevision(),
        recorded_at: "2026-09-27T00:00:00.000Z" } });
    const review = await phaseReview(state);
    await runOfficialStage("build-code", state.context, { receipts: { ...receipts(state), review } });
    expect(existsSync(join(state.task.taskPath, reportRoot))).toBe(false);
  });

  it("does not apply an AC-0010 declaration to the distinct AC-001", async () => {
    const state = fixture({ exceptionScope: "AC-0010 in this isolated Task only",
      exceptionVerbatim: "For this isolated fixture, defer the AC-0010 business verdict until P6." });
    writeStageRow(state.task.taskPath, { stage: "build-code", source: "fixture",
      phase_progress: { phase_id: "P5", task_id: "T008", material_revision: state.kernel.currentVNextMaterialRevision(),
        recorded_at: "2026-09-27T00:00:00.000Z" } });
    const review = await phaseReview(state);
    await runOfficialStage("build-code", state.context, { receipts: { ...receipts(state), review } });
    expect(existsSync(join(state.task.taskPath, reportRoot))).toBe(false);
  });

  it("does not apply an exception that expired before P5", async () => {
    const state = fixture({ exceptionExpiresAt: "P4" });
    writeStageRow(state.task.taskPath, { stage: "build-code", source: "fixture",
      phase_progress: { phase_id: "P5", task_id: "T008", material_revision: state.kernel.currentVNextMaterialRevision(),
        recorded_at: "2026-09-27T00:00:00.000Z" } });
    const review = await phaseReview(state);
    await runOfficialStage("build-code", state.context, { receipts: { ...receipts(state), review } });
    expect(existsSync(join(state.task.taskPath, reportRoot))).toBe(false);
  });

  it("publishes a specifically approved exception which expires at P5", async () => {
    const state = humanFixture({ expiresAt: "P5" });
    writeStageRow(state.task.taskPath, { stage: "build-code", source: "fixture",
      phase_progress: { phase_id: "P5", task_id: "T008", material_revision: state.kernel.currentVNextMaterialRevision(),
        recorded_at: "2026-09-27T00:00:00.000Z" } });
    const review = await phaseReview(state);
    await runOfficialStage("build-code", state.context, { receipts: { ...receipts(state), review } });
    expect(existsSync(join(state.task.taskPath, reportRoot, "report-facts.json"))).toBe(true);
  });

  it("writes no P5 report for a stale implementation and test snapshot", async () => {
    const state = fixture();
    writeStageRow(state.task.taskPath, { stage: "build-code", source: "fixture",
      phase_progress: { phase_id: "P5", task_id: "T008", material_revision: state.kernel.currentVNextMaterialRevision(),
        recorded_at: "2026-09-27T00:00:00.000Z" } });
    const review = await phaseReview(state);
    const suppliedReceipts = { ...receipts(state), review };
    writeFileSync(join(state.candidateWorkspace.worktreeRoot, "base.mjs"), "export const value = 2;\n");
    await expect(runOfficialStage("build-code", state.context, { receipts: suppliedReceipts }))
      .rejects.toThrow("canonical implementation receipt provenance is invalid");
    expect(existsSync(join(state.task.taskPath, reportRoot))).toBe(false);
  });

  it("writes no P5 report when the claimed review ref has no original record", async () => {
    const state = fixture();
    writeStageRow(state.task.taskPath, { stage: "build-code", source: "fixture",
      phase_progress: { phase_id: "P5", task_id: "T008", material_revision: state.kernel.currentVNextMaterialRevision(),
        recorded_at: "2026-09-27T00:00:00.000Z" } });
    const suppliedReceipts = { ...receipts(state), review: "quality/reviews/results/build-code-simple-missing.json" };
    await expect(runOfficialStage("build-code", state.context, { receipts: suppliedReceipts }))
      .rejects.toThrow("code review result is unavailable");
    expect(existsSync(join(state.task.taskPath, reportRoot))).toBe(false);
  });

  it("rejects different same-run sources and preserves the first report", async () => {
    const state = noneFixture();
    writeStageRow(state.task.taskPath, { stage: "build-code", source: "fixture",
      phase_progress: { phase_id: "P5", task_id: "T008", material_revision: state.kernel.currentVNextMaterialRevision(),
        recorded_at: "2026-09-27T00:00:00.000Z" } });
    const review = await phaseReview(state);
    const suppliedReceipts = { ...receipts(state), review };
    await runOfficialStage("build-code", state.context, { receipts: suppliedReceipts });
    const folder = join(state.task.taskPath, reportRoot);
    const beforeNames = readdirSync(folder).sort();
    const before = Object.fromEntries(beforeNames.map((name) => [name, readFileSync(join(folder, name))]));
    await expect(runOfficialStage("build-code", state.context, { receipts: suppliedReceipts }))
      .rejects.toThrow("P5 report source conflict");
    expect(readdirSync(folder).sort()).toEqual(beforeNames);
    for (const name of beforeNames) expect(readFileSync(join(folder, name))).toEqual(before[name]);
  });

  it("preserves report originals after a different implementation snapshot", async () => {
    const state = noneFixture();
    writeStageRow(state.task.taskPath, { stage: "build-code", source: "fixture",
      phase_progress: { phase_id: "P5", task_id: "T008", material_revision: state.kernel.currentVNextMaterialRevision(),
        recorded_at: "2026-09-27T00:00:00.000Z" } });
    const firstReview = await phaseReview(state);
    await runOfficialStage("build-code", state.context, { receipts: { ...receipts(state), review: firstReview } });
    const folder = join(state.task.taskPath, reportRoot);
    const beforeNames = readdirSync(folder).sort();
    const before = Object.fromEntries(beforeNames.map((name) => [name, readFileSync(join(folder, name))]));
    const priorTree = state.kernel.currentVNextSnapshot().tree;
    writeFileSync(join(state.candidateWorkspace.worktreeRoot, "base.mjs"), "export const value = 2;\n");
    expect(state.kernel.currentVNextSnapshot().tree).not.toBe(priorTree);
    await phaseReview(state);
    expect(() => receipts(state)).toThrow("implementation snapshot receipt already exists with different content");
    expect(readdirSync(folder).sort()).toEqual(beforeNames);
    for (const name of beforeNames) expect(readFileSync(join(folder, name))).toEqual(before[name]);
  });

  it("writes no P5 report when the real stage row writer fails after publication", async () => {
    const state = fixture();
    writeStageRow(state.task.taskPath, { stage: "build-code", source: "fixture",
      phase_progress: { phase_id: "P5", task_id: "T008", material_revision: state.kernel.currentVNextMaterialRevision(),
        recorded_at: "2026-09-27T00:00:00.000Z" } });
    const review = await phaseReview(state);
    const suppliedReceipts = { ...receipts(state), review };
    const factsPath = join(state.task.taskPath, "facts.jsonl");
    const result = await runOfficialStage("build-code", state.context, { receipts: suppliedReceipts }, {
      runStageReflection: async () => {
        renameSync(factsPath, `${factsPath}.before-fault`);
        mkdirSync(factsPath);
        return null;
      },
    });
    expect(result.stage_reflection.stage_row_error).toBeTruthy();
    expect(existsSync(join(state.task.taskPath, reportRoot))).toBe(false);
  });

  it.each(["report.md", "T008-delivery.txt"])("leaves no commit marker after report write failure at %s", async (failedName) => {
    const state = noneFixture();
    writeStageRow(state.task.taskPath, { stage: "build-code", source: "fixture",
      phase_progress: { phase_id: "P5", task_id: "T008", material_revision: state.kernel.currentVNextMaterialRevision(),
        recorded_at: "2026-09-27T00:00:00.000Z" } });
    const review = await phaseReview(state);
    const suppliedReceipts = { ...receipts(state), review };
    const originalLink = fs.linkSync;
    const failedPath = join(state.task.taskPath, reportRoot, failedName);
    let injected = false;
    fs.linkSync = (source, target) => {
      if (target === failedPath) {
        injected = true;
        const error = new Error(`injected Task store write failure at ${failedName}`);
        error.code = "EIO";
        throw error;
      }
      return originalLink(source, target);
    };
    syncBuiltinESMExports();
    try {
      await expect(runOfficialStage("build-code", state.context, { receipts: suppliedReceipts }))
        .rejects.toThrow(`injected Task store write failure at ${failedName}`);
    } finally {
      fs.linkSync = originalLink;
      syncBuiltinESMExports();
    }
    expect(injected).toBe(true);
    expect(existsSync(join(state.task.taskPath, reportRoot, "report-facts.json"))).toBe(false);
  });

  it("retries an interrupted report write using the exact same source bytes", async () => {
    const state = noneFixture();
    writeStageRow(state.task.taskPath, { stage: "build-code", source: "fixture",
      phase_progress: { phase_id: "P5", task_id: "T008", material_revision: state.kernel.currentVNextMaterialRevision(),
        recorded_at: "2026-09-27T00:00:00.000Z" } });
    const review = await phaseReview(state);
    const suppliedReceipts = { ...receipts(state), review };
    const originalLink = fs.linkSync;
    const failedPath = join(state.task.taskPath, reportRoot, "report.md");
    let injections = 0;
    fs.linkSync = (source, target) => {
      if (injections === 0 && target === failedPath) {
        injections += 1;
        const error = new Error("injected one-time Task store write interruption");
        error.code = "EIO";
        throw error;
      }
      return originalLink(source, target);
    };
    syncBuiltinESMExports();
    try {
      await runOfficialStage("build-code", state.context, { receipts: suppliedReceipts });
    } finally {
      fs.linkSync = originalLink;
      syncBuiltinESMExports();
    }
    expect(injections).toBe(1);
    const folder = join(state.task.taskPath, reportRoot);
    const delivery = JSON.parse(readFileSync(join(folder, "T008-delivery.txt"), "utf8"));
    expect(readdirSync(folder).filter((name) => /^source-[a-f0-9]{64}\.json$/.test(name))).toHaveLength(1);
    expect(readdirSync(folder).filter((name) => /^certificate-[a-f0-9]{64}\.json$/.test(name))).toHaveLength(1);
    expect(hash(readFileSync(join(folder, "report-facts.json")))).toBe(delivery.facts_sha256);
    expect(hash(state.task.readRecord(delivery.source_ref))).toBe(delivery.source_sha256);
    expect(hash(state.task.readRecord(delivery.certificate_ref))).toBe(delivery.certificate_sha256);
  });

  it("keeps complete same-run fixture inputs unreported without a confirmed human source", async () => {
    const state = fixture();
    writeStageRow(state.task.taskPath, { stage: "build-code", source: "fixture",
      phase_progress: { phase_id: "P5", task_id: "T008", material_revision: state.kernel.currentVNextMaterialRevision(),
        recorded_at: "2026-09-27T00:00:00.000Z" } });
    const review = await phaseReview(state);
    const suppliedReceipts = { ...receipts(state), review };
    const implementationRecord = JSON.parse(state.task.readRecord(suppliedReceipts.implementation));
    const testRecord = JSON.parse(state.task.readRecord(suppliedReceipts.tests));
    const reviewRecord = JSON.parse(state.task.readRecord(suppliedReceipts.review));
    const testOutput = state.task.readRecord(testRecord.output_ref);
    expect(implementationRecord.changed).toContain("runtime/stage/stage-end-report.mjs");
    expect(implementationRecord.snapshot_tree).toBe(state.kernel.currentVNextSnapshot().tree);
    expect(testRecord).toMatchObject({ command: t007Command, exit_code: 0,
      snapshot_tree: implementationRecord.snapshot_tree,
      producer: { stage: "build-code", component: "build-code-test-capture" } });
    expect(hash(testOutput)).toBe(testRecord.output_hash);
    expect(freshness.isCompleteP5T007VitestOutput(testOutput)).toBe(true);
    expect(reviewRecord).toMatchObject({ stage: "build-code", review_scope: "phase", phase_id: "P5",
      snapshot_tree: implementationRecord.snapshot_tree,
      material_revision: state.kernel.currentVNextMaterialRevision() });
    expect(state.artifacts.read("decision-log.md")).toContain("测试夹具，非 CARD04 用户批准");
    pendingFixtureExports.push({ state, refs: suppliedReceipts });
    let analyzerChain = null;
    const result = await runOfficialStage("build-code", state.context, { receipts: suppliedReceipts }, {
      runSpecAnalyze: async (request) => {
        analyzerChain = request.packet.acceptance_coverage;
        throw new Error("fixture analyzer unavailable after observing the same-run chain");
      },
    });
    expect(analyzerChain).toEqual(expect.arrayContaining([expect.objectContaining({ acceptance_criterion_id: "AC-001" })]));
    expect(result.quality_fact_refs.length).toBeGreaterThan(0);
    const advisory = freshness.authenticateP5AdvisorySources({
      read: (ref) => state.task.readRecord(ref), taskId: state.task.identity.taskId,
      snapshotTree: state.kernel.currentVNextSnapshot().tree,
      materialRevision: state.kernel.currentVNextMaterialRevision(), stageResult: result,
    });
    expect(advisory).toHaveLength(result.quality_advisory_fact_refs.length);
    expect(advisory).toEqual(expect.arrayContaining([expect.objectContaining({
      ref: result.quality_advisory_fact_refs[0], sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
    })]));
    const source = { read: (ref) => state.task.readRecord(ref), taskId: state.task.identity.taskId,
      snapshotTree: state.kernel.currentVNextSnapshot().tree,
      materialRevision: state.kernel.currentVNextMaterialRevision(), stageResult: result };
    expect(() => freshness.authenticateP5AdvisorySources({ ...source, bindings: [] })).toThrow(/list|binding/);
    expect(() => freshness.authenticateP5AdvisorySources({ ...source, bindings: advisory.map((item) => ({ ...item, sha256: "0".repeat(64) })) })).toThrow(/hash/);
    expect(() => freshness.authenticateP5AdvisorySources({ ...source, stageResult: {
      ...result, quality_advisories: ["stage-end-spec-analyze:inconsistent"],
    } })).toThrow(/verdict|advisory/);
    expect(() => freshness.authenticateP5AdvisorySources({ ...source, stageResult: {
      ...result, quality_advisory_fact_refs: [],
    } })).toThrow(/fact list/);
    expect(() => freshness.authenticateP5AdvisorySources({ ...source, stageResult: {
      ...result, quality_advisory_fact_refs: [...result.quality_advisory_fact_refs, result.quality_advisory_fact_refs[0]],
    } })).toThrow(/duplicated/);
    expect(() => freshness.authenticateP5AdvisorySources({ ...source, stageResult: {
      ...result, quality_advisories: ["stage-end-spec-analyze:unavailable", "stage-end-spec-analyze:unavailable"],
    } })).toThrow(/duplicated/);

    const originalFactRef = result.quality_advisory_fact_refs[0];
    const originalFact = JSON.parse(state.task.readRecord(originalFactRef));
    const originalWrapper = JSON.parse(state.task.readRecord(originalFact.evidence[0].ref));
    const originalStage = JSON.parse(state.task.readRecord(originalWrapper.refs[0].ref));
    const virtual = ({ verdict = "unavailable", changeStage = () => {}, changeWrapper = () => {}, changeFact = () => {} } = {}) => {
      const stage = structuredClone(originalStage);
      const wrapper = structuredClone(originalWrapper);
      const fact = structuredClone(originalFact);
      const status = verdict === "consistent" ? "passed" : "missing";
      const expectedResult = { consistent: "pass", material_incomplete: "incomplete",
        inconsistent: "inconsistent", unavailable: "unavailable" }[verdict];
      stage.status = status;
      stage.subject_fact.status = status;
      stage.subject_fact.analysis_result.status = verdict;
      stage.subject_fact.evidence_state = verdict;
      changeStage(stage);
      const stageRaw = `${JSON.stringify(stage, null, 2)}\n`;
      const stageSha = hash(stageRaw);
      const stageRef = `quality/evidence/stage-quality/build-code/stage_end_spec_analyze-${stageSha}.json`;
      wrapper.result = expectedResult;
      wrapper.summary.actual_outcome = verdict;
      wrapper.refs = [{ ref: stageRef, sha256: stageSha }];
      wrapper.freshness.evidence_freshness = [{ ref: stageRef, sha256: stageSha, status: "current" }];
      changeWrapper(wrapper);
      const wrapperRaw = `${JSON.stringify(wrapper, null, 2)}\n`;
      const wrapperSha = hash(wrapperRaw);
      const wrapperRef = `quality/evidence/acceptance/build-code/stage_end_spec_analyze-${wrapperSha}.json`;
      fact.status = status;
      fact.evidence = [{ ref: wrapperRef, sha256: wrapperSha, evidence_type: "acceptance_evidence" }];
      changeFact(fact);
      const factDigest = qualityFactDigest(fact);
      fact.fact_id = `quality-${factDigest}`;
      const factRaw = `${JSON.stringify(fact, null, 2)}\n`;
      const factRef = `quality/facts/${factDigest}.json`;
      const records = new Map([[stageRef, stageRaw], [wrapperRef, wrapperRaw], [factRef, factRaw]]);
      const stageResult = { ...result,
        quality_advisory_fact_refs: result.quality_advisory_fact_refs.map((ref) => ref === originalFactRef ? factRef : ref),
        quality_advisories: verdict === "consistent" ? [] : [`stage-end-spec-analyze:${verdict}`] };
      return { ...source, read: (ref) => records.get(ref) ?? state.task.readRecord(ref), stageResult };
    };
    for (const verdict of ["consistent", "material_incomplete", "inconsistent", "unavailable"]) {
      expect(freshness.authenticateP5AdvisorySources(virtual({ verdict }))).toHaveLength(result.quality_advisory_fact_refs.length);
    }
    const unrelatedFact = structuredClone(originalFact);
    unrelatedFact.subject = "another_quality_advisory";
    const unrelatedDigest = qualityFactDigest(unrelatedFact);
    unrelatedFact.fact_id = `quality-${unrelatedDigest}`;
    const unrelatedRef = `quality/facts/${unrelatedDigest}.json`;
    const unrelatedRaw = `${JSON.stringify(unrelatedFact, null, 2)}\n`;
    const withEarlierUnrelatedFact = { ...source,
      read: (ref) => ref === unrelatedRef ? unrelatedRaw : state.task.readRecord(ref),
      stageResult: { ...result,
        quality_advisory_fact_refs: [unrelatedRef, ...result.quality_advisory_fact_refs] } };
    const withEarlierBindings = freshness.authenticateP5AdvisorySources(withEarlierUnrelatedFact);
    expect(withEarlierBindings[0]).toEqual({ ref: unrelatedRef, sha256: hash(unrelatedRaw) });
    expect(() => freshness.authenticateP5AdvisorySources({ ...withEarlierUnrelatedFact,
      bindings: [...withEarlierBindings].reverse() })).toThrow(/binding list/);
    for (const broken of [
      virtual({ verdict: "inconsistent", changeStage: (stage) => { stage.status = "passed"; } }),
      virtual({ verdict: "inconsistent", changeWrapper: (wrapper) => { wrapper.result = "pass"; } }),
      virtual({ verdict: "inconsistent", changeFact: (fact) => { fact.status = "passed"; } }),
      virtual({ verdict: "inconsistent", changeFact: (fact) => { fact.kind = "review"; } }),
      virtual({ changeWrapper: (wrapper) => { wrapper.freshness.status = "stale"; } }),
      virtual({ changeWrapper: (wrapper) => { wrapper.freshness.evidence_freshness = []; } }),
      virtual({ changeWrapper: (wrapper) => { wrapper.refs.push(wrapper.refs[0]); } }),
      virtual({ changeFact: (fact) => { fact.evidence.push(fact.evidence[0]); } }),
    ]) expect(() => freshness.authenticateP5AdvisorySources(broken)).toThrow();
    for (const code of ["EACCES", "EPERM", "EIO"]) {
      const unavailable = virtual();
      expect(() => freshness.authenticateP5AdvisorySources({ ...unavailable, read: (ref) => {
        if (ref === unavailable.stageResult.quality_advisory_fact_refs[0]) {
          const error = new Error(`injected ${code} for ${ref}`);
          error.code = code;
          throw error;
        }
        return unavailable.read(ref);
      } })).toThrow(code);
    }
    expect(existsSync(join(state.task.taskPath, reportRoot))).toBe(false);
    expect(freshness.authenticateP5StageEndReport(state.task)).toMatchObject({ status: "missing", authenticated: false });
    if (process.env.WORKFLOWHUB_P5_RETAINED_STATE_PATH) retainedTaskPath = state.task.taskPath;
  });

  it.each(["EACCES", "EPERM", "EIO"])("surfaces advisory original read %s before writing a P5 report", async (code) => {
    const state = fixture();
    writeStageRow(state.task.taskPath, { stage: "build-code", source: "fixture",
      phase_progress: { phase_id: "P5", task_id: "T008", material_revision: state.kernel.currentVNextMaterialRevision(),
        recorded_at: "2026-09-27T00:00:00.000Z" } });
    const review = await phaseReview(state);
    const suppliedReceipts = { ...receipts(state), review };
    const originalOpen = fs.openSync;
    let injected = false;
    fs.openSync = (path, ...rest) => {
      if (!injected && typeof path === "string" && path.startsWith(`${state.task.taskPath}/quality/facts/`)
          && new Error().stack.includes("authenticateP5AdvisorySources")) {
        injected = true;
        const error = new Error(`injected ${code} for ${path}`);
        error.code = code;
        throw error;
      }
      return originalOpen(path, ...rest);
    };
    syncBuiltinESMExports();
    try {
      await expect(runOfficialStage("build-code", state.context, { receipts: suppliedReceipts }, {
        runSpecAnalyze: async () => { throw new Error("fixture analyzer unavailable"); },
      })).rejects.toThrow(`injected ${code}`);
    } finally {
      fs.openSync = originalOpen;
      syncBuiltinESMExports();
    }
    expect(injected).toBe(true);
    expect(existsSync(join(state.task.taskPath, reportRoot, "report-facts.json"))).toBe(false);
  });
});

// Appended T008 contracts use actual isolated Task publications. Their protocol
// question/reply fixtures are never CARD04 authorization or completion evidence.
describe("P5 D004 authenticated acceptance sources", () => {
  function graph(state) {
    const delivery = JSON.parse(state.task.readRecord(`${reportRoot}/T008-delivery.txt`));
    const source = JSON.parse(state.task.readRecord(delivery.source_ref));
    const entries = [...new Map([...source.quality_facts, ...source.quality_advisory_facts]
      .map((binding) => [binding.ref, binding])).values()].flatMap((binding) => {
      const fact = JSON.parse(state.task.readRecord(binding.ref));
      return fact.evidence.filter((entry) => entry.evidence_type === "acceptance_evidence").map((wrapperBinding) => {
        const wrapper = JSON.parse(state.task.readRecord(wrapperBinding.ref));
        const stageBinding = wrapper.refs[0];
        return { binding, fact, wrapperBinding, wrapper, stageBinding,
          stage: JSON.parse(state.task.readRecord(stageBinding.ref)) };
      });
    });
    return { delivery, source, entries };
  }
  function leaf(state) {
    return graph(state).entries.find((entry) => entry.fact.subject !== "stage_end_spec_analyze"
      && entry.wrapper.result === "deferred" && entry.stage.subject_fact?.status === "missing");
  }
  it("writer and independent reader itemize every real missing-to-deferred original without persisted candidate objects", async () => {
    const state = humanFixture();
    await executeNoneFixture(state);
    const { source, entries } = graph(state);
    const facts = JSON.parse(state.task.readRecord(`${reportRoot}/report-facts.json`));
    const missing = entries.filter((entry) => entry.wrapper.result === "deferred"
      && entry.stage.subject_fact?.status === "missing");
    expect(missing.length).toBeGreaterThan(1);
    for (const entry of missing) expect(facts.not_done).toContainEqual(expect.objectContaining({
      item: entry.fact.subject, status: "missing", source: `${entry.stageBinding.ref}#subject_fact.status`,
      reason: expect.stringContaining(entry.stage.subject_fact.detail),
    }));
    expect(source).not.toHaveProperty("evidenceIndex");
    expect(source.quality_facts.every((binding) => Object.keys(binding).sort().join() === "ref,sha256")).toBe(true);
    expect(freshness.authenticateP5StageEndReport(state.task)).toMatchObject({ status: "recorded", authenticated: true });
    expect(facts.exceptions).toHaveLength(1);
    // Source authentication and an approved exception cannot certify the
    // unfinished build-code stage, even with this real low-level audit input.
    expect(source.stage_result.status).not.toBe("completed");
  });
  it.each(["wrapper", "stage-quality"])("independent reader rejects altered %s bytes outside the analyzer advisory", async (layer) => {
    const state = humanFixture();
    await executeNoneFixture(state);
    const entry = leaf(state);
    expect(entry).toBeDefined();
    const ref = layer === "wrapper" ? entry.wrapperBinding.ref : entry.stageBinding.ref;
    writeFileSync(join(state.task.taskPath, ref), `${state.task.readRecord(ref)} `);
    expect(freshness.authenticateP5StageEndReport(state.task)).toMatchObject({ status: "missing", authenticated: false,
      reason: expect.stringMatching(/P5 acceptance.*hash/i) });
  });
  it("writer surfaces a non-advisory acceptance original read failure before any report marker", async () => {
    const state = humanFixture();
    writeStageRow(state.task.taskPath, { stage: "build-code", source: "fixture",
      phase_progress: { phase_id: "P5", task_id: "T008", material_revision: state.kernel.currentVNextMaterialRevision(),
        recorded_at: "2026-09-27T00:00:00.000Z" } });
    const supplied = { ...receipts(state), review: await phaseReview(state) };
    const originalOpen = fs.openSync;
    let injected = false;
    fs.openSync = (path, ...rest) => {
      if (!injected && typeof path === "string" && path.includes("/quality/evidence/acceptance/build-code/")
          && !path.includes("stage_end_spec_analyze-") && new Error().stack.includes("p5AcceptanceCandidates")) {
        injected = true;
        const error = new Error("injected P5 non-advisory original EIO");
        error.code = "EIO";
        throw error;
      }
      return originalOpen(path, ...rest);
    };
    syncBuiltinESMExports();
    try {
      await expect(runOfficialStage("build-code", state.context, { receipts: supplied }, {
        runSpecAnalyze: async () => { throw new Error("fixture analyzer unavailable"); },
      })).rejects.toThrow("injected P5 non-advisory original EIO");
    } finally {
      fs.openSync = originalOpen;
      syncBuiltinESMExports();
    }
    expect(injected).toBe(true);
    expect(existsSync(join(state.task.taskPath, reportRoot, "report-facts.json"))).toBe(false);
  });
  it.each(["wrong-task", "wrong-stage", "stale-material", "wrong-subject", "status-conflict"])(
    "reader rejects a self-hash-consistent %s leaf chain rather than trusting its source certificate", async (defect) => {
      const state = humanFixture();
      await executeNoneFixture(state);
      const { delivery, source } = graph(state);
      const entry = leaf(state);
      expect(entry).toBeDefined();
      const stage = structuredClone(entry.stage);
      if (defect === "wrong-task") stage.task_id = "other-task";
      if (defect === "wrong-stage") stage.stage = "build-plan";
      if (defect === "stale-material") stage.material_revision = `revision-${"0".repeat(64)}`;
      if (defect === "wrong-subject") stage.subject = "unrelated-AC";
      if (defect === "status-conflict") stage.subject_fact.status = "passed";
      const put = (ref, value) => {
        const raw = `${JSON.stringify(value, null, 2)}\n`;
        const sha256 = hash(raw);
        const path = typeof ref === "function" ? ref(sha256) : ref;
        // Adversarial isolated-store tampering deliberately bypasses the
        // writer, including its kernel-owned fact protection. It is not a
        // canonical publication or a real Task evidence authoring path.
        mkdirSync(dirname(join(state.task.taskPath, path)), { recursive: true });
        writeFileSync(join(state.task.taskPath, path), raw);
        return { ref: path, sha256 };
      };
      const stageBinding = put((sha) => `quality/evidence/stage-quality/build-code/${entry.fact.subject}-${sha}.json`, stage);
      const wrapper = structuredClone(entry.wrapper);
      wrapper.refs = [stageBinding];
      wrapper.freshness.evidence_freshness = [{ ...stageBinding, status: "current" }];
      const wrapperBinding = put((sha) => `quality/evidence/acceptance/build-code/${entry.fact.subject}-${sha}.json`, wrapper);
      const fact = { ...entry.fact, evidence: [{ ...wrapperBinding, evidence_type: "acceptance_evidence" }] };
      const digest = qualityFactDigest(fact);
      fact.fact_id = `quality-${digest}`;
      const factBinding = put(`quality/facts/${digest}.json`, fact);
      for (const key of ["quality_facts", "quality_advisory_facts"]) source[key] = source[key].map((binding) =>
        binding.ref === entry.binding.ref ? factBinding : binding);
      for (const key of ["quality_fact_refs", "quality_advisory_fact_refs"]) source.stage_result[key] = source.stage_result[key].map((ref) =>
        ref === entry.binding.ref ? factBinding.ref : ref);
      const sourceBinding = put((sha) => `${reportRoot}/source-${sha}.json`, source);
      const certificate = JSON.parse(state.task.readRecord(delivery.certificate_ref));
      Object.assign(certificate, { source_ref: sourceBinding.ref, source_sha256: sourceBinding.sha256,
        quality_fact_refs: source.quality_facts, quality_advisory_fact_refs: source.quality_advisory_facts });
      const certificateBinding = put((sha) => `${reportRoot}/certificate-${sha}.json`, certificate);
      put(`${reportRoot}/T008-delivery.txt`, { ...delivery, source_ref: sourceBinding.ref, source_sha256: sourceBinding.sha256,
        certificate_ref: certificateBinding.ref, certificate_sha256: certificateBinding.sha256 });
      expect(freshness.authenticateP5StageEndReport(state.task)).toMatchObject({ status: "missing", authenticated: false,
        reason: expect.stringMatching(/P5 acceptance.*(?:identity|status)/i) });
    });
});

describe("P5 private audit discovery refuses ambiguous or absent scope", () => {
  it.each(["absent", "old-scope", "duplicate"])("does not publish from %s audit when caller audit is omitted", async (defect) => {
    const state = humanFixture();
    writeStageRow(state.task.taskPath, { stage: "build-code", source: "fixture",
      phase_progress: { phase_id: "P5", task_id: "T008", material_revision: state.kernel.currentVNextMaterialRevision(),
        recorded_at: "2026-09-27T00:00:00.000Z" } });
    const supplied = { ...receipts(state), review: await phaseReview(state) };
    const auditRef = supplied.audit;
    const audit = JSON.parse(state.task.readRecord(auditRef));
    delete supplied.audit;
    if (defect !== "duplicate") rmSync(join(state.task.taskPath, auditRef));
    if (defect === "old-scope") audit.exception_census.scope.material_revision = `revision-${"0".repeat(64)}`;
    if (defect !== "absent") {
      audit.summary_hash = hash(`isolated ${defect} audit; not a real Task approval`);
      const raw = `${JSON.stringify(audit)}\n`;
      state.task.writeRecordAtomic(`quality/evidence/audits/build-code/${hash(raw)}.json`, raw);
    }
    await runOfficialStage("build-code", state.context, { receipts: supplied }, {
      runSpecAnalyze: async () => { throw new Error("fixture analyzer unavailable"); },
    });
    expect(existsSync(join(state.task.taskPath, reportRoot, "report-facts.json"))).toBe(false);
  });
});

// Publication evidence is one immutable checkpoint, not current Phase quality.
describe("P5 publication identity survives phase advancement", () => {
  const publicEnv = (state) => {
    const cliHome = join(state.root, "cli-home");
    const env = { ...process.env, HOME: cliHome, XDG_CONFIG_HOME: join(cliHome, ".config"), WORKFLOWHUB_TASK_DIR: state.root };
    delete env.WORKFLOWHUB_CUTOVER_EPOCH;
    return env;
  };
  function advance(state, phase) {
    const input = join(state.root, `advance-${phase}.json`);
    writeFileSync(input, JSON.stringify({ phase_progress: { phase_id: phase, task_id: phase === "P6" ? "T012" : "T024" } }));
    return JSON.parse(execFileSync(process.execPath, [new URL("../../tools/cli/stage-runtime.mjs", import.meta.url).pathname,
      "run", "--action=execute", "--stage=build-code", "--project=workflowhub",
      `--task=${state.task.identity.taskId}`, `--input=${input}`], {
      cwd: state.candidateWorkspace.worktreeRoot, env: publicEnv(state), encoding: "utf8",
    }));
  }
  it.each(["none", "declared"])("authenticates the original %s through actual public P6/P13 navigation and subsequent changes", async (kind) => {
    const state = kind === "none" ? noneFixture({ phaseCount: 13 }) : humanFixture({ phaseCount: 13 });
    for (const [phase, taskId] of [["P6", "T012"], ["P13", "T024"]]) {
      // Navigation consumes task headings inside L1; this only declares the
      // valid target, and makes no claim that the later Phase work is done.
      state.artifacts.writeAtomic(`phases/${phase}.md`, state.artifacts.read(`phases/${phase}.md`)
        .replace("### T001", `## L1\n\n### ${taskId}`) + "\n## L2\n");
    }
    state.artifacts.writeAtomic("phases/index.md", "# Phase index\n\n## Execution Index\n\n"
      + "| phase | authority ref | semantic anchor | write set | dependency | consumer |\n| --- | --- | --- | --- | --- | --- |\n"
      + Array.from({ length: 13 }, (_, i) => `| \`P${i + 1}\` | \`phases/P${i + 1}.md\` | FR-001 AC-001 | \`phase-${i + 1}.mjs\` | ${i === 0 ? "none" : `P${i}`} | build-code |`).join("\n") + "\n");
    const navigation = validatePostPhaseContract({ spec: state.artifacts.read("spec.md"), index: state.artifacts.read("phases/index.md"),
      phases: Object.fromEntries(Array.from({ length: 13 }, (_, i) => [`phases/P${i + 1}.md`, state.artifacts.read(`phases/P${i + 1}.md`)])) });
    // Only navigation targets are established here; unfinished Phase quality
    // in the thin isolated fixture is not made into a passing stage result.
    for (const [phase, taskId] of [["P6", "T012"], ["P13", "T024"]]) {
      expect(navigation.facts.phase_rows.find((row) => row.id === phase)?.task_ids).toContain(taskId);
    }
    state.artifacts.writeAtomic("decision-log.md", state.artifacts.read("decision-log.md").replace("## 核心需求", "## 任务身份"));
    state.context.workflowRunId = state.kernel.deriveStageWorkflowRunId("build-code");
    await executeNoneFixture(state, { publicCli: true });
    const original = new Map(["report-facts.json", "report.md", "T008-delivery.txt"].map((name) =>
      [`${reportRoot}/${name}`, state.task.readRecord(`${reportRoot}/${name}`)]));
    const factsAtPublication = state.task.readRecord("facts.jsonl");
    const delivery = JSON.parse(original.get(`${reportRoot}/T008-delivery.txt`));
    const source = JSON.parse(state.task.readRecord(delivery.source_ref));
    const certificate = JSON.parse(state.task.readRecord(delivery.certificate_ref));
    for (const phase of ["P6", "P13"]) {
      expect(advance(state, phase)).toMatchObject({ status: "recorded", phase_progress: { phase_id: phase } });
      expect(freshness.authenticateP5StageEndReport(state.task)).toMatchObject({ status: "recorded", authenticated: true,
        freshness: { status: "stale" }, current_quality: { status: "unknown" },
        facts: JSON.parse(original.get(`${reportRoot}/report-facts.json`)) });
    }
    expect(source.publication_facts).toEqual(certificate.publication_facts);
    expect(source.publication_facts).toEqual({ ref: `${reportRoot}/facts-${hash(factsAtPublication)}.jsonl`, sha256: hash(factsAtPublication) });
    expect(state.task.readRecord(source.publication_facts.ref)).toBe(factsAtPublication);
    if (kind === "none") {
      const audit = JSON.parse(state.task.readRecord(source.human_exception_source.audit_ref));
      expect(audit.sources).toContainEqual({ ...source.publication_facts, kind: "task_original" });
    }
    writeFileSync(join(state.candidateWorkspace.worktreeRoot, "base.mjs"), "export const value = 2;\n");
    state.artifacts.writeAtomic("spec.md", `${state.artifacts.read("spec.md")}\nNew later-stage material, not a retroactive P5 claim.\n`);
    const laterRaw = `${JSON.stringify({ schema_version: "stage-quality-missing.v1", task_id: state.task.identity.taskId,
      stage: "build-code", subject: "later_quality", status: "missing", snapshot_tree: state.kernel.currentVNextSnapshot({ fresh: true }).tree,
      reason: "later isolated fixture quality has not been established" })}\n`;
    const laterRef = `quality/evidence/stage-quality-missing/build-code/later_quality-${hash(laterRaw)}.json`;
    state.task.writeRecordAtomic(laterRef, laterRaw);
    state.kernel.publishVNextQualityFact("build-code", { kind: "test", subject: "later_quality", status: "missing",
      evidence: [{ ref: laterRef, sha256: hash(laterRaw), evidence_type: "test_receipt" }] });
    expect(freshness.authenticateP5StageEndReport(state.task)).toMatchObject({ authenticated: true,
      freshness: { status: "stale" }, current_quality: { status: "unknown" },
      facts: JSON.parse(original.get(`${reportRoot}/report-facts.json`)) });
    for (const [ref, raw] of original) expect(state.task.readRecord(ref)).toBe(raw);
    const frozenRaw = state.task.readRecord(source.publication_facts.ref);
    writeFileSync(join(state.task.taskPath, source.publication_facts.ref), `${frozenRaw} `);
    expect(freshness.authenticateP5StageEndReport(state.task)).toMatchObject({ authenticated: false,
      reason: expect.stringMatching(/publication facts.*hash/i) });
    writeFileSync(join(state.task.taskPath, source.publication_facts.ref), frozenRaw);
    const priorRead = fs.readFileSync;
    let checkedVersion = false;
    fs.readFileSync = (path, ...args) => {
      const name = path instanceof URL ? path.pathname : path;
      if (name === new URL("../../runtime/stage/stage-end-report.mjs", import.meta.url).pathname
          && new Error().stack.includes("p5PublicationMaterials")) {
        checkedVersion = true;
        return Buffer.from("unavailable current converter version; never execute archived code\n");
      }
      return priorRead(path, ...args);
    };
    syncBuiltinESMExports();
    try {
      expect(freshness.authenticateP5StageEndReport(state.task)).toMatchObject({ status: "unavailable", authenticated: false,
        reason: expect.stringMatching(/converter.*version/i) });
      expect(checkedVersion).toBe(true);
    } finally { fs.readFileSync = priorRead; syncBuiltinESMExports(); }
  });
  it("rejects concurrently changed publication facts before the immutable report marker", async () => {
    const state = noneFixture();
    writeStageRow(state.task.taskPath, { stage: "build-code", source: "fixture",
      phase_progress: { phase_id: "P5", task_id: "T008", material_revision: state.kernel.currentVNextMaterialRevision(),
        recorded_at: "2026-09-27T00:00:00.000Z" } });
    const supplied = { ...receipts(state), review: await phaseReview(state) };
    const priorOpen = fs.openSync;
    let changed = false;
    fs.openSync = (path, ...args) => {
      if (!changed && typeof path === "string" && /\/quality\/evidence\/stage-quality\/build-code\/P5\/source-[a-f0-9]+\.json$/.test(path)
          && new Error().stack.includes("publishP5SameRunSource")) {
        changed = true;
        const facts = join(state.task.taskPath, "facts.jsonl");
        writeFileSync(facts, `${readFileSync(facts, "utf8")}\n`);
      }
      return priorOpen(path, ...args);
    };
    syncBuiltinESMExports();
    try {
      await expect(runOfficialStage("build-code", state.context, { receipts: supplied }, {
        runSpecAnalyze: async () => { throw new Error("fixture analyzer unavailable"); },
      })).rejects.toThrow(/publication facts.*changed/i);
    } finally { fs.openSync = priorOpen; syncBuiltinESMExports(); }
    expect(changed).toBe(true);
    expect(existsSync(join(state.task.taskPath, reportRoot, "report-facts.json"))).toBe(false);
  });
});

// Byte-preserved actual canonical source corpus, not a new reviewer verdict or Task publication.
async function originalDerivedStrengthReviewCorpus() {
  const { gunzipSync } = await import("node:zlib");
  const records = JSON.parse(gunzipSync(Buffer.from("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", "base64")).toString("utf8"));
  const expectedHashes = {"quality/reviews/results/make-decision-simple-5f798a09-caee-5912-ae05-a1cf5ea88968.json": "aa3575da571b507ade4b441c39f732f9024f09361523ff9ffa97dabc9c88a1c3", "quality/reviews/attempts/5f798a09-caee-5912-ae05-a1cf5ea88968/attempt.json": "e6cb3e950ec7732b53b6bcb65ed465e3c62671cf9e3d92f182bb81edd156418d", "quality/reviews/attempts/5f798a09-caee-5912-ae05-a1cf5ea88968/providers/p-a2ltaS9jb2Rpbmc-0.output.json": "dd0c96a583e43eccd851dfee2a6429e6b6ec9fa6b9299816650cb4ef7049323d", "quality/reviews/attempts/5f798a09-caee-5912-ae05-a1cf5ea88968/providers/p-YW50aWdyYXZpdHkvZmxhc2g-1.output.json": "14d34d9ee7f7d377d5b28c13c95f67ffc513b647c80825faeebdb301034b1c36", "quality/reviews/attempts/5f798a09-caee-5912-ae05-a1cf5ea88968/providers/p-Y29kZXgvbHVuYQ-2.output.json": "1868dc01af101051dbc883d114cc909e34a1578370f69a3d32be21c1fd78e240"};
  for (const [ref, raw] of Object.entries(records)) expect(hash(raw)).toBe(expectedHashes[ref]);
  const resultRef = "quality/reviews/results/make-decision-simple-5f798a09-caee-5912-ae05-a1cf5ea88968.json";
  return { records, expectedHashes, result: JSON.parse(records[resultRef]),
    read: (ref) => { if (!(ref in records)) throw new Error(`unavailable original: ${ref}`); return records[ref]; } };
}

describe("P5 review provenance compatibility", () => {
  it("authenticates the byte-preserved actual old review with only missing derived source_strength", async () => {
    const corpus = await originalDerivedStrengthReviewCorpus();
    const before = JSON.stringify(corpus.records);
    expect(corpus.result.findings.every((finding) => !Object.hasOwn(finding, "source_strength"))).toBe(true);
    const authenticated = freshness.authenticateStageReviewResult(corpus.result, {
      taskId: corpus.result.task_id, read: corpus.read });
    expect(authenticated.expectedFindings).toHaveLength(corpus.result.findings.length);
    expect(authenticated.expectedFindings.every((finding) => ["single_source", "corroborated"].includes(finding.source_strength))).toBe(true);
    expect(JSON.stringify(corpus.records)).toBe(before);
    expect(corpus.result.findings.every((finding) => !Object.hasOwn(finding, "source_strength"))).toBe(true);
  });
  it.each(["present-wrong-strength", "other-semantic-change", "wrong-provider", "wrong-content-hash"])(
    "still rejects %s against the actual immutable provider corpus", async (defect) => {
      const corpus = await originalDerivedStrengthReviewCorpus();
      const result = structuredClone(corpus.result);
      const records = { ...corpus.records };
      if (defect === "present-wrong-strength") {
        result.findings[0].source_strength = "corroborated";
        result.adjudication.clusters[0].source_strength = "corroborated";
      } else if (defect === "other-semantic-change") result.findings[0].issue += " unauthorized alteration";
      else {
        const attempt = JSON.parse(corpus.records[result.attempt_ref]);
        const provider = attempt.provider_attempts.find((entry) => entry.status === "completed");
        const output = JSON.parse(records[provider.output_ref]);
        if (defect === "wrong-provider") output.provider = "codex/unauthorized";
        else output.content_hash = "0".repeat(64);
        records[provider.output_ref] = JSON.stringify(output);
      }
      expect(() => freshness.authenticateStageReviewResult(result, { taskId: result.task_id,
        read: (ref) => records[ref] })).toThrow();
      for (const [ref, raw] of Object.entries(corpus.records)) expect(hash(raw)).toBe(corpus.expectedHashes[ref]);
    });
  it.each(["code", "material", "ignored-material"])("publishes current receipt facts with the original P5 review tuple and discloses stale review quality (%s)", async (delta) => {
    const state = noneFixture({ phaseCount: delta === "ignored-material" ? 13 : 5 });
    writeStageRow(state.task.taskPath, { stage: "build-code", source: "fixture",
      phase_progress: { phase_id: "P5", task_id: "T008", material_revision: state.kernel.currentVNextMaterialRevision(),
        recorded_at: "2026-09-27T00:00:00.000Z" } });
    if (delta === "ignored-material") {
      writeFileSync(join(state.candidateWorkspace.worktreeRoot, ".gitignore"), "node_modules\n.vite/\nspecs/\n");
    }
    const review = await phaseReview(state);
    const originalReviewRaw = state.task.readRecord(review);
    const originalReview = JSON.parse(originalReviewRaw);
    writeFileSync(join(state.candidateWorkspace.worktreeRoot, "unrelated-change.mjs"), "export const changedAfterReview = true;\n");
    if (delta === "material") {
      state.artifacts.writeAtomic("spec.md", state.artifacts.read("spec.md") + "\nA later phase source clarification; no accepted exception.\n");
      writeStageRow(state.task.taskPath, { stage: "build-code", source: "fixture",
        phase_progress: { phase_id: "P5", task_id: "T008", material_revision: state.kernel.currentVNextMaterialRevision(),
          recorded_at: "2026-09-27T00:00:01.000Z" } });
      expect(state.kernel.currentVNextMaterialRevision()).not.toBe(originalReview.material_revision);
    }
    const supplied = delta === "ignored-material" ? {
      implementation: writeOfficialComponentReceipt({ task: state.task, workspace: state.workspace,
        stage: "build-code", component: "implementation", payload: {} }).ref,
      tests: createCanonicalReceiptWriter({ task: state.task, workspace: state.workspace,
        stage: "build-code", component: "build-code-test-capture" }).captureTests({
        command: "npx vitest run runtime/stage/stage-end-report.test.mjs",
        receiptRef: "quality/tests/p5-real-npx-command.json", outputRef: "quality/tests/output/p5-real-npx-command.output",
      }).receipt_ref,
      audit: fixtureAudit(state), review,
    } : { ...receipts(state), review };
    const current = state.kernel.currentVNextSnapshot({ fresh: true });
    expect(current.tree).not.toBe(originalReview.snapshot_tree);
    const result = await runOfficialStage("build-code", state.context, { receipts: supplied }, {
      runSpecAnalyze: async () => { throw new Error("fixture analyzer unavailable"); } });
    const phaseFacts = result.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref)))
      .filter((fact) => fact.subject === "phase_review");
    expect(phaseFacts).toHaveLength(1);
    expect(phaseFacts[0].status).toBe("recorded"); // Preserve the actual generic fact; P5 reports its stale scope.
    expect(existsSync(join(state.task.taskPath, reportRoot, "report-facts.json")),
      "current quality missing must be disclosed, not suppress the intermediate report").toBe(true);
    const authenticated = freshness.authenticateP5StageEndReport(state.task);
    expect(authenticated).toMatchObject({ status: "recorded", authenticated: true, current_quality: { status: "unknown" } });
    const source = JSON.parse(state.task.readRecord(authenticated.source_ref));
    expect(source.snapshot_tree).toBe(current.tree);
    expect(source.receipts.review).toEqual({ ref: review, sha256: hash(originalReviewRaw) });
    expect(state.task.readRecord(review)).toBe(originalReviewRaw);
    expect(JSON.stringify(authenticated.facts.not_done)).toContain("phase_review:stale-review-snapshot");
    if (delta === "ignored-material") {
      expect(() => git(state.candidateWorkspace.worktreeRoot, ["show",
        `${source.snapshot_tree}:${state.artifacts.reference("spec.md")}`])).toThrow();
      expect(source.publication_materials).toHaveLength(state.phaseCount + 3);
      for (const binding of source.publication_materials) expect(hash(state.task.readRecord(binding.ref))).toBe(binding.sha256);
      state.artifacts.writeAtomic("spec.md", state.artifacts.read("spec.md") + "\nLater Phase material change.\n");
      expect(freshness.authenticateP5StageEndReport(state.task)).toMatchObject({ authenticated: true,
        freshness: { status: "stale" }, current_quality: { status: "unknown" } });
      const first = source.publication_materials[0];
      writeFileSync(join(state.task.taskPath, first.ref), state.task.readRecord(first.ref) + "tampered material");
      expect(freshness.authenticateP5StageEndReport(state.task)).toMatchObject({ authenticated: false });
    }
  }, 90_000);
});


describe("P5 publication failure diagnosis", () => {
  it("discloses the actual wrong-call approval failure exactly once without publishing or claiming passed quality", async () => {
    const state = noneFixture({ defect: "wrong-call" });
    const result = await executeNoneFixture(state);
    expect(existsSync(join(state.task.taskPath, reportRoot, "report-facts.json"))).toBe(false);
    const warnings = result.quality_warnings.filter((warning) => warning.startsWith("P5 publication unavailable:"));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/permission|reply|question|call/i);
    expect(result.quality_status).not.toBe("passed");
  }, 90_000);
});
