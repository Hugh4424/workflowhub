/**
 * render-review-report.mjs — T012 (FR-WHREVIEW-004)
 *
 * Migrated from the 3rd-review repo's `scripts/render-review-report.mjs`
 * (agenthub original chapter layout), adapted to `parseTaskDir()`'s on-disk
 * convention and rewritten to the spec.md FR-WHREVIEW-004 6-chapter baseline
 * (which supersedes the agenthub original's chapter set — decision-log D1
 * only confirmed "6 章结构", not the original's exact chapter names; per
 * spec.md ¶272 this spec's baseline wins over the agenthub implementation
 * whenever they conflict):
 *
 *   1. Summary        — verdict / 轮次 / 模式
 *   2. Blocking Issues — blocking findings, each with its finding_fingerprint
 *   3. Minor Issues    — minor findings
 *   4. Pass Items      — 通过项列表
 *   5. Delta           — 本轮相较上轮的变更说明（round 1 留空）
 *   6. Metadata        — task-name/heterologous_round/same_source_round/
 *                         total_round/mode/actual_mode/contract_path/
 *                         contract_hash/timestamp
 *
 * Verdict enum (`pass`/`revise_required`/`escalate_to_human`) maps 1:1 to a
 * report filename suffix (`-pass`/`-revise`/`-escalated` respectively — the
 * three never share a suffix). Report path is always
 * `{taskTrackingRoot}/{taskId}/reports/{stage}--{reviewFlowId}--{totalRound}-{suffix}.md`
 * (AC4-2) — a fixed join rule that never varies by stage or round.
 */

import { dirname, join } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { parseTaskDir } from "../../../core/task-dir-parser.mjs";
import {
  FailLoudError,
  assertSafeTaskId,
  assertSafeReviewFlowId,
  assertKnownStage,
  assertValidTotalRound,
  taskRoot,
} from "./lib/safe-id.mjs";
import { computeFindingFingerprint } from "./round-state.mjs";

const VERDICT_SUFFIX = Object.freeze({
  pass: "pass",
  revise_required: "revise",
  escalate_to_human: "escalated",
});

function assertKnownVerdict(verdict) {
  if (!Object.prototype.hasOwnProperty.call(VERDICT_SUFFIX, verdict)) {
    throw new FailLoudError(
      `verdict must be one of pass/revise_required/escalate_to_human (got ${JSON.stringify(verdict)})`
    );
  }
}

export function reportPathFor({ taskTrackingRoot, taskId, stage, reviewFlowId, totalRound, verdict }) {
  assertKnownVerdict(verdict);
  const suffix = VERDICT_SUFFIX[verdict];
  return join(taskRoot(taskTrackingRoot, taskId), "reports", `${stage}--${reviewFlowId}--${totalRound}-${suffix}.md`);
}

function oneLine(value, max = 160) {
  if (value === undefined || value === null || value === false) return "";
  const text = (typeof value === "string" ? value : JSON.stringify(value)).replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function findingFingerprintOf(finding) {
  return finding.finding_fingerprint ?? computeFindingFingerprint(finding);
}

function renderFindingList(lines, findings) {
  if (!findings.length) {
    lines.push("- 无", "");
    return;
  }
  for (const f of findings) {
    const loc = f.file ? `${f.file}${f.line ? `:${f.line}` : ""}` : "未提供";
    const decisionTag = f.severity_decision ? ` [decision: ${f.severity_decision}]` : "";
    lines.push(
      `- [${findingFingerprintOf(f)}] ${loc}${f.category ? ` (${f.category})` : ""}${decisionTag}: ${oneLine(f.issue || "")}`
    );
    if (f.recommendation) lines.push(`  - 建议：${oneLine(f.recommendation)}`);
  }
  lines.push("");
}

/**
 * FR-WHREVIEW-005: a raw-blocking finding that round-state classified as
 * `severity_decision: "default_downgraded_to_minor"` must render under Minor
 * Issues, not Blocking — round-state's classification decision always wins
 * over the engine's raw `severity`. Any other severity_decision (exception_*,
 * not_applicable, or absent) keeps the raw severity as-is.
 */
function effectiveSeverity(finding) {
  if (finding.severity_decision === "default_downgraded_to_minor") return "minor";
  return finding.severity;
}

/**
 * Render the 6-chapter markdown body (pure function, no I/O). `findings` are
 * this round's findings, each with raw `severity` (blocking/minor) and,
 * when round-state has already classified it, `severity_decision` (round-state
 * consumers should merge that in before calling this — see effectiveSeverity
 * above for how a default-downgrade decision overrides the raw severity);
 * `finding_fingerprint` used if already computed, else derived here.
 */
export function renderReviewMarkdown({
  verdict,
  totalRound,
  mode,
  actualMode,
  findings = [],
  passItems = [],
  deltaSummary,
  taskId,
  reviewFlowId,
  heterologousRound,
  sameSourceRound,
  contractPath,
  contractHash,
  timestamp,
}) {
  assertKnownVerdict(verdict);
  const blocking = findings.filter((f) => effectiveSeverity(f) === "blocking");
  const minor = findings.filter((f) => effectiveSeverity(f) === "minor");
  const lines = [];

  lines.push("## Summary", "");
  lines.push(`- verdict: ${verdict}`);
  lines.push(`- 轮次 (total_round): ${totalRound}`);
  lines.push(`- 模式 (mode): ${mode}`);
  lines.push("");

  lines.push("## Blocking Issues", "");
  renderFindingList(lines, blocking);

  lines.push("## Minor Issues", "");
  renderFindingList(lines, minor);

  lines.push("## Pass Items", "");
  if (!passItems.length) {
    lines.push("- 无", "");
  } else {
    for (const item of passItems) lines.push(`- ${oneLine(item)}`);
    lines.push("");
  }

  lines.push("## Delta", "");
  lines.push(totalRound === 1 ? "- （第1轮，无上一轮可对比）" : oneLine(deltaSummary || "") || "- （无变更说明）");
  lines.push("");

  lines.push("## Metadata", "");
  lines.push(`- task-name: ${taskId}`);
  lines.push(`- review_flow_id: ${reviewFlowId}`);
  lines.push(`- heterologous_round: ${heterologousRound}`);
  lines.push(`- same_source_round: ${sameSourceRound}`);
  lines.push(`- total_round: ${totalRound}`);
  lines.push(`- mode: ${mode}`);
  lines.push(`- actual_mode: ${actualMode}`);
  lines.push(`- contract_path: ${contractPath}`);
  lines.push(`- contract_hash: ${contractHash}`);
  lines.push(`- timestamp: ${timestamp}`);
  lines.push("");

  return lines.join("\n");
}

/** Render + write the report to the canonical AC4-2 path. Returns {path, markdown}. */
export function writeReviewReport({ taskId, stage, reviewFlowId, totalRound, taskTrackingRoot, ...reviewData }) {
  assertSafeTaskId(taskId);
  assertKnownStage(stage);
  assertSafeReviewFlowId(reviewFlowId);
  assertValidTotalRound(totalRound);

  const root = taskTrackingRoot ?? parseTaskDir();
  const markdown = renderReviewMarkdown({ ...reviewData, taskId, reviewFlowId, totalRound });
  const path = reportPathFor({
    taskTrackingRoot: root,
    taskId,
    stage,
    reviewFlowId,
    totalRound,
    verdict: reviewData.verdict,
  });
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, markdown);
  return { path, markdown };
}
