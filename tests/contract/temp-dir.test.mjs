import { afterEach, expect, it } from "vitest";
import { spawn, execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

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

const p4PrepareScript = new URL("../fixtures/execution-quality/prepare-test-data.mjs", import.meta.url);
const runP4Prepare = (args, { cwd, env }) => spawnSync(process.execPath, [fileURLToPath(p4PrepareScript), ...args], { cwd, env, encoding: "utf8" });

it("ORACLE-P4-ISOLATED-TEST-DATA: 缺显式隔离根、实际配置缺失与过期样本都必须具名失败而非回退读出准备结果", () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p4-isolated-"))); roots.push(root);
  const dataRoot = join(root, "data-root"), fallbackCwd = join(root, "fallback-cwd");
  const env = { PATH: process.env.PATH ?? "", HOME: join(root, "home"), TMPDIR: join(root, "tmp") };
  for (const path of [dataRoot, fallbackCwd, env.HOME, env.TMPDIR]) mkdirSync(path);
  // 受控假准备结果：只放在 cwd 与默认临时根旁，绝不接真库或真实产品库。
  const preparedToken = "P4-PREPARED-RESULT-ORACLE";
  writeFileSync(join(fallbackCwd, "prepared-test-data.json"), JSON.stringify({ oracle: preparedToken }));

  // 装置前置：目标断言只对 P4 受控夹具入口成立。夹具未实现时如实记装置失败，
  // 不把缺失入口当成目标 RED（P4「RED 目标失败」段）。
  if (!existsSync(fileURLToPath(p4PrepareScript))) {
    throw new Error("装置失败：tests/fixtures/execution-quality/prepare-test-data.mjs 未实现，未到目标断言，不判为目标 RED/GREEN。");
  }

  const textOf = (result) => `${result.stdout}${result.stderr}`;
  const expectNamedFailure = (result, label) => {
    expect(result.status, `ORACLE-P4-ISOLATED-TEST-DATA: ${label} 必须非零退出`).toBeGreaterThan(0);
    const text = textOf(result);
    expect(text, `ORACLE-P4-ISOLATED-TEST-DATA: ${label} 不得回退读出准备结果`).not.toContain(preparedToken);
    return text;
  };

  // A. 省略 --data-root：不得回退默认根，也不得从 cwd 读出准备结果。
  const missingRoot = expectNamedFailure(runP4Prepare([], { cwd: fallbackCwd, env }), "省略 --data-root");
  expect(missingRoot, "ORACLE-P4-ISOLATED-TEST-DATA: 缺根失败须具名指出 --data-root").toContain("--data-root");
  expect(readdirSync(fallbackCwd), "ORACLE-P4-ISOLATED-TEST-DATA: 回退目录不得被写入或复制").toEqual(["prepared-test-data.json"]);
  expect(readdirSync(env.TMPDIR), "ORACLE-P4-ISOLATED-TEST-DATA: 默认临时根不得被当作回退目标").toEqual([]);

  // B. 实际配置缺失（显式隔离根已给，但夹具要求的样本版本未具名）：须具名失败，
  // 不得改读 cwd 准备结果，也不得先产生样本（夹具只接受显式 --data-root 与样本版本）。
  const missingConfig = expectNamedFailure(runP4Prepare(["--data-root", dataRoot], { cwd: fallbackCwd, env }), "样本版本配置缺失");
  expect(missingConfig, "ORACLE-P4-ISOLATED-TEST-DATA: 配置缺失失败须具名指出 --sample-version").toContain("--sample-version");
  expect(readdirSync(dataRoot), "ORACLE-P4-ISOLATED-TEST-DATA: 具名失败前不得生成样本").toEqual([]);

  // C. 过期样本版本：须报出请求版本并给出要求/现状版本，不得静默放行。
  const staleVersion = expectNamedFailure(runP4Prepare(["--data-root", dataRoot, "--sample-version", "0.0.0"], { cwd: fallbackCwd, env }), "过期样本版本");
  expect(staleVersion, "ORACLE-P4-ISOLATED-TEST-DATA: 过期失败须点名请求版本").toContain("0.0.0");
  expect(staleVersion, "ORACLE-P4-ISOLATED-TEST-DATA: 过期失败须带版本诊断").toMatch(/stale|outdated|older|required|expected|current|过期|要求/i);
});
