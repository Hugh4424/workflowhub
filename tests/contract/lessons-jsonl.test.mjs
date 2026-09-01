import { afterEach, describe, expect, it } from "vitest";
import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawn, spawnSync } from "node:child_process";

import { appendLessonObservation, mergeLessonObservation } from "../../tools/cli/append-lesson-observation.mjs";

const repoRoot = resolve(join(fileURLToPath(new URL(".", import.meta.url)), "../.."));
const scriptPath = join(repoRoot, "tools", "cli", "append-lesson-observation.mjs");
const roots = [];

function run(root, extra = []) {
  expect(existsSync(scriptPath), `missing CLI: ${scriptPath}`).toBe(true);
  if (existsSync(root) && lstatSync(root).isDirectory()) {
    mkdirSync(join(root, "Projects", "Demo", "tasks", "task-lessons"), { recursive: true });
  }
  const textOverride = extra.find((argument) => argument.startsWith("--text="));
  const rest = extra.filter((argument) => !argument.startsWith("--text="));
  return spawnSync(process.execPath, [
    scriptPath,
    `--root=${root}`,
    "--proj=Demo",
    "--stage=build-code",
    "--task-id=task-lessons",
    textOverride ?? "--text=观察原文：阶段失败后仍保留事实。",
    "--reflection-ref=quality/stage-reflection/build-code.json",
    ...rest,
  ], { cwd: repoRoot, encoding: "utf8", stdio: "pipe" });
}

