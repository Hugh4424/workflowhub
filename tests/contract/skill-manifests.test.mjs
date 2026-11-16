// ORACLE-VERSIONED-RELEASE two manifest classes: the repository manifest is a
// projection of the real catalog/reuse inputs, the external manifest is the one
// hand-maintained source. A changed named version/source row must be rejected.
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { afterEach, describe, expect, it } from "vitest";
import { createTrackedTempDir } from "../../runtime/interface/temp-dir.mjs";
import { checkSkillManifests, projectRepoSkills, validateExternalSkillsManifest } from "../../tools/cli/build-skill-manifests.mjs";

const source = fileURLToPath(new URL("../..", import.meta.url));
const dirs = [];
afterEach(() => { for (const dir of dirs.splice(0).reverse()) dir.dispose(); });

const COPIED = [
  "skills/catalog.yaml",
  "skills/reuse-registry.md",
  "repo-skills.manifest.json",
  "external-skills.manifest.json",
  "docs/external-skills-compat-matrix.md",
];

function fixture() {
  const lifetime = createTrackedTempDir("wh-c10-manifests-");
  dirs.push(lifetime);
  const root = lifetime.path;
  const catalog = yaml.load(readFileSync(join(source, "skills/catalog.yaml"), "utf8"));
  const projection = projectRepoSkills({ packageRoot: source });
  const reused = projection.reuse_entries.map((entry) => entry.entry);
  for (const relative of [...COPIED, ...catalog.skills.map((skill) => skill.path).filter(Boolean), ...reused]) {
    const target = join(root, relative);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(join(source, relative), target);
  }
  return root;
}

function rewrite(root, relative, change) {
  const target = join(root, relative);
  const value = JSON.parse(readFileSync(target, "utf8"));
  change(value);
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

describe("ORACLE-VERSIONED-RELEASE repository manifest projection", () => {
  it("matches the real catalog and reuse registry, and every named source is readable", () => {
    const result = checkSkillManifests({ packageRoot: source });
    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
    const projection = projectRepoSkills({ packageRoot: source });
    const catalog = yaml.load(readFileSync(join(source, "skills/catalog.yaml"), "utf8"));
    expect(projection.skills).toHaveLength(catalog.skills.length);
    expect(projection.skills.map((skill) => skill.name)).toEqual(catalog.skills.map((skill) => skill.name).sort());
    expect(projection.reuse_entries.length).toBeGreaterThan(0);
    expect(projection.derived_from).toMatchObject({ catalog: "skills/catalog.yaml", reuse_registry: "skills/reuse-registry.md" });
  });

  it("rejects a changed named local version and a changed upstream source row", () => {
    const versionRoot = fixture();
    rewrite(versionRoot, "repo-skills.manifest.json", (manifest) => {
      manifest.skills.find((skill) => skill.name === "stage-close").local_version = "9.9.9";
    });
    const version = checkSkillManifests({ packageRoot: versionRoot });
    expect(version.ok).toBe(false);
    expect(version.failures.join("\n")).toMatch(/stage-close/);
    expect(version.failures.join("\n")).toMatch(/local_version/);

    const sourceRoot = fixture();
    rewrite(sourceRoot, "repo-skills.manifest.json", (manifest) => {
      const adopted = manifest.skills.find((skill) => skill.name === "anysearch");
      adopted.upstream[0].commit = "0".repeat(40);
    });
    const changedSource = checkSkillManifests({ packageRoot: sourceRoot });
    expect(changedSource.ok).toBe(false);
    expect(changedSource.failures.join("\n")).toMatch(/anysearch/);
    expect(changedSource.failures.join("\n")).toMatch(/upstream/);
  });

  it("rejects a catalog version change that the on-disk projection did not follow", () => {
    const root = fixture();
    const catalogPath = join(root, "skills/catalog.yaml");
    writeFileSync(catalogPath, readFileSync(catalogPath, "utf8").replace("local_version: 1.1.0", "local_version: 1.2.0"));
    const result = checkSkillManifests({ packageRoot: root });
    expect(result.ok).toBe(false);
    expect(result.failures.join("\n")).toMatch(/catalog|diff/i);
  });
});

describe("ORACLE-VERSIONED-RELEASE external manifest validation", () => {
  it("accepts the current single hand-maintained source with honest unknown rights", () => {
    const bytes = readFileSync(join(source, "external-skills.manifest.json"), "utf8");
    const result = validateExternalSkillsManifest({ packageRoot: source, value: JSON.parse(bytes) });
    expect(result.failures).toEqual([]);
    const manifest = JSON.parse(bytes);
    expect(manifest.entries.length).toBeGreaterThanOrEqual(5);
    for (const entry of manifest.entries) {
      expect(entry.rights, `${entry.id} must not claim a grant`).toBe("unknown");
      expect(entry.source).toMatch(/^https:\/\//);
    }
  });

  it("rejects a broken version, a broken source pointer, a fabricated grant and a dead matrix pointer", () => {
    const base = JSON.parse(readFileSync(join(source, "external-skills.manifest.json"), "utf8"));
    const clone = () => JSON.parse(JSON.stringify(base));
    const version = clone(); version.entries[0].version = "latest";
    expect(validateExternalSkillsManifest({ packageRoot: source, value: version }).failures.join("\n")).toMatch(/version/);
    const sourcePointer = clone(); sourcePointer.entries[0].source = "repo-internal-copy";
    expect(validateExternalSkillsManifest({ packageRoot: source, value: sourcePointer }).failures.join("\n")).toMatch(/source/);
    const grant = clone(); grant.entries[0].rights = "MIT";
    expect(validateExternalSkillsManifest({ packageRoot: source, value: grant }).failures.join("\n")).toMatch(/rights/);
    const deadMatrix = clone(); deadMatrix.entries[0].matrix_ref = "docs/external-skills-compat-matrix.md#absent-section";
    expect(validateExternalSkillsManifest({ packageRoot: source, value: deadMatrix }).failures.join("\n")).toMatch(/matrix_ref/);
  });

  it("runs the same validator from the --check CLI and exits nonzero on a bad external row", () => {
    const clean = spawnSync(process.execPath, ["tools/cli/build-skill-manifests.mjs", "--check"], {
      cwd: source, encoding: "utf8", timeout: 60000,
    });
    expect(clean.status, clean.stderr).toBe(0);
    expect(clean.stdout).toMatch(/manifest/i);

    const root = fixture();
    rewrite(root, "external-skills.manifest.json", (manifest) => { manifest.entries[0].version = "not-a-version"; });
    const broken = spawnSync(process.execPath, [join(source, "tools/cli/build-skill-manifests.mjs"), "--check", `--root=${root}`], {
      encoding: "utf8", timeout: 60000,
    });
    expect(broken.status).not.toBe(0);
    expect(broken.stderr).toMatch(/version/);
  });
});
