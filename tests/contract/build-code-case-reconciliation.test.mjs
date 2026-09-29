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
import * as freshness from "../../runtime/evidence/freshness.mjs";

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

function publishConsumptionFixture(state, capture, qualityFacts, stageRow, override = {}) {
  const kernel = createTaskKernel(state.task, { workspace: state.workspace });
  const value = { schema_version: "workflowhub-p10-run-consumption.v1",
    task_id: state.task.identity.taskId, stage: "build-code",
    snapshot_tree: capture.snapshot_tree,
    material_revision: kernel.currentVNextMaterialRevision(), source_digest: capture.source_digest,
    test_receipt: { ref: capture.receipt_ref, sha256: capture.receipt_hash },
    test_output: { ref: capture.output_ref, sha256: capture.output_hash },
    stage_row: { ref: stageRow.ref, sha256: stageRow.sha256 }, quality_facts: qualityFacts,
    ...override };
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const ref = `quality/evidence/stage-quality/build-code/p10-consumption-${sha256(raw)}.json`;
  return { ...kernel.publishCanonicalRecord(ref, raw), value };
}

describe("ORACLE-P10-T021: explicit current run consumption source", () => {
  it("reader move: authenticates the exact locator and facts through the single runtime reader", async () => {
    const state = taskCaseFixture("AC-26", { caseId: "CARD04-DECISION-LOG-CENSUS", decisionText: censusDecision });
    try {
      const exclude = join(state.root, "p10-consumption-git-excludes");
      writeFileSync(exclude, "node_modules\n");
      git(state.workspace.worktreeRoot, "config", "core.excludesfile", exclude);
      const kernel = createTaskKernel(state.task, { workspace: state.workspace });
      const context = { stage: "build-code", task: state.task, kernel, identity: state.task.identity,
        workflowRunId: kernel.deriveStageWorkflowRunId("build-code"), manifest: state.task.manifest,
        candidateWorkspace: state.workspace, artifacts: ArtifactDir.open(state.workspace.worktreeRoot, state.task) };
      const first = await runOfficialStage("build-code", context, {});
      writeStageRow(state.task.taskPath, { ...first.stage_reflection.stage_row_write.value,
        phase_progress: { phase_id: "P10", task_id: "T021", material_revision: kernel.currentVNextMaterialRevision(),
          recorded_at: new Date().toISOString() } });
      const { FIXED_TARGETED_CAPTURE_COMMAND } = await import("../../workflows/build-code/capture.mjs");
      const capture = await runCapture(FIXED_TARGETED_CAPTURE_COMMAND,
        `quality/tests/p10-consumption-${randomUUID()}.json`, { task: state.task, workspace: state.workspace });
      const implementation = writeCurrentImplementationReceipt({ task: state.task, workspace: state.workspace });
      const run = await runOfficialStage("build-code", context, {
        receipts: { implementation: implementation.ref, tests: capture.receipt_ref } });
      const row = run.stage_reflection.stage_row_write;
      const testFacts = run.quality_fact_refs.map((ref) => ({ ref, raw: state.task.readRecord(ref) }))
        .filter(({ raw }) => { const fact = JSON.parse(raw); return fact.kind === "test"
          && fact.subject === "risk_tests_fresh" && fact.evidence.some((evidence) =>
            evidence.ref === capture.receipt_ref && evidence.sha256 === capture.receipt_hash); });
      expect(testFacts).toHaveLength(1);
      const acFact = publishCurrentAcceptance(state, capture);
      const facts = [{ ref: testFacts[0].ref, sha256: sha256(testFacts[0].raw) }, acFact];
      const source = publishConsumptionFixture(state, capture, facts, row);
      expect(freshness.authenticateP10RunConsumption).toBeTypeOf("function");
      const direct = (locator, acIds = new Set(["AC-26"])) =>
        freshness.authenticateP10RunConsumption({ task: state.task, locator,
          taskId: state.task.identity.taskId, snapshotTree: capture.snapshot_tree,
          materialRevision: kernel.currentVNextMaterialRevision(), sourceDigest: capture.source_digest,
          capture, receipt: { output_ref: capture.output_ref, output_hash: capture.output_hash },
          acceptedAcIds: acIds });
      expect(direct({ ref: source.ref, sha256: source.sha256 })?.byAc.get("AC-26"))
        .toEqual(acFact);
      expect(direct({ ref: source.ref, sha256: "0".repeat(64) })).toBeNull();
      expect(direct({ ref: source.ref, sha256: source.sha256 }, new Set(["AC-27"]))).toBeNull();
      const incomplete = '{"schema_version":"workflowhub-p10-run-consumption.v1",';
      const incompleteHash = sha256(incomplete);
      const incompleteRef = `quality/evidence/stage-quality/build-code/p10-consumption-${incompleteHash}.json`;
      kernel.publishCanonicalRecord(incompleteRef, incomplete);
      expect(direct({ ref: incompleteRef, sha256: incompleteHash })).toBeNull();
      const read = (locator, usedCapture = capture) => taskReconciliation.reconcileCurrentTaskCases({
        task: state.task, workspace: state.workspace, capture: usedCapture,
        consumptionEvidence: locator });
      expect(read({ ref: source.ref, sha256: source.sha256 })).toMatchObject({
        status: "unavailable", reason: "business_effect_unverified",
        run_consumption_status: "verified", business_effect_status: "unknown",
        business_effect_reason: "independent_business_effect_unverified" });
      for (const invalid of [
        { ref: source.ref, sha256: "0".repeat(64) },
        publishConsumptionFixture(state, capture, facts.slice(0, 1), row),
        publishConsumptionFixture(state, capture,
          [facts[0], { ...facts[1], sha256: "0".repeat(64) }], row),
        publishConsumptionFixture(state, capture, facts, row, { test_receipt: {
          ref: capture.receipt_ref, sha256: "0".repeat(64) } }),
      ]) {
        expect(read({ ref: invalid.ref, sha256: invalid.sha256 })).toMatchObject({
          status: "unavailable", reason: "current_execution_unverified",
          business_effect_status: "unknown" });
      }
      const newer = await runCapture(FIXED_TARGETED_CAPTURE_COMMAND,
        `quality/tests/p10-consumption-other-${randomUUID()}.json`, { task: state.task, workspace: state.workspace });
      expect(read({ ref: source.ref, sha256: source.sha256 }, newer)).toMatchObject({
        status: "unavailable", reason: "current_execution_unverified",
        business_effect_status: "unknown" });
      const otherRunFact = publishCurrentAcceptance(state, newer);
      const otherRunSource = publishConsumptionFixture(state, capture,
        [facts[0], otherRunFact], row);
      expect(read({ ref: source.ref, sha256: source.sha256 })).toMatchObject({
        run_consumption_status: "verified", business_effect_status: "unknown" });
      expect(read({ ref: otherRunSource.ref, sha256: otherRunSource.sha256 })).toMatchObject({
        status: "unavailable", reason: "current_execution_unverified",
        business_effect_status: "unknown" });
      writeStageRow(state.task.taskPath, { ...row.value, phase_progress: {
        ...row.value.phase_progress, recorded_at: "2026-09-28T00:00:00.000Z" } });
      expect(direct({ ref: source.ref, sha256: source.sha256 })).toBeNull();
      expect(read({ ref: source.ref, sha256: source.sha256 })).toMatchObject({
        status: "unavailable", reason: "current_execution_unverified",
        business_effect_status: "unknown" });
    } finally { rmSync(state.root, { recursive: true, force: true }); }
  }, 90_000);
});

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
    const priorHome = process.env.HOME, priorTaskDir = process.env.WORKFLOWHUB_TASK_DIR;
    const official = taskCaseFixture();
    try {
      const exclude = join(official.root, "p10-official-git-excludes");
      writeFileSync(exclude, "node_modules\n");
      git(official.workspace.worktreeRoot, "config", "core.excludesfile", exclude);
      const { FIXED_TARGETED_CAPTURE_COMMAND } = await import("../../workflows/build-code/capture.mjs");
      const officialCapture = await runCapture(FIXED_TARGETED_CAPTURE_COMMAND,
        "quality/tests/current-case-official-fixed.json", { task: official.task, workspace: official.workspace });
      expect(officialCapture.targeted_capture.status).toBe("executed");
      const implementation = writeCurrentImplementationReceipt({ task: official.task, workspace: official.workspace });
      const kernel = createTaskKernel(official.task, { workspace: official.workspace });
      const context = { stage: "build-code", task: official.task, kernel, identity: official.task.identity,
        workflowRunId: kernel.deriveStageWorkflowRunId("build-code"), manifest: official.task.manifest,
        candidateWorkspace: official.workspace, artifacts: ArtifactDir.open(official.workspace.worktreeRoot, official.task) };
      const result = await runOfficialStage("build-code", context, {
        receipts: { implementation: implementation.ref, tests: officialCapture.receipt_ref } });
      const testFacts = result.quality_fact_refs.map((ref) => JSON.parse(official.task.readRecord(ref)))
        .filter((fact) => fact.kind === "test" && fact.subject === "risk_tests_fresh");
      expect(testFacts).toEqual([expect.objectContaining({ status: "passed",
        evidence: [expect.objectContaining({ ref: officialCapture.receipt_ref,
          sha256: officialCapture.receipt_hash })] })]);
      expect(result).not.toHaveProperty("p10_consumption_evidence");
      expect(result.quality_fact_refs.map((ref) => JSON.parse(official.task.readRecord(ref)))
        .filter((fact) => fact.kind === "acceptance_criterion" && fact.subject === "AC-26")
        .every((fact) => fact.status !== "passed")).toBe(true);
    } finally {
      rmSync(official.root, { recursive: true, force: true });
      if (priorTaskDir === undefined) delete process.env.WORKFLOWHUB_TASK_DIR;
      else process.env.WORKFLOWHUB_TASK_DIR = priorTaskDir;
      if (priorHome === undefined) delete process.env.HOME;
      else process.env.HOME = priorHome;
    }
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

