#!/usr/bin/env node
// 结构验收脚本：机器校验 M1 交付物是否满足验收（F9 可证伪——故意删一条宪法/漏一个 checklist 项会真报错）。
// 纳入 npm run check，与 markdownlint 一起构成"克隆后最小检查命令"。
import { readFileSync, existsSync } from "node:fs";

const errors = [];
const fail = (m) => errors.push(m);
const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null);

// GitHub slug 规则：小写 → 删标点 → 空格转连字符（保留中文/字母数字/连字符）
const ghSlug = (t) =>
  t.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-");

const EXPECTED_ARTICLES = 21;
const DENYLIST = ["Wish","Dispatcher","harness","host","checkpoint","runtime","metering","observability","email-reply"];
const FIVE_STAGES = ["intake","design","plan","apply","test-acceptance"];
const FOUR_PARTS = ["定义","最佳实践解释","正例","反例"];

// ── AC-2: 宪法 21 条，每条四段非空 ──
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
    ...Array.from({length:10},(_,i)=>`F${i+1}`),
    ...Array.from({length:3},(_,i)=>`Q${i+1}`),
    ...Array.from({length:8},(_,i)=>`S${i+1}`),
  ]);
  const gotIds = new Set(titles.map((t)=>t.split(/\s/)[0]));
  for (const id of EXPECTED_IDS) if (!gotIds.has(id)) fail(`宪法缺编号 ${id}`);
  for (const id of gotIds) if (!EXPECTED_IDS.has(id)) fail(`宪法出现非预期编号 ${id}`);
  titles.forEach((t) => slugSet.add(ghSlug(t)));
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

// ── AC-3: checklist 21 条，每条锚点回指真实存在的宪法条款 ──
const chk = read("constitution-checklist.md");
if (!chk) fail("constitution-checklist.md 不存在");
else {
  // 按 checklist item 行逐条解析：每条恰好 1 个 CONSTITUTION.md 锚点，
  // 且该锚点 === 该条标题的 ghSlug（逐条身份绑定，防 F1↔F2 互链仍集合相等的假绿）
  const lines = chk.split(/\r?\n/);
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
    const want = ghSlug(title);
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

// ── AC-6: CLAUDE/AGENTS/CONTEXT 非空；CONTEXT 含五段术语、不含 denylist ──
["CLAUDE.md","AGENTS.md","CONTEXT.md"].forEach((f) => {
  const c = read(f);
  if (!c || c.trim().length < 10) fail(`${f} 缺/空`);
});
const ctx = read("CONTEXT.md") || "";
FIVE_STAGES.forEach((s) => { if (!ctx.includes(s)) fail(`CONTEXT.md 缺五段术语「${s}」`); });
DENYLIST.forEach((d) => {
  if (new RegExp("\\b" + d.replace(/[-]/g, "\\-") + "\\b").test(ctx))
    fail(`CONTEXT.md 含排除术语「${d}」`);
});

if (errors.length) {
  console.error("结构验收 FAILED：");
  errors.forEach((e) => console.error("  - " + e));
  process.exit(1);
}
console.log(`结构验收 PASS：宪法 ${EXPECTED_ARTICLES} 条 + checklist 锚点全可达 + README 三段 + 文档三件 + CONTEXT 术语/denylist 合规`);
