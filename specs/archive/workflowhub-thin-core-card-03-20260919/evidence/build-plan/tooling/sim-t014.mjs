import { readFileSync } from "node:fs";
const R=(f)=>readFileSync(f,"utf8");const out=[];const ok=(c,m)=>out.push((c?"ok  ":"FAIL")+" "+m);
const skill=R("workflows/build-code/SKILL.md"), man=R("workflows/build-code/skill-deps.yaml");
ok(!man.includes("wh-review"),"manifest not wh-review");
ok(/dedicated final task in the pre[\s\S]{0,40}post physical Phase file/.test(skill),"dedicated final");
const steps=JSON.parse(R("workflows/build-code/steps.json")).steps;const f=(s)=>steps.find(x=>x.step_slug===s);
ok(JSON.stringify(f("invoke-concrete-testing-skill").completion_evidence.map(i=>i.kind))==='["test_strategy"]',"concrete");
ok(/backend\/frontend\/fullstack/.test(f("invoke-concrete-testing-skill").observable_result),"concrete obs");
ok(JSON.stringify(f("run-tests").entry_conditions.map(i=>i.kind))==='["test_strategy"]',"run entry "+JSON.stringify(f("run-tests").entry_conditions.map(i=>i.kind)));
ok(/concrete testing strategy/.test(f("run-tests").observable_result),"run obs");
const p=f("publish-code-result");ok(/plain-language handoff/.test(p.observable_result),"publish obs");
const stageReviewSteps={"make-decision":{reviews:["direction-advice","detail-advice"],successors:["outline-talk","approve-decision"],skillRule:/review step[\s\S]{0,120}manifest 前移[\s\S]{0,160}不自动回跳/i},
"build-spec":{reviews:["review-frozen-spec"],successors:["main-agent-disposes-findings"],skillRule:/editing `spec\.md` here does not[\s\S]{0,100}dispatch that completed review step again/i},
"build-plan":{reviews:["merged-review"],successors:["main-agent-disposes-findings"],skillRule:/advances to finding disposition and final analysis[\s\S]{0,120}do not dispatch that completed review step again/i},
"build-code":{reviews:["review-change"],successors:["analyze-review-findings"],skillRule:/Later implementation changes do not send the workflow back to that review step/},
"verify-code":{reviews:["ocr-code-review"],successors:["publish-code-review-fact"],skillRule:/review step[\s\S]{0,120}manifest 前移[\s\S]{0,160}不自动回跳/i}};
for(const [st,c] of Object.entries(stageReviewSteps)){const m=JSON.parse(R(`workflows/${st}/steps.json`)).steps;const by=new Map(m.map(s=>[s.step_slug,s]));
c.reviews.forEach((r,i)=>{const a=by.get(r),b=by.get(c.successors[i]);ok(a&&b,`${st}:${r}->${c.successors[i]} defined`);if(a&&b){ok(b.order>a.order,st+" order");ok(b.depends_on.includes(a.step_id),st+" dep");ok(!a.depends_on.includes(b.step_id),st+" nodep")}});
const sk=R(`workflows/${st}/SKILL.md`);ok(c.skillRule.test(sk),st+" rule");ok(!/focused review|required focused|focused_review_required|追求 clean|直到.*findings/i.test(sk),st+" loop");}
console.log(out.filter(x=>x.startsWith("FAIL")).join("\n")||"all ok");
