// ORACLE-C07-AUTHORING / current-material prose gate, scoped to this task.
import { test, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { validatePostPhaseContract } from '../../runtime/stage/stage-content-contracts.mjs';
const root='specs/archive/workflowhub-ui-frontend-c07-real-page-verification-20261028';
function input(){return {spec:readFileSync(`${root}/spec.md`,'utf8'),index:readFileSync(`${root}/phases/index.md`,'utf8'),phases:Object.fromEntries(readdirSync(`${root}/phases`).filter(n=>/^P\d+.*\.md$/.test(n)).map(n=>[`phases/${n}`,readFileSync(`${root}/phases/${n}`,'utf8')]))};}
test('phase prose: each of the current thirty-six cards has independent reader prose',()=>{const r=validatePostPhaseContract(input());expect(r.errors).toEqual([]);expect(r.facts.task_count).toBe(36);expect(r.facts.card_prose_gaps).toEqual([]);expect(r.facts.prose_mode).toBe('required');});
test('phase prose: deleting real prose while preserving all machine fields is rejected',()=>{const i=input(),path='phases/P9-材料为读者写.md',source=i.phases[path];i.phases[path]=source.replace(/(^### 任务 1：[^\n]*\n)([\s\S]*?)(?=^### 任务 2：)/m,(_,heading,body)=>heading+'\n'+body.split('\n').filter(line=>/^- \*\*/.test(line)).join('\n')+'\n\n');expect(i.phases[path]).not.toBe(source);const r=validatePostPhaseContract(i);expect(r.ok).toBe(false);expect(r.errors).toContain(`${path} T025 task card requires reader prose`);expect(r.facts.card_prose_gaps).toContain(`${path} T025`);const restored=validatePostPhaseContract(input());expect(restored.ok).toBe(true);});
