import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { authenticateQualityFactRecord, sha256 } from "../../runtime/evidence/freshness.mjs";
import { STAGE_PREDICATES, assertStageCompleted, deriveStageCompletion } from "../../runtime/stage/completion-predicates.mjs";
import crypto from "node:crypto";
import { buildSkillBundleRelease } from "../../runtime/distribution/skill-bundle-release.mjs";
import { validateSkillBundle } from "../../runtime/adapters/local-skill-resolver.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const FIXTURES = resolve(ROOT, "tests/fixtures/mutations");

function fixture(name) {
  return JSON.parse(readFileSync(join(FIXTURES, `${name}.json`), "utf8"));
}

function observations(stage) {
  return Object.entries(STAGE_PREDICATES[stage]).map(([subject, kind], index) => ({
    fact: {
      ref: `quality/${stage}-${subject}.json`,
      value: { task_id: "task", stage, material_revision: "revision", snapshot_tree: "tree", kind, subject, status: kind === "review" ? "recorded" : "passed", fact_id: `fact-${index}` },
    },
    freshness: { status: "current" },
    authenticated: true,
    ...(stage === "verify-code" && subject === "code_review" ? { review_status: "clean" } : {}),
  }));
}

describe("five mutation guards reject stale, incomplete, polluted facts", () => {
  it("rejects a fact whose recorded bytes do not match its own hash", () => {
    // The freshness/currentness invalidation chain was removed, so a later
    // material edit is no longer an invalidation signal. Fact-level integrity
    // is still mandatory: a record whose bytes do not match its recorded hash,
    // or whose ref is not the digest-addressed canonical path, must not
    // authenticate.
    const descriptor = fixture("identity-tree-hash");
    expect(descriptor.mutation).toBe("identity-tree-hash");
    const raw = JSON.stringify({
      schema_version: "quality-fact.v1",
      fact_id: "fact-identity",
      task_id: "task",
      stage: "build-code",
      material_revision: "revision-a",
      snapshot_tree: "tree-a",
      kind: "test",
      subject: "risk_tests_fresh",
      status: "passed",
    });
    const mismatched = authenticateQualityFactRecord({
      ref: "quality/fact-identity.json",
      sha256: sha256("different bytes"),
      material_revision: "revision-a",
      snapshot_tree: "tree-a",
    }, { read: () => raw });
    expect(mismatched.authenticated).toBe(false);
    expect(mismatched.status).toBe("unavailable");
  });

  it("rejects missing stage completion", () => {
    expect(fixture("missing-completion").expected).toBe("reject");
    expect(() => assertStageCompleted("build-code", [])).toThrow(/build-code incomplete/);
  });

  it("rejects a failed major review instead of treating it as complete", () => {
    expect(fixture("review-major").expected).toBe("reject");
    const facts = observations("build-code").map((entry) => entry.fact.value.subject === "integration_review"
      ? { ...entry, fact: { ...entry.fact, value: { ...entry.fact.value, status: "failed" } } }
      : entry);
    expect(deriveStageCompletion("build-code", facts).missing).toContain("integration_review");
  });

  it("rejects an unauthenticated human confirmation", () => {
    expect(fixture("confirmation-authorization").expected).toBe("reject");
    const baseline = observations("build-plan");
    expect(deriveStageCompletion("build-plan", baseline).status).toBe("completed");
    const facts = baseline.map((entry) => entry.fact.value.subject === "human_confirmation"
      ? { ...entry, authenticated: false }
      : entry);
    expect(deriveStageCompletion("build-plan", facts).missing).toEqual(["human_confirmation"]);
  });

  it("rejects test pollution before publishing the Skill Bundle", async () => {
    expect(fixture("bundle-pollution").expected).toContain("reject");
    const packageRoot = mkdtempSync(join(tmpdir(), "workflowhub-mutation-package-"));
    const outputDir = mkdtempSync(join(tmpdir(), "workflowhub-mutation-release-"));
    try {
      for (const directory of ["config", "core", "runtime", "skills", "workflows"]) {
        cpSync(join(ROOT, directory), join(packageRoot, directory), { recursive: true });
      }
      cpSync(join(ROOT, "skills/reuse-registry.md"), join(packageRoot, "skills/reuse-registry.md"));
      cpSync(join(ROOT, "THIRD_PARTY_NOTICES.md"), join(packageRoot, "THIRD_PARTY_NOTICES.md"));
      // Normalize only copied metadata for the three already changed skills;
      // production closure remains independently checked against ROOT.
      for (const name of ["spec-plan", "spec-tasks", "wh-review"]) {
        const file = join(packageRoot, "skills", name, "skill-bundle.json");
        const value = JSON.parse(readFileSync(file, "utf8"));
        for (const entry of value.files) {
          if (typeof entry === "object") entry.sha256 = crypto.createHash("sha256")
            .update(readFileSync(join(packageRoot, "skills", name, entry.path))).digest("hex");
        }
        writeFileSync(file, JSON.stringify(value));
        const { bundleHash } = validateSkillBundle(packageRoot, `skills/${name}/skill-bundle.json`, `skills/${name}/SKILL.md`);
        const catalogFile = join(packageRoot, "skills/catalog.yaml");
        writeFileSync(catalogFile, readFileSync(catalogFile, "utf8").replace(
          new RegExp(`(  - name: ${name}[\\s\\S]*?local_bundle_hash: )\\S+`), `$1${bundleHash}`,
        ));
      }
      const manifestPath = join(packageRoot, "skills/wh-review/skill-bundle.json");
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      manifest.files = [...manifest.files, "tests/fixtures/polluted.mjs"];
      writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
      const pollutedPath = join(packageRoot, "skills/wh-review/tests/fixtures/polluted.mjs");
      mkdirSync(dirname(pollutedPath), { recursive: true });
      writeFileSync(pollutedPath, "export const polluted = true;\n");
      const { bundleHash } = validateSkillBundle(packageRoot, "skills/wh-review/skill-bundle.json", "skills/wh-review/SKILL.md");
      const catalogPath = join(packageRoot, "skills/catalog.yaml");
      const catalog = readFileSync(catalogPath, "utf8");
      const updatedCatalog = catalog.replace(
        /(  - name: wh-review[\s\S]*?local_bundle_hash: )\S+/,
        `$1${bundleHash}`,
      );
      writeFileSync(catalogPath, updatedCatalog);
      await expect(buildSkillBundleRelease({ packageRoot, outputDir }))
        .rejects.toThrow(/forbidden path/);
      expect(existsSync(join(outputDir, "skill-bundle.json"))).toBe(false);
      expect(readdirSync(outputDir)).toEqual([]);
    } finally {
      rmSync(packageRoot, { recursive: true, force: true });
      rmSync(outputDir, { recursive: true, force: true });
    }
  });
});
