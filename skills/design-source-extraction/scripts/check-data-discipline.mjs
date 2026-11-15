#!/usr/bin/env node
// 数据与状态纪律的唯一私有检查入口。消费者是 P3 数据实施者与独立测试者；
// 本脚本只服务设计源提炼技能的数据面，不进入公共运行时命令面。
//
// 两种用法：
//   --fixture <dir>                纯检查：校验八份状态夹具，退出 0=合规，1=有目标违规，2=不可读/参数错误。
//   --mode=serve --fixture <dir> --listen=127.0.0.1 --port=8768 \
//       --port-output-record <P2-port-output.json> --store <store.json>
//                                  真实本地受控服务：提供页面、读取路由、POST /records 与 GET /identity。
//
// 失败码以本脚本 issue()（夹具问题）与 main/startServe 的 error.code（运行问题）为唯一来源，文档不复刻副本。
import {existsSync, readFileSync, statSync, writeFileSync, mkdirSync, realpathSync} from "node:fs";
import {createServer} from "node:http";
import {isAbsolute, join, posix, resolve} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {createHash} from "node:crypto";

export const STATES = ["loading", "success", "empty", "error", "timeout", "receipt", "sample", "real"];
export const FAILURE_CLASSES = ["timeout", "unknown_failure", "server_error", "not_found", "client_error"];

// 失败分档纯函数：未知/无状态一律进入保守失败档，绝不落入 success。
export function classifyReadFailure({status, error_name, code} = {}) {
  const name = String(error_name ?? "");
  const signal = String(code ?? "").toUpperCase();
  if (name === "AbortError" || signal === "TIMEOUT" || signal === "ETIMEDOUT" || signal === "ABORT_ERR") return "timeout";
  if (!Number.isInteger(status) || status <= 0) return "unknown_failure";
  if (status >= 500) return "server_error";
  if (status === 404) return "not_found";
  if (status >= 400) return "client_error";
  if (status >= 200 && status < 300) return "success";
  return "unknown_failure";
}

