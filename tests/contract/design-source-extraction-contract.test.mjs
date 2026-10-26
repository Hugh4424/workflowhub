import {describe,it,expect} from "vitest";
import {readFileSync,existsSync} from "node:fs";
import {join} from "node:path";
const ROOT=process.cwd();
const skill=join(ROOT,"skills/design-source-extraction/SKILL.md");
const bundle=join(ROOT,"skills/design-source-extraction/skill-bundle.json");
const read=p=>existsSync(p)?readFileSync(p,"utf8"):"";
describe("ORACLE-EXTRACT-CONTRACT",()=>{
  it("contract:skill-exists",()=>{expect(existsSync(skill),"P1: skills/design-source-extraction/SKILL.md must exist").toBe(true);});
  it("contract:bundle-declares-skill",()=>{expect(existsSync(bundle),"P1: skill-bundle.json must exist").toBe(true);const b=read(bundle);expect(b).toContain("SKILL.md");});
  it("contract:top-level-fields",()=>{const s=read(skill);for(const f of ["source","scope","norm_basis","inputs","items","gaps","norm_defects","coverage","commands","freshness","failures"])expect(s,`missing top-level field ${f}`).toContain(f);});
  it("contract:missing-blocks-path",()=>{const s=read(skill);expect(s).toMatch(/inputs\.[a-z_]+\.status/);expect(s).toMatch(/blocks/);});
  it("contract:four-states",()=>{const s=read(skill);for(const st of ["present","missing","conflict","pending_review"])expect(s,`missing state ${st}`).toContain(st);});
  it("contract:low-fidelity-ruling",()=>{const s=read(skill);for(const k of ["low_fidelity","triggered","ruling","blocked_scope"])expect(s,`missing ${k}`).toContain(k);});
  it("contract:no-human-view",()=>{const s=read(skill);expect(s).toMatch(/不生成人读视图|no human-readable/);});
  it("contract:registration",()=>{const cat=readFileSync(join(ROOT,"skills/catalog.yaml"),"utf8");expect(cat).toContain("design-source-extraction");const reg=readFileSync(join(ROOT,"skills/reuse-registry.md"),"utf8");expect(reg).toContain("design-source-extraction");});
});

