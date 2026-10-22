import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";
import { openTask } from "../../runtime/task/task-handle.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const TASK_ID = "n10-finite-check-wiring-20261020";
const DEFAULT_TASK_ROOT = "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n10-finite-check-wiring-20261020";
const configuredTaskRoot = () => process.env.N10_TASK_ROOT ?? DEFAULT_TASK_ROOT;
const resolveTaskRoot = () => realpathSync(configuredTaskRoot());
const taskRootAtCollection = configuredTaskRoot();
const realTaskAvailableAtCollection = existsSync(taskRootAtCollection);
const CLI = join(ROOT, "tools/cli/run-checks.mjs");
const NAMES = ["原始需求", "decision-log", "调研方案", "方案", "spec", "phase", "代码实现", "测试验证", "最终审查", "提交 PR"];
const STATES = ["completed", "skipped", "not_applicable", "incomplete", "unavailable"];
const temporary = [];
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
afterEach(() => { for (const root of temporary.splice(0)) rmSync(root, { recursive: true, force: true }); });

async function run(args, scenario, taskRoot = null) {
  const env = { ...process.env }; delete env.RUN_CHECKS_FORCE_FAIL_CHECKER;
  const result = spawnSync(process.execPath, [CLI, ...args], { cwd: ROOT, env, encoding: "utf8", timeout: 30_000, maxBuffer: 8 * 1024 * 1024 });
  expect(result.error).toBeUndefined();
  expect(result.signal).toBeNull();
  const log = { scenario, argv: [process.execPath, CLI, ...args], cwd: ROOT, exit: result.status, signal: result.signal, error: result.error?.message ?? null, stdout: result.stdout, stderr: result.stderr };
  if (scenario === "N10-real-task") {
    if (!taskRoot) throw new Error("N10-real-task requires an authenticated task root");
    // TCR-1/051: preserve the captured UTF-8 stdout, never a reserialized report.
    // This directory is not the ring-8 receipt/output discovery directory.
    const dir = join(taskRoot, "quality/evidence/n10-finite-check-wiring-20261020/raw");
    mkdirSync(dir, { recursive: true });
    const bytes = Buffer.from(result.stdout, "utf8");
    let ref = readdirSync(dir).filter(name => name.endsWith("-p5-n9-real-task.json")).map(name => join(dir, name)).find(path => readFileSync(path).equals(bytes));
    if (!ref) {
      const owner = openTask(taskRoot, { projectName: "workflowhub", taskId: TASK_ID });
      ref = await owner.appendRecord({ dir: "quality/evidence/n10-finite-check-wiring-20261020/raw", slug: "p5-n9-real-task", ext: "json", bytes });
    }
    const saved = readFileSync(ref);
    expect(saved.equals(bytes)).toBe(true); expect(hash(saved)).toBe(hash(bytes));
    const project = (value, inBasis = false) => {
      if (Array.isArray(value)) return value.map(item => project(item, inBasis));
      if (!value || typeof value !== "object") return value;
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, key === "output" && inBasis && typeof item === "string"
        ? { log_projection: true, original_ref: typeof value.receipt?.output_ref === "string" ? value.receipt.output_ref : null, complete_report_original_ref: ref, bytes: Buffer.byteLength(item, "utf8"), sha256: hash(Buffer.from(item, "utf8")) }
        : project(item, inBasis || key === "basis")]));
    };
    delete log.stdout;
    log.stdout_original = { ref, bytes: bytes.length, sha256: hash(bytes), readback_equal: true, encoding: "captured UTF-8 string bytes", boundary: "complete immutable stdout; not a native receipt.output_ref or facts pointer" };
    log.report_log_projection = project(JSON.parse(result.stdout));
  }
  console.log(JSON.stringify(log));
  return result;
}

