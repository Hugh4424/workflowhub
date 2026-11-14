import test from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// ORACLE-C12-UPDATE: 12px→16px, the four verdicts and C10 ownership come from P3/spec.
// TCR-C12-001 (frozen-test change, independent merged review): the old
// readback check was not falsifiable—it only required that evidence_ref be
// readable and rejected a self-described source_task/executor == "C12". It now
// (a) requires the C10 original to live under the C10 task evidence root, and
// (b) cross-checks the original's object identity (name/version) against the
// C12 after-change identity, with a negative case that renames a C12-produced
// file under the C12 evidence root and labels it task:"C10". The same gateway
// query rule also applies to this driver's collect entry, so its target URL is
// now the bare route too. Oracle identity and assertion strength are unchanged.
//
// TCR-C12-004 (frozen-test change, user-confirmed by
// quality/evidence/human-confirmations/2026-11-14-004-build-code-gate-change-p2-p3-approved.json):
// the same three defects as TCR-C12-002/003 on the update-chain gate.
// 1. The gateway requires BROWSER_QA_TASK_ID before it starts; the frozen test
//    never supplied it, so the bare gate could not reach any assertion.
// 2. It pinned the first run's originals (102-two-pages-identity,
//    301-update-result, 302-update-identity, 305-update-computed,
//    306-update-readback). Evidence is write-once (same-path different bytes
//    fails EEXIST), so a re-run allocates a new series and a pinned read would
//    keep judging pre-fix bytes.
// 3. missingDriver() rewrote module absence into an ORACLE target failure.
// The fix changes only setup/selection: the task id is read from task.json with
// node:fs and passed in the child environment; the newest original of each
// family is resolved at run time with its expected run id (the two-pages
// identity stays the P1 run, the four update originals are this P3 run);
// module absence is SETUP-NOT-RED. The before/after nineteen-file identities,
// single controlled difference, computed-value verdicts and C10 readback
// boundary are untouched.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DRIVER = "tests/acceptance/c12-update-chain.mjs";
const TASK_ROOT = "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c12-acceptance-20261114";
const EVIDENCE_ROOT = join(TASK_ROOT, "quality/evidence");
const C10_TASK_ROOT = "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c10-release-onboarding-20261103";
const C10_EVIDENCE_ROOT = join(C10_TASK_ROOT, "quality/evidence");
// C12's changed object is the Phase 1 carrier; its post-update version is the
// content aggregate in update.after, so the C10 original must name this object
// and carry that version before a real readback can count.
const OBJECT_ROOT = "/Users/Hugh/Hugh/Project/c09-carrier-new-20261103";
const OBJECT_NAME = OBJECT_ROOT.split("/").pop();
// TCR-C12-004: derive the task id from the task manifest instead of requiring
// the caller to export it; the gateway and collect compare this value with
// openTask(...).identity.taskId.
const TASK_ID = (() => {
  const manifest = JSON.parse(readFileSync(join(TASK_ROOT, "task.json"), "utf8"));
  const taskId = manifest?.task_id;
  if (typeof taskId !== "string" || !taskId.trim()) throw new Error("SETUP-NOT-RED task.json carries no task_id");
  return taskId;
})();
// TCR-C12-004: no longer pin the first run's filenames. A re-run allocates a new
// evidence series, so each suffix selects its family and latestEvidence() picks
// the newest member; the two-pages identity is the P1 input (run c12-p1) and the
// four update originals must carry this gate's run id (c12-p3).
const TWO_PAGES_IDENTITY_SUFFIX = "-two-pages-identity.json";
const UPDATE_IDENTITY_SUFFIX = "-update-identity.json";
const UPDATE_COMPUTED_SUFFIX = "-update-computed.json";
const UPDATE_READBACK_SUFFIX = "-update-readback.json";
const UPDATE_RESULT_SUFFIX = "-update-result.json";
const P1_RUN_ID = "c12-p1";
const RUN_ID = "c12-p3";
const PREPARE = "node tests/acceptance/c12-update-chain.mjs prepare --run-id=c12-p3 --copy-root=/tmp/c12-c12-p1/carrier --port=41923 --task-record-root=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c12-acceptance-20261114";
const COLLECT = "eval \"$(node tests/acceptance/c12-update-chain.mjs browser-env --run-id=c12-p3 --task-record-root=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c12-acceptance-20261114)\" && bash skills/isolated-browser-qa/scripts/browser-qa-context.sh --run --url 'http://127.0.0.1:41923/simulation-board' --evidence-dir /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c12-acceptance-20261114/quality/evidence -- node tests/acceptance/c12-update-chain.mjs collect --run-id=c12-p3 --service-url=http://127.0.0.1:41923 --task-record-root=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c12-acceptance-20261114";
const CLEANUP = "node tests/acceptance/c12-update-chain.mjs cleanup --run-id=c12-p3 --copy-root=/tmp/c12-c12-p1/carrier --task-record-root=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c12-acceptance-20261114";
const ROUTES = ["/simulation-board", "/sim-workbench"];
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const aggregate = rows => sha256(Buffer.from([...rows].sort((a, b) => a.path.localeCompare(b.path)).map(row => `${row.path}\0${row.sha256}\n`).join("")));
let execution;

