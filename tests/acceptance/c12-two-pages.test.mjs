import test from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { stateObservation } from "../../skills/frontend-testing/scripts/run-page-audit.mjs";

// ORACLE-C12-CAPABILITY: expected values come from spec Appendix A and P1.
// TCR-C12-001 (frozen-test change, independent merged review): the driver target
// URL carried `?source=frozen`, which the QA gateway rejects as
// INVALID_TARGET_SCOPE (skills/isolated-browser-qa/scripts/browser-qa-session.mjs
// makeBrowserQaScope only accepts a bare route or the literal `?source=live`).
// The target is now a bare route: the page derives frozen from the absent
// `source` query and the six demo states are entered in-page through
// `data-demo-state`; the P1 card declares no `--state` driver argument.
// AC-C12-002 also requires a non-empty reason when the URL carries no state
// (state_observation=unknown). Oracle identity and assertion strength are
// unchanged.
//
// TCR-C12-002 (frozen-test change, user-confirmed by
// quality/evidence/human-confirmations/2026-11-14-003-build-code-gate-change-approved.json):
// three defects made this gate un-runnable or dishonest on RED.
// 1. The QA gateway requires BROWSER_QA_TASK_ID when it starts
//    (skills/isolated-browser-qa/scripts/browser-qa-session.mjs,
//    requireTaskIdFromHost), but the frozen test never supplied it, so the
//    plain gate died with BROWSER_QA_TASK_HANDLE_UNAVAILABLE before it could
//    judge anything (quality/tests/2026-11-14-029-*).
// 2. It pinned the first run's originals (2026-11-14-102-two-pages-identity.json
//    and ...-107-two-pages-coverage.json). The evidence store refuses to
//    overwrite a same-named original (the collector raises EEXIST on
//    110-console-board-1280x800.json; quality/tests/2026-11-14-031-*), so a
//    repair re-run can only append new originals and the pinned read would keep
//    judging the pre-fix bytes.
// 3. A missing driver module was rewritten into an ORACLE target failure, while
//    the P1 card (phases/P1-两页验收.md §定向 RED/GREEN) says module,
//    dependency, browser-start and collection failures are not target RED.
// The fix changes only setup/selection semantics: the task id is read from this
// task's task.json with node:fs and passed in the child environment; the newest
// matching identity/coverage original is resolved at run time; module absence is
// reported as SETUP-NOT-RED. No oracle criterion, validator, assertion, command
// argument or exit-code handling is weakened.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DRIVER = "tests/acceptance/c12-two-pages.mjs";
const TASK_ROOT = "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c12-acceptance-20261114";
const EVIDENCE_ROOT = join(TASK_ROOT, "quality/evidence");
// TCR-C12-002: derive the task id from the task manifest instead of requiring
// the caller to export it. The gateway starts with this value and the collect
// step compares it with openTask(...).identity.taskId, so both steps get it in
// their environment below. A blank id fails at load time as a setup gap.
const TASK_ID = (() => {
  const manifest = JSON.parse(readFileSync(join(TASK_ROOT, "task.json"), "utf8"));
  const taskId = manifest?.task_id;
  if (typeof taskId !== "string" || !taskId.trim()) throw new Error("SETUP-NOT-RED task.json carries no task_id");
  return taskId;
})();
const SOURCE_ROOT = "/Users/Hugh/Hugh/Project/c09-carrier-new-20261103";
// TCR-C12-002: no longer pin the first run's filenames. Originals are
// write-once, so a re-run allocates a new evidence series; the suffix
// (…-102-two-pages-identity.json / …-107-two-pages-coverage.json and later
// series) selects the family and latestEvidence() picks the newest member.
const IDENTITY_SUFFIX = "-two-pages-identity.json";
const COVERAGE_SUFFIX = "-two-pages-coverage.json";
// Both gate commands hardcode this run id; a selected original must carry it.
const RUN_ID = "c12-p1";
const PREPARE = "node tests/acceptance/c12-two-pages.mjs prepare --run-id=c12-p1 --source-root=/Users/Hugh/Hugh/Project/c09-carrier-new-20261103 --copy-root=/tmp/c12-c12-p1/carrier --port=41921 --task-record-root=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c12-acceptance-20261114";
const TARGET_URL = "http://127.0.0.1:41921/simulation-board";
// The collect command is verbatim from the P1 card. That card neither sets
// BROWSER_QA_EGO_KEEP_OPEN (the ego-lite path rejects it as
// EGO_TASKSPACE_REUSE_OPTIONS_UNSUPPORTED) nor declares a `--state` driver
// argument: the bare route already falls back to frozen, and the six demo
// states are entered in-page through `data-demo-state`.
const COLLECT = `env BROWSER_QA_ENGINE=auto BROWSER_QA_AUTH_MODE=none bash skills/isolated-browser-qa/scripts/browser-qa-context.sh --run --url '${TARGET_URL}' --evidence-dir /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c12-acceptance-20261114/quality/evidence -- node tests/acceptance/c12-two-pages.mjs collect --run-id=c12-p1 --service-url=http://127.0.0.1:41921 --task-record-root=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c12-acceptance-20261114`;
const ROUTES = ["/simulation-board", "/sim-workbench"];
const VIEWPORTS = ["1280x800", "390x844"];
const DIMENSIONS = ["console", "network", "overflow", "a11y", "perf"];
const IDENTITY_KEYS = ["workspace", "service", "route", "state", "viewport", "engine", "engine_session", "object_version"];
const FILES = [
  "package.json", "package-lock.json", "next.config.ts", "tsconfig.json", "postcss.config.mjs",
  "app/layout.tsx", "app/globals.css", "app/data/view-model.ts", "app/data/live-mapping.ts",
  "app/data/pb-client.ts", "app/data/shared-data.ts", "app/simulation-board/page.tsx",
  "app/sim-workbench/page.tsx", "app/components/simulation-board-panels.tsx",
  "app/components/sim-workbench-panels.tsx", "app/ui/primitives.tsx", "app/ui/primitives.css",
  "app/ui/tokens-base.css", "app/ui/ui-contract.ts",
];
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const aggregate = rows => sha256(Buffer.from([...rows].sort((a, b) => a.path.localeCompare(b.path)).map(row => `${row.path}\0${row.sha256}\n`).join("")));
// Mirrors the QA gateway rule (makeBrowserQaScope): only a bare route or the
// literal `?source=live` is a valid target. Any other query, in particular a
// page-state parameter, must be rejected instead of being folded into the URL.
function targetScopeViolation(url) {
  if (typeof url !== "string" || !url.trim()) return "target URL is empty";
  let parsed;
  try { parsed = new URL(url); } catch { return "target URL is not absolute"; }
  const beforeHash = url.split("#", 1)[0];
  const queryIndex = beforeHash.indexOf("?");
  const rawQuery = queryIndex < 0 ? "" : beforeHash.slice(queryIndex);
  if (parsed.username || parsed.password || parsed.hash || rawQuery !== parsed.search) return "target URL carries credentials, a hash or a non-literal query";
  if (rawQuery && rawQuery !== "?source=live") return `target URL query is rejected by INVALID_TARGET_SCOPE: ${rawQuery}`;
  return null;
}
const expectedFiles = FILES.map(path => ({ path, sha256: sha256(readFileSync(join(SOURCE_ROOT, path))) }));
const expectedAggregate = aggregate(expectedFiles);
let execution;

