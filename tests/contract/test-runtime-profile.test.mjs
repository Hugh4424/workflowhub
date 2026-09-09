import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  TEST_RUNTIME_PROFILE_NAMES,
  validateTestRuntimeProfile,
} from "../../runtime/stage/stage-content-contracts.mjs";
import { captureWorkspaceSnapshot, createCanonicalReceiptWriter } from "../../runtime/evidence/canonical-receipt-writer.mjs";
import { validateCanonicalTestReceipt } from "../../runtime/evidence/canonical-evidence-validators.mjs";
import { createTask } from "../../runtime/task/task-handle.mjs";
import { openAcceptedWorkspace } from "../../runtime/task/workspace.mjs";

function realTaskFixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-profile-task-")));
  const repo = join(root, "repo");
  const worktree = join(root, "repo-profile-task");
  mkdirSync(repo);
  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: repo });
  writeFileSync(join(repo, "tracked.txt"), "base\\n");
  execFileSync("git", ["add", "tracked.txt"], { cwd: repo });
  execFileSync("git", ["commit", "-qm", "base"], { cwd: repo });
  const baseline = String(execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" })).trim();
  execFileSync("git", ["worktree", "add", "-q", "-b", "task/Demo/profile-task", worktree, baseline], { cwd: repo });
  const task = createTask({ storageRoot: root, manifest: { schema_version: "1.0.0", project_name: "Demo", task_id: "profile-task", created_at: new Date().toISOString(), target_repo_root: repo, issue_ids: [], inputs: {} } });
  return { root, task, workspace: openAcceptedWorkspace(task, { facts: { worktree_root: worktree, baseline_commit: baseline } }) };
}

const HASH = "a".repeat(64);
const OID = "b".repeat(40);
const CAPABILITY_PROOF = {
  status: "passed",
  executor_id: "run-checks",
  observations: [
    ["network", "localhost_only"], ["db", "localhost_only"], ["filesystem", "worktree_temp_only"],
    ["subprocess", "explicit_only"], ["environment", "local_ci"],
  ].map(([capability, decision]) => ({ capability, requested: decision, decision, observed: true, mechanism: "fixture", proof_ref: `quality/tests/proof-${capability}`, proof_hash: HASH })),
};

const PROFILE = {
  test_tier: "feature",
  runtime_profile: "medium",
  ceiling_ms: 300_000,
  permissions: {
    network: "localhost_only",
    db: "localhost_only",
    filesystem: "worktree_temp_only",
    subprocess: "explicit_only",
    environment: "local_ci",
  },
  executor_id: "run-checks",
  behavior_fingerprint: {
    before: { selection_hash: HASH, assertion_hash: HASH },
    after: { selection_hash: HASH, assertion_hash: HASH },
  },
};

function validProfile(overrides = {}) {
  return {
    ...PROFILE,
    ...overrides,
    permissions: { ...PROFILE.permissions, ...(overrides.permissions ?? {}) },
    behavior_fingerprint: {
      ...PROFILE.behavior_fingerprint,
      ...(overrides.behavior_fingerprint ?? {}),
    },
  };
}

