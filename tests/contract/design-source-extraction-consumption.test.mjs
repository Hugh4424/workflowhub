import {describe,it,expect} from "vitest";
import {readFileSync,existsSync} from "node:fs";
import {join} from "node:path";
const ROOT=process.cwd();
const doc=join(ROOT,"skills/design-source-extraction/references/isolated-consumption.md");
const read=p=>existsSync(p)?readFileSync(p,"utf8"):"";
describe("ORACLE-EXTRACT-CONSUME",()=>{
  it("consume:doc-exists",()=>{expect(existsSync(doc),"P5: references/isolated-consumption.md must exist").toBe(true);});
  it("consume:comparison-derived",()=>{const s=read(doc);expect(s).toMatch(/comparison|对照/);});
  it("consume:backfill-recorded",()=>{expect(read(doc)).toMatch(/backfill|回填/);});
  it("consume:access-boundary",()=>{expect(read(doc)).toMatch(/沙箱|access boundary|只拿到产物/);});
  it("consume:local-denominator",()=>{expect(read(doc)).toMatch(/局部|local denominator|p5-coverage/);});
  it("consume:pending-review-list",()=>{expect(read(doc)).toMatch(/pending_review|待议/);});
});

// TCR270, independent060/061: document-contract oracle only, not browser measurement.
const parseCase=text=>{
  const blocks=[...text.matchAll(/<!-- C04-CONSUME-SEMANTIC-ORACLE -->\s*```json\s*([\s\S]*?)```/g)];
  if(blocks.length!==1) throw Error('one consumption JSON block required');
  return JSON.parse(blocks[0][1]);
};
const loadCase=()=>parseCase(read(doc));
const nonempty=v=>typeof v==='string'&&v.trim().length>0;
const value=v=>(typeof v==='number'&&Number.isFinite(v))||nonempty(v);
const consume=c=>{
  if(!Array.isArray(c.items)||!c.items.length) return false;
  if(!c.scope||!nonempty(c.scope.frozen_at)||!Array.isArray(c.scope.checklist)||!c.scope.checklist.length) return false;
  const ids=c.scope.checklist.map(x=>x.id);
  if(ids.some(x=>!nonempty(x))||new Set(ids).size!==ids.length||c.scope.denominator!==ids.length) return false;
  if(c.reworks<0||c.reworks>2||!Number.isInteger(c.reworks)) return false;
  if(!Array.isArray(c.comparison)||c.comparison.length!==c.items.length) return false;
  for(const item of c.items){
    if(!nonempty(item.id)||!value(item.rendered)||!nonempty(item.evidence_ref)) return false;
    const row=c.comparison.find(r=>r.item_ref===item.id);
    if(!row||!value(row.design_value)||row.design_value!==item.rendered||row.evidence_ref!==item.evidence_ref) return false;
    if(!['present','missing','conflict','pending_review'].includes(row.norm_state)) return false;
    if(row.norm_state==='pending_review'&&!nonempty(row.reason)) return false;
    if(row.implementation_value===null){if(row.state!=='missing')return false;}
    else if(!value(row.implementation_value)||!nonempty(row.measurement_ref)||row.implementation_value!==row.observed||row.implementation_value!==row.design_value||row.state!=='present')return false;
    if(row.norm_state==='pending_review'&&row.norm_approved!==false)return false;
  }
  const pending=c.comparison.filter(row=>row.norm_state==='pending_review');
  if(!Array.isArray(c.pending_review)||c.pending_review.length!==pending.length)return false;
  const key=row=>JSON.stringify([row.item_ref,row.requirement_ref??null]);
  if(new Set(c.pending_review.map(key)).size!==c.pending_review.length)return false;
  for(const row of pending){
    const entry=c.pending_review.find(entry=>key(entry)===key(row));
    if(!entry||!nonempty(entry.owner)||!nonempty(entry.condition)||!nonempty(entry.reason)||entry.reason!==row.reason)return false;
  }
  if(['pending','rejected','no_response'].includes(c.low_fidelity.ruling)){
    if(!c.low_fidelity.blocked_scope.length||c.started.some(id=>c.low_fidelity.blocked_scope.includes(id)))return false;
  }
  if(c.completed){
    if(ids.some(id=>!c.comparison.some(r=>r.item_ref===id&&r.state==='present')))return false;
    if(c.scope.checklist.some(x=>x.critical&&!c.comparison.some(r=>r.item_ref===x.id&&r.state==='present')))return false;
  }
  return true;
};
const mutate=fn=>{const c=loadCase();fn(c);return consume(c);};
describe('P5 actual document semantic cases',()=>{
  it('uses approved four-state pending_review and rejects pending alias',()=>{
    expect(loadCase().comparison[0].norm_state).toBe('pending_review');
    expect(mutate(c=>c.comparison[0].norm_state='pending')).toBe(false);
  });
  it('missing, repeated and malformed actual document blocks fail',()=>{
    const text=read(doc);
    expect(()=>parseCase(text.replace('<!-- C04-CONSUME-SEMANTIC-ORACLE -->',''))).toThrow();
    expect(()=>parseCase(text+text)).toThrow();
    expect(()=>parseCase(text.replace('"items":','"items"!:'))).toThrow();
  });
  it('literal sample is consumable, initially missing',()=>{const c=loadCase();expect(consume(c)).toBe(true);expect(c.comparison.every(r=>r.state==='missing')).toBe(true);});
  it.each([
    ['empty items',c=>c.items=[]],
    ['unbound item',c=>c.comparison[0].item_ref='other'],
    ['unbound evidence',c=>delete c.comparison[0].evidence_ref],
    ['changed design target',c=>c.comparison[0].design_value='wrong'],
    ['missing initial passed',c=>c.comparison[0].state='present'],
    ['pending approved',c=>c.comparison[0].norm_approved=true],
    ['pending list absent',c=>delete c.pending_review],
    ['pending list missing row',c=>c.pending_review=[]],
    ['pending list wrong item',c=>c.pending_review[0].item_ref='other'],
    ['pending list wrong reason',c=>c.pending_review[0].reason='unrelated decision'],
    ['pending list extra row',c=>c.pending_review.push({...c.pending_review[0]})],
    ['pending list missing owner',c=>delete c.pending_review[0].owner],
    ['pending list missing condition',c=>delete c.pending_review[0].condition],
    ['pending list missing reason',c=>delete c.pending_review[0].reason],
    ['missing measurement',c=>Object.assign(c.comparison[0],{implementation_value:28,observed:28,state:'present'})],
    ['contradictory measured value',c=>Object.assign(c.comparison[0],{implementation_value:28,observed:29,state:'present',measurement_ref:'actual-ref'})],
    ['matching backfill still differs from design target',c=>{Object.assign(c.comparison[0],{implementation_value:29,observed:29,state:'present',measurement_ref:'actual-ref'});c.completed=true;}],
    ['unfrozen denominator',c=>delete c.scope.frozen_at],
    ['shrunken denominator',c=>c.scope.denominator=0],
    ['duplicate requirement',c=>c.scope.checklist.push(c.scope.checklist[0])],
    ['missing critical completion',c=>c.completed=true],
    ['excess rework',c=>c.reworks=3],
    ['both missing design values',c=>{delete c.items[0].rendered;delete c.comparison[0].design_value;}],
  ])('%s is rejected',(_name,fn)=>expect(mutate(fn)).toBe(false));
  it.each(['pending','rejected','no_response'])('%s blocks only affected implementation',ruling=>{
    expect(mutate(c=>{c.low_fidelity={ruling,blocked_scope:['heading']};c.started=['heading'];})).toBe(false);
    expect(mutate(c=>{c.low_fidelity={ruling,blocked_scope:['other']};c.started=['heading'];})).toBe(true);
  });
});
