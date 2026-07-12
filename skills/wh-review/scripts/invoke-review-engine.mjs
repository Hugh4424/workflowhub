/**
 * invoke-review-engine.mjs — T010a (FR-THIRDREVIEW-001, NFR-2)
 *
 * wh-review → 3rd-review dispatch entry point (T010a scope only; T010c later
 * extends this file to also read prompt-{review_flow_id}-r{N}.md materials).
 *
 * ① Runner discovery — code here MUST NOT hardcode any single machine's
 *    absolute path:
 *    - `WH_REVIEW_PROVIDER=claude-code` or `THIRD_REVIEW_RUNNER=claude-code`
 *      routes to workflowhub's in-repo Claude Code runner.
 *    - `THIRD_REVIEW_RUNNER` env, when set to any other value, wins:
 *      absolute path used as-is;
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
 * ② Legacy/custom runners receive the assembled {mode, contract, materials}
 *    triple byte-for-byte. The built-in Claude runner instead receives a
 *    small path/hash manifest for a persistent content-addressed package
 *    containing the complete contract, materials, and required skills. The
 *    selected payload is serialized into a temp `--diff` file; the runner is invoked as
 *    `node <runner> --diff=<file> --output=<file>` (canonical two-flag form
 *    only — never `--checkpoint`/`--round`).
 * ③ Failure mapping — runner missing, non-zero exit, timeout, or `--output`
 *    missing/unparseable — all collapse to a synthesized
 *    `{verdict:"escalate_to_human", findings:[], actual_mode:"not_executed",
 *    synthetic:true, failure_reason}` record (NFR-2 exception: wh-review
 *    itself still returns normally, never throws for these cases).
 * ④ The raw result (engine's real output on success, or the synthesized
 *    failure record) is persisted, in both cases with the same path/shape,
 *    to `{task_tracking_root}/{task-id}/reviews/verdict-{stage}-{review_flow_id}-round-{total_round}.raw.json`,
 *    and the structured `{verdict, findings, actual_mode}` is handed back to
 *    the caller (round-state.mjs, T011).
 */

import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { platform, tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
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
import { resolveRequiredSkills } from "./required-skill-resolver.mjs";
import { createArtifactReviewPackage } from "./artifact-review-package.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_RUNNER_BASENAME = "run-heterologous-review.mjs";
const CLAUDE_CODE_RUNNER = join(here, "runners", "claude-code-reviewer.mjs");
const DEFAULT_TIMEOUT_MS = 600000;
const CANONICAL_CLAUDE_OUTER_TIMEOUT_MS = 720000;

export const FAILURE_REASONS = Object.freeze(["runner-missing", "non-zero-exit", "timeout", "output-unparseable", "artifact-package-invalid", "artifact-package-escape", "artifact-package-tampered", "artifact-package-publish-failed", "review-already-running", "review-lock-unsupported-platform", "review-lock-utility-missing", "review-lock-attestation-invalid"]);

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
  const provider = env.WH_REVIEW_PROVIDER ?? env.THIRD_REVIEW_PROVIDER;
  if (runnerEnv && runnerEnv !== "claude-code") return isAbsolute(runnerEnv) ? runnerEnv : join(repoRoot, runnerEnv);
  // Production Claude reviews go through 3rd-review's canonical backend. Keep
  // the internal runner reachable only as an explicit compatibility/test seam.
  if (runnerEnv === "claude-code") return CLAUDE_CODE_RUNNER;
  if (runnerEnv) {
    return isAbsolute(runnerEnv) ? runnerEnv : join(repoRoot, runnerEnv);
  }
  return join(repoRoot, "scripts", DEFAULT_RUNNER_BASENAME);
}

function rawArtifactPathFor({ taskTrackingRoot, taskId, stage, reviewFlowId, totalRound }) {
  return join(taskRoot(taskTrackingRoot, taskId), "reviews", `verdict-${stage}-${reviewFlowId}-round-${totalRound}.raw.json`);
}

