import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// ORACLE-ACCEPTANCE-RUN. Independent acceptance-asset oracle; no real route execution.
const root = new URL('../../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const taskPath = 'tests/fixtures/light-route-controlled/tasks.json';
const bookPath = 'docs/research/n8-four-level-acceptance-runbook.md';
const levels = ['small', 'normal', 'complex', 'planning'];
const stageMap = {small:['make-decision'],normal:['make-decision'],complex:['make-decision','build-plan','build-code'],planning:['make-decision']};
const nonempty = value => expect(typeof value === 'string' && value.trim().length > 0).toBe(true);
function contract(book) {
 const blocks = [...book.matchAll(/```json\s*\n([\s\S]*?)\n```/g)].map(match => JSON.parse(match[1]));
 const found = blocks.find(value => value.executable_contract);
 expect(found, 'ORACLE-ACCEPTANCE-RUN executable_contract missing').toBeDefined();
 return found.executable_contract;
}
function tasksValid(tasks) {
 expect(tasks.map(task => task.level).sort()).toEqual([...levels].sort());
 expect(new Set(tasks.map(task => task.id)).size).toBe(4);
 for (const task of tasks) {
  for (const key of ['id','goal','controlled_input','evidence_path']) nonempty(task[key]);
  expect(task.evidence_path).toMatch(/^quality\//);
  expect(task.expected_calls.stages).toEqual(stageMap[task.level]);
  for (const field of ['steps','skills']) {expect(task.expected_calls[field].length).toBeGreaterThan(0);task.expected_calls[field].forEach(nonempty);}
  expect(task.expected_calls.confirmations).toBeGreaterThanOrEqual(1);
  expect(task.expected_calls.independent_review).toBe(task.level !== 'small');
  expect(task.failure_signals.length).toBeGreaterThan(0);task.failure_signals.forEach(nonempty);
 }
}
function bookValid(book, tasks) {
 const c = contract(book);
 expect(c.creation.command).toContain('tools/cli/task-bootstrap.mjs');
 for (const arg of ['--project=','--task=','--target-repo=']) expect(c.creation.command).toContain(arg);
 nonempty(c.creation.cleanup);nonempty(c.creation.safety);
 expect(c.routes.map(route=>route.id).sort()).toEqual(tasks.map(task=>task.id).sort());
 for(const route of c.routes){expect(route.steps.length).toBeGreaterThan(0);route.steps.forEach(nonempty);}
 for(const key of ['trigger','evidence','recommendation','user_choice','preserve_completed','fill_missing_only']) nonempty(c.negative_control[key]);
 expect(c.unchanged_risk_control.level).toBe('small');expect(c.unchanged_risk_control.independent_review).toBe(false);nonempty(c.unchanged_risk_control.evidence);
 expect(c.skip_declaration.fields).toEqual(['item','reason','rule_ref']);
 expect(c.skip_declaration.readback).toEqual(['declaration','facts.jsonl']);expect(c.skip_declaration.new_machine_fields).toBe(false);
}
describe('ORACLE-ACCEPTANCE-RUN T011 controlled assets', () => {
 it('four task definitions expose executable route expectations',()=>tasksValid(JSON.parse(read(taskPath)).tasks));
 it('runbook creates, executes, records negative/control and reads human skip declarations',()=>bookValid(read(bookPath),JSON.parse(read(taskPath)).tasks));
 it('README supplies actual bootstrap parameters, bounded cleanup and synthetic-only inputs',()=>{
  const doc=read('tests/fixtures/light-route-controlled/README.md');
  for(const token of ['tools/cli/task-bootstrap.mjs','--project=','--task=','--target-repo=']) expect(doc).toContain(token);
  expect(doc).toMatch(/清理/);expect(doc).toMatch(/真实.*数据/);expect(doc).toMatch(/受控|synthetic/);
 });
 it('the same oracle rejects missing level, evidence and cleanup rather than counting files',()=>{
  const tasks=JSON.parse(read(taskPath)).tasks,book=read(bookPath);
  const noLevel=structuredClone(tasks);delete noLevel[0].level;expect(()=>tasksValid(noLevel)).toThrow();
  const noEvidence=structuredClone(tasks);delete noEvidence[0].evidence_path;expect(()=>tasksValid(noEvidence)).toThrow();
  const c=contract(book);delete c.creation.cleanup;expect(()=>bookValid('```json\n'+JSON.stringify({executable_contract:c})+'\n```',tasks)).toThrow();
 });
});

// T012 extends the same oracle; tables are human-readable assets, not runtime state.
const parentPrd = 'specs/archive/skills-framework-redesign-20261014/prd.md';
const sharedSkills = ['mini-task','talk-with-zhipeng','decision-log','deep-research','anysearch','grill-with-docs','spec-clarify','spec-specify','spec-prd','spec-analyze','testing-system-blueprint','test-routing-advisor','backend-testing','frontend-testing','fullstack-slice-testing','isolated-browser-qa','ui-project-init','design-source-readiness','frontend-prototype-render','frontend-component-quality','wh-review','intake-decision-review','plan-ceo-review','review','simplicity-guard','plan-design-review','architect-code-review','diagnosing-bugs','stage-reflection','stage-handoff','resolving-merge-conflicts'];
function table(book, heading) {
 const section = book.split(`## ${heading}\n`)[1]?.split('\n## ')[0];
 expect(section, `ORACLE-ACCEPTANCE-RUN missing ${heading}`).toBeDefined();
 return section.split('\n').filter(line=>/^\|/.test(line)).slice(2).map(line=>line.split('|').slice(1,-1).map(cell=>cell.trim().replaceAll('`','')));
}
function goldenAdoptions() {
 const section=read(parentPrd).split('## 54条采用的具体方案与生效判据')[1].split('### 46项冲突')[0];
 return section.split('\n').filter(line=>/^\| .*（主表\d+行）/.test(line)).map(line=>{
  const cells=line.split('|').slice(1,-1).map(s=>s.trim());
  return {key:cells[0].split('（主表')[0],owner:cells[0].match(/；(N\d+) →/)[1],source:cells.at(-1).match(/\]\(([^)]+)\)/)[1]};
 });
}
function n7Valid(row, registered) {
 const [key,source,consumer,status,refs]=row;
 [key,source,consumer,status,refs].forEach(nonempty);
 const registration=refs.split('首消费：')[0],consumption=refs.split('首消费：')[1];nonempty(consumption);
 if(!registered){expect(status).toMatch(/未交付|等待/);expect(consumption).not.toMatch(/pass|已消费/);}
 else {expect(registration).toMatch(/skills\/catalog.yaml/);expect(registration).toMatch(/quality\/(tests|evidence)\/[^\s；]+/);expect(status).not.toMatch(/catalog未补|未登记|等待登记/);expect(consumption).not.toMatch(/pass|已消费/);expect(consumption).toMatch(/unknown|incomplete|尚未取得/);}
}
function costValid(c) {
 expect(c.cost.metrics).toEqual(['stage_count','step_count','required_bytes','human_confirmations']);
 nonempty(c.cost.n1_source);expect(c.cost.n1_source).toMatch(/N1|n1/);
 for(const key of ['start_command','end_command','scope']) nonempty(c.cost.window[key]);
 expect(c.cost.window.complete_required).toBe(true);nonempty(c.cost.original_ref_rule);
 expect(c.cost.original_ref_rule).toMatch(/原|original/);
 expect(c.external_denominators).toEqual({shared_skills:31,adoptions:54,derived_only:42});
}
function listsValid(book) {
 const skills=table(book,'31 共用技能');
 expect(skills.map(row=>row[0]).sort()).toEqual([...sharedSkills].sort());
 for(const row of skills){expect(row.length).toBe(5);row.forEach(nonempty);expect(row[1]).toContain(parentPrd);expect(row[2]).toMatch(/首次验收/);expect(row[3]).toMatch(/触发|合法跳过|未交付/);}
 const expected=goldenAdoptions();expect(expected.length).toBe(54);
 const adoptions=table(book,'54 采用项');expect(adoptions.map(row=>row[0]).sort()).toEqual(expected.map(row=>row.key).sort());
 const catalog=read('skills/catalog.yaml');
 for(const item of expected){const row=adoptions.find(row=>row[0]===item.key);expect(row.length).toBe(5);row.forEach(nonempty);expect(row[1]).toContain(item.source);expect(row[2]).toContain(item.owner);expect(row[2]).toMatch(/首次验收/);expect(row[3]).toMatch(/触发|合法跳过|未交付/);
  if(item.owner==='N7'){const id='n7-'+item.key.replace('.md','');n7Valid(row,catalog.includes('name: '+id+'\n    status: absorbed'));}
 }
}
describe('ORACLE-ACCEPTANCE-RUN T012 cost and adoption evidence boundaries',()=>{
 it('requires complete N1 source window, four metrics, original refs and authoritative denominators',()=>costValid(contract(read(bookPath))));
 it('each route exposes start/end commands and material-byte sources without fabricated costs',()=>{
  for(const task of JSON.parse(read(taskPath)).tasks){for(const field of ['start_command','end_command','material_bytes_source'])nonempty(task.cost_observation[field]);expect(task.cost_observation).not.toHaveProperty('measured_value');}
 });
 it('lists each original shared skill and all 54 authoritative adoptions with source, consumer and first acceptance',()=>listsValid(read(bookPath)));
 it('accepts waiting unregistered N7 and registered incomplete consumption, rejects false missing registration or registration-as-pass',()=>{
  const waiting=['reflect','source','N7 consumer；首次验收','未交付；等待登记','登记：尚未登记 N7 owner；首消费：incomplete'];
  expect(()=>n7Valid(waiting,false)).not.toThrow();
  const registered=[...waiting];registered[3]='未交付；已登记';registered[4]='登记：skills/catalog.yaml:2612；quality/tests/2026-10-18-p6-six-adoptions.md；首消费：incomplete';
  expect(()=>n7Valid(registered,true)).not.toThrow();
  const falseMissing=[...registered];falseMissing[3]='未交付；catalog未补';expect(()=>n7Valid(falseMissing,true)).toThrow();
  const premature=[...registered];premature[4]='登记：skills/catalog.yaml:2612；quality/tests/2026-10-18-p6-six-adoptions.md；首消费：pass 已消费';expect(()=>n7Valid(premature,true)).toThrow();
 });
 it('rejects 15/42 denominators and a missing complete N1 window using the same asset oracle',()=>{
  const c=contract(read(bookPath));
  for(const wrong of [15,42]){const copy=structuredClone(c);copy.external_denominators.adoptions=wrong;expect(()=>costValid(copy)).toThrow();}
  const missing=structuredClone(c);delete missing.cost.window;expect(()=>costValid(missing)).toThrow();
 });
});

