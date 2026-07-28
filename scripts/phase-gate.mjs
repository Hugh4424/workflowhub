#!/usr/bin/env node
/**
 * phase-gate.mjs
 *
 * Minimal phase completion fact check for build-code sub-phases. This is not a
 * broad quality gate: it only checks failure modes that have already occurred
 * in this workflow (missing RED/GREEN evidence, non-independent review, and
 * incomplete public review publication).
 */

import { existsSync, readFileSync, realpathSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { captureGitWorktreeSnapshot } from "../core/git-worktree-snapshot.mjs";
import { deriveSeriousReviewPause, validateRiskAcceptanceSet } from "../core/stage-review-disposition.mjs";
import { validatePhaseReviewEvidence } from "../skills/wh-review/scripts/phase-review-subject.mjs";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function pathFrom(baseDir, value) {
  if (!nonEmptyString(value)) return null;
  return isAbsolute(value) ? value : resolve(baseDir, value);
}

function taskPath(root, ref, label) {
  if (!nonEmptyString(ref) || isAbsolute(ref) || ref.includes("\\")
    || ref.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error(`${label} must be task-relative`);
  }
  const path = resolve(root, ...ref.split("/"));
  const rel = relative(root, path);
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) throw new Error(`${label} escapes review data root`);
  return path;
}

function readArtifact(baseDir, path, label, errors) {
  const resolved = pathFrom(baseDir, path);
  if (!resolved) {
    errors.push(`${label} artifact path missing`);
    return null;
  }
  if (!existsSync(resolved)) {
    errors.push(`${label} artifact not found: ${resolved}`);
    return null;
  }
  try {
    return { path: resolved, data: readJson(resolved) };
  } catch (err) {
    errors.push(`${label} artifact is not valid JSON: ${resolved}: ${err.message}`);
    return null;
  }
}

function checkStatus(phaseResult, errors, checked) {
  checked.push("phase-status");
  if (!nonEmptyString(phaseResult.phase_id)) {
    errors.push("phase_id must be a non-empty string before completion");
  }
  if (phaseResult.status !== "done") {
    errors.push(`phase status must be "done" before completion (got ${JSON.stringify(phaseResult.status)})`);
  }
  if (phaseResult.needs_human !== false) {
    errors.push("phase needs_human must be false before completion");
  }
}

function checkEvidence(phaseResult, baseDir, warnings, checked) {
  checked.push("red-green-evidence");
  const redPath = phaseResult.tests?.red?.path ?? phaseResult.artifact_paths?.red;
  const greenPath = phaseResult.tests?.green?.path ?? phaseResult.artifact_paths?.green;
  const red = readArtifact(baseDir, redPath, "RED", warnings);
  const green = readArtifact(baseDir, greenPath, "GREEN", warnings);

  if (red && (!Number.isInteger(red.data.exit_code) || red.data.exit_code === 0)) {
    warnings.push(`RED evidence exit_code is not non-zero (got ${JSON.stringify(red.data.exit_code)})`);
  }
  if (green && green.data.exit_code !== 0) {
    warnings.push(`GREEN evidence exit_code is not 0 (got ${JSON.stringify(green.data.exit_code)})`);
  }
}

function scanObjectFromArtifactOrInline(phaseResult, baseDir, errors) {
  const path = phaseResult.diff_scan?.path ?? phaseResult.artifact_paths?.diff;
  if (path) {
    if (typeof path !== "string" || isAbsolute(path) || path.includes("\\") || path.split("/").some((part) => !part || part === "." || part === "..")) {
      errors.push("diff scan artifact ref must be task-relative");
      return null;
    }
    const resolved = resolve(baseDir, path);
    if (existsSync(resolved)) {
      const rel = relative(realpathSync(baseDir), realpathSync(resolved));
      if (!rel || rel.startsWith("..") || isAbsolute(rel)) {
        errors.push("diff scan artifact ref must stay inside the task root");
        return null;
      }
    }
    const artifact = readArtifact(baseDir, path, "diff scan", errors);
    if (artifact) return artifact.data;
  }
  return phaseResult.diff_scan ?? null;
}

