// build-plan 预写测试（冻结）：断言变更须走 test change request + 独立审查
import { afterEach, describe, expect, it } from "vitest";
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
    expect(typeof error.code).toBe("string");
    expect(error.code.length).toBeGreaterThan(0);
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

  it("surfaces failures with a stable error code instead of swallowing them", async () => {
    const root = tempRoot("wh-safe-write-");
    const error = await rejection(appendRecord(join(root, "missing"), "s", "txt", Buffer.from("x")));
    expect(error).toBeInstanceOf(Error);
    expect(typeof error.code).toBe("string");
    expect(error.code.length).toBeGreaterThan(0);
  });
});
