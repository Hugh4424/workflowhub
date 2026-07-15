#!/usr/bin/env node
/**
 * validate-stage-result.mjs — M6 Phase 2 (FR-CONTRACT-001/002 / D11).
 *
 * Validates a stage-result artifact in two steps:
 *   1. Top-level contract: contracts/stage-result.contract.json (seven required fields + types).
 *   2. Per-stage facts sub-schema: contracts/facts-subschema.json (each stage's required_keys,
 *      each value must be non-empty: non-empty string, non-empty array, or truthy non-object).
 *
 * Exports: validateStageResult(stage, artifact) -> { ok: boolean, errors: string[] }
 * CLI:     node scripts/validate-stage-result.mjs <stage> <artifact-json-path>
 *
 * No AJV — hand-written validator consistent with core/validate-contract.mjs (FR-NC-004).
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, isAbsolute, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { validateContract } from "../core/validate-contract.mjs";
import { verifyAuditCarrier } from "../core/audit-summary-carrier.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

// Load contracts once at module level (cached for repeated test use)
const stageResultContract = JSON.parse(
  readFileSync(resolve(repoRoot, "contracts", "stage-result.contract.json"), "utf8")
);
const factsSubschema = JSON.parse(
  readFileSync(resolve(repoRoot, "contracts", "facts-subschema.json"), "utf8")
);

/**
 * Returns true if a facts value is considered "non-empty":
 *   - non-empty string
 *   - non-empty array (length > 0)
 *   - any other truthy value (number, boolean true, object with keys, etc.)
 * Returns false for: "", [], null, undefined, 0, false, {}
 */
function isNonEmpty(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  // number, boolean — truthy wins
  return Boolean(value);
}

/**
 * validateStageResult(stage, artifact) -> { ok: boolean, errors: string[] }
 *
 * Step 1: validates artifact against stage-result.contract.json.
 * Step 2: validates artifact.facts against the per-stage facts sub-schema.
 *
 * additionalProperties in facts are allowed — only the agreed required_keys are enforced.
 */
