import { describe, it, expect } from 'vitest';
import * as policy from '../../runtime/review/review-policy.mjs';

// ORACLE-REVIEW-TIER: missing capability is an assertion failure, not an import/setup error.
describe('Phase review tier public contract', () => {
  it('exports the deterministic executor selection and record boundary', () => {
    expect(typeof policy.reviewTierFor).toBe('function');
    expect(typeof policy.assertReviewTierRecord).toBe('function');
    expect(policy.REVIEW_EXECUTORS).toEqual({ independent: '独立子代理', external: '外部 OCR' });
  });
});

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
const low = () => ({
  identity: {stage: 'build-code', review_scope: 'phase'},
  risks: { permissionsSecurity:'none', dataMigrationIrreversible:'none', sharedStateConcurrency:'none', publicContractCriticalPath:'none', realExternalDependency:'none' },
  scope: {singleModule:true, knownDirectConsumers:true},
  readings: {
    paths:{status:'read',raw:'runtime/example/p1.mjs'},
    impact:{status:'read',raw:'one named caller reads example(); no critical path'},
    size:{status:'read',raw:'12\t4\truntime/example/p1.mjs'},
  },
});
const independent = () => ({executor:'独立子代理',input:low(),source:{dispatch_identity:'/root/reviewer',context_isolation:'none'}});
const external = input => ({executor:'外部 OCR',input,source:{route:'configured/full_only',provider_refs:['quality/reviews/provider.json']},provider_results:[{provider:'configured/provider',status:'completed'}]});

describe('ORACLE-REVIEW-TIER controlled fixtures', () => {
  it('selects the independent executor only for the complete low-risk positive facts', () => {
    expect(policy.reviewTierFor(low())).toBe('独立子代理');
    expect(policy.assertReviewTierRecord(independent()).executor).toBe('独立子代理');
  });
  it('raises each observed risk face and each failed scope condition to external OCR', () => {
    for(const face of Object.keys(low().risks)) {
      const input=low();input.risks[face]='present';
      expect(policy.reviewTierFor(input)).toBe('外部 OCR');
      expect(policy.assertReviewTierRecord(external(input)).executor).toBe('外部 OCR');
    }
    for(const field of Object.keys(low().scope)) {const input=low();input.scope[field]=false;expect(policy.reviewTierFor(input)).toBe('外部 OCR');}
  });
  it('keeps undetermined impact evidence and its reason without guessing low risk', () => {
    const input=low();input.readings.impact={status:'undetermined',reason:'direct caller cannot be read'};
    expect(policy.reviewTierFor(input)).toBe('外部 OCR');
    expect(policy.assertReviewTierRecord(external(input)).input.readings.impact.reason).toBe('direct caller cannot be read');
  });
  it('is deterministic and only becomes heavier when a critical consumer is added', () => {
    const input=low();expect(policy.reviewTierFor(input)).toBe(policy.reviewTierFor(structuredClone(input)));
    input.risks.publicContractCriticalPath='present'; input.readings.impact.raw+='; new critical-path consumer';
    expect(policy.reviewTierFor(input)).toBe('外部 OCR');
    input.readings.size.raw='100\t100\truntime/example/p1.mjs';expect(policy.reviewTierFor(input)).toBe('外部 OCR');
  });
  it('fixes the existing terminal review identity to external OCR and preserves its identity guard', () => {
    const input=low();input.identity={stage:'verify-code'};expect(()=>policy.reviewTierFor(input)).toThrow(/unknown review stage/);
    input.identity={stage:'build-code',review_scope:'terminal'};expect(policy.reviewTierFor(input)).toBe('外部 OCR');
    input.identity={stage:'build-code',review_scope:'integration'};expect(()=>policy.reviewTierFor(input)).toThrow(/integration review is retired/);
  });
  it('routes missing, unread and binary dimensions externally', () => {
    for(const field of ['paths','impact','size']) {
      const input=low();delete input.readings[field];expect(policy.reviewTierFor(input)).toBe('外部 OCR');
      input.readings[field]={status:'unread',reason:'not observed'};expect(policy.reviewTierFor(input)).toBe('外部 OCR');
    }
    for(const raw of ['-\t-\tasset.bin','12\t-\tasset.bin']) {const input=low();input.readings.size.raw=raw;expect(policy.reviewTierFor(input)).toBe('外部 OCR');}
  });
  it('rejects numeric or scoring policy inputs while preserving numeric raw evidence', () => {
    for(const key of ['score','threshold','percentage']) {const input=low();input[key]=0;expect(()=>policy.reviewTierFor(input)).toThrow();}
    const input=low();input.risks.permissionsSecurity=0;expect(()=>policy.reviewTierFor(input)).toThrow();
    input.risks.permissionsSecurity='none';input.scope.singleModule=1;expect(()=>policy.reviewTierFor(input)).toThrow();
    expect(policy.reviewTierFor(low())).toBe('独立子代理');
  });
  it('rejects missing executor/source/readings, false OCR identities and invented provider results', () => {
    for(const field of ['executor','source','input']) {const record=independent();delete record[field];expect(()=>policy.assertReviewTierRecord(record)).toThrow();}
    for(const extra of [{identity:'ocr'},{provider_results:[]},{source:{dispatch_identity:'reviewer',context_isolation:'none',identity:'ocr'}},{source:{dispatch_identity:'reviewer',context_isolation:'all'}}]) expect(()=>policy.assertReviewTierRecord({...independent(),...extra})).toThrow();
    const record=external({...low(),identity:{stage:'build-code',review_scope:'terminal'}});delete record.provider_results;expect(()=>policy.assertReviewTierRecord(record)).toThrow(/terminal/);
  });
  it('preserves ENOENT and low-version OCR detection without replacing the executor or inventing results', () => {
    for(const reason of ['ENOENT','OCR version 1.12.8 is below 1.12.9']) {
      const record={executor:'外部 OCR',input:{...low(),identity:{stage:'build-code',review_scope:'terminal'}},source:{route:'configured/single_round'},status:'unavailable',reason,detection_output_ref:'quality/tests/ocr-version.output',failure_ref:'quality/tests/ocr-failure.json'};
      expect(policy.assertReviewTierRecord(record).executor).toBe('外部 OCR');
      expect(record.provider_results).toBeUndefined();
      expect(()=>policy.assertReviewTierRecord({...record,detection_output_ref:''})).toThrow(/detection/);
      expect(()=>policy.assertReviewTierRecord({...record,provider_results:[{provider:'fake',status:'completed'}]})).toThrow(/fabricate/);
    }
  });
});

