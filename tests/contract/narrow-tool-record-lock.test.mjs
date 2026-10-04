// build-plan 预写测试（冻结）：断言变更须走 test change request + 独立审查
import { once } from "node:events";
import { spawn } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { hostname, tmpdir } from "node:os";
import { join } from "node:path";

import { withLock } from "../../runtime/interface/record-lock.mjs";

const roots = [];
const LOCK_NAME = "probe";

function tempRoot(prefix) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  roots.push(root);
  return root;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const rejection = (promise) => promise.then(() => null, (error) => error);

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

/** 真实持锁一次，观察并返回实现使用的锁文件名（含 LOCK_NAME 的新文件）。 */
async function discoverLockFile(dir) {
  const before = new Set(readdirSync(dir));
  let observed = [];
  await withLock(dir, LOCK_NAME, async () => {
    observed = readdirSync(dir).filter((name) => !before.has(name));
  });
  if (observed.length !== 1) {
    throw new Error(`expected exactly one new lock file, saw: ${observed.join(", ")}`);
  }
  return observed[0];
}

function fabricateLock(dir, lockFile, pid, host = hostname()) {
  writeFileSync(
    join(dir, lockFile),
    JSON.stringify({
      pid,
      host,
      started_at: new Date().toISOString(),
      nonce: `nonce-${pid}`,
    }),
  );
}

/** 产出一个确定已退出的 pid，避免误用本机碰巧存活的大数字 pid。 */
async function deadPid() {
  const child = spawn(process.execPath, ["-e", "setTimeout(() => {}, 200)"]);
  const pid = child.pid;
  await once(child, "exit");
  return pid;
}

describe("record-lock withLock", () => {
  it("returns the callback result and writes a lock file carrying pid/host/started_at/nonce", async () => {
    const root = tempRoot("wh-record-lock-");
    mkdirSync(join(root, "locks"));
    const dir = join(root, "locks");
    const lockFile = await discoverLockFile(dir);
    let raw = null;
    const result = await withLock(dir, LOCK_NAME, async () => {
      raw = readFileSync(join(dir, lockFile), "utf8");
      return "done";
    });
    expect(result).toBe("done");
    const parsed = JSON.parse(raw);
    expect(typeof parsed.pid).toBe("number");
    expect(typeof parsed.host).toBe("string");
    expect(typeof parsed.started_at).toBe("string");
    expect(typeof parsed.nonce).toBe("string");
  });

  it("serializes two withLock calls on the same lock in the same directory", async () => {
    const root = tempRoot("wh-record-lock-");
    const dir = join(root, "locks");
    mkdirSync(dir);
    await discoverLockFile(dir);
    const order = [];
    const [first, second] = await Promise.all([
      withLock(dir, LOCK_NAME, async () => {
        order.push("a-start");
        await delay(150);
        order.push("a-end");
        return "a";
      }),
      withLock(dir, LOCK_NAME, async () => {
        order.push("b-start");
        order.push("b-end");
        return "b";
      }),
    ]);
    expect(first).toBe("a");
    expect(second).toBe("b");
    expect(order).toEqual(["a-start", "a-end", "b-start", "b-end"]);
  });

  it("reclaims a stale lock left by a dead same-host process", async () => {
    const root = tempRoot("wh-record-lock-");
    const dir = join(root, "locks");
    mkdirSync(dir);
    const lockFile = await discoverLockFile(dir);
    fabricateLock(dir, lockFile, await deadPid());
    const result = await withLock(dir, LOCK_NAME, async () => "entered");
    expect(result).toBe("entered");
  });

  it("waits, then fails with exit code 75 naming the holder when the lock holder is alive", async () => {
    const root = tempRoot("wh-record-lock-");
    const dir = join(root, "locks");
    mkdirSync(dir);
    const lockFile = await discoverLockFile(dir);
    // 本测试进程必定存活：持锁 pid 为活进程。
    fabricateLock(dir, lockFile, process.pid);
    const started = Date.now();
    const error = await rejection(withLock(dir, LOCK_NAME, async () => "never", { waitMs: 400 }));
    expect(error).toBeInstanceOf(Error);
    expect(error.exitCode).toBe(75);
    expect(error.message).toContain(String(process.pid));
    // 确实经历了等待而不是立即失败。
    expect(Date.now() - started).toBeGreaterThanOrEqual(300);
  });
  it("does not reclaim a foreign-host lock merely because its pid is dead locally", async () => {
    const root = tempRoot("wh-record-lock-foreign-");
    const dir = join(root, "locks");
    mkdirSync(dir);
    const lockFile = await discoverLockFile(dir);
    fabricateLock(dir, lockFile, await deadPid(), `${hostname()}-foreign-${process.pid}`);
    const before = readFileSync(join(dir, lockFile), "utf8");
    const error = await rejection(withLock(dir, LOCK_NAME, async () => "never", { waitMs: 100 }));
    expect(error).toBeInstanceOf(Error);
    expect(error.exitCode).toBe(75);
    expect(readFileSync(join(dir, lockFile), "utf8")).toBe(before);
  });

});
