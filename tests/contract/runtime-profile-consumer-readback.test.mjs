import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { profileForExecutor } from "../../tools/cli/run-checks.mjs";
import {
  TEST_RUNTIME_PROFILE_LIMITS_MS,
  TEST_RUNTIME_PROFILE_NAMES,
} from "../../runtime/stage/stage-content-contracts.mjs";
import { routeTests } from "../../skills/test-routing-advisor/scripts/route.mjs";
import {
  loadMeasurementInputs,
  measureRuntimeProfile,
  nearestRankP95,
  writePerformanceReceipt,
} from "../../tools/cli/measure-test-runtime-profile.mjs";

const roots = [];
const permissions = {
  network: "deny",
  db: "deny",
  filesystem: "deny",
  subprocess: "deny",
  environment: "local_ci",
};

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop(), { recursive: true, force: true });
});

function profile(name) {
  return {
    runtime_profile: name,
    ceiling_ms: TEST_RUNTIME_PROFILE_LIMITS_MS[name],
    run_location: name === "inner" ? "local_hermetic" : "local_phase",
    permissions: name === "inner" ? permissions : {
      network: "localhost_only",
      db: "localhost_only",
      filesystem: "worktree_temp_only",
      subprocess: "explicit_only",
      environment: "local_ci",
    },
    executor_id: "consumer-readback-test",
  };
}

function measurementFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-profile-readback-")));
  roots.push(root);
  const innerCommand = [process.execPath, "-e", "setTimeout(()=>process.stdout.write('inner'),30)"];
  const mediumCommand = [process.execPath, "-e", "process.stderr.write('medium')"];
  const profilePath = join(root, "profile.json");
  const innerManifestPath = join(root, "inner.json");
  const mediumManifestPath = join(root, "medium.json");
  const outputPath = join(root, "S3.json");
  writeFileSync(profilePath, `${JSON.stringify({
    schema_version: "workflowhub-test-runtime-profile.v1",
    worker_ceiling: 2,
    worker_ceiling_source: "test-routing-advisor-resolved-profile",
    capability_observation: {
      status: "observed",
      counts: { network: 0, db: 0, filesystem: 0, subprocess: 0, environment: 0 },
      source: "unverified-test-fixture",
    },
    profiles: { inner: profile("inner"), medium: profile("medium") },
  }, null, 2)}\n`);
  writeFileSync(innerManifestPath, `${JSON.stringify({
    runtime_profile: "inner",
    worker_ceiling: 2,
      members: [
        { id: "inner-a", file: "inner-a.test.mjs", argv: innerCommand, cwd: process.cwd() },
        { id: "inner-b", file: "inner-b.test.mjs", argv: innerCommand, cwd: process.cwd() },
        { id: "inner-c", file: "inner-c.test.mjs", argv: innerCommand, cwd: process.cwd() },
      ],
  }, null, 2)}\n`);
  writeFileSync(mediumManifestPath, `${JSON.stringify({
    runtime_profile: "medium",
    worker_ceiling: 2,
    members: [{ id: "medium-contract", file: "medium-contract.test.mjs", argv: mediumCommand, cwd: process.cwd() }],
  }, null, 2)}\n`);
  return { root, profilePath, innerManifestPath, mediumManifestPath, outputPath };
}

