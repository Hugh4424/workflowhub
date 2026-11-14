import test from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { stateObservation } from "../../skills/frontend-testing/scripts/run-page-audit.mjs";

// ORACLE-C12-CAPABILITY: the thirty-cell denominator and seven files are locked by P2/spec.
// TCR-C12-001 (frozen-test change, independent merged review): the driver entry
// URL carried `?state=unselected`, which the QA gateway rejects as
// INVALID_TARGET_SCOPE (skills/isolated-browser-qa/scripts/browser-qa-session.mjs
// makeBrowserQaScope only accepts a bare route or the literal `?source=live`).
// The entry is now a bare route and the ten stable states are entered through
// the page's own controls; the state observation is read from
// `#demo-result[data-state]` and `#demo-confirm-panel[aria-busy]` and may be a
// legitimate match, mismatch or unknown (the latter two with a real reason).
// AC-C12-002 also requires the pending miss to keep one record per viewport
// instead of a single record. Oracle identity and assertion strength are
// unchanged.
//
// TCR-C12-003 (frozen-test change, user-confirmed by
// quality/evidence/human-confirmations/2026-11-14-004-build-code-gate-change-p2-p3-approved.json):
// the same three defects as the P1 TCR-C12-002, on the v15 gate.
// 1. The gateway requires BROWSER_QA_TASK_ID before it starts
//    (skills/isolated-browser-qa/scripts/browser-qa-session.mjs,
//    requireTaskIdFromHost); the frozen test never supplied it, so the bare
//    gate died with BROWSER_QA_TASK_HANDLE_UNAVAILABLE before judging anything.
// 2. It pinned the first run's originals (2026-11-14-202-v15-identity.json and
//    …-207-v15-coverage.json). Evidence originals are write-once (a same-path
//    write with different bytes fails EEXIST), so a re-run allocates a new
//    evidence series and a pinned read would keep judging pre-fix bytes.
// 3. missingDriver() rewrote module absence into an ORACLE target failure,
//    though the P2 card says module/dependency/collection failures are not
//    target RED.
// The fix changes only setup/selection: the task id is read from task.json with
// node:fs and passed in the child environment; the newest matching original of
// each family is resolved at run time and its run_id must be this gate's run;
// module absence is SETUP-NOT-RED. The seven-file identity, thirty-cell stable
// matrix, match/mismatch/unknown observation rules and pending 未测 records are
// untouched.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DRIVER = "tests/acceptance/c12-v15.mjs";
const TASK_ROOT = "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c12-acceptance-20261114";
const EVIDENCE_ROOT = join(TASK_ROOT, "quality/evidence");
// TCR-C12-003: derive the task id from the task manifest instead of requiring
// the caller to export it. The gateway starts with this value and the collect
// step compares it with openTask(...).identity.taskId.
const TASK_ID = (() => {
  const manifest = JSON.parse(readFileSync(join(TASK_ROOT, "task.json"), "utf8"));
  const taskId = manifest?.task_id;
  if (typeof taskId !== "string" || !taskId.trim()) throw new Error("SETUP-NOT-RED task.json carries no task_id");
  return taskId;
})();
const OBJECT_ROOT = join(ROOT, "docs/examples/c11-ui");
// TCR-C12-003: no longer pin the first run's filenames. A re-run allocates a new
// evidence series, so the suffix selects the family and latestEvidence() picks
// the newest member; the selected original must carry this gate's run id.
const IDENTITY_SUFFIX = "-v15-identity.json";
const COVERAGE_SUFFIX = "-v15-coverage.json";
const RUN_ID = "c12-p2";
const PREPARE = "node tests/acceptance/c12-v15.mjs prepare --run-id=c12-p2 --service-root=docs/examples/c11-ui --port=41922 --task-record-root=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c12-acceptance-20261114";
const TARGET_URL = "http://127.0.0.1:41922/v15/2026-11-11-002-t019-v15-pending-busy-index.html";
// The collect command is verbatim from the P2 card. That card declares no
// `--state` driver argument: the bare entry falls back to `unselected` and the
// ten stable states are entered through the page's own controls.
const COLLECT = `env BROWSER_QA_ENGINE=auto BROWSER_QA_AUTH_MODE=none bash skills/isolated-browser-qa/scripts/browser-qa-context.sh --run --url '${TARGET_URL}' --evidence-dir /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c12-acceptance-20261114/quality/evidence -- node tests/acceptance/c12-v15.mjs collect --run-id=c12-p2 --service-url=http://127.0.0.1:41922 --task-record-root=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c12-acceptance-20261114`;
const STATES = ["unselected", "ready", "success", "duplicate", "empty", "error", "permission", "partial", "unknown", "recovered"];
const VIEWPORTS = ["390x844", "1280x800", "1440x900"];
const DIMENSIONS = ["console", "network", "overflow", "a11y", "perf"];
const IDENTITY_KEYS = ["workspace", "service", "route", "state", "viewport", "engine", "engine_session", "object_version"];
const ROUTE = "v15/2026-11-11-002-t019-v15-pending-busy-index.html";
const FILES = [
  "v15/2026-11-11-001-t019-v15-pending-busy-app.js",
  "v15/2026-11-11-002-t019-v15-pending-busy-index.html",
  "v15/2026-11-11-003-t019-v15-pending-busy-readme.md",
  "v15/2026-11-12-001-c11-query-writer.mjs",
  "v15/2026-11-12-002-c11-query-data.js",
  "v11/2026-11-10-001-t019-wf-native-next-v11-styles.css",
  "v12/2026-11-11-009-t019-v12-local-demo-styles.css",
];
const PENDING_REASON = "未测（瞬时不可采集：150ms 定时器使页面在采集前离开）";
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const aggregate = rows => sha256(Buffer.from([...rows].sort((a, b) => a.path.localeCompare(b.path)).map(row => `${row.path}\0${row.sha256}\n`).join("")));
// Mirrors the QA gateway rule (makeBrowserQaScope): only a bare route or the
// literal `?source=live` is a valid target. A `?state=` entry would be rejected
// before any page could be observed, so the state is a driver interaction input.
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
const expectedFiles = FILES.map(path => ({ path, sha256: sha256(readFileSync(join(OBJECT_ROOT, path))) }));
const expectedAggregate = aggregate(expectedFiles);
let execution;

