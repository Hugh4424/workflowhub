#!/usr/bin/env node
// 新增行失败掩码检查器：只扫 phase_progress.base_head 之后的新增行，
// 报告新增的空 catch 与 catch 体只返回空值；机器只报候选，处置由人写。
// 设计原件：任务库 quality/evidence/build-plan/design-p2.md（sha256 893c8af1…）。
// 基线唯一权威是 facts.jsonl 里 build-code stage 行的 phase_progress.base_head；
// 不回落卡上 HEAD、任务起点或当前 HEAD。
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readTaskFacts } from "../../runtime/task/task-store.mjs";

export const EXIT = Object.freeze({ PASS: 0, CANDIDATE: 1, INPUT: 2 });

const GIT_OID = /^[a-f0-9]{40,64}$/;
const CODE_EXTENSION = /\.(mjs|js|cjs|mts|cts|ts|jsx|tsx)$/;
const SKIP_SEGMENTS = new Set([
  "node_modules", ".git", "tests", "test", "__tests__", "fixtures", "docs", "specs", "quality", "graphify-out",
]);
// 整段只有 return 且值为空字面量或裸 return 才算命中；body 里还有别的语句不报。
const RETURN_MASK = /^return\s*(?:null|false|undefined|void\s+0|\[\]|\{\}|0|""|''|``)?\s*;?$/;
const CATCH_START = /\bcatch\s*(?:\([^)]*\))?\s*\{/g;
const USAGE = [
  "USAGE: check-added-failure-masks.mjs --base <commit> --task-path <任务根> [--phase P<N>] [--strict] [<path>...]",
  "       check-added-failure-masks.mjs --self-test",
  "门命令：--base 必须等于 phase_progress.base_head；--strict 有候选退 1，默认退 0；输入错一律退 2。",
];

class InputError extends Error {
  constructor(message) {
    super(message);
    this.name = "InputError";
  }
}

function inputError(message) {
  return new InputError(message);
}

function lineAt(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) if (text[i] === "\n") line += 1;
  return line;
}

// 正则字面量判定：只做“上一个有效记号”启发式，不写完整解析器。
// 关键用途是别让正则里的引号/反引号把后续代码吞成字符串（那会漏报真实候选）。
const REGEX_PREFIX_CHARS = new Set(["(", ",", "=", ":", "[", "!", "&", "|", "?", "{", "}", ";", "+", "-", "*", "%", "<", ">", "~", "^"]);
const REGEX_PREFIX_KEYWORDS = /(?:^|[^\w$])(?:return|typeof|case|delete|void|instanceof|in|of|yield|await|throw|else|do)$/;

function startsRegex(text, index) {
  let at = index - 1;
  while (at >= 0 && /\s/.test(text[at])) at -= 1;
  if (at < 0) return true;
  if (REGEX_PREFIX_CHARS.has(text[at])) return true;
  const before = text.slice(Math.max(0, at - 16), at + 1);
  return REGEX_PREFIX_KEYWORDS.test(before);
}

// 同长度掩码：字符串、模板串、行注释与块注释的内容换成空格，保留换行。
// 同时留下注释原文与起点，供豁免判定；正则字面量只跳过不掩码（已知误报面）。
export function maskSource(text) {
  const out = text.split("");
  const comments = [];
  const length = text.length;
  const blank = (index) => { if (out[index] !== "\n") out[index] = " "; };
  let index = 0;
  while (index < length) {
    const char = text[index];
    const next = text[index + 1];
    if (char === "/" && next === "/") {
      const start = index;
      blank(index); blank(index + 1);
      index += 2;
      while (index < length && text[index] !== "\n") { blank(index); index += 1; }
      comments.push({ start, end: index, text: text.slice(start + 2, index) });
      continue;
    }
    if (char === "/" && next === "*") {
      const start = index;
      blank(index); blank(index + 1);
      index += 2;
      while (index < length && !(text[index] === "*" && text[index + 1] === "/")) { blank(index); index += 1; }
      if (index < length) { blank(index); blank(index + 1); index += 2; }
      comments.push({ start, end: index, text: text.slice(start + 2, Math.max(start + 2, index - 2)) });
      continue;
    }
    if (char === "/" && startsRegex(text, index)) {
      // 跳过整个正则字面量的写法，避免 /["']/ 里的引号把后续代码吞成字符串；
      // 内容保持原样，沿用设计稿「正则不单独解析」的已知误报面。
      let scan = index + 1;
      let inClass = false;
      while (scan < length) {
        const current = text[scan];
        if (current === "\\") { scan += 2; continue; }
        if (current === "[") inClass = true;
        else if (current === "]") inClass = false;
        else if (current === "/" && !inClass) { scan += 1; break; }
        else if (current === "\n") break;
        scan += 1;
      }
      index = scan;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      const quote = char;
      blank(index);
      index += 1;
      while (index < length) {
        if (text[index] === "\\") { blank(index); if (index + 1 < length) blank(index + 1); index += 2; continue; }
        if (text[index] === quote) { blank(index); index += 1; break; }
        blank(index);
        index += 1;
      }
      continue;
    }
    index += 1;
  }
  return { masked: out.join(""), comments };
}

