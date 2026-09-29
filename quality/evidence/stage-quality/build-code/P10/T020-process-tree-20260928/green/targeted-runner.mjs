import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { realpathSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// An importable execution seam, not a CLI launcher or a canonical receipt.
const TARGET = /^tests\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.test\.mjs$/;
const NODE_TAP_ARGS = ["--test", "--test-reporter=tap"];
const MAX_OUTPUT = 8 * 1024 * 1024;
const reject = (reason, execution, diagnosticObservations = []) => Object.freeze({ status: "unavailable", reason,
  observations: [], diagnostic_observations: Object.freeze(diagnosticObservations),
  ...(execution ? { execution } : {}) });
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function safeTarget(root, target) {
  if (typeof target !== "string" || !TARGET.test(target) || isAbsolute(target)
      || target.split("/").some((part) => part === "." || part === "..")) return { reason: "unsafe_target" };
  const candidate = resolve(root, target);
  try {
    const actual = realpathSync(candidate);
    const inside = relative(root, actual);
    if (actual !== candidate || inside === "" || inside === ".."
        || inside.startsWith(`..${sep}`) || isAbsolute(inside)) {
      return { reason: "unsafe_target" };
    }
    if (!statSync(actual).isFile()) return { reason: "missing_target" };
    return { target, actual };
  } catch (error) {
    if (error?.code === "ENOENT") return { reason: "missing_target" };
    return { reason: "unsafe_target" };
  }
}

function runChild(executable, args, cwd, signal) {
  return new Promise((resolveResult) => {
    const chunks = [];
    const stdoutChunks = [];
    const stderrChunks = [];
    let size = 0;
    let timedOut = false;
    let outputExceeded = false;
    let spawnError;
    // Each selected test owns a process group. The fixed outer capture aborts
    // this runner on interruption, which kills the whole inner group even when
    // a test grandchild ignores the outer shell's SIGTERM.
    const detached = process.platform !== "win32";
    const child = spawn(executable, args, { cwd, shell: false, detached,
      stdio: ["ignore", "pipe", "pipe"] });
    const kill = () => {
      if (child.pid && detached) {
        try { process.kill(-child.pid, "SIGKILL"); } catch { /* already exited */ }
      }
      try { child.kill("SIGKILL"); } catch { /* already exited */ }
    };
    const onData = (stream, chunk) => {
      size += chunk.length;
      if (size > MAX_OUTPUT) { outputExceeded = true; kill(); return; }
      chunks.push(chunk);
      stream.push(chunk);
    };
    child.stdout.on("data", (chunk) => onData(stdoutChunks, chunk));
    child.stderr.on("data", (chunk) => onData(stderrChunks, chunk));
    child.on("error", (error) => { spawnError = error; });
    const timer = setTimeout(() => { timedOut = true; kill(); }, 30_000);
    const abort = () => kill();
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) abort();
    child.on("close", (code, childSignal) => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      resolveResult({ output: Buffer.concat(chunks).toString("utf8"),
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: Buffer.concat(stderrChunks).toString("utf8"), code, childSignal,
        timedOut, outputExceeded, aborted: signal?.aborted ?? false, spawnError });
    });
  });
}

