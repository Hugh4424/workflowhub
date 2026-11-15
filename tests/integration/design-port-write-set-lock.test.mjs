// ORACLE-WRITE-LOCK
// 本文件通过只证明当前工作区、同一锁名与两个真实子进程的真实互斥；不证明未进入同一把锁的
// 外部直写不存在，也不证明真实项目长期无并发问题。受控目标文件与锁目录都由测试自建并清理，
// 不覆盖仓库文件。RED 只落锁行为或写者记录的目标断言；进程创建、权限与环境失败另记。
import {mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {spawn, spawnSync} from "node:child_process";
import {pathToFileURL} from "node:url";

const ROOT = process.cwd();
const LOCK_MODULE = pathToFileURL(resolve(ROOT, "runtime/interface/record-lock.mjs")).href;
const CHECK = resolve(ROOT, "skills/design-source-extraction/scripts/check-write-set.mjs");
const {withLock} = await import(LOCK_MODULE);

const CHILD_SOURCE = `
import {readFileSync, writeFileSync, appendFileSync} from "node:fs";
import {withLock} from ${JSON.stringify(LOCK_MODULE)};
const [lockDir, name, target, log, waitMs, delayMs] = process.argv.slice(2);
const sleep = ms => new Promise(done => setTimeout(done, ms));
const lockPath = lockDir + "/." + name + ".lock";
let owner = null;
try {
  await withLock(lockDir, name, async () => {
    owner = JSON.parse(readFileSync(lockPath, "utf8"));
    appendFileSync(log, "BEGIN " + process.pid + " " + Date.now() + "\\n");
    const value = Number(readFileSync(target, "utf8").trim());
    await sleep(Number(delayMs));
    writeFileSync(target, String(value + 1) + "\\n");
    appendFileSync(log, "END " + process.pid + " " + Date.now() + "\\n");
  }, {waitMs: Number(waitMs)});
  // released_at is the observer's release time; record-lock itself writes only
  // pid/host/nonce/started_at, so the proof must not pretend it came from the lock bytes.
  process.stdout.write(JSON.stringify({pid: process.pid, owner, released_at: new Date().toISOString()}) + "\\n");
  process.exit(0);
} catch (error) {
  process.stderr.write(JSON.stringify({code: error.code, exitCode: error.exitCode ?? null, pid: process.pid}) + "\\n");
  process.exit(error.code === "LOCK_HELD" ? 75 : 1);
}
`;

function runChild(childScript, args) {
  return new Promise(done => {
    const child = spawn(process.execPath, [childScript, ...args], {encoding: "utf8"});
    let stdout = "", stderr = "";
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("close", (code, signal) => done({code, signal, pid: child.pid, stdout, stderr}));
  });
}
function runCheck(dir) {
  return spawnSync(process.execPath, [CHECK, "--dir", dir], {cwd: ROOT, encoding: "utf8", timeout: 60000});
}
function codeOf(result) { try { return JSON.parse(result.stderr).error.code; } catch { return null; } }
function outOf(result) { try { return JSON.parse(result.stdout); } catch { return null; } }
function alive(pid) {
  try { process.kill(pid, 0); return true; }
  catch (error) { return error.code !== "ESRCH"; }
}
function intervals(log) {
  const lines = readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map(line => line.split(" "));
  const byPid = new Map();
  for (const [kind, pid, at] of lines) {
    const entry = byPid.get(pid) ?? {begin: [], end: []};
    entry[kind === "BEGIN" ? "begin" : "end"].push(Number(at));
    byPid.set(pid, entry);
  }
  return [...byPid.entries()].map(([pid, entry]) => ({pid, begin: Math.min(...entry.begin), end: Math.max(...entry.end), begins: entry.begin.length, ends: entry.end.length}));
}

const vitest = await import("vitest");
const {describe, it, expect, afterAll} = vitest;

describe("ORACLE-WRITE-LOCK holds one real workspace lock across two real processes", () => {
  const root = mkdtempSync(join(tmpdir(), "p5-write-lock-"));
  const lockDir = join(root, "locks");
  const target = join(root, "counter.txt");
  const log = join(root, "transactions.log");
  const childScript = join(root, "writer.mjs");
  const lockName = "p5-lock-probe";
  const lockFile = join(lockDir, `.${lockName}.lock`);
  const observed = {pids: [], contender: null, holder: null, holderReleasedAt: null, proofs: []};

  mkdirSync(lockDir, {recursive: true});
  mkdirSync(join(root, "write-set"), {recursive: true});
  writeFileSync(target, "0\n");
  writeFileSync(log, "");
  writeFileSync(childScript, CHILD_SOURCE);

  afterAll(() => {
    rmSync(root, {recursive: true, force: true});
    // F4: the evidence claims the temp root is removed, so the cleanup is asserted.
    expect(existsSync(root), `temp root must be removed: ${root}`).toBe(false);
  });

  it("refuses an immediate contender with LOCK_HELD (exit 75) and leaves the target bytes unchanged", async () => {
    expect(readFileSync(target, "utf8")).toBe("0\n");
    await withLock(lockDir, lockName, async () => {
      expect(existsSync(lockFile)).toBe(true);
      const holder = JSON.parse(readFileSync(lockFile, "utf8"));
      expect(holder.pid).toBe(process.pid);
      observed.holder = holder;
      const contender = await runChild(childScript, [lockDir, lockName, target, log, "0", "0"]);
      observed.contender = {code: contender.code, stderr: contender.stderr, pid: contender.pid};
      observed.pids.push(contender.pid);
      expect(contender.code, contender.stderr).toBe(75);
      expect(JSON.parse(contender.stderr).code).toBe("LOCK_HELD");
      expect(readFileSync(target, "utf8")).toBe("0\n");
    });
    observed.holderReleasedAt = new Date().toISOString();
    expect(existsSync(lockFile)).toBe(false);
  });

  it("serializes two waiting processes inside the same callback, each transaction taking effect once", async () => {
    const results = await Promise.all([
      runChild(childScript, [lockDir, lockName, target, log, "10000", "600"]),
      runChild(childScript, [lockDir, lockName, target, log, "10000", "600"]),
    ]);
    for (const result of results) {
      observed.pids.push(result.pid);
      expect(result.code, result.stderr).toBe(0);
      const line = result.stdout.trim().split("\n").at(-1);
      observed.proofs.push(JSON.parse(line));
    }
    expect(readFileSync(target, "utf8")).toBe("2\n");
    const windows = intervals(log);
    expect(windows).toHaveLength(2);
    for (const window of windows) {
      expect(window.begins).toBe(1);
      expect(window.ends).toBe(1);
      expect(window.end).toBeGreaterThan(window.begin);
    }
    const ordered = [...windows].sort((left, right) => left.begin - right.begin);
    expect(ordered[0].end).toBeLessThanOrEqual(ordered[1].begin);
    expect(new Set(windows.map(window => window.pid)).size).toBe(2);
  });

  it("accepts its own writer record and rejects a double writer against the real lock pids", () => {
    const [first, second] = observed.pids.slice(-2);
    const writeSet = {
      schema_version: "1.0.0",
      kind: "write-set",
      worktree: {root_ref: "测试临时工作区", branch_ref: "task/示例", session: "P5 集成测试"},
      lock: {implementation: "runtime/interface/record-lock.mjs", name: lockName, domain: "workspace", proofs: [
        {id: "holder", pid: observed.holder.pid, host: observed.holder.host, nonce: observed.holder.nonce, started_at: observed.holder.started_at, released_at: observed.holderReleasedAt},
        ...observed.proofs.map((proof, index) => ({id: index === 0 ? "writer-a" : "writer-b", pid: proof.owner.pid, host: proof.owner.host, nonce: proof.owner.nonce, started_at: proof.owner.started_at, released_at: proof.released_at})),
      ]},
      writers: [{id: "P5-int", role: "唯一写者", session_ref: "test:integration", files: ["临时工作区/counter.txt"]}],
      shared_files: [{path: "临时工作区/counter.txt", writer: "P5-int", lock_proof: "writer-a"}],
      interrupted: [{id: "half-work", path: "临时工作区/aborted", isolated: true, sent_for_verification: false}],
      cleanup: {
        temp_paths: [{path: "临时工作区/aborted", state: "removed"}],
        processes: observed.pids.map(pid => ({pid, state: "stopped"})),
        lock_files: [{path: `.${lockName}.lock`, state: "removed"}],
        verified_at: "2026-11-15T19:04:00.000Z",
      },
    };
    const dir = join(root, "write-set");
    writeFileSync(join(dir, "write-set.json"), JSON.stringify(writeSet, null, 2) + "\n");
    const accepted = runCheck(dir);
    expect(accepted.status, accepted.stdout + accepted.stderr).toBe(0);
    expect(outOf(accepted).ok).toBe(true);
    writeSet.writers.push({id: "P5-other", role: "唯一写者", session_ref: "test:other", files: ["临时工作区/counter.txt"]});
    writeSet.shared_files.push({path: "临时工作区/counter.txt", writer: "P5-other", lock_proof: "writer-b"});
    writeFileSync(join(dir, "write-set.json"), JSON.stringify(writeSet, null, 2) + "\n");
    const rejected = runCheck(dir);
    expect(rejected.status).toBe(1);
    expect(outOf(rejected).error.code).toBe("WRITE_SET_DOUBLE_WRITER");
    expect(codeOf(rejected)).toBe("WRITE_SET_DOUBLE_WRITER");
  });

  it("left no lock file and no living child behind", () => {
    expect(existsSync(lockFile)).toBe(false);
    for (const pid of observed.pids) expect(alive(pid), `pid ${pid}`).toBe(false);
    // One machine-readable line for the evidence original: real pids, lock file,
    // conflict behaviour, final bytes, callback windows and cleanup readback.
    console.log("ORACLE-WRITE-LOCK " + JSON.stringify({
      lock_file: lockFile,
      lock_file_left: existsSync(lockFile),
      contender: observed.contender,
      writer_pids: observed.pids,
      target_bytes: readFileSync(target, "utf8").trim(),
      windows: intervals(log),
      living_pids: observed.pids.filter(alive),
      temp_root: root,
    }));
  });
});
