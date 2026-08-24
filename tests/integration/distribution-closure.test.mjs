import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, test } from "vitest";
import Ajv2020 from "ajv/dist/2020.js";

import { buildSkillBundleRelease } from "../../runtime/distribution/skill-bundle-release.mjs";
import { checkReleaseClosure } from "../../runtime/evidence/check-skill-closure.mjs";
import { validateSkillBundle } from "../../runtime/adapters/local-skill-resolver.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const temps = [];
afterEach(() => temps.splice(0).forEach((entry) => fs.rmSync(entry, { recursive: true, force: true })));

describe("skill bundle release", () => {
  test("contains the five workflows and their declared skill closure only", async () => {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-skill-release-"));
    temps.push(outputDir);
    const release = await buildSkillBundleRelease({ packageRoot: ROOT, outputDir });

    expect(release.runner_contract_major).toBeGreaterThan(0);
    expect(release.runner_contract_min_minor).toBeGreaterThanOrEqual(0);
    for (const stage of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) {
      expect(release.files.some(({ path: locator }) => locator === `workflows/${stage}/SKILL.md`)).toBe(true);
      expect(release.files.some(({ path: locator }) => locator === `workflows/${stage}/skill-deps.yaml`)).toBe(true);
    }
    for (const lens of ["simplicity-guard", "plan-eng-review"]) {
      expect(release.files.some(({ path: locator }) => locator === `skills/${lens}/SKILL.md`)).toBe(true);
    }
    expect(release.files.some(({ path: locator }) =>
      /(^|\/)(?:node_modules|tests?|__tests__|specs?|evidence|archive|history|historical)(?:\/|$)|\.test\.[^/]+$/.test(locator))).toBe(false);
    expect(JSON.stringify(release)).not.toContain(ROOT);
    for (const { path: locator } of release.files) {
      const content = fs.readFileSync(path.join(outputDir, locator), "utf8");
      expect(content).not.toMatch(/\/Users\/[A-Za-z0-9._-]+\//);
    }
    const schema = JSON.parse(fs.readFileSync(path.join(ROOT, "runtime/schemas/skill-bundle.schema.json"), "utf8"));
    const validate = new Ajv2020({ strict: false }).compile(schema);
    expect(validate(release)).toBe(true);
    const missingContract = { ...release };
    delete missingContract.runner_contract_major;
    expect(validate(missingContract)).toBe(false);
    expect(checkReleaseClosure({
      skillRelease: release,
      runnerRelease: { release: "workflowhub-runner", files: [{ path: "runner-release.json", sha256: "0".repeat(64) }] },
    })).toEqual({ ok: true, errors: [] });
  });

  test("rejects source closure drift before publishing a release", async () => {
    const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-closure-source-"));
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-closure-output-"));
    temps.push(packageRoot, outputDir);
    for (const directory of ["config", "core", "skills", "workflows", "runtime"]) {
      fs.cpSync(path.join(ROOT, directory), path.join(packageRoot, directory), { recursive: true });
    }
    fs.cpSync(path.join(ROOT, "skills/reuse-registry.md"), path.join(packageRoot, "skills/reuse-registry.md"));
    fs.cpSync(path.join(ROOT, "THIRD_PARTY_NOTICES.md"), path.join(packageRoot, "THIRD_PARTY_NOTICES.md"));
    const manifestPath = path.join(packageRoot, "skills/wh-review/skill-bundle.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const entry = manifest.files.find((item) => (typeof item === "string" ? item : item.path) === "scripts/review-materials.mjs");
    entry.sha256 = "0".repeat(64);
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    await expect(buildSkillBundleRelease({ packageRoot, outputDir }))
      .rejects.toThrow(/skill closure/);
  });

  test("rejects an empty declared skill bundle before publishing", async () => {
    const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-empty-bundle-"));
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-empty-output-"));
    temps.push(packageRoot, outputDir);
    for (const directory of ["config", "core", "skills", "workflows", "runtime"]) {
      fs.cpSync(path.join(ROOT, directory), path.join(packageRoot, directory), { recursive: true });
    }
    fs.cpSync(path.join(ROOT, "skills/reuse-registry.md"), path.join(packageRoot, "skills/reuse-registry.md"));
    fs.cpSync(path.join(ROOT, "THIRD_PARTY_NOTICES.md"), path.join(packageRoot, "THIRD_PARTY_NOTICES.md"));
    const manifestPath = path.join(packageRoot, "skills/wh-review/skill-bundle.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.files = [];
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    await expect(buildSkillBundleRelease({ packageRoot, outputDir }))
      .rejects.toThrow(/skill closure|invalid skill bundle/);
  });

  test("rejects a forbidden declared asset instead of silently dropping it", async () => {
    const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-forbidden-bundle-"));
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-forbidden-output-"));
    temps.push(packageRoot, outputDir);
    for (const directory of ["config", "core", "skills", "workflows", "runtime"]) {
      fs.cpSync(path.join(ROOT, directory), path.join(packageRoot, directory), { recursive: true });
    }
    fs.cpSync(path.join(ROOT, "skills/reuse-registry.md"), path.join(packageRoot, "skills/reuse-registry.md"));
    fs.cpSync(path.join(ROOT, "THIRD_PARTY_NOTICES.md"), path.join(packageRoot, "THIRD_PARTY_NOTICES.md"));
    const asset = "tests/polluted-fixture.mjs";
    const assetPath = path.join(packageRoot, "skills/wh-review", asset);
    fs.mkdirSync(path.dirname(assetPath), { recursive: true });
    fs.writeFileSync(assetPath, "export const polluted = true;\n");
    const manifestPath = path.join(packageRoot, "skills/wh-review/skill-bundle.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.files.push({ path: asset, sha256: createHash("sha256").update(fs.readFileSync(assetPath)).digest("hex") });
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    const catalogPath = path.join(packageRoot, "skills/catalog.yaml");
    const catalog = fs.readFileSync(catalogPath, "utf8");
    const { bundleHash } = validateSkillBundle(packageRoot, "skills/wh-review/skill-bundle.json", "skills/wh-review/SKILL.md");
    const catalogLines = catalog.split("\n");
    let inWhReview = false;
    for (let index = 0; index < catalogLines.length; index += 1) {
      if (catalogLines[index].startsWith("  - name: wh-review")) inWhReview = true;
      else if (inWhReview && catalogLines[index].startsWith("  - name:")) inWhReview = false;
      if (inWhReview && catalogLines[index].includes("local_bundle_hash:")) {
        catalogLines[index] = `    local_bundle_hash: ${bundleHash}`;
        break;
      }
    }
    fs.writeFileSync(catalogPath, catalogLines.join("\n"));

    await expect(buildSkillBundleRelease({ packageRoot, outputDir }))
      .rejects.toThrow(/forbidden path/);
  });

  test("rejects malformed release file entries instead of treating them as a closed set", () => {
    const result = checkReleaseClosure({
      skillRelease: { skill: "workflowhub", files: [{}] },
      runnerRelease: { release: "workflowhub-runner", files: [{}] },
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      "skill release file entry is invalid",
      "runner release file entry is invalid",
    ]));
  });

  test("rejects non-POSIX absolute and dot-segment release locators", () => {
    for (const pathName of ["/outside/file", "\\\\outside\\\\file", "C:\\outside\\file", "C:outside\\file", "skills/../outside"]) {
      const result = checkReleaseClosure({
        skillRelease: { skill: "workflowhub", files: [{ path: pathName, sha256: "0".repeat(64) }] },
        runnerRelease: { release: "workflowhub-runner", files: [{ path: "runner-release.json", sha256: "0".repeat(64) }] },
      });
      expect(result.ok).toBe(false);
      expect(result.errors).toContain("skill release file entry is invalid");
    }
  });
});
