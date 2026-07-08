/**
 * report-index.mjs — T014 (FR-WHREVIEW-004 ¶156, data-contracts.md Contract 5)
 *
 * Maintains `tasks/{task-id}/reports/report-index.md`, a summary index
 * (column structure migrated from agenthub's `verifier-report-index.md`,
 * field names kept identical to reuse its rendering logic as a reference
 * implementation): `seq`/`timestamp`/`stage`/`report_kind`/`verdict`/
 * `report_path`/`summary`. Every render appends exactly one row — the index
 * is never overwritten, never loses prior history.
 */

import { dirname, join } from "node:path";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseTaskDir } from "../../../core/task-dir-parser.mjs";
import { FailLoudError, assertSafeTaskId, taskRoot } from "./lib/safe-id.mjs";

const HEADER_ROW = "| seq | timestamp | stage | report_kind | verdict | report_path | summary |";
const SEPARATOR_ROW = "|---|---|---|---|---|---|---|";

export function reportIndexPathFor({ taskTrackingRoot, taskId }) {
  return join(taskRoot(taskTrackingRoot, taskId), "reports", "report-index.md");
}

function escapeCell(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function parseExistingRows(content) {
  const lines = content.split("\n");
  const dataLines = lines.slice(2).filter((line) => line.trim().startsWith("|"));
  return dataLines;
}

/**
 * Append one row to the report index. Creates the file (with header) on the
 * first call for a given task-id; every subsequent call appends below the
 * existing rows, never truncating or reordering them. `seq` is computed as
 * `1 + (current row count)` unless explicitly supplied.
 */
export function appendReportIndexRow({
  taskId,
  stage,
  reportKind,
  verdict,
  reportPath,
  summary,
  timestamp,
  seq,
  taskTrackingRoot,
}) {
  assertSafeTaskId(taskId);
  if (!stage || !reportKind || !verdict || !reportPath) {
    throw new FailLoudError(
      `appendReportIndexRow requires stage/reportKind/verdict/reportPath (got stage=${JSON.stringify(stage)}, reportKind=${JSON.stringify(reportKind)}, verdict=${JSON.stringify(verdict)}, reportPath=${JSON.stringify(reportPath)})`
    );
  }

  const root = taskTrackingRoot ?? parseTaskDir();
  const path = reportIndexPathFor({ taskTrackingRoot: root, taskId });

  // round-review finding: this used to reconstruct the whole file from
  // parsed rows on every call (`[HEADER_ROW, SEPARATOR_ROW, ...existingRows, row]`
  // + writeFileSync), which silently drops any manual edits, comments, or
  // malformed lines already on disk — a real append-only violation. Instead:
  // count existing rows only (for seq), then physically append the new row
  // to whatever bytes are already there; the file is created fresh only when
  // it does not exist yet.
  const fileExists = existsSync(path);
  const existingContent = fileExists ? readFileSync(path, "utf8") : "";
  const existingRowCount = fileExists ? parseExistingRows(existingContent).length : 0;

  const resolvedSeq = seq ?? existingRowCount + 1;
  const resolvedTimestamp = timestamp ?? new Date().toISOString();
  const row = `| ${resolvedSeq} | ${escapeCell(resolvedTimestamp)} | ${escapeCell(stage)} | ${escapeCell(reportKind)} | ${escapeCell(verdict)} | ${escapeCell(reportPath)} | ${escapeCell(summary)} |`;

  mkdirSync(dirname(path), { recursive: true });
  if (fileExists) {
    // round-review finding: appendFileSync doesn't check for a trailing newline on the
    // existing file — if the last line has none, the new row glues onto the previous row and
    // corrupts the table. Check the last byte of what's already on disk and insert one first
    // if missing.
    const needsLeadingNewline = existingContent.length > 0 && !existingContent.endsWith("\n");
    appendFileSync(path, `${needsLeadingNewline ? "\n" : ""}${row}\n`);
  } else {
    writeFileSync(path, `${HEADER_ROW}\n${SEPARATOR_ROW}\n${row}\n`);
  }
  return { path, seq: resolvedSeq, row };
}

/** Read back all data rows (excluding header/separator) as raw markdown table-row strings. */
export function readReportIndexRows({ taskId, taskTrackingRoot }) {
  assertSafeTaskId(taskId);
  const root = taskTrackingRoot ?? parseTaskDir();
  const path = reportIndexPathFor({ taskTrackingRoot: root, taskId });
  if (!existsSync(path)) return [];
  return parseExistingRows(readFileSync(path, "utf8"));
}
