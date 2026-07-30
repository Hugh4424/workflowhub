import { execFileSync, spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask, migrateTaskToPerInvocation } from "../../core/task-handle.mjs";
import { captureWorkspaceSnapshot, createCanonicalReceiptWriter, writeCanonicalAuditSummary, writeOfficialComponentReceipt } from "../../core/canonical-receipt-writer.mjs";
import { createTaskKernel } from "../../core/task-kernel.mjs";
import { openAcceptedWorkspace, prepareTaskWorkspace } from "../../core/workspace.mjs";
import { runWorkspaceCommand } from "../../core/workspace-runner.mjs";
import { captureGitWorktreeSnapshot } from "../../core/git-worktree-snapshot.mjs";
import { writeFormalReviewFixture } from "../../tests/helpers/formal-review.mjs";
import { createCanonicalSource, createSourceManifest } from "../../core/canonical-source.mjs";
import { loadStageManifest } from "../../core/step-manifest.mjs";
import { buildPlanTaskContractV2, validateAmbiguityLedgerV2 } from "../../core/stage-content-contracts.mjs";
import { dispatchStageSkill } from "../../core/stage-skill-runtime.mjs";

const temporary = [];
const runtime = new URL("../stage-runtime.mjs", import.meta.url).pathname;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function committedRuntime(root, taskId) {
  const projectRoot = realpathSync(join(import.meta.dirname, "../.."));
  const runner = join(root, "runner");
  execFileSync("git", ["clone", "-q", "--no-local", projectRoot, runner]);
  execFileSync("git", ["checkout", "-qb", `task/Demo/${taskId}`], { cwd: runner });
  cpSync(join(projectRoot, "core"), join(runner, "core"), { recursive: true, force: true });
  cpSync(join(projectRoot, "contracts"), join(runner, "contracts"), { recursive: true, force: true });
  cpSync(join(projectRoot, "schemas"), join(runner, "schemas"), { recursive: true, force: true });
  cpSync(join(projectRoot, "scripts", "stage-runtime.mjs"), join(runner, "scripts", "stage-runtime.mjs"), { force: true });
  cpSync(join(projectRoot, "scripts", "task-recovery.mjs"), join(runner, "scripts", "task-recovery.mjs"), { force: true });
  cpSync(join(projectRoot, "workflows", "build-code", "phase-evidence.mjs"), join(runner, "workflows", "build-code", "phase-evidence.mjs"), { force: true });
  cpSync(join(projectRoot, "skills", "wh-review"), join(runner, "skills", "wh-review"), { recursive: true, force: true });
  symlinkSync(realpathSync(join(projectRoot, "node_modules")), join(runner, "node_modules"));
  execFileSync("git", ["add", "core", "contracts", "schemas", "scripts/stage-runtime.mjs", "scripts/task-recovery.mjs", "workflows/build-code/phase-evidence.mjs", "skills/wh-review", "node_modules"], { cwd: runner });
  execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "--allow-empty", "-qm", "runner"], { cwd: runner });
  return { runner, runtime: join(runner, "scripts", "stage-runtime.mjs") };
}

const officialSpec = `# 功能规格：官方链路

## 速读卡（30 秒）
官方链路必须保留稳定、可验证的需求身份。

## 1. 问题与紧迫性
缺少稳定身份会使下游无法确认自己实现的是哪项需求。

## 2. 背景、目标与范围
本规格只定义官方链路的可审计行为，不选择实现机制。

## 3. 用户场景与状态覆盖
### SCN-001：读取官方链路
- **角色**：工作流使用者
- **Given**：官方链路已接受
- **When**：使用者检查审计记录
- **Then**：需求身份和验收条件可直接解析
### 状态覆盖
| 状态 | 结论 | 场景 | 理由 |
| --- | --- | --- | --- |
| 默认 | 适用 | SCN-001 | 主路径 |

## 4. 产品事实与假设（PFACT）
- **PFACT-01**：已接受方向要求官方链路可审计
  - **status**：verified

## 5. 功能需求
- **FR-SPEC-001**：官方链路公开稳定需求身份

## 6. 条件式业务合同
N/A — 没有跨模块业务合同。

## 7. 明确不做与默认必须成立
### 明确不做
- 不选择实现机制。

## 8. 业务影响与回归范围
既有读取路径保持可用。

## 9. 验收标准
- [ ] **AC-01**：读者能解析稳定需求身份

## 10. 风险、未决与交接
N/A — 已检查范围与验收，未发现未决项。
`;

function officialSpecLedger(specRef) {
  const specHash = sha256(officialSpec);
  const binding = (id, artifactKind = "spec") => ({
    artifact_kind: artifactKind,
    ref: artifactKind === "decision" ? "receipts/decision-log/source.md" : specRef,
    hash: artifactKind === "decision" ? "b".repeat(64) : specHash,
    id,
  });
  return {
    content_profile: "spec-content.v3",
    spec_content_hash: specHash,
    subject_binding: binding("SPEC-001"),
    scenarios: [{
      id: "SCN-001",
      role: "workflow user",
      given: "the official chain is accepted",
      when: "the user inspects its audit record",
      then: "the requirement identity and acceptance condition resolve",
    }],
    pfacts: [{
      id: "PFACT-01",
      statement: "The accepted direction requires an auditable official chain.",
      status: "verified",
      evidence: [binding("D1", "decision")],
      affects_frs: [binding("FR-SPEC-001")],
      affects_acs: [binding("AC-01")],
    }],
    frs: [{
      id: "FR-SPEC-001",
      behavior: "The official chain exposes stable requirement identity.",
      scope_boundary: "No implementation mechanism is selected.",
      pfact_refs: [binding("PFACT-01")],
      scenario_refs: [binding("SCN-001")],
      ac_refs: [binding("AC-01")],
    }],
    acs: [{
      id: "AC-01",
      behavior: "A reader resolves the stable requirement identity.",
      fr_refs: [binding("FR-SPEC-001")],
      verification_method: "Read the accepted specification.",
      pass_condition: "The requirement identity resolves.",
      failure_condition: "The requirement identity is missing.",
      evidence_type: "manual",
    }],
    risks: [],
    open_questions: [],
    clarification: {
      component: "spec-clarify",
      status: "trigger=false",
      reason: "The current specification has no material open question.",
    },
  };
}

function officialPlan(revised = false) {
  return `# Plan

Implement FR-SPEC-001 for AC-01${revised ? " after review" : ""}.
`;
}

function officialTasks({ specRef, specHash, planRef, planHash }) {
  const refs = JSON.stringify([
    { artifact_kind: "spec", ref: specRef, hash: specHash, id: "FR-SPEC-001" },
    { artifact_kind: "plan", ref: planRef, hash: planHash, id: "PLAN" },
  ]);
  return `# Tasks

## Phase 1：Contract

#### T001 — Keep the official chain auditable
- **Phase**：Phase 1：Contract
- **goal**：Implement FR-SPEC-001 and prove AC-01.
- **versioned_refs**：\`${refs}\`
- **Knowledge**：The accepted specification is authoritative.
- **boundary**：Only the official-chain fixture artifacts.
- **动作**：Run the accepted plan.
- **gate_cmd**：\`node --test\`
- **design_state**：ready
- **依赖**：N/A — first task
- **FR**：FR-SPEC-001
- **AC**：AC-01
- **STOP**：Stop if the accepted bindings drift.
- **recovery**：Restore the fixture artifact bytes.
- **task risk**：A stale binding could target the wrong requirement.

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：\`pending\`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — not reviewed
- **completed_at**：N/A — not completed
`;
}

function decisionTalkPayload(roundNumber, tree) {
  const questions = roundNumber === 1 ? [{
    question_id: "scope-boundary",
    question_number: 1,
    card_hash: sha256("fixture scope question"),
    ask: { ref: "host-message://ask/scope-boundary", hash: sha256("fixture ask") },
    reply: { ref: "host-message://reply/scope-boundary", hash: sha256("fixture reply") },
    rerank: { ref: "host-message://rerank/scope-boundary", hash: sha256("fixture rerank") },
  }] : [];
  return {
    interaction_type: "talk",
    rounds: [{
      round_number: roundNumber,
      candidate_queue: [{
        item_id: `axis-${roundNumber}`,
        impact: roundNumber === 1 ? "high" : "medium",
        status: roundNumber === 1 ? "answered" : "evidence-resolved",
        reason: `round ${roundNumber} fixture evidence resolves the candidate axis`,
      }],
      questions,
      questions_already_asked: questions.length,
      open_direction_changing_questions: 0,
      current_total: questions.length,
      end_reason: `round ${roundNumber} has no open direction-changing question`,
      zero_question_reason: roundNumber === 1 ? null : `round ${roundNumber} was resolved from canonical evidence`,
    }],
    grill: null,
    workspace_tree: tree,
  };
}

function decisionGrillPayload(tree) {
  return {
    interaction_type: "grill",
    rounds: [],
    grill: {
      context: { status: "no-change", reason: "Fixture context remains accurate" },
      adr: { status: "not-needed", reason: "Fixture changes no architecture decision" },
      conflicts: { status: "none", reason: "Fixture has no document conflicts" },
      file_references: ["CONTEXT.md"],
      exit_checks: {
        context_checked: true,
        adr_checked: true,
        conflicts_checked: true,
        file_references_checked: true,
      },
    },
    workspace_tree: tree,
  };
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-official-cli-")));
  temporary.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
  const baseline = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim();
  const tree = execFileSync("git", ["rev-parse", "HEAD^{tree}"], { cwd: repo, encoding: "utf8" }).trim();
  const task = createTask({
    storageRoot: root,
    manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "official-chain", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} },
  });
  const officialRuntime = committedRuntime(root, "official-chain");
  const mainStatus = execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: repo, encoding: "utf8" }).trim();
  return { root, repo, task, baseline, tree, mainStatus, runtime: officialRuntime.runtime };
}

function run(root, repo, args, runtimePath) {
  const executable = runtimePath ?? (existsSync(join(root, "runner", "scripts", "stage-runtime.mjs"))
    ? join(root, "runner", "scripts", "stage-runtime.mjs")
    : runtime);
  return JSON.parse(execFileSync(process.execPath, [executable, ...args], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" }));
}

afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });

describe("build-spec clarification completion facts", () => {
  it("requires host-visible ask, wait, and resume facts for material ambiguity", () => {
    const ledger = officialSpecLedger("specs/official-chain/spec.md");
    ledger.open_questions = [{
      id: "OPEN-001",
      affected_ids: ["FR-SPEC-001", "AC-01"],
      owner: "task owner",
      impact: "The recovery rule changes AC-01.",
      handling_stage: "build-spec",
      close_condition_or_stop: "Stop until one recovery rule is selected.",
    }];
    ledger.clarification = {
      component: "spec-clarify",
      status: "executed",
      reason: "The recovery rule materially changes AC-01.",
    };
    expect(validateAmbiguityLedgerV2(ledger).errors.join("\n")).toMatch(/ask.*wait.*resume/i);
  });

  it("requires trigger=false with a reason when no clarification runs", () => {
    const ledger = officialSpecLedger("specs/official-chain/spec.md");
    delete ledger.clarification;
    expect(validateAmbiguityLedgerV2(ledger).errors.join("\n")).toMatch(/trigger=false/i);
  });

  it("accepts one ordered host-visible clarification chain", () => {
    const ledger = officialSpecLedger("specs/official-chain/spec.md");
    ledger.open_questions = [{
      id: "OPEN-001",
      affected_ids: ["FR-SPEC-001", "AC-01"],
      owner: "task owner",
      impact: "The recovery rule changes AC-01.",
      handling_stage: "build-spec",
      close_condition_or_stop: "Stop until one recovery rule is selected.",
    }];
    ledger.clarification = {
      component: "spec-clarify",
      status: "executed",
      reason: "The recovery rule materially changes AC-01.",
      ask: { axis: "recovery rule", sequence: 1, ref: "host-message://ask/q-001" },
      wait: {
        axis: "recovery rule",
        sequence: 2,
        status: "waiting-for-user",
        reply_ref: "host-message://reply/q-001",
      },
      resume: { axis: "recovery rule", sequence: 3, ref: "host-message://resume/q-001" },
    };
    expect(validateAmbiguityLedgerV2(ledger)).toMatchObject({ ok: true, errors: [] });
  });
});

