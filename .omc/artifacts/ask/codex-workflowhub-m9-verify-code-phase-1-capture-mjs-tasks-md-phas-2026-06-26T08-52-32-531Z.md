# codex advisor artifact

- Provider: codex
- Exit code: 0
- Created at: 2026-06-26T08:52:32.532Z

## Original task

你是独立代码审查员。审查 workflowhub M9 verify-code Phase 1 交付物：capture.mjs 物理事实采集脚本。

## 需求（tasks.md Phase 1）
1. runCapture(command, outputPath, opts) — 执行命令写 JSON，返回 { exit_code, git_sha, test_files_line, content_hash, timestamp, command }
2. exit_code 真实整数；失败命令不抛异常（F3）；content_hash sha256 幂等
3. test_files_line 提取'Test Files'行，无匹配 null；git_sha 40位hex可stub覆盖
4. outputPath 目录不存在时自动创建；ESM .mjs Node 22

## 待审代码
diff --git a/tests/verify-code-capture.test.mjs b/tests/verify-code-capture.test.mjs
new file mode 100644
index 0000000..c1f4a89
--- /dev/null
+++ b/tests/verify-code-capture.test.mjs
@@ -0,0 +1,118 @@
+import { describe, it, expect, beforeAll, afterAll } from 'vitest';
+import { runCapture } from '../workflows/verify-code/capture.mjs';
+import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
+import { join } from 'node:path';
+import { tmpdir } from 'node:os';
+import { createHash } from 'node:crypto';
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
+    const result = await runCapture('echo "hello"', outPath, { cwd: tmpDir });
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
+    const result = await runCapture('echo "ok"', outPath, { cwd: tmpDir });
+    expect(typeof result.exit_code).toBe('number');
+    expect(Number.isInteger(result.exit_code)).toBe(true);
+    expect(result.exit_code).toBe(0);
+  });
+
+  it('exit_code should be non-zero for failing commands', async () => {
+    const outPath = join(tmpDir, 'fail-code.json');
+    const result = await runCapture('exit 42', outPath, { cwd: tmpDir });
+    expect(typeof result.exit_code).toBe('number');
+    expect(result.exit_code).toBe(42);
+  });
+
+  it('should write JSON to outputPath even when command fails (no throw)', async () => {
+    const outPath = join(tmpDir, 'no-throw.json');
+    // Should not throw
+    await runCapture('exit 1', outPath, { cwd: tmpDir });
+    const raw = readFileSync(outPath, 'utf-8');
+    const parsed = JSON.parse(raw);
+    expect(parsed.exit_code).toBe(1);
+    expect(parsed.command).toBe('exit 1');
+  });
+
+  it('should create outputPath directory if it does not exist', async () => {
+    const nestedPath = join(tmpDir, 'nested', 'deep', 'out.json');
+    await runCapture('echo "nested"', nestedPath, { cwd: tmpDir });
+    const raw = readFileSync(nestedPath, 'utf-8');
+    const parsed = JSON.parse(raw);
+    expect(parsed.exit_code).toBe(0);
+  });
+
+  it('content_hash should be sha256 hex and idempotent', async () => {
+    const outPath1 = join(tmpDir, 'hash1.json');
+    const outPath2 = join(tmpDir, 'hash2.json');
+    await runCapture('echo "same output"', outPath1, { cwd: tmpDir });
+    await runCapture('echo "same output"', outPath2, { cwd: tmpDir });
+    const r1 = JSON.parse(readFileSync(outPath1, 'utf-8'));
+    const r2 = JSON.parse(readFileSync(outPath2, 'utf-8'));
+    // sha256 hex is 64 chars
+    expect(r1.content_hash).toMatch(/^[a-f0-9]{64}$/);
+    // Same command + same output = same hash (idempotent)
+    expect(r1.content_hash).toBe(r2.content_hash);
+  });
+
+  it('test_files_line should extract the Test Files line from vitest output', async () => {
+    // Simulate vitest output
+    const outPath = join(tmpDir, 'test-files.json');
+    const fakeOutput = 'Some header\nTest Files  1 passed (1)\nSome footer';
+    await runCapture(`echo "${fakeOutput}"`, outPath, { cwd: tmpDir });
+    const parsed = JSON.parse(readFileSync(outPath, 'utf-8'));
+    expect(parsed.test_files_line).toBe('Test Files  1 passed (1)');
+  });
+
+  it('test_files_line should be null when no Test Files line present', async () => {
+    const outPath = join(tmpDir, 'no-test-files.json');
+    await runCapture('echo "no match here"', outPath, { cwd: tmpDir });
+    const parsed = JSON.parse(readFileSync(outPath, 'utf-8'));
+    expect(parsed.test_files_line).toBeNull();
+  });
+
+  it('git_sha should be a 40-char hex string from HEAD', async () => {
+    const outPath = join(tmpDir, 'git-sha.json');
+    const result = await runCapture('echo "x"', outPath, { cwd: tmpDir });
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
+  it('timestamp should be an ISO string', async () => {
+    const outPath = join(tmpDir, 'ts.json');
+    const result = await runCapture('echo "x"', outPath, { cwd: tmpDir });
+    expect(() => new Date(result.timestamp)).not.toThrow();
+    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
+  });
+
+  it('command field should match the command argument', async () => {
+    const outPath = join(tmpDir, 'cmd.json');
+    const cmd = 'echo "specific command"';
+    const result = await runCapture(cmd, outPath, { cwd: tmpDir });
+    expect(result.command).toBe(cmd);
+  });
+});
diff --git a/workflows/verify-code/capture.mjs b/workflows/verify-code/capture.mjs
new file mode 100644
index 0000000..0a6228b
--- /dev/null
+++ b/workflows/verify-code/capture.mjs
@@ -0,0 +1,80 @@
+import { execSync } from 'node:child_process';
+import { writeFileSync, mkdirSync } from 'node:fs';
+import { dirname, resolve } from 'node:path';
+import { createHash } from 'node:crypto';
+
+/**
+ * Walk up from a directory to find the nearest git repo root.
+ * Returns process.cwd() if no .git found anywhere.
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
+  return process.cwd();
+}
+
+/**
+ * Run a shell command and capture physical facts to a durable JSON file.
+ * Never throws on command failure (F3 non-blocking).
+ */
+export async function runCapture(command, outputPath, { cwd, gitSha } = {}) {
+  // Ensure output directory exists
+  mkdirSync(dirname(outputPath), { recursive: true });
+
+  let exit_code;
+  let stdout = '';
+  try {
+    stdout = execSync(command, { cwd, encoding: 'utf-8', stdio: 'pipe' }).toString();
+    exit_code = 0;
+  } catch (err) {
+    stdout = (err.stdout || '').toString();
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
+      try {
+        sha = execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf-8', stdio: 'pipe' }).trim();
+      } catch {
+        sha = 'unknown';
+      }
+    }
+  }
+
+  // Extract Test Files line
+  const testFilesLine = stdout.split('\n').find(l => l.trimStart().startsWith('Test Files'));
+  const test_files_line = testFilesLine ? testFilesLine.trim() : null;
+
+  // Compute content hash
+  const content_hash = createHash('sha256').update(stdout).digest('hex');
+
+  const timestamp = new Date().toISOString();
+
+  const record = {
+    command,
+    cwd: cwd || process.cwd(),
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

## 要求
逐条核8条需求覆盖、代码质量、测试可证伪性。给 verdict (pass/revise_required/escalate_to_human)。blocking finding 带文件:行号+证据。只回 verdict+findings。

## Final prompt

你是独立代码审查员。审查 workflowhub M9 verify-code Phase 1 交付物：capture.mjs 物理事实采集脚本。

## 需求（tasks.md Phase 1）
1. runCapture(command, outputPath, opts) — 执行命令写 JSON，返回 { exit_code, git_sha, test_files_line, content_hash, timestamp, command }
2. exit_code 真实整数；失败命令不抛异常（F3）；content_hash sha256 幂等
3. test_files_line 提取'Test Files'行，无匹配 null；git_sha 40位hex可stub覆盖
4. outputPath 目录不存在时自动创建；ESM .mjs Node 22

## 待审代码
diff --git a/tests/verify-code-capture.test.mjs b/tests/verify-code-capture.test.mjs
new file mode 100644
index 0000000..c1f4a89
--- /dev/null
+++ b/tests/verify-code-capture.test.mjs
@@ -0,0 +1,118 @@
+import { describe, it, expect, beforeAll, afterAll } from 'vitest';
+import { runCapture } from '../workflows/verify-code/capture.mjs';
+import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
+import { join } from 'node:path';
+import { tmpdir } from 'node:os';
+import { createHash } from 'node:crypto';
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
+    const result = await runCapture('echo "hello"', outPath, { cwd: tmpDir });
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
+    const result = await runCapture('echo "ok"', outPath, { cwd: tmpDir });
+    expect(typeof result.exit_code).toBe('number');
+    expect(Number.isInteger(result.exit_code)).toBe(true);
+    expect(result.exit_code).toBe(0);
+  });
+
+  it('exit_code should be non-zero for failing commands', async () => {
+    const outPath = join(tmpDir, 'fail-code.json');
+    const result = await runCapture('exit 42', outPath, { cwd: tmpDir });
+    expect(typeof result.exit_code).toBe('number');
+    expect(result.exit_code).toBe(42);
+  });
+
+  it('should write JSON to outputPath even when command fails (no throw)', async () => {
+    const outPath = join(tmpDir, 'no-throw.json');
+    // Should not throw
+    await runCapture('exit 1', outPath, { cwd: tmpDir });
+    const raw = readFileSync(outPath, 'utf-8');
+    const parsed = JSON.parse(raw);
+    expect(parsed.exit_code).toBe(1);
+    expect(parsed.command).toBe('exit 1');
+  });
+
+  it('should create outputPath directory if it does not exist', async () => {
+    const nestedPath = join(tmpDir, 'nested', 'deep', 'out.json');
+    await runCapture('echo "nested"', nestedPath, { cwd: tmpDir });
+    const raw = readFileSync(nestedPath, 'utf-8');
+    const parsed = JSON.parse(raw);
+    expect(parsed.exit_code).toBe(0);
+  });
+
+  it('content_hash should be sha256 hex and idempotent', async () => {
+    const outPath1 = join(tmpDir, 'hash1.json');
+    const outPath2 = join(tmpDir, 'hash2.json');
+    await runCapture('echo "same output"', outPath1, { cwd: tmpDir });
+    await runCapture('echo "same output"', outPath2, { cwd: tmpDir });
+    const r1 = JSON.parse(readFileSync(outPath1, 'utf-8'));
+    const r2 = JSON.parse(readFileSync(outPath2, 'utf-8'));
+    // sha256 hex is 64 chars
+    expect(r1.content_hash).toMatch(/^[a-f0-9]{64}$/);
+    // Same command + same output = same hash (idempotent)
+    expect(r1.content_hash).toBe(r2.content_hash);
+  });
+
+  it('test_files_line should extract the Test Files line from vitest output', async () => {
+    // Simulate vitest output
+    const outPath = join(tmpDir, 'test-files.json');
+    const fakeOutput = 'Some header\nTest Files  1 passed (1)\nSome footer';
+    await runCapture(`echo "${fakeOutput}"`, outPath, { cwd: tmpDir });
+    const parsed = JSON.parse(readFileSync(outPath, 'utf-8'));
+    expect(parsed.test_files_line).toBe('Test Files  1 passed (1)');
+  });
+
+  it('test_files_line should be null when no Test Files line present', async () => {
+    const outPath = join(tmpDir, 'no-test-files.json');
+    await runCapture('echo "no match here"', outPath, { cwd: tmpDir });
+    const parsed = JSON.parse(readFileSync(outPath, 'utf-8'));
+    expect(parsed.test_files_line).toBeNull();
+  });
+
+  it('git_sha should be a 40-char hex string from HEAD', async () => {
+    const outPath = join(tmpDir, 'git-sha.json');
+    const result = await runCapture('echo "x"', outPath, { cwd: tmpDir });
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
+  it('timestamp should be an ISO string', async () => {
+    const outPath = join(tmpDir, 'ts.json');
+    const result = await runCapture('echo "x"', outPath, { cwd: tmpDir });
+    expect(() => new Date(result.timestamp)).not.toThrow();
+    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
+  });
+
+  it('command field should match the command argument', async () => {
+    const outPath = join(tmpDir, 'cmd.json');
+    const cmd = 'echo "specific command"';
+    const result = await runCapture(cmd, outPath, { cwd: tmpDir });
+    expect(result.command).toBe(cmd);
+  });
+});
diff --git a/workflows/verify-code/capture.mjs b/workflows/verify-code/capture.mjs
new file mode 100644
index 0000000..0a6228b
--- /dev/null
+++ b/workflows/verify-code/capture.mjs
@@ -0,0 +1,80 @@
+import { execSync } from 'node:child_process';
+import { writeFileSync, mkdirSync } from 'node:fs';
+import { dirname, resolve } from 'node:path';
+import { createHash } from 'node:crypto';
+
+/**
+ * Walk up from a directory to find the nearest git repo root.
+ * Returns process.cwd() if no .git found anywhere.
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
+  return process.cwd();
+}
+
+/**
+ * Run a shell command and capture physical facts to a durable JSON file.
+ * Never throws on command failure (F3 non-blocking).
+ */
+export async function runCapture(command, outputPath, { cwd, gitSha } = {}) {
+  // Ensure output directory exists
+  mkdirSync(dirname(outputPath), { recursive: true });
+
+  let exit_code;
+  let stdout = '';
+  try {
+    stdout = execSync(command, { cwd, encoding: 'utf-8', stdio: 'pipe' }).toString();
+    exit_code = 0;
+  } catch (err) {
+    stdout = (err.stdout || '').toString();
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
+      try {
+        sha = execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf-8', stdio: 'pipe' }).trim();
+      } catch {
+        sha = 'unknown';
+      }
+    }
+  }
+
+  // Extract Test Files line
+  const testFilesLine = stdout.split('\n').find(l => l.trimStart().startsWith('Test Files'));
+  const test_files_line = testFilesLine ? testFilesLine.trim() : null;
+
+  // Compute content hash
+  const content_hash = createHash('sha256').update(stdout).digest('hex');
+
+  const timestamp = new Date().toISOString();
+
+  const record = {
+    command,
+    cwd: cwd || process.cwd(),
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

## 要求
逐条核8条需求覆盖、代码质量、测试可证伪性。给 verdict (pass/revise_required/escalate_to_human)。blocking finding 带文件:行号+证据。只回 verdict+findings。

## Raw output

```text
verdict: revise_required

findings:
- blocking: `workflows/verify-code/capture.mjs:50` 在取不到 git sha 时写入 `'unknown'`，不满足“`git_sha` 40 位 hex”的硬需求。需求允许 stub 覆盖，但没有允许非 hex 占位值。应明确失败：要么抛出清晰错误，要么要求 `opts.gitSha`，不要写假事实。
- blocking: `workflows/verify-code/capture.mjs:31-36` 失败命令只保存 `err.stdout`，丢弃 `err.stderr`。真实测试失败时摘要、报错、`Test Files` 行可能出现在 stderr，导致 `test_files_line` 和 `content_hash` 都不是完整物理输出事实。
- blocking: `workflows/verify-code/capture.mjs:55-56` `test_files_line` 只从 stdout 提取，不能证明失败测试场景下仍能提取 `Test Files` 行。Phase 1 要求覆盖失败命令不抛异常，这里应同时覆盖失败输出中的 `Test Files`。
- blocking: `tests/verify-code-capture.test.mjs:72-78` 用 `echo "${fakeOutput}"` 构造多行输出，依赖 shell 引号行为，测试脆弱；更稳的是用 `node -e` 或临时脚本精确写 stdout/stderr。
- blocking: `tests/verify-code-capture.test.mjs:88-92` `git_sha` 测试依赖当前仓库环境，不能证伪 `capture.mjs:50` 的 `'unknown'` 分支。应增加非 git cwd 且无 `gitSha` 的行为断言，或删除 fallback 占位逻辑。
- non-blocking: `workflows/verify-code/capture.mjs:64-65` 返回对象多了 `cwd` 字段。需求返回字段未包含它；如果后续消费者严格比对 schema，可能造成契约漂移。保留需在契约中声明。
- non-blocking: `tests/verify-code-capture.test.mjs:6` `createHash` 未使用，应删除。


2026-06-26T08:51:51.336213Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T08:51:51.336265Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/anti-forgery-evidence/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T08:51:51.336267Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-26T08:51:51.336268Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/stage-summary/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T08:51:51.336270Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/verify-change/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T08:51:51.336271Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/handoff/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T08:51:51.336272Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/design-fidelity-component-contract/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T08:51:51.336273Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/capture-workflow-feedback/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T08:51:51.336274Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/tdd-red-green/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T08:51:51.336276Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-26T08:51:51.336277Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-26T08:51:51.336278Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/browser-use/SKILL.md: missing YAML frontmatter delimited by ---
OpenAI Codex v0.135.0
--------
workdir: /Users/Hugh/Hugh/Project/workflowhub
model: gpt-5.5
provider: openai
approval: never
sandbox: danger-full-access
reasoning effort: medium
reasoning summaries: none
session id: 019f0320-d0a7-7121-a2d1-31a61bb07ad6
--------
user
你是独立代码审查员。审查 workflowhub M9 verify-code Phase 1 交付物：capture.mjs 物理事实采集脚本。

## 需求（tasks.md Phase 1）
1. runCapture(command, outputPath, opts) — 执行命令写 JSON，返回 { exit_code, git_sha, test_files_line, content_hash, timestamp, command }
2. exit_code 真实整数；失败命令不抛异常（F3）；content_hash sha256 幂等
3. test_files_line 提取'Test Files'行，无匹配 null；git_sha 40位hex可stub覆盖
4. outputPath 目录不存在时自动创建；ESM .mjs Node 22

## 待审代码
diff --git a/tests/verify-code-capture.test.mjs b/tests/verify-code-capture.test.mjs
new file mode 100644
index 0000000..c1f4a89
--- /dev/null
+++ b/tests/verify-code-capture.test.mjs
@@ -0,0 +1,118 @@
+import { describe, it, expect, beforeAll, afterAll } from 'vitest';
+import { runCapture } from '../workflows/verify-code/capture.mjs';
+import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
+import { join } from 'node:path';
+import { tmpdir } from 'node:os';
+import { createHash } from 'node:crypto';
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
+    const result = await runCapture('echo "hello"', outPath, { cwd: tmpDir });
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
+    const result = await runCapture('echo "ok"', outPath, { cwd: tmpDir });
+    expect(typeof result.exit_code).toBe('number');
+    expect(Number.isInteger(result.exit_code)).toBe(true);
+    expect(result.exit_code).toBe(0);
+  });
+
+  it('exit_code should be non-zero for failing commands', async () => {
+    const outPath = join(tmpDir, 'fail-code.json');
+    const result = await runCapture('exit 42', outPath, { cwd: tmpDir });
+    expect(typeof result.exit_code).toBe('number');
+    expect(result.exit_code).toBe(42);
+  });
+
+  it('should write JSON to outputPath even when command fails (no throw)', async () => {
+    const outPath = join(tmpDir, 'no-throw.json');
+    // Should not throw
+    await runCapture('exit 1', outPath, { cwd: tmpDir });
+    const raw = readFileSync(outPath, 'utf-8');
+    const parsed = JSON.parse(raw);
+    expect(parsed.exit_code).toBe(1);
+    expect(parsed.command).toBe('exit 1');
+  });
+
+  it('should create outputPath directory if it does not exist', async () => {
+    const nestedPath = join(tmpDir, 'nested', 'deep', 'out.json');
+    await runCapture('echo "nested"', nestedPath, { cwd: tmpDir });
+    const raw = readFileSync(nestedPath, 'utf-8');
+    const parsed = JSON.parse(raw);
+    expect(parsed.exit_code).toBe(0);
+  });
+
+  it('content_hash should be sha256 hex and idempotent', async () => {
+    const outPath1 = join(tmpDir, 'hash1.json');
+    const outPath2 = join(tmpDir, 'hash2.json');
+    await runCapture('echo "same output"', outPath1, { cwd: tmpDir });
+    await runCapture('echo "same output"', outPath2, { cwd: tmpDir });
+    const r1 = JSON.parse(readFileSync(outPath1, 'utf-8'));
+    const r2 = JSON.parse(readFileSync(outPath2, 'utf-8'));
+    // sha256 hex is 64 chars
+    expect(r1.content_hash).toMatch(/^[a-f0-9]{64}$/);
+    // Same command + same output = same hash (idempotent)
+    expect(r1.content_hash).toBe(r2.content_hash);
+  });
+
+  it('test_files_line should extract the Test Files line from vitest output', async () => {
+    // Simulate vitest output
+    const outPath = join(tmpDir, 'test-files.json');
+    const fakeOutput = 'Some header\nTest Files  1 passed (1)\nSome footer';
+    await runCapture(`echo "${fakeOutput}"`, outPath, { cwd: tmpDir });
+    const parsed = JSON.parse(readFileSync(outPath, 'utf-8'));
+    expect(parsed.test_files_line).toBe('Test Files  1 passed (1)');
+  });
+
+  it('test_files_line should be null when no Test Files line present', async () => {
+    const outPath = join(tmpDir, 'no-test-files.json');
+    await runCapture('echo "no match here"', outPath, { cwd: tmpDir });
+    const parsed = JSON.parse(readFileSync(outPath, 'utf-8'));
+    expect(parsed.test_files_line).toBeNull();
+  });
+
+  it('git_sha should be a 40-char hex string from HEAD', async () => {
+    const outPath = join(tmpDir, 'git-sha.json');
+    const result = await runCapture('echo "x"', outPath, { cwd: tmpDir });
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
+  it('timestamp should be an ISO string', async () => {
+    const outPath = join(tmpDir, 'ts.json');
+    const result = await runCapture('echo "x"', outPath, { cwd: tmpDir });
+    expect(() => new Date(result.timestamp)).not.toThrow();
+    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
+  });
+
+  it('command field should match the command argument', async () => {
+    const outPath = join(tmpDir, 'cmd.json');
+    const cmd = 'echo "specific command"';
+    const result = await runCapture(cmd, outPath, { cwd: tmpDir });
+    expect(result.command).toBe(cmd);
+  });
+});
diff --git a/workflows/verify-code/capture.mjs b/workflows/verify-code/capture.mjs
new file mode 100644
index 0000000..0a6228b
--- /dev/null
+++ b/workflows/verify-code/capture.mjs
@@ -0,0 +1,80 @@
+import { execSync } from 'node:child_process';
+import { writeFileSync, mkdirSync } from 'node:fs';
+import { dirname, resolve } from 'node:path';
+import { createHash } from 'node:crypto';
+
+/**
+ * Walk up from a directory to find the nearest git repo root.
+ * Returns process.cwd() if no .git found anywhere.
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
+  return process.cwd();
+}
+
+/**
+ * Run a shell command and capture physical facts to a durable JSON file.
+ * Never throws on command failure (F3 non-blocking).
+ */
+export async function runCapture(command, outputPath, { cwd, gitSha } = {}) {
+  // Ensure output directory exists
+  mkdirSync(dirname(outputPath), { recursive: true });
+
+  let exit_code;
+  let stdout = '';
+  try {
+    stdout = execSync(command, { cwd, encoding: 'utf-8', stdio: 'pipe' }).toString();
+    exit_code = 0;
+  } catch (err) {
+    stdout = (err.stdout || '').toString();
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
+      try {
+        sha = execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf-8', stdio: 'pipe' }).trim();
+      } catch {
+        sha = 'unknown';
+      }
+    }
+  }
+
+  // Extract Test Files line
+  const testFilesLine = stdout.split('\n').find(l => l.trimStart().startsWith('Test Files'));
+  const test_files_line = testFilesLine ? testFilesLine.trim() : null;
+
+  // Compute content hash
+  const content_hash = createHash('sha256').update(stdout).digest('hex');
+
+  const timestamp = new Date().toISOString();
+
+  const record = {
+    command,
+    cwd: cwd || process.cwd(),
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

## 要求
逐条核8条需求覆盖、代码质量、测试可证伪性。给 verdict (pass/revise_required/escalate_to_human)。blocking finding 带文件:行号+证据。只回 verdict+findings。
2026-06-26T08:51:52.375349Z ERROR rmcp::transport::worker: worker quit with fatal: Transport channel closed, when AuthRequired(AuthRequiredError { www_authenticate_header: "Bearer resource_metadata=\"https://mcp.figma.com/.well-known/oauth-protected-resource\",scope=\"mcp:connect\",authorization_uri=\"https://api.figma.com/.well-known/oauth-authorization-server\"" })
hook: SessionStart
hook: SessionStart Completed
hook: UserPromptSubmit
hook: UserPromptSubmit Completed
codex
verdict: revise_required

findings:
- blocking: `workflows/verify-code/capture.mjs:50` 在取不到 git sha 时写入 `'unknown'`，不满足“`git_sha` 40 位 hex”的硬需求。需求允许 stub 覆盖，但没有允许非 hex 占位值。应明确失败：要么抛出清晰错误，要么要求 `opts.gitSha`，不要写假事实。
- blocking: `workflows/verify-code/capture.mjs:31-36` 失败命令只保存 `err.stdout`，丢弃 `err.stderr`。真实测试失败时摘要、报错、`Test Files` 行可能出现在 stderr，导致 `test_files_line` 和 `content_hash` 都不是完整物理输出事实。
- blocking: `workflows/verify-code/capture.mjs:55-56` `test_files_line` 只从 stdout 提取，不能证明失败测试场景下仍能提取 `Test Files` 行。Phase 1 要求覆盖失败命令不抛异常，这里应同时覆盖失败输出中的 `Test Files`。
- blocking: `tests/verify-code-capture.test.mjs:72-78` 用 `echo "${fakeOutput}"` 构造多行输出，依赖 shell 引号行为，测试脆弱；更稳的是用 `node -e` 或临时脚本精确写 stdout/stderr。
- blocking: `tests/verify-code-capture.test.mjs:88-92` `git_sha` 测试依赖当前仓库环境，不能证伪 `capture.mjs:50` 的 `'unknown'` 分支。应增加非 git cwd 且无 `gitSha` 的行为断言，或删除 fallback 占位逻辑。
- non-blocking: `workflows/verify-code/capture.mjs:64-65` 返回对象多了 `cwd` 字段。需求返回字段未包含它；如果后续消费者严格比对 schema，可能造成契约漂移。保留需在契约中声明。
- non-blocking: `tests/verify-code-capture.test.mjs:6` `createHash` 未使用，应删除。
hook: Stop
hook: Stop Completed
tokens used
20,328

```

## Concise summary

Provider completed successfully. Review the raw output for details.

## Action items

- Review the response and extract decisions you want to apply.
- Capture follow-up implementation tasks if needed.
