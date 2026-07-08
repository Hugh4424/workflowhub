/**
 * FR-TASKDIR-002 config.json task_dir test suite (vitest runner)
 *
 * Covers:
 * - config.json task_dir fallback when env var is unset
 * - env var priority over config.json
 * - config.json missing file → fail-loud
 * - config.json malformed JSON → fail-loud
 * - config.json missing task_dir field → fail-loud
 * - config.json empty task_dir → fail-loud
 * - config.json task_dir path does not exist → fail-loud
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

/**
 * Run parseTaskDir() in a child process with the given env.
 * Returns { exitCode, stdout, stderr }.
 */
function runParser(env = {}) {
  const code = `import { parseTaskDir } from ${JSON.stringify(parserPath)}; process.stdout.write(parseTaskDir());`;
  // Build env: start from clean process.env, unset WORKFLOWHUB_TASK_DIR, then apply overrides
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

describe("FR-TASKDIR-002 config.json task_dir parser", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "task-dir-parser-config-test-"));
  });

  afterEach(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // --- config.json fallback when env var is unset ---

  it("config.json task_dir is used when env var is unset", () => {
    const fakeHome = join(tmpDir, "fake-home");
    const configDir = join(fakeHome, ".workflowhub");
    mkdirSync(configDir, { recursive: true });
    writeFileSync(
      join(configDir, "config.json"),
      JSON.stringify({ task_dir: tmpDir })
    );
    const result = runParser({ HOME: fakeHome });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout, tmpDir);
  });

  // --- env var takes priority over config.json ---

  it("env var takes priority over config.json", () => {
    const fakeHome = join(tmpDir, "fake-home");
    const configDir = join(fakeHome, ".workflowhub");
    mkdirSync(configDir, { recursive: true });
    // Create a config dir that exists but is NOT the env var path
    const configTaskDir = mkdtempSync(join(tmpdir(), "config-task-dir-"));
    writeFileSync(
      join(configDir, "config.json"),
      JSON.stringify({ task_dir: configTaskDir })
    );
    try {
      const result = runParser({ WORKFLOWHUB_TASK_DIR: tmpDir, HOME: fakeHome });
      assert.equal(result.exitCode, 0);
      assert.equal(result.stdout, tmpDir);
    } finally {
      rmSync(configTaskDir, { recursive: true, force: true });
    }
  });

  // --- config.json missing file → fail-loud ---

  it("fail-loud when config.json file does not exist", () => {
    const fakeHome = join(tmpDir, "fake-home");
    mkdirSync(fakeHome, { recursive: true });
    // .workflowhub/ dir doesn't exist, so config.json won't be found
    const result = runParser({ HOME: fakeHome });
    assert.notEqual(result.exitCode, 0);
    assert.match(result.stderr, /WORKFLOWHUB_TASK_DIR|config|fail/i);
  });

  // --- config.json malformed JSON → fail-loud ---

  it("fail-loud when config.json is malformed JSON", () => {
    const fakeHome = join(tmpDir, "fake-home");
    const configDir = join(fakeHome, ".workflowhub");
    mkdirSync(configDir, { recursive: true });
    writeFileSync(
      join(configDir, "config.json"),
      "not json {{{"
    );
    const result = runParser({ HOME: fakeHome });
    assert.notEqual(result.exitCode, 0);
    assert.match(result.stderr, /配置有问题|config|malformed|fail/i);
  });

  // --- config.json missing task_dir field → fail-loud ---

  it("fail-loud when config.json has no task_dir field", () => {
    const fakeHome = join(tmpDir, "fake-home");
    const configDir = join(fakeHome, ".workflowhub");
    mkdirSync(configDir, { recursive: true });
    writeFileSync(
      join(configDir, "config.json"),
      JSON.stringify({ other_key: "some_value" })
    );
    const result = runParser({ HOME: fakeHome });
    assert.notEqual(result.exitCode, 0);
    assert.match(result.stderr, /WORKFLOWHUB_TASK_DIR|task_dir|config|fail/i);
  });

  // --- config.json empty task_dir → fail-loud ---

  it("fail-loud when config.json task_dir is empty string", () => {
    const fakeHome = join(tmpDir, "fake-home");
    const configDir = join(fakeHome, ".workflowhub");
    mkdirSync(configDir, { recursive: true });
    writeFileSync(
      join(configDir, "config.json"),
      JSON.stringify({ task_dir: "" })
    );
    const result = runParser({ HOME: fakeHome });
    assert.notEqual(result.exitCode, 0);
    assert.match(result.stderr, /WORKFLOWHUB_TASK_DIR|task_dir|config|fail/i);
  });

  // --- config.json task_dir path does not exist on disk → fail-loud ---

  it("fail-loud when config.json task_dir path does not exist on disk", () => {
    const fakeHome = join(tmpDir, "fake-home");
    const configDir = join(fakeHome, ".workflowhub");
    mkdirSync(configDir, { recursive: true });
    writeFileSync(
      join(configDir, "config.json"),
      JSON.stringify({ task_dir: "/nonexistent-config-task-dir-" + Date.now() })
    );
    const result = runParser({ HOME: fakeHome });
    assert.notEqual(result.exitCode, 0);
    assert.match(result.stderr, /does not exist|fail/i);
  });
});
