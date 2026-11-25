#!/usr/bin/env node
// 规则表工具：建立、检查、读取 specs/<域>/ 下的五列表。
// 设计原件：任务库 quality/evidence/build-plan/design-p1-v4.md（sha256 24eb4334ac49…）。
// 职责：规则表的建、锚点唯一、逐字副本检测；不新增规范根，不写规则正文。
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { realpathSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { withLock } from "../../runtime/interface/record-lock.mjs";
import { createFileOnce, writeFileAtomic } from "../../runtime/interface/safe-write.mjs";

export const USAGE = [
  "USAGE: rule-tables.mjs init|check|lookup --root <dir> [--domain <name>] [--exclude <project-relative-path>]",
  "  init   --root <dir> --domain <name>   建立该域规则表与 AGENTS 指针（create-only、幂等）",
  "  check  --root <dir> [--exclude <p>]   检查规则表归属、锚点与第二处",
  "  lookup --root <dir> --domain <name>   读取该域规则行",
].join("\n");

export const EXIT = Object.freeze({
  PASS: 0,
  VIOLATION: 1,
  USAGE: 2,
  NO_TABLE: 3,
  NO_RULE: 4,
});

export const TABLE_HEADER = "| 规则 | 正文锚点 | 靠什么强制 | 状态 | 什么时候读 |";
const SEPARATOR = "| --- | --- | --- | --- | --- |";
const BEGIN_MARKER = "<!-- workflowhub:rule-tables:begin -->";
const END_MARKER = "<!-- workflowhub:rule-tables:end -->";
const DOMAIN_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}._-]*$/u;
const DEFAULT_EXCLUDES = [".git", "node_modules", "specs/archive", "docs/archive", "graphify-out"];
const PACKAGE_ROOT = (() => { try { return realpathSync(fileURLToPath(new URL("../../", import.meta.url))); } catch { return null; } })();
const READ_HINTS = {
  backend: "动后端模块、依赖或存储前",
  api: "改接口合同或错误处理前",
  acceptance: "写验收证据或判据前",
  design: "动页面、组件或样式前",
  frontend: "改前端工程或组件前",
};


// 小写 → 删标点 → 空格转连字符 → 连续连字符合并。仓内 slug 算法只留这一份。
export function deriveSlug(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// GitHub 精确锚点规则：小写 → 删标点 → 空格转连字符，不合并连续连字符。
// 宪法/checklist 的逐条锚点身份绑定用这一份；规则表用下面的 deriveSlug（会合并连续连字符）。
// 两种用途不同，因此分函数而不共用一个实现。
export function githubAnchorSlug(text) {
  return String(text).trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-");
}

export function matchSlug(slug, titles) {
  const wanted = String(slug).replace(/-+/g, "-");
  return (titles ?? []).filter((title) => deriveSlug(title) === wanted);
}

function usageError(message) {
  return Object.assign(new Error(message), { code: "USAGE" });
}

export function parseArgs(argv) {
  const [subcommand, ...rest] = argv;
  if (!subcommand) throw usageError("missing subcommand");
  if (!["init", "check", "lookup"].includes(subcommand)) {
    throw usageError(`unknown subcommand: ${subcommand}`);
  }
  const values = { subcommand, root: null, domains: [], excludes: [] };
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith("--")) throw usageError(`unexpected argument: ${token}`);
    const equals = token.indexOf("=");
    const name = equals < 0 ? token.slice(2) : token.slice(2, equals);
    const value = equals < 0 ? rest[++index] : token.slice(equals + 1);
    if (value === undefined || value === "") throw usageError(`missing value for --${name}`);
    if (name === "root") values.root = value;
    else if (name === "domain") values.domains.push(value);
    else if (name === "exclude") values.excludes.push(value);
    else throw usageError(`unknown option: --${name}`);
  }
  return values;
}

export function realEntry(argv1 = process.argv[1], moduleUrl = import.meta.url) {
  if (!argv1) return false;
  try {
    return realpathSync(argv1) === realpathSync(fileURLToPath(moduleUrl));
  } catch {
    return null;
  }
}

