// ORACLE-CLOSE-RENAME: freeze after target RED; assertion changes need reviewed TCR.
import { existsSync, readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { resolveStageSkillPackages } from '../../runtime/stage/stage-skill-runtime.mjs';
import { resolveSkillPackage } from '../../runtime/adapters/local-skill-resolver.mjs';
import { resolvePortableStageFiles } from '../../runtime/distribution/skill-bundle-release.mjs';
const root = resolve(import.meta.dirname, '../..');
const old = 'stage-' + 'closeout';
const read = p => readFileSync(resolve(root, p), 'utf8');
const digest = text => createHash('sha256').update(text).digest('hex');
const migrationNarratives = {
  "specs/workflowhub-build-code-efficiency-verify-merge-20261026/spec.md": "345ba573af4e7702ce47fd1f65647f9ba90dd80553104228b65998e0a09ebb14",
  "specs/workflowhub-build-code-efficiency-verify-merge-20261026/decision-log.md": "198f3cce870c287070170d637461cfa38193ea7720a563aeb93ed62f7b3e5614",
  "specs/workflowhub-build-code-efficiency-verify-merge-20261026/phases/P7-关闭技能改名.md": "f6dcbe1b22ccaae440daf6c1fc08d9fdab7fe44e872d7288248ac035d198f04d",
  "specs/workflowhub-build-code-efficiency-verify-merge-20261026/phases/index.md": "581f1db5f9eebbc718067517adffb2a8218aaa8f4fdfc96a00137f34d2d3babf"
};
function scanOldReferences(base) {
  const files = [...new Set(execFileSync('git', ['-C', base, 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], {encoding:'utf8'}).split('\0').filter(Boolean))].sort();
  const result = {scanned:0, deleted:0, binary:0, generated:0, historical:[], migration:[], identity:[], origin:[], active:[]};
  for (const file of files) {
    // These named outputs/cache payloads describe source/history; they never dispatch skills.
    if (['graphify-out/graph.json','graphify-out/manifest.json','graphify-out/.graphify_analysis.json'].includes(file) || file.startsWith('graphify-out/cache/semantic/')) { result.generated++; continue; }
    const absolute = resolve(base,file);
    if (!existsSync(absolute)) { result.deleted++; continue; }
    const bytes = readFileSync(absolute);
    if(bytes.includes(0)) { result.binary++; continue; }
    result.scanned++;
    const lines = bytes.toString('utf8').split('\n');
    const oldLines = lines.filter(line=>line.includes(old));
    if(!oldLines.length) continue;
    const historical = /^(?:docs\/(?:adr|research|archive)\/|specs\/archive\/|specs\/workflowhub-ui-frontend-release-20261020\/)/.test(file);
    // Hash the exact ordered old-bearing lines, including duplicates. A new/changed old reference fails closed.
    const narrative = migrationNarratives[file] === digest(oldLines.join('\n'));
    const origins = file === 'docs/architecture/move-map.json' ? new Set(JSON.parse(bytes.toString('utf8')).entries.filter(e=>e.status==='move' && ['skills/stage-close/SKILL.md','skills/stage-close/skill-bundle.json'].includes(e.destination)).map(e=>e.source)) : new Set();
    lines.forEach((line,index)=>{
      if(!line.includes(old)) return;
      const hit = {file,line:index+1,text:line};
      if(historical) { result.historical.push(hit); return; }
      if(narrative) { result.migration.push(hit); return; }
      const source = line.match(/^\s*"source":\s*"([^"]+)",?\s*$/)?.[1];
      if(source && origins.has(source)) { result.origin.push(hit); return; }
      const remaining = line.replace(new RegExp(`(?:tests/contract/)?${old}-[a-z-]+\\.test\\.mjs`,'g'),'');
      if(!remaining.includes(old)) result.identity.push(hit);
      else result.active.push(hit);
    });
  }
  return result;
}
describe('ORACLE-CLOSE-RENAME', () => {
  it('provides the new callable method and removes the old skill directory', () => {
    expect(existsSync(resolve(root, 'skills/stage-close/SKILL.md')), 'new close skill must exist').toBe(true);
    expect(existsSync(resolve(root, 'skills/stage-close/skill-bundle.json'))).toBe(true);
    expect(existsSync(resolve(root, `skills/${old}`))).toBe(false);
    expect(read('skills/stage-close/SKILL.md')).toMatch(/^name: stage-close$/m);
  });
  it('delivers the new identity through all three real caller manifests and portable consumers', () => {
    const entries = yaml.load(read('skills/catalog.yaml')).skills;
    expect(entries.filter(e => e.name === 'stage-close')).toHaveLength(1);
    expect(entries.some(e => e.name === old)).toBe(false);
    for (const stage of ['make-decision', 'build-prd', 'verify-code']) {
      const result = resolveStageSkillPackages({packageRoot:root, stage});
      expect(result.payloads.has(old)).toBe(false);
      const payload = result.payloads.get('stage-close');
      expect(payload, `${stage}: real resolver delivers close method`).toBeDefined();
      expect(payload.resolved_skill_path).toBe(resolve(root,'skills/stage-close/SKILL.md'));
      expect(payload.resolved_bundle_paths.map(p=>relative(root,p))).toEqual(['skills/stage-close/SKILL.md']);
    }
    for (const stage of ['make-decision','verify-code']) {
      const payload = resolvePortableStageFiles({packageRoot:root,stage});
      expect(payload.files).toContain('skills/stage-close/SKILL.md');
      expect(payload.files).toContain('skills/stage-close/skill-bundle.json');
      expect(payload.files.some(p=>p.startsWith(`skills/${old}/`))).toBe(false);
      for (const dep of ['knowledge-graph','norm-sync','resolving-merge-conflicts','spec-specify']) expect(payload.files).toContain(`skills/${dep}/SKILL.md`);
    }
  });
  it('has no active old skill reference in current methods, callers and affected consumers', () => {
    const scan = scanOldReferences(root);
    console.log('ORACLE-CLOSE-RENAME repository scan ' + JSON.stringify(scan));
    expect(scan.scanned).toBeGreaterThan(0);
    expect(scan.active).toEqual([]);
    const map = JSON.parse(read('docs/architecture/move-map.json'));
    expect(map.entries.some(e=>e.destination==='skills/stage-close/SKILL.md' && e.status==='move')).toBe(true);
  });
  it('detects references in tools, other current docs and appended migration prose without broad exemptions', () => {
    const fixture = mkdtempSync(join(tmpdir(),'wh-close-scan-'));
    const spec = Object.keys(migrationNarratives).find(p=>p.endsWith('/spec.md'));
    const put = (path,body) => { mkdirSync(resolve(fixture,path,'..'),{recursive:true}); writeFileSync(resolve(fixture,path),body); };
    try {
      execFileSync('git',['init','-q',fixture]);
      put('docs/adr/old.md',old);
      put('tests/acceptance/identity.mjs',`const file = 'tests/contract/${old}-skill.test.mjs';`);
      put(spec,read(spec));
      expect(scanOldReferences(fixture).active).toEqual([]);
      put('tools/cli/leak.sh',`skill=skills/${old}/SKILL.md`);
      put('docs/current-guide.txt',`Read skills/${old}/SKILL.md`);
      put('tests/acceptance/identity.mjs',`const file = 'tests/contract/${old}-skill.test.mjs'; invoke('skills/${old}/SKILL.md');`);
      put(spec,read(spec)+`\nCall skills/${old}/SKILL.md now.\n`);
      const active = scanOldReferences(fixture).active;
      expect(active.map(hit=>hit.file)).toEqual(expect.arrayContaining(['tools/cli/leak.sh','docs/current-guide.txt','tests/acceptance/identity.mjs',spec]));
      expect(active.some(hit=>hit.file===spec && hit.text===`Call skills/${old}/SKILL.md now.`)).toBe(true);
    } finally { rmSync(fixture,{recursive:true,force:true}); }
  });
  it('rejects an old-name caller against a package containing only the new method', () => {
    const fixture = mkdtempSync(join(tmpdir(),'wh-close-rename-'));
    try {
      mkdirSync(join(fixture,'skills/stage-close'),{recursive:true});
      writeFileSync(join(fixture,'manifest.yaml'),'fixture caller');
      writeFileSync(join(fixture,'skills/stage-close/SKILL.md'),'---\nname: stage-close\n---\n');
      writeFileSync(join(fixture,'skills/stage-close/skill-bundle.json'),JSON.stringify({schema_version:1,skill:'stage-close',files:['SKILL.md']}));
      expect(()=>resolveSkillPackage({packageRoot:fixture,manifestPath:'manifest.yaml',dependency:{name:old,path:`skills/${old}/SKILL.md`}})).toThrow(new RegExp(old));
      const good = resolveSkillPackage({packageRoot:fixture,manifestPath:'manifest.yaml',dependency:{name:'stage-close',path:'skills/stage-close/SKILL.md'}});
      expect(good.name).toBe('stage-close');
    } finally { rmSync(fixture,{recursive:true,force:true}); }
  });
});
