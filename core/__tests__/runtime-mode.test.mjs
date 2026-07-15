import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile, spawnSync } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { assertLegacyBridgeReadOnly, assertRuntimeAuthority, quiesceRuntime, readRuntimeMode, rebindRuntimeRoot } from "../runtime-mode.mjs";
const roots=[]; function fixture(){const home=realpathSync(mkdtempSync(join(tmpdir(),"workflowhub-mode-")));roots.push(home);const a=join(home,"a"),b=join(home,"b");mkdirSync(a);mkdirSync(b);return{home,a,b};}
const execFileAsync=promisify(execFile);
afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
describe("runtime cutover authority",()=>{
  it("binds the first active runtime to one storage root and epoch",()=>{const f=fixture(),s=assertRuntimeAuthority(f.a,{home:f.home});expect(s).toMatchObject({mode:"active",storage_root:f.a});expect(readRuntimeMode({home:f.home}).cutover_epoch).toBe(s.cutover_epoch);});
  it("rejects split writes through another root",()=>{const f=fixture();assertRuntimeAuthority(f.a,{home:f.home});expect(()=>assertRuntimeAuthority(f.b,{home:f.home})).toThrow(/root mismatch/i);});
  it("quiescing rejects new stage launches",()=>{const f=fixture(),active=assertRuntimeAuthority(f.a,{home:f.home});const quiet=quiesceRuntime({storageRoot:f.a,home:f.home,expectedEpoch:active.cutover_epoch});expect(quiet.mode).toBe("quiescing");expect(()=>assertRuntimeAuthority(f.a,{home:f.home})).toThrow(/quiescing|refused/i);});
  it("stage-runtime CLI bootstraps through the same runtime authority",()=>{const f=fixture(),active=assertRuntimeAuthority(f.a,{home:f.home});quiesceRuntime({storageRoot:f.a,home:f.home,expectedEpoch:active.cutover_epoch});const child=spawnSync(process.execPath,[join(process.cwd(),"scripts","stage-runtime.mjs"),"run","--stage=build-spec","--project=Demo","--task=blocked","--input=missing.json"],{encoding:"utf8",env:{...process.env,HOME:f.home,WORKFLOWHUB_TASK_DIR:f.a}});expect(child.status).not.toBe(0);expect(child.stderr).toMatch(/quiescing|refused/i);expect(child.stderr).not.toMatch(/ENOENT.*missing\.json/i);});
  it("requires the unchanged epoch to rebind and rejects the old root afterward",()=>{const f=fixture(),active=assertRuntimeAuthority(f.a,{home:f.home});const quiet=quiesceRuntime({storageRoot:f.a,home:f.home,expectedEpoch:active.cutover_epoch});expect(()=>rebindRuntimeRoot({sourceRoot:f.a,targetRoot:f.b,home:f.home,expectedEpoch:"stale"})).toThrow(/epoch/i);const rebound=rebindRuntimeRoot({sourceRoot:f.a,targetRoot:f.b,home:f.home,expectedEpoch:quiet.cutover_epoch});expect(rebound.mode).toBe("active");expect(()=>assertRuntimeAuthority(f.a,{home:f.home})).toThrow(/root mismatch/i);expect(assertRuntimeAuthority(f.b,{home:f.home}).cutover_epoch).toBe(rebound.cutover_epoch);});
  it("keeps the legacy bridge read-only",()=>{const f=fixture(),active=assertRuntimeAuthority(f.a,{home:f.home});quiesceRuntime({storageRoot:f.a,home:f.home,expectedEpoch:active.cutover_epoch});expect(assertLegacyBridgeReadOnly({home:f.home}).mode).toBe("quiescing");expect(()=>assertLegacyBridgeReadOnly({home:f.home,write:true})).toThrow(/read-only/i);});
  it("allows only one of two concurrent different-root initializers to win",async()=>{const f=fixture(),module=pathToFileURL(join(process.cwd(),"core","runtime-mode.mjs")).href;const run=(root)=>execFileAsync(process.execPath,["--input-type=module","-e",`import {assertRuntimeAuthority} from ${JSON.stringify(module)}; assertRuntimeAuthority(${JSON.stringify(root)},{home:${JSON.stringify(f.home)}});`]).then(()=>true,()=>false);const outcomes=await Promise.all([run(f.a),run(f.b)]);expect(outcomes.filter(Boolean)).toHaveLength(1);expect([f.a,f.b]).toContain(readRuntimeMode({home:f.home}).storage_root);});
});
