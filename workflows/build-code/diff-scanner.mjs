/**
 * diff-scanner.mjs
 * Pure function: scan diff text for C2 violations. No IO, no side effects.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { isAbsolute } from 'node:path';
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
export function scanDiff(diffText) {
  const lines = diffText.split('\n');
  const violations = [];
  const seen = new Set(); // deduplicate: one violation per (pattern, lineNum)

  let currentFilePath = null; // tracks which file the current hunk belongs to
  const filePathViolationsSeen = new Set(); // one file-path violation per (pattern, filePath)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Update current file path from diff header.
    const parsedPath = extractFilePath(line);
    if (parsedPath !== null) {
      currentFilePath = parsedPath;

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

      continue; // header line processed; skip content-line checks
    }

    // Content rules (irreversible_git and testLine regex rules) must ONLY fire on ADDED lines —
    // lines the developer is introducing. A unified added-line guard: the line must start with '+'
    // but NOT be a '+++' file header (those are diff metadata, not content).
    // Context lines (' ') and removed lines ('-') are intentionally excluded:
    //   - Context lines are pre-existing surrounding code — not what the developer is adding.
    //   - Removed lines represent code being DELETED — a git op being removed is not a new violation.
    const isAddedLine = line.startsWith('+') && !line.startsWith('+++');
    if (!isAddedLine) continue;

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

  return { violations, safe: violations.length === 0 };
}

function git(root, args) {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 128 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    throw new Error(`PHASE_DIFF_SCAN_INVALID: ${error.stderr?.trim() || error.message}`);
  }
}

function changedPaths(root, baselineCommit, implementationCommit) {
  const raw = execFileSync('git', ['diff', '--name-status', '-z', '-M', baselineCommit, implementationCommit], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const fields = raw.split('\0');
  if (fields.at(-1) === '') fields.pop();
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
  const base = git(root, ['rev-parse', '--verify', `${baselineCommit}^{commit}`]);
  const implementation = git(root, ['rev-parse', '--verify', `${implementationCommit}^{commit}`]);
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', base, implementation], {
      cwd: root,
      stdio: ['ignore', 'ignore', 'pipe'],
    });
  } catch {
    throw new Error('PHASE_DIFF_SCAN_INVALID: baselineCommit must be an ancestor of implementationCommit');
  }
  const snapshotTree = git(root, ['rev-parse', '--verify', `${implementation}^{tree}`]);
  const diff = execFileSync('git', ['diff', '-M', '--binary', '--no-ext-diff', base, implementation], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const c2 = scanDiff(diff);
  const changed_files = changedPaths(root, base, implementation);
  const allowed = new Set(allowedFiles);
  const allowlist_violations = changed_files.filter((path) => !allowed.has(path)).map((path) => ({ path }));
  const c2_violations = c2.violations;
  return {
    schema_version: 'phase-diff-scan.v1',
    phase_id: phaseId,
    baseline_commit: base,
    implementation_commit: implementation,
    snapshot_tree: snapshotTree,
    changed_files,
    safe: c2_violations.length === 0 && allowlist_violations.length === 0,
    violations: c2_violations,
    c2_violations,
    allowlist_violations,
  };
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
