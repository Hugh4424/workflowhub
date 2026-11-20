// ORACLE-COCKPIT-EVENT: P5/T007. Same independent oracle; controlled open is a process boundary substitute.
import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, realpathSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, chmodSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { createTask } from '../../runtime/task/task-handle.mjs';
import * as renderer from '../../skills/answer-as-page/scripts/render-answer-page.mjs';
const roots=[];
afterEach(()=>{for(const root of roots.splice(0))rmSync(root,{recursive:true,force:true});});
async function fixture(){
 const root=realpathSync(mkdtempSync(join(tmpdir(),'cockpit-gen-')));roots.push(root);
 const repo=join(root,'repo'),work=join(root,'work');mkdirSync(repo);
 const git=(cwd,args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 git(repo,['init','-q','-b','main']);git(repo,['config','user.name','Cockpit Test']);git(repo,['config','user.email','test@example.invalid']);writeFileSync(join(repo,'base.txt'),'baseline');git(repo,['add','.']);git(repo,['commit','-qm','baseline']);const base=git(repo,['rev-parse','HEAD']);git(repo,['worktree','add','-qb','test-cockpit',work]);
 mkdirSync(join(root,'store'));
 const task=await createTask({storageRoot:join(root,'store'),manifest:{schema_version:'1.0.0',project_name:'Demo',task_id:'cockpit',created_at:'2026-10-27T00:00:00Z',target_repo_root:repo,workspace_mode:'existing',workspace_root:work,baseline_commit:base,activation_cohort:'post',execution_mode:'per_invocation',record_model:'vnext-single-write',issue_ids:[],inputs:{}}});
 writeFileSync(join(task.taskPath,'facts.jsonl'),'');
 const material=join(work,'specs/cockpit');mkdirSync(join(material,'phases'),{recursive:true});
 writeFileSync(join(material,'decision-log.md'),'# 当前决策\n## 目标\n让失败可见\n- U-001 用户要求保留真实失败\n## WP1\n只读页面\n');
 writeFileSync(join(material,'spec.md'),"# \u771f\u5b9e\u9a7e\u9a76\u8231\n\n## \u529f\u80fd\u9700\u6c42\n\n- **FR-EVENT-001**\uff1a\u53ea\u8bfb\u751f\u6210\u3002\n\n## \u5b9e\u73b0\u8bbe\u8ba1\uff08\u5168\u5c40\u6743\u5a01\uff09\n\n### \u4ee3\u7801\u951a\u70b9\n\n`phases/P7-\u771f\u5b9e\u4ea4\u4ed8.md`: task source; `owned.mjs`: symbol result.\n\n### \u63a5\u53e3\u4e0e\u5931\u8d25\u8bed\u4e49\n\n\u53ea\u8bfb\u9875\u9762\uff1b\u7f3a\u6570\u636e\u4fdd\u6301\u7f3a\u3002\n\n### \u9700\u6c42\u5230\u4efb\u52a1\u8ffd\u8e2a\n\n| Source | FR | AC | Phase/Task | oracle |\n| --- | --- | --- | --- | --- |\n| R-001 | FR-EVENT-001 | AC-EVENT-001 | P1/T001 | ORACLE-EVENT |\n\n### \u5168\u5c40\u9a8c\u8bc1\u7b56\u7565\n\n`node --version` \u53d7\u63a7\u547d\u4ee4\u3002\n\n## Appendix A \u2014 \u9a8c\u6536\u5224\u636e\n\n- [ ] **AC-EVENT-001**\uff1a\u7f3a\u6570\u636e\u6807\u7f3a\n\n## \u98ce\u9669\n\n\u98ce\u9669\uff1a\u7f3a\u5c11\u539f\u4ef6\n");
 writeFileSync(join(material,'phases/index.md'),"# Index\n\n## Execution Index\n\n| \u9636\u6bb5 | \u6743\u5a01\u5f15\u7528 | \u8bed\u4e49\u951a\u70b9 | \u5199\u5165\u96c6 | \u4f9d\u8d56 | \u6d88\u8d39\u8005 |\n| --- | --- | --- | --- | --- | --- |\n| `P1` | `phases/P1-\u771f\u5b9e\u4ea4\u4ed8.md` | L0 \u2014 \u6765\u6e90\u5361\u7247 | `owned.mjs` | none | reader |\n");writeFileSync(join(material,'phases/P1-真实交付.md'),"# Phase P1 \u2014 \u6765\u6e90\u5361\u7247\n\n- **\u5168\u5c40\u89c4\u683c**: `spec.md#\u5b9e\u73b0\u8bbe\u8ba1\uff08\u5168\u5c40\u6743\u5a01\uff09`\n- **\u5199\u5165\u96c6**: `owned.mjs`\n- **\u4f9d\u8d56**: none\n- **\u6d88\u8d39\u8005**: reader\n- **gate_cmd**: `node --version`\n- **oracle**: ORACLE-EVENT\n- **evidence_path**: `quality/tests/cards.output`\n- **STOP**: \u4fdd\u7559\u7f3a\u5931\u8f93\u5165\u548c\u5931\u8d25\u539f\u4ef6\u3002\n- **Done**: \u771f\u5b9e\u5361\u6765\u6e90\u4e0e\u771f\u5b9e\u6267\u884c\u7ed3\u679c\u3002\n\n## L0 \u2014 \u6765\u6e90\u5361\u7247\n\nFR-EVENT-001 / AC-EVENT-001\n\n## L1 \u2014 executable contract\n\n### T001 \u2014 \u771f\u5b9e\u4ea4\u4ed8\n\n\u672c\u5361\u4ea4\u4ed8\u771f\u5b9e\u7ed3\u679c\uff0c\u5931\u8d25\u4fdd\u7559\u539f\u59cb\u9519\u8bef\u3002\n\n- **Source / FR / AC**: R-001 / FR-EVENT-001 / AC-EVENT-001\n- **Files / symbols**: `owned.mjs`; symbol: result\n- **Action**: 1\uff09\u8bfb\u53d6\u771f\u5b9e\u5931\u8d25\u539f\u4ef6\u30022\uff09\u6838\u5bf9\u6765\u6e90\u6307\u9488\u3002\n- **Inputs**: Owned local module and fixed source text.\n- **Outputs / failure**: Result is 1; wrong result is nonzero.\n- **Boundary / DO NOT TOUCH**: Other materials stay readonly.\n- **Dependency**: none\n- **Test tier / skill**: contract / backend-testing\n- **Scenario / fixture or service**: Local temporary fixture; no network.\n- **RED/GREEN gate_cmd**: `node --version`\n- **expected_exit**: RED nonzero; GREEN 0\n- **RED target failure**: ORACLE-EVENT expected result 1; result 0 assertion fails.\n- **GREEN oracle**: ORACLE-EVENT actual result is 1.\n- **Evidence**: Actual output and exit; no prefilled pass.\n- **STOP / recovery**: Preserve failure and return to original developer.\n- **Coverage limit**: Local event fixture only.\n- **Done**: AC-EVENT-001 has actual result and evidence.\n\n## L2 \u2014 reference\n\nControlled.\n");
 writeFileSync(join(work,'changed.txt'),'real diff');git(work,['add','.']);git(work,['commit','-qm','real change']);
 await task.appendRecord({dir:'quality/tests',slug:'actual-test',ext:'json',bytes:JSON.stringify({argv:['node','test'],exit_code:0})});await task.appendRecord({dir:'quality/reviews',slug:'actual-review',ext:'json',bytes:JSON.stringify({status:'completed',findings:[]})});
 const reportPath=join(root,'report.json');writeFileSync(reportPath,JSON.stringify({task_id:'cockpit',rings:Array.from({length:10},(_,i)=>({ring:i+1,name:['原始需求','decision-log','调研方案','方案','spec','phase','代码实现','测试验证','最终审查','提交 PR'][i],state:i===9?'skipped':'incomplete',basis:[],applicability:'required',evidence_type:[],counted_in_denominator:true,conflict:null}))}));
 return {taskPath:task.taskPath,reportPath,outDir:join(task.taskPath,'quality/evidence/pages'),htmlName:'cockpit.html',material};
}
// The current decision-log shape: package directory table plus per-package cards.
async function packageFixture({misbound=false}={}){
 const f=await fixture();
 const indexRef='quality/evidence/decision-log-refs/requirement-index.md';
 const indexPath=join(f.taskPath,indexRef);mkdirSync(join(indexPath,'..'),{recursive:true});
 writeFileSync(indexPath,'# 需求索引\n\n## 0. 十包定稿\n\n| 包 | 名称 | 依赖 | 覆盖需求 | 主 AC | 来源 |\n| --- | --- | --- | --- | --- | --- |\n| 1 | 包甲 | 无 | 1 | AC-P1-1 | `DL §4.1` |\n| 2 | 包乙 | 1 | 2 | AC-P2-1 | `DL §4.2` |\n');
 writeFileSync(join(f.material,'decision-log.md'),`# 当前决策\n需求索引：\`${indexRef}\`\n\n| AC | 包 | 命令或人工操作 |\n| --- | --- | --- |\n| AC-P1-1 | 1 | \`node --version\` |\n| AC-P2-1 | 2 | \`node --version\` |\n\n## 4. 每包设计\n\n### 4.1 包甲\n\n- **原始需求**：真实失败要可见。\n- **最终决定**：保留真实失败。\n- **完整方案**：只读来源卡片，不写任务事实。\n- **配套与影响**：只读。\n- **验收**：AC-P1-1 可核。\n- **风险/回退**：无。\n\n### 4.2 包乙\n\n- **原始需求**：恢复要换路。\n- **最终决定**：没有新事实就换路。\n- **完整方案**：只读说明。\n- **配套与影响**：只读。\n- **验收**：${misbound?'AC-P1-1 可核':'AC-P2-1 可核'}。\n- **风险/回退**：无。\n`);
 writeFileSync(join(f.material,'spec.md'),"# \u771f\u5b9e\u9a7e\u9a76\u8231\n\n## \u529f\u80fd\u9700\u6c42\n\n- **FR-ONE-001**\uff1a\u53ea\u8bfb\u751f\u6210\u3002\n\n## \u5b9e\u73b0\u8bbe\u8ba1\uff08\u5168\u5c40\u6743\u5a01\uff09\n\n### \u4ee3\u7801\u951a\u70b9\n\n`phases/P1-\u771f\u5b9e\u4ea4\u4ed8.md`: task source; `owned.mjs`: symbol result.\n\n### \u63a5\u53e3\u4e0e\u5931\u8d25\u8bed\u4e49\n\n\u53ea\u8bfb\u6765\u6e90\u5361\u7247\uff1b\u7f3a\u5931\u4fdd\u6301 gap\uff0c\u4e0d\u8865\u8bcd\u3002\n\n### \u9700\u6c42\u5230\u4efb\u52a1\u8ffd\u8e2a\n\n| Source | FR | AC | Phase/Task | oracle |\n| --- | --- | --- | --- | --- |\n| R-001 | FR-ONE-001 | AC-P1-001 | P1/T001 | ORACLE-PROGRESS |\n| R-001 | FR-ONE-001 | AC-P2-001 | P1/T001 | ORACLE-PROGRESS |\n\n### \u5168\u5c40\u9a8c\u8bc1\u7b56\u7565\n\n`node --version` \u53d7\u63a7\u547d\u4ee4\uff1b\u9875\u9762\u6a21\u578b\u65ad\u8a00\u3002\n\n## Appendix A \u2014 \u9a8c\u6536\u5224\u636e\n\n- [ ] **AC-P1-001** \u771f\u5b9e\u5931\u8d25\u53ef\u89c1\u3002\n\u5224\u5b9a\u65b9\u5f0f\uff1a\u673a\u5668\u53ef\u5224\u3002\n\u6210\u672c\uff1aevidence_tier=\u547d\u4ee4\u7ea7\u3002\n- [ ] **AC-P2-001** \u6062\u590d\u8981\u6362\u8def\u3002\n\u5224\u5b9a\u65b9\u5f0f\uff1a\u673a\u5668\u53ef\u5224\u3002\n\u6210\u672c\uff1aevidence_tier=\u771f\u5b9e\u73af\u5883\u7ea7\u3002\n\n## Appendix B \u2014 \u9700\u6c42\u4e0e\u7f16\u53f7\u5bf9\u7167\n\n| \u9a8c\u6536 | \u7f16\u53f7 | \u539f\u65e5\u5fd7 |\n| --- | --- | --- |\n| \u9a8c\u6536 1 | AC-P1-001 | \u539f\u65e5\u5fd7 AC-P1-1\uff5c\u9636\u6bb5 1\uff5cFR-ONE-001 |\n| \u9a8c\u6536 2 | AC-P2-001 | \u539f\u65e5\u5fd7 AC-P2-1\uff5c\u9636\u6bb5 2\uff5cFR-ONE-001 |\n\n## \u98ce\u9669\n\n\u98ce\u9669\uff1a\u7f3a\u5c11\u539f\u4ef6\n");
 writeFileSync(join(f.material,'phases/index.md'),'# Index\n\n## Execution Index\n\n| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |\n| --- | --- | --- | --- | --- | --- |\n| `P1` | `phases/P1-真实交付.md` | L0 — 来源卡片 | `owned.mjs` | none | reader |\n');
 writeFileSync(join(f.material,'phases/P1-真实交付.md'),"# Phase P1 \u2014 \u6765\u6e90\u5361\u7247\n\n- **\u5168\u5c40\u89c4\u683c**: `spec.md#\u5b9e\u73b0\u8bbe\u8ba1\uff08\u5168\u5c40\u6743\u5a01\uff09`\n- **\u5199\u5165\u96c6**: `owned.mjs`\n- **\u4f9d\u8d56**: none\n- **\u6d88\u8d39\u8005**: reader\n- **gate_cmd**: `node --version`\n- **oracle**: ORACLE-PROGRESS\n- **evidence_path**: `quality/tests/cards.output`\n- **STOP**: \u4fdd\u7559\u7f3a\u5931\u8f93\u5165\u548c\u5931\u8d25\u539f\u4ef6\u3002\n- **Done**: \u771f\u5b9e\u5361\u6765\u6e90\u4e0e\u771f\u5b9e\u6267\u884c\u7ed3\u679c\u3002\n\n## L0 \u2014 \u6765\u6e90\u5361\u7247\n\nFR-ONE-001 / AC-P1-001 / AC-P2-001\n\n## L1 \u2014 executable contract\n\n### T001 \u2014 \u771f\u5b9e\u4ea4\u4ed8\n\n\u672c\u5361\u4ea4\u4ed8\u771f\u5b9e\u7ed3\u679c\uff0c\u5931\u8d25\u4fdd\u7559\u539f\u59cb\u9519\u8bef\u3002\n\n- **Source / FR / AC**: R-001 / FR-ONE-001 / AC-P1-001 / AC-P2-001\n- **Files / symbols**: `owned.mjs`; symbol: result\n- **Action**: 1\uff09\u8bfb\u53d6\u771f\u5b9e\u5931\u8d25\u539f\u4ef6\u30022\uff09\u6838\u5bf9\u6765\u6e90\u6307\u9488\u3002\n- **Inputs**: Owned local module and fixed source text.\n- **Outputs / failure**: Result is 1; wrong result is nonzero.\n- **Boundary / DO NOT TOUCH**: Other materials stay readonly.\n- **Dependency**: none\n- **Test tier / skill**: contract / backend-testing\n- **Scenario / fixture or service**: Local temporary fixture; no network.\n- **RED/GREEN gate_cmd**: `node --version`\n- **expected_exit**: RED nonzero; GREEN 0\n- **RED target failure**: ORACLE-PROGRESS expected result 1; result 0 assertion fails.\n- **GREEN oracle**: ORACLE-PROGRESS actual result is 1.\n- **Evidence**: Actual output and exit; no prefilled pass.\n- **STOP / recovery**: Preserve failure and return to original developer.\n- **Coverage limit**: Local package fixture only.\n- **Done**: AC-P1-001\u3001AC-P2-001 have actual result and evidence.\n\n## L2 \u2014 reference\n\nControlled.\n");
 return f;
}
const data=path=>JSON.parse(/const DATA = (\{[\s\S]*?\n?\});/.exec(readFileSync(path,'utf8'))[1]);
test('ORACLE-COCKPIT-EVENT: six events use one entry; first/change opens, identical skips, errors remain visible',async()=>{
 const f=await fixture();expect(typeof renderer.refreshAnswerPage,'event entry must exist').toBe('function');let opened=0;const open=async path=>{expect(existsSync(path)).toBe(true);opened++;return true;};
 const issueLabels=Array.from({length:23},(_,i)=>`未决 ${i+1}`),decisionPath=join(f.material,'decision-log.md');
 writeFileSync(decisionPath,readFileSync(decisionPath,'utf8')+'\n## 还有什么没定，谁来定？\n| 未决 | 问题与来源 | 状态与处置 | 下一步 |\n| --- | --- | --- | --- |\n'+issueLabels.map(label=>`| ${label} | 来源未取得 | unknown；保留缺口 | 原owner补证 |`).join('\n')+'\n');
 const originalFacts=readFileSync(join(f.taskPath,'facts.jsonl'));
 const first=await renderer.refreshAnswerPage({...f,event:'skeleton-confirmed',open});expect(first.opened).toBe(true);expect(first.changed).toBe(true);expect(opened).toBe(1);
 const shown=data(first.htmlPath),missing=shown.objects.filter(o=>o.kind==='risk'&&o.src.some(s=>s.path===decisionPath));
 expect(missing.map(o=>o.source_id)).toEqual(issueLabels);
 expect(new Set(shown.objects.map(o=>o.id)).size).toBe(shown.objects.length);
 for(const o of missing){expect(o.id).toMatch(/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/);expect(o.title).toBe(`缺：${o.source_id} 的 OI 编号映射`);expect(o.status).toEqual({text:'缺',tone:'unk'});expect(o.src[0].loc).toBe(o.source_id);}
 expect(shown.rings).toEqual(JSON.parse(readFileSync(f.reportPath)).rings);
 expect(readFileSync(join(f.taskPath,'facts.jsonl'))).toEqual(originalFacts);
 const same=await renderer.refreshAnswerPage({...f,event:'package-converged',open});expect(same.changed).toBe(false);expect(same.opened).toBe(false);expect(same.open_reason).toBe('无实质变化');expect(opened).toBe(1);
 writeFileSync(join(f.material,'decision-log.md'),'# 目标\n- U-003 实质变化\n');const changed=await renderer.refreshAnswerPage({...f,event:'direction-scope-acceptance-changed',open});expect(changed.changed).toBe(true);expect(opened).toBe(2);
 writeFileSync(join(f.material,'decision-log.md'),'# 目标\n- U-004 第二次实变\n');const facts=readFileSync(join(f.taskPath,'facts.jsonl'));const failed=await renderer.refreshAnswerPage({...f,event:'phase-closed',open:()=>{throw Error('controlled open denied');}});expect(failed.opened).toBe(false);expect(failed.open_reason).toContain('未自动打开: controlled open denied');expect(existsSync(failed.htmlPath)).toBe(true);expect(readFileSync(join(f.taskPath,'facts.jsonl'))).toEqual(facts);
 const end=await renderer.refreshAnswerPage({...f,event:'build-code-ended',open});expect(data(end.htmlPath).rings.find(r=>r.ring===10).state).toBe('skipped');
 const report=JSON.parse(readFileSync(f.reportPath));report.rings[9].state='completed';writeFileSync(f.reportPath,JSON.stringify(report));const closed=await renderer.refreshAnswerPage({...f,event:'stage-closed',open});expect(data(closed.htmlPath).rings[9].state).toBe('completed');expect(closed.event).toBe('stage-closed');
 await expect(renderer.refreshAnswerPage({...f,event:'unknown',open})).rejects.toThrow(/支持|supported/);
});
test('ORACLE-COCKPIT-EVENT: missing comparison baseline opens honestly and build-code cannot complete ring10',async()=>{
 const f=await fixture();expect(typeof renderer.refreshAnswerPage).toBe('function');const first=await renderer.refreshAnswerPage({...f,event:'phase-closed',open:async()=>true});rmSync(first.nodesPath);const next=await renderer.refreshAnswerPage({...f,event:'phase-closed',open:async()=>true});expect(next.opened).toBe(true);expect(next.open_reason).toContain('比较基准缺失');const corrupt=JSON.parse(readFileSync(next.nodesPath));corrupt.nodes[0].content_digest='wrong-sidecar-digest';writeFileSync(next.nodesPath,JSON.stringify(corrupt));const inconsistent=await renderer.refreshAnswerPage({...f,event:'phase-closed',open:async()=>true});expect(inconsistent.open_reason).toContain('比较基准缺失');
 const report=JSON.parse(readFileSync(f.reportPath));report.rings[9].state='completed';writeFileSync(f.reportPath,JSON.stringify(report));await expect(renderer.refreshAnswerPage({...f,event:'build-code-ended',open:async()=>true})).rejects.toThrow(/10|skipped/);
});
test('ORACLE-COCKPIT-EVENT: system open uses argument arrays and real process errors',async()=>{
 const modulePath=join(import.meta.dirname,'../../skills/answer-as-page/scripts/open-page.mjs');expect(existsSync(modulePath),'system opener capability must exist').toBe(true);const {systemOpenCommand,openInSystemBrowser}=await import(modulePath);
 expect(systemOpenCommand('darwin','/a b;quoted.html')).toEqual({command:'open',args:['/a b;quoted.html']});expect(systemOpenCommand('win32','C:/a b.html')).toEqual({command:'cmd',args:['/d','/v:off','/s','/c','start "" "%WH_PAGE_TARGET%"']});expect(systemOpenCommand('linux','/a b.html')).toEqual({command:'xdg-open',args:['/a b.html']});
 const f=await fixture();await expect(openInSystemBrowser(f.reportPath,{run:()=>({status:7,stderr:'real process failure'})})).rejects.toThrow(/7|real process failure/);expect(await openInSystemBrowser(f.reportPath,{run:(_command,args,opts)=>{expect(args.at(-1)).toBe(f.reportPath);expect(opts.shell).toBe(false);return {status:0};}})).toBe(true);await expect(openInSystemBrowser(f.outDir)).rejects.toThrow();
});
test('ORACLE-COCKPIT-EVENT: report generation time or immutable reference drift alone does not reopen',async()=>{
 const f=await fixture();expect(typeof renderer.refreshAnswerPage).toBe('function');let count=0;const open=async()=>{count++;return true;};await renderer.refreshAnswerPage({...f,event:'phase-closed',open});const report=JSON.parse(readFileSync(f.reportPath));report.generated_at='2026-10-27T01:00:00Z';const newReport=join(f.taskPath,'report-second.json');writeFileSync(newReport,JSON.stringify(report,null,2));const next=await renderer.refreshAnswerPage({...f,reportPath:newReport,event:'phase-closed',open});expect(next.changed).toBe(false);expect(count).toBe(1);
});
test('ORACLE-COCKPIT-EVENT: Windows legal metacharacter paths travel only in a private environment value',async()=>{
 const {openInSystemBrowser}=await import('../../skills/answer-as-page/scripts/open-page.mjs');
 const directory=realpathSync(mkdtempSync(join(tmpdir(),'cockpit-win-boundary-')));roots.push(directory);
 const target=join(directory,'a&whoami&%PATH%!bang^中文 空格.html');writeFileSync(target,'<!doctype html>');
 const saved=Object.entries(process.env).filter(([key])=>key.toUpperCase()==='WH_PAGE_TARGET');
 process.env.wh_page_target='inherited-lowercase-poison';process.env.WH_PAGE_TARGET='inherited-uppercase-poison';
 try {
  expect(await openInSystemBrowser(target,{platform:'win32',run:(command,args,options)=>{
   expect(command).toBe('cmd');expect(args).toEqual(['/d','/v:off','/s','/c','start "" "%WH_PAGE_TARGET%"']);
   expect(args.some(arg=>arg.includes(target))).toBe(false);expect(options.shell).toBe(false);expect(options.windowsVerbatimArguments).toBe(true);
   expect(options.env.WH_PAGE_TARGET).toBe(target);expect(Object.keys(options.env).filter(key=>key.toUpperCase()==='WH_PAGE_TARGET')).toEqual(['WH_PAGE_TARGET']);return {status:0};
  }})).toBe(true);
  await expect(openInSystemBrowser(target,{platform:'win32',run:()=>({status:9,stderr:'controlled Windows process failure'})})).rejects.toThrow(/exit=9.*controlled Windows process failure/);
 } finally { for(const key of Object.keys(process.env))if(key.toUpperCase()==='WH_PAGE_TARGET')delete process.env[key];for(const [key,value] of saved)process.env[key]=value; }
});

test('ORACLE-COCKPIT-EVENT: stage-closed rejects a missing or skipped ring10 before replacing the old pair',async()=>{
 const f=await fixture();let opened=0;const open=async()=>{opened++;return true;};const initial=await renderer.refreshAnswerPage({...f,event:'phase-closed',open}),html=readFileSync(initial.htmlPath),nodes=readFileSync(initial.nodesPath),report=JSON.parse(readFileSync(f.reportPath));for(const rings of [report.rings.filter(r=>r.ring!==10),report.rings]){writeFileSync(f.reportPath,JSON.stringify({...report,rings}));await expect(renderer.refreshAnswerPage({...f,event:'stage-closed',open})).rejects.toThrow(/stage-closed.*10|10.*stage-closed/);expect(opened).toBe(1);expect(readFileSync(initial.htmlPath)).toEqual(html);expect(readFileSync(initial.nodesPath)).toEqual(nodes);}report.rings[9].state='incomplete';writeFileSync(f.reportPath,JSON.stringify(report));const result=await renderer.refreshAnswerPage({...f,event:'stage-closed',open});expect(data(result.htmlPath).rings[9].state).toBe('incomplete');
});
test('ORACLE-COCKPIT-EVENT: actual CLI routes --event to the process opener and skips an identical repeat',async()=>{
 const f=await fixture(),bin=join(f.outDir,'fake-bin');mkdirSync(bin,{recursive:true});const log=join(f.outDir,'cli-open.log'),binary=join(bin,process.platform==='darwin'?'open':'xdg-open');writeFileSync(binary,'#!/bin/sh\nprintf "%s\\n" "$1" >> "$COCKPIT_CLI_OPEN_LOG"\nexit 0\n');chmodSync(binary,0o700);const hostPreload=join(bin,'owned-browser-host.cjs');writeFileSync(hostPreload,"Object.defineProperty(process,'platform',{value:'darwin'});");writeFileSync(join(bin,'osascript'),'#!/usr/bin/env node\nconst path=process.env.WH_PAGE_TARGET;if(!path)throw Error("task target missing");require("node:fs").appendFileSync(process.env.COCKPIT_CLI_OPEN_LOG,path+"\\n");console.log(JSON.stringify({opened:true,action:"opened",browser:"controlled process substitute",url:process.env.WH_PAGE_URL}));\n');chmodSync(join(bin,'osascript'),0o700);const entry=join(import.meta.dirname,'../../skills/answer-as-page/scripts/render-answer-page.mjs');const argv=['--require',hostPreload,entry,'--task-path',f.taskPath,'--report',f.reportPath,'--out-dir',f.outDir,'--html',f.htmlName,'--event','phase-closed'];const options={encoding:'utf8',env:{...process.env,PATH:bin+':'+process.env.PATH,COCKPIT_CLI_OPEN_LOG:log}};const first=spawnSync(process.execPath,argv,options);expect(first.status,first.stderr).toBe(0);const result=JSON.parse(first.stdout);expect(result.event).toBe('phase-closed');expect(result.changed).toBe(true);expect(result.opened).toBe(true);expect(existsSync(result.htmlPath)).toBe(true);expect(readFileSync(log,'utf8')).toBe(result.htmlPath+'\n');const repeated=spawnSync(process.execPath,argv,options);expect(repeated.status,repeated.stderr).toBe(0);expect(JSON.parse(repeated.stdout)).toMatchObject({event:'phase-closed',changed:false,opened:false,open_reason:'无实质变化'});expect(readFileSync(log,'utf8')).toBe(result.htmlPath+'\n');const invalid=spawnSync(process.execPath,[...argv.slice(0,-1),'unknown'],options);expect(invalid.status).not.toBe(0);
});
test('ORACLE-COCKPIT-EVENT correction: identified task tab uses verifiable refresh and never blind system-open fallback',async()=>{
 const f=await fixture(),target=join(f.outDir,'portable.html');mkdirSync(f.outDir,{recursive:true});writeFileSync(target,'<!doctype html>');const {openInSystemBrowser}=await import('../../skills/answer-as-page/scripts/open-page.mjs');for(const action of ['opened','refreshed']){const result=await openInSystemBrowser(target,{platform:'darwin',taskIdentity:'Demo/portable',run:(cmd,args,opt)=>{expect(cmd).toBe('osascript');expect(args).toContain('JavaScript');expect(opt.env.WH_PAGE_IDENTITY).toBe('Demo/portable');expect(opt.env.WH_PAGE_TARGET).toBe(target);expect(opt.env.WH_PAGE_URL).toBe('file://'+target+'#workflowhub-task=Demo%2Fportable');return {status:0,stdout:JSON.stringify({opened:true,action,browser:'owned browser',url:opt.env.WH_PAGE_URL})};}});expect(result.action).toBe(action);}await expect(openInSystemBrowser(target,{platform:'darwin',taskIdentity:'Demo/portable',run:()=>({status:0,stdout:''})})).rejects.toThrow(/确认|confirm|capability|结果/);
});
test('ORACLE-COCKPIT-EVENT correction: actual host script reuses identity across filenames and separates another task',async()=>{
 const f=await fixture(),one=join(f.outDir,'one.html'),two=join(f.outDir,'two.html');mkdirSync(f.outDir,{recursive:true});writeFileSync(one,'one');writeFileSync(two,'two');const {openInSystemBrowser}=await import('../../skills/answer-as-page/scripts/open-page.mjs'),{runInNewContext}=await import('node:vm'),{pathToFileURL}=await import('node:url');
 const collection=items=>new Proxy(function(){return items;},{get:(_,key)=>key==='length'?items.length:key==='push'?item=>items.push(item):items[key],apply:()=>items});
 const tab=initial=>{let url=initial;return Object.defineProperty({},'url',{get:()=>()=>url,set:next=>{url=next;}});},window={tabs:collection([])},app={running:()=>true,windows:collection([window]),Tab:({url})=>tab(url)};
 const run=(command,args,options)=>{expect(command).toBe('osascript');const $={NSProcessInfo:{processInfo:{environment:{objectForKey:key=>options.env[key]}}},NSURL:{fileURLWithPath:path=>({path,absoluteString:pathToFileURL(path).href})},NSBundle:{bundleWithURL:()=>({bundleIdentifier:'com.google.Chrome'})},NSWorkspace:{sharedWorkspace:{URLForApplicationToOpenURL:()=>({path:'/owned/Chrome.app'})}}};return {status:0,stdout:runInNewContext(args[3],{$,ObjC:{import(){},unwrap:x=>x},Application:()=>app})};};
 const first=await openInSystemBrowser(one,{platform:'darwin',taskIdentity:'Demo/alpha',taskRoot:f.taskPath,run});expect(first.action).toBe('opened');expect(window.tabs.length).toBe(1);
 const next=await openInSystemBrowser(two,{platform:'darwin',taskIdentity:'Demo/alpha',taskRoot:f.taskPath,run});expect(next.action).toBe('refreshed');expect(window.tabs.length).toBe(1);expect(window.tabs[0].url()).toBe(pathToFileURL(two).href+'#workflowhub-task=Demo%2Falpha');
 const other=await openInSystemBrowser(two,{platform:'darwin',taskIdentity:'Demo/beta',taskRoot:f.taskPath,run});expect(other.action).toBe('opened');expect(window.tabs.length).toBe(2);expect(window.tabs[0].url()).toContain('Demo%2Falpha');expect(window.tabs[1].url()).toContain('Demo%2Fbeta');
});
test('ORACLE-COCKPIT-EVENT correction: owned native guard binds both exact application path and PID',async()=>{
 const f=await fixture(),target=join(f.outDir,'owned.html');mkdirSync(f.outDir,{recursive:true});writeFileSync(target,'owned');const {openInSystemBrowser}=await import('../../skills/answer-as-page/scripts/open-page.mjs'),{runInNewContext}=await import('node:vm');let appCalls=0;
 const invoke=instances=>openInSystemBrowser(target,{platform:'darwin',taskIdentity:'Demo/owned',browserApplication:'/owned/Chrome.app',browserPid:42,run:(cmd,args,options)=>{const $={NSProcessInfo:{processInfo:{environment:{objectForKey:key=>options.env[key]}}},NSURL:{fileURLWithPath:path=>({path})},NSBundle:{bundleWithURL:()=>({bundleIdentifier:'com.google.Chrome'})},NSRunningApplication:{runningApplicationsWithBundleIdentifier:()=>({count:instances.length,objectAtIndex:i=>({bundleURL:{path:instances[i].path},processIdentifier:instances[i].pid})})}};try{return {status:0,stdout:runInNewContext(args[3],{$,ObjC:{import(){},unwrap:x=>x},Application:()=>{appCalls++;throw Error('owned app reached');}})};}catch(e){return {status:1,stderr:e.message};}}});
 await expect(invoke([{path:'/foreign/Chrome.app',pid:42}])).rejects.toThrow(/owned浏览器/);expect(appCalls).toBe(0);
 await expect(invoke([{path:'/owned/Chrome.app',pid:99}])).rejects.toThrow(/owned浏览器/);expect(appCalls).toBe(0);
 await expect(invoke([{path:'/owned/Chrome.app',pid:42},{path:'/owned/Chrome.app',pid:99}])).rejects.toThrow(/owned浏览器/);expect(appCalls).toBe(0);
 await expect(invoke([{path:'/foreign/Chrome.app',pid:99},{path:'/owned/Chrome.app',pid:42}])).rejects.toThrow('owned app reached');expect(appCalls).toBe(1);
});
test('ORACLE-COCKPIT-EVENT: a rejected bad model keeps the pair and shows the verified previous bytes marked expired',async()=>{
 const f=await packageFixture(),opened=[],open=async path=>{opened.push(path);return true;};
 const first=await renderer.refreshAnswerPage({...f,event:'phase-closed',open});
 expect(first.ok,first.open_reason).toBe(true);expect(first.opened).toBe(true);
 const html=readFileSync(first.htmlPath),nodes=readFileSync(first.nodesPath),validDecision=readFileSync(join(f.material,'decision-log.md'));
 writeFileSync(join(f.material,'decision-log.md'),validDecision.toString('utf8').replace('AC-P2-1 可核','AC-P1-1 可核'));
 const rejected=await renderer.refreshAnswerPage({...f,event:'phase-closed',open});
 expect(rejected.ok).toBe(false);expect(rejected.failed).toBe(true);expect(rejected.changed).toBe(false);
 expect(rejected.errors.map(error=>error.code)).toContain('PACKAGE_RECONCILE');
 expect(rejected.previous_pair).toBe('preserved');expect(rejected.open_reason).toContain('上一版');
 expect(readFileSync(first.htmlPath)).toEqual(html);expect(readFileSync(first.nodesPath)).toEqual(nodes);
 const expiredPath=join(f.outDir,'cockpit.expired.html');
 expect(existsSync(expiredPath)).toBe(true);
 const expired=data(expiredPath);
 expect(expired.stageStatus.label).toBe('上一版 · 已过期');expect(expired.stageStatus.tone).toBe('fail');
 expect(expired.objects.filter(o=>o.kind==='wp').map(o=>o.title)).toEqual(['包甲','包乙']);
 expect(expired.provenance).toContain('本次新候选未通过检查');
 expect(opened.at(-1)).toBe(expiredPath);
 // The repeated failure reuses only this task's own expired position.
 const repeated=await renderer.refreshAnswerPage({...f,event:'phase-closed',open});
 expect(repeated.ok).toBe(false);expect(readdirSync(f.outDir).filter(name=>name.includes('.expired.'))).toEqual(['cockpit.expired.html']);
 expect(readFileSync(first.htmlPath)).toEqual(html);expect(readFileSync(first.nodesPath)).toEqual(nodes);
 // Restoring valid materials refreshes the current page and clears the derived view.
 writeFileSync(join(f.material,'decision-log.md'),validDecision);
 const restored=await renderer.refreshAnswerPage({...f,event:'phase-closed',open});
 expect(restored.ok).toBe(true);expect(restored.expired_cleared.cleared).toBe(true);
 expect(existsSync(expiredPath)).toBe(false);
 expect(data(restored.htmlPath).stageStatus).toBeUndefined();
});
test('ORACLE-COCKPIT-EVENT: a rejected model with no verifiable previous pair names the gap and writes no page',async()=>{
 const f=await packageFixture({misbound:true}),opened=[];
 const result=await renderer.refreshAnswerPage({...f,event:'phase-closed',open:async path=>{opened.push(path);return true;}});
 expect(result.ok).toBe(false);expect(result.previous_pair).toBe('unverifiable');expect(result.expired).toBeNull();
 expect(result.open_reason).toContain('无可验证的上一版');
 expect(opened).toEqual([]);
 expect(existsSync(join(f.outDir,'cockpit.html'))).toBe(false);
 expect(existsSync(join(f.outDir,'cockpit.expired.html'))).toBe(false);
});
test('ORACLE-COCKPIT-EVENT: the CLI exits nonzero on a rejected model and opens only the expired view',async()=>{
 const f=await packageFixture(),entry=join(import.meta.dirname,'../../skills/answer-as-page/scripts/render-answer-page.mjs');
 await renderer.refreshAnswerPage({...f,event:'phase-closed',open:async()=>true});
 const pair=readFileSync(join(f.outDir,f.htmlName));
 writeFileSync(join(f.material,'decision-log.md'),readFileSync(join(f.material,'decision-log.md'),'utf8').replace('AC-P2-1 可核','AC-P1-1 可核'));
 const bin=join(f.outDir,'fake-bin'),log=join(f.outDir,'cli-expired-open.log');mkdirSync(bin,{recursive:true});
 writeFileSync(join(bin,'osascript'),'#!/usr/bin/env node\nconst fs=require("node:fs");fs.appendFileSync(process.env.COCKPIT_EXPIRED_LOG,process.env.WH_PAGE_TARGET+"\\n");console.log(JSON.stringify({opened:true,action:"opened",browser:"controlled"}));\n');chmodSync(join(bin,'osascript'),0o700);
 const hostPreload=join(bin,'owned-browser-host.cjs');writeFileSync(hostPreload,"Object.defineProperty(process,'platform',{value:'darwin'});");
 const argv=['--require',hostPreload,entry,'--task-path',f.taskPath,'--report',f.reportPath,'--out-dir',f.outDir,'--html',f.htmlName,'--event','phase-closed'];
 const run=spawnSync(process.execPath,argv,{encoding:'utf8',env:{...process.env,PATH:bin+':'+process.env.PATH,COCKPIT_EXPIRED_LOG:log}});
 expect(run.status,run.stderr).not.toBe(0);
 const result=JSON.parse(run.stdout);
 expect(result.ok).toBe(false);
 expect(result.expired.htmlPath).toBe(join(f.outDir,'cockpit.expired.html'));
 expect(readFileSync(join(f.outDir,f.htmlName))).toEqual(pair);
 expect(readFileSync(log,'utf8').trim()).toBe(join(f.outDir,'cockpit.expired.html'));
});
