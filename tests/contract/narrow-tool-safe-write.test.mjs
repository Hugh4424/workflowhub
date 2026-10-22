// build-plan 预写测试（冻结）：断言变更须走 test change request + 独立审查
import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

import { appendRecord, createFileOnce, writeFileAtomic } from "../../runtime/interface/safe-write.mjs";

const roots = [];

function tempRoot(prefix) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  roots.push(root);
  return root;
}

/** 捕获 Promise 的拒绝值；成功则返回 null。 */
const rejection = (promise) => promise.then(() => null, (error) => error);

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("safe-write writeFileAtomic", () => {
  it("writes bytes to a relative path inside root", async () => {
    const root = tempRoot("wh-safe-write-");
    mkdirSync(join(root, "a", "b"), { recursive: true });
    await writeFileAtomic(root, join("a", "b", "c.txt"), Buffer.from("payload"));
    expect(readFileSync(join(root, "a", "b", "c.txt"), "utf8")).toBe("payload");
  });

  it("rejects path escape via .. with a stable error code and writes nothing", async () => {
    const root = tempRoot("wh-safe-write-");
    const marker = join(root, "..", `escape-${process.pid}.txt`);
    const error = await rejection(writeFileAtomic(root, join("..", `escape-${process.pid}.txt`), Buffer.from("x")));
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("PATH_ESCAPE");
    expect(existsSync(marker)).toBe(false);
  });

  it("rejects writing through a symlink and leaves the symlink target untouched", async () => {
    const root = tempRoot("wh-safe-write-");
    const target = join(root, "target.txt");
    writeFileSync(target, "original");
    symlinkSync(target, join(root, "alias.txt"));
    const error = await rejection(writeFileAtomic(root, "alias.txt", Buffer.from("hacked")));
    expect(error).toBeInstanceOf(Error);
    expect(typeof error.code).toBe("string");
    expect(error.code.length).toBeGreaterThan(0);
    expect(readFileSync(target, "utf8")).toBe("original");
  });

  it("rejects a replaced ancestor (symlinked directory component) and writes nothing", async () => {
    const root = tempRoot("wh-safe-write-");
    const realDir = join(root, "real");
    mkdirSync(realDir);
    symlinkSync(realDir, join(root, "linkdir"));
    const error = await rejection(writeFileAtomic(root, join("linkdir", "x.txt"), Buffer.from("x")));
    expect(error).toBeInstanceOf(Error);
    expect(typeof error.code).toBe("string");
    expect(error.code.length).toBeGreaterThan(0);
    expect(existsSync(join(realDir, "x.txt"))).toBe(false);
  });
});

describe("safe-write createFileOnce", () => {
  it("creates the file on first call and is idempotent for identical bytes", async () => {
    const root = tempRoot("wh-safe-write-");
    await createFileOnce(root, "once.txt", Buffer.from("v1"));
    expect(readFileSync(join(root, "once.txt"), "utf8")).toBe("v1");
    await createFileOnce(root, "once.txt", Buffer.from("v1"));
    expect(readFileSync(join(root, "once.txt"), "utf8")).toBe("v1");
  });

  it("rejects differing bytes with RECORD_CONFLICT and keeps the original content", async () => {
    const root = tempRoot("wh-safe-write-");
    await createFileOnce(root, "once.txt", Buffer.from("v1"));
    const error = await rejection(createFileOnce(root, "once.txt", Buffer.from("v2")));
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("RECORD_CONFLICT");
    expect(readFileSync(join(root, "once.txt"), "utf8")).toBe("v1");
  });
});

