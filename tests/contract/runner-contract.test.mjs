import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { assertRunnerCompatibility, createRunnerContract } from "../../runtime/interface/runner-contract.mjs";
import { validateRunnerRelease } from "../../runtime/distribution/runner-release.mjs";
const temps=[];
afterEach(()=>temps.splice(0).forEach(root=>fs.rmSync(root,{recursive:true,force:true})));
describe("runner contract",()=>{
 test("accepts matching major and sufficient runner minor",()=>{
  expect(assertRunnerCompatibility({runner_contract_major:2,runner_contract_min_minor:1},createRunnerContract({major:2,minor:3}))).toMatchObject({compatible:true,major:2,runner_minor:3});
 });
 test.each([
  [{},{runner_contract_major:1,runner_contract_minor:0}],
  [{runner_contract_major:1,runner_contract_min_minor:2},{runner_contract_major:1,runner_contract_minor:1}],
  [{runner_contract_major:1,runner_contract_min_minor:0},{runner_contract_major:2,runner_contract_minor:0}],
 ])("fails loud for missing or incompatible contracts",(bundle,runner)=>expect(()=>assertRunnerCompatibility(bundle,runner)).toThrow(/runner contract/i));
 test("the current ordinary release reader rejects extra fields before resolving files",()=>{
  const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),"wh-runner-contract-")));temps.push(root);
  fs.writeFileSync(path.join(root,"runner-release.json"),JSON.stringify({schema_version:1,release:"workflowhub-runner",version:"1.0.0",runner_contract_major:1,runner_contract_minor:0,files:[],surprise:true}));
  expect(()=>validateRunnerRelease({releaseRoot:root,skillBundleManifest:{runner_contract_major:1,runner_contract_min_minor:0}})).toThrow(/manifest schema is invalid/);
 });
});
