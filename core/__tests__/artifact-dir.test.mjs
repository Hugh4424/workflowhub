import { afterEach, describe, expect, it } from "vitest";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ArtifactDir } from "../artifact-dir.mjs";
import { createTask } from "../task-handle.mjs";

const temporaryDirs = [];

function fixture(taskId = "paperbuilder-phase-foundation", { artifactRoot = true } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-artifact-dir-")));
  temporaryDirs.push(root);
  const worktreeRoot = join(root, "PaperBuilder-worktree");
  mkdirSync(worktreeRoot, { recursive: true });
  const taskPath = join(root, "Projects", "PaperBuilder", "tasks", taskId);
  const task = createTask({
    storageRoot: root,
    taskPath,
    manifest: {
      schema_version: "1.0.0",
      project_name: "PaperBuilder",
      task_id: taskId,
      created_at: "2026-07-16T00:00:00.000Z",
      target_repo_root: worktreeRoot,
      issue_ids: [],
      inputs: {},
    },
  });
  if (artifactRoot) {
    mkdirSync(join(worktreeRoot, "specs", taskId), { recursive: true });
  }
  return { root, worktreeRoot, task };
}

afterEach(() => {
  while (temporaryDirs.length > 0) {
    rmSync(temporaryDirs.pop(), { recursive: true, force: true });
  }
});

