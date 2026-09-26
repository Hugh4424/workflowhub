import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createTask, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { prepareTaskWorkspace } from "../../runtime/task/workspace.mjs";
import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { recordDshCodeReviewResult, recordSimpleReviewResult } from "../../runtime/review/review-record-route.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

function makeTask() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "dsh-code-review-publication-")));
  roots.push(root);
  const repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "WorkflowHub DSH review test"]);
  git(["config", "user.email", "dsh-review@workflowhub.local"]);
  writeFileSync(join(repo, "README.md"), "review subject\n", "utf8");
  git(["add", "."]);
  git(["commit", "-qm", "fixture"]);
  const taskId = randomUUID();
  const task = createTask({
    storageRoot: root,
    taskPath: join(root, "Projects", "workflowhub", "tasks", taskId),
    manifest: {
      schema_version: "1.0.0", project_name: "workflowhub", task_id: taskId,
      created_at: "2026-09-24T00:00:00.000Z", target_repo_root: repo,
      issue_ids: [], inputs: {}, record_model: "vnext-single-write",
    },
  });
  const candidateWorkspace = prepareTaskWorkspace(task);
  const artifacts = ArtifactDir.open(candidateWorkspace.worktreeRoot, task);
  const kernel = createTaskKernel(task, { candidateWorkspace, artifacts });
  return { task, kernel, candidateWorkspace };
}

