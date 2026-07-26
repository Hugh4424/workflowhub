import { canonical, deepEqual, isRuntimeOnlyPath, normalizeRuntimeOnlyPaths, sha256 } from "./canonical-utils.mjs";

export { canonical, deepEqual, isRuntimeOnlyPath, normalizeRuntimeOnlyPaths, sha256 } from "./canonical-utils.mjs";

const HASH = /^[a-f0-9]{64}$/;
const OID = /^[a-f0-9]{40,64}$/;
const PROJECT = /^[A-Za-z][A-Za-z0-9._-]{0,63}$/;
const TASK = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const KIND = new Set(["runner-replacement", "phase-pointer"]);
const STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const CREDENTIAL_REF = /^identity\/recovery-credentials\/(runner-replacement|phase-pointer)\/([A-Za-z0-9._-]{1,256})\.json$/;
const GENERATION_REF = /^identity\/recoveries\/(runner-replacement|phase-pointer)-([0-9]{4})\.json$/;

export const RECOVERY_ERROR_CODES = Object.freeze([
  "RECOVERY_INPUT_REQUIRED", "RECOVERY_TASK_IDENTITY_MISMATCH", "RECOVERY_CREDENTIAL_INVALID",
  "RECOVERY_ALREADY_USED", "RECOVERY_CONCURRENT_CHANGE", "RECOVERY_RECORD_CONFLICT",
  "RECOVERY_RUNNER_IDENTITY_INVALID", "RECOVERY_RUNNER_ANCESTRY_UNREACHABLE",
  "RECOVERY_RUNNER_PROVENANCE_MISMATCH", "RECOVERY_MANIFEST_HASH_MISMATCH",
  "RECOVERY_BUSINESS_SNAPSHOT_MISMATCH", "RECOVERY_PHASE_POINTER_MISMATCH",
  "RECOVERY_PHASE_SNAPSHOT_ALREADY_CURRENT", "RECOVERY_PHASE_EVIDENCE_INVALID",
  "RECOVERY_PHASE_EVIDENCE_MISMATCH", "RECOVERY_PHASE_CONTINUATION_MISMATCH",
  "RECOVERY_AUTHORIZATION_INVALID", "RECOVERY_GENERATION_MISMATCH",
  "RECOVERY_BOOTSTRAP_PACKET_MISMATCH", "RECOVERY_BOOTSTRAP_REVIEW_INVALID",
  "RECOVERY_BOOTSTRAP_REVIEW_MISMATCH",
  "RECOVERY_BOOTSTRAP_BUNDLE_INVALID", "RECOVERY_BOOTSTRAP_BUNDLE_MISMATCH",
  "RECOVERY_BOOTSTRAP_TEST_INVALID", "RECOVERY_BOOTSTRAP_TEST_MISMATCH",
  "RECOVERY_BOOTSTRAP_COVERAGE_INVALID", "RECOVERY_BOOTSTRAP_COVERAGE_MISMATCH",
  "RECOVERY_BOOTSTRAP_PROVIDER_CONFIG_INVALID", "RECOVERY_BOOTSTRAP_PROVIDER_CONFIG_MISMATCH",
]);

export function recoveryError(code, detail = "recovery rejected") {
  const error = new Error(`${code}: ${detail}`);
  error.code = code;
  error.recovery_code = code;
  return error;
}


/**
 * Recovery records contain a one-way integrity reference to the record that
 * points back to them. Hash the canonical record with only that self-reference
 * normalized to the empty string; verifiers can reproduce this without a
 * circular fixed-point hash.
 */
export function normalizedRecoveryRecordHash(kind, value) {
  const copy = structuredClone(value);
  if (kind === "runner-replacement" && copy.runner_replacement) copy.runner_replacement.integrity_hash = "";
  if (kind === "phase-pointer" && Object.hasOwn(copy, "recovery_hash")) copy.recovery_hash = "";
  return sha256(canonical(copy));
}

export function assertSafeRecoveryRef(value, label = "recovery reference") {
  if (typeof value !== "string" || value.length === 0 || value.startsWith("/") || value.includes("\\") || value.includes("..") || value.split("/").some((part) => !part || part === ".")) {
    throw recoveryError("RECOVERY_CREDENTIAL_INVALID", `${label} is not task-relative`);
  }
  return value;
}

