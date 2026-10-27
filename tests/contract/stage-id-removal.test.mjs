import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, writeFileSync, mkdtempSync, mkdirSync, realpathSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import yaml from 'js-yaml';
import { readTaskFacts, writeStageRow } from '../../runtime/task/task-store.mjs';
import { FORMAL_DEVELOPMENT_STAGES, WORKFLOW_STAGES } from '../../runtime/stage/stage-registry.mjs';
import { resolvePortableStageFiles } from '../../runtime/distribution/skill-bundle-release.mjs';
import { stageRuntimeCliMain } from '../../tools/cli/stage-runtime.mjs';
import { resolveTrustedOcrRoute } from '../../runtime/review/ocr-delegation-adapter.mjs';
import { buildReviewMaterials } from '../../skills/wh-review/scripts/review-materials.mjs';

const root=resolve(import.meta.dirname,'../..');
const retired=['verify','code'].join('-');
const excluded=['docs/adr/**','docs/research/**','docs/archive/**','specs/archive/**','specs/workflowhub-ui-frontend-release-20261020/**','specs/workflowhub-build-code-efficiency-verify-merge-20261026/**','.planning/**','graphify-out/**','node_modules/**'];
function scan(cwd) {
  const args=['-n','--hidden','--glob','!.git/**',...excluded.flatMap(p=>['--glob','!'+p]),retired,'.'];
  try{return execFileSync('rg',args,{cwd,encoding:'utf8'}).trim();}
  catch(error){if(error.status===1)return '';throw error;}
}
// Classification is a test observation, not a runtime allowlist or registry.
// Unknown uses and stale positive tests remain visible; they are not passes.
// Only these source-owned historical fields are understood; other file types
// or unrecognized fields stay unjudged and cannot support a zero conclusion.
function knownHistoricalMetadata(path,text,source) {
  let residual=text;
  if(path==='.markdownlint-cli2.jsonc'&&text.trim().replace(/,$/,'')===JSON.stringify('specs/m9-verify-code'))return 'named-markdownlint-historical-spec-ignore';
  if(path==='facts.jsonl') {
    const row=JSON.parse(text);
    if(Object.keys(row).sort().join(',')==='record_kind,source,stage,task_id'&&row.record_kind==='stage'&&row.task_id==='p11-history'&&row.stage===retired&&row.source==='historical original')return 'named-owned-historical-stage-row';
  }
  if(path==='skills/catalog.yaml'&&/^\s*local_changes:/.test(text)) {
    residual=residual.replace('原verify-code（历史）授权/安全收口','历史授权/安全收口');
    if(!residual.includes(retired))return 'named-catalog-history-source';
  }
  if(path==='docs/architecture/move-map.json') {
    if(/^\s*"\.planning\/\d{4}-\d{2}-\d{2}-[^"\n]*verify-code[^"\n]*",?\s*$/.test(text))return 'named-move-map-historical-reader-ref';
    if(/^\s*"owner":/.test(text))residual=residual.replace('N6 verify-code独立测试作者','N6历史独立测试作者').replace('已完成并冻结CLI/spec/verify-code三repo源','已冻结原三repo源').replace('不写spec/verify-code。','不写历史源。');
    if(/^\s*"retention_basis": "332原件及当前CLI全文、/.test(text))residual=residual.replace('verify-code实际步骤已实读','原验收步骤已实读');
    if(!residual.includes(retired))return 'named-move-map-historical-writer-or-basis';
  }
  const id=/^\s*"tests\/deferred-acceptance-semantics\.test\.mjs > deferred acceptance semantics > keeps verify-code evidence result (?:pass as passed|fail as failed|inconclusive as inconclusive|deferred as deferred)",?\s*$/;
  if(path==='docs/quality/test-asset-registry.json'&&JSON.parse(source).revision==='2026-09-28.card04-limited.2'&&id.test(text))return 'named-CARD04-historical-evidence-test-id';
  if(path==='docs/quality/business-case-catalog.json') {
    const data=JSON.parse(source),line=text.trim().replace(/,$/,'');
    if(data.revision!=='2026-09-30.card03-stable-source-anchors.17')return null;
    if(id.test(text)||line===JSON.stringify('verify-code read-only sampling'))return 'named-CARD04-readonly-sampling-or-test-id';
    const obligation=data.evolution.phase_obligations.find(item=>item.phase_id==='P12'&&item.task_id==='T023'&&item.status==='not_done'&&item.consumer_status==='test_only'&&item.source_path==='specs/archive/workflowhub-thin-core-card-04-20260919/phases/P12.md');
    const historical={test_target:'tests/contract/verify-code-business-handoff.test.mjs',consumer_path:'workflows/verify-code/SKILL.md',change_trigger:'workflows/verify-code/SKILL.md',impact:'Skill text and a contract test do not prove live verify-code review consumption of business case results.'};
    if(obligation&&Object.keys(historical).some(key=>line===JSON.stringify(key)+': '+JSON.stringify(historical[key])))return 'named-CARD04-unfinished-historical-obligation';
    if(line===JSON.stringify('impact')+': '+JSON.stringify('The five finite cases cannot establish full business-case coverage, change-scope selection, runner execution, browser reconciliation or verify-code handoff.'))return 'named-CARD04-unproved-coverage-boundary';
  }
  return null;
}

function classifyReference(line, cwd) {
  const match=line.match(/^\.\/([^:]+):(\d+):(.*)$/);
  if(!match)throw new Error('unclassified scan output: '+line);
  const [,path,number,text]=match;
  const source=readFileSync(join(cwd,path),'utf8');
  const prefix=source.split('\n').slice(0,Number(number)).join('\n');
  const symbols=[...prefix.matchAll(/(?:function\s+([A-Za-z0-9_$]+)|(?:it|test|describe)\s*\(\s*['"]([^'"\n]+))/g)];
  const origin=symbols.at(-1)?.[1]??symbols.at(-1)?.[2]??'source line '+number;
  let purpose='unknown-source-use',active=null;
  if(/(?:^|\/)(?:tests|__tests__)\//.test(path)){purpose=/reject|unknown|invalid|retired|histor|legacy|old|拒绝|退役|历史/i.test(origin)?'test-negative-or-historical-input':'unmigrated-positive-or-unresolved-test-input';active=false;}
  else if(path==='runtime/stage/stage-registry.mjs'&&/^export const RETIRED_STAGE_VERIFY_CODE = ['"]verify-code['"];\s*$/.test(text)){purpose='named-passive-retirement-constant';active=false;}
  else if(path==='skills/workflowhub-multica-sync/scripts/multica-skill-sync.mjs'&&/^const RETIRED_STAGE_VERIFY_CODE = ['"]verify-code['"];\s*$/.test(text)){purpose='local-online-retirement-observation-identity';active=false;}
  else if(path==='runtime/review/canonical-review-result.mjs'&&origin==='deriveTerminalConclusion'&&/throw new TypeError\("REVIEW_EVIDENCE_INVALID: verify-code conclusion input is invalid"\)/.test(text)){purpose='preserved-error-contract';active=false;}
  else if(path==='skills/wh-review/scripts/review-materials.mjs'&&origin==='selectVerifyCodeDiffPaths'&&/if \(stage !== "verify-code"\) return null;/.test(text)){purpose='legacy-pure-path-helper-not-dispatch';active=false;}
  else if(path.endsWith('.mjs')){purpose='current-production-reference';active=true;}
  else if(/\.md$/.test(path)) {
    // Consume only the named source's exact historical/negative clause. A
    // second affirmative occurrence on that same line remains a violation.
    let residual=text;
    if(path==='skills/stage-close/SKILL.md')residual=residual.replace('原 verify-code（历史）的授权/安全收口','历史授权/安全收口');
    if(path==='workflows/build-code/SKILL.md')residual=residual.replace('旧 verify-code 记录只读保留，当前调用只用终末身份','旧记录只读保留').replace('不引导进入 verify-code 下一阶段','不引导进入旧下一阶段');
    if(path==='GLOSSARY.md')residual=residual.replace('verify-code/test-acceptance 的历史含义保留；当前 post 开发路线为三阶段','历史标签含义保留；当前开发路线为三阶段');
    if(path==='THIRD_PARTY_NOTICES.md')residual=residual.replace('一次 verify-code 代码审查调用','一次历史代码审查调用').replace('workflows/verify-code/SKILL.md','历史方法来源');
    if(path==='specs/Improvements.md')residual=residual.replace('（N10 verify-code）','（N10 历史验收）').replace('N10/verify-code','N10/历史验收').replace('2026-10-22-064-verify-code-document.json','历史审查原件');
    if(path==='skills/wh-review/SKILL.md')residual=residual.replace('tests/contract/verify-code-dsh-public-run.test.mjs','未迁的旧测试引用');
    active=residual.includes(retired);
    purpose=active?'current-method-reference':path==='skills/wh-review/SKILL.md'?'unresolved-retired-test-reference':path==='THIRD_PARTY_NOTICES.md'?'named-external-source-rights-provenance':'named-historical-or-negative-clause';
  } else {const known=knownHistoricalMetadata(path,text,source);if(known){purpose=known;active=false;}}
  return {path,line:Number(number),origin,purpose,active};
}
function classifyScan(cwd){return scan(cwd).split('\n').filter(Boolean).map(line=>classifyReference(line,cwd));}

function fixture(run) {
  const dir=realpathSync(mkdtempSync(join(tmpdir(),'p11-history-')));
  writeFileSync(join(dir,'task.json'),JSON.stringify({project_name:'workflowhub',task_id:'p11-history'}));
  writeFileSync(join(dir,'facts.jsonl'),JSON.stringify({record_kind:'stage',task_id:'p11-history',stage:retired,source:'historical original'})+'\n');
  return Promise.resolve().then(()=>run(dir)).finally(()=>rmSync(dir,{recursive:true,force:true}));
}
describe('ORACLE-STAGE-ID-REMOVAL',()=>{
  it('removes the callable directory and all former stage files',()=>{
    expect(existsSync(join(root,'workflows',retired))).toBe(false);
    for(const file of ['SKILL.md','steps.json','skill-deps.yaml','metrics-writer.mjs','capture.mjs','targeted-capture.mjs'])expect(existsSync(join(root,'workflows',retired,file)),file).toBe(false);
  });
  it('classifies every literal use and rejects current callable or misleading method references',()=>{
    const rows=classifyScan(root);
    expect(rows.every(row=>row.path&&row.line>0&&row.origin&&row.purpose)).toBe(true);
    console.log(JSON.stringify({literal_references:rows,boundary:'Stale positive tests, provenance and unknown uses are observations, not migrated tests or quality evidence.'}));
    expect(rows.filter(row=>row.active!==false)).toEqual([]);
  });
  it('detects injected callable identities and misleading methods without a directory exemption',async()=>fixture(dir=>{
    expect(classifyScan(dir).map(row=>row.purpose)).toContain('named-owned-historical-stage-row');
    writeFileSync(join(dir,'owned.mjs'),"export const STAGES=['"+retired+"'];\n");
    expect(classifyScan(dir).filter(row=>row.active)).toHaveLength(1);
    rmSync(join(dir,'owned.mjs'));
    for(const [file,body] of [['owned.js',"module.exports={stage:'"+retired+"'};"],['owned.json',JSON.stringify({stage:retired})],['owned.yaml','stage: '+retired]]) {
      writeFileSync(join(dir,file),body+'\n');
      const row=classifyScan(dir).find(row=>row.path===file);
      expect(row.purpose).toBe('unknown-source-use');
      expect([row].filter(row=>row.active!==false)).toHaveLength(1);
      rmSync(join(dir,file));
    }
    const originalHistory=readFileSync(join(dir,'facts.jsonl'),'utf8');
    writeFileSync(join(dir,'facts.jsonl'),JSON.stringify({...JSON.parse(originalHistory),current_stage:retired})+'\n');
    expect(classifyScan(dir).find(row=>row.path==='facts.jsonl').purpose).toBe('unknown-source-use');
    expect(classifyScan(dir).filter(row=>row.active!==false)).toHaveLength(1);
    writeFileSync(join(dir,'facts.jsonl'),originalHistory);
    mkdirSync(join(dir,'docs/quality'),{recursive:true});
    const catalog={revision:'2026-09-30.card03-stable-source-anchors.17',evolution:{impact:'现在必须独立调用 '+retired,phase_obligations:[{phase_id:'P12',task_id:'T023',status:'not_done',consumer_status:'test_only',source_path:'specs/archive/workflowhub-thin-core-card-04-20260919/phases/P12.md',consumer_path:'现在必须独立调用 '+retired}]}};
    writeFileSync(join(dir,'docs/quality/business-case-catalog.json'),JSON.stringify(catalog,null,2));
    expect(classifyScan(dir).filter(row=>row.path==='docs/quality/business-case-catalog.json'&&row.purpose==='unknown-source-use')).toHaveLength(2);
    expect(classifyScan(dir).filter(row=>row.active!==false)).toHaveLength(2);
    rmSync(join(dir,'docs/quality/business-case-catalog.json'));
    for(const prefix of ['下一阶段独立执行 ','旧流程下一阶段仍独立执行 ','历史来源说明下一阶段独立执行 ','原文 https://owned.invalid 规定下一阶段独立执行 ']) {
      writeFileSync(join(dir,'owned.md'),prefix+retired+'\n');
      expect(classifyScan(dir).filter(row=>row.active)).toHaveLength(1);
    }
    rmSync(join(dir,'owned.md'));expect(classifyScan(dir).filter(row=>row.active)).toEqual([]);
  }));
  it('rejects retired and unknown public, portable, packet and configured-route identities',async()=>fixture(async dir=>{
    expect(FORMAL_DEVELOPMENT_STAGES).toEqual(['make-decision','build-plan','build-code']);
    expect(WORKFLOW_STAGES).toEqual([...FORMAL_DEVELOPMENT_STAGES,'build-prd']);
    for(const stage of [retired,'unknown-stage']) {
      expect(()=>resolvePortableStageFiles({packageRoot:root,stage})).toThrow(/stage/);
      await expect(stageRuntimeCliMain(['run','--action=execute','--stage='+stage,'--project=workflowhub','--task=p11-owned'],{cwd:root})).rejects.toThrow(/stage/);
      expect(()=>buildReviewMaterials({attachmentRoot:dir,stage,materials:{}})).toThrow(/stage/);
      const configured={stages:{[stage]:{mode:'single_round',initial:['codex/owned']}}};
      expect(resolveTrustedOcrRoute(configured,stage,null,null,null)).toBeNull();
    }
    const configured={stages:{'build-code':{mode:'full_only',initial:['codex/owned']},[retired]:{mode:'single_round',initial:['codex/retired']}}};
    expect(resolveTrustedOcrRoute(configured,'build-code',null,null,'phase')).toMatchObject({mode:'full_only'});
    expect(resolveTrustedOcrRoute(configured,'build-code',null,null,'terminal')).toMatchObject({mode:'single_round'});
  }));
  it('reads historical rows unchanged and rejects new writes of the retired identity',async()=>fixture(async dir=>{
    const before=readFileSync(join(dir,'facts.jsonl'),'utf8');
    expect(readTaskFacts(dir)[0].stage).toBe(retired);
    await expect(writeStageRow(dir,{stage:retired,source:'must reject'})).rejects.toThrow(/stage/);
    expect(readFileSync(join(dir,'facts.jsonl'),'utf8')).toBe(before);
  }));
  it('removes registry entries, retired contract packaging and the temporary CLI filter',()=>{
    const skills=yaml.load(readFileSync(join(root,'skills/catalog.yaml'),'utf8')).skills;
    for(const skill of skills){expect(skill.used_by_stages??[]).not.toContain(retired);expect(skill.name).not.toBe(retired);expect(skill.path??'').not.toContain('workflows/'+retired+'/');}
    const move=JSON.parse(readFileSync(join(root,'docs/architecture/move-map.json'),'utf8'));
    for(const entry of move.entries){for(const field of ['source','destination'])expect(entry[field]??'').not.toContain('workflows/'+retired+'/');expect(entry.source).not.toBe('skills/wh-review/contracts/'+retired+'.md');}
    const plan=JSON.parse(readFileSync(join(root,'skills/wh-review/stage-skill-plan.json'),'utf8'));expect(plan.stages).not.toHaveProperty(retired);
    for(const file of ['skills/wh-review/manifest.json','skills/wh-review/skill-bundle.json'])expect(JSON.stringify(JSON.parse(readFileSync(join(root,file),'utf8')))).not.toContain('contracts/'+retired+'.md');
    expect(readFileSync(join(root,'tools/cli/stage-runtime.mjs'),'utf8')).not.toContain('contracts/'+retired+'.md');
    expect(existsSync(join(root,'skills/wh-review/contracts',retired+'.md'))).toBe(false);
  });
  it.each(['phase','terminal'])('builds the real %s packet without the retired contract and retains terminal requirements',async scope=>fixture(dir=>{
    const diffPath=join(dir,'delivery.diff');
    writeFileSync(diffPath,'diff --git a/src/app.mjs b/src/app.mjs\n--- a/src/app.mjs\n+++ b/src/app.mjs\n@@ -1 +1 @@\n-old\n+new\n');
    const packet=buildReviewMaterials({attachmentRoot:dir,stage:'build-code',reviewScope:scope,phaseId:scope==='phase'?'P11':null,
      materials:scope==='phase'?{approved_spec:'Owned phase contract',acceptance_criteria:'AC-OWNED-1: works'}:{changed_files:['src/app.mjs'],acceptance_criteria:'AC-OWNED-1: works',implementation_assessment:'Owned implementation',test_context:'Owned temporary fixture; real packager',open_risks:'No external quality observed'},
      source:{diffPath,baseCommit:'a'.repeat(40),capturedHead:'b'.repeat(40)}});
    try {
      const manifest=JSON.parse(readFileSync(join(packet.bundleRoot,'manifest.json'),'utf8'));
      expect(JSON.stringify(manifest)).not.toContain('contracts/'+retired+'.md');
      const contract=readFileSync(join(packet.bundleRoot,'contracts/build-code.md'),'utf8');
      for(const term of ['review_scope=terminal','material_coverage','read_confirmed','discarded_facts','implementation_assessment','test_context','open_risks','1.12.9','root_cause','single_round','整份交付 diff'])expect(contract).toContain(term);
      expect(existsSync(join(packet.bundleRoot,'contracts/provider-protocol.md'))).toBe(true);
    } finally {packet.dispose();}
  }));
});
