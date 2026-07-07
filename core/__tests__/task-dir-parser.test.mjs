/**
 * FR-TASKDIR-001 / FR-WORKTREE-ENVVAR-003 test suite (vitest runner)
 *
 * Covers:
 * - env var priority (WORKFLOWHUB_TASK_DIR > yaml task_dir > fail-loud)
 * - empty env var treated as unset
 * - yaml fallback present
 * - yaml missing / no task_dir key → fail-loud
 * - missing both → fail-loud nonzero exit
 * - relative path handling (resolved to absolute)
 * - ~ path expansion
 * - nonexistent path → fail-loud
 * - path that exists but is not a directory → fail-loud
 * - hardcoded fallback path removal (~/Knowledge/workflowhub/ NOT used)
 * - /tasks trailing-suffix trim rule
 */

import { describe, it, beforeEach, afterEach } from "vitest";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir, homedir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const parserPath = resolve(here, "../task-dir-parser.mjs");

/**
 * Run parseTaskDir() in a child process with the given env and optional configPath arg.
 * Returns { exitCode, stdout, stderr }.
 */
function runParser(env = {}, configPathArg) {
  const argExpr = configPathArg
    ? `parseTaskDir(${JSON.stringify(configPathArg)})`
    : `parseTaskDir()`;
  const code = `import { parseTaskDir } from ${JSON.stringify(parserPath)}; process.stdout.write(${argExpr});`;
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

describe("FR-TASKDIR-001 / FR-WORKTREE-ENVVAR-003 task_dir parser", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "task-dir-parser-test-"));
  });

  afterEach(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // --- env var priority ---

  it("env var WORKFLOWHUB_TASK_DIR is returned as-is (highest priority)", () => {
    const result = runParser({ WORKFLOWHUB_TASK_DIR: tmpDir });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout, tmpDir);
  });

  it("env var overrides yaml when both are set", () => {
    const yamlDir = mkdtempSync(join(tmpdir(), "task-dir-yaml-"));
    const configPath = join(tmpDir, "workflowhub.yaml");
    writeFileSync(configPath, `task_dir: ${yamlDir}\n`);
    try {
      const result = runParser({ WORKFLOWHUB_TASK_DIR: tmpDir }, configPath);
      assert.equal(result.exitCode, 0);
      assert.equal(result.stdout, tmpDir);
    } finally {
      rmSync(yamlDir, { recursive: true, force: true });
    }
  });

  // --- empty env var treated as unset ---

  it("empty WORKFLOWHUB_TASK_DIR is treated as unset, falls back to yaml", () => {
    const configPath = join(tmpDir, "workflowhub.yaml");
    const yamlRootDir = mkdtempSync(join(tmpdir(), "task-dir-yaml-empty-env-"));
    writeFileSync(configPath, `task_dir: ${yamlRootDir}\n`);
    try {
      const result = runParser({ WORKFLOWHUB_TASK_DIR: "" }, configPath);
      assert.equal(result.exitCode, 0);
      assert.equal(result.stdout, yamlRootDir);
    } finally {
      rmSync(yamlRootDir, { recursive: true, force: true });
    }
  });

  it("whitespace-only WORKFLOWHUB_TASK_DIR is treated as unset", () => {
    const configPath = join(tmpDir, "workflowhub.yaml");
    const yamlRootDir = mkdtempSync(join(tmpdir(), "task-dir-yaml-ws-env-"));
    writeFileSync(configPath, `task_dir: ${yamlRootDir}\n`);
    try {
      const result = runParser({ WORKFLOWHUB_TASK_DIR: "   " }, configPath);
      assert.equal(result.exitCode, 0);
      assert.equal(result.stdout, yamlRootDir);
    } finally {
      rmSync(yamlRootDir, { recursive: true, force: true });
    }
  });

  // --- yaml fallback present ---

  it("yaml task_dir fallback is used when env var is unset", () => {
    const configPath = join(tmpDir, "workflowhub.yaml");
    writeFileSync(configPath, `task_dir: ${tmpDir}\n`);
    const result = runParser({ WORKFLOWHUB_TASK_DIR: undefined }, configPath);
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout, tmpDir);
  });

  // --- yaml missing or no task_dir key → fail-loud ---

  it("fail-loud when yaml file does not exist and env var is unset", () => {
    const configPath = "/nonexistent/path/workflowhub.yaml";
    const result = runParser({ WORKFLOWHUB_TASK_DIR: undefined }, configPath);
    assert.notEqual(result.exitCode, 0);
    assert.match(result.stderr, /WORKFLOWHUB_TASK_DIR|task_dir|fail/i);
  });

  it("fail-loud when yaml exists but has no task_dir key", () => {
    const configPath = join(tmpDir, "workflowhub.yaml");
    writeFileSync(configPath, `other_key: some_value\n`);
    const result = runParser({ WORKFLOWHUB_TASK_DIR: undefined }, configPath);
    assert.notEqual(result.exitCode, 0);
    assert.match(result.stderr, /WORKFLOWHUB_TASK_DIR|task_dir|fail/i);
  });

  it("fail-loud when yaml task_dir key is present but value is empty", () => {
    const configPath = join(tmpDir, "workflowhub.yaml");
    writeFileSync(configPath, `task_dir: \n`);
    const result = runParser({ WORKFLOWHUB_TASK_DIR: undefined }, configPath);
    assert.notEqual(result.exitCode, 0);
  });

  // --- missing both → fail-loud nonzero exit with stderr message ---

  it("missing both env var and yaml → fail-loud with nonzero exit and stderr", () => {
    const configPath = join(tmpDir, "nonexistent.yaml");
    const result = runParser({ WORKFLOWHUB_TASK_DIR: undefined }, configPath);
    assert.notEqual(result.exitCode, 0);
    assert.ok(result.stderr.length > 0, "stderr must be non-empty");
    assert.match(result.stderr, /WORKFLOWHUB_TASK_DIR|task_dir|fail/i);
  });

  // --- relative path handling (resolved to absolute) ---

  it("WORKFLOWHUB_TASK_DIR absolute path is returned as-is (absolute)", () => {
    const result = runParser({ WORKFLOWHUB_TASK_DIR: tmpDir });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout, resolve(tmpDir));
  });

  // --- ~ path expansion ---

  it("~ in yaml task_dir is expanded to home directory", () => {
    const homeSubDir = join(homedir(), ".task-dir-parser-test-" + Date.now());
    try {
      mkdirSync(homeSubDir, { recursive: true });
      const configPath = join(tmpDir, "workflowhub.yaml");
      const relToHome = homeSubDir.replace(homedir(), "~");
      writeFileSync(configPath, `task_dir: ${relToHome}\n`);
      const result = runParser({ WORKFLOWHUB_TASK_DIR: undefined }, configPath);
      assert.equal(result.exitCode, 0);
      assert.equal(result.stdout, homeSubDir);
    } finally {
      if (existsSync(homeSubDir)) rmSync(homeSubDir, { recursive: true, force: true });
    }
  });

  // --- nonexistent path → fail-loud ---

  it("fail-loud when WORKFLOWHUB_TASK_DIR path does not exist", () => {
    const result = runParser({ WORKFLOWHUB_TASK_DIR: "/nonexistent-task-dir-" + Date.now() });
    assert.notEqual(result.exitCode, 0);
    assert.match(result.stderr, /does not exist|fail/i);
  });

  it("fail-loud when yaml task_dir path does not exist", () => {
    const configPath = join(tmpDir, "workflowhub.yaml");
    writeFileSync(configPath, `task_dir: /nonexistent-task-dir-${Date.now()}\n`);
    const result = runParser({ WORKFLOWHUB_TASK_DIR: undefined }, configPath);
    assert.notEqual(result.exitCode, 0);
    assert.match(result.stderr, /does not exist|fail/i);
  });

  // --- path exists but not a directory → fail-loud ---

  it("fail-loud when WORKFLOWHUB_TASK_DIR is a file, not a directory", () => {
    const filePath = join(tmpDir, "not-a-dir.txt");
    writeFileSync(filePath, "hello");
    const result = runParser({ WORKFLOWHUB_TASK_DIR: filePath });
    assert.notEqual(result.exitCode, 0);
    assert.match(result.stderr, /not a directory|fail/i);
  });

  it("fail-loud when yaml task_dir is a file, not a directory", () => {
    const filePath = join(tmpDir, "not-a-dir.txt");
    writeFileSync(filePath, "hello");
    const configPath = join(tmpDir, "workflowhub.yaml");
    writeFileSync(configPath, `task_dir: ${filePath}\n`);
    const result = runParser({ WORKFLOWHUB_TASK_DIR: undefined }, configPath);
    assert.notEqual(result.exitCode, 0);
    assert.match(result.stderr, /not a directory|fail/i);
  });

  // --- hardcoded fallback removal ---

  it("~/Knowledge/workflowhub/ hardcoded path is NOT used even if it exists", () => {
    const configPath = join(tmpDir, "workflowhub.yaml");
    writeFileSync(configPath, `other_key: value\n`);
    const result = runParser({ WORKFLOWHUB_TASK_DIR: undefined }, configPath);
    assert.notEqual(result.exitCode, 0);
    assert.doesNotMatch(result.stdout, /Knowledge\/workflowhub/);
  });

  it("parser source code does not contain Knowledge/workflowhub hardcoded path", () => {
    let count = 0;
    try {
      execSync(`grep -c "Knowledge/workflowhub" ${JSON.stringify(parserPath)}`, { encoding: "utf8" });
      count = 1; // grep found a match (exit 0 means matches found)
    } catch {
      count = 0; // grep exits 1 when no matches → good
    }
    assert.equal(count, 0, "parser source must not contain hardcoded Knowledge/workflowhub path");
  });

  // --- /tasks trailing-suffix trim rule ---

  it("yaml task_dir with trailing /tasks/ (with slash) is trimmed to task_tracking_root", () => {
    const configPath = join(tmpDir, "workflowhub.yaml");
    writeFileSync(configPath, `task_dir: ${tmpDir}/tasks/\n`);
    const tasksDir = join(tmpDir, "tasks");
    mkdirSync(tasksDir, { recursive: true });
    const result = runParser({ WORKFLOWHUB_TASK_DIR: undefined }, configPath);
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout, tmpDir);
  });

  it("yaml task_dir with trailing /tasks (no slash) is trimmed to task_tracking_root", () => {
    const configPath = join(tmpDir, "workflowhub.yaml");
    writeFileSync(configPath, `task_dir: ${tmpDir}/tasks\n`);
    const tasksDir = join(tmpDir, "tasks");
    mkdirSync(tasksDir, { recursive: true });
    const result = runParser({ WORKFLOWHUB_TASK_DIR: undefined }, configPath);
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout, tmpDir);
  });

  it("yaml task_dir without /tasks suffix is NOT trimmed", () => {
    const configPath = join(tmpDir, "workflowhub.yaml");
    writeFileSync(configPath, `task_dir: ${tmpDir}\n`);
    const result = runParser({ WORKFLOWHUB_TASK_DIR: undefined }, configPath);
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout, tmpDir);
  });

  it("yaml task_dir with /mytasks suffix is NOT trimmed (only exact /tasks is stripped)", () => {
    const myTasksDir = mkdtempSync(join(tmpdir(), "mytasks-test-"));
    try {
      const configPath = join(tmpDir, "workflowhub.yaml");
      writeFileSync(configPath, `task_dir: ${myTasksDir}\n`);
      const result = runParser({ WORKFLOWHUB_TASK_DIR: undefined }, configPath);
      assert.equal(result.exitCode, 0);
      assert.equal(result.stdout, myTasksDir);
    } finally {
      rmSync(myTasksDir, { recursive: true, force: true });
    }
  });

  it("env var with /tasks suffix is NOT trimmed (caller is responsible)", () => {
    const tasksDir = join(tmpDir, "tasks");
    mkdirSync(tasksDir, { recursive: true });
    const result = runParser({ WORKFLOWHUB_TASK_DIR: tasksDir });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout, tasksDir);
  });

  // --- relative task_dir must resolve against repo root, not config/ subdir ---

  it("yaml task_dir './tasks/' resolves against repo root, not the config/ subdir housing workflowhub.yaml", () => {
    // Mirrors production layout: configPath lives at <root>/config/workflowhub.yaml.
    const rootDir = tmpDir;
    const configDir = join(rootDir, "config");
    mkdirSync(configDir, { recursive: true });
    const configPath = join(configDir, "workflowhub.yaml");
    writeFileSync(configPath, `task_dir: ./tasks/\n`);
    const tasksDir = join(rootDir, "tasks");
    mkdirSync(tasksDir, { recursive: true });
    const result = runParser({ WORKFLOWHUB_TASK_DIR: undefined }, configPath);
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout, rootDir);
    assert.notEqual(result.stdout, configDir);
  });
});
