import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const MAX_BUFFER = 50 * 1024 * 1024; // 50 MB, handles large vitest/build output

function findGitRoot(startDir) {
  let dir = resolve(startDir);
  while (true) {
    try {
      const r = spawnSync('git', ['rev-parse', '--git-dir'], { cwd: dir, encoding: 'utf-8' });
      if (r.status === 0) return dir;
    } catch { /* continue */ }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export async function runCapture(command, outputPath, { cwd, gitSha } = {}) {
  mkdirSync(dirname(outputPath), { recursive: true });
  const resolvedCwd = cwd || process.cwd();

  const result = spawnSync(command, {
    shell: true,
    cwd: resolvedCwd,
    encoding: 'utf-8',
    maxBuffer: MAX_BUFFER,
  });

  const stdout = (result.stdout || '').toString();
  const stderr = (result.stderr || '').toString();

  // exit_code: signal → 128+signal, otherwise status ?? error→1
  let exit_code;
  if (result.signal) {
    exit_code = 128 + (typeof result.signal === 'string' && result.signal.startsWith('SIG')
      ? parseInt(result.signal.slice(3)) || 0 : 0);
  } else if (result.status !== null) {
    exit_code = result.status;
  } else if (result.error) {
    exit_code = 1;
  } else {
    exit_code = 0;
  }

  // git_sha
  let sha = gitSha;
  if (!sha) {
    try {
      sha = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: resolvedCwd, encoding: 'utf-8' }).stdout.trim();
      if (!sha) throw new Error('empty git sha');
    } catch {
      const repoRoot = findGitRoot(resolvedCwd);
      if (repoRoot) {
        sha = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf-8' }).stdout.trim();
      } else {
        throw new Error('Cannot determine git_sha: not in a git repository and no gitSha override provided');
      }
    }
  }

  const combined = stdout + '\n' + stderr;
  const testFilesLine = combined.split('\n').find(l => l.trimStart().startsWith('Test Files'));
  const test_files_line = testFilesLine ? testFilesLine.trim() : null;
  const content_hash = createHash('sha256').update(combined).digest('hex');
  const timestamp = new Date().toISOString();

  const record = { command, cwd: resolvedCwd, git_sha: sha, exit_code, timestamp, test_files_line, content_hash };
  writeFileSync(outputPath, JSON.stringify(record, null, 2), 'utf-8');
  return record;
}
