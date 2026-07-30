import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { captureWorkspaceSnapshot } from "../../core/canonical-receipt-writer.mjs";
import { assertTaskHandle, assertTaskKernel } from "../../core/task-handle.mjs";
import { assertWorkspace } from "../../core/workspace.mjs";
import { validateSchema } from "../../skills/wh-review/scripts/schema-validator.mjs";
import { validatePhaseAcceptanceTrace, validatePhaseReviewEvidence } from "../../skills/wh-review/scripts/phase-review-subject.mjs";
import { createPhaseDiffScan } from "./diff-scanner.mjs";
import { readRecoveryCredential, readRecoveryGeneration, sha256 as recoverySha256, assertSafeRecoveryRef, recoveryError } from "../../core/task-recovery.mjs";
import { normalizeRuntimeOnlyPaths } from "../../core/canonical-utils.mjs";
import { assertAuthenticatedReviewAttempt, assertAuthenticatedReviewHead } from "../../core/review-flow-authority.mjs";
import { deriveSeriousReviewPause, validateRiskAcceptanceSet } from "../../core/stage-review-disposition.mjs";
import { resolvePhaseTaskIds, validateTasksOnlyCompletionSeam } from "../../core/stage-content-contracts.mjs";
import { readCurrentTaskMaterialRevision } from "../../core/stage-content-evidence.mjs";

const HASH = /^[a-f0-9]{64}$/;
const OID = /^[a-f0-9]{40,64}$/;
const PHASE = /^[A-Za-z0-9._-]+$/;
const REOPEN = /^results\/build-code\/revisions\/reopen-[0-9]{4}\.json$/;
const ADJUDICATION_CORRECTION = /^results\/build-code\/revisions\/adjudication-correction-[A-Za-z0-9][A-Za-z0-9._-]*\.json$/;
const REVIEW_ACTION = /^reviews\/(?:results\/[A-Za-z0-9._-]+|attempts\/[A-Za-z0-9._-]+\/attempt)\.json$/;
const RISK_ACCEPTANCE = /^evidence\/risk-acceptances\/([a-f0-9]{64})\.json$/;
const INPUT_KEYS = new Set([
  "phase_id", "implementation_receipt_ref", "green_test_receipt_ref",
  "red_evidence_ref", "previous_phase_review_ref", "allowed_files", "review_result_ref", "reopen_ref",
  "repair_review_result_ref", "adjudication_correction_ref", "recovery_ref", "recovery_hash",
  "risk_acceptance_refs",
]);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonical = (value) => `${JSON.stringify(value, null, 2)}\n`;

export function requiresSameAdjudicationCorrection(current, input) {
  return current?.phase_id === input.phase_id
    && current?.adjudication_correction_ref !== undefined
    && input.adjudication_correction_ref !== current.adjudication_correction_ref;
}

export function predecessorAdjudicationCorrection(current, nextPhaseId) {
  return current?.phase_id !== nextPhaseId ? current?.adjudication_correction_ref : undefined;
}

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
  safeRef(ref, /^receipts\/[A-Za-z0-9._/-]+\.json$/, "implementation_receipt_ref");
  const receipt = readJson(task, ref, "implementation receipt");
  const value = receipt.value;
  if (value?.schema_version !== "workflowhub-receipt.v1" || value.task_id !== task.identity.taskId
    || value.stage !== "build-code" || value.producer?.stage !== "build-code"
    || value.producer?.component !== "implementation" || !OID.test(value.snapshot_tree ?? "")
    || !OID.test(value.snapshot_commit ?? "")) throw new Error("implementation receipt provenance is invalid");
  return { ...receipt, ref };
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
  return { ...receipt, ref };
}

function authenticateKernelReviewHead(kernel, review, ref, expected, { revisionRef, adjudicationCorrectionRef } = {}) {
  return assertAuthenticatedReviewHead({
    readFlow: (subject) => kernel.readReviewFlow(kernel.deriveReviewFlowIdentity({
      ...subject,
      ...(revisionRef === undefined ? {} : { revision_ref: revisionRef }),
      ...(adjudicationCorrectionRef === undefined ? {} : { adjudication_correction_ref: adjudicationCorrectionRef }),
    })),
    reviewRef: ref,
    reviewHash: review.hash,
    result: review.value,
    expected,
  });
}

function expectedPhaseReviewIdentity(task, value, expected) {
  if (value.task_id !== task.identity.taskId || value.stage !== "build-code"
    || value.subject_kind !== "phase" || value.phase_id !== expected.phaseId
    || value.review_scope !== "phase"
    || value.base_tree !== expected.baseTree || value.candidate_tree !== expected.candidateTree
    || value.snapshot_tree !== expected.candidateTree
    || (expected.phaseEvidence !== undefined &&
        JSON.stringify(value.phase_evidence ?? null) !== JSON.stringify(expected.phaseEvidence))) {
    throw new Error("formal phase review identity does not match the Phase evidence");
  }
}

