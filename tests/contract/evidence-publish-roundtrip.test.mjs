import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { publishEvidence } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { createTaskKernel } from "../../runtime/task/task-kernel.mjs";
import { writeCanonicalStageMaterials } from "../helpers/stage-outcome.mjs";
import { stageRuntimeCliMain, stageRuntimeMain } from "../../tools/cli/stage-runtime.mjs";

const temporary = [];
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const RECORDED_AT = "2026-08-30T00:00:00.000Z";

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-evidence-publish-")));
  temporary.push(root);
  const worktree = join(root, "worktree");
  mkdirSync(join(worktree, "qa-artifacts"), { recursive: true });
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: "evidence-publish",
      created_at: RECORDED_AT,
      target_repo_root: worktree,
      issue_ids: [],
      inputs: {},
    },
  });
  return { task, worktree };
}

function publish(task, worktree, sourcePath) {
  return publishEvidence({
    task,
    sourcePath,
    sourceRoot: worktree,
    evidenceType: "browser-qa",
    publisher: "build-code",
    recordedAt: RECORDED_AT,
  });
}

function git(cwd, args) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function stageRuntimeFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-evidence-runtime-")));
  temporary.push(root);
  const repo = join(root, "repo");
  const worktree = join(root, "worktree");
  const home = join(root, "home");
  mkdirSync(repo);
  mkdirSync(home);
  git(repo, ["init", "-q", "-b", "main"]);
  git(repo, ["config", "user.name", "WorkflowHub Tests"]);
  git(repo, ["config", "user.email", "tests@workflowhub.invalid"]);
  writeFileSync(join(repo, "README.md"), "base\n");
  git(repo, ["add", "README.md"]);
  git(repo, ["commit", "-qm", "base"]);
  git(repo, ["worktree", "add", "-q", "-b", "task/Demo/evidence-runtime", worktree]);
  const task = createTask({
    storageRoot: root,
    manifest: {
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: "evidence-runtime",
      created_at: RECORDED_AT,
      target_repo_root: repo,
      workspace_mode: "existing",
      workspace_root: worktree,
      issue_ids: [],
      inputs: {},
      record_model: "vnext-single-write",
    },
  });
  writeCanonicalStageMaterials(ArtifactDir.open(worktree, task));
  return { home, repo, task, worktree };
}

async function withStageRuntimeEnvironment(state, action) {
  const previous = Object.fromEntries([
    "HOME",
    "WORKFLOWHUB_TASK_DIR",
    "CODEX_SESSION_ID",
    "CODEX_THREAD_ID",
    "CODEX_ROLLOUT_PATH",
    "WORKFLOWHUB_CODEX_ROLLOUT_PATH",
  ].map((key) => [key, process.env[key]]));
  process.env.HOME = state.home;
  process.env.WORKFLOWHUB_TASK_DIR = temporary.at(-1);
  delete process.env.CODEX_SESSION_ID;
  delete process.env.CODEX_THREAD_ID;
  delete process.env.CODEX_ROLLOUT_PATH;
  delete process.env.WORKFLOWHUB_CODEX_ROLLOUT_PATH;
  try {
    return await action();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

afterEach(() => {
  while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true });
});