function run(command) {
  // TCR-C12-003: both steps inherit the manifest task id in their environment;
  // the COLLECT string keeps its `env BROWSER_QA_ENGINE=...` prefix verbatim.
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
// TCR-C12-003: resolve the newest original in one evidence family. Originals are
// write-once (a same-path write with different bytes fails EEXIST), so a re-run
// allocates a new evidence series; mtime orders the allocation and the numeric
// record sequence is the tie-break for an equal mtime (3- and 4-digit sequences
// both compare as numbers). The selected path and mtime are echoed in failures.
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
  if (!identity || !Array.isArray(identity.files)) return ["v15 identity files are missing"];
  const actual = new Map(identity.files.map(row => [row?.path, row?.sha256]));
  for (const expected of expectedFiles) if (actual.get(expected.path) !== expected.sha256) errors.push(`v15 identity mismatch: ${expected.path}`);
  if (identity.files.length !== FILES.length || actual.size !== FILES.length) errors.push("v15 identity must contain five v15 files plus both loaded CSS files");
  if (identity.aggregate !== expectedAggregate) errors.push("v15 aggregate does not reproduce path\\0sha256\\n");
  if (identity.service_root !== "docs/examples/c11-ui" || identity.route !== ROUTE) errors.push("v15 service root or route is not the locked parent-directory entry");
  return errors;
}
function validateRawDocument(result, cell, dimension) {
  const errors = [];
  if (result.error) return [`${cell.state} ${cell.viewport} ${dimension}: ${result.error}`];
  const doc = result.value;
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return [`${dimension} evidence is not an object`];
  if (typeof doc.engine !== "string" || typeof doc.observed_at !== "string" || !Array.isArray(doc.items) || !Array.isArray(doc.failures)) errors.push(`${dimension} must retain engine, observed_at, items and failures`);
  for (const key of IDENTITY_KEYS) if (typeof doc.object?.[key] !== "string" || !doc.object[key]) errors.push(`${dimension} identity missing: ${key}`);
  for (const key of ["route", "state", "viewport"]) if (doc.object?.[key] !== cell[key]) errors.push(`${dimension} object ${key} differs from its cell`);
  return errors;
}
// A stable cell records `state_observation` as
// {result, observed, aria_busy, reason}. `observed` is `#demo-result`'s
// `data-state` value and `aria_busy` is `#demo-confirm-panel`'s `aria-busy`
// value ("true" or "false"). match means observed equals the entered state;
// mismatch means it differs and must carry a reason; unknown is only allowed
// when the marker cannot be read and must also carry a reason.
function validateStateObservation(cell) {
  const observation = cell.state_observation;
  if (!observation || typeof observation !== "object" || Array.isArray(observation)) return [`stable cell state observation is missing: ${cell.state} ${cell.viewport}`];
  const { result, observed, aria_busy: ariaBusy, reason } = observation;
  if (!["match", "mismatch", "unknown"].includes(result)) return [`state observation result must be match, mismatch or unknown: ${cell.state} ${cell.viewport}`];
  // The real state is read from `#demo-result[data-state]` and
  // `#demo-confirm-panel[aria-busy]`. Both must be readable before a match or
  // mismatch can be claimed; a marker that cannot be read is unknown.
  const markerReadable = typeof observed === "string" && observed.length > 0 && (ariaBusy === "true" || ariaBusy === "false");
  if (!markerReadable) {
    const errors = [];
    if (result !== "unknown") errors.push(`unreadable #demo-result data-state / aria-busy marker must be observed as unknown: ${cell.state} ${cell.viewport}`);
    if (typeof reason !== "string" || !reason.trim()) errors.push(`unknown state observation requires a non-empty reason: ${cell.state} ${cell.viewport}`);
    return errors;
  }
  if (result === "unknown") return [`readable #demo-result data-state marker cannot be observed as unknown: ${cell.state} ${cell.viewport}`];
  const expectedBusy = observed === "pending" ? "true" : "false";
  const errors = [];
  if (result === "match") {
    if (observed !== cell.state) errors.push(`match must agree with the observed #demo-result data-state: ${cell.state} ${cell.viewport}`);
    if (ariaBusy !== expectedBusy) errors.push(`match contradicts #demo-confirm-panel aria-busy: ${cell.state} ${cell.viewport}`);
  } else {
    if (observed === cell.state && ariaBusy === expectedBusy) errors.push(`mismatch must record an observed state different from the entered state: ${cell.state} ${cell.viewport}`);
    if (typeof reason !== "string" || !reason.trim()) errors.push(`mismatch state observation requires a non-empty reason: ${cell.state} ${cell.viewport}`);
  }
  return errors;
}
function validateCoverage(coverage, read = readRef) {
  const errors = [];
  if (!coverage || !Array.isArray(coverage.cells)) return ["v15 coverage cells are missing"];
  const cells = new Map(coverage.cells.map(cell => [`${cell.state}\0${cell.viewport}`, cell]));
  if (coverage.cells.length !== 30 || cells.size !== 30) errors.push("ten stable states times three viewports must produce thirty unique cells");
  if (cells.has("pending\0" + VIEWPORTS[0]) || coverage.cells.some(cell => cell.state === "pending")) errors.push("pending must not enter the stable matrix");
  for (const state of STATES) for (const viewport of VIEWPORTS) {
    const cell = cells.get(`${state}\0${viewport}`);
    if (!cell) { errors.push(`missing stable cell: ${state} ${viewport}`); continue; }
    if (cell.route !== ROUTE) errors.push(`stable cell route differs: ${state} ${viewport}`);
    errors.push(...validateStateObservation(cell));
    for (const dimension of DIMENSIONS) {
      const ref = cell.dimensions?.[dimension];
      if (typeof ref !== "string" || !ref) errors.push(`stable dimension missing: ${state} ${viewport} ${dimension}`);
      else errors.push(...validateRawDocument(read(ref), cell, dimension));
    }
  }
  if (coverage.pending?.status !== "未测" || coverage.pending?.reason !== PENDING_REASON) errors.push("pending must retain the locked 未测 reason");
  const records = coverage.pending?.records;
  if (!Array.isArray(records) || records.length !== VIEWPORTS.length) errors.push("pending must retain one 未测 record per viewport");
  else {
    const recordViewports = new Set(records.map(record => record?.viewport));
    if (recordViewports.size !== VIEWPORTS.length || VIEWPORTS.some(viewport => !recordViewports.has(viewport))) errors.push("pending per-viewport records must cover exactly the three frozen viewports");
    for (const viewport of VIEWPORTS) {
      const record = records.find(row => row?.viewport === viewport);
      if (!record || record.status !== "未测" || record.reason !== PENDING_REASON) errors.push(`pending ${viewport} record must retain the locked 未测 reason`);
    }
  }
  if (coverage.pending?.dimensions !== undefined || coverage.pending?.stable_cells !== undefined) errors.push("pending must not carry pseudo-stable five-dimension evidence");
  return errors;
}
function validFixture() {
  return {
    cells: STATES.flatMap(state => VIEWPORTS.map(viewport => {
      // One deliberate, well-explained mismatch is a legal observation and must
      // be accepted; only a claim that contradicts its own marker is rejected.
      const mismatched = state === "permission" && viewport === "390x844";
      return {
        route: ROUTE, state, viewport,
        state_observation: mismatched
          ? { result: "mismatch", observed: "error", aria_busy: "false", reason: "#demo-result 显示 error，与进入的 permission 不一致" }
          : { result: "match", observed: state, aria_busy: "false" },
        dimensions: Object.fromEntries(DIMENSIONS.map(dimension => [dimension, `${state}|${viewport}|${dimension}`])),
      };
    })),
    pending: { status: "未测", reason: PENDING_REASON, records: VIEWPORTS.map(viewport => ({ viewport, status: "未测", reason: PENDING_REASON })) },
  };
}
const fixtureRead = ref => {
  const [state, viewport] = ref.split("|");
  return { value: { engine: "fixture", observed_at: "2026-11-14T00:00:00Z", object: { workspace: "w", service: "s", route: ROUTE, state, viewport, engine: "e", engine_session: "es", object_version: "ov" }, items: [], failures: [] } };
};

