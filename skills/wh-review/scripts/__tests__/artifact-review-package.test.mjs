import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createArtifactReviewPackage, verifyArtifactReviewPackage } from "../artifact-review-package.mjs";

const roots = [];
const makeRoot = () => { const root = mkdtempSync(join(tmpdir(), "artifact-review-package-")); roots.push(root); return root; };
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

describe("artifact review package", () => {
  it("persists complete deterministic contract/materials/skills with byte and hash evidence", () => {
    const reviewsRoot = makeRoot();
    const params = { reviewsRoot, stage: "build-spec", reviewFlowId: "flow-a", totalRound: 1, contract: "完整契约\n", materials: "完整材料\n", skillDefinitions: [{ name: "review", content: "完整 skill\n" }] };
    const first = createArtifactReviewPackage(params);
    const second = createArtifactReviewPackage(params);
    expect(second.packageRoot).toBe(first.packageRoot);
    expect(first.manifest.entries.map(({ id }) => id)).toEqual(["contract", "materials", "skill:review"]);
    expect(readFileSync(join(first.packageRoot, "contract.md"), "utf8")).toBe(params.contract);
    expect(readFileSync(join(first.packageRoot, "materials.md"), "utf8")).toBe(params.materials);
    expect(readFileSync(join(first.packageRoot, "skills/review.md"), "utf8")).toBe("完整 skill\n");
  });

  it("fails loud when a persisted artifact is changed", () => {
    const pkg = createArtifactReviewPackage({ reviewsRoot: makeRoot(), stage: "build-spec", reviewFlowId: "flow-b", totalRound: 1, contract: "C", materials: "M" });
    writeFileSync(join(pkg.packageRoot, "materials.md"), "changed");
    expect(() => verifyArtifactReviewPackage({ packageRoot: pkg.packageRoot, manifestPath: pkg.manifestPath, expectedContentHash: pkg.manifest.content_hash })).toThrow(/artifact-package-tampered/);
  });

  it("rejects a symlink even when it points to a regular file", () => {
    const pkg = createArtifactReviewPackage({ reviewsRoot: makeRoot(), stage: "build-spec", reviewFlowId: "flow-c", totalRound: 1, contract: "C", materials: "M" });
    const materials = join(pkg.packageRoot, "materials.md"), target = join(pkg.packageRoot, "target.md");
    writeFileSync(target, "M"); unlinkSync(materials); symlinkSync(target, materials);
    expect(() => verifyArtifactReviewPackage({ packageRoot: pkg.packageRoot, manifestPath: pkg.manifestPath })).toThrow(/artifact-package-invalid/);
  });

  it("rejects a package outside its declared trusted root", () => {
    const pkg = createArtifactReviewPackage({ reviewsRoot: makeRoot(), stage: "build-spec", reviewFlowId: "flow-d", totalRound: 1, contract: "C", materials: "M" });
    expect(() => verifyArtifactReviewPackage({ packageRoot: pkg.packageRoot, manifestPath: pkg.manifestPath, trustedRoot: makeRoot() })).toThrow(/artifact-package-escape/);
  });

  it("rejects a manifest entry that escapes the package root", () => {
    const pkg = createArtifactReviewPackage({ reviewsRoot: makeRoot(), stage: "build-spec", reviewFlowId: "flow-e", totalRound: 1, contract: "C", materials: "M" });
    const manifest = JSON.parse(readFileSync(pkg.manifestPath, "utf8"));
    manifest.entries[1].path = "../outside.md";
    writeFileSync(pkg.manifestPath, JSON.stringify(manifest));
    expect(() => verifyArtifactReviewPackage({ packageRoot: pkg.packageRoot, manifestPath: pkg.manifestPath })).toThrow(/artifact-package-escape/);
  });
});
