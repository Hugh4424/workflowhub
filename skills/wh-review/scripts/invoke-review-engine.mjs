/**
 * invoke-review-engine.mjs — T010a (FR-THIRDREVIEW-001, NFR-2)
 *
 * wh-review → 3rd-review dispatch entry point (T010a scope only; T010c later
 * extends this file to also read prompt-{review_flow_id}-r{N}.md materials).
 *
 * ① Runner discovery — code here MUST NOT hardcode any single machine's
 *    absolute path:
 *    - `THIRD_REVIEW_RUNNER` env, when set, wins: absolute path used as-is;
 *      bare filename resolved by joining against the discovered 3rd-review
 *      repo root (NOT its scripts/ subdir — only the convention default
 *      below reaches into scripts/).
 *    - When `THIRD_REVIEW_RUNNER` is unset, default convention locates
 *      `<repoRoot>/scripts/run-heterologous-review.mjs`.
 *    - `THIRD_REVIEW_REPO_ROOT` env is an optional override for locating the
 *      3rd-review repo root; unset is NOT itself a failure — falls back to
 *      the sibling-directory convention (`../3rd-review` next to the
 *      workflowhub repo root). Only when the final resolved runner path does
 *      not exist on disk does this become a "runner-missing" failure.
 * ② The assembled {mode, contract, materials} triple is serialized into a
 *    temp `--diff` file; the runner is invoked as
 *    `node <runner> --diff=<file> --output=<file>` (canonical two-flag form
 *    only — never `--checkpoint`/`--round`).
 * ③ Failure mapping — runner missing, non-zero exit, timeout, or `--output`
 *    missing/unparseable — all collapse to a synthesized
 *    `{verdict:"escalate_to_human", findings:[], actual_mode:"not_executed",
 *    synthetic:true, failure_reason}` record (NFR-2 exception: wh-review
 *    itself still returns normally, never throws for these cases).
 * ④ The raw result (engine's real output on success, or the synthesized
 *    failure record) is persisted, in both cases with the same path/shape,
 *    to `tasks/{task-id}/reviews/verdict-{stage}-{review_flow_id}-round-{total_round}.raw.json`,
 *    and the structured `{verdict, findings, actual_mode}` is handed back to
 *    the caller (round-state.mjs, T011).
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseTaskDir } from "../../../core/task-dir-parser.mjs";
import {
  FailLoudError,
  assertSafeTaskId,
  assertSafeReviewFlowId,
  assertValidTotalRound,
  assertKnownStage,
  taskRoot,
} from "./lib/safe-id.mjs";
import { readRoundState } from "./round-state.mjs";
import { writeDocSnapshot, computeDocSnapshotDiff, writeMaterialsBaseline } from "./snapshot-writer.mjs";
import { writeRouteExecutePhase } from "./route-decision-writer.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_RUNNER_BASENAME = "run-heterologous-review.mjs";
const DEFAULT_TIMEOUT_MS = 120000;

export const FAILURE_REASONS = Object.freeze(["runner-missing", "non-zero-exit", "timeout", "output-unparseable"]);

/**
 * Resolve the 3rd-review repo root. `THIRD_REVIEW_REPO_ROOT` env wins when
 * set; otherwise falls back to the sibling-directory convention: the
 * `3rd-review` directory next to the workflowhub repo root. Not finding
 * anything here is never itself a failure.
 */
export function discoverThirdReviewRepoRoot({ env = process.env, workflowhubRepoRoot } = {}) {
  if (env.THIRD_REVIEW_REPO_ROOT) return env.THIRD_REVIEW_REPO_ROOT;
  // round-review finding: this module lives at <workflowhubRepoRoot>/skills/wh-review/scripts,
  // so reaching the workflowhub repo root from `here` is exactly 3 levels up (scripts ->
  // wh-review -> skills -> repo root), not 4 — the previous "../../../../ " resolved one
  // directory too high, so the default (no env var) case never found the sibling 3rd-review
  // repo and every review silently synthesized escalate_to_human (runner-missing).
  const base = workflowhubRepoRoot ?? resolve(here, "../../../");
  return resolve(base, "..", "3rd-review");
}

/**
 * Resolve the runner executable path per the discovery rule in the module
 * doc comment above.
 */
