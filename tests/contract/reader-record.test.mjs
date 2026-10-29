// ORACLE-C07-AUTHORING / reader: public CLI results, not reader judgment.
import { test, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const sections=['读者身份','读到的材料与范围','五问原答','原始需求对照','真跑的命令与退出码','发现的缺口','结论'];
const answers=['为谁做：下一位实施者。','他拿它干什么：修复配置读取。','读到哪里会卡：不知道错误如何返回。','失败怎么恢复：保留错误再修复原文件。','哪些话只有内行懂：首次解释命令行接口。'];
const blocks=()=>sections.map((s,i)=>`## ${s}\n\n${i===2?answers.join('\n'):i===4?'node --version；exit_code: 0':'独立读者实际记录；只证明本次读取范围。'}\n`);
function run(text){const dir=mkdtempSync(join(tmpdir(),'p9-reader-'));try{const file=join(dir,'record.md');if(text!==null)writeFileSync(file,text);return spawnSync(process.execPath,['skills/spec-plan/scripts/check-reader-record.mjs',file],{encoding:'utf8'});}finally{rmSync(dir,{recursive:true,force:true});}}
test('reader accepts seven ordered sections and five actual answers',()=>{const r=run(blocks().join('\n'));expect(r.status).toBe(0);expect(JSON.parse(r.stdout)).toEqual({ok:true,missing:[]});});
test('reader identifies missing command section',()=>{const r=run(blocks().filter((_,i)=>i!==4).join('\n'));expect(r.status).toBe(2);expect(JSON.parse(r.stdout).missing).toContain('真跑的命令与退出码');});
test('reader names the two unanswered questions',()=>{const r=run(blocks().join('\n').replace(answers[1],'他拿它干什么：').replace(answers[3],'失败怎么恢复：'));expect(r.status).toBe(2);expect(JSON.parse(r.stdout).missing).toEqual(expect.arrayContaining(['五问原答：他拿它干什么','五问原答：失败怎么恢复']));});
test('reader rejects all empty answers even with all headings',()=>{let text=blocks().join('\n');for(const a of answers)text=text.replace(a,a.split('：')[0]+'：');expect(run(text).status).toBe(2);});
test('reader rejects unordered sections and commands without an exit',()=>{const b=blocks();[b[0],b[1]]=[b[1],b[0]];expect(run(b.join('\n')).status).toBe(2);expect(run(blocks().join('\n').replace('exit_code: 0','退出码：未取得')).status).toBe(2);});
test('reader unreadable input exits one',()=>expect(run(null).status).toBe(1));

// Same-round spec source102/F3: normalize presentation before placeholder checks.
test.each(['**TODO**','`TODO`','_TBD_',' **TODO**。 '])('reader rejects formatted placeholder answers: %s',placeholder=>{let text=blocks().join('\n');for(const answer of answers)text=text.replace(answer,answer.split('：')[0]+'：'+placeholder);const result=run(text);expect(result.status).toBe(2);expect(JSON.parse(result.stdout).missing).toEqual(answers.map(answer=>'五问原答：'+answer.split('：')[0]));});
test('reader preserves meaningful formatted answers',()=>{let text=blocks().join('\n');for(const answer of answers){const [question,value]=answer.split('：');text=text.replace(answer,question+'：**'+value+'**');}const result=run(text);expect(result.status).toBe(0);expect(JSON.parse(result.stdout)).toEqual({ok:true,missing:[]});});

// Formal OCR051 codex/luna F3: only headings outside fenced examples are structure.
test.each([['backtick','```text','```',''],['tilde','~~~~text','~~~~',''],['short inner marker','````text','````','```\n']])('reader rejects a whole record inside fenced example: %s',(name,open,close,inner)=>{const result=run(open+'\n'+inner+blocks().join('\n')+'\n'+inner+close+'\n');expect(result.status,name).toBe(2);expect(JSON.parse(result.stdout).missing).toEqual(expect.arrayContaining(sections));});
test('reader keeps real headings and command evidence around a fenced fake heading',()=>{const text=blocks();text[4]='## 真跑的命令与退出码\n\n```text\n## 读者身份\nnode --version；exit_code: 0\n```\n';const result=run(text.join('\n'));expect(result.status).toBe(0);expect(JSON.parse(result.stdout)).toEqual({ok:true,missing:[]});});
test('reader accepts a labeled real command and rejects a label without a command',()=>{const text=blocks().join('\n');const actual=run(text.replace('node --version；exit_code: 0','真实只读身份命令：git rev-parse HEAD；exit_code=0'));expect(actual.status).toBe(0);expect(JSON.parse(actual.stdout)).toEqual({ok:true,missing:[]});const absent=run(text.replace('node --version；exit_code: 0','真实只读身份命令：未执行；exit_code=0'));expect(absent.status).toBe(2);expect(JSON.parse(absent.stdout).missing).toContain('真跑的命令与退出码');});
