import { sha256 } from "../evidence/freshness.mjs";
import { deriveStageCompletion } from "./completion-predicates.mjs";

export const WRITER_FAULT_CONTRACT = Object.freeze({
  material: Object.freeze({ temp: true, fsync: true, rename: true, CAS: true, current: true }),
  quality: Object.freeze({ temp: true, fsync: true, rename: true, CAS: false, current: false }),
  publication: Object.freeze({ temp: true, fsync: true, rename: true, CAS: false, current: false }),
});

function readOptional(read, ref) {
  try { return read(ref); } catch (error) {
    if (error?.code === "ENOENT") return undefined;
    throw error;
  }
}

export function createPublication({ taskId, stage, materialRevision, qualityFacts, freshness, snapshotTree, read }) {
  const observations = qualityFacts.map((fact, index) => ({
    fact,
    freshness: freshness[index],
    authenticated: freshness[index]?.authenticated === true,
  }));
  const completion = deriveStageCompletion(stage, observations);
  if (completion?.status !== "completed") throw new Error(`${stage} publication requires derived completion`);
  if (!materialRevision?.revision_id || materialRevision.task_id !== taskId) throw new TypeError("publication requires task-bound material revision");
  if (!Array.isArray(qualityFacts) || !Array.isArray(freshness) || qualityFacts.length !== freshness.length) throw new TypeError("publication quality facts/freshness mismatch");
  for (const [index, fact] of qualityFacts.entries()) {
    if (fact.value.task_id !== taskId || fact.value.stage !== stage
        || fact.value.material_revision !== materialRevision.revision_id
        || fact.value.snapshot_tree !== snapshotTree
        || freshness[index]?.status !== "current") throw new Error("publication requires fresh task/stage/revision/tree-bound quality facts");
    if (typeof read !== "function" || sha256(read(fact.ref)) !== fact.sha256) throw new Error("publication quality fact canonical bytes mismatch");
  }
  const value = Object.freeze({
    schema_version: "publication.v1",
    task_id: taskId,
    stage,
    material_revision: materialRevision.revision_id,
    quality_fact_refs: qualityFacts.map(({ ref, sha256: hash }) => ({ ref, sha256: hash })),
    completion,
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
