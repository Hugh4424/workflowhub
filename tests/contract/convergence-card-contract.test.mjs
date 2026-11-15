// ORACLE-CONVERGENCE: reads the make-decision method, the decision-log template
// and the published nine-package convergence evidence as text and JSON only.
// Passing proves the three documents describe the same ten-cell card, the five
// cold-read questions, the stop rule, the ten disqualifiers, the independent
// re-read rule and the nine package roll-up shape demanded by acceptance 10.
// It does not prove any real task writes a readable card, nor that an
// independent reader understood it: the semantic judgement stays with the
// per-package cold-read originals and their readers.
// The evidence is a task-library original named by CONVERGENCE_EVIDENCE_REF (the
// gate sets it). Without it these cases report unavailable instead of failing on
// a machine-local default path.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

const method = readFileSync(new URL("../../workflows/make-decision/SKILL.md", import.meta.url), "utf8");
const template = readFileSync(
  new URL("../../skills/decision-log/templates/decision-log-template.md", import.meta.url),
  "utf8",
);

const EVIDENCE_REF = (process.env.CONVERGENCE_EVIDENCE_REF ?? "").trim();
const evidenceGiven = EVIDENCE_REF !== "";
// 没提供路径＝本轮没有九包证据，按 unavailable 跳过；提供了却读不到＝真失败，
// 否则 gate 写错路径会静默变绿。
const skipWithoutEvidence = evidenceGiven ? false : "CONVERGENCE_EVIDENCE_REF 未提供：九包证据 unavailable";

const TEN_CELLS = [
  "结果",
  "对应需求",
  "现状缺口",
  "方案与取舍",
  "边界",
  "数据与状态",
  "验收",
  "风险与回退",
  "未决",
  "白话复述",
];
// The同一句 must stay in one piece: the older ORACLE-CONV-CARD reads this exact
// sentence out of the card block, so a second phrasing would mean two oracles.
const TEN_LIST = `十格是${TEN_CELLS.join("、")}`;
const FIVE_QUESTION_SENTENCE = "冷读五问是改什么、为什么、边界、怎么验、还有什么没定";
const CARD_END = "以上是方案卡段的全部要求";
const TEN_DISQUALIFIERS = [
  "任一问答不出或要翻卡外",
  "只复述需求",
  "没有至少一个被否替代",
  "验收没有反例",
  "出现未解释的黑话或内部编号",
  "核心对象只有名字没有内容",
  "同卡自相矛盾",
  "数量与清单对不上",
  "判据留到执行再填",
  "未决非空",
];
// Rules that belong to the shared writing standard; copying them here would fork it.
const COPIED_STANDARD_RULES = ["每行不超过 80 字", "术语第一次出现必须解释", "编号对照表恰好一张"];
const FIVE_QUESTIONS = ["改什么", "为什么", "边界", "怎么验", "还有什么没定"];
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

const sha256 = (text) => createHash("sha256").update(text).digest("hex");

