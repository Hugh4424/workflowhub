import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  TEST_RUNTIME_PROFILE_LIMITS_MS,
  validateTestRuntimeProfile,
} from "../../runtime/stage/stage-content-contracts.mjs";

const permissions = {
  network: "deny",
  db: "deny",
  filesystem: "deny",
  subprocess: "deny",
  environment: "local_ci",
};

function innerProfile(overrides = {}) {
  return {
    runtime_profile: "inner",
    ceiling_ms: TEST_RUNTIME_PROFILE_LIMITS_MS.inner,
    permissions: { ...permissions, ...(overrides.permissions ?? {}) },
    executor_id: "inner-contract-test",
    ...overrides,
  };
}

describe("S3 inner acceptance boundary", () => {
  it("keeps the inner profile hermetic and tied to the runtime contract", () => {
    const value = innerProfile();
    const result = validateTestRuntimeProfile(value, { declarationOnly: true });

    expect(result.errors).toEqual([]);
    expect(value.ceiling_ms).toBe(TEST_RUNTIME_PROFILE_LIMITS_MS.inner);
    expect(value.permissions).toMatchObject({
      network: "deny",
      db: "deny",
      filesystem: "deny",
      subprocess: "deny",
      environment: "local_ci",
    });
  });

  it.each(["network", "db", "filesystem", "subprocess"])(
    "rejects a real %s permission in an inner declaration",
    (capability) => {
      const result = validateTestRuntimeProfile(innerProfile({ permissions: { [capability]: "localhost_only" } }), { declarationOnly: true });
      expect(result.ok).toBe(false);
      expect(result.errors.join(" ")).toMatch(new RegExp(`${capability}|permission|inner`, "i"));
    },
  );

  it("does not self-authenticate an inner wrapper or turn a pure command into capability proof", () => {
    const evidence = `quality/tests/p1-inner-contract-${process.pid}.json`;
    try {
      execFileSync(process.execPath, [
        "tools/cli/run-checks.mjs",
        "--runtime-profile=inner",
        `--evidence-path=${evidence}`,
        "--",
        process.execPath,
        "-e",
        "process.stdout.write('inner-pure-ok')",
      ], { cwd: process.cwd(), encoding: "utf8" });
      const value = JSON.parse(readFileSync(evidence, "utf8"));
      expect(value.runtime_profile).toBe("inner");
      expect(value.runtime_profile_status).toBe("unavailable");
      expect(value.runtime_profile_authenticated).toBe(false);
      expect(value.capability_proof.status).toBe("unavailable");
      expect(existsSync(evidence)).toBe(true);
    } finally {
      rmSync(evidence, { force: true });
    }
  });
});