function assertHash(value, label) {
  if (!HASH.test(value ?? "")) throw recoveryError("RECOVERY_CREDENTIAL_INVALID", `${label} must be a sha256`);
}

function assertOid(value, label) {
  if (!OID.test(value ?? "")) throw recoveryError("RECOVERY_CREDENTIAL_INVALID", `${label} must be a Git object id`);
}

function assertIdentity(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw recoveryError("RECOVERY_CREDENTIAL_INVALID", `${label} is missing`);
  const required = ["runner_root", "runner_oid", "runner_branch", "project", "task", "stage"];
  const allowed = new Set([...required, "agents_ref", "stage_skill_ref"]);
  if (Object.keys(value).some((key) => !allowed.has(key)) || required.some((key) => typeof value[key] !== "string" || value[key].length === 0)) {
    throw recoveryError("RECOVERY_CREDENTIAL_INVALID", `${label} is invalid`);
  }
  assertOid(value.runner_oid, `${label}.runner_oid`);
  if (!PROJECT.test(value.project) || !TASK.test(value.task) || !STAGES.has(value.stage)) throw recoveryError("RECOVERY_CREDENTIAL_INVALID", `${label} identity is invalid`);
  if (value.agents_ref !== undefined && value.agents_ref !== "AGENTS.md") throw recoveryError("RECOVERY_CREDENTIAL_INVALID", `${label}.agents_ref is invalid`);
  if (value.stage_skill_ref !== undefined && value.stage_skill_ref !== `workflows/${value.stage}/SKILL.md`) throw recoveryError("RECOVERY_CREDENTIAL_INVALID", `${label}.stage_skill_ref is invalid`);
}

function assertReceipt(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some((key) => !["ref", "hash"].includes(key)) || typeof value.ref !== "string") {
    throw recoveryError("RECOVERY_CREDENTIAL_INVALID", `${label} is invalid`);
  }
  assertSafeRecoveryRef(value.ref, `${label}.ref`); assertHash(value.hash, `${label}.hash`);
}

function assertBusinessSnapshot(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some((key) => !["accepted_ref", "accepted_hash", "baseline_commit", "snapshot_tree", "target_repo_root"].includes(key))) {
    throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "accepted_business_snapshot is invalid");
  }
  if (value.accepted_ref !== "results/make-decision/accepted.json") throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "accepted_business_snapshot.accepted_ref is invalid");
  assertHash(value.accepted_hash, "accepted_business_snapshot.accepted_hash");
  assertOid(value.baseline_commit, "accepted_business_snapshot.baseline_commit");
  assertOid(value.snapshot_tree, "accepted_business_snapshot.snapshot_tree");
  if (typeof value.target_repo_root !== "string" || !value.target_repo_root.startsWith("/")) throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "accepted_business_snapshot.target_repo_root is invalid");
}