/** 取一个二级或三级标题节；末尾空白不计，与实际发布摘要同口径。 */
function section(text, heading) {
  const start = text.indexOf(heading);
  if (start < 0) return "";
  const rest = text.slice(start + heading.length);
  return rest.split(/\n#{1,3} /)[0];
}

function cardSection(cards, pkg) {
  const hit = new RegExp(`^## 工作包 ${pkg}：.*$`, "m").exec(cards);
  if (!hit) return null;
  const rest = cards.slice(hit.index + hit[0].length);
  const next = /^## /m.exec(rest);
  const end = next ? hit.index + hit[0].length + next.index : cards.length;
  return cards.slice(hit.index, end).trimEnd();
}

function orderGaps(text, where) {
  const gaps = [];
  let cursor = -1;
  for (const cell of TEN_CELLS) {
    const at = text.indexOf(cell, cursor + 1);
    if (at <= cursor) gaps.push(`${where}缺格名或顺序不同：${cell}`);
    else cursor = at;
  }
  return gaps;
}

/** 文本合同：方法与模板必须同形状，且不复制共用写作标准正文。 */
function textGaps(methodText, templateText) {
  const gaps = [];
  if (!methodText.includes(TEN_LIST)) gaps.push("第 9 步缺十格名单");
  for (const cell of TEN_CELLS) if (!methodText.includes(cell)) gaps.push(`第 9 步缺格名：${cell}`);
  if (!methodText.includes(FIVE_QUESTION_SENTENCE)) gaps.push("第 9 步缺冷读五问名单");
  for (const question of FIVE_QUESTIONS) if (!methodText.includes(question)) gaps.push(`第 9 步冷读五问缺：${question}`);
  if (!methodText.includes("答不出即未收敛")) gaps.push("第 9 步缺「答不出即未收敛」");
  if (!methodText.includes("停在第 10 步前")) gaps.push("第 9 步缺刹车位置");
  if (!methodText.includes("冷读通过也不能把未决非空翻成已收敛")) gaps.push("第 9 步缺未决非空刹车");
  if (!methodText.includes(CARD_END)) gaps.push("第 9 步缺方案卡段结尾句，旧 oracle 的段边界会失稳");
  for (const token of TEN_DISQUALIFIERS) if (!methodText.includes(token)) gaps.push(`第 9 步十类不合格缺：${token}`);
  if (!methodText.includes("不新增步骤")) gaps.push("第 9 步缺「不新增步骤」");
  if (!methodText.includes("不新增审查轮")) gaps.push("第 9 步缺「不新增审查轮」");
  for (const token of ["调研判断", "内部调研", "外部调研", "talk-with-zhipeng", "不用简单选择题"]) {
    if (!methodText.includes(token)) gaps.push(`第 9 步缺调研与真实问答要求：${token}`);
  }
  if (!methodText.includes("由没参与修订的新读者复读，原读者不复用")) gaps.push("第 9 步复读必须换新读者");
  if (!methodText.includes("skills/material-writing/SKILL.md")) gaps.push("第 9 步缺写作标准指针");
  if (methodText.includes("先只改 make-decision")) gaps.push("方法里残留本次任务范围口令");
  for (const rule of COPIED_STANDARD_RULES) {
    if (methodText.includes(rule)) gaps.push(`方法复制了共用写作标准正文：${rule}`);
  }

  const cardTemplate = section(templateText, "### 方案卡怎么写");
  if (!cardTemplate) gaps.push("模板缺方案卡一节");
  else {
    for (const gap of orderGaps(cardTemplate, "模板方案卡一节")) gaps.push(gap);
    if (!cardTemplate.includes(FIVE_QUESTION_SENTENCE)) gaps.push("模板方案卡一节缺冷读五问");
    if (!cardTemplate.includes("convergence-cards")) gaps.push("模板与工作流未指向同一张收敛卡");
    if (!cardTemplate.includes("一句话结果")) gaps.push("模板首格未写全称「一句话结果」");
    if (!cardTemplate.includes("skills/material-writing/SKILL.md")) gaps.push("模板缺写作标准指针");
    if (!cardTemplate.includes("由没参与修订的新读者复读，原读者不复用")) gaps.push("模板复读必须换新读者");
    if (!cardTemplate.includes("不新增步骤")) gaps.push("模板缺「不新增步骤」");
    if (!cardTemplate.includes("不新增审查轮")) gaps.push("模板缺「不新增审查轮」");
    for (const token of TEN_DISQUALIFIERS) if (!cardTemplate.includes(token)) gaps.push(`模板十类不合格缺：${token}`);
    if (cardTemplate.includes("先只改 make-decision")) gaps.push("模板里残留本次任务范围口令");
    for (const rule of COPIED_STANDARD_RULES) {
      if (cardTemplate.includes(rule)) gaps.push(`模板复制了共用写作标准正文：${rule}`);
    }
  }
  if (!methodText.includes(TEN_LIST) || !methodText.includes(FIVE_QUESTION_SENTENCE)) {
    gaps.push("方法与模板未指向同一套格名与五问");
  }
  return gaps;
}

function loadEvidence() {
  const text = readFileSync(EVIDENCE_REF, "utf8");
  return JSON.parse(text);
}

describe("make-decision 逐包收敛卡合同", () => {
  it("方法与模板同形状、写作标准只给指针", () => {
    expect(textGaps(method, template), `合同缺口：${textGaps(method, template).join("；")}`).toEqual([]);
  });

  it("删掉十格名单时合同必须报缺，证明断言能失败", () => {
    const changed = method.replace(TEN_LIST, "十格另行规定");
    expect(changed).not.toBe(method);
    expect(textGaps(changed, template)).toContain("第 9 步缺十格名单");
  });

  it("删掉十类不合格里的一类时必须报缺该一类", () => {
    const changed = method.replace("只复述需求", "只是复述");
    expect(changed).not.toBe(method);
    expect(textGaps(changed, template)).toContain("第 9 步十类不合格缺：只复述需求");
  });

  it("模板换掉一个格名时必须报缺该格", () => {
    const changed = template.replace("数据与状态", "数据");
    expect(changed).not.toBe(template);
    expect(textGaps(method, changed).some((gap) => gap.includes("模板方案卡一节缺格名或顺序不同：数据与状态"))).toBe(true);
  });
});

describe("九包卡与逐包独立冷读证据", () => {
  it("提供了证据路径就必须可读，写错路径不得静默跳过", () => {
    if (!evidenceGiven) return;
    expect(existsSync(EVIDENCE_REF), `证据路径提供了但不可读：${EVIDENCE_REF}`).toBe(true);
    expect(statSync(EVIDENCE_REF).isFile()).toBe(true);
  });

  it.skipIf(skipWithoutEvidence)("汇总是 appendRecord 的 json 原件，含九包且包身份唯一", () => {
    const evidence = loadEvidence();
    expect(evidence.schema).toBe("convergence-evidence/v1");
    expect(evidence.task_id).toBe("workflowhub-design-port-flow-20261115");
    expect(Array.isArray(evidence.packages)).toBe(true);
    expect(evidence.packages.length, "来源分母是全部九包").toBe(9);
    expect(evidence.packages.map((entry) => entry.package).sort((left, right) => left - right)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    expect(new Set(evidence.packages.map((entry) => entry.title)).size, "每包标题必须唯一").toBe(9);
    expect(statSync(EVIDENCE_REF).isFile()).toBe(true);
  });

  it.skipIf(skipWithoutEvidence)("每包卡的当前字节与汇总摘要一致", () => {
    const evidence = loadEvidence();
    expect(existsSync(evidence.cards_ref), `当前卡不可回读：${evidence.cards_ref}`).toBe(true);
    const cards = readFileSync(evidence.cards_ref, "utf8");
    expect(sha256(cards), "整体卡摘要与当前卡不一致").toBe(evidence.cards_sha256);
    for (const entry of evidence.packages) {
      expect(String(entry.card_ref).split("#")[0], `第 ${entry.package} 包 card_ref 必须指向唯一当前卡`).toBe(
        evidence.cards_ref,
      );
      const text = cardSection(cards, entry.package);
      expect(text, `当前卡缺第 ${entry.package} 包`).not.toBeNull();
      expect(sha256(text), `第 ${entry.package} 包摘要变化后未复读`).toBe(entry.card_sha256);
      expect(orderGaps(text, `第 ${entry.package} 包卡`)).toEqual([]);
      expect(text, `第 ${entry.package} 包首格未写全称`).toContain("一句话结果");
      for (const cell of TEN_CELLS) expect(text).toContain(cell);
      expect(text).not.toMatch(/\b(?:AC|R|U|D|WP)-?\d{1,3}\b/);
    }
    expect(cards.match(/^## 编号对照表$/m)?.length ?? 0, "编号对照表恰好一张").toBe(1);
  });

  it.skipIf(skipWithoutEvidence)("每包由未参与写作的独立上下文冷读并留五问原答", () => {
    const evidence = loadEvidence();
    for (const entry of evidence.packages) {
      expect(String(entry.reader), `第 ${entry.package} 包缺读者身份`).toMatch(new RegExp(`^subagent:${UUID.source}$`));
      expect(entry.context, `第 ${entry.package} 包读者上下文必须独立`).toBe("none");
      const answers = entry.five_answers ?? {};
      expect(Object.keys(answers).sort()).toEqual([...FIVE_QUESTIONS].sort());
      const coldRead = readFileSync(entry.cold_read_ref, "utf8");
      expect(sha256(coldRead), `第 ${entry.package} 包冷读原件摘要不符`).toBe(entry.cold_read_sha256);
      expect(coldRead).toContain("只读");
      const readerId = String(entry.reader).replace(/^subagent:/, "");
      expect(coldRead, `第 ${entry.package} 包的读者身份未落冷读原件`).toContain(readerId);
      for (const question of FIVE_QUESTIONS) {
        const answer = String(answers[question] ?? "").trim();
        expect(answer.length, `第 ${entry.package} 包的「${question}」缺原答`).toBeGreaterThan(8);
        expect(coldRead, `第 ${entry.package} 包的「${question}」原答未落原件`).toContain(answer);
      }
    }
  });

  it.skipIf(skipWithoutEvidence)("修订过的卡由另一个新读者复读，未修订写无修订", () => {
    const evidence = loadEvidence();
    for (const entry of evidence.packages) {
      expect(String(entry.revision).trim().length, `第 ${entry.package} 包缺修订记录`).toBeGreaterThan(0);
      if (entry.revised === true) {
        expect(existsSync(entry.first_read_ref), `第 ${entry.package} 包首轮原件不可回读`).toBe(true);
        expect(entry.reread_ref, `第 ${entry.package} 包复读指针不得回指首轮`).not.toBe(entry.first_read_ref);
        expect(entry.reread_reader, `第 ${entry.package} 包复读读者必须与首轮不同`).not.toBe(entry.first_read_reader);
        const reread = readFileSync(entry.reread_ref, "utf8");
        expect(sha256(reread), `第 ${entry.package} 包复读原件摘要不符`).toBe(entry.reread_sha256);
        expect(reread).toContain(String(entry.reread_reader).replace(/^subagent:/, ""));
        const first = readFileSync(entry.first_read_ref, "utf8");
        expect(sha256(first), `第 ${entry.package} 包首轮原件摘要不符`).toBe(entry.first_read_sha256);
        expect(first).toContain(String(entry.first_read_reader).replace(/^subagent:/, ""));
        expect(entry.revised, `第 ${entry.package} 包必须标明是否修订`).toBe(true);
      } else {
        expect(String(entry.reread_ref).startsWith("N/A"), `第 ${entry.package} 包无修订时复读指针写 N/A`).toBe(true);
        expect(entry.reread_reader, `第 ${entry.package} 包无修订时复读读者写 N/A`).toBe("N/A");
        expect(entry.first_read_ref, `第 ${entry.package} 包首轮指针缺失`).toBeTruthy();
        expect(entry.first_read_ref).toBe(entry.cold_read_ref);
        expect(existsSync(entry.first_read_ref), `第 ${entry.package} 包首轮原件不可回读`).toBe(true);
      }
    }
  });

  it.skipIf(skipWithoutEvidence)("冷读转录的两个版本都留摘要，后补声明不抹掉首版", () => {
    const evidence = loadEvidence();
    expect(Array.isArray(evidence.transcript_versions), "汇总须记冷读转录的版本对照").toBe(true);
    for (const entry of evidence.packages) {
      const versions = evidence.transcript_versions.filter((item) => item.package === entry.package);
      const last = versions.at(-1) ?? null;
      expect(last, `第 ${entry.package} 包缺转录版本记录`).not.toBeNull();
      for (const version of versions) {
        expect(existsSync(version.ref), `第 ${entry.package} 包转录版本不可回读：${version.ref}`).toBe(true);
        expect(sha256(readFileSync(version.ref, "utf8"))).toBe(version.sha256);
      }
      expect(last.ref, `第 ${entry.package} 包当前冷读不是最新版本`).toBe(entry.cold_read_ref);
    }
  });

  it.skipIf(skipWithoutEvidence)("每包先有调研判断与理由，且结果原件可回读", () => {
    const evidence = loadEvidence();
    const judged = new Set(["内部调研", "外部调研", "内部与外部调研", "不需要"]);
    for (const entry of evidence.packages) {
      expect(judged.has(entry.research_judgment), `第 ${entry.package} 包调研判断取值不合规`).toBe(true);
      expect(String(entry.reason ?? "").trim().length, `第 ${entry.package} 包缺调研理由`).toBeGreaterThan(4);
      expect(String(entry.result_ref ?? "").trim().length, `第 ${entry.package} 包缺调研结果指针`).toBeGreaterThan(0);
      for (const ref of String(entry.result_ref).split("；")) {
        if (ref.trim().startsWith("N/A")) continue;
        expect(existsSync(ref.trim()), `第 ${entry.package} 包调研结果原件不可回读：${ref}`).toBe(true);
      }
      expect(String(entry.talk_ref ?? "").trim().length, `第 ${entry.package} 包缺真实问答或 N/A 说明`).toBeGreaterThan(0);
      for (const ref of String(entry.talk_ref).split("；")) {
        if (ref.trim().startsWith("N/A")) continue;
        expect(existsSync(ref.trim()), `第 ${entry.package} 包问答原件不可回读：${ref}`).toBe(true);
      }
    }
  });
});
