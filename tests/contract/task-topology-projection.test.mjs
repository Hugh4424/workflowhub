import{describe,expect,it}from"vitest";import{readTaskTypeFromDecisionLog}from"../../runtime/stage/stage-content-contracts.mjs";
import { readFileSync } from 'node:fs';
const log=v=>`# Decision\n\n## 任务身份\n\n- **任务类型**：${v}\n`;
describe("human task type material reading",()=>{
 it.each(["普通任务","规划任务"])("reads the explicit human %s declaration without a runtime cohort projection",type=>{expect(readTaskTypeFromDecisionLog(log(type))).toBe(type);expect(readTaskTypeFromDecisionLog(`## 任务身份\n| 字段 | 内容 |\n| --- | --- |\n| 任务类型 | **${type}** |\n`)).toBe(type);});
 it.each(["",log("unknown"),"##任务身份\n- **任务类型**：普通任务\n",log("普通任务")+"- **任务类型**：普通任务\n",log("普通任务")+"- **任务类型**：规划任务\n",log("普通任务")+"## 任务身份\n- **任务类型**：普通任务\n"])("keeps invalid/missing/duplicate/conflicting human input unknown",value=>{expect(readTaskTypeFromDecisionLog(value)).toBe("unknown");});
 it("does not infer the type from later sections or fenced example declarations",()=>{expect(readTaskTypeFromDecisionLog("##任务身份\n\n##备注\n\n- **任务类型**：普通任务\n")).toBe("unknown");expect(readTaskTypeFromDecisionLog("## 任务身份\n```\n- **任务类型**：普通任务\n```\n")).toBe("unknown");});
});
const entry = '## 1. 入口\n\n### 这是什么任务\n';
const field = (value) => '- **任务类型**：' + value + '\n';

describe('decision-log authoring templates', () => {
  it.each(['规划任务', '普通任务'])('reads an explicit %s in both published template headings', type => {
    const currentTemplate = readFileSync(new URL('../../skills/decision-log/templates/decision-log-template-v2.md', import.meta.url), 'utf8');
    const oldTemplate = readFileSync(new URL('../../skills/decision-log/templates/decision-log-template.md', import.meta.url), 'utf8');
    expect(readTaskTypeFromDecisionLog(currentTemplate.replace('<普通任务 / 规划任务>', type))).toBe(type);
    expect(readTaskTypeFromDecisionLog(oldTemplate.replace('**任务类型**：普通任务。', '**任务类型**：' + type + '。'))).toBe(type);
  });

  it('reads the parent’s explanatory note without treating arbitrary prose as the selected type', () => {
    expect(readTaskTypeFromDecisionLog(entry + field('`规划任务`（梳理任务组、给后续写 PRD 提供方向，不实施、不产 spec/Phase）。'))).toBe('规划任务');
  });

  it.each([
    ['unfilled template', entry + field('`<普通任务 / 规划任务>`。')],
    ['alternative in the declaration', entry + field('规划任务 / 普通任务')],
    ['conflicting value in a note', entry + field('`规划任务`（当前取值为普通任务）。')],
    ['qualification outside a note', entry + field('规划任务，尚待用户确认')],
    ['unclosed note', entry + field('`规划任务`（暂定')],
    ['type outside its subsection', '## 1. 入口\n### 怎么读这份日志\n' + field('规划任务')],
    ['same subsection under later material', '## 2. 需求与确认\n### 这是什么任务\n' + field('规划任务')],
    ['historical legacy subsection', '## 2. 需求与确认\n### 任务身份\n' + field('规划任务')],
    ['entry repeated in an appendix', entry + field('规划任务') + '\n## 2. 需求与确认\n' + entry + field('普通任务')],
    ['later example', entry + '### 怎么读这份日志\n' + field('规划任务')],
    ['quoted evidence', entry + '> - **任务类型**：规划任务\n'],
    ['indented example', entry + '    - **任务类型**：规划任务\n'],
    ['fenced entry', '~~~md\n' + entry + field('规划任务') + '~~~\n'],
    ['fenced legacy identity', '```md\n## 任务身份\n' + field('规划任务') + '```\n'],
    ['duplicate type declarations', entry + field('规划任务') + field('规划任务')],
    ['conflicting type declarations', entry + field('规划任务') + field('普通任务')],
    ['two schema identities', entry + field('规划任务') + '\n## 任务身份\n' + field('普通任务')],
  ])('keeps %s unknown', (_name, markdown) => {
    expect(readTaskTypeFromDecisionLog(markdown)).toBe('unknown');
  });
});
