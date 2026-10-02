import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildRunnerRelease, validateRunnerRelease } from "../../runtime/distribution/runner-release.mjs";
import { buildSkillBundleRelease, validateSkillBundleRelease } from "../../runtime/distribution/skill-bundle-release.mjs";
import { listDeliveryFiles } from "../../tools/architecture/inventory.mjs";

const LEGACY_ENTRY_PATHS = Object.freeze([
  "core/legacy-reader.mjs",
  "tools/migrations/import-legacy-task.mjs",
  "schemas/legacy-import.v1.json",
  "tests/integration/legacy-import-proof.test.mjs",
  "tests/fixtures/legacy-supported.json",
  "tests/fixtures/legacy-missing-identity.json",
  "tests/fixtures/legacy-hash-conflict.json",
  "tests/fixtures/legacy-current-conflict.json",
  "tests/fixtures/legacy-unknown-source.json",
]);

const LEGACY_ENTRY_TOKENS = Object.freeze([
  "core/legacy-reader.mjs",
  "tools/migrations/import-legacy-task.mjs",
  "schemas/legacy-import.v1.json",
  "normalizeLegacyTask",
]);

const HISTORICAL_PROOF_PATHS = new Set([
  "docs/architecture/legacy-task-inventory.json",
  "docs/architecture/legacy-import-proof.json",
  "tools/architecture/verify-migration-proof.mjs",
]);

const DELIVERY_ROOTS = Object.freeze([
  "core/",
  "scripts/",
  "schemas/",
  "skills/",
  "workflows/",
  "runtime/",
]);

function sourceFiles() {
  return listDeliveryFiles().filter((path) => DELIVERY_ROOTS.some((root) => path.startsWith(root)));
}

function assertLegacyFreeFiles(paths) {
  const violations = [];
  for (const path of paths) {
    if (HISTORICAL_PROOF_PATHS.has(path)) continue;
    const text = readFileSync(path, "utf8");
    violations.push(...legacyTokenViolations(path, text));
  }
  return violations;
}

function legacyTokenViolations(path, text) {
  return LEGACY_ENTRY_TOKENS
    .filter((token) => text.includes(token))
    .map((token) => `${path}: ${token}`);
}

async function buildReleases() {
  const root = mkdtempSync(join(tmpdir(), "workflowhub-legacy-zero-"));
  const runnerRoot = join(root, "runner");
  const bundleRoot = join(root, "bundle");
  try {
    const runner = await buildRunnerRelease({ packageRoot: process.cwd(), outputDir: runnerRoot });
    const bundle = await buildSkillBundleRelease({ packageRoot: process.cwd(), outputDir: bundleRoot });
    const bundleManifest = validateSkillBundleRelease({ releaseRoot: bundleRoot });
    const runnerManifest = validateRunnerRelease({ releaseRoot: runnerRoot, skillBundleManifest: bundleManifest });
    const releaseFiles = [
      ...bundleManifest.files.map(({ path }) => ({
        path: `bundle/${path}`,
        text: readFileSync(join(bundleRoot, path), "utf8"),
      })),
      ...runnerManifest.files.map(({ path }) => ({
        path: `runner/${path}`,
        text: readFileSync(join(runnerRoot, path), "utf8"),
      })),
    ];
    return { runner, bundle, releaseFiles };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe("final legacy-zero contract", () => {
  it("keeps the exact legacy importer/scaffold entry set absent", () => {
    const files = new Set(listDeliveryFiles());
    expect(LEGACY_ENTRY_PATHS.filter((path) => files.has(path))).toEqual([]);
    expect(assertLegacyFreeFiles(sourceFiles())).toEqual([]);
  });

  it("publishes clean Bundle and Runner releases without legacy entry paths or tokens", async () => {
    const { runner, bundle, releaseFiles } = await buildReleases();
    expect(runner.files.map(({ path }) => path).filter((path) => LEGACY_ENTRY_PATHS.includes(path))).toEqual([]);
    expect(bundle.files.map(({ path }) => path).filter((path) => LEGACY_ENTRY_PATHS.includes(path))).toEqual([]);
    expect(releaseFiles.flatMap(({ path, text }) => legacyTokenViolations(path, text))).toEqual([]);
  });

  it("keeps telemetry persistence separate from the removed legacy writer", () => {
    const collector = readFileSync("metrics/collector.mjs", "utf8");
    expect(collector).toContain("FR-COLLECT-006/007");
    expect(collector).toContain("Dual-writes to task + global");
  });
});