export function validateStageResult(stage, artifact) {
  const errors = [];

  // Step 1: top-level stage-result contract
  const contractResult = validateContract(artifact, stageResultContract);
  if (!contractResult.valid) {
    return { ok: false, errors: contractResult.errors };
  }

  // Step 2: per-stage facts sub-schema
  const stageSchema = factsSubschema.stages[stage];
  if (!stageSchema) {
    errors.push(`unknown stage: "${stage}" — not defined in facts-subschema.json`);
    return { ok: false, errors };
  }

  const facts = artifact.facts;
  for (const key of stageSchema.required_keys) {
    if (!(key in facts)) {
      errors.push(`facts missing required key for stage "${stage}": "${key}"`);
    } else if (!isNonEmpty(facts[key])) {
      errors.push(
        `facts["${key}"] for stage "${stage}" must be non-empty (got ${JSON.stringify(facts[key])})`
      );
    }
  }

  // V1 results are explicit audit consumers. Older receipts remain readable
  // during cutover, but never become an invented quality verdict.
  const auditCarrier = verifyAuditCarrier(facts);
  if (!auditCarrier.ok) errors.push(...auditCarrier.errors);

  if (stage === "build-code") {
    for (const key of ["worktree_root", "task_tracking_root"]) {
      if (key in facts && (typeof facts[key] !== "string" || !isAbsolute(facts[key]))) {
        errors.push(`facts["${key}"] for stage "build-code" must be an absolute path string`);
      }
    }
    if (facts.review && typeof facts.review === "object" && !Array.isArray(facts.review)) {
      const review = facts.review;
      const publishedKeys = new Set(["core_receipt_hash", "semantic_verdict", "needs_human"]);
      const pendingKeys = new Set(["status", "needs_human", "legacy_original_sha256", "legacy_original_ref", "diagnostic"]);
      const isPendingLegacy = review.status === "pending_legacy_review";
      if (isPendingLegacy) {
        if (Object.keys(review).some((key) => !pendingKeys.has(key))
          || review.needs_human !== true
          || !/^[a-f0-9]{64}$/.test(review.legacy_original_sha256 ?? "")
          || typeof review.legacy_original_ref !== "string"
          || review.legacy_original_ref.trim() === ""
          || typeof review.diagnostic !== "string"
          || review.diagnostic.trim() === ""
          || artifact.status !== "unknown"
          || artifact.user_decision !== true) {
          errors.push(`facts["review"] pending_legacy_review requires only status, needs_human:true, legacy_original_sha256, legacy_original_ref, diagnostic, plus stage status unknown and user_decision:true`);
        }
      } else if (Object.keys(review).some((key) => !publishedKeys.has(key))
        || !/^[a-f0-9]{64}$/.test(review.core_receipt_hash ?? "")
        || !["pass", "revise_required", "escalate_to_human"].includes(review.semantic_verdict)
        || typeof review.needs_human !== "boolean") {
        errors.push(`facts["review"] for stage "build-code" must be published {core_receipt_hash, semantic_verdict, needs_human} or explicit pending_legacy_review diagnostic`);
      }
    } else if ("review" in facts) {
      errors.push(`facts["review"] for stage "build-code" must be an object`);
    }
    if (facts.phase_completion && typeof facts.phase_completion === "object" && !Array.isArray(facts.phase_completion)) {
      const phaseCompletion = facts.phase_completion;
      if (Object.keys(phaseCompletion).some((key) => key !== "phase_records")) {
        errors.push(`facts["phase_completion"] for stage "build-code" must contain only phase_records`);
      }
      const phaseRecords = Array.isArray(phaseCompletion.phase_records)
        ? phaseCompletion.phase_records
        : null;
      if (!phaseRecords) {
        errors.push(`facts["phase_completion"].phase_records for stage "build-code" must be an array`);
      }
      const validPhaseRecords = (phaseRecords ?? []).filter((record) => {
        if (!record || typeof record !== "object" || Array.isArray(record)) return false;
        const canonical = Object.keys(record).length === 2
          && Object.keys(record).every((key) => key === "phase_id" || key === "changed");
        const migrated = Object.keys(record).every((key) => ["phase_id", "changed", "evidence_status", "provenance"].includes(key))
          && Object.keys(record).length === 4
          && ["legacy_commit_only", "canonical_report_missing"].includes(record.evidence_status)
          && record.provenance
          && typeof record.provenance === "object"
          && !Array.isArray(record.provenance)
          && Object.keys(record.provenance).length === 4
          && Object.keys(record.provenance).every((key) => ["source", "commit_sha", "original_sha256", "original_ref"].includes(key))
          && record.provenance.source === "legacy_commit_record"
          && /^[a-f0-9]{40}$/.test(record.provenance.commit_sha ?? "")
          && /^[a-f0-9]{64}$/.test(record.provenance.original_sha256 ?? "")
          && typeof record.provenance.original_ref === "string"
          && record.provenance.original_ref.trim() !== "";
        return (canonical || migrated)
          && typeof record.phase_id === "string"
          && record.phase_id.trim() !== ""
          && typeof record.changed === "boolean";
      });
      if ((phaseRecords?.length ?? 0) === 0) {
        errors.push(`facts["phase_completion"] for stage "build-code" must include at least one phase_records entry`);
      }
      if (phaseRecords && validPhaseRecords.length !== phaseRecords.length) {
        errors.push(`facts["phase_completion"].phase_records entries must be canonical {phase_id,changed} or provenance-bound legacy migration records`);
      }
    } else if ("phase_completion" in facts) {
      errors.push(`facts["phase_completion"] for stage "build-code" must be an object`);
    }
  }

  if (stage === "verify-code") {
    if (!("audit_summary_ref" in facts)) {
      errors.push(`facts missing required key for stage "verify-code": "audit_summary_ref"`);
    } else if (
      typeof facts.audit_summary_ref !== "string" ||
      facts.audit_summary_ref.trim() === "" ||
      !facts.audit_summary_ref.endsWith(".json")
    ) {
      errors.push(`facts["audit_summary_ref"] for stage "verify-code" must be a non-empty JSON artifact path`);
    }
    if (!("audit_verdict" in facts)) {
      errors.push(`facts missing required key for stage "verify-code": "audit_verdict"`);
    } else if (!new Set(["pass", "fail"]).has(facts.audit_verdict)) {
      errors.push(`facts["audit_verdict"] for stage "verify-code" must be pass or fail`);
    }
    if (!("audit_summary_hash" in facts)) {
      errors.push(`facts missing required key for stage "verify-code": "audit_summary_hash"`);
    } else if (typeof facts.audit_summary_hash !== "string" || !/^[a-f0-9]{64}$/.test(facts.audit_summary_hash)) {
      errors.push(`facts["audit_summary_hash"] for stage "verify-code" must be a lowercase 64-hex SHA-256`);
    }
    // Audit ownership remains upstream: validate the receipt fields only; never
    // parse the summary or recompute/override its verdict here.
  }

  return { ok: errors.length === 0, errors };
}

