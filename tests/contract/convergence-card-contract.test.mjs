// ORACLE-CONVERGENCE: reads the make-decision method, the decision-maker card
// template and the cold-read/adversarial templates as text and JSON only.
// Passing proves the current default describes the same eleven-cell card, the
// six cold-read questions, the nine adversarial questions, the same-reviewer
// two-round cap and the unchanged ten-column/five-category ledger shape.
// It does not prove any real task writes a readable card, nor that a reader
// understood it: the semantic judgement stays with the per-package originals.
// The nine-package evidence below is a historical read-only artifact from a
// five-question task; it is never re-judged under the current version.
// The evidence is a task-library original named by CONVERGENCE_EVIDENCE_REF (the
// gate sets it). Without it these cases report unavailable instead of failing on
// a machine-local default path.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

const method = readFileSync(new URL("../../workflows/make-decision/SKILL.md", import.meta.url), "utf8");
const cardTemplate = readFileSync(
  new URL("../../skills/decision-maker/templates/card.md", import.meta.url),
  "utf8",
);
const coldTemplate = readFileSync(
  new URL("../../skills/decision-maker/templates/cold-read.md", import.meta.url),
  "utf8",
);
const adversarialTemplate = readFileSync(
  new URL("../../skills/decision-maker/templates/adversarial.md", import.meta.url),
  "utf8",
);

const EVIDENCE_REF = (process.env.CONVERGENCE_EVIDENCE_REF ?? "").trim();
const evidenceGiven = EVIDENCE_REF !== "";
// 没提供路径＝本轮没有九包证据，按 unavailable 跳过；提供了却读不到＝真失败，
// 否则 gate 写错路径会静默变绿。
const skipWithoutEvidence = evidenceGiven ? false : "CONVERGENCE_EVIDENCE_REF 未提供：九包证据 unavailable";

const ELEVEN_CELLS = [
  "一句话结果",
  "对应需求",
  "现状缺口",
  "方案与取舍",
  "边界",
  "数据与状态",
  "验收",
  "风险与回退",
  "未决",
  "白话复述",
  "配套与影响",
];
const ELEVEN_LIST = `十一格是${["结果", ...ELEVEN_CELLS.slice(1)].join("、")}`;
const SIX_QUESTION_SENTENCE = "冷读六问是改什么、为什么、边界、怎么验、还有什么没定、配套还要改什么、迁什么、删什么、会影响谁";
const CARD_END = "以上是方案卡段的全部要求";
const SAME_REVIEWER = "由同一审查者复读，不换新读者；首审加复读最多两轮";
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
const SIX_QUESTIONS = ["改什么", "为什么", "边界", "怎么验", "还有什么没定", "配套还要改什么"];
const NINE_QUESTIONS = ["调研范围", "现状是不是真的", "更优雅", "验收真的能执行", "假设", "更简单的替代", "太复杂", "防御性代码", "配套"];
// Historical nine-package evidence used the five-question version; it is read
// as a past fact and never rewritten under the current contract.
const LEGACY_FIVE_QUESTIONS = ["改什么", "为什么", "边界", "怎么验", "还有什么没定"];
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

function orderGaps(text, where, cells = ELEVEN_CELLS) {
  const gaps = [];
  let cursor = -1;
  for (const cell of cells) {
    const at = text.indexOf(cell, cursor + 1);
    if (at <= cursor) gaps.push(`${where}缺格名或顺序不同：${cell}`);
    else cursor = at;
  }
  return gaps;
}

