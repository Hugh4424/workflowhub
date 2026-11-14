#!/usr/bin/env node
// Task 2 / Phase P2 object driver for the frozen v15 route.
//
// prepare: recompute the locked seven-file v15 identity (five v15 files plus the
// two CSS files the page really loads), recompute the sixty-six-file design
// source identity, start this phase's own read-only static service on 41922 and
// leave a run state. It refuses to start when identity drifted or the port is
// already in use.
//
// collect: consume only the engine/session the isolated-browser-qa gateway
// selected, prove the 41922 listener is this run's own process, open the bare
// route once per viewport, enter the ten stable states through the page's own
// controls, read `#demo-result[data-state]` / `#demo-confirm-panel[aria-busy]`
// and reuse the five single-dimension collectors for every cell. It never calls
// runPageAudit()/runCli(), never forces agent-browser, never sets a state through
// the URL, and never treats the 150ms `pending` transition as a stable cell.
//
// The frozen oracle tests/acceptance/c12-v15.test.mjs owns the criteria. This
// file only produces object facts. It writes no page, spec, v15, design source
// or skill byte, and it does not Git commit.

import {spawn, spawnSync} from "node:child_process";
import {createHash, randomUUID} from "node:crypto";
import {
  closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, readdirSync,
  realpathSync, renameSync, statSync, writeFileSync, writeSync,
} from "node:fs";
import {dirname, isAbsolute, join, relative, resolve, sep} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {openTask} from "../../runtime/task/task-handle.mjs";
// The URL-only helper is imported so its value is recorded as "unknown" beside
// the real page-marker observation. It must never fill `state_observation.result`.
import {stateObservation} from "../../skills/frontend-testing/scripts/run-page-audit.mjs";

const WORKTREE = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const MODULE_URL = pathToFileURL(fileURLToPath(import.meta.url)).href;
const SERVICE_ROOT = "docs/examples/c11-ui";
const ROUTE = "v15/2026-11-11-002-t019-v15-pending-busy-index.html";
const TARGET_PATH = `/${ROUTE}`;
const PORT = 41922;
const EVIDENCE_DATE = "2026-11-14";
const FILES = [
  "v15/2026-11-11-001-t019-v15-pending-busy-app.js",
  "v15/2026-11-11-002-t019-v15-pending-busy-index.html",
  "v15/2026-11-11-003-t019-v15-pending-busy-readme.md",
  "v15/2026-11-12-001-c11-query-writer.mjs",
  "v15/2026-11-12-002-c11-query-data.js",
  "v11/2026-11-10-001-t019-wf-native-next-v11-styles.css",
  "v12/2026-11-11-009-t019-v12-local-demo-styles.css",
];
const LOCKED_AGGREGATE = "6dc77bf7469aeee3eb14837af318a8622f77a70fe4a1156b2e2ff7f272514f17";
const DESIGN_ROOT = "/Users/Hugh/Downloads/UI";
const DESIGN_AGGREGATE = "843d0e885e49789fa7af7b558004c707f89131445325c54631a128ea45404571";
const DESIGN_FIXED = ["index.html", "package.json", "pnpm-lock.yaml", "tsconfig.json", "vite.config.ts", ".figma/make/site.json"];
// The frozen card's ten stable states. `pending` is deliberately absent: it is a
// 150ms transition and may never enter the stable matrix.
const STATES = ["unselected", "ready", "success", "duplicate", "empty", "error", "permission", "partial", "unknown", "recovered"];
const C11_STATES = ["unselected", "ready", "pending", "success", "duplicate", "empty", "error", "permission", "partial", "unknown", "recovered"];
const VIEWPORTS = ["390x844", "1280x800", "1440x900"];
const DIMENSIONS = ["console", "network", "overflow", "a11y", "perf"];
const IDENTITY_KEYS = ["workspace", "service", "route", "state", "viewport", "engine", "engine_session", "object_version"];
// The frozen test pins this legacy string. The same originals also carry the
// real observed pending marker and a non-contradictory observation reason; the
// locked constant is kept only so the frozen judge can compare it.
const PENDING_REASON = "未测（瞬时不可采集：150ms 定时器使页面在采集前离开）";
const PENDING_OBSERVED_REASON = "本轮真实观察到 pending（data-state=pending、aria-busy=true）并在约 150ms 定时器后离开；瞬时态无法稳定取得五维，故仍记未测。";
const PENDING_NOT_OBSERVED_REASON = "本轮未观察到 pending（点击后首个稳定标记不是 pending）；按 150ms 瞬时态记未测。";
const LAYOUT = {
  service: {offset: 0, name: "service", ext: "json"},
  result: {offset: 1, name: "result", ext: "json"},
  identity: {offset: 2, name: "identity", ext: "json"},
  boundary: {offset: 3, name: "boundary-before", ext: "json"},
  capability: {offset: 4, name: "capability", ext: "json"},
  design: {offset: 5, name: "design-compare", ext: "md"},
  interaction: {offset: 6, name: "interaction", ext: "json"},
  coverage: {offset: 7, name: "coverage", ext: "json"},
  checks: {offset: 8, name: "checks", ext: "json"},
  mapping: {offset: 9, name: "plan-offset-map", ext: "json"},
};
const RAW_FIRST = 10;
const RAW_PER_CELL = DIMENSIONS.length;
const RAW_TOTAL = STATES.length * VIEWPORTS.length * RAW_PER_CELL;
const SHOT_FIRST = 160;
const FIRST_RUN = 100;
const SERIES_ALIGNMENT = 100;
const SERIES_CEILING = 9_000_000;

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const text = (value) => typeof value === "string" && value.trim().length > 0;
const readJson = (path) => {
  try { return {value: JSON.parse(readFileSync(path, "utf8"))}; }
  catch (error) { return {error: `${error.code ?? error.name}: ${error.message}`}; }
};
const cellKey = (state, viewport) => `${state}\0${viewport}`;
const stateIndex = (state) => STATES.indexOf(state);
const viewportIndex = (viewport) => VIEWPORTS.indexOf(viewport);
const cellIndex = (state, viewport) => stateIndex(state) * VIEWPORTS.length + viewportIndex(viewport);
const rawOffset = (state, viewport, dimension) => RAW_FIRST + cellIndex(state, viewport) * RAW_PER_CELL + DIMENSIONS.indexOf(dimension);

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

// ---------------------------------------------------------------------------
// evidence series
// ---------------------------------------------------------------------------