export function effectiveRunnerTimeoutMs({ runnerPath, timeoutMs = DEFAULT_TIMEOUT_MS, env = process.env } = {}) {
  if (runnerPath === CLAUDE_CODE_RUNNER) return undefined;
  const provider = env.WH_REVIEW_PROVIDER ?? env.THIRD_REVIEW_PROVIDER;
  // 3rd-review owns a 600s inner Claude budget. The parent deadline must also
  // cover provider preflight, scoped-Read attestation, diagnostics, and atomic
  // artifact publication; equal inner/outer constants deterministically race.
  if (provider === "claude-code" && basename(runnerPath) === DEFAULT_RUNNER_BASENAME) {
    return Math.max(timeoutMs, CANONICAL_CLAUDE_OUTER_TIMEOUT_MS);
  }
  return timeoutMs;
}

const SAFE_RUNNER_ENV_KEYS = new Set([
  "PATH", "HOME", "TERM", "LANG", "LC_ALL", "TMPDIR", "XDG_CONFIG_HOME",
  "SSL_CERT_FILE", "SSL_CERT_DIR", "NODE_EXTRA_CA_CERTS", "CLAUDE_CONFIG_DIR",
]);

const INTERNAL_TEST_ENV_KEYS = new Set([
  "CLAUDE_CODE_BIN", "CLAUDE_CODE_REVIEW_BUFFER_MAX_BYTES", "CLAUDE_CODE_REVIEW_EXPECTED_PARENT_PID",
  "CLAUDE_CODE_REVIEW_IDLE_MS", "CLAUDE_CODE_REVIEW_PARENT_WATCH_MS", "CLAUDE_CODE_REVIEW_RETRY_BASE_MS",
  "CLAUDE_CODE_REVIEW_RETRY_JITTER", "CLAUDE_CODE_REVIEW_RETRY_SLEEP_CAP_MS", "CLAUDE_CODE_REVIEW_STDERR_MAX_BYTES",
  "CLAUDE_CODE_REVIEW_STOP_GRACE_MS", "CLAUDE_CODE_REVIEW_TEST_NO_SLEEP", "CLAUDE_CODE_SETTINGS",
  "WH_REVIEW_ATTEST_HOST_PID", "WH_REVIEW_ATTEST_HOST_START", "WH_REVIEW_EXPECTED_HOST_PID", "WH_REVIEW_HOST_AGENT",
  "WH_REVIEW_LOCK_BIN", "WH_REVIEW_LOCK_NONCE", "WH_REVIEW_TEST_INNER_EXIT_AFTER_START", "WH_REVIEW_TEST_PLATFORM",
  "WH_REVIEW_WRAPPER_PID", "WH_REVIEW_WRAPPER_START",
  "FAKE_CLAUDE_MARKER",
]);

export function buildRunnerEnv({ sourceEnv = process.env, requestedProvider, internalTestSeam = false } = {}) {
  const output = {};
  for (const key of SAFE_RUNNER_ENV_KEYS) if (sourceEnv[key] !== undefined) output[key] = sourceEnv[key];
  // API secrets are provider-scoped. CLI login normally uses HOME; only the
  // selected backend's explicit API credential may cross this boundary.
  const authKey = { "claude-code": "ANTHROPIC_API_KEY", codex: "OPENAI_API_KEY", gemini: "GOOGLE_API_KEY" }[requestedProvider];
  if (authKey && sourceEnv[authKey] !== undefined) output[authKey] = sourceEnv[authKey];
  if (internalTestSeam) for (const key of INTERNAL_TEST_ENV_KEYS) if (sourceEnv[key] !== undefined) output[key] = sourceEnv[key];
  if (sourceEnv.WH_REVIEW_TEST_MODE === "1" && sourceEnv.CAPTURED_DIFF !== undefined) output.CAPTURED_DIFF = sourceEnv.CAPTURED_DIFF;
  return output;
}

// Contract 2/FR-THIRDREVIEW-001: the backend returns a structured stage-agnostic
// verdict. `escalate_to_human` is a real backend outcome when a required review
// dependency is unavailable; preserving it keeps the actionable findings visible
// instead of collapsing the whole result into a synthetic output-unparseable.
const VALID_REVIEW_VERDICTS = new Set(["pass", "revise_required", "escalate_to_human"]);

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
const VALID_FINDING_SEVERITIES = new Set(["blocking", "minor", "important"]);

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

