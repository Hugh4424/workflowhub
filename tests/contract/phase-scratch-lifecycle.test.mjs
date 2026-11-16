import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTrackedTempDir, cleanupStaleTempDirs } from '../../runtime/interface/temp-dir.mjs';
import { captureCommand } from '../../runtime/interface/run-command.mjs';

const fixtures = [];
function fixture() { const f = createTrackedTempDir('wh-c10-lifecycle-test-'); fixtures.push(f); return f.path; }
afterEach(() => { for (const f of fixtures.splice(0).reverse()) f.dispose(); });
const helper = new URL('../../runtime/interface/temp-dir.mjs', import.meta.url).href;
function child(root, tail) {
  return spawnSync(process.execPath, ['--input-type=module', '-e',
    'import {createTrackedTempDir} from '+JSON.stringify(helper)+';'+
    'const f=createTrackedTempDir("wh-c10-child-",{root:'+JSON.stringify(root)+'});'+
    'process.stdout.write(f.path);'+tail], {encoding:'utf8',timeout:4000});
}
describe('ORACLE-SCRATCH-LIFECYCLE existing lifetime owner', () => {
  it('finally disposes only regenerable work and preserves an original error and sibling evidence', () => {
    const root=fixture(), raw=path.join(root,'original-output.txt'); fs.writeFileSync(raw,'original failure\n');
    const f=createTrackedTempDir('wh-c10-work-',{root});
    expect(() => { try { fs.writeFileSync(path.join(f.path,'fixture.json'),'{}'); throw new Error('BUSINESS_ASSERTION_FAILED'); }
      finally { f.dispose(); } }).toThrow('BUSINESS_ASSERTION_FAILED');
    expect(fs.existsSync(f.path)).toBe(false); expect(fs.readFileSync(raw,'utf8')).toBe('original failure\n');
    expect(() => f.dispose()).not.toThrow();
  });
  it.each(['SIGINT','SIGTERM'])('preserves %s instead of reporting successful cancellation', signal => {
    const root=fixture(), r=child(root,'setInterval(()=>{},1000);setTimeout(()=>process.kill(process.pid,'+JSON.stringify(signal)+'),10);');
    expect(r.error).toBeUndefined(); expect(r.signal).toBe(signal); expect(r.status).toBeNull();
    expect(fs.existsSync(r.stdout.trim())).toBe(false);
  });
  it('SIGKILL leaves owned work; unknown PID is retained and actual dead PID can be reaped later', () => {
    const root=fixture(), r=child(root,'process.kill(process.pid,"SIGKILL");');
    expect(r.error).toBeUndefined(); expect(r.signal).toBe('SIGKILL');
    const killed=r.stdout.trim(); expect(killed.startsWith(root+path.sep)).toBe(true); expect(fs.existsSync(killed)).toBe(true);
    expect(cleanupStaleTempDirs({root,prefixes:['wh-c10-child-'],olderThanMs:0,pidAlive:()=>null})).toEqual([]);
    expect(fs.existsSync(killed)).toBe(true);
    expect(cleanupStaleTempDirs({root,prefixes:['wh-c10-child-'],olderThanMs:0})).toEqual([killed]);
    expect(fs.existsSync(killed)).toBe(false);
  });
  it('retains a live owner, foreign directories and symbolic aliases', () => {
    const root=fixture(), live=createTrackedTempDir('wh-c10-child-',{root});
    const foreign=path.join(root,'foreign');fs.mkdirSync(foreign);fs.writeFileSync(path.join(foreign,'unique'),'keep');
    const alias=path.join(root,'wh-c10-child-alias');fs.symlinkSync(foreign,alias);
    expect(cleanupStaleTempDirs({root,prefixes:['wh-c10-child-'],olderThanMs:0,pidAlive:()=>false})).toEqual([]);
    expect(fs.existsSync(live.path)).toBe(true);expect(fs.lstatSync(alias).isSymbolicLink()).toBe(true);
    expect(fs.readFileSync(path.join(foreign,'unique'),'utf8')).toBe('keep');live.dispose();
  });
  it('refuses a noncanonical symbolic root instead of following it', () => {
    const root=fixture(), actual=path.join(root,'actual'), alias=path.join(root,'alias');
    fs.mkdirSync(actual);fs.symlinkSync(actual,alias);
    expect(()=>createTrackedTempDir('wh-c10-work-',{root:alias})).toThrow(/real directory/);
  });
});

