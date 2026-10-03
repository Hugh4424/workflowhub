import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, linkSync, lstatSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ArtifactDir } from '../../runtime/evidence/artifact-dir.mjs';
const temporaryDirs=[];
function fixture(taskId='paperbuilder-phase-foundation',{artifactRoot=true,cohort='post'}={}){
  const root=realpathSync(mkdtempSync(join(tmpdir(),'workflowhub-artifact-dir-')));temporaryDirs.push(root);
  const worktreeRoot=join(root,'PaperBuilder-worktree');mkdirSync(worktreeRoot);
  const task={identity:{projectName:'PaperBuilder',taskId},manifest:{schema_version:'1.0.0',project_name:'PaperBuilder',task_id:taskId,activation_cohort:cohort}};
  if(artifactRoot)mkdirSync(join(worktreeRoot,'specs',taskId),{recursive:true});return{root,worktreeRoot,task};
}
afterEach(()=>{while(temporaryDirs.length)rmSync(temporaryDirs.pop(),{recursive:true,force:true});});

describe('ArtifactDir controlled current material IO',()=>{
  it('cannot be constructed directly without the private open factory',()=>{
    expect(()=>new ArtifactDir('/tmp/worktree','/tmp/worktree/specs/task')).toThrow(/private|factory|ArtifactDir\.open/i);
  });
  it('derives worktree/specs/${manifest.task_id} from ordinary consistent task metadata',()=>{
    const{worktreeRoot,task}=fixture();const artifacts=ArtifactDir.open(worktreeRoot,task);
    expect(artifacts.root).toBe(join(worktreeRoot,'specs',task.manifest.task_id));expect(artifacts.path('spec.md')).toBe(join(artifacts.root,'spec.md'));
  });
  it('rejects extra caller identity even when it agrees with supplied metadata',()=>{
    const{worktreeRoot,task}=fixture();
    for(const id of['caller-controlled-task',task.manifest.task_id])expect(()=>ArtifactDir.open(worktreeRoot,task,{taskId:id})).toThrow(/task|identity|caller|extra/i);
  });
  it('accepts consistent plain metadata and rejects actual manifest/identity mismatch rather than fake brands',()=>{
    const{worktreeRoot,task}=fixture();const metadata={identity:{...task.identity},manifest:{...task.manifest}};
    expect(ArtifactDir.open(worktreeRoot,metadata).root).toBe(join(worktreeRoot,'specs',task.manifest.task_id));
    expect(()=>ArtifactDir.open(worktreeRoot,{...metadata,identity:{taskId:'wrong'}})).toThrow(/identity.*match/i);
    expect(()=>ArtifactDir.open(worktreeRoot,{...metadata,manifest:{...metadata.manifest,task_id:'../escape'}})).toThrow(/task|identity|unsafe|invalid/i);
    expect(()=>ArtifactDir.open(worktreeRoot,{manifest:metadata.manifest})).toThrow(/identity|metadata/i);
  });
  it('open is read-only and never creates a missing specs tree',()=>{
    const{worktreeRoot,task}=fixture('paperbuilder-phase-foundation',{artifactRoot:false});const specs=join(worktreeRoot,'specs');expect(existsSync(specs)).toBe(false);
    expect(ArtifactDir.open(worktreeRoot,task).root).toBe(join(specs,task.manifest.task_id));expect(existsSync(specs)).toBe(false);
  });
  it.each(['/absolute.md','../escape.md','nested/../../escape.md','nested\\escape.md'])('rejects unsafe relative artifact name %j',relativeName=>{
    const{worktreeRoot,task}=fixture();expect(()=>ArtifactDir.open(worktreeRoot,task).path(relativeName)).toThrow(/absolute|relative|escape|unsafe|segment/i);
  });
  it('rejects actual parent symlink escape on read and awaited atomic write',async()=>{
    const{root,worktreeRoot,task}=fixture(),outside=join(root,'outside');mkdirSync(outside);writeFileSync(join(outside,'secret.md'),'outside');const artifacts=ArtifactDir.open(worktreeRoot,task);symlinkSync(outside,join(artifacts.root,'linked'),'dir');
    expect(()=>artifacts.read('linked/secret.md')).toThrow(/alias|symlink|escape/i);await expect(artifacts.writeAtomic('linked/new.md','bad')).rejects.toThrow(/alias|symlink|escape|directory/i);
    expect(existsSync(join(outside,'new.md'))).toBe(false);expect(readFileSync(join(outside,'secret.md'),'utf8')).toBe('outside');
  });
  it('rejects internal ancestor alias and actual hardlinked leaf without changing original bytes',async()=>{
    const{root,worktreeRoot,task}=fixture(),artifacts=ArtifactDir.open(worktreeRoot,task),inner=join(artifacts.root,'inner');mkdirSync(inner);writeFileSync(join(inner,'original.md'),'owned original');symlinkSync(inner,join(artifacts.root,'alias'),'dir');
    expect(()=>artifacts.read('alias/original.md')).toThrow(/alias|symlink/i);await expect(artifacts.writeAtomic('alias/new.md','bad')).rejects.toThrow(/alias|symlink|directory/i);expect(existsSync(join(inner,'new.md'))).toBe(false);
    const file=join(artifacts.root,'linked.md');writeFileSync(file,'owned linked bytes');linkSync(file,join(root,'owned-second-link.md'));
    expect(()=>artifacts.read('linked.md')).toThrow(/single|one link|link/i);await expect(artifacts.writeAtomic('linked.md','bad')).rejects.toThrow(/single|one link|link/i);
    expect(readFileSync(file,'utf8')).toBe('owned linked bytes');expect(readFileSync(join(inner,'original.md'),'utf8')).toBe('owned original');
  });
  it('reads and writes only the controlled root even when cwd contains bait',async()=>{
    const{root,worktreeRoot,task}=fixture(),baitCwd=join(root,'bait-cwd'),bait=join(baitCwd,'specs',task.manifest.task_id,'spec.md');mkdirSync(join(bait,'..'),{recursive:true});writeFileSync(bait,'bait');
    const artifacts=ArtifactDir.open(worktreeRoot,task);await artifacts.writeAtomic('spec.md','canonical');const previous=process.cwd();process.chdir(baitCwd);
    try{expect(artifacts.read('spec.md')).toBe('canonical');expect(readFileSync(bait,'utf8')).toBe('bait');}finally{process.chdir(previous);}
  });
  it('does not replace inode or real nanosecond timestamp when exact bytes are unchanged',async()=>{
    const{worktreeRoot,task}=fixture(),artifacts=ArtifactDir.open(worktreeRoot,task);await artifacts.writeAtomic('plan.md','same bytes\n');const path=artifacts.path('plan.md'),before=lstatSync(path,{bigint:true});expect(typeof before.mtimeNs).toBe('bigint');
    expect(await artifacts.writeAtomic('plan.md','same bytes\n')).toBe(path);const after=lstatSync(path,{bigint:true});expect(after.ino).toBe(before.ino);expect(after.mtimeNs).toBe(before.mtimeNs);expect(readFileSync(path,'utf8')).toBe('same bytes\n');
    const bytes=Buffer.from([0,255,10]);await artifacts.writeAtomic('raw.bin',bytes);expect(artifacts.read('raw.bin',null)).toEqual(bytes);
  });
  it.each(['before-open','after-open'])('actual filesystem %s window refuses ancestor swap without outside payload bytes',async when=>{
    const{root,worktreeRoot,task}=fixture(),artifacts=ArtifactDir.open(worktreeRoot,task),nested=join(artifacts.root,'nested'),outside=join(root,'outside-race');mkdirSync(nested);mkdirSync(outside);
    const module=fileURLToPath(new URL('../../runtime/evidence/artifact-dir.mjs',import.meta.url));
    const script=`import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';import {ArtifactDir} from ${JSON.stringify('file://'+module)};\nconst data=JSON.parse(process.argv[1]),a=ArtifactDir.open(data.worktreeRoot,data.task);const original=fs.openSync;let fired=false,rejected=false,capturedTempPath=null;\nfs.openSync=function(p,...args){if(!fired&&typeof p==='string'&&p.startsWith(data.nested+'/')&&p.endsWith('.tmp')){fired=true;capturedTempPath=p;if(data.when==='before-open'){fs.renameSync(data.nested,data.nested+'-original');fs.symlinkSync(data.outside,data.nested);return original.call(this,p,...args);}const fd=original.call(this,p,...args);fs.renameSync(data.nested,data.nested+'-original');fs.symlinkSync(data.outside,data.nested);return fd;}return original.call(this,p,...args);};syncBuiltinESMExports();\ntry{try{await a.writeAtomic('nested/result.md','BAD_PAYLOAD_MUST_NOT_ESCAPE');}catch(error){const ownedNamedLoss=data.when==='after-open'&&fired&&error.code==='ENOENT'&&error.path===capturedTempPath;if(!ownedNamedLoss&&!/changed|replaced|symlink|alias|race|directory/i.test(error.message))throw error;rejected=true;}if(!fired||!rejected)throw new Error('actual filesystem race did not fire/refuse');for(const dir of[data.outside,data.nested+'-original']){if(fs.existsSync(dir+'/result.md'))throw new Error('published result escaped');for(const name of fs.readdirSync(dir)){if(fs.readFileSync(dir+'/'+name).length!==0)throw new Error('payload bytes escaped');}}console.log(JSON.stringify({fired,rejected,outsidePayloadBytes:0,retiredPrivateHooks:false}));}finally{fs.openSync=original;syncBuiltinESMExports();}`;
    const raw=execFileSync(process.execPath,['--input-type=module','-e',script,JSON.stringify({when,worktreeRoot,task,nested,outside})],{encoding:'utf8',timeout:10000});expect(JSON.parse(raw)).toEqual({fired:true,rejected:true,outsidePayloadBytes:0,retiredPrivateHooks:false});
    expect(existsSync(join(outside,'result.md'))).toBe(false);expect(existsSync(join(nested+'-original','result.md'))).toBe(false);
  });
  it('pre/history/unknown metadata refuses every write before creating or modifying materials',async()=>{
    for(const cohort of['pre','history',undefined,'unknown']){
      const{worktreeRoot,task}=fixture('paperbuilder-phase-foundation',{artifactRoot:false,cohort});if(cohort===undefined)delete task.manifest.activation_cohort;
      const artifacts=ArtifactDir.open(worktreeRoot,task);await expect(artifacts.writeAtomic('missing/new.md','bad')).rejects.toThrow(/read.only|pre\/history/i);expect(existsSync(join(worktreeRoot,'specs'))).toBe(false);
      mkdirSync(artifacts.root,{recursive:true});writeFileSync(join(artifacts.root,'same.md'),'same');await expect(artifacts.writeAtomic('same.md','same')).rejects.toThrow(/read.only|pre\/history/i);expect(readFileSync(join(artifacts.root,'same.md'),'utf8')).toBe('same');
    }
  });
  it('custom modes and retired private hooks explicitly reject before material effects',async()=>{
    const{worktreeRoot,task}=fixture('paperbuilder-phase-foundation',{artifactRoot:false}),a=ArtifactDir.open(worktreeRoot,task);let fired=false;
    await expect(a.writeAtomic('new.md','bad',{mode:0o644})).rejects.toThrow(/permissions|mode|hooks/i);await expect(a.writeAtomic('new.md','bad',{testHooks:{afterParentPrecheck(){fired=true;}}})).rejects.toThrow(/private|hooks/i);
    expect(fired).toBe(false);expect(existsSync(join(worktreeRoot,'specs'))).toBe(false);
  });
  it('invalidates opened ArtifactDir when its worktree is replaced at the same path',async()=>{
    const{worktreeRoot,task}=fixture(),a=ArtifactDir.open(worktreeRoot,task);renameSync(worktreeRoot,worktreeRoot+'-original');mkdirSync(join(worktreeRoot,'specs',task.identity.taskId),{recursive:true});writeFileSync(join(worktreeRoot,'specs',task.identity.taskId,'spec.md'),'replacement');
    expect(()=>a.path('new.md')).toThrow(/changed|replaced|stale|identity/i);expect(()=>a.read('spec.md')).toThrow(/changed|replaced|stale|identity/i);await expect(a.writeAtomic('new.md','bad')).rejects.toThrow(/changed|replaced|stale|identity/i);
    expect(existsSync(join(worktreeRoot,'specs',task.identity.taskId,'new.md'))).toBe(false);expect(readFileSync(join(worktreeRoot,'specs',task.identity.taskId,'spec.md'),'utf8')).toBe('replacement');
  });
  it('invalidates opened ArtifactDir when only its artifact root is replaced',async()=>{
    const{worktreeRoot,task}=fixture(),a=ArtifactDir.open(worktreeRoot,task);renameSync(a.root,a.root+'-original');mkdirSync(a.root);writeFileSync(join(a.root,'spec.md'),'replacement');
    expect(()=>a.path('new.md')).toThrow(/changed|replaced|stale|identity/i);expect(()=>a.read('spec.md')).toThrow(/changed|replaced|stale|identity/i);await expect(a.writeAtomic('new.md','bad')).rejects.toThrow(/changed|replaced|stale|identity/i);expect(existsSync(join(a.root,'new.md'))).toBe(false);expect(readFileSync(join(a.root,'spec.md'),'utf8')).toBe('replacement');
  });
});
