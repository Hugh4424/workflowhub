/**
 * snapshot-writer.mjs — T010b (FR-WHREVIEW-006)
 *
 * Two independent "prior-round materials baseline" mechanisms, one per
 * review-object type (data-contracts.md Contract 10 / Contract 12):
 *
 * - Document-type objects (spec.md/data-contracts.md/plan.md/tasks.md):
 *   `writeDocSnapshot()` persists the full original content of the doc
 *   before each round's submission, at
 *   `tasks/{task-id}/reviews/snapshots/{doc}-{review_flow_id}-r{N}.md`.
 *   For `total_round>=2`, `computeDocSnapshotDiff()` reads round(N-1)'s
 *   snapshot and text-diffs it against the current content — this diff is
 *   what T010c feeds into `materials` (never the full doc again). A missing
 *   round(N-1) snapshot is a fail-loud error, never a silent full-text
 *   fallback (Contract 10).
 *
 * - Non-document objects (build-code/verify-code/make-decision etc., source
 *   diffs / test reports / decision contracts): `writeMaterialsBaseline()`
 *   persists both a JSON metadata record (`git_sha`, `materials_content_hash`,
 *   `covered_paths`, `materials_snapshot_path`) and the full materials text
 *   itself, since a hash alone cannot answer "was this actually visible last
 *   round" for FR-WHREVIEW-005 exception (a)/(b) judging (Contract 12).
 *
 * Both mechanisms: written once before a round's submission, never
 * overwritten or deleted afterward — attempting to write over an existing
 * snapshot/baseline is itself a fail-loud error (protects the invariant, not
 * merely documents it), and reading a missing counterpart is fail-loud too.
 */

import { createHash, randomUUID } from "node:crypto";
import { basename, dirname, join } from "node:path";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { parseTaskDir } from "../../../core/task-dir-parser.mjs";
import {
  FailLoudError,
  assertSafeTaskId,
  assertSafeReviewFlowId,
  assertValidTotalRound,
  assertKnownStage,
  assertSafeIdentifier,
  taskRoot,
} from "./lib/safe-id.mjs";

// ---- doc-type snapshots (Contract 10) ----

export function docSnapshotPathFor({ taskTrackingRoot, taskId, doc, reviewFlowId, totalRound }) {
  return join(taskRoot(taskTrackingRoot, taskId), "reviews", "snapshots", `${doc}-${reviewFlowId}-r${totalRound}.md`);
}

/** Persist the full original doc content before this round's submission. Immutable once written. */
export function writeDocSnapshot({ taskId, doc, reviewFlowId, totalRound, content, taskTrackingRoot }) {
  assertSafeTaskId(taskId);
  assertSafeIdentifier("doc", doc);
  assertSafeReviewFlowId(reviewFlowId);
  assertValidTotalRound(totalRound);

  const root = taskTrackingRoot ?? parseTaskDir();
  const path = docSnapshotPathFor({ taskTrackingRoot: root, taskId, doc, reviewFlowId, totalRound });
  if (existsSync(path)) {
    throw new FailLoudError(`doc snapshot already exists at ${path}; snapshots are immutable once written`);
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  return { path };
}

/** Read a previously written doc snapshot. Fail-loud if it does not exist. */
export function readDocSnapshot({ taskId, doc, reviewFlowId, totalRound, taskTrackingRoot }) {
  assertSafeTaskId(taskId);
  assertSafeIdentifier("doc", doc);
  assertSafeReviewFlowId(reviewFlowId);
  assertValidTotalRound(totalRound);

  const root = taskTrackingRoot ?? parseTaskDir();
  const path = docSnapshotPathFor({ taskTrackingRoot: root, taskId, doc, reviewFlowId, totalRound });
  if (!existsSync(path)) {
    throw new FailLoudError(`doc snapshot not found at ${path} (round ${totalRound}); cannot fall back to full-text`);
  }
  return readFileSync(path, "utf8");
}

/**
 * Minimal line-based unified diff (no external deps). Good enough as
 * materials text — round-state.mjs/3rd-review only need a legible textual
 * delta, not a machine-appliable patch.
 */
export function unifiedTextDiff(oldText, newText) {
  const a = oldText.split("\n");
  const b = newText.split("\n");
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const lines = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      lines.push(`  ${a[i]}`);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      lines.push(`- ${a[i]}`);
      i++;
    } else {
      lines.push(`+ ${b[j]}`);
      j++;
    }
  }
  while (i < n) {
    lines.push(`- ${a[i]}`);
    i++;
  }
  while (j < m) {
    lines.push(`+ ${b[j]}`);
    j++;
  }
  return lines.join("\n");
}

/**
 * total_round>=2 only: diff round(N-1)'s snapshot against currentContent.
 * Fail-loud (via readDocSnapshot) if round(N-1) snapshot is missing.
 */
export function computeDocSnapshotDiff({ taskId, doc, reviewFlowId, totalRound, currentContent, taskTrackingRoot }) {
  assertValidTotalRound(totalRound);
  if (totalRound < 2) {
    throw new FailLoudError(`computeDocSnapshotDiff only applies to total_round>=2 (got ${totalRound})`);
  }
  const prevContent = readDocSnapshot({
    taskId,
    doc,
    reviewFlowId,
    totalRound: totalRound - 1,
    taskTrackingRoot,
  });
  return unifiedTextDiff(prevContent, currentContent);
}