function phaseReviewSubject(expected) {
  return {
    stage: "build-code", review_track: null, subject_kind: "phase",
    phase_id: expected.phaseId, review_scope: "phase",
  };
}

function reviewFlowReader(kernel, { revisionRef, adjudicationCorrectionRef } = {}) {
  return (subject) => kernel.readReviewFlow(kernel.deriveReviewFlowIdentity({
    ...subject,
    ...(revisionRef === undefined ? {} : { revision_ref: revisionRef }),
    ...(adjudicationCorrectionRef === undefined ? {} : { adjudication_correction_ref: adjudicationCorrectionRef }),
  }));
}

function readFormalPhaseReview(task, kernel, ref, expected, options = {}) {
  safeRef(ref, REVIEW_ACTION, "review action ref");
  const review = readJson(task, ref, "formal phase review action");
  if (ref.startsWith("reviews/attempts/")) {
    validateSchema("attempt", review.value);
    const value = review.value;
    expectedPhaseReviewIdentity(task, value, expected);
    if (value.terminal_status !== "unavailable" || !value.error
      || !Array.isArray(value.provider_attempts) || value.provider_attempts.length === 0) {
      throw new Error("formal phase review attempt is not an unavailable provider attempt");
    }
    const authenticated = assertAuthenticatedReviewAttempt({
      readFlow: reviewFlowReader(kernel, options),
      attemptRef: ref,
      attemptHash: review.hash,
      attempt: value,
      expected: phaseReviewSubject(expected),
    });
    return {
      ...review, ref, status: "unavailable", verdict: null,
      attempt_ref: ref, attempt: review, authenticated,
    };
  }
  validateSchema("result", review.value);
  const value = review.value;
  expectedPhaseReviewIdentity(task, value, expected);
  if (!["pass", "revise_required"].includes(value.verdict)) {
    throw new Error("formal phase review semantic verdict is invalid");
  }
  const authenticated = authenticateKernelReviewHead(kernel, review, ref, phaseReviewSubject(expected), options);
  const attempt = readJson(task, value.attempt_ref, "formal phase review attempt");
  validateSchema("attempt", attempt.value);
  for (const key of ["task_id", "stage", "subject_kind", "phase_id", "review_scope", "base_tree", "candidate_tree", "snapshot_tree", "material_id"]) {
    if (attempt.value[key] !== value[key]) throw new Error(`formal phase review attempt/result ${key} mismatch`);
  }
  if (JSON.stringify(attempt.value.phase_evidence ?? null) !== JSON.stringify(value.phase_evidence ?? null)) {
    throw new Error("formal phase review attempt/result phase_evidence mismatch");
  }
  return {
    ...review, ref, status: "semantic", verdict: value.verdict,
    attempt_ref: value.attempt_ref, attempt, authenticated,
  };
}

function readPreAcceptRepairReview(task, kernel, ref, expectedCandidateTree) {
  safeRef(ref, /^reviews\/results\/[A-Za-z0-9._-]+\.json$/, "repair review result ref");
  const review = readJson(task, ref, "pre-accept repair review result");
  validateSchema("result", review.value);
  const value = review.value;
  if (value.task_id !== task.identity.taskId || value.stage !== "build-code"
    || value.subject_kind !== "worktree" || value.review_scope !== "integration" || value.phase_id !== null
    || value.candidate_tree !== expectedCandidateTree || value.snapshot_tree !== expectedCandidateTree
    || value.verdict !== "revise_required") {
    throw new Error("pre-accept repair review identity does not match the current Phase");
  }
  authenticateKernelReviewHead(kernel, review, ref, {
    stage: "build-code", review_track: null, subject_kind: "worktree",
    phase_id: null, review_scope: "integration",
  });
  const attempt = readJson(task, value.attempt_ref, "pre-accept repair review attempt");
  validateSchema("attempt", attempt.value);
  for (const key of ["task_id", "stage", "subject_kind", "review_scope", "base_tree", "candidate_tree", "snapshot_tree", "material_id"]) {
    if (attempt.value[key] !== value[key]) throw new Error(`pre-accept repair review attempt/result ${key} mismatch`);
  }
  return review;
}