function normalizeFinding(finding) {
  if (finding === null || typeof finding !== "object") {
    return {
      severity: "minor",
      file: "REVIEW_CONTRACT",
      line: 1,
      issue: "review finding was not an object",
      recommendation: "inspect raw review output",
    };
  }
  const normalized = { ...finding };
  if (normalized.severity === "important") normalized.severity = "minor";
  if (!VALID_FINDING_SEVERITIES.has(normalized.severity)) normalized.severity = "minor";
  if (typeof normalized.file !== "string" || normalized.file.length === 0) {
    normalized.file = "REVIEW_CONTRACT";
  }
  if (!Number.isInteger(normalized.line) || normalized.line <= 0) {
    normalized.original_line = normalized.line;
    normalized.line = 1;
  }
  if (normalized.category === "") delete normalized.category;
  if (typeof normalized.issue !== "string" || normalized.issue.length === 0) {
    normalized.issue = typeof normalized.description === "string" && normalized.description.length > 0
      ? normalized.description
      : "review finding missing issue text";
  }
  if (typeof normalized.recommendation !== "string") {
    normalized.recommendation = "";
  }
  return normalized;
}

function normalizeReviewResult(result) {
  if (result !== null && typeof result === "object") {
    return {
      ...result,
      findings: Array.isArray(result.findings) ? result.findings.map(normalizeFinding) : [],
      actual_mode: typeof result.actual_mode === "string" && result.actual_mode.length > 0
        ? result.actual_mode
        : "not_executed",
    };
  }
  return result;
}

/** Structural validation of a parsed runner --output payload (see synthesizeFailure below). */
function hasCompleteArtifactCoverage(result, manifest) {
  if (!manifest?.entries?.length) return false;
  const coverage = Array.isArray(result.artifactCoverage) ? result.artifactCoverage
    : Array.isArray(result.artifact_attestation) ? result.artifact_attestation
    : Array.isArray(result.coverage) ? result.coverage : [];
  return manifest.entries.every((entry) => coverage.some((item) =>
    item?.id === entry.id && item?.sha256 === entry.sha256 && ["read", "verified"].includes(item?.status)
  ));
}

function isValidReviewResult(result, { requestedProvider, artifactManifest } = {}) {
  const claudeAttested = requestedProvider !== "claude-code" ||
    (result.verdict === "escalate_to_human" && result.synthetic === true) || (
    result.synthetic === false &&
    result.execution_status === "completed" &&
    result.trueCrossEngine === true &&
    typeof result.backend_provider === "string" && result.backend_provider.length > 0 &&
    typeof result.reviewer_source === "string" && result.reviewer_source.length > 0 &&
    hasCompleteArtifactCoverage(result, artifactManifest)
  );
  return (
    result !== null &&
    typeof result === "object" &&
    VALID_REVIEW_VERDICTS.has(result.verdict) &&
    Array.isArray(result.findings) &&
    result.findings.every(isValidFinding) &&
    typeof result.actual_mode === "string" &&
    result.actual_mode.length > 0 &&
    claudeAttested
  );
}

function synthesizeFailure({ artifactPath, failureReason, provenance = {} }) {
  const record = {
    verdict: "escalate_to_human",
    findings: [],
    actual_mode: "not_executed",
    synthetic: true,
    failure_reason: failureReason,
    ...provenance,
  };
  atomicWriteJson(artifactPath, record);
  return { verdict: record.verdict, findings: record.findings, actual_mode: record.actual_mode };
}

function atomicWriteJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(temporary, JSON.stringify(value, null, 2), { flag: "wx" });
  try { renameSync(temporary, path); }
  catch (error) { rmSync(temporary, { force: true }); throw error; }
}

