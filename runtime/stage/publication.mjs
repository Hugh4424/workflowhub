import { sha256 } from "../evidence/freshness.mjs";
import { deriveStageCompletion } from "./completion-predicates.mjs";

export const WRITER_FAULT_CONTRACT = Object.freeze({
  material: Object.freeze({
    temp: Object.freeze({ applies: true, reason: "revision bytes use atomic replacement" }),
    fsync: Object.freeze({ applies: true, reason: "revision bytes must be durable before publication" }),
    rename: Object.freeze({ applies: true, reason: "revision replacement is published by rename" }),
    CAS: Object.freeze({ applies: true, reason: "material current revision has one compare-and-swap winner" }),
    current: Object.freeze({ applies: true, reason: "material current pointer is the only mutable writer pointer" }),
  }),
  quality: Object.freeze({
    temp: Object.freeze({ applies: true, reason: "immutable fact bytes use create-only atomic write" }),
    fsync: Object.freeze({ applies: true, reason: "immutable fact bytes must be durable" }),
    rename: Object.freeze({ applies: true, reason: "create-only record publication uses rename" }),
    CAS: Object.freeze({ applies: false, reason: "immutable quality facts have no mutable current pointer" }),
    current: Object.freeze({ applies: false, reason: "immutable quality facts are addressed by content identity only" }),
  }),
  publication: Object.freeze({
    temp: Object.freeze({ applies: true, reason: "immutable publication bytes use create-only atomic write" }),
    fsync: Object.freeze({ applies: true, reason: "immutable publication bytes must be durable" }),
    rename: Object.freeze({ applies: true, reason: "create-only publication record is published by rename" }),
    CAS: Object.freeze({ applies: false, reason: "derived publications have no mutable current pointer" }),
    current: Object.freeze({ applies: false, reason: "derived publications are addressed by content identity only" }),
  }),
});

export function isFormallyAcceptedPublication(publication) {
  const completion = publication?.value?.completion ?? publication?.completion;
  return completion?.formal_acceptance === "accepted"
    && completion?.progression_only !== true
    && completion?.quality_status === "passed";
}

function readOptional(read, ref) {
  try { return read(ref); } catch (error) {
    if (error?.code === "ENOENT") return undefined;
    throw error;
  }
}

export function createPublication({ taskId, stage, materialRevision, qualityFacts, freshness, snapshotTree, read, allowIncompleteQuality = false, progression = null }) {
  const observations = qualityFacts.map((fact, index) => ({
    fact,
    freshness: freshness[index],
    authenticated: freshness[index]?.authenticated === true,
  }));
  const completion = deriveStageCompletion(stage, observations);
  if (completion?.status !== "completed" && !allowIncompleteQuality) throw new Error(`${stage} publication requires derived completion`);
  if (allowIncompleteQuality && (progression?.status !== "completed"
      || progression.authority !== "current-four-materials-and-plan-tasks")) {
    throw new Error(`${stage} progression publication requires current plan/tasks progress`);
  }
  if (!materialRevision?.revision_id || materialRevision.task_id !== taskId) throw new TypeError("publication requires task-bound material revision");
  if (!Array.isArray(qualityFacts) || !Array.isArray(freshness) || qualityFacts.length !== freshness.length) throw new TypeError("publication quality facts/freshness mismatch");
  for (const [index, fact] of qualityFacts.entries()) {
    if (!allowIncompleteQuality && (fact.value.task_id !== taskId || fact.value.stage !== stage
        || fact.value.material_revision !== materialRevision.revision_id
        || fact.value.snapshot_tree !== snapshotTree
        || freshness[index]?.status !== "current")) {
      throw new Error("publication requires fresh task/stage/revision/tree-bound quality facts");
    }
    if (typeof read !== "function" || sha256(read(fact.ref)) !== fact.sha256) throw new Error("publication quality fact canonical bytes mismatch");
  }
  const value = Object.freeze({
    schema_version: "publication.v1",
    task_id: taskId,
    stage,
    material_revision: materialRevision.revision_id,
    quality_fact_refs: qualityFacts.map(({ ref, sha256: hash }) => ({ ref, sha256: hash })),
    completion: allowIncompleteQuality
      ? Object.freeze({
        ...completion,
        status: "completed",
        quality_status: completion.status === "completed" ? "passed" : "incomplete",
        quality_missing: completion.missing,
        progression_authority: progression.authority,
        progression_only: true,
        formal_acceptance: "not_granted",
      })
      : Object.freeze({
        ...completion,
        quality_status: "passed",
        progression_only: false,
        formal_acceptance: "not_granted",
      }),
    snapshot_tree: snapshotTree,
  });
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const digest = sha256(raw);
  return Object.freeze({ value, raw, ref: `publications/${stage}/${digest}.json`, sha256: digest });
}

export function rebuildPublication({ publication, materialRevision, qualityFacts, freshness, read }) {
  return createPublication({
    taskId: publication.task_id,
    stage: publication.stage,
    materialRevision,
    qualityFacts,
    freshness,
    snapshotTree: publication.snapshot_tree,
    allowIncompleteQuality: publication.value?.completion?.progression_only === true,
    progression: publication.value?.completion?.progression_only === true
      ? { status: "completed", authority: publication.value.completion.progression_authority ?? "current-four-materials-and-plan-tasks" }
      : null,
    read,
  });
}

export function publishImmutable({ ref, raw, read, create }) {
  const existing = readOptional(read, ref);
  if (existing === raw) return Object.freeze({ ref, sha256: sha256(raw), idempotent: true });
  if (existing !== undefined) throw new Error(`immutable publication conflict: ${ref}`);
  try { create(ref, raw); } catch (error) {
    const winner = readOptional(read, ref);
    if (error?.code !== "EEXIST" || winner !== raw) throw error;
    return Object.freeze({ ref, sha256: sha256(raw), idempotent: true });
  }
  if (read(ref) !== raw) throw new Error(`publication verification failed: ${ref}`);
  return Object.freeze({ ref, sha256: sha256(raw), idempotent: false });
}

export function publishPublication({ publication, read, create }) {
  if (!publication?.ref || typeof publication.raw !== "string") throw new TypeError("derived publication is required");
  return publishImmutable({ ref: publication.ref, raw: publication.raw, read, create });
}
