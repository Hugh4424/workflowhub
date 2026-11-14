#!/usr/bin/env node
// Task 1 / Phase P1 object driver for the two frozen routes.
//
// prepare: recompute the locked nineteen-file identity, copy the source carrier
// (with its existing node_modules) to the run copy root, prove the copy matches,
// build the copy, start this phase's own service on 41921 and leave a run state.
// collect: reuse only the gateway-selected owned Ego session (one engine), collect
// the four frozen cells (two routes x two viewports) through the existing
// single-dimension collectors, drive the six in-page demo states and publish the
// phase originals (service, result, capability, design comparison, interaction,
// coverage). It never calls runPageAudit()/runCli() and never selects an engine.
//
// The frozen oracle tests/acceptance/c12-two-pages.test.mjs owns the criteria.
// This file only produces the object facts. It writes no page, spec, v15, design
// source or skill byte. Interaction performance is not used as a pass signal.

import {spawn, spawnSync} from "node:child_process";
import {createHash, randomUUID} from "node:crypto";
import {
  closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, readdirSync,
  realpathSync, statSync, writeSync,
} from "node:fs";
import {cp, mkdir, readFile} from "node:fs/promises";
import {constants as fsConstants} from "node:fs";
import {dirname, isAbsolute, join, relative, resolve, sep} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {openTask} from "../../runtime/task/task-handle.mjs";
// One state observation rule for both this driver and the frozen judge; the
// page URL is the only observation source and a bare route stays unknown.
import {stateObservation} from "../../skills/frontend-testing/scripts/run-page-audit.mjs";

const WORKTREE = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const MODULE_URL = pathToFileURL(fileURLToPath(import.meta.url)).href;
const NEXT_BIN = "node_modules/next/dist/bin/next";
const PROJECT = "workflowhub";
const FILES = [
  "package.json", "package-lock.json", "next.config.ts", "tsconfig.json", "postcss.config.mjs",
  "app/layout.tsx", "app/globals.css", "app/data/view-model.ts", "app/data/live-mapping.ts",
  "app/data/pb-client.ts", "app/data/shared-data.ts", "app/simulation-board/page.tsx",
  "app/sim-workbench/page.tsx", "app/components/simulation-board-panels.tsx",
  "app/components/sim-workbench-panels.tsx", "app/ui/primitives.tsx", "app/ui/primitives.css",
  "app/ui/tokens-base.css", "app/ui/ui-contract.ts",
];
const ROUTES = ["/simulation-board", "/sim-workbench"];
const VIEWPORTS = ["1280x800", "390x844"];
const DIMENSIONS = ["console", "network", "overflow", "a11y", "perf"];
const DIM_SLUG = {console: "console", network: "network", overflow: "overflow", "a11y": "a11y", perf: "perf"};
const DEMO_STATES = ["frozen", "ready", "loading", "empty", "error", "unknown"];
const V15_ROOT = "docs/examples/c11-ui";
const V15_FILES = [
  "v15/2026-11-11-001-t019-v15-pending-busy-app.js",
  "v15/2026-11-11-002-t019-v15-pending-busy-index.html",
  "v15/2026-11-11-003-t019-v15-pending-busy-readme.md",
  "v15/2026-11-12-001-c11-query-writer.mjs",
  "v15/2026-11-12-002-c11-query-data.js",
  "v11/2026-11-10-001-t019-wf-native-next-v11-styles.css",
  "v12/2026-11-11-009-t019-v12-local-demo-styles.css",
];
const V15_AGGREGATE = "6dc77bf7469aeee3eb14837af318a8622f77a70fe4a1156b2e2ff7f272514f17";
const DESIGN_ROOT = "/Users/Hugh/Downloads/UI";
const DESIGN_AGGREGATE = "843d0e885e49789fa7af7b558004c707f89131445325c54631a128ea45404571";
const DESIGN_FIXED = ["index.html", "package.json", "pnpm-lock.yaml", "tsconfig.json", "vite.config.ts", ".figma/make/site.json"];
const C11_FINAL = "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c11-gap-repair-20261112/quality/evidence/c11-final-carrier.sha256";
const SOURCE_ROOT_DEFAULT = "/Users/Hugh/Hugh/Project/c09-carrier-new-20261103";
// Every complete run owns one evidence series. A series is chosen before any
// write and never overwrites an existing original: a second full run (or the
// frozen gate's own prepare/collect) gets the next free series, so raw
// originals written by skills/frontend-testing/scripts/collect-console.mjs
// cannot collide on a hard-link EEXIST. The 100 series is the first run; after
// that the next base is derived from the highest series already in the evidence
// directory, so repeated runs are not capped by a fixed pool.
const EVIDENCE_LAYOUT = {
  service: {offset: 0, name: "service", ext: "json"},
  result: {offset: 1, name: "result", ext: "json"},
  identity: {offset: 2, name: "identity", ext: "json"},
  boundary: {offset: 3, name: "boundary-before", ext: "json"},
  capability: {offset: 4, name: "capability", ext: "json"},
  design: {offset: 5, name: "design-compare", ext: "md"},
  interaction: {offset: 6, name: "interaction", ext: "json"},
  coverage: {offset: 7, name: "coverage", ext: "json"},
  design_facts: {offset: 8, name: "design-facts", ext: "json"},
  checks: {offset: 9, name: "collect-checks", ext: "json"},
};
const RAW_CELL_COUNT = 4;
const RAW_DIMENSION_COUNT = 5;
const FIRST_RUN = 100;
const SERIES_ALIGNMENT = 100;
const SERIES_CEILING = 9_000_000;
const PAGE_QUALITY_SUMMARY = "quality/evidence/2026-11-14-130-c12-p1-page-quality-findings.md";

function evidenceFamily(base) {
  const family = {base, rawFirst: base + 10};
  for (const [key, {offset, name, ext}] of Object.entries(EVIDENCE_LAYOUT)) {
    family[key] = `quality/evidence/2026-11-14-${base + offset}-two-pages-${name}.${ext}`;
  }
  return family;
}

function rawNameFor(rawFirst, cellIndex, dimension) {
  const cell = VIEWPORT_CELLS[cellIndex];
  const shortRoute = cell.route === "/simulation-board" ? "board" : "workbench";
  return `2026-11-14-${rawFirst + cellIndex * RAW_DIMENSION_COUNT + DIMENSIONS.indexOf(dimension)}-c12-p1-${DIM_SLUG[dimension]}-${shortRoute}-${cell.viewport}.json`;
}

function rawRefFor(family, cellIndex, dimension) {
  return `quality/evidence/${rawNameFor(family.rawFirst, cellIndex, dimension)}`;
}

// Current-run visual originals: one PNG per page per viewport, allocated after
// the twenty raw documents (base+30..base+33). PNG bytes are written only when
// the gateway-owned page actually renders the route at that viewport.
function shotNameFor(base, cellIndex) {
  const cell = VIEWPORT_CELLS[cellIndex];
  const shortRoute = cell.route === "/simulation-board" ? "board" : "workbench";
  return `2026-11-14-${base + 30 + cellIndex}-c12-p1-shot-${shortRoute}-${cell.viewport}.png`;
}

function shotRefFor(family, cellIndex) {
  return `quality/evidence/${shotNameFor(family.base, cellIndex)}`;
}

function familyRefs(family, keys = Object.keys(EVIDENCE_LAYOUT)) {
  const refs = keys.map((key) => family[key]);
  for (let cellIndex = 0; cellIndex < RAW_CELL_COUNT; cellIndex += 1) {
    for (const dimension of DIMENSIONS) refs.push(rawRefFor(family, cellIndex, dimension));
    refs.push(shotRefFor(family, cellIndex));
  }
  return refs;
}

// The numeric block of any evidence series file this driver owns: the family
// anchors (…-two-pages-*) and the raw cells/attempts (…-c12-p1-*). Other files
// under quality/evidence (supplements, foreign records) never pick the base.
function seriesOfEvidenceName(name) {
  const match = /^\d{4}-\d{2}-\d{2}-(\d{3,})-(?:two-pages-|c12-p1-)/.exec(name);
  return match ? Number(match[1]) : null;
}

// Allocate forward from the highest series present instead of a fixed pool. A
// 900-series exhaustion is not a dead end: the next aligned base is 1000 (the
// frozen judge's sequence regex accepts 3+ digits), then 1100, and so on.
function nextEvidenceBase(taskRoot) {
  let highest = null;
  try {
    for (const name of readdirSync(join(taskRoot, "quality/evidence"))) {
      const sequence = seriesOfEvidenceName(name);
      if (sequence === null || !Number.isSafeInteger(sequence)) continue;
      if (highest === null || sequence > highest) highest = sequence;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (highest === null) return FIRST_RUN;
  const next = Math.ceil((highest + 1) / SERIES_ALIGNMENT) * SERIES_ALIGNMENT;
  if (!Number.isSafeInteger(next) || next > SERIES_CEILING) throw fail("E_EVIDENCE_SERIES_RANGE", `next evidence series ${next} exceeds the supported range`, {exitCode: 3, highest});
  return next;
}

function selectEvidenceBase(taskRoot, requested) {
  const exists = (ref) => existsSync(join(taskRoot, ref));
  if (requested !== null) {
    const family = evidenceFamily(requested);
    const taken = familyRefs(family).filter(exists);
    if (taken.length) throw fail("E_EVIDENCE_EXISTS", `evidence series ${requested} already holds originals; choose a free base and never overwrite`, {exitCode: 3, taken: taken.slice(0, 5)});
    return family;
  }
  let base = nextEvidenceBase(taskRoot);
  // Never overwrite: if the aligned base is somehow occupied (for example a
  // partially written family), advance to the next free block instead.
  for (let guard = 0; guard < 1_000; guard += 1) {
    const family = evidenceFamily(base);
    if (!familyRefs(family).some(exists)) return family;
    base += SERIES_ALIGNMENT;
    if (base > SERIES_CEILING) break;
  }
  throw fail("E_EVIDENCE_SERIES_RANGE", `no free evidence series above ${base - SERIES_ALIGNMENT}`, {exitCode: 3});
}

function parseEvidenceBase(value) {
  if (value === undefined) return null;
  if (!/^[1-9][0-9]{1,3}$/.test(value)) throw usage("--evidence-series must be a positive numeric base");
  return Number(value);
}

async function recordNote(handle, slug, value) {
  try {
    return await handle.appendRecord({dir: "quality/evidence", slug, ext: "json", bytes: `${JSON.stringify(value, null, 2)}\n`});
  } catch { return null; }
}

function attemptExists(taskRoot, ref) {
  if (typeof ref !== "string" || !ref) return false;
  return existsSync(isAbsolute(ref) ? ref : join(taskRoot, ref));
}

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const text = (value) => typeof value === "string" && value.trim().length > 0;

function fail(code, message, extra) {
  return Object.assign(new Error(message), {code, ...(extra ?? {})});
}

function usage(message) {
  return fail("E_USAGE", message, {exitCode: 2});
}

function parseFlags(argv, required, optional = []) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) throw usage(`unexpected argument: ${token}`);
    const equals = token.indexOf("=");
    const name = equals < 0 ? token.slice(2) : token.slice(2, equals);
    const value = equals < 0 ? argv[++index] : token.slice(equals + 1);
    if (![...required, ...optional].includes(name)) throw usage(`unknown option --${name}`);
    if (value === undefined || value === "" || value.startsWith("--")) throw usage(`missing value for --${name}`);
    if (values[name] !== undefined) throw usage(`duplicate option --${name}`);
    values[name] = value;
  }
  for (const name of required) if (values[name] === undefined) throw usage(`missing --${name}`);
  return values;
}

function openHandle(taskRoot) {
  const manifest = JSON.parse(readFileSync(join(taskRoot, "task.json"), "utf8"));
  return openTask(taskRoot, {projectName: manifest.project_name, taskId: manifest.task_id});
}

function identityRow(root, path) {
  const file = join(root, path);
  const stat = statSync(file);
  return {path, sha256: sha256(readFileSync(file)), bytes: stat.size};
}

function identityRows(root, files = FILES) {
  return files.map((path) => identityRow(root, path));
}

