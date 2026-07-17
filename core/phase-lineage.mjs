import { createHash } from "node:crypto";
import { assertTaskHandle, assertTaskKernel } from "./task-handle.mjs";
import { hashCanonical } from "./task-snapshot.mjs";

export const PHASE_SEQUENCE = Object.freeze(["phase-0", "p0-a", "p0-b", "p1-a", "p1-b", "p2"]);
function parsed(task, ref) { const raw = task.readRecord(ref); return { raw, value: JSON.parse(raw), hash: createHash("sha256").update(raw).digest("hex"), canonicalHash: hashCanonical(JSON.parse(raw)) }; }

export function validatePhaseLineage(taskCapability, subject) {
  const kernel = assertTaskKernel(taskCapability); const task = kernel.task;
  if (subject?.task_id !== task.identity.taskId) throw new Error("phase subject cross-task identity");
  const index = PHASE_SEQUENCE.indexOf(subject?.phase_id); if (index < 0) throw new Error("unknown phase_id");
  if (index === 0) { if (subject.upstream !== null) throw new Error("phase-0 must not declare upstream"); return true; }
  assertPhaseEligible(kernel, subject.phase_id);
  const previous = PHASE_SEQUENCE[index - 1]; const expectedSubjectRef = `evidence/phases/${previous}/subject.json`; const expectedResultRef = `evidence/phases/${previous}/result.json`;
  const priorSubject = parsed(task, expectedSubjectRef); const priorResult = parsed(task, expectedResultRef);
  const upstream = subject.upstream;
  if (!upstream || upstream.subject_ref !== expectedSubjectRef || upstream.result_ref !== expectedResultRef) throw new Error("phase lineage skip or fork");
  if (upstream.subject_hash !== priorSubject.canonicalHash || upstream.result_hash !== priorResult.canonicalHash) throw new Error("phase lineage hash mismatch");
  if (priorResult.value.phase_id !== previous || priorResult.value.task_id !== task.identity.taskId || priorResult.value.eligibility?.next_phase !== subject.phase_id || priorResult.value.eligibility?.structurally_complete !== true) throw new Error("previous phase result does not authorize next phase");
  if (JSON.stringify(upstream.implementation) !== JSON.stringify(priorSubject.value.implementation) || JSON.stringify(subject.baseline) !== JSON.stringify(priorSubject.value.implementation)) throw new Error("phase implementation snapshot lineage mismatch");
  if (JSON.stringify(subject.release) !== JSON.stringify(priorSubject.value.release)) throw new Error("phase pinned release changed across lineage");
  return true;
}
export function assertPhaseEligible(taskCapability, phaseId) {
  const kernel = assertTaskKernel(taskCapability); const task = assertTaskHandle(kernel.task); const index = PHASE_SEQUENCE.indexOf(phaseId);
  if (index < 0) throw new Error("unknown phase_id"); if (index === 0) return true;
  const previous = PHASE_SEQUENCE[index - 1]; const result = parsed(task, `evidence/phases/${previous}/result.json`).value;
  if (result.eligibility?.structurally_complete !== true || result.eligibility?.next_phase !== phaseId) throw new Error(`${phaseId} is not structurally eligible`);
  if (phaseId === "p0-b") {
    for (const required of ["phase-0", "p0-a"]) {
      const value = parsed(task, `evidence/phases/${required}/result.json`).value;
      if (!value.review?.ref || !value.review?.hash) throw new Error(`p0-b requires canonical ${required} review`);
    }
  }
  return true;
}
