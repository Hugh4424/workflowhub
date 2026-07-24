/**
 * diff-scanner.mjs
 * The exported scanDiff() remains pure for small/unit inputs. Phase evidence
 * scans Git output incrementally from an external temporary file so complete
 * diffs are never captured in a child-process buffer.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { closeSync, mkdtempSync, openSync, readFileSync, readSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

// Literal patterns matched against content lines (added/removed/context lines).
// These represent operations that appear as code content — not file paths.
const C2_IRREVERSIBLE_GIT_RULES = [
  // IMPORTANT: more-specific patterns must come before less-specific ones that are substrings
  // of them (e.g. 'git push --force' before 'git push'), because the loop breaks on first match.
  { type: 'irreversible_git', pattern: 'git push --force-with-lease' },
  { type: 'irreversible_git', pattern: 'git push --force' },
  { type: 'irreversible_git', pattern: 'git push --delete' },
  { type: 'irreversible_git', pattern: 'git push -f' },
  // irreversible_git: git push (base form, catches remaining push variants)
  { type: 'irreversible_git', pattern: 'git push' },
  // irreversible_git: branch deletion
  { type: 'irreversible_git', pattern: 'git branch -d' },
  { type: 'irreversible_git', pattern: 'git branch -D' },
  // irreversible_git: destructive reset
  { type: 'irreversible_git', pattern: 'git reset --hard' },
];

// File path patterns: matched against the CHANGED FILE PATH extracted from diff headers,
// NOT against arbitrary code content lines. This prevents false positives like
// `process.env.NODE_ENV` matching `.env`, or code referencing `package.json` as a string.
const C2_FILE_PATH_RULES = [
  // external_dep: manifest files — match when the changed file IS one of these manifests.
  // Matched against basename (filename only, no directory component).
  { type: 'external_dep', pattern: 'package.json', matchBasename: true },
  { type: 'external_dep', pattern: 'pnpm-lock.yaml', matchBasename: true },
  { type: 'external_dep', pattern: 'go.mod', matchBasename: true },
  { type: 'external_dep', pattern: 'go.sum', matchBasename: true },
  // prod_config: env files — match when the changed file basename is exactly `.env` or `.env.production`.
  // `.env.production` must come before `.env` so the more-specific match wins in display,
  // though both are checked independently (no break).
  { type: 'prod_config', pattern: '.env.production', matchBasename: true },
  { type: 'prod_config', pattern: '.env', matchBasename: true },
];

// Regex-based rules for more nuanced matching.
// Each entry: { type, pattern (display label), testLine(line) | testFilePath(path) }
const C2_REGEX_RULES = [
  // prod_config: path basenames/segments starting with deploy/infra/ci (matched against file path).
  // These fire based on the changed file's path, not content lines.
  {
    type: 'prod_config',
    pattern: 'deploy*',
    // Matches if any path segment (directory or filename) starts with "deploy".
    // Anchored to path separator so "deployment" matches but "mydeployment" mid-word does not.
    testFilePath: (filePath) => /(?:^|\/)deploy[^/]*(?:\/|$)/.test(filePath),
  },
  {
    type: 'prod_config',
    pattern: 'infra*',
    // Matches if any path segment starts with "infra" (e.g. "infra/terraform.tf").
    testFilePath: (filePath) => /(?:^|\/)infra[^/]*(?:\/|$)/.test(filePath),
  },
  {
    type: 'prod_config',
    pattern: 'ci*',
    // Matches if any path segment starts with "ci" — anchored to path boundary.
    // Avoids false positives like words containing "ci" (e.g. "special", "explicit").
    testFilePath: (filePath) => /(?:^|\/)ci[^/]*(?:\/|$)/.test(filePath),
  },
  // external_dep: plugin/package semver version bump — ONLY fires when the current file
  // is a package manifest (package.json). A `+const VERSION = "1.2.3"` in a .mjs file
  // must NOT fire this rule.
  {
    type: 'external_dep',
    pattern: 'plugin-semver-bump',
    // testLine is called with (line, currentFilePath). Returns true only for manifest files.
    testLine: (line, currentFilePath) => {
      if (!currentFilePath) return false;
      const basename = currentFilePath.split('/').pop();
      // Only fire when editing a package/plugin manifest
      if (basename !== 'package.json') return false;
      if (!/^[+-]/.test(line) || /^(\+\+\+|---)/.test(line)) return false;
      // Must contain a semver-like version string (^/~/>=/</<= prefix optional)
      return /["']?\^?\d+\.\d+\.\d+["']?/.test(line);
    },
  },
];

/**
 * Extract the file path from a `diff --git a/... b/...` header line.
 * Returns the b-side path (the "new" file path), or null if not a git diff header.
 * @param {string} line
 * @returns {string|null}
 */
