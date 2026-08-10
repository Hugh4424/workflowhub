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
import { writeOfficialComponentReceipt } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { writeFormalReviewFixture } from "../helpers/formal-review.mjs";

const roots = [];
const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
const materials = ["decision-log.md", "spec.md", "plan.md", "tasks.md"];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
function currentRef(value) {
  return typeof value === "string"
    ? value.replace(/^receipts\/tests\//, "quality/tests/").replace(/^evidence\/test-output\//, "quality/tests\/output\/").replace(/^receipts\/(decision|spec|plan|tasks|implementation|verification)\.json$/, "quality/evidence/$1.json").replace(/^reviews\//, "quality/reviews/").replace(/^evidence\/confirmations\//, "quality/confirmations/").replace(/^evidence\//, "quality/evidence/")
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

Deletion proof: N/A — no deletion is part of this fixture.

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
- **evidence_path**：quality/evidence/public-${id}.json
- **verification_role**：${role}
- **paired_task**：${role === "RED" ? "T002" : "T001"}
- **actual_changes**：public route fixture implementation
- **executed_commands**：public stage runtime
- **evidence_refs**：\`[{"ref":"quality/evidence/public-task-proof.json","sha256":"${taskProofHash}"}]\`
- **covered_ac**：AC-1
- **review_fact**：public route review fact
- **completed_at**：2026-08-04T00:00:01.000Z

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：\`completed\`
- **状态**：\`completed\`
- **执行事实**：public route command executed; expected exit observed; evidence and review recorded
`;
  return { plan, tasks: `# Tasks\n\n${task("T001", "RED", "none", 1)}\n${task("T002", "GREEN", "T001", 0)}` };
}

function publicAcceptanceEvidence(state, snapshot, proof) {
  const leaf = record(state, "quality/evidence/public-AC-1.json", {
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
      command: testExit === 0 ? "true" : "false", command_hash: sha256(testExit === 0 ? "true" : "false"), exit_code: testExit,
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
        provider_results: [{ provider: "fixture", output: { findings: [] } }],
        findings: [],
        adjudication: { version: "wh-review-adjudication.v1", clusters: [] },
      };
  refs.push(record(state, reviewRef, reviewValue));
  if (["make-decision", "build-plan", "verify-code"].includes(stage) && confirm) {
    refs.push(record(state, `evidence/confirmations/${stage}-${snapshot.tree}${suffix}.json`, {
      schema_version: "human-confirmation.v2", task_id: state.task.identity.taskId, stage,
      decision: "accepted", material_revision: materialRevision, snapshot_tree: snapshot.tree,
      confirmed_at: "2026-08-04T00:00:01.000Z",
    }));
  }
  const acceptanceSubjects = {
    "make-decision": ["scope", "non_goals", "risks", "talk_clarify"],
    "build-spec": ["zero_major_ambiguities"],
    "build-plan": ["fr_coverage", "ac_coverage", "dependencies", "deletion_proofs", "executable_tasks"],
    "build-code": ["acceptance_criteria"],
    "verify-code": ["acceptance_criteria", "exceptions"],
  }[stage];
  return {
    facts: {
      completion_subjects: Object.fromEntries(acceptanceSubjects.map((subject) => [subject, {
        status: "passed", evidence_refs: [], detail: `fixture ${subject}`,
      }])),
      finding_dispositions: { status: "not_applicable", items: [] },
    },
    evidence_refs: refs,
    completion: { facts: { business_facts: { acceptance_criteria: "covered" } } },
  };
}

describe("current vNext five-stage runtime", () => {
  it("records direction and detail review findings without a verdict gate", async () => {
    const state = fixture("make-decision-review-subjects");
    const snapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
    const direction = writeFormalReviewFixture({
      task: state.task, stage: "make-decision", snapshotTree: snapshot.tree, reviewTrack: "direction",
    });
    const detail = writeFormalReviewFixture({
      task: state.task, stage: "make-decision", snapshotTree: snapshot.tree,
      reviewTrack: "detail", verdict: "revise_required",
    });
    const reviewFact = (ref) => ({
      result_ref: ref, result_hash: sha256(state.task.readRecord(ref)), snapshot_tree: snapshot.tree,
    });
    const result = await runStage("make-decision", context("make-decision", state), async () => {
      const currentEvidence = evidence(state, "make-decision");
      return {
        ...currentEvidence,
        facts: {
          ...currentEvidence.facts,
          reviews: { direction: reviewFact(direction.resultRef), detail: reviewFact(detail.resultRef) },
        },
        evidence_refs: [
          ...currentEvidence.evidence_refs,
          { ref: direction.resultRef, sha256: reviewFact(direction.resultRef).result_hash },
          { ref: detail.resultRef, sha256: reviewFact(detail.resultRef).result_hash },
        ],
      };
    });
    expect(result.completion.missing).not.toContain("detail_review");
    expect(result.completion.missing).not.toContain("direction_review");
    expect(result.completion.status).toBe("completed");
  });

  it("completes make-decision without coverage audit while accepting immutable Talk/Clarify evidence", () => {
    const state = fixture("public-make-decision-no-audit");
    const decisionLog = "# public decision\n\n## 范围\n当前范围。\n\n## 非目标\n不扩大范围。\n\n## 风险与延期交接\n风险已记录。\n";
    state.artifacts.writeAtomic("decision-log.md", decisionLog);
    const decisionRef = state.artifacts.reference("decision-log.md");
    const decisionHash = sha256(decisionLog);
    const snapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
    const interactionValue = {
      schema_version: "workflowhub-interaction-aggregate.v1",
      task_id: state.task.identity.taskId,
      stage: "make-decision",
      snapshot_tree: snapshot.tree,
      talk: { status: "completed", round_count: 3, architecture_direction_covered: true, user_outcome_covered: true },
      clarify: { status: "resolved", open_direction_changing_questions: 0, resolved_by: "no_direction_changing_ambiguity" },
      decision_ref: decisionRef,
      decision_hash: decisionHash,
    };
    const interactionRaw = `${JSON.stringify(interactionValue, null, 2)}\n`;
    const interactionRef = `quality/evidence/interactions/${sha256(interactionRaw)}.json`;
    state.kernel.publishCanonicalRecord(interactionRef, interactionRaw);
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
      interaction: interactionRef, direction_review: direction.resultRef, detail_review: detail.resultRef,
      confirmation: confirmation.ref,
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
    expect(publicFacts.some((fact) => fact.subject === "research")).toBe(false);
    expect(publicFacts.some((fact) => fact.subject === "grill")).toBe(false);
    const talkClarifyFact = publicFacts.find((fact) => fact.subject === "talk_clarify");
    expect(talkClarifyFact).toMatchObject({ status: "passed" });
    const acceptance = JSON.parse(state.task.readRecord(talkClarifyFact.evidence[0].ref));
    const subjectEvidence = JSON.parse(state.task.readRecord(acceptance.refs[0].ref));
    expect(subjectEvidence.subject_fact.evidence_refs).toEqual([{ ref: interactionRef, sha256: sha256(interactionRaw) }]);
    expect(publicRun, `${result.stdout}\n${result.stderr}\n${JSON.stringify(publicFacts)}`).toMatchObject({ stage: "make-decision", status: "completed", work_status: "ready" });
    expect(() => state.task.readRecord("results/make-decision/accepted.json")).toThrow(/ENOENT/);
    const status = publicStatus(state, "make-decision");
    expect(status).toMatchObject({
      work_status: "ready",
      quality_status: "completed",
      quality_fact_refs: expect.arrayContaining(publicRun.quality_fact_refs),
    });
    expect(status).not.toHaveProperty("status");
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
    const status = publicStatus(state, "make-decision");
    expect(status).toMatchObject({
      work_status: "ready",
      quality_status: "in_progress",
      quality_fact_refs: expect.arrayContaining([confirmation.quality_fact_ref]),
    });
    expect(status).not.toHaveProperty("status");
  });

  it("confirms make-decision before future-stage materials exist", () => {
    const state = fixture("public-make-decision-without-future-materials", { materialFiles: ["decision-log.md"] });
    const confirmation = publicConfirm(state, "make-decision");
    const fact = JSON.parse(state.task.readRecord(confirmation.quality_fact_ref));
    expect(fact).toMatchObject({ stage: "make-decision", subject: "human_confirmation", status: "passed" });
    const status = publicStatus(state, "make-decision");
    expect(status).toMatchObject({
      work_status: "ready",
      quality_status: "in_progress",
      quality_fact_refs: expect.arrayContaining([confirmation.quality_fact_ref]),
      quality_predicates: { human_confirmation: { status: "satisfied" } },
    });
    expect(status).not.toHaveProperty("status");
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

  it("keeps the vNext risk pause and explicit acceptance route usable", () => {
    const state = fixture("vnext-risk-acceptance");
    const snapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
    const review = record(state, "quality/reviews/results/risk-review.json", {
      task_id: state.task.identity.taskId,
      stage: "build-code",
      snapshot_tree: snapshot.tree,
        adjudication: { clusters: [{
        id: "F-123456789abc", severity: "major", path: "src/app.txt", line: 1,
        issue: "fixture serious issue", root_cause: "fixture root cause", recommendation: "repair or explicitly accept",
        providers: ["fixture"], disposition: "actionable", evidence_status: "direct",
      }] },
    });
    const pause = state.kernel.prepareReviewRiskPause({ stage: "build-code", reviewResultRef: review.ref });
    expect(pause.status).toBe("paused");
    const finding = pause.findings[0];
    expect(finding.card_ref).toBe(`quality/evidence/risk-cards/${finding.card_hash}.json`);
    expect(sha256(state.task.readRecord(finding.card_ref))).toBe(finding.card_hash);
    const replyText = "human accepts this bounded fixture risk\n";
    const replyRaw = `${JSON.stringify(replyText, null, 2)}\n`;
    const reply = record(state, `quality/evidence/risk-replies/${sha256(replyRaw)}.json`, replyText);
    const accepted = state.kernel.acceptReviewRisk({
      stage: "build-code", reviewResultRef: review.ref, findingId: finding.finding_id,
      cardRef: finding.card_ref, cardHash: finding.card_hash, selectedOption: "accept-risk",
      replyRef: reply.ref, replyHash: reply.sha256,
    });
    expect(accepted.risk_acceptance_ref).toMatch(/^quality\/evidence\/risk-acceptances\/[a-f0-9]{64}\.json$/);
  });

  it("uses the public run route from current materials without material receipts", () => {
    const state = fixture("public-run-missing-receipt");
    const runtime = join(process.cwd(), "tools", "cli", "stage-runtime.mjs");
    const result = spawnSync(process.execPath, [
      runtime, "run", "--action=execute", "--stage=build-spec", "--project=WorkflowHub",
      `--task=${state.task.identity.taskId}`,
    ], {
      cwd: state.repo,
      env: { ...process.env, HOME: state.home, WORKFLOWHUB_TASK_DIR: state.root },
      encoding: "utf8",
    });
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ stage: "build-spec", work_status: "ready", quality_status: "incomplete" });
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
        status: "recorded", result_ref: ref, result_hash: sha256(raw), snapshot_tree: snapshot.tree,
        subject_kind: "worktree", phase_id: null, review_scope: reviewScope,
      };
    };
    const result = await runStage("verify-code", context("verify-code", state), async () => {
      const currentEvidence = evidence(state, "verify-code");
      return {
        ...currentEvidence,
        facts: {
          ...currentEvidence.facts,
          review: reviewFact(buildReview.resultRef, "integration"),
          quality_note: reviewFact(qualityReview.resultRef, null),
        },
        missing_items: ["fixture only exercises review evidence binding"],
      };
    });
    const facts = result.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref)));
    expect(facts.find((fact) => fact.subject === "same_build_integration_review")).toBeUndefined();
    expect(facts.find((fact) => fact.subject === "independent_review")?.evidence[0]?.ref).toBe(qualityReview.resultRef);
  });

  it("runs build-spec through verify-code without inventing an audit gate", () => {
    const state = fixture("public-build-spec-through-verify-code");
    const specContent = "# Specification\n\n- FR-1: public stage execution.\n- AC-1: current quality facts are published.\n";
    state.artifacts.writeAtomic("spec.md", specContent);
    const specSnapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
    const specReview = writeFormalReviewFixture({ task: state.task, stage: "build-spec", snapshotTree: specSnapshot.tree });
    const specRun = publicRun(state, "build-spec", { receipts: { review: specReview.resultRef } });
    expect(specRun.status).toBe("completed");
    expect(specRun.completion.missing).not.toContain("traceability");
    expect(publicStatus(state, "build-spec")).toMatchObject({ work_status: "ready", quality_status: "completed" });

    const planProof = record(state, "quality/evidence/public-task-proof.json", { verified: true, scope: "public plan fixture" });
    const planFixture = publicPlanFixture(planProof.sha256);
    state.artifacts.writeAtomic("plan.md", planFixture.plan);
    state.artifacts.writeAtomic("tasks.md", planFixture.tasks);
    const planSnapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
    const planReview = writeFormalReviewFixture({ task: state.task, stage: "build-plan", snapshotTree: planSnapshot.tree });
    publicConfirm(state, "build-plan");
    const planRun = publicRun(state, "build-plan", {
      receipts: { review: planReview.resultRef },
    });
    expect(planRun.status).toBe("completed");
    expect(planRun.completion.missing).not.toContain("support:audit");
    expect(planRun.completion.missing).not.toEqual(expect.arrayContaining([expect.stringMatching(/audit unavailable\/unverified\/mismatch/i)]));
    expect(publicStatus(state, "build-plan")).toMatchObject({ work_status: "ready", quality_status: "completed" });

    writeFileSync(join(state.candidate.worktreeRoot, "src", "app.txt"), "implemented through public route\n");
    const workspace = openCurrentTaskWorkspace(state.task);
    const implementation = writeOfficialComponentReceipt({
      task: state.task, workspace, stage: "build-code", component: "implementation", payload: {},
    });
    const buildSnapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
    const buildTests = publicTestReceipt(state, "build-code", buildSnapshot);
    const buildReview = writeFormalReviewFixture({ task: state.task, stage: "build-code", snapshotTree: buildSnapshot.tree });
    const buildProof = record(state, "quality/evidence/public-build-code-proof.json", { verified: true, snapshot_tree: buildSnapshot.tree });
    const buildRun = publicRun(state, "build-code", {
      receipts: { implementation: implementation.ref, tests: buildTests.ref, review: buildReview.resultRef },
      acceptance_coverage: {
        snapshot_tree: buildSnapshot.tree, accepted_criterion_ids: ["AC-1"],
        items: [{
          acceptance_criterion_id: "AC-1",
          status: "covered",
          evidence_refs: [buildProof],
          scenario: "run build-code through the public stage route",
          oracle: "current implementation, tests, AC evidence, and integration review complete",
          actual_outcome: "public build-code returned completed",
          coverage_limits: "fixture covers AC-1 only",
          implementation_anchor: { id: "impl-ac-1", path: "src/app.txt", start_line: 1, end_line: 1, role: "implementation" },
          verification_anchor: { id: "verify-ac-1", path: "tasks.md", start_line: 1, end_line: 1, role: "verification" },
        }],
      },
    });
    expect(buildRun, JSON.stringify(buildRun)).toMatchObject({ status: "completed" });
    expect(buildRun.completion.missing).not.toContain("support:audit");
    expect(buildRun.completion.missing).not.toEqual(expect.arrayContaining([expect.stringMatching(/audit unavailable\/unverified\/mismatch/i)]));
    expect(publicStatus(state, "build-code")).toMatchObject({ work_status: "ready", quality_status: "completed" });

    const verifySnapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
    const verifyTests = publicTestReceipt(state, "verify-code", verifySnapshot);
    const qualityReview = writeFormalReviewFixture({ task: state.task, stage: "verify-code", snapshotTree: verifySnapshot.tree });
    const verifyProof = record(state, "quality/evidence/public-verify-code-proof.json", { verified: true, snapshot_tree: verifySnapshot.tree });
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
    expect(publicStatus(state, "verify-code")).toMatchObject({ work_status: "ready", quality_status: "completed" });
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
        const facts = { ...currentEvidence.facts, source: "current-five-stage-test", stage };
        if (stage === "make-decision") {
          const snapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
          const direction = writeFormalReviewFixture({ task: state.task, stage, snapshotTree: snapshot.tree, reviewTrack: "direction" });
          const detail = writeFormalReviewFixture({ task: state.task, stage, snapshotTree: snapshot.tree, reviewTrack: "detail" });
          facts.reviews = {
            direction: { result_ref: direction.resultRef, result_hash: sha256(state.task.readRecord(direction.resultRef)), snapshot_tree: snapshot.tree },
            detail: { result_ref: detail.resultRef, result_hash: sha256(state.task.readRecord(detail.resultRef)), snapshot_tree: snapshot.tree },
          };
          currentEvidence.evidence_refs.push(
            { ref: direction.resultRef, sha256: facts.reviews.direction.result_hash },
            { ref: detail.resultRef, sha256: facts.reviews.detail.result_hash },
          );
        }
        if (stage === "verify-code") {
          const snapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
          const buildReview = writeFormalReviewFixture({ task: state.task, stage: "build-code", snapshotTree: snapshot.tree });
          const qualityReview = writeFormalReviewFixture({ task: state.task, stage: "verify-code", snapshotTree: snapshot.tree });
          const reviewFact = (ref, reviewScope) => ({
            status: "recorded", result_ref: ref, result_hash: sha256(state.task.readRecord(ref)),
            snapshot_tree: snapshot.tree, subject_kind: "worktree", phase_id: null, review_scope: reviewScope,
          });
          facts.review = reviewFact(buildReview.resultRef, "integration");
          facts.quality_note = reviewFact(qualityReview.resultRef, null);
          currentEvidence.evidence_refs.push(
            { ref: buildReview.resultRef, sha256: facts.review.result_hash },
            { ref: qualityReview.resultRef, sha256: facts.quality_note.result_hash },
          );
        }
        return { ...currentEvidence, facts };
      });
      statuses[stage] = result.status;
      const projection = publicStatus(state, stage);
      expect(projection, JSON.stringify({ stage, projection })).toMatchObject({ work_status: "ready", quality_status: "completed" });
      expect(projection).not.toHaveProperty("status");
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

  it("keeps work ready but reports incomplete quality until failure is repaired", async () => {
    const state = fixture("current-five-stage-retry");
    const failed = await runStage("build-code", context("build-code", state), async () => ({
      facts: { source: "failed-build" }, ...evidence(state, "build-code", { testExit: 1, review: "unavailable", confirm: false }),
    }));
    expect(failed).toMatchObject({ status: "in_progress", work_status: "ready", quality_status: "incomplete" });
    expect(failed.completion.missing.length).toBeGreaterThan(0);
    expect(failed).not.toHaveProperty("publication_ref");
    expect(failed).not.toHaveProperty("publication_hash");
    const repaired = await runStage("build-code", context("build-code", state), async () => ({
      facts: { source: "repaired-build" }, ...evidence(state, "build-code", { suffix: "-repaired" }),
    }));
    expect(repaired.status).toBe("completed");
  });
});
