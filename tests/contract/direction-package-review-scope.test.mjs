// ORACLE-DIRECTION-REVIEW：P11「一真实包同源冷读/对抗加异源审、独立原件可核；
// 第十步只做跨包四项」的冻结契约，对应 AC-QUAL-023。
//
// 只读四份真实文件字节；不 import 产品内部实现、不跑 git、不写产品/技能/模板/
// 规格/阶段卡/决策日志。P11 的交付是方向包审与跨包审分开的方法正文，所以 oracle
// 就是下游实际读到的四份材料：
//  - skills/decision-maker/SKILL.md：真实包的双路、异源审、人工读与不升格机器判据；
//  - skills/decision-maker/templates/adversarial.md：对抗原件字段与下游试读/包间接口问题；
//  - workflows/make-decision/SKILL.md 第 10 步：只做跨包四项，不再逐包复查；
//  - workflows/make-decision/steps.json 第 9/10 步：五件机器原件不升第六件，第 10 步同步。
//
// 为什么是本轮 RED：目标文件现在还没有「真实包同源冷读与对抗两件原件各带执行者、
// 会话或来源、同一卡节摘要」「独立异源审不继承写作与同源审上下文」「一路失效不得拿
// 另一路冒通过」「异源人工读、不做机器第六件」；第 10 步仍逐包核记录、逐包五问、
// 逐包投影，没有收成跨包一致/写集定序/一事一值/十项齐及适用镜头；对抗模板也没有
// 下游试读与包间接口问题。因此下面的语义断言会真实失败，失败点都是目标内容缺失，
// 不是导入、语法或夹具错误。
//
// 机器契约（实现者逐项满足；失败信息会点名缺哪个锚、在哪个文件）：
//  A. 同源两路（decision-maker SKILL）：一个真实包必须同时有冷读与对抗两件同源
//     原件；每件写实际执行者、会话或来源，并绑定同一卡节摘要/sha256。
//  B. 异源审（decision-maker SKILL）：另有独立异源审原件，不继承写作与同源审
//     上下文；任一路失效时不得以另一路冒通过。
//  C. 第十步（make-decision SKILL 第10步块 + steps.json 第10步）：只做跨包四项
//     ——跨包一致、写集定序、一事一值、十项齐及适用镜头；明确不再逐包复查/投影，
//     且不再出现逐包核记录、逐包五问、proposal_projection 等冲突表述。
//  D. 不改审查分级/冻结提示词/provider：第9/10步不新增这些机器字段；目标正文不新增
//     审查分级定义、不改写冻结提示词、不更换 provider；既有 provider 不可用处置仍在。
//  E. 异源不作机器第六件（decision-maker SKILL + steps.json）：异源由人工读，不升格
//     为机器判据；五件机器原件名单仍是方案卡/质询/冷读/对抗/真实答复，不添第六件。
//  F. 对抗模板（adversarial.md）：保留同源关系与执行者/批次/卡节摘要字段，并补
//     下游试读与包间接口问题。
//
// 本轮 RED 的目标是这些要求在四个目标文件里尚未写出；真实包、两路原件与异源人工
// 读由 P11 验收阶段用既有 capture 产生，本文件不伪造回执、答复或审查结论。
import assert from "node:assert/strict";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = realpathSync(join(dirname(fileURLToPath(import.meta.url)), "..", ".."));
const ORACLE = "ORACLE-DIRECTION-REVIEW";
const DECISION_MAKER_REF = "skills/decision-maker/SKILL.md";
const ADVERSARIAL_REF = "skills/decision-maker/templates/adversarial.md";
const MAKE_DECISION_REF = "workflows/make-decision/SKILL.md";
const STEPS_REF = "workflows/make-decision/steps.json";
const STEP10_ANCHOR = "step-detail-advice";

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
  const hit = sentences(text).find(sentence =>
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

/** 同一句要求可以在多个候选文件之一满足；失败时同时点名所有候选。 */
function requireSentenceInOne(refs, tokens, name, expected) {
  for (const ref of refs) {
    const text = readText(ref);
    const hit = sentences(text).find(sentence =>
      tokens.every(token => (token instanceof RegExp ? token.test(sentence) : sentence.includes(token))),
    );
    if (hit) return hit;
  }
  assert.fail(
    `${ORACLE} ${refs.join(" 或 ")} 都缺「${name}」：${expected}；` +
      `期望至少一处同一句内同时出现 ${tokens.map(token => (token instanceof RegExp ? token.source : `“${token}”`)).join("、")}。`,
  );
}

/** 要求整段（可跨句）命中某模式；用于四项清单这类允许分行书写的锚。 */
function requireMatch(ref, text, pattern, name, expected) {
  assert.ok(
    pattern.test(text),
    `${ORACLE} ${ref} 缺「${name}」：${expected}；未命中 ${pattern}。实际正文：${clip(text)}`,
  );
}

/** 取步骤锚到下一个步骤锚之间的正文（make-decision 的编号步骤列表）。 */
function stepBlock(anchor) {
  const text = readText(MAKE_DECISION_REF);
  const marker = `<a id="${anchor}"></a>`;
  const start = text.indexOf(marker);
  assert.ok(
    start >= 0,
    `${ORACLE} 装置失效：${MAKE_DECISION_REF} 找不到锚 ${marker}；` +
      "P11 的跨包四项必须落在第 10 步，本文件不替代这些步骤",
  );
  const rest = text.slice(start + marker.length);
  const end = rest.search(/\n\d+\.\s*<a id="step-/);
  return end < 0 ? rest : rest.slice(0, end);
}

function loadSteps() {
  let data;
  try {
    data = JSON.parse(readText(STEPS_REF));
  } catch (error) {
    assert.fail(`${ORACLE} 装置失效：${STEPS_REF} 不是合法 JSON：${error.message}`);
  }
  assert.ok(Array.isArray(data.steps), `${ORACLE} 装置失效：${STEPS_REF} 缺 steps 数组`);
  return data;
}

function findStep(steps, stepId) {
  return steps.steps.find(step => step.step_id === stepId);
}

function collectKeys(value, out = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, out);
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      out.push(key);
      collectKeys(child, out);
    }
  }
  return out;
}

