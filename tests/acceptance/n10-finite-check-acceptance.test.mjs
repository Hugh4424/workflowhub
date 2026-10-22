import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { openTask, createTask } from "../../runtime/task/task-handle.mjs";

// ORACLE-N10-FINAL-ACCEPTANCE. Appendix A is authoritative; this is a consumer
// of first-owner execution originals, not another implementation of their rules.
const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const TASK = realpathSync(process.env.N10_TASK_ROOT ?? "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n10-finite-check-wiring-20261020");
const WRITER = openTask(TASK, { projectName: "workflowhub", taskId: "n10-finite-check-wiring-20261020" });
const MATERIAL = "specs/n10-finite-check-wiring-20261020";
const BASE = "0c3087580f841d3e38c249466462351c0a3a019e";
const BEFORE = "b8856e5ef5f18e67b51e9660c662d52efc174a1b";
const EVIDENCE = join(TASK, "quality/evidence/n10-finite-check-wiring-20261020");
const RAW = join(EVIDENCE, "raw");
const GROUPS = { CHECK: 6, SOURCE: 6, MATERIAL: 6, METHOD: 4, SET: 6, PROCESS: 8 };
const IDS = Object.entries(GROUPS).flatMap(([group, size]) => Array.from({ length: size }, (_, i) => `AC-${group}-${i + 1}`));
const REQUIREMENT_PHASES = {
  R: ["12345", "123", "12", "5", "1234567", "15", "5", "12345", "7", "12", "5", "1", "5", "123", "1234567", "5", "1234567", "3", "2", "7", "6", "6", "6", "6", "6", "5", "5"],
  U: ["", "1234567", "5", "", "", "", "", "5", "3", "12345", "2", "1", "123", "2", "3", "3", "3", "4", "5", "7", "7", "6", "6", "6", "6", "6", "6", "5", "5"],
};
function requirementEvidence(id) {
  const [kind, number] = id.split("-");
  const phases = REQUIREMENT_PHASES[kind][Number(number)-1];
  return results.filter(row => [...phases].some(phase => row.owner.split("/").includes(`P${phase}`))).map(row => row.evidence_ref);
}
const HUMAN = new Set(["AC-METHOD-1", "AC-METHOD-2", "AC-METHOD-3", "AC-METHOD-4", "AC-PROCESS-6", "AC-PROCESS-7"]);
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const text = path => readFileSync(path, "utf8");
const json = path => JSON.parse(text(path));
const external = rel => join(TASK, rel);
const repository = rel => join(ROOT, rel);
const results = [];
const commands = [];
const originals = new Map();
let activeRefs;
let aggregate, noargs, materials, chain, resident, residentRef, beforeHashes, head;
const original = path => {
  const bytes = readFileSync(path);
  const ref = { path, sha256: hash(bytes), bytes: bytes.length };
  originals.set(path, ref);
  activeRefs?.set(path, ref);
  return ref;
};

