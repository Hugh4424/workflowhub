#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { inspectRunnerIdentity } from "../core/runner-identity.mjs";
import { openTask } from "../core/task-handle.mjs";
import { authenticateWriteBoundary, persistWriteBoundaryPathCard } from "../core/write-boundary-preflight.mjs";
import { createTaskKernel } from "../core/task-kernel.mjs";
import { deriveSeriousReviewPause, validateRiskAcceptanceSet } from "../core/stage-review-disposition.mjs";
import { openAcceptedWorkspace } from "../core/workspace.mjs";
import { publishBuildCodePhaseEvidence } from "../workflows/build-code/phase-evidence.mjs";
import {
  assertPhaseRecoveryIntent, assertRecoveryUnused, canonical, credentialRef, deepEqual, dirtyCleanupAuthorizationSubjectHash, generationRef, normalizedRecoveryRecordHash, RECOVERY_OPERATIONS,
  normalizeRuntimeOnlyPaths, readAuthenticatedDirtyCleanupBinding, readRecoveryCredential, recoveryError, readRecoveryGeneration, sha256, validateRecoveryInput,
  validateRecoveryCredential,
} from "../core/task-recovery.mjs";
import { validateSchema } from "../skills/wh-review/scripts/schema-validator.mjs";
import {
  readPhaseMapTrace,
  validatePhaseAcceptanceTrace,
  validatePhaseReviewEvidence,
} from "../skills/wh-review/scripts/phase-review-subject.mjs";

const STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);
const HASH = /^[a-f0-9]{64}$/;
const OID = /^[a-f0-9]{40,64}$/;
const RISK_ACCEPTANCE_REF = /^evidence\/risk-acceptances\/([a-f0-9]{64})\.json$/;
const DIRTY_CLEANUP_AUTHORIZATION_REF = /^evidence\/authorizations\/dirty-cleanup-rebind\/([a-f0-9]{64})\.json$/;

function validateDirtyCleanupInput(values) {
  const required = [
    "task-path", "project", "task", "runner-root", "authorization-ref", "authorization-hash",
    "previous-workspace-root", "clean-workspace-root", "retained-artifact-refs",
    "retained-artifact-hashes", "nonce",
  ];
  for (const key of required) {
    if (typeof values[key] !== "string" || values[key].trim() === "") {
      throw recoveryError("RECOVERY_INPUT_REQUIRED", `--${key} is required`);
    }
  }
  if (values["credential-ref"] !== undefined || values["credential-hash"] !== undefined) {
    throw recoveryError("RECOVERY_INPUT_REQUIRED", "dirty-cleanup-rebind derives its credential from the authorization receipt");
  }
  if (!isAbsolute(values["previous-workspace-root"]) || !isAbsolute(values["clean-workspace-root"])) {
    throw recoveryError("RECOVERY_INPUT_REQUIRED", "dirty cleanup workspace roots must be absolute");
  }
  if (!DIRTY_CLEANUP_AUTHORIZATION_REF.test(values["authorization-ref"])
      || !HASH.test(values["authorization-hash"])
      || !/^[A-Za-z0-9._-]{1,256}$/.test(values.nonce)) {
    throw recoveryError("RECOVERY_INPUT_REQUIRED", "dirty cleanup authorization or nonce is invalid");
  }
  const refs = values["retained-artifact-refs"].split(",");
  const hashes = values["retained-artifact-hashes"].split(",");
  if (refs.length === 0 || refs.length !== hashes.length || new Set(refs).size !== refs.length
      || refs.some((ref) => ref === "" || ref.startsWith("/") || ref.includes("\\") || ref.split("/").includes(".."))
      || hashes.some((hash) => !HASH.test(hash))) {
    throw recoveryError("RECOVERY_INPUT_REQUIRED", "retained artifact refs and hashes must be unique paired values");
  }
  return values;
}

function parse(argv) {
  const [command, ...rest] = argv;
  if (command === "--help" || command === "-h") return { help: true };
  if (!new Set(["runner-replacement", "runner-replacement-bridge", "phase-pointer", "dirty-cleanup-rebind", "phase-trace-lineage"]).has(command)) throw recoveryError("RECOVERY_INPUT_REQUIRED", "command must be runner-replacement, runner-replacement-bridge, phase-pointer, dirty-cleanup-rebind, or phase-trace-lineage");
  const values = { command };
  for (const item of rest) {
    const at = item.indexOf("=");
    if (!item.startsWith("--") || at < 3) throw recoveryError("RECOVERY_INPUT_REQUIRED", `invalid argument: ${item}`);
    const key = item.slice(2, at);
    if (Object.prototype.hasOwnProperty.call(values, key)) throw recoveryError("RECOVERY_INPUT_REQUIRED", `duplicate argument: --${key}`);
    values[key] = item.slice(at + 1);
  }
  const allowed = new Set([
    "command", "task-path", "project", "task", "runner-root", "credential-ref", "credential-hash", "stage",
    "phase-id", "phase-evidence-ref", "phase-evidence-hash", "review-result-ref", "review-result-hash",
    "risk-acceptance-refs", "risk-acceptance-hashes",
    "authorization-ref", "authorization-hash", "bootstrap-packet-ref", "bootstrap-packet-hash",
    "bootstrap-bundle-ref", "bootstrap-bundle-hash",
    "bootstrap-review-result-ref", "bootstrap-review-result-hash", "bootstrap-trust-mode",
    "user-bootstrap-authorization-ref", "user-bootstrap-authorization-hash", "nonce",
    "previous-workspace-root", "clean-workspace-root", "retained-artifact-refs", "retained-artifact-hashes",
  ]);
  const unexpected = Object.keys(values).find((key) => !allowed.has(key));
  if (unexpected) throw recoveryError("RECOVERY_INPUT_REQUIRED", `--${unexpected} is not accepted`);
  if (command === "phase-trace-lineage") validateLineageInput(values);
  else if (command === "runner-replacement-bridge") validateBridgeInput(values);
  else if (command === "dirty-cleanup-rebind") validateDirtyCleanupInput(values);
  else validateRecoveryInput(values, command);
  return values;
}

export function helpText() {
  return [
    "Usage:",
    "  node scripts/task-recovery.mjs runner-replacement --task-path=<absolute> --project=<project> --task=<task> --runner-root=<absolute> --stage=<stage> --credential-ref=<task-relative-ref> --credential-hash=<sha256>",
    "  node scripts/task-recovery.mjs runner-replacement-bridge --task-path=<absolute> --project=<project> --task=<task> --runner-root=<absolute> --stage=<stage> --authorization-ref=<task-relative-ref> --authorization-hash=<sha256> --bootstrap-packet-ref=<task-relative-ref> --bootstrap-packet-hash=<sha256> --bootstrap-bundle-ref=<task-relative-ref> --bootstrap-bundle-hash=<sha256> --bootstrap-review-result-ref=<task-relative-ref> --bootstrap-review-result-hash=<sha256> --nonce=<nonce>",
    "  node scripts/task-recovery.mjs phase-pointer --task-path=<absolute> --project=<project> --task=<task> --runner-root=<absolute> --stage=build-code --credential-ref=<task-relative-ref> --credential-hash=<sha256> [--risk-acceptance-refs=<comma-separated refs> --risk-acceptance-hashes=<comma-separated sha256s>]",
    "  node scripts/task-recovery.mjs dirty-cleanup-rebind --task-path=<absolute> --project=<project> --task=<task> --runner-root=<absolute> --authorization-ref=<task-relative-ref> --authorization-hash=<sha256> --previous-workspace-root=<absolute> --clean-workspace-root=<absolute> --retained-artifact-refs=<comma-separated refs> --retained-artifact-hashes=<comma-separated sha256s> --nonce=<nonce>",
    "  node scripts/task-recovery.mjs phase-trace-lineage --task-path=<absolute> --project=<project> --task=<task> --runner-root=<absolute> --stage=build-code --phase-id=<phase> --phase-evidence-ref=<task-relative-ref> --phase-evidence-hash=<sha256> --review-result-ref=<task-relative-ref> --review-result-hash=<sha256> [--risk-acceptance-refs=<comma-separated refs> --risk-acceptance-hashes=<comma-separated sha256s>]",
    "",
    "Credentials are canonical task-local records. phase-trace-lineage binds historical Phase facts append-only and never replaces old records or pointers.",
    "phase-pointer same-snapshot recovery requires phase_subject.recovery_intent=same-snapshot-phase0-reopen; changed-snapshot recovery must omit it.",
    "The authoritative pointer, closed Phase evidence/review, receipt hashes, and snapshot tree are validated before the create-only gate and pointer CAS.",
    "A committed same-snapshot recovery must complete recovery-bound Phase evidence and a fresh semantic wh-review result; serious findings still require repair or exact risk acceptance.",
    "Never edit task.json, phase-result.json, recovery generations, accepted records, receipts, tests, or reviews by hand.",
    "Success returns recovery_ref/recovery_hash. Continue with task-bootstrap or stage-runtime official entries.",
    "Errors distinguish missing/mismatched/misused intent, pointer or closure mismatch, replay, concurrent pointer change, and persistence conflict.",
    "Errors: RECOVERY_INPUT_REQUIRED, RECOVERY_CREDENTIAL_INVALID, RECOVERY_PHASE_INTENT_REQUIRED, RECOVERY_PHASE_INTENT_MISMATCH, RECOVERY_PHASE_INTENT_USAGE_MISMATCH, RECOVERY_ALREADY_USED, RECOVERY_CONCURRENT_CHANGE, RECOVERY_RECORD_CONFLICT, RECOVERY_*_MISMATCH.",
  ].join("\n");
}

const BRIDGE_AUTH_REF = /^evidence\/(?:authorizations\/[a-f0-9]{64}|runner-replacement\/authorization-[a-f0-9]{64})\.json$/;
const BRIDGE_PACKET_REF = /^evidence\/runner-replacement\/bootstrap-packet-[a-f0-9]{64}\.json$/;
const BRIDGE_BUNDLE_REF = /^evidence\/runner-replacement\/bootstrap-bundles\/([a-f0-9]{64})\.json$/;
const BRIDGE_REVIEW_REF = /^evidence\/runner-replacement\/bootstrap-reviews\/([a-f0-9]{64})\.json$/;
const BRIDGE_TEST_RECEIPT_REF = /^receipts\/runner-replacement\/bootstrap-test-([a-f0-9]{64})\.json$/;
const BRIDGE_TEST_OUTPUT_REF = /^evidence\/runner-replacement\/bootstrap-tests\/([a-f0-9]{64})\.(?:stdout|stderr)$/;
const BRIDGE_COVERAGE_REF = /^evidence\/runner-replacement\/bootstrap-coverage\/([a-f0-9]{64})\.json$/;
const BRIDGE_PROVIDER_CONFIG_REF = /^evidence\/runner-replacement\/bootstrap-provider-config\/([a-f0-9]{64})\.json$/;
const BRIDGE_USER_AUTH_REF = /^evidence\/runner-replacement\/user-bootstrap-authorizations\/([a-f0-9]{64})\.json$/;
const BRIDGE_ROUTE_CORRECTION_REF = /^evidence\/runner-replacement\/route-corrections\/([a-f0-9]{64})\.json$/;
const BRIDGE_DISPATCH_INVALIDATION_REF = /^evidence\/runner-replacement\/dispatch-invalidations\/([a-f0-9]{64})\.json$/;

function validateBridgeInput(values) {
  for (const key of [
    "task-path", "project", "task", "runner-root", "stage", "authorization-ref", "authorization-hash",
    "bootstrap-packet-ref", "bootstrap-packet-hash", "bootstrap-bundle-ref", "bootstrap-bundle-hash", "nonce",
  ]) {
    if (typeof values[key] !== "string" || values[key].trim() === "") {
      throw recoveryError("RECOVERY_INPUT_REQUIRED", `--${key} is required`);
    }
  }
  if (!STAGES.has(values.stage)) throw recoveryError("RECOVERY_INPUT_REQUIRED", "--stage is invalid");
  for (const key of ["authorization-hash", "bootstrap-packet-hash", "bootstrap-bundle-hash"]) {
    if (!HASH.test(values[key])) throw recoveryError("RECOVERY_INPUT_REQUIRED", `--${key} must be a sha256`);
  }
  const trustMode = values["bootstrap-trust-mode"] === "user-authorized-bootstrap";
  const modeFields = trustMode
    ? ["user-bootstrap-authorization-ref", "user-bootstrap-authorization-hash"]
    : ["bootstrap-review-result-ref", "bootstrap-review-result-hash"];
  const forbiddenFields = trustMode
    ? ["bootstrap-review-result-ref", "bootstrap-review-result-hash"]
    : ["user-bootstrap-authorization-ref", "user-bootstrap-authorization-hash"];
  for (const key of modeFields) {
    if (typeof values[key] !== "string" || values[key].trim() === "") throw recoveryError("RECOVERY_INPUT_REQUIRED", `--${key} is required`);
  }
  for (const key of forbiddenFields) {
    if (values[key] !== undefined) throw recoveryError("RECOVERY_INPUT_REQUIRED", `--${key} is forbidden in this bootstrap trust mode`);
  }
  if (values["bootstrap-trust-mode"] !== undefined && !trustMode) throw recoveryError("RECOVERY_INPUT_REQUIRED", "--bootstrap-trust-mode is invalid");
  if (!HASH.test(values[modeFields[1]])) throw recoveryError("RECOVERY_INPUT_REQUIRED", `--${modeFields[1]} must be a sha256`);
  if (!/^[A-Za-z0-9._-]{1,256}$/.test(values.nonce)) throw recoveryError("RECOVERY_INPUT_REQUIRED", "--nonce is invalid");
}

function readBridgeRecord(task, ref, expectedHash, label, pattern, errorCode) {
  if (typeof ref !== "string" || !pattern.test(ref)) throw recoveryError(errorCode, `${label} reference is outside the allowed namespace`);
  let raw;
  try { raw = task.readRecord(ref); } catch { throw recoveryError(errorCode, `${label} is missing`); }
  if (sha256(raw) !== expectedHash) throw recoveryError(errorCode, `${label} hash mismatch`);
  let value;
  try { value = JSON.parse(raw); } catch { throw recoveryError(errorCode, `${label} is invalid JSON`); }
  return Object.freeze({ ref, hash: expectedHash, raw, value });
}

