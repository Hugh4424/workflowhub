import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { recordSimpleReviewRequest, recordSimpleReviewResult } from "../../runtime/review/review-record-route.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { createSimpleReviewPacket } from "../../skills/wh-review/scripts/simple-review-runner.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "review-foreign-pair-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "Review fixture"]);
  git(["config", "user.email", "review@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "review fixture\n");
  git(["add", "."]);
  git(["commit", "-qm", "fixture"]);
  const taskId = randomUUID();
  const task = createTask({
    storageRoot: root,
    taskPath: join(root, "Projects", "workflowhub", "tasks", taskId),
    manifest: { schema_version: "1.0.0", project_name: "workflowhub", task_id: taskId,
      created_at: "2026-08-21T00:00:00.000Z", target_repo_root: repo, issue_ids: [], inputs: {},
      record_model: "vnext-single-write" },
  });
  const workspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
  const kernel = createTaskKernel(task, { candidateWorkspace: workspace, artifacts });
  return { task, kernel, artifacts };
}

function provider() {
  return { provider: "codex/luna", status: "completed",
    identity: { provider: "codex/luna", adapter: "codex", source_id: "codex/luna", config_id: "cfg", model: "gpt-5.6-luna" },
    error: null, timing: { started_at_ms: 1, completed_at_ms: 2, duration_ms: 1 }, usage: null,
    evidence_anchor_valid: [] };
}

function oldPair() {
  const role = (name, outcome) => ({
    status: "available", stage: "make-decision", review_track: "detail", review_kind: null,
    material_id: "a".repeat(64), runtime_id: "fixture-runtime", outcome,
    pair_id: "historical-pair", role: name, minimum_heterologous: 1,
    provider_selection: { providers: ["codex/luna"], provider_identities: { "codex/luna": provider().identity } },
    provider_results: [provider()], findings: [],
  });
  const red = role("red", "completed"), blue = role("blue", "partial");
  return { status: "available", stage: "make-decision", review_track: "detail", review_kind: null,
    material_id: red.material_id, runtime_id: null, outcome: "partial", pair_id: red.pair_id,
    provider_results: [...red.provider_results, ...blue.provider_results], findings: [], role_results: { red, blue } };
}

const route = () => ({ route_identity: "b".repeat(64) });
const recordRequest = (args) => recordSimpleReviewRequest({
  resolveRouteIdentity: route,
  materialIdForRequest: (input) => createSimpleReviewPacket(input).material_id,
  ...args,
});

it("ignores an old pair whose partial member is omitted under a later snapshot", async () => {
  const { task, kernel, artifacts } = fixture();
  const pair = recordSimpleReviewResult({ task, kernel, result: oldPair() });
  expect(pair.role_results.blue.result_ref).toBeNull();
  artifacts.writeAtomic("decision-log.md", "# New snapshot after the old pair\n");
  const request = { stage: "build-plan", host_provider: "codex/luna", materials: { plan: "current plan" } };
  let dispatches = 0;
  const result = await recordRequest({ task, kernel, request, runRound: async (prepared) => {
    dispatches += 1;
    return { status: "available", stage: "build-plan", review_track: null, review_kind: null,
      material_id: createSimpleReviewPacket(prepared).material_id, runtime_id: "fixture-runtime", outcome: "completed",
      provider_results: [provider()], findings: [] };
  } });
  expect(dispatches).toBe(1);
  expect(result.error?.code).not.toBe("REVIEW_HISTORY_UNAVAILABLE");
  expect(result.result_ref).toBeTruthy();
  expect(task.readRecord(pair.report_ref)).toContain("historical-pair");
});

it("fails closed when a current pair report loses a role binding", async () => {
  const { task, kernel } = fixture();
  const pair = recordSimpleReviewResult({ task, kernel, result: oldPair() });
  const report = task.readRecord(pair.report_ref);
  const damaged = report.replace(pair.role_results.blue.attempt_ref, "quality/reviews/attempts/missing/attempt.json");
  task.writeRecordAtomic(pair.report_ref, damaged);
  let dispatches = 0;
  const request = { stage: "make-decision", review_track: "detail", host_provider: "codex/luna", materials: { decision: "current decision" } };
  await expect(recordRequest({ task, kernel, request, runRound: async () => { dispatches += 1; throw new Error("must not dispatch"); } }))
    .rejects.toMatchObject({ code: "REVIEW_RECORD_INCOMPLETE" });
  expect(dispatches).toBe(0);
});