function extractFilePath(line) {
  const m = line.match(/^diff --git a\S+ b\/(.+)$/);
  return m ? m[1] : null;
}

/**
 * Get the basename of a file path (last path component).
 * @param {string} filePath
 * @returns {string}
 */
function basename(filePath) {
  return filePath.split('/').pop();
}

/**
 * @param {string} diffText
 * @returns {{ violations: Array<{type: string, pattern: string, line: number}>, safe: boolean }}
 */
function createDiffLineScanner(ignoredPaths = new Set()) {
  const violations = [];
  const seen = new Set(); // deduplicate: one violation per (pattern, lineNum)

  let currentFilePath = null; // tracks which file the current hunk belongs to
  let currentFileIgnored = false;
  const filePathViolationsSeen = new Set(); // one file-path violation per (pattern, filePath)

  function scanLine(line, lineNum) {

    // Update current file path from diff header.
    const parsedPath = extractFilePath(line);
    if (parsedPath !== null) {
      currentFilePath = parsedPath;
      currentFileIgnored = ignoredPaths.has(currentFilePath);
      if (currentFileIgnored) return;

      // Check file-path rules against the changed file path (not content lines).
      const base = basename(currentFilePath);
      for (const rule of C2_FILE_PATH_RULES) {
        let matches = false;
        if (rule.matchBasename) {
          // Exact basename match for manifest/env files.
          // For `.env`: basename must be exactly `.env` or start with `.env.` to avoid
          // matching `.env.production` as `.env` (both are in the list separately).
          if (rule.pattern === '.env') {
            // Match exactly `.env` or `.env` followed by nothing else — no `.env.production`
            // double-match (that has its own rule). Match `.env` alone.
            matches = base === '.env';
          } else {
            matches = base === rule.pattern;
          }
        }
        if (matches) {
          const key = `${rule.pattern}:${currentFilePath}`;
          if (!filePathViolationsSeen.has(key)) {
            filePathViolationsSeen.add(key);
            violations.push({ type: rule.type, pattern: rule.pattern, line: lineNum });
            seen.add(`${rule.pattern}:${lineNum}`);
          }
        }
      }

      // Check file-path-based regex rules (testFilePath).
      for (const rule of C2_REGEX_RULES) {
        if (rule.testFilePath && rule.testFilePath(currentFilePath)) {
          const key = `${rule.pattern}:${currentFilePath}`;
          if (!filePathViolationsSeen.has(key)) {
            filePathViolationsSeen.add(key);
            violations.push({ type: rule.type, pattern: rule.pattern, line: lineNum });
            seen.add(`${rule.pattern}:${lineNum}`);
          }
        }
      }

      return; // header line processed; skip content-line checks
    }

    // Content rules (irreversible_git and testLine regex rules) must ONLY fire on ADDED lines —
    // lines the developer is introducing. A unified added-line guard: the line must start with '+'
    // but NOT be a '+++' file header (those are diff metadata, not content).
    // Context lines (' ') and removed lines ('-') are intentionally excluded:
    //   - Context lines are pre-existing surrounding code — not what the developer is adding.
    //   - Removed lines represent code being DELETED — a git op being removed is not a new violation.
    const isAddedLine = !currentFileIgnored && line.startsWith('+') && !line.startsWith('+++');
    if (!isAddedLine) return;

    // Check irreversible_git rules against added content lines only.
    for (const rule of C2_IRREVERSIBLE_GIT_RULES) {
      if (line.includes(rule.pattern)) {
        const key = `${rule.pattern}:${lineNum}`;
        if (!seen.has(key)) {
          seen.add(key);
          violations.push({ type: rule.type, pattern: rule.pattern, line: lineNum });
        }
        break;
      }
    }

    // Check content-line regex rules (testLine — e.g. plugin-semver-bump scoped to manifests).
    for (const rule of C2_REGEX_RULES) {
      if (rule.testLine && rule.testLine(line, currentFilePath)) {
        const key = `${rule.pattern}:${lineNum}`;
        if (!seen.has(key)) {
          seen.add(key);
          violations.push({ type: rule.type, pattern: rule.pattern, line: lineNum });
        }
      }
    }
  }

  return {
    scanLine,
    result: () => ({ violations, safe: violations.length === 0 }),
  };
}