function normalizedAuthorization(record, task, stage) {
  const value = record.value;
  let excerpt; let excerptHash; let sourceRef;
  if (value?.schema_version === "workflowhub-runner-replacement-authorization.v1") {
    if (value.project_name !== task.identity.projectName || value.task_id !== task.identity.taskId
        || value.stage !== stage || value.decision !== "accepted") {
      throw recoveryError("RECOVERY_AUTHORIZATION_INVALID", "authorization identity or decision is invalid");
    }
    excerpt = value.excerpt;
    excerptHash = value.excerpt_hash;
    sourceRef = value.source_ref ?? null;
  } else if (value?.schema_version === "workflowhub-host-authorization-evidence.v1") {
    if (value.task_id !== task.identity.taskId
        || !Array.isArray(value.authorization_scope)
        || !value.authorization_scope.some((item) => typeof item === "string" && item.includes("runner replacement"))) {
      throw recoveryError("RECOVERY_AUTHORIZATION_INVALID", "host authorization does not authorize runner replacement");
    }
    excerpt = value.authorization_excerpt;
    excerptHash = value.authorization_excerpt_sha256;
    sourceRef = value.source_ref ?? null;
  } else {
    throw recoveryError("RECOVERY_AUTHORIZATION_INVALID", "authorization schema is invalid");
  }
  if (typeof excerpt !== "string" || excerpt.trim() === "" || !HASH.test(excerptHash ?? "")
      || sha256(excerpt) !== excerptHash || (sourceRef !== null && typeof sourceRef !== "string")) {
    throw recoveryError("RECOVERY_AUTHORIZATION_INVALID", "authorization excerpt provenance is invalid");
  }
  return Object.freeze({
    ref: record.ref,
    hash: record.hash,
    excerpt,
    excerpt_hash: excerptHash,
    source_ref: sourceRef,
  });
}

function assertBootstrapPacket(packet, task, values, authorization, lineage, previous, next, manifestHash, business) {
  const required = new Set([
    "schema_version", "project_name", "task_id", "stage", "current_generation", "current_manifest",
    "current_runner", "next_runner", "accepted_business_snapshot", "authorization",
  ]);
  if (!packet || typeof packet !== "object" || Array.isArray(packet)
      || Object.keys(packet).some((key) => !required.has(key)) || [...required].some((key) => packet[key] === undefined)
      || packet.schema_version !== "workflowhub-runner-replacement-bootstrap-packet.v1"
      || packet.project_name !== task.identity.projectName || packet.task_id !== task.identity.taskId
      || packet.stage !== values.stage) {
    throw recoveryError("RECOVERY_BOOTSTRAP_PACKET_MISMATCH", "bootstrap packet envelope is invalid");
  }
  if (!lineage.replacements
      || !deepEqual(packet.current_generation, { ref: lineage.replacements.ref, hash: lineage.replacements.hash })) {
    throw recoveryError("RECOVERY_GENERATION_MISMATCH", "bootstrap packet does not bind the latest runner generation");
  }
  if (!deepEqual(packet.current_manifest, { ref: "task.json", hash: manifestHash })) {
    throw recoveryError("RECOVERY_MANIFEST_HASH_MISMATCH", "bootstrap packet does not bind the current task manifest");
  }
  if (!deepEqual(packet.authorization, { ref: authorization.ref, hash: authorization.hash })) {
    throw recoveryError("RECOVERY_AUTHORIZATION_INVALID", "bootstrap packet does not bind the supplied authorization");
  }
  if (!deepEqual(packet.current_runner, previous) || !deepEqual(packet.next_runner, next)) {
    throw recoveryError("RECOVERY_RUNNER_PROVENANCE_MISMATCH", "bootstrap packet runner identity does not match Git");
  }
  if (!deepEqual(packet.accepted_business_snapshot, business)) {
    throw recoveryError("RECOVERY_BUSINESS_SNAPSHOT_MISMATCH", "bootstrap packet business snapshot is stale");
  }
}

function readRawBridgeRecord(task, ref, expectedHash, pattern, label, invalidCode, mismatchCode = invalidCode) {
  const match = pattern.exec(ref ?? "");
  if (!match) throw recoveryError(mismatchCode, `${label} reference is outside the allowed namespace`);
  let raw;
  try { raw = task.readRecord(ref); } catch { throw recoveryError(mismatchCode, `${label} is missing`); }
  const hash = sha256(raw);
  if (hash !== expectedHash || (match[1] && match[1] !== hash)) throw recoveryError(mismatchCode, `${label} hash mismatch`);
  return Object.freeze({ ref, hash, raw });
}

function assertEmbeddedRecord(task, entry, pattern, label, invalidCode, mismatchCode) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)
      || !deepEqual(Object.keys(entry).sort(), ["bytes", "hash", "ref"])
      || typeof entry.bytes !== "string") {
    throw recoveryError(invalidCode, `${label} binding is invalid`);
  }
  const record = readRawBridgeRecord(task, entry.ref, entry.hash, pattern, label, invalidCode, mismatchCode);
  if (record.raw !== entry.bytes) throw recoveryError(mismatchCode, `${label} sealed bytes mismatch`);
  let value;
  try { value = JSON.parse(record.raw); } catch { throw recoveryError(invalidCode, `${label} is invalid JSON`); }
  return Object.freeze({ ...record, value });
}

function runnerDiff(next, previous) {
  try {
    const raw = execFileSync("git", ["diff", "--binary", previous.runner_oid, next.runner_oid], {
      cwd: next.runner_root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    });
    const paths = execFileSync("git", ["diff", "--name-only", previous.runner_oid, next.runner_oid], {
      cwd: next.runner_root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    }).trim().split("\n").filter(Boolean);
    const snapshotTree = execFileSync("git", ["rev-parse", `${next.runner_oid}^{tree}`], {
      cwd: next.runner_root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    return Object.freeze({ raw, hash: sha256(raw), paths: Object.freeze(paths), snapshotTree });
  } catch {
    throw recoveryError("RECOVERY_RUNNER_PROVENANCE_MISMATCH", "runner diff or tree cannot be reproduced");
  }
}

function assertBootstrapTest(task, record, next, snapshotTree) {
  const value = record.value;
  const allowed = ["schema_version", "project_name", "task_id", "commit_oid", "snapshot_tree", "command", "exit_code", "counts", "stdout", "stderr"];
  if (!value || typeof value !== "object" || Array.isArray(value)
      || Object.keys(value).some((key) => !allowed.includes(key))
      || allowed.some((key) => value[key] === undefined)
      || value.schema_version !== "runner-replacement-bootstrap-test-receipt.v1"
      || value.project_name !== "workflowhub" || value.task_id !== task.identity.taskId
      || value.commit_oid !== next.runner_oid || value.snapshot_tree !== snapshotTree
      || typeof value.command !== "string" || value.command.trim() === "" || value.exit_code !== 0) {
    throw recoveryError("RECOVERY_BOOTSTRAP_TEST_INVALID", "bootstrap test receipt is invalid");
  }
  const counts = value.counts;
  if (!counts || !deepEqual(Object.keys(counts).sort(), ["failed", "files", "passed", "tests"])
      || Object.values(counts).some((count) => !Number.isSafeInteger(count) || count < 0)
      || counts.files < 1 || counts.tests < 1 || counts.failed !== 0
      || counts.passed !== counts.tests) {
    throw recoveryError("RECOVERY_BOOTSTRAP_TEST_INVALID", "bootstrap test counts do not prove a complete PASS");
  }
  for (const [key, suffix] of [["stdout", "stdout"], ["stderr", "stderr"]]) {
    const output = value[key];
    if (!output || !deepEqual(Object.keys(output).sort(), ["hash", "ref"])) {
      throw recoveryError("RECOVERY_BOOTSTRAP_TEST_INVALID", `bootstrap test ${key} binding is invalid`);
    }
    const match = BRIDGE_TEST_OUTPUT_REF.exec(output.ref ?? "");
    if (!match || !output.ref.endsWith(`.${suffix}`)) {
      throw recoveryError("RECOVERY_BOOTSTRAP_TEST_INVALID", `bootstrap test ${key} reference is invalid`);
    }
    let raw;
    try { raw = task.readRecord(output.ref); } catch { throw recoveryError("RECOVERY_BOOTSTRAP_TEST_MISMATCH", `bootstrap test ${key} is missing`); }
    if (sha256(raw) !== output.hash || match[1] !== output.hash) {
      throw recoveryError("RECOVERY_BOOTSTRAP_TEST_MISMATCH", `bootstrap test ${key} hash mismatch`);
    }
  }
}

function assertBootstrapCoverage(task, record, previous, next, diff) {
  const value = record.value;
  const allowed = ["schema_version", "project_name", "task_id", "old_runner_oid", "new_runner_oid", "diff_hash", "entries"];
  if (!value || typeof value !== "object" || Array.isArray(value)
      || Object.keys(value).some((key) => !allowed.includes(key)) || allowed.some((key) => value[key] === undefined)
      || value.schema_version !== "runner-replacement-path-coverage-map.v1"
      || value.project_name !== task.identity.projectName || value.task_id !== task.identity.taskId
      || value.old_runner_oid !== previous.runner_oid || value.new_runner_oid !== next.runner_oid
      || value.diff_hash !== diff.hash || !Array.isArray(value.entries)
      || value.entries.length !== diff.paths.length) {
    throw recoveryError("RECOVERY_BOOTSTRAP_COVERAGE_MISMATCH", "bootstrap path coverage map does not bind the exact diff");
  }
  const paths = [];
  for (const entry of value.entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)
        || typeof entry.path !== "string" || entry.path.length === 0
        || (entry.status === "covered"
          ? !Array.isArray(entry.test_ids) || entry.test_ids.length === 0 || entry.test_ids.some((id) => typeof id !== "string" || id.trim() === "")
          : entry.status === "manual_review"
            ? typeof entry.manual_focus !== "string" || entry.manual_focus.trim() === ""
            : true)) {
      throw recoveryError("RECOVERY_BOOTSTRAP_COVERAGE_INVALID", "bootstrap path coverage entry is invalid");
    }
    paths.push(entry.path);
  }
  if (!deepEqual(paths, diff.paths) || new Set(paths).size !== paths.length) {
    throw recoveryError("RECOVERY_BOOTSTRAP_COVERAGE_MISMATCH", "bootstrap coverage paths do not equal the Git path inventory");
  }
}

function assertBootstrapProviderConfig(task, record) {
  const value = record.value;
  const allowed = ["schema_version", "source_hash", "ordered_providers", "mode", "minimum_heterologous", "profiles", "secret_free"];
  if (!value || typeof value !== "object" || Array.isArray(value)
      || !deepEqual(Object.keys(value).sort(), [...allowed].sort())
      || value.schema_version !== "runner-replacement-bootstrap-provider-config.v1"
      || value.secret_free !== true || !HASH.test(value.source_hash)
      || value.mode !== "full_only"
      || !Array.isArray(value.ordered_providers) || value.ordered_providers.length === 0
      || new Set(value.ordered_providers).size !== value.ordered_providers.length
      || value.ordered_providers.some((provider) => typeof provider !== "string" || !/^[^/]+\/[^/]+$/.test(provider))
      || !Number.isSafeInteger(value.minimum_heterologous) || value.minimum_heterologous < 1
      || value.minimum_heterologous > new Set(value.ordered_providers.map((provider) => provider.split("/", 1)[0])).size
      || !value.profiles || typeof value.profiles !== "object" || Array.isArray(value.profiles)
      || !deepEqual(Object.keys(value.profiles), value.ordered_providers)) {
    throw recoveryError("RECOVERY_BOOTSTRAP_PROVIDER_CONFIG_INVALID", "bootstrap provider config is invalid or contains undeclared fields");
  }
  let previousPriority = -1;
  for (const provider of value.ordered_providers) {
    const profile = value.profiles[provider];
    const keys = ["model", "effort", "thinking", "priority"];
    if (!profile || typeof profile !== "object" || Array.isArray(profile)
        || !deepEqual(Object.keys(profile).sort(), [...keys].sort())
        || typeof profile.model !== "string" || profile.model.trim() === ""
        || !(profile.effort === null || typeof profile.effort === "string")
        || !(profile.thinking === null || typeof profile.thinking === "boolean")
        || !Number.isSafeInteger(profile.priority) || profile.priority < 1
        || profile.priority <= previousPriority) {
      throw recoveryError("RECOVERY_BOOTSTRAP_PROVIDER_CONFIG_INVALID", "bootstrap provider profiles do not preserve the configured ordered route");
    }
    previousPriority = profile.priority;
  }
  return value;
}

function assertBootstrapBundle(task, bundle, packet, authorization, previous, next) {
  const value = bundle.value;
  const required = ["schema_version", "project_name", "task_id", "purpose", "packet", "authorization", "source_diff", "bootstrap_test_receipt", "path_coverage_map", "provider_config"];
  if (!value || typeof value !== "object" || Array.isArray(value)
      || !deepEqual(Object.keys(value).sort(), [...required].sort())
      || value.schema_version !== "runner-replacement-bootstrap-sealed-bundle.v1"
      || value.project_name !== task.identity.projectName || value.task_id !== task.identity.taskId
      || value.purpose !== "runner-replacement-bootstrap") {
    throw recoveryError("RECOVERY_BOOTSTRAP_BUNDLE_INVALID", "sealed bootstrap bundle envelope is invalid");
  }
  const sealedPacket = assertEmbeddedRecord(task, value.packet, BRIDGE_PACKET_REF, "sealed packet", "RECOVERY_BOOTSTRAP_BUNDLE_INVALID", "RECOVERY_BOOTSTRAP_BUNDLE_MISMATCH");
  const sealedAuthorization = assertEmbeddedRecord(task, value.authorization, BRIDGE_AUTH_REF, "sealed authorization", "RECOVERY_BOOTSTRAP_BUNDLE_INVALID", "RECOVERY_BOOTSTRAP_BUNDLE_MISMATCH");
  if (sealedPacket.ref !== packet.ref || sealedPacket.hash !== packet.hash || sealedPacket.raw !== packet.raw
      || sealedAuthorization.ref !== authorization.ref || sealedAuthorization.hash !== authorization.hash || sealedAuthorization.raw !== authorization.raw) {
    throw recoveryError("RECOVERY_BOOTSTRAP_BUNDLE_MISMATCH", "sealed bundle packet or authorization does not match the bridge inputs");
  }
  const diff = runnerDiff(next, previous);
  if (!deepEqual(value.source_diff, {
    old_runner_oid: previous.runner_oid,
    new_runner_oid: next.runner_oid,
    hash: diff.hash,
    paths: [...diff.paths],
  })) {
    throw recoveryError("RECOVERY_BOOTSTRAP_BUNDLE_MISMATCH", "sealed bundle source diff is not reproducible");
  }
  const testReceipt = assertEmbeddedRecord(task, value.bootstrap_test_receipt, BRIDGE_TEST_RECEIPT_REF, "bootstrap test receipt", "RECOVERY_BOOTSTRAP_TEST_INVALID", "RECOVERY_BOOTSTRAP_TEST_MISMATCH");
  assertBootstrapTest(task, testReceipt, next, diff.snapshotTree);
  const coverage = assertEmbeddedRecord(task, value.path_coverage_map, BRIDGE_COVERAGE_REF, "bootstrap coverage map", "RECOVERY_BOOTSTRAP_COVERAGE_INVALID", "RECOVERY_BOOTSTRAP_COVERAGE_MISMATCH");
  assertBootstrapCoverage(task, coverage, previous, next, diff);
  const providerConfig = assertEmbeddedRecord(task, value.provider_config, BRIDGE_PROVIDER_CONFIG_REF, "bootstrap provider config", "RECOVERY_BOOTSTRAP_PROVIDER_CONFIG_INVALID", "RECOVERY_BOOTSTRAP_PROVIDER_CONFIG_MISMATCH");
  return Object.freeze({
    diff,
    providerConfig: assertBootstrapProviderConfig(task, providerConfig),
    testReceipt,
    coverage,
  });
}

