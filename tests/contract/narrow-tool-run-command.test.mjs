// build-plan 预写测试（冻结）：断言变更须走 test change request + 独立审查
import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { captureCommand } from "../../runtime/interface/run-command.mjs";

const roots = [];

function tempRoot(prefix) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  roots.push(root);
  return root;
}

const node = (script) => [process.execPath, "-e", script];
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

afterEach(() => {
  while (roots.length) rmSync(roots.pop(), { recursive: true, force: true });
});

describe("run-command captureCommand", () => {
  it("returns the real exit code 0 and 3 unchanged", async () => {
    const root = tempRoot("wh-run-command-");
    const recordDir = join(root, "records");
    mkdirSync(recordDir);
    const ok = await captureCommand({ cwd: root, recordDir, slug: "ok", argv: node("process.exit(0)"), timeoutMs: 10000 });
    expect(ok.exit).toBe(0);
    const fail = await captureCommand({ cwd: root, recordDir, slug: "fail", argv: node("process.exit(3)"), timeoutMs: 10000 });
    expect(fail.exit).toBe(3);
    const receiptFiles = readdirSync(recordDir).filter((name) => name.endsWith(".json"));
    expect(receiptFiles).toHaveLength(2);
    const receipts = receiptFiles.map((name) => JSON.parse(readFileSync(join(recordDir, name), "utf8")));
    expect(receipts.map((receipt) => receipt.exit_code).sort()).toEqual([0, 3]);
  });

  it("persists both streams into one output file and a JSON receipt under recordDir", async () => {
    const root = tempRoot("wh-run-command-");
    const recordDir = join(root, "records");
    mkdirSync(recordDir);
    const before = new Set(readdirSync(recordDir));
    const result = await captureCommand({
      cwd: root,
      recordDir,
      slug: "echo",
      argv: node("process.stdout.write('out-line\\n'); process.stderr.write('err-line\\n')"),
      timeoutMs: 10000,
    });
    expect(result.exit).toBe(0);
    const created = readdirSync(recordDir).filter((name) => !before.has(name));
    expect(created.length).toBe(2);
    const outputs = created.filter((name) => name.endsWith(".output"));
    const receipts = created.filter((name) => name.endsWith(".json"));
    expect(outputs).toHaveLength(1);
    expect(receipts).toHaveLength(1);
    expect(outputs[0]).toMatch(/^\d{4}-\d{2}-\d{2}-\d{3}-echo\.output$/);
    const outputPath = join(recordDir, outputs[0]);
    const output = readFileSync(outputPath, "utf8");
    // Cross-stream order is unspecified; preserve each original byte sequence exactly once.
    expect(output.match(/out-line\n/g)).toHaveLength(1);
    expect(output.match(/err-line\n/g)).toHaveLength(1);
    expect(output.length).toBe("out-line\nerr-line\n".length);
    const receipt = JSON.parse(readFileSync(join(recordDir, receipts[0]), "utf8"));
    expect(receipt.exit_code).toBe(0);
    expect(receipt.cwd).toBe(root);
    expect(receipt.argv).toEqual(node("process.stdout.write('out-line\\n'); process.stderr.write('err-line\\n')"));
    expect(receipt.timed_out).toBe(false);
    expect(receipt.truncated).toBe(false);
    expect(receipt.output_ref).toBeTypeOf("string");
    const referenced = receipt.output_ref.startsWith("/") ? receipt.output_ref : join(recordDir, receipt.output_ref);
    expect(realpathSync(referenced)).toBe(realpathSync(outputPath));
  });

  it("supports shell mode", async () => {
    const root = tempRoot("wh-run-command-");
    const recordDir = join(root, "records");
    mkdirSync(recordDir);
    const result = await captureCommand({ cwd: root, recordDir, slug: "shell", shell: "printf via-shell", timeoutMs: 10000 });
    expect(result.exit).toBe(0);
  });

  it("kills the whole process group on timeout, returns exit 124, and leaves no orphaned survivor", async () => {
    const root = tempRoot("wh-run-command-");
    const recordDir = join(root, "records");
    mkdirSync(recordDir);
    const marker = join(root, "survivor-marker");
    // shell 先挂一个后台孤儿（2s 后写标记），再 exec sleep 30。
    // 只杀领头进程时孤儿会存活并留下标记；杀整个进程组则两者俱灭。
    const orphan = `setTimeout(() => require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'alive'), 2000)`;
    const started = Date.now();
    const result = await captureCommand({
      cwd: root,
      recordDir,
      slug: "timeout",
      shell: `${JSON.stringify(process.execPath)} -e ${JSON.stringify(orphan)} & exec sleep 30`,
      timeoutMs: 300,
    });
    expect(result.exit).toBe(124);
    expect(Date.now() - started).toBeLessThan(10000);
    await delay(2500);
    expect(existsSync(marker)).toBe(false);
  });

  it("truncates a single stream beyond 8 MiB and marks the truncation", async () => {
    const root = tempRoot("wh-run-command-");
    const recordDir = join(root, "records");
    mkdirSync(recordDir);
    const before = new Set(readdirSync(recordDir));
    const result = await captureCommand({
      cwd: root,
      recordDir,
      slug: "flood",
      argv: node("process.stdout.write('x'.repeat(9 * 1024 * 1024))"),
      timeoutMs: 30000,
    });
    expect(result.exit).toBe(0);
    expect(result.stdoutTruncated).toBe(true);
    const created = readdirSync(recordDir).filter((name) => !before.has(name));
    const stdoutFile = created
      .map((name) => join(recordDir, name))
      .find((path) => statSync(path).size > 1024 * 1024);
    expect(stdoutFile).toBeDefined();
    // 8 MiB 上限 + 截断标记的少量余量；9 MiB 原样落盘必然超限。
    expect(statSync(stdoutFile).size).toBeLessThanOrEqual(8 * 1024 * 1024 + 1024);
    expect(readFileSync(stdoutFile, "utf8")).toContain("TRUNCATED");
  });
});