/** Only a current published semantic pass may authorize merge/finalization. */
export function isBuildCodeMergeAuthorizing(artifact) {
  const review = artifact?.facts?.review;
  return artifact?.status === "success"
    && review
    && typeof review === "object"
    && Object.keys(review).length === 3
    && review.semantic_verdict === "pass"
    && review.needs_human === false
    && /^[a-f0-9]{64}$/.test(review.core_receipt_hash ?? "");
}

/**
 * getRealChangedFiles(worktreeRoot, baseRef) -> string[]
 *
 * Runs `git diff --name-only` in the given worktree directory. By default,
 * compares the working tree against HEAD. When baseRef is supplied, uses
 * triple-dot diff so committed stage work is compared against the merge-base
 * of the target ref and HEAD.
 */
function normalizeGitPath(file) {
  return file.replaceAll("\\", "/");
}

function ignoredReceiptPath(worktreeRoot, stageResultPath) {
  if (!stageResultPath) return null;
  const rel = normalizeGitPath(relative(worktreeRoot, stageResultPath));
  if (!rel || rel === ".." || rel.startsWith("../") || isAbsolute(rel)) return null;
  return rel;
}

function pathspecArgs(ignoredPath) {
  const excludes = [
    ":(glob,exclude)tasks/**/stage-result-*.json",
    ":(glob,exclude)tasks/**/reviews/**",
  ];
  if (ignoredPath) excludes.push(`:(exclude)${ignoredPath}`);
  return ["--", ".", ...excludes];
}

function isReceiptBookkeepingPath(file, ignoredPath) {
  return (
    file === ignoredPath ||
    /^tasks\/[^/]+\/stage-result-[^/]+\.json$/.test(file) ||
    /^tasks\/[^/]+\/reviews\//.test(file)
  );
}