/**
 * @param {string} diffText
 * @returns {{ violations: Array<{type: string, pattern: string, line: number}>, safe: boolean }}
 */
export function scanDiff(diffText) {
  const scanner = createDiffLineScanner();
  const lines = diffText.split('\n');
  for (let index = 0; index < lines.length; index++) {
    scanner.scanLine(lines[index], index + 1);
  }
  return scanner.result();
}

/** Process a UTF-8 text file one complete line at a time, without readFile(). */
function scanTextFileLines(filePath, onLine) {
  const descriptor = openSync(filePath, 'r');
  const buffer = Buffer.allocUnsafe(64 * 1024);
  const decoder = new TextDecoder('utf-8');
  let pending = '';
  let lineNumber = 0;
  try {
    for (;;) {
      const bytesRead = readSync(descriptor, buffer, 0, buffer.length, null);
      if (bytesRead === 0) break;
      pending += decoder.decode(buffer.subarray(0, bytesRead), { stream: true });
      for (;;) {
        const newline = pending.indexOf('\n');
        if (newline < 0) break;
        onLine(pending.slice(0, newline), ++lineNumber);
        pending = pending.slice(newline + 1);
      }
    }
    pending += decoder.decode();
    // String#split("\n") always yields the trailing empty line, including for
    // an empty file. Preserve the pure scanner's line-number semantics.
    onLine(pending, ++lineNumber);
  } finally {
    closeSync(descriptor);
  }
}

/**
 * Stream a complete frozen diff from a host-private file. This intentionally
 * has no byte limit: a late hunk must be checked just as rigorously as the first.
 */
export function scanDiffFile(filePath, ignoredPaths = new Set()) {
  if (typeof filePath !== 'string' || !isAbsolute(filePath)) throw new TypeError('diff file path must be absolute');
  const scanner = createDiffLineScanner(ignoredPaths);
  scanTextFileLines(filePath, (line, lineNumber) => scanner.scanLine(line, lineNumber));
  return scanner.result();
}

function externalTempDirectory(sourceRoot) {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), 'workflowhub-phase-diff-')));
  const relation = relative(sourceRoot, directory);
  if (relation === '' || (!relation.startsWith('..') && !isAbsolute(relation))) {
    rmSync(directory, { recursive: true, force: true });
    throw new Error('PHASE_DIFF_SCAN_INVALID: temporary diff storage must be outside source root');
  }
  return directory;
}

function runGitToFiles(root, args, stdoutPath, stderrPath, { allowFailure = false } = {}) {
  const stdout = openSync(stdoutPath, 'w', 0o600);
  const stderr = openSync(stderrPath, 'w', 0o600);
  let result;
  try {
    result = spawnSync('git', args, { cwd: root, stdio: ['ignore', stdout, stderr] });
  } finally {
    closeSync(stdout);
    closeSync(stderr);
  }
  if (result.error) throw new Error(`PHASE_DIFF_SCAN_INVALID: ${result.error.message}`);
  if (!allowFailure && result.status !== 0) {
    const detail = readFileSync(stderrPath, 'utf8').trim();
    throw new Error(`PHASE_DIFF_SCAN_INVALID: ${detail || `git ${args.join(' ')} exited ${result.status}`}`);
  }
  return result.status;
}

function gitText(root, temporaryRoot, label, args) {
  const stdoutPath = join(temporaryRoot, `${label}.stdout`);
  const stderrPath = join(temporaryRoot, `${label}.stderr`);
  runGitToFiles(root, args, stdoutPath, stderrPath);
  return readFileSync(stdoutPath, 'utf8').trim();
}

