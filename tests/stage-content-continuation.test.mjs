import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createTask, createTaskKernel } from "../core/task-handle.mjs";

const temporary = [];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function fixture() {
  const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-legacy-read-")));
  temporary.push(storageRoot);
  const repo = join(storageRoot, "repo");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  writeFileSync(join(repo, "README.md"), "fixture\n");
  execFileSync("git", ["add", "README.md"], { cwd: repo });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: repo });
  const task = createTask({
    storageRoot,
    manifest: {
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: "legacy-task",
      created_at: "2026-07-26T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
    },
  });
  return { repo, task, kernel: createTaskKernel(task) };
}

function installHistoricalAccepted({ repo, task }) {
  const baseline = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim();
  const attempt = {
    schema_version: "task-attempt.v2",
    task_id: "legacy-task",
    stage: "make-decision",
    attempt_id: "make-decision:attempt-0001",
    created_at: "2026-07-26T00:01:00.000Z",
    facts: { worktree_root: repo, baseline_commit: baseline },
    evidence_refs: [],
    missing_items: [],
    upstream_refs: [],
  };
  const attemptRaw = `${JSON.stringify(attempt, null, 2)}\n`;
  const accepted = {
    schema_version: "task-accepted.v2",
    task_id: "legacy-task",
    stage: "make-decision",
    attempt_ref: "attempt-0001.json",
    integrity_hash: sha256(attemptRaw),
    acceptance_mode: "human",
    human_confirmation_ref: "confirmations/make-decision/attempt-0001.json",
    accepted_at: "2026-07-26T00:02:00.000Z",
    upstream_refs: [],
  };
  const resultDir = join(task.taskPath, "results", "make-decision");
  mkdirSync(resultDir, { recursive: true });
  writeFileSync(join(resultDir, "attempt-0001.json"), attemptRaw);
  writeFileSync(join(resultDir, "accepted.json"), `${JSON.stringify(accepted, null, 2)}\n`);
  return {
    attemptPath: join(resultDir, "attempt-0001.json"),
    acceptedPath: join(resultDir, "accepted.json"),
  };
}

afterEach(() => {
  while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true });
});

describe("legacy accepted content compatibility", () => {
  it("reads an old accepted result as legacy/unknown without changing its bytes", () => {
    const state = fixture();
    const paths = installHistoricalAccepted(state);
    const before = {
      attempt: readFileSync(paths.attemptPath),
      accepted: readFileSync(paths.acceptedPath),
    };

    const view = state.kernel.readAccepted("make-decision");

    expect(view).toMatchObject({
      legacy: true,
      audit_status: "unknown",
      continuation_condition: "publish_new_attempt_with_v1_audit_carrier",
    });
    expect(readFileSync(paths.attemptPath)).toEqual(before.attempt);
    expect(readFileSync(paths.acceptedPath)).toEqual(before.accepted);
  });

  it("still rejects every new publication that omits the audit carrier and content refs", () => {
    const { repo, kernel } = fixture();
    const baseline = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim();
    expect(() => kernel.publishAttempt("make-decision", {
      facts: { worktree_root: repo, baseline_commit: baseline },
    })).toThrow(/audit carrier|content evidence/i);
  });
});

describe("append-only stage continuation", () => {
  it("binds an unaccepted historical attempt and reviews without changing their bytes", () => {
    const { repo, task, kernel } = fixture();
    const attemptRef = "results/make-decision/attempt-0001.json";
    const attempt = {
      schema_version: "task-attempt.v2",
      task_id: "legacy-task",
      stage: "make-decision",
      attempt_id: "make-decision:attempt-0001",
      created_at: "2026-07-26T00:01:00.000Z",
      facts: {
        worktree_root: repo,
        baseline_commit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim(),
      },
      evidence_refs: [],
      missing_items: [],
      upstream_refs: [],
    };
    // Historical records are installed as raw fixtures; continuation may only read them.
    const attemptRaw = `${JSON.stringify(attempt, null, 2)}\n`;
    const resultDir = join(task.taskPath, "results", "make-decision");
    mkdirSync(resultDir, { recursive: true });
    writeFileSync(join(resultDir, "attempt-0001.json"), attemptRaw);
    const reviewRef = "reviews/results/historical.json";
    const reviewRaw = "{\"legacy\":true}\n";
    mkdirSync(join(task.taskPath, "reviews", "results"), { recursive: true });
    writeFileSync(join(task.taskPath, reviewRef), reviewRaw);

    const result = kernel.createStageContinuation("make-decision", {
      reason: "replay with the current content contract",
      previous_attempt_ref: attemptRef,
      previous_review_refs: [reviewRef],
    });
    const run = kernel.startStageRun("make-decision", {
      reason: "continued replay",
      continuation_ref: result.continuation_ref,
    });

    expect(result).toMatchObject({
      continuation_ref: "results/make-decision/revisions/continuation-0001.json",
    });
    expect(run.run).toMatchObject({
      continuation_ref: result.continuation_ref,
      continuation_hash: result.continuation_hash,
    });
    expect(readFileSync(join(task.taskPath, attemptRef), "utf8")).toBe(attemptRaw);
    expect(readFileSync(join(task.taskPath, reviewRef), "utf8")).toBe(reviewRaw);
  });

  it("rejects cross-stage, path injection, and an omitted existing acceptance", () => {
    const state = fixture();
    const paths = installHistoricalAccepted(state);
    const input = {
      reason: "continued replay",
      previous_attempt_ref: "results/make-decision/attempt-0001.json",
      previous_review_refs: [],
    };
    expect(() => state.kernel.createStageContinuation("make-decision", input)).toThrow(/bind the existing accepted/i);
    expect(() => state.kernel.createStageContinuation("build-spec", input)).toThrow(/same task and stage/i);
    expect(() => state.kernel.createStageContinuation("make-decision", {
      ...input,
      previous_attempt_ref: "../attempt-0001.json",
    })).toThrow(/same task and stage/i);
    expect(readFileSync(paths.attemptPath)).toBeTruthy();
  });
});