// 单状态判定口：把一次读取响应折叠成唯一 ViewModel kind，未知一律 error，不补造内容。
export function resolveReadState({status, body, error_name, code} = {}) {
  const failure = classifyReadFailure({status, error_name, code});
  if (failure !== "success") return {kind: failure === "timeout" ? "timeout" : "error", failure, records: []};
  const records = Array.isArray(body && body.records) ? body.records : null;
  if (records === null) return {kind: "error", failure: "unknown_failure", records: []};
  if (records.length === 0) return {kind: "empty", failure: null, records: []};
  return {kind: "success", failure: null, records};
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function issue(code, detail) {
  return {code, detail};
}

// 校验八份夹具的组合语义。返回 {ok, issues, summary}。
export function validateFixtureDir(dir) {
  const issues = [];
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    return {ok: false, issues: [issue("FIXTURE_DIR_UNREADABLE", `fixture dir not readable: ${dir}`)], summary: null};
  }
  const names = ["loading", "success", "empty", "error", "timeout", "write-receipt", "sample-mode", "real-mode"];
  const docs = {};
  for (const name of names) {
    const file = join(dir, `${name}.json`);
    if (!existsSync(file)) {
      issues.push(issue("MISSING_FIXTURE", `${name}.json is missing`));
      continue;
    }
    try {
      const value = readJson(file);
      if (value === null || typeof value !== "object" || Array.isArray(value)) {
        issues.push(issue("FIXTURE_SHAPE_INVALID", `${name}.json must be a non-null object`));
        continue;
      }
      docs[name] = value;
    } catch (error) {
      issues.push(issue("FIXTURE_INVALID_JSON", `${name}.json: ${error.message}`));
    }
  }
  const require = (cond, code, detail) => {
    if (!cond) issues.push(issue(code, detail));
  };
  const has = (doc, key) => doc && typeof doc === "object" && doc[key] !== undefined && doc[key] !== null;

  for (const name of names) {
    const doc = docs[name];
    if (!doc) continue;
    require(doc.schema_version === "1.0.0", "SCHEMA_UNSUPPORTED", `${name}.json schema_version must be 1.0.0`);
    require(doc.kind === "data-state-fixture", "KIND_UNSUPPORTED", `${name}.json kind must be data-state-fixture`);
  }

  const loading = docs.loading;
  if (loading) {
    require(loading.expected_state === "loading", "STATE_MISMATCH", "loading.expected_state must be loading");
    require(has(loading, "ui_binding") && loading.ui_binding.aria_busy === "true", "LOADING_BINDING_MISSING", "loading.ui_binding.aria_busy must be true");
  }

  const success = docs.success;
  if (success) {
    require(success.expected_state === "success", "STATE_MISMATCH", "success.expected_state must be success");
    const records = success.read_route && success.read_route.body && success.read_route.body.records;
    require(Array.isArray(records) && records.length > 0, "SUCCESS_EMPTY_RECORDS", "success.read_route.body.records must be non-empty");
    require(Array.isArray(records) && records.length === success.expected_records_count, "SUCCESS_COUNT_MISMATCH", "success.expected_records_count must match records length");
  }

  const empty = docs.empty;
  if (empty) {
    require(empty.expected_state === "empty", "STATE_MISMATCH", "empty.expected_state must be empty");
    const records = empty.read_route && empty.read_route.body && empty.read_route.body.records;
    require(Array.isArray(records) && records.length === 0, "EMPTY_FILLED", "empty.read_route.body.records must be empty (no fill)");
    require(empty.fill_policy === "no_fill", "EMPTY_FILL_POLICY", "empty.fill_policy must be no_fill");
  }

  const error = docs.error;
  if (error) {
    require(error.expected_state === "error", "STATE_MISMATCH", "error.expected_state must be error");
    const status = error.read_route && error.read_route.status;
    require(Number.isInteger(status) && status >= 400, "ERROR_STATUS_INVALID", "error.read_route.status must be a failure status");
    require(FAILURE_CLASSES.includes(error.failure_class) && error.failure_class !== "timeout", "ERROR_CLASS_INVALID", "error.failure_class must be a non-timeout failure class");
    require(error.unknown_code_policy === "conservative_failure", "UNKNOWN_NOT_CONSERVATIVE", "error.unknown_code_policy must be conservative_failure");
    const cases = Array.isArray(error.classification_cases) ? error.classification_cases : [];
    require(cases.length > 0, "CLASSIFICATION_CASES_MISSING", "error.classification_cases must not be empty");
    for (const [index, testCase] of cases.entries()) {
      const actual = classifyReadFailure(testCase.input || {});
      require(actual === testCase.expected, "CLASSIFICATION_MISMATCH", `error.classification_cases[${index}] expected ${testCase.expected} got ${actual}`);
    }
  }

  const timeout = docs.timeout;
  if (timeout) {
    require(timeout.expected_state === "timeout", "STATE_MISMATCH", "timeout.expected_state must be timeout");
    require(Number.isInteger(timeout.delay_ms) && Number.isInteger(timeout.timeout_ms) && timeout.delay_ms > timeout.timeout_ms, "TIMEOUT_NOT_SLOWER", "timeout.delay_ms must exceed timeout.timeout_ms");
    require(timeout.failure_class === "timeout", "TIMEOUT_CLASS", "timeout.failure_class must be timeout");
  }

  const receipt = docs["write-receipt"];
  if (receipt) {
    require(receipt.expected_state === "receipt", "STATE_MISMATCH", "write-receipt.expected_state must be receipt");
    require(receipt.success_requires_receipt === true, "RECEIPT_NOT_REQUIRED", "write-receipt.success_requires_receipt must be true");
    const request = receipt.request || {};
    require(typeof request.recordId === "string" && request.recordId !== "", "RECEIPT_REQUEST_INVALID", "write-receipt.request.recordId is required");
    require(typeof request.value === "string" && request.value !== "", "RECEIPT_REQUEST_INVALID", "write-receipt.request.value is required");
    require(typeof request.requestId === "string" && request.requestId !== "", "RECEIPT_REQUEST_INVALID", "write-receipt.request.requestId is required");
    const expected = receipt.expected_receipt;
    const realReceipt = expected && typeof expected === "object"
      && typeof expected.receipt_id === "string" && expected.receipt_id !== ""
      && expected.source === "service_store";
    require(realReceipt, "NO_RECEIPT_SUCCESS", "write-receipt.expected_receipt must be a real service_store receipt");
  }

  const sample = docs["sample-mode"];
  if (sample) {
    require(sample.expected_state === "sample", "STATE_MISMATCH", "sample-mode.expected_state must be sample");
    const annotations = sample.annotations || {};
    require(annotations.layer_count === 3 && annotations.page && annotations.block && annotations.value, "SAMPLE_ANNOTATION_MISSING", "sample-mode needs the three sample layers");
    const policy = sample.write_policy || {};
    require(policy.allowed === false, "SAMPLE_WRITE_ALLOWED", "sample-mode.write_policy.allowed must be false");
    require(policy.control === "present", "CONTROL_DEGRADED", "sample-mode.write_policy.control must be present, not removed");
    const sourceKind = sample.source && sample.source.kind;
    require(sourceKind === "synthetic", "SAMPLE_POSES_AS_REAL", "sample-mode.source.kind must be synthetic (a sample must not pose as real)");
  }

  const real = docs["real-mode"];
  if (real) {
    require(real.expected_state === "real", "STATE_MISMATCH", "real-mode.expected_state must be real");
    require(real.sample_annotations_expected === 0, "REAL_SAMPLE_RESIDUAL", "real-mode.sample_annotations_expected must be 0");
    const rulings = Array.isArray(real.conflict_rulings) ? real.conflict_rulings : [];
    require(rulings.length > 0, "CONFLICT_RULINGS_MISSING", "real-mode.conflict_rulings must not be empty");
    for (const [index, ruling] of rulings.entries()) {
      const parties = Array.isArray(ruling.parties) ? ruling.parties : [];
      require(parties.length >= 2 && parties.every((party) => party && typeof party.source === "string" && typeof party.view === "string"), "CONFLICT_RULING_INCOMPLETE", `real-mode.conflict_rulings[${index}] needs two parties with source and view`);
      require(typeof ruling.adjudicator === "string" && ruling.adjudicator !== "", "CONFLICT_RULING_INCOMPLETE", `real-mode.conflict_rulings[${index}].adjudicator is required`);
      require(typeof ruling.conclusion === "string" && ruling.conclusion !== "", "CONFLICT_RULING_INCOMPLETE", `real-mode.conflict_rulings[${index}].conclusion is required`);
      require(typeof ruling.impact === "string" && ruling.impact !== "", "CONFLICT_RULING_INCOMPLETE", `real-mode.conflict_rulings[${index}].impact is required`);
    }
  }

  const summary = {
    fixture_dir: resolve(dir),
    states: names.map((name) => (docs[name] && docs[name].state) || name),
    fixtures: names,
    docs: Object.keys(docs).sort(),
    issue_count: issues.length,
    codes: issues.map((item) => item.code),
  };
  return {ok: issues.length === 0, issues, summary};
}