function readNullDelimited(filePath) {
  const descriptor = openSync(filePath, 'r');
  const buffer = Buffer.allocUnsafe(64 * 1024);
  let pending = Buffer.alloc(0);
  const fields = [];
  try {
    for (;;) {
      const bytesRead = readSync(descriptor, buffer, 0, buffer.length, null);
      if (bytesRead === 0) break;
      const chunk = buffer.subarray(0, bytesRead);
      const combined = pending.length > 0 ? Buffer.concat([pending, chunk]) : chunk;
      let start = 0;
      for (let index = 0; index < combined.length; index++) {
        if (combined[index] !== 0) continue;
        fields.push(combined.subarray(start, index).toString('utf8'));
        start = index + 1;
      }
      // The reusable read buffer is overwritten on the next read, so retain
      // only the incomplete NUL-delimited field.
      pending = Buffer.from(combined.subarray(start));
    }
    if (pending.length > 0) fields.push(pending.toString('utf8'));
  } finally {
    closeSync(descriptor);
  }
  return fields;
}

function changedPathsFromFile(filePath) {
  const fields = readNullDelimited(filePath);
  const paths = [];
  for (let index = 0; index < fields.length;) {
    const status = fields[index++];
    const first = fields[index++];
    if (status.startsWith('R') || status.startsWith('C')) {
      paths.push(first, fields[index++]);
    } else {
      paths.push(first);
    }
  }
  return [...new Set(paths)].sort();
}

const AUTO_MANAGED_RUNTIME_BLOCK = /<!-- BEGIN ([A-Z][A-Z0-9_-]*-RUNTIME) \(auto-managed; do not edit\) -->\r?\n[\s\S]*?<!-- END \1 -->\r?\n?/g;