async function immutable(dir, name, value) {
  mkdirSync(dir, { recursive: true });
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`);
  const fixed = join(dir, name);
  // Compare actual bytes before reuse; reports are immutable on a different run.
  if (existsSync(fixed) && readFileSync(fixed).equals(bytes)) return fixed;
  for (const name of readdirSync(dir)) {
    const candidate = join(dir, name);
    if (statSync(candidate).isFile() && candidate.endsWith(`.${fixed.split(".").at(-1)}`) && readFileSync(candidate).equals(bytes)) return candidate;
  }
  if (!existsSync(fixed)) return (await WRITER.createRecord(relative(WRITER.taskPath, fixed), bytes)).path;
  return WRITER.appendRecord({dir:relative(WRITER.taskPath,dir), slug:`p7-${name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0,40)}`, ext:fixed.split(".").at(-1), bytes});
}

function sameCommand(a, b) {
  return Number.isInteger(a.exit_code) && Number.isInteger(b.exit_code)
    && JSON.stringify(a.argv) === JSON.stringify(b.argv) && a.cwd === b.cwd
    && a.exit_code === b.exit_code && a.signal === b.signal && a.timed_out === b.timed_out;
}
async function commandOutput(dir, label, stream, bytes, record, records) {
  mkdirSync(dir,{recursive:true}); const incoming=Buffer.from(bytes);
  for (const previous of records) {
    const ref=previous[`${stream}_ref`];
    if (!ref || !sameCommand(previous,record)) continue;
    try {
      const rel=relative(realpathSync(dir),realpathSync(ref));
      if (rel===".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) continue;
      if (readFileSync(ref).equals(incoming)) return ref;
    }
    catch (error) { console.log(JSON.stringify({deduplication:"unknown",reason:`candidate bytes not obtainable (${error.code??error.name}); preserve new output`,label,stream})); }
  }
  console.log(JSON.stringify({deduplication:"unknown",reason:"No candidate with verified identical argv/cwd/exit/signal/timeout/stream and bytes; preserve new command output",label,stream}));
  return WRITER.appendRecord({dir:relative(WRITER.taskPath,dir),slug:`p7-${label}-${stream}`.slice(0,48),ext:"txt",bytes:incoming});
}
function taskEvidencePath(path) {
  const root=join(TASK,"quality");
  if (typeof path!=="string" || !isAbsolute(path) || realpathSync(root)!==root) throw Object.assign(new Error("evidence reference is outside the current task quality root"),{code:"EVIDENCE_PATH_OUTSIDE_TASK"});
  const real=realpathSync(path), rel=relative(root,real);
  if (rel===".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw Object.assign(new Error("evidence reference is outside the current task quality root"),{code:"EVIDENCE_PATH_OUTSIDE_TASK"});
  return real;
}
function failureDetails(error) {
  return { name: error.name, message: error.message, code: error.code ?? null, path: error.path ?? null, syscall: error.syscall ?? null, errors: error.errors?.map(failureDetails) ?? [] };
}
function ownerFor(id) {
  return id.includes("PROCESS") ? "P6" : id.includes("METHOD") ? "P4" : id.includes("MATERIAL") ? "P3" : id === "AC-SOURCE-6" || /AC-SET-(1|2|3|6)$/.test(id) ? "P5" : id.includes("SOURCE") ? "P2" : id.startsWith("AC-CHECK") ? "P1/P2/P3" : "P7";
}

async function run(args, label, { rawRoot = RAW, records = commands, timeout = 120_000 } = {}) {
  const env = { ...process.env }; delete env.RUN_CHECKS_FORCE_FAIL_CHECKER;
  const value = spawnSync(process.execPath, args, { cwd: ROOT, env, encoding: "utf8", timeout, maxBuffer: 64 * 1024 * 1024 });
  const record = { argv: [process.execPath, ...args], cwd: ROOT, executor: "P7/T033-T034", exit_code: value.status, signal: value.signal, timed_out: value.error?.code === "ETIMEDOUT", error: value.error ? failureDetails(value.error) : null, stdout_ref: null, stderr_ref: null };
  records.push(record);
  try {
    record.stdout_ref = await commandOutput(rawRoot,label,"stdout",value.stdout ?? "",record,records);
    record.stderr_ref = await commandOutput(rawRoot,label,"stderr",value.stderr ?? "",record,records);
  } catch (writeError) {
    // Preserve both real errors; never invent a fallback evidence directory.
    throw value.error ? new AggregateError([value.error, writeError], "command failure and output persistence failure") : writeError;
  }
  if (value.error) throw value.error;
  if (value.signal) throw Object.assign(new Error(`command terminated by ${value.signal}`), { signal: value.signal });
  return { ...record, stdout: value.stdout, stderr: value.stderr };
}

function receipt(name, { path = external(`quality/tests/2026-10-21-${name}.json`), readOutput = text } = {}) {
  path=taskEvidencePath(path);
  const data = json(path); original(path);
  expect(data.exit_code, path).toBe(0); expect(data.signal, path).toBeNull();
  expect(data.timed_out, path).toBe(false); expect(data.argv.join(" "), path).toContain("vitest run");
  expect(data.cwd).toBe(ROOT);
  const outputPath=taskEvidencePath(data.output_ref);
  const output = readOutput(outputPath); original(outputPath);
  expect(output, path).toMatch(/Test Files\s+\d+ passed/);
  expect(output, path).not.toMatch(/^[ \t]*(?:Test Files|Tests)\s+\d+ failed/m);
  return { ...data, path, output };
}
function logged(output) {
  return output.split("\n").filter(line => line.startsWith("{")).map(line => JSON.parse(line));
}
function summary(name) {
  const path = join(EVIDENCE, name); original(path); return json(path);
}
function source(path) { const file = repository(path); original(file); return text(file); }
function ownerOutput(name, testFile) {
  const data = receipt(name);
  expect(data.argv).toContain(testFile);
  expect(data.output).toContain(testFile);
  return data;
}
function dispositionRows(spec) {
  const block = spec.split("## Appendix B")[1].split("## Appendix C")[0];
  const sources = block.split("\n").filter(line => /^\| \d+ \|/.test(line));
  const mechanisms = block.split("\n").filter(line => /^\| E-\d+ /.test(line));
  expect(sources).toHaveLength(17); expect(mechanisms).toHaveLength(10);
  for (const line of [...sources, ...mechanisms]) expect(line).toMatch(/\| (?:已生效读回|本次接线验证|不采用) \|/);
  for (const number of [13, 15, 17]) expect(sources.find(line => line.startsWith(`| ${number} |`))).toContain("| 不采用 |");
  return { sources: 17, mechanisms: 10, figure_it_out: 1, boundary: "separate denominators; not 28 new mechanisms" };
}
function proveChain(data) {
  expect(data.task_id).toBe("n10-finite-check-wiring-20261020");
  expect(data.material_root).toBe(join(ROOT, MATERIAL));
  expect(data.rings.map(row => row.ring)).toEqual([1,2,3,4,5,6,7,8,9,10]);
  for (const row of data.rings) {
    expect(["completed", "skipped", "not_applicable", "incomplete", "unavailable"]).toContain(row.state);
    expect(row.counted_in_denominator).toBe(row.state !== "not_applicable");
  }
  const applicable = data.rings.filter(row => row.counted_in_denominator).length;
  const completed = data.rings.filter(row => row.state === "completed").length;
  expect(data.completion).toMatchObject({ applicable, completed, rate: applicable ? completed / applicable : null });
}

async function collectInitialization(action, state) {
  try { return await action(); }
  catch (error) { state.failure = failureDetails(error); state.original_error = error; throw error; }
}
const mainSetup = { phase: "P7", inputs_complete: false };

beforeAll(async () => collectInitialization(async () => {
  mkdirSync(RAW, { recursive: true });
  head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).stdout.trim();
  expect(json(external("task.json")).task_id).toBe("n10-finite-check-wiring-20261020");
  const spec = source(`${MATERIAL}/spec.md`);
  const declared = [...spec.split("## Appendix A")[1].split("## Appendix B")[0].matchAll(/\*\*(AC-(?:CHECK|SOURCE|MATERIAL|METHOD|SET|PROCESS)-\d+)\*\*/g)].map(match => match[1]);
  expect(declared).toEqual(IDS);
  const validator = source("runtime/evidence/acceptance-evidence-validator.mjs");
  expect(validator).toContain('"pass", "fail", "inconclusive", "deferred", "missing", "inconsistent", "incomplete", "unavailable"');
  // Capture precise authoritative materials in memory only; no directory snapshot.
  beforeHashes = new Map([`${MATERIAL}/spec.md`, `${MATERIAL}/decision-log.md`, "skills/catalog.yaml", "specs/archive/n8-four-level-route-20261019/spec.md", "specs/archive/n8-four-level-route-20261019/phases/P7-四级验收与成本对照.md"].map(path => [path, hash(readFileSync(repository(path)))]));
  for (const [phase, name] of Object.entries({ P1: "P1-check-core.json", P2: "P2-source-registry.json", P3: "P3-material-contract.json", P4: "P4-method-readback.json", P5: "P5-finite-set.json" })) { mainSetup.phase = phase; summary(name); }
  for (const name of readdirSync(repository(`${MATERIAL}/phases`)).filter(name => /^P[1-6]-/.test(name))) { mainSetup.phase = name.slice(0,2); original(repository(`${MATERIAL}/phases/${name}`)); }
  mainSetup.phase = "P6";
  original(join(EVIDENCE, "P6/P6-current-done-after-073-074.md"));
  original(join(EVIDENCE, "P6/tcr074/repair-result.json"));
  original(join(EVIDENCE, "P6/tcr074/green.output"));
  const repair = json(join(EVIDENCE, "P6/tcr074/repair-result.json"));
  expect(repair.red).toMatchObject({ exit_code: 1, target_failures: 18, setup_failures: 0 });
  expect(repair.green.exit_code).toBe(0);
  expect(text(repair.green.output_ref)).toContain("52 passed");
  for (const name of ["012-build-code-phase-p1", "024-build-code-phase-p2", "036-build-code-phase-p3", "046-build-code-phase-p4", "063-build-code-phase-p5", "073-build-code-phase-p6"]) { mainSetup.phase = `P${name.match(/-p(\d)$/)[1]}`; original(external(`quality/reviews/2026-10-21-${name}.json`)); }
  for (const name of ["039-n10-p1-findings-fix", "041-n10-p1-review-scope-disposition"]) { mainSetup.phase = "P1"; original(external(`quality/evidence/2026-10-21-${name}.json`)); }
  for (const name of ["062-p3-findings-t012-green", "063-p3-findings-t014-green", "065-p3-tcr4-green", "067-p3-final-gate-tcr5"]) { mainSetup.phase = "P3"; receipt(name); }
  mainSetup.inputs_complete = true; mainSetup.phase = "P7";
  await immutable(EVIDENCE, "P7-data-readiness.json", { status: "pass", executor: "P7", scope: "P1-P6 first-owner originals and later repairs readable; no P8 implementation evidence", sources: [...originals.values()] });
  await immutable(EVIDENCE, "P7-environment-readiness.json", { status: "pass", cwd: ROOT, task: TASK, head, node: process.version, vitest: json(require.resolve("vitest/package.json")).version, scope: "offline CLI; no browser/provider/network; normal 36-AC CLI uses no temporary root; controlled regression fixtures own and clean temporary inputs" });
  noargs = await run(["tools/cli/run-checks.mjs"], "p7-aggregate");
  materials = await run(["tools/cli/run-checks.mjs", "--material-root", join(ROOT, MATERIAL)], "p7-material");
  const result = await run(["tools/cli/run-checks.mjs", "--task-path", TASK], "p7-chain");
  expect(result.exit_code, "N9 must be real single JSON, never unsupported fallback").toBe(0);
  chain = JSON.parse(result.stdout); proveChain(chain);
}, mainSetup), 120_000);

async function accept(id, action, { records = results, rawRoot = RAW } = {}) {
  activeRefs = new Map();
  let status = "pass", reason = "Original owner behavior evidence and current readback agree within Appendix A boundary.";
  try { await action(); }
  catch (error) { status = error.code === "ENOENT" ? "missing" : ["EACCES", "EPERM", "EIO", "ENOTDIR", "ELOOP"].includes(error.code) ? "unavailable" : error.code === "ETIMEDOUT" ? "inconclusive" : error instanceof SyntaxError ? "inconsistent" : "fail"; reason = JSON.stringify(failureDetails(error)); throw error; }
  finally {
    const refs = [...activeRefs.values()]; activeRefs = undefined;
    const owner = ownerFor(id);
    const raw = { id, status, owner, executor: "P7/T033-T034", mode: HUMAN.has(id) ? "human readback with machine evidence; not machine semantic validation" : "machine replay/readback of original execution", reason, refs, command_refs: commands.map(({ argv, cwd, executor, exit_code, signal, timed_out, stdout_ref, stderr_ref }) => ({ argv, cwd, executor, exit_code, signal, timed_out, stdout_ref, stderr_ref })), limits: "No independent quality verdict; no N8 four-route execution or P8 disk acceptance; N9 report is completion facts, not ten completed rings." };
    const path = await immutable(rawRoot, `${id}.json`, raw);
    records.push({ id, status, owner, evidence_ref: path, reason, mode: raw.mode });
  }
}

function core() { return ownerOutput("017-n10-p1-final-gate", "tests/contract/n10-check-core.test.mjs"); }
function material() { return ownerOutput("067-p3-final-gate-tcr5", "tests/contract/n10-material-contract.test.mjs"); }
function finite() { return ownerOutput("077-p5-repaired-gate", "tests/contract/n10-n9-interface.test.mjs"); }
function method() { return ownerOutput("071-p4-method-harness", "tests/contract/n10-method-readback.test.mjs"); }
function processRepair() {
  const path = join(EVIDENCE, "P6/tcr074/repair-result.json"); original(path);
  const data = json(path); original(data.green.output_ref);
  expect(data.green.exit_code).toBe(0); expect(text(data.green.output_ref)).toContain("n10-process-repair.test.mjs");
  expect(text(data.green.output_ref)).not.toMatch(/Tests\s+\d+ failed/);
  return data;
}
const SCENARIOS = {
  "AC-CHECK-2": {
    "file": "tests/contract/n10-check-core.test.mjs",
    "cases": [
      "names an empty root and default root without claiming zero warnings"
    ]
  },
  "AC-CHECK-3": {
    "file": "tests/contract/n10-check-core.test.mjs",
    "cases": [
      "names an unreadable file without a Node stack",
      "rejects unknown arguments instead of scanning defaults",
      "distinguishes missing and non-directory roots from empty input",
      "names invalid and unreadable consistency roots without Node stacks",
      "rejects bad aggregate arguments and names real blocking failure",
      "reports incomplete reads without an exit-0 success summary and still reads valid siblings"
    ]
  },
  "AC-SOURCE-2": {
    "file": "tests/contract/n10-source-registry.test.mjs",
    "cases": [
      "[AC-SOURCE-2] catalog declared source violation is named and byte restoration clears it",
      "[AC-SOURCE-2] catalog pin violation is named and byte restoration clears it",
      "[AC-SOURCE-2] catalog license violation is named and byte restoration clears it",
      "[AC-SOURCE-2] deleted notice reports unavailable and one missing outlet per skill then restores",
      "[AC-SOURCE-2] vendor one-byte drift reports both hashes and clears after byte restoration",
      "[AC-SOURCE-2] active retired debate dependency retains the existing hard failure"
    ]
  },
  "AC-SOURCE-3": {
    "file": "tests/contract/n10-source-registry.test.mjs",
    "cases": [
      "[AC-SOURCE-3] empty catalog \"\" is not a passed check",
      "[AC-SOURCE-3] empty catalog \"# empty source\\n\" is not a passed check",
      "[AC-SOURCE-3] empty catalog \"skills: []\\n\" is not a passed check",
      "[AC-SOURCE-3] missing or malformed catalog remains exit one; nonempty decisions are not zero input"
    ]
  },
  "AC-MATERIAL-5": {
    "file": "tests/contract/n10-material-contract.test.mjs",
    "cases": [
      "T013 exposes real template shape while a damaged real index remains an error",
      "T016 reports only five known templates and leaves author prose unscored"
    ]
  }
};
function checkCutover(green, redOutput, skippedCases) {
  const required=["tests/contract/ocr-delegation-route.test.mjs","tests/contract/ocr-production-cutover.test.mjs"];
  for(const path of required) { expect(green.argv).toContain(path); expect(green.output).toContain(path); }
  expect(green.argv.filter(arg=>arg.endsWith(".test.mjs"))).toEqual(required);
  expect(redOutput).toMatch(/3 failed/); expect(green.output).toMatch(/50 passed/);
  expect(green.output).toMatch(/1 skipped/); expect(green.output).not.toMatch(/Tests\s+\d+ failed/);
  const skip="ORACLE-P3-ROUTE: non_stage/build_prd remains on its report-only entrypoint";
  const file=skippedCases.testResults.find(row=>row.name===join(ROOT,required[0]));
  const selected=file.assertionResults.find(row=>row.title===skip);
  expect(selected?.status).toBe("skipped");
  const sourceText=source(required[0]), declaration=`it.skip(${JSON.stringify(skip)})`;
  expect(sourceText).toContain(declaration);
  const before=sourceText.slice(0,sourceText.indexOf(declaration)).split("\n").slice(-5).join("\n");
  expect(before).toContain("rejects stage=build-prd before either injected runner");
  expect(before).toContain("cannot prove that seventh retained surface's dispatch choice");
  const redPath=taskEvidencePath(external("quality/tests/2026-10-21-001-n10-p1-t005-red.json"));original(redPath);const redReceipt=json(redPath);
  expect(redReceipt.exit_code).toBe(1);for(const path of required)expect(redReceipt.argv).toContain(path);
  const redRef=taskEvidencePath(redReceipt.output_ref);original(redRef);expect(redOutput).toBe(text(redRef));
  const redFailures=[...redOutput.matchAll(/^ FAIL  (.+)$/gm)].map(match=>match[1]);
  expect(redFailures).toHaveLength(3);
  expect(redFailures).toEqual([
    "tests/contract/ocr-production-cutover.test.mjs > OCR production cutover defaults > routes ordinary phase through OCR without a candidate flag or legacy dispatch",
    "tests/contract/ocr-production-cutover.test.mjs > OCR production cutover defaults > routes ordinary final through OCR without a candidate flag or legacy dispatch",
    "tests/contract/ocr-production-cutover.test.mjs > OCR production cutover defaults > keeps an explicit candidate flag compatible with the same OCR route",
  ]);
}
function readCitedRow(row, rows) {
  const expected=rows.find(value=>value.id===row.id); expect(expected).toBeTruthy();
  for(const key of ["id","path","line","kind","trigger"]) expect(row[key]).toBe(expected[key]);
  const expectedLog=method().output.split("\n").find(line=>line.startsWith("N10_P4_SUMMARY "));
  const recorded=JSON.parse(expectedLog.slice("N10_P4_SUMMARY ".length)).rows.find(value=>value.id===row.id);
  for(const key of ["id","path","line","kind","trigger"]) expect(row[key]).toBe(recorded[key]);
  const path=resolve(ROOT,row.path); expect(path.startsWith(`${ROOT}${sep}`)).toBe(true);
  const lines=source(row.path).split("\n");
  const selected=row.line.split(",").flatMap(range=>{
    const match=/^(\d+)(?:-(\d+))?$/.exec(range); expect(match).toBeTruthy();
    const first=Number(match[1]), last=Number(match[2]??match[1]);
    expect(first>=1 && last>=first && last<=lines.length).toBe(true);
    expect(lines[first-1].trim()).not.toBe("");return lines.slice(first-1,last);
  });
  expect(selected.some(line=>line.trim())).toBe(true);
  expect(["machine","manual","both"]).toContain(row.kind);
  if(row.kind!=="machine") {expect(row.path.endsWith(".md")).toBe(true);expect(row.trigger.startsWith("人读：")).toBe(true);expect(row.trigger).not.toMatch(/npx|node /u);}
  else expect(row.path.endsWith(".md")).toBe(false);
  return selected.join("\n");
}
function checkGaps(value) {
  if(value==="无") return;
  expect(Array.isArray(value)).toBe(true);expect(value.length).toBeGreaterThan(0);
  for(const row of value) for(const key of ["缺什么","补哪个文件","怎么验证","影响谁"]) {expect(typeof row[key]).toBe("string");expect(row[key].trim()).not.toBe("");}
}
function checkNamedEvidence(id, record, body, machine) {
  const required=SCENARIOS[id];expect(required).toBeTruthy();
  expect(record.argv).toContain(required.file);expect(record.exit_code).toBe(0);
  const file=machine.testResults.find(row=>row.name===join(ROOT,required.file));expect(file).toBeTruthy();
  for(const name of required.cases) {const actual=file.assertionResults.find(row=>row.title===name);expect(actual,name).toBeTruthy();expect(actual.status,name).toBe("passed");}
}
function checkNamedRing(rows) {
  const originalHash=hash(Buffer.from("# N10 controlled test input\nThe named original requirement must remain readable.\n"));
  const expected=[['named-ring-positive','completed'],['named-ring-missing','unavailable'],['named-ring-restored','completed']];
  for(const [name,state] of expected) {
    const row=rows.find(row=>row.scenario===name);expect(row).toBeTruthy();expect(row.exit).toBe(0);expect(row.signal).toBeNull();expect(row.error).toBeNull();
    const ring=JSON.parse(row.stdout).rings[0];expect(ring.ring).toBe(1);expect(ring.name).toBe("原始需求");expect(ring.state).toBe(state);
    if(state==="completed") {expect(ring.basis[0].ref).toBe("quality/evidence/raw-requirements/n10-controlled.md");expect(ring.basis[0].sha256).toBe(originalHash);}
  }
  const restored=rows.find(row=>row.scenario==="named-ring-restoration");expect(restored.restored_same_bytes).toBe(true);expect(restored.sha256).toBe(originalHash);
}

const cases = {
  "AC-CHECK-1": () => { core(); material(); expect(noargs.exit_code).toBe(0); expect(noargs.stdout).not.toMatch(/index-template.*missing/); },
  "AC-CHECK-2": () => { core(); ownerOutput("030-p2-source-green-repair", "tests/contract/n10-source-registry.test.mjs"); material(); checkNamedEvidence("AC-CHECK-2", namedEvidence().record, source("tests/contract/n10-check-core.test.mjs"), namedEvidence().machine); },
  "AC-CHECK-3": () => { core(); receipt("022-n10-p1-followup-green"); receipt("026-n10-p1-finding-regression"); checkNamedEvidence("AC-CHECK-3", namedEvidence().record, source("tests/contract/n10-check-core.test.mjs"), namedEvidence().machine); },
  "AC-CHECK-4": () => { const rows = logged(core().output); for (const scenario of ["duplicate registration violation", "missing required_skills violation"]) expect(rows.find(row => row.scenario === scenario).exit).toBe(1); for (const scenario of ["duplicate registration byte-identical restore", "required_skills byte-identical restore", "decision byte-identical restore"]) expect(rows.find(row => row.scenario === scenario).exit).toBe(0); expect(rows.find(row => row.scenario === "real decision source unchanged").byte_identical).toBe(true); },
  "AC-CHECK-5": () => { expect(noargs.exit_code).toBe(0); expect(noargs.stdout.match(/^\[run-checks\] running /gm)).toHaveLength(6); expect(noargs.stderr).toBe("[run-checks] material check not run: no --material-root\n"); expect(noargs.stdout).not.toContain("[run-checks][material]"); expect(noargs.stdout).not.toContain('"rings"'); },
  "AC-CHECK-6": () => { const red = external("quality/tests/2026-10-21-001-n10-p1-t005-red.output"); const green = receipt("003-n10-p1-t005-green"); original(red); checkCutover(green, text(red), namedEvidence().machine); },
  "AC-SOURCE-1": () => { ownerOutput("030-p2-source-green-repair", "tests/contract/n10-source-registry.test.mjs"); expect(noargs.exit_code).toBe(0); expect(noargs.stdout).toContain("source-registry"); },
  "AC-SOURCE-2": () => { ownerOutput("030-p2-source-green-repair", "tests/contract/n10-source-registry.test.mjs"); const body = source("tests/contract/n10-source-registry.test.mjs"); checkNamedEvidence("AC-SOURCE-2", namedEvidence().record, body, namedEvidence().machine); },
  "AC-SOURCE-3": () => { ownerOutput("030-p2-source-green-repair", "tests/contract/n10-source-registry.test.mjs"); const body = source("tests/contract/n10-source-registry.test.mjs"); checkNamedEvidence("AC-SOURCE-3", namedEvidence().record, body, namedEvidence().machine); },
  "AC-SOURCE-4": () => { ownerOutput("030-p2-source-green-repair", "tests/contract/n10-source-registry.test.mjs"); dispositionRows(source(`${MATERIAL}/spec.md`)); expect(source("THIRD_PARTY_NOTICES.md")).toContain("figure-it-out"); expect(source("skills/catalog.yaml")).toContain("consumer-only"); },
  "AC-SOURCE-5": () => { ownerOutput("030-p2-source-green-repair", "tests/contract/n10-source-registry.test.mjs"); expect(noargs.exit_code).toBe(0); const s = summary("P2-source-registry.json"); expect(s.resident_docs_bytes).toBeTruthy(); },
  "AC-SOURCE-6": () => { finite(); const path = external("quality/evidence/source-originals/source-originals-index.json"); original(path); const data = json(path); expect(data.sources).toHaveLength(13); let drift = 0; for (const row of data.sources) { expect(row.status).toBe("fetched"); expect(row.license).toBeTruthy(); expect(row.upstream_snapshot_url).toMatch(/^https:/); const a = readFileSync(join(dirname(path), row.snapshot_path)); const b = readFileSync(join(dirname(path), row.head_path)); expect(hash(a)).toBe(row.snapshot_sha256); expect(hash(b)).toBe(row.head_sha256); if (!a.equals(b)) drift++; original(join(dirname(path), row.snapshot_path)); original(join(dirname(path), row.head_path)); } expect(drift).toBe(4); },
  "AC-MATERIAL-1": () => { const data = material(); expect(data.output).toContain("errors=2"); expect(materials.exit_code, materials.stderr).toBe(0); expect(materials.stdout).toContain("errors=0"); },
  "AC-MATERIAL-2": () => { material(); const path = external("quality/evidence/2026-10-21-113-p3-production-mutations-restore.json"); original(path); const proof = json(path); expect(proof.byte_identical).toBe(true); expect(proof.mutations.every(row => row.receipt.exit_code === 1)).toBe(true); },
  "AC-MATERIAL-3": () => { material(); receipt("063-p3-findings-t014-green"); const rows = logged(material().output); expect(rows.some(row => row.exit === 0 && /没有输入|不适用/.test(row.stdout))).toBe(true); },
  "AC-MATERIAL-4": () => { const rows = logged(material().output); expect(rows.some(row => row.exit === 0 && row.stdout.includes("不适用"))).toBe(true); expect(rows.some(row => row.exit === 1 && /phase/i.test(row.stdout))).toBe(true); },
  "AC-MATERIAL-5": () => { material(); const path = join(EVIDENCE, "content-gaps.json"); original(path); checkGaps(json(path)); checkNamedEvidence("AC-MATERIAL-5",namedEvidence().record,source("skills/spec-plan/templates/index-template.md"),namedEvidence().machine); },
  "AC-MATERIAL-6": () => { receipt("062-p3-findings-t012-green"); receipt("065-p3-tcr4-green"); const rows = logged(material().output); expect(rows.some(row => row.exit === 1 && /N\/A|deferred/.test(row.stdout))).toBe(true); expect(rows.some(row => row.exit === 0)).toBe(true); },
  "AC-METHOD-1": () => { method(); const data = summary("P4-method-readback.json"); expect(data.readback.rows.filter(row => row.id.startsWith("C"))).toHaveLength(13); for (const row of data.readback.rows) { readCitedRow(row, data.readback.rows); } },
  "AC-METHOD-2": () => { const record = method(); const data = summary("P4-method-readback.json"); expect(data.four_states.map(row => row.state)).toEqual(["S0", "S1", "S2", "S3"]); expect(data.four_states.map(row => row.exit)).toEqual([0,0,1,0]); expect(data.restore.restored).toBe(true); expect(hash(readFileSync(repository(data.restore.source_ref)))).toBe(data.restore.source_sha256); expect(record.output).toContain("N10_P4"); },
  "AC-METHOD-3": () => { method(); const rows = summary("P4-method-readback.json").readback.rows; for (const row of rows) expect(["machine", "manual", "both"]).toContain(row.kind); expect(rows.filter(row => row.kind === "manual").length).toBeGreaterThanOrEqual(3); expect(source("tests/fixtures/n10-method-readback.json")).toContain("人读"); },
  "AC-METHOD-4": () => { const record = method(); expect(record.output).toContain('"name":"pstack::correct"'); expect(record.output).toContain('"name":"pstack::encode-lessons-in-structure"'); expect(record.output).toContain('"status":"watch"'); expect(source("THIRD_PARTY_NOTICES.md")).toContain("1f0f9c3bac03c4297f6fc8f7644fa412eda57085"); },
  "AC-SET-1": () => { finite(); dispositionRows(source(`${MATERIAL}/spec.md`)); },
  "AC-SET-2": () => { finite(); const body = source("workflows/verify-code/SKILL.md"); for (const phrase of ["错在范围修", "通过太易时先查观察方法", "已验证/未验证/无法判断", "同一修正复发"]) expect(body).toContain(phrase); const pointer = source("skills/stage-reflection/SKILL.md"); expect(pointer).toContain("verify-code"); },
  "AC-SET-3": () => { proveChain(chain); const rows = logged(finite().output); for (const name of ["named-ring-positive", "named-ring-missing", "named-ring-restored"]) expect(rows.find(row => row.scenario === name).exit).toBe(0); expect(rows.some(row => row.scenario === "bad-task-or-arguments" && row.exit === 2)).toBe(true); },
  "AC-SET-4": () => { expect(noargs.exit_code).toBe(0); expect(noargs.stdout.match(/^\[run-checks\] running /gm)).toHaveLength(6); expect(materials.exit_code).toBe(0); expect(materials.stdout).toContain("[run-checks][material] PASS"); expect(materials.stdout).toContain("errors=0"); expect(noargs.stdout).toMatch(/WARNING|reports/); proveChain(chain); },
  "AC-SET-5": async () => {
    const listed = ["skills/spec-specify/SKILL.md", ...readdirSync(repository("skills/spec-plan/templates")).filter(p => p.endsWith(".md")).map(p => `skills/spec-plan/templates/${p}`), "workflows/make-decision/SKILL.md", "workflows/verify-code/SKILL.md", "workflows/make-decision/steps.json", "workflows/make-decision/flows/normal/SKILL.md", "skills/wh-review/contracts/make-decision.md", `${MATERIAL}/n8-corrections.md`, "docs/adr/0052-direction-review-before-module-convergence.md", "skills/stage-reflection/SKILL.md", "skills/catalog.yaml", "THIRD_PARTY_NOTICES.md", "skills/reuse-registry.md"];
    const changed = spawnSync("git", ["diff", "--name-only", BEFORE], { cwd: ROOT, encoding: "utf8" }); expect(changed.status).toBe(0);
    const all = [...new Set([...listed, ...changed.stdout.trim().split("\n").filter(p => /\.(md|yaml|json)$/.test(p) && p !== "specs/Improvements.md" && !p.startsWith("tests/")), "docs/research/n10-finite-check-acceptance-runbook.md"])].sort();
    const rows = all.map(path => { const before = spawnSync("git", ["show", `${BEFORE}:${path}`], { cwd: ROOT, maxBuffer: 16 * 1024 * 1024 }); expect([0,128]).toContain(before.status); const old = before.status === 0 ? before.stdout : Buffer.alloc(0); const now = readFileSync(repository(path)); const wc = spawnSync("wc", ["-c", repository(path)], { cwd: ROOT, encoding: "utf8" }); expect(wc.status).toBe(0); expect(Number(wc.stdout.trim().split(/\s+/)[0])).toBe(now.length); return { path, denominator: listed.includes(path) ? "AC-SET-5 explicit resident-document set" : "supplement: changed governance/new runbook, not hidden in code", before_bytes: old.length, after_bytes: now.length, delta: now.length-old.length, before_sha256: hash(old), after_sha256: hash(now), wc_stdout: wc.stdout, reason: old.equals(now) ? "unchanged; explicit denominator retained" : path.includes("P7") || path.includes("acceptance") ? "P7 evidence/consumer navigation and truthful executable acceptance" : path.includes("catalog") || path.includes("NOTICES") || path.includes("registry") ? "P2 source coordinates/notices/consumer-only registration; finite source responsibility" : path.includes("make-decision") || path.includes("0052") || path.includes("n8-corrections") ? "P6 direction-before-module identity/corrections; archived original untouched" : "P1-P6 approved wiring/material/registry or Phase integration explanation" }; });
    resident = { before_commit: BEFORE, current_head: head, measurement: "git show bytes in memory and wc -c current files; no copied originals/directory snapshot", declaration: "本卡不声称严格不增", denominator: { explicit_files: listed.length, supplementary_files: rows.length-listed.length, excludes: "production/test code; unrelated preexisting Improvements.md dirty bytes" }, rows, total_before_bytes: rows.reduce((a,r)=>a+r.before_bytes,0), total_after_bytes: rows.reduce((a,r)=>a+r.after_bytes,0), duplicate_boundary: "figure-it-out full text only in verify-code; stage-reflection pointer only; no duplicated upstream outputs or vendored source text" };
    residentRef = await immutable(EVIDENCE, "P7-resident-bytes.json", resident); original(residentRef);
  },
  "AC-SET-6": () => { proveChain(chain); checkNamedRing(logged(finite().output)); dispositionRows(source(`${MATERIAL}/spec.md`)); expect(source("runtime/task/final-chain.mjs")).toContain("rings"); },
  "AC-PROCESS-1": () => { processRepair(); expect(source("workflows/make-decision/SKILL.md")).toContain("方向审"); expect(json(repository("workflows/make-decision/steps.json")).steps).toHaveLength(15); },
  "AC-PROCESS-2": () => { processRepair(); const path = join(EVIDENCE, "P6/readback.json"); original(path); const data = json(path); expect(data.outline_same_bytes).toBe(true); expect(data.outline_inline_sha256).toBe(data.outline_file_sha256); expect(data.U021_context_lines.length).toBeGreaterThan(0); },
  "AC-PROCESS-3": () => { processRepair(); expect(source("skills/wh-review/contracts/make-decision.md")).toContain("骨架"); },
  "AC-PROCESS-4": () => { const data = processRepair(); for (const [path, expected] of Object.entries(data.preservation.archive_hashes)) expect(hash(readFileSync(repository(path)))).toBe(expected); expect(source(`${MATERIAL}/n8-corrections.md`)).toContain("incomplete"); expect(source("workflows/make-decision/flows/normal/SKILL.md")).toContain("跳过"); },
  "AC-PROCESS-5": () => { processRepair(); const path = join(EVIDENCE, "P6/preflight-write-set-repair/contract-check-final.json"); original(path); expect(text(path)).toContain('"errors": []'); expect(noargs.exit_code).toBe(0); },
  "AC-PROCESS-6": () => { processRepair(); const log = source(`${MATERIAL}/decision-log.md`); expect(log).toContain("重开清单为空"); expect(log).toContain("方向审查前确认"); },
  "AC-PROCESS-7": () => { processRepair(); const log = source(`${MATERIAL}/decision-log.md`); expect(log).toContain("partial"); expect(log).toContain("U-025"); expect(log).toContain("失败"); expect(log).toContain("取消"); original(external("quality/reviews/2026-10-21-073-build-code-phase-p6.json")); },
  "AC-PROCESS-8": () => { processRepair(); const path = join(EVIDENCE, "P6/probe-result.json"); original(path); const data = json(path); expect(data.strict_carrier.ok).toBe(true); expect(data.pid_alive_after_return).toBe(false); expect(data.group_alive_after_return).toBe(false); for (const name of ["probe-start.json", "probe.stdout", "probe.stderr"]) original(join(EVIDENCE, `P6/${name}`)); const log = source(`${MATERIAL}/decision-log.md`); for (const name of ["RC-1", "RC-2", "RC-3"]) expect(log).toContain(name); expect(text(join(EVIDENCE, "P6/P6-current-done-after-073-074.md"))).toContain("RC2严格carrier未修"); },
};

describe("ORACLE-N10-FINAL-ACCEPTANCE original 36 AC (P8 excluded)", () => {
  for (const id of IDS) it(id, () => accept(id, cases[id]), 30_000);
});

async function publishAggregate({ resultRows = results, commandRecords = commands, reportRoot = EVIDENCE, rawRoot = RAW, setup = mainSetup } = {}) {
  const results = resultRows;
  const commands = commandRecords;
  try {
  // Every missing row is explicitly unexecuted, never fabricated success. Keep
  // rows already produced by accept() and retain the first initialization error.
  const lastCommand = commands.at(-1);
  const directCommandAC = !lastCommand ? [] : lastCommand.argv.includes("--task-path") ? ["AC-SET-3", "AC-SET-4", "AC-SET-6"] : lastCommand.argv.includes("--material-root") ? ["AC-MATERIAL-1", "AC-SET-4"] : ["AC-CHECK-1", "AC-CHECK-5", "AC-SOURCE-1", "AC-SOURCE-5", "AC-PROCESS-5", "AC-SET-4"];
  for (const id of IDS.filter(id => !results.some(row => row.id === id))) {
    const owner = ownerFor(id);
    const inputAffected = setup.failure && owner.split("/").includes(setup.phase);
    const commandAffected = setup.failure && directCommandAC.includes(id);
    const status = commandAffected && lastCommand.timed_out ? "inconclusive" : inputAffected && setup.failure.code === "ENOENT" ? "missing" : inputAffected && setup.failure.code === "EACCES" ? "unavailable" : commandAffected && lastCommand.exit_code !== 0 ? "inconsistent" : "incomplete";
    const reason = `not executed; P7/T033 collection stopped or judgement not reached; AC owner ${owner}; ${JSON.stringify(setup.failure ?? "no AC execution result was produced")}`;
    const raw = { id, status, owner, executor: "P7/T033-T034", mode: "not executed", reason, refs: [], command_refs: commands, limits: "Input/read/setup failure is not evidence that upstream behavior failed." };
    const evidence_ref = await immutable(rawRoot, `${id}.json`, raw);
    results.push({ id, status, owner, evidence_ref, reason, mode: raw.mode });
  }
  results.sort((a,b)=>IDS.indexOf(a.id)-IDS.indexOf(b.id));
  const unchanged = [...(beforeHashes ?? new Map())].map(([path, before]) => ({ path, sha256_before: before, sha256_after: hash(readFileSync(repository(path))) }));
  const changed = unchanged.filter(row => row.sha256_before !== row.sha256_after);
  const spec = text(repository(`${MATERIAL}/spec.md`));
  const requirementRows = spec.split("## Appendix C")[1].split("\n").filter(line => /^\| [RU]-\d{3} \|/.test(line)).map(line => { const columns = line.split("|").map(value => value.trim()); return { id: columns[1], current_mapping: columns[2], declaration: columns[3], source_ref: columns[1].startsWith("R-") ? `${MATERIAL}/decision-log.md#原始需求` : "quality/evidence/decision-log-refs/requirement-change-log.md", implementation_evidence_refs: requirementEvidence(columns[1]), process_boundary: REQUIREMENT_PHASES[columns[1][0]][Number(columns[1].slice(2))-1] ? "Phase evidence plus source, not semantic proof" : "original process instruction/worktree/decision context; no fabricated behavior AC", boundary: "source-to-Phase mapping; process constraints are not extra behavior AC; no P8 completion claim" }; });
  const failed = results.filter(row => row.status !== "pass");
  const complete = results.length === IDS.length && !failed.length && !changed.length && !setup.failure && requirementRows.length === 56;
  aggregate = {
    task: "n10-finite-check-wiring-20261020", phase: "P7", baseline: BASE, oracle: "ORACLE-N10-FINAL-ACCEPTANCE", results, requirement_coverage: requirementRows,
    entrance: Object.fromEntries([1,2,3,4,5,6].map(n => [`P${n}`, { status: setup.inputs_complete ? "pass" : setup.phase === `P${n}` && setup.failure?.code === "ENOENT" ? "missing" : setup.phase === `P${n}` && setup.failure?.code === "EACCES" ? "unavailable" : "incomplete", basis: setup.inputs_complete ? "all declared input checks obtained; not an AC execution/result claim" : `input checks not fully obtained; P7 judgement not executed; ${JSON.stringify(setup.failure ?? null)}`, owner: `P${n}`, refs: [...originals.values()].filter(ref => ref.path.includes(`/P${n}`) || ref.path.includes(`-p${n}-`)) }])),
    execution: commands, effect: { basis: complete ? "existing controlled negatives and restored originals; current three public CLI modes replayed" : "effect not measured: input collection/AC judgement incomplete; only actual execution records apply", current_commands: commands.length, error: complete ? 0 : null, engineering_cost: "not measured; N10 consumes existing N1 cost originals, reports missing/incomplete and unverified savings; stage-end cost record pending root" },
    reverification: { basis: "P1 039/041; P3 062/063/065/067; P6 073/074; no new upstream implementation mutation", new_repair: "P7 consumer setup and nine evidence-reading assertions fixed; not production target RED", originals: ["quality/tests/2026-10-21-081-p7-initial-setup-machine.json", "quality/tests/2026-10-21-082-p7-original-run2.output", "quality/tests/2026-10-21-083-p7-original-run2-machine.json"], independent_ref: "quality/tests/2026-10-21-087-p7-independent-replay.json", F2P: null, P2P: null, scope: "087 is historical consumer-repair evidence (9/9 and 27/27), not this execution or TCR077 independent reverification; current independent replay belongs to the final Phase evidence", owner: "P7/T033 consumer defects; original Phase owner for actual upstream behavior failure" },
    change_approval: "P7 explicit root authorization; no frozen assertion/spec/archive change", triage: { failures: [...(setup.failure ? [{owner:"P7/T033",input_owner:setup.phase,reason:"input/setup failure; not upstream behavior failure",error:setup.failure}] : []),...failed.map(row=>({id:row.id,owner:row.owner,reason:row.reason}))], repaired_events: [{ "Defect ID": "P7-consumer-setup", description: "hardcoded node_modules path ignored actual resolver", reproducible: true, "Version detected": "first P7 test invocation", Severity: "setup prevents acceptance", Priority: "repair before acceptance", Disposition: "Fixed", "Closed by": "P7 independent replay owner", "Date closed": "2026-10-21", "Change reference": "current P7 test createRequire resolver", "Test reference": "quality/tests/2026-10-21-087-p7-independent-replay.json", "Closure Notes/Verification Status": "independent full36 pass; setup failure is not target RED" }, { "Defect ID": "P7-consumer-readback", description: "nine wrong evidence paths/text predicates/nested mutation summary reads", reproducible: true, "Version detected": "082/083", Severity: "consumer false failure, no upstream production defect", Priority: "repair before acceptance", Disposition: "Fixed", "Closed by": "P7 independent replay owner", "Date closed": "2026-10-21", "Change reference": "current receipt path, anchored top-level summary and original field predicates", "Test reference": "087", "Closure Notes/Verification Status": "independent F2P9/9 + P2P27/27; final metadata revision separately replayed by consumer" }], independent_triage: "root/independent reviewer; implementation owner does not sign quality" },
    writeback: { spec: "unchanged", phase: "P7 current Done supplied after run", implementation: "acceptance test plus runbook; governance registration", tests: "this named test only", reflection: "stage owner; no per-Phase stage-end" },
    conclusions: { evaluation_and_limits: complete ? "Original 36AC readback/CLI/bytes recorded individually; human semantics remain reviewed-original consumption, not machine judgment or independent quality" : "incomplete: input failure or unexecuted/non-pass AC; no complete readback or effect measurement claimed", plan_deviations_and_causes: "Necessary governance write-set registration authorized; T034 stale constant incomplete corrected against original AC; consumer setup/evidence-reading failures preserved and repaired", insufficiently_tested_features: "N9 actual completion remains report data; provider semantics, real make-decision sequence/300s windows, strict byte non-growth, N8 excluded routes/N11/user journey/P8 not proved; cost savings unverified", unresolved_incidents: "RC2 strict carrier remains unrepaired, minimal design only (P6/verify-code owner); historical PRD10 vs observed3 RED discrepancy preserved; P8 four disk AC owner remains P8", residual_risks: "GREEN/assets may be mistaken for quality/full acceptance; future source/field drift; material pollution checked by preserved hashes; budget behavior not yet P8 verified", signoff_objects: "root independent OCR/supplemental review and verify-code; final user/close decisions separate; implementer does not self-sign quality" },
    records_13: ["entrance", "readiness", "authorization", "individual results", "execution facts", "effect", "reverification", "change approval", "triage", "writeback", "six conclusions", "anti-self-proof", "failure loop"].map((item,i)=>({item:i+1,name:item,basis:i===1?"P7-data-readiness.json / P7-environment-readiness.json":i===11?"behavior originals/current CLI not summary counters; human semantics not machine signed; no P8 pass":i===12?"failure returns to original owner; preserve raw first failure; no assertion weakening":"existing corresponding aggregate section and original refs"})),
    resident_bytes_ref: residentRef ?? null,
    preserved_materials: unchanged, cleanup: { created_temporary_roots: null, unchanged_authoritative_materials: changed.length === 0, changed },
    limits: ["GREEN validates recorded acceptance within original AC, not independent quality/40 AC acceptance", "six manual-readback AC use reviewed original human readback; machine only verifies cited facts", "no provider/network/browser, N8 routes, N11 evaluation or full regression", "source mapping IDs are not semantic proof; independent source audit/report remains bounded", "historical pending summaries remain immutable, later Phase/repair originals are current", "temporary-root count is not tallied by the collector (null, not zero); controlled fixture owners remove their temporary inputs in finally"],
    overall: !complete ? "incomplete" : "partial — original AC readback complete; independent P7 quality and P8 acceptance pending", originals: [...originals.values()],
  };
  const path = await immutable(reportRoot, "P7-final-acceptance.json", aggregate);
  console.log(JSON.stringify({ phase: "P7", aggregate_ref: path, results: results.map(({id,status})=>({id,status})), requirement_count: requirementRows.length, current_chain_completion: chain?.completion, preservation_changed: changed.length }));
  return { aggregate, path, changed, requirementRows };
  } catch (publicationError) {
    if (setup.original_error && publicationError !== setup.original_error) throw new AggregateError([setup.original_error, publicationError], "original collection failure and publication failure");
    throw publicationError;
  }
}

