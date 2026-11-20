#!/usr/bin/env node
// Read-only replay entry for frozen task cases (ORACLE-CLOSE-CLAIMS-REPLAY).
// A case is judged in this order: declared original availability, frozen
// fixture bytes, comparable environment, then the named target argv. A case
// whose historical original was lost cannot be replayed from a controlled
// copy: it is reported as `unavailable` with the explicit reason and owner.
// Incomparable environments, swapped fixtures and green targets are named
// apart and never become a pass.
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { environmentFingerprint, workspaceIdentity } from "../../runtime/task/delivery-claims.mjs";
import { readTaskFacts } from "../../runtime/task/task-store.mjs";

const HEX = /^[a-f0-9]{64}$/;
const DEFAULT_TIMEOUT_MS = 30_000;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const text = (value) => typeof value === "string" && value.trim() !== "";
const plain = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
export const REPLAY_VERDICTS = Object.freeze(["target_red", "unavailable", "incomparable", "fixture_mismatch", "fixture_failed", "target_green", "target_exit_mismatch", "target_timeout", "invalid_case"]);

function inside(root, path) {
  const rel = relative(root, path);
  return rel !== "" && !rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel);
}

// The case must say whether its recorded input is the actual original. A lost
// original is never replaced by a controlled copy; reason and owner are
// mandatory so the gap is attributable instead of silently passing.
function originalDeclaration(raw) {
  if (raw === undefined) return { status: "not_declared" };
  const value = typeof raw === "string" ? { status: raw } : raw;
  if (!plain(value) || !text(value.status)) return { error: "case original must declare {status, reason, owner}" };
  const status = value.status.trim().toLowerCase();
  if (status === "available") return { status: "available" };
  if (status === "lost" || status === "unavailable") {
    if (!text(value.reason) || !text(value.owner)) return { error: "a lost original requires an explicit reason and owner; a controlled copy cannot stand in" };
    return { status: "lost", reason: value.reason.trim(), owner: value.owner.trim() };
  }
  return { error: `case original.status is unknown: ${value.status}` };
}

function readFrozenInput(casesDir, name) {
  if (!text(name) || isAbsolute(name) || name.includes("\\") || name.split("/").some((part) => !part || part === "." || part === "..")) {
    return { verdict: "invalid_case", reason: `case input is not a relative fixture path: ${String(name)}` };
  }
  const path = resolve(casesDir, name);
  if (!inside(casesDir, path)) return { verdict: "invalid_case", reason: "case input escapes the frozen cases directory" };
  try {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink() || !stat.isFile()) return { verdict: "fixture_failed", reason: `case input is not a regular fixture file: ${name}` };
    return { path, bytes: readFileSync(path) };
  } catch (error) {
    if (error.code === "ENOENT") return { verdict: "fixture_failed", reason: `case input is missing: ${name}` };
    throw error;
  }
}

// Frozen argv only: the interpreter is either the running node binary or an
// executable inside the cases directory; every other absolute path must stay
// inside that isolated fixture directory. Production paths never execute.
function isolatedArgv(argv, casesDir) {
  if (!Array.isArray(argv) || argv.length === 0 || argv.some((value) => !text(value))) return { error: "target argv must be a nonempty string array" };
  const interpreter = argv[0];
  if (!isAbsolute(interpreter)) return { error: `target interpreter must be the running node binary or an executable inside the isolated fixture: ${interpreter}` };
  if (interpreter !== process.execPath && !inside(casesDir, resolve(interpreter))) return { error: `target interpreter is outside the isolated fixture: ${interpreter}` };
  for (const value of argv.slice(1)) {
    if (value.startsWith("-")) continue;
    if (!isAbsolute(value)) return { error: `target argv script path must be absolute inside the isolated fixture: ${value}` };
    if (!inside(casesDir, resolve(value))) return { error: `target argv path is outside the isolated fixture: ${value}` };
  }
  return { argv: [...argv] };
}

