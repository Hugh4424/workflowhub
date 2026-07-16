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
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readReviewResult } from "../core/review-result-consumer.mjs";
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

function checkEvidence(phaseResult, baseDir, errors, checked) {
  checked.push("red-green-evidence");
  const redPath = phaseResult.tests?.red?.path ?? phaseResult.artifact_paths?.red;
  const greenPath = phaseResult.tests?.green?.path ?? phaseResult.artifact_paths?.green;
  const red = readArtifact(baseDir, redPath, "RED", errors);
  const green = readArtifact(baseDir, greenPath, "GREEN", errors);

  if (red && (!Number.isInteger(red.data.exit_code) || red.data.exit_code === 0)) {
    errors.push(`RED evidence exit_code must be non-zero (got ${JSON.stringify(red.data.exit_code)})`);
  }
  if (green && green.data.exit_code !== 0) {
    errors.push(`GREEN evidence exit_code must be 0 (got ${JSON.stringify(green.data.exit_code)})`);
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

function checkReview(phaseResult, scan, worktreeRoot, errors, checked, options = {}) {
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
    const { result } = readReviewResult(review, resolve(options.reviewDataRoot), { stage: options.reviewStage ?? "build-code", track: null, requirePass: true });
    if (result.subject_kind !== "phase" || typeof result.phase_id !== "string") throw new Error("phase review identity is missing");
    if (result.phase_id !== subject.phaseId) throw new Error(`phase review identity mismatch: expected ${subject.phaseId}`);
    if (result.base_tree !== subject.baseTree || result.candidate_tree !== subject.candidateTree) throw new Error("phase review tree identity mismatch");
  }
  catch (error) { errors.push(`review is not a formal passing result: ${error.message}`); }
}

export function validatePhaseGate(phaseResult, worktreeRoot, options = {}) {
  const errors = [];
  const warnings = [];
  const checked = [];
  const baseDir = options.baseDir ?? worktreeRoot;

  checkStatus(phaseResult, errors, checked);
  checkEvidence(phaseResult, baseDir, errors, checked);
  const scan = checkDiffScan(phaseResult, baseDir, errors, checked);
  checkReview(phaseResult, scan, worktreeRoot, errors, checked, options);

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
