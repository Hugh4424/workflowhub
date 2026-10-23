import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { decidePair, anonymizePair, assertAnonymous, parseJudgment, judgeOnce, prepareAll, joinCostFacts, costConclusion, sha256, cliMain, DEFAULT_MANIFEST, loadPair, followEvidenceReferences, replayPair } from '../../tools/cli/n11-pairwise-judge.mjs';
const judgment = winner => ({ winner, reason: 'Task evidence supports this choice', evidence: [{answer: 'A', quote: 'answer'}] });
const row = (order, winner, extra={}) => ({ order, status: 'completed', judgment: judgment(winner), session_id: order, ...extra });
const pair = () => ({ stage: 'build-code', status: 'available', context: {stage: 'build-code', requirement: 'Implement batch completion with honest errors'}, sides: [{side:'baseline',run_ref:'/run/one',output_ref:'/output/one',answer:'first answer'},{side:'candidate',run_ref:'/run/two',output_ref:'/output/two',answer:'second answer'}] });
const trusted = { provider:'codex/luna', profile:{enabled:true,command:'/trusted/codex',model:'gpt-6-luna',effort:'max',source_id:'trusted-source'},identity:{source_id:'trusted-source',config_id:'fixed-id'} };
describe('ORACLE-N11-PAIRWISE', () => {
  it('only one judgment is inconclusive, never a win', () => { expect(decidePair([row('forward','A')]).status).toBe('inconclusive'); });
  it('same actual side in two orders wins', () => { expect(decidePair([row('forward','B'),row('reverse','A')])).toMatchObject({status:'win',winner:'candidate'}); });
  it('always choosing position A does not win', () => { expect(decidePair([row('forward','A'),row('reverse','A')]).status).toBe('tie'); });
  it('an explicit tie is not a win', () => { expect(decidePair([row('forward','tie'),row('reverse','A')]).status).toBe('tie'); });
  it('unavailable is inconclusive, not tie', () => { expect(decidePair([row('forward','A'),row('reverse','B',{status:'inconclusive'})]).status).toBe('inconclusive'); });
  it('same native session cannot prove independent contexts', () => { expect(decidePair([row('forward','A'),row('reverse','B',{session_id:'forward'})]).status).toBe('inconclusive'); });
  it('wrong anonymous packet hash is inconclusive', () => { expect(decidePair([row('forward','A'),row('reverse','B')],{forward_sha256:'wrong',reverse_sha256:'wrong'}).status).toBe('inconclusive'); });
  it('preserves four pair slots when a pair is missing', () => { const all=prepareAll({loader:({stage})=>{if(stage==='build-code')throw Error('missing answer');return {...pair(),stage};}});expect(all).toHaveLength(4);expect(all.find(r=>r.stage==='build-code')).toMatchObject({status:'inconclusive'}); });
  it('rejects identity leakage before dispatch', async () => { const p=anonymizePair(pair()).forward;p.context.requirement+=' codex/luna';let calls=0;await expect(judgeOnce(p,{...trusted,invoke:async()=>{calls++;}})).rejects.toThrow('identity leakage');expect(calls).toBe(0); });
  it('removes provider, model, paths and side identity while retaining business text', () => { const p=pair();p.sides[0].answer='codex/luna gpt-6-luna baseline /Users/Hugh/work fixes batch completion';const anonymous=anonymizePair(p);expect(()=>assertAnonymous(anonymous.forward)).not.toThrow();expect(anonymous.forward.answers.A).toContain('fixes batch completion');expect(JSON.stringify(anonymous.forward)).not.toContain('/Users/'); });
  it('rejects the same run self comparison', () => { const p=pair();p.sides[1].run_ref=p.sides[0].run_ref;expect(()=>anonymizePair(p)).toThrow('same run'); });
  it('permits identical answer bodies from distinct runs', () => { const p=pair();p.sides[1].answer=p.sides[0].answer;expect(()=>anonymizePair(p)).not.toThrow(); });
  it('requires exact answer quotations and strict winner', () => { const p=anonymizePair(pair()).forward;expect(()=>parseJudgment(JSON.stringify({...judgment('A'),evidence:[{answer:'A',quote:'fabricated'}]}),p)).toThrow();expect(()=>parseJudgment(JSON.stringify(judgment('candidate')),p)).toThrow(); });
  it('retains complete custom native command and uses one invocation', async () => { const p=anonymizePair(pair()).forward;let calls=0;const result=await judgeOnce(p,{...trusted,invoke:async request=>{calls++;expect(request.profile.command).toBe('/trusted/codex');expect(request.profile.source_id).toBe('trusted-source');expect(request.files[0].path).toBe('pair.json');expect(request.prompt).not.toMatch(/baseline|candidate/);return {status:'completed',session_id:'native-test',output:JSON.stringify(judgment('A'))};}});expect(calls).toBe(1);expect(result.status).toBe('completed');expect(result.packet_sha256).toBe(sha256(JSON.stringify(p))); });
  it('invalid native JSON is inconclusive without retry', async () => {let calls=0;const result=await judgeOnce(anonymizePair(pair()).forward,{...trusted,invoke:async()=>{calls++;return {status:'completed',output:'not JSON'};}});expect(result.status).toBe('inconclusive');expect(calls).toBe(1);});
});
describe('ORACLE-N11-COST-4GROUP actual join', () => {
  it('reads actual per-cell transport duration, preserves unavailable tokens/cache/steps/calls', () => {
    const costs=joinCostFacts();expect(costs).toHaveLength(4);
    const manifest=JSON.parse(readFileSync(DEFAULT_MANIFEST));
    for(const cell of costs.flatMap(c=>c.sides)){
      const run=manifest.runs.find(r=>r.side===cell.side&&r.stage===cell.stage);const transport=JSON.parse(readFileSync(run.transport_ref));
      expect(cell.wait.value).toBe(transport.telemetry.duration_ms);expect(cell.wait.source_ref).toBe(run.transport_ref);expect(cell.wait.pointer).toBe('/telemetry/duration_ms');
      expect(cell.tokens.input.value).toBeNull();expect(cell.tokens.cacheRead.status).toBe('unavailable');expect(cell.steps.value).toBeNull();expect(cell.calls.status).toBe('unavailable');
    }
  });
  it('unknown cacheRead never becomes zero or benefit', () => {expect(costConclusion({before:{wait:20,steps:10,cacheRead:null},after:{wait:10,steps:1,cacheRead:null}})).toBe('inconclusive');});
  it('tokens alone do not prove cost benefit', () => {expect(costConclusion({before:{wait:10,cacheRead:10,steps:3,tokens:100},after:{wait:10,cacheRead:10,steps:3,tokens:1}})).toBe('inconclusive');});
  it('wait or cache deterioration prevents benefit', () => {expect(costConclusion({before:{wait:10,cacheRead:10,steps:5},after:{wait:11,cacheRead:9,steps:1}})).toBe('inconclusive');expect(costConclusion({before:{wait:10,cacheRead:10,steps:5},after:{wait:9,cacheRead:11,steps:1}})).toBe('inconclusive');});
  it('same-object fully observed lower steps with no deterioration can qualify', () => {expect(costConclusion({before:{wait:10,cacheRead:10,steps:5},after:{wait:9,cacheRead:10,steps:1}})).toBe('benefit');});
});

