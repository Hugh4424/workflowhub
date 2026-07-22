import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

import { captureWorkspaceSnapshot } from "../../core/canonical-receipt-writer.mjs";
import { assertTaskHandle, assertTaskKernel } from "../../core/task-handle.mjs";
import { assertWorkspace } from "../../core/workspace.mjs";
import { validateSchema } from "../../skills/wh-review/scripts/schema-validator.mjs";
import { validatePhaseReviewEvidence } from "../../skills/wh-review/scripts/phase-review-subject.mjs";
import { createPhaseDiffScan } from "./diff-scanner.mjs";

const HASH = /^[a-f0-9]{64}$/;
const OID = /^[a-f0-9]{40,64}$/;
const PHASE = /^[A-Za-z0-9._-]+$/;
const REOPEN = /^results\/build-code\/revisions\/reopen-[0-9]{4}\.json$/;
const INPUT_KEYS = new Set([
  "phase_id", "implementation_receipt_ref", "green_test_receipt_ref",
  "red_evidence_ref", "previous_phase_review_ref", "allowed_files", "review_result_ref", "reopen_ref",
]);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonical = (value) => `${JSON.stringify(value, null, 2)}\n`;

function safeRef(value, pattern, label) {
  if (typeof value !== "string" || !pattern.test(value) || value.includes("..")) throw new TypeError(`${label} is invalid`);
  return value;
}

function readJson(task, ref, label) {
  let raw;
  try { raw = task.readRecord(ref); }
  catch (error) { throw new Error(`${label} is missing: ${ref}: ${error.message}`); }
  try { return { raw, value: JSON.parse(raw), hash: sha256(raw) }; }
  catch { throw new Error(`${label} is not valid JSON: ${ref}`); }
}

function readImplementation(task, ref) {
  safeRef(ref, /^receipts\/(?:implementation\.json|revisions\/implementation\/[A-Za-z0-9._-]+\.json)$/, "implementation_receipt_ref");
  const receipt = readJson(task, ref, "implementation receipt");
  const value = receipt.value;
  if (value?.schema_version !== "workflowhub-receipt.v1" || value.task_id !== task.identity.taskId
    || value.stage !== "build-code" || value.producer?.stage !== "build-code"
    || value.producer?.component !== "implementation" || !OID.test(value.snapshot_tree ?? "")
    || !OID.test(value.snapshot_commit ?? "")) throw new Error("implementation receipt provenance is invalid");
  return receipt;
}

function readTestReceipt(task, ref, { green }) {
  safeRef(ref, /^receipts\/[A-Za-z0-9._/-]+\.json$/, green ? "green_test_receipt_ref" : "red_evidence_ref");
  const receipt = readJson(task, ref, green ? "GREEN test receipt" : "RED test receipt");
  const value = receipt.value;
  if (value?.schema_version !== "workflowhub-receipt.v1" || value.task_id !== task.identity.taskId
    || value.stage !== "build-code" || value.producer?.stage !== "build-code"
    || value.producer?.component !== "build-code-test-capture"
    || !OID.test(value.snapshot_tree ?? "") || !OID.test(value.snapshot_commit ?? "") || !Number.isInteger(value.exit_code)
    || (green ? value.exit_code !== 0 : value.exit_code === 0)) {
    throw new Error(`${green ? "GREEN" : "RED"} test receipt provenance is invalid`);
  }
  safeRef(value.output_ref, /^evidence\/[A-Za-z0-9._/-]+$/, "test output_ref");
  if (!HASH.test(value.output_hash ?? "") || sha256(task.readRecord(value.output_ref)) !== value.output_hash) {
    throw new Error(`${green ? "GREEN" : "RED"} test output hash mismatch`);
  }
  return receipt;
}

function readFormalPhaseReview(task, ref, expected, { requirePass = false } = {}) {
  safeRef(ref, /^reviews\/results\/[A-Za-z0-9._-]+\.json$/, "review result ref");
  const review = readJson(task, ref, "formal phase review result");
  validateSchema("result", review.value);
  const value = review.value;
  if (value.task_id !== task.identity.taskId || value.stage !== "build-code"
    || value.subject_kind !== "phase" || value.phase_id !== expected.phaseId
    || value.base_tree !== expected.baseTree || value.candidate_tree !== expected.candidateTree
    || value.snapshot_tree !== expected.candidateTree || !["pass", "revise_required"].includes(value.verdict)) {
    throw new Error("formal phase review identity does not match the Phase evidence");
  }
  if (requirePass && value.verdict !== "pass") throw new Error(`previous Phase review must be PASS (got ${value.verdict})`);
  const attempt = readJson(task, value.attempt_ref, "formal phase review attempt");
  validateSchema("attempt", attempt.value);
  for (const key of ["task_id", "stage", "subject_kind", "phase_id", "base_tree", "candidate_tree", "snapshot_tree", "material_id"]) {
    if (attempt.value[key] !== value[key]) throw new Error(`formal phase review attempt/result ${key} mismatch`);
  }
  return review;
}