export async function runCli(argv) {
  let values;
  try {
    values = parseArgs(argv);
  } catch (error) {
    process.stdout.write(`USAGE ${error.message}\n${USAGE}\n`);
    return EXIT.USAGE;
  }
  if (values.subcommand === "init") return initCommand(values);
  if (values.subcommand === "check") return checkCommand(values);
  return lookupCommand(values);
}

function resolveRoot(value) {
  if (typeof value !== "string" || !value) throw usageError("--root <dir> is required");
  let real;
  try {
    real = realpathSync(value);
  } catch {
    throw usageError(`--root is not a directory: ${value}`);
  }
  if (!statSync(real).isDirectory()) throw usageError(`--root is not a directory: ${value}`);
  return real;
}

function resolveDomain(root, domain) {
  if (typeof domain !== "string" || !DOMAIN_PATTERN.test(domain) || domain.includes("..") || domain === ".") {
    throw usageError(`invalid --domain: ${domain}`);
  }
  const specsRoot = join(root, "specs");
  const dir = resolve(specsRoot, domain);
  if (dir !== join(specsRoot, domain) || !(dir === specsRoot || dir.startsWith(`${specsRoot}${sep}`))) {
    throw usageError(`invalid --domain: ${domain}`);
  }
  return { domain, dir, tableRel: `specs/${domain}/README.md` };
}

