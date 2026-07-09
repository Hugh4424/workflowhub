/**
 * safe-id.mjs — shared identifier validation + stage/contract lookup helpers.
 *
 * Extracted from route-decision-writer.mjs (T007) so round-state.mjs (T010) and future
 * wh-review scripts can reuse the same canonical validators instead of re-implementing
 * them (Structural Quality Gate: no duplicated canonical helpers).
 *
 * Behavior is unchanged from the original route-decision-writer.mjs inline implementation.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const CONTRACTS_DIR = resolve(here, "../../contracts");

/**
 * Canonical per-task root directory. parseTaskDir() returns the final
 * task_tracking_root, so every wh-review artifact lives under
 * `task_tracking_root/{task-id}/...`. All path builders in this skill must go
 * through this helper instead of inventing a second task path formula.
 */
export function taskRoot(taskTrackingRoot, taskId) {
  return join(taskTrackingRoot, taskId);
}

/** stage → contract file name (spec.md FR-WHREVIEW-002 mapping table) */
export const STAGE_CONTRACT_MAP = {
  "make-decision": "intake.md",
  "build-spec": "design.md",
  "build-plan": "plan.md",
  "build-code": "code.md",
  "verify-code": "test-acceptance.md",
};

const SAFE_ID_RE = /^[A-Za-z0-9._-]+$/;

export class FailLoudError extends Error {}

/**
 * Validate an identifier (task_id / review_flow_id) against the safe character set
 * AND explicitly reject '..'/'.' (the character-class regex alone does NOT forbid these,
 * since '.' is itself an allowed character). Throws FailLoudError if invalid.
 */
export function assertSafeIdentifier(label, value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    !SAFE_ID_RE.test(value) ||
    value === "." ||
    value === ".." ||
    value.includes("..")
  ) {
    throw new FailLoudError(
      `unsafe ${label} (must match ^[A-Za-z0-9._-]+$, no path separators, no "."/".."): ${JSON.stringify(value)}`
    );
  }
}

/** Validate task_id. Throws FailLoudError if invalid. */
export function assertSafeTaskId(taskId) {
  assertSafeIdentifier("task_id", taskId);
}

/** Validate review_flow_id. Throws FailLoudError if invalid. */
export function assertSafeReviewFlowId(reviewFlowId) {
  assertSafeIdentifier("review_flow_id", reviewFlowId);
}

/** Validate total_round is a positive integer. Throws FailLoudError if invalid. */
export function assertValidTotalRound(totalRound) {
  if (!Number.isInteger(totalRound) || totalRound <= 0) {
    throw new FailLoudError(`invalid total_round (must be a positive integer): ${JSON.stringify(totalRound)}`);
  }
}

/** Validate review_input_hash is a non-empty string. Throws FailLoudError if invalid. */
export function assertValidReviewInputHash(reviewInputHash) {
  if (typeof reviewInputHash !== "string" || reviewInputHash.length === 0) {
    throw new FailLoudError(`invalid review_input_hash (must be a non-empty string): ${JSON.stringify(reviewInputHash)}`);
  }
}

/** Validate stage against the known contract map. Throws FailLoudError if unknown. */
export function assertKnownStage(stage) {
  if (!Object.prototype.hasOwnProperty.call(STAGE_CONTRACT_MAP, stage)) {
    throw new FailLoudError(
      `unknown stage ${JSON.stringify(stage)}. Known stages: ${Object.keys(STAGE_CONTRACT_MAP).join(", ")}`
    );
  }
}

/** Resolve {contractPath, contractHash} for a known stage. */
export function contractPathAndHash(stage) {
  const contractPath = join(CONTRACTS_DIR, STAGE_CONTRACT_MAP[stage]);
  const content = readFileSync(contractPath, "utf8");
  const contractHash = createHash("sha256").update(content).digest("hex");
  return { contractPath, contractHash };
}