// Append-only P10 independent-observation contract. These temporary Git/runner
// fixtures prove this reader's mechanism; they are not CARD04 business results.
describe("ORACLE-P10-A1-A2-INDEPENDENT-OBSERVATION", () => {
  let state, capture;
  const originalHome = process.env.HOME, originalTaskDir = process.env.WORKFLOWHUB_TASK_DIR;
  const a1 = "CARD04-AUTHENTICATED-TASK-CHANGE-SCOPE";
  const a2 = "CARD04-INDEPENDENT-TEST-INVENTORY";
  const expectedPaths = ["committed-clean.mjs", "docs/quality/business-case-catalog.json",
    "docs/quality/test-asset-registry.json", "product.mjs", "replacement.mjs",
    "staged-production.mjs", "tests/contract/current-case.test.mjs",
    "tests/contract/inventory-case.test.mjs", "tests/contract/moved-case.test.mjs",
    "unmapped-production.mjs", "untracked-production.mjs"].sort();
  beforeAll(async () => {
    state = taskCaseFixture("AC-32", { caseId: a1, specAcceptanceIds: ["AC-32", "AC-30"] });
    const root = state.workspace.worktreeRoot;
    const exclude = join(state.root, "independent-observation-excludes");
    writeFileSync(exclude, "node_modules\n");
    git(root, "config", "core.excludesfile", exclude);
    const oldTarget = state.entry.execution.target, movedTarget = "tests/contract/moved-case.test.mjs";
    git(root, "mv", oldTarget, movedTarget);
    state.entry.execution.target = movedTarget;
    state.entry.execution.machine_command = `npx vitest run ${movedTarget} --reporter=json`;
    state.entry.execution.registered_test_ids = state.ids.map((id) => id.replace(oldTarget, movedTarget));
    state.entry.change_triggers = expectedPaths.filter((path) => path !== "unmapped-production.mjs");
    rmSync(join(root, "product.mjs"));
    writeFileSync(join(root, "replacement.mjs"), "export const effect = 'new';\n");
    writeFileSync(join(root, "committed-clean.mjs"), "export const committed = true;\n");
    git(root, "add", "committed-clean.mjs");
    git(root, "commit", "-qm", "real committed clean change and staged rename");
    writeFileSync(join(root, "staged-production.mjs"), "export const staged = true;\n");
    git(root, "add", "staged-production.mjs");
    writeFileSync(join(root, "untracked-production.mjs"), "export const untracked = true;\n");
    writeFileSync(join(root, "unmapped-production.mjs"), "export const unmapped = true;\n");
    const inventoryTarget = "tests/contract/inventory-case.test.mjs";
    const inventorySource = "import { it, expect } from 'vitest';\nimport { effect } from '../../replacement.mjs';\nit('reads the actual changed source value', () => expect(effect).toBe('new'));\nit('preserves the independently specified source value', () => expect(effect === 'old').toBe(false));\n";
    writeFileSync(join(root, inventoryTarget), inventorySource);
    const inventoryIds = [`${inventoryTarget} > reads the actual changed source value`,
      `${inventoryTarget} > preserves the independently specified source value`];
    const registryPath = join(root, "docs/quality/test-asset-registry.json");
    const registry = JSON.parse(readFileSync(registryPath));
    registry.targets[0] = { ...registry.targets[0], path: movedTarget,
      command: state.entry.execution.machine_command,
      registered_test_ids: state.entry.execution.registered_test_ids };
    registry.targets.push({ path: inventoryTarget, sha256: sha256(inventorySource), runner: "vitest",
      command: `npx vitest run ${inventoryTarget} --reporter=json`, owner: "fixture", status: "active",
      registered_test_ids: inventoryIds });
    writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
    const second = { ...JSON.parse(JSON.stringify(state.entry)), id: a2, ac_ids: ["AC-30"],
      execution: { target: inventoryTarget, machine_command: `npx vitest run ${inventoryTarget} --reporter=json`,
        registered_test_ids: inventoryIds, expected_test_identity: "actual inventory source", runner: "vitest" } };
    second.effect_observation.canonical_source.subject = "AC-30";
    const catalogPath = join(root, "docs/quality/business-case-catalog.json");
    const catalog = JSON.parse(readFileSync(catalogPath));
    catalog.cases = [state.entry, second];
    writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
    capture = await runCapture((await import("../../workflows/build-code/capture.mjs")).FIXED_TARGETED_CAPTURE_COMMAND,
      "quality/tests/independent-observation.json", { task: state.task, workspace: state.workspace });
    expect(capture.targeted_capture).toMatchObject({ status: "unavailable", reason: "unmapped_changed_path",
      selected_case_ids: [a1, a2], unmapped_changed_paths: ["unmapped-production.mjs"] });
  }, 90_000);
  afterAll(() => {
    if (state) rmSync(state.root, { recursive: true, force: true });
    if (originalHome === undefined) delete process.env.HOME; else process.env.HOME = originalHome;
    if (originalTaskDir === undefined) delete process.env.WORKFLOWHUB_TASK_DIR; else process.env.WORKFLOWHUB_TASK_DIR = originalTaskDir;
  });
  const read = (usedCapture = capture) => taskReconciliation.reconcileCurrentTaskCases({
    task: state.task, workspace: state.workspace, capture: usedCapture });
  const entry = (value, id) => value.entries.find((row) => row.case_id === id);
  it("independently observes all Git changes and both rename sides while retaining the unmapped path", () => {
    const value = read();
    expect(value).toMatchObject({ status: "unavailable", reason: "unmapped_changed_path",
      business_effect_status: "unknown", unmapped_changed_paths: ["unmapped-production.mjs"] });
    expect(entry(value, a1)).toMatchObject({ source_identity_status: "verified",
      rule_observation: { status: "observed", rule: "authenticated_task_change_scope",
        expected_changed_paths: expectedPaths, selected_case_ids: [a1, a2],
        returned_change_scope_binding: "unavailable" },
      quality_fact_binding: { status: "unknown", reason: "missing_current_business_effect" },
      business_effect_status: "unknown" });
    expect(entry(value, a1).rule_observation.expected_changes).toContainEqual({
      status: "R100", old_path: "tests/contract/current-case.test.mjs", path: "tests/contract/moved-case.test.mjs" });
    expect(entry(value, a1).rule_observation.expected_changes).toContainEqual({ status: "D", path: "product.mjs" });
  });
  it("reads actual source hashes and all runnable identities independently for the finite inventory", () => {
    const value = read(), row = entry(value, a2), target = "tests/contract/inventory-case.test.mjs";
    expect(row).toMatchObject({ source_identity_status: "verified",
      rule_observation: { status: "observed", rule: "independent_test_inventory", target,
        source_sha256: sha256(readFileSync(join(state.workspace.worktreeRoot, target))),
        full_ids: [`${target} > reads the actual changed source value`,
          `${target} > preserves the independently specified source value`],
        outside_scope: "unknown", registered_target_count: 2, not_run_targets: [] },
      quality_fact_binding: { status: "unknown" }, business_effect_status: "unknown" });
    expect(row.rule_observation.report_sha256).toBe(capture.targeted_capture.reports.find((r) => r.case_id === a2).raw_sha256);
  });
  it("discloses a bound AC original separately from each case rule without issuing a business pass", () => {
    const fact = publishCurrentAcceptance(state, capture);
    const value = read();
    expect(entry(value, a1)).toMatchObject({ quality_fact_binding: { status: "bound", ref: fact.ref,
      sha256: fact.sha256, receipt_ref: capture.receipt_ref }, rule_observation: { status: "observed" },
      business_effect_status: "unknown" });
    expect(entry(value, a2)).toMatchObject({ quality_fact_binding: { status: "unknown" },
      rule_observation: { status: "observed" }, business_effect_status: "unknown" });
    expect(value).not.toHaveProperty("run_consumption_status", "verified");
  });
  it("does not treat a clipped caller changeScope as the authenticated full Git scope", () => {
    const value = read({ ...capture, change_scope: { ...capture.change_scope, changed_paths: ["replacement.mjs"], changes: [] } });
    expect(entry(value, a1).rule_observation).toMatchObject({ status: "observed",
      expected_changed_paths: expectedPaths, returned_change_scope_binding: "unavailable" });
    expect(value).toMatchObject({ status: "unavailable", reason: "unmapped_changed_path",
      unmapped_changed_paths: ["unmapped-production.mjs"], business_effect_status: "unknown" });
  });
  it("rejects a shared-AC caller case attribution mismatch before any local observation", () => {
    const reports = capture.targeted_capture.reports.map((report, index) => index === 1 ? { ...report, case_id: a1 } : report);
    expect(read({ ...capture, targeted_capture: { ...capture.targeted_capture, reports } }))
      .toMatchObject({ status: "unavailable", reason: "invalid_targeted_manifest", entries: [] });
  });
  it("rejects caller argv changes even when every reporter previously passed", () => {
    const reports = capture.targeted_capture.reports.map((report, index) => index === 1 ? { ...report, argv: ["fake", report.target] } : report);
    expect(read({ ...capture, targeted_capture: { ...capture.targeted_capture, reports } }))
      .toMatchObject({ status: "unavailable", reason: "invalid_targeted_manifest", entries: [] });
  });
  it("rejects altered original reporter bytes without hiding the full-scope failure", () => {
    const report = capture.targeted_capture.reports.find((row) => row.case_id === a2);
    const path = join(state.task.taskPath, report.raw_ref), original = readFileSync(path);
    try {
      writeFileSync(path, original.toString().replace("reads the actual changed source value", "wrong leaf"));
      expect(read()).toMatchObject({ status: "unavailable", reason: "missing_target_report", entries: [] });
    } finally { writeFileSync(path, original); }
  });
});

