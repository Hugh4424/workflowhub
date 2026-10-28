import {describe,it,expect}from'vitest';import{readFileSync}from'node:fs';
const read=p=>readFileSync(p,'utf8');
// Structural method checks. No parser/keyword assertion claims a visual or user result.
describe('ORACLE-DESIGN-REVIEW method obligations',()=>{
 it('eight dimensions retain separate evidence and file-only limits',()=>{const s=read('skills/plan-design-review/SKILL.md');for(const v of ['业务任务','IA 导航','交互状态','内容数据','视觉规范','响应式布局','无障碍','真实代码交接','file-only','未验证'])expect(s).toContain(v);expect(s).not.toContain('Mode: `advisory`, file-only.');});
 it('findings preserve rationale, user consequence and independent retest',()=>{const s=read('skills/plan-design-review/SKILL.md');for(const v of ['编号','位置','依据','后果','建议','严重度','置信度','复验','独立'])expect(s).toContain(v);});
 it('illegal combination challenges include observable failure and reference the component owner',()=>{const s=read('skills/plan-design-review/SKILL.md');for(const v of ['常驻工作台','header slot','onClose','两个主操作','缺值','完整值','document','多浮层','同名 token','外部色值','skills/frontend-component-quality/SKILL.md'])expect(s).toContain(v);});
 it('seven ui-gate surfaces are bounded by actual evidence and owner response',()=>{const s=read('skills/plan-design-review/SKILL.md');for(const v of ['依据','内容','风格','视觉','可编辑性','交互','用户测试','skills/ui-copy-discipline/SKILL.md','当前展示','真实答复'])expect(s).toContain(v);});
});
