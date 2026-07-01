import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function runCapture(command, outputPath, { cwd, gitSha, redBaselineHash } = {}) {
  const resolvedCwd = cwd ?? process.cwd();

  // Execute the command
  const proc = spawnSync(command, { shell: true, cwd: resolvedCwd });
  const stdout = proc.stdout ? proc.stdout.toString() : '';
  const stderr = proc.stderr ? proc.stderr.toString() : '';
  const exit_code = proc.status ?? 1;

  // Compute content hash from stdout
  const content_hash = createHash('sha256').update(stdout).digest('hex');

  // Extract Test Files line (must START with "Test Files", not merely contain it)
  const test_files_line = stdout.split('\n').find(l => l.trimStart().startsWith('Test Files')) ?? null;

  // Resolve git_sha
  let git_sha = gitSha;
  if (git_sha == null) {
    try {
      const gitProc = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: resolvedCwd });
      git_sha = gitProc.stdout ? gitProc.stdout.toString().trim() : 'unknown';
      if (!git_sha) git_sha = 'unknown';
    } catch {
      git_sha = 'unknown';
    }
  }

  const timestamp = new Date().toISOString();
  const commit_sha = null;
  const base_sha = null;
  const head_sha = null;
  const risk_level = null;

  // Auto-create output dir
  mkdirSync(dirname(outputPath), { recursive: true });

  const stdout_path = `${outputPath}.stdout`;
  const stderr_path = `${outputPath}.stderr`;

  // Compute anomaly_flags
  const anomaly_flags = [];
  if (exit_code !== 0 && redBaselineHash != null && content_hash === redBaselineHash) {
    anomaly_flags.push('suspicious_red_exit');
  }
  if (exit_code === 0 && redBaselineHash != null && content_hash === redBaselineHash) {
    anomaly_flags.push('suspicious_green_exit');
  }
  if (exit_code === 0 && test_files_line === null) {
    anomaly_flags.push('green_test_files_empty');
  }

  const warning = anomaly_flags.length > 0 ? 'anomalies: ' + anomaly_flags.join(', ') : '';

  const result = {
    command,
    cwd: resolvedCwd,
    git_sha,
    commit_sha,
    base_sha,
    head_sha,
    risk_level,
    exit_code,
    timestamp,
    test_files_line,
    content_hash,
    stdout_path,
    stderr_path,
    anomaly_flags,
    warning,
  };

  // Write sidecars first, then main JSON last (partial-write leaves sidecars but JSON only appears fully assembled)
  writeFileSync(stdout_path, stdout);
  writeFileSync(stderr_path, stderr);
  writeFileSync(outputPath, JSON.stringify(result, null, 2));
  return result;
}

// CLI entrypoint — only runs when executed directly, not when imported
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h') || args.length < 2) {
    console.log(
      'Usage: node capture.mjs <command> <outputPath> [--cwd=<dir>] [--git-sha=<sha>] [--red-baseline-hash=<hash>]'
    );
    process.exit(0);
  }

  const [command, outputPath, ...flags] = args;
  const opts = {};
  for (const flag of flags) {
    if (flag.startsWith('--cwd=')) opts.cwd = flag.slice('--cwd='.length);
    else if (flag.startsWith('--git-sha=')) opts.gitSha = flag.slice('--git-sha='.length);
    else if (flag.startsWith('--red-baseline-hash=')) opts.redBaselineHash = flag.slice('--red-baseline-hash='.length);
  }

  const result = await runCapture(command, outputPath, opts);
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}
