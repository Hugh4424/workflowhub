// P5 预写测试：派发前拦截客观开工错误。
// 合同：runtime/stage/stage-content-contracts.mjs 的 validatePostPhaseContract。
// 入口：tools/cli/stage-runtime.mjs 的 run --action=execute 首步（P5 要求在此加一次就绪调用）。
// RED 目标失败：ORACLE-PHASE-READINESS。合法表配失败/缺失探针时，当前入口
// 仍返回 0 并写入派发行；本文件不 mock 入口，让真实失败暴露。
// 隔离：全部数据建在 createTrackedTempDir 的临时目录，不写产品库、不连真实任务。
import { afterEach, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createTrackedTempDir } from "../../runtime/interface/temp-dir.mjs";
import { phaseReadinessRows, readinessProbeArgv, validatePostPhaseContract } from "../../runtime/stage/stage-content-contracts.mjs";

const ORACLE = "ORACLE-PHASE-READINESS";
const PHASE_REF = "phases/P1-readiness.md";
const CLI = fileURLToPath(new URL("../../tools/cli/stage-runtime.mjs", import.meta.url));
const RUN_CHECKS = fileURLToPath(new URL("../../tools/cli/run-checks.mjs", import.meta.url));
const GATE_COMMAND = "node --test tests/owned.test.mjs";
// 五列＝命令、期望、证据、机器或人判、负责人（P5 开工就绪表）。
// 机器项只接受只读 allowlist 命令；解释器 -c/-e 与写删命令一律拒绝。
const PASSING_PROBE = "git rev-parse --show-toplevel";
const FAILING_PROBE = "git rev-parse --verify refs/heads/p5-readiness-absent";

const owned = [];
const cleanEnv = () => {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key];
  return env;
};
const git = (cwd, ...argv) => execFileSync("git", argv, {
  cwd, env: cleanEnv(), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
}).trim();

function trackedRoot(prefix) {
  const owned_ = createTrackedTempDir(prefix);
  owned.push(owned_);
  return owned_.path;
}

function readinessTable(probe, humanFirst = false) {
  const rows = probe === null ? [] : [`| \`${probe}\` | 0 | quality/tests/p5-readiness.output | 机器 | 计划负责人 |`];
  const human = ["| 人工核对样本 | 样本与当前版本一致 | quality/tests/human-sample.md | 人 | 数据负责人 |"];
  const ordered = probe === null ? [] : (humanFirst ? [...human, ...rows] : [...rows, ...human]);
  return ["### 开工就绪表", "| 命令 | 期望 | 证据 | 机器或人判 | 负责人 |", "| --- | --- | --- | --- | --- |", ...ordered, ""].join("\n");
}

// 合法 spec/index/phases；probe=null 表示空表缺探针，其他字符串为真实命令；
// readiness=false 表示 Phase 没有开工就绪表。
function materials({ probe = PASSING_PROBE, ref = PHASE_REF, readiness = true, humanFirst = false } = {}) {
  const spec = [
    "# Spec",
    "- **FR-001**：Visible owned result.",
    "- [ ] **AC-001 — visible result**",
    "  - **需求**：FR-001",
    "  - **通过条件**：visible result is returned.",
    "  - **失败条件**：result is lost.",
    "",
    "## 实现设计（全局权威）",
    "### Code Anchors",
    "`README.md` owns visible output.",
    "### Interfaces and Failure Semantics",
    "Return visible output and preserve failure.",
    "### Requirement-to-Task Trace",
    "| source | FR | AC | task | oracle |",
    "| --- | --- | --- | --- | --- |",
    `| R-001 | FR-001 | AC-001 | P1/T001 | ${ORACLE} |`,
    "### Global Verification Strategy",
    `\`${GATE_COMMAND}\``,
    "",
  ].join("\n");
  const index = [
    "# Phase index",
    "",
    "## Execution Index",
    "",
    "| phase | authority ref | semantic anchor | write set | dependency | consumer |",
    "| --- | --- | --- | --- | --- | --- |",
    `| \`P1\` | \`${ref}\` | \`phase-p1\` | \`README.md\` | \`none\` | build-code |`,
    "",
  ].join("\n");
  const phase = [
    "# Phase P1 — readiness gate",
    "- **Global spec**：`spec.md`",
    "- **Write set**：`README.md`",
    "- **Dependency**：none",
    "- **Consumer**：build-code",
    "## L0 — Outcome",
    ...(readiness ? [readinessTable(probe, humanFirst)] : []),
    `- **gate_cmd**：\`${GATE_COMMAND}\``,
    "- **expected_exit**：RED nonzero; GREEN 0",
    `- **oracle**：${ORACLE}`,
    "- **evidence_path**：planned: quality/tests/p5-readiness.output",
    "- **STOP**：preserve actual failure",
    "- **Done**：real target result",
    "## L1 — Contract",
    "### T001 — deliver owned result",
    "This card delivers the owned visible result and keeps the lost-output failure replayable.",
    "- **Source / FR / AC**：R-001 / FR-001 / AC-001",
    "- **Files / symbols**：`README.md` symbol: N/A — fixture source text",
    "- **Action**：return the owned result",
    "- **Inputs**：owned input and a negative case",
    "- **Outputs / failure**：visible output or explicit failure",
    "- **Boundary / DO NOT TOUCH**：no external repository changes",
    "- **Dependency**：none",
    "- **Test tier / skill**：feature / backend-testing",
    "- **Scenario / fixture or service**：owned local result",
    `- **RED/GREEN gate_cmd**：\`${GATE_COMMAND}\``,
    "- **expected_exit**：RED target nonzero; GREEN 0",
    `- **RED target failure**：${ORACLE} assertion fails when result lost`,
    `- **GREEN oracle**：${ORACLE} visible output assertion`,
    "- **Evidence**：quality/tests/p5-readiness.output",
    "- **STOP / recovery**：preserve failure and continue safe repair",
    "- **Coverage limit**：no external provider quality",
    "- **Done**：real result and evidence",
    "## L2 — Removable reference",
    "Owned fixture, not a workflow permit.",
    "",
  ].join("\n");
  return { spec, index, phases: { [ref]: phase } };
}

