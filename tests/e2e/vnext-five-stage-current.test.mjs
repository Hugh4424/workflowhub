import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { runStage } from "../../runtime/stage/stage-runner.mjs";
import { captureGitWorktreeSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { createStageContentEvidenceWriter, readLatestStageContentEvidence } from "../../runtime/evidence/stage-content-evidence.mjs";
import { buildDecisionCoverageAudit } from "../../runtime/stage/stage-content-contracts.mjs";
import { writeOfficialComponentReceipt } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { writeFormalReviewFixture } from "../helpers/formal-review.mjs";

const roots = [];
const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const materials = ["decision-log.md", "spec.md", "plan.md", "tasks.md"];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
function currentRef(value) {
  return typeof value === "string"
    ? value.replace(/^receipts\/tests\//, "quality/tests/").replace(/^evidence\/test-output\//, "quality/tests\/output\/").replace(/^receipts\/(decision|spec|plan|tasks|implementation|verification)\.json$/, "quality/evidence/$1.json").replace(/^reviews\//, "quality/reviews/").replace(/^evidence\/confirmations\//, "quality/confirmations/")
    : value;
}
function currentValue(value) {
  if (Array.isArray(value)) return value.map(currentValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, currentValue(child)]));
  return currentRef(value);
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

function record(state, ref, value) {
  const finalRef = currentRef(ref);
  const raw = `${JSON.stringify(currentValue(value), null, 2)}\n`;
  state.kernel.publishCanonicalRecord(finalRef, raw);
  return { ref: finalRef, sha256: sha256(raw) };
}

function fixture(taskId, { materialFiles = materials } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-current-five-stage-")));
  roots.push(root);
  const repo = join(root, "repo");
  const home = join(root, "home");
  mkdirSync(repo);
  mkdirSync(home);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub Tests"]);
  git(["config", "user.email", "tests@workflowhub.local"]);
  mkdirSync(join(repo, "src"));
  writeFileSync(join(repo, "src", "app.txt"), "baseline\n");
  git(["add", "."]);
  git(["commit", "-qm", "base"]);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0", project_name: "WorkflowHub", task_id: taskId,
      created_at: "2026-08-04T00:00:00Z", target_repo_root: repo, issue_ids: [], inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const candidate = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  for (const file of materialFiles) artifacts.writeAtomic(file, `# ${file}\n`);
  return { root, home, repo, task, candidate, artifacts, kernel: createTaskKernel(task, { candidateWorkspace: candidate }) };
}

function context(stage, state) {
  return {
    stage, task: state.task, kernel: state.kernel, identity: state.task.identity,
    workflowRunId: state.kernel.deriveStageWorkflowRunId(stage), manifest: state.task.manifest,
    candidateWorkspace: state.candidate,
  };
}

function publicStatus(state, stage) {
  const runtime = join(process.cwd(), "tools", "cli", "stage-runtime.mjs");
  const result = spawnSync(process.execPath, [
    runtime, "status", "--action=begin", `--stage=${stage}`, "--project=WorkflowHub",
    `--task=${state.task.identity.taskId}`, "--reason=public-current-stage",
  ], {
    cwd: state.repo,
    env: { ...process.env, HOME: state.home, WORKFLOWHUB_TASK_DIR: state.root },
    encoding: "utf8",
  });
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout);
}

function publicRun(state, stage, input) {
  const runtime = join(process.cwd(), "tools", "cli", "stage-runtime.mjs");
  const inputPath = join(state.root, `public-${stage}-input.json`);
  writeFileSync(inputPath, `${JSON.stringify(input)}\n`);
  const result = spawnSync(process.execPath, [
    runtime, "run", "--action=execute", `--stage=${stage}`, "--project=WorkflowHub",
    `--task=${state.task.identity.taskId}`, `--input=${inputPath}`,
  ], {
    cwd: state.repo,
    env: { ...process.env, HOME: state.home, WORKFLOWHUB_TASK_DIR: state.root },
    encoding: "utf8",
  });
  expect(result.status, `${stage}: ${result.stdout}\n${result.stderr}`).toBe(0);
  return JSON.parse(result.stdout);
}

function publicConfirm(state, stage) {
  const runtime = join(process.cwd(), "tools", "cli", "stage-runtime.mjs");
  const result = spawnSync(process.execPath, [
    runtime, "confirm", "--action=decision", `--stage=${stage}`, "--project=WorkflowHub",
    `--task=${state.task.identity.taskId}`, "--decision=accepted",
  ], {
    cwd: state.repo,
    env: { ...process.env, HOME: state.home, WORKFLOWHUB_TASK_DIR: state.root },
    encoding: "utf8",
  });
  expect(result.status, `${stage}: ${result.stdout}\n${result.stderr}`).toBe(0);
  return JSON.parse(result.stdout);
}