afterAll(async () => {
  const saved = await publishAggregate();
  if (!saved) return;
  expect(results.map(row => row.id)).toEqual(IDS);
  expect(saved.requirementRows.map(row => row.id)).toEqual([...Array.from({length:27},(_,i)=>`R-${String(i+1).padStart(3,"0")}`),...Array.from({length:29},(_,i)=>`U-${String(i+1).padStart(3,"0")}`)]);
  expect(saved.changed).toEqual([]);
});

function privateSource(name) {
  const source = text(fileURLToPath(import.meta.url));
  const match = source.match(new RegExp(`(?:async )?function ${name}\\([\\s\\S]*?\\n}\\n`));
  if (!match) throw new Error(`private collector source not found: ${name}`);
  return match[0];
}

async function isolatedCollector(root, inputPath, timeout) {
  // Historical TASK is read-only input; this collector owns its write task.
  mkdirSync(root, {recursive:true});
  const storageRoot = mkdtempSync(join(root,"owned-storage-"));
  const owner = await createTask({storageRoot, manifest:{schema_version:"1.0.0",project_name:"workflowhub",task_id:"p7-owned-collector",created_at:new Date().toISOString(),target_repo_root:ROOT,activation_cohort:"post",write_resolution_source:"owned-test",baseline_commit:BASE,issue_ids:[],inputs:{},execution_mode:"per_invocation",record_model:"vnext-single-write"}});
  const childSource = `
import { readFileSync, mkdirSync, readdirSync, existsSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { openTask } from ${JSON.stringify(repository("runtime/task/task-handle.mjs"))};
const WRITER=openTask(${JSON.stringify(owner.taskPath)},{projectName:"workflowhub",taskId:"p7-owned-collector"});
const ROOT=${JSON.stringify(ROOT)}, TASK=${JSON.stringify(TASK)}, MATERIAL=${JSON.stringify(MATERIAL)}, BASE=${JSON.stringify(BASE)};
const EVIDENCE=join(WRITER.taskPath,"quality/evidence/collector"), RAW=join(EVIDENCE,"raw");
const IDS=${JSON.stringify(IDS)}, REQUIREMENT_PHASES=${JSON.stringify(REQUIREMENT_PHASES)};
const results=[], commands=[], originals=new Map(), beforeHashes=new Map();
let aggregate, resident, residentRef, chain; const head="private isolated collector fixture";
const hash=bytes=>createHash("sha256").update(bytes).digest("hex");
const text=path=>readFileSync(path,"utf8"); const repository=path=>join(ROOT,path);
const expect=value=>({toBeUndefined:()=>assert.equal(value,undefined),toBeNull:()=>assert.equal(value,null)});
${privateSource("immutable")}
${privateSource("sameCommand")}
${privateSource("commandOutput")}
${privateSource("run")}
${privateSource("requirementEvidence")}
${privateSource("failureDetails")}
${privateSource("ownerFor")}
${privateSource("collectInitialization")}
${privateSource("publishAggregate")}
const setup={phase:"P6",input_path:${JSON.stringify(inputPath)}};
let caught;
try { await collectInitialization(async()=>{
  readFileSync(${JSON.stringify(inputPath)});
  if (${JSON.stringify(timeout)}!==null) await run(["-e", "setTimeout(()=>process.stdout.write('P7_TIMEOUT_RECOVERED'),150)"],"controlled-timeout",{timeout:${JSON.stringify(timeout)}});
},setup); } catch(error) { caught=error; }
try {
 const saved=await publishAggregate({resultRows:results,commandRecords:commands,reportRoot:EVIDENCE,rawRoot:RAW,setup});
 console.log(JSON.stringify({collector_probe:true,aggregate_ref:saved.path,recovered:!caught,error:caught?{name:caught.name,message:caught.message,code:caught.code??null,path:caught.path??null}:null}));
 process.exitCode=caught?1:0;
} catch(writeError) { console.error(JSON.stringify({original_failure:caught?failureDetails(caught):null,write_error:failureDetails(writeError)}));process.exitCode=1; }
`;
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", childSource], { cwd: ROOT, encoding: "utf8", timeout: 10_000, maxBuffer: 4 * 1024 * 1024 });
  expect(child.error).toBeUndefined(); expect(child.signal).toBeNull();
  const execution={argv:[process.execPath,"--input-type=module","-e",childSource],cwd:ROOT,exit_code:child.status,signal:child.signal,timed_out:false};
  const output_ref = await commandOutput(RAW,"tcr077-child","stdout",child.stdout,execution,[]);
  const stderr_ref = await commandOutput(RAW,"tcr077-child","stderr",child.stderr,execution,[]);
  const line = child.stdout.split("\n").find(line=>line.startsWith("{") && JSON.parse(line).collector_probe);
  expect(line, child.stderr).toBeTruthy();
  const probe = JSON.parse(line);
  const report = json(probe.aggregate_ref);
  // Isolated temporary files will be removed; preserve their individual actual
  // reports/command outputs as originals, not the temporary directory tree.
  const aggregate_ref = probe.aggregate_ref;
  const record_ref = await immutable(EVIDENCE, "P7-tcr077-child-exit.json", { argv: [process.execPath,"--input-type=module","-e",childSource], cwd:ROOT, exit_code:child.status, signal:child.signal, timed_out:false, output_ref,stderr_ref,aggregate_ref });
  return { child, probe, report, record_ref };
}