function run(command) {
  // TCR-C12-002: both steps inherit the manifest task id in their environment.
  // The COLLECT string keeps its `env BROWSER_QA_ENGINE=...` prefix verbatim and
  // passes this variable through to the gateway and to the collect process.
  const result = spawnSync("/bin/sh", ["-c", command], { cwd: ROOT, env: { ...process.env, BROWSER_QA_TASK_ID: TASK_ID }, encoding: "utf8", timeout: 600_000, maxBuffer: 16 * 1024 * 1024 });
  return { status: result.status, signal: result.signal, error: result.error?.code ?? null, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}
function deliver() {
  if (!execution) {
    const prepare = run(PREPARE);
    execution = { prepare, collect: prepare.status === 0 ? run(COLLECT) : null };
  }
  return execution;
}
function missingDriver(step) {
  const output = `${step.stdout}\n${step.stderr}`;
  return step.status !== 0 && /Cannot find module|ERR_MODULE_NOT_FOUND|MODULE_NOT_FOUND/.test(output) && output.includes(DRIVER);
}
function assertSetup(step, name) {
  assert.ok(step, `SETUP-NOT-RED ${name}: planned command did not run (setup gap, not the ORACLE target failure)`);
  assert.equal(step.status, 0, `SETUP-NOT-RED ${name}: exit=${step.status}; signal=${step.signal}; error=${step.error}; stderr=${step.stderr} (setup gap, not the ORACLE target failure)`);
}
function readJson(path) {
  try { return { value: JSON.parse(readFileSync(path, "utf8")) }; }
  catch (error) { return { error: `${error.code ?? error.name}: ${error.message}` }; }
}
// TCR-C12-002: resolve the newest original in one evidence family. Originals are
// write-once: a same-path write with different bytes fails with EEXIST
// (collect-console.mjs publishes through link(2); safe-write publishes
// create-only), so a re-run cannot overwrite or extend the first series. The
// driver therefore allocates a new evidence series per re-run, and this function
// reads the newest allocated series: the suffix selects the family,
// (…-two-pages-identity.json / …-two-pages-coverage.json), mtime orders the
// allocation, and the numeric record sequence is the tie-break for an equal
// mtime (3- and 4-digit sequences both compare as numbers). The selected path
// and mtime are echoed in every failure so a reader always knows which bytes
// were judged.
function sequenceOf(name) {
  const match = name.match(/^\d{4}-\d{2}-\d{2}-(\d{3,})-/);
  return match ? Number(match[1]) : -1;
}
function latestEvidence(suffix) {
  let names;
  try { names = readdirSync(EVIDENCE_ROOT); } catch { return null; }
  const rows = [];
  for (const name of names) {
    if (!name.endsWith(suffix)) continue;
    const path = join(EVIDENCE_ROOT, name);
    let mtime = 0;
    try { const stat = statSync(path); if (!stat.isFile()) continue; mtime = stat.mtimeMs; } catch { continue; }
    rows.push({ path, name, mtime });
  }
  rows.sort((left, right) => right.mtime - left.mtime || sequenceOf(right.name) - sequenceOf(left.name) || right.name.localeCompare(left.name));
  return rows[0] ?? null;
}
function readLatest(suffix) {
  const latest = latestEvidence(suffix);
  if (!latest) return { error: `no original matches *${suffix} under quality/evidence` };
  return { ...readJson(latest.path), path: latest.path, mtime: latest.mtime };
}
function readRef(ref) {
  if (typeof ref !== "string" || !ref) return { error: "evidence reference is empty" };
  const path = isAbsolute(ref) ? resolve(ref) : resolve(TASK_ROOT, ref);
  if (path !== EVIDENCE_ROOT && !path.startsWith(EVIDENCE_ROOT + sep)) return { error: `evidence reference escapes quality/evidence: ${ref}` };
  return readJson(path);
}
function validateIdentity(identity) {
  const errors = [];
  if (!identity || Array.isArray(identity)) return ["identity document is not an object"];
  for (const field of ["files", "copy_files"]) {
    const rows = identity[field];
    if (!Array.isArray(rows)) { errors.push(`${field} is missing`); continue; }
    const actual = new Map(rows.map(row => [row?.path, row?.sha256]));
    for (const expected of expectedFiles) if (actual.get(expected.path) !== expected.sha256) errors.push(`${field} identity mismatch: ${expected.path}`);
    if (rows.length !== FILES.length || actual.size !== FILES.length) errors.push(`${field} must contain exactly the locked nineteen files`);
  }
  if (identity.aggregate !== expectedAggregate) errors.push("source aggregate does not reproduce path\\0sha256\\n");
  if (identity.copy_aggregate !== expectedAggregate || identity.copy_aggregate !== identity.aggregate) errors.push("copy identity differs from source; startup must be refused");
  return errors;
}
function validateRawDocument(result, cell, dimension) {
  const errors = [];
  if (result.error) return [`${cell.route} ${cell.viewport} ${dimension}: ${result.error}`];
  const doc = result.value;
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return [`${dimension} evidence is not an object`];
  if (typeof doc.engine !== "string" || typeof doc.observed_at !== "string" || !Array.isArray(doc.items) || !Array.isArray(doc.failures)) errors.push(`${dimension} must retain engine, observed_at, items and failures`);
  for (const key of IDENTITY_KEYS) if (typeof doc.object?.[key] !== "string" || !doc.object[key]) errors.push(`${dimension} identity missing: ${key}`);
  for (const key of ["route", "state", "viewport"]) if (doc.object?.[key] !== cell[key]) errors.push(`${dimension} object ${key} differs from its cell`);
  return errors;
}
function validateCoverage(coverage, read = readRef, attemptExists = ref => existsSync(isAbsolute(ref) ? ref : join(TASK_ROOT, ref))) {
  const errors = [];
  if (!coverage || !Array.isArray(coverage.cells)) return ["coverage cells are missing"];
  const cells = new Map(coverage.cells.map(cell => [`${cell.route}\0${cell.viewport}`, cell]));
  if (coverage.cells.length !== 4 || cells.size !== 4) errors.push("two routes times two viewports must produce four unique cells");
  for (const route of ROUTES) for (const viewport of VIEWPORTS) {
    const cell = cells.get(`${route}\0${viewport}`);
    if (!cell) { errors.push(`missing frozen cell: ${route} ${viewport}`); continue; }
    if (cell.state !== "frozen") errors.push(`non-frozen cell entered the matrix: ${route} ${viewport}`);
    if (cell.state_observation?.result !== "unknown") errors.push(`URL without state must remain unknown: ${route} ${viewport}`);
    if (typeof cell.state_observation?.reason !== "string" || !cell.state_observation.reason.trim()) errors.push(`unknown state observation requires a non-empty reason: ${route} ${viewport}`);
    if (typeof cell.console_network_window !== "string" || !cell.console_network_window) errors.push(`console/network navigation window missing: ${route} ${viewport}`);
    for (const dimension of DIMENSIONS) {
      const entry = cell.dimensions?.[dimension];
      if (typeof entry === "string") {
        errors.push(...validateRawDocument(read(entry), cell, dimension));
      } else {
        if (entry?.status !== "未测" || typeof entry.reason !== "string" || !entry.reason.trim() || typeof entry.attempt_ref !== "string" || !entry.attempt_ref) errors.push(`auxiliary miss lacks 未测, reason and attempt_ref: ${route} ${viewport} ${dimension}`);
        else if (!attemptExists(entry.attempt_ref)) errors.push(`auxiliary attempt original is unreadable: ${route} ${viewport} ${dimension}`);
      }
    }
  }
  return errors;
}
function validFixture() {
  const cells = ROUTES.flatMap(route => VIEWPORTS.map(viewport => ({
    route, viewport, state: "frozen", state_observation: { result: "unknown", reason: "页面网址没有 state 参数" }, console_network_window: "window-1",
    dimensions: Object.fromEntries(DIMENSIONS.map(dimension => [dimension, `${route}|${viewport}|${dimension}`])),
  })));
  return { cells };
}
const fixtureRead = ref => {
  const [route, viewport] = ref.split("|");
  return { value: { engine: "fixture", observed_at: "2026-11-14T00:00:00Z", object: { workspace: "w", service: "s", route, state: "frozen", viewport, engine: "e", engine_session: "es", object_version: "ov" }, items: [], failures: [] } };
};

test("ORACLE-C12-CAPABILITY 两页身份不符必须拒绝启动，且两页有原因的辅助缺采不得被写成该维通过", () => {
  const { prepare, collect } = deliver();
  // TCR-C12-002: module/driver absence is a setup gap on the planned command,
  // never the ORACLE target failure the P1 card asks this gate to judge.
  if (missingDriver(prepare)) assert.fail(`SETUP-NOT-RED two-pages prepare: ${DRIVER} is not implemented yet; a missing module or driver is a setup gap, not the ORACLE target failure`);
  assertSetup(prepare, "two-pages prepare");
  assertSetup(collect, "two-pages collect");
  // TCR-C12-002: judge the newest identity/coverage originals of this run's
  // family instead of the first run's pinned filenames.
  const identity = readLatest(IDENTITY_SUFFIX);
  const coverage = readLatest(COVERAGE_SUFFIX);
  const errors = [];
  // TCR-C12-002: the selected originals must belong to this gate's run id; a
  // foreign-series (or stale-mutant) identity/coverage is not this run's fact.
  if (!identity.error && identity.value?.run_id !== RUN_ID) errors.push(`identity original run_id must be ${RUN_ID}: observed ${identity.value?.run_id ?? "missing"} (${identity.path})`);
  if (!coverage.error && coverage.value?.run_id !== RUN_ID) errors.push(`coverage original run_id must be ${RUN_ID}: observed ${coverage.value?.run_id ?? "missing"} (${coverage.path})`);
  if (identity.error) errors.push(`identity original unavailable (${identity.path ?? `quality/evidence/*${IDENTITY_SUFFIX}`}): ${identity.error}`); else errors.push(...validateIdentity(identity.value));
  if (coverage.error) errors.push(`coverage original unavailable (${coverage.path ?? `quality/evidence/*${COVERAGE_SUFFIX}`}): ${coverage.error}`); else errors.push(...validateCoverage(coverage.value));
  assert.deepEqual(errors, [], `ORACLE-C12-CAPABILITY 两页身份、辅助缺采与状态观察不符合冻结判据；judged identity=${identity.path ?? "unavailable"}, coverage=${coverage.path ?? "unavailable"}`);
});

test("ORACLE-C12-CAPABILITY 正例保留有真实原因的辅助缺采为未测", () => {
  const coverage = validFixture();
  const cell = coverage.cells[0];
  cell.dimensions.console = { status: "未测", reason: "collector unavailable", attempt_ref: "attempt.json" };
  const errors = validateCoverage(coverage, fixtureRead, () => true);
  assert.deepEqual(errors, [], "ORACLE-C12-CAPABILITY 有原因的辅助缺采不得被写成该维通过，也不得硬判整包失败");
});

test("ORACLE-C12-CAPABILITY 反例拒绝缺采无原因、unknown 无原因及副本身份漂移", () => {
  const coverage = validFixture();
  coverage.cells[0].dimensions.console = { status: "可用" };
  const errors = validateCoverage(coverage, fixtureRead);
  assert.ok(errors.some(error => error.includes("auxiliary miss lacks")), "ORACLE-C12-CAPABILITY 缺采无原因必须失败");
  const unexplained = validFixture();
  unexplained.cells[1].state_observation = { result: "unknown" };
  assert.ok(validateCoverage(unexplained, fixtureRead).some(error => error.includes("requires a non-empty reason")), "ORACLE-C12-CAPABILITY unknown 状态必须带非空原因");
  const identity = { files: expectedFiles, copy_files: expectedFiles.map(row => ({ ...row })), aggregate: expectedAggregate, copy_aggregate: expectedAggregate };
  identity.copy_files[0].sha256 = "0".repeat(64);
  assert.ok(validateIdentity(identity).some(error => error.includes("copy_files identity mismatch")), "ORACLE-C12-CAPABILITY 副本身份漂移必须拒绝启动");
});

test("ORACLE-C12-CAPABILITY 目标 URL 必须是裸路由，状态只能由页内交互参数驱动", () => {
  assert.equal(targetScopeViolation(TARGET_URL), null, "ORACLE-C12-CAPABILITY 裸路由必须被网关接受");
  assert.ok(!TARGET_URL.includes("?"), "ORACLE-C12-CAPABILITY 两页目标 URL 不得带查询串");
  assert.ok(COLLECT.includes(`--url '${TARGET_URL}'`), "ORACLE-C12-CAPABILITY 网关入口必须使用裸路由");
  assert.ok(!COLLECT.includes("--state="), "ORACLE-C12-CAPABILITY P1 卡未声明 --state 驱动参数，状态只能由页内交互取得");
  assert.ok(!COLLECT.includes("BROWSER_QA_EGO_KEEP_OPEN"), "ORACLE-C12-CAPABILITY P1 网关入口不得设置 ego 复用变量");
  assert.ok(!COLLECT.includes("?source=frozen"), "ORACLE-C12-CAPABILITY 状态不得拼进目标 URL");
  assert.equal(targetScopeViolation(`${TARGET_URL}?source=frozen`), "target URL query is rejected by INVALID_TARGET_SCOPE: ?source=frozen", "ORACLE-C12-CAPABILITY 伪造 source 必须被网关拒绝");
  assert.equal(targetScopeViolation(`${TARGET_URL}?state=empty`), "target URL query is rejected by INVALID_TARGET_SCOPE: ?state=empty", "ORACLE-C12-CAPABILITY 状态参数不得进入目标 URL");
  assert.equal(targetScopeViolation(`${TARGET_URL}?source=live`), null, "ORACLE-C12-CAPABILITY 网关唯一允许的 source=live 仍可接受");
});

test("ORACLE-C12-CAPABILITY 无 URL 状态为 unknown，状态不同为 mismatch", () => {
  // Helper semantics only: a bare target has no URL state, so the declaration
  // stays unknown; a state parameter in the observed URL is still a mismatch.
  // Such a URL is not a valid gateway target (see targetScopeViolation above).
  assert.deepEqual(stateObservation("ready", TARGET_URL), { declared: "ready", observed: null, result: "unknown" });
  assert.deepEqual(stateObservation("ready", `${TARGET_URL}?state=empty`), { declared: "ready", observed: "empty", result: "mismatch" });
});
