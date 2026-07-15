import { linkSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { randomUUID } from "node:crypto";

function safePart(value, label) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9._-]+$/.test(value)) throw new TypeError(`${label} is invalid`);
  return value;
}

function createJson(path, value, atomic = false) {
  mkdirSync(dirname(path), { recursive: true });
  const bytes = `${JSON.stringify(value, null, 2)}\n`;
  if (!atomic) { writeFileSync(path, bytes, { flag: "wx", mode: 0o600 }); return path; }
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
  try { writeFileSync(temporary, bytes, { flag: "wx", mode: 0o600 }); linkSync(temporary, path); }
  finally { rmSync(temporary, { force: true }); }
  return path;
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

export function reviewPaths({ reviewDataRoot, attemptId, stage, reviewTrack, snapshotTree }) {
  const root = resolve(reviewDataRoot, "reviews"); const id = safePart(attemptId, "attemptId");
  const attemptDirectory = join(root, "attempts", id); const track = reviewTrack ?? "default";
  const resultName = `${safePart(stage, "stage")}-${safePart(track, "reviewTrack")}-${safePart(snapshotTree, "snapshotTree")}-${id}.json`;
  return { root, attemptDirectory, attemptPath: join(attemptDirectory, "attempt.json"), providerDirectory: join(attemptDirectory, "providers"), resultPath: join(root, "results", resultName) };
}

export function writeProviderOutput(directory, provider, output, sequence = 1) {
  if (typeof output !== "string") return null;
  const suffix = sequence === 1 ? "" : `-${sequence}`; const path = join(directory, `${safePart(provider, "provider")}${suffix}.output.txt`); mkdirSync(directory, { recursive: true }); writeFileSync(path, output, { flag: "wx", mode: 0o600 }); return path;
}

export function writeAttempt(path, attempt) { return createJson(path, attempt, false); }
export function writeSemanticResult(path, result) { return createJson(path, result, true); }

export function relativeReviewRef(reviewDataRoot, path) {
  const ref = relative(resolve(reviewDataRoot), resolve(path)).replaceAll("\\", "/");
  if (!ref || ref.startsWith("..")) throw new Error("review artifact escapes review data root");
  return ref;
}
