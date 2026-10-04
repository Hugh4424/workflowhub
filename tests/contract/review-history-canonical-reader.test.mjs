// MT6-194: historical review bytes are protected reads, not canonical identity/quality permits.
import { randomUUID } from "node:crypto";
import { existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openTask } from "../../runtime/task/task-handle.mjs";
const roots=[];afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});
function fixture(cohort="post") {
 const root=realpathSync(mkdtempSync(join(tmpdir(),"protected-review-history-")));roots.push(root);
 const taskId=randomUUID(),taskPath=join(root,"Projects","workflowhub","tasks",taskId),repo=join(root,"owned-repository");mkdirSync(repo);mkdirSync(taskPath,{recursive:true});
 const manifest={schema_version:"1.0.0",project_name:"workflowhub",task_id:taskId,target_repo_root:repo,activation_cohort:cohort,snapshot_tree:"passive-old-tree",material_digest:"passive-old-digest"};if(cohort===null)delete manifest.activation_cohort;
 const manifestBytes=Buffer.from(JSON.stringify(manifest,null,2)+"\n");writeFileSync(join(taskPath,"task.json"),manifestBytes);
 return{root,taskId,taskPath,manifestBytes,task:openTask(taskPath,{projectName:"workflowhub",taskId})};
}
function seed(f,ref,bytes){const parts=ref.split("/");parts.pop();mkdirSync(join(f.taskPath,...parts),{recursive:true});writeFileSync(join(f.taskPath,ref),bytes);}
describe("ordinary protected historical review reads",()=>{
 it("reads partial/unavailable report and original bytes for post/pre/history/missing without asserting old identity",()=>{
  for(const cohort of ["post","pre","history",null]){const f=fixture(cohort),ref="quality/reviews/legacy-report.md",bytes=Buffer.concat([Buffer.from("# Historical report\nstatus: unavailable; outcome: partial; old snapshot passive\n"),Buffer.from([0xff,0x00,0x80])]);seed(f,ref,bytes);
   expect(f.task.readRecordBytes(ref)).toEqual(bytes);expect(f.task.readRecord(ref)).toBe(bytes.toString("utf8"));expect(f.task.readRecordBytes("task.json")).toEqual(f.manifestBytes);
  }
 });
 it("lists original result refs in order and exposes malformed JSON without rewriting or authenticating it",()=>{
  const f=fixture("history"),first=Buffer.from('{"status":"unavailable","result_ref":null,"snapshot_tree":"old"}\n'),bad=Buffer.from('{"broken":');seed(f,"quality/reviews/results/z.json",first);seed(f,"quality/reviews/results/a.json",bad);
  expect(f.task.listCanonicalReviewResultRefs()).toEqual(["quality/reviews/results/a.json","quality/reviews/results/z.json"]);
  expect(()=>JSON.parse(f.task.readRecord("quality/reviews/results/a.json"))).toThrow(SyntaxError);
  expect(f.task.readRecordBytes("quality/reviews/results/a.json")).toEqual(bad);expect(f.task.readRecordBytes("quality/reviews/results/z.json")).toEqual(first);expect(f.task.readRecordBytes("task.json")).toEqual(f.manifestBytes);
 });
 it("returns empty for absent historical results and missing reads throw without creating storage",()=>{
  const f=fixture("pre");expect(existsSync(join(f.taskPath,"quality"))).toBe(false);expect(f.task.listCanonicalReviewResultRefs()).toEqual([]);
  expect(()=>f.task.readRecord("quality/reviews/results/missing.json")).toThrow(/ENOENT/);expect(existsSync(join(f.taskPath,"quality"))).toBe(false);expect(readFileSync(join(f.taskPath,"task.json"))).toEqual(f.manifestBytes);
 });
 it("rejects escaped/aliased/multilink records and mismatched task metadata before exposing foreign bytes",()=>{
  const f=fixture(),outside=join(f.root,"outside.json"),outsideBytes=Buffer.from('{"owned_foreign":"must remain outside"}');writeFileSync(outside,outsideBytes);mkdirSync(join(f.taskPath,"quality","reviews"),{recursive:true});
  symlinkSync(outside,join(f.taskPath,"quality","reviews","alias.json"));linkSync(outside,join(f.taskPath,"quality","reviews","hard.json"));
  expect(()=>f.task.readRecordBytes("quality/reviews/alias.json")).toThrow(/single-link regular file/);expect(()=>f.task.readRecordBytes("quality/reviews/hard.json")).toThrow(/single-link regular file/);expect(()=>f.task.readRecordBytes("../outside.json")).toThrow(/remain inside task storage/);
  mkdirSync(join(f.root,"outside-parent"));writeFileSync(join(f.root,"outside-parent","report.json"),outsideBytes);symlinkSync(join(f.root,"outside-parent"),join(f.taskPath,"foreign-parent"));expect(()=>f.task.readRecordBytes("foreign-parent/report.json")).toThrow(/ancestor must be a real directory/);
  expect(()=>openTask(f.taskPath,{projectName:"workflowhub",taskId:"different-owned-id"})).toThrow(/storage path does not match/);
  expect(readFileSync(outside)).toEqual(outsideBytes);expect(readFileSync(join(f.root,"outside-parent","report.json"))).toEqual(outsideBytes);expect(readFileSync(join(f.taskPath,"task.json"))).toEqual(f.manifestBytes);
 });
});