function assertBootstrapReview(task, review, packet, bundle, previous, next, closure) {
  const value = review.value;
  const required = ["schema_version", "project_name", "task_id", "purpose", "packet_ref", "packet_hash", "bundle_ref", "bundle_hash", "material_id", "old_runner_oid", "new_runner_oid", "snapshot_tree", "route_descriptor_ref", "route_descriptor_hash", "provider_results", "status", "verdict", "findings", "error"];
  if (!value || typeof value !== "object" || Array.isArray(value)
      || !deepEqual(Object.keys(value).sort(), [...required].sort())
      || value.schema_version !== "bootstrap-review.v1"
      || value.project_name !== task.identity.projectName || value.task_id !== task.identity.taskId
      || value.purpose !== "runner-replacement-bootstrap"
      || value.status !== "semantic" || value.verdict !== "pass"
      || !Array.isArray(value.findings) || value.error !== null) {
    throw recoveryError("RECOVERY_BOOTSTRAP_REVIEW_INVALID", "external sealed bootstrap review is not a completed PASS");
  }
  if (value.packet_ref !== packet.ref || value.packet_hash !== packet.hash
      || value.bundle_ref !== bundle.ref || value.bundle_hash !== bundle.hash
      || value.material_id !== bundle.hash || value.old_runner_oid !== previous.runner_oid
      || value.new_runner_oid !== next.runner_oid || value.snapshot_tree !== closure.diff.snapshotTree
      || value.route_descriptor_ref !== bundle.value.provider_config.ref
      || value.route_descriptor_hash !== bundle.value.provider_config.hash) {
    throw recoveryError("RECOVERY_BOOTSTRAP_REVIEW_MISMATCH", "external bootstrap review is not bound to the exact sealed material");
  }
  if (!Array.isArray(value.provider_results)
      || !deepEqual(value.provider_results.map(({ provider }) => provider), closure.providerConfig.ordered_providers)) {
    throw recoveryError("RECOVERY_BOOTSTRAP_REVIEW_INVALID", "bootstrap review must record every requested provider in route order");
  }
  const valid = [];
  for (const result of value.provider_results) {
    const keys = ["provider", "runtime_id", "session_id", "status", "verdict", "findings", "error"];
    if (!result || typeof result !== "object" || Array.isArray(result)
        || !deepEqual(Object.keys(result).sort(), [...keys].sort())
        || !Array.isArray(result.findings)) {
      throw recoveryError("RECOVERY_BOOTSTRAP_REVIEW_INVALID", "bootstrap provider result is invalid");
    }
    if (result.status === "completed") {
      if (typeof result.runtime_id !== "string" || result.runtime_id.trim() === ""
          || typeof result.session_id !== "string" || result.session_id.trim() === ""
          || !["pass", "revise_required"].includes(result.verdict) || result.error !== null) {
        throw recoveryError("RECOVERY_BOOTSTRAP_REVIEW_INVALID", "completed bootstrap provider result is incomplete");
      }
      valid.push(result);
    } else if (!["unavailable", "error"].includes(result.status)
        || !(result.runtime_id === null || (typeof result.runtime_id === "string" && result.runtime_id.trim() !== ""))
        || !(result.session_id === null || (typeof result.session_id === "string" && result.session_id.trim() !== ""))
        || result.verdict !== null || result.findings.length !== 0
        || !result.error || typeof result.error.code !== "string" || typeof result.error.message !== "string") {
      throw recoveryError("RECOVERY_BOOTSTRAP_REVIEW_INVALID", "failed bootstrap provider result is invalid");
    }
  }
  const aggregateVerdict = valid.some(({ verdict }) => verdict === "revise_required") ? "revise_required" : "pass";
  const aggregateFindings = valid.flatMap(({ provider, findings }) => findings.map((finding) => ({ provider, ...finding })));
  if (valid.length < closure.providerConfig.minimum_heterologous
      || value.verdict !== aggregateVerdict || !deepEqual(value.findings, aggregateFindings)) {
    throw recoveryError("RECOVERY_BOOTSTRAP_REVIEW_INVALID", "bootstrap review does not match provider quorum and aggregation");
  }
}

function assertUserBootstrapAuthorization(task, record, authorization, packet, bundle, lineage, next, closure, manifestHash) {
  const value = record.value;
  const required = [
    "schema_version", "project_name", "task_id", "purpose", "decision", "reason", "generation", "single_use",
    "base_authorization", "current_generation", "current_manifest", "runner_subject", "source_diff",
    "test_receipts", "coverage", "route_correction", "sealed_bundle", "invalidated_dispatches", "future_policy",
  ];
  if (!value || typeof value !== "object" || Array.isArray(value)
      || !deepEqual(Object.keys(value).sort(), [...required].sort())
      || value.schema_version !== "workflowhub-user-authorized-runner-bootstrap.v1"
      || value.project_name !== task.identity.projectName || value.task_id !== task.identity.taskId
      || value.purpose !== "runner-replacement-bootstrap" || value.decision !== "accepted"
      || value.reason !== "explicit_user_runner_upgrade_authorization"
      || value.generation !== 2 || value.single_use !== true
      || value.future_policy !== "formal_review_required") {
    throw recoveryError("RECOVERY_BOOTSTRAP_AUTHORIZATION_INVALID", "user-authorized bootstrap envelope is invalid");
  }
  const expected = {
    base_authorization: { ref: authorization.ref, hash: authorization.hash },
    current_generation: { ref: lineage.replacements.ref, hash: lineage.replacements.hash },
    current_manifest: { ref: "task.json", hash: manifestHash },
    runner_subject: { oid: next.runner_oid, tree: closure.diff.snapshotTree },
    source_diff: { hash: closure.diff.hash, path_count: closure.diff.paths.length },
    coverage: { ref: closure.coverage.ref, hash: closure.coverage.hash },
    sealed_bundle: { ref: bundle.ref, hash: bundle.hash },
  };
  for (const key of Object.keys(expected)) {
    if (!deepEqual(value[key], expected[key])) {
      throw recoveryError("RECOVERY_BOOTSTRAP_AUTHORIZATION_MISMATCH", `user-authorized bootstrap ${key} binding is stale`);
    }
  }
  if (!Array.isArray(value.test_receipts) || value.test_receipts.length !== 3
      || !deepEqual(value.test_receipts[0], { ref: closure.testReceipt.ref, hash: closure.testReceipt.hash })) {
    throw recoveryError("RECOVERY_BOOTSTRAP_AUTHORIZATION_MISMATCH", "user-authorized bootstrap test receipts are incomplete");
  }
  if (closure.testReceipt.value?.exit_code !== 0 || closure.testReceipt.value?.counts?.tests < 7
      || closure.testReceipt.value?.counts?.passed !== closure.testReceipt.value?.counts?.tests
      || closure.testReceipt.value?.counts?.failed !== 0) {
    throw recoveryError("RECOVERY_BOOTSTRAP_AUTHORIZATION_INVALID", "current exact-route bridge receipt is invalid");
  }
  const bridgeSeven = readBridgeRecord(task, value.test_receipts[1]?.ref, value.test_receipts[1]?.hash, "prior 7/7 bridge test receipt", BRIDGE_TEST_RECEIPT_REF, "RECOVERY_BOOTSTRAP_AUTHORIZATION_INVALID");
  if (bridgeSeven.value?.exit_code !== 0 || bridgeSeven.value?.counts?.tests !== 7 || bridgeSeven.value?.counts?.passed !== 7 || bridgeSeven.value?.counts?.failed !== 0) {
    throw recoveryError("RECOVERY_BOOTSTRAP_AUTHORIZATION_INVALID", "prior bridge 7/7 receipt is invalid");
  }
  const prior = readBridgeRecord(task, value.test_receipts[2]?.ref, value.test_receipts[2]?.hash, "prior bootstrap test receipt", BRIDGE_TEST_RECEIPT_REF, "RECOVERY_BOOTSTRAP_AUTHORIZATION_INVALID");
  if (prior.value?.exit_code !== 0 || prior.value?.counts?.tests !== 142 || prior.value?.counts?.passed !== 142 || prior.value?.counts?.failed !== 0) {
    throw recoveryError("RECOVERY_BOOTSTRAP_AUTHORIZATION_INVALID", "prior 142/142 receipt is invalid");
  }
  const correction = readBridgeRecord(task, value.route_correction?.ref, value.route_correction?.hash, "route correction", BRIDGE_ROUTE_CORRECTION_REF, "RECOVERY_BOOTSTRAP_AUTHORIZATION_INVALID");
  const route = correction.value?.authoritative_route;
  if (!route || route.stage !== "build-code"
      || !deepEqual(route.initial, closure.providerConfig.ordered_providers)
      || route.mode !== closure.providerConfig.mode
      || route.minimum_heterologous !== closure.providerConfig.minimum_heterologous
      || !deepEqual(route.profiles, closure.providerConfig.profiles)) {
    throw recoveryError("RECOVERY_BOOTSTRAP_AUTHORIZATION_MISMATCH", "route correction does not bind the sealed route descriptor");
  }
  if (!Array.isArray(value.invalidated_dispatches) || value.invalidated_dispatches.length !== 2) {
    throw recoveryError("RECOVERY_BOOTSTRAP_AUTHORIZATION_INVALID", "both direct dispatches must be invalidated");
  }
  for (const invalidationReceipt of value.invalidated_dispatches) {
    const invalidation = readBridgeRecord(task, invalidationReceipt?.ref, invalidationReceipt?.hash, "dispatch invalidation", BRIDGE_DISPATCH_INVALIDATION_REF, "RECOVERY_BOOTSTRAP_AUTHORIZATION_INVALID");
    if (invalidation.value?.decision !== "invalid_unavailable"
        || invalidation.value?.effect !== "cannot_authorize_credential") {
      throw recoveryError("RECOVERY_BOOTSTRAP_AUTHORIZATION_INVALID", "direct dispatch invalidation is not fail-closed");
    }
  }
}

function acceptedBusinessSnapshot(task) {
  let accepted;
  try { accepted = createTaskKernel(task).readAccepted("make-decision"); }
  catch { throw recoveryError("RECOVERY_BUSINESS_SNAPSHOT_MISMATCH", "accepted make-decision is unavailable"); }
  return Object.freeze({
    accepted_ref: accepted.accepted_ref,
    accepted_hash: accepted.accepted_hash,
    baseline_commit: accepted.facts.baseline_commit,
    snapshot_tree: accepted.facts.snapshot_tree,
    target_repo_root: task.manifest.target_repo_root,
  });
}

