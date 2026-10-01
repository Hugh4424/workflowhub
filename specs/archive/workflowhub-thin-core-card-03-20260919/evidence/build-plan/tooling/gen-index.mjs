// 从各 Phase 头部生成纯指针 phases/index.md，保证写集/依赖/消费者与 Phase 头部逐字一致。
// 用法：node /tmp/card03-bp/gen-index.mjs <spec-dir>
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const specDir = process.argv[2];
if (!specDir) throw new Error("usage: gen-index.mjs <spec-dir>");
const phasesDir = join(specDir, "phases");
const files = readdirSync(phasesDir)
  .filter((f) => /^P\d+\.md$/.test(f))
  .sort((a, b) => Number(a.slice(1, -3)) - Number(b.slice(1, -3)));

// 取头部字段的第一处匹配（与校验器"首个匹配生效"一致）
function field(text, name) {
  const m = text.match(new RegExp(`^- \\*\\*${name}\\*\\*：(.*)$`, "m"));
  if (!m) throw new Error(`missing header field ${name}`);
  return m[1].trim();
}

const rows = files.map((f) => {
  const id = f.slice(0, -3);
  const text = readFileSync(join(phasesDir, f), "utf8");
  const dep = field(text, "Dependency");
  const depCell = dep === "none" ? "`none`" : `\`${dep}\``;
  return `| \`${id}\` | \`phases/${f}\` | \`phase-${id.toLowerCase()}\` | ${field(text, "Write set")} | ${depCell} | ${field(text, "Consumer")} |`;
});

// 并行工作包声明：逐 Phase 从头部取原文，不在本索引改写或归纳
const parallel = files.map((f) => {
  const text = readFileSync(join(phasesDir, f), "utf8");
  return `- \`${f.slice(0, -3)}\`：${field(text, "Parallel work packages")}`;
});

const out = `# Phase index — workflowhub-thin-core-card-03-20260919

> 纯指针索引。工程正文、命令、oracle、执行状态只在对应独立 Phase 文件；本索引不复制。

## Execution Index

| phase | authority ref | semantic anchor | write set | dependency | consumer |
| --- | --- | --- | --- | --- | --- |
${rows.join("\n")}

## 并行工作包声明

各 Phase 的并行工作包上限、并行卡、read set、逐文件 owner、接口符号、合并责任与工作树隔离，以下逐字取自对应 Phase 头部（本索引不复制、不改写）：

${parallel.join("\n")}

## 读取规则

- 按 authority ref 打开当前 Phase 原件；先读全局 \`spec.md\`，再读该 Phase 的 L0/L1，L2 仅是可删除的参考。
- index 与 Phase header 的写集、依赖、消费者不一致时停止声明完成；缺件、额外文件或不连续编号不得由旧 plan/tasks 代偿。
- P1、P2、P3 互不依赖，可并行；P4 在 P2 之后；P5 在 P2、P3 之后；P6 在 P1～P5 全部完成后运行。

## 历史边界

- pre cohort 和 \`specs/archive/**\` 的旧四材料只读保留，不成为 post writer 或事实源。
`;
writeFileSync(join(phasesDir, "index.md"), out);
console.log(`wrote index with ${rows.length} rows`);