describe("formal host bridge and transparent recovery entrypoints", () => {
  it("emits one authenticated request before accepting exactly one host response", async () => {
    const { root, repo, task, runtime: boundRuntime } = fixture();
    run(root, repo, ["prepare", "--stage=make-decision", "--project=Demo", "--task=official-chain"]);
    const oldRun = run(root, repo, ["start-run", "--stage=make-decision", "--project=Demo", "--task=official-chain", "--reason=interrupted-run"]);
    const oldRunBytes = task.readRecord(oldRun.ref);
    const oldJournalBytes = task.readRecord("journal.jsonl");
    const recovered = run(root, repo, ["recover-run", "--stage=make-decision", "--project=Demo", "--task=official-chain", "--reason=transparent-recovery"]);
    expect(recovered.run).toMatchObject({ previous_run_ref: oldRun.ref, previous_run_hash: oldRun.hash });
    const recoveryTree = captureGitWorktreeSnapshot(run(root, repo, ["prepare", "--stage=make-decision", "--project=Demo", "--task=official-chain"]).worktree_root).tree;
    const outcomeRaw = `${JSON.stringify({ snapshot_tree: recoveryTree, result: "talk completed" })}\n`;
    createTaskKernel(task).publishCanonicalRecord("evidence/talk-1-outcome.json", outcomeRaw);
    const response = { outcome_ref: "evidence/talk-1-outcome.json", outcome_hash: sha256(outcomeRaw), snapshot_tree: recoveryTree };
    const child = spawn(process.execPath, [boundRuntime, "invoke-stage-skill", "--stage=make-decision", "--project=Demo", "--task=official-chain", "--name=talk-with-zhipeng", "--invocation-key=talk-1"], {
      cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "", stderr = "";
    child.stdout.setEncoding("utf8"); child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    await new Promise((resolve, reject) => {
      child.stdout.on("data", (chunk) => {
        stdout += chunk;
        const line = stdout.split("\n")[0];
        if (!line || child.stdin.destroyed) return;
        const request = JSON.parse(line);
        expect(request).toMatchObject({ schema_version: "host-invocation-request.v1", task_id: "official-chain", stage: "make-decision", workflow_run_id: recovered.run.workflow_run_id, name: "talk-with-zhipeng", invocation_key: "talk-1", snapshot_tree: recoveryTree });
        expect(request.bundle_hash).toMatch(/^[a-f0-9]{64}$/);
        child.stdin.end(`${JSON.stringify(response)}\n`);
      });
      child.on("error", reject);
      child.on("close", (code) => code === 0 ? resolve() : reject(new Error(stderr)));
    });
    const observed = createTaskKernel(task).readStageSkillInvocation("make-decision", "talk-with-zhipeng", "talk-1");
    expect(observed.fact).toMatchObject({ status: "executed", ...response });

    for (const [name, key] of [["talk-with-zhipeng", "talk-2"], ["talk-with-zhipeng", "talk-3"], ["grill-with-docs", "grill"]]) {
      const ref = `evidence/${key}-outcome.json`;
      const raw = `${JSON.stringify({ snapshot_tree: recoveryTree, result: `${key} completed` })}\n`;
      createTaskKernel(task).publishCanonicalRecord(ref, raw);
      const reply = { outcome_ref: ref, outcome_hash: sha256(raw), snapshot_tree: recoveryTree };
      const invoked = spawnSync(process.execPath, [boundRuntime, "invoke-stage-skill", "--stage=make-decision", "--project=Demo", "--task=official-chain", `--name=${name}`, `--invocation-key=${key}`], {
        cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, input: `${JSON.stringify(reply)}\n`, encoding: "utf8",
      });
      expect(invoked.status, invoked.stderr).toBe(0);
    }
    const oracle = run(root, repo, ["verify-recovery", "--stage=make-decision", "--project=Demo", "--task=official-chain"]);
    expect(oracle).toMatchObject({
      previous_run_ref: oldRun.ref, previous_run_hash: oldRun.hash,
      workflow_run_id: recovered.run.workflow_run_id,
      completion: { complete: true, invocation_missing: [] },
      confirmation_present: false, accepted_present: false,
    });
    expect(oracle.invocation_outcomes).toHaveLength(4);
    expect(oracle.completion.run_journal_start_offset).toBeGreaterThanOrEqual(Buffer.byteLength(oldJournalBytes));
    expect(task.readRecord(oldRun.ref)).toBe(oldRunBytes);

    const baseArgs = ["invoke-stage-skill", "--stage=make-decision", "--project=Demo", "--task=official-chain", "--name=talk-with-zhipeng", "--invocation-key=talk-2"];
    const missing = spawnSync(process.execPath, [boundRuntime, ...baseArgs], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, input: "", encoding: "utf8" });
    expect(missing.status).not.toBe(0); expect(missing.stderr).toMatch(/exactly one response/i);
    const duplicate = spawnSync(process.execPath, [boundRuntime, ...baseArgs], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, input: `${JSON.stringify(response)}\n${JSON.stringify(response)}\n`, encoding: "utf8" });
    expect(duplicate.status).not.toBe(0); expect(duplicate.stderr).toMatch(/exactly one response/i);
    const outOfOrder = spawnSync(process.execPath, [boundRuntime, ...baseArgs, "--input=precommitted.json"], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(outOfOrder.status).not.toBe(0); expect(outOfOrder.stderr).toMatch(/accepts only identity/i);
  }, 20_000);

  it("routes declared stage-skill invocation through a formal host bridge command", () => {
    const result = spawnSync(process.execPath, [
      runtime,
      "invoke-stage-skill",
      "--stage=make-decision",
      "--project=Demo",
      "--task=missing-fixture",
      "--name=talk-with-zhipeng",
      "--invocation-key=talk-1",
    ], { encoding: "utf8" });
    expect(
      `${result.stdout}${result.stderr}`,
      "ORACLE-VERIFY: runtime must recognize the formal host bridge before task lookup",
    ).not.toMatch(/unknown command/i);
  });

  it("exposes a read-only recovery oracle; start-run alone is not recovery proof", () => {
    const result = spawnSync(process.execPath, [
      runtime,
      "verify-recovery",
      "--stage=make-decision",
      "--project=Demo",
      "--task=missing-fixture",
    ], { encoding: "utf8" });
    expect(
      `${result.stdout}${result.stderr}`,
      "ORACLE-RECOVERY: recovery needs old-byte, invocation, completion, confirmation, and journal checks",
    ).not.toMatch(/unknown command/i);
  });
});

describe("official five-stage CLI", () => {
  it("derives a clean committed runner, allows upgrades, and rejects caller injection or dirty execution", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-stage-runtime-runner-"))); temporary.push(root);
    const officialRuntime = committedRuntime(root, "runtime-bound");
    const runner = officialRuntime.runner, repo = join(root, "repo");
    mkdirSync(repo);
    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "--allow-empty", "-qm", "baseline"], { cwd: repo });
    const task = createTask({ storageRoot: root, manifest: {
      schema_version: "1.0.0", project_name: "Demo", task_id: "runtime-bound", created_at: "2026-07-19T00:00:00.000Z",
      target_repo_root: repo, issue_ids: [], inputs: {},
    } });
    migrateTaskToPerInvocation({
      taskPath: task.taskPath,
      projectName: "Demo",
      taskId: "runtime-bound",
      expectedManifestHash: createHash("sha256").update(task.readRecord("task.json")).digest("hex"),
    });
    const boundRuntime = officialRuntime.runtime;
    const env = { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root };
    const unsupportedHelp = spawnSync(process.execPath, [boundRuntime, "--help"], { cwd: repo, env, encoding: "utf8" });
    expect(unsupportedHelp.status).not.toBe(0);
    expect(unsupportedHelp.stderr).toMatch(/usage: stage-runtime/i);
    const args = ["prepare", "--stage=make-decision", "--project=Demo", "--task=runtime-bound"];
    const prepared = spawnSync(process.execPath, [boundRuntime, ...args], { cwd: repo, env, encoding: "utf8" });
    expect(prepared.status, prepared.stderr).toBe(0);
    const injected = spawnSync(process.execPath, [boundRuntime, ...args, `--runner-root=${repo}`], { cwd: repo, env, encoding: "utf8" });
    expect(injected.status).not.toBe(0);
    expect(injected.stderr).toMatch(/runner-root is forbidden/i);
    execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "--allow-empty", "-qm", "runner drift"], { cwd: runner });
    const upgraded = spawnSync(process.execPath, [boundRuntime, ...args], { cwd: repo, env, encoding: "utf8" });
    expect(upgraded.status, upgraded.stderr).toBe(0);
    writeFileSync(join(runner, "dirty-runtime.txt"), "dirty\n");
    const dirty = spawnSync(process.execPath, [boundRuntime, ...args], { cwd: repo, env, encoding: "utf8" });
    expect(dirty.status).not.toBe(0);
    expect(dirty.stderr).toMatch(/clean Git worktree/i);
  });

  it("runs repository-owned handlers and accepts the complete chain", async () => {
    const { root, repo, task, baseline, mainStatus, runtime } = fixture();
    const reviewKernel = createTaskKernel(task);
    const registerReviewHead = (resultRef, expectedHead = null, revisionRef) => {
      const result = JSON.parse(task.readRecord(resultRef));
      const identity = reviewKernel.deriveReviewFlowIdentity({
        stage: result.stage,
        review_track: result.review_track ?? null,
        subject_kind: result.subject_kind,
        phase_id: result.phase_id ?? null,
        review_scope: result.review_scope ?? null,
        ...(revisionRef === undefined ? {} : { revision_ref: revisionRef }),
      });
      return reviewKernel.advanceReviewFlow(identity, { expected_head_ref: expectedHead, result_ref: resultRef });
    };
    const inputRoots = Object.fromEntries(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"].map((stage) => {
      const path = realpathSync(mkdtempSync(join(tmpdir(), `workflowhub-${stage}.`))); temporary.push(path); return [stage, path];
    }));
    const env = { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root };
    const requirementsInput = (() => {
      const source = createCanonicalSource({
        source_type: "offline_fixture", source_id: "official-chain", revision: "r1", requirements: ["R1"],
      });
      const sourceManifest = createSourceManifest({
        canonical_source: source,
        atoms: [{
          requirement_id: "R1", text: "The official chain must remain auditable.",
          owner: "product", authority: "test", derived_from: [], supersedes: [],
          status: "accepted", stale: false,
        }],
      }).manifest;
      return {
        source_manifest: sourceManifest,
        mappings: { R1: {
          decision_ref: { kind: "decision", uri_or_path: "decision://R1", content_hash: "b".repeat(64) },
          artifact_refs: [{ kind: "artifact", uri_or_path: "artifact://R1", content_hash: "c".repeat(64) }],
          acceptance_criteria_refs: [{ kind: "ac", uri_or_path: "ac://R1", content_hash: "d".repeat(64) }],
        } },
      };
    })();
    const prepareOfficialRun = (stage, reason = "official fixture execution") => {
      const kernel = createTaskKernel(task);
      const runRecord = kernel.startStageRun(stage, { reason });
      kernel.publishRequirementsLedger(stage, requirementsInput);
      for (const step of loadStageManifest(stage, realpathSync(join(import.meta.dirname, "../.."))).steps) {
        const entry = kernel.writeStageStepEntry(stage, {
          step_id: step.step_id,
          attempt_id: "attempt-1",
          entry_evidence: { kind: "fixture", uri_or_path: `evidence/${stage}-step-${step.step_id}-entry.json` },
        });
        kernel.writeStageStepExit(stage, {
          step_id: step.step_id,
          attempt_id: "attempt-1",
          entry_journal_entry_id: entry.journal_entry_id,
          terminal_status: "success",
          completion_evidence: { kind: "fixture", uri_or_path: `evidence/${stage}-step-${step.step_id}-exit.json` },
        });
      }
      return runRecord;
    };
    const publishStageContent = (stage, kind, payload, name) => {
      const input = join(inputRoots[stage], `${name}.json`);
      writeFileSync(input, `${JSON.stringify(payload)}\n`);
      return run(root, repo, [
        "publish-content-evidence", `--stage=${stage}`, "--project=Demo", "--task=official-chain",
        `--kind=${kind}`, `--input=${input}`,
      ]);
    };
    const rejectBareRun = (stage, receipts) => {
      const input = join(inputRoots[stage], `${stage}-bare-input.json`);
      writeFileSync(input, `${JSON.stringify(receipts)}\n`);
      const result = spawnSync(process.execPath, [runtime, "run", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--input=${input}`], { cwd: repo, env, encoding: "utf8" });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/receipts/i);
    };
    const acceptanceCoverage = (testReceiptRef) => {
      const receipt = JSON.parse(task.readRecord(testReceiptRef));
      const acceptanceRaw = `${JSON.stringify({
        schema_version: "acceptance-evidence.v1",
        acceptance_criterion_id: "AC-01",
        result: "pass",
        refs: [{ ref: receipt.output_ref, sha256: receipt.output_hash }],
      }, null, 2)}\n`;
      const acceptanceHash = sha256(acceptanceRaw);
      const acceptanceRef = `evidence/build-acceptance-${acceptanceHash}.json`;
      try {
        if (task.readRecord(acceptanceRef) !== acceptanceRaw) throw new Error("build acceptance evidence collision");
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
        createTaskKernel(task).publishCanonicalRecord(acceptanceRef, acceptanceRaw);
      }
      return {
        snapshot_tree: receipt.snapshot_tree,
        accepted_criterion_ids: ["AC-01"],
        items: [{
          acceptance_criterion_id: "AC-01",
          status: "covered",
          evidence_refs: [{ ref: acceptanceRef, sha256: acceptanceHash }],
        }],
      };
    };
    const invoke = (stage, receipts, extra = [], callerFields = {}, afterPrepare) => {
      if (stage !== "make-decision") prepareOfficialRun(stage, callerFields.run_reason ?? "official fixture execution");
      afterPrepare?.();
      const effectiveReceipts = { ...receipts };
      const reviewRef = receipts.review;
      if (reviewRef) {
        const review = JSON.parse(task.readRecord(reviewRef));
        const serious = review.adjudication?.clusters?.find((cluster) =>
          cluster.disposition === "actionable"
          && ["major", "blocking"].includes(cluster.severity)
          && ["direct", "corroborated_inference"].includes(cluster.evidence_status));
        if (serious) {
          const pauseInput = join(inputRoots[stage], `${stage}-risk-pause.json`);
          writeFileSync(pauseInput, `${JSON.stringify({ review_result_ref: reviewRef })}\n`);
          const pause = run(root, repo, ["review-risk-pause", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--input=${pauseInput}`]);
          const finding = pause.findings.find(({ finding_id: id }) => id === serious.id);
          const replyRaw = `${JSON.stringify({ stage, selected_option: "accept-risk", reply: "Fixture explicitly accepts this exact finding and its stated consequences." }, null, 2)}\n`;
          const replyHash = createHash("sha256").update(replyRaw).digest("hex");
          const replyRef = `evidence/review-risk-replies/${replyHash}.json`;
          createTaskKernel(task).publishCanonicalRecord(replyRef, replyRaw);
          const acceptanceInput = join(inputRoots[stage], `${stage}-risk-acceptance.json`);
          writeFileSync(acceptanceInput, `${JSON.stringify({
            review_result_ref: reviewRef,
            finding_id: finding.finding_id,
            card_ref: finding.card_ref,
            card_hash: finding.card_hash,
            selected_option: "accept-risk",
            reply_ref: replyRef,
            reply_hash: replyHash,
          })}\n`);
          const acceptance = run(root, repo, ["accept-review-risk", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--input=${acceptanceInput}`]);
          effectiveReceipts.risk_acceptance = acceptance.risk_acceptance_ref;
        }
      }
      const input = join(inputRoots[stage], `${stage}-input.json`);
      writeFileSync(input, `${JSON.stringify({
        receipts: effectiveReceipts,
        ...(stage === "build-code" ? { acceptance_coverage: acceptanceCoverage(effectiveReceipts.tests) } : {}),
        ...callerFields,
      })}\n`);
      const attempt = run(root, repo, ["run", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--input=${input}`, ...extra]);
      if (["build-spec", "build-plan"].includes(stage)) expect(attempt.attempt.checkpoint).not.toHaveProperty("ref");
      const human = ["make-decision", "build-plan", "verify-code"].includes(stage);
      const confirmation = human ? run(root, repo, ["confirm", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--attempt=${attempt.attempt_ref}`, "--decision=accepted", ...extra]) : undefined;
      const invalidArgs = human
        ? ["accept", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--attempt=${attempt.attempt_ref}`, "--human-confirmation-ref=plain-string", ...extra]
        : ["confirm", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--attempt=${attempt.attempt_ref}`, "--decision=accepted", ...extra];
      const invalid = spawnSync(process.execPath, [runtime, ...invalidArgs], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
      expect(invalid.status).not.toBe(0);
      const accepted = human
        ? run(root, repo, ["accept", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--attempt=${attempt.attempt_ref}`, `--human-confirmation-ref=${confirmation.ref}`, ...extra])
        : JSON.parse(task.readRecord(`results/${stage}/accepted.json`));
      expect(accepted.attempt_ref).toBe(attempt.attempt_ref);
      expect(accepted.acceptance_mode).toBe(human ? "human" : "automatic");
      if (!human) expect(accepted).not.toHaveProperty("human_confirmation_ref");
      if (["build-spec", "build-plan"].includes(stage)) expect(accepted.checkpoint.ref).toMatch(/^refs\/workflowhub\/checkpoints\//);
      return { attempt, accepted };
    };

    const preparedDecision = run(root, repo, [
      "prepare", "--stage=make-decision", "--project=Demo", "--task=official-chain",
    ]);
    run(root, repo, [
      "start-run", "--stage=make-decision", "--project=Demo", "--task=official-chain",
      "--reason=official fixture execution",
    ]);
    const decisionLedgerInput = join(inputRoots["make-decision"], "requirements-ledger.json");
    writeFileSync(decisionLedgerInput, `${JSON.stringify(requirementsInput)}\n`);
    run(root, repo, [
      "publish-requirements-ledger", "--stage=make-decision", "--project=Demo", "--task=official-chain",
      `--input=${decisionLedgerInput}`,
    ]);
    const decisionTree = captureGitWorktreeSnapshot(preparedDecision.worktree_root).tree;
    const direction = writeFormalReviewFixture({ task, stage: "make-decision", snapshotTree: decisionTree, reviewTrack: "direction" });
    const detail = writeFormalReviewFixture({ task, stage: "make-decision", snapshotTree: decisionTree, reviewTrack: "detail" });
    const publishDecisionInteraction = (name, payload) => {
      const input = join(inputRoots["make-decision"], `${name}.json`);
      writeFileSync(input, `${JSON.stringify(payload)}\n`);
      return run(root, repo, [
        "publish-content-evidence", "--stage=make-decision", "--project=Demo", "--task=official-chain",
        "--kind=interaction-completion.v1", `--input=${input}`,
      ]);
    };
    const invokeDecisionInteraction = async (published, name, invocationKey) => {
      await dispatchStageSkill({
        packageRoot: realpathSync(join(import.meta.dirname, "../..")),
        stage: "make-decision",
        name,
        invocationKey,
        kernel: createTaskKernel(task),
        hostInvoke: () => ({
          outcome: "done",
          outcome_ref: published.evidence_ref,
          outcome_hash: published.evidence_hash,
          snapshot_tree: decisionTree,
        }),
      });
      return createTaskKernel(task, { candidateWorkspace: prepareTaskWorkspace(task) })
        .completeMakeDecisionInteractionPublication({
          evidence_ref: published.evidence_ref,
          evidence_hash: published.evidence_hash,
        });
    };
    const talkOne = publishDecisionInteraction("talk-1", decisionTalkPayload(1, decisionTree));
    const directPublishEvents = task.readRecord("journal.jsonl").split("\n").filter(Boolean).map(JSON.parse);
    expect(
      directPublishEvents.some((event) => event.stage_slug === "make-decision"
        && event.step_id === 3
        && event.event_type === "step_exit"
        && event.terminal_status === "success"),
      "ORACLE-INV: direct content publication must not complete talk without a runtime-owned hostInvoke fact",
    ).toBe(false);
    expect(() => createTaskKernel(task).publishStageSkillInvocation({
      schema_version: "stage-skill-invocation.v1",
      task_id: "official-chain",
      workflow_run_id: createTaskKernel(task).deriveStageWorkflowRunId("make-decision"),
      stage: "make-decision",
      name: "talk-with-zhipeng",
      invocation_key: "talk-1",
      status: "executed",
    }), "ORACLE-INV: caller-shaped content cannot enter the runtime-owned invocation namespace")
      .toThrow(/runtime-owned/i);
    await expect(dispatchStageSkill({
      packageRoot: realpathSync(join(import.meta.dirname, "../..")),
      stage: "make-decision",
      name: "talk-with-zhipeng",
      invocationKey: "talk-1",
      kernel: createTaskKernel(task),
      hostInvoke: () => ({ outcome: "done" }),
    }), "ORACLE-INV: no-op host outcome cannot unlock prewritten talk content")
      .rejects.toThrow(/outcome_ref|outcome_hash|snapshot_tree/i);
    await invokeDecisionInteraction(talkOne, "talk-with-zhipeng", "talk-1");
    await expect(dispatchStageSkill({
      packageRoot: realpathSync(join(import.meta.dirname, "../..")),
      stage: "make-decision",
      name: "talk-with-zhipeng",
      invocationKey: "talk-1",
      kernel: createTaskKernel(task),
      hostInvoke: () => ({
        outcome: "done",
        outcome_ref: talkOne.evidence_ref,
        outcome_hash: talkOne.evidence_hash,
        snapshot_tree: decisionTree,
      }),
    })).resolves.toMatchObject({ status: "executed" });
    await expect(dispatchStageSkill({
      packageRoot: realpathSync(join(import.meta.dirname, "../..")),
      stage: "make-decision",
      name: "talk-with-zhipeng",
      invocationKey: "talk-1",
      kernel: createTaskKernel(task),
      hostInvoke: () => ({
        outcome: "different",
        outcome_ref: talkOne.evidence_ref,
        outcome_hash: talkOne.evidence_hash,
        snapshot_tree: decisionTree,
      }),
    }), "ORACLE-INV: the same identity cannot be rebound to a different outcome")
      .rejects.toThrow(/different fact/i);
    const researchInput = join(inputRoots["make-decision"], "research-skip.json");
    writeFileSync(researchInput, `${JSON.stringify({
      status: "skipped",
      reason: "The canonical first-round evidence is sufficient.",
      evidence: {
        kind: "stage_content",
        uri_or_path: talkOne.evidence_ref,
        content_hash: talkOne.evidence_hash,
      },
    })}\n`);
    run(root, repo, [
      "record-research", "--stage=make-decision", "--project=Demo", "--task=official-chain",
      `--input=${researchInput}`,
    ]);
    const talkTwo = publishDecisionInteraction("talk-2", decisionTalkPayload(2, decisionTree));
    await invokeDecisionInteraction(talkTwo, "talk-with-zhipeng", "talk-2");
    registerReviewHead(direction.resultRef);
    const talkThree = publishDecisionInteraction("talk-3", decisionTalkPayload(3, decisionTree));
    await invokeDecisionInteraction(talkThree, "talk-with-zhipeng", "talk-3");
    const grill = publishDecisionInteraction("grill", decisionGrillPayload(decisionTree));
    await invokeDecisionInteraction(grill, "grill-with-docs", "grill");
    const decisionInput = join(inputRoots["make-decision"], "decision.json");
    writeFileSync(decisionInput, `${JSON.stringify({ decision_log: "# Decision\n\nGo.\n" })}\n`);
    const decisionReceipt = run(root, repo, [
      "receipt", "--stage=make-decision", "--project=Demo", "--task=official-chain",
      "--component=decision", `--input=${decisionInput}`,
    ]);
    registerReviewHead(detail.resultRef);
    const canonicalDecision = JSON.parse(task.readRecord(decisionReceipt.receipt_ref));
    publishDecisionInteraction("interaction-aggregate", {
      interaction_type: "aggregate",
      rounds: [talkOne, talkTwo, talkThree].map((item) => ({ ref: item.evidence_ref, hash: item.evidence_hash })),
      grill: { ref: grill.evidence_ref, hash: grill.evidence_hash },
      workspace_tree: decisionTree,
      decision_ref: canonicalDecision.decision_ref,
      decision_hash: canonicalDecision.decision_hash,
    });
    const decisionCoverageInput = join(inputRoots["make-decision"], "decision-coverage.json");
    writeFileSync(decisionCoverageInput, `${JSON.stringify({
      decision_log_ref: canonicalDecision.decision_ref,
      decision_log_hash: canonicalDecision.decision_hash,
      items: [],
      summary: { covered: 0, accepted_omission: 0, missing: 0 },
    })}\n`);
    run(root, repo, [
      "publish-content-evidence", "--stage=make-decision", "--project=Demo", "--task=official-chain",
      "--kind=decision-coverage-audit.v1", `--input=${decisionCoverageInput}`,
    ]);
    invoke("make-decision", {
      decision: decisionReceipt.receipt_ref,
      direction_review: direction.resultRef,
      detail_review: detail.resultRef,
    });
    const workspace = openAcceptedWorkspace(task, createTaskKernel(task).readAccepted("make-decision"));
    expect(readFileSync(join(workspace.worktreeRoot, "specs", "official-chain", "decision-log.md"), "utf8"))
      .toBe(task.readRecord(canonicalDecision.decision_ref));
    const invalidSpecPrepare = spawnSync(process.execPath, [runtime, "prepare", "--stage=build-spec", "--project=Demo", "--task=official-chain"], { cwd: repo, env, encoding: "utf8" });
    expect(invalidSpecPrepare.status).not.toBe(0);
    expect(invalidSpecPrepare.stderr).toMatch(/prepare is only valid for make-decision/i);
    const specRef = "specs/official-chain/spec.md";
    writeFileSync(join(workspace.worktreeRoot, specRef), officialSpec);
    writeOfficialComponentReceipt({ task, stage: "build-spec", component: "spec", payload: { content: officialSpec } });
    const specReview = writeFormalReviewFixture({ task, stage: "build-spec", snapshotTree: captureWorkspaceSnapshot(workspace).tree, verdict: "revise_required" });
    registerReviewHead(specReview.resultRef);
    rejectBareRun("build-spec", { spec: "receipts/spec.json", review: specReview.resultRef });
    const forgedBuildSpecInput = join(inputRoots["build-spec"], "build-spec-forged-input.json");
    writeFileSync(forgedBuildSpecInput, `${JSON.stringify({
      receipts: { spec: "receipts/spec.json", review: specReview.resultRef },
      workflow_run_id: "caller-forged-workflow-run",
    })}\n`);
    const forgedBuildSpec = spawnSync(process.execPath, [runtime, "run", "--stage=build-spec", "--project=Demo", "--task=official-chain", `--input=${forgedBuildSpecInput}`], { cwd: repo, env, encoding: "utf8" });
    expect(forgedBuildSpec.status).not.toBe(0);
    expect(forgedBuildSpec.stderr).toMatch(/unknown fields.*workflow_run_id/i);
    const buildSpec = invoke(
      "build-spec",
      { spec: "receipts/spec.json", review: specReview.resultRef },
      [],
      {},
      () => publishStageContent("build-spec", "ambiguity-ledger.v2", officialSpecLedger(specRef), "ambiguity-ledger"),
    );
    expect(buildSpec.attempt.attempt.missing_items).toContain("serious review finding accepted as explicit risk; verdict remains revise_required");
    const invalidPlanPrepare = spawnSync(process.execPath, [runtime, "prepare", "--stage=build-plan", "--project=Demo", "--task=official-chain"], { cwd: repo, env, encoding: "utf8" });
    expect(invalidPlanPrepare.status).not.toBe(0);
    expect(invalidPlanPrepare.stderr).toMatch(/prepare is only valid for make-decision/i);

    const planRef = "specs/official-chain/plan.md";
    const tasksRef = "specs/official-chain/tasks.md";
    const initialPlan = officialPlan();
    const revisedPlanContent = officialPlan(true);
    const tasksContent = officialTasks({
      specRef,
      specHash: sha256(officialSpec),
      planRef,
      planHash: sha256(revisedPlanContent),
    });
    writeOfficialComponentReceipt({ task, stage: "build-plan", component: "plan", payload: { content: initialPlan } });
    writeOfficialComponentReceipt({ task, stage: "build-plan", component: "tasks", payload: { content: tasksContent } });
    const revisedPlanInput = join(inputRoots["build-plan"], "revised-plan.json");
    writeFileSync(revisedPlanInput, `${JSON.stringify({ content: revisedPlanContent })}\n`);
    const revisedPlan = run(root, repo, ["receipt", "--stage=build-plan", "--project=Demo", "--task=official-chain", "--component=plan", `--input=${revisedPlanInput}`, "--revision=true", "--recover=receipts/plan.json"]);
    expect(revisedPlan).toMatchObject({ revision: true, previous_receipt_ref: "receipts/plan.json" });
    expect(revisedPlan.receipt_ref).toMatch(/^receipts\/revisions\/plan\/[a-f0-9]{64}\.json$/);
    expect(JSON.parse(task.readRecord("receipts/plan.json"))).toMatchObject({ content: initialPlan });
    for (const args of [
      ["receipt", "--stage=build-plan", "--project=Demo", "--task=official-chain", "--component=plan", `--input=${revisedPlanInput}`, "--revision=true"],
      ["receipt", "--stage=build-plan", "--project=Demo", "--task=official-chain", "--component=plan", `--input=${revisedPlanInput}`, "--recover=receipts/plan.json"],
      ["run", "--stage=build-plan", "--project=Demo", "--task=official-chain", "--revision=true"],
    ]) {
      const invalid = spawnSync(process.execPath, [runtime, ...args], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
      expect(invalid.status).not.toBe(0);
    }
    writeFileSync(join(workspace.worktreeRoot, planRef), revisedPlanContent);
    writeFileSync(join(workspace.worktreeRoot, tasksRef), tasksContent);
    const planReview = writeFormalReviewFixture({ task, stage: "build-plan", snapshotTree: captureWorkspaceSnapshot(workspace).tree, verdict: "revise_required" });
    registerReviewHead(planReview.resultRef);
    rejectBareRun("build-plan", { plan: revisedPlan.receipt_ref, tasks: "receipts/tasks.json", review: planReview.resultRef });
    const planTaskContract = () => buildPlanTaskContractV2({
      spec: officialSpec,
      plan: revisedPlanContent,
      tasks: tasksContent,
      specRef,
      specHash: sha256(officialSpec),
      planRef,
      planHash: sha256(revisedPlanContent),
      tasksRef,
      tasksHash: sha256(tasksContent),
    });
    const buildPlan = invoke(
      "build-plan",
      { plan: revisedPlan.receipt_ref, tasks: "receipts/tasks.json", review: planReview.resultRef },
      [],
      {},
      () => publishStageContent("build-plan", "plan-task-contract.v2", planTaskContract(), "plan-task-contract"),
    );
    expect(buildPlan.attempt.attempt.missing_items).toContain("serious review finding accepted as explicit risk; verdict remains revise_required");
    expect(buildPlan.accepted.checkpoint.artifacts.map((item) => item.path).sort()).toEqual([
      "specs/official-chain/plan.md",
      "specs/official-chain/tasks.md",
    ]);
    writeFileSync(join(workspace.worktreeRoot, "README.md"), "integrated upstream\n");
    execFileSync("git", ["add", "README.md"], { cwd: workspace.worktreeRoot });
    execFileSync("git", ["commit", "-qm", "integrate upstream"], { cwd: workspace.worktreeRoot });
    const rebind = run(root, repo, ["rebind", "--stage=build-plan", "--project=Demo", "--task=official-chain"]);
    expect(rebind.ref).toMatch(/^results\/build-plan\/revisions\/baseline-rebind-/);
    const rebindTree = captureWorkspaceSnapshot(workspace).tree;
    const rebindReview = writeFormalReviewFixture({
      task, stage: "build-plan", snapshotTree: rebindTree,
      reviewChain: {
        version: "wh-review-chain.v1", round: "full",
        parent_result_ref: planReview.resultRef, root_result_ref: planReview.resultRef,
        prior_snapshot_tree: JSON.parse(task.readRecord(planReview.resultRef)).snapshot_tree,
        current_snapshot_tree: rebindTree, response_ledger_sha256: null,
        source_diff_sha256: "a".repeat(64),
      },
    });
    registerReviewHead(rebindReview.resultRef, planReview.resultRef);
    const rebindInput = join(inputRoots["build-plan"], "build-plan-rebind-input.json");
    writeFileSync(rebindInput, `${JSON.stringify({ receipts: { plan: revisedPlan.receipt_ref, tasks: "receipts/tasks.json", review: rebindReview.resultRef } })}\n`);
    prepareOfficialRun("build-plan", "baseline rebind after upstream integration");
    publishStageContent("build-plan", "plan-task-contract.v2", planTaskContract(), "plan-task-contract-rebind");
    const reboundAttempt = run(root, repo, ["run", "--stage=build-plan", "--project=Demo", "--task=official-chain", `--input=${rebindInput}`, `--baseline-rebind=${rebind.ref}`]);
    const reboundConfirmation = run(root, repo, ["confirm", "--stage=build-plan", "--project=Demo", "--task=official-chain", `--attempt=${reboundAttempt.attempt_ref}`, "--decision=accepted"]);
    const rebound = run(root, repo, ["accept", "--stage=build-plan", "--project=Demo", "--task=official-chain", `--attempt=${reboundAttempt.attempt_ref}`, `--human-confirmation-ref=${reboundConfirmation.ref}`]);
    expect(rebound.baseline_rebind_provenance.authorization_ref).toBe(rebind.ref);
    expect(rebound.checkpoint.ref).not.toBe(buildPlan.accepted.checkpoint.ref);

    const code = "require('node:fs').mkdirSync('src',{recursive:true});require('node:fs').writeFileSync('src/feature.txt','implemented\\n')";
    expect(runWorkspaceCommand(workspace, process.execPath, ["-e", code]).status).toBe(0);
    const taskEvidence = [{
      ref: rebindReview.resultRef,
      sha256: sha256(task.readRecord(rebindReview.resultRef)),
    }];
    const completedTasksContent = tasksContent
      .replace("- [ ] **任务完成**", "- [x] **任务完成**")
      .replace("- **status**：`pending`", "- **status**：`completed`")
      .replace("- **actual_changes**：N/A — not started", "- **actual_changes**：`src/feature.txt`")
      .replace("- **executed_commands**：N/A — not started", "- **executed_commands**：`printf fixture-output`; exit 0")
      .replace("- **evidence_refs**：N/A — not started", `- **evidence_refs**：\`${JSON.stringify(taskEvidence)}\``)
      .replace("- **covered_ac**：N/A — not started", "- **covered_ac**：AC-01")
      .replace("- **review_fact**：N/A — not reviewed", `- **review_fact**：${rebindReview.resultRef}`)
      .replace("- **completed_at**：N/A — not completed", "- **completed_at**：2026-07-29T12:00:00.000Z");
    writeFileSync(join(workspace.worktreeRoot, tasksRef), completedTasksContent);

    const implementation = writeOfficialComponentReceipt({ task, workspace, stage: "build-code", component: "implementation", payload: {} });
    expect(implementation.value.changed).toContain("src/feature.txt");
    const buildTestCaptureInput = join(inputRoots["build-code"], "build-test-capture.json");
    writeFileSync(buildTestCaptureInput, `${JSON.stringify({ command: "printf fixture-output", receipt_ref: "receipts/build-tests.json", output_ref: "evidence/build-output.txt" })}\n`);
    const capturedBuildTests = run(root, repo, ["capture-tests", "--stage=build-code", "--project=Demo", "--task=official-chain", `--input=${buildTestCaptureInput}`]);
    expect(capturedBuildTests).toMatchObject({ receipt_ref: "receipts/build-tests.json", output_ref: "evidence/build-output.txt", exit_code: 0 });
    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented after pre-review fix\n");
    const preAcceptImplementation = writeOfficialComponentReceipt({ task, workspace, stage: "build-code", component: "implementation", payload: {}, revisionOf: implementation.ref });
    const preAcceptTests = createCanonicalReceiptWriter({ task, workspace, stage: "build-code", component: "tests" }).captureTests({ command: "printf pre-accept-repaired-build", receiptRef: "receipts/build-tests-pre-accept-repaired.json", outputRef: "evidence/build-output-pre-accept-repaired.txt" });
    const buildReview = writeFormalReviewFixture({ task, stage: "build-code", snapshotTree: preAcceptImplementation.value.snapshot_tree });
    registerReviewHead(buildReview.resultRef);
    const buildCoverage = acceptanceCoverage(preAcceptTests.receipt_ref);
    const finalTaskEvidence = [
      { ref: preAcceptImplementation.ref, sha256: preAcceptImplementation.sha256 },
      { ref: preAcceptTests.receipt_ref, sha256: preAcceptTests.receipt_hash },
      { ref: preAcceptTests.output_ref, sha256: preAcceptTests.output_hash },
      { ref: buildReview.resultRef, sha256: sha256(task.readRecord(buildReview.resultRef)) },
      ...buildCoverage.items.flatMap((item) => item.evidence_refs),
    ];
    const finalTasksContent = tasksContent
      .replace("- [ ] **任务完成**", "- [x] **任务完成**")
      .replace("- **status**：`pending`", "- **status**：`completed`")
      .replace(
        "- **actual_changes**：N/A — not started",
        `- **actual_changes**：\`${JSON.stringify([
          "README.md",
          "specs/official-chain/decision-log.md",
          "specs/official-chain/plan.md",
          "specs/official-chain/spec.md",
          "src/feature.txt",
        ])}\``,
      )
      .replace("- **executed_commands**：N/A — not started", `- **executed_commands**：\`${preAcceptTests.command}\`; exit ${preAcceptTests.exit_code}`)
      .replace("- **evidence_refs**：N/A — not started", `- **evidence_refs**：\`${JSON.stringify(finalTaskEvidence)}\``)
      .replace("- **covered_ac**：N/A — not started", "- **covered_ac**：AC-01")
      .replace("- **review_fact**：N/A — not reviewed", `- **review_fact**：${buildReview.resultRef}`)
      .replace("- **completed_at**：N/A — not completed", "- **completed_at**：2026-07-29T12:00:00.000Z");
    writeFileSync(join(workspace.worktreeRoot, tasksRef), finalTasksContent);
    invoke("build-code", { implementation: preAcceptImplementation.ref, tests: preAcceptTests.receipt_ref, review: buildReview.resultRef });

    const verifyTestCaptureInput = join(inputRoots["verify-code"], "verify-test-capture.json");
    writeFileSync(verifyTestCaptureInput, `${JSON.stringify({ command: preAcceptTests.command, receipt_ref: "receipts/verify-tests.json", output_ref: "evidence/verify-output.txt" })}\n`);
    const verifyTests = run(root, repo, ["capture-tests", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${verifyTestCaptureInput}`]);
    expect(verifyTests).toMatchObject({ receipt_ref: "receipts/verify-tests.json", output_ref: "evidence/verify-output.txt", exit_code: 0 });
    const verifyQualityReview = writeFormalReviewFixture({ task, stage: "verify-code", snapshotTree: verifyTests.snapshot_tree });
    registerReviewHead(verifyQualityReview.resultRef);
    const acceptanceInput = join(inputRoots["verify-code"], "acceptance-AC-01.json");
    writeFileSync(acceptanceInput, `${JSON.stringify({ acceptance_criterion_id: "AC-01", result: "pass", refs: [{ ref: verifyTests.output_ref, sha256: verifyTests.output_hash }] })}\n`);
    for (const stage of ["build-code", "build-plan"]) {
      const rejectedStage = spawnSync(process.execPath, [runtime, "publish-acceptance-evidence", `--stage=${stage}`, "--project=Demo", "--task=official-chain", `--input=${acceptanceInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
      expect(rejectedStage.status).not.toBe(0);
      expect(rejectedStage.stderr).toMatch(/requires --stage=verify-code/i);
    }
    const badRefInput = join(inputRoots["verify-code"], "acceptance-bad-ref.json");
    writeFileSync(badRefInput, `${JSON.stringify({ acceptance_criterion_id: "AC-01", result: "pass", refs: [{ ref: "../other-task/evidence/output.txt", sha256: verifyTests.output_hash }] })}\n`);
    const rejectedRef = spawnSync(process.execPath, [runtime, "publish-acceptance-evidence", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${badRefInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedRef.status).not.toBe(0);
    expect(rejectedRef.stderr).toMatch(/canonical ref/i);
    const badHashInput = join(inputRoots["verify-code"], "acceptance-bad-hash.json");
    writeFileSync(badHashInput, `${JSON.stringify({ acceptance_criterion_id: "AC-01", result: "pass", refs: [{ ref: verifyTests.output_ref, sha256: "0".repeat(64) }] })}\n`);
    const rejectedHash = spawnSync(process.execPath, [runtime, "publish-acceptance-evidence", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${badHashInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedHash.status).not.toBe(0);
    expect(rejectedHash.stderr).toMatch(/hash mismatch/i);
    const callerPathInput = join(inputRoots["verify-code"], "acceptance-caller-path.json");
    writeFileSync(callerPathInput, `${JSON.stringify({ acceptance_criterion_id: "AC-01", result: "pass", refs: [{ ref: verifyTests.output_ref, sha256: verifyTests.output_hash }], output_ref: "evidence/caller-selected.json" })}\n`);
    const rejectedCallerPath = spawnSync(process.execPath, [runtime, "publish-acceptance-evidence", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${callerPathInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedCallerPath.status).not.toBe(0);
    expect(rejectedCallerPath.stderr).toMatch(/requires acceptance_criterion_id, result, and refs only/i);
    const acceptance = run(root, repo, ["publish-acceptance-evidence", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${acceptanceInput}`]);
    expect(acceptance).toMatchObject({ acceptance_criterion_id: "AC-01", result: "pass" });
    expect(acceptance.evidence_ref).toMatch(/^evidence\/acceptance-[a-f0-9]{64}\.json$/);
    const duplicateAcceptance = spawnSync(process.execPath, [runtime, "publish-acceptance-evidence", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${acceptanceInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(duplicateAcceptance.status).not.toBe(0);
    expect(duplicateAcceptance.stderr).toMatch(/already exists/i);
    const evidenceInput = join(inputRoots["verify-code"], "verify-evidence-refs.json");
    writeFileSync(evidenceInput, `${JSON.stringify({ refs: [{ ref: acceptance.evidence_ref, sha256: acceptance.evidence_hash }] })}\n`);
    const aggregateEvidence = run(root, repo, ["receipt", "--stage=verify-code", "--project=Demo", "--task=official-chain", "--component=evidence", `--input=${evidenceInput}`]);
    expect(aggregateEvidence).toMatchObject({ receipt_ref: "evidence/verify-evidence.json" });
    const acceptanceRaw = task.readRecord(acceptance.evidence_ref);
    const initialProof = { ref: aggregateEvidence.receipt_ref, sha256: aggregateEvidence.receipt_hash };
    const initialVerification = writeOfficialComponentReceipt({ task, stage: "verify-code", component: "verification", payload: { items: [
      ...["current_materials", "diff_scope", "risk_tests", "acceptance_criteria", "tasks_completion"].map((id) => ({ id, status: "pass", evidence_refs: [initialProof], reason: `${id} verified` })),
      { id: "browser_qa", status: "not_applicable", evidence_refs: [], reason: "no browser acceptance criterion" },
      { id: "independent_review_resolution", status: "pass", evidence_refs: [initialProof], reason: "review verified" },
      { id: "core_gaps", status: "pass", evidence_refs: [initialProof], reason: "no core gaps" },
      { id: "human_handoff", status: "pass", evidence_refs: [initialProof], reason: "handoff verified" },
    ] } });
    const originalVerify = invoke("verify-code", { tests: "receipts/verify-tests.json", review: buildReview.resultRef, quality_review: verifyQualityReview.resultRef, evidence: "evidence/verify-evidence.json", verification: initialVerification.ref });
    const prematurePassing = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${join(inputRoots["verify-code"], "verify-code-input.json")}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(prematurePassing.status).not.toBe(0);
    expect(prematurePassing.stderr).toMatch(/new active accepted build/i);
    expect(() => task.readRecord("results/verify-code/attempt-0002.json")).toThrow(/ENOENT|no such/i);
    const failureDetail = "workspace lineage failed\n";
    createTaskKernel(task).publishCanonicalRecord("evidence/workspace-lineage-failure.txt", failureDetail);
    const failureRaw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "WORKSPACE-LINEAGE", result: "fail", refs: [{ ref: "evidence/workspace-lineage-failure.txt", sha256: createHash("sha256").update(failureDetail).digest("hex") }] }, null, 2)}\n`;
    createTaskKernel(task).publishCanonicalRecord("evidence/workspace-lineage-failure.json", failureRaw);
    const controlledFailure = run(root, repo, ["publish-verify-failure", "--stage=verify-code", "--project=Demo", "--task=official-chain", "--failure-evidence=evidence/workspace-lineage-failure.json"]);
    expect(controlledFailure).toMatchObject({ attempt_ref: "attempt-0002.json", attempt: { verify_failure_publication: { failure_evidence_ref: "evidence/workspace-lineage-failure.json", active_build_accepted_ref: "results/build-code/accepted.json" } } });
    const duplicate = spawnSync(process.execPath, [runtime, "publish-verify-failure", "--stage=verify-code", "--project=Demo", "--task=official-chain", "--failure-evidence=evidence/workspace-lineage-failure.json"], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(duplicate.status).not.toBe(0);
    expect(duplicate.stderr).toMatch(/already exists/i);

    const reopen = run(root, repo, ["reopen", "--stage=build-code", "--project=Demo", "--task=official-chain", `--verify-attempt=${controlledFailure.attempt_ref}`, "--failure-evidence=evidence/workspace-lineage-failure.json"]);
    const revisedImplementation = writeOfficialComponentReceipt({
      task,
      workspace,
      stage: "build-code",
      component: "implementation",
      payload: {},
      revisionOf: preAcceptImplementation.ref,
    });
    const revisedBuildTests = createCanonicalReceiptWriter({ task, workspace, stage: "build-code", component: "tests" }).captureTests({ command: "printf revised-build", receiptRef: "receipts/build-tests-revised.json", outputRef: "evidence/build-output-revised.txt" });
    const revisedBuildReview = writeFormalReviewFixture({
      task, stage: "build-code", snapshotTree: revisedImplementation.value.snapshot_tree,
    });
    registerReviewHead(revisedBuildReview.resultRef, null, reopen.reopen_ref);
    const revisedBuildCoverage = acceptanceCoverage(revisedBuildTests.receipt_ref);
    const revisedTaskEvidence = [
      { ref: revisedImplementation.ref, sha256: sha256(task.readRecord(revisedImplementation.ref)) },
      { ref: revisedBuildTests.receipt_ref, sha256: revisedBuildTests.receipt_hash },
      { ref: revisedBuildTests.output_ref, sha256: revisedBuildTests.output_hash },
      { ref: revisedBuildReview.resultRef, sha256: sha256(task.readRecord(revisedBuildReview.resultRef)) },
      ...revisedBuildCoverage.items.flatMap((item) => item.evidence_refs),
    ];
    const revisedTasksContent = tasksContent
      .replace("- [ ] **任务完成**", "- [x] **任务完成**")
      .replace("- **status**：`pending`", "- **status**：`completed`")
      .replace(
        "- **actual_changes**：N/A — not started",
        `- **actual_changes**：\`${JSON.stringify([
          "README.md",
          "specs/official-chain/decision-log.md",
          "specs/official-chain/plan.md",
          "specs/official-chain/spec.md",
          "src/feature.txt",
        ])}\``,
      )
      .replace("- **executed_commands**：N/A — not started", `- **executed_commands**：\`${revisedBuildTests.command}\`; exit ${revisedBuildTests.exit_code}`)
      .replace("- **evidence_refs**：N/A — not started", `- **evidence_refs**：\`${JSON.stringify(revisedTaskEvidence)}\``)
      .replace("- **covered_ac**：N/A — not started", "- **covered_ac**：AC-01")
      .replace("- **review_fact**：N/A — not reviewed", `- **review_fact**：${revisedBuildReview.resultRef}`)
      .replace("- **completed_at**：N/A — not completed", "- **completed_at**：2026-07-29T12:30:00.000Z");
    writeFileSync(join(workspace.worktreeRoot, tasksRef), revisedTasksContent);
    const revisedBuildInput = join(inputRoots["build-code"], "build-code-revised-input.json");
    writeFileSync(revisedBuildInput, `${JSON.stringify({ receipts: { implementation: revisedImplementation.ref, tests: revisedBuildTests.receipt_ref, review: revisedBuildReview.resultRef }, acceptance_coverage: revisedBuildCoverage })}\n`);
    const acceptedBuild = JSON.parse(task.readRecord("results/build-code/accepted.json"));
    const acceptedBuildAttemptPath = task.recordPath(`results/build-code/${acceptedBuild.attempt_ref}`);
    const acceptedBuildAttemptRaw = readFileSync(acceptedBuildAttemptPath, "utf8");
    rmSync(acceptedBuildAttemptPath);
    const rejectedCorruptAcceptedLineage = spawnSync(process.execPath, [runtime, "run", "--stage=build-code", "--project=Demo", "--task=official-chain", `--input=${revisedBuildInput}`], { cwd: repo, env, encoding: "utf8" });
    writeFileSync(acceptedBuildAttemptPath, acceptedBuildAttemptRaw);
    expect(rejectedCorruptAcceptedLineage.status).not.toBe(0);
    expect(rejectedCorruptAcceptedLineage.stderr).toMatch(/ENOENT|no such|not found/i);
    const rejectedUncontrolledRevision = spawnSync(process.execPath, [runtime, "run", "--stage=build-code", "--project=Demo", "--task=official-chain", `--input=${revisedBuildInput}`], { cwd: repo, env, encoding: "utf8" });
    expect(rejectedUncontrolledRevision.status).not.toBe(0);
    expect(rejectedUncontrolledRevision.stderr).toMatch(/accepted build-code revision receipt requires a controlled reopen/i);
    const revisedBuild = run(root, repo, ["run", "--stage=build-code", "--project=Demo", "--task=official-chain", `--input=${revisedBuildInput}`, `--reopen=${reopen.reopen_ref}`]);

    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented\nworkspace-b\n");
    const workspaceBTests = createCanonicalReceiptWriter({ task, workspace, stage: "verify-code", component: "tests" }).captureTests({ command: "printf workspace-b-verify", receiptRef: "receipts/verify-tests-workspace-b.json", outputRef: "evidence/verify-output-workspace-b.txt" });
    const workspaceBQualityReview = writeFormalReviewFixture({ task, stage: "verify-code", snapshotTree: workspaceBTests.snapshot_tree });
    registerReviewHead(workspaceBQualityReview.resultRef);
    const workspaceBAcceptanceRaw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-01", result: "pass", refs: [{ ref: workspaceBTests.output_ref, sha256: workspaceBTests.output_hash }] }, null, 2)}\n`;
    createTaskKernel(task).publishCanonicalRecord("evidence/acceptance-AC-01-workspace-b.json", workspaceBAcceptanceRaw);
    const workspaceBEvidence = writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [{ ref: "evidence/acceptance-AC-01-workspace-b.json", sha256: createHash("sha256").update(workspaceBAcceptanceRaw).digest("hex") }] }, revisionOf: "evidence/verify-evidence.json" });
    const workspaceBInput = join(inputRoots["verify-code"], "verify-code-workspace-b-input.json");
    writeFileSync(workspaceBInput, `${JSON.stringify({ receipts: { tests: workspaceBTests.receipt_ref, review: revisedBuildReview.resultRef, quality_review: workspaceBQualityReview.resultRef, evidence: workspaceBEvidence.ref } })}\n`);
    const rejectedWorkspaceB = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${workspaceBInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedWorkspaceB.status).not.toBe(0);
    expect(rejectedWorkspaceB.stderr).toMatch(/tests, review, and current Workspace snapshot must match/i);
    expect(() => task.readRecord("results/verify-code/attempt-0003.json")).toThrow(/ENOENT|no such/i);
    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented after pre-review fix\n");

    const freshVerifyTests = createCanonicalReceiptWriter({ task, workspace, stage: "verify-code", component: "tests" }).captureTests({ command: revisedBuildTests.command, receiptRef: "receipts/verify-tests-revised.json", outputRef: "evidence/verify-output-revised.txt" });
    const freshVerifyQualityReview = writeFormalReviewFixture({
      task,
      stage: "verify-code",
      snapshotTree: freshVerifyTests.snapshot_tree,
      reviewChain: {
        version: "wh-review-chain.v1",
        round: "full",
        parent_result_ref: workspaceBQualityReview.resultRef,
        root_result_ref: workspaceBQualityReview.resultRef,
        prior_snapshot_tree: workspaceBTests.snapshot_tree,
        current_snapshot_tree: freshVerifyTests.snapshot_tree,
        response_ledger_sha256: null,
        source_diff_sha256: createHash("sha256").update(`${workspaceBTests.snapshot_tree}:${freshVerifyTests.snapshot_tree}`).digest("hex"),
      },
    });
    registerReviewHead(freshVerifyQualityReview.resultRef, workspaceBQualityReview.resultRef);
    const freshAcceptanceRaw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-01", result: "pass", refs: [{ ref: freshVerifyTests.output_ref, sha256: freshVerifyTests.output_hash }] }, null, 2)}\n`;
    createTaskKernel(task).publishCanonicalRecord("evidence/acceptance-AC-01-revised.json", freshAcceptanceRaw);
    const freshEvidence = writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [{ ref: "evidence/acceptance-AC-01-revised.json", sha256: createHash("sha256").update(freshAcceptanceRaw).digest("hex") }] }, revisionOf: "evidence/verify-evidence.json" });
    const verificationProof = { ref: freshEvidence.ref, sha256: freshEvidence.sha256 };
    const verificationReceipt = writeOfficialComponentReceipt({ task, stage: "verify-code", component: "verification", revisionOf: initialVerification.ref, payload: { items: [
      ...["current_materials", "diff_scope", "risk_tests", "acceptance_criteria", "tasks_completion"].map((id) => ({ id, status: "pass", evidence_refs: [verificationProof], reason: `${id} verified` })),
      { id: "browser_qa", status: "not_applicable", evidence_refs: [], reason: "no browser acceptance criterion" },
      { id: "independent_review_resolution", status: "pass", evidence_refs: [verificationProof], reason: "independent review verified" },
      { id: "core_gaps", status: "pass", evidence_refs: [verificationProof], reason: "no core gaps" },
      { id: "human_handoff", status: "pass", evidence_refs: [verificationProof], reason: "handoff verified" },
    ] } });
    const passingInput = join(inputRoots["verify-code"], "verify-code-passing-input.json");
    writeFileSync(passingInput, `${JSON.stringify({ receipts: { tests: freshVerifyTests.receipt_ref, review: revisedBuildReview.resultRef, quality_review: freshVerifyQualityReview.resultRef, evidence: freshEvidence.ref, verification: verificationReceipt.ref } })}\n`);
    const copiedTestRef = "receipts/verify-tests-copied.json";
    createTaskKernel(task).publishCanonicalRecord(copiedTestRef, task.readRecord(verifyTests.receipt_ref));
    const copiedTestInput = join(inputRoots["verify-code"], "verify-code-copied-test-input.json");
    writeFileSync(copiedTestInput, `${JSON.stringify({ receipts: { tests: copiedTestRef, review: revisedBuildReview.resultRef, quality_review: freshVerifyQualityReview.resultRef, evidence: freshEvidence.ref, verification: verificationReceipt.ref } })}\n`);
    const rejectedCopiedTest = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${copiedTestInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedCopiedTest.status).not.toBe(0);
    expect(rejectedCopiedTest.stderr).toMatch(/fresh test receipt content|must rerun the accepted build-code complete test command/i);
    const copiedReviewRef = "reviews/results/build-code-copied.json";
    createTaskKernel(task).publishCanonicalRecord(copiedReviewRef, task.readRecord(revisedBuildReview.resultRef));
    const copiedReviewInput = join(inputRoots["verify-code"], "verify-code-copied-review-input.json");
    writeFileSync(copiedReviewInput, `${JSON.stringify({ receipts: { tests: freshVerifyTests.receipt_ref, review: copiedReviewRef, quality_review: freshVerifyQualityReview.resultRef, evidence: freshEvidence.ref, verification: verificationReceipt.ref } })}\n`);
    const rejectedCopiedReview = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${copiedReviewInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedCopiedReview.status).not.toBe(0);
    expect(rejectedCopiedReview.stderr).toMatch(/authenticated (?:review-)?flow head|reuse the active accepted build-code final review/i);
    const copiedAcceptanceRef = "evidence/acceptance-AC-01-copied.json";
    createTaskKernel(task).publishCanonicalRecord(copiedAcceptanceRef, acceptanceRaw);
    const copiedEvidence = writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [{ ref: copiedAcceptanceRef, sha256: createHash("sha256").update(acceptanceRaw).digest("hex") }] }, revisionOf: "evidence/verify-evidence.json" });
    const copiedEvidenceInput = join(inputRoots["verify-code"], "verify-code-copied-evidence-input.json");
    writeFileSync(copiedEvidenceInput, `${JSON.stringify({ receipts: { tests: freshVerifyTests.receipt_ref, review: revisedBuildReview.resultRef, quality_review: freshVerifyQualityReview.resultRef, evidence: copiedEvidence.ref, verification: verificationReceipt.ref } })}\n`);
    const rejectedCopiedEvidence = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${copiedEvidenceInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedCopiedEvidence.status).not.toBe(0);
    expect(rejectedCopiedEvidence.stderr).toMatch(/fresh acceptance evidence content/i);
    const wrongCriterionRaw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-2", result: "pass", refs: [{ ref: freshVerifyTests.output_ref, sha256: freshVerifyTests.output_hash }] }, null, 2)}\n`;
    createTaskKernel(task).publishCanonicalRecord("evidence/acceptance-AC-2-revised.json", wrongCriterionRaw);
    const wrongCriterionEvidence = writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [{ ref: "evidence/acceptance-AC-2-revised.json", sha256: createHash("sha256").update(wrongCriterionRaw).digest("hex") }] }, revisionOf: "evidence/verify-evidence.json" });
    const wrongCriterionInput = join(inputRoots["verify-code"], "verify-code-wrong-criterion-input.json");
    writeFileSync(wrongCriterionInput, `${JSON.stringify({ receipts: { tests: freshVerifyTests.receipt_ref, review: revisedBuildReview.resultRef, quality_review: freshVerifyQualityReview.resultRef, evidence: wrongCriterionEvidence.ref, verification: verificationReceipt.ref } })}\n`);
    const rejectedCriterionSet = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${wrongCriterionInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedCriterionSet.status).not.toBe(0);
    expect(rejectedCriterionSet.stderr).toMatch(/criterion set (?:does not match|differs)/i);
    expect(() => task.readRecord("results/verify-code/attempt-0003.json")).toThrow(/ENOENT|no such/i);
    const rejectedInput = join(inputRoots["verify-code"], "verify-code-rejected-input.json");
    writeFileSync(rejectedInput, `${JSON.stringify({ receipts: { tests: freshVerifyTests.receipt_ref, review: buildReview.resultRef, quality_review: freshVerifyQualityReview.resultRef, evidence: freshEvidence.ref, verification: verificationReceipt.ref } })}\n`);
    const rejectedBinding = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${rejectedInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedBinding.status).not.toBe(0);
    expect(rejectedBinding.stderr).toMatch(/authenticated (?:review-)?flow head|reuse the active accepted build-code final review/i);
    expect(() => task.readRecord("results/verify-code/attempt-0003.json")).toThrow(/ENOENT|no such/i);
    const failedAcceptanceRaw = `${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-01", result: "fail", refs: [{ ref: freshVerifyTests.output_ref, sha256: freshVerifyTests.output_hash }] }, null, 2)}\n`;
    createTaskKernel(task).publishCanonicalRecord("evidence/acceptance-AC-01-revised-fail.json", failedAcceptanceRaw);
    const failedEvidence = writeOfficialComponentReceipt({ task, stage: "verify-code", component: "evidence", payload: { refs: [{ ref: "evidence/acceptance-AC-01-revised-fail.json", sha256: createHash("sha256").update(failedAcceptanceRaw).digest("hex") }] }, revisionOf: "evidence/verify-evidence.json" });
    const failedInput = join(inputRoots["verify-code"], "verify-code-failed-input.json");
    writeFileSync(failedInput, `${JSON.stringify({ receipts: { tests: freshVerifyTests.receipt_ref, review: revisedBuildReview.resultRef, quality_review: freshVerifyQualityReview.resultRef, evidence: failedEvidence.ref, verification: verificationReceipt.ref } })}\n`);
    const rejectedFailure = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${failedInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedFailure.status).not.toBe(0);
    expect(rejectedFailure.stderr).toMatch(/result=pass/i);
    expect(() => task.readRecord("results/verify-code/attempt-0003.json")).toThrow(/ENOENT|no such/i);
    const staleTestInput = join(inputRoots["verify-code"], "verify-code-stale-test-input.json");
    writeFileSync(staleTestInput, `${JSON.stringify({ receipts: { tests: verifyTests.receipt_ref, review: revisedBuildReview.resultRef, quality_review: freshVerifyQualityReview.resultRef, evidence: freshEvidence.ref, verification: verificationReceipt.ref } })}\n`);
    const rejectedReceipt = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${staleTestInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedReceipt.status).not.toBe(0);
    expect(rejectedReceipt.stderr).toMatch(/fresh test receipt content|must rerun the accepted build-code complete test command/i);
    expect(() => task.readRecord("results/verify-code/attempt-0003.json")).toThrow(/ENOENT|no such/i);
    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented\ndrift\n");
    const rejectedDrift = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${passingInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedDrift.status).not.toBe(0);
    expect(rejectedDrift.stderr).toMatch(/Workspace snapshot must match|quality review does not bind the current verification snapshot/i);
    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented after pre-review fix\n");
    expect(() => task.readRecord("results/verify-code/attempt-0003.json")).toThrow(/ENOENT|no such/i);
    const acceptedVerifyRaw = task.readRecord("results/verify-code/accepted.json");
    const acceptedVerify = JSON.parse(acceptedVerifyRaw);
    writeFileSync(task.recordPath("results/verify-code/accepted.json"), `${JSON.stringify({ ...acceptedVerify, integrity_hash: "0".repeat(64) }, null, 2)}\n`);
    const rejectedTamper = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${passingInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedTamper.status).not.toBe(0);
    expect(rejectedTamper.stderr).toMatch(/accepted integrity hash mismatch/i);
    writeFileSync(task.recordPath("results/verify-code/accepted.json"), acceptedVerifyRaw);
    expect(() => task.readRecord("results/verify-code/attempt-0003.json")).toThrow(/ENOENT|no such/i);
    const activeBuildAcceptedRaw = task.readRecord("results/build-code/accepted.json");
    const activeBuildAccepted = JSON.parse(activeBuildAcceptedRaw);
    const activeBuildAttemptRef = `results/build-code/${activeBuildAccepted.attempt_ref}`;
    const activeBuildAttemptRaw = task.readRecord(activeBuildAttemptRef);
    const activeBuildAttempt = JSON.parse(activeBuildAttemptRaw);
    const tamperedBuildAttemptRaw = `${JSON.stringify({ ...activeBuildAttempt, reopen_provenance: { ...activeBuildAttempt.reopen_provenance, verify_failure_hash: "0".repeat(64) } }, null, 2)}\n`;
    writeFileSync(task.recordPath(activeBuildAttemptRef), tamperedBuildAttemptRaw);
    writeFileSync(task.recordPath("results/build-code/accepted.json"), `${JSON.stringify({ ...activeBuildAccepted, integrity_hash: createHash("sha256").update(tamperedBuildAttemptRaw).digest("hex") }, null, 2)}\n`);
    const rejectedBuildLineage = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${passingInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedBuildLineage.status).not.toBe(0);
    expect(rejectedBuildLineage.stderr).toMatch(/active build reopen provenance mismatch/i);
    writeFileSync(task.recordPath(activeBuildAttemptRef), activeBuildAttemptRaw);
    writeFileSync(task.recordPath("results/build-code/accepted.json"), activeBuildAcceptedRaw);
    expect(() => task.readRecord("results/verify-code/attempt-0003.json")).toThrow(/ENOENT|no such/i);
    const revisedReviewRaw = task.readRecord(revisedBuildReview.resultRef);
    const revisedReviewValue = JSON.parse(revisedReviewRaw);
    const freshAcceptanceHash = createHash("sha256").update(freshAcceptanceRaw).digest("hex");
    const verifyAuditFacts = writeCanonicalAuditSummary({ task, workspace, stage: "verify-code" });
    const officialArtifacts = {
      read: (name) => readFileSync(join(workspace.worktreeRoot, "specs", "official-chain", name), "utf8"),
    };
    const injectedKernel = createTaskKernel(task, {
      workspace,
      artifacts: officialArtifacts,
      attemptPublicationTestHooks: { afterOpenBeforeRename() { throw new Error("injected passing attempt write failure"); } },
    });
    expect(() => injectedKernel.publishVerifyPassingFromAccepted({
      facts: {
        tests: { command: freshVerifyTests.command, exit_code: freshVerifyTests.exit_code, command_hash: freshVerifyTests.command_hash, snapshot_head: freshVerifyTests.snapshot_head, snapshot_tree: freshVerifyTests.snapshot_tree, snapshot_commit: freshVerifyTests.snapshot_commit, started_at: freshVerifyTests.started_at, completed_at: freshVerifyTests.completed_at, receipt_ref: freshVerifyTests.receipt_ref, receipt_hash: freshVerifyTests.receipt_hash, output_ref: freshVerifyTests.output_ref, output_hash: freshVerifyTests.output_hash },
        review: { verdict: revisedReviewValue.verdict, result_ref: revisedBuildReview.resultRef, result_hash: createHash("sha256").update(revisedReviewRaw).digest("hex"), snapshot_tree: revisedReviewValue.snapshot_tree, subject_kind: "worktree", phase_id: null, review_scope: "integration" },
        evidence_refs: [{ ref: "evidence/acceptance-AC-01-revised.json", sha256: freshAcceptanceHash }],
        audit_contract_version: verifyAuditFacts.audit_contract_version,
        audit_summary_ref: verifyAuditFacts.audit_summary_ref,
        audit_summary_hash: verifyAuditFacts.audit_summary_hash,
        audit_verdict: verifyAuditFacts.audit_verdict,
        content_evidence_refs: verifyAuditFacts.content_evidence_refs,
      },
      evidenceRefs: [
        { ref: freshVerifyTests.receipt_ref, sha256: freshVerifyTests.receipt_hash },
        { ref: revisedBuildReview.resultRef, sha256: createHash("sha256").update(revisedReviewRaw).digest("hex") },
        { ref: freshEvidence.ref, sha256: createHash("sha256").update(task.readRecord(freshEvidence.ref)).digest("hex") },
        { ref: "evidence/acceptance-AC-01-revised.json", sha256: freshAcceptanceHash },
        { ref: freshVerifyTests.output_ref, sha256: freshVerifyTests.output_hash },
      ],
    })).toThrow(/injected passing attempt write failure/i);
    expect(() => task.readRecord("results/verify-code/attempt-0003.json")).toThrow(/ENOENT|no such/i);
    for (let sequence = 3; sequence <= 8; sequence += 1) {
      const ref = `attempt-${String(sequence).padStart(4, "0")}.json`;
      const filler = structuredClone(controlledFailure.attempt);
      filler.attempt_id = `verify-code:${ref.slice(0, -5)}`;
      delete filler.verify_failure_publication;
      writeFileSync(task.recordPath(`results/verify-code/${ref}`), `${JSON.stringify(filler, null, 2)}\n`);
    }
    const passing = run(root, repo, ["publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${passingInput}`]);
    expect(passing).toMatchObject({ attempt_ref: "attempt-0009.json", attempt: { verify_passing_publication: { previous_accepted_ref: "results/verify-code/accepted.json", active_build_attempt_ref: revisedBuild.attempt_ref, test_receipt_ref: freshVerifyTests.receipt_ref, review_result_ref: revisedBuildReview.resultRef, workspace_head: freshVerifyTests.snapshot_head, workspace_tree: freshVerifyTests.snapshot_tree } } });
    expect(JSON.parse(task.readRecord("results/verify-code/accepted.json"))).toMatchObject({ attempt_ref: "attempt-0001.json" });
    const duplicatePassing = spawnSync(process.execPath, [runtime, "publish-verify-passing", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--input=${passingInput}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(duplicatePassing.status).not.toBe(0);
    expect(duplicatePassing.stderr).toMatch(/already exists/i);

    const workspaceBAcceptanceHash = createHash("sha256").update(workspaceBAcceptanceRaw).digest("hex");
    const workspaceBAttempt = structuredClone(passing.attempt);
    workspaceBAttempt.attempt_id = "verify-code:attempt-0010";
    workspaceBAttempt.facts = {
      tests: { command: workspaceBTests.command, exit_code: workspaceBTests.exit_code, command_hash: workspaceBTests.command_hash, snapshot_head: workspaceBTests.snapshot_head, snapshot_tree: workspaceBTests.snapshot_tree, snapshot_commit: workspaceBTests.snapshot_commit, started_at: workspaceBTests.started_at, completed_at: workspaceBTests.completed_at, receipt_ref: workspaceBTests.receipt_ref, receipt_hash: workspaceBTests.receipt_hash, output_ref: workspaceBTests.output_ref, output_hash: workspaceBTests.output_hash },
      review: { verdict: revisedReviewValue.verdict, result_ref: revisedBuildReview.resultRef, result_hash: createHash("sha256").update(revisedReviewRaw).digest("hex"), snapshot_tree: revisedReviewValue.snapshot_tree, subject_kind: "worktree", phase_id: null, review_scope: "integration" },
      evidence_refs: [{ ref: "evidence/acceptance-AC-01-workspace-b.json", sha256: workspaceBAcceptanceHash }],
      audit_contract_version: passing.attempt.facts.audit_contract_version,
      audit_summary_ref: passing.attempt.facts.audit_summary_ref,
      audit_summary_hash: passing.attempt.facts.audit_summary_hash,
      audit_verdict: passing.attempt.facts.audit_verdict,
      content_evidence_refs: structuredClone(passing.attempt.facts.content_evidence_refs),
    };
    workspaceBAttempt.evidence_refs = [];
    workspaceBAttempt.verify_passing_publication = {
      ...workspaceBAttempt.verify_passing_publication,
      test_receipt_ref: workspaceBTests.receipt_ref,
      test_receipt_hash: workspaceBTests.receipt_hash,
      review_result_ref: revisedBuildReview.resultRef,
      review_result_hash: workspaceBAttempt.facts.review.result_hash,
      acceptance_evidence_refs: structuredClone(workspaceBAttempt.facts.evidence_refs),
      workspace_head: workspaceBTests.snapshot_head,
      workspace_tree: workspaceBTests.snapshot_tree,
    };
    writeFileSync(task.recordPath("results/verify-code/attempt-0010.json"), `${JSON.stringify(workspaceBAttempt, null, 2)}\n`);
    const workspaceBConfirmation = run(root, repo, ["confirm", "--stage=verify-code", "--project=Demo", "--task=official-chain", "--attempt=attempt-0010.json", "--decision=accepted"]);
    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented\nworkspace-b\n");
    const rejectedWorkspaceBAccept = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", "--attempt=attempt-0010.json", `--human-confirmation-ref=${workspaceBConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedWorkspaceBAccept.status).not.toBe(0);
    expect(rejectedWorkspaceBAccept.stderr).toMatch(/Workspace binding changed/i);
    expect(JSON.parse(task.readRecord("results/verify-code/accepted.json"))).toMatchObject({ attempt_ref: "attempt-0001.json" });
    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented after pre-review fix\n");

    const failureConfirmation = run(root, repo, ["confirm", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${controlledFailure.attempt_ref}`, "--decision=accepted"]);
    const rejectedFailureAccept = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${controlledFailure.attempt_ref}`, `--human-confirmation-ref=${failureConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedFailureAccept.status).not.toBe(0);
    expect(rejectedFailureAccept.stderr).toMatch(/accepted and closed/i);

    const passingConfirmation = run(root, repo, ["confirm", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, "--decision=accepted"]);
    const rejectedConfirmation = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${originalVerify.accepted.human_confirmation_ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedConfirmation.status).not.toBe(0);
    expect(rejectedConfirmation.stderr).toMatch(/does not bind/i);

    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented after pre-review fix\naccept drift\n");
    const rejectedAcceptDrift = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${passingConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedAcceptDrift.status).not.toBe(0);
    expect(rejectedAcceptDrift.stderr).toMatch(/Workspace binding changed/i);
    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented after pre-review fix\n");

    const buildCanonicalBeforeAccept = task.readRecord("results/build-code/accepted.json");
    const buildCanonical = JSON.parse(buildCanonicalBeforeAccept);
    writeFileSync(task.recordPath("results/build-code/accepted.json"), `${JSON.stringify({ ...buildCanonical, integrity_hash: "0".repeat(64) }, null, 2)}\n`);
    const rejectedBuildAccept = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${passingConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedBuildAccept.status).not.toBe(0);
    expect(rejectedBuildAccept.stderr).toMatch(/build-code accepted integrity hash mismatch/i);
    writeFileSync(task.recordPath("results/build-code/accepted.json"), buildCanonicalBeforeAccept);

    const priorBuildCanonical = task.readRecord("results/build-code/accepted-attempt-0001.json");
    writeFileSync(task.recordPath("results/build-code/accepted.json"), priorBuildCanonical);
    const rejectedDifferentActiveBuild = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${passingConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedDifferentActiveBuild.status).not.toBe(0);
    expect(rejectedDifferentActiveBuild.stderr).toMatch(/upstream lineage changed|binding changed|active build lineage/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(acceptedVerifyRaw);
    writeFileSync(task.recordPath("results/build-code/accepted.json"), buildCanonicalBeforeAccept);

    const verifyCanonicalBeforeAccept = task.readRecord("results/verify-code/accepted.json");
    const freshTestRaw = task.readRecord(freshVerifyTests.receipt_ref);
    writeFileSync(task.recordPath(freshVerifyTests.receipt_ref), `${freshTestRaw}drift`);
    const rejectedTestMaterial = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${passingConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedTestMaterial.status).not.toBe(0);
    expect(rejectedTestMaterial.stderr).toMatch(/test receipt changed/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(verifyCanonicalBeforeAccept);
    writeFileSync(task.recordPath(freshVerifyTests.receipt_ref), freshTestRaw);

    const revisedReviewMaterialRaw = task.readRecord(revisedBuildReview.resultRef);
    writeFileSync(task.recordPath(revisedBuildReview.resultRef), `${revisedReviewMaterialRaw}drift`);
    const rejectedReviewMaterial = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${passingConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedReviewMaterial.status).not.toBe(0);
    expect(rejectedReviewMaterial.stderr).toMatch(/review (?:result|quality fact) changed/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(verifyCanonicalBeforeAccept);
    writeFileSync(task.recordPath(revisedBuildReview.resultRef), revisedReviewMaterialRaw);

    const freshEvidenceRaw = task.readRecord("evidence/acceptance-AC-01-revised.json");
    writeFileSync(task.recordPath("evidence/acceptance-AC-01-revised.json"), `${freshEvidenceRaw}drift`);
    const rejectedAcceptanceMaterial = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${passingConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedAcceptanceMaterial.status).not.toBe(0);
    expect(rejectedAcceptanceMaterial.stderr).toMatch(/acceptance evidence hash mismatch/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(verifyCanonicalBeforeAccept);
    writeFileSync(task.recordPath("evidence/acceptance-AC-01-revised.json"), freshEvidenceRaw);

    const verifyArchiveRef = "results/verify-code/accepted-attempt-0001.json";
    const criticalDriftKernel = createTaskKernel(task, { workspace, artifacts: officialArtifacts, acceptedReplacementTestHooks: { afterRevalidateBeforeRename() { writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented after pre-review fix\ncritical-drift\n"); } } });
    expect(() => criticalDriftKernel.acceptAttempt("verify-code", passing.attempt_ref, passingConfirmation.ref)).toThrow(/Workspace binding changed|active accepted build tests\/review snapshot/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(verifyCanonicalBeforeAccept);
    expect(createTaskKernel(task).readAccepted("verify-code").accepted.attempt_ref).toBe("attempt-0001.json");
    expect(task.readRecord(verifyArchiveRef)).toBe(verifyCanonicalBeforeAccept);
    writeFileSync(join(workspace.worktreeRoot, "src", "feature.txt"), "implemented after pre-review fix\n");

    const criticalBuildDriftKernel = createTaskKernel(task, { workspace, artifacts: officialArtifacts, acceptedReplacementTestHooks: { afterRevalidateBeforeRename() { writeFileSync(task.recordPath("results/build-code/accepted.json"), priorBuildCanonical); } } });
    expect(() => criticalBuildDriftKernel.acceptAttempt("verify-code", passing.attempt_ref, passingConfirmation.ref)).toThrow(/binding changed|active build lineage/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(verifyCanonicalBeforeAccept);
    expect(task.readRecord(verifyArchiveRef)).toBe(verifyCanonicalBeforeAccept);
    writeFileSync(task.recordPath("results/build-code/accepted.json"), buildCanonicalBeforeAccept);

    const criticalCanonicalDriftKernel = createTaskKernel(task, { workspace, artifacts: officialArtifacts, acceptedReplacementTestHooks: { afterRevalidateBeforeRename() { writeFileSync(task.recordPath("results/verify-code/accepted.json"), "critical canonical drift\n"); } } });
    expect(() => criticalCanonicalDriftKernel.acceptAttempt("verify-code", passing.attempt_ref, passingConfirmation.ref)).toThrow(/compare-and-swap|canonical/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe("critical canonical drift\n");
    expect(task.readRecord(verifyArchiveRef)).toBe(verifyCanonicalBeforeAccept);
    writeFileSync(task.recordPath("results/verify-code/accepted.json"), verifyCanonicalBeforeAccept);

    const passingAttemptPath = `results/verify-code/${passing.attempt_ref}`;
    const passingAttemptRaw = task.readRecord(passingAttemptPath);
    const criticalAttemptDriftKernel = createTaskKernel(task, { workspace, artifacts: officialArtifacts, acceptedReplacementTestHooks: { afterRevalidateBeforeRename() { writeFileSync(task.recordPath(passingAttemptPath), `${passingAttemptRaw}drift`); } } });
    expect(() => criticalAttemptDriftKernel.acceptAttempt("verify-code", passing.attempt_ref, passingConfirmation.ref)).toThrow(/attempt changed|invalid verify-code attempt/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(verifyCanonicalBeforeAccept);
    expect(task.readRecord(verifyArchiveRef)).toBe(verifyCanonicalBeforeAccept);
    writeFileSync(task.recordPath(passingAttemptPath), passingAttemptRaw);

    const passingConfirmationRaw = task.readRecord(passingConfirmation.ref);
    const criticalConfirmationDriftKernel = createTaskKernel(task, { workspace, artifacts: officialArtifacts, acceptedReplacementTestHooks: { afterRevalidateBeforeRename() { writeFileSync(task.recordPath(passingConfirmation.ref), `${passingConfirmationRaw}drift`); } } });
    expect(() => criticalConfirmationDriftKernel.acceptAttempt("verify-code", passing.attempt_ref, passingConfirmation.ref)).toThrow(/confirmation changed|invalid human confirmation/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(verifyCanonicalBeforeAccept);
    expect(task.readRecord(verifyArchiveRef)).toBe(verifyCanonicalBeforeAccept);
    writeFileSync(task.recordPath(passingConfirmation.ref), passingConfirmationRaw);

    writeFileSync(task.recordPath("results/verify-code/accepted-attempt-0001.json"), "occupied archive\n");
    const collisionRef = `results/verify-code/accepted-attempt-0001-canonical-${createHash("sha256").update(verifyCanonicalBeforeAccept).digest("hex")}.json`;
    writeFileSync(task.recordPath(collisionRef), "occupied collision archive\n");
    const rejectedArchiveCollision = spawnSync(process.execPath, [runtime, "accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${passingConfirmation.ref}`], { cwd: repo, env: { ...process.env, HOME: root, WORKFLOWHUB_TASK_DIR: root }, encoding: "utf8" });
    expect(rejectedArchiveCollision.status).not.toBe(0);
    expect(rejectedArchiveCollision.stderr).toMatch(/collision archive conflicts/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(verifyCanonicalBeforeAccept);
    writeFileSync(task.recordPath(collisionRef), verifyCanonicalBeforeAccept);

    const injectedAcceptKernel = createTaskKernel(task, { workspace, artifacts: officialArtifacts, acceptedReplacementTestHooks: { beforeDirectoryFsync() { throw new Error("injected accepted replacement failure"); } } });
    expect(() => injectedAcceptKernel.acceptAttempt("verify-code", passing.attempt_ref, passingConfirmation.ref)).toThrow(/injected accepted replacement failure/i);
    expect(task.readRecord("results/verify-code/accepted.json")).toBe(verifyCanonicalBeforeAccept);

    const acceptedRevalidation = run(root, repo, ["accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${passingConfirmation.ref}`]);
    expect(acceptedRevalidation).toMatchObject({ attempt_ref: passing.attempt_ref, human_confirmation_ref: passingConfirmation.ref });
    expect(JSON.parse(task.readRecord("results/verify-code/accepted.json"))).toMatchObject({ attempt_ref: passing.attempt_ref });
    expect(task.readRecord(collisionRef)).toBe(verifyCanonicalBeforeAccept);
    expect(run(root, repo, ["accept", "--stage=verify-code", "--project=Demo", "--task=official-chain", `--attempt=${passing.attempt_ref}`, `--human-confirmation-ref=${passingConfirmation.ref}`])).toEqual(acceptedRevalidation);
    for (const stage of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) {
      expect(JSON.parse(task.readRecord(`results/${stage}/accepted.json`))).toMatchObject({ schema_version: "task-accepted.v2", task_id: "official-chain", stage });
    }
    const linked = workspace.worktreeRoot;
    expect(readFileSync(join(linked, "src", "feature.txt"), "utf8")).toBe("implemented after pre-review fix\n");
    for (const name of ["spec.md", "plan.md", "tasks.md"]) expect(existsSync(join(linked, "specs", "official-chain", name))).toBe(true);
    expect(existsSync(join(repo, "src", "feature.txt"))).toBe(false);
    expect(existsSync(join(repo, "specs", "official-chain"))).toBe(false);
    expect(execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim()).toBe(baseline);
    expect(execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: repo, encoding: "utf8" }).trim()).toBe(mainStatus);
  });
});