function regularTextFileAt(root, commit, path) {
  try {
    const entry = execFileSync('git', ['ls-tree', '-z', commit, '--', path], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    if (entry === '') return null;
    const match = entry.match(/^(100[0-7]{3}) blob [a-f0-9]{40,64}\t/);
    if (!match) return { regular: false };
    const text = execFileSync('git', ['show', `${commit}:${path}`], { cwd: root, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
    return { regular: true, mode: match[1], text };
  } catch {
    return null;
  }
}

function removeAutoManagedRuntimeBlocks(text) {
  const names = [];
  const content = text.replace(AUTO_MANAGED_RUNTIME_BLOCK, (_, name) => { names.push(name); return ''; });
  return { count: names.length, names, content: `${content.trimEnd()}\n` };
}

function runtimeControlledChange(root, baselineCommit, implementationCommit, path) {
  if (path !== 'AGENTS.md') return null;
  const baseline = regularTextFileAt(root, baselineCommit, path);
  const implementation = regularTextFileAt(root, implementationCommit, path);
  if (!baseline?.regular || !implementation?.regular || baseline.mode !== implementation.mode || baseline.text === implementation.text) return null;
  const before = removeAutoManagedRuntimeBlocks(baseline.text);
  const after = removeAutoManagedRuntimeBlocks(implementation.text);
  if (before.count === 0 && after.count === 0) return null;
  if (before.count > 0 && after.count > 0 && JSON.stringify(before.names) !== JSON.stringify(after.names)) return null;
  if (before.content !== after.content) return null;
  return { path, baseline_runtime_blocks: before.count, implementation_runtime_blocks: after.count };
}

/** Build the canonical evidence consumed by phase review and phase-gate. */
export function createPhaseDiffScan({ sourceRoot, phaseId, baselineCommit, implementationCommit, allowedFiles = [] } = {}) {
  if (typeof sourceRoot !== 'string' || !isAbsolute(sourceRoot)) throw new TypeError('sourceRoot must be absolute');
  if (typeof phaseId !== 'string' || !/^[A-Za-z0-9._-]+$/.test(phaseId)) throw new TypeError('phaseId is invalid');
  for (const [label, value] of [['baselineCommit', baselineCommit], ['implementationCommit', implementationCommit]]) {
    if (typeof value !== 'string' || !/^[a-f0-9]{40,64}$/.test(value)) throw new TypeError(`${label} is invalid`);
  }
  if (!Array.isArray(allowedFiles) || !allowedFiles.every((value) => typeof value === 'string' && value.length > 0 && !value.startsWith('/') && !value.split('/').includes('..'))) {
    throw new TypeError('allowedFiles must contain repository-relative paths');
  }

  const root = realpathSync(sourceRoot);
  const temporaryRoot = externalTempDirectory(root);
  try {
    const base = gitText(root, temporaryRoot, 'baseline', ['rev-parse', '--verify', `${baselineCommit}^{commit}`]);
    const implementation = gitText(root, temporaryRoot, 'implementation', ['rev-parse', '--verify', `${implementationCommit}^{commit}`]);
    const ancestorStatus = runGitToFiles(
      root,
      ['merge-base', '--is-ancestor', base, implementation],
      join(temporaryRoot, 'ancestor.stdout'),
      join(temporaryRoot, 'ancestor.stderr'),
      { allowFailure: true },
    );
    if (ancestorStatus !== 0) throw new Error('PHASE_DIFF_SCAN_INVALID: baselineCommit must be an ancestor of implementationCommit');
    const snapshotTree = gitText(root, temporaryRoot, 'snapshot-tree', ['rev-parse', '--verify', `${implementation}^{tree}`]);
    const changedPathsFile = join(temporaryRoot, 'changed-paths.nul');
    runGitToFiles(root, ['diff', '--name-status', '-z', '-M', base, implementation], changedPathsFile, join(temporaryRoot, 'changed-paths.stderr'));
    const changed_files = changedPathsFromFile(changedPathsFile);
    const runtime_controlled_changes = changed_files.map((path) => runtimeControlledChange(root, base, implementation, path)).filter(Boolean);
    const runtimeControlledPaths = new Set(runtime_controlled_changes.map(({ path }) => path));
    const diffPath = join(temporaryRoot, 'phase.diff');
    runGitToFiles(root, ['diff', '-M', '--binary', '--no-ext-diff', base, implementation], diffPath, join(temporaryRoot, 'phase.diff.stderr'));
    const c2 = scanDiffFile(diffPath, runtimeControlledPaths);
    const allowed = new Set(allowedFiles);
    const allowlist_violations = changed_files.filter((path) => !allowed.has(path) && !runtimeControlledPaths.has(path)).map((path) => ({ path }));
    const c2_violations = c2.violations;
    return {
      schema_version: 'phase-diff-scan.v1',
      phase_id: phaseId,
      allowed_files: [...allowed].sort(),
      baseline_commit: base,
      implementation_commit: implementation,
      snapshot_tree: snapshotTree,
      changed_files,
      runtime_controlled_changes,
      safe: c2_violations.length === 0 && allowlist_violations.length === 0,
      violations: c2_violations,
      c2_violations,
      allowlist_violations,
    };
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

function cliArguments(argv) {
  const values = new Map();
  const repeatedAllowed = [];
  for (const argument of argv) {
    const separator = argument.indexOf('=');
    if (!argument.startsWith('--') || separator < 3) throw new Error(`unknown argument: ${argument}`);
    const key = argument.slice(2, separator);
    const value = argument.slice(separator + 1);
    if (key === 'allowed-file') repeatedAllowed.push(value);
    else if (values.has(key)) throw new Error(`duplicate argument: --${key}`);
    else values.set(key, value);
  }
  const allowedFilePath = values.get('allowed-files-json');
  if (allowedFilePath && !isAbsolute(allowedFilePath)) throw new TypeError('--allowed-files-json must be absolute');
  const fromFile = allowedFilePath ? JSON.parse(readFileSync(allowedFilePath, 'utf8')) : [];
  return {
    sourceRoot: values.get('source-root'),
    phaseId: values.get('phase-id'),
    baselineCommit: values.get('baseline-commit'),
    implementationCommit: values.get('implementation-commit'),
    allowedFiles: [...fromFile, ...repeatedAllowed],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.stdout.write(`${JSON.stringify(createPhaseDiffScan(cliArguments(process.argv.slice(2))))}\n`);
  } catch (error) {
    process.stderr.write(`${error?.stack || error}\n`);
    process.exitCode = 1;
  }
}
