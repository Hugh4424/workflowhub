import { posix } from "node:path";
import { Buffer } from "node:buffer";
import { assertTaskHandle } from "../../../core/task-handle.mjs";
import { createCanonicalReviewWriter } from "../../../core/canonical-receipt-writer.mjs";

function safePart(value, label) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9._-]+$/.test(value)) throw new TypeError(`${label} is invalid`);
  return value;
}

function providerFilePart(provider) {
  if (typeof provider !== "string" || provider.trim() === "") throw new TypeError("provider is invalid");
  return `p-${Buffer.from(provider, "utf8").toString("base64url")}`;
}

export function aggregateProviderResults(providerResults, minimumReviewers = 1) {
  if (!Number.isSafeInteger(minimumReviewers) || minimumReviewers < 1) throw new TypeError("minimumReviewers must be a positive integer");
  const valid = providerResults.filter((item) => item?.review && ["pass", "revise_required"].includes(item.review.verdict))
    .sort((left, right) => left.provider.localeCompare(right.provider));
  const revise = valid.filter((item) => item.review.verdict === "revise_required");
  if (revise.length) return { status: "semantic", verdict: "revise_required", valid };
  if (valid.length < minimumReviewers) return { status: "unavailable", verdict: null, valid };
  return { status: "semantic", verdict: "pass", valid };
}

export function reviewRefs({ attemptId, stage, reviewTrack, snapshotTree }) {
  const id = safePart(attemptId, "attemptId");
  const track = reviewTrack ?? "default";
  const attemptDirectoryRef = posix.join("reviews", "attempts", id);
  const resultName = `${safePart(stage, "stage")}-${safePart(track, "reviewTrack")}-${safePart(snapshotTree, "snapshotTree")}-${id}.json`;
  return {
    attemptRef: posix.join(attemptDirectoryRef, "attempt.json"),
    providerDirectoryRef: posix.join(attemptDirectoryRef, "providers"),
    resultRef: posix.join("reviews", "results", resultName),
  };
}

export function writeProviderOutput(task, directoryRef, provider, output, sequence = 1, provenance = {}) {
  if (typeof output !== "string") return null;
  const suffix = sequence === 1 ? "" : `-${sequence}`;
  const ref = posix.join(directoryRef, `${providerFilePart(provider)}${suffix}.output.json`);
  const safeTask = assertTaskHandle(task);
  return createCanonicalReviewWriter({ task: safeTask, taskId: provenance.taskId, stage: provenance.stage }).writeProviderOutput(ref, output, { provider });
}

export function writeAttempt(task, ref, attempt) {
  const safeTask = assertTaskHandle(task);
  return createCanonicalReviewWriter({ task: safeTask, taskId: attempt?.task_id, stage: attempt?.stage }).writeAttempt(ref, attempt);
}

export function writeSemanticResult(task, ref, result) {
  const safeTask = assertTaskHandle(task);
  return createCanonicalReviewWriter({ task: safeTask, taskId: result?.task_id, stage: result?.stage }).writeResult(ref, result);
}