function hasAcceptedBuildCode(task) {
  try {
    task.readRecord("results/build-code/accepted.json");
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function bindPhaseReviewRisks(task, review, refs) {
  const supplied = refs ?? [];
  if (!Array.isArray(supplied) || supplied.some((ref) => typeof ref !== "string")) {
    throw new TypeError("risk_acceptance_refs must be an array of canonical refs");
  }
  if (review.status === "unavailable") {
    if (supplied.length) throw new Error("unavailable Phase review cannot use a risk acceptance");
    return [];
  }
  const preliminary = deriveSeriousReviewPause({
    taskId: task.identity.taskId,
    stage: "build-code",
    reviewRef: review.ref,
    reviewHash: review.hash,
    result: review.value,
  });
  if (preliminary.status !== "paused") {
    if (supplied.length) throw new Error("risk acceptance cannot override a Phase review without actionable serious findings");
    return [];
  }
  if (!supplied.length) throw new Error("SERIOUS_REVIEW_PAUSE: actionable serious Phase findings require repair or exact risk acceptance");
  const records = supplied.map((ref) => {
    const match = RISK_ACCEPTANCE.exec(ref);
    if (!match) throw new Error("Phase risk acceptance ref is outside the canonical namespace");
    const record = readJson(task, ref, "Phase risk acceptance");
    if (record.hash !== match[1]) throw new Error("Phase risk acceptance is not content-addressed");
    return record;
  });
  const workflowRunId = review.authenticated.flow.identity.workflow_run_id;
  const pause = deriveSeriousReviewPause({
    taskId: task.identity.taskId,
    stage: "build-code",
    reviewRef: review.ref,
    reviewHash: review.hash,
    result: review.value,
    workflowRunId,
  });
  validateRiskAcceptanceSet({ acceptances: records.map(({ value }) => value), pause });
  return records.map((record, index) => ({ ref: supplied[index], sha256: record.hash }));
}

function phaseMapTrace({
  scan, scanRef, scanHash, canonicalEvidenceRef, canonicalEvidenceHash,
  implementation, green, red, review, implementationCommitRef, riskAcceptances,
}) {
  const value = review.value;
  const acceptanceTrace = validatePhaseAcceptanceTrace({
    trace: review.attempt.value.phase_ac_trace,
    phaseId: scan.phase_id,
    baseTree: value.base_tree,
    snapshotTree: scan.snapshot_tree,
    changedFiles: scan.changed_files,
    greenTestReceipt: { ref: green.ref, sha256: green.hash },
    required: false,
  });
  return {
    schema_version: "phase-map-trace.v1",
    phase_id: scan.phase_id,
    baseline_commit: scan.baseline_commit,
    implementation_commit: scan.implementation_commit,
    implementation_commit_ref: implementationCommitRef,
    base_tree: value.base_tree,
    snapshot_tree: scan.snapshot_tree,
    allowed_files: [...scan.allowed_files],
    changed_files: [...scan.changed_files],
    canonical_phase_evidence: { ref: canonicalEvidenceRef, sha256: canonicalEvidenceHash },
    diff_scan: { ref: scanRef, sha256: scanHash },
    implementation_receipt: { ref: implementation.ref, sha256: implementation.hash },
    green_test_receipt: { ref: green.ref, sha256: green.hash },
    red_test_receipt: red === null ? null : { ref: red.ref, sha256: red.hash },
    review_status: review.status,
    review_result: review.status === "semantic" ? { ref: review.ref, sha256: review.hash } : null,
    review_attempt: { ref: review.attempt_ref, sha256: review.attempt.hash },
    material_id: value.material_id,
    review_scope: "phase",
    verdict: review.verdict,
    risk_acceptances: riskAcceptances,
    ...(acceptanceTrace === null ? {} : { acceptance_trace: acceptanceTrace }),
  };
}

function currentPhaseResult(task) {
  try { return readJson(task, "phase-result.json", "current Phase result").value; }
  catch (error) {
    if (/is missing/.test(error.message)) return null;
    throw error;
  }
}

function currentPhaseReviewVerdict(task, phaseResult) {
  const ref = phaseResult?.review?.action_ref ?? phaseResult?.review?.result_ref;
  if (ref === undefined) return null;
  const review = readJson(task, ref, "current Phase review action").value;
  if (review?.terminal_status === "unavailable") return "unavailable";
  if (!["pass", "revise_required"].includes(review?.verdict)) {
    throw new Error("current Phase review verdict is invalid");
  }
  return review.verdict;
}

function currentPhaseReviewRef(phaseResult) {
  return phaseResult?.review?.action_ref ?? phaseResult?.review?.result_ref;
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

function tasksOnlyBaseline(task, workspace, previous) {
  const previousCommit = previous.scan.implementation_commit;
  const tasksPath = `specs/${task.identity.taskId}/tasks.md`;
  const before = execFileSync("git", ["show", `${previousCommit}:${tasksPath}`], {
    cwd: workspace.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  });
  const after = readFileSync(resolve(workspace.worktreeRoot, tasksPath), "utf8");
  const phaseTasks = resolvePhaseTaskIds({
    plan: readFileSync(resolve(workspace.worktreeRoot, `specs/${task.identity.taskId}/plan.md`), "utf8"),
    tasks: after,
    phaseId: previous.phaseResult.phase_id,
  });
  const requiredRefs = [
    previous.phaseResult.evidence?.implementation_receipt_ref,
    previous.phaseResult.evidence?.green_test_receipt_ref,
    currentPhaseReviewRef(previous.phaseResult),
  ];
  const requiredBindings = requiredRefs.map((ref) => ({ ref, sha256: sha256(task.readRecord(ref)) }));
  const seam = validateTasksOnlyCompletionSeam({
    before,
    after,
    allowedTaskIds: phaseTasks.task_ids,
    requiredBindings,
    expectedReviewRef: currentPhaseReviewRef(previous.phaseResult),
    completionEvidence: ({ ref }) => {
      try { return task.readRecord(ref); }
      catch (error) {
        if (error?.code === "ENOENT") return undefined;
        throw error;
      }
    },
  });
  if (!seam.ok) throw new Error(`invalid tasks-only completion seam: ${seam.errors.join("; ")}`);
  const index = resolve(tmpdir(), `workflowhub-tasks-seam-${randomUUID()}.index`);
  const env = { ...process.env, GIT_INDEX_FILE: index };
  try {
    execFileSync("git", ["read-tree", `${previousCommit}^{tree}`], { cwd: workspace.worktreeRoot, env, stdio: "ignore" });
    execFileSync("git", ["add", "--", tasksPath], { cwd: workspace.worktreeRoot, env, stdio: "ignore" });
    const tree = execFileSync("git", ["write-tree"], {
      cwd: workspace.worktreeRoot, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    const baseline = execFileSync("git", ["commit-tree", tree, "-p", previousCommit, "-m", "workflowhub tasks completion seam"], {
      cwd: workspace.worktreeRoot,
      env: {
        ...env,
        GIT_AUTHOR_NAME: "WorkflowHub", GIT_AUTHOR_EMAIL: "workflowhub@local",
        GIT_COMMITTER_NAME: "WorkflowHub", GIT_COMMITTER_EMAIL: "workflowhub@local",
        GIT_AUTHOR_DATE: "2000-01-01T00:00:00Z", GIT_COMMITTER_DATE: "2000-01-01T00:00:00Z",
      },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    const captured = execFileSync("git", ["show", `${baseline}:${tasksPath}`], {
      cwd: workspace.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    });
    if (captured !== after) throw new Error("tasks-only completion seam changed while its baseline was captured");
    return baseline;
  } finally {
    rmSync(index, { force: true });
  }
}

function currentMaterialsBaseline(task, kernel, workspace) {
  let acceptedPlan;
  try {
    acceptedPlan = kernel.readAcceptedAudit("build-plan");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const revision = readCurrentTaskMaterialRevision({ task });
  if (acceptedPlan !== undefined && revision === undefined) {
    return kernel.readAccepted("build-plan").accepted.checkpoint.commit_oid;
  }
  const root = workspace.worktreeRoot;
  const base = acceptedPlan?.accepted.checkpoint.commit_oid
    ?? execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  const index = resolve(tmpdir(), `workflowhub-current-materials-${randomUUID()}.index`);
  const env = { ...process.env, GIT_INDEX_FILE: index };
  const taskRoot = `specs/${task.identity.taskId}`;
  const names = ["decision-log.md", "spec.md", "plan.md", "tasks.md"];
  const paths = names.map((name) => `${taskRoot}/${name}`);
  if (revision !== undefined) {
    for (const name of names) {
      if (sha256(readFileSync(resolve(root, taskRoot, name))) !== revision.value.hashes[name]) {
        throw new Error(`current material revision does not bind live ${name}`);
      }
    }
  }
  try {
    execFileSync("git", ["read-tree", `${base}^{tree}`], { cwd: root, env, stdio: "ignore" });
    execFileSync("git", ["add", "--", ...paths], { cwd: root, env, stdio: "ignore" });
    const tree = execFileSync("git", ["write-tree"], {
      cwd: root, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    return execFileSync("git", ["commit-tree", tree, "-p", base, "-m", "workflowhub current task materials baseline"], {
      cwd: root,
      env: {
        ...env,
        GIT_AUTHOR_NAME: "WorkflowHub", GIT_AUTHOR_EMAIL: "workflowhub@local",
        GIT_COMMITTER_NAME: "WorkflowHub", GIT_COMMITTER_EMAIL: "workflowhub@local",
        GIT_AUTHOR_DATE: "2000-01-01T00:00:00Z", GIT_COMMITTER_DATE: "2000-01-01T00:00:00Z",
      },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } finally {
    rmSync(index, { force: true });
  }
}

function deriveBaseline({ task, kernel, workspace, input, current, red }) {
  if (current?.recovery_ref !== undefined && current?.diff_scan === undefined && current?.evidence?.diff === undefined) {
    if (current.recovery_ref !== input.recovery_ref || current.recovery_hash !== input.recovery_hash) {
      throw new Error("recovery bootstrap must use the current recovery binding");
    }
    const generation = readRecoveryGeneration(task, "phase-pointer");
    if (!generation || generation.ref !== current.recovery_ref || recoverySha256(generation.raw) !== current.recovery_hash) {
      throw new Error("recovery bootstrap generation is invalid");
    }
    const credential = readRecoveryCredential(task, generation.value.credential_ref, generation.value.credential_hash, "phase-pointer");
    const subject = credential.value.phase_subject;
    if (subject?.target_phase_id !== input.phase_id) throw new Error("recovery bootstrap Phase does not match the credential");
    return subject.baseline_commit;
  }
  if (!current) {
    if (input.previous_phase_review_ref !== undefined) throw new Error("first Phase must not provide previous_phase_review_ref");
    const baseline = currentMaterialsBaseline(task, kernel, workspace);
    const baselineTree = execFileSync("git", ["rev-parse", `${baseline}^{tree}`], {
      cwd: workspace.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    if (red && red.value.snapshot_tree !== baselineTree) {
      throw new Error("RED test receipt must bind the current task-material baseline tree");
    }
    return baseline;
  }
  const previous = phaseSubject(task, workspace, current);
  if (current.phase_id !== input.phase_id) {
    if (input.repair_review_result_ref !== undefined) throw new Error("pre-accept repair review must target the current Phase");
    if (input.previous_phase_review_ref !== currentPhaseReviewRef(current)) throw new Error("next Phase requires the current previous_phase_review_ref");
    readFormalPhaseReview(task, kernel, input.previous_phase_review_ref, previous.subject, {
      ...(current.reopen_ref === undefined ? {} : { revisionRef: current.reopen_ref }),
      ...(predecessorAdjudicationCorrection(current, input.phase_id) === undefined ? {}
        : { adjudicationCorrectionRef: predecessorAdjudicationCorrection(current, input.phase_id) }),
    });
    return tasksOnlyBaseline(task, workspace, { ...previous, phaseResult: current });
  }
  if (input.repair_review_result_ref !== undefined) {
    if (input.reopen_ref !== undefined) throw new Error("pre-accept repair review cannot be combined with reopen_ref");
    if (current.status !== "done") throw new Error("pre-accept repair review requires the current completed Phase");
    if (hasAcceptedBuildCode(task)) throw new Error("pre-accept repair review is unavailable after build-code acceptance");
    readPreAcceptRepairReview(task, kernel, input.repair_review_result_ref, previous.scan.snapshot_tree);
    return previous.scan.baseline_commit;
  }
  if (input.previous_phase_review_ref === undefined) return previous.scan.baseline_commit;
  if (input.previous_phase_review_ref !== currentPhaseReviewRef(current)) throw new Error("same-Phase repair review reference mismatch");
  const review = readFormalPhaseReview(task, kernel, input.previous_phase_review_ref, previous.subject, {
    ...((input.reopen_ref ?? current.reopen_ref) === undefined ? {} : { revisionRef: input.reopen_ref ?? current.reopen_ref }),
  });
  if (review.verdict !== "revise_required") throw new Error("a changed same-Phase identity requires a revise_required review");
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

function phaseCommitRef(task, phaseId, snapshotTree) {
  return `refs/workflowhub/phases/${task.identity.projectName}/${task.identity.taskId}/build-code/${phaseId}/snapshot-${snapshotTree}`;
}

function readPinnedCommit(workspace, ref) {
  try {
    return execFileSync("git", ["rev-parse", "--verify", `${ref}^{commit}`], {
      cwd: workspace.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    if (error.status === 128) return null;
    throw new Error(`Phase snapshot ref could not be read: ${ref}`);
  }
}

function pinPhaseCommit(workspace, task, phaseId, snapshotTree, implementationCommit) {
  const ref = phaseCommitRef(task, phaseId, snapshotTree);
  const current = readPinnedCommit(workspace, ref);
  if (current !== null && current !== implementationCommit) throw new Error("Phase snapshot ref already points to a different commit");
  if (current === null) {
    try {
      execFileSync("git", ["update-ref", ref, implementationCommit, "0".repeat(40)], {
        cwd: workspace.worktreeRoot, stdio: ["ignore", "pipe", "pipe"],
      });
    } catch {
      const raced = readPinnedCommit(workspace, ref);
      if (raced !== implementationCommit) throw new Error("Phase snapshot ref could not be created immutably");
    }
  }
  const pinned = readPinnedCommit(workspace, ref);
  if (pinned !== implementationCommit) throw new Error("Phase snapshot ref no longer points to the implementation commit");
  const pinnedTree = execFileSync("git", ["rev-parse", `${pinned}^{tree}`], {
    cwd: workspace.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  }).trim();
  if (pinnedTree !== snapshotTree) throw new Error("Phase snapshot ref tree does not match the implementation snapshot");
  return ref;
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

function reviewIdentityKey(identity) {
  return JSON.stringify([
    identity.stage, identity.review_track, identity.subject_kind,
    identity.phase_id, identity.review_scope,
  ]);
}

function withReviewFlowLocks(kernel, identities, operation, index = 0) {
  if (index >= identities.length) return operation();
  return kernel.withReviewFlowLock(identities[index], () => withReviewFlowLocks(kernel, identities, operation, index + 1));
}

export function validatePhaseEvidenceInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)
    || Object.keys(input).some((key) => !INPUT_KEYS.has(key))) throw new TypeError("phase evidence input contains unknown fields");
  if (!PHASE.test(input.phase_id ?? "")) throw new TypeError("phase_id is invalid");
  if (input.reopen_ref !== undefined && !REOPEN.test(input.reopen_ref)) throw new TypeError("reopen_ref is invalid");
  if (input.adjudication_correction_ref !== undefined && !ADJUDICATION_CORRECTION.test(input.adjudication_correction_ref)) throw new TypeError("adjudication_correction_ref is invalid");
  if (input.reopen_ref !== undefined && input.adjudication_correction_ref !== undefined) throw new TypeError("reopen_ref and adjudication_correction_ref are mutually exclusive");
  if ((input.recovery_ref === undefined) !== (input.recovery_hash === undefined)) throw new TypeError("recovery_ref and recovery_hash must be provided together");
  if (input.risk_acceptance_refs !== undefined
    && (!Array.isArray(input.risk_acceptance_refs)
      || input.risk_acceptance_refs.some((ref) => typeof ref !== "string" || !RISK_ACCEPTANCE.test(ref))
      || new Set(input.risk_acceptance_refs).size !== input.risk_acceptance_refs.length)) {
    throw new TypeError("risk_acceptance_refs must contain unique canonical risk acceptance refs");
  }
  if (input.recovery_ref !== undefined) {
    assertSafeRecoveryRef(input.recovery_ref, "recovery_ref");
    if (!/^identity\/recoveries\/phase-pointer-[0-9]{4}\.json$/.test(input.recovery_ref) || !HASH.test(input.recovery_hash ?? "")) throw new TypeError("recovery_ref is invalid");
  }
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
  const allowedFiles = normalizeRuntimeOnlyPaths(input.allowed_files);
  const implementation = readImplementation(task, input.implementation_receipt_ref);
  const green = readTestReceipt(task, input.green_test_receipt_ref, { green: true });
  const red = input.red_evidence_ref === undefined ? null : readTestReceipt(task, input.red_evidence_ref, { green: false });
  if (green.value.snapshot_tree !== implementation.value.snapshot_tree) throw recoveryError("RECOVERY_PHASE_CONTINUATION_MISMATCH", "GREEN and implementation snapshot trees do not match");
  const implementationCommitTree = execFileSync("git", ["rev-parse", `${implementation.value.snapshot_commit}^{tree}`], {
    cwd: workspace.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  }).trim();
  if (implementationCommitTree !== implementation.value.snapshot_tree) throw recoveryError("RECOVERY_PHASE_CONTINUATION_MISMATCH", "implementation snapshot_commit tree mismatch");
  for (const [label, receipt] of [["GREEN", green], ...(red ? [["RED", red]] : [])]) {
    const receiptTree = execFileSync("git", ["rev-parse", `${receipt.value.snapshot_commit}^{tree}`], {
      cwd: workspace.worktreeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    if (receiptTree !== receipt.value.snapshot_tree) throw recoveryError("RECOVERY_PHASE_CONTINUATION_MISMATCH", `${label} test receipt snapshot_commit tree mismatch`);
  }

  const publishLocked = () => task.withRecordLock("locks/build-code-phase-evidence.lock", () => {
    const reopen = input.reopen_ref === undefined ? null : kernel.buildCodeReopenProvenance(input.reopen_ref);
    const adjudicationCorrection = input.adjudication_correction_ref === undefined ? null
      : kernel.readBuildCodeAdjudicationCorrection(input.adjudication_correction_ref, {
        phaseId: input.phase_id,
        snapshotTree: implementation.value.snapshot_tree,
      });
    const before = captureWorkspaceSnapshot(workspace);
    if (input.recovery_ref === undefined) assertLiveWorkspaceMatchesImplementation(workspace, implementation, before);
    const current = currentPhaseResult(task);
    if (current?.recovery_ref !== undefined) {
      if (input.recovery_ref !== current.recovery_ref || input.recovery_hash !== current.recovery_hash) throw new Error("recovered Phase publication requires the current recovery_ref and recovery_hash");
      const generation = readRecoveryGeneration(task, "phase-pointer");
      if (!generation || generation.ref !== input.recovery_ref || recoverySha256(generation.raw) !== input.recovery_hash) throw new Error("recovered Phase publication recovery generation is invalid");
    } else if (input.recovery_ref !== undefined) {
      throw new Error("recovery_ref does not match the current Phase pointer");
    }
    const repairReviewRef = input.repair_review_result_ref ?? (current?.phase_id === input.phase_id ? current.repair_review_result_ref : undefined);
    if (input.repair_review_result_ref !== undefined && input.reopen_ref !== undefined) {
      throw new Error("pre-accept repair review cannot be combined with reopen_ref");
    }
    if (input.repair_review_result_ref !== undefined && (!current || current.phase_id !== input.phase_id || current.status !== "done")) {
      throw new Error("pre-accept repair review requires the current completed Phase");
    }
    if (input.repair_review_result_ref !== undefined && hasAcceptedBuildCode(task)) {
      throw new Error("pre-accept repair review is unavailable after build-code acceptance");
    }
    if (input.repair_review_result_ref !== undefined) {
      const currentSubject = phaseSubject(task, workspace, current);
      readPreAcceptRepairReview(task, kernel, input.repair_review_result_ref, currentSubject.scan.snapshot_tree);
    }
    if (reopen && (!current || current.phase_id !== input.phase_id)) {
      throw new Error("reopen_ref may repair only the current completed Phase");
    }
    if (current?.reopen_ref !== undefined && input.reopen_ref !== current.reopen_ref) {
      throw new Error("reopened Phase publication requires the same reopen_ref");
    }
    if (requiresSameAdjudicationCorrection(current, input)) {
      throw new Error("corrected Phase publication requires the same adjudication_correction_ref");
    }
    const recoveryBootstrap = current?.recovery_ref !== undefined && current?.diff_scan === undefined && current?.evidence?.diff === undefined;
    if (current?.phase_id === input.phase_id && !recoveryBootstrap) {
      const existing = phaseSubject(task, workspace, current);
      const currentReviewVerdict = currentPhaseReviewVerdict(task, current);
      const sameIdentity = existing.scan.snapshot_tree === implementation.value.snapshot_tree
        && current.evidence?.implementation_receipt_ref === input.implementation_receipt_ref
        && current.evidence?.green_test_receipt_ref === input.green_test_receipt_ref
        && current.evidence?.red_evidence_ref === input.red_evidence_ref
        && JSON.stringify(normalizeRuntimeOnlyPaths(existing.scan.allowed_files ?? [])) === JSON.stringify(allowedFiles);
      if (sameIdentity && reopen && current.reopen_ref === undefined) {
        throw new Error("reopen_ref requires a changed current completed Phase identity");
      }
      if (sameIdentity && current.review) {
        if (input.review_result_ref !== undefined && input.review_result_ref !== currentPhaseReviewRef(current)) {
          throw new Error("the same Phase identity must reuse its existing formal review");
        }
        return Object.freeze({
          phase_id: input.phase_id, baseline_commit: existing.scan.baseline_commit,
          implementation_commit: existing.scan.implementation_commit, base_tree: existing.subject.baseTree,
          snapshot_tree: existing.scan.snapshot_tree, diff_scan_ref: current.diff_scan.path,
          canonical_phase_evidence_ref: current.evidence.canonical_phase_evidence_ref,
          review_result_ref: currentPhaseReviewRef(current),
          review_verdict: currentReviewVerdict,
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
      if (!sameIdentity && current.status === "done" && currentReviewVerdict !== "revise_required") {
        if (!reopen && repairReviewRef === undefined) {
          throw new Error("a completed Phase identity is closed and cannot be reopened");
        }
      }
      if (!sameIdentity && currentReviewVerdict === "revise_required" && input.previous_phase_review_ref === undefined) {
        throw new Error("a changed same-Phase identity requires previous_phase_review_ref");
      }
    }
    const baseline = deriveBaseline({ task, kernel, workspace, input, current, red });
    const baselineTree = execFileSync("git", ["rev-parse", `${baseline}^{tree}`], { cwd: workspace.worktreeRoot, encoding: "utf8" }).trim();
    if (red && red.value.snapshot_tree !== baselineTree) throw new Error("RED test receipt must bind the Phase baseline tree");
    const implementationCommit = phaseCommit(workspace, implementation.value.snapshot_tree, baseline, input.phase_id);
    const implementationCommitRef = pinPhaseCommit(workspace, task, input.phase_id, implementation.value.snapshot_tree, implementationCommit);
    const scan = createPhaseDiffScan({
      sourceRoot: workspace.worktreeRoot, phaseId: input.phase_id, baselineCommit: baseline,
      implementationCommit, allowedFiles,
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
      ...(input.recovery_ref === undefined ? {} : { recovery_ref: input.recovery_ref, recovery_hash: input.recovery_hash }),
      ...(input.reopen_ref === undefined ? {} : { reopen_ref: input.reopen_ref }),
      ...(adjudicationCorrection === null ? {} : { adjudication_correction_ref: adjudicationCorrection.ref }),
      ...(repairReviewRef === undefined ? {} : { repair_review_result_ref: repairReviewRef }),
      tests: {
        ...(red ? { red: { path: input.red_evidence_ref } } : {}),
        green: { path: input.green_test_receipt_ref },
      },
      diff_scan: { path: scanRef },
      declared_allowed_files: allowedFiles,
      evidence: {
        diff: scanRef,
        implementation_receipt_ref: input.implementation_receipt_ref,
        green_test_receipt_ref: input.green_test_receipt_ref,
        ...(red ? { red_evidence_ref: input.red_evidence_ref } : {}),
      },
    };
    const evidenceRaw = canonical(evidence);
    const canonicalEvidenceHash = sha256(evidenceRaw);
    const canonicalEvidenceRef = `${namespace}/phase-evidence-${canonicalEvidenceHash}.json`;
    publishIdempotently(task, kernel, canonicalEvidenceRef, evidenceRaw, "canonical Phase evidence");
    evidence.evidence.canonical_phase_evidence_ref = canonicalEvidenceRef;

    let review;
    if (input.review_result_ref !== undefined) {
      review = readFormalPhaseReview(task, kernel, input.review_result_ref, {
        phaseId: input.phase_id, baseTree, candidateTree: scan.snapshot_tree,
        ...(input.recovery_ref === undefined ? {} : {
          phaseEvidence: {
            ref: canonicalEvidenceRef,
            sha256: canonicalEvidenceHash,
            recovery_ref: input.recovery_ref,
            recovery_hash: input.recovery_hash,
          },
        }),
      }, {
        ...(input.reopen_ref === undefined ? {} : { revisionRef: input.reopen_ref }),
        ...(input.adjudication_correction_ref === undefined ? {} : { adjudicationCorrectionRef: input.adjudication_correction_ref }),
      });
      const riskAcceptances = bindPhaseReviewRisks(task, review, input.risk_acceptance_refs);
      const trace = phaseMapTrace({
        scan, scanRef, scanHash: sha256(scanRaw), canonicalEvidenceRef, canonicalEvidenceHash,
        implementation, green, red, review, implementationCommitRef, riskAcceptances,
      });
      const traceRaw = canonical(trace);
      const traceHash = sha256(traceRaw);
      const traceRef = `${namespace}/phase-map-trace-${traceHash}.json`;
      publishIdempotently(task, kernel, traceRef, traceRaw, "Phase map trace");
      evidence.evidence.phase_map_trace_ref = traceRef;
      evidence.evidence.phase_map_trace_hash = traceHash;
      evidence.review = {
        action_ref: input.review_result_ref,
        ...(review.status === "semantic" ? { result_ref: input.review_result_ref } : {}),
        snapshot_tree: scan.snapshot_tree,
        status: review.status,
        verdict: review.verdict,
        risk_acceptances: riskAcceptances,
      };
      evidence.status = "done";
    }
    task.writeRecordAtomic("phase-result.json", canonical(evidence));
    return Object.freeze({
      phase_id: input.phase_id, baseline_commit: baseline, implementation_commit: implementationCommit,
      base_tree: baseTree, snapshot_tree: scan.snapshot_tree, diff_scan_ref: scanRef,
      canonical_phase_evidence_ref: canonicalEvidenceRef,
      ...(input.reopen_ref === undefined ? {} : { reopen_ref: input.reopen_ref }),
      ...(input.adjudication_correction_ref === undefined ? {} : { adjudication_correction_ref: input.adjudication_correction_ref }),
      ...(repairReviewRef === undefined ? {} : { repair_review_result_ref: repairReviewRef }),
      ...(review ? {
        review_result_ref: input.review_result_ref, review_status: review.status, review_verdict: review.verdict,
        phase_map_trace_ref: evidence.evidence.phase_map_trace_ref, phase_map_trace_hash: evidence.evidence.phase_map_trace_hash,
      } : {}),
    });
  });
  const flowIdentities = [kernel.deriveReviewFlowIdentity({
    stage: "build-code", review_track: null, subject_kind: "phase",
    phase_id: input.phase_id, review_scope: "phase",
    ...(input.reopen_ref === undefined ? {} : { revision_ref: input.reopen_ref }),
    ...(input.adjudication_correction_ref === undefined ? {} : { adjudication_correction_ref: input.adjudication_correction_ref }),
  })];
  if (input.previous_phase_review_ref !== undefined) {
    const previous = readJson(task, input.previous_phase_review_ref, "previous Phase review result").value;
    flowIdentities.push(kernel.deriveReviewFlowIdentity({
      stage: "build-code", review_track: null, subject_kind: "phase",
      phase_id: previous.phase_id, review_scope: "phase",
      ...(input.reopen_ref === undefined ? {} : { revision_ref: input.reopen_ref }),
    }));
  }
  if (input.repair_review_result_ref !== undefined) {
    flowIdentities.push(kernel.deriveReviewFlowIdentity({
      stage: "build-code", review_track: null, subject_kind: "worktree",
      phase_id: null, review_scope: "integration",
    }));
  }
  const uniqueFlowIdentities = [...new Map(flowIdentities.map((identity) => [reviewIdentityKey(identity), identity])).values()]
    .sort((left, right) => reviewIdentityKey(left).localeCompare(reviewIdentityKey(right)));
  const runLocked = () => input.reopen_ref === undefined
    ? publishLocked()
    : task.withRecordLock("locks/build-code.publication.lock", publishLocked);
  return withReviewFlowLocks(kernel, uniqueFlowIdentities, runLocked);
}