test("ORACLE-C12-CAPABILITY 缺任一正式稳定格或状态观察造假必须失败，且 pending 不得进入稳定格", () => {
  const { prepare, collect } = deliver();
  // TCR-C12-003: module/driver absence is a setup gap on the planned command,
  // never the ORACLE target failure the P2 card asks this gate to judge.
  if (missingDriver(prepare)) assert.fail(`SETUP-NOT-RED v15 prepare: ${DRIVER} is not implemented yet; a missing module or driver is a setup gap, not the ORACLE target failure`);
  assertSetup(prepare, "v15 prepare");
  assertSetup(collect, "v15 collect");
  // TCR-C12-003: judge the newest v15 identity/coverage originals instead of
  // the first run's pinned filenames.
  const identity = readLatest(IDENTITY_SUFFIX);
  const coverage = readLatest(COVERAGE_SUFFIX);
  const errors = [];
  // The selected originals must belong to this gate's run id.
  if (!identity.error && identity.value?.run_id !== RUN_ID) errors.push(`identity original run_id must be ${RUN_ID}: observed ${identity.value?.run_id ?? "missing"} (${identity.path})`);
  if (!coverage.error && coverage.value?.run_id !== RUN_ID) errors.push(`coverage original run_id must be ${RUN_ID}: observed ${coverage.value?.run_id ?? "missing"} (${coverage.path})`);
  if (identity.error) errors.push(`identity original unavailable (${identity.path ?? `quality/evidence/*${IDENTITY_SUFFIX}`}): ${identity.error}`); else errors.push(...validateIdentity(identity.value));
  if (coverage.error) errors.push(`coverage original unavailable (${coverage.path ?? `quality/evidence/*${COVERAGE_SUFFIX}`}): ${coverage.error}`); else errors.push(...validateCoverage(coverage.value));
  assert.deepEqual(errors, [], `ORACLE-C12-CAPABILITY v15 七件身份、三十个稳定格或 pending 边界不符合冻结判据；judged identity=${identity.path ?? "unavailable"}, coverage=${coverage.path ?? "unavailable"}`);
});

test("ORACLE-C12-CAPABILITY 正例接受完整稳定格、八项身份、合法 mismatch 和 pending 未测", () => {
  const errors = validateCoverage(validFixture(), fixtureRead);
  assert.deepEqual(errors, [], "ORACLE-C12-CAPABILITY 完整三十格正例必须可判，合法 mismatch 不得被拒");
});

test("ORACLE-C12-CAPABILITY 反例拒绝缺 ready 格、match 造假、mismatch 写成 match 和 pending 伪稳定", () => {
  const missing = validFixture();
  missing.cells = missing.cells.filter(cell => !(cell.state === "ready" && cell.viewport === "390x844"));
  assert.ok(validateCoverage(missing, fixtureRead).some(error => error.includes("missing stable cell: ready 390x844")), "ORACLE-C12-CAPABILITY 缺 ready 格必须失败");
  const fabricated = validFixture();
  const fabricatedCell = fabricated.cells.find(cell => cell.state === "unknown" && cell.viewport === "1280x800");
  fabricatedCell.state_observation = { result: "match", observed: null, aria_busy: null };
  assert.ok(validateCoverage(fabricated, fixtureRead).some(error => error.includes("must be observed as unknown")), "ORACLE-C12-CAPABILITY 读不出标记仍写 match 必须失败");
  const mismatchAsMatch = validFixture();
  const mismatchCell = mismatchAsMatch.cells.find(cell => cell.state === "permission" && cell.viewport === "390x844");
  mismatchCell.state_observation = { result: "match", observed: "error", aria_busy: "false" };
  assert.ok(validateCoverage(mismatchAsMatch, fixtureRead).some(error => error.includes("match must agree")), "ORACLE-C12-CAPABILITY 把 mismatch 写成 match 必须失败");
  const pending = validFixture();
  pending.cells.push({ route: ROUTE, state: "pending", viewport: "390x844", state_observation: { result: "match" }, dimensions: {} });
  assert.ok(validateCoverage(pending, fixtureRead).some(error => error.includes("pending must not enter")), "ORACLE-C12-CAPABILITY pending 伪稳定格必须失败");
  const single = validFixture();
  single.pending.records = [single.pending.records[0]];
  assert.ok(validateCoverage(single, fixtureRead).some(error => error.includes("one 未测 record per viewport")), "ORACLE-C12-CAPABILITY pending 只留单条记录必须失败");
  const uncovered = validFixture();
  uncovered.pending.records[1] = { ...uncovered.pending.records[1], viewport: "390x844" };
  assert.ok(validateCoverage(uncovered, fixtureRead).some(error => error.includes("cover exactly the three frozen viewports")), "ORACLE-C12-CAPABILITY pending 每视口记录缺一必须失败");
  const duplicated = validFixture();
  duplicated.pending.records[0].reason = "";
  assert.ok(validateCoverage(duplicated, fixtureRead).some(error => error.includes("390x844 record must retain the locked 未测 reason")), "ORACLE-C12-CAPABILITY pending 记录缺锁定原因必须失败");
});

test("ORACLE-C12-CAPABILITY 目标 URL 必须是裸入口路由，状态只能由页内控件进入", () => {
  assert.equal(targetScopeViolation(TARGET_URL), null, "ORACLE-C12-CAPABILITY 裸路由必须被网关接受");
  assert.ok(!TARGET_URL.includes("?"), "ORACLE-C12-CAPABILITY v15 入口 URL 不得带查询串");
  assert.ok(COLLECT.includes(`--url '${TARGET_URL}'`), "ORACLE-C12-CAPABILITY 网关入口必须使用裸路由");
  assert.ok(!COLLECT.includes("--state="), "ORACLE-C12-CAPABILITY P2 卡未声明 --state 驱动参数，状态只能由页内控件进入");
  assert.ok(!COLLECT.includes("?state="), "ORACLE-C12-CAPABILITY 状态不得拼进入口 URL");
  assert.equal(targetScopeViolation(`${TARGET_URL}?state=unselected`), "target URL query is rejected by INVALID_TARGET_SCOPE: ?state=unselected", "ORACLE-C12-CAPABILITY 状态参数不得进入入口 URL");
  assert.equal(targetScopeViolation(`${TARGET_URL}?source=live`), null, "ORACLE-C12-CAPABILITY 网关唯一允许的 source=live 仍可接受");
});

test("ORACLE-C12-CAPABILITY 反例拒绝漏掉实际加载 CSS 的七件身份", () => {
  const identity = { files: expectedFiles.filter(row => !row.path.startsWith("v11/")), aggregate: expectedAggregate, service_root: "docs/examples/c11-ui", route: ROUTE };
  const errors = validateIdentity(identity);
  assert.ok(errors.some(error => error.includes("v11/")), "ORACLE-C12-CAPABILITY 实际加载 CSS 必须进入七件身份");
});

test("ORACLE-C12-CAPABILITY URL 状态声明不能替代真实观察", () => {
  assert.equal(stateObservation("ready", TARGET_URL).result, "unknown");
  assert.equal(stateObservation("ready", `${TARGET_URL}?state=empty`).result, "mismatch");
  assert.equal(stateObservation("ready", `${TARGET_URL}?state=ready`).result, "match");
  // The helper can compare an observed URL parameter, but such a target would
  // be rejected by the gateway before any page is opened; state must be driven
  // through page interaction and observed from the page itself.
  assert.ok(targetScopeViolation(`${TARGET_URL}?state=empty`));
  assert.ok(targetScopeViolation(`${TARGET_URL}?state=ready`));
});