describe('review tier method consumers', () => {
  it('retains positive evidence commands, explicit user authorization and terminal full review', () => {
    const standard=readFileSync(resolve('docs/standard-workflow.md'),'utf8');
    for(const text of ['U-020','这是用户选择、不是代理自行降审','权限/安全面为无','数据迁移/不可逆面为无','共享状态/并发面为无','公开合同/关键路径面为无','真实外部依赖面为无','git diff --name-only','git diff --numstat','直接调用方与关键路径','同输入同结论','任一维扩增不得更轻','终末整卡固定外部 OCR 全审','不设数字阈值']) expect(standard).toContain(text);
    expect(standard).not.toContain('本轮缺同 cohort 真实质量，仍每 Phase 审');
    for(const file of ['workflows/build-code/SKILL.md','skills/wh-review/SKILL.md','skills/wh-review/contracts/build-code.md']) {
      const content=readFileSync(resolve(file),'utf8');
      for(const text of ['reviewTierFor','assertReviewTierRecord','独立子代理','外部 OCR','provider_results']) expect(content).toContain(text);
    }
    const map=JSON.parse(readFileSync(resolve('docs/architecture/move-map.json'),'utf8'));
    const registration=map.entries.find(entry=>entry.source==='tests/contract/review-tier.test.mjs');
    expect(registration).toMatchObject({role:'test'});
    for(const field of ['owner','consumer','delete_condition']) expect(registration[field]).toBeTruthy();
  });
});

