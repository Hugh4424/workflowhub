import { afterEach, expect, it } from "vitest";
import { spawn, execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const roots = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

it("reaps marked stale directories when getuid is unavailable", () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-temp-dir-test-"))); roots.push(root);
  const moduleUrl = new URL("../../runtime/interface/temp-dir.mjs", import.meta.url).href;
  const output = execFileSync(process.execPath, ["--input-type=module", "-e", `
    import { existsSync, readFileSync, writeFileSync } from "node:fs";
    import { join } from "node:path";
    delete process.getuid;
    const { createTrackedTempDir, cleanupStaleTempDirs } = await import(${JSON.stringify(moduleUrl)});
    const owned = createTrackedTempDir("owned-temp-", { root: ${JSON.stringify(root)} });
    const marker = join(owned.path, ".workflowhub-temp.json");
    const value = JSON.parse(readFileSync(marker, "utf8")); value.created_at = new Date(0).toISOString(); value.pid = process.pid + 1;
    writeFileSync(marker, JSON.stringify(value) + "\\n");
    const removed = cleanupStaleTempDirs({ root: ${JSON.stringify(root)}, prefixes: ["owned-temp-"], olderThanMs: 0, pidAlive: () => false });
    process.stdout.write(JSON.stringify({ removed: removed.length, exists: existsSync(owned.path) }));
  `], { encoding: "utf8" });
  expect(JSON.parse(output)).toMatchObject({ removed: 1, exists: false });
});

it("does not remove a replacement directory when marker creation fails", () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-temp-dir-replacement-"))); roots.push(root);
  const moduleUrl = new URL("../../runtime/interface/temp-dir.mjs", import.meta.url).href;
  const output = execFileSync(process.execPath, ["--input-type=module", "-e", `
    import { createRequire, syncBuiltinESMExports } from "node:module";
    import { dirname, join } from "node:path";
    const fs = createRequire(import.meta.url)("node:fs");
    const originalWriteFileSync = fs.writeFileSync;
    fs.writeFileSync = (file, data, options) => {
      if (String(file).endsWith("/.workflowhub-temp.json") && options?.flag === "wx") {
        const replacement = dirname(file);
        fs.rmSync(replacement, { recursive: true, force: true });
        fs.mkdirSync(replacement);
        originalWriteFileSync(join(replacement, "sentinel"), "replacement");
        throw Object.assign(new Error("marker write injected"), { code: "EEXIST" });
      }
      return originalWriteFileSync(file, data, options);
    };
    syncBuiltinESMExports();
    const { createTrackedTempDir } = await import(${JSON.stringify(moduleUrl)});
    let error;
    try { createTrackedTempDir("owned-temp-", { root: ${JSON.stringify(root)} }); }
    catch (caught) { error = { code: caught.code, message: caught.message }; }
    const name = fs.readdirSync(${JSON.stringify(root)}).find(value => value.startsWith("owned-temp-"));
    const replacement = name ? join(${JSON.stringify(root)}, name) : null;
    process.stdout.write(JSON.stringify({ error, replacementExists: replacement !== null && fs.existsSync(join(replacement, "sentinel")) }));
  `], { encoding: "utf8" });
  expect(JSON.parse(output)).toMatchObject({ error: { code: "EEXIST" }, replacementExists: true });
});

it("defers tracked cleanup until an application-owned signal drain exits", async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-temp-dir-signal-"))); roots.push(root);
  const moduleUrl = new URL("../../runtime/interface/temp-dir.mjs", import.meta.url).href;
  const ready = join(root, "ready"), observed = join(root, "observed"), release = join(root, "release");
  const source = `
    import { existsSync, readFileSync, writeFileSync } from "node:fs";
    const { createTrackedTempDir } = await import(${JSON.stringify(moduleUrl)});
    const owned = createTrackedTempDir("owned-temp-", { root: ${JSON.stringify(root)} });
    writeFileSync(${JSON.stringify(ready)}, owned.path);
    const idle = setInterval(() => {}, 1000);
    process.on("SIGTERM", () => {
      writeFileSync(${JSON.stringify(observed)}, JSON.stringify({ exists: existsSync(owned.path) }));
      const drain = setInterval(() => {
        if (existsSync(${JSON.stringify(release)})) { clearInterval(drain); clearInterval(idle); process.exitCode = 143; }
      }, 5);
    });
  `;
  const child = spawn(process.execPath, ["--input-type=module", "-e", source], { stdio: "ignore" });
  const waitFor = async (path, timeoutMs = 2000) => {
    const deadline = Date.now() + timeoutMs;
    while (!existsSync(path) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 5));
    return existsSync(path);
  };
  try {
    expect(await waitFor(ready)).toBe(true);
    const ownedPath = readFileSync(ready, "utf8");
    const closed = new Promise((resolve, reject) => { child.once("error", reject); child.once("close", (code, signal) => resolve({ code, signal })); });
    expect(child.kill("SIGTERM")).toBe(true);
    expect(await waitFor(observed)).toBe(true);
    expect(JSON.parse(readFileSync(observed, "utf8"))).toEqual({ exists: true });
    expect(existsSync(ownedPath)).toBe(true);
    writeFileSync(release, "release");
    expect(await closed).toEqual({ code: 143, signal: null });
    expect(existsSync(ownedPath)).toBe(false);
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
  }
});
