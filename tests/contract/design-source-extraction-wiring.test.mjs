import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const ROOT=process.cwd();
const read=p=>readFileSync(join(ROOT,p),"utf8");
describe("ORACLE-EXTRACT-WIRE",()=>{
  it("wire:build-plan-reads",()=>{expect(read("workflows/build-plan/SKILL.md")).toContain("design-source-extraction");});
  it("wire:build-code-reads",()=>{expect(read("workflows/build-code/SKILL.md")).toContain("design-source-extraction");});
  it("wire:verify-code-reads",()=>{expect(read("workflows/verify-code/SKILL.md")).toContain("design-source-extraction");});
  it("register:move-map-entry",()=>{const mm=JSON.parse(read("docs/architecture/move-map.json"));const rows=Array.isArray(mm)?mm:mm.entries??[];expect(JSON.stringify(rows)).toContain("design-source-extraction");});
  it("register:skill-deps",()=>{for(const p of ["workflows/build-plan/skill-deps.yaml","workflows/build-code/skill-deps.yaml","workflows/verify-code/skill-deps.yaml"])expect(read(p),`${p} must list design-source-extraction`).toContain("design-source-extraction");});
  it("register:catalog-and-registry",()=>{expect(read("skills/catalog.yaml")).toContain("design-source-extraction");expect(read("skills/reuse-registry.md")).toContain("design-source-extraction");});
  it("external:records",()=>{const s=read("skills/design-source-extraction/SKILL.md");expect(s).toMatch(/0\.6\.0\.16|ego lite/);expect(s).toMatch(/style-ref-gen/);});
});