// ---- non-doc materials baseline (Contract 12) ----

export function materialsBaselinePathFor({ taskTrackingRoot, taskId, stage, reviewFlowId, totalRound }) {
  return join(taskRoot(taskTrackingRoot, taskId), "reviews", `materials-baseline-${stage}-${reviewFlowId}-r${totalRound}.json`);
}

export function materialsSnapshotPathFor({ taskTrackingRoot, taskId, stage, reviewFlowId, totalRound }) {
  return join(taskRoot(taskTrackingRoot, taskId), "reviews", "snapshots", `materials-${stage}-${reviewFlowId}-r${totalRound}.txt`);
}

/** Write `content` to `path` via temp-file+rename so a crash mid-write never leaves a truncated file. */
function atomicWriteFileSync(path, content) {
  const dir = dirname(path);
  mkdirSync(dir, { recursive: true });
  const tmpPath = join(dir, `.${basename(path)}.tmp-${randomUUID()}`);
  writeFileSync(tmpPath, content);
  renameSync(tmpPath, path);
}

/**
 * Persist this round's materials baseline (JSON metadata + full-text
 * snapshot) before submitting to the 3rd-review engine. Immutable once
 * written — both parts, never just one.
 *
 * round-review finding: this used to write the .txt snapshot then the .json
 * metadata as two separate non-atomic writeFileSync calls; a crash between
 * them left a permanently-wedged half-baseline (the existence guard treated
 * either file alone as "already written, immutable" and refused to retry,
 * while readMaterialsBaseline fails since the JSON half is missing). Fixed:
 * each half is written via temp-file+rename (so neither half can itself be
 * left truncated), and the existence guard now distinguishes a genuine
 * complete-pair immutability violation (both halves present) from a
 * crash-induced partial write (exactly one half present), fail-loud with a
 * distinct, actionable message for the latter rather than silently refusing
 * under the same "already exists" message.
 */
export function writeMaterialsBaseline({
  taskId,
  stage,
  reviewFlowId,
  totalRound,
  gitSha,
  materialsContent,
  coveredPaths,
  taskTrackingRoot,
}) {
  assertSafeTaskId(taskId);
  assertKnownStage(stage);
  assertSafeReviewFlowId(reviewFlowId);
  assertValidTotalRound(totalRound);

  const root = taskTrackingRoot ?? parseTaskDir();
  const jsonPath = materialsBaselinePathFor({ taskTrackingRoot: root, taskId, stage, reviewFlowId, totalRound });
  const snapshotPath = materialsSnapshotPathFor({ taskTrackingRoot: root, taskId, stage, reviewFlowId, totalRound });

  const jsonExists = existsSync(jsonPath);
  const snapshotExists = existsSync(snapshotPath);

  if (jsonExists && snapshotExists) {
    throw new FailLoudError(
      `materials baseline for round ${totalRound} already exists (immutable once written): ${jsonPath}`
    );
  }
  if (jsonExists || snapshotExists) {
    throw new FailLoudError(
      `materials baseline for round ${totalRound} is in a partial/wedged state — only one of the two ` +
        `required files exists (json=${jsonExists ? "present" : "MISSING"} at ${jsonPath}, ` +
        `snapshot=${snapshotExists ? "present" : "MISSING"} at ${snapshotPath}). This indicates a prior ` +
        `crash mid-write, not a genuine immutability violation; manually clear the stale half before retrying.`
    );
  }

  const materialsContentHash = createHash("sha256").update(materialsContent).digest("hex");
  const materialsSnapshotRelPath = `reviews/snapshots/materials-${stage}-${reviewFlowId}-r${totalRound}.txt`;
  const record = {
    git_sha: gitSha,
    materials_content_hash: materialsContentHash,
    covered_paths: coveredPaths,
    materials_snapshot_path: materialsSnapshotRelPath,
  };

  atomicWriteFileSync(snapshotPath, materialsContent);
  atomicWriteFileSync(jsonPath, JSON.stringify(record, null, 2));
  return { jsonPath, snapshotPath, record };
}

/**
 * Read a previously written materials baseline (JSON metadata + full-text
 * snapshot). Fail-loud if either half is missing — never silently skip the
 * FR-WHREVIEW-005 exception (a)/(b) judgment that depends on it.
 */
export function readMaterialsBaseline({ taskId, stage, reviewFlowId, totalRound, taskTrackingRoot }) {
  assertSafeTaskId(taskId);
  assertKnownStage(stage);
  assertSafeReviewFlowId(reviewFlowId);
  assertValidTotalRound(totalRound);

  const root = taskTrackingRoot ?? parseTaskDir();
  const jsonPath = materialsBaselinePathFor({ taskTrackingRoot: root, taskId, stage, reviewFlowId, totalRound });
  if (!existsSync(jsonPath)) {
    throw new FailLoudError(`materials baseline not found at ${jsonPath} (round ${totalRound})`);
  }
  const record = JSON.parse(readFileSync(jsonPath, "utf8"));

  const snapshotPath = join(taskRoot(root, taskId), record.materials_snapshot_path);
  if (!existsSync(snapshotPath)) {
    throw new FailLoudError(`materials baseline snapshot missing at ${snapshotPath} (round ${totalRound})`);
  }
  const materialsContent = readFileSync(snapshotPath, "utf8");
  return { ...record, materialsContent };
}
