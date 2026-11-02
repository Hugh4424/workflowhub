import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, expect, it } from 'vitest';
import { record, consume } from '../../runtime/interface/git-authorize.mjs';
import { openTask } from '../../runtime/task/task-handle.mjs';

const roots=[];
const git=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
function fixture(){
 const root=realpathSync(mkdtempSync(join(tmpdir(),'wh-cross-git-')));roots.push(root);
 const primary=join(root,'primary'),external=join(root,'external');
 for(const dir of [primary,external]){
  mkdirSync(dir);git(dir,'init','-q','-b','main');git(dir,'config','user.name','test');git(dir,'config','user.email','test@example.invalid');
  writeFileSync(join(dir,'README'),'baseline\n');git(dir,'add','.');git(dir,'commit','-qm','baseline');
 }
 git(external,'checkout','-qb','task/owned');const head=git(external,'rev-parse','HEAD');
 const materialRef='specs/current/phases/P1-test.md',phaseFile=join(primary,materialRef);
 mkdirSync(join(primary,'specs/current/phases'),{recursive:true});
 writeFileSync(phaseFile,`分支 \`task/owned\`、HEAD \`${head.slice(0,8)}\`\n- **写入集**：\`${external}/README\`\n- **依赖**：none\n`);
 writeFileSync(join(primary,'specs/current/phases/index.md'),'## Execution Index\n| 阶段 | 权威引用 |\n| `P1` | `phases/P1-test.md` |\n');
 git(primary,'add','.');git(primary,'commit','-qm','approved materials');
 const task=join(root,'Projects/owned/tasks/current'),dir=join(task,'quality/evidence/git-authorizations');
 mkdirSync(join(task,'quality/evidence/human-confirmations'),{recursive:true});
 writeFileSync(join(task,'task.json'),JSON.stringify({schema_version:'1.0.0',project_name:'owned',task_id:'current',target_repo_root:primary,activation_cohort:'post'}));
 const source=join(task,'quality/evidence/2026-11-02-001-user-source.json');
 writeFileSync(source,JSON.stringify({question:'Approve this external repository?',reply:'approved'}));
 const confirmationRef=join(task,'quality/evidence/human-confirmations/2026-11-02-001-build-code-cross-repo.json');
 writeFileSync(confirmationRef,JSON.stringify({stage:'build-code',decision:'cross-repo-auth',reply:'approved',material_refs:[source,materialRef],head:git(primary,'rev-parse','HEAD')}));
 const externalScope={phaseId:'P1',materialRef,worktreeRoot:external,branch:'task/owned',head};
 return {root,primary,external,dir,confirmationRef,externalScope,source};
}
it('binds an approved foreign worktree to its task, phase, branch and current HEAD',async()=>{
 const f=fixture();
 const ref=await record({cwd:f.external,dir:f.dir,operation:'commit',phase:'build-code',confirmationRef:f.confirmationRef,externalScope:f.externalScope});
 const receipt=await consume({cwd:f.external,dir:f.dir,operation:'commit',phase:'build-code',stepId:'commit',authorizationRef:ref});
 expect(receipt).toMatchObject({head:f.externalScope.head,branch:'task/owned',authorization_ref:ref});
 expect(JSON.parse(readFileSync(ref,'utf8')).external_scope.worktree_root).toBe(f.external);
});

const grant = f => record({cwd:f.external,dir:f.dir,operation:'commit',phase:'build-code',confirmationRef:f.confirmationRef,externalScope:f.externalScope});
const use = (f,ref,extra={}) => consume({cwd:f.external,dir:f.dir,operation:'commit',phase:'build-code',stepId:'commit',authorizationRef:ref,...extra});
function updateApprovedHead(f){
 const head=git(f.primary,'rev-parse','HEAD'),confirmation=JSON.parse(readFileSync(f.confirmationRef,'utf8'));
 writeFileSync(f.confirmationRef,JSON.stringify({...confirmation,head}));
}