function hasTableHeader(text) {
  let fence = null;
  for (const line of String(text).split(/\r?\n/)) {
    const trimmed = line.trim();
    const marker = trimmed.match(/^(```+|~~~+)/);
    if (marker) {
      if (fence === null) fence = marker[1][0];
      else if (marker[1][0] === fence) fence = null;
      continue;
    }
    if (fence === null && trimmed === TABLE_HEADER) return true;
  }
  return false;
}

function buildTableSkeleton(domain) {
  return [
    `# ${domain} 规范`,
    "",
    `本文件是 ${domain} 域的规则表：一条规则一行，正文在同表「正文锚点」指向处；本文件不写规则正文。`,
    "",
    TABLE_HEADER,
    SEPARATOR,
    "",
  ].join("\n");
}

function appendTableSection(domain, current) {
  const lead = current.endsWith("\n") ? "" : "\n";
  return `${current}${lead}\n## 规则表\n\n${TABLE_HEADER}\n${SEPARATOR}\n`;
}

function readHint(domain) {
  return READ_HINTS[domain] ?? `动 ${domain} 相关产出前`;
}

function agentsRow({ domain, tableRel }) {
  return `| ${domain} | [${tableRel}](${tableRel}) | ${readHint(domain)} |`;
}

// 列形取阶段卡 §2 与设计 §2 的逐字骨架（域｜规则表｜什么时候读）；本仓 P6 的四列索引不在 P1 写集。
function buildAgentsSkeleton(domains) {
  return [
    "# AGENTS.md",
    "",
    BEGIN_MARKER,
    "## 项目规范入口",
    "",
    "| 域 | 规则表 | 什么时候读 |",
    "| --- | --- | --- |",
    ...domains.map(agentsRow),
    END_MARKER,
    "",
  ].join("\n");
}

function agentsLinksTable(text, tableRel) {
  const wanted = String(tableRel).replace(/^\.\//, "");
  for (const match of String(text).matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].trim().replace(/^<|>$/g, "").replace(/^\.\//, "");
    if (target === wanted) return true;
  }
  return false;
}

async function upsertAgentsPointer(root, domains) {
  const rel = "AGENTS.md";
  const path = join(root, rel);
  if (!existsSync(path)) {
    await createFileOnce(root, rel, buildAgentsSkeleton(domains));
    return true;
  }
  const current = readFileSync(path, "utf8");
  if (!current.includes(BEGIN_MARKER)) {
    const missing = domains.filter(({ tableRel }) => !agentsLinksTable(current, tableRel));
    if (!missing.length) return false;
    const suffix = [
      BEGIN_MARKER,
      "## 项目规范入口",
      "",
      "| 域 | 规则表 | 什么时候读 |",
      "| --- | --- | --- |",
      ...missing.map(agentsRow),
      END_MARKER,
      "",
    ].join("\n");
    const lead = current.endsWith("\n") ? "\n" : "\n\n";
    await writeFileAtomic(root, rel, `${current}${lead}${suffix}`);
    return true;
  }
  const endIndex = current.indexOf(END_MARKER);
  if (endIndex < 0) {
    throw Object.assign(new Error("AGENTS 标记段缺少结束标记"), { code: "AGENTS_MARKER_INVALID", path });
  }
  const missing = domains.filter(({ tableRel }) => !agentsLinksTable(current, tableRel));
  if (!missing.length) return false;
  const rows = `${missing.map(agentsRow).join("\n")}\n`;
  const insertAt = endIndex;
  const before = current.slice(0, insertAt);
  const lead = before.endsWith("\n") ? "" : "\n";
  await writeFileAtomic(root, rel, `${before}${lead}${rows}${current.slice(insertAt)}`);
  return true;
}

async function initCommand(values) {
  let root, domains;
  try {
    root = resolveRoot(values.root);
    if (!values.domains.length) throw usageError("init requires --domain <name>");
    domains = values.domains.map((domain) => resolveDomain(root, domain));
  } catch (error) {
    process.stdout.write(`USAGE ${error.message}\n${USAGE}\n`);
    return EXIT.USAGE;
  }
  try {
    const changed = await withLock(root, "norm-sync", async () => {
      const written = [];
      for (const target of domains) {
        mkdirSync(target.dir, { recursive: true });
        const path = join(root, target.tableRel);
        if (existsSync(path)) {
          const current = readFileSync(path, "utf8");
          if (!hasTableHeader(current)) {
            await writeFileAtomic(root, target.tableRel, appendTableSection(target.domain, current));
            written.push(target.tableRel);
          }
        } else {
          await createFileOnce(root, target.tableRel, buildTableSkeleton(target.domain));
          written.push(target.tableRel);
        }
      }
      if (await upsertAgentsPointer(root, domains)) written.push("AGENTS.md");
      return written;
    });
    if (changed.length) process.stdout.write(`ESTABLISHED ${changed.join(" ")}\n`);
    else process.stdout.write("ALREADY ESTABLISHED\n");
    return EXIT.PASS;
  } catch (error) {
    const path = error.path ?? root;
    process.stdout.write(`INIT FAILED ${path}: ${error.code ?? error.message}\n`);
    return EXIT.USAGE;
  }
}



function normalizeExclude(value) {
  let text = String(value).replace(/[\\/]+/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
  if (text === "." || text === "") throw usageError(`invalid --exclude: ${value}`);
  if (isAbsolute(value) || text.split("/").includes("..")) throw usageError(`invalid --exclude: ${value}`);
  return text;
}

function isExcluded(rel, excludes) {
  return excludes.some((ex) => rel === ex || rel.startsWith(`${ex}/`));
}

function listMarkdown(root, excludes) {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue;
      const abs = join(dir, entry.name);
      const rel = relative(root, abs).split(sep).join("/");
      if (isExcluded(rel, excludes)) continue;
      if (entry.isDirectory()) walk(abs);
      else if (entry.isFile() && /\.md$/i.test(entry.name)) found.push(rel);
    }
  };
  walk(root);
  return found.sort();
}

function tableHeaderLineIndex(text) {
  const lines = String(text).split(/\r?\n/);
  let fence = null;
  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    const marker = trimmed.match(/^(```+|~~~+)/);
    if (marker) {
      if (fence === null) fence = marker[1][0];
      else if (marker[1][0] === fence) fence = null;
      continue;
    }
    if (fence === null && trimmed === TABLE_HEADER) return index;
  }
  return -1;
}

function tableFiles(root, files) {
  const tables = [];
  for (const rel of files) {
    const text = readFileSync(join(root, rel), "utf8");
    if (tableHeaderLineIndex(text) >= 0) tables.push({ rel, text });
  }
  return tables;
}

function parseTableRows(text) {
  const lines = String(text).split(/\r?\n/);
  const rows = [];
  let index = tableHeaderLineIndex(text);
  if (index < 0) return rows;
  index += 1;
  let fence = null;
  for (; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    const marker = trimmed.match(/^(```+|~~~+)/);
    if (marker) {
      if (fence === null) fence = marker[1][0];
      else if (marker[1][0] === fence) fence = null;
      continue;
    }
    if (fence !== null) continue;
    if (!trimmed.startsWith("|")) break;
    if (/^\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(trimmed)) continue;
    const cells = trimmed.replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
    if (cells.length !== 5) continue;
    rows.push({ cells, line: index + 1 });
  }
  return rows;
}

function collectTables(root, excludes) {
  const files = listMarkdown(root, excludes);
  const tables = tableFiles(root, files);
  const rows = [];
  for (const table of tables) {
    for (const row of parseTableRows(table.text)) rows.push({ ...row, table: table.rel });
  }
  return { files, tables, rows };
}

function agentsDeclarations(root) {
  const path = join(root, "AGENTS.md");
  if (!existsSync(path)) return [];
  const text = readFileSync(path, "utf8");
  const declared = [];
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    let target = match[1].trim().replace(/^<|>$/g, "");
    if (!target || /^[a-z]+:/i.test(target) || target.startsWith("#") || target.includes("#")) continue;
    target = target.replace(/^\.\//, "");
    if (!target.startsWith("specs/")) continue;
    if (!declared.includes(target)) declared.push(target);
  }
  return declared;
}

function structuralFindings(root, tables, rows, declared) {
  const findings = [];
  const tablePaths = new Set(tables.map((table) => table.rel));
  const registeredPaths = new Set();
  for (const row of rows) {
    const hash = row.cells[1].lastIndexOf("#");
    if (hash > 0) registeredPaths.add(row.cells[1].slice(0, hash));
  }
  for (const table of tables) {
    if (!/^specs\/[^/]+\//.test(table.rel)) {
      findings.push({ code: "RULE_TABLE_MISPLACED", file: table.rel,
        message: "五列表必须放 specs/<域>/ 下，不能放这里" });
    }
  }
  for (const rel of declared) {
    if (!existsSync(join(root, rel))) {
      findings.push({ code: "INDEX_DANGLING", file: rel, message: "AGENTS.md 链接的文件不存在" });
    } else if (tablePaths.has(rel) || registeredPaths.has(rel)) {
      continue;
    } else {
      findings.push({ code: "TABLE_INVALID", file: rel,
        message: "AGENTS 链接的规范文件既不是规则表，也不是已登记行的正文" });
    }
  }
  const declaredSet = new Set(declared);
  for (const table of tables) {
    if (!/^specs\/[^/]+\//.test(table.rel)) continue;
    if (!declaredSet.has(table.rel)) {
      findings.push({ code: "INDEX_UNLINKED", file: table.rel, message: "AGENTS.md 没有链接它" });
    }
  }
  return findings;
}

async function checkCommand(values) {
  let root, excludes;
  try {
    root = resolveRoot(values.root);
    excludes = [...DEFAULT_EXCLUDES, ...values.excludes.map(normalizeExclude)];
    for (const domain of values.domains) resolveDomain(root, domain);
    if (values.domains.length) throw usageError("check does not accept --domain");
  } catch (error) {
    process.stdout.write(`USAGE ${error.message}\n${USAGE}\n`);
    return EXIT.USAGE;
  }
  const declared = agentsDeclarations(root);
  for (const exclude of values.excludes) {
    const covered = declared.find((rel) => rel === exclude || rel.startsWith(`${exclude}/`));
    if (covered) {
      process.stdout.write(`USAGE --exclude covers declared table ${covered}\n${USAGE}\n`);
      return EXIT.USAGE;
    }
  }
  for (const exclude of excludes) process.stdout.write(`EXCLUDE ${exclude}\n`);
  const { files, tables, rows } = collectTables(root, excludes);
  if (values.excludes.length && files.length === 0) {
    process.stdout.write("NO_SCAN_SCOPE: --exclude removed every .md file\n");
    return EXIT.USAGE;
  }
  if (!tables.length && !declared.length) {
    process.stdout.write("NOT ESTABLISHED: zero rule tables\n");
    return EXIT.NO_TABLE;
  }
  const tablePaths = new Set(tables.map((table) => table.rel));
  const rules = locatedRows(rows);
  const findings = [
    ...structuralFindings(root, tables, rows, declared),
    ...rowFindings(root, rules),
    ...bodyFindings(root, rules, tablePaths, excludes),
  ];
  for (const finding of findings) {
    process.stdout.write(`${finding.code} ${finding.file}${finding.line ? `:${finding.line}` : ""} — ${finding.message}\n`);
    if (finding.secondHome) process.stdout.write(`second_home: ${finding.secondHome}\n`);
  }
  process.stdout.write("LIMIT 判重阈值 24 字窗口、步长 8、覆盖率 ≥0.6（来源 design-p1-v4 §6.2；不对本次 --root 宣称全仓误报上限）\n");
  if (root === PACKAGE_ROOT) {
    process.stdout.write("MEASURED 本仓 2026-11-25 历史语料：全量 2.0%（4,860 个标题区段）；按本仓排除后 0.9%（2,642 个标题区段）；仅本仓读数，非本次运行计算\n");
  }
  const violations = findings.filter((finding) => !finding.echo);
  if (violations.length) {
    process.stdout.write(`FAIL ${violations.length} violation(s)\n`);
    return EXIT.VIOLATION;
  }
  process.stdout.write(`PASS tables=${tables.length} rules=${locatedRows(rows).length}\n`);
  return EXIT.PASS;
}

async function lookupCommand(values) {
  let root, domain;
  try {
    root = resolveRoot(values.root);
    if (values.domains.length !== 1) throw usageError("lookup requires exactly one --domain <name>");
    domain = resolveDomain(root, values.domains[0]);
  } catch (error) {
    process.stdout.write(`USAGE ${error.message}\n${USAGE}\n`);
    return EXIT.USAGE;
  }
  const files = listMarkdown(root, DEFAULT_EXCLUDES).filter((rel) => rel.startsWith(`specs/${domain.domain}/`));
  const tables = tableFiles(root, files);
  const rows = tables.flatMap((table) => parseTableRows(table.text));
  if (!tables.length) {
    process.stdout.write(`rows=0 domain=${domain.domain} table=absent\n`);
    return EXIT.NO_TABLE;
  }
  if (!rows.length) {
    process.stdout.write(`rows=0 domain=${domain.domain} no_registered_rule\n`);
    return EXIT.NO_RULE;
  }
  process.stdout.write(`rows=${rows.length} domain=${domain.domain}\n`);
  for (const row of rows) {
    const [rule, anchor, , status] = row.cells;
    process.stdout.write(`- ${rule} | ${anchor} | ${status}\n`);
  }
  return EXIT.PASS;
}

const WINDOW = 24;
const STEP = 8;
const DUPLICATE_COVERAGE = 0.6;
const ECHO_COVERAGE = 0.4;
const RULE_WORDS = /必须|禁止|不得|不能|不可|严禁|应当|应|只能|只允许|不允许|一律|must|shall|never/iu;

export function anchorTitles(text) {
  const lines = String(text).split(/\r?\n/);
  const titles = [];
  let fence = null;
  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    const marker = trimmed.match(/^(```+|~~~+)/);
    if (marker) {
      if (fence === null) fence = marker[1][0];
      else if (marker[1][0] === fence) fence = null;
      continue;
    }
    if (fence !== null) continue;
    const atx = trimmed.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (atx) {
      titles.push({ level: atx[1].length, title: atx[2].trim(), line: index + 1, bodyStart: index + 1 });
      continue;
    }
    if (trimmed === "" || trimmed.startsWith("|") || index + 1 >= lines.length) continue;
    const underline = lines[index + 1].trim();
    if (/^=+$/.test(underline)) {
      titles.push({ level: 1, title: trimmed, line: index + 1, bodyStart: index + 2 });
      index += 1;
    } else if (/^-+$/.test(underline)) {
      titles.push({ level: 2, title: trimmed, line: index + 1, bodyStart: index + 2 });
      index += 1;
    }
  }
  return titles;
}

export function sectionBody(text, title) {
  const lines = String(text).split(/\r?\n/);
  let end = lines.length;
  for (const candidate of anchorTitles(text)) {
    if (candidate.line <= title.line) continue;
    if (candidate.level <= title.level) { end = Math.min(end, candidate.line - 1); break; }
  }
  return lines.slice(title.bodyStart, end).join("\n");
}

function normalizeBody(text) {
  return String(text).replace(/\s+/g, "");
}

function windowShingles(normalized) {
  const shingles = [];
  for (let start = 0; start + WINDOW <= normalized.length; start += STEP) {
    shingles.push(normalized.slice(start, start + WINDOW));
  }
  return shingles;
}

function coverage(source, target) {
  const sourceWindows = windowShingles(source);
  if (!sourceWindows.length) return 0;
  const hit = sourceWindows.filter((window) => target.includes(window)).length;
  return hit / sourceWindows.length;
}

function readableCoverage(value) {
  return Number(value).toFixed(2);
}

function bodyRegions(text) {
  const lines = String(text).split(/\r?\n/);
  const titles = anchorTitles(text);
  const regions = [];
  const firstHeadingLine = titles.length ? titles[0].line : lines.length + 1;
  regions.push({ line: 1, body: lines.slice(0, firstHeadingLine - 1).join("\n") });
  for (const title of titles) regions.push({ line: title.line, body: sectionBody(text, title) });
  return regions;
}

function resolveAnchor(root, anchor) {
  const hash = anchor.lastIndexOf("#");
  if (hash <= 0 || hash === anchor.length - 1) return { error: "ANCHOR_FORMAT" };
  const path = anchor.slice(0, hash);
  const slug = anchor.slice(hash + 1);
  if (isAbsolute(path) || path.split("/").includes("..") || path.startsWith("../")) {
    return { error: "ANCHOR_PATH" };
  }
  const absolute = resolve(root, path);
  if (!(absolute === root || absolute.startsWith(`${root}${sep}`)) || !existsSync(absolute)) {
    return { error: "ANCHOR_PATH" };
  }
  const text = readFileSync(absolute, "utf8");
  const titles = anchorTitles(text);
  const matches = titles.filter((title) => deriveSlug(title.title) === slug.replace(/-+/g, "-"));
  if (matches.length !== 1) return { error: "ANCHOR_AMBIGUOUS", matches: matches.length, path };
  return { path, text, title: matches[0], slug };
}

function bodyFindings(root, rows, tablePaths, excludes) {
  const findings = [];
  const candidates = [];
  for (const rel of listMarkdown(root, excludes)) {
    if (tablePaths.has(rel)) continue;
    const text = readFileSync(join(root, rel), "utf8");
    for (const region of bodyRegions(text)) {
      const normalized = normalizeBody(region.body);
      if (normalized) candidates.push({ rel, line: region.line, normalized });
    }
  }
  for (const row of rows) {
    const rule = row.cells[0];
    const anchor = row.cells[1];
    const resolved = resolveAnchor(root, anchor);
    if (resolved.error) continue;
    const source = normalizeBody(sectionBody(resolved.text, resolved.title));
    if (source.length < 8) {
      findings.push({ code: "BODY_TOO_SHORT", file: row.table, line: row.line,
        message: `「${rule}」正文不足 8 字，无法判第二处` });
      continue;
    }
    const ruleLikeSource = RULE_WORDS.test(source);
    for (const candidate of candidates) {
      if (candidate.rel === resolved.path && candidate.line === resolved.title.line) continue;
      // 逐字/归一化整段相等：与规则语气无关，任何 ≥8 字正文都必须抓到。
      if (candidate.normalized === source) {
        findings.push({ code: "BODY_DUPLICATE", file: candidate.rel, line: candidate.line,
          message: `「${rule}」正文归一化后整段相等，出现在本规则锚点 ${anchor} 之外`,
          secondHome: `${candidate.rel}:${candidate.line} — ${rule}` });
        continue;
      }
      if (source.length < WINDOW) continue; // 短正文只判整段相等
      if (!ruleLikeSource && !RULE_WORDS.test(candidate.normalized)
        && !candidate.normalized.startsWith("|") && !candidate.normalized.startsWith("-")) continue;
      const value = coverage(source, candidate.normalized);
      if (value >= DUPLICATE_COVERAGE) {
        findings.push({ code: "BODY_DUPLICATE", file: candidate.rel, line: candidate.line,
          message: `「${rule}」正文覆盖率 ${readableCoverage(value)} 出现在本规则锚点 ${anchor} 之外`,
          secondHome: `${candidate.rel}:${candidate.line} — ${rule}` });
      } else if (value >= ECHO_COVERAGE) {
        findings.push({ code: "BODY_ECHO", file: candidate.rel, line: candidate.line, echo: true,
          message: `「${rule}」疑似回声 coverage=${readableCoverage(value)}（提示，不计违规）` });
      }
    }
  }
  return findings;
}


const STATUSES = new Set(["已强制", "待落", "已退"]);

function rowFindings(root, rows) {
  const findings = [];
  const seenRules = new Map();
  const seenAnchors = new Map();
  for (const row of rows) {
    const [rule, anchor, force, status] = row.cells;
    const where = `${row.table}:${row.line}`;
    if (!rule) findings.push({ code: "RULE_EMPTY", file: row.table, line: row.line, message: "规则列为空" });
    else {
      if ([...rule].length > 40) findings.push({ code: "RULE_TOO_LONG", file: row.table, line: row.line, message: `规则超过 40 字（${[...rule].length} 字）` });
      if (seenRules.has(rule)) findings.push({ code: "RULE_DUPLICATE", file: row.table, line: row.line, message: `同一规则句已在 ${seenRules.get(rule)} 登记` });
      else seenRules.set(rule, where);
    }
    if (!force) findings.push({ code: "FORCE_EMPTY", file: row.table, line: row.line, message: "靠什么强制为空" });
    if (!STATUSES.has(status)) findings.push({ code: "STATUS_INVALID", file: row.table, line: row.line, message: `状态不在已强制/待落/已退：${status || "空"}` });
    if (!anchor) {
      findings.push({ code: "ANCHOR_FORMAT", file: row.table, line: row.line, message: "正文锚点为空" });
      continue;
    }
    if (seenAnchors.has(anchor)) findings.push({ code: "ANCHOR_DUPLICATE", file: row.table, line: row.line, message: `同一锚点已被 ${seenAnchors.get(anchor)} 登记` });
    else seenAnchors.set(anchor, where);
    const resolved = resolveAnchor(root, anchor);
    if (resolved.error === "ANCHOR_AMBIGUOUS") {
      findings.push({ code: "ANCHOR_AMBIGUOUS", file: row.table, line: row.line, message: `${anchor} 在 ${resolved.path} 命中 ${resolved.matches} 个标题` });
    } else if (resolved.error) {
      findings.push({ code: resolved.error, file: row.table, line: row.line,
        message: resolved.error === "ANCHOR_FORMAT" ? `锚点不是「项目根相对路径#slug」：${anchor}` : `锚点路径不存在或越出项目根：${anchor}` });
    }
  }
  return findings;
}

function locatedRows(rows) {
  return rows.filter((row) => /^specs\/[^/]+\//.test(row.table));
}

const entryDisposition = realEntry();
if (entryDisposition === true) {
  runCli(process.argv.slice(2)).then(
    (code) => { process.exitCode = code; },
    (error) => {
      process.stdout.write(`ERROR ${error.code ?? ""} ${error.message}\n`.replace(/\s+/g, " ").trim() + "\n");
      process.exitCode = EXIT.USAGE;
    },
  );
} else if (entryDisposition === null) {
  process.stdout.write(`ENTRY FAILED cannot resolve process.argv[1]: ${process.argv[1] ?? "missing"}\n${USAGE}\n`);
  process.exitCode = EXIT.USAGE;
}
