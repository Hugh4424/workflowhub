import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import yaml from "js-yaml";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { brandTaskKernel } from "../../core/task-capability.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { authenticateCurrentBuildCodeStageOutcome, publishOfficialStageOutcome, runOfficialStage, runStage, verifyOfficialEvidence } from "../../runtime/stage/stage-runner.mjs";
import {
  createWorkflowHubSessionRecorder,
  publishStageAgentOutcome,
  publishUnavailableStageAgentOutcome,
} from "../../runtime/stage/stage-agent-outcome-adapter.mjs";
import { main as workflowHubBridgeMain, publishCurrentWorkflowHubSession } from "../../tools/host/workflowhub-stage-agent-bridge.mjs";
import { openCurrentTaskWorkspace, prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { createCanonicalReviewWriter, writeOfficialComponentReceipt } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { publishStageReviewFact } from "../../skills/wh-review/scripts/wh-review-cli.mjs";
import { writeFormalReviewFixture } from "../helpers/formal-review.mjs";
import { buildStageCompletion } from "../../runtime/evidence/stage-completion-facts.mjs";
import { sha256 } from "../../runtime/evidence/freshness.mjs";
import { materialRevisionFromValues } from "../../runtime/task/git-worktree-snapshot.mjs";
import { initializeTaskStore, readTaskFacts } from "../../runtime/task/task-store.mjs";
import { createRequirementAuthenticationFixture, writeCanonicalStageMaterials, writeStageOutcomeFixture } from "../helpers/stage-outcome.mjs";
import {
  buildWorkflowHubSessionInput,
  bindCodexSessionTask,
  finishCodexSessionEvent,
  registerCodexSession,
  sessionHandoffPath,
  startCodexSessionEvent,
  recordCodexSessionSpecAnalyze,
  endCodexSession,
} from "../../tools/host/workflowhub-codex-session-state.mjs";
import { bindCurrentSessionOutcome } from "../../tools/cli/stage-runtime.mjs";

const roots = [];
const MATERIALS = ["decision-log.md", "spec.md", "plan.md", "tasks.md"];
afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

function fixture(taskId = "vnext-stage-run") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-vnext-stage-run-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
  git(["init", "-q"]);
  git(["config", "user.name", "WorkflowHub Tests"]);
  git(["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "base\n");
  git(["add", "."]);
  git(["commit", "-qm", "base"]);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "WorkflowHub",
      task_id: taskId,
      created_at: "2026-08-02T00:00:00Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const candidate = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  writeCanonicalStageMaterials(artifacts);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate });
  return { root, task, candidate, kernel };
}

function contextFor(stage, state) {
  return {
    stage,
    task: state.task,
    kernel: state.kernel,
    identity: state.task.identity,
    workflowRunId: state.kernel.deriveStageWorkflowRunId(stage),
    manifest: state.task.manifest,
    candidateWorkspace: state.candidate,
  };
}

function publishReviewFixture(state) {
  const snapshot = state.candidate.captureSnapshot();
  const value = {
    version: "wh-review-result.v1",
    task_id: state.task.identity.taskId,
    stage: "build-spec",
    review_track: null,
    subject_kind: "worktree",
    phase_id: null,
    review_scope: null,
    source: { target_commit: snapshot.head, base_commit: snapshot.head, base_tree: snapshot.tree, captured_head: snapshot.head },
    snapshot_tree: snapshot.tree,
    material_id: "0".repeat(64),
    attempt_ref: "quality/reviews/attempts/vnext-build-spec/attempt.json",
    provider_results: [{ provider: "fixture", output: { findings: [] } }],
    findings: [],
    adjudication: { version: "wh-review-adjudication.v1", clusters: [] },
  };
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const ref = "quality/reviews/results/vnext-build-spec.json";
  state.kernel.publishCanonicalRecord(ref, raw);
  return { ref, sha256: sha256(raw) };
}

const REQUIREMENT_CLASSES = ["goal", "flow_or_surface", "data_or_state", "success_failure_acceptance", "constraint_non_goal_defer"];
function analyzerRequirementFixture() {
  const messages = REQUIREMENT_CLASSES.map((message_class, index) => ({
    id: `message-${index + 1}`,
    content_hash: sha256(`message-${index + 1}`),
    message_class,
  }));
  return {
    authenticated_requirement_messages: messages,
    requirement_coverage_outputs: messages.map((message, index) => ({
      message_id: message.id,
      message_hash: message.content_hash,
      message_class: message.message_class,
      axis_id: `axis-${index + 1}`,
      impact: index < 2 ? "high" : "medium",
      disposition: "represented",
      decision_ids: [`D-FIXTURE-${index + 1}`],
      requirement_ids: [`R-FIXTURE-${index + 1}`],
      fr_ids: [`FR-FIXTURE-${index + 1}`],
      ac_ids: [`AC-FIXTURE-${index + 1}`],
    })),
  };
}

function stageAgentExecution(stage) {
  const stepsManifest = JSON.parse(readFileSync(join(process.cwd(), "workflows", stage, "steps.json"), "utf8"));
  const skillsManifest = yaml.load(readFileSync(join(process.cwd(), "workflows", stage, "skill-deps.yaml"), "utf8"));
  const evidence = () => ({ kind: "host-command", command: "stage-agent-test", exit_code: 0, output: "actual host result" });
  const steps = stepsManifest.steps.map((step) => ({
    step_id: step.step_id, step_slug: step.step_slug, order: step.order, status: "completed",
    input_refs: step.entry_conditions.map(({ uri_or_path }) => uri_or_path),
    result_summary: `Stage Agent 实际执行 ${step.step_slug}，产生当前结果`, evidence: [evidence()],
    cost: { duration_ms: 1, tokens: 1, status: "recorded" },
  }));
  const skills = (skillsManifest.skills ?? []).map(({ name }) => ({
    skill_id: name, status: "completed", trigger: true, executed: true, version: "test-stage-agent-1.0.0",
    result_summary: `Stage Agent 实际执行 ${name}，产生当前结果`, evidence: [evidence()],
    cost: { duration_ms: 1, tokens: 1, status: "recorded" },
  }));
  return {
    status: "completed",
    provenance: { kind: "stage-agent", host: "test-host", agent_run_id: `real-${stage}-run` },
    steps, skills,
    ...(stage === "verify-code" ? {
    code_review: {
      result: {
        status: "clean",
        findings: [],
        summary: "Stage Agent 实际执行当前实现代码审查并未发现可交付阻塞",
        focus: ["correctness", "lifecycle", "security", "consumer_fit", "test_strength"],
        repairs: [],
      },
    },
    } : {
    spec_analyze: {
      packet: {
        original_requirements: [{ id: "R-FIXTURE-1", summary: "当前用户需求" }],
        coverage: [{
          requirement_id: "R-FIXTURE-1", expected_behavior: "当前用户需求",
          actual_behavior: "当前用户需求已由 Stage Agent 实际执行并产生当前结果", semantic_match: true,
          scenario_refs: ["SCN-real-stage-agent"], oracle_refs: ["ORACLE-real-stage-agent"],
          artifact_refs: ["decision_log"], evidence_refs: ["decision-log"], status: "covered",
        }],
        work_summary: "Stage Agent 实际执行 stage-end spec-analyze",
        ...analyzerRequirementFixture(),
        grill_summary: {
          status: "completed",
          requirement_coverage: { status: "complete", message_classes: [...REQUIREMENT_CLASSES], uncovered: [] },
          exit_checks: { external_interfaces: "pass", canonical_names: "pass", failure_semantics: "pass", scope_boundaries: "pass" },
        },
        final_confirmation: {
          decision: "accepted",
          subject_ref: "fixture/decision",
          events: ["ask", "wait", "reply", "resume"].map((event, index) => ({ event, sequence: index + 1 })),
        },
      },
      evidence_subjects: { "decision-log": { subject_kind: "step", subject_id: steps[0].step_slug } },
    },
    }),
  };
}

function stageOutcome(state, stage, { workspace = null, artifacts = null, attemptId = `attempt-${stage}`, status = "completed", qualityReview = null } = {}) {
  return writeStageOutcomeFixture({
    task: state.task,
    kernel: state.kernel,
    artifacts: artifacts ?? ArtifactDir.open((workspace ?? state.candidate).worktreeRoot, state.task),
    ...(workspace ? { workspace } : { candidateWorkspace: state.candidate }),
    stage,
    attemptId,
    status,
    qualityReview,
  });
}

function uiSourceBindingCase(taskId) {
  const state = fixture(taskId);
  const workspace = openCurrentTaskWorkspace(state.task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, state.task);
  const kernel = createTaskKernel(state.task, { workspace, artifacts });
  // UI applicability is authoritative in decision-log.md. Keep these
  // source-binding cases explicitly UI-scoped before producing any receipts.
  artifacts.writeAtomic("decision-log.md", `${artifacts.read("decision-log.md")}\n## UI applicability\n\`\`\`json\n${JSON.stringify({
    result: "ui",
    sources: {
      raw_requirement: "new settings page",
      project_inventory: "existing settings page",
      planned_or_changed_frontend_fact: "new settings component",
    },
  }, null, 2)}\n\`\`\`\n`);
  const outcome = stageOutcome(state, "build-spec", { workspace, artifacts, attemptId: `attempt-${taskId}` });
  const review = publishReviewFixture({ ...state, kernel });
  const design = {
    document_kind: "design",
    path: "Design.md",
    content_sha256: "a".repeat(64),
    revision: "design-r1",
    anchor_id: "design-root",
  };
  const experience = {
    document_kind: "experience",
    path: "Experience.md",
    content_sha256: "b".repeat(64),
    revision: "experience-r1",
    anchor_id: "experience-root",
  };
  const currentFacts = {
    ui_applicability: {
      result: "ui",
      sources: {
        raw_requirement: "new settings page",
        project_inventory: "existing settings page",
        planned_or_changed_frontend_fact: "new settings component",
      },
    },
    ui_project_init: {
      mode: "new",
      design_path: design.path,
      design_revision: design.revision,
      experience_path: experience.path,
      experience_revision: experience.revision,
      design_identity: design,
      experience_identity: experience,
      scope: "Settings page",
      component_boundary: "src/components/settings",
      style_boundary: "tokens/forms",
      fixture: "settings-default",
      viewport: "desktop-1440x900",
      preview: "quality/evidence/ui-design/settings.html",
    },
    design_source_readiness: {
      design_path: design.path,
      design_revision: design.revision,
      expected_design_revision: design.revision,
      design_identity: design,
      experience_identity: experience,
      sections: [{
        anchor_id: "settings",
        page_or_region: "Settings page",
        goal: "edit settings",
        primary_action: "Save",
        states: ["default", "loading", "error"],
        components: "SettingsForm",
        tokens: "tokens/forms",
        fixture: "settings-default",
        viewport: "desktop-1440x900",
        responsive: "stack actions on narrow viewport",
        a11y: "label controls",
        evidence: "quality/evidence/ui-design/settings.html",
      }],
    },
  };
  const approved = {
    ...currentFacts,
    plan_design_review: {
      state: "human_approved",
      current_material_ref: "spec.md",
      material_revision: kernel.currentVNextMaterialRevision(),
      display_before_reply: true,
      design_artifact_ref: "quality/evidence/ui-design/settings.html",
      design_artifact_hash: "c".repeat(64),
      reply_ref: "host-message://ui-design/reply-1",
      reply_hash: "d".repeat(64),
      reply_source: "user",
      displayed_at_ms: 1000,
      reply_at_ms: 2000,
      input_identities: { design, experience },
    },
  };
  return { state, workspace, artifacts, kernel, outcome, review, approved, design, experience };
}

function appendNonUiApplicability(artifacts) {
  artifacts.writeAtomic("decision-log.md", `${artifacts.read("decision-log.md")}\n## UI applicability\n\`\`\`json\n${JSON.stringify({
    result: "non_ui",
    sources: {
      raw_requirement: { conclusion: "non_ui", reason: "fixture has no page consumer" },
      project_inventory: { conclusion: "non_ui", reason: "fixture has no frontend consumer" },
      planned_or_changed_frontend_fact: { conclusion: "non_ui", reason: "fixture has no frontend change" },
    },
  }, null, 2)}\n\`\`\`\n`);
}

async function runUiSourceBindingCase(testCase, contractFacts) {
  const { state, workspace, artifacts, kernel, outcome, review } = testCase;
  return runOfficialStage("build-spec", {
    stage: "build-spec", task: state.task, kernel, identity: state.task.identity,
    workflowRunId: kernel.deriveStageWorkflowRunId("build-spec"), manifest: state.task.manifest,
    workspace, artifacts,
  }, {
    contract_facts: contractFacts,
    receipts: { review: review.ref, stage_outcomes: outcome.ref },
  });
}

describe("vNext official stage completion", () => {
  it("authenticates exactly one current completed build-code outcome for wh-review", () => {
    const state = fixture("current-build-code-review-subject");
    const outcome = stageOutcome(state, "build-code", { attemptId: "build-current-1" });
    const authenticated = authenticateCurrentBuildCodeStageOutcome(contextFor("build-code", state));
    expect(authenticated).toMatchObject({
      ref: outcome.ref,
      sha256: outcome.sha256,
      actor: { source_kind: "stage-agent", source_id: "fixture/executor", run_id: "build-current-1" },
      value: { status: "completed", stage: "build-code" },
    });
    stageOutcome(state, "build-code", { attemptId: "build-current-2" });
    expect(() => authenticateCurrentBuildCodeStageOutcome(contextFor("build-code", state))).toThrow(/exactly one current completed build-code outcome/);
  });

  it("publishes and consumes a dedicated transcript-authenticated spec-clarify receipt", async () => {
    const state = fixture("vnext-spec-clarify-receipt");
    const workspace = openCurrentTaskWorkspace(state.task);
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, state.task);
    const kernel = createTaskKernel(state.task, { workspace, artifacts });
    artifacts.writeAtomic("spec.md", artifacts.read("spec.md").replace(
      "spec-clarify trigger=false reason=夹具没有方向性歧义 open_direction_changing_questions=0。",
      "spec-clarify trigger=true reason=用户已选择完整范围 open_direction_changing_questions=0。",
    ));
    const askText = "这个规格要选择保守范围还是完整范围？";
    const replyText = "选择完整范围。";
    const cardHash = sha256(askText), replyHash = sha256(replyText);
    const lifecycleRounds = [{
      interaction_type: "spec-clarify",
      events: [
        { event: "ask", round: 1, card_ref: "host-message://ask/spec-clarify-1", card_hash: cardHash, questions: [{
          question_id: "scope", axis: "范围", independent: true,
          options: [
            { number: 1, label: "保守", meaning: "只做最小范围", consequence: "改动较少", risk: "收益延后" },
            { number: 2, label: "完整", meaning: "完成当前范围", consequence: "一次解决", risk: "改动较多" },
          ],
          recommended_option: 2, recommendation_reason: "直接解决当前问题",
        }] },
        { event: "wait", round: 1, card_ref: "host-message://ask/spec-clarify-1", card_hash: cardHash, status: "waiting-for-user" },
        { event: "reply", round: 1, card_ref: "host-message://ask/spec-clarify-1", card_hash: cardHash, source: "user", reply_ref: "host-message://reply/spec-clarify-1", reply_hash: replyHash, answers: [{ question_id: "scope", number: 2 }], remaining_question_ids: [], re_ranked: true },
        { event: "resume", round: 1, card_ref: "host-message://ask/spec-clarify-1", card_hash: cardHash, reply_ref: "host-message://reply/spec-clarify-1", reply_hash: replyHash, status: "resumed" },
      ],
    }];
    const review = publishReviewFixture({ ...state, kernel });
    const outcome = stageOutcome(state, "build-spec", { workspace, artifacts, attemptId: "attempt-spec-clarify-receipt" });
    const snapshot = state.candidate.captureSnapshot();
    const materialRevision = kernel.currentVNextMaterialRevision();
    const context = {
      stage: "build-spec", task: state.task, kernel, identity: state.task.identity,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-spec"), manifest: state.task.manifest,
      workspace, artifacts,
    };
    const sessionId = `session-spec-clarify-${process.pid}-${Date.now()}`;
    const home = join(state.root, "home");
    const transcript = join(home, ".codex", "sessions", "2026", "08", "31", `rollout-${sessionId}.jsonl`);
    mkdirSync(join(home, ".codex", "sessions", "2026", "08", "31"), { recursive: true });
    writeFileSync(transcript, "");
    const previousSessionId = process.env.CODEX_SESSION_ID;
    try {
      process.env.CODEX_SESSION_ID = sessionId;
      registerCodexSession({ sessionId, transcriptPath: transcript, cwd: process.cwd(), home, observedAtMs: 0 });
      bindCodexSessionTask({ projectName: "WorkflowHub", taskId: state.task.identity.taskId, taskPath: state.task.taskPath, cwd: process.cwd(), sessionId, boundAtMs: 1000 });
      const execution = stageAgentExecution("build-spec");
      let clock = 2000;
      for (const step of execution.steps) {
        const startedAtMs = clock;
        const endedAtMs = clock + (step.step_slug === "spec-clarify" ? 500 : 100);
        startCodexSessionEvent({ taskId: state.task.identity.taskId, stage: "build-spec", subjectKind: "step", subjectId: step.step_slug, cwd: process.cwd(), sessionId, startedAtMs });
        if (step.step_slug === "spec-clarify") {
          startCodexSessionEvent({ taskId: state.task.identity.taskId, stage: "build-spec", subjectKind: "skill", subjectId: "spec-clarify", parentSubjectId: step.step_slug, cwd: process.cwd(), sessionId, startedAtMs: startedAtMs + 100 });
          finishCodexSessionEvent({ taskId: state.task.identity.taskId, stage: "build-spec", subjectKind: "skill", subjectId: "spec-clarify", status: "completed", trigger: true, executed: true, version: "1.0.0", cwd: process.cwd(), sessionId, endedAtMs: startedAtMs + 400 });
        }
        finishCodexSessionEvent({ taskId: state.task.identity.taskId, stage: "build-spec", subjectKind: "step", subjectId: step.step_slug, status: "completed", cwd: process.cwd(), sessionId, endedAtMs });
        clock = endedAtMs + 100;
      }
      for (const skill of execution.skills.filter(({ skill_id }) => skill_id !== "spec-clarify")) {
        startCodexSessionEvent({ taskId: state.task.identity.taskId, stage: "build-spec", subjectKind: "skill", subjectId: skill.skill_id, cwd: process.cwd(), sessionId, startedAtMs: clock });
        finishCodexSessionEvent({ taskId: state.task.identity.taskId, stage: "build-spec", subjectKind: "skill", subjectId: skill.skill_id, status: "completed", trigger: true, executed: true, version: skill.version, cwd: process.cwd(), sessionId, endedAtMs: clock + 100 });
        clock += 200;
      }
      const clarifyStep = execution.steps.find(({ step_slug }) => step_slug === "spec-clarify");
      const clarifyStepStart = 2000 + execution.steps.slice(0, clarifyStep.order - 1)
        .reduce((total, step) => total + (step.step_slug === "spec-clarify" ? 600 : 200), 0);
      writeFileSync(transcript, [
        JSON.stringify({ timestamp: new Date(clarifyStepStart + 200).toISOString(), type: "response_item", payload: { type: "message", id: "clarify-ask-1", role: "assistant", content: [{ type: "output_text", text: askText }] } }),
        JSON.stringify({ timestamp: new Date(clarifyStepStart + 300).toISOString(), type: "response_item", payload: { type: "message", id: "clarify-reply-1", role: "user", content: [{ type: "input_text", text: replyText }] } }),
      ].join("\n") + "\n");
      execution.spec_analyze.packet.clarify = {
        task_id: state.task.identity.taskId,
        stage: "build-spec",
        snapshot_tree: snapshot.tree,
        material_revision: materialRevision,
        status: "resolved",
        trigger: true,
        reason: "用户已选择完整范围",
        lifecycle_rounds: lifecycleRounds,
      };
      execution.spec_analyze.evidence_subjects.spec = { subject_kind: "step", subject_id: execution.steps[1].step_slug };
      recordCodexSessionSpecAnalyze({
        taskId: state.task.identity.taskId,
        stage: "build-spec",
        cwd: process.cwd(),
        sessionId,
        value: {
          schema_version: "workflowhub-spec-analyze-stage-outcome.v1",
          task_id: state.task.identity.taskId,
          stage: "build-spec",
          snapshot_tree: snapshot.tree,
          material_revision: materialRevision,
          ...execution.spec_analyze,
          result: { status: "consistent" },
        },
      });
      const controlled = bindCurrentSessionOutcome({
        context,
        stage: "build-spec",
        cwd: process.cwd(),
        input: { receipts: { review: review.ref } },
      });
      const currentSessionOutcome = JSON.parse(state.task.readRecord(controlled.receipts.stage_outcomes));
      expect(currentSessionOutcome.producer).toMatchObject({
        kind: "workflowhub-session",
        source_id: `codex/${sessionId}`,
        source_family: "codex",
      });
      expect(controlled.receipts.clarify).toMatch(/^quality\/evidence\/interactions\/[a-f0-9]{64}\.json$/);
      const clarify = JSON.parse(state.task.readRecord(controlled.receipts.clarify));
      expect(clarify).not.toHaveProperty("command");
      expect(clarify).toMatchObject({ task_id: state.task.identity.taskId, stage: "build-spec", trigger: true, producer: { component: "spec-clarify" }, transcript: { session_id: sessionId } });

      const result = await runOfficialStage("build-spec", context, controlled);

      const clarifyFact = result.quality_fact_refs
        .map((ref) => JSON.parse(state.task.readRecord(ref)))
        .find((fact) => fact.subject === "clarify");
      expect(clarifyFact).toMatchObject({ status: "passed" });

      const explicitInput = { receipts: { review: review.ref, stage_outcomes: outcome.ref } };
      expect(bindCurrentSessionOutcome({ context, stage: "build-spec", cwd: process.cwd(), input: explicitInput }))
        .toEqual(explicitInput);

      writeFileSync(join(workspace.worktreeRoot, "clarify-snapshot-drift.txt"), "non-material snapshot drift\n");
      const stale = bindCurrentSessionOutcome({
        context,
        stage: "build-spec",
        cwd: process.cwd(),
        input: { receipts: { review: review.ref } },
      });
      expect(stale.receipts).toEqual({ review: review.ref });
    } finally {
      try { endCodexSession({ sessionId, cwd: process.cwd() }); } catch {}
      if (previousSessionId === undefined) delete process.env.CODEX_SESSION_ID;
      else process.env.CODEX_SESSION_ID = previousSessionId;
    }
  });

  it("rejects a session event that belongs to another stage", () => {
    const state = fixture("workflowhub-session-stage-boundary");
    const context = contextFor("make-decision", state);
    expect(() => publishCurrentWorkflowHubSession({
      context,
      stage: "make-decision",
      attemptId: "attempt-stage-boundary",
      input: {
        session: {
          task_id: state.task.identity.taskId,
          host: "codex-test",
          source_id: "codex/session-stage-boundary",
          source_family: "codex",
          session_id: "session-stage-boundary",
          source_ref: "codex-session-stage-boundary",
          events: [{
            task_id: state.task.identity.taskId,
            stage: "build-spec",
            subject_kind: "step",
            subject_id: "load-context",
            started_at_ms: 1000,
            ended_at_ms: 1100,
            status: "completed",
            result_summary: "wrong stage event",
            evidence: [],
          }],
        },
      },
    })).toThrow(/stage does not match the current stage/i);
  });

  it("records the normal WorkflowHub session lifecycle without requiring a second agent", async () => {
    const state = fixture("workflowhub-session-recorder");
    const context = contextFor("make-decision", state);
    const sourceEvidence = { kind: "codex-session-event", source_ref: "codex-rollout-thread-session", session_id: "session-1" };
    let clock = 1000;
    let failPublish = true;
    const retryKernel = {
      publishCanonicalRecord(...args) {
        if (failPublish) {
          failPublish = false;
          throw new Error("simulated canonical publish failure");
        }
        return state.kernel.publishCanonicalRecord(...args);
      },
    };
    brandTaskKernel(retryKernel);
    const recorder = createWorkflowHubSessionRecorder({
      task: state.task,
      kernel: retryKernel,
      candidateWorkspace: state.candidate,
      stage: "make-decision",
      attemptId: "attempt-workflowhub-session",
      workflowRunId: context.workflowRunId,
      host: "codex-desktop",
      sourceId: "codex/session-1",
      sourceFamily: "codex",
      sessionId: "session-1",
      sourceRef: "codex-rollout-thread-session",
      now: () => clock,
      requirementAuthentication: createRequirementAuthenticationFixture({ taskId: state.task.identity.taskId, runId: context.workflowRunId, sessionId: "session-1" }),
    });
    const fixtureExecution = stageAgentExecution("make-decision");
    const finishStep = (step) => {
      const finish = recorder.startStep(step.step_slug);
      clock += 10;
      finish({
        status: "completed",
        input_refs: step.input_refs,
        result_summary: `当前会话完成 ${step.step_slug}`,
        evidence: [sourceEvidence],
        usage: step.step_slug === "load-context" ? undefined : { tokens: 2, event_id: `usage-${step.step_slug}` },
      });
    };
    const finishSkill = (skill) => {
      const finish = recorder.startSkill(skill.skill_id);
      clock += 10;
      finish({
        status: "completed",
        trigger: true,
        executed: true,
        version: "workflowhub-session-skill-1",
        result_summary: `当前会话完成 ${skill.skill_id}`,
        evidence: [sourceEvidence],
        usage: { tokens: 3, event_id: `usage-${skill.skill_id}` },
      });
    };
    finishStep(fixtureExecution.steps[0]);
    finishSkill(fixtureExecution.skills[0]);
    for (const step of fixtureExecution.steps.slice(1)) finishStep(step);
    for (const skill of fixtureExecution.skills.slice(1)) finishSkill(skill);
    expect(() => recorder.finish({
      status: "incomplete",
      spec_analyze: fixtureExecution.spec_analyze,
    })).toThrow(/simulated canonical publish failure/);
    const outcome = recorder.finish({
      status: "incomplete",
      spec_analyze: fixtureExecution.spec_analyze,
    });
    expect(outcome.value.producer).toMatchObject({
      kind: "workflowhub-session",
      host: "codex-desktop",
      session_id: "session-1",
      source_ref: "codex-rollout-thread-session",
    });
    expect(outcome.value.step_outcomes[0].cost).toMatchObject({
      status: "unavailable", duration_ms: null, tokens: null, reason: "session_lifecycle_telemetry_not_collected",
    });
    expect(outcome.value.step_outcomes[1].cost).toMatchObject({ status: "unavailable", duration_ms: null, tokens: null });
    const result = await runOfficialStage("make-decision", context, {
      attempt_id: "attempt-workflowhub-session",
      receipts: { stage_outcomes: outcome.ref },
    });
    expect(result).toMatchObject({ stage: "make-decision", stage_outcome_status: "incomplete", quality_status: "incomplete" });
  });

  it("accepts a completed session with deliberate not_applicable boundaries", async () => {
    const state = fixture("workflowhub-session-not-applicable");
    const context = contextFor("build-plan", state);
    const fixtureExecution = stageAgentExecution("build-plan");
    let clock = 1000;
    const recorder = createWorkflowHubSessionRecorder({
      task: state.task,
      kernel: state.kernel,
      candidateWorkspace: state.candidate,
      stage: "build-plan",
      attemptId: "attempt-workflowhub-session-not-applicable",
      workflowRunId: context.workflowRunId,
      host: "codex-test",
      sourceId: "codex/session-not-applicable",
      sourceFamily: "codex",
      sessionId: "session-not-applicable",
      sourceRef: "codex-session-not-applicable",
      now: () => clock,
    });
    for (const step of fixtureExecution.steps) {
      const notApplicable = step.step_slug === "review-plan";
      const finish = recorder.startStep(step.step_slug);
      clock += 10;
      finish({
        status: notApplicable ? "not_applicable" : "completed",
        input_refs: step.input_refs,
        result_summary: notApplicable ? "host-owned review is evaluated separately" : `当前会话完成 ${step.step_slug}`,
        ...(notApplicable ? { reason: "separate_benchmark_surface" } : {}),
        evidence: step.evidence,
      });
    }
    for (const skill of fixtureExecution.skills) {
      const notApplicable = skill.skill_id === "wh-review";
      const finish = recorder.startSkill(skill.skill_id);
      clock += 10;
      finish({
        status: notApplicable ? "not_applicable" : "completed",
        trigger: notApplicable ? false : true,
        executed: notApplicable ? false : true,
        version: skill.version,
        result_summary: notApplicable ? "host-owned review is evaluated separately" : `当前会话完成 ${skill.skill_id}`,
        ...(notApplicable ? { reason: "separate_benchmark_surface" } : {}),
        evidence: skill.evidence,
      });
    }
    const analyzer = structuredClone(fixtureExecution.spec_analyze);
    analyzer.evidence_subjects = Object.fromEntries(
      ["decision-log", "spec", "plan", "tasks"].map((ref, index) => [ref, {
        subject_kind: "step",
        subject_id: fixtureExecution.steps[index].step_slug,
      }]),
    );
    const outcome = recorder.finish({ status: "completed", spec_analyze: analyzer });
    expect(outcome.value.status).toBe("completed");
    expect(outcome.value.step_outcomes.find((entry) => entry.step_slug === "review-plan").status).toBe("not_applicable");
    expect(outcome.value.skill_outcomes.find((entry) => entry.skill_id === "wh-review").status).toBe("not_applicable");
    for (const logicalRef of ["decision-log", "spec", "plan", "tasks"]) {
      const packetEvidence = outcome.value.spec_analyze.packet.evidence.find((entry) => entry.ref === logicalRef);
      const binding = outcome.value.spec_analyze.evidence_bindings[logicalRef];
      expect(packetEvidence).toMatchObject({
        ref: logicalRef,
        kind: logicalRef,
        status: "fresh",
        hash: binding.sha256,
        snapshot_tree: binding.snapshot_tree,
        canonical_ref: binding.ref,
      });
    }
  });

  it("turns a host outcome into canonical quality facts in the same handoff", async () => {
    const state = fixture("workflowhub-host-quality-handoff");
    const context = contextFor("make-decision", state);
    const outcome = publishStageAgentOutcome({
      task: state.task,
      kernel: state.kernel,
      artifacts: ArtifactDir.open(state.candidate.worktreeRoot, state.task),
      candidateWorkspace: state.candidate,
      stage: "make-decision",
      attemptId: "attempt-host-quality-handoff",
      workflowRunId: context.workflowRunId,
      execution: stageAgentExecution("make-decision"),
      requirementAuthentication: createRequirementAuthenticationFixture({
        taskId: state.task.identity.taskId,
        runId: context.workflowRunId,
      }),
    });
    const published = await publishOfficialStageOutcome({
      context,
      outcome,
      stage: "make-decision",
      attemptId: "attempt-host-quality-handoff",
    });
    expect(published.quality.quality_fact_refs.length).toBeGreaterThan(0);
    expect(published.quality.quality_status).toBe("incomplete");
    expect(published.quality.quality_fact_refs.every((ref) => state.task.readRecord(ref))).toBe(true);
  });

  it("keeps an unavailable host outcome incomplete while still publishing canonical facts", async () => {
    const state = fixture("workflowhub-host-unavailable-quality-handoff");
    const context = contextFor("make-decision", state);
    const outcome = publishUnavailableStageAgentOutcome({
      task: state.task,
      kernel: state.kernel,
      artifacts: ArtifactDir.open(state.candidate.worktreeRoot, state.task),
      candidateWorkspace: state.candidate,
      stage: "make-decision",
      attemptId: "attempt-host-unavailable-quality-handoff",
      workflowRunId: context.workflowRunId,
      host: "codex-test",
      agentRunId: "agent-unavailable-1",
      reason: "host did not return a stage packet",
    });
    const published = await publishOfficialStageOutcome({
      context,
      outcome,
      stage: "make-decision",
      attemptId: "attempt-host-unavailable-quality-handoff",
    });
    expect(published.quality).toMatchObject({ stage_outcome_status: "unavailable", quality_status: "incomplete" });
    expect(published.quality.quality_fact_refs.length).toBeGreaterThan(0);
    expect(published.quality.quality_fact_refs
      .map((ref) => JSON.parse(state.task.readRecord(ref)).status)
      .some((status) => status !== "passed")).toBe(true);
  });

  it("accepts a host-supplied Stage Agent result through the adapter and the official route", async () => {
    const state = fixture("stage-agent-adapter");
    const artifacts = ArtifactDir.open(state.candidate.worktreeRoot, state.task);
    const context = contextFor("make-decision", state);
    const outcome = publishStageAgentOutcome({
      task: state.task, kernel: state.kernel, artifacts, candidateWorkspace: state.candidate,
      stage: "make-decision", attemptId: "attempt-real-stage-agent", workflowRunId: context.workflowRunId,
      execution: stageAgentExecution("make-decision"),
      requirementAuthentication: createRequirementAuthenticationFixture({ taskId: state.task.identity.taskId, runId: context.workflowRunId }),
    });
    expect(outcome.value.producer).toMatchObject({ kind: "stage-agent", host: "test-host" });
    expect(outcome.value.run_id).toBe(context.workflowRunId);
    expect(outcome.value.skill_outcomes[0].consumer_binding).toMatchObject({
      status: "completed",
      consumer: "stage-handlers#interactionAggregateFacts",
      identity: {
        task_id: state.task.identity.taskId,
        stage: "make-decision",
      },
    });
    const proof = JSON.parse(state.task.readRecord(outcome.value.step_outcomes[0].evidence_refs[0].ref));
    expect(proof.host_evidence).toEqual({ kind: "host-command", command: "stage-agent-test", exit_code: 0, output: "actual host result" });
    const result = await runOfficialStage("make-decision", context, { attempt_id: "attempt-real-stage-agent", receipts: { stage_outcomes: outcome.ref } });
    expect(result).toMatchObject({ stage: "make-decision", stage_outcome_status: "completed", work_status: "ready" });
    expect(result.skill_consumer_bindings.find((entry) => entry.skill_id === "decision-log")).toMatchObject({ status: "consumed" });
    expect(result.skill_consumer_bindings.find((entry) => entry.skill_id === "stage-reflection")).toMatchObject({
      status: "consumed",
      consumer: "stage-runner#runStageEndReflection",
    });
  });

  it("does not complete verify-code when the current code review still has findings", async () => {
    const state = fixture("stage-agent-review-findings");
    const artifacts = ArtifactDir.open(state.candidate.worktreeRoot, state.task);
    const context = contextFor("verify-code", state);
    const execution = stageAgentExecution("verify-code");
    execution.code_review.result = {
      ...execution.code_review.result,
      status: "findings",
      findings: [{
        severity: "major",
        path: "runtime/example.mjs",
        issue: "当前实现仍有未修复问题",
        recommendation: "在当前任务内修复并重跑审查",
      }],
    };
    const outcome = publishStageAgentOutcome({
      task: state.task, kernel: state.kernel, artifacts, candidateWorkspace: state.candidate,
      stage: "verify-code", attemptId: "attempt-review-findings", workflowRunId: context.workflowRunId, execution,
    });
    const result = await runOfficialStage("verify-code", context, {
      attempt_id: "attempt-review-findings",
      receipts: { stage_outcomes: outcome.ref },
    });
    expect(result).toMatchObject({
      status: "in_progress",
      quality_status: "incomplete",
      // The Stage Agent execution is valid; the serious review finding keeps
      // verify-code quality incomplete so the current stage can repair it.
      stage_outcome_status: "completed",
    });
    expect(result.completion.missing).toContain("code_review");
  });

  it("does not turn a nonblocking minor code finding into a stage-outcome failure", async () => {
    const state = fixture("stage-agent-review-minor");
    const artifacts = ArtifactDir.open(state.candidate.worktreeRoot, state.task);
    const context = contextFor("verify-code", state);
    const execution = stageAgentExecution("verify-code");
    execution.code_review.result = {
      ...execution.code_review.result,
      status: "findings",
      findings: [{
        severity: "minor",
        path: "runtime/example.mjs",
        issue: "存在非阻断建议",
        recommendation: "后续迭代可优化",
      }],
    };
    const outcome = publishStageAgentOutcome({
      task: state.task, kernel: state.kernel, artifacts, candidateWorkspace: state.candidate,
      stage: "verify-code", attemptId: "attempt-review-minor", workflowRunId: context.workflowRunId, execution,
    });
    const result = await runOfficialStage("verify-code", context, {
      attempt_id: "attempt-review-minor",
      receipts: { stage_outcomes: outcome.ref },
    });
    expect(result.stage_outcome_status).toBe("completed");
    expect(result.stage_outcome_diagnostic).toBeUndefined();
  });

  it("consumes a broker-provenance wh-review intent through stage-runtime", async () => {
    const state = fixture("stage-runtime-wh-review-intent");
    const context = contextFor("verify-code", state);
    const whReview = writeFormalReviewFixture({
      task: state.task,
      stage: "verify-code",
      snapshotTree: state.candidate.captureSnapshot().tree,
      verdict: "pass",
      reviewScope: null,
      materialRevision: state.kernel.currentVNextMaterialRevision(),
    });
    const dshReview = writeFormalReviewFixture({
      task: state.task,
      stage: "verify-code",
      snapshotTree: state.candidate.captureSnapshot().tree,
      verdict: "pass",
      reviewScope: null,
      materialRevision: state.kernel.currentVNextMaterialRevision(),
    });
    const intent = publishStageReviewFact({
      trusted: {
        task: state.task,
        taskId: state.task.identity.taskId,
        kernel: state.kernel,
      },
      stage: "verify-code",
      reviewKind: null,
      result: {
        status: "available",
        resultRef: whReview.resultRef,
        attemptRef: whReview.attemptRef,
        snapshotTree: state.candidate.captureSnapshot().tree,
        materialId: whReview.materialId,
        subjectKind: "worktree",
        phaseId: null,
        reviewScope: null,
      },
    });
    const outcome = stageOutcome(state, "verify-code", {
      attemptId: "attempt-wh-review-intent",
      qualityReview: dshReview,
    });
    const result = await runOfficialStage("verify-code", context, {
      attempt_id: "attempt-wh-review-intent",
      review_fact_intent: intent,
      receipts: { quality_review: dshReview.resultRef, review: whReview.resultRef, stage_outcomes: outcome.ref },
    });
    const codeReviewFacts = result.quality_fact_refs
      .map((ref) => JSON.parse(state.task.readRecord(ref)))
      .filter((fact) => fact.kind === "review" && fact.subject === "code_review");
    expect(codeReviewFacts).toHaveLength(1);
    expect(codeReviewFacts[0]).toMatchObject({ status: "recorded", snapshot_tree: state.candidate.captureSnapshot().tree });
    expect(codeReviewFacts[0].evidence[0].ref).toBe(dshReview.resultRef);
    expect(result.quality_fact_refs
      .map((ref) => JSON.parse(state.task.readRecord(ref)))
      .some((fact) => fact.subject === "independent_review" && fact.evidence[0].ref === whReview.resultRef)).toBe(true);
    expect(result.completion.predicates.code_review).toMatchObject({ status: "satisfied" });
  });

  it("rejects a same-snapshot review result without the current material revision", async () => {
    const state = fixture("stage-runtime-wh-review-intent-old-material");
    const review = writeFormalReviewFixture({
      task: state.task,
      stage: "verify-code",
      snapshotTree: state.candidate.captureSnapshot().tree,
      verdict: "pass",
      reviewScope: null,
    });
    expect(() => publishStageReviewFact({
      trusted: { task: state.task, taskId: state.task.identity.taskId, kernel: state.kernel },
      stage: "verify-code",
      reviewKind: null,
      result: {
        status: "available",
        resultRef: review.resultRef,
        attemptRef: review.attemptRef,
        snapshotTree: state.candidate.captureSnapshot().tree,
        materialId: review.materialId,
        subjectKind: "worktree",
        phaseId: null,
        reviewScope: null,
      },
    })).toThrow(/current material revision/);
  });

  it("preserves an unavailable wh-review intent as unavailable official quality", async () => {
    const state = fixture("stage-runtime-wh-review-intent-unavailable");
    const context = contextFor("verify-code", state);
    const snapshotTree = state.candidate.captureSnapshot().tree;
    const attemptId = "attempt-wh-review-intent-unavailable";
    const attemptRef = `quality/reviews/attempts/${attemptId}/attempt.json`;
    const materialId = "e".repeat(64);
    createCanonicalReviewWriter({ task: state.task, taskId: state.task.identity.taskId, stage: "verify-code" }).writeAttempt(attemptRef, {
      version: "wh-review-attempt.v1",
      attempt_id: attemptId,
      task_id: state.task.identity.taskId,
      stage: "verify-code",
      review_track: null,
      review_kind: null,
      source: { target_commit: snapshotTree, base_commit: snapshotTree, base_tree: snapshotTree, captured_head: snapshotTree },
      snapshot_tree: snapshotTree,
      material_id: materialId,
      material_revision: state.kernel.currentVNextMaterialRevision(),
      subject_kind: "worktree",
      phase_id: null,
      review_scope: null,
      provider_attempts: [{
        provider: "fixture-provider",
        status: "failed",
        session_id: null,
        runtime_id: "fixture-runtime",
        output_ref: null,
        error: { code: "PROCESS_DEAD", message: "fixture provider unavailable" },
      }],
      terminal_status: "unavailable",
      error: { code: "REVIEW_ROUTE_UNAVAILABLE", message: "fixture route unavailable" },
    });
    const intent = publishStageReviewFact({
      trusted: { task: state.task, taskId: state.task.identity.taskId, kernel: state.kernel },
      stage: "verify-code", reviewKind: null,
      result: {
        status: "unavailable", resultRef: null, attemptRef, snapshotTree, materialId,
        subjectKind: "worktree", phaseId: null, reviewScope: null,
      },
    });
    const outcome = stageOutcome(state, "verify-code", { attemptId, status: "incomplete", qualityReview: { ref: attemptRef } });
    const result = await runOfficialStage("verify-code", context, {
      attempt_id: attemptId,
      review_fact_intent: intent,
      receipts: { quality_review: attemptRef, review: attemptRef, stage_outcomes: outcome.ref },
    });
    const codeReviewFacts = result.quality_fact_refs
      .map((ref) => JSON.parse(state.task.readRecord(ref)))
      .filter((fact) => fact.kind === "review" && fact.subject === "code_review");
    expect(codeReviewFacts).toHaveLength(1);
    expect(codeReviewFacts[0]).toMatchObject({ status: "unavailable" });
    expect(result.completion.predicates.code_review).toMatchObject({ status: "missing" });
  });

  it("rejects an unavailable stage review attempt with stale material revision", async () => {
    const state = fixture("stage-runtime-stale-unavailable-review");
    const context = contextFor("verify-code", state);
    const snapshotTree = state.candidate.captureSnapshot().tree;
    const attemptId = "attempt-stale-unavailable-review";
    const attemptRef = `quality/reviews/attempts/${attemptId}/attempt.json`;
    createCanonicalReviewWriter({ task: state.task, taskId: state.task.identity.taskId, stage: "verify-code" }).writeAttempt(attemptRef, {
      version: "wh-review-attempt.v1",
      attempt_id: attemptId,
      task_id: state.task.identity.taskId,
      stage: "verify-code",
      review_track: null,
      review_kind: null,
      source: { target_commit: snapshotTree, base_commit: snapshotTree, base_tree: snapshotTree, captured_head: snapshotTree },
      snapshot_tree: snapshotTree,
      material_id: "f".repeat(64),
      material_revision: `revision-${"f".repeat(64)}`,
      subject_kind: "worktree",
      phase_id: null,
      review_scope: null,
      provider_attempts: [{
        provider: "fixture-provider",
        status: "failed",
        session_id: null,
        runtime_id: "fixture-runtime",
        output_ref: null,
        error: { code: "PROCESS_DEAD", message: "fixture provider unavailable" },
      }],
      terminal_status: "unavailable",
      error: { code: "REVIEW_ROUTE_UNAVAILABLE", message: "fixture route unavailable" },
    });
    const outcome = stageOutcome(state, "verify-code", {
      attemptId,
      status: "incomplete",
      qualityReview: { ref: attemptRef },
    });
    await expect(runOfficialStage("verify-code", context, {
      attempt_id: attemptId,
      receipts: { quality_review: attemptRef, stage_outcomes: outcome.ref },
    })).rejects.toThrow(/quality_review requires a bound dsh-code-review stage outcome/);
  });

  it("keeps serious findings in wh-review advice without replacing canonical code_review", async () => {
    const state = fixture("stage-runtime-wh-review-intent-findings");
    const context = contextFor("verify-code", state);
    const whReview = writeFormalReviewFixture({
      task: state.task,
      stage: "verify-code",
      snapshotTree: state.candidate.captureSnapshot().tree,
      verdict: "findings",
      reviewScope: null,
      materialRevision: state.kernel.currentVNextMaterialRevision(),
    });
    const dshReview = writeFormalReviewFixture({
      task: state.task,
      stage: "verify-code",
      snapshotTree: state.candidate.captureSnapshot().tree,
      verdict: "pass",
      reviewScope: null,
      materialRevision: state.kernel.currentVNextMaterialRevision(),
    });
    const intent = publishStageReviewFact({
      trusted: { task: state.task, taskId: state.task.identity.taskId, kernel: state.kernel },
      stage: "verify-code",
      reviewKind: null,
      result: {
        status: "available",
        resultRef: whReview.resultRef,
        attemptRef: whReview.attemptRef,
        snapshotTree: state.candidate.captureSnapshot().tree,
        materialId: whReview.materialId,
        subjectKind: "worktree",
        phaseId: null,
        reviewScope: null,
      },
    });
    const outcome = stageOutcome(state, "verify-code", {
      attemptId: "attempt-wh-review-intent-findings",
      qualityReview: dshReview,
    });
    const result = await runOfficialStage("verify-code", context, {
      attempt_id: "attempt-wh-review-intent-findings",
      review_fact_intent: intent,
      receipts: { quality_review: dshReview.resultRef, review: whReview.resultRef, stage_outcomes: outcome.ref },
    });
    const facts = state.task.listCanonicalQualityFactRefs()
      .map((ref) => JSON.parse(state.task.readRecord(ref)))
      .filter((fact) => fact.kind === "review");
    expect(facts.filter((fact) => fact.subject === "code_review")).toHaveLength(1);
    expect(facts.find((fact) => fact.subject === "code_review").evidence[0].ref).toBe(dshReview.resultRef);
    expect(facts.find((fact) => fact.subject === "independent_review")).toMatchObject({ status: "recorded" });
    expect(result.completion.predicates.code_review).toMatchObject({ status: "satisfied" });
  });

  it("rejects an invalid review intent before invoking handler validation", async () => {
    const state = fixture("stage-runtime-wh-review-intent-preflight");
    const context = contextFor("verify-code", state);
    const review = writeFormalReviewFixture({
      task: state.task,
      stage: "verify-code",
      snapshotTree: state.candidate.captureSnapshot().tree,
      verdict: "pass",
      reviewScope: null,
      materialRevision: state.kernel.currentVNextMaterialRevision(),
    });
    const intent = publishStageReviewFact({
      trusted: { task: state.task, taskId: state.task.identity.taskId, kernel: state.kernel },
      stage: "verify-code",
      reviewKind: null,
      result: {
        status: "available",
        resultRef: review.resultRef,
        attemptRef: review.attemptRef,
        snapshotTree: state.candidate.captureSnapshot().tree,
        materialId: review.materialId,
        subjectKind: "worktree",
        phaseId: null,
        reviewScope: null,
      },
    });
    intent.evidence[0].sha256 = "0".repeat(64);
    const outcome = stageOutcome(state, "verify-code", { attemptId: "attempt-wh-review-intent-preflight" });
    await expect(runOfficialStage("verify-code", context, {
      attempt_id: "attempt-wh-review-intent-preflight",
      review_fact_intent: intent,
      receipts: {
        review: review.resultRef,
        stage_outcomes: outcome.ref,
        unexpected_host_receipt: "quality/tests/not-allowed.json",
      },
    })).rejects.toThrow(/review fact intent evidence hash mismatch/);
    expect(state.task.listCanonicalQualityFactRefs()
      .map((ref) => JSON.parse(state.task.readRecord(ref)))
      .filter((fact) => fact.kind === "review" && fact.subject === "code_review")).toHaveLength(0);
  });

  it("does not publish a review fact when the official handler rejects the invocation", async () => {
    const state = fixture("stage-runtime-wh-review-intent-handler-failure");
    const context = contextFor("verify-code", state);
    const review = writeFormalReviewFixture({
      task: state.task,
      stage: "verify-code",
      snapshotTree: state.candidate.captureSnapshot().tree,
      verdict: "pass",
      reviewScope: null,
      materialRevision: state.kernel.currentVNextMaterialRevision(),
    });
    const intent = publishStageReviewFact({
      trusted: { task: state.task, taskId: state.task.identity.taskId, kernel: state.kernel },
      stage: "verify-code",
      reviewKind: null,
      result: {
        status: "available",
        resultRef: review.resultRef,
        attemptRef: review.attemptRef,
        snapshotTree: state.candidate.captureSnapshot().tree,
        materialId: review.materialId,
        subjectKind: "worktree",
        phaseId: null,
        reviewScope: null,
      },
    });
    const outcome = stageOutcome(state, "verify-code", { attemptId: "attempt-wh-review-handler-failure" });
    await expect(runOfficialStage("verify-code", context, {
      attempt_id: "attempt-wh-review-handler-failure",
      review_fact_intent: intent,
      receipts: {
        review: review.resultRef,
        stage_outcomes: outcome.ref,
        unexpected_host_receipt: "quality/tests/not-allowed.json",
      },
    })).rejects.toThrow(/unexpected receipt fields/i);
    const codeReviewFacts = state.task.listCanonicalQualityFactRefs()
      .map((ref) => JSON.parse(state.task.readRecord(ref)))
      .filter((fact) => fact.kind === "review" && fact.subject === "code_review");
    expect(codeReviewFacts).toHaveLength(0);
  });
  it("executes the current handler when no external Stage Agent outcome exists", async () => {
    const state = fixture("stage-agent-optional");
    const result = await runOfficialStage("make-decision", contextFor("make-decision", state), {});
    expect(result).toMatchObject({
      stage: "make-decision",
      work_status: "ready",
      quality_status: "incomplete",
      stage_outcome_ref: null,
      stage_outcome_hash: null,
      stage_outcome_status: "unavailable",
      stage_outcome_diagnostic: { status: "unavailable", reason: "stage_outcome_missing" },
      stage_reflection: { status: "unavailable", step_status: "unavailable", persisted: false, availability: { state: "unavailable", reason_code: "executor_absent" } },
    });
  });
  it("records a supplied invalid optional outcome without hiding the diagnostic", async () => {
    const state = fixture("stage-agent-invalid-optional");
    const before = state.task.listCanonicalQualityFactRefs();
    const result = await runOfficialStage("make-decision", contextFor("make-decision", state), {
      receipts: { stage_outcomes: `quality/evidence/stage-outcomes/make-decision/${"0".repeat(64)}.json` },
    });
    expect(result).toMatchObject({
      stage: "make-decision",
      stage_outcome_ref: null,
      stage_outcome_hash: null,
      stage_outcome_status: "unavailable",
      stage_outcome_diagnostic: {
        status: "unavailable",
        reason: "stage_outcome_invalid",
        error_code: "MATERIAL_INCOMPLETE",
      },
    });
    expect(state.task.listCanonicalQualityFactRefs().length).toBeGreaterThan(before.length);
  });
  it("accepts the same result through the private current-session bridge and official route", async () => {
    const state = fixture("stage-agent-host-bridge");
    const execution = stageAgentExecution("make-decision");
    let timestamp = 1000;
    const events = [
      ...execution.steps.map((entry) => {
        const started = timestamp;
        timestamp += 10;
        return { task_id: state.task.identity.taskId, subject_kind: "step", subject_id: entry.step_slug, stage: "make-decision", started_at_ms: started, ended_at_ms: timestamp, ...entry, usage: { tokens: entry.cost.tokens, event_id: `usage-${entry.step_slug}` } };
      }),
      ...execution.skills.map((entry) => {
        const started = timestamp;
        timestamp += 10;
        return { task_id: state.task.identity.taskId, subject_kind: "skill", subject_id: entry.skill_id, stage: "make-decision", started_at_ms: started, ended_at_ms: timestamp, ...entry, usage: { tokens: entry.cost.tokens, event_id: `usage-${entry.skill_id}` } };
      }),
    ];
    const request = {
      project_name: state.task.identity.projectName,
      task_id: state.task.identity.taskId,
      stage: "make-decision",
      attempt_id: "attempt-external-host-bridge",
      task_path: state.task.taskPath,
      session: {
        host: "codex-desktop",
        source_id: "codex/session-bridge",
        source_family: "codex",
        session_id: "session-bridge",
        task_id: state.task.identity.taskId,
        source_ref: "codex-rollout-bridge",
        status: execution.status,
        events,
        spec_analyze: execution.spec_analyze,
      },
    };
    const requirementAuthentication = createRequirementAuthenticationFixture({
      taskId: state.task.identity.taskId,
      runId: state.kernel.deriveStageWorkflowRunId("make-decision"),
      sessionId: "session-bridge",
    });
    const published = publishCurrentWorkflowHubSession({
      context: contextFor("make-decision", state),
      input: request,
      stage: "make-decision",
      attemptId: "attempt-external-host-bridge",
      requirementAuthentication,
    });
    expect(published.value.step_outcomes[0].cost).toMatchObject({
      status: "unavailable", duration_ms: null, tokens: null,
    });
    const qualityBeforeReplay = state.task.listCanonicalQualityFactRefs();
    const replayed = publishCurrentWorkflowHubSession({
      context: contextFor("make-decision", state),
      input: request,
      stage: "make-decision",
      attemptId: "attempt-external-host-bridge",
      requirementAuthentication,
    });
    expect(replayed).toMatchObject({ ref: published.ref, sha256: published.sha256, idempotent: true });
    expect(state.task.listCanonicalQualityFactRefs()).toEqual(qualityBeforeReplay);
    const conflictingValue = {
      ...published.value,
      producer: { ...published.value.producer, source_ref: "codex-rollout-conflict" },
    };
    const conflictingRaw = `${JSON.stringify(conflictingValue, null, 2)}\n`;
    const conflictingRef = `quality/evidence/stage-outcomes/make-decision/${sha256(conflictingRaw)}.json`;
    state.kernel.publishCanonicalRecord(conflictingRef, conflictingRaw);
    expect(() => publishCurrentWorkflowHubSession({
      context: contextFor("make-decision", state),
      input: request,
      stage: "make-decision",
      attemptId: "attempt-external-host-bridge",
      requirementAuthentication,
    })).toThrow(/BRIDGE_REPLAY_CONFLICT/);
    const result = {
      schema_version: "workflowhub-stage-agent-bridge-result.v1",
      task_id: state.task.identity.taskId,
      stage: "make-decision",
      attempt_id: "attempt-external-host-bridge",
      outcome_ref: published.ref,
      outcome_sha256: published.sha256,
      outcome_status: published.value.status,
      producer: published.value.producer,
    };
    expect(result).toMatchObject({
      schema_version: "workflowhub-stage-agent-bridge-result.v1",
      task_id: state.task.identity.taskId,
      stage: "make-decision",
      attempt_id: "attempt-external-host-bridge",
      outcome_status: "completed",
    });
    expect(result.producer).toMatchObject({ kind: "workflowhub-session", session_id: "session-bridge", source_ref: "codex-rollout-bridge" });
    const raw = state.task.readRecord(result.outcome_ref);
    expect(createHash("sha256").update(raw).digest("hex")).toBe(result.outcome_sha256);
    const official = await runOfficialStage("make-decision", contextFor("make-decision", state), {
      attempt_id: "attempt-external-host-bridge",
      receipts: { stage_outcomes: result.outcome_ref },
    });
    expect(official).toMatchObject({ stage: "make-decision", stage_outcome_status: "completed", work_status: "ready" });
  });

  it("rejects legacy bridge input and host quality receipts before any writer call", async () => {
    const common = {
      project_name: "WorkflowHub",
      task_id: "bridge-boundary",
      stage: "make-decision",
      attempt_id: "attempt-bridge-boundary",
      task_path: join(tmpdir(), "bridge-boundary"),
    };
    await expect(workflowHubBridgeMain({ ...common, execution: {} })).rejects.toThrow(/narrow session|historical-only/i);
    await expect(workflowHubBridgeMain({
      ...common,
      unavailable: { host: "codex-test", agent_run_id: "agent-1", reason: "not available" },
      receipts: { tests: "quality/tests/forbidden.json" },
    })).rejects.toThrow(/no quality receipts|stage-runtime/i);
  });

  it("binds the bridge result identity to the task loaded from task_path", async () => {
    const state = fixture("bridge-task-identity");
    await expect(workflowHubBridgeMain({
      project_name: "WorkflowHub",
      task_id: "different-task",
      stage: "make-decision",
      attempt_id: "attempt-bridge-task-identity",
      task_path: state.task.taskPath,
      unavailable: { host: "codex-test", agent_run_id: "agent-identity", reason: "not available" },
    })).rejects.toThrow(/taskPath does not match|task_id does not match the task loaded from task_path/i);
  });

  it("rejects overlapping lifecycle timestamps before producing a stage outcome", () => {
    const state = fixture("stage-agent-host-bridge");
    const execution = stageAgentExecution("make-decision");
    let timestamp = 1000;
    const events = [
      ...execution.steps.map((entry) => {
        const started = timestamp;
        timestamp += 10;
        return { task_id: state.task.identity.taskId, subject_kind: "step", subject_id: entry.step_slug, stage: "make-decision", started_at_ms: started, ended_at_ms: timestamp, ...entry, usage: { tokens: entry.cost.tokens, event_id: `usage-${entry.step_slug}` } };
      }),
      ...execution.skills.map((entry) => {
        const started = timestamp;
        timestamp += 10;
        return { task_id: state.task.identity.taskId, subject_kind: "skill", subject_id: entry.skill_id, stage: "make-decision", started_at_ms: started, ended_at_ms: timestamp, ...entry, usage: { tokens: entry.cost.tokens, event_id: `usage-${entry.skill_id}` } };
      }),
    ];
    events[1].started_at_ms = events[0].ended_at_ms - 1;
    const context = contextFor("make-decision", state);
    expect(() => publishCurrentWorkflowHubSession({
      context,
      input: {
        session: {
          task_id: state.task.identity.taskId,
          host: "codex-desktop",
          source_id: "codex/session-overlapping-lifecycle",
          source_family: "codex",
          session_id: "session-overlapping-lifecycle",
          source_ref: "codex-overlapping-lifecycle",
          status: execution.status,
          events,
          spec_analyze: execution.spec_analyze,
        },
      },
      stage: "make-decision",
      attemptId: "attempt-overlapping-lifecycle",
      requirementAuthentication: createRequirementAuthenticationFixture({
        taskId: state.task.identity.taskId,
        runId: context.workflowRunId,
        sessionId: "session-overlapping-lifecycle",
      }),
    })).toThrow(expect.objectContaining({ code: "BRIDGE_TIME_INVALID" }));
  });

  it("reports unavailable when the public same-session path lacks registered requirement evidence", async () => {
    const state = fixture("workflowhub-current-session-auto-run");
    const execution = stageAgentExecution("make-decision");
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-current-session-cwd-")));
    const stageCwd = join(root, "later-stage-workspace");
    mkdirSync(stageCwd, { recursive: true });
    const home = join(root, "home");
    const rollout = join(home, ".codex", "sessions", "2026", "08", "18", "rollout-2026-08-18T00-00-00-session-auto-run.jsonl");
    mkdirSync(join(home, ".codex", "sessions", "2026", "08", "18"), { recursive: true });
    const sessionId = `session-auto-run-${process.pid}`;
    const requirementBase = Date.now() - 5000;
    const skillTokenAt = requirementBase + stageAgentExecution("make-decision").steps.length * 11 + 5;
    const requirementMessages = ["goal", "flow_or_surface", "data_or_state", "success_failure_acceptance", "constraint_non_goal_defer"].map((message_class, index) => {
      const id = `message-${index + 1}`;
      return {
        timestamp: new Date(requirementBase + 2 + index).toISOString(),
        type: "response_item",
        payload: {
          type: "message", id, role: "user",
          content: [{ type: "input_text", text: id }],
        },
      };
    });
    writeFileSync(rollout, [
      {
        timestamp: new Date(requirementBase + 5).toISOString(),
        type: "event_msg",
        payload: { type: "token_count", info: { last_token_usage: { input_tokens: 11, output_tokens: 4, total_tokens: 15 } } },
      },
      {
        timestamp: new Date(skillTokenAt).toISOString(),
        type: "event_msg",
        payload: { type: "token_count", info: { last_token_usage: { input_tokens: 13, output_tokens: 5, total_tokens: 18 } } },
      },
      ...requirementMessages,
    ].map((entry) => JSON.stringify(entry)).join("\n") + "\n");
    try {
      registerCodexSession({ sessionId, transcriptPath: rollout, cwd: root, home, observedAtMs: requirementBase + 100 });
      const stageEntryOutput = execFileSync(process.execPath, [
        join(process.cwd(), "tools", "cli", "stage-runtime.mjs"),
        "status",
        "--action=begin",
        "--stage=make-decision",
        `--project=${state.task.identity.projectName}`,
        `--task=${state.task.identity.taskId}`,
      ], {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, HOME: home, CODEX_SESSION_ID: sessionId, CODEX_THREAD_ID: "session-other-thread-456", WORKFLOWHUB_TASK_DIR: state.root },
      });
      expect(JSON.parse(stageEntryOutput)).toMatchObject({ stage: "make-decision" });
      let timestamp = 1000;
      for (const entry of execution.steps) {
        startCodexSessionEvent({ stage: "make-decision", subjectKind: "step", subjectId: entry.step_slug, cwd: root, startedAtMs: timestamp });
        timestamp += 10;
        finishCodexSessionEvent({ stage: "make-decision", subjectKind: "step", subjectId: entry.step_slug, cwd: root, endedAtMs: timestamp, status: entry.status, resultSummary: entry.result_summary, evidenceRefs: ["decision-log"] });
        timestamp += 1;
      }
      for (const entry of execution.skills) {
        startCodexSessionEvent({ stage: "make-decision", subjectKind: "skill", subjectId: entry.skill_id, cwd: root, startedAtMs: timestamp });
        timestamp += 10;
        finishCodexSessionEvent({ stage: "make-decision", subjectKind: "skill", subjectId: entry.skill_id, cwd: root, endedAtMs: timestamp, status: entry.status, resultSummary: entry.result_summary, evidenceRefs: ["decision-log"], trigger: entry.trigger, executed: entry.executed, version: entry.version });
        timestamp += 1;
      }
      recordCodexSessionSpecAnalyze({ stage: "make-decision", value: execution.spec_analyze, cwd: root });
      const sessionInput = buildWorkflowHubSessionInput({ cwd: root, stage: "make-decision" });
      expect(sessionInput).toMatchObject({ task_id: state.task.identity.taskId, status_value: "completed" });
      expect(sessionInput.events).toHaveLength(execution.steps.length + execution.skills.length);
      let runtimeError = null;
      try {
        execFileSync(process.execPath, [
          join(process.cwd(), "tools", "cli", "stage-runtime.mjs"),
          "run",
          "--action=execute",
          "--stage=make-decision",
        ], {
          cwd: stageCwd,
          encoding: "utf8",
          env: {
            ...process.env,
            HOME: home,
            CODEX_SESSION_ID: sessionId,
            CODEX_THREAD_ID: "session-other-thread-456",
            WORKFLOWHUB_TASK_DIR: state.root,
            WORKFLOWHUB_CODEX_ROLLOUT_STARTED_AT: "0",
          },
        });
      } catch (error) {
        runtimeError = `${error?.stderr ?? ""}\n${error?.message ?? error}`;
      }
      expect(runtimeError).toMatch(/authenticated requirement messages|required/i);
    } finally {
      rmSync(sessionHandoffPath(root), { force: true });
      rmSync(root, { recursive: true, force: true });
    }
  });
  it("publishes a new immutable attempt when the same session reruns the same stage", () => {
    const state = fixture("workflowhub-current-session-rerun");
    const execution = stageAgentExecution("make-decision");
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-current-session-rerun-cwd-")));
    roots.push(root);
    const stageCwd = join(root, "later-stage-workspace");
    mkdirSync(stageCwd, { recursive: true });
    const home = join(root, "home");
    const sessionId = `session-rerun-${process.pid}`;
    const rolloutDir = join(home, ".codex", "sessions", "2026", "08", "27");
    const rollout = join(rolloutDir, `rollout-2026-08-27T00-00-00-${sessionId}.jsonl`);
    const messageClasses = ["goal", "flow_or_surface", "data_or_state", "success_failure_acceptance", "constraint_non_goal_defer"];
    mkdirSync(rolloutDir, { recursive: true });
    writeFileSync(rollout, messageClasses.map((messageClass, index) => JSON.stringify({
      timestamp: new Date(100 + index).toISOString(),
      type: "response_item",
      payload: { type: "message", id: `rerun-message-${index + 1}`, role: "user", content: [{ type: "input_text", text: messageClass }] },
    })).join("\n") + "\n");
    const env = {
      ...process.env,
      HOME: home,
      CODEX_SESSION_ID: sessionId,
      WORKFLOWHUB_TASK_DIR: state.root,
      WORKFLOWHUB_CODEX_ROLLOUT_STARTED_AT: "0",
    };
    const runtimeArgs = [
      join(process.cwd(), "tools", "cli", "stage-runtime.mjs"),
      "run", "--action=execute", "--stage=make-decision",
    ];
    const recordPass = (pass, startAt) => {
      let timestamp = startAt;
      for (const entry of execution.steps) {
        startCodexSessionEvent({ stage: "make-decision", subjectKind: "step", subjectId: entry.step_slug, cwd: root, startedAtMs: timestamp });
        timestamp += 10;
        finishCodexSessionEvent({
          stage: "make-decision", subjectKind: "step", subjectId: entry.step_slug, cwd: root, endedAtMs: timestamp,
          status: entry.status, resultSummary: `${pass}: ${entry.result_summary}`, evidenceRefs: ["decision-log"],
        });
        timestamp += 1;
      }
      for (const entry of execution.skills) {
        startCodexSessionEvent({ stage: "make-decision", subjectKind: "skill", subjectId: entry.skill_id, cwd: root, startedAtMs: timestamp });
        timestamp += 10;
        finishCodexSessionEvent({
          stage: "make-decision", subjectKind: "skill", subjectId: entry.skill_id, cwd: root, endedAtMs: timestamp,
          status: entry.status, resultSummary: `${pass}: ${entry.result_summary}`, evidenceRefs: ["decision-log"],
          trigger: entry.trigger, executed: entry.executed, version: entry.version,
        });
        timestamp += 1;
      }
      const current = buildWorkflowHubSessionInput({ cwd: root, stage: "make-decision", taskId: state.task.identity.taskId, sessionId });
      const analyzer = structuredClone(execution.spec_analyze);
      analyzer.packet.requirement_coverage_outputs = current.requirement_messages.map((message, index) => ({
        message_id: message.id,
        message_hash: message.content_hash,
        message_class: messageClasses[index],
        axis_id: `rerun-axis-${index + 1}`,
        impact: index < 2 ? "high" : "medium",
        disposition: "represented",
        decision_ids: [`D-FIXTURE-${index + 1}`],
        requirement_ids: [`R-FIXTURE-${index + 1}`],
      }));
      analyzer.packet.work_summary = `${pass}: current make-decision result`;
      recordCodexSessionSpecAnalyze({ stage: "make-decision", value: analyzer, cwd: root, sessionId });
      return timestamp;
    };
    try {
      registerCodexSession({ sessionId, transcriptPath: rollout, cwd: root, home, observedAtMs: 1000 });
      bindCodexSessionTask({
        projectName: state.task.identity.projectName,
        taskId: state.task.identity.taskId,
        taskPath: state.task.taskPath,
        cwd: root,
        boundAtMs: 1000,
        sessionId,
      });
      let timestamp = recordPass("first", 1000);
      const first = spawnSync(process.execPath, runtimeArgs, { cwd: stageCwd, env, encoding: "utf8" });
      expect(first.status, `${first.stdout}\n${first.stderr}`).toBe(0);
      timestamp = recordPass("second", timestamp + 100);
      const second = spawnSync(process.execPath, runtimeArgs, { cwd: stageCwd, env, encoding: "utf8" });
      expect(second.status, `${second.stdout}\n${second.stderr}`).toBe(0);
      const third = spawnSync(process.execPath, runtimeArgs, { cwd: stageCwd, env, encoding: "utf8" });
      expect(third.status, `${third.stdout}\n${third.stderr}`).toBe(0);
      const firstResult = JSON.parse(first.stdout);
      const secondResult = JSON.parse(second.stdout);
      const thirdResult = JSON.parse(third.stdout);
      const firstOutcome = JSON.parse(state.task.readRecord(firstResult.stage_outcome_ref));
      const secondOutcome = JSON.parse(state.task.readRecord(secondResult.stage_outcome_ref));
      const thirdOutcome = JSON.parse(state.task.readRecord(thirdResult.stage_outcome_ref));
      expect(secondResult.stage_outcome_ref).not.toBe(firstResult.stage_outcome_ref);
      expect(secondOutcome.attempt_id).not.toBe(firstOutcome.attempt_id);
      expect(thirdResult.stage_outcome_ref).toBe(secondResult.stage_outcome_ref);
      expect(thirdOutcome.attempt_id).toBe(secondOutcome.attempt_id);
      expect(state.task.listCanonicalStageOutcomeRefs("make-decision")).toEqual(expect.arrayContaining([
        firstResult.stage_outcome_ref,
        secondResult.stage_outcome_ref,
      ]));
    } finally {
      rmSync(sessionHandoffPath(root), { force: true });
    }
  });
  it("publishes a truthful unavailable outcome when the external Stage Agent produced no packet", async () => {
    const state = fixture("stage-agent-unavailable");
    const outcome = publishUnavailableStageAgentOutcome({
      task: state.task,
      kernel: state.kernel,
      candidateWorkspace: state.candidate,
      stage: "build-code",
      attemptId: "attempt-unavailable-stage-agent",
      host: "multica-real-host",
      agentRunId: "agent-run-unavailable",
      reason: "stage_agent_outcome_missing",
    });
    expect(outcome.value.status).toBe("unavailable");
    expect(outcome.value.step_outcomes).toHaveLength(JSON.parse(readFileSync(join(process.cwd(), "workflows", "build-code", "steps.json"), "utf8")).steps.length);
    expect(outcome.value.step_outcomes.every((entry) => entry.status === "unavailable")).toBe(true);
    expect(outcome.value.skill_outcomes.find((entry) => entry.skill_id === "spec-analyze")).toMatchObject({ trigger: true, executed: true, status: "unavailable" });
    expect(outcome.value.spec_analyze.result.status).toBe("material_incomplete");
    const result = await runOfficialStage("build-code", contextFor("build-code", state), { receipts: { stage_outcomes: outcome.ref } });
    expect(result).toMatchObject({ stage: "build-code", stage_outcome_status: "unavailable", quality_status: "incomplete" });
    expect(() => state.task.readRecord("quality/stage-reflection/build-code.json")).toThrow(/ENOENT|no such file/i);
    const availabilityRef = result.stage_reflection?.availability_ref;
    expect(availabilityRef).toMatch(/^quality\/evidence\/stage-reflection-availability\/[a-f0-9]{64}\.json$/);
    const availability = JSON.parse(state.task.readRecord(availabilityRef));
    expect(availability).toMatchObject({ state: "unavailable", reason_code: "executor_absent" });
  });
  it("guards the official stage run against monitoring fact and projection side effects", () => {
    const state = fixture("vnext-stage-run-no-monitoring-side-effect");
    initializeTaskStore(state.task.taskPath, { taskId: state.task.identity.taskId });
    const outcome = writeStageOutcomeFixture({
      task: state.task,
      kernel: state.kernel,
      artifacts: ArtifactDir.open(state.candidate.worktreeRoot, state.task),
      candidateWorkspace: state.candidate,
      stage: "build-spec",
      attemptId: "attempt-no-monitoring-side-effect",
      status: "completed",
    });
    const inputPath = join(state.root, "no-monitoring-side-effect-input.json");
    writeFileSync(inputPath, `${JSON.stringify({ receipts: { stage_outcomes: outcome.ref } })}\n`);
    const runtime = join(process.cwd(), "tools", "cli", "stage-runtime.mjs");
    const env = { ...process.env, HOME: state.root, WORKFLOWHUB_TASK_DIR: state.root };
    delete env.CODEX_SESSION_ID;
    delete env.CODEX_THREAD_ID;
    delete env.CODEX_ROLLOUT_PATH;
    delete env.WORKFLOWHUB_CODEX_ROLLOUT_PATH;
    delete env.CODEX_CLI_VERSION;
    const result = spawnSync(process.execPath, [
      runtime,
      "run",
      "--action=execute",
      "--stage=build-spec",
      "--project=WorkflowHub",
      "--task=vnext-stage-run-no-monitoring-side-effect",
      `--input=${inputPath}`,
    ], { cwd: state.root, env, encoding: "utf8" });
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    const officialResult = JSON.parse(result.stdout);
    expect(officialResult).toMatchObject({
      stage: "build-spec",
      stage_outcome_status: "completed",
      stage_outcome_ref: outcome.ref,
    });
    const factsPath = join(state.task.taskPath, "facts.jsonl");
    expect(existsSync(factsPath)).toBe(true);
    const taskFacts = readTaskFacts(state.task.taskPath);
    expect(taskFacts.filter((record) => record?.fact_type !== undefined)).toHaveLength(0);
    expect(existsSync(join(state.root, "Projects", "WorkflowHub", "monitoring"))).toBe(false);
  });
  it("publishes one missing AC fact per current spec even without implementation/test receipts", async () => {
    const state = fixture("build-code-ac-skeleton");
    const result = await runOfficialStage("build-code", contextFor("build-code", state), {});
    const facts = result.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref)));
    expect(facts).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "acceptance_criterion", subject: "AC-001", status: "missing" }),
    ]));
    expect(result.quality_status).toBe("incomplete");
  });
  it("rejects acceptance coverage IDs that do not match the current spec", async () => {
    const state = fixture("build-code-ac-binding");
    const snapshot = state.candidate.captureSnapshot();
    await expect(runOfficialStage("build-code", contextFor("build-code", state), {
      acceptance_coverage: {
        snapshot_tree: snapshot.tree,
        accepted_criterion_ids: ["AC-FAKE"],
        items: [{ acceptance_criterion_id: "AC-FAKE", status: "covered", evidence_refs: [] }],
      },
    })).rejects.toThrow(/match the current spec acceptance criteria/i);
  });
  it("reads the four current materials directly and rejects revision pointers/writers", () => {
    const state = fixture("vnext-direct-materials");
    expect(() => state.task.readRecord("materials/current.json")).toThrow(/ENOENT/);
    expect(() => state.task.readRecord("requirements/current.json")).toThrow(/ENOENT/);
    expect(() => state.kernel.publishMaterialRevision({ change_summary: "forbidden", source_refs: ["task.json"] }))
      .toThrow(/material revision writer is retired/);
    expect(() => state.kernel.publishCanonicalRecord("publications/build-spec/demo.json", "{}\n"))
      .toThrow(/quality namespace|canonical record namespace/i);
  });

  it('fake-pass:test-receipt refuses a non-zero test receipt as passed quality', async () => {
    const state = fixture("fake-pass-receipt");
    const receipt = {
      schema_version: "workflowhub-receipt.v1",
      task_id: state.task.identity.taskId,
      stage: "build-code",
      producer: { stage: "build-code", component: "tests", version: "1.0.0" },
      command: "false",
      command_hash: "a".repeat(64),
      exit_code: 1,
      snapshot_head: state.candidate.baselineCommit,
      snapshot_tree: state.candidate.captureSnapshot().tree,
      snapshot_commit: state.candidate.baselineCommit,
      started_at: "2026-08-02T00:00:00.000Z",
      completed_at: "2026-08-02T00:00:01.000Z",
      output_ref: "quality/tests/output/fake-pass.output",
      output_hash: "b".repeat(64),
    };
    const raw = `${JSON.stringify(receipt, null, 2)}\n`;
    const ref = "quality/tests/fake-pass.json";
    state.kernel.publishCanonicalRecord(ref, raw);
    const result = await runStage("build-code", contextFor("build-code", state), async () => ({
      facts: { source: "fake-pass-test" },
      evidence_refs: [{ ref, sha256: createHash("sha256").update(raw).digest("hex") }],
    }));
    const facts = result.quality_fact_refs.map((item) => JSON.parse(state.task.readRecord(item)));
    expect(facts.find((item) => item.kind === "test")).toMatchObject({ status: "failed" });
    expect(result).toMatchObject({ status: "in_progress", work_status: "ready", quality_status: "incomplete" });
    expect(result.completion.missing).toContain("risk_tests_fresh");
    expect(result).not.toHaveProperty("publication_ref");
    expect(result).not.toHaveProperty("publication_hash");
  });

  it("rejects a passed test fact bound to a non-zero canonical receipt", async () => {
    const state = fixture("mismatched-test-status");
    const receipt = {
      schema_version: "workflowhub-receipt.v1",
      task_id: state.task.identity.taskId,
      stage: "build-code",
      producer: { stage: "build-code", component: "tests", version: "1.0.0" },
      command: "false",
      command_hash: sha256("false"),
      exit_code: 1,
      snapshot_head: state.candidate.baselineCommit,
      snapshot_tree: state.candidate.captureSnapshot().tree,
      snapshot_commit: state.candidate.baselineCommit,
      started_at: "2026-08-02T00:00:00.000Z",
      completed_at: "2026-08-02T00:00:01.000Z",
      output_ref: "quality/tests/output/mismatched-status.output",
      output_hash: sha256("failed\n"),
    };
    const raw = `${JSON.stringify(receipt, null, 2)}\n`;
    const ref = "quality/tests/mismatched-status.json";
    state.kernel.publishCanonicalRecord(ref, raw);
    expect(() => verifyOfficialEvidence(contextFor("build-code", state), {
      facts: {
        tests: {
          status: "passed",
          command: receipt.command,
          command_hash: receipt.command_hash,
          snapshot_head: receipt.snapshot_head,
          snapshot_tree: receipt.snapshot_tree,
          snapshot_commit: receipt.snapshot_commit,
          started_at: receipt.started_at,
          completed_at: receipt.completed_at,
          receipt_ref: ref,
          receipt_hash: sha256(raw),
          output_ref: receipt.output_ref,
          output_hash: receipt.output_hash,
        },
      },
      evidence_refs: [{ ref, sha256: sha256(raw) }],
    })).toThrow(/status is not bound to the canonical receipt exit_code/);
  });

  it("authenticates output bytes even for a failed receipt", async () => {
    const state = fixture("failed-receipt-output-binding");
    const receipt = {
      schema_version: "workflowhub-receipt.v1",
      task_id: state.task.identity.taskId,
      stage: "build-code",
      producer: { stage: "build-code", component: "tests", version: "1.0.0" },
      command: "false",
      command_hash: sha256("false"),
      exit_code: 1,
      snapshot_head: state.candidate.baselineCommit,
      snapshot_tree: state.candidate.captureSnapshot().tree,
      snapshot_commit: state.candidate.baselineCommit,
      started_at: "2026-08-02T00:00:00.000Z",
      completed_at: "2026-08-02T00:00:01.000Z",
      output_ref: "quality/tests/output/failed-binding.output",
      output_hash: sha256("expected\n"),
    };
    const raw = `${JSON.stringify(receipt, null, 2)}\n`;
    const ref = "quality/tests/failed-binding.json";
    state.kernel.publishCanonicalRecord(ref, raw);
    state.kernel.publishCanonicalRecord(receipt.output_ref, "actual\n");
    expect(() => verifyOfficialEvidence(contextFor("build-code", state), {
      facts: {
        tests: {
          status: "failed",
          command: receipt.command,
          command_hash: receipt.command_hash,
          snapshot_head: receipt.snapshot_head,
          snapshot_tree: receipt.snapshot_tree,
          snapshot_commit: receipt.snapshot_commit,
          started_at: receipt.started_at,
          completed_at: receipt.completed_at,
          receipt_ref: ref,
          receipt_hash: sha256(raw),
          output_ref: receipt.output_ref,
          output_hash: receipt.output_hash,
        },
      },
      evidence_refs: [{ ref, sha256: sha256(raw) }],
    })).toThrow(/test output hash mismatch/);
  });

  it("returns derived completion from quality facts without a publication object", async () => {
    const state = fixture();
    const review = publishReviewFixture(state);
    const result = await runStage(
      "build-spec",
      contextFor("build-spec", state),
      async () => ({
        facts: {
          source: "official-stage-fixture",
          completion_subjects: {
            traceability: { status: "passed", evidence_refs: [] },
            zero_major_ambiguities: { status: "passed", evidence_refs: [] },
          },
          finding_dispositions: { status: "not_applicable", items: [] },
        },
        evidence_refs: [review],
        completion: { facts: { business_facts: { acceptance_criteria: "covered" } } },
      }),
    );

    expect(result).toMatchObject({ stage: "build-spec", status: "in_progress", work_status: "ready", quality_status: "incomplete" });
    expect(result.completion).toMatchObject({
      status: "in_progress",
      missing: expect.arrayContaining(["clarify", "stage_end_spec_analyze"]),
    });
    expect(result).not.toHaveProperty("publication_ref");
    expect(result).not.toHaveProperty("publication_hash");
    expect(result.quality_fact_refs).toHaveLength(5);
    expect(() => state.task.readRecord("results/build-spec/attempt-0001.json")).toThrow(/ENOENT/);
    expect(() => state.task.readRecord("results/build-spec/accepted.json")).toThrow(/ENOENT/);
  });

  it("recognizes the canonical quality/confirmations path in stage completion", async () => {
    const state = fixture("vnext-confirmation-path");
    const snapshot = state.candidate.captureSnapshot();
    const artifacts = ArtifactDir.open(state.candidate.worktreeRoot, state.task);
    const materialRevision = materialRevisionFromValues(MATERIALS.map((file) => [file, artifacts.read(file)]));
    const reviewRaw = `${JSON.stringify({
      version: "wh-review-result.v1", task_id: state.task.identity.taskId, stage: "build-plan", review_track: null,
      subject_kind: "worktree", phase_id: null, review_scope: null,
      source: { target_commit: snapshot.head, base_commit: snapshot.head, base_tree: snapshot.tree, captured_head: snapshot.head },
      snapshot_tree: snapshot.tree, material_id: "0".repeat(64), attempt_ref: "quality/reviews/attempts/vnext-build-plan/attempt.json",
      provider_results: [{ provider: "fixture", output: { findings: [] } }],
      findings: [],
      adjudication: { version: "wh-review-adjudication.v1", clusters: [] },
    })}\n`;
    const confirmationRaw = `${JSON.stringify({ schema_version: "human-confirmation.v2", task_id: state.task.identity.taskId, stage: "build-plan", decision: "accepted", material_revision: materialRevision, snapshot_tree: snapshot.tree, confirmed_at: "2026-08-04T00:00:00.000Z" })}\n`;
    const reviewRef = "quality/reviews/results/vnext-build-plan.json";
    const confirmationRef = "quality/confirmations/vnext-build-plan.json";
    state.kernel.publishCanonicalRecord(reviewRef, reviewRaw);
    state.kernel.publishCanonicalRecord(confirmationRef, confirmationRaw);
    const result = await runStage("build-plan", contextFor("build-plan", state), async () => ({
      facts: {
        source: "confirmation-path-regression",
        completion_subjects: Object.fromEntries(["fr_coverage", "ac_coverage", "dependencies", "deletion_proofs", "executable_tasks"]
          .map((subject) => [subject, { status: "passed", evidence_refs: [] }])),
        finding_dispositions: { status: "not_applicable", items: [] },
      },
      completion: { facts: { business_facts: { acceptance_criteria: "covered" } } },
      evidence_refs: [
        { ref: reviewRef, sha256: createHash("sha256").update(reviewRaw).digest("hex") },
        { ref: confirmationRef, sha256: createHash("sha256").update(confirmationRaw).digest("hex") },
      ],
    }));
    expect(result).toMatchObject({ status: "in_progress", work_status: "ready", quality_status: "incomplete" });
    expect(result.completion).toMatchObject({ status: "in_progress", missing: expect.arrayContaining(["stage_end_spec_analyze"]) });
    expect(result).not.toHaveProperty("publication_ref");
    expect(result).not.toHaveProperty("publication_hash");
  });

  it("keeps serious finding dispositions visible as authoring advice", async () => {
    const state = fixture("vnext-finding-disposition-completion");
    const review = publishReviewFixture(state);
    const result = await runStage(
      "build-spec",
      contextFor("build-spec", state),
      async () => ({
        facts: {
          source: "finding-disposition-completion-regression",
          completion_subjects: {
            zero_major_ambiguities: { status: "passed", evidence_refs: [] },
          },
          finding_dispositions: {
            status: "recorded",
            items: [{ finding_id: "F-test", status: "needs_human" }],
          },
        },
        evidence_refs: [review],
      }),
    );

    expect(result).toMatchObject({ status: "in_progress", quality_status: "incomplete" });
    expect(result.completion.missing).not.toContain("finding_dispositions");
    expect(result.quality_advisories).toContain("finding_dispositions:missing");
  });

  it("stores make-decision interaction evidence in the content-addressed quality namespace", () => {
    const state = fixture("vnext-make-decision-content");
    const snapshot = state.candidate.captureSnapshot();
    const value = {
      schema_version: "workflowhub-interaction-aggregate.v1",
      task_id: state.task.identity.taskId,
      stage: "make-decision",
      snapshot_tree: snapshot.tree,
      talk: { status: "completed", round_count: 1, architecture_direction_covered: true, user_outcome_covered: true },
      clarify: { status: "resolved", open_direction_changing_questions: 0, resolved_by: "no_direction_changing_ambiguity" },
      decision_ref: "quality/evidence/decision.md",
      decision_hash: "a".repeat(64),
    };
    const raw = `${JSON.stringify(value, null, 2)}\n`;
    const ref = `quality/evidence/interactions/${sha256(raw)}.json`;
    state.kernel.publishCanonicalRecord(ref, raw);
    expect(JSON.parse(state.task.readRecord(ref))).toEqual(value);
    expect(ref).toMatch(/^quality\/evidence\/interactions\/[a-f0-9]{64}\.json$/);
  });

  it("review:unavailable stays visible without blocking the repository-owned build-spec run", async () => {
    const state = fixture("vnext-official-run");
    const workspace = openCurrentTaskWorkspace(state.task);
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, state.task);
    const kernel = createTaskKernel(state.task, { workspace, artifacts });
    appendNonUiApplicability(artifacts);
    const snapshot = workspace.captureSnapshot?.() ?? state.candidate.captureSnapshot();
    const attemptId = "vnext-official-build-spec";
    const attemptRef = `quality/reviews/attempts/${attemptId}/attempt.json`;
    const provider = "kimi/v4flash";
    const providerOutputRef = `quality/reviews/attempts/${attemptId}/providers/p-${Buffer.from(provider, "utf8").toString("base64url")}.output.json`;
    createCanonicalReviewWriter({ task: state.task, taskId: state.task.identity.taskId, stage: "build-spec" })
      .writeProviderOutput(providerOutputRef, JSON.stringify({ findings: [] }), { provider });
    const attempt = {
      version: "wh-review-attempt.v1",
      attempt_id: attemptId,
      task_id: state.task.identity.taskId,
      stage: "build-spec",
      review_track: null,
      source: { target_commit: snapshot.head, base_commit: snapshot.head, base_tree: snapshot.tree, captured_head: snapshot.head },
      snapshot_tree: snapshot.tree,
      material_id: "0".repeat(64),
      subject_kind: "worktree",
      phase_id: null,
      review_scope: null,
      provider_attempts: [{ provider, status: "failed", session_id: null, runtime_id: "runtime", output_ref: providerOutputRef, error: { code: "PROCESS_EXIT_NONZERO", message: "provider exited with 1" } }],
      terminal_status: "unavailable",
      error: { code: "MATERIAL_INCOMPLETE", message: "fixture review unavailable" },
    };
    const attemptRaw = `${JSON.stringify(attempt, null, 2)}\n`;
    kernel.publishCanonicalRecord(attemptRef, attemptRaw);
    const result = await runOfficialStage("build-spec", {
      stage: "build-spec", task: state.task, kernel, identity: state.task.identity,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-spec"), manifest: state.task.manifest,
      workspace, artifacts,
    }, { receipts: { review: attemptRef, stage_outcomes: stageOutcome(state, "build-spec", { workspace, artifacts }).ref } });

    expect(result).toMatchObject({ status: "completed", work_status: "ready", quality_status: "incomplete" });
    expect(result.readiness).toMatchObject({ work_status: "ready", missing_materials: [] });
    expect(result.completion).toMatchObject({ status: "completed", missing: [] });
    expect(result.quality_advisories).toContain("independent_review:unavailable");
    expect(result.quality_advisories).toContain("finding_dispositions:missing");
    expect(result).not.toHaveProperty("publication_ref");
    expect(result).not.toHaveProperty("publication_hash");
    expect(result.quality_fact_refs).toHaveLength(5);
    const qualityFacts = result.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref)));
    expect(qualityFacts.find((fact) => fact.kind === "review")).toMatchObject({ status: "unavailable" });
    expect(qualityFacts.find((fact) => fact.subject === "finding_dispositions")).toMatchObject({ status: "missing" });
    expect(() => state.task.readRecord("results/build-spec/attempt-0001.json")).toThrow(/ENOENT/);
    expect(() => state.task.readRecord("results/build-spec/accepted.json")).toThrow(/ENOENT/);
  });

  it("does not let a partial UI contract silently take the non-UI build-spec path", async () => {
    const state = fixture("vnext-build-spec-ui-applicability");
    const workspace = openCurrentTaskWorkspace(state.task);
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, state.task);
    const kernel = createTaskKernel(state.task, { workspace, artifacts });
    const outcome = stageOutcome(state, "build-spec", { workspace, artifacts, attemptId: "attempt-ui-applicability" });
    const review = publishReviewFixture({ ...state, kernel });
    const result = await runOfficialStage("build-spec", {
      stage: "build-spec", task: state.task, kernel, identity: state.task.identity,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-spec"), manifest: state.task.manifest,
      workspace, artifacts,
    }, {
      contract_facts: { ui_project_init: {} },
      receipts: { review: review.ref, stage_outcomes: outcome.ref },
    });

    expect(result).toMatchObject({ status: "in_progress", quality_status: "incomplete" });
    expect(result.completion.missing).toContain("ui_design");
    expect(result.quality_warnings).toEqual(expect.arrayContaining([
      expect.stringMatching(/UI applicability is unknown|ui_design:missing/i),
    ]));
  });

  it("does not accept a UI approval bound to a different Design.md or Experience.md", async () => {
    const testCase = uiSourceBindingCase("workflowhub-build-spec-ui-source-binding");
    const { approved } = testCase;
    const mismatched = structuredClone(approved);
    mismatched.plan_design_review.input_identities.design.revision = "design-r0";
    const result = await runUiSourceBindingCase(testCase, mismatched);

    expect(result).toMatchObject({ status: "in_progress", quality_status: "incomplete" });
    expect(result.completion.missing).toContain("ui_design");
    expect(result.quality_warnings).toEqual(expect.arrayContaining([
      expect.stringMatching(/ui_design:missing|approved Design\.md identity/i),
    ]));
  });

  it("does not accept unknown or unavailable UI source identity values", async () => {
    const testCase = uiSourceBindingCase("workflowhub-build-spec-ui-source-unknown-identity");
    for (const field of ["revision", "anchor_id"]) {
      for (const value of ["unknown", "unavailable", "n/a"]) {
        const invalid = structuredClone(testCase.approved);
        invalid.plan_design_review.input_identities.design[field] = value;
        const result = await runUiSourceBindingCase(testCase, invalid);
        expect(result).toMatchObject({ status: "in_progress", quality_status: "incomplete" });
        expect(result.completion.missing).toContain("ui_design");
        expect(result.quality_warnings).toEqual(expect.arrayContaining([
          expect.stringMatching(/approved Design\.md identity is malformed|missing or invalid/i),
        ]));
      }
    }
    for (const [owner, field, value] of [
      ["ui_project_init", "design_revision", { status: "unknown", reason: "revision unavailable" }],
      ["design_source_readiness", "design_revision", { status: "unavailable", reason: "revision unavailable" }],
    ]) {
      const invalid = structuredClone(testCase.approved);
      invalid[owner][field] = value;
      const result = await runUiSourceBindingCase(testCase, invalid);
      expect(result).toMatchObject({ status: "in_progress", quality_status: "incomplete" });
      expect(result.completion.missing).toContain("ui_design");
      expect(result.quality_warnings).toEqual(expect.arrayContaining([
        expect.stringMatching(/revision is missing or unavailable|ui-project-init: status is not_ready/i),
      ]));
    }
  });

  it("does not accept producer path or revision fields that contradict their source identity", async () => {
    const testCase = uiSourceBindingCase("workflowhub-build-spec-ui-source-fields");
    for (const [owner, field, value] of [
      ["ui_project_init", "design_path", "OtherDesign.md"],
      ["ui_project_init", "design_revision", "design-r0"],
      ["design_source_readiness", "design_path", "OtherDesign.md"],
      ["design_source_readiness", "design_revision", "design-r0"],
    ]) {
      const invalid = structuredClone(testCase.approved);
      invalid[owner][field] = value;
      const result = await runUiSourceBindingCase(testCase, invalid);
      expect(result).toMatchObject({ status: "in_progress", quality_status: "incomplete" });
      expect(result.completion.missing).toContain("ui_design");
      expect(result.quality_warnings).toEqual(expect.arrayContaining([
        expect.stringMatching(/path does not match|revision does not match/i),
      ]));
    }
  });

  it("does not silently ignore a malformed current UI source identity", async () => {
    const testCase = uiSourceBindingCase("workflowhub-build-spec-ui-source-malformed-identity");
    const invalid = structuredClone(testCase.approved);
    invalid.ui_project_init.design_identity = { document_kind: "design", path: "../Design.md" };
    const result = await runUiSourceBindingCase(testCase, invalid);
    expect(result).toMatchObject({ status: "in_progress", quality_status: "incomplete" });
    expect(result.completion.missing).toContain("ui_design");
    expect(result.quality_warnings).toEqual(expect.arrayContaining([
      expect.stringMatching(/current Design\.md identity is malformed|missing or invalid/i),
    ]));
  });

  it("ignores a stale vNext material receipt while preserving it as read-only history", async () => {
    const state = fixture("vnext-stale-material-receipt");
    const workspace = openCurrentTaskWorkspace(state.task);
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, state.task);
    const kernel = createTaskKernel(state.task, { workspace, artifacts });
    const staleRaw = `${JSON.stringify({
      schema_version: "workflowhub-receipt.v1",
      task_id: state.task.identity.taskId,
      stage: "build-spec",
      producer: { stage: "build-spec", component: "spec", version: "legacy" },
      content: "# stale spec\n",
      content_hash: sha256("# stale spec\n"),
    }, null, 2)}\n`;
    const staleRef = "quality/evidence/spec.json";
    kernel.publishCanonicalRecord(staleRef, staleRaw);
    const review = publishReviewFixture(state);
    const result = await runOfficialStage("build-spec", {
      stage: "build-spec", task: state.task, kernel, identity: state.task.identity,
      workflowRunId: kernel.deriveStageWorkflowRunId("build-spec"), manifest: state.task.manifest,
      workspace, artifacts,
    }, { receipts: { spec: staleRef, review: review.ref, stage_outcomes: stageOutcome(state, "build-spec", { workspace, artifacts, attemptId: "attempt-stale-material" }).ref } });

    expect(result).toMatchObject({ stage: "build-spec", work_status: "ready" });
    expect(["completed", "in_progress"]).toContain(result.status);
    expect(state.task.readRecord(staleRef)).toBe(staleRaw);
  });

  it("keeps build-code and verify-code runnable from the four materials alone", async () => {
    const state = fixture("vnext-four-materials-only");
    const artifacts = ArtifactDir.open(state.candidate.worktreeRoot, state.task);
    const kernel = createTaskKernel(state.task, { candidateWorkspace: state.candidate, artifacts });
    for (const stage of ["build-code", "verify-code"]) {
      const result = await runOfficialStage(stage, {
        stage, task: state.task, kernel, identity: state.task.identity,
        workflowRunId: kernel.deriveStageWorkflowRunId(stage), manifest: state.task.manifest,
        candidateWorkspace: state.candidate, artifacts,
      }, { receipts: {} });
      expect(result).toMatchObject({ stage, status: "in_progress", work_status: "ready", quality_status: "incomplete" });
      expect(result).toMatchObject({
        stage_outcome_ref: null,
        stage_outcome_hash: null,
        stage_outcome_status: "unavailable",
        stage_outcome_diagnostic: { status: "unavailable", reason: "stage_outcome_missing" },
      });
      expect(result.quality_fact_refs.length).toBeGreaterThan(0);
    }
  });

  it("does not turn missing code review into a materials or evidence audit", async () => {
    const state = fixture("vnext-verify-missing-dispositions");
    const artifacts = ArtifactDir.open(state.candidate.worktreeRoot, state.task);
    const result = await runOfficialStage("verify-code", {
      stage: "verify-code", task: state.task, kernel: state.kernel, identity: state.task.identity,
      workflowRunId: state.kernel.deriveStageWorkflowRunId("verify-code"), manifest: state.task.manifest,
      candidateWorkspace: state.candidate, artifacts,
    }, { receipts: { stage_outcomes: stageOutcome(state, "verify-code").ref } });

    expect(result).toMatchObject({ status: "in_progress", quality_status: "incomplete" });
    expect(result.completion.predicates.code_review).toMatchObject({ status: "missing", fact_ref: null });
    const dispositionFact = result.quality_fact_refs
      .map((ref) => JSON.parse(state.task.readRecord(ref)))
      .find((fact) => fact.subject === "finding_dispositions");
    expect(dispositionFact).toBeUndefined();
  });

  it("ignores unrelated test and acceptance receipts when reviewing code", async () => {
    const state = fixture("vnext-verify-review-unavailable-dispositions");
    const workspace = openCurrentTaskWorkspace(state.task);
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, state.task);
    const kernel = createTaskKernel(state.task, { workspace, artifacts });
    const snapshot = state.candidate.captureSnapshot();
    const output = "verify tests passed\n";
    const outputRef = "quality/tests/output/verify-review-unavailable.output";
    kernel.publishCanonicalRecord(outputRef, output);
    const testValue = {
      schema_version: "workflowhub-receipt.v1", task_id: state.task.identity.taskId, stage: "verify-code",
      producer: { stage: "verify-code", component: "tests", version: "1.0.0" }, command: "true",
      command_hash: sha256("true"), exit_code: 0, source_digest: snapshot.source_digest,
      snapshot_head: snapshot.head, snapshot_tree: snapshot.tree, snapshot_commit: snapshot.commit,
      started_at: "2026-08-16T00:00:00.000Z", completed_at: "2026-08-16T00:00:01.000Z",
      output_ref: outputRef, output_hash: sha256(output),
    };
    const testRaw = `${JSON.stringify(testValue, null, 2)}\n`;
    const testRef = "quality/tests/verify-review-unavailable.json";
    kernel.publishCanonicalRecord(testRef, testRaw);
    const nestedRef = "quality/evidence/verify-review-unavailable-proof.json";
    const nestedRaw = "current verification proof\n";
    kernel.publishCanonicalRecord(nestedRef, nestedRaw);
    const leaf = {
      schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-01", result: "pass",
      refs: [{ ref: nestedRef, sha256: sha256(nestedRaw) }], snapshot_tree: snapshot.tree,
      summary: { scenario: "verification evidence exists", oracle: "current receipt", actual_outcome: "pass", evidence_type: "test" },
    };
    const leafRaw = `${JSON.stringify(leaf, null, 2)}\n`;
    const leafRef = "quality/evidence/verify-review-unavailable-acceptance.json";
    kernel.publishCanonicalRecord(leafRef, leafRaw);
    const evidence = writeOfficialComponentReceipt({
      task: state.task, workspace, stage: "verify-code", component: "evidence",
      payload: { refs: [{ ref: leafRef, sha256: sha256(leafRaw) }] },
    });
    const result = await runOfficialStage("verify-code", {
      stage: "verify-code", task: state.task, kernel, identity: state.task.identity,
      workflowRunId: kernel.deriveStageWorkflowRunId("verify-code"), manifest: state.task.manifest,
      workspace, artifacts,
    }, { receipts: { stage_outcomes: stageOutcome({ ...state, kernel }, "verify-code", { workspace, artifacts }).ref } });

    expect(result).toMatchObject({ status: "in_progress", quality_status: "incomplete" });
    expect(result.completion.predicates.code_review).toMatchObject({ status: "missing", fact_ref: null });
    const dispositionFact = result.quality_fact_refs
      .map((ref) => JSON.parse(state.task.readRecord(ref)))
      .find((fact) => fact.subject === "finding_dispositions");
    expect(dispositionFact).toBeUndefined();
  });

  it("publishes acceptance predicates from canonical completion facts even when another quality item is open", async () => {
    const state = fixture("vnext-predicate-isolation");
    const workspace = openCurrentTaskWorkspace(state.task);
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, state.task);
    const kernel = createTaskKernel(state.task, { workspace, artifacts });
    const completion = buildStageCompletion("verify-code", {
      result: "completed_with_open_items",
      objective: "核对当前交付",
      approach: "使用当前材料和当前测试事实",
      effect: "逐项发布质量事实",
      verification: { conclusion: "测试与 AC 已覆盖", limits: ["独立审查仍有开放 finding"] },
      artifacts: [{ label: "当前实现", ref: "quality/evidence/implementation/a.json", hash: "a".repeat(64) }],
      review: { conclusion: "独立审查仍有开放 finding", status: "revise_required", providers: ["fixture"], findings: [], refs: [] },
      business_facts: { content: "present", code: "complete", tests: "passed", acceptance_criteria: "covered" },
      audit_gaps: [], missing_items: ["independent review remains open"],
      confirmation_summary: {
        completed: "已核对当前交付", specification: "当前材料已读取", scope: ["当前 verify-code"],
        non_goals: ["不把审查意见改写成通过"], phases: ["verify-code"], dependencies: [],
        tests: ["定向事实"], review_advice: "保留原始 finding", risks: ["独立审查仍有开放 finding"],
        deferred: ["finding 处置保留为质量事实"], next_stage_boundary: "不执行 close", expected_impact: "事实可回放",
      },
      risks: ["独立审查仍有开放 finding"], next_owner: "task owner", user_action: "需要处理未完成项",
    });
    const result = await runStage("verify-code", {
      stage: "verify-code", task: state.task, kernel, identity: state.task.identity,
      workflowRunId: kernel.deriveStageWorkflowRunId("verify-code"), manifest: state.task.manifest,
      workspace, artifacts,
    }, async () => ({
      facts: {
        marker: "predicate-isolation",
        completion_subjects: {
          acceptance_criteria: { status: "passed", evidence_refs: [] },
          exceptions: { status: "passed", evidence_refs: [] },
        },
      },
      evidence_refs: [], missing_items: ["independent review remains open"], completion,
    }));
    const facts = result.quality_fact_refs.map((ref) => JSON.parse(state.task.readRecord(ref)));
    expect(facts.find((fact) => fact.subject === "acceptance_criteria")).toBeUndefined();
    expect(facts.find((fact) => fact.subject === "exceptions")).toBeUndefined();
    expect(result).toMatchObject({ status: "in_progress", work_status: "ready", quality_status: "incomplete" });
    expect(result).not.toHaveProperty("publication_ref");
    expect(result).not.toHaveProperty("publication_hash");
  });
});
