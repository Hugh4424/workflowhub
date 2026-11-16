import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {runOwnedEgoTaskSpace} from '../../skills/isolated-browser-qa/scripts/browser-qa-session.mjs';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTrackedTempDir } from '../../runtime/interface/temp-dir.mjs';
import { buildSkillBundleRelease, resolvePortableStageFiles, validateSkillBundleRelease } from '../../runtime/distribution/skill-bundle-release.mjs';
import { buildRunnerRelease, validateRunnerRelease, installRunnerRelease } from '../../runtime/distribution/runner-release.mjs';
const source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
let lifetime,ship,bundleRoot,runnerRoot,bundle;
beforeAll(async()=>{lifetime=createTrackedTempDir('wh-c10-layout-test-');ship=path.join(lifetime.path,'release');fs.mkdirSync(ship);bundleRoot=path.join(ship,'skill-bundle');runnerRoot=path.join(ship,'runner');bundle=await buildSkillBundleRelease({packageRoot:source,outputDir:bundleRoot});await buildRunnerRelease({packageRoot:source,outputDir:runnerRoot});},30000);
afterAll(()=>lifetime?.dispose());
describe('ORACLE-VERSIONED-RELEASE actual standard inner roots',()=>{
  it('outer docs remain outside strict bundle and real installer copies bundle only into runner',()=>{
    fs.writeFileSync(path.join(ship,'README.md'),'Outer usage document\n');
    expect(validateSkillBundleRelease({releaseRoot:bundleRoot}).skill).toBe('workflowhub');
    expect(validateRunnerRelease({releaseRoot:runnerRoot,skillBundleManifest:bundle}).release).toBe('workflowhub-runner');
    const calls=[];const r=installRunnerRelease({releaseRoot:runnerRoot,skillBundleRoot:bundleRoot,run(command,args,options){calls.push({command,args,cwd:options.cwd});return{status:0,stdout:'',stderr:''};}});
    expect(r.status).toBe(0);
    expect(calls.map(c=>[c.command,...c.args])).toEqual([
      ['npm','ci','--ignore-scripts','--omit=dev'],['git','init','-q'],['git','add','-A'],
      ['git','-c','user.name=WorkflowHub Release','-c','user.email=release@workflowhub.invalid','commit','-qm','installed workflowhub runner']]);
    expect(calls.every(c=>c.cwd===runnerRoot)).toBe(true);
    expect(fs.readFileSync(path.join(runnerRoot,'skill-bundle.json'))).toEqual(fs.readFileSync(path.join(bundleRoot,'skill-bundle.json')));
    expect(fs.existsSync(path.join(bundleRoot,'README.md'))).toBe(false);
    fs.mkdirSync(path.join(ship,'.agents'));fs.symlinkSync('../runner/skills',path.join(ship,'.agents','skills'));
    expect(fs.realpathSync(path.join(ship,'.agents','skills'))).toBe(fs.realpathSync(path.join(runnerRoot,'skills')));
    expect(()=>validateSkillBundleRelease({releaseRoot:ship})).toThrow();
    // npm and Git are recorded stand-ins: this test makes no installation or remote-effect claim.
  });
  it.each(['specs/private.md','quality/raw.log','tests/dev-only.mjs'])('strict bundle refuses undeclared development material %s',relative=>{
    const copy=path.join(lifetime.path,'polluted-'+relative.split('/')[0]);fs.cpSync(bundleRoot,copy,{recursive:true});
    const added=path.join(copy,relative);fs.mkdirSync(path.dirname(added),{recursive:true});fs.writeFileSync(added,'private development fixture\n');
    expect(()=>validateSkillBundleRelease({releaseRoot:copy})).toThrow(/unmanifested file|forbidden path/);
    // Full outer-composer exclusion remains untested until that production seam exists.
  });
});

