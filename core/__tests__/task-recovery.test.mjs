import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createTask } from "../task-handle.mjs";
import {
  assertPhaseRecoveryIntent, canonical, deepEqual, generationRef, normalizedRecoveryRecordHash, readRecoveryCredential, readRecoveryGeneration,
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

const phaseCredential = (recoveryIntent) => ({
  schema_version: "workflowhub-recovery-credential.v1", project_name: "workflowhub", task_id: "recovery-test",
  recovery_kind: "phase-pointer", nonce: "phase-intent", issued_at: "2026-07-25T00:00:00.000Z", decision: "accepted",
  accepted_business_snapshot: {
    accepted_ref: "results/make-decision/accepted.json", accepted_hash: "a".repeat(64),
    baseline_commit: "b".repeat(40), snapshot_tree: "c".repeat(40), target_repo_root: "/target",
  },
  phase_subject: {
    current_pointer_ref: "phase-result.json", current_pointer_hash: "d".repeat(64),
    baseline_phase0_evidence_ref: `evidence/phases/phase-0/${"e".repeat(40)}/phase-evidence.json`,
    baseline_phase0_evidence_hash: "f".repeat(64),
    baseline_phase0_review_ref: "reviews/results/phase-0.json", baseline_phase0_review_hash: "1".repeat(64),
    current_phase_id: "phase-1", target_phase_id: "phase-0", baseline_commit: "2".repeat(40),
    snapshot_tree: "3".repeat(40),
    implementation_receipt: { ref: "receipts/implementation.json", hash: "4".repeat(64) },
    green_test_receipt: { ref: "receipts/build-tests.json", hash: "5".repeat(64) },
    red_test_receipt: null, allowed_files: ["core/task-recovery.mjs"],
    ...(recoveryIntent === undefined ? {} : { recovery_intent: recoveryIntent }),
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

  it("accepts only the exact optional same-snapshot Phase 0 recovery intent", () => {
    expect(validateRecoveryCredential(phaseCredential())).toBeTruthy();
    expect(validateRecoveryCredential(phaseCredential("same-snapshot-phase0-reopen"))).toBeTruthy();
    for (const intent of ["", "Same-Snapshot-Phase0-Reopen", " same-snapshot-phase0-reopen", "same-snapshot-phase0-reopen ", "same-snapshot-phase0", "same-snapshot-phase0-reopen-extra", "other"]) {
      expect(() => validateRecoveryCredential(phaseCredential(intent))).toThrow(/RECOVERY_PHASE_INTENT_MISMATCH/);
    }
    const credential = phaseCredential();
    credential.phase_subject.unexpected = true;
    expect(() => validateRecoveryCredential(credential)).toThrow(/RECOVERY_CREDENTIAL_INVALID/);
  });

  it("enforces the same/changed snapshot recovery intent matrix", () => {
    expect(() => assertPhaseRecoveryIntent({
      sameSnapshot: true, recoveryIntent: "same-snapshot-phase0-reopen",
    })).not.toThrow();
    expect(() => assertPhaseRecoveryIntent({ sameSnapshot: false, recoveryIntent: undefined })).not.toThrow();
    expect(() => assertPhaseRecoveryIntent({ sameSnapshot: true, recoveryIntent: undefined }))
      .toThrow(/RECOVERY_PHASE_INTENT_REQUIRED/);
    expect(() => assertPhaseRecoveryIntent({
      sameSnapshot: false, recoveryIntent: "same-snapshot-phase0-reopen",
    })).toThrow(/RECOVERY_PHASE_INTENT_USAGE_MISMATCH/);
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

  it.each([
    ["record persist", { beforeGenerationCreate() { throw new Error("record persist fault"); } }],
    ["post-gate/pre-pointer", { beforePointerReplace() { throw new Error("post-gate fault"); } }],
    ["pointer replace", { validatePointerReplace(phase) { if (phase === "post") throw new Error("pointer replace fault"); } }],
  ])("rolls back the recovery gate and pointer at the %s boundary", (_label, testHooks) => {
    const task = fixture();
    const previousPointerRaw = canonical({ phase_id: "phase-1", status: "needs_revision" });
    const nextPointerRaw = canonical({ phase_id: "phase-0", status: "awaiting_review" });
    const historicalRaw = canonical({ result: "historical" });
    task.writeRecordAtomic("phase-result.json", previousPointerRaw);
    task.writeRecordAtomic("historical.json", historicalRaw);
    expect(() => task.replaceRecoveryPointer({
      previousPointerRaw, pointerRaw: nextPointerRaw,
      archiveRef: `identity/recovery-archives/phase-result-${"a".repeat(64)}.json`, archiveRaw: previousPointerRaw,
      generationRef: "identity/recoveries/phase-pointer-0001.json", generationRaw: canonical({ result: "accepted" }),
      testHooks,
    })).toThrow(/fault/);
    expect(task.readRecord("phase-result.json")).toBe(previousPointerRaw);
    expect(task.readRecord("historical.json")).toBe(historicalRaw);
    expect(() => task.readRecord("identity/recoveries/phase-pointer-0001.json")).toThrow();
    expect(task.readRecord(`identity/recovery-archives/phase-result-${"a".repeat(64)}.json`)).toBe(previousPointerRaw);
  });

  it("keeps a third-party pointer update and removes the losing recovery generation", () => {
    const task = fixture();
    const previousPointerRaw = canonical({ phase_id: "phase-1", status: "needs_revision" });
    const nextPointerRaw = canonical({ phase_id: "phase-0", status: "awaiting_review" });
    const thirdPartyPointerRaw = canonical({ phase_id: "phase-2", status: "done" });
    task.writeRecordAtomic("phase-result.json", previousPointerRaw);
    expect(() => task.replaceRecoveryPointer({
      previousPointerRaw, pointerRaw: nextPointerRaw,
      archiveRef: `identity/recovery-archives/phase-result-${"b".repeat(64)}.json`, archiveRaw: previousPointerRaw,
      generationRef: "identity/recoveries/phase-pointer-0001.json", generationRaw: canonical({ result: "accepted" }),
      testHooks: {
        validatePointerReplace(phase) {
          if (phase === "pre") task.writeRecordAtomic("phase-result.json", thirdPartyPointerRaw);
        },
      },
    })).toThrow(/changed before replacement/);
    expect(task.readRecord("phase-result.json")).toBe(thirdPartyPointerRaw);
    expect(() => task.readRecord("identity/recoveries/phase-pointer-0001.json")).toThrow();
  });

  it("rolls back recovery manifest writes when the atomic boundary faults", () => {
    const task = fixture();
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
