// 单元复盘接线契约（P5）：五个技能的固定复盘节、五问字段与四份步骤表的关闭步口径。
//
// 本文件是 P5「单元复盘」的唯一合同测试，先证目标失败再实现。断言只读仓库里的真实字节：
//  - 复盘技能 `skills/stage-reflection/SKILL.md` 的节名是 `## 单元模式：单元复盘记录`；
//  - 四份单元技能各自的节名是 `## 收尾：单元复盘记录`；
//  - 复盘技能的新节里可见五问五个字段名、分隔符 `｜`、记录目录 `quality/evidence/reflection/`，
//    以及三步写入顺序（先发摘要、再写五问记录、有表才更新状态）与摘要上限「不超过五条」；
//  - 四份 `steps.json` 的关闭步说「单元复盘是Phase内动作」，步骤数 6/12/12/15 与末步 `closeout` 不变。
//
// 节名按整行锚定 `^…$`，每个文件单独一条断言：四份技能的收尾节共用同一句指针，
// 句子里逐字含「单元模式：单元复盘记录」，跨文件全局 `toContain` 恒真；
// 只要还剩三份「收尾：…」，全局断言也绿。锚定整行同时排掉「节名只写在正文里」的假命中。
// 五问只断言复盘技能新节那一段，四份技能只断言节名，不复述方法。
//
// 只证文字与步骤表形状在场，不证技能真被调用、不证记录质量；那些归 P8、P9、P10 与独立读者。
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const read = path => readFileSync(resolve(ROOT, path), 'utf8');
const hasHeading = (path, heading) => new RegExp(`^${heading}$`, 'mu').test(read(path));
const sectionText = (path, heading) => {
  const lines = read(path).split('\n');
  const start = lines.indexOf(heading);
  expect(start, `${path} 缺整行标题「${heading}」`).toBeGreaterThanOrEqual(0);
  const end = lines.findIndex((line, index) => index > start && line.startsWith('## '));
  return lines.slice(start, end < 0 ? undefined : end).join('\n');
};

describe('ORACLE-UNIT-REFLECTION 单元复盘接线', () => {
  it('skills/stage-reflection/SKILL.md 有「单元模式：单元复盘记录」节', () => {
    const path = 'skills/stage-reflection/SKILL.md';
    expect(hasHeading(path, '## 单元模式：单元复盘记录'), `${path} 缺整行标题「## 单元模式：单元复盘记录」`).toBe(true);
  });

  it.each(['task-maker', 'phase-maker', 'run-phase', 'decision-maker'])(
    'skills/%s/SKILL.md 有「收尾：单元复盘记录」节',
    name => {
      const path = `skills/${name}/SKILL.md`;
      expect(hasHeading(path, '## 收尾：单元复盘记录'), `${path} 缺整行标题「## 收尾：单元复盘记录」`).toBe(true);
    },
  );

  it('stage-reflection 的单元模式节写出五问五个字段名、｜ 与任务根记录目录', () => {
    const path = 'skills/stage-reflection/SKILL.md';
    const text = sectionText(path, '## 单元模式：单元复盘记录');
    for (const field of ['问题', '以前有没有', '实际改了什么', '为什么不用更高层', '怎么证明']) {
      expect(text, `${path} 的单元模式节缺五问字段名「${field}」`).toContain(field);
    }
    expect(text, `${path} 的单元模式节缺一行五问的分隔符「｜」`).toContain('｜');
    expect(text, `${path} 的单元模式节缺记录目录「quality/evidence/reflection/」`).toContain('quality/evidence/reflection/');
  });

  it('stage-reflection 的单元模式节写出三步写入顺序与摘要上限', () => {
    const path = 'skills/stage-reflection/SKILL.md';
    const text = sectionText(path, '## 单元模式：单元复盘记录');
    expect(text, `${path} 的单元模式节缺摘要上限「不超过五条」`).toContain('不超过五条');
    const positions = ['1. **先发摘要**', '2. **再写五问记录**', '3. **有表才更新状态**'].map(step => {
      const index = text.indexOf(step);
      expect(index, `${path} 的单元模式节缺三步写入中的「${step}」`).toBeGreaterThanOrEqual(0);
      return index;
    });
    expect(positions, `${path} 的单元模式节三步写入顺序被打乱`).toEqual([...positions].sort((left, right) => left - right));
  });
});

const STEP_TABLES = [
  { stage: 'build-prd', count: 6 },
  { stage: 'build-plan', count: 12 },
  { stage: 'build-code', count: 12 },
  { stage: 'make-decision', count: 15 },
];

describe('ORACLE-UNIT-REFLECTION 四份步骤表的关闭步口径', () => {
  it.each(STEP_TABLES)('workflows/$stage/steps.json 关闭步说「单元复盘是Phase内动作」', ({ stage }) => {
    const path = `workflows/${stage}/steps.json`;
    const manifest = JSON.parse(read(path));
    expect(manifest.steps.at(-1).observable_result, `${path} 的关闭步缺「单元复盘是Phase内动作」`).toContain('单元复盘是Phase内动作');
  });

  it('四份步骤表的步骤数与末步 step_slug 不变', () => {
    const counts = {};
    for (const { stage, count } of STEP_TABLES) {
      const path = `workflows/${stage}/steps.json`;
      const manifest = JSON.parse(read(path));
      expect(manifest.steps.length, `${path} 步骤数应保持 ${count}`).toBe(count);
      expect(manifest.steps.at(-1).step_slug, `${path} 末步 step_slug 应保持 closeout`).toBe('closeout');
      counts[stage] = manifest.steps.length;
    }
    expect(counts).toEqual({ 'build-prd': 6, 'build-plan': 12, 'build-code': 12, 'make-decision': 15 });
  });
});
