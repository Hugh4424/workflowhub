// Frozen P10 test-only target. Previous bytes and RED archived as P10-frozen-before-metamorphic-*.
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { reconcileCases } from "../../workflows/build-code/case-reconciliation.mjs";
import * as taskReconciliation from "../../workflows/build-code/case-reconciliation.mjs";
import { bootstrapTask } from "../../tools/cli/task-bootstrap.mjs";
import { createTaskKernel, openTask } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { runCapture } from "../../workflows/build-code/capture.mjs";
import { runOfficialStage } from "../../runtime/stage/stage-runner.mjs";
import { verifyOfficialEvidence } from "../../runtime/stage/stage-runner.mjs";
import { writeCurrentImplementationReceipt } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { writeStageRow } from "../../runtime/task/task-store.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";

const roots = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function identity(label) {
  const tag = `${label}-${randomUUID()}`;
  return { caseId: `CASE-${tag}`, fullId: `cancellation preserves account balance ${tag}`,
    criterion: `AC-${tag}` };
}
const selection = (v) => ({ status: "selected", cases: [{ id: v.caseId, acceptance_criterion_ids: [v.criterion],
  execution: { target: "cancel.test.mjs", expected_test_identity: v.fullId, runner: "node:test" } }] });
const reconcile = (v, observations, oracleEvidence = []) => reconcileCases({ selection: selection(v), observations, oracleEvidence,
  task: { task_id: `p10-${v.caseId}`, acceptance_criterion_ids: [v.criterion] } });