describe("TCR077 actual collector failure reports", () => {
  it("TCR077 missing required P6 input records missing owner and restores the same input", async () => {
    const root = mkdtempSync(join(realpathSync(tmpdir()), "n10-p7-missing-"));
    const input = join(root,"P6-current-done-after-073-074.md");
    try {
      const failed = await isolatedCollector(join(EVIDENCE,"P7/tcr077/missing/failure"), input, null);
      expect(failed.child.status).toBe(1);
      expect(failed.probe.error.code).toBe("ENOENT"); expect(failed.probe.error.path).toBe(input);
      expect(failed.report.results).toHaveLength(36);
      expect(failed.report.entrance.P6.status).toBe("missing");
      expect(failed.report.results.filter(row=>row.id.startsWith("AC-PROCESS")).every(row=>row.status==="missing" && row.owner==="P6")).toBe(true);
      expect(failed.report.results.every(row=>row.status!=="pass")).toBe(true);
      expect(failed.report.overall).toBe("incomplete"); expect(failed.report.effect.error).toBeNull();
      expect(failed.report.effect.basis).not.toContain("current three public CLI modes replayed");
      // The same missing-input error inside an AC action must not become fail.
      const actionRows = []; let actionError;
      try { await accept("AC-PROCESS-1", ()=>readFileSync(input), { records:actionRows, rawRoot:join(EVIDENCE,"P7/tcr077/missing/action") }); }
      catch (error) { actionError = error; }
      expect(actionError.code).toBe("ENOENT"); expect(actionError.path).toBe(input);
      expect(actionRows).toHaveLength(1); expect(actionRows[0]).toMatchObject({id:"AC-PROCESS-1",status:"missing",owner:"P6"});
      writeFileSync(input, readFileSync(join(EVIDENCE,"P6/P6-current-done-after-073-074.md")));
      const restored = await isolatedCollector(join(EVIDENCE,"P7/tcr077/missing/restored"), input, null);
      expect(restored.child.status).toBe(0); expect(restored.probe.recovered).toBe(true);
      // Only the input collector was restored: no AC behavior was fabricated.
      expect(restored.report.results.every(row=>row.status!=="pass")).toBe(true);
    } finally { rmSync(root,{recursive:true,force:true}); }
  }, 30_000);
  it("TCR077 actual spawn timeout records inconclusive and restores the same command", async () => {
    const root = mkdtempSync(join(realpathSync(tmpdir()), "n10-p7-timeout-"));
    const input = join(root,"P6-current-done-after-073-074.md");
    writeFileSync(input, readFileSync(join(EVIDENCE,"P6/P6-current-done-after-073-074.md")));
    try {
      const failed = await isolatedCollector(join(EVIDENCE,"P7/tcr077/timeout/failure"), input, 20);
      expect(failed.child.status).toBe(1); expect(failed.report.execution[0].timed_out).toBe(true);
      expect(failed.report.execution[0].argv.slice(1)).toEqual(["-e","setTimeout(()=>process.stdout.write('P7_TIMEOUT_RECOVERED'),150)"]);
      expect(failed.report.results).toHaveLength(36);
      expect(failed.report.results.some(row=>row.status==="inconclusive")).toBe(true);
      expect(failed.report.results.every(row=>row.status!=="pass")).toBe(true);
      expect(failed.report.overall).toBe("incomplete"); expect(failed.report.effect.error).toBeNull();
      expect(failed.report.effect.basis).not.toContain("current three public CLI modes replayed");
      const restored = await isolatedCollector(join(EVIDENCE,"P7/tcr077/timeout/restored"), input, 2_000);
      expect(restored.child.status).toBe(0); expect(restored.probe.recovered).toBe(true);
      expect(restored.report.execution[0]).toMatchObject({exit_code:0,signal:null,timed_out:false});
      expect(restored.report.results.every(row=>row.status!=="pass")).toBe(true);
    } finally { rmSync(root,{recursive:true,force:true}); }
  }, 30_000);
});