/**
 * 第十步只做跨包四项；任何未否定的逐包复查、逐包投影或 proposal_projection
 * 都与「不再逐包复查」冲突。允许「不再逐包提问/投影」这类明确否定句。
 */
function assertNoPerPackageReview(ref, text) {
  for (const sentence of sentences(text)) {
    const negated = /(不再|不|无需|禁止|取消|不是|非|停止|免去|停用)/.test(sentence);
    if (
      /(逐包|每包|每个工作包)/.test(sentence) &&
      /(复查|审核|审查|提问|五问|投影|结论|核对|核|检查)/.test(sentence) &&
      !negated
    ) {
      assert.fail(
        `${ORACLE} ${ref} 仍有与「只做跨包四项」冲突的逐包复查表述：「${clip(sentence)}」；` +
          "第十步不重开逐包提问/逐包投影，逐包问题回原包作者",
      );
    }
    if (/proposal_projection/.test(sentence)) {
      assert.fail(
        `${ORACLE} ${ref} 仍有逐包投影字段 proposal_projection：「${clip(sentence)}」；` +
          "第十步只做跨包一致、写集定序、一事一值、十项齐及适用镜头",
      );
    }
    if (/投影/.test(sentence) && !negated) {
      assert.fail(
        `${ORACLE} ${ref} 仍有未否定的逐包投影表述：「${clip(sentence)}」；` +
          "第十步不再逐包投影",
      );
    }
  }
}

test(`${ORACLE} 装置：四份目标文件、第10步锚与 steps.json 第9/10步可读`, () => {
  for (const ref of [DECISION_MAKER_REF, ADVERSARIAL_REF, MAKE_DECISION_REF, STEPS_REF]) {
    assert.ok(
      existsSync(join(ROOT, ref)),
      `${ORACLE} 缺 ${ref}：P11 的冻结契约只能从真实方法字节与步骤形状读取`,
    );
  }
  assert.ok(
    stepBlock(STEP10_ANCHOR).trim().length > 0,
    `${ORACLE} 装置失效：${MAKE_DECISION_REF} 第10步块为空；跨包四项必须落在该块`,
  );
  const steps = loadSteps();
  for (const stepId of [9, 10]) {
    assert.ok(
      findStep(steps, stepId),
      `${ORACLE} 装置失效：${STEPS_REF} 缺第 ${stepId} 步；P11 需同批读第9步五件与第10步跨包四项`,
    );
  }
});

