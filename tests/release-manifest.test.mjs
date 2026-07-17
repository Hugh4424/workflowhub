import { describe, expect, it } from "vitest";
import { loadPhaseCapability } from "./helpers/side-effect-snapshot.mjs";

const artifact = (ref, digit) => ({ ref, sha256: digit.repeat(64) });
const manifest = {
  schema_id: "https://workflowhub.dev/schemas/release-manifest.v1.schema.json",
  schema_version: "1.0.0",
  release_version: "1.0.0",
  release_kind: "preview",
  runtime: artifact("artifacts/runtime.tar.gz", "a"),
  skills: Array.from({ length: 6 }, (_, index) => artifact(`artifacts/skills/skill-${index}.tar.gz`, `${index}`)),
  adapter: artifact("artifacts/adapters/multica.tar.gz", "b"),
  lock: artifact("artifacts/multica-skills-lock.json", "c"),
  contract_set: artifact("artifacts/contracts-v1.tar.gz", "d"),
  created_at: "2026-07-17T00:00:00.000Z",
};

const thinSkills = ["orchestrator", "make-decision", "build-spec", "build-plan", "build-code", "verify-code"].map((name) => ({
  name,
  version: "1.0.0",
  files: { "SKILL.md": `---\nname: ${name}\n---\nInvoke WorkflowHub public CLI with canonical refs.\n` },
}));

describe("AC-013 immutable release manifest", () => {
  it("hashes artifacts, then a schema-valid canonical manifest, then external sidecar", async () => {
    const build = await loadPhaseCapability("../scripts/build-release.mjs", "buildReleaseManifest");
    const release = build({ manifest });
    expect(release.manifest).toMatchObject({ schema_id: manifest.schema_id, schema_version: "1.0.0", contract_set: manifest.contract_set });
    expect(release.manifest).not.toHaveProperty("manifest_hash");
    expect(release.sidecar.manifest_sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it.each([
    ["runtime artifact", { observed: { ...manifest, runtime: artifact(manifest.runtime.ref, "f") } }],
    ["lock artifact", { observed: { ...manifest, lock: artifact(manifest.lock.ref, "f") } }],
    ["adapter artifact", { observed: { ...manifest, adapter: artifact(manifest.adapter.ref, "f") } }],
    ["skill artifact", { observed: { ...manifest, skills: manifest.skills.map((entry, index) => index === 2 ? artifact(entry.ref, "f") : entry) } }],
    ["contract set", { observed: { ...manifest, contract_set: artifact(manifest.contract_set.ref, "f") } }],
    ["manifest content", { observed: { ...manifest, release_version: "1.0.1" } }],
  ])("doctor rejects %s mutation", async (_label, mutation) => {
    const doctor = await loadPhaseCapability("../scripts/build-release.mjs", "doctorReleaseManifest");
    expect(() => doctor({ manifest, sidecar: { manifest_sha256: "e".repeat(64) }, ...mutation })).toThrow(/hash|manifest|artifact|contract/i);
  });
});

describe("AC-020 six thin Skill packages", () => {
  it("accepts exactly six portable packages that only invoke the public CLI", async () => {
    const assertThin = await loadPhaseCapability("../scripts/build-release.mjs", "assertThinSkillPackages");
    expect(assertThin(thinSkills)).toMatchObject({ ok: true, count: 6 });
  });

  it.each([
    ["runtime copy", { "runtime/stage-runner.mjs": "export const copied = true;" }],
    ["business repository path", { "SKILL.md": "Read /Users/example/Product/private.json" }],
    ["canonical writer", { "writer.mjs": "import '../../core/task-handle.mjs';" }],
    ["cross-stage execution", { "SKILL.md": "Directly execute build-code while assigned build-spec." }],
  ])("rejects a package containing %s", async (_label, forbiddenFiles) => {
    const assertThin = await loadPhaseCapability("../scripts/build-release.mjs", "assertThinSkillPackages");
    const packages = thinSkills.map((entry, index) => index === 2 ? { ...entry, files: { ...entry.files, ...forbiddenFiles } } : entry);
    expect(() => assertThin(packages)).toThrow(/runtime|business|path|writer|stage|thin/i);
  });
});
