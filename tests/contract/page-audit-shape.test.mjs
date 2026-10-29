// Frozen ORACLE-PAGE-AUDIT-SHAPE after recorded RED 2026-10-29; assertion changes require an independently reviewed TCR
// Target under test: skills/frontend-testing/scripts/check-page-audit.mjs, created by the implementation phase.
// Replay: node node_modules/vitest/vitest.mjs run tests/contract/page-audit-shape.test.mjs   (cwd = repository root)
// The validator is driven as a subprocess with --input from the repository root and is never imported, so an absent
// implementation stays a target assertion failure (exit status / ok payload) instead of a collection error.
// Exit status contract: 0 = shape accepted, 2 = rejected, any other non-zero = failure but not a verdict.
// Stdout contract: exactly one JSON line {"ok":boolean,"errors":[{"code":"E_...","path":"...","message":"..."}]}.
import {describe,it,expect} from 'vitest';
import {mkdtempSync,writeFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const target='skills/frontend-testing/scripts/check-page-audit.mjs';
const targetPath=join(root,target);

const clip=(value,limit=360)=>{const text=String(value??'').replace(/\r/g,'').trim().replace(/\n/g,' | ');return text.length<=limit?text:`${text.slice(0,limit)}...`;};
const absentNote=()=>existsSync(targetPath)?'':` [target ${target} is absent; this RED is expected]`;
// Names the observed status so a crash/missing script is never confused with a real shape verdict.
function exitMeaning(status,signal){
  if(status===null)return `no exit status (signal ${signal??'unknown'}): timeout or kill, not a shape verdict`;
  if(status===0)return 'exit 0 (shape accepted)';
  if(status===2)return 'exit 2 (rejected)';
  return `exit ${status}: neither accepted (0) nor rejected (2); crash, absent script or usage error`;
}

// One fresh temp directory per invocation, removed in finally; nothing else is written outside os.tmpdir.
function runAudit(report,label){
  const base=mkdtempSync(join(tmpdir(),'page-audit-shape-'));
  try{
    const input=join(base,'report.json');
    writeFileSync(input,`${JSON.stringify(report,null,2)}\n`);
    const result=spawnSync(process.execPath,[targetPath,'--input',input],{
      cwd:root,encoding:'utf8',timeout:60000,env:{...process.env,NO_COLOR:'1',FORCE_COLOR:'0'}
    });
    return {label,status:result.status,signal:result.signal,stdout:result.stdout??'',stderr:result.stderr??''};
  } finally {
    rmSync(base,{recursive:true,force:true});
  }
}

function readVerdict(result){
  const lines=result.stdout.trim().split('\n').map(line=>line.trim()).filter(Boolean);
  expect(lines.length,`${result.label}: stdout must be exactly one JSON line, got ${lines.length} line(s); stderr=${clip(result.stderr)}${absentNote()}`).toBe(1);
  let payload=null;
  try{payload=JSON.parse(lines[0]);}catch{payload=null;}
  expect(payload,`${result.label}: stdout line 1 is not JSON; stdout=${clip(result.stdout)}; stderr=${clip(result.stderr)}${absentNote()}`).not.toBeNull();
  expect(typeof payload.ok,`${result.label}: ok must be a boolean; payload=${clip(lines[0])}`).toBe('boolean');
  expect(Array.isArray(payload.errors),`${result.label}: errors must be an array; payload=${clip(lines[0])}`).toBe(true);
  return payload;
}

function expectErrorShape(result){
  const payload=readVerdict(result);
  payload.errors.forEach((error,index)=>{
    const at=`${result.label}: errors[${index}]`;
    expect(typeof error?.code,`${at}.code must be a string; entry=${clip(JSON.stringify(error))}`).toBe('string');
    expect(error.code,`${at}.code must look like E_<UPPER>; entry=${clip(JSON.stringify(error))}`).toMatch(/^E_[A-Z0-9_]+$/);
    expect(typeof error?.path,`${at}.path must be a string; entry=${clip(JSON.stringify(error))}`).toBe('string');
    expect(typeof error?.message,`${at}.message must be a string; entry=${clip(JSON.stringify(error))}`).toBe('string');
    expect(error.message.trim().length,`${at}.message must be non-empty; entry=${clip(JSON.stringify(error))}`).toBeGreaterThan(0);
  });
  return payload;
}

// Rejection = exit 2 + ok:false + the required code present. Extra codes are allowed; only the named code is frozen.
function expectRejected(report,code,label){
  const result=runAudit(report,label);
  expect(result.status,`${label}: expected ${exitMeaning(2)} but got ${exitMeaning(result.status,result.signal)}; stderr=${clip(result.stderr)}${absentNote()}`).toBe(2);
  const payload=expectErrorShape(result);
  expect(payload.ok,`${label}: a rejected report must still print ok:false; stdout=${clip(result.stdout)}`).toBe(false);
  const codes=payload.errors.map(error=>error.code);
  expect(codes,`${label}: required code ${code} missing; reported [${codes.join(', ')||'<none>'}]`).toContain(code);
}

const pass=(id,dimension)=>({id,dimension,state:'通过',evidence:[{ref:`screens/${dimension}-default.png`}]});
// A shape-legal report: every 通过 carries evidence, no limits, overall 通过.
function baseReport(){
  return {
    object:{route:'/page-audit-fixture',viewport:'1440x900'},
    criteria:[pass('C-01','layout'),pass('C-02','typography')],
    coverage_limits:[],
    summary:{overall:'通过'}
  };
}
const withState=(state,dimension,extra={})=>({id:`C-${dimension}`,dimension,state,evidence:[],...extra});

describe('check-page-audit shape oracle',()=>{
  it('E_TOTAL_SCORE: rejects any total-score field on the report root or in summary',()=>{
    const rootScore=baseReport();
    rootScore.total_score=91;
    expectRejected(rootScore,'E_TOTAL_SCORE','root total_score');
    const summaryScore=baseReport();
    summaryScore.summary={overall:'通过',score:88};
    expectRejected(summaryScore,'E_TOTAL_SCORE','summary score');
    const chinese=baseReport();
    chinese['总分']=92;
    expectRejected(chinese,'E_TOTAL_SCORE','root 总分');
  });

  it('E_MISSING_EVIDENCE: rejects a 通过 criterion whose evidence is an empty array',()=>{
    const report=baseReport();
    report.criteria=[{id:'C-01',dimension:'layout',state:'通过',evidence:[]},pass('C-02','typography')];
    report.summary={overall:'失败'};
    expectRejected(report,'E_MISSING_EVIDENCE','通过 with evidence: []');
  });

  it('E_MISSING_UNTESTED_REASON: rejects 未测 with no reason and with a whitespace-only reason',()=>{
    const absent=baseReport();
    absent.criteria.push(withState('未测','spacing'));
    absent.summary={overall:'incomplete'};
    expectRejected(absent,'E_MISSING_UNTESTED_REASON','未测 without untested_reason');
    const blank=baseReport();
    blank.criteria.push(withState('未测','spacing',{untested_reason:'   \n\t '}));
    blank.summary={overall:'incomplete'};
    expectRejected(blank,'E_MISSING_UNTESTED_REASON','未测 with whitespace-only untested_reason');
  });

  it('E_LIMITED_PASS: rejects overall 通过 while coverage_limits is non-empty',()=>{
    const report=baseReport();
    report.coverage_limits=['仅桌面 1440x900 视口，未覆盖移动视口与 200% 缩放'];
    expectRejected(report,'E_LIMITED_PASS','coverage_limits non-empty with overall 通过');
  });

  it('E_UNKNOWN_AGGREGATED: rejects overall 通过 while a 未测 criterion exists',()=>{
    const report=baseReport();
    report.criteria.push(withState('未测','spacing',{untested_reason:'200% 缩放下采集通道失联，未取得间距证据。'}));
    // coverage_limits stays empty and the 未测 reason is filled, so aggregation is the only violation.
    expectRejected(report,'E_UNKNOWN_AGGREGATED','未测 present with overall 通过');
  });

  it('E_STATE_OUT_OF_ENUM: rejects a state outside 通过/失败/未测/不适用',()=>{
    const report=baseReport();
    report.criteria.push(withState('限定通过','states',{evidence:[{ref:'screens/states-limited.png'}]}));
    report.summary={overall:'失败'};
    expectRejected(report,'E_STATE_OUT_OF_ENUM','state 限定通过');
  });

  it('accepts a four-state report whose 通过 items carry evidence and whose 未测 item keeps overall incomplete',()=>{
    const report={
      object:{route:'/page-audit-fixture',viewport:'1440x900'},
      criteria:[
        pass('C-01','layout'),
        {id:'C-02',dimension:'typography',state:'通过',evidence:[{ref:'screens/typography-default.png'},{ref:'notes/typography-measurements.md'}]},
        {id:'C-03',dimension:'colors',state:'失败',evidence:[{ref:'screens/colors-mismatch.png'}]},
        {id:'C-04',dimension:'spacing',state:'未测',evidence:[],untested_reason:'1440x900 下 200% 缩放采集通道失联，未取得间距证据。'},
        {id:'C-05',dimension:'states',state:'不适用',untested_reason:'该页为静态只读错误页，除默认态外无交互态，故不适用。'}
      ],
      coverage_limits:['仅桌面 1440x900；未覆盖移动视口与读屏补充证据'],
      summary:{overall:'incomplete'}
    };
    const result=runAudit(report,'shape-legal four-state report');
    expect(result.status,`shape-legal four-state report: expected ${exitMeaning(0)} but got ${exitMeaning(result.status,result.signal)}; stderr=${clip(result.stderr)}${absentNote()}`).toBe(0);
    const payload=readVerdict(result);
    expect(payload.ok,`shape-legal four-state report: expected ok:true; stdout=${clip(result.stdout)}`).toBe(true);
    expect(payload.errors,`shape-legal four-state report: expected no errors; stdout=${clip(result.stdout)}`).toHaveLength(0);
  });
});