function aggregateRows(rows, mode = "locale") {
  const sorted = [...rows].sort(mode === "locale"
    ? (left, right) => left.path.localeCompare(right.path)
    : (left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  return sha256(Buffer.from(sorted.map((row) => `${row.path}\0${row.sha256}\n`).join("")));
}

function lineOf(file, needle, occurrence = 0) {
  try {
    const rows = readFileSync(file, "utf8").split("\n");
    let seen = 0;
    for (let index = 0; index < rows.length; index += 1) {
      if (!rows[index].includes(needle)) continue;
      if (seen === occurrence) return index + 1;
      seen += 1;
    }
    return null;
  } catch { return null; }
}

async function publish(handle, ref, value) {
  const bytes = Buffer.from(typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`);
  const result = await handle.createRecord(ref, bytes);
  return {ref, idempotent: result.idempotent === true, sha256: sha256(bytes), bytes: bytes.length};
}

function evidenceAbs(taskRoot, ref) {
  return join(taskRoot, ref);
}

const VIEWPORT_CELLS = ROUTES.flatMap((route) => VIEWPORTS.map((viewport) => ({route, viewport})));
const CELLS = VIEWPORT_CELLS.map((cell, index) => ({...cell, index}));

function readJson(path) {
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch (error) { return {error: `${error.code ?? error.name}: ${error.message}`}; }
}

function fileSha(refAbs) {
  try { return sha256(readFileSync(refAbs)); } catch { return null; }
}

function runTimeout(command, args, options) {
  return spawnSync(command, args, {encoding: "utf8", timeout: 30_000, ...options});
}

async function httpStatus(url, timeoutMs = 3000) {
  try {
    const response = await fetch(url, {redirect: "error", signal: AbortSignal.timeout(timeoutMs)});
    return {ok: true, status: response.status};
  } catch (error) {
    return {ok: false, error: error.cause?.code ?? error.code ?? error.name, message: error.message};
  }
}

function startServer({copyRoot, port, logPath}) {
  const next = join(copyRoot, NEXT_BIN);
  if (!existsSync(next)) throw fail("E_BUILD", `next binary missing in copy: ${next}`, {exitCode: 5});
  const fd = openSync(logPath, "a");
  const child = spawn(process.execPath, [next, "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: copyRoot,
    detached: true,
    stdio: ["ignore", fd, fd],
    env: {...process.env, NEXT_TELEMETRY_DISABLED: "1"},
  });
  try { child.unref(); } finally { try { closeSync(fd); } catch {} }
  return child.pid;
}

async function waitService(baseUrl, routes, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await httpStatus(`${baseUrl}${routes[0]}`);
    if (last.ok && last.status === 200) {
      const second = await httpStatus(`${baseUrl}${routes[1]}`);
      if (second.ok && second.status === 200) return {ok: true, statuses: [last.status, second.status]};
      last = second;
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  return {ok: false, last};
}

function processStart(pid) {
  const result = runTimeout("ps", ["-p", String(pid), "-o", "lstart="]);
  return result.status === 0 && text(result.stdout) ? result.stdout.trim() : null;
}

function processRow(pid) {
  const result = runTimeout("ps", ["-ww", "-p", String(pid), "-o", "pid=,command="]);
  return result.status === 0 && text(result.stdout) ? result.stdout.trim() : null;
}

function portOwners(port) {
  const result = runTimeout("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"]);
  if (result.status !== 0 || !text(result.stdout)) return [];
  return result.stdout.split(/\s+/).filter(Boolean).map(Number);
}

function serviceIdentity(pid, copyRoot, port, expectedStart = null) {
  if (!Number.isInteger(pid) || pid <= 0) return {owned: false, reason: "run state has no pid"};
  const start = processStart(pid);
  const row = processRow(pid);
  const owners = portOwners(port);
  if (!start) return {owned: false, reason: "process not present", ps_exit: 1};
  const startMatch = !expectedStart || expectedStart === start;
  const portMatch = owners.includes(pid);
  // `next start` rewrites its process title to "next-server (v16.4.3)", so argv
  // is not a durable marker. Ownership is the recorded start time plus the
  // listener owned by that same pid; both must agree.
  return {owned: startMatch && portMatch, row: row?.slice(0, 400) ?? null, start, expected_start: expectedStart, port_owner: portMatch, owners};
}

async function stopServer(runState) {
  const identity = serviceIdentity(runState.pid, runState.copyRoot, runState.port, runState.process_identity?.start ?? null);
  const stoppedAt = new Date().toISOString();
  if (!identity.owned) {
    return {stopped: false, attempted: true, stopped_at: stoppedAt, identity, reason: "pid is not the owned next start; not signalled"};
  }
  try { process.kill(-runState.pid, "SIGTERM"); }
  catch (error) {
    if (error.code !== "ESRCH") return {stopped: false, attempted: true, stopped_at: stoppedAt, identity, error: error.code};
  }
  let exited = false;
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try { process.kill(runState.pid, 0); }
    catch (error) { if (error.code === "ESRCH") { exited = true; break; } throw error; }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  let forced = false;
  if (!exited) {
    try { process.kill(-runState.pid, "SIGKILL"); } catch (error) { if (error.code !== "ESRCH") return {stopped: false, attempted: true, stopped_at: stoppedAt, identity, error: error.code}; }
    forced = true;
    const forcedDeadline = Date.now() + 5000;
    while (Date.now() < forcedDeadline) {
      try { process.kill(runState.pid, 0); }
      catch (error) { if (error.code === "ESRCH") { exited = true; break; } throw error; }
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
    }
  }
  const probe = await httpStatus(`http://127.0.0.1:${runState.port}/simulation-board`, 2000);
  const curl = runTimeout("curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "2", `http://127.0.0.1:${runState.port}/simulation-board`]);
  return {
    stopped: exited,
    attempted: true,
    signal: forced ? "SIGTERM,SIGKILL" : "SIGTERM",
    stopped_at: stoppedAt,
    identity,
    post_stop_http: probe,
    curl_exit: curl.status,
    curl_http_code: text(curl.stdout) ? curl.stdout.trim() : null,
    port_closed: !probe.ok,
  };
}

function designIdentity() {
  try {
    const files = [...DESIGN_FIXED];
    const walk = (directory, prefix) => {
      for (const entry of readdirSync(directory, {withFileTypes: true})) {
        if (["node_modules", "dist", ".vite"].includes(entry.name)) continue;
        const path = join(directory, entry.name);
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) walk(path, rel);
        else if (/\.(ts|tsx|css)$/.test(entry.name)) files.push(rel);
      }
    };
    walk(join(DESIGN_ROOT, "src"), "src");
    const rows = files.map((path) => identityRow(DESIGN_ROOT, path));
    return {
      root: DESIGN_ROOT,
      files: rows,
      aggregate: aggregateRows(rows, "path"),
      expected_aggregate: DESIGN_AGGREGATE,
      matches: aggregateRows(rows, "path") === DESIGN_AGGREGATE,
      read_at: new Date().toISOString(),
      algorithm: "sha256 per file; sorted by path code point; path\\0sha256\\n concatenated; sha256",
    };
  } catch (error) {
    return {root: DESIGN_ROOT, unavailable: true, error: `${error.code ?? error.name}: ${error.message}`};
  }
}

function v15Identity() {
  try {
    const root = join(WORKTREE, V15_ROOT);
    const rows = V15_FILES.map((path) => identityRow(root, path));
    const aggregate = aggregateRows(rows, "path");
    return {
      root: V15_ROOT,
      files: rows,
      aggregate,
      expected_aggregate: V15_AGGREGATE,
      matches: aggregate === V15_AGGREGATE,
      algorithm: "sha256 per file; paths relative to docs/examples/c11-ui; sorted by path; path\\0sha256\\n concatenated; sha256",
    };
  } catch (error) {
    return {root: V15_ROOT, unavailable: true, error: `${error.code ?? error.name}: ${error.message}`};
  }
}

// ---------------------------------------------------------------------------
// prepare
// ---------------------------------------------------------------------------

async function prepare(argv) {
  const options = parseFlags(argv, ["run-id", "source-root", "copy-root", "port", "task-record-root"], ["evidence-series"]);
  const runId = options["run-id"];
  const sourceRoot = resolve(options["source-root"]);
  const copyRoot = resolve(options["copy-root"]);
  const port = Number(options.port);
  const taskRoot = resolve(options["task-record-root"]);
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(runId)) throw usage("--run-id must match [a-z0-9][a-z0-9-]{0,63}");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw usage("--port must be a TCP port");
  if (sourceRoot === copyRoot) throw usage("copy root must differ from the read-only source root");
  const handle = openHandle(taskRoot);
  // This prepare owns one free evidence series; no existing original is reused
  // as this run's identity or overwritten later.
  const evidence = selectEvidenceBase(taskRoot, parseEvidenceBase(options["evidence-series"]));
  const runDir = dirname(copyRoot);
  mkdirSync(runDir, {recursive: true});
  const statePath = join(runDir, `${runId}-run-state.json`);
  const preparedAt = new Date().toISOString();

  // 1. Read-only identity before any copy.
  const sourceRows = identityRows(sourceRoot);
  const sourceAggregate = aggregateRows(sourceRows);

  // 2. Copy the carrier with its existing node_modules. Build outputs are not
  // copied so the build below is this run's own.
  const copyExisted = existsSync(join(copyRoot, "package.json"));
  if (copyExisted) {
    const prior = readJson(statePath);
    if (prior.error || prior.source_root !== sourceRoot || prior.run_id !== runId) {
      throw fail("E_COPY_ROOT_OCCUPIED", `copy root already exists without this run's state: ${copyRoot}`, {exitCode: 3});
    }
  } else {
    await cp(sourceRoot, copyRoot, {
      recursive: true,
      force: false,
      mode: fsConstants.COPYFILE_FICLONE,
      filter: (path) => !path.includes(`${sep}.next`) && !path.endsWith("tsconfig.tsbuildinfo") && !path.includes(`${sep}.git${sep}`) && !path.endsWith(`${sep}.git`),
    });
  }

  const copyRows = identityRows(copyRoot);
  const copyAggregate = aggregateRows(copyRows);
  const identity = {
    schema: "c12-two-pages-identity/1",
    object: "two-pages",
    run_id: runId,
    source_root: sourceRoot,
    copy_root: copyRoot,
    files: sourceRows,
    aggregate: sourceAggregate,
    copy_files: copyRows,
    copy_aggregate: copyAggregate,
    algorithm: "sha256 per file; sorted by path localeCompare; path\\0sha256\\n concatenated; sha256",
    status: sourceAggregate === copyAggregate ? "match" : "mismatch",
    checked_at: preparedAt,
    consumer: "P1 object judgment, Phase 3 copy reuse, Phase 4 identity recheck",
  };
  if (sourceAggregate !== copyAggregate) {
    const record = await handle.appendRecord({
      dir: "quality/evidence",
      slug: "c12-p1-identity-mismatch",
      ext: "json",
      bytes: `${JSON.stringify(identity, null, 2)}\n`,
    });
    throw fail("E_IDENTITY_MISMATCH", "copy identity differs from source; startup refused", {exitCode: 4, identity_ref: record});
  }
  let identityRef;
  try {
    identityRef = await publish(handle, evidence.identity, identity);
  } catch (error) {
    // A retry after a later step failed must not turn an unchanged identity into
    // a conflict. Reuse the original only when every identity row is identical.
    if (error.code !== "RECORD_CONFLICT") throw error;
    const prior = readJson(evidenceAbs(taskRoot, evidence.identity));
    const same = prior && !prior.error && prior.aggregate === sourceAggregate && prior.copy_aggregate === copyAggregate && prior.status === "match"
      && JSON.stringify(prior.files) === JSON.stringify(sourceRows) && JSON.stringify(prior.copy_files) === JSON.stringify(copyRows);
    if (!same) throw error;
    identityRef = {ref: evidence.identity, idempotent: true, sha256: fileSha(evidenceAbs(taskRoot, evidence.identity))};
  }

  // 3. Build the copy with the existing runtime, captured as a real command.
  // From the first moment this run may own a service, every later failure is
  // cleaned up by the catch below; the first error survives and the stop result
  // is recorded. A registered process that never listened is still reclaimed by
  // its recorded pid and start identity.
  const serviceLog = join(runDir, `${runId}-service.log`);
  const baseUrl = `http://127.0.0.1:${port}`;
  let build;
  let pid = null;
  let ready = null;
  let processIdentity = null;
  let serviceStartedAt = null;
  try {
    build = await handle.captureCommand({
      cwd: copyRoot,
      slug: "c12-p1-build",
      argv: [process.execPath, join(copyRoot, NEXT_BIN), "build"],
      timeoutMs: 600_000,
    });
    if (build.exit_code !== 0) {
      throw fail("E_BUILD", `next build failed with exit ${build.exit_code}`, {exitCode: 5, build_ref: build.receipt_ref, output_ref: build.output_ref});
    }

    // 4. Start (or reuse this run's still-running) service and prove both routes.
    const priorState = readJson(statePath);
    if (!priorState.error && priorState.run_id === runId && Number.isInteger(priorState.pid) && serviceIdentity(priorState.pid, priorState.copy_root, port, priorState.process_identity?.start ?? null).owned) {
      pid = priorState.pid;
      processIdentity = priorState.process_identity ?? {pid, start: processStart(pid)};
      ready = await waitService(baseUrl, ROUTES, 10_000);
      serviceStartedAt = priorState.service_started_at ?? new Date().toISOString();
    } else {
      const inUse = await httpStatus(`${baseUrl}${ROUTES[0]}`, 1500);
      if (inUse.ok || inUse.status) {
        throw fail("E_PORT_IN_USE", `port ${port} already answers but is not this run's owned service`, {exitCode: 6, inUse});
      }
      pid = startServer({copyRoot, port, logPath: serviceLog});
      serviceStartedAt = new Date().toISOString();
      for (let attempt = 0; attempt < 20 && !processIdentity?.start; attempt += 1) {
        await new Promise((resolvePromise) => setTimeout(resolvePromise, 50));
        processIdentity = {pid, start: processStart(pid)};
      }
      ready = await waitService(baseUrl, ROUTES);
      if (!ready.ok) {
        throw fail("E_SERVICE", `two-pages service did not answer on ${baseUrl}`, {exitCode: 6, ready, service_log: serviceLog});
      }
    }

  // 5. Boundary-before original: three identities and the declared write set.
  // It is written after the service is up and before any browser measurement.
  const git = runTimeout("git", ["status", "--porcelain", "--untracked-files=all"], {cwd: WORKTREE, timeout: 30_000});
  const boundary = {
    schema: "c12-two-pages-boundary-before/1",
    run_id: runId,
    recorded_at: new Date().toISOString(),
    worktree: WORKTREE,
    branch: runTimeout("git", ["branch", "--show-current"], {cwd: WORKTREE}).stdout.trim() || null,
    head: runTimeout("git", ["rev-parse", "HEAD"], {cwd: WORKTREE}).stdout.trim() || null,
    two_pages: {source_root: sourceRoot, files: sourceRows, aggregate: sourceAggregate, bytes: sourceRows.reduce((sum, row) => sum + row.bytes, 0)},
    v15: v15Identity(),
    design_source: designIdentity(),
    write_set: {
      allowed_new: ["tests/acceptance/c12-two-pages.mjs", "tests/acceptance/c12-two-pages.test.mjs"],
      allowed_runtime_copy: [copyRoot],
      protected: [
        "specs/**", "decision-log.md", "/Users/Hugh/Hugh/Project/c09-carrier-new-20261103",
        "docs/examples/c11-ui", "/Users/Hugh/Downloads/UI",
        "skills/frontend-testing/scripts/run-page-audit.mjs",
        "skills/isolated-browser-qa/scripts/browser-qa-session.mjs",
      ],
      evidence_dir: "quality/evidence", tests_dir: "quality/tests", reviews_dir: "quality/reviews",
      note: "This phase writes only the two declared new files plus task evidence; no Git commit in this run.",
    },
    git_status: {argv: ["git", "status", "--porcelain", "--untracked-files=all"], cwd: WORKTREE, exit: git.status, signal: git.signal, stdout: git.stdout ?? "", stderr: git.stderr ?? ""},
    notes: [
      "Design source identity uses the D-002 file set and code-point path order; the expected 843d0e88... aggregate is the current baseline and is rechecked at collect time.",
      "The v15 seven-file identity is carried only as a Phase 4 boundary input; this phase does not run the v15 object.",
    ],
  };
  let boundaryRef;
  try {
    boundaryRef = await publish(handle, evidence.boundary, boundary);
  } catch (error) {
    if (error.code !== "RECORD_CONFLICT") throw error;
    const record = await handle.appendRecord({dir: "quality/evidence", slug: "c12-p1-boundary-before-rerun", ext: "json", bytes: `${JSON.stringify(boundary, null, 2)}\n`});
    boundaryRef = {ref: record, idempotent: true, sha256: fileSha(join(taskRoot, record))};
  }
  const runState = {
    schema: "c12-two-pages-run-state/1",
    run_id: runId,
    source_root: sourceRoot,
    copy_root: copyRoot,
    port,
    base_url: baseUrl,
    pid,
    process_identity: processIdentity,
    service_log: serviceLog,
    task_root: taskRoot,
    prepared_at: preparedAt,
    service_started_at: serviceStartedAt,
    ready,
    aggregate: sourceAggregate,
    evidence_base: evidence.base,
    build: {receipt_ref: build.receipt_ref, output_ref: build.output_ref, exit_code: build.exit_code, argv: build.argv, cwd: build.cwd, started_at: build.started_at, ended_at: build.ended_at},
    identity_ref: identityRef.ref,
    boundary_ref: boundaryRef.ref,
    gateway_required: true,
  };
  const stateBytes = Buffer.from(`${JSON.stringify(runState, null, 2)}\n`);
  const temporary = `${statePath}.${process.pid}.tmp`;
  const fd = openSync(temporary, "wx", 0o600);
  try { writeSync(fd, stateBytes); fsyncSync(fd); } finally { closeSync(fd); }
  // Replacing this run's own state file is not an evidence original.
  const {renameSync} = await import("node:fs");
  renameSync(temporary, statePath);

  process.stdout.write(`${JSON.stringify({
    ok: true, step: "prepare", run_id: runId, evidence_base: evidence.base, identity_ref: identityRef.ref, identity_sha256: identityRef.sha256,
    boundary_ref: boundaryRef.ref, aggregate: sourceAggregate, copy_root: copyRoot, port, pid,
    build_ref: build.receipt_ref, service: {base_url: baseUrl, ready},
  })}\n`);
  return 0;
  } catch (error) {
    // Reclaim only this run's recorded process; prepare never leaves an orphan
    // next behind, even when the process has not started listening yet.
    const stop = pid ? await stopServer({pid, copyRoot, port, process_identity: processIdentity}) : null;
    const cleanupRef = pid ? await recordNote(handle, "c12-p1-prepare-cleanup", {
      schema: "c12-two-pages-prepare-cleanup/1",
      run_id: runId,
      failed_at: new Date().toISOString(),
      evidence_base: evidence.base,
      code: error.code ?? error.name,
      message: String(error.message).slice(0, 2000),
      pid,
      stop,
      first_error_preserved: true,
    }) : null;
    error.cleanup = {ref: cleanupRef, stop, first_error: String(error.message).slice(0, 2000)};
    throw error;
  }
}

// ---------------------------------------------------------------------------
// collect
// ---------------------------------------------------------------------------

function relativeRef(taskRoot, absolute) {
  return relative(taskRoot, absolute).split(sep).join("/");
}

function taskFile(taskRoot, ref) {
  return isAbsolute(ref) ? ref : join(taskRoot, ref);
}

function rawDocProblems(doc, cell, context) {
  const problems = [];
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return ["raw document is not an object"];
  // A collector failure is kept as its own attempt original; it is never an
  // acquired raw dimension even though it carries the same five-key shape.
  if (doc.collector_status === "failed") problems.push("collector failure original must not be counted as an acquired raw document");
  if (typeof doc.engine !== "string" || typeof doc.observed_at !== "string" || !Array.isArray(doc.items) || !Array.isArray(doc.failures)) {
    problems.push("raw document must retain engine, observed_at, items and failures");
  }
  for (const key of ["workspace", "service", "route", "state", "viewport", "engine", "engine_session", "object_version"]) {
    if (typeof doc.object?.[key] !== "string" || !doc.object[key]) problems.push(`identity missing: ${key}`);
  }
  if (typeof doc.engine === "string" && doc.engine !== context.engine) problems.push("raw engine differs from the gateway-selected engine");
  for (const key of ["route", "state", "viewport"]) if (doc.object?.[key] !== (key === "state" ? "frozen" : cell[key])) problems.push(`object ${key} differs from its cell`);
  if (doc.object?.engine_session !== context.engine_session) problems.push("engine_session differs from the gateway session");
  if (doc.object?.object_version !== context.aggregate) problems.push("object_version differs from the locked aggregate");
  return problems;
}

function liveProbe() {
  const args = ["-s", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "2", "http://127.0.0.1:18844/"];
  const result = runTimeout("curl", args);
  const code = text(result.stdout) ? result.stdout.trim() : null;
  let state;
  let reason;
  if (result.error || result.status === null) {
    state = "probe_failed";
    reason = `curl 探测工具失败（${result.error?.code ?? "no exit code"}）；探测失败不等于端口无监听。`;
  } else if (result.status === 0 && code && /^[1-5]\d\d$/.test(code) && code !== "000") {
    state = "reachable_unverified";
    reason = `127.0.0.1:18844 返回 HTTP ${code}，但 P1 未验证 live 页面；可达不等于页面可用，保持未测。`;
  } else if (result.status === 7 || code === "000" || code === null) {
    state = "port_closed";
    reason = `端口无监听（curl exit ${result.status}, http=${code ?? "none"}）；不构造数据或伪格。`;
  } else {
    state = "probe_failed";
    reason = `curl 探测失败（exit ${result.status}, http=${code ?? "none"}）；不据此判 live 不可用。`;
  }
  return {
    url: "http://127.0.0.1:18844/",
    argv: ["curl", ...args],
    exit: result.status,
    http_code: code,
    stderr: text(result.stderr) ? result.stderr.trim().slice(0, 500) : null,
    state,
    reachable: state === "reachable_unverified",
    meaning: reason,
  };
}

function c11Comparison(sourceRoot) {
  let lines;
  try {
    lines = readFileSync(C11_FINAL, "utf8").split("\n").map((line) => line.trim()).filter(Boolean);
  } catch (error) {
    return {source: C11_FINAL, unavailable: true, valid: false, error: `${error.code ?? error.name}: ${error.message}`};
  }
  // The list is an external carrier: validate it before it can support any
  // verdict. Ten valid, unique rows inside the locked nineteen are required; a
  // malformed or empty list is 未测, never 0/0 == 可用.
  const validation_errors = [];
  const rows = [];
  for (const [index, line] of lines.entries()) {
    const match = /^([0-9a-f]{64})\s+(\S.*)$/.exec(line);
    if (!match) {
      validation_errors.push(`line ${index + 1} is not "sha256  path"`);
      continue;
    }
    rows.push({path: match[2], expectedSha: match[1]});
  }
  if (lines.length !== 10) validation_errors.push(`expected 10 list rows, got ${lines.length}`);
  if (rows.length !== 10) validation_errors.push(`expected 10 valid rows, got ${rows.length}`);
  const uniquePaths = new Set(rows.map((row) => row.path));
  if (uniquePaths.size !== rows.length) validation_errors.push("list paths are not unique");
  const unexpected = rows.filter((row) => !FILES.includes(row.path)).map((row) => row.path);
  if (unexpected.length) validation_errors.push(`paths outside the locked nineteen: ${unexpected.slice(0, 3).join(", ")}`);
  const valid = validation_errors.length === 0;
  const compared = rows.map((row) => {
    try {
      const actual = sha256(readFileSync(join(sourceRoot, row.path)));
      return {...row, current_sha256: actual, matches: actual === row.expectedSha, error: null};
    } catch (error) {
      return {...row, current_sha256: null, matches: false, error: `${error.code ?? error.name}: ${error.message}`};
    }
  });
  return {source: C11_FINAL, list_rows: lines.length, valid, validation_errors, count: compared.length, matched: compared.filter((row) => row.matches).length, rows: compared};
}

// Per-route expectations come from the frozen source (DataPanel renders
// "模拟记录" on the board and "运行详情" on the workbench); the workbench entry
// is opened with a real record id, so frozen/ready show workbench content.
function interactionExpectations(route, observation) {
  const name = route === "/simulation-board" ? "模拟记录" : "运行详情";
  const panelStates = {
    loading: {panel: "loading", role: "status", busy: "true", heading: `正在加载${name}`},
    empty: {panel: "empty", role: "status", busy: "false", heading: `暂无${name}`},
    error: {panel: "error", role: "alert", busy: "false", heading: `${name}读取失败`},
    unknown: {panel: "unknown", role: "status", busy: "false", heading: "运行结果尚未取得"},
  };
  const expected = route === "/simulation-board"
    ? {frozen: {panel: false, cards: 8}, ready: {panel: false, cards: 8}, ...panelStates}
    : {frozen: {panel: false, cards: 0}, ready: {panel: false, cards: 0}, ...panelStates};
  const row = expected[observation.state];
  if (!row) return {matches: false, problems: ["unknown demo state"]};
  const problems = [];
  const panel = observation.panel;
  if (row.panel === false) {
    if (panel) problems.push("ready/frozen must not render the data-state panel");
    if (observation.cards !== row.cards) problems.push(`expected ${row.cards} cards`);
  } else {
    if (!panel) problems.push("data-state panel missing");
    else {
      if (panel.state !== row.panel) problems.push(`panel state ${panel.state}`);
      if (panel.role !== row.role) problems.push(`panel role ${panel.role}`);
      if (panel.busy !== row.busy) problems.push(`panel aria-busy ${panel.busy}`);
      if (panel.heading !== row.heading) problems.push(`panel heading ${panel.heading}`);
    }
  }
  return {matches: problems.length === 0, expected, problems};
}

function collectInteractionSummary(interaction) {
  const pages = Array.isArray(interaction?.pages) ? interaction.pages : [];
  const rows = ROUTES.map((route) => {
    const page = pages.find((item) => item?.route === route) ?? null;
    const states = Array.isArray(page?.states) ? page.states : [];
    const expectations = states.map((state) => ({state: state.state, ...interactionExpectations(route, state)}));
    const present = DEMO_STATES.filter((name) => states.some((state) => state.state === name));
    return {
      route,
      url: page?.url ?? null,
      state_count: states.length,
      complete: present.length === DEMO_STATES.length && states.length === DEMO_STATES.length,
      missing_states: DEMO_STATES.filter((name) => !present.includes(name)),
      matched: expectations.filter((row) => row.matches).length,
      mismatches: expectations.filter((row) => !row.matches),
      errors: Array.isArray(page?.errors) ? page.errors : [],
      expectations,
    };
  });
  return {
    rows,
    complete: rows.every((row) => row.complete && row.matched === DEMO_STATES.length && row.errors.length === 0),
    any: rows.some((row) => row.state_count > 0),
    errors: rows.flatMap((row) => row.errors),
  };
}

function capabilityDocument({context, runState, worker, build, c11, live, evidence, coverage, interactionSummary, designFactsRef, checksRef}) {
  const source = (file) => join(runState.source_root, file);
  const boardPanels = source("app/components/simulation-board-panels.tsx");
  const workbenchPanels = source("app/components/sim-workbench-panels.tsx");
  const primitives = source("app/ui/primitives.tsx");
  const globals = source("app/globals.css");
  const facts = Array.isArray(worker.designFacts) ? worker.designFacts : [];
  const fact = (route, viewport) => facts.find((item) => item.route === route && item.viewport === viewport && !item.unavailable) ?? null;
  const boardFacts = fact("/simulation-board", "1280x800");
  const workbenchFacts = fact("/sim-workbench", "1280x800");
  const cellOf = (route, viewport) => coverage.cells.find((cell) => cell.route === route && cell.viewport === viewport) ?? null;
  const dimEntry = (route, viewport, dimension) => cellOf(route, viewport)?.dimensions?.[dimension] ?? null;
  const dimOk = (route, viewport, dimension) => typeof dimEntry(route, viewport, dimension) === "string";
  const dimReceipt = (route, viewport, dimension) => {
    const entry = dimEntry(route, viewport, dimension);
    if (typeof entry === "string") return {ref: entry};
    if (entry?.attempt_ref) return {ref: entry.attempt_ref, note: entry.reason ?? "采集失败原件"};
    return null;
  };
  const acquiredCount = (dimension) => CELLS.filter((cell) => dimOk(cell.route, cell.viewport, dimension)).length;
  const a11yCount = acquiredCount("a11y");
  const overflowCount = acquiredCount("overflow");
  const perfCount = acquiredCount("perf");
  const c11Verdict = c11.unavailable || c11.valid !== true ? "未测" : c11.matched === c11.count ? "可用" : "部分可用";
  const countOf = (item, key) => Number(item?.counts?.[key] ?? 0);
  const primitiveSpecs = [
    {name: "Metric", key: "metric", exportNeedle: "export function Metric", file: "app/components/simulation-board-panels.tsx", needle: "import { Metric,", pages: ["board", "workbench"]},
    {name: "UiStatusBadge", key: "badge", exportNeedle: "export function UiStatusBadge", file: "app/components/simulation-board-panels.tsx", needle: "import { Metric,", pages: ["board", "workbench"]},
    {name: "UiAction", key: "action", exportNeedle: "export function UiAction", file: "app/components/simulation-board-panels.tsx", needle: "import { Metric,", pages: ["board", "workbench"]},
    {name: "UiLineage", key: "lineage", exportNeedle: "export function UiLineage", file: "app/components/sim-workbench-panels.tsx", needle: "import { UiAction, UiLineage", pages: ["workbench"]},
  ];
  const primitiveChecks = primitiveSpecs.map((spec) => {
    const exportLine = lineOf(primitives, spec.exportNeedle);
    const callLine = lineOf(source(spec.file), spec.needle);
    const counts = {board: countOf(boardFacts, spec.key), workbench: countOf(workbenchFacts, spec.key)};
    const missing = [];
    if (!exportLine) missing.push("primitives export missing");
    if (!callLine) missing.push(`panel import missing (${spec.file})`);
    if (spec.pages.includes("board") && counts.board <= 0) missing.push("board DOM count is 0");
    if (spec.pages.includes("workbench") && counts.workbench <= 0) missing.push("workbench DOM count is 0");
    return {primitive: spec.name, call_site: callLine ? `${spec.file}:${callLine}` : null, export_line: exportLine, counts, expected_pages: spec.pages, ok: missing.length === 0, missing};
  });
  const allPrimitives = primitiveChecks.every((row) => row.ok);
  const somePrimitives = primitiveChecks.some((row) => row.ok);
  const c03Verdict = !designFactsRef || !boardFacts || !workbenchFacts ? "未测" : allPrimitives ? "可用" : somePrimitives ? "部分可用" : "未测";
  const c03Reason = !designFactsRef || !boardFacts || !workbenchFacts
    ? "DOM 计数原件缺失或设计事实采集失败；不把派生件里的计数当原始回执。"
    : allPrimitives
      ? "四类 primitives 的源码导出、panels 调用点与两页 DOM 计数逐项一致。"
      : `逐项校验未全通过：${primitiveChecks.filter((row) => !row.ok).map((row) => `${row.primitive}(${row.missing.join(", ")})`).join("；")}`;
  const globalsText = (() => { try { return readFileSync(globals, "utf8"); } catch { return ""; } })();
  const declaredMatch = globalsText.match(/--inline-action-gap:\s*([^;}\s]+)/);
  const declaredToken = declaredMatch ? declaredMatch[1].trim() : null;
  const recordedToken = coverage?.computed_values?.inline_action_gap ?? null;
  const computedToken = workbenchFacts?.token ? String(workbenchFacts.token).trim() : null;
  const computedGap = workbenchFacts?.inlineGap ? String(workbenchFacts.inlineGap).trim() : null;
  const availableFacts = facts.filter((item) => !item.unavailable);
  const allTokens = availableFacts.map((item) => (item.token ? String(item.token).trim() : null));
  const allGaps = availableFacts.map((item) => (item.inlineGap ? String(item.inlineGap).trim() : null));
  const tokenConsistent = Boolean(
    declaredToken && computedToken && computedGap && recordedToken
    && recordedToken.declared === declaredToken
    && recordedToken.computed === computedToken
    && recordedToken.gap === computedGap
    && availableFacts.length > 0
    && allTokens.every((value) => value === declaredToken)
    && allGaps.every((value) => value === null || value === declaredToken)
  );
  const c04Verdict = !declaredToken || !computedToken ? "未测" : tokenConsistent ? "可用" : "部分可用";
  const c04Reason = c04Verdict === "可用"
    ? `token 三方一致：声明 ${declaredToken}、计算根值 ${computedToken}、覆盖件记录 ${recordedToken?.computed ?? "未记录"}。`
    : `token 不一致或缺失：声明=${declaredToken ?? "未取得"}、计算=${computedToken ?? "未取得"}、gap=${computedGap ?? "未取得"}、覆盖件记录=${recordedToken ? JSON.stringify(recordedToken) : "未记录"}。`;
  const interactionVerdict = interactionSummary.complete ? "可用" : interactionSummary.any ? "部分可用" : "未测";
  const interactionReason = interactionSummary.complete
    ? "两页各六个演示态均由页内 select 实际取得，终态与源码期望一致（12/12）。"
    : `两页六态未全部取得：${interactionSummary.rows.map((row) => `${row.route} ${row.state_count}/6 matched ${row.matched}/6 errors ${row.errors.length}`).join("；")}。`;
  const buildVerdict = Number.isInteger(build?.exit_code) && build.exit_code === 0 ? "可用" : "未测";
  const rows = [
    {
      id: "C02-P1-two-pages",
      capability: "查询→页面选择",
      object: "two-pages",
      call_site: null, input: null, output: null, consumer: null,
      verdict: "未测",
      reason: "两页没有查询调用点，使用冻结样例；本格按已锁矩阵记未测，不判不可用。",
      owner: "用户",
      recovery_condition: "提供两页的查询入口后重采；当前按矩阵无调用点。",
      receipts: [evidence.identity],
    },
    {
      id: "C02-P2",
      capability: "经验被页面采用",
      object: "two-pages",
      call_site: null, input: null, output: null, consumer: null,
      verdict: "未测",
      reason: "需具名后续真实任务读取新版；同任务重放不算后续采用。",
      owner: "用户/后续任务 owner",
      recovery_condition: "具名后续任务读取新版并回读 C10 后重判。",
      receipts: [],
    },
    {
      id: "C03-P1",
      capability: "四对象页面使用点",
      object: "two-pages",
      call_site: Object.fromEntries(primitiveChecks.map((row) => [row.primitive, row.call_site])),
      input: "primitives props 与 panels 组合；冻结样例 view-model",
      output: "DOM 标记 pb-ui-metric / pb-ui-status-badge / pb-ui-action / pb-ui-lineage",
      consumer: "产品内：两页渲染",
      verdict: c03Verdict,
      reason: c03Reason,
      owner: c03Verdict === "可用" ? null : "实现 owner/用户",
      recovery_condition: c03Verdict === "可用" ? null : "逐项核对 primitives 导出、panels 调用点与两页 DOM 计数；缺项修复后重采 design-facts。",
      receipts: [
        {ref: designFactsRef, note: "两页 DOM 计数原始载体（C03-P1/C04-P1）"},
        ...(dimReceipt("/simulation-board", "1280x800", "a11y") ? [dimReceipt("/simulation-board", "1280x800", "a11y")] : []),
        ...(dimReceipt("/simulation-board", "1280x800", "console") ? [dimReceipt("/simulation-board", "1280x800", "console")] : []),
        {ref: evidence.interaction},
      ].filter(Boolean),
      runtime: {primitives: primitiveChecks, board_1280: boardFacts?.counts ?? null, workbench_1280: workbenchFacts?.counts ?? null},
    },
    {
      id: "C03-P2",
      capability: "资产/页面两层检查",
      object: "two-pages",
      call_site: {asset: "app/ui/primitives.tsx", page: "两页 DOM 标记"},
      input: "设计源组件、primitives 源码、DOM",
      output: "DOM 标记计数；资产层源码对照",
      consumer: "验收：Phase 4 报告与复查者",
      verdict: designFactsRef ? "部分可用" : "未测",
      reason: "资产层与页面层现状已取证；删 import 的构建红负例未在 P1 重跑，因为它会改变副本字节并干扰 Phase 3 交接，留给独立判定。",
      owner: "独立审查者/Phase 4",
      recovery_condition: "独立审查者在隔离副本执行删 import 构建负例后补该维。",
      receipts: [{ref: evidence.design}, ...(designFactsRef ? [{ref: designFactsRef}] : []), {ref: evidence.interaction}],
    },
    {
      id: "C04-P1",
      capability: "来源→页面使用点（token）",
      object: "two-pages",
      call_site: {
        token: `app/globals.css:${lineOf(globals, "--inline-action-gap:12px")}`,
        rule: `app/globals.css:${lineOf(globals, ".inlineactions{")}`,
        primitives_css: `app/ui/primitives.tsx:${lineOf(primitives, 'import "./tokens-base.css"')}`,
      },
      input: "设计源 ui 源与 PB token 规范",
      output: "计算值 --inline-action-gap 与 .inlineactions gap",
      consumer: "产品内：两页样式；验收：P1 对照表",
      verdict: c04Verdict,
      reason: c04Reason,
      owner: c04Verdict === "可用" ? null : "实现 owner/用户",
      recovery_condition: c04Verdict === "可用" ? null : "核对 globals.css 声明、浏览器计算值与覆盖件记录，三者一致后重采。",
      receipts: [...(designFactsRef ? [{ref: designFactsRef}] : []), {ref: evidence.design}, {ref: evidence.interaction}],
      runtime: {declared: declaredToken, computed: computedToken, gap: computedGap, recorded: recordedToken, facts: availableFacts.map((item) => ({route: item.route, viewport: item.viewport, token: item.token, inline_gap: item.inlineGap}))},
    },
    {
      id: "C05-P1",
      capability: "需求→可运行原型（六演示态）",
      object: "two-pages",
      call_site: {
        control: `app/components/simulation-board-panels.tsx:${lineOf(boardPanels, "data-demo-state")}`,
        state_owner: `app/components/simulation-board-panels.tsx:${lineOf(boardPanels, "export function useDemoState")}`,
      },
      input: "选择值 frozen/ready/loading/empty/error/unknown（两页各六个）",
      output: "data-load-state、role、aria-busy、重试/恢复按钮",
      consumer: "产品内：两页表单",
      verdict: interactionVerdict,
      reason: interactionReason,
      owner: interactionSummary.complete ? null : "采集环境 owner",
      recovery_condition: interactionSummary.complete ? null : "在正常网关会话内重跑两页六态交互，逐态保留终态与失败原因。",
      receipts: [{ref: evidence.interaction}],
      runtime: {pages: interactionSummary.rows.map((row) => ({route: row.route, states: row.state_count, matched: row.matched, errors: row.errors.length}))},
    },
    {
      id: "C05-P3",
      capability: "完整范围后用户答复",
      object: "two-pages",
      call_site: null, input: null, output: null, consumer: null,
      verdict: "未测",
      reason: "需用户本人就完整范围作答复；P1 不代替用户答复，也不把设计源范围当作批准。",
      owner: "用户",
      recovery_condition: "用户就完整范围给出书面答复后回填；原件回指用户答复。",
      receipts: [],
    },
    {
      id: "C06-P1",
      capability: "状态 owner/错误/重复/身份",
      object: "two-pages",
      call_site: {
        demo: `app/components/simulation-board-panels.tsx:${lineOf(boardPanels, "export function DemoControl")}`,
        panel: `app/components/simulation-board-panels.tsx:${lineOf(boardPanels, "export function DataPanel")}`,
      },
      input: "冻结样例 / 用户动作",
      output: "DataState、错误文案、按钮可见性",
      consumer: "产品内：两页 DOM",
      verdict: interactionVerdict,
      reason: interactionSummary.complete
        ? "两页六态显示 role、aria-busy、标题与按钮随状态变化（12/12 与源码期望一致）。"
        : `状态属性回执不完整：${interactionSummary.rows.map((row) => `${row.route} matched ${row.matched}/6`).join("；")}；不写成可用。`,
      owner: interactionSummary.complete ? null : "采集环境 owner",
      recovery_condition: interactionSummary.complete ? null : "补齐两页六态交互后重判。",
      receipts: [{ref: evidence.interaction}],
    },
    {
      id: "C06-P2",
      capability: "定向检查读当前字节",
      object: "two-pages",
      call_site: `副本 ${runState.copy_root}`,
      input: "当前十九件字节",
      output: "next build 回执（含类型检查）",
      consumer: "验收：Phase 4 报告",
      verdict: buildVerdict,
      reason: buildVerdict === "可用" ? "副本构建在本次运行 exit 0。" : `副本构建未取得 exit 0（实际 ${build?.exit_code ?? "未取得"}）。`,
      owner: buildVerdict === "可用" ? null : "采集环境 owner",
      recovery_condition: buildVerdict === "可用" ? null : "修复构建环境或源码后重跑 prepare。",
      receipts: [{ref: build?.receipt_ref, note: `build exit ${build?.exit_code ?? "未取得"}`}],
    },
    {
      id: "C06-P3",
      capability: "完整 diff 与四维审查",
      object: "two-pages",
      call_site: `C11 十件清单 ${C11_FINAL}`,
      input: "当前十九件字节与 C11 清单",
      output: "十件逐件哈希差异",
      consumer: "验收：Phase 4 报告",
      verdict: c11Verdict,
      reason: c11.unavailable ? `C11 清单不可读：${c11.error}` : c11.valid !== true ? `C11 清单不合法，未测：${(c11.validation_errors ?? []).join("; ")}` : `十件中 ${c11.matched}/${c11.count} 与 C11 清单一致；四维审查原件属 C11 字节，P1 不重做。`,
      owner: c11Verdict === "可用" ? null : "Phase 4/独立审查者",
      recovery_condition: c11Verdict === "可用" ? null : "修复 C11 清单（10 件、有效、唯一、在锁定十九件内）或 Phase 4 在当前字节重做四维审查。",
      receipts: [evidence.identity, ...(c11.unavailable ? [] : [{ref: C11_FINAL, note: c11.valid ? "外部清单（10 件有效唯一）" : "外部清单不合法", external: true}])],
      runtime: c11.unavailable ? null : {valid: c11.valid, validation_errors: c11.validation_errors, list_rows: c11.list_rows, matched: c11.matched, count: c11.count},
    },
    {
      id: "C07-P1",
      capability: "视觉/布局/溢出/视口",
      object: "two-pages",
      call_site: "两页根元素 scrollWidth/clientWidth",
      input: "四格渲染",
      output: "四格 overflow 原件",
      consumer: "验收：Phase 3 矩阵",
      verdict: overflowCount === CELLS.length ? "可用" : overflowCount > 0 ? "部分可用" : "未测",
      reason: overflowCount === CELLS.length
        ? "四格均取得根元素几何；board 390 根溢出 492/375 作为页面质量事实保留，不代表能力不可用。"
        : `只有 ${overflowCount}/4 格取得根元素几何；缺格保留失败原件与原因。`,
      owner: overflowCount === CELLS.length ? null : "采集环境 owner",
      recovery_condition: overflowCount === CELLS.length ? null : "在服务可达时重采缺格 overflow。",
      receipts: CELLS.map((cell) => dimReceipt(cell.route, cell.viewport, "overflow")).filter(Boolean),
    },
    {
      id: "C07-P2",
      capability: "交互/键盘/焦点/AX",
      object: "two-pages",
      call_site: "可访问树、Tab 序列、活动元素、对比度",
      input: "DOM",
      output: "AX 节点、Tab 回执、焦点样式、对比度",
      consumer: "验收：Phase 3 矩阵",
      verdict: a11yCount === CELLS.length && interactionSummary.complete ? "部分可用" : a11yCount > 0 ? "部分可用" : "未测",
      reason: a11yCount === CELLS.length && interactionSummary.complete
        ? "四格 a11y 原件与两页 Tab 序列已取得；矩阵判据中的对比度没有真实回执（a11y 采集器只读 role/name/focusable），故本行只能报部分可用。"
        : `a11y 仅 ${a11yCount}/4 格取得，交互完整性=${interactionSummary.complete}；缺项与原因见覆盖原件。`,
      owner: "用户/独立读者",
      recovery_condition: "补充真实对比度回执（计算样式颜色对比）并由独立读者判定；缺 AX 格在服务可达时重采。",
      receipts: [...CELLS.map((cell) => dimReceipt(cell.route, cell.viewport, "a11y")).filter(Boolean), {ref: evidence.interaction}],
    },
    {
      id: "C07-P3",
      capability: "a11y 实际 + 200% 缩放",
      object: "two-pages",
      call_site: "200% 缩放三态；物理读屏",
      input: "缩放、AX",
      output: "三态读数；读屏 not_checked",
      consumer: "验收：Phase 4 报告",
      verdict: a11yCount > 0 ? "部分可用" : "未测",
      reason: "AX 树与键盘已有当前原件；真实 200% 缩放与物理读屏未执行，保持未测。",
      owner: "用户/独立读者",
      recovery_condition: "用户或独立读者在真实 200% 缩放与物理读屏环境执行并记录入口步骤。",
      receipts: [{ref: evidence.interaction}, ...(dimReceipt("/simulation-board", "1280x800", "a11y") ? [dimReceipt("/simulation-board", "1280x800", "a11y")] : [])],
    },
    {
      id: "C07-P4",
      capability: "性能",
      object: "two-pages",
      call_site: "导航计时与长任务采集器",
      input: "页面加载",
      output: "ttfb / DCL / load 的 runs 与 median，长任务与交互字段",
      consumer: "验收：Phase 4 报告",
      verdict: perfCount > 0 ? "部分可用" : "未测",
      reason: `四格导航计时取得 ${perfCount}/4；LCP/CLS/INP 采集器没有，交互没有真实任务闭包，均未测且无阈值。`,
      owner: "环境/采集器 owner",
      recovery_condition: "增加 LCP/CLS/INP 采集器并提供真实任务闭包后重采；当前无阈值。",
      receipts: CELLS.map((cell) => dimReceipt(cell.route, cell.viewport, "perf")).filter(Boolean),
    },
    {
      id: "C07-P5",
      capability: "定位→回修→独立复验",
      object: "two-pages",
      call_site: "C11 处置原件",
      input: "发现清单、差异文件",
      output: "处置表 + 定向复验回执",
      consumer: "验收：Phase 4 报告",
      verdict: "未测",
      reason: "四维审查与定向复验原件属于 C11 字节；P1 不把旧审查冒充当前字节复验，交独立读者/Phase 4。",
      owner: "Phase 4/独立审查者",
      recovery_condition: "Phase 4 在当前字节执行定向复验并保留原件。",
      receipts: [],
    },
    {
      id: "C08-P3",
      capability: "变更→使用点同步",
      object: "two-pages",
      call_site: "副本 token（Phase 3 执行）",
      input: "12px→16px 受控单行",
      output: "前后身份、构建、两页计算值",
      consumer: "验收：Phase 4 报告",
      verdict: "未测",
      reason: "更新链归 Phase 3；P1 只交未改令牌副本。",
      owner: "Phase 3",
      recovery_condition: "Phase 3 在副本执行受控单行后回填。",
      receipts: [],
    },
    {
      id: "live-branch",
      capability: "live 分支",
      object: "two-pages",
      call_site: "page.tsx searchParams.source==='live'",
      input: "live 数据源 http://127.0.0.1:18844",
      output: "live 记录",
      consumer: "产品内：两页",
      verdict: live.state === "port_closed" ? "不可用" : "未测",
      reason: live.meaning,
      owner: live.state === "port_closed" ? "用户/数据源 owner" : "环境/数据源 owner",
      recovery_condition: live.state === "port_closed"
        ? "在 127.0.0.1:18844 启动两页 live 数据源后以 ?source=live 单格重采。"
        : live.state === "reachable_unverified"
          ? "确认 18844 返回两页所需 live 数据后，以 ?source=live 单格实采并验证页面。"
          : "修复 curl 探测环境后重试；探测工具失败不判 live 不可用。",
      receipts: [],
      runtime: live,
    },
  ];
  return {
    schema: "c12-two-pages-capability/1",
    object: "two-pages",
    run_id: runState.run_id,
    produced_at: new Date().toISOString(),
    producer: "P1 developer (object driver); first judgment only, independent acceptance remains with the untouched judge",
    evidence_base: evidence.base,
    identity: {ref: evidence.identity, aggregate: runState.aggregate, files: worker.sourceFiles ?? null},
    boundary_ref: runState.boundary_ref,
    checks_ref: checksRef,
    design_facts_ref: designFactsRef,
    build: {ref: build?.receipt_ref ?? null, output_ref: build?.output_ref ?? null, exit_code: build?.exit_code ?? null, cwd: build?.cwd ?? null, argv: build?.argv ?? null},
    matrix_source: "specs/workflowhub-ui-frontend-c12-acceptance-20261114/decision-log.md 能力矩阵（两页行，含 C05-P3）",
    rows,
    coverage_limits: [
      "本件是 P1 生产者首判，不是独立验收判定；AC-C12-001 的最终判词归未参与实施的独立验收者。",
      "C02-P1/C02-P2/C05-P3/C07-P5/C08-P3 保持未测；live 分支保持不可用。",
      "未重跑 C11 四维审查；不把旧审查原件冒充当前字节复验。",
      "C07-P2 的对比度没有真实回执，按缺项报部分可用，不按矩阵的旧判词报可用。",
    ],
  };
}

function designComparison({context, runState, worker, boundary, evidence, designNow, coverageRef, designFactsRef, checksRef, screenshots, networkCounts}) {
  const primitives = join(runState.source_root, "app/ui/primitives.tsx");
  const line = (file, needle, occurrence = 0) => {
    const value = lineOf(join(DESIGN_ROOT, file), needle, occurrence);
    return value === null ? "line unavailable" : value;
  };
  const facts = Array.isArray(worker.designFacts) ? worker.designFacts : [];
  const fact = (route, viewport) => facts.find((item) => item.route === route && item.viewport === viewport && !item.unavailable) ?? null;
  const board = fact("/simulation-board", "1280x800");
  const workbench = fact("/sim-workbench", "1280x800");
  const board390 = fact("/simulation-board", "390x844");
  const baseline = boundary?.design_source ?? null;
  const designDrift = designNow.status !== "match";
  const overflow390 = board390?.rootScroll ?? null;
  const fontBody = board?.font_body ?? board?.font ?? null;
  const fontPage = board?.font_page ?? null;
  const shotRows = Array.isArray(screenshots) ? screenshots : [];
  const shotAvailable = shotRows.filter((shot) => shot.available).length;
  const currentNetworkCounts = Array.isArray(networkCounts) ? networkCounts.map((row) => row.count ?? "?").join("/") : "unavailable";
  const sources = [
    `- 当前设计源：\`${DESIGN_ROOT}\`，本次 collect 复算 ${designNow.files ?? "unknown"} 件（基线 ${designNow.baseline_files ?? "unknown"} 件），聚合 \`${designNow.aggregate ?? "unavailable"}\`，基线 \`${baseline?.aggregate ?? "unavailable"}\`，预期 \`${DESIGN_AGGREGATE}\`，status=${designNow.status}。`,
    `- 当前实现：十九件聚合 \`${runState.aggregate}\`；副本 \`${runState.copy_root}\`；服务 \`${runState.base_url}\`；身份复算见 \`${checksRef}\`。`,
    `- 当前运行截图：${shotAvailable}/${shotRows.length || 0} 张取得；无截图不等于视觉通过，缺项按 unavailable 记 owner 与恢复条件。`,
    "- 同页设计预览：unavailable。C09 的 board 图已由独立 `read_image` 确认是“策略列表”，只能作全局导航与视觉语汇，不能作同页布局或文案对照；本件不用旧图补同页证据。",
    `- 首跑页面质量摘要 \`2026-11-14-130-c12-p1-page-quality-findings.md\` 已被当前覆盖原件 \`...-two-pages-coverage.json\` 取代（首跑网络条数 49/35/34/34；本次 ${currentNetworkCounts}；条数随运行变化），不得当当前值使用。`,
    "- 本件是生产者对照候选，不是独立设计审查；AC-C12-003 的逐项判词归未参与写作的独立读者。",
    designDrift ? `- 设计源身份在 collect 复算与基线不一致（changed=${(designNow.changed ?? []).slice(0, 8).join(", ") || "none"}）；受影响对照已停止，不使用旧聚合搭配当前源码行。` : "",
  ].filter(Boolean).join("\n");
  const mapping = [
    {design: "`RunTimeline.tsx`（TimelineRow 事件列表 + TIMELINE_SIM001/SIM005 样例）", implementation: "无对应组件；`simulation-board-panels.tsx` 运行详情 dialog 的 `.timeline` 与 `sim-workbench-panels.tsx` 最新事件 tab 只有单条运行 id/状态/时间内联标记", verdict: "未实现（内联重写，不等价）", reason: "未搬组件、未搬事件数组与样例；只保留单条事实。"},
    {design: "`PerfBlocks.tsx` · MetricsBlock", implementation: "`app/ui/primitives.tsx` `Metric` + `app/components/simulation-board-panels.tsx` `Metrics` 组合", verdict: "部分对应（复用 Metric，组合自写）", reason: "六项指标由 Metric 渲染；组合与数据映射在实现侧 panels 内。"},
    {design: "`PerfBlocks.tsx` · EquityBlock", implementation: "无独立组件；`.equityblock` 内联标记 + `Spark` 内联 SVG（`simulation-board-panels.tsx`）", verdict: "未实现（内联重写）", reason: "权益曲线与日期/回撤由实现侧内联拼装，非设计组件移植。"},
    {design: "`PerfBlocks.tsx` · 内部 Metric", implementation: "`app/ui/primitives.tsx` `Metric`", verdict: "对应（同职责，props/样式实现侧自写）", reason: "职责相同，非逐字复用。"},
    {design: "`live/status.tsx` · ReadbackChip / ModeTag / exitStatus", implementation: "`app/ui/primitives.tsx` `UiStatusBadge` + `simulation-board-panels.tsx` `Badge`", verdict: "部分对应（只保状态徽标）", reason: "readback/exit/gate 逻辑未搬；只保留 tone + 文案。"},
    {design: "`live/shared.tsx` · Tone 常量", implementation: "无对应；颜色写在 `app/ui/primitives.css`、`app/globals.css`", verdict: "未实现 / 不适用（token 层不同）", reason: "设计源用组件内常量，实现用 CSS 变量与类。"},
    {design: "`CandleChart.tsx`", implementation: "同名局部组件 `app/components/sim-workbench-panels.tsx` `CandleChart`（内联 SVG）", verdict: "未复用（同名重写）", reason: "实现侧局部函数，不是设计源组件移植。"},
    {design: "`EquityCurve.tsx`", implementation: "`simulation-board-panels.tsx` `Spark` 内联 SVG", verdict: "未实现（简化重写）", reason: "设计曲线组件未搬；实现用随机种子折线。"},
    {design: "`AttributionDetail` / `SmartAttributionTab` / `StrategyIterationTab` / `LiveCockpit` / `iteration/*`", implementation: "两页内无入口", verdict: "不适用（两页范围外）", reason: "范围偏差见 DEV-1；不按同名判缺失。"},
  ];
  const deviations = [
    {id: "DEV-1", class: "范围（组件/视图）", state: "未批准（无书面批准原件）→ 不达标", owner: "用户/设计源 owner", recovery: "提供用户或设计源 owner 的书面答复原件后改为已批准", consequence: "不达标；不按达标记账", evidence: "组件映射表；608 计数；decision-log D-001 只说明技术范围，不是批准"},
    {id: "DEV-2", class: "组件实现方式（未复用/未实现）", state: "未批准 → 不达标", owner: "实现 owner/用户", recovery: "复用设计源组件，或取得用户书面批准该重写", consequence: "不达标", evidence: "组件映射表；`app/ui/primitives.tsx` 与 panels 源码"},
    {id: "DEV-3", class: "IA/导航（设计四视图→实现两路由）", state: "未批准 → 不达标", owner: "用户/设计源 owner", recovery: "补齐视图或取得书面批准缩减范围", consequence: "不达标", evidence: "`src/App.tsx:8-12`；两页路由；范围 dialog"},
    {id: "DEV-4", class: "布局（board 390 根横向溢出 492/375）", state: "未批准 → 不达标", owner: "页面 owner/用户", recovery: "修复页面级横向滚动，或取得用户书面批准该偏差", consequence: "不达标；页面质量事实，不写成能力不可用（与 604 口径一致）", evidence: "`...-c12-p1-overflow-board-390x844.json` scrollWidth=492/clientWidth=375；608 overflowX=true"},
    {id: "DEV-5", class: "字体层级（body 默认字体）", state: "未批准 → 不达标", owner: "实现 owner/用户", recovery: "把 body 默认字体改为设计源的 Inter，或取得书面批准", consequence: "不达标（导航层；页面内容层 .c09-page 为 Inter）", evidence: "608 font_body/font_page；globals.css:13；layout.tsx next/font Geist；设计源 index.css:6 Inter"},
  ];
  const shots = shotRows.length ? shotRows.map((shot) => shot.available
    ? `- \`${shot.ref}\`：${shot.route} ${shot.viewport}，${shot.bytes ?? "?"} B，sha256 \`${shot.sha256 ?? "unavailable"}\`，dpr=${shot.dpr ?? "unknown"}，zoom=${shot.zoom ?? "unknown"}，font(body)=${JSON.stringify(shot.fonts?.body ?? null)}，font(.c09-page)=${JSON.stringify(shot.fonts?.page ?? null)}，url=\`${shot.url ?? "unknown"}\`。`
    : `- ${shot.route} ${shot.viewport}：unavailable（${shot.reason ?? "no screenshot"}）；owner=采集环境 owner；恢复条件=网关 ego 会话可用时重跑 collect。`) : ["- 全部 unavailable：本次采集未取得当前渲染截图；owner=采集环境 owner；恢复条件=重跑 collect。"];
  const driftRow = {
    class: "全部",
    design: "设计源身份复算与基线不一致或不可读，停止对照。",
    implementation: `当前实现聚合 \`${runState.aggregate}\` 仍可回指身份原件 \`${evidence.identity}\`。`,
    status: "无法对照",
    note: `owner=设计源 owner；恢复条件=设计源恢复到基线 66 件后重采。changed=${(designNow.changed ?? []).slice(0, 8).join(", ") || "unknown"}。`,
  };
  const rows = designDrift ? [driftRow] : [
    {
      class: "布局",
      design: `SimulationBoard.tsx:${line("src/components/SimulationBoard.tsx", "<h1", 0)} 标题“模拟记录”、${line("src/components/SimulationBoard.tsx", "SIMULATION RECORDS")} kicker、卡片群；SimWorkbench.tsx:${line("src/components/SimWorkbench.tsx", "Footprint · {sim.contract}")} 图表与订单区；设计源 390 宽用响应式重排。`,
      implementation: `board DOM data-layout=${board?.layout ?? "unknown"}，h1=${JSON.stringify(board?.h1 ?? null)}，cards=${board?.counts?.cards ?? "unknown"}；workbench data-layout=${workbench?.layout ?? "unknown"}；main 盒 ${JSON.stringify(board?.main ?? null)}；board 390 根溢出 ${JSON.stringify(overflow390)}（scrollWidth/clientWidth）。`,
      status: "部分一致（结构/层级）；DEV-4：未批准 → 不达标",
      note: "结构可对应；board 390 存在页面级横向滚动，按真实布局偏差登记为 DEV-4（owner=页面 owner），不写成能力不可用。同页预览缺失，像素/间距不能判。",
    },
    {
      class: "组件",
      design: `设计源组件见下方映射表（RunTimeline、PerfBlocks、live/status、CandleChart、EquityCurve 等）；组件命名与实现 PB primitives 不同。`,
      implementation: `实现 primitives：Metric / UiStatusBadge / UiAction / UiLineage（app/ui/primitives.tsx:${lineOf(primitives, "export function Metric")}/${lineOf(primitives, "export function UiStatusBadge")}/${lineOf(primitives, "export function UiAction")}/${lineOf(primitives, "export function UiLineage")}）；DOM 计数原件 ${designFactsRef}，board=${JSON.stringify(board?.counts ?? null)}，workbench=${JSON.stringify(workbench?.counts ?? null)}。`,
      status: "未批准 → 不达标（DEV-1/DEV-2）",
      note: "逐项映射见下节：只有 Metric/UiStatusBadge 部分对应；RunTimeline/EquityBlock/EquityCurve/CandleChart 未复用或未实现。范围依据 decision-log D-001 与 C11 关闭件只说明技术范围，不构成用户/设计源 owner 的偏差批准；DEV-1 登记为未批准→不达标。",
    },
    {
      class: "令牌与样式",
      design: `src/index.css:${line("src/index.css", "--font-sans")} --font-sans=Inter、${line("src/index.css", "background-color: #06080d")} 背景、${line("src/index.css", "color: #e5e9f0")} 文本。设计源没有 \`--inline-action-gap\` 同名 token；该 token 是 C11/PB 实现侧来源。`,
      implementation: `计算值 --inline-action-gap=${workbench?.token ?? "unknown"}，首个 .inlineactions gap=${workbench?.inlineGap ?? "unknown"}，bodyBg=${workbench?.bodyBg ?? "unknown"}；字体按选择器分层：body=${JSON.stringify(fontBody)}（app/layout.tsx 的 next/font Geist）、.c09-page=${JSON.stringify(fontPage)}（app/globals.css:13 声明 Inter，tokens-base.css 挂 Inter 字体）；设计源声明层为 Inter。`,
      status: "部分一致（背景/间距一致；字体 body 层未批准 → 不达标，DEV-5）",
      note: "背景 #06080d 与 12px gap 已证；字体不能再用「值一致」概括：页面内容层 .c09-page=Inter 与设计声明一致，body 默认字体是 Geist（实现侧导航层），按 DEV-5 登记未批准偏差，不写成一致。",
    },
    {
      class: "文案",
      design: `SimulationBoard.tsx:${line("src/components/SimulationBoard.tsx", "SIMULATION RECORDS")} 标题/kicker、${line("src/components/SimulationBoard.tsx", "示例数据，仅用于设计评审")} 页脚；SimWorkbench.tsx:${line("src/components/SimWorkbench.tsx", "const DETAIL_TABS")} 三个 detail tab。`,
      implementation: `board h1=${JSON.stringify(board?.h1 ?? null)}，kicker=${JSON.stringify(board?.kicker ?? null)}，sourceLabel=${JSON.stringify(board?.sourceLabel ?? null)}；workbench h1=${JSON.stringify(workbench?.h1 ?? null)}，nav=${JSON.stringify(workbench?.nav ?? null)}。`,
      status: "部分一致（源码级）",
      note: "已对可见标题/页脚/标签做源码与 DOM 双回指；实现页脚前置「冻结示例 ·」属可见差异，未逐条比较全部文案，同页预览 unavailable，不能判逐字一致。",
    },
    {
      class: "信息架构与导航",
      design: `App.tsx:${line("src/App.tsx", "type View")}（视图定义在 8-12 行；14 行 fromHash 只是地址解析）的 board/workbench/new/sim-workbench 视图；Board.tsx:${line("src/components/Board.tsx", "策略列表", 0)} 导航标签。`,
      implementation: `两页路由 /simulation-board、/sim-workbench；board nav=${JSON.stringify(board?.nav ?? null)}；workbench 返回链接 + 页头 .inlineactions；不在两页范围内的入口以 dialog 说明。`,
      status: "未批准 → 不达标（DEV-3）",
      note: "设计源四视图，实现只保留两路由；“策略列表/实盘驾驶舱”按钮在两页内打开范围说明 dialog，不构成第三路由。范围来源只说明技术范围，不构成用户/设计源 owner 的偏差批准，按 DEV-3 登记未批准→不达标。",
    },
  ];
  const chain = [
    "设计源：本次 collect 复算 66 件只读字节并与基线逐件比对，结果见 checks 原件。",
    "提取：C09 design-source-extraction 原件属历史任务；P1 未重跑提炼，相关 freshness=unknown。",
    "资产/组件复用：app/ui/primitives.* 为 C11 载体入仓副本；P1 只读对照，映射见上表。",
    "原型：设计源本身；P1 未启动设计源、未新造原型。",
    "实现：十九件当前字节；P1 构建副本 exit 0。",
    "页面检查：本 Phase 四格五维、两页六态交互、DOM 观察与当前截图。",
    "回修：C11 修复原件；P1 未重做四维审查，归独立读者/Phase 4。",
    "更新：Phase 3 受控单行；P1 只交未改令牌副本，未执行。",
    "后续消费：C10 读回未发生，保持未测（owner=后续任务 owner；恢复条件=具名后续任务读取新版后回读）。",
    "沉淀：本段无新增/抽取组件，故无可沉淀对象；设计源组件未搬运的真实原因见 DEV-1/DEV-2 与映射表，不写成“省略”。",
  ];
  return [
    "# P1 两页设计对照（生产者候选）",
    "",
    `- run_id：\`${runState.run_id}\`；生成时间：\`${new Date().toISOString()}\`；证据系列：\`${evidence.base}\`。`,
    `- 引擎：\`${context.engine}\`；网关会话：\`${context.engine_session}\`；服务：\`${runState.base_url}\`。`,
    "- 判定状态词：一致 / 部分一致 / 未批准 → 不达标 / 疑似源漂移（单列）/ 无法对照。偏差三态按 decision-log D-007：已批准→达标、未批准→不达标、疑似源漂移→单列。",
    "- 五类都同时回指当前设计源与当前实现；本件不是独立设计审查，批准原件由独立读者核。",
    "",
    "## 来源与边界",
    "",
    sources,
    "",
    "## 五类对照",
    "",
    "| 类 | 设计源依据 | 当前实现依据 | 状态 | 说明 |",
    "| --- | --- | --- | --- | --- |",
    ...rows.map((row) => `| ${row.class} | ${row.design.replaceAll("|", "\\|")} | ${row.implementation.replaceAll("|", "\\|")} | ${row.status} | ${row.note.replaceAll("|", "\\|")} |`),
    "",
    "## 组件逐项映射（设计源 → 实现）",
    "",
    "| 设计源组件 | 实现位置 | 结论 | 理由 |",
    "| --- | --- | --- | --- |",
    ...mapping.map((row) => `| ${row.design.replaceAll("|", "\\|")} | ${row.implementation.replaceAll("|", "\\|")} | ${row.verdict} | ${row.reason.replaceAll("|", "\\|")} |`),
    "",
    "## 偏差登记（D-007 三态与后果）",
    "",
    "| 偏差 | 三态 | 批准/owner | 后果 | 依据 |",
    "| --- | --- | --- | --- | --- |",
    ...deviations.map((row) => `| ${row.id} ${row.class} | ${row.state} | owner=${row.owner}；恢复条件=${row.recovery} | ${row.consequence} | ${row.evidence.replaceAll("|", "\\|")} |`),
    "",
    "## 当前运行截图（视觉证据）",
    "",
    ...shots,
    "",
    "## UI 合同（七项界面判定字段之一）",
    "",
    "- 合同来源：`app/ui/ui-contract.ts`（PaperBuilder `frontend/src/ui/ui-contract.ts` 的最小副本；符号 LineageIdentity、UiAsyncState、UiNonReadyState、UiStateMessage/uiStateMessage）；全局权威：`spec.md#实现设计（全局权威）`（路由、接口、失败语义）。",
    "- 消费者：`app/ui/primitives.tsx:13` 引入该合同；`UiLineage` 被 `app/components/sim-workbench-panels.tsx:8` 使用；`AsyncStatePanel` 导出但两页未使用（无页面消费者）；两页的 `DataPanel` 自行渲染状态文案，未走 `uiStateMessage`（归 DEV-2 组件映射，不写成合同缺失）。",
    "- 判定：合同文件存在且被真实消费者引用；独立 UI 合同文档不存在，本件按「src 合同 + spec 全局权威」登记，不由生产者自签。",
    "",
    "## 对象链深清单（R-003）",
    "",
    ...chain.map((item) => `- ${item}`),
    "",
    "## 未取得与恢复条件",
    "",
    "- 同页设计预览：unavailable。owner=设计源 owner/用户；恢复条件=提供当前可运行的同页预览并记录入口步骤。",
    "- 设计源 freshness：P1 只复算当前字节，不证明设计源历史意图或当前同渲染。owner=设计源 owner。",
    "- 像素/间距/对比度：没有同页预览与独立视觉判断，不能判。owner=独立设计审查者；恢复条件=提供同页预览并由独立读者判定。",
    "- 当前截图：见上节；未取得的截图按 unavailable 记 owner 与恢复条件，不以 DOM/功能数据冒充视觉通过。",
    "- C09 board 图：已确认是“策略列表”，不得作同页布局/文案对照；旧图只作历史设计参考。",
    "- C10 读回：未发生。owner=后续任务 owner；恢复条件=具名后续任务读取新版后回读。",
    "- 首跑摘要 130：已被当前覆盖原件取代，见来源与边界；不得当当前值。",
    "",
    `- 覆盖原件：\`${coverageRef}\`；交互原件：\`${evidence.interaction}\`；身份原件：\`${evidence.identity}\`；DOM 计数原件：\`${designFactsRef}\`；采集核对原件：\`${checksRef}\`。`,
    "",
  ].join("\n");
}

function codeRecheck({runState, sourceRows, sourceAggregate, identityOriginal}) {
  const copyRows = identityRows(runState.copy_root);
  const copyAggregate = aggregateRows(copyRows);
  const recordedSource = new Map((identityOriginal.files ?? []).map((row) => [row.path, row.sha256]));
  const recordedCopy = new Map((identityOriginal.copy_files ?? []).map((row) => [row.path, row.sha256]));
  const sourceMap = new Map(sourceRows.map((row) => [row.path, row.sha256]));
  const copyMap = new Map(copyRows.map((row) => [row.path, row.sha256]));
  const perFile = FILES.map((path) => {
    const source = sourceMap.get(path) ?? null;
    const copy = copyMap.get(path) ?? null;
    const baselineSource = recordedSource.get(path) ?? null;
    const baselineCopy = recordedCopy.get(path) ?? null;
    return {
      path,
      source_sha256: source,
      copy_sha256: copy,
      baseline_source_sha256: baselineSource,
      baseline_copy_sha256: baselineCopy,
      matches: Boolean(source && copy && source === copy && source === baselineSource && copy === baselineCopy),
    };
  });
  const status = identityOriginal.error || identityOriginal.aggregate !== sourceAggregate || identityOriginal.copy_aggregate !== copyAggregate
    || sourceAggregate !== copyAggregate || perFile.some((row) => !row.matches) ? "mismatch" : "match";
  return {
    source_root: runState.source_root,
    copy_root: runState.copy_root,
    exact_files: FILES.length,
    source_aggregate: sourceAggregate,
    copy_aggregate: copyAggregate,
    baseline_source_aggregate: identityOriginal.aggregate ?? null,
    baseline_copy_aggregate: identityOriginal.copy_aggregate ?? null,
    identity_error: identityOriginal.error ?? null,
    per_file: perFile,
    changed: perFile.filter((row) => !row.matches).map((row) => row.path),
    status,
  };
}

function designRecheck({designNow, boundary}) {
  const baseline = boundary?.design_source ?? null;
  const baselineFiles = Array.isArray(baseline?.files) ? baseline.files : [];
  const nowFiles = Array.isArray(designNow.files) ? designNow.files : [];
  const baselineMap = new Map(baselineFiles.map((row) => [row.path, row.sha256]));
  const perFile = nowFiles.map((row) => ({
    path: row.path,
    sha256: row.sha256,
    baseline_sha256: baselineMap.get(row.path) ?? null,
    matches: baselineMap.get(row.path) === row.sha256,
  }));
  const missing = baselineFiles.filter((row) => !nowFiles.some((item) => item.path === row.path)).map((row) => row.path);
  const added = nowFiles.filter((row) => !baselineFiles.some((item) => item.path === row.path)).map((row) => row.path);
  const status = designNow.unavailable || !baseline
    ? "unavailable"
    : designNow.matches === true && baseline.matches === true && nowFiles.length === baselineFiles.length
      && perFile.every((row) => row.matches) && !missing.length && !added.length
      ? "match"
      : "mismatch";
  return {
    root: designNow.root ?? DESIGN_ROOT,
    expected_aggregate: DESIGN_AGGREGATE,
    baseline_aggregate: baseline?.aggregate ?? null,
    aggregate: designNow.aggregate ?? null,
    recursion_error: designNow.error ?? null,
    files: nowFiles.length,
    baseline_files: baselineFiles.length,
    per_file: perFile,
    missing,
    added,
    changed: perFile.filter((row) => !row.matches).map((row) => row.path).concat(missing, added),
    status,
  };
}

function collectSelfCheck({taskRoot, coverage, capability, interactionSummary}) {
  const errors = [];
  for (const cell of coverage.cells) {
    for (const dimension of DIMENSIONS) {
      const entry = cell.dimensions?.[dimension];
      const label = `${cell.route} ${cell.viewport} ${dimension}`;
      if (typeof entry === "string") {
        const doc = readJson(taskFile(taskRoot, entry));
        if (doc.collector_status === "failed") errors.push(`${label}: acquired dimension points at a failure original`);
        if (Array.isArray(doc.failures) && doc.failures.length && !(Array.isArray(doc.items) && doc.items.length)) errors.push(`${label}: acquired dimension has failures and no observations`);
      } else if (!entry || entry.status !== "未测" || !text(entry.reason) || !text(entry.attempt_ref)) {
        errors.push(`${label}: untested dimension lacks 未测/reason/attempt_ref`);
      } else if (!attemptExists(taskRoot, entry.attempt_ref)) {
        errors.push(`${label}: attempt original is unreadable`);
      } else {
        const doc = readJson(taskFile(taskRoot, entry.attempt_ref));
        if (doc.collector_status !== "failed") errors.push(`${label}: attempt original is not a failure record`);
      }
    }
  }
  for (const row of capability.rows) if (row.verdict === "可用" && !(Array.isArray(row.receipts) && row.receipts.length)) errors.push(`${row.id}: 可用 without receipts`);
  const c05 = capability.rows.find((row) => row.id === "C05-P1");
  if (c05?.verdict === "可用" && !interactionSummary.complete) errors.push("C05-P1: 可用 claimed without both pages' six demo states");
  const c06 = capability.rows.find((row) => row.id === "C06-P1");
  if (c06?.verdict === "可用" && !interactionSummary.complete) errors.push("C06-P1: 可用 claimed without complete state observations");
  return {
    schema: "c12-two-pages-self-check/1",
    checked_at: new Date().toISOString(),
    rule: "a collector failure original can never be counted as an acquired dimension; an 可用 verdict needs receipts and the real interaction set",
    ok: errors.length === 0,
    errors,
  };
}

function buildChecks({runState, evidence, engine, session, attemptId, serviceOwner, code, design: designCheck, selfCheck}) {
  return {
    schema: "c12-two-pages-collect-checks/1",
    object: "two-pages",
    run_id: runState.run_id,
    checked_at: new Date().toISOString(),
    evidence_base: evidence.base,
    engine,
    engine_session: session,
    attempt_id: attemptId,
    service_owner: serviceOwner,
    code_identity: code,
    design_identity: designCheck,
    self_check: selfCheck,
  };
}

async function collect(argv) {
  const options = parseFlags(argv, ["run-id", "service-url", "task-record-root"]);
  const runId = options["run-id"];
  const serviceUrl = options["service-url"].replace(/\/$/, "");
  const taskRoot = resolve(options["task-record-root"]);
  const handle = openHandle(taskRoot);
  // The phase convention puts the copy under /tmp/c12-<run-id>/carrier; the run
  // state beside it is authoritative for the copy root, port and build facts.
  const runDirCandidates = [process.env.C12_TWO_PAGES_RUN_DIR, join("/tmp", `c12-${runId}`)].filter(Boolean);
  let runState = null;
  for (const dir of runDirCandidates) {
    const candidate = readJson(join(dir, `${runId}-run-state.json`));
    if (!candidate.error) { runState = candidate; break; }
  }
  if (!runState) throw fail("E_RUN_STATE", `run state for ${runId} not found; run prepare first`, {exitCode: 2});
  if (`http://127.0.0.1:${runState.port}` !== serviceUrl) {
    throw fail("E_SERVICE_IDENTITY", `service URL ${serviceUrl} differs from prepared ${runState.base_url}`, {exitCode: 2});
  }
  const evidence = runState.evidence_base ? evidenceFamily(Number(runState.evidence_base)) : null;
  if (!evidence) throw fail("E_RUN_STATE", "run state carries no evidence base; run prepare again", {exitCode: 2});
  const collectKeys = ["service", "result", "capability", "design", "interaction", "coverage", "design_facts", "checks"];
  const taken = [
    ...collectKeys.map((key) => evidence[key]),
    ...CELLS.flatMap((cell) => DIMENSIONS.map((dimension) => rawRefFor(evidence, cell.index, dimension))),
    ...CELLS.map((cell) => shotRefFor(evidence, cell.index)),
  ].filter((ref) => existsSync(join(taskRoot, ref)));
  if (taken.length) {
    throw fail("E_EVIDENCE_EXISTS", `this run's collect originals already exist (${taken[0]}); run prepare for a new evidence series instead of overwriting`, {exitCode: 3, taken: taken.slice(0, 5)});
  }
  const recordFailure = (code, message, extra = {}) => recordNote(handle, `c12-p1-collect-${code.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, {
    schema: "c12-two-pages-collect-failure/1",
    run_id: runId,
    failed_at: new Date().toISOString(),
    evidence_base: evidence.base,
    code,
    message,
    ...extra,
  });
  const engine = process.env.BROWSER_QA_ENGINE ?? "";
  const session = process.env.BROWSER_QA_SESSION ?? "";
  const spaceName = process.env.BROWSER_QA_EGO_TASKSPACE_NAME ?? "";
  const hostTaskId = process.env.BROWSER_QA_TASK_ID ?? "";
  const taskId = handle.identity.taskId;
  const gateway = {
    engine,
    session,
    task_id_source: hostTaskId ? "BROWSER_QA_TASK_ID from host adapter" : "missing",
    task_id_matches_handle: hostTaskId === taskId,
    space_name_supplied: Boolean(spaceName),
    auth_mode: process.env.BROWSER_QA_AUTH_MODE ?? "unset",
  };
  let stopFacts = null;
  let attemptId = null;
  const stopOnce = async () => {
    if (!stopFacts) stopFacts = await stopServer(runState);
    return stopFacts;
  };
  try {
    // D: consume exactly the gateway-selected engine. Auto is discovery input,
    // never executable here, and a failure after selection never switches.
    if (!["ego-lite", "ego", "agent-browser"].includes(engine)) {
      const ref = await recordFailure("E_ENGINE", `collect requires the gateway-selected owned engine; observed engine=${engine}; no engine switch is attempted.`, {gateway});
      throw fail("E_ENGINE", `collect requires the gateway-selected owned engine; observed engine=${JSON.stringify(engine)}`, {exitCode: 4, engine, failure_ref: ref});
    }
    if (!text(session) || /^(unset|unavailable|unavailable-session|unknown|none)$/i.test(session)) {
      const ref = await recordFailure("E_SESSION", "BROWSER_QA_SESSION is absent or a placeholder; a real gateway-owned session label is required and no placeholder may pass identity checks.", {gateway});
      throw fail("E_SESSION", "BROWSER_QA_SESSION is absent or a placeholder; rerun through the gateway --run scenario", {exitCode: 4, failure_ref: ref});
    }
    if (engine !== "agent-browser" && !spaceName) {
      const ref = await recordFailure("E_GATEWAY_CONTEXT", "BROWSER_QA_EGO_TASKSPACE_NAME is absent; the ego route must run inside the isolated-browser-qa --run scenario.", {gateway});
      throw fail("E_GATEWAY_CONTEXT", "BROWSER_QA_EGO_TASKSPACE_NAME is absent", {exitCode: 4, failure_ref: ref});
    }
    if (!hostTaskId || hostTaskId !== taskId) {
      const message = `host task id missing or different from handle task id (${taskId}); export openTask(...).identity.taskId as BROWSER_QA_TASK_ID before the gateway --run.`;
      const ref = await recordFailure("E_TASK_ID", message, {gateway});
      throw fail("E_TASK_ID", message, {exitCode: 4, failure_ref: ref});
    }

    // B3: the listener on 41921 must still be this run's recorded process.
    const serviceOwner = serviceIdentity(runState.pid, runState.copy_root, runState.port, runState.process_identity?.start ?? null);
    if (!serviceOwner.owned) {
      const ref = await recordFailure("E_SERVICE_OWNER", "port 41921 listener is not this run's recorded process; page observations are not attributed to this run.", {gateway, service_owner: serviceOwner});
      throw fail("E_SERVICE_OWNER", "port listener identity does not belong to this run; collection stopped", {exitCode: 5, service_owner: serviceOwner, failure_ref: ref});
    }

    // B1/B2: recompute the nineteen copy files and the design source at collect
    // time, comparing row by row with the source tree and the prepare baseline.
    const live = liveProbe();
    const sourceRows = identityRows(runState.source_root);
    const sourceAggregate = aggregateRows(sourceRows);
    const identityOriginal = readJson(taskFile(taskRoot, runState.identity_ref ?? evidence.identity));
    const boundary = readJson(taskFile(taskRoot, runState.boundary_ref ?? evidence.boundary));
    const designNow = designIdentity();
    const code = codeRecheck({runState, sourceRows, sourceAggregate, identityOriginal});
    const designCheck = designRecheck({designNow, boundary});

    if (code.status !== "match") {
      const ref = await recordFailure("E_IDENTITY_DRIFT", "copy/source/recorded nineteen-file identity differs at collect time; page collection stopped.", {gateway, code_identity: code, design_identity: designCheck});
      await publish(handle, evidence.checks, buildChecks({runState, evidence, engine, session, attemptId: null, serviceOwner, code, design: designCheck, selfCheck: {schema: "c12-two-pages-self-check/1", ok: false, errors: ["identity drift stopped collection"], checked_at: new Date().toISOString()}}));
      throw fail("E_IDENTITY_DRIFT", "nineteen-file identity drifted after prepare; collection stopped", {exitCode: 4, changed: code.changed, failure_ref: ref});
    }

    const ready = await waitService(serviceUrl, ROUTES, 10_000);
    if (!ready.ok) {
      const ref = await recordFailure("E_SERVICE", `service unavailable at ${serviceUrl}`, {ready});
      throw fail("E_SERVICE", `service unavailable at ${serviceUrl}`, {exitCode: 5, failure_ref: ref});
    }

    // C2: every attempt owns a unique worker result path and proves the result
    // came from this child (attempt id + child exit), never a previous success.
    attemptId = `${runId}-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
    const rawPaths = CELLS.flatMap((cell) => DIMENSIONS.map((dimension) => ({
      route: cell.route,
      viewport: cell.viewport,
      dimension,
      index: cell.index,
      abs: evidenceAbs(taskRoot, rawRefFor(evidence, cell.index, dimension)),
      ref: rawRefFor(evidence, cell.index, dimension),
    })));
    const attempts = rawPaths.map((raw) => ({
      route: raw.route,
      viewport: raw.viewport,
      dimension: raw.dimension,
      abs: evidenceAbs(taskRoot, `quality/evidence/attempts/${new Date().toISOString().slice(0, 10)}-c12-p1-attempt-${attemptId}-${DIM_SLUG[raw.dimension]}-${raw.route === "/simulation-board" ? "board" : "workbench"}-${raw.viewport}.json`),
      ref: `quality/evidence/attempts/${new Date().toISOString().slice(0, 10)}-c12-p1-attempt-${attemptId}-${DIM_SLUG[raw.dimension]}-${raw.route === "/simulation-board" ? "board" : "workbench"}-${raw.viewport}.json`,
    }));
    for (const raw of rawPaths) mkdirSync(dirname(raw.abs), {recursive: true});
    for (const attempt of attempts) mkdirSync(dirname(attempt.abs), {recursive: true});
    const shotTargets = CELLS.map((cell) => ({
      route: cell.route,
      viewport: cell.viewport,
      abs: evidenceAbs(taskRoot, shotRefFor(evidence, cell.index)),
      ref: shotRefFor(evidence, cell.index),
    }));
    for (const shot of shotTargets) mkdirSync(dirname(shot.abs), {recursive: true});
    const attemptDir = dirname(runState.copy_root);
    mkdirSync(attemptDir, {recursive: true});
    const workerResultPath = join(attemptDir, `${runId}-worker-result-${attemptId}.json`);
    const workerLog = join(attemptDir, `${runId}-worker-${attemptId}.log`);
    const context = {
      workspace: WORKTREE,
      service: serviceUrl,
      engine,
      engine_session: session,
      aggregate: sourceAggregate,
      sourceRoot: runState.source_root,
    };
    const workerInput = {
      spaceName,
      engine,
      session,
      serviceUrl,
      workspace: WORKTREE,
      sourceRoot: runState.source_root,
      aggregate: sourceAggregate,
      attemptId,
      routes: ROUTES,
      viewports: VIEWPORTS,
      cells: CELLS,
      demoStates: DEMO_STATES,
      rawPaths: rawPaths.map(({route, viewport, dimension, index, abs}) => ({route, viewport, dimension, index, abs})),
      attempts: attempts.map(({route, viewport, dimension, abs, ref}) => ({route, viewport, dimension, abs, ref})),
      screenshots: shotTargets,
      resultPath: workerResultPath,
      evidenceRoot: evidenceAbs(taskRoot, "quality/evidence"),
    };
    const workerScript = `
const input = ${JSON.stringify(workerInput)};
const fs = await import("node:fs");
try {
  const {egoWorker} = await import(${JSON.stringify(MODULE_URL)});
  const value = await egoWorker(input);
  fs.writeFileSync(input.resultPath, JSON.stringify({...value, attempt_id: input.attemptId}));
} catch (error) {
  fs.writeFileSync(input.resultPath, JSON.stringify({ok: false, attempt_id: input.attemptId, code: error.code ?? null, message: String(error.message).slice(0, 4000), stack: String(error.stack ?? "").slice(0, 4000)}));
}
`;
    const helper = process.env.BROWSER_QA_EGO_HELPER_PATH || "ego-browser";
    const worker = engine === "agent-browser"
      ? spawnSync(process.execPath, ["-e", workerScript], {
          cwd: WORKTREE,
          env: {...process.env, BROWSER_QA_ENGINE: engine},
          encoding: "utf8",
          timeout: 600_000,
          maxBuffer: 32 * 1024 * 1024,
        })
      : spawnSync(helper, ["nodejs", "-e", workerScript], {
          cwd: WORKTREE,
          env: {...process.env, BROWSER_QA_ENGINE: engine},
          encoding: "utf8",
          timeout: 600_000,
          maxBuffer: 32 * 1024 * 1024,
        });
    const {writeFileSync} = await import("node:fs");
    writeFileSync(workerLog, `ATTEMPT ${attemptId}\nARGV ${JSON.stringify(engine === "agent-browser" ? [process.execPath, "-e", "<embedded>"] : [helper, "nodejs", "-e", "<embedded>"])}\nEXIT ${worker.status} SIGNAL ${worker.signal}\nSTDOUT\n${worker.stdout ?? ""}\nSTDERR\n${worker.stderr ?? ""}\n`);
    const workerResult = readJson(workerResultPath);
    const workerProblems = [];
    if (worker.error) workerProblems.push(`worker spawn/execute error: ${worker.error.code ?? worker.error.message}`);
    if (worker.status !== 0) workerProblems.push(`worker exit=${worker.status} signal=${worker.signal}`);
    if (workerResult.error) workerProblems.push(`result unreadable: ${workerResult.error}`);
    if (workerResult.ok !== true) workerProblems.push("result ok is not true");
    if (workerResult.attempt_id !== attemptId) workerProblems.push(`result belongs to attempt ${JSON.stringify(workerResult.attempt_id ?? "unknown")}, expected ${attemptId}`);
    if (!Array.isArray(workerResult.cells) || workerResult.cells.length !== CELLS.length) workerProblems.push(`worker returned ${Array.isArray(workerResult.cells) ? workerResult.cells.length : "no"} cells, expected ${CELLS.length}`);
    if (workerProblems.length) {
      const ref = await recordFailure("E_COLLECT", "owned collection failed; a stale or foreign result is never accepted.", {gateway, attempt_id: attemptId, worker_problems: workerProblems, worker_exit: worker.status, worker_signal: worker.signal, worker_log: workerLog, worker_result_ref: relativeRef(taskRoot, workerResultPath)});
      throw fail("E_COLLECT", "owned collection failed", {exitCode: 6, worker_exit: worker.status, worker_problems: workerProblems, failure_ref: ref});
    }

    // Current-run visual originals: only a PNG that exists on disk and was
    // recorded by this attempt is a visual fact. A missing or failed capture
    // stays unavailable with owner/recovery; DOM or functional readings never
    // fill in for a screenshot.
    const screenshots = CELLS.map((cell) => {
      const target = shotTargets.find((shot) => shot.route === cell.route && shot.viewport === cell.viewport);
      const reported = Array.isArray(workerResult.screenshots)
        ? workerResult.screenshots.find((shot) => shot?.route === cell.route && shot?.viewport === cell.viewport)
        : null;
      if (!reported || reported.available !== true || !existsSync(target.abs)) {
        return {
          available: false,
          route: cell.route,
          viewport: cell.viewport,
          ref: target.ref,
          reason: reported?.reason ?? "worker produced no screenshot fact",
          owner: "采集环境 owner",
          recovery_condition: "网关 ego 会话可用时重跑 collect（同一路由与视口，100% 缩放）。",
        };
      }
      const bytes = readFileSync(target.abs);
      return {
        available: true,
        route: cell.route,
        viewport: cell.viewport,
        ref: target.ref,
        bytes: bytes.length,
        sha256: sha256(bytes),
        url: reported.url ?? null,
        dpr: reported.dpr ?? null,
        zoom: reported.zoom ?? null,
        fonts: reported.fonts ?? null,
        taken_at: reported.taken_at ?? null,
      };
    });

    // Validate the raw dimension originals before publishing coverage. A
    // failure original is kept under quality/evidence/attempts and the cell
    // records 未测 + reason + attempt_ref instead of an acquired dimension.
    const fallbackAttempt = async (cell, dimension, reason) => {
      const path = await recordNote(handle, `c12-p1-missing-attempt-${attemptId}-${DIM_SLUG[dimension]}-${cell.route === "/simulation-board" ? "board" : "workbench"}-${cell.viewport}`, {
        schema: "c12-two-pages-collector-attempt/1",
        run_id: runId,
        evidence_base: evidence.base,
        attempt_id: attemptId,
        recorded_at: new Date().toISOString(),
        collector_status: "failed",
        engine,
        engine_session: session,
        cell: {route: cell.route, viewport: cell.viewport, dimension},
        failures: [{class: "TOOL_ERROR", detail: String(reason).slice(0, 2000)}],
        detail: String(reason).slice(0, 2000),
      });
      if (!path) throw fail("E_ATTEMPT", `cannot record the failure attempt for ${cell.route} ${cell.viewport} ${dimension}`, {exitCode: 6});
      return relativeRef(taskRoot, path);
    };
    const cellResults = [];
    const dimensionStatus = [];
    for (const cell of CELLS) {
      const result = workerResult.cells?.find((item) => item.route === cell.route && item.viewport === cell.viewport);
      const dimensions = {};
      const status = {};
      const [targetWidth, targetHeight] = cell.viewport.split("x").map(Number);
      const measuredViewport = result?.measured_viewport ?? null;
      const viewportProblem = !measuredViewport
        ? "浏览器未回报实测视口"
        : measuredViewport.width !== targetWidth || measuredViewport.height !== targetHeight
          ? `浏览器实测视口 ${measuredViewport.width}x${measuredViewport.height} 与目标 ${cell.viewport} 不符`
          : null;
      for (const dimension of DIMENSIONS) {
        const entry = result?.dimensions?.[dimension];
        const rawPath = rawRefFor(evidence, cell.index, dimension);
        const label = `${cell.route} ${cell.viewport} ${dimension}`;
        if (viewportProblem) {
          const reason = `${viewportProblem}；该格五维不计已取得`;
          const attemptRef = text(entry?.attempt_ref) && attemptExists(taskRoot, entry.attempt_ref) ? entry.attempt_ref : await fallbackAttempt(cell, dimension, reason);
          dimensions[dimension] = {status: "未测", reason, attempt_ref: attemptRef};
          status[dimension] = {status: "未测", reason, attempt_ref: attemptRef};
          dimensionStatus.push({route: cell.route, viewport: cell.viewport, dimension, ...status[dimension]});
          continue;
        }
        if (entry?.status === "已取得") {
          const doc = readJson(evidenceAbs(taskRoot, rawPath));
          const problems = doc.error ? [doc.error] : rawDocProblems(doc, cell, context);
          if (!problems.length) {
            dimensions[dimension] = rawPath;
            status[dimension] = {status: "已取得", items: doc.items.length, failures: doc.failures.length, window_id: doc.window_id ?? null, observed_viewport: doc.object?.viewport_observed ?? null};
          } else {
            const reason = `采集器报告成功但原件不符合合同：${problems.join("; ")}`;
            const attemptRef = text(entry.attempt_ref) && attemptExists(taskRoot, entry.attempt_ref) ? entry.attempt_ref : await fallbackAttempt(cell, dimension, reason);
            dimensions[dimension] = {status: "未测", reason, attempt_ref: attemptRef};
            status[dimension] = {status: "未测", reason, attempt_ref: attemptRef};
          }
        } else {
          const reason = text(entry?.reason) ? entry.reason : (text(result?.note) ? result.note : `采集器未取得 ${label}`);
          const attemptRef = text(entry?.attempt_ref) && attemptExists(taskRoot, entry.attempt_ref) ? entry.attempt_ref : await fallbackAttempt(cell, dimension, reason);
          dimensions[dimension] = {status: "未测", reason, attempt_ref: attemptRef};
          status[dimension] = {status: "未测", reason, attempt_ref: attemptRef};
        }
        dimensionStatus.push({route: cell.route, viewport: cell.viewport, dimension, ...status[dimension]});
      }
      const windowId = result?.console_network_window ?? null;
      const observedUrl = result?.url ?? null;
      const observation = stateObservation("frozen", observedUrl);
      const stateReason = observation.result === "unknown"
        ? "页面网址没有 state 参数：网关只接受裸路由，两页按 searchParams.source 缺省回落 frozen；URL 不能证明页面状态，故保持 unknown"
        : `观测网址带有 state=${observation.observed}，与 declared=frozen 不一致；不把状态观察写成 match`;
      cellResults.push({
        route: cell.route,
        viewport: cell.viewport,
        state: "frozen",
        state_observation: {...observation, reason: stateReason},
        console_network_window: windowId,
        measured_viewport: measuredViewport,
        dimensions,
        notes: result?.notes ?? [],
      });
    }
    const coverage = {
      schema: "c12-two-pages-coverage/1",
      object: "two-pages",
      run_id: runId,
      produced_at: new Date().toISOString(),
      evidence_base: evidence.base,
      engine,
      engine_session: session,
      gateway,
      identity: {ref: evidence.identity, aggregate: sourceAggregate},
      checks_ref: evidence.checks,
      cells: cellResults,
      matrix: {routes: ROUTES, viewports: VIEWPORTS, cell_count: cellResults.length, dimension_count: cellResults.length * DIMENSIONS.length},
      dimension_status: dimensionStatus,
      coverage_limits: [
        "console/network 同格来自同一次 owned reload 导航窗口；每格只做一个窗口；失败的采集器保留 attempts/ 下的失败原件。",
        "overflow 只读根元素 html 的 scrollWidth/clientWidth，不覆盖后代或内部滚动容器；board 390 根溢出 492/375 已如实记录，不代表全页无溢出。",
        "a11y 只读可访问树的 role/name/focusable；未做对比度、200% 缩放与物理读屏；物理读屏 not_checked，owner=用户。",
        "perf 只保留 ttfb、domContentLoadedEventEnd、loadEventEnd 的 runs/median 与 long_tasks；没有 LCP/CLS/INP，也没有阈值；交互 performance 未提供真实任务闭包，保持 unknown。",
        "六演示态在两条路由各做六个，均由页内 select[data-demo-state] 交互取得，不构造 ?state=；workbench 用真实记录 id 打开；live 分支因 18844 无监听记 unavailable。",
        "截图未用于证明任何维度；两页同页设计预览 unavailable。",
        "本件是 P1 生产者原件，独立判定归未参与实施的测试/审查者。",
        "一个维度的失败原件只作为 attempt_ref 保留，绝不计为已取得；collect-checks 原件记录该自检结果。",
      ],
    };
    const tokenFacts = (workerResult.designFacts ?? []).filter((item) => !item.unavailable);
    let declaredTokenValue = null;
    try { declaredTokenValue = (readFileSync(join(runState.source_root, "app/globals.css"), "utf8").match(/--inline-action-gap:\s*([^;}\s]+)/) ?? [])[1] ?? null; } catch { declaredTokenValue = null; }
    coverage.computed_values = {
      inline_action_gap: {
        declared: declaredTokenValue,
        computed: tokenFacts.find((item) => item.token)?.token ?? null,
        gap: tokenFacts.find((item) => item.inlineGap)?.inlineGap ?? null,
        facts: tokenFacts.map((item) => ({route: item.route, viewport: item.viewport, token: item.token, inline_gap: item.inlineGap})),
      },
    };
    const interactionSummary = collectInteractionSummary(workerResult.interaction);
    const boardPage = workerResult.interaction?.pages?.find?.((page) => page.route === "/simulation-board") ?? null;
    const workbenchPage = workerResult.interaction?.pages?.find?.((page) => page.route === "/sim-workbench") ?? null;
    const interaction = {
      schema: "c12-two-pages-interaction/1",
      object: "two-pages",
      run_id: runId,
      produced_at: new Date().toISOString(),
      evidence_base: evidence.base,
      engine,
      engine_session: session,
      object_version: sourceAggregate,
      demo_control: "select[data-demo-state]（页内交互，不构造网址状态入口）",
      pages: interactionSummary.rows.map((row) => ({route: row.route, url: row.url, states: (workerResult.interaction?.pages?.find?.((page) => page.route === row.route)?.states) ?? [], errors: row.errors})),
      states: boardPage?.states ?? [],
      expectations: interactionSummary.rows.find((row) => row.route === "/simulation-board")?.expectations ?? [],
      workbench: {
        route: "/sim-workbench",
        url: workbenchPage?.url ?? null,
        entry: "真实记录入口 /sim-workbench?simulation_id=sim-001",
        states: workbenchPage?.states ?? [],
        expectations: interactionSummary.rows.find((row) => row.route === "/sim-workbench")?.expectations ?? [],
      },
      keyboard: workerResult.interaction?.keyboard ?? null,
      reduced_motion: workerResult.interaction?.reduced_motion ?? null,
      errors: workerResult.interaction?.errors ?? [],
      summary: {complete: interactionSummary.complete, rows: interactionSummary.rows.map((row) => ({route: row.route, states: row.state_count, matched: row.matched, errors: row.errors.length}))},
      coverage_limits: [
        "六态均为浏览器内存演示态，不连接真实服务或存储；不代表业务状态。",
        "loading 在 select 后约 60ms 处读取，早于页面 2000ms 定时器；它是真实瞬时读数，不作稳定格五维。",
        "键盘只做 3 次 Tab 的活动元素与焦点样式观察；不是完整键盘路径或焦点陷阱验证。",
        "reduced-motion 只记录当前系统偏好读数；不是页面动效全量验证。",
        "物理读屏 not_checked，owner=用户；200% 缩放未测；对比度未取得。",
        "board 用裸路由；workbench 用真实记录入口（?simulation_id=sim-001）驱动六态，两页各六个。",
      ],
    };
    const designFactsDoc = {
      schema: "c12-two-pages-design-facts/1",
      object: "two-pages",
      run_id: runId,
      produced_at: new Date().toISOString(),
      evidence_base: evidence.base,
      engine,
      engine_session: session,
      service: serviceUrl,
      object_version: sourceAggregate,
      source: "owned page DOM at both routes and viewports; this original is the carrier for C03-P1 DOM counts and C04-P1 computed token values",
      facts: Array.isArray(workerResult.designFacts) ? workerResult.designFacts : [],
    };
    await publish(handle, evidence.interaction, interaction);
    await publish(handle, evidence.design_facts, designFactsDoc);

    const build = runState.build ?? {receipt_ref: null, output_ref: null, exit_code: null, argv: [], cwd: runState.copy_root};
    const c11 = c11Comparison(runState.source_root);
    const earlyCapability = capabilityDocument({context, runState, worker: workerResult, build, c11, live, evidence, coverage, interactionSummary, designFactsRef: evidence.design_facts, checksRef: evidence.checks});
    const selfCheck = collectSelfCheck({taskRoot, coverage, capability: earlyCapability, interactionSummary});
    const checks = {...buildChecks({runState, evidence, engine, session, attemptId, serviceOwner, code, design: designCheck, selfCheck}), source_files: sourceRows.length};
    await publish(handle, evidence.checks, checks);
    if (!selfCheck.ok) {
      const ref = await recordFailure("E_SELF_CHECK", "collect self-check failed; no coverage or result was published.", {gateway, self_check: selfCheck});
      throw fail("E_SELF_CHECK", `collect self-check failed: ${selfCheck.errors.slice(0, 3).join("; ")}`, {exitCode: 6, failure_ref: ref, self_check: selfCheck});
    }

    await publish(handle, evidence.capability, earlyCapability);
    const networkCounts = CELLS.map((cell) => {
      const entry = coverage.cells.find((item) => item.route === cell.route && item.viewport === cell.viewport)?.dimensions?.network;
      const doc = typeof entry === "string" ? readJson(taskFile(taskRoot, entry)) : null;
      return {route: cell.route, viewport: cell.viewport, count: Array.isArray(doc?.items) ? doc.items.length : null};
    });
    const currentNetworkCounts = networkCounts.map((row) => row.count ?? "?").join("/");
    const designDoc = designComparison({context, runState, worker: workerResult, boundary, evidence, designNow: designCheck, coverageRef: evidence.coverage, designFactsRef: evidence.design_facts, checksRef: evidence.checks, screenshots, networkCounts});
    await publish(handle, evidence.design, designDoc);

    // Stop the service before the service original is written, so start and stop
    // facts share one original; the finally still reclaims on any later failure.
    const stop = await stopOnce();
    // A successful collect must prove the owned service actually stopped. A
    // failed/blocked stop keeps the error and returns non-zero so the gate
    // exposes it instead of recording ok=true.
    const postStopHttp = await httpStatus(`${serviceUrl}${ROUTES[0]}`, 2000);
    const postStopOwners = portOwners(runState.port);
    const processGone = stop?.identity?.owned === false && String(stop?.reason ?? "").includes("not present");
    const stopVerified = (stop?.stopped === true || processGone) && !postStopHttp.ok && postStopOwners.length === 0;
    stop.verification = {post_stop_http: postStopHttp, port_owners: postStopOwners, verified: stopVerified};
    if (!stopVerified) {
      const ref = await recordFailure("E_STOP", "owned service did not stop cleanly; collect refuses to report success.", {stop, post_stop_http: postStopHttp, port_owners: postStopOwners});
      throw fail("E_STOP", "owned service did not stop cleanly", {exitCode: 7, stop, failure_ref: ref});
    }
    const service = {
      schema: "c12-two-pages-service/1",
      object: "two-pages",
      run_id: runId,
      source_root: runState.source_root,
      copy_root: runState.copy_root,
      port: runState.port,
      base_url: runState.base_url,
      argv: [process.execPath, join(runState.copy_root, NEXT_BIN), "start", "--hostname", "127.0.0.1", "--port", String(runState.port)],
      pid: runState.pid,
      process_identity: runState.process_identity ?? null,
      prepared_at: runState.prepared_at ?? null,
      service_started_at: runState.service_started_at ?? null,
      build_started_at: runState.build?.started_at ?? null,
      service_log: runState.service_log,
      ready: runState.ready,
      build: runState.build,
      collect_service_owner: serviceOwner,
      engine,
      engine_session: session,
      gateway,
      stop,
      notes: [
        "service_started_at is the moment this run's process was spawned (or the reused owned process was re-proved); it is never the prepare start time.",
        "Service is owned by this phase; it is stopped by its own process-group leader after collect, and prepare/collect failures also reclaim it.",
        "No TaskSpace name or numeric id is written; only the gateway-derived session label is retained as engine_session.",
        "Phase 3 must start its own port and must not reuse this process.",
      ],
    };
    await publish(handle, evidence.service, service);

    const firstRunFamily = evidenceFamily(FIRST_RUN);
    const gateTestRef = "tests/acceptance/c12-two-pages.test.mjs";
    const gateTestAbs = join(WORKTREE, gateTestRef);
    const gateTestStat = existsSync(gateTestAbs) ? statSync(gateTestAbs) : null;
    // The frozen judge may be either the current TCR-C12-002 variant (newest
    // series selected at run time, task id read from task.json) or an older
    // variant that pins the first-run 102/107. Record both facts instead of
    // assuming which bytes the gate will judge.
    const gateView = {
      frozen_test_ref: gateTestRef,
      frozen_test_sha256: fileSha(gateTestAbs),
      frozen_test_mtime: gateTestStat ? new Date(gateTestStat.mtimeMs).toISOString() : null,
      selection_rule: "当前 TCR-C12-002 变体（用户 2026-11-14-003 已确认）：运行期按 mtime、再按记录序号选中最新 *-two-pages-identity.json 与 *-two-pages-coverage.json 系列，并要求 run_id=c12-p1；旧变体固定读首跑 102/107。",
      this_run_refs: {identity: evidence.identity, coverage: evidence.coverage, result: evidence.result},
      first_run_refs: {identity: firstRunFamily.identity, coverage: firstRunFamily.coverage},
      first_run_refs_sha256: [fileSha(evidenceAbs(taskRoot, firstRunFamily.identity)), fileSha(evidenceAbs(taskRoot, firstRunFamily.coverage))],
      judged_series: "取决于 gate 运行时的最新系列。当前变体的 gate 会自行 prepare/collect 生成更晚系列，因此它校验的是自己那次运行的最新系列；本件所在的系列只有在运行期确实最新时才会被判。",
      note: `本索引所在系列为 ${evidence.base}；本次运行原件为 ${evidence.identity} 与 ${evidence.coverage}。gate 实际判了哪份原件，以 quality/tests 下的 gate 回执与 140 索引补件为准。`,
    };
    const board390Facts = (workerResult.designFacts ?? []).find((item) => item.route === "/simulation-board" && item.viewport === "390x844") ?? null;
    const uiContractSource = join(runState.source_root, "app/ui/ui-contract.ts");
    const uiContract = {
      source_ref: "app/ui/ui-contract.ts",
      source_sha256: fileSha(uiContractSource),
      symbols: ["LineageIdentity", "UiAsyncState", "UiNonReadyState", "UiStateMessage", "uiStateMessage"],
      authority_ref: "specs/workflowhub-ui-frontend-c12-acceptance-20261114/spec.md#实现设计（全局权威）",
      consumers: [
        {ref: "app/ui/primitives.tsx:13", role: "imports the contract; UiLineage / AsyncStatePanel"},
        {ref: "app/components/sim-workbench-panels.tsx:8", role: "UiLineage consumer"},
      ],
      note: "AsyncStatePanel 导出但两页未使用；两页 DataPanel 自行渲染状态文案，未走 uiStateMessage（归 DEV-2 组件映射）。独立 UI 合同文档不存在；本字段按 src 合同 + spec 全局权威登记。",
    };
    const screenshotSummary = {
      available: screenshots.filter((shot) => shot.available).length,
      total: screenshots.length,
    };
    const result = {
      schema: "c12-two-pages-result/1",
      object: "two-pages",
      run_id: runId,
      ok: true,
      produced_at: new Date().toISOString(),
      evidence_base: evidence.base,
      identity: {ref: evidence.identity, aggregate: sourceAggregate, files: sourceRows.length},
      boundary: {ref: evidence.boundary},
      service: {ref: evidence.service, port: runState.port, stopped: stop.stopped, port_closed: stop.port_closed},
      capability: {ref: evidence.capability, rows: earlyCapability.rows.length, untested: earlyCapability.rows.filter((row) => row.verdict === "未测").length, partial: earlyCapability.rows.filter((row) => row.verdict === "部分可用").length, available: earlyCapability.rows.filter((row) => row.verdict === "可用").length, unavailable: earlyCapability.rows.filter((row) => row.verdict === "不可用").length},
      coverage: {ref: evidence.coverage, cells: coverage.cells.length, dimensions: coverage.dimension_status.length, untested_dimensions: coverage.dimension_status.filter((row) => row.status !== "已取得").length},
      interaction: {ref: evidence.interaction, states: interactionSummary.rows.reduce((sum, row) => sum + row.state_count, 0), pages: interactionSummary.rows.length, matches: interactionSummary.rows.reduce((sum, row) => sum + row.matched, 0), complete: interactionSummary.complete},
      design: {ref: evidence.design, rows: 5, independent_review_pending: true, design_identity_status: designCheck.status, drift_stopped: designCheck.status !== "match", unapproved_deviations: 5, deviations: ["DEV-1 范围", "DEV-2 组件实现方式", "DEV-3 IA", "DEV-4 board390 根溢出", "DEV-5 body 字体"]},
      design_facts: {ref: evidence.design_facts},
      screenshots: {summary: screenshotSummary, items: screenshots},
      ui_contract: uiContract,
      checks: {ref: evidence.checks, self_check_ok: selfCheck.ok, errors: selfCheck.errors, code_identity_status: code.status, design_identity_status: designCheck.status, service_owner: serviceOwner},
      raw_dimensions: rawPaths.map((raw) => ({ref: raw.ref, dimension: raw.dimension, route: raw.route, viewport: raw.viewport})),
      page_quality: {
        board_390_root_scroll: board390Facts?.rootScroll ?? null,
        overflow_acquired: dimensionStatus.filter((row) => row.dimension === "overflow" && row.status === "已取得").length,
        a11y_acquired: dimensionStatus.filter((row) => row.dimension === "a11y" && row.status === "已取得").length,
        perf_acquired: dimensionStatus.filter((row) => row.dimension === "perf" && row.status === "已取得").length,
        console_failures: dimensionStatus.filter((row) => row.dimension === "console" && row.status !== "已取得").length,
      },
      superseded_first_run_summary: {
        ref: PAGE_QUALITY_SUMMARY,
        sha256: fileSha(join(taskRoot, PAGE_QUALITY_SUMMARY)),
        status: "superseded",
        superseded_by: evidence.coverage,
        first_run_network_counts: "49/35/34/34",
        current_network_counts: networkCounts,
        note: `首跑 100 系列页面质量摘要，已被当前覆盖原件取代（首跑网络条数 49/35/34/34；本次 ${currentNetworkCounts}；条数随运行变化）；只作历史，不得当当前值。`,
      },
      gate_view: gateView,
      gateway,
      commands: {
        prepare: {argv: ["node", "tests/acceptance/c12-two-pages.mjs", "prepare", `--run-id=${runId}`, `--source-root=${runState.source_root}`, `--copy-root=${runState.copy_root}`, `--port=${runState.port}`, `--task-record-root=${taskRoot}`], cwd: WORKTREE, exit_code: 0},
        collect: {argv: ["node", "tests/acceptance/c12-two-pages.mjs", "collect", `--run-id=${runId}`, `--service-url=${serviceUrl}`, `--task-record-root=${taskRoot}`], cwd: WORKTREE, exit_code: 0, gateway_entry: "env BROWSER_QA_ENGINE=auto BROWSER_QA_AUTH_MODE=none BROWSER_QA_TASK_ID=<openTask.identity.taskId> bash skills/isolated-browser-qa/scripts/browser-qa-context.sh --run --url 'http://127.0.0.1:41921/simulation-board' -- node tests/acceptance/c12-two-pages.mjs collect ..."},
      },
      open_items: [
        "live 分支 unavailable（127.0.0.1:18844 无监听）；owner=用户/数据源 owner；恢复条件=启动 live 数据源后以 ?source=live 单格重采。",
        "200% 缩放未测、对比度未取得、物理读屏 not_checked；owner=用户/独立读者；恢复条件=在真实缩放/读屏环境执行并记录入口步骤。",
        "交互性能与 LCP/CLS/INP 未测，无阈值；owner=环境/采集器 owner；恢复条件=补齐采集器与真实任务闭包。",
        "两页同页设计预览 unavailable；C09 board 图只作历史/全局参考；owner=设计源 owner/用户。",
        "C10 后续读回未发生，保持未测；owner=后续任务 owner。",
        "独立测试与独立设计审查尚未由本件代替。",
        "冻结 gate 的选择规则与本次系列见 gate_view；旧变体只读首跑 102/107，当前变体读运行期最新系列。",
      ],
      reuse_note: "This original is the P1 producer index, not an acceptance verdict.",
    };
    await publish(handle, evidence.result, result);
    // Coverage is the oracle's last dependency; publish it only after every other
    // original is readable so a late write failure leaves no half-claimed run.
    await publish(handle, evidence.coverage, coverage);

    process.stdout.write(`${JSON.stringify({
      ok: true,
      step: "collect",
      run_id: runId,
      evidence_base: evidence.base,
      artifacts: Object.fromEntries(collectKeys.map((key) => [key, evidence[key]])),
      cells: coverage.cells.length,
      dimensions: coverage.dimension_status.length,
      untested_dimensions: coverage.dimension_status.filter((row) => row.status !== "已取得").length,
      interaction: {complete: interactionSummary.complete, pages: interactionSummary.rows.map((row) => ({route: row.route, states: row.state_count, matched: row.matched, errors: row.errors.length}))},
      service: {stopped: stop.stopped, port_closed: stop.port_closed},
      engine,
      session,
      attempt_id: attemptId,
    })}\n`);
    return 0;
  } catch (error) {
    // Preserve the first error and record the cleanup result for every failure
    // path, including failures before the browser work starts.
    try {
      const stop = await stopOnce();
      const cleanupRef = await recordNote(handle, "c12-p1-collect-cleanup", {
        schema: "c12-two-pages-collect-cleanup/1",
        run_id: runId,
        evidence_base: evidence.base,
        attempt_id: attemptId,
        failed_at: new Date().toISOString(),
        code: error.code ?? error.name,
        message: String(error.message).slice(0, 2000),
        stop,
        first_error_preserved: true,
      });
      error.cleanup = {ref: cleanupRef, stop};
    } catch (cleanupError) {
      error.cleanup = {ref: null, error: String(cleanupError.message).slice(0, 1000)};
    }
    throw error;
  } finally {
    // Any throw after a service was started still leaves port 41921 free.
    if (!stopFacts) {
      try { await stopOnce(); } catch { /* the catch path already recorded the first error */ }
    }
  }
}