// TCR-P1: document-example oracle only; this is not the production validator.
const INPUT_KEYS=["design_source","target_elements","properties","states","acceptance_points"];
const FOUR=["present","missing","conflict","pending_review"];
function examples(text=read(skill)) {
  const marker='<!-- c04-contract-examples -->';
  expect(text.split(marker).length-1,"unique document example marker").toBe(1);
  const match=text.slice(text.indexOf(marker)+marker.length).match(/^\s*```json\s*\n([\s\S]*?)\n```/);
  expect(match,"document JSON block required").not.toBeNull();
  return JSON.parse(match[1]);
}
function checkDoc(d) {
  expect(Object.keys(d.inputs).sort()).toEqual([...INPUT_KEYS].sort());
  for(const key of INPUT_KEYS){const v=d.inputs[key];expect(FOUR).toContain(v.status);expect(Array.isArray(v.blocks),`${key}.blocks`).toBe(true);if(v.status==="missing"){expect(v.reason?.trim(),`${key}.reason`).toBeTruthy();expect(v.blocks.length,`${key}.blocks`).toBeGreaterThan(0);}else if(v.status==="present"){expect(v.value,`${key}.value`).toBeDefined();expect(v.source_ref,`${key}.source_ref`).toBeTruthy();}}
  expect(Array.isArray(d.scope.checklist)).toBe(true);
  for(const i of d.items){for(const k of ["locator","structure","rendered","declared","norm_state","norm_anchor","evidence_ref"])expect(i).toHaveProperty(k);expect(FOUR).toContain(i.norm_state);expect(["rendered","declared","screenshot"]).toContain(i.evidence_kind);if(i.evidence_kind==="screenshot")expect(i.rendered).toEqual({status:"unknown",reason:expect.any(String)});}
  for(const c of d.comparison)for(const k of ["item_ref","design_value","implementation_value","state","evidence_ref"])expect(c).toHaveProperty(k);
  expect(d.source.figma).toEqual({status:"unavailable",unavailable:true,reason:expect.any(String)});expect(d.source.figma.reason.trim()).not.toBe("");
  expect(["pending","approved","rejected","no_response"]).toContain(d.low_fidelity.ruling);
  if(d.low_fidelity.ruling!=="approved")expect(d.low_fidelity.blocked_scope.length).toBeGreaterThan(0);
}
function freshnessOracle(generated,current){
  if(!current||["source_version","norm_version","structure_ref"].some(k=>current[k]===undefined))return "unknown";
  return ["source_version","norm_version","structure_ref"].some(k=>generated[k]!==current[k])?"stale":"current";
}
const clone=x=>structuredClone(x);
describe("ORACLE-EXTRACT-CONTRACT document semantics (not production execution)",()=>{
  it("examples:missing-duplicate-invalid-blocks-fail",()=>{
    const text=read(skill);expect(()=>examples("")).toThrow();expect(()=>examples(text+'\n<!-- c04-contract-examples -->')).toThrow();expect(()=>examples('<!-- c04-contract-examples -->\n```json\n{invalid}\n```')).toThrow();
  });
  it("examples:approved-paths",()=>{const e=examples();checkDoc(e.base);expect(read(skill)).toContain("scope.checklist");expect(read(skill)).not.toContain("property_values");});
  for(const key of ["design_source","states","acceptance_points"])it(`examples:missing-${key}-selective-blocks`,()=>{
    const e=examples(),c=e.missing_cases.find(c=>c.name===`missing-${key}`);expect(c).toBeDefined();checkDoc(c.doc);expect(c.doc.inputs[key].status).toBe("missing");expect(c.expected.blocked).toEqual(c.doc.inputs[key].blocks);expect(c.expected.continue).toContain("implement:footer");expect(c.expected.blocked).not.toContain("implement:footer");
    for(const mutation of [v=>delete v.status,v=>delete v.blocks,v=>v.blocks=[]]){const bad=clone(c.doc);mutation(bad.inputs[key]);expect(()=>checkDoc(bad)).toThrow();}
  });
  for(const name of ["source-version","norm-version","page-structure","unchanged","unknown-current"])it(`examples:freshness-${name}`,()=>{
    const c=examples().freshness_cases.find(c=>c.name===name);expect(c).toBeDefined();expect(freshnessOracle(c.generated,c.current)).toBe(c.expected.freshness);expect(c.expected.continue).toContain("implement:footer");if(c.expected.freshness==="stale"){expect(c.expected.blocked).toEqual(["implement:hero"]);expect(c.expected.reextract).toBe(true);}expect(read(skill)).toContain("从本方法第1步重新提炼");
  });
  for(const ruling of ["approved","pending","rejected","no_response"])it(`examples:ruling-${ruling}`,()=>{
    const e=examples(),c=e.ruling_cases.find(c=>c.name===ruling);expect(c).toBeDefined();checkDoc(c.doc);expect(c.doc.low_fidelity.ruling).toBe(ruling);expect(c.expected.blocked).toEqual(c.doc.low_fidelity.blocked_scope);expect(c.expected.continue).toContain("implement:footer");if(ruling!=="approved"){const bad=clone(c.doc);bad.low_fidelity.blocked_scope=[];expect(()=>checkDoc(bad)).toThrow();}
  });
  it("examples:invalid-four-state-ruling-figma-and-screenshot-oracle",()=>{
    const e=examples();for(const mutate of [d=>d.items[0].norm_state="pass",d=>d.low_fidelity.ruling="allow",d=>delete d.source.figma.status,d=>delete d.source.figma.unavailable,d=>d.source.figma.unavailable=false,d=>d.source.figma.reason="",d=>{d.items[0].evidence_kind="screenshot";d.items[0].rendered={value:100};}]){const bad=clone(e.base);mutate(bad);expect(()=>checkDoc(bad)).toThrow();}
    expect(read(skill)).toContain("没有各自生命周期、优先级或独立裁决");expect(e.base.scoring.status).toBe("unavailable");expect(e.base.low_fidelity.blocked_scope).toEqual([]);
  });
});
