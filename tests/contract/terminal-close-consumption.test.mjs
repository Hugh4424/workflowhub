// Coverage limit: this contract file proves DECLARED wiring reachability only. It reads the real
// resolver, manifest, catalog and method bytes. It does not execute the terminal consumer, the
// graph cache/payment split, git authorization, PR routes, archive-after-new-bytes or reentry.
// Those effects are judged by the independent P3 consumer against spec Appendix A AC-C10-012 and
// must not be inferred from this suite.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { validateSkillBundle } from '../../runtime/adapters/local-skill-resolver.mjs';
import { resolvePortableStageFiles } from '../../runtime/distribution/skill-bundle-release.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read = locator => readFileSync(path.join(root, locator), 'utf8');
const terminalSection = () => {
  const prompt = read('workflows/build-code/SKILL.md');
  const heading = '## 最后 Phase：终末承接';
  const start = prompt.indexOf(heading);
  expect(start, 'build-code keeps one terminal closeout section').toBeGreaterThanOrEqual(0);
  const rest = prompt.slice(start + heading.length);
  const next = rest.indexOf('\n## ');
  return next < 0 ? rest : rest.slice(0, next);
};

describe('ORACLE-TERMINAL-CLOSE declared wiring reachability',()=>{
  it('declares the installed build-code closure reaching the complete stage-close method',()=>{
    const closure=resolvePortableStageFiles({packageRoot:root,stage:'build-code'});
    for (const locator of [
      'skills/stage-close/SKILL.md',
      'skills/stage-close/skill-bundle.json',
      'skills/knowledge-graph/SKILL.md',
      'skills/spec-specify/SKILL.md',
      'skills/norm-sync/SKILL.md',
      'skills/resolving-merge-conflicts/SKILL.md',
    ]) {
      expect(closure.files,`declared build-code closure omits ${locator}`).toContain(locator);
    }
  });
  it('keeps the existing make-decision consumer on the same close method',()=>{
    expect(resolvePortableStageFiles({packageRoot:root,stage:'make-decision'}).files).toContain('skills/stage-close/SKILL.md');
  });
  it('declares one stage-close trigger in the real build-code dependency manifest',()=>{
    const manifest=yaml.load(read('workflows/build-code/skill-deps.yaml'));
    const entries=manifest.skills.filter(skill=>skill.name==='stage-close');
    expect(entries,'the terminal close method is declared exactly once').toHaveLength(1);
    expect(entries[0].path).toBe('skills/stage-close/SKILL.md');
    // Declared wiring token only: host dispatch is not observed by this contract test.
    expect(entries[0].trigger).toMatch(/^[a-z][a-z0-9_]+$/u);
    expect(entries[0].trigger).not.toBe(entries[0].path);
    const result=validateSkillBundle(root,'skills/stage-close/skill-bundle.json',entries[0].path);
    expect(result.bundle.skill).toBe('stage-close');
    expect(result.bundle.files,'the close method stays one callable body, not a second executor').toEqual(['SKILL.md']);
  });
  it('declares a terminal section that loads stage-close after the report instead of stopping at a handoff',()=>{
    const section=terminalSection();
    expect(section,'declared terminal section names the close method it loads').toContain('skills/stage-close/SKILL.md');
    expect(section,'declared terminal section consumes the real final-report ref').toContain('final-report');
    for (const token of ['加载并执行','代码图','文档图','免费','付费','allowlist','git-authorize.mjs','最终范围确认','重入','不重复']) {
      expect(section,`declared terminal section states "${token}" (declared wiring; effect judged independently)`).toContain(token);
    }
    expect(section,'declared terminal section does not grow a second close system').toMatch(/不(?:新建|生成)第二套/u);
  });
  it('keeps the closeout step identity while declaring the close entry and readback',()=>{
    const manifest=JSON.parse(read('workflows/build-code/steps.json'));
    expect(manifest.steps.length,'the closeout keeps the existing step set').toBe(12);
    const last=manifest.steps.at(-1);
    expect(last.step_id).toBe(12);
    expect(last.step_slug).toBe('closeout');
    expect(last.completion_evidence).toEqual([
      { kind: 'task_original_ref', uri_or_path: 'facts.jsonl#handoff' },
      { kind: 'phase_task_facts', uri_or_path: 'facts.jsonl' },
    ]);
    for (const token of ['stage-close','final-report','读回','代码图','文档图','最终范围确认','重入']) {
      expect(JSON.stringify(last),`declared closeout step describes "${token}"`).toContain(token);
    }
  });
  it('leaves stage-close as the single close owner with reuse-before-create PR handling',()=>{
    const body=read('skills/stage-close/SKILL.md');
    expect(body,'close keeps consuming the existing Git authorization owner').toContain('runtime/interface/git-authorize.mjs');
    expect(body,'close reuses a unique open PR instead of creating another').toContain('只复用唯一的open匹配项');
    expect(body,'close stops instead of creating a duplicate when no unique match exists').toContain('不转而新建');
    expect(body,'close collects exactly one final range confirmation').toContain('取得一次覆盖该实际范围的真实用户答复');
    expect(body,'close does not add a second close plan').toContain('不生成第二套close plan');
  });
});