function rejectsFor(result, reason) {
  expect(result.status).not.toBe("reconciled");
  expect(result.reason, "a blanket unavailable/not_implemented response is not cause-specific rejection").toBe(reason);
  expect((result.entries ?? []).some(({ status }) => status === "passed")).toBe(false);
}
function expectsObservedSyntheticCase(result, v, evidence) {
  expect(result.status).toBe("unavailable");
  expect(result.reason).toBe("unauthenticated_business_oracle");
  expect(result.task_id).toBe(`p10-${v.caseId}`);
  expect(result.entries).toEqual([{
    case_id: v.caseId, acceptance_criterion_id: v.criterion, status: "observed",
    report_ref: evidence.report_ref, raw_report_sha256: evidence.raw_report_sha256,
    before_ref: evidence.before_ref, before_sha256: evidence.before_sha256,
    after_ref: evidence.after_ref, after_sha256: evidence.after_sha256,
  }]);
  for (const [ref, digest] of [[evidence.report_ref, evidence.raw_report_sha256],
    [evidence.before_ref, evidence.before_sha256], [evidence.after_ref, evidence.after_sha256]]) {
    expect(sha256(readFileSync(ref))).toBe(digest);
  }
}
function runCancellation(v, { charge = false, leaveActive = false, weakTest = false } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p10-effect-")));
  roots.push(root);
  const account = join(root, "account.json"), beforeRef = join(root, "before.json"), reportRef = join(root, "runner.tap");
  const beforeBytes = Buffer.from(JSON.stringify({ account_id: `acct-${v.caseId}`, balance_cents: 1200, cancelled: false }));
  writeFileSync(account, beforeBytes);
  writeFileSync(beforeRef, beforeBytes);
  const program = join(root, "cancel.mjs"), target = join(root, "cancel.test.mjs");
  writeFileSync(program, [
    'import { readFileSync, writeFileSync } from "node:fs";',
    'export function cancel(accountRef) {',
    '  const account = JSON.parse(readFileSync(accountRef, "utf8"));',
    `  account.balance_cents += ${charge ? "100" : "0"};`,
    `  account.cancelled = ${leaveActive ? "false" : "true"};`,
    '  writeFileSync(accountRef, JSON.stringify(account));',
    '}',
  ].join("\n"));
  writeFileSync(target, [
    'import { test } from "node:test";',
    'import { strict as assert } from "node:assert";',
    'import { readFileSync } from "node:fs";',
    'import { cancel } from "./cancel.mjs";',
    `test(${JSON.stringify(v.fullId)}, () => {`,
    '  const before = JSON.parse(readFileSync("before.json", "utf8"));',
    '  cancel("account.json");',
    '  const after = JSON.parse(readFileSync("account.json", "utf8"));',
    ...(weakTest ? ['  assert.equal(after.account_id, before.account_id);'] : [
      '  assert.equal(after.balance_cents, before.balance_cents);',
      '  assert.equal(after.cancelled, true);',
    ]),
    '});',
  ].join("\n"));
  const child = spawnSync(process.execPath, ["--test", "--test-reporter=tap", "cancel.test.mjs"],
    { cwd: root, encoding: "utf8", shell: false });
  if (child.error) throw child.error;
  const report = child.stdout + child.stderr;
  writeFileSync(reportRef, report);
  const afterBytes = readFileSync(account);
  const observedFullId = report.match(/^# Subtest: (.+)$/m)?.[1];
  const observedPass = report.includes(`ok 1 - ${v.fullId}`) && /# pass 1\b/.test(report)
    && /# fail 0\b/.test(report) && child.status === 0;
  const observation = { case_id: v.caseId, test_file: "cancel.test.mjs", full_id: observedFullId,
    status: observedPass ? "passed" : "failed", exit_code: child.status,
    report_ref: reportRef, raw_report_sha256: sha256(report) };
  const evidence = { case_id: v.caseId, acceptance_criterion_id: v.criterion, before_ref: beforeRef,
    before_sha256: sha256(beforeBytes), after_ref: account, after_sha256: sha256(afterBytes),
    report_ref: reportRef, raw_report_sha256: sha256(report),
    source_sha256: sha256(readFileSync(program)), target_sha256: sha256(readFileSync(target)),
    balance_before_cents: JSON.parse(beforeBytes).balance_cents,
    balance_after_cents: JSON.parse(afterBytes).balance_cents,
    cancelled: JSON.parse(afterBytes).cancelled };
  return { account, beforeRef, reportRef, child, observation, evidence };
}

describe("ORACLE-P10-CASE-RECONCILIATION: runner identity plus independently read effect", () => {
  it.each(["pending", "skipped", "todo", "failed"])("identifies a %s result", (status) => {
    const v = identity(status);
    rejectsFor(reconcile(v, [{ case_id: v.caseId, test_file: "cancel.test.mjs", full_id: v.fullId,
      status, raw_report_sha256: sha256("negative runner report"), exit_code: status === "failed" ? 1 : 0 }]), "nonpassing_runner_status");
  });
  it("identifies duplicate passed identities alongside a real successful effect", () => {
    const v = identity("duplicate"), { observation, evidence } = runCancellation(v);
    expect(observation.status).toBe("passed");
    rejectsFor(reconcile(v, [observation, observation], [evidence]), "duplicate_runner_identity");
  });
  it("identifies a passing reporter name without an independent business oracle", () => {
    const v = identity("no-oracle"), { observation } = runCancellation(v);
    expect(observation.status).toBe("passed");
    rejectsFor(reconcile(v, [observation]), "missing_business_oracle");
  });
  it.each(["charged", "active"])("rejects a passing weak-name child with wrong actual %s effect", (variant) => {
    const v = identity(variant), { account, beforeRef, child, observation, evidence } = runCancellation(v,
      { charge: variant === "charged", leaveActive: variant === "active", weakTest: true });
    expect(child.status).toBe(0);
    expect(observation.status).toBe("passed");
    expect(observation.full_id).toBe(v.fullId);
    expect(readFileSync(evidence.report_ref, "utf8")).toContain(`# pass 1`);
    const actual = JSON.parse(readFileSync(account)), before = JSON.parse(readFileSync(beforeRef));
    if (variant === "charged") expect(actual.balance_cents).toBe(before.balance_cents + 100);
    else expect(actual.cancelled).toBe(false);
    rejectsFor(reconcile(v, [observation], [evidence]), "business_effect_mismatch");
  });
  it.each(["forged-report", "wrong-identity", "missing-effect"])("identifies %s rather than trusting claimed success", (variant) => {
    const v = identity(variant), { account, observation, evidence } = runCancellation(v);
    expect(observation.status).toBe("passed");
    const reported = { ...observation }, observed = { ...evidence };
    if (variant === "forged-report") reported.raw_report_sha256 = sha256("forged report");
    if (variant === "wrong-identity") reported.full_id = `other-${randomUUID()}`;
    if (variant === "missing-effect") { rmSync(account); observed.after_sha256 = sha256("made-up account"); }
    const reasons = { "forged-report": "report_digest_mismatch", "wrong-identity": "runner_identity_mismatch", "missing-effect": "missing_effect_artifact" };
    rejectsFor(reconcile(v, [reported], [observed]), reasons[variant]);
  });
  it.each(["alpha", "beta"])("reconciles %s child TAP, distinct account artifacts and AC", (label) => {
    const v = identity(label), { account, beforeRef, reportRef, observation, evidence } = runCancellation(v);
    expect(observation.status).toBe("passed");
    expect(observation.full_id).toBe(v.fullId);
    expect(evidence.before_sha256).toBe(sha256(readFileSync(beforeRef)));
    expect(evidence.after_sha256).toBe(sha256(readFileSync(account)));
    expect(observation.raw_report_sha256).toBe(sha256(readFileSync(reportRef)));
    expect(JSON.parse(readFileSync(account)).cancelled).toBe(true);
    expect(JSON.parse(readFileSync(account)).balance_cents).toBe(JSON.parse(readFileSync(beforeRef)).balance_cents);
    const result = reconcile(v, [observation], [evidence]);
    expectsObservedSyntheticCase(result, v, evidence);
  });
  it("rejects a blanket unavailable result with no observed account or source entries", () => {
    const v = identity("blanket"), { observation, evidence } = runCancellation(v);
    const result = reconcile(v, [observation], [evidence]);
    expectsObservedSyntheticCase(result, v, evidence);
    expect(() => expectsObservedSyntheticCase({ ...result, entries: [] }, v, evidence)).toThrow();
  });
});


const git = (cwd, ...args) => execFileSync("git", args, {
  cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
}).trim();
const mainDependencies = "/Users/Hugh/Hugh/Project/workflowhub/node_modules";

function taskCaseFixture(ac = "AC-26", { secondCaseMissingAc = false, specAcceptanceIds = null,
  caseId = null, decisionText = null } = {}) {
  const acIds = Array.isArray(ac) ? ac : [ac];
  const acceptedIds = specAcceptanceIds ?? acIds;
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p10-current-case-")));
  const repo = join(root, "repo"), storage = join(root, "storage"), home = join(root, "home");
  mkdirSync(repo); mkdirSync(storage); mkdirSync(home);
  git(repo, "init", "-q", "-b", "main");
  git(repo, "config", "user.name", "Case fixture");
  git(repo, "config", "user.email", "case@example.test");
  const taskId = `p10-current-${randomUUID()}`;
  const specs = join(repo, "specs", taskId), phaseDir = join(specs, "phases");
  mkdirSync(phaseDir, { recursive: true });
  mkdirSync(join(repo, "docs", "quality"), { recursive: true });
  mkdirSync(join(repo, "tests", "contract"), { recursive: true });
  writeFileSync(join(repo, ".gitignore"), "node_modules/\n.vite/\n");
  const decision = decisionText ?? "# Decision\n\n## 需求变更记录\n\n### U-001\nsource\n\n## 原始需求索引\nR-001\n\n## 逐字声明层（verbatim）\nV-001\n";
  const spec = `# Spec\n\n- **FR-001**: Current fact source.\n${acceptedIds.map((id) => `- [ ] **${id}**: Current case.`).join("\n")}\n`;
  const phase = "# Phase P1\n\nCurrent fact source.\n";
  writeFileSync(join(specs, "decision-log.md"), decision);
  writeFileSync(join(specs, "spec.md"), spec);
  writeFileSync(join(phaseDir, "P1.md"), phase);
  writeFileSync(join(phaseDir, "index.md"), "# Phase index\n\n## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n| `P1` | `phases/P1.md` |\n");
  writeFileSync(join(repo, "product.mjs"), "export const effect = 'old';\n");
  const target = "tests/contract/current-case.test.mjs";
  const testSource = "import { it, expect } from 'vitest';\nit('first current leaf', () => expect(true).toBe(true));\nit('second current leaf', () => expect(true).toBe(true));\n";
  writeFileSync(join(repo, target), testSource);
  const ids = [`${target} > first current leaf`, `${target} > second current leaf`];
  const command = `npx vitest run ${target} --reporter=json`;
  const secondTarget = "tests/contract/second-case.test.mjs";
  const secondIds = [`${secondTarget} > first current leaf`, `${secondTarget} > second current leaf`];
  const secondCommand = `npx vitest run ${secondTarget} --reporter=json`;
  if (secondCaseMissingAc) writeFileSync(join(repo, secondTarget), testSource);
  const registry = { schema: "workflowhub-test-asset-registry.v1", revision: "fixture-current-1",
    owner: "fixture test asset owner", outside_scope: "unknown",
    retirement_policy: "Retire with reviewed replacement and prior ID preservation.",
    targets: [{ path: target, sha256: sha256(testSource), runner: "vitest", command,
      owner: "fixture test asset owner", status: "active", registered_test_ids: ids },
    ...(secondCaseMissingAc ? [{ path: secondTarget, sha256: sha256(testSource), runner: "vitest", command: secondCommand,
      owner: "fixture test asset owner", status: "active", registered_test_ids: secondIds }] : [])] };
  writeFileSync(join(repo, "docs/quality/test-asset-registry.json"), `${JSON.stringify(registry, null, 2)}\n`);
  const sourcePath = `specs/${taskId}/decision-log.md`, rulePath = `specs/${taskId}/phases/P1.md`;
  const ruleRevision = `sha256:${sha256(phase)}`;
  const entry = { id: caseId ?? `CURRENT-${acIds.join("-")}`, status: "active", ac_ids: acIds, task_ids: ["T021"], phase_ids: ["P1"],
    source: { path: sourcePath, revision: `sha256:${sha256(decision)}` },
    rule: { id: "CURRENT-RULE", path: rulePath, revision: ruleRevision, statement: "Current Task fact only" },
    change_triggers: ["product.mjs"], related_case_ids: [],
    execution: { target, machine_command: command, registered_test_ids: ids,
      expected_test_identity: "current case", runner: "vitest" },
    effect_observation: { schema_version: "workflowhub-business-effect-observation.v1",
      observation_status: "not_yet_observed", rule_revision: ruleRevision,
      canonical_source: { type: "current_task_acceptance_quality_fact_chain", stage: "build-code",
        subject: acIds[0], material_source_path: sourcePath, rule_source_path: rulePath },
      reader: { owner: "fixture", implementation_status: "not_implemented" },
      ...(acIds.length === 1 && acIds[0] === "AC-27" && caseId !== "CARD04-DEFERRED-ACCEPTANCE-REGRESSION"
        ? { producer_status: "not_implemented", capability_scope: "helper_validator_only" } : {}) } };
  const cases = secondCaseMissingAc
    ? [entry, { ...entry, id: "CURRENT-MISSING-AC", ac_ids: [],
      execution: { ...entry.execution, target: secondTarget, machine_command: secondCommand,
        registered_test_ids: secondIds } }]
    : [entry];
  writeFileSync(join(repo, "docs/quality/business-case-catalog.json"), `${JSON.stringify({
    schema: "workflowhub-business-case-catalog.v1", project: "Case", revision: "fixture-catalog-1",
    owner: "fixture business owner", cases,
  }, null, 2)}\n`);
  git(repo, "add", "."); git(repo, "commit", "-qm", "case source baseline");
  mkdirSync(join(storage, "activation"));
  writeFileSync(join(storage, "activation/card-01.json"), JSON.stringify({
    schema_version: "card-01-activation.v1", capability_acceptance: { ref: "quality/evidence/activation.json", sha256: "a".repeat(64) },
    release_marker: { commit: git(repo, "rev-parse", "HEAD"), channel: "main" },
    entry_consumption: { evidence_ref: "quality/evidence/entry.json", observed_at: "2026-09-27T00:00:00Z" },
    activated_at: "2026-09-27T00:00:00Z",
  }));
  const bootstrapped = bootstrapTask({ project: "Case", task: taskId, "target-repo": repo },
    { env: { HOME: home, WORKFLOWHUB_TASK_DIR: storage }, home, cwd: repo });
  const task = openTask(bootstrapped.task_path, "Case", taskId);
  const workspace = openCurrentTaskWorkspace(task);
  symlinkSync(mainDependencies, join(workspace.worktreeRoot, "node_modules"), "dir");
  writeFileSync(join(workspace.worktreeRoot, "product.mjs"), "export const effect = 'new';\n");
  process.env.WORKFLOWHUB_TASK_DIR = storage;
  process.env.HOME = home;
  return { root, task, workspace, entry, ids, ac, decision };
}

const censusDecision = `# Decision\n\n## 需求变更记录\n\n### U-001\n> First original requirement.\n\n${Array.from({ length: 5 }, (_, index) => `| U-001-${String(index + 1).padStart(2, "0")} | First part ${index + 1} |`).join("\n")}\n\n### U-002\n> Second original requirement.\n\n### U-003\n> Third original requirement.\n\n## 原始需求索引\n\n| ID | Source | Decision |\n| --- | --- | --- |\n${Array.from({ length: 8 }, (_, index) => `| R-${String(index + 1).padStart(3, "0")} | ${index < 5 ? `U-001-${String(index + 1).padStart(2, "0")}` : index === 5 ? "U-002" : index === 6 ? "U-003" : "V-001"} | D-001 |`).join("\n")}\n\n## 逐字声明层（verbatim）\n\n| ID | Speaker | Source | Text |\n| --- | --- | --- | --- |\n| V-001 | 用户 | session | Fourth independent user statement. |\n`;

function publishCurrentAcceptance(state, capture, { result = "pass", status = "passed",
  receiptRef = capture.receipt_ref, receiptHash = capture.receipt_hash,
  subject = state.ac, snapshotTree = null, materialRevision = null,
  nestedTaskId = null, nestedTree = null, nestedRevision = null,
  additionalEvidenceRefs = [] } = {}) {
  const kernel = createTaskKernel(state.task, { workspace: state.workspace });
  const tree = snapshotTree ?? kernel.currentVNextSnapshot().tree;
  const revision = materialRevision ?? kernel.currentVNextMaterialRevision();
  const stageQuality = { schema_version: "stage-quality-evidence.v1",
    task_id: nestedTaskId ?? state.task.identity.taskId, stage: "build-code", subject, status,
    snapshot_tree: nestedTree ?? tree, material_revision: nestedRevision ?? revision,
    subject_fact: { status, detail: "fixture current acceptance",
      evidence_refs: [{ ref: receiptRef, sha256: receiptHash }, ...additionalEvidenceRefs] } };
  const stageRaw = `${JSON.stringify(stageQuality, null, 2)}\n`;
  const stageRef = `quality/evidence/stage-quality/build-code/${subject}-${sha256(stageRaw)}.json`;
  const stageEvidence = kernel.publishCanonicalRecord(stageRef, stageRaw);
  const acceptance = { schema_version: "acceptance-evidence.v1", acceptance_criterion_id: subject,
    result, refs: [stageEvidence], snapshot_tree: tree,
    summary: { actual_outcome: status, evidence_type: "stage quality fact" },
    freshness: { status: "current", evaluated_at: new Date().toISOString(), snapshot_tree: tree,
      material_revision: revision, evidence_freshness: [{ ...stageEvidence, status: "current" }] } };
  const acceptanceRaw = `${JSON.stringify(acceptance, null, 2)}\n`;
  const acceptanceRef = `quality/evidence/acceptance/build-code/${subject}-${sha256(acceptanceRaw)}.json`;
  const acceptanceEvidence = kernel.publishCanonicalRecord(acceptanceRef, acceptanceRaw);
  return kernel.publishVNextQualityFact("build-code", { kind: "acceptance_criterion", status,
    subject, evidence: [{ ...acceptanceEvidence, evidence_type: "acceptance_evidence" }] });
}

describe("ORACLE-P10-T021: final stage-row identity without inferred receipt consumption", () => {
  const originalHome = process.env.HOME, originalTaskDir = process.env.WORKFLOWHUB_TASK_DIR;
  afterAll(() => {
    if (originalTaskDir === undefined) delete process.env.WORKFLOWHUB_TASK_DIR;
    else process.env.WORKFLOWHUB_TASK_DIR = originalTaskDir;
    if (originalHome === undefined) delete process.env.HOME;
    else process.env.HOME = originalHome;
  });

  it("retains the exact final row write privately and leaves the supplied receipt unverified", async () => {
    const state = taskCaseFixture("AC-26", { caseId: "CARD04-DECISION-LOG-CENSUS", decisionText: censusDecision });
    try {
      const kernel = createTaskKernel(state.task, { workspace: state.workspace });
      const context = { stage: "build-code", task: state.task, kernel, identity: state.task.identity,
        workflowRunId: kernel.deriveStageWorkflowRunId("build-code"), manifest: state.task.manifest,
        candidateWorkspace: state.workspace, artifacts: ArtifactDir.open(state.workspace.worktreeRoot, state.task) };
      const first = await runOfficialStage("build-code", context, {});
      expect(first).not.toHaveProperty("p10_consumption_evidence");
      const row = state.task.readRecord("facts.jsonl").trimEnd().split("\n")
        .map((line) => JSON.parse(line)).find((value) => value.stage === "build-code");
      writeStageRow(state.task.taskPath, { ...row, phase_progress: {
        phase_id: "P10", task_id: "T021", material_revision: kernel.currentVNextMaterialRevision(),
        recorded_at: new Date().toISOString() } });
      const { FIXED_TARGETED_CAPTURE_COMMAND } = await import("../../workflows/build-code/capture.mjs");
      const receipt = await runCapture(FIXED_TARGETED_CAPTURE_COMMAND, "quality/tests/p10-t021-run-a.json",
        { task: state.task, workspace: state.workspace });
      expect(receipt.targeted_capture.status).toBe("executed");
      const used = await runOfficialStage("build-code", context, {
        receipts: { tests: receipt.receipt_ref } });
      const usedLine = state.task.readRecord("facts.jsonl").split("\n").find((line) => {
        if (!line) return false;
        const value = JSON.parse(line);
        return value.record_kind === "stage" && value.stage === "build-code";
      });
      expect(used.stage_reflection.stage_row_write, JSON.stringify(used.stage_reflection)).toMatchObject({
        ref: expect.stringMatching(/^facts\.jsonl#\d+$/), sha256: sha256(`${usedLine}\n`),
        value: expect.objectContaining({ stage: "build-code", source: "stage-end:build-code" }),
      });
      expect(Object.keys(used.stage_reflection)).not.toContain("stage_row_write");
      expect(JSON.stringify(used)).not.toContain("stage_row_write");
      const testFacts = used.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref)))
        .filter((fact) => fact.kind === "test" && fact.evidence.some((evidence) => evidence.ref === receipt.receipt_ref));
      expect(testFacts).toEqual([]);
      expect(used).not.toHaveProperty("p10_consumption_evidence");
      const positive = taskReconciliation.reconcileCurrentTaskCases({ task: state.task, workspace: state.workspace,
        capture: receipt });
      expect(positive.execution_freshness).toBe("unknown");
      expect(positive.business_effect_status).toBe("unknown");
      const after = await runOfficialStage("build-code", context, {});
      expect(after).not.toHaveProperty("p10_consumption_evidence");
      expect(after.stage_reflection.stage_row_write.sha256).not.toBe(used.stage_reflection.stage_row_write.sha256);
      expect(sha256(`${state.task.readRecord("facts.jsonl").split("\n").find((line) =>
        line && JSON.parse(line).stage === "build-code")}\n`))
        .toBe(after.stage_reflection.stage_row_write.sha256);
    } finally { rmSync(state.root, { recursive: true, force: true }); }
  }, 90_000);
});

