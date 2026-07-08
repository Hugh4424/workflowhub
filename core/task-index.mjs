/**
 * core/task-index.mjs
 *
 * Appends and looks up task-id -> { projectKey, repo } records in
 * ~/.workflowhub/task-index.json. Fail-loud on duplicate append and
 * corrupt JSON; graceful null on missing file in lookup.
 */

import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

/** @type {string|null} — overridden by tests via __setIndexPathForTest. */
let _indexPath = null;

function getIndexPath() {
  if (_indexPath !== null) return _indexPath;
  _indexPath = join(homedir(), ".workflowhub", "task-index.json");
  return _indexPath;
}

/** @private Testing hook — override the index file path. */
export function __setIndexPathForTest(path) {
  _indexPath = path;
}

/**
 * Append a task-id record to the index.
 * Auto-creates the parent directory if needed.
 * Throws if the task-id already exists (fail-loud, no overwrite).
 *
 * @param {string} taskId
 * @param {string} projectKey
 * @param {string} repoUrl
 * @returns {void}
 */
export function appendTaskIndex(taskId, projectKey, repoUrl) {
  const indexPath = getIndexPath();
  const dir = dirname(indexPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  let index = {};
  if (existsSync(indexPath)) {
    const raw = readFileSync(indexPath, "utf-8");
    try {
      index = JSON.parse(raw);
    } catch (e) {
      throw new Error(`Corrupted task index file at ${indexPath}: ${e.message}`);
    }
  }

  if (taskId in index) {
    throw new Error(`Task "${taskId}" already exists in index`);
  }

  index[taskId] = { projectKey, repo: repoUrl };
  writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n");
}

/**
 * Look up a task-id in the index.
 * Returns { projectKey, repo } if found, or null if not found.
 * Returns null (not an error) when the index file does not exist.
 * Throws if the index file contains invalid JSON.
 *
 * @param {string} taskId
 * @returns {null|{ projectKey: string, repo: string }}
 */
export function lookupProjectKey(taskId) {
  const indexPath = getIndexPath();
  if (!existsSync(indexPath)) {
    return null;
  }

  const raw = readFileSync(indexPath, "utf-8");
  let index;
  try {
    index = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Corrupted task index file at ${indexPath}: ${e.message}`);
  }

  const entry = index[taskId];
  return entry ? { projectKey: entry.projectKey, repo: entry.repo } : null;
}