// TCR: quality/evidence/2026-10-20-268-p7-assets-findings-tcr.md, findings 266/267 only.
// Append-only: original nine cases and their rules above remain unchanged.
const protectedN8 = {
 roots:['/Users/Hugh/Hugh/Project/workflowhub-n8-four-level-route-20261019','/Users/Hugh/Hugh/Project/workflowhub'],
 common_dir:'/Users/Hugh/Hugh/Project/workflowhub/.git',
 branch:'task/workflowhub/n8-four-level-route-20261019',remote_url:'https://github.com/Hugh4424/workflowhub.git',
};
function isolatedIdentity(identity) {
 for(const field of ['owned_root','repo','workspace','common_dir','branch','remote_url','remote_source']) nonempty(identity[field]);
 for(const field of ['repo','workspace','common_dir','remote_source']) {
  expect(identity[field]).not.toMatch(/unknown|alias|未取得/);
  expect(protectedN8.roots.some(path=>identity[field]===path || identity[field].startsWith(path+'/'))).toBe(false);
  expect(identity[field].startsWith(identity.owned_root+'/')).toBe(true);
 }
 expect(identity.common_dir).not.toBe(protectedN8.common_dir);
 expect(identity.remote_url).not.toBe(protectedN8.remote_url);
 expect(identity.remote_url).not.toMatch(/unknown|alias|github\.com[:/]Hugh4424\/workflowhub/i);
 expect(identity.branch).not.toBe(protectedN8.branch);
 expect(identity.workspace).not.toBe(identity.repo);
}
function isolationValid(book,tasks,readme) {
 const c=contract(book),i=c.creation.isolation;expect(i).toBeDefined();
 for(const flag of ['repository_per_route','workspace_per_route','branch_per_route','remote_per_route','reject_shared_branch','reject_shared_remote'])expect(i[flag]).toBe(true);
 expect(i.protected_roots.sort()).toEqual([...protectedN8.roots].sort());
 expect(i.local_bare_only_proves).toBe('local_git');expect(i.real_pr.requires_authorized_disposable_remote).toBe(true);expect(i.real_pr.missing).toBe('incomplete');
 expect(c.creation.command).toContain('$SYNTH_REPO');expect(c.creation.command).not.toMatch(/N8_WORKTREE|--workspace-root/);
 expect(i.identity_readback.unknown).toBe('STOP');
 for(const field of ['target_realpath','workspace_realpath','common_dir','branch','remote_url','remote_source','compare_protected'])nonempty(i.identity_readback[field]);
 expect(i.route_identities.map(row=>row.route_id).sort()).toEqual(tasks.map(task=>task.id).sort());
 for(const identity of i.route_identities)isolatedIdentity(identity);
 for(const field of ['repo','workspace','common_dir','remote_url','remote_source'])expect(new Set(i.route_identities.map(row=>row[field])).size).toBe(4);
 for(const doc of [book,readme]){
  for(const text of ['git init','--bare','SYNTH_REPO'])expect(doc).toContain(text);gitProbes(doc);
  expect(doc).toMatch(/STOP/);expect(doc).toMatch(/local_git/);expect(doc).toMatch(/真PR/);expect(doc).toMatch(/清理/);
  expect(doc).not.toMatch(/--target-repo=[^\n]*N8_WORKTREE/);
 }
}
function comparisonValid(data) {
 const c=data.comparison;expect(c).toBeDefined();
 for(const field of ['scope_id','shared_requirement','source_ref','environment','commands','budget'])nonempty(c[field]);
 for(const field of ['name','content','source_ref'])nonempty(c.synthetic_input[field]);
 for(const field of ['input','expected_output','command_rule'])nonempty(c.success_oracle.implementation[field]);
 expect(c.success_oracle.planning.no_implementation).toBe(true);expect(c.success_oracle.planning.required_decision_fields.length).toBe(8);
 expect(c.pairs.map(pair=>pair.route_id).sort()).toEqual(data.tasks.map(task=>task.id).sort());
 for(const task of data.tasks)expect(task.comparison_ref).toBe(c.scope_id);
 for(const pair of c.pairs){
  expect(pair.comparable_segment).toBe('direction_to_scope_confirmation');
  for(const side of ['baseline','candidate']){
   const value=pair[side];nonempty(value.source_ref);
   expect(value.request_ref).toBe(c.source_ref);expect(value.input_ref).toBe(c.synthetic_input.source_ref);expect(value.oracle_ref).toBe(pair.oracle_ref);
   expect(value.environment_ref).toBe(c.environment);expect(value.commands_ref).toBe(c.commands);expect(value.budget_ref).toBe(c.budget);
  }
  expect(pair.baseline.variant).toBe('complex');
  expect(pair.candidate.variant).toBe(data.tasks.find(task=>task.id===pair.route_id).level);
  expect(pair.scope_ref).toBe(c.source_ref);expect(pair.input_ref).toBe(c.synthetic_input.source_ref);expect(pair.oracle_ref).toBe(pair.candidate.variant==='planning'?'comparison.success_oracle.planning':'comparison.success_oracle.implementation');
  if(pair.candidate.variant==='planning'){expect(pair.full_outcome_comparable).toBe(false);expect(pair.implementation).not.toBe(true);}
 }
 expect(c.common_segment.partial_only).toBe(true);nonempty(c.common_segment.start_event_rule);nonempty(c.common_segment.end_event_rule);
 expect(c.common_segment).not.toHaveProperty('g1_pass',true);expect(c.common_segment).not.toHaveProperty('full_delivery',true);
 expect(c.full_g1.requires_complete_n1).toBe(true);expect(c.full_g1.planning_vs_implementation).toBe('not_comparable');expect(c.full_g1.missing_result).toBe('inconclusive');
 for(const field of ['task_identity','session_identity','start_ref','end_ref','from_until_ref','all_attempts','error_work'])nonempty(c.run_bindings[field]);
}
describe('ORACLE-ACCEPTANCE-RUN approved TCR isolated and paired execution assets',()=>{
 it('offers independent owned synthetic Git identities with real readback rules and local-only bare coverage',()=>isolationValid(read(bookPath),JSON.parse(read(taskPath)).tasks,read('tests/fixtures/light-route-controlled/README.md')));
 it('rejects protected root/common-dir/branch/remote, alias, unknown, escaped worktree, or missing remote; independent main remains legal',()=>{
  const identities=contract(read(bookPath)).creation.isolation.route_identities;const good=identities[0];
  expect(()=>isolatedIdentity({...good,branch:'main'})).not.toThrow();
  for(const patch of [{repo:protectedN8.roots[0]},{workspace:protectedN8.roots[1]},{common_dir:protectedN8.common_dir},{branch:protectedN8.branch},{remote_url:protectedN8.remote_url},{remote_source:protectedN8.roots[0]},{remote_url:'alias'},{common_dir:'unknown'},{workspace:'/tmp/unowned-worktree'},{remote_url:''}])expect(()=>isolatedIdentity({...good,...patch})).toThrow();
  const c=contract(read(bookPath));c.creation.isolation.local_bare_only_proves='real_pr_pass';expect(()=>isolationValid('```json\n'+JSON.stringify({executable_contract:c})+'\n```',JSON.parse(read(taskPath)).tasks,read('tests/fixtures/light-route-controlled/README.md'))).toThrow();
 });
 it('binds shared request/input/oracle/environment/commands/budget to each baseline and candidate while planning stays partial',()=>comparisonValid(JSON.parse(read(taskPath))));
 it('rejects mismatched request/input/oracle/budget, absent baseline or route, planning implementation and common-segment full-G1 claims',()=>{
  const original=JSON.parse(read(taskPath));
  const mutations=[data=>{delete data.comparison.pairs[0].baseline;},data=>{data.comparison.pairs.pop();},...['request_ref','input_ref','oracle_ref','environment_ref','commands_ref','budget_ref'].map(field=>data=>{data.comparison.pairs[0].candidate[field]='different';}),data=>{data.comparison.pairs.find(pair=>pair.candidate.variant==='planning').implementation=true;},data=>{data.comparison.common_segment.partial_only=false;},data=>{data.comparison.common_segment.g1_pass=true;},data=>{data.comparison.full_g1.requires_complete_n1=false;}];
  for(const mutate of mutations){const data=structuredClone(original);mutate(data);expect(()=>comparisonValid(data)).toThrow();}
 });
});

