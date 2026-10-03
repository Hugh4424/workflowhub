import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import * as runtimeBounds from "../../runtime/review/review-input-bounds.mjs";
import { buildRunnerRelease,installRunnerRelease } from "../../runtime/distribution/runner-release.mjs";
import { buildSkillBundleRelease } from "../../runtime/distribution/skill-bundle-release.mjs";

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const temporaryRoots = [];

async function jointRelease(isolated,releaseRoot){const bundleRoot=join(isolated,"bundle");const runner=await buildRunnerRelease({packageRoot:ROOT,outputDir:releaseRoot});await buildSkillBundleRelease({packageRoot:ROOT,outputDir:bundleRoot});const calls=[];const installed=installRunnerRelease({releaseRoot,skillBundleRoot:bundleRoot,run(command,args,options){calls.push({command,args});expect(options.shell).toBe(false);return {status:0,stdout:"",stderr:""};}});expect(installed.status).toBe(0);expect(calls.map(c=>c.command)).toEqual(["npm","git","git","git"]);return runner;}

afterEach(() => {
  while (temporaryRoots.length) rmSync(temporaryRoots.pop(), { recursive: true, force: true });
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

describe("wh-review unbounded-input bundle portability", () => {
  it("ships no local input-size limit", async () => {
    const isolated = mkdtempSync(join(tmpdir(), "workflowhub-wh-review-bounds-guard-"));
    temporaryRoots.push(isolated);
    const release = await jointRelease(isolated,join(isolated,"release"));
    const skillPath = join(isolated, "release/runtime/review/review-input-bounds.mjs");
    expect(release.files.some(({ path }) => path === "runtime/review/review-input-bounds.mjs")).toBe(true);
    const source = readFileSync(skillPath, "utf8").toString("utf8");
    expect(source).not.toContain("TASK_BOUND_PROVIDER_INPUT_MAX_BYTES");
    expect(source).not.toContain("WH_REVIEW_TRUNCATED_SECTION");
  }, 60_000);

  it("ships the actual runtime input reader in the joint release", async () => {
    const isolated = mkdtempSync(join(tmpdir(), "workflowhub-wh-review-bounds-"));
    temporaryRoots.push(isolated);
    const releaseRoot = join(isolated, "release");
    const release = await jointRelease(isolated,releaseRoot);
    const skillPath = join(releaseRoot, "runtime/review/review-input-bounds.mjs");
    const source = readFileSync(skillPath);
    expect(release.files.some(({ path }) => path === "runtime/review/review-input-bounds.mjs")).toBe(true);
    expect(source.toString("utf8")).not.toContain("../../../runtime/review/review-input-bounds.mjs");

    const imported = await import(`${skillPath}?test=${Date.now()}`);
    const diff = [
      "diff --git a/runtime/example.mjs b/runtime/example.mjs",
      "--- a/runtime/example.mjs",
      "+++ b/runtime/example.mjs",
      "@@ -1 +1 @@",
      `+${"x".repeat(486778)}`,
    ].join("\n");
    expect(imported.compactReviewDiff(diff)).toEqual(runtimeBounds.compactReviewDiff(diff));
    expect(imported.compactVerifyCodeMaterials({ changed_files: diff })).toEqual(runtimeBounds.compactVerifyCodeMaterials({ changed_files: diff }));
    expect(imported.compactReviewDiff(diff).diff).toBe(diff);
    expect(imported.compactVerifyCodeMaterials({ changed_files: diff }).materials.changed_files).toBe(diff);

    const manifest = JSON.parse(readFileSync(join(releaseRoot, "runner-release.json"), "utf8"));
    const entry = manifest.files.find(({ path }) => path === "runtime/review/review-input-bounds.mjs");
    expect(entry).toBeDefined();
    expect(source).toEqual(readFileSync(join(ROOT,"runtime/review/review-input-bounds.mjs")));
  }, 60_000);
});