// Historical source is a read-only acceptance input, never a prerequisite for production use.
const t02root='/Users/Hugh/Hugh/Project/PaperBuilder-paperbuilder-architecture-t02-capacity-fact-floor/specs/paperbuilder-architecture-t02-capacity-fact-floor';
// Immutable T02 input predates its later active-reader archive path rewrite.
const t02SourceRevision='183ac869489ad4cec3a2783dd54cb8a5a04a8224';
// Surviving repository contains the same independently verified immutable blobs; t02root remains original provenance.
const t02Repository='/Users/Hugh/Hugh/Project/PaperBuilder';
function t02Source(ref) {
  return execFileSync('git',['-C',t02Repository,'show',`${t02SourceRevision}:specs/paperbuilder-architecture-t02-capacity-fact-floor/${ref}`],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
}
let t02available=false;
try { t02Source('phases/index.md'); t02available=true; } catch (error) { console.warn('T02 historical source unavailable; source-dependent checks skipped:', String(error.message).slice(0,2000)); }
function publishedT02Unavailable(sourceAvailable) { return !sourceAvailable; }
function assertPublishedT02Presence(sourceAvailable, outputExists) {
  if (!sourceAvailable) return false;
  if (!outputExists) throw new Error('required published T02 evidence is missing while historical source is readable');
  return true;
}
function t02Rows() {
  return t02Source('phases/index.md').split('\n').flatMap((line,index)=>{
    if(!/^\| `P\d+` \|/.test(line)) return [];
    const cells=line.split('|').map(value=>value.trim());
    const phase=cells[1].replaceAll('`',''); const ref=cells[2].replaceAll('`','');
    const lines=t02Source(ref).split('\n');const riskLine=lines.findIndex(value=>value.includes('**主要风险**'));
    const input=low();for(const face of Object.keys(input.risks)) input.risks[face]='undetermined';
    input.scope={singleModule:false,knownDirectConsumers:false};
    input.readings={paths:{status:'read',raw:cells[4]},impact:{status:'undetermined',raw:cells[6],reason:'historical card risk only; actual callers and implementation not re-audited'},size:{status:'undetermined',reason:'historical diff numstat not supplied'}};
    return [{phase,write_set:cells[4],direct_consumers:cells[6],risk:lines[riskLine],risk_ref:`${t02root}/${ref}:${riskLine+1}`,index_ref:`${t02root}/phases/index.md:${index+1}`,old_executor:'外部 OCR',new_executor:policy.reviewTierFor(input),input}];
  });
}
function assertT02Table(rows) {
  expect(rows.map(row=>row.phase)).toEqual(['P1','P2','P3','P4','P5','P6','P7','P8','P9','P10','P11','P12','P13']);
  for(const row of rows) {
    expect(row.write_set).toBeTruthy();expect(row.direct_consumers).toBeTruthy();expect(row.risk).toContain('主要风险');
    expect(row.risk_ref).toMatch(/\.md:\d+$/);expect(row.index_ref).toMatch(/index\.md:\d+$/);
    expect(row.old_executor).toBe('外部 OCR');expect(row.new_executor).toBe('外部 OCR');
    expect(row.new_executor).toBe(policy.reviewTierFor(row.input));
  }
}
describe('T02 thirteen Phase source replay',()=>{
  it.skipIf(!t02available)('replays all source write sets, consumers and risk references conservatively',()=>assertT02Table(t02Rows()));
  it.skipIf(!t02available)('rejects missing row, removed risk and unsupported independent choice',()=>{
    const rows=t02Rows();expect(()=>assertT02Table(rows.slice(1))).toThrow();
    const withoutRisk=structuredClone(rows);delete withoutRisk[0].risk;expect(()=>assertT02Table(withoutRisk)).toThrow();
    const unsupported=structuredClone(rows);unsupported[0].new_executor='独立子代理';expect(()=>assertT02Table(unsupported)).toThrow();
  });
});

describe('independent finding regression: nested scoring and published T02 evidence',()=>{
  it('rejects scoring keys and non-text evidence inside each dimension',()=>{
    for(const dimension of ['paths','impact','size']) {
      for(const extra of [{score:0},{threshold:10},{percentage:0},{raw:12},{reason:42},{status:0}]) {
        const input=low();Object.assign(input.readings[dimension],extra);
        expect(()=>policy.reviewTierFor(input)).toThrow();
      }
    }
    expect(policy.reviewTierFor(low())).toBe('独立子代理');
  });
  const publishedEvidence='/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-build-code-efficiency-verify-merge-20261026/quality/evidence/workflowhub-build-code-efficiency-verify-merge-20261026/P1-review-tier.json';
  function assertPublishedT02(rows) {
    const expected=t02Rows().map(row=>({phase:row.phase,original_write_set:row.write_set,direct_consumers:row.direct_consumers,critical_risk:row.risk,source_refs:[row.index_ref,row.risk_ref],old_executor:row.old_executor,new_executor:row.new_executor}));
    expect(rows.map(row=>Object.fromEntries(Object.keys(expected[0]).map(key=>[key,row[key]])))).toEqual(expected);
    for(const row of rows) expect(row.new_executor).toBe(policy.reviewTierFor(row.input));
  }
  it.skipIf(publishedT02Unavailable(t02available, existsSync(publishedEvidence)))('matches the published thirteen rows to actual source bytes and rejects corrupted rows',()=>{
    assertPublishedT02Presence(t02available, existsSync(publishedEvidence));
    const rows=JSON.parse(readFileSync(publishedEvidence,'utf8')).t02_phase_table;
    assertPublishedT02(rows);
    for(const field of ['phase','original_write_set','direct_consumers','critical_risk','source_refs','new_executor']) {
      const corrupted=structuredClone(rows);delete corrupted[0][field];expect(()=>assertPublishedT02(corrupted)).toThrow();
    }
    expect(()=>assertPublishedT02(rows.slice(1))).toThrow();
  });
});

// Regressions from the independent Standards/Spec findings, original refs 040/041.
describe('P1 independent supplement findings',()=>{
  it('accepts only actual provider terminal statuses, keeping timeout categories separate',()=>{
    for(const status of ['timed_out','unavailable','running']) {
      const record=external({...low(),identity:{stage:'build-code',review_scope:'terminal'}});record.provider_results[0].status=status;
      expect(()=>policy.assertReviewTierRecord(record)).toThrow(/terminal/);
    }
    for(const status of ['completed','failed','cancelled']) {
      const record=external({...low(),identity:{stage:'build-code',review_scope:'terminal'}});record.provider_results[0].status=status;
      expect(policy.assertReviewTierRecord(record)).toBe(record);
    }
  });
  it('requires published evidence when historical source is readable even if output is missing',()=>{
    expect(publishedT02Unavailable(true,false)).toBe(false);
    expect(publishedT02Unavailable(false,false)).toBe(true);
    expect(publishedT02Unavailable(true,true)).toBe(false);
    expect(()=>assertPublishedT02Presence(true,false)).toThrow(/required published T02 evidence is missing/);
    expect(assertPublishedT02Presence(false,false)).toBe(false);
    expect(assertPublishedT02Presence(true,true)).toBe(true);
  });
});
