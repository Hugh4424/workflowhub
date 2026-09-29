// CARD-04 / P6 / T012 —— 真实入口全链 E2E（build-plan 期预置，2026-09-27 有界修订）。
//
// 目的：用真实子进程跑 tools/cli/stage-runtime.mjs，对五类行为取证：
//   一、阶段链真实运行        make-decision → build-plan → build-code
//   二、跨阶段事实传递        build-plan 是否真的消费 make-decision 的产物
//   三、缺料的精确错误        current task material missing or unreadable 一类机器可判定文本
//   四、阶段末报告事实层      P1-only 不得生成 P5 报告；真实 P5 来源另行验收
//   五、诚实性                语义核查/provider 不可用不得写成 deferred 或通过
//
// 纪律：
//   * 断言只读真实子进程的可观察输出：stdout/stderr 原文、exit code、落盘文件内容。
//   * 原 CLI 场景不 mock、不导入运行时内部模块；P5 消费补界另从真实 TaskHandle 调用内部只读认证函数。
//   * 夹具自带：mkdtemp 临时目录 + git init/worktree（不写仓库工作区、不依赖外部服务与网络）。
//   * 每个 it 先断言自己的先决条件（CLI 文件、oracle 镜像、夹具产物），缺失时是失败断言而不是未捕获异常。
//   * 本文件是诊断与验收资产，不接线为阶段推进门（不得作为 gate/stage 前置）。

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const RUNTIME_ENTRY = fileURLToPath(new URL("../../tools/cli/stage-runtime.mjs", import.meta.url));
const CLI_TIMEOUT_MS = 120000;
const HOOK_TIMEOUT_MS = 600000;

// 机器判定状态词：事实层只允许这些词描述「没做到」，不得用 deferred（延后）掩盖。
const MACHINE_JUDGMENT_STATUSES = Object.freeze(["missing", "inconsistent", "incomplete", "failed", "unavailable"]);
const UNAVAILABLE_WORDS = Object.freeze(["unavailable", "blocked"]);

// oracle（期望值）只读镜像：由另一任务创建，本测试只读不写。
// 默认位置与 tests/contract/oracle-mirror.test.mjs 的仓库外事实目录一致（任务执行事实目录下的只读镜像）。
const ORACLE_DIR = process.env.WH_CARD04_ORACLE_DIR
  ?? join(homedir(), "Hugh", "Knowledge", "Projects", "workflowhub", "tasks",
    "workflowhub-thin-core-card-04-20260919", "quality", "oracle", "card-04");
const ORACLE_JSON = join(ORACLE_DIR, "ORACLE.json");

const TASK_TYPE_LABEL = Object.freeze({ ordinary: "普通任务", planning: "规划任务" });

const materialText = (typeLabel) => `# 决策记录\n\n## 任务身份\n\n- **任务类型**：${typeLabel}\n`;
const SPEC_TEXT = "# Spec\n\n## Implementation Design（全局权威）\n\n- 目标：CARD-04 真实入口链 E2E 夹具。\n";
const PHASE_INDEX_TEXT = "## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n| `P1` | `phases/P1.md` |\n";
const PHASE_TEXT = "# Phase P1\n\n夹具阶段，仅用于满足当前材料存在性。\n";

const createdRoots = [];
let fixtureSeq = 0;

/**
 * 造夹具：临时 git 仓库 + 认证 worktree + 外置 task 目录（task.json）。
 * 与仓库既有 e2e/contract 测试同一手法，但只用 node:* 内置模块。
 */
function createFixture({ typeLabel = TASK_TYPE_LABEL.ordinary, spec = null, phaseIndex = null } = {}) {
  fixtureSeq += 1;
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-card04-e2e-")));
  createdRoots.push(root);
  const repo = join(root, "repo");
  const worktree = join(root, "worktree");
  const storageRoot = join(root, "store");
  const home = join(root, "home");
  const taskId = `card04-e2e-${fixtureSeq}-${process.pid}`;
  mkdirSync(repo, { recursive: true });
  mkdirSync(home, { recursive: true });
  const git = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  git(["init", "-q", "-b", "main"]);
  git(["config", "user.name", "workflowhub-e2e"]);
  git(["config", "user.email", "workflowhub-e2e@example.invalid"]);
  git(["commit", "-q", "--allow-empty", "-m", "baseline"]);
  git(["worktree", "add", "-q", "-b", `task/workflowhub/${taskId}`, worktree, "main"]);

  const taskPath = join(storageRoot, "Projects", "workflowhub", "tasks", taskId);
  mkdirSync(taskPath, { recursive: true });
  writeFileSync(join(taskPath, "task.json"), `${JSON.stringify({
    schema_version: "1.0.0",
    record_model: "vnext-single-write",
    project_name: "workflowhub",
    task_id: taskId,
    created_at: "2026-09-23T00:00:00.000Z",
    target_repo_root: repo,
    workspace_mode: "existing",
    workspace_root: worktree,
    activation_cohort: "post",
    activation_cohort_frozen_at: "2026-09-23T00:00:00.000Z",
    issue_ids: [],
    inputs: {},
  }, null, 2)}\n`);

  const materialRoot = join(worktree, "specs", taskId);
  mkdirSync(join(materialRoot, "phases"), { recursive: true });
  writeFileSync(join(materialRoot, "decision-log.md"), materialText(typeLabel));
  if (spec !== null) writeFileSync(join(materialRoot, "spec.md"), spec);
  if (phaseIndex !== null) {
    writeFileSync(join(materialRoot, "phases", "index.md"), phaseIndex);
    writeFileSync(join(materialRoot, "phases", "P1.md"), PHASE_TEXT);
  }

  const env = { ...process.env, HOME: home, XDG_CONFIG_HOME: join(home, ".config"), WORKFLOWHUB_TASK_DIR: storageRoot };
  return { root, repo, worktree, storageRoot, home, taskId, taskPath, materialRoot, env, typeLabel };
}

