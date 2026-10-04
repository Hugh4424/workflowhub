import {afterEach,describe,it,expect}from'vitest';
import{mkdtempSync,realpathSync,mkdirSync,writeFileSync,readFileSync,readdirSync,existsSync,rmSync}from'node:fs';import{tmpdir}from'node:os';import{join,resolve}from'node:path';
import{resolveCanonicalTaskPath}from'../../runtime/task/load-config.mjs';
const roots=[];afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
function fixture(){const root=realpathSync(mkdtempSync(join(tmpdir(),'current-task-path-')));roots.push(root);const home=join(root,'owned-home'),configHome=join(root,'owned-config');mkdirSync(home);mkdirSync(join(configHome,'workflowhub'),{recursive:true});return{root,home,configHome,config:join(configHome,'workflowhub','config.json'),env:{XDG_CONFIG_HOME:configHome}};}
describe('current canonical task path launcher reader',()=>{
 it('uses explicit global storage env and preserves ordinary identity while deriving one canonical project task leaf',()=>{
  const f=fixture(),storage=join(f.root,'env-store');writeFileSync(f.config,JSON.stringify({task_dir:join(f.root,'configured-store')}));const input={project:' Demo ',task:' owned-task ',env:{...f.env,WORKFLOWHUB_TASK_DIR:storage},home:f.home},before=JSON.stringify(input),r=resolveCanonicalTaskPath(input);
  expect(r).toEqual({project:'Demo',task:'owned-task',taskPath:join(storage,'Projects','Demo','tasks','owned-task'),source:'canonical_resolver',storage_root:storage});expect(Object.isFrozen(r)).toBe(true);expect(JSON.stringify(input)).toBe(before);expect(existsSync(storage)).toBe(false);
 });
 it('uses actual task_dir JSON and home default without registry or a new material/config writer',()=>{
  const f=fixture(),store=join(f.root,'configured-store'),raw=JSON.stringify({task_dir:store})+'\n';writeFileSync(f.config,raw);const configured=resolveCanonicalTaskPath({project:'Demo',task:'owned-task',env:f.env,home:f.home});expect(configured.storage_root).toBe(store);expect(configured.taskPath).toBe(join(store,'Projects','Demo','tasks','owned-task'));expect(readFileSync(f.config,'utf8')).toBe(raw);expect(existsSync(store)).toBe(false);
  const fallback=resolveCanonicalTaskPath({project:'Demo',task:'owned-task',env:{},home:f.home});expect(fallback.source).toBe('canonical_resolver');expect(fallback.storage_root).toBe(f.home);expect(fallback.taskPath).toBe(join(f.home,'Projects','Demo','tasks','owned-task'));expect(readdirSync(f.home)).toEqual([]);
 });
 it('labels absolute diagnostic overrides distinctly and never creates or authenticates their task directory',()=>{
  const f=fixture(),target=join(f.root,'not-created','..','override-leaf'),r=resolveCanonicalTaskPath({project:'Demo',task:'owned-task',taskPath:target,env:f.env,home:f.home});expect(r).toEqual({project:'Demo',task:'owned-task',taskPath:resolve(target),source:'diagnostic_override'});expect(r).not.toHaveProperty('storage_root');expect(existsSync(r.taskPath)).toBe(false);
  for(const bad of ['','relative/task',123])expect(()=>resolveCanonicalTaskPath({project:'Demo',task:'owned-task',taskPath:bad,env:f.env,home:f.home})).toThrow(/taskPath.*absolute|taskPath.*non.empty/i);
 });
 it('rejects unsafe or missing project/task identity even when an absolute override is supplied, with no task storage effects',()=>{
  const f=fixture();for(const[field,bad]of [['project',''],['project','../outside'],['project','bad/project'],['task',''],['task','..'],['task','bad\\task'],['task','bad..task']]){const input={project:'Demo',task:'owned-task',taskPath:join(f.root,'override'),env:f.env,home:f.home,[field]:bad};expect(()=>resolveCanonicalTaskPath(input)).toThrow(/project_name|task_id|safe.*segment|required/);}
  expect(existsSync(join(f.root,'override'))).toBe(false);expect(readdirSync(f.configHome)).toEqual(['workflowhub']);expect(readdirSync(join(f.configHome,'workflowhub'))).toEqual([]);
 });
 it('surfaces malformed current JSON and invalid global roots instead of restoring retired M2 registry shape predicates',()=>{
  const f=fixture();for(const bytes of ['{bad-json}',JSON.stringify([]),JSON.stringify({}),JSON.stringify({task_dir:''}),JSON.stringify({task_dir:'relative-store'})]){writeFileSync(f.config,bytes);expect(()=>resolveCanonicalTaskPath({project:'Demo',task:'owned-task',env:f.env,home:f.home})).toThrow(/invalid.*JSON|JSON object|task_dir|absolute/);expect(readFileSync(f.config,'utf8')).toBe(bytes);}
  writeFileSync(f.config,JSON.stringify({task_dir:join(f.root,'store')}));for(const bad of ['relative-store',join(f.root,'Projects','Demo','tasks')])expect(()=>resolveCanonicalTaskPath({project:'Demo',task:'owned-task',env:{...f.env,WORKFLOWHUB_TASK_DIR:bad},home:f.home})).toThrow(/absolute|legacy.*semantics/);
  expect(existsSync(join(f.root,'Projects'))).toBe(false);expect(existsSync(join(f.root,'store'))).toBe(false);
 });
});