export function discoverRunner({ env = process.env, workflowhubRepoRoot } = {}) {
  const repoRoot = discoverThirdReviewRepoRoot({ env, workflowhubRepoRoot });
  const runnerEnv = env.THIRD_REVIEW_RUNNER;
  if (runnerEnv) {
    return isAbsolute(runnerEnv) ? runnerEnv : join(repoRoot, runnerEnv);
  }
  return join(repoRoot, "scripts", DEFAULT_RUNNER_BASENAME);
}

function rawArtifactPathFor({ taskTrackingRoot, taskId, stage, reviewFlowId, totalRound }) {
  return join(taskRoot(taskTrackingRoot, taskId), "reviews", `verdict-${stage}-${reviewFlowId}-round-${totalRound}.raw.json`);
}

// Contract 2/FR-THIRDREVIEW-001: the engine's success path only ever returns
// pass/revise_required. escalate_to_human must only ever originate from
// synthesizeFailure() (engine-side failure mapping) or wh-review's own
// round-state escalation logic — never accepted here as if a runner call
// that reports it were "successful".
const VALID_REVIEW_VERDICTS = new Set(["pass", "revise_required"]);

// round-review finding: a raw finding's `file`/`line` feed directly into round-state.mjs's
// computeFindingFingerprint() (Contract 4: finding_fingerprints[].file/line must round-trip
// losslessly for the fingerprint hash to be auditable/reproducible). isValidReviewResult()
// previously only checked that `findings` was an array, so a runner returning findings with
// a blank `file` or a non-integer `line` (e.g. a stringified "10") would still be accepted
// as a "successful" result — the bad data then got baked into finding_fingerprints instead
// of being rejected up front as an "output-unparseable" runner failure.
//
// NOTE on `category`: data-contracts.md Contract 2 lists `category` among a finding's
// fields, but the live 3rd-review runner (verified against the actual run-heterologous-
// review.mjs output during this fix's confirmation round) does not emit it — every real
// finding element omits `category` entirely. Requiring it here would reject every genuine
// review result as output-unparseable, which is a strictly worse outcome than the missing-
// category gap it would guard against (that gap is real, but it is a 3rd-review-side
// contract/implementation drift outside this repo's scope, not something wh-review can
// paper over by rejecting all real results). So `category` is validated only when present
// (must be a non-empty string), never required.
const VALID_FINDING_SEVERITIES = new Set(["blocking", "minor"]);

function isValidFinding(finding) {
  return (
    finding !== null &&
    typeof finding === "object" &&
    VALID_FINDING_SEVERITIES.has(finding.severity) &&
    typeof finding.file === "string" &&
    finding.file.length > 0 &&
    Number.isInteger(finding.line) &&
    finding.line > 0 &&
    (finding.category === undefined || (typeof finding.category === "string" && finding.category.length > 0)) &&
    typeof finding.issue === "string" &&
    typeof finding.recommendation === "string"
  );
}

/** Structural validation of a parsed runner --output payload (see synthesizeFailure below). */
function isValidReviewResult(result) {
  return (
    result !== null &&
    typeof result === "object" &&
    VALID_REVIEW_VERDICTS.has(result.verdict) &&
    Array.isArray(result.findings) &&
    result.findings.every(isValidFinding) &&
    typeof result.actual_mode === "string" &&
    result.actual_mode.length > 0
  );
}

function synthesizeFailure({ artifactPath, failureReason }) {
  const record = {
    verdict: "escalate_to_human",
    findings: [],
    actual_mode: "not_executed",
    synthetic: true,
    failure_reason: failureReason,
  };
  writeFileSync(artifactPath, JSON.stringify(record, null, 2));
  return { verdict: record.verdict, findings: record.findings, actual_mode: record.actual_mode };
}

// ---- T010c: materials/mode/contract assembly (FR-WHREVIEW-007, Contract 11) ----

function routeDecisionPathFor({ taskTrackingRoot, taskId, stage, reviewFlowId }) {
  return join(taskRoot(taskTrackingRoot, taskId), "reviews", `route-decision-${stage}-${reviewFlowId}.json`);
}

function promptPathFor({ taskTrackingRoot, taskId, reviewFlowId, totalRound }) {
  return join(taskRoot(taskTrackingRoot, taskId), "reviews", `prompt-${reviewFlowId}-r${totalRound}.md`);
}