function publicTestReceipt(state, stage, snapshot, suffix = "") {
  const output = `${stage} public route passed\n`;
  const outputRef = currentRef(`evidence/test-output/public-${stage}${suffix}.txt`);
  state.kernel.publishCanonicalRecord(outputRef, output);
  return record(state, `receipts/tests/public-${stage}${suffix}.json`, {
    schema_version: "workflowhub-receipt.v1", task_id: state.task.identity.taskId, stage,
    producer: { stage, component: "tests", version: "1.0.0" },
    command: "public-stage-test", command_hash: sha256("public-stage-test"), exit_code: 0,
    source_digest: snapshot.source_digest, snapshot_head: snapshot.head,
    snapshot_tree: snapshot.tree, snapshot_commit: snapshot.commit,
    started_at: "2026-08-04T00:00:00.000Z", completed_at: "2026-08-04T00:00:01.000Z",
    output_ref: outputRef, output_hash: sha256(output),
  });
}

function publicPlanFixture(taskProofHash = "a".repeat(64)) {
  const plan = `# Plan

## Technical Context
Node.js and Vitest.

## Global Constraints
Keep the public stage route observable.

## Modules, Interfaces, and Data Contracts
The stage runtime owns publication.

## Implementation Order
Phase 1 then verification.

## Test Strategy
Run the public route test.

## Rollback and Recovery
Revert the fixture implementation.

## FR to AC to Step Traceability
FR-1 -> AC-1 -> T001/T002.

## Constitution Check
F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 Q1 Q2 Q3 S1 S2 S3 S4 S5 S6 S7 S8.

## Complexity Trade-offs
Use one fixture task and no extra runtime path.

## Phase 1
### Goal
Cover one public stage route.
### Files
- **MODIFY**: \`src/app.txt\`
### Tasks
T001 RED then T002 GREEN.
### Verify
\`npx vitest run tests/e2e/vnext-five-stage-current.test.mjs\`
### Knowledge
The public stage runtime is the executable entry point.
### STOP
Stop on a route or snapshot mismatch.
`;
  const task = (id, role, dependency, expectedExit) => `#### ${id} — ${role} public route
- **ID**：${id}
- **动作**：Exercise the public stage route.
- **精确文件**：\`src/app.txt\`
- **输入**：FR-1
- **输出**：AC-1
- **依赖**：${dependency}
- **并行**：否
- **FR**：FR-1
- **AC**：AC-1
- **gate_cmd**：\`npx vitest run tests/e2e/vnext-five-stage-current.test.mjs\`
- **expected_exit**：${expectedExit}
- **oracle**：ORACLE-PUBLIC-ROUTE — the stage publishes current quality facts.
- **evidence_path**：evidence/public-${id}.json
- **verification_role**：${role}
- **paired_task**：${role === "RED" ? "T002" : "T001"}
- **actual_changes**：public route fixture implementation
- **executed_commands**：public stage runtime
- **evidence_refs**：\`[{"ref":"evidence/public-task-proof.json","sha256":"${taskProofHash}"}]\`
- **covered_ac**：AC-1
- **review_fact**：public route review fact
- **completed_at**：2026-08-04T00:00:01.000Z

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：\`completed\`
`;
  return { plan, tasks: `# Tasks\n\n${task("T001", "RED", "none", 1)}\n${task("T002", "GREEN", "T001", 0)}` };
}

function publicAcceptanceEvidence(state, snapshot, proof) {
  const leaf = record(state, "evidence/public-AC-1.json", {
    schema_version: "acceptance-evidence.v1",
    acceptance_criterion_id: "AC-1", result: "pass",
    refs: [{ ref: proof.ref, sha256: proof.sha256 }], snapshot_tree: snapshot.tree,
    summary: { scenario: "public route", oracle: "stage completes", actual_outcome: "pass", evidence_type: "test" },
  });
  return writeOfficialComponentReceipt({
    task: state.task, stage: "verify-code", component: "evidence", payload: { refs: [leaf] },
  });
}

function publicVerificationReceipt(state, proof) {
  const ids = [
    "current_materials", "diff_scope", "risk_tests", "acceptance_criteria", "tasks_completion",
    "browser_qa", "independent_review_resolution", "core_gaps", "human_handoff",
  ];
  return writeOfficialComponentReceipt({
    task: state.task, stage: "verify-code", component: "verification",
    payload: { items: ids.map((id) => ({ id, status: "pass", evidence_refs: [proof], reason: "public route fixture evidence" })) },
  });
}