const identityArgs = (fixture) => [
  "--project=workflowhub",
  `--task=${fixture.taskId}`,
  `--task-path=${fixture.taskPath}`,
];

const clip = (text, limit = 6000) => {
  const value = String(text ?? "");
  return value.length <= limit ? value : `${value.slice(0, limit)}\n…[truncated ${value.length - limit} chars]`;
};

/** 真实子进程调用；永不抛异常，超时/杀进程也变成可断言的 capture。 */
function callCli(fixture, args, label) {
  const startedAt = Date.now();
  const result = spawnSync(process.execPath, [RUNTIME_ENTRY, ...args], {
    cwd: fixture.worktree,
    env: fixture.env,
    encoding: "utf8",
    timeout: CLI_TIMEOUT_MS,
    killSignal: "SIGKILL",
    maxBuffer: 64 * 1024 * 1024,
  });
  const capture = {
    label,
    args,
    command: `node tools/cli/stage-runtime.mjs ${args.join(" ")}`,
    cwd: fixture.worktree,
    exitCode: typeof result.status === "number" ? result.status : null,
    signal: result.signal ?? null,
    spawnError: result.error ? String(result.error.message ?? result.error) : null,
    durationMs: Date.now() - startedAt,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    json: null,
    jsonError: null,
  };
  try {
    capture.json = JSON.parse(capture.stdout);
  } catch (error) {
    capture.jsonError = String(error?.message ?? error);
  }
  return capture;
}

/** 失败消息里必须带子进程 stdout/stderr 原文。 */
function transcript(capture) {
  if (!capture) return "(no capture)";
  return [
    `# ${capture.label}`,
    `$ (cwd=${capture.cwd}) ${capture.command}`,
    `exit=${capture.exitCode} signal=${capture.signal} durationMs=${capture.durationMs}`
      + `${capture.spawnError ? ` spawnError=${capture.spawnError}` : ""}`
      + `${capture.jsonError ? ` jsonError=${capture.jsonError}` : ""}`,
    `--- stdout ---\n${clip(capture.stdout)}`,
    `--- stderr ---\n${clip(capture.stderr)}`,
  ].join("\n");
}

const withTranscript = (capture, detail) => `${detail}\n\n${transcript(capture)}`;

/** 读取落盘 JSON；不存在时返回 null（由调用方先断言存在性）。 */
function readJsonFile(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function listFiles(dirPath, { recursive = false, depth = 4 } = {}) {
  if (!existsSync(dirPath)) return [];
  const entries = [];
  for (const name of readdirSync(dirPath)) {
    const full = join(dirPath, name);
    let isDir = false;
    try {
      isDir = readdirSync(full) !== undefined;
    } catch {
      isDir = false;
    }
    entries.push(recursive && isDir ? `${name}/` : name);
    if (recursive && isDir && depth > 0) {
      for (const nested of listFiles(full, { recursive: true, depth: depth - 1 })) entries.push(`${name}/${nested}`);
    }
  }
  return entries;
}

function findFilesNamed(rootPath, matcher, depth = 5) {
  const hits = [];
  const walk = (dir, left) => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      let isDir = false;
      try {
        isDir = readdirSync(full) !== undefined;
      } catch {
        isDir = false;
      }
      if (isDir) {
        if (left > 0) walk(full, left - 1);
        continue;
      }
      if (matcher.test(name)) hits.push(full);
    }
  };
  walk(rootPath, depth);
  return hits;
}

const REPORT_FACTS_RELATIVE = "quality/evidence/stage-quality/build-code/P5/report-facts.json";

let chain;      // 全材料夹具：decision-log.md + spec.md + phases/index.md + phases/P1.md
let bare;       // 只有 decision-log.md：用于缺料精确错误
let planning;   // 只有 decision-log.md，任务类型=规划任务：用于跨阶段事实传递对照
const capture = {};
const preconditions = {};

