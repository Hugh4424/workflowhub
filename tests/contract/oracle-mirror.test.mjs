import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// CARD-04 / P6 / T011 — 仓库外只读 oracle 镜像契约（预置测试，build-plan 期冻结）。
//
// 镜像位于仓库外的事实目录，属于实现者写集之外，由 build-code 阶段的 T011 创建；
// 本文件只读该镜像，绝不创建、不修复、不把镜像内容复制进仓库。
// 「只读」的物理表达：镜像目录 mode 0555、ORACLE.json / README.md mode 0444。
// RED 依据：镜像此刻并不存在（它不是本卡的既存资产），因此所有镜像断言都必须是
// 「前置存在断言」失败（1 failed + expect 差异），而不是读取异常崩溃或模块加载错误。

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const DEFAULT_ORACLE_DIR = path.join(
  os.homedir(),
  "Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919/quality/oracle/card-04",
);

const ORACLE_JSON_NAME = "ORACLE.json";
const README_NAME = "README.md";

const STAGES = ["make-decision", "build-plan", "build-code", "verify-code"];
const MACHINE_NOT_DONE_STATES = ["missing", "inconsistent", "incomplete", "failed", "unavailable"];
const FORBIDDEN_STATES = ["deferred"];
const REPORT_FACTS_REQUIRED_SECTIONS = ["没做到"];
const MISSING_MATERIAL_ERROR_PATTERN = "current task material missing or unreadable";
const SPEC_ANALYZE_SUBJECT = "stage_end_spec_analyze";
const SCHEMA = "card-04-oracle-mirror.v1";

// 镜像目录解析（纯函数）：WH_CARD04_ORACLE_DIR 覆盖优先，默认仓库外事实目录。
function oracleDir() {
  return process.env.WH_CARD04_ORACLE_DIR ?? DEFAULT_ORACLE_DIR;
}

// 在临时 env 覆盖下取值，并在断言前后恢复原值（用例之间不泄漏 env）。
function withOracleDirEnv(value, run) {
  const before = process.env.WH_CARD04_ORACLE_DIR;
  if (value === undefined) delete process.env.WH_CARD04_ORACLE_DIR;
  else process.env.WH_CARD04_ORACLE_DIR = value;
  try {
    return run();
  } finally {
    if (before === undefined) delete process.env.WH_CARD04_ORACLE_DIR;
    else process.env.WH_CARD04_ORACLE_DIR = before;
  }
}

// 前置存在断言：缺失即失败断言（断言抛出即终止本用例，不会掉进文件读取异常）。
function requirePath(target, requirement) {
  expect(fs.existsSync(target), `缺少 ${target}：${requirement}`).toBe(true);
  return target;
}

function requireReadonlyMode(target, expectedMode, requirement) {
  requirePath(target, requirement);
  expect(fs.statSync(target).mode & 0o777, `${requirement}（${target}）`).toBe(expectedMode);
  return target;
}

