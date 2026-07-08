/**
 * FR-TASKDIR-001 / FR-WORKTREE-ENVVAR-003 test suite.
 *
 * Current priority chain:
 *   1. WORKFLOWHUB_TASK_DIR, when set and non-empty
 *   2. ~/.workflowhub/config.json task_dir
 *   3. fail-loud
 */

import { describe, it, beforeEach, afterEach } from "vitest";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const parserPath = resolve(here, "../task-dir-parser.mjs");

function runParser(env = {}) {
  const code = `import { parseTaskDir } from ${JSON.stringify(parserPath)}; process.stdout.write(parseTaskDir());`;
  const childEnv = { ...process.env };
  delete childEnv.WORKFLOWHUB_TASK_DIR;
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) {
      delete childEnv[k];
    } else {
      childEnv[k] = v;
    }
  }
  try {
    const stdout = execSync(
      `node --input-type=module -e ${JSON.stringify(code)}`,
      { env: childEnv, encoding: "utf8" }
    );
    return { exitCode: 0, stdout, stderr: "" };
  } catch (err) {
    return {
      exitCode: err.status ?? 1,
      stdout: err.stdout ?? "",
      stderr: err.stderr ?? "",
    };
  }
}

function writeConfig(home, taskDir) {
  const configDir = join(home, ".workflowhub");
  mkdirSync(configDir, { recursive: true });
  writeFileSync(join(configDir, "config.json"), JSON.stringify({ task_dir: taskDir }));
}

describe("FR-TASKDIR-001 / FR-WORKTREE-ENVVAR-003 task_dir parser", () => {
  let tmpDir;
  let fakeHome;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "task-dir-parser-test-"));
    fakeHome = join(tmpDir, "home");
    mkdirSync(fakeHome, { recursive: true });
  });

  afterEach(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("env var WORKFLOWHUB_TASK_DIR is returned as highest priority", () => {
    writeConfig(fakeHome, join(tmpDir, "config-value"));
    const result = runParser({ WORKFLOWHUB_TASK_DIR: tmpDir, HOME: fakeHome });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout, tmpDir);
  });

  it("empty WORKFLOWHUB_TASK_DIR is treated as unset and falls back to config.json", () => {
    const configTaskDir = join(tmpDir, "tasks-root");
    mkdirSync(configTaskDir, { recursive: true });
    writeConfig(fakeHome, configTaskDir);
    const result = runParser({ WORKFLOWHUB_TASK_DIR: "", HOME: fakeHome });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout, configTaskDir);
  });

  it("whitespace-only WORKFLOWHUB_TASK_DIR is treated as unset", () => {
    const configTaskDir = join(tmpDir, "tasks-root");
    mkdirSync(configTaskDir, { recursive: true });
    writeConfig(fakeHome, configTaskDir);
    const result = runParser({ WORKFLOWHUB_TASK_DIR: "   ", HOME: fakeHome });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout, configTaskDir);
  });

  it("missing both env var and config.json fails loud", () => {
    const result = runParser({ WORKFLOWHUB_TASK_DIR: undefined, HOME: fakeHome });
    assert.notEqual(result.exitCode, 0);
    assert.match(result.stderr, /WORKFLOWHUB_TASK_DIR|config\.json|task_dir|fail/i);
  });

  it("fail-loud when WORKFLOWHUB_TASK_DIR path does not exist", () => {
    const result = runParser({
      WORKFLOWHUB_TASK_DIR: "/nonexistent-task-dir-" + Date.now(),
      HOME: fakeHome,
    });
    assert.notEqual(result.exitCode, 0);
    assert.match(result.stderr, /does not exist|fail/i);
  });

  it("fail-loud when WORKFLOWHUB_TASK_DIR is a file, not a directory", () => {
    const filePath = join(tmpDir, "not-a-dir.txt");
    writeFileSync(filePath, "hello");
    const result = runParser({ WORKFLOWHUB_TASK_DIR: filePath, HOME: fakeHome });
    assert.notEqual(result.exitCode, 0);
    assert.match(result.stderr, /not a directory|fail/i);
  });

  it("parser source code does not contain Knowledge/workflowhub hardcoded path", () => {
    let count = 0;
    try {
      execSync(`grep -c "Knowledge/workflowhub" ${JSON.stringify(parserPath)}`, {
        encoding: "utf8",
      });
      count = 1;
    } catch {
      count = 0;
    }
    assert.equal(count, 0, "parser source must not contain hardcoded Knowledge/workflowhub path");
  });

  it("env var with /tasks suffix is not trimmed", () => {
    const tasksDir = join(tmpDir, "tasks");
    mkdirSync(tasksDir, { recursive: true });
    const result = runParser({ WORKFLOWHUB_TASK_DIR: tasksDir, HOME: fakeHome });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout, tasksDir);
  });
});
