import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { capturePhaseReviewSource, captureReviewSource } from "../review-source.mjs";
import { buildReviewMaterials, canonicalMaterialManifest, reviewInstructionsFor, validateDiffIndexBundle } from "../review-materials.mjs";
import { createTask, createTaskKernel } from "../../../../core/task-handle.mjs";
import { openAcceptedWorkspace } from "../../../../core/workspace.mjs";

function git(cwd, args, options = {}) {
  return execFileSync("git", args, { cwd, encoding: "utf8", ...options }).trim();
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-source-")));
  const target = join(root, "target");
  const source = join(root, "source");
  const data = join(root, "review-data");
  mkdirSync(target);
  git(target, ["init", "-b", "main"]);
  git(target, ["config", "user.email", "test@example.com"]);
  git(target, ["config", "user.name", "Test"]);
  writeFileSync(join(target, "keep.txt"), "base\n");
  writeFileSync(join(target, "delete.txt"), "delete\n");
  writeFileSync(join(target, "rename.txt"), "rename\n");
  writeFileSync(join(target, "context-change.txt"), `${Array.from({ length: 12 }, (_value, index) => `line-${index + 1}`).join("\n")}\n`);
  mkdirSync(join(target, "tests"));
  writeFileSync(join(target, "tests", "base.test.mjs"), `${Array.from({ length: 12 }, (_value, index) => `test-line-${index + 1}`).join("\n")}\n`);
  writeFileSync(join(target, ".gitignore"), "ignored.txt\n");
  git(target, ["add", "-A"]); git(target, ["commit", "-m", "base"]);
  git(target, ["worktree", "add", "-b", "feature", source]);
  mkdirSync(data);
  return { root, target, source, data };
}

function evidenceTask(f, receipt, output, { includeOutput = true } = {}) {
  const task = createTask({ storageRoot: f.root, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: `review-${Math.random().toString(16).slice(2)}`, created_at: new Date().toISOString(), target_repo_root: f.target, issue_ids: [], inputs: {} } });
  const kernel = createTaskKernel(task);
  kernel.publishCanonicalRecord("receipts/tests.json", receipt);
  if (includeOutput) kernel.publishCanonicalRecord("evidence/tests-output.txt", output);
  return task;
}

function verifyEvidenceFixture(f) {
  const output = Buffer.from("verify output\n");
  const outputHash = createHash("sha256").update(output).digest("hex");
  const snapshotTree = "a".repeat(40);
  const task = createTask({ storageRoot: f.root, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: `verify-${Math.random().toString(16).slice(2)}`, created_at: new Date().toISOString(), target_repo_root: f.target, issue_ids: [], inputs: {} } });
  const receipt = Buffer.from(`${JSON.stringify({ schema_version: "workflowhub-receipt.v1", task_id: task.identity.taskId, stage: "verify-code", snapshot_tree: snapshotTree, output_ref: "evidence/tests-output.txt", output_hash: outputHash })}\n`);
  const kernel = createTaskKernel(task);
  kernel.publishCanonicalRecord("receipts/tests.json", receipt);
  kernel.publishCanonicalRecord("evidence/tests-output.txt", output);
  const acceptance = Buffer.from(`${JSON.stringify({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: "AC-1", result: "pass", snapshot_tree: snapshotTree, refs: [{ ref: "evidence/tests-output.txt", sha256: outputHash }] })}\n`);
  const acceptanceHash = createHash("sha256").update(acceptance).digest("hex");
  const aggregate = Buffer.from(`${JSON.stringify({ schema_version: "workflowhub-receipt.v1", task_id: task.identity.taskId, stage: "verify-code", producer: { component: "evidence" }, refs: [{ ref: "evidence/acceptance-ac-1.json", sha256: acceptanceHash }] })}\n`);
  kernel.publishCanonicalRecord("evidence/acceptance-ac-1.json", acceptance);
  kernel.publishCanonicalRecord("evidence/verify-evidence.json", aggregate);
  return {
    task,
    acceptanceEvidence: {
      summary: "Fresh canonical tests: 1/1 passed.",
      test_receipt_ref: "receipts/tests.json",
      test_receipt_hash: createHash("sha256").update(receipt).digest("hex"),
      evidence_ref: "evidence/verify-evidence.json",
      evidence_hash: createHash("sha256").update(aggregate).digest("hex"),
    },
  };
}

function changeAll(source) {
  writeFileSync(join(source, "keep.txt"), "modified\n");
  writeFileSync(join(source, "added.txt"), "added\n");
  writeFileSync(join(source, "untracked.txt"), "untracked\n");
  writeFileSync(join(source, "ignored.txt"), "ignored\n");
  git(source, ["rm", "delete.txt"]);
  git(source, ["mv", "rename.txt", "renamed.txt"]);
  chmodSync(join(source, "keep.txt"), 0o755);
  symlinkSync("added.txt", join(source, "link.txt"));
}

function acceptedWorkspaceFixture() {
  const f = fixture();
  const taskId = "full-review";
  const worktree = join(f.root, `target-${taskId}`);
  const baselineCommit = git(f.target, ["rev-parse", "HEAD"]);
  git(f.target, ["worktree", "add", "-b", `task/Demo/${taskId}`, worktree]);
  const task = createTask({ storageRoot: f.root, manifest: {
    schema_version: "1.0.0", project_name: "Demo", task_id: taskId, created_at: new Date().toISOString(), target_repo_root: f.target, issue_ids: [], inputs: {}
  } });
  const workspace = openAcceptedWorkspace(task, { facts: { worktree_root: worktree, baseline_commit: baselineCommit } });
  return { ...f, task, workspace, worktree, baselineCommit };
}

