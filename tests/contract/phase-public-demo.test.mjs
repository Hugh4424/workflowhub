// ORACLE-PUBLIC-SLICE: P8「公开入口实际写出用户能复读的效果；坏输入命中具名拒绝；
// 目标失败发生在实现前」的冻结契约。
//
// 只读真实文件字节与 steps.json，不 import 产品内部函数、不跑 git、不写产品/技能/
// 步骤投影/规格/阶段卡/决策日志。P8 的实现对象是方法正文，所以 oracle 就是：
//  - skills/run-phase/SKILL.md 的第 2、3 步方法正文；
//  - workflows/build-code/SKILL.md 第 9 步的 P9 邻接声明；
//  - workflows/build-code/steps.json 的既有步骤路由（只作装置前置，不另立投影）。
// 没有公开 CLI 会分类“演示 / 目标 RED”样本（check-stage-steps 只读声明的技能引用），
// 因此两个坏输入用静态样本 + 方法正文「拒认」点名来判，不新增第二检查器。
//
// 覆盖（P8 卡「要覆盖」、AC-QUAL-020、decision-log 包 7/8）：
//  1. 第 2 步 #step-write-red-tests 要求实跑冻结目标测试拿真 RED，保存命令/退出码/
//     原始输出；导入/环境/配置失败另记、不算目标 RED；无 RED 不进实现；顺序在。
//  2. 第 3 步 #step-implement-change 要求最小纵切接公开入口、真实输入到真实输出；
//     内部函数返回不算演示。
//  3. 坏输入样本 ①「把内部函数返回当演示」在第 3 步「拒认」被点名拒绝；
//     ②「把导入失败当目标 RED」在第 2 步「拒认」被点名拒绝。
//  4. build-code 第 9 步 #step-analyze-review-findings 只消费本段真 RED、演示、写入
//     与读回，不重复实现（P9 邻接）。
//  5. 生产/阈值/终末审/Git 授权没有被引入本阶段方法；只允许显式排除句。
//  6. 失败信息具名到 ORACLE、文件、步骤和期望字样。
//
// 本轮 RED 的目标是这些方法要求尚未写进正文（例如缺「真 RED」「另记不算目标 RED」
// 「无 RED 不进实现」「真实输入到真实输出」「内部函数返回不算演示」、第 9 步消费
// 声明和坏输入点名），不是导入、语法或装置错误。真正跑目标测试与公开入口的原件由
// P8 验收阶段用既有 capture 产生；本文件不伪造回执、演示或退出码。
import assert from "node:assert/strict";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = realpathSync(join(dirname(fileURLToPath(import.meta.url)), "..", ".."));
const ORACLE = "ORACLE-PUBLIC-SLICE";
const RUN_PHASE_REF = "skills/run-phase/SKILL.md";
const BUILD_CODE_REF = "workflows/build-code/SKILL.md";
const STEPS_REF = "workflows/build-code/steps.json";
const STEP2 = "step-write-red-tests";
const STEP3 = "step-implement-change";
const STEP4 = "step-inspect-and-route-actual-tests";
const STEP5 = "step-run-tests";
const STEP6 = "step-inspect-acceptance-and-ui";
const STEP7 = "step-scan-diff";
const STEP8 = "step-review-change";
const STEP9 = "step-analyze-review-findings";
const EIGHT_ANCHORS = [STEP2, STEP3, STEP4, STEP5, STEP6, STEP7, STEP8, STEP9];

const readText = ref => readFileSync(join(ROOT, ref), "utf8");
const clip = value => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > 700 ? `${text.slice(0, 700)}…` : text;
};

/**
 * 取一个锚到下一个步骤锚（或下一个二级标题）之间的正文。
 * build-code 的方法步骤是编号列表，所以用 numbered 按下一个 `N. <a id="step-…">` 收口。
 */