// Additive source: reader076, official research007 and parent direction.
function copiedBundle(label){const dest=path.join(lifetime.path,label);fs.cpSync(bundleRoot,dest,{recursive:true});return dest;}
function unlinkFixture(file,scope){expect(path.resolve(file).startsWith(path.resolve(scope)+path.sep)).toBe(true);expect(fs.lstatSync(file).isFile()).toBe(true);fs.unlinkSync(file);}
async function freshRunner(label){const releaseRoot=path.join(lifetime.path,label);await buildRunnerRelease({packageRoot:source,outputDir:releaseRoot});return releaseRoot;}
describe('C10 additive 076 P4 existing release and installer boundaries',()=>{
  it('reconstructs declared closure after both a required file and its top-level manifest row are removed',()=>{
    const copy=copiedBundle('removed-required'),relative='skills/stage-close/SKILL.md',file=path.join(copy,relative),manifestPath=path.join(copy,'skill-bundle.json');
    const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));expect(manifest.files.some(row=>row.path===relative)).toBe(true);
    unlinkFixture(file,copy);manifest.files=manifest.files.filter(row=>row.path!==relative);fs.writeFileSync(manifestPath,JSON.stringify(manifest));
    expect(fs.existsSync(file)).toBe(false);expect(manifest.files.some(row=>row.path===relative)).toBe(false);
    expect(()=>validateSkillBundleRelease({releaseRoot:copy})).toThrow();
  });
  it('rejects a required inner file replaced with an outward symbolic link',()=>{
    const copy=copiedBundle('unsafe-required'),relative='skills/stage-close/SKILL.md',file=path.join(copy,relative),outside=path.join(lifetime.path,'outside-method.md');
    fs.copyFileSync(file,outside);unlinkFixture(file,copy);fs.symlinkSync(outside,file);
    expect(fs.lstatSync(file).isSymbolicLink()).toBe(true);expect(()=>validateSkillBundleRelease({releaseRoot:copy})).toThrow();
  });
  it('rejects different shared module bytes before npm or Git',async()=>{
    const releaseRoot=await freshRunner('shared-byte-conflict'),runner=JSON.parse(fs.readFileSync(path.join(releaseRoot,'runner-release.json'),'utf8'));
    const shared=bundle.files.map(row=>row.path).find(file=>file.endsWith('.mjs')&&runner.files.some(row=>row.path===file));expect(shared).toBeTruthy();
    fs.appendFileSync(path.join(releaseRoot,shared),'\n// controlled incompatible shared bytes\n');const calls=[];
    expect(()=>installRunnerRelease({releaseRoot,skillBundleRoot:bundleRoot,run(...args){calls.push(args);return{status:0};}})).toThrow(/disagree on shared file/);expect(calls).toEqual([]);
  });
  it.each(['exit','spawn'])('preserves npm %s failure and never invokes Git',async kind=>{
    const releaseRoot=await freshRunner('npm-'+kind),calls=[];
    expect(()=>installRunnerRelease({releaseRoot,skillBundleRoot:bundleRoot,run(command,args){calls.push([command,...args]);return kind==='exit'?{status:47,stderr:'controlled npm exit'}:{status:null,error:new Error('controlled npm spawn')};}})).toThrow(/runner clean install failed: controlled npm/);
    expect(calls).toEqual([['npm','ci','--ignore-scripts','--omit=dev']]);
  });
  it.each([0,1,2])('preserves Git action %i failure and stops before later Git actions',async index=>{
    const releaseRoot=await freshRunner('git-failure-'+index),calls=[];let git=0;
    expect(()=>installRunnerRelease({releaseRoot,skillBundleRoot:bundleRoot,run(command,args){calls.push([command,...args]);if(command==='git'&&git++===index)return{status:73,stderr:'controlled git action '+index};return{status:0,stdout:'',stderr:''};}})).toThrow(/runner Git identity setup failed: controlled git action/);
    expect(calls.length).toBe(index+2);expect(calls[0][0]).toBe('npm');expect(calls.slice(1).every(call=>call[0]==='git')).toBe(true);
  });
});
describe('C10 additive 007 Ego actual local adapter contract, not app-version compatibility',()=>{
  const good=()=>({resolved:true,receipt:{closed_page_label_p1:true,closed_page_count:1,retained_page_count:0,preserved_unmanaged_count:null}});
  it('accepts a legal TaskSpace handle and a verified exactly-once finish receipt',async()=>{
    let runs=0,finishes=0;const value=await runOwnedEgoTaskSpace({taskId:'c10-contract',uuid:()=> '11111111-1111-4111-8111-111111111111',createSpace:async name=>({name,spaceId:7,label:'p1'}),runScenario:async()=>{runs++;return'local-contract-only';},finishSpace:async()=>{finishes++;return good();}});
    expect(value.lifecycle).toEqual({create:'created',run:'succeeded',cleanup:'finished'});expect(runs).toBe(1);expect(finishes).toBe(1);
  });
  it('rejects a string spaceId before a scenario or finish can run',async()=>{
    let runs=0,finishes=0;await expect(runOwnedEgoTaskSpace({taskId:'c10-contract',uuid:()=> '22222222-2222-4222-8222-222222222222',createSpace:async name=>({name,spaceId:'7',label:'p1'}),runScenario:async()=>{runs++;},finishSpace:async()=>{finishes++;return good();}})).rejects.toMatchObject({code:'EGO_WORKSPACE_HANDLE_INVALID'});
    expect(runs).toBe(0);expect(finishes).toBe(0);
  });
  it('refuses overall success when finish resolves without proving page closure',async()=>{
    let finishes=0;const events=[];await expect(runOwnedEgoTaskSpace({taskId:'c10-contract',uuid:()=> '33333333-3333-4333-8333-333333333333',createSpace:async name=>({name,spaceId:7,label:'p1'}),runScenario:async()=> 'completed',finishSpace:async()=>{finishes++;const result=good();result.receipt.closed_page_count=0;return result;},report:fact=>events.push(fact)})).rejects.toMatchObject({code:'EGO_WORKSPACE_CLEANUP_INCOMPLETE'});
    expect(finishes).toBe(1);expect(events.at(-1)).toMatchObject({run:'succeeded',cleanup:'incomplete'});
  });
});
// The official parent-commit original is task-library evidence, not repository
// content. Set C10_TASK_ROOT to that task root to run the parent negative case;
// without it the case is explicitly skipped instead of silently passing.
const taskRoot=process.env.C10_TASK_ROOT ?? null;
const currentPinned={commit:'db3d76e5597aec7261257be5322dd211c9d9bb87',file:path.join(source,'skills/anysearch/scripts/anysearch_cli.js'),sha:'2f94ff9aa2091234ac225bfe8f16e02a148eba141b49921a8740c2d36ff4e980'};
const parentPinned=taskRoot===null?null:{commit:'9b0d9e4b81f2ffa3ffe8d8439e015c9df3b4b4b8',file:path.join(taskRoot,'quality/evidence/build-plan/2026-11-16-030-c10-anysearch-official-parent-cli-source.js'),sha:'b6e736445df5dc3d8a26f3d3db89a17a63c9de45022285bc6cdc7e6308deefe4'};
const parentAvailable=parentPinned!==null&&fs.existsSync(parentPinned.file);
function runPinnedAnysearch(pinned,responseBody='{"result":{"content":[{"type":"text","text":"ok"}]}}'){
  const dir=path.join(lifetime.path,'anysearch-'+pinned.commit.slice(0,7)+'-'+createHash('sha256').update(responseBody).digest('hex').slice(0,8));fs.mkdirSync(dir);
  const bytes=fs.readFileSync(pinned.file);expect(createHash('sha256').update(bytes).digest('hex')).toBe(pinned.sha);
  const cli=path.join(dir,'anysearch_cli.js'),preload=path.join(dir,'transport.cjs'),capture=path.join(dir,'request.json');
  fs.writeFileSync(cli,bytes);fs.writeFileSync(path.join(dir,'package.json'),'{"type":"commonjs"}');
  fs.writeFileSync(preload,String.raw`
const https=require('node:https'),http=require('node:http'),fs=require('node:fs'),{EventEmitter}=require('node:events');
const blocked=()=>{throw new Error('REAL_NETWORK_FORBIDDEN_IN_CONTRACT_FIXTURE');};http.request=blocked;http.get=blocked;https.get=blocked;globalThis.fetch=blocked;
https.request=(options,respond)=>{const req=new EventEmitter();let body='';req.setTimeout=()=>req;req.on=req.on.bind(req);req.write=chunk=>{body+=chunk;};req.destroy=()=>{};req.end=()=>{
fs.writeFileSync(process.env.C10_REQUEST_CAPTURE,JSON.stringify({options,payload:JSON.parse(body)}));const res=new EventEmitter();res.statusCode=200;respond(res);queueMicrotask(()=>{res.emit('data',process.env.C10_RESPONSE_BODY);res.emit('end');});};return req;};
`);
  const argv=['search','AAPL','--domain','finance','--sub_domain','finance.us_stock','--sdp','ticker=AAPL','-m','2'];
  const r=spawnSync(process.execPath,['--require',preload,cli,...argv],{cwd:dir,env:{HOME:dir,ANYSEARCH_API_KEY:'non-secret-fixture-key',C10_REQUEST_CAPTURE:capture,C10_RESPONSE_BODY:responseBody},encoding:'utf8',timeout:5000});
  expect(r.error).toBeUndefined();const request=fs.existsSync(capture)?JSON.parse(fs.readFileSync(capture,'utf8')):null;
  console.log(JSON.stringify({scope:'isolated actual pinned CLI; no real endpoint',commit:pinned.commit,source_sha256:pinned.sha,argv,exit_code:r.status,signal:r.signal,stdout:r.stdout,stderr:r.stderr,request}));return{...r,request};
}
describe('C10 additive 007 anysearch actual upstream commits and controlled transport',()=>{
  it('new commit supports the adopted --sdp KV command',()=>{
    const current=runPinnedAnysearch(currentPinned);
    expect(current.status).toBe(0);expect(current.stdout.trim()).toBe('ok');
    expect(current.request.payload).toEqual({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'search',arguments:{query:'AAPL',domain:'finance',sub_domain:'finance.us_stock',sub_domain_params:{ticker:'AAPL'},max_results:2}}});
  });
  it.skipIf(!parentAvailable)('real parent commit rejects the exact same command before transport (requires C10_TASK_ROOT)',()=>{
    const parent=runPinnedAnysearch(parentPinned);
    expect(parent.status).toBe(1);expect(parent.stderr).toContain('Unknown flag: --sdp');expect(parent.request).toBeNull();
  });
  it('the actual current CLI rejects SSE instead of treating a non-JSON transport result as compatible',()=>{
    const r=runPinnedAnysearch(currentPinned,'data: {"result":{"content":[]}}');expect(r.status).toBe(1);expect(r.stderr).toContain('Invalid JSON response');expect(r.request.payload.method).toBe('tools/call');
  });
});

