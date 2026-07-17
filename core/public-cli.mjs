import { errorCliEnvelope, okCliEnvelope, serializeCliEnvelope } from "./cli-envelope.mjs";
import { runDoctorCommand } from "./doctor-command.mjs";
import { readJsonInput } from "./json-input.mjs";
import { openTaskFromLaunchAuthority, taskAuthorityFor } from "./launcher-authority.mjs";
import { getTaskStatus, taskBootstrapView } from "./task-status.mjs";

export const PUBLIC_COMMANDS = Object.freeze(["doctor", "task", "stage", "commit", "close", "release", "routing", "admin-repin", "status"]);

const COMMAND_TABLE = Object.freeze({
  doctor: { actions: [""], options: [] },
  status: { actions: [""], options: ["project", "task"] },
  task: { actions: ["create", "bootstrap", "status"], options: ["project", "task", "input", "input-ref"] },
  stage: { actions: ["prepare", "receipt", "run", "confirm", "accept"], options: ["project", "task", "stage", "component", "attempt", "decision", "human-confirmation-ref", "input", "input-ref"] },
  commit: { actions: ["prepare", "confirm", "execute", "status"], options: ["project", "task", "input", "input-ref"] },
  close: { actions: ["prepare", "confirm", "execute", "status"], options: ["project", "task", "input", "input-ref"] },
  release: { actions: ["build", "doctor", "status"], options: ["input", "input-ref"] },
  routing: { actions: ["status", "switch"], options: ["input", "input-ref"] },
  "admin-repin": { actions: ["prepare", "confirm", "execute"], options: ["project", "task", "input", "input-ref"] },
});

const FORBIDDEN_FLAGS = new Set([
  "cwd", "worktree", "worktree-root", "candidate-worktree", "baseline", "baseline-commit",
  "storage-root", "root", "task-path", "target-repo", "input", "capability-id", "capability",
]);

export class PublicCliError extends Error {
  constructor(code, message, exitCode = 2) {
    super(message);
    this.name = "PublicCliError";
    this.code = code;
    this.exitCode = exitCode;
    this.safeForCli = true;
  }
}

const EXECUTOR_ERROR_CLASSES = Object.freeze([
  { exitCode: 14, code: "IMMUTABLE_CONFLICT", pattern: /\b(?:immutable|already exists|EEXIST|conflict)\b/i, message: "immutable record conflict" },
  { exitCode: 15, code: "AUTHORIZATION_STALE", pattern: /\b(?:stale|drift|live state|precondition|postcondition|plan snapshot|snapshot[^\n]*changed|authorization.*invalid)\b/i, message: "authorization no longer matches live state" },
  { exitCode: 13, code: "RELEASE_INVALID", pattern: /\b(?:release(?: manifest)?|contract set|artifact verification|exact version|version mismatch|doctor)\b/i, message: "release verification failed" },
  { exitCode: 12, code: "AUTHORIZATION_FAILED", pattern: /\b(?:authentic|authentication|authorization|authority|capability|permission|forbidden|unauthorized)\b/i, message: "authentication or capability check failed" },
  { exitCode: 11, code: "INTEGRITY_INVALID", pattern: /\b(?:identity|lineage|integrity|hash mismatch|invalid hash|sha-?256|upstream|cross-task|accepted (?:make-decision|build-spec|build-plan|build-code|verify-code))\b/i, message: "identity, lineage, or hash verification failed" },
  { exitCode: 20, code: "EXTERNAL_UNAVAILABLE", pattern: /\b(?:unavailable|temporar(?:y|ily)|timeout|timed out|ECONN|ENET|provider)\b/i, message: "external dependency is temporarily unavailable" },
]);

/** Preserve frozen CLI categories without exposing executor messages or capability material. */
export function classifyExecutorError(error) {
  if (error?.safeForCli === true && typeof error.code === "string" && Number.isInteger(error.exitCode)) return error;
  const material = [error?.code, error?.name, error?.message].filter((value) => typeof value === "string").join(" ");
  const matched = EXECUTOR_ERROR_CLASSES.find(({ pattern }) => pattern.test(material));
  if (matched) return new PublicCliError(matched.code, matched.message, matched.exitCode);
  return new PublicCliError("EXECUTOR_FAILURE", "public command executor failed", 30);
}