export function getRealChangedFiles(worktreeRoot, baseRef = process.env.WORKFLOWHUB_DIFF_BASE ?? "HEAD", options = {}) {
  const ignoredPath = options.ignoredPath ?? null;
  const baseOutput =
    baseRef === "HEAD"
      ? ""
      : execFileSync("git", ["diff", "--name-only", `${baseRef}...HEAD`, ...pathspecArgs(ignoredPath)], {
          cwd: worktreeRoot,
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        });
  const worktreeOutput = execFileSync("git", ["diff", "--name-only", "HEAD", ...pathspecArgs(ignoredPath)], {
    cwd: worktreeRoot,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  const untrackedOutput = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
    cwd: worktreeRoot,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  const files = new Set();
  for (const line of `${baseOutput}\n${worktreeOutput}\n${untrackedOutput}`.split("\n")) {
    const file = line.trim();
    if (isReceiptBookkeepingPath(file, ignoredPath)) continue;
    if (file) files.add(file);
  }
  return [...files].sort();
}

function getDiffSha(worktreeRoot, baseRef = process.env.WORKFLOWHUB_DIFF_BASE ?? "HEAD", options = {}) {
  const ignoredPath = options.ignoredPath ?? null;
  const baseDiff =
    baseRef === "HEAD"
      ? ""
      : execFileSync("git", ["diff", `${baseRef}...HEAD`, ...pathspecArgs(ignoredPath)], {
          cwd: worktreeRoot,
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        });
  const worktreeDiff = execFileSync("git", ["diff", "HEAD", ...pathspecArgs(ignoredPath)], {
    cwd: worktreeRoot,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  const untrackedFiles = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
    cwd: worktreeRoot,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  })
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => !isReceiptBookkeepingPath(line, ignoredPath))
    .filter(Boolean)
    .sort();
  const untrackedPayload = untrackedFiles
    .map((file) => {
      const content = readFileSync(resolve(worktreeRoot, file));
      const hash = createHash("sha256").update(content).digest("hex");
      return `${file}\0${hash}`;
    })
    .join("\n");
  return createHash("sha256")
    .update(baseDiff)
    .update("\n--worktree--\n")
    .update(worktreeDiff)
    .update("\n--untracked--\n")
    .update(untrackedPayload)
    .digest("hex");
}

function verifyTestResultLog(stage, facts) {
  const errors = [];
  if (facts.test_not_applicable === true) return errors;
  if (typeof facts.test_result_log !== "string" || facts.test_result_log.trim() === "") {
    errors.push(`stage "${stage}" missing facts.test_result_log`);
    return errors;
  }

  let raw;
  try {
    raw = readFileSync(resolve(facts.test_result_log.trim()), "utf8");
  } catch (err) {
    errors.push(`stage "${stage}" cannot read test_result_log: ${err.message}`);
    return errors;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed.stage && parsed.stage !== stage) {
      errors.push(
        `stage "${stage}" test_result_log is for wrong stage "${parsed.stage}"`
      );
    }
    if (!("exit_code" in parsed)) {
      errors.push(`stage "${stage}" test_result_log missing exit_code`);
    } else if (parsed.exit_code !== 0) {
      errors.push(
        `stage "${stage}" test_result_log exit_code must be 0 (got ${parsed.exit_code})`
      );
    }
    const hasStdout =
      typeof parsed.stdout === "string" ||
      (typeof parsed.stdout_path === "string" && existsSync(resolve(parsed.stdout_path)));
    const hasStderr =
      typeof parsed.stderr === "string" ||
      (typeof parsed.stderr_path === "string" && existsSync(resolve(parsed.stderr_path)));
    if (!hasStdout) {
      errors.push(`stage "${stage}" test_result_log missing stdout evidence`);
    }
    if (!hasStderr) {
      errors.push(`stage "${stage}" test_result_log missing stderr evidence`);
    }
  } catch {
    errors.push(`stage "${stage}" test_result_log must be structured JSON evidence`);
  }

  return errors;
}

/**
 * verifyReceipts(stage, stageResultPath, worktreeRoot)
 *   -> { ok: boolean, errors: string[], changed: string[] }
 *
 * Reads the stage-result JSON from stageResultPath, compares facts.changed
 * against the real git diff from the worktree, and returns a receipt check.
 *
 * Fails (ok=false) if:
 *   - stage-result has no facts.changed AND no no_code_change:true
 *   - Actual diff files don't match declared changed files
 */
