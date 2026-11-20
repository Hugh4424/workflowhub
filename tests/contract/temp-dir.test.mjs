import { afterEach, describe, expect, it } from "vitest";
import { spawn, execFileSync, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
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

// 追加的生命周期用例：不进入上面的 ORACLE-P4-ISOLATED-TEST-DATA 用例，
// 也不改动它的断言；只覆盖合法准备、清理、根与版本拒绝、坏清单恢复与并发锁。
describe("P4 fixture lifecycle (appended)", () => {
  const fixtureRoot = () => {
    const value = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p4-lifecycle-")));
    roots.push(value);
    return value;
  };
  const runFixture = (root, args, cwd = root) =>
    runP4Prepare(args, { cwd, env: { PATH: process.env.PATH ?? "", HOME: join(root, "home"), TMPDIR: join(root, "tmp") } });
  const dataRootOf = (root) => {
    const value = join(root, "data-root");
    mkdirSync(value);
    return value;
  };
  const receiptOf = (result) => JSON.parse(result.stdout);
  const expectNoStack = (result, label) => {
    expect(`${result.stdout}${result.stderr}`, `${label} 不得抛栈`).not.toMatch(/\n\s+at /);
  };
  const runFixtureAsync = (root, args) => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [fileURLToPath(p4PrepareScript), ...args], {
      cwd: root,
      env: { PATH: process.env.PATH ?? "", HOME: join(root, "home"), TMPDIR: join(root, "tmp") },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code, signalValue) => resolve({ status: code, signal: signalValue, stdout, stderr }));
  });

  it("prepares the same bytes twice and separates normal, idempotent and residual clean", () => {
    const root = fixtureRoot();
    const dataRoot = dataRootOf(root);
    const first = runFixture(root, ["--data-root", dataRoot, "--sample-version", "1.0.0"]);
    expect(first.status).toBe(0);
    const prepared = receiptOf(first);
    expect(prepared.action).toBe("prepare");
    expect(prepared.version_check).toEqual({ requested: "1.0.0", required: "1.0.0", status: "current" });
    expect(prepared.readback).toEqual({ verified: 3 });
    expect(prepared.written).toHaveLength(3);
    expect(prepared.reused).toEqual([]);
    expect(prepared.cleanup.owner).toContain("测试数据负责人");
    expect(prepared.per_task_limit_basis.bytes).toBeGreaterThan(0);
    expect(prepared.data_source).toMatchObject({ kind: "synthetic-seed", sample_version: "1.0.0" });
    const bytes = prepared.written.map((relativePath) => [relativePath, readFileSync(join(dataRoot, relativePath), "utf8")]);

    const second = runFixture(root, ["--data-root", dataRoot, "--sample-version", "1.0.0"]);
    expect(second.status).toBe(0);
    const repeated = receiptOf(second);
    expect(repeated.written).toEqual([]);
    expect(repeated.reused).toEqual(prepared.written);
    for (const [relativePath, content] of bytes) expect(readFileSync(join(dataRoot, relativePath), "utf8"), relativePath).toBe(content);

    const clean = runFixture(root, ["--data-root", dataRoot, "--clean"]);
    expect(clean.status).toBe(0);
    expect(receiptOf(clean)).toMatchObject({ complete: true, residual: [], removed: prepared.written.filter((value) => value !== "manifest.json") });
    expect(readdirSync(dataRoot)).toEqual([]);

    const cleanAgain = runFixture(root, ["--data-root", dataRoot, "--clean"]);
    expect(cleanAgain.status).toBe(0);
    expect(receiptOf(cleanAgain)).toMatchObject({ already_clean: true, complete: true });

    expect(runFixture(root, ["--data-root", dataRoot, "--sample-version", "1.0.0"]).status).toBe(0);
    writeFileSync(join(dataRoot, "foreign.txt"), "foreign\n");
    const residual = runFixture(root, ["--data-root", dataRoot, "--clean"]);
    expect(residual.status).toBe(1);
    expect(receiptOf(residual)).toMatchObject({ complete: false, residual: ["foreign.txt"] });
    expect(existsSync(join(dataRoot, "foreign.txt"))).toBe(true);
    expect(residual.stderr).toContain("非本夹具对象");
    expectNoStack(residual, "残留清理");
  });

  it("refuses a symlinked records component without deleting the outside files", () => {
    const root = fixtureRoot();
    const dataRoot = dataRootOf(root);
    const outside = join(root, "outside");
    mkdirSync(outside);
    const victim = join(outside, "synth-task-001.json");
    writeFileSync(victim, "OUTSIDE-MUST-SURVIVE\n");
    writeFileSync(join(outside, "synth-task-002.json"), "OUTSIDE-MUST-SURVIVE-2\n");
    expect(runFixture(root, ["--data-root", dataRoot, "--sample-version", "1.0.0"]).status).toBe(0);

    rmSync(join(dataRoot, "records"), { recursive: true });
    symlinkSync(outside, join(dataRoot, "records"));
    const clean = runFixture(root, ["--data-root", dataRoot, "--clean"]);
    expect(clean.status).toBe(2);
    expect(clean.stderr).toContain("符号链接");
    expect(readFileSync(victim, "utf8")).toBe("OUTSIDE-MUST-SURVIVE\n");
    expect(readdirSync(outside).sort()).toEqual(["synth-task-001.json", "synth-task-002.json"]);
    expectNoStack(clean, "符号链接清理");

    const prepare = runFixture(root, ["--data-root", dataRoot, "--sample-version", "1.0.0"]);
    expect(prepare.status).toBe(2);
    expect(prepare.stderr).toContain("符号链接");
    expectNoStack(prepare, "符号链接准备");
  });

  it("rejects in-repo, cwd, relative and symlinked data roots with exit 2", () => {
    const root = fixtureRoot();
    const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
    const inRepo = runFixture(root, ["--data-root", join(repoRoot, "tests/fixtures/execution-quality"), "--sample-version", "1.0.0"]);
    expect(inRepo.status).toBe(2);
    expect(inRepo.stderr).toContain("产品仓");

    const cwdRoot = join(root, "cwd-root");
    mkdirSync(cwdRoot);
    const sameCwd = runFixture(root, ["--data-root", cwdRoot, "--sample-version", "1.0.0"], cwdRoot);
    expect(sameCwd.status).toBe(2);
    expect(sameCwd.stderr).toContain("当前工作目录");

    const relative = runFixture(root, ["--data-root", join("relative", "data"), "--sample-version", "1.0.0"]);
    expect(relative.status).toBe(2);
    expect(relative.stderr).toContain("绝对路径");

    const realData = join(root, "real-data");
    mkdirSync(realData);
    const linked = join(root, "linked-data");
    symlinkSync(realData, linked);
    const symlinkRoot = runFixture(root, ["--data-root", linked, "--sample-version", "1.0.0"]);
    expect(symlinkRoot.status).toBe(2);
    expect(symlinkRoot.stderr).toContain("符号链接");
    expect(readdirSync(realData)).toEqual([]);
    for (const result of [inRepo, sameCwd, relative, symlinkRoot]) expectNoStack(result, "根拒绝");
  });

  it("uses exact exit codes for missing, malformed, stale and newer versions and duplicate flags", () => {
    const root = fixtureRoot();
    const dataRoot = dataRootOf(root);
    const missingRoot = runFixture(root, []);
    expect(missingRoot.status).toBe(2);
    expect(missingRoot.stderr).toContain("--data-root");
    const missingVersion = runFixture(root, ["--data-root", dataRoot]);
    expect(missingVersion.status).toBe(2);
    expect(missingVersion.stderr).toContain("--sample-version");
    const malformed = runFixture(root, ["--data-root", dataRoot, "--sample-version", "1.0"]);
    expect(malformed.status).toBe(2);
    expect(malformed.stderr).toContain("无法解析");
    const stale = runFixture(root, ["--data-root", dataRoot, "--sample-version", "0.0.0"]);
    expect(stale.status).toBe(3);
    expect(stale.stderr).toMatch(/0\.0\.0/);
    expect(stale.stderr).toContain("1.0.0");
    const newer = runFixture(root, ["--data-root", dataRoot, "--sample-version", "2.0.0"]);
    expect(newer.status).toBe(3);
    expect(newer.stderr).toContain("unsupported");
    expect(readdirSync(dataRoot)).toEqual([]);

    const duplicateRoot = runFixture(root, ["--data-root", dataRoot, "--data-root", dataRoot, "--sample-version", "1.0.0"]);
    expect(duplicateRoot.status).toBe(2);
    expect(duplicateRoot.stderr).toContain("重复的 --data-root");
    const duplicateVersion = runFixture(root, ["--data-root", dataRoot, "--sample-version", "1.0.0", "--sample-version", "1.0.0"]);
    expect(duplicateVersion.status).toBe(2);
    expect(duplicateVersion.stderr).toContain("重复的 --sample-version");
    const discardWithoutClean = runFixture(root, ["--data-root", dataRoot, "--sample-version", "1.0.0", "--discard-invalid-manifest"]);
    expect(discardWithoutClean.status).toBe(2);
    for (const result of [missingRoot, missingVersion, malformed, stale, newer, duplicateRoot, duplicateVersion, discardWithoutClean]) expectNoStack(result, "版本与参数");
  });

  it("fails by name when the existing sample is older than the required version", () => {
    const root = fixtureRoot();
    const dataRoot = dataRootOf(root);
    const prepared = receiptOf(runFixture(root, ["--data-root", dataRoot, "--sample-version", "1.0.0"]));
    writeFileSync(
      join(dataRoot, "manifest.json"),
      `${JSON.stringify({ schema: "workflowhub-test-data.v1", sample_version: "0.0.0", seed: "planted", owner: prepared.cleanup.owner, files: [], total_bytes: 0 }, null, 2)}\n`,
    );
    const stale = runFixture(root, ["--data-root", dataRoot, "--sample-version", "1.0.0"]);
    expect(stale.status).toBe(3);
    expect(stale.stderr).toMatch(/0\.0\.0.*1\.0\.0/);
    expect(JSON.parse(readFileSync(join(dataRoot, "manifest.json"), "utf8")).sample_version).toBe("0.0.0");
    expect(existsSync(join(dataRoot, "records", "synth-task-001.json"))).toBe(true);
    expectNoStack(stale, "既有样本落后");
  });

  it("reports an invalid manifest by name and recovers only through the explicit clean path", () => {
    const root = fixtureRoot();
    const dataRoot = dataRootOf(root);
    const prepared = receiptOf(runFixture(root, ["--data-root", dataRoot, "--sample-version", "1.0.0"]));
    writeFileSync(
      join(dataRoot, "manifest.json"),
      `${JSON.stringify({ schema: "workflowhub-test-data.v1", sample_version: "1.0.0", seed: "x", owner: prepared.cleanup.owner, files: [null] }, null, 2)}\n`,
    );
    const prepareAgain = runFixture(root, ["--data-root", dataRoot, "--sample-version", "1.0.0"]);
    expect(prepareAgain.status).toBe(2);
    expect(prepareAgain.stderr).toContain("清单无效");
    expectNoStack(prepareAgain, "坏清单准备");

    const plainClean = runFixture(root, ["--data-root", dataRoot, "--clean"]);
    expect(plainClean.status).toBe(2);
    expect(plainClean.stderr).toContain("--discard-invalid-manifest");
    expectNoStack(plainClean, "坏清单普通清理");

    const recovered = runFixture(root, ["--data-root", dataRoot, "--clean", "--discard-invalid-manifest"]);
    expect(recovered.status).toBe(0);
    expect(receiptOf(recovered)).toMatchObject({ recovered: true, recovered_reason: "invalid_manifest", complete: true, removed: expect.arrayContaining(["manifest.json"]) });
    expect(readdirSync(dataRoot)).toEqual([]);

    // 清单缺失（如崩溃残留在写清单前）：普通 clean 先失败，显式恢复按固定自有路径回收
    expect(runFixture(root, ["--data-root", dataRoot, "--sample-version", "1.0.0"]).status).toBe(0);
    rmSync(join(dataRoot, "manifest.json"));
    const missing = runFixture(root, ["--data-root", dataRoot, "--clean"]);
    expect(missing.status).toBe(2);
    expect(missing.stderr).toContain("--discard-invalid-manifest");
    expectNoStack(missing, "缺失清单清理");
    const recoveredMissing = runFixture(root, ["--data-root", dataRoot, "--clean", "--discard-invalid-manifest"]);
    expect(recoveredMissing.status).toBe(0);
    expect(receiptOf(recoveredMissing)).toMatchObject({ recovered: true, recovered_reason: "missing_manifest", complete: true });
    expect(readdirSync(dataRoot)).toEqual([]);
  });

  it("sweeps its own temporary residue before clean and explicit recovery", () => {
    const root = fixtureRoot();
    const dataRoot = dataRootOf(root);
    const prepared = receiptOf(runFixture(root, ["--data-root", dataRoot, "--sample-version", "1.0.0"]));
    writeFileSync(
      join(dataRoot, "manifest.json"),
      `${JSON.stringify({ schema: "workflowhub-test-data.v1", sample_version: "1.0.0", seed: "x", owner: prepared.cleanup.owner, files: [null] }, null, 2)}\n`,
    );
    writeFileSync(join(dataRoot, ".prepare-test-data.tmp-999-1"), "partial write\n");
    writeFileSync(join(dataRoot, "records", ".prepare-test-data.tmp-999-2"), "partial write\n");
    const plain = runFixture(root, ["--data-root", dataRoot, "--clean"]);
    expect(plain.status).toBe(2);
    expect(plain.stderr).toContain("--discard-invalid-manifest");
    expectNoStack(plain, "残留+坏清单普通清理");

    const recovered = runFixture(root, ["--data-root", dataRoot, "--clean", "--discard-invalid-manifest"]);
    expect(recovered.status).toBe(0);
    expect(receiptOf(recovered)).toMatchObject({ recovered: true, recovered_reason: "invalid_manifest", complete: true });
    expect(readdirSync(dataRoot)).toEqual([]);

    // 只有自有残留、没有清单：clean 先按前缀回收，隔离根还原为已清状态
    writeFileSync(join(dataRoot, ".prepare-test-data.tmp-999-3"), "partial write\n");
    const sweptOnly = runFixture(root, ["--data-root", dataRoot, "--clean"]);
    expect(sweptOnly.status).toBe(0);
    expect(receiptOf(sweptOnly)).toMatchObject({ already_clean: true, complete: true });
    expect(readdirSync(dataRoot)).toEqual([]);
  });

  it("takes over a stale lock atomically so only one concurrent writer prepares", async () => {
    const root = fixtureRoot();
    const dataRoot = dataRootOf(root);
    const dead = spawnSync(process.execPath, ["-e", ""]).pid;
    writeFileSync(join(dataRoot, ".prepare-test-data.lock"), `${JSON.stringify({ pid: dead, started_at: new Date().toISOString() })}\n`);
    const [first, second] = await Promise.all([
      runFixtureAsync(root, ["--data-root", dataRoot, "--sample-version", "1.0.0"]),
      runFixtureAsync(root, ["--data-root", dataRoot, "--sample-version", "1.0.0"]),
    ]);
    for (const result of [first, second]) {
      expect([0, 2], JSON.stringify(result.stderr)).toContain(result.status);
      expectNoStack(result, "陈旧锁并发");
    }
    const successes = [first, second].filter((result) => result.status === 0).map(receiptOf);
    expect(successes.length).toBeGreaterThanOrEqual(1);
    expect(successes.filter((receipt) => receipt.written.length > 0)).toHaveLength(1);
    expect(readdirSync(dataRoot).filter((name) => name.startsWith(".prepare-test-data"))).toEqual([]);
    expect(JSON.parse(readFileSync(join(dataRoot, "manifest.json"), "utf8")).files).toHaveLength(2);
    expect(runFixture(root, ["--data-root", dataRoot, "--clean"]).status).toBe(0);
  });

  it.skipIf(typeof process.getuid === "function" && process.getuid() === 0)("turns permission and occupied-target failures into named errors without a stack", () => {
    const root = fixtureRoot();
    const readOnly = join(root, "read-only");
    mkdirSync(readOnly);
    chmodSync(readOnly, 0o500);
    try {
      const denied = runFixture(root, ["--data-root", readOnly, "--sample-version", "1.0.0"]);
      expect(denied.status).toBe(1);
      expect(denied.stderr).toContain("夹具执行失败");
      expectNoStack(denied, "权限失败");
    } finally {
      chmodSync(readOnly, 0o700);
    }
    expect(readdirSync(readOnly)).toEqual([]);

    const dataRoot = dataRootOf(root);
    expect(runFixture(root, ["--data-root", dataRoot, "--sample-version", "1.0.0"]).status).toBe(0);
    rmSync(join(dataRoot, "records", "synth-task-001.json"));
    mkdirSync(join(dataRoot, "records", "synth-task-001.json"));
    const occupied = runFixture(root, ["--data-root", dataRoot, "--sample-version", "1.0.0"]);
    expect(occupied.status).toBe(2);
    expect(occupied.stderr).toContain("拒绝覆盖");
    expectNoStack(occupied, "目标占用");
  });

  it("rejects a concurrent writer through the root lock", () => {
    const root = fixtureRoot();
    const dataRoot = dataRootOf(root);
    const lock = join(dataRoot, ".prepare-test-data.lock");
    writeFileSync(lock, `${JSON.stringify({ pid: process.pid, started_at: new Date().toISOString() })}\n`);
    const blocked = runFixture(root, ["--data-root", dataRoot, "--sample-version", "1.0.0"]);
    expect(blocked.status).toBe(2);
    expect(blocked.stderr).toContain("正在使用");
    expect(readdirSync(dataRoot)).toEqual([".prepare-test-data.lock"]);
    expectNoStack(blocked, "并发锁");
    rmSync(lock);
    expect(runFixture(root, ["--data-root", dataRoot, "--sample-version", "1.0.0"]).status).toBe(0);
  });
});