/** 文本合同：方法与模板必须同形状，且不复制共用写作标准正文。 */
function textGaps(methodText, templateText, coldText, adversarialText) {
  const gaps = [];
  if (!methodText.includes(ELEVEN_LIST)) gaps.push("第 9 步缺十一格名单");
  for (const cell of ELEVEN_CELLS) if (!methodText.includes(cell)) gaps.push(`第 9 步缺格名：${cell}`);
  if (!methodText.includes(SIX_QUESTION_SENTENCE)) gaps.push("第 9 步缺冷读六问名单");
  for (const question of SIX_QUESTIONS) if (!methodText.includes(question)) gaps.push(`第 9 步冷读六问缺：${question}`);
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
  if (!methodText.includes(SAME_REVIEWER)) gaps.push("第 9 步复读必须同一审查者且两轮封顶");
  if (!methodText.includes("对抗九问")) gaps.push("第 9 步缺对抗九问");
  if (!methodText.includes("skills/material-writing/SKILL.md")) gaps.push("第 9 步缺写作标准指针");
  if (methodText.includes("先只改 make-decision")) gaps.push("方法里残留本次任务范围口令");
  for (const rule of COPIED_STANDARD_RULES) {
    if (methodText.includes(rule)) gaps.push(`方法复制了共用写作标准正文：${rule}`);
  }

  if (!templateText) gaps.push("卡模板缺十一格表");
  else {
    for (const gap of orderGaps(templateText, "卡模板")) gaps.push(gap);
    if (!templateText.includes("一句话结果")) gaps.push("卡模板首格未写全称「一句话结果」");
    if (!templateText.includes("验收条件") && !/通过条件/.test(templateText)) gaps.push("卡模板验收未写通过条件");
    if (!/反例/.test(templateText)) gaps.push("卡模板验收缺反例");
    if (!/证据/.test(templateText)) gaps.push("卡模板验收缺证据");
    if (!templateText.includes("配套调整") || !templateText.includes("配套迁移")
      || !templateText.includes("配套移除") || !templateText.includes("影响范围")) {
      gaps.push("卡模板配套与影响缺四项");
    }
    if (templateText.includes("先只改 make-decision")) gaps.push("卡模板残留本次任务范围口令");
    for (const rule of COPIED_STANDARD_RULES) {
      if (templateText.includes(rule)) gaps.push(`卡模板复制了共用写作标准正文：${rule}`);
    }
  }

  if (!coldText.includes("## 六问原文")) gaps.push("冷读模板缺六问一节");
  for (const gap of orderGaps(coldText, "冷读模板", SIX_QUESTIONS.map((_, index) => `${index + 1}. `))) gaps.push(gap);
  if (!/同一审查者/.test(coldText)) gaps.push("冷读模板缺同一审查者复读");
  if (!/最多两轮|两轮封顶/.test(coldText)) gaps.push("冷读模板缺两轮封顶");
  if (/新读者/.test(coldText) && !/不换新读者/.test(coldText)) gaps.push("冷读模板残留换新读者");

  if (!adversarialText.includes("## 九问原文")) gaps.push("对抗模板缺九问一节");
  for (const gap of orderGaps(adversarialText, "对抗模板", NINE_QUESTIONS.map((_, index) => `${index + 1}. `))) gaps.push(gap);
  if (!adversarialText.includes("阻塞项")) gaps.push("对抗模板缺阻塞项");
  if (!/同一审查者/.test(adversarialText)) gaps.push("对抗模板缺同一审查者");
  if (!/最多两轮|两轮封顶/.test(adversarialText)) gaps.push("对抗模板缺两轮封顶");

  if (!methodText.includes(ELEVEN_LIST) || !methodText.includes(SIX_QUESTION_SENTENCE)) {
    gaps.push("方法与模板未指向同一套十一格与六问");
  }
  return gaps;
}

function loadEvidence() {
  const text = readFileSync(EVIDENCE_REF, "utf8");
  return JSON.parse(text);
}

describe("make-decision 逐包收敛卡合同", () => {
  it("方法与模板同形状、写作标准只给指针", () => {
    expect(textGaps(method, cardTemplate, coldTemplate, adversarialTemplate), `合同缺口：${textGaps(method, cardTemplate, coldTemplate, adversarialTemplate).join("；")}`).toEqual([]);
  });

  it("删掉十一格名单时合同必须报缺，证明断言能失败", () => {
    const changed = method.replace(ELEVEN_LIST, "十一格另行规定");
    expect(changed).not.toBe(method);
    expect(textGaps(changed, cardTemplate, coldTemplate, adversarialTemplate)).toContain("第 9 步缺十一格名单");
  });

  it("删掉十类不合格里的一类时必须报缺该一类", () => {
    const changed = method.replace("只复述需求", "只是复述");
    expect(changed).not.toBe(method);
    expect(textGaps(changed, cardTemplate, coldTemplate, adversarialTemplate)).toContain("第 9 步十类不合格缺：只复述需求");
  });

  it("模板换掉一个格名时必须报缺该格", () => {
    const changed = cardTemplate.replace("数据与状态", "数据");
    expect(changed).not.toBe(cardTemplate);
    expect(textGaps(method, changed, coldTemplate, adversarialTemplate).some((gap) => gap.includes("卡模板缺格名或顺序不同：数据与状态"))).toBe(true);
  });

  it("冷读模板删掉第六问时必须报缺该问", () => {
    const changed = coldTemplate.replace(/6\. 配套还要改什么、迁什么、删什么，会影响谁？.*\n?/, "");
    expect(changed).not.toBe(coldTemplate);
    expect(textGaps(method, cardTemplate, changed, adversarialTemplate).length).toBeGreaterThan(0);
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
      expect(text, `第 ${entry.package} 包首格未写全称`).toContain("一句话结果");
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
      expect(Object.keys(answers).sort()).toEqual([...LEGACY_FIVE_QUESTIONS].sort());
      const coldRead = readFileSync(entry.cold_read_ref, "utf8");
      expect(sha256(coldRead), `第 ${entry.package} 包冷读原件摘要不符`).toBe(entry.cold_read_sha256);
      expect(coldRead).toContain("只读");
      const readerId = String(entry.reader).replace(/^subagent:/, "");
      expect(coldRead, `第 ${entry.package} 包的读者身份未落冷读原件`).toContain(readerId);
      for (const question of LEGACY_FIVE_QUESTIONS) {
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