describe('C10 additive 076 P4 no installed public caller',()=>{
  it('rejects a standard runner missing its public caller even when its manifest row was removed, before npm or Git',async()=>{
    const releaseRoot=await freshRunner('missing-public-caller'),relative='tools/cli/stage-runtime.mjs',file=path.join(releaseRoot,relative),manifestPath=path.join(releaseRoot,'runner-release.json');
    const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));expect(manifest.files.some(row=>row.path===relative)).toBe(true);
    unlinkFixture(file,releaseRoot);manifest.files=manifest.files.filter(row=>row.path!==relative);fs.writeFileSync(manifestPath,JSON.stringify(manifest));
    expect(()=>validateRunnerRelease({releaseRoot,skillBundleManifest:bundle})).toThrow();const calls=[];
    expect(()=>installRunnerRelease({releaseRoot,skillBundleRoot:bundleRoot,run(...args){calls.push(args);return{status:0};}})).toThrow();expect(calls).toEqual([]);
  });
});

// C10 P4 final composer: the declared release root holds the two standard inner
// roots, the named outer delivery artifacts and the host adaptation links. The
// composer only orchestrates the existing builders/validators; these tests use
// that real seam and do not reimplement its closure.
import { buildRelease, validateRelease } from '../../tools/cli/build-release.mjs';
import { onboardRelease } from '../../tools/cli/onboard-release.mjs';
import { detectOcr } from '../../runtime/review/ocr-delegation-adapter.mjs';
import { precheckForActions } from '../../runtime/distribution/precheck.mjs';
import { workflowHubConfigPath } from '../../runtime/evidence/storage-root.mjs';
import { PACKET_SOURCE_PREFIX } from '../../skills/wh-review/scripts/third-review-host-config.mjs';
import { resolveStageSkillPackages } from '../../runtime/stage/stage-skill-runtime.mjs';