// TCR: quality/evidence/2026-10-20-271-p7-stage-cost-finding-tcr.md.
function stageCostValid(task) {
 const cost=task.cost_observation,b=cost.ledger_boundary;
 expect(b.stage_filter_last).toBe(false);expect(b.first_record).toMatch(/真实.*task.start.*--start-ref/);
 expect(b.subsequent_records).toMatch(/继承.*上一.*until/);expect(b.subsequent_records).toMatch(/不传.*start-ref/);
 expect(cost.stage_windows.map(window=>window.stage)).toEqual(task.expected_calls.stages);
 for(const [index,window]of cost.stage_windows.entries()){
  for(const field of ['start_event_ref_rule','ledger_row_refs_rule','from_until_rule'])nonempty(window[field]);
  expect(window.record_command).toContain('tools/cli/measure-main-agent-cost.mjs');
  const stages=[...window.record_command.matchAll(/--stage=([^\s"']+)/g)].map(match=>match[1]);expect(stages).toEqual([window.stage]);
  expect(window.record_command).toMatch(/(?:^|\s)--record(?:\s|$)/);
  expect(window.record_command).not.toMatch(/--from=|--until=/);
  if(index>0){expect(window.record_command).not.toContain('--start-ref');expect(window.start_event_ref_rule).toMatch(/继承/);expect(window.from_until_rule).toMatch(/上一.*until/);}
  expect(window.ledger_row_refs_rule).toMatch(/main-agent-cost\.md/);expect(window.ledger_row_refs_rule).toMatch(/全部.*尝试|全部.*行/);
  expect(window.ledger_row_refs_rule).toMatch(/重做.*多行|多行.*重做/);
  expect(window.ledger_row_refs_rule).not.toMatch(/恰四行|只保四行|只.*最后成功/);
  expect(window.from_until_rule).toMatch(/连续/);expect(window.from_until_rule).not.toMatch(/独立新用户|重叠旧起点/);
 }
 for(const field of ['all_stage_rows','all_attempts','error_work','shared_overhead','common_segment_is_partial'])expect(cost.total_accounting[field]).toBe(true);
 expect(cost.total_accounting.missing_result).toBe('incomplete');
}
describe('ORACLE-ACCEPTANCE-RUN approved TCR task-ledger stage cost windows',()=>{
 it('describes every route stage and all repeated attempts on one continuous task ledger',()=>{for(const task of JSON.parse(read(taskPath)).tasks)stageCostValid(task);});
 it('rejects missing/repeated/reordered stages, wrong stage commands, missing record, per-stage reset and excluded failed costs',()=>{
  const complex=JSON.parse(read(taskPath)).tasks.find(task=>task.level==='complex');
  const mutations=[task=>task.cost_observation.stage_windows.pop(),task=>task.cost_observation.stage_windows.push(structuredClone(task.cost_observation.stage_windows[0])),task=>task.cost_observation.stage_windows.reverse(),task=>{task.cost_observation.stage_windows[1].record_command='node tools/cli/measure-main-agent-cost.mjs --stage=make-decision --record';},task=>{task.cost_observation.stage_windows[1].record_command=task.cost_observation.stage_windows[1].record_command.replace('--record','');},task=>{task.cost_observation.stage_windows[1].record_command+=' --start-ref=<new-user-event>';},task=>{task.cost_observation.stage_windows[1].from_until_rule='独立新用户event';},task=>{task.cost_observation.stage_windows[1].ledger_row_refs_rule='main-agent-cost.md只保四行';},task=>{task.cost_observation.total_accounting.error_work=false;},task=>{task.cost_observation.total_accounting.shared_overhead=false;},task=>{task.cost_observation.total_accounting.common_segment_is_partial=false;}];
  for(const mutate of mutations){const task=structuredClone(complex);mutate(task);expect(()=>stageCostValid(task)).toThrow();}
  const retry=structuredClone(complex);for(const row of retry.cost_observation.stage_windows)row.ledger_row_refs_rule='main-agent-cost.md全部尝试，包括同stage重做多行与失败恢复行';expect(()=>stageCostValid(retry)).not.toThrow();
 });
});

// TCR 279: narrow Git probe recognition; fixed-token RED preserved in 069-p7-probe-helper-red.output.
function gitProbes(doc) {
 // Deliberately a finite argv grammar, not a shell interpreter. No command executes.
 const blocks=[...doc.matchAll(/```(?:sh|bash|shell)\s*\n([\s\S]*?)\n```/g)].map(match=>match[1].split('\n'));
 for(const match of doc.matchAll(/```json\s*\n([\s\S]*?)\n```/g)){
  const commands=JSON.parse(match[1]).executable_contract?.creation?.probe_commands;
  if(commands!==undefined){expect(Array.isArray(commands)).toBe(true);commands.forEach(nonempty);blocks.push(commands);}
 }
 const found=new Set();
 const target=value=>value==='$SYNTH_REPO'?'repo':value==='$RETURNED_WORKSPACE'?'workspace':null;
 const words=line=>{
  const result=[];let rest=line.trim();
  while(rest){const match=rest.match(/^(?:"([^"\n]*)"|'([^'\n]*)'|([^\s"'`;|&<>]+))(?:\s+|$)/);if(!match)return null;result.push(match[1]??match[2]??match[3]);rest=rest.slice(match[0].length);}
  return result;
 };
 for(const lines of blocks){let cwd=null;
  for(const line of lines){const argv=words(line);if(!argv?.length)continue;
   if(argv[0]==='cd'){cwd=argv.length===2?target(argv[1]):null;continue;}
   if(argv[0]!=='git')continue;
   let scope=cwd,at=1;if(argv[at]==='-C'){scope=target(argv[at+1]);at+=2;}
   if(!scope)continue;const command=argv.slice(at).join(' ');
   if(scope==='repo'&&command==='rev-parse --show-toplevel')found.add('repo-top');
   if(scope==='workspace'&&command==='rev-parse --path-format=absolute --git-common-dir')found.add('workspace-common');
   if(scope==='workspace'&&command==='branch --show-current')found.add('workspace-branch');
   if(scope==='workspace'&&command==='remote get-url --all origin')found.add('workspace-remote');
  }
 }
 expect([...found].sort(),'ORACLE-ACCEPTANCE-RUN concrete owned Git identity readbacks').toEqual(['repo-top','workspace-branch','workspace-common','workspace-remote']);
}
const gitProbeFixture = target => '```sh\n'+[
 'git -C '+target('SYNTH_REPO')+' rev-parse --show-toplevel',
 'git -C '+target('RETURNED_WORKSPACE')+' rev-parse --path-format=absolute --git-common-dir',
 'git -C '+target('RETURNED_WORKSPACE')+' branch --show-current',
 'git -C '+target('RETURNED_WORKSPACE')+' remote get-url --all origin',
].join('\n')+'\n```';
describe('ORACLE-ACCEPTANCE-RUN TCR279 concrete Git identity probe grammar',()=>{
 it('accepts quoted/unquoted bound -C targets and explicit bound cwd without executing them',()=>{
  for(const target of [name=>'"$'+name+'"',name=>'$'+name])expect(()=>gitProbes(gitProbeFixture(target))).not.toThrow();
  const cwd='```sh\ncd "$SYNTH_REPO"\ngit rev-parse --show-toplevel\ncd "$RETURNED_WORKSPACE"\ngit rev-parse --path-format=absolute --git-common-dir\ngit branch --show-current\ngit remote get-url --all origin\n```';expect(()=>gitProbes(cwd)).not.toThrow();
 });
 it('rejects missing/readback-substituted probes, comments/echo, protected/unknown/unrelated targets and crossed identities',()=>{
  const good=gitProbeFixture(name=>'"$'+name+'"');
  for(const fragment of ['rev-parse --path-format=absolute --git-common-dir','branch --show-current','remote get-url --all origin']){
   const missing=good.split('\n').filter(line=>!line.includes(fragment)).join('\n');expect(()=>gitProbes(missing)).toThrow();
  }
  const bad=[good.replace('remote get-url --all origin','remote add origin /tmp/other'),good.replace('remote get-url --all origin','remote'),good.replaceAll('$RETURNED_WORKSPACE','$SYNTH_REPO'),good.replaceAll('$SYNTH_REPO','$RETURNED_WORKSPACE'),...['$N8_WORKTREE','$UNKNOWN','/tmp/other','/Users/Hugh/Hugh/Project/workflowhub'].map(target=>good.replaceAll('$RETURNED_WORKSPACE',target)),good.split('\n').map(line=>line.startsWith('git')?'# '+line:line).join('\n'),good.split('\n').map(line=>line.startsWith('git')?'echo "'+line.replaceAll('"','')+'"':line).join('\n'),'```sh\ngit rev-parse --show-toplevel\ngit rev-parse --path-format=absolute --git-common-dir\ngit branch --show-current\ngit remote get-url --all origin\n```'];
  for(const doc of bad)expect(()=>gitProbes(doc)).toThrow();
 });
});
