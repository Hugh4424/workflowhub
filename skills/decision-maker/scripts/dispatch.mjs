#!/usr/bin/env node
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

function main() {
  const ctxPath = process.argv[2];
  const outFlag = process.argv.indexOf('--out');
  if (!ctxPath) {
    console.error('usage: node dispatch.mjs <package-context.json> [--out <dir>]');
    process.exit(2);
  }
  const ctx = JSON.parse(fs.readFileSync(ctxPath, 'utf8'));
  const missing = REQUIRED.filter((k) => !ctx[k] || (Array.isArray(ctx[k]) && ctx[k].length === 0));
  if (missing.length) {
    console.error(`missing context fields: ${missing.join(', ')}`);
    process.exit(1);
  }
  const outDir = outFlag >= 0 ? process.argv[outFlag + 1] : path.dirname(path.resolve(ctxPath));
  fs.mkdirSync(outDir, { recursive: true });
  const header = `# ${ctx.name}\n\n- context: ${path.resolve(ctxPath)}\n- output: ${ctx.output_path}\n\n`;
  const research = `${header}## 调研角色\n\n读 context 与 evidence，做内部/外部调研和发散；至少 3 个方案（含 1 个结构性方案），至少 1 个被否，写取舍。不要写最终卡。\n\n- 需求：${JSON.stringify(ctx.requirements)}\n- 证据：${JSON.stringify(ctx.evidence)}\n- 边界：${JSON.stringify(ctx.boundaries)}\n- 开放问题：${JSON.stringify(ctx.open_questions)}\n`;
  const design = `${header}## 设计角色\n\n读 context、调研回传；选最小方案，写十一格卡；必须写配套调整、配套迁移、配套移除、影响范围。\n\n- 验收：${JSON.stringify(ctx.acceptance)}\n`;
  const review = `${header}## 审查角色\n\n读十一格卡；冷读六问，再做对抗九问。必须问：是不是只做新功能，漏了配套调整/迁移/移除/影响范围。\n`;
  const files = {
    research: path.join(outDir, 'research.md'),
    design: path.join(outDir, 'design.md'),
    review: path.join(outDir, 'review.md'),
  };
  fs.writeFileSync(files.research, research);
  fs.writeFileSync(files.design, design);
  fs.writeFileSync(files.review, review);
  console.log(JSON.stringify({ ok: true, files }, null, 2));
}

main();
