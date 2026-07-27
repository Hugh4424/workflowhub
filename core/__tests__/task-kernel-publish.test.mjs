import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { execFile, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { promisify } from "node:util";

import { createTask } from "../task-handle.mjs";
import { createTaskKernel, validateAccepted } from "../task-kernel.mjs";
import { openAcceptedWorkspace, prepareTaskWorkspace } from "../workspace.mjs";
import { ArtifactDir } from "../artifact-dir.mjs";
import { verifyGitCheckpoint } from "../git-checkpoint.mjs";
import { aggregateCanonicalProviderResults } from "../canonical-review-result.mjs";
import { hashAuditSummary } from "../audit-summary-carrier.mjs";
import { captureGitWorktreeSnapshot } from "../git-worktree-snapshot.mjs";

const temporary = [];
const execFileAsync = promisify(execFile);
function confirmation(kernel, stage, attemptRef) {
  return kernel.confirmAttempt(stage, attemptRef, "accepted", stage === "make-decision" ? "comment:test-confirmation" : undefined).ref;
}
function createAuditedTestKernel(task, options = {}) {
  const kernel = createTaskKernel(task, options);
  const activeWorkspace = options.candidateWorkspace ?? options.workspace;
  if (!activeWorkspace) return kernel;
  return Object.freeze({
    ...kernel,
    publishAttempt(stage, data = {}) {
        let active;
        try { active = kernel.activeStageRun(stage, { required: false }); }
        catch { active = null; }
        if (active === null) active = kernel.startStageRun(stage, { reason: "test fixture publication" });
        const snapshot = typeof activeWorkspace.captureSnapshot === "function"
          ? activeWorkspace.captureSnapshot()
          : captureGitWorktreeSnapshot(activeWorkspace.worktreeRoot);
        const kind = `${stage}.test`;
        const content = {
          schema_version: "stage-content-evidence.v1",
          kind,
          task_id: task.identity.taskId,
          stage,
          workflow_run_id: active.run.workflow_run_id,
          snapshot_tree: snapshot.tree,
        };
        const contentRaw = `${JSON.stringify(content, null, 2)}\n`;
        const contentHash = createHash("sha256").update(contentRaw).digest("hex");
        const contentRef = `evidence/stage-content/${contentHash}/${stage}-test.json`;
        try { kernel.publishCanonicalRecord(contentRef, contentRaw); }
        catch (error) {
          if (error?.code !== "EEXIST" || task.readRecord(contentRef) !== contentRaw) throw error;
        }
        const contentEvidenceRefs = [{ kind, ref: contentRef, hash: contentHash }];
        const unsignedSummary = {
          schema_version: "stage-audit-summary.v1",
          task_id: task.identity.taskId,
          stage_slug: stage,
          workflow_run_id: active.run.workflow_run_id,
          snapshot_tree: snapshot.tree,
          verdict: "pass",
          content_evidence_refs: contentEvidenceRefs,
        };
        const summaryHash = hashAuditSummary(unsignedSummary);
        const summary = { ...unsignedSummary, summary_hash: summaryHash };
        const summaryRaw = `${JSON.stringify(summary, null, 2)}\n`;
        const summaryRef = `evidence/audits/${stage}/${summaryHash}.json`;
        try { kernel.publishCanonicalRecord(summaryRef, summaryRaw); }
        catch (error) {
          if (error?.code !== "EEXIST" || task.readRecord(summaryRef) !== summaryRaw) throw error;
        }
        const facts = {
          ...data.facts,
          ...(stage === "make-decision" && options.candidateWorkspace ? {
            worktree_root: options.candidateWorkspace.worktreeRoot,
            baseline_commit: options.candidateWorkspace.baselineCommit,
          } : {}),
          audit_contract_version: "v1",
          audit_summary_ref: summaryRef,
          audit_summary_hash: summaryHash,
          audit_verdict: "pass",
          content_evidence_refs: contentEvidenceRefs,
        };
        return kernel.publishAttempt(stage, { ...data, facts });
    },
  });
}
function fixture(inputs = {}, { deferCandidate = false } = {}) {
  const storageRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-kernel-publish-")));
  temporary.push(storageRoot);
  const repo = join(storageRoot, "repo");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  writeFileSync(join(repo, "README.md"), "fixture\n");
  execFileSync("git", ["add", "README.md"], { cwd: repo });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: repo });
  const taskPath = join(storageRoot, "Projects", "Demo", "tasks", "task-one");
  const task = createTask({ storageRoot, taskPath, manifest: {
    schema_version: "1.0.0", project_name: "Demo", task_id: "task-one",
    created_at: "2026-07-16T00:00:00.000Z", target_repo_root: repo,
    issue_ids: [], inputs,
  } });
  if (deferCandidate) return { repo, task, candidate: null, kernel: createTaskKernel(task) };
  const candidate = prepareTaskWorkspace(task);
  return {
    repo,
    task,
    candidate,
    kernel: createAuditedTestKernel(task, { candidateWorkspace: candidate }),
  };
}
function publishAdoptableLegacyRoot(kernel, suffix = "legacy-root", {
  output = { verdict: "pass", summary: "legacy result", findings: [] },
  withAdjudication = false,
  evidenceAnchors = output.findings.map(() => false),
  snapshotTree = "5".repeat(40),
} = {}) {
  const attemptId = `${suffix}-attempt`;
  const attemptRef = `reviews/attempts/${attemptId}/attempt.json`;
  const outputRef = `reviews/attempts/${attemptId}/providers/fixture-a.output.json`;
  const resultRef = `reviews/results/${suffix}.json`;
  const source = {
    target_commit: "1".repeat(40), base_commit: "2".repeat(40),
    base_tree: "3".repeat(40), captured_head: "4".repeat(40),
  };
  const materialId = "6".repeat(64);
  const reviewChain = {
    version: "wh-review-chain.v1", round: "initial",
    parent_result_ref: null, root_result_ref: null, prior_snapshot_tree: null,
    current_snapshot_tree: snapshotTree, response_ledger_sha256: null,
    source_diff_sha256: "7".repeat(64),
  };
  const content = JSON.stringify(output);
  kernel.publishCanonicalRecord(outputRef, `${JSON.stringify({
    schema_version: "wh-review-provider-output.v1", task_id: "task-one",
    stage: "make-decision", attempt_id: attemptId, provider: "fixture/a",
    content, content_hash: createHash("sha256").update(content).digest("hex"),
  })}\n`);
  kernel.publishCanonicalRecord(attemptRef, `${JSON.stringify({
    version: "wh-review-attempt.v1", attempt_id: attemptId, task_id: "task-one",
    stage: "make-decision", review_track: "direction", subject_kind: "worktree",
    phase_id: null, review_scope: null, source, snapshot_tree: snapshotTree,
    material_id: materialId, review_chain: reviewChain,
    provider_attempts: [
      { provider: "fixture/a", status: "failed", session_id: null, runtime_id: null, output_ref: null,
        error: { code: "RETRY", message: "retry" } },
      { provider: "fixture/a", status: "completed", session_id: "session", runtime_id: "runtime",
        output_ref: outputRef, error: null },
    ],
    terminal_status: "semantic", error: null,
  })}\n`);
  const aggregation = aggregateCanonicalProviderResults([{
    provider: "fixture/a", review: output,
    evidenceAnchors,
  }], 1);
  kernel.publishCanonicalRecord(resultRef, `${JSON.stringify({
    version: "wh-review-result.v1", task_id: "task-one", stage: "make-decision",
    review_track: "direction", subject_kind: "worktree", phase_id: null,
    review_scope: null, source, snapshot_tree: snapshotTree, material_id: materialId,
    attempt_ref: attemptRef, review_chain: reviewChain,
    provider_results: [{ provider: "fixture/a", output }],
    verdict: aggregation.verdict,
    findings: withAdjudication
      ? aggregation.adjudication.reportFindings.map((finding) => ({ provider: finding.providers[0], ...finding }))
      : output.findings.map((finding) => ({ provider: "fixture/a", ...finding })),
    ...(withAdjudication ? { adjudication: {
      version: aggregation.adjudication.version,
      clusters: aggregation.adjudication.clusters,
    } } : {}),
  })}\n`);
  return { resultRef, attemptRef, outputRef };
}
function rewriteTaskRecord(task, ref, mutate) {
  const path = join(task.taskPath, ...ref.split("/"));
  const value = JSON.parse(task.readRecord(ref));
  writeFileSync(path, `${JSON.stringify(mutate(value), null, 2)}\n`);
}
afterEach(() => { while (temporary.length) rmSync(temporary.pop(), { recursive: true, force: true }); });

