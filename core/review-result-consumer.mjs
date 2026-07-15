import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

const oid = /^[a-f0-9]{40,64}$/;

function safeRef(value) {
  return typeof value === "string" && value.length > 0 && !isAbsolute(value) && !value.includes("\\")
    && value.split("/").every((part) => part && part !== "." && part !== "..");
}

export function validateReviewFact(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).sort().join(",") !== "result_ref,snapshot_tree"
    || !safeRef(value.result_ref) || !oid.test(value.snapshot_tree ?? "")) {
    throw new Error("review must contain only task-relative result_ref and snapshot_tree");
  }
  return value;
}

export function readReviewResult(reviewFact, reviewDataRoot, { stage = null, track = undefined, requirePass = false } = {}) {
  const fact = validateReviewFact(reviewFact);
  const root = resolve(reviewDataRoot);
  const path = resolve(root, ...fact.result_ref.split("/"));
  const rel = relative(root, path);
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) throw new Error("review result_ref escapes review data root");
  if (!existsSync(path)) throw new Error(`review result is missing: ${fact.result_ref}`);
  let result;
  try { result = JSON.parse(readFileSync(path, "utf8")); }
  catch (error) { throw new Error(`review result is invalid JSON: ${error.message}`); }
  if (result?.version !== "wh-review-result.v1" || !["pass", "revise_required"].includes(result?.verdict)
    || result.snapshot_tree !== fact.snapshot_tree || !oid.test(result.snapshot_tree ?? "")) throw new Error("review result does not match its stage review fact");
  if (stage !== null && result.stage !== stage) throw new Error(`review result stage mismatch: expected ${stage}`);
  if (track !== undefined && (result.review_track ?? null) !== track) throw new Error("review result track mismatch");
  if (requirePass && result.verdict !== "pass") throw new Error(`review result must be pass (got ${result.verdict})`);
  return { path, result };
}

export function aggregateMakeDecisionResults(direction, detail) {
  const verdicts = [direction?.verdict, detail?.verdict];
  if (verdicts.includes("revise_required")) return "revise_required";
  if (verdicts.every((value) => value === "pass")) return "pass";
  return "unavailable";
}