function runnerReplacementBridge(values) {
  const task = openTask(values["task-path"], values.project, values.task);
  const lineage = readRunnerMigration(task);
  if (!lineage.replacements) throw recoveryError("RECOVERY_GENERATION_MISMATCH", "bridge requires an existing runner replacement generation");
  const previous = lineage.runner_identity;
  let next;
  try {
    next = inspectRunnerIdentity({
      runnerRoot: values["runner-root"],
      projectName: task.identity.projectName,
      taskId: task.identity.taskId,
      stage: values.stage,
      requireClean: true,
    });
  } catch (error) {
    throw recoveryError("RECOVERY_RUNNER_IDENTITY_INVALID", error.message);
  }
  try { assertAncestor(previous.runner_oid, next.runner_root); }
  catch (error) {
    if (error?.code === "RECOVERY_RUNNER_ANCESTRY_UNREACHABLE") {
      throw recoveryError("RECOVERY_RUNNER_PROVENANCE_MISMATCH", "new runner does not contain the current runner commit");
    }
    throw error;
  }
  const authorizationRecord = readBridgeRecord(
    task, values["authorization-ref"], values["authorization-hash"], "authorization",
    BRIDGE_AUTH_REF, "RECOVERY_AUTHORIZATION_INVALID",
  );
  const authorization = normalizedAuthorization(authorizationRecord, task, values.stage);
  const packetRecord = readBridgeRecord(
    task, values["bootstrap-packet-ref"], values["bootstrap-packet-hash"], "bootstrap packet",
    BRIDGE_PACKET_REF, "RECOVERY_BOOTSTRAP_PACKET_MISMATCH",
  );
  const manifestHash = sha256(task.readRecord("task.json"));
  const business = acceptedBusinessSnapshot(task);
  assertBootstrapPacket(packetRecord.value, task, values, authorization, lineage, previous, next, manifestHash, business);
  const bundle = readBridgeRecord(
    task, values["bootstrap-bundle-ref"], values["bootstrap-bundle-hash"], "sealed bootstrap bundle",
    BRIDGE_BUNDLE_REF, "RECOVERY_BOOTSTRAP_BUNDLE_MISMATCH",
  );
  if (BRIDGE_BUNDLE_REF.exec(bundle.ref)?.[1] !== bundle.hash) {
    throw recoveryError("RECOVERY_BOOTSTRAP_BUNDLE_MISMATCH", "sealed bootstrap bundle canonical reference hash mismatch");
  }
  const closure = assertBootstrapBundle(task, bundle, packetRecord, authorizationRecord, previous, next);
  const userAuthorized = values["bootstrap-trust-mode"] === "user-authorized-bootstrap";
  let bootstrapAuthority;
  if (userAuthorized) {
    if (lineage.replacements.value?.generation !== 1 || lineage.replacements.next_generation !== 2
        || values.nonce !== "generation-2") {
      throw recoveryError("RECOVERY_BOOTSTRAP_AUTHORIZATION_INVALID", "user-authorized bootstrap is restricted to generation 2");
    }
    const userAuthorization = readBridgeRecord(
      task, values["user-bootstrap-authorization-ref"], values["user-bootstrap-authorization-hash"],
      "user bootstrap authorization", BRIDGE_USER_AUTH_REF, "RECOVERY_BOOTSTRAP_AUTHORIZATION_INVALID",
    );
    if (BRIDGE_USER_AUTH_REF.exec(userAuthorization.ref)?.[1] !== userAuthorization.hash) {
      throw recoveryError("RECOVERY_BOOTSTRAP_AUTHORIZATION_MISMATCH", "user bootstrap authorization canonical reference hash mismatch");
    }
    assertUserBootstrapAuthorization(task, userAuthorization, authorizationRecord, packetRecord, bundle, lineage, next, closure, manifestHash);
    bootstrapAuthority = { bootstrap_user_authorization: { ref: userAuthorization.ref, hash: userAuthorization.hash } };
  } else {
    const review = readBridgeRecord(
      task, values["bootstrap-review-result-ref"], values["bootstrap-review-result-hash"], "bootstrap review",
      BRIDGE_REVIEW_REF, "RECOVERY_BOOTSTRAP_REVIEW_INVALID",
    );
    if (BRIDGE_REVIEW_REF.exec(review.ref)?.[1] !== review.hash) {
      throw recoveryError("RECOVERY_BOOTSTRAP_REVIEW_MISMATCH", "bootstrap review canonical reference hash mismatch");
    }
    assertBootstrapReview(task, review, packetRecord, bundle, previous, next, closure);
    bootstrapAuthority = { bootstrap_review_result: { ref: review.ref, hash: review.hash } };
  }
  const credential = {
    schema_version: "workflowhub-recovery-credential.v1",
    project_name: task.identity.projectName,
    task_id: task.identity.taskId,
    recovery_kind: "runner-replacement",
    nonce: values.nonce,
    issued_at: new Date().toISOString(),
    decision: "accepted",
    accepted_business_snapshot: business,
    runner_subject: {
      previous_runner: previous,
      new_runner: next,
      previous_manifest_hash: manifestHash,
      stage: values.stage,
    },
    bridge_subject: {
      current_generation: { ref: lineage.replacements.ref, hash: lineage.replacements.hash },
      current_manifest: { ref: "task.json", hash: manifestHash },
      authorization,
      bootstrap_packet: { ref: packetRecord.ref, hash: packetRecord.hash },
      sealed_bundle: { ref: bundle.ref, hash: bundle.hash },
      ...bootstrapAuthority,
    },
  };
  validateRecoveryCredential(credential);
  const ref = credentialRef("runner-replacement", values.nonce);
  const raw = canonical(credential);
  const result = task.withRecordLock(RECOVERY_OPERATIONS["runner-replacement"].lock_ref, () => {
    try {
      task.readRecord(ref);
      throw recoveryError("RECOVERY_ALREADY_USED", "bridge nonce is already published");
    } catch (error) {
      if (error?.code === "RECOVERY_ALREADY_USED") throw error;
      if (error?.code !== "ENOENT" && !/record.*ENOENT|missing/.test(error?.message ?? "")) throw error;
    }
    const fresh = readRecoveryGeneration(task, "runner-replacement");
    if (fresh?.ref !== lineage.replacements.ref || fresh?.hash !== lineage.replacements.hash
        || sha256(task.readRecord("task.json")) !== manifestHash) {
      throw recoveryError("RECOVERY_CONCURRENT_CHANGE", "runner generation or manifest changed before credential publication");
    }
    try { task.writeRecoveryCredential(ref, raw); }
    catch (error) { throw recoveryError(error.message?.includes("conflict") ? "RECOVERY_RECORD_CONFLICT" : "RECOVERY_CONCURRENT_CHANGE", error.message); }
    return { credential_ref: ref, credential_hash: sha256(raw) };
  });
  return result;
}

function readRunnerMigration(task) {
  if (!task.manifest.runner_root_migration?.ref) throw recoveryError("RECOVERY_RUNNER_PROVENANCE_MISMATCH", "task has no previous runner lineage");
  let record;
  try { record = JSON.parse(task.readRecord(task.manifest.runner_root_migration.ref)); } catch { throw recoveryError("RECOVERY_RUNNER_PROVENANCE_MISMATCH", "previous runner lineage is unreadable"); }
  if (!record?.runner_identity) throw recoveryError("RECOVERY_RUNNER_PROVENANCE_MISMATCH", "previous runner lineage is invalid");
  const replacements = readRecoveryGeneration(task, "runner-replacement");
  if (!replacements) {
    if (record.runner_identity.runner_root !== task.manifest.runner_root || record.runner_identity.runner_oid !== task.manifest.runner_oid) {
      throw recoveryError("RECOVERY_RUNNER_PROVENANCE_MISMATCH", "previous runner lineage does not match the manifest");
    }
    return Object.freeze({ runner_identity: record.runner_identity, replacements: null });
  }
  if (task.manifest.runner_replacement?.ref !== replacements.ref
      || task.manifest.runner_replacement?.integrity_hash !== replacements.hash
      || replacements.value.after.identity.runner_root !== task.manifest.runner_root
      || replacements.value.after.identity.runner_oid !== task.manifest.runner_oid) {
    throw recoveryError("RECOVERY_RUNNER_PROVENANCE_MISMATCH", "runner replacement chain does not match the manifest");
  }
  return Object.freeze({ runner_identity: replacements.value.after.identity, replacements });
}

function assertAncestor(oldOid, newRoot) {
  try { execFileSync("git", ["cat-file", "-e", `${oldOid}^{commit}`], { cwd: newRoot, stdio: "ignore" }); }
  catch { throw recoveryError("RECOVERY_RUNNER_ANCESTRY_UNREACHABLE", "previous runner commit is not readable from the new runner"); }
  try { execFileSync("git", ["merge-base", "--is-ancestor", oldOid, "HEAD"], { cwd: newRoot, stdio: "ignore" }); }
  catch (error) { if (error.status === 1) throw recoveryError("RECOVERY_RUNNER_PROVENANCE_MISMATCH", "previous runner commit is not an ancestor of the new runner"); throw recoveryError("RECOVERY_RUNNER_ANCESTRY_UNREACHABLE", "runner ancestry could not be verified"); }
}

function assertBusinessSnapshot(task, credential, kernel) {
  let accepted;
  try { accepted = kernel.readAccepted("make-decision"); } catch { throw recoveryError("RECOVERY_BUSINESS_SNAPSHOT_MISMATCH", "accepted make-decision is unavailable"); }
  const business = credential.value.accepted_business_snapshot;
  if (business.accepted_ref !== accepted.accepted_ref || business.accepted_hash !== accepted.accepted_hash
    || business.baseline_commit !== accepted.facts.baseline_commit
    || !OID.test(accepted.facts.snapshot_tree ?? "") || business.snapshot_tree !== accepted.facts.snapshot_tree
    || business.target_repo_root !== task.manifest.target_repo_root) {
    throw recoveryError("RECOVERY_BUSINESS_SNAPSHOT_MISMATCH", "accepted business snapshot does not match the task");
  }
}

function runnerReplacement(values) {
  const task = openTask(values["task-path"], values.project, values.task);
  if (task.manifest.execution_mode === "per_invocation") {
    throw recoveryError("RECOVERY_RUNNER_REPLACEMENT_FORBIDDEN", "per-invocation tasks do not have a replaceable persistent runner");
  }
  const kernel = createTaskKernel(task);
  const credential = readRecoveryCredential(task, values["credential-ref"], values["credential-hash"], "runner-replacement");
  const lineage = readRunnerMigration(task);
  const previous = lineage.runner_identity;
  if (lineage.replacements?.history.some(({ value }) => value.credential_ref === credential.ref)) {
    throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "runner replacement credential was already consumed");
  }
  let next;
  try { next = inspectRunnerIdentity({ runnerRoot: values["runner-root"], projectName: task.identity.projectName, taskId: task.identity.taskId, stage: values.stage, requireClean: true }); }
  catch (error) { throw recoveryError("RECOVERY_RUNNER_IDENTITY_INVALID", error.message); }
  if (credential.value.runner_subject.stage !== values.stage || !deepEqual(credential.value.runner_subject.previous_runner, previous) || !deepEqual(credential.value.runner_subject.new_runner, next)) throw recoveryError("RECOVERY_RUNNER_PROVENANCE_MISMATCH", "credential runner subject does not match Git identity");
  const manifestRaw = task.readRecord("task.json");
  const manifestHash = sha256(manifestRaw);
  if (credential.value.runner_subject.previous_manifest_hash !== manifestHash) throw recoveryError("RECOVERY_MANIFEST_HASH_MISMATCH", "credential previous_manifest_hash does not match task.json");
  assertAncestor(previous.runner_oid, next.runner_root);
  assertBusinessSnapshot(task, credential, kernel);
  const generation = lineage.replacements?.next_generation ?? 1;
  const generationPath = generationRef("runner-replacement", generation);
  const archiveRaw = manifestRaw;
  const archivePath = `identity/recovery-archives/runner-manifest-${manifestHash}.json`;
  const nextManifestTemplate = { ...task.manifest, runner_root: next.runner_root, runner_oid: next.runner_oid, runner_replacement: { ref: generationPath, integrity_hash: "__GENERATION_HASH__" } };
  const afterManifestHash = normalizedRecoveryRecordHash("runner-replacement", nextManifestTemplate);
  const generationValue = {
    schema_version: "workflowhub-recovery-generation.v1", project_name: task.identity.projectName, task_id: task.identity.taskId,
    recovery_kind: "runner-replacement", generation, credential_ref: credential.ref, credential_hash: credential.hash,
    ...(lineage.replacements ? {
      previous_generation_ref: lineage.replacements.ref,
      previous_generation_hash: lineage.replacements.hash,
    } : {}),
    before: { ref: "task.json", hash: manifestHash, identity: previous }, after: { ref: "task.json", hash: afterManifestHash, identity: next },
    created_at: new Date().toISOString(), result: "accepted",
  };
  const generationRaw = canonical(generationValue);
  const generationHash = sha256(generationRaw);
  const nextManifest = { ...task.manifest, runner_root: next.runner_root, runner_oid: next.runner_oid, runner_replacement: { ref: generationPath, integrity_hash: generationHash } };
  const nextManifestRaw = canonical(nextManifest);
  const result = task.withRecordLock(RECOVERY_OPERATIONS["runner-replacement"].lock_ref, () => {
    const fresh = readRecoveryGeneration(task, "runner-replacement");
    if ((fresh?.ref ?? null) !== (lineage.replacements?.ref ?? null)
        || (fresh?.hash ?? null) !== (lineage.replacements?.hash ?? null)
        || (fresh?.next_generation ?? 1) !== generation) {
      throw recoveryError("RECOVERY_CONCURRENT_CHANGE", "runner replacement generation changed before append");
    }
    if (sha256(task.readRecord("task.json")) !== manifestHash) throw recoveryError("RECOVERY_CONCURRENT_CHANGE", "task manifest changed before replacement");
    try {
      task.replaceRecoveryManifest({ previousManifestRaw: manifestRaw, manifestRaw: nextManifestRaw, archiveRef: archivePath, archiveRaw, generationRef: generationPath, generationRaw });
    } catch (error) { if (error.code?.startsWith("RECOVERY_")) throw error; throw recoveryError(error.message?.includes("changed") ? "RECOVERY_CONCURRENT_CHANGE" : "RECOVERY_RECORD_CONFLICT", error.message); }
    return Object.freeze({ recovery_ref: generationPath, recovery_hash: generationHash, previous_runner: previous, new_runner: next });
  });
  return { recovery_ref: result.recovery_ref, recovery_hash: result.recovery_hash, next_entry: "task-bootstrap" };
}

function readJson(task, ref, expectedHash, label, pattern = null) {
  if (typeof ref !== "string" || ref.includes("..") || ref.startsWith("/") || ref.includes("\\") || (pattern && !pattern.test(ref))) {
    throw recoveryError("RECOVERY_PHASE_EVIDENCE_MISMATCH", `${label} reference is outside the allowed namespace`);
  }
  let raw;
  try { raw = task.readRecord(ref); } catch { throw recoveryError("RECOVERY_PHASE_EVIDENCE_MISMATCH", `${label} is missing`); }
  if (expectedHash && sha256(raw) !== expectedHash) throw recoveryError("RECOVERY_PHASE_EVIDENCE_MISMATCH", `${label} hash mismatch`);
  try { return { raw, hash: sha256(raw), value: JSON.parse(raw), ref }; } catch { throw recoveryError("RECOVERY_PHASE_EVIDENCE_MISMATCH", `${label} is invalid JSON`); }
}

function snapshotFromEvidence(task, evidence) {
  if (OID.test(evidence.value.snapshot_tree ?? "")) return evidence.value.snapshot_tree;
  const diffRef = evidence.value.diff_scan?.path ?? evidence.value.evidence?.diff;
  if (!diffRef) throw recoveryError("RECOVERY_PHASE_EVIDENCE_MISMATCH", "baseline Phase 0 evidence has no snapshot");
  const diff = readJson(task, diffRef, undefined, "Phase 0 diff scan", /^evidence\/phases\/phase-0\/.+\.json$/);
  if (!OID.test(diff.value.snapshot_tree ?? "")) throw recoveryError("RECOVERY_PHASE_EVIDENCE_MISMATCH", "Phase 0 diff scan has no snapshot");
  return diff.value.snapshot_tree;
}

const PHASE0_EVIDENCE_REF = /^evidence\/phases\/phase-0\/[a-f0-9]{40,64}\/[A-Za-z0-9._-]+\.json$/;
const PHASE_REVIEW_RESULT_REF = /^reviews\/results\/[A-Za-z0-9._-]+\.json$/;
const PHASE_REVIEW_ATTEMPT_REF = /^reviews\/attempts\/[A-Za-z0-9-]+\/attempt\.json$/;
const RECEIPT_REF = /^receipts\/[A-Za-z0-9._/-]+\.json$/;
const TEST_OUTPUT_REF = /^evidence\/[A-Za-z0-9._/-]+$/;
const PHASE_EVIDENCE_REF = /^evidence\/phases\/([A-Za-z0-9._-]+)\/([a-f0-9]{40,64})\/phase-evidence-([a-f0-9]{64})\.json$/;
const PHASE_DIFF_REF = /^evidence\/phases\/([A-Za-z0-9._-]+)\/([a-f0-9]{40,64})\/diff-scan-([a-f0-9]{64})\.json$/;
const LINEAGE_REF = /^identity\/phase-trace-lineage\/([A-Za-z0-9._-]+)-([a-f0-9]{40,64})-([a-f0-9]{64})\.json$/;
const LINEAGE_SUPERSESSION_REF = /^identity\/phase-trace-lineage-supersessions\/([A-Za-z0-9._-]+)-([a-f0-9]{40,64})-([a-f0-9]{64})\.json$/;

