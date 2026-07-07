/**
 * route-decision-writer.mjs — T007 (FR-WHREVIEW-002)
 *
 * Two-phase writer for tasks/{task-id}/reviews/route-decision-{stage}-{review_flow_id}.json:
 *
 *  - `prepare` phase: writes 7 fields (stage, contract_path, contract_hash, timestamp,
 *    input_mode, review_flow_id, total_round), leaves `review_input_hash` empty.
 *  - `execute` phase: reads the existing record for the same {stage, review_flow_id} and
 *    backfills `review_input_hash` in place (8 fields total, all non-empty).
 *
 * Same `review_flow_id` → same file, overwritten each round (round19 fix: path isolated
 * by stage+review_flow_id so different flows never collide).
 *
 * Fail-loud (non-zero exit, no silent fallback) on:
 *  - unknown `stage` (not in STAGE_CONTRACT_MAP)
 *  - `task_id` / `review_flow_id` not matching the safe character set ^[A-Za-z0-9._-]+$, or
 *    equal to "."/"..", or containing ".." (round23 + round-review fix — checked BEFORE any
 *    path is joined, so an unsafe identifier can never reach the filesystem)
 *  - `total_round` (prepare) not a positive integer
 *  - `review_input_hash` (execute) not a non-empty string
 *  - `execute` called with no matching prior `prepare` record
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseTaskDir } from "../../../core/task-dir-parser.mjs";
import {
  FailLoudError,
  assertSafeTaskId,
  assertSafeReviewFlowId,
  assertValidTotalRound,
  assertValidReviewInputHash,
  assertKnownStage,
  contractPathAndHash,
  taskRoot,
} from "./lib/safe-id.mjs";

function recordPathFor({ taskTrackingRoot, taskId, stage, reviewFlowId }) {
  return join(taskRoot(taskTrackingRoot, taskId), "reviews", `route-decision-${stage}-${reviewFlowId}.json`);
}

/**
 * Phase 1 — prepare. Writes 7 fields, review_input_hash left empty ("").
 * @returns {{ path: string, record: object }}
 */
export function writeRoutePreparePhase({ taskId, stage, reviewFlowId, totalRound, inputMode = "full", taskTrackingRoot }) {
  assertSafeTaskId(taskId);
  assertKnownStage(stage);
  assertSafeReviewFlowId(reviewFlowId);
  assertValidTotalRound(totalRound);

  const root = taskTrackingRoot ?? parseTaskDir();
  const { contractPath, contractHash } = contractPathAndHash(stage);
  const path = recordPathFor({ taskTrackingRoot: root, taskId, stage, reviewFlowId });

  const record = {
    stage,
    contract_path: contractPath,
    contract_hash: contractHash,
    timestamp: new Date().toISOString(),
    input_mode: inputMode,
    review_flow_id: reviewFlowId,
    total_round: totalRound,
    review_input_hash: "",
  };

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(record, null, 2));
  return { path, record };
}

/**
 * Phase 2 — execute. Reads the existing record for the same {stage, review_flow_id} and
 * backfills review_input_hash in place. Fails loud if no prior prepare record exists.
 * @returns {{ path: string, record: object }}
 */
export function writeRouteExecutePhase({ taskId, stage, reviewFlowId, reviewInputHash, taskTrackingRoot }) {
  assertSafeTaskId(taskId);
  assertKnownStage(stage);
  assertSafeReviewFlowId(reviewFlowId);
  assertValidReviewInputHash(reviewInputHash);

  const root = taskTrackingRoot ?? parseTaskDir();
  const path = recordPathFor({ taskTrackingRoot: root, taskId, stage, reviewFlowId });

  if (!existsSync(path)) {
    throw new FailLoudError(
      `no prior prepare-phase route-decision record found at ${path}; execute phase requires prepare to have run first`
    );
  }

  const record = JSON.parse(readFileSync(path, "utf8"));
  record.review_input_hash = reviewInputHash;
  writeFileSync(path, JSON.stringify(record, null, 2));
  return { path, record };
}

// ---- CLI entrypoint ----

function parseFlags(argv) {
  const flags = {};
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) flags[match[1]] = match[2];
  }
  return flags;
}

function failLoudExit(err) {
  process.stderr.write(`[route-decision-writer] FAIL: ${err.message}\n`);
  process.exit(1);
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? "")) {
  const [phase, ...rest] = process.argv.slice(2);
  const flags = parseFlags(rest);

  try {
    if (phase === "prepare") {
      const { path, record } = writeRoutePreparePhase({
        taskId: flags["task-id"],
        stage: flags["stage"],
        reviewFlowId: flags["review-flow-id"],
        totalRound: flags["total-round"] !== undefined ? Number(flags["total-round"]) : undefined,
        inputMode: flags["input-mode"] ?? "full",
      });
      console.log(JSON.stringify({ path, record }, null, 2));
      process.exit(0);
    } else if (phase === "execute") {
      const { path, record } = writeRouteExecutePhase({
        taskId: flags["task-id"],
        stage: flags["stage"],
        reviewFlowId: flags["review-flow-id"],
        reviewInputHash: flags["review-input-hash"],
      });
      console.log(JSON.stringify({ path, record }, null, 2));
      process.exit(0);
    } else {
      failLoudExit(new Error(`unknown phase ${JSON.stringify(phase)}; expected "prepare" or "execute"`));
    }
  } catch (err) {
    failLoudExit(err);
  }
}
