import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import Ajv from "ajv";

import { createTask } from "../task-handle.mjs";
import * as recoveryContract from "../task-recovery.mjs";
import {
  assertPhaseRecoveryIntent, canonical, deepEqual, generationRef, normalizedRecoveryRecordHash, readRecoveryCredential, readRecoveryGeneration,
  sha256, validateRecoveryCredential, validateRecoveryGeneration, writeRecoveryCredentialForTest,
} from "../task-recovery.mjs";
import { runRecovery } from "../../scripts/task-recovery.mjs";

const roots = [];
const recoveryKinds = ["runner-replacement", "phase-pointer", "dirty-cleanup-rebind"];
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

const workspaceIdentity = (root, oid) => ({
  worktree_root: root,
  git_common_dir: "/target/.git",
  branch: "task/workflowhub/recovery-test",
  head: oid.repeat(40),
  snapshot_tree: oid.repeat(40),
});

const workspaceCredential = (overrides = {}) => ({
  schema_version: "workflowhub-recovery-credential.v1", project_name: "workflowhub", task_id: "recovery-test",
  recovery_kind: "dirty-cleanup-rebind", nonce: "dirty-cleanup-rebind", issued_at: "2026-07-25T00:00:00.000Z", decision: "accepted",
  accepted_business_snapshot: {
    accepted_ref: "results/make-decision/accepted.json", accepted_hash: "a".repeat(64),
    baseline_commit: "b".repeat(40), snapshot_tree: "c".repeat(40), target_repo_root: "/target",
  },
  workspace_subject: {
    previous_workspace: workspaceIdentity("/target-dirty", "c"),
    clean_workspace: workspaceIdentity("/target-clean", "e"),
    authorization: { ref: `evidence/authorizations/dirty-cleanup-rebind/${"d".repeat(64)}.json`, hash: "d".repeat(64) },
    retained_artifact_refs: [
      { ref: "receipts/decision-log.json", hash: "1".repeat(64) },
      { ref: "receipts/spec.json", hash: "2".repeat(64) },
      { ref: "receipts/plan.json", hash: "3".repeat(64) },
      { ref: "receipts/tasks.json", hash: "4".repeat(64) },
    ],
    next_stage: "task-close",
  },
  ...overrides,
});

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-recovery-contract-")));
  roots.push(root);
  return createTask({ storageRoot: root, manifest: {
    schema_version: "1.0.0", project_name: "workflowhub", task_id: "recovery-test",
    created_at: "2026-07-25T00:00:00.000Z", target_repo_root: "/target", issue_ids: [], inputs: {},
  } });
}

function runnerIdentity(suffix) {
  return {
    runner_root: `/runner-${suffix}`,
    runner_oid: suffix.repeat(40).slice(0, 40),
    runner_branch: "task/workflowhub/recovery-test",
    project: "workflowhub",
    task: "recovery-test",
    stage: "build-code",
  };
}

function replacementGeneration(generation, before, after, previous = null) {
  const value = {
    schema_version: "workflowhub-recovery-generation.v1",
    project_name: "workflowhub",
    task_id: "recovery-test",
    recovery_kind: "runner-replacement",
    generation,
    credential_ref: `identity/recovery-credentials/runner-replacement/generation-${generation}.json`,
    credential_hash: String(generation).repeat(64).slice(0, 64),
    before: { ref: "task.json", hash: "a".repeat(64), identity: before },
    after: { ref: "task.json", hash: "b".repeat(64), identity: after },
    created_at: `2026-07-25T00:00:0${generation}.000Z`,
    result: "accepted",
  };
  if (previous !== null) {
    value.previous_generation_ref = previous.ref;
    value.previous_generation_hash = previous.hash;
  }
  return value;
}

function installGeneration(task, value) {
  const ref = generationRef("runner-replacement", value.generation);
  const raw = canonical(value);
  const path = join(task.taskPath, ref);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, raw);
  return { ref, raw, hash: sha256(raw), value };
}

afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

