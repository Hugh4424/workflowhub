#!/usr/bin/env node
// Phase P3 update-chain driver for AC-C12-004.
//
// prepare:    read the named Phase 1 originals by explicit evidence path, prove
//             they belong to one attempt (object version + engine + session),
//             persist a cleanup identity BEFORE touching the copy, verify the
//             copy Phase 1 returned, rebuild it from the source tree, verify the
//             nineteen files again, change only --inline-action-gap:12px ->
//             16px, prove that is the only difference, build, and start this
//             phase's own service on 41923. A failure leaves a persisted state
//             so cleanup can still stop the owned service and keep the copy.
// browser-env: emit only the environment the explicit Phase 1 engine original
//             chose. It never selects or switches an engine and never invents an
//             ego TaskSpace.
// collect:    consume the gateway-owned session, read .inlineactions on the
//             workbench first and then on the board after a real display
//             action, record the C10 readback strictly, and publish the
//             computed/result originals. The board's pre-change computed value
//             was not captured by Phase 1, so the board half stays 未测 instead
//             of deriving a change from the token alone.
// cleanup:    stop the owned service first, then either delete the copy only
//             after a successful collect (with a pre-deletion readback) or keep
//             it for triage. Port-query failure is never read as "no listener".
//
// This file writes only the allowed driver and task evidence. It never edits
// the frozen test, spec, decision log, source tree, design source or skills and
// never calls runPageAudit()/runCli(). The frozen oracle is
// tests/acceptance/c12-update-chain.test.mjs (ORACLE-C12-UPDATE).

import {spawn, spawnSync} from "node:child_process";
import {createHash, randomUUID} from "node:crypto";
import {
  closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync,
  readdirSync, realpathSync, renameSync, rmSync, statSync, writeFileSync, writeSync,
} from "node:fs";
import {cp} from "node:fs/promises";
import {constants as fsConstants} from "node:fs";
import {dirname, isAbsolute, join, resolve, sep} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {openTask} from "../../runtime/task/task-handle.mjs";

const WORKTREE = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const NEXT_BIN = "node_modules/next/dist/bin/next";
const C10_TASK_ROOT = "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c10-release-onboarding-20261103";
const C10_EVIDENCE_ROOT = join(C10_TASK_ROOT, "quality/evidence");
const SOURCE_ROOT_DEFAULT = "/Users/Hugh/Hugh/Project/c09-carrier-new-20261103";
const OBJECT_NAME = SOURCE_ROOT_DEFAULT.split("/").pop();
const COPY_ROOT_DEFAULT = "/tmp/c12-c12-p1/carrier";
const RUN_DIR_DEFAULT = "/tmp/c12-c12-p1";
const PORT_DEFAULT = 41923;
const P1_RUN_ID = "c12-p1";
const ENGINE_ALLOWED = ["ego-lite", "agent-browser"];
// Explicit Phase 1 originals (one attempt: 1100 service / 1102 identity /
// 1106 interaction / 1108 design facts). Selection never scans for "newest";
// the run-id strings below are provenance, not the selector. Overrides exist so
// a later Phase 1 attempt can be named explicitly instead of guessed.
const P1_ORIGINALS_DEFAULT = {
  identity: "quality/evidence/2026-11-14-1102-two-pages-identity.json",
  service: "quality/evidence/2026-11-14-1100-two-pages-service.json",
  design: "quality/evidence/2026-11-14-1108-two-pages-design-facts.json",
  interaction: "quality/evidence/2026-11-14-1106-two-pages-interaction.json",
};
const FILES = [
  "package.json", "package-lock.json", "next.config.ts", "tsconfig.json", "postcss.config.mjs",
  "app/layout.tsx", "app/globals.css", "app/data/view-model.ts", "app/data/live-mapping.ts",
  "app/data/pb-client.ts", "app/data/shared-data.ts", "app/simulation-board/page.tsx",
  "app/sim-workbench/page.tsx", "app/components/simulation-board-panels.tsx",
  "app/components/sim-workbench-panels.tsx", "app/ui/primitives.tsx", "app/ui/primitives.css",
  "app/ui/tokens-base.css", "app/ui/ui-contract.ts",
];
const ROUTES = ["/simulation-board", "/sim-workbench"];
const MEASURE_ROUTES = ["/sim-workbench", "/simulation-board"];
const VIEWPORTS = [
  {name: "1280x800", width: 1280, height: 800},
  {name: "390x844", width: 390, height: 844},
];
const TOKEN_PATH = "app/globals.css";
const TOKEN_LINE_BEFORE = "--inline-action-gap:12px";
const TOKEN_LINE_AFTER = "--inline-action-gap:16px";
const TOKEN_PROPERTY = "--inline-action-gap";
const GAP_BEFORE = "12px";
const GAP_AFTER = "16px";
const EVIDENCE_LAYOUT = {
  service: {offset: 0, name: "update-service"},
  result: {offset: 1, name: "update-result"},
  identity: {offset: 2, name: "update-identity"},
  build: {offset: 3, name: "update-build"},
  boundary: {offset: 4, name: "update-boundary"},
  computed: {offset: 5, name: "update-computed"},
  readback: {offset: 6, name: "update-readback"},
  cleanup: {offset: 7, name: "update-cleanup"},
  checks: {offset: 8, name: "update-checks"},
  cleanup_readback: {offset: 9, name: "update-cleanup-readback"},
  preflight: {offset: 10, name: "update-agent-browser-preflight"},
  responsive: {offset: 11, name: "update-responsive"},
};
const FIRST_RUN = 100;
const SERIES_ALIGNMENT = 100;
const SERIES_CEILING = 9_000_000;

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const text = (value) => typeof value === "string" && value.trim().length > 0;
const now = () => new Date().toISOString();

