#!/usr/bin/env node
// 结构验收脚本：机器校验 M1 交付物是否满足验收（F9 可证伪——故意删一条宪法/漏一个 checklist 项会真报错）。
// 纳入 npm run check，与 markdownlint 一起构成"克隆后最小检查命令"。
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { githubAnchorSlug } from "./rule-tables.mjs";

const errors = [];
const fail = (m) => errors.push(m);
const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null);

const EXPECTED_ARTICLES = 22;
const DENYLIST = ["Wish","Dispatcher","harness","host","checkpoint","runtime","metering","observability","email-reply"];
const FIVE_STAGES = ["intake","design","plan","apply","test-acceptance"];
const FOUR_PARTS = ["定义","最佳实践解释","正例","反例"];

// ── AC-2: 宪法 22 条，每条四段非空 ──
const con = read("CONSTITUTION.md");
const slugSet = new Set();
if (!con) fail("CONSTITUTION.md 不存在");
else {
  const articleRe = /^### ([FQS]\d+ .+)$/gm;
  const titles = [...con.matchAll(articleRe)].map((m) => m[1]);
  if (titles.length !== EXPECTED_ARTICLES)
    fail(`宪法条目数=${titles.length}，应为 ${EXPECTED_ARTICLES}`);
  // 编号集合须严格等于 F1-F9 / Q1-Q3 / S1-S8（防未来同步误改编号仍绿）
  const EXPECTED_IDS = new Set([
    ...Array.from({length:11},(_,i)=>`F${i+1}`),
    ...Array.from({length:3},(_,i)=>`Q${i+1}`),
    ...Array.from({length:8},(_,i)=>`S${i+1}`),
  ]);
  const gotIds = new Set(titles.map((t)=>t.split(/\s/)[0]));
  for (const id of EXPECTED_IDS) if (!gotIds.has(id)) fail(`宪法缺编号 ${id}`);
  for (const id of gotIds) if (!EXPECTED_IDS.has(id)) fail(`宪法出现非预期编号 ${id}`);
  titles.forEach((t) => slugSet.add(githubAnchorSlug(t)));
  // split bodies
  const parts = con.split(/^### [FQS]\d+ .+$/m).slice(1);
  titles.forEach((t, i) => {
    const body = parts[i] || "";
    FOUR_PARTS.forEach((seg) => {
      const m = body.match(new RegExp("\\*\\*" + seg + "\\*\\*：(.+)"));
      if (!m || m[1].trim().length < 5) { fail(`宪法 [${t}] 缺/空 段「${seg}」`); return; }
      const PLACEHOLDER = /(待补充|待填|后续填写|后续补充|占位|placeholder|todo|tbd|xxx|……$|\.\.\.$)/i;
      if (PLACEHOLDER.test(m[1].trim())) fail(`宪法 [${t}] 段「${seg}」疑似占位文本：${m[1].trim().slice(0,20)}`);
    });
  });
}

// ── AC-3: checklist 22 条，每条锚点回指真实存在的宪法条款 ──
const chk = read("constitution-checklist.md");
if (!chk) fail("constitution-checklist.md 不存在");
else {
  // 按 checklist item 行逐条解析：每条恰好 1 个 CONSTITUTION.md 锚点，
  // 且该锚点 === 该条标题的 githubAnchorSlug（GitHub 精确规则：不合并连续连字符）（逐条身份绑定，防 F1↔F2 互链仍集合相等的假绿）
  // Only the primary 22-item checklist is identity-checked here. The close
  // interpretation section intentionally repeats four constitutional items
  // as explanatory bullets and must not be counted as additional bindings.
  const primaryChecklist = chk.split(/^## close 三义判据/m, 1)[0];
  const lines = primaryChecklist.split(/\r?\n/);
  const itemLines = lines.filter((l) => /^- \[[ x]\] \*\*[FQS]\d+ /.test(l));
  if (itemLines.length !== EXPECTED_ARTICLES)
    fail(`checklist 条目数=${itemLines.length}，应为 ${EXPECTED_ARTICLES}`);
  const boundSlugs = new Set();
  for (const line of itemLines) {
    const titleM = line.match(/\*\*([FQS]\d+ [^*]+?)\*\*/);
    const title = titleM ? titleM[1].trim() : null;
    const anchorsInLine = [...line.matchAll(/\]\(CONSTITUTION\.md#([^)]+)\)/g)].map((m) => m[1]);
    if (!title) { fail(`checklist 某条无法解析标题：${line.slice(0, 30)}`); continue; }
    if (anchorsInLine.length !== 1)
      fail(`checklist [${title}] 须恰好 1 个宪法锚点，实际 ${anchorsInLine.length} 个`);
    const want = githubAnchorSlug(title);
    if (anchorsInLine[0] !== want)
      fail(`checklist [${title}] 锚点应为 #${want}，实际 #${anchorsInLine[0]}（逐条对应错）`);
    if (!slugSet.has(want))
      fail(`checklist [${title}] 对应宪法条款 #${want} 不存在`);
    if (boundSlugs.has(want)) fail(`宪法条款 #${want} 被多条 checklist 重复绑定`);
    boundSlugs.add(want);
  }
  // 反向：每个宪法条款都须被恰好一条 checklist 绑定
  for (const s of slugSet) if (!boundSlugs.has(s)) fail(`宪法条款 #${s} 未被任何 checklist 条目回指（漏项）`);
  if (!/原 S2/.test(chk)) fail("checklist 缺 S1 注明「原 S2 已并入」");
}

// ── AC-4: README 三段 ──
const rm = read("README.md");
if (!rm) fail("README.md 不存在");
else ["是什么", "怎么装", "五段流程"].forEach((s) => {
  if (!new RegExp("^## .*" + s, "m").test(rm)) fail(`README 缺段「${s}」`);
});

// ── AC-6: CLAUDE/AGENTS/GLOSSARY 非空；GLOSSARY 含五段术语、不含 denylist ──
["CLAUDE.md","AGENTS.md","GLOSSARY.md"].forEach((f) => {
  const c = read(f);
  if (!c || c.trim().length < 10) fail(`${f} 缺/空`);
});
const ctx = read("GLOSSARY.md") || "";
FIVE_STAGES.forEach((s) => { if (!ctx.includes(s)) fail(`GLOSSARY.md 缺五段术语「${s}」`); });
DENYLIST.forEach((d) => {
  if (new RegExp("\\b" + d.replace(/[-]/g, "\\-") + "\\b").test(ctx))
    fail(`GLOSSARY.md 含排除术语「${d}」`);
});

// ── P6: 专业规范索引（AGENTS 七行 + 六域五列表 + legacy 双连字符锚） ──
const collapse = (s) => s.replace(/-+/g, "-");
const headSlugs = (c) => [
  ...[...c.matchAll(/^#{1,6} (.+)$/gm)].map((m) => collapse(githubAnchorSlug(m[1]))),
  ...[...c.matchAll(/<a id="([^"]+)"><\/a>/g)].map((m) => collapse(m[1])),
];
const checkLink = (fromDir, href) => {
  const [p, a] = href.split("#");
  const target = p === "" ? null : join(fromDir, p);
  const c = target === null ? null : read(target);
  if (target && (c === null || c.trim().length === 0)) return `目标不存在或为空：${target}`;
  if (target && a && target.endsWith(".md") && !headSlugs(c).includes(collapse(a)))
    return `锚点不可达：${target}#${a}`;
  return null;
};
const AG_HEADER = "| 域 | 实质源入口 | 何时读 / 谁读 |";
const TBL_HEADER = "| 规则 | 正文锚点 | 靠什么强制 | 状态 | 什么时候读 |";
// 维护约束：DOMAINS 与七行索引、AG_LABELS 必须与 AGENTS 索引表、specs/<域>/README.md 同步；
// 新增/退役域时同批改本文件、AGENTS 与域目录，否则本段会按旧名单误判（owner：规范索引维护者）。
const DOMAINS = ["design", "frontend", "backend", "api", "acceptance", "code-changes"];
const AG_LABELS = { design: "设计", frontend: "前端", backend: "后端", api: "接口", acceptance: "验收", "code-changes": "代码改动" };
const AG_ROW_LABELS = [...DOMAINS.map((d) => AG_LABELS[d]), "外部引用"];
const blockRows = (lines, header) => {
  const i = lines.findIndex((l) => l.trim() === header);
  if (i < 0) return null;
  const out = [];
  for (let j = i + 1; j < lines.length && lines[j].startsWith("|"); j += 1)
    if (lines[j].includes("](")) out.push(lines[j]);
  return out;
};
const ag = read("AGENTS.md");
if (!ag) fail("AGENTS.md 不存在");
else {
  const lines = ag.split(/\r?\n/);
  if (lines.filter((l) => l.trim() === AG_HEADER).length !== 1)
    fail("AGENTS 索引表头应恰 1 行且逐字一致");
  const sectionStart = lines.findIndex((l) => l.trim() === "## 项目专业规范索引");
  let sectionLines = [];
  if (sectionStart < 0) fail("AGENTS 缺「项目专业规范索引」节");
  else {
    const rest = lines.slice(sectionStart + 1);
    const sectionEnd = rest.findIndex((l) => /^##\s+/.test(l));
    sectionLines = sectionEnd < 0 ? rest : rest.slice(0, sectionEnd);
    const blocks = [];
    let current = null;
    for (const l of sectionLines) {
      if (l.startsWith("|")) { if (!current) { current = []; blocks.push(current); } current.push(l); }
      else current = null;
    }
    if (blocks.length !== 1) fail(`AGENTS 索引节应只有一张索引表，实际 ${blocks.length} 张`);
    else if (blocks[0][0].trim() !== AG_HEADER) fail(`AGENTS 索引表头应逐字为：${AG_HEADER}`);
  }
  const rows = blockRows(sectionLines, AG_HEADER) || [];
  if (rows.length !== 7) fail(`AGENTS 索引表应有 7 行（每域一行），实际 ${rows.length}`);
  const seenLabels = new Set();
  rows.forEach((l) => {
    const cells = l.split("|").slice(1, -1).map((s) => s.trim());
    if (cells.length !== 3) { fail(`AGENTS 索引行不是 3 列：${l.slice(0, 40)}`); return; }
    const label = cells[0];
    if (!AG_ROW_LABELS.includes(label)) fail(`AGENTS 索引行首格不是已知域名：${label || "空"}`);
    else if (seenLabels.has(label)) fail(`AGENTS 索引行重复：${label}`);
    else seenLabels.add(label);
    if (!cells[2]) fail(`AGENTS 索引行缺「何时读 / 谁读」：${label || l.slice(0, 20)}`);
    const hrefs = [...cells[1].matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]);
    if (hrefs.length === 0) fail(`AGENTS 索引行无指针：${l.slice(0, 40)}`);
    hrefs.forEach((u) => { const e = checkLink(".", u); if (e) fail(`AGENTS 索引行 ${e}`); });
  });
  for (const label of AG_ROW_LABELS)
    if (!seenLabels.has(label)) fail(`AGENTS 索引缺行：${label}`);
  for (const d of DOMAINS) {
    const wanted = AG_LABELS[d];
    const row = rows.find((l) => l.split("|").slice(1, -1).map((s) => s.trim())[0] === wanted);
    if (!row) { fail(`AGENTS 索引缺域行：${d}（${wanted}）`); continue; }
    const cells = row.split("|").slice(1, -1).map((s) => s.trim());
    if (!(cells[1] || "").includes(`specs/${d}/README.md`))
      fail(`AGENTS 索引域行第 2 格应指 specs/${d}/README.md：${d}（第 2 格=${(cells[1] || "空").slice(0, 60)}）`);
  }
  for (const item of [
    { lit: "kr-evid-001--分开版本事实归档绑定与权利", min: 2, file: "specs/acceptance/evidence.md" },
    { lit: "kr-done-001--只退出已承接的对应规则", min: 1, file: "specs/acceptance/done.md" },
  ]) {
    const hits = lines.map((l, i) => (l.includes(item.lit) ? i + 1 : 0)).filter(Boolean);
    if (hits.length < item.min)
      fail(`AGENTS 既有双连字符锚被改名或缺失：${item.lit}（应 ≥${item.min} 处，实际 ${hits.length} 处${hits.length ? `，行 ${hits.join(",")}` : ""}）`);
    const e = checkLink(".", `${item.file}#${item.lit}`); if (e) fail(`legacy 锚 ${e}`);
  }
  for (const d of DOMAINS) {
    const f = `specs/${d}/README.md`, c = read(f);
    if (!c) { fail(`域入口不存在：${f}`); continue; }
    const trows = blockRows(c.split(/\r?\n/), TBL_HEADER);
    if (trows === null) { fail(`${f} 缺五列表头`); continue; }
    if (trows.length === 0) fail(`${f} 五列表无数据行`);
    trows.forEach((l) => {
      const cells = l.split("|").slice(1, -1).map((s) => s.trim());
      if (cells.length !== 5) { fail(`${f} 表行不是 5 列：${l.slice(0, 30)}`); return; }
      if (!cells[0]) fail(`${f} 规则格为空：${l.slice(0, 30)}`);
      const hrefs = [...cells[1].matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]);
      if (hrefs.length === 0) fail(`${f} 行无正文锚点：${l.slice(0, 30)}`);
      hrefs.forEach((u) => { const e = checkLink(dirname(f), u); if (e) fail(`${f} ${e}`); });
      if (!["已强制", "待落", "已退"].includes(cells[3])) fail(`${f} 状态非三值：${cells[3]}`);
    });
  }
}

if (errors.length) {
  console.error("结构验收 FAILED：");
  errors.forEach((e) => console.error("  - " + e));
  process.exit(1);
}
console.log(`结构验收 PASS：宪法 ${EXPECTED_ARTICLES} 条 + checklist 锚点全可达 + README 三段 + 文档三件 + GLOSSARY 术语/denylist 合规 + 专业规范索引 7 域可达`);
