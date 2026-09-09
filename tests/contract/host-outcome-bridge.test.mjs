import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { resolveWorkflowHubIdentity } from "../../tools/cli/stage-runtime.mjs";
import { assertHostCoordinationEvents } from "../../tools/host/workflowhub-stage-agent-bridge.mjs";
import { main as workflowHubBridgeMain } from "../../tools/host/workflowhub-stage-agent-bridge.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { createTaskKernel } from "../../runtime/task/task-kernel.mjs";
import { buildWorkerBrief, verifyWorkerBrief } from "../../runtime/task/material-workspace.mjs";
import { validateWorkerSummary } from "../../runtime/stage/stage-agent-outcome-adapter.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";

const roots = [];
const fixture = (taskId = "host-outcome-task", { legacy = false } = {}) => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-host-outcome-")));
  roots.push(root);
  const repo = join(root, "repo");
  const storage = join(root, "storage");
  mkdirSync(repo);
  mkdirSync(storage);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub tests"]);
  git(["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "host outcome fixture\n");
  git(["add", "README.md"]);
  git(["commit", "-qm", "baseline"]);
  const task = createTask({
    storageRoot: storage,
    manifest: {
      schema_version: "1.0.0",
      project_name: "WorkflowHub",
      task_id: taskId,
      created_at: "2026-09-05T00:00:00Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
      ...(legacy ? { session_id: "old-session", active_task_id: "old-task" } : {}),
    },
  });
  const workspace = prepareTaskWorkspace(task);
  const materialRoot = join(workspace.worktreeRoot, "specs", taskId);
  mkdirSync(materialRoot, { recursive: true });
  for (const name of ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) {
    writeFileSync(join(materialRoot, name), `# ${name}\nfixture\n`);
  }
  return {
    root, repo, storage,
    env: { HOME: join(root, "home"), WORKFLOWHUB_TASK_DIR: storage },
    task,
    kernel: createTaskKernel(task, { candidateWorkspace: workspace }),
    workspace,
  };
};

const readFixture = (name) => JSON.parse(readFileSync(join(dirname(new URL(import.meta.url).pathname), "..", "fixtures", "host-outcome", name), "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

const usageRef = ({ taskId = "coord-task", sessionId = "coord-session", eventType = "dispatch", producerRole = "stage-coordinator", workerTokens = 12 } = {}) => ({
  task_id: taskId,
  session_id: sessionId,
  root_input_tokens: 8,
  worker_input_tokens: workerTokens,
  event_type: eventType,
  producer_role: producerRole,
  timestamp: "2026-09-09T15:00:00.000Z",
});

const coordinationEvent = ({
  workerId,
  eventType = "dispatch",
  producerRole = "stage-coordinator",
  operation = "dispatch",
  readOnly = true,
  taskId = "coord-task",
  sessionId = "coord-session",
  briefRef,
  briefHash,
  summaryRef,
  summaryHash,
} = {}) => ({
  event_type: eventType,
  worker_id: workerId,
  producer_role: producerRole,
  operation,
  read_only: readOnly,
  task_id: taskId,
  stage: "build-code",
  usage_ref: usageRef({ taskId, sessionId, eventType, producerRole }),
  ...(briefRef === undefined ? {} : { brief_ref: briefRef }),
  ...(briefHash === undefined ? {} : { brief_hash: briefHash }),
  ...(summaryRef === undefined ? {} : { summary_ref: summaryRef }),
  ...(summaryHash === undefined ? {} : { summary_hash: summaryHash }),
});

const coordinationFixture = (workerIds = ["worker-1"]) => {
  const materialRevision = "a".repeat(64);
  const snapshotTree = "b".repeat(40);
  const evidence = new Map();
  const briefs = workerIds.map((workerId) => buildWorkerBrief({
    task_id: "coord-task",
    stage: "build-code",
    material_revision: materialRevision,
    snapshot_tree: snapshotTree,
    source_summary: [{ ref: "specs/coord-task/spec.md", sha256: "c".repeat(64) }],
    objective: `inspect bounded seam for ${workerId}`,
    boundary: { allowed_tools: ["rg"], forbidden_inputs: ["transcript", "undeclared_history"], output_contract: "worker-summary.v1" },
  }));
  const summaries = workerIds.map((workerId) => {
    const ref = `quality/evidence/worker-summaries/${workerId}.txt`;
    const raw = `immutable evidence from ${workerId}\n`;
    evidence.set(ref, raw);
    return { conclusion: `bounded conclusion from ${workerId}`, ref, sha256: sha256(raw) };
  });
  const bindings = workerIds.map((workerId, index) => {
    const briefRef = `worker-brief/${workerId}`;
    const briefHash = briefs[index].brief_hash;
    const summary = summaries[index];
    return { workerId, briefRef, briefHash, summary };
  });
  const events = [
    ...bindings.map(({ workerId, briefRef, briefHash }) => coordinationEvent({ workerId, briefRef, briefHash })),
    ...bindings.map(({ workerId, briefRef, briefHash, summary }) => coordinationEvent({
        workerId,
        eventType: "terminal",
        operation: "terminal",
        briefRef,
        briefHash,
        summaryRef: summary.ref,
        summaryHash: summary.sha256,
      })),
  ];
  const options = {
    taskId: "coord-task",
    sessionId: "coord-session",
    stage: "build-code",
    materialRevision,
    snapshotTree,
    briefs,
    summaries,
    read: (ref) => evidence.get(ref),
  };
  return { briefs, summaries, events, options };
};

const currentBridgeCoordination = (state, workerIds = ["worker-1", "worker-2"]) => {
  const taskId = state.task.identity.taskId;
  const materialRevision = state.kernel.currentVNextMaterialRevision().replace(/^revision-/, "");
  const snapshotTree = state.kernel.currentVNextSnapshot().tree;
  const briefs = workerIds.map((workerId) => buildWorkerBrief({
    task_id: taskId,
    stage: "build-code",
    material_revision: materialRevision,
    snapshot_tree: snapshotTree,
    source_summary: [{ ref: `specs/${taskId}/spec.md`, sha256: "c".repeat(64) }],
    objective: `inspect bounded seam for ${workerId}`,
    boundary: { allowed_tools: ["rg"], forbidden_inputs: ["transcript", "undeclared_history"], output_contract: "worker-summary.v1" },
  }));
  const summaries = workerIds.map((workerId) => {
    const ref = `quality/evidence/worker-summaries/${workerId}.txt`;
    const raw = `immutable evidence from ${workerId}\n`;
    state.kernel.publishCanonicalRecord(ref, raw);
    return { conclusion: `bounded conclusion from ${workerId}`, ref, sha256: sha256(raw) };
  });
  const events = [
    ...workerIds.map((workerId, index) => coordinationEvent({
      workerId, taskId, briefRef: `worker-brief/${workerId}`, briefHash: briefs[index].brief_hash,
    })),
    ...workerIds.map((workerId, index) => coordinationEvent({
      workerId, taskId, eventType: "terminal", operation: "terminal",
      briefRef: `worker-brief/${workerId}`, briefHash: briefs[index].brief_hash,
      summaryRef: summaries[index].ref, summaryHash: summaries[index].sha256,
    })),
  ];
  return { briefs, summaries, events, materialRevision, snapshotTree };
};

const bridgeRequestWithCoordination = (state, coordination, attemptId) => ({
  project_name: state.task.identity.projectName,
  task_id: state.task.identity.taskId,
  task_path: state.task.taskPath,
  stage: "build-code",
  attempt_id: attemptId,
  agent_run_id: `${attemptId}-agent`,
  session: {
    host: "fixture-host",
    source_id: "fixture/coordination",
    source_family: "fixture",
    source_ref: `fixture:${attemptId}`,
    session_id: "coord-session",
    task_id: state.task.identity.taskId,
    status: "incomplete",
    events: [],
    coordination,
    spec_analyze: {},
  },
});

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("explicit host outcome bridge contract", () => {
  it("accepts complete explicit project/task identity", () => {
    const state = fixture();
    expect(resolveWorkflowHubIdentity({ project: " WorkflowHub ", task: " host-outcome-task " }, state.repo, {})).toMatchObject({
      project: "WorkflowHub",
      task: "host-outcome-task",
      source: "explicit",
    });
  });

  it("fails closed for partial, missing, and conflicting identity", () => {
    const state = fixture("identity-bound-task");
    expect(() => resolveWorkflowHubIdentity({ project: "WorkflowHub" }, state.repo, {})).toThrow(/supplied together/i);
    expect(() => resolveWorkflowHubIdentity({}, state.repo, {})).toThrow(/identity.*missing/i);
    expect(() => resolveWorkflowHubIdentity({ project: "Other", task: "identity-bound-task" }, state.workspace.worktreeRoot, state.env))
      .toThrow(/identity conflict/i);
  });

  it("uses the authenticated worktree and ignores legacy session/env fields", () => {
    const state = fixture("legacy-ignored-task", { legacy: true });
    expect(resolveWorkflowHubIdentity({}, state.workspace.worktreeRoot, { ...state.env, CODEX_SESSION_ID: "old-session-id" })).toMatchObject({
      project: "WorkflowHub",
      task: "legacy-ignored-task",
      source: "worktree",
    });
  });

  it("rejects legacy execution input from the fixture before any writer call", async () => {
    const input = readFixture("legacy-execution.json");
    await expect(workflowHubBridgeMain(input)).rejects.toThrow(/historical-only/i);
  });

  it("requires the full explicit bridge identity and agent_run_id", async () => {
    const state = fixture("host-outcome-fixture");
    const valid = readFixture("valid-unavailable.json");
    await expect(workflowHubBridgeMain({
      ...valid,
      task_path: state.task.taskPath,
      agent_run_id: undefined,
    })).rejects.toThrow(/agent_run_id/i);
  });

  it("rejects every missing identity field before the bridge writer", async () => {
    const state = fixture("host-outcome-identity-fields");
    const valid = readFixture("valid-unavailable.json");
    for (const field of ["project_name", "task_id", "task_path", "stage", "attempt_id", "agent_run_id"]) {
      const payload = {
        ...valid,
        task_path: state.task.taskPath,
        task_id: state.task.identity.taskId,
        stage: "build-code",
        attempt_id: `attempt-missing-${field}`,
        agent_run_id: `agent-missing-${field}`,
      };
      delete payload[field];
      await expect(workflowHubBridgeMain(payload)).rejects.toThrow(new RegExp(field));
    }
  });

  it("publishes unavailable verify-code reviews bound to the current identity", async () => {
    const state = fixture("host-outcome-verify-code");
    const valid = readFixture("valid-unavailable.json");
    const result = await workflowHubBridgeMain({
      ...valid,
      task_id: state.task.identity.taskId,
      stage: "verify-code",
      task_path: state.task.taskPath,
      attempt_id: "attempt-host-outcome-verify-code",
      agent_run_id: "agent-host-outcome-verify-code",
      unavailable: { ...valid.unavailable, source_id: "fixture-cli/fixture-source", source_family: "fixture-cli" },
    });
    const outcome = JSON.parse(state.task.readRecord(result.outcome_ref));
    expect(outcome).toMatchObject({
      stage: "verify-code",
      status: "unavailable",
      code_review: {
        snapshot_tree: outcome.snapshot_tree,
        material_revision: outcome.material_revision,
        result: { status: "unavailable" },
      },
    });
  });

  it("fails with an explicit producer diagnostic when neither session nor unavailable is submitted", async () => {
    const state = fixture("host-outcome-missing-producer");
    const valid = readFixture("valid-unavailable.json");
    const { unavailable: _unavailable, ...missing } = valid;
    await expect(workflowHubBridgeMain({
      ...missing,
      task_path: state.task.taskPath,
      agent_run_id: "agent-host-outcome-missing-producer",
    })).rejects.toMatchObject({ code: "BRIDGE_STAGE_AGENT_RESULT_MISSING" });
  });

  it("P3 T007 rejects inconsistent source identity before recording an unavailable execution", async () => {
    const state = fixture("p3-invalid-source-family");
    const valid = readFixture("valid-unavailable.json");
    await expect(workflowHubBridgeMain({
      ...valid, task_id: state.task.identity.taskId, task_path: state.task.taskPath,
      attempt_id: "attempt-A", agent_run_id: "agent-B",
      unavailable: { ...valid.unavailable, source_id: "codex/host", source_family: "other" },
    })).rejects.toThrow(/source.*(?:family|identity)|source_family/i);
    expect(state.task.listCanonicalStageOutcomeRefs(valid.stage)).toEqual([]);
  });

  it("rejects a bridge task id that does not match task_path", async () => {
    const state = fixture();
    const valid = readFixture("valid-unavailable.json");
    await expect(workflowHubBridgeMain({
      ...valid,
      task_id: "different-task",
      task_path: state.task.taskPath,
    })).rejects.toThrow(/taskPath does not match|task_id does not match/i);
  });

  it("keeps the bridge sources independent from old session binding", () => {
    const bridgeSource = readFileSync(new URL("../../tools/host/workflowhub-stage-agent-bridge.mjs", import.meta.url), "utf8");
    expect(bridgeSource).not.toMatch(/WORKFLOWHUB_SESSION_ID|workflowhub-codex-session-(?:state|event|hook)\.mjs/);
    expect(bridgeSource).toMatch(/agent_run_id/);
    expect(bridgeSource).toMatch(/session or unavailable/);
    expect(existsSync(join(dirname(new URL(import.meta.url).pathname), "..", "fixtures", "host-outcome", "valid-unavailable.json"))).toBe(true);
  });
});

describe("bounded worker coordination contract [P4]", () => {
  it("requires a self-contained worker brief bound to the current task, stage, materials, snapshot, and boundary", () => {
    const brief = buildWorkerBrief({
      task_id: "coord-task",
      stage: "build-code",
      material_revision: "a".repeat(64),
      snapshot_tree: "b".repeat(40),
      source_summary: [{ ref: "specs/coord-task/spec.md", sha256: "c".repeat(64) }],
      objective: "inspect one bounded seam",
      boundary: { allowed_tools: ["rg"], forbidden_inputs: ["transcript", "undeclared_history"], output_contract: "worker-summary.v1" },
    });
    expect(verifyWorkerBrief(brief)).toMatchObject({ ok: true, status: "ready", task_id: "coord-task", stage: "build-code" });
    expect(verifyWorkerBrief({ ...brief, history: ["old transcript"] })).toMatchObject({ ok: false, status: "unavailable" });
  });

  it("accepts only a narrow <=500-character summary with a readable matching evidence hash", () => {
    const raw = "immutable worker evidence\n";
    const summary = { conclusion: "bounded conclusion", ref: "quality/evidence/worker-summaries/fixture.json", sha256: sha256(raw) };
    expect(validateWorkerSummary(summary, { read: () => raw })).toMatchObject({ ok: true, status: "ready", ref: summary.ref, sha256: summary.sha256 });
    expect(validateWorkerSummary({ ...summary, conclusion: "x".repeat(501) }, { read: () => raw })).toMatchObject({ ok: false, status: "unavailable" });
    expect(validateWorkerSummary({ ...summary, trace: ["full transcript"] }, { read: () => raw })).toMatchObject({ ok: false, status: "unavailable" });
    expect(validateWorkerSummary({ ...summary, sha256: "0".repeat(64) }, { read: () => raw })).toMatchObject({ ok: false, status: "unavailable" });
  });

  it("binds each dispatch brief and same-worker terminal summary to authenticated refs and hashes", () => {
    const fixture = coordinationFixture(["worker-1", "worker-2", "worker-3"]);
    expect(assertHostCoordinationEvents(fixture.events, fixture.options)).toMatchObject({
      status: "recorded", worker_count: 3, max_concurrent: 3, read_concurrency: 3,
    });
  });

  it("rejects stale briefs, missing refs, cross-worker terminal binding, and orphan summaries", () => {
    const staleRevision = coordinationFixture();
    const staleRevisionBrief = buildWorkerBrief({ ...staleRevision.briefs[0], material_revision: "d".repeat(64) });
    staleRevision.options.briefs = [staleRevisionBrief];
    staleRevision.events = staleRevision.events.map((event) => ({ ...event, brief_hash: staleRevisionBrief.brief_hash }));
    expect(() => assertHostCoordinationEvents(staleRevision.events, staleRevision.options)).toThrow(/BRIEF_STALE.*material_revision/i);

    const staleTree = coordinationFixture();
    const staleTreeBrief = buildWorkerBrief({ ...staleTree.briefs[0], snapshot_tree: "e".repeat(40) });
    staleTree.options.briefs = [staleTreeBrief];
    staleTree.events = staleTree.events.map((event) => ({ ...event, brief_hash: staleTreeBrief.brief_hash }));
    expect(() => assertHostCoordinationEvents(staleTree.events, staleTree.options)).toThrow(/BRIEF_STALE.*snapshot_tree/i);

    const missing = coordinationFixture();
    const missingBriefRef = missing.events.map((event, index) => index === 0 ? { ...event, brief_ref: undefined } : event);
    expect(() => assertHostCoordinationEvents(missingBriefRef, missing.options)).toThrow(/BRIEF_REF/i);
    const missingSummaryRef = missing.events.map((event, index) => index === 1 ? { ...event, summary_ref: undefined } : event);
    expect(() => assertHostCoordinationEvents(missingSummaryRef, missing.options)).toThrow(/SUMMARY_REF/i);

    const crossed = coordinationFixture(["worker-1", "worker-2"]);
    const crossedEvents = crossed.events.map((event) => event.event_type === "terminal" && event.worker_id === "worker-1"
      ? { ...event, summary_ref: crossed.summaries[1].ref, summary_hash: crossed.summaries[1].sha256 }
      : event);
    expect(() => assertHostCoordinationEvents(crossedEvents, crossed.options)).toThrow(/WORKER_SUMMARY_MISMATCH/i);

    const orphan = coordinationFixture();
    const orphanRef = "quality/evidence/worker-summaries/orphan.txt";
    const orphanRaw = "orphan immutable evidence\n";
    orphan.options.summaries = [...orphan.summaries, { conclusion: "orphan", ref: orphanRef, sha256: sha256(orphanRaw) }];
    const originalRead = orphan.options.read;
    orphan.options.read = (ref) => ref === orphanRef ? orphanRaw : originalRead(ref);
    expect(() => assertHostCoordinationEvents(orphan.events, orphan.options)).toThrow(/SUMMARY_ORPHAN/i);
  });

  it("rejects stale, unbound, cross-worker, and orphan coordination at the real bridge boundary", async () => {
    const staleState = fixture("coordination-stale-bridge");
    const stale = currentBridgeCoordination(staleState);
    const staleBrief = buildWorkerBrief({ ...stale.briefs[0], material_revision: "d".repeat(64) });
    stale.briefs[0] = staleBrief;
    stale.events = stale.events.map((event) => event.worker_id === "worker-1"
      ? { ...event, brief_hash: staleBrief.brief_hash }
      : event);
    await expect(workflowHubBridgeMain(bridgeRequestWithCoordination(staleState, stale, "attempt-stale-bridge")))
      .rejects.toThrow(/BRIEF_STALE.*material_revision/i);

    const missingState = fixture("coordination-missing-ref-bridge");
    const missing = currentBridgeCoordination(missingState);
    missing.events[0] = { ...missing.events[0], brief_ref: undefined };
    await expect(workflowHubBridgeMain(bridgeRequestWithCoordination(missingState, missing, "attempt-missing-ref-bridge")))
      .rejects.toThrow(/BRIEF_REF/i);

    const crossedState = fixture("coordination-cross-worker-bridge");
    const crossed = currentBridgeCoordination(crossedState);
    crossed.events = crossed.events.map((event) => event.event_type === "terminal" && event.worker_id === "worker-1"
      ? { ...event, summary_ref: crossed.summaries[1].ref, summary_hash: crossed.summaries[1].sha256 }
      : event);
    await expect(workflowHubBridgeMain(bridgeRequestWithCoordination(crossedState, crossed, "attempt-cross-worker-bridge")))
      .rejects.toThrow(/WORKER_SUMMARY_MISMATCH/i);

    const orphanState = fixture("coordination-orphan-summary-bridge");
    const orphan = currentBridgeCoordination(orphanState);
    const orphanRef = "quality/evidence/worker-summaries/orphan.txt";
    const orphanRaw = "orphan immutable evidence\n";
    orphanState.kernel.publishCanonicalRecord(orphanRef, orphanRaw);
    orphan.summaries.push({ conclusion: "orphan", ref: orphanRef, sha256: sha256(orphanRaw) });
    await expect(workflowHubBridgeMain(bridgeRequestWithCoordination(orphanState, orphan, "attempt-orphan-summary-bridge")))
      .rejects.toThrow(/SUMMARY_ORPHAN/i);
  });

  it("rejects main-session heavy work, polling, the seventh worker, and missing usage", () => {
    const fixture = coordinationFixture();
    expect(() => assertHostCoordinationEvents([
      { ...fixture.events[0], worker_id: "main-scan", producer_role: "main-session", operation: "repository_scan", read_only: false,
        usage_ref: usageRef({ producerRole: "main-session" }) },
      { ...fixture.events[1], worker_id: "main-scan" },
    ], fixture.options)).toThrow(/ROLE_BOUNDARY_VIOLATION/);
    expect(() => assertHostCoordinationEvents([
      { ...fixture.events[0], event_type: "status_poll", operation: "status_poll",
        usage_ref: usageRef({ eventType: "status_poll" }) },
      fixture.events[1],
    ], fixture.options)).toThrow(/POLLING_NOT_ALLOWED/);
    const seven = coordinationFixture(Array.from({ length: 7 }, (_, index) => `worker-${index + 1}`));
    expect(() => assertHostCoordinationEvents(seven.events, seven.options)).toThrow(/WORKER_LIMIT_EXCEEDED/);
    expect(() => assertHostCoordinationEvents([
      { ...fixture.events[0], usage_ref: undefined },
      fixture.events[1],
    ], fixture.options)).toThrow(/usage/i);
  });
});