function judgeCase(raw, casesDir) {
  if (!plain(raw) || !text(raw.id)) return { id: null, verdict: "invalid_case", reason: "case has no string id" };
  const id = raw.id;
  const reject = (verdict, reason) => ({ id, verdict, reason });
  const original = originalDeclaration(raw.original);
  if (original.error) return reject("invalid_case", original.error);
  const withOriginal = (result) => ({ ...result, original: original.status });
  if (!plain(raw.target) || !plain(raw.target.expected) || !Number.isInteger(raw.target.expected.exit)) return withOriginal(reject("invalid_case", "case target.expected.exit must be an integer"));
  if (!plain(raw.environment) || !HEX.test(raw.environment.hash ?? "")) return withOriginal(reject("invalid_case", "case environment.hash must be a sha256 of the recorded environment"));
  if (!HEX.test(raw.input_sha256 ?? "")) return withOriginal(reject("invalid_case", "case input_sha256 must be a sha256 of the frozen fixture bytes"));
  if (raw.timeout_ms !== undefined && (!Number.isSafeInteger(raw.timeout_ms) || raw.timeout_ms < 1 || raw.timeout_ms > 300000)) return withOriginal(reject("invalid_case", "case timeout_ms must be an integer between 1 and 300000"));
  if (original.status === "lost") {
    return withOriginal({
      id, verdict: "unavailable", original_status: "lost",
      reason: `original unavailable (未取得): ${original.reason}; a controlled copy is not the original and is never replayed as a pass`,
      unavailable: { status: "unavailable", label: "未取得", reason: original.reason, owner: original.owner },
      input_sha256: raw.input_sha256,
    });
  }
  const input = readFrozenInput(casesDir, raw.input);
  if (input.verdict) return withOriginal(reject(input.verdict, input.reason));
  const digest = environmentFingerprint();
  const actualInput = sha256(input.bytes);
  const expectedExit = raw.target.expected.exit;
  if (actualInput !== raw.input_sha256) {
    return withOriginal({ id, verdict: "fixture_mismatch", reason: `frozen fixture bytes differ from the recorded input_sha256 (expected ${raw.input_sha256}, actual ${actualInput}); a swapped fixture is not the named target red`, input_sha256: actualInput, expected_exit: expectedExit });
  }
  if (digest !== raw.environment.hash) {
    return withOriginal({ id, verdict: "incomparable", reason: `environment is not comparable (recorded ${raw.environment.hash}, actual ${digest}); this case cannot be replayed as a pass`, environment: { expected: raw.environment.hash, actual: digest } });
  }
  if (plain(raw.environment.workspace)) {
    const declared = raw.environment.workspace, actual = workspaceIdentity({ cwd: process.cwd() });
    if (declared.hash !== actual.sha256 || declared.worktree_root !== actual.worktree_root
        || declared.branch !== actual.branch || declared.head !== actual.head) {
      return withOriginal({ id, verdict: "incomparable", reason: `worktree/branch identity is not comparable (recorded ${declared.hash ?? "missing"}, actual ${actual.sha256}); this case cannot be replayed as a pass`, environment: { expected: declared.hash ?? null, actual: actual.sha256 } });
    }
  }
  const isolation = isolatedArgv(raw.target.argv, casesDir);
  if (isolation.error) return withOriginal(reject("invalid_case", isolation.error));
  // The executed target must be the frozen, hashed input itself; an unhashed
  // script inside the fixture directory is refused.
  if (!raw.target.argv.some((value) => isAbsolute(value) && resolve(value) === input.path)) {
    return withOriginal(reject("invalid_case", "target argv does not execute the frozen hashed input; an unhashed target is refused"));
  }
  const run = spawnSync(isolation.argv[0], isolation.argv.slice(1), {
    cwd: casesDir, encoding: "utf8", timeout: raw.timeout_ms ?? DEFAULT_TIMEOUT_MS, maxBuffer: 8 * 1024 * 1024,
  });
  const output = `${run.stdout ?? ""}${run.stderr ?? ""}`;
  const observed = { exit_code: typeof run.status === "number" ? run.status : null, signal: run.signal ?? null, timed_out: run.error?.code === "ETIMEDOUT" };
  if (run.error && run.error.code !== "ETIMEDOUT") return withOriginal({ id, verdict: "fixture_failed", reason: `target failed to start: ${run.error.code}`, observed });
  if (observed.timed_out) return withOriginal({ id, verdict: "target_timeout", reason: `target did not reach the named failure within ${raw.timeout_ms ?? DEFAULT_TIMEOUT_MS}ms`, observed });
  if (observed.exit_code === 0) return withOriginal({ id, verdict: "target_green", reason: "the target passed; the pre-named target failure was not observed", observed });
  if (observed.exit_code !== expectedExit) return withOriginal({ id, verdict: "target_exit_mismatch", reason: `target exit ${observed.exit_code} differs from the pre-named ${expectedExit}`, observed });
  const gap = raw.target.expected.gap;
  if (gap !== undefined && (!text(gap) || !output.toLowerCase().includes(gap.toLowerCase()))) {
    return withOriginal({ id, verdict: "target_exit_mismatch", reason: `exit matches ${expectedExit} but the named failure anchor ${JSON.stringify(gap)} is absent; output is not the frozen red`, observed });
  }
  return withOriginal({ id, verdict: "target_red", reason: `environment comparable; pre-named target failure observed (exit ${expectedExit}${gap === undefined ? "" : `, anchor ${gap}`})`, observed });
}