// ---------------------------------------------------------------------------
// owned engine worker (runs inside `ego-browser nodejs -e` for ego-lite, or a
// plain node -e child that attaches to the gateway-owned agent-browser CDP
// session). It never selects an engine.
// ---------------------------------------------------------------------------

function failureClass(error) {
  const kind = error?.kind ?? error?.code;
  if (["NOT_STARTED", "UNREACHABLE", "TOOL_ERROR", "IDENTITY_MISMATCH"].includes(kind)) return kind;
  if (/IDENTITY|route|viewport/i.test(String(error?.message ?? ""))) return "IDENTITY_MISMATCH";
  return "TOOL_ERROR";
}

function objectForCell(input, cell, observedViewport) {
  return {
    workspace: input.workspace,
    service: input.serviceUrl,
    route: cell.route,
    state: "frozen",
    viewport: cell.viewport,
    engine: input.engine,
    engine_session: input.session,
    object_version: input.aggregate,
    viewport_observed: observedViewport ?? null,
  };
}

function attemptDocument(input, cell, dimension, detail, error) {
  return {
    engine: input.engine,
    observed_at: new Date().toISOString(),
    object: objectForCell(input, cell, null),
    items: [],
    failures: [{class: failureClass(error), detail: String(detail).slice(0, 2000)}],
    collector_status: "failed",
    failure_class: failureClass(error),
    attempt: {attempt_id: input.attemptId, route: cell.route, viewport: cell.viewport, dimension},
  };
}

