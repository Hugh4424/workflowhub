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
import * as freshness from "../../runtime/evidence/freshness.mjs";
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

function fixture({ p5 = true, humanException = true,
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
  const count = p5 ? 5 : 1;
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
  writeFileSync(join(candidateWorkspace.worktreeRoot, "vitest.config.mjs"), readFileSync(new URL("../../vitest.config.mjs", import.meta.url)));
  symlinkSync(installedNodeModules(), join(candidateWorkspace.worktreeRoot, "node_modules"), "dir");
  const kernel = createTaskKernel(task, { candidateWorkspace, artifacts });
  const context = { stage: "build-code", task, kernel, identity: task.identity, manifest: task.manifest,
    workflowRunId: kernel.deriveStageWorkflowRunId("build-code"), candidateWorkspace, workspace, artifacts };
  return { root, task, candidateWorkspace, workspace, artifacts, kernel, context };
}

async function phaseReview(state, phaseId = "P5") {
  const { task, kernel } = state;
  const recorded = await recordSimpleReviewRequest({
    task, kernel,
    request: { stage: "build-code", review_scope: "phase", subject_kind: "phase", phase_id: phaseId,
      host_provider: "codex/luna", materials: { implementation: `fixture review of ${phaseId}` } },
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
  return { implementation: implementation.ref, tests: tests.receipt_ref };
}

describe("P5 same-run report source", () => {
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

  it.skip("HISTORICAL: P5 expiry requires an independently confirmed human exception source", async () => {
    const state = fixture({ exceptionExpiresAt: "P5" });
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

  it.skip("HISTORICAL: report source conflict requires an independently confirmed human exception source", async () => {
    const state = fixture();
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

  it.skip("HISTORICAL: report preservation requires an independently confirmed human exception source", async () => {
    const state = fixture();
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

  it.skip.each(["report.md", "T008-delivery.txt"])("HISTORICAL: report write fault requires an independently confirmed human exception source at %s", async (failedName) => {
    const state = fixture();
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

  it.skip("HISTORICAL: report retry requires an independently confirmed human exception source", async () => {
    const state = fixture();
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
    expect(existsSync(join(state.task.taskPath, reportRoot))).toBe(false);
    expect(freshness.authenticateP5StageEndReport(state.task)).toMatchObject({ status: "missing", authenticated: false });
    if (process.env.WORKFLOWHUB_P5_RETAINED_STATE_PATH) retainedTaskPath = state.task.taskPath;
  });
});
