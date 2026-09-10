import { execFile } from "node:child_process";
import { isAbsolute, relative } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const DEFAULT_TIMEOUT_MS = 110_000;
const MAX_BUFFER_BYTES = 16 * 1024 * 1024;

function nonEmpty(value) {
  return typeof value === "string" && value.trim() !== "";
}

function criterionIds(input) {
  const ids = input?.acceptance_criterion_ids;
  if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => !nonEmpty(id))) {
    throw new TypeError("acceptance_criterion_ids must be a non-empty string array");
  }
  if (new Set(ids).size !== ids.length) throw new TypeError("acceptance_criterion_ids must be unique");
  return ids;
}

function failedEntry(id, reason, detail = undefined) {
  const actual = { status: "failed", reason };
  if (detail !== undefined) actual.detail = detail;
  return {
    acceptance_criterion_id: id,
    assertions: [{
      id: `acceptance-execution:${id}`,
      expected: { status: "passed" },
      actual,
    }],
  };
}

function failedEntries(ids, reason, detail = undefined) {
  return { entries: ids.map((id) => failedEntry(id, reason, detail)) };
}

function normalizeFileName(value, cwd) {
  if (!nonEmpty(value)) return null;
  const raw = value.replaceAll("\\", "/");
  const candidate = isAbsolute(value) ? relative(cwd, value).replaceAll("\\", "/") : raw;
  return candidate.replace(/^\.\//, "");
}

function reportAssertions(report, cwd) {
  if (!report || typeof report !== "object" || Array.isArray(report) || !Array.isArray(report.testResults)) {
    throw new Error("Vitest JSON report is missing testResults");
  }
  return report.testResults.flatMap((suite) => {
    const testFile = normalizeFileName(suite?.name, cwd);
    if (!testFile || !Array.isArray(suite?.assertionResults)) return [];
    return suite.assertionResults.map((assertion) => ({
      test_file: testFile,
      full_name: assertion?.fullName ?? null,
      title: assertion?.title ?? null,
      status: assertion?.status ?? "unknown",
    }));
  });
}

function parseReport(stdout, cwd) {
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(stdout);
  } catch {
    throw new Error("Vitest JSON report is not valid UTF-8");
  }
  let report;
  try {
    report = JSON.parse(text);
  } catch {
    throw new Error("Vitest JSON report is not valid JSON");
  }
  return reportAssertions(report, cwd);
}

function mappingError(ids, mapping) {
  if (!Array.isArray(mapping)) return "acceptance_criterion_map is required";
  const declared = new Set(ids);
  const seen = new Set();
  for (const entry of mapping) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || !nonEmpty(entry.acceptance_criterion_id)) {
      return "acceptance_criterion_map contains an invalid entry";
    }
    const id = entry.acceptance_criterion_id;
    if (!declared.has(id)) return `acceptance_criterion_map contains unknown AC ${id}`;
    if (seen.has(id)) return `acceptance_criterion_map duplicates AC ${id}`;
    seen.add(id);
    if (entry.status === "unavailable") {
      if (!nonEmpty(entry.reason)) return `${id} unavailable mapping requires a reason`;
      continue;
    }
    if (!Array.isArray(entry.selectors) || entry.selectors.length === 0) return `${id} mapping requires selectors`;
    for (const selector of entry.selectors) {
      if (!selector || typeof selector !== "object" || Array.isArray(selector)
          || !nonEmpty(selector.test_file)
          || (!nonEmpty(selector.full_name) && !nonEmpty(selector.title))) {
        return `${id} mapping selector is invalid`;
      }
    }
  }
  for (const id of ids) if (!seen.has(id)) return `acceptance_criterion_map is missing ${id}`;
  return null;
}

function selectAssertions(observed, entry, cwd) {
  if (entry.status === "unavailable") return { status: "failed", reason: entry.reason };
  const matches = entry.selectors.flatMap((selector) => observed.filter((candidate) => {
    const sameFile = candidate.test_file === normalizeFileName(selector.test_file, cwd);
    const sameName = selector.full_name
      ? candidate.full_name === selector.full_name
      : candidate.title === selector.title;
    return sameFile && sameName;
  }));
  if (matches.length === 0) return { status: "failed", reason: "mapped Vitest assertion was not observed" };
  const statuses = [...new Set(matches.map(({ status }) => status))];
  if (matches.every(({ status }) => status === "passed")) return { status: "passed" };
  return { status: "failed", reason: "mapped Vitest assertion did not pass", detail: statuses };
}

async function runDeclaredCommand(input, cwd) {
  if (!nonEmpty(input.command)) throw new TypeError("acceptance execution command is required");
  if (!Array.isArray(input.args) || input.args.some((arg) => typeof arg !== "string")) {
    throw new TypeError("acceptance execution args must be a string array");
  }
  if (input.cancelled === true) return { cancelled: true, stdout: Buffer.alloc(0) };
  const timeoutMs = Number.isSafeInteger(input.timeout_ms) && input.timeout_ms > 0
    ? input.timeout_ms
    : DEFAULT_TIMEOUT_MS;
  try {
    const result = await execFileAsync(input.command, input.args, {
      cwd,
      shell: false,
      encoding: "buffer",
      timeout: timeoutMs,
      maxBuffer: MAX_BUFFER_BYTES,
      windowsHide: true,
    });
    return {
      stdout: Buffer.isBuffer(result.stdout) ? result.stdout : Buffer.from(result.stdout ?? ""),
      exit_code: 0,
    };
  } catch (error) {
    const timedOut = error?.code === "ETIMEDOUT" || (error?.killed === true && error?.signal === "SIGTERM");
    const stdout = Buffer.isBuffer(error?.stdout) ? error.stdout : Buffer.from(error?.stdout ?? "");
    return {
      stdout,
      exit_code: Number.isInteger(error?.status) ? error.status : null,
      signal: error?.signal ?? null,
      timed_out: timedOut,
      reason: timedOut
        ? `declared command timed out after ${timeoutMs}ms`
        : error?.signal
          ? `declared command terminated by ${error.signal}`
          : `declared command failed${error?.code ? ` with ${error.code}` : ""}`,
    };
  }
}

/**
 * Test-owned adapter for the existing private acceptance service tier.
 * It has no task-store access and returns only the canonical `{entries}` shape.
 */
export async function accept(input) {
  const ids = criterionIds(input);
  const cwd = process.cwd();
  const mapError = mappingError(ids, input?.acceptance_criterion_map);
  if (mapError) return failedEntries(ids, mapError);

  const execution = await runDeclaredCommand(input, cwd);
  if (execution.cancelled) return failedEntries(ids, "acceptance execution was cancelled");

  let observed;
  try {
    observed = parseReport(execution.stdout, cwd);
  } catch (error) {
    return failedEntries(ids, execution.reason ?? error.message, execution.reason ? error.message : undefined);
  }

  const byId = new Map(input.acceptance_criterion_map.map((entry) => [entry.acceptance_criterion_id, entry]));
  return {
    entries: ids.map((id) => {
      const result = selectAssertions(observed, byId.get(id), cwd);
      return {
        acceptance_criterion_id: id,
        assertions: [{
          id: `acceptance-execution:${id}`,
          expected: { status: "passed" },
          actual: result.status === "passed" && execution.exit_code === 0
            ? { status: "passed" }
            : { status: "failed", reason: execution.reason ?? result.reason, detail: result.detail },
        }],
      };
    }),
  };
}