export function judgeReplayCases(casesValue, casesFile) {
  if (!plain(casesValue) || !Array.isArray(casesValue.cases) || casesValue.cases.length === 0) throw Object.assign(new TypeError("cases file must contain a nonempty cases array"), { code: "REPLAY_CASES" });
  const casesDir = dirname(resolve(casesFile));
  const seen = new Set();
  const cases = casesValue.cases.map((raw) => {
    const judged = judgeCase(raw, casesDir);
    if (judged.id !== null) {
      if (seen.has(judged.id)) return { id: judged.id, verdict: "invalid_case", reason: "duplicate case id", original: judged.original ?? "not_declared" };
      seen.add(judged.id);
    }
    return judged;
  });
  const unavailable = cases.filter((row) => row.verdict === "unavailable").map((row) => ({ id: row.id, status: "unavailable", reason: row.unavailable.reason, owner: row.unavailable.owner }));
  const replayed = cases.every((row) => row.verdict === "target_red");
  return {
    schema_version: "replay-result.v1",
    status: replayed ? "replayed" : "incomplete",
    unavailable,
    environment: { sha256: environmentFingerprint(), platform: process.platform, arch: process.arch, node: process.version },
    cases,
  };
}

function parse(argv) {
  const values = {};
  for (const arg of argv) {
    const index = arg.indexOf("=");
    if (!arg.startsWith("--") || index < 3) throw new TypeError(`invalid argument: ${arg}`);
    const key = arg.slice(2, index);
    if (key in values) throw new TypeError(`duplicate --${key}`);
    values[key] = arg.slice(index + 1);
  }
  return values;
}

// A bound case set cannot be swapped: the task fact names the exact cases
// original and its sha256. Without a binding the replay is diagnostic only and
// says so; it is never silently presented as a claimable replay.
export function verifyCasesBinding(taskPath, casesFile) {
  const taskDir = resolve(taskPath);
  let manifest;
  try { manifest = JSON.parse(readFileSync(resolve(taskDir, "task.json"), "utf8")); }
  catch (error) { return { status: "unreadable", reason: `task manifest is not readable: ${error.code ?? error.message}`, task_id: null }; }
  if (!text(manifest?.task_id)) return { status: "unreadable", reason: "task manifest identity is missing", task_id: null };
  let row;
  try { row = readTaskFacts(taskDir).find((value) => value?.record_kind === "stage" && value.stage === "build-code"); }
  catch (error) { return { status: "unreadable", reason: `task facts are not readable: ${error.code ?? error.message}`, task_id: manifest.task_id }; }
  const matches = [...String(row?.source ?? "").matchAll(/; replay-cases: ([^\n;]+)/g)];
  if (!matches.length) return { status: "unbound", reason: "no replay-cases binding exists in the build-code facts row; a replaceable case set is not a claimable replay", task_id: manifest.task_id };
  const bound = /^([A-Za-z0-9._/-]+)#sha256=([a-f0-9]{64})$/.exec(matches.at(-1)[1].trim());
  if (!bound || !bound[1].startsWith("quality/evidence/replay-cases/")) return { status: "invalid", reason: `the recorded replay-cases pointer is malformed: ${matches.at(-1)[1]}`, task_id: manifest.task_id };
  const expected = resolve(taskDir, bound[1]);
  if (resolve(casesFile) !== expected) return { status: "mismatch", reason: "the supplied cases file is not the bound task original", task_id: manifest.task_id, expected, actual: resolve(casesFile) };
  let bytes;
  try { bytes = readFileSync(expected); }
  catch (error) { return { status: "mismatch", reason: `the bound cases original is not readable: ${error.code ?? error.message}`, task_id: manifest.task_id }; }
  if (sha256(bytes) !== bound[2]) return { status: "mismatch", reason: "the bound cases bytes differ from the recorded sha256", task_id: manifest.task_id, ref: bound[1], expected: bound[2], actual: sha256(bytes) };
  return { status: "bound", task_id: manifest.task_id, ref: bound[1], sha256: bound[2] };
}

export function checkReplayMain(argv = process.argv.slice(2)) {
  const values = parse(argv);
  if (Object.keys(values).some((key) => key !== "cases" && key !== "task-path")) throw new TypeError("unknown replay option");
  if (!text(values.cases)) throw new TypeError("usage: check-replay.mjs --cases=<frozen replay-cases.json> [--task-path=<task>]");
  const casesFile = resolve(values.cases);
  const binding = text(values["task-path"])
    ? verifyCasesBinding(values["task-path"], casesFile)
    : { status: "not_checked", reason: "no --task-path was supplied; case-set bytes are not bound to a task fact, so this replay is diagnostic only" };
  if (binding.status !== "bound" && binding.status !== "not_checked") {
    return { schema_version: "replay-result.v1", status: "incomplete", binding, unavailable: [], cases: [], reason: binding.reason };
  }
  const casesValue = JSON.parse(readFileSync(casesFile, "utf8"));
  return { ...judgeReplayCases(casesValue, casesFile), binding };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const result = checkReplayMain(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = result.status === "replayed" ? 0 : 1;
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ code: error.code ?? null, message: error.message })}\n`);
    process.exitCode = 2;
  }
}
