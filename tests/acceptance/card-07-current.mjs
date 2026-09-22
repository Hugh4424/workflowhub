import { spawnSync } from "node:child_process";

const CURRENT_ACS = Object.freeze([
  "AC-33", "AC-34", "AC-35", "AC-36", "AC-37", "AC-38", "AC-39", "AC-40", "AC-41", "AC-42",
  "AC-43", "AC-44", "AC-45", "AC-46", "AC-47", "AC-48", "AC-49", "AC-50", "AC-51", "AC-52",
]);

function commandResult(command, timeoutMs) {
  if (!Array.isArray(command) || command.length === 0 || command.some((part) => typeof part !== "string" || part.trim() === "")) {
    throw new TypeError("CARD-07 acceptance command must be a non-empty string array");
  }
  const result = spawnSync(command[0], command.slice(1), {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: timeoutMs,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return Object.freeze({
    command: [...command],
    exit_code: Number.isInteger(result.status) ? result.status : null,
    signal: result.signal ?? null,
    timed_out: result.error?.code === "ETIMEDOUT",
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error ? { code: result.error.code ?? "CHILD_PROCESS_ERROR", message: result.error.message } : null,
  });
}

/**
 * Run the current local slice, then deliberately keep the product AC rows
 * incomplete: the aggregate command is not an independent per-AC oracle.
 * The private WorkflowHub runner records these rows as real non-achieved
 * evidence instead of promoting an exit-0 aggregate to business acceptance.
 */
export function produceCard07Current(input = {}) {
  const timeoutMs = Number.isSafeInteger(input.timeout_ms) && input.timeout_ms > 0 ? input.timeout_ms : 900000;
  const execution = commandResult(input.command, timeoutMs);
  const reason = execution.exit_code === 0 && execution.signal === null && !execution.timed_out
    ? "aggregate command passed, but it does not independently prove per-AC business behavior"
    : "current aggregate command did not complete successfully; per-AC acceptance remains incomplete";
  return {
    schema_version: "card07-current-acceptance.v1",
    execution,
    entries: CURRENT_ACS.map((acceptance_criterion_id) => ({
      acceptance_criterion_id,
      outcome: "incomplete",
      owner: "CARD-07",
      reason,
      assertions: [{
        id: `${acceptance_criterion_id}:native-per-ac-proof`,
        expected: { status: "passed" },
        actual: { status: "incomplete" },
      }],
    })),
  };
}
