#!/usr/bin/env node
// 看一组包的状态：每张卡先过结构检查，再核卡末绑定的角色原件与包级答复。
// 缺证就报具名缺口（缺哪份原件、哪份卡版本对不上、哪句答复不在原件里）。
// 重要的边界：目录里一张可评估的卡都没有时，不能算「都收敛」，按失败报。
import fs from 'node:fs';
import path from 'node:path';
import { isCardText, validateCard } from './validate-card.mjs';

function main() {
  const argv = process.argv.slice(2);
  const dir = argv.find((arg) => !arg.startsWith('--'));
  const json = argv.includes('--json');
  const requireComplete = argv.includes('--require-complete');
  if (!dir) {
    console.error('usage: node status.mjs <cards-dir> [--json] [--require-complete]');
    process.exit(2);
  }
  const root = path.resolve(dir);
  let names;
  try {
    names = fs.readdirSync(root);
  } catch (error) {
    console.error(`目录不可读：${root}：${error.message}`);
    process.exit(2);
  }
  const files = names.filter((name) => name.endsWith('.md') && !name.startsWith('.')).sort();
  const rows = [];
  let evaluated = 0;
  for (const name of files) {
    const cardPath = path.join(root, name);
    let text;
    try {
      text = fs.readFileSync(cardPath, 'utf8');
    } catch (error) {
      rows.push({ file: name, complete: false, gaps: [`卡不可读：${error.message}`], cardVersion: null, answer: null });
      continue;
    }
    // 同目录里可能还有角色原件、上下文包和答复记录；只有卡形文件才进收敛判定。
    if (!isCardText(text)) {
      rows.push({ file: name, skipped: true, complete: false, gaps: ['不是卡：识别不到十一格或卡末，未评估'], cardVersion: null, answer: null });
      continue;
    }
    evaluated += 1;
    let result;
    try {
      result = validateCard({ cardPath, bind: true, packageDir: root });
    } catch (error) {
      rows.push({ file: name, complete: false, gaps: [`卡不可读：${error.message}`], cardVersion: null, answer: null });
      continue;
    }
    rows.push({
      file: name,
      complete: result.ok,
      gaps: [...result.reasons, ...result.gaps],
      missing: result.missing,
      cardVersion: result.cardVersion,
      answer: result.answer,
    });
  }
  const noCardGap = evaluated === 0 ? [`没有可评估的卡：${root} 里没有一张能识别的十一格卡`] : [];
  if (json) {
    console.log(JSON.stringify({ dir: root, evaluated, gaps: noCardGap, rows }, null, 2));
  } else {
    for (const gap of noCardGap) console.log(`incomplete\t-\t${gap}`);
    for (const row of rows) {
      if (row.skipped) { console.log(`skip\t${row.file}\t${row.gaps.join('；')}`); continue; }
      console.log(`${row.complete ? 'complete' : 'incomplete'}\t${row.file}${row.gaps.length ? `\t${row.gaps.join('；')}` : ''}`);
    }
  }
  if (evaluated === 0) process.exit(1);
  if (requireComplete && rows.some((row) => !row.skipped && !row.complete)) process.exit(1);
  process.exit(0);
}

main();