function currentPhaseResult(task) {
  try { return readJson(task, "phase-result.json", "current Phase result").value; }
  catch (error) {
    if (/is missing/.test(error.message)) return null;
    throw error;
  }
}

function phaseSubject(task, workspace, phaseResult) {
  const diffRef = phaseResult?.diff_scan?.path ?? phaseResult?.evidence?.diff;
  if (!diffRef) throw new Error("current Phase result has no canonical diff scan");
  const scan = readJson(task, diffRef, "current Phase diff scan").value;
  return {
    scan,
    subject: validatePhaseReviewEvidence({ phaseResult, scan, sourceRoot: workspace.worktreeRoot, phaseId: phaseResult.phase_id }),
  };
}

function deriveBaseline({ task, kernel, workspace, input, current }) {
  if (!current) {
    if (input.previous_phase_review_ref !== undefined) throw new Error("first Phase must not provide previous_phase_review_ref");
    return kernel.readAccepted("build-plan").accepted.checkpoint.commit_oid;
  }
  const previous = phaseSubject(task, workspace, current);
  if (current.phase_id !== input.phase_id) {
    if (input.previous_phase_review_ref !== current.review?.result_ref) throw new Error("next Phase requires the current previous_phase_review_ref");
    readFormalPhaseReview(task, input.previous_phase_review_ref, previous.subject, { requirePass: true });
    return previous.scan.implementation_commit;
  }
  if (input.previous_phase_review_ref === undefined) return previous.scan.baseline_commit;
  if (input.previous_phase_review_ref !== current.review?.result_ref) throw new Error("same-Phase repair review reference mismatch");
  const review = readFormalPhaseReview(task, input.previous_phase_review_ref, previous.subject);
  if (review.value.verdict !== "revise_required") throw new Error("a changed same-Phase identity requires a revise_required review");
  return previous.scan.baseline_commit;
}

function phaseCommit(workspace, tree, baseline, phaseId) {
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: "WorkflowHub", GIT_AUTHOR_EMAIL: "workflowhub@local",
    GIT_COMMITTER_NAME: "WorkflowHub", GIT_COMMITTER_EMAIL: "workflowhub@local",
    GIT_AUTHOR_DATE: "2000-01-01T00:00:00Z", GIT_COMMITTER_DATE: "2000-01-01T00:00:00Z",
  };
  return execFileSync("git", ["commit-tree", tree, "-p", baseline, "-m", `workflowhub phase ${phaseId} snapshot`], {
    cwd: workspace.worktreeRoot, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function assertLiveWorkspaceMatchesImplementation(workspace, implementation, snapshot) {
  if (snapshot.tree === implementation.value.snapshot_tree) return;
  const runtimeOnlyCommit = phaseCommit(workspace, snapshot.tree, implementation.value.snapshot_commit, "runtime-context");
  const runtimeOnly = createPhaseDiffScan({
    sourceRoot: workspace.worktreeRoot,
    phaseId: "runtime-context",
    baselineCommit: implementation.value.snapshot_commit,
    implementationCommit: runtimeOnlyCommit,
    allowedFiles: [],
  });
  if (!runtimeOnly.safe || runtimeOnly.changed_files.length !== 1 || runtimeOnly.changed_files[0] !== "AGENTS.md"
    || runtimeOnly.runtime_controlled_changes.length !== 1 || runtimeOnly.runtime_controlled_changes[0].path !== "AGENTS.md") {
    throw new Error("live Workspace snapshot drifted from the implementation receipt");
  }
}

function publishIdempotently(task, kernel, ref, raw, label) {
  try {
    const existing = task.readRecord(ref);
    if (existing !== raw) throw new Error(`${label} already exists with different content`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    kernel.publishCanonicalRecord(ref, raw);
  }
}

export function validatePhaseEvidenceInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)
    || Object.keys(input).some((key) => !INPUT_KEYS.has(key))) throw new TypeError("phase evidence input contains unknown fields");
  if (!PHASE.test(input.phase_id ?? "")) throw new TypeError("phase_id is invalid");
  if (input.reopen_ref !== undefined && !REOPEN.test(input.reopen_ref)) throw new TypeError("reopen_ref is invalid");
  if (!Array.isArray(input.allowed_files) || !input.allowed_files.every((file) => typeof file === "string" && file.length > 0
    && !file.startsWith("/") && !file.includes("\\") && file.split("/").every((part) => part && part !== "." && part !== ".."))
    || new Set(input.allowed_files).size !== input.allowed_files.length) {
    throw new TypeError("allowed_files must be an array of repository-relative paths");
  }
  return input;
}