export function validateRecoveryCredential(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "credential must be an object");
  const allowed = new Set(["schema_version", "project_name", "task_id", "recovery_kind", "nonce", "issued_at", "decision", "accepted_business_snapshot", "runner_subject", "phase_subject", "bridge_subject"]);
  if (Object.keys(value).some((key) => !allowed.has(key)) || value.schema_version !== "workflowhub-recovery-credential.v1" || !PROJECT.test(value.project_name ?? "") || !TASK.test(value.task_id ?? "") || !KIND.has(value.recovery_kind) || typeof value.nonce !== "string" || value.nonce.length === 0 || value.nonce.includes("/") || value.nonce.includes("\\") || !Number.isFinite(Date.parse(value.issued_at ?? "")) || value.decision !== "accepted") {
    throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "credential envelope is invalid");
  }
  assertBusinessSnapshot(value.accepted_business_snapshot);
  const hasRunner = value.runner_subject !== undefined;
  const hasPhase = value.phase_subject !== undefined;
  if (hasRunner === hasPhase || (value.recovery_kind === "runner-replacement") !== hasRunner) throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "credential subject does not match recovery kind");
  if (hasRunner) {
    const subject = value.runner_subject;
    if (!subject || typeof subject !== "object" || Object.keys(subject).some((key) => !["previous_runner", "new_runner", "previous_manifest_hash", "stage"].includes(key))) throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "runner_subject is invalid");
    assertIdentity(subject.previous_runner, "runner_subject.previous_runner"); assertIdentity(subject.new_runner, "runner_subject.new_runner");
    assertHash(subject.previous_manifest_hash, "runner_subject.previous_manifest_hash");
    if (!STAGES.has(subject.stage) || subject.new_runner.stage !== subject.stage) throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "runner_subject.stage is invalid");
    if (value.bridge_subject !== undefined) {
      const bridge = value.bridge_subject;
      const common = ["current_generation", "current_manifest", "authorization", "bootstrap_packet", "sealed_bundle"];
      const hasReview = bridge?.bootstrap_review_result !== undefined;
      const hasUserAuthorization = bridge?.bootstrap_user_authorization !== undefined;
      const required = [...common, hasReview ? "bootstrap_review_result" : "bootstrap_user_authorization"];
      if (!bridge || typeof bridge !== "object" || Array.isArray(bridge)
          || hasReview === hasUserAuthorization
          || Object.keys(bridge).some((key) => !required.includes(key))
          || required.some((key) => bridge[key] === undefined)) {
        throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "bridge_subject is invalid");
      }
      for (const key of [...common.filter((key) => key !== "authorization"), hasReview ? "bootstrap_review_result" : "bootstrap_user_authorization"]) {
        assertReceipt(bridge[key], `bridge_subject.${key}`);
      }
      const authorization = bridge.authorization;
      if (!authorization || typeof authorization !== "object" || Array.isArray(authorization)
          || Object.keys(authorization).some((key) => !["ref", "hash", "excerpt", "excerpt_hash", "source_ref"].includes(key))
          || typeof authorization.excerpt !== "string" || authorization.excerpt.trim() === ""
          || authorization.source_ref !== null && typeof authorization.source_ref !== "string") {
        throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "bridge_subject.authorization is invalid");
      }
      assertReceipt({ ref: authorization.ref, hash: authorization.hash }, "bridge_subject.authorization");
      assertHash(authorization.excerpt_hash, "bridge_subject.authorization.excerpt_hash");
      if (sha256(authorization.excerpt) !== authorization.excerpt_hash) {
        throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "bridge authorization excerpt hash mismatch");
      }
    }
  } else {
    if (value.bridge_subject !== undefined) throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "phase credential cannot carry bridge_subject");
    const subject = value.phase_subject;
    const required = ["current_pointer_ref", "current_pointer_hash", "baseline_phase0_evidence_ref", "baseline_phase0_evidence_hash", "baseline_phase0_review_ref", "baseline_phase0_review_hash", "current_phase_id", "target_phase_id", "baseline_commit", "snapshot_tree", "implementation_receipt", "green_test_receipt", "allowed_files"];
    if (!subject || typeof subject !== "object" || Object.keys(subject).some((key) => !required.includes(key)) || required.some((key) => subject[key] === undefined)) throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "phase_subject is incomplete");
    if (subject.current_pointer_ref !== "phase-result.json" || subject.current_phase_id !== "phase-1" || subject.target_phase_id !== "phase-0") throw recoveryError("RECOVERY_PHASE_POINTER_MISMATCH", "phase recovery only supports phase-1 to phase-0");
    assertHash(subject.current_pointer_hash, "phase_subject.current_pointer_hash");
    for (const key of ["baseline_phase0_evidence_hash", "baseline_phase0_review_hash"]) assertHash(subject[key], `phase_subject.${key}`);
    for (const key of ["baseline_phase0_evidence_ref", "baseline_phase0_review_ref"]) assertSafeRecoveryRef(subject[key], `phase_subject.${key}`);
    assertOid(subject.baseline_commit, "phase_subject.baseline_commit"); assertOid(subject.snapshot_tree, "phase_subject.snapshot_tree");
    assertReceipt(subject.implementation_receipt, "phase_subject.implementation_receipt"); assertReceipt(subject.green_test_receipt, "phase_subject.green_test_receipt");
    if (subject.red_test_receipt !== undefined && subject.red_test_receipt !== null) assertReceipt(subject.red_test_receipt, "phase_subject.red_test_receipt");
    if (!Array.isArray(subject.allowed_files) || new Set(subject.allowed_files).size !== subject.allowed_files.length || subject.allowed_files.some((file) => typeof file !== "string" || file.startsWith("/") || file.includes("..") || file.includes("\\"))) throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "phase_subject.allowed_files is invalid");
  }
  return value;
}

