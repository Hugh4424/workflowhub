import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createStageContentEvidenceWriter } from "../runtime/evidence/stage-content-evidence.mjs";
import { createTask } from "../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../runtime/task/workspace.mjs";

const temporary = [];
const originalCwd = process.cwd();
const hostIdentityKeys = [
  "MULTICA_WORKSPACE_ID",
  "MULTICA_ISSUE_ID",
  "MULTICA_TASK_ID",
  "ISSUE_ID",
];

function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "stage-content-neutral-host-")));
  temporary.push(root);
  const repo = join(root, "target");
  const neutralCwd = join(root, "neutral-cwd");
  mkdirSync(repo);
  mkdirSync(neutralCwd);
  git(repo, ["init", "-q"]);
  git(repo, ["config", "user.name", "Test"]);
  git(repo, ["config", "user.email", "test@example.com"]);
  writeFileSync(join(repo, "README.md"), "neutral host fixture\n");
  git(repo, ["add", "README.md"]);
  git(repo, ["commit", "-qm", "fixture"]);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "Neutral",
      task_id: "portable-stage-content",
      created_at: "2026-07-27T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
    },
  });
  return { neutralCwd, task, workspace: prepareTaskWorkspace(task) };
}

function completion(nextOwner) {
  return {
    schema_version: "stage-completion-facts.v1",
    result: "completed",
    objective: "prove portable stage content publication",
    approach: "invoke the controlled writer from a neutral cwd",
    effect: "canonical evidence is created without host discovery",
    verification: { conclusion: "passed", limits: [] },
    artifacts: [],
    review: {
      conclusion: "passed",
      status: "pass",
      providers: [],
      duration_ms: null,
      tokens: null,
      findings: [],
      refs: [],
    },
    missing_items: [],
    risks: [],
    dependencies: [],
    recovery_conditions: [],
    downstream_read_rule: "read the accepted result stable content evidence fields",
    next_owner: nextOwner,
    user_action: "none",
  };
}

afterEach(() => {
  process.chdir(originalCwd);
  while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true });
});

describe("stage content contracts on a neutral host", () => {
  it("publishes make-decision, build-spec, and build-plan content outside any repository or host identity", () => {
    const state = fixture();
    const saved = Object.fromEntries(hostIdentityKeys.map((key) => [key, process.env[key]]));
    for (const key of hostIdentityKeys) delete process.env[key];
    process.chdir(state.neutralCwd);
    try {
      const stages = [
        ["make-decision", "build-spec"],
        ["build-spec", "build-plan"],
        ["build-plan", "build-code"],
      ];
      for (const [stage, nextOwner] of stages) {
        const published = createStageContentEvidenceWriter({
          task: state.task,
          workspace: state.workspace,
          stage,
          workflowRunId: `${stage}:neutral-host-run`,
          now: () => "2026-07-27T00:01:00.000Z",
        }).publish({
          kind: "stage-completion-facts.v1",
          payload: completion(nextOwner),
        });
        expect(published.value).toMatchObject({
          task_id: "portable-stage-content",
          stage,
          workflow_run_id: `${stage}:neutral-host-run`,
        });
        expect(published.ref).toMatch(/^evidence\/stage-content\/[a-f0-9]{64}\//);
      }
    } finally {
      for (const [key, value] of Object.entries(saved)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });

  it.each([
    ["root", { root: "/tmp/forged-root" }],
    ["task path", { taskPath: "/tmp/forged-task" }],
    ["cwd", { cwd: "/tmp/forged-cwd" }],
    ["repository discovery", { repository: "/tmp/forged-repository" }],
  ])("rejects caller-supplied %s instead of discovering host state", (_label, injected) => {
    const state = fixture();
    process.chdir(state.neutralCwd);
    expect(() => createStageContentEvidenceWriter({
      task: state.task,
      workspace: state.workspace,
      stage: "make-decision",
      workflowRunId: "make-decision:neutral-host-run",
      ...injected,
    })).toThrow(/caller|forbidden|unknown|root|task.?path|cwd|repository/i);
  });

  it("does not discover a task or repository from the process cwd", () => {
    const state = fixture();
    process.chdir(state.neutralCwd);
    expect(() => createStageContentEvidenceWriter({
      stage: "build-spec",
      workflowRunId: "build-spec:no-discovery",
    })).toThrow(/TaskHandle|capability/i);
  });
});
