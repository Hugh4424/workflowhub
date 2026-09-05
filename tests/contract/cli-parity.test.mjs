import { afterAll, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { main as workflowHubBridgeMain } from "../../tools/host/workflowhub-stage-agent-bridge.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";

const roots = [];
const buildCodeSteps = JSON.parse(readFileSync(join(process.cwd(), "workflows", "build-code", "steps.json"), "utf8")).steps;
const firstStep = buildCodeSteps[0].step_slug;
const analyzerEvidence = ["decision-log", "spec", "plan", "tasks", "implementation", "tests", "ac-trace"];

function fixture(taskId = "cli-parity-fixture") {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-cli-parity-")));
  roots.push(root);
  const repo = join(root, "repo");
  const storage = join(root, "storage");
  mkdirSync(repo);
  mkdirSync(storage);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub tests"]);
  git(["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "CLI parity fixture\n");
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
    },
  });
  const workspace = prepareTaskWorkspace(task);
  const materialRoot = join(workspace.worktreeRoot, "specs", taskId);
  mkdirSync(materialRoot, { recursive: true });
  for (const name of ["decision-log.md", "spec.md", "plan.md", "tasks.md"]) {
    writeFileSync(join(materialRoot, name), `# ${name}\nfixture\n`);
  }
  return { task };
}

function packetFor(taskId, taskPath, host, sourceFamily, attemptId) {
  const subject = { subject_kind: "step", subject_id: firstStep };
  return {
    project_name: "WorkflowHub",
    task_id: taskId,
    stage: "build-code",
    task_path: taskPath,
    attempt_id: attemptId,
    agent_run_id: `${sourceFamily}-${attemptId}`,
    session: {
      task_id: taskId,
      host,
      source_id: `${sourceFamily}/fixture`,
      source_family: sourceFamily,
      source_ref: `${sourceFamily}-parity-fixture`,
      status: "incomplete",
      events: [],
      spec_analyze: {
        packet: {
          original_requirements: [],
          coverage: [],
          current_stage_repairs: [],
          work_summary: "shared CLI parity fixture",
        },
        evidence_subjects: Object.fromEntries(analyzerEvidence.map((name) => [name, subject])),
        implementation_material: `unavailable: ${sourceFamily} parity fixture`,
        implementation_evidence_subject: subject,
      },
    },
  };
}

function semanticProjection(outcome) {
  return {
    stage: outcome.stage,
    status: outcome.status,
    steps: outcome.step_outcomes.map(({ evidence_refs, ...entry }) => entry),
    skills: outcome.skill_outcomes.map(({ evidence_refs, consumer_binding, ...entry }) => entry),
    spec_analyze: {
      step_slug: outcome.spec_analyze.step_slug,
      skill_id: outcome.spec_analyze.skill_id,
      result: outcome.spec_analyze.result,
    },
  };
}

describe("Codex/DSH shared bridge parity", () => {
  it("writes equivalent canonical stage fields for two host frontends", async () => {
    const state = fixture();
    const codex = await workflowHubBridgeMain(packetFor(
      state.task.identity.taskId,
      state.task.taskPath,
      "codex",
      "codex",
      "attempt-codex-parity",
    ));
    const dsh = await workflowHubBridgeMain(packetFor(
      state.task.identity.taskId,
      state.task.taskPath,
      "dsh",
      "dsh",
      "attempt-dsh-parity",
    ));
    const codexOutcome = JSON.parse(state.task.readRecord(codex.outcome_ref));
    const dshOutcome = JSON.parse(state.task.readRecord(dsh.outcome_ref));

    expect(semanticProjection(codexOutcome)).toEqual(semanticProjection(dshOutcome));
    expect(codex).toMatchObject({
      schema_version: "workflowhub-stage-agent-bridge-result.v1",
      task_id: state.task.identity.taskId,
      stage: "build-code",
      outcome_status: "incomplete",
    });
    expect(dsh).toMatchObject({
      schema_version: "workflowhub-stage-agent-bridge-result.v1",
      task_id: state.task.identity.taskId,
      stage: "build-code",
      outcome_status: "incomplete",
    });
    expect(codex.producer).toMatchObject({ host: "codex", source_family: "codex" });
    expect(dsh.producer).toMatchObject({ host: "dsh", source_family: "dsh" });
    expect(codex.outcome_ref).not.toBe(dsh.outcome_ref);
  });

  it("has no CLI-specific business-flow branch in the shared adapter", () => {
    const source = readFileSync(join(process.cwd(), "tools", "host", "workflowhub-stage-agent-bridge.mjs"), "utf8");
    expect(source).toContain("publishCurrentWorkflowHubSession");
    expect(source).not.toMatch(/\b(?:codex|dsh|claude|gemini)\b/i);
  });
});

afterAll(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});