const OUTER_FILES = [
  'README.md',
  'repo-skills.manifest.json',
  'external-skills.manifest.json',
  'docs/release-support-matrix.md',
  'docs/external-skills-compat-matrix.md',
  'tools/cli/onboard-release.mjs',
];

describe('C10 P4 ORACLE-VERSIONED-RELEASE final composer', () => {
  let composer;
  beforeAll(async () => {
    composer = { lifetime: createTrackedTempDir('wh-c10-composer-') };
    composer.release = path.join(composer.lifetime.path, 'release');
    await buildRelease({ packageRoot: source, outputDir: composer.release });
  }, 60000);
  afterAll(() => composer?.lifetime.dispose());

  function copyRelease(label) {
    const target = path.join(composer.lifetime.path, label);
    fs.cpSync(composer.release, target, { recursive: true, verbatimSymlinks: true });
    return target;
  }

  it('contains the declared outer artifacts, both standard inner roots and host adaptation links', () => {
    const root = composer.release;
    for (const relative of OUTER_FILES) {
      expect(fs.existsSync(path.join(root, relative)), `outer artifact ${relative}`).toBe(true);
      expect(fs.readFileSync(path.join(root, relative)).equals(fs.readFileSync(path.join(source, relative)))).toBe(true);
    }
    const release = JSON.parse(fs.readFileSync(path.join(root, 'release.json'), 'utf8'));
    expect(release).toMatchObject({
      schema_version: 1,
      release: 'workflowhub-release',
      version: '1.0.0',
      skill_bundle_root: 'skill-bundle',
      runner_root: 'runner',
    });
    expect(validateSkillBundleRelease({ releaseRoot: path.join(root, 'skill-bundle') }).skill).toBe('workflowhub');
    const runner = validateRunnerRelease({ releaseRoot: path.join(root, 'runner'), skillBundleManifest: JSON.parse(fs.readFileSync(path.join(root, 'skill-bundle', 'skill-bundle.json'), 'utf8')) });
    expect(runner.version).toBe('1.0.0');
    expect(release.files.map((row) => row.path).sort()).toEqual([...OUTER_FILES].sort());
    for (const host of ['.claude', '.agents']) {
      const link = path.join(root, host, 'skills');
      expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
      expect(fs.readlinkSync(link)).toBe('../runner/skills');
      expect(fs.realpathSync(link)).toBe(fs.realpathSync(path.join(root, 'runner', 'skills')));
    }
    expect(() => validateSkillBundleRelease({ releaseRoot: root })).toThrow();
  });

  it('ships the same 1.0.0 version source into package, lock, release and the installed package', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(source, 'package.json'), 'utf8'));
    const lock = JSON.parse(fs.readFileSync(path.join(source, 'package-lock.json'), 'utf8'));
    const release = JSON.parse(fs.readFileSync(path.join(composer.release, 'release.json'), 'utf8'));
    const installed = JSON.parse(fs.readFileSync(path.join(composer.release, 'runner', 'package.json'), 'utf8'));
    expect(new Set([pkg.version, lock.version, lock.packages[''].version, release.version, installed.version])).toEqual(new Set(['1.0.0']));
    expect(fs.readFileSync(path.join(composer.release, 'runner', 'skills', 'catalog.yaml')).equals(fs.readFileSync(path.join(source, 'skills', 'catalog.yaml')))).toBe(true);
    expect(release.installed_support_files.map((row) => row.path)).toContain('skills/catalog.yaml');
    for (const row of release.installed_support_files) {
      expect(fs.readFileSync(path.join(composer.release, 'runner', row.path)).equals(fs.readFileSync(path.join(source, row.source)))).toBe(true);
    }
  });

  it('installs through the existing installer and resolves the declared portable closure from the installed root', () => {
    const releaseRoot = copyRelease('installed');
    const runnerRoot = path.join(releaseRoot, 'runner');
    const bundleRoot = path.join(releaseRoot, 'skill-bundle');
    const calls = [];
    installRunnerRelease({ releaseRoot: runnerRoot, skillBundleRoot: bundleRoot, run(command, args, options) { calls.push([command, ...args, options.cwd]); return { status: 0, stdout: '', stderr: '' }; } });
    expect(calls[0].slice(0, 4)).toEqual(['npm', 'ci', '--ignore-scripts', '--omit=dev']);
    expect(calls.every((call) => call.at(-1) === runnerRoot || call.at(-1) === undefined)).toBe(true);
    const stage = resolveStageSkillPackages({ packageRoot: runnerRoot, stage: 'build-code' });
    expect(stage.dependencies.get('stage-close').path).toBe('skills/stage-close/SKILL.md');
    const portable = resolvePortableStageFiles({ packageRoot: runnerRoot, stage: 'build-code' });
    for (const relative of ['skills/catalog.yaml', 'skills/stage-close/SKILL.md', 'skills/knowledge-graph/SKILL.md']) {
      expect(portable.files, `installed closure omits ${relative}`).toContain(relative);
    }
    expect(portable.root).toBe(fs.realpathSync(runnerRoot));
    expect(resolvePortableStageFiles({ packageRoot: runnerRoot, stage: 'make-decision' }).files).toContain('skills/stage-close/SKILL.md');
    expect(resolvePortableStageFiles({ packageRoot: runnerRoot, stage: 'build-plan' }).files).toContain('workflows/build-plan/SKILL.md');
  });

  it('refuses a non-empty output and leaves the existing bytes untouched', async () => {
    const target = path.join(composer.lifetime.path, 'non-empty');
    fs.mkdirSync(target);
    fs.writeFileSync(path.join(target, 'user-file.txt'), 'existing\n');
    await expect(buildRelease({ packageRoot: source, outputDir: target })).rejects.toThrow(/empty/i);
    expect(fs.readFileSync(path.join(target, 'user-file.txt'), 'utf8')).toBe('existing\n');
  });

  it.each(['specs/private.md', 'quality/raw.log', 'tests/dev-only.mjs'])('rejects development material %s in the outer release tree even when the outer manifest lists it', (relative) => {
    const tampered = copyRelease(`outer-${relative.split('/')[0]}`);
    const added = path.join(tampered, relative);
    fs.mkdirSync(path.dirname(added), { recursive: true });
    fs.writeFileSync(added, 'private development fixture\n');
    expect(() => validateRelease({ releaseRoot: tampered })).toThrow(/unexpected|development|outside/i);
    const releasePath = path.join(tampered, 'release.json');
    const release = JSON.parse(fs.readFileSync(releasePath, 'utf8'));
    release.files.push({ path: relative, source: relative });
    fs.writeFileSync(releasePath, `${JSON.stringify(release, null, 2)}\n`);
    expect(() => validateRelease({ releaseRoot: tampered })).toThrow(/unexpected|development|outside|declared/i);
  });

  it('rejects absolute, escaping and broken host adaptation links', () => {
    const absolute = copyRelease('link-absolute');
    fs.rmSync(path.join(absolute, '.claude', 'skills'));
    fs.symlinkSync(path.join(absolute, 'runner', 'skills'), path.join(absolute, '.claude', 'skills'));
    expect(() => validateRelease({ releaseRoot: absolute })).toThrow(/link|target/i);

    const escaping = copyRelease('link-escaping');
    fs.rmSync(path.join(escaping, '.agents', 'skills'));
    fs.symlinkSync('../../outside-skills', path.join(escaping, '.agents', 'skills'));
    expect(() => validateRelease({ releaseRoot: escaping })).toThrow(/link|target|outside/i);

    const broken = copyRelease('link-broken');
    fs.rmSync(path.join(broken, '.agents', 'skills'));
    fs.symlinkSync('../missing/skills', path.join(broken, '.agents', 'skills'));
    expect(() => validateRelease({ releaseRoot: broken })).toThrow(/link|target|missing/i);
  });

  it('rejects a forked release or runner version', () => {
    const forkedRelease = copyRelease('forked-release');
    const releasePath = path.join(forkedRelease, 'release.json');
    const release = JSON.parse(fs.readFileSync(releasePath, 'utf8'));
    release.version = '1.0.1';
    fs.writeFileSync(releasePath, `${JSON.stringify(release, null, 2)}\n`);
    expect(() => validateRelease({ releaseRoot: forkedRelease })).toThrow(/version/i);

    const forkedRunner = copyRelease('forked-runner');
    const runnerPath = path.join(forkedRunner, 'runner', 'runner-release.json');
    const runner = JSON.parse(fs.readFileSync(runnerPath, 'utf8'));
    runner.version = '0.9.0';
    fs.writeFileSync(runnerPath, `${JSON.stringify(runner, null, 2)}\n`);
    expect(() => validateRelease({ releaseRoot: forkedRunner })).toThrow(/version/i);
  });

  it('reports the installed 1.0.0 and the three update states through the onboarding entry', async () => {
    const home = path.join(composer.lifetime.path, 'home');
    fs.mkdirSync(home);
    const env = { HOME: home, XDG_CONFIG_HOME: path.join(composer.lifetime.path, 'xdg'), PATH: path.join(composer.lifetime.path, 'bin') };
    const same = await onboardRelease({ mode: 'check', packageRoot: composer.release, env, home, sourceVersion: '1.0.0' });
    expect(same.version).toMatchObject({ installed_version: '1.0.0', source_version: '1.0.0', status: 'up_to_date' });
    expect(same.actions).toHaveLength(2);
    const newer = await onboardRelease({ mode: 'check', packageRoot: composer.release, env, home, sourceVersion: '1.1.0' });
    expect(newer.version).toMatchObject({ installed_version: '1.0.0', source_version: '1.1.0', status: 'update_available' });
    const unknown = await onboardRelease({ mode: 'check', packageRoot: composer.release, env, home });
    expect(unknown.version).toMatchObject({ installed_version: '1.0.0', source_version: null, status: 'unavailable' });
    expect(unknown.version.reason).toMatch(/source/i);
  });

  it('runs the onboarding entry through a symbolic-link invocation instead of silently exiting', () => {
    const link = path.join(composer.lifetime.path, 'onboard-release-link.mjs');
    fs.symlinkSync(path.join(source, 'tools/cli', 'onboard-release.mjs'), link);
    const home = path.join(composer.lifetime.path, 'home-link');
    fs.mkdirSync(home, { recursive: true });
    const result = spawnSync(process.execPath, [link, '--check', `--package-root=${composer.release}`, '--source-version=1.0.0'], {
      env: { ...process.env, HOME: home, XDG_CONFIG_HOME: path.join(composer.lifetime.path, 'xdg-link') },
      encoding: 'utf8', timeout: 60000,
    });
    expect(result.stdout.length, `symbolic-link invocation produced no output: ${result.stderr}`).toBeGreaterThan(0);
    const output = JSON.parse(result.stdout);
    expect(output.version).toMatchObject({ installed_version: '1.0.0', source_version: '1.0.0', status: 'up_to_date' });
    expect(output.actions).toHaveLength(2);
  });

  it('rejects development material declared as an installed support file', () => {
    for (const relative of ['tests/dev-only.mjs', 'runtime/quality/raw.log']) {
      const tampered = copyRelease(`support-${relative.replace(/[^a-z0-9]+/gi, '-')}`);
      const added = path.join(tampered, 'runner', relative);
      fs.mkdirSync(path.dirname(added), { recursive: true });
      fs.writeFileSync(added, 'private development fixture\n');
      const releasePath = path.join(tampered, 'release.json');
      const release = JSON.parse(fs.readFileSync(releasePath, 'utf8'));
      release.installed_support_files.push({ path: relative, source: relative, reason: 'controlled support fixture' });
      fs.writeFileSync(releasePath, `${JSON.stringify(release, null, 2)}\n`);
      expect(() => validateRelease({ releaseRoot: tampered }), `support ${relative}`).toThrow(/development|support/i);
    }
  });

  it.each(['.claude/specs/private.md', '.agents/quality/raw.log'])('rejects development material under the host adaptation directory %s', (relative) => {
    const tampered = copyRelease(`host-${relative.split('/')[0]}-${relative.split('/')[1]}`);
    const added = path.join(tampered, relative);
    fs.mkdirSync(path.dirname(added), { recursive: true });
    fs.writeFileSync(added, 'private development fixture\n');
    expect(() => validateRelease({ releaseRoot: tampered })).toThrow(/host adaptation|undeclared/i);
  });

  it('ships documentation whose relative links and package paths resolve inside the release', () => {
    const releaseRoot = composer.release;
    const rootFiles = new Set(['release.json', 'external-skills.manifest.json', 'repo-skills.manifest.json']);
    const packageRoots = /^(?:skill-bundle|runner|docs|tools|\.claude|\.agents)\//;
    for (const relative of ['docs/release-support-matrix.md', 'docs/external-skills-compat-matrix.md']) {
      const absolute = path.join(releaseRoot, relative);
      const text = fs.readFileSync(absolute, 'utf8');
      expect(text, `${relative} must not carry host-specific absolute paths`).not.toMatch(/\/Users\/|\/private\/|\/tmp\//);
      for (const match of text.matchAll(/\]\(([^)\s]+)\)/g)) {
        const target = match[1];
        if (/^(?:https?:|#)/.test(target)) continue;
        const resolved = path.resolve(path.dirname(absolute), target.split('#')[0]);
        expect(resolved.startsWith(`${releaseRoot}${path.sep}`), `link escapes the release: ${relative} -> ${target}`).toBe(true);
        expect(fs.existsSync(resolved), `dead link in ${relative}: ${target}`).toBe(true);
      }
      for (const match of text.matchAll(/`([^`\n]+)`/g)) {
        const token = match[1];
        if (/\s/.test(token) || token.includes('://') || path.isAbsolute(token)) continue;
        if (!packageRoots.test(token) && !rootFiles.has(token) && !token.startsWith('../')) continue;
        const resolved = token.startsWith('../') ? path.resolve(path.dirname(absolute), token) : path.resolve(releaseRoot, token);
        expect(resolved === releaseRoot || resolved.startsWith(`${releaseRoot}${path.sep}`), `documented path escapes the release: ${relative} -> ${token}`).toBe(true);
        expect(fs.existsSync(resolved), `documented package path does not exist: ${relative} -> ${token}`).toBe(true);
      }
    }
  });

  it('rejects an installed runner package version that forks from the release version', () => {
    const tampered = copyRelease('forked-installed-package');
    const packagePath = path.join(tampered, 'runner', 'package.json');
    const installed = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    installed.version = '0.9.0';
    fs.writeFileSync(packagePath, `${JSON.stringify(installed, null, 2)}\n`);
    expect(() => validateRelease({ releaseRoot: tampered })).toThrow(/installed runner package version/i);
  });
});

function readProviderFacts() {
  // The product owns no default provider route; the declared routes are the
  // current user configuration fact. Read them from the same config owner the
  // runtime uses. Absent/unreadable config means the cases are explicitly
  // skipped with a printed reason, never silently passed.
  try {
    const file = workflowHubConfigPath({ env: process.env, home: process.env.HOME ?? homedir() });
    const config = JSON.parse(fs.readFileSync(file, 'utf8'));
    const placements = new Map();
    const add = (stage, route) => {
      if (!placements.has(route)) placements.set(route, new Set());
      placements.get(route).add(stage);
    };
    const walk = (stage, value) => {
      if (Array.isArray(value)) {
        for (const item of value) if (typeof item === 'string' && /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/.test(item)) add(stage, item);
        return;
      }
      if (!value || typeof value !== 'object') return;
      for (const [key, next] of Object.entries(value)) if (key !== 'mode') walk(stage, next);
    };
    for (const [stage, value] of Object.entries(config.wh_review?.stages ?? {})) walk(stage, value);
    for (const [stage, value] of Object.entries(config.wh_review?.non_stage ?? {})) walk(stage, value);
    if (placements.size === 0) return null;
    return {
      routes: [...placements.keys()].sort(),
      placements: Object.fromEntries([...placements].map(([route, stages]) => [route, [...stages].sort()])),
    };
  } catch { return null; }
}

const providerFacts = readProviderFacts();
if (providerFacts === null) {
  console.warn('[C10 P4] current WorkflowHub provider routes are not readable; the per-route positive/executable-missing/id-missing and placement assertions are explicitly skipped (no pass claimed). Point HOME/XDG_CONFIG_HOME at the real config to run them.');
}

describe('C10 P4 fixed compatibility inputs for the declared tools and provider route', () => {
  let temp;
  beforeAll(() => { temp = createTrackedTempDir('wh-c10-compat-'); });
  afterAll(() => temp?.dispose());

  function ocrBin(version) {
    const bin = path.join(temp.path, `ocr-${String(version).replace(/[^A-Za-z0-9.]/g, '-')}`);
    fs.mkdirSync(bin, { recursive: true });
    const script = path.join(bin, 'ocr');
    fs.writeFileSync(script, version === 'FAIL' ? '#!/bin/sh\nexit 3\n' : `#!/bin/sh\nprintf '%s\\n' 'open-code-review v${version}'\n`, { mode: 0o700 });
    return bin;
  }

  it('accepts the 1.12.9 OCR floor and rejects 1.12.8, invalid or failing probes', () => {
    const floor = detectOcr({ env: { ...process.env, PATH: ocrBin('1.12.9') } });
    expect(floor).toMatchObject({ status: 'installed', version: '1.12.9' });
    const below = detectOcr({ env: { ...process.env, PATH: ocrBin('1.12.8') } });
    expect(below).toMatchObject({ status: 'not_installed', version: '1.12.8' });
    expect(below.reason).toMatch(/below 1\.12\.9/);
    const invalid = detectOcr({ env: { ...process.env, PATH: ocrBin('latest') } });
    expect(invalid.status).toBe('unavailable');
    const failing = detectOcr({ env: { ...process.env, PATH: ocrBin('FAIL') } });
    expect(failing.status).toBe('unavailable');
  });

  it.skipIf(providerFacts === null)('asserts ok / executable-missing / id-missing fixed inputs for every current review provider route', () => {
    const routes = providerFacts.routes;
    const root = path.join(temp.path, 'provider');
    const home = path.join(root, 'home');
    const bin = path.join(root, 'bin');
    const packets = path.join(root, 'packets');
    const runtime = path.join(root, 'broker-runtime');
    for (const directory of [home, bin, packets, runtime]) fs.mkdirSync(directory, { recursive: true });
    const env = { HOME: home, XDG_CONFIG_HOME: path.join(root, 'xdg'), PATH: bin };
    const broker = path.join(root, 'providers.json');
    const families = [...new Set(routes.map((route) => route.split('/')[0]))];
    const writeBroker = (ids, missingExecutable = null) => fs.writeFileSync(broker, JSON.stringify({
      version: 4, tiers: [families], runtime: { root: runtime },
      providers: Object.fromEntries(ids.map((id) => [id, { enabled: true, source_id: `fixture-${id.replace('/', '-')}`, model: 'fixture-model',
        command: id === missingExecutable ? path.join(root, 'missing-provider-executable') : process.execPath }])),
      attachment_roots: [{ root: packets, sources: [PACKET_SOURCE_PREFIX] }],
    }));
    const configPath = workflowHubConfigPath({ env, home });
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    const writeConfig = (route) => fs.writeFileSync(configPath, `${JSON.stringify({
      task_dir: path.join(root, 'tasks'),
      third_review: { command: [process.execPath], config: broker, attachment_root: packets },
      wh_review: { version: 2, stages: { 'build-code': { initial: [route], mode: 'full_only' } }, non_stage: {} },
    }, null, 2)}\n`);
    for (const route of routes) {
      writeBroker(routes);
      writeConfig(route);
      const ready = precheckForActions(['review-full'], { env, home, requestedStage: 'build-code' });
      expect(ready.checks.find((check) => check.id === 'provider'), `positive fixed input for ${route}`).toMatchObject({ status: 'ok' });
      writeBroker(routes, route);
      const missingExecutable = precheckForActions(['review-full'], { env, home, requestedStage: 'build-code' });
      expect(missingExecutable.checks.find((check) => check.id === 'provider'), `missing executable fixed input for ${route}`).toMatchObject({
        status: 'missing', code: 'PROVIDER_EXECUTABLE_NOT_FOUND', path: path.join(root, 'missing-provider-executable'),
      });
      writeBroker(routes.filter((candidate) => candidate !== route));
      const rejected = precheckForActions(['review-full'], { env, home, requestedStage: 'build-code' });
      expect(rejected.checks.find((check) => check.id === 'provider'), `undefined provider fixed input for ${route}`).toMatchObject({ status: 'missing', code: 'PROVIDER_NOT_DEFINED' });
    }
  });

  it.skipIf(providerFacts === null)('documents exactly the current review provider routes and their stage placement', () => {
    const routes = providerFacts.routes;
    const matrix = fs.readFileSync(path.join(source, 'docs', 'external-skills-compat-matrix.md'), 'utf8');
    const section = matrix.slice(matrix.indexOf('## review provider routes'), matrix.indexOf('## ', matrix.indexOf('## review provider routes') + 5));
    const documented = new Set([...section.matchAll(/`([a-z][a-z0-9-]*\/[a-z][a-z0-9-]*)`/g)].map((match) => match[1]));
    expect([...documented].sort()).toEqual(routes);
    for (const row of section.split('\n').filter((line) => /^\| `[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*` \|/.test(line))) {
      const [, route, stages] = row.match(/^\| `([^`]+)` \| ([^|]+) \|/);
      expect(stages.split('、').map((stage) => stage.trim()).sort(), `stage placement for ${route}`).toEqual(providerFacts.placements[route]);
    }
    expect(matrix).not.toContain('codex/luna');
  });
});