export function verifyReceipts(stage, stageResultPath, worktreeRoot, options = {}) {
  const errors = [];
  const baseRef = options.baseRef ?? process.env.WORKFLOWHUB_DIFF_BASE ?? "HEAD";
  const ignoredPath = ignoredReceiptPath(worktreeRoot, stageResultPath);

  // Read and parse stage-result
  let stageResult;
  try {
    const raw = readFileSync(stageResultPath, "utf8");
    stageResult = JSON.parse(raw);
  } catch (err) {
    return { ok: false, errors: [`Failed to read stage-result: ${err.message}`], changed: [] };
  }

  // Get real changed files from git
  let realChanged;
  try {
    realChanged = getRealChangedFiles(worktreeRoot, baseRef, { ignoredPath });
  } catch (err) {
    return {
      ok: false,
      errors: [`stage "${stage}" cannot collect git diff evidence: ${err.message}`],
      changed: [],
    };
  }

  const facts = stageResult.facts ?? {};

  if (
    typeof stageResult.stage === "string" &&
    stageResult.stage.trim() !== "" &&
    stageResult.stage !== stage
  ) {
    errors.push(
      `stage "${stage}" stage-result is for wrong stage "${stageResult.stage}"`
    );
    return { ok: false, errors, changed: realChanged };
  }

  // No changes declared at all
  if (!("changed" in facts) && !facts.no_code_change) {
    errors.push(
      `stage "${stage}" has no facts.changed and no no_code_change:true — cannot verify receipt`
    );
    return { ok: false, errors, changed: realChanged };
  }

  // no_code_change: true — no changes expected
  if (facts.no_code_change) {
    if (realChanged.length > 0) {
      errors.push(
        `stage "${stage}" declares no_code_change:true but git diff has changes: ${realChanged.join(", ")}`
      );
      return { ok: false, errors, changed: realChanged };
    }
    return { ok: true, errors: [], changed: realChanged };
  }

  // facts.changed declared
  const declared = facts.changed ?? [];

  // Check: declared must be a non-empty array
  if (!Array.isArray(declared) || declared.length === 0) {
    errors.push(
      `stage "${stage}" facts.changed must be a non-empty array (got ${JSON.stringify(declared)})`
    );
    return { ok: false, errors, changed: realChanged };
  }

  // Check: declared must match real diff
  const declaredSorted = [...declared].sort();
  const realSorted = [...realChanged].sort();
  if (JSON.stringify(declaredSorted) !== JSON.stringify(realSorted)) {
    errors.push(
      `stage "${stage}" declared changed files do not match git diff — declared: [${declaredSorted.join(", ")}], actual: [${realSorted.join(", ")}]`
    );
    return { ok: false, errors, changed: realChanged };
  }

  if (typeof facts.diff_sha !== "string" || facts.diff_sha.trim() === "") {
    errors.push(`stage "${stage}" missing facts.diff_sha`);
    return { ok: false, errors, changed: realChanged };
  }
  let actualDiffSha;
  try {
    actualDiffSha = getDiffSha(worktreeRoot, baseRef, { ignoredPath });
  } catch (err) {
    errors.push(`stage "${stage}" cannot compute git diff sha: ${err.message}`);
    return { ok: false, errors, changed: realChanged };
  }
  if (facts.diff_sha !== actualDiffSha) {
    errors.push(
      `stage "${stage}" facts.diff_sha does not match git diff sha — declared: ${facts.diff_sha}, actual: ${actualDiffSha}`
    );
    return { ok: false, errors, changed: realChanged };
  }

  errors.push(...verifyTestResultLog(stage, facts));
  if (errors.length > 0) {
    return { ok: false, errors, changed: realChanged };
  }

  return { ok: true, errors: [], changed: realChanged };
}

// ── CLI entry ─────────────────────────────────────────────────────────────────

const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  const [stage, artifactPath, worktreeRootArg, baseRefArg] = process.argv.slice(2);

  if (!stage || !artifactPath) {
    console.error(
      "Usage: node scripts/validate-stage-result.mjs <stage> <artifact-json-path> [worktree-root] [base-ref]"
    );
    console.error("Stages: make-decision, build-spec, build-plan, build-code, verify-code");
    process.exit(2);
  }

  let artifact;
  try {
    artifact = JSON.parse(readFileSync(resolve(artifactPath), "utf8"));
  } catch (err) {
    console.error(`[validate-stage-result] Failed to read artifact: ${err.message}`);
    process.exit(2);
  }

  const result = validateStageResult(stage, artifact);
  if (result.ok && worktreeRootArg) {
    const receiptResult = verifyReceipts(
      stage,
      resolve(artifactPath),
      resolve(worktreeRootArg),
      baseRefArg ? { baseRef: baseRefArg } : {}
    );
    if (!receiptResult.ok) {
      result.ok = false;
      result.errors = receiptResult.errors;
    }
  }
  if (result.ok) {
    console.log(`[validate-stage-result] PASS — stage "${stage}" artifact valid`);
    process.exit(0);
  } else {
    for (const e of result.errors) {
      console.error(`[validate-stage-result] FAIL: ${e}`);
    }
    process.exit(1);
  }
}
