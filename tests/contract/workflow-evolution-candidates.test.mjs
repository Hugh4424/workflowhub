import { afterEach, describe, expect, it } from "vitest";
import { appendFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const roots = [];
const moduleUrl = new URL("../../runtime/evidence/workflow-evolution.mjs", import.meta.url);

async function loadModule() {
  try { return await import(moduleUrl.href); }
  catch (error) {
    if (error?.code === "ERR_MODULE_NOT_FOUND") return null;
    throw error;
  }
}

function root() {
  const value = mkdtempSync(join(tmpdir(), "m16-candidates-"));
  roots.push(value);
  return value;
}

function observation(id, kind = "retry") {
  return {
    task_id: `task-${id}`,
    confirmation_ref: `confirmation-${id}`,
    confirmation_sha256: id === "one" ? "1".repeat(64) : id === "two" ? "2".repeat(64) : "a".repeat(64),
    occurred_at: "2026-08-30T00:00:00Z",
    intervention_kind: kind,
    intervention_payload: { reason: id },
    target_ref: { kind: "step", id: `step-${id}`, version: "1", authority: `manifest:${id}` },
  };
}

function candidateLedger(storageRoot) {
  return join(storageRoot, "Projects", "Demo", "evolution-candidates.jsonl");
}

afterEach(() => roots.splice(0).forEach((value) => rmSync(value, { recursive: true, force: true })));

describe("M16 candidate and tax contract", () => {
  it("exports the nine frozen deep-module APIs", async () => {
    const mod = await loadModule();
    expect(mod).not.toBeNull();
    for (const name of [
      "resolveTargetRef", "deriveObservationId", "deriveCandidateGroupId", "buildInputInventory",
      "computeQualityTaxProjection", "acquireProjectLock", "refreshEvolutionSnapshot",
      "recordCandidateTransition", "readCurrentEvolutionProjection",
    ]) expect(typeof mod?.[name]).toBe("function");
    expect(Object.hasOwn(mod ?? {}, "readCurrentCandidateSnapshot")).toBe(false);
  });

  it("keeps observation identity distinct from candidate grouping and counts distinct tasks", async () => {
    const mod = await loadModule();
    const targetRef = { kind: "step", id: "build-plan", version: "1", authority: "manifest:sha256:x" };
    const first = mod?.deriveObservationId?.({ projectId: "Demo", targetRef, taskId: "t1", confirmationRef: "c1", occurredAt: "2026-08-31T00:00:00Z", interventionKind: "retry", interventionPayload: { reason: "x" } });
    const second = mod?.deriveObservationId?.({ projectId: "Demo", targetRef, taskId: "t2", confirmationRef: "c2", occurredAt: "2026-08-31T00:00:00Z", interventionKind: "retry", interventionPayload: { reason: "x" } });
    const group1 = mod?.deriveCandidateGroupId?.({ projectId: "Demo", targetRef, interventionKind: "retry", interventionPayload: { reason: "x" } });
    const group2 = mod?.deriveCandidateGroupId?.({ projectId: "Demo", targetRef, interventionKind: "retry", interventionPayload: { reason: "x" } });
    expect(first?.observationId).not.toBe(second?.observationId);
    expect(group1?.candidateGroupId).toBe(group2?.candidateGroupId);
    expect(first?.canonicalBytes).not.toContain("t2");
    expect(group1?.canonicalBytes).not.toContain("t1");
  });

  it("does not promote an unbound caller-asserted consumer proof to action_suggested", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const item = observation("same");
    const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
    const result = mod.refreshEvolutionSnapshot({
      storageRoot, project: "Demo", attemptId: "a1", now: "2026-08-31T00:00:00Z",
      inventory: { project: "Demo", observations: [item], consumer_proofs: [{
        schema_version: "consumer-scan-proof.v1", project: "Demo", task_id: item.task_id,
        coverage_status: "complete", zero_consumption: true, scope_revision: "caller-asserted",
        expected_stage_set: stages, scanned_stage_set: stages, scanned_at: "2026-08-31T00:00:00Z",
        registered_output_refs: [{ consumer_count: 0 }],
      }] },
    });
    expect(result.status).toBe("ok");
    expect(result.records[0]).toMatchObject({ tier: "reference_only", machine_signals: { zero_consumption: "unknown" } });
  });

  it("binds quality tax to caller time and conservative sample/confidence states", async () => {
    const mod = await loadModule();
    const result = mod?.computeQualityTaxProjection?.({
      inventory: { project: "Demo" }, asOf: "2026-08-31T00:00:00Z", interventions: [
        { project: "Demo", task_id: "t1", confirmation_ref: "c1", intervention_stage: "build-code", occurred_at: "2026-08-30T00:00:00Z", primary_attribution_stage: "upstream_omission:build-plan" },
        { project: "Demo", task_id: "t2", confirmation_ref: "c2", intervention_stage: "build-code", occurred_at: "2026-08-29T00:00:00Z", primary_attribution_stage: "free text" },
      ], stageManifest: { stages: ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"] },
    });
    expect(result?.generatedAt ?? result?.generated_at).toBe("2026-08-31T00:00:00Z");
    expect(result?.sampleStatus ?? result?.sample_status).toBe("insufficient_samples");
    expect(result?.confidence).toBe("unavailable");
    expect(result?.unknownCount ?? result?.unknown_count).toBe(1);
  });

  it("rejects unknown target authorities instead of guessing from free text", async () => {
    const mod = await loadModule();
    const result = mod?.resolveTargetRef?.({ projectId: "Demo", targetKind: "step", targetId: "missing", authorities: { stages: [] } });
    expect(result?.status ?? result?.error?.code).toMatch(/invalid_target|stale_source/);
  });

  it("initial refresh allocates generation one and a two-layer identity", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const result = mod?.refreshEvolutionSnapshot?.({ storageRoot, project: "Demo", attemptId: "a1", inventory: { project: "Demo", observations: [] }, now: "2026-08-31T00:00:00Z" });
    expect(result?.publicationGeneration ?? result?.publication_generation).toBe(1);
    expect(result?.snapshotId ?? result?.snapshot_id).toMatch(/^[a-f0-9]{64}$/);
    expect(result?.refreshResult ?? result?.refresh_result).toBeTruthy();
  });

  it("rejects project identifiers that escape the configured Projects root", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    expect(() => mod.acquireProjectLock({ storageRoot, project: "../escape", attemptId: "a1" })).toThrow(/project/i);
    expect(existsSync(join(storageRoot, "escape"))).toBe(false);
  });

  it("allocates a new publication generation for identical content and rejects replay without writing", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const inventory = { project: "Demo", observations: [] };
    const first = mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "a1", inventory, now: "2026-08-31T00:00:00Z" });
    const second = mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "a2", inventory, now: "2026-08-31T00:00:00Z" });
    expect(first.publication_generation).toBe(1);
    expect(second.publication_generation).toBe(2);
    expect(second.snapshot_content_id).toBe(first.snapshot_content_id);
    expect(second.snapshot_id).not.toBe(first.snapshot_id);
    const beforeReplay = readFileSync(candidateLedger(storageRoot));
    expect(mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "a2", inventory, now: "2026-08-31T00:00:00Z" }).error?.code).toBe("duplicate_attempt");
    expect(readFileSync(candidateLedger(storageRoot))).toEqual(beforeReplay);
  });

  it("authenticates a torn terminal batch before publishing the next generation", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const first = mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "a1", inventory: { project: "Demo", observations: [] }, now: "2026-08-31T00:00:00Z" });
    const ledger = candidateLedger(storageRoot);
    const committedPrefix = readFileSync(ledger);
    const torn = Buffer.from('{"record_kind":"batch_begin","batch_id":"torn"');
    appendFileSync(ledger, torn);
    const second = mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "a2", inventory: { project: "Demo", observations: [] }, now: "2026-08-31T00:00:00Z" });
    expect(second.status).toBe("ok");
    expect(second.publication_generation).toBe(2);
    const bytes = readFileSync(ledger);
    expect(bytes.subarray(0, committedPrefix.length)).toEqual(committedPrefix);
    const records = bytes.toString("utf8").trim().split("\n").flatMap((line) => {
      try { return [JSON.parse(line)]; } catch { return []; }
    });
    const abort = records.find((record) => record.record_kind === "batch_abort");
    expect(abort).toMatchObject({ abandoned_start_offset: committedPrefix.length, observed_suffix_length: torn.length, reason: "terminal_uncommitted_suffix" });
    expect(mod.readCurrentEvolutionProjection({ storageRoot, project: "Demo" }).publication_generation).toBe(2);
    expect(first.publication_generation).toBe(1);
  });

  it("recovers a complete pre-commit batch and retries at the abandoned generation", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const inventory = { project: "Demo", observations: [observation("one")] };
    const first = mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "a1", inventory, now: "2026-08-31T00:00:00Z" });
    const ledger = candidateLedger(storageRoot);
    const committedPrefix = readFileSync(ledger);
    const begin = {
      schema_version: "workflow-evolution.v1", record_kind: "batch_begin", batch_id: "crashed-batch",
      project: "Demo", attempt_id: "crashed-attempt", snapshot_content_id: first.snapshot_content_id,
      snapshot_id: "crashed-snapshot", publication_generation: 2,
    };
    const row = { ...first.records[0], batch_id: "crashed-batch", snapshot_id: "crashed-snapshot", publication_generation: 2 };
    const abandonedSuffix = Buffer.concat([Buffer.from(`${JSON.stringify(begin)}\n`), Buffer.from(`${JSON.stringify(row)}\n`)]);
    appendFileSync(ledger, abandonedSuffix);

    const retry = mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "a2", inventory, now: "2026-08-31T00:00:00Z" });

    expect(retry).toMatchObject({ status: "ok", publication_generation: 2 });
    const bytes = readFileSync(ledger);
    expect(bytes.subarray(0, committedPrefix.length)).toEqual(committedPrefix);
    const records = bytes.toString("utf8").trim().split("\n").map((line) => JSON.parse(line));
    expect(records.find((record) => record.record_kind === "batch_abort" && record.batch_id === "crashed-batch")).toMatchObject({
      abandoned_start_offset: committedPrefix.length,
      observed_suffix_length: abandonedSuffix.length,
      observed_suffix_hash: expect.any(String),
      reason: "terminal_uncommitted_suffix",
    });
    expect(mod.readCurrentEvolutionProjection({ storageRoot, project: "Demo" }).publication_generation).toBe(2);
  });

  it("fails closed on a forged committed batch without modifying the ledger", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const first = mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "a1", inventory: { project: "Demo", observations: [] }, now: "2026-08-31T00:00:00Z" });
    const ledger = candidateLedger(storageRoot);
    const begin = { schema_version: "workflow-evolution.v1", record_kind: "batch_begin", batch_id: "forged", project: "Demo", attempt_id: "forged", snapshot_content_id: first.snapshot_content_id, snapshot_id: "forged", publication_generation: 2 };
    const commit = { ...begin, record_kind: "batch_commit", count: 0, content_hash: "0".repeat(64), status: "committed" };
    appendFileSync(ledger, `${JSON.stringify(begin)}\n${JSON.stringify(commit)}\n`);
    const forgedBytes = readFileSync(ledger);
    const result = mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "a2", inventory: { project: "Demo", observations: [] }, now: "2026-08-31T00:00:00Z" });
    expect(result).toMatchObject({ status: "failed", error: { code: "failed" } });
    expect(readFileSync(ledger)).toEqual(forgedBytes);
  });

  it("fails closed when corruption occurs before a later committed batch", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const inventory = { project: "Demo", observations: [] };
    expect(mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "a1", inventory, now: "2026-08-30T00:00:00Z" }).status).toBe("ok");
    expect(mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "a2", inventory, now: "2026-08-31T00:00:00Z" }).status).toBe("ok");
    const ledger = candidateLedger(storageRoot);
    const lines = readFileSync(ledger, "utf8").split("\n");
    lines[0] = `!${lines[0].slice(1)}`;
    writeFileSync(ledger, lines.join("\n"));
    const corrupted = readFileSync(ledger);
    const result = mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "a3", inventory, now: "2026-09-01T00:00:00Z" });
    expect(result).toMatchObject({ status: "failed", error: { code: "failed" } });
    expect(readFileSync(ledger)).toEqual(corrupted);
  });

  it("publishes transitions as complete snapshots and fences stale lock owners", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const refreshed = mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "a1", inventory: { project: "Demo", observations: [observation("one"), observation("two")] }, now: "2026-08-31T00:00:00Z" });
    expect(refreshed.records).toHaveLength(2);
    expect(refreshed.records.every((record) => record.snapshot_content_id === refreshed.snapshot_content_id)).toBe(true);
    const lock = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "transition-1" });
    const target = refreshed.records[0];
    const transitioned = mod.recordCandidateTransition({ storageRoot, project: "Demo", attemptId: "transition-1", currentSnapshotId: refreshed.snapshot_id, candidateId: target.candidate_id, candidateRecordId: target.candidate_record_id, expectedRevision: 1, currentSourceIdentities: target.source_identities, currentMaterialIdentities: target.material_identities, humanConfirmation: { ref: target.human_confirmation_ref, sha256: target.human_confirmation_sha256 }, lifecycleStatus: "deferred", lockAuthority: lock });
    expect(transitioned).toMatchObject({ status: "ok", publication_generation: 2, revision: 2 });
    const projection = mod.readCurrentEvolutionProjection({ storageRoot, project: "Demo" });
    expect(projection.candidates).toHaveLength(2);
    expect(projection.candidates.find((candidate) => candidate.candidate_id === target.candidate_id)).toMatchObject({ revision: 2, lifecycle_status: "deferred" });
    expect(lock.release()).toEqual({ status: "ok" });

    const stale = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "transition-2" });
    const lockBytes = JSON.parse(readFileSync(stale.lockHandle.path, "utf8"));
    writeFileSync(stale.lockHandle.path, `${JSON.stringify({ ...lockBytes, fencing_token: "new-owner" })}\n`);
    const before = readFileSync(candidateLedger(storageRoot));
    const rejected = mod.recordCandidateTransition({ storageRoot, project: "Demo", attemptId: "transition-2", currentSnapshotId: transitioned.snapshot_id, candidateId: target.candidate_id, candidateRecordId: target.candidate_record_id, expectedRevision: 2, currentSourceIdentities: target.source_identities, currentMaterialIdentities: target.material_identities, humanConfirmation: { ref: target.human_confirmation_ref, sha256: target.human_confirmation_sha256 }, lockAuthority: stale });
    expect(rejected).toMatchObject({ status: "stale_source", error: { code: "stale_source" } });
    expect(readFileSync(candidateLedger(storageRoot))).toEqual(before);
    expect(stale.release()).toEqual({ status: "stale_source" });
  });

  it("does not reclaim an expired lock while its same-epoch owner process is alive", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const first = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "a1", bootId: "boot", sessionEpoch: "session" });
    const lockValue = JSON.parse(readFileSync(first.lockHandle.path, "utf8"));
    writeFileSync(first.lockHandle.path, `${JSON.stringify({ ...lockValue, acquired_monotonic_ms: 0, lease_deadline_monotonic_ms: 1 })}\n`);
    const second = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "a2", bootId: "boot", sessionEpoch: "session" });
    expect(second.status).toBe("conflict");
    expect(first.release()).toEqual({ status: "ok" });
  });

  it("inherits lifecycle and revision on refresh while invalidating old transition authority", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const inventory = { project: "Demo", observations: [observation("same")], source_identities: ["source-1"], material_identities: ["material-1"] };
    const first = mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "a1", inventory, now: "2026-08-31T00:00:00Z" });
    const original = first.records[0];
    const firstLock = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "transition-1" });
    const transition = mod.recordCandidateTransition({ storageRoot, project: "Demo", attemptId: "transition-1", currentSnapshotId: first.snapshot_id, candidateRecordId: original.candidate_record_id, candidateId: original.candidate_id, expectedRevision: 1, currentSourceIdentities: original.source_identities, currentMaterialIdentities: original.material_identities, humanConfirmation: { ref: original.human_confirmation_ref, sha256: original.human_confirmation_sha256 }, lifecycleStatus: "deferred", lockAuthority: firstLock });
    expect(transition.status).toBe("ok");
    firstLock.release();
    const refreshed = mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "a2", inventory: { ...inventory, source_identities: ["source-2"], material_identities: ["material-2"] }, now: "2026-08-31T00:00:00Z" });
    const current = refreshed.records[0];
    expect(current).toMatchObject({ candidate_id: original.candidate_id, revision: 2, lifecycle_status: "deferred", source_identities: ["source-2"], material_identities: ["material-2"] });
    expect(current.candidate_record_id).not.toBe(original.candidate_record_id);
    const staleLock = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "transition-stale" });
    const before = readFileSync(candidateLedger(storageRoot));
    const authority = { storageRoot, project: "Demo", attemptId: "transition-stale", currentSnapshotId: refreshed.snapshot_id, candidateRecordId: current.candidate_record_id, candidateId: current.candidate_id, expectedRevision: 2, currentSourceIdentities: current.source_identities, currentMaterialIdentities: current.material_identities, humanConfirmation: { ref: current.human_confirmation_ref, sha256: current.human_confirmation_sha256 }, lifecycleStatus: "verified", lockAuthority: staleLock };
    for (const stale of [
      mod.recordCandidateTransition({ ...authority, currentSourceIdentities: original.source_identities }),
      mod.recordCandidateTransition({ ...authority, currentMaterialIdentities: original.material_identities }),
      mod.recordCandidateTransition({ ...authority, humanConfirmation: { ...authority.humanConfirmation, sha256: "0".repeat(64) } }),
    ]) expect(stale).toMatchObject({ status: "stale_source", error: { code: "stale_source" } });
    expect(readFileSync(candidateLedger(storageRoot))).toEqual(before);
    staleLock.release();
  });
});
