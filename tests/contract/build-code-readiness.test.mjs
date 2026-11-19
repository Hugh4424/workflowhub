// P5 预写测试：派发前拦截客观开工错误。
// 合同：runtime/stage/stage-content-contracts.mjs 的 validatePostPhaseContract。
// 入口：tools/cli/stage-runtime.mjs 的 run --action=execute 首步（P5 要求在此加一次就绪调用）。
// RED 目标失败：ORACLE-PHASE-READINESS。合法表配失败/缺失探针时，当前入口
// 仍返回 0 并写入派发行；本文件不 mock 入口，让真实失败暴露。
// 隔离：全部数据建在 createTrackedTempDir 的临时目录，不写产品库、不连真实任务。
import { afterEach, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createTrackedTempDir } from "../../runtime/interface/temp-dir.mjs";
import { validatePostPhaseContract } from "../../runtime/stage/stage-content-contracts.mjs";

const ORACLE = "ORACLE-PHASE-READINESS";
const PHASE_REF = "phases/P1-readiness.md";
const CLI = fileURLToPath(new URL("../../tools/cli/stage-runtime.mjs", import.meta.url));
const GATE_COMMAND = "node --test tests/owned.test.mjs";
// 五列＝命令、期望、证据、机器或人判、负责人（P5 开工就绪表）。
const PASSING_PROBE = 'node -e "process.exit(0)"';
const FAILING_PROBE = 'node -e "process.exit(3)"';

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

function readinessTable(probe) {
  const rows = probe === null ? [] : [`| \`${probe}\` | 0 | quality/tests/p5-readiness.output | 机器 | 计划负责人 |`];
  return ["### 开工就绪表", "| 命令 | 期望 | 证据 | 机器或人判 | 负责人 |", "| --- | --- | --- | --- | --- |", ...rows, ""].join("\n");
}

// 合法 spec/index/phases；probe=null 表示缺探针，其他字符串为真实命令。
function materials({ probe = PASSING_PROBE, ref = PHASE_REF } = {}) {
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
    readinessTable(probe),
    `- **gate_cmd**：\`${GATE_COMMAND}\``,
    "- **expected_exit**：RED nonzero; GREEN 0",
    `- **oracle**：${ORACLE}`,
    "- **evidence_path**：quality/tests/p5-readiness.output",
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
function entryFixture({ probe, taskId = "p5-readiness-owned" } = {}) {
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
  const docs = materials({ probe });
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
  const runEntry = (input) => {
    const inputPath = join(root, `entry-input-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
    writeFileSync(inputPath, JSON.stringify(input));
    const argv = [CLI, "run", "--action=execute", "--stage=build-code", "--project=workflowhub",
      `--task=${taskId}`, `--task-path=${taskDir}`, `--input=${inputPath}`];
    const result = spawnSync(process.execPath, argv, { cwd: worktree, env, encoding: "utf8", timeout: 30_000 });
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
  return {
    root, repo, worktree, storage, home, taskId, taskDir, materialRoot, runEntry,
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
