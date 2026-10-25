import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
const failure=(code,details={})=>Object.assign(new Error(code),{code,...details});
const text=value=>typeof value==='string'&&value.trim().length>0;
const clone=value=>JSON.parse(JSON.stringify(value));
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
const digest=value=>createHash('sha256').update(JSON.stringify(stable(value))??'undefined').digest('hex');
function deepFreeze(value) {if(value&&typeof value==='object'){for(const child of Object.values(value))deepFreeze(child);Object.freeze(value);}return value;}
export function freezeChecklist(plan,{now=()=>new Date().toISOString()}={}) {
  const scope=clone(plan?.scope||{}),entries=scope.checklist;
  if(!Array.isArray(entries)||!entries.length)throw failure('INVALID_CHECKLIST');
  const ids=new Set();
  for(const entry of entries){
    if(!entry||!['id','page','state','viewport','element','category','property','selector','norm_anchor'].every(key=>text(entry[key]))||!text(entry.locator?.tree_ref)||!entry.locator.business_attributes||typeof entry.locator.business_attributes!=='object'||!Object.keys(entry.locator.business_attributes).length)throw failure('INVALID_CHECKLIST_ENTRY');
    if(scope.pages?.find(page=>page.id===entry.page)?.state!==entry.state)throw failure('CHECKLIST_STATE_UNVERIFIED');
    if(ids.has(entry.id))throw failure('DUPLICATE_CHECKLIST_ID');ids.add(entry.id);
    if(!scope.pages?.some(page=>page.id===entry.page)||!scope.states?.includes(entry.state)||!scope.viewports?.some(viewport=>viewport.id===entry.viewport)||!scope.elements?.includes(entry.element)||!scope.norm_categories?.includes(entry.category))throw failure('CHECKLIST_SCOPE_MISMATCH');
  }
  if(!Array.isArray(scope.critical)||new Set(scope.critical).size!==scope.critical.length||scope.critical.some(id=>!ids.has(id)))throw failure('UNKNOWN_CRITICAL_ID');
  if(!Number.isFinite(scope.conflict_threshold)||scope.conflict_threshold<0||scope.conflict_threshold>1)throw failure('INVALID_CONFLICT_THRESHOLD');
  scope.frozen_at=scope.frozen_at||now();
  if(!Number.isFinite(Date.parse(scope.frozen_at)))throw failure('INVALID_FREEZE_TIME');
  return deepFreeze(scope);
}
export function computeCoverage(items,scope) {
  const collected=new Set();
  for(const item of items){const entry=scope.checklist.find(entry=>entry.id===item.id);if(entry&&!['declared','screenshot'].includes(item.evidence_kind)&&item.collection_phase==='formal'&&['page','state','viewport','property'].every(key=>item[key]===entry[key]))collected.add(item.id);}
  const missing=scope.checklist.filter(entry=>!collected.has(entry.id)).map(entry=>entry.id),critical_missing=scope.critical.filter(id=>!collected.has(id)),ratio=collected.size/scope.checklist.length;
  return {denominator:scope.checklist.length,collected:collected.size,missing,critical_missing,ratio,scope_ref:'scope.checklist',accepted:ratio>=0.9&&!critical_missing.length};
}
function observedStateMatches(observation,entry,scope){const page=scope.pages.find(page=>page.id===entry.page),evidence=observation?.state_evidence;return !!page?.state_check&&page.state===entry.state&&evidence?.state===entry.state&&evidence.selector===page.state_check.selector&&evidence.expected_text===page.state_check.text&&text(evidence.observed_text)&&evidence.observed_text.includes(page.state_check.text);}
const inputKeys=['design_source','target_elements','properties','states','acceptance_points'];
const topKeys=['source','scope','norm_basis','inputs','items','comparison','gaps','norm_defects','coverage','commands','freshness','failures','low_fidelity','scoring','pending_review'];
// Compare only provably equivalent units/encodings; unresolved CSS is not conflict evidence.
function sourceDifference(declared,rendered){
  if(declared?.status!=='present')return {conflict:false,reason:'Source comparison unknown: no exact declaration; rendered value remains the consumer value'};
  const left=declared.value,right=rendered?.value;
  if(left===right)return {conflict:false,reason:`Source declaration ${left} and rendered ${right} are equivalent; norm applicability remains pending`};
  const numeric=v=>typeof v==='string'?v.trim().match(/^(-?\d+(?:\.\d+)?)(px|rem|em|%|vh|vw|s|ms|deg)?$/):null;
  const color=v=>{if(typeof v!=='string')return null;const hex=v.match(/^#([\da-f]{3}|[\da-f]{6})$/i);if(hex){const h=hex[1].length===3?[...hex[1]].map(x=>x+x).join(''):hex[1];return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16));}const rgb=v.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);return rgb&&rgb.slice(1).every(x=>Number(x)<=255)?rgb.slice(1).map(Number):null;};
  const a=numeric(left),b=numeric(right),ca=color(left),cb=color(right);
  const comparable=a&&b&&a[2]===b[2]||ca&&cb;
  if(!comparable)return {conflict:false,reason:`Source comparison uncomparable: declaration ${left}, rendered ${right}; unsupported unit/token conversion, no conflict inferred`};
  const equal=a&&b?Number(a[1])===Number(b[1]):ca.every((v,i)=>v===cb[i]);
  return {conflict:!equal,reason:equal?`Source declaration ${left} and rendered ${right} are equivalent after encoding normalization`:`Source declaration ${left} differs from measured rendered ${right}; active cascade cause not established by these facts; consumers use rendered`};
}
function sourceConflictSummary(items,scope){const conflicts=items.filter(item=>sourceDifference(item.declared,item.rendered).conflict),ratio=conflicts.length/scope.checklist.length;return {conflicts,exceeded:ratio>scope.conflict_threshold,reason:`Source declaration/rendered conflict rate ${conflicts.length}/${scope.checklist.length} exceeds frozen threshold ${scope.conflict_threshold}`};}
function observationFromOutput(bytes,id) {
  const rows=String(bytes).split('\n').filter(row=>row.startsWith('WHQA_OBSERVATIONS='));
  if(rows.length!==1)throw failure('OBSERVATION_ORIGINAL_INVALID');
  const values=JSON.parse(rows[0].slice('WHQA_OBSERVATIONS='.length));
  const matching=Array.isArray(values)?values.filter(value=>value.id===id):[];
  if(matching.length!==1)throw failure('OBSERVATION_ORIGINAL_INVALID');return matching[0];
}
export function validateExtraction(doc,{readEvidence,current}={}) {
  const errors=topKeys.filter(key=>!Object.hasOwn(doc||{},key)).map(key=>'MISSING_FIELD:'+key);
  const check=(condition,code)=>{if(!condition)errors.push(code);};
  const freshness={status:'unknown',reasons:['Current comparison materials not supplied'],affected_scope:[],next_action:'supply-current-comparison'};
  if(errors.length)return {valid:false,errors,freshness};
  for(const key of ['items','comparison','gaps','norm_defects','commands','failures','pending_review'])check(Array.isArray(doc[key]),'INVALID_ARRAY:'+key);
  if(errors.length)return {valid:false,errors,freshness};
  let scope;try{scope=freezeChecklist(doc);}catch(error){errors.push(error.code);return {valid:false,errors,freshness};}
  check(['type','ref','version','owner','consumer'].every(key=>text(doc.source?.[key]))&&!!doc.source.scope,'INVALID_SOURCE');
  check(['runnable_page','figma_export','screenshot'].includes(doc.source?.type),'INVALID_SOURCE_TYPE');
  const assetSource=['figma_export','screenshot'].includes(doc.source.type);
  if(assetSource)for(const entry of scope.checklist)try{readSourceAsset(doc.source,entry);}catch(error){errors.push('SOURCE_ASSET_INVALID:'+error.message);}
  check(doc.source.type==='figma_export'?doc.source.figma?.status==='present'&&doc.source.figma.unavailable===false:doc.source?.figma?.status==='unavailable'&&doc.source.figma.unavailable===true&&text(doc.source.figma.reason),'INVALID_FIGMA_UNAVAILABLE');
  const norm=doc.norm_basis;
  check(text(norm?.id)&&text(norm.version)&&Array.isArray(norm.entries),'INVALID_NORM_BASIS');
  if(Array.isArray(norm?.entries))for(const category of scope.norm_categories){const entry=norm.entries.find(entry=>entry.category===category);check(!!entry&&(text(entry.not_applicable_reason)||(['ref','version','scope','owner','consumer'].every(key=>text(entry[key]))&&(text(entry.anchor)||text(entry.section)))),'INVALID_NORM_SOURCE:'+category);}
  for(const key of inputKeys){const input=doc.inputs?.[key];check(!!input&&['present','missing','conflict','pending_review'].includes(input.status)&&Array.isArray(input.blocks)&&!!input.source_ref,'INVALID_INPUT:'+key);if(input?.status==='present')check(input.value!==undefined&&input.value!==null&&input.value!==''&&(!Array.isArray(input.value)||input.value.length>0),'EMPTY_PRESENT_INPUT:'+key);else check(text(input?.reason)&&input?.blocks?.length>0&&doc.gaps.some(gap=>gap.input==='inputs.'+key&&input.blocks.every(block=>gap.blocks?.includes(block))),'UNBOUND_INPUT_GAP:'+key);}
  const commandMap=new Map(),originals=new Map();
  for(const command of doc.commands){check(text(command.id)&&!commandMap.has(command.id),'INVALID_COMMAND_ID');commandMap.set(command.id,command);check(text(command.cwd)&&(Array.isArray(command.argv)||text(command.shell))&&Number.isInteger(command.exit_code)&&Object.hasOwn(command,'signal')&&typeof command.timed_out==='boolean'&&typeof command.cancelled==='boolean'&&text(command.output_ref),'INVALID_COMMAND_FACT:'+command.id);check(Number.isFinite(Date.parse(command.started_at))&&Date.parse(command.started_at)>=Date.parse(scope.frozen_at),'COMMAND_BEFORE_FREEZE:'+command.id);try{if(typeof readEvidence!=='function')throw failure('EVIDENCE_READER_REQUIRED');originals.set(command.id,readEvidence(command.output_ref));}catch{errors.push('EVIDENCE_UNREADABLE:'+command.id);}}
  const itemIds=new Set();
  for(const item of doc.items){
    const entry=scope.checklist.find(entry=>entry.id===item.id),command=commandMap.get(item.command_ref);
    check(!!entry&&!itemIds.has(item.id),'INVALID_ITEM_ID:'+item.id);itemIds.add(item.id);
    check(!!entry&&['page','state','viewport','property'].every(key=>item[key]===entry[key])&&digest(item.locator)===digest(entry.locator),'ITEM_SCOPE_MISMATCH:'+item.id);
    if(assetSource){try{const fact=readSourceAsset(doc.source,entry),rows=String(originals.get(command?.id)).split('\n').filter(row=>row.startsWith('SOURCE_FACT='));check(rows.length===1,'SOURCE_FACT_ORIGINAL_INVALID');const raw=JSON.parse(rows[0].slice('SOURCE_FACT='.length));check(raw.id===item.id&&digest(raw.fact)===digest(fact),'SOURCE_FACT_ORIGINAL_MISMATCH');for(const key of ['structure','declared','rendered','asset','inference'])check(digest(item[key])===digest(fact[key]),'SOURCE_FACT_MISMATCH:'+key);check(item.evidence_kind===fact.evidence_kind&&item.reason===fact.reason&&item.source_ref===doc.source.ref,'SOURCE_FACT_KIND_MISMATCH');check(['present','missing','conflict','pending_review'].includes(item.norm_state)&&text(item.norm_anchor),'INVALID_NORM_STATE:'+item.id);check(digest(item.inference)===digest(fact.inference),'SOURCE_INFERENCE_UNBOUND');check(command?.exit_code===0&&!command.signal&&!command.timed_out&&!command.cancelled&&item.evidence_ref===command.output_ref,'SOURCE_COMMAND_MISMATCH');}catch(error){errors.push('SOURCE_ASSET_INVALID:'+error.message);}continue;}
    check(observedStateMatches({state_evidence:item.state_evidence},item,scope),'ITEM_STATE_UNVERIFIED:'+item.id);
    check(['source_ref','reason'].every(key=>text(item[key]))&&!!item.declared&&typeof item.declared==='object'&&!!item.inference&&typeof item.inference==='object','MISSING_ITEM_FACT:'+item.id);
    for(const key of ['declared','inference']){const fact=item[key];check(['present','unknown'].includes(fact?.status),'INVALID_FACT_STATUS:'+item.id+':'+key);if(fact?.status==='unknown')check(text(fact.reason)&&Array.isArray(fact.affected_scope)&&fact.affected_scope.includes(item.id),'UNBOUND_UNKNOWN:'+item.id+':'+key);}
    if(item.declared?.status==='present')try{const declared=item.declared,raw=JSON.parse(readEvidence(declared.evidence_ref));check(text(declared.value)&&text(declared.source_ref)&&text(declared.source_sha256)&&declared.selector===entry?.selector&&declared.property===item.property&&digest(raw)===digest(Object.fromEntries(Object.entries(declared).filter(([key])=>key!=='evidence_ref'))),'DECLARATION_ORIGINAL_MISMATCH:'+item.id);}catch{errors.push('DECLARATION_ORIGINAL_UNREADABLE:'+item.id);}
    if(item.declared?.status==='present'&&!entry?.css_declaration){const property=cssProperty(item.declared.source_literal||'',entry?.selector,item.property);check(!!property&&property.value===item.declared.value,'DECLARED_PROPERTY_UNPROVEN:'+item.id);}
    if(entry?.css_declaration)try{const derived=readGeneratedCssDeclaration(doc,entry,readEvidence);check(digest(derived)===digest(Object.fromEntries(Object.entries(item.declared||{}).filter(([key])=>!['evidence_ref','structure_source'].includes(key)))),'GENERATED_DECLARATION_MISMATCH:'+item.id);}catch{errors.push('GENERATED_DECLARATION_UNREADABLE:'+item.id);}
    check(['present','missing','conflict','pending_review'].includes(item.norm_state)&&text(item.norm_anchor),'INVALID_NORM_STATE:'+item.id);
    check(['rendered','declared','screenshot'].includes(item.evidence_kind),'INVALID_EVIDENCE_KIND:'+item.id);
    if(item.evidence_kind==='screenshot')check(item.rendered?.status==='unknown'&&text(item.rendered.reason)&&!Object.hasOwn(item.rendered,'value'),'SCREENSHOT_IS_NOT_RENDERED:'+item.id);
    check(!!command&&command.exit_code===0&&!command.signal&&!command.timed_out&&!command.cancelled&&item.evidence_ref===command.output_ref,'ITEM_COMMAND_MISMATCH:'+item.id);
    if(command&&originals.has(command.id))try{const raw=observationFromOutput(originals.get(command.id),item.id);check(raw.id===item.id&&raw.page===item.page&&raw.selector===entry?.selector&&raw.observation?.rendered?.styles?.[item.property]===item.rendered?.value&&digest(raw.observation?.structure)===digest(item.structure)&&digest(raw.observation?.rendered?.box)===digest(item.rendered?.box)&&digest(raw.observation?.state_evidence)===digest(item.state_evidence),'ORIGINAL_OBSERVATION_MISMATCH:'+item.id);}catch{errors.push('ORIGINAL_OBSERVATION_UNREADABLE:'+item.id);}
  }
  for(const row of doc.comparison){const item=doc.items.find(item=>item.id===row.item_ref),basis=doc.source.type==='figma_export'?'declared':doc.source.type==='screenshot'?'unknown':'rendered',value=basis==='declared'?item?.declared?.value:basis==='unknown'?'unknown':item?.rendered?.value;check(!!item&&row.design_value===value&&(!assetSource||row.design_basis===basis)&&row.evidence_ref===item.evidence_ref&&['present','missing','conflict','pending_review'].includes(row.state)&&(row.implementation_value!=='unknown'||row.state==='missing')&&(basis!=='unknown'||row.state==='missing'),'INVALID_COMPARISON:'+row.item_ref);}
  for(const item of doc.items)check(doc.comparison.some(row=>row.item_ref===item.id),'MISSING_COMPARISON:'+item.id);
  for(const entry of doc.failures)check(text(entry.category)&&text(entry.original_error)&&commandMap.has(entry.command_ref)&&Array.isArray(entry.affected_scope)&&entry.affected_scope.length>0,'INVALID_FAILURE');
  check(digest(doc.coverage)===digest(computeCoverage(doc.items,scope)),'COVERAGE_NOT_REPRODUCIBLE');
  check(typeof doc.low_fidelity?.triggered==='boolean'&&Array.isArray(doc.low_fidelity.reasons)&&['pending','approved','rejected','no_response'].includes(doc.low_fidelity.ruling)&&Array.isArray(doc.low_fidelity.blocked_scope)&&(!doc.low_fidelity.triggered||doc.low_fidelity.reasons.length>0),'INVALID_LOW_FIDELITY');
  if(['pending','rejected','no_response'].includes(doc.low_fidelity?.ruling))check(doc.low_fidelity.blocked_scope.length>0,'UNBLOCKED_RULING');
  if(!doc.low_fidelity?.triggered&&doc.low_fidelity?.ruling==='approved')check(text(doc.low_fidelity.not_applicable_reason),'MISSING_RULING_NOT_APPLICABLE');
  const sourceConflicts=sourceConflictSummary(doc.items,scope);
  const conditions=[],requiredBlocks=new Set(),toolAffected=new Set(doc.failures.filter(row=>row.category==='engine').flatMap(row=>row.affected_scope));
  for(const key of inputKeys)if(doc.inputs?.[key]?.status!=='present'){if(!conditions.includes('必要输入缺失或待判断'))conditions.push('必要输入缺失或待判断');for(const block of doc.inputs?.[key]?.blocks||[])requiredBlocks.add(block);}
  const missingCritical=computeCoverage(doc.items,scope).critical_missing.filter(id=>!toolAffected.has(id));
  if(missingCritical.length){conditions.push('关键设计项缺失（非工具失败）');for(const id of missingCritical)requiredBlocks.add('implement:'+scope.checklist.find(entry=>entry.id===id).element);}
  if(sourceConflicts.exceeded){conditions.push(sourceConflicts.reason);for(const item of sourceConflicts.conflicts)requiredBlocks.add('implement:'+scope.checklist.find(entry=>entry.id===item.id).element);}
  check(doc.low_fidelity?.triggered===(conditions.length>0),'LOW_FIDELITY_TRIGGER_MISMATCH');
  for(const reason of conditions)check(doc.low_fidelity?.reasons?.includes(reason),'LOW_FIDELITY_REASON_MISSING:'+reason);
  if(doc.low_fidelity?.ruling!=='approved')for(const block of requiredBlocks)check(doc.low_fidelity?.blocked_scope?.includes(block),'LOW_FIDELITY_SCOPE_MISSING:'+block);

  for(const item of sourceConflicts.conflicts)check(item.reason===sourceDifference(item.declared,item.rendered).reason,'SOURCE_DIFFERENCE_REASON_MISSING:'+item.id);
  if(sourceConflicts.exceeded){check(doc.low_fidelity?.triggered===true&&doc.low_fidelity.reasons.includes(sourceConflicts.reason),'SOURCE_CONFLICT_TRIGGER_MISSING');if(doc.low_fidelity?.ruling!=='approved')for(const item of sourceConflicts.conflicts)check(doc.low_fidelity.blocked_scope.includes('implement:'+scope.checklist.find(entry=>entry.id===item.id).element),'SOURCE_CONFLICT_UNBLOCKED:'+item.id);}
  check(doc.scoring?.status==='unavailable'&&text(doc.scoring.reason),'INVALID_SCORING');
  check(Number.isFinite(Date.parse(doc.freshness?.generated_at))&&Date.parse(doc.freshness.generated_at)>=Date.parse(scope.frozen_at)&&!!doc.freshness.source_versions&&!!doc.freshness.norm_versions&&text(doc.freshness.structure_ref)&&['current','stale','unknown','missing'].includes(doc.freshness.status),'INVALID_FRESHNESS');
  if(current&&['source_versions','norm_versions','structure_ref'].every(key=>current[key]!==undefined)){
    const changed=['source_versions','norm_versions','structure_ref'].filter(key=>digest(current[key])!==digest(doc.freshness[key]));
    if(changed.length)Object.assign(freshness,{status:'stale',reasons:changed.map(key=>'Changed '+key),affected_scope:doc.items.map(item=>item.id),next_action:'reextract'});
    else if(![...Object.values(current.source_versions),...Object.values(current.norm_versions)].some(version=>['unknown','missing'].includes(version)))Object.assign(freshness,{status:'current',reasons:[],next_action:'continue'});
    else freshness.reasons=['Unknown or missing comparison versions: '+['source_versions','norm_versions'].flatMap(group=>Object.entries(current[group]).filter(([,version])=>['unknown','missing'].includes(version)).map(([key,version])=>`${group}.${key}=${version}`)).join(', ')];
  }
  return {valid:!errors.length,errors,freshness};
}
export async function collectDesignSource(plan,context) {
  const scope=freezeChecklist(plan,{now:context.now}),items=[],commands=[],failures=[],gaps=[];
  if(!plan.source||!plan.norm_basis||!inputKeys.every(key=>plan.inputs?.[key]))throw failure('INVALID_COLLECTION_PLAN');
  if(plan.source.type===undefined)plan={...plan,source:{...plan.source,type:'runnable_page'}};
  const assetSource=['figma_export','screenshot'].includes(plan.source.type);
  if(plan.source.type&&!['runnable_page','figma_export','screenshot'].includes(plan.source.type))throw failure('UNSUPPORTED_SOURCE_TYPE');
  if(assetSource)for(const entry of scope.checklist)readSourceAsset(plan.source,entry);
  for(const [index,entry] of scope.checklist.entries()) {
    let command;
    try {
      const result=await context.read(entry,scope);command=result.command;
      if(!command||!Number.isInteger(command.exit_code)||!text(command.output_ref))throw failure('COMMAND_FACT_UNAVAILABLE',{category:'engine'});
      const previous=commands.find(existing=>existing.id===command.id);
      if(previous&&digest(previous)!==digest(command))throw failure('COMMAND_IDENTITY_CHANGED',{category:'engine',command});
      if(!previous)commands.push(command);
      if(command.exit_code||command.cancelled||command.timed_out||command.signal)throw failure('COLLECTION_COMMAND_FAILED',{category:'engine',command});
      if(assetSource){const fact=result.source_fact;if(!fact)throw failure('SOURCE_FACT_UNAVAILABLE',{category:'engine',command});items.push({id:entry.id,page:entry.page,state:entry.state,viewport:entry.viewport,property:entry.property,locator:clone(entry.locator),source_ref:plan.source.ref,...clone(fact),inference:clone(fact.inference),norm_state:'pending_review',norm_anchor:entry.norm_anchor,evidence_ref:command.output_ref,command_ref:command.id,collection_phase:'formal'});gaps.push({item:entry.id,reason:fact.rendered.reason,blocks:['implement:'+entry.element],provider:plan.source.owner});continue;}
      const observation=result.observation,box=observation?.rendered?.box;
      if(!observedStateMatches(observation,entry,scope))throw failure('STATE_NOT_OBSERVED',{category:'state_unverified',command});
      let declared={status:'unknown',reason:'No exact source declaration mapping supplied; inline style alone is not design intent',inline_style:observation.declared?.style??'unknown',affected_scope:[entry.id]};
      if(entry.declaration)declared=readSourceDeclaration(plan.source,entry);
      if(entry.css_declaration)declared={...readGeneratedCssDeclaration(plan,entry,context.readEvidence),structure_source:declared};
      if(entry.declaration||entry.css_declaration){if(typeof context.saveDeclaration==='function')declared.evidence_ref=await context.saveDeclaration(declared);} 
      // zero-size observations are not successful measurements, even on exit 0.
      if(!box||!Number.isFinite(box.width)||!Number.isFinite(box.height)||box.width<=0||box.height<=0)throw failure('ZERO_SIZE_ELEMENT',{category:'element_unrendered',command});
      const value=observation.rendered.styles?.[entry.property];
      if(!text(value)||!text(observation.structure?.tag))throw failure('OBSERVATION_UNAVAILABLE',{category:'engine',command});
      items.push({id:entry.id,page:entry.page,state:entry.state,viewport:entry.viewport,property:entry.property,locator:clone(entry.locator),source_ref:plan.source.ref,structure:clone(observation.structure),state_evidence:clone(observation.state_evidence),rendered:{value,box:clone(box)},declared,inference:{status:'unknown',reason:'No design intent inferred from rendered values',affected_scope:[entry.id]},norm_state:'pending_review',norm_anchor:entry.norm_anchor,evidence_kind:'rendered',evidence_ref:command.output_ref,command_ref:command.id,reason:sourceDifference(declared,{value}).reason,collection_phase:'formal'});
    } catch(error) {
      command=error.command||command;
      if(command&&!commands.some(existing=>existing.id===command.id))commands.push(command);
      const category=error.category||'engine',affected_scope=category==='engine'?scope.checklist.slice(index).map(item=>item.id):[entry.id];
      failures.push({category,original_error:error.message,command_ref:command?.id||'unknown',affected_scope});
      gaps.push({item:entry.id,reason:error.message,blocks:['implement:'+entry.element],provider:plan.source.owner});
      if(category==='engine')break;
    }
  }
  for(const key of inputKeys){const input=plan.inputs[key];if(input.status!=='present')gaps.push({input:'inputs.'+key,reason:input.reason,blocks:input.blocks,provider:input.owner||plan.source.owner});}
  if(plan.source.figma?.unavailable)gaps.push({input:'source.figma',reason:plan.source.figma.reason,blocks:['figma-semantic-extraction'],provider:plan.source.owner});
  const coverage=computeCoverage(items,scope),reasons=[];
  if(inputKeys.some(key=>plan.inputs[key].status!=='present'))reasons.push('必要输入缺失或待判断');
  const toolAffected=new Set(failures.filter(entry=>entry.category==='engine').flatMap(entry=>entry.affected_scope));
  if(coverage.critical_missing.some(id=>!toolAffected.has(id)))reasons.push('关键设计项缺失（非工具失败）');
  const sourceConflicts=sourceConflictSummary(items,scope);
  if(sourceConflicts.exceeded){reasons.push(sourceConflicts.reason);for(const item of sourceConflicts.conflicts)gaps.push({item:item.id,reason:item.reason,blocks:['implement:'+scope.checklist.find(entry=>entry.id===item.id).element],provider:plan.source.owner});}
  const generated_at=context.now?.()||new Date().toISOString();
  const doc={source:clone(plan.source),scope,norm_basis:clone(plan.norm_basis),inputs:clone(plan.inputs),items,comparison:items.map(item=>({item_ref:item.id,design_basis:plan.source.type==='figma_export'?'declared':plan.source.type==='screenshot'?'unknown':'rendered',design_value:plan.source.type==='figma_export'?item.declared.value:plan.source.type==='screenshot'?'unknown':item.rendered.value,implementation_value:'unknown',state:'missing',evidence_ref:item.evidence_ref})),gaps,norm_defects:[],coverage,commands,freshness:{generated_at,source_versions:{[plan.source.ref]:plan.source.version},norm_versions:Object.fromEntries(plan.norm_basis.entries.map(entry=>[entry.ref,entry.version])),structure_ref:'sha256:'+digest(items.map(item=>({id:item.id,locator:item.locator,structure:item.structure}))),status:'unknown',reasons:['Current comparison materials not supplied']},failures,low_fidelity:{triggered:!!reasons.length,reasons,ruling:reasons.length?(plan.low_fidelity?.ruling||'pending'):'approved',blocked_scope:reasons.length?[...new Set(gaps.filter(gap=>gap.input!=='source.figma').flatMap(gap=>gap.blocks))]:[],...(!reasons.length?{not_applicable_reason:'No design low-fidelity trigger; ruling not applicable, no human approval received'}:{})},scoring:{status:'unavailable',reason:'本次不实现数值评分'},pending_review:items.map(item=>({item_ref:item.id,question:'Norm alignment and source intent require owner review',owner:plan.norm_basis.owner||'norm owner'}))};
  const validation=validateExtraction(doc,{readEvidence:context.readEvidence,current:context.current});
  if(!validation.valid)throw failure('INVALID_EXTRACTION',{errors:validation.errors,doc});
  Object.assign(doc.freshness,validation.freshness);
  return doc;
}

import {readFileSync,realpathSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
export function readPlan(path,{probe=false}={}) {
  let plan;try{plan=JSON.parse(readFileSync(resolve(path),'utf8'));}catch(error){throw failure('PLAN_JSON_UNREADABLE',{original_error:error.message});}
  let scope;try{scope=freezeChecklist(plan);}catch(error){throw failure('INVALID_COLLECTION_PLAN',{original_error:error.message});}
  if(!probe&&!plan.scope.frozen_at)throw failure('FORMAL_PLAN_NOT_FROZEN');
  if(!plan.source||!plan.norm_basis||!inputKeys.every(key=>plan.inputs?.[key]))throw failure('INVALID_COLLECTION_PLAN');
  const assetSource=['figma_export','screenshot'].includes(plan.source.type);
  if(plan.source.type&&!['runnable_page','figma_export','screenshot'].includes(plan.source.type))throw failure('UNSUPPORTED_SOURCE_TYPE');
  if(assetSource)for(const entry of scope.checklist)readSourceAsset(plan.source,entry);
  if(['figma_export','screenshot'].includes(plan.source.type)){for(const entry of scope.checklist)readSourceAsset(plan.source,entry);return {...plan,scope};}
  const origins=new Set();
  for(const page of scope.pages){let url;try{url=new URL(page.url);}catch{throw failure('INVALID_PAGE_URL');}if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search)throw failure('INVALID_PAGE_URL');origins.add(url.origin);if(!text(page.state_check?.selector)||!text(page.state_check?.text))throw failure('STATE_CONTRACT_REQUIRED');for(const action of page.actions||[])if(action.type!=='click'||!text(action.selector)||Object.keys(action).some(key=>!['type','selector'].includes(key)))throw failure('INVALID_PREPARATION_ACTION');}
  if(origins.size!==1)throw failure('COLLECTION_ORIGIN_MISMATCH');
  for(const view of scope.viewports)if(!Number.isSafeInteger(view.width)||!Number.isSafeInteger(view.height)||view.width<=0||view.height<=0)throw failure('INVALID_VIEWPORT');
  return {...plan,scope};
}
function taskReader(task) {return ref=>task.readRecord(relative(task.taskPath,realpathSync(ref)));}
async function egoContext(plan,task,env) {
  const spaceId=Number(env.BROWSER_QA_EGO_SPACE_ID),cache=new Map();
  if(!Number.isSafeInteger(spaceId)||spaceId<1||env.BROWSER_QA_ENGINE!=='ego-lite')throw failure('OWNED_EGO_CONTEXT_REQUIRED');
  if(env.BROWSER_QA_TICKET_SOURCE_WS||env.BROWSER_QA_TICKET_TOP_LEVEL_SITE)throw failure('SOURCE_CAPABILITY_IN_SCENARIO');
  const browserModule=new URL('../../isolated-browser-qa/scripts/browser-qa-session.mjs',import.meta.url).href;
  return {readEvidence:taskReader(task),saveDeclaration:declared=>task.appendRecord({dir:'quality/evidence',slug:'design-source-declaration',ext:'json',bytes:JSON.stringify(declared,null,2)}),async read(entry,scope){
    const key=JSON.stringify([entry.page,entry.state,entry.viewport]);
    if(!cache.has(key)){
      const page=scope.pages.find(page=>page.id===entry.page),viewport=scope.viewports.find(view=>view.id===entry.viewport),entries=scope.checklist.filter(item=>item.page===entry.page&&item.state===entry.state&&item.viewport===entry.viewport);
      const input={spaceId,page,viewport,entries};
      // Only fixed SDK navigation, viewport setup and the P2 registered read.
      // No caller-supplied expression, protocol method or executable is accepted.
      const script=`const {runRegisteredScript}=await import(${JSON.stringify(browserModule)});const input=${JSON.stringify(input)};const task=await taskSpace(input.spaceId);const page=task.page('p1');await page.goto(input.page.url);await runRegisteredScript(page,'design-source-prepare-v1',{actions:input.page.actions||[]});for(const selector of new Set(input.entries.map(entry=>entry.selector)))await page.waitForSelector(selector,{state:'attached',timeout:5000});const stateObservation=(await runRegisteredScript(page,'design-source-read-v1',{elements:[{selector:input.page.state_check.selector,properties:[]}]}))[0];const state_evidence={state:input.page.state,selector:input.page.state_check.selector,expected_text:input.page.state_check.text,observed_text:stateObservation.structure.text};if(!state_evidence.observed_text.includes(state_evidence.expected_text))throw new Error('STATE_NOT_OBSERVED');const observations=await runRegisteredScript(page,'design-source-read-v1',{elements:input.entries.map(entry=>({selector:entry.selector,properties:[entry.property]}))});console.log('WHQA_OBSERVATIONS='+JSON.stringify(input.entries.map((entry,index)=>({id:entry.id,page:entry.page,selector:entry.selector,observation:{...observations[index],state_evidence}}))));`;
      const captured=await task.captureCommand({cwd:process.cwd(),slug:'design-source-observation',argv:['ego-browser','nodejs','-e',script],timeoutMs:30000});
      const command={id:captured.receipt_ref,cwd:captured.cwd,argv:captured.argv,exit_code:captured.exit_code,signal:captured.signal,timed_out:captured.timed_out,cancelled:captured.cancelled,started_at:captured.started_at,output_ref:captured.output_ref};
      const bytes=taskReader(task)(captured.output_ref);
      if(captured.exit_code||captured.signal||captured.timed_out||captured.cancelled){const category=/ELEMENT_NOT_RENDERED|ZERO_SIZE/.test(bytes)?'element_unrendered':/ELEMENT_NOT_FOUND|No element found|waiting for selector/i.test(bytes)?'element_missing':'engine';const error=failure(bytes.trim()||'COLLECTION_COMMAND_FAILED',{category,command});cache.set(key,{error});throw error;}
      cache.set(key,{command,bytes});
    }
    if(cache.get(key).error)throw cache.get(key).error;
    const {command,bytes}=cache.get(key);let raw;try{raw=observationFromOutput(bytes,entry.id);}catch(error){throw Object.assign(error,{category:'engine',command});}
    return {command,observation:raw.observation};
  }};
}
async function runCli(args,env=process.env) {
  const values=[...args];let planPath,validatePath,currentPath,scenario=false,probe=false;
  while(values.length){const arg=values.shift();if(arg==='--plan')planPath=values.shift();else if(arg==='--validate')validatePath=values.shift();else if(arg==='--current')currentPath=values.shift();else if(arg==='--workspace-scenario')scenario=true;else if(arg==='--probe')probe=true;else throw failure('INVALID_CLI_ARGUMENT');}
  if(!planPath)throw failure('PLAN_ARGUMENT_REQUIRED');
  const plan=readPlan(planPath,{probe}),execution=plan.execution;
  if(!execution?.task_path||!execution.project_name||!execution.task_id)throw failure('PLAN_TASK_IDENTITY_REQUIRED');
  if(validatePath){
    if(scenario||probe||!currentPath)throw failure('INVALID_VALIDATION_ARGUMENT');
    let current;try{current=JSON.parse(readFileSync(resolve(currentPath),'utf8'));if(!current||!['source_versions','norm_versions','structure_ref'].every(key=>current[key]!==undefined)||!text(current.structure_ref)||!current.source_versions||typeof current.source_versions!=='object'||!Object.keys(current.source_versions).length||!current.norm_versions||typeof current.norm_versions!=='object'||!Object.keys(current.norm_versions).length)throw failure('INCOMPLETE_CURRENT');}catch(error){throw failure('INVALID_CURRENT_COMPARISON',{original_error:error.message});}
    const {openTask}=await import('../../../runtime/task/task-handle.mjs');
    const task=openTask(resolve(execution.task_path),{projectName:execution.project_name,taskId:execution.task_id});
    const reader=taskReader(task),doc=JSON.parse(reader(resolve(validatePath))),result=validateExtraction(doc,{readEvidence:reader,current});
    console.log(JSON.stringify(result));return result.valid&&result.freshness.status==='current'?0:1;
  }
  if(currentPath)throw failure('INVALID_VALIDATION_ARGUMENT');
  const assetSource=['figma_export','screenshot'].includes(plan.source.type);
  if(!scenario&&!assetSource){
    const requestedEngine=env.BROWSER_QA_ENGINE||'auto';
    const existingEgo=requestedEngine==='auto'||requestedEngine==='ego-lite';
    if(existingEgo&&!/^[1-9][0-9]*$/.test(env.BROWSER_QA_EGO_SPACE_ID||''))throw failure('OWNED_EGO_CONTEXT_REQUIRED');
    const {runBrowserQa}=await import('../../isolated-browser-qa/scripts/browser-qa-session.mjs');
    const first=new URL(plan.scope.pages[0].url);first.hash='';
    const selectedEngine=existingEgo?'ego-lite':requestedEngine;
    return runBrowserQa(['--url',first.href,'--evidence-dir',resolve(execution.task_path,'quality/evidence'),'--',process.execPath,fileURLToPath(import.meta.url),'--plan',resolve(planPath),'--workspace-scenario',...(probe?['--probe']:[])],{...env,BROWSER_QA_ENGINE:selectedEngine,...(existingEgo?{BROWSER_QA_EGO_KEEP_OPEN:'1'}:{}),BROWSER_QA_AUTH_MODE:'none'});
  }
  const {openTask}=await import('../../../runtime/task/task-handle.mjs');
  const task=openTask(resolve(execution.task_path),{projectName:execution.project_name,taskId:execution.task_id});
  const context=assetSource?await assetContext(plan,task):await egoContext(plan,task,env);
  if(probe){const observed_ids=[],commands=[],failures=[];for(const entry of plan.scope.checklist){try{const result=await context.read(entry,plan.scope);observed_ids.push(entry.id);if(!commands.some(command=>command.id===result.command.id))commands.push(result.command);}catch(error){failures.push({original_error:error.message,affected_scope:[entry.id],command_ref:error.command?.id||'unknown'});if(error.category==='engine')break;}}console.log(JSON.stringify({probe:true,observed_ids,commands,failures}));return failures.length?1:0;}
  const doc=await collectDesignSource(plan,context);
  const artifact_ref=await task.appendRecord({dir:'quality/evidence',slug:execution.document_slug||'design-source-extraction',ext:'json',bytes:JSON.stringify(doc,null,2)});
  const exit_code=doc.failures.length||!doc.coverage.accepted?1:0;
  console.log(JSON.stringify({artifact_ref,exit_code,...(assetSource?{source_type:plan.source.type,cleanup:'no-browser-resources-created'}:{spaceId:Number(env.BROWSER_QA_EGO_SPACE_ID),cleanup:'retained-for-task-continuation'})}));
  return exit_code;
}
if(process.argv[1]===fileURLToPath(import.meta.url))runCli(process.argv.slice(2)).then(code=>{process.exitCode=code;}).catch(error=>{console.error(JSON.stringify({error:error.code||'COLLECTION_FAILED',original_error:error.original_error||error.message,errors:error.errors||[],...(error.doc?{failures:error.doc.failures}:{})}));process.exitCode=1;});
function cssProperty(css,selector,property){
  const marker=selector+' {',at=css.indexOf(marker);if(at<0||css.indexOf(marker,at+marker.length)>=0)return undefined;
  const end=css.indexOf('}',at+marker.length);if(end<0)return undefined;const rule=css.slice(at,end+1),body=css.slice(at+marker.length,end);
  const values=body.split(';').map(part=>{const colon=part.indexOf(':');return [part.slice(0,colon).trim(),part.slice(colon+1).trim()];}).filter(([key])=>key===property);
  return values.length===1&&text(values[0][1])?{value:values[0][1],rule}:undefined;
}
export function readSourceDeclaration(source,entry){
  const mapping=entry.declaration;if(!mapping||mapping.selector!==entry.selector||mapping.property!==entry.property)throw failure('SOURCE_DECLARATION_IDENTITY_MISMATCH');
  const root=realpathSync(source.ref),file=realpathSync(resolve(root,mapping.file)),rel=relative(root,file);
  if(!rel||rel==='..'||rel.startsWith('../')||rel.startsWith('/'))throw failure('SOURCE_DECLARATION_OUTSIDE_ROOT');
  const bytes=readFileSync(file),sha=createHash('sha256').update(bytes).digest('hex');
  if(sha!==mapping.sha256||!Number.isSafeInteger(mapping.line_start)||!Number.isSafeInteger(mapping.line_end)||mapping.line_start<1||mapping.line_end<mapping.line_start)throw failure('SOURCE_DECLARATION_CHANGED');
  const lines=bytes.toString('utf8').split('\n');if(mapping.line_end>lines.length)throw failure('SOURCE_DECLARATION_LINES_UNAVAILABLE');
  const literal=lines.slice(mapping.line_start-1,mapping.line_end).join('\n');if(!text(literal))throw failure('SOURCE_DECLARATION_EMPTY');
  const found=file.endsWith('.css')?cssProperty(literal,entry.selector,entry.property):undefined;
  const supporting=(mapping.supporting||[]).map(definition=>readSourceDeclaration(source,{...entry,declaration:{...definition,selector:entry.selector,property:entry.property}}));
  return {status:found?'present':'unknown',...(found?{value:found.value}:{reason:'Literal source does not establish this exact property; JSX class/structure is not a resolved declaration',affected_scope:[entry.id]}),source_literal:literal,supporting,source_ref:file+':'+mapping.line_start,source_sha256:sha,line_start:mapping.line_start,line_end:mapping.line_end,selector:entry.selector,property:entry.property,interpretation:'Source declaration only; no product design intent inferred'};
}
export function readGeneratedCssDeclaration(plan,entry,readEvidence){
  const mapping=entry.css_declaration,bytes=readEvidence(mapping.output_ref);
  if(createHash('sha256').update(bytes).digest('hex')!==mapping.output_sha256||mapping.property!==entry.property)throw failure('GENERATED_CSS_IDENTITY_MISMATCH');
  const response=JSON.parse(bytes),url=new URL(response.url),origin=new URL(plan.scope.pages[0].url).origin;
  if(response.status!==200||url.origin!==origin||url.pathname!=='/src/index.css')throw failure('GENERATED_CSS_SOURCE_MISMATCH');
  const id=response.text.match(/^const __vite__id = (.+)$/m),body=response.text.match(/^const __vite__css = (.+)$/m);
  if(!id||!body||JSON.parse(id[1])!==resolve(plan.source.ref,'src/index.css'))throw failure('GENERATED_CSS_SOURCE_MISMATCH');
  const css=JSON.parse(body[1]),found=cssProperty(css,mapping.selector,entry.property);if(!found)throw failure('GENERATED_CSS_PROPERTY_UNAVAILABLE');
  return {status:'present',value:found.value,source_literal:found.rule,source_ref:response.url+'#'+mapping.selector,source_sha256:createHash('sha256').update(css).digest('hex'),selector:entry.selector,rule_selector:mapping.selector,property:entry.property,input_output_ref:mapping.output_ref,input_output_sha256:mapping.output_sha256,interpretation:'Exact property in actual generated stylesheet; product intent remains unknown'};
}

// Local authorized exports/assets only. The authorization file is a caller claim,
// not independent proof of account permissions or redistribution rights.
function pngDimensions(b){
  if(b.length<33||b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw failure('INVALID_PNG_HEADER');
  const crc=bytes=>{let c=0xffffffff;for(const byte of bytes){c^=byte;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;};
  let offset=8,width,height,depth,color,ended=false,idat=false,palette=false;const data=[];
  while(offset<b.length){if(offset+12>b.length)throw failure('TRUNCATED_PNG_CHUNK');const length=b.readUInt32BE(offset),end=offset+12+length;if(end>b.length)throw failure('TRUNCATED_PNG_CHUNK');const type=b.toString('ascii',offset+4,offset+8),body=b.subarray(offset+8,offset+8+length);if(crc(b.subarray(offset+4,offset+8+length))!==b.readUInt32BE(offset+8+length))throw failure('INVALID_PNG_CRC');
    if(offset===8&&type!=='IHDR')throw failure('INVALID_PNG_ORDER');
    if(type==='IHDR'){if(offset!==8||length!==13)throw failure('INVALID_PNG_HEADER');width=body.readUInt32BE(0);height=body.readUInt32BE(4);depth=body[8];color=body[9];if(!width||!height||!({0:[1,2,4,8,16],2:[8,16],3:[1,2,4,8],4:[8,16],6:[8,16]}[color]?.includes(depth))||body[10]!==0||body[11]!==0)throw failure('INVALID_PNG_HEADER');if(body[12]!==0)throw failure('UNSUPPORTED_PNG_INTERLACE');}
    else if(type==='PLTE'){if(idat||!length||length%3||length>768)throw failure('INVALID_PNG_PALETTE');palette=true;}
    else if(type==='IDAT'){if(ended||color===3&&!palette)throw failure('INVALID_PNG_ORDER');idat=true;data.push(body);}
    else if(type==='IEND'){if(length||!idat||end!==b.length)throw failure('INVALID_PNG_END');ended=true;}
    else if(type[0]===type[0]?.toUpperCase())throw failure('UNSUPPORTED_PNG_CRITICAL_CHUNK');
    offset=end;
  }
  if(!ended)throw failure('PNG_IEND_REQUIRED');const channels={0:1,2:3,3:1,4:2,6:4}[color],stride=Math.ceil(width*channels*depth/8)+1,expected=stride*height;if(!Number.isSafeInteger(expected)||expected>16777216)throw failure('PNG_DECODE_LIMIT');let raw;try{raw=inflateSync(Buffer.concat(data),{maxOutputLength:expected});}catch{throw failure('INVALID_PNG_IMAGE_DATA');}if(raw.length!==expected)throw failure('INVALID_PNG_IMAGE_DATA');for(let i=0;i<height;i++)if(raw[i*stride]>4)throw failure('INVALID_PNG_FILTER');return {width,height};
}
export function readSourceAsset(source,entry){
  if(!['figma_export','screenshot'].includes(source?.type))throw failure('UNSUPPORTED_ASSET_SOURCE');
  const root=realpathSync(source.ref),load=(ref,sha)=>{if(!text(ref)||ref.startsWith('/')||!text(sha))throw failure('ASSET_REFERENCE_INVALID');const file=realpathSync(resolve(root,ref)),rel=relative(root,file);if(!rel||rel==='..'||rel.startsWith('../')||rel.startsWith('/'))throw failure('ASSET_OUTSIDE_SOURCE_ROOT');const bytes=readFileSync(file);if(createHash('sha256').update(bytes).digest('hex')!==sha)throw failure('ASSET_HASH_CHANGED');return {file,bytes};};
  const auth=source.authorization;if(auth?.status!=='present'||!text(auth.owner)||!text(auth.scope))throw failure('SOURCE_AUTHORIZATION_REQUIRED');
  const authorization=load(auth.ref,auth.sha256),claim=JSON.parse(authorization.bytes),asset=load(source.asset?.ref,source.asset?.sha256);
  if(claim.access!=='read'||claim.asset_sha256!==source.asset.sha256||claim.owner!==auth.owner||claim.scope!==auth.scope||claim.scope!==source.scope)throw failure('SOURCE_AUTHORIZATION_SCOPE_MISMATCH');
  const unknown={status:'unknown',reason:'No browser rendered observation supplied by this design asset',affected_scope:[entry.id]},base={asset:{ref:asset.file,sha256:source.asset.sha256,authorization_ref:authorization.file,authorization_sha256:auth.sha256,authorization_boundary:'Caller read-access claim, not independent account/rights verification'},rendered:unknown,inference:{status:'unknown',reason:'No visual inference provided',affected_scope:[entry.id]}};
  if(source.type==='screenshot'){
    const b=asset.bytes,dimensions=pngDimensions(b);let inference=base.inference;
    if(source.auxiliary_observations||entry.screenshot_observation_id){const mapping=source.auxiliary_observations;if(!mapping)throw failure('VISUAL_OBSERVATION_REQUIRED');const original=load(mapping.ref,mapping.sha256),aux=JSON.parse(original.bytes);if(aux.asset_sha256!==source.asset.sha256||!text(aux.observer)||aux.method!=='visual_inference'||!Array.isArray(aux.limits)||!aux.limits.length||!aux.limits.every(text)||!Array.isArray(aux.observations))throw failure('VISUAL_OBSERVATION_BINDING_INVALID');const matches=aux.observations.filter(row=>row.id===entry.screenshot_observation_id);if(!text(entry.screenshot_observation_id)||matches.length!==1)throw failure('VISUAL_OBSERVATION_NOT_UNIQUE');const row=matches[0];if(row.kind!=='visual_inference'||!text(row.value)||!Array.isArray(row.limits)||!row.limits.length||!row.limits.every(text))throw failure('VISUAL_INFERENCE_INVALID');inference={status:'present',value:row.value,observer:aux.observer,method:aux.method,limits:[...aux.limits,...row.limits],observation_id:row.id,source_ref:original.file,source_sha256:mapping.sha256,asset_sha256:source.asset.sha256,meaning:'Qualitative visual inference only; not DOM, computed styles or exact element geometry'};}

    return {...base,inference,asset:{...base.asset,width:dimensions.width,height:dimensions.height,dimensions_basis:'PNG IHDR header only; not full image decode',viewport:{status:'unknown',reason:'Image dimensions do not establish browser viewport'}},structure:{status:'unknown',reason:'Image asset alone does not establish DOM structure',affected_scope:[entry.id]},declared:{status:'unknown',reason:'Image does not establish a source property declaration',affected_scope:[entry.id]},evidence_kind:'screenshot',reason:'Auxiliary image asset identity only; element values/structure remain unknown and implementation is missing'};
  }
  if(source.figma?.status!=='present'||source.figma.unavailable!==false)throw failure('INVALID_FIGMA_PRESENT');
  const input=JSON.parse(asset.bytes),nodes=[],visit=node=>{if(!node||typeof node!=='object')return;if(node.id===entry.figma_node_id)nodes.push(node);for(const child of node.children||[])visit(child);};visit(input.document);
  if(!text(entry.figma_node_id)||nodes.length!==1)throw failure('FIGMA_NODE_NOT_UNIQUE');const node=nodes[0];if(!text(node.type)||!text(node.name))throw failure('FIGMA_STRUCTURE_UNAVAILABLE');
  const styles={'font-size':['fontSize','px'],'font-weight':['fontWeight',''],'line-height':['lineHeightPx','px']},style=styles[entry.property];let value;if(style&&Number.isFinite(node.style?.[style[0]]))value=String(node.style[style[0]])+style[1];else if(['width','height'].includes(entry.property)&&Number.isFinite(node.absoluteBoundingBox?.[entry.property]))value=String(node.absoluteBoundingBox[entry.property])+'px';else throw failure('FIGMA_PROPERTY_UNAVAILABLE');
  return {...base,structure:{id:node.id,type:node.type,name:node.name,...(typeof node.characters==='string'?{text:node.characters}:{})},declared:{status:'present',value,property:entry.property,node_id:node.id,source_ref:asset.file,source_sha256:source.asset.sha256,meaning:'Figma export declaration, not browser rendered measurement'},evidence_kind:'declared',reason:'Authorized local Figma export structure/declaration; browser rendered value remains unknown'};
}
async function assetContext(plan,task){return {readEvidence:taskReader(task),async read(entry){const script=`const{readSourceAsset}=await import(${JSON.stringify(import.meta.url)});console.log('SOURCE_FACT='+JSON.stringify({id:${JSON.stringify(entry.id)},fact:readSourceAsset(${JSON.stringify(plan.source)},${JSON.stringify(entry)})}));`,captured=await task.captureCommand({cwd:process.cwd(),slug:'design-source-asset-read',argv:[process.execPath,'--input-type=module','-e',script],timeoutMs:10000}),command={id:captured.receipt_ref,cwd:captured.cwd,argv:captured.argv,exit_code:captured.exit_code,signal:captured.signal,timed_out:captured.timed_out,cancelled:captured.cancelled,started_at:captured.started_at,output_ref:captured.output_ref};if(captured.exit_code)throw failure(taskReader(task)(captured.output_ref),{category:'engine',command});const rows=taskReader(task)(captured.output_ref).split('\n').filter(r=>r.startsWith('SOURCE_FACT='));if(rows.length!==1)throw failure('SOURCE_FACT_ORIGINAL_INVALID',{command,category:'engine'});return{command,source_fact:JSON.parse(rows[0].slice('SOURCE_FACT='.length)).fact};}};}
