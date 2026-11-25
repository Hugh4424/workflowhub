import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { anchorTitles, deriveSlug, githubAnchorSlug, realEntry, sectionBody } from "../../tools/cli/rule-tables.mjs";
import { afterAll, describe, expect, it } from "vitest";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const cli = join(repoRoot, "tools", "cli", "rule-tables.mjs");
const header = "| 规则 | 正文锚点 | 靠什么强制 | 状态 | 什么时候读 |";
const fixtures = [];

function tempProject() {
  const dir = mkdtempSync(join(tmpdir(), "rule-tables-p1-"));
  fixtures.push(dir);
  return dir;
}

function run(cwd, args) {
  const result = spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8" });
  return { code: result.status, out: result.stdout ?? "", err: result.stderr ?? "" };
}

function listFiles(root) {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === ".git") continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else found.push(relative(root, path).split(sep).join("/"));
    }
  };
  walk(root);
  return found.sort();
}

function read(root, rel) {
  return readFileSync(join(root, rel), "utf8");
}

function write(root, rel, text) {
  const path = join(root, rel);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, text);
}

function addRule(root, {
  domain = "backend",
  rule = "模块边界只按依赖方向",
  anchor = `specs/${domain}/architecture.md#模块边界`,
  force = "审查问句",
  status = "已强制",
  readHint = "改模块依赖前",
  body = "模块边界只按依赖方向，跨层调用必须经公开入口。",
  heading = "## 模块边界",
  bodyFile = `specs/${domain}/architecture.md`,
} = {}) {
  write(root, bodyFile, `${heading}\n\n${body}\n`);
  const tablePath = `specs/${domain}/README.md`;
  const table = read(root, tablePath);
  expect(table).toContain("| --- | --- | --- | --- | --- |");
  write(root, tablePath, table.replace("| --- | --- | --- | --- | --- |",
    `| --- | --- | --- | --- | --- |\n| ${rule} | ${anchor} | ${force} | ${status} | ${readHint} |`));
  return { rule, anchor, tablePath, bodyFile };
}

