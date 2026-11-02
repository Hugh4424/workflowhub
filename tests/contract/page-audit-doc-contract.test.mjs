// Frozen ORACLE-PAGE-AUDIT-DOC after recorded RED 2026-10-29; assertion changes require an independently reviewed TCR
// Targets: skills/frontend-testing/references/page-audit.md (created by the implementation phase), plus the two
// method wirings that consume it: skills/plan-design-review/SKILL.md and workflows/build-code/SKILL.md.
// Replay: node node_modules/vitest/vitest.mjs run tests/contract/page-audit-doc-contract.test.mjs   (cwd = repository root)
// Documentation is read from disk only; no implementation module is imported, so an absent pack stays a target
// assertion failure (a missing file or a missing statement) instead of a collection error.
import {describe,it,expect} from 'vitest';
import {existsSync,readFileSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const PACK='skills/frontend-testing/references/page-audit.md';
const PLAN='skills/plan-design-review/SKILL.md';
const BUILD='workflows/build-code/SKILL.md';
const DIMENSIONS=['layout','typography','colors','spacing','shadows','borders','radius','icons','states'];
const STATES=['通过','失败','未测','不适用'];
const COLLECTION_FAILURES=['未启动','失联','工具异常','身份不符'];
const CALIBRATION_NEGATIVES=['字体','间距','颜色'];

const readOr=path=>{try{return readFileSync(join(root,path),'utf8');}catch{return '';}};
const absentNote=path=>existsSync(join(root,path))?'':` [${path} is absent; this RED is expected]`;
const rowsOf=text=>text.split('\n').map(line=>line.trim()).filter(line=>line.startsWith('|')&&line.endsWith('|'));
const wordOf=word=>new RegExp(`(^|[^a-z])${word}([^a-z]|$)`,'i');
// A "statement" must hold inside one sentence or one markdown line, so two unrelated mentions never satisfy a rule.
const sentencesOf=text=>text.split(/[\n。；;]/).map(part=>part.trim()).filter(Boolean);
const hasStatement=(text,patterns)=>sentencesOf(text).some(sentence=>patterns.every(pattern=>pattern.test(sentence)));

describe('page-audit.md judgment pack',()=>{
  it('ships the judgment pack at the frozen path',()=>{
    expect(existsSync(join(root,PACK)),`${PACK} must exist under the repository root${absentNote(PACK)}`).toBe(true);
  });

  it('names the nine page-audit dimensions',()=>{
    const pack=readOr(PACK);
    for(const dimension of DIMENSIONS){
      expect(pack.includes(dimension),`${PACK} must name dimension "${dimension}"${absentNote(PACK)}`).toBe(true);
    }
  });

  it('maps every dimension onto the eight review dimensions with a 主 or 副 mark per row',()=>{
    const pack=readOr(PACK);
    const rows=rowsOf(pack);
    expect(rows.length,`${PACK} must carry a pipe-delimited mapping table${absentNote(PACK)}`).toBeGreaterThan(0);
    expect(rows.some(row=>/^\|[\s:|-]+\|$/.test(row)),`${PACK} mapping table needs a header separator row such as | --- | --- |${absentNote(PACK)}`).toBe(true);
    for(const dimension of DIMENSIONS){
      const row=rows.find(candidate=>wordOf(dimension).test(candidate)&&/[主副]/.test(candidate));
      expect(row,`${PACK}: one table row must carry "${dimension}" together with 主 or 副; no such row among ${rows.length}${absentNote(PACK)}`).toBeTruthy();
    }
    const typographyRow=rows.find(row=>wordOf('typography').test(row));
    expect(typographyRow?.includes('主'),`${PACK}: typography must map to 主; row=${typographyRow??'<none>'}${absentNote(PACK)}`).toBe(true);
  });

  it('gives states both a 主 and a 副 mark',()=>{
    const rows=rowsOf(readOr(PACK)).filter(row=>wordOf('states').test(row));
    expect(rows.length,`${PACK}: at least one mapping row must name "states"${absentNote(PACK)}`).toBeGreaterThan(0);
    expect(rows.some(row=>row.includes('主')),`${PACK}: states needs a 主 row; rows=${rows.join(' / ')||'<none>'}${absentNote(PACK)}`).toBe(true);
    expect(rows.some(row=>row.includes('副')),`${PACK}: states needs a 副 row; rows=${rows.join(' / ')||'<none>'}${absentNote(PACK)}`).toBe(true);
  });

  it('states the four criterion states',()=>{
    const pack=readOr(PACK);
    for(const state of STATES){
      expect(pack.includes(state),`${PACK} must state "${state}"${absentNote(PACK)}`).toBe(true);
    }
  });

  it('requires 200% zoom and keyboard/focus while keeping 读屏/AT out of the mandatory gate',()=>{
    const pack=readOr(PACK);
    expect(hasStatement(pack,[/200\s*[%％]/,/缩放/,/必测|必须|强制/])
      ,`${PACK} must declare 200% 缩放 as 必测 in one statement${absentNote(PACK)}`).toBe(true);
    expect(hasStatement(pack,[/键盘/,/焦点/,/必测|必须|强制/])
      ,`${PACK} must declare 键盘与焦点 as 必测 in one statement${absentNote(PACK)}`).toBe(true);
    // One regex carrying both spellings: 读屏 and AT must each be recognisable as the non-gating case.
    const screenReaderNotGated=/(读屏|屏幕阅读器|AT|辅助技术)[^。\n]*(不作必测门|不作必测|非必测|不是必测|不算必测|无需必测)/;
    expect(screenReaderNotGated.test(pack)
      ,`${PACK} must state that 读屏/AT 不作必测门; regex covers 读屏 and AT${absentNote(PACK)}`).toBe(true);
  });

  it('classifies collection failures into four kinds',()=>{
    const pack=readOr(PACK);
    expect(pack.includes('采集'),`${PACK} must describe 采集 failures${absentNote(PACK)}`).toBe(true);
    for(const failure of COLLECTION_FAILURES){
      expect(pack.includes(failure),`${PACK} must classify collection failure "${failure}"${absentNote(PACK)}`).toBe(true);
    }
  });

  it('carries the three calibration negatives for 字体, 间距 and 颜色',()=>{
    const pack=readOr(PACK);
    expect(/校准|负例/.test(pack),`${PACK} must present a 校准/负例 section${absentNote(PACK)}`).toBe(true);
    for(const negative of CALIBRATION_NEGATIVES){
      expect(pack.includes(negative),`${PACK} must carry a calibration negative for "${negative}"${absentNote(PACK)}`).toBe(true);
    }
  });

  it('requires a basis whenever a criterion is 不适用',()=>{
    const pack=readOr(PACK);
    expect(hasStatement(pack,[/不适用/,/依据|理由/,/必须|须|需|应/])
      ,`${PACK} must state that 不适用 requires a written basis${absentNote(PACK)}`).toBe(true);
  });
});

describe('page-audit method wiring',()=>{
  it('plan-design-review references the judgment pack by file name',()=>{
    const plan=readOr(PLAN);
    expect(plan.includes('page-audit.md'),`${PLAN} must reference page-audit.md${absentNote(PLAN)}`).toBe(true);
  });

  it('build-code wires page audit into the pre-freeze step',()=>{
    const build=readOr(BUILD);
    expect(build.includes('页面审计'),`${BUILD} must name 页面审计${absentNote(BUILD)}`).toBe(true);
    expect(build.includes('冻结'),`${BUILD} must name 冻结 so the audit is wired before it${absentNote(BUILD)}`).toBe(true);
  });
});