// ---------------------------------------------------------------------------
// serve 模式：真实本地受控服务。
// ---------------------------------------------------------------------------
function loadServeRoutes(fixtureDir) {
  const routes = new Map();
  const addRoute = (name) => {
    const doc = readJson(join(fixtureDir, `${name}.json`));
    const route = doc.read_route;
    if (route && typeof route.record_id === "string" && !routes.has(route.record_id)) {
      routes.set(route.record_id, {status: route.status, delay_ms: route.delay_ms || 0, body: route.body});
    }
  };
  for (const name of ["success", "empty", "error", "timeout"]) addRoute(name);
  return routes;
}

function send(response, status, payload, type = "application/json") {
  const body = typeof payload === "string" || Buffer.isBuffer(payload) ? payload : JSON.stringify(payload);
  response.writeHead(status, {"content-type": type, "cache-control": "no-store"});
  response.end(body);
}

export function startServe({fixtureDir, listen = "127.0.0.1", port = 8768, portOutputRecord, store}) {
  if (!portOutputRecord || !existsSync(portOutputRecord)) {
    throw Object.assign(new Error(`--port-output-record is required and must exist: ${portOutputRecord}`), {code: "PORT_OUTPUT_RECORD_UNAVAILABLE"});
  }
  const record = readJson(portOutputRecord);
  const outputRoot = record && record.output_root;
  if (typeof outputRoot !== "string" || !isAbsolute(outputRoot) || !existsSync(outputRoot)) {
    throw Object.assign(new Error(`port output record has no readable output_root: ${outputRoot}`), {code: "OUTPUT_ROOT_UNAVAILABLE"});
  }
  if (!store) throw Object.assign(new Error("--store is required"), {code: "STORE_REQUIRED"});
  const routes = loadServeRoutes(fixtureDir);
  const requests = [];
  const storeFile = resolve(store);
  mkdirSync(join(storeFile, ".."), {recursive: true});
  if (!existsSync(storeFile)) writeFileSync(storeFile, "[]\n");
  const readStore = () => {
    try { return JSON.parse(readFileSync(storeFile, "utf8")); } catch { return []; }
  };
  const writeStore = (rows) => writeFileSync(storeFile, `${JSON.stringify(rows, null, 2)}\n`);
  let startedAt = new Date().toISOString();

  const server = createServer((request, response) => {
    const url = new URL(request.url, `http://${listen}:${port}`);
    const pathname = decodeURIComponent(url.pathname);
    const identity = {
      ok: true,
      url: `http://${listen}:${port}`,
      pid: process.pid,
      port,
      output_root: outputRoot,
      fixture_ref: resolve(fixtureDir),
      mode: "serve",
      record_ids: [...routes.keys()].sort(),
      request_count: requests.length,
      started_at: startedAt,
    };
    if (request.method === "GET" && pathname === "/identity") {
      requests.push({method: "GET", path: pathname, at: new Date().toISOString()});
      return send(response, 200, {...identity, request_count: requests.length});
    }
    if (request.method === "GET" && pathname === "/requests") {
      return send(response, 200, {requests});
    }
    if (request.method === "GET" && pathname.startsWith("/records/")) {
      const recordId = pathname.slice("/records/".length);
      requests.push({method: "GET", path: pathname, record_id: recordId, at: new Date().toISOString()});
      const route = routes.get(recordId);
      if (!route) return send(response, 404, {error: "RECORD_NOT_FOUND", recordId});
      const deliver = () => send(response, route.status, route.body);
      if (route.delay_ms > 0) return setTimeout(deliver, route.delay_ms);
      return deliver();
    }
    if (request.method === "POST" && pathname === "/records") {
      let raw = "";
      request.on("data", (chunk) => { raw += chunk; });
      request.on("end", () => {
        let payload = {};
        try { payload = raw ? JSON.parse(raw) : {}; } catch { return send(response, 400, {error: "BAD_JSON"}); }
        requests.push({method: "POST", path: pathname, body: payload, at: new Date().toISOString()});
        if (typeof payload.recordId !== "string" || payload.recordId === "") return send(response, 400, {error: "RECORD_ID_REQUIRED"});
        if (typeof payload.requestId !== "string" || payload.requestId === "") return send(response, 400, {error: "REQUEST_ID_REQUIRED"});
        const rows = readStore();
        const receipt = {
          receipt_id: `rcpt-${String(rows.length + 1).padStart(2, "0")}`,
          recordId: payload.recordId,
          value: typeof payload.value === "string" ? payload.value : "",
          requestId: payload.requestId,
          status: "stored",
          source: "service_store",
          at: new Date().toISOString(),
        };
        rows.push({recordId: receipt.recordId, value: receipt.value, requestId: receipt.requestId, receipt_id: receipt.receipt_id});
        writeStore(rows);
        return send(response, 200, receipt);
      });
      return undefined;
    }
    if (request.method === "GET") {
      const rel = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
      const file = join(outputRoot, rel);
      const normalized = resolve(file);
      if (!(normalized === resolve(outputRoot) || normalized.startsWith(resolve(outputRoot) + "/")) || !existsSync(normalized) || statSync(normalized).isDirectory()) {
        return send(response, 404, "not found", "text/plain");
      }
      const type = normalized.endsWith(".css") ? "text/css" : normalized.endsWith(".js") ? "text/javascript" : normalized.endsWith(".html") ? "text/html" : "application/octet-stream";
      return send(response, 200, readFileSync(normalized), type);
    }
    return send(response, 405, {error: "METHOD_NOT_ALLOWED"});
  });

  return new Promise((resolveStart, rejectStart) => {
    server.once("error", rejectStart);
    server.listen(port, listen, () => {
      server.off("error", rejectStart);
      startedAt = new Date().toISOString();
      process.stdout.write(JSON.stringify({event: "data-service-ready", url: `http://${listen}:${port}`, pid: process.pid, port, output_root: outputRoot, fixture_ref: resolve(fixtureDir), store: storeFile}) + "\n");
      resolveStart({server, url: `http://${listen}:${port}`, pid: process.pid, outputRoot, store: storeFile});
    });
  });
}

