#!/usr/bin/env node
import fs from 'node:fs';

const REQUIRED = [
  '一句话结果',
  '对应需求',
  '现状缺口',
  '方案与取舍',
  '边界',
  '数据与状态',
  '配套与影响',
  '验收',
  '风险与回退',
  '未决',
  '白话复述',
];
const FOUR = ['配套调整', '配套迁移', '配套移除', '影响范围'];
const ACCEPT = ['验收', '反例', '证据'];

function main() {
  const file = process.argv[2];
  const json = process.argv.includes('--json');
  if (!file) {
    console.error('usage: node validate-card.mjs <card.md> [--json]');
    process.exit(2);
  }
  const text = fs.readFileSync(file, 'utf8');
  const missing = REQUIRED.filter((x) => !text.includes(x));
  const fourMissing = FOUR.filter((x) => !text.includes(x));
  const acceptMissing = ACCEPT.filter((x) => !text.includes(x));
  const ok = missing.length === 0 && fourMissing.length === 0 && acceptMissing.length === 0;
  const result = { file, ok, missing, fourMissing, acceptMissing };
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (ok) {
    console.log(`ok: ${file}`);
  } else {
    console.error(`fail: ${file}`);
    if (missing.length) console.error(`missing sections: ${missing.join(', ')}`);
    if (fourMissing.length) console.error(`missing support items: ${fourMissing.join(', ')}`);
    if (acceptMissing.length) console.error(`missing acceptance: ${acceptMissing.join(', ')}`);
  }
  process.exit(ok ? 0 : 1);
}

main();