function evidence(state, stage, { testExit = 0, review = "pass", confirm = true, suffix = "" } = {}) {
  const snapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
  const materialRevision = `revision-${sha256(JSON.stringify(materials.map((file) => [file, state.artifacts.read(file)])))}`;
  const refs = [];
  if (["make-decision", "build-code", "verify-code"].includes(stage)) {
    const outputRef = currentRef(`evidence/test-output/${stage}-${testExit}${suffix}.txt`);
    const output = `${testExit === 0 ? "pass" : "fail"}\n`;
    state.kernel.publishCanonicalRecord(outputRef, output);
    refs.push(record(state, `receipts/tests/${stage}-${testExit}${suffix}.json`, {
      schema_version: "workflowhub-receipt.v1", task_id: state.task.identity.taskId, stage,
      producer: { stage, component: "current-five-stage-test", version: "1.0.0" },
      command: testExit === 0 ? "true" : "false", command_hash: "a".repeat(64), exit_code: testExit,
      material_revision: materialRevision, source_digest: snapshot.source_digest,
      snapshot_head: snapshot.head, snapshot_tree: snapshot.tree, snapshot_commit: snapshot.commit,
      started_at: "2026-08-04T00:00:00.000Z", completed_at: "2026-08-04T00:00:01.000Z",
      output_ref: outputRef, output_hash: sha256(output),
    }));
  }
  const reviewRef = `reviews/${review === "pass" ? "results" : "attempts"}/${stage}-${review}${suffix}.json`;
  const reviewValue = review === "unavailable"
    ? {
        version: "wh-review-attempt.v1", attempt_id: `${stage}-unavailable${suffix}`,
        task_id: state.task.identity.taskId, stage, review_track: stage === "make-decision" ? "direction" : null,
        subject_kind: "worktree", phase_id: null, review_scope: stage === "build-code" ? "integration" : null, snapshot_tree: snapshot.tree,
        material_id: "b".repeat(64), provider_attempts: [], terminal_status: "unavailable",
        error: { code: "PROVIDER_UNAVAILABLE", message: "fixture provider unavailable" },
      }
    : {
        version: "wh-review-result.v1", task_id: state.task.identity.taskId, stage,
        review_track: stage === "make-decision" ? "direction" : null, subject_kind: "worktree",
        phase_id: null, review_scope: stage === "build-code" ? "integration" : null,
        source: { target_commit: snapshot.head, base_commit: snapshot.head, base_tree: snapshot.tree, captured_head: snapshot.head },
        snapshot_tree: snapshot.tree, material_id: "b".repeat(64), attempt_ref: `reviews/attempts/${stage}-pass${suffix}/attempt.json`,
        provider_results: [{ provider: "fixture", output: { verdict: "pass", summary: "current fixture review", findings: [] } }],
        verdict: review === "pass" ? "pass" : "invalid", findings: [],
      };
  refs.push(record(state, reviewRef, reviewValue));
  if (["make-decision", "build-plan", "verify-code"].includes(stage) && confirm) {
    refs.push(record(state, `evidence/confirmations/${stage}-${snapshot.tree}${suffix}.json`, {
      schema_version: "human-confirmation.v2", task_id: state.task.identity.taskId, stage,
      decision: "accepted", material_revision: materialRevision, snapshot_tree: snapshot.tree,
      confirmed_at: "2026-08-04T00:00:01.000Z",
    }));
  }
  return { evidence_refs: refs };
}

