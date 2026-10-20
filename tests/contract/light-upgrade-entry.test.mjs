// ORACLE-REG-ROUTE — N8 P6/T010; spec FR-REG-001/002, AC-REG-1…4.
// Text contract only. This does not prove actual regrading, user replies or handover (P7).
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const paths = ['workflows/make-decision/SKILL.md', ...['small', 'normal', 'planning'].map(x => `workflows/make-decision/flows/${x}/SKILL.md`)];
function section(text, title) {
  const lines = text.split('\n');
  const start = lines.findIndex(x => /^#{1,6} /.test(x) && title.test(x));
  if (start < 0) throw new Error(`missing contract section ${title}`);
  const rank = lines[start].match(/^#+/)[0].length;
  let end = start + 1;
  while (end < lines.length && !new RegExp(`^#{1,${rank}} `).test(lines[end])) end++;
  return lines.slice(start, end).join('\n');
}
// Require related predicates within a clause; unrelated keyword lists cannot satisfy these.
const rules = [
  ['observable trigger', /(?:交付物|交付结果)[^。\n]*AC[^。\n]*(?:独立用户故事|独立.*用户故事)/],
  ['cross-layer impact and changed risks', /(?:跨层|层间)[^。\n]*(?:架构|迁移)[^。\n]*权限[^。\n]*安全[^。\n]*风险/],
  ['real evidence', /真实[^。\n]*(?:diff|改动)[^。\n]*(?:影响|证据)/],
  ['pause affected path', /暂停[^。\n]*(?:该路径|相关路径|受影响.*路径|当前路径)/],
  ['recommend then user choice', /重新推荐[^。\n]*用户[^。\n]*(?:真实选择|明确选择|选择)/],
  ['same log append preserves previous judgment', /(?:同一|当前唯一)[^。\n]*(?:决策记录|decision-log)[^。\n]*追加[^。\n]*保留[^。\n]*旧(?:级别|判断)[^。\n]*旧判断|(?:同一|当前唯一)[^。\n]*(?:决策记录|decision-log)[^。\n]*追加[^。\n]*保留[^。\n]*旧判断/],
  ['upgrade retains completed inputs', /保留[^。\n]*已完成[^。\n]*方向[^。\n]*方案[^。\n]*spec[^。\n]*Phase[^。\n]*实施/],
  ['only missing steps and applicable reviews', /只补[^。\n]*(?:未做|未完成)[^。\n]*(?:步骤|阶段)[^。\n]*审查/],
  ['existing code receives one code review', /已(?:写|改|有)[^。\n]*代码[^。\n]*补[^。\n]*一次[^。\n]*代码审/],
  ['research not repeated', /不(?:重做|重跑)[^。\n]*调研/],
  ['no reply cannot regrade', /(?:未答|未获.*答复|没有.*答复)[^。\n]*(?:不得|不能|不)[^。\n]*(?:改级|变更级别|升级|改变级别)/],
  ['downgrade is user decision', /只有用户明确选择[^。\n]*降级/],
  ['agent may only suggest', /代理[^。\n]*只能建议[^。\n]*不(?:得)?自动降级/],
  ['unchanged risk preserves route', /风险未变[^。\n]*保持原(?:级别|档)[^。\n]*原路线/],
  ['unchanged risk no independent review', /风险未变[^。\n]*(?:无独立审|不加审|不增加独立审查)/],
  ['size is not review reason', /(?:不因|不得凭|不能凭|不凭)[^。；;\n]*(?:diff|改动)[^。；;\n]*(?:大小|行数|大)[^。；;\n]*Phase[^。；;\n]*(?:数|数量)[^。；;\n]*(?:加审|增审|审查)/],
  ['existing authorization persists', /(?:已有|持续)[^。\n]*授权[^。\n]*(?:继续有效|不重复确认|继续执行|续跑)/],
  ['new direction requires user choice', /新增[^。\n]*(?:方向|范围)[^。\n]*用户[^。\n]*(?:选择|确认|决定)/],
];
// Approved narrow synonym TCR: evidence 2026-10-20-215-p6-oracle-synonym-tcr.md.
// Negation is local to a clause; a later affirmative permission remains a violation.
const forbidden = [
  /(?:^|[。；;\n])\s*可以凭[^。；;\n]*(?:diff|改动)[^。；;\n]*(?:大小|行数|大)[^。；;\n]*Phase[^。；;\n]*(?:数|数量)[^。；;\n]*(?:改级|加审|增审|审查)/,
  /(?:代理|Agent|agent)(?:可以|可|应当|应|直接|自行|将)?自动(?:改级|升级|降级)/,
  /(?:未答|没有用户答复|用户未答复)[^。；\n]*(?:即可|仍可|直接|自动)(?:改级|升级|降级)/,
  /(?:只要|因为|凭)[^。\n]*(?:看起来大|diff很大|Phase数量多)[^。\n]*(?:就加审|增加独立审查|必须加审)/,
];
// TCR-P6-SIZE-REVIEW-FINDING: finite direct size -> affirmative review form.
const directSizePermission = /^(?:diff\s*很大|改动行数\s*很多|Phase\s*数量\s*多)(?:时|就|则)(?:必须加审|增加独立审查|就加审|加审)/;
function verify(text) {
  for (const [name, pattern] of rules) if (!pattern.test(text)) throw new Error(name);
  for (const pattern of forbidden) if (pattern.test(text)) throw new Error(`unsafe positive instruction ${pattern}`);
  for (const clause of text.split(/[。；;\n]/)) {
    if (directSizePermission.test(clause.trim())) throw new Error('unsafe positive instruction: direct size permission');
  }
}
const good = `交付物、AC、独立用户故事发生变化时触发重判。
跨层或层间影响、架构、迁移、权限、安全等新增风险触发重判。
用真实 diff 与影响证据判断；暂停相关路径；重新推荐并回用户真实选择。
同一 decision-log 追加变更，保留旧级别和旧判断。
升级保留已完成的方向、方案、spec/Phase 与实施；只补未做步骤与适用审查；已写代码补一次代码审；不重做调研。
未答不得改级；只有用户明确选择才降级；代理只能建议，不得自动降级。
风险未变保持原级别与原路线，风险未变不加审；不得凭 diff 大小或 Phase 数量增加审查。
已有授权继续有效；新增方向回用户选择。`;

describe('ORACLE-REG-ROUTE / real workflow material', () => {
  for (const path of paths) test(`${path}: regrade contract`, () => {
    verify(section(readFileSync(resolve(root, path), 'utf8'), /重判/));
  });
  test('root: complex handover consumes completed material without bypassing prerequisites', () => {
    const s = section(readFileSync(resolve(root, paths[0]), 'utf8'), /升级.*复杂/);
    expect(s).toMatch(/方向[^。\n]*spec[^。\n]*Phase[^。\n]*(?:已有输入|已有材料)/);
    expect(s).toMatch(/未实施[^。\n]*build-plan/);
    expect(s).toMatch(/已实施[^。\n]*未验证[^。\n]*补[^。\n]*代码审[^。\n]*build-code/);
    expect(s).toMatch(/(?:不得|不能|不)[^。\n]*跳过[^。\n]*复杂[^。\n]*前置/);
    expect(s).toMatch(/(?:无|缺失|没有)[^。\n]*(?:phase_progress|游标)[^。\n]*当前工作区[^。\n]*继续/);
    expect(s).toMatch(/(?:无|缺失|没有)[^。\n]*(?:phase_progress|游标)[^。\n]*(?:决策记录|decision-log)/);
  });
});

describe('ORACLE-REG-ROUTE / falsification of text assertions (synthetic, not execution)', () => {
  test('complete positive policy is accepted', () => expect(() => verify(good)).not.toThrow());
  for (const [name, pattern] of rules) test(`removing ${name} is rejected`, () => {
    expect(() => verify(good.replace(pattern, ''))).toThrow();
  });
  for (const bad of ['代理自动改级。', '代理自动降级。', '未答即可升级。', '没有用户答复直接降级。', '只要看起来大就加审。', '因为diff很大增加独立审查。', '凭Phase数量多必须加审。']) {
    test(`contradictory permission rejected: ${bad}`, () => expect(() => verify(`${good}\n${bad}`)).toThrow(/unsafe positive instruction/));
  }
  test('a keyword inventory is not an executable text policy', () => {
    expect(() => verify('重判 交付物 AC 独立用户故事 真实 diff 影响 证据 暂停 用户 选择 decision-log 追加 旧判断 升级 降级 风险 授权')).toThrow();
  });
});

// Full original sentence controls: not keyword substitutions or absence-only negatives.
describe('ORACLE-REG-ROUTE / approved size synonym TCR', () => {
  const original = '不得凭 diff 大小或 Phase 数量增加审查';
  const prohibition = '不凭 diff 大小或 Phase 数量改级或加审';
  const permission = '可以凭 diff 大小或 Phase 数量改级或加审';
  const lawful = good.replace(original, prohibition);
  test('complete lawful 不凭 policy is accepted', () => expect(() => verify(lawful)).not.toThrow());
  test('replacing prohibition with permission is rejected', () => {
    expect(() => verify(good.replace(original, permission))).toThrow();
  });
  test('removing the lawful obligation is rejected', () => {
    expect(() => verify(lawful.replace(prohibition, ''))).toThrow('size is not review reason');
  });
  for (const separator of ['。', '；', ';', '\n']) {
    test(`later permission cannot borrow negation across ${JSON.stringify(separator)}`, () => {
      expect(() => verify(`${lawful}\n${prohibition}${separator}${permission}。`)).toThrow(/unsafe positive instruction/);
    });
    test(`size predicates cannot be assembled across ${JSON.stringify(separator)}`, () => {
      expect(() => verify(good.replace(original, `不凭 diff 大小${separator}Phase 数量加审`))).toThrow('size is not review reason');
    });
  }
});

// TCR-P6-SIZE-REVIEW-FINDING: preserve the complete lawful policy while adding contradictions.
describe('ORACLE-REG-ROUTE / direct size permission review finding', () => {
  const bad = ['diff很大时必须加审', '改动行数很多时增加独立审查', 'Phase数量多时必须加审'];
  for (const permission of bad) {
    test(`direct size permission rejected: ${permission}`, () => {
      expect(() => verify(`${good}\n${permission}。`)).toThrow(/unsafe positive instruction/);
    });
    for (const separator of ['。', '；', ';', '\n']) {
      test(`prohibition cannot conceal ${permission} across ${JSON.stringify(separator)}`, () => {
        expect(() => verify(`${good}\n不凭 diff 大小或 Phase 数量改级或加审${separator}${permission}。`)).toThrow(/unsafe positive instruction/);
      });
    }
  }
  for (const prohibition of ['diff很大时不得加审', '改动行数很多也不能据此增加独立审查', 'Phase数量多时不能仅据此加审']) {
    test(`direct size prohibition accepted: ${prohibition}`, () => {
      expect(() => verify(`${good}\n${prohibition}。`)).not.toThrow();
    });
  }
  test('real changed risk still triggers lawful regrading', () => {
    expect(() => verify(`${good}\n真实风险发生变化时暂停受影响路径、重新推荐并回用户选择。`)).not.toThrow();
  });
});
