import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { capturePhaseReviewSource, captureReviewSource } from "../review-source.mjs";
import { buildReviewMaterials, canonicalMaterialManifest, reviewInstructionsFor } from "../review-materials.mjs";
import { createTask, createTaskKernel } from "../../../../core/task-handle.mjs";
import { hashCanonical } from "../../../../core/task-snapshot.mjs";

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

describe("review source capture", () => {
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
    const baseTree = git(f.source, ["rev-parse", `${baselineCommit}^{tree}`]); const candidateTree = git(f.source, ["rev-parse", `${implementationCommit}^{tree}`]);
    const releaseValue = { schema_version: "release-pin.v1", task_id: task.identity.taskId, build_plan: { accepted_ref: "results/build-plan/accepted.json", accepted_raw_hash: "a".repeat(64), attempt_ref: "results/build-plan/attempt-0001.json", attempt_raw_hash: "b".repeat(64) }, checkpoint: { ref: `refs/workflowhub/checkpoints/Demo/${task.identity.taskId}/build-plan/plan-x`, commit_oid: "c".repeat(40), tree_oid: "d".repeat(40) } }; const release = { ref: "evidence/releases/pin.json", hash: hashCanonical(releaseValue) };
    const subject = { schema_version: "1.0.0", phase_id: "phase-1", task_id: task.identity.taskId, release, baseline: { ref: "evidence/snapshots/base.json", hash: "b".repeat(64), tree_oid: baseTree }, implementation: { ref: "evidence/snapshots/implementation.json", hash: "c".repeat(64), tree_oid: candidateTree }, allowed_files: ["phase.txt", "phase-two.txt"], upstream: null };
    const patch = execFileSync("git", ["diff", "--binary", "--full-index", "--no-ext-diff", "--no-renames", baseTree, candidateTree], { cwd: f.source, encoding: "utf8" }).replace(/\r\n/g, "\n");
    const scan = { schema_version: "1.0.0", phase_id: "phase-1", task_id: task.identity.taskId, subject: { ref: "evidence/phases/phase-1/subject.json", hash: hashCanonical(subject) }, baseline_tree: baseTree, implementation_tree: candidateTree, changed_files: ["phase-two.txt", "phase.txt"].sort(), allowed: true, patch, patch_hash: createHash("sha256").update(patch).digest("hex") };
    const kernel = createTaskKernel(task); kernel.publishCanonicalRecord(release.ref, `${JSON.stringify(releaseValue)}\n`); kernel.publishCanonicalRecord("evidence/phases/phase-1/subject.json", `${JSON.stringify(subject)}\n`); kernel.publishCanonicalRecord("evidence/phases/phase-1/diff.json", `${JSON.stringify(scan)}\n`);

    const result = capturePhaseReviewSource({ sourceRoot: f.source, task, phaseId: "phase-1" });
    expect(result.diff).toContain("phase.txt");
    expect(result.diff).toContain("phase-two.txt");
    expect(result.diff).not.toContain("upstream.txt");
    expect(result.diff).not.toContain("later.txt");
    expect(result.baseTree).toBe(git(f.source, ["rev-parse", `${baselineCommit}^{tree}`]));
    expect(result.snapshotTree).toBe(git(f.source, ["rev-parse", `${implementationCommit}^{tree}`]));
  });

  it("rejects a phase id or evidence record that does not match", () => {
    const f = fixture(); const task = evidenceTask(f, Buffer.from("{}\n"), Buffer.from(""));
    expect(() => capturePhaseReviewSource({ sourceRoot: f.source, task, phaseId: "phase-1" })).toThrow(/PHASE_EVIDENCE_INVALID/);
  });

  it("captures the whole dirty tree twice against the current target HEAD", () => {
    const f = fixture(); changeAll(f.source);
    const result = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    expect(result.targetCommit).toBe(git(f.target, ["rev-parse", "HEAD"]));
    expect(result.baseCommit).toBe(result.targetCommit);
    expect(result.snapshotTree).toMatch(/^[a-f0-9]{40,64}$/);
    expect(result.diff).toContain("added.txt");
    expect(result.diff).toContain("deleted file mode");
    expect(result.diff).toContain("similarity index 100%");
    expect(result.changedFiles.map((item) => item.path)).toEqual(expect.arrayContaining(["added.txt", "keep.txt", "link.txt", "renamed.txt", "untracked.txt"]));
    expect(result.changedFiles.map((item) => item.path)).not.toContain("ignored.txt");
    expect(result.changedFiles.find((item) => item.path === "keep.txt").mode).toBe("100755");
    expect(result.changedFiles.find((item) => item.path === "link.txt").mode).toBe("120000");
    expect(result.readSnapshotFile("keep.txt").toString()).toBe("modified\n");
  });

  it("moves the base forward after main advances and the feature merges main", () => {
    const f = fixture();
    writeFileSync(join(f.target, "main.txt"), "main\n");
    git(f.target, ["add", "main.txt"]); git(f.target, ["commit", "-m", "main moves"]);
    git(f.source, ["merge", "main", "--no-edit"]);
    writeFileSync(join(f.source, "feature.txt"), "feature\n");
    const result = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    expect(result.baseCommit).toBe(git(f.target, ["rev-parse", "HEAD"]));
    expect(result.diff).toContain("feature.txt");
    expect(result.diff).not.toContain("main.txt");
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
});