it('rejects missing, unrelated, ambiguous or mismatched authorization before recording',async()=>{
 const f=fixture();
 const base={cwd:f.external,dir:f.dir,operation:'commit',phase:'build-code',confirmationRef:f.confirmationRef,externalScope:f.externalScope};
 for(const change of [
  {externalScope:undefined}, {phase:undefined}, {operation:'push'}, {confirmationRef:join(f.root,'missing')},
  {externalScope:{...f.externalScope,phaseId:'P2'}}, {externalScope:{...f.externalScope,branch:'main'}},
  {externalScope:{...f.externalScope,head:'a'.repeat(40)}}, {externalScope:{...f.externalScope,worktreeRoot:f.primary}},
  {externalScope:{...f.externalScope,unknown:true}},
 ]) await expect(record({...base,...change})).rejects.toBeTruthy();
});

it('rejects branch, HEAD, source and task identity drift before consuming',async()=>{
 for(const drift of ['branch','head','source','confirmation','grant','task']){
  const f=fixture(),ref=await grant(f);
  if(drift==='branch')git(f.external,'checkout','-qb','another');
  if(drift==='head'){writeFileSync(join(f.external,'README'),'changed\n');git(f.external,'add','README');git(f.external,'commit','-qm','changed');}
  if(drift==='source')writeFileSync(f.source,JSON.stringify({question:'different',reply:'approved'}));
  if(drift==='confirmation')writeFileSync(f.confirmationRef,JSON.stringify({stage:'build-code',decision:'cross-repo',reply:'changed',material_refs:[],head:'a'.repeat(40)}));
  if(drift==='grant'){const saved=JSON.parse(readFileSync(ref,'utf8'));writeFileSync(ref,JSON.stringify({...saved,external_scope:{...saved.external_scope,branch:'another'}}));}
  if(drift==='task')writeFileSync(join(f.root,'Projects/owned/tasks/current/task.json'),JSON.stringify({schema_version:'1.0.0',project_name:'owned',task_id:'other',target_repo_root:f.primary}));
  await expect(use(f,ref)).rejects.toBeTruthy();
 }
});

it('does not treat an unrelated or declined confirmation as approval',async()=>{
 const f=fixture(),original=JSON.parse(readFileSync(f.confirmationRef,'utf8'));
 for(const decision of ['rejected','authorized','p6-desktop-css']){
  writeFileSync(f.confirmationRef,JSON.stringify({...original,decision}));
  await expect(grant(f)).rejects.toBeTruthy();
 }
});

it('does not infer an approved branch from an unrelated mention in Phase prose',async()=>{
 const f=fixture(),file=join(f.primary,f.externalScope.materialRef);
 writeFileSync(file,readFileSync(file,'utf8')+'\n历史主分支 `main` 只作背景。\n');
 git(f.primary,'add','.');git(f.primary,'commit','-qm','extra context');
 updateApprovedHead(f);
 git(f.external,'checkout','main');
 const scope={...f.externalScope,branch:'main'};
 await expect(record({cwd:f.external,dir:f.dir,operation:'commit',phase:'build-code',confirmationRef:f.confirmationRef,externalScope:scope})).rejects.toBeTruthy();
});

it('requires the exact grant and rejects wrong phase and operation',async()=>{
 const f=fixture(),ref=await grant(f);
 await expect(use(f,undefined)).rejects.toBeTruthy();
 await expect(use(f,ref,{phase:undefined})).rejects.toBeTruthy();
 await expect(use(f,ref,{operation:'push'})).rejects.toBeTruthy();
});

it('serializes concurrent use and preserves same-step retry',async()=>{
 const f=fixture(),ref=await grant(f);
 const [one,two]=await Promise.all([use(f,ref),use(f,ref)]);
 expect(two).toEqual(one);
 expect(await use(f,ref)).toEqual(one);
 await expect(use(f,ref,{stepId:'another'})).rejects.toMatchObject({code:'AUTHORIZATION_ALREADY_CONSUMED'});
});

it('detects source drift during the write executor before publishing a grant',async()=>{
 const f=fixture();
 await expect(record({cwd:f.external,dir:f.dir,operation:'commit',phase:'build-code',confirmationRef:f.confirmationRef,externalScope:f.externalScope,
  performWrite:async (_request,actual)=>{writeFileSync(f.source,JSON.stringify({question:'changed',reply:'approved'}));return actual();}})).rejects.toBeTruthy();
});

