import { afterEach, describe, expect, it } from "vitest";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { spawn } from "node:child_process";
import { hostname, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createTask, openTask } from "../task-handle.mjs";

const temporaryDirs = [];
const modulePath = resolve(dirname(fileURLToPath(import.meta.url)), "../task-handle.mjs");

function manifest(overrides = {}) {
  return {
    schema_version: "1.0.0",
    task_id: "paperbuilder-phase-foundation",
    project_name: "PaperBuilder",
    created_at: "2026-07-16T00:00:00.000Z",
    target_repo_root: "/absolute/PaperBuilder",
    issue_ids: [],
    inputs: {},
    ...overrides,
  };
}

function fixture() {
  const storageRoot = realpathSync(
    mkdtempSync(join(tmpdir(), "workflowhub-task-handle-")),
  );
  temporaryDirs.push(storageRoot);
  const taskPath = join(
    storageRoot,
    "Projects",
    "PaperBuilder",
    "tasks",
    "paperbuilder-phase-foundation",
  );
  return { storageRoot, taskPath };
}

afterEach(() => {
  while (temporaryDirs.length > 0) {
    rmSync(temporaryDirs.pop(), { recursive: true, force: true });
  }
});

describe("TaskHandle", () => {
  it("enumerates only sorted regular canonical stage attempts", () => {
    const { storageRoot, taskPath } = fixture();
    const task = createTask({ storageRoot, taskPath, manifest: manifest() });
    const stageRoot = join(taskPath, "results", "build-code");
    mkdirSync(stageRoot, { recursive: true });
    writeFileSync(join(stageRoot, "attempt-0010.json"), "{}");
    writeFileSync(join(stageRoot, "attempt-0002.json"), "{}");
    writeFileSync(join(stageRoot, "accepted.json"), "{}");
    writeFileSync(join(stageRoot, "attempt-12.json"), "{}");

    expect(task.listStageAttemptRefs("build-code")).toEqual([
      "results/build-code/attempt-0002.json",
      "results/build-code/attempt-0010.json",
    ]);
    expect(task.listStageAttemptRefs("verify-code")).toEqual([]);
    expect(() => task.listStageAttemptRefs("other")).toThrow(/unsupported stage/i);
  });

  it("rejects symlinked stage attempts", () => {
    const { storageRoot, taskPath } = fixture();
    const task = createTask({ storageRoot, taskPath, manifest: manifest() });
    const stageRoot = join(taskPath, "results", "build-code");
    const outside = mkdtempSync(join(tmpdir(), "workflowhub-attempt-outside-"));
    temporaryDirs.push(outside);
    mkdirSync(stageRoot, { recursive: true });
    writeFileSync(join(outside, "attempt-0001.json"), "{}");
    symlinkSync(join(outside, "attempt-0001.json"), join(stageRoot, "attempt-0001.json"));

    expect(() => task.listStageAttemptRefs("build-code")).toThrow(/symlink|regular/i);
  });

  it("rejects attempt enumeration after the trusted task directory changes identity", () => {
    const { storageRoot, taskPath } = fixture();
    const task = createTask({ storageRoot, taskPath, manifest: manifest() });
    const original = `${taskPath}-original`;
    renameSync(taskPath, original);
    mkdirSync(taskPath);

    expect(() => task.listStageAttemptRefs("build-code")).toThrow(/identity|changed|stale/i);
  });

  it("enumerates only sorted regular canonical review results", () => {
    const { storageRoot, taskPath } = fixture();
    const task = createTask({ storageRoot, taskPath, manifest: manifest() });
    const resultsRoot = join(taskPath, "reviews", "results");
    mkdirSync(resultsRoot, { recursive: true });
    writeFileSync(join(resultsRoot, "z.json"), "{}");
    writeFileSync(join(resultsRoot, "a.json"), "{}");
    writeFileSync(join(resultsRoot, "ignored.txt"), "{}");
    expect(task.listCanonicalReviewResultRefs()).toEqual([
      "reviews/results/a.json",
      "reviews/results/z.json",
    ]);
  });

  it("enumerates external review audits without treating them as review results", () => {
    const { storageRoot, taskPath } = fixture();
    const task = createTask({ storageRoot, taskPath, manifest: manifest() });
    const auditsRoot = join(taskPath, "reviews", "resolutions");
    mkdirSync(auditsRoot, { recursive: true });
    const a = "a".repeat(64), b = "b".repeat(64);
    writeFileSync(join(auditsRoot, `${b}.json`), "{}");
    writeFileSync(join(auditsRoot, `${a}.json`), "{}");
    writeFileSync(join(auditsRoot, "ignored.txt"), "{}");
    expect(task.listCanonicalReviewResolutionRefs()).toEqual([
      `reviews/resolutions/${a}.json`,
      `reviews/resolutions/${b}.json`,
    ]);
  });

  it("enumerates only sorted regular canonical review attempts", () => {
    const { storageRoot, taskPath } = fixture();
    const task = createTask({ storageRoot, taskPath, manifest: manifest() });
    const attemptsRoot = join(taskPath, "reviews", "attempts");
    for (const id of ["z-attempt", "a-attempt"]) {
      const attemptRoot = join(attemptsRoot, id);
      mkdirSync(attemptRoot, { recursive: true });
      writeFileSync(join(attemptRoot, "attempt.json"), "{}");
    }
    writeFileSync(join(attemptsRoot, "ignored.txt"), "{}");

    expect(task.listCanonicalReviewAttemptRefs()).toEqual([
      "reviews/attempts/a-attempt/attempt.json",
      "reviews/attempts/z-attempt/attempt.json",
    ]);
  });

  it("rejects symlinked canonical review attempt directories", () => {
    const { storageRoot, taskPath } = fixture();
    const task = createTask({ storageRoot, taskPath, manifest: manifest() });
    const attemptsRoot = join(taskPath, "reviews", "attempts");
    const outside = mkdtempSync(join(tmpdir(), "workflowhub-review-attempt-outside-"));
    temporaryDirs.push(outside);
    mkdirSync(attemptsRoot, { recursive: true });
    writeFileSync(join(outside, "attempt.json"), "{}");
    symlinkSync(outside, join(attemptsRoot, "linked-attempt"));

    expect(() => task.listCanonicalReviewAttemptRefs()).toThrow(/symlink|directory/i);
  });

  it("creates task.json once and opens it only with matching path and identity", () => {
    const { storageRoot, taskPath } = fixture();
    const manifest = {
      schema_version: "1.0.0",
      task_id: "paperbuilder-phase-foundation",
      project_name: "PaperBuilder",
      created_at: "2026-07-16T00:00:00.000Z",
      target_repo_root: "/absolute/PaperBuilder",
      issue_ids: ["ZHI-138"],
      inputs: {},
    };

    const created = createTask({ storageRoot, taskPath, manifest });
    expect(created.identity).toEqual({
      projectName: "PaperBuilder",
      taskId: "paperbuilder-phase-foundation",
    });
    const persistedManifest = manifest;
    expect(JSON.parse(readFileSync(join(taskPath, "task.json"), "utf8"))).toEqual(persistedManifest);

    const opened = openTask(
      taskPath,
      "PaperBuilder",
      "paperbuilder-phase-foundation",
    );
    expect(opened.manifest).toEqual(persistedManifest);
    expect(() => createTask({ storageRoot, taskPath, manifest })).toThrow(/already exists|create-only/i);
  });

  it.each([
    ["OtherProject", "paperbuilder-phase-foundation"],
    ["PaperBuilder", "other-task"],
  ])("rejects expected identity mismatch (%s, %s)", (projectName, taskId) => {
    const { storageRoot, taskPath } = fixture();
    createTask({ storageRoot, taskPath, manifest: {
      schema_version: "1.0.0",
      task_id: "paperbuilder-phase-foundation",
      project_name: "PaperBuilder",
      created_at: "2026-07-16T00:00:00.000Z",
      target_repo_root: "/absolute/PaperBuilder",
      issue_ids: [],
      inputs: {},
    } });

    expect(() => openTask(taskPath, projectName, taskId)).toThrow(
      /identity|mismatch|does not match/i,
    );
  });

  it("rejects a manifest whose identity disagrees with its directory", () => {
    const { storageRoot, taskPath } = fixture();
    mkdirSync(taskPath, { recursive: true });
    writeFileSync(
      join(taskPath, "task.json"),
      JSON.stringify({
        schema_version: "1.0.0",
        task_id: "wrong-task",
        project_name: "PaperBuilder",
        created_at: "2026-07-16T00:00:00.000Z",
        target_repo_root: "/absolute/PaperBuilder",
        issue_ids: [],
        inputs: {},
      }),
    );

    expect(() =>
      openTask(taskPath, "PaperBuilder", "paperbuilder-phase-foundation"),
    ).toThrow(/identity|mismatch|directory/i);
  });

  it("keeps recordPath inside taskPath and ignores cwd bait", () => {
    const { storageRoot, taskPath } = fixture();
    const baitCwd = mkdtempSync(join(tmpdir(), "workflowhub-task-bait-"));
    temporaryDirs.push(baitCwd);
    mkdirSync(join(baitCwd, "tasks", "paperbuilder-phase-foundation"), {
      recursive: true,
    });
    writeFileSync(
      join(baitCwd, "tasks", "paperbuilder-phase-foundation", "journal.jsonl"),
      "bait",
    );
    createTask({ storageRoot, taskPath, manifest: {
      schema_version: "1.0.0",
      task_id: "paperbuilder-phase-foundation",
      project_name: "PaperBuilder",
      created_at: "2026-07-16T00:00:00.000Z",
      target_repo_root: "/absolute/PaperBuilder",
      issue_ids: [],
      inputs: {},
    } });

    const previousCwd = process.cwd();
    process.chdir(baitCwd);
    try {
      const task = openTask(
        taskPath,
        "PaperBuilder",
        "paperbuilder-phase-foundation",
      );
      expect(task.recordPath("journal.jsonl")).toBe(join(taskPath, "journal.jsonl"));
      expect(() => task.recordPath("..", "escape.json")).toThrow(
        /escape|relative|unsafe segment/i,
      );
      expect(() => task.recordPath("/absolute.json")).toThrow(/absolute|relative/i);
    } finally {
      process.chdir(previousCwd);
    }
  });

  it("rejects create through a symlinked parent and writes nothing outside storageRoot", () => {
    const { storageRoot, taskPath } = fixture();
    const outside = mkdtempSync(join(tmpdir(), "workflowhub-task-outside-"));
    temporaryDirs.push(outside);
    symlinkSync(outside, join(storageRoot, "Projects"), "dir");

    expect(() =>
      createTask({ storageRoot, taskPath, manifest: manifest() }),
    ).toThrow(/symlink|storage|escape|identity mismatch|real directory/i);
    expect(existsSync(join(outside, "PaperBuilder"))).toBe(false);
  });

  it("requires taskPath containment under the declared storageRoot", () => {
    const { storageRoot } = fixture();
    const outside = mkdtempSync(join(tmpdir(), "workflowhub-other-storage-"));
    temporaryDirs.push(outside);
    const outsideTaskPath = join(
      outside,
      "Projects",
      "PaperBuilder",
      "tasks",
      "paperbuilder-phase-foundation",
    );

    expect(() =>
      createTask({ storageRoot, taskPath: outsideTaskPath, manifest: manifest() }),
    ).toThrow(/storage|contain|escape/i);
    expect(existsSync(outsideTaskPath)).toBe(false);
  });

  it("rejects a task.json symlink instead of following it", () => {
    const { storageRoot, taskPath } = fixture();
    const outside = mkdtempSync(join(tmpdir(), "workflowhub-manifest-outside-"));
    temporaryDirs.push(outside);
    mkdirSync(taskPath, { recursive: true });
    const outsideManifest = join(outside, "task.json");
    writeFileSync(outsideManifest, JSON.stringify(manifest()));
    symlinkSync(outsideManifest, join(taskPath, "task.json"));

    expect(() =>
      openTask(taskPath, "PaperBuilder", "paperbuilder-phase-foundation"),
    ).toThrow(/manifest|symlink|regular file/i);
  });

  it("uses controlled record I/O and refuses an ancestor symlink", () => {
    const { storageRoot, taskPath } = fixture();
    const outside = mkdtempSync(join(tmpdir(), "workflowhub-record-outside-"));
    temporaryDirs.push(outside);
    const task = createTask({ storageRoot, taskPath, manifest: manifest() });
    symlinkSync(outside, join(taskPath, "records"), "dir");

    expect(() => task.writeRecordAtomic("records/result.json", "bad")).toThrow(
      /symlink|escape|real directory/i,
    );
    expect(() => task.readRecord("records/secret.json")).toThrow(
      /symlink|escape|real directory/i,
    );
    expect(existsSync(join(outside, "result.json"))).toBe(false);
  });

  it("keeps recordPath display-only; writers remain safe if an ancestor changes", () => {
    const { storageRoot, taskPath } = fixture();
    const outside = mkdtempSync(join(tmpdir(), "workflowhub-record-swap-"));
    temporaryDirs.push(outside);
    const task = createTask({ storageRoot, taskPath, manifest: manifest() });
    mkdirSync(join(taskPath, "records"));
    const displayed = task.recordPath("records/result.json");
    rmSync(join(taskPath, "records"), { recursive: true });
    symlinkSync(outside, join(taskPath, "records"), "dir");

    expect(displayed).toBe(join(taskPath, "records", "result.json"));
    expect(() => task.writeRecordAtomic("records/result.json", "bad")).toThrow(
      /symlink|escape|real directory/i,
    );
    expect(existsSync(join(outside, "result.json"))).toBe(false);
  });

  it("revalidates record parent fd after the deterministic precheck swap hook", () => {
    const { storageRoot, taskPath } = fixture();
    const task = createTask({ storageRoot, taskPath, manifest: manifest() });
    const evidence = join(taskPath, "records");
    const outside = mkdtempSync(join(tmpdir(), "workflowhub-record-hook-swap-"));
    temporaryDirs.push(outside);
    mkdirSync(evidence);

    expect(() =>
      task.writeRecordAtomic("records/result.json", "bad", {
        testHooks: {
          afterParentPrecheck() {
            rmSync(evidence, { recursive: true });
            symlinkSync(outside, evidence, "dir");
          },
        },
      }),
    ).toThrow(/changed|symlink|nofollow|race/i);
    expect(existsSync(join(outside, "result.json"))).toBe(false);
  });

  it.each(["afterClaim", "afterTemporary", "beforeRename"])(
    "recovers after a creator is killed at %s without a permanent claim",
    async (phase) => {
      const { storageRoot } = fixture();
      const taskId = `paperbuilder-${phase.toLowerCase()}`;
      const taskPath = join(storageRoot, "Projects", "PaperBuilder", "tasks", taskId);
      const taskManifest = manifest({ task_id: taskId });
      const code = [
        `import { createTask } from ${JSON.stringify(modulePath)};`,
        `const storageRoot = ${JSON.stringify(storageRoot)};`,
        `const taskPath = ${JSON.stringify(taskPath)};`,
        `const manifest = ${JSON.stringify(taskManifest)};`,
        `const phase = ${JSON.stringify(phase)};`,
        "const testHooks = { [phase]() { process.kill(process.pid, 'SIGKILL'); } };",
        "createTask({ storageRoot, taskPath, manifest, testHooks });",
      ].join("\n");
      const killed = await new Promise((resolveResult) => {
        const child = spawn(process.execPath, ["--input-type=module", "-e", code], {
          stdio: "ignore",
        });
        child.once("exit", (status, signal) => resolveResult({ status, signal }));
      });

      expect(killed.signal).toBe("SIGKILL");
      const recovered = createTask({ storageRoot, taskPath, manifest: taskManifest });
      expect(recovered.identity.taskId).toBe(taskId);
      const parentEntries = (await import("node:fs")).readdirSync(dirname(taskPath));
      expect(parentEntries.filter((name) => name.startsWith(`.${taskId}`))).toEqual([]);
    },
  );

  it("never deletes a sibling named by a malicious stale claim temporary", () => {
    const { storageRoot, taskPath } = fixture();
    const parent = dirname(taskPath);
    mkdirSync(parent, { recursive: true });
    const sibling = join(parent, "do-not-delete");
    mkdirSync(sibling);
    writeFileSync(join(sibling, "proof.txt"), "safe");
    const claim = join(parent, ".paperbuilder-phase-foundation.create.lock");
    writeFileSync(claim, `${JSON.stringify({
      pid: 99999999,
      host: hostname(),
      started_at: "2000-01-01T00:00:00.000Z",
      temporary: "../do-not-delete",
    })}\n`);

    expect(() =>
      createTask({ storageRoot, taskPath, manifest: manifest() }),
    ).toThrow(/claim|exist|temporary|EEXIST/i);
    expect(readFileSync(join(sibling, "proof.txt"), "utf8")).toBe("safe");
  });

  it("blocks a record ancestor swap in the open-to-rename window", () => {
    const { storageRoot, taskPath } = fixture();
    const task = createTask({ storageRoot, taskPath, manifest: manifest() });
    const evidence = join(taskPath, "records");
    const parked = join(taskPath, "records-parked");
    const outside = mkdtempSync(join(tmpdir(), "workflowhub-open-rename-outside-"));
    temporaryDirs.push(outside);
    mkdirSync(evidence);

    expect(() =>
      task.writeRecordAtomic("records/result.json", "bad", {
        testHooks: {
          afterOpenBeforeRename() {
            renameSync(evidence, parked);
            symlinkSync(outside, evidence, "dir");
          },
        },
      }),
    ).toThrow(/changed|symlink|nofollow|race/i);
    expect(existsSync(join(outside, "result.json"))).toBe(false);
  });

  it("keeps the old record, cleans the temporary, and recovers after a file-fsync failure", () => {
    const { storageRoot, taskPath } = fixture();
    const task = createTask({ storageRoot, taskPath, manifest: manifest() });
    task.writeRecordAtomic("records/result.json", '{"value":"old"}\n');

    expect(() => task.writeRecordAtomic("records/result.json", '{"value":"new"}\n', {
      testHooks: { beforeFileFsync() { throw new Error("file fsync failure"); } },
    })).toThrow("file fsync failure");
    expect(task.readRecord("records/result.json")).toBe('{"value":"old"}\n');
    expect(JSON.parse(task.readRecord("records/result.json"))).toEqual({ value: "old" });
    expect(readdirSync(join(taskPath, "records")).filter((name) => /^\.[0-9a-f-]+\.tmp$/.test(name))).toEqual([]);

    task.writeRecordAtomic("records/result.json", '{"value":"recovered"}\n');
    expect(JSON.parse(task.readRecord("records/result.json"))).toEqual({ value: "recovered" });
  });

  it("leaves a complete record and recovers after a directory-fsync failure", () => {
    const { storageRoot, taskPath } = fixture();
    const task = createTask({ storageRoot, taskPath, manifest: manifest() });
    task.writeRecordAtomic("records/result.json", '{"value":"old"}\n');

    expect(() => task.writeRecordAtomic("records/result.json", '{"value":"new"}\n', {
      testHooks: { beforeDirectoryFsync() { throw new Error("directory fsync failure"); } },
    })).toThrow("directory fsync failure");
    expect(task.readRecord("records/result.json")).toBe('{"value":"new"}\n');
    expect(JSON.parse(task.readRecord("records/result.json"))).toEqual({ value: "new" });
    expect(readdirSync(join(taskPath, "records")).filter((name) => /^\.[0-9a-f-]+\.tmp$/.test(name))).toEqual([]);

    task.writeRecordAtomic("records/result.json", '{"value":"recovered"}\n');
    expect(JSON.parse(task.readRecord("records/result.json"))).toEqual({ value: "recovered" });
  });

  it("keeps the old record and recovers after a rename-preparation failure", () => {
    const { storageRoot, taskPath } = fixture();
    const task = createTask({ storageRoot, taskPath, manifest: manifest() });
    task.writeRecordAtomic("records/result.json", '{"value":"old"}\n');

    expect(() => task.writeRecordAtomic("records/result.json", '{"value":"new"}\n', {
      testHooks: { afterOpenBeforeRename() { throw new Error("rename preparation failure"); } },
    })).toThrow("rename preparation failure");
    expect(task.readRecord("records/result.json")).toBe('{"value":"old"}\n');
    expect(readdirSync(join(taskPath, "records")).filter((name) => /^\.[0-9a-f-]+\.tmp$/.test(name))).toEqual([]);

    task.writeRecordAtomic("records/result.json", '{"value":"recovered"}\n');
    expect(JSON.parse(task.readRecord("records/result.json"))).toEqual({ value: "recovered" });
  });

  it("invalidates an open TaskHandle when its task root is replaced at the same path", () => {
    const { storageRoot, taskPath } = fixture();
    const task = createTask({ storageRoot, taskPath, manifest: manifest() });
    const original = `${taskPath}-original`;
    renameSync(taskPath, original);
    mkdirSync(taskPath);
    writeFileSync(join(taskPath, "task.json"), JSON.stringify(manifest()));
    writeFileSync(join(taskPath, "bait.json"), "replacement");

    expect(() => task.recordPath("new.json")).toThrow(/changed|replaced|stale|identity/i);
    expect(() => task.readRecord("bait.json")).toThrow(/changed|replaced|stale|identity/i);
    expect(() => task.writeRecordAtomic("new.json", "bad")).toThrow(
      /changed|replaced|stale|identity/i,
    );
    expect(() => task.appendJournal({ event: "bad" })).toThrow(
      /changed|replaced|stale|identity/i,
    );
    expect(existsSync(join(taskPath, "new.json"))).toBe(false);
    expect(existsSync(join(taskPath, "journal.jsonl"))).toBe(false);
    expect(readFileSync(join(taskPath, "bait.json"), "utf8")).toBe("replacement");
  });

  it("appends journal through the controlled handle, not a public record path", () => {
    const { storageRoot, taskPath } = fixture();
    const task = createTask({ storageRoot, taskPath, manifest: manifest() });

    task.appendJournal({ event: "stage_started", stage: "build-spec" });
    task.appendJournal({ event: "stage_finished", stage: "build-spec" });

    const lines = readFileSync(join(taskPath, "journal.jsonl"), "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect(lines).toEqual([
      { event: "stage_started", stage: "build-spec" },
      { event: "stage_finished", stage: "build-spec" },
    ]);
  });

  it("honors an explicit bounded wait when another process owns a record lock", async () => {
    const { storageRoot, taskPath } = fixture();
    const task = createTask({ storageRoot, taskPath, manifest: manifest() });
    const lockRef = "locks/cross-process-wait.lock";
    const code = [
      `import { openTask } from ${JSON.stringify(modulePath)};`,
      `const task = openTask(${JSON.stringify(taskPath)}, "PaperBuilder", "paperbuilder-phase-foundation");`,
      `await task.withRecordLock(${JSON.stringify(lockRef)}, async () => {`,
      `  process.stdout.write("locked\\n");`,
      `  await new Promise((resolve) => setTimeout(resolve, 250));`,
      `});`,
    ].join("\n");
    const child = spawn(process.execPath, ["--input-type=module", "-e", code], { stdio: ["ignore", "pipe", "inherit"] });
    const exited = new Promise((resolveResult, reject) => {
      child.once("error", reject);
      child.once("exit", (status) => status === 0 ? resolveResult() : reject(new Error(`lock holder exited ${status}`)));
    });
    await new Promise((resolveStarted, reject) => {
      child.stdout.once("data", resolveStarted);
      child.once("error", reject);
      child.once("exit", (status) => reject(new Error(`lock holder exited before ready: ${status}`)));
    });

    expect(() => task.withRecordLock(lockRef, () => {}, { waitMs: 25 })).toThrow(/timed out waiting for record lock/);
    let acquired = false;
    task.withRecordLock(lockRef, () => { acquired = true; }, { waitMs: 1_000 });
    expect(acquired).toBe(true);
    await exited;
    expect(() => task.withRecordLock(lockRef, () => {}, { waitMs: -1 })).toThrow(/waitMs.*non-negative safe integer/);
  });

  it("publishes task creation atomically and leaves no orphan on serialization failure", () => {
    const { storageRoot, taskPath } = fixture();
    const invalid = manifest({ inputs: { cannotSerialize: 1n } });

    expect(() => createTask({ storageRoot, taskPath, manifest: invalid })).toThrow();
    expect(existsSync(taskPath)).toBe(false);
    expect(
      existsSync(join(dirname(taskPath), `.paperbuilder-phase-foundation.tmp`)),
    ).toBe(false);
  });

  it("allows exactly one winner when two processes create the same task", async () => {
    const { storageRoot, taskPath } = fixture();
    const taskManifest = manifest();
    const code = [
      `import { createTask } from ${JSON.stringify(modulePath)};`,
      `const storageRoot = ${JSON.stringify(storageRoot)};`,
      `const taskPath = ${JSON.stringify(taskPath)};`,
      `const manifest = ${JSON.stringify(taskManifest)};`,
      "try { createTask({ storageRoot, taskPath, manifest }); process.exit(0); }",
      "catch { process.exit(23); }",
    ].join("\n");

    const run = () =>
      new Promise((resolveResult) => {
        const child = spawn(process.execPath, ["--input-type=module", "-e", code], {
          stdio: "ignore",
        });
        child.once("exit", (status) => resolveResult(status));
      });
    const statuses = await Promise.all([run(), run()]);

    expect(statuses.sort((a, b) => a - b)).toEqual([0, 23]);
    expect(JSON.parse(readFileSync(join(taskPath, "task.json"), "utf8"))).toEqual(
      taskManifest,
    );
  });
});
