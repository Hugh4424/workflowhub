import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import * as runtimeBounds from "../../runtime/review/review-input-bounds.mjs";
import { buildSkillBundleRelease } from "../../runtime/distribution/skill-bundle-release.mjs";

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const temporaryRoots = [];

afterEach(() => {
  while (temporaryRoots.length) rmSync(temporaryRoots.pop(), { recursive: true, force: true });
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

describe("wh-review bounded-input bundle portability", () => {
  it("RED: does not add a skill-only fail-closed guard for an omitted test candidate", async () => {
    const isolated = mkdtempSync(join(tmpdir(), "workflowhub-wh-review-bounds-guard-"));
    temporaryRoots.push(isolated);
    const release = await buildSkillBundleRelease({ packageRoot: ROOT, outputDir: join(isolated, "release") });
    const skillPath = join(isolated, "release/skills/wh-review/scripts/review-input-bounds.mjs");
    expect(release.files.some(({ path }) => path === "skills/wh-review/scripts/review-input-bounds.mjs")).toBe(true);
    expect(readFileSync(skillPath, "utf8")).not.toContain("implementation/test diff exceeds the bounded provider budget");
  }, 60_000);

  it("ships a self-contained skill-local bounds implementation", async () => {
    const isolated = mkdtempSync(join(tmpdir(), "workflowhub-wh-review-bounds-"));
    temporaryRoots.push(isolated);
    const releaseRoot = join(isolated, "release");
    const release = await buildSkillBundleRelease({ packageRoot: ROOT, outputDir: releaseRoot });
    const skillPath = join(releaseRoot, "skills/wh-review/scripts/review-input-bounds.mjs");
    const source = readFileSync(skillPath);
    expect(release.files.some(({ path }) => path === "skills/wh-review/scripts/review-input-bounds.mjs")).toBe(true);
    expect(source.toString("utf8")).not.toContain("../../../runtime/review/review-input-bounds.mjs");

    const imported = await import(`${skillPath}?test=${Date.now()}`);
    const diff = [
      "diff --git a/runtime/example.mjs b/runtime/example.mjs",
      "--- a/runtime/example.mjs",
      "+++ b/runtime/example.mjs",
      "@@ -1 +1 @@",
      "+const current = true;",
    ].join("\n");
    expect(imported.compactReviewDiff(diff)).toEqual(runtimeBounds.compactReviewDiff(diff));
    expect(imported.compactVerifyCodeMaterials({ changed_files: diff })).toEqual(runtimeBounds.compactVerifyCodeMaterials({ changed_files: diff }));

    const manifest = JSON.parse(readFileSync(join(releaseRoot, "skill-bundle.json"), "utf8"));
    const entry = manifest.files.find(({ path }) => path === "skills/wh-review/scripts/review-input-bounds.mjs");
    expect(entry.sha256).toBe(sha256(source));
  }, 60_000);
});
