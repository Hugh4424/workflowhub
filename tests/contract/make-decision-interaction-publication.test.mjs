import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { captureGitWorktreeSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";
import * as contracts from "../../runtime/stage/stage-content-contracts.mjs";
import * as stageEvidence from "../../runtime/evidence/stage-content-evidence.mjs";
import { buildReviewMaterials, reviewInstructionsFor } from "../../skills/wh-review/scripts/review-materials.mjs";

const roots = [];
const hash = (value) => createHash("sha256").update(value).digest("hex");

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function lifecycle() {
  const cardRef = "conversation/talk/card-1";
  const replyRef = "host-message://reply/talk-1";
  const question = {
    question_id: "scope",
    axis: "scope",
    independent: true,
    options: [
      { number: 1, label: "保守", meaning: "先少做一点", consequence: "范围较小", risk: "收益延后" },
      { number: 2, label: "推荐", meaning: "解决当前问题", consequence: "一次完成", risk: "改动较多" },
    ],
    recommended_option: 2,
    recommendation_reason: "当前事实支持",
  };
  const card = { card_ref: cardRef, card_hash: hash(cardRef), round: 1 };
  const reply = { ...card, source: "user", reply_ref: replyRef, reply_hash: hash(replyRef) };
  return {
    interaction_type: "talk",
    events: [
      { event: "ask", ...card, questions: [question] },
      { event: "wait", ...card, status: "waiting-for-user" },
      { event: "reply", ...reply, answers: [{ question_id: "scope", number: 2 }], remaining_question_ids: [], re_ranked: true },
      { event: "resume", ...reply, status: "resumed" },
    ],
  };
}

function fixture(taskId = "interaction-publication") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-interaction-publication-")));
  roots.push(root);
  const repo = join(root, "repo");
  const storage = join(root, "storage");
  mkdirSync(repo);
  mkdirSync(storage);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub contract"]);
  git(repo, ["config", "user.email", "contract@workflowhub.invalid"]);
  writeFileSync(join(repo, "README.md"), "baseline\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "baseline"]);
  const task = createTask({
    storageRoot: storage,
    manifest: {
      schema_version: "1.0.0", project_name: "Demo", task_id: taskId,
      created_at: "2026-08-27T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const candidate = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidate.worktreeRoot, task);
  for (const file of ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) {
    artifacts.writeAtomic(file, `# ${file}\n`);
  }
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate, now: () => "2026-08-27T00:00:01.000Z" });
  return { root, task, candidate, artifacts, kernel };
}

function draft(state) {
  const decisionRef = state.artifacts.reference("decision-log.md");
  const decisionBytes = state.artifacts.read("decision-log.md");
  const decisionHash = hash(decisionBytes);
  const requirementBytes = "原始需求：把确认后的交互事实写成可复核记录。\n";
  const requirement = state.kernel.publishCanonicalRecord("quality/evidence/original-requirement.txt", requirementBytes);
  const confirmation = state.kernel.publishHumanConfirmation("make-decision", {
    decision: "accepted",
    subject_ref: decisionRef,
    reply_text: "fixture accepted make-decision",
    step_slug: "approve-decision",
  });
  const snapshot = captureGitWorktreeSnapshot(state.candidate.worktreeRoot);
  return {
    schema_version: "workflowhub-interaction-aggregate.v1",
    task_id: state.task.identity.taskId,
    stage: "make-decision",
    snapshot_tree: snapshot.tree,
    original_requirement: { ref: requirement.ref, hash: requirement.sha256 },
    decision: { ref: decisionRef, hash: decisionHash, revision: state.kernel.currentVNextMaterialRevision() },
    confirmation: { ref: confirmation.ref, hash: confirmation.hash, result: "accepted" },
    talk: { status: "completed", round_count: 1, lifecycle_rounds: [lifecycle()] },
    grill: { status: "completed", summary: "范围冲突已处理" },
    advice: { status: "unavailable", reason: "本次没有可用的独立建议运输" },
  };
}

const QA_EVIDENCE_REF = `quality/evidence/browser-qa/${"c".repeat(64)}.json`;

function canonicalQaPayload(value) {
  const comparable = { ...value };
  delete comparable.evidence_ref;
  delete comparable.evidence_hash;
  return comparable;
}

function canonicalQaRaw(value) {
  return JSON.stringify(canonicalQaPayload(value));
}

function uiApplicabilityDecisionLog(result = "ui") {
  const reason = result === "ui"
    ? "controlled contract fixture has a page and interaction consumer"
    : "controlled contract fixture has no page or frontend consumer";
  return `# 当前决策\n\n## UI applicability\n\`\`\`json\n${JSON.stringify({
    result,
    sources: {
      raw_requirement: { conclusion: result, reason },
      project_inventory: { conclusion: result, reason },
      planned_or_changed_frontend_fact: { conclusion: result, reason },
    },
  }, null, 2)}\n\`\`\`\n`;
}

function qaPayload({ taskId = "qa-contract", snapshotTree = "b".repeat(40), materialRevision = `revision-${"a".repeat(64)}`, result = "pass", cancellation = { status: "not_cancelled" }, cleanup = { status: "completed", app_service_running: true }, invocationId = "invocation-1", evidence = true, fixtureOnly = false } = {}) {
  const payload = {
    applicability: "ui", result, task_id: taskId, stage: "build-code",
    attempt_id: "attempt-1", invocation_id: invocationId, material_revision: materialRevision,
    snapshot_tree: snapshotTree, acceptance_criterion_id: "AC-UI-001", route: "/settings", page: "Settings", scenario: "open",
    tool: "isolated-browser-qa", engine: "agent-browser", session: "qa-1", state: { name: "default" },
    viewport: { name: "desktop", width: 1440, height: 900 }, fixture: { name: "settings", fixture_only: fixtureOnly },
    component: { name: "Settings", path: "src/Settings.tsx" }, design_revision: "Design.md@r1",
    design_identity: { document_kind: "design", path: "Design.md", content_sha256: "a".repeat(64), revision: "design-1", anchor_id: "design-components", anchor_title: "Components", anchor_source: "explicit" },
    experience_identity: { document_kind: "experience", path: "Experience.md", content_sha256: "b".repeat(64), revision: "experience-1", anchor_id: "experience-settings", anchor_title: "Settings", anchor_source: "explicit" },
    service_identity: { name: "web", revision: "svc-1" }, api_identity: { name: "settings-api", revision: "api-1" },
    dto_identity: { name: "SettingsDto", revision: "dto-1" }, browser_profile: { name: "isolated-browser", revision: "profile-1" },
    cancellation, observations: { console: { status: "clean" }, network: { status: "clean" }, focus: { status: "checked" }, overflow: { status: "none" } },
    visual: { status: "observed", screenshot_refs: ["quality/evidence/browser-qa/screenshot.png"] },
    a11y: { status: "not_applicable", reason: "controlled contract fixture" },
    auth: { mode: "none", login_state_reused: false }, performance: { status: "not_applicable", reason: "controlled contract fixture" },
    screenshots: [{ ref: "quality/evidence/browser-qa/screenshot.png", hash: "a".repeat(64) }],
    test: { command: "qa", file: "qa.mjs", output_ref: "quality/tests/output/qa.txt", output_hash: "a".repeat(64), exit_code: result === "pass" ? 0 : 1 },
    cleanup, engine_switch: "no",
    ...(result === "pass" || result === "fail" || result === "blocked" || result === "unknown" ? (result === "pass" ? {} : { failure_reason: `controlled QA ${result}` }) : {}),
    ...(evidence ? { evidence_ref: QA_EVIDENCE_REF } : {}),
  };
  return evidence
    ? { ...payload, evidence_hash: hash(canonicalQaRaw(payload)) }
    : payload;
}

function qaWorker({ taskId = "qa-contract", impact = "ui", loggedImpact = impact === "backend" || impact === "non_ui" ? "non_ui" : "ui", payload = qaPayload({ taskId }), withAdapter = true, withEvidenceReader = true, previousUiQaRef = null, omitAttempt = false } = {}) {
  let calls = 0;
  let currentPayload = payload;
  const qaBinding = {
    attempt_id: payload.attempt_id,
    acceptance_criterion_id: payload.acceptance_criterion_id,
    design_identity: payload.design_identity,
    experience_identity: payload.experience_identity,
    service_identity: payload.service_identity,
    api_identity: payload.api_identity,
    dto_identity: payload.dto_identity,
    browser_profile: payload.browser_profile,
    route: payload.route,
    page: payload.page,
    scenario: payload.scenario,
    fixture: payload.fixture,
  };
  const worker = {
    stage: "build-code", identity: { taskId }, workflowRunId: "qa-run", manifest: { record_model: "vnext-single-write" },
    ...(omitAttempt ? {} : { currentAttemptId: "attempt-1" }), currentMaterialRevision: payload.material_revision,
    readArtifact: (name) => name === "decision-log.md"
      ? (loggedImpact ? uiApplicabilityDecisionLog(loggedImpact) : "# 当前决策\n")
      : name === "spec.md" ? "# spec\nAC-UI-001\n" : "# tasks\n",
    artifactRef: (name) => `specs/${taskId}/${name}`, snapshotWorkspace: () => ({ tree: payload.snapshot_tree }),
    ...(withEvidenceReader ? { readEvidence: (ref) => {
      const raw = canonicalQaRaw(currentPayload);
      return { bytes: raw, sha256: ref === QA_EVIDENCE_REF ? hash(raw) : "e".repeat(64) };
    } } : {}),
    ...(withAdapter ? { runControlledUiQa: async (input) => {
      calls += 1;
      currentPayload = { ...payload, invocation_id: input.invocation_id };
      if (currentPayload.evidence_ref) currentPayload = { ...currentPayload, evidence_hash: hash(canonicalQaRaw(currentPayload)) };
      return { invocation_id: input.invocation_id, payload: currentPayload };
    } } : {}),
  };
  return { worker, invocation: { receipts: previousUiQaRef ? { ui_qa: previousUiQaRef } : {}, contract_facts: { impact, impact_inputs: { raw_requirement: impact }, component_quality_map: [{ action: "reuse", component: "Settings", real_consumer: "settings-page", state_owner: "Settings", typed_view_model: "SettingsViewModel", css_token_owner: "Settings tokens", story_or_test_update: "existing Settings story covers the current contract" }], qa_binding: qaBinding } }, calls: () => calls };
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("P2 formal wiring contract", () => {
  it("publishes one immutable make-decision interaction aggregate through the kernel", () => {
    const state = fixture();
    expect(typeof state.kernel.prepareMakeDecisionInteractionPublication).toBe("function");
    expect(typeof state.kernel.completeMakeDecisionInteractionPublication).toBe("function");
    if (typeof state.kernel.prepareMakeDecisionInteractionPublication !== "function"
        || typeof state.kernel.completeMakeDecisionInteractionPublication !== "function") return;
    const prepared = state.kernel.prepareMakeDecisionInteractionPublication(draft(state));
    const published = state.kernel.completeMakeDecisionInteractionPublication(prepared);
    expect(published.ref).toMatch(/^quality\/evidence\/interactions\/[a-f0-9]{64}\.json$/);
    expect(published.value.schema_version).toBe("workflowhub-interaction-aggregate.v1");
    expect(state.task.readRecord(published.ref)).toContain("workflowhub-interaction-aggregate.v1");
  });

  it("does not let the generic quality writer mint a resolved code review", () => {
    const state = fixture("resolved-review-writer-boundary");
    expect(() => state.kernel.publishVNextQualityFact("verify-code", {
      kind: "review",
      status: "recorded",
      review_status: "resolved",
      subject: "code_review",
      evidence: [{
        ref: "quality/reviews/results/not-authenticated.json",
        sha256: "0".repeat(64),
        evidence_type: "review_result",
      }],
    })).toThrow(/resolved review authorization/i);
  });

  it("replays by identity and rejects content changes or missing confirmation", () => {
    const state = fixture("interaction-publication-replay");
    if (typeof state.kernel.completeMakeDecisionInteractionPublication !== "function") return;
    const first = state.kernel.completeMakeDecisionInteractionPublication(draft(state));
    const replay = state.kernel.completeMakeDecisionInteractionPublication(draft(state));
    expect(replay.ref).toBe(first.ref);
    expect(replay.idempotent).toBe(true);
    const reordered = draft(state);
    reordered.grill = { summary: reordered.grill.summary, status: reordered.grill.status };
    const reorderedReplay = state.kernel.completeMakeDecisionInteractionPublication(reordered);
    expect(reorderedReplay.ref).toBe(first.ref);
    expect(reorderedReplay.idempotent).toBe(true);
    expect(() => state.kernel.completeMakeDecisionInteractionPublication({
      ...draft(state),
      advice: { status: "completed", result_ref: "quality/reviews/results/advice.json", result_hash: hash("advice") },
    })).toThrow(/conflict|identity/i);
    expect(() => state.kernel.prepareMakeDecisionInteractionPublication({ ...draft(state), confirmation: undefined }))
      .toThrow(/MATERIAL_INCOMPLETE|confirmation/i);
  });

  it("exposes a browser evidence validator and requires execution identity fields", () => {
    expect(typeof stageEvidence.validateBrowserQaEvidence).toBe("function");
    if (typeof stageEvidence.validateBrowserQaEvidence !== "function") return;
    const evidence = {
      applicability: "ui", result: "blocked", task_id: "interaction-publication", stage: "build-code",
      attempt_id: "attempt-1", invocation_id: "invocation-1", material_revision: `revision-${"a".repeat(64)}`,
      snapshot_tree: "b".repeat(40), acceptance_criterion_id: "AC-UI-001", route: "/settings", page: "Settings", scenario: "open",
      tool: "isolated-browser-qa", engine: "agent-browser", session: "qa-1",
      state: { name: "default" }, viewport: { name: "desktop", width: 1440, height: 900 },
      fixture: { name: "settings" }, component: { name: "Settings", path: "src/Settings.tsx" },
      design_revision: "Design.md@r1", design_identity: { document_kind: "design", path: "Design.md", content_sha256: "a".repeat(64), revision: "design-1", anchor_id: "design-components", anchor_title: "Components", anchor_source: "explicit" }, experience_identity: { document_kind: "experience", path: "Experience.md", content_sha256: "b".repeat(64), revision: "experience-1", anchor_id: "experience-settings", anchor_title: "Settings", anchor_source: "explicit" },
      browser_profile: { name: "isolated-browser", revision: "profile-1" }, service_identity: { name: "web", revision: "svc-1" },
      api_identity: { name: "settings-api", revision: "api-1" }, dto_identity: { name: "SettingsDto", revision: "dto-1" },
      cancellation: { status: "cancelled", reason: "user stopped the run" },
      observations: { console: { status: "unknown" }, network: { status: "unknown" }, focus: { status: "unknown" }, overflow: { status: "unknown" } },
      visual: { status: "not_observed", reason: "browser stopped" },
      a11y: { status: "not_applicable", reason: "browser stopped" }, auth: { mode: "none", login_state_reused: false },
      performance: { status: "not_applicable", reason: "blocked before measurement" }, screenshots: [],
      test: { command: "qa", file: "qa.test.mjs", output_ref: "quality/tests/output/qa.txt", output_hash: "a".repeat(64), exit_code: 1 },
      cleanup: { status: "completed", app_service_running: true }, engine_switch: "no", failure_reason: "cancelled by user",
    };
    expect(() => stageEvidence.validateBrowserQaEvidence(evidence)).not.toThrow();
    expect(() => stageEvidence.validateBrowserQaEvidence({ ...evidence, api_identity: undefined })).toThrow(/api_identity|invalid|required/i);
  });

  it("rejects the old detail-advice objective_facts field before provider dispatch", () => {
    const state = fixture("detail-material-contract");
    const source = { targetCommit: "1".repeat(40), baseCommit: "2".repeat(40), baseTree: "3".repeat(40), capturedHead: "4".repeat(40), snapshotTree: "5".repeat(40), changedFiles: [] };
    expect(() => buildReviewMaterials({
      reviewDataRoot: state.root,
      attachmentRoot: state.root,
      source,
      task: state.task,
      taskId: state.task.identity.taskId,
      stage: "make-decision",
      reviewTrack: "detail",
      materials: {
        raw_requirement: "原始需求",
        approved_direction: "已确认方向",
        draft_spec_or_acceptance: "页面与状态",
        objective_facts: "不应进入 detail packet",
        review_instructions: reviewInstructionsFor("make-decision", "detail"),
      },
    })).toThrow(/MATERIAL_FORBIDDEN|objective_facts/i);
  });

  it("keeps controlled QA private to the official build-code seam and does not add a public runner", async () => {
    const runnerSource = await import("../../runtime/stage/stage-runner.mjs");
    const handlerSource = await import("../../runtime/stage/stage-handlers.mjs");
    expect(typeof runnerSource.runOfficialStage).toBe("function");
    expect(typeof handlerSource.officialStageHandler).toBe("function");
  });

  it("actually invokes the controlled QA adapter once for an applicable official build-code run", async () => {
    let calls = 0;
    const taskId = "controlled-qa-handler";
    const snapshotTree = "b".repeat(40);
    const materialRevision = `revision-${"a".repeat(64)}`;
    const qaEvidenceRef = `quality/evidence/browser-qa/${"c".repeat(64)}.json`;
    let currentPayload;
    const worker = {
      stage: "build-code",
      identity: { taskId },
      workflowRunId: "vnext-controlled-qa",
      manifest: { record_model: "vnext-single-write" },
      currentAttemptId: "attempt-1",
      currentMaterialRevision: materialRevision,
      readArtifact: (name) => name === "decision-log.md" ? uiApplicabilityDecisionLog("ui") : name === "spec.md" ? "# spec\nAC-UI-001\n" : "# tasks\n",
      artifactRef: (name) => `specs/${taskId}/${name}`,
      snapshotWorkspace: () => ({ tree: snapshotTree }),
      readEvidence: (ref) => {
        const raw = canonicalQaRaw(currentPayload);
        return { bytes: raw, sha256: ref === qaEvidenceRef ? hash(raw) : "e".repeat(64) };
      },
      runControlledUiQa: async (input) => {
        calls += 1;
        const candidate = {
            applicability: "ui", result: "pass", task_id: taskId, stage: "build-code",
            attempt_id: "attempt-1", invocation_id: input.invocation_id, material_revision: materialRevision,
            snapshot_tree: snapshotTree, acceptance_criterion_id: "AC-UI-001", route: "/settings", page: "Settings", scenario: "open",
            tool: "isolated-browser-qa", engine: "agent-browser", session: "qa-1", state: { name: "default" },
            viewport: { name: "desktop", width: 1440, height: 900 }, fixture: { name: "settings", fixture_only: false },
            component: { name: "Settings", path: "src/Settings.tsx" }, design_revision: "Design.md@r1",
            design_identity: { document_kind: "design", path: "Design.md", content_sha256: "a".repeat(64), revision: "design-1", anchor_id: "design-components", anchor_title: "Components", anchor_source: "explicit" }, experience_identity: { document_kind: "experience", path: "Experience.md", content_sha256: "b".repeat(64), revision: "experience-1", anchor_id: "experience-settings", anchor_title: "Settings", anchor_source: "explicit" },
            service_identity: { name: "web", revision: "svc-1" }, api_identity: { name: "settings-api", revision: "api-1" },
            dto_identity: { name: "SettingsDto", revision: "dto-1" }, browser_profile: { name: "isolated-browser", revision: "profile-1" },
            cancellation: { status: "not_cancelled" }, observations: { console: { status: "clean" }, network: { status: "clean" }, focus: { status: "checked" }, overflow: { status: "none" } },
            visual: { status: "observed", screenshot_refs: ["quality/evidence/browser-qa/screenshot.png"] }, a11y: { status: "not_applicable", reason: "controlled contract fixture" },
            auth: { mode: "none", login_state_reused: false }, performance: { status: "not_applicable", reason: "controlled contract fixture" },
            screenshots: [{ ref: "quality/evidence/browser-qa/screenshot.png", hash: "a".repeat(64) }],
            evidence_ref: qaEvidenceRef,
            test: { command: "qa", file: "qa.mjs", output_ref: "quality/tests/output/qa.txt", output_hash: "a".repeat(64), exit_code: 0 },
          cleanup: { status: "completed", app_service_running: true }, engine_switch: "no",
        };
        currentPayload = { ...candidate, evidence_hash: hash(canonicalQaRaw(candidate)) };
        return { invocation_id: input.invocation_id, payload: currentPayload };
      },
    };
    const result = await (await import("../../runtime/stage/stage-handlers.mjs")).officialStageHandler("build-code")(worker, {
      receipts: {},
      contract_facts: {
        impact: "ui",
        impact_inputs: { raw_requirement: "ui" },
        component_quality_map: [{ action: "reuse", component: "Settings", real_consumer: "settings-page", state_owner: "Settings", typed_view_model: "SettingsViewModel", css_token_owner: "Settings tokens", story_or_test_update: "existing Settings story covers the current contract" }],
        qa_binding: {
          acceptance_criterion_id: "AC-UI-001",
          design_identity: { document_kind: "design", path: "Design.md", content_sha256: "a".repeat(64), revision: "design-1", anchor_id: "design-components", anchor_title: "Components", anchor_source: "explicit" },
          experience_identity: { document_kind: "experience", path: "Experience.md", content_sha256: "b".repeat(64), revision: "experience-1", anchor_id: "experience-settings", anchor_title: "Settings", anchor_source: "explicit" },
          service_identity: { name: "web", revision: "svc-1" }, api_identity: { name: "settings-api", revision: "api-1" },
          dto_identity: { name: "SettingsDto", revision: "dto-1" }, browser_profile: { name: "isolated-browser", revision: "profile-1" },
        },
      },
    });
    expect(calls).toBe(1);
    expect(result.facts.ui_qa, JSON.stringify(result)).toMatchObject({ status: "passed", invocation_id: expect.any(String) });
  });

  it("keeps QA applicability, canonical evidence, cancellation, failure and retry facts truthful", async () => {
    const handler = (await import("../../runtime/stage/stage-handlers.mjs")).officialStageHandler("build-code");
    const passing = qaWorker();
    const passResult = await handler(passing.worker, passing.invocation);
    expect(passResult.facts.ui_qa.status).toBe("passed");
    expect(passing.calls()).toBe(1);
    const retry = await handler(passing.worker, passing.invocation);
    expect(retry.facts.ui_qa.status).toBe("passed");
    expect(passing.calls()).toBe(2);
    expect(retry.facts.ui_qa.invocation_id).not.toBe(passResult.facts.ui_qa.invocation_id);

    const previous = qaWorker({ previousUiQaRef: "quality/evidence/browser-qa/old-pass.json" });
    const previousResult = await handler(previous.worker, previous.invocation);
    expect(previous.calls()).toBe(1);
    expect(previousResult.facts.ui_qa.status).toBe("passed");

    const mismatchedService = qaWorker();
    mismatchedService.invocation.contract_facts.qa_binding.service_identity = { name: "other-web", revision: "svc-2" };
    const mismatchedServiceResult = await handler(mismatchedService.worker, mismatchedService.invocation);
    expect(mismatchedServiceResult.facts.ui_qa.status).toBe("unknown");
    expect(mismatchedServiceResult.facts.ui_qa.reason).toMatch(/service_identity/);

    const missingEvidence = qaWorker({ payload: qaPayload({ evidence: false }) });
    const missingEvidenceResult = await handler(missingEvidence.worker, missingEvidence.invocation);
    expect(missingEvidenceResult.facts.ui_qa.status).toBe("unknown");
    expect(missingEvidenceResult.facts.ui_qa.reason).toMatch(/canonical evidence/i);

    const cancelled = qaWorker({ payload: qaPayload({ cancellation: { status: "cancelled", reason: "user stopped the run" } }) });
    const cancelledResult = await handler(cancelled.worker, cancelled.invocation);
    expect(cancelledResult.facts.ui_qa.status).toBe("failed");
    expect(cancelledResult.facts.ui_qa.reason).toMatch(/cancelled/i);

    const failed = qaWorker({ payload: qaPayload({ result: "fail" }) });
    const failedResult = await handler(failed.worker, failed.invocation);
    expect(failedResult.facts.ui_qa.status).toBe("failed");

    const noExecutor = qaWorker({ withAdapter: false });
    const noExecutorResult = await handler(noExecutor.worker, noExecutor.invocation);
    expect(noExecutorResult.facts.ui_qa.status).toBe("unknown");
    expect(noExecutorResult.facts.ui_qa.reason).toMatch(/no controlled browser QA executor/i);

    const invalidMap = qaWorker();
    invalidMap.invocation.contract_facts.component_quality_map = [{ component: "Settings" }];
    const invalidMapResult = await handler(invalidMap.worker, invalidMap.invocation);
    expect(invalidMapResult.facts.ui_qa.status).toBe("incomplete");
    expect(invalidMapResult.facts.ui_qa.reason).toMatch(/component_quality_map is invalid/i);
    expect(invalidMap.calls()).toBe(0);

    const backend = qaWorker({ impact: "backend" });
    const backendResult = await handler(backend.worker, backend.invocation);
    expect(backendResult.facts.ui_qa.status).toBe("not_applicable");
    expect(backend.calls()).toBe(0);
    expect(backendResult.facts.contract_facts.missing_items).not.toEqual(expect.arrayContaining([
      "project_standard_sources are missing",
      "consumer_census is missing",
    ]));

    const failedDelivery = qaWorker({ payload: qaPayload({ result: "fail" }) });
    failedDelivery.invocation.contract_facts.delivery_contract = {
      impact: "ui",
      ui_contract: { design_identity: "design-1", experience_identity: "experience-1", census_ref: "census-1", experience_scenario_ref: "settings-flow", evidence_ref: "ui-evidence-1" },
      facts: { design: { status: "passed" }, experience: { status: "passed" }, census: { status: "passed" }, evidence: { status: "passed" } },
    };
    const failedDeliveryResult = await handler(failedDelivery.worker, failedDelivery.invocation);
    expect(failedDeliveryResult.facts.contract_facts.delivery_contract.status).toBe("incomplete");
  });

  it("accepts the current change_impact contract shape at the build-code boundary", async () => {
    const workerState = qaWorker();
    delete workerState.invocation.contract_facts.impact;
    workerState.invocation.contract_facts.change_impact = { impact: "ui" };
    const handler = (await import("../../runtime/stage/stage-handlers.mjs")).officialStageHandler("build-code");
    const result = await handler(workerState.worker, workerState.invocation);
    expect(result.facts.contract_facts.change_impact).toMatchObject({ status: "passed", impact: "ui" });
    expect(result.facts.ui_qa.status).toBe("passed");
    expect(workerState.calls()).toBe(1);
  });

  it("does not let an unverified non-UI label skip browser QA", async () => {
    const workerState = qaWorker({ impact: "non_ui", loggedImpact: null });
    const handler = (await import("../../runtime/stage/stage-handlers.mjs")).officialStageHandler("build-code");
    const result = await handler(workerState.worker, workerState.invocation);
    expect(result.facts.ui_qa.status).toBe("unknown");
    expect(result.facts.ui_qa.reason).toMatch(/decision-log.*missing|authenticated implementation consumer classification/i);
    expect(workerState.calls()).toBe(0);
  });

  it("does not treat an unbound project-standard copy as current in build-code", async () => {
    const workerState = qaWorker();
    workerState.invocation.contract_facts.project_standard_sources = {
      design: workerState.invocation.contract_facts.qa_binding.design_identity,
      experience: workerState.invocation.contract_facts.qa_binding.experience_identity,
    };
    const handler = (await import("../../runtime/stage/stage-handlers.mjs")).officialStageHandler("build-code");
    const result = await handler(workerState.worker, workerState.invocation);
    expect(result.facts.contract_facts.project_standard_sources.status).toBe("incomplete");
    expect(result.facts.contract_facts.missing_items).toEqual(expect.arrayContaining([
      expect.stringMatching(/project standard sources are/),
    ]));
  });

  it("does not turn fixture-only or blocked browser results into a passing delivery fact", async () => {
    const handler = (await import("../../runtime/stage/stage-handlers.mjs")).officialStageHandler("build-code");
    const fixtureOnly = qaWorker({ payload: qaPayload({ fixtureOnly: true }) });
    const fixtureResult = await handler(fixtureOnly.worker, fixtureOnly.invocation);
    expect(fixtureResult.facts.ui_qa.status).toBe("unknown");
    expect(fixtureResult.facts.ui_qa.reason).toMatch(/fixture\.fixture_only=false|real-page provenance/i);

    const blocked = qaWorker({ payload: qaPayload({ result: "blocked", fixtureOnly: true }) });
    const blockedResult = await handler(blocked.worker, blocked.invocation);
    expect(blockedResult.facts.ui_qa.status).toBe("blocked");
    expect(blockedResult.facts.contract_facts.delivery_contract.status).toBe("incomplete");
  });

  it("passes the bound attempt id to the adapter when the worker has no current attempt field", async () => {
    const workerState = qaWorker({ omitAttempt: true });
    let adapterAttemptId;
    const originalAdapter = workerState.worker.runControlledUiQa;
    workerState.worker.runControlledUiQa = async (input) => {
      adapterAttemptId = input.attempt_id;
      return originalAdapter(input);
    };
    const handler = (await import("../../runtime/stage/stage-handlers.mjs")).officialStageHandler("build-code");
    const result = await handler(workerState.worker, workerState.invocation);
    expect(adapterAttemptId).toBe("attempt-1");
    expect(result.facts.ui_qa.status).toBe("passed");
  });

  it("passes the acceptance, source, route, page, scenario, and fixture bindings to the adapter", async () => {
    const workerState = qaWorker();
    let adapterInput;
    const originalAdapter = workerState.worker.runControlledUiQa;
    workerState.worker.runControlledUiQa = async (input) => {
      adapterInput = input;
      return originalAdapter(input);
    };
    const handler = (await import("../../runtime/stage/stage-handlers.mjs")).officialStageHandler("build-code");
    const result = await handler(workerState.worker, workerState.invocation);
    expect(result.facts.ui_qa.status).toBe("passed");
    expect(adapterInput).toMatchObject({
      acceptance_criterion_id: "AC-UI-001",
      route: "/settings",
      page: "Settings",
      scenario: "open",
      fixture: { name: "settings", fixture_only: false },
      design_identity: workerState.invocation.contract_facts.qa_binding.design_identity,
      experience_identity: workerState.invocation.contract_facts.qa_binding.experience_identity,
      service_identity: workerState.invocation.contract_facts.qa_binding.service_identity,
      api_identity: workerState.invocation.contract_facts.qa_binding.api_identity,
      dto_identity: workerState.invocation.contract_facts.qa_binding.dto_identity,
      browser_profile: workerState.invocation.contract_facts.qa_binding.browser_profile,
    });
  });

  it("rejects canonical browser evidence whose bytes do not match the current payload", async () => {
    const workerState = qaWorker();
    let latestPayload;
    const originalAdapter = workerState.worker.runControlledUiQa;
    workerState.worker.runControlledUiQa = async (input) => {
      const output = await originalAdapter(input);
      latestPayload = output.payload;
      return output;
    };
    workerState.worker.readEvidence = (ref) => ({
      bytes: canonicalQaRaw({ ...latestPayload, page: "Stale Settings" }),
      sha256: latestPayload.evidence_hash,
    });
    const handler = (await import("../../runtime/stage/stage-handlers.mjs")).officialStageHandler("build-code");
    const result = await handler(workerState.worker, workerState.invocation);
    expect(result.facts.ui_qa.status).toBe("unknown");
    expect(result.facts.ui_qa.reason).toMatch(/canonical evidence content does not match/i);
  });

  it("keeps a consumer census from an older implementation snapshot incomplete", async () => {
    const workerState = qaWorker();
    workerState.invocation.contract_facts.consumer_census = {
      schema_version: "consumer-census.v1",
      scanner_version: "scanner-1",
      source_snapshot: { tree: "a".repeat(40) },
      scan_config: {},
      support_matrix: ["route", "import", "lazy", "css", "data"].map((kind) => ({ kind, supported: true })),
      consumers: [{ kind: "route", path: "src/routes/settings.tsx", anchor: "route-settings", location: "/settings", page: "settings" }],
    };
    const handler = (await import("../../runtime/stage/stage-handlers.mjs")).officialStageHandler("build-code");
    const result = await handler(workerState.worker, workerState.invocation);
    expect(result.facts.contract_facts.consumer_census.status).toBe("incomplete");
    expect(result.facts.contract_facts.missing_items).toEqual(expect.arrayContaining([
      "consumer census is stale for the current implementation snapshot",
    ]));
  });
});