beforeAll(() => {
  preconditions.cliExists = existsSync(RUNTIME_ENTRY);
  preconditions.oracleExists = existsSync(ORACLE_JSON);
  if (!preconditions.cliExists) return;

  chain = createFixture({ typeLabel: TASK_TYPE_LABEL.ordinary, spec: SPEC_TEXT, phaseIndex: PHASE_INDEX_TEXT });
  bare = createFixture({ typeLabel: TASK_TYPE_LABEL.ordinary });
  planning = createFixture({ typeLabel: TASK_TYPE_LABEL.planning });

  // 一、阶段链真实运行（真实 CLI 子进程，逐阶段驱动同一个夹具）
  capture.statusMakeDecision = callCli(chain, ["status", "--action=begin", "--stage=make-decision", ...identityArgs(chain)], "status --action=begin --stage=make-decision");
  capture.runMakeDecision = callCli(chain, ["run", "--action=execute", "--stage=make-decision", ...identityArgs(chain)], "run --action=execute --stage=make-decision");
  capture.statusBuildPlan = callCli(chain, ["status", "--action=begin", "--stage=build-plan", ...identityArgs(chain)], "status --action=begin --stage=build-plan");
  capture.runBuildPlan = callCli(chain, ["run", "--action=execute", "--stage=build-plan", ...identityArgs(chain)], "run --action=execute --stage=build-plan");
  capture.statusBuildCode = callCli(chain, ["status", "--action=begin", "--stage=build-code", ...identityArgs(chain)], "status --action=begin --stage=build-code");
  capture.runBuildCode = callCli(chain, ["run", "--action=execute", "--stage=build-code", ...identityArgs(chain)], "run --action=execute --stage=build-code");

  // 二、跨阶段事实传递：同一夹具、仅 decision-log.md 的受控标签不同
  capture.planningStatusBuildPlan = callCli(planning, ["status", "--action=begin", "--stage=build-plan", ...identityArgs(planning)], "规划任务 status --action=begin --stage=build-plan");
  capture.planningStatusBuildPrd = callCli(planning, ["status", "--action=begin", "--stage=build-prd", ...identityArgs(planning)], "规划任务 status --action=begin --stage=build-prd");
  capture.ordinaryStatusBuildPrd = callCli(chain, ["status", "--action=begin", "--stage=build-prd", ...identityArgs(chain)], "普通任务 status --action=begin --stage=build-prd");

  // 三、缺料的精确错误：材料缺失夹具
  capture.bareStatusBuildCode = callCli(bare, ["status", "--action=begin", "--stage=build-code", ...identityArgs(bare)], "缺料 status --action=begin --stage=build-code");
  capture.bareStatusVerifyCode = callCli(bare, ["status", "--action=begin", "--stage=verify-code", ...identityArgs(bare)], "缺料 status --action=begin --stage=verify-code");
  capture.bareRunBuildPlan = callCli(bare, ["run", "--action=execute", "--stage=build-plan", ...identityArgs(bare)], "缺料 run --action=execute --stage=build-plan");
}, HOOK_TIMEOUT_MS);

afterAll(() => {
  for (const root of createdRoots) {
    try {
      rmSync(root, { recursive: true, force: true });
    } catch {
      // 清理失败不影响事实采集
    }
  }
}, 120000);