describe("review materials", () => {
  it("preserves canonical receipt/output bytes and closes their manifest graph", () => {
    const f = fixture(); changeAll(f.source);
    const source = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    const output = Buffer.from("real test output\n");
    const receipt = Buffer.from(`${JSON.stringify({ schema_version: "workflowhub-receipt.v1", output_ref: "evidence/tests-output.txt", output_hash: createHash("sha256").update(output).digest("hex") }, null, 2)}\n`);
    const task = evidenceTask(f, receipt, output);
    const evidence = { receipt_ref: "receipts/tests.json", receipt_hash: createHash("sha256").update(receipt).digest("hex") };
    const instructions = reviewInstructionsFor("build-code");
    const bundle = buildReviewMaterials({ task, reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-code",
      materials: { approved_spec: "spec", acceptance_criteria: "ac", test_evidence: evidence, review_instructions: instructions } });
    expect(readFileSync(join(bundle.bundleRoot, "canonical/receipts/tests.json"))).toEqual(receipt);
    expect(readFileSync(join(bundle.bundleRoot, "canonical/evidence/tests-output.txt"))).toEqual(output);
    for (const ref of ["canonical/receipts/tests.json", "canonical/evidence/tests-output.txt"]) {
      const bytes = readFileSync(join(bundle.bundleRoot, ...ref.split("/")));
      expect(bundle.manifest.find((item) => item.path === ref)?.sha256).toBe(createHash("sha256").update(bytes).digest("hex"));
    }
    const graph = JSON.parse(readFileSync(join(bundle.bundleRoot, "canonical-evidence.json"), "utf8"));
    expect(graph.map(({ source_ref }) => source_ref).sort()).toEqual(["evidence/tests-output.txt", "receipts/tests.json"]);
  });

  it("freezes the same canonical evidence closure for verify-code", () => {
    const f = fixture(); changeAll(f.source); const source = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    const output = Buffer.from("verify output\n");
    const receipt = Buffer.from(`${JSON.stringify({ output_ref: "evidence/tests-output.txt", output_hash: createHash("sha256").update(output).digest("hex") })}\n`);
    const task = evidenceTask(f, receipt, output);
    const acceptanceEvidence = { receipt_ref: "receipts/tests.json", receipt_hash: createHash("sha256").update(receipt).digest("hex") };
    const bundle = buildReviewMaterials({ task, reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "verify-code", materials: { acceptance_criteria: "ac", acceptance_evidence: acceptanceEvidence, open_exceptions: "none", review_instructions: reviewInstructionsFor("verify-code") } });
    expect(readFileSync(join(bundle.bundleRoot, "canonical/receipts/tests.json"))).toEqual(receipt);
    expect(readFileSync(join(bundle.bundleRoot, "canonical/evidence/tests-output.txt"))).toEqual(output);
    expect(JSON.parse(readFileSync(join(bundle.bundleRoot, "canonical-evidence.json"), "utf8"))).toHaveLength(2);
  });

  it.each([
    ["missing output entity", false, false],
    ["receipt hash mismatch", true, true],
  ])("fails evidence closure before delivery: %s", (_label, includeOutput, wrongHash) => {
    const f = fixture(); changeAll(f.source); const source = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    const output = Buffer.from("output\n"), receipt = Buffer.from(`${JSON.stringify({ output_ref: "evidence/out.txt", output_hash: createHash("sha256").update(output).digest("hex") })}\n`);
    const task = evidenceTask(f, receipt, output, { includeOutput });
    const evidence = { receipt_ref: "receipts/tests.json", receipt_hash: wrongHash ? "0".repeat(64) : createHash("sha256").update(receipt).digest("hex") };
    expect(() => buildReviewMaterials({ task, reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-code", materials: { approved_spec: "spec", acceptance_criteria: "ac", test_evidence: evidence, review_instructions: reviewInstructionsFor("build-code") } })).toThrow(/MATERIAL_INCOMPLETE|evidence|hash|output|ENOENT/i);
  });

  it("keeps every manifest skill file present and exactly named in review instructions", () => {
    const f = fixture(); changeAll(f.source);
    const source = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    const instructions = reviewInstructionsFor("verify-code");
    const bundle = buildReviewMaterials({ reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "verify-code",
      materials: { acceptance_criteria: "ac", acceptance_evidence: "tests", open_exceptions: "none", review_instructions: instructions } });
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
    expect(direction.files).toEqual(expect.arrayContaining(["contracts/make-decision.md", "skills/plan-ceo-review/SKILL.md", "skills/review/SKILL.md"]));
    expect(() => buildReviewMaterials({
      reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "make-decision", reviewTrack: "direction",
      materials: { raw_requirement: "need", objective_facts: "facts", review_instructions: reviewInstructionsFor("make-decision", "direction"), invented_alias: "do this" }
    })).toThrow(/MATERIAL_FORBIDDEN.*invented_alias/);

    const code = buildReviewMaterials({
      reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-code", reviewTrack: null,
      materials: { approved_spec: "spec", acceptance_criteria: "ac", test_evidence: "tests pass", review_instructions: reviewInstructionsFor("build-code") }
    });
    expect(code.files).toEqual(expect.arrayContaining(["changes.diff", "changed/added.txt", "changed/link.txt", "changed/untracked.txt", "contracts/build-code.md"]));
    expect(code.files).toContain("contracts/provider-protocol.md");
    expect(readFileSync(join(code.bundleRoot, "changed", "link.txt"), "utf8")).toBe("added.txt");
    const repeated = buildReviewMaterials({
      reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-code", reviewTrack: null,
      materials: { approved_spec: "spec", acceptance_criteria: "ac", test_evidence: "tests pass", review_instructions: reviewInstructionsFor("build-code") }
    });
    expect(repeated.materialId).toBe(code.materialId);
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

  it("rejects empty required stage material", () => {
    const f = fixture(); const source = captureReviewSource({ sourceRoot: f.source, targetRepoRoot: f.target, reviewDataRoot: f.data });
    expect(() => buildReviewMaterials({ reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-code",
      materials: { approved_spec: "", acceptance_criteria: "ac", test_evidence: [], review_instructions: reviewInstructionsFor("build-code") } }))
      .toThrow(/MATERIAL_INCOMPLETE.*approved_spec/);
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
    for (const skill of ["review", "test-strategy", "diagnosing-bugs"]) expect(instructions).toContain(`skills/${skill}/SKILL.md`);
    expect(instructions).not.toContain("skills/*/SKILL.md");
  });
});