// P10 producer target: real isolated Task and canonical fixed capture, never actual CARD04 proof.
describe("ORACLE-P10-T021: official same-call source producer", () => {
  it("publishes the actual final row and supplied fixed receipt, preserves old records on later run", async () => {
    const state = taskCaseFixture("AC-26", { caseId: "CARD04-DECISION-LOG-CENSUS", decisionText: censusDecision });
    try {
      const exclude = join(state.root, "p10-producer-excludes");
      writeFileSync(exclude, "node_modules\n");
      git(state.workspace.worktreeRoot, "config", "core.excludesfile", exclude);
      const kernel = createTaskKernel(state.task, { workspace: state.workspace });
      const context = { stage: "build-code", task: state.task, kernel, identity: state.task.identity,
        workflowRunId: kernel.deriveStageWorkflowRunId("build-code"), manifest: state.task.manifest,
        candidateWorkspace: state.workspace, artifacts: ArtifactDir.open(state.workspace.worktreeRoot, state.task) };
      const first = await runOfficialStage("build-code", context, {});
      expect(first).not.toHaveProperty("p10_consumption_evidence");
      writeStageRow(state.task.taskPath, { ...first.stage_reflection.stage_row_write.value,
        phase_progress: { phase_id: "P10", task_id: "T021", material_revision: kernel.currentVNextMaterialRevision(),
          recorded_at: new Date().toISOString() } });
      const { FIXED_TARGETED_CAPTURE_COMMAND } = await import("../../workflows/build-code/capture.mjs");
      const capture = await runCapture(FIXED_TARGETED_CAPTURE_COMMAND, "quality/tests/p10-producer-a.json",
        { task: state.task, workspace: state.workspace });
      expect(capture.targeted_capture.status).toBe("executed");
      const implementation = writeCurrentImplementationReceipt({ task: state.task, workspace: state.workspace });
      const run = await runOfficialStage("build-code", context, {
        receipts: { implementation: implementation.ref, tests: capture.receipt_ref } });
      const exactFacts = run.quality_fact_refs.map((ref) => ({ ref, raw: state.task.readRecord(ref) }));
      expect(exactFacts.filter(({ raw }) => { const f = JSON.parse(raw); return f.kind === "test"
        && f.subject === "risk_tests_fresh" && f.status === "passed"
        && f.evidence.some((e) => e.ref === capture.receipt_ref && e.sha256 === capture.receipt_hash); })).toHaveLength(1);
      expect(run.p10_consumption_evidence, "same-call official producer must publish the locator").toEqual({
        ref: expect.stringMatching(/^quality\/evidence\/stage-quality\/build-code\/p10-consumption-[a-f0-9]{64}\.json$/),
        sha256: expect.stringMatching(/^[a-f0-9]{64}$/) });
      const locator = run.p10_consumption_evidence;
      const sourceRaw = state.task.readRecord(locator.ref);
      expect(sha256(sourceRaw)).toBe(locator.sha256);
      const source = JSON.parse(sourceRaw);
      expect(source.stage_row).toEqual({ ref: run.stage_reflection.stage_row_write.ref,
        sha256: run.stage_reflection.stage_row_write.sha256 });
      expect(source.test_receipt).toEqual({ ref: capture.receipt_ref, sha256: capture.receipt_hash });
      expect(source.quality_facts.every((b) => exactFacts.some((f) => f.ref === b.ref && sha256(f.raw) === b.sha256))).toBe(true);
      const read = (value) => freshness.authenticateP10RunConsumption({ task: state.task, locator: value,
        taskId: state.task.identity.taskId, snapshotTree: capture.snapshot_tree,
        materialRevision: kernel.currentVNextMaterialRevision(), sourceDigest: capture.source_digest,
        capture, receipt: { output_ref: capture.output_ref, output_hash: capture.output_hash },
        acceptedAcIds: new Set(["AC-26"]) });
      expect(read(locator)?.byAc.has("AC-26")).toBe(true);
      expect(read({ ...locator, sha256: "0".repeat(64) })).toBeNull();
      const later = await runOfficialStage("build-code", context, {});
      expect(later).not.toHaveProperty("p10_consumption_evidence");
      expect(state.task.readRecord(locator.ref)).toBe(sourceRaw);
      expect(read(locator)).toBeNull();
    } finally { rmSync(state.root, { recursive: true, force: true }); }
  }, 90_000);
});


