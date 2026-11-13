// ORACLE-CAP-LEDGER: reads docs/ui-frontend-capabilities.md text only.
// Passing proves ledger structure, status vocabulary and referenced paths;
// it does not prove any stage actually invokes the listed capability.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const LEDGER = 'docs/ui-frontend-capabilities.md';
const ABILITIES = ['C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08', 'C09', 'C10', 'C11'];
const COLUMNS = ['能力', '所属阶段', '触发条件', '产物', '验收', '当前状态', '本任务承接', '原卡验收归属'];
const STATUSES = ['已接线', '部分', '未接线', '仓外'];
// The word list stays at four values. A cell may append one parenthetical note
// (for example "部分（缺第 3 段）"); the note is not a fifth status and does not
// move the row to another tier.
const STATUS_PATTERN = /^(已接线|部分|未接线|仓外)(（[^）]+）)?$/;
const COMPONENT_NORM = '目标项目根下的组件规范';
const NOT_RECHECKED = '不声称已重验';
const DRIFT = [
  ['verify-code', 'workflows/build-code/SKILL.md'],
  ['ui-project-init', 'skills/project-norm-init/SKILL.md'],
];
const PATH_PATTERN = /(?:skills|workflows|docs|tests|tools|runtime)\/[A-Za-z0-9._\-/]*[A-Za-z0-9._-]/g;

const readOrFail = () => {
  const full = resolve(root, LEDGER);
  expect(existsSync(full), `清单存在：${LEDGER} 可读`).toBe(true);
  return readFileSync(full, 'utf8');
};

const splitRow = (line) =>
  line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());

const tableRows = (text) =>
  text.split('\n').filter((line) => line.trim().startsWith('|')).map((line) => splitRow(line));

const ledgerRows = (text) =>
  tableRows(text)
    .filter((cells) => /^C\d{2}\b/.test(cells[0]))
    .map((cells) => ({ id: cells[0].slice(0, 3), cells }));

const headerRow = (text) => tableRows(text).find((cells) => cells[0] === '能力') ?? [];

const rowPaths = (cells) =>
  cells
    .flatMap((cell) => cell.match(PATH_PATTERN) ?? [])
    .map((path) => path.replace(/[.。]+$/, ''))
    .filter((path) => path.length > 0);

const setCell = (text, id, column, value) => {
  const index = COLUMNS.indexOf(column);
  return text
    .split('\n')
    .map((line) => {
      if (!line.trim().startsWith('|')) return line;
      const cells = splitRow(line);
      if (cells[0].slice(0, 3) !== id) return line;
      cells[index] = value;
      return `| ${cells.join(' | ')} |`;
    })
    .join('\n');
};

const mutateDriftTarget = (text, token, from, to) =>
  text
    .split('\n')
    .map((line) => {
      if (!line.trim().startsWith('|')) return line;
      const cells = splitRow(line);
      if (!cells.some((cell) => cell.includes(token))) return line;
      return `| ${cells.map((cell) => cell.replace(from, to)).join(' | ')} |`;
    })
    .join('\n');

/**
 * Named-gap checker for the capability ledger.
 * Returns gap strings such as "C04 行缺格：触发条件"; an empty array means no gap.
 */
export function checkLedger(text) {
  const gaps = [];
  const header = headerRow(text);
  for (const column of COLUMNS) if (!header.includes(column)) gaps.push(`表头缺列：${column}`);

  const rows = ledgerRows(text);
  for (const id of ABILITIES) {
    const matches = rows.filter((row) => row.id === id);
    if (matches.length === 0) {
      gaps.push(`${id} 行缺失：十一行能力未列该行`);
      continue;
    }
    if (matches.length > 1) gaps.push(`${id} 行重复：同一能力只能一行`);
    const [row] = matches;
    if (row.cells.length !== COLUMNS.length) {
      gaps.push(`${id} 行格数=${row.cells.length}，应为 ${COLUMNS.length}`);
    }
    COLUMNS.forEach((column, index) => {
      if (!row.cells[index]) gaps.push(`${id} 行缺格：${column}`);
    });
    const status = row.cells[5] ?? '';
    if (status && !STATUS_PATTERN.test(status)) gaps.push(`${id} 行状态越界：${status}`);
    for (const path of rowPaths(row.cells)) {
      if (!existsSync(resolve(root, path))) gaps.push(`${id} 行路径不存在：${path}`);
    }
  }

  for (const id of ['C09', 'C10']) {
    const row = rows.find((item) => item.id === id);
    if (row && !row.cells.join(' | ').includes(NOT_RECHECKED)) {
      gaps.push(`${id} 行缺句：${NOT_RECHECKED}`);
    }
  }

  for (const id of ['C01', 'C08']) {
    const row = rows.find((item) => item.id === id);
    if (row && !row.cells.join(' | ').includes(COMPONENT_NORM)) {
      gaps.push(`${id} 行规范源缺句：${COMPONENT_NORM}`);
    }
  }

  for (const [token, target] of DRIFT) {
    const row = tableRows(text).find((cells) => cells.some((cell) => cell.includes(token)));
    if (!row) gaps.push(`漂移无去向：未写 ${token} 的映射行`);
    else {
      if (!row.join(' | ').includes(target)) gaps.push(`漂移去向错：${token} 未对到 ${target}`);
      for (const path of rowPaths(row)) {
        if (!existsSync(resolve(root, path))) gaps.push(`漂移目标不存在：${path}`);
      }
    }
  }

  if (!text.includes('阶段方法负责人')) gaps.push('缺维护者：阶段方法负责人');
  if (!text.includes('更新时机')) gaps.push('缺更新时机');
  return gaps;
}