function tapResult(raw, expected, exitCode) {
  const lines = raw.split(/\r?\n/);
  if (lines.find((line) => line.trim()) !== "TAP version 13") return { reason: "reporter_identity_mismatch" };
  const names = lines.flatMap((line) => line.startsWith("# Subtest: ") ? [line.slice(11)] : []);
  const results = lines.filter((line) => /^(?:not )?ok \d+ - /.test(line));
  const result = results.length === 1 ? /^(not ok|ok) 1 - (.+?)(?: # (SKIP|TODO)(?: .*)?)?$/.exec(results[0]) : null;
  if (names.length !== 1 || names[0] !== expected || !result || result[2] !== expected
      || lines.filter((line) => line === "1..1").length !== 1) return { reason: "reporter_identity_mismatch" };
  const status = result[3] === "SKIP" ? "skipped" : result[3] === "TODO" ? "todo"
    : result[1] === "ok" ? "passed" : "failed";
  const totals = { tests: 1, pass: status === "passed" ? 1 : 0,
    fail: status === "failed" ? 1 : 0, skipped: status === "skipped" ? 1 : 0,
    todo: status === "todo" ? 1 : 0 };
  if (Object.entries(totals).some(([name, count]) =>
    lines.filter((line) => line === `# ${name} ${count}`).length !== 1)
      || lines.filter((line) => line === "# cancelled 0").length !== 1
      || (exitCode === 0) !== (status !== "failed")) return { reason: "reporter_identity_mismatch" };
  return { tests: [{ full_id: expected, status }],
    ...(status === "passed" ? {} : { reason: "test_failed" }) };
}

function vitestCli() {
  try {
    // Resolve the declared local dependency from this module, never from a
    // catalog-supplied executable or shell command.
    const cli = realpathSync(fileURLToPath(import.meta.resolve("vitest/vitest.mjs")));
    return statSync(cli).isFile() ? cli : null;
  } catch { return null; }
}

function vitestResult(raw, target, actual, registeredIds, exitCode) {
  let report;
  try { report = JSON.parse(raw.trim()); } catch { return { reason: "reporter_identity_mismatch" }; }
  if (!report || !Array.isArray(report.testResults) || report.testResults.length !== 1
      || report.testResults[0]?.name !== actual) return { reason: "reporter_identity_mismatch" };
  const file = report.testResults[0];
  const assertions = file.assertionResults;
  if (!Array.isArray(assertions) || assertions.length === 0
      || report.numTotalTests !== assertions.length) return { reason: "reporter_identity_mismatch" };
  const tests = [];
  const ids = new Set();
  for (const assertion of assertions) {
    if (!Array.isArray(assertion?.ancestorTitles)
        || assertion.ancestorTitles.some((name) => typeof name !== "string" || name.trim() === "")
        || typeof assertion.title !== "string" || assertion.title.trim() === ""
        || assertion.fullName !== [...assertion.ancestorTitles, assertion.title].join(" ")
        || !["passed", "failed", "skipped", "todo", "pending"].includes(assertion.status)) {
      return { reason: "reporter_identity_mismatch" };
    }
    const full_id = [target, ...assertion.ancestorTitles, assertion.title].join(" > ");
    if (ids.has(full_id)) return { reason: "reporter_identity_mismatch" };
    ids.add(full_id);
    tests.push({ full_id, status: assertion.status });
  }
  const count = (status) => tests.filter((test) => test.status === status).length;
  const passed = count("passed"), failed = count("failed");
  const skipped = count("skipped") + count("pending"), todo = count("todo");
  if (report.numPassedTests !== passed || report.numFailedTests !== failed
      || report.numPendingTests !== skipped || report.numTodoTests !== todo
      || !Number.isSafeInteger(report.numTotalTestSuites) || report.numTotalTestSuites < 1
      || !Number.isSafeInteger(report.numPassedTestSuites) || report.numPassedTestSuites < 0
      || !Number.isSafeInteger(report.numFailedTestSuites) || report.numFailedTestSuites < 0
      || report.numPassedTestSuites + report.numFailedTestSuites !== report.numTotalTestSuites
      || (report.numFailedTestSuites === 0) !== (failed === 0)
      || report.success !== (failed === 0)
      || file.status !== (failed === 0 ? "passed" : "failed")
      || (exitCode === 0) !== report.success) return { reason: "reporter_identity_mismatch" };
  if (registeredIds.length !== tests.length
      || registeredIds.some((id) => !ids.has(id))) return { reason: "reporter_identity_mismatch" };
  return { tests, ...(failed || skipped || todo || exitCode !== 0 ? { reason: "test_failed" } : {}) };
}

function diagnosticRows(entry, target, tests, raw, exitCode, source) {
  return tests.map((test) => ({ case_id: entry.id, test_file: target,
    full_id: test.full_id, status: test.status, exit_code: exitCode,
    raw_report_sha256: sha256(raw), source, canonical_receipt: false,
    diagnostic_only: true }));
}

export async function runTargetedCases({ selection, workspaceRoot, runner } = {}) {
  if (selection?.status !== "selected" || !Array.isArray(selection.cases)
      || selection.cases.length === 0) return reject("unknown_change_scope");
  const ids = selection.cases.map((entry) => entry?.id);
  if (ids.some((id) => typeof id !== "string" || id.trim() === "")
      || new Set(ids).size !== ids.length) return reject("duplicate_case_id");
  if (typeof workspaceRoot !== "string") return reject("unsafe_target");
  let root;
  try {
    root = realpathSync(workspaceRoot);
    if (!statSync(root).isDirectory()) return reject("unsafe_target");
  } catch { return reject("unsafe_target"); }
  const executable = runner?.executable;
  let trustedExecutable = false;
  try { trustedExecutable = typeof executable === "string"
    && realpathSync(executable) === realpathSync(process.execPath); } catch { /* unavailable executable */ }
  if (!trustedExecutable
      || JSON.stringify(runner?.fixedArgs) !== JSON.stringify(NODE_TAP_ARGS)) {
    return reject("unsafe_target");
  }
  const ready = [];
  for (const entry of selection.cases) {
    const result = safeTarget(root, entry.execution?.target);
    if (result.reason) return reject(result.reason);
    if (typeof entry.execution?.expected_test_identity !== "string"
        || entry.execution.expected_test_identity.trim() === "") return reject("reporter_identity_mismatch");
    const execution = entry.execution;
    const vitest = execution.machine_command !== undefined || execution.registered_test_ids !== undefined;
    if (vitest && (execution.machine_command !== `npx vitest run ${result.target} --reporter=json`
        || !Array.isArray(execution.registered_test_ids)
        || execution.registered_test_ids.length === 0
        || execution.registered_test_ids.some((id) => typeof id !== "string"
          || !id.startsWith(`${result.target} > `))
        || new Set(execution.registered_test_ids).size !== execution.registered_test_ids.length)) {
      return reject("reporter_identity_mismatch");
    }
    ready.push({ entry, target: result.target, actual: result.actual, vitest });
  }
  // A file-wide reporter cannot assign the same leaf to two different cases.
  // Reject shared targets until a bound per-case test-id mapping exists.
  const targets = ready.map(({ actual }) => actual);
  if (new Set(targets).size !== targets.length) return reject("reporter_identity_mismatch");
  const cli = ready.some(({ vitest }) => vitest) ? vitestCli() : null;
  if (ready.some(({ vitest }) => vitest) && !cli) return reject("unsafe_target");
  const observations = [];
  const reports = [];
  const stderrReports = [];
  const commands = [];
  for (const { entry, target, actual, vitest } of ready) {
    const argv = vitest ? [cli, "run", target, "--reporter=json"] : [...NODE_TAP_ARGS, target];
    commands.push(argv);
    const child = await runChild(executable, argv, root, runner.signal);
    const raw = vitest ? child.stdout : child.output;
    reports.push(raw);
    stderrReports.push(child.stderr);
    const execution = { argv, exit_code: child.code, raw_output: reports.join("\n"),
      raw_output_sha256: sha256(reports.join("\n")),
      raw_stderr: stderrReports.join("\n"), source: "direct_runner", canonical_receipt: false,
      ...(vitest ? { reporter: "vitest-json" } : {}) };
    if (child.spawnError || child.timedOut || child.outputExceeded || child.aborted || child.childSignal) {
      return reject("test_failed", execution);
    }
    if (vitest) {
      const result = vitestResult(raw, target, actual, entry.execution.registered_test_ids, child.code);
      if (result.reason) return reject(result.reason, execution,
        result.tests ? [...observations.map((row) => ({ ...row, diagnostic_only: true })),
          ...diagnosticRows(entry, target, result.tests, raw, child.code, "direct_vitest_json")] : []);
      for (const test of result.tests) observations.push({ case_id: entry.id, test_file: target,
        full_id: test.full_id, status: test.status, exit_code: child.code,
        raw_report_sha256: sha256(raw), source: "direct_vitest_json", canonical_receipt: false });
    } else {
      const result = tapResult(raw, entry.execution.expected_test_identity, child.code);
      if (result.reason) return reject(result.reason, execution,
        result.tests ? [...observations.map((row) => ({ ...row, diagnostic_only: true })),
          ...diagnosticRows(entry, target, result.tests, raw, child.code, "direct_node_tap")] : []);
      observations.push({ case_id: entry.id, test_file: target,
        full_id: entry.execution.expected_test_identity, status: "passed", exit_code: child.code,
        raw_report_sha256: sha256(raw), source: "direct_node_tap", canonical_receipt: false });
    }
  }
  const raw_output = reports.join("\n");
  return Object.freeze({ status: "completed", observations: Object.freeze(observations),
    execution: { executable, argv: commands, exit_code: 0, test_count: observations.length, raw_output,
      raw_output_sha256: sha256(raw_output), raw_stderr: stderrReports.join("\n"),
      source: "direct_runner", canonical_receipt: false } });
}
