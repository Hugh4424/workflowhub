// CARD-03 P2 预写测试：T003（去逐文件 sha）、T004（删旧模板 + 闭包既有红）、T005（phase 模板派活字段）。
// 每个 describe 以任务号开头，便于 `-t T003` 这样单独跑某张卡的 RED/GREEN。
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { afterEach, describe, expect, it } from "vitest";
import { validateSkillBundle } from "../../runtime/adapters/local-skill-resolver.mjs";
import { checkSkillClosure } from "../../runtime/evidence/check-skill-closure.mjs";
import { buildSkillBundleRelease } from "../../runtime/distribution/skill-bundle-release.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SELF = path.relative(ROOT, fileURLToPath(import.meta.url));
const read = (locator) => fs.readFileSync(path.join(ROOT, locator), "utf8");
const temps = [];
afterEach(() => { for (const dir of temps.splice(0)) fs.rmSync(dir, { recursive: true, force: true }); });

const bundleNames = () => fs.readdirSync(path.join(ROOT, "skills"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(ROOT, "skills", entry.name, "skill-bundle.json")))
  .map((entry) => entry.name)
  .sort();

// 与 resolver 的聚合摘要同一算法：按实际字节重算，不读取任何存储的逐文件值。
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
function recomputeAggregate(name) {
  const bundle = JSON.parse(read(`skills/${name}/skill-bundle.json`));
  const entries = bundle.files.map((entry) => {
    const locator = typeof entry === "string" ? entry : entry.path;
    const bytes = fs.readFileSync(path.join(ROOT, "skills", name, locator));
    return { path: locator, sha256: createHash("sha256").update(bytes).digest("hex") };
  }).sort((left, right) => left.path.localeCompare(right.path));
  return createHash("sha256").update(canonical(entries)).digest("hex");
}

function copyPackage() {
  const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "card03-p2-package-"));
  temps.push(packageRoot);
  for (const locator of ["config", "skills", "workflows", "runtime/schemas", "THIRD_PARTY_NOTICES.md"]) {
    fs.cpSync(path.join(ROOT, locator), path.join(packageRoot, locator), { recursive: true });
  }
  return packageRoot;
}

describe("T003 ORACLE-SKL-001 skill 包只保留运行时聚合摘要", () => {
  it("39 个 skill-bundle.json 的 files[] 都不再存逐文件 sha256", () => {
    const names = bundleNames();
    expect(names).toHaveLength(39);
    const carrying = names.filter((name) => JSON.parse(read(`skills/${name}/skill-bundle.json`)).files
      .some((entry) => typeof entry === "object" && entry !== null && "sha256" in entry));
    expect(carrying, `仍存逐文件 sha256 的 bundle：${carrying.join(", ")}`).toEqual([]);
  });

  it("resolver 聚合摘要可按字节重算，并与 catalog local_bundle_hash 一致", () => {
    const catalog = yaml.load(read("skills/catalog.yaml"));
    for (const name of bundleNames()) {
      const { bundleHash } = validateSkillBundle(ROOT, `skills/${name}/skill-bundle.json`, `skills/${name}/SKILL.md`);
      expect(bundleHash, `${name} 聚合摘要不可重算`).toBe(recomputeAggregate(name));
      const entry = catalog.skills.find((item) => item.name === name);
      if (entry?.local_bundle_hash) expect(entry.local_bundle_hash, `${name} catalog 聚合摘要过期`).toBe(bundleHash);
    }
  });

  it("去掉逐文件值后，改动包内文件仍被 check:skill-closure 的聚合摘要发现", () => {
    const packageRoot = copyPackage();
    for (const name of bundleNames()) {
      const file = path.join(packageRoot, "skills", name, "skill-bundle.json");
      const bundle = JSON.parse(fs.readFileSync(file, "utf8"));
      bundle.files = bundle.files.map((entry) => (typeof entry === "string" ? entry : entry.path));
      fs.writeFileSync(file, `${JSON.stringify(bundle, null, 2)}\n`);
    }
    fs.cpSync(path.join(ROOT, "skills/reuse-registry.md"), path.join(packageRoot, "skills/reuse-registry.md"));
    const before = checkSkillClosure(packageRoot).errors.filter((error) => error.startsWith("spec-plan:"));
    expect(before).toEqual([]);
    fs.appendFileSync(path.join(packageRoot, "skills/spec-plan/templates/phase-template.md"), "\n篡改\n");
    expect(checkSkillClosure(packageRoot).errors.join("\n"))
      .toMatch(/spec-plan: catalog local_bundle_hash does not match resolved bundle/);
  });
});

