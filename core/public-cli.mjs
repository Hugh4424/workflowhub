import { readFileSync } from "node:fs";
import { bootstrapStage } from "./stage-context.mjs";
import { createPhaseSubject, readPhaseSubject } from "./phase-subject.mjs";
import { scanPhaseTreeDiff } from "./tree-diff-scanner.mjs";
import { publishPhaseDiff, publishPhaseResult, publishPhaseSubject } from "./phase-evidence-publisher.mjs";

const FORBIDDEN = /^(?:--(?:cwd|path|task-path|record-path|commit|range|diff|capability-id|base-commit|candidate-commit))(?:=|$)/;
function parse(argv) {
  if (argv[0] !== "phase" || !["subject", "diff", "result"].includes(argv[1])) throw new Error("usage: workflowhub phase <subject|diff|result> --project=... --task=... --phase-id=... --input=@-");
  const out = { command: argv[1] };
  for (const arg of argv.slice(2)) {
    if (FORBIDDEN.test(arg)) throw new TypeError(`forbidden public selector: ${arg.split("=")[0]}`);
    const match = /^--(project|task|phase-id|input)=(.*)$/.exec(arg); if (!match) throw new TypeError(`unknown argument: ${arg}`);
    out[match[1].replace("-", "_")] = match[2];
  }
  if (!out.project || !out.task || !/^[a-z0-9][a-z0-9-]*$/.test(out.phase_id ?? "") || out.input !== "@-") throw new TypeError("project, task, phase-id and --input=@- are required");
  return out;
}
export function admitPhaseCommand(argv) { return Object.freeze(parse(argv)); }
export function runPublicCli(argv, { stdin = 0, env = process.env } = {}) {
  const admitted = parse(argv); // Admission deliberately precedes bootstrap and payload I/O.
  const raw = readFileSync(stdin, "utf8"); const payload = raw.trim() === "" ? {} : JSON.parse(raw);
  const ctx = bootstrapStage("build-code", { projectName: admitted.project, taskId: admitted.task, env });
  let result;
  if (admitted.command === "subject") {
    if (payload.phase_id !== undefined && payload.phase_id !== admitted.phase_id) throw new Error("payload phase_id mismatch");
    result = publishPhaseSubject(ctx.kernel, createPhaseSubject(ctx.workspace, ctx.task, { ...payload, phase_id: admitted.phase_id }).value);
  } else if (admitted.command === "diff") {
    if (Object.keys(payload).length) throw new TypeError("phase diff does not accept caller payload selectors");
    result = publishPhaseDiff(ctx.kernel, scanPhaseTreeDiff(ctx.workspace, readPhaseSubject(ctx.task, admitted.phase_id, ctx.workspace)).value);
  } else {
    if (payload.phase_id !== undefined && payload.phase_id !== admitted.phase_id) throw new Error("payload phase_id mismatch");
    result = publishPhaseResult(ctx.kernel, { ...payload, schema_version: "1.0.0", phase_id: admitted.phase_id, task_id: ctx.task.identity.taskId });
  }
  return result;
}