function fail(code, message, extra) {
  return Object.assign(new Error(message), {code, ...(extra ?? {})});
}
function usage(message) {
  return fail("E_USAGE", message, {exitCode: 2});
}
function sequenceOf(name) {
  const match = /^\d{4}-\d{2}-\d{2}-(\d{3,})-/.exec(name);
  return match ? Number(match[1]) : -1;
}
function evidenceFamily(base) {
  const family = {base};
  for (const [key, {offset, name}] of Object.entries(EVIDENCE_LAYOUT)) {
    family[key] = `quality/evidence/2026-11-14-${base + offset}-${name}.json`;
  }
  return family;
}
function nextEvidenceBase(taskRoot) {
  let highest = null;
  try {
    for (const name of readdirSync(join(taskRoot, "quality/evidence"))) {
      const sequence = sequenceOf(name);
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
  const taken = (family) => Object.values(family).filter((ref) => typeof ref === "string" && existsSync(join(taskRoot, ref)));
  if (requested !== null) {
    const family = evidenceFamily(requested);
    const used = taken(family);
    if (used.length) throw fail("E_EVIDENCE_EXISTS", `evidence series ${requested} already holds originals; never overwrite`, {exitCode: 3, taken: used.slice(0, 5)});
    return family;
  }
  let base = nextEvidenceBase(taskRoot);
  for (let guard = 0; guard < 1_000; guard += 1) {
    const family = evidenceFamily(base);
    if (!taken(family).length) return family;
    base += SERIES_ALIGNMENT;
    if (base > SERIES_CEILING) break;
  }
  throw fail("E_EVIDENCE_SERIES_RANGE", `no free evidence series above ${base - SERIES_ALIGNMENT}`, {exitCode: 3});
}
function parseEvidenceBase(value) {
  if (value === undefined) return null;
  if (!/^[1-9][0-9]{1,4}$/.test(value)) throw usage("--evidence-series must be a positive numeric base");
  return Number(value);
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
function readJson(path) {
  try { return {value: JSON.parse(readFileSync(path, "utf8"))}; }
  catch (error) { return {error: `${error.code ?? error.name}: ${error.message}`}; }
}
function fileSha(path) {
  try { return sha256(readFileSync(path)); } catch { return null; }
}
function identityRow(root, path) {
  const file = join(root, path);
  const stat = statSync(file);
  return {path, sha256: sha256(readFileSync(file)), bytes: stat.size};
}
function identityRows(root, files = FILES) {
  return files.map((path) => identityRow(root, path));
}
// The same algorithm the frozen judge uses: localeCompare path order, then
// "path\0sha256\n" concatenation, then sha256.
function aggregateRows(rows) {
  const sorted = [...rows].sort((left, right) => left.path.localeCompare(right.path));
  return sha256(Buffer.from(sorted.map((row) => `${row.path}\0${row.sha256}\n`).join("")));
}
function lineOfText(textValue, needle) {
  const rows = textValue.split("\n");
  for (let index = 0; index < rows.length; index += 1) if (rows[index].includes(needle)) return index + 1;
  return null;
}
async function publish(handle, ref, value) {
  const bytes = Buffer.from(typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`);
  const result = await handle.createRecord(ref, bytes);
  return {ref, idempotent: result.idempotent === true, sha256: sha256(bytes), bytes: bytes.length, recorded_at: now()};
}
async function recordNote(handle, slug, value) {
  try { return await handle.appendRecord({dir: "quality/evidence", slug, ext: "json", bytes: `${JSON.stringify(value, null, 2)}\n`}); }
  catch { return null; }
}
function absoluteTaskFile(taskRoot, ref) {
  return isAbsolute(ref) ? ref : join(taskRoot, ref);
}

// ---------------------------------------------------------------------------
// Explicit Phase 1 originals and their one-attempt relation
// ---------------------------------------------------------------------------

function readExplicit(taskRoot, ref, label) {
  const path = absoluteTaskFile(taskRoot, ref);
  const parsed = readJson(path);
  if (parsed.error) throw fail("E_P1_ORIGINALS", `${label} original is unreadable at ${ref}: ${parsed.error}`, {exitCode: 4, ref});
  return {ref, path, sha256: fileSha(path), value: parsed.value};
}
function loadPhase1Originals(taskRoot, overrides = {}) {
  const refs = {...P1_ORIGINALS_DEFAULT};
  for (const key of Object.keys(refs)) if (text(overrides[key])) refs[key] = overrides[key];
  const identity = readExplicit(taskRoot, refs.identity, "identity");
  const service = readExplicit(taskRoot, refs.service, "service");
  const design = readExplicit(taskRoot, refs.design, "design");
  const interaction = readExplicit(taskRoot, refs.interaction, "interaction");
  const problems = [];
  if (!Array.isArray(identity.value?.files) || identity.value.files.length !== 19 || typeof identity.value?.aggregate !== "string") problems.push("identity original does not carry nineteen files and an aggregate");
  if (!ENGINE_ALLOWED.includes(service.value?.engine) || !text(service.value?.engine_session)) problems.push("service original does not carry a supported engine and a real session label");
  if (!Array.isArray(design.value?.facts)) problems.push("design original does not carry page facts");
  if (!Array.isArray(interaction.value?.pages)) problems.push("interaction original does not carry page states");
  if (problems.length) throw fail("E_P1_ORIGINALS", problems.join("; "), {exitCode: 4, problems, refs});
  const runIds = [identity.value.run_id, service.value.run_id, design.value.run_id, interaction.value.run_id];
  if (!runIds.every((value) => value === P1_RUN_ID)) {
    throw fail("E_P1_ATTEMPT", `explicit Phase 1 originals do not share run_id ${P1_RUN_ID}: ${JSON.stringify(runIds)}`, {exitCode: 4, runIds});
  }
  const engine = service.value.engine;
  const session = service.value.engine_session;
  const attempts = [
    {name: "design", engine: design.value.engine, session: design.value.engine_session, object_version: design.value.object_version},
    {name: "interaction", engine: interaction.value.engine, session: interaction.value.engine_session, object_version: interaction.value.object_version},
  ];
  for (const attempt of attempts) {
    if (attempt.engine && attempt.engine !== engine) throw fail("E_P1_ATTEMPT", `Phase 1 ${attempt.name} engine ${attempt.engine} differs from service engine ${engine}`, {exitCode: 4});
    if (attempt.session && attempt.session !== session) throw fail("E_P1_ATTEMPT", `Phase 1 ${attempt.name} session ${attempt.session} differs from service session ${session}`, {exitCode: 4});
    if (attempt.object_version && attempt.object_version !== identity.value.aggregate) throw fail("E_P1_ATTEMPT", `Phase 1 ${attempt.name} object version ${attempt.object_version} differs from identity aggregate ${identity.value.aggregate}`, {exitCode: 4});
  }
  const workbenchFact = design.value.facts.find((fact) => fact?.route === "/sim-workbench" && typeof fact?.inlineGap === "string");
  if (!workbenchFact) throw fail("E_P1_BEFORE_VALUE", "Phase 1 design original carries no workbench .inlineactions computed gap", {exitCode: 4});
  if (workbenchFact.inlineGap !== GAP_BEFORE || workbenchFact.token !== GAP_BEFORE) {
    throw fail("E_P1_BEFORE_VALUE", `Phase 1 workbench gap/token is ${workbenchFact.inlineGap}/${workbenchFact.token}, expected ${GAP_BEFORE}`, {exitCode: 4});
  }
  // The frozen judge reads the newest Phase 1 identity by mtime. Explicit
  // selection is the card rule, so a conflicting newest identity stops here
  // instead of silently pairing one attempt's identity with another's facts.
  let latest = null;
  try {
    const rows = [];
    for (const name of readdirSync(join(taskRoot, "quality/evidence"))) {
      if (!name.endsWith("-two-pages-identity.json")) continue;
      const path = join(taskRoot, "quality/evidence", name);
      const parsed = readJson(path);
      if (parsed.error || parsed.value?.run_id !== P1_RUN_ID || !Array.isArray(parsed.value?.files) || parsed.value.files.length !== 19) continue;
      rows.push({name, path, mtime: statSync(path).mtimeMs, value: parsed.value});
    }
    rows.sort((left, right) => right.mtime - left.mtime || sequenceOf(right.name) - sequenceOf(left.name) || right.name.localeCompare(left.name));
    latest = rows[0] ?? null;
  } catch { latest = null; }
  if (latest && latest.value.aggregate !== identity.value.aggregate) {
    throw fail("E_P1_LATEST_DRIFT", `explicit identity aggregate ${identity.value.aggregate} differs from the newest Phase 1 identity ${latest.value.aggregate} (${latest.name}); sync cannot be judged from a mixed attempt`, {exitCode: 4, explicit: identity.ref, latest: latest.name});
  }
  const boardStates = (interaction.value.pages ?? []).filter((page) => page?.route === "/simulation-board").flatMap((page) => page.states ?? []);
  const boardEmpty = boardStates.find((state) => state?.state === "empty" && Array.isArray(state?.panel?.buttons));
  const viewportReference = ROUTES.flatMap((route) => VIEWPORTS.map((viewport) => {
    const fact = design.value.facts.find((row) => row?.route === route && row?.viewport === viewport.name);
    if (!fact) return {route, viewport: viewport.name, unavailable: true, reason: "P1 design facts carry no cell for this route/viewport"};
    return {
      route,
      viewport: viewport.name,
      token: fact.token ?? null,
      inline_gap: fact.inlineGap ?? null,
      root_scroll_width: fact.rootScroll?.scrollWidth ?? null,
      root_client_width: fact.rootScroll?.clientWidth ?? null,
      overflow_x: fact.overflowX ?? null,
    };
  }));
  return {
    identity: {ref: identity.ref, path: identity.path, sha256: identity.sha256, aggregate: identity.value.aggregate, files: identity.value.files, run_id: identity.value.run_id},
    service: {ref: service.ref, path: service.path, sha256: service.sha256, engine, engine_session: session, run_id: service.value.run_id, port: service.value.port ?? null},
    design: {ref: design.ref, path: design.path, sha256: design.sha256, engine: design.value.engine ?? null, session: design.value.engine_session ?? null, object_version: design.value.object_version ?? null, workbench_inline_gap: workbenchFact.inlineGap, workbench_token: workbenchFact.token},
    interaction: {ref: interaction.ref, path: interaction.path, sha256: interaction.sha256, engine: interaction.value.engine ?? null, session: interaction.value.engine_session ?? null, object_version: interaction.value.object_version ?? null, board_empty_panel_buttons: boardEmpty?.panel?.buttons ?? null},
    latest_identity: latest ? {ref: `quality/evidence/${latest.name}`, aggregate: latest.value.aggregate, mtime: latest.mtime} : null,
    relation: {
      run_id: P1_RUN_ID,
      object_version: identity.value.aggregate,
      engine,
      engine_session: session,
      matched: ["run_id", "object_version", "engine", "engine_session"],
      note: "the four explicit originals name one Phase 1 attempt; the newest Phase 1 identity has the same aggregate",
    },
    board_before_status: boardEmpty ? "P1 recorded the display action but did not compute the board gap" : "P1 interaction carries no board empty-state panel; the board pre-change computed value is unavailable",
    viewport_reference: viewportReference,
  };
}
function loadPhase1Engine(taskRoot, serviceRef = P1_ORIGINALS_DEFAULT.service) {
  const service = readExplicit(taskRoot, serviceRef, "service");
  if (!ENGINE_ALLOWED.includes(service.value?.engine) || !text(service.value?.engine_session)) {
    throw fail("E_P1_ENGINE", "Phase 1 service original carries no supported engine/session", {exitCode: 4, ref: serviceRef});
  }
  if (service.value.run_id !== P1_RUN_ID) throw fail("E_P1_ENGINE", `Phase 1 service run_id ${service.value.run_id} is not ${P1_RUN_ID}`, {exitCode: 4});
  return {engine: service.value.engine, engine_session: service.value.engine_session, ref: service.ref, path: service.path, sha256: service.sha256, run_id: service.value.run_id};
}

// ---------------------------------------------------------------------------
// Process/service helpers
// ---------------------------------------------------------------------------

function runTimeout(command, args, options) {
  return spawnSync(command, args, {encoding: "utf8", timeout: 30_000, ...options});
}
// lsof exit 1 with empty output means "no matching listener"; a spawn error or
// timeout means the question is unanswered and must never be read as "empty".
function portQuery(port) {
  const result = runTimeout("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"], {timeout: 10_000});
  if (result.error) return {ok: false, error: result.error.code ?? "lsof-error", exit: result.status ?? null, signal: result.signal ?? null, stdout: result.stdout ?? "", stderr: result.stderr ?? ""};
  if (result.signal) return {ok: false, error: `lsof signal ${result.signal}`, exit: result.status ?? null, signal: result.signal, stdout: result.stdout ?? "", stderr: result.stderr ?? ""};
  if (result.status === 1 && !text(result.stdout) && !text(result.stderr)) return {ok: true, owners: []};
  if (result.status !== 0) return {ok: false, error: `lsof exit ${result.status}`, exit: result.status, stdout: result.stdout ?? "", stderr: (result.stderr ?? "").slice(0, 800)};
  const owners = text(result.stdout) ? result.stdout.split(/\s+/).filter(Boolean).map(Number).filter((value) => Number.isInteger(value) && value > 0) : [];
  return {ok: true, owners};
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
async function waitService(baseUrl, routes, timeoutMs = 45_000) {
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
function serviceIdentity(pid, port, expectedStart = null) {
  if (!Number.isInteger(pid) || pid <= 0) return {owned: false, reason: "run state has no pid", port_query: portQuery(port)};
  const query = portQuery(port);
  if (!query.ok) return {owned: false, reason: "port ownership query failed", port_query: query};
  const start = processStart(pid);
  const row = processRow(pid);
  if (!start) return {owned: false, reason: "process not present", ps_exit: 1, port_query: query, owners: query.owners};
  const startMatch = !expectedStart || expectedStart === start;
  const portMatch = query.owners.includes(pid);
  return {owned: startMatch && portMatch, row: row?.slice(0, 400) ?? null, start, expected_start: expectedStart, port_owner: portMatch, owners: query.owners, port_query: query};
}
async function stopServer(runState) {
  const identity = serviceIdentity(runState.pid, runState.port, runState.process_identity?.start ?? null);
  const stoppedAt = now();
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
  const probe = await httpStatus(`http://127.0.0.1:${runState.port}${ROUTES[0]}`, 2000);
  const query = portQuery(runState.port);
  const curl = runTimeout("curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "2", `http://127.0.0.1:${runState.port}${ROUTES[0]}`]);
  return {
    stopped: exited, attempted: true, signal: forced ? "SIGTERM,SIGKILL" : "SIGTERM", stopped_at: stoppedAt,
    identity, post_stop_http: probe, curl_exit: curl.status,
    curl_http_code: text(curl.stdout) ? curl.stdout.trim() : null,
    port_query: query,
    port_owners_after: query.ok ? query.owners : null,
    port_closed: query.ok ? (!probe.ok && query.owners.length === 0) : null,
    port_query_error: query.ok ? null : query.error,
  };
}
function writeRunState(path, value) {
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  const temporary = `${path}.${process.pid}.${randomUUID().slice(0, 8)}.tmp`;
  const fd = openSync(temporary, "wx", 0o600);
  try { writeSync(fd, bytes); fsyncSync(fd); } finally { closeSync(fd); }
  renameSync(temporary, path);
}
function updateRunState(path, patch) {
  const current = readJson(path);
  if (current.error) throw fail("E_RUN_STATE", `run state is unreadable at ${path}: ${current.error}`, {exitCode: 2});
  writeRunState(path, {...current.value, ...patch, updated_at: now()});
  return {...current.value, ...patch};
}
function safeUpdateRunState(path, patch) {
  try { return updateRunState(path, patch); } catch { return null; }
}
function assertCopyRootSafe(copyRoot) {
  const resolved = resolve(copyRoot);
  if (resolved !== COPY_ROOT_DEFAULT) throw fail("E_COPY_ROOT_SCOPE", `copy root must be the licensed Phase 1 copy ${COPY_ROOT_DEFAULT}; observed ${resolved}`, {exitCode: 2});
  if (resolved === SOURCE_ROOT_DEFAULT) throw fail("E_COPY_ROOT_SCOPE", "copy root equals the read-only source root", {exitCode: 2});
  return resolved;
}
async function assertPortFree(port) {
  const query = portQuery(port);
  if (!query.ok) throw fail("E_PORT_QUERY", `cannot determine listeners on ${port}: ${query.error}`, {exitCode: 6, port_query: query});
  if (query.owners.length) throw fail("E_PORT_IN_USE", `port ${port} already has listeners: ${query.owners.join(",")}`, {exitCode: 6, owners: query.owners});
  const inUse = await httpStatus(`http://127.0.0.1:${port}${ROUTES[0]}`, 1500);
  if (inUse.ok || inUse.status) throw fail("E_PORT_IN_USE", `port ${port} already answers but is not this run's owned service`, {exitCode: 6, inUse});
  return query;
}
function compareRowsToP1(rows, p1Rows, aggregate, p1Aggregate) {
  const expected = new Map((p1Rows ?? []).map((row) => [row.path, row.sha256]));
  const mismatched = rows.filter((row) => expected.get(row.path) !== row.sha256);
  return {
    ok: rows.length === (p1Rows ?? []).length && mismatched.length === 0 && aggregate === p1Aggregate,
    aggregate,
    expected_aggregate: p1Aggregate,
    mismatched: mismatched.map((row) => ({path: row.path, observed: row.sha256, expected: expected.get(row.path) ?? null})),
    missing: (p1Rows ?? []).filter((row) => !rows.some((candidate) => candidate.path === row.path)).map((row) => row.path),
  };
}
function singleControlledEdit(beforeBytes, afterBytes) {
  const beforeText = beforeBytes.toString("utf8");
  const afterText = afterBytes.toString("utf8");
  const occurrencesBefore = beforeText.split(TOKEN_LINE_BEFORE).length - 1;
  const occurrencesAfter = afterText.split(TOKEN_LINE_AFTER).length - 1;
  const expected = beforeText.split(TOKEN_LINE_BEFORE).join(TOKEN_LINE_AFTER);
  return {
    only_change: occurrencesBefore === 1 && occurrencesAfter === 1 && afterText === expected && beforeText === afterText.replace(TOKEN_LINE_AFTER, TOKEN_LINE_BEFORE),
    occurrences_before: occurrencesBefore,
    occurrences_after: occurrencesAfter,
    before_length: beforeBytes.length,
    after_length: afterBytes.length,
    line: lineOfText(beforeText, TOKEN_PROPERTY),
    expected_identical: afterText === expected,
    before_text: beforeText,
    after_text: afterText,
  };
}
function publishBoundary(handle, ref, {runId, sourceRoot, copyRoot, before, p1}) {
  const gitStatus = runTimeout("git", ["status", "--porcelain", "--untracked-files=all"], {cwd: WORKTREE, timeout: 30_000});
  const gitHead = runTimeout("git", ["rev-parse", "HEAD"], {cwd: WORKTREE});
  return handle.createRecord(ref, Buffer.from(`${JSON.stringify({
    schema: "c12-update-boundary/1",
    run_id: runId,
    recorded_at: now(),
    worktree: WORKTREE,
    branch: runTimeout("git", ["branch", "--show-current"], {cwd: WORKTREE}).stdout.trim() || null,
    head: gitHead.status === 0 ? gitHead.stdout.trim() : null,
    source_root: sourceRoot,
    copy_root: copyRoot,
    before_identity: {aggregate: before.aggregate, files: before.files.length},
    p1_original: {
      identity_ref: p1.identity.ref, identity_sha256: p1.identity.sha256, aggregate: p1.identity.aggregate,
      service_ref: p1.service.ref, service_sha256: p1.service.sha256,
      design_ref: p1.design.ref, design_sha256: p1.design.sha256,
      interaction_ref: p1.interaction.ref, interaction_sha256: p1.interaction.sha256,
      relation: p1.relation,
    },
    declared_write_set: {
      allowed_new_or_modified: ["tests/acceptance/c12-update-chain.mjs"],
      frozen_read_only: ["tests/acceptance/c12-update-chain.test.mjs", "specs/**", "decision-log.md", "docs/examples/c11-ui/**", "/Users/Hugh/Downloads/UI", "skills/**"],
      runtime_copy: copyRoot,
      runtime_token_line: `${TOKEN_PATH}:${TOKEN_LINE_BEFORE} -> ${TOKEN_LINE_AFTER}`,
      task_evidence: "quality/evidence",
      task_tests: "quality/tests",
      note: "No Git commit in this run; the driver is the only repository write.",
    },
    git_status: {argv: ["git", "status", "--porcelain", "--untracked-files=all"], cwd: WORKTREE, exit: gitStatus.status, signal: gitStatus.signal, stdout: gitStatus.stdout ?? "", stderr: gitStatus.stderr ?? ""},
  }, null, 2)}\n`));
}

// ---------------------------------------------------------------------------
// prepare
// ---------------------------------------------------------------------------

async function prepare(argv) {
  const options = parseFlags(argv, ["run-id", "copy-root", "port", "task-record-root"], ["source-root", "evidence-series", "p1-identity", "p1-service", "p1-design", "p1-interaction"]);
  const runId = options["run-id"];
  const copyRoot = assertCopyRootSafe(options["copy-root"]);
  const sourceRoot = resolve(options["source-root"] ?? SOURCE_ROOT_DEFAULT);
  const taskRoot = resolve(options["task-record-root"]);
  const port = Number(options.port);
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(runId)) throw usage("--run-id must match [a-z0-9][a-z0-9-]{0,63}");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw usage("--port must be a TCP port");
  if (sourceRoot === copyRoot) throw usage("copy root must differ from the read-only source root");
  const runDir = dirname(copyRoot);
  const statePath = join(runDir, `${runId}-run-state.json`);
  const preparedAt = now();
  const prepareArgv = process.argv.slice();
  const handle = openHandle(taskRoot);

  // 1. Explicit Phase 1 originals and their one-attempt relation. Nothing is
  // touched before this succeeds.
  const p1 = loadPhase1Originals(taskRoot, {
    identity: options["p1-identity"],
    service: options["p1-service"],
    design: options["p1-design"],
    interaction: options["p1-interaction"],
  });

  // 2. Reclaim only our own still-running service from a previous attempt. A
  // foreign listener or an unanswerable port query stops before any deletion.
  const prior = readJson(statePath);
  if (!prior.error && prior.value?.run_id === runId && Number.isInteger(prior.value?.pid)) {
    const priorQuery = portQuery(prior.value.port ?? port);
    if (!priorQuery.ok) throw fail("E_PORT_QUERY", `cannot determine whether the prior attempt still listens: ${priorQuery.error}`, {exitCode: 6, port_query: priorQuery});
    if (priorQuery.owners.length) await stopServer(prior.value);
  }
  await assertPortFree(port);

  // 3. Persist a cleanup identity BEFORE any copy mutation. If the build or the
  // service start later fails, cleanup can still find and stop this run's
  // process and keep the copy.
  const p1Summary = {
    identity_ref: p1.identity.ref, identity_path: p1.identity.path, identity_sha256: p1.identity.sha256, identity_aggregate: p1.identity.aggregate,
    service_ref: p1.service.ref, service_path: p1.service.path, service_sha256: p1.service.sha256,
    design_ref: p1.design.ref, design_path: p1.design.path, design_sha256: p1.design.sha256,
    interaction_ref: p1.interaction.ref, interaction_path: p1.interaction.path, interaction_sha256: p1.interaction.sha256,
    engine: p1.service.engine, engine_session: p1.service.engine_session,
    latest_identity: p1.latest_identity, relation: p1.relation, board_before_status: p1.board_before_status,
    viewport_reference: p1.viewport_reference,
  };
  const initialState = {
    schema: "c12-update-run-state/1",
    run_id: runId,
    task_id: handle.identity.taskId,
    task_root: taskRoot,
    source_root: sourceRoot,
    copy_root: copyRoot,
    port,
    base_url: `http://127.0.0.1:${port}`,
    status: "preparing",
    prepared_at: preparedAt,
    pid: null,
    process_identity: null,
    service_started_at: null,
    ready: null,
    engine: p1.service.engine,
    engine_session: null,
    p1: p1Summary,
    evidence_base: null,
    identity_ref: null,
    collect_ok: false,
    prepare_argv: prepareArgv,
    commands: {prepare: {argv: prepareArgv, cwd: WORKTREE, exit_code: "pending"}},
  };
  mkdirSync(runDir, {recursive: true});
  writeRunState(statePath, initialState);

  const failPrepare = async (error, extra = {}) => {
    const stop = extra.pid ? await stopServer({pid: extra.pid, port, process_identity: extra.process_identity ?? null}) : null;
    const note = await recordNote(handle, `${runId}-prepare-unavailable`, {
      schema: "c12-update-unavailable/1",
      run_id: runId,
      recorded_at: now(),
      step: "prepare",
      code: error.code ?? error.name,
      message: String(error.message).slice(0, 3000),
      attempt_ref: error.attempt_ref ?? extra.identity_ref ?? p1.identity.path,
      build_ref: extra.build_ref ?? null,
      service_stop: stop,
      first_error_preserved: true,
      ...extra.extra,
    });
    safeUpdateRunState(statePath, {
      status: "failed",
      failure: {code: error.code ?? error.name, message: String(error.message).slice(0, 3000), at: now(), ref: note},
      collect_ok: false,
      pid: extra.pid ?? null,
      process_identity: extra.process_identity ?? null,
      service_started_at: extra.service_started_at ?? null,
      ready: extra.ready ?? null,
      commands: {prepare: {argv: prepareArgv, cwd: WORKTREE, exit_code: error.exitCode ?? 1}},
    });
    error.unavailable_ref = note;
    error.service_stop = stop;
    throw error;
  };

  // 4. Verify what Phase 1 returned BEFORE deleting it. A mismatch stops here
  // and leaves the copy for triage.
  if (existsSync(copyRoot)) {
    // Any existing copy must be verifiably the Phase 1 object before it is
    // replaced. A partial or drifted copy stops here and is never deleted.
    let returned = {ok: false, aggregate: null, expected_aggregate: p1.identity.aggregate, mismatched: [], missing: [], unreadable: null};
    try {
      const returnedRows = identityRows(copyRoot);
      returned = compareRowsToP1(returnedRows, p1.identity.files, aggregateRows(returnedRows), p1.identity.aggregate);
    } catch (error) {
      returned = {...returned, unreadable: `${error.code ?? error.name}: ${error.message}`};
    }
    if (!returned.ok) {
      const error = fail("E_P1_RETURNED_DRIFT", "the Phase 1 returned copy identity differs from the explicit Phase 1 identity; the copy was not deleted and the update was not applied", {exitCode: 4, returned});
      await failPrepare(error, {identity_ref: p1.identity.path, extra: {returned_copy: returned}});
    }
  }

  // 5. Rebuild from source with the Phase 1 algorithm and verify again.
  rmSync(copyRoot, {recursive: true, force: true});
  await cp(sourceRoot, copyRoot, {
    recursive: true,
    force: false,
    mode: fsConstants.COPYFILE_FICLONE,
    filter: (path) => !path.includes(`${sep}.next`) && !path.endsWith("tsconfig.tsbuildinfo") && !path.includes(`${sep}.git${sep}`) && !path.endsWith(`${sep}.git`),
  });
  const beforeRows = identityRows(copyRoot);
  const beforeAggregate = aggregateRows(beforeRows);
  const before = compareRowsToP1(beforeRows, p1.identity.files, beforeAggregate, p1.identity.aggregate);
  if (!before.ok) {
    const error = fail("E_BEFORE_IDENTITY", "the rebuilt copy identity differs from the explicit Phase 1 identity; the update was not applied and the copy was kept", {exitCode: 4, before});
    await failPrepare(error, {identity_ref: p1.identity.path, extra: {rebuilt_copy: before}});
  }

  // 6. Apply exactly one token substitution and prove it is the only change.
  const globalsPath = join(copyRoot, TOKEN_PATH);
  const beforeBytes = readFileSync(globalsPath);
  const beforeText = beforeBytes.toString("utf8");
  const tokenOccurrencesBefore = beforeText.split(TOKEN_LINE_BEFORE).length - 1;
  if (tokenOccurrencesBefore !== 1 || beforeText.includes(TOKEN_LINE_AFTER)) {
    const error = fail("E_TOKEN_SHAPE", "copy globals.css is not the single expected 12px token before the update", {exitCode: 4, occurrences: tokenOccurrencesBefore});
    await failPrepare(error, {identity_ref: p1.identity.path, extra: {token_occurrences: tokenOccurrencesBefore, has_16px: beforeText.includes(TOKEN_LINE_AFTER)}});
  }
  const afterText = beforeText.replace(TOKEN_LINE_BEFORE, TOKEN_LINE_AFTER);
  writeFileSync(globalsPath, afterText);
  const afterBytes = readFileSync(globalsPath);
  const edit = singleControlledEdit(beforeBytes, afterBytes);
  const afterRows = identityRows(copyRoot);
  const afterAggregate = aggregateRows(afterRows);
  const beforeMap = new Map(beforeRows.map((row) => [row.path, row.sha256]));
  const changedPaths = afterRows.filter((row) => beforeMap.get(row.path) !== row.sha256).map((row) => row.path);
  const differences = changedPaths.map((path) => ({
    path,
    before_sha256: beforeMap.get(path) ?? null,
    after_sha256: afterRows.find((row) => row.path === path)?.sha256 ?? null,
  }));
  if (!edit.only_change || changedPaths.length !== 1 || changedPaths[0] !== TOKEN_PATH || afterRows.length !== beforeRows.length) {
    const error = fail("E_EXTRA_DIFFERENCE", "the controlled update produced more than the single app/globals.css token change; build and service were not started", {exitCode: 4, changed_paths: changedPaths});
    await failPrepare(error, {identity_ref: p1.identity.path, extra: {changed_paths: changedPaths, edit: {...edit, before_text: undefined, after_text: undefined}}});
  }

  // 7. Allocate one free evidence series and publish the identity+boundary
  // originals before the build.
  const evidence = selectEvidenceBase(taskRoot, parseEvidenceBase(options["evidence-series"]));
  safeUpdateRunState(statePath, {evidence_base: evidence.base});
  const identity = {
    schema: "c12-update-identity/1",
    object: "two-pages",
    object_name: OBJECT_NAME,
    run_id: runId,
    task_id: handle.identity.taskId,
    source_root: sourceRoot,
    copy_root: copyRoot,
    prepared_at: preparedAt,
    p1: {
      run_id: p1.identity.run_id,
      identity_ref: p1.identity.ref,
      identity_path: p1.identity.path,
      identity_sha256: p1.identity.sha256,
      aggregate: p1.identity.aggregate,
      files: p1.identity.files.length,
      service_ref: p1.service.ref,
      service_sha256: p1.service.sha256,
      design_ref: p1.design.ref,
      design_sha256: p1.design.sha256,
      interaction_ref: p1.interaction.ref,
      interaction_sha256: p1.interaction.sha256,
      engine: p1.service.engine,
      engine_session: p1.service.engine_session,
      latest_identity: p1.latest_identity,
      relation: p1.relation,
      board_before_status: p1.board_before_status,
      viewport_reference: p1.viewport_reference,
      before_gap_source: "P1 workbench direct .inlineactions computed gap (explicit design-facts original).",
      board_before_source: "未测：P1 did not compute the board's non-ready .inlineactions gap; the token value is not used as a computed before value.",
    },
    before: {files: beforeRows, aggregate: beforeAggregate},
    after: {files: afterRows, aggregate: afterAggregate},
    differences,
    controlled_change: {
      path: TOKEN_PATH,
      before: TOKEN_LINE_BEFORE,
      after: TOKEN_LINE_AFTER,
      property: TOKEN_PROPERTY,
      line: edit.line,
      occurrences_before: edit.occurrences_before,
      occurrences_after: edit.occurrences_after,
      only_change: edit.only_change,
      byte_for_byte_only_substitution: edit.expected_identical,
    },
    algorithm: "sha256 per file; sorted by path localeCompare; path\\0sha256\\n concatenated; sha256",
    status: "ok",
    consumer: "Phase 4 report author, independent acceptance reader and C10 input identity",
  };
  const identityRef = await publish(handle, evidence.identity, identity);
  safeUpdateRunState(statePath, {identity_ref: identityRef.ref, identity_sha256: identityRef.sha256});
  const boundary = await publishBoundary(handle, evidence.boundary, {runId, sourceRoot, copyRoot, before: identity.before, p1});
  const boundaryRef = {ref: evidence.boundary, sha256: boundary.sha256};

  // 8. Build and start the owned service. Every failure is reclaimed and keeps
  // the persisted state.
  const serviceLog = join(runDir, `${runId}-service.log`);
  const baseUrl = `http://127.0.0.1:${port}`;
  let build;
  let pid = null;
  let processIdentity = null;
  let serviceStartedAt = null;
  let ready = null;
  try {
    // The copy rebuild fetches Geist from Google Fonts. That external fetch is
    // intermittently unavailable in this environment; retry only that known
    // transient failure (at most three attempts), keep every receipt, and fail
    // immediately for any other build error.
    const buildAttempts = [];
    const maxBuildAttempts = 3;
    for (let attempt = 1; attempt <= maxBuildAttempts; attempt += 1) {
      const receipt = await handle.captureCommand({
        cwd: copyRoot,
        slug: `${runId}-build`,
        // Turbopack's Rust font fetch for next/font Geist is intermittently
        // unavailable in this host; the webpack build runs the same Next app
        // deterministically and still exercises the updated copy.
        argv: [process.execPath, join(copyRoot, NEXT_BIN), "build", "--webpack"],
        timeoutMs: 600_000,
      });
      let outputText = "";
      try { outputText = readFileSync(receipt.output_ref, "utf8"); } catch { /* receipt remains authoritative */ }
      const transientFontFailure = receipt.exit_code !== 0
        && /Failed to fetch Geist|next\/font: error|fonts\.googleapis\.com/.test(outputText)
        && /Failed to fetch|connection|offline|proxy|ECONN/i.test(outputText);
      buildAttempts.push({
        attempt,
        receipt_ref: receipt.receipt_ref,
        output_ref: receipt.output_ref,
        exit_code: receipt.exit_code,
        signal: receipt.signal ?? null,
        started_at: receipt.started_at,
        ended_at: receipt.ended_at,
        transient_font_failure: transientFontFailure,
      });
      build = receipt;
      if (receipt.exit_code === 0 || !transientFontFailure || attempt === maxBuildAttempts) break;
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 2_000 * attempt));
    }
    const buildRef = await publish(handle, evidence.build, {
      schema: "c12-update-build/1",
      run_id: runId,
      measured_at: now(),
      receipt_ref: build.receipt_ref,
      output_ref: build.output_ref,
      exit_code: build.exit_code,
      signal: build.signal ?? null,
      timed_out: build.timed_out ?? false,
      argv: build.argv,
      cwd: build.cwd,
      started_at: build.started_at,
      ended_at: build.ended_at,
      source_identity_after: afterAggregate,
      attempts: buildAttempts,
      bundler: "webpack",
      bundler_reason: "Turbopack's font fetch for next/font Geist fails intermittently on this host; --webpack builds the same Next app deterministically. The 19-file identity and the browser computed values remain this run's facts.",
      retry_policy: "at most three attempts, only when the failure output is the known external Google Fonts fetch; every other non-zero exit fails immediately; all receipts are retained",
      note: "next build against the updated copy; a non-zero final exit makes sync 未测, never a pass.",
    });
    safeUpdateRunState(statePath, {build_ref: build.receipt_ref, build_output_ref: build.output_ref, build_evidence_ref: buildRef.ref, build_attempts: buildAttempts});
    if (build.exit_code !== 0) {
      const error = fail("E_BUILD", `next build failed with exit ${build.exit_code}`, {exitCode: 5, build_ref: build.receipt_ref, output_ref: build.output_ref, attempts: buildAttempts});
      await failPrepare(error, {identity_ref: identityRef.ref, build_ref: build.receipt_ref, extra: {build_attempts: buildAttempts}});
    }
    pid = startServer({copyRoot, port, logPath: serviceLog});
    serviceStartedAt = now();
    for (let attempt = 0; attempt < 20 && !processIdentity?.start; attempt += 1) {
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 50));
      processIdentity = {pid, start: processStart(pid)};
    }
    ready = await waitService(baseUrl, ROUTES);
    if (!ready.ok) {
      const error = fail("E_SERVICE", `update service did not answer on ${baseUrl}`, {exitCode: 6, ready, service_log: serviceLog});
      await failPrepare(error, {identity_ref: identityRef.ref, pid, process_identity: processIdentity, service_started_at: serviceStartedAt, ready});
    }
    const owner = serviceIdentity(pid, port, processIdentity?.start ?? null);
    if (!owner.owned) {
      const error = fail("E_SERVICE_OWNER", "the 41923 listener is not this run's recorded process", {exitCode: 6, owner});
      await failPrepare(error, {identity_ref: identityRef.ref, pid, process_identity: processIdentity, service_started_at: serviceStartedAt, ready});
    }
    const runState = {
      ...initialState,
      status: "prepared",
      pid,
      process_identity: processIdentity,
      service_log: serviceLog,
      service_started_at: serviceStartedAt,
      ready,
      evidence_base: evidence.base,
      identity_ref: identityRef.ref,
      identity_sha256: identityRef.sha256,
      boundary_ref: boundaryRef.ref,
      build_ref: build.receipt_ref,
      build_output_ref: build.output_ref,
      build_evidence_ref: evidence.build,
      before_aggregate: beforeAggregate,
      after_aggregate: afterAggregate,
      commands: {prepare: {argv: prepareArgv, cwd: WORKTREE, exit_code: 0}},
      updated_at: now(),
    };
    writeRunState(statePath, runState);
    process.stdout.write(`${JSON.stringify({
      ok: true, step: "prepare", run_id: runId, evidence_base: evidence.base,
      identity_ref: identityRef.ref, identity_sha256: identityRef.sha256,
      before_aggregate: beforeAggregate, after_aggregate: afterAggregate,
      controlled_change: identity.controlled_change,
      copy_root: copyRoot, port, pid, build_exit: build.exit_code, service: {base_url: baseUrl, ready},
    })}\n`);
    return 0;
  } catch (error) {
    if (error.service_stop !== undefined || error.unavailable_ref) throw error;
    await failPrepare(error, {identity_ref: identityRef.ref, pid, process_identity: processIdentity, service_started_at: serviceStartedAt, ready, build_ref: build?.receipt_ref ?? null});
    return 1;
  }
}

