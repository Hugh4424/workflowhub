import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { openTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { readTaskFacts } from "../../runtime/task/task-store.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { stageRuntimeCliMain, stageRuntimeMain } from "../../tools/cli/stage-runtime.mjs";
import { bootstrapTask } from "../../tools/cli/task-bootstrap.mjs";
import { canonicalStageMaterials } from "../helpers/stage-outcome.mjs";

const roots = [];
const envKeys = ["HOME", "XDG_CONFIG_HOME", "WORKFLOWHUB_TASK_DIR", "WORKFLOWHUB_CUTOVER_EPOCH", "CODEX_SESSION_ID", "CODEX_THREAD_ID", "CODEX_ROLLOUT_PATH", "WORKFLOWHUB_CODEX_ROLLOUT_PATH"];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

async function withRuntimeEnvironment(root, action) {
  const previous = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  const home = join(root, "home");
  const storage = join(root, "storage");
  mkdirSync(home, { recursive: true });
  mkdirSync(storage, { recursive: true });
  for (const key of envKeys) delete process.env[key];
  process.env.HOME = home;
  process.env.XDG_CONFIG_HOME = join(home, ".config");
  process.env.WORKFLOWHUB_TASK_DIR = storage;
  try {
    return await action({ home, storage });
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function executedJudgment({ task, workspace, kernel }) {
  const outputHash = sha256("stage-runtime-reflect-entry");
  const now = new Date("2026-09-21T00:00:00.000Z").toISOString();
  const identity = {
    task_id: task.identity.taskId,
    worktree: workspace.worktreeRoot,
    branch: git(workspace.worktreeRoot, ["symbolic-ref", "--short", "HEAD"]),
    attempt: "reflect-entry-attempt",
    snapshot_tree: kernel.currentVNextSnapshot().tree,
    material_revision: kernel.currentVNextMaterialRevision(),
  };
  return {
    schema_version: "stage-reflection.v2",
    record_kind: "judgment",
    task_id: task.identity.taskId,
    stage: "build-spec",
    stage_status: "completed",
    generated_at: now,
    status: "ok",
    error: null,
    judgments: [{
      subject_id: "public-reflect-entry",
      subject_kind: "step",
      classification: "keep",
      severity: "low",
      reason: "The authenticated public reflect route wrote the current stage row.",
      evidence_refs: [],
      confidence: "medium",
      next_review_trigger: "next build-spec execution",
    }],
    interventions: [],
    lessons_added: [],
    identity,
    ...Object.fromEntries(["what_helped", "what_to_improve", "blockers", "intervention_reasons", "what_to_simplify", "simplifiable_now"]
      .map((key) => [key, { state: "none_observed", items: [] }])),
    status_matrix: Object.fromEntries(["code", "verify", "physical_close", "acceptance", "release"]
      .map((key) => [key, { state: "not_applicable", evidence_refs: [] }])),
    source_completeness: { compaction: false, truncation: false, visible_scope: "current task fixture", unknown_reasons: [] },
    executor: {
      source_id: "workflowhub-current-session",
      attempt_id: identity.attempt,
      started_at: "2026-09-20T23:59:00.000Z",
      completed_at: now,
      output_hash: outputHash,
    },
    output_hash: outputHash,
  };
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("stage-runtime public reflect and human-boundary entries", () => {
  it("writes an executed judgment through the stage-end row transaction and keeps confirmation distinct from irreversible authorization", async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-reflect-entry-")));
    roots.push(root);
    await withRuntimeEnvironment(root, async ({ home }) => {
      const repo = join(root, "repo");
      mkdirSync(repo);
      git(repo, ["init", "-q", "-b", "main"]);
      git(repo, ["config", "user.name", "WorkflowHub Tests"]);
      git(repo, ["config", "user.email", "tests@workflowhub.local"]);
      writeFileSync(join(repo, "README.md"), "fixture\n");
      git(repo, ["add", "."]);
      git(repo, ["commit", "-qm", "baseline"]);
      const bootstrapped = bootstrapTask({ project: "WorkflowHub", task: "reflect-entry", "target-repo": repo }, { env: process.env, home, cwd: repo });
      const worktree = bootstrapped.workspace.worktree_root;
      const stages = { "decision-log.md": "make-decision", "spec.md": "build-spec", "plan.md": "build-plan", "tasks.md": "build-plan" };
      for (const [name, content] of Object.entries(canonicalStageMaterials())) {
        const path = join(root, `${name}.input`);
        writeFileSync(path, content);
        await stageRuntimeMain(["artifact", `--stage=${stages[name]}`, "--project=WorkflowHub", "--task=reflect-entry", `--name=${name}`, `--input=${path}`], { cwd: worktree });
      }
      const task = openTask(bootstrapped.task_path, "WorkflowHub", "reflect-entry");
      const workspace = openCurrentTaskWorkspace(task);
      const kernel = createTaskKernel(task, { workspace });
      const inputPath = join(root, "reflect-input.json");
      writeFileSync(inputPath, `${JSON.stringify(executedJudgment({ task, workspace, kernel }))}\n`);

      const result = await stageRuntimeCliMain([
        "run", "--action=reflect", "--stage=build-spec", "--project=WorkflowHub", "--task=reflect-entry", `--input=${inputPath}`,
      ], { cwd: worktree });

      expect(result).toMatchObject({ reflection_status: "ok", persisted: true });
      expect(result).not.toHaveProperty("stage_row_error");
      const row = readTaskFacts(task.taskPath).find((value) => value.stage === "build-spec");
      expect(row.spec_analyze.value).toMatchObject({ ref: result.ref, sha256: result.sha256, reflection_status: "ok" });
      expect(row.evidence.value).toEqual(expect.arrayContaining([
        expect.objectContaining({ command: "stage-handoff:build-spec" }),
      ]));

      await expect(stageRuntimeCliMain([
        "authorize", "--action=commit", "--stage=build-plan", "--project=WorkflowHub", "--task=reflect-entry",
        `--subject-ref=quality/confirmations/${"a".repeat(64)}.json`,
      ], { cwd: worktree })).rejects.toThrow();
      const confirmation = await stageRuntimeCliMain([
        "confirm", "--action=decision", "--stage=build-plan", "--project=WorkflowHub", "--task=reflect-entry",
        "--decision=accepted", "--attempt=fixture/build-plan", "--reply-text=Approve the current plan decision only.", "--step-slug=publish-plan-result",
      ], { cwd: worktree });
      const authorization = await stageRuntimeCliMain([
        "authorize", "--action=commit", "--stage=build-plan", "--project=WorkflowHub", "--task=reflect-entry",
        `--subject-ref=${confirmation.ref}`,
      ], { cwd: worktree });
      expect(authorization).toMatchObject({ value: { operation: "commit", subject_ref: confirmation.ref } });
    });
  });
});
