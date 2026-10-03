// Ordinary tools③⑤ replace the retired current-quality/reflection object graph.
import {afterEach,expect,it} from "vitest";
import {execFile} from "node:child_process";import {promisify} from "node:util";
import {existsSync,mkdirSync,mkdtempSync,readFileSync,realpathSync,rmSync,symlinkSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";import {join} from "node:path";
import {createFileOnce,writeFileAtomic} from "../../runtime/interface/safe-write.mjs";
import {withLock} from "../../runtime/interface/record-lock.mjs";
const roots=[];afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
function owned(){const p=realpathSync(mkdtempSync(join(tmpdir(),"ordinary-concurrency-")));roots.push(p);return p;}
const child=promisify(execFile),safe=new URL("../../runtime/interface/safe-write.mjs",import.meta.url).href,lock=new URL("../../runtime/interface/record-lock.mjs",import.meta.url).href;
it("keeps same-content EEXIST publication idempotent, differing bytes conflict and preserve original",async()=>{
 const root=owned();const program=`import*as fs from'node:fs';import{syncBuiltinESMExports}from'node:module';const original=fs.default.linkSync;let fired=false;fs.default.linkSync=(from,to)=>{if(!fired){fired=true;fs.writeFileSync(to,fs.readFileSync(from));}return original(from,to);};syncBuiltinESMExports();const{createFileOnce}=await import(${JSON.stringify(safe)});const result=await createFileOnce(process.argv[1],'fact.json','owned original');process.stdout.write(JSON.stringify({fired,result}));`;
 const r=JSON.parse((await child(process.execPath,["--input-type=module","-e",program,root],{timeout:10000})).stdout);expect(r.fired).toBe(true);expect(r.result.idempotent).toBe(true);expect(readFileSync(join(root,"fact.json"),"utf8")).toBe("owned original");
 await expect(createFileOnce(root,"fact.json","changed bytes")).rejects.toMatchObject({code:"RECORD_CONFLICT"});expect(readFileSync(join(root,"fact.json"),"utf8")).toBe("owned original");
});
it("refuses aliased storage before atomic writes and lock callbacks",async()=>{
 const root=owned(),outside=join(root,"outside"),alias=join(root,"alias");mkdirSync(outside);symlinkSync(outside,alias);let calls=0;
 await expect(writeFileAtomic(alias,"fact.json","must not escape")).rejects.toMatchObject({code:"SYMLINK_TARGET"});await expect(withLock(alias,"fact",async()=>{calls++;})).rejects.toMatchObject({code:"SYMLINK_TARGET"});expect(calls).toBe(0);expect(existsSync(join(outside,"fact.json"))).toBe(false);
});
it("two real processes serialize ordinary updates and append separate immutable originals",async()=>{
 const root=owned();writeFileSync(join(root,"counter.json"),"0");const program=`import{readFileSync}from'node:fs';import{join}from'node:path';import{withLock}from ${JSON.stringify(lock)};import{appendRecord,writeFileAtomic,createFileOnce}from ${JSON.stringify(safe)};const root=process.argv[1];const first=await createFileOnce(root,'shared.txt','same original');const path=await withLock(root,'ordinary',async()=>{const n=JSON.parse(readFileSync(join(root,'counter.json'),'utf8'));await new Promise(r=>setTimeout(r,30));await writeFileAtomic(root,'counter.json',JSON.stringify(n+1));return appendRecord(root,'reflection','json',JSON.stringify({status:'unavailable',observed_at:process.argv[2]}));});console.log(JSON.stringify({first,path}));`;
 const results=await Promise.all(["2026-08-31T01:00:00Z","2026-08-31T02:00:00Z"].map(now=>child(process.execPath,["--input-type=module","-e",program,root,now],{timeout:15000}).then(r=>JSON.parse(r.stdout))));
 expect(JSON.parse(readFileSync(join(root,"counter.json"),"utf8"))).toBe(2);expect(results[0].path).not.toBe(results[1].path);expect(new Set(results.map(r=>JSON.parse(readFileSync(r.path,"utf8")).observed_at)).size).toBe(2);expect(results.map(r=>r.first.idempotent).sort()).toEqual([false,true]);expect(readFileSync(join(root,"shared.txt"),"utf8")).toBe("same original");expect(existsSync(join(root,".ordinary.lock"))).toBe(false);
});
