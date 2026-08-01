import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { buildRunnerRelease } from "../runtime/distribution/runner-release.mjs";
import { captureGitWorktreeSnapshot } from "../runtime/task/git-worktree-snapshot.mjs";
import { stageRuntimeCliMain } from "../scripts/stage-runtime.mjs";
import {
  assertLiveWorkspaceMatchesImplementation,
  readHistoricalPhaseResult,
  readPhaseSuccessor,
  validateAwaitingReviewSuccessorPreconditions,
  validatePhaseEvidenceInput,
} from "../workflows/build-code/phase-evidence.mjs";

const roots = [];
const packageRoot = new URL("..", import.meta.url).pathname;

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function completionTasks(complete = true) {
  const status = complete ? "completed" : "pending";
  const checkbox = complete ? "x" : " ";
  const recordValues = {
    "receipts/implementation.json": "implementation",
    "receipts/tests.json": "tests",
    "reviews/results/phase.json": "review",
  };
  const refs = JSON.stringify([
    ...Object.entries(recordValues).map(([ref, value]) => ({
      ref,
      sha256: createHash("sha256").update(value).digest("hex"),
    })),
  ]);
  const review = JSON.stringify({ ref: "reviews/results/phase.json", verdict: "pass" });
  const block = (id) => [
    `#### ${id} — sample task`,
    "",
    "- **Phase**：Phase 8：Governance",
    "",
    "##### 执行状态填写区（唯一完成权威）",
    "",
    `- [${checkbox}] **任务完成**`,
    `- **status**：\`${status}\``,
    `- **actual_changes**：${complete ? "mechanical move" : "N/A — not started"}`,
    `- **executed_commands**：${complete ? "node tools/cli/verify-structure.mjs" : "N/A — not started"}`,
    `- **evidence_refs**：${complete ? `\`${refs}\`` : "N/A — not started"}`,
    `- **covered_ac**：${complete ? "AC-13、AC-15" : "N/A — not started"}`,
    `- **review_fact**：${complete ? `\`${review}\`` : "N/A — build-code Phase review not executed"}`,
    `- **completed_at**：${complete ? "2026-08-01T00:00:00+08:00" : "N/A — not completed"}`,
    "",
  ].join("\n");
  return ["# Tasks", "", "## Phase 8：Governance", "", block("T052"), block("T053")].join("\n");
}

function seamFixture() {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-phase-seam."));
  roots.push(root);
  git(root, ["init", "-q", "-b", "main"]);
  git(root, ["config", "user.name", "WorkflowHub Tests"]);
  git(root, ["config", "user.email", "tests@workflowhub.local"]);
  mkdirSync(join(root, "specs", "demo"), { recursive: true });
  writeFileSync(join(root, "AGENTS.md"), "# Runner\n");
  writeFileSync(join(root, "specs", "demo", "plan.md"), "# Plan\n\n## Phase 8：Governance\n\nPlan.\n");
  writeFileSync(join(root, "specs", "demo", "tasks.md"), completionTasks(false));
  git(root, ["add", "."]);
  git(root, ["commit", "-qm", "baseline"]);
  const implementationCommit = git(root, ["rev-parse", "HEAD"]);
  const snapshotTree = git(root, ["rev-parse", "HEAD^{tree}"]);
  writeFileSync(join(root, "specs", "demo", "tasks.md"), completionTasks());
  const records = new Map([
    ["receipts/implementation.json", "implementation"],
    ["receipts/tests.json", "tests"],
    ["reviews/results/phase.json", "review"],
  ]);
  const task = {
    identity: { taskId: "demo" },
    readRecord(ref) {
      if (!records.has(ref)) {
        const error = new Error(`missing ${ref}`);
        error.code = "ENOENT";
        throw error;
      }
      return records.get(ref);
    },
  };
  return {
    root,
    workspace: { worktreeRoot: root },
    implementation: { value: { snapshot_tree: snapshotTree, snapshot_commit: implementationCommit } },
    snapshot: captureGitWorktreeSnapshot(root),
    task,
    currentPhase: { phase_id: "phase-8", status: "awaiting_review" },
    input: {
      phase_id: "phase-8",
      implementation_receipt_ref: "receipts/implementation.json",
      green_test_receipt_ref: "receipts/tests.json",
      review_result_ref: "reviews/results/phase.json",
    },
  };
}

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("build-code composition contract", () => {
  it("accepts a validated same-Phase tasks-only completion seam after review", () => {
    const fixture = seamFixture();
    expect(() => assertLiveWorkspaceMatchesImplementation(
      fixture.workspace,
      fixture.implementation,
      fixture.snapshot,
      fixture,
    )).not.toThrow();
  });

  it("still rejects unrelated live drift beside a tasks-only completion update", () => {
    const fixture = seamFixture();
    writeFileSync(join(fixture.root, "specs", "demo", "spec.md"), "unrelated drift\n");
    expect(() => assertLiveWorkspaceMatchesImplementation(
      fixture.workspace,
      fixture.implementation,
      captureGitWorktreeSnapshot(fixture.root),
      fixture,
    )).toThrow(/live Workspace snapshot drifted|invalid tasks-only completion seam/i);
  });

  it("routes the public Phase action to the canonical producer", async () => {
    const delegated = [];
    await expect(stageRuntimeCliMain([
      "verify",
      "--action=phase",
      "--stage=build-code",
      "--project=Demo",
      "--task=task-one",
      "--input=/tmp/phase.json",
    ], {
      delegate: async (argv) => {
        delegated.push(argv);
        return { ok: true };
      },
    })).resolves.toEqual({ ok: true });
    expect(delegated).toEqual([[
      "publish-phase-evidence",
      "--stage=build-code",
      "--project=Demo",
      "--task=task-one",
      "--input=/tmp/phase.json",
    ]]);
  });

  it("fails loudly for the deleted internal Phase command", async () => {
    await expect(stageRuntimeCliMain([
      "publish-phase-evidence",
      "--stage=build-code",
      "--project=Demo",
      "--task=task-one",
      "--input=/tmp/phase.json",
    ])).rejects.toThrow(/unknown public runtime behavior/i);
  });

  it("accepts successor plus predecessor-review binding for an awaiting-review predecessor", () => {
    const base = {
      phase_id: "phase-9", implementation_receipt_ref: "receipts/implementation.json",
      green_test_receipt_ref: "receipts/tests.json", allowed_files: [],
    };
    expect(validatePhaseEvidenceInput({ ...base, phase_successor_reason: "refresh after material revision" }))
      .toMatchObject({ phase_successor_reason: "refresh after material revision" });
    expect(validatePhaseEvidenceInput({
      ...base, phase_successor_reason: "refresh", review_result_ref: "reviews/results/current.json",
    })).toMatchObject({ phase_successor_reason: "refresh", review_result_ref: "reviews/results/current.json" });
    expect(() => validatePhaseEvidenceInput({
      ...base, phase_successor_ref: "results/build-code/revisions/phase-successor-0001.json",
    })).toThrow(/provided together/i);
  });

  it("reads the immutable predecessor archive after the live Phase pointer moves", () => {
    const predecessorRaw = `${JSON.stringify({ phase_id: "phase-9", status: "awaiting_review", snapshot_tree: "b".repeat(40) })}\n`;
    const predecessorHash = createHash("sha256").update(predecessorRaw).digest("hex");
    const archiveRef = `evidence/phase-successors/phase-9-phase-result-${predecessorHash}.json`;
    const task = {
      identity: { taskId: "archive-test" },
      readRecord: (ref) => {
        if (ref === archiveRef) return predecessorRaw;
        if (ref === "phase-result.json") return `${JSON.stringify({ phase_id: "phase-9", status: "awaiting_review", snapshot_tree: "c".repeat(40) })}\n`;
        const error = new Error(`missing ${ref}`); error.code = "ENOENT"; throw error;
      },
    };
    expect(readHistoricalPhaseResult(task, archiveRef, predecessorHash, "phase-9").value.snapshot_tree).toBe("b".repeat(40));
    expect(() => readHistoricalPhaseResult(task, archiveRef, "f".repeat(64), "phase-9")).toThrow(/archive binding|archive hash mismatch/);
  });

  it("rejects a historical archive whose phase identity is wrong", () => {
    const raw = `${JSON.stringify({ phase_id: "phase-8", status: "awaiting_review" })}\n`;
    const hash = createHash("sha256").update(raw).digest("hex");
    const ref = `evidence/phase-successors/phase-9-phase-result-${hash}.json`;
    const task = { identity: { taskId: "archive-test" }, readRecord: () => raw };
    expect(() => readHistoricalPhaseResult(task, ref, hash, "phase-9")).toThrow(/archive hash mismatch/);
  });

  it("rejects legacy successors that have no immutable predecessor archive", () => {
    const ref = "results/build-code/revisions/phase-successor-0001.json";
    const raw = `${JSON.stringify({
      schema_version: "workflowhub-build-code-phase-successor.v1",
      task_id: "archive-test", stage: "build-code", phase_id: "phase-9",
    })}\n`;
    const task = { identity: { taskId: "archive-test" }, readRecord: (candidate) => {
      if (candidate === ref) return raw;
      throw new Error(`missing ${candidate}`);
    } };
    expect(() => readPhaseSuccessor(task, ref, createHash("sha256").update(raw).digest("hex"), {
      phaseId: "phase-9",
      implementation: { ref: "receipts/implementation.json", hash: "a".repeat(64), value: { snapshot_tree: "b".repeat(40) } },
      green: { ref: "receipts/tests.json", hash: "c".repeat(64), value: { snapshot_tree: "b".repeat(40) } },
      allowedFiles: [], guardedC2Paths: [], workspace: { worktreeRoot: "/tmp" },
    })).toThrow(/binding does not match|archive/);
  });

  it("accepts a valid unavailable predecessor for an awaiting-review successor", () => {
    expect(validateAwaitingReviewSuccessorPreconditions({
      current: { status: "awaiting_review" },
      predecessorReview: { ref: "reviews/attempts/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/attempt.json", hash: "a".repeat(64), status: "unavailable", verdict: null },
      previousImplementationTree: "b".repeat(40), previousGreenTree: "b".repeat(40), previousSnapshotTree: "b".repeat(40),
      previousAllowedFiles: ["README.md"], allowedFiles: ["README.md"],
      previousGuardedC2Paths: [], guardedC2Paths: [],
    })).toBe(true);
  });

  it.each([
    ["missing predecessor review", { predecessorReview: null }, /authenticated unavailable predecessor review/],
    ["invalid predecessor review", { predecessorReview: { status: "semantic", verdict: "pass", ref: "x", hash: "a".repeat(64) } }, /authenticated unavailable predecessor review/],
    ["snapshot mismatch", { previousSnapshotTree: "c".repeat(40) }, /previous receipts do not bind/],
    ["receipt tree mismatch", { previousGreenTree: "c".repeat(40) }, /previous receipts do not bind/],
    ["allowlist mismatch", { allowedFiles: ["other.md"] }, /allowlist does not bind/],
  ])("rejects %s for an awaiting-review successor", (_label, override, message) => {
    const base = {
      current: { status: "awaiting_review" },
      predecessorReview: { ref: "reviews/attempts/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/attempt.json", hash: "a".repeat(64), status: "unavailable", verdict: null },
      previousImplementationTree: "b".repeat(40), previousGreenTree: "b".repeat(40), previousSnapshotTree: "b".repeat(40),
      previousAllowedFiles: ["README.md"], allowedFiles: ["README.md"],
      previousGuardedC2Paths: [], guardedC2Paths: [],
    };
    expect(() => validateAwaitingReviewSuccessorPreconditions({ ...base, ...override })).toThrow(message);
  });

  it("ships the canonical Phase producer and excludes task-only migration scaffolding", async () => {
    const outputDir = mkdtempSync(join(tmpdir(), "workflowhub-runner-composition."));
    roots.push(outputDir);
    const release = await buildRunnerRelease({ packageRoot, outputDir });
    const files = release.files.map((entry) => entry.path);

    expect(files).toContain("workflows/build-code/phase-evidence.mjs");
    expect(files).toContain("scripts/stage-runtime.mjs");
    expect(files).not.toContain("core/legacy-reader.mjs");
    expect(files).not.toContain("schemas/legacy-import.v1.json");
    expect(files.some((path) => path.includes("__tests__") || path.startsWith("tests/"))).toBe(false);

    const runtime = readFileSync(join(outputDir, "scripts/stage-runtime.mjs"), "utf8");
    expect(runtime).toContain('import { publishBuildCodePhaseEvidence } from "../workflows/build-code/phase-evidence.mjs"');
  });
});