// ---------------------------------------------------------------------------
// browser-env
// ---------------------------------------------------------------------------

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}
function browserEnv(argv) {
  const options = parseFlags(argv, ["run-id", "task-record-root"], ["p1-service"]);
  const taskRoot = resolve(options["task-record-root"]);
  const p1Engine = loadPhase1Engine(taskRoot, options["p1-service"] ?? P1_ORIGINALS_DEFAULT.service);
  const handle = openHandle(taskRoot);
  const engine = p1Engine.engine;
  const lines = [
    `export BROWSER_QA_TASK_ID=${shellQuote(handle.identity.taskId)}`,
    `export BROWSER_QA_ENGINE=${shellQuote(engine)}`,
    `export BROWSER_QA_AUTH_MODE=${shellQuote("none")}`,
  ];
  // ego-lite: the gateway creates the owned TaskSpace and injects
  // BROWSER_QA_EGO_TASKSPACE_NAME for the scenario. Never set SPACE_ID or
  // KEEP_OPEN (the gateway rejects both). agent-browser has no ego space and
  // must not receive any ego variable.
  if (engine === "ego-lite" && !text(p1Engine.engine_session)) throw fail("E_P1_ENGINE", "Phase 1 ego-lite original carries no session label", {exitCode: 4});
  process.stderr.write(`${JSON.stringify({
    step: "browser-env", run_id: options["run-id"], engine,
    engine_source: p1Engine.ref, engine_source_sha256: p1Engine.sha256,
    task_id_source: "openTask(...).identity.taskId", ego_space_injected_by_gateway: engine === "ego-lite",
    note: engine === "ego-lite"
      ? "no BROWSER_QA_EGO_SPACE_ID/KEEP_OPEN; the gateway owns one TaskSpace per --run"
      : "no ego space; the gateway owns its isolated Chrome and temporary profile",
  })}\n`);
  process.stdout.write(`${lines.join("\n")}\n`);
  return 0;
}

