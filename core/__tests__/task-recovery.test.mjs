import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createTask } from "../task-handle.mjs";
import {
  canonical, deepEqual, generationRef, normalizedRecoveryRecordHash, readRecoveryCredential, readRecoveryGeneration,
  sha256, validateRecoveryCredential, validateRecoveryGeneration, writeRecoveryCredentialForTest,
} from "../task-recovery.mjs";
import { runRecovery } from "../../scripts/task-recovery.mjs";

const roots = [];
const baseCredential = () => ({
  schema_version: "workflowhub-recovery-credential.v1", project_name: "workflowhub", task_id: "recovery-test",
  recovery_kind: "runner-replacement", nonce: "nonce-1", issued_at: "2026-07-25T00:00:00.000Z", decision: "accepted",
  accepted_business_snapshot: {
    accepted_ref: "results/make-decision/accepted.json", accepted_hash: "a".repeat(64),
    baseline_commit: "b".repeat(40), snapshot_tree: "c".repeat(40), target_repo_root: "/target",
  },
  runner_subject: {
    previous_runner: { runner_root: "/old", runner_oid: "d".repeat(40), runner_branch: "task/workflowhub/recovery-test", project: "workflowhub", task: "recovery-test", stage: "build-code" },
    new_runner: { runner_root: "/new", runner_oid: "e".repeat(40), runner_branch: "task/workflowhub/recovery-test", project: "workflowhub", task: "recovery-test", stage: "build-code" },
    previous_manifest_hash: "f".repeat(64), stage: "build-code",
  },
});

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-recovery-contract-")));
  roots.push(root);
  return createTask({ storageRoot: root, manifest: {
    schema_version: "1.0.0", project_name: "workflowhub", task_id: "recovery-test",
    created_at: "2026-07-25T00:00:00.000Z", target_repo_root: "/target", issue_ids: [], inputs: {},
  } });
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("recovery contracts", () => {
  it("compares identity objects independent of JSON key order and hashes self-references reproducibly", () => {
    expect(deepEqual({ runner_oid: "a", runner_root: "/runner" }, { runner_root: "/runner", runner_oid: "a" })).toBe(true);
    const manifest = { runner_root: "/runner", runner_oid: "a".repeat(40), runner_replacement: { ref: "identity/recoveries/runner-replacement-0001.json", integrity_hash: "placeholder" } };
    expect(normalizedRecoveryRecordHash("runner-replacement", manifest)).toBe(
      normalizedRecoveryRecordHash("runner-replacement", { ...manifest, runner_replacement: { ...manifest.runner_replacement, integrity_hash: "different" } }),
    );
  });

  it("validates a canonical one-shot credential and writes it only through the test fixture capability", () => {
    const task = fixture();
    const credential = baseCredential();
    expect(validateRecoveryCredential(credential)).toBe(credential);
    const written = writeRecoveryCredentialForTest(task, credential);
    expect(written.ref).toBe("identity/recovery-credentials/runner-replacement/nonce-1.json");
    expect(readRecoveryCredential(task, written.ref, written.hash, "runner-replacement").value).toEqual(credential);
    expect(() => writeRecoveryCredentialForTest(task, { ...credential, decision: "pending", nonce: "nonce-2" })).toThrow(/RECOVERY_CREDENTIAL_INVALID/);
    expect(() => writeRecoveryCredentialForTest(task, { ...credential, nonce: "nonce-2", runner_subject: { ...credential.runner_subject, stage: "verify-code" } })).toThrow(/RECOVERY_CREDENTIAL_INVALID/);
  });

  it("rejects generation extensions and keeps the two recovery namespaces separate", () => {
    const valid = {
      schema_version: "workflowhub-recovery-generation.v1", project_name: "workflowhub", task_id: "recovery-test",
      recovery_kind: "phase-pointer", generation: 1, credential_ref: "identity/recovery-credentials/phase-pointer/n.json", credential_hash: "a".repeat(64),
      before: { ref: "phase-result.json", hash: "b".repeat(64) }, after: { ref: "phase-result.json", hash: "c".repeat(64), tree: "d".repeat(40) },
      created_at: "2026-07-25T00:00:00.000Z", result: "accepted",
    };
    expect(validateRecoveryGeneration(valid)).toBe(valid);
    expect(generationRef("runner-replacement")).toBe("identity/recoveries/runner-replacement-0001.json");
    expect(() => validateRecoveryGeneration({ ...valid, extra: true })).toThrow(/RECOVERY_RECORD_CONFLICT/);
    expect(readRecoveryGeneration(fixture(), "phase-pointer")).toBeNull();
  });

  it("keeps the official CLI explicit and documents both commands", () => {
    const help = runRecovery(["--help"]);
    expect(help).toMatch(/runner-replacement/);
    expect(help).toMatch(/phase-pointer/);
    expect(() => runRecovery(["runner-replacement"])).toThrow(/RECOVERY_INPUT_REQUIRED/);
  });

  it("rolls back recovery pointer and manifest writes when the atomic boundary faults", () => {
    const task = fixture();
    const previousPointerRaw = canonical({ phase_id: "phase-1", status: "needs_revision" });
    const nextPointerRaw = canonical({ phase_id: "phase-0", status: "awaiting_review" });
    task.writeRecordAtomic("phase-result.json", previousPointerRaw);
    expect(() => task.replaceRecoveryPointer({
      previousPointerRaw, pointerRaw: nextPointerRaw,
      archiveRef: `identity/recovery-archives/phase-result-${"a".repeat(64)}.json`, archiveRaw: previousPointerRaw,
      generationRef: "identity/recoveries/phase-pointer-0001.json", generationRaw: canonical({ result: "accepted" }),
      testHooks: { beforePointerReplace() { throw new Error("pointer fault"); } },
    })).toThrow("pointer fault");
    expect(task.readRecord("phase-result.json")).toBe(previousPointerRaw);
    expect(() => task.readRecord("identity/recoveries/phase-pointer-0001.json")).toThrow();

    const previousManifestRaw = task.readRecord("task.json");
    const nextManifestRaw = canonical({ ...JSON.parse(previousManifestRaw), runner_root: "/replacement" });
    expect(() => task.replaceRecoveryManifest({
      previousManifestRaw, manifestRaw: nextManifestRaw,
      archiveRef: `identity/recovery-archives/runner-manifest-${sha256(previousManifestRaw)}.json`, archiveRaw: previousManifestRaw,
      generationRef: "identity/recoveries/runner-replacement-0001.json", generationRaw: canonical({ result: "accepted" }),
      testHooks: { beforeManifestReplace() { throw new Error("manifest fault"); } },
    })).toThrow("manifest fault");
    expect(task.readRecord("task.json")).toBe(previousManifestRaw);
    expect(() => task.readRecord("identity/recoveries/runner-replacement-0001.json")).toThrow();
  });
});
