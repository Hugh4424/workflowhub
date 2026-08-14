#!/usr/bin/env node

/**
 * Claude Code Stop hook for a real WorkflowHub Stage Agent invocation.
 *
 * The host owns the delivery path, but the Stage Agent owns the execution
 * result.  This hook never writes an outcome and never turns missing work
 * into success.  It only prevents Claude from ending its turn while the
 * required execution packet is still absent, and feeds the exact delivery
 * requirement back into the same session.
 */

import { existsSync, statSync } from "node:fs";

function readInput() {
  return new Promise((resolve) => {
    let raw = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { raw += chunk; });
    process.stdin.on("end", () => {
      try { resolve(JSON.parse(raw)); } catch { resolve({}); }
    });
    process.stdin.resume();
  });
}

function packetReady(path) {
  try {
    return existsSync(path) && statSync(path).isFile() && statSync(path).size > 0;
  } catch {
    return false;
  }
}

const input = await readInput();
const outcomePath = process.env.WORKFLOWHUB_STAGE_OUTCOME_PATH?.trim();

// A non-WorkflowHub Claude session must never be affected by this hook.  Once
// the packet exists, explicitly approve the stop; returning `continue: true`
// here would keep a successfully delivered session alive forever.
if (!outcomePath || packetReady(outcomePath)) {
  process.stdout.write(JSON.stringify({ decision: "approve", suppressOutput: true }) + "\n");
  process.exit(0);
}

const stage = process.env.WORKFLOWHUB_STAGE?.trim() || "the bound stage";
const context = [
  `WorkflowHub delivery is still missing for ${stage}.`,
  `Before ending this turn, write the truthful JSON execution packet to the exact path: ${outcomePath}`,
  "Use the already executed work and evidence from this run only; do not invent success.",
  "If a step, skill, review, or test was not actually performed, record it as incomplete/unavailable with its real reason.",
  "After writing the packet, verify that it is non-empty and valid JSON. The host will fail closed if the packet is absent.",
].join(" ");

// Block the stop and send the exact repair instruction back to the same
// session. The daemon's normal timeout remains the outer bound if the
// provider never delivers the packet.
process.stdout.write(JSON.stringify({
  decision: "block",
  reason: context,
  ...(input?.stop_hook_active ? { suppressOutput: true } : {}),
}) + "\n");