// agent-browser branch: consume the gateway-owned session's own CDP endpoint
// and expose the same small page surface that the ego SDK page offers. It is
// not a second engine selection and never falls back to another engine.
async function openAgentBrowserPage(input) {
  const {execFileSync} = await import("node:child_process");
  const {connectCdp, validateEndpoint} = await import(pathToFileURL(join(input.workspace, "skills/isolated-browser-qa/scripts/browser-qa-tickets.mjs")).href);
  const binary = process.env.BROWSER_QA_AGENT_BROWSER_PATH || "agent-browser";
  let raw;
  try {
    raw = execFileSync(binary, ["--session", input.session, "get", "cdp-url"], {encoding: "utf8", timeout: 30_000}).trim();
  } catch (error) {
    throw Object.assign(new Error(`agent-browser cdp endpoint unavailable: ${error.code ?? error.message}`), {code: "E_AGENT_BROWSER_CDP"});
  }
  let endpoint = raw;
  try {
    const parsed = JSON.parse(raw);
    endpoint = parsed.data?.url || parsed.data?.cdpUrl || parsed.data || parsed.url || raw;
  } catch { /* plain text endpoint stays as-is */ }
  const cdp = await connectCdp(validateEndpoint(endpoint, "receiver"), {closeOnAbort: false});
  const targets = (await cdp.call("Target.getTargets"))?.targetInfos?.filter((target) => target.type === "page") ?? [];
  if (!targets.length) {
    cdp.close();
    throw Object.assign(new Error("agent-browser owned page target is missing"), {code: "E_AGENT_BROWSER_TARGET"});
  }
  const target = targets.find((item) => {
    try { return new URL(item.url).pathname === ROUTES[0]; } catch { return false; }
  }) ?? targets[0];
  const attached = await cdp.call("Target.attachToTarget", {targetId: target.targetId, flatten: true});
  if (!attached?.sessionId) {
    cdp.close();
    throw Object.assign(new Error("agent-browser target attachment missing session"), {code: "E_AGENT_BROWSER_TARGET"});
  }
  const sessionId = attached.sessionId;
  const events = [];
  cdp.onEvent((event) => { if (!event.sessionId || event.sessionId === sessionId) events.push(event); });
  // `egoAutomated.disable` is an ego-SDK toggle; a plain agent-browser session
  // exposes console events without it, so it is a no-op here, not a fake call.
  const call = (method, params = {}) => method === "egoAutomated.disable" ? Promise.resolve({}) : cdp.call(method, params, sessionId);
  const evaluate = async (source, argument) => {
    const expression = typeof source === "function"
      ? `(${source.toString()})(${argument === undefined ? "" : JSON.stringify(argument)})`
      : String(source);
    const result = await call("Runtime.evaluate", {expression, returnByValue: true, awaitPromise: true});
    if (result?.exceptionDetails) throw Object.assign(new Error(result.exceptionDetails.text || "agent-browser evaluate failed"), {code: "E_AGENT_BROWSER_EVALUATE"});
    return result?.result?.value;
  };
  const waitFor = async (selector, timeoutMs) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`)) return;
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
    }
    throw Object.assign(new Error(`agent-browser selector timeout: ${selector}`), {code: "E_AGENT_BROWSER_SELECTOR"});
  };
  const page = {
    url: () => evaluate("location.href"),
    cdp: call,
    evaluate,
    goto: async (url) => {
      events.length = 0;
      await call("Page.enable");
      const navigation = await call("Page.navigate", {url});
      if (navigation?.errorText) throw Object.assign(new Error(`agent-browser navigation failed: ${navigation.errorText}`), {code: "E_AGENT_BROWSER_NAVIGATE"});
      await waitFor("body", 30_000);
    },
    reload: () => call("Page.reload"),
    waitForSelector: (selector, options = {}) => waitFor(selector, options.timeout ?? 15_000),
    waitForTimeout: (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms)),
    screenshot: async ({path}) => {
      const {writeFileSync} = await import("node:fs");
      const captured = await call("Page.captureScreenshot", {format: "png"});
      if (typeof captured?.data !== "string" || !captured.data) throw Object.assign(new Error("agent-browser screenshot returned no data"), {code: "E_AGENT_BROWSER_SCREENSHOT"});
      writeFileSync(path, Buffer.from(captured.data, "base64"), {flag: "wx"});
      return path;
    },
    selectOption: (selector, value) => evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) throw new Error("select not found"); element.focus(); const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set; setter.call(element, ${JSON.stringify(value)}); element.dispatchEvent(new Event("change", {bubbles: true})); return element.value; })()`),
    events: () => events.splice(0),
    keyboard: {press: (key) => (async () => {
      const code = key === "Tab" ? 9 : undefined;
      await call("Input.dispatchKeyEvent", {type: "keyDown", key, code: key, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code});
      await call("Input.dispatchKeyEvent", {type: "keyUp", key, code: key, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code});
    })()},
  };
  return {page, close: () => cdp.close()};
}