// Additive source: reader076 + parent explicit authorization; old bytes are in
// 026-c10-step8-before-additive-tests-1.mjs. Existing assertions stay unchanged.
function staleFixture(root){
  const work=createTrackedTempDir('wh-c10-expanded-',{root});
  const marker=path.join(work.path,'.workflowhub-temp.json');
  const value=JSON.parse(fs.readFileSync(marker,'utf8'));
  value.pid=2147483646;value.created_at=new Date(0).toISOString();
  fs.writeFileSync(marker,JSON.stringify(value));
  return{work,marker,value};
}
describe('C10 additive 076 P1 existing helper boundaries',()=>{
  it.each([[-1,false],[0,true],[1,true]])('age threshold offset %i is eligible=%s',(offset,eligible)=>{
    const root=fixture(),f=staleFixture(root),now=2000000000000,threshold=60000;
    f.value.created_at=new Date(now-threshold-offset).toISOString();fs.writeFileSync(f.marker,JSON.stringify(f.value));
    const clock=vi.spyOn(Date,'now').mockReturnValue(now);
    try{const removed=cleanupStaleTempDirs({root,prefixes:['wh-c10-expanded-'],olderThanMs:threshold,pidAlive:()=>false});
      expect(removed).toEqual(eligible?[f.work.path]:[]);expect(fs.existsSync(f.work.path)).toBe(!eligible);
    }finally{clock.mockRestore();f.work.dispose();}
  });
  it.each(['uid','dev','ino'])('retains a marker whose %s differs from its actual owner/directory',field=>{
    const root=fixture(),f=staleFixture(root);f.value[field]=(f.value[field]??0)+1;fs.writeFileSync(f.marker,JSON.stringify(f.value));
    try{expect(cleanupStaleTempDirs({root,prefixes:['wh-c10-expanded-'],olderThanMs:0,pidAlive:()=>false})).toEqual([]);expect(fs.existsSync(f.work.path)).toBe(true);}
    finally{f.work.dispose();}
  });
  it('retains work when the named marker inode is replaced during the PID probe',()=>{
    const root=fixture(),f=staleFixture(root),before=fs.lstatSync(f.marker),oldMarker=path.join(f.work.path,'old-marker.json');
    try{const removed=cleanupStaleTempDirs({root,prefixes:['wh-c10-expanded-'],olderThanMs:0,pidAlive:()=>{
      expect(path.resolve(f.marker).startsWith(path.resolve(f.work.path)+path.sep)).toBe(true);
      expect(path.resolve(oldMarker).startsWith(path.resolve(f.work.path)+path.sep)).toBe(true);
      fs.renameSync(f.marker,oldMarker);fs.writeFileSync(f.marker,JSON.stringify(f.value),{flag:'wx',mode:0o600});return false;
    }});expect(removed).toEqual([]);expect(fs.lstatSync(f.marker).ino).not.toBe(before.ino);expect(fs.existsSync(f.work.path)).toBe(true);}
    finally{f.work.dispose();}
  });
  it('keeps work through an application signal drain and only cleans after application exit',()=>{
    const root=fixture(),observation=path.join(root,'drain.json');
    const r=child(root,'const fs=await import("node:fs");const idle=setInterval(()=>{},1000);process.on("SIGTERM",()=>{const start=fs.existsSync(f.path);setTimeout(()=>{fs.writeFileSync('+JSON.stringify(observation)+',JSON.stringify({start,drained:fs.existsSync(f.path)}));clearInterval(idle);process.exitCode=143;},30);});setTimeout(()=>process.kill(process.pid,"SIGTERM"),10);');
    expect(r.error).toBeUndefined();expect(r.stderr).toBe('');expect(r.status).toBe(143);expect(r.signal).toBeNull();
    expect(JSON.parse(fs.readFileSync(observation,'utf8'))).toEqual({start:true,drained:true});expect(fs.existsSync(r.stdout.trim())).toBe(false);
  });
});

