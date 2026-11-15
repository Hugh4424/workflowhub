// ORACLE-WRITE-LOCK（写者记录面；双进程面见 integration 同名 oracle）
// 本文件通过只证明当前 write-set 样本、单写者规则与锁/清理记录的形状；不证明任意目标项目、
// 未进入同一把锁的外部直写或真实长期并发。受控破坏只在测试自建的临时副本进行，
// 原样本不改、首次失败原件保留。RED 只落写者/锁证明/清理目标断言；导入、收集与环境失败另记，不当 RED。
import {mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync, cpSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {spawnSync} from "node:child_process";

const ROOT = process.cwd();
const SCRIPT = join(ROOT, "skills/design-source-extraction/scripts/check-write-set.mjs");
const FIXTURE_DIR = join(ROOT, "tests/fixtures/design-port-sample/write-set");

function run(dir) {
  return spawnSync(process.execPath, [SCRIPT, "--dir", dir], {cwd: ROOT, encoding: "utf8", timeout: 60000});
}
function readJson(file) { return JSON.parse(readFileSync(file, "utf8")); }
function writeJson(file, value) { writeFileSync(file, JSON.stringify(value, null, 2) + "\n"); }
// Copy the committed fixture to a temp directory, let one test mutate its copy, then clean up.
function withCopy(mutate) {
  const root = mkdtempSync(join(tmpdir(), "p5-write-set-"));
  const dir = join(root, "write-set");
  cpSync(FIXTURE_DIR, dir, {recursive: true});
  const file = join(dir, "write-set.json");
  const doc = readJson(file);
  mutate(doc);
  writeJson(file, doc);
  return {root, dir, file};
}
function cleaned(fn) {
  const copy = withCopy(fn.mutate ?? (() => {}));
  try { return fn.check(copy); }
  finally { rmSync(copy.root, {recursive: true, force: true}); }
}
function parsed(result) {
  try { return JSON.parse(result.stdout); } catch { return null; }
}
function stderrCode(result) {
  try { return JSON.parse(result.stderr).error.code; } catch { return null; }
}
function expectRejected({describe, it, expect}) {
  describe("ORACLE-WRITE-LOCK rejects an invalid write record with a named code", () => {
    const cases = [
      ["a second writer claims the same shared file", doc => {
        doc.writers.push({id: "P5-other", role: "唯一写者", session_ref: "subagent:other", files: ["workflows/build-code/SKILL.md"]});
        doc.shared_files.push({path: "workflows/build-code/SKILL.md", writer: "P5-other", lock_proof: "p5-sample-acquire"});
      }, "WRITE_SET_DOUBLE_WRITER"],
      ["a writer lists a file already owned by another writer", doc => {
        doc.writers.push({id: "P5-other", role: "唯一写者", session_ref: "subagent:other", files: ["workflows/build-code/SKILL.md"]});
      }, "WRITE_SET_DOUBLE_WRITER"],
      ["a second writer owns a disjoint file and reuses the same lock proof", doc => {
        doc.writers.push({id: "P5-other", role: "唯一写者", session_ref: "subagent:other", files: ["skills/design-source-extraction/references/anti-patterns.md"]});
        doc.shared_files.push({path: "skills/design-source-extraction/references/anti-patterns.md", writer: "P5-other", lock_proof: "p5-sample-acquire"});
      }, "WRITE_SET_DOUBLE_WRITER"],
      ["a shared file has no lock proof", doc => { delete doc.shared_files[0].lock_proof; }, "WRITE_SET_LOCK_PROOF_MISSING"],
      ["a shared file names a lock proof that does not exist", doc => { doc.shared_files[0].lock_proof = "absent"; }, "WRITE_SET_LOCK_PROOF_MISSING"],
      ["a shared file names an unknown writer", doc => { doc.shared_files[0].writer = "absent"; }, "WRITE_SET_WRITER_UNKNOWN"],
      ["the task record lock is passed off as the workspace lock", doc => {
        doc.lock.implementation = "runtime/task/task-handle.mjs";
        doc.lock.domain = "task-record";
      }, "WRITE_SET_LOCK_DOMAIN_INVALID"],
      ["a half-finished task is sent for verification", doc => { doc.interrupted[0].sent_for_verification = true; }, "WRITE_SET_INTERRUPTED_NOT_ISOLATED"],
      ["an interrupted half-product is not isolated", doc => { doc.interrupted[0].isolated = false; }, "WRITE_SET_INTERRUPTED_NOT_ISOLATED"],
      ["a temp path is not removed", doc => { doc.cleanup.temp_paths[0].state = "present"; }, "WRITE_SET_CLEANUP_MISSING"],
      ["a spawned process is not reported stopped", doc => { doc.cleanup.processes[0].state = "running"; }, "WRITE_SET_CLEANUP_MISSING"],
      ["a lock file is left behind", doc => { doc.cleanup.lock_files[0].state = "present"; }, "WRITE_SET_CLEANUP_MISSING"],
      ["the only writer is not declared the unique writer", doc => { doc.writers[0].role = "参与写者"; }, "WRITE_SET_DOUBLE_WRITER"],
      ["a proof is released before it was acquired", doc => { doc.lock.proofs[0].released_at = "2026-11-15T18:59:00.000Z"; }, "WRITE_SET_LOCK_PROOF_INVALID"],
      ["a proof carries no positive pid", doc => { doc.lock.proofs[0].pid = 0; }, "WRITE_SET_LOCK_PROOF_INVALID"],
    ];
    for (const [name, mutate, code] of cases) {
      it(`rejects when ${name}`, () => {
        const result = cleaned({mutate, check: copy => run(copy.dir)});
        expect(result.status, result.stdout + result.stderr).toBe(1);
        const report = parsed(result);
        expect(report?.ok).toBe(false);
        expect(report?.kind).toBe("write-set");
        expect(report?.error?.code, JSON.stringify(report)).toBe(code);
        expect(stderrCode(result)).toBe(code);
      });
    }
  });
}

{
  const vitest = await import("vitest");
  const {describe, it, expect} = vitest;
  describe("ORACLE-WRITE-LOCK accepts the committed write-set fixture", () => {
    it("accepts one unique writer with readable lock proofs and a complete cleanup list", () => {
      const result = run(FIXTURE_DIR);
      expect(result.status, result.stderr).toBe(0);
      const report = parsed(result);
      expect(report.ok).toBe(true);
      expect(report.kind).toBe("write-set");
      expect(report.writers).toEqual(["P5-dev"]);
      expect(report.shared_files).toBe(2);
      expect(report.lock).toEqual({name: "design-port-worktree", domain: "workspace", proofs: 1});
      expect(existsSync(join(FIXTURE_DIR, "write-set.json"))).toBe(true);
    });
  });
  describe("ORACLE-WRITE-LOCK refuses to guess when the input is unreadable", () => {
    it("exits 2 when the directory is absent", () => {
      const result = run(join(tmpdir(), "p5-write-set-does-not-exist"));
      expect(result.status).toBe(2);
      expect(stderrCode(result)).toBe("WRITE_SET_UNREADABLE");
    });
    it("exits 2 when write-set.json is not valid JSON", () => {
      const root = mkdtempSync(join(tmpdir(), "p5-write-set-json-"));
      try {
        writeFileSync(join(root, "write-set.json"), "{not json\n");
        const result = run(root);
        expect(result.status).toBe(2);
        expect(stderrCode(result)).toBe("WRITE_SET_UNREADABLE");
      } finally { rmSync(root, {recursive: true, force: true}); }
    });
  });
  expectRejected({describe, it, expect});
}
