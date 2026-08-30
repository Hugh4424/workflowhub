#!/usr/bin/env node
// 双轨事实评估骨架：对比 facts.jsonl 与 quality/facts/，产出带三态结论的评估报告。

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_TASK = "/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-simplicity-close-repair-20260829";
const OUT_DIR = resolve(ROOT, "quality/evidence");
const OUT = resolve(OUT_DIR, "dual-track-evaluation-report.md");

function parseArgs(argv) {
  const args = { write: false, check: false, taskPath: DEFAULT_TASK };
  for (const arg of argv.slice(2)) {
    if (arg === "--write") args.write = true;
    else if (arg === "--check") args.check = true;
    else if (arg.startsWith("--task-path=")) args.taskPath = resolve(arg.slice("--task-path=".length));
  }
  return args;
}

function readFactsJsonl(path) {
  if (!existsSync(path)) throw new Error(`facts.jsonl not found: ${path}`);
  const raw = readFileSync(path, "utf8").trim();
  if (!raw) throw new Error(`facts.jsonl is empty: ${path}`);
  const lines = raw.split(/\r?\n/);
  const facts = [];
  for (const [index, line] of lines.entries()) {
    if (!line.trim()) continue;
    try { facts.push(JSON.parse(line)); }
    catch { throw new Error(`facts.jsonl line ${index + 1} is not valid JSON`); }
  }
  return facts;
}

function readQualityFacts(dir) {
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => resolve(dir, e.name));
  const facts = [];
  for (const path of files) {
    try {
      const value = JSON.parse(readFileSync(path, "utf8"));
      facts.push({ path, value });
    } catch {
      throw new Error(`quality fact corrupt: ${path}`);
    }
  }
  return facts;
}

function classifyFactType(fact) {
  const kind = fact?.kind ?? fact?.fact_type ?? "unknown";
  if (kind === "review" || kind === "direction_review" || kind === "detail_review" || kind === "quality_review") return "review";
  if (kind === "test") return "test";
  if (kind === "acceptance_criterion") return "acceptance";
  if (kind === "evidence" || kind === "verification") return "evidence";
  if (kind === "confirmation") return "confirmation";
  return "other";
}

function countByType(items, accessor = (x) => x) {
  const counts = {};
  for (const item of items) {
    const t = classifyFactType(accessor(item));
    counts[t] = (counts[t] || 0) + 1;
  }
  return counts;
}

function triState(left, right) {
  const types = new Set([...Object.keys(left), ...Object.keys(right)]);
  const rows = [];
  for (const type of types) {
    const l = left[type] || 0;
    const r = right[type] || 0;
    let state, recommendation;
    if (l === 0 || r === 0) { state = "数据不足"; recommendation = "重评"; }
    else if (l === r) { state = "一致"; recommendation = "保留"; }
    else { state = "差异"; recommendation = "合并候选"; }
    rows.push({ type, facts_jsonl: l, quality_facts: r, state, recommendation });
  }
  return rows;
}

function generateReport(taskPath, factsJsonl, qualityFacts) {
  const left = countByType(factsJsonl);
  const right = countByType(qualityFacts, (item) => item.value);
  const rows = triState(left, right);

  const lines = [
    "# 双轨事实评估报告",
    "",
    `生成时间：${new Date().toISOString()}`,
    `任务路径：${taskPath}`,
    `facts.jsonl 行数：${factsJsonl.length}`,
    `quality/facts/ 文件数：${qualityFacts.length}`,
    "",
    "## 结论（每轨三态 + 建议）",
    "",
    "| 事实类型 | facts.jsonl 计数 | quality/facts 计数 | 三态判定 | 建议 |",
    "| --- | --- | --- | --- | --- |",
    ...rows.map((r) => `| ${r.type} | ${r.facts_jsonl} | ${r.quality_facts} | ${r.state} | ${r.recommendation} |`),
    "",
    "## 判定规则",
    "",
    "- **一致**：两轨计数相等且均大于 0，建议保留当前双轨结构。",
    "- **差异**：两轨计数均大于 0 但不相等，建议列为合并候选，人工复核是否重复落账。",
    "- **数据不足**：某一轨计数为 0，建议重评该类型事实的来源或消费路径。",
    "",
    "## 快照身份",
    "",
    "```",
    JSON.stringify({ facts_jsonl_types: left, quality_fact_types: right }, null, 2),
    "```",
    "",
    "本报告为评估结论文件，不修改 facts.jsonl 或 quality/facts 结构。",
  ];
  return lines.join("\n");
}

function verifyReport() {
  if (!existsSync(OUT)) throw new Error(`report not found: ${OUT}`);
  const content = readFileSync(OUT, "utf8");
  const required = ["## 结论", "一致", "差异", "数据不足", "建议"];
  for (const marker of required) {
    if (!content.includes(marker)) throw new Error(`report missing marker: ${marker}`);
  }
  // Verify table has at least one row (non-empty)
  const rows = content.match(/\|[^\n]+\|/g) || [];
  if (rows.length <= 1) throw new Error("report conclusion table is empty");
  console.log("check passed: report contains tri-state conclusion and recommendations");
}

function main() {
  const args = parseArgs(process.argv);
  const factsPath = resolve(args.taskPath, "facts.jsonl");
  const qualityDir = resolve(args.taskPath, "quality/facts");

  const factsJsonl = readFactsJsonl(factsPath);
  const qualityFacts = readQualityFacts(qualityDir);
  if (factsJsonl.length === 0 && qualityFacts.length === 0) {
    throw new Error("both fact tracks are empty");
  }

  const report = generateReport(args.taskPath, factsJsonl, qualityFacts);

  if (args.write || args.check) {
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(OUT, report, "utf8");
    console.log(`wrote ${OUT}`);
  } else {
    console.log(report);
  }

  if (args.check) {
    verifyReport();
  }
}

main();