// C10 P1 / ORACLE-SCRATCH-LIFECYCLE method consumption: the author method must
// carry an executable same-process create/consume/reap example, and running it
// must protect capture and reap only regenerable scratch when the work fails.
const repoRoot = new URL('../../', import.meta.url);
function readDoc(relative) { return fs.readFileSync(new URL(relative, repoRoot), 'utf8'); }
function markdownSection(text, heading) {
  const start = text.indexOf(heading);
  if (start < 0) return null;
  const rest = text.slice(start + heading.length);
  const end = rest.search(/\n## /);
  return end < 0 ? rest : rest.slice(0, end);
}
function lifecycleExample(text) {
  const marker = '<!-- scratch-lifecycle-example -->';
  expect(text.split(marker).length - 1, 'ORACLE-SCRATCH-LIFECYCLE template carries exactly one scratch lifecycle example').toBe(1);
  const tail = text.slice(text.indexOf(marker) + marker.length);
  const match = tail.match(/^\s*```js\n([\s\S]*?)\n```/);
  expect(match, 'ORACLE-SCRATCH-LIFECYCLE runnable js fence after the marker').not.toBeNull();
  return match[1];
}
function boundExample(root, work, settle = 'Promise.resolve()') {
  const source = lifecycleExample(readDoc('skills/spec-plan/templates/phase-template.md'))
    .replaceAll('{{TASK_ID}}', 'wh-c10-method-example')
    .replaceAll('{{PURPOSE}}', 'probe')
    .replaceAll('{{SCRATCH_ROOT}}', JSON.stringify(root))
    .replaceAll('{{WORK}}', work)
    .replaceAll('{{SETTLE}}', settle);
  expect(source, 'ORACLE-SCRATCH-LIFECYCLE all example placeholders bound').not.toMatch(/\{\{[^}]+\}\}/);
  return source;
}
function runLifecycleExample(root, work, settle) {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', boundExample(root, work, settle)], { cwd: fileURLToPath(repoRoot), encoding: 'utf8', timeout: 10000 });
  return { ...result, scratch: (result.stdout ?? '').split('\n')[0] };
}
function captureLifecycleExample(root, work) {
  const recordDir = path.join(root, 'records');
  fs.mkdirSync(recordDir);
  return captureCommand({
    cwd: fileURLToPath(repoRoot),
    recordDir,
    slug: 'c10-p1-method-example',
    argv: [process.execPath, '--input-type=module', '-e', boundExample(root, work)],
    timeoutMs: 15000,
  });
}
describe('C10 P1 method consumption ORACLE-SCRATCH-LIFECYCLE', () => {
  it('author method classifies each temporary path and owns the same-process lifecycle', () => {
    const boundary = markdownSection(readDoc('skills/spec-plan/SKILL.md'), '## Scratch lifetime and original-evidence boundary');
    expect(boundary, 'ORACLE-SCRATCH-LIFECYCLE spec-plan must define the scratch lifetime boundary').not.toBeNull();
    for (const token of ['regenerable scratch', 'delivery package', 'original evidence', 'provider packet', 'createTrackedTempDir', 'finally', 'dispose', 'captureCommand', 'cleanupStaleTempDirs', 'SIGKILL', 'symbolic link', 'replaced inode', 'second cleanup', 'certified task identity', 'task.json', '`cwd` and `argv`', 'output_ref', 'equivalent owner', 'stop that temporary work path', 'drain or provider settle', 'process.exitCode', '--input-type=module', 'worktree root']) {
      expect(boundary, `ORACLE-SCRATCH-LIFECYCLE method missing ${token}`).toContain(token);
    }
    expect(boundary).toMatch(/same (Node )?process/);
  });
  it('phase template carries the executable example and lifecycle obligations in existing fields', () => {
    const text = readDoc('skills/spec-plan/templates/phase-template.md');
    const snippet = lifecycleExample(text);
    for (const token of ['createTrackedTempDir', 'finally', 'dispose', '{{TASK_ID}}', '{{SCRATCH_ROOT}}', '{{WORK}}', '{{SETTLE}}']) {
      expect(snippet, `ORACLE-SCRATCH-LIFECYCLE example missing ${token}`).toContain(token);
    }
    const field = (label) => text.split('\n').find((line) => line.startsWith(`- **${label}**:`));
    expect(field('场景 / 夹具或服务'), 'ORACLE-SCRATCH-LIFECYCLE scenario field owns the same-process pattern').toMatch(/同进程/);
    expect(field('场景 / 夹具或服务')).toMatch(/SIGKILL/);
    expect(field('输出 / 失败')).toMatch(/scratch/);
    expect(field('输出 / 失败')).toMatch(/原始/);
    expect(field('停止 / 恢复')).toMatch(/回收路径/);
    const lifecycle = text.slice(text.indexOf('### 临时工作命令怎么写？'), text.indexOf('### 六类人读内容归到哪个字段？'));
    for (const token of ['已认证 task 身份', 'canonical 根', 'argv', 'JSON.stringify', '--input-type=module', '绝对 URL', '{{SETTLE}}']) {
      expect(lifecycle, `ORACLE-SCRATCH-LIFECYCLE lifecycle section missing ${token}`).toContain(token);
    }
    const cardFields = (body) => body.slice(body.indexOf('### 任务 N：'), body.indexOf('### G-2 纯文档示例'))
      .split('\n').map((line) => line.match(/^- \*\*(.+?)\*\*[：:]/)?.[1]).filter(Boolean);
    const expectedFields = ['任务编号', '来源 / FR / AC', '输入', '文件 / 符号', '动作', '输出 / 失败', '边界 / 禁止改动', '依赖', '测试层级 / 技能', '场景 / 夹具或服务', 'RED/GREEN 门禁命令', '预期退出码', 'RED 目标失败', 'GREEN 判定器', '证据', '覆盖上限', '停止 / 恢复', '完成'];
    expect(cardFields(text), 'ORACLE-SCRATCH-LIFECYCLE keeps the exact ordered 18 task-card fields').toEqual(expectedFields);
    const baseline = spawnSync('git', ['show', 'HEAD:skills/spec-plan/templates/phase-template.md'], { cwd: fileURLToPath(repoRoot), encoding: 'utf8' });
    if (baseline.status === 0 && baseline.stdout !== text) {
      expect(cardFields(baseline.stdout), 'ORACLE-SCRATCH-LIFECYCLE field skeleton matches the committed baseline').toEqual(cardFields(text));
    }
  });
  it('build-plan routes authors through the rule and an independent consumer real run', () => {
    const text = readDoc('workflows/build-plan/SKILL.md');
    expect(text, 'ORACLE-SCRATCH-LIFECYCLE build-plan must call the author rule').toContain('Scratch lifetime and original-evidence boundary');
    expect(text, 'ORACLE-SCRATCH-LIFECYCLE build-plan must require an independent consumer run').toMatch(/独立消费者[^。]*实跑|实跑[^。]*独立消费者/);
  });
  it('method example reaps only scratch and keeps the external capture on normal success', () => {
    const root = fixture();
    const result = runLifecycleExample(root, 'console.log("WORK_OK");');
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('WORK_OK');
    expect(result.scratch.startsWith(root + path.sep)).toBe(true);
    expect(fs.existsSync(result.scratch)).toBe(false);
  });
  it('captures the failing run to disk through the real capture producer and reaps scratch', async () => {
    const root = fixture();
    const receipt = await captureLifecycleExample(root, 'console.log("CAPTURE_LINE"); throw new Error("BUSINESS_ASSERTION_FAILED");');
    expect(receipt.output_ref).toBe(path.join(root, 'records', path.basename(receipt.output_ref)));
    const captured = fs.readFileSync(receipt.output_ref, 'utf8');
    expect(captured).toContain('CAPTURE_LINE');
    expect(captured).toContain('BUSINESS_ASSERTION_FAILED');
    expect(receipt.exit_code).not.toBe(0);
    const persisted = JSON.parse(fs.readFileSync(receipt.receipt_ref, 'utf8'));
    expect(persisted.exit_code).toBe(receipt.exit_code);
    const scratch = captured.split('\n')[0];
    expect(scratch.startsWith(root + path.sep)).toBe(true);
    expect(fs.existsSync(scratch)).toBe(false);
  });
});