function flagParts(token) {
  if (!token.startsWith("--")) return null;
  const split = token.indexOf("=");
  return split < 0
    ? { name: token.slice(2), inlineValue: undefined }
    : { name: token.slice(2, split), inlineValue: token.slice(split + 1) };
}

function rejectForbiddenAuthority(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    const flag = flagParts(argv[index]);
    if (!flag) continue;
    if (FORBIDDEN_FLAGS.has(flag.name)) {
      if (flag.name === "input" && (flag.inlineValue === "@-" || (flag.inlineValue === undefined && argv[index + 1] === "@-"))) continue;
      throw new PublicCliError("USAGE_FORBIDDEN_AUTHORITY", `--${flag.name} is not accepted by the public CLI`);
    }
  }
}

export function parsePublicCliArgv(argv = []) {
  if (!Array.isArray(argv) || argv.length === 0) throw new PublicCliError("USAGE_COMMAND_REQUIRED", "public command is required");
  rejectForbiddenAuthority(argv);
  const [command, ...rest] = argv;
  if (!PUBLIC_COMMANDS.includes(command)) throw new PublicCliError("USAGE_UNKNOWN_COMMAND", `unknown public command: ${command}`);

  const positionals = [];
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const flag = flagParts(rest[index]);
    if (!flag) {
      positionals.push(rest[index]);
      continue;
    }
    const value = flag.inlineValue ?? rest[++index];
    if (value === undefined || value.startsWith("--")) throw new PublicCliError("USAGE_OPTION_VALUE_REQUIRED", `--${flag.name} requires a value`);
    if (Object.hasOwn(options, flag.name)) throw new PublicCliError("USAGE_DUPLICATE_OPTION", `--${flag.name} may only be specified once`);
    options[flag.name] = value;
  }
  if (options.input && options["input-ref"]) throw new PublicCliError("USAGE_DUPLICATE_INPUT_SOURCE", "choose one JSON input source");
  const inputSource = options.input ?? options["input-ref"];
  if (inputSource !== undefined && inputSource !== "@-" && !/^staging:[A-Za-z0-9._/-]+$/.test(inputSource)) {
    throw new PublicCliError("USAGE_FORBIDDEN_AUTHORITY", "JSON input must use @- or a staging ref");
  }
  const action = positionals.join(" ");
  const contract = COMMAND_TABLE[command];
  if (!contract.actions.includes(action)) throw new PublicCliError("USAGE_UNKNOWN_ACTION", `unsupported public action: ${command} ${action}`.trim());
  const unknownOption = Object.keys(options).find((name) => !contract.options.includes(name));
  if (unknownOption) throw new PublicCliError("USAGE_UNKNOWN_OPTION", `--${unknownOption} is not accepted for ${command} ${action}`.trim());
  if (["status"].includes(command) || (command === "task" && ["bootstrap", "status"].includes(action))) {
    for (const required of ["project", "task"]) if (!options[required]) throw new PublicCliError("USAGE_OPTION_REQUIRED", `--${required} is required`);
  }
  if (["stage", "commit", "close", "admin-repin"].includes(command)) {
    for (const required of ["project", "task"]) if (!options[required]) throw new PublicCliError("USAGE_OPTION_REQUIRED", `--${required} is required`);
  }
  if (command === "stage" && !options.stage) throw new PublicCliError("USAGE_OPTION_REQUIRED", "--stage is required");
  return Object.freeze({ command, action, positionals: Object.freeze(positionals), options: Object.freeze(options), inputSource });
}

