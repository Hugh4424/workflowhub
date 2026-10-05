import { expect, test } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cleanup, createRuntime, currentOwnerIdentity, processIdentity, updateRuntime } from "../lib/runtime.mjs";
import { discardManagedAttachments, freezeManagedAttachments } from "../lib/attachments.mjs";

function checkedMaterial() {
  const contents = Buffer.from("original immutable attachment\n");
  const target = "materials/nested/input.md";
  return { bundle_id: "card09-reclaim", requested_delivery: "file_only", content_entries: [{ target, contents }], entries: [{ target, size: contents.length, sha256: createHash("sha256").update(contents).digest("hex"), embed: false }] };
}
function removeFixture(root) {
  function unlock(target) { if (!fs.existsSync(target)) return; const stat = fs.lstatSync(target); if (stat.isDirectory()) { fs.chmodSync(target, 0o700); for (const item of fs.readdirSync(target)) unlock(path.join(target, item)); } else fs.chmodSync(target, 0o600); }
  unlock(root); fs.rmSync(root, { recursive: true, force: true });
}

test("cleanup deletes expired read-only runtimes after the exact orphan provider exits", async () => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(tmpdir(), "card09-orphan-reclaim-")));
  const runtimes = [createRuntime(root, 24, "codex"), createRuntime(root, 24, "codex")];
  const child = spawn(process.execPath, [fileURLToPath(new URL("./slow-cli.mjs", import.meta.url))], { stdio: "ignore" });
  const exited = new Promise((resolve, reject) => { child.once("close", resolve); child.once("error", reject); });
  try {
    const worker = processIdentity(child.pid); expect(worker).toBeTruthy();
    for (const [index, runtime] of runtimes.entries()) {
      const directory = path.join(root, runtime.runtime_id);
      const frozen = freezeManagedAttachments(checkedMaterial(), directory, "expiry");
      expect(fs.statSync(frozen.root).mode & 0o777).toBe(0o500);
      expect(fs.statSync(path.join(frozen.root, "materials/nested/input.md")).mode & 0o777).toBe(0o400);
      const subtree = path.join(directory, "workspace/provider/materials"); fs.mkdirSync(subtree, { recursive: true });
      fs.writeFileSync(path.join(subtree, "input.md"), "workspace immutable", { mode: 0o400 }); fs.chmodSync(subtree, 0o500);
      updateRuntime(root, runtime.runtime_id, state => ({ ...state, expires_at_ms: 0, owner: { ...currentOwnerIdentity(), pid: 999_999_999, started: "confirmed-dead-owner" }, providers: index === 0 ? { kimi: { provider: "kimi", status: "running", pid: child.pid, worker, started_at_ms: 1, process_alive_at_ms: 1, last_progress_at_ms: 1 } } : {} }));
    }
    const removed = cleanup(root, 0);
    await exited;
    removed.push(...cleanup(root, 0));
    expect(new Set(removed)).toEqual(new Set(runtimes.map(runtime => runtime.runtime_id)));
    expect(removed).toHaveLength(runtimes.length);
    for (const runtime of runtimes) expect(fs.existsSync(path.join(root, runtime.runtime_id))).toBe(false);
    const processTable = spawnSync("ps", ["-o", "pid=", "-p", String(child.pid)], { encoding: "utf8" });
    console.log(JSON.stringify({ command: ["ps", "-o", "pid=", "-p", String(child.pid)], exit_code: processTable.status, stdout: processTable.stdout, stderr: processTable.stderr }));
    expect(processTable.error).toBeUndefined(); expect(processTable.stdout.trim()).toBe(""); expect(processTable.status).toBe(1);
  } finally { if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL"); await exited; removeFixture(root); }
});

test("discardManagedAttachments removes a frozen read-only attachment directory", () => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(tmpdir(), "card09-discard-reclaim-")));
  try {
    const runtime = createRuntime(root, 24, "codex"), directory = path.join(root, runtime.runtime_id);
    const frozen = freezeManagedAttachments(checkedMaterial(), directory, "discard");
    expect(fs.existsSync(frozen.root)).toBe(true);
    expect(() => discardManagedAttachments(directory, "discard")).not.toThrow();
    expect(fs.existsSync(frozen.root)).toBe(false);
  } finally { removeFixture(root); }
});
