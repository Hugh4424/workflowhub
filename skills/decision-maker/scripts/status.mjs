#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

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

function main() {
  const dir = process.argv[2];
  const json = process.argv.includes('--json');
  const requireComplete = process.argv.includes('--require-complete');
  if (!dir) {
    console.error('usage: node status.mjs <cards-dir> [--json] [--require-complete]');
    process.exit(2);
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
  const rows = files.map((f) => {
    const text = fs.readFileSync(path.join(dir, f), 'utf8');
    const missing = REQUIRED.filter((x) => !text.includes(x));
    return { file: f, complete: missing.length === 0, missing };
  });
  if (json) {
    console.log(JSON.stringify(rows, null, 2));
  } else {
    for (const r of rows) {
      console.log(`${r.complete ? 'complete' : 'incomplete'}\t${r.file}${r.missing.length ? '\t' + r.missing.join(',') : ''}`);
    }
  }
  if (requireComplete && rows.some((r) => !r.complete)) process.exit(1);
  process.exit(0);
}

main();