describe("safe-write appendRecord", () => {
  it("allocates YYYY-MM-DD-NNN-slug.ext starting at 001 and writes the bytes", async () => {
    const root = tempRoot("wh-safe-write-");
    const dir = join(root, "records");
    mkdirSync(dir);
    const first = await appendRecord(dir, "audit", "log", Buffer.from("one\n"));
    expect(basename(first)).toMatch(/^\d{4}-\d{2}-\d{2}-001-audit\.log$/);
    expect(readFileSync(first, "utf8")).toBe("one\n");
    const second = await appendRecord(dir, "audit", "log", Buffer.from("two\n"));
    expect(basename(second)).toMatch(/^\d{4}-\d{2}-\d{2}-002-audit\.log$/);
    expect(readdirSync(dir).sort()).toEqual([basename(first), basename(second)].sort());
  });

  it("continues numbering past pre-existing files of the same day", async () => {
    const root = tempRoot("wh-safe-write-");
    const dir = join(root, "records");
    mkdirSync(dir);
    // 用一次真实调用取得当日日期前缀，再预置 001/002 占据序号。
    const probe = await appendRecord(dir, "seq", "txt", Buffer.from("probe"));
    const prefix = basename(probe).slice(0, 10);
    rmSync(probe);
    writeFileSync(join(dir, `${prefix}-001-seq.txt`), "old");
    writeFileSync(join(dir, `${prefix}-002-seq.txt`), "old");
    const next = await appendRecord(dir, "seq", "txt", Buffer.from("three"));
    expect(basename(next)).toBe(`${prefix}-003-seq.txt`);
    expect(readFileSync(next, "utf8")).toBe("three");
  });

  it("rejects a missing record directory without creating output and preserves the original filesystem error", async () => {
    const root = tempRoot("wh-safe-write-");
    const missing = join(root, "missing");
    const error = await rejection(appendRecord(missing, "s", "txt", Buffer.from("x")));
    expect(error).toBeInstanceOf(Error);
    expect(typeof error.code).toBe("string");
    expect(error.code.length).toBeGreaterThan(0);
    expect(existsSync(missing)).toBe(false);
    expect(readdirSync(root)).toEqual([]);

    // Inject only the owned filesystem error source in a separate process;
    // preserve the real appendRecord path and avoid mutating this Vitest worker.
    const probe = `
      import assert from 'node:assert/strict';
      import fs from 'node:fs';
      import { syncBuiltinESMExports } from 'node:module';
      const [moduleUrl, root, missing] = process.argv.slice(1);
      const original = fs.lstatSync;
      const sentinel = Object.assign(new Error('controlled owned-directory I/O failure'), { code: 'P4_CONTROLLED_IO_FAILURE' });
      fs.lstatSync = (path, ...args) => {
        if (path === missing) throw sentinel;
        return original(path, ...args);
      };
      syncBuiltinESMExports();
      try {
        const { appendRecord } = await import(moduleUrl);
        const rejected = await appendRecord(missing, 's', 'txt', Buffer.from('x')).then(() => null, error => error);
        assert.equal(rejected, sentinel, 'appendRecord must preserve the original filesystem error object');
        assert.equal(rejected.code, 'P4_CONTROLLED_IO_FAILURE');
        assert.equal(fs.existsSync(missing), false, 'missing record directory must not be created');
        assert.deepEqual(fs.readdirSync(root), [], 'rejected append must leave no output');
        process.stdout.write('original-error/no-output\\n');
      } finally {
        fs.lstatSync = original;
        syncBuiltinESMExports();
      }
    `;
    const moduleUrl = new URL("../../runtime/interface/safe-write.mjs", import.meta.url).href;
    expect(execFileSync(process.execPath, ["--input-type=module", "-e", probe, moduleUrl, root, missing], { encoding: "utf8" })).toBe("original-error/no-output\n");
    expect(existsSync(missing)).toBe(false);
    expect(readdirSync(root)).toEqual([]);
  });
});

describe('P8 safe-write actual executor',()=>{
 it('awaits one actual publication with correct create/overwrite peaks and skips identical create',async()=>{
  const root=tempRoot('wh-safe-executor-'),requests=[];let actualCalls=0;
  const options={performWrite:async(r,actual)=>{requests.push(r);if(requests.length===1){expect(existsSync(r.path)).toBe(false);expect(r.resolveExisting()).toBeUndefined();expect(existsSync(r.path)).toBe(false);}await new Promise(resolve=>setTimeout(resolve,5));actualCalls++;return actual();}};
  await createFileOnce(root,'one.txt',Buffer.from('abc'),options);
  await createFileOnce(root,'one.txt',Buffer.from('abc'),{performWrite:async()=>{throw new Error('same bytes must not request new space');}});
  await writeFileAtomic(root,'one.txt',Buffer.from('replacement'),options);
  const appended=await appendRecord(root,'budget','txt',Buffer.from('record'),options);
  expect(actualCalls).toBe(3);expect(requests).toEqual([
   {kind:'publish',path:join(root,'one.txt'),bytes:3,incomingFiles:2,resolveExisting:expect.any(Function)},
   {kind:'publish',path:join(root,'one.txt'),bytes:11,incomingFiles:1},
   {kind:'publish',path:appended,bytes:6,incomingFiles:2},
  ]);expect(readFileSync(join(root,'one.txt'),'utf8')).toBe('replacement');expect(readFileSync(appended,'utf8')).toBe('record');
 });
 it('refuses create/overwrite/append before any temporary bytes or old-record mutation',async()=>{
  const root=tempRoot('wh-safe-refused-');await createFileOnce(root,'old.txt',Buffer.from('original'));const before=readdirSync(root).sort();
  const options={performWrite:async()=>{throw Object.assign(new Error('controlled budget full'),{code:'DISK_BUDGET_EXCEEDED'});}};
  await expect(createFileOnce(root,'new.txt',Buffer.from('new'),options)).rejects.toMatchObject({code:'DISK_BUDGET_EXCEEDED'});
  await expect(writeFileAtomic(root,'old.txt',Buffer.from('replacement'),options)).rejects.toMatchObject({code:'DISK_BUDGET_EXCEEDED'});
  await expect(appendRecord(root,'budget','txt',Buffer.from('new'),options)).rejects.toMatchObject({code:'DISK_BUDGET_EXCEEDED'});
  expect(readdirSync(root).sort()).toEqual(before);expect(readFileSync(join(root,'old.txt'),'utf8')).toBe('original');
 });
});
