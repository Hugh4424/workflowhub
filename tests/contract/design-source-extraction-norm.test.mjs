import {describe,it,expect} from "vitest";
import {readFileSync,existsSync} from "node:fs";
import {join} from "node:path";
const ROOT=process.cwd();
const doc=join(ROOT,"skills/design-source-extraction/references/norm-alignment.md");
const read=p=>existsSync(p)?readFileSync(p,"utf8"):"";
describe("ORACLE-EXTRACT-NORM",()=>{
  it("norm:doc-exists",()=>{expect(existsSync(doc),"P4: references/norm-alignment.md must exist").toBe(true);});
  it("norm:eight-classes",()=>{const s=read(doc);for(const c of ["领域","视觉","组件","布局","交互","工程","内容","质量"])expect(s,`missing class ${c}`).toContain(c);});
  it("norm:four-state",()=>{const s=read(doc);for(const st of ["present","missing","conflict","pending_review"])expect(s,`missing state ${st}`).toContain(st);});
  it("norm:defect-recorded",()=>{expect(read(doc)).toMatch(/norm_defect|规范待修/);});
  it("norm:second-basis",()=>{expect(read(doc)).toMatch(/第二套|project-norm-init\/templates/);});
});

// TCR240 / independent049: document-contract oracle only, never production/basis adjudication.
const marker='C04-NORM-SEMANTIC-ORACLE';
function consumeDocument(markdown){const escaped=marker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const matches=[...markdown.matchAll(new RegExp('<!-- '+escaped+' -->\\s*```json\\s*([\\s\\S]*?)\\s*```','g'))];if(matches.length!==1)throw Error('ONE_ORACLE_BLOCK_REQUIRED');return JSON.parse(matches[0][1]);}
function checkCase(value){
 if(!value||!value.rule||!value.fact||!value.reason||!value.owner||!value.affected_scope?.length)throw Error('INCOMPLETE_CASE');
 const nonempty=value=>typeof value==='string'&&value.trim().length>0;
 const literal=value=>nonempty(value)||(typeof value==='number'&&Number.isFinite(value));
 const known=value.fact.status==='observed',located=nonempty(value.rule.ref)&&nonempty(value.rule.section),scope=Object.hasOwn(value.fact,'scope')&&Object.hasOwn(value.rule,'scope')&&nonempty(value.fact.scope)&&nonempty(value.rule.scope)&&value.fact.scope===value.rule.scope,confirmed=value.applicability==='confirmed'&&!value.rule.placeholder;
 const factValue=Object.hasOwn(value.fact,'value')&&literal(value.fact.value),expectedValue=Object.hasOwn(value.rule,'expected')&&literal(value.rule.expected);
 if(value.expected_state==='present'){if(!confirmed||!known||!located||!scope||!factValue||!expectedValue||value.fact.value!==value.rule.expected)throw Error('UNPROVEN_PRESENT');}
 else if(value.expected_state==='missing'){if(!confirmed||!scope||!located||value.fact.status!=='confirmed_absent'||!value.fact.reason)throw Error('UNKNOWN_IS_NOT_MISSING');}
 else if(value.expected_state==='conflict'){if(!confirmed||!known||!scope||!located||!factValue||!expectedValue||value.fact.value===value.rule.expected)throw Error('UNPROVEN_CONFLICT');}
 else if(value.expected_state==='pending_review'){if(confirmed&&known&&scope&&located&&!value.rule.placeholder)throw Error('NO_PENDING_CONDITION');}
 else throw Error('INVALID_STATE');
 if((known||value.fact.status==='confirmed_absent')&&!value.fact.evidence_ref)throw Error('NO_FACT_EVIDENCE');
 if(value.norm_defect?.overrides_fact)throw Error('DEFECT_MUST_NOT_REWRITE_FACT');
 return true;
}
const cases=()=>consumeDocument(read(doc)).cases;
describe('ORACLE-EXTRACT-NORM document semantic consumption',()=>{
 for(const state of ['present','missing','conflict','pending_review'])it('document-case:'+state,()=>{const rows=cases().filter(row=>row.expected_state===state);expect(rows.length).toBe(1);expect(checkCase(rows[0])).toBe(true);});
 it('missing-duplicate-invalid-block-fails',()=>{const body=read(doc);expect(()=>consumeDocument('no block')).toThrow();expect(()=>consumeDocument(body+'\n'+body)).toThrow();expect(()=>consumeDocument('<!-- '+marker+' -->\n```json\n{bad\n```')).toThrow();});
 const reject=(name,select,mutate)=>it('document-mutation:'+name,()=>{const value=structuredClone(cases().find(select));mutate(value);expect(()=>checkCase(value)).toThrow();});
 reject('no-anchor-conflict',row=>row.expected_state==='conflict',row=>{delete row.rule.section;});
 reject('confirmed-absence-needs-negative-evidence',row=>row.expected_state==='missing',row=>{delete row.fact.evidence_ref;});
 reject('unknown-not-missing',row=>row.expected_state==='missing',row=>{row.fact.status='unknown';});
 reject('unknown-not-present',row=>row.expected_state==='present',row=>{row.fact.status='unknown';});
 reject('cross-scope-not-conflict',row=>row.expected_state==='conflict',row=>{row.fact.scope='different-page-state';});
 reject('template-placeholder-not-product-value',row=>row.expected_state==='present',row=>{row.rule.placeholder=true;});
 reject('norm-defect-cannot-override-fact',row=>row.expected_state==='present',row=>{row.norm_defect={overrides_fact:true};});
 reject('matching-value-not-conflict',row=>row.expected_state==='conflict',row=>{row.fact.value=row.rule.expected;});
 for(const state of ['present','missing','conflict'])reject('both-scopes-absent-'+state,row=>row.expected_state===state,row=>{delete row.fact.scope;delete row.rule.scope;});
 reject('both-values-absent-present',row=>row.expected_state==='present',row=>{delete row.fact.value;delete row.rule.expected;});
 reject('observed-value-absent-conflict',row=>row.expected_state==='conflict',row=>{delete row.fact.value;});
 reject('expected-value-absent-conflict',row=>row.expected_state==='conflict',row=>{delete row.rule.expected;});
 reject('empty-scopes-present',row=>row.expected_state==='present',row=>{row.fact.scope=' ';row.rule.scope=' ';});
 reject('empty-values-present',row=>row.expected_state==='present',row=>{row.fact.value='';row.rule.expected='';});
 reject('object-scopes-present',row=>row.expected_state==='present',row=>{const invalid={};row.fact.scope=invalid;row.rule.scope=invalid;});
});