describe("evidence publication roundtrip", () => {
  it("copies browser screenshot and log bytes into the task-owned browser-qa namespace with self-describing publication records", () => {
    const { task, worktree } = fixture();
    const screenshot = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff]);
    const log = Buffer.from("browser started on real fixture port\\n", "utf8");
    const screenshotPath = join(worktree, "qa-artifacts", "accepted.png");
    const logPath = join(worktree, "qa-artifacts", "accepted.log");
    writeFileSync(screenshotPath, screenshot);
    writeFileSync(logPath, log);

    const screenshotRecord = publish(task, worktree, screenshotPath);
    const logRecord = publish(task, worktree, logPath);

    for (const [record, bytes, sourcePath] of [
      [screenshotRecord, screenshot, "qa-artifacts/accepted.png"],
      [logRecord, log, "qa-artifacts/accepted.log"],
    ]) {
      const expectedRef = `quality/evidence/browser-qa/${sha256(bytes)}.json`;
      expect(record).toMatchObject({
        store_ref: expectedRef,
        source_path: sourcePath,
        publisher: "build-code",
        recorded_at: RECORDED_AT,
      });
      expect(existsSync(join(task.taskPath, expectedRef))).toBe(true);
      expect(JSON.parse(task.readRecord(expectedRef))).toMatchObject({
        schema_version: "workflowhub-evidence-publication.v1",
        source_path: sourcePath,
        content_sha256: sha256(bytes),
        content_encoding: "base64",
        content_base64: bytes.toString("base64"),
        publisher: "build-code",
        recorded_at: RECORDED_AT,
      });
    }
  });

  it("deduplicates identical browser evidence even when the worktree source path changes", () => {
    const { task, worktree } = fixture();
    const bytes = Buffer.from("same browser log bytes\\n", "utf8");
    const firstPath = join(worktree, "qa-artifacts", "first.log");
    const duplicatePath = join(worktree, "qa-artifacts", "duplicate.log");
    writeFileSync(firstPath, bytes);
    writeFileSync(duplicatePath, bytes);

    const first = publish(task, worktree, firstPath);
    const duplicate = publish(task, worktree, duplicatePath);

    expect(duplicate.store_ref).toBe(first.store_ref);
    expect(duplicate.source_path).toBe("qa-artifacts/first.log");
    const stored = join(task.taskPath, "quality", "evidence", "browser-qa");
    expect(readdirSync(stored).filter((name) => name.endsWith(".json"))).toEqual([`${sha256(bytes)}.json`]);
  });

  it("rejects sources outside the declared worktree and fails loudly on an occupied immutable record", () => {
    const { task, worktree } = fixture();
    const outside = join(temporary.at(-1), "outside.log");
    writeFileSync(outside, "not in the worktree\\n");
    expect(() => publish(task, worktree, outside)).toThrow(/source.*root|source.*worktree|outside/i);

    const bytes = Buffer.from("occupied evidence bytes\\n", "utf8");
    const sourcePath = join(worktree, "qa-artifacts", "occupied.log");
    writeFileSync(sourcePath, bytes);
    const expectedRef = `quality/evidence/browser-qa/${sha256(bytes)}.json`;
    createTaskKernel(task).publishCanonicalRecord(expectedRef, "foreign immutable record\\n");

    expect(() => publish(task, worktree, sourcePath)).toThrow(/already exists with different content|publish/i);
  });

  it("captures worktree evidence through a build-code-only private route without exposing a public behavior", async () => {
    const state = stageRuntimeFixture();
    const bytes = Buffer.from("private capture from authenticated worktree\n", "utf8");
    const sourcePath = join(state.worktree, "qa-artifacts", "capture.log");
    const inputPath = join(state.worktree, "capture-evidence.json");
    mkdirSync(join(state.worktree, "qa-artifacts"), { recursive: true });
    writeFileSync(sourcePath, bytes);
    writeFileSync(inputPath, JSON.stringify({
      source_path: "qa-artifacts/capture.log",
      evidence_type: "browser-qa",
    }));

    const record = await withStageRuntimeEnvironment(state, () => stageRuntimeMain([
      "capture-evidence",
      "--stage=build-code",
      "--project=Demo",
      "--task=evidence-runtime",
      `--input=${inputPath}`,
    ], {
      cwd: state.repo,
      services: { now: () => new Date(RECORDED_AT) },
    }));

    const expectedRef = `quality/evidence/browser-qa/${sha256(bytes)}.json`;
    expect(record).toMatchObject({
      store_ref: expectedRef,
      source_path: "qa-artifacts/capture.log",
      publisher: "build-code",
      recorded_at: RECORDED_AT,
    });
    expect(JSON.parse(state.task.readRecord(expectedRef))).toMatchObject({
      content_base64: bytes.toString("base64"),
      source_path: "qa-artifacts/capture.log",
      publisher: "build-code",
    });
    await expect(stageRuntimeCliMain(["capture-evidence", "--action=execute"])).rejects.toThrow(/unknown public runtime behavior/i);
    expect((await stageRuntimeCliMain(["help"])).behaviors).not.toContain("capture-evidence");
  });
});