describe("ORACLE-P10-CURRENT-CASE: outer receipt and per-target reporter are separate facts", () => {
  let state, capture;
  const originalHome = process.env.HOME, originalTaskDir = process.env.WORKFLOWHUB_TASK_DIR;
  beforeAll(async () => {
    state = taskCaseFixture();
    const exclude = join(state.root, "p10-git-excludes");
    writeFileSync(exclude, "node_modules\n");
    git(state.workspace.worktreeRoot, "config", "core.excludesfile", exclude);
    const { FIXED_TARGETED_CAPTURE_COMMAND } = await import("../../workflows/build-code/capture.mjs");
    capture = await runCapture(FIXED_TARGETED_CAPTURE_COMMAND, "quality/tests/current-case-outer.json", {
      task: state.task, workspace: state.workspace,
    });
    expect(capture.targeted_capture.status).toBe("executed");
  });
  afterAll(() => {
    if (state) rmSync(state.root, { recursive: true, force: true });
    if (originalTaskDir === undefined) delete process.env.WORKFLOWHUB_TASK_DIR;
    else process.env.WORKFLOWHUB_TASK_DIR = originalTaskDir;
    if (originalHome === undefined) delete process.env.HOME;
    else process.env.HOME = originalHome;
  });

  const current = (override = {}) => {
    expect(taskReconciliation.reconcileCurrentTaskCases,
      "current Task outer and per-target reader is missing").toBeTypeOf("function");
    return taskReconciliation.reconcileCurrentTaskCases({ task: state.task, workspace: state.workspace,
      capture, oracleEvidence: [], ...override });
  };

  it("ORACLE-P10-STRUCTURAL accepts the real fixed receipt after two JSON reads and rejects nested or old-tree mismatch", () => {
    const original = JSON.parse(state.task.readRecord(capture.receipt_ref));
    expect(original.behavior_fingerprint).toBeTruthy();
    const copied = JSON.parse(state.task.readRecord(capture.receipt_ref));
    expect(copied.behavior_fingerprint).not.toBe(original.behavior_fingerprint);
    const fields = ["command", "command_hash", "snapshot_head", "snapshot_tree", "snapshot_commit",
      "started_at", "completed_at", "output_ref", "output_hash", "runtime_profile",
      "runtime_profile_status", "runtime_profile_authenticated", "capability_proof",
      "behavior_fingerprint", "behavior_fingerprint_status"];
    const facts = Object.fromEntries(fields.filter((key) => Object.hasOwn(copied, key))
      .map((key) => [key, copied[key]]));
    Object.assign(facts, { status: "passed", receipt_ref: capture.receipt_ref,
      receipt_hash: capture.receipt_hash });
    const ctx = { stage: "build-code", task: state.task, identity: state.task.identity,
      manifest: state.task.manifest };
    const checked = (tests) => verifyOfficialEvidence(ctx, {
      facts: { tests }, evidence_refs: [{ ref: capture.receipt_ref, sha256: capture.receipt_hash }],
    });
    expect(() => checked(facts)).not.toThrow();
    const wrongRun = structuredClone(facts);
    wrongRun.behavior_fingerprint.run_id = `wrong-${randomUUID()}`;
    expect(() => checked(wrongRun)).toThrow(/facts\.behavior_fingerprint are not bound/);
    const wrongCatalog = structuredClone(facts);
    wrongCatalog.behavior_fingerprint.catalog_sha256 = "0".repeat(64);
    expect(() => checked(wrongCatalog)).toThrow(/facts\.behavior_fingerprint are not bound/);
    const oldTree = git(state.workspace.worktreeRoot, "rev-parse", `${state.workspace.baselineCommit}^{tree}`);
    expect(oldTree).not.toBe(original.snapshot_tree);
    expect(() => checked({ ...facts, snapshot_tree: oldTree })).toThrow(/provenance is invalid/);
  });

  it("ORACLE-P10-OFFICIAL-FIXED lets official run authenticate the real fixed receipt and retains AC unknown", async () => {
    const implementation = writeCurrentImplementationReceipt({ task: state.task, workspace: state.workspace });
    const kernel = createTaskKernel(state.task, { workspace: state.workspace });
    const context = { stage: "build-code", task: state.task, kernel, identity: state.task.identity,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-code"), manifest: state.task.manifest,
      candidateWorkspace: state.workspace, artifacts: ArtifactDir.open(state.workspace.worktreeRoot, state.task) };
    const result = await runOfficialStage("build-code", context, {
      receipts: { implementation: implementation.ref, tests: capture.receipt_ref } });
    const testFacts = result.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref)))
      .filter((fact) => fact.kind === "test" && fact.subject === "risk_tests_fresh");
    expect(testFacts).toEqual([expect.objectContaining({ status: "passed",
      evidence: [expect.objectContaining({ ref: capture.receipt_ref, sha256: capture.receipt_hash })] })]);
    expect(result).not.toHaveProperty("p10_consumption_evidence");
    expect(result.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref)))
      .filter((fact) => fact.kind === "acceptance_criterion" && fact.subject === "AC-26")
      .every((fact) => fact.status !== "passed")).toBe(true);
  }, 90_000);

  it("keeps the three current CARD-04 case leaf partitions and effect limits explicit", () => {
    const catalog = JSON.parse(readFileSync("docs/quality/business-case-catalog.json", "utf8"));
    const registry = JSON.parse(readFileSync("docs/quality/test-asset-registry.json", "utf8"));
    expect(catalog.cases.map((item) => item.execution.registered_test_ids.length)).toEqual([6, 28, 15]);
    for (const item of catalog.cases) {
      const target = registry.targets.find((entry) => entry.path === item.execution.target);
      expect(target?.registered_test_ids).toEqual(item.execution.registered_test_ids);
      expect(item.ac_ids).toEqual([item.id === "CARD04-DECISION-LOG-CENSUS" ? "AC-26" : "AC-27"]);
      expect(item.effect_observation.observation_status).toBe("not_yet_observed");
    }
    expect(catalog.cases[1].effect_observation.producer_status).toBe("not_implemented");
  });

  it("reads all bound reporter leaves, then keeps the missing business effect unknown", () => {
    const result = current();
    expect(result).toMatchObject({ status: "unavailable", reason: "current_execution_unverified",
      execution_freshness: "unknown", business_effect_reason: "missing_current_business_effect",
      task_id: state.task.identity.taskId,
      entries: [{ case_id: state.entry.id, acceptance_criterion_id: "AC-26",
        status: "readback", leaf_count: 2 }] });
    expect(result.entries[0].full_ids).toEqual(state.ids);
    expect(result.entries.some((entry) => entry.status === "passed")).toBe(false);
  });

  it("rejects a changed outer receipt hash", () => {
    expect(current({ capture: { ...capture, receipt_hash: "0".repeat(64) } }))
      .toMatchObject({ status: "unavailable", reason: "invalid_test_receipt", entries: [] });
  });

  it("does not turn an older matching receipt into a new run through a caller dispatch claim", () => {
    const oldReceipt = structuredClone(capture);
    oldReceipt.dispatch_state = "executed";
    oldReceipt.targeted_capture.status = "executed";
    const result = current({ capture: oldReceipt });
    expect(result).toMatchObject({ status: "unavailable", reason: "current_execution_unverified",
      execution_freshness: "unknown", business_effect_reason: "missing_current_business_effect" });
    expect(result.entries).toHaveLength(1);
    expect(result.entries.every((entry) => entry.status === "readback")).toBe(true);
  });

  it("counts one target reporter once when one case maps to two accepted ACs", async () => {
    const other = taskCaseFixture(["AC-26", "AC-27"]);
    try {
      const { FIXED_TARGETED_CAPTURE_COMMAND } = await import("../../workflows/build-code/capture.mjs");
      const result = await runCapture(FIXED_TARGETED_CAPTURE_COMMAND, "quality/tests/current-two-ac.json", {
        task: other.task, workspace: other.workspace,
      });
      expect(result.targeted_capture?.status).toBe("executed");
      const readback = current({ task: other.task, workspace: other.workspace, capture: result });
      expect(readback).toMatchObject({ status: "unavailable", reason: "current_execution_unverified",
        execution_freshness: "unknown", entries: [
          { acceptance_criterion_id: "AC-26", status: "readback", leaf_count: 2 },
          { acceptance_criterion_id: "AC-27", status: "readback", leaf_count: 2 },
        ] });
      expect(readback.entries.map((entry) => entry.report_ref)).toEqual([
        result.targeted_capture.reports[0].raw_ref, result.targeted_capture.reports[0].raw_ref,
      ]);
      rmSync(join(other.task.taskPath, result.targeted_capture.reports[0].raw_ref));
      expect(current({ task: other.task, workspace: other.workspace, capture: result }))
        .toMatchObject({ status: "unavailable", reason: "missing_target_report", entries: [] });
    } finally { rmSync(other.root, { recursive: true, force: true }); }
  });

  it("rejects a selected second case with no AC even when the first case has a valid AC", async () => {
    const other = taskCaseFixture("AC-26", { secondCaseMissingAc: true });
    try {
      const { FIXED_TARGETED_CAPTURE_COMMAND } = await import("../../workflows/build-code/capture.mjs");
      const result = await runCapture(FIXED_TARGETED_CAPTURE_COMMAND, "quality/tests/current-second-missing-ac.json", {
        task: other.task, workspace: other.workspace,
      });
      expect(result.targeted_capture?.status).toBe("executed");
      expect(current({ task: other.task, workspace: other.workspace, capture: result }))
        .toMatchObject({ status: "unavailable", reason: "catalog_case_mismatch", entries: [] });
    } finally { rmSync(other.root, { recursive: true, force: true }); }
  });

  it.each([
    ["duplicate", ["AC-26", "AC-26"], null],
    ["outside current spec", ["AC-27"], ["AC-26"]],
  ])("rejects %s case AC IDs before producing partial readback", async (_label, caseAcIds, specAcceptanceIds) => {
    const other = taskCaseFixture(caseAcIds, { specAcceptanceIds });
    try {
      const { FIXED_TARGETED_CAPTURE_COMMAND } = await import("../../workflows/build-code/capture.mjs");
      const result = await runCapture(FIXED_TARGETED_CAPTURE_COMMAND, `quality/tests/current-invalid-ac-${_label.replaceAll(" ", "-")}.json`, {
        task: other.task, workspace: other.workspace,
      });
      expect(result.targeted_capture?.status).toBe("executed");
      expect(current({ task: other.task, workspace: other.workspace, capture: result }))
        .toMatchObject({ status: "unavailable", reason: "catalog_case_mismatch", entries: [] });
    } finally { rmSync(other.root, { recursive: true, force: true }); }
  });

  it("rejects a caller-edited material, case, or source snapshot binding", () => {
    expect(current({ capture: { ...capture, snapshot_tree: "0".repeat(40) } }))
      .toMatchObject({ status: "unavailable", reason: "snapshot_mismatch", entries: [] });
    expect(current({ capture: { ...capture, targeted_capture: { ...capture.targeted_capture,
      material_revision: `revision-${"0".repeat(64)}` } } }))
      .toMatchObject({ status: "unavailable", reason: "material_revision_mismatch", entries: [] });
    expect(current({ capture: { ...capture, targeted_capture: { ...capture.targeted_capture,
      selected_case_ids: ["FORGED-CASE"] } } }))
      .toMatchObject({ status: "unavailable", reason: "catalog_case_mismatch", entries: [] });
  });

  it("rejects a missing per-target raw record instead of trusting the outer pass", async () => {
    const other = taskCaseFixture();
    try {
      const { FIXED_TARGETED_CAPTURE_COMMAND } = await import("../../workflows/build-code/capture.mjs");
      const result = await runCapture(FIXED_TARGETED_CAPTURE_COMMAND, "quality/tests/current-missing-target.json", {
        task: other.task, workspace: other.workspace,
      });
      expect(result.targeted_capture?.status, JSON.stringify(result.targeted_capture)).toBe("executed");
      const rawRef = result.targeted_capture.reports[0].raw_ref;
      rmSync(join(other.task.taskPath, rawRef)); // Only this isolated fixture is damaged.
      expect(current({ task: other.task, workspace: other.workspace, capture: result }))
        .toMatchObject({ status: "unavailable", reason: "missing_target_report", entries: [] });
    } finally { rmSync(other.root, { recursive: true, force: true }); }
  });

  it("does not treat a forged current fact ref as a business effect", () => {
    const result = current({ oracleEvidence: [{ case_id: state.entry.id,
      ac_id: "AC-26", quality_fact_ref: `quality/facts/${"a".repeat(64)}.json`,
      quality_fact_sha256: "a".repeat(64) }] });
    expect(result).toMatchObject({ status: "unavailable", reason: "current_execution_unverified",
      business_effect_reason: "missing_current_business_effect" });
    expect(result.entries.some((entry) => entry.status === "passed")).toBe(false);
  });

  it("keeps AC-27 helper capability unknown while the production writer is absent", async () => {
    const other = taskCaseFixture("AC-27");
    try {
      const { FIXED_TARGETED_CAPTURE_COMMAND } = await import("../../workflows/build-code/capture.mjs");
      const result = await runCapture(FIXED_TARGETED_CAPTURE_COMMAND, "quality/tests/current-ac27.json", {
        task: other.task, workspace: other.workspace,
      });
      expect(current({ task: other.task, workspace: other.workspace, capture: result,
        oracleEvidence: [{ case_id: other.entry.id, ac_id: "AC-27",
          quality_fact_ref: `quality/facts/${"b".repeat(64)}.json`, quality_fact_sha256: "b".repeat(64) }] }))
        .toMatchObject({ status: "unavailable", reason: "current_execution_unverified",
          business_effect_reason: "producer_unavailable" });
    } finally { rmSync(other.root, { recursive: true, force: true }); }
  });
});