export function validateRecoveryGeneration(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw recoveryError("RECOVERY_RECORD_CONFLICT", "generation must be an object");
  const allowed = new Set(["schema_version", "project_name", "task_id", "recovery_kind", "generation", "credential_ref", "credential_hash", "previous_generation_ref", "previous_generation_hash", "before", "after", "created_at", "result"]);
  if (Object.keys(value).some((key) => !allowed.has(key)) || value.schema_version !== "workflowhub-recovery-generation.v1" || !PROJECT.test(value.project_name ?? "") || !TASK.test(value.task_id ?? "") || !KIND.has(value.recovery_kind) || !Number.isSafeInteger(value.generation) || value.generation < 1 || !Number.isFinite(Date.parse(value.created_at ?? "")) || value.result !== "accepted") throw recoveryError("RECOVERY_RECORD_CONFLICT", "generation envelope is invalid");
  const hasPreviousRef = value.previous_generation_ref !== undefined;
  const hasPreviousHash = value.previous_generation_hash !== undefined;
  if (hasPreviousRef !== hasPreviousHash
      || (value.recovery_kind !== "runner-replacement" && hasPreviousRef)
      || (value.generation === 1 && hasPreviousRef)
      || (value.generation > 1 && value.recovery_kind === "runner-replacement" && !hasPreviousRef)) {
    throw recoveryError("RECOVERY_RECORD_CONFLICT", "generation lineage pointer is invalid");
  }
  if (hasPreviousRef) {
    if (value.previous_generation_ref !== generationRef(value.recovery_kind, value.generation - 1)) {
      throw recoveryError("RECOVERY_RECORD_CONFLICT", "generation lineage pointer is not consecutive");
    }
    assertHash(value.previous_generation_hash, "previous_generation_hash");
  }
  assertSafeRecoveryRef(value.credential_ref, "generation.credential_ref"); assertHash(value.credential_hash, "generation.credential_hash");
  for (const key of ["before", "after"]) {
    if (!value[key] || typeof value[key] !== "object" || Object.keys(value[key]).some((field) => !["ref", "hash", "tree", "identity"].includes(field))) throw recoveryError("RECOVERY_RECORD_CONFLICT", `generation.${key} is invalid`);
    assertSafeRecoveryRef(value[key].ref, `generation.${key}.ref`); assertHash(value[key].hash, `generation.${key}.hash`);
    if (value[key].tree !== undefined) assertOid(value[key].tree, `generation.${key}.tree`);
    if (value[key].identity !== undefined && (!value[key].identity || typeof value[key].identity !== "object" || Array.isArray(value[key].identity))) throw recoveryError("RECOVERY_RECORD_CONFLICT", `generation.${key}.identity is invalid`);
  }
  return value;
}

export function credentialRef(kind, nonce) {
  if (!KIND.has(kind) || typeof nonce !== "string" || !/^[A-Za-z0-9._-]{1,256}$/.test(nonce)) throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "credential ref is invalid");
  return `identity/recovery-credentials/${kind}/${nonce}.json`;
}

export function generationRef(kind, generation = 1) {
  if (!KIND.has(kind) || !Number.isSafeInteger(generation) || generation < 1 || generation > 9999) throw recoveryError("RECOVERY_RECORD_CONFLICT", "generation ref is invalid");
  return `identity/recoveries/${kind}-${String(generation).padStart(4, "0")}.json`;
}

export function readRecoveryCredential(task, ref, expectedHash, expectedKind) {
  const match = CREDENTIAL_REF.exec(ref ?? "");
  if (!match || (expectedKind && match[1] !== expectedKind)) throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "credential ref is not canonical");
  assertHash(expectedHash, "credential_hash");
  let raw;
  try { raw = task.readRecord(ref); } catch { throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "credential record is missing"); }
  if (sha256(raw) !== expectedHash) throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "credential hash mismatch");
  let value;
  try { value = JSON.parse(raw); } catch { throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "credential is not valid JSON"); }
  validateRecoveryCredential(value);
  if (value.recovery_kind !== match[1] || value.nonce !== match[2] || value.project_name !== task.identity.projectName || value.task_id !== task.identity.taskId) throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "credential identity or canonical ref mismatch");
  return Object.freeze({ ref, hash: expectedHash, raw, value });
}

