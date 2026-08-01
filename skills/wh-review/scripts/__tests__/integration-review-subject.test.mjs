import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, realpathSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ArtifactDir } from "../../../../core/artifact-dir.mjs";
import { createTask } from "../../../../core/task-handle.mjs";

import {
  assertNoUntracedFormalPhase,
  isVerifiedDescendantContinuation,
  isInitialTasksCompletionSeam,
  prevalidatePhaseReviewCorrections,
  selectCanonicalPhaseTraces,
  verifiedHistoricalLineage,
  verifiedPhaseReviewCorrections,
} from "../integration-review-subject.mjs";

const OID = "a".repeat(40);
const TREE = "b".repeat(40);
const HASH = "c".repeat(64);
const REVIEW_REF = "reviews/results/historical-pass.json";
const ATTEMPT_REF = "reviews/attempts/historical-pass/attempt.json";
const TRACE_REF = `evidence/phases/phase-history/${TREE}/phase-map-trace-${HASH}.json`;
const LINEAGE_REF = `identity/phase-trace-lineage/phase-history-${TREE}-${HASH}.json`;
const SUPERSESSION_REF = (hash) => `identity/phase-trace-lineage-supersessions/phase-history-${TREE}-${hash}.json`;
const OLD_TREE = "d".repeat(40);
const NEW_TREE = "e".repeat(40);
const OLD_REVIEW_REF = "reviews/results/phase-history-old.json";
const NEW_REVIEW_REF = "reviews/results/phase-history-repaired.json";
const REPLACEMENT_TRACE_REF = `evidence/phases/phase-history/${NEW_TREE}/phase-map-trace-${HASH}.json`;

function sha(raw) { return createHash("sha256").update(raw).digest("hex"); }
function binding(ref, value = HASH) { return { ref, sha256: value }; }