describe("test runtime profile contract", () => {
  it("keeps test tier orthogonal to runtime profile and validates a complete medium profile", () => {
    expect(TEST_RUNTIME_PROFILE_NAMES).toEqual(["inner", "medium", "large"]);
    expect(validateTestRuntimeProfile(validProfile({ capability_proof: CAPABILITY_PROOF }))).toMatchObject({ ok: true, status: "ready" });
    expect(validateTestRuntimeProfile(validProfile({ test_tier: "simple", capability_proof: CAPABILITY_PROOF })).ok).toBe(true);
    expect(validateTestRuntimeProfile(validProfile({ runtime_profile: "inner", ceiling_ms: 60_000, permissions: {
      network: "deny", db: "deny", filesystem: "deny", subprocess: "deny", environment: "local_ci",
    }, capability_proof: { ...CAPABILITY_PROOF, observations: CAPABILITY_PROOF.observations.map((entry) => ({ ...entry, requested: entry.capability === "environment" ? "local_ci" : "deny", decision: entry.capability === "environment" ? "local_ci" : "deny" })) } })).ok).toBe(true);
  });

  it.each([
    ["inner", 60_001],
    ["medium", 300_001],
  ])("rejects %s profile over its duration ceiling", (runtime_profile, ceiling_ms) => {
    const result = validateTestRuntimeProfile(validProfile({ runtime_profile, ceiling_ms }));
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/ceiling|duration/i);
  });

  it("rejects unknown permission policy instead of treating it as allow", () => {
    const result = validateTestRuntimeProfile(validProfile({ permissions: { network: "unknown" } }));
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/network|permission|policy/i);
  });

  it("requires equal before/after behavior fingerprints for a recorded profile", () => {
    const result = validateTestRuntimeProfile(validProfile({ behavior_fingerprint: {
      before: { selection_hash: HASH, assertion_hash: HASH },
      after: { selection_hash: "c".repeat(64), assertion_hash: HASH },
    } }));
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/selection|fingerprint|equal/i);
  });

  it("does not accept a capability proof with unknown observations as passed", () => {
    const result = validateTestRuntimeProfile(validProfile({ capability_proof: {
      status: "passed",
      executor_id: "run-checks",
      observations: [{ capability: "network", decision: "unknown", proof_ref: null, proof_hash: null }],
    } }), { requireProof: true });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/unknown|proof|unavailable/i);
  });

  it("keeps an unproven profile unavailable instead of returning ready", () => {
    const result = validateTestRuntimeProfile(validProfile({ capability_proof: {
      status: "unavailable", executor_id: "run-checks", observations: [],
    } }));
    expect(result.ok).toBe(false);
    expect(result.status).toBe("unavailable");
  });

  it("preserves an unavailable wrapper result even when the target command exits zero", () => {
    const evidence = join(process.cwd(), "quality", "tests", "p1-unavailable-wrapper.json");
    try {
      execFileSync(process.execPath, ["tools/cli/run-checks.mjs", "--runtime-profile=medium", `--evidence-path=${evidence}`, "--", process.execPath, "-e", "process.exit(0)"], { cwd: process.cwd(), stdio: "pipe" });
      const value = JSON.parse(readFileSync(evidence, "utf8"));
      expect(value.exit_code).toBe(0);
      expect(value.runtime_profile_status).toBe("unavailable");
      expect(value.runtime_profile_authenticated).toBe(false);
      expect(value.capability_proof.status).toBe("unavailable");
      expect(value.behavior_fingerprint_status).toBe("unavailable");
    } finally {
      rmSync(evidence, { force: true });
    }
  });

  it("validates the runtime fields attached to a canonical receipt", () => {
    const value = {
      schema_version: "workflowhub-receipt.v1",
      task_id: "task",
      stage: "build-code",
      producer: { stage: "build-code", component: "build-code-test-capture", version: "1.0.0" },
      command: "printf ok",
      command_hash: createHash("sha256").update("printf ok").digest("hex"),
      exit_code: 0,
      snapshot_tree: OID,
      output_ref: "quality/tests/output/profile",
      output_hash: HASH,
      runtime_profile: validProfile(),
      runtime_profile_status: "unavailable",
      runtime_profile_authenticated: false,
      capability_proof: { status: "unavailable", executor_id: "run-checks", observations: [] },
      behavior_fingerprint: validProfile().behavior_fingerprint,
      duration_ms: 12,
    };
    expect(() => validateCanonicalTestReceipt(value, {
      taskId: "task",
      stage: "build-code",
      snapshotTree: OID,
      expectedProducerComponent: "build-code-test-capture",
      requireRuntimeProfile: true,
    })).not.toThrow();
    expect(() => validateCanonicalTestReceipt({ ...value, runtime_profile_status: "ready", runtime_profile_authenticated: true }, {
      taskId: "task", stage: "build-code", snapshotTree: OID,
      expectedProducerComponent: "build-code-test-capture", requireRuntimeProfile: true,
    })).toThrow(/unauthenticated|authentication|runtime profile/i);
    expect(() => validateCanonicalTestReceipt({ ...value, duration_ms: 300_001 }, {
      taskId: "task", stage: "build-code", snapshotTree: OID,
      expectedProducerComponent: "build-code-test-capture", requireRuntimeProfile: true,
    })).toThrow(/ceiling/i);
  });

  it("captures a real canonical receipt with profile fields and preserves a profile change as non-reusable", () => {
    const root = realTaskFixture();
    try {
      const first = createCanonicalReceiptWriter({ task: root.task, workspace: root.workspace, stage: "build-code", component: "profile-capture" })
        .captureTests({ command: "printf ok", receiptRef: "quality/tests/profile-capture.json", outputRef: "quality/tests/output/profile-capture", runtimeProfile: validProfile({ capability_proof: { status: "unavailable", executor_id: "run-checks", observations: [] } }), capabilityProof: { status: "unavailable", executor_id: "run-checks", observations: [] }, behaviorFingerprint: validProfile().behavior_fingerprint });
      expect(first.duration_ms).toBeGreaterThanOrEqual(0);
      expect(first.runtime_profile.runtime_profile).toBe("medium");
      expect(first.output_hash).toBe(createHash("sha256").update("ok\n").digest("hex"));
      expect(() => createCanonicalReceiptWriter({ task: root.task, workspace: root.workspace, stage: "build-code", component: "profile-capture" })
        .captureTests({ command: "printf ok", receiptRef: "quality/tests/profile-capture.json", outputRef: "quality/tests/output/profile-capture", runtimeProfile: validProfile({ runtime_profile: "inner", ceiling_ms: 60_000, permissions: { network: "deny", db: "deny", filesystem: "deny", subprocess: "deny", environment: "local_ci" }, capability_proof: { status: "unavailable", executor_id: "run-checks", observations: [] } }), capabilityProof: { status: "unavailable", executor_id: "run-checks", observations: [] }, behaviorFingerprint: validProfile().behavior_fingerprint }))
        .toThrow(/conflicts|profile/i);
    } finally {
      rmSync(root.root, { recursive: true, force: true });
    }
  });

  it("does not authenticate a forged passed capability proof with fake refs and hashes", () => {
    const root = realTaskFixture();
    try {
      const receipt = createCanonicalReceiptWriter({ task: root.task, workspace: root.workspace, stage: "build-code", component: "profile-capture" })
        .captureTests({
          command: "printf ok",
          receiptRef: "quality/tests/forged-profile-capture.json",
          outputRef: "quality/tests/output/forged-profile-capture",
          runtimeProfile: validProfile({ capability_proof: CAPABILITY_PROOF }),
          capabilityProof: CAPABILITY_PROOF,
          behaviorFingerprint: validProfile().behavior_fingerprint,
        });

      expect(receipt.runtime_profile_status).toBe("unavailable");
      expect(receipt.runtime_profile_authenticated).toBe(false);
      expect(receipt.runtime_profile.capability_proof.status).toBe("unavailable");
      expect(receipt.capability_proof.status).toBe("unavailable");
    } finally {
      rmSync(root.root, { recursive: true, force: true });
    }
  });

  it("records profile execution through the explicit argv wrapper without changing the target command", () => {
    const root = mkdtempSync(join(tmpdir(), "wh-runtime-profile-"));
    const evidence = join(process.cwd(), "quality", "tests", "p1-runtime-wrapper.json");
    try {
      const output = execFileSync(process.execPath, [
        "tools/cli/run-checks.mjs",
        "--runtime-profile=medium",
        `--evidence-path=${evidence}`,
        "--",
        process.execPath,
        "-e",
        "process.stdout.write('profile-ok')",
      ], { cwd: process.cwd(), encoding: "utf8" });
      expect(output).toContain("profile-ok");
      expect(JSON.parse(readFileSync(evidence, "utf8"))).toMatchObject({
        runtime_profile: "medium",
        capability_proof: { status: "unavailable" },
        target: { argv: [process.execPath, "-e", "process.stdout.write('profile-ok')"] },
      });
    } finally {
      rmSync(evidence, { force: true });
      rmSync(root, { recursive: true, force: true });
    }
  });
});
