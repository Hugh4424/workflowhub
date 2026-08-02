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
  it("requires fresh current-snapshot evidence after a task completion update", () => {
    const fixture = seamFixture();
    expect(() => assertLiveWorkspaceMatchesImplementation(
      fixture.workspace,
      fixture.implementation,
      fixture.snapshot,
      fixture,
    )).toThrow(/live Workspace snapshot drifted from the implementation receipt/i);
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
