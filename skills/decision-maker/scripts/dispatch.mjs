#!/usr/bin/env node
// 由上下文包生成两个角色、三个实例的 brief（执行者、同源审查、异源）供主持人派发。这里只产出文字；
// 真实派发、真实回传和真实用户答复都在主持人那边发生，脚本不代跑。
import fs from 'node:fs';
import path from 'node:path';

const REQUIRED = [
  'name',
  'goal',
  'requirements',
  'evidence',
  'boundaries',
  'acceptance',
  'open_questions',
  'output_path',
];

const HANDOFF = `回传固定六项：任务；结论与状态；已做与未做；产物或原件引用（路径 + sha256）；
失败与限制；下一消费者动作。不整份继承父会话，只拿本角色摘要与原件指针。`;

function usage() {
  console.error('usage: node dispatch.mjs <package-context.json> [--out <dir>]');
  process.exit(2);
}

function list(value) {
  const items = Array.isArray(value) ? value : [value];
  return items.map((item) => `- ${item}`).join('\n');
}

function main() {
  const argv = process.argv.slice(2);
  const outIndex = argv.indexOf('--out');
  if (outIndex >= 0 && (argv[outIndex + 1] === undefined || argv[outIndex + 1].startsWith('--'))) usage();
  const ctxPath = argv.find((arg, index) => !arg.startsWith('--') && index !== outIndex + 1);
  if (!ctxPath) usage();
  let ctx;
  try {
    ctx = JSON.parse(fs.readFileSync(ctxPath, 'utf8'));
  } catch (error) {
    console.error(`读不到上下文包：${ctxPath}：${error.message}`);
    process.exit(2);
  }
  if (!ctx || typeof ctx !== 'object') {
    console.error(`上下文包不是对象：${ctxPath}`);
    process.exit(2);
  }
  const missing = REQUIRED.filter((key) => !ctx[key] || (Array.isArray(ctx[key]) && ctx[key].length === 0));
  if (missing.length) {
    console.error(`missing context fields: ${missing.join(', ')}`);
    process.exit(1);
  }
  const outDir = outIndex >= 0 ? path.resolve(argv[outIndex + 1]) : path.dirname(path.resolve(ctxPath));
  fs.mkdirSync(outDir, { recursive: true });
  const contextRef = path.resolve(ctxPath);
  const header = `# ${ctx.name}\n\n- 上下文包：${contextRef}\n- 本包输出目录：${ctx.output_path}\n- 上下文模式：只读上面这一页加下列指针；不继承父会话，不读别的包材料。\n`;
  const requirements = `## 本包要接的需求\n\n${list(ctx.requirements)}\n`;
  const open = `## 开放问题与定的人\n\n${list(ctx.open_questions)}\n`;
  const acceptance = `## 验收四件（通过条件、失败条件、至少一个反例、证据）\n\n${list(ctx.acceptance)}\n`;

  const executor = `${header}
## 目标

${ctx.goal}

${requirements}
## 读什么

${list(ctx.evidence)}

## 边界

${list(ctx.boundaries)}

## 做什么

1. 做调研并给候选：内部看仓库与现有材料，外部看检索结果与正式文档；每条事实写「路径:行号 + 结论」；至少 3 个方向不同的候选，至少 1 个结构性方案（改技能/加脚本/并行/复用现有机制），至少 1 个被否并写代价与适用条件。
2. 写影响面清单八类：直接改动、调用方/消费者、配置/权限/凭据、数据/合同/版本迁移、旧代码/开关/文档/测试的移除、测试/验收/监控、文档/页面/交接、跨包/跨阶段依赖；每类写改什么、迁什么、删什么、影响谁、证据、owner，不知道写 unknown 和谁补。
3. 收敛：选能解决问题的最小那条，写清适用预算与来源（每包最多 3 个实例，来源 decision-log.md:63,317、\`skills/decision-maker/SKILL.md\` 的「并行规则」节）。调研阶段不给方案，收敛与写卡在同一份上下文内接着做。
4. 按 \`skills/decision-maker/templates/card.md\` 写十一格卡；每格第一句就是结论。
5. 配套与影响四项各写一句结论：配套调整、配套迁移、配套移除、影响范围；没有的写「无」和依据。
6. 验收写四件并带标签：「通过条件：」「失败条件：」「反例：」「证据：」；四项都要有真内容，失败条件要单独成条（不能只写在反例句里），不要把通过和失败塞进同一句。

${open}
${acceptance}
## 产物

- 研究原件：\`${ctx.output_path}/research.md\`；结尾列「读过的原件清单」。
- 卡：\`${ctx.output_path}/card.md\`。
- 两份原件开头写 \`agent: <你的子代理名>\`、\`dispatched_at: <收到派发的时间>\`、\`designer: <你的角色名>\`；卡末机器段留空占位给主持人回填。

## 回什么

${HANDOFF}
`;

  const reviewer = `${header}
## 目标

同源一趟：独立读这张卡，做冷读六问、对抗九问，另答冷读三问与对抗三问；不改卡、不改任何文件。

## 读什么

- 卡：\`${ctx.output_path}/card.md\`
- 上下文包：${contextRef}
- 只读这一页和卡；需要翻卡外材料才答得出，按答不出算。

## 边界

${list(ctx.boundaries)}

## 做什么

1. 冷读六问：改什么、为什么、边界、怎么验、还有什么没定、配套迁什么。
2. 对抗九问：调研够不够、现状是否真、有没有更小做法、验收能不能跑、藏了哪些假设、有没有更简单替代、是否太复杂、是否防御性兜底、是否只做新功能漏了配套。
3. 冷读三问：对应原文哪句／哪项被降级／删掉哪条验收会红。
4. 对抗三问：谁做被写成读者／有角色没原件／绕过有无负控。
5. 每问写原话答复；findings 分阻塞与建议，阻塞项写清回给谁。
6. 原件开头写 \`agent: <你的子代理名>\`、\`dispatched_at: <时间>\`、\`reviewer: <你的角色名>\`、\`designer: <卡末的设计者>\`、\`reviewed_card_sha256: <node skills/decision-maker/scripts/validate-card.mjs <card.md> --version 的输出>\`。

${open}
${acceptance}
## 产物

- \`${ctx.output_path}/cold-read.md\`：六问与冷读三问原答 + 上面五行机器行。
- \`${ctx.output_path}/adversarial.md\`：九问与对抗三问原答、阻塞项 + 上面五行机器行。

机器只判形状（问号齐不齐、卡版本对不对、身份是否不同人），审查质量是否够、方案是否成立，归人读。

## 回什么

${HANDOFF}
`;

  const heterologous = `${header}
## 目标

独立判同一卡节有没有被同源漏掉，只给独立结论与两来源异同；不改卡、不改任何文件。

## 读什么

- 卡：\`${ctx.output_path}/card.md\`
- 上下文包：${contextRef}
- 只读同一卡节与原文；不读同源发现（\`cold-read.md\`、\`adversarial.md\`），不继承同源或写作上下文。

## 边界

${list(ctx.boundaries)}

## 做什么

1. 独立结论：卡里的角色、原件、读者与失败验收和原文逐项对得上吗，哪一项被降级成流程、字段或口号。
2. 两来源异同：写清你用的来源家族（不同来源家族，不是同家族换 provider 键），并写出若与同源结论不同会不同在哪；同源原件由派发者收齐后对照，你不读。
3. 原件开头写 \`agent: <你的子代理名>\`、\`dispatched_at: <时间>\`、\`reviewer: <你的角色名>\`、\`designer: <卡末的设计者>\`、\`reviewed_card_sha256: <node skills/decision-maker/scripts/validate-card.mjs <card.md> --version 的输出>\`。

## 产物

- \`${ctx.output_path}/heterologous.md\`：独立结论、两来源异同 + 上面五行机器行。

## 回什么

${HANDOFF}
`;

  const files = {
    executor: path.join(outDir, 'executor-brief.md'),
    reviewer: path.join(outDir, 'reviewer-brief.md'),
    heterologous: path.join(outDir, 'heterologous-brief.md'),
  };
  fs.writeFileSync(files.executor, executor);
  fs.writeFileSync(files.reviewer, reviewer);
  fs.writeFileSync(files.heterologous, heterologous);
  console.log(JSON.stringify({ ok: true, files }, null, 2));
}

main();
