#!/usr/bin/env node

/** Stable adapter-facing facade for wh-review's two-phase protocol. */
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";
import { prepareRoundState } from "./round-state.mjs";
import { assembleAndInvokeReviewEngine } from "./invoke-review-engine.mjs";
import { BrokerClient } from "./broker-client.mjs";
import { ReviewRoundFacade } from "./review-round-facade.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function providerEnv(input) {
  const env = { ...process.env, ...(input.env ?? {}) };
  if (input.provider !== undefined) {
    if (typeof input.provider !== "string" || !new Set(["claude-code", "codex", "gemini", "kimi"]).has(input.provider)) throw new TypeError("provider must be one of claude-code, codex, gemini, kimi");
    env.WH_REVIEW_PROVIDER = input.provider;
  }
  if (input.host_provider !== undefined) {
    if (typeof input.host_provider !== "string" || !new Set(["claude-code", "claude", "codex", "openai-codex", "codex-cli"]).has(input.host_provider)) throw new TypeError("host_provider is unsupported");
    env.WH_REVIEW_HOST_PROVIDER = input.host_provider;
  }
  return env;
}

const SAFE_MATERIAL_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;
export function normalizeMaterialSources(value) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new TypeError("material_sources must be an array of {id,path} descriptors");
  const seen = new Set();
  return value.map((descriptor, index) => {
    if (!descriptor || typeof descriptor !== "object" || Array.isArray(descriptor)) throw new TypeError(`material_sources[${index}] must be an object`);
    const allowed = new Set(["id", "source_id", "sourceId", "path", "file_path", "filePath"]);
    const unknown = Object.keys(descriptor).filter((key) => !allowed.has(key));
    if (unknown.length) throw new TypeError(`material_sources[${index}] contains unknown fields: ${unknown.join(",")}`);
    const idKeys = ["id", "source_id", "sourceId"].filter((key) => Object.hasOwn(descriptor, key));
    const pathKeys = ["path", "file_path", "filePath"].filter((key) => Object.hasOwn(descriptor, key));
    if (idKeys.length > 1) throw new TypeError(`material_sources[${index}] contains multiple id aliases`);
    if (pathKeys.length > 1) throw new TypeError(`material_sources[${index}] contains multiple path aliases`);
    const id = descriptor.id ?? descriptor.source_id ?? descriptor.sourceId;
    const path = descriptor.path ?? descriptor.file_path ?? descriptor.filePath;
    if (typeof id !== "string" || !SAFE_MATERIAL_ID.test(id)) throw new TypeError(`material_sources[${index}].id must be a safe non-empty string`);
    if (typeof path !== "string" || path.length === 0 || path.includes("\0")) throw new TypeError(`material_sources[${index}].path must be a non-empty string`);
    if (seen.has(id)) throw new TypeError(`material_sources contains duplicate id: ${id}`);
    seen.add(id);
    return { id, path };
  });
}

export function prepareReview(input) {
  return prepareRoundState({
    taskId: input.task_id ?? input.taskId,
    stage: input.stage,
    taskTrackingRoot: input.task_tracking_root ?? input.taskTrackingRoot,
  });
}

/** V4 production entry. The execute branch below is a temporary test-only
 * compatibility seam until workflow callers are migrated in the next phase. */
export async function runReviewRound(input) {
  const taskTrackingRoot = input.task_tracking_root ?? input.taskTrackingRoot;
  const command = input.third_review?.command, config = input.third_review?.config;
  if (!taskTrackingRoot || !command || !config) throw new TypeError("V4 review requires task_tracking_root and third_review.{command,config}");
  const client = new BrokerClient({ command, config, attachmentRoot: input.attachment_root ?? input.attachmentRoot ?? repositoryRoot });
  const facade = new ReviewRoundFacade({ taskTrackingRoot, broker: client });
  const prepared = facade.prepare({
    task_id: input.task_id ?? input.taskId, stage: input.stage, review_track: input.review_track ?? input.reviewTrack,
    review_flow_id: input.review_flow_id ?? input.reviewFlowId, host_provider: input.host_provider ?? input.hostProvider,
    packet: input.packet, continuation: input.continuation === true, ui: input.ui === true,
    attachment_root: input.attachment_root ?? input.attachmentRoot, attachments: input.attachments,
    attachment_delivery: input.attachment_delivery ?? input.attachmentDelivery,
    repository_root: input.repository_root ?? input.repositoryRoot,
    provider_capabilities: input.provider_capabilities ?? input.providerCapabilities ?? input.third_review?.provider_capabilities,
  });
  const result = await facade.run(prepared);
  return input.dispositions ? { ...result, publication: facade.publish(result, input.dispositions) } : result;
}

export function resetReviewFlow(input) {
  const taskTrackingRoot = input.task_tracking_root ?? input.taskTrackingRoot;
  if (!taskTrackingRoot) throw new TypeError("reset requires task_tracking_root");
  const facade = new ReviewRoundFacade({ taskTrackingRoot, broker: { run() { throw new Error("reset does not run broker"); } } });
  return facade.reset({ task_id: input.task_id ?? input.taskId, stage: input.stage, review_flow_id: input.review_flow_id ?? input.reviewFlowId, new_review_flow_id: input.new_review_flow_id ?? input.newReviewFlowId, reason: input.reason, human_approval_ref: input.human_approval_ref ?? input.humanApprovalRef });
}

export async function executeReview(input) {
  if (input.packet) return runReviewRound(input);
  const taskId = input.task_id ?? input.taskId;
  const reviewFlowId = input.review_flow_id ?? input.reviewFlowId;
  const totalRound = input.total_round ?? input.totalRound;
  const taskTrackingRoot = input.task_tracking_root ?? input.taskTrackingRoot;
  const currentContent = input.current_content ?? input.currentContent;
  if (typeof currentContent !== "string") throw new TypeError("current_content must contain review content as a string, not a file path descriptor");
  const result = await assembleAndInvokeReviewEngine({
    taskId,
    stage: input.stage,
    reviewFlowId,
    totalRound,
    taskTrackingRoot,
    currentContent,
    materialSources: normalizeMaterialSources(input.material_sources ?? input.materialSources),
    docType: input.doc_type ?? input.docType,
    gitSha: input.git_sha ?? input.gitSha,
    coveredPaths: input.covered_paths ?? input.coveredPaths,
    timeoutMs: input.timeout_ms ?? input.timeoutMs,
    env: providerEnv(input),
  });
  const artifactPath = join(taskTrackingRoot, taskId, "reviews", `verdict-${input.stage}-${reviewFlowId}-round-${totalRound}.raw.json`);
  const raw = JSON.parse(readFileSync(artifactPath, "utf8"));
  const attestation = {};
  for (const field of ["provider", "backend_provider", "reviewer_source", "trueCrossEngine", "synthetic", "failure_reason", "diagnostic_path", "diagnostic_sha256", "diagnostic_bytes", "execution_status"]) {
    if (raw[field] !== undefined) attestation[field] = raw[field];
  }
  return { ...result, ...attestation };
}

async function main() {
  const command = process.argv[2];
  if (command !== "prepare" && command !== "execute" && command !== "run" && command !== "reset") {
    throw new Error("usage: wh-review-cli.mjs <prepare|run|reset> [input.json]; JSON stdin is used when input.json is omitted");
  }
  const input = JSON.parse(readFileSync(process.argv[3] ?? 0, "utf8"));
  const result = command === "prepare" ? prepareReview(input) : command === "reset" ? resetReviewFlow(input) : command === "run" ? await runReviewRound(input) : await executeReview(input);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error?.stack ?? error}\n`);
    process.exitCode = 1;
  });
}
