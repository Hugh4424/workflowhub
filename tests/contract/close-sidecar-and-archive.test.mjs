import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  completeDeliveryClosePlan,
  confirmClosePlan,
  createDeliveryCloseExecutorRegistry,
  executeClosePlan,
  prepareDeliveryClosePlan,
  recordManualDeliveryClose,
} from "../../core/task-close.mjs";
import { assertNoCloseExecutionSidecars, captureExecutionSnapshot } from "../../runtime/task/git-worktree-snapshot.mjs";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { deriveStatusGroups } from "../../tools/cli/stage-runtime.mjs";
import { writeFormalReviewFixture } from "../helpers/formal-review.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

let counter = 0;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function writeMaterials(worktreeRoot, taskId) {
  const source = `specs/${taskId}`;
  const directory = join(worktreeRoot, source);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "decision-log.md"), "# Decision\n");
  writeFileSync(join(directory, "spec.md"), "# Spec\n\n## Acceptance Criteria\n- **AC-001**: Physical delivery remains distinct from quality.\n");
  writeFileSync(join(directory, "plan.md"), "# Plan\n");
  writeFileSync(join(directory, "tasks.md"), "# Tasks\n\n#### T001\n- **ID**: T001\n");
  return source;
}

function fixture() {
  counter += 1;
  const taskId = `p5-close-${counter}`;
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p5-close-")));
  roots.push(root);
  const repo = join(root, "repo");
  const bare = join(root, "origin.git");
  mkdirSync(repo);
  mkdirSync(bare);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub Tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.local"]);
  git(repo, ["commit", "--allow-empty", "-qm", "base"]);
  git(bare, ["init", "--bare", "-q"]);
  git(repo, ["remote", "add", "origin", bare]);
  git(repo, ["push", "-q", "origin", "main"]);

  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "WorkflowHub",
      task_id: taskId,
      created_at: "2026-08-30T00:00:00.000Z",
      target_repo_root: repo,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  const first = prepareTaskWorkspace(task);
  const source = writeMaterials(first.worktreeRoot, taskId);
  git(first.worktreeRoot, ["add", "--", source]);
  git(first.worktreeRoot, ["commit", "-qm", "task materials"]);
  const candidate = prepareTaskWorkspace(task);
  const kernel = createTaskKernel(task, { candidateWorkspace: candidate });
  const delivery = {
    remote: "origin",
    task_branch: `task/WorkflowHub/${taskId}`,
    target_branch: "main",
    task_commit: git(candidate.worktreeRoot, ["rev-parse", "HEAD"]),
    spec_source_path: source,
    spec_archive_path: `specs/archive/${taskId}`,
  };
  return { task, kernel, candidate, delivery };
}

function authorizeFixtureClose(state, confirmationRef) {
  for (const operation of ["commit", "merge", "archive", "push", "cleanup"]) {
    state.kernel.publishIrreversibleAuthorization({ operation, subject_ref: confirmationRef });
  }
}

