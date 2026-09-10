#!/usr/bin/env node

import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ArtifactDir } from "../../core/artifact-dir.mjs";
import { resolveStorageRoot } from "../../runtime/evidence/storage-root.mjs";
import { captureExecutionSnapshot, materialRevisionFromValues } from "../../runtime/task/git-worktree-snapshot.mjs";
import { CURRENT_MATERIAL_FILES } from "../../runtime/task/material-workspace.mjs";
import { openTask } from "../../runtime/task/task-handle.mjs";
import { openCurrentTaskWorkspace } from "../../runtime/task/workspace.mjs";

const TASK_ID = "workflowhub-research-handoff-hardening-20260909";
const STAGE = "build-code";
const SHA256 = /^[a-f0-9]{64}$/;
const VERDICTS = new Set(["passed", "partial", "unavailable", "failed"]);
const EVIDENCE_PAIRS = Object.freeze({
  "AC-RESEARCH-001": "T001-T002",
  "AC-RESEARCH-002": "T001-T002",
  "AC-RESEARCH-003": "T001-T002",
  "AC-EXECUTION-001": "T003-T004",
  "AC-EXECUTION-002": "T003-T004",
  "AC-REVIEW-001": "T005-T006",
  "AC-REVIEW-002": "T005-T006",
  "AC-GOVERNANCE-001": "T007-T008",
  "AC-GOVERNANCE-002": "T007-T008",
  "AC-REFLECTION-001": "T009-T010",
  "AC-HANDOFF-001": "T011-T012",
  "AC-MATERIAL-001": "T013-T014",
  "AC-PERFORMANCE-001": "T015-T016",
});

export const ACTIVE_ACCEPTANCE_CRITERIA = Object.freeze([
  "AC-RESEARCH-001",
  "AC-RESEARCH-002",
  "AC-RESEARCH-003",
  "AC-EXECUTION-001",
  "AC-EXECUTION-002",
  "AC-REVIEW-001",
  "AC-REVIEW-002",
  "AC-GOVERNANCE-001",
  "AC-GOVERNANCE-002",
  "AC-REFLECTION-001",
  "AC-HANDOFF-001",
  "AC-MATERIAL-001",
  "AC-PERFORMANCE-001",
]);

const hashBytes = (raw) => createHash("sha256").update(raw).digest("hex");
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const TRUSTED_SOURCES = new WeakSet();

function pairStatus(value) {
  if (["completed", "partial", "unavailable", "failed"].includes(value?.status)) return value.status;
  const observedGreen = [value?.green, value?.green_contract, value?.green_review_route, value?.gate]
    .some((entry) => entry?.exit_code === 0);
  return observedGreen ? "partial" : "unavailable";
}

function assertion(id, expected, actual, extra = {}) {
  return { id, expected, actual, ...extra };
}

function evidencePathFromArgs(argv = process.argv.slice(2)) {
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--evidence" || argument === "--input") return argv[index + 1] ?? null;
    if (argument.startsWith("--evidence=") || argument.startsWith("--input=")) return argument.slice(argument.indexOf("=") + 1);
    if (!argument.startsWith("-")) return argument;
  }
  return process.env.WORKFLOWHUB_ACCEPTANCE_EVIDENCE
    ?? process.env.WORKFLOWHUB_ACCEPTANCE_INPUT
    ?? null;
}

