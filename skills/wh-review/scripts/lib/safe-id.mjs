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
  "make-decision": "make-decision.md",
  "build-spec": "build-spec.md",
  "build-plan": "build-plan.md",
  "build-code": "build-code.md",
  "verify-code": "verify-code.md",
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

/**
 * Make-decision has two independently resumable tracks.  Keep the track in
 * every storage identity instead of relying on callers to choose distinct
 * flow ids.  Other stages have exactly one implicit track.
 */
export function assertReviewTrack(stage, reviewTrack = null) {
  assertKnownStage(stage);
  if (stage === "make-decision") {
    if (reviewTrack !== "direction" && reviewTrack !== "detail") {
      throw new FailLoudError("make-decision requires review_track direction or detail");
    }
    return reviewTrack;
  }
  if (reviewTrack !== null && reviewTrack !== undefined) {
    throw new FailLoudError(`${stage} does not accept review_track`);
  }
  return null;
}

/** Stable filename component for a single review flow. */
export function reviewFlowStorageKey(stage, reviewTrack, reviewFlowId) {
  assertSafeReviewFlowId(reviewFlowId);
  const track = assertReviewTrack(stage, reviewTrack);
  return track ? `${stage}-${track}-${reviewFlowId}` : `${stage}-${reviewFlowId}`;
}

/** Stable filename component for a stage's public projection. */
export function reviewStageStorageKey(stage, reviewTrack) {
  const track = assertReviewTrack(stage, reviewTrack);
  return track ? `${stage}-${track}` : stage;
}

/** Resolve {contractPath, contractHash} for a known stage. */
export function contractPathAndHash(stage) {
  const contractPath = join(CONTRACTS_DIR, STAGE_CONTRACT_MAP[stage]);
  const content = readFileSync(contractPath, "utf8");
  const contractHash = createHash("sha256").update(content).digest("hex");
  return { contractPath, contractHash };
}

/** Resolve the exact stage contract bytes visible to a reviewer. */
export function projectStageContract(stage, reviewTrack = null) {
  const selectedTrack = assertReviewTrack(stage, reviewTrack);
  const { contractPath } = contractPathAndHash(stage);
  const source = readFileSync(contractPath, "utf8");
  let content = source;
  if (stage === "make-decision") {
    const firstTrack = source.indexOf("## review_track:");
    const marker = `## review_track: ${selectedTrack}`;
    const start = source.indexOf(marker);
    const next = source.indexOf("## review_track:", start + marker.length);
    if (firstTrack < 0 || start < 0) throw new FailLoudError(`make-decision contract is missing selected track: ${selectedTrack}`);
    content = `${source.slice(0, firstTrack)}${source.slice(start, next < 0 ? undefined : next)}`;
  }
  const rules = [...content.matchAll(/^- ((?:(?:DIR|DET)-)?([CH])\d+):\s+\S.*$/gm)].map((match) => ({ id: match[1], kind: match[2] }));
  const allIds = rules.map(({ id }) => id); const hardIds = rules.filter(({ kind }) => kind === "H").map(({ id }) => id);
  if (rules.filter(({ kind }) => kind === "C").length === 0 || hardIds.length === 0 || new Set(allIds).size !== allIds.length) throw new FailLoudError(`projected contract requires unique non-empty C/H rules: ${stage}/${selectedTrack ?? "default"}`);
  return { contractPath, content, contractHash: createHash("sha256").update(content).digest("hex"), allIds, hardIds };
}