describe("recovery contracts", () => {
  it("keeps registry, JSON schemas, JS validators, and ref builders on the same exact three-kind contract", () => {
    expect(Object.keys(recoveryContract.RECOVERY_OPERATIONS ?? {}).sort()).toEqual([...recoveryKinds].sort());
    for (const operation of Object.values(recoveryContract.RECOVERY_OPERATIONS ?? {})) {
      expect(Object.keys(operation).sort()).toEqual([
        "append_refs", "authorization", "contract_version", "credential_subject",
        "generation_mode", "lock_ref", "mutable_refs", "postcondition", "rollback_scope",
      ].sort());
      expect(operation.contract_version).toBe("workflowhub-recovery-operation.v1");
      expect(typeof operation.credential_subject).toBe("string");
      expect(typeof operation.authorization).toBe("string");
      expect(typeof operation.lock_ref).toBe("string");
      expect(Array.isArray(operation.mutable_refs)).toBe(true);
      expect(Array.isArray(operation.append_refs)).toBe(true);
      expect(Array.isArray(operation.rollback_scope)).toBe(true);
      expect(typeof operation.postcondition).toBe("string");
    }

    const ajv = new Ajv({ strict: false, formats: { "date-time": true } });
    const credentialSchema = JSON.parse(readFileSync(new URL("../schemas/workflowhub-recovery-credential.v1.json", import.meta.url), "utf8"));
    const generationSchema = JSON.parse(readFileSync(new URL("../schemas/workflowhub-recovery-generation.v1.json", import.meta.url), "utf8"));
    const validateCredentialSchema = ajv.compile(credentialSchema);
    const validateGenerationSchema = ajv.compile(generationSchema);
    expect(credentialSchema.properties.recovery_kind.enum).toEqual(recoveryKinds);
    expect(generationSchema.properties.recovery_kind.enum).toEqual(recoveryKinds);
    expect(Object.fromEntries(recoveryKinds.map((kind) => [kind, recoveryContract.RECOVERY_OPERATIONS[kind].lock_ref]))).toEqual({
      "runner-replacement": "locks/task-identity-migration.lock",
      "phase-pointer": "locks/build-code-phase-evidence.lock",
      "dirty-cleanup-rebind": "identity/locks/dirty-cleanup-rebind.lock",
    });

    for (const legacyCredential of [baseCredential(), phaseCredential()]) {
      expect(validateCredentialSchema(legacyCredential), validateCredentialSchema.errors).toBe(true);
      expect(validateRecoveryCredential(legacyCredential)).toBe(legacyCredential);
    }
    const legacyGenerations = [
      replacementGeneration(1, runnerIdentity("d"), runnerIdentity("e")),
      {
        schema_version: "workflowhub-recovery-generation.v1", project_name: "workflowhub", task_id: "recovery-test",
        recovery_kind: "phase-pointer", generation: 1,
        credential_ref: "identity/recovery-credentials/phase-pointer/legacy.json",
        credential_hash: "a".repeat(64),
        before: { ref: "phase-result.json", hash: "b".repeat(64) },
        after: { ref: "phase-result.json", hash: "c".repeat(64), tree: "d".repeat(40) },
        created_at: "2026-07-25T00:00:00.000Z", result: "accepted",
      },
    ];
    for (const legacyGeneration of legacyGenerations) {
      expect(validateGenerationSchema(legacyGeneration), validateGenerationSchema.errors).toBe(true);
      expect(validateRecoveryGeneration(legacyGeneration)).toBe(legacyGeneration);
    }
    const invalidRepeatedPhasePointer = { ...legacyGenerations[1], generation: 2 };
    expect(validateGenerationSchema(invalidRepeatedPhasePointer)).toBe(false);
    expect(() => validateRecoveryGeneration(invalidRepeatedPhasePointer)).toThrow(/RECOVERY_RECORD_CONFLICT/);
    const dirtyCredential = workspaceCredential();
    expect(validateCredentialSchema(dirtyCredential), validateCredentialSchema.errors).toBe(true);
    expect(validateRecoveryCredential(dirtyCredential)).toBe(dirtyCredential);
    expect(validateCredentialSchema({ ...dirtyCredential, recovery_kind: "runner-replacement" })).toBe(false);
    expect(() => validateRecoveryCredential({ ...dirtyCredential, recovery_kind: "runner-replacement" }))
      .toThrow(/RECOVERY_CREDENTIAL_INVALID/);
    const task = fixture();
    const written = writeRecoveryCredentialForTest(task, dirtyCredential);
    expect(written.ref).toBe("identity/recovery-credentials/dirty-cleanup-rebind/dirty-cleanup-rebind.json");
    expect(task.listRecoveryGenerationRefs("dirty-cleanup-rebind")).toEqual([]);
    expect(generationRef("dirty-cleanup-rebind", 1)).toBe("identity/recoveries/dirty-cleanup-rebind-0001.json");
    const dirtyGeneration = {
      schema_version: "workflowhub-recovery-generation.v1", project_name: "workflowhub", task_id: "recovery-test",
      recovery_kind: "dirty-cleanup-rebind", generation: 1,
      credential_ref: "identity/recovery-credentials/dirty-cleanup-rebind/dirty-cleanup-rebind.json",
      credential_hash: "e".repeat(64),
      before: { ref: "results/make-decision/accepted.json", hash: "a".repeat(64) },
      after: {
        ref: "identity/recovery-credentials/dirty-cleanup-rebind/dirty-cleanup-rebind.json",
        hash: "e".repeat(64),
        identity: dirtyCredential.workspace_subject.clean_workspace,
      },
      created_at: "2026-07-25T00:00:00.000Z", result: "accepted",
    };
    expect(validateGenerationSchema(dirtyGeneration), validateGenerationSchema.errors).toBe(true);
    expect(validateRecoveryGeneration(dirtyGeneration)).toBe(dirtyGeneration);
    expect(validateGenerationSchema({
      ...dirtyGeneration,
      credential_ref: "identity/recovery-credentials/runner-replacement/dirty-cleanup-rebind.json",
    })).toBe(false);
    expect(() => validateRecoveryGeneration({
      ...dirtyGeneration,
      credential_ref: "identity/recovery-credentials/runner-replacement/dirty-cleanup-rebind.json",
    })).toThrow(/RECOVERY_RECORD_CONFLICT/);
    const dirtyGenerationTwo = {
      ...structuredClone(dirtyGeneration),
      generation: 2,
      previous_generation_ref: "identity/recoveries/dirty-cleanup-rebind-0001.json",
      previous_generation_hash: "f".repeat(64),
      credential_ref: "identity/recovery-credentials/dirty-cleanup-rebind/second.json",
    };
    expect(validateGenerationSchema(dirtyGenerationTwo), validateGenerationSchema.errors).toBe(true);
    expect(validateRecoveryGeneration(dirtyGenerationTwo)).toBe(dirtyGenerationTwo);
    for (const invalidLineage of [
      { ...dirtyGeneration, previous_generation_ref: "identity/recoveries/dirty-cleanup-rebind-0000.json", previous_generation_hash: "f".repeat(64) },
      { ...dirtyGenerationTwo, previous_generation_hash: undefined },
      { ...dirtyGenerationTwo, previous_generation_ref: undefined, previous_generation_hash: undefined },
    ]) {
      const compact = Object.fromEntries(Object.entries(invalidLineage).filter(([, value]) => value !== undefined));
      expect(validateGenerationSchema(compact)).toBe(false);
      expect(() => validateRecoveryGeneration(compact)).toThrow(/RECOVERY_RECORD_CONFLICT/);
    }
    expect(validateGenerationSchema({
      ...dirtyGenerationTwo,
      previous_generation_ref: "identity/recoveries/runner-replacement-0001.json",
    })).toBe(false);
    expect(() => validateRecoveryGeneration({
      ...dirtyGenerationTwo,
      previous_generation_ref: "identity/recoveries/runner-replacement-0001.json",
    })).toThrow(/RECOVERY_RECORD_CONFLICT/);
    const help = runRecovery(["--help"]);
    expect(recoveryKinds.every((kind) => help.includes(kind))).toBe(true);
    expect(() => runRecovery(["dirty-cleanup-rebind"])).toThrow(/RECOVERY_INPUT_REQUIRED/);
    try { runRecovery(["dirty-cleanup-rebind"]); }
    catch (error) { expect(error.message).not.toMatch(/command must be/); }
  });

  it("requires an authorized exclusive workspace subject and rejects unknown recovery kinds", () => {
    expect(() => validateRecoveryCredential(workspaceCredential({ decision: "pending" }))).toThrow(/RECOVERY_CREDENTIAL_INVALID/);
    expect(() => validateRecoveryCredential(workspaceCredential({ runner_subject: baseCredential().runner_subject }))).toThrow(/RECOVERY_CREDENTIAL_INVALID/);
    expect(() => validateRecoveryCredential(workspaceCredential({ phase_subject: phaseCredential().phase_subject }))).toThrow(/RECOVERY_CREDENTIAL_INVALID/);
    expect(() => validateRecoveryCredential({ ...workspaceCredential(), recovery_kind: "unknown-recovery" })).toThrow(/RECOVERY_CREDENTIAL_INVALID/);
  });

  it("declares dirty rebind rollback as metadata-only and excludes worktree bytes and third-party pointers", () => {
    const operation = recoveryContract.RECOVERY_OPERATIONS?.["dirty-cleanup-rebind"];
    expect(operation?.credential_subject).toBe("workspace_subject");
    expect(operation?.authorization).toMatch(/explicit|human/i);
    expect(operation?.postcondition).toMatch(/normal.*close|task-close/i);
    expect(operation?.mutable_refs).toEqual([]);
    expect(operation?.generation_mode).toBe("consecutive");
    expect(operation?.append_refs.length).toBeGreaterThan(0);
    expect(operation?.rollback_scope.every((ref) => operation.append_refs.includes(ref))).toBe(true);
    expect(JSON.stringify({ mutable_refs: operation?.mutable_refs, rollback_scope: operation?.rollback_scope }))
      .not.toMatch(/workspace-binding\.json|worktree|phase-result\.json|third.party/i);
    expect(JSON.stringify(operation)).not.toMatch(/identity\/workspace-binding\.json/);
    expect(JSON.stringify(operation)).not.toMatch(/identity\/recovery-bindings\//);
    expect(operation?.append_refs).toEqual([
      "identity/recovery-credentials/dirty-cleanup-rebind/<nonce>.json",
      "identity/recoveries/dirty-cleanup-rebind-<generation>.json",
    ]);
  });

  it("allows a clean rebind at the same path and keeps generations create-only with exact replay", () => {
    const samePath = workspaceCredential();
    samePath.workspace_subject.clean_workspace = structuredClone(samePath.workspace_subject.previous_workspace);
    expect(validateRecoveryCredential(samePath)).toBe(samePath);

    const task = fixture();
    const raw = canonical({
      schema_version: "workflowhub-recovery-generation.v1", project_name: "workflowhub", task_id: "recovery-test",
      recovery_kind: "dirty-cleanup-rebind", generation: 1,
      credential_ref: "identity/recovery-credentials/dirty-cleanup-rebind/dirty-cleanup-rebind.json",
      credential_hash: "e".repeat(64),
      before: { ref: "results/make-decision/accepted.json", hash: "a".repeat(64) },
      after: { ref: "identity/recovery-credentials/dirty-cleanup-rebind/dirty-cleanup-rebind.json", hash: "e".repeat(64), identity: samePath.workspace_subject.clean_workspace },
      created_at: "2026-07-25T00:00:00.000Z", result: "accepted",
    });
    const ref = generationRef("dirty-cleanup-rebind", 1);
    task.writeRecoveryGeneration(ref, raw);
    expect(() => task.writeRecoveryGeneration(ref, raw)).not.toThrow();
    expect(() => task.writeRecoveryGeneration(ref, `${raw}\n`)).toThrow(/conflicts with immutable record/);
    expect(() => task.writeRecoveryGeneration("identity/recoveries/phase-pointer-0001.json", raw)).toThrow(/path is invalid/);
  });

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

  it("reads the complete consecutive runner replacement chain and reports the next generation", () => {
    const task = fixture();
    const first = installGeneration(task, replacementGeneration(1, runnerIdentity("d"), runnerIdentity("e")));
    const second = installGeneration(task, replacementGeneration(2, runnerIdentity("e"), runnerIdentity("f"), first));

    expect(validateRecoveryGeneration(second.value)).toBe(second.value);
    const latest = readRecoveryGeneration(task, "runner-replacement");
    expect(latest.value.generation).toBe(2);
    expect(latest.next_generation).toBe(3);
    expect(latest.history.map(({ ref, hash }) => ({ ref, hash }))).toEqual([
      { ref: first.ref, hash: first.hash },
      { ref: second.ref, hash: second.hash },
    ]);
  });

  it("rejects a missing generation instead of accepting a later record as a new root", () => {
    const task = fixture();
    const missing = {
      ref: generationRef("runner-replacement", 1),
      hash: "9".repeat(64),
    };
    installGeneration(task, replacementGeneration(2, runnerIdentity("e"), runnerIdentity("f"), missing));
    expect(() => readRecoveryGeneration(task, "runner-replacement")).toThrow(/RECOVERY_RECORD_CONFLICT.*gap/i);
  });

  it("rejects a fork whose before identity is not the previous generation after identity", () => {
    const task = fixture();
    const first = installGeneration(task, replacementGeneration(1, runnerIdentity("d"), runnerIdentity("e")));
    installGeneration(task, replacementGeneration(2, runnerIdentity("9"), runnerIdentity("f"), first));
    expect(() => readRecoveryGeneration(task, "runner-replacement")).toThrow(/RECOVERY_RECORD_CONFLICT.*(?:fork|lineage)/i);
  });

  it("authenticates every historical generation hash and detects old-record tampering", () => {
    const task = fixture();
    const first = installGeneration(task, replacementGeneration(1, runnerIdentity("d"), runnerIdentity("e")));
    installGeneration(task, replacementGeneration(2, runnerIdentity("e"), runnerIdentity("f"), first));
    writeFileSync(join(task.taskPath, first.ref), canonical({ ...first.value, created_at: "2026-07-25T00:01:00.000Z" }));
    expect(() => readRecoveryGeneration(task, "runner-replacement")).toThrow(/RECOVERY_RECORD_CONFLICT.*(?:hash|tamper)/i);
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
