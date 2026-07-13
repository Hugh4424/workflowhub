#!/usr/bin/env node

/** V4-only CLI boundary. Workflows call run/reset; legacy prepare/execute paths are retired. */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { BrokerClient } from "./broker-client.mjs";
import { ReviewRoundFacade } from "./review-round-facade.mjs";
import { loadTrustedThirdReviewConfig } from "./third-review-host-config.mjs";

export async function runReviewRound(input) {
  if (input.provider_capabilities !== undefined || input.providerCapabilities !== undefined || input.third_review?.provider_capabilities !== undefined) throw new Error("provider_capabilities are broker-owned and cannot be supplied by callers");
  if (input.attachment_delivery !== undefined || input.attachmentDelivery !== undefined) throw new Error("attachment_delivery comes only from stage-skill-plan resolution and cannot be supplied by callers");
  if (input.third_review !== undefined || input.attachment_root !== undefined || input.attachmentRoot !== undefined) throw new Error("third_review and attachment_root are host-configured and cannot be supplied by callers");
  const taskTrackingRoot = input.task_tracking_root ?? input.taskTrackingRoot;
  if (!taskTrackingRoot) throw new TypeError("V4 review requires task_tracking_root");
  const thirdReview = loadTrustedThirdReviewConfig();
  const client = new BrokerClient({ command: thirdReview.command, config: thirdReview.config, attachmentRoot: thirdReview.attachmentRoot });
  const facade = new ReviewRoundFacade({ taskTrackingRoot, broker: client });
  const prepared = await facade.prepare({
    task_id: input.task_id ?? input.taskId, stage: input.stage, review_track: input.review_track ?? input.reviewTrack,
    review_flow_id: input.review_flow_id ?? input.reviewFlowId, host_provider: input.host_provider ?? input.hostProvider,
    packet: input.packet, continuation: input.continuation === true, ui: input.ui === true,
    closure_evidence: input.closure_evidence, cross_stage_carryovers: input.cross_stage_carryovers,
    attachment_root: thirdReview.attachmentRoot,
    repository_root: input.repository_root ?? input.repositoryRoot,
  });
  const result = await facade.run(prepared);
  // `run()` owns private provider semantics so the host can disposition findings,
  // but the CLI's unpublished result is deliberately transport-only. A semantic
  // conclusion becomes public only after `publish()` has written its core receipt.
  const transport = {
    review_flow_id: result.intent.review_flow_id,
    continuation_eligible: result.continuation_eligible,
    blocked_by_human_confirmation: result.blocked_by_human_confirmation,
    provider_outcomes: result.provider_outcomes.map(({ provider, transport_status, packet_status, business_valid, cancel_source, diagnostic }) => ({
      provider, transport_status, packet_status, business_valid, cancel_source: cancel_source ?? null, diagnostic: diagnostic ?? null,
    })),
  };
  return input.dispositions ? { transport, ...facade.publish(result, input.dispositions) } : { transport };
}

export function resetReviewFlow(input) {
  const taskTrackingRoot = input.task_tracking_root ?? input.taskTrackingRoot;
  if (!taskTrackingRoot) throw new TypeError("reset requires task_tracking_root");
  const facade = new ReviewRoundFacade({ taskTrackingRoot, broker: { run() { throw new Error("reset does not run broker"); } } });
  return facade.reset({ task_id: input.task_id ?? input.taskId, stage: input.stage, review_track: input.review_track ?? input.reviewTrack ?? null, review_flow_id: input.review_flow_id ?? input.reviewFlowId, new_review_flow_id: input.new_review_flow_id ?? input.newReviewFlowId, reason: input.reason, human_approval_ref: input.human_approval_ref ?? input.humanApprovalRef });
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
