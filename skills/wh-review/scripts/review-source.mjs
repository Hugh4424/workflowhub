import {execFileSync} from "node:child_process";
import {lstatSync,realpathSync,mkdtempSync,writeFileSync,rmSync,openSync,closeSync,fstatSync,constants} from "node:fs";
import {join,resolve} from "node:path";
import {compactReviewDiff,gitDiffPath} from "../../../runtime/review/review-input-bounds.mjs";
function git(root,args){const env={...process.env};for(const key of Object.keys(env))if(key.startsWith("GIT_"))delete env[key];env.GIT_OPTIONAL_LOCKS="0";return execFileSync("git",args,{cwd:root,env,encoding:"utf8",maxBuffer:64*1024*1024,stdio:["ignore","pipe","pipe"]});}
/** Capture explicit source Git facts and a selected diff. No worktree/tree copy,
 * private snapshot commit, canonical receipt, or freshness permission is made. */
export function captureReviewSource({sourceRoot,workspace=null,targetRepoRoot=null,baselineCommit=null,reviewDataRoot,includeDiff=true,writeSet=undefined,repositoryId=null,secureRead=false,expectedHead=null,expectedBranch=null}={}) {
 if(secureRead)return captureDescriptorSource({sourceRoot:sourceRoot ?? workspace?.worktreeRoot,targetRepoRoot:targetRepoRoot ?? workspace?.repoRoot,baselineCommit:baselineCommit ?? workspace?.baselineCommit,reviewDataRoot,writeSet,repositoryId,expectedHead,expectedBranch});
 const root=resolve(sourceRoot ?? workspace?.worktreeRoot);if(realpathSync(root)!==root||!lstatSync(root).isDirectory())throw new Error("SOURCE_UNAVAILABLE: source path alias or not directory");
 const top=realpathSync(git(root,["rev-parse","--show-toplevel"]).trim());if(top!==root)throw new Error("SOURCE_UNAVAILABLE: exact Git worktree root required");
 const capturedHead=git(root,["rev-parse","--verify","HEAD"]).trim();const base=baselineCommit ?? workspace?.baselineCommit ?? capturedHead;git(root,["cat-file","-e",`${base}^{commit}`]);
 const result={sourceRoot:root,targetRepoRoot:targetRepoRoot ?? root,capturedHead,baseCommit:base,dispose(){}};
 if(!includeDiff)return result;
 const data=resolve(reviewDataRoot);if(realpathSync(data)!==data||!lstatSync(data).isDirectory())throw new Error("SOURCE_UNAVAILABLE: real review data root required");
 const temporary=mkdtempSync(join(data,"review-source-"));
 try {
  let text=git(root,["diff","--binary","--no-ext-diff","--no-textconv",base,"--"]);
  for(const path of git(root,["ls-files","--others","--exclude-standard","-z"]).split('\0').filter(Boolean)){
   if(writeSet!==undefined&&!writeSet.includes(path))continue;
   if(!safeSourcePath(path))throw new Error('SOURCE_UNAVAILABLE: unsafe untracked path');
   let cursor=root;for(const part of path.split('/')){cursor=join(cursor,part);const st=lstatSync(cursor);if(st.isSymbolicLink()||realpathSync(cursor)!==cursor)throw new Error('SOURCE_UNAVAILABLE: source path alias');}
   const st=lstatSync(cursor);if(!st.isFile()||st.nlink!==1)throw new Error('SOURCE_UNAVAILABLE: untracked source is not regular');
   try{text+=git(root,['diff','--no-index','--binary','--no-ext-diff','--no-textconv','--','/dev/null',path]);}
   catch(error){if(error.status!==1)throw error;text+=error.stdout;}
  }
  const diff=compactReviewDiff(text,{writeSet}).diff;const diffPath=join(temporary,"changes.diff");writeFileSync(diffPath,diff,{flag:"wx",mode:0o600});
  const changedPaths=[...new Set((diff.match(/^diff --git .+$/gm)??[]).map(line=>{const tokens=line.slice(11).match(/"(?:\\.|[^"\\])*"|\S+/g);if(tokens?.length!==2)throw new Error('SOURCE_UNAVAILABLE: invalid diff header');return gitDiffPath(tokens[1]);}))];
  return {...result,diffPath,diffBytes:Buffer.byteLength(diff),changedPaths,dispose(){rmSync(temporary,{recursive:true,force:true});}};
 }
 catch(error){rmSync(temporary,{recursive:true,force:true});throw error;}
}

const safeSourcePath=path=>typeof path==='string'&&path.length>0&&!path.startsWith('/')&&!/^[A-Za-z]:/.test(path)&&!/[\\\0*?\[\]{}\x01-\x1f]/.test(path)&&!path.split('/').some(part=>!part||part==='.'||part==='..');

// Opt-in multi-repository capture only. Current business files are read via
// held directory FDs; Git may read metadata and exact base objects, never a
// business current pathname. Patch inputs contain those same captured bytes.
const descriptorSourceWorker=String.raw`
import os,sys,json,stat,subprocess,tempfile,base64,hashlib
p=json.load(sys.stdin);held=[];ancestors=[]
def fail(message):raise RuntimeError('SOURCE_UNAVAILABLE: '+message)
def identity(s):return (s.st_dev,s.st_ino)
def stamp(s):return (s.st_dev,s.st_ino,s.st_size,s.st_mtime_ns,s.st_ctime_ns,s.st_mode,s.st_nlink)
def verify():
 for parent,name,fd,before in ancestors:
  current=os.stat(name,dir_fd=parent,follow_symlinks=False)
  if not stat.S_ISDIR(current.st_mode) or identity(current)!=identity(before) or identity(os.fstat(fd))!=identity(before):fail('ancestor changed')
def directory(parent,name):
 before=os.stat(name,dir_fd=parent,follow_symlinks=False)
 if not stat.S_ISDIR(before.st_mode):fail('directory alias')
 fd=os.open(name,flags,dir_fd=parent);held.append(fd)
 if identity(os.fstat(fd))!=identity(before):fail('directory changed')
 ancestors.append((parent,name,fd,before));return fd
env={k:v for k,v in os.environ.items() if not k.startswith('GIT_')};env['GIT_OPTIONAL_LOCKS']='0'
def git(args,allowed=(0,)):
 verify()
 r=subprocess.run(['git','--no-optional-locks','-c','core.fsmonitor=false','-c','core.hooksPath=/dev/null','-c','diff.external=','-c','protocol.allow=never']+args,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 verify()
 if r.returncode not in allowed:fail('Git command failed: '+r.stderr.decode('utf8','replace'))
 return r.stdout
def metadata():
 return (git(['rev-parse','--show-toplevel']).decode().strip(),git(['rev-parse','--git-common-dir']).decode().strip(),git(['rev-parse','--verify','HEAD']).decode().strip(),git(['symbolic-ref','--quiet','--short','HEAD']).decode().strip())
def current(path):
 verify();parent=rootfd;parts=path.split('/')
 try:
  for part in parts[:-1]:parent=directory(parent,part)
 except FileNotFoundError:return None,None
 try:before=os.stat(parts[-1],dir_fd=parent,follow_symlinks=False)
 except FileNotFoundError:return None,None
 if not stat.S_ISREG(before.st_mode) or before.st_nlink!=1:fail('not a single-link regular source: '+path)
 fd=os.open(parts[-1],os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK,dir_fd=parent);held.append(fd)
 if stamp(os.fstat(fd))!=stamp(before):fail('source changed: '+path)
 verify();data=b''
 while True:
  part=os.read(fd,1024*1024)
  if not part:break
  data+=part
 if stamp(os.fstat(fd))!=stamp(before) or stamp(os.stat(parts[-1],dir_fd=parent,follow_symlinks=False))!=stamp(before):fail('source changed: '+path)
 verify();return data,(parent,parts[-1],before)
def quote(path):return json.dumps(path,ensure_ascii=False)
def patch(path,old,new,oldmode,newmode):
 if old==new and oldmode==newmode:return ''
 with tempfile.TemporaryDirectory(prefix='wh-review-file-') as temp:
  a=os.path.join(temp,'old');b=os.path.join(temp,'new')
  if old is not None:
   with open(a,'xb') as f:f.write(old)
  if new is not None:
   with open(b,'xb') as f:f.write(new)
  raw=git(['diff','--no-index','--binary','--no-renames','--no-ext-diff','--no-textconv','--',a if old is not None else '/dev/null',b if new is not None else '/dev/null'],(0,1)).decode('utf8')
 lines=raw.splitlines(keepends=True)
 if not lines and old is not None and new is not None and oldmode!=newmode:lines=['diff --git '+quote('a/'+path)+' '+quote('b/'+path)+'\n']
 # Only header lines precede the first hunk; source +++ remains source text.
 for i,line in enumerate(lines):
  if line.startswith('@@ ') or line.startswith('GIT binary patch'):break
  if line.startswith('diff --git '):lines[i]='diff --git '+quote('a/'+path)+' '+quote('b/'+path)+'\n'
  elif line.startswith('--- '):lines[i]='--- '+('/dev/null' if old is None else quote('a/'+path))+'\n'
  elif line.startswith('+++ '):lines[i]='+++ '+('/dev/null' if new is None else quote('b/'+path))+'\n'
  elif line.startswith('new file mode '):lines[i]='new file mode '+newmode+'\n'
  elif line.startswith('deleted file mode '):lines[i]='deleted file mode '+oldmode+'\n'
 if old is not None and new is not None and oldmode!=newmode:lines[1:1]=['old mode '+oldmode+'\n','new mode '+newmode+'\n']
 return ''.join(lines)
try:
 if os.open not in os.supports_dir_fd or not hasattr(os,'fchdir') or not hasattr(os,'O_NOFOLLOW') or not hasattr(os,'O_DIRECTORY'):fail('dirfd capability missing')
 flags=os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW
 if p['root']!=os.path.normpath(p['root']) or not os.path.isabs(p['root']):fail('noncanonical root')
 rootfd=os.open('/',flags);held.append(rootfd)
 for part in p['root'].split('/')[1:]:rootfd=directory(rootfd,part)
 inherited=os.fstat(3)
 if not os.get_inheritable(3) or not stat.S_ISDIR(inherited.st_mode) or identity(inherited)!=identity(os.fstat(rootfd)) or identity(inherited)!=(int(p['rootDevice']),int(p['rootInode'])):fail('root descriptor inheritance or identity mismatch')
 os.fchdir(rootfd);verify()
 if p.get('material'):
  data,item=current(p['material'])
  if data is None or hashlib.sha256(data).hexdigest()!=p['sha256']:fail('material missing or changed')
  data.decode('utf8');sys.stdout.write(base64.b64encode(data).decode());sys.exit(0)
 before=metadata()
 if before[0]!=p['root'] or before[2]!=p['expectedHead'] or before[3]!=p['expectedBranch']:fail('Git identity mismatch')
 common=os.path.normpath(os.path.join(p['root'],before[1]))
 if p['targetRepoRoot']!=p['root'] and common!=os.path.join(p['targetRepoRoot'],'.git'):fail('Git common directory mismatch')
 git(['cat-file','-e',p['base']+'^{commit}'])
 result={'diff':'','files':{},'changedPaths':[],'capturedHead':before[2],'baseCommit':p['base']};observed=[]
 for path in p['paths']:
  tree=git(['ls-tree','-z',p['base'],'--',path]);old=None;oldmode=None
  if tree:
   entries=tree.split(b'\0')[:-1]
   if len(entries)!=1:fail('ambiguous base path')
   header,name=entries[0].split(b'\t',1);mode,kind,oid=header.split()
   if name.decode('utf8')!=path or kind!=b'blob' or mode not in (b'100644',b'100755'):fail('unsupported base source')
   old=git(['cat-file','blob',oid.decode()]);oldmode=mode.decode()
  new,item=current(path);observed.append((path,item))
  newmode=None if item is None else ('100755' if item[2].st_mode&0o111 else '100644')
  target='repos/'+p['id']+'/'+path;text=patch(target,old,new,oldmode,newmode)
  if text:
   result['diff']+=text;result['changedPaths'].append(target)
   if new is not None:result['files'][target]=base64.b64encode(new).decode()
 verify()
 for path,item in observed:
  if item is not None:
   parent,name,s=item
   if stamp(os.stat(name,dir_fd=parent,follow_symlinks=False))!=stamp(s):fail('source changed: '+path)
  else:
   data,item=current(path)
   if data is not None:fail('missing source appeared: '+path)
 if metadata()!=before:fail('Git identity changed')
 print(json.dumps(result))
except Exception as e:print(str(e),file=sys.stderr);sys.exit(2)
finally:
 for fd in reversed(held):os.close(fd)
`;

function captureDescriptorSource({sourceRoot,targetRepoRoot,baselineCommit,reviewDataRoot,writeSet,repositoryId,expectedHead,expectedBranch}){
 if(typeof sourceRoot!=='string'||resolve(sourceRoot)!==sourceRoot||!Array.isArray(writeSet)||writeSet.some(path=>!safeSourcePath(path))||!['wh','pb'].includes(repositoryId)||!expectedHead||!expectedBranch||!baselineCommit)throw new Error('SOURCE_UNAVAILABLE: exact trusted source scope required');
 const data=resolve(reviewDataRoot);if(realpathSync(data)!==data||!lstatSync(data).isDirectory())throw new Error('SOURCE_UNAVAILABLE: real review data root required');
 let captured;
 try{captured=JSON.parse(runDescriptorWorker(sourceRoot,{targetRepoRoot:targetRepoRoot ?? sourceRoot,base:baselineCommit,expectedHead,expectedBranch,paths:writeSet,id:repositoryId}));}
 catch(error){throw Object.assign(new Error(`SOURCE_UNAVAILABLE: secure source capture failed: ${error.stderr?.toString() ?? error.message}`),{code:'SOURCE_UNAVAILABLE',cause:error});}
 const temporary=mkdtempSync(join(data,'review-source-'));
 try{const diffPath=join(temporary,'changes.diff');writeFileSync(diffPath,captured.diff,{flag:'wx',mode:0o600});return{sourceRoot,targetRepoRoot:targetRepoRoot ?? sourceRoot,capturedHead:captured.capturedHead,baseCommit:captured.baseCommit,repositoryId,diffPath,diffBytes:Buffer.byteLength(captured.diff),changedPaths:captured.changedPaths,selectedPaths:writeSet.map(path=>`repos/${repositoryId}/${path}`),sourceBytes:Object.fromEntries(Object.entries(captured.files).map(([path,bytes])=>[path,Buffer.from(bytes,'base64')])),dispose(){rmSync(temporary,{recursive:true,force:true});}};}
 catch(error){rmSync(temporary,{recursive:true,force:true});throw error;}
}

export function readScopedReviewMaterial({sourceRoot,ref,sha256}){
 if(typeof sourceRoot!=='string'||resolve(sourceRoot)!==sourceRoot||!safeSourcePath(ref)||!/^[a-f0-9]{64}$/.test(sha256??''))throw new Error('SOURCE_UNAVAILABLE: invalid scoped material');
 try{return Buffer.from(runDescriptorWorker(sourceRoot,{material:ref,sha256}),'base64').toString('utf8');}
 catch(error){throw Object.assign(new Error(`SOURCE_UNAVAILABLE: secure material read failed: ${error.stderr?.toString()??error.message}`),{code:'SOURCE_UNAVAILABLE',cause:error});}
}

function runDescriptorWorker(root,input){
 if(!Number.isInteger(constants.O_DIRECTORY)||!Number.isInteger(constants.O_NOFOLLOW))throw new Error('SOURCE_UNAVAILABLE: root descriptor capability missing');
 const named=lstatSync(root,{bigint:true});if(!named.isDirectory()||named.isSymbolicLink()||realpathSync(root)!==root)throw new Error('SOURCE_UNAVAILABLE: root alias');
 const fd=openSync(root,constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW);
 try{
  const opened=fstatSync(fd,{bigint:true});if(opened.dev!==named.dev||opened.ino!==named.ino||!opened.isDirectory())throw new Error('SOURCE_UNAVAILABLE: root changed before capture');
  return execFileSync('python3',['-c',descriptorSourceWorker],{input:JSON.stringify({...input,root,rootDevice:String(opened.dev),rootInode:String(opened.ino)}),encoding:'utf8',maxBuffer:64*1024*1024,stdio:['pipe','pipe','pipe',fd]});
 }finally{closeSync(fd);}
}