function readCanonicalTaskEvidence() {
  try {
    const storageRoot = resolveStorageRoot({ env: process.env, home: homedir() });
    const taskRoot = join(storageRoot, "Projects", "workflowhub", "tasks", TASK_ID);
    const task = openTask(taskRoot, { projectName: "workflowhub", taskId: TASK_ID });
    const workspace = openCurrentTaskWorkspace(task);
    const snapshot = captureExecutionSnapshot(workspace.worktreeRoot, TASK_ID);
    const artifacts = ArtifactDir.open(workspace.worktreeRoot, task);
    const materialScopeRevision = materialRevisionFromValues(CURRENT_MATERIAL_FILES.map((name) => [name, artifacts.read(name)]));
    const pairValues = new Map();
    for (const pair of new Set(Object.values(EVIDENCE_PAIRS))) {
      const ref = `quality/tests/workflowhub-research-handoff-hardening/${pair}.json`;
      const raw = task.readRecordBytes(ref);
      pairValues.set(pair, { ref, sha256: hashBytes(raw), value: JSON.parse(raw.toString("utf8")) });
    }
    const entries = ACTIVE_ACCEPTANCE_CRITERIA.map((id) => {
      const pair = EVIDENCE_PAIRS[id];
      const record = pairValues.get(pair);
      const sourceStatus = pairStatus(record.value);
      const verdict = id === "AC-RESEARCH-003"
        ? "unavailable"
        : sourceStatus === "completed" ? "partial" : sourceStatus === "partial" ? "partial" : "unavailable";
      return {
        acceptance_criterion_id: id,
        verdict,
        assertions: [
          assertion("upstream_task_status", "completed", sourceStatus),
          assertion("current_binding", "authenticated current snapshot/material", "not present in pair record"),
          ...(id === "AC-RESEARCH-003"
            ? [assertion("real_fallback_smoke", "approved web_search and web_fetch evidence", "unavailable")]
            : []),
          assertion("canonical_evidence_bytes", "sha256 matches ref", record.sha256),
        ],
        evidence_refs: [{ ref: record.ref, sha256: record.sha256 }],
      };
    });
    const trusted = {
      payload: { task_id: TASK_ID, stage: STAGE, snapshot_tree: snapshot.tree, material_scope_revision: materialScopeRevision, entries },
      source: "canonical-task-store:quality/tests/workflowhub-research-handoff-hardening",
      root: taskRoot,
      task,
      identity: { task_id: TASK_ID, stage: STAGE, snapshot_tree: snapshot.tree, material_scope_revision: materialScopeRevision },
      error: null,
    };
    TRUSTED_SOURCES.add(trusted);
    return trusted;
  } catch (error) {
    return { payload: null, source: "canonical-task-store:quality/tests/workflowhub-research-handoff-hardening", root: null, task: null, identity: null, error: `authenticated canonical acceptance evidence is unavailable: ${error.message}` };
  }
}

function readEvidenceSource(candidate) {
  if (!candidate) return readCanonicalTaskEvidence();
  return { payload: null, source: candidate, root: null, task: null, identity: null, error: "external acceptance evidence input is not an authenticated canonical source" };
}

function candidateEntries(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload.entries)) return payload.entries;
  if (Array.isArray(payload.acceptance_coverage?.items)) return payload.acceptance_coverage.items;
  if (Array.isArray(payload.acceptance_results)) return payload.acceptance_results;
  return [];
}

function validateIdentity(payload, entry, authenticatedIdentity) {
  const identity = {
    task_id: entry?.task_id ?? payload?.task_id,
    stage: entry?.stage ?? payload?.stage,
    snapshot_tree: entry?.snapshot_tree ?? payload?.snapshot_tree,
    material_scope_revision: entry?.material_scope_revision ?? payload?.material_scope_revision,
  };
  const problems = [];
  if (!authenticatedIdentity) problems.push("acceptance source is not authenticated");
  if (identity.task_id !== TASK_ID) problems.push("task identity does not match the current task");
  for (const key of ["task_id", "stage", "snapshot_tree", "material_scope_revision"]) {
    if (authenticatedIdentity && identity[key] !== authenticatedIdentity[key]) problems.push(`${key} does not match authenticated current identity`);
  }
  return { identity, problems };
}

function resolveEvidenceRef(ref, task) {
  if (!ref || typeof ref !== "object" || Array.isArray(ref)) return { error: "evidence ref must be an object" };
  const relativeRef = ref.ref;
  const expectedHash = ref.sha256 ?? ref.hash;
  if (typeof relativeRef !== "string" || relativeRef.trim() === "") return { error: "evidence ref.ref is missing" };
  if (typeof expectedHash !== "string" || !SHA256.test(expectedHash)) return { error: "evidence ref.sha256 must be a sha256" };
  if (!task || isAbsolute(relativeRef) || relativeRef.split("/").includes("..")) return { error: "evidence ref is not task-local authenticated data" };
  let raw;
  try { raw = task.readRecordBytes(relativeRef); }
  catch { return { error: `evidence bytes are missing: ${relativeRef}` }; }
  const actualHash = hashBytes(raw);
  if (actualHash !== expectedHash) return { error: `evidence hash mismatch: ${relativeRef}` };
  return { ref: relativeRef, sha256: actualHash };
}

function validateAssertions(entry) {
  if (!Array.isArray(entry?.assertions) || entry.assertions.length === 0) {
    return { assertions: [assertion("assertions", "at least one comparable assertion", "missing")], error: "assertions are missing" };
  }
  const invalid = entry.assertions.find((item) => !item || typeof item !== "object"
    || typeof item.id !== "string" || item.id.trim() === ""
    || !own(item, "expected") || !own(item, "actual"));
  if (invalid) return { assertions: [assertion("assertions", "every assertion has id/expected/actual", "invalid")], error: "assertions are not comparable" };
  return { assertions: entry.assertions.map((item) => ({ id: item.id, expected: item.expected, actual: item.actual })) };
}