it('uses the real task handle for the scoped grant and exact consumption',async()=>{
 const f=fixture(),task=openTask(join(f.root,'Projects/owned/tasks/current'),'owned','current');
 const grant=await task.recordGitAuthorization({cwd:f.external,operation:'commit',phase:'build-code',confirmationRef:f.confirmationRef,externalScope:f.externalScope});
 const receipt=await task.consumeGitAuthorization({cwd:f.external,operation:'commit',phase:'build-code',stepId:'task-handle',authorizationRef:grant.path});
 expect(receipt).toMatchObject({head:f.externalScope.head,authorization_ref:grant.path});
});

it('rejects an unapproved second repository even when its branch and commit match',async()=>{
 const f=fixture(),other=join(f.root,'other');
 git(f.root,'clone','-q',f.external,other);
 const scope={...f.externalScope,worktreeRoot:other};
 await expect(record({cwd:other,dir:f.dir,operation:'commit',phase:'build-code',confirmationRef:f.confirmationRef,externalScope:scope})).rejects.toBeTruthy();
});

it('detects source replacement during consumption before publishing a receipt',async()=>{
 const f=fixture(),ref=await grant(f);
 await expect(use(f,ref,{performWrite:async (_request,actual)=>{writeFileSync(f.source,JSON.stringify({question:'changed',reply:'approved'}));return actual();}})).rejects.toBeTruthy();
});

it('rejects retry without the exact external grant even on a same-named primary branch',async()=>{
 const f=fixture(),ref=await grant(f);
 await use(f,ref);
 git(f.primary,'checkout','-qb','task/owned');
 await expect(consume({cwd:f.primary,dir:f.dir,operation:'commit',phase:'build-code',stepId:'commit'})).rejects.toMatchObject({code:'AUTH_SCOPE'});
});

it('rejects a Phase declaring a second external repository with the same branch and HEAD',async()=>{
 const f=fixture(),other=join(f.root,'other'),file=join(f.primary,f.externalScope.materialRef);
 git(f.root,'clone','-q',f.external,other);
 writeFileSync(file,readFileSync(file,'utf8').replace('- **依赖**',`  \`${other}/README\`\n- **依赖**`));
 git(f.primary,'add','.');git(f.primary,'commit','-qm','second external');
 updateApprovedHead(f);
 await expect(grant(f)).rejects.toMatchObject({code:'AUTH_SCOPE'});
});

it('rejects noncanonical declared external paths',async()=>{
 const f=fixture(),file=join(f.primary,f.externalScope.materialRef);
 writeFileSync(file,readFileSync(file,'utf8').replace(`${f.external}/README`,`${f.external}/../external/README`));
 git(f.primary,'add','.');git(f.primary,'commit','-qm','bad path');
 updateApprovedHead(f);
 await expect(grant(f)).rejects.toMatchObject({code:'AUTH_SCOPE'});
});

it('does not infer the target identity without an explicit branch',async()=>{
 const f=fixture();
 const {branch:_,...unbound}=f.externalScope;
 await expect(record({cwd:f.external,dir:f.dir,operation:'commit',phase:'build-code',confirmationRef:f.confirmationRef,externalScope:unbound})).rejects.toMatchObject({code:'AUTH_SCOPE'});
});

it('serializes mixed primitive and TaskHandle consumption of one external grant',async()=>{
 const f=fixture(),ref=await grant(f),task=openTask(join(f.root,'Projects/owned/tasks/current'),'owned','current');
 const first=use(f,ref,{stepId:'direct',performWrite:async(_request,actual)=>{await new Promise(r=>setTimeout(r,250));return actual();}});
 const second=task.consumeGitAuthorization({cwd:f.external,operation:'commit',phase:'build-code',stepId:'task',authorizationRef:ref});
 const results=await Promise.allSettled([first,second]);
 expect(results.filter(result=>result.status==='fulfilled')).toHaveLength(1);
 expect(results.filter(result=>result.status==='rejected')).toHaveLength(1);
});