// Actual isolated partial execution; never a fixture claim about CARD04's 201 real paths.
describe("ORACLE-P10-T021: partial same-call source producer", () => {
  it("publishes the authenticated partial receipt source while preserving every unmapped path and unknown business result", async () => {
    const state = taskCaseFixture("AC-26", { caseId: "CARD04-DECISION-LOG-CENSUS", decisionText: censusDecision });
    try {
      const exclude = join(state.root, "partial-producer-excludes");
      writeFileSync(exclude, "node_modules\n");
      git(state.workspace.worktreeRoot, "config", "core.excludesfile", exclude);
      writeFileSync(join(state.workspace.worktreeRoot, "unmapped-first.mjs"), "export const first = true;\n");
      writeFileSync(join(state.workspace.worktreeRoot, "unmapped-second.mjs"), "export const second = true;\n");
      const kernel = createTaskKernel(state.task, { workspace: state.workspace });
      const context = { stage: "build-code", task: state.task, kernel, identity: state.task.identity,
        workflowRunId: kernel.deriveStageWorkflowRunId("build-code"), manifest: state.task.manifest,
        candidateWorkspace: state.workspace, artifacts: ArtifactDir.open(state.workspace.worktreeRoot, state.task) };
      const first = await runOfficialStage("build-code", context, {});
      writeStageRow(state.task.taskPath, { ...first.stage_reflection.stage_row_write.value,
        phase_progress: { phase_id: "P10", task_id: "T021", material_revision: kernel.currentVNextMaterialRevision(),
          recorded_at: new Date().toISOString() } });
      const { FIXED_TARGETED_CAPTURE_COMMAND } = await import("../../workflows/build-code/capture.mjs");
      const capture = await runCapture(FIXED_TARGETED_CAPTURE_COMMAND, "quality/tests/p10-partial-producer.json",
        { task: state.task, workspace: state.workspace });
      expect(capture.exit_code).toBe(0);
      expect(capture.targeted_capture).toMatchObject({ status: "unavailable", reason: "unmapped_changed_path",
        unmapped_changed_paths: ["unmapped-first.mjs", "unmapped-second.mjs"], business_effect_status: "unknown" });
      const implementation = writeCurrentImplementationReceipt({ task: state.task, workspace: state.workspace });
      const run = await runOfficialStage("build-code", context, {
        receipts: { implementation: implementation.ref, tests: capture.receipt_ref } });
      expect(run.stage_reflection).toMatchObject({ status: "unavailable", availability: { value: { reason_code: "executor_absent" } } });
      expect(run.stage_reflection.stage_row_write?.ref).toMatch(/^facts\.jsonl#\d+$/);
      expect(run.p10_consumption_evidence, "a fully authenticated partial receipt must have an explicit source locator").toEqual({
        ref: expect.stringMatching(/^quality\/evidence\/stage-quality\/build-code\/p10-consumption-[a-f0-9]{64}\.json$/),
        sha256: expect.stringMatching(/^[a-f0-9]{64}$/) });
      const source = JSON.parse(state.task.readRecord(run.p10_consumption_evidence.ref));
      expect(source.test_receipt).toEqual({ ref: capture.receipt_ref, sha256: capture.receipt_hash });
      expect(source.stage_row).toEqual({ ref: run.stage_reflection.stage_row_write.ref,
        sha256: run.stage_reflection.stage_row_write.sha256 });
      expect(freshness.authenticateP10RunConsumption({ task: state.task, locator: run.p10_consumption_evidence,
        taskId: state.task.identity.taskId, snapshotTree: capture.snapshot_tree,
        materialRevision: kernel.currentVNextMaterialRevision(), sourceDigest: capture.source_digest,
        capture, receipt: { output_ref: capture.output_ref, output_hash: capture.output_hash },
        acceptedAcIds: new Set(["AC-26"]) })?.byAc.has("AC-26")).toBe(true);
      const readback = taskReconciliation.reconcileCurrentTaskCases({ task: state.task, workspace: state.workspace,
        capture, consumptionEvidence: run.p10_consumption_evidence });
      expect(readback).toMatchObject({ status: "unavailable", reason: "unmapped_changed_path",
        business_effect_status: "unknown", unmapped_changed_paths: capture.targeted_capture.unmapped_changed_paths });
      expect(readback.entries).toHaveLength(1);
      expect(readback.entries.some((entry) => entry.status === "passed")).toBe(false);
      const damaged = { ...capture, targeted_capture: { ...capture.targeted_capture, unmapped_changed_paths: [] } };
      expect(taskReconciliation.reconcileCurrentTaskCases({ task: state.task, workspace: state.workspace,
        capture: damaged, consumptionEvidence: run.p10_consumption_evidence }).reason).toBe("catalog_case_mismatch");
    } finally { rmSync(state.root, { recursive: true, force: true }); }
  }, 90_000);
});

// Genuine isolated canonical protocol; probe observations never certify CARD04 business completion.
describe("ORACLE-P10-REAL-RULES-AND-CONSUMPTION", () => {
  let state, capture, run, prior, priorRaw;
  const originalHome = process.env.HOME, originalTaskDir = process.env.WORKFLOWHUB_TASK_DIR;
  beforeAll(async () => {
    state = taskCaseFixture(["AC-26", "AC-27"], { caseId: "CARD04-DECISION-LOG-CENSUS", decisionText: censusDecision });
    const root = state.workspace.worktreeRoot;
    const exclude = join(state.root, "p10-rule-excludes"); writeFileSync(exclude, "node_modules\n");
    git(root, "config", "core.excludesfile", exclude);
    const copyCase = (id, ac) => ({ ...state.entry, id, ac_ids: [ac],
      effect_observation: { ...state.entry.effect_observation,
        canonical_source: { ...state.entry.effect_observation.canonical_source, subject: ac } } });
    const machine = copyCase("CARD04-ACCEPTANCE-MACHINE-CLASSES", "AC-27");
    machine.effect_observation.producer_status = "not_implemented";
    machine.effect_observation.capability_scope = "helper_validator_only";
    const catalogPath = join(root, "docs/quality/business-case-catalog.json");
    const catalog = JSON.parse(readFileSync(catalogPath));
    const deferred = copyCase("CARD04-DEFERRED-ACCEPTANCE-REGRESSION", "AC-27");
    const registryPath = join(root, "docs/quality/test-asset-registry.json");
    const registry = JSON.parse(readFileSync(registryPath));
    for (const [entry, target] of [[machine, "tests/contract/machine-rule.test.mjs"],
      [deferred, "tests/contract/deferred-rule.test.mjs"]]) {
      const bytes = readFileSync(join(root, state.entry.execution.target));
      writeFileSync(join(root, target), bytes);
      const command = `npx vitest run ${target} --reporter=json`;
      const ids = state.ids.map((id) => id.replace(state.entry.execution.target, target));
      entry.execution = { ...entry.execution, target, machine_command: command, registered_test_ids: ids };
      registry.targets.push({ ...registry.targets[0], path: target, command, registered_test_ids: ids });
    }
    writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
    catalog.cases = [copyCase("CARD04-DECISION-LOG-CENSUS", "AC-26"), machine, deferred];
    writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
    writeFileSync(join(root, "unmapped-business.mjs"), "export const unresolved = true;\n");
    const kernel = createTaskKernel(state.task, { workspace: state.workspace });
    const context = { stage: "build-code", task: state.task, kernel, identity: state.task.identity,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-code"), manifest: state.task.manifest,
      candidateWorkspace: state.workspace, artifacts: ArtifactDir.open(root, state.task) };
    const first = await runOfficialStage("build-code", context, {});
    writeStageRow(state.task.taskPath, { ...first.stage_reflection.stage_row_write.value,
      phase_progress: { phase_id: "P10", task_id: "T021", material_revision: kernel.currentVNextMaterialRevision(),
        recorded_at: new Date().toISOString() } });
    capture = await runCapture((await import("../../workflows/build-code/capture.mjs")).FIXED_TARGETED_CAPTURE_COMMAND,
      "quality/tests/p10-rule-observation.json", { task: state.task, workspace: state.workspace });
    expect(capture.exit_code).toBe(0);
    prior = publishCurrentAcceptance(state, capture, { subject: "AC-27", result: "deferred", status: "missing" });
    const fact = JSON.parse(state.task.readRecord(prior.ref));
    prior = { ...prior, acceptance: fact.evidence[0] };
    priorRaw = state.task.readRecord(prior.acceptance.ref);
    const implementation = writeCurrentImplementationReceipt({ task: state.task, workspace: state.workspace });
    run = await runOfficialStage("build-code", context, { receipts: { implementation: implementation.ref, tests: capture.receipt_ref } });
    expect(run.p10_consumption_evidence).toBeDefined();
  }, 90_000);
  afterAll(() => {
    if (state) rmSync(state.root, { recursive: true, force: true });
    if (originalHome === undefined) delete process.env.HOME; else process.env.HOME = originalHome;
    if (originalTaskDir === undefined) delete process.env.WORKFLOWHUB_TASK_DIR; else process.env.WORKFLOWHUB_TASK_DIR = originalTaskDir;
  });
  const read = (locator = run.p10_consumption_evidence) => taskReconciliation.reconcileCurrentTaskCases({
    task: state.task, workspace: state.workspace, capture, ...(locator === null ? {} : { consumptionEvidence: locator }) });
  const row = (value, id) => value.entries.find((e) => e.case_id === id);
  it("observes the actual nonzero census and keeps missing AC evidence separate from same-call receipt consumption", () => {
    const value = read(), entry = row(value, "CARD04-DECISION-LOG-CENSUS");
    expect(value).toMatchObject({ status: "unavailable", reason: "unmapped_changed_path",
      unmapped_changed_paths: ["docs/quality/business-case-catalog.json", "docs/quality/test-asset-registry.json",
        "tests/contract/deferred-rule.test.mjs", "tests/contract/machine-rule.test.mjs", "unmapped-business.mjs"],
      run_consumption_status: "verified", business_effect_status: "unknown" });
    expect(entry.rule_observation).toMatchObject({ status: "observed", rule: "decision_log_census", source_structure_valid: true });
    expect(entry.rule_observation.source_denominator).toBe(8);
    expect(entry.quality_fact_binding).toMatchObject({ status: "bound", receipt_binding: "same_call_consumption",
      quality_fact_status: "missing", business_evidence_status: "missing", acceptance_result: "deferred" });
    expect(entry.business_effect_status).toBe("unknown");
    expect(row(read(null), "CARD04-DECISION-LOG-CENSUS").quality_fact_binding.status).not.toBe("bound");
    expect(read({ ...run.p10_consumption_evidence, sha256: "0".repeat(64) }))
      .toMatchObject({ reason: "current_execution_unverified", business_effect_reason: "invalid_run_consumption_source" });
  });
  it("actually invokes the eight production result classes and rejects a ninth without claiming official emission", () => {
    const value = read(), observed = row(value, "CARD04-ACCEPTANCE-MACHINE-CLASSES").rule_observation;
    expect(observed).toMatchObject({ status: "observed", rule: "acceptance_machine_classes",
      capability_scope: "helper_validator_only", official_emission_status: "unknown", invalid_result_rejected: true });
    expect(observed.results.map((e) => e.result)).toEqual(["pass", "fail", "inconclusive", "deferred", "missing", "inconsistent", "incomplete", "unavailable"]);
    for (const result of ["missing", "inconsistent", "incomplete", "unavailable"]) {
      expect(observed.results.find((e) => e.result === result)).toMatchObject({ accepted: true, quality_status: "incomplete" });
    }
    expect(row(value, "CARD04-ACCEPTANCE-MACHINE-CLASSES").business_effect_status).toBe("unknown");
  });
  it("authenticates original deferred records and independently revalidates their nonpassing semantics without rewriting them", () => {
    const observed = row(read(), "CARD04-DEFERRED-ACCEPTANCE-REGRESSION").rule_observation;
    expect(observed).toMatchObject({ status: "observed", rule: "canonical_deferred_compatibility" });
    expect(observed.originals).toContainEqual(expect.objectContaining({ fact_ref: prior.ref,
      acceptance_ref: prior.acceptance.ref, acceptance_sha256: prior.acceptance.sha256,
      result: "deferred", fact_status: "missing", quality_status: "incomplete" }));
    expect(state.task.readRecord(prior.acceptance.ref)).toBe(priorRaw);
    expect(observed.originals.every((e) => e.fact_status !== "passed" && e.quality_status !== "passed")).toBe(true);
  });
  it("rejects changed historical original bytes even when the current receipt and source remain authentic", () => {
    const path = join(state.task.taskPath, prior.acceptance.ref);
    try {
      writeFileSync(path, priorRaw.replace('"result": "deferred"', '"result": "pass"'));
      const value = read();
      expect(row(value, "CARD04-DEFERRED-ACCEPTANCE-REGRESSION").rule_observation)
        .toMatchObject({ status: "unknown", reason: "canonical_acceptance_original_hash_mismatch" });
      expect(value.business_effect_status).toBe("unknown");
    } finally { writeFileSync(path, priorRaw); }
    expect(state.task.readRecord(prior.acceptance.ref)).toBe(priorRaw);
  });
});