// ---------------------------------------------------------------------------
// Browser worker (embedded in the gateway-owned runtime)
// ---------------------------------------------------------------------------

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
    try { return new URL(item.url).pathname === "/simulation-board"; } catch { return false; }
  }) ?? targets[0];
  const attached = await cdp.call("Target.attachToTarget", {targetId: target.targetId, flatten: true});
  if (!attached?.sessionId) {
    cdp.close();
    throw Object.assign(new Error("agent-browser target attachment missing session"), {code: "E_AGENT_BROWSER_TARGET"});
  }
  const sessionId = attached.sessionId;
  const call = (method, params = {}) => cdp.call(method, params, sessionId);
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
      await call("Page.enable");
      const navigation = await call("Page.navigate", {url});
      if (navigation?.errorText) throw Object.assign(new Error(`agent-browser navigation failed: ${navigation.errorText}`), {code: "E_AGENT_BROWSER_NAVIGATE"});
      await waitFor("body", 30_000);
    },
    waitForSelector: (selector, options = {}) => waitFor(selector, options.timeout ?? 15_000),
    waitForTimeout: (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms)),
    selectOption: (selector, value) => evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) throw new Error("select not found"); element.focus(); const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set; setter.call(element, ${JSON.stringify(value)}); element.dispatchEvent(new Event("change", {bubbles: true})); return element.value; })()`),
  };
  return {page, close: () => cdp.close()};
}
async function measurePagesInBrowser(input) {
  let page;
  let closePage = () => {};
  if (input.engine === "agent-browser") {
    const opened = await openAgentBrowserPage(input);
    page = opened.page;
    closePage = opened.close;
  } else {
    // The ego runtime exposes taskSpace; the gateway has already created the
    // owned TaskSpace and injected its name into this scenario.
    const task = await taskSpace(input.spaceName);
    page = task.page("p1");
  }
  const output = {ok: true, engine: input.engine, session: input.session, attempt_id: input.attemptId, pages: [], errors: []};
  const observeJs = `(() => {
    const root = document.documentElement;
    const groups = [...document.querySelectorAll('.inlineactions')].filter((node) => node.getClientRects().length);
    const inline = groups[0] || null;
    const style = inline ? getComputedStyle(inline) : null;
    const rect = inline ? inline.getBoundingClientRect() : null;
    const preferred = [...document.querySelectorAll('.inlineactions .primary, .inlineactions .pb-ui-action')].filter((node) => node.getClientRects().length && !node.disabled);
    const fallback = [...document.querySelectorAll('.inlineactions button, .inlineactions a')].filter((node) => node.getClientRects().length && !node.disabled);
    const primary = preferred[0] || fallback[0] || null;
    const prect = primary ? primary.getBoundingClientRect() : null;
    let hit = null;
    if (prect && prect.width > 0 && prect.height > 0 && prect.right > 0 && prect.left < innerWidth && prect.bottom > 0 && prect.top < innerHeight) {
      const element = document.elementFromPoint((prect.left + prect.right) / 2, (prect.top + prect.bottom) / 2);
      hit = Boolean(element && (element === primary || primary.contains(element)));
    }
    const box = (value) => value ? {x: +value.x.toFixed(1), y: +value.y.toFixed(1), width: +value.width.toFixed(1), height: +value.height.toFixed(1), right: +value.right.toFixed(1), bottom: +value.bottom.toFixed(1)} : null;
    return {
      found: Boolean(inline && style),
      url: location.href,
      inner_width: innerWidth,
      inner_height: innerHeight,
      dpr: devicePixelRatio || 1,
      token: getComputedStyle(root).getPropertyValue('--inline-action-gap').trim(),
      gap: style ? style.gap : null,
      column_gap: style ? style.columnGap : null,
      inline_count: groups.length,
      inline: inline ? {rect: box(rect), display: style.display, clipped_right: rect.right > innerWidth, clipped_bottom: rect.bottom > innerHeight, within_viewport: rect.right > 0 && rect.left < innerWidth && rect.bottom > 0 && rect.top < innerHeight} : null,
      root: {
        scroll_width: root.scrollWidth,
        client_width: root.clientWidth,
        scroll_height: root.scrollHeight,
        client_height: root.clientHeight,
        overflow_x: root.scrollWidth > innerWidth,
        overflow_px: Math.max(0, root.scrollWidth - innerWidth),
        overflow_y: root.scrollHeight > innerHeight,
      },
      primary: primary ? {
        tag: primary.tagName,
        text: (primary.textContent || '').trim().slice(0, 80),
        rect: box(prect),
        disabled: Boolean(primary.disabled),
        clipped_right: prect.right > innerWidth,
        clipped_bottom: prect.bottom > innerHeight,
        within_viewport: prect.right > 0 && prect.left < innerWidth && prect.bottom > 0 && prect.top < innerHeight,
        reachable: prect.right > 0 && prect.left < innerWidth && prect.bottom > 0 && prect.top < innerHeight && prect.right <= innerWidth && prect.bottom <= innerHeight,
        center_hit: hit,
      } : null,
    };
  })()`;
  // A real viewport change: CDP device-metrics override, then wait until the
  // page reports the target innerWidth/innerHeight twice in a row. The resize
  // event and layout settle are observed, never assumed from the arguments.
  const setViewport = async (width, height) => {
    // Install a real resize observer before the override. The event count and
    // the repeated innerWidth/innerHeight reads together prove the layout saw
    // the change; the arguments alone are not accepted as evidence.
    await page.evaluate("(() => { if (window.__c12ResizeListener) window.removeEventListener('resize', window.__c12ResizeListener); window.__c12ResizeCount = 0; window.__c12ResizeListener = () => { window.__c12ResizeCount = (window.__c12ResizeCount || 0) + 1; }; window.addEventListener('resize', window.__c12ResizeListener); return true; })()");
    await page.cdp("Emulation.setDeviceMetricsOverride", {width, height, deviceScaleFactor: 1, mobile: false});
    const deadline = Date.now() + 5_000;
    let stable = 0;
    let last = null;
    while (Date.now() < deadline) {
      const value = await page.evaluate("({width: innerWidth, height: innerHeight, dpr: devicePixelRatio || 1})");
      last = value;
      if (value.width === width && value.height === height) {
        stable += 1;
        if (stable >= 2) {
          const events = await page.evaluate("window.__c12ResizeCount || 0");
          return {...value, resize_events: events};
        }
      } else {
        stable = 0;
      }
      await page.waitForTimeout(100);
    }
    throw Object.assign(new Error(`viewport did not stabilize at ${width}x${height}; last ${JSON.stringify(last)}`), {code: "E_VIEWPORT"});
  };
  try {
    for (const route of input.routes) {
      const pageRecord = {route, selector: ".inlineactions", viewports: [], errors: []};
      for (const viewport of input.viewports) {
        try {
          const observedViewport = await setViewport(viewport.width, viewport.height);
          await page.goto(`${input.serviceUrl}${route}`, {timeout: 30_000});
          await page.waitForSelector("body", {timeout: 15_000});
          let action;
          let preActionRoot = null;
          const stateContext = route === "/simulation-board" ? "empty（select[data-demo-state]=empty 显示操作后）" : "ready（frozen 默认态）";
          if (route === "/simulation-board") {
            preActionRoot = await page.evaluate("(() => { const root = document.documentElement; return {scroll_width: root.scrollWidth, client_width: root.clientWidth, inner_width: innerWidth, inner_height: innerHeight, overflow_x: root.scrollWidth > innerWidth, overflow_px: Math.max(0, root.scrollWidth - innerWidth)}; })()");
            // The board's ready state renders no .inlineactions. Switch to a
            // non-ready in-page state (the card's "先切非 ready 态") and read
            // the panel actions afterwards. No query string is used.
            await page.waitForSelector("select[data-demo-state]", {timeout: 15_000});
            action = "select[data-demo-state]=empty（切非 ready 态后读取 .inlineactions）";
            await page.selectOption("select[data-demo-state]", "empty");
            await page.waitForSelector(".data-state-panel .inlineactions", {timeout: 15_000});
          } else {
            action = "direct read（常驻 .inlineactions，不做显示操作）";
            await page.waitForSelector(".inlineactions", {timeout: 15_000});
          }
          await page.waitForTimeout(150);
          const observed = await page.evaluate(observeJs);
          const gap = typeof observed?.gap === "string" && observed.gap.trim()
            ? observed.gap.trim()
            : typeof observed?.column_gap === "string" ? observed.column_gap.trim() : "";
          if (observed?.found !== true || !gap) throw Object.assign(new Error(`computed gap missing at ${viewport.name}`), {code: "E_COMPUTED_MISSING"});
          const overflow = preActionRoot
            ? `ready 态根横向溢出 ${preActionRoot.overflow_px}px（scrollWidth ${preActionRoot.scroll_width} vs innerWidth ${preActionRoot.inner_width}）；显示操作后 ${observed.root.overflow_x ? `仍溢出 ${observed.root.overflow_px}px（scrollWidth ${observed.root.scroll_width}）` : `0px（scrollWidth ${observed.root.scroll_width}）`}`
            : observed.root.overflow_x
              ? `根横向溢出 ${observed.root.overflow_px}px（scrollWidth ${observed.root.scroll_width} > innerWidth ${observed.inner_width}）`
              : `根横向溢出 0px（scrollWidth ${observed.root.scroll_width} = innerWidth ${observed.inner_width}）`;
          let actionFact;
          if (!observed.primary) actionFact = "未找到主操作（.inlineactions 内无 button/a）";
          else if (!observed.primary.within_viewport) actionFact = `主操作「${observed.primary.text}」在视口外（rect 右缘 ${observed.primary.rect?.right}，bottom ${observed.primary.rect?.bottom}）`;
          else if (observed.primary.clipped_right || observed.primary.clipped_bottom) actionFact = `主操作「${observed.primary.text}」被视口裁切（clipped_right=${observed.primary.clipped_right}，clipped_bottom=${observed.primary.clipped_bottom}）`;
          else actionFact = `主操作「${observed.primary.text}」在视口内，中心点${observed.primary.center_hit ? "可命中" : "未命中（可能被遮挡）"}`;
          pageRecord.viewports.push({
            viewport: viewport.name,
            target: {width: viewport.width, height: viewport.height},
            observed: {width: observedViewport.width, height: observedViewport.height, dpr: observedViewport.dpr, resize_events: observedViewport.resize_events ?? 0},
            inner_width: observed.inner_width,
            inner_height: observed.inner_height,
            dpr: observed.dpr,
            status: "已取得",
            state_context: stateContext,
            root_ready: preActionRoot,
            gap,
            column_gap: observed.column_gap ?? null,
            token: observed.token ?? null,
            inline_count: observed.inline_count ?? null,
            inline: observed.inline ?? null,
            root: observed.root,
            primary: observed.primary,
            action,
            consequence: `${overflow}；${actionFact}。`,
            url: observed.url ?? null,
            measured_at: new Date().toISOString(),
          });
        } catch (error) {
          pageRecord.errors.push({viewport: viewport.name, code: error.code ?? error.name, message: String(error.message).slice(0, 1000)});
          pageRecord.viewports.push({
            viewport: viewport.name,
            target: {width: viewport.width, height: viewport.height},
            status: "未测",
            code: error.code ?? error.name,
            message: String(error.message).slice(0, 1000),
            owner: "采集环境 owner",
            recovery: "网关会话可用时重跑 collect 并复采该视口",
          });
        }
      }
      const primary = pageRecord.viewports.find((row) => row.viewport === "1280x800" && row.status !== "未测");
      if (!primary) {
        output.errors.push({route, code: "E_PRIMARY_VIEWPORT", message: "1280x800 .inlineactions measurement is missing"});
        continue;
      }
      pageRecord.before = input.beforeGap;
      pageRecord.after = primary.gap;
      pageRecord.action = primary.action;
      pageRecord.engine = input.engine;
      pageRecord.engine_session = input.session;
      pageRecord.object_version = input.objectVersion;
      pageRecord.computed_property = "gap";
      pageRecord.column_gap = primary.column_gap ?? null;
      pageRecord.row_gap = null;
      pageRecord.token_observed = primary.token ?? null;
      pageRecord.display = primary.inline?.display ?? null;
      pageRecord.element_count = primary.inline_count ?? null;
      pageRecord.text = primary.primary?.text ?? null;
      pageRecord.url = primary.url ?? null;
      pageRecord.measured_at = primary.measured_at ?? new Date().toISOString();
      output.pages.push(pageRecord);
    }
  } finally {
    try { closePage(); } catch { /* the gateway still owns the session cleanup */ }
  }
  output.ok = output.errors.length === 0 && output.pages.length === input.routes.length;
  return output;
}
function workerScript(input) {
  // The worker runs in a bare `node -e` / ego eval scope. Every module-scope
  // binding the serialized functions close over is re-created here, so the
  // agent-browser branch cannot die on an unbound join/pathToFileURL before it
  // reaches the CDP step.
  return `
