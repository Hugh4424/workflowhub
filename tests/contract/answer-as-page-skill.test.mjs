// N6 ADR-012 / AC-072..078, 106..107, 114, 121: one local contract suite.
// TCR-N6-PAGE-ORACLE-SPLIT: core and conditional template keep the original assertions.
// Metadata and portable payload checks do not prove visual or natural-language quality.
// A core-only run excludes template cases explicitly; it cannot claim full-scope GREEN.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { expect, test } from 'vitest';
import { validateSkillBundle } from '../../runtime/adapters/local-skill-resolver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const skillPath = 'skills/answer-as-page/SKILL.md';
const bundlePath = 'skills/answer-as-page/skill-bundle.json';
const templatePath = 'templates/overview-template.html';
const read = path => readFileSync(join(root, path), 'utf8');
function required(path) {
  expect(existsSync(join(root, path)), `N6 target artifact must exist: ${path}`).toBe(true);
  return read(path);
}

test('core: N6 page skill: portable named skill has only name and description in frontmatter', () => {
  const body = required(skillPath);
  const front = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(body);
  expect(front, 'a standalone skill needs readable frontmatter').not.toBeNull();
  const meta = yaml.load(front[1]);
  expect(Object.keys(meta).sort()).toEqual(['description', 'name']);
  expect(meta.name).toBe('answer-as-page');
  expect(typeof meta.description).toBe('string');
  expect(meta.description.trim()).not.toBe('');
  expect(body).toMatch(/^#{1,3} .*?(?:依赖|Dependencies)/imu);
  expect(body).toContain('skills/spec-specify/SKILL.md');
  expect(body).toContain('WR001');
});

test('core: N6 page skill: bundle distributes portable skill metadata without bundled runtime', () => {
  required(skillPath);
  const bundle = JSON.parse(required(bundlePath));
  const files = bundle.files.map(entry => typeof entry === 'string' ? entry : entry.path);
  expect(bundle.schema_version).toBe(1);
  expect(bundle.skill).toBe('answer-as-page');
  expect(files).toContain('SKILL.md');
  const allowedScripts = ['scripts/render-answer-page.mjs', 'scripts/build-page-data.mjs', 'scripts/open-page.mjs'];
  expect(files.filter(path => /\.(?:mjs|cjs|js)$/u.test(path)).sort()).toEqual([...allowedScripts].sort());
  for (const file of files) {
    expect(file).not.toMatch(/^(?:[A-Za-z]:|\/)|(?:^|\/)\.\.(?:\/|$)/u);
    expect(existsSync(join(root, 'skills/answer-as-page', file))).toBe(true);
  }
  expect(() => validateSkillBundle(root, bundlePath, skillPath)).not.toThrow();
});

test('template: N6 page skill: bundle distributes the caller-filled single-file template offline', () => {
  required(skillPath);
  const bundle = JSON.parse(required(bundlePath));
  const files = bundle.files.map(entry => typeof entry === 'string' ? entry : entry.path);
  expect(files).toContain(templatePath);
  expect(() => validateSkillBundle(root, bundlePath, skillPath)).not.toThrow();
  const template = required(`skills/answer-as-page/${templatePath}`);
  expect(template).toMatch(/<!doctype html>/iu);
  expect(template).toMatch(/<style(?:\s|>)/iu);
  expect(template).not.toMatch(/<(?:script|link|iframe|img)\b[^>]*(?:src|href)\s*=\s*["'](?:https?:)?\/\//iu);
  expect(template).not.toMatch(/@import\s|url\(\s*["']?https?:/iu);
});

// The fixed upstream vocabulary is an input, not read from the adapted implementation.
// Every matched row must explain its information shape and a use/boundary rule.
// Independent reader cases remain necessary to judge those explanations semantically.
test('core: N6 page skill: all seventeen component choices carry explanatory rules rather than names alone', () => {
  const body = required(skillPath);
  const rows = body.split('\n').filter(line => /^\s*\|/u.test(line))
    .map(line => line.split('|').slice(1, -1).map(cell => cell.replace(/`/gu, '').trim()));
  const kinds = [
    /\bflow\b/iu, /\ber\b/iu, /\bsequence\b/iu, /\btree\b/iu,
    /\btimeline\b/iu, /\blimits\b/iu, /\bchart\b/iu, /\bannot\b/iu,
    /\bkv\b/iu, /\bcallout\b/iu, /\bask\b/iu, /(?:Markdown\s*表|table)/iu,
    /(?:\bimage\b|图片)/iu, /(?:引用.*代码|代码.*引用|code.reference)/iu,
    /(?:变更标记|change.mark)/iu, /\bdiff\b/iu, /(?:不存在.*代码|新.*代码|new.code)/iu,
  ];
  const matched = kinds.map(kind => rows.find(row => kind.test(row[0] ?? '')));
  for (const [index, row] of matched.entries()) {
    expect(row, `component ${kinds[index]} needs its own explanatory row`).toBeDefined();
    expect(row.length, `component ${kinds[index]} needs information-shape and boundary cells`).toBeGreaterThanOrEqual(3);
    for (const cell of row.slice(1, 3)) {
      expect(cell, `component ${kinds[index]} must explain a real rule`).not.toMatch(/^(?:|[-—]|N\/A|TBD|TODO|待补|说明|适用场景|边界)$/iu);
      expect(cell).not.toBe(row[0]);
    }
  }
  expect(new Set(matched).size, 'seventeen names cannot alias one omnibus row').toBe(17);
});

test('core: N6 page skill: catalog fixes adaptation, MIT provenance and standalone consumers', () => {
  const catalog = yaml.load(read('skills/catalog.yaml'));
  const entries = catalog.skills.filter(entry => entry.name === 'answer-as-page');
  expect(entries, 'one real callable adapted skill must be registered').toHaveLength(1);
  const entry = entries[0];
  expect(entry.path).toBe(skillPath);
  expect(entry.status).toBe('adapted');
  // N9 TCR 483/488: existing N8 make-decision skill-deps and normal/planning
  // callers establish this exact stage consumer; small retains its no-page exception.
  // Baseline RED: quality/tests/2026-10-20-p5-initial-red.output.
  // Original assertion: expect(entry.used_by_stages).toEqual([]);
  expect(entry.used_by_stages).toEqual(['make-decision']);
  const source = entry.upstream?.find(item => item.github_url === 'https://github.com/QingYunA/answer-me-with-html');
  expect(source, 'the migrated design has its own upstream, separate from pstack').toBeDefined();
  for (const key of ['commit', 'commit_url', 'license', 'reviewed_at', 'review_outcome', 'path', 'skill_url']) {
    expect(typeof source[key], `source ${key} is readable`).toBe('string');
    expect(source[key].trim(), `source ${key} is not empty`).not.toBe('');
  }
  expect(source.commit).toMatch(/^[a-f0-9]{40}$/u);
  expect(source.license).toBe('MIT');
  expect(source.adopted?.length).toBeGreaterThan(0);
  expect(Object.hasOwn(source, 'content_sha256'), 'adaptation is not byte-vendoring').toBe(false);
  expect(entry.dependency_closure).not.toContain('skills/answer-as-page');
  for (const dependency of entry.dependency_closure ?? []) expect(existsSync(join(root, dependency, 'SKILL.md'))).toBe(true);
});

test('core: N6 page skill: responsibility registration names real consumers, owner and retirement boundary', () => {
  const entries = JSON.parse(read('docs/architecture/move-map.json')).entries;
  const entry = entries.find(item => item.destination === skillPath);
  expect(entry, 'new skill responsibility must be registered before delivery').toBeDefined();
  expect(entry.role).toBe('production');
  for (const key of ['responsibility', 'owner', 'consumer', 'delete_condition', 'retention_basis']) {
    expect(typeof entry[key], `registered ${key} is readable`).toBe('string');
    expect(entry[key].trim(), `registered ${key} is not empty`).not.toBe('');
  }
  expect(entry.consumer).toMatch(/用户/iu);
  expect(entry.consumer).toMatch(/(?:总览|驾驶舱|页面)/iu);
  expect(read('skills/reuse-registry.md')).toContain('answer-as-page');
  expect(read('THIRD_PARTY_NOTICES.md')).toContain('QingYunA/answer-me-with-html');
});

// The same host/offline assertions cover both original payloads, now separately named.
function assertPortablePayload(active) {
  expect(active).not.toMatch(/\$\{?(?:CLAUDE_SKILL_DIR|CLAUDE_PROJECT_DIR|AM_HOME)\}?|~\/(?:\.claude|\.answer-me-with-html)|\/Users\/|\/home\//u);
  expect(active).not.toMatch(/(?:node\s+[^\n]*am\.mjs|am\s+(?:theme\s+add|clean|update)\b)/u);
  expect(active).not.toMatch(/<script\b[^>]+src\s*=/iu);
}

test('core: N6 page skill: active body contains no upstream host paths, background commands or bundled renderer', () => {
  assertPortablePayload(required(skillPath));
});

test('template: N6 page skill: active template contains no upstream host paths, background commands or bundled renderer', () => {
  assertPortablePayload(required(`skills/answer-as-page/${templatePath}`));
});


// N9 P5: real rendering functions under Node VM; browser acceptance is separate.
async function n9View(variant = '') {
  const { createContext, runInContext } = await import('node:vm');
  const scripts = [...read('skills/answer-as-page/templates/overview-template.html').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/giu)].map(m => m[1]);
  const context = createContext({ document: { getElementById: () => ({}) }, localStorage: { getItem: () => null } });
  const split = scripts[0].indexOf('const OBJ =');
  runInContext(scripts[0].slice(0, split), context);
  runInContext(variant, context);
  runInContext(scripts[0].slice(split), context);
  runInContext(scripts[1].slice(0, scripts[1].indexOf('let sel =')), context);
  runInContext("let sel = 'progress'; let hist = [];", context);
  return expression => runInContext(expression, context);
}
const n9Kinds = ['req','dec','ires','wp','spec','phase','file','test','review','pr'];
test('N9 P5 real chain renders ten lanes and fifteen registered kinds', async () => {
  const view = await n9View();
  expect(Array.from(view('chainFor("d1").map(l => l.kind)'))).toEqual(n9Kinds);
  expect(view('Object.keys(DATA.kinds).length')).toBe(15);
  expect(view('new Set(DATA.lanes).size')).toBe(15);
  expect(view('chainHtml(OBJ.d1)')).toContain('提交 PR');
});
test('N9 P5 report rendering preserves facts, legal non-applicability and missing rings', async () => {
  const rings = n9Kinds.map((name, i) => ({ ring:i+1, name, state:i===9?'not_applicable':'completed', evidence_type:'command', basis:[{reason:'独立事实 '+(i+1)}], counted_in_denominator:i!==9, conflict:i===8?'明确冲突':null }));
  const view = await n9View('DATA.rings = '+JSON.stringify(rings)+';');
  const rendered = view('progressHtml()');
  for (const field of ['结论','依据','证据类型','是否计入分母','备注','独立事实 1','不适用','明确冲突']) expect(rendered).toContain(field);
  expect((rendered.match(/data-report-ring=/g)||[])).toHaveLength(10);
  const missing = await n9View('DATA.rings = '+JSON.stringify(rings.filter(r=>r.ring!==4))+';');
  expect(missing('progressHtml()')).toContain('缺口：报告未提供第 4 环');
  const absent = await n9View('delete DATA.rings;');
  expect(absent('progressHtml()')).toContain('缺口：报告未提供第 1 环');
});
test('N9 P5 ring changes use identity and digest without polluting real objects', async () => {
  const view = await n9View('DATA.taskIdentity="N9"; DATA.rings=[{ring:1,name:"需求",state:"unavailable"}]; DATA.ringNodes=[{stable_id:"ring:1",content_digest:"digest-ring"}]; DATA.initialChanged=["ring:1"]; DATA.changedChips=[{id:"ring:1",label:"需求"}];');
  expect(view('CHANGED.has("ring:1")')).toBe(true);
  expect(view('seenKey("ring:1")')).toContain('digest-ring');
  expect(view('IDS.includes("ring:1")')).toBe(false);
  expect(view('OBJ["ring:1"]')).toBeUndefined();
});
test('N9 P5 one page owner declares report input, provenance and preserved outputs', () => {
  const owner = read(skillPath);
  for (const text of ['node tools/cli/run-checks.mjs --task-path','报告 sha256','decision-log sha256','ring:1','15','同名','保旧件']) expect(owner).toContain(text);
  for (const route of ['small','normal','planning']) expect(read('workflows/make-decision/flows/'+route+'/SKILL.md')).not.toContain('owner 的7环');
  const normal = read('workflows/make-decision/flows/normal/SKILL.md');
  for (const slug of ['reflect-and-handoff','closeout']) {
    const block = normal.split('`'+slug+'`')[1].split(/^### |^## /m)[0];
    expect(block).toContain('skills/answer-as-page/SKILL.md'); expect(block).toMatch(/刷新.*(?:页面|驾驶舱)/);
  }
});

test('N9 P5 real main view retains provenance and escapes report evidence', async () => {
  const reportSha='a'.repeat(64), decisionSha='b'.repeat(64);
  const provenance='报告 sha256='+reportSha+'；decision-log sha256='+decisionSha+'；报告 ref=/task/report.json；decision-log ref=/materials/decision-log.md';
  const view=await n9View('DATA.provenance='+JSON.stringify(provenance)+'; DATA.rings=[{ring:1,name:"需求",state:"unavailable",basis:[{reason:"<script>danger</script>"}],evidence_type:null,counted_in_denominator:true,conflict:null}];');
  const rendered=view('mainHtml()');
  for(const value of [reportSha,decisionSha,'/task/report.json','/materials/decision-log.md','来源指纹与本次状态']) expect(rendered).toContain(value);
  expect(rendered).toContain('&lt;script&gt;danger&lt;/script&gt;');
  expect(rendered).not.toContain('<script>danger</script>');
  expect(rendered).toContain('缺口：报告未提供第 2 环');
});

test('N9 P5 missing provenance is an explicit gap, not a fabricated fingerprint', async () => {
  const view=await n9View('DATA.rings=[{ring:1,name:"需求",state:"unavailable",basis:[],evidence_type:null,counted_in_denominator:true,conflict:null}]; DATA.provenance="旧来源说明";');
  expect(view('mainHtml()')).toContain('缺口：报告或decision-log指纹未取得');
});

test('N9 P5 old node gaps keep failure strength independently of report states', async () => {
  const view=await n9View('DATA.objects.push({id:"orphan",kind:"wp"});');
  const lanes=view('chainFor("orphan")');
  for(const kind of ['req','dec','file']) expect(lanes.find(l=>l.kind===kind).gapTone).toBe('fail');
});

// OCR043 fixes: append-only oracles; original nineteen related assertions stay.
const ocrCompleteRing = () => ({ ring:1, name:'原始需求', applicability:'required', state:'completed', evidence_type:'file_sha256', basis:[{ref:'/facts/requirement.md',sha256:'a'.repeat(64),evidence_type:'file_sha256',evidence_level:'file_sha256'}], counted_in_denominator:true, conflict:null });
async function ocrRingView(row) { return n9View('DATA.rings='+JSON.stringify([row])+';'); }
test('OCR043 complete field set and explicit null conflict remain legitimate', async () => {
  const view=await ocrRingView(ocrCompleteRing());
  const html=view('reportRingHtml(1)');
  expect(html).toContain('<dd>已完成</dd>'); expect(html).toContain('无冲突');
  expect(html).not.toContain('字段缺'); expect(html).not.toContain('格式不符');
});
test.each(['basis','conflict'])('OCR043 missing %s is visible and qualifies a completed declaration', async field => {
  const row=ocrCompleteRing(); delete row[field]; const view=await ocrRingView(row);
  const html=view('reportRingHtml(1)');
  expect(html).toContain(field==='basis'?'依据字段缺失':'冲突字段未取得');
  expect(html).toContain('报告声明：已完成'); expect(html).toContain('字段缺口');
  expect(html).not.toContain('<dd>已完成</dd>');
  if(field==='conflict') expect(html).not.toContain('无冲突');
  expect(view('DATA.rings[0].state')).toBe('completed');
});
test.each([null,false,{}])('OCR043 invalid basis %j is not silently an empty list', async basis => {
  const view=await ocrRingView({...ocrCompleteRing(),basis}); const html=view('reportRingHtml(1)');
  expect(html).toContain('依据字段格式不符'); expect(html).not.toContain('<dd>[]</dd>');
  expect(html).toContain('报告声明：已完成'); expect(html).not.toContain('<dd>已完成</dd>');
});
test('OCR043 empty completed basis is a display gap without rewriting report state', async () => {
  const view=await ocrRingView({...ocrCompleteRing(),basis:[]});
  expect(view('reportRingHtml(1)')).toContain('完成声明缺依据');
  expect(view('DATA.rings[0].state')).toBe('completed');
});
test.each([['not_applicable','不适用',false],['unavailable','未取得',true]])('OCR043 legal %s keeps null evidence and explanatory basis', async (state,label,counted) => {
  const row={...ocrCompleteRing(),state,applicability:state==='not_applicable'?'not_applicable':'required',evidence_type:null,basis:[{reason:'具名边界',evidence_level:null}],counted_in_denominator:counted};
  const view=await ocrRingView(row); const html=view('reportRingHtml(1)');
  expect(html).toContain('<dd>'+label+'</dd>'); expect(html).toContain('具名边界');
  expect(html).toContain('<dd>'+(counted?'是':'否')+'</dd>');
  expect(html).not.toContain('字段缺口'); expect(html).not.toContain('格式不符');
});
test('OCR043 explicit conflict content is preserved and escaped', async () => {
  const view=await ocrRingView({...ocrCompleteRing(),conflict:'<em>源冲突</em>'});
  const html=view('reportRingHtml(1)'); expect(html).toContain('&lt;em&gt;源冲突&lt;/em&gt;'); expect(html).not.toContain('<em>源冲突</em>');
});
async function ocrInteractivePage(failStore=false) {
  const {createContext,runInContext}=await import('node:vm');
  const scripts=[...read('skills/answer-as-page/templates/overview-template.html').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/giu)].map(m=>m[1]);
  const listeners={},elements=new Map(),stored=new Map();
  const element=()=>({innerHTML:'',scrollTop:0,addEventListener(){},querySelector(){return {focus(){},scrollIntoView(){}}},querySelectorAll(){return []}});
  const document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)},addEventListener(name,fn){listeners[name]=fn},createElement(){return {}},head:{appendChild(){}}};
  const ctx=createContext({document,localStorage:{getItem:k=>stored.get(k)??null,setItem(k,v){if(failStore)throw Error('controlled storage failure');stored.set(k,v)}}});
  const split=scripts[0].indexOf('const OBJ ='); runInContext(scripts[0].slice(0,split),ctx);
  const rows=[ocrCompleteRing(),{...ocrCompleteRing(),ring:2,name:'decision-log'}];
  runInContext('DATA.taskIdentity="OCR-ring"; DATA.rings='+JSON.stringify(rows)+'; DATA.ringNodes=[{stable_id:"ring:1",content_digest:"real-digest"}]; DATA.initialChanged=["ring:1"]; DATA.changedChips=[{id:"ring:1",label:"原始需求"}];',ctx);
  runInContext(scripts[0].slice(split),ctx); runInContext(scripts[1],ctx);
  return {read:expr=>runInContext(expr,ctx),stored,click(kind,id){listeners.click({target:{closest(selector){if(kind==='seen'&&selector==='[data-seen]')return {};if(kind==='go'&&selector==='[data-go]')return {dataset:{go:id}};return null}}})}};
}
test('OCR043 ring target shows changes; navigation preserves them; successful seen persistence clears them', async () => {
  const view=await ocrInteractivePage();
  expect(view.read('reportRingHtml(1)')).toContain('有更新'); expect(view.read('reportRingHtml(2)')).not.toContain('有更新');
  view.click('go','ring:1'); expect(view.read('CHANGED.has("ring:1")')).toBe(true); expect(view.stored.size).toBe(0);
  view.click('seen'); expect(view.stored.size).toBe(1); expect(view.read('CHANGED.has("ring:1")')).toBe(false);
  expect(view.read('reportRingHtml(1)')).not.toContain('有更新'); expect(view.read('headerRightHtml()')).not.toContain('原始需求');
});
test('OCR043 failed seen storage retains the ring marker and reports the failure', async () => {
  const view=await ocrInteractivePage(true); view.click('seen');
  expect(view.read('CHANGED.has("ring:1")')).toBe(true); expect(view.read('reportRingHtml(1)')).toContain('有更新');
  expect(view.read('headerRightHtml()')).toContain('本次清除未持久保存'); expect(view.stored.size).toBe(0);
});
test('OCR043 GAPS is CORE-only while live flow task failure and task/acc attachments survive', async () => {
  const view=await n9View('DATA.objects.push({id:"orphan-req",kind:"req"},{id:"real-acc",kind:"acc",label:"验收",title:"真实验收附件",short:"真实验收附件",of:"wp1",status:{text:"未取得",tone:"unk"}});');
  expect(Array.from(view('Object.keys(GAPS)')).sort()).toEqual([...n9Kinds].sort());
  expect(Array.from(view('chainFor("d1").map(l=>l.kind)'))).toEqual(n9Kinds);
  expect(view('chainFor("d1").find(l=>l.kind==="phase").attachments.find(a=>a.kind==="task").items.includes("task1")')).toBe(true);
  expect(view('chainFor("d1").find(l=>l.kind==="review").attachments.find(a=>a.kind==="acc").items')).toContain('real-acc');
  expect(view('chainHtml(OBJ.d1)')).toContain('真实验收附件');
  expect(view('flowFor("orphan-req").cols.find(c=>c.kind==="task").gapTone')).toBe('fail');
  for(const kind of ['req','dec','file']) expect(view('GAPS['+JSON.stringify(kind)+'][1]')).toBe('fail');
});