describe("TaskKernel append-only publication", () => {
  it("adopts one unique canonical legacy initial root without starting providers and is idempotent", () => {
    const { kernel } = fixture();
    const { resultRef } = publishAdoptableLegacyRoot(kernel);
    const adopted = kernel.adoptLegacyReviewRoot({ result_ref: resultRef });
    expect(adopted).toMatchObject({
      sequence: 1, event_kind: "semantic_result", root_result_ref: resultRef,
      head_result_ref: resultRef, round: "initial", provider_calls: 2,
    });
    expect(kernel.adoptLegacyReviewRoot({ result_ref: resultRef })).toEqual(adopted);
  });

  it("fails loud when legacy adoption is ambiguous or the caller supplies anything but a result ref", () => {
    const { kernel } = fixture();
    const first = publishAdoptableLegacyRoot(kernel, "legacy-one");
    publishAdoptableLegacyRoot(kernel, "legacy-two");
    expect(() => kernel.adoptLegacyReviewRoot({ result_ref: first.resultRef }))
      .toThrow(/ambiguous|stale|multiple/i);
    expect(() => kernel.adoptLegacyReviewRoot({
      result_ref: first.resultRef, workflow_run_id: "forged",
    })).toThrow(/unknown|workflow_run_id/i);
  });

  it("adopts historical false anchor assessments without trusting result-owned anchor flags", () => {
    const { kernel } = fixture();
    const { resultRef } = publishAdoptableLegacyRoot(kernel, "legacy-false-anchors", {
      withAdjudication: true,
      output: {
        verdict: "pass", summary: "historical anchored result",
        findings: [{
          severity: "minor", path: "requirements/draft_spec.md", line: 12,
          issue: "minor wording", recommendation: "tighten wording",
          evidence_kind: "direct", evidence: "line 12", root_cause: "wording drift",
        }],
      },
    });
    expect(kernel.adoptLegacyReviewRoot({ result_ref: resultRef })).toMatchObject({
      root_result_ref: resultRef, verdict: "pass",
    });
  });

  it("keeps legacy anchor compatibility out of verdict, findings, provider, and flag authority", () => {
    const mutations = [
      (result) => ({ ...result, verdict: "revise_required" }),
      (result) => ({ ...result, findings: result.findings.map((finding) => ({ ...finding, issue: "tampered" })) }),
      (result) => ({ ...result, provider_results: result.provider_results.map((item) => ({ ...item, provider: "fixture/forged" })) }),
      (result) => ({
        ...result,
        findings: result.findings.map((finding) => ({
          ...finding,
          provider_findings: finding.provider_findings.map((item) => ({ ...item, evidence_anchor_valid: true })),
        })),
        adjudication: {
          ...result.adjudication,
          clusters: result.adjudication.clusters.map((cluster) => ({
            ...cluster,
            provider_findings: cluster.provider_findings.map((item) => ({ ...item, evidence_anchor_valid: true })),
          })),
        },
      }),
    ];
    for (const [index, mutate] of mutations.entries()) {
      const { task, kernel } = fixture();
      const { resultRef } = publishAdoptableLegacyRoot(kernel, `legacy-tamper-${index}`, {
        withAdjudication: true,
        output: {
          verdict: "pass", summary: "historical anchored result",
          findings: [{
            severity: "minor", path: "requirements/draft_spec.md", line: 12,
            issue: "minor wording", recommendation: "tighten wording",
            evidence_kind: "direct", evidence: "line 12", root_cause: "wording drift",
          }],
        },
      });
      rewriteTaskRecord(task, resultRef, mutate);
      expect(() => kernel.adoptLegacyReviewRoot({ result_ref: resultRef }))
        .toThrow(/aggregation|provider|semantic result|exactly match/i);
    }
  });

  it("owns one review-flow root/head and treats previous_result_ref only as CAS", () => {
    const { task, kernel, candidate } = fixture();
    const identity = {
      workflow_run_id: "run-1", stage: "build-spec", review_track: null,
      subject_kind: "worktree", phase_id: null, review_scope: null,
    };
    const rootRef = "reviews/results/root.json";
    const headRef = "reviews/results/head.json";
    kernel.publishCanonicalRecord(rootRef, `${JSON.stringify({
      version: "wh-review-result.v1", task_id: "task-one", stage: "build-spec",
      review_track: null, subject_kind: "worktree", phase_id: null, review_scope: null,
      verdict: "pass", provider_results: [{ provider: "fixture/a" }],
    })}\n`);
    const root = kernel.advanceReviewFlow(identity, {
      expected_head_ref: null, result_ref: rootRef,
    });
    expect(root).toMatchObject({
      root_result_ref: rootRef, head_result_ref: rootRef,
      semantic_result_count: 1, structural_full_reviews: 0, provider_calls: 1,
    });
    expect(kernel.readReviewFlow(identity)).toEqual(root);

    kernel.publishCanonicalRecord(headRef, `${JSON.stringify({
      version: "wh-review-result.v1", task_id: "task-one", stage: "build-spec",
      review_track: null, subject_kind: "worktree", phase_id: null, review_scope: null,
      verdict: "pass", provider_results: [{ provider: "fixture/b" }],
      review_chain: {
        version: "wh-review-chain.v1", round: "full",
        parent_result_ref: rootRef, root_result_ref: rootRef,
      },
    })}\n`);
    const head = kernel.advanceReviewFlow(identity, { result_ref: headRef });
    expect(head).toMatchObject({
      root_result_ref: rootRef, head_result_ref: headRef,
      semantic_result_count: 2, structural_full_reviews: 1, provider_calls: 2,
    });
    expect(() => kernel.advanceReviewFlow(identity, {
      expected_head_ref: rootRef, result_ref: headRef,
    })).toThrow(/stale|CAS|head/i);
    expect(task.listCanonicalReviewFlowEventRefs(head.flow_id)).toHaveLength(2);
  });

  it("records resolutions as ordered zero-provider flow actions without moving the semantic head", () => {
    const { task, kernel, candidate } = fixture();
    const identity = {
      workflow_run_id: "run-resolution", stage: "build-spec", review_track: null,
      subject_kind: "worktree", phase_id: null, review_scope: null,
    };
    const rootRef = "reviews/results/resolution-root.json";
    kernel.publishCanonicalRecord(rootRef, `${JSON.stringify({
      version: "wh-review-result.v1", task_id: "task-one", stage: "build-spec",
      review_track: null, subject_kind: "worktree", phase_id: null, review_scope: null,
      snapshot_tree: "a".repeat(40), verdict: "pass", provider_results: [{ provider: "fixture/a" }],
    })}\n`);
    const root = kernel.advanceReviewFlow(identity, { expected_head_ref: null, result_ref: rootRef });
    const resolution = {
      version: "wh-review-resolution.v1", task_id: "task-one", stage: "build-spec", review_track: null,
      outcome: "recorded_non_gate_response", previous_result_ref: rootRef,
      previous_result_sha256: root.result_sha256, previous_snapshot_tree: "a".repeat(40),
      snapshot_tree: "a".repeat(40), evidence_state: "verified",
      response_ledger: {}, response_ledger_sha256: "b".repeat(64), unverified_reason: null,
      accepted_risk_count: 0,
    };
    expect(() => kernel.recordReviewResolution(identity, {
      expected_head_ref: rootRef,
      expected_event_ref: root.event_ref,
      resolution: { ...resolution, snapshot_tree: "b".repeat(40) },
    })).toThrow(/classification|manifest|machine/i);
    const recorded = kernel.recordReviewResolution(identity, {
      expected_head_ref: rootRef,
      expected_event_ref: root.event_ref,
      resolution,
    });
    expect(recorded).toMatchObject({
      resolution_ref: expect.stringMatching(/^reviews\/resolutions\/[a-f0-9]{64}\.json$/),
      flow: {
        sequence: 2, event_kind: "resolution",
        head_result_ref: rootRef, root_result_ref: rootRef,
        semantic_result_count: 1, structural_full_reviews: 0, provider_calls: 1,
      },
    });
    expect(kernel.recordReviewResolution(identity, {
      expected_head_ref: rootRef,
      expected_event_ref: root.event_ref,
      resolution,
    })).toEqual(recorded);
    expect(() => kernel.recordReviewResolution(identity, {
      expected_head_ref: rootRef,
      expected_event_ref: root.event_ref,
      resolution: { ...resolution, snapshot_tree: "c".repeat(40) },
    })).toThrow(/CAS|stale|event/i);
  });

  it("records unavailable provider cost without moving head or consuming the structural full budget", () => {
    const { task, kernel } = fixture();
    const identity = {
      workflow_run_id: "run-unavailable", stage: "build-spec", review_track: null,
      subject_kind: "worktree", phase_id: null, review_scope: null,
    };
    const attemptRef = "reviews/attempts/unavailable-cost/attempt.json";
    kernel.publishCanonicalRecord(attemptRef, `${JSON.stringify({
      version: "wh-review-attempt.v1", attempt_id: "unavailable-cost", task_id: "task-one",
      stage: "build-spec", review_track: null, subject_kind: "worktree", phase_id: null, review_scope: null,
      provider_attempts: [
        { provider: "fixture/a", status: "failed" },
        { provider: "fixture/a", status: "failed" },
        { provider: "fixture/b", status: "failed" },
      ],
      terminal_status: "unavailable", error: { code: "PROVIDER_UNAVAILABLE", message: "down" },
      review_chain: { round: "full", parent_result_ref: null, root_result_ref: null },
    })}\n`);
    const recorded = kernel.recordReviewAttempt(identity, {
      expected_head_ref: null,
      expected_event_ref: null,
      attempt_ref: attemptRef,
    });
    expect(recorded).toMatchObject({
      event_kind: "provider_attempt", head_result_ref: null, root_result_ref: null,
      semantic_result_count: 0, structural_full_reviews: 0, provider_calls: 3,
    });
    expect(kernel.readReviewFlow(identity)).toEqual(recorded);
    const secondAttemptRef = "reviews/attempts/unavailable-cost-next/attempt.json";
    kernel.publishCanonicalRecord(secondAttemptRef, `${JSON.stringify({
      version: "wh-review-attempt.v1", attempt_id: "unavailable-cost-next", task_id: "task-one",
      stage: "build-spec", review_track: null, subject_kind: "worktree", phase_id: null, review_scope: null,
      provider_attempts: [{ provider: "fixture/c", status: "failed" }],
      terminal_status: "unavailable", error: { code: "PROVIDER_UNAVAILABLE", message: "still down" },
      review_chain: { round: "full", parent_result_ref: null, root_result_ref: null },
    })}\n`);
    const second = kernel.recordReviewAttempt(identity, {
      expected_head_ref: null,
      expected_event_ref: recorded.event_ref,
      attempt_ref: secondAttemptRef,
    });
    expect(second).toMatchObject({ event_kind: "provider_attempt", provider_calls: 4 });
    expect(kernel.readReviewFlowHistory(identity)).toEqual({
      flow: second,
      provider_attempt_refs: [attemptRef, secondAttemptRef],
    });
  });

  it("fails loud on cross-flow refs, a second non-code structural full, and forged flow records", () => {
    const { task, kernel } = fixture();
    const identity = {
      workflow_run_id: "run-a", stage: "build-spec", review_track: null,
      subject_kind: "worktree", phase_id: null, review_scope: null,
    };
    const other = { ...identity, workflow_run_id: "run-b" };
    const publishResult = (ref, data) => kernel.publishCanonicalRecord(ref, `${JSON.stringify({
      version: "wh-review-result.v1", task_id: "task-one", stage: "build-spec",
      review_track: null, subject_kind: "worktree", phase_id: null, review_scope: null,
      verdict: "revise_required", provider_results: [{ provider: "fixture/a" }], ...data,
    })}\n`);
    const rootRef = "reviews/results/root-a.json";
    publishResult(rootRef);
    const root = kernel.advanceReviewFlow(identity, { result_ref: rootRef });
    expect(() => kernel.advanceReviewFlow(other, {
      expected_head_ref: rootRef, result_ref: rootRef,
    })).toThrow(/cross-flow|root|parent|head|CAS/i);

    const firstFullRef = "reviews/results/full-a.json";
    publishResult(firstFullRef, { review_chain: {
      version: "wh-review-chain.v1", round: "full",
      parent_result_ref: rootRef, root_result_ref: rootRef,
    } });
    kernel.advanceReviewFlow(identity, { result_ref: firstFullRef });
    const secondFullRef = "reviews/results/full-b.json";
    publishResult(secondFullRef, { review_chain: {
      version: "wh-review-chain.v1", round: "full",
      parent_result_ref: firstFullRef, root_result_ref: rootRef,
    } });
    expect(() => kernel.advanceReviewFlow(identity, { result_ref: secondFullRef }))
      .toThrow(/structural.*budget|already/i);
    expect(() => kernel.publishCanonicalRecord(
      `reviews/flows/${root.flow_id}/event-9999.json`, "{}\n",
    )).toThrow(/review flow|authority/i);

    const unavailableRef = "reviews/results/unavailable.json";
    publishResult(unavailableRef, { verdict: null, provider_results: [] });
    expect(() => kernel.advanceReviewFlow(identity, { result_ref: unavailableRef }))
      .toThrow(/non-semantic|semantic/i);
    expect(kernel.readReviewFlow(identity).head_result_ref).toBe(firstFullRef);

    writeFileSync(join(task.taskPath, "reviews", "flows", root.flow_id, "event-0003.json"), "{}\n");
    expect(() => kernel.readReviewFlow(identity)).toThrow(/unreadable|invalid|forked|head/i);
  });

  it("keeps build-code full-only flows unbounded while preserving one root and head", () => {
    const { kernel } = fixture();
    const identity = {
      workflow_run_id: "build-run", stage: "build-code", review_track: null,
      subject_kind: "phase", phase_id: "phase-1", review_scope: "phase",
    };
    const publish = (ref, parent = null, root = null) => {
      kernel.publishCanonicalRecord(ref, `${JSON.stringify({
        version: "wh-review-result.v1", task_id: "task-one", stage: "build-code",
        review_track: null, subject_kind: "phase", phase_id: "phase-1", review_scope: "phase",
        verdict: parent === null ? "revise_required" : "pass",
        provider_results: [{ provider: "fixture/a" }],
        ...(parent === null ? {} : { review_chain: {
          version: "wh-review-chain.v1", round: "full",
          parent_result_ref: parent, root_result_ref: root,
        } }),
      })}\n`);
    };
    const rootRef = "reviews/results/build-root.json";
    const fullOneRef = "reviews/results/build-full-1.json";
    const fullTwoRef = "reviews/results/build-full-2.json";
    publish(rootRef);
    kernel.advanceReviewFlow(identity, { result_ref: rootRef });
    publish(fullOneRef, rootRef, rootRef);
    kernel.advanceReviewFlow(identity, { result_ref: fullOneRef });
    publish(fullTwoRef, fullOneRef, rootRef);
    expect(kernel.advanceReviewFlow(identity, { result_ref: fullTwoRef })).toMatchObject({
      root_result_ref: rootRef, head_result_ref: fullTwoRef, structural_full_reviews: 2,
    });
  });

  it("starts a snapshot-scoped Phase flow from verified external lineage only", () => {
    const { kernel, task } = fixture();
    const parentRef = "reviews/results/phase-old.json";
    const rootRef = "reviews/results/phase-root.json";
    const oldTree = "a".repeat(40), newTree = "b".repeat(40);
    const parent = {
      version: "wh-review-result.v1", task_id: "task-one", stage: "build-code",
      review_track: null, subject_kind: "phase", phase_id: "phase-6", review_scope: "phase",
      snapshot_tree: oldTree, verdict: "pass", provider_results: [],
      review_chain: { root_result_ref: rootRef },
    };
    kernel.publishCanonicalRecord(parentRef, `${JSON.stringify(parent)}\n`);
    const identity = {
      workflow_run_id: "build-run", stage: "build-code", review_track: null,
      subject_kind: "phase", phase_id: "phase-6", review_scope: "phase", snapshot_tree: newTree,
    };
    const childRef = "reviews/results/phase-new.json";
    const child = {
      ...parent, snapshot_tree: newTree, verdict: "pass", provider_results: [{ provider: "fixture/a" }],
      review_chain: {
        version: "wh-review-chain.v1", round: "initial", parent_result_ref: parentRef,
        root_result_ref: rootRef, prior_snapshot_tree: oldTree, current_snapshot_tree: newTree,
        response_ledger_sha256: "c".repeat(64),
      },
    };
    kernel.publishCanonicalRecord(childRef, `${JSON.stringify(child)}\n`);
    expect(kernel.advanceReviewFlow(identity, { result_ref: childRef })).toMatchObject({
      root_result_ref: rootRef, head_result_ref: childRef,
    });
    expect(kernel.readReviewFlow(identity)).toMatchObject({
      root_result_ref: rootRef, head_result_ref: childRef,
    });
    const badRef = "reviews/results/phase-cross-task.json";
    kernel.publishCanonicalRecord(badRef, `${JSON.stringify({ ...child, task_id: "other-task" })}\n`);
    expect(() => kernel.advanceReviewFlow({ ...identity, snapshot_tree: "d".repeat(40) }, { result_ref: badRef }))
      .toThrow(/non-semantic|does not match/);
    const sameRef = "reviews/results/phase-same-snapshot.json";
    kernel.publishCanonicalRecord(sameRef, `${JSON.stringify({
      ...child, snapshot_tree: oldTree,
      review_chain: { ...child.review_chain, current_snapshot_tree: oldTree },
    })}\n`);
    expect(() => kernel.advanceReviewFlow({ ...identity, snapshot_tree: oldTree }, { result_ref: sameRef }))
      .toThrow(/external Phase review lineage/);
    writeFileSync(join(task.taskPath, parentRef), `${JSON.stringify({ ...parent, snapshot_tree: newTree })}\n`);
    expect(() => kernel.readReviewFlow(identity)).toThrow(/multiple roots|invalid initial head/);
  });

  it("writes one exact serious-risk acceptance without changing the review-flow verdict", () => {
    const { task, kernel, candidate } = fixture();
    const issue = "a required answer can be silently dropped";
    const { resultRef } = publishAdoptableLegacyRoot(kernel, "serious-risk", {
      withAdjudication: true,
      evidenceAnchors: [true],
      snapshotTree: candidate.captureSnapshot().tree,
      output: {
        verdict: "revise_required",
        summary: "serious issue",
        findings: [{
          severity: "major",
          path: "core/example.mjs",
          issue,
          recommendation: "preserve the answer",
          evidence_kind: "direct",
          evidence: "the branch drops the field",
          root_cause: "missing canonical binding",
        }],
      },
    });
    const identity = kernel.deriveReviewFlowIdentity({
      stage: "make-decision",
      review_track: "direction",
      subject_kind: "worktree",
      phase_id: null,
      review_scope: null,
    });
    const flow = kernel.advanceReviewFlow(identity, { result_ref: resultRef });
    const pause = kernel.prepareReviewRiskPause({ stage: "make-decision", reviewResultRef: resultRef });
    const finding = pause.findings[0];
    const replyRef = "evidence/review-risk-replies/reply-1.json";
    const replyRaw = `${JSON.stringify({ selected_option: "accept-risk", reply: "I understand the stated consequences and accept this exact risk." }, null, 2)}\n`;
    kernel.publishCanonicalRecord(replyRef, replyRaw);
    const replyHash = createHash("sha256").update(replyRaw).digest("hex");
    const accepted = kernel.acceptReviewRisk({
      stage: "make-decision",
      reviewResultRef: resultRef,
      findingId: finding.finding_id,
      cardRef: finding.card_ref,
      cardHash: finding.card_hash,
      selectedOption: "accept-risk",
      replyRef,
      replyHash,
    });
    expect(accepted).toMatchObject({
      risk_acceptance_ref: expect.stringMatching(/^evidence\/risk-acceptances\/[a-f0-9]{64}\.json$/),
      record: {
        review_ref: resultRef,
        finding_id: finding.finding_id,
        snapshot_tree: pause.snapshot_tree,
        selected_option: "accept-risk",
        review_verdict: "revise_required",
      },
    });
    expect(JSON.parse(task.readRecord(accepted.risk_acceptance_ref))).toEqual(accepted.record);
    expect(kernel.readReviewFlow({
      workflow_run_id: flow.identity.workflow_run_id,
      stage: "make-decision",
      review_track: "direction",
      subject_kind: "worktree",
      phase_id: null,
      review_scope: null,
    })).toMatchObject({ head_result_ref: resultRef, verdict: "revise_required" });
    expect(() => kernel.acceptReviewRisk({
      stage: "make-decision",
      reviewResultRef: resultRef,
      findingId: finding.finding_id,
      cardRef: finding.card_ref,
      cardHash: finding.card_hash,
      selectedOption: "agreed",
      replyRef,
      replyHash,
    })).toThrow(/accept-risk|exact/i);
    expect(() => kernel.acceptReviewRisk({
      stage: "make-decision",
      reviewResultRef: resultRef,
      findingId: finding.finding_id,
      cardRef: finding.card_ref,
      cardHash: finding.card_hash,
      selectedOption: "accept-risk",
      replyRef,
      replyHash: "b".repeat(64),
    })).toThrow(/reply ref\/hash/i);
  });

  it("rejects an upstream reference whose task identity is forged", () => {
    const { kernel } = fixture();
    const cp = { ref: "refs/checkpoint", commit_oid: "a".repeat(40), tree_oid: "b".repeat(40), artifacts: [] };
    expect(() => kernel.publishAttempt("build-spec", {
      facts: { spec_ref: "specs/task-one/spec.md", checkpoint: cp }, checkpoint: cp,
      upstream_refs: [{ task_id: "other-task", stage: "make-decision", accepted_ref: "results/make-decision/accepted.json" }],
    })).toThrow(/task|identity|upstream/i);
  });
  it("rejects a syntactically valid upstream ref when no authentic accepted record exists", () => {
    const { kernel } = fixture();
    const cp = { ref: "refs/checkpoint", commit_oid: "a".repeat(40), tree_oid: "b".repeat(40), artifacts: [] };
    expect(() => kernel.publishAttempt("build-spec", {
      facts: { spec_ref: "specs/task-one/spec.md", checkpoint: cp }, checkpoint: cp,
      upstream_refs: [{ task_id: "task-one", stage: "make-decision", accepted_ref: "results/make-decision/accepted.json" }],
    })).toThrow(/accepted|upstream|not found|ENOENT/i);
  });
  it("publishes monotonically numbered attempts without overwrite", () => {
    const { task, kernel } = fixture();
    const first = kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "a".repeat(40), decision: "go" } });
    const second = kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "a".repeat(40), decision: "revise" } });
    expect(first.attempt_ref).toBe("attempt-0001.json");
    expect(second.attempt_ref).toBe("attempt-0002.json");
    expect(JSON.parse(task.readRecord(`results/make-decision/${first.attempt_ref}`)).facts.decision).toBe("go");
  });

  it("accepts create-only with human confirmation and exact attempt hash", () => {
    const { kernel } = fixture();
    const attempt = kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "a".repeat(40), decision: "go" } });
    const accepted = kernel.acceptAttempt("make-decision", attempt.attempt_ref, confirmation(kernel, "make-decision", attempt.attempt_ref));
    expect(accepted).toMatchObject({ task_id: "task-one", stage: "make-decision", attempt_ref: attempt.attempt_ref,
      human_confirmation_ref: `confirmations/make-decision/${attempt.attempt_ref}`, integrity_hash: attempt.integrity_hash });
    expect(() => kernel.acceptAttempt("make-decision", attempt.attempt_ref, "journal:2")).toThrow();
    expect(() => kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "a".repeat(40) } }))
      .toThrow(/accepted|closed/i);
  });

  it("requires checkpoint provenance for accepted design stages", () => {
    const { task, kernel } = fixture();
    const candidate = prepareTaskWorkspace(task);
    const decision = kernel.publishAttempt("make-decision", { facts: { worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit } });
    kernel.acceptAttempt("make-decision", decision.attempt_ref, confirmation(kernel, "make-decision", decision.attempt_ref));
    const upstream_refs = [{ task_id: "task-one", stage: "make-decision", accepted_ref: "results/make-decision/accepted.json" }];
    expect(() => kernel.publishAttempt("build-spec", { facts: { spec_ref: "specs/task-one/spec.md", checkpoint: {} }, upstream_refs }))
      .toThrow(/checkpoint/i);
    const workspace = openAcceptedWorkspace(task, kernel.readAccepted("make-decision"));
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
    artifacts.writeAtomic("spec.md", "# Spec\n");
    const boundKernel = createAuditedTestKernel(task, { workspace, artifacts });
    const checkpoint = boundKernel.createCheckpoint("build-spec");
    expect(checkpoint).toMatchObject({ schema_version: "git-checkpoint-plan.v1",
      artifacts: [{ path: "specs/task-one/spec.md" }],
    });
    expect(() => execFileSync("git", ["show-ref", "--verify", checkpoint.ref], { cwd: task.manifest.target_repo_root, stdio: "ignore" })).toThrow();
    expect(() => boundKernel.publishAttempt("build-spec", {
      facts: { spec_ref: "specs/task-one/spec.md", checkpoint: structuredClone(checkpoint) }, upstream_refs,
    })).toThrow(/authentic GitCheckpoint/i);
    artifacts.writeAtomic("spec.md", "tampered\n");
    expect(() => boundKernel.publishAttempt("build-spec", {
      facts: { spec_ref: "specs/task-one/spec.md", checkpoint }, upstream_refs,
    })).toThrow(/differs|checkpoint|artifact/i);
    const revisedCheckpoint = boundKernel.createCheckpoint("build-spec");
    expect(revisedCheckpoint).not.toHaveProperty("ref");
    const attempt = boundKernel.publishAttempt("build-spec", { facts: { spec_ref: "specs/task-one/spec.md", checkpoint: revisedCheckpoint }, upstream_refs });
    expect(String(execFileSync("git", ["for-each-ref", "--format=%(refname)", "refs/workflowhub/checkpoints/"], { cwd: task.manifest.target_repo_root }))).toBe("");
    expect(() => boundKernel.confirmAttempt("build-spec", attempt.attempt_ref, "accepted")).toThrow(/automatic acceptance/i);
    expect(() => boundKernel.acceptAttempt("build-spec", attempt.attempt_ref, "human:forged")).toThrow(/automatic acceptance/i);
    const acceptedSpec = boundKernel.acceptAttempt("build-spec", attempt.attempt_ref);
    expect(acceptedSpec).toMatchObject({ acceptance_mode: "automatic" });
    expect(acceptedSpec).not.toHaveProperty("human_confirmation_ref");
    expect(acceptedSpec.checkpoint.ref).toMatch(/^refs\/workflowhub\/checkpoints\/Demo\/task-one\/build-spec\//);
    expect(() => verifyGitCheckpoint({ repoRoot: workspace.worktreeRoot, checkpoint: acceptedSpec.checkpoint, projectName: "Demo", taskId: "task-one", stage: "build-spec" })).not.toThrow();
    artifacts.writeAtomic("plan.md", "# Plan\n");
    artifacts.writeAtomic("tasks.md", "# Tasks\n");
    const planCheckpoint = boundKernel.createCheckpoint("build-plan");
    const planUpstream = [{ task_id: "task-one", stage: "build-spec", accepted_ref: "results/build-spec/accepted.json" }];
    const planAttempt = boundKernel.publishAttempt("build-plan", {
      facts: { plan_ref: "specs/task-one/plan.md", tasks_ref: "specs/task-one/tasks.md", checkpoint: planCheckpoint },
      upstream_refs: planUpstream,
    });
    const acceptedPlan = boundKernel.acceptAttempt("build-plan", planAttempt.attempt_ref, confirmation(boundKernel, "build-plan", planAttempt.attempt_ref));
    expect(acceptedPlan).toMatchObject({ acceptance_mode: "human" });
    expect(() => execFileSync("git", ["merge-base", "--is-ancestor", acceptedSpec.checkpoint.commit_oid, acceptedPlan.checkpoint.commit_oid], { cwd: task.manifest.target_repo_root })).not.toThrow();
  });

  it("rebinds an accepted build-plan to the current integration baseline without changing design bytes", () => {
    const { task, kernel } = fixture();
    const candidate = prepareTaskWorkspace(task);
    const decision = kernel.publishAttempt("make-decision", { facts: { worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit } });
    kernel.acceptAttempt("make-decision", decision.attempt_ref, confirmation(kernel, "make-decision", decision.attempt_ref));
    const workspace = openAcceptedWorkspace(task, kernel.readAccepted("make-decision"));
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
    const bound = createAuditedTestKernel(task, { workspace, artifacts });
    artifacts.writeAtomic("spec.md", "# Spec\n");
    const specAttempt = bound.publishAttempt("build-spec", {
      facts: { spec_ref: artifacts.reference("spec.md"), checkpoint: bound.createCheckpoint("build-spec") },
      upstream_refs: [{ task_id: "task-one", stage: "make-decision", accepted_ref: "results/make-decision/accepted.json" }],
    });
    bound.acceptAttempt("build-spec", specAttempt.attempt_ref);
    artifacts.writeAtomic("plan.md", "# Plan\n");
    artifacts.writeAtomic("tasks.md", "# Tasks\n");
    const planAttempt = bound.publishAttempt("build-plan", {
      facts: { plan_ref: artifacts.reference("plan.md"), tasks_ref: artifacts.reference("tasks.md"), checkpoint: bound.createCheckpoint("build-plan") },
      upstream_refs: [{ task_id: "task-one", stage: "build-spec", accepted_ref: "results/build-spec/accepted.json" }],
    });
    bound.acceptAttempt("build-plan", planAttempt.attempt_ref, confirmation(bound, "build-plan", planAttempt.attempt_ref));
    const bytes = ["spec.md", "plan.md", "tasks.md"].map((name) => artifacts.read(name));
    writeFileSync(join(workspace.worktreeRoot, "README.md"), "integrated\n");
    execFileSync("git", ["add", "README.md"], { cwd: workspace.worktreeRoot });
    execFileSync("git", ["commit", "-qm", "integration"], { cwd: workspace.worktreeRoot });

    writeFileSync(join(workspace.worktreeRoot, "unexpected.txt"), "drift\n");
    expect(() => bound.authorizeBuildPlanBaselineRebind()).toThrow(/unrelated Workspace drift/i);
    rmSync(join(workspace.worktreeRoot, "unexpected.txt"));
    artifacts.writeAtomic("plan.md", "# changed\n");
    expect(() => bound.authorizeBuildPlanBaselineRebind()).toThrow(/artifact differs|design bytes|drift/i);
    artifacts.writeAtomic("plan.md", bytes[1]);
    const authorization = bound.authorizeBuildPlanBaselineRebind();
    expect(() => bound.authorizeBuildPlanBaselineRebind("build-spec")).toThrow(/build-plan/i);
    expect(() => bound.createCheckpoint("build-plan", { baselineRebindRef: "results/build-plan/revisions/baseline-rebind-9999.json" })).toThrow(/ENOENT|not found/i);
    const authorizationRaw = task.readRecord(authorization.ref);
    const wrongTreeAuthorization = JSON.parse(authorizationRaw);
    wrongTreeAuthorization.base_tree = "0".repeat(40);
    writeFileSync(task.recordPath(authorization.ref), `${JSON.stringify(wrongTreeAuthorization, null, 2)}\n`);
    expect(() => bound.createCheckpoint("build-plan", { baselineRebindRef: authorization.ref })).toThrow(/Git checkpoint|tree|authorization/i);
    writeFileSync(task.recordPath(authorization.ref), authorizationRaw);
    const checkpoint = bound.createCheckpoint("build-plan", { baselineRebindRef: authorization.ref });
    expect(bound.createCheckpoint("build-plan", { baselineRebindRef: authorization.ref })).toEqual(checkpoint);
    expect(checkpoint.baseline_rebind_hash).toBe(authorization.hash);
    const revised = bound.publishAttempt("build-plan", {
      facts: { plan_ref: artifacts.reference("plan.md"), tasks_ref: artifacts.reference("tasks.md"), checkpoint },
      upstream_refs: [{ task_id: "task-one", stage: "build-spec", accepted_ref: "results/build-spec/accepted.json" }],
      baseline_rebind_ref: authorization.ref,
    });
    const revisedRaw = task.readRecord(`results/build-plan/${revised.attempt_ref}`);
    const badProvenance = JSON.parse(revisedRaw);
    badProvenance.baseline_rebind_provenance.authorization_hash = "0".repeat(64);
    writeFileSync(task.recordPath(`results/build-plan/${revised.attempt_ref}`), `${JSON.stringify(badProvenance, null, 2)}\n`);
    expect(() => bound.acceptAttempt("build-plan", revised.attempt_ref, "confirmations/build-plan/missing.json")).toThrow(/provenance|authorization|confirmation|hash/i);
    writeFileSync(task.recordPath(`results/build-plan/${revised.attempt_ref}`), revisedRaw);
    expect(() => bound.acceptAttempt("build-plan", revised.attempt_ref, confirmation(bound, "build-plan", planAttempt.attempt_ref))).toThrow(/confirmation/i);
    const freshConfirmation = confirmation(bound, "build-plan", revised.attempt_ref);
    const conflictingRef = `refs/workflowhub/checkpoints/Demo/task-one/build-plan/plan-${checkpoint.plan_hash}`;
    execFileSync("git", ["update-ref", conflictingRef, "HEAD"], { cwd: workspace.worktreeRoot });
    expect(() => bound.acceptAttempt("build-plan", revised.attempt_ref, freshConfirmation)).toThrow(/checkpoint ref conflicts/i);
    execFileSync("git", ["update-ref", "-d", conflictingRef], { cwd: workspace.worktreeRoot });
    const accepted = bound.acceptAttempt("build-plan", revised.attempt_ref, freshConfirmation);
    expect(bound.acceptAttempt("build-plan", revised.attempt_ref, freshConfirmation)).toEqual(accepted);
    expect(accepted.baseline_rebind_provenance.authorization_ref).toBe(authorization.ref);
    expect(accepted.checkpoint.ref).toContain(checkpoint.plan_hash);
    expect(["spec.md", "plan.md", "tasks.md"].map((name) => artifacts.read(name))).toEqual(bytes);
    const sameTreeNewPriorAuthorization = bound.authorizeBuildPlanBaselineRebind();
    const sameTreeNewPriorCheckpoint = bound.createCheckpoint("build-plan", { baselineRebindRef: sameTreeNewPriorAuthorization.ref });
    expect(sameTreeNewPriorAuthorization.ref).not.toBe(authorization.ref);
    expect(sameTreeNewPriorCheckpoint.parent_commit).toBe(checkpoint.parent_commit);
    expect(sameTreeNewPriorCheckpoint.plan_hash).not.toBe(checkpoint.plan_hash);

    writeFileSync(join(workspace.worktreeRoot, "README.md"), "integrated again\n");
    execFileSync("git", ["add", "README.md"], { cwd: workspace.worktreeRoot });
    execFileSync("git", ["commit", "-qm", "second integration"], { cwd: workspace.worktreeRoot });
    const secondAuthorization = bound.authorizeBuildPlanBaselineRebind();
    const secondCheckpoint = bound.createCheckpoint("build-plan", { baselineRebindRef: secondAuthorization.ref });
    expect(secondCheckpoint.plan_hash).not.toBe(checkpoint.plan_hash);
    const secondAttempt = bound.publishAttempt("build-plan", {
      facts: { plan_ref: artifacts.reference("plan.md"), tasks_ref: artifacts.reference("tasks.md"), checkpoint: secondCheckpoint },
      upstream_refs: [{ task_id: "task-one", stage: "build-spec", accepted_ref: "results/build-spec/accepted.json" }],
      baseline_rebind_ref: secondAuthorization.ref,
    });
    const secondAccepted = bound.acceptAttempt("build-plan", secondAttempt.attempt_ref, confirmation(bound, "build-plan", secondAttempt.attempt_ref));
    expect(secondAccepted.checkpoint.ref).not.toBe(accepted.checkpoint.ref);

    writeFileSync(join(workspace.worktreeRoot, "README.md"), "third integration\n");
    execFileSync("git", ["add", "README.md"], { cwd: workspace.worktreeRoot });
    execFileSync("git", ["commit", "-qm", "third integration"], { cwd: workspace.worktreeRoot });
    const raceAuthorization = bound.authorizeBuildPlanBaselineRebind();
    const raceCheckpoint = bound.createCheckpoint("build-plan", { baselineRebindRef: raceAuthorization.ref });
    const raceAttempt = bound.publishAttempt("build-plan", {
      facts: { plan_ref: artifacts.reference("plan.md"), tasks_ref: artifacts.reference("tasks.md"), checkpoint: raceCheckpoint },
      upstream_refs: [{ task_id: "task-one", stage: "build-spec", accepted_ref: "results/build-spec/accepted.json" }],
      baseline_rebind_ref: raceAuthorization.ref,
    });
    const raceConfirmation = confirmation(bound, "build-plan", raceAttempt.attempt_ref);
    const concurrentRaw = "concurrent accepted writer\n";
    const racing = createAuditedTestKernel(task, { workspace, artifacts, acceptedReplacementTestHooks: {
      afterRevalidateBeforeRename() { writeFileSync(task.recordPath("results/build-plan/accepted.json"), concurrentRaw); },
    } });
    expect(() => racing.acceptAttempt("build-plan", raceAttempt.attempt_ref, raceConfirmation)).toThrow(/compare-and-swap|changed/i);
    expect(task.readRecord("results/build-plan/accepted.json")).toBe(concurrentRaw);
  });

  it("rejects build-plan baseline rebind when design bytes or unrelated workspace paths drift", () => {
    const { kernel } = fixture();
    expect(() => kernel.authorizeBuildPlanBaselineRebind()).toThrow(/accepted|Workspace|capabilit/i);
  });

  it("accepts a checkpoint when the controlled artifact already matches its parent", () => {
    const { repo, task } = fixture({}, { deferCandidate: true });
    const artifactRoot = join(repo, "specs", "task-one");
    mkdirSync(artifactRoot, { recursive: true });
    writeFileSync(join(artifactRoot, "spec.md"), "# Existing Spec\n");
    execFileSync("git", ["add", "specs/task-one/spec.md"], { cwd: repo });
    execFileSync("git", ["commit", "-qm", "existing spec"], { cwd: repo });

    const candidate = prepareTaskWorkspace(task);
    const kernel = createAuditedTestKernel(task, { candidateWorkspace: candidate });
    const decision = kernel.publishAttempt("make-decision", {
      facts: { worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit },
    });
    kernel.acceptAttempt("make-decision", decision.attempt_ref, confirmation(kernel, "make-decision", decision.attempt_ref));
    const workspace = openAcceptedWorkspace(task, kernel.readAccepted("make-decision"));
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
    const boundKernel = createAuditedTestKernel(task, { workspace, artifacts });
    const checkpoint = boundKernel.createCheckpoint("build-spec");
    const upstream_refs = [{ task_id: "task-one", stage: "make-decision", accepted_ref: "results/make-decision/accepted.json" }];
    const attempt = boundKernel.publishAttempt("build-spec", {
      facts: { spec_ref: "specs/task-one/spec.md", checkpoint },
      upstream_refs,
    });

    const accepted = boundKernel.acceptAttempt("build-spec", attempt.attempt_ref);
    expect(accepted).toMatchObject({ acceptance_mode: "automatic" });
    expect(accepted.checkpoint.artifacts).toEqual([
      expect.objectContaining({ path: "specs/task-one/spec.md" }),
    ]);
    expect(() => verifyGitCheckpoint({
      repoRoot: workspace.worktreeRoot,
      checkpoint: accepted.checkpoint,
      projectName: "Demo",
      taskId: "task-one",
      stage: "build-spec",
      artifacts,
    })).not.toThrow();
  });

  it.each(["tracked", "untracked"])("rejects a no-diff checkpoint when the Workspace also contains an unexpected %s path", (kind) => {
    const { repo, task } = fixture({}, { deferCandidate: true });
    const artifactRoot = join(repo, "specs", "task-one");
    mkdirSync(artifactRoot, { recursive: true });
    writeFileSync(join(artifactRoot, "spec.md"), "# Existing Spec\n");
    execFileSync("git", ["add", "specs/task-one/spec.md"], { cwd: repo });
    execFileSync("git", ["commit", "-qm", "existing spec"], { cwd: repo });
    const candidate = prepareTaskWorkspace(task);
    const kernel = createAuditedTestKernel(task, { candidateWorkspace: candidate });
    const decision = kernel.publishAttempt("make-decision", { facts: { worktree_root: candidate.worktreeRoot, baseline_commit: candidate.baselineCommit } });
    kernel.acceptAttempt("make-decision", decision.attempt_ref, confirmation(kernel, "make-decision", decision.attempt_ref));
    const workspace = openAcceptedWorkspace(task, kernel.readAccepted("make-decision"));
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
    const boundKernel = createAuditedTestKernel(task, { workspace, artifacts });
    const checkpoint = boundKernel.createCheckpoint("build-spec");
    const unexpected = kind === "tracked" ? "README.md" : "unexpected.txt";
    writeFileSync(join(workspace.worktreeRoot, unexpected), "must not enter the checkpoint\n");
    const upstream_refs = [{ task_id: "task-one", stage: "make-decision", accepted_ref: "results/make-decision/accepted.json" }];

    expect(() => boundKernel.publishAttempt("build-spec", {
      facts: { spec_ref: "specs/task-one/spec.md", checkpoint }, upstream_refs,
    })).toThrow(/unexpected|changed path|checkpoint/i);
    expect(String(execFileSync("git", ["for-each-ref", "--format=%(refname)", "refs/workflowhub/checkpoints/"], { cwd: repo }))).toBe("");
  });

  it("derives checkpoint trees from authenticated upstream facts and rejects upstream drift", () => {
    const { task, kernel } = fixture();
    const candidate = prepareTaskWorkspace(task);
    writeFileSync(join(candidate.worktreeRoot, "decision-context.txt"), "accepted context\n");
    const decision = kernel.publishAttempt("make-decision", { facts: {
      worktree_root: candidate.worktreeRoot,
      baseline_commit: candidate.baselineCommit,
      snapshot_tree: candidate.captureSnapshot().tree,
    } });
    kernel.acceptAttempt("make-decision", decision.attempt_ref, confirmation(kernel, "make-decision", decision.attempt_ref));
    const workspace = openAcceptedWorkspace(task, kernel.readAccepted("make-decision"));
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
    const boundKernel = createAuditedTestKernel(task, { workspace, artifacts });
    artifacts.writeAtomic("spec.md", "# Spec\n");
    const specAttempt = boundKernel.publishAttempt("build-spec", {
      facts: { spec_ref: artifacts.reference("spec.md"), checkpoint: boundKernel.createCheckpoint("build-spec") },
      upstream_refs: [{ task_id: "task-one", stage: "make-decision", accepted_ref: "results/make-decision/accepted.json" }],
    });
    const acceptedSpec = boundKernel.acceptAttempt("build-spec", specAttempt.attempt_ref);
    expect(String(execFileSync("git", ["show", `${acceptedSpec.checkpoint.commit_oid}:decision-context.txt`], { cwd: workspace.worktreeRoot }))).toBe("accepted context\n");

    writeFileSync(join(workspace.worktreeRoot, "decision-context.txt"), "drifted context\n");
    artifacts.writeAtomic("plan.md", "# Plan\n");
    artifacts.writeAtomic("tasks.md", "# Tasks\n");
    expect(() => boundKernel.publishAttempt("build-plan", {
      facts: { plan_ref: artifacts.reference("plan.md"), tasks_ref: artifacts.reference("tasks.md"), checkpoint: boundKernel.createCheckpoint("build-plan") },
      upstream_refs: [{ task_id: "task-one", stage: "build-spec", accepted_ref: "results/build-spec/accepted.json" }],
    })).toThrow(/upstream|checkpoint|changed|drift/i);
  });

  it("reads legacy automatic-stage accepted records that have a human ref and no acceptance mode", () => {
    const { kernel } = fixture();
    const decision = kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "a".repeat(40), decision: "go" } });
    const accepted = kernel.acceptAttempt("make-decision", decision.attempt_ref, confirmation(kernel, "make-decision", decision.attempt_ref));
    const legacy = { ...accepted, stage: "build-code", human_confirmation_ref: "confirmations/build-code/attempt-0001.json" };
    delete legacy.acceptance_mode;
    expect(() => validateAccepted(legacy, { taskId: "task-one", stage: "build-code" })).not.toThrow();
  });

  it("resolves only declared upstream slots and keeps source read-only", () => {
    const source = fixture();
    const published = source.kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "a".repeat(40), decision: "go" } });
    source.kernel.acceptAttempt("make-decision", published.attempt_ref, confirmation(source.kernel, "make-decision", published.attempt_ref));
    const consumer = fixture({ decision: `${source.task.taskPath}/results/make-decision/accepted.json` });
    expect(consumer.kernel.readInput("decision").facts.decision).toBe("go");
    expect(() => consumer.kernel.readInput("unknown")).toThrow(/slot|input/i);
    expect(() => consumer.kernel.publishInput("decision", {})).toThrow(/read-only|unsupported/i);
  });

  it("linearizes publish and accept across processes", async () => {
    const { task, kernel } = fixture();
    const initial = kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "a".repeat(40) } });
    const confirmationRef = confirmation(kernel, "make-decision", initial.attempt_ref);
    const initialFacts = JSON.parse(task.readRecord(`results/make-decision/${initial.attempt_ref}`)).facts;
    const handleModule = pathToFileURL(join(process.cwd(), "core/task-handle.mjs")).href;
    const kernelModule = pathToFileURL(join(process.cwd(), "core/task-kernel.mjs")).href;
    const workspaceModule = pathToFileURL(join(process.cwd(), "core/workspace.mjs")).href;
    const worker = async (operation) => execFileAsync(process.execPath, ["--input-type=module", "-e", `
      import { openTask } from ${JSON.stringify(handleModule)};
      import { createTaskKernel } from ${JSON.stringify(kernelModule)};
      import { prepareTaskWorkspace } from ${JSON.stringify(workspaceModule)};
      const task = openTask(${JSON.stringify(task.taskPath)}, { projectName: "Demo", taskId: "task-one" });
      try {
        if (${JSON.stringify(operation)} === "accept") {
          createTaskKernel(task).acceptAttempt("make-decision", ${JSON.stringify(initial.attempt_ref)}, ${JSON.stringify(confirmationRef)});
        } else {
          const candidate = prepareTaskWorkspace(task);
          createTaskKernel(task, { candidateWorkspace: candidate }).publishAttempt("make-decision", {
            facts: ${JSON.stringify(initialFacts)}
          });
        }
        process.stdout.write("ok");
      } catch (error) {
        process.stdout.write("blocked:" + error.message);
      }
    `]);
    const [accept, publish] = await Promise.all([worker("accept"), worker("publish")]);
    expect(accept.stdout).toBe("ok");
    expect(publish.stdout === "ok" || /accepted|closed/i.test(publish.stdout)).toBe(true);
    expect(() => kernel.publishAttempt("make-decision", { facts: { worktree_root: "/repo", baseline_commit: "c".repeat(40) } }))
      .toThrow(/accepted|closed/i);
  });

  it("invalidates only the active stage run and falls back without reusing its physical sequence", () => {
    const { kernel } = fixture();
    const first = kernel.startStageRun("make-decision", { reason: "first" });
    const second = kernel.startStageRun("make-decision", { reason: "second" });
    expect(kernel.deriveStageWorkflowRunId("make-decision")).toBe(second.run.workflow_run_id);
    expect(() => kernel.invalidateStageRun("make-decision", {
      run_ref: first.ref, run_hash: first.hash, reason: "stale",
    })).toThrow(/CAS failed/);
    const invalidation = kernel.invalidateStageRun("make-decision", {
      run_ref: second.ref, run_hash: second.hash, reason: "bad replay binding",
    });
    expect(invalidation.record.run_ref).toBe(second.ref);
    expect(kernel.activeStageRun("make-decision").ref).toBe(first.ref);
    expect(kernel.deriveReviewFlowIdentity({
      stage: "make-decision", review_track: "direction", subject_kind: "worktree",
      review_scope: "worktree",
    }).workflow_run_id).toBe(first.run.workflow_run_id);
    expect(() => kernel.invalidateStageRun("make-decision", {
      run_ref: second.ref, run_hash: second.hash, reason: "again",
    })).toThrow(/CAS failed/);
    const third = kernel.startStageRun("make-decision", { reason: "third" });
    expect(third.ref).toMatch(/run-0003\.json$/);
    expect(third.run.previous_run_ref).toBe(second.ref);
  });

  it("records a legacy review binding invalidation without changing the result", () => {
    const { task, candidate, kernel } = fixture();
    const active = kernel.startStageRun("make-decision", { reason: "replay" });
    const snapshot = candidate.captureSnapshot();
    const resultRef = `reviews/results/legacy-${snapshot.tree}.json`;
    const result = {
      version: "canonical-review-result.v1", task_id: task.identity.taskId,
      stage: "make-decision", review_track: "direction", snapshot_tree: snapshot.tree,
    };
    const resultRaw = `${JSON.stringify(result, null, 2)}\n`;
    kernel.publishCanonicalRecord(resultRef, resultRaw);
    const resultHash = createHash("sha256").update(resultRaw).digest("hex");
    const eventRef = `reviews/flows/${"a".repeat(64)}/event-0001.json`;
    const eventPath = join(task.taskPath, ...eventRef.split("/"));
    mkdirSync(dirname(eventPath), { recursive: true });
    writeFileSync(eventPath, `${JSON.stringify({
      identity: {
        task_id: task.identity.taskId, stage: "make-decision", review_track: "direction",
        workflow_run_id: "task-created:2026-07-16T00:00:00.000Z",
      },
      head_result_ref: resultRef, result_sha256: resultHash,
    }, null, 2)}\n`);
    const invalidation = kernel.invalidateReviewBinding("make-decision", {
      result_ref: resultRef, flow_event_ref: eventRef,
      reason: "legacy-task-created-not-active-stage-run",
    });
    expect(invalidation.record.status).toBe("binding_invalid");
    expect(invalidation.record.active_workflow_run_id).toBe(active.run.workflow_run_id);
    expect(task.readRecord(resultRef)).toBe(resultRaw);
    expect(() => kernel.invalidateReviewBinding("make-decision", {
      result_ref: resultRef, flow_event_ref: eventRef, reason: "wrong",
    })).toThrow(/reason is invalid/);
  });
});
