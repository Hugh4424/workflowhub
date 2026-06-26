# codex advisor artifact

- Provider: codex
- Exit code: 0
- Created at: 2026-06-26T09:04:46.470Z

## Original task

你是独立代码审查员。对 workflowhub M9 verify-code Phase 1 round 2 返修做复审。

## 上轮 blocking（已修）
B1: 'unknown' fallback → 改 throw Error / B2: stderr 丢弃 → 合并 stdout+stderr / B3: test_files_line 只看 stdout → 也搜 stderr / B4: echo 引号脆弱 → 改 printf / B5: 缺非 git 环境 throw 测试 → 新增测试 + STUB_SHA 模式

## 待审代码（全量 diff）
diff --git a/tests/verify-code-capture.test.mjs b/tests/verify-code-capture.test.mjs
new file mode 100644
index 0000000..5e75775
--- /dev/null
+++ b/tests/verify-code-capture.test.mjs
@@ -0,0 +1,139 @@
+import { describe, it, expect, beforeAll, afterAll } from 'vitest';
+import { runCapture } from '../workflows/verify-code/capture.mjs';
+import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
+import { join } from 'node:path';
+import { tmpdir } from 'node:os';
+
+const STUB_SHA = '0'.repeat(40);
+
+let tmpDir;
+
+beforeAll(() => {
+  tmpDir = mkdtempSync(join(tmpdir(), 'verify-code-capture-test-'));
+});
+
+afterAll(() => {
+  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
+});
+
+describe('runCapture', () => {
+  it('should return an object with expected keys on success', async () => {
+    const outPath = join(tmpDir, 'success.json');
+    const result = await runCapture('echo "hello"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    expect(result).toHaveProperty('exit_code');
+    expect(result).toHaveProperty('git_sha');
+    expect(result).toHaveProperty('test_files_line');
+    expect(result).toHaveProperty('content_hash');
+    expect(result).toHaveProperty('timestamp');
+    expect(result).toHaveProperty('command');
+  });
+
+  it('exit_code should be a real integer (0 for success)', async () => {
+    const outPath = join(tmpDir, 'exit-code.json');
+    const result = await runCapture('echo "ok"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    expect(typeof result.exit_code).toBe('number');
+    expect(Number.isInteger(result.exit_code)).toBe(true);
+    expect(result.exit_code).toBe(0);
+  });
+
+  it('exit_code should be non-zero for failing commands', async () => {
+    const outPath = join(tmpDir, 'fail-code.json');
+    const result = await runCapture('exit 42', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    expect(typeof result.exit_code).toBe('number');
+    expect(result.exit_code).toBe(42);
+  });
+
+  it('should write JSON to outputPath even when command fails (no throw)', async () => {
+    const outPath = join(tmpDir, 'no-throw.json');
+    await runCapture('exit 1', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    const raw = readFileSync(outPath, 'utf-8');
+    const parsed = JSON.parse(raw);
+    expect(parsed.exit_code).toBe(1);
+    expect(parsed.command).toBe('exit 1');
+  });
+
+  it('should create outputPath directory if it does not exist', async () => {
+    const nestedPath = join(tmpDir, 'nested', 'deep', 'out.json');
+    await runCapture('echo "nested"', nestedPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    const raw = readFileSync(nestedPath, 'utf-8');
+    const parsed = JSON.parse(raw);
+    expect(parsed.exit_code).toBe(0);
+  });
+
+  it('content_hash should be sha256 hex and idempotent', async () => {
+    const outPath1 = join(tmpDir, 'hash1.json');
+    const outPath2 = join(tmpDir, 'hash2.json');
+    await runCapture('echo "same output"', outPath1, { cwd: tmpDir, gitSha: STUB_SHA });
+    await runCapture('echo "same output"', outPath2, { cwd: tmpDir, gitSha: STUB_SHA });
+    const r1 = JSON.parse(readFileSync(outPath1, 'utf-8'));
+    const r2 = JSON.parse(readFileSync(outPath2, 'utf-8'));
+    expect(r1.content_hash).toMatch(/^[a-f0-9]{64}$/);
+    expect(r1.content_hash).toBe(r2.content_hash);
+  });
+
+  it('test_files_line should extract the Test Files line from vitest stdout', async () => {
+    const outPath = join(tmpDir, 'test-files-stdout.json');
+    await runCapture(
+      `printf '%s\\n' 'Some header' 'Test Files  1 passed (1)' 'Some footer'`,
+      outPath,
+      { cwd: tmpDir, gitSha: STUB_SHA }
+    );
+    const parsed = JSON.parse(readFileSync(outPath, 'utf-8'));
+    expect(parsed.test_files_line).toBe('Test Files  1 passed (1)');
+  });
+
+  it('test_files_line should extract from stderr for failed commands', async () => {
+    const outPath = join(tmpDir, 'test-files-stderr.json');
+    await runCapture(
+      `node -e "process.stdout.write('header\\n'); process.stderr.write('Test Files  1 failed (1)\\n'); process.stderr.write('footer\\n'); process.exit(1)"`,
+      outPath,
+      { cwd: tmpDir, gitSha: STUB_SHA }
+    );
+    const parsed = JSON.parse(readFileSync(outPath, 'utf-8'));
+    expect(parsed.test_files_line).toBe('Test Files  1 failed (1)');
+  });
+
+  it('test_files_line should be null when no Test Files line present', async () => {
+    const outPath = join(tmpDir, 'no-test-files.json');
+    await runCapture('echo "no match here"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    const parsed = JSON.parse(readFileSync(outPath, 'utf-8'));
+    expect(parsed.test_files_line).toBeNull();
+  });
+
+  it('git_sha should be a 40-char hex string from HEAD', async () => {
+    // This test needs a real git repo — use the workflowhub root
+    const repoRoot = '/Users/Hugh/Hugh/Project/workflowhub';
+    const outPath = join(tmpDir, 'git-sha.json');
+    const result = await runCapture('echo "x"', outPath, { cwd: repoRoot });
+    expect(result.git_sha).toMatch(/^[a-f0-9]{40}$/);
+  });
+
+  it('opts.gitSha should override git_sha (test stub)', async () => {
+    const outPath = join(tmpDir, 'stub-sha.json');
+    const stubSha = 'a'.repeat(40);
+    const result = await runCapture('echo "x"', outPath, { cwd: tmpDir, gitSha: stubSha });
+    expect(result.git_sha).toBe(stubSha);
+  });
+
+  it('should throw when git_sha cannot be determined and no gitSha override', async () => {
+    const outPath = join(tmpDir, 'no-git.json');
+    // Run in a temp dir NOT in a git repo, without gitSha override
+    await expect(
+      runCapture('echo "x"', outPath, { cwd: tmpDir, gitSha: undefined })
+    ).rejects.toThrow(/git_sha/);
+  });
+
+  it('timestamp should be an ISO string', async () => {
+    const outPath = join(tmpDir, 'ts.json');
+    const result = await runCapture('echo "x"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    expect(() => new Date(result.timestamp)).not.toThrow();
+    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
+  });
+
+  it('command field should match the command argument', async () => {
+    const outPath = join(tmpDir, 'cmd.json');
+    const cmd = 'echo "specific command"';
+    const result = await runCapture(cmd, outPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    expect(result.command).toBe(cmd);
+  });
+});
diff --git a/workflows/verify-code/capture.mjs b/workflows/verify-code/capture.mjs
new file mode 100644
index 0000000..925d35b
--- /dev/null
+++ b/workflows/verify-code/capture.mjs
@@ -0,0 +1,83 @@
+import { execSync } from 'node:child_process';
+import { writeFileSync, mkdirSync } from 'node:fs';
+import { dirname, resolve } from 'node:path';
+import { createHash } from 'node:crypto';
+
+/**
+ * Walk up from a directory to find the nearest git repo root.
+ * Returns null if no .git found anywhere.
+ */
+function findGitRoot(startDir) {
+  let dir = resolve(startDir);
+  while (true) {
+    try {
+      execSync('git rev-parse --git-dir', { cwd: dir, encoding: 'utf-8', stdio: 'pipe' });
+      return dir;
+    } catch {
+      const parent = dirname(dir);
+      if (parent === dir) break;
+      dir = parent;
+    }
+  }
+  return null;
+}
+
+/**
+ * Run a shell command and capture physical facts to a durable JSON file.
+ * Never throws on command failure (F3 non-blocking).
+ * Throws only when git_sha cannot be determined and no gitSha override is provided.
+ */
+export async function runCapture(command, outputPath, { cwd, gitSha } = {}) {
+  // Ensure output directory exists
+  mkdirSync(dirname(outputPath), { recursive: true });
+
+  let exit_code;
+  let stdout = '';
+  let stderr = '';
+  try {
+    stdout = execSync(command, { cwd, encoding: 'utf-8', stdio: 'pipe' }).toString();
+    exit_code = 0;
+  } catch (err) {
+    stdout = (err.stdout || '').toString();
+    stderr = (err.stderr || '').toString();
+    exit_code = err.status || 1;
+  }
+
+  // Get current HEAD sha — try cwd first, then walk up to find repo root
+  let sha = gitSha;
+  if (!sha) {
+    try {
+      sha = execSync('git rev-parse HEAD', { cwd, encoding: 'utf-8', stdio: 'pipe' }).trim();
+    } catch {
+      const repoRoot = findGitRoot(cwd || process.cwd());
+      if (repoRoot) {
+        sha = execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf-8', stdio: 'pipe' }).trim();
+      } else {
+        throw new Error('Cannot determine git_sha: not in a git repository and no gitSha override provided');
+      }
+    }
+  }
+
+  // Extract Test Files line — search both stdout and stderr
+  const combined = stdout + '\n' + stderr;
+  const testFilesLine = combined.split('\n').find(l => l.trimStart().startsWith('Test Files'));
+  const test_files_line = testFilesLine ? testFilesLine.trim() : null;
+
+  // Compute content hash over combined output
+  const content_hash = createHash('sha256').update(combined).digest('hex');
+
+  const timestamp = new Date().toISOString();
+
+  const record = {
+    command,
+    git_sha: sha,
+    exit_code,
+    timestamp,
+    test_files_line,
+    content_hash,
+  };
+
+  writeFileSync(outputPath, JSON.stringify(record, null, 2), 'utf-8');
+
+  return record;
+}

## 审查要求
1. 核实 5 个 blocking 是否真修了
2. 检查是否有新问题
3. 给 verdict (pass/revise_required/escalate_to_human)
4. blocking finding 带文件:行号+证据

## Final prompt

你是独立代码审查员。对 workflowhub M9 verify-code Phase 1 round 2 返修做复审。

## 上轮 blocking（已修）
B1: 'unknown' fallback → 改 throw Error / B2: stderr 丢弃 → 合并 stdout+stderr / B3: test_files_line 只看 stdout → 也搜 stderr / B4: echo 引号脆弱 → 改 printf / B5: 缺非 git 环境 throw 测试 → 新增测试 + STUB_SHA 模式

## 待审代码（全量 diff）
diff --git a/tests/verify-code-capture.test.mjs b/tests/verify-code-capture.test.mjs
new file mode 100644
index 0000000..5e75775
--- /dev/null
+++ b/tests/verify-code-capture.test.mjs
@@ -0,0 +1,139 @@
+import { describe, it, expect, beforeAll, afterAll } from 'vitest';
+import { runCapture } from '../workflows/verify-code/capture.mjs';
+import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
+import { join } from 'node:path';
+import { tmpdir } from 'node:os';
+
+const STUB_SHA = '0'.repeat(40);
+
+let tmpDir;
+
+beforeAll(() => {
+  tmpDir = mkdtempSync(join(tmpdir(), 'verify-code-capture-test-'));
+});
+
+afterAll(() => {
+  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
+});
+
+describe('runCapture', () => {
+  it('should return an object with expected keys on success', async () => {
+    const outPath = join(tmpDir, 'success.json');
+    const result = await runCapture('echo "hello"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    expect(result).toHaveProperty('exit_code');
+    expect(result).toHaveProperty('git_sha');
+    expect(result).toHaveProperty('test_files_line');
+    expect(result).toHaveProperty('content_hash');
+    expect(result).toHaveProperty('timestamp');
+    expect(result).toHaveProperty('command');
+  });
+
+  it('exit_code should be a real integer (0 for success)', async () => {
+    const outPath = join(tmpDir, 'exit-code.json');
+    const result = await runCapture('echo "ok"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    expect(typeof result.exit_code).toBe('number');
+    expect(Number.isInteger(result.exit_code)).toBe(true);
+    expect(result.exit_code).toBe(0);
+  });
+
+  it('exit_code should be non-zero for failing commands', async () => {
+    const outPath = join(tmpDir, 'fail-code.json');
+    const result = await runCapture('exit 42', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    expect(typeof result.exit_code).toBe('number');
+    expect(result.exit_code).toBe(42);
+  });
+
+  it('should write JSON to outputPath even when command fails (no throw)', async () => {
+    const outPath = join(tmpDir, 'no-throw.json');
+    await runCapture('exit 1', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    const raw = readFileSync(outPath, 'utf-8');
+    const parsed = JSON.parse(raw);
+    expect(parsed.exit_code).toBe(1);
+    expect(parsed.command).toBe('exit 1');
+  });
+
+  it('should create outputPath directory if it does not exist', async () => {
+    const nestedPath = join(tmpDir, 'nested', 'deep', 'out.json');
+    await runCapture('echo "nested"', nestedPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    const raw = readFileSync(nestedPath, 'utf-8');
+    const parsed = JSON.parse(raw);
+    expect(parsed.exit_code).toBe(0);
+  });
+
+  it('content_hash should be sha256 hex and idempotent', async () => {
+    const outPath1 = join(tmpDir, 'hash1.json');
+    const outPath2 = join(tmpDir, 'hash2.json');
+    await runCapture('echo "same output"', outPath1, { cwd: tmpDir, gitSha: STUB_SHA });
+    await runCapture('echo "same output"', outPath2, { cwd: tmpDir, gitSha: STUB_SHA });
+    const r1 = JSON.parse(readFileSync(outPath1, 'utf-8'));
+    const r2 = JSON.parse(readFileSync(outPath2, 'utf-8'));
+    expect(r1.content_hash).toMatch(/^[a-f0-9]{64}$/);
+    expect(r1.content_hash).toBe(r2.content_hash);
+  });
+
+  it('test_files_line should extract the Test Files line from vitest stdout', async () => {
+    const outPath = join(tmpDir, 'test-files-stdout.json');
+    await runCapture(
+      `printf '%s\\n' 'Some header' 'Test Files  1 passed (1)' 'Some footer'`,
+      outPath,
+      { cwd: tmpDir, gitSha: STUB_SHA }
+    );
+    const parsed = JSON.parse(readFileSync(outPath, 'utf-8'));
+    expect(parsed.test_files_line).toBe('Test Files  1 passed (1)');
+  });
+
+  it('test_files_line should extract from stderr for failed commands', async () => {
+    const outPath = join(tmpDir, 'test-files-stderr.json');
+    await runCapture(
+      `node -e "process.stdout.write('header\\n'); process.stderr.write('Test Files  1 failed (1)\\n'); process.stderr.write('footer\\n'); process.exit(1)"`,
+      outPath,
+      { cwd: tmpDir, gitSha: STUB_SHA }
+    );
+    const parsed = JSON.parse(readFileSync(outPath, 'utf-8'));
+    expect(parsed.test_files_line).toBe('Test Files  1 failed (1)');
+  });
+
+  it('test_files_line should be null when no Test Files line present', async () => {
+    const outPath = join(tmpDir, 'no-test-files.json');
+    await runCapture('echo "no match here"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    const parsed = JSON.parse(readFileSync(outPath, 'utf-8'));
+    expect(parsed.test_files_line).toBeNull();
+  });
+
+  it('git_sha should be a 40-char hex string from HEAD', async () => {
+    // This test needs a real git repo — use the workflowhub root
+    const repoRoot = '/Users/Hugh/Hugh/Project/workflowhub';
+    const outPath = join(tmpDir, 'git-sha.json');
+    const result = await runCapture('echo "x"', outPath, { cwd: repoRoot });
+    expect(result.git_sha).toMatch(/^[a-f0-9]{40}$/);
+  });
+
+  it('opts.gitSha should override git_sha (test stub)', async () => {
+    const outPath = join(tmpDir, 'stub-sha.json');
+    const stubSha = 'a'.repeat(40);
+    const result = await runCapture('echo "x"', outPath, { cwd: tmpDir, gitSha: stubSha });
+    expect(result.git_sha).toBe(stubSha);
+  });
+
+  it('should throw when git_sha cannot be determined and no gitSha override', async () => {
+    const outPath = join(tmpDir, 'no-git.json');
+    // Run in a temp dir NOT in a git repo, without gitSha override
+    await expect(
+      runCapture('echo "x"', outPath, { cwd: tmpDir, gitSha: undefined })
+    ).rejects.toThrow(/git_sha/);
+  });
+
+  it('timestamp should be an ISO string', async () => {
+    const outPath = join(tmpDir, 'ts.json');
+    const result = await runCapture('echo "x"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    expect(() => new Date(result.timestamp)).not.toThrow();
+    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
+  });
+
+  it('command field should match the command argument', async () => {
+    const outPath = join(tmpDir, 'cmd.json');
+    const cmd = 'echo "specific command"';
+    const result = await runCapture(cmd, outPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    expect(result.command).toBe(cmd);
+  });
+});
diff --git a/workflows/verify-code/capture.mjs b/workflows/verify-code/capture.mjs
new file mode 100644
index 0000000..925d35b
--- /dev/null
+++ b/workflows/verify-code/capture.mjs
@@ -0,0 +1,83 @@
+import { execSync } from 'node:child_process';
+import { writeFileSync, mkdirSync } from 'node:fs';
+import { dirname, resolve } from 'node:path';
+import { createHash } from 'node:crypto';
+
+/**
+ * Walk up from a directory to find the nearest git repo root.
+ * Returns null if no .git found anywhere.
+ */
+function findGitRoot(startDir) {
+  let dir = resolve(startDir);
+  while (true) {
+    try {
+      execSync('git rev-parse --git-dir', { cwd: dir, encoding: 'utf-8', stdio: 'pipe' });
+      return dir;
+    } catch {
+      const parent = dirname(dir);
+      if (parent === dir) break;
+      dir = parent;
+    }
+  }
+  return null;
+}
+
+/**
+ * Run a shell command and capture physical facts to a durable JSON file.
+ * Never throws on command failure (F3 non-blocking).
+ * Throws only when git_sha cannot be determined and no gitSha override is provided.
+ */
+export async function runCapture(command, outputPath, { cwd, gitSha } = {}) {
+  // Ensure output directory exists
+  mkdirSync(dirname(outputPath), { recursive: true });
+
+  let exit_code;
+  let stdout = '';
+  let stderr = '';
+  try {
+    stdout = execSync(command, { cwd, encoding: 'utf-8', stdio: 'pipe' }).toString();
+    exit_code = 0;
+  } catch (err) {
+    stdout = (err.stdout || '').toString();
+    stderr = (err.stderr || '').toString();
+    exit_code = err.status || 1;
+  }
+
+  // Get current HEAD sha — try cwd first, then walk up to find repo root
+  let sha = gitSha;
+  if (!sha) {
+    try {
+      sha = execSync('git rev-parse HEAD', { cwd, encoding: 'utf-8', stdio: 'pipe' }).trim();
+    } catch {
+      const repoRoot = findGitRoot(cwd || process.cwd());
+      if (repoRoot) {
+        sha = execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf-8', stdio: 'pipe' }).trim();
+      } else {
+        throw new Error('Cannot determine git_sha: not in a git repository and no gitSha override provided');
+      }
+    }
+  }
+
+  // Extract Test Files line — search both stdout and stderr
+  const combined = stdout + '\n' + stderr;
+  const testFilesLine = combined.split('\n').find(l => l.trimStart().startsWith('Test Files'));
+  const test_files_line = testFilesLine ? testFilesLine.trim() : null;
+
+  // Compute content hash over combined output
+  const content_hash = createHash('sha256').update(combined).digest('hex');
+
+  const timestamp = new Date().toISOString();
+
+  const record = {
+    command,
+    git_sha: sha,
+    exit_code,
+    timestamp,
+    test_files_line,
+    content_hash,
+  };
+
+  writeFileSync(outputPath, JSON.stringify(record, null, 2), 'utf-8');
+
+  return record;
+}

## 审查要求
1. 核实 5 个 blocking 是否真修了
2. 检查是否有新问题
3. 给 verdict (pass/revise_required/escalate_to_human)
4. blocking finding 带文件:行号+证据

## Raw output

```text
Verdict: `revise_required`

目标测试已跑：`node node_modules/.bin/vitest run tests/verify-code-capture.test.mjs --passWithNoTests=false`，结果 `14 passed`。但复审发现仍有阻断问题，不能 pass。

**上轮 5 个 blocking 核实**

| 项 | 结论 | 证据 |
|---|---|---|
| B1 unknown fallback | 已修 | [capture.mjs](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/capture.mjs:48) 无 sha 时最终 throw |
| B2 stderr 丢弃 | 未完全修 | [capture.mjs](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/capture.mjs:38) 成功分支只拿 stdout |
| B3 stderr 搜 Test Files | 未完全修 | [capture.mjs](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/capture.mjs:62) 合并了变量，但成功分支 stderr 变量为空 |
| B4 echo 引号脆弱 | 已修 | [verify-code-capture.test.mjs](/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-capture.test.mjs:77) 改为 `printf` |
| B5 非 git throw 测试 | 已修 | [verify-code-capture.test.mjs](/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-capture.test.mjs:118) 覆盖无 gitSha 非 git 目录 throw |

**Blocking findings**

1. [capture.mjs](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/capture.mjs:38) 成功命令的 stderr 仍被丢弃。  
   证据：成功分支 `execSync(...)` 只把返回值赋给 `stdout`，没有读取 stderr；stderr 只在 catch 分支赋值。实测命令 `node -e "process.stderr.write('Test Files  1 passed (1)\\n')"` 退出码为 0 时，结果 `test_files_line:null`。这说明 B2/B3 只修了失败命令场景，没修成功命令写 stderr 的场景。

2. [capture.mjs](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/capture.mjs:71) 输出 JSON 缺少 `cwd` 字段。  
   证据：M9 tasks 明确要求 JSON 格式为 `{ command, cwd, git_sha, exit_code, timestamp, test_files_line, content_hash }`，见 [tasks.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/tasks.md:53)。当前 record 只有 `command/git_sha/exit_code/timestamp/test_files_line/content_hash`，没有 `cwd`。测试也没有断言这个契约，所以漏掉了。

建议修法很小：把执行改成 `spawnSync(command, { shell: true, cwd: resolvedCwd })` 或等价方式，一次性拿到 stdout/stderr/status；record 里加入 `cwd: resolvedCwd`，并补一个“exit 0 但 Test Files 在 stderr”的测试。


2026-06-26T09:03:22.607967Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:03:22.608031Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/anti-forgery-evidence/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:03:22.608033Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-26T09:03:22.608034Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/stage-summary/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:03:22.608037Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/verify-change/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:03:22.608038Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/handoff/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:03:22.608040Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/design-fidelity-component-contract/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:03:22.608041Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/capture-workflow-feedback/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:03:22.608043Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/tdd-red-green/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:03:22.608044Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T09:03:22.608045Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-26T09:03:22.608046Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/browser-use/SKILL.md: missing YAML frontmatter delimited by ---
OpenAI Codex v0.135.0
--------
workdir: /Users/Hugh/Hugh/Project/workflowhub
model: gpt-5.5
provider: openai
approval: never
sandbox: danger-full-access
reasoning effort: medium
reasoning summaries: none
session id: 019f032b-5d06-7c82-8099-48ba9db19407
--------
user
你是独立代码审查员。对 workflowhub M9 verify-code Phase 1 round 2 返修做复审。

## 上轮 blocking（已修）
B1: 'unknown' fallback → 改 throw Error / B2: stderr 丢弃 → 合并 stdout+stderr / B3: test_files_line 只看 stdout → 也搜 stderr / B4: echo 引号脆弱 → 改 printf / B5: 缺非 git 环境 throw 测试 → 新增测试 + STUB_SHA 模式

## 待审代码（全量 diff）
diff --git a/tests/verify-code-capture.test.mjs b/tests/verify-code-capture.test.mjs
new file mode 100644
index 0000000..5e75775
--- /dev/null
+++ b/tests/verify-code-capture.test.mjs
@@ -0,0 +1,139 @@
+import { describe, it, expect, beforeAll, afterAll } from 'vitest';
+import { runCapture } from '../workflows/verify-code/capture.mjs';
+import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
+import { join } from 'node:path';
+import { tmpdir } from 'node:os';
+
+const STUB_SHA = '0'.repeat(40);
+
+let tmpDir;
+
+beforeAll(() => {
+  tmpDir = mkdtempSync(join(tmpdir(), 'verify-code-capture-test-'));
+});
+
+afterAll(() => {
+  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
+});
+
+describe('runCapture', () => {
+  it('should return an object with expected keys on success', async () => {
+    const outPath = join(tmpDir, 'success.json');
+    const result = await runCapture('echo "hello"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    expect(result).toHaveProperty('exit_code');
+    expect(result).toHaveProperty('git_sha');
+    expect(result).toHaveProperty('test_files_line');
+    expect(result).toHaveProperty('content_hash');
+    expect(result).toHaveProperty('timestamp');
+    expect(result).toHaveProperty('command');
+  });
+
+  it('exit_code should be a real integer (0 for success)', async () => {
+    const outPath = join(tmpDir, 'exit-code.json');
+    const result = await runCapture('echo "ok"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    expect(typeof result.exit_code).toBe('number');
+    expect(Number.isInteger(result.exit_code)).toBe(true);
+    expect(result.exit_code).toBe(0);
+  });
+
+  it('exit_code should be non-zero for failing commands', async () => {
+    const outPath = join(tmpDir, 'fail-code.json');
+    const result = await runCapture('exit 42', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    expect(typeof result.exit_code).toBe('number');
+    expect(result.exit_code).toBe(42);
+  });
+
+  it('should write JSON to outputPath even when command fails (no throw)', async () => {
+    const outPath = join(tmpDir, 'no-throw.json');
+    await runCapture('exit 1', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    const raw = readFileSync(outPath, 'utf-8');
+    const parsed = JSON.parse(raw);
+    expect(parsed.exit_code).toBe(1);
+    expect(parsed.command).toBe('exit 1');
+  });
+
+  it('should create outputPath directory if it does not exist', async () => {
+    const nestedPath = join(tmpDir, 'nested', 'deep', 'out.json');
+    await runCapture('echo "nested"', nestedPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    const raw = readFileSync(nestedPath, 'utf-8');
+    const parsed = JSON.parse(raw);
+    expect(parsed.exit_code).toBe(0);
+  });
+
+  it('content_hash should be sha256 hex and idempotent', async () => {
+    const outPath1 = join(tmpDir, 'hash1.json');
+    const outPath2 = join(tmpDir, 'hash2.json');
+    await runCapture('echo "same output"', outPath1, { cwd: tmpDir, gitSha: STUB_SHA });
+    await runCapture('echo "same output"', outPath2, { cwd: tmpDir, gitSha: STUB_SHA });
+    const r1 = JSON.parse(readFileSync(outPath1, 'utf-8'));
+    const r2 = JSON.parse(readFileSync(outPath2, 'utf-8'));
+    expect(r1.content_hash).toMatch(/^[a-f0-9]{64}$/);
+    expect(r1.content_hash).toBe(r2.content_hash);
+  });
+
+  it('test_files_line should extract the Test Files line from vitest stdout', async () => {
+    const outPath = join(tmpDir, 'test-files-stdout.json');
+    await runCapture(
+      `printf '%s\\n' 'Some header' 'Test Files  1 passed (1)' 'Some footer'`,
+      outPath,
+      { cwd: tmpDir, gitSha: STUB_SHA }
+    );
+    const parsed = JSON.parse(readFileSync(outPath, 'utf-8'));
+    expect(parsed.test_files_line).toBe('Test Files  1 passed (1)');
+  });
+
+  it('test_files_line should extract from stderr for failed commands', async () => {
+    const outPath = join(tmpDir, 'test-files-stderr.json');
+    await runCapture(
+      `node -e "process.stdout.write('header\\n'); process.stderr.write('Test Files  1 failed (1)\\n'); process.stderr.write('footer\\n'); process.exit(1)"`,
+      outPath,
+      { cwd: tmpDir, gitSha: STUB_SHA }
+    );
+    const parsed = JSON.parse(readFileSync(outPath, 'utf-8'));
+    expect(parsed.test_files_line).toBe('Test Files  1 failed (1)');
+  });
+
+  it('test_files_line should be null when no Test Files line present', async () => {
+    const outPath = join(tmpDir, 'no-test-files.json');
+    await runCapture('echo "no match here"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    const parsed = JSON.parse(readFileSync(outPath, 'utf-8'));
+    expect(parsed.test_files_line).toBeNull();
+  });
+
+  it('git_sha should be a 40-char hex string from HEAD', async () => {
+    // This test needs a real git repo — use the workflowhub root
+    const repoRoot = '/Users/Hugh/Hugh/Project/workflowhub';
+    const outPath = join(tmpDir, 'git-sha.json');
+    const result = await runCapture('echo "x"', outPath, { cwd: repoRoot });
+    expect(result.git_sha).toMatch(/^[a-f0-9]{40}$/);
+  });
+
+  it('opts.gitSha should override git_sha (test stub)', async () => {
+    const outPath = join(tmpDir, 'stub-sha.json');
+    const stubSha = 'a'.repeat(40);
+    const result = await runCapture('echo "x"', outPath, { cwd: tmpDir, gitSha: stubSha });
+    expect(result.git_sha).toBe(stubSha);
+  });
+
+  it('should throw when git_sha cannot be determined and no gitSha override', async () => {
+    const outPath = join(tmpDir, 'no-git.json');
+    // Run in a temp dir NOT in a git repo, without gitSha override
+    await expect(
+      runCapture('echo "x"', outPath, { cwd: tmpDir, gitSha: undefined })
+    ).rejects.toThrow(/git_sha/);
+  });
+
+  it('timestamp should be an ISO string', async () => {
+    const outPath = join(tmpDir, 'ts.json');
+    const result = await runCapture('echo "x"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    expect(() => new Date(result.timestamp)).not.toThrow();
+    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
+  });
+
+  it('command field should match the command argument', async () => {
+    const outPath = join(tmpDir, 'cmd.json');
+    const cmd = 'echo "specific command"';
+    const result = await runCapture(cmd, outPath, { cwd: tmpDir, gitSha: STUB_SHA });
+    expect(result.command).toBe(cmd);
+  });
+});
diff --git a/workflows/verify-code/capture.mjs b/workflows/verify-code/capture.mjs
new file mode 100644
index 0000000..925d35b
--- /dev/null
+++ b/workflows/verify-code/capture.mjs
@@ -0,0 +1,83 @@
+import { execSync } from 'node:child_process';
+import { writeFileSync, mkdirSync } from 'node:fs';
+import { dirname, resolve } from 'node:path';
+import { createHash } from 'node:crypto';
+
+/**
+ * Walk up from a directory to find the nearest git repo root.
+ * Returns null if no .git found anywhere.
+ */
+function findGitRoot(startDir) {
+  let dir = resolve(startDir);
+  while (true) {
+    try {
+      execSync('git rev-parse --git-dir', { cwd: dir, encoding: 'utf-8', stdio: 'pipe' });
+      return dir;
+    } catch {
+      const parent = dirname(dir);
+      if (parent === dir) break;
+      dir = parent;
+    }
+  }
+  return null;
+}
+
+/**
+ * Run a shell command and capture physical facts to a durable JSON file.
+ * Never throws on command failure (F3 non-blocking).
+ * Throws only when git_sha cannot be determined and no gitSha override is provided.
+ */
+export async function runCapture(command, outputPath, { cwd, gitSha } = {}) {
+  // Ensure output directory exists
+  mkdirSync(dirname(outputPath), { recursive: true });
+
+  let exit_code;
+  let stdout = '';
+  let stderr = '';
+  try {
+    stdout = execSync(command, { cwd, encoding: 'utf-8', stdio: 'pipe' }).toString();
+    exit_code = 0;
+  } catch (err) {
+    stdout = (err.stdout || '').toString();
+    stderr = (err.stderr || '').toString();
+    exit_code = err.status || 1;
+  }
+
+  // Get current HEAD sha — try cwd first, then walk up to find repo root
+  let sha = gitSha;
+  if (!sha) {
+    try {
+      sha = execSync('git rev-parse HEAD', { cwd, encoding: 'utf-8', stdio: 'pipe' }).trim();
+    } catch {
+      const repoRoot = findGitRoot(cwd || process.cwd());
+      if (repoRoot) {
+        sha = execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf-8', stdio: 'pipe' }).trim();
+      } else {
+        throw new Error('Cannot determine git_sha: not in a git repository and no gitSha override provided');
+      }
+    }
+  }
+
+  // Extract Test Files line — search both stdout and stderr
+  const combined = stdout + '\n' + stderr;
+  const testFilesLine = combined.split('\n').find(l => l.trimStart().startsWith('Test Files'));
+  const test_files_line = testFilesLine ? testFilesLine.trim() : null;
+
+  // Compute content hash over combined output
+  const content_hash = createHash('sha256').update(combined).digest('hex');
+
+  const timestamp = new Date().toISOString();
+
+  const record = {
+    command,
+    git_sha: sha,
+    exit_code,
+    timestamp,
+    test_files_line,
+    content_hash,
+  };
+
+  writeFileSync(outputPath, JSON.stringify(record, null, 2), 'utf-8');
+
+  return record;
+}

## 审查要求
1. 核实 5 个 blocking 是否真修了
2. 检查是否有新问题
3. 给 verdict (pass/revise_required/escalate_to_human)
4. blocking finding 带文件:行号+证据
2026-06-26T09:03:23.575299Z ERROR rmcp::transport::worker: worker quit with fatal: Transport channel closed, when AuthRequired(AuthRequiredError { www_authenticate_header: "Bearer resource_metadata=\"https://mcp.figma.com/.well-known/oauth-protected-resource\",scope=\"mcp:connect\",authorization_uri=\"https://api.figma.com/.well-known/oauth-authorization-server\"" })
hook: SessionStart
hook: SessionStart Completed
hook: UserPromptSubmit
hook: UserPromptSubmit Completed
codex
我会按代码审查处理：先核对仓库里的实际文件和行号，再对 5 个修复点逐项判定，最后只给结论和阻断问题。
codex
这里不启用子代理：当前工具规则要求只有用户显式要求子代理时才可派发；我会本地完成复审，并把证据压缩到文件行号。
exec
/bin/bash -lc 'nl -ba workflows/verify-code/capture.mjs' in /Users/Hugh/Hugh/Project/workflowhub
exec
/bin/bash -lc 'nl -ba tests/verify-code-capture.test.mjs' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
     1	import { execSync } from 'node:child_process';
     2	import { writeFileSync, mkdirSync } from 'node:fs';
     3	import { dirname, resolve } from 'node:path';
     4	import { createHash } from 'node:crypto';
     5	
     6	/**
     7	 * Walk up from a directory to find the nearest git repo root.
     8	 * Returns null if no .git found anywhere.
     9	 */
    10	function findGitRoot(startDir) {
    11	  let dir = resolve(startDir);
    12	  while (true) {
    13	    try {
    14	      execSync('git rev-parse --git-dir', { cwd: dir, encoding: 'utf-8', stdio: 'pipe' });
    15	      return dir;
    16	    } catch {
    17	      const parent = dirname(dir);
    18	      if (parent === dir) break;
    19	      dir = parent;
    20	    }
    21	  }
    22	  return null;
    23	}
    24	
    25	/**
    26	 * Run a shell command and capture physical facts to a durable JSON file.
    27	 * Never throws on command failure (F3 non-blocking).
    28	 * Throws only when git_sha cannot be determined and no gitSha override is provided.
    29	 */
    30	export async function runCapture(command, outputPath, { cwd, gitSha } = {}) {
    31	  // Ensure output directory exists
    32	  mkdirSync(dirname(outputPath), { recursive: true });
    33	
    34	  let exit_code;
    35	  let stdout = '';
    36	  let stderr = '';
    37	  try {
    38	    stdout = execSync(command, { cwd, encoding: 'utf-8', stdio: 'pipe' }).toString();
    39	    exit_code = 0;
    40	  } catch (err) {
    41	    stdout = (err.stdout || '').toString();
    42	    stderr = (err.stderr || '').toString();
    43	    exit_code = err.status || 1;
    44	  }
    45	
    46	  // Get current HEAD sha — try cwd first, then walk up to find repo root
    47	  let sha = gitSha;
    48	  if (!sha) {
    49	    try {
    50	      sha = execSync('git rev-parse HEAD', { cwd, encoding: 'utf-8', stdio: 'pipe' }).trim();
    51	    } catch {
    52	      const repoRoot = findGitRoot(cwd || process.cwd());
    53	      if (repoRoot) {
    54	        sha = execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf-8', stdio: 'pipe' }).trim();
    55	      } else {
    56	        throw new Error('Cannot determine git_sha: not in a git repository and no gitSha override provided');
    57	      }
    58	    }
    59	  }
    60	
    61	  // Extract Test Files line — search both stdout and stderr
    62	  const combined = stdout + '\n' + stderr;
    63	  const testFilesLine = combined.split('\n').find(l => l.trimStart().startsWith('Test Files'));
    64	  const test_files_line = testFilesLine ? testFilesLine.trim() : null;
    65	
    66	  // Compute content hash over combined output
    67	  const content_hash = createHash('sha256').update(combined).digest('hex');
    68	
    69	  const timestamp = new Date().toISOString();
    70	
    71	  const record = {
    72	    command,
    73	    git_sha: sha,
    74	    exit_code,
    75	    timestamp,
    76	    test_files_line,
    77	    content_hash,
    78	  };
    79	
    80	  writeFileSync(outputPath, JSON.stringify(record, null, 2), 'utf-8');
    81	
    82	  return record;
    83	}

 succeeded in 0ms:
     1	import { describe, it, expect, beforeAll, afterAll } from 'vitest';
     2	import { runCapture } from '../workflows/verify-code/capture.mjs';
     3	import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
     4	import { join } from 'node:path';
     5	import { tmpdir } from 'node:os';
     6	
     7	const STUB_SHA = '0'.repeat(40);
     8	
     9	let tmpDir;
    10	
    11	beforeAll(() => {
    12	  tmpDir = mkdtempSync(join(tmpdir(), 'verify-code-capture-test-'));
    13	});
    14	
    15	afterAll(() => {
    16	  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
    17	});
    18	
    19	describe('runCapture', () => {
    20	  it('should return an object with expected keys on success', async () => {
    21	    const outPath = join(tmpDir, 'success.json');
    22	    const result = await runCapture('echo "hello"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
    23	    expect(result).toHaveProperty('exit_code');
    24	    expect(result).toHaveProperty('git_sha');
    25	    expect(result).toHaveProperty('test_files_line');
    26	    expect(result).toHaveProperty('content_hash');
    27	    expect(result).toHaveProperty('timestamp');
    28	    expect(result).toHaveProperty('command');
    29	  });
    30	
    31	  it('exit_code should be a real integer (0 for success)', async () => {
    32	    const outPath = join(tmpDir, 'exit-code.json');
    33	    const result = await runCapture('echo "ok"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
    34	    expect(typeof result.exit_code).toBe('number');
    35	    expect(Number.isInteger(result.exit_code)).toBe(true);
    36	    expect(result.exit_code).toBe(0);
    37	  });
    38	
    39	  it('exit_code should be non-zero for failing commands', async () => {
    40	    const outPath = join(tmpDir, 'fail-code.json');
    41	    const result = await runCapture('exit 42', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
    42	    expect(typeof result.exit_code).toBe('number');
    43	    expect(result.exit_code).toBe(42);
    44	  });
    45	
    46	  it('should write JSON to outputPath even when command fails (no throw)', async () => {
    47	    const outPath = join(tmpDir, 'no-throw.json');
    48	    await runCapture('exit 1', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
    49	    const raw = readFileSync(outPath, 'utf-8');
    50	    const parsed = JSON.parse(raw);
    51	    expect(parsed.exit_code).toBe(1);
    52	    expect(parsed.command).toBe('exit 1');
    53	  });
    54	
    55	  it('should create outputPath directory if it does not exist', async () => {
    56	    const nestedPath = join(tmpDir, 'nested', 'deep', 'out.json');
    57	    await runCapture('echo "nested"', nestedPath, { cwd: tmpDir, gitSha: STUB_SHA });
    58	    const raw = readFileSync(nestedPath, 'utf-8');
    59	    const parsed = JSON.parse(raw);
    60	    expect(parsed.exit_code).toBe(0);
    61	  });
    62	
    63	  it('content_hash should be sha256 hex and idempotent', async () => {
    64	    const outPath1 = join(tmpDir, 'hash1.json');
    65	    const outPath2 = join(tmpDir, 'hash2.json');
    66	    await runCapture('echo "same output"', outPath1, { cwd: tmpDir, gitSha: STUB_SHA });
    67	    await runCapture('echo "same output"', outPath2, { cwd: tmpDir, gitSha: STUB_SHA });
    68	    const r1 = JSON.parse(readFileSync(outPath1, 'utf-8'));
    69	    const r2 = JSON.parse(readFileSync(outPath2, 'utf-8'));
    70	    expect(r1.content_hash).toMatch(/^[a-f0-9]{64}$/);
    71	    expect(r1.content_hash).toBe(r2.content_hash);
    72	  });
    73	
    74	  it('test_files_line should extract the Test Files line from vitest stdout', async () => {
    75	    const outPath = join(tmpDir, 'test-files-stdout.json');
    76	    await runCapture(
    77	      `printf '%s\\n' 'Some header' 'Test Files  1 passed (1)' 'Some footer'`,
    78	      outPath,
    79	      { cwd: tmpDir, gitSha: STUB_SHA }
    80	    );
    81	    const parsed = JSON.parse(readFileSync(outPath, 'utf-8'));
    82	    expect(parsed.test_files_line).toBe('Test Files  1 passed (1)');
    83	  });
    84	
    85	  it('test_files_line should extract from stderr for failed commands', async () => {
    86	    const outPath = join(tmpDir, 'test-files-stderr.json');
    87	    await runCapture(
    88	      `node -e "process.stdout.write('header\\n'); process.stderr.write('Test Files  1 failed (1)\\n'); process.stderr.write('footer\\n'); process.exit(1)"`,
    89	      outPath,
    90	      { cwd: tmpDir, gitSha: STUB_SHA }
    91	    );
    92	    const parsed = JSON.parse(readFileSync(outPath, 'utf-8'));
    93	    expect(parsed.test_files_line).toBe('Test Files  1 failed (1)');
    94	  });
    95	
    96	  it('test_files_line should be null when no Test Files line present', async () => {
    97	    const outPath = join(tmpDir, 'no-test-files.json');
    98	    await runCapture('echo "no match here"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
    99	    const parsed = JSON.parse(readFileSync(outPath, 'utf-8'));
   100	    expect(parsed.test_files_line).toBeNull();
   101	  });
   102	
   103	  it('git_sha should be a 40-char hex string from HEAD', async () => {
   104	    // This test needs a real git repo — use the workflowhub root
   105	    const repoRoot = '/Users/Hugh/Hugh/Project/workflowhub';
   106	    const outPath = join(tmpDir, 'git-sha.json');
   107	    const result = await runCapture('echo "x"', outPath, { cwd: repoRoot });
   108	    expect(result.git_sha).toMatch(/^[a-f0-9]{40}$/);
   109	  });
   110	
   111	  it('opts.gitSha should override git_sha (test stub)', async () => {
   112	    const outPath = join(tmpDir, 'stub-sha.json');
   113	    const stubSha = 'a'.repeat(40);
   114	    const result = await runCapture('echo "x"', outPath, { cwd: tmpDir, gitSha: stubSha });
   115	    expect(result.git_sha).toBe(stubSha);
   116	  });
   117	
   118	  it('should throw when git_sha cannot be determined and no gitSha override', async () => {
   119	    const outPath = join(tmpDir, 'no-git.json');
   120	    // Run in a temp dir NOT in a git repo, without gitSha override
   121	    await expect(
   122	      runCapture('echo "x"', outPath, { cwd: tmpDir, gitSha: undefined })
   123	    ).rejects.toThrow(/git_sha/);
   124	  });
   125	
   126	  it('timestamp should be an ISO string', async () => {
   127	    const outPath = join(tmpDir, 'ts.json');
   128	    const result = await runCapture('echo "x"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
   129	    expect(() => new Date(result.timestamp)).not.toThrow();
   130	    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
   131	  });
   132	
   133	  it('command field should match the command argument', async () => {
   134	    const outPath = join(tmpDir, 'cmd.json');
   135	    const cmd = 'echo "specific command"';
   136	    const result = await runCapture(cmd, outPath, { cwd: tmpDir, gitSha: STUB_SHA });
   137	    expect(result.command).toBe(cmd);
   138	  });
   139	});

exec
/bin/bash -lc 'git status --short' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
A  tests/verify-code-capture.test.mjs
A  workflows/verify-code/capture.mjs
?? .omc/
?? specs/m9-verify-code/

exec
/bin/bash -lc 'rg -n "runCapture|verify-code|content_hash|test_files_line|git_sha" -S .' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
./workflows/decision-log/SKILL.md:15:Read all make-decision inputs (original requirement text, upstream conversations, direction-confirmation exchanges) and converge them into a single structured decision log file `tasks/<task-id>/decision-log.md`. This file becomes the **sole authoritative requirement source** for all downstream phases (build-spec / build-plan / build-code / verify-code). Downstream phases do not re-read the raw make-decision inputs — decision-log already captures every load-bearing claim and its reasoning chain.
./metrics/collector.mjs:178:    // git_sha: zero-cost read of HEAD commit sha.
./metrics/collector.mjs:179:    let git_sha = null;
./metrics/collector.mjs:183:      if (r.status === 0 && r.stdout) git_sha = r.stdout.trim();
./metrics/collector.mjs:212:    const facts = { exit_code, git_sha, files_changed, review_invoked };
./reuse-registry.md:9:| verify-code | 自研 | none |
./config/workflowhub.yaml:21:  - component_id: verify-code
./config/workflowhub.yaml:23:    path: workflows/verify-code/SKILL.md
./specs/m9-verify-code/tasks.md:2:milestone: m9-verify-code
./specs/m9-verify-code/tasks.md:10:# Tasks — M9 verify-code v1
./specs/m9-verify-code/tasks.md:13:> 三段闭环：make-decision → build-code → verify-code
./specs/m9-verify-code/tasks.md:14:> 关键脚本：capture.mjs / freshness.mjs / facts-assembly.mjs（均在 workflows/verify-code/）
./specs/m9-verify-code/tasks.md:24:新建 `workflows/verify-code/capture.mjs`，实现外部进程级物理事实采集：执行测试命令、采集 exit 码、提取 Test Files 行、记录 git_sha，写入 durable evidence JSON。不靠 LLM 自报，不阻断推进（F3/Q1）。
./specs/m9-verify-code/tasks.md:28:- `/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/capture.mjs` — 新建
./specs/m9-verify-code/tasks.md:29:- `/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-capture.test.mjs` — 新建
./specs/m9-verify-code/tasks.md:36:- 出参：`tests/verify-code-capture.test.mjs`，测试以下行为：
./specs/m9-verify-code/tasks.md:37:  1. `runCapture(command, outputPath, opts)` — 执行命令，写 JSON 到 outputPath，返回 `{ exit_code, git_sha, test_files_line, content_hash, timestamp, command }`
./specs/m9-verify-code/tasks.md:40:  4. content_hash 为 sha256 hex，同输出同 hash（幂等）
./specs/m9-verify-code/tasks.md:41:  5. test_files_line 从 stdout 提取 `Test Files` 开头行，无匹配时为 null
./specs/m9-verify-code/tasks.md:42:  6. git_sha 字段为当前 HEAD sha（40 位 hex 字符串），opts.gitSha 可覆盖（供测试 stub）
./specs/m9-verify-code/tasks.md:43:- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-capture.test.mjs`
./specs/m9-verify-code/tasks.md:48:- 出参：`workflows/verify-code/capture.mjs`
./specs/m9-verify-code/tasks.md:51:  - 导出 `export async function runCapture(command, outputPath, { cwd, gitSha } = {})`
./specs/m9-verify-code/tasks.md:53:  - JSON 格式：`{ command, cwd, git_sha, exit_code, timestamp, test_files_line, content_hash }`
./specs/m9-verify-code/tasks.md:54:  - git_sha 未传时用 `git rev-parse HEAD` 获取当前 HEAD
./specs/m9-verify-code/tasks.md:56:- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/capture.mjs`
./specs/m9-verify-code/tasks.md:61:- 出参：在 plan.md phase 1 evidence-contract 段填写真实 git_sha 和 timestamp
./specs/m9-verify-code/tasks.md:62:- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/plan.md`
./specs/m9-verify-code/tasks.md:69:node node_modules/.bin/vitest run tests/verify-code-capture.test.mjs --passWithNoTests=false
./specs/m9-verify-code/tasks.md:72:node node_modules/.bin/vitest run tests/verify-code-capture.test.mjs --passWithNoTests=false
./specs/m9-verify-code/tasks.md:76:node workflows/verify-code/capture.mjs 2>&1 | head -5
./specs/m9-verify-code/tasks.md:82:- test_files_line 提取用 `stdout.split('\n').find(l => l.includes('Test Files'))`
./specs/m9-verify-code/tasks.md:88:Phase 1 完成条件：`tests/verify-code-capture.test.mjs` exit=0，`workflows/verify-code/capture.mjs` 可直接 import。
./specs/m9-verify-code/tasks.md:98:新建 `workflows/verify-code/freshness.mjs`，实现鲜度校验逻辑：比对 build-code 事实包的 git_sha 与当前 HEAD，不匹配时写 `anomaly_flags:["stale_sha"]`，有 anomaly_flags 时产出可见 warnings，绝不 BLOCK / exit2（D-M9-2，C2，D5/D7）。
./specs/m9-verify-code/tasks.md:102:- `/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/freshness.mjs` — 新建
./specs/m9-verify-code/tasks.md:103:- `/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-freshness.test.mjs` — 新建
./specs/m9-verify-code/tasks.md:110:- 出参：`tests/verify-code-freshness.test.mjs`，测试以下行为：
./specs/m9-verify-code/tasks.md:117:- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-freshness.test.mjs`
./specs/m9-verify-code/tasks.md:122:- 出参：`workflows/verify-code/freshness.mjs`
./specs/m9-verify-code/tasks.md:128:- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/freshness.mjs`
./specs/m9-verify-code/tasks.md:133:- 出参：在 plan.md phase 2 evidence-contract 段填写真实 git_sha 和 timestamp
./specs/m9-verify-code/tasks.md:134:- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/plan.md`
./specs/m9-verify-code/tasks.md:141:node node_modules/.bin/vitest run tests/verify-code-freshness.test.mjs --passWithNoTests=false
./specs/m9-verify-code/tasks.md:144:node node_modules/.bin/vitest run tests/verify-code-freshness.test.mjs --passWithNoTests=false
./specs/m9-verify-code/tasks.md:151:- checkFreshness 是纯函数，不读 git（git_sha 由调用方传入），测试无环境依赖
./specs/m9-verify-code/tasks.md:157:Phase 2 完成条件：`tests/verify-code-freshness.test.mjs` exit=0，anomaly_flags 可证伪测试通过（故意破坏后变红）。
./specs/m9-verify-code/tasks.md:167:新建 `workflows/verify-code/facts-assembly.mjs`，实现：从事实包读取 command 字段（缺失时浮现明确错误，不静默）、组装七键 stage-result 结构、evidence_ref 路径对齐 D-M9-6、写 durable JSON。同时补 C1 build-code 侧 command 字段。
./specs/m9-verify-code/tasks.md:171:- `/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/facts-assembly.mjs` — 新建
./specs/m9-verify-code/tasks.md:172:- `/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-facts.test.mjs` — 新建
./specs/m9-verify-code/tasks.md:180:- 出参：`tests/verify-code-facts.test.mjs`，测试以下行为：
./specs/m9-verify-code/tasks.md:188:- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-facts.test.mjs`
./specs/m9-verify-code/tasks.md:193:- 出参：`workflows/verify-code/facts-assembly.mjs`
./specs/m9-verify-code/tasks.md:198:  - 导出 `export function writeStageResult(taskSpecDir, result)` — 写 `${taskSpecDir}/stage-result-verify-code.json`
./specs/m9-verify-code/tasks.md:201:- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/facts-assembly.mjs`
./specs/m9-verify-code/tasks.md:207:- 约束：追加语义，不删除/重命名已有字段；旧 M8 facts（无 command 字段）经 validateFacts 必须仍为 valid（回归不红）；verify-code 消费侧读到缺 command 时 status="failure" 是 verify-code 的行为，与 schema 校验无关
./specs/m9-verify-code/tasks.md:214:- 出参：在 plan.md phase 3 evidence-contract 段填写真实 git_sha 和 timestamp
./specs/m9-verify-code/tasks.md:215:- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/plan.md`
./specs/m9-verify-code/tasks.md:220:- 出参：`workflows/build-code/SKILL.md` 补充说明——在 build-code 产出的 `facts.tests` 中必须包含 `command` 字段，使 skill 行为与 schema 契约对齐，确保 verify-code 消费侧能读到该字段
./specs/m9-verify-code/tasks.md:235:node node_modules/.bin/vitest run tests/verify-code-facts.test.mjs --passWithNoTests=false
./specs/m9-verify-code/tasks.md:238:node node_modules/.bin/vitest run tests/verify-code-facts.test.mjs --passWithNoTests=false
./specs/m9-verify-code/tasks.md:247:- writeStageResult 写 `specs/{task-id}/stage-result-verify-code.json`，task-id 由调用方传入（不硬编码）
./specs/m9-verify-code/tasks.md:253:Phase 3 完成条件：`tests/verify-code-facts.test.mjs` exit=0；`tests/build-code-facts.test.mjs` exit=0（C1 回归不红）；command 缺失测试可证伪（删掉抛错逻辑后变红）。
./specs/m9-verify-code/tasks.md:263:将 `workflows/verify-code/SKILL.md` 从 64 行骨架升为 v1 完整提示词，写清五大能力段；抄入 isolated-browser-qa 并去除 agenthub 硬编码路径；更新 reuse-registry.md 登记来源。
./specs/m9-verify-code/tasks.md:267:- `/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/SKILL.md` — 修改，覆写骨架为 v1
./specs/m9-verify-code/tasks.md:268:- `/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/isolated-browser-qa.md` — 新建，改造版
./specs/m9-verify-code/tasks.md:276:- 出参：`workflows/verify-code/SKILL.md` v1，必须包含以下段落：
./specs/m9-verify-code/tasks.md:279:  3. **fresh 测试执行**：调用 `node workflows/verify-code/capture.mjs`，写 evidence 到 `specs/{task-id}/evidence/fresh-capture.json`
./specs/m9-verify-code/tasks.md:280:  4. **鲜度校验**：调用 freshness.mjs checkFreshness 比对 build-code git_sha vs HEAD；anomaly_flags 非空时在 skill 边界输出可见警告（FR-FRESH-004）
./specs/m9-verify-code/tasks.md:284:  8. **stage-result 落盘**：调用 facts-assembly.mjs assembleStageResult + writeStageResult，落 `specs/{task-id}/stage-result-verify-code.json`（FR-PATH-001）；final-test-report.md 落 `specs/{task-id}/test/`（FR-PATH-002）
./specs/m9-verify-code/tasks.md:286:- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/SKILL.md`
./specs/m9-verify-code/tasks.md:291:- 出参：`workflows/verify-code/isolated-browser-qa.md`
./specs/m9-verify-code/tasks.md:296:- 验证：`grep -i "agenthub\|multica-agenthub" workflows/verify-code/isolated-browser-qa.md` 输出为空
./specs/m9-verify-code/tasks.md:297:- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/isolated-browser-qa.md`
./specs/m9-verify-code/tasks.md:310:- 出参：三个 verify-code-*.test.mjs 全量 exit=0
./specs/m9-verify-code/tasks.md:314:  node node_modules/.bin/vitest run tests/verify-code-capture.test.mjs tests/verify-code-freshness.test.mjs tests/verify-code-facts.test.mjs --passWithNoTests=false
./specs/m9-verify-code/tasks.md:318:  grep -c "capture.mjs\|freshness\|anomaly_flags\|isolated-browser-qa\|missing_items\|明文停顿\|user_decision\|stage-result\|recordSkeleton" workflows/verify-code/SKILL.md
./specs/m9-verify-code/tasks.md:327:node node_modules/.bin/vitest run tests/verify-code-capture.test.mjs tests/verify-code-freshness.test.mjs tests/verify-code-facts.test.mjs --passWithNoTests=false
./specs/m9-verify-code/tasks.md:330:grep -i "agenthub\|multica-agenthub" workflows/verify-code/isolated-browser-qa.md && echo "FAIL: hardcoded paths found" || echo "PASS: clean"
./specs/m9-verify-code/tasks.md:333:grep -c "capture.mjs\|freshness\|anomaly_flags\|isolated-browser-qa\|missing_items\|明文停顿\|user_decision\|stage-result\|recordSkeleton" workflows/verify-code/SKILL.md
./specs/m9-verify-code/tasks.md:344:Phase 4 完成条件：三个 verify-code-*.test.mjs exit=0；isolated-browser-qa.md 无 agenthub 硬编码路径；reuse-registry.md 新增行可见；SKILL.md 九段关键词 grep ≥9 命中。
./specs/m9-verify-code/tasks.md:354:在 CI 配置中新增两步：① verify-code 冒烟（三脚本单测）；② 轻量三段闭环检查（结构性验证 make-decision → build-code → verify-code 产物链路贯通，不引入重型 E2E 框架，满足验收标准 5 同时遵守 D-M9-7/F10）。执行全量回归确认无新增失败；维护 plan.md 证据契约；明确 FR-TEST-002 验收出口。
./specs/m9-verify-code/tasks.md:363:**Task 5.1 — CI 新增 verify-code 冒烟步骤 + 轻量三段闭环检查** [FR-TEST-003]
./specs/m9-verify-code/tasks.md:368:  node_modules/.bin/vitest run tests/verify-code-capture.test.mjs tests/verify-code-freshness.test.mjs tests/verify-code-facts.test.mjs --passWithNoTests=false
./specs/m9-verify-code/tasks.md:373:  3. **verify-code 段**：验证 `specs/{task-id}/stage-result-verify-code.json` 路径结构符合 D-M9-6。
./specs/m9-verify-code/tasks.md:381:- 出参：全量测试 exit=0，Test Files 行显示所有 verify-code-*.test.mjs 跑到，无新增失败
./specs/m9-verify-code/tasks.md:387:- 额外核实：`node --input-type=module --eval "import { readCommand } from './workflows/verify-code/facts-assembly.mjs'; console.log(typeof readCommand)"` 输出 `function`
./specs/m9-verify-code/tasks.md:393:  1. plan.md phase 4 evidence-contract 段填写真实 git_sha 和 timestamp（phase 4 = 全量三脚本）
./specs/m9-verify-code/tasks.md:395:- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/plan.md`
./specs/m9-verify-code/tasks.md:401:- 出参：在 `specs/m9-verify-code/` 目录（或 plan.md 验收清单）明确记录 FR-TEST-002 的验收证据：
./specs/m9-verify-code/tasks.md:402:  1. M9 自举走完一次完整 verify-code 验收+收尾（make-decision → build-code → verify-code 三段全部真跑）即为 FR-TEST-002 证据；
./specs/m9-verify-code/tasks.md:403:  2. 证据落盘路径：`specs/m9-verify-code/stage-result-verify-code.json`（verify-code 自举产出的 stage-result 即为端到端实跑证据）；
./specs/m9-verify-code/tasks.md:405:- 区分说明：本 task 是"按 F10 故意不建 E2E 框架"而非"漏验"——FR-TEST-002 由自举实跑满足，证据就是自举完成后落盘的 stage-result-verify-code.json。（来源：D-M9-7、F10、验收标准 1/2）
./specs/m9-verify-code/tasks.md:406:- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/stage-result-verify-code.json`（自举完成后存在）
./specs/m9-verify-code/tasks.md:412:grep -c "verify-code\|ci-chain-check" /Users/Hugh/Hugh/Project/workflowhub/.github/workflows/ci.yml
./specs/m9-verify-code/tasks.md:419:# verify-code 脚本可 import
./specs/m9-verify-code/tasks.md:420:node --input-type=module --eval "import { readCommand } from './workflows/verify-code/facts-assembly.mjs'; console.log(typeof readCommand)"
./specs/m9-verify-code/tasks.md:421:node --input-type=module --eval "import { checkFreshness } from './workflows/verify-code/freshness.mjs'; console.log(typeof checkFreshness)"
./specs/m9-verify-code/tasks.md:422:node --input-type=module --eval "import { runCapture } from './workflows/verify-code/capture.mjs'; console.log(typeof runCapture)"
./specs/m9-verify-code/tasks.md:431:- CI 冒烟跑三个 verify-code-*.test.mjs；轻量三段闭环检查只做产物结构性验证（不跑完整链路，F10 不为机器可校验堆基建）
./specs/m9-verify-code/tasks.md:432:- FR-TEST-002 端到端验证靠 M9 自举实跑（D-M9-7），证据 = 自举产出的 stage-result-verify-code.json，不在 CI 里模拟三段闭环
./specs/m9-verify-code/tasks.md:438:Phase 5 完成条件：`.github/workflows/ci.yml` 含 verify-code 冒烟步骤 + 轻量三段闭环检查步骤；`scripts/ci-chain-check.mjs` 可运行；全量 vitest run exit=0，所有 verify-code-*.test.mjs 跑到；三脚本均可 import；FR-TEST-002 验收出口已记录（Task 5.4）。
./specs/m9-verify-code/spec.md:1:# 功能规格：verify-code v1
./specs/m9-verify-code/spec.md:3:基于 decision-log.md（m9-verify-code）。本文件不可覆盖项目级规则。
./specs/m9-verify-code/spec.md:5:**功能名**: `m9-verify-code`
./specs/m9-verify-code/spec.md:6:**来源**: decision-log.md M9 verify-code v1（fresh 验证/浏览器验收可选/终态收尾/metrics 接入）
./specs/m9-verify-code/spec.md:13:**一句话需求**：让 verify-code skill 能独立执行"验收"段——fresh 重跑测试、鲜度校验仅记 anomaly 不 BLOCK、浏览器验收可选跳过、终态合并需人确认、metrics 接 M4 collector。
./specs/m9-verify-code/spec.md:18:- 鲜度校验：git_sha 不匹配仅写 anomaly_flags 警告，绝不 FAIL / exit2
./specs/m9-verify-code/spec.md:21:- stage-result 落 specs/{task-id}/stage-result-verify-code.json；M4 metrics 双写 task + global
./specs/m9-verify-code/spec.md:23:**最大影响面**：workflowhub workflows/verify-code/ — 由空骨架升为 v1 可用 skill；build-code facts.tests 加 command 字段（C1 同步）
./specs/m9-verify-code/spec.md:25:**验收信号**：完整跑通一次验收+收尾闭环（含三段连接：make-decision → build-code → verify-code）；事实包可读；metrics 字段对齐 M4。
./specs/m9-verify-code/spec.md:31:verify-code 是 workflowhub extraction program 五段薄骨架的最后一段（M9）。M8 已交付 build-code v1，产出验收事实包（`specs/{task-id}/stage-result-build-code.json`，含三键 changed/tests/review）。verify-code 的 SKILL.md 骨架已存在但无可执行 .mjs 脚本，导致三段闭环断链。
./specs/m9-verify-code/spec.md:33:M9 最小切口：补三个 .mjs 脚本 + 接 collector + 抄 isolated-browser-qa + CI 冒烟，打通 make-decision → build-code → verify-code 完整闭环。
./specs/m9-verify-code/spec.md:41:- **事实包**：build-code 产出的 `stage-result-build-code.json`，verify-code 以此为输入。
./specs/m9-verify-code/spec.md:42:- **stage-result**：verify-code 执行完毕后写入 `specs/{task-id}/stage-result-verify-code.json` 的结构化记录，含 status / error_code / retryable / facts / missing_items / user_decision / reason 七个顶层键。
./specs/m9-verify-code/spec.md:44:- **fresh 验证**：verify-code 自己现跑测试，不复用 M8 旧结果。
./specs/m9-verify-code/spec.md:45:- **鲜度校验**：比对 verify-code 采集的 git_sha 与 HEAD，不匹配时写 `stale_sha` 至 anomaly_flags。
./specs/m9-verify-code/spec.md:58:给定：build-code 已产出事实包，facts.tests.command 有效，当前 HEAD git_sha 与 M8 执行时一致。
./specs/m9-verify-code/spec.md:59:当：verify-code 从事实包读取 command 并执行测试。
./specs/m9-verify-code/spec.md:64:给定：build-code 事实包中记录的 git_sha 与当前 HEAD 不同（有新提交）。
./specs/m9-verify-code/spec.md:65:当：verify-code 完成 fresh 测试并做鲜度校验。
./specs/m9-verify-code/spec.md:71:当：verify-code 进入浏览器验收步骤。
./specs/m9-verify-code/spec.md:83:当：verify-code 尝试读取测试命令。
./specs/m9-verify-code/spec.md:89:当：verify-code 执行测试。
./specs/m9-verify-code/spec.md:94:给定：测试通过，verify-code 在 SKILL.md 明文停顿处等待确认。
./specs/m9-verify-code/spec.md:101:当：verify-code 读取事实包。
./specs/m9-verify-code/spec.md:102:那么：三键均可读取，verify-code 无需额外转换即可消费 facts.tests.command 和 facts.review.verdict。
./specs/m9-verify-code/spec.md:107:当：verify-code 完成一次完整执行（recordSkeleton → updateOwnResult）。
./specs/m9-verify-code/spec.md:113:当：verify-code 进入浏览器验收步骤。
./specs/m9-verify-code/spec.md:125:verify-code 必须自己执行测试命令，不读取 M8 stage-result-build-code.json 中已有的测试结果作为本次验收证据。每次 verify-code 执行均产出新的 capture 证据。
./specs/m9-verify-code/spec.md:127:**FR-FRESH-002** 采集 git_sha 并与 HEAD 比对（来源：D-M9-1；实现建议沿用既有约定）
./specs/m9-verify-code/spec.md:128:verify-code 执行时通过 capture 脚本采集当前 HEAD git_sha，与 build-code 事实包（stage-result-build-code.json）中记录的 git_sha 比对，结果写入 stage-result facts。注：比对对象为"capture 时的 HEAD"与"M8 事实包记录的 git_sha"，是 freshness 的操作定义，属实现约定而非 decision-log 明文要求。
./specs/m9-verify-code/spec.md:131:git_sha 不匹配时，stage-result facts.anomaly_flags 写入 "stale_sha"，同时在 skill 执行边界输出可见警告。绝不因 stale_sha 置 status="failure"、绝不 exit2、绝不把鲜度校验做成 blocking gate。
./specs/m9-verify-code/spec.md:139:verify-code 从 `specs/{task-id}/stage-result-build-code.json` 的 facts.tests.command 字段读取测试命令，不在 verify-code 侧硬编码任何命令。
./specs/m9-verify-code/spec.md:150:将 isolated-browser-qa skill 的提示词文件（SKILL.md）复制至 workflowhub 本地（`workflows/verify-code/isolated-browser-qa.md`），改掉所有硬编码 agenthub 路径，使其可在任意项目 repo 下调用。v1 只复制 SKILL.md 一个文件；若原 skill 含脚本或其他运行时依赖，须在实现时确认无额外依赖（按 F8 简单优先）。来源路径在 reuse-registry.md 中登记（D16）。
./specs/m9-verify-code/spec.md:153:当 task 无 UI 验收项时，verify-code 不调用 isolated-browser-qa，stage-result missing_items 中记录"browser-acceptance: no UI acceptance items"，不以缺少浏览器验收为由置 status="failure"。
./specs/m9-verify-code/spec.md:156:浏览器验收走 SKIP 分支后，verify-code 正常进入收尾步骤，M9 自举真跑时 SKIP 分支可被观察到。
./specs/m9-verify-code/spec.md:172:verify-code 的 stage-result 写入 `specs/{task-id}/stage-result-verify-code.json`，与 build-code 的 `specs/{task-id}/stage-result-build-code.json` 同级。
./specs/m9-verify-code/spec.md:183:verify-code 启动时调用 `metrics/collector.mjs` 的 recordSkeleton，传入含全部 10 个核心字段的 seed（execution_id / skill_or_stage / stage / skill_version / executed / tokens / duration_ms / rework_rounds / human_intervention / friction_ref）。
./specs/m9-verify-code/spec.md:186:verify-code 执行完毕（success 或 failure）后调用 updateOwnResult，更新 executed / tokens / duration_ms 等字段。不手写原始 jsonl 行。
./specs/m9-verify-code/spec.md:200:M9 的三段闭环（make-decision → build-code → verify-code）通过 M9 自举任务实跑验证，不堆额外 E2E 框架。自举实跑走完整验收+收尾一次为验收依据。
./specs/m9-verify-code/spec.md:202:**FR-TEST-003** CI 纳入 verify-code 冒烟 + 轻量三段闭环检查（来源：验收标准 5）
./specs/m9-verify-code/spec.md:204:1. **verify-code 冒烟**：覆盖 capture / freshness / facts 组装三个脚本的单元测试（vitest）；
./specs/m9-verify-code/spec.md:205:2. **轻量三段闭环检查**：CI 跑一个最小验证脚本，串起 make-decision → build-code → verify-code 三段产物链，检查 stage-result-build-code.json 可被读取（facts.tests.command 字段存在）、verify-code stage-result 落盘路径贯通。该检查不引入重型 E2E 基建，不模拟完整 UI 流程（按 D-M9-7/F10），只做产物链路贯通的结构性验证。CI 全部绿才视为交付完整。
./specs/m9-verify-code/spec.md:220:- [ ] **验收 2 — 三段闭环连接**：make-decision → build-code → verify-code 三段全部打通，verify-code 成功读取 build-code 产出的 stage-result-build-code.json。三段任一断链即失败。（来源：验收标准 2）
./specs/m9-verify-code/spec.md:222:- [ ] **验收 3 — 事实包消费**：verify-code 从 facts.tests.command 读取测试命令并执行（C1 同步后）。command 字段缺失时浮现明确错误而非静默跳过。stage-result facts.verdict 和 evidence_ref 均有效。（来源：验收标准 3，D-M9-3，C1，FR-CMD-001/002）
./specs/m9-verify-code/spec.md:224:- [ ] **验收 4 — metrics 字段对齐**：task-metrics.jsonl 中含 verify-code 执行记录，全部 10 个核心字段（execution_id / skill_or_stage / stage / skill_version / executed / tokens / duration_ms / rework_rounds / human_intervention / friction_ref）均作为键存在，缺任一键即失败。（来源：验收标准 4，FR-METRICS-004）
./specs/m9-verify-code/spec.md:226:- [ ] **验收 5 — CI 纳入**：CI 包含 verify-code 冒烟（capture / freshness / facts 组装单元测试）+ 轻量三段闭环检查（结构性验证 make-decision → build-code → verify-code 产物链路贯通，不引入重型 E2E 框架，见 FR-TEST-003 和 D-M9-7/F10 说明），CI 全部通过后视为交付完整。（来源：验收标准 5，FR-TEST-003）
./specs/m9-verify-code/spec.md:232:**stage-result（verify-code 产出）**（来源：D-M9-6 落盘路径约定；七键结构沿用 build-code 既有 stage-result 约定，属实现契约而非 decision-log 明文 schema）：
./specs/m9-verify-code/spec.md:245:**build-code 事实包中 verify-code 消费的字段**：
./specs/m9-verify-code/spec.md:247:- `facts.tests.command`：verify-code 执行的测试命令（C1 新增字段，原有 red_exit_code / green_baseline_hash 等字段不变）
./specs/m9-verify-code/spec.md:248:- `facts.review.verdict`：M8 审查结论（verify-code 可用于报告，非执行依据）
./specs/m9-verify-code/spec.md:256:- **数据粒度**：以一次 verify-code skill 执行（单任务验收）为单位，产出一份 stage-result + 一份 final-test-report.md。
./specs/m9-verify-code/spec.md:259:- **当前 vs 历史**：stage-result 落固定路径 `specs/{task-id}/stage-result-verify-code.json`，同一 task 重跑（rerun）会覆盖前次结果；不同 task 靠 task-id 目录自然隔离。如需保留历史快照，调用方在 rerun 前自行备份，verify-code 本身不做多版本管理。
./specs/m9-verify-code/spec.md:268:- **stage-result 契约预留**：verify-code stage-result 的 facts 结构 design 只加不删，M10 可在 facts 下追加新键，不破坏现有字段语义。
./specs/m9-verify-code/spec.md:269:- **浏览器验收路径预留**：isolated-browser-qa 以 SKIP 分支兼容无 UI 场景，未来有 UI task 可直接走执行分支，不需修改 verify-code 主流程。
./specs/m9-verify-code/spec.md:301:- [ ] 与 decision-log.md（m9-verify-code）一致，每条 FR 可追溯回来源字段
./specs/m9-verify-code/spec.md:318:- **受影响功能：verify-code skill**
./specs/m9-verify-code/spec.md:328:- **受影响功能：三段闭环（make-decision → build-code → verify-code）**
./specs/m9-verify-code/spec.md:329:  - 既有行为：make-decision（M7）和 build-code（M8）已交付，verify-code 断链
./specs/m9-verify-code/spec.md:330:  - 本需求影响：verify-code 接入后三段全部打通，闭环首次可运行
./specs/m9-verify-code/spec.md:336:  - 回归要点：agenthub 原件不被修改；workflowhub 本地副本仅供 verify-code 消费；SKIP 分支确保无 UI task 不受影响
./specs/m9-verify-code/spec.md:340:  - 本需求影响：verify-code 首次在 stage 5 接入 collector，不修改 collector.mjs 本身
./specs/m9-verify-code/spec.md:345:- **明确无影响**：design/plan 上游 workflow 内部逻辑；Multica web/mobile/desktop 前端；agenthub harness / gate 执行框架内部（verify-code 走 agenthub vibecoding harness 自举执行，不修改 harness）
./specs/m9-verify-code/spec.md:349:> 本 spec 基于 decision-log.md（m9-verify-code）所有已批准决策撰写。七条决策、四条约束、五条验收标准均有 FR 对应追溯。
./specs/archive/m7-intake-v1/spec.md:30:workflowhub 已有五段薄骨架（M6），宪法 F4/F10 确立"质量靠异源审查+人，不靠运行时 gate"原则。M3 窄契约 stage-result、M4 指标系统 collector.mjs 已就位。本期在这些基础上加深 make-decision 一段。`D-M7-1` 已核实：make-decision（M6 已建）即 roadmap 所指 intake 入口，不需要再建顶层 intake 壳。`D-M7-9` 命名已全局对齐（roadmap.md 的 intake/design/plan/apply/test-acceptance 改为 make-decision/build-spec/build-plan/build-code/verify-code）。
./specs/archive/m7-intake-v1/spec.md:163:- **FR-CI-001**：five-skills-present 测试从 5 个 skill 扩到 7 个——新增 `scope-triage`、`decision-log`——使用字面量数组逐个独立断言每个 skill 的存在性（make-decision、build-spec、build-plan、build-code、verify-code、scope-triage、decision-log 七个名字各自字面量断言，不能用遍历变量列表的写法，否则删掉某个 skill 后测试会跟着缩、永远不红）。来源：D-M7-7（O4，五 skills 5→7）、D-M7-8（CI 冒烟定义）。
./specs/archive/m7-intake-v1/spec.md:246:- **隐性必达 6**：roadmap.md 命名全局对齐（D-M7-9：intake/design/plan/apply/test-acceptance 改为 make-decision/build-spec/build-plan/build-code/verify-code）。**改名范围仅限 roadmap.md 文档**；workflowhub 代码里 intake 是正式 stage 名（FIVE_STAGES、契约值 intake->design、contract-freeze 测试、workflows/_spike/*.mjs、README/CONTEXT/CONSTITUTION），改名牵连契约+测试+CI，经用户拍板（design 阶段）暂不改、出 M7 范围、另起独立 task。代码级 intake 改名不在本期 apply 范围内。
./workflows/verify-code/SKILL.md:2:name: verify-code
./workflows/verify-code/SKILL.md:6:# verify-code
./workflows/verify-code/SKILL.md:12:## Scope boundary: verify-code vs verify-change
./workflows/verify-code/SKILL.md:14:**`verify-code`** is this skill — stage 5, test-acceptance. It reads the spec's acceptance criteria and the implementation from `build-code`, runs the test suite, and writes `final-test-report.md` and `test-acceptance/summary.md`.
./workflows/verify-code/SKILL.md:16:**`verify-change`** is a different concept — verifying a diff at code-review time (checking whether a proposed change is safe to merge). That is not this skill's responsibility. `verify-code` checks whether the code meets the spec; `verify-change` checks whether the diff is reviewable. If you are asked to "verify the change", confirm which meaning is intended before proceeding.
./workflows/verify-code/SKILL.md:52:  "skill_or_stage": "verify-code",
./workflows/verify-code/SKILL.md:53:  "stage": "verify-code",
./specs/m9-verify-code/plan.md:2:milestone: m9-verify-code
./specs/m9-verify-code/plan.md:8:# Plan — M9 verify-code v1
./specs/m9-verify-code/plan.md:19:**现有骨架**：`workflows/verify-code/SKILL.md`（64 行）定义了 stage-result 结构和 metrics 种子字段，是升级起点。
./specs/m9-verify-code/plan.md:29:| F1 薄核心 | YES | verify-code 本体只做调度，重活交给 capture.mjs / freshness.mjs / facts-assembly.mjs 脚本 |
./specs/m9-verify-code/plan.md:31:| F3 物理事实靠机器校验但不阻断 | YES | capture.mjs 采集 exit 码/git_sha/hash，写入事实，不因此 blocking；metrics 写失败只 warn |
./specs/m9-verify-code/plan.md:48:| S7 一阶段一技能一文件夹 | YES | workflows/verify-code/ 独立文件夹 |
./specs/m9-verify-code/plan.md:62:- `capture.mjs`：YES — FR-FRESH-001/002/003/004 要求外部物理事实采集（exit 码/git_sha/hash），LLM 无法自报，必须是外部进程
./specs/m9-verify-code/plan.md:67:- build-code 侧 command 字段（C1）：YES — FR-CMD-003，verify-code 消费 facts.tests.command；M8 已交付但此字段缺失
./specs/m9-verify-code/plan.md:100:- isolated-browser-qa 复制单文件 vs 引入子目录：skill 原本是目录形式，但 workflowhub 只需 SKILL.md 描述行为，无需完整目录结构。按 F8 简单优先，v1 只复制 SKILL.md 一个文件，命名为 `workflows/verify-code/isolated-browser-qa.md`，去除 agenthub 路径。实现时须确认原 skill 无脚本/资源类运行依赖（如有，一并处理或显式记录豁免）；agenthub 硬编码路径替换是 Task 4.2 的显式工作项。
./specs/m9-verify-code/plan.md:109:│   ├── verify-code/
./specs/m9-verify-code/plan.md:111:│   │   ├── capture.mjs                     # 【新建】物理事实采集：执行测试命令、采集 exit 码/git_sha/content_hash、写 durable evidence JSON
./specs/m9-verify-code/plan.md:112:│   │   ├── freshness.mjs                   # 【新建】鲜度校验纯函数：比对 build-code git_sha vs HEAD，返回 anomaly_flags 数组（不 BLOCK）
./specs/m9-verify-code/plan.md:119:│   ├── verify-code-capture.test.mjs        # 【新建】capture.mjs 单元测试：exit 码采集/hash 幂等/失败命令不抛/anomaly_flags
./specs/m9-verify-code/plan.md:120:│   ├── verify-code-freshness.test.mjs      # 【新建】freshness.mjs 单元测试：sha 匹配返空/sha 不匹配返 stale_sha/anomaly 浮现
./specs/m9-verify-code/plan.md:121:│   └── verify-code-facts.test.mjs          # 【新建】facts-assembly.mjs 单元测试：command 读取/缺失报错/stage-result 结构七键/evidence_ref 路径
./specs/m9-verify-code/plan.md:123:└── .github/workflows/ci.yml                # 【修改】CI 新增两步：① verify-code 冒烟（三脚本单测）；② 轻量三段闭环检查（检查 make-decision 产物 → build-code stage-result + command 字段 → verify-code stage-result 路径，覆盖完整三段产物链）
./specs/m9-verify-code/plan.md:130:| `workflows/verify-code/SKILL.md` | 修改 | 完整提示词：读事实包 → fresh 运行 capture.mjs → freshness 鲜度警告 → 浏览器验收（SKIP or isolated-browser-qa）→ 明文停顿 → 收尾 → metrics 双写 |
./specs/m9-verify-code/plan.md:131:| `workflows/verify-code/capture.mjs` | 新建 | 外部进程采集：`runCapture(command, outputPath, opts)` 执行测试命令，写 `{command, git_sha, exit_code, timestamp, test_files_line, content_hash}` JSON |
./specs/m9-verify-code/plan.md:132:| `workflows/verify-code/freshness.mjs` | 新建 | 纯函数：`checkFreshness(buildSha, headSha)` → `{ anomaly_flags: [], warnings: [] }`；sha 不匹配时 flags 含 "stale_sha" |
./specs/m9-verify-code/plan.md:133:| `workflows/verify-code/facts-assembly.mjs` | 新建 | 纯函数：`readCommand(buildResult)` 读 command 字段（接收已解析 JSON 对象，缺失抛明确错误）；`assembleStageResult(opts)` 组装七键 stage-result；`writeStageResult(path, result)` 写 durable |
./specs/m9-verify-code/plan.md:134:| `workflows/verify-code/isolated-browser-qa.md` | 新建 | isolated-browser-qa 改造版提示词，去除 agenthub 硬编码路径；SKIP 分支：无 UI 项时记 missing_items 不阻断 |
./specs/m9-verify-code/plan.md:137:| `tests/verify-code-capture.test.mjs` | 新建 | capture.mjs 单测：正常路径/失败命令不抛/hash 幂等/test_files_line 提取 |
./specs/m9-verify-code/plan.md:138:| `tests/verify-code-freshness.test.mjs` | 新建 | freshness.mjs 单测：sha 匹配/sha 不匹配/anomaly_flags 可证伪 |
./specs/m9-verify-code/plan.md:139:| `tests/verify-code-facts.test.mjs` | 新建 | facts-assembly.mjs 单测：command 缺失报错/七键结构/evidence_ref 相对路径 |
./specs/m9-verify-code/plan.md:141:| `.github/workflows/ci.yml` | 修改 | 新增两步：① verify-code 冒烟（`vitest run tests/verify-code-*.test.mjs --passWithNoTests=false`）；② 轻量三段闭环检查（检查 make-decision 产物存在可读 → 验证 build-code stage-result-build-code.json 可读且 facts.tests.command 存在 → 验证 verify-code stage-result 落盘路径结构，覆盖完整三段 make-decision → build-code → verify-code，不引入重型 E2E 框架） |
./specs/m9-verify-code/plan.md:164:    "command": "node_modules/.bin/vitest run tests/verify-code-capture.test.mjs --passWithNoTests=false",
./specs/m9-verify-code/plan.md:166:    "git_sha": "PLACEHOLDER_FILL_AT_APPLY",
./specs/m9-verify-code/plan.md:173:    "command": "node_modules/.bin/vitest run tests/verify-code-capture.test.mjs --passWithNoTests=false",
./specs/m9-verify-code/plan.md:175:    "git_sha": "PLACEHOLDER_FILL_AT_APPLY",
./specs/m9-verify-code/plan.md:181:  "evidenceSink": "/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/evidence/",
./specs/m9-verify-code/plan.md:182:  "affectedTests": ["tests/verify-code-capture.test.mjs"]
./specs/m9-verify-code/plan.md:189:    "command": "node_modules/.bin/vitest run tests/verify-code-freshness.test.mjs --passWithNoTests=false",
./specs/m9-verify-code/plan.md:191:    "git_sha": "PLACEHOLDER_FILL_AT_APPLY",
./specs/m9-verify-code/plan.md:198:    "command": "node_modules/.bin/vitest run tests/verify-code-freshness.test.mjs --passWithNoTests=false",
./specs/m9-verify-code/plan.md:200:    "git_sha": "PLACEHOLDER_FILL_AT_APPLY",
./specs/m9-verify-code/plan.md:206:  "evidenceSink": "/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/evidence/",
./specs/m9-verify-code/plan.md:207:  "affectedTests": ["tests/verify-code-freshness.test.mjs"]
./specs/m9-verify-code/plan.md:214:    "command": "node_modules/.bin/vitest run tests/verify-code-facts.test.mjs --passWithNoTests=false",
./specs/m9-verify-code/plan.md:216:    "git_sha": "PLACEHOLDER_FILL_AT_APPLY",
./specs/m9-verify-code/plan.md:223:    "command": "node_modules/.bin/vitest run tests/verify-code-facts.test.mjs --passWithNoTests=false",
./specs/m9-verify-code/plan.md:225:    "git_sha": "PLACEHOLDER_FILL_AT_APPLY",
./specs/m9-verify-code/plan.md:231:  "evidenceSink": "/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/evidence/",
./specs/m9-verify-code/plan.md:232:  "affectedTests": ["tests/verify-code-facts.test.mjs"]
./specs/m9-verify-code/plan.md:239:    "command": "node_modules/.bin/vitest run tests/verify-code-capture.test.mjs tests/verify-code-freshness.test.mjs tests/verify-code-facts.test.mjs --passWithNoTests=false",
./specs/m9-verify-code/plan.md:241:    "git_sha": "PLACEHOLDER_FILL_AT_APPLY",
./specs/m9-verify-code/plan.md:248:    "command": "node_modules/.bin/vitest run tests/verify-code-capture.test.mjs tests/verify-code-freshness.test.mjs tests/verify-code-facts.test.mjs --passWithNoTests=false",
./specs/m9-verify-code/plan.md:250:    "git_sha": "PLACEHOLDER_FILL_AT_APPLY",
./specs/m9-verify-code/plan.md:256:  "evidenceSink": "/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/evidence/",
./specs/m9-verify-code/plan.md:258:    "tests/verify-code-capture.test.mjs",
./specs/m9-verify-code/plan.md:259:    "tests/verify-code-freshness.test.mjs",
./specs/m9-verify-code/plan.md:260:    "tests/verify-code-facts.test.mjs"
./specs/m9-verify-code/plan.md:273:| verify-code 专项测试 | `node_modules/.bin/vitest run tests/verify-code-*.test.mjs --passWithNoTests=false` | exit 0，Test Files 行显示 3 个文件跑到 |
./specs/m9-verify-code/plan.md:275:| capture 直接调用 | `node workflows/verify-code/capture.mjs 2>&1 \| head -5` | exit 0，无语法错误 |
./specs/m9-verify-code/plan.md:288:- `workflows/verify-code/SKILL.md`：人工检查五能力段（fresh/freshness/browser-skip/close-confirm/metrics）均存在
./specs/m9-verify-code/plan.md:289:- `workflows/verify-code/isolated-browser-qa.md`：grep 确认无 `agenthub` / `/Users/Hugh/Hugh/Project/multica-agenthub` 硬编码路径
./specs/m9-verify-code/plan.md:295:**verify-code stage-result 七键契约**（FR-PATH-001，spec §6）：
./specs/m9-verify-code/plan.md:319:1. **build-code facts.tests.command（C1）**（FR-CMD-003）：`workflows/build-code/facts-schema.mjs` 的 `validateFacts` 对 `facts.tests.command` 做**可选字段校验**——present 时校验类型为 string，absent 时仍合法（不把历史 M8 旧 facts 判为 invalid，满足 C1 向后兼容要求）。`buildTestsFact` 新增可选 command 参数，新产物写入该字段。verify-code 侧读到旧包缺 command 时 status="failure" 并给明确错误（这是 verify-code 的消费行为，不是 schema 非法）。已有消费方读 `red_exit_code`/`green_baseline_hash` 等字段不受影响（追加语义）。**同步改动**：`workflows/build-code/SKILL.md` 需声明 build-code 产出的 `facts.tests` 必须包含 `command` 字段，确保 skill 行为与 schema 契约一致，让 verify-code 输入可靠（C1 + FR-CMD-003 要求同步两件）。
./specs/m9-verify-code/plan.md:321:3. **isolated-browser-qa**（FR-BROWSER-001）：复制 `~/.claude/skills/isolated-browser-qa/SKILL.md`，改造去除 agenthub 硬编码路径，落 `workflows/verify-code/isolated-browser-qa.md`。
./specs/m9-verify-code/plan.md:330:| workflow 定义（SKILL.md） | 改 | `workflows/verify-code/SKILL.md` 从骨架升 v1 | Task 4.1 |
./specs/m9-verify-code/plan.md:335:| automation gates / CI | 改 | `.github/workflows/ci.yml` 新增两部分：① verify-code 冒烟（三脚本单测）；② 轻量三段闭环检查脚本（结构性验证产物链路贯通，不引入重型 E2E 框架，按 D-M9-7/F10） | Task 5.1 |
./specs/m9-verify-code/plan.md:347:| FR-FRESH-002 | capture.mjs git_sha 采集 + freshness.mjs 比对 |
./specs/m9-verify-code/plan.md:348:| FR-FRESH-003 | freshness.mjs anomaly_flags 构造，不 BLOCK；verify-code-freshness.test.mjs 可证伪 |
./specs/m9-verify-code/plan.md:349:| FR-FRESH-004 | freshness.mjs warnings 字段；SKILL.md 边界输出；verify-code-freshness.test.mjs |
./specs/m9-verify-code/plan.md:351:| FR-CMD-002 | facts-assembly.mjs readCommand 缺失抛错；verify-code-facts.test.mjs |
./specs/m9-verify-code/plan.md:353:| FR-BROWSER-001 | workflows/verify-code/isolated-browser-qa.md（改造版）；reuse-registry.md |
./specs/m9-verify-code/plan.md:359:| FR-PATH-001 | facts-assembly.mjs writeStageResult 落 specs/{task-id}/stage-result-verify-code.json |
./specs/m9-verify-code/plan.md:365:| FR-METRICS-004 | verify-code-facts.test.mjs 10 字段结构性检查 |
./specs/m9-verify-code/plan.md:366:| FR-TEST-001 | verify-code-capture/freshness/facts 三个 .test.mjs 文件 |
./specs/m9-verify-code/plan.md:368:| FR-TEST-003 | .github/workflows/ci.yml 新增两步：① verify-code 冒烟（三脚本单测）；② 轻量三段闭环检查脚本（scripts/ci-chain-check.mjs：检查 make-decision 产物存在可读 → build-code stage-result-build-code.json 可读且 facts.tests.command 存在 → verify-code stage-result 落盘路径结构，覆盖完整三段 make-decision → build-code → verify-code 产物链，不引入重型 E2E 框架，满足验收标准 5 + D-M9-7/F10） |
./scripts/validate-stage-result.mjs:96:    console.error("Stages: make-decision, build-spec, build-plan, build-code, verify-code");
./workflows/verify-code/capture.mjs:28: * Throws only when git_sha cannot be determined and no gitSha override is provided.
./workflows/verify-code/capture.mjs:30:export async function runCapture(command, outputPath, { cwd, gitSha } = {}) {
./workflows/verify-code/capture.mjs:56:        throw new Error('Cannot determine git_sha: not in a git repository and no gitSha override provided');
./workflows/verify-code/capture.mjs:64:  const test_files_line = testFilesLine ? testFilesLine.trim() : null;
./workflows/verify-code/capture.mjs:67:  const content_hash = createHash('sha256').update(combined).digest('hex');
./workflows/verify-code/capture.mjs:73:    git_sha: sha,
./workflows/verify-code/capture.mjs:76:    test_files_line,
./workflows/verify-code/capture.mjs:77:    content_hash,
./workflows/build-code/SKILL.md:47:After both RED and GREEN evidence files are written, compare their `content_hash` fields. If `RED.content_hash === GREEN.content_hash`, the test output did not change between runs — this is a suspected false-green.
./specs/archive/m7-intake-v1/plan.md:147:    "git_sha": "PLACEHOLDER_HEAD_SHA",
./specs/archive/m7-intake-v1/plan.md:156:    "git_sha": "PLACEHOLDER_HEAD_SHA",
./specs/archive/m7-intake-v1/plan.md:176:    "git_sha": "PLACEHOLDER_HEAD_SHA",
./specs/archive/m7-intake-v1/plan.md:185:    "git_sha": "PLACEHOLDER_HEAD_SHA",
./specs/archive/m7-intake-v1/tasks.md:139:- [x] T013 改 `/Users/Hugh/Hugh/Knowledge/Projects/multica-agenthub/tasks/agenthub-extraction-program/artifacts/roadmap.md`（roadmap.md 在 program artifacts 树（Knowledge），不在 workflowhub 仓）：全局搜索 intake/design/plan/apply/test-acceptance 等原名，逐处替换为 make-decision/build-spec/build-plan/build-code/verify-code（M7 roadmap 段 + M8-M13 段引用 + X4 等），约 26 处；不改 workflowhub 代码侧任何 intake 字面量（D-M7-9-clarify）。[FR-CI-003]（隐性必达 6）
./specs/archive/m7-intake-v1/tasks.md:141:- [x] T015 新建 `reuse-registry.md`（仓根）：markdown 表，表头 `skill 名 | 复用类别 | 来源路径`，7 行——make-decision（自研/none）、build-spec（自研/none）、build-plan（自研/none）、build-code（自研/none）、verify-code（自研/none）、scope-triage（外部改造适配/来源路径）、decision-log（外部改造适配/来源路径）；每行复用类别属枚举三值之一（外部改造适配 / 自研 / 其他平台原生），外部 skill 来源路径非空，自研写 none。[FR-REG-001][FR-REG-002]
./specs/archive/m7-intake-v1/tasks.md:178:- [x] T017 改 tests/five-skills-present.test.mjs 两处：①存在性检查段（当前第 33-39 行为 for-of SKILL_DIRS 遍历，弱可证伪，删一目录循环跟着缩不红）——展开成 7 个独立字面量 test()，skill 名逐个硬编码（make-decision/build-spec/build-plan/build-code/verify-code/scope-triage/decision-log），禁 for-of，删任一目录则精确一个 test 红；②registry 检查段（当前第 79-112 行已是逐字面量独立 test()，仅含原 5 个 skill）——扩到 7 个字面量，覆盖 scope-triage/decision-log；另加 registry 行格式断言（逐行校验：含类别枚举值三选一 + 来源路径非空）+ stage-result 契约形状断言（make-decision facts 含 decision/scope/decision_log_path 三 key 非空，用 facts-subschema.json 校验）；③新增 AC5 机器覆盖断言——读取 `workflows/make-decision/SKILL.md` 内容，独立 test() 断言含字符串 `workflows/scope-triage/SKILL.md`，再一个独立 test() 断言含字符串 `workflows/decision-log/SKILL.md`，缺任一则该 test 红（两断言禁合并成一个 test，须各自独立，保证删任一引用路径精确一红）。跑 `npx vitest run tests/five-skills-present.test.mjs` 应 RED（改动前缺 scope-triage/decision-log/registry），存 apply/evidence/phase-5-RED.json。[FR-CI-001][FR-CI-002][FR-CI-003][FR-REG-002][AC5]
./workflows/build-code/capture.mjs:7:export async function runCapture(command, outputPath, { cwd, gitSha, redBaselineHash } = {}) {
./workflows/build-code/capture.mjs:17:  const content_hash = createHash('sha256').update(stdout).digest('hex');
./workflows/build-code/capture.mjs:20:  const test_files_line = stdout.split('\n').find(l => l.trimStart().startsWith('Test Files')) ?? null;
./workflows/build-code/capture.mjs:22:  // Resolve git_sha
./workflows/build-code/capture.mjs:23:  let git_sha = gitSha;
./workflows/build-code/capture.mjs:24:  if (git_sha == null) {
./workflows/build-code/capture.mjs:27:      git_sha = gitProc.stdout ? gitProc.stdout.toString().trim() : 'unknown';
./workflows/build-code/capture.mjs:28:      if (!git_sha) git_sha = 'unknown';
./workflows/build-code/capture.mjs:30:      git_sha = 'unknown';
./workflows/build-code/capture.mjs:44:  if (exit_code !== 0 && redBaselineHash != null && content_hash === redBaselineHash) {
./workflows/build-code/capture.mjs:47:  if (exit_code === 0 && redBaselineHash != null && content_hash === redBaselineHash) {
./workflows/build-code/capture.mjs:50:  if (exit_code === 0 && test_files_line === null) {
./workflows/build-code/capture.mjs:59:    git_sha,
./workflows/build-code/capture.mjs:62:    test_files_line,
./workflows/build-code/capture.mjs:63:    content_hash,
./workflows/build-code/capture.mjs:96:  const result = await runCapture(command, outputPath, opts);
./specs/archive/m8-build-code/spec.md:30:五段式开发流程（design → plan → build-code → verify-code → deploy）的"写代码"段目前是空骨架，无法独立调用。历史上的 agenthub apply 阶段深度耦合平台 harness + 重型 superpowers skill，积累了大量假绿/孤儿交付/审查自判缺口（RED/GREEN 造假、证据落临时目录蒸发、子代理写错位置/擅自 commit、审查同源自判无意义）。M8 要在 workflowhub 从头重建一个薄核心的 build-code v1，质量形态按"记事实+浮现而非 blocking"（D5/D7），通过外部成熟件（Worker-Mode/3rd-review）保持核心轻量，并产出结构化验收事实包弥补 M8→M9 缝隙。
./specs/archive/m8-build-code/spec.md:48:- 仅覆盖"写代码"段；design/plan 是上游（不含），verify-code 是下游 M9（不含）
./specs/archive/m8-build-code/spec.md:97:当：M9 verify-code 读取事实包。
./specs/archive/m8-build-code/spec.md:153:事实包格式必须与 stage-result 契约中的 facts 结构不冲突，M9 verify-code 读取时无需转换或适配。不得要求 M9 做 schema 转换、字段重映射或格式适配；M9 侧按 C1 契约直接读取，无需感知 M8 内部实现。
./specs/archive/m8-build-code/spec.md:223:  - （design 可扩展字段，如 red_test_files_line、green_exit_code 等）
./specs/archive/m8-build-code/spec.md:262:- 不含 verify-code（M9 下游，M8 范围外）
./specs/archive/m8-build-code/spec.md:322:- **明确无影响**：design/plan 上游 workflow、verify-code M9 下游 workflow 的内部逻辑（M8 只产出事实包，不修改下游消费行为）；Multica web/mobile/desktop 前端（完全无关）
./tests/facts-subschema.test.mjs:8: * Five stages: make-decision, build-spec, build-plan, build-code, verify-code.
./tests/facts-subschema.test.mjs:281:// ── verify-code ───────────────────────────────────────────────────────────────
./tests/facts-subschema.test.mjs:283:describe("verify-code facts sub-schema (FR-CONTRACT-002 D11)", () => {
./tests/facts-subschema.test.mjs:287:      facts: { verdict: "pass", evidence_ref: "evidence/verify-code-2026-06-24.json" },
./tests/facts-subschema.test.mjs:289:    const result = validateStageResult("verify-code", artifact);
./tests/facts-subschema.test.mjs:295:    const result = validateStageResult("verify-code", artifact);
./tests/facts-subschema.test.mjs:304:    const result = validateStageResult("verify-code", artifact);
./tests/facts-subschema.test.mjs:311:    const result = validateStageResult("verify-code", artifact);
./tests/facts-subschema.test.mjs:321:    const result = validateStageResult("verify-code", artifact);
./tests/facts-subschema.test.mjs:331:    const result = validateStageResult("verify-code", artifact);
./specs/archive/m5-quality-mechanism/spec.md:14:- fact collector：4 个零开销物理事实（exit_code / git_sha / files_changed / review_invoked）写进 M4 execution-record 已有 facts 键，复用不新建文件。
./specs/archive/m5-quality-mechanism/spec.md:42:- 做完后，每个 stage 执行完有 4 个物理事实可查（exit_code / git_sha / files_changed / review_invoked），无额外 token/时间消耗。
./specs/archive/m5-quality-mechanism/spec.md:59:Given 某 stage 正常执行完，When 采集触发，Then exit_code / git_sha / files_changed / review_invoked 四字段自动写进该 stage 对应的 execution-record.facts 键，对主流程无额外交互、无可感知耗时；fact 里能查到这条记录即通过。
./specs/archive/m5-quality-mechanism/spec.md:119:- **FR-FACT-001**：系统须在每个 stage 执行结束时，自动采集 exit_code / git_sha / files_changed / review_invoked 四个物理事实，写入该 stage 对应的 M4 execution-record 的 facts 键；不新建任何文件，不新增采集时机。来源：决策 1/2。
./specs/archive/m5-quality-mechanism/spec.md:122:- **FR-FACT-002**：四个物理事实的采集来源须为进程结束时顺手得到的零开销来源——exit_code 来自进程退出码，git_sha 来自当次 git 提交哈希，files_changed 来自同一次 git 调用的文件列表，review_invoked 从 M4 已有 execution-record 推导（同一条记录里就有该 stage 跑没跑审查的痕迹；workflowhub 现状无 journal，不新建 journal），不新增采集入口；推导不到记 `false` + stderr 告警。来源：决策 1 + Clarification（见上）。
./specs/archive/m5-quality-mechanism/spec.md:125:  - **场景**：Given git_sha 采集失败，When stage 仍推进，Then 流程继续 + 有可观测告警 + facts.git_sha 标缺口而非填零。
./specs/archive/m5-quality-mechanism/spec.md:200:  - `git_sha`：当次 git 提交哈希，字符串，同一次 git 调用顺手得。
./specs/archive/m5-quality-mechanism/spec.md:201:  - `files_changed`：本次变更文件列表，字符串数组，同 git_sha 一次调用。
./specs/archive/m5-quality-mechanism/tasks.md:35:  - 做什么：测试喂固定 factSeed（exit_code/git_sha/files_changed/review_invoked）+ cfg 进 collectFacts；读回 execution-record JSONL 断言四字段写入正确类型；另写一个测试验证 collectFacts 在 factSeed 为空时不 throw（never-throw 路径）。接口按 plan SIG 第 5 章 `collectFacts(execution_id, factSeed, cfg)` 签名
./specs/archive/m5-quality-mechanism/tasks.md:41:  - 做什么：在 `updateOwnResult`（A-001）末尾追加 collectFacts 调用，≤5 行；collectFacts 内部用已有 upsert（A-002）写 facts 键；采集 exit_code/git_sha/files_changed 走进程/git 零开销来源；review_invoked 从 execution-record 推导，推导不到记 `false` + stderr 告警；整个 collectFacts 用 try/catch 包住，失败只 stderr warn 不 throw（FR-FACT-003 守恒铁律）；GAP 哨兵（A-004）用于 review_invoked 推导失败时标缺口
./specs/archive/m5-quality-mechanism/plan.md:78:- `git_sha`：string，当次 git 提交哈希（`git rev-parse HEAD`）。
./specs/archive/m5-quality-mechanism/plan.md:117:// factSeed: { exit_code?, git_sha?, files_changed?, review_invoked? }
./specs/archive/m5-quality-mechanism/plan.md:143:  → collectFacts(execution_id, {exit_code, git_sha, files_changed, review_invoked}, cfg)
./specs/archive/m5-quality-mechanism/plan.md:231:### 证据契约预声明（evidence-contract，机器可解析，apply 阶段填真 git_sha）
./specs/archive/m5-quality-mechanism/plan.md:233:> 4 个交付单元各一个块（性质不同不合并）。RED = 实现前断言失败，GREEN = 实现后通过。七字段对齐 `harness/plan-evidence-contract.schema.json`，git_sha 为 plan 阶段占位（apply 阶段采证时填真值），timestamp 为预声明时刻。
./specs/archive/m5-quality-mechanism/plan.md:242:    "git_sha": "a3864c5",
./specs/archive/m5-quality-mechanism/plan.md:251:    "git_sha": "a3864c5",
./specs/archive/m5-quality-mechanism/plan.md:272:    "git_sha": "a3864c5",
./specs/archive/m5-quality-mechanism/plan.md:281:    "git_sha": "a3864c5",
./specs/archive/m5-quality-mechanism/plan.md:301:    "git_sha": "a3864c5",
./specs/archive/m5-quality-mechanism/plan.md:310:    "git_sha": "a3864c5",
./specs/archive/m5-quality-mechanism/plan.md:331:    "git_sha": "a3864c5",
./specs/archive/m5-quality-mechanism/plan.md:340:    "git_sha": "a3864c5",
./specs/archive/m5-quality-mechanism/plan.md:362:  - T001：`execution-record.facts` 在 updateOwnResult 后含 exit_code/git_sha/files_changed/review_invoked（或告警标记），无新文件新建。
./specs/archive/m5-quality-mechanism/plan.md:367:  - fact 采集失败（git 命令失败）：告警 stderr，facts.git_sha = null + 标"推导失败"，updateOwnResult 正常返回。
./tests/build-code-capture.test.mjs:9:import { runCapture } from "../workflows/build-code/capture.mjs";
./tests/build-code-capture.test.mjs:17:describe("runCapture", () => {
./tests/build-code-capture.test.mjs:22:    const result = await runCapture('node -e "process.exit(0)"', out);
./tests/build-code-capture.test.mjs:24:      "command", "cwd", "git_sha", "exit_code", "timestamp",
./tests/build-code-capture.test.mjs:25:      "test_files_line", "content_hash", "stdout_path", "stderr_path",
./tests/build-code-capture.test.mjs:35:    await runCapture('node -e "process.exit(0)"', out);
./tests/build-code-capture.test.mjs:45:    const result = await runCapture('node -e "process.exit(0)"', out);
./tests/build-code-capture.test.mjs:53:    const result = await runCapture('node -e "process.exit(3)"', out);
./tests/build-code-capture.test.mjs:64:      result = await runCapture('node -e "process.exit(3)"', out);
./tests/build-code-capture.test.mjs:70:  // 4. content_hash is sha256 hex, idempotent, and changes with different output
./tests/build-code-capture.test.mjs:71:  it("content_hash is a 64-char hex string", async () => {
./tests/build-code-capture.test.mjs:74:    const result = await runCapture('node -e "console.log(\'hello\')"', out);
./tests/build-code-capture.test.mjs:75:    assert.match(result.content_hash, /^[0-9a-f]{64}$/, "not a sha256 hex");
./tests/build-code-capture.test.mjs:78:  it("content_hash is idempotent for same command output", async () => {
./tests/build-code-capture.test.mjs:82:    const r1 = await runCapture(cmd, join(dir1, "r.json"));
./tests/build-code-capture.test.mjs:83:    const r2 = await runCapture(cmd, join(dir2, "r.json"));
./tests/build-code-capture.test.mjs:84:    assert.strictEqual(r1.content_hash, r2.content_hash);
./tests/build-code-capture.test.mjs:87:  it("content_hash differs for different command output", async () => {
./tests/build-code-capture.test.mjs:90:    const r1 = await runCapture('node -e "console.log(\'aaa\')"', join(dir1, "r.json"));
./tests/build-code-capture.test.mjs:91:    const r2 = await runCapture('node -e "console.log(\'bbb\')"', join(dir2, "r.json"));
./tests/build-code-capture.test.mjs:92:    assert.notStrictEqual(r1.content_hash, r2.content_hash);
./tests/build-code-capture.test.mjs:95:  // 5. test_files_line extracted from stdout
./tests/build-code-capture.test.mjs:96:  it("test_files_line captures the 'Test Files' line from stdout", async () => {
./tests/build-code-capture.test.mjs:100:    const result = await runCapture(cmd, out);
./tests/build-code-capture.test.mjs:101:    assert.strictEqual(result.test_files_line, "Test Files  1 passed (1)");
./tests/build-code-capture.test.mjs:104:  it("test_files_line is null when no 'Test Files' line present", async () => {
./tests/build-code-capture.test.mjs:108:    const result = await runCapture(cmd, out);
./tests/build-code-capture.test.mjs:109:    assert.strictEqual(result.test_files_line, null);
./tests/build-code-capture.test.mjs:113:  it("test_files_line is null when stdout contains 'Test Files' as substring but NOT at line start", async () => {
./tests/build-code-capture.test.mjs:118:    const result = await runCapture(cmd, out);
./tests/build-code-capture.test.mjs:119:    assert.strictEqual(result.test_files_line, null, "substring-only match must not capture test_files_line");
./tests/build-code-capture.test.mjs:120:    // exit===0 and test_files_line===null => green_test_files_empty should fire
./tests/build-code-capture.test.mjs:128:  it("test_files_line is captured when line starts with 'Test Files'", async () => {
./tests/build-code-capture.test.mjs:132:    const result = await runCapture(cmd, out);
./tests/build-code-capture.test.mjs:133:    assert.strictEqual(result.test_files_line, "Test Files  1 passed (1)", "prefix line must be captured");
./tests/build-code-capture.test.mjs:146:      await runCapture('node -e "process.exit(0)"', out);
./tests/build-code-capture.test.mjs:156:    const r1 = await runCapture(cmd, join(dir1, "r.json"));
./tests/build-code-capture.test.mjs:157:    const redBaselineHash = r1.content_hash;
./tests/build-code-capture.test.mjs:162:    const r2 = await runCapture(failCmd, join(dir2, "r.json"), { redBaselineHash });
./tests/build-code-capture.test.mjs:177:    const r1 = await runCapture(cmd, join(dir1, "r.json"));
./tests/build-code-capture.test.mjs:178:    const redBaselineHash = r1.content_hash;
./tests/build-code-capture.test.mjs:181:    const r2 = await runCapture(cmd, join(dir2, "r.json"), { redBaselineHash });
./tests/build-code-capture.test.mjs:193:    const result = await runCapture(cmd, join(dir, "r.json"));
./tests/build-code-capture.test.mjs:195:    assert.strictEqual(result.test_files_line, null);
./tests/build-code-capture.test.mjs:207:    const r1 = await runCapture(cmd, join(dir1, "r.json"));
./tests/build-code-capture.test.mjs:208:    const redBaselineHash = r1.content_hash;
./tests/build-code-capture.test.mjs:211:    const r2 = await runCapture(cmd, join(dir2, "r.json"), { redBaselineHash });
./tests/build-code-capture.test.mjs:221:    const r1 = await runCapture(cmd, join(dir1, "r.json"));
./tests/build-code-capture.test.mjs:222:    const redBaselineHash = r1.content_hash;
./tests/build-code-capture.test.mjs:226:    const r2 = await runCapture(failCmd, join(dir2, "r.json"), { redBaselineHash });
./tests/build-code-capture.test.mjs:236:    const result = await runCapture(cmd, join(dir, "r.json"));
./tests/build-code-capture.test.mjs:247:    const result = await runCapture(cmd, join(dir, "r.json"));
./specs/archive/m8-build-code/tasks.md:55:- 出参：在 plan.md evidence-contract P1 段填写真实 git_sha 和 timestamp
./specs/archive/m8-build-code/tasks.md:101:  1. `runCapture(command, outputPath)` — 执行命令，写 JSON 到 outputPath，返回 `{exit_code, test_files_line, content_hash, timestamp, command}`
./specs/archive/m8-build-code/tasks.md:104:  4. content_hash 为 sha256 hex（可重复，同输出同 hash）
./specs/archive/m8-build-code/tasks.md:105:  5. test_files_line 从 stdout 提取 `Test Files` 开头行，无匹配时为 null
./specs/archive/m8-build-code/tasks.md:114:  - 导出 `export async function runCapture(command, outputPath, { cwd, gitSha } = {})`
./specs/archive/m8-build-code/tasks.md:116:  - 写 JSON 格式对齐 C1 事实包：`{ command, cwd, git_sha, exit_code, timestamp, test_files_line, content_hash, stdout_path, stderr_path }`
./specs/archive/m8-build-code/tasks.md:125:  - 同命令两次运行，content_hash 相同（幂等）
./specs/archive/m8-build-code/tasks.md:129:    - 构造命令 exit=0 但 content_hash 与 RED 基线相同（hash 未变） → `anomaly_flags` 含 `suspicious_green_exit`；删掉该字段时断言必须红
./specs/archive/m8-build-code/tasks.md:130:    - 构造命令输出不含 "Test Files" 行（test_files_line=null）且 exit=0 → `anomaly_flags` 含 `green_test_files_empty`；删掉该字段时断言必须红
./specs/archive/m8-build-code/tasks.md:137:- 出参：在 plan.md evidence-contract P2 段填写真实 git_sha 和 timestamp
./specs/archive/m8-build-code/tasks.md:159:- test_files_line 提取用 stdout.split('\n').find(l => l.includes('Test Files'))
./specs/archive/m8-build-code/tasks.md:211:- 出参：在 plan.md evidence-contract P3 段填写真实 git_sha 和 timestamp
./specs/archive/m8-build-code/tasks.md:297:- 出参：在 plan.md evidence-contract P4 段填写真实 git_sha 和 timestamp
./specs/archive/m8-build-code/tasks.md:347:  3. **假绿检测**：比对 RED vs GREEN 的 content_hash，如 hash 相同则浮现警告（不 blocking）
./specs/archive/m8-build-code/tasks.md:389:  1. plan.md evidence-contract P5 段填写真实 git_sha 和 timestamp
./tests/fact-collector.test.mjs:79:    // git_sha: derived from `git rev-parse HEAD` on the real repo — must be a non-empty string
./tests/fact-collector.test.mjs:80:    expect(typeof record.facts.git_sha).toBe("string");
./tests/fact-collector.test.mjs:81:    expect(record.facts.git_sha.length).toBeGreaterThan(0);
./tests/reuse-registry.test.mjs:14:  ["verify-code", "自研", "none"],
./contracts/facts-subschema.json:34:    "verify-code": {
./specs/archive/m8-build-code/plan.md:134:    "git_sha": "dfa35c3ecfcfe6a3be1a01afd290be5cc8ba1ed0",
./specs/archive/m8-build-code/plan.md:143:    "git_sha": "dfa35c3ecfcfe6a3be1a01afd290be5cc8ba1ed0",
./specs/archive/m8-build-code/plan.md:159:    "git_sha": "2d5ab2da4cbd762df8c37070eb94940061610331",
./specs/archive/m8-build-code/plan.md:168:    "git_sha": "2d5ab2da4cbd762df8c37070eb94940061610331",
./specs/archive/m8-build-code/plan.md:184:    "git_sha": "8d219b9b32c5147bf1dda710fa78db297347f7c0",
./specs/archive/m8-build-code/plan.md:193:    "git_sha": "8d219b9b32c5147bf1dda710fa78db297347f7c0",
./specs/archive/m8-build-code/plan.md:209:    "git_sha": "679146c031d9bc66c9c68360cedf6fa4958b1e41",
./specs/archive/m8-build-code/plan.md:218:    "git_sha": "679146c031d9bc66c9c68360cedf6fa4958b1e41",
./specs/archive/m8-build-code/plan.md:234:    "git_sha": "12a981079d9114bd3a29d2077e27a82ebe48d531",
./specs/archive/m8-build-code/plan.md:243:    "git_sha": "12a981079d9114bd3a29d2077e27a82ebe48d531",
./specs/archive/m8-build-code/plan.md:311:    "test_files_line": "Test Files  3 passed (3)"
./tests/verify-code-capture.test.mjs:2:import { runCapture } from '../workflows/verify-code/capture.mjs';
./tests/verify-code-capture.test.mjs:12:  tmpDir = mkdtempSync(join(tmpdir(), 'verify-code-capture-test-'));
./tests/verify-code-capture.test.mjs:19:describe('runCapture', () => {
./tests/verify-code-capture.test.mjs:22:    const result = await runCapture('echo "hello"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
./tests/verify-code-capture.test.mjs:24:    expect(result).toHaveProperty('git_sha');
./tests/verify-code-capture.test.mjs:25:    expect(result).toHaveProperty('test_files_line');
./tests/verify-code-capture.test.mjs:26:    expect(result).toHaveProperty('content_hash');
./tests/verify-code-capture.test.mjs:33:    const result = await runCapture('echo "ok"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
./tests/verify-code-capture.test.mjs:41:    const result = await runCapture('exit 42', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
./tests/verify-code-capture.test.mjs:48:    await runCapture('exit 1', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
./tests/verify-code-capture.test.mjs:57:    await runCapture('echo "nested"', nestedPath, { cwd: tmpDir, gitSha: STUB_SHA });
./tests/verify-code-capture.test.mjs:63:  it('content_hash should be sha256 hex and idempotent', async () => {
./tests/verify-code-capture.test.mjs:66:    await runCapture('echo "same output"', outPath1, { cwd: tmpDir, gitSha: STUB_SHA });
./tests/verify-code-capture.test.mjs:67:    await runCapture('echo "same output"', outPath2, { cwd: tmpDir, gitSha: STUB_SHA });
./tests/verify-code-capture.test.mjs:70:    expect(r1.content_hash).toMatch(/^[a-f0-9]{64}$/);
./tests/verify-code-capture.test.mjs:71:    expect(r1.content_hash).toBe(r2.content_hash);
./tests/verify-code-capture.test.mjs:74:  it('test_files_line should extract the Test Files line from vitest stdout', async () => {
./tests/verify-code-capture.test.mjs:76:    await runCapture(
./tests/verify-code-capture.test.mjs:82:    expect(parsed.test_files_line).toBe('Test Files  1 passed (1)');
./tests/verify-code-capture.test.mjs:85:  it('test_files_line should extract from stderr for failed commands', async () => {
./tests/verify-code-capture.test.mjs:87:    await runCapture(
./tests/verify-code-capture.test.mjs:93:    expect(parsed.test_files_line).toBe('Test Files  1 failed (1)');
./tests/verify-code-capture.test.mjs:96:  it('test_files_line should be null when no Test Files line present', async () => {
./tests/verify-code-capture.test.mjs:98:    await runCapture('echo "no match here"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
./tests/verify-code-capture.test.mjs:100:    expect(parsed.test_files_line).toBeNull();
./tests/verify-code-capture.test.mjs:103:  it('git_sha should be a 40-char hex string from HEAD', async () => {
./tests/verify-code-capture.test.mjs:107:    const result = await runCapture('echo "x"', outPath, { cwd: repoRoot });
./tests/verify-code-capture.test.mjs:108:    expect(result.git_sha).toMatch(/^[a-f0-9]{40}$/);
./tests/verify-code-capture.test.mjs:111:  it('opts.gitSha should override git_sha (test stub)', async () => {
./tests/verify-code-capture.test.mjs:114:    const result = await runCapture('echo "x"', outPath, { cwd: tmpDir, gitSha: stubSha });
./tests/verify-code-capture.test.mjs:115:    expect(result.git_sha).toBe(stubSha);
./tests/verify-code-capture.test.mjs:118:  it('should throw when git_sha cannot be determined and no gitSha override', async () => {
./tests/verify-code-capture.test.mjs:122:      runCapture('echo "x"', outPath, { cwd: tmpDir, gitSha: undefined })
./tests/verify-code-capture.test.mjs:123:    ).rejects.toThrow(/git_sha/);
./tests/verify-code-capture.test.mjs:128:    const result = await runCapture('echo "x"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
./tests/verify-code-capture.test.mjs:136:    const result = await runCapture(cmd, outPath, { cwd: tmpDir, gitSha: STUB_SHA });
./specs/archive/m6-five-stage-skeleton/spec.md:12:- **一句话需求**：给 workflowhub 建五个标准 Claude Code skill（/make-decision、/build-spec、/build-plan、/build-code、/verify-code），每个是一份纯提示词，告诉 AI 这个阶段干什么、产什么最小产物、写一条指标，横向串成一条最薄的端到端流程；不搬 agenthub 那套卡流程的 gate 机制。
./specs/archive/m6-five-stage-skeleton/spec.md:28:- Q: AC1「五个命令能分别调起」怎么判定？ → A: 判定 = registry 注册 + SKILL.md 有合法 frontmatter（name/description）可被 Skill 工具发现；端到端「真调起跑一遍通不通」归 verify-code 的人/AI 实跑验收（AC10）。AC1 验「装得上可发现」，AC10 验「真能跑通」，两者分开。
./specs/archive/m6-five-stage-skeleton/spec.md:45:- big 路（make-decision→build-spec→build-plan→build-code→verify-code 全走）与 small 路（make-decision→build-code 跳步）两条都能跑通。
./specs/archive/m6-five-stage-skeleton/spec.md:69:- **操作步骤**：依次调起 /make-decision → /build-spec → /build-plan → /build-code → /verify-code，每段把上一段的 stage-result 产物作为输入传给下一段。
./specs/archive/m6-five-stage-skeleton/spec.md:125:- **FR-SKILL-001**：在 workflowhub `workflows/` 下建五个子目录 make-decision / build-spec / build-plan / build-code / verify-code，各放一份 SKILL.md。命名即 /命令名，语义化动词+名词。来源：decision-log 决策 D1/D5/D7。
./specs/archive/m6-five-stage-skeleton/spec.md:133:  - **场景**：Given 五段集合，When 清点，Then 恰好五段 make-decision/build-spec/build-plan/build-code/verify-code 全在。
./specs/archive/m6-five-stage-skeleton/spec.md:181:### 五段 skill 提示词（make-decision / build-spec / build-plan / build-code / verify-code）
./specs/archive/m6-five-stage-skeleton/spec.md:234:| verify-code | `verdict` | 验收结论 |
./specs/archive/m6-five-stage-skeleton/spec.md:235:| verify-code | `evidence_ref` | 验收证据定位 |
./tests/metric-scan.test.mjs:194:  const SKILLS = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
./tests/metric-scan.test.mjs:277:      "make-decision", "build-spec", "build-plan", "build-code", "verify-code",
./tests/five-skills-present.test.mjs:29:  "verify-code",
./tests/five-skills-present.test.mjs:57:  test('workflows/verify-code/SKILL.md exists',   () => { assertSkillExists("verify-code"); });
./tests/five-skills-present.test.mjs:68:  test('workflows/verify-code/SKILL.md has name="verify-code" and non-empty description',     () => { assertSkillFrontmatter("verify-code"); });
./tests/five-skills-present.test.mjs:119:  test('registry contains component_id "verify-code"', () => {
./tests/five-skills-present.test.mjs:121:      registeredIds.includes("verify-code"),
./tests/five-skills-present.test.mjs:122:      `"verify-code" not found in registry component_ids: ${JSON.stringify(registeredIds)}`
./tests/five-skills-present.test.mjs:282:  test('AC5: registry contains "verify-code"', () => {
./tests/five-skills-present.test.mjs:283:    assert.ok(registeredIds.includes("verify-code"),
./tests/five-skills-present.test.mjs:284:      `"verify-code" not in registry: ${JSON.stringify(registeredIds)}`);
./tests/five-skills-present.test.mjs:369:  test('reuse-registry.md verify-code row: category=自研, source="none"',      () => { assertRegistryRow("verify-code",   "自研"); });
./tests/five-skills-present.test.mjs:374:// --- Content checks: verify-code vs verify-change boundary (D5) ---
./tests/five-skills-present.test.mjs:375:describe("verify-code SKILL.md contains verify-change boundary explanation (D5)", () => {
./tests/five-skills-present.test.mjs:376:  const skillPath = join(REPO_ROOT, "workflows", "verify-code", "SKILL.md");
./tests/five-skills-present.test.mjs:378:  test("verify-code mentions verify-change to distinguish from it", () => {
./tests/five-skills-present.test.mjs:382:      "verify-code/SKILL.md must mention verify-change and distinguish from it (D5)"
./specs/archive/m6-five-stage-skeleton/plan.md:12:- 五段 skill 落 workflows/{make-decision,build-spec,build-plan,build-code,verify-code}/SKILL.md。
./specs/archive/m6-five-stage-skeleton/plan.md:71:│   └── verify-code/SKILL.md        # 新增 — test-acceptance 段（facts: verdict/evidence_ref）
./specs/archive/m6-five-stage-skeleton/plan.md:88:make-decision 产 stage-result（facts.decision/scope）→ [big 路] build-spec→build-plan→build-code→verify-code 逐段读上游 facts 约定 key；[small 路] make-decision → build-code 直读 facts.decision。每段写一条指标到 metrics_path。
./specs/archive/m6-five-stage-skeleton/plan.md:143:    "git_sha": "PLACEHOLDER_HEAD_SHA",
./specs/archive/m6-five-stage-skeleton/plan.md:152:    "git_sha": "PLACEHOLDER_HEAD_SHA",
./specs/archive/m6-five-stage-skeleton/plan.md:172:    "git_sha": "PLACEHOLDER_HEAD_SHA",
./specs/archive/m6-five-stage-skeleton/plan.md:181:    "git_sha": "PLACEHOLDER_HEAD_SHA",
./specs/archive/m6-five-stage-skeleton/plan.md:201:    "git_sha": "PLACEHOLDER_HEAD_SHA",
./specs/archive/m6-five-stage-skeleton/plan.md:210:    "git_sha": "PLACEHOLDER_HEAD_SHA",
./specs/archive/m6-five-stage-skeleton/tasks.md:21:- 新增 workflows/verify-code/SKILL.md
./specs/archive/m6-five-stage-skeleton/tasks.md:32:- [x] T006 写 workflows/verify-code/SKILL.md：test-acceptance 段纯提示词（验证交付→facts 含 verdict/evidence_ref→写指标），写清与 verify-change 的语义区别。[FR-SKILL-001][FR-SKILL-002]
./specs/archive/m6-five-stage-skeleton/tasks.md:72:- [x] T010 写 contracts/facts-subschema.json：按 spec 第 6 章表定五段 facts 子 schema（make-decision: decision/scope; build-spec: spec_ref/requirements; build-plan: plan_ref/tasks; build-code: changed/tests; verify-code: verdict/evidence_ref），每段 required 含约定 key、key 值非空约束。[FR-CONTRACT-002]

codex
实际文件已确认是新增 `capture.mjs` 和测试文件。现在我会对照规格里的输出契约，重点看返修有没有引入合同不一致。
exec
/bin/bash -lc 'cat package.json' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
{
  "name": "workflowhub",
  "version": "0.0.0",
  "private": true,
  "description": "AI 开发工作流编排工具，按设计宪法构建",
  "scripts": {
    "check": "markdownlint-cli2 \"**/*.md\" && node scripts/verify-structure.mjs && node scripts/run-checks.mjs",
    "test": "vitest run"
  },
  "dependencies": {
    "js-yaml": "4.1.0"
  },
  "devDependencies": {
    "markdownlint-cli2": "0.14.0",
    "vitest": "2.1.9"
  }
}

exec
/bin/bash -lc "nl -ba workflows/build-code/capture.mjs | sed -n '1,170p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
     1	import { spawnSync } from 'node:child_process';
     2	import { createHash } from 'node:crypto';
     3	import { mkdirSync, writeFileSync } from 'node:fs';
     4	import { dirname } from 'node:path';
     5	import { fileURLToPath } from 'node:url';
     6	
     7	export async function runCapture(command, outputPath, { cwd, gitSha, redBaselineHash } = {}) {
     8	  const resolvedCwd = cwd ?? process.cwd();
     9	
    10	  // Execute the command
    11	  const proc = spawnSync(command, { shell: true, cwd: resolvedCwd });
    12	  const stdout = proc.stdout ? proc.stdout.toString() : '';
    13	  const stderr = proc.stderr ? proc.stderr.toString() : '';
    14	  const exit_code = proc.status ?? 1;
    15	
    16	  // Compute content hash from stdout
    17	  const content_hash = createHash('sha256').update(stdout).digest('hex');
    18	
    19	  // Extract Test Files line (must START with "Test Files", not merely contain it)
    20	  const test_files_line = stdout.split('\n').find(l => l.trimStart().startsWith('Test Files')) ?? null;
    21	
    22	  // Resolve git_sha
    23	  let git_sha = gitSha;
    24	  if (git_sha == null) {
    25	    try {
    26	      const gitProc = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: resolvedCwd });
    27	      git_sha = gitProc.stdout ? gitProc.stdout.toString().trim() : 'unknown';
    28	      if (!git_sha) git_sha = 'unknown';
    29	    } catch {
    30	      git_sha = 'unknown';
    31	    }
    32	  }
    33	
    34	  const timestamp = new Date().toISOString();
    35	
    36	  // Auto-create output dir
    37	  mkdirSync(dirname(outputPath), { recursive: true });
    38	
    39	  const stdout_path = `${outputPath}.stdout`;
    40	  const stderr_path = `${outputPath}.stderr`;
    41	
    42	  // Compute anomaly_flags
    43	  const anomaly_flags = [];
    44	  if (exit_code !== 0 && redBaselineHash != null && content_hash === redBaselineHash) {
    45	    anomaly_flags.push('suspicious_red_exit');
    46	  }
    47	  if (exit_code === 0 && redBaselineHash != null && content_hash === redBaselineHash) {
    48	    anomaly_flags.push('suspicious_green_exit');
    49	  }
    50	  if (exit_code === 0 && test_files_line === null) {
    51	    anomaly_flags.push('green_test_files_empty');
    52	  }
    53	
    54	  const warning = anomaly_flags.length > 0 ? 'anomalies: ' + anomaly_flags.join(', ') : '';
    55	
    56	  const result = {
    57	    command,
    58	    cwd: resolvedCwd,
    59	    git_sha,
    60	    exit_code,
    61	    timestamp,
    62	    test_files_line,
    63	    content_hash,
    64	    stdout_path,
    65	    stderr_path,
    66	    anomaly_flags,
    67	    warning,
    68	  };
    69	
    70	  // Write sidecars first, then main JSON last (partial-write leaves sidecars but JSON only appears fully assembled)
    71	  writeFileSync(stdout_path, stdout);
    72	  writeFileSync(stderr_path, stderr);
    73	  writeFileSync(outputPath, JSON.stringify(result, null, 2));
    74	  return result;
    75	}
    76	
    77	// CLI entrypoint — only runs when executed directly, not when imported
    78	if (fileURLToPath(import.meta.url) === process.argv[1]) {
    79	  const args = process.argv.slice(2);
    80	
    81	  if (args.includes('--help') || args.includes('-h') || args.length < 2) {
    82	    console.log(
    83	      'Usage: node capture.mjs <command> <outputPath> [--cwd=<dir>] [--git-sha=<sha>] [--red-baseline-hash=<hash>]'
    84	    );
    85	    process.exit(0);
    86	  }
    87	
    88	  const [command, outputPath, ...flags] = args;
    89	  const opts = {};
    90	  for (const flag of flags) {
    91	    if (flag.startsWith('--cwd=')) opts.cwd = flag.slice('--cwd='.length);
    92	    else if (flag.startsWith('--git-sha=')) opts.gitSha = flag.slice('--git-sha='.length);
    93	    else if (flag.startsWith('--red-baseline-hash=')) opts.redBaselineHash = flag.slice('--red-baseline-hash='.length);
    94	  }
    95	
    96	  const result = await runCapture(command, outputPath, opts);
    97	  console.log(JSON.stringify(result, null, 2));
    98	  process.exit(0);
    99	}

exec
/bin/bash -lc "nl -ba specs/m9-verify-code/spec.md | sed -n '120,140p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
   120	> 每条标来源（D-M9-x / Cx / Dx），可追溯回 decision-log。
   121	
   122	### FR-FRESH（fresh 验证 + 鲜度校验）
   123	
   124	**FR-FRESH-001** 现跑测试不复用历史结果（来源：D-M9-1）
   125	verify-code 必须自己执行测试命令，不读取 M8 stage-result-build-code.json 中已有的测试结果作为本次验收证据。每次 verify-code 执行均产出新的 capture 证据。
   126	
   127	**FR-FRESH-002** 采集 git_sha 并与 HEAD 比对（来源：D-M9-1；实现建议沿用既有约定）
   128	verify-code 执行时通过 capture 脚本采集当前 HEAD git_sha，与 build-code 事实包（stage-result-build-code.json）中记录的 git_sha 比对，结果写入 stage-result facts。注：比对对象为"capture 时的 HEAD"与"M8 事实包记录的 git_sha"，是 freshness 的操作定义，属实现约定而非 decision-log 明文要求。
   129	
   130	**FR-FRESH-003** 鲜度不匹配仅记 anomaly_flags 不 FAIL（来源：D-M9-2，C2，D5/D7）
   131	git_sha 不匹配时，stage-result facts.anomaly_flags 写入 "stale_sha"，同时在 skill 执行边界输出可见警告。绝不因 stale_sha 置 status="failure"、绝不 exit2、绝不把鲜度校验做成 blocking gate。
   132	
   133	**FR-FRESH-004** anomaly_flags 浮现可观测（来源：D-M9-2，D5）
   134	当 anomaly_flags 非空时，skill 执行边界必须有可见输出（非静默）。anomaly_flags 存在但无任何输出即视为验收失败。
   135	
   136	### FR-CMD（测试命令读取）
   137	
   138	**FR-CMD-001** 从事实包读取 command 字段（来源：D-M9-3，C1）
   139	verify-code 从 `specs/{task-id}/stage-result-build-code.json` 的 facts.tests.command 字段读取测试命令，不在 verify-code 侧硬编码任何命令。
   140	

exec
/bin/bash -lc "nl -ba specs/m9-verify-code/tasks.md | sed -n '36,58p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
    36	- 出参：`tests/verify-code-capture.test.mjs`，测试以下行为：
    37	  1. `runCapture(command, outputPath, opts)` — 执行命令，写 JSON 到 outputPath，返回 `{ exit_code, git_sha, test_files_line, content_hash, timestamp, command }`
    38	  2. exit_code 字段为真实整数
    39	  3. 失败命令（exit≠0）时 JSON 仍写出，不抛异常（F3 不阻断）
    40	  4. content_hash 为 sha256 hex，同输出同 hash（幂等）
    41	  5. test_files_line 从 stdout 提取 `Test Files` 开头行，无匹配时为 null
    42	  6. git_sha 字段为当前 HEAD sha（40 位 hex 字符串），opts.gitSha 可覆盖（供测试 stub）
    43	- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-capture.test.mjs`
    44	
    45	**Task 1.2 — 实现 capture.mjs（GREEN）** [FR-FRESH-001, FR-FRESH-002, FR-TEST-001]
    46	
    47	- 入参：RED 证据（exit≠0）
    48	- 出参：`workflows/verify-code/capture.mjs`
    49	- 实现约束：
    50	  - ESM `.mjs`，Node 22，`import { execSync } from 'node:child_process'`，`import { createHash } from 'node:crypto'`
    51	  - 导出 `export async function runCapture(command, outputPath, { cwd, gitSha } = {})`
    52	  - outputPath 目录不存在时自动 `mkdirSync` 创建
    53	  - JSON 格式：`{ command, cwd, git_sha, exit_code, timestamp, test_files_line, content_hash }`
    54	  - git_sha 未传时用 `git rev-parse HEAD` 获取当前 HEAD
    55	  - 失败命令 exit≠0 时仍写 JSON，不 throw（F3）
    56	- 精确路径：`/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/capture.mjs`
    57	
    58	**Task 1.3 — 维护知识文件** [FR-FRESH-001]

codex
发现一个合同风险：任务实现约束要求 JSON 含 `cwd`，当前记录没有写入。先跑目标测试确认返修自己的测试状态，再给最终 verdict。
exec
/bin/bash -lc 'node node_modules/.bin/vitest run tests/verify-code-capture.test.mjs --passWithNoTests=false' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 479ms:

 RUN  v2.1.9 /Users/Hugh/Hugh/Project/workflowhub

 ✓ tests/verify-code-capture.test.mjs (14 tests) 186ms

 Test Files  1 passed (1)
      Tests  14 passed (14)
   Start at  17:04:12
   Duration  339ms (transform 12ms, setup 0ms, collect 11ms, tests 186ms, environment 0ms, prepare 34ms)


codex
测试通过，但复审不能只看测试。返修仍有一个更直接的问题：成功命令写 stderr 时，`execSync` 的 stderr 没有进入变量，所谓 stdout+stderr 合并只在失败分支成立。
exec
/bin/bash -lc "node --input-type=module --eval \"import { runCapture } from './workflows/verify-code/capture.mjs'; import { mkdtempSync, readFileSync } from 'node:fs'; import { join } from 'node:path'; import { tmpdir } from 'node:os'; const d=mkdtempSync(join(tmpdir(),'vc-review-')); const out=join(d,'out.json'); const r=await runCapture(\\\"node -e \\\\\\\"process.stderr.write('Test Files  1 passed (1)\\\\\\\\n')\\\\\\\"\\\", out, { cwd:d, gitSha:'0'.repeat(40)}); console.log(JSON.stringify(r)); console.log(readFileSync(out,'utf8'));\"" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
{"command":"node -e \"process.stderr.write('Test Files  1 passed (1)\\n')\"","git_sha":"0000000000000000000000000000000000000000","exit_code":0,"timestamp":"2026-06-26T09:04:25.622Z","test_files_line":null,"content_hash":"01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b"}
{
  "command": "node -e \"process.stderr.write('Test Files  1 passed (1)\\n')\"",
  "git_sha": "0000000000000000000000000000000000000000",
  "exit_code": 0,
  "timestamp": "2026-06-26T09:04:25.622Z",
  "test_files_line": null,
  "content_hash": "01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b"
}

codex
Verdict: `revise_required`

目标测试已跑：`node node_modules/.bin/vitest run tests/verify-code-capture.test.mjs --passWithNoTests=false`，结果 `14 passed`。但复审发现仍有阻断问题，不能 pass。

**上轮 5 个 blocking 核实**

| 项 | 结论 | 证据 |
|---|---|---|
| B1 unknown fallback | 已修 | [capture.mjs](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/capture.mjs:48) 无 sha 时最终 throw |
| B2 stderr 丢弃 | 未完全修 | [capture.mjs](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/capture.mjs:38) 成功分支只拿 stdout |
| B3 stderr 搜 Test Files | 未完全修 | [capture.mjs](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/capture.mjs:62) 合并了变量，但成功分支 stderr 变量为空 |
| B4 echo 引号脆弱 | 已修 | [verify-code-capture.test.mjs](/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-capture.test.mjs:77) 改为 `printf` |
| B5 非 git throw 测试 | 已修 | [verify-code-capture.test.mjs](/Users/Hugh/Hugh/Project/workflowhub/tests/verify-code-capture.test.mjs:118) 覆盖无 gitSha 非 git 目录 throw |

**Blocking findings**

1. [capture.mjs](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/capture.mjs:38) 成功命令的 stderr 仍被丢弃。  
   证据：成功分支 `execSync(...)` 只把返回值赋给 `stdout`，没有读取 stderr；stderr 只在 catch 分支赋值。实测命令 `node -e "process.stderr.write('Test Files  1 passed (1)\\n')"` 退出码为 0 时，结果 `test_files_line:null`。这说明 B2/B3 只修了失败命令场景，没修成功命令写 stderr 的场景。

2. [capture.mjs](/Users/Hugh/Hugh/Project/workflowhub/workflows/verify-code/capture.mjs:71) 输出 JSON 缺少 `cwd` 字段。  
   证据：M9 tasks 明确要求 JSON 格式为 `{ command, cwd, git_sha, exit_code, timestamp, test_files_line, content_hash }`，见 [tasks.md](/Users/Hugh/Hugh/Project/workflowhub/specs/m9-verify-code/tasks.md:53)。当前 record 只有 `command/git_sha/exit_code/timestamp/test_files_line/content_hash`，没有 `cwd`。测试也没有断言这个契约，所以漏掉了。

建议修法很小：把执行改成 `spawnSync(command, { shell: true, cwd: resolvedCwd })` 或等价方式，一次性拿到 stdout/stderr/status；record 里加入 `cwd: resolvedCwd`，并补一个“exit 0 但 Test Files 在 stderr”的测试。
hook: Stop
hook: Stop Completed
tokens used
46,276

```

## Concise summary

Provider completed successfully. Review the raw output for details.

## Action items

- Review the response and extract decisions you want to apply.
- Capture follow-up implementation tasks if needed.
