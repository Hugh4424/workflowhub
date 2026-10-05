import { afterEach, expect, test } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { linkSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bootstrapTask } from "../../tools/cli/task-bootstrap.mjs";
import { buildReviewMaterials } from "../../skills/wh-review/scripts/review-materials.mjs";

const roots = [];
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const text = "# Original material\r\n中文原字节\n";
const cli = new URL("../../tools/cli/stage-runtime.mjs", import.meta.url).href;
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
function environment() { const env = { ...process.env }; for (const key of Object.keys(env)) if (key.startsWith("GIT_")) delete env[key]; return env; }
function git(cwd, ...argv) { return execFileSync("git", argv, { cwd, env: environment(), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
async function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "card09-material-ref-"))); roots.push(root);
  const repo = join(root, "repo"), storage = join(root, "storage"), home = join(root, "home");
  for (const path of [repo, storage, home]) mkdirSync(path);
  git(repo, "init", "-q", "-b", "main"); git(repo, "config", "user.name", "Material ref fixture"); git(repo, "config", "user.email", "fixture@test.invalid");
  writeFileSync(join(repo, "README.md"), "fixture\n"); git(repo, "add", "."); git(repo, "commit", "-qm", "fixture baseline");
  const boot = await bootstrapTask({ project: "MaterialRef", task: "material-ref", "target-repo": repo }, { env: { HOME: home, WORKFLOWHUB_TASK_DIR: storage }, home, cwd: repo });
  const wt = boot.workspace.worktree_root, taskPath = boot.task_path;
  const relative = "quality/evidence/original.md"; mkdirSync(join(taskPath, "quality/evidence"), { recursive: true }); writeFileSync(join(taskPath, relative), text);
  writeFileSync(join(wt, "original.md"), text);
  return { root, wt, taskPath, home, storage, relative };
}
function invoke(f, materials, race = null) {
  const input = join(f.wt, "request.json"); writeFileSync(input, JSON.stringify({ request: { stage: "build-plan", materials } }));
  const code = `import fs from "node:fs"; import cp from "node:child_process"; import {syncBuiltinESMExports} from "node:module"; import { stageRuntimeMain } from ${JSON.stringify(cli)};
    const race=${JSON.stringify(race)}; let raceTriggered=false; let reads=0; const original=fs.lstatSync;
    if(race) {
      const originalOpen=fs.openSync;
      fs.lstatSync=function(path,...args) { if(String(path)===race.file && ++reads===2) { fs.renameSync(race.parent,race.held);fs.symlinkSync(race.outside,race.parent);raceTriggered=true; } return original(path,...args); };
      fs.openSync=function(path,...args) { const fd=originalOpen(path,...args);if(race.mode==='aba'&&String(path)===race.file&&raceTriggered){fs.unlinkSync(race.parent);fs.renameSync(race.held,race.parent);}return fd; };
      const originalSpawn=cp.spawnSync;
      cp.spawnSync=function(command,args,options){
        const index=args?.findIndex(value=>typeof value==='string'&&value.startsWith('// CARD09_MATERIAL_CWD_READER'))??-1;
        if(index>=0){
          const injection='import attackFS from "node:fs";const attack='+JSON.stringify(race)+';const attackChdir=process.chdir.bind(process),attackOpen=attackFS.openSync;let attacked=false;process.chdir=function(component){if(!attacked&&component==="race"){if(attack.mode==="chdir") {attackFS.renameSync(attack.parent,attack.held);attackFS.symlinkSync(attack.outside,attack.parent);attackFS.writeFileSync(attack.marker,"actual ancestor replacement");attacked=true;}return attackChdir(component);}return attackChdir(component);};attackFS.openSync=function(name,...flags){if(!attacked&&name==="input.md"){attackFS.renameSync(attack.parent,attack.held);attackFS.symlinkSync(attack.outside,attack.parent);attackFS.writeFileSync(attack.marker,"actual ancestor replacement");attacked=true;const fd=attackOpen(name,...flags);if(attack.mode==="aba"){attackFS.unlinkSync(attack.parent);attackFS.renameSync(attack.held,attack.parent);}return fd;}return attackOpen(name,...flags);};';
          args=[...args];args[index]=injection+'\\n'+args[index];
        }return originalSpawn.call(this,command,args,options);
      };syncBuiltinESMExports();
    }
    let received=null; try { const result=await stageRuntimeMain(JSON.parse(process.argv[1]), { services: { runReviewRound: async(request)=>{ received=request.materials; return {status:"unavailable",dispatch_state:"blocked_before_dispatch",provider_results:[],findings:[],error:{code:"NO_PROVIDER",message:"construction only"}}; } } }); console.log(JSON.stringify({ok:true,received,result,raceTriggered:raceTriggered||(race&&fs.existsSync(race.marker))})); } catch(error) { console.log(JSON.stringify({ok:false,received,raceTriggered:raceTriggered||(race&&fs.existsSync(race.marker)),error:{code:error.code??null,message:error.message}})); }`;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", code, JSON.stringify(["review-record", "--stage=build-plan", "--project=MaterialRef", "--task=material-ref", `--task-path=${f.taskPath}`, `--input=${input}`])], { cwd: f.wt, env: { ...environment(), HOME: f.home, WORKFLOWHUB_TASK_DIR: f.storage }, encoding: "utf8", timeout: 15_000 });
  expect(result.error).toBeUndefined(); expect(result.status).toBe(0); return JSON.parse(result.stdout);
}
function materialBytes(f, materials) {
  const root = join(f.root, `packet-${Math.random().toString(16).slice(2)}`); mkdirSync(root);
  const packet = buildReviewMaterials({ stage: "build-plan", activationCohort: "post", attachmentRoot: root, reviewDataRoot: root, materials });
  try {
    const entries = packet.deliveryManifest.filter(entry => /^(?:materials|requirements)\//.test(entry.path));
    expect(entries).toHaveLength(Object.keys(materials).length);
    return Object.fromEntries(entries.map(entry => [entry.path, readFileSync(join(packet.bundleRoot, entry.path)).toString("base64")]));
  }
  finally { packet.dispose(); }
}
test("review-record resolves both roots with sha256 and preserves inline and packet bytes", async () => {
  const f = await fixture();
  const inline = {
    raw_requirement: text, acceptance_criteria: "AC-1: exact material", draft_spec: text,
    phase_authorities: { "phases/P1.md": "# Phase P1\n\nExact Phase body\n" },
    phase_index: "## Execution Index\n\n| phase | authority ref |\n| --- | --- |\n| P1 | phases/P1.md |\n",
  };
  const request = { ...inline, raw_requirement: { ref: f.relative, sha256: sha(text) }, draft_spec: { ref: "original.md", sha256: sha(text) } };
  const result = invoke(f, request);
  expect(result.ok).toBe(true); expect(result.received).toEqual(inline); expect(sha(result.received.raw_requirement)).toBe(sha(text));
  expect(materialBytes(f, result.received)).toEqual(materialBytes(f, inline));
});
test.each(["wrong hash", "absolute", "parent", "symlink", "multi-link", "missing", "directory", "extra key"])("review-record rejects %s before provider dispatch", async kind => {
  const f = await fixture(); let ref = f.relative, checksum = sha(text), extra = {};
  if (kind === "wrong hash") checksum = "0".repeat(64);
  if (kind === "absolute") ref = join(f.taskPath, f.relative);
  if (kind === "parent") ref = "../original.md";
  if (kind === "symlink") { ref = "alias.md"; symlinkSync(join(f.wt, "original.md"), join(f.wt, ref)); }
  if (kind === "multi-link") { ref = "hard.md"; linkSync(join(f.wt, "original.md"), join(f.wt, ref)); }
  if (kind === "missing") ref = "missing.md";
  if (kind === "directory") { ref = "directory"; mkdirSync(join(f.wt, ref)); }
  if (kind === "extra key") extra = { ignored: true };
  const result = invoke(f, { raw_requirement: { ref, sha256: checksum, ...extra } });
  expect(result).toMatchObject({ ok: false, received: null, error: { code: "TASK_FILE_INVALID" } });
});

test.each(["chdir", "leaf", "aba"])("review-record rejects a real ancestor replacement during %s", async mode => {
  const f = await fixture(), parent = join(f.wt, "race"), outside = join(f.root, "outside");
  mkdirSync(parent); mkdirSync(outside);
  const file = join(parent, "input.md"), leaked = "# Root-external material must never reach the runner\n";
  writeFileSync(file, text); writeFileSync(join(outside, "input.md"), leaked);
  const result = invoke(f, { raw_requirement: { ref: "race/input.md", sha256: sha(leaked) } }, { file, parent, outside, held: `${parent}-held`, marker: join(f.root, "race-triggered"), mode });
  expect(result.raceTriggered).toBe(true);
  expect(result).toMatchObject({ ok: false, received: null, error: { code: "TASK_FILE_INVALID" } });
});