function git(root, ...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function descendantFixture({ nonMaterialBaseline = false } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-descendant-continuation-")));
  git(root, "init", "-q");
  git(root, "config", "user.name", "fixture");
  git(root, "config", "user.email", "fixture@example.test");
  const taskId = "descendant-task";
  const materialDirectory = ["spec", "s"].join("");
  const materialRoot = [materialDirectory, taskId].join("/");
  const task = createTask({
    ["storage" + "Root"]: root,
    manifest: {
      schema_version: "1.0.0", project_name: "fixture", task_id: taskId,
      created_at: new Date().toISOString(), target_repo_root: root, issue_ids: [], inputs: {},
    },
  });
  const artifacts = ArtifactDir.open(root, task);
  artifacts.writeAtomic("decision-log.md", "# decision\n");
  artifacts.writeAtomic("spec.md", "# spec\n");
  artifacts.writeAtomic("plan.md", "# plan\n");
  artifacts.writeAtomic("tasks.md", "# tasks\n");
  artifacts.writeAtomic("implementation.txt", "previous\n");
  git(root, "add", materialDirectory);
  git(root, "commit", "-qm", "previous implementation");
  const previousCommit = git(root, "rev-parse", "HEAD");
  const previousTree = git(root, "rev-parse", "HEAD^{tree}");

  if (nonMaterialBaseline) artifacts.writeAtomic("forged-code.txt", "must reject\n");
  artifacts.writeAtomic("tasks.md", "# tasks revised\n");
  git(root, "add", materialDirectory);
  git(root, "commit", "-qm", "material revision");
  const baselineCommit = git(root, "rev-parse", "HEAD");
  const baseTree = git(root, "rev-parse", "HEAD^{tree}");

  artifacts.writeAtomic("implementation.txt", "successor implementation\n");
  git(root, "add", materialDirectory);
  git(root, "commit", "-qm", "successor implementation");
  const implementationCommit = git(root, "rev-parse", "HEAD");
  const snapshotTree = git(root, "rev-parse", "HEAD^{tree}");
  const implementationRef = "receipts/revisions/implementation/descendant.json";
  const greenRef = "receipts/build-tests-descendant.json";
  const implementationHash = "1".repeat(64);
  const greenHash = "2".repeat(64);
  const allowedFiles = [`${materialRoot}/implementation.txt`];
  const candidate = {
    trace: {
      phase_id: "phase-9", baseline_commit: baselineCommit, implementation_commit: implementationCommit,
      base_tree: baseTree, snapshot_tree: snapshotTree, material_id: "3".repeat(64),
      review_status: "semantic", verdict: "pass",
      implementation_receipt: binding(implementationRef, implementationHash),
      green_test_receipt: binding(greenRef, greenHash), allowed_files: allowedFiles, changed_files: allowedFiles,
    },
    review: { value: { verdict: "pass" } },
    implementation: {
      ref: implementationRef, hash: implementationHash,
      value: { task_id: "descendant-task", snapshot_tree: snapshotTree, snapshot_commit: implementationCommit, changed: allowedFiles },
    },
    green: {
      ref: greenRef, hash: greenHash,
      value: { task_id: "descendant-task", snapshot_tree: snapshotTree, snapshot_commit: implementationCommit },
    },
    scan: {
      value: {
        baseline_commit: baselineCommit, implementation_commit: implementationCommit, snapshot_tree: snapshotTree,
        allowed_files: allowedFiles, changed_files: allowedFiles, safe: true, violations: [], allowlist_violations: [],
      },
    },
  };
  const previous = { trace: { phase_id: "phase-8", implementation_commit: previousCommit, snapshot_tree: previousTree } };
  return { root, task, previousTrace: previous, candidateTrace: candidate };
}

function cleanup(root) {
  return rm(root, { recursive: true, force: true });
}

function markUnavailable(traceRecord, { mismatch = null } = {}) {
  const trace = traceRecord.trace;
  const attemptRef = `reviews/attempts/${trace.phase_id}-unavailable/attempt.json`;
  const attemptHash = "4".repeat(64);
  trace.baseline_commit ??= trace.implementation_commit;
  trace.base_tree ??= trace.snapshot_tree;
  trace.material_id ??= "5".repeat(64);
  trace.review_status = "unavailable";
  trace.review_result = null;
  trace.verdict = null;
  trace.review_attempt = binding(attemptRef, attemptHash);
  traceRecord.review = null;
  traceRecord.attempt = {
    ref: attemptRef,
    sha256: attemptHash,
    value: {
      version: "wh-review-attempt.v1",
      attempt_id: `${trace.phase_id}-unavailable`,
      task_id: "descendant-task",
      stage: "build-code",
      review_track: null,
      subject_kind: "phase",
      phase_id: trace.phase_id,
      review_scope: "phase",
      base_tree: trace.base_tree,
      candidate_tree: trace.snapshot_tree,
      snapshot_tree: trace.snapshot_tree,
      material_id: trace.material_id,
      provider_attempts: [{
        provider: "fixture", status: "failed", session_id: null, runtime_id: null,
        output_ref: null, error: { code: "PROVIDER_UNAVAILABLE", message: "fixture provider unavailable" },
      }],
      terminal_status: "unavailable",
      error: { code: "PROVIDER_UNAVAILABLE", message: "fixture provider unavailable" },
    },
  };
  if (mismatch === "material_id") traceRecord.attempt.value.material_id = "f".repeat(64);
  if (mismatch === "attempt_ref") traceRecord.attempt.ref = "reviews/attempts/other/attempt.json";
  return traceRecord;
}

function reviewResult(verdict = "pass") {
  const providerFinding = {
    severity: "major", path: "src/history.mjs", issue: "historical defect",
    recommendation: "repair the sibling snapshot",
  };
  const resultFinding = {
    provider: "fixture", severity: "major", path: "src/history.mjs",
    issue: "historical defect", recommendation: "repair the sibling snapshot",
  };
  return {
    version: "wh-review-result.v1", task_id: "selector-lineage", stage: "build-code", review_track: null,
    subject_kind: "phase", phase_id: "phase-history", review_scope: "phase", base_tree: OID, candidate_tree: TREE,
    source: { target_commit: OID, base_commit: OID, base_tree: OID, captured_head: OID }, snapshot_tree: TREE,
    material_id: HASH, attempt_ref: ATTEMPT_REF,
    provider_results: [{
      provider: "fixture",
      output: { verdict, summary: `historical ${verdict}`, findings: verdict === "pass" ? [] : [providerFinding] },
    }],
    verdict, findings: verdict === "pass" ? [] : [resultFinding],
  };
}

function fixture(mode = "valid") {
  const verdict = mode === "revise" ? "revise_required" : "pass";
  const reviewRaw = `${JSON.stringify(reviewResult(verdict))}\n`;
  const reviewHash = sha(reviewRaw);
  const trace = {
    traceRef: TRACE_REF, traceSha256: HASH,
    review: { ref: REVIEW_REF, hash: reviewHash, value: reviewResult(verdict) },
    trace: {
      phase_id: "phase-history", snapshot_tree: TREE, material_id: HASH, verdict,
      canonical_phase_evidence: binding("evidence/phases/phase-history/evidence.json"),
      diff_scan: binding("evidence/phases/phase-history/diff.json"),
      implementation_receipt: binding("receipts/revisions/implementation/history.json"),
      green_test_receipt: binding("receipts/build-tests-history.json"), red_test_receipt: null,
      review_result: binding(REVIEW_REF, reviewHash), review_attempt: binding(ATTEMPT_REF),
    },
  };
  const lineage = {
    schema_version: "phase-trace-lineage-generation.v1", project_name: "workflowhub", task_id: "selector-lineage",
    stage: "build-code", phase_id: "phase-history", snapshot_tree: TREE, trace: binding(TRACE_REF),
    phase_evidence: trace.trace.canonical_phase_evidence, diff_scan: trace.trace.diff_scan,
    implementation_receipt: trace.trace.implementation_receipt, green_test_receipt: trace.trace.green_test_receipt,
    red_test_receipt: null, review_result: trace.trace.review_result, review_attempt: trace.trace.review_attempt,
    material_id: HASH, created_at: "2026-07-25T00:00:00.000Z", result: "bound",
  };
  if (mode === "tampered") lineage.trace = binding(TRACE_REF, "d".repeat(64));
  if (mode === "misbound") lineage.review_result = binding("reviews/results/other.json");
  if (mode === "nonpass") lineage.result = "rejected";
  const lineageRef = mode === "tampered"
    ? `identity/phase-trace-lineage/phase-history-${TREE}-${lineage.trace.sha256}.json`
    : LINEAGE_REF;
  const records = new Map([[REVIEW_REF, reviewRaw], [lineageRef, `${JSON.stringify(lineage)}\n`]]);
  const supersessions = [];
  if (mode === "superseded" || mode === "supersession-tampered") {
    const legacy = {
      ...lineage,
      phase_evidence: { ref: lineage.phase_evidence.ref }, diff_scan: { ref: lineage.diff_scan.ref },
      implementation_receipt: { ref: lineage.implementation_receipt.ref }, green_test_receipt: { ref: lineage.green_test_receipt.ref },
      review_result: { ref: lineage.review_result.ref }, review_attempt: { ref: lineage.review_attempt.ref },
    };
    const legacyRaw = `${JSON.stringify(legacy)}\n`; const legacyHash = sha(legacyRaw);
    records.set(LINEAGE_REF, legacyRaw);
    const supersession = {
      ...lineage, schema_version: "phase-trace-lineage-supersession.v1", supersedes: binding(LINEAGE_REF, legacyHash), result: "superseded",
    };
    if (mode === "supersession-tampered") supersession.green_test_receipt = binding("receipts/other.json");
    const ref = SUPERSESSION_REF(legacyHash);
    records.set(ref, `${JSON.stringify(supersession)}\n`); supersessions.push(ref);
  }
  const task = {
    identity: { projectName: "workflowhub", taskId: "selector-lineage" },
    listCanonicalPhaseTraceLineageRefs: () => [lineageRef],
    listCanonicalPhaseTraceLineageSupersessionRefs: () => supersessions,
    listCanonicalReviewResultRefs: () => [REVIEW_REF],
    readRecord: (ref) => {
      if (!records.has(ref)) throw new Error("missing");
      return records.get(ref);
    },
  };
  return { task, trace, reviewHash };
}

function correctionFixture(overrides = {}) {
  const oldValue = {
    ...reviewResult("revise_required"),
    candidate_tree: OLD_TREE,
    snapshot_tree: OLD_TREE,
    source: { ...reviewResult().source, captured_head: OLD_TREE },
  };
  const newValue = {
    ...reviewResult("pass"),
    candidate_tree: NEW_TREE,
    snapshot_tree: NEW_TREE,
    source: { ...reviewResult().source, captured_head: NEW_TREE },
  };
  Object.assign(oldValue, overrides.oldReview);
  Object.assign(newValue, overrides.newReview);
  const oldRaw = `${JSON.stringify(oldValue)}\n`;
  const newRaw = `${JSON.stringify(newValue)}\n`;
  const oldHash = sha(oldRaw);
  const newHash = sha(newRaw);
  const replacementTrace = {
    traceRef: REPLACEMENT_TRACE_REF,
    traceSha256: HASH,
    review: { ref: NEW_REVIEW_REF, sha256: newHash, value: newValue },
    trace: {
      phase_id: "phase-history",
      base_tree: OID,
      snapshot_tree: NEW_TREE,
      verdict: "pass",
    },
  };
  Object.assign(replacementTrace.trace, overrides.replacementTrace);
  const correction = {
    schema_version: "phase-review-correction.v1",
    project_name: "workflowhub",
    task_id: "selector-lineage",
    stage: "build-code",
    phase_id: "phase-history",
    base_tree: OID,
    supersedes: binding(OLD_REVIEW_REF, oldHash),
    replacement: {
      ref: NEW_REVIEW_REF,
      sha256: newHash,
      snapshot_tree: NEW_TREE,
      trace: binding(REPLACEMENT_TRACE_REF),
    },
    reason_code: "historical_phase_repaired",
    created_at: "2026-07-25T00:00:00.000Z",
    result: "superseded",
    ...overrides.correction,
  };
  const correctionRaw = `${JSON.stringify(correction)}\n`;
  const correctionHash = sha(correctionRaw);
  const correctionRef = overrides.correctionRef
    ?? `identity/phase-review-corrections/phase-phase-history-${OLD_TREE}-${NEW_TREE}-${correctionHash}.json`;
  const records = new Map([
    [OLD_REVIEW_REF, oldRaw],
    [NEW_REVIEW_REF, newRaw],
    [correctionRef, correctionRaw],
  ]);
  const correctionRefs = [correctionRef];
  if (overrides.duplicate) {
    const duplicate = { ...correction, created_at: "2026-07-25T00:00:01.000Z" };
    const duplicateRaw = `${JSON.stringify(duplicate)}\n`;
    const duplicateHash = sha(duplicateRaw);
    const duplicateRef = `identity/phase-review-corrections/phase-phase-history-${OLD_TREE}-${NEW_TREE}-${duplicateHash}.json`;
    records.set(duplicateRef, duplicateRaw);
    correctionRefs.push(duplicateRef);
  }
  const task = {
    identity: { projectName: "workflowhub", taskId: "selector-lineage" },
    listCanonicalPhaseReviewCorrectionRefs: () => correctionRefs,
    listCanonicalReviewResultRefs: () => [OLD_REVIEW_REF],
    readRecord: (ref) => {
      if (!records.has(ref)) throw new Error("missing");
      return records.get(ref);
    },
  };
  return {
    task,
    replacementTrace,
    oldHash,
    newHash,
    coverage: [{
      review_result: binding(NEW_REVIEW_REF, newHash),
      base_tree: OID,
      snapshot_tree: NEW_TREE,
    }],
  };
}

describe("integration selector historical lineage", () => {
  it("releases a historical semantic review that is bound to its exact canonical trace", () => {
    const f = fixture();
    const bindings = verifiedHistoricalLineage({ task: f.task, sourceRoot: "fixture", readTrace: () => f.trace });
    expect(bindings).toEqual(new Map([[REVIEW_REF, f.reviewHash]]));
    expect(() => assertNoUntracedFormalPhase({
      task: f.task,
      coverage: [{ review_result: binding("reviews/results/current-path.json"), base_tree: OID, snapshot_tree: TREE }],
      lineageReviews: bindings,
    })).not.toThrow();
  });

  it("keeps revise_required as the bound historical quality verdict", () => {
    const f = fixture("revise");
    expect(verifiedHistoricalLineage({ task: f.task, sourceRoot: "fixture", readTrace: () => f.trace }))
      .toEqual(new Map([[REVIEW_REF, f.reviewHash]]));
  });

  for (const mode of ["tampered", "misbound", "nonpass"]) {
    it(`fails closed for ${mode} lineage`, () => {
      const f = fixture(mode);
      expect(() => verifiedHistoricalLineage({ task: f.task, sourceRoot: "fixture", readTrace: () => f.trace }))
        .toThrow(/MATERIAL_INCOMPLETE/);
    });
  }

  it("releases only the narrowly verified missing-hash lineage through an append-only supersession", () => {
    const f = fixture("superseded");
    expect(verifiedHistoricalLineage({ task: f.task, sourceRoot: "fixture", readTrace: () => f.trace }))
      .toEqual(new Map([[REVIEW_REF, f.reviewHash]]));
  });

  it("fails closed for a tampered lineage supersession", () => {
    const f = fixture("supersession-tampered");
    expect(() => verifiedHistoricalLineage({ task: f.task, sourceRoot: "fixture", readTrace: () => f.trace }))
      .toThrow(/MATERIAL_INCOMPLETE/);
  });

  it("does not release an unbound historical semantic review", () => {
    const f = fixture();
    f.task.listCanonicalPhaseTraceLineageRefs = () => [];
    const bindings = verifiedHistoricalLineage({ task: f.task, sourceRoot: "fixture", readTrace: () => f.trace });
    expect(() => assertNoUntracedFormalPhase({
      task: f.task,
      coverage: [{ review_result: binding("reviews/results/current-path.json"), base_tree: OID, snapshot_tree: TREE }],
      lineageReviews: bindings,
    })).toThrow(/formal Phase review has no phase-map trace/);
  });
});

describe("integration selector legacy Phase review corrections", () => {
  it("releases only an exact prevalidated correction on the selected replacement path", () => {
    const f = correctionFixture();
    const prevalidated = prevalidatePhaseReviewCorrections({
      task: f.task, sourceRoot: "fixture", readTrace: () => f.replacementTrace,
    });
    const corrections = verifiedPhaseReviewCorrections({
      task: f.task, sourceRoot: "fixture", coverage: f.coverage, prevalidated,
    });
    expect(corrections).toEqual(new Map([[OLD_REVIEW_REF, f.oldHash]]));
    expect(() => assertNoUntracedFormalPhase({
      task: f.task,
      coverage: f.coverage,
      lineageReviews: new Map(),
      correctionReviews: corrections,
    })).not.toThrow();
  });

  it("preserves behavior when the task has no correction reader", () => {
    const f = correctionFixture();
    delete f.task.listCanonicalPhaseReviewCorrectionRefs;
    expect(prevalidatePhaseReviewCorrections({
      task: f.task, sourceRoot: "fixture", readTrace: () => f.replacementTrace,
    })).toEqual(new Map());
  });

  it("fails closed for a filename content hash mismatch", () => {
    const f = correctionFixture({
      correctionRef: `identity/phase-review-corrections/phase-phase-history-${OLD_TREE}-${NEW_TREE}-${"f".repeat(64)}.json`,
    });
    expect(() => prevalidatePhaseReviewCorrections({
      task: f.task, sourceRoot: "fixture", readTrace: () => f.replacementTrace,
    })).toThrow(/correction ref is invalid/);
  });

  for (const [label, overrides] of [
    ["wrong task", { oldReview: { task_id: "other-task" } }],
    ["wrong phase", { newReview: { phase_id: "other-phase" } }],
    ["wrong base", { oldReview: { base_tree: "f".repeat(40) } }],
    ["wrong old verdict", { oldReview: { verdict: "pass" } }],
    ["wrong replacement verdict", { newReview: { verdict: "revise_required" } }],
  ]) {
    it(`fails closed for ${label}`, () => {
      const f = correctionFixture(overrides);
      expect(() => prevalidatePhaseReviewCorrections({
        task: f.task, sourceRoot: "fixture", readTrace: () => f.replacementTrace,
      })).toThrow(/MATERIAL_INCOMPLETE/);
    });
  }

  it("fails closed for duplicate superseded reviews", () => {
    const f = correctionFixture({ duplicate: true });
    expect(() => prevalidatePhaseReviewCorrections({
      task: f.task, sourceRoot: "fixture", readTrace: () => f.replacementTrace,
    })).toThrow(/duplicates a historical review/);
  });

  it("fails closed when the replacement review is not on the selected path", () => {
    const f = correctionFixture();
    const prevalidated = prevalidatePhaseReviewCorrections({
      task: f.task, sourceRoot: "fixture", readTrace: () => f.replacementTrace,
    });
    expect(() => verifiedPhaseReviewCorrections({
      task: f.task,
      sourceRoot: "fixture",
      coverage: [{ review_result: binding("reviews/results/other.json"), base_tree: OID, snapshot_tree: NEW_TREE }],
      prevalidated,
    })).toThrow(/replacement is not in path/);
  });

  it("fails closed when the superseded snapshot remains on the selected path", () => {
    const f = correctionFixture();
    const prevalidated = prevalidatePhaseReviewCorrections({
      task: f.task, sourceRoot: "fixture", readTrace: () => f.replacementTrace,
    });
    expect(() => verifiedPhaseReviewCorrections({
      task: f.task,
      sourceRoot: "fixture",
      coverage: [...f.coverage, { review_result: null, base_tree: OLD_TREE, snapshot_tree: "f".repeat(40) }],
      prevalidated,
    })).toThrow(/superseded snapshot is in path/);
  });

  it("does not release the same review ref when its trace binding has the wrong hash", () => {
    const f = correctionFixture();
    const prevalidated = prevalidatePhaseReviewCorrections({
      task: f.task, sourceRoot: "fixture", readTrace: () => f.replacementTrace,
    });
    expect(prevalidated.get(OLD_REVIEW_REF)?.sha256).toBe(f.oldHash);
    expect(prevalidated.get(OLD_REVIEW_REF)?.sha256).not.toBe("f".repeat(64));
    expect(() => assertNoUntracedFormalPhase({
      task: {
        ...f.task,
        readRecord: (ref) => {
          if (ref === OLD_REVIEW_REF) {
            const changed = `${JSON.stringify({ ...reviewResult("revise_required"), candidate_tree: OLD_TREE, snapshot_tree: OLD_TREE })}\n`;
            return changed;
          }
          return f.task.readRecord(ref);
        },
      },
      coverage: [{ review_result: null, base_tree: OID, snapshot_tree: OLD_TREE }],
      lineageReviews: new Map(),
      correctionReviews: new Map([[OLD_REVIEW_REF, f.oldHash]]),
    })).toThrow(/formal Phase review has no phase-map trace/);
  });

  it("does not skip an invalid trace when only the superseded review ref matches", () => {
    const traceRef = `evidence/phases/phase-history/${OLD_TREE}/phase-map-trace-${"9".repeat(64)}.json`;
    const original = new Error("canonical Phase trace is invalid: fixture failure");
    const task = {
      listCanonicalPhaseMapTraceRefs: () => [traceRef],
      readRecord: () => `${JSON.stringify({
        review_result: { ref: OLD_REVIEW_REF, sha256: "f".repeat(64) },
      })}\n`,
    };
    const corrections = new Map([[OLD_REVIEW_REF, { sha256: "e".repeat(64) }]]);

    expect(() => selectCanonicalPhaseTraces({
      task,
      sourceRoot: "fixture",
      corrections,
      readTrace: () => { throw original; },
    })).toThrow(original);
  });

  it("uses the historical-tolerant namespace only for trace selection", () => {
    let received;
    const task = {
      listCanonicalPhaseMapTraceRefs: (options) => {
        received = options;
        return [];
      },
    };

    expect(selectCanonicalPhaseTraces({
      task,
      sourceRoot: "fixture",
      corrections: new Map(),
    })).toEqual([]);
    expect(received).toEqual({ tolerateHistoricalInvalidRecords: true });
  });
});

describe("integration selector verified descendant continuations", () => {
  it("accepts the initial Phase material-only seam from the build-plan checkpoint", async () => {
    const f = descendantFixture();
    try {
      const acceptedCommit = git(f.root, "rev-parse", "HEAD~2");
      const acceptedTree = git(f.root, "rev-parse", `${acceptedCommit}^{tree}`);
      expect(isInitialTasksCompletionSeam({
        task: f.task,
        sourceRoot: f.root,
        acceptedCommit,
        acceptedTree,
        candidateTrace: { trace: { baseline_commit: git(f.root, "rev-parse", "HEAD~1"), base_tree: git(f.root, "rev-parse", "HEAD~1^{tree}") } },
      })).toBe(true);
    } finally {
      await cleanup(f.root);
    }
  });

  it("rejects an initial seam that contains a code change", async () => {
    const f = descendantFixture();
    try {
      const acceptedCommit = git(f.root, "rev-parse", "HEAD~2");
      const acceptedTree = git(f.root, "rev-parse", `${acceptedCommit}^{tree}`);
      const baselineCommit = git(f.root, "rev-parse", "HEAD~1");
      const baselineTree = git(f.root, "rev-parse", `${baselineCommit}^{tree}`);
      // The fixture's first commit is the accepted checkpoint. Add a code
      // file to the same baseline commit's tree through a follow-up commit;
      // the seam must remain material-only and therefore reject it.
      const artifacts = ArtifactDir.open(f.root, f.task);
      artifacts.writeAtomic("code-drift.mjs", "drift\n");
      git(f.root, "add", ".");
      git(f.root, "commit", "-qm", "unrelated code drift");
      const driftCommit = git(f.root, "rev-parse", "HEAD");
      expect(isInitialTasksCompletionSeam({
        task: f.task,
        sourceRoot: f.root,
        acceptedCommit,
        acceptedTree,
        candidateTrace: { trace: { baseline_commit: driftCommit, base_tree: git(f.root, "rev-parse", `${driftCommit}^{tree}`) } },
      })).toBe(false);
      expect(baselineCommit).not.toBe(driftCommit);
      expect(baselineTree).not.toBe(git(f.root, "rev-parse", `${driftCommit}^{tree}`));
    } finally {
      await cleanup(f.root);
    }
  });

  it("selects a same-phase successor and leaves an unbound duplicate ambiguous", () => {
    const oldTraceRef = "evidence/phases/phase-9/" + OLD_TREE + "/phase-map-trace-" + "1".repeat(64) + ".json";
    const newTraceRef = "evidence/phases/phase-9/" + NEW_TREE + "/phase-map-trace-" + "2".repeat(64) + ".json";
    const successorRef = "results/build-code/revisions/phase-successor-0003.json";
    const successor = {
      schema_version: "workflowhub-build-code-phase-successor.v2",
      task_id: "replacement",
      stage: "build-code",
      phase_id: "phase-9",
      previous_canonical_phase_evidence_ref: "evidence/phases/phase-9/old-evidence.json",
      previous_canonical_phase_evidence_hash: "3".repeat(64),
      previous_snapshot_tree: OLD_TREE,
      current_snapshot_tree: NEW_TREE,
    };
    const successorHash = sha(`${JSON.stringify(successor)}\n`);
    const old = {
      traceRef: oldTraceRef,
      traceSha256: "1".repeat(64),
      trace: {
        phase_id: "phase-9", snapshot_tree: OLD_TREE,
        canonical_phase_evidence: binding(successor.previous_canonical_phase_evidence_ref, successor.previous_canonical_phase_evidence_hash),
      },
    };
    const replacement = {
      traceRef: newTraceRef,
      traceSha256: "2".repeat(64),
      trace: {
        phase_id: "phase-9", snapshot_tree: NEW_TREE,
        canonical_phase_evidence: binding("evidence/phases/phase-9/new-evidence.json", "4".repeat(64)),
      },
      phaseEvidence: { value: { phase_successor_ref: successorRef, phase_successor_hash: successorHash } },
    };
    const task = {
      identity: { projectName: "fixture", taskId: "replacement" },
      listCanonicalPhaseMapTraceRefs: () => [oldTraceRef, newTraceRef],
      readRecord: (ref) => {
        if (ref === successorRef) return `${JSON.stringify(successor)}\n`;
        throw new Error(`unexpected read ${ref}`);
      },
    };
    const selected = selectCanonicalPhaseTraces({ task, sourceRoot: "fixture", corrections: new Map(), readTrace: (_task, _root, ref) => ref === oldTraceRef ? old : replacement });
    expect(selected).toEqual([replacement]);
    successor.previous_canonical_phase_evidence_hash = "f".repeat(64);
    const unchanged = selectCanonicalPhaseTraces({ task, sourceRoot: "fixture", corrections: new Map(), readTrace: (_task, _root, ref) => ref === oldTraceRef ? old : replacement });
    expect(unchanged).toHaveLength(2);
  });

  it("accepts a material-only Git descendant with receipts bound to its current tree", async () => {
    const f = descendantFixture();
    try {
      expect(isVerifiedDescendantContinuation({
        task: f.task, sourceRoot: f.root, previousTrace: f.previousTrace, candidateTrace: f.candidateTrace,
      })).toBe(true);
    } finally {
      await cleanup(f.root);
    }
  });

  it("rejects a baseline ancestry path that contains a non-material commit", async () => {
    const f = descendantFixture({ nonMaterialBaseline: true });
    try {
      expect(isVerifiedDescendantContinuation({
        task: f.task, sourceRoot: f.root, previousTrace: f.previousTrace, candidateTrace: f.candidateTrace,
      })).toBe(false);
    } finally {
      await cleanup(f.root);
    }
  });

  it("rejects unknown or non-ancestor baselines", async () => {
    const f = descendantFixture();
    try {
      f.candidateTrace.trace.baseline_commit = "f".repeat(40);
      expect(isVerifiedDescendantContinuation({
        task: f.task, sourceRoot: f.root, previousTrace: f.previousTrace, candidateTrace: f.candidateTrace,
      })).toBe(false);
    } finally {
      await cleanup(f.root);
    }
  });

  it("rejects receipt/tree and allowlist drift", async () => {
    const f = descendantFixture();
    try {
      f.candidateTrace.implementation.value.snapshot_tree = "f".repeat(40);
      expect(isVerifiedDescendantContinuation({
        task: f.task, sourceRoot: f.root, previousTrace: f.previousTrace, candidateTrace: f.candidateTrace,
      })).toBe(false);
      const clean = descendantFixture();
      try {
        clean.candidateTrace.trace.changed_files = ["outside.txt"];
        clean.candidateTrace.scan.value.changed_files = ["outside.txt"];
        expect(isVerifiedDescendantContinuation({
          task: clean.task, sourceRoot: clean.root, previousTrace: clean.previousTrace, candidateTrace: clean.candidateTrace,
        })).toBe(false);
      } finally {
        await cleanup(clean.root);
      }
    } finally {
      await cleanup(f.root);
    }
  });

  it("accepts a formally bound unavailable current Phase review", async () => {
    const f = descendantFixture();
    try {
      markUnavailable(f.candidateTrace);
      expect(isVerifiedDescendantContinuation({
        task: f.task, sourceRoot: f.root, previousTrace: f.previousTrace, candidateTrace: f.candidateTrace,
      })).toBe(true);
    } finally {
      await cleanup(f.root);
    }
  });

  it("accepts a formally bound unavailable predecessor Phase review", async () => {
    const f = descendantFixture();
    try {
      markUnavailable(f.previousTrace);
      expect(isVerifiedDescendantContinuation({
        task: f.task, sourceRoot: f.root, previousTrace: f.previousTrace, candidateTrace: f.candidateTrace,
      })).toBe(true);
    } finally {
      await cleanup(f.root);
    }
  });

  it("rejects unavailable review records with a missing attempt binding", async () => {
    const f = descendantFixture();
    try {
      markUnavailable(f.candidateTrace);
      delete f.candidateTrace.trace.review_attempt;
      expect(isVerifiedDescendantContinuation({
        task: f.task, sourceRoot: f.root, previousTrace: f.previousTrace, candidateTrace: f.candidateTrace,
      })).toBe(false);
    } finally {
      await cleanup(f.root);
    }
  });

  it("rejects unavailable review records with a missing or mismatched contract field", async () => {
    const missingAttempt = descendantFixture();
    try {
      markUnavailable(missingAttempt.candidateTrace);
      delete missingAttempt.candidateTrace.attempt;
      expect(isVerifiedDescendantContinuation({
        task: missingAttempt.task, sourceRoot: missingAttempt.root,
        previousTrace: missingAttempt.previousTrace, candidateTrace: missingAttempt.candidateTrace,
      })).toBe(false);
    } finally {
      await cleanup(missingAttempt.root);
    }
    const mismatch = descendantFixture();
    try {
      markUnavailable(mismatch.candidateTrace, { mismatch: "material_id" });
      expect(isVerifiedDescendantContinuation({
        task: mismatch.task, sourceRoot: mismatch.root,
        previousTrace: mismatch.previousTrace, candidateTrace: mismatch.candidateTrace,
      })).toBe(false);
    } finally {
      await cleanup(mismatch.root);
    }
    const badRef = descendantFixture();
    try {
      markUnavailable(badRef.candidateTrace, { mismatch: "attempt_ref" });
      expect(isVerifiedDescendantContinuation({
        task: badRef.task, sourceRoot: badRef.root,
        previousTrace: badRef.previousTrace, candidateTrace: badRef.candidateTrace,
      })).toBe(false);
    } finally {
      await cleanup(badRef.root);
    }
  });
});
