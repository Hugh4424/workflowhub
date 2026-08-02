import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTask } from "../task-handle.mjs";
import { deriveTaskPath } from "../../runtime/task/task-identity.mjs";
import { __setIndexPathForTest, appendTaskIndex, lookupProjectKey, taskIndexEntry } from "../task-index.mjs";

const temporary=[];
function fixture() { const root=realpathSync(mkdtempSync(join(tmpdir(),"task-index-v2-"))); temporary.push(root); return createTask({storageRoot:root,taskPath:deriveTaskPath(root,"Demo","task-aa"),manifest:{schema_version:"1.0.0",project_name:"Demo",task_id:"task-aa",created_at:new Date().toISOString(),target_repo_root:join(root,"repo"),issue_ids:[],inputs:{}}}); }
afterEach(()=>{while(temporary.length)rmSync(temporary.pop(),{recursive:true,force:true});});

describe("task index authenticated manifest projection",()=>{
  it("projects task identity and repository only from TaskHandle",()=>{ expect(taskIndexEntry(fixture())).toEqual({taskId:"task-aa",projectKey:"Demo",repo:expect.stringMatching(/repo$/)}); });
  it("looks up the authenticated task identity",()=>{ expect(lookupProjectKey(fixture(),"task-aa")).toEqual({projectKey:"Demo",repo:expect.stringMatching(/repo$/)}); });
  it("returns null for a different requested task id",()=>{ expect(lookupProjectKey(fixture(),"other-task")).toBeNull(); });
  it("rejects an unbranded task-shaped object",()=>{ expect(()=>lookupProjectKey({identity:{taskId:"task-aa"}},"task-aa")).toThrow(/TaskHandle|capability/i); });
  it("rejects all legacy global-index append writes",()=>{ expect(()=>appendTaskIndex("task-aa","Demo","https://example.test/repo")).toThrow(/removed|manifest/i); });
  it("rejects all legacy caller-controlled index paths",()=>{ expect(()=>__setIndexPathForTest("/tmp/task-index.json")).toThrow(/removed|global task index/i); });
});
