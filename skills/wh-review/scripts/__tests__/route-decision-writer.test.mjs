/**
 * Phase 1 checkpoint gate (tasks.md Stage 1 Checkpoint table).
 *
 * Covers:
 * - AC2-1: all 5 stage contract files exist under skills/wh-review/contracts/
 * - AC2-2/AC2-3: route-decision two-phase write contract (7 fields non-empty +
 *   empty review_input_hash after prepare; 8 fields non-empty after execute);
 *   unknown stage fails loud (non-zero exit)
 * - AC9-1/AC10-1: intake.md contains C1..C6 markers, test-acceptance.md contains F1..F6 markers
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const scriptPath = resolve(here, "../route-decision-writer.mjs");
const contractsDir = resolve(here, "../../contracts");

function runCli(args, env) {
  const proc = spawnSync("node", [scriptPath, ...args], {
    cwd: resolve(here, "../../../../"), // repo root
    env: { ...process.env, ...env },
  });
  return {
    exitCode: proc.status,
    stdout: proc.stdout ? proc.stdout.toString() : "",
    stderr: proc.stderr ? proc.stderr.toString() : "",
  };
}

describe("AC2-1: 5 stage contract files exist", () => {
  it("intake/design/plan/code/test-acceptance all present", () => {
    for (const name of ["intake", "design", "plan", "code", "test-acceptance"]) {
      expect(existsSync(join(contractsDir, `${name}.md`))).toBe(true);
    }
  });
});

describe("AC9-1/AC10-1: contract content coverage markers", () => {
  it("intake.md contains C1..C6", () => {
    const content = readFileSync(join(contractsDir, "intake.md"), "utf8");
    for (const n of [1, 2, 3, 4, 5, 6]) {
      expect(content).toMatch(new RegExp(`\\bC${n}\\b`));
    }
  });

  it("test-acceptance.md contains F1..F6", () => {
    const content = readFileSync(join(contractsDir, "test-acceptance.md"), "utf8");
    for (const n of [1, 2, 3, 4, 5, 6]) {
      expect(content).toMatch(new RegExp(`\\bF${n}\\b`));
    }
  });
});

describe("AC2-2/AC2-3: route-decision two-phase write", () => {
  let taskDir;

  beforeEach(() => {
    taskDir = mkdtempSync(join(tmpdir(), "wh-review-route-decision-"));
  });

  afterEach(() => {
    rmSync(taskDir, { recursive: true, force: true });
  });

  it("known stage: prepare writes 7 non-empty fields + empty review_input_hash, execute backfills to 8 fields", () => {
    const taskId = "t-known-stage";
    const stage = "build-code";
    const reviewFlowId = "flow-001";

    const prep = runCli(
      [
        "prepare",
        `--task-id=${taskId}`,
        `--stage=${stage}`,
        `--review-flow-id=${reviewFlowId}`,
        "--total-round=1",
      ],
      { WORKFLOWHUB_TASK_DIR: taskDir }
    );
    expect(prep.exitCode).toBe(0);

    const recordPath = join(
      taskDir,
      "tasks",
      taskId,
      "reviews",
      `route-decision-${stage}-${reviewFlowId}.json`
    );
    expect(existsSync(recordPath)).toBe(true);

    let record = JSON.parse(readFileSync(recordPath, "utf8"));
    for (const field of [
      "stage",
      "contract_path",
      "contract_hash",
      "timestamp",
      "input_mode",
      "review_flow_id",
      "total_round",
    ]) {
      expect(record[field]).toBeTruthy();
    }
    expect("review_input_hash" in record).toBe(true);
    expect(record.review_input_hash === "" || record.review_input_hash === null).toBe(true);

    const exec = runCli(
      [
        "execute",
        `--task-id=${taskId}`,
        `--stage=${stage}`,
        `--review-flow-id=${reviewFlowId}`,
        "--review-input-hash=abc123deadbeef",
      ],
      { WORKFLOWHUB_TASK_DIR: taskDir }
    );
    expect(exec.exitCode).toBe(0);

    record = JSON.parse(readFileSync(recordPath, "utf8"));
    for (const field of [
      "stage",
      "contract_path",
      "contract_hash",
      "timestamp",
      "input_mode",
      "review_flow_id",
      "total_round",
      "review_input_hash",
    ]) {
      expect(record[field]).toBeTruthy();
    }
  });

  it("same review_flow_id overwrites the same file, does not create a second file", () => {
    const taskId = "t-overwrite";
    const stage = "build-plan";
    const reviewFlowId = "flow-x";

    runCli(
      [
        "prepare",
        `--task-id=${taskId}`,
        `--stage=${stage}`,
        `--review-flow-id=${reviewFlowId}`,
        "--total-round=1",
      ],
      { WORKFLOWHUB_TASK_DIR: taskDir }
    );
    runCli(
      [
        "prepare",
        `--task-id=${taskId}`,
        `--stage=${stage}`,
        `--review-flow-id=${reviewFlowId}`,
        "--total-round=2",
      ],
      { WORKFLOWHUB_TASK_DIR: taskDir }
    );

    const reviewsDir = join(taskDir, "tasks", taskId, "reviews");
    const files = readdirSync(reviewsDir);
    expect(files.length).toBe(1);

    const record = JSON.parse(
      readFileSync(join(reviewsDir, files[0]), "utf8")
    );
    expect(record.total_round).toBe(2);
  });

  it("unknown stage fails loud with non-zero exit", () => {
    const result = runCli(
      [
        "prepare",
        "--task-id=t-unknown-stage",
        "--stage=not-a-real-stage",
        "--review-flow-id=flow-1",
        "--total-round=1",
      ],
      { WORKFLOWHUB_TASK_DIR: taskDir }
    );
    expect(result.exitCode).not.toBe(0);
  });

  it("unsafe task_id fails loud with non-zero exit", () => {
    const result = runCli(
      [
        "prepare",
        "--task-id=../escape",
        "--stage=build-code",
        "--review-flow-id=flow-1",
        "--total-round=1",
      ],
      { WORKFLOWHUB_TASK_DIR: taskDir }
    );
    expect(result.exitCode).not.toBe(0);
  });

  it("bare '..' task_id (no slash) fails loud with non-zero exit", () => {
    const result = runCli(
      [
        "prepare",
        "--task-id=..",
        "--stage=build-code",
        "--review-flow-id=flow-1",
        "--total-round=1",
      ],
      { WORKFLOWHUB_TASK_DIR: taskDir }
    );
    expect(result.exitCode).not.toBe(0);
  });

  it("unsafe review_flow_id (path traversal) fails loud with non-zero exit", () => {
    const result = runCli(
      [
        "prepare",
        "--task-id=t-unsafe-flow",
        "--stage=build-code",
        "--review-flow-id=../../escape-flow",
        "--total-round=1",
      ],
      { WORKFLOWHUB_TASK_DIR: taskDir }
    );
    expect(result.exitCode).not.toBe(0);
  });

  it("prepare without --total-round fails loud with non-zero exit", () => {
    const result = runCli(
      [
        "prepare",
        "--task-id=t-no-round",
        "--stage=build-code",
        "--review-flow-id=flow-1",
      ],
      { WORKFLOWHUB_TASK_DIR: taskDir }
    );
    expect(result.exitCode).not.toBe(0);
  });

  it("prepare with non-numeric --total-round fails loud with non-zero exit", () => {
    const result = runCli(
      [
        "prepare",
        "--task-id=t-bad-round",
        "--stage=build-code",
        "--review-flow-id=flow-1",
        "--total-round=abc",
      ],
      { WORKFLOWHUB_TASK_DIR: taskDir }
    );
    expect(result.exitCode).not.toBe(0);
  });

  it("execute without --review-input-hash fails loud with non-zero exit", () => {
    const taskId = "t-no-hash";
    const stage = "build-code";
    const reviewFlowId = "flow-1";
    runCli(
      [
        "prepare",
        `--task-id=${taskId}`,
        `--stage=${stage}`,
        `--review-flow-id=${reviewFlowId}`,
        "--total-round=1",
      ],
      { WORKFLOWHUB_TASK_DIR: taskDir }
    );
    const result = runCli(
      ["execute", `--task-id=${taskId}`, `--stage=${stage}`, `--review-flow-id=${reviewFlowId}`],
      { WORKFLOWHUB_TASK_DIR: taskDir }
    );
    expect(result.exitCode).not.toBe(0);
  });
});
