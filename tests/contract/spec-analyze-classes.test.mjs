// ORACLE-C07-AUTHORING / analyze: preserve six checks and append reader use.
import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const analyze='skills/spec-analyze/SKILL.md',workflow='workflows/build-plan/SKILL.md';
const originalSix='在同一分析原件逐类给双方原文位置、当前结果、影响与 owner 的下一动作；不适用写具体对象为何不存在及依据。遗漏回原始要求/真实答复与 spec/Task；矛盾对照数量、否定、顺序、权限及失败强度；孤儿任务反查每卡的来源、FR/AC 与真实消费者；越界对照当前写集和原授权，不把质量事实当授权；消费者沿输入→产物→真实调用或读回；测试充分性逐条件核 oracle、反例、真实输入与证据上限。结构绿、编号命中或文件存在不能代替这六类语义检查，也不能代独立质量裁决。';
test('analyze and step eleven append the same seventh class and four subcriteria',()=>{for(const path of [analyze,workflow]){const s=read(path);for(const label of ['第七类：读者可用','超60字句比例','单行最长','缩写首现解释率','编号重复率','重复重述比例','模板与材料一致','写集与真实 diff'])expect(s).toContain(label);}});
test('all six original semantic checks remain byte-for-byte intact',()=>{expect(read(analyze)).toContain(originalSix);expect(read(workflow)).toContain('六类（遗漏、矛盾、孤儿任务、越界、消费者、测试充分性）各给落点或排除理由，缺一即本步未完成；用 spec-analyze 执行同一核对。');});
test('step eleven actually instructs bounded independent reading and record validation',()=>{const s=read(workflow).match(/^11\. ([^\n]*)/m)?.[1]??'';for(const v of ['独立','phases/index.md','一张 Phase','15万字符','quality/tests/','check-reader-record.mjs','七段','五问原答','退出码'])expect(s).toContain(v);expect(s).toContain('已做与未做');});