function checkDiffScan(phaseResult, baseDir, errors, checked) {
  checked.push("diff-scan");
  const scan = scanObjectFromArtifactOrInline(phaseResult, baseDir, errors);
  if (!scan || typeof scan !== "object") {
    errors.push("diff scan result missing");
    return null;
  }

  if (scan.safe !== true) {
    errors.push("diff scan safe must be true");
  }
  for (const key of ["violations", "c2_violations", "allowlist_violations"]) {
    if (!Array.isArray(scan[key])) {
      errors.push(`diff scan ${key} must be an array`);
      continue;
    }
    const violations = scan[key];
    if (violations.length > 0) {
      errors.push(`diff scan ${key} must be empty (got ${violations.length})`);
    }
  }
  return scan;
}

function checkReview(phaseResult, scan, worktreeRoot, errors, warnings, checked, options = {}) {
  checked.push("heterogeneous-review");
  const review = phaseResult.review;
  if (!review || typeof review !== "object") {
    errors.push("review result missing");
    return;
  }
  if (!options.reviewDataRoot) { errors.push("review data root missing; pass --review-data-root explicitly"); return; }
  try {
    if (!scan) throw new Error("phase diff evidence is unavailable");
    const subject = validatePhaseReviewEvidence({ phaseResult, scan, sourceRoot: worktreeRoot, phaseId: phaseResult.phase_id });
    const ref = review.action_ref ?? review.result_ref;
    if (!nonEmptyString(ref) || isAbsolute(ref) || ref.includes("\\") || ref.split("/").some((part) => !part || part === "." || part === "..")) {
      throw new Error("phase review action ref must be task-relative");
    }
    const root = resolve(options.reviewDataRoot);
    const path = resolve(root, ...ref.split("/"));
    const rel = relative(root, path);
    if (!rel || rel.startsWith("..") || isAbsolute(rel) || !existsSync(path)) throw new Error("phase review action is missing or outside the review data root");
    const action = readJson(path);
    const unavailable = action?.version === "wh-review-attempt.v1" && action.terminal_status === "unavailable";
    const semantic = action?.version === "wh-review-result.v1" && ["pass", "revise_required"].includes(action.verdict);
    if (!semantic && !unavailable) throw new Error("phase review action is neither a semantic result nor an unavailable provider attempt");
    if (action.stage !== (options.reviewStage ?? "build-code") || (action.review_track ?? null) !== null) throw new Error("phase review stage/track mismatch");
    if (action.subject_kind !== "phase" || typeof action.phase_id !== "string") throw new Error("phase review identity is missing");
    if (action.phase_id !== subject.phaseId) throw new Error(`phase review identity mismatch: expected ${subject.phaseId}`);
    if (action.base_tree !== subject.baseTree || action.candidate_tree !== subject.candidateTree
      || action.snapshot_tree !== subject.candidateTree || review.snapshot_tree !== subject.candidateTree) {
      throw new Error("phase review tree mismatch: identity does not match the Phase evidence");
    }
    const liveTree = captureGitWorktreeSnapshot(worktreeRoot).tree;
    if (liveTree !== subject.candidateTree) throw new Error("live Workspace tree changed after Phase review");
    if (unavailable) {
      if (!action.error || !Array.isArray(action.provider_attempts) || action.provider_attempts.length === 0) {
        throw new Error("unavailable Phase review attempt is incomplete");
      }
      if ((review.risk_acceptances ?? []).length) throw new Error("unavailable Phase review cannot use risk acceptance");
      warnings.push("review provider attempt is authenticated as unavailable; it remains a quality fact and is not rewritten to pass");
    } else if (action.verdict === "revise_required") {
      const pause = deriveSeriousReviewPause({
        taskId: action.task_id, stage: action.stage, reviewRef: ref,
        reviewHash: createHash("sha256").update(readFileSync(path)).digest("hex"), result: action,
      });
      if (pause.status === "paused") {
        if (!Array.isArray(review.risk_acceptances) || review.risk_acceptances.length === 0) {
          throw new Error("actionable serious Phase findings require repair or exact risk acceptance");
        }
        const records = review.risk_acceptances.map((binding) => {
          if (!binding || typeof binding !== "object" || Array.isArray(binding)
            || Object.keys(binding).sort().join(",") !== "ref,sha256"
            || !/^evidence\/risk-acceptances\/([a-f0-9]{64})\.json$/.test(binding.ref ?? "")
            || !/^[a-f0-9]{64}$/.test(binding.sha256 ?? "")
            || binding.ref.match(/^evidence\/risk-acceptances\/([a-f0-9]{64})\.json$/)[1] !== binding.sha256) {
            throw new Error("Phase risk acceptance binding is invalid");
          }
          const acceptancePath = taskPath(root, binding.ref, "Phase risk acceptance");
          let acceptanceRaw;
          try { acceptanceRaw = readFileSync(acceptancePath, "utf8"); }
          catch { throw new Error("Phase risk acceptance record is missing"); }
          if (createHash("sha256").update(acceptanceRaw).digest("hex") !== binding.sha256) {
            throw new Error("Phase risk acceptance hash mismatch");
          }
          return JSON.parse(acceptanceRaw);
        });
        const runIds = new Set(records.map((value) => value?.workflow_run_id));
        const workflowRunId = [...runIds][0];
        if (runIds.size !== 1 || !nonEmptyString(workflowRunId)) {
          throw new Error("Phase risk acceptances do not bind one review run");
        }
        const exactPause = deriveSeriousReviewPause({
          taskId: action.task_id, stage: action.stage, reviewRef: ref,
          reviewHash: createHash("sha256").update(readFileSync(path)).digest("hex"),
          result: action, workflowRunId,
        });
        validateRiskAcceptanceSet({ acceptances: records, pause: exactPause });
        for (const value of records) {
          const finding = exactPause.findings.find(({ finding_id: findingId }) => findingId === value.finding_id);
          const cardRaw = readFileSync(taskPath(root, value.card_ref, "Phase risk card"), "utf8");
          const replyRaw = readFileSync(taskPath(root, value.reply_ref, "Phase risk reply"), "utf8");
          if (cardRaw !== `${JSON.stringify(finding, null, 2)}\n`
            || createHash("sha256").update(replyRaw).digest("hex") !== value.reply_hash) {
            throw new Error("Phase risk acceptance card/reply binding mismatch");
          }
        }
      }
      warnings.push("review verdict revise_required is preserved as a quality fact; structural Phase evidence remains valid");
    }
  }
  catch (error) { errors.push(`review is not a formal result: ${error.message}`); }
}

