// CARD-03 P3/T006 预写测试：质量事实与证据校验只绑本 Phase 声明写集，
// business-case-catalog 用稳定锚点，不再做跨 Phase 全量快照绑定。
// 本文件不新增哈希门、回执或材料身份门（card-04 B-06），只断言收缩后的行为。
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as validators from "../../runtime/evidence/canonical-evidence-validators.mjs";
import { validateAcceptanceEvidence } from "../../runtime/evidence/acceptance-evidence-validator.mjs";
import { listCurrentResearchReports } from "../../runtime/evidence/research-report.mjs";
import * as reconciliation from "../../workflows/build-code/case-reconciliation.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace, openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { initializeTaskStore } from "../../runtime/task/task-store.mjs";
import { writeCurrentImplementationReceipt } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { recordSimpleReviewRequest } from "../../runtime/review/review-record-route.mjs";
import { authenticateQualityFactRecord } from "../../runtime/evidence/freshness.mjs";
import { prepareTaskBoundBuildCodeReviewBundle, stageRuntimeCliMain } from "../../tools/cli/stage-runtime.mjs";
import { handoffDeclaration } from "../../runtime/stage/stage-runner.mjs";

// Reader-only fault injection is inactive outside these explicitly constructed
// native fixtures; canonical originals on disk are never rewritten.
const nativeProjectionFault = vi.hoisted(() => ({ mode: null, hits: 0, handlerTransform: null }));
vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, readFileSync(...args) {
    const raw = actual.readFileSync(...args);
    if (!nativeProjectionFault.mode || typeof raw !== "string") return raw;
    let value;
    try { value = JSON.parse(raw); } catch { return raw; }
    if (value.task_id !== "card03-public-phase" || value.schema_version !== "stage-quality-evidence.v1"
        || value.subject !== "AC-001" || !value.subject_fact?.execution) return raw;
    nativeProjectionFault.hits += 1;
    const mode = nativeProjectionFault.mode;
    if (mode === "missing") throw Object.assign(new Error("constructed missing native leaf"), { code: "ENOENT" });
    if (mode === "hash") return raw + " ";
    if (mode === "AC") value.subject = "AC-999";
    if (mode === "task") value.task_id = "wrong-task";
    if (mode === "snapshot") value.snapshot_tree = "f".repeat(40);
    if (mode === "material") value.material_revision = `revision-${"f".repeat(64)}`;
    if (mode === "scenario") value.subject_fact.execution.scenario = "foreign scenario";
    if (mode === "attempt") value.subject_fact.execution_binding.attempt_id = "foreign-attempt";
    if (mode === "run") value.subject_fact.execution_binding.run_id = "foreign-run";
    if (mode === "assertions") value.subject_fact.assertions = [];
    return JSON.stringify(value);
  } };
});

// Test-only wrapper: invoke the real public handler first. No injected
// production service or new runner seam; inactive for all original cases.
vi.mock("../../runtime/stage/stage-handlers.mjs", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, officialStageHandler(stage) {
    const real = actual.officialStageHandler(stage);
    return async (...args) => {
      const result = await real(...args);
      return stage === "build-code" && nativeProjectionFault.handlerTransform
        ? nativeProjectionFault.handlerTransform(result) : result;
    };
  } };
});

const root = fileURLToPath(new URL("../../", import.meta.url));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const temps = [];
afterEach(() => { nativeProjectionFault.mode = null; nativeProjectionFault.hits = 0; nativeProjectionFault.handlerTransform = null; while (temps.length) rmSync(temps.pop(), { recursive: true, force: true }); });

// 三棵树：A 基线；B 只改本 Phase 写集外的文件；C 改了写集内的文件。
function trees() {
  const repo = mkdtempSync(join(tmpdir(), "card03-p3-"));
  temps.push(repo);
  const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git("init", "-q");
  const put = (path, text) => {
    mkdirSync(dirname(join(repo, path)), { recursive: true });
    writeFileSync(join(repo, path), text);
    git("add", path);
  };
  put("src/owned.mjs", "export const owned = 1;\n");
  put("other/unrelated.mjs", "export const unrelated = 1;\n");
  const A = git("write-tree");
  put("other/unrelated.mjs", "export const unrelated = 2;\n");
  const B = git("write-tree");
  put("src/owned.mjs", "export const owned = 2;\n");
  const C = git("write-tree");
  return { repo, A, B, C, writeSet: ["src/owned.mjs"] };
}

function testReceipt(tree) {
  const command = "npx vitest run tests/owned.test.mjs";
  return {
    schema_version: "workflowhub-receipt.v1", task_id: "card03-p3", stage: "build-code",
    producer: { stage: "build-code", component: "build-code-test-capture" },
    snapshot_tree: tree, command, command_hash: sha256(command), exit_code: 0,
    output_hash: "e".repeat(64), output_ref: "quality/tests/output/owned.txt",
  };
}

function implementationReceipt(tree) {
  const diffHash = "d".repeat(64);
  return {
    schema_version: "workflowhub-receipt.v1", task_id: "card03-p3", stage: "build-code",
    producer: { stage: "build-code", component: "implementation", version: "1" },
    changed: ["src/owned.mjs"], snapshot_head: "1".repeat(40), snapshot_tree: tree, snapshot_commit: "1".repeat(40),
    diff_ref: `quality/evidence/implementation/${diffHash}.diff`, diff_hash: diffHash,
  };
}