function validateLineageInput(values) {
  for (const key of ["task-path", "project", "task", "runner-root", "stage", "phase-id", "phase-evidence-ref", "phase-evidence-hash", "review-result-ref", "review-result-hash"]) {
    if (typeof values[key] !== "string" || values[key].trim() === "") {
      throw recoveryError("RECOVERY_INPUT_REQUIRED", `--${key} is required`);
    }
  }
  if (values.stage !== "build-code") throw recoveryError("RECOVERY_INPUT_REQUIRED", "phase-trace-lineage requires --stage=build-code");
  if (!/^[A-Za-z0-9._-]+$/.test(values["phase-id"])) throw recoveryError("RECOVERY_INPUT_REQUIRED", "--phase-id is invalid");
  if (!HASH.test(values["phase-evidence-hash"]) || !HASH.test(values["review-result-hash"])) {
    throw recoveryError("RECOVERY_INPUT_REQUIRED", "lineage hashes must be sha256 values");
  }
  riskAcceptanceBindingsFromValues(values);
  return values;
}

function riskAcceptanceBindingsFromValues(values) {
  const hasRiskRefs = values["risk-acceptance-refs"] !== undefined;
  const hasRiskHashes = values["risk-acceptance-hashes"] !== undefined;
  if (hasRiskRefs !== hasRiskHashes) {
    throw recoveryError("RECOVERY_INPUT_REQUIRED", "risk acceptance refs and hashes must be supplied together");
  }
  if (!hasRiskRefs) return [];
  const refs = values["risk-acceptance-refs"].split(",");
  const hashes = values["risk-acceptance-hashes"].split(",");
  if (refs.length === 0 || refs.length !== hashes.length
    || refs.some((ref) => !RISK_ACCEPTANCE_REF.test(ref))
    || hashes.some((hash) => !HASH.test(hash))) {
    throw recoveryError("RECOVERY_INPUT_REQUIRED", "risk acceptance refs/hashes are invalid");
  }
  return refs.map((ref, index) => ({ ref, sha256: hashes[index] }));
}

function phaseEvidenceError(detail) {
  return recoveryError("RECOVERY_PHASE_EVIDENCE_MISMATCH", detail);
}

function readPhaseReceipt(task, receipt, label, { component, green = null }) {
  if (!receipt || typeof receipt !== "object" || typeof receipt.ref !== "string" || typeof receipt.hash !== "string") {
    throw phaseEvidenceError(`${label} reference is incomplete`);
  }
  const record = readJson(task, receipt.ref, receipt.hash, label, RECEIPT_REF);
  const value = record.value;
  if (value.schema_version !== "workflowhub-receipt.v1" || value.task_id !== task.identity.taskId
    || value.stage !== "build-code" || value.producer?.stage !== "build-code"
    || value.producer?.component !== component || !OID.test(value.snapshot_tree ?? "")
    || !OID.test(value.snapshot_commit ?? "")) throw phaseEvidenceError(`${label} provenance is invalid`);
  if (green !== null && (!Number.isInteger(value.exit_code) || (green ? value.exit_code !== 0 : value.exit_code === 0))) {
    throw phaseEvidenceError(`${label} exit status is invalid`);
  }
  if (green !== null) {
    if (!TEST_OUTPUT_REF.test(value.output_ref ?? "")) throw phaseEvidenceError(`${label} output reference is outside the allowed namespace`);
    let outputRaw;
    try { outputRaw = task.readRecord(value.output_ref); } catch { throw phaseEvidenceError(`${label} output is missing`); }
    if (!HASH.test(value.output_hash ?? "") || sha256(outputRaw) !== value.output_hash) throw phaseEvidenceError(`${label} output hash mismatch`);
  }
  return record;
}

function assertBaselinePhaseClosure(task, baseline, baselineSnapshot, subject) {
  if (baseline.value.phase_id !== "phase-0" || !["awaiting_review", "done"].includes(baseline.value.status)) {
    throw phaseEvidenceError("baseline evidence is not a closed Phase 0 record");
  }
  const diffRef = baseline.value.diff_scan?.path ?? baseline.value.evidence?.diff;
  if (!PHASE0_EVIDENCE_REF.test(diffRef ?? "")) throw phaseEvidenceError("baseline Phase 0 diff reference is outside the allowed namespace");
  const diff = readJson(task, diffRef, undefined, "baseline Phase 0 diff scan", PHASE0_EVIDENCE_REF);
  if (diff.value.phase_id !== "phase-0" || diff.value.snapshot_tree !== baselineSnapshot || !Array.isArray(diff.value.changed_files) || !Array.isArray(diff.value.allowed_files)) {
    throw phaseEvidenceError("baseline Phase 0 diff scan is incomplete");
  }
  if (JSON.stringify(normalizeRuntimeOnlyPaths(diff.value.allowed_files)) !== JSON.stringify(normalizeRuntimeOnlyPaths(subject.allowed_files))) {
    throw phaseEvidenceError("baseline Phase 0 allowed-file contract does not match the credential");
  }
  const greenRef = baseline.value.tests?.green?.path ?? baseline.value.evidence?.green_test_receipt_ref;
  const implementationRef = baseline.value.evidence?.implementation_receipt_ref;
  if (implementationRef !== subject.implementation_receipt.ref || greenRef !== subject.green_test_receipt.ref) {
    throw phaseEvidenceError("baseline Phase 0 evidence does not close over the credentialed receipts");
  }
  readPhaseReceipt(task, subject.implementation_receipt, "baseline Phase 0 implementation receipt", { component: "implementation" });
  readPhaseReceipt(task, subject.green_test_receipt, "baseline Phase 0 GREEN test receipt", { component: "build-code-test-capture", green: true });
  if (subject.red_test_receipt) {
    const redRef = baseline.value.tests?.red?.path ?? baseline.value.evidence?.red_evidence_ref;
    if (redRef !== subject.red_test_receipt.ref) throw phaseEvidenceError("baseline Phase 0 RED receipt is not closed by the evidence");
    readPhaseReceipt(task, subject.red_test_receipt, "baseline Phase 0 RED test receipt", { component: "build-code-test-capture", green: false });
  }
}

