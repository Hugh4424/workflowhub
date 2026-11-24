// ORACLE-DIRECTION-HANDOFF：P10「真实原答、先后关系、实际供件和缺件到达下游；
// 没答和错批不冒真答」的冻结契约。
//
// 只读四份真实文件字节；不 import 产品内部实现、不跑 git、不写产品/技能/模板/
// 规格/阶段卡/决策日志。P10 的交付是「方向交接与首读」的正文，所以 oracle 就是
// 下游实际读到的四份材料：
//  - skills/decision-maker/SKILL.md：方向包的交接方法（真实原答怎么写、先后怎么读）；
//  - skills/decision-maker/templates/package-context.md：交给下游的上下文包（供件/缺件）；
//  - workflows/make-decision/SKILL.md 第 9/12/13 步：真实交接与拒绝坏答；
//  - skills/decision-log/templates/decision-log-template-v2.md：原话与答复索引、十一格卡。
//
// 为什么是本轮 RED：这些交接要求现在都还没写进目标文件——方法里没有「原答来源
// （包号/批次/时点）+ 原话或摘要指针」、没有原答与供件的先后读法、没有实际供件与缺件
// 三分的写法，第 9/12/13 步没有「沉默/答复指代不明/错包错批都不算真答」的明确拒绝，
// 十一格卡仍与内核 R6 重复定义判据正文。测试按语义与具名字样定位，不要求逐字复制。
//
// 机器契约（实现者逐字满足；失败信息会点名缺哪个锚、在哪个文件）：
//  A. 真实原答承接（skills/decision-maker/SKILL.md，方法里必须有这条）：
//     同一句内出现「原答来源」，并写明「包号」「批次」「时点」及「原话」或「摘要」的
//     「指针」；且有一句明确「不得用『已确认』代替」之类的拒绝。
//  B. 先后关系（skills/decision-maker/SKILL.md）：同一句写出原答与后续供件的
//     「先后」顺序（谁先谁后、哪一步等哪一步）。
//  C. 供件与缺件（package-context.md 或 decision-maker/SKILL.md）：实际供件写清
//     「是什么」「谁给」「在哪」；缺件分别记「尝试」「影响」「恢复条件」。
//  D. 没答/错批不冒真答（workflows/make-decision/SKILL.md 第 9/12/13 步）：沉默、
//     答复指代不明、错包/错批原件都明确「不算真答」。
//  E. 不新建答复索引、历史不回写（decision-log-template-v2.md）：恰好一条答复索引标题，
//     并明确「不新建第二份答复索引」「历史不回写」。
//  F. v2 模板债务（decision-log-template-v2.md 十一格卡块）：改为引用内核 R6，或
//     明确声明「保留理由」，不再与内核重复定义判据正文。
//
// 本轮 RED 的目标是这些要求在四个目标文件里尚未写出，不是导入、语法或装置错误。
// 真实原答、真实供件与真实首读原件由 P10 验收阶段用既有 capture 产生；本文件不伪造
// 回执、答复、供件或独立审查结论。
import assert from "node:assert/strict";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = realpathSync(join(dirname(fileURLToPath(import.meta.url)), "..", ".."));
const ORACLE = "ORACLE-DIRECTION-HANDOFF";
const DECISION_MAKER_REF = "skills/decision-maker/SKILL.md";
const PKG_CONTEXT_REF = "skills/decision-maker/templates/package-context.md";
const MAKE_DECISION_REF = "workflows/make-decision/SKILL.md";
const TEMPLATE_V2_REF = "skills/decision-log/templates/decision-log-template-v2.md";

const STEP9 = "step-module-convergence";
const STEP12 = "step-write-decision-draft";
const STEP13 = "step-stage-end-spec-analyze";

const readText = ref => readFileSync(join(ROOT, ref), "utf8");
const clip = value => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > 700 ? `${text.slice(0, 700)}…` : text;
};

/** 切成「一句」，供「同一句内必须同时出现这些字样」类断言使用。 */
function sentences(text) {
  return String(text)
    .split(/(?<=[。！？!?])|\n/)
    .map(part => part.trim())
    .filter(Boolean);
}

/**
 * 要求存在至少一句同时命中全部 token（RegExp 或字面串）。失败时点名缺哪一项、
 * 期望什么样、以及实际正文，便于实现者直接定位。
 */
function requireSentence(ref, text, tokens, name, expected) {
  const list = sentences(text);
  const hit = list.find(sentence =>
    tokens.every(token => (token instanceof RegExp ? token.test(sentence) : sentence.includes(token))),
  );
  assert.ok(
    hit,
    `${ORACLE} ${ref} 缺「${name}」：${expected}；` +
      `期望同一句内同时出现 ${tokens.map(token => (token instanceof RegExp ? token.source : `“${token}”`)).join("、")}。` +
      `实际正文：${clip(text)}`,
  );
  return hit;
}