export function readRecoveryGeneration(task, kind) {
  const refs = typeof task.listRecoveryGenerationRefs === "function"
    ? [...task.listRecoveryGenerationRefs(kind)]
    : [generationRef(kind, 1)].filter((ref) => {
      try { task.readRecord(ref); return true; } catch (error) {
        if (error?.code === "ENOENT" || /record.*ENOENT|missing/.test(error?.message ?? "")) return false;
        throw error;
      }
    });
  if (refs.length === 0) return null;
  const history = [];
  const credentials = new Set();
  for (const [index, ref] of refs.entries()) {
    const generation = index + 1;
    const expectedRef = generationRef(kind, generation);
    if (ref !== expectedRef) throw recoveryError("RECOVERY_RECORD_CONFLICT", `generation gap before ${ref}`);
    let raw; let value;
    try {
      raw = task.readRecord(ref);
      value = JSON.parse(raw);
    } catch (error) {
      throw recoveryError("RECOVERY_RECORD_CONFLICT", `generation ${generation} is unreadable: ${error.message}`);
    }
    validateRecoveryGeneration(value);
    if (value.generation !== generation || value.recovery_kind !== kind
        || value.project_name !== task.identity.projectName || value.task_id !== task.identity.taskId) {
      throw recoveryError("RECOVERY_RECORD_CONFLICT", "generation identity mismatch");
    }
    const entry = Object.freeze({ ref, raw, hash: sha256(raw), value });
    const previous = history.at(-1);
    if (generation === 1) {
      if (value.previous_generation_ref !== undefined || value.previous_generation_hash !== undefined) {
        throw recoveryError("RECOVERY_RECORD_CONFLICT", "generation 1 cannot have a previous generation");
      }
    } else if (value.previous_generation_ref !== previous.ref
        || value.previous_generation_hash !== previous.hash
        || !deepEqual(value.before.identity, previous.value.after.identity)) {
      throw recoveryError("RECOVERY_RECORD_CONFLICT", `runner replacement lineage fork or historical hash tamper at generation ${generation}`);
    }
    if (credentials.has(value.credential_ref)) throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "runner replacement credential was already consumed by an earlier generation");
    credentials.add(value.credential_ref);
    history.push(entry);
  }
  const latest = history.at(-1);
  return Object.freeze({ ...latest, history: Object.freeze(history), next_generation: latest.value.generation + 1 });
}

export function assertRecoveryUnused(task, kind) {
  if (readRecoveryGeneration(task, kind)) throw recoveryError("RECOVERY_ALREADY_USED", `${kind} recovery gate is already consumed`);
}

export function validateRecoveryInput(values, kind) {
  if (!values || typeof values !== "object") throw recoveryError("RECOVERY_INPUT_REQUIRED", "recovery input is required");
  for (const key of ["task-path", "project", "task", "runner-root", "credential-ref", "credential-hash"]) if (typeof values[key] !== "string" || values[key].trim() === "") throw recoveryError("RECOVERY_INPUT_REQUIRED", `--${key} is required`);
  if (!KIND.has(kind)) throw recoveryError("RECOVERY_INPUT_REQUIRED", "recovery kind is invalid");
  if (kind === "runner-replacement" && (typeof values.stage !== "string" || !STAGES.has(values.stage))) throw recoveryError("RECOVERY_INPUT_REQUIRED", "--stage is required");
  if (kind === "phase-pointer" && values.stage !== "build-code") throw recoveryError("RECOVERY_INPUT_REQUIRED", "phase-pointer requires --stage=build-code");
  return values;
}

export function writeRecoveryCredentialForTest(task, credential) {
  validateRecoveryCredential(credential);
  if (credential.project_name !== task.identity.projectName || credential.task_id !== task.identity.taskId) throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "credential identity mismatch");
  const ref = credentialRef(credential.recovery_kind, credential.nonce);
  const raw = canonical(credential);
  task.writeRecoveryCredential(ref, raw);
  return Object.freeze({ ref, hash: sha256(raw) });
}