test(`${ORACLE} 同源两路：真实包同时有冷读与对抗两件同源原件，各带执行者、来源、同一卡节摘要`, () => {
  const text = readText(DECISION_MAKER_REF);
  requireSentence(
    DECISION_MAKER_REF,
    text,
    [/真实包/, /冷读/, /对抗/],
    "真实包双路",
    "一个真实包要同时走冷读和对抗，不能拿旧例、单路或合成对象顶替",
  );
  requireSentence(
    DECISION_MAKER_REF,
    text,
    [/冷读/, /对抗/, /(两件|两路|双路|各(?:自)?一份|两份|一对)/],
    "两件同源原件",
    "冷读与对抗必须是两份可核的原件，不是同一份意见写两遍",
  );
  requireSentence(
    DECISION_MAKER_REF,
    text,
    [/冷读/, /对抗/, /(同源|同一审查者|同一个审查者|同一来源|同一个人)/],
    "同源关系",
    "两件原件由同一来源/同一审查者产出，不能一份同源、一份异源混作双路",
  );
  requireSentence(
    DECISION_MAKER_REF,
    text,
    [/冷读/, /对抗/, /(执行者|执行人|agent|reviewer|审查者)/, /(会话|来源|批次|batch)/],
    "执行者与会话或来源",
    "每件原件都写实际执行者、会话或来源，不能只凭标题或两份相似意见",
  );
  requireSentence(
    DECISION_MAKER_REF,
    text,
    [/冷读/, /对抗/, /(卡节摘要|reviewed_card_sha256|sha256|摘要)/],
    "同一卡节摘要",
    "两件原件绑定同一卡节摘要/sha256，不能各绑不同版本",
  );
});

test(`${ORACLE} 异源审：独立原件不继承写作与同源审上下文，一路失效不拿另一路冒通过`, () => {
  const text = readText(DECISION_MAKER_REF);
  requireSentence(
    DECISION_MAKER_REF,
    text,
    [/异源/, /(独立|单独|另)/, /(原件|审查|审)/],
    "独立异源原件",
    "一个真实包除同源两路外还要有独立异源审原件",
  );
  requireSentence(
    DECISION_MAKER_REF,
    text,
    [/异源/, /(不继承|不沿用|不复用|不共享|不读|另起|独立于)/, /(写作|同源|上下文)/],
    "不继承写作与同源上下文",
    "异源审不得继承写作或同源审上下文，否则只是同源顶替",
  );
  requireSentence(
    DECISION_MAKER_REF,
    text,
    [/异源/, /(执行者|执行人|reviewer|agent|审查者)/, /(会话|来源|批次|batch)/, /(卡节摘要|sha256|摘要)/],
    "异源身份可核",
    "异源原件也要写执行者、会话或来源和同一卡节摘要",
  );
  requireSentence(
    DECISION_MAKER_REF,
    text,
    [/(任一路|任一条|任一件|一路|某一路|两路|双路)/, /(失效|不可用|缺件|缺失)/, /(不得|不能|禁止|不许)/, /(另一路|另一件|其他路|同源)/, /(冒|代替|顶替|视作|算|当)/],
    "一路失效不冒通过",
    "冷读、对抗或异源任一路失效时，不得用另一路冒通过，应如实记不可用",
  );
});