const NAMED_RECEIPT = "112-p7-tcr2-named-original-cases-receipt";
function namedEvidence() {
  const record=receipt(NAMED_RECEIPT); const machinePath=taskEvidencePath(record.machine_report_ref);original(machinePath);
  return { record, machine:json(machinePath) };
}
function controlledReceipt(data, label) {
  const dir=join(EVIDENCE,"P7/tcr2/receipt-inputs"); mkdirSync(dir,{recursive:true});
  const path=join(dir,`${label}.json`); if (!existsSync(path)) writeFileSync(path,JSON.stringify(data));
  return path;
}

describe("TCR2 evidence binding controlled negatives",()=>{
  it("TCR2 command stdout same bytes different argv cannot reuse",async()=>{
    const records=[], rawRoot=join(EVIDENCE,"P7/tcr2/dedup/argv");
    const a=await run(["-e","process.stdout.write('SAME')"],"a",{records,rawRoot});
    const b=await run(["-e","process.stdout.write(['SA','ME'].join(''))"],"b",{records,rawRoot});
    expect(a.stdout).toBe(b.stdout); expect(a.stdout_ref).not.toBe(b.stdout_ref);
  });
  it("TCR2 same argv different actual exits cannot reuse",async()=>{
    const root=mkdtempSync(join(realpathSync(tmpdir()),"n10-p7-exit-")), input=join(root,"exit.txt"), records=[], rawRoot=join(EVIDENCE,"P7/tcr2/dedup/exit");
    const args=["-e",`process.stdout.write('SAME');process.exitCode=Number(require('node:fs').readFileSync(${JSON.stringify(input)},'utf8'))`];
    try { writeFileSync(input,"0");const a=await run(args,"a",{records,rawRoot});writeFileSync(input,"1");const b=await run(args,"b",{records,rawRoot});expect(a.exit_code).toBe(0);expect(b.exit_code).toBe(1);expect(a.stdout_ref).not.toBe(b.stdout_ref); }
    finally {rmSync(root,{recursive:true,force:true});}
  });
  it("TCR2 stdout and stderr with identical bytes cannot share a reference",async()=>{
    const row=await run(["-e","process.stdout.write('SAME');process.stderr.write('SAME')"],"streams",{records:[],rawRoot:join(EVIDENCE,"P7/tcr2/dedup/streams")});
    expect(row.stdout).toBe(row.stderr);expect(row.stdout_ref).not.toBe(row.stderr_ref);
  });
  it("TCR2 unknown candidate command is kept new while known identical command reuses",async()=>{
    const rawRoot=join(EVIDENCE,"P7/tcr2/dedup/known"),args=["-e","process.stdout.write('SAME')"];
    const a=await run(args,"a",{records:[],rawRoot});
    const records=[];const unknown=await run(args,"a",{records,rawRoot});expect(unknown.stdout_ref).not.toBe(a.stdout_ref);
    const known=await run(args,"different-label",{records,rawRoot});expect(known.stdout_ref).toBe(unknown.stdout_ref);
  });
  it("TCR2 CHECK6 rejects an unrelated argv even with the original 50pass1skip output",()=>{
    const green=receipt("003-n10-p1-t005-green");expect(()=>checkCutover({...green,argv:["npx","vitest","run","tests/other.test.mjs"]},text(external("quality/tests/2026-10-21-001-n10-p1-t005-red.output")),namedEvidence().machine)).toThrow();
  });
  it("TCR2 CHECK6 rejects another skipped identity rather than granting any one skip",()=>{
    const green=receipt("003-n10-p1-t005-green"),machine=structuredClone(namedEvidence().machine);
    const file=machine.testResults.find(row=>row.name.endsWith("ocr-delegation-route.test.mjs"));
    const selected=file.assertionResults.find(row=>row.title.includes("ORACLE-P3-ROUTE:"));selected.title="different skipped test";selected.fullName="different skipped test";
    expect(()=>checkCutover(green,text(external("quality/tests/2026-10-21-001-n10-p1-t005-red.output")),machine)).toThrow();
  });
  it.each([false,true])("TCR2 receipt outside path or internal symlink rejects before exposing owned sentinel (%s)",link=>{
    const root=mkdtempSync(join(realpathSync(tmpdir()),"n10-p7-boundary-")), outside=join(root,"sentinel.txt"), marker="OWNED_P7_DO_NOT_EXPOSE_4b3f6";
    writeFileSync(outside,marker); const dir=join(EVIDENCE,"P7/tcr2/receipt-inputs");mkdirSync(dir,{recursive:true});const internal=join(dir,`owned-link-${Date.now()}-${link}`);
    try { if(link)symlinkSync(outside,internal);const originalReceipt=json(external("quality/tests/2026-10-21-003-n10-p1-t005-green.json"));const path=controlledReceipt({...originalReceipt,output_ref:link?internal:outside},`outside-${Date.now()}-${link}`);let error,reads=0,positiveReads=0;receipt("003-n10-p1-t005-green",{readOutput:ref=>{positiveReads++;return text(ref);}});expect(positiveReads).toBe(1);try{receipt("unused",{path,readOutput:ref=>{reads++;return text(ref);}});}catch(caught){error=caught;}
      expect(reads).toBe(0);expect(error?.code).toBe("EVIDENCE_PATH_OUTSIDE_TASK");expect(error.message).not.toContain(marker);
    } finally {if(existsSync(internal))rmSync(internal);rmSync(root,{recursive:true,force:true});}
  });
  it.each(["9999999","4-2","1x"])("TCR2 METHOD1 rejects an invalid source range (%s)",line=>{
    const rows=summary("P4-method-readback.json").readback.rows;expect(()=>readCitedRow({...rows[0],line},rows)).toThrow();
  });
  it("TCR2 METHOD1 rejects a valid range swapped from another real row",()=>{
    const rows=summary("P4-method-readback.json").readback.rows;expect(()=>readCitedRow({...rows[0],path:rows[1].path,line:rows[1].line},rows)).toThrow();
  });
  it.each(["AC-CHECK-2","AC-CHECK-3","AC-SOURCE-2","AC-SOURCE-3"])("TCR2 named execution evidence cannot be replaced by a source keyword (%s)",id=>{
    const {record,machine}=namedEvidence(), missing=structuredClone(machine);missing.testResults=[];
    const body=source(id.includes("SOURCE")?"tests/contract/n10-source-registry.test.mjs":"tests/contract/n10-check-core.test.mjs");
    expect(()=>checkNamedEvidence(id,record,body,missing)).toThrow();
  });
  it("TCR2 MATERIAL5 rejects a blank one of its four fields and an unmarked empty table",()=>{
    const gaps=json(join(EVIDENCE,"content-gaps.json"));expect(()=>checkGaps([{...gaps[0],"影响谁":""}])).toThrow();expect(()=>checkGaps([])).toThrow();
  });
  it("TCR2 SET6 rejects a missing ring silently remaining completed and changed restoration bytes",()=>{
    const rows=logged(finite().output), changed=structuredClone(rows), missing=changed.find(row=>row.scenario==="named-ring-missing"), data=JSON.parse(missing.stdout);data.rings[0].state="completed";missing.stdout=JSON.stringify(data);
    expect(()=>checkNamedRing(changed)).toThrow();const bytesChanged=structuredClone(rows);bytesChanged.find(row=>row.scenario==="named-ring-restoration").sha256="0".repeat(64);expect(()=>checkNamedRing(bytesChanged)).toThrow();
  });
});

describe("TCR2 every named scenario is required",()=>{
 for(const [id,required] of Object.entries(SCENARIOS)) for(const name of required.cases) it(`TCR2 ${id} cannot pass when only ${name} is absent`,()=>{
   const {record,machine}=namedEvidence(), changed=structuredClone(machine), file=changed.testResults.find(row=>row.name===join(ROOT,required.file));
   file.assertionResults=file.assertionResults.filter(row=>row.title!==name);
   const body=source(id==="AC-MATERIAL-5"?"skills/spec-plan/templates/index-template.md":id.includes("SOURCE")?"tests/contract/n10-source-registry.test.mjs":"tests/contract/n10-check-core.test.mjs");
   expect(()=>checkNamedEvidence(id,record,body,changed)).toThrow();
 });
});