describe("CARD-03 P3 runtime binding: phase write set instead of whole-tree snapshot", () => {
  it("ORACLE-RT-001 phaseWriteSetChanges reports only declared write-set paths", () => {
    const { repo, A, B, C, writeSet } = trees();
    expect(typeof validators.phaseWriteSetChanges).toBe("function");
    expect(validators.phaseWriteSetChanges({ root: repo, fromTree: A, toTree: B, writeSet })).toEqual([]);
    expect(validators.phaseWriteSetChanges({ root: repo, fromTree: A, toTree: C, writeSet })).toEqual(["src/owned.mjs"]);
  });

  it("ORACLE-RT-001 a test receipt survives an unrelated-file change but not a write-set change", () => {
    const { repo, A, B, C, writeSet } = trees();
    const options = (tree) => ({ taskId: "card03-p3", stage: "build-code",
      currentSnapshot: { root: repo, tree, writeSet } });
    expect(() => validators.validateCanonicalTestReceipt(testReceipt(A), options(B))).not.toThrow();
    expect(() => validators.validateCanonicalTestReceipt(testReceipt(A), options(C)))
      .toThrow(/write set changed.*src\/owned\.mjs/);
  });

  it("ORACLE-RT-001 an implementation receipt survives an unrelated-file change but not a write-set change", () => {
    const { repo, A, B, C, writeSet } = trees();
    const options = (tree) => ({ taskId: "card03-p3", currentSnapshot: { root: repo, tree, writeSet } });
    expect(() => validators.validateCanonicalImplementationReceipt(implementationReceipt(A), options(B))).not.toThrow();
    expect(() => validators.validateCanonicalImplementationReceipt(implementationReceipt(A), options(C)))
      .toThrow(/write set changed.*src\/owned\.mjs/);
  });

  it("ORACLE-RT-001 a research report stays current when only the code tree moved", () => {
    const identity = { task_id: "research-task", stage: "make-decision", snapshot_tree: "a".repeat(40),
      material_scope_revision: `revision-${"b".repeat(64)}` };
    const report = {
      schema_version: "research-report.v1", ...identity, status: "skipped",
      question: "Which route is safe?", decision_axis: "fallback route",
      tool_usage: [{ tool: "anysearch", attempts: [{ route: "anysearch", attempt: 1, status: "ok", elapsed_ms: 12, http_status: 200, error_code: null, message: null }] }],
      open_items: [{ question_id: "Q-1", code: "open", reason: "needs user choice", next_action: "ask user" }],
      review: { status: "pending", evidence_ref: null },
      fallback: { approval_status: "not_requested", requested_route: null, used_routes: [] },
      reason: "existing facts settle the axis", non_impact_basis: "no direction-changing question remains",
      evidence_refs: ["decision-log.md#facts"],
    };
    const raw = `${JSON.stringify(report)}\n`;
    const ref = `quality/evidence/research/${sha256(raw)}.json`;
    const records = listCurrentResearchReports({
      task: { listCanonicalResearchReportRefs: () => [ref], readRecord: () => raw },
      taskId: identity.task_id, stage: identity.stage,
      materialScopeRevision: identity.material_scope_revision, snapshotTree: "d".repeat(40),
    });
    expect(records).toHaveLength(1);
  });

  it("ORACLE-RT-001 business-case-catalog binds stable anchors, not whole-file sha256", () => {
    const catalog = JSON.parse(readFileSync(join(root, "docs/quality/business-case-catalog.json"), "utf8"));
    for (const entry of catalog.cases) {
      for (const revision of [entry.source?.revision, entry.rule?.revision, entry.effect_observation?.rule_revision]) {
        expect(revision, entry.id).toMatch(/^anchor:#{2,3} \S/);
      }
    }
    for (const consumer of ["workflows/build-code/case-reconciliation.mjs", "workflows/build-code/targeted-capture.mjs"]) {
      const text = readFileSync(join(root, consumer), "utf8");
      expect(text, consumer).not.toMatch(/revision !== `sha256:\$\{/);
      expect(text, consumer).not.toMatch(/SHA_REVISION/);
    }
  });

  it("ORACLE-RT-001 a one-word edit outside the anchored section keeps the case bound; losing the anchor does not", () => {
    expect(typeof reconciliation.businessCaseAnchorErrors).toBe("function");
    const texts = {
      "spec/source.md": "## 需求变更记录\n原文 A\n## 其他章节\n旧词\n",
      "spec/rule.md": "### T009\n规则\n### T010\n别的卡\n",
    };
    const entry = {
      id: "FIXTURE", source: { path: "spec/source.md", revision: "anchor:## 需求变更记录" },
      rule: { path: "spec/rule.md", revision: "anchor:### T009" },
      effect_observation: { rule_revision: "anchor:### T009" },
    };
    const read = (edits = {}) => (path) => ({ ...texts, ...edits })[path];
    expect(reconciliation.businessCaseAnchorErrors(entry, read())).toEqual([]);
    expect(reconciliation.businessCaseAnchorErrors(entry, read({
      "spec/source.md": "## 需求变更记录\n原文 A\n## 其他章节\n新词\n",
      "spec/rule.md": "### T009\n规则\n### T010\n别的卡改了一个词\n",
    }))).toEqual([]);
    expect(reconciliation.businessCaseAnchorErrors(entry, read({ "spec/rule.md": "### T010\n别的卡\n" })))
      .toContain("stale rule.revision");
    expect(reconciliation.businessCaseAnchorErrors(entry, read({ "spec/source.md": "## 其他章节\n" })))
      .toContain("stale source.revision");
  });

  it("ORACLE-RT-001 handoffDeclaration takes the current stage for P5/T012", () => {
    const decisionOnly = { "decision-log.md": "# d\n", "spec.md": "# s\n" };
    let declaration;
    expect(() => { declaration = handoffDeclaration(decisionOnly, "post", { stage: "make-decision" }); }).not.toThrow();
    expect(declaration.value).toBeNull();
    expect(() => handoffDeclaration(decisionOnly, "post", { stage: "build-code" })).toThrow(/post Phase index is missing/);
  });
});

// Owner-authorized test-change request: P3-plan-gaps.md / P3 material amendment.
// Exercise the public capture and run consumers with their real canonical bytes.
async function withPublicPhaseFixture(operation, { renameBoundary = false, nativeProjection = null } = {}) {
  const fixtureRoot = realpathSync(mkdtempSync(join(tmpdir(), "card03-public-phase-")));
  temps.push(fixtureRoot);
  const repo = join(fixtureRoot, "repo"), home = join(fixtureRoot, "home");
  mkdirSync(repo); mkdirSync(home); mkdirSync(join(repo, "src")); mkdirSync(join(repo, "other"));
  const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git("init", "-q", "-b", "main"); git("config", "user.name", "Phase binding test"); git("config", "user.email", "phase@example.test");
  writeFileSync(join(repo, "src/owned.mjs"), "export const owned = 0;\n");
  writeFileSync(join(repo, "other/unrelated.mjs"), "export const other = 0;\n");
  if (renameBoundary) {
    git("config", "diff.renames", "true");
    writeFileSync(join(repo, "src/rename-old.mjs"), Array.from({ length: 80 }, (_, i) => `export const rename_line_${i} = ${i};`).join("\n") + "\n");
    writeFileSync(join(repo, "src/delete-old.mjs"), "export const deleted = true;\n");
  }
  git("add", "."); git("commit", "-qm", "phase fixture baseline");
  const task = createTask({ storageRoot: fixtureRoot, manifest: {
    schema_version: "1.0.0", project_name: "workflowhub", task_id: "card03-public-phase",
    created_at: "2026-09-30T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {},
    record_model: "vnext-single-write", activation_cohort: "post",
  } });
  initializeTaskStore(task.taskPath, { taskId: task.identity.taskId });
  const candidateWorkspace = prepareTaskWorkspace(task), workspace = openCurrentTaskWorkspace(task);
  const worktree = workspace.worktreeRoot, artifacts = ArtifactDir.open(worktree, task);
  const command = "node --test src/owned.test.mjs";
  artifacts.writeAtomic("decision-log.md", "# Decision\n\n## 任务身份\n\n- **任务类型**：普通任务\n");
  artifacts.writeAtomic("spec.md", "# Spec\n\n- **FR-001**: Keep phase evidence current.\n- [ ] **AC-001**: Own write set remains unchanged.\n");
  const ownedWriteSet = "`src/owned.mjs`; `src/owned.test.mjs`" + (renameBoundary
    ? "; `src/rename-old.mjs`; `src/rename-new.mjs`; `src/delete-old.mjs`; `src/add-new.mjs`" : "");
  artifacts.writeAtomic("phases/index.md", `# Phase index\n\n## Execution Index\n\n| phase | authority ref | semantic anchor | write set | dependency | consumer |\n| --- | --- | --- | --- | --- | --- |\n| \`P1\` | \`phases/P1.md\` | \`phase-p1\` | ${ownedWriteSet} | \`none\` | build-code |\n| \`P2\` | \`phases/P2.md\` | \`phase-p2\` | \`other/unrelated.mjs\` | \`none\` | build-code |\n`);
  for (const [id, writeSet, gate] of [["P1", ownedWriteSet, command], ["P2", "`other/unrelated.mjs`", "node --test other/unrelated.test.mjs"]]) {
    artifacts.writeAtomic(`phases/${id}.md`, `# Phase ${id}\n\n- **Write set**: ${writeSet}\n- **gate_cmd**: \`${gate}\`\n\n## L0 — Outcome\n\n- **Outcome**: Keep actual phase evidence.\n\n## L1 — Contract\n\n- **FR / AC**: FR-001 / AC-001\n\n### T${id === "P1" ? "001" : "002"} — Work\n\n## L2 — Reference\n`);
  }
  if (nativeProjection) {
    artifacts.writeAtomic("spec.md", "# Spec\n\n- **FR-001**: Observe native acceptance facts.\n- [ ] **AC-001**: Keep this AC outcome truthful.\n");
    const scenarios = Array.from({ length: nativeProjection.scenarios ?? 1 }, (_, i) => ({
      source: "explicit unit native source", sample: `unit sample ${i}`, scenario: `constructed native scenario ${i}`,
      tier: "service", execution: { module_ref: "src/native-service.mjs", export_name: "produce", timeout_ms: nativeProjection.partialTimeout && i === 1 ? 100 : nativeProjection.timeout_ms ?? 5000,
        input: { outcome: nativeProjection.outcome ?? "achieved", scenario: i,
          ...(nativeProjection.gateVariant ? { gateVariant: nativeProjection.gateVariant, taskDir: task.taskPath } : {}),
          mode: nativeProjection.partialTimeout && i === 1 ? "timeout" : nativeProjection.mode ?? null } },
    }));
    artifacts.writeAtomic("phases/P1.md", artifacts.read("phases/P1.md").replace("### T001 — Work\n",
      `### T001 — Work\n\n- **Source / FR / AC**: FR-001 / AC-001\n- **acceptance_role**: acceptance\n- **e2e_scope**: not_required\n- **acceptance_data**: ${JSON.stringify(scenarios)}\n`));
    if (nativeProjection.gateVariant) {
      const variant = nativeProjection.gateVariant;
      const fieldLines = nativeProjection.chineseGateCard ? [] : [
        ...(variant === "missing-expected" ? [] : [`- **expected_exit**: ${nativeProjection.expectedExitText ?? "0"}`]),
        ...(variant === "missing-oracle" ? [] : ["- **oracle**: ORACLE-UNIT-001"]),
      ];
      artifacts.writeAtomic("phases/P1.md", artifacts.read("phases/P1.md")
        .replace("### T001 — Work\n", `### T001 — Work\n\n${fieldLines.join("\n")}\n`));
      if (nativeProjection.chineseGateCard) {
        // Separate implementation Task mirrors current Chinese P1/P2/P4 cards.
        // Native acceptance Task T001 keeps its existing English source field.
        artifacts.writeAtomic("phases/P1.md", artifacts.read("phases/P1.md").replace("## L2 — Reference",
          `### T003 — Constructed implementation gate\n\n- **来源 / FR / AC**: FR-001 / AC-001\n- **预期退出码**: ${nativeProjection.expectedExitText ?? "RED nonzero；GREEN 0"}\n- **GREEN 判定器**: ORACLE-UNIT-001\n\n## L2 — Reference`));
      }
      writeFileSync(join(worktree, "src/native-gate.test.mjs"), "import {test} from 'node:test'; import {strict as assert} from 'node:assert'; test('own gate',()=>assert.equal(1,1));\n");
      writeFileSync(join(worktree, "src/sibling-gate.test.mjs"), "import {test} from 'node:test'; import {strict as assert} from 'node:assert'; test('sibling fails',()=>assert.equal(1,2));\n");
    }
    writeFileSync(join(worktree, "src/native-service.mjs"), `// Constructed test fixture: this is not Task product acceptance.
export async function produce(input) {
  if (input.mode === "timeout") await new Promise((resolve) => setTimeout(resolve, 1000));
  if (input.mode === "no-assertions") return { entries: [{ acceptance_criterion_id: "AC-001", outcome: "achieved", assertions: [] }] };
  const failed = input.outcome === "failed";
  return { entries: [{ acceptance_criterion_id: "AC-001", outcome: failed ? "incomplete" : input.outcome,
    ...(input.outcome === "achieved" ? {} : { owner: "unit fixture", reason: "constructed non-achieved outcome" }),
    assertions: [{ id: "ORACLE-UNIT-001", expected: true, actual: !failed },
      { id: "unit:own-scenario", expected: input.scenario, actual: input.scenario }] }] };
}
`);
    if (nativeProjection.gateVariant) writeFileSync(join(worktree, "src/native-service.mjs"), String.raw`// Constructed isolated test service; no real Task proof.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
export async function produce(input) {
  const command = process.execPath;
  const args = ["--test", "--test-reporter=tap", "src/native-gate.test.mjs",
    ...(input.gateVariant === "exact-scope" ? [] : ["src/sibling-gate.test.mjs"])];
  const child = spawnSync(command, args, { cwd: process.cwd(), timeout: 5000 });
  const persist = (stream, bytes) => {
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const ref = "quality/evidence/stage-quality/build-code/acceptance-" + stream + "-" + sha256 + ".bin";
    const target = join(input.taskDir, ref);
    mkdirSync(dirname(target), { recursive: true });
    try { writeFileSync(target, bytes, { flag: "wx" }); } catch (error) { if (error.code !== "EEXIST" || !readFileSync(target).equals(bytes)) throw error; }
    return { ref, sha256, original_sha256: sha256, bytes: bytes.length };
  };
  const stdout = persist("stdout", child.stdout), stderr = persist("stderr", child.stderr);
  const commandRecord = { command, args: [...args], files: args.slice(2),
    exit_code: child.status, signal: child.signal, timed_out: child.error?.code === "ETIMEDOUT",
    error: child.error ? { code: child.error.code, message: child.error.message } : null,
    raw_evidence: { stdout, stderr } };
  if (input.gateVariant === "placeholder-argv") commandRecord.args[2] = "<tmp>";
  if (input.gateVariant === "wrong-raw-hash") commandRecord.raw_evidence.stdout = { ...stdout, sha256: "f".repeat(64) };
  const ownPassed = /ok \d+ - own gate/.test(child.stdout.toString("utf8"));
  const assertions = [
    { id: "ORACLE-UNIT-001:own-gate", expected: true, actual: ownPassed },
    { id: "AC-001:scope:src/native-gate.test.mjs", expected: { status: "passed" }, actual: { status: ownPassed ? "passed" : "failed" } },
  ];
  if (input.gateVariant === "multi-scope") assertions.push({ id: "AC-001:scope:src/sibling-gate.test.mjs",
    expected: { status: "failed" }, actual: { status: "failed" } });
  return { commands: [commandRecord], entries: [{ acceptance_criterion_id: "AC-001", outcome: "achieved", assertions }] };
}
`);
  }

  writeFileSync(join(worktree, "src/owned.mjs"), "export const owned = 1;\n");
  writeFileSync(join(worktree, "src/owned.test.mjs"), "import {test} from 'node:test'; import {strict as assert} from 'node:assert'; import {owned} from './owned.mjs'; test('owned phase effect', () => assert.equal(owned, 1));\n");
  if (renameBoundary) {
    execFileSync("git", ["mv", "src/rename-old.mjs", "src/rename-new.mjs"], { cwd: worktree, stdio: "pipe" });
    rmSync(join(worktree, "src/delete-old.mjs"));
    writeFileSync(join(worktree, "src/add-new.mjs"), "export const added = true;\n");
  }
  const previous = { HOME: process.env.HOME, WORKFLOWHUB_TASK_DIR: process.env.WORKFLOWHUB_TASK_DIR };
  process.env.HOME = home; process.env.WORKFLOWHUB_TASK_DIR = fixtureRoot;
  try {
    const kernel = createTaskKernel(task, { candidateWorkspace, artifacts });
    const base = ["--stage=build-code", "--project=workflowhub", `--task=${task.identity.taskId}`];
    const captureInput = join(fixtureRoot, "capture.json");
    writeFileSync(captureInput, JSON.stringify({ command, receipt_ref: "quality/tests/public-phase.json", output_ref: "quality/tests/output/public-phase.output" }));
    const capture = await stageRuntimeCliMain(["verify", "--action=execute", ...base, `--input=${captureInput}`], { cwd: worktree });
    expect(capture.exit_code).toBe(0);
    const originalReceipt = task.readRecord(capture.receipt_ref);
    expect(JSON.parse(originalReceipt)).not.toHaveProperty("phase_evidence");
    // A real unavailable recorder attempt identifies Phase; no fake provider pass.
    const review = await recordSimpleReviewRequest({ task, kernel,
      request: { stage: "build-code", subject_kind: "phase", review_scope: "phase", phase_id: "P1",
        materials: { approved_spec: artifacts.read("spec.md"), acceptance_criteria: "AC-001: owned phase effect", test_evidence: originalReceipt } },
      resolveRouteIdentity: () => { throw Object.assign(new Error("isolated fixture route unavailable"), { code: "ROUTE_UNAVAILABLE" }); },
      runRound: async () => { throw new Error("fixture must never dispatch providers"); },
    });
    const run = async (reviewRef = review.attempt_ref, services = {}) => {
      const implementation = writeCurrentImplementationReceipt({ task, workspace });
      const input = join(fixtureRoot, "run.json");
      writeFileSync(input, JSON.stringify({ ...(nativeProjection ? { attempt_id: `unit-native-${sha256(`${Date.now()}-${Math.random()}`)}` } : {}), receipts: { implementation: implementation.ref, tests: capture.receipt_ref, ...(reviewRef ? { review: reviewRef } : {}) } }));
      return stageRuntimeCliMain(["run", "--action=execute", ...base, `--input=${input}`], { cwd: worktree, services });
    };
    await operation({ task, workspace, worktree, run, capture, originalReceipt, fixtureRoot, command, base, artifacts, kernel, review });
  } finally {
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
}

describe("CARD-03 public Phase evidence consumer", () => {
  it("ORACLE-RT-001 public run accepts current implementation with historical Phase tests after another Phase changes", async () => {
    await withPublicPhaseFixture(async ({ task, workspace, worktree, run, capture, originalReceipt, review }) => {
      const originalReview = task.readRecord(review.attempt_ref);
      writeFileSync(join(worktree, "other/unrelated.mjs"), "export const other = 2;\n");
      const result = await run();
      expect(result.quality_fact_refs.length).toBeGreaterThan(0);
      expect(task.readRecord(capture.receipt_ref)).toBe(originalReceipt);
      const facts = result.quality_fact_refs.map((ref) => ({ ref, raw: task.readRecord(ref) }));
      const testFact = facts.find(({ raw }) => JSON.parse(raw).kind === "test");
      expect(testFact).toBeDefined();
      const testValue = JSON.parse(testFact.raw);
      expect(testValue.evidence.some((entry) => entry.ref === capture.receipt_ref && entry.sha256 === capture.receipt_hash)).toBe(true);
      expect(testValue.snapshot_tree).not.toBe(JSON.parse(originalReceipt).snapshot_tree);
      const authentication = authenticateQualityFactRecord({ ...JSON.parse(testFact.raw), ref: testFact.ref, sha256: sha256(testFact.raw) },
        { read: (ref) => task.readRecord(ref), workspaceRoot: workspace.worktreeRoot });
      expect(authentication.authenticated).toBe(true);
      const reviewFact = facts.map(({ raw }) => JSON.parse(raw)).find((fact) => fact.subject === "phase_review");
      expect(reviewFact.status).toBe("unavailable");
      expect(task.readRecord(review.attempt_ref)).toBe(originalReview);
      expect(JSON.parse(originalReview).snapshot_tree).not.toBe(reviewFact.snapshot_tree);
      const dispositionFact = facts.map(({ raw }) => JSON.parse(raw)).find((fact) => fact.subject === "finding_dispositions");
      const wrapper = JSON.parse(task.readRecord(dispositionFact.evidence[0].ref));
      const leaf = JSON.parse(task.readRecord(wrapper.refs[0].ref));
      expect(leaf.subject_fact.disposition_items).toEqual([]);
      expect(leaf.subject_fact.source_review_refs).toEqual([{ ref: review.attempt_ref, sha256: sha256(originalReview) }]);
    });
  }, 30000);

  it("ORACLE-RT-001 public run rejects historical Phase tests after a declared Phase file changes", async () => {
    await withPublicPhaseFixture(async ({ worktree, run }) => {
      writeFileSync(join(worktree, "src/owned.mjs"), "export const owned = 2;\n");
      await expect(run()).rejects.toThrow(/write set changed.*src\/owned\.mjs/);
    });
  }, 30000);
});


describe("CARD-03 real Phase packet producer", () => {
  it("ORACLE-RT-001 the sealed public producer keeps own Phase diff and excludes another Phase", async () => {
    await withPublicPhaseFixture(async ({ task, workspace, worktree, fixtureRoot, command, base, artifacts }) => {
      writeFileSync(join(worktree, "other/unrelated.mjs"), "export const other = 2;\n");
      const input = join(fixtureRoot, "packet-capture.json");
      writeFileSync(input, JSON.stringify({ command, receipt_ref: "quality/tests/packet-current.json", output_ref: "quality/tests/output/packet-current.output" }));
      const capture = await stageRuntimeCliMain(["verify", "--action=execute", ...base, `--input=${input}`], { cwd: worktree });
      expect(capture.exit_code).toBe(0);
      const packet = prepareTaskBoundBuildCodeReviewBundle({ task, workspace, artifacts, manifest: task.manifest, identity: task.identity }, {
        stage: "build-code", subject_kind: "phase", phase_id: "P1", review_scope: "phase",
        materials: { approved_spec: artifacts.read("spec.md"), acceptance_criteria: "AC-001: owned phase effect",
          test_evidence: { receipt_ref: capture.receipt_ref, receipt_hash: capture.receipt_hash } },
      }, { loadConfig: () => ({ attachmentRoot: fixtureRoot }) });
      try {
        const diff = readFileSync(join(packet.bundleRoot, "changes.diff"), "utf8");
        const map = JSON.parse(readFileSync(join(packet.bundleRoot, "change-map.json"), "utf8"));
        expect(diff).toContain("src/owned.mjs");
        expect(diff).not.toContain("other/unrelated.mjs");
        expect(map.changes.map((entry) => entry.path)).toEqual(["src/owned.mjs", "src/owned.test.mjs"]);
        const source = JSON.parse(readFileSync(join(packet.bundleRoot, "source.json"), "utf8"));
        expect(source.snapshot_tree).toBe(capture.snapshot_tree);
      } finally { packet.dispose(); }
    });
  }, 30000);
});


describe("CARD-03 implementation receipt rename sides", () => {
  it("authenticates a real Git rename source and destination plus deletion and addition through public run", async () => {
    await withPublicPhaseFixture(async ({ task, workspace, run, capture, originalReceipt }) => {
      const original = writeCurrentImplementationReceipt({ task, workspace });
      const bytes = task.readRecord(original.ref), receipt = JSON.parse(bytes);
      const diffBytes = task.readRecord(receipt.diff_ref);
      const result = await run();
      expect(receipt.changed).toEqual(expect.arrayContaining(["src/rename-old.mjs", "src/rename-new.mjs", "src/delete-old.mjs", "src/add-new.mjs"]));
      expect(result.quality_fact_refs.length).toBeGreaterThan(0);
      expect(task.readRecord(original.ref)).toBe(bytes);
      expect(task.readRecord(receipt.diff_ref)).toBe(diffBytes);
      expect(task.readRecord(capture.receipt_ref)).toBe(originalReceipt);
    }, { renameBoundary: true });
  }, 30000);

  it("rejects a new immutable caller receipt hiding only the renamed old path and retains every authentic original", async () => {
    await withPublicPhaseFixture(async ({ task, workspace, worktree, capture, originalReceipt, fixtureRoot, base, kernel }) => {
      const original = writeCurrentImplementationReceipt({ task, workspace });
      const bytes = task.readRecord(original.ref), receipt = JSON.parse(bytes), diffBytes = task.readRecord(receipt.diff_ref);
      expect(receipt.changed).toContain("src/rename-old.mjs");
      const attack = { ...receipt, changed: receipt.changed.filter((path) => path !== "src/rename-old.mjs") };
      const attackBytes = JSON.stringify(attack) + "\n", attackRef = `quality/evidence/implementation/${sha256(attackBytes)}.json`;
      kernel.publishCanonicalRecord(attackRef, attackBytes);
      const input = join(fixtureRoot, "rename-attack-run.json");
      writeFileSync(input, JSON.stringify({ receipts: { implementation: attackRef, tests: capture.receipt_ref } }));
      await expect(stageRuntimeCliMain(["run", "--action=execute", ...base, `--input=${input}`], { cwd: worktree }))
        .rejects.toThrow(/implementation.changed differs from the authenticated execution-baseline diff/);
      expect(task.readRecord(original.ref)).toBe(bytes);
      expect(task.readRecord(receipt.diff_ref)).toBe(diffBytes);
      expect(task.readRecord(capture.receipt_ref)).toBe(originalReceipt);
      expect(task.readRecord(attackRef)).toBe(attackBytes);
    }, { renameBoundary: true });
  }, 30000);
});


describe("CARD-03 stage-end existing native acceptance projection (ORACLE-RT-001)", () => {
  const capturePacket = async (run, task) => {
    let packet;
    const publicResult = await run(undefined, { specAnalyzeExecutor: async (request) => {
      packet = request.packet;
      throw new Error("constructed fixture lens unavailable; no provider dispatch");
    } });
    expect(packet, "actual public stage-end must reach portable lens with its real packet").toBeDefined();
    const facts = (publicResult.quality_fact_refs ?? []).map((ref) => ({ ref, value: JSON.parse(task.readRecord(ref)) }));
    const executionFact = facts.find(({ value }) => value.subject === "acceptance_execution");
    const readBound = (reference) => {
      const raw = task.readRecord(reference.ref);
      expect(sha256(raw), `canonical native fixture binding ${reference.ref}`).toBe(reference.sha256);
      return { reference, raw, value: JSON.parse(raw) };
    };
    const wrappers = (executionFact?.value.evidence ?? []).map(readBound);
    for (const { value } of wrappers) {
      validateAcceptanceEvidence(value);
      expect(value.acceptance_criterion_id).toBe("acceptance_execution");
      expect(value.snapshot_tree).toBe(executionFact.value.snapshot_tree);
    }
    const aggregates = wrappers.flatMap(({ value }) => value.refs).map(readBound)
      .filter(({ value }) => value.subject === "acceptance_execution");
    for (const { value } of aggregates) {
      expect(value.task_id).toBe(task.identity.taskId);
      expect(value.stage).toBe("build-code");
      expect(value.snapshot_tree).toBe(executionFact.value.snapshot_tree);
      expect(value.material_revision).toBe(executionFact.value.material_revision);
    }
    const leafRefs = aggregates.flatMap(({ value }) => (value.subject_fact?.execution_items ?? []).flatMap((item) => item.evidence_refs ?? []));
    const leaves = leafRefs.map((reference) => ({ reference, raw: task.readRecord(reference.ref) }))
      .map(({ reference, raw }) => ({ reference, raw, leaf: JSON.parse(raw) }));
    const diagnostic = JSON.stringify({ publicResult, executionFact, wrappers, aggregates, leafRefs,
      fixture_native_leaves: leaves.map(({ leaf }) => leaf), packet_acceptance_refs: packet.evidence.filter((e) => e.kind === "acceptance") });
    expect(leaves.length, `native premise missing: ${diagnostic}`).toBeGreaterThan(0);
    return { packet, leaves, diagnostic, executionFact };
  };
  it("reuses byte-authenticated execution for metadata-only rerun while retaining unavailable review source", async () => {
    await withPublicPhaseFixture(async ({ run, task, worktree }) => {
      const first = await capturePacket(run, task);
      expect(first.executionFact.value.status).toBe("passed"); // evaluation ran
      expect(first.leaves[0].leaf.subject_fact.status).toBe("failed"); // criterion did not pass
      const second = await capturePacket(run, task);
      expect(second.leaves.map(({ reference }) => reference)).toEqual(first.leaves.map(({ reference }) => reference));
      const facts = task.listCanonicalQualityFactRefs().map((ref) => JSON.parse(task.readRecord(ref)));
      const review = facts.filter((fact) => fact.subject === "phase_review" && fact.status === "unavailable");
      expect(review.length).toBeGreaterThan(0);
      const dispositions = facts.filter((fact) => fact.subject === "finding_dispositions");
      expect(dispositions.some((fact) => fact.status === "passed")).toBe(true);
      writeFileSync(join(worktree, "src/native-service.mjs"), readFileSync(join(worktree, "src/native-service.mjs"), "utf8") + "\n// real code snapshot changed\n");
      const changed = await capturePacket(run, task);
      expect(changed.leaves.map(({ reference }) => reference)).not.toEqual(first.leaves.map(({ reference }) => reference));
    }, { nativeProjection: { outcome: "failed" } });
  }, 60000);
  for (const outcome of ["achieved", "incomplete", "deferred", "failed"]) {
    it(`projects this canonical subject_fact scenario and ${outcome} without filling independent proofs`, async () => {
      await withPublicPhaseFixture(async ({ run, task }) => {
        let originalHandlerStatus;
        nativeProjectionFault.handlerTransform = (realResult) => {
          originalHandlerStatus = realResult.facts.acceptance_coverage.items.find((r) => r.acceptance_criterion_id === "AC-001").status;
          return realResult; // Read-only: preserve the authentic handler result.
        };
        let captured;
        try { captured = await capturePacket(run, task); }
        finally { nativeProjectionFault.handlerTransform = null; }
        const { packet, leaves, diagnostic, executionFact } = captured;
        expect(executionFact.value.status, "a real completed evaluation does not claim all ACs achieved").toBe("passed");
        const row = packet.acceptance_coverage.find((r) => r.acceptance_criterion_id === "AC-001");
        const own = leaves.filter(({ leaf }) => leaf.subject === "AC-001");
        expect(own, diagnostic).toHaveLength(1);
        const { reference, raw, leaf } = own[0];
        expect(sha256(raw), diagnostic).toBe(reference.sha256);
        validators.validateAcceptanceExecutionEvidence(leaf);
        expect(packet.evidence.some((e) => e.kind === "acceptance" && e.ref === reference.ref && e.hash === reference.sha256), diagnostic).toBe(true);
        expect(leaf.subject_fact.execution.scenario).toBe("constructed native scenario 0");
        expect(leaf).not.toHaveProperty("execution");
        expect(row.scenario).toContain("AC-001");
        expect(row.scenario).toContain(leaf.subject_fact.execution.scenario);
        expect(row.actual_outcome).toContain(leaf.subject_fact.outcome);
        expect(row.actual_outcome).toContain("ORACLE-UNIT-001");
        expect(row.actual_outcome).toContain(JSON.stringify(leaf.subject_fact.assertions[0].actual));
        expect(row.source_ids).toEqual([]);
        for (const key of ["file_symbol", "implementation_anchor", "verification_anchor", "review_ref", "stage_end_ref", "gate", "test_result"]) {
          expect(row).not.toHaveProperty(key);
        }
        expect(row.coverage_limits).toMatch(/未得到可认证原始来源|原始需求索引/);
        expect(row.status).toBe(originalHandlerStatus);
        // This unit deferred owner is not a declared future-stage handoff:
        // the real executor reports failed, so existing coverage remains missing.
        expect(row.status).toBe(outcome === "achieved" ? "covered" : "missing");
        if (outcome === "deferred") expect(leaf.subject_fact.outcome).toBe("deferred");
        if (outcome !== "achieved") expect(row.actual_outcome).toContain("constructed non-achieved outcome");
      }, { nativeProjection: { outcome } });
    }, 30000);
  }
  it("retains both required scenario observations rather than taking the first successful leaf", async () => {
    await withPublicPhaseFixture(async ({ run, task }) => {
      const { packet } = await capturePacket(run, task), row = packet.acceptance_coverage[0];
      expect(row.scenario).toContain("constructed native scenario 0");
      expect(row.scenario).toContain("constructed native scenario 1");
      expect(row.actual_outcome).toContain("unit:own-scenario");
      expect(row).not.toHaveProperty("gate");
      expect(row).not.toHaveProperty("test_result");
    }, { nativeProjection: { scenarios: 2 } });
  }, 30000);
  it("retains the healthy first native observation when the second required scenario times out and exposes its gap", async () => {
    await withPublicPhaseFixture(async ({ run, task }) => {
      const { packet, leaves, diagnostic } = await capturePacket(run, task);
      expect(leaves, diagnostic).toHaveLength(2);
      expect(leaves[0].leaf.subject_fact.outcome, diagnostic).toBe("achieved");
      expect(leaves[1].leaf.subject_fact.execution.timed_out, diagnostic).toBe(true);
      const row = packet.acceptance_coverage[0];
      expect(row.scenario, diagnostic).toContain("constructed native scenario 0");
      expect(row.actual_outcome, diagnostic).toContain("achieved");
      expect(row.actual_outcome, diagnostic).toContain("unit:own-scenario");
      expect(row.coverage_limits, diagnostic).toMatch(/MATERIAL_INCOMPLETE/);
      expect(row.status, diagnostic).not.toBe("covered");
      expect(row).not.toHaveProperty("gate");
      expect(row).not.toHaveProperty("test_result");
    }, { nativeProjection: { scenarios: 2, partialTimeout: true } });
  }, 30000);
  it("rejects a conflicting semantic caller claim even when another required native scenario has a gap", async () => {
    await withPublicPhaseFixture(async ({ run }) => {
      let invoked = false;
      nativeProjectionFault.handlerTransform = (realResult) => {
        invoked = true;
        const result = structuredClone(realResult);
        expect(result.facts.acceptance_execution.items).toHaveLength(2);
        result.facts.acceptance_coverage.items[0].scenario = "caller unverified whole-chain success";
        result.facts.acceptance_coverage.items[0].actual_outcome = "caller all achieved";
        return result;
      };
      try {
        await expect(run()).rejects.toThrow(/caller semantic claim conflicts/);
        expect(invoked).toBe(true);
      } finally { nativeProjectionFault.handlerTransform = null; }
    }, { nativeProjection: { scenarios: 2, partialTimeout: true } });
  }, 30000);
  for (const mode of ["no-assertions", "timeout"]) {
    it(`retains truthful ${mode} native evidence without manufacturing a settled observation or gate`, async () => {
      await withPublicPhaseFixture(async ({ run, task }) => {
        const { packet, leaves, diagnostic } = await capturePacket(run, task);
        const row = packet.acceptance_coverage[0], leaf = leaves[0].leaf;
        expect(leaf.subject_fact.outcome, diagnostic).toBe("incomplete");
        expect(leaf.subject_fact.assertions, diagnostic).toEqual([]);
        expect(row.status, diagnostic).not.toBe("covered");
        expect(row.coverage_limits, diagnostic).toMatch(/MATERIAL_INCOMPLETE/);
        expect(row.scenario, diagnostic).toContain(leaf.subject_fact.execution.scenario);
        expect(row.actual_outcome, diagnostic).toContain("incomplete");
        expect(JSON.parse(row.actual_outcome)[0].assertions, diagnostic).toEqual([]);
        for (const field of ["gate", "test_result", "implementation_anchor", "verification_anchor", "review_ref", "stage_end_ref"]) expect(row).not.toHaveProperty(field);
        if (mode === "timeout") expect(leaf.subject_fact.execution.timed_out, diagnostic).toBe(true);
      }, { nativeProjection: { mode, ...(mode === "timeout" ? { timeout_ms: 100 } : {}) } });
    }, 30000);
  }
  for (const variant of ["scenario", "task-binding", "duplicate", "cancel-cleanup"]) {
    it(`checks hash-consistent constructed native ${variant} descriptors after the real handler and retains the original`, async () => {
      await withPublicPhaseFixture(async ({ run, task }) => {
        let originalRef, originalRaw, clonedRef, clonedRaw, packet, publicError;
        nativeProjectionFault.handlerTransform = (realResult) => {
          // The original was produced by this exact real native service call.
          // This adversarial clone is explicitly test-only, never Task proof.
          const result = structuredClone(realResult);
          const first = result.facts.acceptance_execution.items[0];
          originalRef = first.evidence_refs[0].ref;
          originalRaw = task.readRecord(originalRef);
          const leaf = JSON.parse(originalRaw);
          validators.validateAcceptanceExecutionEvidence(leaf);
          if (variant === "duplicate") {
            first.evidence_refs.push({ ...first.evidence_refs[0] });
            return result;
          }
          if (variant === "scenario") leaf.subject_fact.execution.sample = "foreign constructed sample";
          if (variant === "task-binding") {
            leaf.task_id = "constructed-other-task";
            leaf.subject_fact.execution_binding.task_id = leaf.task_id;
            leaf.subject_fact.execution_binding.run_id = `vnext-${sha256(`${leaf.task_id}\0build-code`).slice(0, 32)}`;
            leaf.subject_fact.executor_actor.run_id = leaf.subject_fact.execution_binding.run_id;
          }
          if (variant === "cancel-cleanup") {
            leaf.status = leaf.subject_fact.status = "missing";
            leaf.subject_fact.outcome = "incomplete";
            leaf.subject_fact.outcome_owner = "constructed cancelled unit";
            leaf.subject_fact.outcome_reason = "constructed cancellation and failed cleanup";
            leaf.subject_fact.execution.cancelled = true;
            leaf.subject_fact.execution.cleanup.status = "failed";
            result.facts.acceptance_coverage.items[0].status = "missing";
          }
          validators.validateAcceptanceExecutionEvidence(leaf);
          clonedRaw = `${JSON.stringify(leaf, null, 2)}\n`;
          const hash = sha256(clonedRaw);
          clonedRef = `quality/evidence/stage-quality/build-code/AC-001-${hash}.json`;
          task.createRecordAtomic(clonedRef, clonedRaw);
          expect(sha256(task.readRecord(clonedRef))).toBe(hash);
          const replace = (value) => {
            if (!value || typeof value !== "object") return;
            if (value.ref === originalRef) { value.ref = clonedRef; value.sha256 = hash; }
            for (const child of Object.values(value)) replace(child);
          };
          replace(result);
          expect(first.evidence_refs[0]).toMatchObject({ ref: clonedRef, sha256: hash });
          expect(result.facts.acceptance_coverage.items[0].evidence_refs).toContainEqual({ ref: clonedRef, sha256: hash });
          return result;
        };
        try {
          await run(undefined, { specAnalyzeExecutor: async (request) => {
            packet = request.packet;
            throw new Error("constructed independent lens unavailable");
          } });
        } catch (error) { publicError = error.message; }
        finally { nativeProjectionFault.handlerTransform = null; }
        const diagnostic = JSON.stringify({ variant, originalRef, clonedRef, publicError, packet });
        expect(packet, `must reach current stage-end semantic projection: ${diagnostic}`).toBeDefined();
        const row = packet.acceptance_coverage[0];
        expect(row.coverage_limits, diagnostic).toContain("MATERIAL_INCOMPLETE");
        if (variant === "duplicate") expect(row.coverage_limits, diagnostic).toContain("duplicate native AC reference");
        else if (variant === "cancel-cleanup") {
          expect(row.coverage_limits, diagnostic).toContain("native execution did not settle cleanly");
          expect(row.actual_outcome, diagnostic).toContain("constructed cancellation and failed cleanup");
          expect(row.status, diagnostic).toBe("missing");
        } else {
          expect(row.coverage_limits, diagnostic).toContain("native AC identity/scenario/execution binding mismatch");
          expect(row).not.toHaveProperty("scenario");
          expect(row).not.toHaveProperty("actual_outcome");
        }
        expect(row).not.toHaveProperty("gate");
        expect(row).not.toHaveProperty("test_result");
        expect(task.readRecord(originalRef)).toBe(originalRaw);
        if (clonedRef) expect(task.readRecord(clonedRef)).toBe(clonedRaw);
      }, { nativeProjection: {} });
    }, 30000);
  }
  it("does not attribute a multi-file child exit1 to its passing own-scope oracle", async () => {
    await withPublicPhaseFixture(async ({ run, task }) => {
      const { packet, leaves, diagnostic } = await capturePacket(run, task);
      const { reference, leaf } = leaves[0], row = packet.acceptance_coverage[0];
      const stdoutRaw = task.readRecordBytes(leaf.subject_fact.execution.stdout_ref);
      expect(sha256(stdoutRaw), diagnostic).toBe(leaf.subject_fact.execution.stdout_hash);
      const output = JSON.parse(stdoutRaw.toString("utf8"));
      expect(output.commands, diagnostic).toHaveLength(1);
      const child = output.commands[0];
      expect(child.exit_code, diagnostic).toBe(1);
      expect(child.args, diagnostic).not.toContain("<tmp>");
      for (const raw of Object.values(child.raw_evidence)) expect(sha256(task.readRecordBytes(raw.ref))).toBe(raw.sha256);
      expect(row).not.toHaveProperty("gate");
      expect(row).not.toHaveProperty("test_result");
      expect(row.actual_outcome, diagnostic).toContain("achieved");
      expect(packet.evidence.find((entry) => entry.ref === reference.ref)).not.toHaveProperty("test_result");
      expect(row.status, diagnostic).toBe("covered"); // Authentic original native own-scope verdict; no new upgrade.
      for (const field of ["file_symbol", "implementation_anchor", "verification_anchor", "review_ref", "stage_end_ref"]) expect(row).not.toHaveProperty(field);
      expect(row.source_ids).toEqual([]);
    }, { nativeProjection: { gateVariant: "unique" } });
  }, 30000);
  it("projects an actual scope-only child exit without borrowing the outer receipt", async () => {
    await withPublicPhaseFixture(async ({ run, task }) => {
      const { packet, leaves, diagnostic } = await capturePacket(run, task);
      const row = packet.acceptance_coverage[0];
      const output = JSON.parse(task.readRecordBytes(leaves[0].leaf.subject_fact.execution.stdout_ref).toString("utf8"));
      expect(output.commands[0].args).not.toContain("src/sibling-gate.test.mjs");
      expect(output.commands[0].exit_code).toBe(0);
      expect(row.test_result, diagnostic).toMatchObject({ actual_exit: 0, expected_exit: 0 });
    }, { nativeProjection: { gateVariant: "exact-scope" } });
  }, 30000);
  for (const gateVariant of ["multi-scope", "missing-oracle", "missing-expected", "placeholder-argv", "wrong-raw-hash"]) {
    it(`keeps native gate/test_result missing for ${gateVariant} rather than borrowing the outer passing receipt`, async () => {
      await withPublicPhaseFixture(async ({ run, task }) => {
        const { packet, leaves, diagnostic } = await capturePacket(run, task), row = packet.acceptance_coverage[0];
        const output = JSON.parse(task.readRecordBytes(leaves[0].leaf.subject_fact.execution.stdout_ref).toString("utf8"));
        expect(output.commands[0].exit_code, diagnostic).toBe(1);
        expect(row).not.toHaveProperty("gate");
        expect(row).not.toHaveProperty("test_result");
        expect(packet.evidence.filter((entry) => entry.kind === "acceptance").every((entry) => !entry.test_result), diagnostic).toBe(true);
        expect(row.actual_outcome, diagnostic).toContain("achieved");
      }, { nativeProjection: { gateVariant } });
    }, 30000);
  }
  for (const expectedExitText of ["GREEN 0 or 1", "GREEN 0；GREEN 1"]) {
    it(`keeps an ambiguous material expected_exit ${expectedExitText} out of the native gate`, async () => {
      await withPublicPhaseFixture(async ({ run, task }) => {
        const { packet, leaves, diagnostic } = await capturePacket(run, task);
        const output = JSON.parse(task.readRecordBytes(leaves[0].leaf.subject_fact.execution.stdout_ref).toString("utf8"));
        expect(output.commands[0].exit_code, diagnostic).toBe(1);
        expect(packet.acceptance_coverage[0]).not.toHaveProperty("gate");
        expect(packet.acceptance_coverage[0]).not.toHaveProperty("test_result");
        expect(packet.evidence.filter((entry) => entry.kind === "acceptance").every((entry) => !entry.test_result), diagnostic).toBe(true);
      }, { nativeProjection: { gateVariant: "unique", expectedExitText } });
    }, 30000);
  }
  for (const claim of ["gate", "test_result"]) {
    it(`rejects a caller ${claim} conflict with the authenticated unique native child instead of retaining a typed false claim`, async () => {
      await withPublicPhaseFixture(async ({ run, task }) => {
        let originalRef, originalRaw, invoked = false;
        nativeProjectionFault.handlerTransform = (realResult) => {
          invoked = true;
          const result = structuredClone(realResult), row = result.facts.acceptance_coverage.items[0];
          originalRef = result.facts.acceptance_execution.items[0].evidence_refs[0].ref;
          originalRaw = task.readRecord(originalRef);
          validators.validateAcceptanceExecutionEvidence(JSON.parse(originalRaw));
          row[claim] = claim === "gate" ? { command: "caller fake green command", expected_exit: 0, oracle: "ORACLE-UNIT-001" }
            : { evidence_ref: originalRef, command: "caller fake green command", expected_exit: 0,
                actual_exit: 0, oracle: "ORACLE-UNIT-001", actual_outcome: "caller fake success" };
          return result;
        };
        try {
          await expect(run()).rejects.toThrow(/caller gate\/test_result conflicts/);
          expect(invoked).toBe(true);
        } finally { nativeProjectionFault.handlerTransform = null; }
        expect(task.readRecord(originalRef)).toBe(originalRaw);
      }, { nativeProjection: { gateVariant: "unique" } });
    }, 30000);
  }
  for (const materialCase of [
    { label: "current Chinese Task fields", chineseGateCard: true, expectedExitText: "RED nonzero；GREEN 0" },
    { label: "current GREEN 0 且其余 28 条保持通过 explanation", expectedExitText: "RED nonzero；GREEN 0 且其余 28 条保持通过。" },
  ]) {
    it(`preserves ${materialCase.label} scoped oracle without misattributing batch exit1`, async () => {
      await withPublicPhaseFixture(async ({ run, task }) => {
        const { packet, leaves, diagnostic } = await capturePacket(run, task), row = packet.acceptance_coverage[0];
        const { leaf, reference } = leaves[0];
        const raw = task.readRecordBytes(leaf.subject_fact.execution.stdout_ref);
        expect(sha256(raw), diagnostic).toBe(leaf.subject_fact.execution.stdout_hash);
        const output = JSON.parse(raw.toString("utf8")), child = output.commands[0];
        expect(output.commands, diagnostic).toHaveLength(1);
        expect(child.exit_code, diagnostic).toBe(1);
        for (const bytes of Object.values(child.raw_evidence)) expect(sha256(task.readRecordBytes(bytes.ref))).toBe(bytes.sha256);
        expect(row).not.toHaveProperty("gate");
        expect(row).not.toHaveProperty("test_result");
        expect(packet.evidence.find((entry) => entry.ref === reference.ref)).not.toHaveProperty("test_result");
        expect(row.status, diagnostic).toBe("covered"); // Preserve authentic own-scope verdict; child batch remains exit1.
      }, { nativeProjection: { gateVariant: "unique", ...materialCase } });
    }, 30000);
  }
  it("keeps Chinese multiple GREEN alternatives missing despite otherwise valid unique native scope", async () => {
    await withPublicPhaseFixture(async ({ run, task }) => {
      const { packet, leaves, diagnostic } = await capturePacket(run, task);
      const child = JSON.parse(task.readRecordBytes(leaves[0].leaf.subject_fact.execution.stdout_ref).toString("utf8")).commands[0];
      expect(child.exit_code, diagnostic).toBe(1);
      expect(packet.acceptance_coverage[0]).not.toHaveProperty("gate");
      expect(packet.acceptance_coverage[0]).not.toHaveProperty("test_result");
      expect(packet.evidence.filter((entry) => entry.kind === "acceptance").every((entry) => !entry.test_result), diagnostic).toBe(true);
    }, { nativeProjection: { gateVariant: "unique", chineseGateCard: true, expectedExitText: "GREEN 0；GREEN 1" } });
  }, 30000);
  for (const mode of ["hash", "AC", "task", "snapshot", "material", "scenario", "attempt", "run", "missing", "assertions"]) {
    it(`rejects modified native ${mode} bytes at hash authentication and preserves the real original`, async () => {
      await withPublicPhaseFixture(async ({ run, task }) => {
        const { leaves, diagnostic } = await capturePacket(run, task);
        const ref = leaves.find(({ leaf }) => leaf.subject === "AC-001")?.reference.ref;
        expect(ref, diagnostic).toBeDefined();
        const original = task.readRecord(ref);
        nativeProjectionFault.mode = mode;
        try {
          await expect(run()).rejects.toThrow();
          expect(nativeProjectionFault.hits, "failure must reach the native canonical reader").toBeGreaterThan(0);
        } finally { nativeProjectionFault.mode = null; }
        expect(task.readRecord(ref)).toBe(original);
      }, { nativeProjection: {} });
    }, 30000);
  }
});