test(`${ORACLE} 第十步只做跨包四项，不再逐包复查`, () => {
  const block = stepBlock(STEP10_ANCHOR);
  requireMatch(
    MAKE_DECISION_REF,
    block,
    /跨包[^。\n]{0,20}(一致|一致性)|(一致|一致性)[^。\n]{0,20}跨包/,
    "跨包一致",
    "第十步四项之一：跨包一致性",
  );
  requireMatch(
    MAKE_DECISION_REF,
    block,
    /写集[^。\n]{0,20}(定序|顺序)|(定序|顺序)[^。\n]{0,20}写集|写序/,
    "写集定序",
    "第十步四项之二：写集定序（谁先写、谁后写）",
  );
  requireMatch(
    MAKE_DECISION_REF,
    block,
    /一事一值|同一事实[^。\n]{0,20}唯一(值|取值)|唯一取值/,
    "一事一值",
    "第十步四项之三：同一事实只有一个值",
  );
  requireMatch(
    MAKE_DECISION_REF,
    block,
    /十项[^。\n]{0,10}(齐|齐全)/,
    "十项齐",
    "第十步四项之四：每包十项齐全",
  );
  requireMatch(
    MAKE_DECISION_REF,
    block,
    /镜头/,
    "适用镜头",
    "第十步四项之四：十项齐及适用镜头（UI 包才加设计镜头）",
  );
  requireSentence(
    MAKE_DECISION_REF,
    block,
    [/(只|仅|不再|不|收窄|收为|收缩|限定)/, /跨包/, /(四项|四维|四类)/],
    "只做跨包四项",
    "第10步必须明确只做跨包四项，不能又回到逐包全文审",
  );
  requireSentence(
    MAKE_DECISION_REF,
    block,
    [/(不再|不|停止|取消|免去|停用)/, /(逐包|每包)/, /(复查|审|提问|投影|五问)/],
    "不再逐包复查",
    "第10步必须明确不再逐包复查/提问/投影",
  );
  assertNoPerPackageReview(MAKE_DECISION_REF, block);

  const step10 = findStep(loadSteps(), 10);
  const text10 = String(step10.observable_result ?? "");
  const step10Ref = `${STEPS_REF} 第10步`;
  requireMatch(
    step10Ref,
    text10,
    /跨包[^。\n]{0,20}(一致|一致性)|(一致|一致性)[^。\n]{0,20}跨包/,
    "跨包一致",
    "steps.json 第10步必须与 SKILL 同步写跨包一致性",
  );
  requireMatch(
    step10Ref,
    text10,
    /写集[^。\n]{0,20}(定序|顺序)|(定序|顺序)[^。\n]{0,20}写集|写序/,
    "写集定序",
    "steps.json 第10步必须与 SKILL 同步写写集定序",
  );
  requireMatch(
    step10Ref,
    text10,
    /一事一值|同一事实[^。\n]{0,20}唯一(值|取值)|唯一取值/,
    "一事一值",
    "steps.json 第10步必须与 SKILL 同步写同一事实唯一取值",
  );
  requireMatch(
    step10Ref,
    text10,
    /十项[^。\n]{0,10}(齐|齐全)/,
    "十项齐",
    "steps.json 第10步必须与 SKILL 同步写十项齐",
  );
  requireMatch(
    step10Ref,
    text10,
    /镜头/,
    "适用镜头",
    "steps.json 第10步必须保留适用镜头",
  );
  requireSentence(
    step10Ref,
    text10,
    [/(只|仅|不再|不|收窄|收为|收缩|限定)/, /跨包/, /(四项|四维|四类)/],
    "只做跨包四项",
    "steps.json 第10步的 observable_result 必须明确只做跨包四项",
  );
  requireSentence(
    step10Ref,
    text10,
    [/(不再|不|停止|取消|免去|停用)/, /(逐包|每包)/, /(复查|审|提问|投影|五问)/],
    "不再逐包复查",
    "steps.json 第10步必须明确不再逐包复查/提问/投影",
  );
  assertNoPerPackageReview(step10Ref, text10);
});

test(`${ORACLE} 异源不作机器第六件：人工读，不升格为机器判据`, () => {
  const text = readText(DECISION_MAKER_REF);
  requireSentence(
    DECISION_MAKER_REF,
    text,
    [/异源/, /(人工读|人读|人工核|人工复核)/],
    "异源人工读",
    "异源原件由独立终审者人工读，不能只留机器回执",
  );
  requireSentence(
    DECISION_MAKER_REF,
    text,
    [/异源/, /(不进|不作|不是|不加|不升格)/, /(机器|第六件|机器判据|机器字段)/],
    "不作机器第六件",
    "异源不得升格为机器第六件或机器判据，只能人工读",
  );

  const stepsText = readText(STEPS_REF);
  assert.ok(
    stepsText.includes("方案卡、质询、冷读、对抗、真实答复"),
    `${ORACLE} ${STEPS_REF} 的机器绑定五件原件名单被改动：` +
      "必须仍是「方案卡、质询、冷读、对抗、真实答复」，异源只能人工读、不得添成第六件",
  );
  assert.ok(
    !/当前异源：/.test(stepsText),
    `${ORACLE} ${STEPS_REF} 不得出现「当前异源：」这类第六件机器绑定行；异源不作机器判据`,
  );
});