// TCR319 / independent071. Existing production loader/resolver; no new validator.
const fs=await import('node:fs');
const {tmpdir}=await import('node:os');
const yaml=(await import('js-yaml')).default;
const {loadStageSkillManifest}=await import('../../runtime/stage/stage-skill-runtime.mjs');
const {resolveSkillPackage}=await import('../../runtime/adapters/local-skill-resolver.mjs');
const stages=['build-plan','build-code','verify-code'];
const assets=['SKILL.md','scripts/collect-design-source.mjs','references/norm-alignment.md','references/isolated-consumption.md'];
const producers=[...assets.map(p=>'skills/design-source-extraction/'+p),'skills/design-source-extraction/skill-bundle.json'];
const dependency=stage=>{
  const loaded=loadStageSkillManifest(ROOT,stage);
  const dep=loaded.manifest.skills.find(d=>d.name==='design-source-extraction');
  expect(dep,stage+' must declare extraction dependency').toBeDefined();
  return {loaded,dep};
};
const complete=files=>files.length===assets.length&&new Set(files).size===assets.length&&assets.every(p=>files.includes(p));
const registered=()=>JSON.parse(read('docs/architecture/move-map.json')).entries.filter(r=>producers.includes(r.source));
const nonempty=v=>typeof v==='string'&&v.trim().length>0;
const validEntries=rows=>rows.length===producers.length&&new Set(rows.map(r=>r.source)).size===producers.length&&producers.every(p=>rows.some(r=>r.source===p&&r.destination===p))&&rows.every(r=>['responsibility','owner','consumer','delete_condition','retention_basis'].every(k=>nonempty(r[k]))&&Array.isArray(r.named_data_readers)&&r.named_data_readers.length>0);
const fixture=stage=>{
  const {dep}=dependency(stage),root=fs.mkdtempSync(join(tmpdir(),'c04-p6-bundle-'));
  const manifest=join(root,'workflows',stage,'skill-deps.yaml');
  fs.mkdirSync(join(root,'workflows',stage),{recursive:true});
  fs.writeFileSync(manifest,yaml.dump({stage,skills:[dep]}));
  const bundle=JSON.parse(read('skills/design-source-extraction/skill-bundle.json'));
  expect(complete(bundle.files)).toBe(true);
  const base=join(root,'skills/design-source-extraction');fs.mkdirSync(base,{recursive:true});
  fs.writeFileSync(join(base,'skill-bundle.json'),JSON.stringify(bundle));
  // Only literal filesystem seam inputs, not copied directory/source snapshots.
  for(const file of bundle.files){fs.mkdirSync(join(base,file,'..'),{recursive:true});fs.writeFileSync(join(base,file),file.endsWith('.mjs')?'// fixture I/O only':'# fixture I/O only');}
  return {root,base,manifest,dep,cleanup:()=>fs.rmSync(root,{recursive:true,force:true})};
};
describe('P6 real manifest and registered payload consumption',()=>{
  it.each(stages)('%s actual loader resolves four readable delivery files',stage=>{
    const {loaded,dep}=dependency(stage);
    const payload=resolveSkillPackage({packageRoot:ROOT,manifestPath:loaded.relative,dependency:dep});
    expect(payload.resolved_bundle_paths.sort()).toEqual(assets.map(p=>join(ROOT,'skills/design-source-extraction',p)).sort());
    for(const path of payload.resolved_bundle_paths)expect(fs.readFileSync(path).length).toBeGreaterThan(0);
  });
  it.each(stages)('%s conditionally reads artifact fields and preserves non-UI norm route',stage=>{
    const text=read('workflows/'+stage+'/SKILL.md');
    expect(text).toContain('非UI规范与索引');
    for(const token of ['design-source-extraction.json','freshness','unknown','stale','collect-design-source.mjs','--plan'])expect(text,stage+': '+token).toContain(token);
    const fields=stage==='build-plan'?['source','scope','norm_basis','items']:stage==='build-code'?['items','pending_review','blocked_scope']:['coverage','failures','commands'];
    for(const field of fields)expect(text).toContain(field);
  });
  it('bundle declares complete four files, excluding bundle itself',()=>expect(complete(JSON.parse(read('skills/design-source-extraction/skill-bundle.json')).files)).toBe(true));
  it('each of five actual producer paths has one complete ownership record',()=>{
    const rows=registered();expect(validEntries(rows)).toBe(true);
    for(const row of rows)for(const path of row.named_data_readers)expect(fs.existsSync(join(ROOT,path)),path).toBe(true);
  });
  it.each(['owner','duplicate','missing'])('registration oracle rejects %s',kind=>{
    const rows=registered();expect(validEntries(rows)).toBe(true);
    const bad=structuredClone(rows);if(kind==='owner')delete bad[0].owner;else if(kind==='duplicate')bad[1]=bad[0];else bad.pop();
    expect(validEntries(bad)).toBe(false);
  });
  it('missing dependency fails explicit consumer assertion, not skipped',()=>{
    const f=fixture('build-code');try{
      expect(resolveSkillPackage({packageRoot:f.root,manifestPath:'workflows/build-code/skill-deps.yaml',dependency:f.dep}).resolved_bundle_paths).toHaveLength(4);
      fs.writeFileSync(f.manifest,yaml.dump({stage:'build-code',skills:[]}));
      const loaded=loadStageSkillManifest(f.root,'build-code');
      expect(()=>expect(loaded.manifest.skills.find(d=>d.name==='design-source-extraction')).toBeDefined()).toThrow();
    }finally{f.cleanup();}
  });
  it('declared file removed fails actual resolver',()=>{
    const f=fixture('build-code');try{
      expect(resolveSkillPackage({packageRoot:f.root,manifestPath:'workflows/build-code/skill-deps.yaml',dependency:f.dep}).resolved_bundle_paths).toHaveLength(4);
      fs.unlinkSync(join(f.base,assets[1]));
      expect(()=>resolveSkillPackage({packageRoot:f.root,manifestPath:'workflows/build-code/skill-deps.yaml',dependency:f.dep})).toThrow(/ENOENT/);
    }finally{f.cleanup();}
  });
  it('omitted declaration is caught by four-file oracle, not invented resolver rule',()=>{
    const f=fixture('build-code');try{
      const bundle=JSON.parse(fs.readFileSync(join(f.base,'skill-bundle.json')));bundle.files.pop();fs.writeFileSync(join(f.base,'skill-bundle.json'),JSON.stringify(bundle));
      const resolved=resolveSkillPackage({packageRoot:f.root,manifestPath:'workflows/build-code/skill-deps.yaml',dependency:f.dep});
      expect(resolved.resolved_bundle_paths).toHaveLength(3);
      expect(complete(bundle.files)).toBe(false);
    }finally{f.cleanup();}
  });
});
