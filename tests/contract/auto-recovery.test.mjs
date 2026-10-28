// ORACLE-AUTO-RECOVERY. Freeze after target RED; assertion changes require independent TCR review.
// This reads material contracts, not real sessions, permissions, providers or recovery success.
import {describe, expect, it} from 'vitest';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const paths = ['AGENTS.md', 'docs/standard-workflow.md', 'workflows/build-code/SKILL.md', 'skills/diagnosing-bugs/SKILL.md'];
const sources = Object.fromEntries(paths.map(path => [path, read(path)]));
const section = (body, heading, next = /^#{1,3} /m) => body.split(`${heading}\n`)[1]?.split(next)[0] ?? '';

// Expected outcomes come from the approved S1-S4 facts, never from the table under test.
const scenarios = [
  {id: 'S1', kind: '非阻塞缺资源', condition: [/非阻塞/, /不阻塞.*声明交付.*AC 判定/], action: [/先停重复动作/, /三检查/, /换假设或方法或独立上下文/, /`incomplete`.*继续/, /不问人/, /不弹三选项/, /保留原失败原件/], forbidden: /问一次|停下等答复|要求人工裁决/},
  {id: 'S2', kind: '用户独占阻塞资源', condition: [/用户独占/, /阻塞整任务声明交付或 AC 判定/], action: [/问一次/, /可直接回复的选项/, /停该路径.*等答复/, /其余安全工作继续/, /保留原失败原件/]},
  {id: 'S3', kind: '改 AC 或方向', condition: [/必须改 AC 或方向/], action: [/停该 AC 路径/, /简化验收或改方向/, /原 owner/, /保留原失败原件/]},
  {id: 'S4', kind: '严重风险', condition: [/超出既有授权/, /人.*承担.*严重风险/], action: [/停该路径/, /等人承担风险或改走低风险路径/, /保留原失败原件/]},
];

function readTriage(body) {
  const block = section(body, '### 卡住与升级');
  const lines = block.split('\n').filter(line => line.startsWith('|'));
  if (lines.length !== 6) throw new Error('ORACLE-AUTO-RECOVERY: one three-column table with four categories required');
  const cells = line => line.split('|').slice(1, -1).map(cell => cell.trim());
  if (lines.some(line => cells(line).length !== 3)) throw new Error('triage must have exactly three columns');
  if (cells(lines[0]).join('/') !== '分类/判定条件/处置') throw new Error('triage header missing');
  return lines.slice(2).map(line => {
    const [kind, condition, action] = cells(line);
    return {kind, condition, action};
  });
}

function checkTriage(body) {
  const rows = readTriage(body);
  const errors = [];
  for (const scenario of scenarios) {
    const found = rows.filter(row => row.kind === scenario.kind);
    if (found.length !== 1) { errors.push(`${scenario.id}: category missing or duplicated`); continue; }
    const row = found[0];
    for (const pattern of scenario.condition) if (!pattern.test(row.condition)) errors.push(`${scenario.id}: condition ${pattern}`);
    for (const pattern of scenario.action) if (!pattern.test(row.action)) errors.push(`${scenario.id}: action ${pattern}`);
    if (scenario.forbidden?.test(row.action)) errors.push(`${scenario.id}: forbidden stop or question`);
  }
  return {rows, errors};
}

describe('ORACLE-AUTO-RECOVERY: real material triage', () => {
  for (const scenario of scenarios) it(`${scenario.id}: independently expected condition and disposition`, () => {
    const {errors} = checkTriage(sources['AGENTS.md']);
    expect(errors.filter(error => error.startsWith(`${scenario.id}:`))).toEqual([]);
  });

  it('S1 switches path and continues after checking cause, complexity and simpler alternatives', () => {
    const row = checkTriage(sources['AGENTS.md']).rows.find(row => row.kind === '非阻塞缺资源');
    expect(row.action).toMatch(/换假设或方法或独立上下文/);
    expect(row.action).toMatch(/`incomplete`.*继续/);
    const block = section(sources['AGENTS.md'], '### 卡住与升级');
    for (const term of ['查根因', '验收或测试是否过度复杂', '更简单替代']) expect(block).toContain(term);
  });

  it('S1 preserves the original failure', () => {
    const row = checkTriage(sources['AGENTS.md']).rows.find(row => row.kind === '非阻塞缺资源');
    expect(row.action).toContain('保留原失败原件');
  });

  it('S1 does not ask or present three choices', () => {
    const row = checkTriage(sources['AGENTS.md']).rows.find(row => row.kind === '非阻塞缺资源');
    expect(row.action).toContain('不问人');
    expect(row.action).toContain('不弹三选项');
    expect(row.action).not.toMatch(/问一次|停下等答复/);
  });

  it('rejects a real-body mutation that turns S1 into asking', () => {
    const original = sources['AGENTS.md'];
    expect(checkTriage(original).errors).toEqual([]);
    const altered = original.replace(/^(\| 非阻塞缺资源 \|[^\n]+\| )[^\n]+ \|$/m, '$1问一次，停下等答复；保留原失败原件 |');
    expect(altered).not.toBe(original);
    expect(checkTriage(altered).errors).toContain('S1: forbidden stop or question');
  });

  it('rejects user-exclusive resource classification without the delivery or AC blocker', () => {
    const original = sources['AGENTS.md'];
    expect(checkTriage(original).errors).toEqual([]);
    const altered = original.replace(/^(\| 用户独占阻塞资源 \| )[^|]+/m, '$1用户独占资源 ');
    expect(altered).not.toBe(original);
    expect(checkTriage(altered).errors.some(error => error.startsWith('S2: condition'))).toBe(true);
  });

  it('rejects a missing class instead of defaulting to success', () => {
    const altered = sources['AGENTS.md'].replace(/^\| 严重风险 \|.*\n/m, '');
    expect(() => readTriage(altered)).toThrow(/four categories required/);
  });
});

describe('ORACLE-AUTO-RECOVERY: ordered recovery and preserved boundaries', () => {
  it('method 2 triggers method 9 at a repeated failure and method 5 uses the same triage', () => {
    const body = sources['workflows/build-code/SKILL.md'];
    const step2 = body.split('\n2. ')[1]?.split('\n3. ')[0] ?? '';
    const step5 = body.split('\n5. ')[1]?.split('\n6. ')[0] ?? '';
    expect(step2).toContain('同一失败第二次出现或一轮没有新事实时');
    expect(step2).toContain('第 9 步');
    expect(step5).toMatch(/外部不可重试.*第 9 步.*四类分诊/);
  });

  it('method 9 gives six recovery actions in order while keeping the Phase and original evidence', () => {
    const body = sources['workflows/build-code/SKILL.md'];
    const step9 = body.split('\n9. ')[1]?.split('\n10. ')[0] ?? '';
    const terms = ['先停重复动作', '三检查', '换路径', '四类分诊', '外部不可重试', '不设次数或时长上限'];
    let previous = -1;
    for (const term of terms) { const position = step9.indexOf(term); expect(position, term).toBeGreaterThan(previous); previous = position; }
    for (const term of ['自上次以来我改了什么', '失败信号', '深研', '换假设', '换方法', '换独立上下文', '拆分', '顺序', '依赖', '实现路线', '测试路线', '证据补齐', '不新建任务', '不建第二个账本', '不覆盖原失败原件', '无新事实不是完成']) expect(step9).toContain(term);
    expect(step9).toContain('AC、FR、oracle、写集、方向与验收对象');
  });

  it('the three other bodies point to the single AGENTS triage table', () => {
    for (const path of paths.slice(1)) {
      expect(sources[path], path).toMatch(/AGENTS\.md[^\n]*卡住与升级[^\n]*四类分诊/);
      expect(sources[path], path).not.toMatch(/^\| 分类 \| 判定条件 \| 处置 \|/m);
    }
  });

  it('external nonretryable failure stops that path at its first failure, with reset only on a new user answer', () => {
    const block = section(sources['AGENTS.md'], '### 卡住与升级');
    for (const term of ['许可或授权被拒绝', '权限不足', '密钥或登录失效', '输入非法', '真实资源或真环境不存在', '第一次出现即零重试', '停该外部失败路径', '其余安全工作继续', '用户给新答复即复位', '时间不构成复位条件']) expect(block).toContain(term);
    expect(block).toContain('只有表中用户独占且阻塞整任务声明交付或 AC 判定时才问一次');
  });

  it('provider failure exclusions retain execution, provenance and absence of review limits', () => {
    const block = section(sources['AGENTS.md'], '### 卡住与升级');
    for (const term of ['审查 provider 不可用、失败、超时、取消、无效输出、零成功路或空 findings', '不属于上述停机范围', '如实记 unavailable／incomplete', '不换执行者', '保留检测输出与原始失败', '不因此限制审查并发或轮次', '不按任何时长停止审查']) expect(block).toContain(term);
    expect(sources['docs/standard-workflow.md']).toContain('审查 provider 各轴仍按该节排除行继续既有审查工作');
  });

  it('removes fixed recovery limits without banning trigger or method counts', () => {
    const capped = /三次修复尝试均失败|重开一次，仍出现则升级问人|(?:最多|上限为|达到)\s*[\d一二三四五六七八九十]+\s*(?:次|轮|小时).*?(?:停|问人|裁决)/;
    for (const path of paths) expect(sources[path], path).not.toMatch(capped);
    expect(sources['AGENTS.md']).toContain('不设次数或时长上限');
    expect(sources['skills/diagnosing-bugs/SKILL.md']).toContain('不设次数上限');
    expect(sources['docs/standard-workflow.md']).toContain('时长本身永远不构成停止条件，时间不构成复位条件');
    expect(sources['skills/diagnosing-bugs/SKILL.md']).toContain('3–5');
    expect(sources['skills/diagnosing-bugs/SKILL.md']).toContain('一次只测一个变量');
  });

  it('diagnosis switches hypotheses/probes/context without guessing a fix', () => {
    const body = sources['skills/diagnosing-bugs/SKILL.md'];
    expect(body).toContain('没有根因证据，不改代码');
    expect(body).toContain('禁止猜测修复');
    const probes = section(body, '## 3. 假设与探针');
    for (const term of ['先停重复动作', '竞争假设', '探针', '独立上下文', '继续', '原失败与探针输出保留']) expect(probes).toContain(term);
  });

  it('retains the existing neighboring contract words', () => {
    for (const path of ['workflows/build-code/SKILL.md', 'docs/standard-workflow.md']) for (const term of ['最小可证伪集合', '未知影响面', '全局重跑', '一次', '事先说明', '本 Phase 承接 AC 与声明测试面']) expect(sources[path], `${path}: ${term}`).toContain(term);
  });

  it('registers the existing diagnostic and recovery consumers without a new owner mechanism', () => {
    const entries = JSON.parse(read('docs/architecture/move-map.json')).entries;
    const diagnostic = entries.find(entry => entry.source === 'skills/diagnosing-bugs/SKILL.md');
    const build = entries.find(entry => entry.source === 'workflows/build-code/SKILL.md');
    for (const term of ['换假设', '换方法', '换上下文', '保留原失败']) expect(diagnostic.responsibility).toContain(term);
    expect(diagnostic.consumer).toContain('方法9自动换路径');
    expect(diagnostic.owner).toContain('P3/T003');
    expect(build.responsibility).toContain('方法2诊断');
    expect(build.responsibility).toContain('方法9自动恢复');
    for (const entry of [diagnostic, build]) { expect(entry.delete_condition).toBeTruthy(); expect(entry.retention_basis).toBeTruthy(); }
  });
});
