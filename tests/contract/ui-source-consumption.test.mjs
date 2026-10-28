import {describe,it,expect} from 'vitest';
import {readFileSync,existsSync,mkdtempSync,mkdirSync,writeFileSync,rmSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {resolveSkillPackage} from '../../runtime/adapters/local-skill-resolver.mjs';
const read=p=>readFileSync(p,'utf8');
// These checks prove wiring/structure only. Independent full A/B/non-UI author
// consumption, source rights and page effects remain separate task evidence.
describe('ORACLE-METHOD-CONSUMPTION actual method and package seams',()=>{
  it('workflow retains three-source UI packages and routes both models to current prototype consumption',()=>{
    const decision=read('workflows/make-decision/SKILL.md');
    for(const value of ['raw_requirement','project_inventory','planned_or_changed_frontend_fact','状态×视口'])expect(decision).toContain(value);
    const plan=read('workflows/build-plan/SKILL.md');
    for(const value of ['有稿','无稿','独立设计审查','当前展示答复','specs/<task>/prototype/'])expect(plan).toContain(value);
    expect(read('workflows/build-code/SKILL.md')).toContain('批准原型');
  });
  it('real package resolver loads each new skill rather than only a catalog name',()=>{
    for(const name of ['ui-copy-discipline','figma-make-prompt']){
      const dep={name,path:`skills/${name}/SKILL.md`};
      expect(()=>resolveSkillPackage({packageRoot:process.cwd(),manifestPath:'workflows/build-plan/skill-deps.yaml',dependency:dep}),name).not.toThrow();
      const payload=resolveSkillPackage({packageRoot:process.cwd(),manifestPath:'workflows/build-plan/skill-deps.yaml',dependency:dep});
      expect(payload.resolved_bundle_paths).toHaveLength(1);
      expect(read(payload.resolved_skill_path).length).toBeGreaterThan(200);
    }
  });
  it('resolver surfaces an unreadable declared payload on the real production path',()=>{
    const root=mkdtempSync(join(tmpdir(),'c05-package-input-'));
    try{mkdirSync(join(root,'skills/example'),{recursive:true});mkdirSync(join(root,'workflows/build-plan'),{recursive:true});
      writeFileSync(join(root,'workflows/build-plan/skill-deps.yaml'),'stage: build-plan\n');
      writeFileSync(join(root,'skills/example/SKILL.md'),'# controlled filesystem input');
      writeFileSync(join(root,'skills/example/skill-bundle.json'),JSON.stringify({schema_version:1,skill:'example',files:['SKILL.md'],sources:[]}));
      const input={packageRoot:root,manifestPath:'workflows/build-plan/skill-deps.yaml',dependency:{name:'example',path:'skills/example/SKILL.md'}};
      expect(resolveSkillPackage(input).resolved_bundle_paths).toHaveLength(1);
      unlinkSync(join(root,'skills/example/SKILL.md'));expect(()=>resolveSkillPackage(input)).toThrow(/ENOENT/);
    }finally{rmSync(root,{recursive:true,force:true});}
  });
  it('all four copy consumers point at the one rule and generation keeps ten prompt inputs',()=>{
    for(const p of ['skills/frontend-prototype-render/SKILL.md','skills/plan-design-review/SKILL.md','skills/figma-make-prompt/SKILL.md']){
      expect(existsSync(p)?read(p):'',p).toContain('skills/ui-copy-discipline/SKILL.md');
    }
    // External copy may remain unavailable on rights grounds: never call this a complete adoption assertion.
    const prompt=existsSync('skills/figma-make-prompt/SKILL.md')?read('skills/figma-make-prompt/SKILL.md'):'';
    for(const token of ['任务','页面','IA','状态','组件','布局','响应式','压力','约束','验收'])expect(prompt).toContain(token);
  });
  it('prototype method owns the six adopted concept boundaries and knowledge four-way judgment',()=>{
    const render=read('skills/frontend-prototype-render/SKILL.md');
    for(const token of ['impeccable','design-first-ui-prompting','animation-vocabulary','better-colors','better-typography','better-layout','支持','需上下文','冲突','证据不足'])expect(render).toContain(token);
  });
});
