import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { captureReviewSource } from "../review-source.mjs";
import { buildReviewMaterials, canonicalMaterialManifest, reviewInstructionsFor } from "../review-materials.mjs";

function git(cwd, args, options = {}) {
  return execFileSync("git", args, { cwd, encoding: "utf8", ...options }).trim();
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "wh-review-source-"));
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
    const ui = buildReviewMaterials({ reviewDataRoot: f.data, attachmentRoot: f.data, source, taskId: "task", stage: "build-spec", uiScope: true, materials });
    expect(normal.files).not.toContain("skills/plan-design-review/SKILL.md");
    expect(ui.files).toContain("skills/plan-design-review/SKILL.md");
  });
});