function runMerge(root, taskId, rawEntryId, now) {
  const moduleRef = new URL("../../tools/cli/append-lesson-observation.mjs", import.meta.url).href;
  const script = `import { mergeLessonObservation } from ${JSON.stringify(moduleRef)};
const result = mergeLessonObservation({ root: process.argv[1], proj: "Demo", stage: "build-code", taskId: process.argv[2], rawEntryId: process.argv[3], lesson: "并发合并也必须保留全部来源", severity: "medium", now: process.argv[4] });
console.log(JSON.stringify(result));`;
  const child = spawn(process.execPath, ["--input-type=module", "-e", script, root, taskId, rawEntryId, now], { cwd: repoRoot, encoding: "utf8" });
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

function runAppendObservation(root, taskId, rawEntryId, now) {
  const moduleRef = new URL("../../tools/cli/append-lesson-observation.mjs", import.meta.url).href;
  const script = `import { appendLessonObservation } from ${JSON.stringify(moduleRef)};
const result = appendLessonObservation({ root: process.argv[1], proj: "Demo", stage: "build-code", taskId: process.argv[2], text: "并发合并也必须保留全部来源", reflectionRef: "quality/stage-reflection/build-code.json", now: process.argv[4], entryId: process.argv[3] });
console.log(JSON.stringify(result));`;
  const child = spawn(process.execPath, ["--input-type=module", "-e", script, root, taskId, rawEntryId, now], { cwd: repoRoot, encoding: "utf8" });
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("lessons JSONL lifecycle", () => {
  it("appends raw_observation rows without dropping previous rows", () => {
    const root = mkdtempSync(join(tmpdir(), "stage-reflection-lessons-"));
    roots.push(root);
    const first = run(root);
    expect(first.status, first.stderr).toBe(0);
    const second = run(root, ["--text=第二条观察"]);
    expect(second.status, second.stderr).toBe(0);
    const path = join(root, "Projects", "Demo", "lessons", "build-code.jsonl");
    const rows = readFileSync(path, "utf8").trim().split("\n").map((line) => JSON.parse(line));
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.entry_kind === "raw_observation" && row.merged === false)).toBe(true);
    expect(rows.every((row) => row.task_id === "task-lessons" && row.stage === "build-code")).toBe(true);
    expect(rows.every((row) => row.reflection_ref === "quality/stage-reflection/build-code.json")).toBe(true);
  });

  it("recognizes the merged_lesson shape but the append CLI never creates one", () => {
    const merged = {
      entry_kind: "merged_lesson",
      entry_id: "merged-1",
      merged_at: "2026-08-30T00:00:00.000Z",
      stage: "build-code",
      lesson: "失败阶段也必须保留原始观察。",
      severity: "high",
      occurrence_count: 2,
      source_refs: [{ task_id: "old-task", raw_entry_id: "raw-1" }],
      supersedes: [],
    };
    expect(merged.entry_kind).toBe("merged_lesson");
    expect(merged.occurrence_count).toBeGreaterThan(0);
    expect(merged.source_refs[0]).toMatchObject({ task_id: expect.any(String), raw_entry_id: expect.any(String) });
    const root = mkdtempSync(join(tmpdir(), "stage-reflection-lessons-"));
    roots.push(root);
    const result = run(root);
    expect(result.status, result.stderr).toBe(0);
    const raw = readFileSync(join(root, "Projects", "Demo", "lessons", "build-code.jsonl"), "utf8");
    expect(raw).not.toContain("merged_lesson");
  });

  it("merges validated raw observations idempotently and preserves source refs", () => {
    const root = mkdtempSync(join(tmpdir(), "stage-reflection-lessons-"));
    roots.push(root);
    mkdirSync(join(root, "Projects", "Demo", "tasks", "task-lessons"), { recursive: true });
    mkdirSync(join(root, "Projects", "Demo", "tasks", "task-lessons-2"), { recursive: true });
    const first = appendLessonObservation({
      root,
      proj: "Demo",
      stage: "build-code",
      taskId: "task-lessons",
      text: "同一条阶段教训",
      reflectionRef: "quality/stage-reflection/build-code.json",
      now: "2026-08-31T00:00:00.000Z",
      entryId: "raw-1",
    });
    const second = appendLessonObservation({
      root,
      proj: "Demo",
      stage: "build-code",
      taskId: "task-lessons-2",
      text: "同一条阶段教训",
      reflectionRef: "quality/stage-reflection/build-code.json",
      now: "2026-08-31T00:01:00.000Z",
      entryId: "raw-2",
    });
    const firstMerge = mergeLessonObservation({
      root,
      proj: "Demo",
      stage: "build-code",
      taskId: "task-lessons",
      rawEntryId: first.entry.entry_id,
      severity: "low",
      now: "2026-08-31T00:02:00.000Z",
    });
    const secondMerge = mergeLessonObservation({
      root,
      proj: "Demo",
      stage: "build-code",
      taskId: "task-lessons-2",
      rawEntryId: second.entry.entry_id,
      severity: "high",
      now: "2026-08-31T00:03:00.000Z",
    });
    expect(secondMerge.ref).toBe(firstMerge.ref);
    const path = join(root, "Projects", "Demo", "lessons", "build-code.jsonl");
    const rows = readFileSync(path, "utf8").trim().split("\n").map((line) => JSON.parse(line));
    expect(rows.filter((row) => row.entry_kind === "raw_observation")).toEqual(expect.arrayContaining([
      expect.objectContaining({ entry_id: "raw-1", merged: true }),
      expect.objectContaining({ entry_id: "raw-2", merged: true }),
    ]));
    expect(rows.filter((row) => row.entry_kind === "merged_lesson")).toEqual([
      expect.objectContaining({
        entry_id: firstMerge.entry.entry_id,
        severity: "high",
        occurrence_count: 2,
        source_refs: [
          { task_id: "task-lessons", raw_entry_id: "raw-1" },
          { task_id: "task-lessons-2", raw_entry_id: "raw-2" },
        ],
      }),
    ]);
    expect(mergeLessonObservation({
      root,
      proj: "Demo",
      stage: "build-code",
      taskId: "task-lessons-2",
      rawEntryId: second.entry.entry_id,
      severity: "high",
    }).status).toBe("already_merged");
  });

  it("serializes concurrent merges so neither source lesson is lost", async () => {
    const root = mkdtempSync(join(tmpdir(), "stage-reflection-lessons-"));
    roots.push(root);
    mkdirSync(join(root, "Projects", "Demo", "tasks", "task-concurrent-1"), { recursive: true });
    mkdirSync(join(root, "Projects", "Demo", "tasks", "task-concurrent-2"), { recursive: true });
    appendLessonObservation({ root, proj: "Demo", stage: "build-code", taskId: "task-concurrent-1", text: "并发合并也必须保留全部来源", reflectionRef: "quality/stage-reflection/build-code.json", entryId: "raw-concurrent-1" });
    appendLessonObservation({ root, proj: "Demo", stage: "build-code", taskId: "task-concurrent-2", text: "并发合并也必须保留全部来源", reflectionRef: "quality/stage-reflection/build-code.json", entryId: "raw-concurrent-2" });

    const results = await Promise.all([
      runMerge(root, "task-concurrent-1", "raw-concurrent-1", "2026-08-31T00:04:00.000Z"),
      runMerge(root, "task-concurrent-2", "raw-concurrent-2", "2026-08-31T00:05:00.000Z"),
    ]);
    expect(results.map((result) => result.status), results.map((result) => result.stderr).join("\n")).toEqual([0, 0]);
    expect(results.map((result) => JSON.parse(result.stdout).status).sort()).toEqual(["merged", "merged"]);

    const path = join(root, "Projects", "Demo", "lessons", "build-code.jsonl");
    const rows = readFileSync(path, "utf8").trim().split("\n").map((line) => JSON.parse(line));
    expect(rows.filter((row) => row.entry_kind === "raw_observation")).toEqual(expect.arrayContaining([
      expect.objectContaining({ entry_id: "raw-concurrent-1", merged: true }),
      expect.objectContaining({ entry_id: "raw-concurrent-2", merged: true }),
    ]));
    const mergedRows = rows.filter((row) => row.entry_kind === "merged_lesson");
    expect(mergedRows).toHaveLength(1);
    expect(mergedRows[0]).toMatchObject({ occurrence_count: 2 });
    expect(mergedRows[0].source_refs).toEqual(expect.arrayContaining([
      { task_id: "task-concurrent-1", raw_entry_id: "raw-concurrent-1" },
      { task_id: "task-concurrent-2", raw_entry_id: "raw-concurrent-2" },
    ]));
  });

  it("serializes an append interleaved with merge without overwriting the new raw row", async () => {
    const root = mkdtempSync(join(tmpdir(), "stage-reflection-lessons-"));
    roots.push(root);
    mkdirSync(join(root, "Projects", "Demo", "tasks", "task-interleaved-merge"), { recursive: true });
    mkdirSync(join(root, "Projects", "Demo", "tasks", "task-interleaved-append"), { recursive: true });
    appendLessonObservation({ root, proj: "Demo", stage: "build-code", taskId: "task-interleaved-merge", text: "并发合并也必须保留全部来源", reflectionRef: "quality/stage-reflection/build-code.json", entryId: "raw-interleaved-merge" });
    const path = join(root, "Projects", "Demo", "lessons", "build-code.jsonl");
    const padding = Array.from({ length: 30000 }, (_value, index) => JSON.stringify({ entry_kind: "raw_observation", entry_id: `padding-${index}`, task_id: "task-padding", stage: "build-code", text: "padding", merged: false })).join("\n");
    writeFileSync(path, `${readFileSync(path, "utf8")}${padding}\n`, "utf8");

    const merge = runMerge(root, "task-interleaved-merge", "raw-interleaved-merge", "2026-08-31T00:06:00.000Z");
    await new Promise((resolve) => setTimeout(resolve, 2));
    const append = runAppendObservation(root, "task-interleaved-append", "raw-interleaved-append", "2026-08-31T00:07:00.000Z");
    const results = await Promise.all([merge, append]);
    expect(results.map((result) => result.status), results.map((result) => result.stderr).join("\n")).toEqual([0, 0]);

    const rows = readFileSync(path, "utf8").trim().split("\n").map((line) => JSON.parse(line));
    expect(rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ entry_id: "raw-interleaved-merge", merged: true }),
      expect.objectContaining({ entry_id: "raw-interleaved-append", merged: false, task_id: "task-interleaved-append" }),
      expect.objectContaining({ entry_kind: "merged_lesson", occurrence_count: 1, source_refs: [{ task_id: "task-interleaved-merge", raw_entry_id: "raw-interleaved-merge" }] }),
    ]));
  });

  it("returns structured failure and does not merge or rewrite existing rows", () => {
    const root = mkdtempSync(join(tmpdir(), "stage-reflection-lessons-"));
    roots.push(root);
    const lessonPath = join(root, "Projects", "Demo", "lessons", "build-code.jsonl");
    mkdirSync(join(root, "Projects", "Demo", "lessons"), { recursive: true });
    const existing = JSON.stringify({ entry_kind: "merged_lesson", entry_id: "merged-1", merged: true }) + "\n";
    writeFileSync(lessonPath, existing, "utf8");
    const invalidRoot = join(root, "not-a-directory");
    writeFileSync(invalidRoot, "file", "utf8");
    const result = run(invalidRoot);
    expect(result.status).not.toBe(0);
    expect(() => JSON.parse(result.stdout)).not.toThrow();
    expect(readFileSync(lessonPath, "utf8")).toBe(existing);
  });

  it("rejects a symlinked project ancestor before writing lessons outside storage", () => {
    const root = mkdtempSync(join(tmpdir(), "stage-reflection-lessons-"));
    const outside = mkdtempSync(join(tmpdir(), "stage-reflection-lessons-outside-"));
    roots.push(root, outside);
    mkdirSync(join(root, "Projects"), { recursive: true });
    symlinkSync(outside, join(root, "Projects", "Demo"), "dir");

    expect(() => appendLessonObservation({
      root,
      proj: "Demo",
      stage: "build-code",
      taskId: "task-lessons",
      text: "不应写出 storage root。",
      reflectionRef: "quality/stage-reflection/build-code.json",
    })).toThrow(/must be a directory/);
    expect(existsSync(join(outside, "lessons"))).toBe(false);
  });

  it("rejects an unknown task before creating a project lesson index", () => {
    const root = mkdtempSync(join(tmpdir(), "stage-reflection-lessons-"));
    roots.push(root);
    expect(() => appendLessonObservation({
      root,
      proj: "Demo",
      stage: "build-code",
      taskId: "missing-task",
      text: "不应为未知 task 留下观察。",
      reflectionRef: "quality/stage-reflection/build-code.json",
    })).toThrow(/task is unavailable/);
    expect(existsSync(join(root, "Projects", "Demo", "lessons"))).toBe(false);
  });

  it("rejects path traversal at the exported writer boundary", () => {
    const root = mkdtempSync(join(tmpdir(), "stage-reflection-lessons-"));
    roots.push(root);
    expect(() => appendLessonObservation({
      root,
      proj: "../outside",
      stage: "build-code",
      taskId: "task-lessons",
      text: "不应越出项目目录。",
      reflectionRef: "quality/stage-reflection/build-code.json",
    })).toThrow(/safe path segment/);
  });
});