test(`${ORACLE} 不改审查分级、冻结提示词或 provider`, () => {
  const steps = loadSteps();
  for (const stepId of [9, 10]) {
    const keys = collectKeys(findStep(steps, stepId));
    const forbidden = keys.filter(key =>
      /^(review_?(level|grade|tier)|prompt(_version)?|provider(_override|_route)?)$/i.test(key),
    );
    assert.deepEqual(
      forbidden,
      [],
      `${ORACLE} ${STEPS_REF} 第${stepId}步新增了审查分级/提示词/provider 机器字段：` +
        `${forbidden.join("、")}；P11 不改这些`,
    );
  }

  for (const ref of [DECISION_MAKER_REF, MAKE_DECISION_REF]) {
    const text = readText(ref);
    const grade = sentences(text).find(
      sentence =>
        /(新增|引入|改为|调整|提高|降低|重设|扩大|收紧)/.test(sentence) &&
        /(审查分级|审查等级|审查档位|审查级别)/.test(sentence) &&
        !/(不改|不新增|不调整|保持|沿用)/.test(sentence),
    );
    assert.ok(
      !grade,
      `${ORACLE} ${ref} 新增了审查分级变更：「${clip(grade)}」；P11 不改审查分级`,
    );
    const prompt = sentences(text).find(
      sentence =>
        /(冻结|修改|改写|新增|更换|重写)/.test(sentence) &&
        /提示词/.test(sentence) &&
        !/(不改|不修改|不冻结|不新增|保持|沿用|原样|不变)/.test(sentence),
    );
    assert.ok(
      !prompt,
      `${ORACLE} ${ref} 新增了冻结/改写提示词表述：「${clip(prompt)}」；P11 不改冻结审查提示词`,
    );
    const provider = sentences(text).find(
      sentence =>
        /(更换|切换|替换|改为|新增|改写)/.test(sentence) &&
        /(provider|提供方|提供者)/.test(sentence) &&
        !/(不改|不换|不新增|不替换|保持|沿用|原样|不变)/.test(sentence),
    );
    assert.ok(
      !provider,
      `${ORACLE} ${ref} 新增了 provider 变更表述：「${clip(provider)}」；P11 不换 provider`,
    );
  }

  const workflowText = readText(MAKE_DECISION_REF);
  for (const token of ["外部模型不可用", "不换执行者", "不伪造 provider_results"]) {
    assert.ok(
      workflowText.includes(token),
      `${ORACLE} ${MAKE_DECISION_REF} 缺既有 provider 不可用处置「${token}」；` +
        "P11 不得改动 provider 失败口径",
    );
  }
});

test(`${ORACLE} 对抗模板：两件同源原件字段齐全，并覆盖下游试读与包间接口`, () => {
  const text = readText(ADVERSARIAL_REF);
  requireSentence(
    ADVERSARIAL_REF,
    text,
    [/冷读/, /对抗/, /(同一个审查|同一审查者|同源)/],
    "对抗与冷读同源",
    "对抗原件必须声明与冷读同源、由同一审查者完成",
  );
  requireMatch(
    ADVERSARIAL_REF,
    text,
    /(agent|执行者)/,
    "实际执行者字段",
    "对抗原件必须写实际执行者",
  );
  requireMatch(
    ADVERSARIAL_REF,
    text,
    /(batch|批次|会话|来源)/,
    "会话或来源字段",
    "对抗原件必须写会话或来源",
  );
  requireMatch(
    ADVERSARIAL_REF,
    text,
    /(reviewed_card_sha256|卡节摘要|sha256)/,
    "同一卡节摘要字段",
    "对抗原件必须绑定同一卡节摘要/sha256",
  );
  requireSentence(
    ADVERSARIAL_REF,
    text,
    [/下游/, /(试读|首读)/],
    "下游试读问题",
    "对抗九问要覆盖下游试读：下游拿到卡后能不能读懂并接着做",
  );
  requireSentence(
    ADVERSARIAL_REF,
    text,
    [/(包间|跨包)/, /(接口|写集)/],
    "包间接口问题",
    "对抗九问要覆盖包间接口/写集，提前暴露跨包冲突",
  );
});