describe("P5 close sidecar and archive contract", () => {
  it("rejects a tracked or untracked execution sidecar before close planning and tells the operator to publish it", () => {
    const state = fixture();
    const sidecar = join(state.candidate.worktreeRoot, "qa-artifacts", "screen.png");
    mkdirSync(join(state.candidate.worktreeRoot, "qa-artifacts"), { recursive: true });
    writeFileSync(sidecar, "not source\n");
    const snapshot = captureExecutionSnapshot(state.candidate.worktreeRoot, state.task.identity.taskId);

    expect(() => prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: { ...state.delivery, task_commit: snapshot.commit },
    })).toThrow(/CLOSE_EXECUTION_SIDECAR_PATHS.*qa-artifacts\/screen\.png.*publish/i);
  });

  it("allows product files at the root tasks/ directory but rejects the current task's execution sidecar subtree", () => {
    const product = fixture();
    mkdirSync(join(product.candidate.worktreeRoot, "tasks"), { recursive: true });
    writeFileSync(join(product.candidate.worktreeRoot, "tasks", "product-notes.md"), "product documentation\n");
    const productSnapshot = captureExecutionSnapshot(product.candidate.worktreeRoot, product.task.identity.taskId);

    expect(() => prepareDeliveryClosePlan({
      task: product.task,
      kernel: product.kernel,
      delivery: { ...product.delivery, task_commit: productSnapshot.commit },
    })).not.toThrow();

    const sidecar = fixture();
    const path = join(sidecar.candidate.worktreeRoot, "tasks", sidecar.task.identity.taskId, "run.json");
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, "unpublished execution state\n");

    expect(() => prepareDeliveryClosePlan({
      task: sidecar.task,
      kernel: sidecar.kernel,
      delivery: sidecar.delivery,
    })).toThrow(new RegExp(`CLOSE_EXECUTION_SIDECAR_PATHS.*tasks/${sidecar.task.identity.taskId}/run\\.json.*publish`, "i"));
  });

  it("rejects ignored and committed execution sidecars that snapshots would otherwise preserve or omit", () => {
    const ignored = fixture();
    mkdirSync(join(ignored.candidate.worktreeRoot, "quality", "tests"), { recursive: true });
    writeFileSync(join(ignored.candidate.worktreeRoot, ".gitignore"), "quality/\n");
    writeFileSync(join(ignored.candidate.worktreeRoot, "quality", "tests", "run.txt"), "unpublished\n");

    expect(() => prepareDeliveryClosePlan({
      task: ignored.task,
      kernel: ignored.kernel,
      delivery: ignored.delivery,
    })).toThrow(/CLOSE_EXECUTION_SIDECAR_PATHS.*quality\/tests\/run\.txt.*publish/i);

    const committed = fixture();
    const committedRoot = committed.candidate.worktreeRoot;
    mkdirSync(join(committedRoot, "evidence"), { recursive: true });
    writeFileSync(join(committedRoot, "evidence", "report.txt"), "unpublished\n");
    git(committedRoot, ["add", "--", "evidence/report.txt"]);
    git(committedRoot, ["commit", "-qm", "committed sidecar"]);

    expect(() => assertNoCloseExecutionSidecars(committedRoot))
      .toThrow(/CLOSE_EXECUTION_SIDECAR_PATHS.*evidence\/report\.txt.*publish/i);

    const nested = fixture();
    const nestedRoot = join(nested.candidate.worktreeRoot, "quality");
    mkdirSync(nestedRoot);
    git(nestedRoot, ["init", "-q"]);

    expect(() => prepareDeliveryClosePlan({
      task: nested.task,
      kernel: nested.kernel,
      delivery: nested.delivery,
    })).toThrow(/CLOSE_EXECUTION_SIDECAR_PATHS.*quality\/.*publish/i);
  });

  it("rechecks an excluded sidecar written after the commit preflight snapshot", async () => {
    const state = fixture();
    writeFileSync(join(state.candidate.worktreeRoot, "source-delta.txt"), "delivery source\n");
    const snapshot = captureExecutionSnapshot(state.candidate.worktreeRoot, state.task.identity.taskId);
    const prepared = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: { ...state.delivery, task_commit: snapshot.commit },
    });
    const hook = join(state.task.manifest.target_repo_root, ".git", "hooks", "reference-transaction");
    writeFileSync(hook, `#!/bin/sh\nif [ "$1" = "prepared" ]; then\n  mkdir -p "${join(state.candidate.worktreeRoot, "quality")}"\n  printf 'late sidecar\\n' > "${join(state.candidate.worktreeRoot, "quality", "late.txt")}"\nfi\n`);
    chmodSync(hook, 0o755);
    const executor = createDeliveryCloseExecutorRegistry({ task: state.task, kernel: state.kernel, plan: prepared.plan })
      .executorFor(prepared.plan.steps[0]);

    await expect(executor.execute()).rejects
      .toThrow(/CLOSE_EXECUTION_SIDECAR_PATHS.*quality\/late\.txt.*publish/i);
  });

  it("does not let cleanup delete a sidecar written after the merge", async () => {
    const state = fixture();
    const worktreeRoot = state.candidate.worktreeRoot;
    const prepared = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    const confirmation = confirmClosePlan({ task: state.task, kernel: state.kernel, plan: prepared.plan, outcome: "confirmed", replyText: "确认执行 close 物理动作", stepSlug: "verify-code" });
    authorizeFixtureClose(state, confirmation.confirmation.human_confirmation_ref);
    const hook = join(state.task.manifest.target_repo_root, ".git", "hooks", "post-merge");
    writeFileSync(hook, `#!/bin/sh\nmkdir -p "${join(worktreeRoot, "quality")}"\nprintf 'late sidecar\\n' > "${join(worktreeRoot, "quality", "post-merge.txt")}"\n`);
    chmodSync(hook, 0o755);

    await expect(executeClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      closeConfirmationRef: confirmation.ref,
      executors: createDeliveryCloseExecutorRegistry({ task: state.task, kernel: state.kernel, plan: prepared.plan }),
      now: () => "2026-08-30T00:00:00.000Z",
    })).rejects.toThrow(/CLOSE_EXECUTION_SIDECAR_PATHS.*quality\/post-merge\.txt.*publish/i);
    expect(existsSync(join(worktreeRoot, "quality", "post-merge.txt"))).toBe(true);
  });

  it("keeps missing verification and release facts as a close-plan gap list instead of a completed quality claim", () => {
    const state = fixture();
    const prepared = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });

    expect(prepared.plan.delivery).toMatchObject({ quality_status: "incomplete" });
    expect(prepared.plan.delivery.quality_gaps).toEqual(expect.arrayContaining([
      expect.stringMatching(/^verify-code:/),
      expect.stringMatching(/^product-release:/),
    ]));
    expect(prepared.plan.delivery).not.toHaveProperty("quality_status", "observed");
  });

  it("keeps an authenticated clean code-review status when checking ordinary close freshness", () => {
    const state = fixture();
    const snapshot = state.kernel.currentVNextSnapshot();
    const review = writeFormalReviewFixture({
      task: state.task,
      stage: "verify-code",
      snapshotTree: snapshot.tree,
      provider: "fixture",
      verdict: "pass",
    });
    const reviewRaw = state.task.readRecord(review.resultRef);
    state.kernel.publishVNextQualityFact("verify-code", {
      kind: "review",
      status: "recorded",
      review_status: "clean",
      subject: "code_review",
      evidence: [{ ref: review.resultRef, sha256: sha256(reviewRaw), evidence_type: "review_result" }],
    });
    state.kernel.publishHumanConfirmation("verify-code", {
      decision: "accepted",
      subject_ref: "fixture/verify-code",
      reply_text: "确认 verify-code 结果",
      step_slug: "verify-code",
    });

    const prepared = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: state.delivery,
    });

    expect(prepared.plan.delivery.quality_gaps).not.toEqual(expect.arrayContaining([
      expect.stringMatching(/^verify-code(?: freshness)?:/),
    ]));
    expect(prepared.plan.delivery.quality_status).toBe("incomplete");
  });

  it("does not bleach recorded code-review findings into ordinary close freshness", () => {
    const state = fixture();
    const snapshot = state.kernel.currentVNextSnapshot();
    const review = writeFormalReviewFixture({
      task: state.task,
      stage: "verify-code",
      snapshotTree: snapshot.tree,
      provider: "fixture",
      verdict: "fail",
      findingSeverity: "minor",
    });
    const reviewRaw = state.task.readRecord(review.resultRef);
    state.kernel.publishVNextQualityFact("verify-code", {
      kind: "review",
      status: "recorded",
      review_status: "findings",
      subject: "code_review",
      evidence: [{ ref: review.resultRef, sha256: sha256(reviewRaw), evidence_type: "review_result" }],
    });
    state.kernel.publishHumanConfirmation("verify-code", {
      decision: "accepted",
      subject_ref: "fixture/verify-code",
      reply_text: "确认 verify-code 结果",
      step_slug: "verify-code",
    });

    const prepared = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });

    expect(prepared.plan.delivery.quality_gaps).toEqual(expect.arrayContaining([
      expect.stringMatching(/^verify-code freshness: .*code_review/),
    ]));
    expect(prepared.plan.delivery.quality_status).toBe("incomplete");
  });

  it("rejects risk close without a plan-bound confirmation and records it only after all close authorizations", async () => {
    const state = fixture();
    const baseline = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    const prepared = prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        ...state.delivery,
        risk_close: {
          accepted: true,
          reason: "用户明确接受 E2E 验收尚缺失",
          deferred_items: ["e2e_acceptance"],
          quality_reasons: baseline.plan.delivery.quality_gaps,
        },
      },
    });
    const executors = createDeliveryCloseExecutorRegistry({ task: state.task, kernel: state.kernel, plan: prepared.plan });

    await expect(executeClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      executors,
    })).rejects.toThrow("risk close plans must be recorded through recordManualDeliveryClose");
    await expect(completeDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
    })).rejects.toThrow("risk close plans must be recorded through recordManualDeliveryClose");

    await expect(recordManualDeliveryClose({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      executors,
    })).rejects.toThrow("canonical plan-bound closeConfirmationRef is required");

    const confirmation = confirmClosePlan({ task: state.task, kernel: state.kernel, plan: prepared.plan, outcome: "confirmed", replyText: "确认执行风险 close", stepSlug: "verify-code" });
    await expect(recordManualDeliveryClose({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      closeConfirmationRef: confirmation.ref,
      executors,
    })).rejects.toThrow(/authorization/i);
    expect(() => state.task.readRecord("operations/close/completed.json")).toThrow();

    authorizeFixtureClose(state, confirmation.confirmation.human_confirmation_ref);
    const recorded = await recordManualDeliveryClose({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      closeConfirmationRef: confirmation.ref,
      executors,
      now: () => "2026-08-31T00:00:00.000Z",
    });

    expect(recorded).toMatchObject({ status: "delivered_with_risk", close_mode: "manual-risk-close" });
    expect(recorded.risk_close).toEqual(prepared.plan.delivery.risk_close);
    expect(recorded.physical_state).not.toHaveProperty("verify_facts_fresh");
    expect(() => state.task.readRecord("operations/close/completed.json")).toThrow();
    expect(JSON.parse(state.task.readRecord("operations/close/manual-risk-close.json"))).toMatchObject({
      schema_version: "manual-risk-close.v1",
      plan_hash: prepared.plan_hash,
      risk_close: prepared.plan.delivery.risk_close,
    });
  });

  it("rejects a risk plan with an empty concrete gap list", () => {
    const state = fixture();
    expect(() => prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        ...state.delivery,
        risk_close: {
          accepted: true,
          reason: "用户明确接受有限风险",
          deferred_items: [],
          quality_reasons: ["verify-code freshness: e2e_acceptance"],
        },
      },
    })).toThrow("delivery risk close deferred_items must be a non-empty array");
  });

  it("rejects a risk plan whose gap list does not match the current quality gaps", () => {
    const state = fixture();
    expect(() => prepareDeliveryClosePlan({
      task: state.task,
      kernel: state.kernel,
      delivery: {
        ...state.delivery,
        risk_close: {
          accepted: true,
          reason: "用户明确接受有限风险",
          deferred_items: ["e2e_acceptance"],
          quality_reasons: ["unrelated gap"],
        },
      },
    })).toThrow("delivery risk close quality_reasons must exactly match current quality_gaps");
  });

  it("adds non-blocking close preparation gaps to the existing status projection", () => {
    const groups = deriveStatusGroups({
      stage: "verify-code",
      quality: { missing: ["e2e_acceptance"], predicates: { e2e_acceptance: { fact_ref: null } } },
      productRelease: { reasons: ["acceptance_result_missing:AC-001"] },
      observations: [],
    });

    expect(groups.close_preparation_gaps).toEqual([
      "verify-code prerequisite missing: e2e_acceptance",
      "acceptance_result_missing:AC-001",
    ]);
    expect(groups).not.toHaveProperty("close_blockers");
  });

  it("runs the five physical actions in order only in an isolated fixture with explicit test authorizations", async () => {
    const state = fixture();
    const worktreeRoot = state.candidate.worktreeRoot;
    const prepared = prepareDeliveryClosePlan({ task: state.task, kernel: state.kernel, delivery: state.delivery });
    const confirmation = confirmClosePlan({ task: state.task, kernel: state.kernel, plan: prepared.plan, outcome: "confirmed", replyText: "确认执行 close 物理动作", stepSlug: "verify-code" });
    authorizeFixtureClose(state, confirmation.confirmation.human_confirmation_ref);

    await executeClosePlan({
      task: state.task,
      kernel: state.kernel,
      plan: prepared.plan,
      closeConfirmationRef: confirmation.ref,
      executors: createDeliveryCloseExecutorRegistry({ task: state.task, kernel: state.kernel, plan: prepared.plan }),
      now: () => "2026-08-30T00:00:00.000Z",
    });

    const actions = prepared.plan.steps.map((step) => JSON.parse(state.task.readRecord(
      `operations/close/plans/${prepared.plan_hash}/steps/${step.step_id}.json`,
    )).action);
    expect(actions).toEqual(["commit-delivery", "merge-task-branch", "archive-spec", "push-target-branch", "cleanup"]);
    expect(existsSync(worktreeRoot)).toBe(false);
  });

  it("publishes the new-project sidecar ignore template without changing an existing repository", async () => {
    const { readFile } = await import("node:fs/promises");
    const template = await readFile("docs/templates/project-gitignore.md", "utf8");
    const makeDecision = await readFile("workflows/make-decision/SKILL.md", "utf8");

    expect(template).toContain("quality/");
    expect(template).toContain("qa-artifacts");
    expect(template).toContain("evidence");
    expect(template).toContain("tasks/<task-id>/");
    expect(makeDecision).toContain("docs/templates/project-gitignore.md");
  });
});