function assertBaselineReviewClosure(task, subject, baselineSnapshot, review, riskAcceptances = []) {
  const value = review.value;
  let baselineTree;
  try { baselineTree = execFileSync("git", ["rev-parse", `${subject.baseline_commit}^{tree}`], { cwd: task.manifest.target_repo_root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
  catch { throw phaseEvidenceError("baseline commit tree cannot be verified"); }

  const matchingScope = value.task_id === task.identity.taskId && value.stage === "build-code"
    && value.subject_kind === "phase" && value.phase_id === "phase-0"
    && value.review_scope === "phase" && value.snapshot_tree === baselineSnapshot
    && value.base_tree === baselineTree && value.candidate_tree === baselineSnapshot;
  if (!matchingScope) {
    throw phaseEvidenceError("baseline Phase 0 review quality fact does not match the credentialed Phase");
  }

  if (PHASE_REVIEW_ATTEMPT_REF.test(review.ref)) {
    try { validateSchema("attempt", value); } catch (error) { throw phaseEvidenceError(`baseline Phase 0 review attempt schema is invalid: ${error.message}`); }
    if (value.terminal_status !== "unavailable" || !value.error
      || !Array.isArray(value.provider_attempts) || value.provider_attempts.length === 0) {
      throw phaseEvidenceError("baseline Phase 0 review attempt is not an authenticated unavailable quality fact");
    }
    if (riskAcceptances.length) throw phaseEvidenceError("unavailable Phase review cannot use risk acceptance");
    return { status: "unavailable", action_ref: review.ref, action_hash: review.hash };
  }

  try { validateSchema("result", value); } catch (error) { throw phaseEvidenceError(`baseline Phase 0 review schema is invalid: ${error.message}`); }
  if (!["pass", "revise_required"].includes(value.verdict)) {
    throw phaseEvidenceError("baseline Phase 0 review is not a semantic quality fact");
  }
  if (!PHASE_REVIEW_ATTEMPT_REF.test(value.attempt_ref ?? "")) throw phaseEvidenceError("baseline Phase 0 review attempt is outside the allowed namespace");
  const attempt = readJson(task, value.attempt_ref, undefined, "baseline Phase 0 review attempt", PHASE_REVIEW_ATTEMPT_REF);
  try { validateSchema("attempt", attempt.value); } catch (error) { throw phaseEvidenceError(`baseline Phase 0 review attempt schema is invalid: ${error.message}`); }
  if (attempt.value.terminal_status !== "semantic" || attempt.value.error !== null) {
    throw phaseEvidenceError("baseline Phase 0 review result does not bind a semantic attempt");
  }
  for (const key of ["task_id", "stage", "subject_kind", "phase_id", "review_scope", "base_tree", "candidate_tree", "snapshot_tree", "material_id"]) {
    if (attempt.value[key] !== value[key]) throw phaseEvidenceError(`baseline Phase 0 review attempt/result ${key} mismatch`);
  }
  const accepted = reviewRiskBindingsForAction(task, {
    reviewRef: review.ref,
    reviewHash: review.hash,
    result: value,
  }, riskAcceptances);
  return { status: "semantic", verdict: value.verdict, action_ref: review.ref, action_hash: review.hash, risk_acceptances: accepted };
}

function assertRefHashSuffix(record, match, label) {
  if (!match || record.hash !== match[3]) throw phaseEvidenceError(`${label} canonical reference hash mismatch`);
}

function readLineageReceipt(task, ref, label, { component, green = null, expectedTree }) {
  const receipt = readJson(task, ref, undefined, label, RECEIPT_REF);
  const value = receipt.value;
  if (value?.schema_version !== "workflowhub-receipt.v1" || value.task_id !== task.identity.taskId
    || value.stage !== "build-code" || value.producer?.stage !== "build-code"
    || value.producer?.component !== component || value.snapshot_tree !== expectedTree
    || !OID.test(value.snapshot_head ?? "") || !OID.test(value.snapshot_commit ?? "")) {
    throw phaseEvidenceError(`${label} provenance is invalid`);
  }
  if (green !== null) {
    if (!Number.isInteger(value.exit_code) || (green ? value.exit_code !== 0 : value.exit_code === 0)
      || !TEST_OUTPUT_REF.test(value.output_ref ?? "") || !HASH.test(value.output_hash ?? "")) {
      throw phaseEvidenceError(`${label} test evidence is invalid`);
    }
    let output;
    try { output = task.readRecord(value.output_ref); } catch { throw phaseEvidenceError(`${label} output is missing`); }
    if (sha256(output) !== value.output_hash) throw phaseEvidenceError(`${label} output hash mismatch`);
  } else if (!TEST_OUTPUT_REF.test(value.diff_ref ?? "") || !HASH.test(value.diff_hash ?? "")) {
    throw phaseEvidenceError(`${label} diff binding is invalid`);
  } else {
    let diff;
    try { diff = task.readRecord(value.diff_ref); } catch { throw phaseEvidenceError(`${label} diff is missing`); }
    if (sha256(diff) !== value.diff_hash) throw phaseEvidenceError(`${label} diff hash mismatch`);
  }
  return receipt;
}

function phaseCommitRef(task, phaseId, snapshotTree) {
  return `refs/workflowhub/phases/${task.identity.projectName}/${task.identity.taskId}/build-code/${phaseId}/snapshot-${snapshotTree}`;
}

function verifyLineagePinnedCommit(task, phaseId, snapshotTree, implementationCommit) {
  const ref = phaseCommitRef(task, phaseId, snapshotTree);
  let pinnedCommit;
  let pinnedTree;
  try {
    pinnedCommit = execFileSync("git", ["rev-parse", `${ref}^{commit}`], { cwd: task.manifest.target_repo_root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    pinnedTree = execFileSync("git", ["rev-parse", `${ref}^{tree}`], { cwd: task.manifest.target_repo_root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch { throw phaseEvidenceError("Phase snapshot ref is unavailable"); }
  if (pinnedCommit !== implementationCommit || pinnedTree !== snapshotTree) {
    throw phaseEvidenceError("Phase snapshot ref does not match the evidence");
  }
  return ref;
}

function readLineageSources(task, values) {
  const phaseId = values["phase-id"];
  const evidence = readJson(task, values["phase-evidence-ref"], values["phase-evidence-hash"], "Phase evidence", PHASE_EVIDENCE_REF);
  const evidenceMatch = PHASE_EVIDENCE_REF.exec(evidence.ref);
  assertRefHashSuffix(evidence, evidenceMatch, "Phase evidence");
  if (evidenceMatch[1] !== phaseId || evidence.value.phase_id !== phaseId) throw phaseEvidenceError("Phase evidence phase does not match the request");
  const diffRef = evidence.value.diff_scan?.path ?? evidence.value.evidence?.diff;
  if (evidence.value.diff_scan?.path !== diffRef || evidence.value.evidence?.diff !== diffRef) {
    throw phaseEvidenceError("Phase evidence diff closure is incomplete");
  }
  const scan = readJson(task, diffRef, undefined, "Phase diff scan", PHASE_DIFF_REF);
  const scanMatch = PHASE_DIFF_REF.exec(scan.ref);
  assertRefHashSuffix(scan, scanMatch, "Phase diff scan");
  if (scanMatch[1] !== phaseId || scanMatch[2] !== evidenceMatch[2] || scan.value.phase_id !== phaseId
    || scan.value.snapshot_tree !== evidenceMatch[2]) throw phaseEvidenceError("Phase diff scan identity does not match the evidence");
  let subject;
  try { subject = validatePhaseReviewEvidence({ phaseResult: evidence.value, scan: scan.value, sourceRoot: task.manifest.target_repo_root, phaseId }); }
  catch (error) { throw phaseEvidenceError(error.message); }
  const implementationRef = evidence.value.evidence?.implementation_receipt_ref;
  const greenRef = evidence.value.evidence?.green_test_receipt_ref;
  const redRef = evidence.value.evidence?.red_evidence_ref ?? null;
  if (evidence.value.tests?.green?.path !== greenRef || (evidence.value.tests?.red?.path ?? null) !== redRef) {
    throw phaseEvidenceError("Phase evidence receipt closure is incomplete");
  }
  const implementation = readLineageReceipt(task, implementationRef, "implementation receipt", {
    component: "implementation", expectedTree: subject.candidateTree,
  });
  const green = readLineageReceipt(task, greenRef, "GREEN test receipt", {
    component: "build-code-test-capture", green: true, expectedTree: subject.candidateTree,
  });
  const red = redRef === null ? null : readLineageReceipt(task, redRef, "RED test receipt", {
    component: "build-code-test-capture", green: false, expectedTree: subject.baseTree,
  });
  const review = readJson(task, values["review-result-ref"], values["review-result-hash"], "formal Phase review", PHASE_REVIEW_RESULT_REF);
  try { validateSchema("result", review.value); } catch (error) { throw phaseEvidenceError(`formal Phase review schema is invalid: ${error.message}`); }
  if (!["pass", "revise_required"].includes(review.value.verdict)
    || !PHASE_REVIEW_ATTEMPT_REF.test(review.value.attempt_ref ?? "")) {
    throw phaseEvidenceError("formal Phase review is not a semantic Phase result");
  }
  const attempt = readJson(task, review.value.attempt_ref, undefined, "formal Phase review attempt", PHASE_REVIEW_ATTEMPT_REF);
  try { validateSchema("attempt", attempt.value); } catch (error) { throw phaseEvidenceError(`formal Phase review attempt schema is invalid: ${error.message}`); }
  const expected = {
    task_id: task.identity.taskId, stage: "build-code", subject_kind: "phase", phase_id: phaseId,
    review_scope: "phase", base_tree: subject.baseTree, candidate_tree: subject.candidateTree,
    snapshot_tree: subject.candidateTree, material_id: review.value.material_id,
  };
  for (const [key, value] of Object.entries(expected)) {
    if (review.value[key] !== value || attempt.value[key] !== value) throw phaseEvidenceError(`formal Phase review ${key} does not match the evidence`);
  }
  if (review.value.attempt_ref !== attempt.ref || !HASH.test(review.value.material_id ?? "")) {
    throw phaseEvidenceError("formal Phase review linkage is invalid");
  }
  let acceptanceTrace;
  try {
    acceptanceTrace = validatePhaseAcceptanceTrace({
      trace: attempt.value.phase_ac_trace, phaseId, baseTree: subject.baseTree, snapshotTree: subject.candidateTree,
      changedFiles: scan.value.changed_files, greenTestReceipt: { ref: green.ref, sha256: green.hash }, required: true,
    });
  } catch (error) { throw phaseEvidenceError(error.message); }
  const implementationCommitRef = verifyLineagePinnedCommit(task, phaseId, subject.candidateTree, scan.value.implementation_commit);
  return { phaseId, evidence, scan, implementation, green, red, review, attempt, subject, acceptanceTrace, implementationCommitRef };
}

function phaseTraceFromSources(sources) {
  return {
    schema_version: "phase-map-trace.v1", phase_id: sources.phaseId,
    baseline_commit: sources.scan.value.baseline_commit, implementation_commit: sources.scan.value.implementation_commit,
    implementation_commit_ref: sources.implementationCommitRef, base_tree: sources.subject.baseTree,
    snapshot_tree: sources.subject.candidateTree, allowed_files: [...sources.scan.value.allowed_files],
    changed_files: [...sources.scan.value.changed_files],
    canonical_phase_evidence: { ref: sources.evidence.ref, sha256: sources.evidence.hash },
    diff_scan: { ref: sources.scan.ref, sha256: sources.scan.hash },
    implementation_receipt: { ref: sources.implementation.ref, sha256: sources.implementation.hash },
    green_test_receipt: { ref: sources.green.ref, sha256: sources.green.hash },
    red_test_receipt: sources.red === null ? null : { ref: sources.red.ref, sha256: sources.red.hash },
    review_result: { ref: sources.review.ref, sha256: sources.review.hash },
    review_attempt: { ref: sources.attempt.ref, sha256: sources.attempt.hash },
    material_id: sources.review.value.material_id, review_scope: "phase", verdict: sources.review.value.verdict,
    acceptance_trace: sources.acceptanceTrace,
  };
}

function lineageGenerationRef(phaseId, snapshotTree, traceHash) {
  const ref = `identity/phase-trace-lineage/${phaseId}-${snapshotTree}-${traceHash}.json`;
  if (!LINEAGE_REF.test(ref)) throw recoveryError("RECOVERY_RECORD_CONFLICT", "lineage generation ref is invalid");
  return ref;
}

function lineageSupersessionRef(phaseId, snapshotTree, lineageHash) {
  const ref = `identity/phase-trace-lineage-supersessions/${phaseId}-${snapshotTree}-${lineageHash}.json`;
  if (!LINEAGE_SUPERSESSION_REF.test(ref)) throw recoveryError("RECOVERY_RECORD_CONFLICT", "lineage supersession ref is invalid");
  return ref;
}

function lineageGeneration(task, sources, traceRef, traceHash, riskAcceptances = []) {
  const value = {
    schema_version: "phase-trace-lineage-generation.v1", project_name: task.identity.projectName, task_id: task.identity.taskId,
    stage: "build-code", phase_id: sources.phaseId, snapshot_tree: sources.subject.candidateTree,
    trace: { ref: traceRef, sha256: traceHash },
    phase_evidence: { ref: sources.evidence.ref, sha256: sources.evidence.sha256 },
    diff_scan: { ref: sources.scan.ref, sha256: sources.scan.sha256 },
    implementation_receipt: { ref: sources.implementation.ref, sha256: sources.implementation.sha256 },
    green_test_receipt: { ref: sources.green.ref, sha256: sources.green.sha256 },
    red_test_receipt: sources.red === null ? null : { ref: sources.red.ref, sha256: sources.red.sha256 },
    review_result: { ref: sources.review.ref, sha256: sources.review.sha256 },
    review_attempt: { ref: sources.attempt.ref, sha256: sources.attempt.sha256 },
    risk_acceptances: riskAcceptances,
    material_id: sources.review.value.material_id, created_at: new Date().toISOString(), result: "bound",
  };
  const allowed = new Set(["schema_version", "project_name", "task_id", "stage", "phase_id", "snapshot_tree", "trace", "phase_evidence", "diff_scan", "implementation_receipt", "green_test_receipt", "red_test_receipt", "review_result", "review_attempt", "risk_acceptances", "material_id", "created_at", "result"]);
  if (Object.keys(value).some((key) => !allowed.has(key)) || value.schema_version !== "phase-trace-lineage-generation.v1"
    || !OID.test(value.snapshot_tree) || !HASH.test(value.material_id) || !Array.isArray(value.risk_acceptances)
    || !Number.isFinite(Date.parse(value.created_at)) || value.result !== "bound") {
    throw recoveryError("RECOVERY_RECORD_CONFLICT", "lineage generation schema is invalid");
  }
  return value;
}

function lineageGenerationFromTrace(task, verified, riskAcceptances = []) {
  const { trace } = verified;
  return lineageGeneration(task, {
    phaseId: trace.phase_id,
    subject: { candidateTree: trace.snapshot_tree },
    evidence: verified.phaseEvidence,
    scan: verified.scan,
    implementation: verified.implementation,
    green: verified.green,
    red: verified.red,
    review: verified.review,
    attempt: verified.attempt,
  }, verified.traceRef, verified.traceSha256, riskAcceptances);
}

function reviewRiskBindingsForAction(task, { reviewRef, reviewHash, result }, supplied = []) {
  if (!Array.isArray(supplied)) throw new TypeError("risk_acceptances must be an array");
  if (!["pass", "revise_required"].includes(result?.verdict)) {
    throw phaseEvidenceError("Phase review action is not an exact semantic quality fact");
  }
  const records = supplied.map((binding) => {
    if (!binding || typeof binding !== "object" || Array.isArray(binding)
      || Object.keys(binding).some((key) => key !== "ref" && key !== "sha256")
      || typeof binding.ref !== "string" || !HASH.test(binding.sha256 ?? "")) {
      throw phaseEvidenceError("risk acceptance binding is invalid");
    }
    const match = RISK_ACCEPTANCE_REF.exec(binding.ref);
    if (!match || match[1] !== binding.sha256) throw phaseEvidenceError("risk acceptance ref/hash is not content-addressed");
    const record = readJson(task, binding.ref, binding.sha256, "risk acceptance", RISK_ACCEPTANCE_REF);
    return { binding: { ref: record.ref, sha256: record.hash }, value: record.value };
  });
  const preliminary = deriveSeriousReviewPause({
    taskId: task.identity.taskId,
    stage: "build-code",
    reviewRef,
    reviewHash,
    result,
  });
  if (preliminary.status !== "paused") {
    if (records.length) throw phaseEvidenceError("risk acceptance cannot override a review without actionable serious findings");
    return [];
  }
  if (records.length === 0) {
    throw phaseEvidenceError("actionable serious findings require repair or exact risk acceptance");
  }
  const workflowRunIds = new Set(records.map(({ value }) => value?.workflow_run_id));
  if (workflowRunIds.size !== 1 || typeof [...workflowRunIds][0] !== "string" || [...workflowRunIds][0].trim() === "") {
    throw phaseEvidenceError("risk acceptances do not bind one authenticated review run");
  }
  const pause = deriveSeriousReviewPause({
    taskId: task.identity.taskId,
    stage: "build-code",
    reviewRef,
    reviewHash,
    result,
    workflowRunId: [...workflowRunIds][0],
  });
  try { validateRiskAcceptanceSet({ acceptances: records.map(({ value }) => value), pause }); }
  catch (error) { throw phaseEvidenceError(error.message); }
  for (const { value } of records) {
    const finding = pause.findings.find(({ finding_id: findingId }) => findingId === value.finding_id);
    let cardRaw; let replyRaw;
    try {
      cardRaw = task.readRecord(value.card_ref);
      replyRaw = task.readRecord(value.reply_ref);
    } catch {
      throw phaseEvidenceError("risk acceptance card or reply is missing");
    }
    if (cardRaw !== `${JSON.stringify(finding, null, 2)}\n` || sha256(replyRaw) !== value.reply_hash) {
      throw phaseEvidenceError("risk acceptance does not bind canonical card and reply bytes");
    }
  }
  return records.map(({ binding }) => binding);
}

function reviewRiskBindings(task, verified, supplied = []) {
  if (verified.trace.verdict !== verified.review.value.verdict) {
    throw phaseEvidenceError("canonical Phase trace does not bind an exact semantic review fact");
  }
  return reviewRiskBindingsForAction(task, {
    reviewRef: verified.review.ref,
    reviewHash: verified.review.sha256 ?? verified.review.hash,
    result: verified.review.value,
  }, supplied);
}

function recordExists(task, ref) {
  try { task.readRecord(ref); return true; } catch (error) { if (error?.code === "ENOENT") return false; throw error; }
}

function gitIdentity(root, label) {
  if (typeof root !== "string" || !isAbsolute(root)) throw recoveryError("RECOVERY_CREDENTIAL_INVALID", `${label} root must be absolute`);
  let real; let top; let common; let branch; let head; let tree; let status;
  try {
    real = realpathSync(resolve(root));
    top = realpathSync(execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: real, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim());
    const rawCommon = execFileSync("git", ["rev-parse", "--git-common-dir"], { cwd: real, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    common = realpathSync(isAbsolute(rawCommon) ? rawCommon : resolve(real, rawCommon));
    branch = execFileSync("git", ["symbolic-ref", "--quiet", "--short", "HEAD"], { cwd: real, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: real, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    tree = execFileSync("git", ["rev-parse", "HEAD^{tree}"], { cwd: real, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    status = execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: real, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    throw recoveryError("RECOVERY_CREDENTIAL_INVALID", `${label} Git identity cannot be authenticated: ${error.stderr?.toString().trim() || error.message}`);
  }
  if (top !== real) throw recoveryError("RECOVERY_CREDENTIAL_INVALID", `${label} must be a Git toplevel`);
  return Object.freeze({
    identity: Object.freeze({
      worktree_root: real,
      git_common_dir: common,
      branch,
      head,
      snapshot_tree: tree,
    }),
    status,
  });
}

function readBoundRecord(task, binding, label) {
  let raw;
  try { raw = task.readRecord(binding.ref); }
  catch { throw recoveryError("RECOVERY_AUTHORIZATION_INVALID", `${label} is missing`); }
  if (sha256(raw) !== binding.hash) throw recoveryError("RECOVERY_AUTHORIZATION_INVALID", `${label} hash mismatch`);
  return raw;
}

function retainedArtifactBindings(values) {
  const refs = values["retained-artifact-refs"].split(",");
  const hashes = values["retained-artifact-hashes"].split(",");
  return refs.map((ref, index) => Object.freeze({ ref, hash: hashes[index] }));
}

function readAcceptedWorkspaceFacts(task) {
  const raw = task.readRecord("results/make-decision/accepted.json");
  let facts;
  try {
    facts = createTaskKernel(task).readAccepted("make-decision").facts;
  } catch {
    try { facts = JSON.parse(raw).facts; }
    catch { throw recoveryError("RECOVERY_BUSINESS_SNAPSHOT_MISMATCH", "accepted make-decision is invalid"); }
  }
  if (!facts || typeof facts !== "object" || typeof facts.worktree_root !== "string"
      || !OID.test(facts.baseline_commit ?? "") || !OID.test(facts.snapshot_tree ?? "")) {
    throw recoveryError("RECOVERY_BUSINESS_SNAPSHOT_MISMATCH", "accepted make-decision workspace facts are incomplete");
  }
  return Object.freeze({ raw, facts });
}

function dirtyCleanupBusinessSnapshot(task, accepted) {
  return Object.freeze({
    accepted_ref: "results/make-decision/accepted.json",
    accepted_hash: sha256(accepted.raw),
    baseline_commit: accepted.facts.baseline_commit,
    snapshot_tree: accepted.facts.snapshot_tree,
    target_repo_root: task.manifest.target_repo_root,
  });
}

function assertAncestorCommit(root, ancestor, descendant, label) {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
      cwd: root,
      stdio: "ignore",
    });
  } catch (error) {
    if (error?.status === 1) throw recoveryError("RECOVERY_CREDENTIAL_INVALID", `${label} is not descended from the accepted baseline`);
    throw recoveryError("RECOVERY_CREDENTIAL_INVALID", `${label} ancestry cannot be authenticated`);
  }
}

function authenticateDirtyAuthorization(task, credential) {
  const subject = credential.value.workspace_subject;
  const authorizationRaw = readBoundRecord(task, subject.authorization, "dirty cleanup authorization");
  const authorizationMatch = DIRTY_CLEANUP_AUTHORIZATION_REF.exec(subject.authorization.ref);
  if (!authorizationMatch || authorizationMatch[1] !== subject.authorization.hash) {
    throw recoveryError("RECOVERY_AUTHORIZATION_INVALID", "dirty cleanup authorization must be content-addressed");
  }
  let authorization;
  try { authorization = JSON.parse(authorizationRaw); }
  catch { throw recoveryError("RECOVERY_AUTHORIZATION_INVALID", "dirty cleanup authorization is invalid JSON"); }
  const required = [
    "schema_version", "project_name", "task_id", "purpose", "recovery_kind", "decision",
    "credential_nonce", "single_use", "accepted_business_snapshot", "credential_subject_hash",
    "previous_workspace", "clean_workspace", "retained_artifact_refs", "next_stage", "authorized_at",
  ];
  if (!authorization || typeof authorization !== "object" || Array.isArray(authorization)
      || !deepEqual(Object.keys(authorization).sort(), [...required].sort())
      || authorization.schema_version !== "workflowhub-dirty-cleanup-rebind-authorization.v1"
      || authorization.project_name !== task.identity.projectName
      || authorization.task_id !== task.identity.taskId
      || authorization.purpose !== "dirty-cleanup-rebind"
      || authorization.recovery_kind !== "dirty-cleanup-rebind"
      || authorization.decision !== "accepted"
      || authorization.credential_nonce !== credential.value.nonce
      || authorization.single_use !== true
      || authorization.next_stage !== "task-close"
      || !Number.isFinite(Date.parse(authorization.authorized_at ?? ""))) {
    throw recoveryError("RECOVERY_AUTHORIZATION_INVALID", "dirty cleanup rebind requires explicit accepted human authorization");
  }
  const expectedBusiness = {
    ref: credential.value.accepted_business_snapshot.accepted_ref,
    hash: credential.value.accepted_business_snapshot.accepted_hash,
  };
  if (!deepEqual(authorization.accepted_business_snapshot, expectedBusiness)
      || authorization.credential_subject_hash !== dirtyCleanupAuthorizationSubjectHash(subject)
      || !deepEqual(authorization.previous_workspace, subject.previous_workspace)
      || !deepEqual(authorization.clean_workspace, subject.clean_workspace)
      || !deepEqual(authorization.retained_artifact_refs, subject.retained_artifact_refs)) {
    throw recoveryError("RECOVERY_AUTHORIZATION_INVALID", "dirty cleanup authorization subject binding is stale");
  }
  return authorization;
}

function authenticateDirtyWorkspaceSubject(task, credential) {
  const subject = credential.value.workspace_subject;
  authenticateDirtyAuthorization(task, credential);
  for (const binding of subject.retained_artifact_refs) readBoundRecord(task, binding, `retained artifact ${binding.ref}`);
  const before = gitIdentity(subject.previous_workspace.worktree_root, "previous workspace");
  const after = gitIdentity(subject.clean_workspace.worktree_root, "clean workspace");
  const target = gitIdentity(task.manifest.target_repo_root, "target repository");
  if (!deepEqual(before.identity, subject.previous_workspace)) {
    throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "previous workspace Git identity does not match the credential");
  }
  if (!deepEqual(after.identity, subject.clean_workspace)) {
    throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "clean workspace Git identity does not match the credential");
  }
  const expectedBranch = `task/${task.identity.projectName}/${task.identity.taskId}`;
  if (before.identity.git_common_dir !== target.identity.git_common_dir
      || after.identity.git_common_dir !== target.identity.git_common_dir
      || before.identity.branch !== expectedBranch || after.identity.branch !== expectedBranch) {
    throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "clean workspace common-dir, branch, or tree does not match the credential");
  }
  if (after.status !== "") throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "clean workspace postcondition is not clean");
  return Object.freeze({
    before: before.identity,
    after: after.identity,
  });
}

function deriveDirtyCleanupCredential(task, values) {
  const accepted = readAcceptedWorkspaceFacts(task);
  const latest = readAuthenticatedDirtyCleanupBinding(task);
  const previous = gitIdentity(values["previous-workspace-root"], "previous workspace");
  const clean = gitIdentity(values["clean-workspace-root"], "clean workspace");
  const target = gitIdentity(task.manifest.target_repo_root, "target repository");
  const expectedBranch = `task/${task.identity.projectName}/${task.identity.taskId}`;
  const expectedPrevious = latest?.workspace;
  if (resolve(previous.identity.worktree_root) !== resolve(expectedPrevious?.worktree_root ?? accepted.facts.worktree_root)) {
    throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "previous workspace does not match the accepted or effective binding");
  }
  if (expectedPrevious && !deepEqual(previous.identity, expectedPrevious)) {
    throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "previous workspace does not match the effective recovery binding");
  }
  if (previous.identity.git_common_dir !== target.identity.git_common_dir
      || clean.identity.git_common_dir !== target.identity.git_common_dir
      || previous.identity.branch !== expectedBranch || clean.identity.branch !== expectedBranch) {
    throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "dirty cleanup workspaces do not match the task Git identity");
  }
  assertAncestorCommit(target.identity.worktree_root, accepted.facts.baseline_commit, previous.identity.head, "previous workspace HEAD");
  if (clean.status !== "") throw recoveryError("RECOVERY_CREDENTIAL_INVALID", "clean workspace postcondition is not clean");
  const retained = retainedArtifactBindings(values);
  for (const binding of retained) readBoundRecord(task, binding, `retained artifact ${binding.ref}`);
  const subject = {
    previous_workspace: previous.identity,
    clean_workspace: clean.identity,
    authorization: { ref: values["authorization-ref"], hash: values["authorization-hash"] },
    retained_artifact_refs: retained,
    next_stage: "task-close",
  };
  let authorization;
  try { authorization = JSON.parse(readBoundRecord(task, subject.authorization, "dirty cleanup authorization")); }
  catch (error) {
    if (error?.recovery_code === "RECOVERY_AUTHORIZATION_INVALID") throw error;
    throw recoveryError("RECOVERY_AUTHORIZATION_INVALID", "dirty cleanup authorization is invalid JSON");
  }
  if (!Number.isFinite(Date.parse(authorization?.authorized_at ?? ""))) {
    throw recoveryError("RECOVERY_AUTHORIZATION_INVALID", "dirty cleanup authorization time is invalid");
  }
  const credential = {
    schema_version: "workflowhub-recovery-credential.v1",
    project_name: task.identity.projectName,
    task_id: task.identity.taskId,
    recovery_kind: "dirty-cleanup-rebind",
    nonce: values.nonce,
    issued_at: authorization.authorized_at,
    decision: "accepted",
    accepted_business_snapshot: dirtyCleanupBusinessSnapshot(task, accepted),
    workspace_subject: subject,
  };
  validateRecoveryCredential(credential);
  authenticateDirtyAuthorization(task, { value: credential });
  return Object.freeze({ accepted, credential, raw: canonical(credential) });
}

export function dirtyCleanupRebind(values, testHooks) {
  const task = openTask(values["task-path"], values.project, values.task);
  return task.withRecordLock(RECOVERY_OPERATIONS["dirty-cleanup-rebind"].lock_ref, () => {
    const derived = deriveDirtyCleanupCredential(task, values);
    const credentialPath = credentialRef("dirty-cleanup-rebind", values.nonce);
    const credentialExisted = recordExists(task, credentialPath);
    if (credentialExisted && task.readRecord(credentialPath) !== derived.raw) {
      throw recoveryError("RECOVERY_ALREADY_USED", "dirty cleanup credential nonce is already bound to different facts");
    }
    const credentialHash = sha256(derived.raw);
    const acceptedRaw = derived.accepted.raw;
    const latest = readRecoveryGeneration(task, "dirty-cleanup-rebind");
    if (latest?.value.credential_ref === credentialPath && latest.value.credential_hash === credentialHash) {
      const credential = readRecoveryCredential(task, credentialPath, credentialHash, "dirty-cleanup-rebind");
      authenticateDirtyWorkspaceSubject(task, credential);
      const authenticated = readAuthenticatedDirtyCleanupBinding(task);
      return Object.freeze({
        recovery_ref: authenticated.ref,
        recovery_hash: authenticated.hash,
        credential_ref: credential.ref,
        credential_hash: credential.hash,
        generation: authenticated.value.generation,
        next_entry: "normal task-close",
        replayed: true,
      });
    }
    if (latest && !deepEqual(derived.credential.workspace_subject.previous_workspace, latest.value.after.identity)) {
      throw recoveryError("RECOVERY_CONCURRENT_CHANGE", "dirty cleanup rebind does not continue the latest authenticated generation");
    }
    testHooks?.beforeGenerationCreate?.({
      task,
      credential: Object.freeze({ ref: credentialPath, hash: credentialHash, raw: derived.raw, value: derived.credential }),
      latest,
    });
    if (sha256(task.readRecord("results/make-decision/accepted.json")) !== sha256(acceptedRaw)) {
      throw recoveryError("RECOVERY_CONCURRENT_CHANGE", "accepted record changed before credential publication");
    }
    const refreshed = deriveDirtyCleanupCredential(task, values);
    if (refreshed.raw !== derived.raw) {
      throw recoveryError("RECOVERY_CONCURRENT_CHANGE", "authorization or workspace changed before credential publication");
    }
    if (!credentialExisted) {
      try { task.writeRecoveryCredential(credentialPath, derived.raw); }
      catch (error) { throw recoveryError("RECOVERY_RECORD_CONFLICT", error.message); }
    }
    const credential = readRecoveryCredential(task, credentialPath, credentialHash, "dirty-cleanup-rebind");
    authenticateDirtyWorkspaceSubject(task, credential);
    const generation = latest ? latest.next_generation : 1;
    const ref = generationRef("dirty-cleanup-rebind", generation);
    const value = {
      schema_version: "workflowhub-recovery-generation.v1",
      project_name: task.identity.projectName,
      task_id: task.identity.taskId,
      recovery_kind: "dirty-cleanup-rebind",
      generation,
      credential_ref: credential.ref,
      credential_hash: credential.hash,
      ...(latest ? { previous_generation_ref: latest.ref, previous_generation_hash: latest.hash } : {}),
      before: { ref: "results/make-decision/accepted.json", hash: sha256(acceptedRaw) },
      after: { ref: credential.ref, hash: credential.hash, identity: credential.value.workspace_subject.clean_workspace },
      created_at: new Date().toISOString(),
      result: "accepted",
    };
    const raw = canonical(value);
    try { task.writeRecoveryGeneration(ref, raw); }
    catch (error) { throw recoveryError("RECOVERY_RECORD_CONFLICT", error.message); }
    testHooks?.afterGenerationCreate?.({ task, ref, raw });
    const authenticated = readAuthenticatedDirtyCleanupBinding(task);
    authenticateDirtyWorkspaceSubject(task, authenticated.credential);
    return Object.freeze({
      recovery_ref: authenticated.ref,
      recovery_hash: authenticated.hash,
      credential_ref: credential.ref,
      credential_hash: credential.hash,
      generation: authenticated.value.generation,
      next_entry: "normal task-close",
      replayed: false,
    });
  });
}

/**
 * Bind one already-published canonical Phase trace to its historical semantic
 * review fact. Actionable serious findings require exact risk acceptances.
 * The caller supplies no record closure of its own: readPhaseMapTrace
 * independently verifies every bound receipt, evidence record, review, tree,
 * material, and task identity before this append-only generation is written.
 */
export function publishPhaseTraceLineage({ task, workspace } = {}, input = {}) {
  if (!task || typeof task !== "object" || !workspace || typeof workspace.worktreeRoot !== "string") {
    throw new TypeError("authenticated task and workspace are required");
  }
  if (!input || typeof input !== "object" || Array.isArray(input)
    || typeof input.trace_ref !== "string" || !HASH.test(input.trace_hash ?? "")
    || Object.keys(input).some((key) => !new Set(["trace_ref", "trace_hash", "risk_acceptances"]).has(key))) {
    throw new TypeError("Phase trace lineage input requires trace_ref, trace_hash, and optional risk_acceptances");
  }
  let verified;
  try {
    verified = readPhaseMapTrace({ task, sourceRoot: workspace.worktreeRoot, traceRef: input.trace_ref });
  } catch (error) {
    throw phaseEvidenceError(error.message);
  }
  if (verified.traceSha256 !== input.trace_hash) throw phaseEvidenceError("canonical Phase trace hash mismatch");
  const riskAcceptances = reviewRiskBindings(task, verified, input.risk_acceptances ?? []);
  const generationRef = lineageGenerationRef(verified.trace.phase_id, verified.trace.snapshot_tree, verified.traceSha256);
  const generationRaw = canonical(lineageGenerationFromTrace(task, verified, riskAcceptances));
  return task.withRecordLock("locks/phase-trace-lineage.lock", () => {
    for (const ref of task.listCanonicalPhaseTraceLineageRefs()) {
      const existing = readJson(task, ref, undefined, "Phase trace lineage", LINEAGE_REF).value;
      if (ref === generationRef || existing.trace?.ref === verified.traceRef
        || existing.review_result?.ref === verified.review.ref) {
        throw recoveryError("RECOVERY_ALREADY_USED", "this Phase trace or formal review is already bound");
      }
    }
    try { task.writePhaseTraceLineage(generationRef, generationRaw); }
    catch (error) { throw recoveryError("RECOVERY_RECORD_CONFLICT", error.message); }
    return Object.freeze({
      trace_ref: verified.traceRef,
      trace_hash: verified.traceSha256,
      lineage_ref: generationRef,
      lineage_hash: sha256(generationRaw),
      phase_id: verified.trace.phase_id,
      snapshot_tree: verified.trace.snapshot_tree,
      review_result_ref: verified.review.ref,
      material_id: verified.trace.material_id,
    });
  });
}

function refOnly(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== 1
    || typeof value.ref !== "string" || value.ref !== expected.ref) {
    throw phaseEvidenceError(`legacy Phase trace lineage ${label} is not the known missing-hash shape`);
  }
}

/**
 * Supersede only the one legacy producer defect: a canonical lineage whose
 * closure refs match a semantic trace but whose binding objects omitted sha256.
 * This creates a new immutable fact; it never changes the legacy record.
 */
export function supersedePhaseTraceLineage({ task, workspace } = {}, input = {}) {
  if (!task || typeof task !== "object" || !workspace || typeof workspace.worktreeRoot !== "string") {
    throw new TypeError("authenticated task and workspace are required");
  }
  if (!input || typeof input !== "object" || Array.isArray(input)
    || typeof input.lineage_ref !== "string" || !HASH.test(input.lineage_hash ?? "")
    || Object.keys(input).some((key) => !new Set(["lineage_ref", "lineage_hash", "risk_acceptances"]).has(key))) {
    throw new TypeError("Phase trace lineage supersession input requires lineage_ref, lineage_hash, and optional risk_acceptances");
  }
  const legacy = readJson(task, input.lineage_ref, input.lineage_hash, "legacy Phase trace lineage", LINEAGE_REF);
  const value = legacy.value;
  const keys = new Set(["schema_version", "project_name", "task_id", "stage", "phase_id", "snapshot_tree", "trace",
    "phase_evidence", "diff_scan", "implementation_receipt", "green_test_receipt", "red_test_receipt",
    "review_result", "review_attempt", "risk_acceptances", "material_id", "created_at", "result"]);
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some((key) => !keys.has(key))
    || value.schema_version !== "phase-trace-lineage-generation.v1" || value.project_name !== task.identity.projectName
    || value.task_id !== task.identity.taskId || value.stage !== "build-code" || !/^[A-Za-z0-9._-]+$/.test(value.phase_id ?? "")
    || !OID.test(value.snapshot_tree ?? "") || !HASH.test(value.material_id ?? "") || value.result !== "bound"
    || (value.risk_acceptances !== undefined && (!Array.isArray(value.risk_acceptances) || value.risk_acceptances.length !== 0))
    || !Number.isFinite(Date.parse(value.created_at ?? ""))) {
    throw phaseEvidenceError("legacy Phase trace lineage is not eligible for supersession");
  }
  let traceBinding;
  try { traceBinding = value.trace; } catch { throw phaseEvidenceError("legacy Phase trace lineage trace binding is invalid"); }
  if (!traceBinding || typeof traceBinding !== "object" || Object.keys(traceBinding).length !== 2
    || typeof traceBinding.ref !== "string" || !HASH.test(traceBinding.sha256 ?? "")) {
    throw phaseEvidenceError("legacy Phase trace lineage trace binding is invalid");
  }
  let verified;
  try { verified = readPhaseMapTrace({ task, sourceRoot: workspace.worktreeRoot, traceRef: traceBinding.ref }); }
  catch (error) { throw phaseEvidenceError(error.message); }
  if (verified.traceSha256 !== traceBinding.sha256 || verified.trace.phase_id !== value.phase_id
    || verified.trace.snapshot_tree !== value.snapshot_tree || verified.trace.material_id !== value.material_id) {
    throw phaseEvidenceError("legacy Phase trace lineage does not match its canonical trace");
  }
  const riskAcceptances = reviewRiskBindings(task, verified, input.risk_acceptances ?? []);
  refOnly(value.phase_evidence, verified.trace.canonical_phase_evidence, "phase evidence");
  refOnly(value.diff_scan, verified.trace.diff_scan, "diff scan");
  refOnly(value.implementation_receipt, verified.trace.implementation_receipt, "implementation receipt");
  refOnly(value.green_test_receipt, verified.trace.green_test_receipt, "GREEN test receipt");
  if (value.red_test_receipt !== null || verified.trace.red_test_receipt !== null) throw phaseEvidenceError("legacy Phase trace lineage RED binding is not eligible for supersession");
  refOnly(value.review_result, verified.trace.review_result, "review result");
  refOnly(value.review_attempt, verified.trace.review_attempt, "review attempt");
  const corrected = {
    ...lineageGenerationFromTrace(task, verified, riskAcceptances), schema_version: "phase-trace-lineage-supersession.v1",
    supersedes: { ref: legacy.ref, sha256: legacy.hash }, result: "superseded",
  };
  const ref = lineageSupersessionRef(value.phase_id, value.snapshot_tree, legacy.hash);
  const raw = canonical(corrected);
  return task.withRecordLock("locks/phase-trace-lineage.lock", () => {
    for (const existingRef of task.listCanonicalPhaseTraceLineageSupersessionRefs()) {
      const existing = readJson(task, existingRef, undefined, "Phase trace lineage supersession", LINEAGE_SUPERSESSION_REF).value;
      if (existing.supersedes?.ref === legacy.ref || existing.review_result?.ref === verified.review.ref) {
        throw recoveryError("RECOVERY_ALREADY_USED", "this legacy lineage or formal review is already superseded");
      }
    }
    try { task.writePhaseTraceLineageSupersession(ref, raw); }
    catch (error) { throw recoveryError("RECOVERY_RECORD_CONFLICT", error.message); }
    return Object.freeze({ supersession_ref: ref, supersession_hash: sha256(raw), lineage_ref: legacy.ref,
      trace_ref: verified.traceRef, trace_hash: verified.traceSha256, review_result_ref: verified.review.ref });
  });
}

function phaseTraceLineage(values) {
  const task = openTask(values["task-path"], values.project, values.task);
  if (task.manifest.execution_mode !== "per_invocation") {
    try { inspectRunnerIdentity({ runnerRoot: values["runner-root"], projectName: task.identity.projectName, taskId: task.identity.taskId, stage: "build-code" }); }
    catch (error) { throw recoveryError("RECOVERY_RUNNER_IDENTITY_INVALID", error.message); }
  }
  const sources = readLineageSources(task, values);
  const trace = phaseTraceFromSources(sources);
  const traceRaw = canonical(trace);
  const traceHash = sha256(traceRaw);
  const traceRef = `evidence/phases/${sources.phaseId}/${sources.subject.candidateTree}/phase-map-trace-${traceHash}.json`;
  const kernel = createTaskKernel(task);
  task.withRecordLock("locks/phase-trace-generation.lock", () => {
    if (recordExists(task, traceRef)) {
      if (task.readRecord(traceRef) !== traceRaw) throw recoveryError("RECOVERY_RECORD_CONFLICT", "canonical Phase trace bytes conflict");
      return;
    }
    try { kernel.publishCanonicalRecord(traceRef, traceRaw); }
    catch (error) { throw recoveryError("RECOVERY_RECORD_CONFLICT", error.message); }
    try { readPhaseMapTrace({ task, sourceRoot: task.manifest.target_repo_root, traceRef }); }
    catch (error) { throw recoveryError("RECOVERY_PHASE_EVIDENCE_MISMATCH", error.message); }
  });
  const result = publishPhaseTraceLineage({
    task,
    workspace: { worktreeRoot: task.manifest.target_repo_root },
  }, {
    trace_ref: traceRef,
    trace_hash: traceHash,
    ...(values["risk-acceptance-refs"] === undefined ? {} : {
      risk_acceptances: riskAcceptanceBindingsFromValues(values),
    }),
  });
  return { ...result, next_entry: "stage-runtime receipt --revision=true + capture-tests + publish-phase-evidence + fresh wh-review" };
}

function phasePointer(values, testHooks) {
  const task = openTask(values["task-path"], values.project, values.task);
  const credential = readRecoveryCredential(task, values["credential-ref"], values["credential-hash"], "phase-pointer");
  assertRecoveryUnused(task, "phase-pointer");
  if (task.manifest.execution_mode !== "per_invocation") {
    try { inspectRunnerIdentity({ runnerRoot: values["runner-root"], projectName: task.identity.projectName, taskId: task.identity.taskId, stage: "build-code" }); }
    catch (error) { throw recoveryError("RECOVERY_RUNNER_IDENTITY_INVALID", error.message); }
  }
  const pointer = readJson(task, "phase-result.json", undefined, "current Phase pointer");
  const subject = credential.value.phase_subject;
  if (pointer.value.phase_id !== "phase-1" || subject.current_pointer_hash !== pointer.hash) throw recoveryError("RECOVERY_PHASE_POINTER_MISMATCH", "current pointer is not the credentialed Phase 1 pointer");
  const baseline = readJson(task, subject.baseline_phase0_evidence_ref, subject.baseline_phase0_evidence_hash, "baseline Phase 0 evidence", PHASE0_EVIDENCE_REF);
  const baselineSnapshot = snapshotFromEvidence(task, baseline);
  const review = readJson(task, subject.baseline_phase0_review_ref, subject.baseline_phase0_review_hash, "baseline Phase 0 review", /^(?:reviews\/results\/[A-Za-z0-9._-]+\.json|reviews\/attempts\/[A-Za-z0-9-]+\/attempt\.json)$/);
  assertBaselinePhaseClosure(task, baseline, baselineSnapshot, subject);
  assertBaselineReviewClosure(task, subject, baselineSnapshot, review, riskAcceptanceBindingsFromValues(values));
  const sameSnapshot = subject.snapshot_tree === baselineSnapshot;
  assertPhaseRecoveryIntent({ sameSnapshot, recoveryIntent: subject.recovery_intent });
  const implementation = readPhaseReceipt(task, subject.implementation_receipt, "Phase 0 implementation receipt", { component: "implementation" });
  const green = readPhaseReceipt(task, subject.green_test_receipt, "Phase 0 GREEN test receipt", { component: "build-code-test-capture", green: true });
  if (implementation.value.snapshot_tree !== subject.snapshot_tree || green.value.snapshot_tree !== subject.snapshot_tree) throw phaseEvidenceError("Phase 0 receipt snapshot mismatch");
  if (subject.red_test_receipt) {
    const red = readPhaseReceipt(task, subject.red_test_receipt, "Phase 0 RED test receipt", { component: "build-code-test-capture", green: false });
    if (red.value.snapshot_tree !== subject.snapshot_tree) throw phaseEvidenceError("Phase 0 RED receipt snapshot mismatch");
  }
  const normalizedAllowedFiles = normalizeRuntimeOnlyPaths(subject.allowed_files);
  const generationPath = generationRef("phase-pointer", 1);
  const archivePath = `identity/recovery-archives/phase-result-${pointer.hash}.json`;
  const pointerBody = {
    phase_id: "phase-0", status: "awaiting_review", needs_human: false, recovery_ref: generationPath,
    recovery_hash: "__GENERATION_HASH__", tests: { green: { path: subject.green_test_receipt.ref }, ...(subject.red_test_receipt ? { red: { path: subject.red_test_receipt.ref } } : {}) },
    declared_allowed_files: normalizedAllowedFiles,
  };
  const afterHash = normalizedRecoveryRecordHash("phase-pointer", pointerBody);
  const generationValue = { schema_version: "workflowhub-recovery-generation.v1", project_name: task.identity.projectName, task_id: task.identity.taskId, recovery_kind: "phase-pointer", generation: 1, credential_ref: credential.ref, credential_hash: credential.hash, before: { ref: "phase-result.json", hash: pointer.hash, tree: pointer.value.snapshot_tree ?? baselineSnapshot }, after: { ref: "phase-result.json", hash: afterHash, tree: subject.snapshot_tree }, created_at: new Date().toISOString(), result: "accepted" };
  const generationRaw = canonical(generationValue);
  const generationHash = sha256(generationRaw);
  pointerBody.recovery_hash = generationHash;
  const pointerRaw = canonical(pointerBody);
  testHooks?.beforeCommitLock?.();
  task.withRecordLock(RECOVERY_OPERATIONS["phase-pointer"].lock_ref, () => {
    if (readRecoveryGeneration(task, "phase-pointer")) throw recoveryError("RECOVERY_ALREADY_USED", "phase-pointer recovery gate is already consumed");
    if (sha256(task.readRecord("phase-result.json")) !== pointer.hash) throw recoveryError("RECOVERY_CONCURRENT_CHANGE", "Phase pointer changed before recovery");
    try {
      task.replaceRecoveryPointer({
        previousPointerRaw: pointer.raw, pointerRaw, archiveRef: archivePath, archiveRaw: pointer.raw,
        generationRef: generationPath, generationRaw, testHooks: testHooks?.pointerReplacement,
      });
    }
    catch (error) { if (error.code?.startsWith("RECOVERY_")) throw error; throw recoveryError(error.message?.includes("changed") ? "RECOVERY_CONCURRENT_CHANGE" : "RECOVERY_RECORD_CONFLICT", error.message); }
    return null;
  });
  const committed = {
    recovery_ref: generationPath, recovery_hash: generationHash, phase_id: "phase-0", status: "awaiting_review",
  };
  const continuationFailure = (error) => {
    if (!sameSnapshot) throw error;
    return { ...committed, next_entry: "stage-runtime publish-phase-evidence" };
  };
  let context;
  try {
    testHooks?.beforeContinuation?.();
    const workspace = openAcceptedWorkspace(task, createTaskKernel(task).readAccepted("make-decision"));
    context = { task, kernel: createTaskKernel(task, { workspace }), workspace };
  } catch (error) {
    return continuationFailure(recoveryError("RECOVERY_PHASE_CONTINUATION_MISMATCH", error.message));
  }
  let evidence;
  try {
    evidence = publishBuildCodePhaseEvidence(context, {
      phase_id: "phase-0", implementation_receipt_ref: subject.implementation_receipt.ref,
      green_test_receipt_ref: subject.green_test_receipt.ref,
      ...(subject.red_test_receipt ? { red_evidence_ref: subject.red_test_receipt.ref } : {}),
      allowed_files: normalizedAllowedFiles, recovery_ref: generationPath, recovery_hash: generationHash,
    });
  } catch (error) {
    return continuationFailure(phaseEvidenceError(`Phase 0 evidence publication failed: ${error.message}`));
  }
  return { ...committed, canonical_phase_evidence_ref: evidence.canonical_phase_evidence_ref, next_entry: "fresh wh-review" };
}

export function runRecovery(argv = process.argv.slice(2), options) {
  const values = parse(argv);
  if (values.help) return helpText();
  const task = openTask(values["task-path"], values.project, values.task);
  const stage = values.stage ?? "build-code";
  const workspace = values.command === "dirty-cleanup-rebind"
    ? undefined
    : openAcceptedWorkspace(task, createTaskKernel(task).readAccepted("make-decision"));
  const boundary = authenticateWriteBoundary({
    task,
    runnerRoot: values["runner-root"],
    stage,
    operation: `recovery.${values.command}`,
    ...(workspace === undefined ? {} : { workspace }),
  });
  let result;
  if (values.command === "runner-replacement") result = runnerReplacement(values);
  else if (values.command === "runner-replacement-bridge") result = runnerReplacementBridge(values);
  else if (values.command === "phase-pointer") result = phasePointer(values, options);
  else if (values.command === "dirty-cleanup-rebind") result = dirtyCleanupRebind(values, options);
  else result = phaseTraceLineage(values);
  if (typeof result?.recovery_ref === "string" && HASH.test(result.recovery_hash ?? "")) {
    persistWriteBoundaryPathCard({
      task: openTask(values["task-path"], values.project, values.task),
      boundary,
      source: { ref: result.recovery_ref, hash: result.recovery_hash },
    });
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.stdout.write(`${JSON.stringify(runRecovery(), null, 2)}\n`); }
  catch (error) { process.stderr.write(`${error.code ?? "RECOVERY_ERROR"}: ${error.message}\n`); process.exitCode = 1; }
}
