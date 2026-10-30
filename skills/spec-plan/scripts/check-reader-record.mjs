import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const SECTIONS = Object.freeze(['读者身份', '读到的材料与范围', '五问原答', '原始需求对照', '真跑的命令与退出码', '发现的缺口', '结论']);
const questions = ['为谁做', '他拿它干什么', '读到哪里会卡', '失败怎么恢复', '哪些话只有内行懂'];
const answered = value => {
  const normalized = String(value ?? '').replace(/[\s*`_：:，,。.;；?？!！-]/gu, '');
  return Boolean(normalized) && !/^(?:TODO|TBD|待补充|未取得|无原答)$/i.test(normalized);
};

// Hide only fenced lines for heading discovery; preserve offsets into raw answers.
function headingText(text) {
  let fence = null;
  return String(text).split('\n').map(line => {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line.replace(/\r$/, ''));
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length
          && /^[ \t]*$/.test(marker[2])) fence = null;
      return ' '.repeat(line.length);
    }
    if (marker && (marker[1][0] !== '`' || !marker[2].includes('`'))) {
      fence = marker[1];
      return ' '.repeat(line.length);
    }
    return line;
  }).join('\n');
}

// Shape only: answers remain the independent reader's responsibility.
export function checkReaderRecord(text) {
  const headings = [...headingText(text).matchAll(/^##[ \t]+(.+?)[ \t\r]*$/gm)];
  const missing = [];
  let previous = -1;
  const bodies = new Map();
  for (const section of SECTIONS) {
    const matches = headings.filter(h => h[1] === section);
    const heading = matches[0];
    if (matches.length !== 1 || heading.index <= previous) missing.push(section);
    if (!heading) continue;
    const next = headings.find(h => h.index > heading.index);
    const body = text.slice(heading.index + heading[0].length, next?.index ?? text.length).trim();
    bodies.set(section, body);
    if (!answered(body) && !missing.includes(section)) missing.push(section);
    previous = heading.index;
  }
  const questionBody = bodies.get('五问原答') ?? '';
  for (const question of questions) {
    const answer = new RegExp(`^(?:[-*]\\s*)?(?:\\*\\*)?${question}(?:\\*\\*)?\\s*[:：]([^\\n]*)$`, 'm').exec(questionBody)?.[1];
    if (!answered(answer)) missing.push(`五问原答：${question}`);
  }
  const commands = bodies.get('真跑的命令与退出码') ?? '';
  if (!/(?:^|[\s`：:])(?:node|python3?|bash|sh|git|pnpm|npm|npx|cargo|go|\.\/)[^\n]+/m.test(commands)
      || !/(?:exit(?:_code)?|退出码)\s*[:：=]?\s*-?\d+\b/i.test(commands)) {
    if (!missing.includes('真跑的命令与退出码')) missing.push('真跑的命令与退出码');
  }
  return { ok: missing.length === 0, missing };
}

export function runCli(argv) {
  try {
    if (argv.length !== 1) throw new Error('expected one reader record path');
    const result = checkReaderRecord(readFileSync(argv[0], 'utf8'));
    console.log(JSON.stringify(result));
    return result.ok ? 0 : 2;
  } catch (error) {
    console.error(JSON.stringify({ error: error.code ?? 'READER_RECORD_UNREADABLE', message: error.message }));
    return 1;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = runCli(process.argv.slice(2));
