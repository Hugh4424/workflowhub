import {describe,it,expect} from 'vitest';
import {readFileSync,existsSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import yaml from 'js-yaml';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const pack='skills/frontend-testing/references/page-audit.md';
const checker='skills/frontend-testing/scripts/check-page-audit.mjs';
const read=path=>readFileSync(join(root,path),'utf8');
function pointerTargets(path){
  return [...read(path).matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map(match=>resolve(root,dirname(path),match[1].split('#')[0]));
}

describe('page-audit wiring',()=>{
  it('frontend-testing resolves both authoritative targets',()=>{
    const targets=pointerTargets('skills/frontend-testing/SKILL.md');
    for(const target of [pack,checker]){
      expect(targets).toContain(resolve(root,target));
      expect(existsSync(resolve(root,target))).toBe(true);
    }
  });
  it('page-mode design review resolves the same pack and checker',()=>{
    const targets=pointerTargets('skills/plan-design-review/SKILL.md');
    for(const target of [pack,checker])expect(targets).toContain(resolve(root,target));
  });
  it('portable bundle includes each local target exactly once',()=>{
    const bundle=JSON.parse(read('skills/frontend-testing/skill-bundle.json'));
    for(const target of ['references/page-audit.md','scripts/check-page-audit.mjs']){
      expect(bundle.files.filter(value=>value===target)).toHaveLength(1);
      expect(existsSync(resolve(root,'skills/frontend-testing',target))).toBe(true);
    }
  });
  it('catalog registers both targets once under their existing skill owner',()=>{
    const catalog=yaml.load(read('skills/catalog.yaml'));
    const entry=catalog.skills.find(skill=>skill.name==='frontend-testing');
    expect(entry.page_audit.criterion).toBe(pack);
    expect(entry.page_audit.checker).toBe(checker);
    expect(catalog.skills.filter(skill=>skill.page_audit?.criterion===pack)).toHaveLength(1);
    expect(entry.page_audit.owner).toBe('frontend-testing');
    expect(entry.page_audit.consumers).toEqual(['page collectors','report consumers','plan-design-review page mode']);
  });
});

// Public CLI behavior beyond the frozen minimum; literal outcomes come from P1/spec.
const valid=()=>({object:{route:'/audit',viewport:'1440x900'},criteria:[{id:'C1',dimension:'layout',state:'通过',evidence:[{ref:'quality/evidence/layout.json'}]}],coverage_limits:[],summary:{overall:'通过'}});
function invoke(input,args){
  const base=mkdtempSync(join(tmpdir(),'page-audit-wiring-'));
  try{
    const path=join(base,'report.json');
    if(input!==undefined)writeFileSync(path,typeof input==='string'?input:JSON.stringify(input));
    const result=spawnSync(process.execPath,[resolve(root,checker),...(args??['--input',path])],{cwd:root,encoding:'utf8',timeout:10000});
    return {...result,payload:result.stdout.trim()?JSON.parse(result.stdout):null};
  }finally{rmSync(base,{recursive:true,force:true});}
}
describe('page-audit CLI structural boundary',()=>{
  it('collects missing top-level fields with precise paths',()=>{
    const result=invoke({});
    expect(result.status).toBe(2);
    expect(result.payload.ok).toBe(false);
    expect(result.payload.errors.map(error=>error.path)).toEqual(expect.arrayContaining(['$.object','$.criteria','$.coverage_limits','$.summary']));
  });
  it('rejects blank evidence refs and wrong types instead of counting entries',()=>{
    const report=valid();
    report.criteria[0].evidence=[{ref:'  '},null];
    report.coverage_limits='desktop only';
    const result=invoke(report);
    expect(result.status).toBe(2);
    expect(result.payload.errors.map(error=>error.code)).toContain('E_MISSING_EVIDENCE');
    expect(result.payload.errors.map(error=>error.path)).toContain('$.coverage_limits');
  });
  it('preserves the four states and requires an applicability basis',()=>{
    const report=valid();
    report.criteria[0]={id:'C1',dimension:'layout',state:'不适用'};
    report.summary.overall='incomplete';
    expect(invoke(report).status).toBe(2);
    report.criteria[0].untested_reason='静态错误页，无布局变体；依据当前任务范围';
    expect(invoke(report).status).toBe(0);
  });
  it('rejects nested score aliases and numeric aggregation without scanning prose',()=>{
    const report=valid();
    report.summary={overall:99,percentage:99};
    report.criteria[0].result={totalScore:99};
    const result=invoke(report);
    expect(result.status).toBe(2);
    expect(result.payload.errors.map(error=>error.code)).toEqual(expect.arrayContaining(['E_TOTAL_SCORE','E_UNKNOWN_AGGREGATED']));
    const restored=valid();
    restored.criteria[0].evidence=[{ref:'quality/evidence/score-measurement.json'}];
    expect(invoke(restored).status).toBe(0);
  });
  it('rejects pass-rate percentage aliases without rejecting frame-rate measurements',()=>{
    for(const [location,key] of [['root','passRate'],['summary','pass_rate'],['criterion','PASS-RATE'],['summary','successRate'],['summary','completionRate'],['summary','通过率']]){
      const report=valid();
      if(location==='root')report[key]=100;
      else if(location==='summary')report.summary[key]=100;
      else report.criteria[0][key]=100;
      const result=invoke(report);
      expect(result.status,`${location}.${key}`).toBe(2);
      expect(result.payload.errors).toEqual(expect.arrayContaining([expect.objectContaining({code:'E_TOTAL_SCORE'})]));
    }
    const report=valid();
    report.criteria[0].measurement={frameRate:60,sampleRate:1000};
    expect(invoke(report).status).toBe(0);
  });
  it('distinguishes malformed JSON, unreadable input and usage from shape rejection',()=>{
    for(const result of [invoke('{'),invoke(undefined),invoke(undefined,[]),invoke(undefined,['--unknown','x'])]){
      expect(result.status).toBe(1);
      expect(result.payload.ok).toBe(false);
      expect(result.payload.errors[0].code).toMatch(/^E_(INPUT|USAGE)/);
      expect(result.stdout.trim().split('\n')).toHaveLength(1);
    }
  });
  it('rejects missing result fields and non-string hashes even on a failed criterion',()=>{
    const report=valid();
    report.summary.overall='失败';
    report.criteria[0].state='失败';
    delete report.criteria[0].evidence;
    expect(invoke(report).status).toBe(2);
    report.criteria[0].evidence=[{ref:'quality/evidence/layout.json',sha256:['a'.repeat(64)]}];
    expect(invoke(report).status).toBe(2);
    report.criteria[0].evidence=[];
    expect(invoke(report).status).toBe(0);
  });
  it('keeps failure and untested states from producing overall pass',()=>{
    for(const state of ['失败','未测','unknown',null]){
      const report=valid();
      report.criteria[0].state=state;
      report.criteria[0].untested_reason='连接中断';
      const result=invoke(report);
      expect(result.status).toBe(2);
      expect(result.payload.errors.map(error=>error.code)).toContain('E_UNKNOWN_AGGREGATED');
    }
  });
});