function report(result) {
  expect(result.status, result.stderr).toBe(0);
  expect(result.stderr).toBe("");
  expect(result.stdout).not.toMatch(/^\[run-checks\]/m);
  const data = JSON.parse(result.stdout);
  for (const key of ["schema_version", "task_id", "baseline_commit", "material_root", "level", "rings", "completion", "metrics", "limits", "chain_state", "workflow_steps", "workflow_metrics"]) expect(Object.hasOwn(data, key), key).toBe(true);
  for (const key of ["value", "declared", "source"]) expect(Object.hasOwn(data.level, key), key).toBe(true);
  expect(data.rings.map(row => row.ring)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  expect(data.rings.map(row => row.name)).toEqual(NAMES);
  for (const row of data.rings) {
    expect(STATES).toContain(row.state);
    expect(row.counted_in_denominator).toBe(row.state !== "not_applicable");
  }
  const applicable = data.rings.filter(row => row.counted_in_denominator).length;
  const completed = data.rings.filter(row => row.state === "completed").length;
  expect(data.completion.applicable).toBe(applicable);
  expect(data.completion.completed).toBe(completed);
  expect(data.completion.rate).toBe(completed / applicable);
  expect(data.completion.rate).toBeGreaterThanOrEqual(0);
  expect(data.completion.rate).toBeLessThanOrEqual(1);
  return data;
}

describe("ORACLE-N10-FINITE-SET T023", async () => {
  it.skipIf(!realTaskAvailableAtCollection)(
    `[AC-SET-3][AC-SET-6] real N10 task is consumed from the authenticated cwd through the public CLI${realTaskAvailableAtCollection ? "" : ` [named skip: N10_TASK_ROOT unavailable at ${taskRootAtCollection}]`}`,
    async () => {
      const taskRoot = resolveTaskRoot();
      const data = report(await run(["--task-path", taskRoot], "N10-real-task", taskRoot));
      expect(data.task_id).toBe(TASK_ID);
      expect(data.material_root).toBe(join(ROOT, "specs/n10-finite-check-wiring-20261020"));
    },
  );

  it("[AC-SET-3][AC-SET-6] the same named original-requirement ring completes, detects its missing input and restores", async () => {
    const root = mkdtempSync(join(realpathSync(tmpdir()), "n10-owned-ring-")); temporary.push(root);
    const ref = "quality/evidence/raw-requirements/n10-controlled.md";
    const file = join(root, ref);
    const bytes = Buffer.from("# N10 controlled test input\nThe named original requirement must remain readable.\n");
    mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, bytes);
    const baselineCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
    writeFileSync(join(root, "task.json"), JSON.stringify({ task_id: TASK_ID, target_repo_root: ROOT, baseline_commit: baselineCommit, inputs: { raw_requirement: { ref, sha256: hash(bytes) } } }));
    const positive = report(await run(["--task-path", root], "named-ring-positive"));
    const target = positive.rings.find(row => row.ring === 1);
    expect(target.state).toBe("completed");
    expect(target.basis.some(entry => entry.ref === ref && entry.sha256 === hash(bytes))).toBe(true);
    rmSync(file);
    const missing = report(await run(["--task-path", root], "named-ring-missing"));
    const missingTarget = missing.rings.find(row => row.ring === 1);
    expect(missingTarget.state).not.toBe("completed");
    expect(JSON.stringify(missingTarget.basis)).toMatch(/未取得|不可读|缺失/u);
    expect(missing.limits.some(line => line.includes(ref) && /ENOENT|no such file|不存在|缺失/u.test(line))).toBe(true);
    writeFileSync(file, bytes);
    expect(readFileSync(file).equals(bytes)).toBe(true);
    expect(hash(readFileSync(file))).toBe(hash(bytes));
    const restored = report(await run(["--task-path", root], "named-ring-restored"));
    expect(restored.rings.find(row => row.ring === 1).state).toBe("completed");
    console.log(JSON.stringify({ scenario: "named-ring-restoration", ref, sha256: hash(bytes), restored_same_bytes: true, cleanup: "afterEach removes only the self-created minimal task", boundary: "one controlled ring; other incomplete rings are not evidence of detection" }));
  });

  it("[AC-SET-3] missing task exits two and invalid arguments exit one without partial JSON", async () => {
    const root = mkdtempSync(join(realpathSync(tmpdir()), "n10-bad-task-")); temporary.push(root);
    const missing = join(root, "absent"); expect(existsSync(missing)).toBe(false);
    const validLookingPath = join(ROOT, "tests", "contract", "n10-n9-interface.invalid-task");
    for (const [args, status] of [[["--task-path", missing], 2], [["--task-path"], 1], [["--task-path", validLookingPath, "extra"], 1]]) {
      const result = await run(args, "bad-task-or-arguments");
      expect(result.status).toBe(status); expect(result.stdout).toBe(""); expect(result.stderr.trim()).not.toBe("");
    }
  });

  it("[AC-SET-3][AC-SET-4] no arguments retain the existing successful six-checker aggregate mode", async () => {
    const result = await run([], "no-arguments-aggregate");
    expect(result.status, result.stderr).toBe(0);
    expect((result.stdout.match(/\[run-checks\] running /gu) ?? []).length).toBe(6);
    expect(result.stdout).toContain("[run-checks] ALL CHECKS PASSED");
    expect(() => JSON.parse(result.stdout)).toThrow();
    expect(result.stderr).toBe("[run-checks] material check not run: no --material-root\n");
  });
});