export function parseArgs(argv) {
  const options = {mode: "check", fixture: null, listen: "127.0.0.1", port: 8768, portOutputRecord: null, store: null};
  for (let index = 0; index < argv.length; index += 1) {
    let name = argv[index];
    let inline = null;
    if (name.startsWith("--") && name.includes("=")) {
      const split = name.indexOf("=");
      inline = name.slice(split + 1);
      name = name.slice(0, split);
    }
    const take = () => {
      if (inline !== null) return inline;
      const value = argv[index + 1];
      if (value === undefined || value.startsWith("--")) throw Object.assign(new Error(`${name} needs a value`), {code: "ARGUMENT_INVALID"});
      index += 1;
      return value;
    };
    if (name === "--mode") options.mode = take();
    else if (name === "--fixture") options.fixture = take();
    else if (name === "--listen") options.listen = take();
    else if (name === "--port") options.port = Number(take());
    else if (name === "--port-output-record") options.portOutputRecord = take();
    else if (name === "--store") options.store = take();
    else throw Object.assign(new Error(`unknown argument: ${name}`), {code: "ARGUMENT_INVALID"});
  }
  return options;
}

export async function main(argv = process.argv.slice(2)) {
  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    process.stderr.write(JSON.stringify({error: {code: error.code || "ARGUMENT_INVALID", detail: error.message}}) + "\n");
    process.exitCode = 2;
    return;
  }
  if (!options.fixture) {
    process.stderr.write(JSON.stringify({error: {code: "FIXTURE_REQUIRED", detail: "--fixture is required"}}) + "\n");
    process.exitCode = 2;
    return;
  }
  if (options.mode === "check") {
    let result;
    try {
      result = validateFixtureDir(options.fixture);
    } catch (error) {
      process.stderr.write(JSON.stringify({error: {code: error.code || "FIXTURE_UNREADABLE", detail: error.message}}) + "\n");
      process.exitCode = 2;
      return;
    }
    process.stdout.write(JSON.stringify({ok: result.ok, mode: "check", ...result.summary}) + "\n");
    if (!result.ok) {
      process.stderr.write(JSON.stringify({error: {code: result.issues[0].code, issues: result.issues}}) + "\n");
      process.exitCode = 1;
    }
    return;
  }
  if (options.mode === "serve") {
    try {
      await startServe({fixtureDir: options.fixture, listen: options.listen, port: options.port, portOutputRecord: options.portOutputRecord, store: options.store});
    } catch (error) {
      process.stderr.write(JSON.stringify({error: {code: error.code || "SERVE_FAILED", detail: error.message}}) + "\n");
      process.exitCode = 2;
    }
    return;
  }
  process.stderr.write(JSON.stringify({error: {code: "MODE_UNKNOWN", detail: `unknown mode: ${options.mode}`}}) + "\n");
  process.exitCode = 2;
}

function isInvokedSelf() {
  if (!process.argv[1]) return false;
  try { return realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
}
if (isInvokedSelf()) main();