describe("CARD-04 真实入口全链 E2E（真实 CLI 子进程）", () => {
  describe("P0 先决条件", () => {
    it("P0-a 真实 CLI 入口文件存在", () => {
      expect(preconditions.cliExists, `真实 CLI 入口缺失：${RUNTIME_ENTRY}`).toBe(true);
      expect(RUNTIME_ENTRY.endsWith("tools/cli/stage-runtime.mjs"), `入口路径不符合公开运行时形态：${RUNTIME_ENTRY}`).toBe(true);
    });

    it("P0-b card-04 oracle 镜像存在且可读（期望值来源）", () => {
      expect(
        preconditions.oracleExists,
        `oracle mirror missing at ${ORACLE_JSON}（目录存在=${existsSync(ORACLE_DIR)}；目录内容=${JSON.stringify(listFiles(ORACLE_DIR))}）`,
      ).toBe(true);
      const rawOracle = existsSync(ORACLE_JSON) ? readFileSync(ORACLE_JSON, "utf8") : "";
      const oracle = readJsonFile(ORACLE_JSON);
      expect(oracle, `oracle 镜像不可解析：${ORACLE_JSON}\n${clip(rawOracle, 800)}`).not.toBeNull();
      expect(typeof oracle, `oracle 顶层应为对象：${ORACLE_JSON}`).toBe("object");
      expect(
        typeof oracle.schema_version === "string" && oracle.schema_version.length > 0,
        `oracle 必须自报 schema_version：${clip(rawOracle, 800)}`,
      ).toBe(true);
    });
  });

  describe("一、阶段链真实运行", () => {
    it("链-1 make-decision 状态：可推进、无缺料、拓扑首段是自身", () => {
      const c = capture.statusMakeDecision;
      expect(c, "make-decision status 未采集").toBeTruthy();
      expect(c.exitCode, withTranscript(c, "make-decision status 应成功退出")).toBe(0);
      expect(c.json, withTranscript(c, "make-decision status 应输出 JSON")).not.toBeNull();
      expect(c.json.stage, withTranscript(c, "阶段名")).toBe("make-decision");
      expect(c.json.work_status, withTranscript(c, "work_status 应为真实输出里的可推进值")).toBe("ready");
      expect(c.json.missing_materials, withTranscript(c, "make-decision 不应有缺料")).toEqual([]);
      // 首段没有上游材料：required_materials 为空即真实形态（decision-log.md 由本段产出）
      expect(Array.isArray(c.json.required_materials), withTranscript(c, "required_materials 应为数组")).toBe(true);
      expect(c.json.required_materials, withTranscript(c, "首段不应把上游材料列为必需")).toEqual([]);
      expect(["in_progress", "incomplete"], withTranscript(c, "quality_status")).toContain(c.json.quality_status);
      expect(c.json.continuation_allowed, withTranscript(c, "continuation_allowed")).toBe(true);
      expect(c.json.work_authority, withTranscript(c, "work_authority 应存在")).toBeTruthy();
      expect(c.json.readiness_source, withTranscript(c, "readiness_source 取自当前材料存在性")).toBe("current-material-presence");
      // 首段是任务类型声明段：实测不声明下游拓扑投影（拓扑面从 build-plan 起，见链-3）。
      // 不断言「键不存在」（无卡认领该负向契约），只在链-3 正向断言 build-plan 的拓扑投影。
    });

    it("链-2 make-decision 真实执行：返回 vnext 结果 JSON，且不把缺事实写成通过", () => {
      const c = capture.runMakeDecision;
      expect(c, "make-decision run 未采集").toBeTruthy();
      expect(c.exitCode, withTranscript(c, "make-decision run 应成功退出")).toBe(0);
      expect(c.json, withTranscript(c, "make-decision run 应输出结果 JSON")).not.toBeNull();
      expect(c.json.schema_version, withTranscript(c, "结果 schema")).toBe("stage-runtime-result.vnext");
      expect(c.json.stage, withTranscript(c, "结果阶段")).toBe("make-decision");
      expect(c.json.work_status, withTranscript(c, "结果 work_status")).toBe("ready");
      expect(c.json.completion?.status, withTranscript(c, "阶段完成状态未完成")).toBe("in_progress");
      const predicateStatuses = Object.values(c.json.completion?.predicates ?? {}).map((entry) => entry?.status);
      expect(predicateStatuses.length, withTranscript(c, "completion.predicates 应逐条列出")).toBeGreaterThan(0);
      expect(predicateStatuses, withTranscript(c, "没有事实时不得出现 passed")).not.toContain("passed");
      expect(MACHINE_JUDGMENT_STATUSES.concat(["not_applicable"]), withTranscript(c, "谓词状态词应为机器判定类"))
        .toEqual(expect.arrayContaining(predicateStatuses));
    });

    it("链-3 build-plan 状态：推进关系与材料清单来自当前阶段权威", () => {
      const c = capture.statusBuildPlan;
      expect(c, "build-plan status 未采集").toBeTruthy();
      expect(c.exitCode, withTranscript(c, "build-plan status 应成功退出")).toBe(0);
      expect(c.json, withTranscript(c, "build-plan status 应输出 JSON")).not.toBeNull();
      expect(c.json.stage, withTranscript(c, "阶段名")).toBe("build-plan");
      expect(c.json.work_status, withTranscript(c, "work_status")).toBe("ready");
      expect(c.json.topology, withTranscript(c, "post 普通任务拓扑")).toEqual(["make-decision", "build-plan", "build-code", "verify-code"]);
      expect(c.json.required_materials, withTranscript(c, "build-plan 必需材料")).toContain("decision-log.md");
      expect(c.json.missing_materials, withTranscript(c, "build-plan 不应缺料")).toEqual([]);
      expect(c.json.work_authority, withTranscript(c, "工作权威来源")).toBeTruthy();
      expect(typeof c.json.quality_status, withTranscript(c, "quality_status 应存在")).toBe("string");
    });

    it("链-4 build-code 阶段：状态面逐条列出缺失质量事实，真实执行同时落盘证据", () => {
      const status = capture.statusBuildCode;
      expect(status, "build-code status 未采集").toBeTruthy();
      expect(status.exitCode, withTranscript(status, "build-code status 应成功退出")).toBe(0);
      expect(status.json, withTranscript(status, "build-code status 应输出 JSON")).not.toBeNull();
      expect(status.json.stage, withTranscript(status, "状态面阶段名")).toBe("build-code");
      expect(Array.isArray(status.json.quality_missing), withTranscript(status, "quality_missing 应为数组")).toBe(true);
      expect(status.json.quality_missing.length, withTranscript(status, "本夹具 build-code 尚缺质量事实")).toBeGreaterThan(0);
      const predicateStatuses = Object.values(status.json.quality_predicates ?? {}).map((entry) => entry?.status);
      expect(MACHINE_JUDGMENT_STATUSES, withTranscript(status, "缺失质量事实的状态词应为机器判定类"))
        .toEqual(expect.arrayContaining(predicateStatuses));

      const c = capture.runBuildCode;
      expect(c, "build-code run 未采集").toBeTruthy();
      expect(c.exitCode, withTranscript(c, "build-code run 应成功退出")).toBe(0);
      expect(c.json, withTranscript(c, "build-code run 应输出结果 JSON")).not.toBeNull();
      expect(c.json.schema_version, withTranscript(c, "结果 schema")).toBe("stage-runtime-result.vnext");
      expect(c.json.stage, withTranscript(c, "结果阶段")).toBe("build-code");
      expect(c.json.work_status, withTranscript(c, "结果 work_status")).toBe("ready");
      expect(c.json.completion?.missing?.length, withTranscript(c, "结果必须逐条列出未完成谓词")).toBeGreaterThan(0);
      expect(Object.values(c.json.completion?.predicates ?? {}).map((entry) => entry?.status),
        withTranscript(c, "没有事实时不得出现 passed")).not.toContain("passed");
      const evidenceFiles = listFiles(join(chain.taskPath, "quality", "evidence", "stage-quality", "build-code"));
      expect(evidenceFiles.length, withTranscript(c, `build-code 阶段质量证据应落盘；实际目录内容=${JSON.stringify(evidenceFiles)}`))
        .toBeGreaterThan(0);
    });
  });

  describe("二、跨阶段事实传递（build-plan 是否真的用 make-decision 的产物）", () => {
    it("跨阶段-1 同一夹具仅改 decision-log.md 受控标签，下游阶段路由随之改变", () => {
      const ordinary = capture.statusBuildPlan;
      const planningPlan = capture.planningStatusBuildPlan;
      const planningPrd = capture.planningStatusBuildPrd;
      expect(ordinary, "普通任务 build-plan 未采集").toBeTruthy();
      expect(planningPlan, "规划任务 build-plan 未采集").toBeTruthy();
      expect(planningPrd, "规划任务 build-prd 未采集").toBeTruthy();

      // 普通任务：build-plan 在拓扑内
      expect(ordinary.exitCode, withTranscript(ordinary, "普通任务 build-plan 应在拓扑内")).toBe(0);
      expect(ordinary.json?.task_type, withTranscript(ordinary, "task_type 直接读自 decision-log.md")).toBe(TASK_TYPE_LABEL.ordinary);
      // 规划任务：同一命令形态在 build-plan 上被拓扑拒绝
      expect(planningPlan.exitCode, withTranscript(planningPlan, "规划任务 build-plan 应在拓扑之外")).toBe(1);
      expect(planningPlan.stderr, withTranscript(planningPlan, "拒绝理由必须点明产出的任务类型与期望拓扑"))
        .toMatch(/任务类型\s*规划任务/);
      expect(planningPlan.stderr, withTranscript(planningPlan, "拒绝理由必须给出期望拓扑"))
        .toMatch(/build-prd/);
      // 规划任务的合法段位是可推进的
      expect(planningPrd.exitCode, withTranscript(planningPrd, "规划任务 build-prd 应被接受")).toBe(0);
    });

    it("跨阶段-2 build-plan 状态读回 decision-log.md 的产物引用与标签", () => {
      const c = capture.statusBuildPlan;
      expect(c, "build-plan status 未采集").toBeTruthy();
      expect(c.json, withTranscript(c, "build-plan status 应输出 JSON")).not.toBeNull();
      const decisionLogText = readFileSync(join(chain.materialRoot, "decision-log.md"), "utf8");
      const declaredLabel = /任务类型\*\*[：:]\s*(.+)/.exec(decisionLogText)?.[1]?.trim();
      expect(declaredLabel, `夹具 decision-log.md 应声明受控标签：${clip(decisionLogText, 300)}`).toBe(TASK_TYPE_LABEL.ordinary);
      expect(c.json.task_type, withTranscript(c, "真实输出里的 task_type 必须等于上游产物里声明的标签")).toBe(declaredLabel);
      const namedK3 = (c.json.named_refs ?? []).find((entry) => entry?.class === "K3");
      expect(namedK3, withTranscript(c, "named_refs 应含 K3 当前材料")).toBeTruthy();
      expect(namedK3.refs, withTranscript(c, "K3 必须点名 decision-log.md")).toContain("decision-log.md");
      expect(c.json.required_materials, withTranscript(c, "必需材料必须点名 decision-log.md")).toContain("decision-log.md");
    });

    it("跨阶段-3 普通任务与规划任务的拓扑互斥（反向对照）", () => {
      const c = capture.ordinaryStatusBuildPrd;
      expect(c, "普通任务 build-prd 未采集").toBeTruthy();
      expect(c.exitCode, withTranscript(c, "普通任务 build-prd 应在拓扑之外")).toBe(1);
      expect(c.stderr, withTranscript(c, "拒绝理由必须点明普通任务与期望拓扑")).toMatch(/任务类型\s*普通任务/);
      expect(c.stderr, withTranscript(c, "期望拓扑必须给出 build-plan")).toMatch(/build-plan/);
    });
  });

  describe("三、缺料的精确错误", () => {
    it("缺料-1 build-code 状态在材料缺失时报精确错误文本", () => {
      const c = capture.bareStatusBuildCode;
      expect(c, "缺料 build-code status 未采集").toBeTruthy();
      expect(c.exitCode, withTranscript(c, "缺料时必须失败退出")).toBe(1);
      expect(c.stderr, withTranscript(c, "必须给出精确的缺料错误文本")).toMatch(/current task material missing or unreadable/);
      expect(c.stderr, withTranscript(c, "必须点名缺失材料 spec.md")).toMatch(/spec\.md/);
      expect(c.stderr, withTranscript(c, "必须点名缺失材料 phases/index.md")).toMatch(/phases\/index\.md/);
      const firstLine = String(c.stderr).split("\n")[0];
      expect(firstLine, withTranscript(c, "精确错误文本必须出现在 stderr 首行（机器可判定，而不是埋在栈里）"))
        .toMatch(/^Error: current task material missing or unreadable:/);
      expect(c.json === null || c.json?.work_status !== "ready", withTranscript(c, "缺料不得返回 ready")).toBe(true);
    });

    it("缺料-2 verify-code 状态同样报精确错误文本（不静默通过）", () => {
      const c = capture.bareStatusVerifyCode;
      expect(c, "缺料 verify-code status 未采集").toBeTruthy();
      expect(c.exitCode, withTranscript(c, "缺料时必须失败退出")).toBe(1);
      expect(c.stderr, withTranscript(c, "必须给出精确的缺料错误文本")).toMatch(/current task material missing or unreadable/);
      expect(c.json === null || c.json?.work_status !== "ready", withTranscript(c, "缺料不得返回 ready"))
        .toBe(true);
    });

    // 已观测但「无卡认领」的行为，不写成断言（写断言就是永远红的假材料）：
    // post 夹具缺 phases/index.md 时 `run --action=execute --stage=build-plan` 抛未处理的 ENOENT
    // （读取 phases/index.md；core/artifact-dir.mjs:221 ← runtime/stage/stage-handlers.mjs）。
    // 卡面归属：P3/T005 的 Coverage limit 明确写「只覆盖 status 命令路径的收窄守卫；
    // run/preflight 路径的材料守卫在 runtime/stage/stage-context.mjs，不在本卡范围」，
    // P1..P6 其余任务亦未认领「把该路径收敛成协议错误」→ 只保留原始观测，不设断言。
    it("缺料-3（观测，不断言）缺料夹具上 build-plan 真实执行的原始形态", () => {
      const c = capture.bareRunBuildPlan;
      expect(c, "缺料 build-plan run 未采集").toBeTruthy();
      // 只断言「子进程真实跑过并留下可读输出」，不断言其错误形态归属
      expect(typeof c.stderr, "子进程应留下 stderr 原文").toBe("string");
      console.log(
        `[观测/非断言] run --action=execute --stage=build-plan（缺 phases/index.md）：exit=${c.exitCode}`
        + ` stderr 首行=${JSON.stringify(String(c.stderr).split("\n")[0])}`,
      );
    });
  });

  describe("四、阶段末报告事实层", () => {
    it("报告事实-1 P1-only 夹具不得在 P5 约定路径生成报告", () => {
      const c = capture.runBuildCode;
      expect(c, "build-code run 未采集").toBeTruthy();
      expect(c.exitCode, withTranscript(c, "P1-only 负控依赖 build-code 真实执行成功")).toBe(0);
      const reportFactsPath = join(chain.taskPath, REPORT_FACTS_RELATIVE);
      const anyNamed = findFilesNamed(chain.taskPath, /^report-facts\.json$/);
      expect(
        existsSync(reportFactsPath),
        `P1-only 夹具不得生成 P5 报告：${reportFactsPath}\n`
          + `实际找到的 report-facts.json：${JSON.stringify(anyNamed)}\n`
          + `stage-quality/build-code 目录内容：${JSON.stringify(listFiles(join(chain.taskPath, "quality", "evidence", "stage-quality", "build-code")))}\n`
          + `quality/evidence 目录内容：${JSON.stringify(listFiles(join(chain.taskPath, "quality", "evidence")))}\n\n`
          + transcript(c),
      ).toBe(false);
      expect(anyNamed, `P1-only 夹具不得在其它路径生成 report-facts.json：${JSON.stringify(anyNamed)}\n\n${transcript(c)}`)
        .toEqual([]);
    });

    it("报告事实-2 P1-only 没有 P5 报告，但运行结果仍逐条披露缺口", () => {
      const c = capture.runBuildCode;
      expect(c, "build-code run 未采集").toBeTruthy();
      expect(c.exitCode, withTranscript(c, "P1-only 负控依赖 build-code 真实执行成功")).toBe(0);
      const reportFactsPath = join(chain.taskPath, REPORT_FACTS_RELATIVE);
      expect(existsSync(reportFactsPath), `P1-only 夹具不得生成 P5 报告：${reportFactsPath}`).toBe(false);
      expect(c.json, withTranscript(c, "build-code run 应输出结果 JSON")).not.toBeNull();
      const missingItems = c.json.missing_items;
      expect(Array.isArray(missingItems), withTranscript(c, "缺口必须留在真实运行结果里")).toBe(true);
      expect(missingItems.length, withTranscript(c, "本夹具存在未做到项，不能因无 P5 报告而抹掉缺口")).toBeGreaterThan(0);
      for (const [index, item] of missingItems.entries()) {
        expect(typeof item, withTranscript(c, `missing_items[${index}] 必须是文本`)).toBe("string");
        expect(item.trim().length, withTranscript(c, `missing_items[${index}] 不得为空`)).toBeGreaterThan(0);
      }
    });

    it("报告事实-3 真实同次夹具缺独立真人声明时不得有认证报告", async () => {
      const exchangeRoot = realpathSync(mkdtempSync(join(tmpdir(), "workflowhub-p6-p5-reader-")));
      createdRoots.push(exchangeRoot);
      const handoffPath = join(exchangeRoot, "p5-task-path.txt");
      const targetTest = "tests/contract/p5-same-run-report-source.test.mjs";
      const nested = spawnSync("npx", ["vitest", "run", targetTest, "-t", "keeps complete same-run fixture inputs unreported"], {
        cwd: fileURLToPath(new URL("../../", import.meta.url)),
        env: { ...process.env, WORKFLOWHUB_P5_RETAINED_STATE_PATH: handoffPath },
        encoding: "utf8", timeout: 120000, maxBuffer: 8 * 1024 * 1024,
      });
      expect(nested.status, `真实 P5 夹具运行失败：${nested.stdout}\n${nested.stderr}`).toBe(0);
      expect(existsSync(handoffPath), "P5 夹具必须交出尚未清理的真实 Task 路径").toBe(true);
      const taskPath = readFileSync(handoffPath, "utf8").trim();
      const taskRoot = realpathSync(join(taskPath, "../../../.."));
      expect(taskRoot.startsWith(`${realpathSync(tmpdir())}${sep}`) && basename(taskRoot).startsWith("workflowhub-p5-source-"),
        "只允许清理这次真实 P5 临时夹具").toBe(true);
      try {
        const { openTask } = await import("../../runtime/task/task-handle.mjs");
        const { authenticateP5StageEndReport } = await import("../../runtime/evidence/freshness.mjs");
        const task = openTask(taskPath, { projectName: "workflowhub", taskId: "p5-source-fixture" });
        expect(existsSync(join(taskPath, "quality/evidence/stage-quality/build-code/P5/report-facts.json"))).toBe(false);
        expect(authenticateP5StageEndReport(task)).toMatchObject({ status: "missing", authenticated: false });
        expect(authenticateP5StageEndReport(null)).toMatchObject({ status: "unavailable", authenticated: false });
      } finally {
        rmSync(taskRoot, { recursive: true, force: true });
      }
    }, 180000);
  });

  describe("五、诚实性：不得把不可用写成通过", () => {
    it("诚实性-1 语义核查事实：分析器的机器判决必须可见（不是被通用 missing 抹平）", () => {
      const acceptanceRoot = join(chain.taskPath, "quality", "evidence", "acceptance");
      const files = findFilesNamed(acceptanceRoot, /^stage_end_spec_analyze-.*\.json$/);
      expect(
        files.length,
        `阶段验收投影应包含 stage_end_spec_analyze 事实；acceptance 目录内容=${JSON.stringify(listFiles(acceptanceRoot, { recursive: true }))}`,
      ).toBeGreaterThan(0);
      // 注：当前验收结果允许 incomplete；分析器的 material_incomplete 必须映射到它。
      // 原始机器判决仍须在实际结果与事实槽位中逐字保留。
      let observedAnalyzerVerdicts = 0;
      let observedBuildCodeFacts = 0;
      for (const file of files) {
        const acceptanceParts = relative(acceptanceRoot, file).split(sep);
        expect(acceptanceParts, `验收事实必须位于单个阶段目录：${file}`).toHaveLength(2);
        const acceptanceStage = acceptanceParts[0];
        const acceptance = readJsonFile(file);
        expect(acceptance, `验收投影不可解析：${file}`).not.toBeNull();
        const ref = acceptance.refs?.[0]?.ref ?? null;
        expect(ref, `验收投影必须指向 stage-quality 事实：${file}`).not.toBeNull();
        const refParts = ref.split("/");
        expect(refParts.slice(0, 4), `事实引用必须指向同一阶段：${file}`).toEqual(["quality", "evidence", "stage-quality", acceptanceStage]);
        expect(refParts, `事实引用必须是单个 JSON 文件：${file}`).toHaveLength(5);
        expect(refParts[4], `事实引用必须是 JSON 文件：${file}`).toMatch(/\.json$/);
        const stageQualityPath = join(chain.taskPath, ref);
        expect(existsSync(stageQualityPath), `stage-quality 事实必须存在：${ref}`).toBe(true);
        const stageQualityRaw = readFileSync(stageQualityPath);
        expect(createHash("sha256").update(stageQualityRaw).digest("hex"), `事实引用的哈希必须匹配原始字节：${file}`)
          .toBe(acceptance.refs[0].sha256);
        const stageQuality = readJsonFile(stageQualityPath);
        expect(stageQuality, `stage-quality 事实不可解析：${ref}`).not.toBeNull();
        expect(stageQuality.stage, `事实内阶段必须匹配验收目录：${file}`).toBe(acceptanceStage);
        expect(stageQuality.task_id, `事实必须属于当前任务：${file}`).toBe(chain.taskId);
        const analyzerResult = stageQuality.subject_fact?.analysis_result;
        const analyzerStatus = analyzerResult?.status;
        if (stageQuality.stage === "build-code") {
          observedBuildCodeFacts += 1;
          expect(analyzerStatus, `build-code 的语义核查必须有真实分析器判断：${file}`).toBeTruthy();
        }
        const detail = `语义核查事实的机器判决必须可见：${file}\n`
          + `acceptance.result=${JSON.stringify(acceptance.result)} summary.actual_outcome=${JSON.stringify(acceptance.summary?.actual_outcome)}\n`
          + `stageQuality.status=${JSON.stringify(stageQuality.status)} subject_fact.status=${JSON.stringify(stageQuality.subject_fact?.status)}`
          + ` subject_fact.detail=${JSON.stringify(stageQuality.subject_fact?.detail)}\n`
          + `分析器判决 analysis_result.status=${JSON.stringify(analyzerStatus)}\n`
          + `subject_fact.evidence_state=${JSON.stringify(stageQuality.subject_fact?.evidence_state)}`;
        if (analyzerResult == null) {
          expect(stageQuality.status, `${detail}\n\n无分析器结果时事实必须标为 missing`).toBe("missing");
          expect(stageQuality.subject_fact?.status, `${detail}\n\n无分析器结果时主题事实必须标为 missing`).toBe("missing");
          expect(acceptance.summary?.actual_outcome, `${detail}\n\n无分析器结果时实际结果必须标为 missing`).toBe("missing");
          expect(stageQuality.subject_fact?.evidence_state ?? null, `${detail}\n\n无分析器结果时不得伪造原始机器判决`).toBeNull();
          expect(acceptance.result, `${detail}\n\n无分析器结果时验收只能延期，不得通过`).toBe("deferred");
          continue;
        }
        observedAnalyzerVerdicts += 1;
        expect(analyzerStatus, `${detail}\n\n已有分析器结果必须给出机器判决`).toBeTruthy();
        expect(["material_incomplete", "inconsistent", "unavailable"], `${detail}\n\n本样例的分析器判断必须是非通过状态`).toContain(analyzerStatus);
        // ① 验收投影的实际结果必须等于分析器判决（今天被抹成与 status 同值的通用 "missing"）
        expect(acceptance.summary?.actual_outcome, `${detail}\n\nactual_outcome 必须等于分析器判决，而不是通用 missing`).toBe(analyzerStatus);
        // ② stage-quality 事实必须暴露同类机器判决槽位（今天不存在）
        expect(stageQuality.subject_fact?.evidence_state, `${detail}\n\nstage-quality 事实必须暴露 evidence_state`).toBe(analyzerStatus);
        // ③ 验收结果必须合法，且材料不完整不能被写成通过或延后。
        expect(["pass", "fail", "inconclusive", "deferred", "missing", "inconsistent", "incomplete", "unavailable"], `${detail}\n\n验收结果必须是当前合法值`)
          .toContain(acceptance.result);
        const expectedResult = {
          material_incomplete: "incomplete",
          inconsistent: "inconsistent",
          unavailable: "unavailable",
        }[analyzerStatus];
        expect(acceptance.result, `${detail}\n\n分析器的非通过判断必须准确映射到验收结果`).toBe(expectedResult);
      }
      expect(observedAnalyzerVerdicts, "样例中必须至少有一条真实分析器判断").toBeGreaterThan(0);
      expect(observedBuildCodeFacts, "样例中必须至少有一条 build-code 语义核查事实").toBeGreaterThan(0);
    });

    it("诚实性-2 provider/语义核查不可用时必须以 unavailable 或 blocked 形态出现", () => {
      const c = capture.runBuildCode;
      expect(c, "build-code run 未采集").toBeTruthy();
      expect(c.json, withTranscript(c, "build-code run 应输出结果 JSON")).not.toBeNull();
      const advisories = c.json.quality_advisories ?? [];
      expect(Array.isArray(advisories), withTranscript(c, "quality_advisories 应为数组")).toBe(true);
      const analyzeAdvisories = advisories.filter((entry) => String(entry).startsWith("stage-end-spec-analyze:"));
      expect(analyzeAdvisories.length, withTranscript(c, "语义核查必须出现在 advisories 里（可见而非隐藏）")).toBeGreaterThan(0);
      for (const entry of analyzeAdvisories) {
        const status = String(entry).split(":").slice(1).join(":");
        expect(UNAVAILABLE_WORDS.concat(MACHINE_JUDGMENT_STATUSES, ["material_incomplete"]),
          withTranscript(c, `语义核查状态必须诚实表达不可用：${entry}`)).toContain(status);
      }
      expect(UNAVAILABLE_WORDS, withTranscript(c, "阶段反思不可用时必须是 unavailable/blocked"))
        .toContain(c.json.stage_reflection?.status);
      const reflectionStatus = c.json.stage_handoff?.reflection_status;
      if (reflectionStatus !== undefined && reflectionStatus !== null) {
        expect(UNAVAILABLE_WORDS, withTranscript(c, "handoff 反思状态不可用时必须是 unavailable/blocked"))
          .toContain(reflectionStatus);
      }
      expect(JSON.stringify(c.json.quality_advisories ?? []), withTranscript(c, "advisories 不得把不可用写成 passed"))
        .not.toMatch(/passed|consistent/);
    });

    it("诚实性-3 真实执行结果逐条列出「没做到」的项", () => {
      const c = capture.runBuildCode;
      expect(c, "build-code run 未采集").toBeTruthy();
      expect(c.json, withTranscript(c, "build-code run 应输出结果 JSON")).not.toBeNull();
      const missingItems = c.json.missing_items;
      expect(Array.isArray(missingItems), withTranscript(c, "missing_items 必须是逐条清单")).toBe(true);
      expect(missingItems.length, withTranscript(c, "本夹具存在未做到项，missing_items 不得为空")).toBeGreaterThan(0);
      for (const item of missingItems) {
        expect(typeof item, withTranscript(c, `missing_items 每一项都必须是可读文本：${JSON.stringify(item)}`)).toBe("string");
        expect(String(item).trim().length, withTranscript(c, `missing_items 每一项都不得为空：${JSON.stringify(item)}`)).toBeGreaterThan(0);
      }
    });
  });
});
