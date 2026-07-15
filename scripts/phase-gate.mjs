#!/usr/bin/env node
/**
 * phase-gate.mjs
 *
 * Minimal phase completion fact check for build-code sub-phases. This is not a
 * broad quality gate: it only checks failure modes that have already occurred
 * in this workflow (missing RED/GREEN evidence, non-independent review, and
 * incomplete public review publication).
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
    return;
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
}

function checkReview(phaseResult, baseDir, errors, checked, options = {}) {
  checked.push("heterogeneous-review");
  const review = phaseResult.review;
  if (!review || typeof review !== "object") {
    errors.push("review result missing");
    return;
  }
  const allowed = new Set(["core_receipt_hash", "semantic_verdict", "needs_human"]);
  if (Array.isArray(review) || Object.keys(review).some((key) => !allowed.has(key))
    || !/^[a-f0-9]{64}$/.test(review.core_receipt_hash ?? "")
    || !["pass", "revise_required", "escalate_to_human"].includes(review.semantic_verdict)
    || typeof review.needs_human !== "boolean") {
    errors.push("review must contain only core_receipt_hash, semantic_verdict, and needs_human");
    return;
  }
  if (review.semantic_verdict !== "pass" || review.needs_human !== false) {
    errors.push("review must be a published pass with needs_human:false");
    return;
  }
  const coreRoot = resolve(options.publicReviewRoot ?? join(baseDir, "reviews", "core-receipts"));
  const corePath = join(coreRoot, `${review.core_receipt_hash}.json`);
  if (!existsSync(corePath)) {
    errors.push("public core receipt is missing for review.core_receipt_hash");
    return;
  }
  const bytes = readFileSync(corePath);
  if (createHash("sha256").update(bytes).digest("hex") !== review.core_receipt_hash) {
    errors.push("public core receipt hash does not match review.core_receipt_hash");
    return;
  }
  let core;
  try { core = JSON.parse(bytes); }
  catch { errors.push("public core receipt is invalid JSON"); return; }
  if (core.semantic_verdict !== review.semantic_verdict || core.needs_human !== review.needs_human) {
    errors.push("public core receipt semantic tuple does not match review");
  }
}

function checkProjectionGuards(baseDir, errors, checked) {
  checked.push("projection-recovery");
  const reviews = resolve(baseDir, "reviews");
  if (!existsSync(reviews)) return;
  const guards = readdirSync(reviews).filter((name) => /^projection-pending-.*\.json$/.test(name));
  for (const name of guards) {
    const path = join(reviews, name);
    try {
      const guard = JSON.parse(readFileSync(path, "utf8"));
      if (guard?.status !== "pending" || guard?.needs_human !== true) throw new Error("invalid guard shape");
      errors.push(`PROJECTION_PENDING: public projection recovery is required (${name})`);
    } catch (error) {
      errors.push(`PROJECTION_RECOVERY_GUARD_INVALID: ${name}: ${error.message}`);
    }
  }
}

export function validatePhaseGate(phaseResult, worktreeRoot, options = {}) {
  const errors = [];
  const warnings = [];
  const checked = [];
  const baseDir = options.baseDir ?? worktreeRoot;

  checkStatus(phaseResult, errors, checked);
  checkEvidence(phaseResult, baseDir, errors, checked);
  checkDiffScan(phaseResult, baseDir, errors, checked);
  checkProjectionGuards(baseDir, errors, checked);
  checkReview(phaseResult, baseDir, errors, checked, options);

  return { ok: errors.length === 0, errors, warnings, checked };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  const [phaseResultPath, worktreeRootArg] = process.argv.slice(2);
  if (!phaseResultPath || !worktreeRootArg) {
    console.error("Usage: node scripts/phase-gate.mjs <phase-result-json> <worktree-root>");
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
  });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}