describe("DSH code-review canonical publication", () => {
  it("persists zero findings as a current canonical verify-code review", () => {
    const { task, kernel } = makeTask();
    const identity = kernel.currentVNextContext();

    const refs = recordDshCodeReviewResult({ task, kernel, result: { findings: [] } });

    expect(refs).toMatchObject({
      attempt_ref: expect.stringMatching(/^quality\/reviews\/attempts\/.+\/attempt\.json$/),
      result_ref: expect.stringMatching(/^quality\/reviews\/results\/verify-code-simple-.+\.json$/),
      report_ref: expect.stringMatching(/^quality\/reviews\/reports\/.+\.md$/),
    });
    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    const result = JSON.parse(task.readRecord(refs.result_ref));
    expect(attempt).toMatchObject({
      stage: "verify-code", snapshot_tree: identity.snapshot.tree,
      material_revision: identity.materialRevision, terminal_status: "semantic",
    });
    expect(result).toMatchObject({
      stage: "verify-code", snapshot_tree: identity.snapshot.tree,
      material_revision: identity.materialRevision, findings: [],
    });
    const materialBinding = JSON.stringify({
      findings: [], material_revision: identity.materialRevision,
      snapshot_tree: identity.snapshot.tree, task_id: task.identity.taskId,
    });
    expect(result.material_id).toBe(createHash("sha256").update(materialBinding).digest("hex"));
    expect(attempt.provider_attempts[0].identity.model).toBe("unknown");
    expect(attempt.review_policy.effective_profiles[0].model).toBeNull();
    expect(task.readRecord(refs.report_ref)).toContain('"coverage": "satisfied"');
  });

  it("persists a serious DSH finding with its evidence and canonical anchor", () => {
    const { task, kernel } = makeTask();
    const finding = {
      severity: "major",
      path: "README.md",
      line: 1,
      issue: "The reviewed behavior contradicts the current implementation.",
      recommendation: "Make the implementation follow the documented behavior.",
      root_cause: "The implementation branch omits the documented condition.",
      evidence_kind: "direct",
      evidence: "review subject",
    };

    const refs = recordDshCodeReviewResult({ task, kernel, result: { findings: [finding] } });

    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    const providerOutput = JSON.parse(task.readRecord(attempt.provider_attempts[0].output_ref));
    const canonicalResult = JSON.parse(task.readRecord(refs.result_ref));
    expect(providerOutput.evidence_anchor_valid).toEqual([true]);
    expect(JSON.parse(providerOutput.content).findings[0]).toMatchObject({
      path: finding.path, line: finding.line, root_cause: finding.root_cause,
      evidence_kind: finding.evidence_kind, evidence: finding.evidence,
    });
    expect(canonicalResult.findings[0].provider_findings).toEqual([
      expect.objectContaining({ provider: "dsh-code-review", evidence_anchor_valid: true }),
    ]);
  });

  it("persists a minor finding without a source-line anchor", () => {
    const { task, kernel } = makeTask();
    const finding = {
      severity: "minor",
      path: "README.md",
      issue: "A minor wording improvement is available.",
      recommendation: "Use a shorter sentence.",
    };

    const refs = recordDshCodeReviewResult({ task, kernel, result: { findings: [finding] } });

    const attempt = JSON.parse(task.readRecord(refs.attempt_ref));
    const providerOutput = JSON.parse(task.readRecord(attempt.provider_attempts[0].output_ref));
    const canonicalResult = JSON.parse(task.readRecord(refs.result_ref));
    expect(providerOutput.evidence_anchor_valid).toEqual([false]);
    expect(JSON.parse(providerOutput.content).findings[0]).toMatchObject(finding);
    expect(canonicalResult.findings[0]).toMatchObject({
      severity: "minor",
      disposition: "nonblocking_minor",
      provider_findings: [expect.objectContaining({ provider: "dsh-code-review", evidence_anchor_valid: false })],
    });
  });

  it("rejects publishing a review against a snapshot different from the one it checked", () => {
    const { task, kernel, candidateWorkspace } = makeTask();
    const context = kernel.currentVNextContext();
    const snapshot = context.snapshot;
    const expectedIdentity = {
      tree: snapshot.tree,
      source: {
        target_commit: snapshot.head,
        base_commit: snapshot.commit,
        base_tree: snapshot.tree,
        captured_head: snapshot.head,
      },
      materialRevision: context.materialRevision,
    };
    const materialId = createHash("sha256").update(JSON.stringify({
      findings: [],
      material_revision: context.materialRevision,
      snapshot_tree: snapshot.tree,
      task_id: task.identity.taskId,
    })).digest("hex");
    const result = {
      status: "available",
      stage: "verify-code",
      review_track: null,
      review_kind: null,
      material_id: materialId,
      outcome: "completed",
      minimum_heterologous: 1,
      provider_results: [{
        provider: "dsh-code-review",
        status: "completed",
        identity: { provider: "dsh-code-review", adapter: "dsh", source_id: "dsh-code-review", config_id: "dsh-code-review/v1", model: null },
        error: null,
        timing: { started_at_ms: null, completed_at_ms: null, duration_ms: null },
        usage: null,
        evidence_anchor_valid: [],
      }],
      findings: [],
    };
    writeFileSync(join(candidateWorkspace.worktreeRoot, "README.md"), "changed after finding validation\n", "utf8");

    expect(() => recordSimpleReviewResult({ task, kernel, result, expectedIdentity }))
      .toThrow(/reviewed source changed/i);
    expect(task.listCanonicalReviewAttemptRefs()).toEqual([]);
    expect(task.listCanonicalReviewResultRefs()).toEqual([]);
  });

  it("rejects evidence that does not occur on an otherwise valid candidate source line", () => {
    const { task, kernel } = makeTask();
    const finding = {
      severity: "major", path: "README.md", line: 1,
      issue: "serious finding", recommendation: "repair it",
      root_cause: "the required branch is absent", evidence_kind: "direct",
      evidence: "fabricated text that is not present in the source file",
    };

    let error;
    try {
      recordDshCodeReviewResult({ task, kernel, result: { findings: [finding] } });
    } catch (caught) {
      error = caught;
    }

    expect(error).toMatchObject({ code: "OUTPUT_INVALID" });
    expect(task.listCanonicalReviewAttemptRefs()).toEqual([]);
    expect(task.listCanonicalReviewResultRefs()).toEqual([]);
  });

  it.each([
    ["missing root cause", { root_cause: undefined }],
    ["missing evidence kind", { evidence_kind: undefined }],
    ["missing evidence text", { evidence: "" }],
    ["invalid evidence kind", { evidence_kind: "unverified" }],
    ["missing source line", { line: undefined }],
  ])("rejects a serious finding with %s without publishing records", (_label, override) => {
    const { task, kernel } = makeTask();
    const finding = {
      severity: "major", path: "README.md", line: 1,
      issue: "serious finding", recommendation: "repair it",
      root_cause: "the required branch is absent", evidence_kind: "direct",
      evidence: "README.md line 1 is the source anchor", ...override,
    };

    expect(() => recordDshCodeReviewResult({ task, kernel, result: { findings: [finding] } }))
      .toThrow(/OUTPUT_INVALID/);
    expect(task.listCanonicalReviewAttemptRefs()).toEqual([]);
    expect(task.listCanonicalReviewResultRefs()).toEqual([]);
  });

  it("rejects paths that escape the repository root", () => {
    const { task, kernel } = makeTask();
    const finding = {
      severity: "major", path: "../README.md", line: 1,
      issue: "serious finding", recommendation: "repair it",
      root_cause: "the required branch is absent", evidence_kind: "direct",
      evidence: "the referenced source line shows the problem",
    };

    expect(() => recordDshCodeReviewResult({ task, kernel, result: { findings: [finding] } }))
      .toThrow(/concrete repository-relative path/);
    expect(task.listCanonicalReviewAttemptRefs()).toEqual([]);
    expect(task.listCanonicalReviewResultRefs()).toEqual([]);
  });

  it.each([
    ["nonexistent candidate file", "missing.md", 1],
    ["line beyond candidate file", "README.md", 2],
    ["zero source line", "README.md", 0],
    ["negative source line", "README.md", -1],
  ])("rejects an anchor for a %s without publishing a review", (_label, path, line) => {
    const { task, kernel } = makeTask();
    const finding = {
      severity: "major", path, line,
      issue: "serious finding", recommendation: "repair it",
      root_cause: "the required branch is absent", evidence_kind: "direct",
      evidence: "non-empty evidence cannot make an invalid anchor valid",
    };

    let error;
    try {
      recordDshCodeReviewResult({ task, kernel, result: { findings: [finding] } });
    } catch (caught) {
      error = caught;
    }

    expect(error).toMatchObject({ code: "OUTPUT_INVALID" });
    expect(task.listCanonicalReviewAttemptRefs()).toEqual([]);
    expect(task.listCanonicalReviewResultRefs()).toEqual([]);
  });

  it("rejects a candidate symlink that points outside the worktree", () => {
    const { task, kernel, candidateWorkspace } = makeTask();
    const outsidePath = join(candidateWorkspace.worktreeRoot, "..", "outside-anchor.md");
    writeFileSync(outsidePath, "outside source\n", "utf8");
    symlinkSync(outsidePath, join(candidateWorkspace.worktreeRoot, "outside.md"));
    const finding = {
      severity: "major", path: "outside.md", line: 1,
      issue: "serious finding", recommendation: "repair it",
      root_cause: "the required branch is absent", evidence_kind: "direct",
      evidence: "non-empty evidence cannot make a symlink anchor valid",
    };

    let error;
    try {
      recordDshCodeReviewResult({ task, kernel, result: { findings: [finding] } });
    } catch (caught) {
      error = caught;
    }

    expect(error).toMatchObject({ code: "OUTPUT_INVALID" });
    expect(task.listCanonicalReviewAttemptRefs()).toEqual([]);
    expect(task.listCanonicalReviewResultRefs()).toEqual([]);
  });

  it.each([
    ["unavailable output", { findings: [], status: "unavailable" }],
    ["error output", { findings: [], error: { code: "REVIEW_FAILED" } }],
    ["top-level identity override", { findings: [], snapshot_tree: "f".repeat(40) }],
  ])("rejects %s instead of recording a clean review", (_label, result) => {
    const { task, kernel } = makeTask();

    expect(() => recordDshCodeReviewResult({ task, kernel, result })).toThrow();
    expect(task.listCanonicalReviewAttemptRefs()).toEqual([]);
    expect(task.listCanonicalReviewResultRefs()).toEqual([]);
  });

  it("rejects identity overrides inside findings", () => {
    const { task, kernel } = makeTask();
    const finding = {
      severity: "major", path: "README.md", line: 1,
      issue: "serious finding", recommendation: "repair it",
      root_cause: "the required branch is absent", evidence_kind: "direct",
      evidence: "README.md line 1 is the source anchor", provider: "other-reviewer",
    };

    expect(() => recordDshCodeReviewResult({ task, kernel, result: { findings: [finding] } }))
      .toThrow(/cannot override provider/);
    expect(task.listCanonicalReviewAttemptRefs()).toEqual([]);
    expect(task.listCanonicalReviewResultRefs()).toEqual([]);
  });

  it("rejects undeclared non-identity finding fields instead of silently dropping them", () => {
    const { task, kernel } = makeTask();
    const finding = {
      severity: "major", path: "README.md", line: 1,
      issue: "serious finding", recommendation: "repair it",
      root_cause: "the required branch is absent", evidence_kind: "direct",
      evidence: "README.md line 1 is the source anchor", confidence: "high",
    };

    expect(() => recordDshCodeReviewResult({ task, kernel, result: { findings: [finding] } }))
      .toThrow(/undeclared finding key.*confidence/);
    expect(task.listCanonicalReviewAttemptRefs()).toEqual([]);
    expect(task.listCanonicalReviewResultRefs()).toEqual([]);
  });

  it("requires the TaskKernel authenticated for the supplied TaskHandle", () => {
    const { task } = makeTask();
    const other = makeTask();

    expect(() => recordDshCodeReviewResult({ task, kernel: other.kernel, result: { findings: [] } }))
      .toThrow(/authenticated TaskKernel for this task/);
    expect(task.listCanonicalReviewAttemptRefs()).toEqual([]);
    expect(task.listCanonicalReviewResultRefs()).toEqual([]);
  });
});
