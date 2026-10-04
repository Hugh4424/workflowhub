import { afterEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createTask, openTask } from '../../runtime/task/task-handle.mjs';
import { bootstrapStage } from '../../runtime/stage/stage-context.mjs';
const roots=[];
afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
async function fixture(taskId,cohort='post'){
 const root=realpathSync(mkdtempSync(join(tmpdir(),'workflowhub-workspace-degrade-')));roots.push(root);const repo=join(root,'repo'),missingPath=join(root,'owned-worktree');mkdirSync(repo);
 const git=args=>execFileSync('git',args,{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();git(['init','-q','-b','main']);git(['config','user.name','Owned workspace degrade']);git(['config','user.email','owned@test.invalid']);writeFileSync(join(repo,'README.md'),'owned baseline\n');git(['add','README.md']);git(['commit','-qm','owned baseline']);git(['worktree','add','-q','-b',`task/WorkspaceDegrade/${taskId}`,missingPath,'main']);
 const manifest={schema_version:'1.0.0',project_name:'WorkspaceDegrade',task_id:taskId,created_at:'2026-09-10T00:00:00Z',target_repo_root:repo,workspace_mode:'existing',workspace_root:missingPath,activation_cohort:cohort,issue_ids:[],inputs:{}};let task;
 if(cohort==='post')task=await createTask({storageRoot:root,manifest:{...manifest,execution_mode:'per_invocation',record_model:'vnext-single-write'}});
 else{const taskPath=join(root,'Projects','WorkspaceDegrade','tasks',taskId);mkdirSync(taskPath,{recursive:true});writeFileSync(join(taskPath,'task.json'),JSON.stringify(manifest,null,2)+'\r\n');task=openTask(taskPath,{projectName:'WorkspaceDegrade',taskId});}
 rmSync(missingPath,{recursive:true,force:true});return{root,task,missingPath};
}
const options=(f,readOnly)=>({projectName:f.task.identity.projectName,taskId:f.task.identity.taskId,taskPath:f.task.taskPath,readOnly});
describe('current readonly stage context physical workspace failure',()=>{
 it('keeps actual ENOENT, missing path and original Error cause visible with passive post/pre/history metadata bytes',async()=>{
  for(const cohort of['post','pre','history']){const f=await fixture(`workspace-degrade-${cohort}`,cohort),path=join(f.task.taskPath,'task.json'),before=readFileSync(path);expect(existsSync(f.missingPath)).toBe(false);const context=await bootstrapStage('build-code',options(f,true));
   expect(context.workspace).toBeUndefined();expect(context.artifacts).toBeUndefined();expect(context.manifest.activation_cohort).toBe(cohort);const d=context.workspace_unavailable;expect(d).toBeTruthy();expect(d.code).toBe('ENOENT');expect(d.path).toBe(f.missingPath);expect(d.message).toContain(f.missingPath);expect(d.cause).toBeInstanceOf(Error);expect(d.cause.code).toBe('ENOENT');expect(d.cause.path).toBe(f.missingPath);expect(readFileSync(path)).toEqual(before);expect(existsSync(f.missingPath)).toBe(false);expect(existsSync(join(f.task.taskPath,'quality'))).toBe(false);}
 });
 it('fails explicitly for the native current writing context without restoring missing workspace or touching metadata',async()=>{
  const f=await fixture('workspace-degrade-write'),path=join(f.task.taskPath,'task.json'),before=readFileSync(path);await expect(bootstrapStage('build-code',options(f,false))).rejects.toMatchObject({code:'ENOENT',path:f.missingPath});expect(readFileSync(path)).toEqual(before);expect(existsSync(f.missingPath)).toBe(false);expect(existsSync(join(f.task.taskPath,'quality'))).toBe(false);
 });
});