// 在掩码上找 catch 关键字与配平的花括号区域；配不平的区域交给调用方告警，不静默跳过。
export function findCatchRegions(masked, onUnbalanced) {
  const regions = [];
  for (const match of masked.matchAll(CATCH_START)) {
    const open = match.index + match[0].length - 1;
    let depth = 0;
    let close = -1;
    for (let index = open; index < masked.length; index += 1) {
      if (masked[index] === "{") depth += 1;
      else if (masked[index] === "}") {
        depth -= 1;
        if (depth === 0) { close = index; break; }
      }
    }
    if (close < 0) {
      if (typeof onUnbalanced === "function") onUnbalanced(lineAt(masked, match.index));
      continue;
    }
    regions.push({
      catchStart: match.index,
      catchLine: lineAt(masked, match.index),
      open,
      close,
      endLine: lineAt(masked, close),
    });
  }
  return regions;
}

// 区域分类：EMPTY_CATCH 报 catch 行；RETURN_MASK 报 return 行。
// 区域任一行有非空注释即豁免，只加 exempt 计数。
export function classifyRegion(region, masked, comments) {
  const body = masked.slice(region.open + 1, region.close);
  let kind = null;
  let line = null;
  if (body.trim() === "") {
    kind = "EMPTY_CATCH";
    line = region.catchLine;
  } else {
    const returnIndex = masked.indexOf("return", region.open);
    if (returnIndex >= 0 && returnIndex < region.close && body.trim().match(RETURN_MASK)) {
      kind = "RETURN_MASK";
      line = lineAt(masked, returnIndex);
    }
  }
  if (kind === null) return { kind: null, exempt: false };
  const exempt = comments.some((comment) => {
    const commentLine = lineAt(masked, comment.start);
    return commentLine >= region.catchLine && commentLine <= region.endLine
      && comment.text.replace(/\s/g, "") !== "";
  });
  return { kind, line, catchLine: region.catchLine, exempt };
}

// 文件过滤：只看代码扩展名，任一路径段命中跳过集合即不扫。
export function shouldScan(path) {
  if (!CODE_EXTENSION.test(path)) return false;
  return !path.split("/").some((segment) => SKIP_SEGMENTS.has(segment));
}

// 单文件判定：区域行范围与新增行集合有交集才算候选；判定行不在新增集合时退回交集最小行。
// 豁免只在区域与新增行有交集时计数，避免把历史注释读成「新增豁免」。
export function scanText({ path, text, addedLines, onUnbalanced }) {
  const { masked, comments } = maskSource(text);
  const regions = findCatchRegions(masked, onUnbalanced);
  const lines = text.split("\n");
  const candidates = [];
  let exempt = 0;
  for (const region of regions) {
    const result = classifyRegion(region, masked, comments);
    if (result.kind === null) continue;
    const hits = [];
    for (let line = region.catchLine; line <= region.endLine; line += 1) if (addedLines.has(line)) hits.push(line);
    if (!hits.length) continue;
    if (result.exempt) { exempt += 1; continue; }
    const line = addedLines.has(result.line) ? result.line : Math.min(...hits);
    candidates.push({
      path,
      line,
      kind: result.kind,
      catchLine: result.catchLine,
      text: (lines[line - 1] ?? "").trim(),
    });
  }
  return { candidates, exempt };
}

