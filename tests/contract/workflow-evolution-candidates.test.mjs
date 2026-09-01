import { afterEach, describe, expect, it } from "vitest";
import { spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";

const roots = [];
const moduleUrl = new URL("../../runtime/evidence/workflow-evolution.mjs", import.meta.url);
const manifestRef = "workflows/build-spec/steps.json";
const manifestSha = createHash("sha256").update(readFileSync(new URL(`../../${manifestRef}`, import.meta.url))).digest("hex");

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
    target_ref: { kind: "step", id: "spec-clarify", version: "2.0.0", authority: manifestRef, authority_sha256: manifestSha },
  };
}

function candidateLedger(storageRoot) {
  return join(storageRoot, "Projects", "Demo", "evolution-candidates.jsonl");
}

function authenticateTaxItem(storageRoot, item, { legacy = false, v2 = false } = {}) {
  const value = legacy ? {
    schema_version: "human-confirmation.v1",
    task_id: item.task_id,
    stage: item.intervention_stage,
    attempt_ref: "legacy-attempt.json",
    decision: "accepted",
    confirmed_at: item.occurred_at,
  } : v2 ? {
    schema_version: "human-confirmation.v2",
    task_id: item.task_id,
    stage: item.intervention_stage,
    decision: "accepted",
    subject_ref: "quality/reviews/attempts/old-review.json",
    material_revision: `revision-${"c".repeat(64)}`,
    snapshot_tree: "d".repeat(40),
    confirmed_at: item.occurred_at,
  } : {
    schema_version: "human-confirmation.v3",
    task_id: item.task_id,
    stage: item.intervention_stage,
    decision: "accepted",
    subject_ref: item.step_slug,
    material_revision: `revision-${"c".repeat(64)}`,
    snapshot_tree: "d".repeat(40),
    confirmed_at: item.occurred_at,
    reply_text: "继续记录这次人工介入。",
    step_slug: item.step_slug,
  };
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const digest = createHash("sha256").update(raw).digest("hex");
  const ref = `quality/confirmations/${digest}.json`;
  const path = join(storageRoot, "Projects", "Demo", "tasks", item.task_id, ref);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, raw);
  return { ...item, confirmation_ref: ref };
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
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

  it("binds raw inventory identity to the caller project", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const inventory = mod.buildInputInventory({ project: "Demo", inventory: { project: "Attacker", observations: [] } });
    expect(inventory.inventory.project).toBe("Demo");
    const refresh = mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "project-binding", inventory: { project: "Attacker", observations: [] }, now: "2026-08-31T00:00:00Z" });
    expect(refresh.status).toBe("ok");
    expect(existsSync(join(storageRoot, "Projects/Demo/evolution-candidates.jsonl"))).toBe(true);
    expect(existsSync(join(storageRoot, "Projects/Attacker/evolution-candidates.jsonl"))).toBe(false);
  });

  it("deduplicates identical observations and rejects conflicting bytes for one observation identity", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const item = { ...observation("same"), classification: "simplify", severity: "low" };
    const first = mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "dedupe", inventory: { project: "Demo", observations: [item, structuredClone(item)] }, now: "2026-08-31T00:00:00Z" });
    expect(first.records[0]).toMatchObject({ priority_score: 1 });
    expect(first.records[0].source_observations).toHaveLength(1);
    const before = readFileSync(candidateLedger(storageRoot));
    const conflict = mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "conflict", inventory: { project: "Demo", observations: [item, { ...item, severity: "high" }] }, now: "2026-08-31T00:00:00Z" });
    expect(conflict).toMatchObject({ status: "conflict", error: { code: "conflict" } });
    expect(readFileSync(candidateLedger(storageRoot))).toEqual(before);
  });

  it("keeps remove candidates pending and exposes the complete reusable ablation contract", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const remove = { ...observation("remove"), classification: "remove_candidate" };
    const result = mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "remove", inventory: { project: "Demo", observations: [remove] }, now: "2026-08-31T00:00:00Z" });
    expect(result.records[0]).toMatchObject({ classification: "remove_candidate", removal_status: "pending" });
    const protocol = { schema_version: "ablation-protocol.v1", protocol_id: "abl-1", candidate_id: result.records[0].candidate_id, decision_id: "D-1", hypothesis: "removal preserves behavior", control_facts_ref: "facts:before", treatment_facts_ref: "facts:after", preserve_behaviors: ["build-plan output"], validation_method: "focused-test", success_oracle: "same output", failure_oracle: "output differs", revert_condition: "any regression", status: "deferred", evidence_refs: ["evidence:1"] };
    expect(() => mod.validateWorkflowEvolutionDefinition("ablation_protocol", protocol)).not.toThrow();
    expect(() => mod.validateWorkflowEvolutionDefinition("ablation_protocol", { schema_version: "ablation-protocol.v1", status: "deferred" })).toThrow(/schema invalid/);
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
        coverage_status: "complete", zero_consumption: true, scope_revision: "a".repeat(64),
        expected_stage_set: stages, scanned_stage_set: stages, scanned_at: "2026-08-31T00:00:00Z",
        registered_output_refs: [{ ref: "quality/evidence/output.md", source: { stage: "build-spec", subject_kind: "step", subject_id: "spec-clarify" }, consumer_count: 0, freshness: "current" }],
        source_subject: "tools/cli/derive-consumption-edges.mjs",
        source_refs: [`quality/evidence/stage-outcomes/build-spec/${"b".repeat(64)}.json`],
        diagnostics: [],
      }] },
    });
    expect(result.status).toBe("ok");
    expect(result.records[0]).toMatchObject({ tier: "reference_only", machine_signals: { zero_consumption: "unknown" } });
  });

  it("rejects a forged target authority before publishing", async () => {
    const mod = await loadModule(); const storageRoot = root();
    const item = observation("forged"); item.target_ref.authority_sha256 = "0".repeat(64);
    expect(mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "forged-authority", inventory: { observations: [item] }, now: "2026-08-31T00:00:00Z" })).toMatchObject({ status: "stale_source" });
    expect(existsSync(candidateLedger(storageRoot))).toBe(false);
  });

  it("rejects stale target versions and unknown proof fields", async () => {
    const mod = await loadModule();
    const staleRoot = root(); const stale = observation("version"); stale.target_ref.version = "1.0.0";
    expect(mod.refreshEvolutionSnapshot({ storageRoot: staleRoot, project: "Demo", attemptId: "stale-version", inventory: { observations: [stale] }, now: "2026-08-31T00:00:00Z" })).toMatchObject({ status: "stale_source" });
    const proof = { schema_version: "consumer-scan-proof.v1", project: "Demo", task_id: "task-version", coverage_status: "complete", zero_consumption: true, expected_stage_set: ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"], scanned_stage_set: ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"], scanned_at: "2026-08-31T00:00:00Z", scope_revision: "a".repeat(64), registered_output_refs: [{ ref: "quality/x", source: { stage: "build-spec", subject_kind: "step", subject_id: "spec-clarify" }, consumer_count: 0, freshness: "current" }], source_subject: "tools/cli/derive-consumption-edges.mjs", source_refs: [`quality/evidence/stage-outcomes/build-spec/${"b".repeat(64)}.json`], diagnostics: [], attacker_nonce: "bypass" };
    expect(() => mod.refreshEvolutionSnapshot({ storageRoot: root(), project: "Demo", attemptId: "unknown-proof-field", inventory: { observations: [observation("version")], consumer_proofs: [proof] }, now: "2026-08-31T00:00:00Z" })).toThrow(/consumer_scan_proof schema invalid/);
  });

  it("does not treat symlinked stage outcome outputs outside the task as complete proof", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const outsideRoot = root();
    const taskId = "task-symlink-output";
    const taskRoot = join(storageRoot, "Projects/Demo/tasks", taskId);
    const outputRoot = join(taskRoot, "quality/evidence");
    mkdirSync(outputRoot, { recursive: true });
    const externalOutput = join(outsideRoot, "outside-output.md");
    const externalEvidence = join(outsideRoot, "outside-evidence.md");
    writeFileSync(externalOutput, "outside output\n");
    writeFileSync(externalEvidence, "outside evidence\n");
    symlinkSync(externalOutput, join(outputRoot, "evil-output.md"));
    symlinkSync(externalEvidence, join(outputRoot, "evil-evidence.md"));

    const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
    const sourceRefs = [];
    const registered = [];
    for (const stage of stages) {
      const stageDirectory = join(taskRoot, "quality/evidence/stage-outcomes", stage);
      mkdirSync(stageDirectory, { recursive: true });
      const value = {
        schema_version: "workflowhub-stage-outcomes.v1",
        task_id: taskId,
        stage,
        step_outcomes: [{
          step_slug: `${stage}-step`,
          input_refs: [],
          output_refs: ["quality/evidence/evil-output.md"],
          evidence_refs: [{ ref: "quality/evidence/evil-evidence.md" }],
        }],
        skill_outcomes: [],
      };
      const raw = `${JSON.stringify(value)}\n`;
      const filename = `${createHash("sha256").update(raw).digest("hex")}.json`;
      writeFileSync(join(stageDirectory, filename), raw);
      const sourceRef = `quality/evidence/stage-outcomes/${stage}/${filename}`;
      sourceRefs.push(sourceRef);
      registered.push(
        { ref: "quality/evidence/evil-output.md", source: { stage, subject_kind: "step", subject_id: `${stage}-step` }, consumer_count: 0, freshness: "current" },
        { ref: "quality/evidence/evil-evidence.md", source: { stage, subject_kind: "step", subject_id: `${stage}-step` }, consumer_count: 0, freshness: "current" },
      );
    }
    const proof = {
      schema_version: "consumer-scan-proof.v1",
      project: "Demo",
      task_id: taskId,
      status: "complete",
      coverage_status: "complete",
      zero_consumption: true,
      scope: "all-current-stage-outcome-files",
      stage_count: stages.length,
      outcome_file_count: sourceRefs.length,
      subject_count: stages.length,
      expected_stage_set: stages,
      scanned_stage_set: stages,
      scanned_at: "2026-08-31T00:00:00Z",
      scope_revision: createHash("sha256").update(sourceRefs.map((ref) => ref.slice("quality/evidence/stage-outcomes/".length)).sort().join("\n")).digest("hex"),
      registered_output_refs: registered,
      source_subject: "tools/cli/derive-consumption-edges.mjs",
      source_refs: sourceRefs,
      diagnostics: [],
    };
    const result = mod.refreshEvolutionSnapshot({
      storageRoot,
      project: "Demo",
      attemptId: "symlink-output",
      now: "2026-08-31T00:00:00Z",
      inventory: { project: "Demo", observations: [observation("symlink-output")], consumer_proofs: [proof] },
    });
    expect(result).toMatchObject({ status: "ok", records: [{ tier: "reference_only", evidence_status: "unknown", machine_signals: { zero_consumption: "unknown" } }] });
    expect(readFileSync(externalOutput, "utf8")).toBe("outside output\n");
    expect(readFileSync(externalEvidence, "utf8")).toBe("outside evidence\n");
  });

  it("validates the task-level consumer proof shape and rejects the retired stage_set shape", async () => {
    const mod = await loadModule();
    const stages = ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"];
    const proof = { schema_version: "consumer-scan-proof.v1", project: "Demo", task_id: "task-1", coverage_status: "complete", zero_consumption: true, expected_stage_set: stages, scanned_stage_set: stages, scanned_at: "2026-08-31T00:00:00Z", scope_revision: "a".repeat(64), registered_output_refs: [{ ref: "quality/evidence/out.md", source: { stage: "build-spec", subject_kind: "step", subject_id: "spec-clarify" }, consumer_count: 0, freshness: "current" }], source_subject: "tools/cli/derive-consumption-edges.mjs", source_refs: [`quality/evidence/stage-outcomes/build-spec/${"b".repeat(64)}.json`], diagnostics: [] };
    expect(() => mod.validateWorkflowEvolutionDefinition("consumer_scan_proof", proof)).not.toThrow();
    expect(() => mod.validateWorkflowEvolutionDefinition("consumer_scan_proof", { ...proof, stage_set: stages })).toThrow(/schema invalid/);
  });

  it("binds quality tax to caller time and conservative sample/confidence states", async () => {
    const mod = await loadModule();
    const result = mod?.computeQualityTaxProjection?.({
      inventory: { project: "Demo" }, asOf: "2026-08-31T00:00:00Z", interventions: [
        { project: "Demo", task_id: "t1", confirmation_ref: "c1", intervention_stage: "build-code", occurred_at: "2026-08-30T00:00:00Z", primary_attribution_stage: "upstream_omission:build-plan" },
        { project: "Demo", task_id: "t2", confirmation_ref: "c2", intervention_stage: "build-code", occurred_at: "2026-08-29T00:00:00Z", primary_attribution_stage: "free text" },
      ], stageManifest: { stages: ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"] },
    });
    expect(result?.status).toBe("unavailable");
    expect(result?.generatedAt ?? result?.generated_at).toBe("2026-08-31T00:00:00Z");
    expect(result?.sampleStatus ?? result?.sample_status).toBe("insufficient_samples");
    expect(result?.confidence).toBe("unavailable");
    expect(result?.unknownCount ?? result?.unknown_count).toBe(0);
  });

  it.each([
    ["missing", (item) => ({ ...item, confirmation_ref: `quality/confirmations/${"f".repeat(64)}.json` })],
    ["hash", (item) => ({ ...item, confirmation_ref: `quality/confirmations/${"0".repeat(64)}.json` })],
    ["schema", (item) => ({ ...item, _invalid_schema: true })],
    ["step", (item) => ({ ...item, step_slug: "other-step" })],
  ])("keeps %s confirmation out of the quality-tax denominator", async (kind, mutate) => {
    const mod = await loadModule();
    const storageRoot = root();
    const base = { project: "Demo", task_id: `tax-${kind}`, intervention_stage: "build-code", step_slug: "build-code-step", occurred_at: "2026-08-30T00:00:00Z", primary_attribution_stage: "upstream_omission:build-plan" };
    const authenticated = authenticateTaxItem(storageRoot, base);
    if (kind === "schema") {
      const path = join(storageRoot, "Projects", "Demo", "tasks", authenticated.task_id, authenticated.confirmation_ref);
      const value = JSON.parse(readFileSync(path, "utf8")); value.schema_version = "not-a-confirmation";
      const raw = `${JSON.stringify(value, null, 2)}\n`; writeFileSync(path, raw);
      const digest = authenticated.confirmation_ref.slice("quality/confirmations/".length, -".json".length);
      expect(createHash("sha256").update(raw).digest("hex")).not.toBe(digest);
    }
    const item = mutate(authenticated);
    const result = mod.computeQualityTaxProjection({ storageRoot, inventory: { project: "Demo" }, asOf: "2026-08-31T00:00:00Z", interventions: [item] });
    expect(result).toMatchObject({ status: "unavailable", sample_count: 0, ratio: null, confidence: "unavailable" });
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

  it("fails closed when a batch commit rewrites its begin attempt identity", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    expect(mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "attempt-a", inventory: { project: "Demo", observations: [] }, now: "2026-08-31T00:00:00Z" }).status).toBe("ok");
    const ledger = candidateLedger(storageRoot);
    const records = readFileSync(ledger, "utf8").trim().split("\n").map((line) => JSON.parse(line));
    records.at(-1).attempt_id = "forged-attempt";
    writeFileSync(ledger, `${records.map((record) => JSON.stringify(record)).join("\n")}\n`);
    expect(mod.readCurrentEvolutionProjection({ storageRoot, project: "Demo" })).toMatchObject({ status: "failed" });
    expect(mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "attempt-a", inventory: { project: "Demo", observations: [] }, now: "2026-09-01T00:00:00Z" })).toMatchObject({ status: "failed" });
  });

  it("rejects self-hashed ledger rows with forged schemas or producer authority", async () => {
    const mod = await loadModule();
    for (const attack of ["row-schema", "producer"]) {
      const storageRoot = root();
      expect(mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: `attempt-${attack}`, inventory: { project: "Demo", observations: [] }, now: "2026-08-31T00:00:00Z" }).status).toBe("ok");
      const ledger = candidateLedger(storageRoot);
      const records = readFileSync(ledger, "utf8").trim().split("\n").map((line) => JSON.parse(line));
      if (attack === "row-schema") {
        records[1].schema_version = "forged-evolution.v0";
        records.at(-1).content_hash = createHash("sha256").update(canonical(records.slice(1, -1))).digest("hex");
      } else {
        records.at(-1).producer_identity = { ref: "attacker", sha256: "0".repeat(64) };
      }
      writeFileSync(ledger, `${records.map((record) => JSON.stringify(record)).join("\n")}\n`);
      expect(mod.readCurrentEvolutionProjection({ storageRoot, project: "Demo" })).toMatchObject({ status: "failed" });
    }
  });

  it("rejects a candidate whose content changed without its derived record identity", async () => {
    const mod = await loadModule(); const storageRoot = root();
    expect(mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "candidate-tamper", inventory: { project: "Demo", observations: [observation("tamper")] }, now: "2026-08-31T00:00:00Z" }).status).toBe("ok");
    const ledger = candidateLedger(storageRoot); const records = readFileSync(ledger, "utf8").trim().split("\n").map((line) => JSON.parse(line));
    records[1].tier = records[1].tier === "action_suggested" ? "reference_only" : "action_suggested";
    records.at(-1).content_hash = createHash("sha256").update(canonical(records.slice(1, -1))).digest("hex");
    writeFileSync(ledger, `${records.map((record) => JSON.stringify(record)).join("\n")}\n`);
    expect(mod.readCurrentEvolutionProjection({ storageRoot, project: "Demo" })).toMatchObject({ status: "failed" });
  });

  it("refuses to follow an evolution candidate ledger symlink outside storage", async () => {
    const mod = await loadModule();
    const storageRoot = root(); const outside = root();
    const projectRoot = join(storageRoot, "Projects/Demo"); mkdirSync(projectRoot, { recursive: true });
    const externalLedger = join(outside, "outside-ledger.jsonl"); writeFileSync(externalLedger, "outside\n");
    symlinkSync(externalLedger, candidateLedger(storageRoot));
    expect(mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "symlink", inventory: { project: "Demo", observations: [] }, now: "2026-08-31T00:00:00Z" })).toMatchObject({ status: "failed" });
    expect(readFileSync(externalLedger, "utf8")).toBe("outside\n");
  });

  it("refuses dangling ledger and Projects symlinks before any external write", async () => {
    const mod = await loadModule();
    const danglingRoot = root(); const outside = root(); const danglingProject = join(danglingRoot, "Projects/Demo"); mkdirSync(danglingProject, { recursive: true });
    const missingTarget = join(outside, "missing-ledger.jsonl"); symlinkSync(missingTarget, candidateLedger(danglingRoot));
    expect(mod.refreshEvolutionSnapshot({ storageRoot: danglingRoot, project: "Demo", attemptId: "dangling", inventory: { observations: [] }, now: "2026-08-31T00:00:00Z" })).toMatchObject({ status: "failed" });
    expect(existsSync(missingTarget)).toBe(false);
    const projectsRoot = root(); const externalProjects = join(outside, "external-projects"); mkdirSync(externalProjects, { recursive: true }); symlinkSync(externalProjects, join(projectsRoot, "Projects"));
    expect(() => mod.refreshEvolutionSnapshot({ storageRoot: projectsRoot, project: "Demo", attemptId: "projects-link", inventory: { observations: [] }, now: "2026-08-31T00:00:00Z" })).toThrow(/Projects root must not be a symlink/);
    expect(existsSync(join(externalProjects, "Demo/evolution-candidates.jsonl"))).toBe(false);
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
    expect(abort).toMatchObject({ abandoned_start_offset: committedPrefix.length, observed_suffix_length: torn.length, publication_generation: 2, reason: "terminal_uncommitted_suffix" });
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

  it.each([
    ["batch id", { batch_id: "forged-batch", publication_generation: 2 }],
    ["publication generation", { batch_id: "recovery-batch", publication_generation: 99 }],
  ])("binds an authenticated abort after a torn row to the open begin %s", async (_label, override) => {
    const mod = await loadModule(); const storageRoot = root();
    const first = mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "a1", inventory: { project: "Demo", observations: [] }, now: "2026-08-31T00:00:00Z" });
    const ledger = candidateLedger(storageRoot); const committedPrefix = readFileSync(ledger);
    const begin = { schema_version: "workflow-evolution.v1", record_kind: "batch_begin", batch_id: "recovery-batch", project: "Demo", attempt_id: "recovery-attempt", snapshot_content_id: first.snapshot_content_id, snapshot_id: "recovery-snapshot", publication_generation: 2 };
    const torn = Buffer.from('{"record_kind":"candidate"');
    const abandonedSuffix = Buffer.concat([Buffer.from(`${JSON.stringify(begin)}\n`), torn, Buffer.from("\n")]);
    const abort = { schema_version: "workflow-evolution.v1", record_kind: "batch_abort", ...override, reason: "torn", last_committed_prefix_hash: createHash("sha256").update(committedPrefix).digest("hex"), abandoned_start_offset: committedPrefix.length, observed_suffix_length: abandonedSuffix.length, observed_suffix_hash: createHash("sha256").update(abandonedSuffix).digest("hex") };
    appendFileSync(ledger, Buffer.concat([abandonedSuffix, Buffer.from(`${JSON.stringify(abort)}\n`)]));
    const before = readFileSync(ledger);
    const result = mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "a2", inventory: { project: "Demo", observations: [] }, now: "2026-09-01T00:00:00Z" });
    expect(result).toMatchObject({ status: "failed", error: { code: "failed" } });
    expect(readFileSync(ledger)).toEqual(before);
    expect(first.status).toBe("ok");
  });

  it.each([
    ["wrong schema", { schema_version: "forged.v1", publication_generation: 2 }],
    ["wrong generation", { schema_version: "workflow-evolution.v1", publication_generation: 99 }],
  ])("rejects an authenticated candidate abort with %s", async (_label, override) => {
    const mod = await loadModule(); const storageRoot = root();
    const first = mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "a1", inventory: { project: "Demo", observations: [] }, now: "2026-08-31T00:00:00Z" });
    const ledger = candidateLedger(storageRoot); const prefix = readFileSync(ledger); const torn = Buffer.from('{"record_kind":"batch_begin"');
    const abort = { ...override, record_kind: "batch_abort", batch_id: "torn", reason: "torn", last_committed_prefix_hash: createHash("sha256").update(prefix).digest("hex"), abandoned_start_offset: prefix.length, observed_suffix_length: torn.length, observed_suffix_hash: createHash("sha256").update(torn).digest("hex") };
    appendFileSync(ledger, Buffer.concat([torn, Buffer.from(`\n${JSON.stringify(abort)}\n`)])); const before = readFileSync(ledger);
    const result = mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "a2", inventory: { project: "Demo", observations: [] }, now: "2026-09-01T00:00:00Z" });
    expect(result).toMatchObject({ status: "failed", error: { code: "failed" } }); expect(readFileSync(ledger)).toEqual(before); expect(first.status).toBe("ok");
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

  it("holds the project guard for the writer lifetime and blocks manual recovery without writes", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const first = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "writer-attempt", bootId: "old-boot", sessionEpoch: "old-session" });
    const lockPath = first.lockHandle.path;
    const expired = { ...JSON.parse(readFileSync(lockPath, "utf8")), pid: 2147483647, acquired_monotonic_ms: 0, lease_deadline_monotonic_ms: 1 };
    writeFileSync(lockPath, `${JSON.stringify(expired)}\n`);
    const before = readFileSync(lockPath);
    const recovery = {
      schema_version: "manual-recovery.v1",
      current_lock_sha256: createHash("sha256").update(before).digest("hex"),
      old_boot_id: "old-boot",
      new_boot_id: "new-boot",
      operator_identity: "operator@example.test",
      issued_at: "2026-08-31T00:00:00Z",
      nonce: "writer-guard-recovery",
      confirmation_ref: "confirmation:recovery",
      confirmation_sha256: "d".repeat(64),
    };
    const blocked = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "recovery-attempt", bootId: "new-boot", sessionEpoch: "new-session", manualRecovery: recovery });
    expect(blocked).toMatchObject({ status: "conflict", error: { code: "conflict" } });
    expect(readFileSync(lockPath)).toEqual(before);
    expect(first.release()).toEqual({ status: "ok" });
  });

  it("uses the current-lock recovery authority to reclaim a crashed writer guard", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const first = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "crashed-attempt", bootId: "old-boot", sessionEpoch: "old-session" });
    const lockPath = first.lockHandle.path;
    const guardPath = join(dirname(lockPath), ".workflowhub-evolution.guard");
    const lockValue = JSON.parse(readFileSync(lockPath, "utf8"));
    const expiredLock = { ...lockValue, pid: 2147483647, acquired_monotonic_ms: 0, lease_deadline_monotonic_ms: 1 };
    writeFileSync(lockPath, `${JSON.stringify(expiredLock)}\n`);
    const before = readFileSync(lockPath);
    const staleGuard = { ...JSON.parse(readFileSync(guardPath, "utf8")), pid: 2147483647, acquired_monotonic_ms: 0, lease_deadline_monotonic_ms: 1 };
    writeFileSync(guardPath, `${JSON.stringify(staleGuard)}\n`);
    const guardBeforeRecovery = readFileSync(guardPath);
    const blocked = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "unauthorized-recovery", bootId: "new-boot", sessionEpoch: "new-session" });
    expect(blocked).toMatchObject({ status: "conflict", error: { code: "conflict" } });
    expect(readFileSync(lockPath)).toEqual(before);
    expect(readFileSync(guardPath)).toEqual(guardBeforeRecovery);
    expect(existsSync(`${lockPath}.tombstone-unauthorized-recovery-${createHash("sha256").update(before).digest("hex")}`)).toBe(false);
    const recovery = {
      schema_version: "manual-recovery.v1",
      current_lock_sha256: createHash("sha256").update(before).digest("hex"),
      old_boot_id: "old-boot",
      new_boot_id: "new-boot",
      operator_identity: "operator@example.test",
      issued_at: "2026-08-31T00:00:00Z",
      nonce: "crashed-writer-recovery",
      confirmation_ref: "confirmation:recovery",
      confirmation_sha256: "e".repeat(64),
    };
    const recovered = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "recovered-attempt", bootId: "new-boot", sessionEpoch: "new-session", manualRecovery: recovery });
    expect(recovered).toMatchObject({ status: "ok", project: "Demo", lockHandle: { attemptId: "recovered-attempt" } });
    expect(JSON.parse(readFileSync(lockPath, "utf8"))).toMatchObject({ attempt_id: "recovered-attempt", boot_id: "new-boot", session_epoch: "new-session" });
    expect(existsSync(`${lockPath}.tombstone-${recovery.nonce}-${recovery.current_lock_sha256}`)).toBe(true);
    expect(JSON.parse(readFileSync(guardPath, "utf8"))).toMatchObject({ schema_version: "workflowhub-project-guard.v1", pid: process.pid });
    expect(recovered.release()).toEqual({ status: "ok" });
  });

  it("allows one recovery to claim crashed writer guard state under contention", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const first = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "crashed-attempt", bootId: "old-boot", sessionEpoch: "old-session" });
    const lockPath = first.lockHandle.path;
    const guardPath = join(dirname(lockPath), ".workflowhub-evolution.guard");
    const lockValue = JSON.parse(readFileSync(lockPath, "utf8"));
    writeFileSync(lockPath, `${JSON.stringify({ ...lockValue, pid: 2147483647, acquired_monotonic_ms: 0, lease_deadline_monotonic_ms: 1 })}\n`);
    const before = readFileSync(lockPath);
    writeFileSync(guardPath, `${JSON.stringify({ ...JSON.parse(readFileSync(guardPath, "utf8")), pid: 2147483647, acquired_monotonic_ms: 0, lease_deadline_monotonic_ms: 1 })}\n`);
    const recovery = {
      schema_version: "manual-recovery.v1",
      current_lock_sha256: createHash("sha256").update(before).digest("hex"),
      old_boot_id: "old-boot",
      new_boot_id: "new-boot",
      operator_identity: "operator@example.test",
      issued_at: "2026-08-31T00:00:00Z",
      nonce: "crashed-writer-concurrent-recovery",
      confirmation_ref: "confirmation:recovery",
      confirmation_sha256: "f".repeat(64),
    };
    const script = `import { acquireProjectLock } from ${JSON.stringify(moduleUrl.href)};
const result = acquireProjectLock({ storageRoot: process.argv[1], project: "Demo", attemptId: process.argv[2], bootId: "new-boot", sessionEpoch: "new-session", manualRecovery: JSON.parse(process.argv[3]) });
if (result.status === "ok") { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100); result.release(); }
console.log(JSON.stringify({ status: result.status, error: result.error ?? null }));`;
    const run = (index) => new Promise((done) => {
      const child = spawn(process.execPath, ["--input-type=module", "-e", script, storageRoot, `crashed-recovery-${index}`, JSON.stringify(recovery)], { cwd: resolve(import.meta.dirname, "../.."), encoding: "utf8" });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      child.on("close", (status) => done({ status, stdout, stderr }));
    });
    const results = await Promise.all(Array.from({ length: 16 }, (_value, index) => run(index)));
    expect(results.every((result) => result.status === 0), results.map((result) => result.stderr).join("\n")).toBe(true);
    const statuses = results.map((result) => JSON.parse(result.stdout).status);
    expect(statuses.filter((status) => status === "ok")).toHaveLength(1);
    expect(statuses.every((status) => ["ok", "conflict", "replayed_recovery"].includes(status)), statuses.join(",")).toBe(true);
    expect(existsSync(guardPath)).toBe(false);
    expect(existsSync(lockPath)).toBe(false);
    expect(existsSync(`${lockPath}.tombstone-${recovery.nonce}-${recovery.current_lock_sha256}`)).toBe(true);
  }, 30000);

  it("fails closed when transition lock lease identity is missing, invalid, or expired", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const refreshed = mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "assert-lock-snapshot", inventory: { project: "Demo", observations: [observation("assert-lock")] }, now: "2026-08-31T00:00:00Z" });
    const target = refreshed.records[0];
    const lock = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "assert-lock-transition" });
    const lockPath = lock.lockHandle.path;
    const original = JSON.parse(readFileSync(lockPath, "utf8"));
    const before = readFileSync(candidateLedger(storageRoot));
    const malformed = [
      { lease_deadline_monotonic_ms: null },
      { lease_deadline_monotonic_ms: "later" },
      { lease_deadline_monotonic_ms: 0 },
      { remove: true },
    ];
    for (const override of malformed) {
      const value = { ...original, ...override };
      if (override.remove) delete value.lease_deadline_monotonic_ms;
      writeFileSync(lockPath, `${JSON.stringify(value)}\n`);
      const result = mod.recordCandidateTransition({
        storageRoot,
        project: "Demo",
        attemptId: "assert-lock-transition",
        currentSnapshotId: refreshed.snapshot_id,
        candidateId: target.candidate_id,
        candidateRecordId: target.candidate_record_id,
        expectedRevision: 1,
        currentSourceIdentities: target.source_identities,
        currentMaterialIdentities: target.material_identities,
        humanConfirmation: { ref: target.human_confirmation_ref, sha256: target.human_confirmation_sha256 },
        lifecycleStatus: "deferred",
        lockAuthority: lock,
      });
      expect(result).toMatchObject({ status: "stale_source", error: { code: "stale_source" } });
      expect(readFileSync(candidateLedger(storageRoot))).toEqual(before);
    }
    expect(lock.release()).toEqual({ status: "stale_source" });
  });

  it("uses a non-reusable fencing token and an old release cannot remove a replacement lock", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const first = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "fence-a", ownerToken: "reused-owner" });
    expect(first.status).toBe("ok");
    const firstFencing = first.fencingToken;
    expect(first.release()).toEqual({ status: "ok" });
    const second = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "fence-b", ownerToken: "reused-owner" });
    expect(second.status).toBe("ok");
    expect(second.fencingToken).not.toBe(firstFencing);
    expect(() => mod.assertProjectLockCurrent({ ...second, leaseIdentity: { boot_id: "forged-boot", session_epoch: second.leaseIdentity.session_epoch } })).toThrow(/stale|unavailable|disagree/);
    expect(first.release()).toEqual({ status: "stale_source" });
    expect(existsSync(second.lockHandle.path)).toBe(true);
    expect(second.release()).toEqual({ status: "ok" });
  });

  it("rejects cross-boot recovery while the lock lease is still valid without changing the lock", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const first = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "old-attempt", bootId: "old-boot", sessionEpoch: "old-session" });
    const lockPath = first.lockHandle.path;
    const lockValue = JSON.parse(readFileSync(lockPath, "utf8"));
    const current = { ...lockValue, acquired_monotonic_ms: 0, lease_deadline_monotonic_ms: Number.MAX_SAFE_INTEGER };
    writeFileSync(lockPath, `${JSON.stringify(current)}\n`);
    const before = readFileSync(lockPath);
    const recovery = {
      schema_version: "manual-recovery.v1",
      current_lock_sha256: createHash("sha256").update(before).digest("hex"),
      old_boot_id: "old-boot",
      new_boot_id: "new-boot",
      operator_identity: "operator@example.test",
      issued_at: "2026-08-31T00:00:00Z",
      nonce: "recovery-nonce",
      confirmation_ref: "confirmation:recovery",
      confirmation_sha256: "a".repeat(64),
    };
    const second = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "new-attempt", bootId: "new-boot", sessionEpoch: "new-session", manualRecovery: recovery });
    expect(second).toMatchObject({ status: "conflict", error: { code: "conflict" } });
    expect(readFileSync(lockPath)).toEqual(before);
    expect(existsSync(`${lockPath}.tombstone-${recovery.nonce}-${recovery.current_lock_sha256}`)).toBe(false);
    expect(first.release()).toEqual({ status: "ok" });
  });

  it("fails closed without creating a project when manual recovery has no current lock", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const recovery = {
      schema_version: "manual-recovery.v1",
      current_lock_sha256: "a".repeat(64),
      old_boot_id: "old-boot",
      new_boot_id: "new-boot",
      operator_identity: "operator@example.test",
      issued_at: "2026-08-31T00:00:00Z",
      nonce: "missing-current-lock",
      confirmation_ref: "confirmation:recovery",
      confirmation_sha256: "b".repeat(64),
    };
    const result = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "new-attempt", bootId: "new-boot", sessionEpoch: "new-session", manualRecovery: recovery });
    expect(result).toMatchObject({ status: "stale_source", error: { code: "stale_source" } });
    expect(readdirSync(storageRoot)).toEqual([]);
  });

  it("allows at most one concurrent recovery to reclaim the same expired lock", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const first = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "old-attempt", bootId: "old-boot", sessionEpoch: "old-session" });
    const lockPath = first.lockHandle.path;
    const lockValue = JSON.parse(readFileSync(lockPath, "utf8"));
    expect(first.release()).toEqual({ status: "ok" });
    const expired = { ...lockValue, pid: 2147483647, acquired_monotonic_ms: 0, lease_deadline_monotonic_ms: 1 };
    writeFileSync(lockPath, `${JSON.stringify(expired)}\n`);
    const before = readFileSync(lockPath);
    const recovery = {
      schema_version: "manual-recovery.v1",
      current_lock_sha256: createHash("sha256").update(before).digest("hex"),
      old_boot_id: "old-boot",
      new_boot_id: "new-boot",
      operator_identity: "operator@example.test",
      issued_at: "2026-08-31T00:00:00Z",
      nonce: "concurrent-recovery",
      confirmation_ref: "confirmation:recovery",
      confirmation_sha256: "b".repeat(64),
    };
    const script = `import { acquireProjectLock } from ${JSON.stringify(moduleUrl.href)};
const result = acquireProjectLock({ storageRoot: process.argv[1], project: "Demo", attemptId: process.argv[2], bootId: "new-boot", sessionEpoch: "new-session", manualRecovery: JSON.parse(process.argv[3]) });
if (result.status === "ok") { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100); result.release(); }
console.log(JSON.stringify({ status: result.status, error: result.error ?? null }));`;
    const run = (index) => new Promise((done) => {
      const child = spawn(process.execPath, ["--input-type=module", "-e", script, storageRoot, `recovery-${index}`, JSON.stringify(recovery)], { cwd: resolve(import.meta.dirname, "../.."), encoding: "utf8" });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      child.on("close", (status) => done({ status, stdout, stderr }));
    });
    const results = await Promise.all(Array.from({ length: 16 }, (_value, index) => run(index)));
    expect(results.every((result) => result.status === 0), results.map((result) => result.stderr).join("\n")).toBe(true);
    const statuses = results.map((result) => JSON.parse(result.stdout).status);
    expect(statuses.filter((status) => status === "ok")).toHaveLength(1);
    expect(statuses.every((status) => ["ok", "conflict", "replayed_recovery"].includes(status)), statuses.join(",")).toBe(true);
  }, 30000);

  it("fails closed when a stale guard reclaim reservation is already present", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const first = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "guard-reservation-seed" });
    const lockPath = first.lockHandle.path;
    expect(first.release()).toEqual({ status: "ok" });
    const guardPath = join(dirname(lockPath), ".workflowhub-evolution.guard");
    const reclaimPath = `${guardPath}.reclaim`;
    const guardBefore = `${JSON.stringify({ schema_version: "workflowhub-project-guard.v1", owner_token: "stale-guard", pid: 2147483647, acquired_monotonic_ms: 0, lease_deadline_monotonic_ms: 1 })}\n`;
    const reclaimBefore = `${JSON.stringify({ schema_version: "workflowhub-project-guard-reclaim.v1", owner_token: "stale-reclaim", pid: 2147483647, acquired_monotonic_ms: 0, lease_deadline_monotonic_ms: 1 })}\n`;
    writeFileSync(guardPath, guardBefore);
    writeFileSync(reclaimPath, reclaimBefore);
    const script = `import { acquireProjectLock } from ${JSON.stringify(moduleUrl.href)};
const result = acquireProjectLock({ storageRoot: process.argv[1], project: "Demo", attemptId: process.argv[2] });
console.log(JSON.stringify({ status: result.status, error: result.error ?? null }));`;
    const run = (index) => new Promise((done) => {
      const child = spawn(process.execPath, ["--input-type=module", "-e", script, storageRoot, `guard-reservation-blocked-${index}`], { cwd: resolve(import.meta.dirname, "../.."), encoding: "utf8" });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      child.on("close", (status) => done({ status, stdout, stderr }));
    });
    const results = await Promise.all(Array.from({ length: 16 }, (_value, index) => run(index)));
    expect(results.every((result) => result.status === 0), results.map((result) => result.stderr).join("\n")).toBe(true);
    expect(results.map((result) => JSON.parse(result.stdout).status).every((status) => status === "conflict")).toBe(true);
    expect(readFileSync(guardPath, "utf8")).toBe(guardBefore);
    expect(readFileSync(reclaimPath, "utf8")).toBe(reclaimBefore);
    expect(existsSync(lockPath)).toBe(false);
  });

  it("rejects a replayed recovery while the lock path is between reclaim and recreation", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const first = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "old-attempt", bootId: "old-boot", sessionEpoch: "old-session" });
    const lockPath = first.lockHandle.path;
    const expired = { ...JSON.parse(readFileSync(lockPath, "utf8")), pid: 2147483647, acquired_monotonic_ms: 0, lease_deadline_monotonic_ms: 1 };
    expect(first.release()).toEqual({ status: "ok" });
    writeFileSync(lockPath, `${JSON.stringify(expired)}\n`);
    const before = readFileSync(lockPath);
    const recovery = {
      schema_version: "manual-recovery.v1",
      current_lock_sha256: createHash("sha256").update(before).digest("hex"),
      old_boot_id: "old-boot",
      new_boot_id: "new-boot",
      operator_identity: "operator@example.test",
      issued_at: "2026-08-31T00:00:00Z",
      nonce: "gap-recovery",
      confirmation_ref: "confirmation:recovery",
      confirmation_sha256: "c".repeat(64),
    };
    const tombstone = `${lockPath}.tombstone-${recovery.nonce}-${recovery.current_lock_sha256}`;
    writeFileSync(tombstone, before);
    rmSync(lockPath);
    const result = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "new-attempt", bootId: "new-boot", sessionEpoch: "new-session", manualRecovery: recovery });
    expect(result).toMatchObject({ status: "replayed_recovery", error: { code: "replayed_recovery" } });
    expect(readFileSync(tombstone)).toEqual(before);
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

  it("deterministically merges the full observation field set after identity de-duplication", async () => {
    const mod = await loadModule();
    const make = (taskId, confirmationRef, occurredAt, severity, confidence, priority) => ({
      ...observation("same"), task_id: taskId, confirmation_ref: confirmationRef, occurred_at: occurredAt,
      intervention_payload: { reason: "same-group" }, classification: "simplify", severity, confidence,
      priority_score: priority, evidence_status: "partial", validation_status: "unverified",
      related_targets: [{ project_id: "Demo", target_kind: "surface", target_id: "runtime", target_version: "1", authority_ref: "docs/architecture/move-map.json", authority_sha256: "a".repeat(64) }],
      evidence_refs: [{ ref: `quality/evidence/${taskId}.json`, sha256: "b".repeat(64) }],
    });
    const observations = [
      make("task-a", "confirmation-a", "2026-08-01T00:00:00Z", "low", "high", 2),
      make("task-b", "confirmation-b", "2026-08-10T00:00:00Z", "high", "low", 7),
      make("task-a", "confirmation-c", "2026-08-05T00:00:00Z", "medium", "medium", 4),
    ];
    const first = mod.refreshEvolutionSnapshot({ storageRoot: root(), project: "Demo", attemptId: "merge-a", inventory: { observations }, now: "2026-08-31T00:00:00Z" });
    const second = mod.refreshEvolutionSnapshot({ storageRoot: root(), project: "Demo", attemptId: "merge-a", inventory: { observations: [...observations].reverse() }, now: "2026-08-31T00:00:00Z" });
    expect(first.status).toBe("ok"); expect(second.status).toBe("ok");
    const select = (record) => ({ ...record, snapshot_id: undefined, snapshot_content_id: undefined, batch_id: undefined, record_id: undefined, candidate_record_id: undefined });
    expect(canonical(select(first.records[0]))).toBe(canonical(select(second.records[0])));
    expect(first.records[0]).toMatchObject({ frequency: 2, first_seen: "2026-08-01T00:00:00Z", recent_seen: "2026-08-10T00:00:00Z", severity: "high", confidence: "low", priority_score: 13, evidence_status: "partial", validation_status: "unverified", freshness: "current" });
    expect(first.records[0].source_observations).toHaveLength(3);
    expect(first.records[0].source_observations.map((entry) => entry.observation_id)).toEqual([...first.records[0].source_observations.map((entry) => entry.observation_id)].sort());
    expect(first.records[0].source_refs).toEqual(["quality/evidence/task-a.json", "quality/evidence/task-b.json", "quality/evidence/task-a.json"].filter((value, index, values) => values.indexOf(value) === index).sort());
  });

  it("keeps the strong-signal matrix independent and does not promote weak evidence", async () => {
    const mod = await loadModule();
    const repeated = [observation("repeat-a"), observation("repeat-b")].map((entry, index) => ({ ...entry, task_id: `task-${index + 1}`, confirmation_ref: `confirmation-${index + 1}`, intervention_payload: { reason: "same" } }));
    const strong = mod.refreshEvolutionSnapshot({ storageRoot: root(), project: "Demo", attemptId: "repeat", inventory: { observations: repeated }, now: "2026-08-31T00:00:00Z" });
    expect(strong.records[0]).toMatchObject({ tier: "action_suggested", machine_signals: { repeat_intervention: true } });
    const weakRoot = root();
    const oneTask = [{ ...observation("weak-a"), task_id: "task-one", confirmation_ref: "confirmation-one", intervention_payload: { reason: "same" } }, { ...observation("weak-b"), task_id: "task-one", confirmation_ref: "confirmation-two", intervention_payload: { reason: "same" } }];
    const weak = mod.refreshEvolutionSnapshot({ storageRoot: weakRoot, project: "Demo", attemptId: "weak", inventory: { observations: oneTask }, now: "2026-08-31T00:00:00Z" });
    expect(weak.records[0]).toMatchObject({ tier: "reference_only", machine_signals: { repeat_intervention: false, zero_consumption: "unknown" } });
  });

  it("replays supersede and terminal lifecycle authority without mutating old rows", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const first = mod.refreshEvolutionSnapshot({ storageRoot, project: "Demo", attemptId: "life-a", inventory: { observations: [observation("life")] }, now: "2026-08-31T00:00:00Z" });
    const original = first.records[0];
    const lock = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "life-supersede" });
    const superseded = mod.recordCandidateTransition({ storageRoot, project: "Demo", attemptId: "life-supersede", currentSnapshotId: first.snapshot_id, candidateId: original.candidate_id, candidateRecordId: original.candidate_record_id, expectedRevision: 1, currentSourceIdentities: original.source_identities, currentMaterialIdentities: original.material_identities, humanConfirmation: { ref: original.human_confirmation_ref, sha256: original.human_confirmation_sha256 }, lifecycleStatus: "superseded", lockAuthority: lock });
    expect(superseded).toMatchObject({ status: "ok", revision: 2 }); expect(lock.release()).toMatchObject({ status: "ok" });
    const projection = mod.readCurrentEvolutionProjection({ storageRoot, project: "Demo" });
    expect(projection.candidates.filter((entry) => entry.row_status === "active")).toHaveLength(1);
    expect(projection.candidates.find((entry) => entry.row_status === "historical")).toMatchObject({ candidate_id: original.candidate_id, revision: 1, lifecycle_status: "superseded" });
    const active = projection.candidates.find((entry) => entry.row_status === "active");
    const terminalLock = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "life-terminal" });
    expect(mod.recordCandidateTransition({ storageRoot, project: "Demo", attemptId: "life-terminal", currentSnapshotId: superseded.snapshot_id, candidateId: active.candidate_id, candidateRecordId: active.candidate_record_id, expectedRevision: active.revision, currentSourceIdentities: active.source_identities, currentMaterialIdentities: active.material_identities, humanConfirmation: { ref: active.human_confirmation_ref, sha256: active.human_confirmation_sha256 }, lifecycleStatus: "verified", lockAuthority: terminalLock })).toMatchObject({ status: "ok", revision: 3 });
    terminalLock.release();
    const afterTerminal = mod.readCurrentEvolutionProjection({ storageRoot, project: "Demo" });
    const terminal = afterTerminal.candidates.find((entry) => entry.row_status === "active");
    const staleLock = mod.acquireProjectLock({ storageRoot, project: "Demo", attemptId: "life-invalid" });
    const rejected = mod.recordCandidateTransition({ storageRoot, project: "Demo", attemptId: "life-invalid", currentSnapshotId: afterTerminal.snapshot_id, candidateId: terminal.candidate_id, candidateRecordId: terminal.candidate_record_id, expectedRevision: terminal.revision, currentSourceIdentities: terminal.source_identities, currentMaterialIdentities: terminal.material_identities, humanConfirmation: { ref: terminal.human_confirmation_ref, sha256: terminal.human_confirmation_sha256 }, lifecycleStatus: "superseded", lockAuthority: staleLock });
    expect(rejected).toMatchObject({ status: "failed", error: { code: "failed" } }); expect(staleLock.release()).toMatchObject({ status: "ok" });
  });

  it("computes tax window, identity de-duplication, and exact 4/5/9/10 confidence thresholds", async () => {
    const mod = await loadModule();
    const storageRoot = root();
    const asOf = "2026-08-31T00:00:00Z";
    const make = (index, unknown = false, occurredAt = "2026-08-30T00:00:00Z") => authenticateTaxItem(storageRoot, { project: "Demo", task_id: `tax-task-${index}`, confirmation_ref: `tax-confirmation-${index}`, step_slug: "build-code-step", intervention_stage: "build-code", occurred_at: occurredAt, primary_attribution_stage: unknown ? "free text" : "upstream_omission:build-plan", source_ref: `quality/confirmations/${index}.json` });
    const run = (count, unknownCount = 0) => mod.computeQualityTaxProjection({ storageRoot, inventory: { project: "Demo" }, asOf, interventions: Array.from({ length: count }, (_value, index) => make(index, index < unknownCount)) });
    expect(run(4, 1)).toMatchObject({ sample_count: 4, unknown_count: 1, ratio: null, sample_status: "insufficient_samples", confidence: "unavailable" });
    expect(run(5, 1)).toMatchObject({ sample_count: 5, numerator: 4, unknown_count: 1, ratio: 0.8, sample_status: "sufficient", confidence: "low" });
    expect(run(9, 1).confidence).toBe("low");
    expect(run(10, 0).confidence).toBe("high");
    expect(run(10, 1).confidence).toBe("medium");
    expect(run(10, 2).confidence).toBe("medium");
    expect(run(10, 3).confidence).toBe("low");
    const legacy = authenticateTaxItem(storageRoot, { project: "Demo", task_id: "tax-legacy", confirmation_ref: "tax-confirmation-legacy", step_slug: "build-code-step", intervention_stage: "build-code", occurred_at: "2026-08-30T00:00:00Z", primary_attribution_stage: "upstream_omission:build-plan" }, { legacy: true });
    expect(mod.computeQualityTaxProjection({ storageRoot, inventory: { project: "Demo" }, asOf, interventions: [legacy] })).toMatchObject({ status: "ok", sample_count: 1, denominator: 1 });
    const v2 = authenticateTaxItem(storageRoot, { project: "Demo", task_id: "tax-v2", confirmation_ref: "tax-confirmation-v2", step_slug: "build-code-step", intervention_stage: "build-code", occurred_at: "2026-08-30T00:00:00Z", primary_attribution_stage: "upstream_omission:build-plan" }, { v2: true });
    expect(mod.computeQualityTaxProjection({ storageRoot, inventory: { project: "Demo" }, asOf, interventions: [v2] })).toMatchObject({ status: "ok", sample_count: 1, denominator: 1 });
    const boundary = run(2, 0);
    const withBoundary = mod.computeQualityTaxProjection({ storageRoot, inventory: { project: "Demo" }, asOf, interventions: [...boundary.interventions.map((entry) => ({ ...entry, source_ref: entry.source_ref })), make(100, false, "2026-08-01T00:00:00Z"), make(101, false, "2026-07-31T23:59:59Z")] });
    expect(withBoundary.sample_count).toBe(3);
    const duplicate = make(200); const same = mod.computeQualityTaxProjection({ storageRoot, inventory: { project: "Demo" }, asOf, interventions: [duplicate, structuredClone(duplicate)] });
    expect(same.sample_count).toBe(1);
    expect(mod.computeQualityTaxProjection({ storageRoot, inventory: { project: "Demo" }, asOf, interventions: [duplicate, { ...duplicate, primary_attribution_stage: "free text" }] })).toMatchObject({ status: "unavailable", error: { code: "identity_conflict" } });
  });
});