describe("review source capture", () => {
  it("delivers a large Phase diff as indexed selected context while retaining the canonical full diff", () => {
    const f = fixture();
    mkdirSync(join(f.source, "tests"), { recursive: true });
    mkdirSync(join(f.source, "specs", "feature"), { recursive: true });
    writeFileSync(join(f.source, "runtime.mjs"), "export const value = 1;\n");
    writeFileSync(join(f.source, "specs", "feature", "spec.md"), "intro\nAC-1 relevant contract\n");
    const changedContext = Array.from({ length: 12 }, (_value, index) => index === 5 ? "changed-line-6" : `line-${index + 1}`);
    writeFileSync(join(f.source, "context-change.txt"), `${changedContext.join("\n")}\n`);
    writeFileSync(join(f.source, "tests", "large.test.mjs"), `${"// evidence-only test line\n".repeat(16000)}`);
    const changedTest = Array.from({ length: 12 }, (_value, index) => index === 5 ? "changed-test-line-6" : `test-line-${index + 1}`);
    writeFileSync(join(f.source, "tests", "base.test.mjs"), `${changedTest.join("\n")}\n`);
    const source = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    const contextChange = source.changedFiles.find(({ path }) => path === "context-change.txt");
    const contextChangeId = `C-${createHash("sha256").update(JSON.stringify([contextChange.path, contextChange.old_path, contextChange.status, contextChange.mode, contextChange.old_mode, contextChange.blob, contextChange.old_blob])).digest("hex").slice(0, 16)}`;
    const specChange = source.changedFiles.find(({ path }) => path === "specs/feature/spec.md");
    const specChangeId = `C-${createHash("sha256").update(JSON.stringify([specChange.path, specChange.old_path, specChange.status, specChange.mode, specChange.old_mode, specChange.blob, specChange.old_blob])).digest("hex").slice(0, 16)}`;
    const receipt = Buffer.from(`${JSON.stringify({ output_ref: "evidence/tests-output.txt", output_hash: "0".repeat(64) })}\n`);
    const task = evidenceTask(f, receipt, Buffer.from("tests pass\n"));
    const materials = {
        approved_spec: `intro\nAC-1 relevant contract\n\n${"unrelated full specification text ".repeat(10000)}`,
        acceptance_criteria: "AC-1",
        test_evidence: { receipt_ref: "receipts/tests.json", receipt_hash: createHash("sha256").update(receipt).digest("hex") },
        impact_map: { state: "complete", summary: "impact", entries: [{ id: "impact", subject: "consumer", rationale: "direct", disposition: "complete", change_ids: [contextChangeId], anchors: [{ id: "covered-anchor", path: "context-change.txt", start_line: 12, end_line: 12, role: "consumer", reason: "covered by selected shard", outside_diff_reason: "outside changed hunk" }] }] },
        reuse_map: { state: "complete", summary: "reuse", entries: [{ id: "reuse", subject: "config", rationale: "direct", disposition: "complete", change_ids: [contextChangeId], anchors: [{ id: "canonical-anchor", path: ".gitignore", start_line: 1, end_line: 1, role: "reuse", reason: "unchanged source" }] }] },
        acceptance_map: { state: "complete", summary: "AC", acceptance_ids: ["AC-1"], entries: [{ id: "AC-1", subject: "AC", rationale: "direct", disposition: "complete", change_ids: [specChangeId], implementation: "spec", verification: "spec", implementation_anchor_ids: ["spec-ac-1"], verification_anchor_ids: ["spec-ac-1"], anchors: [{ id: "spec-ac-1", path: "specs/feature/spec.md", start_line: 2, end_line: 2, role: "verification", reason: "accepted contract", outside_diff_reason: "spec contract anchor" }] }] },
        review_instructions: reviewInstructionsFor("build-code"),
    };
    const bundle = buildReviewMaterials({
      task, reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task",
      stage: "build-code", phaseId: "phase-large",
      materials,
    });
    expect(bundle.files).not.toContain("changes.diff");
    expect(bundle.files).toContain("diff-index.json");
    expect(bundle.packetPlan.delivery_mode).toBe("selected_context");
    expect(bundle.packetPlan.delivery_bytes).toBeLessThanOrEqual(330 * 1024);
    expect(readFileSync(join(bundle.bundleRoot, "packet-plan.json"), "utf8")).not.toContain("\n  \"");
    const compactSpec = JSON.parse(readFileSync(join(bundle.bundleRoot, "requirements/approved_spec.json"), "utf8"));
    expect(compactSpec).toMatchObject({ schema_version: "wh-review-spec-excerpts.v1", selected_ids: ["AC-1"] });
    expect(compactSpec.excerpts[0]).toMatchObject({ acceptance_id: "AC-1", start_line: 2, end_line: 2, text: "AC-1 relevant contract" });
    expect(readFileSync(join(f.data, compactSpec.full.ref), "utf8")).toContain("unrelated full specification");
    const index = JSON.parse(readFileSync(join(bundle.bundleRoot, "diff-index.json"), "utf8"));
    expect(readFileSync(join(bundle.bundleRoot, "diff-index.json"), "utf8")).not.toContain("\n  \"");
    const compactChangeMap = JSON.parse(readFileSync(join(bundle.bundleRoot, "change-map.json"), "utf8"));
    expect(compactChangeMap).toMatchObject({ schema_version: "wh-review-compact-change-map.v1", changes: expect.any(Array) });
    expect(compactChangeMap.changes).toHaveLength(index.coverage.change_ids_total);
    expect(compactChangeMap.changes[0]).not.toHaveProperty("hunks");
    expect(index.coverage.change_ids_indexed).toBe(index.coverage.change_ids_total);
    expect(index.anchors.find(({ anchor_id }) => anchor_id === "covered-anchor")).toMatchObject({
      shard_id: expect.stringMatching(/^S-/),
      source_lines: { old: { start_line: 12, end_line: 12 }, new: { start_line: 12, end_line: 12 } },
    });
    const canonicalAnchor = index.anchors.find(({ anchor_id }) => anchor_id === "canonical-anchor");
    expect(canonicalAnchor).toMatchObject({ source_sha256: expect.stringMatching(/^[a-f0-9]{64}$/), start_line: 1, end_line: 1 });
    expect(canonicalAnchor.source_ref.startsWith("canonical-review-materials/")).toBe(true);
    expect(canonicalAnchor).not.toHaveProperty("shard_id");
    expect(bundle.files).not.toContain("context/covered-anchor.txt");
    expect(index.changes.find(({ path }) => path === "runtime.mjs")?.shards[0].delivery).toBe("included");
    const contextShard = index.changes.find(({ path }) => path === "context-change.txt").shards[0];
    const semanticDiff = readFileSync(join(bundle.bundleRoot, "diff-shards", `${contextShard.shard_id}.diff`), "utf8");
    expect(semanticDiff).toContain("diff --git");
    expect(semanticDiff).toContain("@@");
    expect(semanticDiff).toContain("-line-6");
    expect(semanticDiff).toContain("+changed-line-6");
    expect(semanticDiff).not.toContain(" line-5");
    expect(index.changes.find(({ path }) => path === "tests/large.test.mjs")?.shards[0].delivery).toBe("summary_only");
    expect(readFileSync(join(f.data, index.full_diff.ref))).toHaveLength(index.full_diff.bytes);
    expect(bundle.manifest.some(({ path }) => path === "tests/large.test.mjs")).toBe(false);
    const selected = index.changes.flatMap(({ shards }) => shards).find(({ delivery }) => delivery === "included");
    writeFileSync(join(bundle.bundleRoot, "diff-shards", `${selected.shard_id}.diff`), "tampered\n");
    expect(() => validateDiffIndexBundle(bundle.bundleRoot)).toThrow(/missing or tampered/);
    const invalid = structuredClone(materials);
    invalid.acceptance_map.entries[0].anchors[0].end_line = 999999;
    expect(() => buildReviewMaterials({
      task, reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task",
      stage: "build-code", phaseId: "phase-large", materials: invalid,
    })).toThrow(/no valid spec verification excerpt/);
    const summaryAnchor = structuredClone(materials);
    summaryAnchor.reuse_map.entries[0].anchors[0] = {
      id: "summary-anchor", path: "tests/base.test.mjs", start_line: 12, end_line: 12,
      role: "reuse", reason: "summary-only changed test", outside_diff_reason: "outside changed hunk",
    };
    expect(() => buildReviewMaterials({
      task, reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task",
      stage: "build-code", phaseId: "phase-large", materials: summaryAnchor,
    })).toThrow(/changed-path anchor summary-anchor has no included shard/);
  });

  it("captures only the immutable phase commit range named by current phase evidence", () => {
    const f = fixture();
    writeFileSync(join(f.source, "upstream.txt"), "upstream\n");
    git(f.source, ["add", "upstream.txt"]); git(f.source, ["commit", "-m", "upstream"]);
    const baselineCommit = git(f.source, ["rev-parse", "HEAD"]);
    writeFileSync(join(f.source, "phase.txt"), "phase\n");
    git(f.source, ["add", "phase.txt"]); git(f.source, ["commit", "-m", "phase"]);
    writeFileSync(join(f.source, "phase-two.txt"), "phase two\n");
    git(f.source, ["add", "phase-two.txt"]); git(f.source, ["commit", "-m", "phase two"]);
    const implementationCommit = git(f.source, ["rev-parse", "HEAD"]);
    writeFileSync(join(f.source, "later.txt"), "later\n");
    git(f.source, ["add", "later.txt"]); git(f.source, ["commit", "-m", "later"]);
    const task = evidenceTask(f, Buffer.from("{}\n"), Buffer.from(""));
    task.writeRecordAtomic("phase-result.json", `${JSON.stringify({ phase_id: "phase-1", evidence: { diff: "evidence/phase-1-diff-scan.json" } })}\n`);
    createTaskKernel(task).publishCanonicalRecord("evidence/phase-1-diff-scan.json", Buffer.from(`${JSON.stringify({ schema_version: "phase-diff-scan.v1", phase_id: "phase-1", baseline_commit: baselineCommit, implementation_commit: implementationCommit, snapshot_tree: git(f.source, ["rev-parse", `${implementationCommit}^{tree}`]) })}\n`));

    const result = capturePhaseReviewSource({ sourceRoot: f.source, task, phaseId: "phase-1", reviewDataRoot: f.data });
    const diff = readFileSync(result.diffPath, "utf8");
    expect(diff).toContain("phase.txt");
    expect(diff).toContain("phase-two.txt");
    expect(diff).not.toContain("upstream.txt");
    expect(diff).not.toContain("later.txt");
    expect(result.baseTree).toBe(git(f.source, ["rev-parse", `${baselineCommit}^{tree}`]));
    expect(result.snapshotTree).toBe(git(f.source, ["rev-parse", `${implementationCommit}^{tree}`]));
    result.dispose();
    task.writeRecordAtomic("phase-result.json", `${JSON.stringify({
      phase_id: "phase-1",
      recovery_ref: "identity/recoveries/phase-pointer-0001.json",
      recovery_hash: "a".repeat(64),
      evidence: { diff: "evidence/phase-1-diff-scan.json" },
    })}\n`);
    expect(() => capturePhaseReviewSource({
      sourceRoot: f.source, task, phaseId: "phase-1", reviewDataRoot: f.data,
    })).toThrow(/canonical Phase evidence ref is required for recovery binding/);
  });

  it("rejects a phase id or evidence record that does not match", () => {
    const f = fixture(); const task = evidenceTask(f, Buffer.from("{}\n"), Buffer.from(""));
    task.writeRecordAtomic("phase-result.json", `${JSON.stringify({ phase_id: "phase-2", evidence: { diff: "scan.json" } })}\n`);
    expect(() => capturePhaseReviewSource({ sourceRoot: f.source, task, phaseId: "phase-1", reviewDataRoot: f.data })).toThrow(/PHASE_EVIDENCE_INVALID/);
  });

  it("captures the whole dirty tree twice against the current target HEAD", () => {
    const f = fixture(); changeAll(f.source);
    const result = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    expect(result.targetCommit).toBe(git(f.target, ["rev-parse", "HEAD"]));
    expect(result.baseCommit).toBe(result.targetCommit);
    expect(result.snapshotTree).toMatch(/^[a-f0-9]{40,64}$/);
    const diff = readFileSync(result.diffPath, "utf8");
    expect(diff).toContain("added.txt");
    expect(diff).toContain("deleted file mode");
    expect(diff).toContain("similarity index 100%");
    expect(result.changedFiles.map((item) => item.path)).toEqual(expect.arrayContaining(["added.txt", "keep.txt", "link.txt", "renamed.txt", "untracked.txt"]));
    expect(result.changedFiles.map((item) => item.path)).not.toContain("ignored.txt");
    expect(result.changedFiles.find((item) => item.path === "keep.txt").mode).toBe("100755");
    expect(result.changedFiles.find((item) => item.path === "link.txt").mode).toBe("120000");
    const expectedDiff = execFileSync("git", ["diff", "-M", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", result.baseTree, result.snapshotTree], { cwd: f.source });
    expect(readFileSync(result.diffPath)).toEqual(expectedDiff);
    expect(result.diffBytes).toBe(expectedDiff.length);
    expect(result.diffSha256).toBe(createHash("sha256").update(expectedDiff).digest("hex"));
    const copied = join(f.root, "keep-snapshot.txt");
    result.copySnapshotFile("keep.txt", copied);
    expect(readFileSync(copied, "utf8")).toBe("modified\n");
  });

  it("moves the base forward after main advances and the feature merges main", () => {
    const f = fixture();
    writeFileSync(join(f.target, "main.txt"), "main\n");
    git(f.target, ["add", "main.txt"]); git(f.target, ["commit", "-m", "main moves"]);
    git(f.source, ["merge", "main", "--no-edit"]);
    writeFileSync(join(f.source, "feature.txt"), "feature\n");
    const result = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    expect(result.baseCommit).toBe(git(f.target, ["rev-parse", "HEAD"]));
    const diff = readFileSync(result.diffPath, "utf8");
    expect(diff).toContain("feature.txt");
    expect(diff).not.toContain("main.txt");
  });

  it("uses the authenticated Workspace baseline after target main already contains task history", () => {
    const f = acceptedWorkspaceFixture();
    const paths = ["core/fact-indexes.mjs", "core/fact-collector.mjs", "scripts/collect-task-facts.mjs", "config/transcript-sources.mjs", "tests/m14b-fact-collection.test.mjs"];
    for (const path of paths) {
      mkdirSync(join(f.worktree, ...path.split("/").slice(0, -1)), { recursive: true });
      writeFileSync(join(f.worktree, path), `export const fixture = ${JSON.stringify(path)};\n`);
    }
    git(f.worktree, ["add", "-A"]); git(f.worktree, ["commit", "-m", "M14b implementation"]);
    git(f.target, ["merge", "--ff-only", `task/Demo/${f.task.identity.taskId}`]);

    const source = captureReviewSource({ workspace: f.workspace, reviewDataRoot: f.data });
    expect(source.baseCommit).toBe(f.baselineCommit);
    expect(source.targetCommit).toBe(git(f.target, ["rev-parse", "HEAD"]));
    expect(source.changedFiles.map(({ path }) => path)).toEqual(expect.arrayContaining(paths));
    const bundle = buildReviewMaterials({ reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-code",
      materials: { approved_spec: "spec", acceptance_criteria: "ac", test_evidence: "tests", review_instructions: reviewInstructionsFor("build-code") } });
    expect(bundle.files).toContain("changes.diff");
    expect(bundle.files.some((path) => path.startsWith("changed/"))).toBe(false);
  });

  it("rejects a missing or non-ancestor supplied baseline", () => {
    const f = fixture();
    expect(() => captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, baselineCommit: "0".repeat(40), reviewDataRoot: f.data })).toThrow(/SOURCE_UNAVAILABLE/);
    writeFileSync(join(f.target, "target-only.txt"), "target only\n");
    git(f.target, ["add", "-A"]); git(f.target, ["commit", "-m", "target only"]);
    expect(() => captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, baselineCommit: git(f.target, ["rev-parse", "HEAD"]), reviewDataRoot: f.data })).toThrow(/ancestor/);
  });

  it("rejects review data inside the source repository", () => {
    const f = fixture();
    expect(() => captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: join(f.source, "reviews") }))
      .toThrow(/REVIEW_DATA_ROOT_INSIDE_SOURCE/);
  });

  it("rejects review data inside the target repository", () => {
    const f = fixture();
    expect(() => captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: join(f.target, "reviews") }))
      .toThrow(/REVIEW_DATA_ROOT_INSIDE_TARGET/);
  });

  it("fails cleanly when the source changes between captures", () => {
    const f = fixture();
    expect(() => captureReviewSource({
      sourceRoot: f.source,
      targetRepoRoot: f.target,
      reviewDataRoot: f.data,
      betweenCaptures: () => writeFileSync(join(f.source, "late.txt"), "late\n")
    })).toThrow(/SOURCE_CHANGED_DURING_CAPTURE/);
  });

  it("captures final identity without creating an unused cumulative diff", () => {
    const f = fixture(); changeAll(f.source);
    const result = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data, includeDiff: false });
    expect(result).not.toHaveProperty("diffPath");
    expect(result.changedFiles).toEqual([]);
    expect(() => result.copyDiffTo(join(f.root, "forbidden.diff"))).toThrow(/no diff artifact/i);
  });
});

