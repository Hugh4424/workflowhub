import { sha256 } from "../evidence/freshness.mjs";
import { publishImmutable } from "../stage/publication.mjs";

export const MATERIAL_FILES = Object.freeze(["decision-log.md", "spec.md", "plan.md", "tasks.md"]);

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function binding(value, label) {
  if (!value || typeof value !== "object"
      || typeof value.ref !== "string" || !/^[a-f0-9]{64}$/.test(value.hash ?? "")) {
    throw new TypeError(`${label} ref/hash is required`);
  }
  return Object.freeze({ ref: value.ref, hash: value.hash });
}

export function createMaterialRevision({ taskId, materials, requirements, previous = null, changeSummary, sourceRefs }) {
  if (typeof taskId !== "string" || taskId.trim() === "") throw new TypeError("taskId is required");
  if (!materials || typeof materials !== "object") throw new TypeError("four materials are required");
  if (typeof changeSummary !== "string" || changeSummary.trim() === "") throw new TypeError("changeSummary is required");
  if (!Array.isArray(sourceRefs) || sourceRefs.length === 0) throw new TypeError("sourceRefs are required");
  const requirementsBinding = Object.freeze({
    ledger: binding(requirements?.ledger, "requirements ledger"),
    coverage: binding(requirements?.coverage, "requirements coverage"),
  });
  const hashes = Object.fromEntries(MATERIAL_FILES.map((file) => {
    if (typeof materials[file] !== "string") throw new TypeError(`material ${file} is required`);
    return [file, sha256(materials[file])];
  }));
  const changedFiles = previous === null
    ? [...MATERIAL_FILES]
    : MATERIAL_FILES.filter((file) => previous.hashes?.[file] !== hashes[file]);
  if (previous === null || JSON.stringify(previous.requirements) !== JSON.stringify(requirementsBinding)) {
    changedFiles.push("requirements");
  }
  if (changedFiles.length === 0) return Object.freeze({ idempotent: true, revision: previous });
  const identity = {
    task_id: taskId,
    parent_revision: previous?.revision_id ?? null,
    previous_ref: previous?.revision_ref ?? null,
    previous_hash: previous?.revision_hash ?? null,
    changed_files: changedFiles,
    change_summary: changeSummary,
    source_refs: sourceRefs,
    hashes,
    requirements: requirementsBinding,
  };
  const digest = sha256(canonical(identity));
  const value = Object.freeze({
    schema_version: "task-material-revision.v1",
    ...identity,
    revision_id: `revision-${digest}`,
  });
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  return Object.freeze({
    idempotent: false,
    revision: value,
    revision_ref: `materials/revisions/${digest}.json`,
    revision_hash: sha256(raw),
    raw,
  });
}

export function publishMaterialRevisionRecord({ created, read, create }) {
  if (!created?.revision || created.idempotent || typeof created.ref === "string") {
    if (created?.idempotent) return Object.freeze({ idempotent: true, revision: created.revision });
  }
  if (!created?.revision_ref || typeof created.raw !== "string") throw new TypeError("created material revision is required");
  return publishImmutable({ ref: created.revision_ref, raw: created.raw, read, create });
}
