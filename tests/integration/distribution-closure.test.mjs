import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, test } from "vitest";
import Ajv2020 from "ajv/dist/2020.js";
import yaml from "js-yaml";

import { CURRENT_MATERIAL_FILES } from "../../runtime/task/material-workspace.mjs";
import { buildSkillBundleRelease, validateSkillBundleRelease } from "../../runtime/distribution/skill-bundle-release.mjs";
import { buildRunnerRelease, validateRunnerRelease } from "../../runtime/distribution/runner-release.mjs";
import {
  checkReleaseClosure,
  checkSkillClosure,
  validatePortableWorkflowDependencies,
  validatePortableWorkflowSteps,
  workflowDeclarations,
} from "../../runtime/evidence/check-skill-closure.mjs";
import { validateSkillBundle } from "../../runtime/adapters/local-skill-resolver.mjs";
import { validateStepManifest } from "../../runtime/stage/step-manifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const temps = [];
afterEach(() => temps.splice(0).forEach((entry) => fs.rmSync(entry, { recursive: true, force: true })));

describe("portable build-prd workflow closure", () => {
  test("discovers build-prd as a portable workflow without changing formal stages or materials", async () => {
    const config = yaml.load(fs.readFileSync(path.join(ROOT, "config/workflowhub.yaml"), "utf8"));
    const entry = config.registry.find(({ workflow }) => workflow === "build-prd");
    expect(entry).toMatchObject({
      component_id: "build-prd",
      workflow: "build-prd",
      kind: "portable_workflow",
      path: "workflows/build-prd/SKILL.md",
    });
    for (const file of ["SKILL.md", "skill-deps.yaml", "steps.json"]) {
      expect(fs.existsSync(path.join(ROOT, "workflows/build-prd", file)), `missing build-prd ${file}`).toBe(true);
    }
    expect(CURRENT_MATERIAL_FILES).toEqual(["decision-log.md", "spec.md", "plan.md", "tasks.md"]);
    expect(workflowDeclarations(ROOT).formal).toHaveLength(5);
    expect(workflowDeclarations(ROOT).portable).toEqual([entry]);
    const steps = JSON.parse(fs.readFileSync(path.join(ROOT, "workflows/build-prd/steps.json"), "utf8"));
    expect(steps.steps.every((step) => step.completion_evidence.every((ref) => ref.kind !== "stage_outcome"))).toBe(true);
    expect(steps.steps.every((step) => step.completion_evidence.some((ref) => ref.kind === "portable_workflow_outcome"))).toBe(true);
    expect(steps.steps).toHaveLength(6);
    expect(steps.steps[4]).toMatchObject({ step_slug: "confirm-final-displayed-draft" });
    expect(steps.steps[4].completion_evidence).toEqual(expect.arrayContaining([
      { kind: "final_displayed_draft_confirmation", uri_or_path: "workflow://build-prd/final-confirmation" },
    ]));
    const formalEntries = config.registry.filter(({ kind }) => kind !== "portable_workflow");
    expect(formalEntries).toHaveLength(8);
    expect(formalEntries.some(({ workflow }) => workflow === "build-prd")).toBe(false);
    expect(formalEntries.filter(({ path: locator }) => /^workflows\//.test(locator)).map(({ path: locator }) => locator).sort()).toEqual([
      "workflows/build-code/SKILL.md",
      "workflows/build-plan/SKILL.md",
      "workflows/build-spec/SKILL.md",
      "workflows/make-decision/SKILL.md",
      "workflows/verify-code/SKILL.md",
    ]);
  });

  test("rejects a portable registry entry when its package files are incomplete", async () => {
    const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-portable-missing-") );
    temps.push(packageRoot);
    for (const directory of ["config", "skills", "workflows", "runtime"]) {
      fs.cpSync(path.join(ROOT, directory), path.join(packageRoot, directory), { recursive: true });
    }
    fs.cpSync(path.join(ROOT, "THIRD_PARTY_NOTICES.md"), path.join(packageRoot, "THIRD_PARTY_NOTICES.md"));
    fs.rmSync(path.join(packageRoot, "workflows/build-prd/steps.json"));
    const result = checkSkillClosure(packageRoot);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("portable workflow missing build-prd/steps.json");
  });

  test("rejects a structured registry workflow/path mismatch", () => {
    const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-registry-path-mismatch-"));
    temps.push(packageRoot);
    for (const directory of ["config", "skills", "workflows", "runtime"]) {
      fs.cpSync(path.join(ROOT, directory), path.join(packageRoot, directory), { recursive: true });
    }
    fs.cpSync(path.join(ROOT, "THIRD_PARTY_NOTICES.md"), path.join(packageRoot, "THIRD_PARTY_NOTICES.md"));
    const configPath = path.join(packageRoot, "config/workflowhub.yaml");
    const config = yaml.load(fs.readFileSync(configPath, "utf8"));
    const entry = config.registry.find(({ path: locator }) => locator === "workflows/make-decision/SKILL.md");
    entry.component_id = "wrong-alias";
    fs.writeFileSync(configPath, yaml.dump(config));

    const result = checkSkillClosure(packageRoot);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("registry component/path mismatch: wrong-alias -> workflows/make-decision/SKILL.md");
  });

  test("rejects a formal sixth workflow instead of treating it as portable", async () => {
    const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-sixth-stage-"));
    temps.push(packageRoot);
    for (const directory of ["config", "skills", "workflows", "runtime"]) {
      fs.cpSync(path.join(ROOT, directory), path.join(packageRoot, directory), { recursive: true });
    }
    fs.cpSync(path.join(ROOT, "THIRD_PARTY_NOTICES.md"), path.join(packageRoot, "THIRD_PARTY_NOTICES.md"));
    const configPath = path.join(packageRoot, "config/workflowhub.yaml");
    const config = yaml.load(fs.readFileSync(configPath, "utf8"));
    config.registry.push({ component_id: "sixth-stage", workflow: "sixth-stage", path: "workflows/sixth-stage/SKILL.md" });
    fs.mkdirSync(path.join(packageRoot, "workflows/sixth-stage"));
    fs.writeFileSync(path.join(packageRoot, "workflows/sixth-stage/SKILL.md"), "# sixth-stage\n");
    fs.writeFileSync(configPath, yaml.dump(config));
    const result = checkSkillClosure(packageRoot);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("configured workflow is not a formal stage: sixth-stage");
  });

  test("rejects duplicate or mismatched portable declarations", () => {
    const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-portable-registry-invalid-"));
    temps.push(packageRoot);
    for (const directory of ["config", "skills", "workflows", "runtime"]) {
      fs.cpSync(path.join(ROOT, directory), path.join(packageRoot, directory), { recursive: true });
    }
    fs.cpSync(path.join(ROOT, "THIRD_PARTY_NOTICES.md"), path.join(packageRoot, "THIRD_PARTY_NOTICES.md"));
    const configPath = path.join(packageRoot, "config/workflowhub.yaml");
    const config = yaml.load(fs.readFileSync(configPath, "utf8"));
    const portable = config.registry.find(({ kind }) => kind === "portable_workflow");
    portable.component_id = "wrong-component";
    config.registry.push({ ...portable });
    fs.writeFileSync(configPath, yaml.dump(config));
    const result = checkSkillClosure(packageRoot);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/portable workflow component\/workflow mismatch|duplicate portable workflow registry entry/);
  });

  test("rejects formal registry drift even when the portable declaration is absent", () => {
    const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-formal-registry-drift-"));
    temps.push(packageRoot);
    for (const directory of ["config", "skills", "workflows", "runtime"]) {
      fs.cpSync(path.join(ROOT, directory), path.join(packageRoot, directory), { recursive: true });
    }
    fs.cpSync(path.join(ROOT, "THIRD_PARTY_NOTICES.md"), path.join(packageRoot, "THIRD_PARTY_NOTICES.md"));
    fs.rmSync(path.join(packageRoot, "workflows/build-prd"), { recursive: true });
    const configPath = path.join(packageRoot, "config/workflowhub.yaml");
    const config = yaml.load(fs.readFileSync(configPath, "utf8"));
    config.registry = config.registry.filter(({ kind }) => kind !== "portable_workflow");
    config.registry.push({ component_id: "sixth-stage", workflow: "sixth-stage", path: "workflows/sixth-stage/SKILL.md" });
    fs.mkdirSync(path.join(packageRoot, "workflows/sixth-stage"));
    fs.writeFileSync(path.join(packageRoot, "workflows/sixth-stage/SKILL.md"), "# sixth-stage\\n");
    fs.writeFileSync(configPath, yaml.dump(config));

    const result = checkSkillClosure(packageRoot);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("configured workflow is not a formal stage: sixth-stage");
  });

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
    for (const file of ["SKILL.md", "skill-deps.yaml", "steps.json"]) {
      const locator = `workflows/build-prd/${file}`;
      expect(release.files.some((entry) => entry.path === locator), `release must include portable ${locator}`).toBe(true);
    }
    expect(release.files.some((entry) => entry.path === "skills/spec-prd/SKILL.md")).toBe(true);
    expect(release.files.some((entry) => entry.path === "skills/spec-prd/skill-bundle.json")).toBe(true);
    const templateLocator = "skills/spec-prd/templates/prd-template.md";
    const templateEntry = release.files.find((entry) => entry.path === templateLocator);
    expect(templateEntry, `release must include ${templateLocator}`).toBeDefined();
    const templateBytes = fs.readFileSync(path.join(ROOT, templateLocator));
    expect(templateEntry.sha256).toBe(createHash("sha256").update(templateBytes).digest("hex"));
    expect(fs.readFileSync(path.join(outputDir, templateLocator))).toEqual(templateBytes);
    const portableSkill = fs.readFileSync(path.join(ROOT, "workflows/build-prd/SKILL.md"));
    expect(release.files.find((entry) => entry.path === "workflows/build-prd/SKILL.md").sha256)
      .toBe(createHash("sha256").update(portableSkill).digest("hex"));
    const currentFiles = [
      ...["make-decision", "build-spec", "build-plan", "build-code", "verify-code"].flatMap((stage) =>
        ["SKILL.md", "steps.json", "skill-deps.yaml"].map((file) => `workflows/${stage}/${file}`)),
      "skills/spec-plan/templates/plan-template.md", "skills/spec-tasks/templates/tasks-template.md",
    ];
    for (const locator of currentFiles) {
      const entry = release.files.find((file) => file.path === locator);
      expect(entry, `release must include current ${locator}`).toBeDefined();
      const sourceBytes = fs.readFileSync(path.join(ROOT, locator));
      expect(entry.sha256).toBe(createHash("sha256").update(sourceBytes).digest("hex"));
      expect(fs.readFileSync(path.join(outputDir, locator))).toEqual(sourceBytes);
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
    const closureSource = fs.readFileSync(path.join(ROOT, "runtime/evidence/check-skill-closure.mjs"), "utf8");
    expect(closureSource).toMatch(/Findings disposition dialogue reuses spec-clarify/i);
    expect(closureSource).toMatch(/Talk and Grill remain make-decision-only/i);
  });

  test("rejects removal of the persisted portable workflow closure", async () => {
    const releaseRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-portable-release-removal-"));
    temps.push(releaseRoot);
    const manifest = await buildSkillBundleRelease({ packageRoot: ROOT, outputDir: releaseRoot });
    const removed = ["SKILL.md", "skill-deps.yaml", "steps.json"]
      .map((file) => `workflows/build-prd/${file}`);
    for (const locator of removed) fs.rmSync(path.join(releaseRoot, locator));
    const mutated = {
      ...manifest,
      files: manifest.files.filter(({ path: locator }) => !removed.includes(locator)),
    };
    fs.writeFileSync(path.join(releaseRoot, "skill-bundle.json"), `${JSON.stringify(mutated, null, 2)}\n`);

    expect(() => validateSkillBundleRelease({ releaseRoot }))
      .toThrow(/portable workflow|declared file is missing|missing or unsafe/);
  });

  test("rejects unmanifested files in a closed release", async () => {
    const releaseRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-release-extra-file-"));
    temps.push(releaseRoot);
    await buildSkillBundleRelease({ packageRoot: ROOT, outputDir: releaseRoot });
    fs.writeFileSync(path.join(releaseRoot, "unexpected.mjs"), "export const unexpected = true;\n");

    expect(() => validateSkillBundleRelease({ releaseRoot }))
      .toThrow(/unmanifested|not declared|closed release/);
  });

  test("rejects output symlink escape and pre-existing output entries", async () => {
    const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-output-source-"));
    const outputParent = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-output-parent-"));
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-output-outside-"));
    const outputDir = path.join(outputParent, "release");
    temps.push(packageRoot, outputParent, outside);
    for (const directory of ["config", "skills", "workflows", "runtime"]) {
      fs.cpSync(path.join(ROOT, directory), path.join(packageRoot, directory), { recursive: true });
    }
    fs.cpSync(path.join(ROOT, "THIRD_PARTY_NOTICES.md"), path.join(packageRoot, "THIRD_PARTY_NOTICES.md"));
    fs.symlinkSync(outside, outputDir);
    await expect(buildSkillBundleRelease({ packageRoot, outputDir })).rejects.toThrow(/unsafe|real directory|outputDir/);
    expect(fs.readdirSync(outside)).toEqual([]);

    fs.unlinkSync(outputDir);
    fs.mkdirSync(outputDir);
    fs.writeFileSync(path.join(outputDir, "stale.txt"), "stale\n");
    await expect(buildSkillBundleRelease({ packageRoot, outputDir })).rejects.toThrow(/empty|pre-existing/);
    expect(fs.readFileSync(path.join(outputDir, "stale.txt"), "utf8")).toBe("stale\n");
  });

  test("rejects valid-hash extra files added to the manifest and disk", async () => {
    const releaseRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-release-manifest-extra-"));
    temps.push(releaseRoot);
    const manifest = await buildSkillBundleRelease({ packageRoot: ROOT, outputDir: releaseRoot });
    const extraPath = path.join(releaseRoot, "extra.txt");
    const extraBytes = Buffer.from("valid hash but undeclared closure\n");
    fs.writeFileSync(extraPath, extraBytes);
    const mutated = {
      ...manifest,
      files: [...manifest.files, { path: "extra.txt", sha256: createHash("sha256").update(extraBytes).digest("hex") }],
    };
    fs.writeFileSync(path.join(releaseRoot, "skill-bundle.json"), `${JSON.stringify(mutated, null, 2)}\n`);

    expect(() => validateSkillBundleRelease({ releaseRoot })).toThrow(/required closure|manifested-extra|declared|unmanifested/);
  });

  test("rejects an invalid portable evidence kind", () => {
    const steps = JSON.parse(fs.readFileSync(path.join(ROOT, "workflows/build-prd/steps.json"), "utf8"));
    steps.steps[1].completion_evidence[0].kind = "bogus";
    const result = validatePortableWorkflowSteps(steps);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toMatch(/evidence kind|reference is invalid/);
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

  test("rejects an unsafe release manifest file", async () => {
    const releaseRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-unsafe-release-manifest-"));
    temps.push(releaseRoot);
    await buildSkillBundleRelease({ packageRoot: ROOT, outputDir: releaseRoot });
    const original = path.join(releaseRoot, "skill-bundle.json");
    const backup = path.join(releaseRoot, "skill-bundle-backup.json");
    fs.renameSync(original, backup);
    fs.symlinkSync(backup, original);

    expect(() => validateSkillBundleRelease({ releaseRoot })).toThrow(/manifest is missing or unsafe/);
  });

  test("rejects hard-linked release source files", async () => {
    const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-hardlink-source-"));
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-hardlink-output-"));
    temps.push(packageRoot, outputDir);
    for (const directory of ["config", "core", "skills", "workflows", "runtime"]) {
      fs.cpSync(path.join(ROOT, directory), path.join(packageRoot, directory), { recursive: true });
    }
    fs.cpSync(path.join(ROOT, "skills/reuse-registry.md"), path.join(packageRoot, "skills/reuse-registry.md"));
    fs.cpSync(path.join(ROOT, "THIRD_PARTY_NOTICES.md"), path.join(packageRoot, "THIRD_PARTY_NOTICES.md"));
    const source = path.join(packageRoot, "workflows/build-prd/SKILL.md");
    const hardlink = path.join(packageRoot, "workflows/build-prd/SKILL-copy.md");
    fs.linkSync(source, hardlink);

    await expect(buildSkillBundleRelease({ packageRoot, outputDir }))
      .rejects.toThrow(/hard-linked/);
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



test("carries the canonical shared definitions owner through the runner import closure", async () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-runner-canonical-utils-"));
  const skillBundleRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-runner-canonical-utils-skill-"));
  temps.push(outputDir, skillBundleRoot);
  const skillBundleManifest = await buildSkillBundleRelease({ packageRoot: ROOT, outputDir: skillBundleRoot });
  const manifest = await buildRunnerRelease({ packageRoot: ROOT, outputDir });
  expect(validateRunnerRelease({ releaseRoot: outputDir, skillBundleManifest })).toEqual(manifest);
  const released = new Set(manifest.files.map((entry) => entry.path));
  const canonicalUtils = "runtime/evidence/canonical-utils.mjs";
  // The shared SHA-256 grammar owner is carried by the static import closure of
  // the runner, so consumers must not hand-add it as a cross-directory bundle file.
  expect(released.has(canonicalUtils), `${canonicalUtils} must be inside the runner import closure`).toBe(true);
  const bundlePath = path.join(outputDir, canonicalUtils);
  expect(fs.existsSync(bundlePath)).toBe(true);
  expect(fs.readFileSync(bundlePath, "utf8")).toContain("export const SHA256_HEX");
  for (const skillName of ["wh-review", "mini-task"]) {
    const bundle = JSON.parse(fs.readFileSync(path.join(ROOT, `skills/${skillName}/skill-bundle.json`), "utf8"));
    for (const entry of bundle.files) {
      expect(entry.path.includes(".."), `${skillName} bundle must not reach outside its own directory: ${entry.path}`).toBe(false);
      expect(entry.path.startsWith("runtime/"), `${skillName} bundle must not declare runtime bytes: ${entry.path}`).toBe(false);
    }
  }
});

test.each(["missing", "tampered"])("P5 released workflow source rejects %s bytes after a valid baseline", async (mutation) => {
  const releaseRoot = fs.mkdtempSync(path.join(os.tmpdir(), "workflowhub-p5-release-source-"));
  temps.push(releaseRoot);
  const locator = "workflows/build-plan/steps.json";
  const target = path.join(releaseRoot, locator);
  const manifest = await buildSkillBundleRelease({ packageRoot: ROOT, outputDir: releaseRoot });
  expect(validateSkillBundleRelease({ releaseRoot })).toEqual(manifest);
  if (mutation === "missing") fs.rmSync(target);
  else fs.appendFileSync(target, "\n ");
  expect(() => validateSkillBundleRelease({ releaseRoot })).toThrow(mutation === "missing" ? /missing or unsafe/ : /hash mismatch/);
  expect(fs.existsSync(path.join(releaseRoot, "node_modules"))).toBe(false);
});