describe("review materials", () => {
  it("binds the provider-visible bundle path into frozen instructions", () => {
    expect(reviewInstructionsFor("make-decision", "direction")).toContain("bundle/review-instructions.md");
  });

  it("authenticates the canonical receipt but sends only its compact test summary", () => {
    const f = fixture(); changeAll(f.source);
    const source = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    const output = Buffer.from("real test output\n");
    const receipt = Buffer.from(`${JSON.stringify({ schema_version: "workflowhub-receipt.v1", output_ref: "evidence/tests-output.txt", output_hash: createHash("sha256").update(output).digest("hex") }, null, 2)}\n`);
    const task = evidenceTask(f, receipt, output);
    const evidence = { receipt_ref: "receipts/tests.json", receipt_hash: createHash("sha256").update(receipt).digest("hex") };
    const instructions = reviewInstructionsFor("build-code");
    const bundle = buildReviewMaterials({ task, reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-code",
      materials: { approved_spec: "spec", acceptance_criteria: "ac", test_evidence: evidence, review_instructions: instructions } });
    expect(bundle.files.some((path) => path.startsWith("canonical/"))).toBe(false);
    const graph = JSON.parse(readFileSync(join(bundle.bundleRoot, "canonical-evidence.json"), "utf8"));
    expect(graph).toEqual([]);
    expect(JSON.parse(readFileSync(join(bundle.bundleRoot, "evidence/test-summary.json"), "utf8"))).toMatchObject({ output_hash: createHash("sha256").update(output).digest("hex"), raw_output_included: false });
    const plan = JSON.parse(readFileSync(join(bundle.bundleRoot, "packet-plan.json"), "utf8"));
    expect(plan).toMatchObject({ schema_version: "wh-review-packet-plan.v1", stage: "build-code" });
    expect(plan.included.required).toEqual(expect.arrayContaining(["changes.diff", "requirements/test_evidence.json"]));
    expect(plan.included.evidence).toEqual(expect.arrayContaining(["evidence/test-summary.json", "canonical-evidence.json"]));
    expect(bundle.packetPlan.delivery_bytes).toBe(bundle.deliveryManifest.reduce((total, entry) => total + entry.bytes, 0));
  });

  it("reduces verify evidence to a per-AC summary without sending the evidence tree", () => {
    const f = fixture(); changeAll(f.source); const source = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    const { task, acceptanceEvidence } = verifyEvidenceFixture(f);
    const bundle = buildReviewMaterials({ task, reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "verify-code", materials: { acceptance_criteria: "AC-1", acceptance_evidence: acceptanceEvidence, open_exceptions: "none", review_instructions: reviewInstructionsFor("verify-code") } });
    expect(JSON.parse(readFileSync(join(bundle.bundleRoot, "canonical-evidence.json"), "utf8"))).toEqual([]);
    expect(bundle.files).toContain("requirements/ac_evidence_summary.json");
    expect(bundle.files).not.toContain("requirements/acceptance_evidence.json");
    expect(bundle.files.some((path) => path.startsWith("canonical/"))).toBe(false);
    const summary = JSON.parse(readFileSync(join(bundle.bundleRoot, "requirements/ac_evidence_summary.json"), "utf8"));
    expect(summary).toMatchObject({ schema_version: "ac-evidence-summary.v1", criteria: [expect.objectContaining({ acceptance_criterion_id: "AC-1", scenario: "unknown", oracle: "unknown" })] });
  });

  it("rejects prose or incomplete verify evidence before provider delivery", () => {
    const f = fixture(); changeAll(f.source); const source = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    const base = { acceptance_criteria: "ac", open_exceptions: "none", review_instructions: reviewInstructionsFor("verify-code") };
    expect(() => buildReviewMaterials({ reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "verify-code", materials: { ...base, acceptance_evidence: "receipts/tests.json and evidence/verify-evidence.json" } }))
      .toThrow(/MATERIAL_INCOMPLETE.*structured.*roots/i);
    expect(() => buildReviewMaterials({ reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "verify-code", materials: { ...base, acceptance_evidence: { test_receipt_ref: "receipts/tests.json", test_receipt_hash: "0".repeat(64) } } }))
      .toThrow(/MATERIAL_INCOMPLETE.*evidence_ref/i);
  });

  it("writes an empty canonical evidence manifest when a stage has no evidence refs", () => {
    const f = fixture(); const source = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    const bundle = buildReviewMaterials({ reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-spec",
      materials: { raw_requirement: "need", approved_decision: "yes", draft_spec: "spec", review_instructions: reviewInstructionsFor("build-spec") } });
    expect(JSON.parse(readFileSync(join(bundle.bundleRoot, "canonical-evidence.json"), "utf8"))).toEqual([]);
    expect(bundle.manifest.map(({ path }) => path)).toContain("canonical-evidence.json");
  });

  it.each([
    ["missing raw output is excluded", false, false],
    ["receipt hash mismatch", true, true],
  ])("validates selected evidence roots before delivery: %s", (_label, includeOutput, wrongHash) => {
    const f = fixture(); changeAll(f.source); const source = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    const output = Buffer.from("output\n"), receipt = Buffer.from(`${JSON.stringify({ output_ref: "evidence/out.txt", output_hash: createHash("sha256").update(output).digest("hex") })}\n`);
    const task = evidenceTask(f, receipt, output, { includeOutput });
    const evidence = { receipt_ref: "receipts/tests.json", receipt_hash: wrongHash ? "0".repeat(64) : createHash("sha256").update(receipt).digest("hex") };
    const build = () => buildReviewMaterials({ task, reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-code", materials: { approved_spec: "spec", acceptance_criteria: "ac", test_evidence: evidence, review_instructions: reviewInstructionsFor("build-code") } });
    if (wrongHash) expect(build).toThrow(/MATERIAL_INCOMPLETE|evidence|hash|output|ENOENT/i);
    else expect(build().files).not.toContain("canonical/evidence/out.txt");
  });

  it("keeps every manifest skill file present and exactly named in review instructions", () => {
    const f = fixture(); changeAll(f.source);
    const source = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    const instructions = reviewInstructionsFor("verify-code");
    const { task, acceptanceEvidence } = verifyEvidenceFixture(f);
    const bundle = buildReviewMaterials({ task, reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "verify-code",
      materials: { acceptance_criteria: "AC-1", acceptance_evidence: acceptanceEvidence, open_exceptions: "none", review_instructions: instructions } });
    const declared = bundle.manifest.map(({ path }) => path).filter((path) => path.startsWith("skills/"));
    const instructed = [...instructions.matchAll(/skills\/[A-Za-z0-9._-]+\/SKILL\.md/g)].map(([path]) => path);
    expect(declared.sort()).toEqual(instructed.sort());
    for (const path of declared) expect(readFileSync(join(bundle.bundleRoot, ...path.split("/")), "utf8").trim()).not.toBe("");
  });

  it("keeps direction blind and gives code stages the complete snapshot", () => {
    const f = fixture(); changeAll(f.source);
    const source = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    const direction = buildReviewMaterials({
      reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "make-decision", reviewTrack: "direction",
      materials: { raw_requirement: "need", objective_facts: "facts", review_instructions: reviewInstructionsFor("make-decision", "direction") }
    });
    expect(direction.files).not.toEqual(expect.arrayContaining(["changes.diff", "changed/added.txt"]));
    expect(direction.files).not.toContain("source.json");
    const directionPlan = JSON.parse(readFileSync(join(direction.bundleRoot, "packet-plan.json"), "utf8"));
    expect(directionPlan.excluded).toEqual(expect.arrayContaining([
      expect.objectContaining({ category: "source_bundle", reason: "stage_contract_does_not_require_a_diff" }),
      expect.objectContaining({ category: "material:proposed_solution", reason: "forbidden_by_stage_contract" }),
    ]));
    expect(direction.files).toEqual(expect.arrayContaining(["contracts/make-decision.md", "skills/plan-ceo-review/SKILL.md", "skills/review/SKILL.md"]));
    expect(() => buildReviewMaterials({
      reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "make-decision", reviewTrack: "direction",
      materials: { raw_requirement: "need", objective_facts: "facts", review_instructions: reviewInstructionsFor("make-decision", "direction"), invented_alias: "do this" }
    })).toThrow(/MATERIAL_FORBIDDEN.*invented_alias/);

    const code = buildReviewMaterials({
      reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-code", reviewTrack: null,
      materials: { approved_spec: "spec", acceptance_criteria: "ac", test_evidence: "tests pass", review_instructions: reviewInstructionsFor("build-code") }
    });
    expect(code.files).toEqual(expect.arrayContaining(["changes.diff", "contracts/build-code.md", "skills/simplicity-guard/SKILL.md"]));
    expect(code.files.some((path) => path.startsWith("changed/"))).toBe(false);
    expect(code.files).toContain("contracts/provider-protocol.md");
    const repeated = buildReviewMaterials({
      reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-code", reviewTrack: null,
      materials: { approved_spec: "spec", acceptance_criteria: "ac", test_evidence: "tests pass", review_instructions: reviewInstructionsFor("build-code") }
    });
    expect(repeated.materialId).toBe(code.materialId);
    const recoveryBound = buildReviewMaterials({
      reviewDataRoot: f.data, attachmentRoot: f.data,
      source: {
        ...source,
        phaseEvidenceBinding: {
          ref: `evidence/phases/phase-0/${source.snapshotTree}/phase-evidence-${"a".repeat(64)}.json`,
          sha256: "a".repeat(64),
          recovery_ref: "identity/recoveries/phase-pointer-0001.json",
          recovery_hash: "b".repeat(64),
        },
      },
      taskId: "task", stage: "build-code", reviewTrack: null,
      materials: { approved_spec: "spec", acceptance_criteria: "ac", test_evidence: "tests pass", review_instructions: reviewInstructionsFor("build-code") }
    });
    expect(recoveryBound.materialId).not.toBe(code.materialId);
    expect(JSON.parse(readFileSync(join(recoveryBound.bundleRoot, "source.json"), "utf8")).phase_evidence)
      .toMatchObject({ recovery_ref: "identity/recoveries/phase-pointer-0001.json", recovery_hash: "b".repeat(64) });
  });

  it("generates a deterministic canonical material id", () => {
    const entries = [
      { path: "b", bytes: 2, sha256: "b".repeat(64) },
      { path: "a", bytes: 1, sha256: "a".repeat(64) }
    ];
    expect(canonicalMaterialManifest(entries)).toBe(`[{"path":"a","bytes":1,"sha256":"${"a".repeat(64)}"},{"path":"b","bytes":2,"sha256":"${"b".repeat(64)}"}]`);
    expect(canonicalMaterialManifest(entries)).toBe(canonicalMaterialManifest([...entries].reverse()));
    const crossRepoFixture = [{ path: "review-instructions.md", bytes: 3, sha256: "7692c3ad3540bb803c020b3aee66cd8887123234ea0c6e7143c0add73ff431ed" }];
    expect(createHash("sha256").update(canonicalMaterialManifest(crossRepoFixture)).digest("hex"))
      .toBe("2459e73e3f3a754519fc84a9e9e616010c0e43e80d3e218a10316665d84922bf");
  });

  it("tracks packet bytes without a budget gate", () => {
    const f = fixture(); const source = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    const bundle = buildReviewMaterials({ reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-spec",
      materials: { raw_requirement: "x".repeat(128 * 1024), approved_decision: "yes", draft_spec: "spec", review_instructions: reviewInstructionsFor("build-spec") } });
    expect(bundle.packetPlan.delivery_bytes).toBeGreaterThan(128 * 1024);
    expect(bundle.packetPlan).not.toHaveProperty("budget_bytes");
  });

  it("seals the independent build-plan task draft as required material", () => {
    const f = fixture(); const source = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    const base = {
      approved_spec: "accepted spec", acceptance_criteria: "AC-1", draft_plan: "# Plan\n\nPhase 1", review_instructions: reviewInstructionsFor("build-plan")
    };
    expect(() => buildReviewMaterials({ reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-plan", materials: base }))
      .toThrow(/MATERIAL_INCOMPLETE.*draft_tasks/);
    const tasks = "# Tasks\n\n- [ ] T01 implement the plan\n";
    const bundle = buildReviewMaterials({
      reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-plan",
      materials: { ...base, draft_tasks: tasks }
    });
    const taskPath = "requirements/draft_tasks.md";
    const taskBytes = Buffer.from(tasks, "utf8");
    expect(readFileSync(join(bundle.bundleRoot, taskPath), "utf8")).toBe(tasks);
    expect(bundle.manifest.find(({ path }) => path === taskPath)).toEqual({
      path: taskPath, bytes: taskBytes.length, sha256: createHash("sha256").update(taskBytes).digest("hex")
    });
    expect(bundle.deliveryManifest.find(({ path }) => path === taskPath)).toEqual(bundle.manifest.find(({ path }) => path === taskPath));
    expect(bundle.packetPlan.included.required).toContain(taskPath);
    const changedTasks = buildReviewMaterials({
      reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-plan",
      materials: { ...base, draft_tasks: `${tasks}- [ ] T02 verify it\n` }
    });
    expect(changedTasks.materialId).not.toBe(bundle.materialId);
    expect(() => buildReviewMaterials({
      reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-spec",
      materials: { raw_requirement: "need", approved_decision: "decision", draft_spec: "spec", draft_tasks: tasks, review_instructions: reviewInstructionsFor("build-spec") }
    })).toThrow(/MATERIAL_FORBIDDEN.*draft_tasks/);
  });

  it("requires explicit complete-or-unknown maps for wh_review.v2 routes", () => {
    const f = fixture(); const source = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    const base = { raw_requirement: "need", approved_decision: "yes", draft_spec: "spec", review_instructions: reviewInstructionsFor("build-spec") };
    expect(() => buildReviewMaterials({ reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-spec", strictV2Maps: true, materials: base }))
      .toThrow(/wh_review\.v2 requires context_map/);
    const map = { state: "complete", summary: "one checked authority", entries: [{ id: "ctx-1", subject: "existing contract", rationale: "it defines the public boundary", disposition: "complete", anchors: [{ id: "ctx-1-source", path: "keep.txt", start_line: 1, end_line: 1, role: "existing_contract", reason: "direct boundary" }] }] };
    const bundle = buildReviewMaterials({ reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-spec", strictV2Maps: true,
      materials: { ...base, context_map: map, evidence_map: { state: "unknown", summary: "no runtime evidence exists", entries: [], unknown_reason: "implementation has not started" } } });
    expect(bundle.files).toEqual(expect.arrayContaining(["requirements/context_map.json", "requirements/evidence_map.json"]));
    expect(bundle.files).toContain("context/ctx-1-source.txt");
    expect(bundle.packetPlan.included.context).toContain("context/ctx-1-source.txt");
  });

  it("requires build-code acceptance maps to name and map every declared AC", () => {
    const f = fixture(); changeAll(f.source); const source = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    const changeIds = source.changedFiles.map((item) => `C-${createHash("sha256").update(JSON.stringify([item.path, item.old_path, item.status, item.mode, item.old_mode, item.blob, item.old_blob])).digest("hex").slice(0, 16)}`);
    const output = Buffer.from("tests pass\n"); const receipt = Buffer.from(`${JSON.stringify({ output_ref: "evidence/tests-output.txt", output_hash: createHash("sha256").update(output).digest("hex") })}\n`);
    const task = evidenceTask(f, receipt, output); const test_evidence = { receipt_ref: "receipts/tests.json", receipt_hash: createHash("sha256").update(receipt).digest("hex") };
    const base = {
      approved_spec: "spec", acceptance_criteria: "AC-1", test_evidence, review_instructions: reviewInstructionsFor("build-code"),
      phase_map: { state: "complete", summary: "phase", entries: [{ id: "phase", subject: "diff", rationale: "complete phase", disposition: "not_applicable", reason_code: "complete_diff_authority", reason: "changes.diff is the authority for changed lines", change_ids: changeIds }] },
      impact_map: { state: "complete", summary: "impact", entries: [{ id: "impact", subject: "consumer", rationale: "direct consumer", disposition: "complete", change_ids: changeIds, anchors: [{ id: "impact-source", path: ".gitignore", start_line: 1, end_line: 1, role: "consumer", reason: "direct consumer" }] }] },
      reuse_map: { state: "complete", summary: "reuse", entries: [{ id: "reuse", subject: "existing helper", rationale: "reviewed", disposition: "complete", change_ids: [changeIds[0]], anchors: [{ id: "reuse-source", path: ".gitignore", start_line: 1, end_line: 1, role: "reuse", reason: "checked helper" }] }] },
    };
    expect(() => buildReviewMaterials({ task, reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-code", strictV2Maps: true,
      materials: { ...base, acceptance_map: { state: "complete", summary: "generic", entries: [{ id: "AC-1", subject: "AC", rationale: "generic", disposition: "complete", anchors: [{ id: "generic-source", path: ".gitignore", start_line: 1, end_line: 1, role: "acceptance", reason: "generic AC context" }] }] } } }))
      .toThrow(/acceptance_map\.acceptance_ids/);
    const acceptance_map = { state: "complete", summary: "mapped", acceptance_ids: ["AC-1"], entries: [{ id: "AC-1", subject: "AC", rationale: "mapped", disposition: "complete", change_ids: [changeIds[0]], implementation: "changes.diff", verification: "test evidence", implementation_anchor_ids: ["impact-source"], verification_anchor_ids: ["reuse-source"], anchors: [{ id: "ac-source", path: ".gitignore", start_line: 1, end_line: 1, role: "acceptance", reason: "AC implementation" }] }] };
    const changedImpact = {
      ...base,
      impact_map: { ...base.impact_map, entries: [{ ...base.impact_map.entries[0], anchors: [{ id: "impact-source", path: "keep.txt", start_line: 1, end_line: 1, role: "consumer", reason: "direct consumer" }] }] }
    };
    expect(() => buildReviewMaterials({ task, reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-code", phaseId: "phase-1", strictV2Maps: true, materials: { ...changedImpact, acceptance_map } }))
      .toThrow(/changed file keep\.txt and requires outside_diff_reason/);
    const hunkRepeatingImpact = {
      ...changedImpact,
      impact_map: { ...changedImpact.impact_map, entries: [{ ...changedImpact.impact_map.entries[0], anchors: [{ ...changedImpact.impact_map.entries[0].anchors[0], outside_diff_reason: "need surrounding call site" }] }] }
    };
    expect(() => buildReviewMaterials({ task, reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-code", phaseId: "phase-1", strictV2Maps: true, materials: { ...hunkRepeatingImpact, acceptance_map } }))
      .toThrow(/overlaps a candidate hunk.*changes\.diff is the only authority/);
    const bundle = buildReviewMaterials({ task, reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-code", phaseId: "phase-1", strictV2Maps: true,
      materials: { ...base, acceptance_map } });
    expect(bundle.files).toContain("changes.diff");
    expect(bundle.packetPlan.delivery_mode).toBe("inline_complete");
    expect(bundle.files).toContain("requirements/acceptance_map.json");
    const changeMap = JSON.parse(readFileSync(join(bundle.bundleRoot, "change-map.json"), "utf8"));
    expect(changeMap).toMatchObject({ schema_version: "wh-review-change-map.v1", phase_id: "phase-1", base_tree: source.baseTree, candidate_tree: source.snapshotTree, changes: expect.arrayContaining([expect.objectContaining({ change_id: changeIds[0] })]) });
    expect(changeMap.changes.find(({ path }) => path === "keep.txt")?.hunks).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "unified", header: expect.stringMatching(/^@@/) }),
    ]));
    expect(bundle.packetPlan.included.metadata).toEqual(expect.arrayContaining(["packet-plan.json", "manifest.json"]));
    for (const path of bundle.files.filter((item) => item.startsWith("context/"))) {
      const [header] = readFileSync(join(bundle.bundleRoot, path), "utf8").split("\n", 1);
      expect(JSON.parse(header)).toMatchObject({ changed_file: false, outside_diff_reason: null });
    }
  });

  it("uses a diff-free integration profile with only final seam and coverage facts", () => {
    const f = fixture(); changeAll(f.source);
    const source = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    const output = Buffer.from("tests pass\n");
    const receipt = Buffer.from(`${JSON.stringify({ command: "npm run test:targeted", exit_code: 0, snapshot_tree: source.snapshotTree })}\n`);
    const task = evidenceTask(f, receipt, output);
    const testEvidence = { receipt_ref: "receipts/tests.json", receipt_hash: createHash("sha256").update(receipt).digest("hex") };
    const changedPath = source.changedFiles[0].path;
    const traceHash = "a".repeat(64), evidenceHash = "b".repeat(64), implementationHash = "c".repeat(64);
    const materials = {
      approved_spec: "spec", acceptance_criteria: "AC-1", test_evidence: testEvidence,
      phase_coverage: {
        schema_version: "phase-review-coverage.v1", checkpoint: { commit: source.baseCommit, tree: source.baseTree }, snapshot_tree: source.snapshotTree,
        phases: [{
          phase_id: "T01", base_tree: source.baseTree, snapshot_tree: source.snapshotTree,
          trace_ref: `evidence/phases/T01/${source.snapshotTree}/phase-map-trace-${traceHash}.json`, trace_sha256: traceHash,
          changed_files: [changedPath], green_test_receipt: { ref: testEvidence.receipt_ref, sha256: testEvidence.receipt_hash },
          canonical_phase_evidence: { ref: "evidence/phases/T01/evidence.json", sha256: evidenceHash },
          implementation_receipt: { ref: "receipts/implementation.json", sha256: implementationHash },
          review_result: { ref: "reviews/results/phase.json", sha256: "d".repeat(64) },
        }],
      },
      seam_index: { schema_version: "cross-phase-seam-index.v1", snapshot_tree: source.snapshotTree, entries: [] },
      ac_trace: {
        schema_version: "ac-change-test-trace.v1", snapshot_tree: source.snapshotTree, acceptance_ids: ["AC-1"],
        entries: [{ acceptance_criterion_id: "AC-1", change: [{ phase_id: "T01", path: changedPath }], test: [{ phase_id: "T01", receipt_ref: testEvidence.receipt_ref, receipt_hash: testEvidence.receipt_hash }], evidence: [{ phase_id: "T01", ref: "evidence/phases/T01/evidence.json", sha256: evidenceHash }], anchors: [{ id: "integration-ac", path: ".gitignore", start_line: 1, end_line: 1, role: "acceptance", reason: "final integration boundary" }] }],
      },
      review_instructions: reviewInstructionsFor("build-code", null, false, "initial", "integration"),
    };
    const bundle = buildReviewMaterials({ task, reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-code", reviewScope: "integration", strictV2Maps: true, materials });
    expect(bundle.files).not.toEqual(expect.arrayContaining(["changes.diff", "change-map.json", "changed-files.json", "source.json"]));
    expect(bundle.files).toEqual(expect.arrayContaining(["requirements/phase_coverage.json", "requirements/seam_index.json", "requirements/ac_trace.json", "evidence/test-summary.json", "context/integration-ac.txt"]));
    expect(bundle.packetPlan).toMatchObject({ review_scope: "integration" });
    expect(bundle.packetPlan.excluded).toEqual(expect.arrayContaining([
      expect.objectContaining({ category: "material:changes_diff" }),
      expect.objectContaining({ category: "source_bundle" }),
    ]));
    expect(() => buildReviewMaterials({ task, reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-code", reviewScope: "integration", materials: { ...materials, changes_diff: "all historical changes" } }))
      .toThrow(/MATERIAL_FORBIDDEN.*changes_diff/);
    for (const key of ["change", "test", "evidence"]) {
      const incomplete = structuredClone(materials);
      incomplete.ac_trace.entries[0][key] = [];
      expect(() => buildReviewMaterials({ task, reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-code", reviewScope: "integration", strictV2Maps: true, materials: incomplete }))
        .toThrow(/MATERIAL_INCOMPLETE.*change, test, and evidence mappings/i);
    }
  });

  it("allows a declared changed-file context exception only outside complete diff hunks", () => {
    const f = fixture();
    const lines = Array.from({ length: 12 }, (_value, index) => `line-${index + 1}`);
    lines[5] = "changed-line-6";
    writeFileSync(join(f.source, "context-change.txt"), `${lines.join("\n")}\n`);
    const source = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    const changeIds = source.changedFiles.map((item) => `C-${createHash("sha256").update(JSON.stringify([item.path, item.old_path, item.status, item.mode, item.old_mode, item.blob, item.old_blob])).digest("hex").slice(0, 16)}`);
    const receipt = Buffer.from(`${JSON.stringify({ output_ref: "evidence/tests-output.txt", output_hash: "0".repeat(64) })}\n`);
    const task = evidenceTask(f, receipt, Buffer.from("tests pass\n"));
    const materials = {
      approved_spec: "spec", acceptance_criteria: "AC-1", test_evidence: { receipt_ref: "receipts/tests.json", receipt_hash: createHash("sha256").update(receipt).digest("hex") }, review_instructions: reviewInstructionsFor("build-code"),
      phase_map: { state: "complete", summary: "phase", entries: [{ id: "phase", subject: "diff", rationale: "complete", disposition: "not_applicable", reason_code: "complete_diff_authority", reason: "changes.diff is the authority for changed lines", change_ids: changeIds }] },
      impact_map: { state: "complete", summary: "impact", entries: [{ id: "impact", subject: "consumer", rationale: "direct consumer is below the changed hunk", disposition: "complete", change_ids: changeIds, anchors: [{ id: "changed-outside-hunk", path: "context-change.txt", start_line: 10, end_line: 12, role: "consumer", reason: "direct dependency call site", outside_diff_reason: "the consumer is outside the changed hunk and is needed to judge the changed contract" }] }] },
      reuse_map: { state: "complete", summary: "reuse", entries: [{ id: "reuse", subject: "no reusable helper", rationale: "checked", disposition: "not_applicable", reason_code: "no_reuse_boundary", reason: "the diff has no reusable helper boundary", change_ids: [changeIds[0]] }] },
      acceptance_map: { state: "complete", summary: "mapped", acceptance_ids: ["AC-1"], entries: [{ id: "AC-1", subject: "AC", rationale: "mapped", disposition: "complete", change_ids: [changeIds[0]], implementation: "changes.diff", verification: "test evidence", implementation_anchor_ids: ["changed-outside-hunk"], verification_anchor_ids: ["changed-outside-hunk"], anchors: [{ id: "ac-boundary", path: ".gitignore", start_line: 1, end_line: 1, role: "acceptance", reason: "direct accepted boundary" }] }] }
    };
    const bundle = buildReviewMaterials({ task, reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-code", phaseId: "phase-1", strictV2Maps: true, materials });
    const [header, ...content] = readFileSync(join(bundle.bundleRoot, "context/changed-outside-hunk.txt"), "utf8").trimEnd().split("\n");
    expect(JSON.parse(header)).toMatchObject({ path: "context-change.txt", start_line: 10, end_line: 12, changed_file: true, outside_diff_reason: "the consumer is outside the changed hunk and is needed to judge the changed contract" });
    expect(content).toEqual(["line-10", "line-11", "line-12"]);
  });

  it("makes an adaptive closure packet delta-only and gives the provider fixed closure instructions", () => {
    const f = fixture(); changeAll(f.source); const source = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    const bundle = buildReviewMaterials({ reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-plan", reviewRound: "closure",
      materials: { approved_spec: "spec", acceptance_criteria: "ac", draft_plan: "plan", draft_tasks: "tasks", response_ledger: { version: "wh-review-response-ledger.v1", responses: [] }, review_instructions: reviewInstructionsFor("build-plan", null, false, "closure") } });
    expect(bundle.files).toContain("requirements/response_ledger.json");
    expect(bundle.files).not.toContain("changes.diff");
    expect(bundle.files.some((path) => path.startsWith("changed/"))).toBe(false);
    expect(readFileSync(join(bundle.bundleRoot, "review-instructions.md"), "utf8")).toMatch(/bounded closure review/);
  });

  it("rejects empty required stage material", () => {
    const f = fixture(); const source = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    expect(() => buildReviewMaterials({ reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-code",
      materials: { approved_spec: "", acceptance_criteria: "ac", test_evidence: [], review_instructions: reviewInstructionsFor("build-code") } }))
      .toThrow(/MATERIAL_INCOMPLETE.*approved_spec/);
  });

  it("enforces every stage material allowlist and keeps raw logs outside the packet", () => {
    const f = fixture(); const source = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    const spec = { raw_requirement: "need", approved_decision: "yes", draft_spec: "spec", review_instructions: reviewInstructionsFor("build-spec") };
    expect(() => buildReviewMaterials({ reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-spec", materials: { ...spec, unrelated: "no" } })).toThrow(/MATERIAL_FORBIDDEN.*unrelated/);
    expect(() => buildReviewMaterials({ reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-spec", materials: { ...spec, response_ledger: {} } })).toThrow(/response_ledger.*initial/);
    expect(() => buildReviewMaterials({ reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-spec", materials: { ...spec, change_map: {} } })).toThrow(/not allowed/);
    const output = Buffer.from("tests\n"), receipt = Buffer.from(`${JSON.stringify({ output_ref: "evidence/tests-output.txt", output_hash: createHash("sha256").update(output).digest("hex") })}\n`);
    const task = evidenceTask(f, receipt, output);
    expect(() => buildReviewMaterials({ task, reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-code", materials: { approved_spec: "spec", acceptance_criteria: "ac", test_evidence: { receipt_ref: "receipts/tests.json", receipt_hash: createHash("sha256").update(receipt).digest("hex"), output_ref: "evidence/tests-output.txt" }, review_instructions: reviewInstructionsFor("build-code") } })).toThrow(/raw output/);
  });

  it("adds only the fixed UI lens when ui_scope is explicit", () => {
    const f = fixture(); const source = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    const materials = { raw_requirement: "need", approved_decision: "yes", draft_spec: "spec", review_instructions: reviewInstructionsFor("build-spec") };
    const normal = buildReviewMaterials({ reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-spec", materials });
    const ui = buildReviewMaterials({ reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-spec", uiScope: true, materials: { ...materials, review_instructions: reviewInstructionsFor("build-spec", null, true) } });
    expect(normal.files).not.toContain("skills/plan-design-review/SKILL.md");
    expect(ui.files).toContain("skills/plan-design-review/SKILL.md");
  });

  it("ships and names explicit reviewer skills for code stages", () => {
    const instructions = reviewInstructionsFor("build-code");
    for (const skill of ["simplicity-guard", "review"]) expect(instructions).toContain(`skills/${skill}/SKILL.md`);
    for (const executionSkill of ["test-strategy", "diagnosing-bugs"])
      expect(instructions).not.toContain(`skills/${executionSkill}/SKILL.md`);
    expect(instructions).not.toContain("skills/*/SKILL.md");
  });
});