const input = ${JSON.stringify(input)};
const fs = await import("node:fs");
const {join} = await import("node:path");
const {pathToFileURL} = await import("node:url");
${openAgentBrowserPage.toString()}
${measurePagesInBrowser.toString()}
try {
  const value = await measurePagesInBrowser(input);
  fs.writeFileSync(input.resultPath, JSON.stringify(value));
  console.log(JSON.stringify({ok: value.ok, pages: value.pages.length, errors: value.errors.length}));
} catch (error) {
  const payload = {
    ok: false,
    attempt_id: input.attemptId,
    engine: input.engine,
    code: error.code ?? error.name ?? "E_WORKER",
    message: String(error.message).slice(0, 4000),
    stack: String(error.stack ?? "").slice(0, 4000),
    failed_at: new Date().toISOString(),
  };
  try { fs.writeFileSync(input.resultPath, JSON.stringify(payload)); } catch { /* the outer run records the missing result */ }
  console.error(JSON.stringify({ok: false, code: payload.code, message: payload.message.slice(0, 2000)}));
  process.exitCode = 1;
}
`;
}
// The agent-browser branch cannot be selected through this gateway while the
// ego app is installed (browser-qa-session refuses it). This preflight proves
// the generated worker parses, defines the bindings the serialized function
// needs, and reaches the CDP-endpoint acquisition step with a controlled error
// instead of a ReferenceError. End-to-end page measurement for that branch is
// recorded as unavailable with an owner and a recovery condition.
function agentBrowserPreflight() {
  const resultPath = join(RUN_DIR_DEFAULT, `c12-p3-preflight-result-${process.pid}.json`);
  const input = {
    workspace: WORKTREE,
    serviceUrl: "http://127.0.0.1:1",
    routes: MEASURE_ROUTES,
    engine: "agent-browser",
    session: `c12-p3-preflight-${process.pid}`,
    spaceName: "",
    objectVersion: "preflight",
    beforeGap: GAP_BEFORE,
    attemptId: "preflight",
    resultPath,
  };
  const script = workerScript(input);
  const file = join(RUN_DIR_DEFAULT, `c12-p3-worker-preflight-${process.pid}.mjs`);
  mkdirSync(RUN_DIR_DEFAULT, {recursive: true});
  writeFileSync(file, script);
  const check = spawnSync(process.execPath, ["--check", file], {encoding: "utf8", timeout: 30_000});
  const bindingsScript = `
