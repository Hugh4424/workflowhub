// ORACLE-COCKPIT-GEN: P5/T006. Independent oracle: p5-independent-oracle-tcr original.
import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, realpathSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import { readdirSync } from 'node:fs';
import { validatePostPhaseContract } from '../../runtime/stage/stage-content-contracts.mjs';
import { createTask, openTask } from '../../runtime/task/task-handle.mjs';
import { renderAnswerPage } from '../../skills/answer-as-page/scripts/render-answer-page.mjs';
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
 writeFileSync(join(material,'spec.md'),"# 真实驾驶舱\n## 功能需求\nFR-ONE 只读生成\n- **FR-CARD-001**: R-001; 只读生成，缺数据标缺。\n\n## 实现设计（全局权威）\n### 代码锚点\n`phases/P1-真实交付.md`: Task T007 material; `owned-T007.mjs`: symbol result.\n### 接口与失败语义\n只读页面，失败保原件。\n### 全局验证策略\n`node custom-oracle.mjs` proves the fixture source condition only.\n### 需求到任务追踪\n| Source | FR | AC | Phase/Task | oracle |\n| --- | --- | --- | --- | --- |\n| R-001 | FR-CARD-001 | AC-CARD-001 | P1/T007 | ORACLE-CARDS |\n\n## Appendix A\n- [ ] **AC-ONE**：缺数据标缺\n- **AC-CARD-001**: 缺数据标缺。\n## 风险\n风险：缺少原件\n");
 writeFileSync(join(material,'phases/index.md'),"# Index\n## Execution Index\n| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |\n| --- | --- | --- | --- | --- | --- |\n| P1 | phases/P1-真实交付.md | L0 — 来源卡片 | `owned-T007.mjs` | none | reader |\n");writeFileSync(join(material,'phases/P1-真实交付.md'),contractPhase('P1',[{id:'T007',title:'真实交付',acs:['AC-CARD-001']}]).replaceAll('node --version','node custom-oracle.mjs').replace('1）读取真实失败原件。\n2）核对保存后的来源指针。','只读页面'));
 writeFileSync(join(work,'changed.txt'),'real diff');git(work,['add','.']);git(work,['commit','-qm','real change']);
 await task.appendRecord({dir:'quality/tests',slug:'actual-test',ext:'json',bytes:JSON.stringify({argv:['node','--test','example.test.mjs'],exit_code:0})});await task.appendRecord({dir:'quality/reviews',slug:'actual-review',ext:'json',bytes:JSON.stringify({status:'completed',findings:[]})});
 const reportPath=join(root,'report.json');writeFileSync(reportPath,JSON.stringify({task_id:'cockpit',rings:Array.from({length:10},(_,i)=>({ring:i+1,name:['原始需求','decision-log','调研方案','方案','spec','phase','代码实现','测试验证','最终审查','提交 PR'][i],state:i===9?'skipped':'incomplete',basis:[],applicability:'required',evidence_type:[],counted_in_denominator:true,conflict:null}))}));
 return {taskPath:task.taskPath,reportPath,outDir:join(task.taskPath,'quality/evidence/pages'),htmlName:'cockpit.html',material};
}
const data=path=>JSON.parse(/const DATA = (\{[\s\S]*?\n?\});/.exec(readFileSync(path,'utf8'))[1]);
// Executes the actual emitted template consumers; this is not DOM/click or CSS coverage.
function templateView(path, expression) {
 const script=/<script>([\s\S]*?)<\/script>/.exec(readFileSync(path,'utf8'))[1];
 return runInNewContext(script+'\nconst ui={sources:new Set(),srcRows:new Set(),plan:false,fileFold:false};let sel="progress";const hist=[];const CHANGED=new Set(),RELATED=new Set();let storageError="";\n'+expression);
}