function anchoredSection(text, anchor, ref, { numbered = false } = {}) {
  const marker = `<a id="${anchor}"></a>`;
  const start = text.indexOf(marker);
  assert.ok(start >= 0,
    `${ORACLE} 装置失效：${ref} 找不到锚 ${marker}；P3 建立的八个步骤锚必须先可跳转，本文件不替代它们`);
  const rest = text.slice(start + marker.length);
  // run-phase 的锚紧接自己的 `## 第 N 步` 标题，所以不能按“下一个二级标题”收口；
  // 以“下一个步骤锚”或尾节标题为界。
  const end = numbered
    ? rest.search(/\n\d+\.\s*<a id="step-/)
    : rest.search(/\n(?:<a id="step-|## 与完整方法的关系)/);
  return end < 0 ? text.slice(start) : text.slice(start, start + marker.length + end);
}

const runPhaseStep = anchor => anchoredSection(readText(RUN_PHASE_REF), anchor, RUN_PHASE_REF);
const buildCodeStep = anchor =>
  anchoredSection(readText(BUILD_CODE_REF), anchor, BUILD_CODE_REF, { numbered: true });

/** 方法正文里的具名拒绝行；坏输入必须在这里被点名，而不是只散落在首动作。 */
function refusalBullet(section, label) {
  const line = section.split(/\r?\n/).find(item => /^\s*-\s*\*\*拒认\*\*/.test(item));
  assert.ok(line,
    `${ORACLE} ${label} 缺「- **拒认**」段：P8 要求坏输入命中具名拒绝，拒认必须可定位`);
  return line;
}

/** 按顺序断言字样：前一项必须真的先出现，防止把实现写在目标失败之前。 */
function requireOrder(label, text, items) {
  let cursor = -1;
  for (const [pattern, name] of items) {
    const match = pattern.exec(text);
    assert.ok(match,
      `${ORACLE} ${label} 缺「${name}」：期望正文匹配 ${pattern}；P8 卡要求该要求真实写进本步方法`);
    assert.ok(match.index > cursor,
      `${ORACLE} ${label} 的顺序不对：「${name}」必须晚于上一项出现；` +
      `实际位置 ${match.index}，上一项位置 ${cursor}。P8 要求目标失败、保存与坏输入判定发生在实现之前`);
    cursor = match.index;
  }
}

test(`${ORACLE} 装置：方法文件、八个步骤锚与步骤路由可读`, () => {
  for (const ref of [RUN_PHASE_REF, BUILD_CODE_REF, STEPS_REF]) {
    assert.ok(existsSync(join(ROOT, ref)),
      `${ORACLE} 缺 ${ref}：P8 的冻结契约只能从真实方法字节与步骤投影读取`);
  }
  const runPhase = readText(RUN_PHASE_REF);
  const buildCode = readText(BUILD_CODE_REF);
  for (const anchor of EIGHT_ANCHORS) {
    assert.ok(runPhase.includes(`<a id="${anchor}"></a>`),
      `${ORACLE} ${RUN_PHASE_REF} 缺锚 #${anchor}：P3 建立的执行方法入口被改，后续断言无处可读`);
    assert.ok(buildCode.includes(`<a id="${anchor}"></a>`),
      `${ORACLE} ${BUILD_CODE_REF} 缺锚 #${anchor}：完整方法与运行技能必须仍能互相跳转`);
  }

  const steps = JSON.parse(readText(STEPS_REF));
  for (const [stepId, anchor] of [[2, STEP2], [3, STEP3], [9, STEP9]]) {
    const step = steps.steps.find(item => item.step_id === stepId);
    assert.ok(step, `${ORACLE} ${STEPS_REF} 缺第 ${stepId} 步：P8 的演示/红测方法失去真实步骤路由`);
    assert.equal(step.method_anchor, anchor,
      `${ORACLE} ${STEPS_REF} 第 ${stepId} 步的 method_anchor 是 ${step.method_anchor}，期望 ${anchor}`);
    assert.equal(step.skill, `${RUN_PHASE_REF}#${anchor}`,
      `${ORACLE} ${STEPS_REF} 第 ${stepId} 步的 skill 是 ${step.skill}，期望 ${RUN_PHASE_REF}#${anchor}`);
  }

  const order = [STEP2, STEP3, STEP4]
    .map(anchor => runPhase.indexOf(`<a id="${anchor}"></a>`));
  assert.ok(order[0] >= 0 && order[1] > order[0] && order[2] > order[1],
    `${ORACLE} ${RUN_PHASE_REF} 的步骤顺序被改：${STEP2} → ${STEP3} → ${STEP4} 必须保持，` +
    "P8 要求目标失败先于实现，实现先于按实际差异选测试面");
});

test(`${ORACLE} 第 2 步先证目标失败：真 RED、保存原件、坏输入另记、无 RED 不进实现`, () => {
  const label = `${RUN_PHASE_REF}#${STEP2}`;
  const section = runPhaseStep(STEP2);

  for (const [pattern, name] of [
    [/(?:导入|环境|配置)/, "导入/环境/配置三类装置失败"],
    [/导入/, "导入失败"],
    [/环境/, "环境失败"],
    [/配置/, "配置失败"],
    [/(?:另记|另列|单独记|分开记|单列)/, "装置失败另记，不并进目标 RED"],
  ]) {
    assert.match(section, pattern,
      `${ORACLE} ${label} 缺「${name}」：P8 要求导入、环境、配置失败另记并标明不是目标 RED；` +
      `实际正文：${clip(section)}`);
  }

  assert.match(section, /(?:真|目标)\s*RED/,
    `${ORACLE} ${label} 缺「真 RED」：P8 要求明确失败发生在目标断言，而不是导入、环境或配置；` +
    `实际正文：${clip(section)}`);

  requireOrder(label, section, [
    [/(?:实跑|运行|跑)[^。\n]{0,24}(?:冻结|目标)[^。\n]{0,12}(?:测试|断言)/, "实跑冻结目标测试"],
    [/保存[^。\n]{0,30}命令[^。\n]{0,30}退出码[^。\n]{0,30}原始输出/, "保存命令、退出码与原始输出"],
    [/(?:另记|另列|单独记|分开记|单列)/, "装置失败另记"],
    [/(?:不算|不能(?:当|算)|不得(?:当|算)|不是)[^。\n]{0,16}(?:目标\s*)?RED/, "装置失败不算目标 RED"],
    [/(?:无|没有|未取得?)\s*(?:真\s*|目标\s*)?RED[^。\n]{0,24}(?:不进入?实现|不进(?:入)?第\s*[3三]\s*步|不得(?:进入)?实现|不开始实现)/,
      "无 RED 不进实现"],
  ]);

  const full = readText(RUN_PHASE_REF);
  const step2At = full.indexOf(`<a id="${STEP2}"></a>`);
  const step3At = full.indexOf(`<a id="${STEP3}"></a>`);
  const gate = /(?:不进入?实现|不进(?:入)?第\s*[3三]\s*步|不得(?:进入)?实现|不开始实现)/.exec(section);
  assert.ok(gate && step2At + gate.index < step3At,
    `${ORACLE} ${label} 的「无 RED 不进实现」没有写在第 2 步且先于 #${STEP3}：` +
    "P8 要求目标失败发生在实现前，不能先实现再补测");
});

test(`${ORACLE} 第 3 步公开入口演示：最小纵切、真实输入到真实输出、内部返回不算演示`, () => {
  const label = `${RUN_PHASE_REF}#${STEP3}`;
  const section = runPhaseStep(STEP3);
  requireOrder(label, section, [
    [/最小纵切/, "最小纵切"],
    [/(?:公开入口|真实入口)/, "接公开入口/真实入口"],
    [/真实输入[^。\n]{0,24}真实输出/, "真实输入到真实输出"],
    [/内部函数/, "内部函数返回"],
    [/(?:不算|不是|不能算|不得算|冒)[^。\n]{0,12}演示/, "内部函数返回不算演示"],
  ]);
});

test(`${ORACLE} 坏输入 1：把内部函数返回当演示 → 第 3 步拒认点名拒绝`, () => {
  const sample = {
    id: "demo-internal-return",
    input: "把内部函数的返回值当作公开入口的演示输出",
    expected: "第 3 步拒认必须写明内部函数返回不算演示",
  };
  const section = runPhaseStep(STEP3);
  const refusal = refusalBullet(section, `坏输入 ${sample.id}（${sample.input}）`);

  assert.match(refusal, /内部函数/,
    `${ORACLE} 坏输入 ${sample.id}「${sample.input}」没有被第 3 步「拒认」点名：` +
    "P8 要求把内部函数调用/返回当演示的坏输入具名拒绝，不能只写「真实入口」而不点坏例；" +
    `实际拒认：${clip(refusal)}`);
  assert.match(refusal, /(?:不算|不是|不能算|不得算)[^。\n]{0,12}演示/,
    `${ORACLE} 坏输入 ${sample.id} 在拒认里没有被判为不算演示：` +
    "P8 要求内部函数返回不算公开入口演示；" +
    `实际拒认：${clip(refusal)}`);
});

test(`${ORACLE} 坏输入 2：把导入失败当目标 RED → 第 2 步拒认点名拒绝`, () => {
  const sample = {
    id: "red-import-failure",
    input: "测试因导入失败非零，被记作目标 RED",
    expected: "导入失败另记、不算目标 RED",
  };
  const section = runPhaseStep(STEP2);
  const refusal = refusalBullet(section, `坏输入 ${sample.id}（${sample.input}）`);

  assert.match(section, /(?:另记|另列|单独记|分开记|单列)/,
    `${ORACLE} 坏输入 ${sample.id}：第 2 步没有要求把导入/环境/配置失败另记；` +
    `${sample.expected}；实际正文：${clip(section)}`);
  assert.match(refusal, /导入/,
    `${ORACLE} 坏输入 ${sample.id}「${sample.input}」没有被第 2 步「拒认」点名：` +
    "P8 要求拿导入失败冒目标 RED 是具名坏例；" +
    `实际拒认：${clip(refusal)}`);
  assert.match(refusal, /(?:不算|不能(?:当|算)|不得(?:当|算)|不是)[^。\n]{0,16}(?:目标\s*)?RED/,
    `${ORACLE} 坏输入 ${sample.id} 在拒认里没有被判为不算目标 RED：` +
    `${sample.expected}，且必须说明失败发生在目标断言而不是装置；` +
    `实际拒认：${clip(refusal)}`);
});

test(`${ORACLE} P9 邻接：build-code 第 9 步只消费本段真 RED、演示、写入与读回，不重复实现`, () => {
  const label = `${BUILD_CODE_REF}#${STEP9}`;
  const section = buildCodeStep(STEP9);

  assert.match(section, /只消费[^。\n]{0,80}(?:真\s*)?RED[^。\n]{0,80}演示[^。\n]{0,80}写入[^。\n]{0,80}读回/,
    `${ORACLE} ${label} 必须声明「只消费本段真 RED、演示、写入与读回」：` +
    "P8/P9 邻接要求后段消费本段原件，不重新证明一遍；" +
    `实际正文：${clip(section)}`);
  assert.match(section, /真\s*RED/,
    `${ORACLE} ${label} 的消费声明缺「真 RED」：P9 只认本段实施前取得的目标失败原件，` +
    "不把后补或装置失败当 RED");
  assert.match(section, /不重复实现|不重新实现|不重做|不另实现/,
    `${ORACLE} ${label} 缺「不重复实现」：P8 要求第 9 步消费前段原件，不把演示/红测重做一次当自己的结果；` +
    `实际正文：${clip(section)}`);
});

// 生产/阈值/终末审/Git 授权是 P8 有意不做的边界。方法正文只允许把它们写成排除句，
// 不允许引入任何改变生产、调整阈值、执行终末审或授予 Git 授权的动作。
const BOUNDARY_TOKENS = [
  [/生产/, "生产"],
  [/(?:调整|改|变更|放宽|校准)\s*(?:总\s*)?阈值|阈值\s*(?:调整|变更|放宽)/, "阈值"],
  [/终末审/, "终末审"],
  [/(?:Git|git)\s*授权|提交授权/, "Git 授权"],
];

function assertBoundaryOnly(label, text) {
  for (const [pattern, name] of BOUNDARY_TOKENS) {
    const global = new RegExp(pattern.source, "g");
    let match;
    while ((match = global.exec(text)) !== null) {
      const before = text.slice(Math.max(0, match.index - 24), match.index);
      if (/(?:不碰|不改|不调整|不涉及|不做|不进入|不得|禁止|不)/.test(before)) continue;
      assert.fail(
        `${ORACLE} ${label} 引入了「${name}」：P8 有意不做不碰生产或阈值、终末审、Git 授权；` +
        `只允许显式排除句。实际上下文：` +
        clip(text.slice(Math.max(0, match.index - 40), match.index + match[0].length + 40)));
    }
  }
}

test(`${ORACLE} 边界：生产、阈值、终末审与 Git 授权没有被引入本阶段方法`, () => {
  assertBoundaryOnly(RUN_PHASE_REF, readText(RUN_PHASE_REF));
  assertBoundaryOnly(`${BUILD_CODE_REF}#${STEP2}`, buildCodeStep(STEP2));
  assertBoundaryOnly(`${BUILD_CODE_REF}#${STEP3}`, buildCodeStep(STEP3));
});
