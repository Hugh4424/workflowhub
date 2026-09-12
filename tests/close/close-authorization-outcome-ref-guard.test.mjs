import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";

/**
 * Structural guard for the resolved-review authorization's stage outcome ref.
 * The guard must fire on its own check and never fall through to the later
 * positional slice that compares the ref basename against the hash.
 */

const roots = [];

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop(), { recursive: true, force: true });
});

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fixture(taskId) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-close-outcome-ref-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub Tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "baseline\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-qm", "baseline"]);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "WorkflowHub",
      task_id: taskId,
      created_at: "2026-09-03T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const candidate = prepareTaskWorkspace(task);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate });
  return { root, repo, task, candidate, kernel };
}

const RESOLVED_INPUT = Object.freeze({
  kind: "review",
  status: "recorded",
  review_status: "resolved",
  subject: "code_review",
  evidence: [],
});

function captureFailure(action) {
  try {
    action();
    return null;
  } catch (error) {
    return error;
  }
}

function publishWithRef(state, stageOutcomeRef, stageOutcomeHash) {
  return captureFailure(() => state.kernel.publishVNextQualityFact("verify-code", RESOLVED_INPUT, {
    resolved_review: { stage_outcome_ref: stageOutcomeRef, stage_outcome_hash: stageOutcomeHash },
  }));
}

describe("resolved-review stage outcome ref guard", () => {
  it("rejects a non-verify-code or malformed outcome ref with the structural outcome_ref error", () => {
    const state = fixture("close-outcome-ref-structural-guard");
    const hash = "a".repeat(64);

    // The first two refs use a basename hash that already equals the supplied
    // hash, so only the structural stage check can reject them; the rest are
    // malformed for the shared outcome grammar.  None of them may reach the
    // positional ref/hash comparison.
    const rejected = [
      null,
      `quality/evidence/stage-outcomes/build-code/${hash}.json`,
      "quality/evidence/stage-outcomes/verify-code/not-a-sha256.json",
      `quality/evidence/stage-outcomes/verify-code/${"A".repeat(64)}.json`,
      `quality/evidence/stage-outcomes/verify-code/${hash}.json.trailing`,
      "quality/evidence/stage-outcomes/verify-code/nested/dir.json",
    ];
    for (const ref of rejected) {
      const error = publishWithRef(state, ref, hash);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("resolved review authorization must bind a verify-code stage outcome");
      expect(error.diagnostic).toEqual({
        check_id: "outcome_ref",
        expected: "quality/evidence/stage-outcomes/verify-code/<sha256>.json with matching sha256",
        actual: { ref, hash },
      });
    }

    // A malformed hash is rejected by the same structural guard.
    const wrongHash = publishWithRef(state, `quality/evidence/stage-outcomes/verify-code/${hash}.json`, "not-a-sha256");
    expect(wrongHash).toBeInstanceOf(Error);
    expect(wrongHash.message).toBe("resolved review authorization must bind a verify-code stage outcome");
    expect(wrongHash.diagnostic).toEqual({
      check_id: "outcome_ref",
      expected: "quality/evidence/stage-outcomes/verify-code/<sha256>.json with matching sha256",
      actual: { ref: `quality/evidence/stage-outcomes/verify-code/${hash}.json`, hash: "not-a-sha256" },
    });
  });
});
