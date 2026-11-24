// ORACLE-CODE-CONVERGENCE: P9「两方独立回报与修复复验可回读；正常一轮由同一原开发
// 审后提交；晚发现不另开阶段」的冻结契约。
//
// 只读三份真实文件字节，不 import 产品内部实现、不跑 git、不写产品/技能/步骤投影/
// 规格/阶段卡/决策日志。P9 的交付是执行契约正文与 steps.json 的回读声明，所以 oracle
// 就是：
//  - skills/run-phase/SKILL.md 的第 8、9 步：三角色真正照着执行时读的窄契约；
//  - workflows/build-code/SKILL.md 的「Phase 三角色与七步顺序」及第 7、9 步：完整
//    方法、第 7 步与终末承接必须仍在，P9 只接第 8、9 步；
//  - workflows/build-code/steps.json 的第 8、9 步：回读审查与复验原件。
//
// 为什么把 run-phase 第 8、9 步当作 oracle：run-phase 是「读完就能按当前 Phase 开工」
// 的独立执行契约，审查、测试与开发只读它也必须能知道两方回报何时汇合、迟到发现回哪里、
// 同因何时停。完整方法 build-code 已有部分句子；窄契约缺这些句子时，照窄契约执行的人
// 就会漏掉——这正是 P9 要补的缺口。测试不要求逐字复制，只要求语义与具名字样可定位。
//
// 覆盖（P9 卡「要覆盖」、AC-QUAL-021、decision-log 包 7/8）：
//  1. 两方独立回报：审查列 finding 与未解决项；测试列命令、退出码、失败归因与覆盖
//     限制；两方回报须在开发最后确认之前汇合。
//  2. 修复回原开发：有效问题回原实施会话，只复验受影响面；审查/测试不写代码。
//  3. 晚发现：迟到有效发现回原 Phase、原开发修，不另开阶段、不丢弃、不带到期终审。
//  4. 同因分诊：同一失败重复或一轮无新事实先停重复动作，按既有阈值分诊；改断言走
//     原请求，oracle 身份不换。
//  5. 不碰终末：终末外部单审、push/merge/归档/删除不在本段；build-code 第 7 步与
//     终末承接仍在。
//  6. 失败信息具名到 ORACLE、文件、步骤和期望字样。
//
// 本轮 RED 的目标是这些要求在 run-phase 第 8/9 步与 steps.json 中尚未写出（完整方法
// build-code 已有部分句子，所以不能只测 build-code），不是导入、语法或装置错误。
// 真实两方回报、迟到修复与复验原件由 P9 验收阶段用既有 capture 产生；本文件不伪造
// 回执、提交或独立审查结论。
import assert from "node:assert/strict";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = realpathSync(join(dirname(fileURLToPath(import.meta.url)), "..", ".."));
const ORACLE = "ORACLE-CODE-CONVERGENCE";
const RUN_PHASE_REF = "skills/run-phase/SKILL.md";
const BUILD_CODE_REF = "workflows/build-code/SKILL.md";
const STEPS_REF = "workflows/build-code/steps.json";
const STEP7 = "step-scan-diff";
const STEP8 = "step-review-change";
const STEP9 = "step-analyze-review-findings";

const readText = ref => readFileSync(join(ROOT, ref), "utf8");
const clip = value => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > 700 ? `${text.slice(0, 700)}…` : text;
};

/**
 * 取一个锚到下一个步骤锚之间的正文。run-phase 的锚紧接自己的 `## 第 N 步` 标题，
 * 以「下一个步骤锚」或尾节标题收口；build-code 的步骤是编号列表，按下一个
 * `N. <a id="step-…">` 收口。
 */
