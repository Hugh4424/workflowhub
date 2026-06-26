import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { runCapture } from '../workflows/verify-code/capture.mjs';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const STUB_SHA = '0'.repeat(40);

let tmpDir;

beforeAll(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'verify-code-capture-test-'));
});

afterAll(() => {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
});

describe('runCapture', () => {
  it('should return an object with expected keys on success', async () => {
    const outPath = join(tmpDir, 'success.json');
    const result = await runCapture('echo "hello"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
    expect(result).toHaveProperty('exit_code');
    expect(result).toHaveProperty('git_sha');
    expect(result).toHaveProperty('test_files_line');
    expect(result).toHaveProperty('content_hash');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('command');
    expect(result).toHaveProperty('cwd');
    expect(result.cwd).toBe(tmpDir);
  });

  it('exit_code should be a real integer (0 for success)', async () => {
    const outPath = join(tmpDir, 'exit-code.json');
    const result = await runCapture('echo "ok"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
    expect(typeof result.exit_code).toBe('number');
    expect(Number.isInteger(result.exit_code)).toBe(true);
    expect(result.exit_code).toBe(0);
  });

  it('exit_code should be non-zero for failing commands', async () => {
    const outPath = join(tmpDir, 'fail-code.json');
    const result = await runCapture('exit 42', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
    expect(typeof result.exit_code).toBe('number');
    expect(result.exit_code).toBe(42);
  });

  it('should write JSON to outputPath even when command fails (no throw)', async () => {
    const outPath = join(tmpDir, 'no-throw.json');
    await runCapture('exit 1', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
    const raw = readFileSync(outPath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.exit_code).toBe(1);
    expect(parsed.command).toBe('exit 1');
  });

  it('should create outputPath directory if it does not exist', async () => {
    const nestedPath = join(tmpDir, 'nested', 'deep', 'out.json');
    await runCapture('echo "nested"', nestedPath, { cwd: tmpDir, gitSha: STUB_SHA });
    const raw = readFileSync(nestedPath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.exit_code).toBe(0);
  });

  it('content_hash should be sha256 hex and idempotent', async () => {
    const outPath1 = join(tmpDir, 'hash1.json');
    const outPath2 = join(tmpDir, 'hash2.json');
    await runCapture('echo "same output"', outPath1, { cwd: tmpDir, gitSha: STUB_SHA });
    await runCapture('echo "same output"', outPath2, { cwd: tmpDir, gitSha: STUB_SHA });
    const r1 = JSON.parse(readFileSync(outPath1, 'utf-8'));
    const r2 = JSON.parse(readFileSync(outPath2, 'utf-8'));
    expect(r1.content_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(r1.content_hash).toBe(r2.content_hash);
  });

  it('test_files_line should extract the Test Files line from vitest stdout', async () => {
    const outPath = join(tmpDir, 'test-files-stdout.json');
    await runCapture(
      `printf '%s\\n' 'Some header' 'Test Files  1 passed (1)' 'Some footer'`,
      outPath,
      { cwd: tmpDir, gitSha: STUB_SHA }
    );
    const parsed = JSON.parse(readFileSync(outPath, 'utf-8'));
    expect(parsed.test_files_line).toBe('Test Files  1 passed (1)');
  });

  it('test_files_line should extract from stderr for failed commands', async () => {
    const outPath = join(tmpDir, 'test-files-stderr.json');
    await runCapture(
      `node -e "process.stdout.write('header\\n'); process.stderr.write('Test Files  1 failed (1)\\n'); process.stderr.write('footer\\n'); process.exit(1)"`,
      outPath,
      { cwd: tmpDir, gitSha: STUB_SHA }
    );
    const parsed = JSON.parse(readFileSync(outPath, 'utf-8'));
    expect(parsed.test_files_line).toBe('Test Files  1 failed (1)');
  });

  it('test_files_line should extract from stderr for successful commands (exit 0)', async () => {
    const outPath = join(tmpDir, 'test-files-stderr-ok.json');
    // exit 0 but Test Files line on stderr
    await runCapture(
      `node -e "process.stderr.write('Test Files  1 passed (1)\\n'); process.stdout.write('ok\\n'); process.exit(0)"`,
      outPath,
      { cwd: tmpDir, gitSha: STUB_SHA }
    );
    const parsed = JSON.parse(readFileSync(outPath, 'utf-8'));
    expect(parsed.test_files_line).toBe('Test Files  1 passed (1)');
    expect(parsed.exit_code).toBe(0);
  });

  it('test_files_line should be null when no Test Files line present', async () => {
    const outPath = join(tmpDir, 'no-test-files.json');
    await runCapture('echo "no match here"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
    const parsed = JSON.parse(readFileSync(outPath, 'utf-8'));
    expect(parsed.test_files_line).toBeNull();
  });

  it('git_sha should be a 40-char hex string from HEAD', async () => {
    const repoRoot = '/Users/Hugh/Hugh/Project/workflowhub';
    const outPath = join(tmpDir, 'git-sha.json');
    const result = await runCapture('echo "x"', outPath, { cwd: repoRoot });
    expect(result.git_sha).toMatch(/^[a-f0-9]{40}$/);
  });

  it('opts.gitSha should override git_sha (test stub)', async () => {
    const outPath = join(tmpDir, 'stub-sha.json');
    const stubSha = 'a'.repeat(40);
    const result = await runCapture('echo "x"', outPath, { cwd: tmpDir, gitSha: stubSha });
    expect(result.git_sha).toBe(stubSha);
  });

  it('should throw when git_sha cannot be determined and no gitSha override', async () => {
    const outPath = join(tmpDir, 'no-git.json');
    await expect(
      runCapture('echo "x"', outPath, { cwd: tmpDir, gitSha: undefined })
    ).rejects.toThrow(/git_sha/);
  });

  it('timestamp should be an ISO string', async () => {
    const outPath = join(tmpDir, 'ts.json');
    const result = await runCapture('echo "x"', outPath, { cwd: tmpDir, gitSha: STUB_SHA });
    expect(() => new Date(result.timestamp)).not.toThrow();
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });

  it('command field should match the command argument', async () => {
    const outPath = join(tmpDir, 'cmd.json');
    const cmd = 'echo "specific command"';
    const result = await runCapture(cmd, outPath, { cwd: tmpDir, gitSha: STUB_SHA });
    expect(result.command).toBe(cmd);
  });
});