/**
 * Assemble the {mode, contract, materials} triple for one review round.
 *
 * - `mode`: read from this round's round-state record (T010/T011 own the
 *   decision of what mode this round runs in; this function only consumes
 *   it, never computes it).
 * - `contract`: the full text content at the route-decision record's
 *   `contract_path` (never parsed out of the prompt file — Contract 11
 *   deliberately excludes contract text from that file, so there is nothing
 *   to reconcile between the two).
 * - `materials`: for doc-type review objects (`docType: "doc"`), round 1
 *   submits `currentContent` in full; round>=2 submits the round(N-1)→N
 *   snapshot diff (Contract 10) instead of full text again. For non-doc
 *   review objects, `currentContent` (e.g. a source diff or test report) is
 *   always submitted in full — Contract 12's baseline exists only to support
 *   later FR-WHREVIEW-005 exception judging, not to shrink what's submitted.
 *   Either way, this round's own baseline/snapshot is persisted for the next
 *   round to reference, and the stage's agent-authored
 *   `prompt-{review_flow_id}-r{N}.md` is appended as supplementary context
 *   (fail-loud if missing — never silently falls back to empty context).
 */
export function assembleReviewPayload({
  taskId,
  stage,
  reviewFlowId,
  totalRound,
  taskTrackingRoot,
  docType,
  doc,
  currentContent,
  gitSha,
  coveredPaths,
}) {
  assertSafeTaskId(taskId);
  assertKnownStage(stage);
  assertSafeReviewFlowId(reviewFlowId);
  assertValidTotalRound(totalRound);

  const root = taskTrackingRoot ?? parseTaskDir();

  const roundState = readRoundState({ taskId, stage, reviewFlowId, taskTrackingRoot: root });
  if (!roundState) {
    throw new FailLoudError(
      `round-state file not found for stage=${stage} review_flow_id=${reviewFlowId}; cannot assemble mode`
    );
  }
  const mode = roundState.mode;

  const routeDecisionPath = routeDecisionPathFor({ taskTrackingRoot: root, taskId, stage, reviewFlowId });
  if (!existsSync(routeDecisionPath)) {
    throw new FailLoudError(`route-decision record not found at ${routeDecisionPath}; cannot assemble contract`);
  }
  const routeDecision = JSON.parse(readFileSync(routeDecisionPath, "utf8"));
  const contract = readFileSync(routeDecision.contract_path, "utf8");

  // Validate the prompt supplementary-context file exists BEFORE writing any immutable
  // snapshot/baseline artifact below. Those writes refuse to overwrite on retry, so if the
  // missing-prompt fail-loud fired only after a partial write, a caller who then creates the
  // prompt and retries would be stuck behind an already-written baseline it can never redo.
  const promptPath = promptPathFor({ taskTrackingRoot: root, taskId, reviewFlowId, totalRound });
  if (!existsSync(promptPath)) {
    throw new FailLoudError(
      `prompt supplementary-context file not found at ${promptPath}; cannot silently fall back to empty context`
    );
  }
  const promptContent = readFileSync(promptPath, "utf8");

  let materialsCore;
  if (docType === "doc") {
    materialsCore =
      totalRound === 1
        ? currentContent
        : computeDocSnapshotDiff({ taskId, doc, reviewFlowId, totalRound, currentContent, taskTrackingRoot: root });
    writeDocSnapshot({ taskId, doc, reviewFlowId, totalRound, content: currentContent, taskTrackingRoot: root });
  } else {
    materialsCore = currentContent;
    writeMaterialsBaseline({
      taskId,
      stage,
      reviewFlowId,
      totalRound,
      gitSha,
      materialsContent: currentContent,
      coveredPaths,
      taskTrackingRoot: root,
    });
  }

  const materials = `${materialsCore}\n\n---\n\n## Supplementary context (agent-authored prompt)\n\n${promptContent}`;

  return { mode, contract, materials };
}

/**
 * Assemble the payload (above) and immediately dispatch it via invokeReviewEngine.
 *
 * FR-WHREVIEW-007 step 3 / Contract 3: once the final materials are known, this is the one
 * point that must compute review_input_hash and backfill the route-decision record's
 * execute-phase field BEFORE the engine is actually invoked — invokeReviewEngine() itself
 * only dispatches the runner and never touches route-decision, so without this call here the
 * record is silently left stuck in prepare-only state (review_input_hash never backfilled).
 */
export function assembleAndInvokeReviewEngine(params) {
  const { mode, contract, materials } = assembleReviewPayload(params);
  const root = params.taskTrackingRoot ?? parseTaskDir();
  // review_input_hash covers the materials content only (Contract 2/data-contracts.md:
  // "本次传给引擎的 materials 内容 hash") — mode/contract are tracked separately by
  // route-decision fields, not folded into this hash.
  const reviewInputHash = createHash("sha256").update(materials).digest("hex");
  writeRouteExecutePhase({
    taskId: params.taskId,
    stage: params.stage,
    reviewFlowId: params.reviewFlowId,
    reviewInputHash,
    taskTrackingRoot: root,
  });
  return invokeReviewEngine({ ...params, mode, contract, materials });
}