function anchoredSection(text, anchor, ref, { numbered = false } = {}) {
  const marker = `<a id="${anchor}"></a>`;
  const start = text.indexOf(marker);
  assert.ok(start >= 0,
    `${ORACLE} 装置失效：${ref} 找不到锚 ${marker}；P9 的目标方法必须先可跳转，本文件不替代它们`);
  const rest = text.slice(start + marker.length);
  const end = numbered
    ? rest.search(/\n\d+\.\s*<a id="step-/)
    : rest.search(/\n(?:<a id="step-|## 与完整方法的关系)/);
  return end < 0 ? text.slice(start) : text.slice(start, start + marker.length + end);
}

const runPhaseStep = anchor => anchoredSection(readText(RUN_PHASE_REF), anchor, RUN_PHASE_REF);
const buildCodeStep = anchor =>
  anchoredSection(readText(BUILD_CODE_REF), anchor, BUILD_CODE_REF, { numbered: true });
const runPhaseConvergence = () => [runPhaseStep(STEP8), runPhaseStep(STEP9)].join("\n");

/** build-code 的「Phase 三角色与七步顺序」整节，含七步后的两方回报/提交/迟到段。 */
function phaseRolesSection() {
  const marker = "### Phase 三角色与七步顺序\n";
  const text = readText(BUILD_CODE_REF);
  const start = text.indexOf(marker);
  assert.ok(start >= 0,
    `${ORACLE} 装置失效：${BUILD_CODE_REF} 缺「Phase 三角色与七步顺序」节；P9 只接第 8、9 步，不能删掉原三角色方法`);
  const rest = text.slice(start + marker.length);
  const end = rest.search(/\n## /);
  return end < 0 ? rest : rest.slice(0, end);
}

/** 每条要求都带具名期望，失败时直接指到 ORACLE、文件、步骤与缺的字样。 */
function requireAll(label, text, items) {
  for (const [pattern, name, expected] of items) {
    assert.match(text, pattern,
      `${ORACLE} ${label} 缺「${name}」：${expected}；实际正文：${clip(text)}`);
  }
}

test(`${ORACLE} 装置：三份目标文件、方法锚与第 8/9 步路由可读`, () => {
  for (const ref of [RUN_PHASE_REF, BUILD_CODE_REF, STEPS_REF]) {
    assert.ok(existsSync(join(ROOT, ref)),
      `${ORACLE} 缺 ${ref}：P9 的冻结契约只能从真实方法字节与步骤投影读取`);
  }

  const runPhase = readText(RUN_PHASE_REF);
  const buildCode = readText(BUILD_CODE_REF);
  for (const anchor of [STEP7, STEP8, STEP9]) {
    assert.ok(runPhase.includes(`<a id="${anchor}"></a>`),
      `${ORACLE} ${RUN_PHASE_REF} 缺锚 #${anchor}：P9 的回报、复验与分诊必须仍能从第 7–9 步定位`);
    assert.ok(buildCode.includes(`<a id="${anchor}"></a>`),
      `${ORACLE} ${BUILD_CODE_REF} 缺锚 #${anchor}：P9 只接第 8、9 步，不能改写第 7 步或终末承接的锚`);
  }

  const steps = JSON.parse(readText(STEPS_REF));
  for (const [stepId, anchor] of [[8, STEP8], [9, STEP9]]) {
    const step = steps.steps.find(item => item.step_id === stepId);
    assert.ok(step,
      `${ORACLE} ${STEPS_REF} 缺第 ${stepId} 步：两方回报与复验回读失去真实步骤路由`);
    assert.equal(step.method_anchor, anchor,
      `${ORACLE} ${STEPS_REF} 第 ${stepId} 步的 method_anchor 是 ${step.method_anchor}，期望 ${anchor}`);
    assert.equal(step.skill, `${RUN_PHASE_REF}#${anchor}`,
      `${ORACLE} ${STEPS_REF} 第 ${stepId} 步的 skill 是 ${step.skill}，期望 ${RUN_PHASE_REF}#${anchor}`);
  }
});

test(`${ORACLE} 两方独立回报：审查列 finding 与未解决项，测试列命令、退出码、失败归因与覆盖限制`, () => {
  const label = `${RUN_PHASE_REF}#${STEP8}/${STEP9}`;
  const text = runPhaseConvergence();

  requireAll(label, text, [
    [/(?:审查)[^。\n]{0,24}(?:回报|回件|报告)[^。\n]{0,48}(?:finding|发现)[^。\n]{0,24}(?:未解决|未解)/,
      "审查回报列 finding 与未解决项",
      "P9 要求审查方明确回报发现的 finding 和仍未解决项，不能只交三维读数或空结论"],
    [/(?:测试)[^。\n]{0,24}(?:回报|回件|报告)[^。\n]{0,96}命令[^。\n]{0,40}退出码/,
      "测试回报列命令与退出码",
      "P9 要求测试方回报实际执行的命令与退出码，不能只写“已通过”"],
    [/(?:测试)[^。\n]{0,24}(?:回报|回件|报告)[^。\n]{0,96}失败归因/,
      "测试回报列失败归因",
      "P9 要求测试方把失败归到目标、环境或夹具，不能只给绿色结论"],
    [/(?:测试)[^。\n]{0,24}(?:回报|回件|报告)[^。\n]{0,96}覆盖限制/,
      "测试回报列覆盖限制",
      "P9 要求测试方说明哪一面未跑、卡在哪或什么条件下能跑，不能把未覆盖当通过"],
  ]);
});

test(`${ORACLE} 两方回报须在开发最后确认之前汇合`, () => {
  const label = `${RUN_PHASE_REF}#${STEP8}/${STEP9}`;
  const text = runPhaseConvergence();

  requireAll(label, text, [
    [/(?:最后确认|最终确认)[^。\n]{0,16}之前[^。\n]{0,24}(?:汇合|汇齐|合流)|(?:汇合|汇齐|合流)[^。\n]{0,24}(?:再|才)[^。\n]{0,12}最后确认/,
      "两方回报在开发最后确认之前汇合",
      "P9 要求两方回报先汇合、开发才能最后确认；开发确认只表示写主无待改项，不能替代两方回报"],
    [/(?:两方|两路|审查与测试)[^。\n]{0,32}(?:回报|回件|报告)[^。\n]{0,32}(?:汇合|汇齐|合流)/,
      "两方回报汇合",
      "P9 要求审查与测试两个独立来源的回报汇合后再收口，不能只到一路就宣布完成"],
  ]);
});

test(`${ORACLE} 修复回原开发：有效问题回原实施会话，只复验受影响面，审查/测试不写代码`, () => {
  const step9 = runPhaseStep(STEP9);
  const full = readText(RUN_PHASE_REF);

  assert.match(step9, /有效(?:问题|finding)[^。\n]{0,24}(?:回|交)[^。\n]{0,16}原实施/,
    `${ORACLE} ${RUN_PHASE_REF}#${STEP9} 缺「有效问题回原实施会话」：` +
    "P9 要求修复回原开发同一会话，不能另换写主或让审查/测试代修；" +
    `实际正文：${clip(step9)}`);
  assert.match(step9, /(?:只|仅)[^。\n]{0,12}(?:跑|复验|复测|重跑)[^。\n]{0,24}(?:受影响|该集合)/,
    `${ORACLE} ${RUN_PHASE_REF}#${STEP9} 缺「只复验受影响面」：` +
    "P9 要求先列受影响 file/case，再只跑该集合，不重做全量或重派正常审查；" +
    `实际正文：${clip(step9)}`);
  assert.match(full, /(?:审查与测试|审查、测试)[^。\n]{0,16}(?:只读|不写代码|不改代码)/,
    `${ORACLE} ${RUN_PHASE_REF} 缺「审查/测试不写代码」：` +
    "P9 要求开发是唯一写主，审查与测试只读执行并保存回执，不能修改产品、测试或材料");
  assert.match(full, /开发[^。\n]{0,16}(?:唯一写|唯一 writer)/,
    `${ORACLE} ${RUN_PHASE_REF} 缺「开发唯一 writer」：` +
    "P9 的修复回原开发以唯一写主为前提，不能出现第二个写者");
});

test(`${ORACLE} 晚发现：迟到有效发现回原 Phase、原开发，不另开阶段、不丢弃、不带到期终审`, () => {
  const label = `${RUN_PHASE_REF}#${STEP8}/${STEP9}`;
  const text = runPhaseConvergence();

  requireAll(label, text, [
    [/(?:迟到|晚发现)/,
      "迟到/晚发现",
      "P9 要求迟到有效发现仍按晚发现条款处理，不能当作没发生"],
    [/(?:原|同一)\s*(?:Phase|阶段)/,
      "回原/同一 Phase",
      "P9 要求迟到发现回原 Phase，不另开阶段"],
    [/(?:原|同一)开发(?:子代理|者|会话)?/,
      "回原开发",
      "P9 要求由原开发修复，保持同一开发上下文，不静默换写主"],
    [/不(?:另|新)(?:开|建)[^。\n]{0,8}(?:Phase|阶段)/,
      "不另开阶段",
      "P9 明确迟到发现不另开 Phase/阶段"],
    [/不(?:得)?[^。\n]{0,8}(?:丢弃|丢掉)/,
      "不丢弃",
      "P9 要求迟到有效发现不得丢弃"],
    [/不(?:得|能)?(?:只)?带[^。\n]{0,8}终审/,
      "不带到期终审",
      "P9 要求迟到发现不推到终末外部单审才处理"],
  ]);
});

test(`${ORACLE} 同因先停重复动作并按既有阈值分诊；改断言走原请求、oracle 身份不换`, () => {
  const label = `${RUN_PHASE_REF}#${STEP8}/${STEP9}`;
  const text = runPhaseConvergence();

  requireAll(label, text, [
    [/(?:同一|同类)失败|同因/,
      "同一失败/同因",
      "P9 要求按同目标行为、同归因与同入口识别同因，不用错误字符串或运行级签名"],
    [/(?:重复|再次|两次|第二次|再出现)/,
      "重复出现",
      "P9 要求同一失败重复出现时先停重复动作，不盲目重试"],
    [/(?:一轮)?(?:没有|无)新事实/,
      "无新事实",
      "P9 要求一轮没有新事实时也先停重复动作并按既有阈值分诊"],
    [/先停[^。\n]{0,12}(?:重复动作|重复|该动作)/,
      "先停重复动作",
      "P9 要求先停重复动作，再做根因/验收复杂度/更简单替代三检查"],
    [/(?:既有|同一|原)阈值|分诊/,
      "按既有阈值分诊",
      "P9 要求沿用既有分诊阈值，不新造次数或时长上限"],
    [/改断言[^。\n]{0,24}(?:原请求|原变更请求|TCR)/,
      "改断言走原请求",
      "P9 要求改冻结断言先走原变更请求与独立审查，不能为求绿弱化断言"],
    [/oracle[^。\n]{0,16}身份[^。\n]{0,8}(?:不换|不变)/,
      "oracle 身份不换",
      "P9 要求判定器身份保持不变，改断言不改 oracle 身份"],
  ]);
});

test(`${ORACLE} 不碰终末：终末外部单审、push/merge/归档/删除不在本段`, () => {
  const label = `${RUN_PHASE_REF}#${STEP8}/${STEP9} 或 ${BUILD_CODE_REF}#${STEP9}`;
  const text = [runPhaseStep(STEP8), runPhaseStep(STEP9), buildCodeStep(STEP9)].join("\n");

  requireAll(label, text, [
    [/(?:终末|外部)[^。\n]{0,16}(?:单审|审)[^。\n]{0,24}(?:不在|不入|不属于|不进)|不(?:在|执行|发起|进入)[^。\n]{0,12}(?:终末|外部)[^。\n]{0,12}(?:单审|审)/,
      "终末外部单审不在本段",
      "P9 明确终末外部单审属于最后一段，不在本次独立收敛内提前执行或冒充"],
    [/(?:push|merge|PR|归档|删除|清理)[^。\n]{0,24}(?:不在|不入|不属于|不进|归\s*stage-close)|不(?:在|执行|做|进)[^。\n]{0,12}(?:push|merge|PR|归档|删除|清理)/i,
      "push/merge/归档/删除不在本段",
      "P9 明确物理交付与清理归 stage-close，本段不 push、不 merge、不归档、不删除"],
  ]);
});

test(`${ORACLE} steps.json 第 8/9 步回读审查与复验原件`, () => {
  const steps = JSON.parse(readText(STEPS_REF));
  const byId = id => {
    const step = steps.steps.find(item => item.step_id === id);
    assert.ok(step,
      `${ORACLE} ${STEPS_REF} 缺第 ${id} 步：P9 的回读声明只能落在真实步骤投影上`);
    return step;
  };
  const step8 = byId(8);
  const step9 = byId(9);
  const readback = `${step8.observable_result}\n${step9.observable_result}`;

  assert.match(readback, /回读/,
    `${ORACLE} ${STEPS_REF} 第 8/9 步 observable_result 缺「回读」：` +
    "P9 要求回读审查及复验原件，不能只凭阶段行或绿色摘要冒可回读；" +
    `实际第 9 步：${clip(step9.observable_result)}`);
  assert.match(readback, /审查[^。\n]{0,24}原件|原件[^。\n]{0,24}审查/,
    `${ORACLE} ${STEPS_REF} 第 8/9 步 observable_result 缺「审查原件」：` +
    "P9 要求回读审查原件，不能只记审查通过或空 findings");
  assert.match(readback, /复验[^。\n]{0,24}原件|原件[^。\n]{0,24}复验/,
    `${ORACLE} ${STEPS_REF} 第 8/9 步 observable_result 缺「复验原件」：` +
    "P9 要求回读受影响复验原件，不能只写已修复");

  // 既有事实必须保留：两方实际回报汇合、受影响复验、开发最后确认。
  assert.match(step9.observable_result, /两方/,
    `${ORACLE} ${STEPS_REF} 第 9 步丢了「两方」实际回报：P9 要求审查与测试各自回报后汇合`);
  assert.match(step9.observable_result, /汇合/,
    `${ORACLE} ${STEPS_REF} 第 9 步丢了「汇合」：P9 要求两方回报在开发最后确认前汇合`);
  assert.match(step9.observable_result, /(?:受影响[^。\n]{0,12}复验|复验[^。\n]{0,12}受影响)/,
    `${ORACLE} ${STEPS_REF} 第 9 步丢了「受影响复验」：P9 要求只复核修复影响到的面`);
  assert.match(step9.observable_result, /最后确认/,
    `${ORACLE} ${STEPS_REF} 第 9 步丢了「开发最后确认」：P9 要求两方回报汇合后开发再确认`);
});

test(`${ORACLE} 回归：build-code 保留第 7 步、终末承接与既有两方回报/提交/迟到条款`, () => {
  const full = readText(BUILD_CODE_REF);
  for (const anchor of [STEP7, STEP8, STEP9]) {
    assert.ok(full.includes(`<a id="${anchor}"></a>`),
      `${ORACLE} ${BUILD_CODE_REF} 缺锚 #${anchor}：P9 只接第 8、9 步，不得删除第 7 步或复查入口`);
  }
  for (const [pattern, name] of [
    [/## 最后 Phase：终末承接/, "终末承接小节"],
    [/终末独立审查/, "终末独立审查"],
    [/stage-close/, "stage-close 交付边界"],
  ]) {
    assert.match(full, pattern,
      `${ORACLE} ${BUILD_CODE_REF} 缺「${name}」：P9 不碰终末，终末承接必须原样保留`);
  }

  const roles = phaseRolesSection();
  for (const [pattern, name] of [
    [/两方回报须在开发最后确认之前汇合/, "两方回报先于开发最后确认汇合"],
    [/迟到 finding[^。\n]{0,24}重开同一 Phase/, "迟到 finding 回同一 Phase"],
    [/每轮审后一次提交/, "每轮审后一次提交"],
    [/同一开发(?:子代理|上下文)/, "同一开发上下文"],
  ]) {
    assert.match(roles, pattern,
      `${ORACLE} ${BUILD_CODE_REF}「Phase 三角色与七步顺序」缺「${name}」：` +
      "P9 只接第 8、9 步，原有正常一轮与迟到条款不能被删弱；" +
      `实际正文：${clip(roles)}`);
  }
});