// F1 repair (independent verification 2026-11-16-105): the documented example
// must not let a throwing dispose replace the business failure, and a cleanup
// failure after successful work must not pass as success.
describe('C10 P1 cleanup failure boundary ORACLE-SCRATCH-LIFECYCLE', () => {
  const mutate = 'const fs = await import("node:fs"); fs.rmSync(scratch.path, { recursive: true, force: true }); fs.mkdirSync(scratch.path);';
  it('reports the cleanup failure without masking the business failure', () => {
    const root = fixture();
    const result = runLifecycleExample(root, `${mutate} throw new Error("BUSINESS_ASSERTION_FAILED");`);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('BUSINESS_ASSERTION_FAILED');
    expect(result.stderr).toContain('TEMP_CLEANUP_FAILED');
    expect(result.stdout).toContain(result.scratch);
    expect(fs.existsSync(result.scratch)).toBe(true);
  });
  it('fails the run when successful work is followed by a cleanup failure', () => {
    const root = fixture();
    const result = runLifecycleExample(root, mutate);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('TEMP_CLEANUP_FAILED');
  });
});

// Provider review 020 #0/#1/#3: cancellation drain, business nonzero exitCode,
// and path values that must be bound as safe string literals.
describe('C10 P1 cancellation and exit-code boundary ORACLE-SCRATCH-LIFECYCLE', () => {
  it('keeps scratch usable through an application-owned cancellation drain and reaps only after it ends', () => {
    const root = fixture();
    const observation = path.join(root, 'drain.json');
    const work = `const fs = await import("node:fs");
    globalThis.__settle = () => new Promise((resolve) => setTimeout(() => {
      fs.writeFileSync(${JSON.stringify(observation)}, JSON.stringify({ during_drain: fs.existsSync(scratch.path) }));
      resolve();
    }, 60));
    process.exitCode = 130;`;
    const result = runLifecycleExample(root, work, 'globalThis.__settle()');
    expect(result.status).toBe(130);
    expect(JSON.parse(fs.readFileSync(observation, 'utf8'))).toEqual({ during_drain: true });
    expect(fs.existsSync(result.scratch)).toBe(false);
  });
  it('preserves a business nonzero process.exitCode when cleanup also fails', () => {
    const root = fixture();
    const result = runLifecycleExample(root, 'const fs = await import("node:fs"); fs.rmSync(scratch.path, { recursive: true, force: true }); fs.mkdirSync(scratch.path); process.exitCode = 7;');
    expect(result.status).toBe(7);
    expect(result.stderr).toContain('TEMP_CLEANUP_FAILED');
    expect(fs.existsSync(result.scratch)).toBe(true);
  });
  it('binds a root path containing quotes and backslashes as a safe string literal', () => {
    const parent = fixture();
    const root = path.join(parent, 'quoted "root" \\ dir');
    fs.mkdirSync(root);
    const result = runLifecycleExample(root, 'console.log("SPECIAL_ROOT_OK");');
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('SPECIAL_ROOT_OK');
    expect(result.scratch.startsWith(root + path.sep)).toBe(true);
    expect(fs.existsSync(result.scratch)).toBe(false);
  });
});