// 入口级夹具：临时 git 仓库 + worktree + 假任务（task.json/facts.jsonl），不连真实库。
function entryFixture({ probe, taskId = "p5-readiness-owned", readiness = true, humanFirst = false } = {}) {
  const root = trackedRoot("p5-readiness-");
  const repo = join(root, "repo"), worktree = join(root, "worktree"), storage = join(root, "storage"), home = join(root, "home");
  const taskDir = join(storage, "Projects", "workflowhub", "tasks", taskId), hooks = join(root, "hooks");
  for (const dir of [repo, home, taskDir, hooks]) mkdirSync(dir, { recursive: true });
  git(repo, "init", "-q", "-b", "main");
  for (const [key, value] of [["user.name", "P5 readiness oracle"], ["user.email", "oracle@example.invalid"], ["commit.gpgsign", "false"], ["core.hooksPath", hooks]]) git(repo, "config", key, value);
  writeFileSync(join(repo, "README.md"), "owned baseline\n");
  git(repo, "add", ".");
  git(repo, "commit", "-qm", "owned baseline");
  git(repo, "worktree", "add", "-q", "-b", `task/workflowhub/${taskId}`, worktree, "main");
  const materialRoot = join(worktree, "specs", taskId), phaseDir = join(materialRoot, "phases");
  mkdirSync(phaseDir, { recursive: true });
  writeFileSync(join(materialRoot, "decision-log.md"), "# Decision\n");
  const docs = materials({ probe, readiness, humanFirst });
  writeFileSync(join(materialRoot, "spec.md"), docs.spec);
  writeFileSync(join(materialRoot, "phases/index.md"), docs.index);
  writeFileSync(join(materialRoot, PHASE_REF), docs.phases[PHASE_REF]);
  git(worktree, "add", "specs");
  git(worktree, "commit", "-qm", "owned materials");
  writeFileSync(join(taskDir, "task.json"), JSON.stringify({
    schema_version: "1.0.0", project_name: "workflowhub", task_id: taskId, target_repo_root: repo,
    record_model: "vnext-single-write", activation_cohort: "post", workspace_mode: "existing", workspace_root: worktree,
  }));
  writeFileSync(join(taskDir, "facts.jsonl"), "");
  const env = { ...cleanEnv(), WORKFLOWHUB_TASK_DIR: storage, HOME: home, XDG_CONFIG_HOME: join(home, ".config") };
  const runEntry = (input, extraEnv = {}) => {
    const inputPath = join(root, `entry-input-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
    writeFileSync(inputPath, JSON.stringify(input));
    const argv = [CLI, "run", "--action=execute", "--stage=build-code", "--project=workflowhub",
      `--task=${taskId}`, `--task-path=${taskDir}`, `--input=${inputPath}`];
    const result = spawnSync(process.execPath, argv, { cwd: worktree, env: { ...env, ...extraEnv }, encoding: "utf8", timeout: 30_000 });
    const record = {
      oracle: ORACLE,
      command: [process.execPath, ...argv].join(" "),
      cwd: worktree,
      exit: result.status,
      signal: result.signal ?? null,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    };
    entryRuns.push(record);
    return record;
  };
  // 真实门捕获入口：verify --action=execute 走 capture-tests，和产品读回同一路线。
  // 单独返回、不进 entryRuns（entryRuns 只收 run --action=execute 的真实记录）。
  const runVerify = (input, extraEnv = {}) => {
    const inputPath = join(root, `verify-input-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
    writeFileSync(inputPath, JSON.stringify(input));
    const argv = [CLI, "verify", "--action=execute", "--stage=build-code", "--project=workflowhub",
      `--task=${taskId}`, `--task-path=${taskDir}`, `--input=${inputPath}`];
    const result = spawnSync(process.execPath, argv, { cwd: worktree, env: { ...env, ...extraEnv }, encoding: "utf8", timeout: 30_000 });
    return { command: [process.execPath, ...argv].join(" "), exit: result.status, signal: result.signal ?? null,
      stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
  };
  return {
    root, repo, worktree, storage, home, taskId, taskDir, materialRoot, runEntry, runVerify,
    factsBytes: () => readFileSync(join(taskDir, "facts.jsonl")),
    writeSetBytes: () => readFileSync(join(worktree, "README.md")),
    factsRows: () => readFileSync(join(taskDir, "facts.jsonl"), "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line)),
  };
}

const entryRuns = [];
const cursorInput = () => ({ phase_progress: { phase_id: "P1", task_id: "T001" } });
const summarise = (run) => `exit=${run.exit} stdout=${JSON.stringify(run.stdout.trim().slice(0, 400))} stderr=${JSON.stringify(run.stderr.trim().slice(0, 600))}`;

afterEach(() => {
  while (owned.length) owned.pop().dispose();
});

it("ORACLE-PHASE-READINESS: 合法 spec/index/phases 通过合同并给出可派发事实", () => {
  const result = validatePostPhaseContract(materials());
  expect(result.errors, "合法材料不得有具名错误").toEqual([]);
  expect(result.ok, "合法材料必须判为可派发").toBe(true);
  expect(result.facts, "可派发判定必须带可回读事实").not.toBeNull();
  expect(result.facts.phase_count).toBe(1);
  expect(result.facts.task_count).toBe(1);
  expect(result.facts.phase_rows[0]).toMatchObject({
    id: "P1", path: PHASE_REF, write_set: ["README.md"], task_ids: ["T001"], oracle: ORACLE,
  });
  expect(result.facts.dependency_validation.valid).toBe(true);
  expect(result.facts.command_oracle_checks).toEqual({ valid: true });
});

it("ORACLE-PHASE-READINESS: 缺 Phase 文件返回具名错误且不可派发", () => {
  const result = validatePostPhaseContract({ ...materials(), phases: {} });
  expect(result.ok, "缺 Phase 不能可派发").toBe(false);
  expect(result.errors, "必须具名指出缺哪个 Phase 文件").toContain(`${PHASE_REF} is missing or empty`);
});

it("ORACLE-PHASE-READINESS: 缺 Task 卡返回具名错误且不可派发", () => {
  const broken = materials();
  broken.phases[PHASE_REF] = broken.phases[PHASE_REF].replace(/### T001[\s\S]*?## L2/, "## L2");
  const result = validatePostPhaseContract(broken);
  expect(result.ok, "缺 Task 不能可派发").toBe(false);
  expect(result.errors.some((error) => error.includes(`${PHASE_REF} requires independent ### Tnnn task cards`)), "必须具名指出缺 Task 卡").toBe(true);
});

it("ORACLE-PHASE-READINESS: 缺 AC 返回具名错误且不可派发", () => {
  const broken = materials();
  broken.spec = broken.spec.replace(/- \[ \] \*\*AC-001[\s\S]*?失败条件\*\*：result is lost\.\n/, "");
  const result = validatePostPhaseContract(broken);
  expect(result.ok, "缺 AC 不能可派发").toBe(false);
  expect(result.errors.some((error) => /unknown AC: AC-001|requires accepted FR and AC definitions/.test(error)), "必须具名指出 AC 缺失").toBe(true);
});

it("ORACLE-PHASE-READINESS: 写集不一致返回具名错误且不可派发", () => {
  const broken = materials();
  broken.index = broken.index.replace("`README.md`", "`docs/other.md`");
  const result = validatePostPhaseContract(broken);
  expect(result.ok, "写集不一致不能可派发").toBe(false);
  expect(result.errors, "必须具名指出写集与索引不一致").toContain(`${PHASE_REF} write set differs from Phase index`);
});

it("ORACLE-PHASE-READINESS: 合法表配失败探针时入口非零拒绝，且 facts 无新派发行、写集字节不变", () => {
  const fixture = entryFixture({ probe: FAILING_PROBE });
  const beforeFacts = fixture.factsBytes(), beforeWriteSet = fixture.writeSetBytes();
  const run = fixture.runEntry(cursorInput());
  const afterFacts = fixture.factsBytes(), afterWriteSet = fixture.writeSetBytes();
  const dispatched = fixture.factsRows().filter((row) => row?.stage === "build-code");
  // soft 断言让同一次失败回传真实 exit、facts 与拒绝理由，而不是只报第一条。
  expect.soft(run.exit, `${ORACLE}: 失败探针必须让入口非零拒绝；实际 ${summarise(run)}`).not.toBe(0);
  expect.soft(run.stderr, `${ORACLE}: 拒绝理由必须具名且可回读；实际 ${summarise(run)}`).toMatch(/ORACLE-PHASE-READINESS|readiness|探针|probe/i);
  expect.soft(dispatched, `${ORACLE}: 拒绝后 facts 不得新增派发行；实际 ${JSON.stringify(dispatched)}`).toEqual([]);
  expect.soft(afterFacts.equals(beforeFacts), `${ORACLE}: 拒绝后 facts.jsonl 字节必须不变；实际 ${afterFacts.length} vs ${beforeFacts.length}`).toBe(true);
  expect.soft(afterWriteSet.equals(beforeWriteSet), `${ORACLE}: 拒绝后声明写集字节必须不变`).toBe(true);
});

it("ORACLE-PHASE-READINESS: 合法表配缺失探针时入口非零拒绝，保留原 facts 字节", () => {
  const fixture = entryFixture({ probe: null });
  const beforeFacts = fixture.factsBytes();
  const run = fixture.runEntry(cursorInput());
  expect.soft(run.exit, `${ORACLE}: 缺探针必须让入口非零拒绝；实际 ${summarise(run)}`).not.toBe(0);
  expect.soft(fixture.factsBytes().equals(beforeFacts), `${ORACLE}: 缺探针拒绝后 facts 字节必须不变；实际 ${JSON.stringify(fixture.factsRows())}`).toBe(true);
});

it("ORACLE-PHASE-READINESS: 失败恢复后同一入口回到可派发并新增一行真实派发记录", () => {
  const fixture = entryFixture({ probe: FAILING_PROBE });
  const rejected = fixture.runEntry(cursorInput());
  expect(rejected.exit, `${ORACLE}: 恢复前必须先看到真实拒绝；实际 ${summarise(rejected)}`).not.toBe(0);
  expect(fixture.factsRows().filter((row) => row?.stage === "build-code"), "拒绝不得留下派发行").toEqual([]);
  // 只改探针条件（同一合法表），不换入口、不换材料形状。
  const phase = materials({ probe: PASSING_PROBE }).phases[PHASE_REF];
  writeFileSync(join(fixture.materialRoot, PHASE_REF), phase);
  git(fixture.worktree, "add", "specs");
  git(fixture.worktree, "commit", "-qm", "restore passing probe");
  const accepted = fixture.runEntry(cursorInput());
  const rows = fixture.factsRows().filter((row) => row?.stage === "build-code");
  expect(accepted.exit, `${ORACLE}: 恢复后同一入口必须可派发；实际 ${summarise(accepted)}`).toBe(0);
  expect(rows.length, "恢复后必须有且只有一行真实派发记录").toBe(1);
  expect(fixture.writeSetBytes(), "派发不得改动声明写集字节").toEqual(Buffer.from("owned baseline\n"));
});

it("ORACLE-PHASE-READINESS: 名字可见且证据/退出码按真实运行记录", () => {
  expect(ORACLE).toBe("ORACLE-PHASE-READINESS");
  expect(validatePostPhaseContract(materials()).facts.phase_rows[0].oracle, "可派发事实必须带上 oracle 名").toBe(ORACLE);
  expect(entryRuns.length, "入口必须实际运行过，而不是 mock 或跳过").toBeGreaterThan(0);
  for (const run of entryRuns) {
    expect(run.oracle).toBe(ORACLE);
    expect(run.command).toContain("run --action=execute");
    expect(Number.isInteger(run.exit) || run.signal !== null, "每次真实运行都要记录退出码或信号").toBe(true);
    expect(run.stdout, "原始 stdout 必须保留，供证据回读").toBeTypeOf("string");
  }
  console.log(`[${ORACLE}] 真实入口运行记录：${JSON.stringify(entryRuns.map(({ command, exit, signal }) => ({ command, exit, signal })), null, 1)}`);
});

// P5 hardening additions (F1/F2/F3/F4/F5/F6/F8/F9). They append cases; the
// earlier assertions and their oracle identity stay untouched.
const runChecks = (fixture, stage = "build-plan") => {
  const argv = [RUN_CHECKS, "--material-root", fixture.materialRoot];
  if (stage !== "infer") argv.push(`--stage=${stage ?? "build-plan"}`);
  return spawnSync(process.execPath, argv,
    { cwd: fixture.worktree, env: { ...cleanEnv(), HOME: fixture.home, XDG_CONFIG_HOME: join(fixture.home, ".config"), WORKFLOWHUB_TASK_DIR: fixture.storage }, encoding: "utf8", timeout: 120_000 });
};
const readinessFiles = (fixture) => {
  const dir = join(fixture.taskDir, "quality", "tests");
  try { return readdirSync(dir).filter((name) => /-readiness-.*\.json$/.test(name)).sort(); } catch { return []; }
};

it("ORACLE-PHASE-READINESS: 只读 allowlist 拒绝解释器与写删命令", () => {
  for (const allowed of ["git rev-parse --show-toplevel", "node --version", "shasum -a 256 README.md", "uname -s"]) {
    expect(() => readinessProbeArgv(allowed), `${allowed} 应被接受`).not.toThrow();
  }
  expect(() => readinessProbeArgv("git status --porcelain && echo unsafe"), "shell 元字符必须被拒").toThrow(/metacharacter/i);
  expect(() => readinessProbeArgv("git status --porcelain"), "git status 会刷新 index，必须被拒").toThrow(/read-only subcommands/i);
  for (const denied of ["customtool --version", "busybox ls"]) {
    expect(() => readinessProbeArgv(denied), `${denied} 未知可执行必须被拒`).toThrow(/read-only allowlist/i);
  }
  for (const denied of ['sh -c "rm -rf /tmp/x"', "rm -rf /tmp/x", 'node -e "process.exit(0)"']) {
    expect(() => readinessProbeArgv(denied), `${denied} 必须被拒绝`).toThrow(/allowlist|read-only|interpreter|only accepts/i);
  }
});

it("ORACLE-PHASE-READINESS: 无开工就绪表时具名拒绝且不派发", () => {
  const broken = materials({ readiness: false });
  const parsed = validatePostPhaseContract({ ...broken, require_readiness: true });
  expect(parsed.ok, "无表不能可派发").toBe(false);
  expect(parsed.errors.some((error) => /missing readiness table/i.test(error)), "必须具名缺表").toBe(true);
  const fixture = entryFixture({ probe: PASSING_PROBE, readiness: false });
  const run = fixture.runEntry(cursorInput());
  expect(run.exit, `${ORACLE}: 无表必须非零拒绝；实际 ${summarise(run)}`).not.toBe(0);
  expect(run.stderr).toMatch(/missing readiness table/i);
  expect(fixture.factsBytes().length, "无表拒绝不得写派发行").toBe(0);
});

it("ORACLE-PHASE-READINESS: 恶意 argv 在真实入口被拒且无派发", () => {
  for (const probe of ['sh -c "rm -rf /tmp/x"', "rm -rf /tmp/x", 'node -e "process.exit(0)"', "git status --porcelain && echo unsafe"]) {
    const fixture = entryFixture({ probe });
    const run = fixture.runEntry(cursorInput());
    expect.soft(run.exit, `${probe} 必须非零拒绝；实际 ${summarise(run)}`).not.toBe(0);
    expect.soft(run.stderr).toMatch(/allowlist|read-only|interpreter|only accepts/i);
    expect.soft(fixture.factsBytes().length, `${probe} 拒绝后不得写派发行`).toBe(0);
  }
});

it("ORACLE-PHASE-READINESS: 材料变更后旧指纹按 stale 非零拒绝，重跑后才恢复", () => {
  const fixture = entryFixture({ probe: PASSING_PROBE });
  const first = fixture.runEntry(cursorInput());
  expect(first.exit, `${ORACLE}: 首次必须通过；实际 ${summarise(first)}`).toBe(0);
  const rowsBefore = fixture.factsRows().length;
  const phase = readFileSync(join(fixture.materialRoot, PHASE_REF), "utf8");
  writeFileSync(join(fixture.materialRoot, PHASE_REF), `${phase}\n<!-- one material byte changed -->\n`);
  const stale = fixture.runEntry(cursorInput());
  expect.soft(stale.exit, `${ORACLE}: stale 必须非零拒绝；实际 ${summarise(stale)}`).not.toBe(0);
  expect.soft(stale.stderr).toMatch(/stale readiness result/i);
  expect.soft(fixture.factsRows().length, "stale 拒绝后 facts 行数必须不变").toBe(rowsBefore);
  const staleName = readinessFiles(fixture).filter((name) => name.endsWith("-stale.json")).at(-1);
  expect(staleName, "stale 拒绝必须留下具名原件").toBeTruthy();
  const stalePath = join(fixture.taskDir, "quality", "tests", staleName);
  const staleRecord = JSON.parse(readFileSync(stalePath, "utf8"));
  expect(staleRecord.status).toBe("stale");
  expect(staleRecord.recover?.action, "stale 原件必须写明恢复动作").toBe("rerun-same-entry");
  const recovered = fixture.runEntry(cursorInput());
  expect(recovered.exit, `${ORACLE}: 显式重跑后必须恢复；实际 ${summarise(recovered)}`).toBe(0);
  const row = fixture.factsRows().find((entry) => entry?.stage === "build-code");
  expect(fixture.factsRows().filter((entry) => entry?.stage === "build-code").length, "恢复后仍只有一行").toBe(1);
  expect(row.source.split("; readiness: ").length - 1, "source 只追加一次就绪引用").toBe(1);
  const recoveredRecord = JSON.parse(readFileSync(row.source.split("; readiness: ")[1], "utf8"));
  expect(recoveredRecord.recovered?.from, "恢复原件必须记录 recovered_from").toBe(stalePath);
  expect(recoveredRecord.recovered?.action).toBe("rerun-same-entry");
  expect(Date.parse(recoveredRecord.recovered?.at), "恢复时间可读").not.toBeNaN();
});

const nonRoot = typeof process.getuid !== "function" || process.getuid() !== 0;

it.skipIf(!nonRoot)("ORACLE-PHASE-READINESS: 只有 error.code=EACCES 才归权限不可观测", () => {
  // A real spawn-time EACCES: an allowlisted binary shadowed by a mode-000 copy.
  const binDir = join(trackedRoot("p5-readiness-path-"), "bin");
  mkdirSync(binDir, { recursive: true });
  const shasum = join(binDir, "shasum");
  execFileSync("cp", ["/usr/bin/shasum", shasum]);
  chmodSync(shasum, 0o000);
  // The entry still needs git; PATH has only this controlled directory so the
  // chmod-000 shasum yields a spawn-time EACCES instead of a later hit.
  symlinkSync("/usr/bin/git", join(binDir, "git"));
  const denied = entryFixture({ probe: "shasum -a 256 README.md" });
  const deniedRun = denied.runEntry(cursorInput(), { PATH: binDir });
  expect.soft(deniedRun.exit, `${ORACLE}: EACCES 必须非零；实际 ${summarise(deniedRun)}`).not.toBe(0);
  expect.soft(deniedRun.stderr).toMatch(/permission-unobservable/i);
  expect.soft(denied.factsBytes().length, "EACCES 拒绝后不得写派发行").toBe(0);

  // Text-only "permission denied" without an errno code stays a failed probe.
  const unreadable = join(trackedRoot("p5-readiness-text-"), "no-read.txt");
  writeFileSync(unreadable, "controlled unreadable input\n");
  chmodSync(unreadable, 0o000);
  const textOnly = entryFixture({ probe: `shasum -a 256 ${unreadable}` });
  const textRun = textOnly.runEntry(cursorInput());
  expect.soft(textRun.exit, `${ORACLE}: 文本权限失败仍必须非零；实际 ${summarise(textRun)}`).not.toBe(0);
  expect.soft(textRun.stderr, "无 errno code 时不得冒权限结论").not.toMatch(/permission-unobservable/i);
  expect.soft(textRun.stderr).toMatch(/probe failed/i);

  const normal = entryFixture({ probe: 'git rev-parse --verify refs/heads/p5-readiness-absent' });
  const normalRun = normal.runEntry(cursorInput());
  expect.soft(normalRun.exit, `${ORACLE}: 普通失败必须非零；实际 ${summarise(normalRun)}`).not.toBe(0);
  expect.soft(normalRun.stderr).toMatch(/probe failed/i);
  expect.soft(normalRun.stderr).not.toMatch(/permission-unobservable/i);
});

it.skipIf(!nonRoot)("ORACLE-PHASE-READINESS: 读不到就绪原件目录按具名失败，不当作首次就绪", () => {
  const fixture = entryFixture({ probe: PASSING_PROBE });
  const testsDir = join(fixture.taskDir, "quality", "tests");
  mkdirSync(testsDir, { recursive: true });
  chmodSync(testsDir, 0o000);
  try {
    const run = fixture.runEntry(cursorInput());
    expect.soft(run.exit, `${ORACLE}: 读目录失败必须非零；实际 ${summarise(run)}`).not.toBe(0);
    // EACCES must be named with the directory; it is not "this is the first run".
    expect.soft(run.stderr).toMatch(/cannot read readiness originals/i);
    expect.soft(run.stderr).toMatch(/EACCES/);
    expect.soft(fixture.factsBytes().length, "读目录失败后不得写派发行").toBe(0);
  } finally { chmodSync(testsDir, 0o700); }
});

it("ORACLE-PHASE-READINESS: 重复入口不重跑探针、不新增原件、source 不重复", () => {
  const fixture = entryFixture({ probe: PASSING_PROBE });
  const first = fixture.runEntry(cursorInput());
  expect(first.exit, `${ORACLE}: 首次必须通过；实际 ${summarise(first)}`).toBe(0);
  const filesAfterFirst = readinessFiles(fixture);
  const second = fixture.runEntry(cursorInput());
  expect(second.exit, `${ORACLE}: 第二次必须复用通过原件；实际 ${summarise(second)}`).toBe(0);
  expect(readinessFiles(fixture), "重复调用不得新增就绪原件").toEqual(filesAfterFirst);
  const row = fixture.factsRows().find((entry) => entry?.stage === "build-code");
  expect(row.source.split("; readiness: ").length - 1, "source 只保留一条就绪引用").toBe(1);
});

// 真实门捕获把 receipt/output/gate 段写在同一条 build-code source 上；此后的
// 游标写入只能替换 readiness 段。切分整段重建会抹掉门指针，使 close 的声明读取
// 读不到 gate（quality/tests/2026-11-21-047-delivery-claims-recheck.json: gate=null）。
const buildCodeRow = (fixture) => fixture.factsRows().find((entry) => entry?.record_kind === "stage" && entry?.stage === "build-code");
const sourceSegments = (source) => String(source).split("; ");
const segmentsStartingWith = (source, prefix) => sourceSegments(source).filter((part) => part.startsWith(prefix));

it("ORACLE-PHASE-READINESS: 游标重建只替换 readiness 段，保留真实门捕获的 receipt/output/gate", () => {
  const fixture = entryFixture({ probe: PASSING_PROBE });
  expect(fixture.runEntry(cursorInput()).exit, "先由真实入口记录游标与就绪原件").toBe(0);
  // 门捕获走公开的 verify --action=execute（capture-tests），同一真实写入者。
  const captured = fixture.runVerify({ shell: GATE_COMMAND, slug: "p5-readiness-gate" });
  const capturedRow = buildCodeRow(fixture);
  const receiptSegment = segmentsStartingWith(capturedRow.source, "receipt: ");
  const outputSegment = segmentsStartingWith(capturedRow.source, "output: ");
  const gateSegment = segmentsStartingWith(capturedRow.source, "gate: ");
  // SETUP：真实捕获必须先在 source 上留下这三段，否则后面的保留断言无对象。
  expect.soft(gateSegment.length, `SETUP: 真实门捕获必须写入 gate 段；实际 source=${capturedRow?.source} stdout=${captured.stdout.slice(-400)} stderr=${captured.stderr.slice(-400)}`).toBe(1);
  expect.soft(receiptSegment.length, `SETUP: 真实门捕获必须写入 receipt 段；实际 source=${capturedRow?.source}`).toBe(1);
  expect.soft(outputSegment.length, `SETUP: 真实门捕获必须写入 output 段；实际 source=${capturedRow?.source}`).toBe(1);
  // 第二次游标写入（同一 Phase 复用就绪原件）不得擦掉捕获段。
  const resumed = fixture.runEntry(cursorInput());
  expect.soft(resumed.exit, `恢复写入必须通过；实际 ${summarise(resumed)}`).toBe(0);
  const row = buildCodeRow(fixture);
  expect.soft(segmentsStartingWith(row.source, "readiness: ").length, `readiness 段只保留一条；实际 ${row.source}`).toBe(1);
  expect.soft(segmentsStartingWith(row.source, "receipt: "), "receipt 段必须原样保留").toEqual(receiptSegment);
  expect.soft(segmentsStartingWith(row.source, "output: "), "output 段必须原样保留").toEqual(outputSegment);
  expect.soft(segmentsStartingWith(row.source, "gate: "), "gate 段必须原样保留").toEqual(gateSegment);
  expect.soft(row.source.startsWith("phase-progress-cursor; readiness: "), "游标身份仍按既有前缀可读").toBe(true);
  // 同一入口再写一次：任何事实段都不得重复。
  expect.soft(fixture.runEntry(cursorInput()).exit, "第三次写入必须通过").toBe(0);
  const again = buildCodeRow(fixture);
  for (const prefix of ["readiness: ", "receipt: ", "output: ", "gate: "]) {
    expect.soft(segmentsStartingWith(again.source, prefix).length, `${prefix}段多次写入后仍只有一条；实际 ${again.source}`).toBe(1);
  }
  expect.soft(again.source, "多次写入后 source 稳定").toBe(row.source);
});

it("ORACLE-PHASE-READINESS: 无门捕获的旧行不被凭空造出 gate/receipt/output 段", () => {
  const fixture = entryFixture({ probe: PASSING_PROBE });
  expect(fixture.runEntry(cursorInput()).exit, "首次写入游标").toBe(0);
  const legacySource = buildCodeRow(fixture).source;
  expect(fixture.runEntry(cursorInput()).exit, "再次写入游标").toBe(0);
  const source = buildCodeRow(fixture).source;
  expect.soft(segmentsStartingWith(source, "gate: "), "没有捕获就不得造出 gate 段").toEqual([]);
  expect.soft(segmentsStartingWith(source, "receipt: "), "没有捕获就不得造出 receipt 段").toEqual([]);
  expect.soft(segmentsStartingWith(source, "output: "), "没有捕获就不得造出 output 段").toEqual([]);
  expect.soft(segmentsStartingWith(source, "readiness: ").length, "只保留一条 readiness").toBe(1);
  // 既有形状（主身份 + 一条 readiness）保持不变。
  expect.soft(source, "无捕获时 source 形状不漂移").toBe(legacySource);
});

it("ORACLE-PHASE-READINESS: 材料侧只读回入口原件，双调用不新增回执或漂移", () => {
  const fixture = entryFixture({ probe: PASSING_PROBE });
  expect(fixture.runEntry(cursorInput()).exit, "先由入口记录通过原件").toBe(0);
  const first = runChecks(fixture);
  const filesAfterFirst = readinessFiles(fixture);
  const second = runChecks(fixture);
  expect.soft(first.status, `第一次材料侧读回：${first.stdout.slice(-500)} ${first.stderr.slice(-300)}`).toBe(0);
  expect.soft(second.status, `第二次材料侧读回：${second.stdout.slice(-500)} ${second.stderr.slice(-300)}`).toBe(0);
  expect.soft((second.stdout.match(/readiness phase=P1 status=pass/g) ?? []).length, "两次都读到同一通过原件").toBe(1);
  expect.soft(readinessFiles(fixture), "材料侧读回不得新增就绪原件").toEqual(filesAfterFirst);
});

it("ORACLE-PHASE-READINESS: 材料侧校验证据列形状，绝对路径具名失败", () => {
  // 五列表证据列是任务证据根相对的计划路径；入口只判非空，材料侧补形状校验。
  const fixture = entryFixture({ probe: PASSING_PROBE });
  const phasePath = join(fixture.materialRoot, PHASE_REF);
  writeFileSync(phasePath, readFileSync(phasePath, "utf8")
    .replace("quality/tests/p5-readiness.output", "/tmp/p5-absolute.output"));
  expect(fixture.runEntry(cursorInput()).exit, "入口不判证据列路径形状，仍应通过").toBe(0);
  const run = runChecks(fixture, "build-code");
  expect.soft(run.status, `证据列绝对路径必须非零：${run.stdout.slice(-600)} ${run.stderr.slice(-300)}`).not.toBe(0);
  expect.soft(run.stdout).toMatch(/证据列必须是任务证据根相对的 quality\/\.\.\. 路径/);
});

it("ORACLE-PHASE-READINESS: 证据列计划路径记 planned，真实原件存在时记 resolved", () => {
  const fixture = entryFixture({ probe: PASSING_PROBE });
  expect.soft(fixture.runEntry(cursorInput()).exit, "先由入口记录通过原件").toBe(0);
  const testsDir = join(fixture.taskDir, "quality", "tests");
  mkdirSync(testsDir, { recursive: true });
  writeFileSync(join(testsDir, "p5-readiness.output"), "declared original\n");
  const run = runChecks(fixture, "build-code");
  expect.soft(run.status, `证据列已生成时材料侧应通过：${run.stdout.slice(-600)} ${run.stderr.slice(-300)}`).toBe(0);
  expect.soft(run.stdout).toMatch(/evidence_status=resolved/);
});

it("ORACLE-PHASE-READINESS: 就绪表只由标题声明，代码围栏与正文提及不误触", () => {
  const fenced = ["# Phase P1", "```md", "### 开工就绪表", "| 命令 | 期望 | 证据 | 机器或人判 | 负责人 |", "```", ""].join("\n");
  const prose = "# Phase P1\n\n正文里提到 开工就绪表 但这里没有表。\n";
  expect(phaseReadinessRows(fenced).declared, "围栏里的示例不是就绪表").toBe(false);
  expect(phaseReadinessRows(prose).declared, "正文提及不是就绪表").toBe(false);
});

it("ORACLE-PHASE-READINESS: 材料侧按 stage 判无表，build-code 非零而 build-plan 允许", () => {
  const noTable = entryFixture({ probe: PASSING_PROBE, readiness: false });
  const buildPlan = runChecks(noTable, "build-plan");
  expect.soft(buildPlan.status, `build-plan 允许无表：${buildPlan.stdout.slice(-400)} ${buildPlan.stderr.slice(-200)}`).toBe(0);
  const buildCode = runChecks(noTable, "build-code");
  expect.soft(buildCode.status, `build-code 缺表必须非零：${buildCode.stdout.slice(-500)} ${buildCode.stderr.slice(-200)}`).not.toBe(0);
  expect.soft(buildCode.stdout).toMatch(/missing readiness table/i);
});

it("ORACLE-PHASE-READINESS: 缺原件时仅显式 build-code 失败，build-plan 和推断阶段只诊断", () => {
  const fixture = entryFixture({ probe: PASSING_PROBE });
  for (const stage of ["build-plan", "infer"]) {
    const run = runChecks(fixture, stage);
    expect.soft(run.status, `${stage}: ${run.stdout.slice(-600)} ${run.stderr.slice(-200)}`).toBe(0);
    expect.soft(run.stdout).toMatch(/readiness result missing: phase=P1.*diagnostic only/i);
  }
  const buildCode = runChecks(fixture, "build-code");
  expect.soft(buildCode.status).toBe(1);
  expect.soft(buildCode.stdout).toMatch(/readiness result missing: phase=P1/i);
  expect.soft(buildCode.stdout).not.toMatch(/readiness result missing: phase=P1.*diagnostic only/i);
  expect(readinessFiles(fixture)).toEqual([]);
});

it("ORACLE-PHASE-READINESS: 人判行在前时材料侧仍按机器探针对齐", () => {
  const fixture = entryFixture({ probe: PASSING_PROBE, humanFirst: true });
  const run = fixture.runEntry(cursorInput());
  expect(run.exit, `人判在前的入口必须通过：${summarise(run)}`).toBe(0);
  const record = JSON.parse(readFileSync(fixture.factsRows().find((row) => row?.stage === "build-code")
    .source.split("; readiness: ")[1], "utf8"));
  expect(record.probes.length, "原件只存机器探针").toBe(1);
  expect(record.human_rows.length, "人判行单独记录").toBe(1);
  expect(record.human_rows[0].status).toBe("unverified");
  const check = runChecks(fixture, "build-code");
  expect.soft(check.status, `人判在前时材料侧对齐：${check.stdout.slice(-600)} ${check.stderr.slice(-300)}`).toBe(0);
  expect.soft(check.stdout).toMatch(/readiness phase=P1 status=pass/);
  expect.soft(check.stdout).not.toMatch(/drift/i);
});

it("ORACLE-PHASE-READINESS: 省略 --stage 时按 build-code 只诊断，缺表不改变退出码", () => {
  const noTable = entryFixture({ probe: PASSING_PROBE, readiness: false });
  const inferred = runChecks(noTable, "infer");
  expect.soft(inferred.status, `省略 --stage 只诊断、不改退出码：${inferred.stdout.slice(-600)} ${inferred.stderr.slice(-200)}`).toBe(0);
  expect.soft(inferred.stdout).toMatch(/declared=false/);
  expect.soft(inferred.stdout).toMatch(/diagnostic only|allows no readiness table/i);
  // Only an explicit --stage=build-code enforces the missing table (case above).
  const explicit = runChecks(noTable, "build-code");
  expect.soft(explicit.status, "显式 --stage=build-code 缺表必须非零").not.toBe(0);
  expect.soft(explicit.stdout).toMatch(/missing readiness table/i);
  // Archive materials and arbitrary helper directories keep the old diagnostic
  // behavior; nothing is inferred into a dispatch gate.
});