describe("ORACLE-P10-CURRENT-EFFECT: independently read current Task evidence", () => {
  const originalHome = process.env.HOME, originalTaskDir = process.env.WORKFLOWHUB_TASK_DIR;
  afterAll(() => {
    if (originalTaskDir === undefined) delete process.env.WORKFLOWHUB_TASK_DIR;
    else process.env.WORKFLOWHUB_TASK_DIR = originalTaskDir;
    if (originalHome === undefined) delete process.env.HOME;
    else process.env.HOME = originalHome;
  });
  async function runCase(ac, options) {
    const state = taskCaseFixture(ac, options);
    const capture = await runCapture((await import("../../workflows/build-code/capture.mjs")).FIXED_TARGETED_CAPTURE_COMMAND,
      `quality/tests/effect-${randomUUID()}.json`, { task: state.task, workspace: state.workspace });
    expect(capture.targeted_capture.status).toBe("executed");
    return { state, capture, read: () => taskReconciliation.reconcileCurrentTaskCases({
      task: state.task, workspace: state.workspace, capture }) };
  }

  it("keeps a valid census evidence chain unknown without the official stage binding", async () => {
    const { state, capture, read } = await runCase("AC-26", {
      caseId: "CARD04-DECISION-LOG-CENSUS", decisionText: censusDecision });
    try {
      publishCurrentAcceptance(state, capture);
      expect(read()).toMatchObject({ status: "unavailable", reason: "current_execution_unverified",
        execution_freshness: "unknown", business_effect_status: "unknown",
        business_effect_reason: "missing_official_stage_binding", evidence_chain_present: true,
        entries: [{ case_id: state.entry.id, evidence_chain_present: true }] });
    } finally { rmSync(state.root, { recursive: true, force: true }); }
  });

  it.each([
    ["zero source denominator", censusDecision.replaceAll(/^>.+$/gm, "Source without quote.")
      .replace("| V-001 | 用户 | session | Fourth independent user statement. |", "| V-001 | 助手 | session | Assistant text. |")],
    ["missing requirement link", censusDecision.replace("| R-008 | V-001 | D-001 |", "")],
    ["missing source section", censusDecision.replace("## 逐字声明层（verbatim）", "## Other")],
    ["too few U sources", censusDecision.replace("### U-003\n> Third original requirement.\n\n", "")],
    ["missing user V source", censusDecision.replace("| V-001 | 用户 |", "| V-001 | 助手 |")],
    ["unindexed atom", censusDecision.replace("U-001-05 | D-001", "U-001-04 | D-001")],
    ["R cites absent source", censusDecision.replace("| R-004 | U-001-04 | D-001 |", "| R-004 | U-999 | D-001 |")],
  ])("rejects %s despite a passing reporter and a passed fact", async (_label, decisionText) => {
    const { state, capture, read } = await runCase("AC-26", {
      caseId: "CARD04-DECISION-LOG-CENSUS", decisionText });
    try {
      publishCurrentAcceptance(state, capture);
      expect(read()).toMatchObject({ status: "unavailable", business_effect_status: "unknown",
        business_effect_reason: "business_effect_mismatch" });
    } finally { rmSync(state.root, { recursive: true, force: true }); }
  });

  it("rejects a current fact that binds a different test receipt", async () => {
    const { state, capture, read } = await runCase("AC-26", {
      caseId: "CARD04-DECISION-LOG-CENSUS", decisionText: censusDecision });
    try {
      publishCurrentAcceptance(state, capture, { receiptHash: "0".repeat(64) });
      expect(read()).toMatchObject({ status: "unavailable", business_effect_status: "unknown",
        business_effect_reason: "current_effect_receipt_mismatch" });
    } finally { rmSync(state.root, { recursive: true, force: true }); }
  });

  it("accepts several official coverage refs when exactly one binds this test receipt", async () => {
    const { state, capture, read } = await runCase("AC-26", {
      caseId: "CARD04-DECISION-LOG-CENSUS", decisionText: censusDecision });
    try {
      publishCurrentAcceptance(state, capture, { additionalEvidenceRefs: [
        { ref: capture.output_ref, sha256: capture.output_hash }] });
      expect(read()).toMatchObject({ status: "unavailable", business_effect_status: "unknown",
        business_effect_reason: "missing_official_stage_binding", evidence_chain_present: true });
    } finally { rmSync(state.root, { recursive: true, force: true }); }
  });

  it("rejects a duplicate receipt ref with a conflicting hash", async () => {
    const { state, capture, read } = await runCase("AC-26", {
      caseId: "CARD04-DECISION-LOG-CENSUS", decisionText: censusDecision });
    try {
      publishCurrentAcceptance(state, capture, { additionalEvidenceRefs: [
        { ref: capture.receipt_ref, sha256: "0".repeat(64) }] });
      expect(read()).toMatchObject({ status: "unavailable", business_effect_status: "unknown",
        business_effect_reason: "current_effect_receipt_mismatch" });
    } finally { rmSync(state.root, { recursive: true, force: true }); }
  });

  it.each([
    ["task", { nestedTaskId: "foreign-task" }],
    ["snapshot", { nestedTree: "0".repeat(40) }],
    ["material", { nestedRevision: `revision-${"0".repeat(64)}` }],
  ])("rejects a nested %s mismatch in the canonical chain", async (_label, options) => {
    const { state, capture, read } = await runCase("AC-26", {
      caseId: "CARD04-DECISION-LOG-CENSUS", decisionText: censusDecision });
    try {
      publishCurrentAcceptance(state, capture, options);
      expect(read()).toMatchObject({ status: "unavailable", business_effect_status: "unknown",
        business_effect_reason: "invalid_business_effect_binding" });
    } finally { rmSync(state.root, { recursive: true, force: true }); }
  });

  it("rejects a damaged current acceptance wrapper hash", async () => {
    const { state, capture, read } = await runCase("AC-26", {
      caseId: "CARD04-DECISION-LOG-CENSUS", decisionText: censusDecision });
    try {
      const fact = publishCurrentAcceptance(state, capture);
      const value = JSON.parse(state.task.readRecord(fact.ref));
      const wrapper = value.evidence[0].ref;
      writeFileSync(join(state.task.taskPath, wrapper), "{\"damaged\":true}\n"); // Isolated Task fixture only.
      expect(read()).toMatchObject({ status: "unavailable", business_effect_status: "unknown",
        business_effect_reason: "invalid_business_effect_binding" });
    } finally { rmSync(state.root, { recursive: true, force: true }); }
  });

  it("does not reuse a genuine older test receipt as this run's effect", async () => {
    const { state, capture } = await runCase("AC-26", {
      caseId: "CARD04-DECISION-LOG-CENSUS", decisionText: censusDecision });
    try {
      publishCurrentAcceptance(state, capture);
      const newer = await runCapture((await import("../../workflows/build-code/capture.mjs")).FIXED_TARGETED_CAPTURE_COMMAND,
        `quality/tests/effect-newer-${randomUUID()}.json`, { task: state.task, workspace: state.workspace });
      expect(newer.targeted_capture.status).toBe("executed");
      expect(taskReconciliation.reconcileCurrentTaskCases({ task: state.task, workspace: state.workspace,
        capture: newer })).toMatchObject({ status: "unavailable", business_effect_status: "unknown",
        business_effect_reason: "current_effect_receipt_mismatch" });
    } finally { rmSync(state.root, { recursive: true, force: true }); }
  });

  it("keeps a valid deferred evidence chain unknown without the official stage binding", async () => {
    const { state, capture, read } = await runCase("AC-27", {
      caseId: "CARD04-DEFERRED-ACCEPTANCE-REGRESSION" });
    try {
      publishCurrentAcceptance(state, capture, { result: "deferred", status: "missing" });
      expect(read()).toMatchObject({ status: "unavailable", business_effect_status: "unknown",
        business_effect_reason: "missing_official_stage_binding", evidence_chain_present: true,
        entries: [{ case_id: state.entry.id, evidence_chain_present: true }] });
    } finally { rmSync(state.root, { recursive: true, force: true }); }
  });

  it("rejects a falsely passed deferred subject", async () => {
    const { state, capture, read } = await runCase("AC-27", {
      caseId: "CARD04-DEFERRED-ACCEPTANCE-REGRESSION" });
    try {
      publishCurrentAcceptance(state, capture, { result: "pass", status: "passed" });
      expect(read()).toMatchObject({ status: "unavailable", business_effect_status: "unknown",
        business_effect_reason: "business_effect_mismatch" });
    } finally { rmSync(state.root, { recursive: true, force: true }); }
  });

  const actualDecision = readFileSync("specs/workflowhub-thin-core-card-04-20260919/decision-log.md", "utf8");
  it.each([
    ["real current source", actualDecision, true],
    ["forged derived source", actualDecision.replace("母 PRD CARD-04 :322-352（派生，非 U/V）", "随便写的来源（派生，非 U/V）"), false],
    ["same message ID with rewritten derived meaning", actualDecision.replace(
      "m02966 结构化用例库答复（已有 R 记录，非本节逐字 U/V）",
      "m02966 结构化任意改写答复（已有 R 记录，非本节逐字 U/V）"), false],
    ["same message ID with rewritten original source field", actualDecision.replace(
      "| 结构化答复 m02966 |", "| 伪造来源 m02966 |"), false],
    ["duplicate historical R ID before the genuine row", actualDecision.replace(
      "| R-011 |", "| R-011 | 伪历史来源 | fake | D-010 |\n| R-011 |"), false],
    ["duplicate historical R ID with no cell padding", actualDecision.replace(
      "| R-011 |", "|R-011| 伪历史来源 | fake | D-010 |\n| R-011 |"), false],
    ["duplicate historical R ID with extra cell padding", actualDecision.replace(
      "| R-011 |", "|  R-011  | 伪历史来源 | fake | D-010 |\n| R-011 |"), false],
    ["missing indexed atom", actualDecision.replace("U-006、U-006-01~06", "U-006"), false],
    ["broken direct source link", actualDecision.replace("| R-004 | U-001", "| R-004 | U-999"), false],
  ])("independently classifies %s while keeping the real Task effect unknown", async (_name, decisionText, sourceStructureValid) => {
    const { state, capture, read } = await runCase("AC-26", {
      caseId: "CARD04-DECISION-LOG-CENSUS", decisionText });
    try {
      publishCurrentAcceptance(state, capture);
      expect(read()).toMatchObject({ status: "unavailable", business_effect_status: "unknown",
        source_structure_valid: sourceStructureValid, evidence_chain_present: false,
        business_effect_reason: sourceStructureValid ? "external_original_unavailable" : "business_effect_mismatch" });
    } finally { rmSync(state.root, { recursive: true, force: true }); }
  });
});