function evidenceName(base, key) {
  const {offset, name, ext} = LAYOUT[key];
  return `quality/evidence/${EVIDENCE_DATE}-${base + offset}-v15-${name}.${ext}`;
}
function rawName(base, state, viewport, dimension) {
  return `quality/evidence/${EVIDENCE_DATE}-${base + rawOffset(state, viewport, dimension)}-v15-${state}-${viewport}-${dimension}.json`;
}
function shotName(base, viewport) {
  return `quality/evidence/${EVIDENCE_DATE}-${base + SHOT_FIRST + viewportIndex(viewport)}-v15-shot-${viewport}.png`;
}
function familyPaths(base) {
  const paths = Object.keys(LAYOUT).map((key) => evidenceName(base, key));
  for (const state of STATES) for (const viewport of VIEWPORTS) for (const dimension of DIMENSIONS) paths.push(rawName(base, state, viewport, dimension));
  for (const viewport of VIEWPORTS) paths.push(shotName(base, viewport));
  return paths;
}
function seriesOf(name) {
  const match = /^(\d{4}-\d{2}-\d{2})-(\d{3,})-/.exec(name);
  return match ? Number(match[2]) : null;
}
function highestSeries(taskRoot) {
  let highest = null;
  try {
    for (const name of readdirSync(join(taskRoot, "quality/evidence"))) {
      const sequence = seriesOf(name);
      if (sequence === null || !Number.isSafeInteger(sequence)) continue;
      if (highest === null || sequence > highest) highest = sequence;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return highest;
}
function allocateBase(taskRoot, requested) {
  const occupied = (base) => familyPaths(base).filter((ref) => existsSync(join(taskRoot, ref)));
  if (requested !== null) {
    const taken = occupied(requested);
    if (taken.length) throw fail("E_EVIDENCE_EXISTS", `evidence series ${requested} already holds originals; a new run needs a free base`, {exitCode: 3, taken: taken.slice(0, 5)});
    return {base: requested, resumed: false};
  }
  const highest = highestSeries(taskRoot);
  let base = highest === null ? FIRST_RUN : Math.ceil((highest + 1) / SERIES_ALIGNMENT) * SERIES_ALIGNMENT;
  for (let guard = 0; guard < 10_000; guard += 1) {
    if (base > SERIES_CEILING) break;
    if (!occupied(base).length) return {base, resumed: false};
    base += SERIES_ALIGNMENT;
  }
  throw fail("E_EVIDENCE_SERIES_RANGE", `no free evidence series at or above ${base}`, {exitCode: 3});
}
function parseEvidenceBase(value) {
  if (value === undefined) return null;
  if (!/^[1-9][0-9]{1,3}$/.test(value)) throw usage("--evidence-series must be a positive numeric base");
  return Number(value);
}

// ---------------------------------------------------------------------------
// identity
// ---------------------------------------------------------------------------

function identityRow(root, path) {
  const file = join(root, path);
  const stat = statSync(file);
  return {path, sha256: sha256(readFileSync(file)), bytes: stat.size};
}
function aggregateRows(rows, mode = "path") {
  const sorted = [...rows].sort(mode === "locale"
    ? (left, right) => left.path.localeCompare(right.path)
    : (left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  return sha256(Buffer.from(sorted.map((row) => `${row.path}\0${row.sha256}\n`).join("")));
}
function v15IdentityRows() {
  const root = join(WORKTREE, SERVICE_ROOT);
  return FILES.map((path) => identityRow(root, path));
}
function v15IdentityDoc(runId, rows, aggregate, extra) {
  return {
    schema: "c12-v15-identity/1",
    object: "v15",
    run_id: runId,
    service_root: SERVICE_ROOT,
    route: ROUTE,
    entry_url: `http://127.0.0.1:${PORT}${TARGET_PATH}`,
    files: rows,
    aggregate,
    expected_aggregate: LOCKED_AGGREGATE,
    matches: aggregate === LOCKED_AGGREGATE,
    algorithm: "sha256 per file; paths relative to docs/examples/c11-ui; sorted by path code point; path\\0sha256\\n concatenated; sha256",
    read_at: new Date().toISOString(),
    scope_note: "This seven-file identity is the v15 object only. It is not the nineteen-file two-pages identity and not the sixty-six-file design source identity.",
    ...extra,
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
    const aggregate = aggregateRows(rows);
    return {
      root: DESIGN_ROOT,
      files: rows,
      file_count: rows.length,
      aggregate,
      expected_aggregate: DESIGN_AGGREGATE,
      matches: aggregate === DESIGN_AGGREGATE && rows.length === 66,
      algorithm: "sha256 per file; 6 fixed files plus src/**/*.{ts,tsx,css}; node_modules/dist/.vite excluded; sorted by path code point; path\\0sha256\\n concatenated; sha256",
      read_at: new Date().toISOString(),
    };
  } catch (error) {
    return {root: DESIGN_ROOT, unavailable: true, error: `${error.code ?? error.name}: ${error.message}`};
  }
}
function twoPagesIdentityReference(taskRoot) {
  let names = [];
  try {
    names = readdirSync(join(taskRoot, "quality/evidence"))
      .filter((name) => name.endsWith("-two-pages-identity.json"))
      .map((name) => ({name, path: join(taskRoot, "quality/evidence", name), mtime: statSync(join(taskRoot, "quality/evidence", name)).mtimeMs}))
      .sort((left, right) => right.mtime - left.mtime);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (!names.length) return {status: "not_available", reason: "quality/evidence holds no *-two-pages-identity.json original yet"};
  const doc = readJson(names[0].path);
  if (doc.error) return {status: "unreadable", ref: names[0].path, error: doc.error};
  const files = Array.isArray(doc.value?.files) ? doc.value.files : [];
  return {
    status: "referenced_not_recomputed",
    ref: relative(taskRoot, names[0].path).split(sep).join("/"),
    run_id: doc.value?.run_id ?? null,
    files: files.length,
    aggregate: doc.value?.aggregate ?? null,
    note: "P1's nineteen-file identity is referenced so the three objects stay distinct; this Phase does not recompute it.",
  };
}
// Evidence-backed negative search for a same-page v15 design: the locked
// sixty-six design files are searched for the page's own terms. The separate
// prompt document is outside the identity set and is recorded as an adjacent
// note, not as a same-page design.
function designNegativeSearch(design) {
  const terms = ["策略快照", "经验候选", "三分区确认"];
  const hits = [];
  const files = Array.isArray(design.files) ? design.files : [];
  for (const file of files) {
    let content;
    try { content = readFileSync(join(DESIGN_ROOT, file.path), "utf8"); } catch { continue; }
    for (const term of terms) {
      const index = content.indexOf(term);
      if (index < 0) continue;
      const before = content.slice(0, index);
      hits.push({path: file.path, term, line: before.split("\n").length, excerpt: content.slice(index, index + 120)});
    }
  }
  return {
    executed_at: new Date().toISOString(),
    scope_files: files.length,
    terms,
    hits,
    zero_hit: hits.length === 0,
    adjacent_note: {
      path: "src/imports/PaperBuilder-T08-UI-Design-Prompt.md:294",
      in_identity_set: false,
      text: "策略快照",
      interpretation: "只出现在运行详情抽屉字段的提示词里，不是同页设计稿；该文件不属于 D-002 的 66 件身份集。",
    },
    conclusion: hits.length === 0
      ? "在 66 件当前设计源身份文件内 0 命中三分区页面/经验候选/策略快照页；v15 无同页设计稿。"
      : `在 66 件当前设计源身份文件内命中 ${hits.length} 处，须逐条判是否为同页设计；不得直接写不适用。`,
  };
}

// ---------------------------------------------------------------------------
// process / service helpers
// ---------------------------------------------------------------------------

function runTimeout(command, args, options) {
  return spawnSync(command, args, {encoding: "utf8", timeout: 30_000, ...options});
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
function serviceIdentity(pid, port, expectedStart = null) {
  if (!Number.isInteger(pid) || pid <= 0) return {owned: false, reason: "run state has no pid"};
  const start = processStart(pid);
  const row = processRow(pid);
  const owners = portOwners(port);
  if (!start) return {owned: false, reason: "process not present", ps_exit: 1};
  const startMatch = !expectedStart || expectedStart === start;
  const portMatch = owners.includes(pid);
  return {owned: startMatch && portMatch, row: row?.slice(0, 400) ?? null, start, expected_start: expectedStart, port_owner: portMatch, owners};
}
async function httpStatus(url, timeoutMs = 3000) {
  try {
    const response = await fetch(url, {redirect: "error", signal: AbortSignal.timeout(timeoutMs)});
    return {ok: true, status: response.status};
  } catch (error) {
    return {ok: false, error: error.cause?.code ?? error.code ?? error.name, message: error.message};
  }
}
// The static service is this phase's own process. It only serves files below
// docs/examples/c11-ui and never writes the served tree.
const SERVER_SCRIPT = `
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = process.env.C12_V15_ROOT;
const port = Number(process.env.C12_V15_PORT);
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2'
};
const server = http.createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405); response.end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname); }
  catch { response.writeHead(400); response.end(); return; }
  const absolute = path.resolve(root, '.' + pathname);
  if (absolute !== root && !absolute.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
  fs.stat(absolute, (error, stat) => {
    if (error || !stat.isFile()) { response.writeHead(404, {'content-type': 'text/plain; charset=utf-8'}); response.end('not found'); return; }
    response.writeHead(200, {
      'content-type': types[path.extname(absolute).toLowerCase()] || 'application/octet-stream',
      'content-length': stat.size, 'cache-control': 'no-store',
    });
    if (request.method === 'HEAD') { response.end(); return; }
    fs.createReadStream(absolute).pipe(response);
  });
});
server.listen(port, '127.0.0.1');
const stop = () => server.close(() => process.exit(0));
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
`;
function startServer({serviceRoot, port, logPath}) {
  const fd = openSync(logPath, "a");
  const child = spawn(process.execPath, ["-e", SERVER_SCRIPT], {
    cwd: WORKTREE,
    detached: true,
    stdio: ["ignore", fd, fd],
    env: {...process.env, C12_V15_ROOT: serviceRoot, C12_V15_PORT: String(port)},
  });
  try { child.unref(); } finally { try { closeSync(fd); } catch {} }
  return child.pid;
}
async function waitService(baseUrl, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await httpStatus(`${baseUrl}${TARGET_PATH}`);
    if (last.ok && last.status === 200) return {ok: true, status: last.status};
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 200));
  }
  return {ok: false, last};
}
async function stopServer(runState) {
  const identity = serviceIdentity(runState.pid, runState.port, runState.process_identity?.start ?? null);
  const stoppedAt = new Date().toISOString();
  if (!identity.owned) {
    return {stopped: false, attempted: true, stopped_at: stoppedAt, identity, reason: "pid is not this run's owned static service; not signalled"};
  }
  try { process.kill(-runState.pid, "SIGTERM"); }
  catch (error) { if (error.code !== "ESRCH") return {stopped: false, attempted: true, stopped_at: stoppedAt, identity, error: error.code}; }
  let exited = false;
  const deadline = Date.now() + 8_000;
  while (Date.now() < deadline) {
    try { process.kill(runState.pid, 0); }
    catch (error) { if (error.code === "ESRCH") { exited = true; break; } throw error; }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  let forced = false;
  if (!exited) {
    try { process.kill(-runState.pid, "SIGKILL"); } catch (error) { if (error.code !== "ESRCH") return {stopped: false, attempted: true, stopped_at: stoppedAt, identity, error: error.code}; }
    forced = true;
    const forcedDeadline = Date.now() + 4000;
    while (Date.now() < forcedDeadline) {
      try { process.kill(runState.pid, 0); }
      catch (error) { if (error.code === "ESRCH") { exited = true; break; } throw error; }
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
    }
  }
  const probe = await httpStatus(`${runState.base_url}${TARGET_PATH}`, 2000);
  const curl = runTimeout("curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "2", `${runState.base_url}${TARGET_PATH}`]);
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

// ---------------------------------------------------------------------------
// task handle and originals
// ---------------------------------------------------------------------------

function openHandle(taskRoot) {
  const manifest = JSON.parse(readFileSync(join(taskRoot, "task.json"), "utf8"));
  return openTask(taskRoot, {projectName: manifest.project_name, taskId: manifest.task_id});
}
async function publish(handle, taskRoot, ref, value) {
  const bytes = Buffer.from(typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`);
  try {
    const result = await handle.createRecord(ref, bytes);
    return {ref, idempotent: result.idempotent === true, sha256: sha256(bytes), bytes: bytes.length};
  } catch (error) {
    if (error.code === "RECORD_CONFLICT" && existsSync(join(taskRoot, ref)) && readFileSync(join(taskRoot, ref)).equals(bytes)) {
      return {ref, idempotent: true, sha256: sha256(bytes), bytes: bytes.length};
    }
    throw error;
  }
}
// Failure and attempt originals go through the task handle's appendRecord, not a
// bare writeFileSync. If the 3-digit append sequence is exhausted, an explicit
// attempts/ create-only path is used instead of silently dropping the fact.
async function appendBytes(handle, taskRoot, {dir, slug, ext, bytes}) {
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
  try {
    const path = await handle.appendRecord({dir, slug: safeSlug, ext, bytes});
    return {ref: relative(taskRoot, path).split(sep).join("/"), abs: path, sha256: sha256(bytes), bytes: bytes.length};
  } catch (error) {
    if (String(error.code ?? "").includes("SEQUENCE_EXHAUSTED")) {
      const ref = `${dir}/attempts/${EVIDENCE_DATE}-c12-p2-${safeSlug}-${randomUUID().slice(0, 8)}.${ext}`;
      const result = await publish(handle, taskRoot, ref, bytes);
      return {ref: result.ref, abs: join(taskRoot, result.ref), sha256: result.sha256, bytes: result.bytes, fallback: "append-sequence-exhausted"};
    }
    throw fail("E_APPEND_ORIGINAL", `cannot append ${dir}/${safeSlug}.${ext}: ${error.code ?? error.name}: ${error.message}`, {exitCode: 6});
  }
}
async function appendJson(handle, taskRoot, slug, value, dir = "quality/evidence") {
  return appendBytes(handle, taskRoot, {dir, slug, ext: "json", bytes: `${JSON.stringify(value, null, 2)}\n`});
}
function evidenceAbs(taskRoot, ref) {
  return join(taskRoot, ref);
}
function fileSha(path) {
  try { return sha256(readFileSync(path)); } catch { return null; }
}
function relativeRef(taskRoot, absolute) {
  return relative(taskRoot, absolute).split(sep).join("/");
}
function priorSeries(taskRoot, currentBase) {
  const rows = [];
  try {
    for (const name of readdirSync(join(taskRoot, "quality/evidence"))) {
      if (!name.endsWith("-v15-identity.json")) continue;
      const base = seriesOf(name);
      if (base === null || (base >= currentBase && base < currentBase + 10)) continue;
      const seriesBase = base - LAYOUT.identity.offset;
      const coverageRef = `quality/evidence/${EVIDENCE_DATE}-${seriesBase + LAYOUT.coverage.offset}-v15-coverage.json`;
      rows.push({sequence: base, series_base: seriesBase, ref: `quality/evidence/${name}`, coverage_ref: coverageRef, has_coverage: existsSync(join(taskRoot, coverageRef)), mtime: statSync(join(taskRoot, "quality/evidence", name)).mtimeMs});
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return rows.sort((left, right) => left.base - right.base).slice(-6);
}
function greenReceipts(taskRoot) {
  const rows = [];
  try {
    for (const name of readdirSync(join(taskRoot, "quality/tests"))) {
      if (!name.endsWith("-c12-p2-v15-green-gate.json")) continue;
      const path = join(taskRoot, "quality/tests", name);
      const doc = readJson(path);
      rows.push({ref: `quality/tests/${name}`, exit_code: doc.value?.exit_code ?? null, sha256: fileSha(path)});
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return rows;
}
// ---------------------------------------------------------------------------
// prepare
// ---------------------------------------------------------------------------

async function prepare(argv) {
  const options = parseFlags(argv, ["run-id", "service-root", "port", "task-record-root"], ["evidence-series"]);
  const runId = options["run-id"];
  const serviceRoot = resolve(WORKTREE, options["service-root"]);
  const port = Number(options.port);
  const taskRoot = resolve(options["task-record-root"]);
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(runId)) throw usage("--run-id must match [a-z0-9][a-z0-9-]{0,63}");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw usage("--port must be a TCP port");
  if (serviceRoot !== join(WORKTREE, SERVICE_ROOT)) throw usage(`--service-root must be ${SERVICE_ROOT} inside this worktree`);
  const handle = openHandle(taskRoot);
  const runDir = join("/tmp", `c12-${runId}`);
  const statePath = join(runDir, `${runId}-run-state.json`);
  const preparedAt = new Date().toISOString();
  mkdirSync(runDir, {recursive: true});

  // 1. Seven-file identity before any service exists. A mismatched aggregate
  // stops the run before the port is touched.
  const rows = v15IdentityRows();
  const aggregate = aggregateRows(rows);
  if (aggregate !== LOCKED_AGGREGATE) {
    const mismatch = {schema: "c12-v15-identity-mismatch/1", run_id: runId, checked_at: preparedAt, files: rows, aggregate, expected_aggregate: LOCKED_AGGREGATE, status: "mismatch"};
    const ref = await appendJson(handle, taskRoot, "c12-p2-identity-mismatch", mismatch);
    throw fail("E_IDENTITY_MISMATCH", "v15 seven-file aggregate differs from the locked value; service not started", {exitCode: 4, identity_ref: ref.ref, aggregate});
  }
  const design = designIdentity();
  const twoPages = twoPagesIdentityReference(taskRoot);

  // 2. Choose one free evidence series. Every originals write below belongs to it.
  let allocation = allocateBase(taskRoot, parseEvidenceBase(options["evidence-series"]));
  const identityFor = () => v15IdentityDoc(runId, rows, aggregate, {
    design_source: design,
    two_pages: twoPages,
    read_at: preparedAt,
    service_root_path: serviceRoot,
  });
  let identityRef = null;
  let boundaryRef = null;
  let boundary = null;
  for (let attempt = 0; attempt < 5 && identityRef === null; attempt += 1) {
    const base = allocation.base;
    const identityRefCandidate = evidenceName(base, "identity");
    const boundaryRefCandidate = evidenceName(base, "boundary");
    const identity = identityFor();
    try {
      identityRef = await publish(handle, taskRoot, identityRefCandidate, identity);
    } catch (error) {
      if (error.code !== "RECORD_CONFLICT") throw error;
      // A concurrent writer took this block: allocate the next free one.
      allocation = allocateBase(taskRoot, null);
      continue;
    }
    const gitStatus = runTimeout("git", ["status", "--porcelain", "--untracked-files=all"], {cwd: WORKTREE, timeout: 30_000});
    boundary = {
      schema: "c12-v15-boundary-before/1",
      object: "v15",
      run_id: runId,
      recorded_at: new Date().toISOString(),
      worktree: WORKTREE,
      branch: runTimeout("git", ["branch", "--show-current"], {cwd: WORKTREE}).stdout.trim() || null,
      head: runTimeout("git", ["rev-parse", "HEAD"], {cwd: WORKTREE}).stdout.trim() || null,
      v15: {service_root: SERVICE_ROOT, files: rows, aggregate, bytes: rows.reduce((sum, row) => sum + row.bytes, 0)},
      design_source: design,
      two_pages: twoPages,
      write_set: {
        allowed_new: ["tests/acceptance/c12-v15.mjs"],
        protected: ["tests/acceptance/c12-v15.test.mjs", "specs/**", "decision-log.md", "docs/examples/c11-ui/v15", "docs/examples/c11-ui/v11", "docs/examples/c11-ui/v12", "/Users/Hugh/Downloads/UI", "skills/frontend-testing/scripts/run-page-audit.mjs", "skills/isolated-browser-qa/scripts/browser-qa-session.mjs"],
        evidence_dir: "quality/evidence",
        note: "P2 writes only its declared new driver and task-library originals; no page, spec, design source, skill or Git byte.",
      },
      git_status: {argv: ["git", "status", "--porcelain", "--untracked-files=all"], cwd: WORKTREE, exit: gitStatus.status, signal: gitStatus.signal, stdout: gitStatus.stdout ?? "", stderr: gitStatus.stderr ?? ""},
    };
    try {
      boundaryRef = await publish(handle, taskRoot, boundaryRefCandidate, boundary);
    } catch (error) {
      if (error.code === "RECORD_CONFLICT") { allocation = allocateBase(taskRoot, null); identityRef = null; continue; }
      throw error;
    }
  }
  if (!identityRef || !boundaryRef) throw fail("E_EVIDENCE_SERIES", "could not allocate a free evidence series", {exitCode: 3});
  const base = allocation.base;

  // 3. A real command receipt for the locked delivery checksums (C06-P2 input).
  let identityCommand = null;
  try {
    identityCommand = await handle.captureCommand({
      cwd: serviceRoot,
      slug: "c12-p2-v15-delivery-check",
      argv: ["shasum", "-a", "256", "-c", "delivery.sha256"],
      timeoutMs: 60_000,
    });
  } catch (error) {
    identityCommand = {error: `${error.code ?? error.name}: ${error.message}`};
  }

  // 4. Start (or reuse this run's already-owned) service only after identity.
  const logPath = join(runDir, `${runId}-service.log`);
  const baseUrl = `http://127.0.0.1:${port}`;
  let pid = null;
  let processIdentity = null;
  let ready = null;
  let serviceStartedAt = null;
  let stop = null;
  try {
    const prior = readJson(statePath);
    const priorState = prior.error ? null : prior.value;
    if (priorState && priorState.run_id === runId && Number.isInteger(priorState.pid) && serviceIdentity(priorState.pid, port, priorState.process_identity?.start ?? null).owned) {
      pid = priorState.pid;
      processIdentity = priorState.process_identity;
      ready = await waitService(baseUrl, 10_000);
      serviceStartedAt = priorState.service_started_at ?? new Date().toISOString();
    } else {
      const owners = portOwners(port);
      const probe = await httpStatus(`${baseUrl}${TARGET_PATH}`, 1500);
      if (owners.length || probe.ok) {
        throw fail("E_PORT_IN_USE", `port ${port} is already occupied by a process this run does not own; use the stop command or free the port`, {exitCode: 6, owners, probe, stop_command: `node tests/acceptance/c12-v15.mjs stop --run-id=${runId} --task-record-root=${taskRoot}`});
      }
      pid = startServer({serviceRoot, port, logPath});
      serviceStartedAt = new Date().toISOString();
      for (let attempt = 0; attempt < 40 && !processIdentity?.start; attempt += 1) {
        await new Promise((resolvePromise) => setTimeout(resolvePromise, 50));
        processIdentity = {pid, start: processStart(pid)};
      }
      ready = await waitService(baseUrl);
      if (!ready.ok) throw fail("E_SERVICE", `static service did not answer on ${baseUrl}`, {exitCode: 6, ready, service_log: logPath});
    }
    // Prove the served HTML bytes are the bytes this identity names.
    const served = await fetch(`${baseUrl}${TARGET_PATH}`, {redirect: "error", signal: AbortSignal.timeout(5000)});
    const servedBytes = Buffer.from(await served.arrayBuffer());
    const servedSha = sha256(servedBytes);
    const expectedHtml = rows.find((row) => row.path.endsWith("-index.html"));
    if (served.status !== 200 || !expectedHtml || servedSha !== expectedHtml.sha256) {
      throw fail("E_SERVED_IDENTITY", "served entry bytes differ from the locked v15 HTML", {exitCode: 4, status: served.status, served_sha256: servedSha, expected_sha256: expectedHtml?.sha256 ?? null});
    }

    const stopCommand = `node tests/acceptance/c12-v15.mjs stop --run-id=${runId} --task-record-root=${taskRoot}`;
    const runState = {
      schema: "c12-v15-run-state/1",
      run_id: runId,
      task_root: taskRoot,
      service_root: SERVICE_ROOT,
      service_root_path: serviceRoot,
      route: ROUTE,
      entry_url: `${baseUrl}${TARGET_PATH}`,
      port,
      base_url: baseUrl,
      pid,
      process_identity: processIdentity,
      service_log: logPath,
      prepared_at: preparedAt,
      service_started_at: serviceStartedAt,
      ready,
      aggregate,
      evidence_base: base,
      identity_ref: identityRef.ref,
      boundary_ref: boundaryRef.ref,
      identity_command: identityCommand,
      design_source_matches: design.matches === true,
      two_pages_ref: twoPages.ref ?? null,
      stop_command: stopCommand,
      gateway_required: true,
    };
    const stateBytes = Buffer.from(`${JSON.stringify(runState, null, 2)}\n`);
    const temporary = `${statePath}.${process.pid}.tmp`;
    const fd = openSync(temporary, "wx", 0o600);
    try { writeSync(fd, stateBytes); fsyncSync(fd); } finally { closeSync(fd); }
    renameSync(temporary, statePath);

    process.stdout.write(`${JSON.stringify({
      ok: true,
      step: "prepare",
      run_id: runId,
      evidence_base: base,
      identity_ref: identityRef.ref,
      identity_sha256: identityRef.sha256,
      boundary_ref: boundaryRef.ref,
      aggregate,
      files: rows.length,
      design_source: {matches: design.matches === true, aggregate: design.aggregate ?? null, files: design.file_count ?? null},
      service: {base_url: baseUrl, pid, ready, entry_url: runState.entry_url, stop_command: stopCommand},
      identity_command: identityCommand?.receipt_ref ?? identityCommand?.error ?? null,
    })}\n`);
    return 0;
  } catch (error) {
    stop = pid ? await stopServer({pid, port, process_identity: processIdentity}) : null;
    let noteRef = null;
    let noteError = null;
    try {
      const note = await appendJson(handle, taskRoot, "c12-p2-prepare-failure", {
        schema: "c12-v15-prepare-failure/1",
        run_id: runId,
        failed_at: new Date().toISOString(),
        evidence_base: base,
        code: error.code ?? error.name,
        message: String(error.message).slice(0, 2000),
        pid,
        stop,
        first_error_preserved: true,
      });
      noteRef = note.ref;
    } catch (appendError) {
      noteError = `${appendError.code ?? appendError.name}: ${appendError.message}`;
    }
    error.cleanup = {stop, ref: noteRef, note_error: noteError};
    throw error;
  }
}

// ---------------------------------------------------------------------------
// stop (recovery for a gateway that failed before collect started)
// ---------------------------------------------------------------------------

async function stopRun(argv) {
  const options = parseFlags(argv, ["run-id", "task-record-root"]);
  const runId = options["run-id"];
  const taskRoot = resolve(options["task-record-root"]);
  const handle = openHandle(taskRoot);
  const runState = readJson(join("/tmp", `c12-${runId}`, `${runId}-run-state.json`));
  if (runState.error) throw fail("E_RUN_STATE", `run state for ${runId} not found (${runState.error})`, {exitCode: 2});
  const state = runState.value;
  const stop = await stopServer(state);
  let note = null;
  let noteError = null;
  try {
    note = await appendJson(handle, taskRoot, "c12-p2-stop-receipt", {
      schema: "c12-v15-stop-receipt/1",
      run_id: runId,
      stopped_at: new Date().toISOString(),
      port: state.port,
      pid: state.pid,
      stop,
      reason: "gateway failed before collect or explicit recovery stop",
    });
  } catch (error) {
    noteError = `${error.code ?? error.name}: ${error.message}`;
  }
  process.stdout.write(`${JSON.stringify({ok: stop.stopped || stop.port_closed, step: "stop", run_id: runId, port: state.port, pid: state.pid, stop, receipt: note?.ref ?? null, note_error: noteError})}\n`);
  return stop.stopped || stop.port_closed ? 0 : 1;
}

// ---------------------------------------------------------------------------
// collect helpers
// ---------------------------------------------------------------------------

function requireEngineContext(engine, session, spaceName, hostTaskId, taskId) {
  if (!["ego-lite", "ego", "agent-browser"].includes(engine)) {
    return `collect requires the gateway-selected owned engine; observed engine=${JSON.stringify(engine)}; no engine switch is attempted.`;
  }
  if (!text(session) || /^(unset|unavailable|unavailable-session|unknown|none)$/i.test(session)) {
    return "BROWSER_QA_SESSION is absent or a placeholder; a real gateway-owned session label is required.";
  }
  if (engine !== "agent-browser" && !text(spaceName)) {
    return "BROWSER_QA_EGO_TASKSPACE_NAME is absent; the ego route must run inside the isolated-browser-qa --run scenario.";
  }
  if (!hostTaskId || hostTaskId !== taskId) {
    return `host task id missing or different from the handle task id (${taskId}); export openTask(...).identity.taskId as BROWSER_QA_TASK_ID before the gateway --run.`;
  }
  return null;
}

// One state observation rule, shared by the worker and collect: only page
// markers count. A readable data-state may never be recorded as unknown; a
// missing/invalid marker is unknown with a reason. This keeps the frozen test
// and AC-C12-002 rule (both markers readable before match/mismatch).
function observeState(target, observed, ariaBusy, readError = null) {
  // Illegal or missing data-state is always unknown, never match/mismatch.
  const stateKnown = typeof observed === "string" && observed.length > 0 && C11_STATES.includes(observed);
  if (!stateKnown) {
    const reasons = [];
    if (readError) reasons.push(`页面标记读取失败：${readError}`);
    if (typeof observed !== "string" || !observed) reasons.push("#demo-result 的 data-state 缺失或为空");
    else reasons.push(`#demo-result 的 data-state 不是合法状态名：${JSON.stringify(observed)}`);
    return {result: "unknown", observed: observed ?? null, aria_busy: ariaBusy ?? null, reason: reasons.join("；")};
  }
  // A readable state with an unreadable busy marker is unknown with a reason,
  // never mismatch; this is the frozen test and AC-C12-002 rule.
  if (ariaBusy !== "true" && ariaBusy !== "false") {
    const reasons = [];
    if (readError) reasons.push(`页面标记读取失败：${readError}`);
    reasons.push(`#demo-confirm-panel 的 aria-busy 缺失或非法：${JSON.stringify(ariaBusy)}`);
    return {result: "unknown", observed, aria_busy: ariaBusy ?? null, reason: reasons.join("；")};
  }
  if (observed === target && ariaBusy === "false") return {result: "match", observed, aria_busy: ariaBusy};
  const reasons = [];
  if (observed !== target) reasons.push(`#demo-result data-state 为 ${observed}，与进入的 ${target} 不一致`);
  if (ariaBusy !== "false") reasons.push(`#demo-confirm-panel aria-busy 为 ${ariaBusy}，稳定态应为 "false"`);
  return {result: "mismatch", observed, aria_busy: ariaBusy, reason: reasons.join("；")};
}

function rawDocumentShape(message) {
  return fail("E_RAW_DOCUMENT", message, {exitCode: 6});
}
function validateRawDocument(taskRoot, ref, cell) {
  const doc = readJson(join(taskRoot, ref));
  if (doc.error) throw rawDocumentShape(`${ref}: ${doc.error}`);
  const value = doc.value;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw rawDocumentShape(`${ref}: not an object`);
  if (typeof value.engine !== "string" || typeof value.observed_at !== "string" || !Array.isArray(value.items) || !Array.isArray(value.failures)) {
    throw rawDocumentShape(`${ref}: must retain engine, observed_at, items and failures`);
  }
  for (const key of IDENTITY_KEYS) {
    if (typeof value.object?.[key] !== "string" || !value.object[key]) throw rawDocumentShape(`${ref}: identity missing ${key}`);
  }
  for (const key of ["route", "state", "viewport"]) {
    if (value.object[key] !== cell[key]) throw rawDocumentShape(`${ref}: object ${key} differs from its cell`);
  }
  return value;
}

function dimensionCounts(coverage, dimension) {
  const rows = coverage.dimension_status.filter((row) => row.dimension === dimension);
  return {total: rows.length, acquired: rows.filter((row) => row.status === "已取得").length};
}
function dimensionVerdict(coverage, dimension) {
  const counts = dimensionCounts(coverage, dimension);
  if (counts.total === 0) return "未测";
  if (counts.acquired === counts.total) return "可用";
  if (counts.acquired > 0) return "部分可用";
  return "未测";
}
function capabilityDocument({coverage, interaction, checks, designRef, mappingRef, screenshotsRef, checksRef, syntaxRefs, identityCommandRef, servedRows, identityFiles}) {
  const cells = coverage.cells;
  const match = cells.filter((cell) => cell.state_observation.result === "match").length;
  const mismatch = cells.filter((cell) => cell.state_observation.result === "mismatch").length;
  const unknown = cells.filter((cell) => cell.state_observation.result === "unknown").length;
  const readable = cells.filter((cell) => cell.state_observation.result !== "unknown").length;
  const acquired = coverage.dimension_status.filter((row) => row.status === "已取得").length;
  const candidates = interaction?.facts?.candidates ?? [];
  const pendingObserved = coverage.pending.records.filter((record) => record.observed === true).length;
  const controlsRecorded = cells.filter((cell) => Array.isArray(cell.controls) && cell.controls.length > 0).length;
  const checksList = [
    {name: "delivery.sha256（11 件）", ref: identityCommandRef?.ref ?? null, exit_code: identityCommandRef?.exit_code ?? null},
    {name: "app.js node --check", ref: syntaxRefs?.[0]?.ref ?? null, exit_code: syntaxRefs?.[0]?.exit_code ?? null},
    {name: "query-data.js node --check", ref: syntaxRefs?.[1]?.ref ?? null, exit_code: syntaxRefs?.[1]?.exit_code ?? null},
    {name: "七件身份复算", ref: coverage.identity.ref, exit_code: checks?.identity?.recorded_matches === true ? 0 : null},
    {name: "七件 served bytes HTTP 复核", ref: checksRef, exit_code: servedRows.length === 7 && servedRows.every((row) => row.matches) ? 0 : null},
  ];
  const checksComplete = checksList.every((check) => typeof check.ref === "string" && check.ref && check.exit_code === 0);
  const checksSome = checksList.some((check) => typeof check.ref === "string" && check.ref && check.exit_code === 0);
  const common = (value, full, partial = "部分可用") => value >= full ? "可用" : value > 0 ? partial : "未测";
  const rows = [
    {
      capability: "C02-P1 查询→页面选择",
      object: "v15",
      call_site: "index.html 载 query-data.js → app.js 读取 window.C11_QUERY_DATA → C11_queryOptions → renderOptions/syncSelection → 确认区状态机",
      input: "v15/2026-11-12-002-c11-query-data.js（schema=c11-query-data/1，8 条样例）",
      output: "候选单选、详情/YAML/身份文案、10 个稳定态结果文案",
      consumer: "产品内：确认区状态机、#sample-announcement 播报区；验收：本段覆盖件",
      verdict: candidates.length >= 8 && readable === 30 ? "可用" : candidates.length > 0 && readable > 0 ? "部分可用" : "未测",
      basis: `真实页面读到 ${candidates.length} 个候选；${readable}/30 格状态标记可读。只证数据驱动选择，不证知识影响页面设计。`,
      receipts: [coverage.identity.ref, coverage.checks_ref, interaction?.ref].filter(Boolean),
      declared_outputs: {candidates: candidates.map((item) => item.id), candidate_count: candidates.length},
    },
    {
      capability: "C02-P2 经验被页面采用",
      object: "v15",
      call_site: "无",
      input: "—",
      output: "—",
      consumer: "—",
      verdict: "未测",
      basis: "无具名后续真实任务承接；按 decision-log R-015 保持未测。",
      receipts: [],
    },
    {
      capability: "C03-P1 四对象页面使用点",
      object: "v15",
      call_site: "无（v15 不引 PB 组件）",
      input: "—",
      output: "—",
      consumer: "—",
      verdict: "未测",
      basis: "本对象无调用点；按 AC-C12-001 无调用点行记未测，不冒可用。",
      receipts: [],
    },
    {
      capability: "C04-P1 来源→页面使用点",
      object: "v15",
      call_site: "index.html:11-12 相对路径引 ../v11 与 ../v12 两份 CSS",
      input: "v11/2026-11-10-001-t019-wf-native-next-v11-styles.css、v12/2026-11-11-009-t019-v12-local-demo-styles.css",
      output: "整页层叠样式；两份 CSS 与服务端字节一致",
      consumer: "产品内：v15 页面；验收：七件身份件与本系列 checks 的 served 复核",
      verdict: "部分可用",
      basis: "只证两份 CSS 同字节被真实加载；不证逐项视觉规范达标。",
      receipts: [coverage.identity.ref, coverage.checks_ref],
    },
    {
      capability: "C04-P2 全状态/全视口对照",
      object: "v15",
      call_site: "10 稳定态 × 3 视口，全部由页内控件进入",
      input: "状态×视口矩阵；三视口 390×844、1280×800、1440×900",
      output: "30 个稳定格五维原始件与状态观察",
      consumer: "验收：Phase 4 报告与后续复查者",
      verdict: acquired === 150 ? "可用" : acquired > 0 ? "部分可用" : "未测",
      basis: `30 格中 ${acquired}/150 个维度原件可读；match ${match}、mismatch ${mismatch}、unknown ${unknown}；pending 三视口另记未测。`,
      receipts: [coverage.identity.ref, coverage.checks_ref, designRef].filter(Boolean),
    },
    {
      capability: "C05-P1 需求→可运行原型",
      object: "v15",
      call_site: "index.html 三分区 IA + app.js initialState/transition/render 十一态状态机",
      input: "T019 需求 IA 与状态清单；query-data 候选",
      output: "可运行单页、十个稳定态结果文案、aria-busy 忙标记",
      consumer: "产品内：页面本身；验收：本段覆盖件",
      verdict: match === 30 && controlsRecorded === 30 ? "可用" : match > 0 ? "部分可用" : "未测",
      basis: `当前运行 match ${match}/30、mismatch ${mismatch}、unknown ${unknown}，${controlsRecorded}/30 格记了控件序列；${mismatch > 0 ? `有 ${mismatch} 格 mismatch，判词按实际观察降级；` : ""}原型达标不等于用户批准。`,
      receipts: [coverage.identity.ref, interaction?.ref].filter(Boolean),
    },
    {
      capability: "C05-P2 八维独立设计审查",
      object: "v15",
      call_site: "C11 八维审查原件复核",
      input: "C11 八维清单与 12 条处置；当前入库副本字节",
      output: "复核结论 + 未抽查维度清单",
      consumer: "验收：Phase 4 报告",
      verdict: "部分可用",
      basis: "本段只产出当前设计对照与运行观察；八维独立审查由未参与实施者另出原件，未重做维度单列未测。",
      receipts: [designRef, mappingRef].filter(Boolean),
      declared_outputs: {
        unchecked_dimensions: [
          {dimension: "同页稿像素/间距/层次", status: "未测", owner: "设计源 owner/用户", recovery: "提供 v15 同页设计稿"},
          {dimension: "对比度", status: "未测", owner: "独立读者", recovery: "对比度测量或采集器"},
          {dimension: "200% 缩放", status: "未测", owner: "独立读者/环境 owner", recovery: "真实 200% 缩放在场"},
          {dimension: "物理读屏", status: "not_checked", owner: "用户", recovery: "真人读屏环境"},
          {dimension: "用户满意", status: "未测", owner: "用户", recovery: "用户本人对当前完整展示的答复"},
          {dimension: "C11 12 条处置逐条现状", status: "未测", owner: "C11/P4", recovery: "逐条对当前七件复核"},
        ],
      },
    },
    {
      capability: "C05-P3 完整范围后用户答复",
      object: "v15",
      call_site: "无",
      input: "—",
      output: "—",
      consumer: "—",
      verdict: "未测",
      basis: "需用户本人答复；按 R-016 保持未测。",
      receipts: [],
    },
    {
      capability: "C06-P1 状态 owner/错误/重复/身份",
      object: "v15",
      call_site: "app.js:3-17 transition() + :123-136 render()；#demo-confirm-panel aria-busy；#demo-result data-state",
      input: "页内单选、#demo-use-sample、#demo-scenario、#demo-confirm、#demo-recover、#demo-reset",
      output: "phase、按钮 disabled、身份文案、aria-busy、data-state",
      consumer: "产品内：结果区、播报区；验收：本段状态观察",
      verdict: match === 30 && pendingObserved >= 3 ? "可用" : match > 0 ? "部分可用" : "未测",
      basis: `真实 match ${match}/30、mismatch ${mismatch}、unknown ${unknown}；pending ${pendingObserved}/3 个视口观察到 data-state=pending 与 aria-busy=true；${mismatch > 0 ? `有 ${mismatch} 格 mismatch，判词按实际观察降级；` : ""}`,
      receipts: [coverage.identity.ref, interaction?.ref].filter(Boolean),
    },
    {
      capability: "C06-P2 定向检查读当前字节",
      object: "v15",
      call_site: "delivery.sha256、app.js/query-data.js node --check、七件身份复算、served bytes 复核",
      input: "当前入库副本字节",
      output: "五项检查回执",
      consumer: "验收：Phase 4 报告",
      verdict: checksComplete ? "可用" : checksSome ? "部分可用" : "未测",
      basis: `矩阵要求的 5 项检查中 ${checksList.filter((check) => check.exit_code === 0).length}/5 有 exit 0 回执；未跑项不冒通过。`,
      receipts: checksList.map((check) => check.ref).filter(Boolean),
      declared_outputs: {checks: checksList},
    },
    {
      capability: "C06-P3 完整 diff + 四维审查",
      object: "v15",
      call_site: "当前七件与 C11 记载比对",
      input: "当前字节与 C11 清单/readme 记载",
      output: "差异结论 + 旧字节标注",
      consumer: "验收：Phase 4 报告",
      verdict: "部分可用",
      basis: "当前七件身份可复算；C11 的四维结论属旧字节，本段未逐条对当前字节重做。",
      receipts: [coverage.identity.ref],
      declared_outputs: {
        diff_conclusion: {
          current_aggregate: coverage.identity.aggregate,
          current_files: 7,
          c11_relation: "v15 readme:7 记载 4 件与 C11 终态不同（app.js R3 定时器、index.html N1/R1、readme N2、query-data 路径）；当前哈希以七件身份为准。",
          old_bytes_note: "C11 四维结论基于旧字节，不得写成当前复验；本段未取得 C11 v15 逐件旧哈希，故逐件旧新差异记未测。",
          per_file: FILES.map((path) => ({path, old_byte_hash: "未取得（C11 v15 基线不在本任务材料）", current_sha256: identityFiles?.find((row) => row.path === path)?.sha256 ?? null, status: "旧字节标注，非当前复验"})),
          owner: "C11/P4",
          recovery: "从 C11 原任务库逐条取 v15 旧哈希并复核当前七件",
        },
      },
    },
    {
      capability: "C07-P1 视觉/布局/溢出/视口",
      object: "v15",
      call_site: "三视口渲染，读 documentElement scrollWidth/clientWidth",
      input: "渲染页",
      output: "逐视口溢出读数",
      consumer: "验收：本段覆盖件与 Phase 4",
      verdict: dimensionVerdict(coverage, "overflow"),
      basis: `overflow ${dimensionCounts(coverage, "overflow").acquired}/${dimensionCounts(coverage, "overflow").total} 格已取得；只读根元素滚动宽度，不覆盖后代或内部滚动容器。`,
      receipts: [coverage.checks_ref],
    },
    {
      capability: "C07-P2 交互/键盘/焦点/AX",
      object: "v15",
      call_site: "Tab 序列、焦点读数、Accessibility.getFullAXTree",
      input: "DOM",
      output: "AX 树与键盘回执",
      consumer: "验收：本段覆盖件与 Phase 4",
      verdict: dimensionVerdict(coverage, "a11y"),
      basis: `a11y ${dimensionCounts(coverage, "a11y").acquired}/${dimensionCounts(coverage, "a11y").total} 格已取得；只读可访问树 role/name/focusable 与 3 次 Tab；未做对比度与完整键盘路径。`,
      receipts: [coverage.checks_ref, interaction?.ref].filter(Boolean),
      declared_outputs: {keyboard_receipts: {ref: interaction?.ref ?? null, entries: interaction?.keyboard?.length ?? 0, per_viewport: VIEWPORTS.map((viewport) => interaction?.keyboard?.filter((row) => row.viewport === viewport).length ?? 0)}},
    },
    {
      capability: "C07-P3 a11y 实际 + 200% 缩放",
      object: "v15",
      call_site: "AX 树已采；200% 缩放与物理读屏未做",
      input: "缩放、读屏环境",
      output: "三态读数；读屏 not_checked",
      consumer: "验收：Phase 4 报告",
      verdict: dimensionCounts(coverage, "a11y").acquired > 0 ? "部分可用" : "未测",
      basis: "物理读屏 not_checked，owner=用户，恢复条件=真人读屏环境；200% 缩放未测，owner=独立读者/环境 owner；对比度未测，owner=独立读者。",
      receipts: [coverage.checks_ref],
    },
    {
      capability: "C07-P4 性能",
      object: "v15",
      call_site: "performance navigation timing、longtask 与一次交互时长",
      input: "页面加载/交互",
      output: "ttfb、DCL、load、长任务、单次交互；单次导航采样",
      consumer: "验收：Phase 4 报告",
      verdict: dimensionCounts(coverage, "perf").acquired > 0 ? "部分可用" : "未测",
      basis: "无阈值；LCP/CLS/INP 未采，单次导航采样，median 保持 unknown。",
      receipts: [coverage.checks_ref],
    },
    {
      capability: "C07-P5 定位→回修→独立复验",
      object: "v15",
      call_site: "C11 处置原件复核",
      input: "C11 发现清单与 4 个差异文件",
      output: "处置表 + 定向复验回执",
      consumer: "验收：Phase 4 报告",
      verdict: "部分可用",
      basis: "本段未重做定位回修；四件当前字节与 C11 记载的 4 个差异已回指 readme，独立复验未做，单列未测。",
      receipts: [coverage.identity.ref, designRef].filter(Boolean),
      declared_outputs: {
        handling_table: [
          {id: "R3 定时器", item: "pending 150ms 后离开", source: "v15 readme:7", current_status: `当前 app.js:159 含 150ms 定时器；本段 pending 三视口实读离开毫秒 ${coverage.pending.records.map((record) => record.left_pending_after_ms ?? "未读").join("/")}`, owner: "P2", recovery: "不需要"},
          {id: "N1 文案", item: "页头候选说明", source: "v15 readme:7", current_status: "当前 index.html 含入库副本文案；本段未做独立文案审查", owner: "独立读者", recovery: "对 T019 原文逐句核"},
          {id: "N2 说明", item: "readme 说明", source: "v15 readme:7", current_status: "当前 readme:23 记无稿提取 N/A", owner: "P2", recovery: "不需要"},
          {id: "query-data 路径", item: "来源图路径改相对", source: "v15 readme:7", current_status: "query-data.js 与 readme:7 记载当前值", owner: "P2", recovery: "不需要"},
          {id: "C11 其余处置", item: "12 条中的其余项", source: "C11 原任务库", current_status: "未取得逐条原件，未测", owner: "C11/P4", recovery: "读 C11 12 条处置原件并逐条对当前七件"},
        ],
      },
    },
  ];
  return {
    schema: "c12-v15-capability/1",
    object: "v15",
    run_id: coverage.run_id,
    produced_at: new Date().toISOString(),
    engine: coverage.engine,
    engine_session: coverage.engine_session,
    object_version: coverage.identity.aggregate,
    matrix_source: "specs/workflowhub-ui-frontend-c12-acceptance-20261114/decision-log.md#已经定死的能力矩阵",
    rows,
    summary: {
      total: rows.length,
      available: rows.filter((row) => row.verdict === "可用").length,
      partial: rows.filter((row) => row.verdict === "部分可用").length,
      unavailable: rows.filter((row) => row.verdict === "不可用").length,
      untested: rows.filter((row) => row.verdict === "未测").length,
      cells: coverage.cells.length,
      dimensions_acquired: acquired,
      state_observation: {match, mismatch, unknown},
      pending_observed: pendingObserved,
    },
    not_applicable: ["C08 变更→使用点同步：矩阵该行属两页副本/P3，v15 没有对应行，不在本对象能力表内。"],
    checks_ref: coverage.checks_ref,
    design_ref: designRef,
    mapping_ref: mappingRef,
    screenshots_ref: screenshotsRef,
    reuse_note: "This is the P2 producer index for AC-C12-001; independent judgment is not replaced by it.",
  };
}

// ---------------------------------------------------------------------------
// design comparison
// ---------------------------------------------------------------------------

function designComparisonMarkdown({coverage, designFacts, designSource, interaction, screenshots, negativeSearch, interfaceFields, mappingRef, checksRef}) {
  const facts = Array.isArray(designFacts) ? designFacts : [];
  const first = facts[0] ?? {};
  const shotRows = Array.isArray(screenshots) ? screenshots : [];
  const chain = [
    ["需求", "T019 原文不存在于本任务材料；二手可读引用 C09 `quality/evidence/research/2026-11-07-001-c09-prd-consumption-denominator.md:13` 的「T019需求:3 不复用有稿两页样式/组件」；`v15/2026-11-11-003-...readme.md:23` 记无稿提取 N/A。", "未核（来源不可读）", "用户 / C09 原 owner", "布局与文案的来源端双锚缺失；不得写「未见未批准偏差」", "提供 T019 原文或可读副本 + sha256"],
    ["原型", "当前七件身份与裸入口静态服务；`index.html` 三分区、`app.js` 十一态状态机。", "已核（当前字节）", "P2", "对象实体", "N/A"],
    ["实现", "七件聚合 6dc77bf7…；30 格真实运行；`app.js:3-17/123-136` 的状态与标记。", "已核（当前字节）", "P2", "状态机、DOM 与样式事实", "N/A"],
    ["页面检查", "本系列 coverage 的 30 格 + 本系列 interaction + 本次两/三视口截图；读屏/200%/对比度未测。", "部分已核（视觉语义未判）", "P2 / 独立读者", "AC-C12-002/003 的视觉与辅助技术面", "真人读屏、200% 缩放与对比度环境"],
    ["回修", "readme 的 C11 记载与 4 文件差异；C11 四维结论属旧字节。", "部分/未核（旧字节未当前复核）", "C11 / P4", "旧字节结论不可当当前复验", "逐条对当前七件复核"],
  ];
  const categories = [
    ["布局", "设计源 66 件内无同页稿（负向检索见下）；`src/App.tsx:8-12` 四视图不含三分区策略快照页。", "`index.html:54-157` 三分区；本系列 interaction.design_facts 的三视口 header/main/footer 矩形与 root_scroll。", "不适用（无同页设计稿）；未批准偏差不判达标", "同页稿像素/间距/层次；owner=设计源 owner/用户；恢复条件=提供同页稿"],
    ["组件", "`src/components/` 23 个顶层组件属 board/workbench/new/sim-workbench；T019 明确不复用两页样式/组件（C09 research:13）。", "`index.html:136-155` 原生 radio/select/button；`app.js:151-175` 原生事件；无 PB 组件、无沉淀。", "不适用（v15 不引 PB 组件；原生控件复用，无沉淀）", "React 组件映射（本对象不适用）"],
    ["令牌与样式", "v15 令牌权威是实际加载的 v11/v12 两份 CSS（已进七件身份）；设计源 `src/index.css` 无同页对应。", "v11/v12 CSS 路径见身份件；本系列 interaction.design_facts.tokens 的 body 背景/字体、accent_blue。", "不适用（无同页稿；令牌源=v11/v12 CSS）", "逐 token 对照与对比度；owner=独立读者；对比度未测"],
    ["文案", "T019 原文不可读；无同页稿；不以旧答复或截图补写设计意图。", "`index.html:56` eyebrow、`:60-64` h1/lede、`app.js:58` 十态文案；本次真实运行只读 DOM。", "未测（无 T019 来源端可锚）", "owner=用户/C09 原 owner；恢复条件=提供 T019 原文后逐句核"],
    ["信息架构与导航", "设计源 66 件内无同页三分区导航；`src/App.tsx` 四视图属两页对象。", "`index.html:58-72` 三项锚点导航、skip-link、main/footer 顺序；本系列 interaction.design_facts.nav。", "不适用（无同页稿）；跳过链接与锚点实现事实可核", "跨页导航（单页对象无）"],
  ];
  const deviations = [
    ["已批准", "0 条", "没有同页稿批准件，也没有把旧答复/旧截图当批准。"],
    ["未批准→不达标", "0 条", "无同页稿，五类适用项按不适用/未测登记；没有可登记的实现偏差对象。"],
    ["疑似源漂移", designSource?.matches === true ? "0 条" : "1 条（设计源指纹不符）", designSource?.matches === true ? "设计源 66 件聚合 843d0e88… 与锁定值一致。" : `设计源聚合 ${designSource?.aggregate ?? "unavailable"} 与锁定值不符；受影响项应停并请用户裁决。`],
  ];
  const lines = [
    "# v15 设计对照（P2 生产者原件）",
    "",
    `- run_id：${coverage.run_id}`,
    `- 对象：v15 七件，聚合 \`${coverage.identity.aggregate}\``,
    `- 设计源：\`${DESIGN_ROOT}\`，${designSource?.file_count ?? "unknown"} 件，聚合 \`${designSource?.aggregate ?? "unavailable"}\`，matches=${designSource?.matches === true}`,
    `- 视口：${VIEWPORTS.join("、")}；稳定态：${STATES.join("、")}（pending 记未测）`,
    `- 回指：交互与 design_facts=\`${interaction?.ref ?? "unavailable"}\`；覆盖与检查=\`${checksRef ?? coverage.checks_ref}\`；映射=\`${mappingRef ?? "unavailable"}\`。`,
    "- 本件只生产者事实；五类语义由未参与实施的独立读者判，不用截图代替。",
    "",
    "## 链段清单（需求→原型→实现→页面检查→回修）",
    "",
    "v15 只覆盖单段（实现 + 页面检查），不冒全链；缺段如实记未核。",
    "",
    "| 段 | 来源 | 已核/未核 | owner | 影响 | 恢复条件 |",
    "| --- | --- | --- | --- | --- | --- |",
    ...chain.map((row) => `| ${row.join(" | ")} |`),
    "",
    "## 五类对照（设计源与实现双锚）",
    "",
    "| 类别 | 当前设计源依据 | 当前实现依据（真实运行） | 偏差状态 | 未覆盖/owner/恢复 |",
    "| --- | --- | --- | --- | --- |",
    ...categories.map((row) => `| ${row.join(" | ")} |`),
    "",
    "## 偏差登记（D-007 三态）",
    "",
    "| 状态 | 数量 | 依据 |",
    "| --- | --- | --- |",
    ...deviations.map((row) => `| ${row.join(" | ")} |`),
    "",
    "0 条偏差的理由：v15 无同页设计稿；当前设计源 66 件聚合与锁定值一致；五类适用项按不适用或未测登记，没有可登记的实现偏差对象。",
    "",
    "## 无稿负向检索",
    "",
    `- 执行：${negativeSearch?.executed_at ?? "unavailable"}；范围：设计源身份集 ${negativeSearch?.scope_files ?? "unknown"} 件；词：${(negativeSearch?.terms ?? []).join("、")}。`,
    `- 命中：${negativeSearch?.zero_hit ? "0 处" : `${negativeSearch?.hits?.length ?? "unknown"} 处（见下）`}。`,
    `- 结论：${negativeSearch?.conclusion ?? "unavailable"}`,
    `- 邻接说明：${negativeSearch?.adjacent_note?.path ?? "unavailable"}（不在 66 件身份集）出现「${negativeSearch?.adjacent_note?.text ?? "策略快照"}」，${negativeSearch?.adjacent_note?.interpretation ?? ""}`,
    ...(negativeSearch?.hits ?? []).map((hit) => `- 命中：\`${hit.path}:${hit.line}\`（${hit.term}）\`${hit.excerpt}\``),
    "",
    "## 截图（当前运行）",
    "",
    "| 视口 | 状态 | 原件 | sha256 | 说明 |",
    "| --- | --- | --- | --- | --- |",
    ...shotRows.map((shot) => `| ${shot.viewport} | ${shot.available ? "available" : "unavailable"} | ${shot.ref} | ${shot.sha256 ?? "—"} | ${shot.reason ?? shot.url ?? "静态稿 unselected"} |`),
    "",
    "截图只作视觉证据，不证明三十格、键盘、AX、焦点、对比度或交互通过；P8/C09 旧图未作为当前证据。",
    "",
    "## 七项界面判定字段",
    "",
    "| 字段 | 来源 | 消费者 |",
    "| --- | --- | --- |",
    ...interfaceFields.map((row) => `| ${row.field} | ${row.source} | ${row.consumer} |`),
    "",
    "## 与 C11 旧字节的区分",
    "",
    "- 本件与覆盖件使用当前七件字节；C11 四维结论属旧字节，不得写成当前复验。",
    "- 反向区分：把 C11 旧字节四维结论当当前复验时，本段对照必须被拒绝。",
    "",
    "## 未测与限制",
    "",
    "- v15 无同页设计稿，因此不做像素级同页还原；设计源只作共享语汇与 66 件当前指纹。",
    "- 文案无 T019 来源端可锚，记未测；不得写「未见未批准偏差」。",
    "- 令牌对照不适用（无同页稿），令牌权威是 v11/v12 CSS；对比度未测，owner=独立读者。",
    "- 物理读屏 not_checked，owner=用户，恢复条件=真人读屏环境；200% 缩放未测，owner=独立读者/环境 owner。",
    "- 独立设计审查由未参与实施者另出原件，本件不自判通过。",
    "",
    "## 真实运行事实",
    "",
    "```json",
    JSON.stringify({viewports: facts.map((fact) => ({viewport: fact.viewport, title: fact.title, h1: fact.h1, nav: fact.nav, sections: fact.sections, tokens: fact.tokens, root_scroll: fact.root_scroll})), interaction_states: STATES.length, screenshots: shotRows.map((shot) => ({viewport: shot.viewport, available: shot.available, ref: shot.ref}))}, null, 2),
    "```",
    "",
    `- 覆盖件：\`quality/evidence/*-v15-coverage.json\`（本系列 base=${coverage.evidence_base}）`,
    "- 证据计划：判什么=五类双来源；怎么判=独立人读；证据从哪来=当前运行与设计源；拿不到怎么办=写 unknown、owner、影响与恢复条件，不猜设计意图。",
  ];
  return `${lines.join("\n")}\n`;
}

function planOffsetMap({base, taskRoot, runId, testsGreen}) {
  const planned = {service: 200, result: 201, identity: 202, boundary: 203, capability: 204, design: 205, interaction: 206, coverage: 207, checks: 208};
  const actual = Object.fromEntries(Object.keys(LAYOUT).map((key) => [key, base + LAYOUT[key].offset]));
  const p1 = ["2026-11-14-202-two-pages-identity.json", "2026-11-14-203-two-pages-boundary-before.json", "2026-11-14-206-two-pages-interaction.json", "2026-11-14-208-two-pages-design-facts.json"]
    .map((name) => ({ref: `quality/evidence/${name}`, exists: existsSync(join(taskRoot, "quality/evidence", name))}));
  return {
    schema: "c12-v15-plan-offset-map/1",
    object: "v15",
    run_id: runId,
    produced_at: new Date().toISOString(),
    planned,
    actual,
    actual_refs: Object.fromEntries(Object.keys(LAYOUT).map((key) => [key, evidenceName(base, key)])),
    tests: {green_receipts: testsGreen.filter((item) => item.exit_code === 0), failed_gate_receipts: testsGreen.filter((item) => item.exit_code !== 0)},
    prior_series: priorSeries(taskRoot, base),
    p1_same_numbers: {items: p1, note: "200/203/206/208 等同号件属 P1 两页对象；v15 系列按 write-once 另分配 base，不复用、不覆盖 P1 件。"},
    reason: "planned 200-207 已被 P1 同号系列占用且原件只写一次；冻结测试 TCR-C12-003 按 *-v15-identity/coverage.json 最新系列选择。偏移保留 planned 的 +0..+9 相对关系。",
  };
}
// ---------------------------------------------------------------------------
// collect
// ---------------------------------------------------------------------------

async function collect(argv) {
  const options = parseFlags(argv, ["run-id", "service-url", "task-record-root"]);
  const runId = options["run-id"];
  const serviceUrl = options["service-url"].replace(/\/$/, "");
  const taskRoot = resolve(options["task-record-root"]);
  const handle = openHandle(taskRoot);
  const runDir = join("/tmp", `c12-${runId}`);
  const runState = readJson(join(runDir, `${runId}-run-state.json`));
  if (runState.error) throw fail("E_RUN_STATE", `run state for ${runId} not found; run prepare first (${runState.error})`, {exitCode: 2});
  const state = runState.value;
  if (state.run_id !== runId) throw fail("E_RUN_STATE", `run state belongs to ${state.run_id}, not ${runId}`, {exitCode: 2});
  if (state.base_url !== serviceUrl) throw fail("E_SERVICE_IDENTITY", `service URL ${serviceUrl} differs from prepared ${state.base_url}`, {exitCode: 2});
  const base = Number(state.evidence_base);
  if (!Number.isInteger(base) || base < FIRST_RUN) throw fail("E_RUN_STATE", "run state carries no usable evidence base", {exitCode: 2});
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
  // Failure notes are real task originals. A note write failure is never
  // swallowed: the original error carries both the note error and its ref.
  const failureRef = async (code, message, extra = {}) => {
    try {
      const note = await appendJson(handle, taskRoot, `c12-p2-failure-${code.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, {
        schema: "c12-v15-collect-failure/1",
        run_id: runId,
        failed_at: new Date().toISOString(),
        evidence_base: base,
        code,
        message: String(message).slice(0, 2000),
        gateway,
        ...extra,
      });
      return {ref: note.ref, error: null};
    } catch (error) {
      return {ref: null, error: `${error.code ?? error.name}: ${error.message}`};
    }
  };
  let stopFacts = null;
  let attemptId = null;
  const stopOnce = async () => {
    if (!stopFacts) stopFacts = await stopServer(state);
    return stopFacts;
  };
  try {
    const contextProblem = requireEngineContext(engine, session, spaceName, hostTaskId, taskId);
    if (contextProblem) {
      const note = await failureRef("E_GATEWAY_CONTEXT", contextProblem);
      throw fail("E_GATEWAY_CONTEXT", contextProblem, {exitCode: 4, failure_ref: note.ref, failure_note_error: note.error});
    }
    const serviceOwner = serviceIdentity(state.pid, state.port, state.process_identity?.start ?? null);
    if (!serviceOwner.owned) {
      const note = await failureRef("E_SERVICE_OWNER", "port 41922 listener is not this run's recorded process; page observations are not attributed to this run.", {service_owner: serviceOwner});
      throw fail("E_SERVICE_OWNER", "port listener identity does not belong to this run; collection stopped", {exitCode: 5, service_owner: serviceOwner, failure_ref: note.ref, failure_note_error: note.error});
    }

    // Identity recheck at collect time: same rows, same aggregate, and the served
    // bytes for every one of the seven files.
    const rows = v15IdentityRows();
    const aggregate = aggregateRows(rows);
    const identityDoc = readJson(join(taskRoot, state.identity_ref));
    if (identityDoc.error || identityDoc.value?.aggregate !== aggregate) {
      const note = await failureRef("E_IDENTITY_DRIFT", "v15 identity changed after prepare; collection stopped.", {aggregate, recorded: identityDoc.value?.aggregate ?? null});
      throw fail("E_IDENTITY_DRIFT", "seven-file identity drifted after prepare", {exitCode: 4, failure_ref: note.ref, failure_note_error: note.error});
    }
    const servedRows = [];
    for (const source of rows) {
      const response = await fetch(`${serviceUrl}/${source.path}`, {redirect: "error", signal: AbortSignal.timeout(5000)});
      const bytes = Buffer.from(await response.arrayBuffer());
      servedRows.push({path: source.path, status: response.status, sha256: sha256(bytes), matches: response.status === 200 && sha256(bytes) === source.sha256});
    }
    if (servedRows.some((row) => !row.matches)) {
      const note = await failureRef("E_SERVED_IDENTITY", "served bytes differ from the locked seven files; collection stopped.", {served: servedRows});
      throw fail("E_SERVED_IDENTITY", "served bytes differ from the locked seven files", {exitCode: 4, failure_ref: note.ref, failure_note_error: note.error});
    }
    const ready = await waitService(serviceUrl, 10_000);
    if (!ready.ok) {
      const note = await failureRef("E_SERVICE", `service unavailable at ${serviceUrl}`, {ready});
      throw fail("E_SERVICE", `service unavailable at ${serviceUrl}`, {exitCode: 5, failure_ref: note.ref, failure_note_error: note.error});
    }

    // Real command receipts for the current bytes (C06-P2 five checks).
    const syntaxRefs = [];
    for (const [slug, file] of [["c12-p2-v15-syntax-app", FILES[0]], ["c12-p2-v15-syntax-query-data", FILES[4]]]) {
      try {
        const receipt = await handle.captureCommand({
          cwd: WORKTREE,
          slug,
          argv: [process.execPath, "--check", join(WORKTREE, SERVICE_ROOT, file)],
          timeoutMs: 30_000,
        });
        syntaxRefs.push({ref: receipt.receipt_ref ?? null, exit_code: receipt.exit_code ?? null, output_ref: receipt.output_ref ?? null});
      } catch (error) {
        syntaxRefs.push({ref: null, exit_code: null, error: `${error.code ?? error.name}: ${error.message}`});
      }
    }

    // No overwrite: this run's collect-owned originals must be free. Identity,
    // boundary and mapping were written by prepare for this same series.
    const prepareOwned = new Set([evidenceName(base, "identity"), evidenceName(base, "boundary")]);
    const taken = familyPaths(base).filter((ref) => !prepareOwned.has(ref) && existsSync(join(taskRoot, ref)));
    if (taken.length) throw fail("E_EVIDENCE_EXISTS", `this run's evidence series already holds originals (${taken[0]}); run prepare for a new series`, {exitCode: 3, taken: taken.slice(0, 5)});

    attemptId = `${runId}-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
    const rawPaths = STATES.flatMap((stateName) => VIEWPORTS.flatMap((viewport) => DIMENSIONS.map((dimension) => {
      const ref = rawName(base, stateName, viewport, dimension);
      const abs = evidenceAbs(taskRoot, ref);
      mkdirSync(dirname(abs), {recursive: true});
      return {state: stateName, viewport, dimension, ref, abs};
    })));
    const screenshotTargets = VIEWPORTS.map((viewport) => ({
      viewport,
      ref: shotName(base, viewport),
      abs: evidenceAbs(taskRoot, shotName(base, viewport)),
    }));
    for (const shot of screenshotTargets) mkdirSync(dirname(shot.abs), {recursive: true});
    const workerResultPath = join(runDir, `${runId}-worker-result-${attemptId}.json`);
    const workerLog = join(runDir, `${runId}-worker-${attemptId}.log`);
    const workerInput = {
      engine,
      session,
      spaceName,
      serviceUrl,
      workspace: WORKTREE,
      route: ROUTE,
      auditRoute: TARGET_PATH,
      entryUrl: `${serviceUrl}${TARGET_PATH}`,
      viewports: VIEWPORTS,
      states: STATES,
      dimensions: DIMENSIONS,
      rawPaths: rawPaths.map(({state: stateName, viewport, dimension, abs}) => ({state: stateName, viewport, dimension, abs})),
      screenshots: screenshotTargets.map(({viewport, abs}) => ({viewport, abs})),
      attemptId,
      aggregate,
      objectVersion: aggregate,
      resultPath: workerResultPath,
    };
    const workerScript = `
const input = ${JSON.stringify(workerInput)};
const fs = await import("node:fs");
try {
  const {runV15Worker} = await import(${JSON.stringify(MODULE_URL)});
  const value = await runV15Worker(input);
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
          timeout: 900_000,
          maxBuffer: 64 * 1024 * 1024,
        })
      : spawnSync(helper, ["nodejs", "-e", workerScript], {
          cwd: WORKTREE,
          env: {...process.env, BROWSER_QA_ENGINE: engine},
          encoding: "utf8",
          timeout: 900_000,
          maxBuffer: 64 * 1024 * 1024,
        });
    writeFileSync(workerLog, `ATTEMPT ${attemptId}\nARGV ${JSON.stringify(engine === "agent-browser" ? [process.execPath, "-e", "<embedded>"] : [helper, "nodejs", "-e", "<embedded>"])}\nEXIT ${worker.status} SIGNAL ${worker.signal}\nSTDOUT\n${worker.stdout ?? ""}\nSTDERR\n${worker.stderr ?? ""}\n`);
    const workerResult = readJson(workerResultPath);
    const workerProblems = [];
    if (worker.error) workerProblems.push(`worker spawn/execute error: ${worker.error.code ?? worker.error.message}`);
    if (worker.status !== 0) workerProblems.push(`worker exit=${worker.status} signal=${worker.signal}`);
    if (workerResult.error) workerProblems.push(`result unreadable: ${workerResult.error}`);
    if (workerResult.value?.ok !== true) workerProblems.push("worker result ok is not true");
    if (workerResult.value?.attempt_id !== attemptId) workerProblems.push(`worker result belongs to attempt ${JSON.stringify(workerResult.value?.attempt_id ?? "unknown")}`);
    if (!Array.isArray(workerResult.value?.cells) || workerResult.value.cells.length !== STATES.length * VIEWPORTS.length) workerProblems.push(`worker returned ${Array.isArray(workerResult.value?.cells) ? workerResult.value.cells.length : "no"} cells`);
    if (workerProblems.length) {
      const persisted = {};
      try {
        persisted.log = (await appendBytes(handle, taskRoot, {dir: "quality/evidence", slug: "c12-p2-worker-log", ext: "log", bytes: readFileSync(workerLog)})).ref;
      } catch (error) { persisted.log_error = `${error.code ?? error.name}: ${error.message}`; }
      try {
        persisted.result = (await appendBytes(handle, taskRoot, {dir: "quality/evidence", slug: "c12-p2-worker-result", ext: "json", bytes: readFileSync(workerResultPath)})).ref;
      } catch (error) { persisted.result_error = `${error.code ?? error.name}: ${error.message}`; }
      const note = await failureRef("E_COLLECTION_FAILED", "owned browser collection failed; a stale or foreign result is never accepted.", {attempt_id: attemptId, worker_problems: workerProblems, worker_exit: worker.status, worker_signal: worker.signal, worker_originals: persisted});
      throw fail("E_COLLECTION_FAILED", "owned browser collection failed", {exitCode: 6, worker_exit: worker.status, worker_problems: workerProblems, failure_ref: note.ref, failure_note_error: note.error});
    }
    const result = workerResult.value;

    // Build the 30-cell coverage from the worker facts. A collector failure or a
    // viewport mismatch is kept as an attempt original and recorded as 未测; it
    // is never counted as an acquired dimension.
    const cellByKey = new Map(result.cells.map((cell) => [cellKey(cell.state, cell.viewport), cell]));
    const coverageCells = [];
    const dimensionStatus = [];
    const appendAttemptOriginal = async (cell, dimension, reason, rawRef, viewportCheck) => {
      const doc = {
        engine,
        observed_at: new Date().toISOString(),
        object: objectForCell({workspace: WORKTREE, serviceUrl, engine, session, aggregate, route: ROUTE}, cell, viewportCheck?.observed ?? null),
        items: [],
        failures: [{class: "TOOL_ERROR", detail: String(reason).slice(0, 2000)}],
        collector_status: "failed",
        raw_ref: rawRef,
        viewport_check: viewportCheck ?? null,
        attempt: {attempt_id: attemptId, state: cell.state, viewport: cell.viewport, dimension},
      };
      const appended = await appendJson(handle, taskRoot, `c12-p2-untested-${cell.state}-${cell.viewport}-${dimension}`, doc);
      return appended.ref;
    };
    for (const stateName of STATES) {
      for (const viewport of VIEWPORTS) {
        const cell = {state: stateName, viewport, route: ROUTE};
        const observed = cellByKey.get(cellKey(stateName, viewport));
        const viewportCheck = observed?.viewport_check ?? {target: viewport, observed: null, matches: false, reason: "worker 未提供实测视口"};
        const markerError = observed?.state_observation?.marker_read_error ?? null;
        const observation = observeState(stateName, observed?.state_observation?.observed ?? null, observed?.state_observation?.aria_busy ?? null, markerError);
        const urlObservation = stateObservation(stateName, observed?.url ?? `${serviceUrl}${TARGET_PATH}`);
        const dimensions = {};
        const statuses = {};
        for (const dimension of DIMENSIONS) {
          const ref = rawName(base, stateName, viewport, dimension);
          let problems = [];
          try {
            validateRawDocument(taskRoot, ref, cell);
          } catch (error) {
            problems = [error.message];
          }
          const reported = observed?.dimensions?.[dimension];
          const acquired = !problems.length && reported?.status === "已取得" && viewportCheck.matches === true;
          if (acquired) {
            dimensions[dimension] = ref;
            statuses[dimension] = {status: "已取得", raw_ref: ref, items: reported.items ?? null, failures: reported.failures ?? null};
          } else {
            const reasonParts = [];
            if (!viewportCheck.matches) reasonParts.push(`实测视口 ${JSON.stringify(viewportCheck.observed)} 与目标 ${viewport} 不一致`);
            if (problems.length) reasonParts.push(`采集器报告成功但原件不符合合同：${problems.join("; ")}`);
            if (reported?.reason) reasonParts.push(reported.reason);
            if (!reasonParts.length) reasonParts.push(`采集器未取得 ${stateName} ${viewport} ${dimension}`);
            const reason = reasonParts.join("；");
            const attemptRef = await appendAttemptOriginal(cell, dimension, reason, ref, viewportCheck);
            dimensions[dimension] = attemptRef;
            statuses[dimension] = {status: "未测", reason, attempt_ref: attemptRef, raw_ref: ref};
          }
          dimensionStatus.push({state: stateName, viewport, dimension, ...statuses[dimension]});
        }
        coverageCells.push({
          route: ROUTE,
          state: stateName,
          viewport,
          controls: observed?.controls ?? [],
          state_observation: observation,
          url_state_observation: {...urlObservation, note: "只比较网址有无 state 参数；网关只接受裸入口，故固定 unknown。本格不把它当状态观察结果。"},
          viewport_check: viewportCheck,
          event_reads: observed?.event_reads ?? null,
          interaction_ms: observed?.interaction_ms ?? null,
          dimensions,
          dimension_status: statuses,
          window_id: observed?.window_id ?? null,
          observed_at: observed?.observed_at ?? new Date().toISOString(),
          notes: observed?.notes ?? [],
        });
      }
    }
    const pendingRecords = result.pending ?? [];
    const pendingCoverage = VIEWPORTS.map((viewport) => {
      const row = pendingRecords.find((entry) => entry.viewport === viewport);
      const observedPending = row?.observed === true && row?.observation?.observed === "pending";
      const reason = observedPending
        ? `本轮真实观察到 pending（data-state=pending、aria-busy=${row.observation?.aria_busy ?? "unknown"}），约 ${row.left_pending_after_ms ?? "?"}ms 后离开到 ${row.left_to_state ?? "unknown"}；瞬时态无法稳定取得五维，故仍记未测。`
        : (row?.first_read_observed
          ? `本轮未观察到 pending（点击后首读为 ${row.first_read_observed}）；按 150ms 瞬时态记未测。`
          : "本轮未取得 pending 读数（采集器未返回 marker）；按 150ms 瞬时态记未测。");
      return {
        viewport,
        status: "未测",
        reason: PENDING_REASON,
        timer_ms: 150,
        observed: observedPending,
        observation: row?.observation ?? null,
        aria_busy: row?.observation?.aria_busy ?? null,
        left_pending_after_ms: row?.left_pending_after_ms ?? null,
        left_to_state: row?.left_to_state ?? null,
        observation_reason: reason,
        evidence_note: row?.evidence_note ?? "worker 未提供该视口的 pending 交互读数",
      };
    });
    const screenshots = screenshotTargets.map((target) => {
      const reported = Array.isArray(result.screenshots) ? result.screenshots.find((shot) => shot?.viewport === target.viewport) : null;
      if (!reported || reported.available !== true || !existsSync(target.abs)) {
        return {
          available: false,
          viewport: target.viewport,
          ref: target.ref,
          reason: reported?.reason ?? "worker 未产出截图",
          owner: "采集环境 owner",
          recovery: "网关 ego/agent-browser 会话可用时重跑 collect",
        };
      }
      const bytes = readFileSync(target.abs);
      return {
        available: true,
        viewport: target.viewport,
        ref: target.ref,
        bytes: bytes.length,
        sha256: sha256(bytes),
        url: reported.url ?? null,
        dpr: reported.dpr ?? null,
        viewport_observed: reported.viewport_observed ?? null,
        taken_at: reported.taken_at ?? null,
      };
    });
    const coverage = {
      schema: "c12-v15-coverage/1",
      object: "v15",
      run_id: runId,
      produced_at: new Date().toISOString(),
      evidence_base: base,
      engine,
      engine_session: session,
      identity: {ref: state.identity_ref, aggregate},
      checks_ref: evidenceName(base, "checks"),
      matrix: {states: STATES, viewports: VIEWPORTS, cell_count: coverageCells.length, dimension_count: dimensionStatus.length},
      cells: coverageCells,
      dimension_status: dimensionStatus,
      pending: {
        status: "未测",
        reason: PENDING_REASON,
        locked_reason_note: "冻结测试锁定该 reason 字符串；本轮实读见每记录 observation_reason，二者不矛盾：真正未测的是五维稳定取样，不是 pending 标记的可见性。",
        observed_reason: PENDING_OBSERVED_REASON,
        not_observed_reason: PENDING_NOT_OBSERVED_REASON,
        timer_ms: 150,
        records: pendingCoverage,
      },
      coverage_limits: [
        "console/network 取自每个视口一次的裸入口导航窗口与随后的页内交互；事件读取失败写 failures 并记未测，只有成功返回的零事件才写 observed_zero。",
        "状态只从 #demo-result[data-state] 与 #demo-confirm-panel[aria-busy] 读出；url_state_observation 仅供参考，不充覆盖件结果。",
        "pending 是 150ms 瞬时态，不进入 30 格；三视口各留一条实读记录与锁定未测原因。",
        "对象身份用目标 viewport 供冻结判据比对；每格另记 viewport_check 实测 innerWidth×innerHeight，不一致时该格记未测。",
        "overflow 只读根元素 html 的 scrollWidth/clientWidth，不覆盖后代或内部滚动容器。",
        "a11y 只读可访问树 role/name/focusable 与 3 次 Tab；未做对比度、200% 缩放与物理读屏。物理读屏 not_checked，owner=用户，恢复条件=真人读屏环境。",
        "perf 只保留 ttfb、DCL、load 的单次导航采样、longtask 与一次交互时长；无 LCP/CLS/INP，无阈值，median 保持 unknown。",
        "C11 旧字节四维结论不是当前复验；本件也不证明两页、更新、业务链或发布。",
        "一个维度的失败原件只作为 attempt_ref 保留，绝不计为已取得；本件状态以 dimension_status 为准。",
      ],
      screenshots,
    };

    const interaction = {
      schema: "c12-v15-interaction/1",
      object: "v15",
      run_id: runId,
      produced_at: new Date().toISOString(),
      evidence_base: base,
      engine,
      engine_session: session,
      object_version: aggregate,
      control_path: "单选 input[name=local-sample] → #demo-use-sample → #demo-scenario → #demo-confirm；success 后再点 #demo-confirm 得 duplicate；#demo-recover 得 recovered；#demo-reset 得 unselected",
      facts: result.facts ?? {},
      pending: coverage.pending.records,
      pending_all: pendingRecords,
      keyboard: result.keyboard ?? [],
      reduced_motion: result.reducedMotion ?? null,
      design_facts: result.designFacts ?? [],
      screenshots,
      errors: result.errors ?? [],
      summary: {
        pending_records: coverage.pending.records.length,
        pending_observed: coverage.pending.records.filter((record) => record.observed).length,
        timer_ms: 150,
        stable_states: STATES.length,
        viewports: VIEWPORTS.length,
      },
      coverage_limits: [
        "pending 只作交互观察，不作稳定格五维；每条记录含实读标记、离开毫秒数与去向状态。",
        "键盘只做 3 次 Tab 的活动元素读数；不是完整键盘路径或焦点陷阱验证。",
        "reduced-motion 只记录当前系统偏好读数；不是页面动效全量验证。",
        "物理读屏 not_checked，owner=用户，恢复条件=真人读屏环境；200% 缩放未测；对比度未取得。",
      ],
    };
    const navigationWindowSelfCheck = (() => {
      const empty = navigationWindowEvidence([]);
      const actual = coverageCells.find((cell) => cell.event_reads?.navigation_window)?.event_reads.navigation_window ?? null;
      return {
        empty_confirmed: empty.confirmed,
        empty_reason: empty.reason,
        actual_confirmed: actual?.confirmed === true,
        actual,
        ok: empty.confirmed === false && text(empty.reason) && actual?.confirmed === true,
      };
    })();
    const observationRuleSelfCheck = (() => {
      const match = observeState("ready", "ready", "false");
      const mismatch = observeState("ready", "error", "false");
      const unknownMissingBusy = observeState("ready", "ready", null);
      const unknownMissingState = observeState("ready", null, "false");
      const unknownIllegalState = observeState("ready", "illegal-state", "false");
      return {
        match: match.result,
        mismatch: mismatch.result,
        mismatch_reason: mismatch.reason,
        unknown_missing_busy: unknownMissingBusy.result,
        unknown_missing_busy_reason: unknownMissingBusy.reason,
        unknown_missing_state: unknownMissingState.result,
        unknown_missing_state_reason: unknownMissingState.reason,
        unknown_illegal_state: unknownIllegalState.result,
        unknown_illegal_state_reason: unknownIllegalState.reason,
        ok: match.result === "match" && mismatch.result === "mismatch" && unknownMissingBusy.result === "unknown" && unknownMissingState.result === "unknown" && unknownIllegalState.result === "unknown" && text(mismatch.reason) && text(unknownMissingBusy.reason) && text(unknownMissingState.reason) && text(unknownIllegalState.reason),
      };
    })();
    const checks = {
      schema: "c12-v15-checks/1",
      object: "v15",
      run_id: runId,
      produced_at: new Date().toISOString(),
      evidence_base: base,
      attempt_id: attemptId,
      engine,
      engine_session: session,
      gateway,
      service_owner: serviceOwner,
      identity: {aggregate, rows: rows.length, served: servedRows, recorded_ref: state.identity_ref, recorded_matches: identityDoc.value?.aggregate === aggregate},
      identity_command: state.identity_command ?? null,
      syntax_receipts: syntaxRefs,
      worker: {exit: worker.status, signal: worker.signal, log: workerLog, result_ref: workerResultPath, attempt_id: attemptId},
      dimension_totals: {
        acquired: dimensionStatus.filter((row) => row.status === "已取得").length,
        untested: dimensionStatus.filter((row) => row.status !== "已取得").length,
      },
      state_observation_totals: {
        match: coverageCells.filter((cell) => cell.state_observation.result === "match").length,
        mismatch: coverageCells.filter((cell) => cell.state_observation.result === "mismatch").length,
        unknown: coverageCells.filter((cell) => cell.state_observation.result === "unknown").length,
      },
      viewport_checks: coverageCells.map((cell) => ({state: cell.state, viewport: cell.viewport, ...cell.viewport_check})),
      event_reads: coverageCells.map((cell) => ({state: cell.state, viewport: cell.viewport, ...cell.event_reads})),
      failure_path_self_check: result.checks?.failure_path ?? {ok: false, reason: "worker 未返回失败路径自检"},
      observation_rule_self_check: observationRuleSelfCheck,
      navigation_window_self_check: navigationWindowSelfCheck,
    };
    const designSource = state.design_source_matches === true ? designIdentity() : {unavailable: true, reason: "prepare reported design source drift"};
    const negativeSearch = designNegativeSearch(designSource);
    const interfaceFields = [
      {field: "UI 适用性", source: "P2 六项#1；UI 准备记录 011:23-29 三来源", consumer: "Phase 4 报告"},
      {field: "UI 合同", source: "app.js:3-17 C11_STATES/transition + app.js:123-136 render；#demo-result[data-state] / #demo-confirm-panel[aria-busy] 的公开语义", consumer: "页面状态机、P2 覆盖件观测、Phase 4"},
      {field: "组件质量图", source: "P2 六项#5；本件「组件」行：原生控件、无沉淀", consumer: "Phase 4 报告"},
      {field: "真实消费者", source: "v15 readme C03/C06；C06-P1 的 call_site 与结果区/播报区", consumer: "页面结果区、播报区；Phase 4"},
      {field: "状态所有者", source: "app.js transition()/render()；C06-P1 行", consumer: "页面结果区、播报区"},
      {field: "类型化视图模型", source: "不适用：v15 是原生 JS，无 TS ViewModel；状态合同由 app.js transition 承接；两页 app/data/view-model.ts 属另一对象", consumer: "页面状态机；P2 观测"},
      {field: "样式令牌所有者", source: "v11/v12 两份 CSS 进七件身份；本系列 interaction.design_facts.tokens", consumer: "v15 页面；C04-P1"},
    ];
    const gaps = [
      {item: "物理读屏", status: "not_checked", owner: "用户", recovery: "真人读屏环境"},
      {item: "200% 缩放", status: "未测", owner: "独立读者/环境 owner", recovery: "真实 200% 缩放会话"},
      {item: "对比度", status: "未测", owner: "独立读者", recovery: "对比度测量或采集器"},
      {item: "LCP/CLS/INP", status: "未测", owner: "采集器 owner", recovery: "补齐指标采集器与阈值"},
      {item: "C11 旧字节四维", status: "未测", owner: "C11/P4", recovery: "逐条对当前七件复核"},
      {item: "T019 原文", status: "unavailable", owner: "用户/C09 原 owner", recovery: "提供 T019 原文或可读副本 + sha256"},
    ];
    const mapping = planOffsetMap({base, taskRoot, runId, testsGreen: greenReceipts(taskRoot)});
    const mappingRef = await publish(handle, taskRoot, evidenceName(base, "mapping"), mapping);
    const capability = capabilityDocument({
      coverage,
      interaction: {...interaction, ref: evidenceName(base, "interaction")},
      checks,
      designRef: evidenceName(base, "design"),
      mappingRef: mappingRef.ref,
      screenshotsRef: evidenceName(base, "result"),
      checksRef: evidenceName(base, "checks"),
      syntaxRefs,
      identityCommandRef: state.identity_command ? {ref: state.identity_command.receipt_ref ?? state.identity_command.output_ref ?? null, exit_code: state.identity_command.exit_code ?? null} : null,
      servedRows,
      identityFiles: rows,
    });
    const designDocs = result.designFacts ?? [];
    const designMarkdown = designComparisonMarkdown({
      coverage,
      designFacts: designDocs,
      designSource,
      interaction: {...interaction, ref: interaction ? evidenceName(base, "interaction") : null},
      screenshots,
      negativeSearch,
      interfaceFields,
      mappingRef: mappingRef.ref,
      checksRef: evidenceName(base, "checks"),
    });

    // Interaction and capability originals first; coverage stays last so the
    // frozen judge never reads a cell that points at a missing raw document.
    const interactionRef = await publish(handle, taskRoot, evidenceName(base, "interaction"), interaction);
    const capabilityRef = await publish(handle, taskRoot, evidenceName(base, "capability"), capability);
    const designRef = await publish(handle, taskRoot, evidenceName(base, "design"), designMarkdown);
    await publish(handle, taskRoot, evidenceName(base, "checks"), checks);

    const stop = await stopOnce();
    const serviceDoc = {
      schema: "c12-v15-service/1",
      object: "v15",
      run_id: runId,
      service_root: SERVICE_ROOT,
      service_root_path: state.service_root_path,
      port: state.port,
      base_url: state.base_url,
      entry_url: state.entry_url,
      argv: [process.execPath, "-e", "<embedded read-only static server>"],
      pid: state.pid,
      process_identity: state.process_identity ?? null,
      prepared_at: state.prepared_at ?? null,
      service_started_at: state.service_started_at ?? null,
      service_log: state.service_log,
      ready: state.ready,
      engine,
      engine_session: session,
      gateway,
      stop,
      notes: [
        "The static service only serves docs/examples/c11-ui and never writes the served tree.",
        "The listener was proved to be this run's recorded process before collection.",
        "The service is stopped after the receipt is produced; port 41922 is released.",
        "Phase 4 must start its own service and must not reuse this process.",
      ],
    };
    const serviceRef = await publish(handle, taskRoot, evidenceName(base, "service"), serviceDoc);

    const acquired = dimensionStatus.filter((row) => row.status === "已取得").length;
    const allCells = coverageCells.length === STATES.length * VIEWPORTS.length && coverageCells.every((cell) => VIEWPORTS.includes(cell.viewport) && STATES.includes(cell.state));
    const viewportOk = coverageCells.every((cell) => cell.viewport_check?.matches === true);
    const complete = allCells && acquired === STATES.length * VIEWPORTS.length * DIMENSIONS.length && viewportOk && stop.stopped !== false;
    const resultDoc = {
      schema: "c12-v15-result/1",
      object: "v15",
      run_id: runId,
      ok: complete,
      produced_at: new Date().toISOString(),
      evidence_base: base,
      identity: {ref: state.identity_ref, aggregate, files: rows.length, served: servedRows.length},
      boundary: {ref: state.boundary_ref},
      service: {ref: serviceRef.ref, port: state.port, stopped: stop.stopped, port_closed: stop.port_closed},
      capability: {ref: capabilityRef.ref, rows: capability.rows.length, available: capability.summary.available, partial: capability.summary.partial, untested: capability.summary.untested},
      coverage: {ref: evidenceName(base, "coverage"), cells: coverageCells.length, dimensions: dimensionStatus.length, acquired, untested: dimensionStatus.length - acquired, viewport_checks: coverageCells.map((cell) => ({state: cell.state, viewport: cell.viewport, ...cell.viewport_check}))},
      interaction: {ref: interactionRef.ref, pending_records: coverage.pending.records.length, pending_observed: coverage.pending.records.filter((record) => record.observed).length, pending_reason: PENDING_REASON},
      design: {ref: designRef.ref, five_categories: 5, independent_review_pending: true, design_source_matches: designSource.matches === true, screenshots: screenshots.map((shot) => ({viewport: shot.viewport, available: shot.available, ref: shot.ref, sha256: shot.sha256 ?? null}))},
      checks: {ref: evidenceName(base, "checks"), syntax_receipts: syntaxRefs, state_observation: checks.state_observation_totals, failure_path_self_check: checks.failure_path_self_check, observation_rule_self_check: checks.observation_rule_self_check, navigation_window_self_check: checks.navigation_window_self_check},
      screenshots,
      interface_fields: interfaceFields,
      plan_offset_mapping: {ref: mappingRef.ref, planned: mapping.planned, actual: mapping.actual, prior_series: mapping.prior_series, p1_same_numbers: mapping.p1_same_numbers},
      pending: {status: "未测", reason: PENDING_REASON, observed_reason: PENDING_OBSERVED_REASON, records: coverage.pending.records.map((record) => ({viewport: record.viewport, status: record.status, reason: record.reason, observed: record.observed, aria_busy: record.aria_busy, left_pending_after_ms: record.left_pending_after_ms, left_to_state: record.left_to_state, observation_reason: record.observation_reason}))},
      gaps,
      commands: {
        prepare: {argv: ["node", "tests/acceptance/c12-v15.mjs", "prepare", `--run-id=${runId}`, `--service-root=${SERVICE_ROOT}`, `--port=${state.port}`, `--task-record-root=${taskRoot}`], cwd: WORKTREE, exit_code: 0},
        collect: {argv: ["node", "tests/acceptance/c12-v15.mjs", "collect", `--run-id=${runId}`, `--service-url=${state.base_url}`, `--task-record-root=${taskRoot}`], cwd: WORKTREE, exit_code: complete ? 0 : 6, gateway_entry: "env BROWSER_QA_ENGINE=auto BROWSER_QA_AUTH_MODE=none BROWSER_QA_TASK_ID=<openTask.identity.taskId> bash skills/isolated-browser-qa/scripts/browser-qa-context.sh --run --url 'http://127.0.0.1:41922/v15/2026-11-11-002-t019-v15-pending-busy-index.html' -- node tests/acceptance/c12-v15.mjs collect ..."},
        stop: {argv: ["node", "tests/acceptance/c12-v15.mjs", "stop", `--run-id=${runId}`, `--task-record-root=${taskRoot}`], cwd: WORKTREE, purpose: "网关在启动 collect 前失败时按所有权停掉本 run 的服务"},
      },
      open_items: [
        "pending 三视口只作交互观察，不进入稳定格；本轮实读与锁定未测原因分列。",
        "物理读屏 not_checked，owner=用户；200% 缩放未测；对比度未取得。",
        "LCP/CLS/INP 未测且无阈值；perf 只有单次导航采样、longtask 与一次交互时长。",
        "八维独立设计审查未在本件内完成；本件只给对照输入。",
        "C11 旧字节四维结论不是当前复验，单列未测。",
        "网关若在启动 collect 前失败，用 commands.stop 释放 41922。",
      ],
      reuse_note: "This original is the P2 producer index, not an acceptance verdict.",
    };
    await publish(handle, taskRoot, evidenceName(base, "result"), resultDoc);
    // Coverage is the frozen judge's last dependency.
    await publish(handle, taskRoot, evidenceName(base, "coverage"), coverage);

    process.stdout.write(`${JSON.stringify({
      ok: complete,
      step: "collect",
      run_id: runId,
      evidence_base: base,
      artifacts: Object.fromEntries(Object.keys(LAYOUT).map((key) => [key, evidenceName(base, key)])),
      cells: coverageCells.length,
      dimensions: dimensionStatus.length,
      acquired,
      untested: dimensionStatus.length - acquired,
      state_observation: checks.state_observation_totals,
      pending_records: coverage.pending.records.length,
      pending_observed: coverage.pending.records.filter((record) => record.observed).length,
      screenshots: screenshots.map((shot) => ({viewport: shot.viewport, available: shot.available, ref: shot.ref})),
      failure_path_self_check: checks.failure_path_self_check,
      service: {stopped: stop.stopped, port_closed: stop.port_closed},
      engine,
      session,
      attempt_id: attemptId,
    })}\n`);
    return complete ? 0 : 6;
  } catch (error) {
    try {
      const stop = await stopOnce();
      const note = await failureRef(error.code ?? "E_UNEXPECTED", error.message, {stop, attempt_id: attemptId});
      error.cleanup = {ref: note.ref, note_error: note.error, stop};
    } catch (cleanupError) {
      error.cleanup = {ref: null, error: String(cleanupError.message).slice(0, 1000)};
    }
    throw error;
  } finally {
    if (!stopFacts) {
      try { await stopOnce(); } catch { /* the catch path already recorded the first error */ }
    }
  }
}

// ---------------------------------------------------------------------------
// owned engine worker
// ---------------------------------------------------------------------------

function objectForCell(input, cell, observedViewport) {
  return {
    workspace: input.workspace,
    service: input.serviceUrl,
    route: input.route,
    state: cell.state,
    viewport: cell.viewport,
    engine: input.engine,
    engine_session: input.session,
    object_version: input.aggregate,
    viewport_observed: observedViewport ?? null,
  };
}
function attemptDocument(input, cell, dimension, detail) {
  return {
    engine: input.engine,
    observed_at: new Date().toISOString(),
    object: objectForCell(input, cell, null),
    items: [],
    failures: [{class: "TOOL_ERROR", detail: String(detail).slice(0, 2000)}],
    collector_status: "failed",
    attempt: {attempt_id: input.attemptId, state: cell.state, viewport: cell.viewport, dimension},
  };
}
function cellForInput(input, state, viewport) {
  return {state, viewport, route: input.route};
}
// The no-throw failure fill used by the viewport catch and by the self-check.
// It deliberately references only its arguments, so a mid-viewport failure can
// always publish structured 未测 cells without a ReferenceError.
function fillMissingCells(output, input, viewport, error) {
  const code = error?.code ?? error?.name ?? "Error";
  const message = String(error?.message ?? "unknown failure").slice(0, 1000);
  for (const stateName of input.states) {
    if (output.cells.some((cell) => cell.state === stateName && cell.viewport === viewport)) continue;
    const cell = cellForInput(input, stateName, viewport);
    const dimensions = {};
    for (const dimension of input.dimensions) {
      dimensions[dimension] = {status: "未测", reason: `${code}: ${message}`, items: 0, failures: 1, attempt_ref: null, raw_ref: null};
    }
    output.cells.push({
      state: stateName,
      viewport,
      url: input.entryUrl,
      controls: [],
      state_observation: {observed: null, aria_busy: null, marker_read_error: `viewport collection failed before marker read: ${code}: ${message}`},
      viewport_check: {target: viewport, observed: null, matches: false, reason: "viewport collection failed before measurement"},
      event_reads: {console: "未读（视口失败）", network: "未读（视口失败）"},
      interaction_ms: null,
      dimensions,
      window_id: null,
      observed_at: new Date().toISOString(),
      notes: [`viewport collection failed: ${code}`],
    });
  }
}
function failurePathSelfCheck(input) {
  try {
    const probe = {cells: [], errors: []};
    fillMissingCells(probe, input, "self-check", Object.assign(new Error("synthetic mid-viewport failure"), {code: "E_SELF_CHECK"}));
    const cells = probe.cells;
    const allUntested = cells.every((cell) => input.dimensions.every((dimension) => cell.dimensions[dimension]?.status === "未测" && text(cell.dimensions[dimension]?.reason)));
    const hasMarkerReason = cells.every((cell) => text(cell.state_observation?.marker_read_error));
    return {ok: cells.length === input.states.length && allUntested && hasMarkerReason, cells: cells.length, all_untested: allUntested, has_marker_reason: hasMarkerReason, sample: cells[0] ? {state: cells[0].state, dimension: cells[0].dimensions[input.dimensions[0]]} : null};
  } catch (error) {
    return {ok: false, code: error.code ?? error.name, message: String(error.message).slice(0, 500)};
  }
}

// agent-browser branch: consume the gateway-owned session's own CDP endpoint.
// This is not a second engine selection and never falls back to another engine.
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
    try { return new URL(item.url).pathname === TARGET_PATH; } catch { return false; }
  }) ?? targets[0];
  const attached = await cdp.call("Target.attachToTarget", {targetId: target.targetId, flatten: true});
  if (!attached?.sessionId) {
    cdp.close();
    throw Object.assign(new Error("agent-browser target attachment missing session"), {code: "E_AGENT_BROWSER_TARGET"});
  }
  const sessionId = attached.sessionId;
  const events = [];
  cdp.onEvent((event) => { if (!event.sessionId || event.sessionId === sessionId) events.push(event); });
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
      const captured = await call("Page.captureScreenshot", {format: "png"});
      if (typeof captured?.data !== "string" || !captured.data) throw Object.assign(new Error("agent-browser screenshot returned no data"), {code: "E_AGENT_BROWSER_SCREENSHOT"});
      writeFileSync(path, Buffer.from(captured.data, "base64"), {flag: "wx"});
      return path;
    },
    events: () => events.splice(0),
    keyboard: {press: (key) => (async () => {
      const code = key === "Tab" ? 9 : undefined;
      await call("Input.dispatchKeyEvent", {type: "keyDown", key, code: key, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code});
      await call("Input.dispatchKeyEvent", {type: "keyUp", key, code: key, windowsVirtualKeyCode: code, nativeVirtualKeyCode: code});
    })()},
  };
  return {page, close: () => cdp.close()};
}

const READ_MARKERS_JS = `(() => {
  const result = document.querySelector('#demo-result');
  const panel = document.querySelector('#demo-confirm-panel');
  const active = document.activeElement;
  return {
    observed: result ? result.getAttribute('data-state') : null,
    aria_busy: panel ? panel.getAttribute('aria-busy') : null,
    result_text: result ? result.textContent.trim() : null,
    announcement: (document.querySelector('#sample-announcement') || {}).textContent ?? null,
    identity_text: (document.querySelector('#demo-result-identity') || {}).textContent ?? null,
    active: active ? {tag: active.tagName, id: active.id, text: (active.textContent || '').trim().slice(0, 80)} : null,
    url: location.href,
  };
})()`;

const DESIGN_FACTS_JS = `(() => {
  const rect = (element) => {
    const box = element ? element.getBoundingClientRect() : null;
    return box ? {x: +box.x.toFixed(1), y: +box.y.toFixed(1), width: +box.width.toFixed(1), height: +box.height.toFixed(1)} : null;
  };
  const root = getComputedStyle(document.documentElement);
  const section = (element) => ({
    id: element.id,
    title: element.querySelector('h2') ? element.querySelector('h2').textContent.trim() : null,
    intro: element.querySelector('.section-intro') ? element.querySelector('.section-intro').textContent.trim() : null,
  });
  return {
    url: location.href,
    viewport: {width: innerWidth, height: innerHeight, dpr: devicePixelRatio || 1},
    title: document.title,
    h1: document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : null,
    lede: document.querySelector('.lede') ? document.querySelector('.lede').textContent.trim() : null,
    nav: [...document.querySelectorAll('header nav a')].map((anchor) => ({text: anchor.textContent.trim(), href: anchor.getAttribute('href'), current: anchor.getAttribute('aria-current')})),
    skip_link: document.querySelector('.skip-link') ? document.querySelector('.skip-link').getAttribute('href') : null,
    sections: [...document.querySelectorAll('main > section')].map(section),
    candidates: [...document.querySelectorAll('input[name="local-sample"]')].map((input) => ({id: input.value, checked: input.checked})),
    controls: {
      buttons: document.querySelectorAll('button').length,
      radios: document.querySelectorAll('input[name="local-sample"]').length,
      select: document.querySelectorAll('select').length,
      details: document.querySelectorAll('details').length,
      links: document.querySelectorAll('a').length,
    },
    layout: {header: rect(document.querySelector('header')), main: rect(document.querySelector('main')), footer: rect(document.querySelector('footer'))},
    tokens: {
      body_background: getComputedStyle(document.body).backgroundColor,
      body_font: getComputedStyle(document.body).fontFamily,
      accent_blue: root.getPropertyValue('--accent-blue').trim(),
      text: root.getPropertyValue('--text').trim(),
      border_subtle: root.getPropertyValue('--border-subtle').trim(),
    },
    root_scroll: {scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, overflow_x: document.documentElement.scrollWidth > document.documentElement.clientWidth},
  };
})()`;

async function readEvents(page) {
  try {
    const events = await page.events();
    if (!Array.isArray(events)) throw new Error("page.events() did not return an array");
    return {ok: true, events, error: null};
  } catch (error) {
    return {ok: false, events: [], error: `${error.code ?? error.name}: ${error.message}`};
  }
}
async function readMarkersSafe(page) {
  try {
    const markers = await page.evaluate(READ_MARKERS_JS);
    if (!markers || typeof markers !== "object") throw new Error("marker read did not return an object");
    return {ok: true, markers, error: null};
  } catch (error) {
    return {ok: false, markers: null, error: `${error.code ?? error.name}: ${error.message}`};
  }
}
// A successful empty event array is only a real zero observation when the
// initial navigation window and its main-document events are confirmed. A
// missing window keeps a failure original and marks the dimension 未测.
function navigationWindowEvidence(events) {
  const frame = events.find((event) => event.method === "Page.frameNavigated" && !event.params?.frame?.parentId)?.params?.frame ?? null;
  const load = events.find((event) => event.method === "Page.loadEventFired");
  const documentRequest = events.find((event) => event.method === "Network.requestWillBeSent" && event.params?.type === "Document");
  let urlMatches = null;
  try { urlMatches = frame?.url ? new URL(frame.url).pathname === TARGET_PATH : null; } catch { urlMatches = false; }
  const confirmed = Boolean(frame && load && urlMatches !== false);
  return {
    confirmed,
    frame_id: frame?.id ?? null,
    loader_id: frame?.loaderId ?? null,
    url: frame?.url ?? null,
    url_matches: urlMatches,
    load_event: Boolean(load),
    document_request: Boolean(documentRequest),
    reason: confirmed ? null : "初始导航窗口缺少目标主文档 Page.frameNavigated 与 Page.loadEventFired；空事件不能当真实零观察",
  };
}

function normalizeWindow(events, cell, input, windowId, loaderId, previousContexts) {
  const contexts = new Map(previousContexts ?? []);
  const frame = events.find((event) => event.method === "Page.frameNavigated" && !event.params?.frame?.parentId)?.params?.frame ?? null;
  const activeLoader = frame?.loaderId ?? loaderId ?? null;
  const activeFrame = frame?.id ?? null;
  const consoleDoc = {engine: input.engine, observed_at: new Date().toISOString(), object: objectForCell(input, cell, cell.viewport), items: [], failures: []};
  const networkDoc = {engine: input.engine, observed_at: new Date().toISOString(), object: objectForCell(input, cell, cell.viewport), items: [], failures: []};
  let committed = false;
  for (const event of events) {
    const params = event.params ?? {};
    if (event.method === "Page.frameNavigated" && params.frame && params.frame.loaderId === activeLoader) committed = true;
    if (event.method === "Runtime.executionContextCreated" && params.context) {
      const contextFrame = params.context.auxData?.frameId;
      if (!activeFrame || contextFrame === activeFrame) contexts.set(params.context.id, activeLoader);
    }
    if (event.method === "Network.requestWillBeSent" || event.method === "Network.responseReceived" || event.method === "Network.loadingFailed") {
      if (activeLoader && params.loaderId && params.loaderId !== activeLoader) continue;
      networkDoc.items.push(normalizeConsoleEvent(event, {window_id: windowId, loader_id: activeLoader}));
    }
    if (event.method === "Runtime.consoleAPICalled" || event.method === "Runtime.exceptionThrown") {
      const owner = contexts.get(params.executionContextId ?? params.exceptionDetails?.executionContextId);
      if (activeLoader && owner && owner !== activeLoader) continue;
      consoleDoc.items.push(normalizeConsoleEvent(event, {window_id: windowId, loader_id: owner ?? activeLoader}));
    }
  }
  const loadEvent = events.find((event) => event.method === "Page.loadEventFired");
  if (loadEvent) consoleDoc.items.push(normalizeConsoleEvent(loadEvent, {window_id: windowId, loader_id: activeLoader}));
  return {console: consoleDoc, network: networkDoc, loaderId: activeLoader, frameId: activeFrame, contexts};
}
let normalizeConsoleEvent = () => ({});
function normalizePerfFacts(normalizePerf, navigation, longTasks, measures) {
  const nav = {ttfb: [], domContentLoadedEventEnd: [], loadEventEnd: []};
  if (navigation) {
    if (Number.isFinite(navigation.ttfb) && navigation.ttfb >= 0) nav.ttfb.push(navigation.ttfb);
    if (Number.isFinite(navigation.domContentLoadedEventEnd) && navigation.domContentLoadedEventEnd >= 0) nav.domContentLoadedEventEnd.push(navigation.domContentLoadedEventEnd);
    if (Number.isFinite(navigation.loadEventEnd) && navigation.loadEventEnd >= 0) nav.loadEventEnd.push(navigation.loadEventEnd);
  }
  return normalizePerf({nav, longTasks, measures});
}

export async function runV15Worker(input) {
  if (!text(input.session)) throw Object.assign(new Error("gateway session is absent; worker refuses placeholder identity"), {code: "E_SESSION"});
  const collectConsole = await import(pathToFileURL(join(input.workspace, "skills/frontend-testing/scripts/collect-console.mjs")).href);
  const {ownedEgoContext, writeAtomic, collect: collectConsoleEvent} = collectConsole;
  const {collect: normalizeOverflow} = await import(pathToFileURL(join(input.workspace, "skills/frontend-testing/scripts/collect-overflow.mjs")).href);
  const {collect: normalizeA11y} = await import(pathToFileURL(join(input.workspace, "skills/frontend-testing/scripts/collect-a11y.mjs")).href);
  const {collect: normalizePerf} = await import(pathToFileURL(join(input.workspace, "skills/frontend-testing/scripts/collect-perf.mjs")).href);
  const {runRegisteredScript} = await import(pathToFileURL(join(input.workspace, "skills/isolated-browser-qa/scripts/browser-qa-session.mjs")).href);
  normalizeConsoleEvent = collectConsoleEvent;

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
  const output = {
    ok: true,
    engine: input.engine,
    session: input.session,
    attempt_id: input.attemptId,
    cells: [],
    pending: [],
    keyboard: [],
    reducedMotion: null,
    designFacts: [],
    screenshots: [],
    facts: {},
    errors: [],
    checks: {},
  };
  const cellFor = (state, viewport) => ({state, viewport, route: input.route});
  const targetOf = (list, cell, dimension) => list.find((row) => row.state === cell.state && row.viewport === cell.viewport && row.dimension === dimension);
  const envFor = (cell) => ({
    ...process.env,
    BROWSER_QA_EGO_SPACE_ID: spaceId,
    BROWSER_QA_ENGINE: input.engine,
    PAGE_AUDIT_WORKSPACE: input.workspace,
    PAGE_AUDIT_SERVICE: input.serviceUrl,
    PAGE_AUDIT_ROUTE: input.auditRoute ?? `/${input.route}`,
    PAGE_AUDIT_STATE: cell.state,
    PAGE_AUDIT_OBJECT_VERSION: input.aggregate,
    PAGE_AUDIT_ENGINE_SESSION: input.session,
  });
  const click = async (selector) => {
    const value = await page.evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) return {ok: false, reason: 'missing'}; if (element.disabled) return {ok: false, reason: 'disabled'}; element.click(); return {ok: true}; })()`);
    if (!value?.ok) throw Object.assign(new Error(`control ${selector} unavailable: ${value?.reason ?? "unknown"}`), {code: "E_CONTROL"});
    return value;
  };
  const setScenario = async (value) => {
    const result = await page.evaluate(`(() => { const element = document.querySelector('#demo-scenario'); if (!element) return {ok: false, reason: 'missing'}; const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; setter.call(element, ${JSON.stringify(value)}); element.dispatchEvent(new Event('change', {bubbles: true})); return {ok: true, value: element.value}; })()`);
    if (!result?.ok) throw Object.assign(new Error(`scenario control unavailable: ${result?.reason ?? "unknown"}`), {code: "E_CONTROL"});
    return result;
  };
  const selectRadio = async () => {
    const value = await page.evaluate(`(() => { const element = document.querySelector('input[name="local-sample"]'); if (!element) return {ok: false, reason: 'missing'}; if (element.disabled) return {ok: false, reason: 'disabled'}; if (!element.checked) element.click(); else element.dispatchEvent(new Event('change', {bubbles: true})); return {ok: true, checked: element.checked}; })()`);
    if (!value?.ok) throw Object.assign(new Error(`candidate radio unavailable: ${value?.reason ?? "unknown"}`), {code: "E_CONTROL"});
    return value;
  };
  // Waiting is only a settle condition: it never decides match/mismatch. The
  // actual markers are read afterwards and classified independently.
  const waitChange = async (expected, baseline, timeoutMs = 8_000) => {
    const started = Date.now();
    let markers = null;
    let error = null;
    while (Date.now() - started < timeoutMs) {
      const read = await readMarkersSafe(page);
      if (!read.ok) { error = read.error; await page.waitForTimeout(40); continue; }
      markers = read.markers;
      if (markers.observed && markers.observed !== "pending" && (markers.observed === expected || markers.observed !== baseline)) {
        return {ok: true, markers, elapsed: Date.now() - started, error};
      }
      await page.waitForTimeout(40);
    }
    return {ok: false, markers, elapsed: Date.now() - started, error};
  };
  const waitLeavesPending = async (timeoutMs = 10_000) => {
    const started = Date.now();
    let pending = null;
    let firstRead = null;
    let markers = null;
    let error = null;
    while (Date.now() - started < timeoutMs) {
      const read = await readMarkersSafe(page);
      if (!read.ok) { error = read.error; await page.waitForTimeout(20); continue; }
      markers = read.markers;
      if (firstRead === null) firstRead = markers.observed;
      if (markers.observed === "pending" && !pending) pending = {markers, at: Date.now() - started};
      if (markers.observed && markers.observed !== "pending") {
        return {ok: true, markers, pending, first_read_observed: firstRead, left_ms: Date.now() - started, error};
      }
      await page.waitForTimeout(20);
    }
    return {ok: false, markers, pending, first_read_observed: firstRead, left_ms: null, error};
  };

  try {
    for (const viewport of input.viewports) {
      const [width, height] = viewport.split("x").map(Number);
      try {
        await page.cdp("Emulation.setDeviceMetricsOverride", {width, height, deviceScaleFactor: 1, mobile: false});
        await readEvents(page);
        await page.cdp("Page.enable");
        await page.cdp("Runtime.enable");
        await page.cdp("Network.enable");
        await page.goto(input.entryUrl, {timeout: 30_000});
        await page.waitForSelector("body", {timeout: 15_000});
        await page.waitForTimeout(150);
        const windowId = randomUUID();
        let context = null;
        let viewportObserved = viewport;
        if (input.engine === "agent-browser") {
          const read = async () => (await runRegisteredScript(page, "design-source-read-v1", {elements: [{selector: "html", properties: [], facts: ["viewport", "scroll", "navigation"]}]}))[0];
          const first = await read();
          viewportObserved = `${first.facts.viewport.width}x${first.facts.viewport.height}`;
          context = {object: objectForCell(input, cellFor("unselected", viewport), viewportObserved), read, call: (method, params = {}) => page.cdp(method, params)};
        } else {
          context = await ownedEgoContext(page, {viewport, state: "unselected"}, envFor(cellFor("unselected", viewport)));
          viewportObserved = context.object.viewport.split("@")[0];
        }
        const designFacts = await page.evaluate(DESIGN_FACTS_JS);
        output.designFacts.push({...designFacts, viewport});
        output.facts = {candidates: designFacts.candidates ?? [], controls: designFacts.controls ?? {}, nav: designFacts.nav ?? [], sections: designFacts.sections ?? []};
        const viewportCheck = {target: viewport, observed: viewportObserved, matches: viewportObserved === viewport, reason: viewportObserved === viewport ? null : `实测 innerWidth×innerHeight=${viewportObserved}，目标=${viewport}`};
        // Current-run screenshot before any state drive: the static default
        // (unselected) view at this viewport.
        const shotTarget = (input.screenshots ?? []).find((shot) => shot.viewport === viewport);
        if (shotTarget) {
          try {
            await page.screenshot({path: shotTarget.abs});
            const bytes = readFileSync(shotTarget.abs);
            output.screenshots.push({available: true, viewport, ref: shotTarget.ref, bytes: bytes.length, sha256: sha256(bytes), url: await page.url(), dpr: designFacts.viewport?.dpr ?? null, viewport_observed: viewportObserved, taken_at: new Date().toISOString()});
          } catch (error) {
            output.screenshots.push({available: false, viewport, ref: shotTarget.ref, reason: `${error.code ?? error.name}: ${String(error.message).slice(0, 300)}`, owner: "采集环境 owner", recovery: "网关会话可用时重跑 collect"});
          }
        }
        await page.evaluate("(() => { window.__c12LongTasks = []; try { window.__c12LT = new PerformanceObserver((list) => window.__c12LongTasks.push(...list.getEntries().map((entry) => entry.duration))); window.__c12LT.observe({type: 'longtask', buffered: false}); } catch (error) { window.__c12LTERR = String(error); } return true; })()");
        const initialEvents = await readEvents(page);
        const windowEvidence = navigationWindowEvidence(initialEvents.ok ? initialEvents.events : []);
        const eventWindowError = !initialEvents.ok
          ? `page.events() read failed: ${initialEvents.error}`
          : !windowEvidence.confirmed
            ? `navigation window not confirmed: ${windowEvidence.reason}`
            : null;
        const window = normalizeWindow(initialEvents.ok ? initialEvents.events : [], cellFor("unselected", viewport), input, windowId, null, null);
        let contexts = window.contexts;
        let loaderId = window.loaderId;
        const activeWindowId = windowId;

        const writeCell = async (state, eventsRead, controls, pendingObservation, interactionMs) => {
          const cell = cellFor(state, viewport);
          const markerRead = await readMarkersSafe(page);
          const markers = markerRead.markers;
          const observation = {
            observed: markers?.observed ?? null,
            aria_busy: markers?.aria_busy ?? null,
            url: markers?.url ?? null,
            result_text: markers?.result_text ?? null,
            announcement: markers?.announcement ?? null,
            identity_text: markers?.identity_text ?? null,
            marker_read_error: markerRead.error,
          };
          const windowDoc = normalizeWindow(eventsRead.ok ? eventsRead.events : [], cell, input, activeWindowId, loaderId, contexts);
          contexts = windowDoc.contexts;
          if (windowDoc.loaderId) loaderId = windowDoc.loaderId;
          const marker = {observed: markers?.observed ?? null, aria_busy: markers?.aria_busy ?? null, at: new Date().toISOString()};
          const eventsConfirmed = eventsRead.ok && !eventWindowError;
          if (!eventsConfirmed) {
            const detail = eventWindowError ?? `page.events() read failed: ${eventsRead.error}`;
            windowDoc.console.failures.push({class: "TOOL_ERROR", detail});
            windowDoc.network.failures.push({class: "TOOL_ERROR", detail});
          }
          let observationFacts = null;
          let observationError = null;
          try {
            observationFacts = await context.read();
            if (!observationFacts?.facts) throw new Error("owned read returned no facts");
          } catch (error) {
            observationError = `${error.code ?? error.name}: ${error.message}`;
          }
          let longTasks = [];
          let longTaskError = null;
          try {
            const value = await page.evaluate("(() => { const value = window.__c12LongTasks || []; window.__c12LongTasks = []; return value; })()");
            if (!Array.isArray(value)) throw new Error("long-task read did not return an array");
            longTasks = value;
          } catch (error) {
            longTaskError = `${error.code ?? error.name}: ${error.message}`;
          }
          const navigation = observationFacts?.facts?.navigation ?? null;
          const navigationError = observationError ?? (navigation ? null : "navigation timing missing");
          let overflow = null;
          let overflowError = observationError;
          if (observationFacts?.facts?.scroll) {
            try { overflow = normalizeOverflow(observationFacts.facts.scroll); overflowError = null; } catch (error) { overflowError = `${error.code ?? error.name}: ${error.message}`; }
          } else if (!overflowError) {
            overflowError = "scroll observation missing";
          }
          let a11yItems = null;
          let a11yError = null;
          try {
            await context.call("Accessibility.enable");
            const tree = await context.call("Accessibility.getFullAXTree");
            a11yItems = normalizeA11y(tree);
          } catch (error) {
            a11yError = `${error.code ?? error.name}: ${error.message}`;
          }
          const perf = normalizePerfFacts(normalizePerf, navigation, longTasks, Number.isFinite(interactionMs) ? [{name: `enter-${state}`, duration: interactionMs}] : null);
          const documents = {
            console: windowDoc.console,
            network: windowDoc.network,
            overflow: {engine: input.engine, observed_at: new Date().toISOString(), object: objectForCell(input, cell, viewportObserved), items: overflow ? [overflow] : [], failures: overflowError ? [{class: "TOOL_ERROR", detail: overflowError}] : []},
            a11y: {engine: input.engine, observed_at: new Date().toISOString(), object: objectForCell(input, cell, viewportObserved), items: Array.isArray(a11yItems) ? a11yItems : [], failures: a11yError ? [{class: "TOOL_ERROR", detail: a11yError}] : []},
            perf: {engine: input.engine, observed_at: new Date().toISOString(), object: objectForCell(input, cell, viewportObserved), items: navigation ? [{state, viewport, perf, navigation_scope: "document navigation timing; state is in-page", nav_runs: perf?.nav?.ttfb?.runs?.length ?? 0, interaction_ms: Number.isFinite(interactionMs) ? interactionMs : null}] : [], failures: [...(navigationError ? [{class: "TOOL_ERROR", detail: navigationError}] : []), ...(longTaskError ? [{class: "TOOL_ERROR", detail: longTaskError}] : [])]},
          };
          for (const dimension of ["console", "network"]) {
            documents[dimension].marker = marker;
            documents[dimension].window_id = activeWindowId;
            documents[dimension].observed_zero = eventsConfirmed && documents[dimension].items.length === 0;
            documents[dimension].event_read = eventsConfirmed ? "ok" : "failed";
            documents[dimension].event_read_error = eventsConfirmed ? null : (eventWindowError ?? eventsRead.error);
            documents[dimension].navigation_window = windowEvidence;
          }
          const dimensions = {};
          for (const dimension of input.dimensions) {
            const target = targetOf(input.rawPaths, cell, dimension);
            const doc = documents[dimension];
            await writeAtomic(target.abs, doc);
            const failed = !Array.isArray(doc.items) || doc.failures.length > 0;
            dimensions[dimension] = {
              status: failed ? "未测" : "已取得",
              reason: failed ? (doc.failures[0]?.detail ?? `no observed ${dimension}`) : undefined,
              items: doc.items.length,
              failures: doc.failures.length,
            };
          }
          return {
            state,
            viewport,
            url: markers?.url ?? input.entryUrl,
            controls,
            state_observation: observation,
            viewport_check: viewportCheck,
            event_reads: {console: eventsConfirmed ? "ok" : "failed", network: eventsConfirmed ? "ok" : "failed", error: eventsConfirmed ? null : (eventWindowError ?? eventsRead.error), navigation_window: windowEvidence},
            interaction_ms: Number.isFinite(interactionMs) ? interactionMs : null,
            dimensions,
            window_id: activeWindowId,
            observed_at: new Date().toISOString(),
            notes: pendingObservation ? [pendingObservation] : [],
          };
        };

        // 1. unselected: the bare entry's initialState.
        output.cells.push(await writeCell("unselected", initialEvents, ["load bare route"], null, null));

        // 2. ready
        await readEvents(page);
        await selectRadio();
        await click("#demo-use-sample");
        const readyStarted = Date.now();
        const readyWait = await waitChange("ready", "unselected");
        const readyEvents = await readEvents(page);
        output.cells.push(await writeCell("ready", readyEvents, ['select input[name="local-sample"]', "click #demo-use-sample"], null, Date.now() - readyStarted));

        // 3-4. success then duplicate
        await readEvents(page);
        await setScenario("success");
        await click("#demo-confirm");
        const successStarted = Date.now();
        const successPending = await waitLeavesPending();
        output.pending.push({viewport, observed: Boolean(successPending.pending), observation: successPending.pending?.markers ?? null, first_read_observed: successPending.first_read_observed, left_pending_after_ms: successPending.left_ms, left_to_state: successPending.markers?.observed ?? null, evidence_note: successPending.pending ? "点击 #demo-confirm 后实读到 data-state=pending 与 aria-busy=true；随后定时器 resolve 离开 pending。" : "点击 #demo-confirm 后未读到 pending 标记。"});
        const successEvents = await readEvents(page);
        output.cells.push(await writeCell("success", successEvents, ["set #demo-scenario=success", "click #demo-confirm", "wait 150ms timer leaves pending"], null, Date.now() - successStarted));

        await readEvents(page);
        await click("#demo-confirm");
        const duplicateStarted = Date.now();
        await waitChange("duplicate", "success");
        const duplicateEvents = await readEvents(page);
        output.cells.push(await writeCell("duplicate", duplicateEvents, ["click #demo-confirm again (success → duplicate)"], null, Date.now() - duplicateStarted));

        // 5-8. reset → ready → scenario → confirm for empty/error/permission/partial
        for (const scenario of ["empty", "error", "permission", "partial"]) {
          await readEvents(page);
          await click("#demo-reset");
          await waitChange("unselected", "duplicate");
          await selectRadio();
          await click("#demo-use-sample");
          await waitChange("ready", "unselected");
          await setScenario(scenario);
          await click("#demo-confirm");
          const started = Date.now();
          const pending = await waitLeavesPending();
          output.pending.push({viewport, observed: Boolean(pending.pending), observation: pending.pending?.markers ?? null, first_read_observed: pending.first_read_observed, left_pending_after_ms: pending.left_ms, left_to_state: pending.markers?.observed ?? null, evidence_note: pending.pending ? "点击 #demo-confirm 后实读到 data-state=pending 与 aria-busy=true；随后定时器 resolve 离开 pending。" : "点击 #demo-confirm 后未读到 pending 标记。"});
          const events = await readEvents(page);
          const controls = ["click #demo-reset", 'select input[name="local-sample"]', "click #demo-use-sample", `set #demo-scenario=${scenario}`, "click #demo-confirm", "wait 150ms timer leaves pending"];
          output.cells.push(await writeCell(scenario, events, controls, null, Date.now() - started));
        }

        // 9. recovered
        await readEvents(page);
        await click("#demo-recover");
        const recoveredStarted = Date.now();
        await waitChange("recovered", "partial");
        const recoveredEvents = await readEvents(page);
        output.cells.push(await writeCell("recovered", recoveredEvents, ["click #demo-recover (partial → recovered)"], null, Date.now() - recoveredStarted));

        // 10. unknown
        await readEvents(page);
        await click("#demo-reset");
        await waitChange("unselected", "recovered");
        await selectRadio();
        await click("#demo-use-sample");
        await waitChange("ready", "unselected");
        await setScenario("unknown");
        await click("#demo-confirm");
        const unknownStarted = Date.now();
        const unknownPending = await waitLeavesPending();
        output.pending.push({viewport, observed: Boolean(unknownPending.pending), observation: unknownPending.pending?.markers ?? null, first_read_observed: unknownPending.first_read_observed, left_pending_after_ms: unknownPending.left_ms, left_to_state: unknownPending.markers?.observed ?? null, evidence_note: unknownPending.pending ? "点击 #demo-confirm 后实读到 data-state=pending 与 aria-busy=true；随后定时器 resolve 离开 pending。" : "点击 #demo-confirm 后未读到 pending 标记。"});
        const unknownEvents = await readEvents(page);
        output.cells.push(await writeCell("unknown", unknownEvents, ["click #demo-reset", 'select input[name="local-sample"]', "click #demo-use-sample", "set #demo-scenario=unknown", "click #demo-confirm", "wait 150ms timer leaves pending"], null, Date.now() - unknownStarted));

        // keyboard + reduced motion for this viewport.
        const keyboard = [];
        for (let step = 0; step < 3; step += 1) {
          await page.keyboard.press("Tab");
          const read = await readMarkersSafe(page);
          keyboard.push({viewport, step: step + 1, ...(read.markers?.active ?? {}), read_error: read.error});
        }
        output.keyboard.push(...keyboard);
        try {
          const motion = await runRegisteredScript(page, "design-source-read-v1", {elements: [{selector: "html", properties: [], facts: ["reduced-motion"]}]});
          output.reducedMotion = output.reducedMotion ?? {viewport, ...(motion?.[0]?.facts?.reduced_motion ?? {})};
        } catch (error) {
          output.reducedMotion = output.reducedMotion ?? {viewport, unavailable: true, error: `${error.code ?? error.name}: ${error.message}`, owner: "采集环境 owner", recovery: "reduced-motion 可用时重采"};
        }
      } catch (error) {
        output.ok = false;
        output.errors.push({viewport, code: error.code ?? error.name, message: String(error.message).slice(0, 1000)});
        fillMissingCells(output, input, viewport, error);
      }
    }
    output.cells.sort((left, right) => stateIndex(left.state) - stateIndex(right.state) || viewportIndex(left.viewport) - viewportIndex(right.viewport));
    output.checks.failure_path = failurePathSelfCheck(input);
    output.ok = output.ok && output.cells.length === input.states.length * input.viewports.length && output.checks.failure_path.ok === true;
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
  if (command === "stop") return stopRun(rest);
  throw usage("usage: c12-v15.mjs prepare|collect|stop --run-id=... ...");
}

const direct = process.argv[1] ? (() => {
  try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
})() : false;

if (direct) {
  main().then((code) => { process.exitCode = code; }).catch((error) => {
    process.stderr.write(`${JSON.stringify({ok: false, code: error.code ?? "E_UNEXPECTED", message: error.message, ...(error.exitCode ? {exit_code: error.exitCode} : {}), ...(error.identity_ref ? {identity_ref: error.identity_ref} : {}), ...(error.failure_ref ? {failure_ref: error.failure_ref} : {}), ...(error.failure_note_error ? {failure_note_error: error.failure_note_error} : {}), ...(error.cleanup ? {cleanup: error.cleanup} : {})})}\n`);
    process.exitCode = error.exitCode ?? 1;
  });
}