const fs = await import("node:fs");
const {join} = await import("node:path");
const {pathToFileURL} = await import("node:url");
${openAgentBrowserPage.toString()}
const out = {join: typeof join, pathToFileURL: typeof pathToFileURL, open: typeof openAgentBrowserPage};
try {
  await openAgentBrowserPage(${JSON.stringify(input)});
  out.cdp_endpoint = "unexpected-connect";
} catch (error) {
  out.cdp_endpoint = "controlled-error";
  out.code = error.code ?? null;
  out.message = String(error.message).slice(0, 300);
}
console.log(JSON.stringify(out));
`;
  // The probe points the binary at a missing path, which exercises the same
  // function body and its CDP-endpoint try/catch without launching a browser.
  const bindings = spawnSync(process.execPath, ["-e", bindingsScript], {
    cwd: WORKTREE,
    env: {...process.env, BROWSER_QA_AGENT_BROWSER_PATH: "/nonexistent/agent-browser-preflight"},
    encoding: "utf8",
    timeout: 60_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  try { rmSync(file, {force: true}); } catch { /* temp file only */ }
  let probe = null;
  for (const line of String(bindings.stdout ?? "").trim().split("\n").reverse()) {
    try { probe = JSON.parse(line); break; } catch { /* keep looking */ }
  }
  const scriptOk = check.status === 0;
  const bindingsOk = probe?.join === "function" && probe?.pathToFileURL === "function" && probe?.open === "function";
  const cdpOk = probe?.cdp_endpoint === "controlled-error" && ["E_AGENT_BROWSER_CDP", "E_AGENT_BROWSER_TARGET"].includes(probe?.code);
  return {
    script_check: {exit_code: check.status, signal: check.signal ?? null, ok: scriptOk, stderr: String(check.stderr ?? "").slice(0, 1000)},
    bindings_probe: {exit_code: bindings.status, signal: bindings.signal ?? null, ok: Boolean(bindingsOk), probe, stderr: String(bindings.stderr ?? "").slice(0, 1000)},
    cdp_endpoint_reached: Boolean(cdpOk),
    status: scriptOk && bindingsOk && cdpOk ? "bindings-ok" : "failed",
    end_to_end: "unavailable",
    end_to_end_reason: "the isolated-browser-qa gateway refuses an explicit agent-browser selection while the ego app is installed (EGO_INSTALLED_AGENT_BROWSER_FORBIDDEN), and this phase must not switch the Phase 1 engine",
    owner: "环境 owner",
    recovery: "在 ego 不可用或已卸载的真实环境经 gateway --run 选 agent-browser，复跑两页计算值采集并留原件",
    checked_at: now(),
  };
}

// ---------------------------------------------------------------------------
// collect
// ---------------------------------------------------------------------------

function syncVerdict({build = "success", service = "success", pages}) {
  if (build !== "success" || service !== "success") return "未测";
  const changed = ROUTES.filter((route) => {
    const page = (pages ?? []).find((row) => row.route === route);
    return page?.before === GAP_BEFORE && page?.after === GAP_AFTER;
  }).length;
  return changed === 2 ? "可用" : changed === 1 ? "部分可用" : "不可用";
}
function walkJsonFiles(root, {maxFiles = 2_000, maxDepth = 6} = {}) {
  const files = [];
  const stack = [{dir: root, depth: 0}];
  while (stack.length && files.length < maxFiles) {
    const {dir, depth} = stack.pop();
    let entries;
    try { entries = readdirSync(dir, {withFileTypes: true}); } catch { continue; }
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) { if (depth < maxDepth) stack.push({dir: path, depth: depth + 1}); }
      else if (entry.isFile() && entry.name.endsWith(".json")) files.push(path);
    }
  }
  return files;
}
function c10ReadVerdict(doc, aggregate) {
  const object = doc?.object;
  if (object?.name !== OBJECT_NAME) return {accepted: false, reason: "object name differs from the C12 changed object"};
  if (object?.version !== aggregate) return {accepted: false, reason: "object version differs from the C12 after-change identity"};
  const task = doc?.task ?? doc?.task_id ?? doc?.executor_task ?? doc?.source_task;
  if (task !== "C10") return {accepted: false, reason: "record is not a C10 record"};
  const status = String(doc?.status ?? doc?.result?.status ?? "").toLowerCase();
  if (/未测|untested|planned|pending|unavailable|unknown/.test(status)) return {accepted: false, reason: `status ${status || "missing"} does not assert a completed read`};
  const action = String(doc?.action ?? doc?.operation ?? doc?.read_action ?? doc?.kind ?? "");
  const readFlag = doc?.read === true || doc?.readback === true || /read|读回|读取/i.test(action);
  if (!readFlag) return {accepted: false, reason: "no explicit read action"};
  const readAt = doc?.read_at ?? doc?.readback_at ?? doc?.observed_at ?? doc?.produced_at ?? doc?.checked_at;
  if (typeof readAt !== "string" || Number.isNaN(Date.parse(readAt))) return {accepted: false, reason: "no readable read timestamp"};
  return {accepted: true, action, read_at: readAt, executor: doc?.executor ?? doc?.executor_task ?? null};
}
function findC10Readback(afterAggregate) {
  const attempts = [];
  if (!existsSync(C10_EVIDENCE_ROOT)) return {status: "未测", reason: `C10 evidence root does not exist: ${C10_EVIDENCE_ROOT}`, attempts, evidence_root: C10_EVIDENCE_ROOT, scanned: 0};
  const files = walkJsonFiles(C10_EVIDENCE_ROOT);
  for (const path of files) {
    const parsed = readJson(path);
    if (parsed.error) { attempts.push({ref: path, readable: false, error: parsed.error}); continue; }
    const verdict = c10ReadVerdict(parsed.value, afterAggregate);
    if (verdict.accepted) {
      return {status: "可用", ref: path, original: parsed.value, verdict, attempts, evidence_root: C10_EVIDENCE_ROOT, scanned: files.length};
    }
    const object = parsed.value?.object;
    if (object?.name === OBJECT_NAME && object?.version === afterAggregate) {
      attempts.push({ref: path, readable: true, accepted: false, reason: verdict.reason, object: {name: object.name, version: object.version}});
    }
  }
  return {
    status: "未测",
    reason: `recursive scan of ${C10_EVIDENCE_ROOT} (${files.length} JSON files) found no C10 original that proves C10 actually read ${OBJECT_NAME} at ${afterAggregate}; object mentions without a read action/timestamp do not count`,
    attempts,
    evidence_root: C10_EVIDENCE_ROOT,
    scanned: files.length,
  };
}
async function collect(argv) {
  const options = parseFlags(argv, ["run-id", "service-url", "task-record-root"]);
  const runId = options["run-id"];
  const serviceUrl = options["service-url"].replace(/\/$/, "");
  const taskRoot = resolve(options["task-record-root"]);
  const handle = openHandle(taskRoot);
  const statePath = join(process.env.C12_UPDATE_RUN_DIR || RUN_DIR_DEFAULT, `${runId}-run-state.json`);
  const stateRead = readJson(statePath);
  if (stateRead.error) throw fail("E_RUN_STATE", `run state for ${runId} not found at ${statePath}; run prepare first`, {exitCode: 2, error: stateRead.error});
  const runState = stateRead.value;
  if (runState.run_id !== runId) throw fail("E_RUN_STATE", `run state run_id ${runState.run_id} differs from ${runId}`, {exitCode: 2});
  if (runState.task_root !== taskRoot) throw fail("E_RUN_STATE", `run state task root ${runState.task_root} differs from ${taskRoot}`, {exitCode: 2});
  if (runState.base_url !== serviceUrl) throw fail("E_SERVICE_IDENTITY", `service URL ${serviceUrl} differs from prepared ${runState.base_url}`, {exitCode: 2});
  const evidence = evidenceFamily(Number(runState.evidence_base));
  if (!Number.isSafeInteger(evidence.base)) throw fail("E_RUN_STATE", "run state carries no usable evidence base", {exitCode: 2});
  const taken = [evidence.service, evidence.computed, evidence.readback, evidence.result, evidence.checks, evidence.preflight, evidence.responsive].filter((ref) => existsSync(join(taskRoot, ref)));
  if (taken.length) throw fail("E_EVIDENCE_EXISTS", `this run's collect originals already exist (${taken[0]}); prepare a new series instead of overwriting`, {exitCode: 3, taken});
  const identityPath = absoluteTaskFile(taskRoot, runState.identity_ref);
  const identityRead = readJson(identityPath);
  if (identityRead.error) throw fail("E_EVIDENCE_READ", `update identity original is unreadable: ${identityRead.error}`, {exitCode: 3});
  const identity = identityRead.value;

  const engine = process.env.BROWSER_QA_ENGINE ?? "";
  const session = process.env.BROWSER_QA_SESSION ?? "";
  const spaceName = process.env.BROWSER_QA_EGO_TASKSPACE_NAME ?? "";
  const hostTaskId = process.env.BROWSER_QA_TASK_ID ?? "";
  const gateway = {
    engine, session,
    task_id_source: hostTaskId ? "BROWSER_QA_TASK_ID from host adapter" : "missing",
    task_id_matches_handle: hostTaskId === handle.identity.taskId,
    ego_space_name_supplied: Boolean(spaceName),
    auth_mode: process.env.BROWSER_QA_AUTH_MODE ?? "unset",
  };
  const unavailable = async (code, message, extra = {}) => {
    const note = await recordNote(handle, `${runId}-collect-unavailable`, {
      schema: "c12-update-unavailable/1", run_id: runId, recorded_at: now(), step: "collect",
      code, message, evidence_base: evidence.base, gateway, ...extra,
    });
    safeUpdateRunState(statePath, {
      collect_ok: false,
      status: "collect-failed",
      collect_error: {code, message, at: now(), ref: note, attempt_ref: extra.attempt_ref ?? null},
      commands: {...(runState.commands ?? {}), collect: {argv: process.argv.slice(), cwd: WORKTREE, exit_code: 1}},
    });
    return fail(code, message, {exitCode: 4, unavailable_ref: note, ...extra});
  };

  if (!ENGINE_ALLOWED.includes(engine)) throw await unavailable("E_ENGINE", `collect requires the Phase 1 selected engine; observed engine=${JSON.stringify(engine)}; no engine switch is attempted.`, {expected_engine: runState.engine});
  if (engine !== runState.engine || engine !== runState.p1?.engine) throw await unavailable("E_ENGINE_SWITCH", `gateway engine ${engine} differs from the Phase 1/prepare engine ${runState.engine}; collection stopped and no switch is attempted.`, {expected_engine: runState.engine});
  if (!text(session) || /^(unset|unavailable|unavailable-session|unknown|none)$/i.test(session)) throw await unavailable("E_SESSION", "BROWSER_QA_SESSION is absent or a placeholder; a real gateway-owned session label is required.");
  if (engine === "ego-lite" && !spaceName) throw await unavailable("E_GATEWAY_CONTEXT", "BROWSER_QA_EGO_TASKSPACE_NAME is absent; the ego route must run inside the isolated-browser-qa --run scenario.");
  if (engine === "agent-browser" && (process.env.BROWSER_QA_EGO_TASKSPACE_NAME !== undefined || process.env.BROWSER_QA_EGO_SPACE_ID !== undefined || process.env.BROWSER_QA_EGO_KEEP_OPEN !== undefined)) {
    throw await unavailable("E_ENGINE_CONTEXT", "agent-browser route received ego space variables; the environment does not belong to this engine.");
  }
  if (!hostTaskId || hostTaskId !== handle.identity.taskId) throw await unavailable("E_TASK_ID", `host task id missing or different from handle task id (${handle.identity.taskId}).`);

  const serviceOwner = serviceIdentity(runState.pid, runState.port, runState.process_identity?.start ?? null);
  if (!serviceOwner.owned) throw await unavailable("E_SERVICE_OWNER", "port listener identity does not belong to this run; page observations are not attributed.", {service_owner: serviceOwner});

  const liveRows = identityRows(runState.copy_root);
  const liveAggregate = aggregateRows(liveRows);
  if (liveAggregate !== identity.after?.aggregate) {
    throw await unavailable("E_IDENTITY_DRIFT", "copy identity drifted after prepare; browser collection stopped.", {expected_after: identity.after?.aggregate ?? null, observed: liveAggregate});
  }
  const globalsText = readFileSync(join(runState.copy_root, TOKEN_PATH), "utf8");
  const tokenAfterCount = globalsText.split(TOKEN_LINE_AFTER).length - 1;
  const tokenBeforeCount = globalsText.split(TOKEN_LINE_BEFORE).length - 1;
  if (tokenAfterCount !== 1 || tokenBeforeCount !== 0) throw await unavailable("E_TOKEN_DRIFT", `copy token counts are 16px=${tokenAfterCount}, 12px=${tokenBeforeCount}; expected exactly one 16px token.`);
  const ready = await waitService(serviceUrl, ROUTES, 10_000);
  if (!ready.ok) throw await unavailable("E_SERVICE", `service unavailable at ${serviceUrl}`, {ready});

  // Publish the service original at collect time so the owner, pid and the
  // gateway session below are this run's 41923 facts, not Phase 1's.
  const serviceDoc = {
    schema: "c12-update-service/1",
    object: "two-pages",
    run_id: runId,
    task_id: handle.identity.taskId,
    port: runState.port,
    base_url: serviceUrl,
    copy_root: runState.copy_root,
    source_root: runState.source_root,
    argv: [process.execPath, join(runState.copy_root, NEXT_BIN), "start", "--hostname", "127.0.0.1", "--port", String(runState.port)],
    pid: runState.pid,
    process_identity: runState.process_identity,
    service_log: runState.service_log,
    prepared_at: runState.prepared_at,
    service_started_at: runState.service_started_at,
    build: {receipt_ref: runState.build_ref, output_ref: runState.build_output_ref},
    ready,
    service_owner: serviceOwner,
    engine,
    engine_session: session,
    gateway,
    collected_at: now(),
    notes: [
      "This service is owned by Phase 3 (task 3); cleanup stops it after collect.",
      "The engine session is this gateway --run's session; Phase 1's session is only provenance in p1 fields.",
    ],
  };
  const serviceRef = await publish(handle, evidence.service, serviceDoc);

  // Preflight for the agent-browser branch: the current gateway cannot select
  // it while ego is installed, so this records bindings/CDP acquisition and
  // keeps end-to-end measurement unavailable with an owner.
  const preflight = agentBrowserPreflight();
  const preflightRef = await publish(handle, evidence.preflight, {schema: "c12-update-agent-browser-preflight/1", run_id: runId, selected_engine: engine, ...preflight});
  if (engine === "agent-browser" && preflight.status !== "bindings-ok") {
    throw await unavailable("E_AGENT_BROWSER_PREFLIGHT", "the selected agent-browser worker failed its own preflight; collection stopped.", {preflight_ref: preflightRef.ref, preflight});
  }

  const attemptId = `${runId}-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
  const workerResultPath = join(RUN_DIR_DEFAULT, `${runId}-worker-result-${attemptId}.json`);
  const workerLog = join(RUN_DIR_DEFAULT, `${runId}-worker-${attemptId}.log`);
  mkdirSync(RUN_DIR_DEFAULT, {recursive: true});
  const workerInput = {
    workspace: WORKTREE,
    serviceUrl,
    routes: MEASURE_ROUTES,
    engine,
    session,
    spaceName,
    objectVersion: identity.after.aggregate,
    beforeGap: GAP_BEFORE,
    viewports: VIEWPORTS.map((viewport) => ({name: viewport.name, width: viewport.width, height: viewport.height})),
    attemptId,
    resultPath: workerResultPath,
  };
  const script = workerScript(workerInput);
  const helper = process.env.BROWSER_QA_EGO_HELPER_PATH || "ego-browser";
  const child = engine === "agent-browser"
    ? spawnSync(process.execPath, ["-e", script], {cwd: WORKTREE, env: {...process.env, BROWSER_QA_ENGINE: engine}, encoding: "utf8", timeout: 300_000, maxBuffer: 32 * 1024 * 1024})
    : spawnSync(helper, ["nodejs", "-e", script], {cwd: WORKTREE, env: {...process.env, BROWSER_QA_ENGINE: engine}, encoding: "utf8", timeout: 300_000, maxBuffer: 32 * 1024 * 1024});
  const workerBytes = {stdout: String(child.stdout ?? "").slice(0, 8_000), stderr: String(child.stderr ?? "").slice(0, 8_000), exit_code: child.status, signal: child.signal ?? null};
  writeFileSync(workerLog, `ATTEMPT ${attemptId}\nENGINE ${engine}\nEXIT ${child.status} SIGNAL ${child.signal}\nSTDOUT\n${child.stdout ?? ""}\nSTDERR\n${child.stderr ?? ""}\n`);
  const workerRead = readJson(workerResultPath);
  if (workerRead.error) {
    throw await unavailable("E_WORKER_RESULT", `worker result is missing: ${workerRead.error}`, {attempt_ref: workerResultPath, worker_log: workerLog, worker: workerBytes});
  }
  const worker = workerRead.value;
  if (!worker?.attempt_id) {
    throw await unavailable("E_WORKER_RESULT", "worker result carries no attempt id; the real failure is preserved below instead of being renamed stale.", {
      attempt_ref: workerResultPath, attempt_id: attemptId, worker: workerBytes, worker_code: worker?.code ?? null, worker_message: worker?.message ?? null,
    });
  }
  if (worker.attempt_id !== attemptId) {
    throw await unavailable("E_WORKER_STALE", "worker result attempt id does not match this attempt; a stale result is never accepted.", {
      attempt_ref: workerResultPath, expected_attempt: attemptId, observed_attempt: worker.attempt_id, worker: workerBytes,
    });
  }
  if (worker.ok !== true || !Array.isArray(worker.pages) || worker.pages.length !== MEASURE_ROUTES.length) {
    throw await unavailable("E_WORKER_PAGES", "the owned browser did not measure both pages; the board half is 未测 and sync cannot be 可用.", {
      attempt_ref: workerResultPath, attempt_id: attemptId, worker: workerBytes,
      worker_errors: worker.errors ?? null, worker_code: worker.code ?? null, worker_message: worker.message ?? null,
    });
  }

  const pages = ROUTES.map((route) => {
    const measured = worker.pages.find((row) => row.route === route);
    if (!measured) throw fail("E_WORKER_PAGES", `worker returned no page row for ${route}`, {exitCode: 6});
    const isBoard = route === "/simulation-board";
    const beforeSource = isBoard
      ? {
        status: "未测",
        value: null,
        kind: "p1_missing_board_computed",
        ref: identity.p1.design_ref,
        interaction_ref: identity.p1.interaction_ref,
        owner: "Phase 1 执行者",
        recovery: "在下一轮受控修改前，用同一 board 既定显示操作（select[data-demo-state]=empty）读取 .inlineactions 计算 gap 并留原件；token 12px 不是计算值，不能代填",
        detail: identity.p1.board_before_source,
      }
      : {
        status: "已取得",
        value: GAP_BEFORE,
        kind: "p1_original_computed",
        ref: identity.p1.design_ref,
        ref_sha256: identity.p1.design_sha256,
        field: "facts[route=/sim-workbench].inlineGap",
        owner: "Phase 1 执行者",
        note: identity.p1.before_gap_source,
      };
    const viewportRows = (Array.isArray(measured.viewports) ? measured.viewports : []).map((row) => {
      const reference = (identity.p1.viewport_reference ?? []).find((cell) => cell.route === route && cell.viewport === row.viewport) ?? null;
      return {
        ...row,
        p1_reference: reference,
        overflow_delta_px: reference && Number.isFinite(reference.root_scroll_width) && row.root && Number.isFinite(row.root.scroll_width)
          ? row.root.scroll_width - reference.root_scroll_width
          : null,
      };
    });
    return {
      route,
      selector: ".inlineactions",
      before: isBoard ? "未测" : GAP_BEFORE,
      before_status: isBoard ? "未测" : "已取得",
      after: measured.after,
      viewports: viewportRows,
      action: measured.action,
      engine: measured.engine,
      engine_session: measured.engine_session,
      object_version: measured.object_version,
      computed_property: measured.computed_property ?? "gap",
      column_gap: measured.column_gap ?? null,
      row_gap: measured.row_gap ?? null,
      token_observed: measured.token_observed ?? null,
      display: measured.display ?? null,
      element_count: measured.element_count ?? null,
      text: measured.text ?? null,
      url: measured.url ?? null,
      measured_at: measured.measured_at ?? now(),
      before_source: beforeSource,
    };
  });
  for (const page of pages) {
    if (!text(page.engine) || !text(page.engine_session) || !text(page.object_version)) {
      throw await unavailable("E_COMPUTED_IDENTITY", `computed identity is incomplete for ${page.route}; engine, session and object version are all required.`, {attempt_ref: workerResultPath, attempt_id: attemptId});
    }
    if (!text(page.after)) throw await unavailable("E_COMPUTED_MISSING", `computed after value is missing for ${page.route}`, {attempt_ref: workerResultPath, attempt_id: attemptId});
    if (page.token_observed !== GAP_AFTER) throw await unavailable("E_TOKEN_OBSERVED", `live token for ${page.route} is ${JSON.stringify(page.token_observed)}, expected ${GAP_AFTER}; identity drift is not a sync result.`, {attempt_ref: workerResultPath, attempt_id: attemptId});
    for (const row of page.viewports ?? []) {
      if (row.status !== "已取得") continue;
      if (row.token !== GAP_AFTER) throw await unavailable("E_VIEWPORT_TOKEN", `live token for ${page.route} at ${row.viewport} is ${JSON.stringify(row.token)}, expected ${GAP_AFTER}.`, {attempt_ref: workerResultPath, attempt_id: attemptId, viewport: row.viewport});
      if (!text(row.gap)) throw await unavailable("E_VIEWPORT_GAP", `computed gap is missing for ${page.route} at ${row.viewport}.`, {attempt_ref: workerResultPath, attempt_id: attemptId, viewport: row.viewport});
    }
  }
  const buildReceipt = readJson(absoluteTaskFile(taskRoot, runState.build_ref));
  const buildState = buildReceipt.error ? "unknown" : buildReceipt.value?.exit_code === 0 ? "success" : "failed";
  const serviceState = serviceOwner.owned && ready.ok ? "success" : "failed";
  const sync = syncVerdict({build: buildState, service: serviceState, pages});
  const boardPage = pages.find((page) => page.route === "/simulation-board");
  const workbenchPage = pages.find((page) => page.route === "/sim-workbench");
  const viewportMatrix = pages.flatMap((page) => (page.viewports ?? []).map((row) => ({route: page.route, ...row})));
  const cellOf = (route, viewport) => viewportMatrix.find((row) => row.route === route && row.viewport === viewport) ?? null;
  const describeCell = (cell) => cell
    ? cell.status === "已取得"
      ? `${cell.gap}（实测 inner ${cell.inner_width}x${cell.inner_height}，dpr ${cell.dpr}，根横向溢出 ${cell.root.overflow_px}px，P1 差 ${cell.overflow_delta_px ?? "unknown"}px；${cell.consequence}）`
      : `未测（${cell.code ?? "no measurement"}：${cell.message ?? "missing"}）`
    : "未测（missing cell）";
  const board390 = cellOf("/simulation-board", "390x844");
  const workbench390 = cellOf("/sim-workbench", "390x844");
  const responsive = {
    schema: "c12-update-responsive/1",
    object: "two-pages",
    run_id: runId,
    produced_at: now(),
    engine,
    engine_session: session,
    object_version: identity.after.aggregate,
    viewports: VIEWPORTS.map((viewport) => viewport.name),
    method: "same owned browser session; a resize listener is installed, then CDP Emulation.setDeviceMetricsOverride per viewport; wait until innerWidth/innerHeight matches twice and record the observed resize event count; board display action re-applied per viewport",
    cells: viewportMatrix,
    summary: Object.fromEntries(VIEWPORTS.map((viewport) => [viewport.name, {
      board: describeCell(cellOf("/simulation-board", viewport.name)),
      workbench: describeCell(cellOf("/sim-workbench", viewport.name)),
    }])),
    state_context: {
      "1280x800": {board: cellOf("/simulation-board", "1280x800")?.state_context ?? null, workbench: cellOf("/sim-workbench", "1280x800")?.state_context ?? null},
      "390x844": {board: board390?.state_context ?? null, workbench: workbench390?.state_context ?? null},
    },
    p1_reference_context: "P1 design-facts rows are the frozen ready state at the stored viewport; the board row here is measured after the required empty-state display action, so board ready-vs-empty deltas are state differences, not token effects.",
    overflow_after: {
      "1280x800": {
        board_ready: cellOf("/simulation-board", "1280x800")?.root_ready?.overflow_px ?? null,
        board_empty: cellOf("/simulation-board", "1280x800")?.root?.overflow_px ?? null,
        workbench: cellOf("/sim-workbench", "1280x800")?.root?.overflow_px ?? null,
      },
      "390x844": {
        board_ready: board390?.root_ready?.overflow_px ?? null,
        board_empty: board390?.root?.overflow_px ?? null,
        workbench: workbench390?.root?.overflow_px ?? null,
      },
    },
    overflow_delta_vs_p1: {
      "1280x800": {board_ready: cellOf("/simulation-board", "1280x800")?.root_ready ? (cellOf("/simulation-board", "1280x800").root_ready.scroll_width - (cellOf("/simulation-board", "1280x800").p1_reference?.root_scroll_width ?? cellOf("/simulation-board", "1280x800").root_ready.scroll_width)) : null, workbench: cellOf("/sim-workbench", "1280x800")?.overflow_delta_px ?? null},
      "390x844": {board_ready: board390?.root_ready && Number.isFinite(board390.p1_reference?.root_scroll_width) ? board390.root_ready.scroll_width - board390.p1_reference.root_scroll_width : null, workbench: workbench390?.overflow_delta_px ?? null},
    },
    main_action_390: {
      board: board390?.primary ?? null,
      workbench: workbench390?.primary ?? null,
      board_reachable: board390?.primary?.reachable ?? null,
      workbench_reachable: workbench390?.primary?.reachable ?? null,
      conclusion: board390?.status === "已取得" && workbench390?.status === "已取得"
        ? `board 主操作「${board390.primary?.text ?? "未找到"}」${board390.primary?.reachable ? "在视口内且可命中" : "不在可点击视口内"}；workbench 主操作「${workbench390.primary?.text ?? "未找到"}」${workbench390.primary?.reachable ? "在视口内且可命中" : `不在可点击视口内（y=${workbench390.primary?.rect?.y ?? "?"}，需滚动；未被横向裁切=${!workbench390.primary?.clipped_right}）`}`
        : "390×844 至少一页未测，主操作可达性不能判定；owner=采集环境 owner，恢复条件=网关会话可用时重跑 collect",
    },
    conclusion: board390?.status === "已取得" && workbench390?.status === "已取得"
      ? `1280×800 与 390×844 均已实测，gap 均为 16px。390 根横向溢出：board ready ${board390.root_ready?.overflow_px ?? "?"}px、board empty ${board390.root?.overflow_px ?? "?"}px、workbench ${workbench390.root.overflow_px}px；P1 ready 参考差 board=${board390.root_ready && Number.isFinite(board390.p1_reference?.root_scroll_width) ? board390.root_ready.scroll_width - board390.p1_reference.root_scroll_width : "unknown"}px、workbench=${workbench390.overflow_delta_px ?? "unknown"}px。${board390.consequence}${workbench390.consequence}`
      : "1280×800 已实测；390×844 缺采，响应式后果未测，owner=采集环境 owner，恢复条件=重跑 collect 复采 390×844",
    limitations: [
      "only the two live pages at 1280x800 and 390x844; no 200% zoom, contrast audit, physical screen reader or long-term visual regression",
    ],
  };
  const responsiveRef = await publish(handle, evidence.responsive, responsive);
  const computed = {
    schema: "c12-update-computed/1",
    object: "two-pages",
    run_id: runId,
    produced_at: now(),
    engine,
    engine_session: session,
    object_version: identity.after.aggregate,
    build: buildState,
    build_receipt_ref: runState.build_ref,
    build_exit_code: buildReceipt.error ? null : buildReceipt.value?.exit_code ?? null,
    service: serviceState,
    service_url: serviceUrl,
    service_owner: serviceOwner,
    selector: ".inlineactions",
    pages,
    viewport_matrix: viewportMatrix,
    responsive_ref: responsiveRef.ref,
    responsive_sha256: responsiveRef.sha256,
    responsive_summary: {
      viewports: responsive.viewports,
      overflow_after: responsive.overflow_after,
      overflow_delta_vs_p1: responsive.overflow_delta_vs_p1,
      main_action_390: responsive.main_action_390.conclusion,
      conclusion: responsive.conclusion,
    },
    sync,
    sync_components: {board: boardPage?.before_status === "已取得" ? (boardPage.before === GAP_BEFORE && boardPage.after === GAP_AFTER ? "可用" : "不可用") : "未测", workbench: workbenchPage?.before === GAP_BEFORE && workbenchPage?.after === GAP_AFTER ? "可用" : "不可用"},
    sync_reason: boardPage?.before_status === "未测"
      ? "workbench before 12px→after 16px was measured; the board pre-change computed value was not captured by Phase 1, so the board half is 未测 (not 'unchanged') and the oracle verdict is 部分可用."
      : "both page halves have measured before/after values.",
    attempt_id: attemptId,
    attempt_ref: workerResultPath,
    identity_ref: runState.identity_ref,
    identity_sha256: runState.identity_sha256,
    build_ref: runState.build_ref,
    service_ref: serviceRef.ref,
    preflight_ref: preflightRef.ref,
    p1: {
      identity_ref: identity.p1.identity_ref,
      identity_sha256: identity.p1.identity_sha256,
      aggregate: identity.p1.aggregate,
      engine: identity.p1.engine,
      engine_session: identity.p1.engine_session,
      design_ref: identity.p1.design_ref,
      design_sha256: identity.p1.design_sha256,
      interaction_ref: identity.p1.interaction_ref,
      relation: identity.p1.relation,
    },
    notes: [
      "before values: workbench is the explicit Phase 1 computed gap; the board value is 未测 because Phase 1 did not compute it and the token is not a computed value.",
      "after values are this run's live computed gap on both pages; the board read follows select[data-demo-state]=empty.",
      "the engine is the explicit Phase 1 selection; no switch was attempted.",
    ],
  };
  const computedRef = await publish(handle, evidence.computed, computed);

  // C10 readback: a recursive scan accepts only an original that proves C10
  // actually read this object at the C12 after-change version. A mere mention of
  // name+version, a plan, or an 未测 record does not count.
  const c10 = findC10Readback(identity.after.aggregate);
  const readback = c10.status === "可用"
    ? {
      schema: "c12-update-readback/1",
      run_id: runId,
      checked_at: now(),
      task: "C10",
      status: "可用",
      owner: "C10",
      source_task: "C10",
      executor: c10.verdict?.executor ?? "C10",
      recovery_condition: "C10 运行时读回新版",
      evidence_ref: c10.ref,
      object: {name: OBJECT_NAME, version: identity.after.aggregate},
      read_action: c10.verdict?.action ?? null,
      read_at: c10.verdict?.read_at ?? null,
      attempts: c10.attempts,
      scanned: c10.scanned,
      note: "A C10 original under the C10 evidence root records an actual read of this version.",
    }
    : {
      schema: "c12-update-readback/1",
      run_id: runId,
      checked_at: now(),
      task: "C10",
      status: "未测",
      owner: "C10",
      recovery_condition: "C10 运行时读回新版",
      evidence_ref: null,
      object_expected: {name: OBJECT_NAME, version: identity.after.aggregate},
      reason: c10.reason,
      c10_evidence_root: c10.evidence_root,
      attempts: c10.attempts,
      scanned: c10.scanned,
      note: "C10 has not read this updated object in its own task; the same-task C12 replay is not a C10 readback.",
    };
  const readbackRef = await publish(handle, evidence.readback, readback);

  const untested = {
    board_before_computed: {status: boardPage?.before_status === "已取得" ? "已取得" : "未测", owner: "Phase 1 执行者", recovery: "受控修改前用同一 board 显示操作读取 .inlineactions 计算 gap"},
    physical_screen_reader: {status: "未测", owner: "用户", recovery: "真人读屏环境读两页并留记录"},
    zoom_200: {status: "未测", owner: "P1 执行者/前端质量 owner", recovery: "合法会话以 200% 缩放复采两页"},
    contrast: {status: "未测", owner: "P1 设计质量 owner", recovery: "按当前设计源与页面计算色重采对比度"},
    performance: {status: "未测", owner: "P1 性能采集 owner", recovery: "按既有性能采集器复采；C12 无阈值"},
    c11_old_bytes: {status: "未测", owner: "C11 owner", recovery: "核 C11 十件旧字节与当前十九件关系"},
    agent_browser_end_to_end: {status: preflight.end_to_end, owner: preflight.owner, recovery: preflight.recovery, reason: preflight.end_to_end_reason},
    viewport_390: board390?.status === "已取得" && workbench390?.status === "已取得"
      ? {status: "已取得", note: "both pages measured at 390x844"}
      : {status: "未测", owner: "采集环境 owner", recovery: "网关会话可用时重跑 collect 复采 390x844"},
  };
  const cleanupArgv = ["node", "tests/acceptance/c12-update-chain.mjs", "cleanup", `--run-id=${runId}`, `--copy-root=${runState.copy_root}`, `--task-record-root=${taskRoot}`];
  const result = {
    schema: "c12-update-result/1",
    object: "two-pages",
    run_id: runId,
    ok: sync !== "未测",
    produced_at: now(),
    object_name: OBJECT_NAME,
    identity: {
      ref: runState.identity_ref,
      before_aggregate: identity.before.aggregate,
      after_aggregate: identity.after.aggregate,
      files_before: identity.before.files.length,
      files_after: identity.after.files.length,
      differences: identity.differences.length,
      controlled_change: identity.controlled_change,
    },
    build: {ref: runState.build_ref, output_ref: runState.build_output_ref, exit_code: buildReceipt.error ? null : buildReceipt.value?.exit_code ?? null, status: buildState},
    service: {ref: serviceRef.ref, port: runState.port, base_url: serviceUrl, status: serviceState, ready, engine, engine_session: session, stopped: false, stopped_by: "cleanup"},
    computed: {ref: computedRef.ref, sha256: computedRef.sha256, sync, pages: pages.length},
    readback: {ref: readbackRef.ref, sha256: readbackRef.sha256, status: readback.status},
    responsive: {
      ref: responsiveRef.ref,
      sha256: responsiveRef.sha256,
      viewports: responsive.viewports,
      overflow_after: responsive.overflow_after,
      overflow_delta_vs_p1: responsive.overflow_delta_vs_p1,
      main_action_390: responsive.main_action_390.conclusion,
      conclusion: responsive.conclusion,
    },
    sync,
    sync_components: computed.sync_components,
    sync_reason: computed.sync_reason,
    sync_values: {board: boardPage?.after ?? null, workbench: workbenchPage?.after ?? null},
    ac_c12_004: readback.status === "未测" ? "未测" : sync === "可用" ? "可用" : sync,
    ac_c12_004_reason: readback.status === "未测"
      ? "C10 未在自身任务中读回改后对象；同步子项按事实给出，但整条 AC-C12-004 保持未测，恢复条件为 C10 运行时读回新版。"
      : "C10 original present; the AC follows the computed sync verdict.",
    untested,
    coverage_ceiling: "only this controlled copy sync and the C10 readback gap; not the source tree, C10 flow, other tokens, long-term visual regression or physical screen-reader use.",
    commands: {
      prepare: runState.commands?.prepare ?? {argv: runState.prepare_argv ?? null, cwd: WORKTREE, exit_code: 0},
      browser_env: {entry: `eval "$(node tests/acceptance/c12-update-chain.mjs browser-env --run-id=${runId} --task-record-root=${taskRoot})"`, exit_observable: false, note: "the outer gate evals it before the gateway --run; a non-zero exit fails closed"},
      collect: {argv: process.argv.slice(), cwd: WORKTREE, exit_code: 0},
      cleanup: {argv: cleanupArgv, cwd: WORKTREE, exit_code: "pending-cleanup-original"},
    },
    gate_semantics: "gate exit 0 only judges the originals' shape/consistency; sync=部分可用 with an 未测 board half is not a pass, and AC-C12-004 remains 未测 until C10 reads back.",
    consumer: "Phase 4 report author and independent acceptance reader",
  };
  const resultRef = await publish(handle, evidence.result, result);
  const checks = await publish(handle, evidence.checks, {
    schema: "c12-update-checks/1",
    run_id: runId,
    checked_at: now(),
    evidence_base: evidence.base,
    service_owner: serviceOwner,
    gateway,
    identity: {before: identity.before.aggregate, after: identity.after.aggregate, live: liveAggregate, status: liveAggregate === identity.after.aggregate ? "match" : "mismatch"},
    token: {expected_after: GAP_AFTER, observed_16px: tokenAfterCount, observed_12px: tokenBeforeCount, status: "match"},
    build: {ref: runState.build_ref, status: buildState, exit_code: buildReceipt.error ? null : buildReceipt.value?.exit_code ?? null},
    service: {ref: serviceRef.ref, status: serviceState, ready, engine, engine_session: session},
    pages: pages.map((page) => ({route: page.route, before: page.before, before_status: page.before_status, after: page.after, action: page.action, source: page.before_source.kind})),
    responsive: {
      ref: responsiveRef.ref,
      sha256: responsiveRef.sha256,
      viewports: responsive.viewports,
      overflow_after: responsive.overflow_after,
      overflow_delta_vs_p1: responsive.overflow_delta_vs_p1,
      main_action_390: responsive.main_action_390.conclusion,
      conclusion: responsive.conclusion,
    },
    sync,
    sync_components: computed.sync_components,
    readback_status: readback.status,
    preflight: {ref: preflightRef.ref, status: preflight.status, end_to_end: preflight.end_to_end, reason: preflight.end_to_end_reason, owner: preflight.owner, recovery: preflight.recovery},
    responsive: {
      ref: responsiveRef.ref,
      sha256: responsiveRef.sha256,
      viewports: responsive.viewports,
      overflow_after: responsive.overflow_after,
      overflow_delta_vs_p1: responsive.overflow_delta_vs_p1,
      main_action_390: responsive.main_action_390.conclusion,
      conclusion: responsive.conclusion,
    },
    untested,
    commands: result.commands,
    result_ref: resultRef.ref,
  });
  safeUpdateRunState(statePath, {
    status: "collected",
    collect_ok: true,
    collect_error: null,
    engine_session: session,
    session,
    service_ref: serviceRef.ref,
    service_sha256: serviceRef.sha256,
    computed_ref: computedRef.ref,
    computed_sha256: computedRef.sha256,
    readback_ref: readbackRef.ref,
    readback_sha256: readbackRef.sha256,
    result_ref: resultRef.ref,
    result_sha256: resultRef.sha256,
    checks_ref: checks.ref,
    preflight_ref: preflightRef.ref,
    collect_completed_at: now(),
    sync,
    ac_c12_004: result.ac_c12_004,
    commands: {...(runState.commands ?? {}), collect: {argv: process.argv.slice(), cwd: WORKTREE, exit_code: 0}},
  });
  process.stdout.write(`${JSON.stringify({
    ok: true, step: "collect", run_id: runId, evidence_base: evidence.base,
    service_ref: serviceRef.ref, preflight_ref: preflightRef.ref,
    computed_ref: computedRef.ref, readback_ref: readbackRef.ref, result_ref: resultRef.ref,
    checks_ref: checks.ref, sync, ac_c12_004: result.ac_c12_004,
    pages: pages.map((page) => ({route: page.route, before: page.before, before_status: page.before_status, after: page.after, action: page.action})),
    engine, engine_session: session,
  })}\n`);
  return 0;
}

// ---------------------------------------------------------------------------
// cleanup
// ---------------------------------------------------------------------------

function readCopyReadback(copyRoot, identity) {
  const rows = identityRows(copyRoot);
  const globalsText = readFileSync(join(copyRoot, TOKEN_PATH), "utf8");
  const expected = new Map((identity.after?.files ?? []).map((row) => [row.path, row.sha256]));
  const mismatched = rows.filter((row) => expected.get(row.path) !== row.sha256);
  const aggregate = aggregateRows(rows);
  return {
    rows,
    aggregate,
    token_before: globalsText.split(TOKEN_LINE_BEFORE).length - 1,
    token_after: globalsText.split(TOKEN_LINE_AFTER).length - 1,
    token_line: lineOfText(globalsText, TOKEN_LINE_AFTER),
    matches_after: aggregate === identity.after?.aggregate && mismatched.length === 0 && rows.length === (identity.after?.files ?? []).length,
    mismatched: mismatched.map((row) => ({path: row.path, observed: row.sha256, expected: expected.get(row.path) ?? null})),
    read_at: now(),
  };
}
async function verifyServiceClosed(runState) {
  const stop = await stopServer(runState);
  const query = portQuery(runState.port);
  const owners = query.ok ? query.owners : null;
  const closed = Boolean(query.ok && owners.length === 0 && !stop.post_stop_http?.ok);
  return {stop, query, owners, closed};
}
async function cleanup(argv) {
  const options = parseFlags(argv, ["run-id", "copy-root", "task-record-root"]);
  const runId = options["run-id"];
  const copyRoot = resolve(options["copy-root"]);
  const taskRoot = resolve(options["task-record-root"]);
  const handle = openHandle(taskRoot);
  const statePath = join(dirname(copyRoot), `${runId}-run-state.json`);
  const cleanupArgv = process.argv.slice();
  const stateRead = readJson(statePath);

  if (stateRead.error) {
    // No state remains. Claiming "clean" requires both a confirmed absent copy
    // and a port query that actually answered with no listener.
    const query = portQuery(PORT_DEFAULT);
    if (!query.ok) throw fail("E_PORT_QUERY", `no run state and the ${PORT_DEFAULT} listener query failed: ${query.error}; nothing is assumed clean`, {exitCode: 7, port_query: query});
    if (query.owners.length) throw fail("E_PORT_IN_USE", `no run state but port ${PORT_DEFAULT} has listeners: ${query.owners.join(",")}; nothing was deleted`, {exitCode: 7, owners: query.owners});
    if (existsSync(copyRoot)) throw fail("E_RUN_STATE", `no run state but the licensed copy exists at ${copyRoot}; refusing to delete an unattributed copy`, {exitCode: 2});
    await recordNote(handle, `${runId}-cleanup-already-clean`, {
      schema: "c12-update-cleanup/1", run_id: runId, cleaned_at: now(), state: "absent",
      copy_root: copyRoot, copy_present: false, port: PORT_DEFAULT, port_owners: [], already_clean: true,
      command: {argv: cleanupArgv, cwd: WORKTREE, exit_code: 0},
      reason: "no run state remained; the licensed copy is absent and the port query answered with no listener",
    });
    return 0;
  }
  const runState = stateRead.value;
  if (resolve(runState.copy_root) !== copyRoot) throw fail("E_COPY_IDENTITY", `cleanup copy root ${copyRoot} differs from prepared ${runState.copy_root}; nothing deleted`, {exitCode: 3});
  if (runState.task_root !== taskRoot) throw fail("E_RUN_STATE", `run state task root ${runState.task_root} differs from ${taskRoot}`, {exitCode: 2});
  if (copyRoot !== COPY_ROOT_DEFAULT) throw fail("E_COPY_SCOPE", `cleanup refuses to delete ${copyRoot}; only ${COPY_ROOT_DEFAULT} is licensed`, {exitCode: 3});

  // Stop the owned service first, regardless of the copy's state. A drift or a
  // failed collect must never leave this run's listener behind.
  const service = await verifyServiceClosed(runState);
  if (!service.closed) {
    const note = await recordNote(handle, `${runId}-cleanup-service-unverified`, {
      schema: "c12-update-unavailable/1", run_id: runId, recorded_at: now(), step: "cleanup",
      code: "E_CLEANUP_SERVICE", stop: service.stop, port_query: service.query, owners: service.owners,
      reason: "the owned service could not be proven stopped; the copy and state were kept",
      attempt_ref: runState.identity_ref ?? null,
      command: {argv: cleanupArgv, cwd: WORKTREE, exit_code: 7},
    });
    throw fail("E_CLEANUP_SERVICE", service.query.ok ? `port ${runState.port} still has listeners` : `cannot determine listeners on ${runState.port}: ${service.query.error}`, {exitCode: 7, stop: service.stop, port_query: service.query, owners: service.owners, unavailable_ref: note});
  }

  const copyPresent = existsSync(copyRoot);
  const identityRead = runState.identity_ref ? readJson(absoluteTaskFile(taskRoot, runState.identity_ref)) : {error: "run state carries no identity_ref"};
  const identity = identityRead.error ? null : identityRead.value;
  if (runState.collect_ok === true && !identity) {
    throw fail("E_EVIDENCE_READ", `collect succeeded but the update identity original is unreadable: ${identityRead.error}; the copy and state were kept`, {exitCode: 3, identity_ref: runState.identity_ref});
  }

  // Cleanup deletes only after a successful collect. A failed collect keeps the
  // copy for triage, even though the frozen gate always calls cleanup once.
  if (runState.collect_ok !== true) {
    const note = await recordNote(handle, `${runId}-cleanup-retained`, {
      schema: "c12-update-cleanup/1", run_id: runId, cleaned_at: now(), mode: "retained-after-failed-collect",
      service, copy_root: copyRoot, copy_present: copyPresent, copy_retained: copyPresent,
      deleted: !copyPresent, already_absent: !copyPresent,
      collect_ok: false, collect_error: runState.collect_error ?? null,
      command: {argv: cleanupArgv, cwd: WORKTREE, exit_code: 0},
      reason: "collect did not succeed; the copy is kept for triage and the state remains for the owner",
    });
    process.stdout.write(`${JSON.stringify({ok: true, step: "cleanup", run_id: runId, cleanup_ref: note, copy_retained: copyPresent, service_stopped: service.closed, reason: "collect-not-successful"})}\n`);
    return 0;
  }
  if (existsSync(join(taskRoot, evidenceFamily(Number(runState.evidence_base)).cleanup))) throw fail("E_EVIDENCE_EXISTS", `cleanup original already exists: ${evidenceFamily(Number(runState.evidence_base)).cleanup}`, {exitCode: 3});

  if (!copyPresent) {
    const cleanupRef = await publish(handle, evidenceFamily(Number(runState.evidence_base)).cleanup, {
      schema: "c12-update-cleanup/1", run_id: runId, cleaned_at: now(),
      service, service_closed: true, port_owners_after: service.owners,
      copy: {root: copyRoot, present_before: false, deleted: true, already_absent: true, readback_ref: null},
      engine: runState.engine, engine_session: runState.engine_session ?? runState.session ?? null,
      session_cleanup: {engine: runState.engine, session: runState.engine_session ?? runState.session ?? null, note: "the gateway owns the session lifecycle; this cleanup does not start or keep another session"},
      command: {argv: cleanupArgv, cwd: WORKTREE, exit_code: 0},
      notes: ["The copy was already absent; deleted=true records that nothing remains, not a new deletion."],
    });
    try { rmSync(statePath, {force: true}); } catch { /* state is not evidence */ }
    process.stdout.write(`${JSON.stringify({ok: true, step: "cleanup", run_id: runId, cleanup_ref: cleanupRef.ref, copy_deleted: true, already_absent: true, service_stopped: true})}\n`);
    return 0;
  }

  const readback = readCopyReadback(copyRoot, identity);
  if (!readback.matches_after || readback.token_after !== 1 || readback.token_before !== 0) {
    const note = await recordNote(handle, `${runId}-cleanup-drift`, {
      schema: "c12-update-unavailable/1", run_id: runId, recorded_at: now(), step: "cleanup",
      code: "E_CLEANUP_READBACK", copy_root: copyRoot, readback,
      reason: "pre-deletion readback differs from the recorded after identity or token; the service was stopped and the copy was kept",
      attempt_ref: runState.identity_ref, command: {argv: cleanupArgv, cwd: WORKTREE, exit_code: 8},
    });
    throw fail("E_CLEANUP_READBACK", "pre-deletion copy readback does not match the recorded after identity; the copy was kept", {exitCode: 8, unavailable_ref: note, readback});
  }
  const evidence = evidenceFamily(Number(runState.evidence_base));
  if (existsSync(join(taskRoot, evidence.cleanup_readback))) throw fail("E_EVIDENCE_EXISTS", `cleanup readback original already exists: ${evidence.cleanup_readback}`, {exitCode: 3});
  // Leave the pre-deletion readback original before removing the copy.
  const readbackRef = await publish(handle, evidence.cleanup_readback, {
    schema: "c12-update-cleanup-readback/1",
    run_id: runId,
    read_at: now(),
    copy_root: copyRoot,
    copy_present: true,
    expected_after: identity.after?.aggregate ?? null,
    observed_aggregate: readback.aggregate,
    matches_after: readback.matches_after,
    mismatched: readback.mismatched,
    files: readback.rows,
    token_before_12px: readback.token_before,
    token_after_16px: readback.token_after,
    token_line: readback.token_line,
    identity_ref: runState.identity_ref,
    identity_sha256: runState.identity_sha256,
  });
  let deleted = false;
  let deleteError = null;
  try { rmSync(copyRoot, {recursive: true, force: true}); deleted = !existsSync(copyRoot); }
  catch (error) { deleteError = `${error.code ?? error.name}: ${error.message}`; }
  const cleanupDoc = {
    schema: "c12-update-cleanup/1",
    run_id: runId,
    cleaned_at: now(),
    service,
    service_closed: true,
    port_owners_after: service.owners,
    copy: {
      root: copyRoot,
      present_before: true,
      deleted,
      delete_error: deleteError,
      readback_ref: readbackRef.ref,
      readback_sha256: readbackRef.sha256,
      files: readback.rows.length,
      aggregate: readback.aggregate,
    },
    engine: runState.engine,
    engine_session: runState.engine_session ?? runState.session ?? null,
    session_cleanup: {
      engine: runState.engine,
      session: runState.engine_session ?? runState.session ?? null,
      note: runState.engine === "ego-lite"
        ? "the gateway owns the single TaskSpace for this --run and finishes it with finish({keep:[]}); this cleanup does not start or keep another session."
        : "the gateway owns its isolated Chrome and temporary profile; this cleanup does not mix an ego session.",
    },
    command: {argv: cleanupArgv, cwd: WORKTREE, exit_code: deleted ? 0 : 8},
    notes: [
      "The pre-deletion readback original was written before the copy was removed.",
      "Only this run's recorded process and licensed copy were reclaimed; no other process or evidence was touched.",
    ],
  };
  const cleanupRef = await publish(handle, evidence.cleanup, cleanupDoc);
  let stateRemoved = false;
  try { rmSync(statePath, {force: true}); stateRemoved = !existsSync(statePath); } catch { /* the state is not evidence */ }
  if (!deleted) throw fail("E_CLEANUP_DELETE", `copy was not deleted: ${deleteError ?? "still present"}`, {exitCode: 8, cleanup_ref: cleanupRef.ref, readback_ref: readbackRef.ref});
  process.stdout.write(`${JSON.stringify({
    ok: true, step: "cleanup", run_id: runId, cleanup_ref: cleanupRef.ref,
    readback_ref: readbackRef.ref, service_stopped: true, port_closed: true,
    copy_deleted: deleted, copy_root: copyRoot, state_removed: stateRemoved,
  })}\n`);
  return 0;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (command === "prepare") return prepare(rest);
  if (command === "browser-env") return browserEnv(rest);
  if (command === "collect") return collect(rest);
  if (command === "cleanup") return cleanup(rest);
  throw usage("usage: c12-update-chain.mjs prepare|browser-env|collect|cleanup --run-id=... ...");
}

const direct = process.argv[1] ? (() => {
  try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
})() : false;

if (direct) {
  main().then((code) => { process.exitCode = code; }).catch((error) => {
    process.stderr.write(`${JSON.stringify({
      ok: false, code: error.code ?? "E_UNEXPECTED", message: error.message,
      ...(error.exitCode ? {exit_code: error.exitCode} : {}),
      ...(error.identity_ref ? {identity_ref: error.identity_ref} : {}),
      ...(error.build_ref ? {build_ref: error.build_ref} : {}),
      ...(error.unavailable_ref ? {unavailable_ref: error.unavailable_ref} : {}),
      ...(error.readback_ref ? {readback_ref: error.readback_ref} : {}),
      ...(error.service_stop ? {service_stop: error.service_stop} : {}),
    })}\n`);
    process.exitCode = error.exitCode ?? 1;
  });
}