describe("current vNext five-stage runtime", () => {
  it("runs make-decision through the public route without an audit receipt", () => {
    const state = fixture("public-make-decision-no-audit");
    const writer = createStageContentEvidenceWriter({
      task: state.task,
      workspace: state.candidate,
      stage: "make-decision",
      workflowRunId: state.kernel.deriveStageWorkflowRunId("make-decision"),
    });
    const decisionLog = "# public decision\n";
    state.artifacts.writeAtomic("decision-log.md", decisionLog);
    const decision = writeOfficialComponentReceipt({
      task: state.task, stage: "make-decision", component: "decision",
      payload: { decision_log: decisionLog, contract_refs: [] },
    });
    const talk = (roundNumber) => writer.publish({
      kind: "interaction-completion.v1",
      payload: {
        interaction_type: "talk",
        rounds: [{
          round_number: roundNumber, questions: [], candidate_queue: [],
          questions_already_asked: 0, open_direction_changing_questions: 0,
          current_total: 0, end_reason: "no direction-changing ambiguity remains",
          zero_question_reason: "the current requirement already fixes this direction",
        }],
        grill: null,
      },
    });
    const rounds = [talk(1), talk(2), talk(3)];
    const grill = writer.publish({
      kind: "interaction-completion.v1",
      payload: {
        interaction_type: "grill", rounds: [],
        grill: {
          context: { status: "no-change", reason: "fixture has no context contradiction" },
          adr: { status: "not-needed", reason: "fixture has no architecture decision" },
          conflicts: { status: "none", reason: "fixture has no conflicts" },
          file_references: [], no_file_reason: "fixture uses no file references",
          exit_checks: { context_checked: true, adr_checked: true, conflicts_checked: true, file_references_checked: true },
        },
      },
    });
    const aggregate = writer.publish({
      kind: "interaction-completion.v1",
      payload: {
        interaction_type: "aggregate",
        rounds: rounds.map(({ ref, hash }) => ({ ref, hash })),
        grill: { ref: grill.ref, hash: grill.hash },
        decision_ref: decision.value.decision_ref,
        decision_hash: decision.value.decision_hash,
      },
    });
    expect(aggregate.ref).toMatch(/^evidence\/stage-content\//);
    const snapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
    const testReceipts = {};
    for (const name of ["research", "grill"]) {
      const output = "pass\n";
      const outputRef = currentRef(`evidence/test-output/make-decision-${name}.txt`);
      const receiptRef = `quality/tests/${name}.json`;
      state.kernel.publishCanonicalRecord(outputRef, output);
      const value = {
        schema_version: "workflowhub-receipt.v1", task_id: state.task.identity.taskId, stage: "make-decision",
        producer: { stage: "make-decision", component: `make-decision-${name}`, version: "1.0.0" },
        command: "true", command_hash: sha256("true"), exit_code: 0,
        snapshot_head: snapshot.head, snapshot_tree: snapshot.tree, snapshot_commit: snapshot.commit,
        started_at: "2026-08-04T00:00:00.000Z", completed_at: "2026-08-04T00:00:01.000Z",
        output_ref: outputRef, output_hash: sha256(output),
      };
      const raw = `${JSON.stringify(value, null, 2)}\n`;
      state.kernel.publishCanonicalRecord(receiptRef, raw);
      testReceipts[name] = { ref: receiptRef, hash: sha256(raw) };
    }
    const direction = writeFormalReviewFixture({ task: state.task, stage: "make-decision", snapshotTree: snapshot.tree, reviewTrack: "direction" });
    const detail = writeFormalReviewFixture({ task: state.task, stage: "make-decision", snapshotTree: snapshot.tree, reviewTrack: "detail" });
    const runtime = join(process.cwd(), "tools", "cli", "stage-runtime.mjs");
    const confirmationResult = spawnSync(process.execPath, [
      runtime, "confirm", "--action=decision", "--stage=make-decision", "--project=WorkflowHub",
      `--task=${state.task.identity.taskId}`, "--decision=accepted",
    ], {
      cwd: state.repo,
      env: { ...process.env, HOME: state.home, WORKFLOWHUB_TASK_DIR: state.root },
      encoding: "utf8",
    });
    expect(confirmationResult.status, confirmationResult.stderr).toBe(0);
    const confirmation = JSON.parse(confirmationResult.stdout);
    expect(confirmation.quality_fact_ref).toMatch(/^quality\/facts\/[a-f0-9]{64}\.json$/);
    const input = join(state.root, "make-decision-input.json");
    writeFileSync(input, `${JSON.stringify({ receipts: {
      decision: decision.ref, direction_review: direction.resultRef, detail_review: detail.resultRef,
      research: testReceipts.research.ref, grill: testReceipts.grill.ref, confirmation: confirmation.ref,
    } })}\n`);
    const result = spawnSync(process.execPath, [
      runtime, "run", "--action=execute", "--stage=make-decision", "--project=WorkflowHub",
      `--task=${state.task.identity.taskId}`, `--input=${input}`,
    ], {
      cwd: state.repo,
      env: { ...process.env, HOME: state.home, WORKFLOWHUB_TASK_DIR: state.root },
      encoding: "utf8",
    });
    expect(result.status, result.stderr).toBe(0);
    const publicRun = JSON.parse(result.stdout);
    const publicFacts = publicRun.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref)));
    expect(publicFacts.find((fact) => fact.subject === "research")?.evidence[0]?.ref).toBe(testReceipts.research.ref);
    expect(publicFacts.find((fact) => fact.subject === "grill")?.evidence[0]?.ref).toBe(testReceipts.grill.ref);
    expect(publicRun, `${result.stdout}\n${result.stderr}\n${JSON.stringify(publicFacts)}`).toMatchObject({ stage: "make-decision", status: "completed" });
    expect(() => state.task.readRecord("results/make-decision/accepted.json")).toThrow(/ENOENT/);
    expect(publicStatus(state, "make-decision").status).toBe("completed");
  });

  it("records a rejected public confirmation as a failed current fact", () => {
    const state = fixture("public-rejected-confirmation");
    const runtime = join(process.cwd(), "tools", "cli", "stage-runtime.mjs");
    const result = spawnSync(process.execPath, [
      runtime, "confirm", "--action=decision", "--stage=make-decision", "--project=WorkflowHub",
      `--task=${state.task.identity.taskId}`, "--decision=rejected",
    ], {
      cwd: state.repo,
      env: { ...process.env, HOME: state.home, WORKFLOWHUB_TASK_DIR: state.root },
      encoding: "utf8",
    });
    expect(result.status, result.stderr).toBe(0);
    const confirmation = JSON.parse(result.stdout);
    const fact = JSON.parse(state.task.readRecord(confirmation.quality_fact_ref));
    expect(fact).toMatchObject({ kind: "confirmation", subject: "human_confirmation", status: "failed" });
    expect(publicStatus(state, "make-decision")).toMatchObject({ status: "completed", quality_status: "in_progress" });
  });

  it("confirms make-decision before future-stage materials exist", () => {
    const state = fixture("public-make-decision-without-future-materials", { materialFiles: ["decision-log.md"] });
    const confirmation = publicConfirm(state, "make-decision");
    const fact = JSON.parse(state.task.readRecord(confirmation.quality_fact_ref));
    expect(fact).toMatchObject({ stage: "make-decision", subject: "human_confirmation", status: "passed" });
    expect(publicStatus(state, "make-decision")).toMatchObject({
      status: "completed",
      quality_status: "in_progress",
      quality_predicates: { human_confirmation: { status: "satisfied" } },
    });
  });

  it("fails loudly on non-ENOENT current-material reads and does not create future materials", async () => {
    const state = fixture("public-current-material-read-errors");
    const reader = {
      read(name) {
        if (name === "decision-log.md") return "# decision\n";
        if (name === "spec.md") {
          const error = new Error("fixture permission denied");
          error.code = "EACCES";
          throw error;
        }
        const error = new Error(`missing ${name}`);
        error.code = "ENOENT";
        throw error;
      },
    };

    await expect(runStage(
      "make-decision",
      { ...context("make-decision", state), artifacts: reader },
      async () => ({ facts: { source: "current-material-read-errors" }, ...evidence(state, "make-decision") }),
    )).rejects.toMatchObject({ code: "EACCES" });

    const missing = fixture("public-current-material-future-files-missing", { materialFiles: ["decision-log.md"] });
    const confirmation = publicConfirm(missing, "make-decision");
    expect(JSON.parse(missing.task.readRecord(confirmation.quality_fact_ref)).status).toBe("passed");
    expect(() => missing.artifacts.read("spec.md")).toThrow(/ENOENT/);
    expect(() => missing.artifacts.read("plan.md")).toThrow(/ENOENT/);
    expect(() => missing.artifacts.read("tasks.md")).toThrow(/ENOENT/);
  });

  it("revalidates grill with only current make-decision material", () => {
    const state = fixture("public-grill-revalidation-without-future-materials", { materialFiles: ["decision-log.md"] });
    const writer = createStageContentEvidenceWriter({
      task: state.task,
      workspace: state.candidate,
      stage: "make-decision",
      workflowRunId: state.kernel.deriveStageWorkflowRunId("make-decision"),
    });
    const grill = {
      context: { status: "no-change", reason: "fixture has no context contradiction" },
      adr: { status: "not-needed", reason: "fixture has no architecture decision" },
      conflicts: { status: "none", reason: "fixture has no conflicts" },
      file_references: [],
      no_file_reason: "fixture uses no file references",
      exit_checks: { context_checked: true, adr_checked: true, conflicts_checked: true, file_references_checked: true },
    };
    const initial = writer.publish({ kind: "interaction-completion.v1", payload: {
      interaction_type: "grill", rounds: [], grill,
    } });
    state.artifacts.writeAtomic("decision-log.md", "# decision revision\n");
    const revalidated = writer.publish({ kind: "interaction-completion.v1", payload: {
      interaction_type: "grill-revalidation", rounds: [], grill,
    } });
    expect(revalidated.ref).toMatch(/interaction-completion\.grill-revalidation-0001\.json$/);
    expect(revalidated.value.payload.previous_grill).toEqual({ ref: initial.ref, hash: initial.hash });
    expect(revalidated.value.payload.material_revision.ref).toBe("current-four-materials");
  });

  it("advances an immutable stage-content revision through the CAS latest pointer", () => {
    const state = fixture("public-stage-content-revision", { materialFiles: ["decision-log.md"] });
    const writer = createStageContentEvidenceWriter({
      task: state.task,
      workspace: state.candidate,
      stage: "make-decision",
      workflowRunId: state.kernel.deriveStageWorkflowRunId("make-decision"),
    });
    const audit = buildDecisionCoverageAudit({
      decisionLogRef: "quality/evidence/decision.md",
      decisionLogHash: "a".repeat(64),
      sourceItems: [{ source_item_ref: "quality/evidence/source.md", source_item_hash: "b".repeat(64) }],
      mappings: [{
        source_item_ref: "quality/evidence/source.md",
        source_item_hash: "b".repeat(64),
        coverage_status: "covered",
        decision_location: { kind: "main", ref: "quality/evidence/decision.md", entry_index: 0 },
      }],
    });
    const first = writer.publish({ kind: "decision-coverage-audit.v1", payload: audit });
    const second = writer.publish({ kind: "decision-coverage-audit.v1", revision: 2, payload: audit });
    const latest = readLatestStageContentEvidence({
      task: state.task,
      stage: "make-decision",
      workflowRunId: state.kernel.deriveStageWorkflowRunId("make-decision"),
      kind: "decision-coverage-audit.v1",
    });
    expect(first.ref).toMatch(/decision-coverage-audit\.v1\.json$/);
    expect(second.ref).toMatch(/decision-coverage-audit\.v1\.revision-0002\.json$/);
    expect(latest.ref).toBe(second.ref);
    expect(latest.hash).toBe(second.hash);
    const retry = writer.publish({ kind: "decision-coverage-audit.v1", revision: 2, payload: audit });
    expect(retry.ref).toBe(second.ref);
    expect(retry.hash).toBe(second.hash);
  });

  it("keeps the vNext risk pause and explicit acceptance route usable", () => {
    const state = fixture("vnext-risk-acceptance");
    const snapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
    const review = record(state, "quality/reviews/results/risk-review.json", {
      task_id: state.task.identity.taskId,
      stage: "build-code",
      snapshot_tree: snapshot.tree,
      verdict: "revise_required",
      adjudication: { clusters: [{
        id: "F-123456789abc", severity: "major", path: "src/app.txt", line: 1,
        issue: "fixture serious issue", root_cause: "fixture root cause", recommendation: "repair or explicitly accept",
        providers: ["fixture"], disposition: "actionable", evidence_status: "direct",
      }] },
    });
    const pause = state.kernel.prepareReviewRiskPause({ stage: "build-code", reviewResultRef: review.ref });
    expect(pause.status).toBe("paused");
    const finding = pause.findings[0];
    const reply = record(state, "evidence/review-risk-replies/fixture.json", "human accepts this bounded fixture risk\n");
    const accepted = state.kernel.acceptReviewRisk({
      stage: "build-code", reviewResultRef: review.ref, findingId: finding.finding_id,
      cardRef: finding.card_ref, cardHash: finding.card_hash, selectedOption: "accept-risk",
      replyRef: reply.ref, replyHash: reply.sha256,
    });
    expect(accepted.risk_acceptance_ref).toMatch(/^evidence\/risk-acceptances\/[a-f0-9]{64}\.json$/);
  });

  it("uses the public run route and reports missing receipts without legacy results", () => {
    const state = fixture("public-run-missing-receipt");
    const input = join(state.root, "run-input.json");
    writeFileSync(input, `${JSON.stringify({ receipts: {} })}\n`);
    const runtime = join(process.cwd(), "tools", "cli", "stage-runtime.mjs");
    const result = spawnSync(process.execPath, [
      runtime, "run", "--action=execute", "--stage=build-spec", "--project=WorkflowHub",
      `--task=${state.task.identity.taskId}`, `--input=${input}`,
    ], {
      cwd: state.repo,
      env: { ...process.env, HOME: state.home, WORKFLOWHUB_TASK_DIR: state.root },
      encoding: "utf8",
    });
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toMatch(/MATERIAL_INCOMPLETE: build-spec spec receipt ref is missing/);
    expect(() => state.task.readRecord("results/build-spec/accepted.json")).toThrow(/ENOENT/);
  });

  it("binds verify-code independent review evidence to quality_note, not build-code review", async () => {
    const state = fixture("verify-review-evidence-binding");
    const snapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
    const buildReview = writeFormalReviewFixture({ task: state.task, stage: "build-code", snapshotTree: snapshot.tree });
    const qualityReview = writeFormalReviewFixture({ task: state.task, stage: "verify-code", snapshotTree: snapshot.tree });
    const reviewFact = (ref, reviewScope) => {
      const raw = state.task.readRecord(ref);
      return {
        verdict: "pass", result_ref: ref, result_hash: sha256(raw), snapshot_tree: snapshot.tree,
        subject_kind: "worktree", phase_id: null, review_scope: reviewScope,
      };
    };
    const result = await runStage("verify-code", context("verify-code", state), async () => ({
      facts: {
        review: reviewFact(buildReview.resultRef, "integration"),
        quality_note: reviewFact(qualityReview.resultRef, null),
      },
      missing_items: ["fixture only exercises review evidence binding"],
      ...evidence(state, "verify-code"),
    }));
    const facts = result.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref)));
    expect(facts.find((fact) => fact.subject === "same_build_integration_review")?.evidence[0]?.ref).toBe(buildReview.resultRef);
    expect(facts.find((fact) => fact.subject === "independent_review")?.evidence[0]?.ref).toBe(qualityReview.resultRef);
  });

  it("completes build-spec through verify-code through the public run route", () => {
    const state = fixture("public-build-spec-through-verify-code");
    const specContent = "# Specification\n\n- FR-1: public stage execution.\n- AC-1: current quality facts are published.\n";
    state.artifacts.writeAtomic("spec.md", specContent);
    const spec = writeOfficialComponentReceipt({
      task: state.task, stage: "build-spec", component: "spec", payload: { content: specContent },
    });
    const specSnapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
    const specReview = writeFormalReviewFixture({ task: state.task, stage: "build-spec", snapshotTree: specSnapshot.tree });
    const specRun = publicRun(state, "build-spec", { receipts: { spec: spec.ref, review: specReview.resultRef } });
    expect(specRun.status).toBe("completed");
    expect(publicStatus(state, "build-spec").status).toBe("completed");

    const planProof = record(state, "evidence/public-task-proof.json", { verified: true, scope: "public plan fixture" });
    const planFixture = publicPlanFixture(planProof.sha256);
    state.artifacts.writeAtomic("plan.md", planFixture.plan);
    state.artifacts.writeAtomic("tasks.md", planFixture.tasks);
    const plan = writeOfficialComponentReceipt({
      task: state.task, stage: "build-plan", component: "plan", payload: { content: planFixture.plan },
    });
    const tasks = writeOfficialComponentReceipt({
      task: state.task, stage: "build-plan", component: "tasks", payload: { content: planFixture.tasks },
    });
    const planSnapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
    const planReview = writeFormalReviewFixture({ task: state.task, stage: "build-plan", snapshotTree: planSnapshot.tree });
    publicConfirm(state, "build-plan");
    const planRun = publicRun(state, "build-plan", {
      receipts: { plan: plan.ref, tasks: tasks.ref, review: planReview.resultRef },
    });
    expect(planRun.status).toBe("completed");
    expect(publicStatus(state, "build-plan").status).toBe("completed");

    writeFileSync(join(state.candidate.worktreeRoot, "src", "app.txt"), "implemented through public route\n");
    const workspace = openCurrentTaskWorkspace(state.task);
    const implementation = writeOfficialComponentReceipt({
      task: state.task, workspace, stage: "build-code", component: "implementation", payload: {},
    });
    const buildSnapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
    const buildTests = publicTestReceipt(state, "build-code", buildSnapshot);
    const buildReview = writeFormalReviewFixture({ task: state.task, stage: "build-code", snapshotTree: buildSnapshot.tree });
    const buildProof = record(state, "evidence/public-build-code-proof.json", { verified: true, snapshot_tree: buildSnapshot.tree });
    const buildRun = publicRun(state, "build-code", {
      receipts: { implementation: implementation.ref, tests: buildTests.ref, review: buildReview.resultRef },
      acceptance_coverage: {
        snapshot_tree: buildSnapshot.tree, accepted_criterion_ids: ["AC-1"],
        items: [{ acceptance_criterion_id: "AC-1", status: "covered", evidence_refs: [buildProof] }],
      },
    });
    expect(buildRun.status).toBe("completed");
    expect(publicStatus(state, "build-code").status).toBe("completed");

    const verifySnapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
    const verifyTests = publicTestReceipt(state, "verify-code", verifySnapshot);
    const qualityReview = writeFormalReviewFixture({ task: state.task, stage: "verify-code", snapshotTree: verifySnapshot.tree });
    const verifyProof = record(state, "evidence/public-verify-code-proof.json", { verified: true, snapshot_tree: verifySnapshot.tree });
    const evidenceReceipt = publicAcceptanceEvidence(state, verifySnapshot, verifyProof);
    const verification = publicVerificationReceipt(state, verifyProof);
    publicConfirm(state, "verify-code");
    const verifyRun = publicRun(state, "verify-code", {
      receipts: {
        tests: verifyTests.ref, review: buildReview.resultRef, quality_review: qualityReview.resultRef,
        evidence: evidenceReceipt.ref, verification: verification.ref,
      },
    });
    expect(verifyRun.status).toBe("completed");
    expect(publicStatus(state, "verify-code").status).toBe("completed");
  });

  it("completes all five stages from the current four materials", async () => {
    const state = fixture("current-five-stage-normal");
    const statuses = {};
    for (const stage of stages) {
      if (stage === "build-spec") state.artifacts.writeAtomic("spec.md", "# current spec\n");
      if (stage === "build-plan") {
        state.artifacts.writeAtomic("plan.md", "# current plan\n");
        state.artifacts.writeAtomic("tasks.md", "# current tasks\n");
      }
      if (stage === "build-code") writeFileSync(join(state.candidate.worktreeRoot, "src/app.txt"), "implemented\n");
      const result = await runStage(stage, context(stage, state), async () => {
        const currentEvidence = evidence(state, stage);
        const facts = { source: "current-five-stage-test", stage };
        if (stage === "verify-code") {
          const snapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
          const buildReview = writeFormalReviewFixture({ task: state.task, stage: "build-code", snapshotTree: snapshot.tree });
          const qualityReview = writeFormalReviewFixture({ task: state.task, stage: "verify-code", snapshotTree: snapshot.tree });
          const reviewFact = (ref, reviewScope) => ({
            verdict: "pass", result_ref: ref, result_hash: sha256(state.task.readRecord(ref)),
            snapshot_tree: snapshot.tree, subject_kind: "worktree", phase_id: null, review_scope: reviewScope,
          });
          facts.review = reviewFact(buildReview.resultRef, "integration");
          facts.quality_note = reviewFact(qualityReview.resultRef, null);
          currentEvidence.evidence_refs.push(
            { ref: buildReview.resultRef, sha256: facts.review.result_hash },
            { ref: qualityReview.resultRef, sha256: facts.quality_note.result_hash },
          );
        }
        return { facts, ...currentEvidence };
      });
      statuses[stage] = result.status;
      const projection = publicStatus(state, stage);
      expect(projection.status, JSON.stringify({ stage, projection })).toBe("completed");
    }
    expect(statuses).toEqual(Object.fromEntries(stages.map((stage) => [stage, "completed"])));
  });

  it("keeps material revision and repair on the same task", async () => {
    const state = fixture("current-five-stage-revision");
    await runStage("build-plan", context("build-plan", state), async () => ({
      facts: { source: "initial-plan" }, ...evidence(state, "build-plan"),
    }));
    state.artifacts.writeAtomic("plan.md", "# revised plan\n");
    state.artifacts.writeAtomic("tasks.md", "# revised tasks\n");
    const result = await runStage("build-plan", context("build-plan", state), async () => ({
      facts: { source: "revised-plan" }, ...evidence(state, "build-plan", { suffix: "-revised" }),
    }));
    expect(result.status).toBe("completed");
    expect(state.task.identity.taskId).toBe("current-five-stage-revision");
  });

  it("records failed or unavailable evidence without blocking stage progression", async () => {
    const state = fixture("current-five-stage-retry");
    const failed = await runStage("build-code", context("build-code", state), async () => ({
      facts: { source: "failed-build" }, ...evidence(state, "build-code", { testExit: 1, review: "unavailable", confirm: false }),
    }));
    expect(failed.status).toBe("completed");
    expect(failed.quality_status).toBe("incomplete");
    const repaired = await runStage("build-code", context("build-code", state), async () => ({
      facts: { source: "repaired-build" }, ...evidence(state, "build-code", { suffix: "-repaired" }),
    }));
    expect(repaired.status).toBe("completed");
  });
});