export async function egoWorker(input) {
  if (!text(input.session)) throw Object.assign(new Error("gateway session is absent; worker refuses placeholder identity"), {code: "E_SESSION"});
  const collectConsole = await import(pathToFileURL(join(input.workspace, "skills/frontend-testing/scripts/collect-console.mjs")).href);
  const {ownedEgoContext, collectOwnedEgoNavigation, observeOwnedEgoReload, writeAtomic} = collectConsole;
  const {collect: normalizeOverflow} = await import(pathToFileURL(join(input.workspace, "skills/frontend-testing/scripts/collect-overflow.mjs")).href);
  const {collect: normalizeA11y} = await import(pathToFileURL(join(input.workspace, "skills/frontend-testing/scripts/collect-a11y.mjs")).href);
  const {collect: normalizePerf} = await import(pathToFileURL(join(input.workspace, "skills/frontend-testing/scripts/collect-perf.mjs")).href);
  const {runRegisteredScript} = await import(pathToFileURL(join(input.workspace, "skills/isolated-browser-qa/scripts/browser-qa-session.mjs")).href);

  let page;
  let closePage = () => {};
  let spaceId = "";
  if (input.engine === "agent-browser") {
    const opened = await openAgentBrowserPage(input);
    page = opened.page;
    closePage = opened.close;
  } else {
    const task = await taskSpace(input.spaceName);
    spaceId = String(task.spaceId);
    page = task.page("p1");
  }
  const output = {ok: true, engine: input.engine, session: input.session, attempt_id: input.attemptId, cells: [], interaction: {pages: [], keyboard: null, reduced_motion: null, errors: []}, designFacts: [], screenshots: [], notes: [], errors: []};

  try {
    const envFor = (cell) => ({
      ...process.env,
      BROWSER_QA_EGO_SPACE_ID: spaceId,
      BROWSER_QA_ENGINE: input.engine,
      PAGE_AUDIT_WORKSPACE: input.workspace,
      PAGE_AUDIT_SERVICE: input.serviceUrl,
      PAGE_AUDIT_ROUTE: cell.route,
      PAGE_AUDIT_STATE: "frozen",
      PAGE_AUDIT_OBJECT_VERSION: input.aggregate,
      PAGE_AUDIT_ENGINE_SESSION: input.session,
    });
    const finalize = (doc, cell, observedViewport) => {
      const value = doc && typeof doc === "object" ? doc : {};
      return {
        ...value,
        engine: input.engine,
        observed_at: value.observed_at ?? new Date().toISOString(),
        object: objectForCell(input, cell, observedViewport),
        items: Array.isArray(value.items) ? value.items : [],
        failures: Array.isArray(value.failures) ? value.failures : [],
      };
    };
    const targetOf = (list, cell, dimension) => list.find((row) => row.route === cell.route && row.viewport === cell.viewport && (dimension === undefined || row.dimension === dimension));
    const writeRaw = async (cell, dimension, doc) => {
      const target = targetOf(input.rawPaths, cell, dimension);
      await writeAtomic(target.abs, doc);
      return target.ref;
    };
    const failDim = async (cell, dimension, detail, error) => {
      const reason = String(detail ?? error?.message ?? "collector failed").slice(0, 1000);
      try {
        const target = targetOf(input.attempts, cell, dimension);
        await writeAtomic(target.abs, attemptDocument(input, cell, dimension, reason, error));
        return {status: "未测", reason, attempt_ref: target.ref};
      } catch (writeError) {
        return {status: "未测", reason: `${reason}; attempt original write failed: ${writeError.code ?? writeError.message}`};
      }
    };
    const acquire = async (cell, dimension, produce) => {
      try {
        const doc = await produce();
        await writeRaw(cell, dimension, doc);
        return {status: "已取得", items: Array.isArray(doc.items) ? doc.items.length : 0, failures: Array.isArray(doc.failures) ? doc.failures.length : 0};
      } catch (error) {
        return failDim(cell, dimension, error.message, error);
      }
    };

    const observeJs = `(() => {
      const select = document.querySelector('select[data-demo-state]');
      const panel = document.querySelector('[data-load-state]');
      const active = document.activeElement;
      return {
        selected: select ? select.value : null,
        panel: panel ? {
          state: panel.getAttribute('data-load-state'),
          role: panel.getAttribute('role'),
          busy: panel.getAttribute('aria-busy'),
          heading: panel.querySelector('h2') ? panel.querySelector('h2').textContent.trim() : null,
          buttons: [...panel.querySelectorAll('button')].map((button) => button.textContent.trim()),
        } : null,
        active: {tag: active ? active.tagName : null, id: active ? active.id : null, value: active && active.value !== undefined ? active.value : null},
        cards: document.querySelectorAll('[data-record-id]').length,
        url: location.href,
      };
    })()`;
    const designJs = `(() => {
      const rect = (element) => {
        const box = element ? element.getBoundingClientRect() : null;
        return box ? {x: +box.x.toFixed(1), y: +box.y.toFixed(1), width: +box.width.toFixed(1), height: +box.height.toFixed(1)} : null;
      };
      const root = getComputedStyle(document.documentElement);
      const inline = [...document.querySelectorAll('.inlineactions')].find((element) => element.getClientRects().length) || document.querySelector('.inlineactions');
      return {
        url: location.href,
        viewport: {width: innerWidth, height: innerHeight, dpr: devicePixelRatio || 1},
        layout: document.querySelector('[data-layout]') ? document.querySelector('[data-layout]').getAttribute('data-layout') : null,
        page: document.querySelector('[data-page]') ? document.querySelector('[data-page]').getAttribute('data-page') : null,
        title: document.title,
        h1: document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : null,
        kicker: document.querySelector('.kicker') ? document.querySelector('.kicker').textContent.trim() : null,
        nav: [...document.querySelectorAll('.nav button')].map((button) => ({text: button.textContent.trim(), current: button.getAttribute('aria-current')})),
        sourceLabel: document.querySelector('[data-source-label]') ? document.querySelector('[data-source-label]').textContent.trim() : null,
        footer: document.querySelector('footer') ? document.querySelector('footer').textContent.trim().slice(0, 300) : null,
        counts: {
          metric: document.querySelectorAll('.pb-ui-metric').length,
          badge: document.querySelectorAll('.pb-ui-status-badge').length,
          action: document.querySelectorAll('.pb-ui-action').length,
          lineage: document.querySelectorAll('.pb-ui-lineage').length,
          asyncState: document.querySelectorAll('.pb-ui-async-state').length,
          cards: document.querySelectorAll('[data-record-id]').length,
          inlineactions: document.querySelectorAll('.inlineactions').length,
          headings: document.querySelectorAll('h1,h2,h3').length
        },
        token: root.getPropertyValue('--inline-action-gap').trim(),
        inlineGap: inline ? getComputedStyle(inline).gap : null,
        bodyBg: getComputedStyle(document.body).backgroundColor,
        font: getComputedStyle(document.body).fontFamily,
        font_body: getComputedStyle(document.body).fontFamily,
        font_page: (()=>{const page=document.querySelector('.c09-page');return page?getComputedStyle(page).fontFamily:null})(),
        dpr: devicePixelRatio,
        zoom: window.visualViewport ? window.visualViewport.scale : null,
        main: rect(document.querySelector('main')),
        header: rect(document.querySelector('header')),
        rootScroll: {scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth},
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    })()`;
    const activeJs = `(() => {
      const active = document.activeElement;
      const style = active ? getComputedStyle(active) : null;
      const main = document.querySelector('main');
      return {
        tag: active ? active.tagName : null,
        id: active ? active.id : null,
        role: active ? active.getAttribute('role') : null,
        aria: active ? active.getAttribute('aria-label') : null,
        text: active ? (active.textContent || '').trim().slice(0, 60) : null,
        value: active && active.value !== undefined ? active.value : null,
        outlineStyle: style ? style.outlineStyle : null,
        outlineWidth: style ? style.outlineWidth : null,
        withinMain: Boolean(active && main && main.contains(active))
      };
    })()`;

    const setViewport = async (width, height) => {
      await page.cdp("Emulation.setDeviceMetricsOverride", {width, height, deviceScaleFactor: 1, mobile: false});
    };

    for (const cell of input.cells) {
      const [width, height] = cell.viewport.split("x").map(Number);
      const cellRecord = {route: cell.route, viewport: cell.viewport, url: null, dimensions: {}, notes: []};
      let context = null;
      try {
        await setViewport(width, height);
        await page.goto(`${input.serviceUrl}${cell.route}`, {timeout: 30_000});
        await page.waitForSelector("body", {timeout: 15_000});
        cellRecord.url = await page.url();
        const measured = await page.evaluate("(() => ({width: innerWidth, height: innerHeight}))()");
        cellRecord.measured_viewport = measured;
        cellRecord.viewport_match = measured.width === width && measured.height === height;
        if (!cellRecord.viewport_match) {
          cellRecord.viewport_mismatch = `浏览器实测视口 ${measured.width}x${measured.height} 与目标 ${cell.viewport} 不符`;
        }
        context = await ownedEgoContext(page, {viewport: cell.viewport, state: "frozen"}, envFor(cell));
        cellRecord.object = context.object;
      } catch (error) {
        cellRecord.notes.push(`owned context failed: ${error.code ?? error.kind ?? error.name}: ${String(error.message).slice(0, 300)}`);
      }

      // A cell whose observed viewport differs from the target cannot support
      // any acquired dimension; keep an attempt original per dimension.
      if (cellRecord.viewport_mismatch) {
        for (const dimension of ["console", "network", "overflow", "a11y", "perf"]) {
          cellRecord.dimensions[dimension] = await failDim(cell, dimension, `${cellRecord.viewport_mismatch}；该格五维不计已取得`, null);
        }
        cellRecord.console_network_window = null;
        output.cells.push(cellRecord);
        continue;
      }

      // console + network share one navigation window; a collector failure is
      // kept as an attempt original, never as an acquired dimension.
      let navigation = null;
      if (context) {
        try {
          navigation = await collectOwnedEgoNavigation(context, 10_000);
        } catch (error) {
          cellRecord.notes.push(`console/network window failed: ${error.code ?? error.kind ?? error.name}: ${String(error.message).slice(0, 300)}`);
        }
      }
      for (const dimension of ["console", "network"]) {
        const doc = navigation?.[dimension] ?? null;
        const collectorOk = Boolean(doc) && !(Array.isArray(doc.failures) && doc.failures.length);
        if (collectorOk) {
          cellRecord.dimensions[dimension] = await acquire(cell, dimension, () => {
            const value = finalize(doc, cell, context.object.viewport);
            return {...value, window_id: value.items.find((item) => item.window_id)?.window_id ?? null};
          });
        } else {
          const detail = doc?.failures?.map((failure) => `${failure.class}: ${failure.detail}`).join("; ")
            || cellRecord.notes.at(-1)
            || "owned navigation window not started";
          cellRecord.dimensions[dimension] = await failDim(cell, dimension, detail, null);
        }
      }
      cellRecord.console_network_window = navigation?.console?.items?.find((item) => item.window_id)?.window_id
        ?? navigation?.network?.items?.find((item) => item.window_id)?.window_id
        ?? null;

      cellRecord.dimensions.overflow = await acquire(cell, "overflow", async () => {
        if (!context) throw new Error("owned context unavailable");
        const observation = await context.read();
        return finalize({items: [normalizeOverflow(observation.facts.scroll)], failures: []}, cell, context.object.viewport);
      });

      cellRecord.dimensions.a11y = await acquire(cell, "a11y", async () => {
        if (!context) throw new Error("owned context unavailable");
        await context.call("Accessibility.enable");
        const tree = await context.call("Accessibility.getFullAXTree");
        return finalize({items: normalizeA11y(tree), failures: []}, cell, context.object.viewport);
      });

      cellRecord.dimensions.perf = await acquire(cell, "perf", async () => {
        if (!context) throw new Error("owned context unavailable");
        const facts = {nav: {ttfb: [], domContentLoadedEventEnd: [], loadEventEnd: []}};
        for (let run = 0; run < 3; run += 1) {
          const sample = await observeOwnedEgoReload(context, 10_000);
          const nav = sample.observation?.facts?.navigation;
          if (!nav || !nav.url || !nav.url.includes(cell.route)) throw Object.assign(new Error("Registered navigation timing identity missing"), {kind: "IDENTITY_MISMATCH"});
          for (const key of Object.keys(facts.nav)) if (typeof nav[key] === "number" && Number.isFinite(nav[key]) && nav[key] >= 0) facts.nav[key].push(nav[key]);
        }
        return finalize({items: [{state: "frozen", viewport: cell.viewport, perf: normalizePerf(facts)}], failures: []}, cell, context.object.viewport);
      });

      output.cells.push(cellRecord);
    }

    // design and capability facts at both routes and viewports.
    for (const [route, viewport] of [["/simulation-board", "1280x800"], ["/simulation-board", "390x844"], ["/sim-workbench", "1280x800"], ["/sim-workbench", "390x844"]]) {
      const [width, height] = viewport.split("x").map(Number);
      try {
        await setViewport(width, height);
        await page.goto(`${input.serviceUrl}${route}`, {timeout: 30_000});
        await page.waitForSelector("body", {timeout: 15_000});
        const fact = await page.evaluate(designJs);
        output.designFacts.push({...fact, route, viewport, dom_viewport: fact.viewport});
      } catch (error) {
        output.designFacts.push({route, viewport, unavailable: true, error: `${error.code ?? error.name}: ${String(error.message).slice(0, 300)}`});
      }
    }

    // current-run screenshots at both routes and viewports (100% zoom: the
    // viewport override pins deviceScaleFactor=1 and dpr/scale are recorded).
    for (const target of input.screenshots ?? []) {
      const [width, height] = target.viewport.split("x").map(Number);
      const url = target.route === "/sim-workbench"
        ? `${input.serviceUrl}/sim-workbench?simulation_id=sim-001`
        : `${input.serviceUrl}${target.route}`;
      const probe = `(() => ({url: location.href, dpr: devicePixelRatio, zoom: window.visualViewport ? window.visualViewport.scale : null, fonts: {body: getComputedStyle(document.body).fontFamily, page: (()=>{const page=document.querySelector('.c09-page');return page?getComputedStyle(page).fontFamily:null})()}}))()`;
      try {
        await setViewport(width, height);
        await page.goto(url, {timeout: 30_000});
        await page.waitForSelector("body", {timeout: 15_000});
        const meta = await page.evaluate(probe);
        await page.screenshot({path: target.abs});
        output.screenshots.push({
          available: true,
          route: target.route,
          viewport: target.viewport,
          ref: target.ref,
          abs: target.abs,
          url: meta?.url ?? url,
          dpr: meta?.dpr ?? null,
          zoom: meta?.zoom ?? null,
          fonts: meta?.fonts ?? null,
          taken_at: new Date().toISOString(),
        });
      } catch (error) {
        output.screenshots.push({
          available: false,
          route: target.route,
          viewport: target.viewport,
          ref: target.ref,
          reason: `${error.code ?? error.name}: ${String(error.message).slice(0, 300)}`,
        });
      }
    }

    // six in-page demo states on both routes; the workbench is opened through
    // its real record entry. Every state keeps its own terminal observation and
    // its own failure entry, so one broken state cannot pass as complete.
    for (const route of input.routes) {
      const pageRecord = {route, url: null, states: [], errors: []};
      const target = route === "/sim-workbench"
        ? `${input.serviceUrl}/sim-workbench?simulation_id=sim-001`
        : `${input.serviceUrl}${route}`;
      try {
        await setViewport(1280, 800);
        await page.goto(target, {timeout: 30_000});
        await page.waitForSelector("select[data-demo-state]", {timeout: 15_000});
        pageRecord.url = await page.url();
        for (const state of input.demoStates) {
          try {
            const started = Date.now();
            await page.selectOption("select[data-demo-state]", state);
            await page.waitForTimeout(state === "loading" ? 60 : 80);
            const observation = await page.evaluate(observeJs);
            pageRecord.states.push({state, observed_at_ms_after_select: Date.now() - started, ...observation});
          } catch (error) {
            pageRecord.errors.push({state, code: error.code ?? error.name, message: String(error.message).slice(0, 500)});
          }
        }
        if (route === "/simulation-board") {
          const keyboard = [];
          for (let step = 0; step < 3; step += 1) {
            await page.keyboard.press("Tab");
            keyboard.push({step: step + 1, ...(await page.evaluate(activeJs))});
          }
          output.interaction.keyboard = keyboard;
          const motion = await runRegisteredScript(page, "design-source-read-v1", {
            elements: [{selector: "html", properties: [], facts: ["reduced-motion", "viewport"]}],
          });
          output.interaction.reduced_motion = motion?.[0]?.facts ?? null;
        }
      } catch (error) {
        pageRecord.errors.push({state: null, code: error.code ?? error.name, message: String(error.message).slice(0, 1000)});
      }
      output.interaction.pages.push(pageRecord);
    }
    output.interaction.errors = output.interaction.pages.flatMap((pageRecord) => pageRecord.errors);
    output.ok = output.cells.length === input.cells.length && output.interaction.pages.length === input.routes.length;
    return output;
  } finally {
    closePage();
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (command === "prepare") return prepare(rest);
  if (command === "collect") return collect(rest);
  throw usage("usage: c12-two-pages.mjs prepare|collect --run-id=... ...");
}

const direct = process.argv[1] ? (() => {
  try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
})() : false;

if (direct) {
  main().then((code) => { process.exitCode = code; }).catch((error) => {
    process.stderr.write(`${JSON.stringify({ok: false, code: error.code ?? "E_UNEXPECTED", message: error.message, ...(error.exitCode ? {exit_code: error.exitCode} : {}), ...(error.identity_ref ? {identity_ref: error.identity_ref} : {}), ...(error.build_ref ? {build_ref: error.build_ref} : {})})}\n`);
    process.exitCode = error.exitCode ?? 1;
  });
}