describe('ORACLE-CAP-LEDGER', () => {
  test('清单存在：docs/ui-frontend-capabilities.md 可读', () => {
    expect(readOrFail().length).toBeGreaterThan(0);
  });

  test('表头八列齐', () => {
    const gaps = checkLedger(readOrFail());
    expect(gaps.filter((gap) => gap.startsWith('表头缺列'))).toEqual([]);
  });

  test('十一行能力齐且每行八格非空', () => {
    const gaps = checkLedger(readOrFail());
    expect(gaps.filter((gap) => gap.includes('行缺失') || gap.includes('行重复') || gap.includes('行缺格'))).toEqual([]);
  });

  test('当前状态以已接线、部分、未接线、仓外之一开头，可带括号括注', () => {
    const gaps = checkLedger(readOrFail());
    expect(gaps.filter((gap) => gap.includes('状态越界'))).toEqual([]);
  });

  test('引用的技能与阶段路径在仓库存在', () => {
    const gaps = checkLedger(readOrFail());
    expect(gaps.filter((gap) => gap.includes('路径不存在'))).toEqual([]);
  });

  test('C09、C10 行写不声称已重验', () => {
    const gaps = checkLedger(readOrFail());
    expect(gaps.filter((gap) => gap.includes(NOT_RECHECKED))).toEqual([]);
  });

  test('C01、C08 规范源写目标项目根下的组件规范', () => {
    const gaps = checkLedger(readOrFail());
    expect(gaps.filter((gap) => gap.includes(COMPONENT_NORM))).toEqual([]);
  });

  test('PRD 漂移有去向：verify-code 与 ui-project-init 各对到真实路径', () => {
    const gaps = checkLedger(readOrFail());
    expect(gaps.filter((gap) => gap.startsWith('漂移'))).toEqual([]);
  });

  test('维护者与更新时机可读', () => {
    const gaps = checkLedger(readOrFail());
    expect(gaps.filter((gap) => gap.startsWith('缺维护者') || gap.startsWith('缺更新时机'))).toEqual([]);
  });

  test('整体无缺口', () => {
    expect(checkLedger(readOrFail())).toEqual([]);
  });
});

describe('ORACLE-CAP-LEDGER 内存反例（只改副本，不写磁盘）', () => {
  test('反例：清空 C04 触发条件必须被具名报出', () => {
    const text = readOrFail();
    const broken = setCell(text, 'C04', '触发条件', '');
    expect(checkLedger(broken)).toContain('C04 行缺格：触发条件');
    expect(checkLedger(text)).toEqual([]);
  });

  test('反例：改出不存在的技能路径必须被具名报出', () => {
    const text = readOrFail();
    const cells = ledgerRows(text).find((row) => row.id === 'C01').cells;
    const index = cells.findIndex((cell) => cell.includes('skills/project-norm-init/SKILL.md'));
    expect(index).toBeGreaterThan(-1);
    const broken = setCell(
      text,
      'C01',
      COLUMNS[index],
      cells[index].replace('skills/project-norm-init/SKILL.md', 'skills/no-such-skill/SKILL.md'),
    );
    expect(checkLedger(broken)).toContain('C01 行路径不存在：skills/no-such-skill/SKILL.md');
    expect(checkLedger(text)).toEqual([]);
  });

  test('反例：删掉 C09 行不声称已重验必须被具名报出', () => {
    const text = readOrFail();
    const cells = ledgerRows(text).find((row) => row.id === 'C09').cells;
    const index = cells.findIndex((cell) => cell.includes(NOT_RECHECKED));
    expect(index).toBeGreaterThan(-1);
    const broken = setCell(text, 'C09', COLUMNS[index], cells[index].replace(NOT_RECHECKED, ''));
    expect(checkLedger(broken)).toContain(`C09 行缺句：${NOT_RECHECKED}`);
    expect(checkLedger(text)).toEqual([]);
  });

  test('反例：状态写成词表外的值必须被具名报出', () => {
    const text = readOrFail();
    const broken = setCell(text, 'C11', '当前状态', '待定');
    expect(checkLedger(broken)).toContain('C11 行状态越界：待定');
    expect(checkLedger(text)).toEqual([]);
  });

  test('反例：漂移目标改成不存在的路径必须被具名报出', () => {
    const text = readOrFail();
    const broken = mutateDriftTarget(
      text,
      'verify-code',
      'workflows/build-code/SKILL.md',
      'workflows/no-such-stage/SKILL.md',
    );
    expect(checkLedger(broken)).toContain('漂移目标不存在：workflows/no-such-stage/SKILL.md');
    expect(checkLedger(text)).toEqual([]);
  });
});