function missingEntry(id, reason) {
  return {
    acceptance_criterion_id: id,
    verdict: "unavailable",
    assertions: [assertion("current_authenticated_evidence", "present and current", "unavailable", { reason })],
    evidence_refs: [],
  };
}

function normalizeEntry(payload, rawEntry, task, authenticatedIdentity) {
  const id = rawEntry?.acceptance_criterion_id ?? rawEntry?.id;
  const requestedVerdict = rawEntry.verdict ?? rawEntry.status ?? rawEntry.result;
  const identityResult = validateIdentity(payload, rawEntry, authenticatedIdentity);
  const assertionResult = validateAssertions(rawEntry);
  const refs = Array.isArray(rawEntry.evidence_refs) ? rawEntry.evidence_refs : [];
  const resolvedRefs = refs.map((ref) => resolveEvidenceRef(ref, task));
  const refErrors = resolvedRefs.filter((result) => result.error).map((result) => result.error);
  const evidenceRefs = resolvedRefs.filter((result) => !result.error).map(({ ref, sha256 }) => ({ ref, sha256 }));
  const errors = [...identityResult.problems, ...(assertionResult.error ? [assertionResult.error] : []), ...refErrors];

  let verdict = VERDICTS.has(requestedVerdict) ? requestedVerdict : "failed";
  if (verdict === "passed" && (errors.length > 0 || evidenceRefs.length === 0)) verdict = "failed";
  const assertions = assertionResult.error
    ? assertionResult.assertions
    : [...assertionResult.assertions, ...(errors.length ? [assertion("evidence_contract", "authenticated current refs with matching bytes", "invalid", { reasons: errors })] : [])];
  return {
    acceptance_criterion_id: id,
    verdict,
    assertions,
    evidence_refs: evidenceRefs,
    ...(errors.length ? { validation_errors: errors } : {}),
  };
}

function aggregateVerdict(entries) {
  if (entries.some((entry) => entry.verdict === "failed")) return "failed";
  if (entries.some((entry) => entry.verdict === "partial")) return "partial";
  if (entries.some((entry) => entry.verdict === "unavailable")) return "unavailable";
  return "passed";
}

export function buildAcceptanceReport(input = {}) {
  const { payload = null, source = null, task = null, identity = null, error: sourceError = null } = input;
  const inputError = TRUSTED_SOURCES.has(input) ? sourceError : (sourceError ?? "acceptance source is not authenticated");
  const sourceEntries = new Map();
  const duplicates = new Set();
  for (const rawEntry of candidateEntries(payload)) {
    const id = rawEntry?.acceptance_criterion_id ?? rawEntry?.id;
    if (!ACTIVE_ACCEPTANCE_CRITERIA.includes(id)) continue;
    if (sourceEntries.has(id)) duplicates.add(id);
    sourceEntries.set(id, rawEntry);
  }

  const entries = ACTIVE_ACCEPTANCE_CRITERIA.map((id) => {
    if (inputError) return missingEntry(id, inputError);
    if (duplicates.has(id)) {
      return {
        acceptance_criterion_id: id,
        verdict: "failed",
        assertions: [assertion("unique_entry", "exactly one active evidence entry", "duplicate")],
        evidence_refs: [],
      };
    }
    const rawEntry = sourceEntries.get(id);
    return rawEntry ? normalizeEntry(payload, rawEntry, task, identity) : missingEntry(id, "no evidence entry for this active criterion");
  });

  return {
    report_status: "generated",
    schema_version: "workflowhub-research-handoff-hardening.acceptance.v1",
    task_id: payload?.task_id ?? TASK_ID,
    stage: STAGE,
    snapshot_tree: payload?.snapshot_tree ?? payload?.identity?.snapshot_tree ?? null,
    material_scope_revision: payload?.material_scope_revision ?? payload?.identity?.material_scope_revision ?? null,
    evidence_source: source,
    acceptance_verdict: aggregateVerdict(entries),
    entries,
    coverage: {
      active_criterion_count: ACTIVE_ACCEPTANCE_CRITERIA.length,
      unique_entry_count: new Set(entries.map((entry) => entry.acceptance_criterion_id)).size,
      missing_entry_count: entries.filter((entry) => entry.verdict === "unavailable" && entry.evidence_refs.length === 0).length,
    },
    coverage_limits: [
      "exit code 0 means only that a structurally valid aggregate report was generated",
      "without authenticated current evidence, affected criteria remain unavailable",
      "local contract fixtures do not prove provider SLA, host executor execution, or physical delivery",
    ],
  };
}

export function main() {
  const candidate = evidencePathFromArgs();
  const input = readEvidenceSource(candidate);
  const report = buildAcceptanceReport(input);
  process.stdout.write(`${JSON.stringify(report)}\n`);
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) main();