describe("T004 ORACLE-SKL-002 旧模板删除且 skill 闭包转绿", () => {
  const oldTemplates = [
    ["skills/spec-plan/templates", "plan-template.md"],
    ["skills/spec-tasks/templates", "tasks-template.md"],
  ].map((parts) => parts.join("/"));

  it("两份旧模板已删除，保留的 phase/index 模板仍在", () => {
    for (const locator of oldTemplates) expect(fs.existsSync(path.join(ROOT, locator)), `${locator} 仍存在`).toBe(false);
    for (const locator of ["skills/spec-plan/templates/phase-template.md", "skills/spec-tasks/templates/index-template.md"]) {
      expect(fs.existsSync(path.join(ROOT, locator)), `${locator} 被误删`).toBe(true);
    }
  });

  it("没有测试文件再引用两份旧模板", () => {
    const names = oldTemplates.map((locator) => path.basename(locator));
    const offenders = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
        const locator = `${dir}/${entry.name}`;
        if (entry.isDirectory()) { if (entry.name !== "node_modules") walk(locator); continue; }
        if (!/\.test\.mjs$/.test(entry.name) || locator === SELF) continue;
        const text = read(locator);
        if (names.some((name) => text.includes(name))) offenders.push(locator);
      }
    };
    for (const dir of ["tests", "core/__tests__", "scripts/__tests__"]) walk(dir);
    expect(offenders).toEqual([]);
  });

  it("index 模板用 provider 投影认得的 Execution Index 标题", () => {
    expect(read("skills/spec-tasks/templates/index-template.md")).toMatch(/^## Execution Index\s*$/m);
  });

  it("当前仓库 check:skill-closure 无错误（含 3 条既有红）", () => {
    const result = checkSkillClosure(ROOT);
    expect(result, result.errors.join("\n")).toEqual({ ok: true, errors: [] });
  });

  it("SKILL.md 正文显式条件调用的 architect-code-review 随分发包携带", async () => {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "card03-p2-release-"));
    temps.push(outputDir);
    const release = await buildSkillBundleRelease({ packageRoot: ROOT, outputDir });
    for (const locator of ["skills/architect-code-review/SKILL.md", "skills/architect-code-review/skill-bundle.json"]) {
      expect(release.files.some((entry) => entry.path === locator), `分发包缺 ${locator}`).toBe(true);
    }
  });
});

describe("T005 ORACLE-DISP-002 phase 模板声明工作包事实字段", () => {
  const template = () => read("skills/spec-plan/templates/phase-template.md");

  it("含接口符号、合并责任、progress_cursor 三个字段", () => {
    for (const term of ["接口符号", "合并责任", "progress_cursor"]) expect(template()).toContain(term);
  });

  it("标明是事实记录、不阻断派发，并指向 AGENTS.md 派活纪律", () => {
    expect(template()).toMatch(/事实记录[^\n]{0,80}不阻断|不阻断[^\n]{0,80}事实记录/);
    expect(template()).toMatch(/AGENTS\.md[^\n]{0,40}派活纪律|派活纪律[^\n]{0,40}AGENTS\.md/);
  });

  it("progress_cursor 只是指向 facts.jsonl phase_progress 的指针，不另存进度值", () => {
    const line = template().split("\n").find((text) => text.includes("progress_cursor"));
    expect(line, "模板缺 progress_cursor 行").toBeDefined();
    expect(line).toMatch(/facts\.jsonl/);
    expect(line).toMatch(/phase_progress/);
  });

  it("markdownlint 对 phase 模板零错误（原 :12 MD028、:14 MD032）", () => {
    const require = createRequire(path.join(ROOT, "package.json"));
    const { sync } = require("markdownlint-cli2/markdownlint");
    const parseJsonc = require("markdownlint-cli2/parsers/jsonc");
    const { config } = parseJsonc(read(".markdownlint-cli2.jsonc"));
    const result = sync({ files: [path.join(ROOT, "skills/spec-plan/templates/phase-template.md")], config });
    expect(result.toString()).toBe("");
  });
});