export function publishBuildCodePhaseEvidence(context, rawInput) {
  const task = assertTaskHandle(context?.task);
  const kernel = assertTaskKernel(context?.kernel);
  const workspace = assertWorkspace(context?.workspace);
  const input = validatePhaseEvidenceInput(rawInput);
  const implementation = readImplementation(task, input.implementation_receipt_ref);
  const green = readTestReceipt(task, input.green_test_receipt_ref, { green: true });
  const red = input.red_evidence_ref === undefined ? null : readTestReceipt(task, input.red_evidence_ref, { green: false });
  if (green.value.snapshot_tree !== implementation.value.snapshot_tree) throw new Error("GREEN and implementation snapshot trees do not match");
  const implementationCommitTree = execFileSync("git", ["rev-parse", `${implementation.value.snapshot_commit}^{tree}`], {
    cwd: workspace.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  }).trim();
  if (implementationCommitTree !== implementation.value.snapshot_tree) throw new Error("implementation snapshot_commit tree mismatch");
  for (const [label, receipt] of [["GREEN", green], ...(red ? [["RED", red]] : [])]) {
    const receiptTree = execFileSync("git", ["rev-parse", `${receipt.value.snapshot_commit}^{tree}`], {
      cwd: workspace.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    if (receiptTree !== receipt.value.snapshot_tree) throw new Error(`${label} test receipt snapshot_commit tree mismatch`);
  }

  const publishLocked = () => task.withRecordLock("locks/build-code-phase-evidence.lock", () => {
    const reopen = input.reopen_ref === undefined ? null : kernel.buildCodeReopenProvenance(input.reopen_ref);
    const before = captureWorkspaceSnapshot(workspace);
    assertLiveWorkspaceMatchesImplementation(workspace, implementation, before);
    const current = currentPhaseResult(task);
    if (reopen && (!current || current.phase_id !== input.phase_id)) {
      throw new Error("reopen_ref may repair only the current PASS Phase");
    }
    if (current?.reopen_ref !== undefined && input.reopen_ref !== current.reopen_ref) {
      throw new Error("reopened Phase publication requires the same reopen_ref");
    }
    if (current?.phase_id === input.phase_id) {
      const existing = phaseSubject(task, workspace, current);
      const sameIdentity = existing.scan.snapshot_tree === implementation.value.snapshot_tree
        && current.evidence?.implementation_receipt_ref === input.implementation_receipt_ref
        && current.evidence?.green_test_receipt_ref === input.green_test_receipt_ref
        && current.evidence?.red_evidence_ref === input.red_evidence_ref
        && JSON.stringify(existing.scan.allowed_files ?? []) === JSON.stringify([...input.allowed_files].sort());
      if (sameIdentity && reopen && current.reopen_ref === undefined) {
        throw new Error("reopen_ref requires a changed current PASS Phase identity");
      }
      if (sameIdentity && current.review) {
        if (input.review_result_ref !== undefined && input.review_result_ref !== current.review.result_ref) {
          throw new Error("the same Phase identity must reuse its existing formal review");
        }
        return Object.freeze({
          phase_id: input.phase_id, baseline_commit: existing.scan.baseline_commit,
          implementation_commit: existing.scan.implementation_commit, base_tree: existing.subject.baseTree,
          snapshot_tree: existing.scan.snapshot_tree, diff_scan_ref: current.diff_scan.path,
          canonical_phase_evidence_ref: current.evidence.canonical_phase_evidence_ref,
          review_result_ref: current.review.result_ref,
          review_verdict: current.status === "done" ? "pass" : "revise_required",
        });
      }
      if (sameIdentity && input.review_result_ref === undefined) {
        return Object.freeze({
          phase_id: input.phase_id, baseline_commit: existing.scan.baseline_commit,
          implementation_commit: existing.scan.implementation_commit, base_tree: existing.subject.baseTree,
          snapshot_tree: existing.scan.snapshot_tree, diff_scan_ref: current.diff_scan.path,
          canonical_phase_evidence_ref: current.evidence.canonical_phase_evidence_ref,
        });
      }
      if (!sameIdentity && current.status === "done") {
        if (!reopen) {
          throw new Error("a PASS Phase identity is closed and cannot be reopened");
        }
      }
      if (!sameIdentity && current.status === "needs_revision" && input.previous_phase_review_ref === undefined) {
        throw new Error("a changed same-Phase identity requires previous_phase_review_ref");
      }
    }
    const baseline = deriveBaseline({ task, kernel, workspace, input, current });
    const baselineTree = execFileSync("git", ["rev-parse", `${baseline}^{tree}`], { cwd: workspace.worktreeRoot, encoding: "utf8" }).trim();
    if (red && red.value.snapshot_tree !== baselineTree) throw new Error("RED test receipt must bind the Phase baseline tree");
    const implementationCommit = phaseCommit(workspace, implementation.value.snapshot_tree, baseline, input.phase_id);
    const scan = createPhaseDiffScan({
      sourceRoot: workspace.worktreeRoot, phaseId: input.phase_id, baselineCommit: baseline,
      implementationCommit, allowedFiles: input.allowed_files,
    });
    if (!scan.safe) throw new Error(`Phase diff is outside the allowed scope: ${JSON.stringify(scan.allowlist_violations)}`);
    const after = captureWorkspaceSnapshot(workspace);
    if (after.tree !== before.tree) throw new Error("live Workspace changed while Phase evidence was being published");

    const scanRaw = canonical(scan);
    const namespace = `evidence/phases/${input.phase_id}/${scan.snapshot_tree}`;
    const scanRef = `${namespace}/diff-scan-${sha256(scanRaw)}.json`;
    publishIdempotently(task, kernel, scanRef, scanRaw, "Phase diff scan");
    const baseTree = baselineTree;
    const evidence = {
      phase_id: input.phase_id,
      status: "awaiting_review",
      needs_human: false,
      ...(input.reopen_ref === undefined ? {} : { reopen_ref: input.reopen_ref }),
      tests: {
        ...(red ? { red: { path: input.red_evidence_ref } } : {}),
        green: { path: input.green_test_receipt_ref },
      },
      diff_scan: { path: scanRef },
      declared_allowed_files: [...input.allowed_files].sort(),
      evidence: {
        diff: scanRef,
        implementation_receipt_ref: input.implementation_receipt_ref,
        green_test_receipt_ref: input.green_test_receipt_ref,
        ...(red ? { red_evidence_ref: input.red_evidence_ref } : {}),
      },
    };
    const evidenceRaw = canonical(evidence);
    const canonicalEvidenceRef = `${namespace}/phase-evidence-${sha256(evidenceRaw)}.json`;
    publishIdempotently(task, kernel, canonicalEvidenceRef, evidenceRaw, "canonical Phase evidence");
    evidence.evidence.canonical_phase_evidence_ref = canonicalEvidenceRef;

    let review;
    if (input.review_result_ref !== undefined) {
      review = readFormalPhaseReview(task, input.review_result_ref, {
        phaseId: input.phase_id, baseTree, candidateTree: scan.snapshot_tree,
      });
      evidence.review = { result_ref: input.review_result_ref, snapshot_tree: scan.snapshot_tree };
      evidence.status = review.value.verdict === "pass" ? "done" : "needs_revision";
    }
    task.writeRecordAtomic("phase-result.json", canonical(evidence));
    return Object.freeze({
      phase_id: input.phase_id, baseline_commit: baseline, implementation_commit: implementationCommit,
      base_tree: baseTree, snapshot_tree: scan.snapshot_tree, diff_scan_ref: scanRef,
      canonical_phase_evidence_ref: canonicalEvidenceRef,
      ...(input.reopen_ref === undefined ? {} : { reopen_ref: input.reopen_ref }),
      ...(review ? { review_result_ref: input.review_result_ref, review_verdict: review.value.verdict } : {}),
    });
  });
  return input.reopen_ref === undefined
    ? publishLocked()
    : task.withRecordLock("locks/build-code.publication.lock", publishLocked);
}