describe('P7 actual business artifact projection', () => {
  it('keeps all four real pairs including timeout partial documents, not wrapper-only', async () => {
    const rows=prepareAll();expect(rows.map(r=>r.stage)).toEqual(['make-decision','build-plan','build-code','verify-code']);
    for(const row of rows){expect(row.status).toBe('available');expect(()=>assertAnonymous(row.forward)).not.toThrow();expect(row.mapping.sources).toHaveLength(2);}
    const md=rows[0];expect(md.mapping.sources[1].source_artifacts.some(f=>f.ref.endsWith('/decision-log.md'))).toBe(true);
    const bp=rows[1];for(const s of bp.mapping.sources)expect(s.source_artifacts.some(f=>/\/phases\/P\d/.test(f.ref))).toBe(true);
    const bc=rows[2];for(const s of bc.mapping.sources){expect(s.source_artifacts.some(f=>f.ref.endsWith('/server.js'))).toBe(true);expect(s.source_artifacts.some(f=>f.ref.endsWith('/test/workboard.test.js'))).toBe(true);}
    const vc=rows[3];expect(vc.mapping.sources[1].source_artifacts.some(f=>f.ref.endsWith('/verify-code-handler-probe.json'))).toBe(true);expect(vc.forward.context.public_fixed_code.some(f=>f.name==='server.js')).toBe(true);
    expect(JSON.stringify(vc.forward)).not.toContain('source_artifacts');
  });
  it('CLI cost reads real sources without dispatch',async()=>{expect(await cliMain(['--action=cost'])).toHaveLength(4);});
});

describe('anonymous technical identifiers', () => {
  it('strips actual snapshot and authored material revision identities', () => {
    const p=pair();p.sides[0].answer=JSON.stringify({snapshot_tree:'172c25561e3ddbdf0f03ccfe5bc379abb3838cf8',material_revision:'author-current-verify-code',result:'business error preserved'});
    const packet=anonymizePair(p).forward;expect(packet.answers.A).not.toContain('172c2556');expect(packet.answers.A).not.toContain('author-current');expect(packet.answers.A).toContain('business error preserved');
  });
});