/**
 * Main dispatch entry point. Never throws for engine-side failures (runner
 * missing / non-zero exit / timeout / unparseable output) — those are
 * mapped to a synthesized escalate_to_human result per ③ above. Only
 * fail-loud on malformed caller input (unsafe task_id/stage/review_flow_id/
 * total_round), which are programmer errors, not engine failures.
 */
export function invokeReviewEngine({
  taskId,
  stage,
  reviewFlowId,
  totalRound,
  mode,
  contract,
  materials,
  taskTrackingRoot,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  env = process.env,
  workflowhubRepoRoot,
}) {
  assertSafeTaskId(taskId);
  assertKnownStage(stage);
  assertSafeReviewFlowId(reviewFlowId);
  assertValidTotalRound(totalRound);

  // round-review finding: spawnSync() below has no `env` option, so the runner
  // subprocess (which runs `npm test` on the target repo as review evidence)
  // always inherits the REAL process.env — never the caller-supplied `env` param,
  // which is only consulted for THIRD_REVIEW_RUNNER/THIRD_REVIEW_REPO_ROOT
  // discovery and can be (and in tests, is) bypassed entirely by passing
  // `taskTrackingRoot` explicitly, skipping parseTaskDir()'s own check of this
  // same env var. If the caller's shell forgot to export WORKFLOWHUB_TASK_DIR,
  // the runner would silently gather review evidence against a broken path,
  // producing false test-failure findings treated as real blocking review
  // findings. This must fail loud before any spawn/write side effect, never
  // fall through to a synthesized escalate_to_human result.
  if (!process.env.WORKFLOWHUB_TASK_DIR || process.env.WORKFLOWHUB_TASK_DIR.trim() === "") {
    throw new FailLoudError(
      "WORKFLOWHUB_TASK_DIR not set — review evidence would be gathered against a broken path, refusing to proceed silently."
    );
  }

  const root = taskTrackingRoot ?? parseTaskDir();
  const artifactPath = rawArtifactPathFor({ taskTrackingRoot: root, taskId, stage, reviewFlowId, totalRound });
  mkdirSync(dirname(artifactPath), { recursive: true });

  const runnerPath = discoverRunner({ env, workflowhubRepoRoot });
  if (!existsSync(runnerPath)) {
    return synthesizeFailure({ artifactPath, failureReason: "runner-missing" });
  }

  const workDir = mkdtempSync(join(tmpdir(), "invoke-review-engine-"));
  const diffFile = join(workDir, "diff.json");
  const outputFile = join(workDir, "output.json");
  writeFileSync(diffFile, JSON.stringify({ mode, contract, materials }));

  let proc;
  try {
    proc = spawnSync("node", [runnerPath, `--diff=${diffFile}`, `--output=${outputFile}`], {
      timeout: timeoutMs,
      encoding: "utf8",
    });

    // Node kills a timed-out child with a signal; status is left null.
    if (proc.signal) {
      return synthesizeFailure({ artifactPath, failureReason: "timeout" });
    }
    if (proc.status !== 0) {
      return synthesizeFailure({ artifactPath, failureReason: "non-zero-exit" });
    }
    if (!existsSync(outputFile)) {
      return synthesizeFailure({ artifactPath, failureReason: "output-unparseable" });
    }

    let result;
    try {
      result = JSON.parse(readFileSync(outputFile, "utf8"));
    } catch {
      return synthesizeFailure({ artifactPath, failureReason: "output-unparseable" });
    }

    // round-review finding: valid JSON is not the same as a valid review result —
    // a runner that exits 0 and writes `{}` or `{"verdict":"pass"}` used to be
    // accepted as-is, silently persisting/returning undefined findings/actual_mode
    // into round-state instead of being mapped to the "output-unparseable"
    // failure the contract requires for a malformed runner response.
    if (!isValidReviewResult(result)) {
      return synthesizeFailure({ artifactPath, failureReason: "output-unparseable" });
    }

    writeFileSync(artifactPath, JSON.stringify(result, null, 2));
    return { verdict: result.verdict, findings: result.findings, actual_mode: result.actual_mode };
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}