describe("S3 runtime profile consumer readback", () => {
  it("keeps the route advisor orthogonal and run-checks on the single runtime ceiling source", () => {
    expect(TEST_RUNTIME_PROFILE_NAMES).toEqual(["inner", "medium", "large"]);
    expect(routeTests({ changed_files: ["tests/contract/runtime-profile-consumer-readback.test.mjs"] }).routing_tier).toBe("feature");
    expect(profileForExecutor("inner", []).ceiling_ms).toBe(TEST_RUNTIME_PROFILE_LIMITS_MS.inner);
    expect(profileForExecutor("medium", []).ceiling_ms).toBe(TEST_RUNTIME_PROFILE_LIMITS_MS.medium);
    const source = readFileSync(new URL("../../tools/cli/run-checks.mjs", import.meta.url), "utf8");
    expect(source).toContain("TEST_RUNTIME_PROFILE_LIMITS_MS");
    const duplicatedThresholds = new RegExp(`\\{\\s*inner:\\s*${TEST_RUNTIME_PROFILE_LIMITS_MS.inner}\\s*,\\s*medium:\\s*${TEST_RUNTIME_PROFILE_LIMITS_MS.medium}\\s*\\}`);
    expect(source).not.toMatch(duplicatedThresholds);
  });

  it("rejects a manifest that aliases one file under multiple member ids", () => {
    const fixture = measurementFixture();
    const manifest = JSON.parse(readFileSync(fixture.innerManifestPath, "utf8"));
    manifest.members[1].file = manifest.members[0].file;
    writeFileSync(fixture.innerManifestPath, `${JSON.stringify(manifest)}\n`);
    expect(() => loadMeasurementInputs(fixture)).toThrow(/file is duplicated/i);
  });

  it("reads pinned profile/member manifests, hashes them, and measures fresh independent processes", async () => {
    const fixture = measurementFixture();
    const inputs = loadMeasurementInputs(fixture);
    expect(inputs.profiles.inner.ceiling_ms).toBe(TEST_RUNTIME_PROFILE_LIMITS_MS.inner);
    expect(inputs.profiles.medium.ceiling_ms).toBe(TEST_RUNTIME_PROFILE_LIMITS_MS.medium);
    expect(inputs.profiles.inner.worker_ceiling).toBe(2);
    expect(inputs.profiles.inner.capability_observation.status).toBe("incomplete");
    expect(inputs.manifests.inner.members).toHaveLength(3);
    expect(inputs.manifests.inner.manifest_sha256).toMatch(/^[a-f0-9]{64}$/);

    const receipt = await measureRuntimeProfile({ ...fixture, runs: 5 });
    expect(receipt.status).toBe("incomplete");
    expect(receipt.result).toBe("incomplete");
    expect(receipt.profile_source.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(receipt.cache_policy.os_page_cache).toBe("not_cleared");
    expect(receipt.groups.inner_files).toHaveLength(3);
    expect(receipt.groups.inner_files[0].runs).toHaveLength(5);
    expect(receipt.groups.inner_files[0].runs[0].cold_observation).toBe(true);
    expect(receipt.groups.inner_files[0].runs.slice(1).every((run) => run.cold_observation === false)).toBe(true);
    expect(receipt.groups.inner_collection.runs).toHaveLength(5);
    expect(receipt.groups.inner_collection.runs[0].cold_observation).toBe(true);
    expect(receipt.groups.medium_collection.runs).toHaveLength(5);
    expect(receipt.groups.inner_collection.runs.every((run) => run.actual_workers <= 2)).toBe(true);
    expect(receipt.groups.inner_collection.runs.some((run) => run.overlap_observed)).toBe(true);
    expect(receipt.capability_observations.inner.status).toBe("incomplete");
    expect(receipt.limitations.join(" ")).toMatch(/capability|incomplete/i);
    const rawStdout = receipt.groups.inner_files[0].runs[0];
    expect(createHash("sha256").update(readFileSync(rawStdout.stdout_ref)).digest("hex")).toBe(rawStdout.stdout_hash);
  });

  it("publishes a performance receipt immutably", () => {
    const fixture = measurementFixture();
    const receipt = { schema_version: "workflowhub-performance-profile.v1", status: "incomplete" };
    writePerformanceReceipt(fixture.outputPath, receipt);
    expect(() => writePerformanceReceipt(fixture.outputPath, { ...receipt, status: "passed" })).toThrow(/exist|occupied/i);
    expect(JSON.parse(readFileSync(fixture.outputPath, "utf8"))).toEqual(receipt);
  });

  it("uses nearest-rank p95, where five samples make p95 the maximum", () => {
    expect(nearestRankP95([12, 2, 9, 7, 4])).toBe(12);
    expect(() => nearestRankP95([])).toThrow(/sample/i);
  });
});