// Normalize only actual relation endpoints to independent business identities; internal ID encoding is unconstrained.
// These literals are independent of buildPageData output. No production index/schema is added.
const SMALL_CARD_TRUTH = Object.freeze({
 requirements: [{id:'R-001',title:'失败必须保留原件',line:5,landing:'WP1'},{id:'R-002',title:'恢复必须换路径',line:7,landing:'WP2'}],
 workPackages: [{id:'WP1',title:'保留原始失败',goal:'失败原件仍可回读',acs:['AC-DEMO-001']},{id:'WP2',title:'自动恢复',goal:'无新事实后换路径',acs:['AC-DEMO-002']}],
 tasks: [{id:'T001',title:'保存失败原件',phase:'P1',acs:['AC-DEMO-001']},{id:'T002',title:'切换恢复路径',phase:'P2',acs:['AC-DEMO-002']}],
 raw:'# 用户原始需求\n\n> 来源：元数据不是原始需求标题\n\n收到失败以后必须留下第一份原件，随后才能修复。\n\n没有新增事实就必须改走另一条恢复路径。\n',
});
const SMALL_NAV_IDENTITIES = Object.freeze(['后建索引 R-001','后建索引 R-002','WP1','WP2','T001','T002']);
const SMALL_MAIN_RELATIONS = Object.freeze([['后建索引 R-001','WP1'],['后建索引 R-002','WP2'],['WP1','T001'],['WP2','T002']]);
const SMALL_SIDE_RELATIONS = Object.freeze([['采用 U-001。','WP1']]);
const REAL_SOURCE_CARD_TRUTH = {
 "requirements": [
  {
   "id": "R-001",
   "title": "两任务设计、执行、验收、反复修复严重耗时与 token 痛点",
   "line": 5,
   "landing": "复盘与根因；不把累计 token 全判浪费",
   "quote": "我在执行PaperBuilder的card-05和T02任务时，发现整个任务的设计和执行有严重问题，设计时没发现很多问题存在，验收也设计的很差劲，执行时一点小问题来回改，导致这两个任务的执行时间都超级长！非常浪费时间和token！我希望你派出多个子代理仔细研究“codex://threads/01a137b0-db88-77f1-85aa-e321100019af”和“codex://threads/01a16848-3617-7fc2-8a03-69ab41799c59”两个会话的进程，以及这两个任务的计划文件“/Users/Hugh/Hugh/Project/PaperBuilder-paperbuilder-architecture-t02-capacity-fact-floor/specs/archive/paperbuilder-v3-card-05-live-activation-gate”和“/Users/Hugh/Hugh/Project/PaperBuilder-paperbuilder-architecture-t02-capacity-fact-floor/specs/paperbuilder-architecture-t02-capacity-fact-floor”，我需要你每个任务分配派出至少4个子代理，研究清楚这两个任务在使用workflowhub进行开发时，任务设计、任务执行、测试验收、bug修复等方面都有什么问题，build-code浪费这么长时间的根本原因是什么？如何优化workflowhub来彻底的避免类似的问题！"
  },
  {
   "id": "R-002",
   "title": "研究两个指定会话及两套计划材料",
   "line": 5,
   "landing": "复盘与根因，来源覆盖待独立核正",
   "quote": "我在执行PaperBuilder的card-05和T02任务时，发现整个任务的设计和执行有严重问题，设计时没发现很多问题存在，验收也设计的很差劲，执行时一点小问题来回改，导致这两个任务的执行时间都超级长！非常浪费时间和token！我希望你派出多个子代理仔细研究“codex://threads/01a137b0-db88-77f1-85aa-e321100019af”和“codex://threads/01a16848-3617-7fc2-8a03-69ab41799c59”两个会话的进程，以及这两个任务的计划文件“/Users/Hugh/Hugh/Project/PaperBuilder-paperbuilder-architecture-t02-capacity-fact-floor/specs/archive/paperbuilder-v3-card-05-live-activation-gate”和“/Users/Hugh/Hugh/Project/PaperBuilder-paperbuilder-architecture-t02-capacity-fact-floor/specs/paperbuilder-architecture-t02-capacity-fact-floor”，我需要你每个任务分配派出至少4个子代理，研究清楚这两个任务在使用workflowhub进行开发时，任务设计、任务执行、测试验收、bug修复等方面都有什么问题，build-code浪费这么长时间的根本原因是什么？如何优化workflowhub来彻底的避免类似的问题！"
  },
  {
   "id": "R-003",
   "title": "每任务至少四子代理，分别研究设计、执行、验收、修复",
   "line": 5,
   "landing": "复盘与根因；上游报研究完成，本文不重验",
   "quote": "我在执行PaperBuilder的card-05和T02任务时，发现整个任务的设计和执行有严重问题，设计时没发现很多问题存在，验收也设计的很差劲，执行时一点小问题来回改，导致这两个任务的执行时间都超级长！非常浪费时间和token！我希望你派出多个子代理仔细研究“codex://threads/01a137b0-db88-77f1-85aa-e321100019af”和“codex://threads/01a16848-3617-7fc2-8a03-69ab41799c59”两个会话的进程，以及这两个任务的计划文件“/Users/Hugh/Hugh/Project/PaperBuilder-paperbuilder-architecture-t02-capacity-fact-floor/specs/archive/paperbuilder-v3-card-05-live-activation-gate”和“/Users/Hugh/Hugh/Project/PaperBuilder-paperbuilder-architecture-t02-capacity-fact-floor/specs/paperbuilder-architecture-t02-capacity-fact-floor”，我需要你每个任务分配派出至少4个子代理，研究清楚这两个任务在使用workflowhub进行开发时，任务设计、任务执行、测试验收、bug修复等方面都有什么问题，build-code浪费这么长时间的根本原因是什么？如何优化workflowhub来彻底的避免类似的问题！"
  },
  {
   "id": "R-004",
   "title": "找出 build-code 长耗时根因",
   "line": 5,
   "landing": "复盘与根因，OI-008",
   "quote": "我在执行PaperBuilder的card-05和T02任务时，发现整个任务的设计和执行有严重问题，设计时没发现很多问题存在，验收也设计的很差劲，执行时一点小问题来回改，导致这两个任务的执行时间都超级长！非常浪费时间和token！我希望你派出多个子代理仔细研究“codex://threads/01a137b0-db88-77f1-85aa-e321100019af”和“codex://threads/01a16848-3617-7fc2-8a03-69ab41799c59”两个会话的进程，以及这两个任务的计划文件“/Users/Hugh/Hugh/Project/PaperBuilder-paperbuilder-architecture-t02-capacity-fact-floor/specs/archive/paperbuilder-v3-card-05-live-activation-gate”和“/Users/Hugh/Hugh/Project/PaperBuilder-paperbuilder-architecture-t02-capacity-fact-floor/specs/paperbuilder-architecture-t02-capacity-fact-floor”，我需要你每个任务分配派出至少4个子代理，研究清楚这两个任务在使用workflowhub进行开发时，任务设计、任务执行、测试验收、bug修复等方面都有什么问题，build-code浪费这么长时间的根本原因是什么？如何优化workflowhub来彻底的避免类似的问题！"
  },
  {
   "id": "R-005",
   "title": "优化 WorkflowHub 避免复发",
   "line": 5,
   "landing": "设计/验收与执行/审查问题；OI-009/OI-010",
   "quote": "我在执行PaperBuilder的card-05和T02任务时，发现整个任务的设计和执行有严重问题，设计时没发现很多问题存在，验收也设计的很差劲，执行时一点小问题来回改，导致这两个任务的执行时间都超级长！非常浪费时间和token！我希望你派出多个子代理仔细研究“codex://threads/01a137b0-db88-77f1-85aa-e321100019af”和“codex://threads/01a16848-3617-7fc2-8a03-69ab41799c59”两个会话的进程，以及这两个任务的计划文件“/Users/Hugh/Hugh/Project/PaperBuilder-paperbuilder-architecture-t02-capacity-fact-floor/specs/archive/paperbuilder-v3-card-05-live-activation-gate”和“/Users/Hugh/Hugh/Project/PaperBuilder-paperbuilder-architecture-t02-capacity-fact-floor/specs/paperbuilder-architecture-t02-capacity-fact-floor”，我需要你每个任务分配派出至少4个子代理，研究清楚这两个任务在使用workflowhub进行开发时，任务设计、任务执行、测试验收、bug修复等方面都有什么问题，build-code浪费这么长时间的根本原因是什么？如何优化workflowhub来彻底的避免类似的问题！"
  },
  {
   "id": "R-006",
   "title": "所有 verify-code 工作迁入 build-code 最后 Phase，包括验证、全局审查、架构师审查、修复、测试",
   "line": 7,
   "landing": "合并研究方向；逐职责不丢失；OI-007",
   "quote": "同时我还有一个需求，现在的verify-code阶段做的事情并不多，完全可以并入build-code，我希望把verify-code阶段的工作都迁移到build-code最后。包括验证、全局审查、架构师审查、修复、测试等所有verify-code工作都放在build-code最后一个phase进行。这样workflowhub减少一个stage，build-code最后也不需要进行handoff了。请你仔细检查可行性，并且看看build-plan、build-code的流程和内容需要进行怎样的修改，才能完成这件事？"
  },
  {
   "id": "R-007",
   "title": "少一个 stage，build-code 末尾无 handoff",
   "line": 7,
   "landing": "三 stage 普通开发目标；U-002/U-004",
   "quote": "同时我还有一个需求，现在的verify-code阶段做的事情并不多，完全可以并入build-code，我希望把verify-code阶段的工作都迁移到build-code最后。包括验证、全局审查、架构师审查、修复、测试等所有verify-code工作都放在build-code最后一个phase进行。这样workflowhub减少一个stage，build-code最后也不需要进行handoff了。请你仔细检查可行性，并且看看build-plan、build-code的流程和内容需要进行怎样的修改，才能完成这件事？"
  },
  {
   "id": "R-008",
   "title": "查合并可行性及 build-plan/build-code 修改",
   "line": 7,
   "landing": "合并研究方向；非固定实现方案",
   "quote": "同时我还有一个需求，现在的verify-code阶段做的事情并不多，完全可以并入build-code，我希望把verify-code阶段的工作都迁移到build-code最后。包括验证、全局审查、架构师审查、修复、测试等所有verify-code工作都放在build-code最后一个phase进行。这样workflowhub减少一个stage，build-code最后也不需要进行handoff了。请你仔细检查可行性，并且看看build-plan、build-code的流程和内容需要进行怎样的修改，才能完成这件事？"
  },
  {
   "id": "R-009",
   "title": "先 worktree，从 make-decision 起，不跳阶段",
   "line": 9,
   "landing": "当前复杂路线；U-001 不改 task 身份",
   "quote": "按WorkflowHub 标准 开始这个复杂任务，先创建worktree，然后从 make-decision 开始，不要跳过任何阶段。先基于原始需求，在make-decision的过程中和我一起进行详细的内外部调研、梳理完整需求大纲、扩散想法、收敛每个模块需求、讨论每个模块方案、确定验收标准，整个过程请用简洁直白的中文沟通和回复，talk和grill请用提问工具，并且用大白话说明选项、后果和风险，不要用黑话、术语和内部ID。注意主会话不要进行大量阅读和调研任务，保证主会话上下文控制和执行质量，方向和细节审查最好各自只进行一次获得异源审查建议即可，细节审查只能在大纲的所有模块使用talk技能把需求收敛清楚后才能进行。确认没问题后，停下用大白话汇报任务内容、进度和下一步计划。同时把stage-handoff文件的路径发给我。"
  },
  {
   "id": "R-010",
   "title": "内外研究、大纲、发散、逐需求模块 Talk、方案与验收收敛",
   "line": 9,
   "landing": "U-005；先调研分析设计，再 build-plan 拆实施",
   "quote": "按WorkflowHub 标准 开始这个复杂任务，先创建worktree，然后从 make-decision 开始，不要跳过任何阶段。先基于原始需求，在make-decision的过程中和我一起进行详细的内外部调研、梳理完整需求大纲、扩散想法、收敛每个模块需求、讨论每个模块方案、确定验收标准，整个过程请用简洁直白的中文沟通和回复，talk和grill请用提问工具，并且用大白话说明选项、后果和风险，不要用黑话、术语和内部ID。注意主会话不要进行大量阅读和调研任务，保证主会话上下文控制和执行质量，方向和细节审查最好各自只进行一次获得异源审查建议即可，细节审查只能在大纲的所有模块使用talk技能把需求收敛清楚后才能进行。确认没问题后，停下用大白话汇报任务内容、进度和下一步计划。同时把stage-handoff文件的路径发给我。"
  },
  {
   "id": "R-011",
   "title": "中文大白话，Talk/Grill 用提问工具，解释选项后果风险",
   "line": 9,
   "landing": "主会话继续执行；本材料不代问答",
   "quote": "按WorkflowHub 标准 开始这个复杂任务，先创建worktree，然后从 make-decision 开始，不要跳过任何阶段。先基于原始需求，在make-decision的过程中和我一起进行详细的内外部调研、梳理完整需求大纲、扩散想法、收敛每个模块需求、讨论每个模块方案、确定验收标准，整个过程请用简洁直白的中文沟通和回复，talk和grill请用提问工具，并且用大白话说明选项、后果和风险，不要用黑话、术语和内部ID。注意主会话不要进行大量阅读和调研任务，保证主会话上下文控制和执行质量，方向和细节审查最好各自只进行一次获得异源审查建议即可，细节审查只能在大纲的所有模块使用talk技能把需求收敛清楚后才能进行。确认没问题后，停下用大白话汇报任务内容、进度和下一步计划。同时把stage-handoff文件的路径发给我。"
  },
  {
   "id": "R-012",
   "title": "主会话少读；方向/细节异源建议最好各一次，细节须在全部 Talk 收敛后",
   "line": 9,
   "landing": "OI-011；两审均未执行",
   "quote": "按WorkflowHub 标准 开始这个复杂任务，先创建worktree，然后从 make-decision 开始，不要跳过任何阶段。先基于原始需求，在make-decision的过程中和我一起进行详细的内外部调研、梳理完整需求大纲、扩散想法、收敛每个模块需求、讨论每个模块方案、确定验收标准，整个过程请用简洁直白的中文沟通和回复，talk和grill请用提问工具，并且用大白话说明选项、后果和风险，不要用黑话、术语和内部ID。注意主会话不要进行大量阅读和调研任务，保证主会话上下文控制和执行质量，方向和细节审查最好各自只进行一次获得异源审查建议即可，细节审查只能在大纲的所有模块使用talk技能把需求收敛清楚后才能进行。确认没问题后，停下用大白话汇报任务内容、进度和下一步计划。同时把stage-handoff文件的路径发给我。"
  },
  {
   "id": "R-013",
   "title": "确认后停下汇报内容/进度/下一步，给当前阶段 handoff 路径",
   "line": 9,
   "landing": "当前 make-decision 交接保留；不等于末阶段 handoff",
   "quote": "按WorkflowHub 标准 开始这个复杂任务，先创建worktree，然后从 make-decision 开始，不要跳过任何阶段。先基于原始需求，在make-decision的过程中和我一起进行详细的内外部调研、梳理完整需求大纲、扩散想法、收敛每个模块需求、讨论每个模块方案、确定验收标准，整个过程请用简洁直白的中文沟通和回复，talk和grill请用提问工具，并且用大白话说明选项、后果和风险，不要用黑话、术语和内部ID。注意主会话不要进行大量阅读和调研任务，保证主会话上下文控制和执行质量，方向和细节审查最好各自只进行一次获得异源审查建议即可，细节审查只能在大纲的所有模块使用talk技能把需求收敛清楚后才能进行。确认没问题后，停下用大白话汇报任务内容、进度和下一步计划。同时把stage-handoff文件的路径发给我。"
  }
 ],
 "workPackages": [
  {
   "id": "WP1",
   "title": "复杂任务按风险挑 Phase 审查",
   "goal": "复杂任务每个 Phase 仍审一次；低风险由独立子代理审，高风险/影响说不清/三维证据缺一项改走外部 OCR；终末整卡再做一次完整外部审查。",
   "acs": [
    "AC-REVIEW-001",
    "AC-REVIEW-002"
   ]
  },
  {
   "id": "WP2",
   "title": "build-code 自动恢复",
   "goal": "同一失败反复或没有新事实时，先停重复动作，自动深研、换假设/方法/独立上下文、修正 Phase 内任务并继续；只有改 AC/方向、缺真实权限凭证外部服务、必须有人承担严重风险三种才停。",
   "acs": [
    "AC-RECOVER-001",
    "AC-RECOVER-002"
   ]
  },
  {
   "id": "WP3",
   "title": "验收前移与每 Phase 验收成本化",
   "goal": "make-decision 定哪些验收要真实资源、用户到场、当前有没有；build-plan 写逐条证据计划；每个 Phase 只判自己的验收，最后 Phase 一次对账；不设计超大验收。",
   "acs": [
    "AC-ACCEPT-001",
    "AC-ACCEPT-002"
   ]
  },
  {
   "id": "WP4",
   "title": "驾驶舱可用",
   "goal": "当前任务驾驶舱（answer-as-page）可用：页面自动生成、刷新、打开，内容与模板一致，不再靠手动拼。",
   "acs": [
    "AC-COCK-001",
    "AC-COCK-002",
    "AC-COCK-003"
   ]
  },
  {
   "id": "WP5",
   "title": "verify-code 并入 build-code（仅复杂任务）",
   "goal": "复杂任务三阶段；verify-code 内容搬进 build-code 最后 Phase，删掉其阶段身份；新增终末审查身份；原质量不丢；最终关闭留在外面 `stage-close`。",
   "acs": [
    "AC-ROUTE-001",
    "AC-ROUTE-002",
    "AC-ROUTE-003",
    "AC-MERGE-001",
    "AC-MERGE-002",
    "AC-MERGE-003",
    "AC-MERGE-004",
    "AC-MERGE-005"
   ]
  },
  {
   "id": "WP6",
   "title": "证据、游标、上下文与成本",
   "goal": "每 Phase 一份执行清单＋失败/差异原件，不再每个命令存一件；Phase 收口更新唯一游标；上下文只带当前 Phase 需要的材料；成本 stage 结束记一次。",
   "acs": [
    "AC-EVID-001",
    "AC-EVID-002",
    "AC-EVID-003",
    "AC-COST-001"
   ]
  },
  {
   "id": "WP7",
   "title": "每 Phase 子代理分工",
   "goal": "复杂任务每个 Phase 配 1 个开发子代理、1 个审查子代理、1 个测试子代理，其他子代理按需；开发是唯一 writer，审查/测试不改文件；普通 finding 直接回开发；主会话只协调、用户决定、风险处置和最终汇总。",
   "acs": [
    "AC-PHASE-001",
    "AC-PHASE-002"
   ]
  }
 ],
 "tasks": [
  {
   "id": "T001",
   "title": "按风险选审查执行者",
   "phase": "P1",
   "acs": [
    "AC-REVIEW-001",
    "AC-REVIEW-002"
   ]
  },
  {
   "id": "T002",
   "title": "三角色、唯一 writer 与七步顺序",
   "phase": "P2",
   "acs": [
    "AC-PHASE-001",
    "AC-PHASE-002"
   ]
  },
  {
   "id": "T003",
   "title": "自动换路径与四类分诊",
   "phase": "P3",
   "acs": [
    "AC-RECOVER-001",
    "AC-RECOVER-002"
   ]
  },
  {
   "id": "T004",
   "title": "逐条证据计划与缺口记录",
   "phase": "P4",
   "acs": [
    "AC-ACCEPT-001",
    "AC-ACCEPT-002"
   ]
  },
  {
   "id": "T005",
   "title": "一份清单、唯一游标、成本一次",
   "phase": "P4",
   "acs": [
    "AC-EVID-001",
    "AC-EVID-002",
    "AC-EVID-003",
    "AC-COST-001",
    "AC-RESULT-001"
   ]
  },
  {
   "id": "T006",
   "title": "自动生成 15 类节点与十环",
   "phase": "P5",
   "acs": [
    "AC-COCK-002"
   ]
  },
  {
   "id": "T007",
   "title": "事件刷新与自动打开",
   "phase": "P5",
   "acs": [
    "AC-COCK-001",
    "AC-COCK-003"
   ]
  },
  {
   "id": "T008",
   "title": "收拢阶段字面量",
   "phase": "P6",
   "acs": [
    "AC-STAGE-001"
   ]
  },
  {
   "id": "T009",
   "title": "关闭技能改名为 stage-close",
   "phase": "P7",
   "acs": [
    "AC-ROUTE-001"
   ]
  },
  {
   "id": "T010",
   "title": "最后 Phase 承接 16 项职责",
   "phase": "P8",
   "acs": [
    "AC-MERGE-001",
    "AC-MERGE-002",
    "AC-MERGE-003"
   ]
  },
  {
   "id": "T011",
   "title": "机制层写入只接受三阶段",
   "phase": "P9",
   "acs": [
    "AC-ROUTE-002",
    "AC-MERGE-004"
   ]
  },
  {
   "id": "T012",
   "title": "当前材料与治理文档迁到三阶段表述",
   "phase": "P10",
   "acs": [
    "AC-MERGE-005"
   ]
  },
  {
   "id": "T013",
   "title": "stage-close 的 PR 标题与正文规范化",
   "phase": "P10",
   "acs": [
    "AC-CLOSE-001"
   ]
  },
  {
   "id": "T014",
   "title": "删除阶段身份并保住旧任务读取",
   "phase": "P11",
   "acs": [
    "AC-ROUTE-003"
   ]
  },
  {
   "id": "T015",
   "title": "逐条对账与三条结果层信号",
   "phase": "P12",
   "acs": [
    "AC-RESULT-002",
    "AC-RESULT-003",
    "AC-BOUND-001",
    "AC-BOUND-002"
   ]
  }
 ],
 "raw": "# 用户原始需求（2026-10-26，逐字）\n\n> 来源：当前 WorkflowHub 会话用户消息。仅保存原文，不改写；编号 R-001…R-013 是下游索引标签，不是原文内容。\n\n我在执行PaperBuilder的card-05和T02任务时，发现整个任务的设计和执行有严重问题，设计时没发现很多问题存在，验收也设计的很差劲，执行时一点小问题来回改，导致这两个任务的执行时间都超级长！非常浪费时间和token！我希望你派出多个子代理仔细研究“codex://threads/01a137b0-db88-77f1-85aa-e321100019af”和“codex://threads/01a16848-3617-7fc2-8a03-69ab41799c59”两个会话的进程，以及这两个任务的计划文件“/Users/Hugh/Hugh/Project/PaperBuilder-paperbuilder-architecture-t02-capacity-fact-floor/specs/archive/paperbuilder-v3-card-05-live-activation-gate”和“/Users/Hugh/Hugh/Project/PaperBuilder-paperbuilder-architecture-t02-capacity-fact-floor/specs/paperbuilder-architecture-t02-capacity-fact-floor”，我需要你每个任务分配派出至少4个子代理，研究清楚这两个任务在使用workflowhub进行开发时，任务设计、任务执行、测试验收、bug修复等方面都有什么问题，build-code浪费这么长时间的根本原因是什么？如何优化workflowhub来彻底的避免类似的问题！\n\n同时我还有一个需求，现在的verify-code阶段做的事情并不多，完全可以并入build-code，我希望把verify-code阶段的工作都迁移到build-code最后。包括验证、全局审查、架构师审查、修复、测试等所有verify-code工作都放在build-code最后一个phase进行。这样workflowhub减少一个stage，build-code最后也不需要进行handoff了。请你仔细检查可行性，并且看看build-plan、build-code的流程和内容需要进行怎样的修改，才能完成这件事？\n\n按WorkflowHub 标准 开始这个复杂任务，先创建worktree，然后从 make-decision 开始，不要跳过任何阶段。先基于原始需求，在make-decision的过程中和我一起进行详细的内外部调研、梳理完整需求大纲、扩散想法、收敛每个模块需求、讨论每个模块方案、确定验收标准，整个过程请用简洁直白的中文沟通和回复，talk和grill请用提问工具，并且用大白话说明选项、后果和风险，不要用黑话、术语和内部ID。注意主会话不要进行大量阅读和调研任务，保证主会话上下文控制和执行质量，方向和细节审查最好各自只进行一次获得异源审查建议即可，细节审查只能在大纲的所有模块使用talk技能把需求收敛清楚后才能进行。确认没问题后，停下用大白话汇报任务内容、进度和下一步计划。同时把stage-handoff文件的路径发给我。\n"
};
const pairs = xs => xs.map(pair=>pair.join(' -> ')).sort();
function business(d,kind,identity,title) {
 const found=d.objects.filter(o=>o.kind===kind&&o.title===title&&[o.source_id,o.label,o.short].some(v=>typeof v==='string'&&v.includes(identity)));
 expect(found,'unique sourced '+kind+' '+identity+' '+title).toHaveLength(1);return found[0];
}
function identities(d,truth=SMALL_CARD_TRUTH) {
 const map=new Map();
 for(const r of truth.requirements)map.set(business(d,'req','后建索引 '+r.id,r.title).id,'后建索引 '+r.id);
 for(const w of truth.workPackages)map.set(business(d,'wp',w.id,w.title).id,w.id);
 for(const t of truth.tasks)map.set(business(d,'task',t.id,t.title).id,t.id);
 // This is a sourced adoption statement, not a new dec ID or title convention.
 const adopted=d.objects.filter(o=>o.kind==='dec'&&o.detail==='采用 U-001。');expect(adopted).toHaveLength(1);map.set(adopted[0].id,'采用 U-001。');
 return map;
}
function principalRelations(d,map) {
 const kinds=new Map(d.objects.map(o=>[o.id,o.kind]));
 return d.edges.filter(([a,b])=>(kinds.get(a)==='req'&&kinds.get(b)==='wp')||(kinds.get(a)==='wp'&&kinds.get(b)==='task')).map(([a,b])=>[map.get(a),map.get(b)]);
}
function navIdentities(d,r,map){return [...templateView(r.htmlPath,'sidebarHtml()').matchAll(/data-go="([^"]+)"/g)].map(m=>m[1]==='progress'?'progress':map.get(m[1])??'unexpected business directory');}
const escaped=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
function primaryDetail(d,r,o){
 // VM proves the output consumer only, not a browser click or CSS acceptance.
 const nav=[...templateView(r.htmlPath,'sidebarHtml()').matchAll(/data-go="([^"]+)"/g)].map(m=>m[1]);expect(nav).toContain(o.id);
 return templateView(r.htmlPath,`sel=${JSON.stringify(o.id)};mainHtml()`);
}
function assertRawRequest(d,r,f,g,raw){
 const o=business(d,'req','后建索引 '+g.id,g.title),quote=g.quote??raw.split('\n')[g.line-1];
 expect(quote).toBeTruthy();expect(o.quote).toBe(quote);expect(o.quote).not.toBe(g.title);
 const rawSources=o.src.filter(s=>s.path===f.rawPath);expect(rawSources).toHaveLength(1);
 expect(rawSources[0].loc).toMatch(new RegExp('(?:line[:：\\s]*'+g.line+'\\b|第?'+g.line+'行)'));
 const main=primaryDetail(d,r,o);expect(main).toContain('后建索引');expect(main).toContain(g.id);expect(main).toContain(escaped(quote));expect(main).toContain(escaped(g.title));
 return o;
}
function contractPhase(phase, cards) {
 const command='node --version', files=cards.map(t=>'owned-'+t.id+'.mjs');
 const tasks=cards.map(t=>{
  const acs=t.acs.length?t.acs:['AC-CARD-001'];
  const fields={'Source / FR / AC':'R-001 / FR-CARD-001 / '+acs.join(' / '),
   'Files / symbols':'`owned-'+t.id+'.mjs`; symbol: result',Action:'1）读取真实失败原件。\n2）核对保存后的来源指针。',Inputs:'Owned local module and fixed source text.',
   'Outputs / failure':'Result is 1; wrong result is nonzero.','Boundary / DO NOT TOUCH':'Other materials stay readonly.',Dependency:'none',
   'Test tier / skill':'contract / backend-testing','Scenario / fixture or service':'Local temporary Git fixture; no network.',
   'RED/GREEN gate_cmd':'`'+command+'`',expected_exit:'RED nonzero; GREEN 0','RED target failure':'ORACLE-CARDS expected result 1; result 0 assertion fails.',
   'GREEN oracle':'ORACLE-CARDS actual result is 1.',Evidence:'Actual output and exit; no prefilled pass.','STOP / recovery':'Preserve failure and return to original developer.',
   'Coverage limit':'Local card fixture only, no real user completion.',Done:acs.join(', ')+' has actual result and evidence.'};
  return '### '+t.id+' — '+t.title+'\n\n'+Object.entries(fields).map(([k,v])=>'- **'+k+'**: '+v).join('\n');
 }).join('\n\n');
 return '# Phase '+phase+' — 来源卡片\n\n- **Global spec**: `spec.md#实现设计全局权威`\n- **Write set**: '+files.map(x=>'`'+x+'`').join('; ')+'\n- **Dependency**: none\n- **Consumer**: reader\n- **gate_cmd**: `'+command+'`\n- **oracle**: ORACLE-CARDS\n- **evidence_path**: `quality/tests/cards.output`\n- **STOP**: Preserve missing input and failure.\n- **Done**: Real card source and actual result.\n\n## L0 — 来源卡片\n\nFR-CARD-001 / '+cards.flatMap(t=>t.acs).join(' / ')+'\n\n## L1 — executable contract\n\n'+tasks+'\n\n## L2 — reference\n\nControlled source fixture.\n';
}
async function sourceCardFixture(truth=SMALL_CARD_TRUTH,{orphan=false,missingRaw=false}={}) {
 const f=await fixture(),task=openTask(f.taskPath,{projectName:'Demo',taskId:'cockpit'});
 const rawRef='quality/evidence/raw-requirements/card-source.md',indexRef='quality/evidence/decision-log-refs/requirement-index.md';
 const rawPath=join(f.taskPath,rawRef);
 if(!missingRaw)await task.createRecord(rawRef,truth.raw.replaceAll('\\n','\n'));
 const reqRows=truth.requirements.map((r,i)=>'| '+r.id+' | '+r.title+' | 原件:'+r.line+' | '+(orphan&&i===0?'WP404':r.landing)+' |');
 await task.createRecord(indexRef,'# 需求索引\n逐字原件：`'+rawRef+'`\n\n| 后建索引编号 | 原义摘要（不充当逐字原件） | 原件行号 | 当前研究/需求落点 |\n| --- | --- | --- | --- |\n'+reqRows.join('\n')+'\n');
 // The v1 R-001 deliberately points to WP2. It is NOT post-index R-001.
 const decision='# 当前决策\n状态：这里只是前言，不是工作包标题\n需求索引：`'+indexRef+'`\n逐字原件：`'+rawRef+'`\n\n| source_id | v1 原义 | 原文来源 | 当前落点 |\n| --- | --- | --- | --- |\n| v1主文 R-001 | 不得混入后建编号 | 原始需求:5 | WP2 |\n\n| 来源 | 最小决定 | 落点 |\n| --- | --- | --- |\n| U-001 | 失败必须保留原件 | WP1 |\n\n'+truth.workPackages.map(w=>'### '+w.id+' — '+w.title+'\n\n- **目标**：'+w.goal+'\n- **边界**：只读来源卡片，不写任务事实。\n- **已定做法**：'+(w.id==='WP1'?'采用 U-001。':'按本包显式AC声明承接。')+'\n').join('\n');
 writeFileSync(join(f.material,'decision-log.md'),decision);
 const allAcs=[...new Set(truth.tasks.flatMap(t=>t.acs.length?t.acs:['AC-CARD-001']))];
 const spec='# 卡片真实来源\n\n- **FR-CARD-001**: R-001; render sourced cards; '+allAcs.join(', ')+'.\n\n## 实现设计（全局权威）\n\n### 代码锚点\n\nOwned modules and material source cards.\n\n### 接口与失败语义\n\nLocal inputs produce sourced cards; missing stays missing.\n\n### 全局验证策略\n\n`node --version` is a fixture command, not product acceptance. Named source and missing cases remain falsifiable.\n\n### 需求到任务追踪\n\n| Source | FR | AC | Phase/Task | oracle |\n| --- | --- | --- | --- | --- |\n'+truth.tasks.map(t=>'| R-001 | FR-CARD-001 | '+(t.acs.length?t.acs:['AC-CARD-001']).join(' ')+' | '+t.phase+'/'+t.id+' | ORACLE-CARDS |').join('\n')+'\n\n### WP1…WP7 与 F1…F8\n\n| 来源 | 落点 |\n| --- | --- |\n'+truth.workPackages.map(w=>'| '+w.id+' | '+w.acs.join('、')+' |').join('\n')+'\n\n## Appendix A\n\n'+allAcs.map(ac=>'- **'+ac+'**: source cards preserve real input and missing conditions.').join('\n')+'\n\n## 风险\n\n风险：无源关系必须保持未知。\n';
 writeFileSync(join(f.material,'spec.md'),spec);
 rmSync(join(f.material,'phases'),{recursive:true,force:true});mkdirSync(join(f.material,'phases'));
 const phases=[...new Set(truth.tasks.map(t=>t.phase))];
 const indexRows=phases.map(phase=>{
  const cards=truth.tasks.filter(t=>t.phase===phase),name=phase+'-cards.md';writeFileSync(join(f.material,'phases',name),contractPhase(phase,cards));
  return '| '+phase+' | phases/'+name+' | L0 — 来源卡片 | '+cards.map(t=>'`owned-'+t.id+'.mjs`').join('; ')+' | none | reader |';
 });
 writeFileSync(join(f.material,'phases/index.md'),'# Index\n\n## Execution Index\n\n| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |\n| --- | --- | --- | --- | --- | --- |\n'+indexRows.join('\n')+'\n');
 // A supplemental heading must never become a third Task or a nav item.
 const first=join(f.material,'phases',phases[0]+'-cards.md');writeFileSync(first,readFileSync(first,'utf8').replace('## L2 — reference','#### T001 补充说明（不是Task卡）\n\nSupplementary note.\n\n## L2 — reference'));
 return {...f,rawPath,indexPath:join(f.taskPath,indexRef)};
}

test('ORACLE-COCKPIT-GEN: exactly three primary groups retain progress and independently sourced identities',async()=>{
 const f=await sourceCardFixture(),r=await renderAnswerPage(f),d=data(r.htmlPath),map=identities(d),sidebar=templateView(r.htmlPath,'sidebarHtml()');
 expect((sidebar.match(/class="nav-group"/g)||[])).toHaveLength(3);
 expect(sidebar).toContain('原始需求');expect(sidebar).toContain('工作包');expect(sidebar).toContain('Task');
 expect(navIdentities(d,r,map)).toEqual(['progress',...SMALL_NAV_IDENTITIES]);
 expect(d.objects.filter(o=>o.kind==='req')).toHaveLength(2);
 expect(d.objects.some(o=>['来源：元数据不是原始需求标题','状态：这里只是前言，不是工作包标题'].includes(o.title))).toBe(false);
});
test('ORACLE-COCKPIT-GEN: fixed explicit joins survive without namespace collisions or invented coverage',async()=>{
 const f=await sourceCardFixture(),r=await renderAnswerPage(f),d=data(r.htmlPath),map=identities(d);
 expect(pairs(principalRelations(d,map))).toEqual(pairs(SMALL_MAIN_RELATIONS));
 const adoption=d.sideEdges.filter(([a])=>map.get(a)==='采用 U-001。').map(([a,b])=>[map.get(a),map.get(b)]);
 expect(pairs(adoption)).toEqual(pairs(SMALL_SIDE_RELATIONS));
 expect(principalRelations(d,map)).not.toContainEqual(['后建索引 R-001','WP2']);
 const kinds=new Map(d.objects.map(o=>[o.id,o.kind]));
 expect(d.edges.filter(([a,b])=>['file','test'].includes(kinds.get(a))&&['file','test'].includes(kinds.get(b)))).toEqual([]);
});
test('ORACLE-COCKPIT-GEN: three primary detail consumers render full source business content and associated cards',async()=>{
 const f=await sourceCardFixture(),r=await renderAnswerPage(f),d=data(r.htmlPath);
 const req=assertRawRequest(d,r,f,SMALL_CARD_TRUTH.requirements[0],SMALL_CARD_TRUTH.raw);
 const wp=business(d,'wp','WP1','保留原始失败'),t=business(d,'task','T001','保存失败原件');
 const reqMain=primaryDetail(d,r,req);expect(reqMain).toContain('保留原始失败');expect(reqMain).toContain('data-go="'+wp.id+'"');
 const wpMain=primaryDetail(d,r,wp);for(const text of ['失败原件仍可回读','只读来源卡片，不写任务事实。','采用 U-001。','保存失败原件'])expect(wpMain).toContain(text);
 expect(wpMain).toContain('data-go="'+t.id+'"');expect(wpMain).toContain('objcard');
 const taskMain=primaryDetail(d,r,t);for(const text of ['读取真实失败原件。','核对保存后的来源指针。'])expect(taskMain).toContain(text);
 expect(taskMain).toContain('P1');expect(taskMain).toContain('保留原始失败');expect(taskMain).toContain('data-go="'+wp.id+'"');
 for(const main of [reqMain,wpMain,taskMain]){expect(main).not.toContain('undefined');expect(main).not.toContain('本页是只读派生视图，不是权威');expect(main).not.toContain('每一环都是平级对象');}
});
test('ORACLE-COCKPIT-GEN: unresolved work-package references stay short missing states without guessed cards',async()=>{
 const f=await sourceCardFixture(SMALL_CARD_TRUTH,{orphan:true}),r=await renderAnswerPage(f),d=data(r.htmlPath),map=identities(d);
 expect(principalRelations(d,map).filter(([a])=>a==='后建索引 R-001')).toEqual([]);
 const req=business(d,'req','后建索引 R-001','失败必须保留原件'),wp=business(d,'wp','WP1','保留原始失败');
 expect(req.status.text+' '+req.summary).toMatch(/归属未取得|关系未取得|缺/);
 const main=primaryDetail(d,r,req);expect(main).toMatch(/归属未取得|关系未取得|缺/);expect(main).not.toContain('data-go="'+wp.id+'"');
});
test('ORACLE-COCKPIT-GEN: missing raw is an explicit detail state and cannot substitute index summary for quote',async()=>{
 const f=await sourceCardFixture(SMALL_CARD_TRUTH,{missingRaw:true}),r=await renderAnswerPage(f),d=data(r.htmlPath),req=business(d,'req','后建索引 R-001','失败必须保留原件');
 expect(req.status.text).toContain('缺');expect(req.quote??'').toBe('');expect(req.quote).not.toBe(req.title);
 expect(req.src.some(s=>s.path===f.indexPath||s.path===join(f.material,'decision-log.md'))).toBe(true);
 const main=primaryDetail(d,r,req);expect(main).toContain('缺');expect(main).not.toContain('来源：元数据');
});
test('ORACLE-COCKPIT-GEN: literal real-source thirteen requests, seven packages and fifteen strict Tasks retain namespace, locations and quotes',async()=>{
 const truth=REAL_SOURCE_CARD_TRUTH,f=await sourceCardFixture(truth),r=await renderAnswerPage(f),d=data(r.htmlPath),map=identities(d,truth);
 const expectedReq=['后建索引 R-001','后建索引 R-002','后建索引 R-003','后建索引 R-004','后建索引 R-005','后建索引 R-006','后建索引 R-007','后建索引 R-008','后建索引 R-009','后建索引 R-010','后建索引 R-011','后建索引 R-012','后建索引 R-013'];
 const expectedWp=['WP1','WP2','WP3','WP4','WP5','WP6','WP7'],expectedTask=['T001','T002','T003','T004','T005','T006','T007','T008','T009','T010','T011','T012','T013','T014','T015'];
 for(const [kind,expected] of [['req',expectedReq],['wp',expectedWp],['task',expectedTask]])expect(d.objects.filter(o=>o.kind===kind).map(o=>map.get(o.id)).sort()).toEqual(expected);
 for(const g of truth.requirements)assertRawRequest(d,r,f,g,truth.raw);
 for(const g of truth.workPackages){const o=business(d,'wp',g.id,g.title);expect(primaryDetail(d,r,o)).toContain(escaped(g.goal));}
 for(const g of truth.tasks){const o=business(d,'task',g.id,g.title),phase=d.objects.find(p=>p.id===o.phase);expect(phase?.source_id??phase?.label).toBe(g.phase);}
 expect(navIdentities(d,r,map)).toEqual(['progress',...expectedReq,...expectedWp,...expectedTask]);
});
test('ORACLE-COCKPIT-GEN: expanded source consumer displays actual source classification and paths',async()=>{
 const f=await fixture(),r=await renderAnswerPage(f),d=data(r.htmlPath);
 for(const o of d.objects){
  const panel=templateView(r.htmlPath,`ui.sources.add(encodeURIComponent(${JSON.stringify(o.id)}));OBJ[${JSON.stringify(o.id)}].src.forEach((s,i)=>ui.srcRows.add(encodeURIComponent(${JSON.stringify(o.id)})+'-'+i));sourcesHtml(OBJ[${JSON.stringify(o.id)}])`);
  expect(panel).not.toContain('undefined');
  for(const s of o.src){
   const expected=s.path.endsWith('task.json')?'任务元数据':s.path.endsWith('facts.jsonl')?'任务事实':s.path.includes('/quality/tests')?'测试记录':s.path.includes('/quality/reviews')?'审查记录':s.path.includes('/quality/evidence/research')?'调研原件':s.path===f.reportPath?'十环报告':'任务材料';
   expect(s.kind).toBe(expected);expect(panel).toContain(expected);expect(panel).toContain(s.path);expect(panel).toContain(s.loc);expect(panel).toContain(s.name);
  }
 }
 const req=d.objects.find(o=>o.kind==='req');expect(req.status.text).toBe('缺');expect(req.src[0].path).toBe(join(f.material,'decision-log.md'));expect(req.summary).toContain('原件');
});
test('ORACLE-COCKPIT-GEN: reachable hero consumers preserve real summaries without undefined fields',async()=>{
 const f=await fixture(),r=await renderAnswerPage(f),d=data(r.htmlPath);
 for(const o of d.objects){const hero=templateView(r.htmlPath,`heroHtml(OBJ[${JSON.stringify(o.id)}])`);expect(hero).not.toContain('undefined');expect(hero).toContain(o.title);}
 expect(templateView(r.htmlPath,'heroHtml(OBJ[DATA.objects.find(o=>o.kind==="dec").id])')).toContain('决定理由未取得');
 expect(templateView(r.htmlPath,'heroHtml(OBJ[DATA.objects.find(o=>o.kind==="eres").id])')).toContain('调研结论未取得');
 expect(templateView(r.htmlPath,'heroHtml({...OBJ[DATA.objects.find(o=>o.kind==="dec").id],detail:"独立具名决定",why:"独立具名理由"})')).toContain('独立具名理由');
 expect(templateView(r.htmlPath,'heroHtml({...OBJ[DATA.objects.find(o=>o.kind==="ires").id],finding:"已有具名研究结论",origin:"已有具名研究范围"})')).toContain('已有具名研究结论');
});
test('ORACLE-COCKPIT-GEN: complete selected detail consumer has no undefined source or chain fields',async()=>{
 const f=await fixture(),r=await renderAnswerPage(f),d=data(r.htmlPath);
 for(const o of d.objects){const main=templateView(r.htmlPath,`sel=${JSON.stringify(o.id)};mainHtml()`);expect(main).not.toContain('undefined');expect(main).toContain(o.title);}
});
test('ORACLE-COCKPIT-GEN: task root alone derives 15 sourced kinds, ten exact rings and real diff',async()=>{
 const f=await fixture();f.outDir=join(f.taskPath,'quality/evidence/cockpit');const facts=readFileSync(join(f.taskPath,'facts.jsonl'));const r=await renderAnswerPage(f),d=data(r.htmlPath);
 expect(new Set(d.objects.map(o=>o.kind)).size).toBe(15);expect(d.rings).toEqual(JSON.parse(readFileSync(f.reportPath)).rings);
 expect(d.objects.every(o=>o.src.length>0)).toBe(true);expect(d.objects.filter(o=>o.kind==='file').some(o=>o.title.includes('changed.txt'))).toBe(true);
 expect(d.objects.find(o=>o.kind==='review').status.text).not.toContain('缺');expect(d.objects.find(o=>o.kind==='test').status.text).not.toContain('缺');
 expect(readFileSync(join(f.taskPath,'facts.jsonl'))).toEqual(facts);expect(readFileSync(r.htmlPath,'utf8')).not.toContain('导出失败要自动重试三次');
 const side=JSON.parse(readFileSync(r.nodesPath));expect(Object.keys(side).sort()).toEqual(['generated_at','nodes','schema','source_fingerprint']);expect(side.nodes.every(n=>Object.keys(n).sort().join(',')==='content_digest,stable_id')).toBe(true);expect(side.nodes.some(n=>n.stable_id==='kind:review')).toBe(true);
});
test('ORACLE-COCKPIT-GEN: missing originals stay missing; material change changes derivation and keeps old pair',async()=>{
 const f=await fixture();rmSync(join(f.taskPath,'quality/reviews'),{recursive:true});rmSync(join(f.taskPath,'quality/tests'),{recursive:true});const r=await renderAnswerPage(f);const oldHtml=readFileSync(r.htmlPath),oldNodes=readFileSync(r.nodesPath),d=data(r.htmlPath);
 expect(d.objects.find(o=>o.kind==='review').status.text).toContain('缺');expect(d.objects.find(o=>o.kind==='test').status.text).toContain('缺');
 writeFileSync(join(f.material,'decision-log.md'),'# 当前决策\n## 目标\n修改后的真实目标\n- U-002 新要求\n');const next=await renderAnswerPage(f);expect(readFileSync(next.htmlPath)).not.toEqual(oldHtml);expect(readFileSync(next.nodesPath)).not.toEqual(oldNodes);
 expect(next.history).toHaveLength(2);expect(readFileSync(next.history[0])).toEqual(oldNodes);expect(readFileSync(next.history[1])).toEqual(oldHtml);
});
test('ORACLE-COCKPIT-GEN: wrong report identity fails before publishing',async()=>{
 const f=await fixture();const report=JSON.parse(readFileSync(f.reportPath));report.task_id='another-task';writeFileSync(f.reportPath,JSON.stringify(report));await expect(renderAnswerPage(f)).rejects.toThrow(/identity|身份|task/i);expect(existsSync(join(f.outDir,f.htmlName))).toBe(false);
});
test('ORACLE-COCKPIT-GEN: missing decision source renders truthful gaps',async()=>{
 const f=await fixture();rmSync(join(f.material,'decision-log.md'));const result=await renderAnswerPage(f),d=data(result.htmlPath);for(const kind of ['req','dec','goal','wp'])expect(d.objects.find(o=>o.kind===kind).status.text).toBe('缺');expect(readFileSync(result.htmlPath,'utf8')).toContain('decision-log 缺失');
});

test('ORACLE-COCKPIT-GEN: observation receipts and timestamps do not become test facts or business changes',async()=>{
 const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs');const f=await fixture();
 const task=openTask(f.taskPath,{projectName:'Demo',taskId:'cockpit'}),before=await buildPageData(f);const beforeTests=before.pageData.objects.find(o=>o.kind==='test');
 const ordinary=await task.captureCommand({cwd:f.material,slug:'ordinary-progress-observation',argv:[process.execPath,'-e','process.stdout.write("progress observed")'],timeoutMs:10000});expect(ordinary.exit_code).toBe(0);
 const observed=await buildPageData(f);expect(observed.pageData.objects.find(o=>o.kind==='test')).toEqual(beforeTests);expect(observed.sourceFingerprint).toEqual(before.sourceFingerprint);expect(observed.excludedCommandRefs).toContain(ordinary.receipt_ref);expect(observed.pageData.objects.find(o=>o.kind==='test').summary).toContain('未分类');
 const row={record_kind:'stage',task_id:'cockpit',stage:'build-code',source:'pure observation receipt',created_at:'2026-10-27T00:00:00Z',evidence:{value:[{command:'node tools/cli/run-checks.mjs --task-path fixture',exit_code:0,output_ref:ordinary.output_ref}]}};
 await task.writeRecordAtomic('facts.jsonl',JSON.stringify(row)+'\n');const onlyObservation=await buildPageData(f);expect(onlyObservation.sourceFingerprint).toEqual(before.sourceFingerprint);
 row.phase_progress={phase_id:'P1',task_id:'T007',phases_head:'a'.repeat(40),base_head:'a'.repeat(40),recorded_at:'2026-10-27T01:00:00Z'};await task.writeRecordAtomic('facts.jsonl',JSON.stringify(row)+'\n');const progressed=await buildPageData(f);expect(progressed.sourceFingerprint).not.toEqual(onlyObservation.sourceFingerprint);expect(progressed.pageData.objects.find(o=>o.kind==='task').status.text).toContain('当前游标');
 row.source='second observation receipt';row.phase_progress.recorded_at='2026-10-27T02:00:00Z';await task.writeRecordAtomic('facts.jsonl',JSON.stringify(row)+'\n');expect((await buildPageData(f)).sourceFingerprint).toEqual(progressed.sourceFingerprint);
 const testFile=join(f.taskPath,'actual-failure.test.mjs');writeFileSync(testFile,'import test from "node:test";test("actual failure",()=>{throw Error("controlled true test failure");});');const trueTest=await task.captureCommand({cwd:f.material,slug:'real-test-result',argv:[process.execPath,'--test',testFile],timeoutMs:10000});expect(trueTest.exit_code).toBe(1);
 const tested=await buildPageData(f);expect(tested.pageData.objects.filter(o=>o.kind==='test').some(o=>o.src.some(s=>s.path===trueTest.receipt_ref))).toBe(true);expect(tested.sourceFingerprint).not.toEqual(progressed.sourceFingerprint);const custom=await task.appendRecord({dir:'quality/tests',slug:'custom-gate-result',ext:'json',bytes:JSON.stringify({argv:['node','custom-oracle.mjs'],exit_code:1})});const gated=await buildPageData(f);expect(gated.pageData.objects.filter(o=>o.kind==='test').some(o=>o.src.some(s=>s.path===custom))).toBe(true);expect(gated.sourceFingerprint).not.toEqual(tested.sourceFingerprint);
});
test.each([
 ['supplement heading only','## 补充材料\n'],
 ['internal supplement pointers only','## 补充材料\n- decision-log：[内部决定](decision-log.md#U-001)\n- [内部结论](../internal.md)\n- `quality/evidence/research/internal.md`\n'],
])('ORACLE-COCKPIT-GEN: %s is missing external evidence',async(_name,supplement)=>{
 const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs');const f=await fixture();const spec=join(f.material,'spec.md');writeFileSync(spec,'# 真实任务\n## 功能需求\nFR-ONE\n'+supplement);const projected=await buildPageData(f),external=projected.pageData.objects.find(o=>o.kind==='eres');expect(external.status.text).toBe('缺');expect(external.src.some(s=>s.path===spec)).toBe(true);
});
test('ORACLE-COCKPIT-GEN: external supplement URL keeps a source pointer without pretending to fetch it',async()=>{
 const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs');const f=await fixture(),spec=join(f.material,'spec.md');writeFileSync(spec,'# 真实任务\n## 功能需求\nFR-ONE\n## 补充材料\n- [内部](decision-log.md)\n- [外部来源](https://authoritative.example/paper#section)\n');const external=(await buildPageData(f)).pageData.objects.find(o=>o.kind==='eres');expect(external.status.text).not.toBe('缺');expect(external.src.some(s=>s.path===spec&&s.loc.includes('https://authoritative.example/paper#section'))).toBe(true);expect(external.title+' '+external.summary).toContain('https://authoritative.example/paper#section');expect(external.summary).toContain('未抓取');
});
test('ORACLE-COCKPIT-GEN: phase index traversal and same-prefix siblings are rejected by the real derivation',async()=>{
 const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs');const f=await fixture();for(const ref of ['../P7-outside.md','../phases-evil/P7-outside.md']){writeFileSync(join(f.material,'phases/index.md'),'| Phase | 文件 |\n| P7 | `'+ref+'` |\n');await expect(buildPageData(f)).rejects.toThrow('phase index path escapes phases');}
});

test.each(['quality/tests','quality/reviews','quality/evidence/research'])('ORACLE-COCKPIT-GEN: source traversal root %s cannot alias outside the task',async ref=>{
 const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs');const f=await fixture(),outside=join(f.outDir,'outside-source');mkdirSync(outside,{recursive:true});writeFileSync(join(outside,'outside.json'),JSON.stringify({argv:['node','--test','sentinel.test.mjs'],exit_code:0}));writeFileSync(join(outside,'outside.md'),'External sentinel https://example.invalid/source');const target=join(f.taskPath,ref);rmSync(target,{recursive:true,force:true});mkdirSync(join(target,'..'),{recursive:true});symlinkSync(outside,target,'dir');await expect(buildPageData(f)).rejects.toThrow(/alias|symlink|task scope|outside/i);expect(existsSync(join(f.outDir,f.htmlName))).toBe(false);
});
test('ORACLE-COCKPIT-GEN: an existing requirements index routes the exact raw requirement original',async()=>{
 const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs');const f=await fixture(),task=openTask(f.taskPath,{projectName:'Demo',taskId:'cockpit'}),rawRef='quality/evidence/raw-requirements/user-original.md',indexRef='quality/evidence/decision-log-refs/requirement-index.md';await task.writeRecordAtomic(rawRef,'用户原文独特要求：第七次失败仍须可见。\n');await task.writeRecordAtomic(indexRef,'# 需求索引\n逐字来源：`'+rawRef+'`\n');writeFileSync(join(f.material,'decision-log.md'),'# 当前材料\n需求索引：`'+indexRef+'`\n');const req=(await buildPageData(f)).pageData.objects.find(o=>o.kind==='req');expect(req.status.text).not.toBe('缺');expect(req.title).toContain('第七次失败');expect(req.src.some(s=>s.path===join(f.taskPath,rawRef))).toBe(true);expect(req.src.some(s=>s.path===join(f.taskPath,indexRef))).toBe(true);rmSync(join(f.taskPath,rawRef));const missing=(await buildPageData(f)).pageData.objects.find(o=>o.kind==='req');expect(missing.status.text).toBe('缺');expect(missing.summary).toContain('raw-requirements');expect(missing.src.some(s=>s.path===join(f.taskPath,rawRef))).toBe(false);
});
test('ORACLE-COCKPIT-GEN: decision requirements do not pretend missing raw originals are complete',async()=>{
 const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs');const f=await fixture(),req=(await buildPageData(f)).pageData.objects.find(o=>o.kind==='req');expect(req.status.text).toBe('缺');expect(req.summary).toContain('raw-requirements');expect(req.src.some(s=>s.path===join(f.material,'decision-log.md'))).toBe(true);expect(req.src.some(s=>s.path===join(f.material,'spec.md'))).toBe(false);
});
test('ORACLE-COCKPIT-GEN: a generic research filename does not hide its external source pointer',async()=>{
 const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs');const f=await fixture(),task=openTask(f.taskPath,{projectName:'Demo',taskId:'cockpit'}),ref='quality/evidence/research/notes.md';await task.writeRecordAtomic(ref,'# 研究笔记\n来源：[规范](https://authoritative.example/research#source)\n');const external=(await buildPageData(f)).pageData.objects.find(o=>o.kind==='eres');expect(external.status.text).not.toBe('缺');expect(external.src.some(s=>s.path===join(f.taskPath,ref)&&s.loc.includes('https://authoritative.example/research#source'))).toBe(true);expect(external.summary).toContain('未抓取');
});
test('ORACLE-COCKPIT-GEN: recursive research symlink is rejected without consuming its outside sentinel',async()=>{
 const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs');const f=await fixture(),outside=join(f.outDir,'outside-nested-source'),research=join(f.taskPath,'quality/evidence/research');mkdirSync(outside,{recursive:true});mkdirSync(research,{recursive:true});writeFileSync(join(outside,'notes.md'),'External sentinel https://example.invalid/nested');symlinkSync(outside,join(research,'linked-child'),'dir');await expect(buildPageData(f)).rejects.toThrow(/alias|symlink/i);
});

// New product oracle: actual authenticated source sample, fixed independent identities below.
async function primaryCardsFixture(){
 const f=await fixture(),base=join(process.cwd(),'specs/workflowhub-build-code-efficiency-verify-merge-20261026');
 const originals='/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-build-code-efficiency-verify-merge-20261026/quality/evidence';
 for(const name of ['spec.md','decision-log.md'])writeFileSync(join(f.material,name),readFileSync(join(base,name)));
 rmSync(join(f.material,'phases'),{recursive:true});mkdirSync(join(f.material,'phases'));
 const phases={};for(const name of readdirSync(join(base,'phases'))){if(name!=='index.md'&&!/^P\d+.*\.md$/.test(name))continue;const bytes=readFileSync(join(base,'phases',name),'utf8').replace(/^### (T\d{3}(?!\s+[—–-]\s+)[^\n]*)$/gm,'#### $1');writeFileSync(join(f.material,'phases',name),bytes);if(name!=='index.md')phases['phases/'+name]=bytes;}
 for(const ref of ['raw-requirements/2026-10-26-user-request.md','decision-log-refs/requirement-index.md']){const target=join(f.taskPath,'quality/evidence',ref);mkdirSync(join(target,'..'),{recursive:true});writeFileSync(target,readFileSync(join(originals,ref)));}
 const checked=validatePostPhaseContract({spec:readFileSync(join(f.material,'spec.md'),'utf8'),index:readFileSync(join(f.material,'phases/index.md'),'utf8'),phases});
 expect(checked.errors, 'fixture must be a real legal post Phase contract, not a target RED').toEqual([]);
 expect(checked.facts.task_count).toBe(15);
 return f;
}
const fixedRequirements=[
 '两任务设计、执行、验收、反复修复严重耗时与 token 痛点','研究两个指定会话及两套计划材料','每任务至少四子代理，分别研究设计、执行、验收、修复','找出 build-code 长耗时根因','优化 WorkflowHub 避免复发','所有 verify-code 工作迁入 build-code 最后 Phase，包括验证、全局审查、架构师审查、修复、测试','少一个 stage，build-code 末尾无 handoff','查合并可行性及 build-plan/build-code 修改','先 worktree，从 make-decision 起，不跳阶段','内外研究、大纲、发散、逐需求模块 Talk、方案与验收收敛','中文大白话，Talk/Grill 用提问工具，解释选项后果风险','主会话少读；方向/细节异源建议最好各一次，细节须在全部 Talk 收敛后','确认后停下汇报内容/进度/下一步，给当前阶段 handoff 路径'
];
const fixedPackages=['复杂任务按风险挑 Phase 审查','build-code 自动恢复','验收前移与每 Phase 验收成本化','驾驶舱可用','verify-code 并入 build-code（仅复杂任务）','证据、游标、上下文与成本','每 Phase 子代理分工'];
test('ORACLE-COCKPIT-GEN primary cards: real13 requirements seven packages and fifteen strict tasks have actual content',async()=>{
 const f=await primaryCardsFixture(),r=await renderAnswerPage(f),d=data(r.htmlPath);
 const req=d.objects.filter(o=>o.kind==='req'),wp=d.objects.filter(o=>o.kind==='wp'),tasks=d.objects.filter(o=>o.kind==='task');
 expect(req.map(o=>o.source_id)).toEqual(fixedRequirements.map((_,i)=>'后建索引 R-'+String(i+1).padStart(3,'0')));
 expect(req.map(o=>o.title)).toEqual(fixedRequirements);expect(req[0].quote).toContain('我在执行PaperBuilder的card-05和T02任务时');expect(req[0].quote).not.toContain('来源：');
 expect(req[5].quote).toContain('同时我还有一个需求');expect(req[8].quote).toContain('按WorkflowHub 标准');
 expect(wp.map(o=>o.title)).toEqual(fixedPackages);expect(wp.map(o=>o.source_id)).toEqual(['WP1','WP2','WP3','WP4','WP5','WP6','WP7']);
 expect(wp[3].summary).toContain('页面自动生成、刷新、打开');expect(wp[3].items.join(' ')).toContain('只读派生');
 expect(tasks.map(o=>o.source_id).sort()).toEqual(Array.from({length:15},(_,i)=>'T'+String(i+1).padStart(3,'0')));
 expect(tasks.filter(o=>o.source_id==='T002')).toHaveLength(1);expect(tasks.find(o=>o.source_id==='T006').title).toBe('自动生成 15 类节点与十环');
 expect(tasks.find(o=>o.source_id==='T006').summary).toContain('buildPageData');expect(tasks.find(o=>o.source_id==='T006').items.length).toBeGreaterThan(0);
 const p5=d.objects.find(o=>o.kind==='phase'&&o.source_id==='P5');expect(d.phaseTasks[p5.id].map(id=>d.objects.find(o=>o.id===id).source_id)).toEqual(['T006','T007']);
 const wp4=wp.find(o=>o.source_id==='WP4'),t6=tasks.find(o=>o.source_id==='T006'),t7=tasks.find(o=>o.source_id==='T007');expect(d.edges).toContainEqual([wp4.id,t6.id]);expect(d.edges).toContainEqual([wp4.id,t7.id]);
 expect(d.edges.some(([a,b])=>d.objects.find(o=>o.id===a)?.kind==='file'&&d.objects.find(o=>o.id===b)?.kind==='test')).toBe(false);
});
test('ORACLE-COCKPIT-GEN primary cards: three main directories consume business cards and compact report',async()=>{
 const f=await primaryCardsFixture(),r=await renderAnswerPage(f),d=data(r.htmlPath),sidebar=templateView(r.htmlPath,'sidebarHtml()');
 const ids=[...sidebar.matchAll(/data-go="([^"]+)"/g)].map(m=>m[1]);expect(ids).toContain('progress');expect(new Set(ids.filter(id=>id!=='progress'))).toEqual(new Set(d.objects.filter(o=>['req','wp','task'].includes(o.kind)).map(o=>o.id)));
 for(const kind of ['req','wp','task']){const o=d.objects.find(o=>o.kind===kind),main=templateView(r.htmlPath,`sel=${JSON.stringify(o.id)};mainHtml()`);expect(main).toContain(o.title);expect(main).not.toContain('undefined');expect(main).not.toContain('每一环都是平级对象');expect(main).not.toContain('本页是只读派生视图，不是权威');}
 const wp=d.objects.find(o=>o.source_id==='WP4'),t6=d.objects.find(o=>o.source_id==='T006');expect(templateView(r.htmlPath,`sel=${JSON.stringify(wp.id)};mainHtml()`)).toContain('data-go="'+t6.id+'"');
 const progress=templateView(r.htmlPath,'progressHtml()');expect(progress).not.toContain('<dl>');expect(progress).toContain('data-report-ring="10"');
});
test('ORACLE-COCKPIT-GEN primary cards: research and execution cards show actual source content and exit facts',async()=>{
 const f=await fixture(),task=openTask(f.taskPath,{projectName:'Demo',taskId:'cockpit'});
 const research='quality/evidence/research/current-module.md';await task.writeRecordAtomic(research,'# 真实模块调研\n## 结论\n现有读取器已经保留原失败。\n');
 const receipt=await task.appendRecord({dir:'quality/tests',slug:'declared-task-execution',ext:'json',bytes:JSON.stringify({argv:['node','custom-oracle.mjs'],exit_code:7})});
 const r=await renderAnswerPage(f),d=data(r.htmlPath),researchCard=d.objects.find(o=>o.kind==='ires'&&o.title==='真实模块调研');
 expect(researchCard,'具名研究原件应生成实际标题卡').toBeDefined();expect(researchCard.finding).toBe('现有读取器已经保留原失败。');expect(researchCard.src[0].path).toBe(join(f.taskPath,research));
 const execution=d.objects.find(o=>o.kind==='test'&&o.src.some(s=>s.path===receipt));expect(execution.exit).toBe(7);expect(execution.status.text).toContain('7');expect(execution.src.some(s=>s.path===receipt)).toBe(true);
 expect(d.edges.some(([a,b])=>d.objects.find(o=>o.id===a)?.kind==='file'&&b===execution.id)).toBe(false);
});
test('ORACLE-COCKPIT-GEN primary cards: authoritative FR AC risk and source status are not navigation rows',async()=>{
 const f=await primaryCardsFixture(),r=await renderAnswerPage(f),d=data(r.htmlPath);
 const fr=d.objects.find(o=>o.source_id==='FR-COCK-002'),ac=d.objects.find(o=>o.source_id==='AC-COCK-002'),risk=d.objects.find(o=>o.source_id==='RISK-03'),issue=d.objects.find(o=>o.source_id==='OI-013');
 expect(fr).toBeDefined();expect(fr.title).toContain('数据从当前材料');expect(ac).toBeDefined();expect(ac.title).toContain('自动生成 15 类节点');
 expect(risk,'风险卡必须来自RISK正文而非导航表').toBeDefined();expect(risk.title).toBe('驾驶舱做成第二个进度权威');expect(risk.summary).toContain('页面写入 task facts');
 expect(issue).toBeDefined();expect(issue.status.text).toContain('closed');expect(issue.summary).toContain('材料层');
 expect(d.objects.find(o=>o.source_id==='后建索引 R-001').aliases).toContain('v1主文 R-001');expect(d.objects.filter(o=>o.kind==='req')).toHaveLength(13);
});
test('ORACLE-COCKPIT-GEN primary cards: duplicate requirement identity is rejected without silent merging',async()=>{
 const f=await primaryCardsFixture(),path=join(f.taskPath,'quality/evidence/decision-log-refs/requirement-index.md'),text=readFileSync(path,'utf8');writeFileSync(path,text.replace('| R-002 |','| R-001 |'));
 await expect(renderAnswerPage(f)).rejects.toThrow('duplicate requirement identity');expect(existsSync(join(f.outDir,f.htmlName))).toBe(false);
});
test('ORACLE-COCKPIT-GEN primary cards: a missing execution index does not infer post Task identity from candidate files',async()=>{
 const f=await primaryCardsFixture();writeFileSync(join(f.material,'phases/index.md'),'# 索引缺口\n没有 Execution Index。\n');const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs');const derived=await buildPageData(f);
 expect(derived.contractErrors.some(error=>error.includes('Execution Index'))).toBe(true);expect(derived.pageData.objects.filter(o=>o.kind==='task'&&o.source_id)).toEqual([]);expect(derived.pageData.objects.find(o=>o.kind==='task').status.text).toBe('缺');
});
test('ORACLE-COCKPIT-GEN primary cards: declared root files remain distinct from actual diff files',async()=>{
 const f=await sourceCardFixture(),r=await renderAnswerPage(f),d=data(r.htmlPath),t=business(d,'task','T001','保存失败原件');
 expect(t.plan).toEqual(['owned-T001.mjs']);expect(templateView(r.htmlPath,`sel=${JSON.stringify(t.id)};ui.plan=true;mainHtml()`)).toContain('owned-T001.mjs');expect(d.objects.some(o=>o.kind==='file'&&o.title==='owned-T001.mjs')).toBe(false);expect(d.objects.some(o=>o.kind==='file'&&o.title==='changed.txt')).toBe(true);
});
test('ORACLE-COCKPIT-GEN preview batch: declared seven-package source collection and named U015 stay faithful',async()=>{
 const f=await primaryCardsFixture(),task=openTask(f.taskPath,{projectName:'Demo',taskId:'cockpit'}),ref='quality/evidence/decision-log-refs/2026-10-26-005-requirement-change-log-addendum-002.md';
 await task.createRecord(ref,readFileSync('/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-build-code-efficiency-verify-merge-20261026/'+ref));
 const r=await renderAnswerPage(f),d=data(r.htmlPath),expected=['WP1','WP2','WP3','WP4','WP5','WP6','WP7'];
 for(const key of ['R-001','R-002','R-003','R-005']){const req=d.objects.find(o=>o.source_id==='后建索引 '+key);expect(d.edges.filter(([a])=>a===req.id).map(([,b])=>d.objects.find(o=>o.id===b).source_id).sort()).toEqual(expected);expect(req.src.some(s=>s.path.endsWith('decision-log.md')&&s.loc.includes('七个工作包'))).toBe(true);}
 for(const key of ['R-004','R-010','R-011','R-013']){const req=d.objects.find(o=>o.source_id==='后建索引 '+key);expect(d.edges.filter(([a])=>a===req.id)).toEqual([]);}
 const selected=d.objects.filter(o=>o.source_id==='U-015');expect(selected).toHaveLength(1);expect(selected[0].kind).toBe('dec');expect(selected[0].items).toEqual(['事件驱动（推荐）','首次和实质变化打开（推荐）','自动生成（推荐）','系统默认浏览器（推荐）','完整模板（推荐）']);
 const wp=d.objects.find(o=>o.source_id==='WP4');expect(d.sideEdges).toContainEqual([selected[0].id,wp.id]);expect(selected[0].src.some(s=>s.path===join(f.taskPath,ref)&&s.loc.includes('问题原文未取得'))).toBe(true);expect(d.objects.filter(o=>o.kind==='req')).toHaveLength(13);expect(d.edges.some(([a,b])=>a.startsWith('req-')&&b===selected[0].id)).toBe(false);
});
test('ORACLE-COCKPIT-GEN preview batch: business matrix leads, identical goal appears once and Task steps lead evidence',async()=>{
 const f=await primaryCardsFixture(),r=await renderAnswerPage(f),d=data(r.htmlPath),progress=templateView(r.htmlPath,'progressHtml()');
 expect(progress.indexOf('需求进展')).toBeLessThan(progress.indexOf('检查详情'));expect(progress.slice(0,progress.indexOf('检查详情'))).not.toContain('data-report-ring');expect(progress).toContain('<details class="check-details">');
 const wp=d.objects.find(o=>o.source_id==='WP4'),main=templateView(r.htmlPath,`sel=${JSON.stringify(wp.id)};mainHtml()`),goal=wp.summary;
 expect(main.split(goal).length-1).toBe(1);const goalNode=d.objects.find(o=>o.kind==='goal'&&o.owner===wp.id);expect(main).toContain('data-go="'+goalNode.id+'"');
 const t=d.objects.find(o=>o.source_id==='T006'),hero=templateView(r.htmlPath,`heroHtml(OBJ[${JSON.stringify(t.id)}])`),detail=templateView(r.htmlPath,`sel=${JSON.stringify(t.id)};mainHtml()`);
 expect(hero).not.toContain('1）');expect(t.items.length).toBeGreaterThan(0);expect(detail.indexOf('任务内容')).toBeGreaterThan(-1);expect(detail.indexOf('任务内容')).toBeLessThan(detail.indexOf('相关内容'));
});
test('ORACLE-COCKPIT-GEN preview batch: header uses real business title and factual cursor without completion claims',async()=>{
 const f=await primaryCardsFixture(),task=openTask(f.taskPath,{projectName:'Demo',taskId:'cockpit'});await task.writeRecordAtomic('facts.jsonl',JSON.stringify({record_kind:'stage',task_id:'cockpit',stage:'build-code',source:'controlled current cursor',created_at:'2026-10-27T00:00:00Z',phase_progress:{phase_id:'P5',task_id:'T006',phases_head:'a'.repeat(40),base_head:'a'.repeat(40),recorded_at:'2026-10-27T00:00:00Z'}})+'\n');
 const r=await renderAnswerPage(f),d=data(r.htmlPath);expect(d.task).toBe('复杂任务三阶段收敛与执行成本控制');expect(d.stageLabel+' '+d.stages.map(s=>s.hint).join(' ')).toContain('P5');expect(d.stageLabel+' '+d.stages.map(s=>s.hint).join(' ')).toContain('T006');expect(d.stageLabel).toContain('写代码');expect(d.stageLabel).not.toContain('完成');
});

test.each([[1,'一个工作包'],[2,'两个工作包'],[3,'全部工作包']])('ORACLE-COCKPIT-GEN reusable source collection: %i packages with arbitrary IDs',async(count,landing)=>{
 const truth={raw:SMALL_CARD_TRUTH.raw,requirements:[{id:'R-001',title:'独立任务需求',line:5,landing:'来源集合'}],workPackages:[17,29,63].slice(0,count).map((n,i)=>({id:'WP'+n,title:'独立包'+n,goal:'目标'+n,acs:['AC-DEMO-00'+(i+1)]})),tasks:[{id:'T001',title:'独立任务正文',phase:'P1',acs:Array.from({length:count},(_,i)=>'AC-DEMO-00'+(i+1))}]};
 const f=await sourceCardFixture(truth),task=openTask(f.taskPath,{projectName:'Demo',taskId:'cockpit'}),indexRef='quality/evidence/decision-log-refs/requirement-index.md',index=task.readRecordBytes(indexRef).toString();await task.writeRecordAtomic(indexRef,index+'\n| 最初主文编号 | 原义 | 后建编号 |\n| --- | --- | --- |\n| R-001 | 来源集合 | R-001 |\n');
 const dp=join(f.material,'decision-log.md');writeFileSync(dp,readFileSync(dp,'utf8').replace('| WP2 |','| '+landing+' |'));const sp=join(f.material,'spec.md');writeFileSync(sp,readFileSync(sp,'utf8').replace('WP1…WP7 与 F1…F8','工作包验收映射').replace('Owned modules and material source cards.','`owned-T001.mjs`: result source.'));
 const specPath=join(f.material,'spec.md');writeFileSync(specPath,readFileSync(specPath,'utf8').replace('Owned modules and material source cards.','`owned-T001.mjs`: result source.'));const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs'),r=await buildPageData(f),d=r.pageData;expect(r.contractErrors).toEqual([]);expect(d.objects.filter(o=>o.kind==='wp').map(o=>o.source_id)).toEqual(truth.workPackages.map(w=>w.id));const req=d.objects.find(o=>o.kind==='req');expect(d.edges.filter(e=>e[0]===req.id).map(e=>e[1])).toEqual(truth.workPackages.map(w=>'wp-'+w.id));for(const wp of truth.workPackages)expect(d.edges).toContainEqual(['wp-'+wp.id,'task-T001']);
});
test('ORACLE-COCKPIT-GEN reusable source collection: missing index never invents relationships',async()=>{
 const f=await sourceCardFixture(),task=openTask(f.taskPath,{projectName:'Demo',taskId:'cockpit'});rmSync(task.recordPath('quality/evidence/decision-log-refs/requirement-index.md'));const specPath=join(f.material,'spec.md');writeFileSync(specPath,readFileSync(specPath,'utf8').replace('Owned modules and material source cards.','`owned-T001.mjs`: result source.'));const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs'),r=await buildPageData(f),d=r.pageData;expect(r.contractErrors).toEqual([]);expect(d.objects.filter(o=>o.kind==='req')).toHaveLength(1);expect(d.objects.find(o=>o.kind==='req').quote).toContain('收到失败');expect(d.edges.some(([a])=>a.startsWith('req-'))).toBe(false);expect(d.objects.filter(o=>o.kind==='task')).toHaveLength(2);
});
test('ORACLE-COCKPIT-GEN reusable source collection: another task identity and selected-decision ID',async()=>{
 const f=await sourceCardFixture(),old=openTask(f.taskPath,{projectName:'Demo',taskId:'cockpit'}),manifest=JSON.parse(readFileSync(join(f.taskPath,'task.json'))),storage=mkdtempSync(join(tmpdir(),'portable-store-'));roots.push(storage);
 const task=await createTask({storageRoot:storage,manifest:{...manifest,task_id:'independent-delivery'}});for(const ref of ['quality/evidence/raw-requirements/card-source.md','quality/evidence/decision-log-refs/requirement-index.md'])await task.createRecord(ref,old.readRecordBytes(ref));
 const {renameSync}=await import('node:fs'),material=join(manifest.workspace_root,'specs/independent-delivery');renameSync(f.material,material);const specPath=join(material,'spec.md');writeFileSync(specPath,readFileSync(specPath,'utf8').replace('Owned modules and material source cards.','`owned-T001.mjs`: result source.'));
 const selectedRef='quality/evidence/requirement-change-log-custom.md';await task.createRecord(selectedRef,'## U-842 — 独立选择选定\n\n问题原文未取得；选中项逐字：\n> 保留失败\n\n真实处置：只保留原件。\n\n受影响：WP2。\n');const dp=join(material,'decision-log.md');writeFileSync(dp,readFileSync(dp,'utf8')+'\n来源：`'+selectedRef+'`\n');const report=JSON.parse(readFileSync(f.reportPath));report.task_id='independent-delivery';writeFileSync(f.reportPath,JSON.stringify(report));
 const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs'),r=await buildPageData({...f,taskPath:task.taskPath}),d=r.pageData;expect(r.contractErrors).toEqual([]);expect(d.taskIdentity).toBe('Demo/independent-delivery');const choice=d.objects.find(o=>o.source_id==='U-842');expect(choice.items).toEqual(['保留失败']);expect(d.sideEdges).toContainEqual([choice.id,'wp-WP2']);expect(d.objects.some(o=>o.source_id==='U-015')).toBe(false);expect(d.objects.filter(o=>o.kind==='req')).toHaveLength(2);
});
test('ORACLE-COCKPIT-GEN reusable source collection: derived requirement identity never merges with parent',async()=>{
 const truth={...SMALL_CARD_TRUTH,requirements:[{id:'R-002',title:'原始父需求',line:5,landing:'WP1'},{id:'R-002a',title:'派生需求',line:7,landing:'WP2'}]},f=await sourceCardFixture(truth);const specPath=join(f.material,'spec.md');writeFileSync(specPath,readFileSync(specPath,'utf8').replace('Owned modules and material source cards.','`owned-T001.mjs`: result source.'));const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs'),r=await buildPageData(f),d=r.pageData;
 expect(r.contractErrors).toEqual([]);expect(d.objects.filter(o=>o.kind==='req').map(o=>o.source_id)).toEqual(['后建索引 R-002','后建索引 R-002a']);const parent=d.objects.find(o=>o.source_id==='后建索引 R-002'),child=d.objects.find(o=>o.source_id==='后建索引 R-002a');expect(parent.quote).toBe('收到失败以后必须留下第一份原件，随后才能修复。');expect(child.quote).toBe('没有新增事实就必须改走另一条恢复路径。');expect(d.edges.filter(([a])=>a===parent.id)).toEqual([[parent.id,'wp-WP1']]);expect(d.edges.filter(([a])=>a===child.id)).toEqual([[child.id,'wp-WP2']]);
});
test('ORACLE-COCKPIT-GEN action boundaries: table between actions and trailing attachment stay out of steps',async()=>{
 const f=await sourceCardFixture(),path=join(f.material,'phases/P1-cards.md'),specPath=join(f.material,'spec.md');writeFileSync(specPath,readFileSync(specPath,'utf8').replace('Owned modules and material source cards.','`owned-T001.mjs`: result source.'));writeFileSync(path,readFileSync(path,'utf8').replace('1）读取真实失败原件。\n2）核对保存后的来源指针。','1）保存第一份业务原件。\n\n| 来源 | 附件 |\n| --- | --- |\n| 表内样本 | 保留原文 |\n\n2）核对表后的真实步骤。\n\n附件说明：这段保留原件但不作行动项。'));const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs'),r=await buildPageData(f),t=r.pageData.objects.find(o=>o.source_id==='T001');expect(t.items).toEqual(['1）保存第一份业务原件。','2）核对表后的真实步骤。']);expect(t.summary).toContain('附件说明');expect(t.src.some(s=>s.path===path)).toBe(true);
});
test('ORACLE-COCKPIT-GEN action boundaries: real T006 T007 retain every action without contract tables',async()=>{
 const f=await primaryCardsFixture(),{buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs'),d=(await buildPageData(f)).pageData;
 for(const [id,count]of [['T006',9],['T007',9]]){const t=d.objects.find(o=>o.source_id===id);expect(t.items).toHaveLength(count);for(let i=0;i<count;i++)expect(t.items[i]).toMatch(new RegExp('^'+(i+1)+'）'));expect(t.items.join('\n')).not.toMatch(/\|\s*(?:kind|事件|---)|十环（1 原始需求|附件说明/);}
});
test('ORACLE-COCKPIT-GEN standard source table: distinct raw originals and derived identities without index',async()=>{
 const f=await sourceCardFixture(),task=openTask(f.taskPath,{projectName:'Demo',taskId:'cockpit'}),first='quality/evidence/raw-requirements/card-source.md',second='quality/evidence/raw-requirements/second-source.md';await task.createRecord(second,'# 第二份原件\n\n第二份文件中的独立派生原话。\n');rmSync(task.recordPath('quality/evidence/decision-log-refs/requirement-index.md'));
 const p=join(f.material,'decision-log.md');writeFileSync(p,'# 独立决定\n## 原始需求\n| source_id | 需求/约束 | 来源引用 | 落点 |\n| --- | --- | --- | --- |\n| R-002 | 父需求摘要 | `'+first+':5` | WP1 |\n| R-002a | 派生需求摘要 | `'+second+':3` | WP2 |\n| R-003 | 来源未明确 | 原件:3 | 未取得 |\n\n'+readFileSync(p,'utf8').slice(readFileSync(p,'utf8').indexOf('### WP1')));const specPath=join(f.material,'spec.md');writeFileSync(specPath,readFileSync(specPath,'utf8').replace('Owned modules and material source cards.','`owned-T001.mjs`: result source.'));const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs'),built=await buildPageData(f),d=built.pageData;expect(built.contractErrors).toEqual([]);
 expect(d.objects.filter(o=>o.kind==='req').map(o=>o.source_id)).toEqual(['R-002','R-002a','R-003']);const parent=d.objects.find(o=>o.source_id==='R-002'),child=d.objects.find(o=>o.source_id==='R-002a'),unknown=d.objects.find(o=>o.source_id==='R-003');expect(parent.quote).toBe('收到失败以后必须留下第一份原件，随后才能修复。');expect(child.quote).toBe('第二份文件中的独立派生原话。');expect(child.src.some(s=>s.path===join(f.taskPath,second)&&s.loc.includes('3'))).toBe(true);expect(d.edges).toContainEqual([parent.id,'wp-WP1']);expect(d.edges).toContainEqual([child.id,'wp-WP2']);expect(unknown.status.text).toBe('缺');expect(unknown.quote).toBe('');
});
test('ORACLE-COCKPIT-GEN indexed multiple raw originals: explicit ref selects source and ambiguity stays missing',async()=>{
 const f=await sourceCardFixture(),task=openTask(f.taskPath,{projectName:'Demo',taskId:'cockpit'}),ref='quality/evidence/raw-requirements/other.md';await task.createRecord(ref,'# 独立原件\n\n独立逐字请求。\n');const indexRef='quality/evidence/decision-log-refs/requirement-index.md';await task.writeRecordAtomic(indexRef,'# 需求索引\n原件 `quality/evidence/raw-requirements/card-source.md` 与 `'+ref+'`\n| 后建索引编号 | 原义摘要 | 原件行号 | 落点 |\n| --- | --- | --- | --- |\n| R-002 | 父摘要 | 原件:5 | WP1 |\n| R-002a | 派生摘要 | '+ref+':3 | WP2 |\n');const specPath=join(f.material,'spec.md');writeFileSync(specPath,readFileSync(specPath,'utf8').replace('Owned modules and material source cards.','`owned-T001.mjs`: result source.'));const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs'),built=await buildPageData(f),d=built.pageData;expect(built.contractErrors).toEqual([]);expect(d.objects.find(o=>o.source_id==='后建索引 R-002').status.text).toBe('缺');expect(d.objects.find(o=>o.source_id==='后建索引 R-002a').quote).toBe('独立逐字请求。');
});
test('ORACLE-COCKPIT-GEN automatic output: main repository and symlink targets are rejected',async()=>{
 const f=await fixture(),manifest=JSON.parse(readFileSync(join(f.taskPath,'task.json')));await expect(renderAnswerPage({...f,outDir:join(manifest.target_repo_root,'published')})).rejects.toThrow(/output|evidence|证据/);const alias=join(f.taskPath,'quality/evidence/alias');mkdirSync(join(f.taskPath,'quality/evidence'),{recursive:true});symlinkSync(manifest.target_repo_root,alias);await expect(renderAnswerPage({...f,outDir:join(alias,'published')})).rejects.toThrow(/alias|symbolic|symlink|ancestor|directory|output/i);expect(existsSync(join(manifest.target_repo_root,'published',f.htmlName))).toBe(false);
});
test('ORACLE-COCKPIT-GEN installed Runner: automatic renderer executes without checkout imports',async()=>{
 const f=await fixture(),release=realpathSync(mkdtempSync(join(tmpdir(),'cockpit-installed-')));roots.push(release);const {buildRunnerRelease,installRunnerRelease}=await import('../../runtime/distribution/runner-release.mjs'),{buildSkillBundleRelease}=await import('../../runtime/distribution/skill-bundle-release.mjs');const runner=join(release,'runner'),bundle=join(release,'bundle');await buildRunnerRelease({packageRoot:process.cwd(),outputDir:runner});await buildSkillBundleRelease({packageRoot:process.cwd(),outputDir:bundle});const env={PATH:process.env.PATH,HOME:release,NODE_ENV:'production'};installRunnerRelease({releaseRoot:runner,skillBundleRoot:bundle,env});const {spawnSync}=await import('node:child_process'),args=[join(runner,'skills/answer-as-page/scripts/render-answer-page.mjs'),'--task-path',f.taskPath,'--report',f.reportPath,'--out-dir',join(f.taskPath,'quality/evidence/installed-render'),'--html','installed.html'];const first=spawnSync(process.execPath,args,{cwd:release,env,encoding:'utf8'});expect(first.status,first.stderr).toBe(0);const output=JSON.parse(first.stdout);expect(existsSync(output.htmlPath)).toBe(true);expect(data(output.htmlPath).taskIdentity).toBe('Demo/cockpit');const alias=join(release,'runner-alias');symlinkSync(runner,alias,'dir');const aliasArgs=[...args];aliasArgs[0]=join(alias,'skills/answer-as-page/scripts/render-answer-page.mjs');aliasArgs[aliasArgs.length-1]='alias-installed.html';const aliasRun=spawnSync(process.execPath,aliasArgs,{cwd:release,env,encoding:'utf8'});expect(aliasRun.status,aliasRun.stderr).toBe(0);const aliasOutput=JSON.parse(aliasRun.stdout);expect(existsSync(aliasOutput.htmlPath)).toBe(true);expect(data(aliasOutput.htmlPath).taskIdentity).toBe('Demo/cockpit');rmSync(join(runner,'runtime/stage/stage-content-contracts.mjs'));const broken=spawnSync(process.execPath,args,{cwd:release,env,encoding:'utf8'});expect(broken.status).not.toBe(0);expect(broken.stderr).toMatch(/stage-content-contracts|ERR_MODULE_NOT_FOUND/);
},60000);
test('ORACLE-COCKPIT-GEN renderer import: stdin library import never executes CLI',()=>{
 const stdout=execFileSync(process.execPath,['--input-type=module','-'],{cwd:process.cwd(),input:"await import('./skills/answer-as-page/scripts/render-answer-page.mjs'); console.log('library-only');",encoding:'utf8',stdio:['pipe','pipe','pipe']});expect(stdout).toBe('library-only\n');
});
test('ORACLE-COCKPIT-GEN correction: real delivery and acceptance remain separate and three stages stay visible',async()=>{
 const f=await sourceCardFixture(),task=openTask(f.taskPath,{projectName:'Demo',taskId:'cockpit'}),commit=execFileSync('git',['rev-parse','HEAD'],{cwd:f.material,encoding:'utf8'}).trim(),ref='quality/evidence/portable-phase-delivery.json';await task.createRecord(ref,JSON.stringify({phase_id:'P1',task_ids:['T001'],diffs:[{commit}],acceptance:[{ac:'AC-DEMO-001',tier:'pass'}]}));const phase=join(f.material,'phases/P1-cards.md');writeFileSync(phase,readFileSync(phase,'utf8').replace('quality/tests/cards.output',ref));await task.writeRecordAtomic('facts.jsonl',JSON.stringify({record_kind:'stage',task_id:'cockpit',stage:'build-code',source:'actual cursor only',phase_progress:{phase_id:'P2',task_id:'T002',phases_head:commit,base_head:commit,recorded_at:'2026-10-27T00:00:00Z'}})+'\n');const r=await renderAnswerPage(f),d=data(r.htmlPath),t1=d.objects.find(o=>o.source_id==='T001'),t2=d.objects.find(o=>o.source_id==='T002');expect(t1.status.text).toContain('已交付');expect(t1.status.text).toContain('验收通过');expect(t2.status.text).not.toContain('已交付');expect(d.objects.find(o=>o.kind==='req').status.text).toContain('已记录');expect(d.objects.find(o=>o.source_id==='WP1').status.text).toContain('方案已定');expect(d.stages.map(s=>s.id)).toEqual(['make-decision','build-plan','build-code']);expect(d.initialSelection).toBe(t2.id);
});
test('ORACLE-COCKPIT-GEN correction: overview keeps every principal once and relationships are directional not sibling guesses',async()=>{
 const truth={...SMALL_CARD_TRUTH,tasks:[...SMALL_CARD_TRUTH.tasks,{id:'T003',title:'独立孤立任务',phase:'P3',acs:['AC-DEMO-099']}]},f=await sourceCardFixture(truth),r=await renderAnswerPage(f),d=data(r.htmlPath),view=templateView(r.htmlPath,'progressHtml()'),principal=d.objects.filter(o=>['req','wp','task'].includes(o.kind));for(const o of principal)expect(view.match(new RegExp('data-overview-select="'+o.id+'"','g'))).toHaveLength(1);const t1=d.objects.find(o=>o.source_id==='T001'),t2=d.objects.find(o=>o.source_id==='T002'),wp=d.objects.find(o=>o.source_id==='WP1'),req=d.objects.find(o=>o.source_id==='后建索引 R-001'),related=templateView(r.htmlPath,`Array.from(relatedObjectIds(${JSON.stringify(t1.id)}))`);expect(related).toContain(wp.id);expect(related).toContain(req.id);expect(related).not.toContain(t2.id);expect(templateView(r.htmlPath,`relationLogic(${JSON.stringify(t1.id)},${JSON.stringify(wp.id)})`)).toContain('AC');
});
test('ORACLE-COCKPIT-GEN correction: refreshing selects the actually changed Task instead of the first object',async()=>{
 const f=await sourceCardFixture(),first=await renderAnswerPage(f),d1=data(first.htmlPath);expect(d1.initialChanged).toEqual([]);const phase=join(f.material,'phases/P2-cards.md');writeFileSync(phase,readFileSync(phase,'utf8').replace('2）核对保存后的来源指针。','2）核对新的恢复路径与唯一原件。'));const second=await renderAnswerPage(f),d2=data(second.htmlPath),t1=d2.objects.find(o=>o.source_id==='T001'),t2=d2.objects.find(o=>o.source_id==='T002');expect(d2.initialSelection).toBe(t2.id);expect(d2.initialChanged).toContain(t2.id);expect(d2.initialChanged).not.toContain(t1.id);
});
test('ORACLE-COCKPIT-GEN correction: authenticated successful Git commit is Phase evidence without a fixed manifest shape',async()=>{
 const f=await sourceCardFixture(),task=openTask(f.taskPath,{projectName:'Demo',taskId:'cockpit'}),work=join(f.material,'../..');execFileSync('git',['add','.'],{cwd:work});execFileSync('git',['commit','-qm','fixture planning materials'],{cwd:work});const phase=join(f.material,'phases/P1-cards.md');writeFileSync(phase,readFileSync(phase,'utf8').replace('读取真实失败原件','读取并保存真实失败原件'));writeFileSync(join(work,'owned-T001.mjs'),'export const result=42;\n');execFileSync('git',['add','.'],{cwd:work});const commit=await task.captureCommand({cwd:work,slug:'actual-phase-commit',argv:['git','commit','-m','delivered a sourced phase change'],timeoutMs:10000});expect(commit.exit_code).toBe(0);const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs'),d=(await buildPageData(f)).pageData,t=d.objects.find(o=>o.source_id==='T001');expect(t.status.text).toContain('已提交');expect(t.status.text).not.toContain('验收通过');expect(t.src.some(s=>s.path===commit.receipt_ref)).toBe(true);
});


test('terminal public status is the same finite DTO in stagebar, top and primary while Task facts stay separate',async()=>{
 const f=await fixture(),manifest=JSON.parse(readFileSync(join(f.taskPath,'task.json'),'utf8')),task=openTask(f.taskPath,{projectName:manifest.project_name,taskId:manifest.task_id});
 const indexPath=join(f.material,'phases/index.md');writeFileSync(indexPath,readFileSync(indexPath,'utf8').replace('| P1 | phases/P1-真实交付.md |','| `P1` | `phases/P1-真实交付.md` |'));
 const assessment=await task.appendRecord({dir:'quality/evidence',slug:'incomplete-terminal-original',ext:'json',bytes:JSON.stringify({task_id:manifest.task_id,stage:'build-code',reader:{identity:'not-bound'}})});
 const {createHash}=await import('node:crypto'),{writeStageRow}=await import('../../runtime/task/task-store.mjs');
 await writeStageRow(f.taskPath,{stage:'build-code',source:'owned-terminal-projection',phase_progress:{phase_id:'P1',task_id:'T007',phases_head:'a'.repeat(40),base_head:'b'.repeat(40),recorded_at:'2026-10-27T00:00:00Z'},terminal_assessment_ref:{ref:assessment.slice(f.taskPath.length+1),sha256:createHash('sha256').update(readFileSync(assessment)).digest('hex')}});
 vi.stubEnv('WORKFLOWHUB_TASK_DIR',join(f.taskPath,'../../../..'));
 let result;try{result=await renderAnswerPage({...f,open:false});}finally{vi.unstubAllEnvs();}const d=data(result.htmlPath);
 expect(d.stageStatus.task_id).toBe(manifest.task_id);expect(d.stageStatus.quality_status).toBe('incomplete');expect(d.stageStatus.label).toContain('有缺口');
 for(const call of ['progressHtml()','headerHtml()','sel=DATA.currentObjectId;mainHtml()'])expect(templateView(result.htmlPath,call)).toContain('最终复验有缺口');
 const target=d.objects.find(o=>o.kind==='task');expect(target.acceptance.text).not.toContain('最终复验通过');
});


test('installed Runner, alias and library read the same public terminal DTO against the owned registered task',async()=>{
 const f=await fixture(),manifest=JSON.parse(readFileSync(join(f.taskPath,'task.json'),'utf8')),task=openTask(f.taskPath,{projectName:manifest.project_name,taskId:manifest.task_id});
 const index=join(f.material,'phases/index.md');writeFileSync(index,readFileSync(index,'utf8').replace('| P1 | phases/P1-真实交付.md |','| `P1` | `phases/P1-真实交付.md` |'));
 const {createHash}=await import('node:crypto'),{writeStageRow}=await import('../../runtime/task/task-store.mjs');
 const original=await task.appendRecord({dir:'quality/evidence',slug:'portable-incomplete-terminal',ext:'json',bytes:JSON.stringify({task_id:manifest.task_id,stage:'build-code'})});
 await writeStageRow(f.taskPath,{stage:'build-code',source:'owned-portable-terminal',phase_progress:{phase_id:'P1',task_id:'T007',phases_head:'a'.repeat(40),base_head:'b'.repeat(40),recorded_at:'2026-10-27T00:00:00Z'},terminal_assessment_ref:{ref:original.slice(f.taskPath.length+1),sha256:createHash('sha256').update(readFileSync(original)).digest('hex')}});
 const owned=join(f.taskPath,'../../../../..'),runnerRoot=join(owned,'runner'),skillBundleRoot=join(owned,'bundle'),home=join(owned,'home');mkdirSync(home);
 const {buildRunnerRelease,installRunnerRelease}=await import('../../runtime/distribution/runner-release.mjs'),{buildSkillBundleRelease}=await import('../../runtime/distribution/skill-bundle-release.mjs');
 const packageRoot=realpathSync(new URL('../../',import.meta.url).pathname);
 await buildSkillBundleRelease({packageRoot,outputDir:skillBundleRoot});await buildRunnerRelease({packageRoot,outputDir:runnerRoot});
 const env={PATH:process.env.PATH,HOME:home,XDG_CONFIG_HOME:join(home,'.config'),WORKFLOWHUB_TASK_DIR:join(f.taskPath,'../../../..'),GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'};
 const installed=installRunnerRelease({releaseRoot:runnerRoot,skillBundleRoot,env});expect(installed.status).toBe(0);
 const entry=join(runnerRoot,'skills/answer-as-page/scripts/render-answer-page.mjs'),work=manifest.workspace_root,out=join(f.taskPath,'quality/evidence/portable-pages'),alias=join(owned,'page-alias.mjs');symlinkSync(entry,alias);
 const direct=(script,name)=>JSON.parse(execFileSync(process.execPath,[script,'--task-path',f.taskPath,'--report',f.reportPath,'--out-dir',out,'--html',name],{cwd:work,env,encoding:'utf8',timeout:15000}));
 const first=direct(entry,'direct.html'),second=direct(alias,'alias.html');
 const library=`import{renderAnswerPage}from ${JSON.stringify(new URL('file://'+entry).href)};console.log(JSON.stringify(await renderAnswerPage({...JSON.parse(process.argv[1]),open:()=>false})));`;
 const third=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',library,JSON.stringify({taskPath:f.taskPath,reportPath:f.reportPath,outDir:out,htmlName:'library.html'})],{cwd:work,env,encoding:'utf8',timeout:15000}));
 const projections=[first,second,third].map(result=>data(result.htmlPath).stageStatus);expect(projections[0].quality_status).toBe('incomplete');expect(projections[1]).toEqual(projections[0]);expect(projections[2]).toEqual(projections[0]);
 for(const result of[first,second,third])expect(result.opened).toBe(false);
},60000);


// This is an owned synthetic task with real captures, not an independent
// terminal verdict for the repository under development.
test('finite pass from real public status reaches all three rendered stage consumers maps only explicit AC relations and preserves separate implementation',async()=>{
 const f=await sourceCardFixture(),m=JSON.parse(readFileSync(join(f.taskPath,'task.json'),'utf8')),task=openTask(f.taskPath,{projectName:m.project_name,taskId:m.task_id}),work=m.workspace_root;
 const {createHash}=await import('node:crypto'),h=b=>createHash('sha256').update(b).digest('hex'),{writeStageRow}=await import('../../runtime/task/task-store.mjs');
 const index=join(f.material,'phases/index.md');writeFileSync(index,readFileSync(index,'utf8').replace(/\| (P[0-9]+) \| (phases\/[^ |]+\.md) \|/g,'| `$1` | `$2` |'));
 const phase=join(f.material,'phases/P1-cards.md');writeFileSync(phase,readFileSync(phase,'utf8').replace('R-001 / FR-CARD-001 / AC-DEMO-001','R-001 / FR-CARD-001 / AC-DEMO-001 / AC-DEMO-002'));
 const builder=new URL('../../skills/answer-as-page/scripts/build-page-data.mjs',import.meta.url).href,options={taskPath:f.taskPath,reportPath:f.reportPath};
 const source=`import assert from 'node:assert/strict';import{buildPageData}from ${JSON.stringify(builder)};const r=await buildPageData(${JSON.stringify(options)});assert.ok(r.pageData.objects.some(o=>o.kind==='task'&&/缺|未/.test(o.acceptance.text)));console.log(JSON.stringify({task_id:'cockpit',missing_is_explicit:true}));`;
 writeFileSync(join(work,'controlled-page-assertion.mjs'),source);
 const execution=await task.captureCommand({cwd:work,slug:'page-missing-business',argv:[process.execPath,'controlled-page-assertion.mjs']});expect(execution.exit_code).toBe(0);
 const semantic=await task.captureCommand({cwd:work,slug:'page-missing-semantic',argv:[process.execPath,'--test','controlled-page-assertion.mjs']});expect(semantic.exit_code).toBe(0);
 const local=p=>({ref:p.slice(f.taskPath.length+1),sha256:h(readFileSync(p))}),save=async(slug,value)=>local(await task.appendRecord({dir:'quality/evidence',slug,ext:'json',bytes:typeof value==='string'?value:JSON.stringify(value)}));
 const identity={task_id:'cockpit',stage:'build-code'},materials=['decision-log.md','spec.md','phases/index.md','phases/P1-cards.md','phases/P2-cards.md'].map(p=>'specs/cockpit/'+p),hashes=paths=>paths.map(path=>({path,sha256:h(readFileSync(join(work,path)))}));
 const acIds=['AC-DEMO-001','AC-DEMO-002'];
 const snapshotGit=args=>execFileSync('git',['-c','commit.gpgsign=false',...args],{cwd:work,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();snapshotGit(['add','.']);snapshotGit(['commit','-qm','owned tracked report source and materials']);
 const report=await save('finite-unique-final-report',{...identity,head:snapshotGit(['rev-parse','HEAD']),materials:hashes(materials),acceptance:acIds.map(id=>({id,result:'incomplete',reason:'Report records generation-time facts before independent synthetic closure'})),six_conclusions:['Owned task and declared materials are present','The pre-terminal page actually exposed missing task acceptance','The native business capture completed successfully','The native semantic capture consumed the real page assertion source','The tracked snapshot contains the exact current source and materials','This report records generation-time facts; fresh independent closure follows'],continuation_request:{requested:false,reason:'Owned fixture has no request for a separate human continuation'}});
 const acs=await save('finite-first-ac-original',{...identity,acceptance:acIds.map(id=>({id,result:'pass',refs:[local(execution.receipt_ref)],basis:'Actual owned page exposes absent acceptance; does not assert product completion'}))});
 const {recordSimpleReviewRequest}=await import('../../runtime/review/review-record-route.mjs');
 const canonical=await recordSimpleReviewRequest({taskDir:f.taskPath,request:{stage:'build-code',review_scope:'terminal',subject_kind:'worktree',phase_id:null,materials:{}},runRound:async()=>({status:'available',executor:'ocr',provider_results:[{provider:'owned-synthetic',status:'completed',parse_outcome:'ok',raw_output:JSON.stringify({findings:[]})}],findings:[]})});
 const rawReview=local(canonical.path),canonicalOriginal=JSON.parse(readFileSync(canonical.path,'utf8')),provider_raw_refs=canonicalOriginal.provider_results.flatMap(p=>[p.raw_output_ref,...(p.evidence_refs??[])]).filter(Boolean).map(ref=>local(join(f.taskPath,ref)));
 const raw={...identity,result:'pass',provider_raw_refs,final_report:report,materials:hashes(materials),implementation:hashes(['changed.txt','controlled-page-assertion.mjs']),acceptance:acIds.map(id=>({id,result:'pass',refs:[acs],current_applicability:{basis:'Same controlled missing-data criterion; current native page assertions preserve explicit gaps',refs:[local(semantic.receipt_ref)]}})),business_effect:{result:'pass',covered_ac_ids:acIds,refs:[local(execution.output_ref)],proofs:[{receipt:local(execution.receipt_ref),output:local(execution.output_ref),inputs:hashes(['changed.txt','specs/cockpit/spec.md'])}],coverage_limits:['Controlled missing-data page only']},semantic_test_adequacy:{result:'pass',covered_ac_ids:acIds,refs:[local(semantic.output_ref)],proofs:[{receipt:local(semantic.receipt_ref),output:local(semantic.output_ref),inputs:hashes(['controlled-page-assertion.mjs']),test_sources:hashes(['controlled-page-assertion.mjs'])}],coverage_limits:['One missing-data assertion']},review:rawReview,finding_dispositions:[],boundary_checks:{}};
 const review_coverage_closure={review_ref:rawReview,result:'pass',covered_gaps:['review:inconclusive'],refs:[local(execution.receipt_ref),local(semantic.receipt_ref)],basis:'Independent synthetic reader explicitly checked canonical zero-finding coverage against native missing-data business and semantic execution; this finite criterion does not assert product completion'};
 raw.review_coverage_closure=review_coverage_closure;
 const dispatch=await save('finite-public-dispatch',{...identity,role:'terminal-assessor',agent_thread_id:'synthetic-reader',implementation_authors:['synthetic-developer'],context_mode:'none',input_refs:[report]});
 async function publish(value){const rawText=JSON.stringify(value),raw_ref=await save('finite-independent-raw',rawText),final=await save('finite-public-final',{agent_thread_id:'synthetic-reader',public_text:rawText}),delivery=await save('finite-public-delivery',{agent_thread_id:'synthetic-reader',public_text:rawText}),source_ref=await save('finite-public-bindings',{dispatch,final,delivery});return save('finite-assessment-provenance',{...identity,raw_ref,reader:{identity:'synthetic-reader',source_ref}});}
 const terminal_assessment_ref=await publish(raw);
 await writeStageRow(f.taskPath,{stage:'build-code',source:'owned-finite-terminal',review_origin:'conducted',review_result_ref:rawReview.ref,phase_progress:{phase_id:'P1',task_id:'T001',phases_head:'a'.repeat(40),base_head:'b'.repeat(40),recorded_at:'2026-10-27T00:00:00Z'},terminal_assessment_ref});
 vi.stubEnv('WORKFLOWHUB_TASK_DIR',join(f.taskPath,'../../../..'));let result;try{result=await renderAnswerPage({...f,open:false});}finally{vi.unstubAllEnvs();}
 const d=data(result.htmlPath);expect(d.stageStatus.quality_status,JSON.stringify(d.stageStatus)).toBe('pass');expect(d.stageStatus.quality.terminal_assessment.review_conclusion).toBe('inconclusive');
 const header=templateView(result.htmlPath,'headerHtml()');expect(header).toContain('build-code');expect(header).not.toMatch(/[（(]\s*[）)]/);expect(templateView(result.htmlPath,'progressHtml()')).not.toContain('当前Task交付与验收分别查看');
 for(const expr of ['progressHtml()','headerHtml()','sel=DATA.currentObjectId;mainHtml()'])expect(templateView(result.htmlPath,expr)).toContain('最终复验通过');
 for(const object of d.objects.filter(o=>['task','wp','req'].includes(o.kind)))expect(object.acceptance.text,object.id).toBe('验收已通过');
 expect(d.objects.find(o=>o.kind==='task').implementation.text).toContain('当前游标');
 delete raw.review_coverage_closure;const noClosure=await publish(raw);await writeStageRow(f.taskPath,{stage:'build-code',source:'owned-finite-terminal',review_origin:'conducted',review_result_ref:rawReview.ref,terminal_assessment_ref:noClosure});vi.stubEnv('WORKFLOWHUB_TASK_DIR',join(f.taskPath,'../../../..'));let uncovered;try{uncovered=await renderAnswerPage({...f,htmlName:'uncovered.html',open:false});}finally{vi.unstubAllEnvs();}expect(data(uncovered.htmlPath).stageStatus.quality_status).toBe('incomplete');for(const expr of ['progressHtml()','headerHtml()','sel=DATA.currentObjectId;mainHtml()'])expect(templateView(uncovered.htmlPath,expr)).toContain('最终复验有缺口');raw.review_coverage_closure=review_coverage_closure;
 raw.acceptance[1].result='missing';raw.acceptance[1].refs=[await save('finite-missing-ac-original',{...identity,id:'AC-DEMO-002',result:'missing',reason:'Controlled missing independent evidence'})];
 const partial=await publish(raw);await writeStageRow(f.taskPath,{stage:'build-code',source:'owned-finite-terminal',review_origin:'conducted',review_result_ref:rawReview.ref,phase_progress:{phase_id:'P1',task_id:'T001',phases_head:'a'.repeat(40),base_head:'b'.repeat(40),recorded_at:'2026-10-27T00:00:00Z'},terminal_assessment_ref:partial});
 vi.stubEnv('WORKFLOWHUB_TASK_DIR',join(f.taskPath,'../../../..'));let partialResult;try{partialResult=await renderAnswerPage({...f,htmlName:'partial.html',open:false});}finally{vi.unstubAllEnvs();}
 const partialData=data(partialResult.htmlPath);expect(partialData.stageStatus.quality_status).toBe('incomplete');
 expect(partialData.objects.find(o=>o.source_id==='T001').acceptance.text).toBe('部分通过 · 仍有缺口');expect(partialData.objects.find(o=>o.source_id==='T002').acceptance.text).toBe('验收未完成');
 expect(partialData.objects.find(o=>o.source_id==='WP1').acceptance.text).toBe('验收已通过');expect(partialData.objects.find(o=>o.source_id==='WP2').acceptance.text).toBe('验收未完成');
 expect(partialData.objects.find(o=>o.kind==='req'&&o.declared_wp_ids?.includes('WP1')).acceptance.text).toBe('验收已通过');expect(partialData.objects.find(o=>o.kind==='req'&&o.declared_wp_ids?.includes('WP2')).acceptance.text).toBe('验收未完成');
 if(process.env.P10_QA_TASK_ROOT){
  const archive=openTask(process.env.P10_QA_TASK_ROOT,{projectName:'workflowhub',taskId:'workflowhub-build-code-efficiency-verify-merge-20261026'});
  const html=await archive.appendRecord({dir:'quality/evidence',slug:'p10-finite-status-fixture-preview',ext:'html',bytes:readFileSync(result.htmlPath)});
  const nodes=await archive.appendRecord({dir:'quality/evidence',slug:'p10-finite-status-fixture-nodes',ext:'json',bytes:readFileSync(result.nodesPath)});
  const partialHtml=await archive.appendRecord({dir:'quality/evidence',slug:'p10-partial-status-fixture-preview',ext:'html',bytes:readFileSync(partialResult.htmlPath)});
  console.log('P10_QA_FIXTURE_PREVIEW '+JSON.stringify({html,nodes,partialHtml,scope:'owned synthetic gap-display task; not actual WorkflowHub terminal acceptance',cleanup:'fixture removed by afterEach; standalone HTML retained for visual QA'}));
 }
});


// A later planner-owned Phase card shares this real commit. Its presence is
// not implementation evidence for that other Task. Expected IDs are literal.
async function singleTaskCommitWithPlannerFixture(variant='bound'){
 const truth={...SMALL_CARD_TRUTH,tasks:SMALL_CARD_TRUTH.tasks.map((t,i)=>({...t,id:i?'T034':'T021'}))},f=await sourceCardFixture(truth),task=openTask(f.taskPath,{projectName:'Demo',taskId:'cockpit'}),work=join(f.material,'../..'),relativePhase='specs/cockpit/phases/P1-cards.md',plannerPhase='specs/cockpit/phases/P2-cards.md',ref='quality/evidence/single-task-original.json';
 const own=join(work,relativePhase),other=join(work,plannerPhase);writeFileSync(own,readFileSync(own,'utf8').replace('quality/tests/cards.output',ref));const spec=join(f.material,'spec.md');writeFileSync(spec,readFileSync(spec,'utf8').replace('Owned modules and material source cards.','`owned-T021.mjs`: real implementation.'));execFileSync('git',['add','.'],{cwd:work});execFileSync('git',['commit','-qm','planning baseline'],{cwd:work});
 writeFileSync(join(work,'owned-T021.mjs'),'export const result="independent result";\n');writeFileSync(own,readFileSync(own,'utf8')+'\n<!-- actual owned implementation note -->\n');writeFileSync(other,readFileSync(other,'utf8')+'\n<!-- planner-only coordination note -->\n');if(variant==='unrelated')writeFileSync(join(work,'unrelated.mjs'),'unrelated change');
 const {createHash}=await import('node:crypto'),h=bytes=>createHash('sha256').update(bytes).digest('hex');const original={phase:variant==='foreign-phase'?'P2':'P1',task:variant==='foreign-task'?'T999':'T021',implementation:[{path:'owned-T021.mjs',sha256:variant==='implementation-hash-mismatch'?'0'.repeat(64):h(readFileSync(join(work,'owned-T021.mjs')))}],materials:{phase:relativePhase,planner_only:variant==='no-planner-declaration'?[]:[plannerPhase]}};await task.createRecord(ref,JSON.stringify(original));execFileSync('git',['add','.'],{cwd:work});
 let receipt;if(variant==='no-success-receipt')execFileSync('git',['commit','-qm','actual commit without captured success'],{cwd:work});else{receipt=await task.captureCommand({cwd:work,slug:'single-task-planner-commit',argv:['git','commit','-m','implement one task and carry explicit planner edit'],timeoutMs:10000});expect(receipt.exit_code).toBe(0);}
 const expectedCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:work,encoding:'utf8'}).trim();return {...f,receipt,ref,expectedCommit};
}
test('ORACLE-COCKPIT-GEN single Task implementation: explicit original binds a real multi-Phase planner commit',async()=>{
 const f=await singleTaskCommitWithPlannerFixture(),{buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs'),built=await buildPageData(f);expect(built.contractErrors).toEqual([]);const own=built.pageData.objects.find(o=>o.source_id==='T021'),planner=built.pageData.objects.find(o=>o.source_id==='T034');expect(own.implementation.text).toBe('已提交（具名Task原件）');expect(own.implementation.scope).toBe('Task');expect(own.implementation.commit).toBe(f.expectedCommit);expect(own.src.some(s=>s.path===f.receipt.receipt_ref)).toBe(true);expect(own.src.some(s=>s.path===join(f.taskPath,f.ref))).toBe(true);expect(own.acceptance.text).toBe('验收结论未记录');expect(planner.implementation.text).toBe('实施结论未记录');
});
test.each(['foreign-phase','foreign-task','no-planner-declaration','unrelated','no-success-receipt','implementation-hash-mismatch'])('ORACLE-COCKPIT-GEN single Task implementation: rejects unbound %s without inventing delivery',async variant=>{
 const f=await singleTaskCommitWithPlannerFixture(variant),{buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs'),built=await buildPageData(f);expect(built.contractErrors).toEqual([]);for(const id of ['T021','T034']){const t=built.pageData.objects.find(o=>o.source_id===id);expect(t.implementation.text).toBe('实施结论未记录');expect(t.implementation.commit).toBeUndefined();expect(t.acceptance.text).toBe('验收结论未记录');}
});

// Real currentRow wrappers are truthy even when their values are null. These
// three stage rows use the actual writer, not a hand-shaped position stub.
test.each(['cursor','handoff','empty'])('ORACLE-COCKPIT-GEN stage position: real multi-stage wrappers preserve %s location',async scenario=>{
 const f=await sourceCardFixture(),task=openTask(f.taskPath,{projectName:'Demo',taskId:'cockpit'}),{writeStageRow}=await import('../../runtime/task/task-store.mjs'),head=execFileSync('git',['rev-parse','HEAD'],{cwd:f.material,encoding:'utf8'}).trim();const spec=join(f.material,'spec.md');writeFileSync(spec,readFileSync(spec,'utf8').replace('Owned modules and material source cards.','`owned-T001.mjs`: real source.'));
 await task.createRecord('quality/evidence/decision-location.md','Actual decision location original.');await task.createRecord('quality/evidence/plan-location.md','Actual plan location original.');
 await writeStageRow(f.taskPath,{stage:'make-decision',source:'controlled actual first-stage observation',handoff:{value:null,reason:'no decision handoff'}});
 await writeStageRow(f.taskPath,{stage:'build-code',source:'controlled actual execution position',...(scenario==='cursor'?{phase_progress:{phase_id:'P2',task_id:'T002',phases_head:head,base_head:head,recorded_at:'2026-10-28T00:00:00Z'}}:{})});
 await writeStageRow(f.taskPath,{stage:'build-plan',source:'controlled actual last row',handoff:scenario==='empty'?{value:null,reason:'no plan handoff'}:{value:'quality/evidence/plan-location.md',reason:null}});
 const before=readFileSync(join(f.taskPath,'facts.jsonl')),rows=before.toString().trim().split('\n').map(line=>JSON.parse(line));expect(rows).toHaveLength(3);expect(rows[0].handoff.value).toBeNull();expect(rows.every(row=>row.close_action.value===null)).toBe(true);
 const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs'),built=await buildPageData(f),d=built.pageData;expect(built.contractErrors).toEqual([]);expect(readFileSync(join(f.taskPath,'facts.jsonl')).equals(before)).toBe(true);
 if(scenario==='cursor'){expect(d.stageLabel).toBe('写代码 · P2 / T002');expect(d.stages.filter(s=>s.state==='now').map(s=>s.id)).toEqual(['build-code']);expect(d.currentObjectId).toBe('task-T002');expect(d.initialSelection).toBe('task-T002');expect(d.edges).toContainEqual(['wp-WP2','task-T002']);}
 else if(scenario==='handoff'){expect(d.stageLabel).toBe('写计划');expect(d.stages.filter(s=>s.state==='now').map(s=>s.id)).toEqual(['build-plan']);expect(d.currentObjectId).toBeNull();expect(d.initialSelection).toBe('progress');}
 else{expect(d.stageLabel).toBe('当前位置未取得');expect(d.stages.filter(s=>s.state==='now')).toEqual([]);expect(d.initialSelection).toBe('progress');}
 expect(d.stages.some(s=>s.state==='done')).toBe(false);
});

test('ORACLE-COCKPIT-GEN planning-only commit: three material edits never prove Task implementation',async()=>{
 const f=await sourceCardFixture(),task=openTask(f.taskPath,{projectName:'Demo',taskId:'cockpit'}),work=join(f.material,'../..'),spec=join(f.material,'spec.md');writeFileSync(spec,readFileSync(spec,'utf8').replace('Owned modules and material source cards.','`owned-T001.mjs`: real source.'));execFileSync('git',['add','.'],{cwd:work});execFileSync('git',['commit','-qm','initial planning materials'],{cwd:work});
 for(const p of ['spec.md','phases/index.md','phases/P1-cards.md']){const path=join(f.material,p);writeFileSync(path,readFileSync(path,'utf8')+'\n<!-- planning clarification only -->\n');}
 const receipt=await task.captureCommand({cwd:work,slug:'three-material-plan-commit',argv:['git','commit','-am','clarify only planned material scope'],timeoutMs:10000});expect(receipt.exit_code).toBe(0);const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs'),built=await buildPageData(f),target=built.pageData.objects.find(o=>o.source_id==='T001');expect(built.contractErrors).toEqual([]);expect(target.implementation.text).toBe('实施结论未记录');expect(target.implementation.commit).toBeUndefined();expect(target.acceptance.text).toBe('验收结论未记录');expect(target.src.some(s=>s.path===receipt.receipt_ref&&/交付|提交/.test(s.loc))).toBe(false);
});
test('ORACLE-COCKPIT-GEN circled Task actions: all seven bodies survive embedded numeric parentheses and semicolons',async()=>{
 const f=await sourceCardFixture(),phase=join(f.material,'phases/P1-cards.md'),expected=['①写对账测试，保留 ORACLE-RESULT-002（2） 原义；不把编号当新步骤。','②消费可达性原件 RESULT002；缺件保持缺。','③消费真实计数 RESULT003；不得补签。','④登记现有测试 owner 与 consumer。','⑤保存最终 JSON 原件；路径与 hash 逐字回读。','⑥独立读取该 ref，保留参数 sample(3） 与失败输出。','⑦交关闭 reader；本步骤不提前归档。'];writeFileSync(phase,readFileSync(phase,'utf8').replace('1）读取真实失败原件。\n2）核对保存后的来源指针。',expected.join('')));const {buildPageData}=await import('../../skills/answer-as-page/scripts/build-page-data.mjs'),built=await buildPageData(f),target=built.pageData.objects.find(o=>o.source_id==='T001');expect(target.items).toEqual(expected);expect(target.summary).toContain(expected[0]);expect(target.summary).toContain(expected[6]);expect(target.src.some(s=>s.path===phase)).toBe(true);
});

for(const variant of ['object','array','unreachable','invalid-string','invalid-object'])test('phase diffs shape: '+variant,async()=>{
 const f=await sourceCardFixture(),task=openTask(f.taskPath,{projectName:'Demo',taskId:'cockpit'}),work=join(f.material,'../..'),ref='quality/evidence/observed-phase-diffs.json';
 writeFileSync(join(work,'owned-T001.mjs'),'export const result=1;\n');execFileSync('git',['add','.'],{cwd:work});execFileSync('git',['commit','-qm','actual owned implementation and materials'],{cwd:work});
 const head=execFileSync('git',['rev-parse','HEAD'],{cwd:work,encoding:'utf8'}).trim();
 const diffs=variant==='array'?[{commit:head}]:variant==='invalid-string'?'invalid':variant==='invalid-object'?{paths:[]}:{base_commit:head,reviewed_implementation_commit:variant==='unreachable'?'f'.repeat(40):head,paths:['owned-T001.mjs']};
 await task.createRecord(ref,JSON.stringify({phase_id:'P1',task_ids:['T001'],diffs}));
 const phase=join(f.material,'phases/P1-cards.md');writeFileSync(phase,readFileSync(phase,'utf8').replace('quality/tests/cards.output',ref));
 if(variant.startsWith('invalid')){await expect(renderAnswerPage(f)).rejects.toThrow('Phase evidence diffs invalid: '+join(f.taskPath,ref));return;}
 const result=await renderAnswerPage(f),d=data(result.htmlPath),owned=d.objects.find(o=>o.source_id==='T001'),other=d.objects.find(o=>o.source_id==='T002');
 if(variant==='unreachable'){expect(owned.implementation.text).not.toContain('已交付');expect(owned.implementation.commit).toBeUndefined();}
 else{expect(owned.implementation.text).toBe('已交付（具名记录）');expect(owned.implementation.commit).toBe(head);}
 expect(other.implementation.text).not.toBe('已交付（具名记录）');expect(owned.acceptance.text).toBe('验收结论未记录');
});