function run(command) {
  // TCR-C12-004: both steps inherit the manifest task id in their environment.
  const result = spawnSync("/bin/sh", ["-c", command], { cwd: ROOT, env: { ...process.env, BROWSER_QA_TASK_ID: TASK_ID }, encoding: "utf8", timeout: 600_000, maxBuffer: 16 * 1024 * 1024 });
  return { status: result.status, signal: result.signal, error: result.error?.code ?? null, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}
function deliver() {
  if (!execution) {
    const prepare = run(PREPARE);
    const collect = prepare.status === 0 ? run(COLLECT) : null;
    const cleanup = prepare.status === 0 ? run(CLEANUP) : null;
    execution = { prepare, collect, cleanup };
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
// TCR-C12-004: resolve the newest original in one evidence family. Originals are
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
function syncVerdict({ build = "success", service = "success", pages }) {
  if (build !== "success" || service !== "success") return "未测";
  const changed = ROUTES.filter(route => {
    const page = pages.find(row => row.route === route);
    return page?.before === "12px" && page?.after === "16px";
  }).length;
  return changed === 2 ? "可用" : changed === 1 ? "部分可用" : "不可用";
}
function validateUpdateIdentity(update, p1) {
  const errors = [];
  if (!update?.before || !update?.after) return ["update before/after identities are missing"];
  if (!p1?.aggregate) errors.push("Phase 1 identity is unavailable");
  else if (update.before.aggregate !== p1.aggregate) errors.push("update before identity differs from Phase 1");
  if (!Array.isArray(update.before.files) || update.before.files.length !== 19 || !Array.isArray(update.after.files) || update.after.files.length !== 19) errors.push("update identities must each contain nineteen files");
  if (update.before.aggregate !== aggregate(update.before.files ?? [])) errors.push("before aggregate is not reproducible");
  if (update.after.aggregate !== aggregate(update.after.files ?? [])) errors.push("after aggregate is not reproducible");
  if (update.after.aggregate === update.before.aggregate) errors.push("controlled update must change the aggregate");
  const differences = Array.isArray(update.differences) ? update.differences : [];
  if (differences.length !== 1 || differences[0]?.path !== "app/globals.css") errors.push("only app/globals.css may differ");
  const beforeRows = new Map((update.before.files ?? []).map(row => [row.path, row.sha256]));
  const afterRows = new Map((update.after.files ?? []).map(row => [row.path, row.sha256]));
  const changed = [...beforeRows.keys()].filter(path => beforeRows.get(path) !== afterRows.get(path));
  if (changed.length !== 1 || changed[0] !== "app/globals.css" || beforeRows.size !== afterRows.size) errors.push("per-file identities must show exactly one controlled difference");
  if (update.controlled_change?.path !== "app/globals.css" || update.controlled_change?.before !== "--inline-action-gap:12px" || update.controlled_change?.after !== "--inline-action-gap:16px") errors.push("controlled line must be exactly --inline-action-gap:12px to --inline-action-gap:16px");
  return errors;
}
function validateComputed(computed) {
  const errors = [];
  if (!computed || !Array.isArray(computed.pages)) return ["computed pages are missing"];
  const routes = new Set(computed.pages.map(page => page.route));
  if (computed.pages.length !== 2 || routes.size !== 2 || ROUTES.some(route => !routes.has(route))) errors.push("computed evidence must contain both locked routes exactly once");
  for (const route of ROUTES) {
    const page = computed.pages.find(row => row.route === route);
    if (!page) continue;
    if (page.selector !== ".inlineactions") errors.push(`wrong computed selector: ${route}`);
    if (typeof page.before !== "string" || typeof page.after !== "string") errors.push(`computed before/after values missing: ${route}`);
    for (const key of ["engine", "engine_session", "object_version"]) if (typeof page[key] !== "string" || !page[key]) errors.push(`computed identity missing ${key}: ${route}`);
    if (route === "/simulation-board" && (typeof page.action !== "string" || !page.action)) errors.push("board must record its display action before reading .inlineactions");
  }
  const expected = syncVerdict(computed);
  if (computed.sync !== expected) errors.push(`sync verdict ${computed.sync} does not follow computed values; expected ${expected}`);
  return errors;
}
function validateReadback(readback, { after = null, read = readJson } = {}) {
  const errors = [];
  if (!readback || readback.task !== "C10") return ["readback owner must be C10"];
  if (readback.status === "未测") {
    if (readback.owner !== "C10" || readback.recovery_condition !== "C10 运行时读回新版") errors.push("C10 未测 must retain owner and recovery condition");
    if (readback.evidence_ref !== null) errors.push("C10 未测 cannot carry a fabricated evidence reference");
  } else {
    const ref = readback.evidence_ref;
    if (readback.source_task === "C12" || readback.executor === "C12") errors.push("same-task replay must not masquerade as C10 readback");
    if (typeof ref !== "string" || !ref) errors.push("non-未测 readback requires a readable C10 original");
    else {
      const path = isAbsolute(ref) ? resolve(ref) : resolve(C10_TASK_ROOT, ref);
      if (path !== C10_EVIDENCE_ROOT && !path.startsWith(C10_EVIDENCE_ROOT + sep)) {
        errors.push(`non-未测 readback original must live under the C10 task evidence root: ${ref}`);
      } else {
        const original = read(path);
        if (original.error) errors.push(`non-未测 readback original is unreadable: ${original.error}`);
        else {
          const object = original.value?.object;
          if (!after?.aggregate) errors.push("C12 after-change identity is unavailable for the readback cross-check");
          if (typeof object?.name !== "string" || !object.name) errors.push("C10 readback original must carry object.name");
          if (typeof object?.version !== "string" || !object.version) errors.push("C10 readback original must carry object.version");
          if (object?.name && object.name !== OBJECT_NAME) errors.push("C10 readback object name differs from the C12 changed object");
          if (object?.version && after?.aggregate && object.version !== after.aggregate) errors.push("C10 readback object version differs from the C12 after-change identity");
        }
      }
    }
  }
  return errors;
}
function page(route, after, before = "12px") {
  return { route, selector: ".inlineactions", before, after, action: route === "/simulation-board" ? "show run details" : "direct read", engine: "e", engine_session: "es", object_version: "ov" };
}
const hashes = changed => {
  const rows = Array.from({ length: 19 }, (_, index) => ({ path: index === 0 ? "app/globals.css" : `file-${index}`, sha256: sha256(`${index}`) }));
  if (changed) rows[0].sha256 = sha256("16px");
  return rows;
};

test("ORACLE-C12-UPDATE 额外差异或同任务 C10 冒名必须拒绝，且两页计算值决定同步四值", () => {
  const { prepare, collect, cleanup } = deliver();
  // TCR-C12-004: module/driver absence is a setup gap on the planned command,
  // never the ORACLE target failure the P3 card asks this gate to judge.
  if (missingDriver(prepare)) assert.fail(`SETUP-NOT-RED update prepare: ${DRIVER} is not implemented yet; a missing module or driver is a setup gap, not the ORACLE target failure`);
  assertSetup(prepare, "update prepare");
  assertSetup(collect, "update collect");
  assertSetup(cleanup, "update cleanup");
  // TCR-C12-004: judge the newest original of each family instead of the first
  // run's pinned filenames. The two-pages identity is the P1 input; the four
  // update originals must carry this gate's run id.
  const p1 = readLatest(TWO_PAGES_IDENTITY_SUFFIX);
  const identity = readLatest(UPDATE_IDENTITY_SUFFIX);
  const computed = readLatest(UPDATE_COMPUTED_SUFFIX);
  const readback = readLatest(UPDATE_READBACK_SUFFIX);
  const result = readLatest(UPDATE_RESULT_SUFFIX);
  const errors = [];
  if (!p1.error && p1.value?.run_id !== P1_RUN_ID) errors.push(`Phase 1 identity original run_id must be ${P1_RUN_ID}: observed ${p1.value?.run_id ?? "missing"} (${p1.path})`);
  if (!identity.error && identity.value?.run_id !== RUN_ID) errors.push(`update identity original run_id must be ${RUN_ID}: observed ${identity.value?.run_id ?? "missing"} (${identity.path})`);
  if (!computed.error && computed.value?.run_id !== RUN_ID) errors.push(`computed original run_id must be ${RUN_ID}: observed ${computed.value?.run_id ?? "missing"} (${computed.path})`);
  if (!readback.error && readback.value?.run_id !== RUN_ID) errors.push(`readback original run_id must be ${RUN_ID}: observed ${readback.value?.run_id ?? "missing"} (${readback.path})`);
  if (!result.error && result.value?.run_id !== RUN_ID) errors.push(`update result original run_id must be ${RUN_ID}: observed ${result.value?.run_id ?? "missing"} (${result.path})`);
  if (p1.error) errors.push(`Phase 1 identity unavailable (${p1.path ?? `quality/evidence/*${TWO_PAGES_IDENTITY_SUFFIX}`}): ${p1.error}`);
  if (identity.error) errors.push(`update identity unavailable (${identity.path ?? `quality/evidence/*${UPDATE_IDENTITY_SUFFIX}`}): ${identity.error}`); else errors.push(...validateUpdateIdentity(identity.value, p1.value));
  if (computed.error) errors.push(`computed original unavailable (${computed.path ?? `quality/evidence/*${UPDATE_COMPUTED_SUFFIX}`}): ${computed.error}`); else errors.push(...validateComputed(computed.value));
  if (readback.error) errors.push(`readback original unavailable (${readback.path ?? `quality/evidence/*${UPDATE_READBACK_SUFFIX}`}): ${readback.error}`); else errors.push(...validateReadback(readback.value, { after: identity.error ? null : identity.value?.after }));
  if (result.error) errors.push(`update result unavailable (${result.path ?? `quality/evidence/*${UPDATE_RESULT_SUFFIX}`}): ${result.error}`);
  else {
    if (!computed.error && result.value.sync !== computed.value.sync) errors.push("summary sync differs from computed original");
    if (!readback.error && readback.value.status === "未测" && result.value.ac_c12_004 !== "未测") errors.push("C10 未读回时 AC-C12-004 必须保持未测");
  }
  assert.deepEqual(errors, [], `ORACLE-C12-UPDATE 单行差异、计算值分类或 C10 读回边界不符合冻结判据；judged p1=${p1.path ?? "unavailable"}, update=${identity.path ?? "unavailable"}, computed=${computed.path ?? "unavailable"}, readback=${readback.path ?? "unavailable"}, result=${result.path ?? "unavailable"}`);
});

test("ORACLE-C12-UPDATE 正例按两页计算值给出四种同步判词", () => {
  assert.equal(syncVerdict({ pages: [page(ROUTES[0], "16px"), page(ROUTES[1], "16px")] }), "可用");
  assert.equal(syncVerdict({ pages: [page(ROUTES[0], "16px"), page(ROUTES[1], "12px")] }), "部分可用");
  assert.equal(syncVerdict({ pages: [page(ROUTES[0], "12px"), page(ROUTES[1], "12px")] }), "不可用");
  assert.equal(syncVerdict({ build: "failed", pages: [page(ROUTES[0], "16px"), page(ROUTES[1], "16px")] }), "未测");
  assert.deepEqual(validateComputed({ pages: [page(ROUTES[0], "16px"), page(ROUTES[1], "16px")], sync: "可用" }), []);
});

test("ORACLE-C12-UPDATE 正例接受 C10 证据根内带对象身份的读回原件", () => {
  const after = { aggregate: aggregate(hashes(true)) };
  const original = { object: { name: OBJECT_NAME, version: after.aggregate } };
  const readback = { task: "C10", status: "可用", evidence_ref: join(C10_EVIDENCE_ROOT, "2026-11-14-001-c10-readback.json") };
  assert.deepEqual(validateReadback(readback, { after, read: () => ({ value: original }) }), [], "ORACLE-C12-UPDATE C10 原件必须在 C10 证据根内且对象身份与 C12 改后身份一致");
});

test("ORACLE-C12-UPDATE 反例拒绝额外差异与同任务 C10 冒名", () => {
  const before = { files: hashes(false), aggregate: aggregate(hashes(false)) };
  const after = { files: hashes(true), aggregate: aggregate(hashes(true)) };
  after.files[1].sha256 = sha256("extra");
  after.aggregate = aggregate(after.files);
  const update = { before, after, differences: [{ path: "app/globals.css" }, { path: "file-1" }], controlled_change: { path: "app/globals.css", before: "--inline-action-gap:12px", after: "--inline-action-gap:16px" } };
  const errors = validateUpdateIdentity(update, before);
  assert.ok(errors.some(error => error.includes("only app/globals.css")), "ORACLE-C12-UPDATE 额外文件差异必须拒绝");
  const sameTask = { task: "C10", source_task: "C12", status: "可用", evidence_ref: join(EVIDENCE_ROOT, "c12-replay.json") };
  assert.ok(validateReadback(sameTask, { after }).some(error => error.includes("same-task replay")), "ORACLE-C12-UPDATE 同任务重放不得冒名 C10");
  // Rename a C12-produced file and label it task:"C10": the C10 evidence-root
  // prefix check must reject it even when its object identity copies C12's.
  const renamed = { task: "C10", status: "可用", evidence_ref: join(EVIDENCE_ROOT, "2026-11-14-999-renamed-c10-readback.json") };
  const renamedErrors = validateReadback(renamed, { after, read: () => ({ value: { object: { name: OBJECT_NAME, version: after.aggregate } } }) });
  assert.ok(renamedErrors.some(error => error.includes("C10 task evidence root")), "ORACLE-C12-UPDATE C12 自产文件改名冒 C10 必须拒绝");
  const wrongVersion = { task: "C10", status: "可用", evidence_ref: join(C10_EVIDENCE_ROOT, "readback.json") };
  assert.ok(validateReadback(wrongVersion, { after, read: () => ({ value: { object: { name: OBJECT_NAME, version: "deadbeef" } } }) }).some(error => error.includes("object version differs")), "ORACLE-C12-UPDATE 读回对象版本与 C12 改后身份不符必须拒绝");
  const wrongName = { task: "C10", status: "可用", evidence_ref: join(C10_EVIDENCE_ROOT, "readback.json") };
  assert.ok(validateReadback(wrongName, { after, read: () => ({ value: { object: { name: "another-object", version: after.aggregate } } }) }).some(error => error.includes("object name differs")), "ORACLE-C12-UPDATE 读回对象名与 C12 对象不符必须拒绝");
});