export async function executePublicCli(options = {}) {
  const parsed = parsePublicCliArgv(options.argv);
  let input;
  if (parsed.inputSource !== undefined) {
    const reader = options.payload ?? readJsonInput;
    input = await reader({
      source: parsed.inputSource,
      stdin: options.stdin,
      authorizedStagingRefs: options.authorizedStagingRefs,
      stagedPayload: options.stagedPayload,
      stagingLoader: options.stagingLoader,
      command: parsed.command,
    });
  }
  if (options.dryRun) return okCliEnvelope({ resultRef: "admission:dry-run" });
  if (typeof options.executor !== "function") throw new PublicCliError("CAPABILITY_UNAVAILABLE", "public command executor is unavailable", 12);
  let result;
  try {
    result = await options.executor({ ...parsed, input });
  } catch (error) {
    throw classifyExecutorError(error);
  }
  if (result?.schema_id === "https://workflowhub.dev/schemas/cli-output.v1.schema.json") return result;
  return okCliEnvelope({ resultRef: result?.result_ref });
}

/** Build the launcher-bound, read-only facade without exposing its capabilities. */
export function createReadOnlyFacadeExecutor({ taskCapability, doctorAuthority } = {}) {
  return async ({ command, action }) => {
    if (command === "doctor") {
      const result = await runDoctorCommand(doctorAuthority);
      return { result_ref: result.facts_refs[0] ?? "doctor/status" };
    }
    if (command === "status" || (command === "task" && action === "status")) {
      const result = getTaskStatus(taskCapability);
      return { result_ref: `${result.task_ref}/status` };
    }
    if (command === "task" && action === "bootstrap") {
      const result = taskBootstrapView(taskCapability);
      return { result_ref: `${result.task_ref}/bootstrap` };
    }
    throw new PublicCliError("USAGE_UNKNOWN_ACTION", `unsupported read-only action: ${command} ${action}`.trim());
  };
}

export function createLauncherReadOnlyExecutor({ launcherAuthority, doctorAuthority } = {}) {
  return async (request) => {
    if (request.command === "doctor") return createReadOnlyFacadeExecutor({ doctorAuthority })(request);
    const taskCapability = openTaskFromLaunchAuthority(taskAuthorityFor(launcherAuthority, {
      projectName: request.options.project,
      taskId: request.options.task,
    }));
    return createReadOnlyFacadeExecutor({ taskCapability, doctorAuthority })(request);
  };
}

/** Trusted launcher dispatcher. Action handlers receive only admitted values and process-local capabilities. */
export function createLauncherExecutor({
  launcherAuthority,
  repositoryAuthority,
  releaseAuthority,
  doctorAuthority,
  createTask,
  stageHandler,
  commitHandler,
  closeHandler,
} = {}) {
  const readOnly = createLauncherReadOnlyExecutor({ launcherAuthority, doctorAuthority });
  return async (request) => {
    if (request.command === "task" && request.action === "create") {
      if (typeof createTask !== "function") throw new TypeError("task create capability is unavailable");
      const input = request.input?.payload;
      if (!input || typeof input !== "object" || Array.isArray(input)) throw new PublicCliError("SCHEMA_INVALID_INPUT", "task create payload is required", 10);
      const task = await createTask(input, { launcherAuthority, repositoryAuthority, releaseAuthority });
      return { result_ref: `projects/${task.identity.projectName}/tasks/${task.identity.taskId}/task.json` };
    }
    if (request.command === "stage") {
      if (typeof stageHandler !== "function") throw new TypeError("stage capability is unavailable");
      return stageHandler(request);
    }
    if (request.command === "commit") {
      if (typeof commitHandler !== "function") throw new TypeError("commit capability is unavailable");
      return commitHandler(request);
    }
    if (request.command === "close") {
      if (typeof closeHandler !== "function") throw new TypeError("close capability is unavailable");
      return closeHandler(request);
    }
    return readOnly(request);
  };
}

export async function runPublicCli(options = {}) {
  try {
    const envelope = await executePublicCli(options);
    options.stdout?.write(serializeCliEnvelope(envelope));
    return envelope.exit_code;
  } catch (error) {
    const envelope = errorCliEnvelope(error);
    options.stdout?.write(serializeCliEnvelope(envelope));
    options.stderr?.write(`${envelope.error.code}: ${envelope.error.message}\n`);
    return envelope.exit_code;
  }
}