describe('P8 actual output receipt coverage', () => {
  it('includes the actual candidate build-code .output log with its source hash and complete body', () => {
    const pair=loadPair({stage:'build-code'}), candidate=pair.sides.find(s=>s.side==='candidate');
    const ref=candidate.output_ref+'/quality/evidence/workboard-target-tests.output';
    expect(candidate.source_artifacts.find(s=>s.ref===ref)).toMatchObject({sha256:'634f2192f0bf83fcb6e7f87a14b07a9a2a5b01f905c779af747bf17ef75c540c',bytes:7875});
    expect(JSON.parse(candidate.answer).artifacts.find(a=>a.name==='quality/evidence/workboard-target-tests.output')?.content).toBe(readFileSync(ref,'utf8'));
    expect(()=>assertAnonymous(anonymizePair(pair).forward)).not.toThrow();
  });
  it('reports a recognized unsupported evidence extension instead of silently omitting it', () => {
    const read=[],missing=[];followEvidenceReferences('See quality/evidence/screenshot.png and quality/evidence/receipt.json',ref=>read.push(ref),missing);
    expect(read).toEqual(['quality/evidence/receipt.json']);
    expect(missing).toContain('quality/evidence/screenshot.png (not included: unsupported evidence type .png)');
  });
});

describe('OCR085 raw provenance and anonymity', () => {
  function records() {
    const binding=anonymizePair(pair());
    const rows=[row('forward','B'),row('reverse','A')].map(r=>({...r,packet_sha256:binding[`${r.order}_sha256`],raw:{status:'completed',session_id:r.session_id,output:JSON.stringify(r.judgment)}}));
    return {binding,rows};
  }
  it('rejects forged distinct outer sessions when the raw native session is identical', () => {
    const {binding,rows}=records(); rows[1].raw.session_id=rows[0].raw.session_id;
    expect(replayPair(binding,rows).status).toBe('inconclusive');
  });
  it('rejects an outer completed status wrapping raw failed status', () => {
    const {binding,rows}=records(); rows[0].raw.status='failed';
    expect(replayPair(binding,rows).status).toBe('inconclusive');
  });
  it('rejects unredacted concrete local paths but preserves business API routes and URLs', () => {
    expect(()=>assertAnonymous({text:'/private/var/folders/host-token/report.txt /tmp/judge-run/file'})).toThrow('identity leakage');
    expect(()=>assertAnonymous({text:'GET /api/items and https://example.com/api/items'})).not.toThrow();
    const p=pair();p.sides[0].answer='read /private/var/folders/host-token/report.txt and /tmp/judge-run/file; GET /api/items https://example.com/api/items';
    const anonymous=anonymizePair(p);expect(anonymous.forward.answers.A).not.toContain('/private/');expect(anonymous.forward.answers.A).not.toContain('/tmp/');expect(anonymous.forward.answers.A).toContain('/api/items');expect(anonymous.forward.answers.A).toContain('https://example.com/api/items');
  });
  it('reports a named extensionless evidence reference without reading directory prefixes', () => {
    const reads=[],missing=[];followEvidenceReferences('quality/evidence/probe-result quality/evidence/',ref=>reads.push(ref),missing);
    expect(reads).toEqual([]);expect(missing).toContain('quality/evidence/probe-result (not included: unsupported evidence type without extension)');expect(missing.some(s=>s.startsWith('quality/evidence/ ('))).toBe(false);
  });
});

describe('OCR085 reference boundaries', () => {
  it('keeps file fragments, planned placeholders and actual directories distinct from extensionless files', () => {
    const reads=[],missing=[];followEvidenceReferences('quality/evidence/report.json#probe quality/evidence/test-<case>.json quality/evidence/tmp quality/evidence/result',ref=>reads.push(ref),missing,ref=>ref==='quality/evidence/tmp');
    expect(reads).toEqual(['quality/evidence/report.json']);expect(missing).toEqual(['quality/evidence/result (not included: unsupported evidence type without extension)']);
  });
});

describe('OCR085 named file versus directory declaration', () => {
  it('does not invent missing evidence files from TMPDIR or mkdtemp directory prefixes', () => {
    const reads=[],missing=[];
    followEvidenceReferences(`TMPDIR=quality/evidence/cleaned-dir
mkdtempSync(path.join(process.cwd(), 'quality/evidence/prefix-'));`,ref=>reads.push(ref),missing);
    expect(reads).toEqual([]);expect(missing).toEqual([]);
  });
});
