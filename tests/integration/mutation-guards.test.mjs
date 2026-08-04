import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { evaluateFactFreshness, sha256 } from "../../runtime/evidence/freshness.mjs";
import { STAGE_PREDICATES, assertStageCompleted, deriveStageCompletion } from "../../runtime/stage/completion-predicates.mjs";
import { buildSkillBundleRelease } from "../../runtime/distribution/skill-bundle-release.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const FIXTURES = resolve(ROOT, "tests/fixtures/mutations");

function fixture(name) {
  return JSON.parse(readFileSync(join(FIXTURES, `${name}.json`), "utf8"));
}

function observations(stage) {
  return Object.entries(STAGE_PREDICATES[stage]).map(([subject, kind], index) => ({
    fact: {
      ref: `quality/${stage}-${subject}.json`,
      value: { task_id: "task", stage, material_revision: "revision", snapshot_tree: "tree", kind, subject, status: "passed", fact_id: `fact-${index}` },
    },
    freshness: { status: "current" },
    authenticated: true,
  }));
}

describe("five mutation guards reject stale, incomplete, polluted facts", () => {
  it("rejects an identity/tree hash mutation as stale", () => {
    const descriptor = fixture("identity-tree-hash");
    expect(descriptor.expected).toBe("stale");
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
    const fact = {
      ref: "quality/fact-identity.json",
      sha256: sha256(raw),
      material_revision: "revision-a",
      snapshot_tree: "tree-a",
      kind: "test",
      subject: "risk_tests_fresh",
      status: "passed",
      task_id: "task",
      stage: "build-code",
      fact_id: "fact-identity",
      evidence: [],
    };
    const result = evaluateFactFreshness(fact, { material_revision: "revision-a", snapshot_tree: "tree-b" }, { read: () => raw });
    expect(result.status).toBe("stale");
    expect(result.authenticated).toBe(false);
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
    const facts = observations("verify-code").map((entry) => entry.fact.value.subject === "human_confirmation"
      ? { ...entry, authenticated: false }
      : entry);
    expect(deriveStageCompletion("verify-code", facts).missing).toContain("human_confirmation");
  });

  it("excludes test pollution from the published Skill Bundle", async () => {
    expect(fixture("bundle-pollution").expected).toContain("exclude");
    const packageRoot = mkdtempSync(join(tmpdir(), "workflowhub-mutation-package-"));
    const outputDir = mkdtempSync(join(tmpdir(), "workflowhub-mutation-release-"));
    try {
      cpSync(join(ROOT, "workflows"), join(packageRoot, "workflows"), { recursive: true });
      cpSync(join(ROOT, "skills"), join(packageRoot, "skills"), { recursive: true });
      cpSync(join(ROOT, "runtime/schemas"), join(packageRoot, "runtime/schemas"), { recursive: true });
      const manifestPath = join(packageRoot, "skills/wh-review/skill-bundle.json");
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      manifest.files = [...manifest.files, "tests/fixtures/polluted.mjs"];
      writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
      const pollutedPath = join(packageRoot, "skills/wh-review/tests/fixtures/polluted.mjs");
      mkdirSync(dirname(pollutedPath), { recursive: true });
      writeFileSync(pollutedPath, "export const polluted = true;\n");
      const release = await buildSkillBundleRelease({ packageRoot, outputDir });
      expect(release.files.some(({ path }) => path.includes("tests/"))).toBe(false);
      const published = JSON.parse(readFileSync(join(outputDir, "skills/wh-review/skill-bundle.json"), "utf8"));
      expect(published.files.some((entry) => (typeof entry === "string" ? entry : entry.path).includes("tests/"))).toBe(false);
    } finally {
      rmSync(packageRoot, { recursive: true, force: true });
      rmSync(outputDir, { recursive: true, force: true });
    }
  });
});
