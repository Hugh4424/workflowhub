#!/usr/bin/env node

/** V4-only CLI boundary. Workflows call run/reset; legacy prepare/execute paths are retired. */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BrokerClient } from "./broker-client.mjs";
import { ReviewRoundFacade } from "./review-round-facade.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

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
    attachment_root: input.attachment_root ?? input.attachmentRoot, attachment_delivery: input.attachment_delivery ?? input.attachmentDelivery,
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

async function main() {
  const command = process.argv[2];
  if (command !== "run" && command !== "reset") throw new Error("usage: wh-review-cli.mjs <run|reset> [input.json]");
  const input = JSON.parse(readFileSync(process.argv[3] ?? 0, "utf8"));
  const result = command === "run" ? await runReviewRound(input) : resetReviewFlow(input);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { process.stderr.write(`${error?.stack ?? error}\n`); process.exitCode = 1; });
}