function readOracleJson() {
  const file = requirePath(
    path.join(oracleDir(), ORACLE_JSON_NAME),
    "T011 必须在仓库外镜像目录生成 ORACLE.json 事实清单",
  );
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function expectStringArray(value, label) {
  expect(Array.isArray(value), `${label} 必须是数组`).toBe(true);
  expect(
    value.every((item) => typeof item === "string"),
    `${label} 的元素必须全部是字符串`,
  ).toBe(true);
  return value;
}

function assertOracleIdentity(facts) {
  expect(facts.schema_version).toBe("1.0.0");
  expect(Object.keys(facts).sort()).toEqual([
    "schema_version", "schema", "card", "stages", "missing_material_error_pattern",
    "report_facts_required_sections", "machine_not_done_states", "spec_analyze_subject",
    "forbidden_states",
  ].sort());
    expect(typeof facts.schema).toBe("string");
    expect(facts.schema).toBe(SCHEMA);
    expect(typeof facts.card).toBe("string");
    expectStringArray(facts.stages, "ORACLE.json.stages");
    for (const stage of STAGES) {
      expect(facts.stages).toContain(stage);
    }
}

describe("CARD-04 仓库外只读 oracle 镜像契约", () => {
  it("oracleDir() 优先采用 WH_CARD04_ORACLE_DIR 覆盖值", () => {
    const probe = path.join(os.tmpdir(), "wh-card04-oracle-mirror-probe");
    const before = process.env.WH_CARD04_ORACLE_DIR;
    const resolved = withOracleDirEnv(probe, () => oracleDir());
    expect(resolved).toBe(probe);
    // 覆盖值原样生效，且用例结束后 env 回到进入前的状态（后续用例继续读同一目录）。
    expect(oracleDir()).toBe(before === undefined ? DEFAULT_ORACLE_DIR : before);
  });

  it("oracleDir() 默认解析到仓库外的 card-04 镜像目录", () => {
    const resolved = withOracleDirEnv(undefined, () => oracleDir());
    expect(resolved).toBe(DEFAULT_ORACLE_DIR);
    // 物理隔离：镜像不得落在仓库内（实现者写集之外）。
    expect(resolved.startsWith(`${REPO_ROOT}${path.sep}`)).toBe(false);
  });

  it("镜像目录存在且为只读 0555", () => {
    const dir = requirePath(
      oracleDir(),
      "T011 必须在仓库外创建 card-04 只读镜像目录，不得在仓库内建副本",
    );
    expect(fs.statSync(dir).isDirectory()).toBe(true);
    expect(fs.statSync(dir).mode & 0o777).toBe(0o555);
  });

  it("ORACLE.json 存在且为只读 0444", () => {
    requireReadonlyMode(
      path.join(oracleDir(), ORACLE_JSON_NAME),
      0o444,
      "ORACLE.json 必须是只读事实清单",
    );
  });

  it("ORACLE.json 身份键：schema / card / stages", () => {
    assertOracleIdentity(readOracleJson());
  });

  it("ORACLE.json 机器事实键：错误模式 / 报告章节 / 机器状态", () => {
    const facts = readOracleJson();
    expect(typeof facts.missing_material_error_pattern).toBe("string");
    expect(facts.missing_material_error_pattern).toContain(MISSING_MATERIAL_ERROR_PATTERN);
    expectStringArray(facts.report_facts_required_sections, "ORACLE.json.report_facts_required_sections");
    for (const section of REPORT_FACTS_REQUIRED_SECTIONS) {
      expect(facts.report_facts_required_sections).toContain(section);
    }
    const states = expectStringArray(facts.machine_not_done_states, "ORACLE.json.machine_not_done_states");
    expect(states).toHaveLength(MACHINE_NOT_DONE_STATES.length);
    expect([...states].sort()).toEqual([...MACHINE_NOT_DONE_STATES].sort());
  });

  it("ORACLE.json 阶段键：spec_analyze_subject / forbidden_states", () => {
    const facts = readOracleJson();
    expect(typeof facts.spec_analyze_subject).toBe("string");
    expect(facts.spec_analyze_subject).toBe(SPEC_ANALYZE_SUBJECT);
    expectStringArray(facts.forbidden_states, "ORACLE.json.forbidden_states");
    for (const state of FORBIDDEN_STATES) {
      expect(facts.forbidden_states).toContain(state);
    }
  });

  it("README.md 为只读 0444 并写明只读镜像、env 覆盖与残余限制", () => {
    const file = requireReadonlyMode(
      path.join(oracleDir(), README_NAME),
      0o444,
      "README.md 必须说明镜像只读边界与残余限制",
    );
    const text = fs.readFileSync(file, "utf8");
    expect(text).toContain("只读镜像");
    expect(text).toContain("WH_CARD04_ORACLE_DIR");
    expect(text).toContain("残余限制");
  });

  it("仓库内不存在 oracle 副本（tracked 文件与物理目录）", () => {
    const tracked = execFileSync("git", ["ls-files"], { cwd: REPO_ROOT, encoding: "utf8" })
      .split("\n")
      .filter((line) => line.length > 0);
    // git 读取失败不得被当成「没有副本」的假绿。
    expect(tracked.length).toBeGreaterThan(1000);
    expect(tracked.filter((file) => /ORACLE\.json$/i.test(file))).toEqual([]);
    expect(tracked.filter((file) => /quality\/oracle\//.test(file))).toEqual([]);
    expect(fs.existsSync(path.join(REPO_ROOT, "quality", "oracle"))).toBe(false);
  });
});


describe("ORACLE-P6-T011-SCHEMA-AND-NINE-KEY-CONTROLS", () => {
  it("rejects a mirror with the wrong schema_version", () => {
    const broken = { ...readOracleJson(), schema_version: "2.0.0" };
    expect(() => assertOracleIdentity(broken)).toThrow();
  });
  it("rejects a mirror missing schema_version", () => {
    const broken = { ...readOracleJson() };
    delete broken.schema_version;
    expect(() => assertOracleIdentity(broken)).toThrow();
  });
  it("rejects a mirror missing one of the nine contract keys", () => {
    const broken = { ...readOracleJson() };
    delete broken.forbidden_states;
    expect(() => assertOracleIdentity(broken)).toThrow();
  });
  it("rejects an extra top-level key without changing the readonly mirror", () => {
    const broken = { ...readOracleJson(), unapproved_field: true };
    expect(() => assertOracleIdentity(broken)).toThrow();
  });
});
