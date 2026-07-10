import { afterEach, describe, expect, it } from "vitest";
import { chmodSync, lstatSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { createArtifactReviewPackage, isContainedRelativePath, verifyArtifactReviewPackage } from "../artifact-review-package.mjs";

const roots = [];
const makeRoot = () => { const root = mkdtempSync(join(tmpdir(), "artifact-review-package-")); roots.push(root); return root; };
function makeRemovable(path) {
  let stat; try { stat = lstatSync(path); } catch { return; }
  if (stat.isSymbolicLink() || !stat.isDirectory()) { try { chmodSync(path, 0o644); } catch {} return; }
  chmodSync(path, 0o755); for (const name of readdirSync(path)) makeRemovable(join(path, name));
}
afterEach(() => { for (const root of roots.splice(0)) { makeRemovable(root); rmSync(root, { recursive: true, force: true }); } });

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
    expect(first.manifest.entries.map(({ lines }) => lines)).toEqual([1, 1, 1]);
    expect(lstatSync(first.packageRoot).mode & 0o777).toBe(0o555);
    expect(lstatSync(first.manifestPath).mode & 0o777).toBe(0o444);
  });

  it("fails loud when a persisted artifact is changed", () => {
    const pkg = createArtifactReviewPackage({ reviewsRoot: makeRoot(), stage: "build-spec", reviewFlowId: "flow-b", totalRound: 1, contract: "C", materials: "M" });
    chmodSync(join(pkg.packageRoot, "materials.md"), 0o644); writeFileSync(join(pkg.packageRoot, "materials.md"), "changed"); chmodSync(join(pkg.packageRoot, "materials.md"), 0o444);
    expect(() => verifyArtifactReviewPackage({ packageRoot: pkg.packageRoot, manifestPath: pkg.manifestPath, expectedContentHash: pkg.manifest.content_hash })).toThrow(/artifact-package-tampered/);
  });

  it("rejects a symlink even when it points to a regular file", () => {
    const pkg = createArtifactReviewPackage({ reviewsRoot: makeRoot(), stage: "build-spec", reviewFlowId: "flow-c", totalRound: 1, contract: "C", materials: "M" });
    const materials = join(pkg.packageRoot, "materials.md"), target = join(pkg.packageRoot, "target.md");
    chmodSync(pkg.packageRoot, 0o755); writeFileSync(target, "M"); unlinkSync(materials); symlinkSync(target, materials);
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
    chmodSync(pkg.manifestPath, 0o644); writeFileSync(pkg.manifestPath, JSON.stringify(manifest)); chmodSync(pkg.manifestPath, 0o444);
    expect(() => verifyArtifactReviewPackage({ packageRoot: pkg.packageRoot, manifestPath: pkg.manifestPath })).toThrow(/artifact-package-escape/);
  });

  it("rejects cross-volume absolute relative results", () => {
    expect(isContainedRelativePath("C:\\outside\\file.md")).toBe(false);
    expect(isContainedRelativePath("safe/file.md")).toBe(true);
  });

  it("publishes one verified winner under concurrent content-addressed writers", async () => {
    const reviewsRoot = makeRoot();
    const moduleUrl = new URL("../artifact-review-package.mjs", import.meta.url).href;
    const script = `import {createArtifactReviewPackage} from ${JSON.stringify(moduleUrl)};const p=createArtifactReviewPackage({reviewsRoot:process.argv[1],stage:"build-spec",reviewFlowId:"race",totalRound:1,contract:"C",materials:"M".repeat(1000000)});process.stdout.write(p.packageRoot);`;
    const run = () => new Promise((resolvePromise, reject) => { const child = spawn(process.execPath, ["--input-type=module", "-e", script, reviewsRoot]); let out = "", err = ""; child.stdout.on("data", (chunk) => { out += chunk; }); child.stderr.on("data", (chunk) => { err += chunk; }); child.on("close", (code) => code === 0 ? resolvePromise(out) : reject(new Error(err))); });
    const winners = await Promise.all([run(), run(), run(), run()]);
    expect(new Set(winners).size).toBe(1);
    const [packageName] = readdirSync(join(reviewsRoot, ".claude-review-packages"));
    const packageRoot = join(reviewsRoot, ".claude-review-packages", packageName);
    expect(verifyArtifactReviewPackage({ packageRoot, manifestPath: join(packageRoot, "manifest.json") }).manifest.entries[1].bytes).toBe(1000000);
  });
});