export function validatePhaseGate(phaseResult, worktreeRoot, options = {}) {
  const errors = [];
  const warnings = [];
  const checked = [];
  const baseDir = options.baseDir ?? worktreeRoot;

  checkStatus(phaseResult, errors, checked);
  checkEvidence(phaseResult, baseDir, warnings, checked);
  const scan = checkDiffScan(phaseResult, baseDir, errors, checked);
  checkReview(phaseResult, scan, worktreeRoot, errors, warnings, checked, options);

  return { ok: errors.length === 0, errors, warnings, checked };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  const [phaseResultPath, worktreeRootArg, ...flags] = process.argv.slice(2);
  const reviewDataFlag = flags.find((value) => value.startsWith("--review-data-root="));
  if (flags.some((value) => !value.startsWith("--review-data-root=")) || flags.filter((value) => value.startsWith("--review-data-root=")).length > 1) {
    console.error("Usage: node scripts/phase-gate.mjs <phase-result-json> <worktree-root> [--review-data-root=<absolute-path>]");
    process.exit(2);
  }
  const reviewDataRoot = reviewDataFlag?.slice("--review-data-root=".length);
  if (!phaseResultPath || !worktreeRootArg) {
    console.error("Usage: node scripts/phase-gate.mjs <phase-result-json> <worktree-root> [--review-data-root=<absolute-path>]");
    process.exit(2);
  }
  if (reviewDataRoot !== undefined && !isAbsolute(reviewDataRoot)) {
    console.error("[phase-gate] FAIL: --review-data-root must be absolute");
    process.exit(2);
  }

  const resolvedPhaseResultPath = resolve(phaseResultPath);
  let phaseResult;
  try {
    phaseResult = readJson(resolvedPhaseResultPath);
  } catch (err) {
    console.error(`[phase-gate] FAIL: cannot read phase result: ${err.message}`);
    process.exit(2);
  }

  const result = validatePhaseGate(phaseResult, resolve(worktreeRootArg), {
    baseDir: dirname(resolvedPhaseResultPath),
    ...(reviewDataRoot ? { reviewDataRoot } : {}),
  });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}