describe("ArtifactDir", () => {
  it("cannot be constructed directly without the branded open factory", () => {
    expect(() => new ArtifactDir("/tmp/worktree", "/tmp/worktree/specs/task"))
      .toThrow(/private|factory|ArtifactDir\.open|brand/i);
  });
  it("derives worktree/specs/${manifest.task_id} without a caller task string", () => {
    const { worktreeRoot, task } = fixture();
    const artifacts = ArtifactDir.open(worktreeRoot, task);

    expect(artifacts.root).toBe(
      join(worktreeRoot, "specs", "paperbuilder-phase-foundation"),
    );
    expect(artifacts.path("spec.md")).toBe(join(artifacts.root, "spec.md"));
  });

  it("rejects a caller-supplied task identity that disagrees with the manifest", () => {
    const { worktreeRoot, task } = fixture();

    expect(() =>
      ArtifactDir.open(worktreeRoot, task, { taskId: "caller-controlled-task" }),
    ).toThrow(/task|identity|caller/i);
  });

  it("rejects a structurally similar fake TaskHandle", () => {
    const { worktreeRoot, task } = fixture();
    const fake = {
      taskPath: task.taskPath,
      identity: { ...task.identity },
      manifest: { ...task.manifest },
    };

    expect(() => ArtifactDir.open(worktreeRoot, fake)).toThrow(
      /authentic|brand|TaskHandle/i,
    );
  });

  it("open is read-only and never creates a missing specs tree", () => {
    const { worktreeRoot, task } = fixture("paperbuilder-phase-foundation", {
      artifactRoot: false,
    });
    const specsRoot = join(worktreeRoot, "specs");
    expect(existsSync(specsRoot)).toBe(false);

    const artifacts = ArtifactDir.open(worktreeRoot, task);
    expect(artifacts.root).toBe(join(specsRoot, "paperbuilder-phase-foundation"));
    expect(existsSync(specsRoot)).toBe(false);
  });

  it.each(["/absolute.md", "../escape.md", "nested/../../escape.md"])(
    "rejects unsafe relative artifact name %j",
    (relativeName) => {
      const { worktreeRoot, task } = fixture();
      const artifacts = ArtifactDir.open(worktreeRoot, task);

      expect(() => artifacts.path(relativeName)).toThrow(/absolute|relative|escape/i);
    },
  );

  it("rejects a symlink escape on read and atomic write", () => {
    const { root, worktreeRoot, task } = fixture();
    const outside = join(root, "outside");
    mkdirSync(outside);
    writeFileSync(join(outside, "secret.md"), "outside");
    const artifacts = ArtifactDir.open(worktreeRoot, task);
    mkdirSync(artifacts.root, { recursive: true });
    symlinkSync(outside, join(artifacts.root, "linked"), "dir");

    expect(() => artifacts.read("linked/secret.md")).toThrow(/symlink|escape/i);
    expect(() => artifacts.writeAtomic("linked/new.md", "bad")).toThrow(
      /symlink|escape/i,
    );
    expect(existsSync(join(outside, "new.md"))).toBe(false);
  });

  it("reads and writes only the controlled root even when cwd contains bait", () => {
    const { root, worktreeRoot, task } = fixture();
    const baitCwd = join(root, "bait-cwd");
    const baitArtifact = join(
      baitCwd,
      "specs",
      "paperbuilder-phase-foundation",
      "spec.md",
    );
    mkdirSync(join(baitArtifact, ".."), { recursive: true });
    writeFileSync(baitArtifact, "bait");
    const artifacts = ArtifactDir.open(worktreeRoot, task);
    artifacts.writeAtomic("spec.md", "canonical");

    const previousCwd = process.cwd();
    process.chdir(baitCwd);
    try {
      expect(artifacts.read("spec.md")).toBe("canonical");
      expect(readFileSync(baitArtifact, "utf8")).toBe("bait");
    } finally {
      process.chdir(previousCwd);
    }
  });

  it("revalidates the parent fd when an ancestor is swapped after precheck", () => {
    const { root, worktreeRoot, task } = fixture();
    mkdirSync(join(worktreeRoot, "specs", task.identity.taskId), { recursive: true });
    const artifacts = ArtifactDir.open(worktreeRoot, task);
    const nested = join(artifacts.root, "nested");
    const outside = join(root, "outside-after-precheck");
    mkdirSync(nested);
    mkdirSync(outside);

    expect(() =>
      artifacts.writeAtomic("nested/result.md", "bad", {
        testHooks: {
          afterParentPrecheck() {
            rmSync(nested, { recursive: true });
            symlinkSync(outside, nested, "dir");
          },
        },
      }),
    ).toThrow(/changed|symlink|nofollow|race/i);
    expect(existsSync(join(outside, "result.md"))).toBe(false);
  });

  it("blocks an ancestor swap in the verify-to-open window", () => {
    const { root, worktreeRoot, task } = fixture();
    const artifacts = ArtifactDir.open(worktreeRoot, task);
    const nested = join(artifacts.root, "verify-open");
    const outside = join(root, "outside-verify-open");
    mkdirSync(nested);
    mkdirSync(outside);

    expect(() =>
      artifacts.writeAtomic("verify-open/result.md", "bad", {
        testHooks: {
          afterVerifyBeforeOpen() {
            rmSync(nested, { recursive: true });
            symlinkSync(outside, nested, "dir");
          },
        },
      }),
    ).toThrow(/changed|symlink|nofollow|race/i);
    expect(existsSync(join(outside, "result.md"))).toBe(false);
  });

  it("invalidates ArtifactDir when the opened worktree is replaced at the same path", () => {
    const { worktreeRoot, task } = fixture();
    const artifacts = ArtifactDir.open(worktreeRoot, task);
    const original = `${worktreeRoot}-original`;
    renameSync(worktreeRoot, original);
    mkdirSync(join(worktreeRoot, "specs", task.identity.taskId), { recursive: true });
    writeFileSync(join(worktreeRoot, "specs", task.identity.taskId, "spec.md"), "replacement");

    expect(() => artifacts.path("new.md")).toThrow(/changed|replaced|stale|identity/i);
    expect(() => artifacts.read("spec.md")).toThrow(/changed|replaced|stale|identity/i);
    expect(() => artifacts.writeAtomic("new.md", "bad")).toThrow(
      /changed|replaced|stale|identity/i,
    );
    expect(existsSync(join(worktreeRoot, "specs", task.identity.taskId, "new.md"))).toBe(false);
    expect(readFileSync(join(worktreeRoot, "specs", task.identity.taskId, "spec.md"), "utf8"))
      .toBe("replacement");
  });

  it("invalidates ArtifactDir when only its artifact root is replaced", () => {
    const { worktreeRoot, task } = fixture();
    const artifacts = ArtifactDir.open(worktreeRoot, task);
    const original = `${artifacts.root}-original`;
    renameSync(artifacts.root, original);
    mkdirSync(artifacts.root);
    writeFileSync(join(artifacts.root, "spec.md"), "replacement");

    expect(() => artifacts.path("new.md")).toThrow(/changed|replaced|stale|identity/i);
    expect(() => artifacts.read("spec.md")).toThrow(/changed|replaced|stale|identity/i);
    expect(() => artifacts.writeAtomic("new.md", "bad")).toThrow(
      /changed|replaced|stale|identity/i,
    );
    expect(existsSync(join(artifacts.root, "new.md"))).toBe(false);
  });
});