/** 取步骤锚到下一个步骤锚之间的正文（make-decision 的编号步骤列表）。 */
function anchoredStep(anchor) {
  const text = readText(MAKE_DECISION_REF);
  const marker = `<a id="${anchor}"></a>`;
  const start = text.indexOf(marker);
  assert.ok(
    start >= 0,
    `${ORACLE} 装置失效：${MAKE_DECISION_REF} 找不到锚 ${marker}；` +
      "P10 的真实交接必须落在第 9/12/13 步，本文件不替代这些步骤",
  );
  const rest = text.slice(start + marker.length);
  const end = rest.search(/\n\d+\.\s*<a id="step-/);
  return end < 0 ? text.slice(start) : text.slice(start, start + marker.length + end);
}

/** 取两个标记之间的正文块（含 start，不含 end）。 */
function blockBetween(ref, startMarker, endMarker) {
  const text = readText(ref);
  const start = text.indexOf(startMarker);
  assert.ok(
    start >= 0,
    `${ORACLE} 装置失效：${ref} 缺起始标记「${startMarker}」；P10 的十一格卡块必须仍在这份模板里`,
  );
  const rest = text.slice(start + startMarker.length);
  const end = rest.indexOf(endMarker);
  assert.ok(
    end >= 0,
    `${ORACLE} 装置失效：${ref} 缺结束标记「${endMarker}」；P10 只改十一格卡块，不能删掉相邻支撑件`,
  );
  return rest.slice(0, end);
}

test(`${ORACLE} 装置：四份目标文件、第 9/12/13 步锚与模板块可读`, () => {
  for (const ref of [DECISION_MAKER_REF, PKG_CONTEXT_REF, MAKE_DECISION_REF, TEMPLATE_V2_REF]) {
    assert.ok(
      existsSync(join(ROOT, ref)),
      `${ORACLE} 缺 ${ref}：P10 的冻结契约只能从真实方法字节与模板读取`,
    );
  }
  const makeDecision = readText(MAKE_DECISION_REF);
  for (const anchor of [STEP9, STEP12, STEP13]) {
    assert.ok(
      makeDecision.includes(`<a id="${anchor}"></a>`),
      `${ORACLE} ${MAKE_DECISION_REF} 缺锚 #${anchor}：P10 只接第 9/12/13 步，不能删除这些交接步骤`,
    );
  }
  // 第 10 步不得被改写（阶段卡：现第九十一十二十三步真实交接，不改第十步）。
  assert.ok(
    makeDecision.includes(`<a id="step-detail-advice"></a>`),
    `${ORACLE} ${MAKE_DECISION_REF} 缺第 10 步锚 #step-detail-advice：P10 只接第 9/12/13 步，第十步必须原样保留`,
  );
  blockBetween(TEMPLATE_V2_REF, "**十一格卡**", "**决定四字段**");
});

test(`${ORACLE} A 真实原答承接：包号/批次/时点 + 原话或摘要指针，不得用「已确认」代替`, () => {
  const ref = DECISION_MAKER_REF;
  const text = readText(ref);

  requireSentence(
    ref,
    text,
    ["原答来源", "包号", "批次", "时点", /(?:原话|摘要)/, "指针"],
    "原答来源写包号/批次/时点并给原话或摘要指针",
    "P10 要求每个包的交接写清原答来源：包号、批次、时点，并给出原话或摘要指针；" +
      "只写『已确认』或只写『有答复』都不能让下游回读到真实原答",
  );

  assert.match(
    text,
    /(?:不得|不能|不许|禁止|不要)[^。]{0,24}已确认|已确认[^。]{0,24}(?:不算|不能代替|不得代替|不代替|不冒|不算数|不作数)|不拿[^。]{0,12}已确认[^。]{0,12}(?:代替|充当|冒)/,
    `${ORACLE} ${ref} 缺「不得用『已确认』代替原答来源」：` +
      "P10 要求把『已确认』一类概括挡在真原答之外，不能拿它顶替包号/批次/时点与原话指针；" +
      `实际正文：${clip(text)}`,
  );
});

test(`${ORACLE} B 先后关系：原答与后续供件的先后顺序可读（谁先谁后、哪一步等哪一步）`, () => {
  const ref = DECISION_MAKER_REF;
  const text = readText(ref);

  requireSentence(
    ref,
    text,
    ["原答", /供件/, "先后", /(?:谁先谁后|哪一步|谁先|先谁后)/],
    "原答与后续供件的先后顺序",
    "P10 要求把原答和后续供件的先后读法写出来：谁先谁后、哪一步等哪一步；" +
      "只列文件不给顺序，接手人无法判断现在能到哪一步",
  );
});

test(`${ORACLE} C 供件与缺件：实际供件写清是什么/谁给/在哪；缺件分别记尝试/影响/恢复条件`, () => {
  const ref = `${PKG_CONTEXT_REF} 或 ${DECISION_MAKER_REF}`;
  const text = `${readText(PKG_CONTEXT_REF)}\n${readText(DECISION_MAKER_REF)}`;

  requireSentence(
    ref,
    text,
    [/供件/, /(?:谁给|谁提供|提供者|由谁给)/, /(?:在哪|位置|原件|路径)/, /(?:是什么|内容|字段|名称|清单)/],
    "实际供件写清是什么、谁给、在哪",
    "P10 要求实际供件写清它是什么、谁给的、存在哪个原件；只写『已有供件』无法被下游接住",
  );

  requireSentence(
    ref,
    text,
    [/缺件/, "尝试", "影响", "恢复条件"],
    "缺件分别记尝试、影响与恢复条件",
    "P10 要求缺件分别记下尝试过什么、影响哪一步、什么条件能恢复；" +
      "只写『缺什么』会把尝试与恢复条件丢掉，接手人不知道该不该重试",
  );
});

test(`${ORACLE} D 没答/错批不冒真答：沉默、指代不明、错包/错批都不算真答`, () => {
  const ref = `${MAKE_DECISION_REF}#${STEP9}/${STEP12}/${STEP13}`;
  const text = [anchoredStep(STEP9), anchoredStep(STEP12), anchoredStep(STEP13)].join("\n");
  const realAnswer = /(?:真答|真实答复|真实回答|真答复)/;
  const reject = /(?:不算|不冒|不作|不能算|不是|不当|不视为|不等于|不能当作|不能算作)/;

  const cases = [
    [/(?:沉默|未答|不答|没答)/, "沉默/未答不算真答", "P10 要求沉默或未答明确不算真答，不能默认同意或补签"],
    [/(?:指代不明|指代不清|含糊|不明确|语义不明)/, "答复指代不明不算真答", "P10 要求答复指代不明时报缺口，不能当成真答继续"],
    [/(?:错包|错批)/, "错包/错批原件不算真答", "P10 要求错包或错批的原件明确不算真答，不能拿别的包/批次顶替"],
  ];
  for (const [subject, name, expected] of cases) {
    const pattern = new RegExp(`${subject.source}[^。]{0,60}${reject.source}[^。]{0,12}${realAnswer.source}`);
    assert.match(
      text,
      pattern,
      `${ORACLE} ${ref} 缺「${name}」：${expected}；` +
        "P10 要求把没答与错批挡在真答之外，并让下游读到明确拒绝；" +
        `实际第 9/12/13 步正文：${clip(text)}`,
    );
  }
});

test(`${ORACLE} E 不新建答复索引、历史不回写（v2 模板）`, () => {
  const ref = TEMPLATE_V2_REF;
  const text = readText(ref);

  const indexHeadings = text.split(/\r?\n/).filter(line => /^#{1,6}\s/.test(line) && line.includes("答复索引"));
  assert.equal(
    indexHeadings.length,
    1,
    `${ORACLE} ${ref} 应有且只有一条「答复索引」标题，实际 ${indexHeadings.length} 条：` +
      `P10 明确不新建第二份答复索引；现有标题：${indexHeadings.map(item => item.trim()).join("、") || "（无）"}`,
  );

  assert.match(
    text,
    /(?:不|不得|不要)[^。]{0,8}(?:新建|另建|再建|增加|新增)[^。]{0,12}(?:第二[^。]{0,6})?答复索引|(?:唯一|同一份|只保留一份)[^。]{0,12}答复索引|答复索引[^。]{0,12}(?:唯一|只一份|只有一份)/,
    `${ORACLE} ${ref} 缺「不新建第二份答复索引」：` +
      "P10 要求答复索引保持唯一，不新增第二份；下游只回读这一份，避免双写；" +
      `实际正文：${clip(text)}`,
  );

  assert.match(
    text,
    /历史[^。]{0,16}(?:不回写|不改写|不覆写|保持原文|原样保留)|不改写历史|不覆写历史|历史(?:日志|正文|卡)[^。]{0,12}(?:保持|原样)/,
    `${ORACLE} ${ref} 缺「历史不回写」：` +
      "P10 明确历史不回写，不能事后回填或改写已发生的答复与卡；" +
      `实际正文：${clip(text)}`,
  );
});

test(`${ORACLE} F v2 模板债务：十一格卡改为引用内核 R6 或声明保留理由，不再重复定义判据正文`, () => {
  const ref = TEMPLATE_V2_REF;
  const block = blockBetween(ref, "**十一格卡**", "**决定四字段**");

  const referencesKernel = /R6/.test(block) && /(?:unit-kernel|内核)/.test(block);
  const declaresRetention = /保留理由/.test(block);
  assert.ok(
    referencesKernel || declaresRetention,
    `${ORACLE} ${ref} 的十一格卡块仍与内核重复定义判据正文：` +
      "P10（P1 登记的 v2 模板债务）要求十一格卡改为引用内核 R6（同时出现 R6 与 unit-kernel/内核），" +
      "或明确声明保留理由；当前既不引用内核 R6，也没有保留理由。" +
      `实际十一格卡块：${clip(block)}`,
  );
});
