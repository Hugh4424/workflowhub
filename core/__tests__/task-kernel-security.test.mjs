import {afterEach,describe,expect,it} from "vitest";
import {execFileSync,spawnSync} from "node:child_process";
import {mkdirSync,mkdtempSync,readFileSync,realpathSync,rmSync,writeFileSync,existsSync,readdirSync,symlinkSync,linkSync} from "node:fs";
import {tmpdir} from "node:os";import{join}from"node:path";
const roots=[];afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
function env(){const e={...process.env};for(const k of Object.keys(e))if(k.startsWith("GIT_"))delete e[k];return e;}
const git=(cwd,...args)=>execFileSync("git",args,{cwd,env:env(),encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
function root(){const p=realpathSync(mkdtempSync(join(tmpdir(),"card06-ordinary-consumer-")));roots.push(p);return p;}
function repository(p){mkdirSync(p);git(p,"init","-q","-b","main");git(p,"config","user.name","Owned ordinary test");git(p,"config","user.email","owned@test.invalid");writeFileSync(join(p,"README.md"),"owned baseline\n");git(p,"add",".");git(p,"commit","-qm","baseline");}

const auth=new URL("../../runtime/interface/git-authorize.mjs",import.meta.url).href;
function fixture(){const r=root(),repo=join(r,"repo"),dir=join(r,"grants");repository(repo);mkdirSync(dir);return{r,repo,dir};}
function call(f,method,value){const script=`import{record,consume}from${JSON.stringify(auth)};try{const result=await ${method}(JSON.parse(process.argv[1]));console.log(JSON.stringify({ok:true,result}));}catch(error){console.log(JSON.stringify({ok:false,error:{code:error.code,message:error.message}}));}`;return JSON.parse(execFileSync(process.execPath,["--input-type=module","-e",script,JSON.stringify({...value,dir:f.dir})],{cwd:f.repo,env:env(),encoding:"utf8",stdio:["ignore","pipe","pipe"]}));}
describe("ordinary close authorization cannot cross step or operation",()=>{
 it("retries the same close step without consuming another authorization",()=>{const f=fixture(),g=call(f,"record",{operation:"archive",confirmationRef:"owned-human-confirmation.json"});expect(g.ok).toBe(true);const first=call(f,"consume",{operation:"archive",stepId:"archive-1"});expect(first.ok).toBe(true);const bytes=readFileSync(first.result.path),names=readdirSync(f.dir);expect(call(f,"consume",{operation:"archive",stepId:"archive-1"})).toEqual(first);expect(readFileSync(first.result.path)).toEqual(bytes);expect(readdirSync(f.dir)).toEqual(names);});
 it("rejects reuse across close steps and operations without changing existing originals",()=>{const f=fixture();expect(call(f,"record",{operation:"archive",confirmationRef:"human-original.json"}).ok).toBe(true);expect(call(f,"consume",{operation:"archive",stepId:"archive-1"}).ok).toBe(true);const names=readdirSync(f.dir),originals=names.map(n=>readFileSync(join(f.dir,n)));expect(call(f,"consume",{operation:"archive",stepId:"archive-2"})).toMatchObject({ok:false,error:{code:"AUTHORIZATION_ALREADY_CONSUMED"}});expect(call(f,"consume",{operation:"cleanup",stepId:"archive-1"})).toMatchObject({ok:false,error:{code:"IRREVERSIBLE_AUTHORIZATION_REQUIRED"}});expect(readdirSync(f.dir)).toEqual(names);expect(names.map(n=>readFileSync(join(f.dir,n)))).toEqual(originals);});
});