function git(root, args, { allowFailure = false } = {}) {
  // 64 MiB 不够 AC-P2-003 的「从根提交扫历史」负例（本仓该 diff 约 138 MB）；
  // 缓冲区只放大容量，不改变任何判定语义。
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (result.error) throw inputError(`git ${args[0]} failed: ${result.error.message}`);
  if (!allowFailure && result.status !== 0) {
    throw inputError(`git ${args.slice(0, 2).join(" ")} failed: ${(result.stderr || "").split("\n")[0] || "no stderr"}`);
  }
  return result;
}

// 新增行两步来源：已跟踪走 `git diff -U0` 的 hunk 状态机，未跟踪整文件计入。
export function parseAddedLines({ root, base }) {
  const diff = git(root, [
    "-c", "core.quotePath=false", "diff", "-U0", "--no-color", "--no-ext-diff", "--no-textconv",
    "--diff-filter=ACMR", base, "--",
  ]).stdout;
  const added = new Map();
  const add = (path, line, content) => {
    if (!added.has(path)) added.set(path, new Map());
    added.get(path).set(line, content);
  };
  let target = null;
  let oldRemaining = 0;
  let newRemaining = 0;
  let newLine = 0;
  for (const line of diff.split("\n")) {
    // 只有 hunk 计数归零时才认文件头；新增内容行本身可以以 "++ " 开头，
    // 若先按 "+++ " 判文件头，会把真新增行算进幽灵路径并整体漏报。
    if (oldRemaining > 0 || newRemaining > 0) {
      if (line.startsWith("\\")) continue;
      if (line.startsWith("+")) {
        if (target !== null) add(target, newLine, line.slice(1).replace(/\r$/, ""));
        newLine += 1;
        newRemaining -= 1;
        continue;
      }
      if (line.startsWith("-")) { oldRemaining -= 1; continue; }
      if (line.startsWith(" ")) { newLine += 1; newRemaining -= 1; oldRemaining -= 1; continue; }
      continue;
    }
    if (line.startsWith("diff --git ")) {
      target = null;
      continue;
    }
    if (line.startsWith("+++ ")) {
      const value = line.slice(4).replace(/^b\//, "");
      target = value === "/dev/null" ? null : value;
      continue;
    }
    const hunk = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (hunk) {
      oldRemaining = hunk[2] === undefined ? 1 : Number(hunk[2]);
      newLine = Number(hunk[3]);
      newRemaining = hunk[4] === undefined ? 1 : Number(hunk[4]);
      continue;
    }
  }
  for (const path of git(root, ["ls-files", "--others", "--exclude-standard", "-z"]).stdout.split("\0").filter(Boolean)) {
    let text;
    try { text = readFileSync(join(root, path), "utf8"); } catch (error) {
      throw inputError(`cannot read untracked file ${path}: ${error.message}`);
    }
    const lines = text.split("\n");
    if (lines.at(-1) === "") lines.pop();
    lines.forEach((content, index) => add(path, index + 1, content));
  }
  return added;
}

function matchesPathFilter(path, filters) {
  if (!filters.length) return true;
  return filters.some((filter) => path === filter || path.startsWith(`${filter.replace(/\/$/, "")}/`));
}

export function runScan({ root, base, paths = [] }) {
  const head = git(root, ["rev-parse", "--verify", "HEAD^{commit}"]).stdout.trim();
  const added = parseAddedLines({ root, base });
  let addedFiles = 0;
  let addedLines = 0;
  let skippedFiles = 0;
  let skippedHits = 0;
  let binary = 0;
  let exempt = 0;
  let unbalanced = 0;
  const candidates = [];
  const unbalancedWarnings = [];
  const onUnbalanced = (path, line) => {
    unbalanced += 1;
    unbalancedWarnings.push(`${path}:${line}`);
  };
  for (const [path, lineMap] of [...added.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (!matchesPathFilter(path, paths)) continue;
    addedFiles += 1;
    addedLines += lineMap.size;
    if (!shouldScan(path)) {
      if (CODE_EXTENSION.test(path)) {
        let text;
        try { text = readFileSync(join(root, path), "utf8"); } catch (error) {
          throw inputError(`cannot read ${path}: ${error.message}`);
        }
        if (!text.includes("\0")) {
          skippedHits += scanText({
            path, text, addedLines: lineMap, onUnbalanced: (line) => onUnbalanced(path, line),
          }).candidates.length;
        }
      }
      skippedFiles += 1;
      continue;
    }
    let text;
    try { text = readFileSync(join(root, path), "utf8"); } catch (error) {
      throw inputError(`cannot read ${path}: ${error.message}`);
    }
    if (text.includes("\0")) {
      binary += 1;
      process.stdout.write(`warning: binary file skipped: ${path}\n`);
      continue;
    }
    const result = scanText({
      path, text, addedLines: lineMap, onUnbalanced: (line) => onUnbalanced(path, line),
    });
    candidates.push(...result.candidates);
    exempt += result.exempt;
  }
  for (const where of unbalancedWarnings) process.stdout.write(`warning: unbalanced catch region at ${where}\n`);
  return { head, addedFiles, addedLines, skippedFiles, skippedHits, binary, exempt, unbalanced, candidates };
}

export function readPhaseBase(taskPath, phase) {
  let facts;
  try { facts = readTaskFacts(taskPath); } catch (error) {
    throw inputError(`cannot read task facts at ${taskPath}: ${error.message}`);
  }
  const row = facts.find((value) => value && value.record_kind === "stage" && value.stage === "build-code");
  const cursor = row?.phase_progress;
  if (!cursor || !/^P[1-9][0-9]*$/.test(cursor.phase_id ?? "") || !/^T[0-9]{3,}$/.test(cursor.task_id ?? "")
    || typeof cursor.base_head !== "string" || !GIT_OID.test(cursor.base_head)) {
    throw inputError("缺当前 Phase 匹配的 phase_progress.base_head：不用任务起点、卡上 HEAD 或当前 HEAD 冒充 Phase 起点; "
      + "先跑 run --action=execute --stage=build-code 写 cursor");
  }
  if (phase && cursor.phase_id !== phase) {
    throw inputError(`缺当前 Phase 匹配的 phase_progress.base_head：cursor 只含 ${cursor.phase_id}/${cursor.task_id}，不是 ${phase}; `
      + "不用任务起点、卡上 HEAD 或当前 HEAD 冒充 Phase 起点; 先跑 run --action=execute --stage=build-code 写 cursor");
  }
  return cursor;
}

function allLines(text) {
  const map = new Map();
  const lines = text.split("\n");
  if (lines.at(-1) === "") lines.pop();
  lines.forEach((value, index) => map.set(index + 1, value));
  return map;
}

function sample(path, text) {
  const scanned = shouldScan(path);
  const addedLines = allLines(text);
  const result = scanText({ path, text, addedLines });
  return {
    scanned,
    skippedFiles: scanned ? 0 : 1,
    skippedHits: scanned ? 0 : result.candidates.length,
    candidates: scanned ? result.candidates : [],
    exempt: result.exempt,
  };
}

// --self-test：内联样例，不读仓、不读 facts、不用样例以外的输入。
export function evaluateSelfTest() {
  const groups = [];
  const group = (name, checks) => groups.push({ name, checks });
  group("empty single-line catch", [
    () => expectHits(sample("a.mjs", "try { read(p); } catch {}"), 1, "EMPTY_CATCH"),
  ]);
  group("empty multi-line catch", [
    () => expectHits(sample("a.mjs", "try {\n  read(p);\n} catch {\n}"), 1, "EMPTY_CATCH"),
  ]);
  group("return null", [
    () => expectHits(sample("a.mjs", "try {\n  read(p);\n} catch (e) {\n  return null;\n}"), 1, "RETURN_MASK", 4, 3),
  ]);
  group("return false", [
    () => expectHits(sample("a.mjs", "try {\n  read(p);\n} catch (e) {\n  return false;\n}"), 1, "RETURN_MASK", 4, 3),
  ]);
  group("return undefined", [
    () => expectHits(sample("a.mjs", "try {\n  read(p);\n} catch (e) {\n  return undefined;\n}"), 1, "RETURN_MASK", 4, 3),
  ]);
  group("empty literals", [
    () => expectHits(sample("a.mjs", "try { read(p); } catch (e) { return []; }"), 1, "RETURN_MASK"),
    () => expectHits(sample("a.mjs", "try { read(p); } catch (e) { return {}; }"), 1, "RETURN_MASK"),
    () => expectHits(sample("a.mjs", "try { read(p); } catch (e) { return 0; }"), 1, "RETURN_MASK"),
    () => expectHits(sample("a.mjs", "try { read(p); } catch (e) { return \"\"; }"), 1, "RETURN_MASK"),
    () => expectHits(sample("a.mjs", "try { read(p); } catch (e) { return; }"), 1, "RETURN_MASK"),
  ]);
  group("multi-line body anchors catch", [
    () => expectHits(sample("a.mjs", "try {\n  read(p);\n} catch {\n  return null;\n}"), 1, "RETURN_MASK", 4, 3),
  ]);
  group("inline reason comment exempts", [
    () => expectNoCandidates(sample("a.mjs", "try { read(p); } catch { return null; } // 探测：目录不存在即视为无"), 1),
  ]);
  group("block reason comment exempts", [
    () => expectNoCandidates(sample("a.mjs", "try {\n  read(p);\n} catch {\n  // 探测：读不到即无\n  return null;\n}"), 1),
  ]);
  group("side effect is not a hit", [
    () => expectNoCandidates(sample("a.mjs", "try {\n  read(p);\n} catch (e) {\n  log(e); return null;\n}"), 0),
  ]);
  group("throw and fallback are not hits", [
    () => expectNoCandidates(sample("a.mjs", "try {\n  read(p);\n} catch (e) {\n  throw e;\n}"), 0),
    () => expectNoCandidates(sample("a.mjs", "try {\n  read(p);\n} catch {\n  return fallback(e);\n}"), 0),
  ]);
  group("tests path only counts skipped", [
    () => {
      const result = sample("tests/x.test.mjs", "try { read(p); } catch (e) { return null; }");
      if (result.candidates.length !== 0 || result.skippedFiles !== 1 || result.skippedHits !== 1) {
        throw new Error(`expected skipped_files=1 skipped_hits=1 candidates=0, got ${JSON.stringify({ candidates: result.candidates.length, skippedFiles: result.skippedFiles, skippedHits: result.skippedHits })}`);
      }
    },
  ]);
  group("docs and fixtures are skipped", [
    () => {
      const docs = sample("docs/x.mjs", "console.log(1);");
      const fixtures = sample("fixtures/x.mjs", "console.log(1);");
      if (docs.skippedFiles !== 1 || fixtures.skippedFiles !== 1 || docs.candidates.length || fixtures.candidates.length) {
        throw new Error(`expected 2 skipped files and 0 candidates, got ${JSON.stringify({ docs, fixtures })}`);
      }
    },
  ]);
  const rows = groups.map((entry, index) => {
    for (let at = 0; at < entry.checks.length; at += 1) {
      try { entry.checks[at](); } catch (error) {
        return { index: index + 1, name: entry.name, pass: false, detail: `input ${at + 1}: ${error.message}` };
      }
    }
    return { index: index + 1, name: entry.name, pass: true, detail: "" };
  });
  return { rows, passed: rows.filter((row) => row.pass).length, total: rows.length };
}

function expectHits(result, count, kind, line, catchLine) {
  const hits = result.candidates;
  if (hits.length !== count) throw new Error(`expected ${count} ${kind}, got ${hits.length}: ${JSON.stringify(hits)}`);
  if (count === 0) return;
  const hit = hits[0];
  if (hit.kind !== kind) throw new Error(`expected ${kind}, got ${hit.kind}`);
  if (line !== undefined && hit.line !== line) throw new Error(`expected line ${line}, got ${hit.line}`);
  if (catchLine !== undefined && hit.catchLine !== catchLine) throw new Error(`expected catch@${catchLine}, got catch@${hit.catchLine}`);
}

function expectNoCandidates(result, exempt) {
  if (result.candidates.length !== 0) throw new Error(`expected 0 candidates, got ${JSON.stringify(result.candidates)}`);
  if (exempt !== undefined && result.exempt !== exempt) throw new Error(`expected exempt ${exempt}, got ${result.exempt}`);
}

function parseArguments(argv) {
  const options = { selfTest: false, base: undefined, taskPath: undefined, phase: undefined, strict: false, paths: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--self-test") { options.selfTest = true; continue; }
    if (token === "--strict") { options.strict = true; continue; }
    if (token === "--base" || token === "--task-path" || token === "--phase") {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith("-")) throw inputError(`${token} requires a value`);
      index += 1;
      if (token === "--base") options.base = value;
      else if (token === "--task-path") options.taskPath = value;
      else options.phase = value;
      continue;
    }
    if (token.startsWith("-")) throw inputError(`unknown option: ${token}`);
    options.paths.push(token);
  }
  if (options.phase !== undefined && !/^P[1-9][0-9]*$/.test(options.phase)) throw inputError(`--phase must look like P<N>: ${options.phase}`);
  if (options.selfTest && (options.base !== undefined || options.taskPath !== undefined || options.phase !== undefined
    || options.strict || options.paths.length)) {
    throw inputError("--self-test cannot be combined with scan arguments");
  }
  return options;
}

function reportSelfTest() {
  const { rows, passed, total } = evaluateSelfTest();
  for (const row of rows) {
    if (row.pass) process.stdout.write(`self-test: PASS ${row.index} ${row.name}\n`);
    else process.stdout.write(`self-test: FAIL ${row.index} ${row.name}: ${row.detail}\n`);
  }
  process.stdout.write(`self-test: ${passed}/${total}\n`);
  return passed === total ? EXIT.PASS : EXIT.CANDIDATE;
}

function main(argv) {
  const options = parseArguments(argv);
  if (options.selfTest) return reportSelfTest();
  if (options.base === undefined) {
    process.stdout.write("check-added-failure-masks: --base <commit> is required (or pass --self-test)\n");
    process.stdout.write(`${USAGE.join("\n")}\n`);
    return EXIT.INPUT;
  }
  if (options.taskPath === undefined) {
    process.stdout.write("--task-path <任务根> is required: the Phase baseline is phase_progress.base_head, never the card HEAD\n");
    return EXIT.INPUT;
  }
  const cwd = process.cwd();
  const top = git(cwd, ["rev-parse", "--show-toplevel"], { allowFailure: true });
  if (top.status !== 0) throw inputError(`not a git worktree: ${(top.stderr || "").split("\n")[0] || "git rev-parse failed"}`);
  const root = top.stdout.trim();
  const cursor = readPhaseBase(options.taskPath, options.phase);
  const resolvedBase = git(root, ["rev-parse", "--verify", `${options.base}^{commit}`], { allowFailure: true });
  if (resolvedBase.status !== 0) {
    throw inputError(`--base ${options.base} is not a commit: ${(resolvedBase.stderr || "").split("\n")[0] || "git rev-parse failed"}`);
  }
  const base = resolvedBase.stdout.trim();
  if (base !== cursor.base_head) {
    throw inputError(`--base ${base} differs from phase_progress.base_head ${cursor.base_head} (phase ${cursor.phase_id}); `
      + "pass the cursor value, not the card HEAD");
  }
  const head = git(root, ["rev-parse", "--verify", "HEAD^{commit}"]).stdout.trim();
  if (git(root, ["merge-base", "--is-ancestor", base, head], { allowFailure: true }).status !== 0) {
    throw inputError(`--base ${base} is not an ancestor of HEAD ${head}`);
  }
  const result = runScan({ root, base, paths: options.paths });
  process.stdout.write(`check-added-failure-masks: base=${base} (phase_progress ${cursor.phase_id}) head=${result.head}\n`);
  process.stdout.write(`scan: added_files=${result.addedFiles} added_lines=${result.addedLines} skipped_files=${result.skippedFiles} skipped_hits=${result.skippedHits} binary=${result.binary} unbalanced_regions=${result.unbalanced}\n`);
  for (const candidate of result.candidates) {
    const anchor = candidate.line === candidate.catchLine ? "" : ` (catch@${candidate.catchLine})`;
    process.stdout.write(`candidate: ${candidate.path}:${candidate.line} [${candidate.kind}]${anchor} ${candidate.text}\n`);
  }
  if (result.exempt > 0) process.stdout.write(`exempt: ${result.exempt}\n`);
  process.stdout.write(`summary: candidates=${result.candidates.length} exempt=${result.exempt} skipped_files=${result.skippedFiles} skipped_hits=${result.skippedHits} (候选，待处置)\n`);
  if (result.candidates.length > 0) {
    if (options.strict) {
      process.stdout.write(`strict: ${result.candidates.length} candidate(s) without disposition → exit 1\n`);
      return EXIT.CANDIDATE;
    }
    process.stdout.write("note: exit 0 is not a pass; rerun with --strict for the gate\n");
  }
  return EXIT.PASS;
}

const entry = process.argv[1] ? resolve(process.argv[1]) : "";
if (entry === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    if (error instanceof InputError) {
      process.stdout.write(`check-added-failure-masks: ${error.message}\n`);
      process.exitCode = EXIT.INPUT;
    } else {
      process.stdout.write(`check-added-failure-masks: internal error: ${error?.stack ?? error}\n`);
      process.exitCode = EXIT.INPUT;
    }
  }
}