afterAll(() => {
  for (const dir of fixtures) {
    try { chmodSync(dir, 0o755); } catch { /* already writable */ }
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("T001 空项目建出该域的表与 AGENTS 指针", () => {
  it("init 空项目只建 AGENTS.md 与 specs/backend/README.md，重复执行幂等，再建 api 只多一行", () => {
    const root = tempProject();
    const first = run(root, ["init", "--root", root, "--domain", "backend"]);
    expect(first.code, first.err).toBe(0);
    expect(first.out).toContain("ESTABLISHED");
    expect(listFiles(root)).toEqual(["AGENTS.md", "specs/backend/README.md"]);
    expect(existsSync(join(root, "norms"))).toBe(false);

    const table = read(root, "specs/backend/README.md");
    expect(table).toContain(header);
    expect(table).toContain("# backend 规范");
    const agents = read(root, "AGENTS.md");
    expect(agents).toContain("<!-- workflowhub:rule-tables:begin -->");
    expect(agents).toContain("[specs/backend/README.md](specs/backend/README.md)");

    const again = run(root, ["init", "--root", root, "--domain", "backend"]);
    expect(again.code).toBe(0);
    expect(again.out).toContain("ALREADY ESTABLISHED");
    expect(read(root, "AGENTS.md")).toBe(agents);
    expect(read(root, "specs/backend/README.md")).toBe(table);

    const api = run(root, ["init", "--root", root, "--domain", "api"]);
    expect(api.code).toBe(0);
    expect(listFiles(root)).toEqual([
      "AGENTS.md",
      "specs/api/README.md",
      "specs/backend/README.md",
    ]);
    const agentsAfter = read(root, "AGENTS.md");
    expect(agentsAfter.startsWith(agents.slice(0, agents.indexOf("<!-- workflowhub:rule-tables:begin -->")))).toBe(true);
    expect(agentsAfter.match(/\[specs\/api\/README\.md\]/g)).toHaveLength(1);
    expect(agentsAfter.match(/\[specs\/backend\/README\.md\]/g)).toHaveLength(1);
  });

  it("已有叙述型 README 只在文末追加规则表，不改原文前缀", () => {
    const root = tempProject();
    const original = "# 后端\n\n这是原有的叙述段，不能被改写。\n";
    write(root, "specs/backend/README.md", original);
    const init = run(root, ["init", "--root", root, "--domain", "backend"]);
    expect(init.code).toBe(0);
    const after = read(root, "specs/backend/README.md");
    expect(after.startsWith(original)).toBe(true);
    expect(after.slice(original.length)).toContain("## 规则表");
    expect(after).toContain(header);
  });

  it("只读目录 init 打印 INIT FAILED 退 2，不写半份也不报 ESTABLISHED", () => {
    const root = tempProject();
    chmodSync(root, 0o555);
    try {
      const result = run(root, ["init", "--root", root, "--domain", "backend"]);
      expect(result.code).toBe(2);
      expect(result.out).toContain("INIT FAILED");
      expect(result.out).not.toContain("ESTABLISHED ");
      expect(listFiles(root)).toEqual([]);
    } finally {
      chmodSync(root, 0o755);
    }
  });
});

describe("T002 没有归属结构时退 3，读点给具名结论", () => {
  it("空目录与只有 AGENTS 的目录 check 都退 3", () => {
    const empty = tempProject();
    const first = run(empty, ["check", "--root", empty]);
    expect(first.code, first.out + first.err).toBe(3);
    expect(first.out).toContain("NOT ESTABLISHED: zero rule tables");

    const agentsOnly = tempProject();
    write(agentsOnly, "AGENTS.md", "# AGENTS.md\n\n没有表的导航。\n");
    const second = run(agentsOnly, ["check", "--root", agentsOnly]);
    expect(second.code).toBe(3);
    expect(second.out).toContain("NOT ESTABLISHED: zero rule tables");
  });

  it("lookup 三态：缺表 3、表在 0 行 4、有行 0", () => {
    const root = tempProject();
    const absent = run(root, ["lookup", "--root", root, "--domain", "backend"]);
    expect(absent.code).toBe(3);
    expect(absent.out).toContain("rows=0 domain=backend table=absent");

    expect(run(root, ["init", "--root", root, "--domain", "backend"]).code).toBe(0);
    const empty = run(root, ["lookup", "--root", root, "--domain", "backend"]);
    expect(empty.code).toBe(4);
    expect(empty.out).toContain("rows=0 domain=backend no_registered_rule");

    addRule(root);
    const rows = run(root, ["lookup", "--root", root, "--domain", "backend"]);
    expect(rows.code).toBe(0);
    expect(rows.out).toContain("rows=1 domain=backend");
    expect(rows.out).toContain("模块边界只按依赖方向 | specs/backend/architecture.md#模块边界 | 已强制");
  });

  it("四处读点写明先建后读、缺表 absent 与 0 行 no_registered_rule", () => {
    const normInit = readFileSync(join(repoRoot, "skills/project-norm-init/SKILL.md"), "utf8");
    expect(normInit).toContain("规则的建与读");
    expect(normInit).toContain("rule_table absent");
    expect(normInit).toContain("no_registered_rule");
    expect(normInit).toContain("init --root");

    const buildPlan = readFileSync(join(repoRoot, "workflows/build-plan/SKILL.md"), "utf8");
    expect(buildPlan).toContain("rule_table absent");
    expect(buildPlan).toContain("no_registered_rule");
    expect(buildPlan).toContain("init --root");

    const buildCode = readFileSync(join(repoRoot, "workflows/build-code/SKILL.md"), "utf8");
    expect(buildCode).toContain("init --root");
    expect(buildCode).toContain("lookup --domain");
    expect(buildCode).toContain("no_registered_rule");

    const buildPrd = readFileSync(join(repoRoot, "workflows/build-prd/SKILL.md"), "utf8");
    expect(buildPrd).toContain("rule_table absent");
    expect(buildPrd).toContain("先登记表行");
  });
});

describe("T003 逐字副本被拦住，删副本恢复干净", () => {
  it("逐字副本与插空行副本退 1 并点名，删副本回 0，短正文报 BODY_TOO_SHORT", () => {
    const root = tempProject();
    expect(run(root, ["check", "--root", root]).code).toBe(3);
    expect(run(root, ["init", "--root", root, "--domain", "backend"]).code).toBe(0);
    const clean = run(root, ["check", "--root", root]);
    expect(clean.code).toBe(0);
    expect(clean.out).toContain("rules=0");

    addRule(root);
    const one = run(root, ["check", "--root", root]);
    expect(one.code, one.out + one.err).toBe(0);
    expect(one.out).toContain("rules=1");

    const architecture = read(root, "specs/backend/architecture.md");
    write(root, "specs/backend/architecture-copy.md", architecture);
    const duplicate = run(root, ["check", "--root", root]);
    expect(duplicate.code).toBe(1);
    expect(duplicate.out).toContain("BODY_DUPLICATE");
    expect(duplicate.out).toContain("specs/backend/architecture-copy.md");
    expect(duplicate.out).toContain("second_home: specs/backend/architecture-copy.md");
    expect(duplicate.out).toContain("architecture.md");

    write(root, "specs/backend/architecture-spaced.md", architecture.replace("\n\n", "\n\n\n\n"));
    const spaced = run(root, ["check", "--root", root]);
    expect(spaced.code).toBe(1);
    expect(spaced.out).toContain("BODY_DUPLICATE");
    expect(spaced.out).toContain("specs/backend/architecture-spaced.md");

    rmSync(join(root, "specs/backend/architecture-copy.md"));
    rmSync(join(root, "specs/backend/architecture-spaced.md"));
    const restored = run(root, ["check", "--root", root]);
    expect(restored.code).toBe(0);
    expect(restored.out).toContain("PASS");

    const shortBody = "测试只跑受影响范围";
    write(root, "specs/backend/architecture.md", `## 模块边界\n\n${shortBody}\n`);
    write(root, "specs/backend/architecture-copy.md", `## 模块边界\n\n${shortBody}\n`);
    const shortCopy = run(root, ["check", "--root", root]);
    expect(shortCopy.code).toBe(1);
    expect(shortCopy.out).toContain("BODY_DUPLICATE");

    rmSync(join(root, "specs/backend/architecture-copy.md"));
    write(root, "specs/backend/architecture.md", "## 模块边界\n\n只跑测试\n");
    const tooShort = run(root, ["check", "--root", root]);
    expect(tooShort.code).toBe(1);
    expect(tooShort.out).toContain("BODY_TOO_SHORT");
  });

  it("改一个词的副本只出 BODY_ECHO 提示、退 0，两个读数分列", () => {
    const root = tempProject();
    expect(run(root, ["init", "--root", root, "--domain", "backend"]).code).toBe(0);
    const body = "跨层调用一律不允许绕过公开入口，依赖方向必须由检查器核对，审查时逐条读回并保留原始失败原件与来源。";
    addRule(root, { body });
    const echoBody = body.replace("不允许", "不能");
    write(root, "specs/backend/architecture-echo.md", `## 模块边界\n\n${echoBody}\n`);
    const result = run(root, ["check", "--root", root]);
    expect(result.code).toBe(0);
    expect(result.out).toContain("BODY_ECHO");
    expect(result.out).toContain("不计违规");
    expect(result.out).toContain("LIMIT 判重阈值");
    expect(result.out).not.toContain("本仓 2026-11-25 历史语料");
  });
});

describe("T004 表放错位置报出来", () => {
  it("docs/rules.md 的五列表退 1 RULE_TABLE_MISPLACED，围栏里的同形表头不计", () => {
    const root = tempProject();
    expect(run(root, ["init", "--root", root, "--domain", "backend"]).code).toBe(0);
    const row = "| 模块边界只按依赖方向 | specs/backend/architecture.md#模块边界 | 审查问句 | 已强制 | 改模块前 |";
    write(root, "docs/rules.md", `# 规则\n\n${header}\n| --- | --- | --- | --- | --- |\n${row}\n`);
    const misplaced = run(root, ["check", "--root", root]);
    expect(misplaced.code).toBe(1);
    expect(misplaced.out).toContain("RULE_TABLE_MISPLACED docs/rules.md");
    expect(misplaced.out).toContain("五列表必须放 specs/<域>/ 下");

    rmSync(join(root, "docs/rules.md"));
    write(root, "docs/fenced.md", `# 样例\n\n\`\`\`markdown\n${header}\n| --- | --- | --- | --- | --- |\n\`\`\`\n`);
    const fenced = run(root, ["check", "--root", root]);
    expect(fenced.code).toBe(0);
    expect(fenced.out).not.toContain("docs/fenced.md");
    expect(fenced.out).not.toContain("RULE_TABLE_MISPLACED");
  });

  it("specs/backend/rules.md 未声明报 INDEX_UNLINKED，声明后回 0，删指针再报", () => {
    const root = tempProject();
    expect(run(root, ["init", "--root", root, "--domain", "backend"]).code).toBe(0);
    write(root, "specs/backend/rules.md", `# 规则\n\n${header}\n| --- | --- | --- | --- | --- |\n`);
    const unlinked = run(root, ["check", "--root", root]);
    expect(unlinked.code).toBe(1);
    expect(unlinked.out).toContain("INDEX_UNLINKED specs/backend/rules.md");

    const agents = read(root, "AGENTS.md");
    write(root, "AGENTS.md", `${agents}\n[specs/backend/rules.md](specs/backend/rules.md)\n`);
    const linked = run(root, ["check", "--root", root]);
    expect(linked.code, linked.out + linked.err).toBe(0);

    write(root, "AGENTS.md", agents);
    const unlinkedAgain = run(root, ["check", "--root", root]);
    expect(unlinkedAgain.code).toBe(1);
    expect(unlinkedAgain.out).toContain("INDEX_UNLINKED specs/backend/rules.md");
  });

  it("改列名退 1 报 TABLE_INVALID 并点名文件", () => {
    const root = tempProject();
    expect(run(root, ["init", "--root", root, "--domain", "backend"]).code).toBe(0);
    const table = read(root, "specs/backend/README.md");
    write(root, "specs/backend/README.md", table.replace("靠什么强制", "强制方式"));
    const invalid = run(root, ["check", "--root", root]);
    expect(invalid.code).toBe(1);
    expect(invalid.out).toContain("TABLE_INVALID specs/backend/README.md");
    expect(invalid.out).toContain("既不是规则表");
  });
});

describe("T005 路径越界与排除参数不能把检查变空", () => {
  it("无子命令、坏 domain、覆盖已声明表或根的 exclude 都退 2 并给具名行", () => {
    const root = tempProject();
    expect(run(root, ["init", "--root", root, "--domain", "backend"]).code).toBe(0);

    const noSubcommand = run(root, []);
    expect(noSubcommand.code).toBe(2);
    expect(noSubcommand.out).toContain("USAGE: rule-tables.mjs");

    expect(run(root, ["wat", "--root", root]).code).toBe(2);
    expect(run(root, ["check"]).code).toBe(2);
    expect(run(root, ["check", "--root", join(root, "missing")]).code).toBe(2);

    const outside = run(root, ["check", "--root", root, "--domain", "../../outside"]);
    expect(outside.code).toBe(2);
    expect(outside.out).toContain("USAGE invalid --domain: ../../outside");

    const slash = run(root, ["check", "--root", root, "--domain", "a/b"]);
    expect(slash.code).toBe(2);
    expect(slash.out).toContain("USAGE invalid --domain: a/b");

    const coverSpecs = run(root, ["check", "--root", root, "--exclude", "specs"]);
    expect(coverSpecs.code).toBe(2);
    expect(coverSpecs.out).toContain("USAGE --exclude covers declared table specs/backend/README.md");

    expect(run(root, ["check", "--root", root, "--exclude", "."]).code).toBe(2);
    expect(run(root, ["check", "--root", root, "--exclude", "/abs/path"]).code).toBe(2);
    expect(listFiles(root)).toEqual(["AGENTS.md", "specs/backend/README.md"]);
  });

  it("排除后没有 .md 退 2 NO_SCAN_SCOPE，排除项逐条打印", () => {
    const onlyAgents = tempProject();
    write(onlyAgents, "AGENTS.md", "# AGENTS.md\n");
    const emptyScope = run(onlyAgents, ["check", "--root", onlyAgents, "--exclude", "AGENTS.md"]);
    expect(emptyScope.code).toBe(2);
    expect(emptyScope.out).toContain("NO_SCAN_SCOPE");

    const root = tempProject();
    expect(run(root, ["init", "--root", root, "--domain", "backend"]).code).toBe(0);
    write(root, "docs/note.md", "# 记录\n");
    const excluded = run(root, ["check", "--root", root, "--exclude", "docs"]);
    expect(excluded.code, excluded.out + excluded.err).toBe(0);
    expect(excluded.out).toContain("EXCLUDE docs");
  });

  it("经符号链接调用 CLI 与项目根都不静默退 0，结论一致", () => {
    const root = tempProject();
    expect(run(root, ["init", "--root", root, "--domain", "backend"]).code).toBe(0);
    const alias = join(tempProject(), "project-link");
    symlinkSync(root, alias);
    const viaAlias = run(alias, ["check", "--root", alias]);
    expect(viaAlias.code, viaAlias.out + viaAlias.err).toBe(0);
    expect(viaAlias.out).toContain("PASS");

    const cliLink = join(tempProject(), "rule-tables-link.mjs");
    symlinkSync(cli, cliLink);
    const linkedEntry = spawnSync(process.execPath, [cliLink], { encoding: "utf8" });
    expect(linkedEntry.status).toBe(2);
    expect(linkedEntry.stdout).toContain("USAGE: rule-tables.mjs");
  });
});

function sha256File(root, rel) {
  return createHash("sha256").update(readFileSync(join(root, rel))).digest("hex");
}

describe("T006 发现第二处只报不改", () => {
  it("check 输出 second_home，两处字节不变；norm-sync 写序、判重键与 refused 可逐字回读", () => {
    const root = tempProject();
    expect(run(root, ["init", "--root", root, "--domain", "backend"]).code).toBe(0);
    addRule(root);
    const secondHome = "specs/backend/architecture-second-home.md";
    write(root, secondHome, read(root, "specs/backend/architecture.md"));
    const beforeHome = sha256File(root, "specs/backend/architecture.md");
    const beforeSecond = sha256File(root, secondHome);

    const result = run(root, ["check", "--root", root]);
    expect(result.code).toBe(1);
    expect(result.out).toContain("BODY_DUPLICATE");
    expect(result.out).toContain(`second_home: ${secondHome}`);
    expect(sha256File(root, "specs/backend/architecture.md")).toBe(beforeHome);
    expect(sha256File(root, secondHome)).toBe(beforeSecond);

    const normSync = readFileSync(join(repoRoot, "skills/norm-sync/SKILL.md"), "utf8");
    expect(normSync).toContain("second_home");
    expect(normSync).toContain("refused");
    expect(normSync).toContain("task＋正文锚点");
    expect(normSync).toContain("该域规则表行→该行锚点正文→AGENTS 指针（仅新增域或首行时）→对应已验证且已同步的经验条目");
    expect(normSync).toContain("第二处只报不改");

    const reflection = readFileSync(join(repoRoot, "skills/stage-reflection/SKILL.md"), "utf8");
    expect(reflection).toContain("`specs/Improvements.md` 只收未决事项");
    expect(reflection).toContain("已证规则只经 norm-sync 写域表锚点");

    const catalog = yaml.load(readFileSync(join(repoRoot, "skills/catalog.yaml"), "utf8"));
    const entries = Object.fromEntries(catalog.skills.map((entry) => [entry.name, entry]));
    for (const name of ["project-norm-init", "norm-sync", "stage-reflection"]) {
      expect(entries[name].last_reviewed_at).toBe("2026-11-25");
      expect(entries[name].local_changes).toContain("rule-tables");
    }
    expect(entries["norm-sync"].local_changes).toContain("second_home");
  });
});

describe("T007 在仿既有项目上不假绿、不误伤", () => {
  it("init 前报两条 TABLE_INVALID，init 后原文前缀不变，加行回 0，setext 不假红", () => {
    const root = tempProject();
    const agents = [
      "# AGENTS.md",
      "",
      "- [specs/backend/README.md](specs/backend/README.md)",
      "- [specs/backend/architecture.md](specs/backend/architecture.md)",
      "",
    ].join("\n");
    const shared = "共享样板：所有改动都必须留真实原件与来源，并保留失败原件与执行事实。";
    const readme = `# 后端\n\n这是原有的叙述段，不能被改写。\n\n${shared}\n`;
    const overview = `# 后端概览\n\n${shared}\n`;
    const architecture = [
      "# 后端架构",
      "",
      "模块边界",
      "========",
      "",
      shared,
      "",
      "模块边界只按依赖方向，跨层调用必须经公开入口。",
      "",
    ].join("\n");
    write(root, "AGENTS.md", agents);
    write(root, "specs/backend/README.md", readme);
    write(root, "specs/backend/architecture.md", architecture);
    write(root, "specs/backend/overview.md", overview);

    const before = run(root, ["check", "--root", root]);
    expect(before.code, before.out + before.err).toBe(1);
    expect(before.out.match(/TABLE_INVALID/g)).toHaveLength(2);
    expect(before.out).toContain("TABLE_INVALID specs/backend/README.md");
    expect(before.out).toContain("TABLE_INVALID specs/backend/architecture.md");

    const init = run(root, ["init", "--root", root, "--domain", "backend"]);
    expect(init.code).toBe(0);
    const afterInit = read(root, "specs/backend/README.md");
    expect(afterInit.startsWith(readme)).toBe(true);
    expect(afterInit.slice(readme.length)).toContain("## 规则表");

    const stillInvalid = run(root, ["check", "--root", root]);
    expect(stillInvalid.code).toBe(1);
    expect(stillInvalid.out).toContain("TABLE_INVALID specs/backend/architecture.md");

    const table = read(root, "specs/backend/README.md");
    write(root, "specs/backend/README.md", table.replace("| --- | --- | --- | --- | --- |",
      "| --- | --- | --- | --- | --- |\n| 模块边界只按依赖方向 | specs/backend/architecture.md#模块边界 | 审查问句 | 已强制 | 改模块依赖前 |"));
    const clean = run(root, ["check", "--root", root]);
    expect(clean.code, clean.out + clean.err).toBe(0);
    expect(clean.out).not.toContain("ANCHOR_AMBIGUOUS");
    // 样板句已进入规则正文块；规则表文件本身不参与比对，比较对象是非表文件 overview.md。
    // 实测覆盖率 0.40（0.4–0.6 只出 BODY_ECHO，0.6 才判 BODY_DUPLICATE）：证明比较实际发生且未误判成第二处。
    expect(clean.out).toContain("BODY_ECHO");
    expect(clean.out).not.toContain("BODY_DUPLICATE");
    expect(clean.out).toContain("PASS");

    const withoutHeader = read(root, "specs/backend/README.md").replace(`${header}\n`, "");
    write(root, "specs/backend/README.md", withoutHeader);
    const headerGone = run(root, ["check", "--root", root]);
    expect(headerGone.code).toBe(1);
    expect(headerGone.out).toContain("TABLE_INVALID specs/backend/README.md");

    rmSync(join(root, "specs/backend/README.md"));
    const tableGone = run(root, ["check", "--root", root]);
    expect(tableGone.code).toBe(1);
    expect(tableGone.out).toContain("INDEX_DANGLING specs/backend/README.md");

    const onlyAgents = tempProject();
    write(onlyAgents, "AGENTS.md", "# AGENTS.md\n");
    const zero = run(onlyAgents, ["check", "--root", onlyAgents]);
    expect(zero.code).toBe(3);
  });

  it("verify-structure 退 0，且不再自带本地 ghSlug（全仓单点未证）", () => {
    const verify = spawnSync(process.execPath, ["tools/cli/verify-structure.mjs"], { cwd: repoRoot, encoding: "utf8" });
    expect(verify.status, verify.stdout + verify.stderr).toBe(0);
    const source = readFileSync(join(repoRoot, "tools/cli/verify-structure.mjs"), "utf8");
    expect((source.match(/ghSlug/g) ?? [])).toHaveLength(0);
    // 宪法锚点保留 GitHub 精确规则；规则表用合并连续连字符的 deriveSlug。两条用途不同，语义钉住。
    expect(githubAnchorSlug("F1 - 薄核心")).toBe("f1---薄核心");
    expect(deriveSlug("F1 - 薄核心")).toBe("f1-薄核心");
  });

  it("setext 相邻节收尾不把下一标题算进上一节正文", () => {
    const text = [
      "# 文档",
      "",
      "模块边界",
      "========",
      "",
      "第一段正文。",
      "",
      "下一节",
      "========",
      "",
      "第二段正文。",
      "",
    ].join("\n");
    const titles = anchorTitles(text);
    const first = titles.find((title) => title.title === "模块边界");
    expect(first).toBeTruthy();
    const body = sectionBody(text, first);
    expect(body).toContain("第一段正文。");
    expect(body).not.toContain("下一节");
    expect(body).not.toContain("第二段正文");
  });

  it("realEntry 在 argv[1] 无法解析时返回 null，主入口据此打印具名错误", () => {
    expect(realEntry(join(repoRoot, "no-such-entry.mjs"))).toBeNull();
    expect(realEntry("")).toBe(false);
  });
});

describe("行级判据（T001–T005 实施底稿）", () => {
  it("空规则、超长、坏状态、坏锚点、重复规则与重复锚点各报具名检查", () => {
    const root = tempProject();
    expect(run(root, ["init", "--root", root, "--domain", "backend"]).code).toBe(0);
    write(root, "specs/backend/a.md", "## 已有标题\n\n正文。\n");
    const longRule = "这是一条明显超过四十个字符的规则句子用来验证长度判据必须被检查器实际发现并点名处理";
    expect([...longRule].length).toBeGreaterThan(40);
    const rows = [
      `|  | specs/backend/a.md#已有标题 | 审查问句 | 已强制 | 改模块前 |`,
      `| ${longRule} | specs/backend/a.md#不存在 | 审查问句 | 未知 | 改模块前 |`,
      `| 短规则 | 没有井号 |  | 已强制 | 改模块前 |`,
      `| 另一条规则 | specs/backend/missing.md#标题 | 审查问句 | 已强制 | 改模块前 |`,
      `| 模块边界只按依赖方向 | specs/backend/a.md#已有标题 | 审查问句 | 已强制 | 改模块前 |`,
      `| 模块边界只按依赖方向 | specs/backend/a.md#已有标题 | 审查问句 | 已强制 | 改模块前 |`,
    ].join("\n");
    const table = read(root, "specs/backend/README.md").replace("| --- | --- | --- | --- | --- |", `| --- | --- | --- | --- | --- |\n${rows}`);
    write(root, "specs/backend/README.md", table);
    const result = run(root, ["check", "--root", root]);
    expect(result.code).toBe(1);
    for (const code of ["RULE_EMPTY", "RULE_TOO_LONG", "STATUS_INVALID", "ANCHOR_FORMAT", "FORCE_EMPTY", "ANCHOR_PATH", "RULE_DUPLICATE", "ANCHOR_DUPLICATE", "ANCHOR_AMBIGUOUS"]) {
      expect(result.out, code).toContain(code);
    }
  });
});

describe("审查修复：排除、精确副本与入口（F1/F3/F6/F7/F9/F2）", () => {
  it("F1 排除第二处文件后 check 退 0、打印 EXCLUDE，不再报 BODY_DUPLICATE", () => {
    const root = tempProject();
    expect(run(root, ["init", "--root", root, "--domain", "backend"]).code).toBe(0);
    addRule(root);
    write(root, "specs/backend/architecture-copy.md", read(root, "specs/backend/architecture.md"));
    const excluded = run(root, ["check", "--root", root, "--exclude", "specs/backend/architecture-copy.md"]);
    expect(excluded.code, excluded.out + excluded.err).toBe(0);
    expect(excluded.out).toContain("EXCLUDE specs/backend/architecture-copy.md");
    expect(excluded.out).not.toContain("BODY_DUPLICATE");
    expect(excluded.out).not.toContain("second_home");
  });

  it("F6 短正文（<24 字）嵌在长散文里不按 BODY_DUPLICATE 误报", () => {
    const root = tempProject();
    expect(run(root, ["init", "--root", root, "--domain", "backend"]).code).toBe(0);
    addRule(root, { body: "测试只跑受影响范围" });
    write(root, "specs/backend/prose.md",
      "## 其他\n\n这里是一段很长的散文，测试只跑受影响范围只是其中一句，还接着写了很多别的内容，不构成整段重复。\n");
    const result = run(root, ["check", "--root", root]);
    expect(result.code, result.out + result.err).toBe(0);
    expect(result.out).not.toContain("BODY_DUPLICATE");
  });

  it("F3 中性长正文（无规则语气词）逐字复制仍判 BODY_DUPLICATE", () => {
    const root = tempProject();
    expect(run(root, ["init", "--root", root, "--domain", "backend"]).code).toBe(0);
    const body = "模块边界只按依赖方向，跨层调用经公开入口，回退时保留双方差异并逐件核对。";
    expect([...body].length).toBeGreaterThanOrEqual(24);
    addRule(root, { body });
    write(root, "specs/backend/architecture-copy.md", read(root, "specs/backend/architecture.md"));
    const result = run(root, ["check", "--root", root]);
    expect(result.code).toBe(1);
    expect(result.out).toContain("BODY_DUPLICATE");
    expect(result.out).toContain("整段相等");
  });

  it("F7 AGENTS 已链接本表时 init 不追加标记段，也不出现第二条指针", () => {
    const root = tempProject();
    const agents = "# AGENTS.md\n\n- [specs/backend/README.md](./specs/backend/README.md)\n";
    write(root, "AGENTS.md", agents);
    write(root, "specs/backend/README.md", "# 后端\n\n叙述。\n");
    const init = run(root, ["init", "--root", root, "--domain", "backend"]);
    expect(init.code).toBe(0);
    expect(read(root, "AGENTS.md")).toBe(agents);
    expect((read(root, "AGENTS.md").match(/\]\(\.?\/?specs\/backend\/README\.md\)/g) ?? [])).toHaveLength(1);
    expect(read(root, "AGENTS.md")).not.toContain("workflowhub:rule-tables:begin");
    expect(read(root, "specs/backend/README.md")).toContain(header);
  });

  it("F9 check 明确拒绝 --domain，不静默接受", () => {
    const root = tempProject();
    expect(run(root, ["init", "--root", root, "--domain", "backend"]).code).toBe(0);
    const result = run(root, ["check", "--root", root, "--domain", "backend"]);
    expect(result.code).toBe(2);
    expect(result.out).toContain("check does not accept --domain");
  });

  it("F2 有声明但零表退 1，真空白退 3（记录偏离，不称两者都退 3）", () => {
    const declared = tempProject();
    write(declared, "AGENTS.md", "# AGENTS.md\n\n- [specs/backend/README.md](specs/backend/README.md)\n");
    const one = run(declared, ["check", "--root", declared]);
    expect(one.code).toBe(1);
    expect(one.out).toContain("INDEX_DANGLING specs/backend/README.md");

    const empty = tempProject();
    const three = run(empty, ["check", "--root", empty]);
    expect(three.code).toBe(3);
  });
});

describe("P6 兼容：markdown 链接锚点、html 目标与同文件嵌套区段（迟到发现）", () => {
  function p6Project() {
    const root = tempProject();
    write(root, "AGENTS.md", [
      "# AGENTS.md",
      "",
      "- [specs/backend/README.md](specs/backend/README.md)",
      "- [specs/backend/architecture.md](specs/backend/architecture.md)",
      "",
    ].join("\n"));
    write(root, "specs/backend/README.md", [
      "# 后端",
      "",
      header,
      "| --- | --- | --- | --- | --- |",
      "| 总览规则 | [总览](architecture.md#总览) | 审查问句 | 已强制 | 读前 |",
      "| 细则规则 | [细则](architecture.md#细则) | 审查问句 | 已强制 | 读前 |",
      "| 模板规则 | [模板](templates/overview.html) | 结构 | 已强制 | 改页前 |",
      "",
    ].join("\n"));
    write(root, "specs/backend/architecture.md", [
      "# 总览",
      "",
      "总览正文说明模块边界与依赖方向，跨层调用必须经公开入口。",
      "",
      "## 细则",
      "",
      "细则正文说明失败边界与恢复责任人，审查时逐条核对。",
      "",
    ].join("\n"));
    write(root, "specs/backend/templates/overview.html",
      "<!doctype html>\n<html><body><div id=\"top\">模板</div></body></html>\n");
    return root;
  }

  it("接受 [文字](path#slug) 与 .html 路径锚；同文件嵌套区段不自我比较", () => {
    const root = p6Project();
    const table = read(root, "specs/backend/README.md").replace(
      "| 模板规则 | [模板](templates/overview.html) | 结构 | 已强制 | 改页前 |",
      [
        "| 模板规则 | [模板](templates/overview.html) | 结构 | 已强制 | 改页前 |",
        "| 模板锚规则 | [锚](templates/overview.html#top) | 结构 | 已强制 | 改页前 |",
      ].join("\n"));
    write(root, "specs/backend/README.md", table);
    const result = run(root, ["check", "--root", root]);
    expect(result.code, result.out + result.err).toBe(0);
    expect(result.out).not.toContain("ANCHOR_PATH");
    expect(result.out).not.toContain("ANCHOR_FORMAT");
    expect(result.out).not.toContain("BODY_DUPLICATE");
    expect(result.out).toContain("PASS tables=1 rules=4");
  });

  it("不放宽：链接写法下坏路径、坏 slug 与跨文件逐字副本仍红", () => {
    const root = p6Project();
    const table = read(root, "specs/backend/README.md").replace(
      "| 模板规则 | [模板](templates/overview.html) | 结构 | 已强制 | 改页前 |",
      [
        "| 模板规则 | [模板](templates/overview.html) | 结构 | 已强制 | 改页前 |",
        "| 坏路径规则 | [坏](missing.md#总览) | 审查问句 | 已强制 | 读前 |",
        "| 坏slug规则 | [坏](architecture.md#不存在) | 审查问句 | 已强制 | 读前 |",
      ].join("\n"));
    write(root, "specs/backend/README.md", table);
    write(root, "specs/backend/architecture-copy.md", read(root, "specs/backend/architecture.md"));
    const result = run(root, ["check", "--root", root]);
    expect(result.code).toBe(1);
    expect(result.out).toContain("ANCHOR_PATH specs/backend/README.md:8");
    expect(result.out).toContain("ANCHOR_AMBIGUOUS specs/backend/README.md:9");
    // 同一跨文件副本只报最具体的区段一次（外层 H1 不再重复计数）。
    expect((result.out.match(/BODY_DUPLICATE specs\/backend\/architecture-copy\.md/g) ?? [])).toHaveLength(2);
  });
});