function persistRunnerDiagnostic({ result, artifactPath, stage, reviewFlowId, totalRound }) {
  const source = result?.diagnosticPath ?? result?.diagnostic_path;
  if (typeof source !== "string" || !existsSync(source)) return result;
  const stat = lstatSync(source);
  if (!stat.isFile() || stat.isSymbolicLink()) return result;
  const bytes = readFileSync(source);
  const persistent = join(dirname(artifactPath), `diagnostic-${stage}-${reviewFlowId}-round-${totalRound}.json`);
  const temporary = `${persistent}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(temporary, bytes, { flag: "wx", mode: 0o600 });
  renameSync(temporary, persistent);
  chmodSync(persistent, 0o600);
  const output = { ...result, diagnostic_path: persistent,
    diagnostic_sha256: createHash("sha256").update(bytes).digest("hex"), diagnostic_bytes: bytes.length };
  delete output.diagnosticPath;
  return output;
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
  materialSources,
  env = process.env,
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

  // All deterministic transport/dependency checks must precede immutable
  // baseline writes. A failed preflight must remain safely retryable.
  const requestedProvider = env.WH_REVIEW_PROVIDER ?? env.THIRD_REVIEW_PROVIDER;
  if (Array.isArray(materialSources) && materialSources.length > 0 && requestedProvider !== "claude-code") {
    throw new FailLoudError("materialSources require explicit WH_REVIEW_PROVIDER=claude-code; refusing legacy aggregate transport");
  }
  if (requestedProvider === "claude-code") resolveRequiredSkills({ stage, reviewTrack: env.WH_REVIEW_TRACK, ui: env.WH_REVIEW_UI === "true" });

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

  // Keep the legacy/custom payload byte-for-byte compatible. Claude calls
  // with canonical materialSources ignore this aggregate and package only the
  // sources plus supplementaryContext; Claude legacy calls snapshot it whole.
  const materials = `${materialsCore}\n\n---\n\n## Supplementary context (agent-authored prompt)\n\n${promptContent}`;
  return { mode, contract, materials, supplementaryContext: promptContent };
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
  const { mode, contract, materials, supplementaryContext } = assembleReviewPayload(params);
  const root = params.taskTrackingRoot ?? parseTaskDir();
  return invokeReviewEngine({
    ...params,
    mode,
    contract,
    materials,
    supplementaryContext,
    routeDecisionContext: { taskId: params.taskId, stage: params.stage, reviewFlowId: params.reviewFlowId, taskTrackingRoot: root },
  });
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
  materialSources,
  supplementaryContext,
  taskTrackingRoot,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  env = process.env,
  workflowhubRepoRoot,
  routeDecisionContext,
}) {
  assertSafeTaskId(taskId);
  assertKnownStage(stage);
  assertSafeReviewFlowId(reviewFlowId);
  assertValidTotalRound(totalRound);

  const requestedProvider = env.WH_REVIEW_PROVIDER ?? env.THIRD_REVIEW_PROVIDER;
  if (Array.isArray(materialSources) && materialSources.length > 0 && requestedProvider !== "claude-code") {
    throw new FailLoudError("materialSources require explicit WH_REVIEW_PROVIDER=claude-code; refusing legacy aggregate transport");
  }

  // round-review finding (round-1, this fix): spawnSync() below has no `env`
  // option, so the runner subprocess (which runs `npm test` on the target repo
  // as review evidence) always inherits the REAL process.env — never the
  // caller-supplied `env` param, which is only consulted for
  // THIRD_REVIEW_RUNNER/THIRD_REVIEW_REPO_ROOT discovery and can be (and in
  // tests, is) bypassed entirely by passing `taskTrackingRoot` explicitly.
  // A previous fix here hard-required `process.env.WORKFLOWHUB_TASK_DIR` to be
  // literally set, but WORKFLOWHUB_TASK_DIR is meant to be an optional
  // override of parseTaskDir()'s priority chain, not a hard requirement —
  // ~/.workflowhub/config.json's `task_dir` field is a legitimate fallback that
  // must keep working from a clean shell within the repo. Call parseTaskDir()
  // itself (env var, else yaml fallback) purely to validate that SOME
  // task_tracking_root is genuinely resolvable before any spawn/write side
  // effect; parseTaskDir() already fails loud (non-zero exit) when both the
  // env var and the yaml fallback are absent. The resolved value here is
  // discarded — the actual `root` used below still prefers an explicit
  // `taskTrackingRoot` override (see line below); this call only guards
  // against a machine that has neither the env var nor a usable yaml config.
  // Skipped when `taskTrackingRoot` is absent — the fallback call below
  // already performs the exact same resolution and fail-loud check.
  if (taskTrackingRoot !== undefined && taskTrackingRoot !== null) {
    parseTaskDir();
  }

  const root = taskTrackingRoot ?? parseTaskDir();
  const artifactPath = rawArtifactPathFor({ taskTrackingRoot: root, taskId, stage, reviewFlowId, totalRound });
  mkdirSync(dirname(artifactPath), { recursive: true });

  const rawHost = env.REVIEW_HOST_PROVIDER ?? env.WH_REVIEW_HOST_PROVIDER ?? env.WH_REVIEW_HOST_AGENT;
  const hostAliases = { "openai-codex": "codex", "codex-cli": "codex", claude: "claude-code", "claude-code": "claude-code", codex: "codex" };
  const hostProvider = hostAliases[String(rawHost ?? "").toLowerCase()] ?? "unknown";
  if (requestedProvider === "claude-code" && (hostProvider === "unknown" || hostProvider === "claude-code")) {
    const failureReason = hostProvider === "unknown" ? "host-provider-unknown" : "same-source-provider";
    return synthesizeFailure({ artifactPath, failureReason, provenance: {
      provider: "claude-code", backend_provider: "claude-code", reviewer_source: "3rd-review/canonical",
      trueCrossEngine: false, execution_status: "not_executed",
    } });
  }

  const runnerPath = discoverRunner({ env, workflowhubRepoRoot });
  if (!existsSync(runnerPath)) {
    return synthesizeFailure({ artifactPath, failureReason: "runner-missing" });
  }
  const runnerTimeoutMs = effectiveRunnerTimeoutMs({ runnerPath, timeoutMs, env });
  const runnerEnv = buildRunnerEnv({ sourceEnv: { ...process.env, ...env }, requestedProvider, internalTestSeam: env.THIRD_REVIEW_RUNNER === "claude-code" });

  let resolution;
  if (requestedProvider === "claude-code") {
    resolution = resolveRequiredSkills({ stage, reviewTrack: env.WH_REVIEW_TRACK, ui: env.WH_REVIEW_UI === "true" });
  }
  let inputHash;
  let runnerPayload;
  let expectedArtifactManifest;
  if (requestedProvider === "claude-code") {
    let reviewPackage;
    try {
      reviewPackage = createArtifactReviewPackage({
        reviewsRoot: dirname(artifactPath),
        stage,
        reviewFlowId,
        totalRound,
        contract,
        materials,
        materialSources,
        supplementaryContext,
        skillDefinitions: resolution.definitions,
      });
    } catch (error) {
      const known = new Set(["artifact-package-invalid", "artifact-package-escape", "artifact-package-tampered"]);
      return synthesizeFailure({ artifactPath, failureReason: known.has(error?.code) ? error.code : "artifact-package-publish-failed" });
    }
    const artifactManifest = {
      package_root: reviewPackage.packageRoot,
      manifest_path: reviewPackage.manifestPath,
      content_hash: reviewPackage.manifest.content_hash,
      entries: reviewPackage.manifest.entries,
    };
    expectedArtifactManifest = artifactManifest;
    const contentDescriptor = artifactManifest.entries.map(({ id, role, kind, bytes, lines, sha256, chunks }) => ({
      id, role, kind, bytes, lines, sha256,
      chunks: chunks.map(({ sequence, bytes: chunkBytes, lines: chunkLines, sha256: chunkHash }) => ({ sequence, bytes: chunkBytes, lines: chunkLines, sha256: chunkHash })),
    }));
    inputHash = createHash("sha256").update(JSON.stringify({ mode, content_hash: artifactManifest.content_hash, entries: contentDescriptor })).digest("hex");
    runnerPayload = runnerPath === CLAUDE_CODE_RUNNER
      ? { mode, artifact_manifest: artifactManifest, input_hash: inputHash }
      : { mode, contract, materials, artifact_manifest: artifactManifest, input_hash: inputHash };
  } else {
    // Preserve the legacy runner payload byte-for-byte. Artifact transport is
    // Claude-only; custom/Codex/default providers keep their existing contract.
    inputHash = createHash("sha256").update(JSON.stringify({ mode, contract, materials })).digest("hex");
    runnerPayload = { mode, contract, materials, input_hash: inputHash };
  }
  if (routeDecisionContext) {
    writeRouteExecutePhase({
      ...routeDecisionContext,
      reviewInputHash: runnerPath === CLAUDE_CODE_RUNNER ? inputHash : createHash("sha256").update(materials).digest("hex"),
    });
  }
  const workDir = mkdtempSync(join(tmpdir(), "invoke-review-engine-"));
  const diffFile = join(workDir, "diff.json");
  const outputFile = join(workDir, "output.json");
  writeFileSync(diffFile, JSON.stringify(runnerPayload));
  const runnerArgs = [runnerPath, `--diff=${diffFile}`, `--output=${outputFile}`];
  if (runnerPath !== CLAUDE_CODE_RUNNER) {
    runnerArgs.push(`--host-provider=${hostProvider}`);
    if (requestedProvider) runnerArgs.push(`--provider=${requestedProvider}`);
  }
  if (runnerPath === CLAUDE_CODE_RUNNER) {
    const stateDir = join(dirname(artifactPath), ".claude-review-state", `${stage}-${reviewFlowId}-round-${totalRound}-${inputHash}`);
    mkdirSync(stateDir, { recursive: true });
    runnerArgs.push(`--state-dir=${stateDir}`);
  }

  const finalizeOutput = () => {
    if (!existsSync(outputFile)) return synthesizeFailure({ artifactPath, failureReason: "output-unparseable" });
    let result;
    try { result = JSON.parse(readFileSync(outputFile, "utf8")); }
    catch { return synthesizeFailure({ artifactPath, failureReason: "output-unparseable" }); }
    result = normalizeReviewResult(result);
    result = persistRunnerDiagnostic({ result, artifactPath, stage, reviewFlowId, totalRound });
    if (requestedProvider === "claude-code" && result.verdict === "escalate_to_human" && result.trueCrossEngine !== true) {
      result = { ...result, synthetic: true, execution_status: "failed",
        failure_reason: result.failure_reason ?? "claude-provider-failure" };
    }
    if (!isValidReviewResult(result, { requestedProvider, artifactManifest: expectedArtifactManifest })) {
      return synthesizeFailure({ artifactPath, failureReason: requestedProvider === "claude-code" ? "claude-attestation-invalid" : "output-unparseable" });
    }
    atomicWriteJson(artifactPath, result);
    return { verdict: result.verdict, findings: result.findings, actual_mode: result.actual_mode };
  };

  if (runnerPath === CLAUDE_CODE_RUNNER) {
    return new Promise((resolveResult) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        rmSync(workDir, { recursive: true, force: true });
        resolveResult(value);
      };
      let child;
      try {
        child = spawn("node", runnerArgs, {
          stdio: ["ignore", "pipe", "pipe"],
          env: runnerEnv,
          detached: platform() !== "win32",
        });
      } catch {
        finish(synthesizeFailure({ artifactPath, failureReason: "non-zero-exit" }));
        return;
      }
      // The runner persists its own bounded journal/terminal receipt. Drain but
      // never forward its output into the calling agent's conversation.
      child.stdout.resume();
      child.stderr.resume();
      child.once("error", () => finish(synthesizeFailure({ artifactPath, failureReason: "non-zero-exit" })));
      child.once("close", (code, signal) => {
        if (signal) finish(synthesizeFailure({ artifactPath, failureReason: "timeout" }));
        else if (code === 73) finish(synthesizeFailure({ artifactPath, failureReason: "review-already-running" }));
        else if (code === 70) finish(synthesizeFailure({ artifactPath, failureReason: "review-lock-unsupported-platform" }));
        else if (code === 71) finish(synthesizeFailure({ artifactPath, failureReason: "review-lock-utility-missing" }));
        else if (code === 72) finish(synthesizeFailure({ artifactPath, failureReason: "review-lock-attestation-invalid" }));
        else if (code !== 0) finish(synthesizeFailure({ artifactPath, failureReason: "non-zero-exit" }));
        else finish(finalizeOutput());
      });
    });
  }

  let proc;
  try {
    proc = spawnSync("node", runnerArgs, {
      ...(runnerTimeoutMs === undefined ? {} : { timeout: runnerTimeoutMs }),
      encoding: "utf8",
      // Runner selection and runner behavior both depend on the invocation
      // environment. Without this, CLAUDE_CODE_REVIEW_TIMEOUT_MS only affects
      // the outer guard while the Claude runner silently uses its process default.
      env: runnerEnv,
    });

    // Node kills a timed-out child with a signal; status is left null.
    if (proc.signal) {
      return synthesizeFailure({ artifactPath, failureReason: "timeout" });
    }
    if (proc.status !== 0) {
      return synthesizeFailure({ artifactPath, failureReason: "non-zero-exit" });
    }
    return finalizeOutput();
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}
