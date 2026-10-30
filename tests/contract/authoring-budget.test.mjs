// ORACLE-C07-AUTHORING / budget: independent literal metrics through the CLI.
import { test, expect } from 'vitest';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
const keys=['chars','id_total','id_unique','id_repeat_ratio','longest_line','constant_field_lines','per_1k_ids','sentences','long_sentences','long_sentence_ratio','repeated_statement_ratio','abbreviation_candidates','unexplained_abbreviations'];
function run(text){const dir=mkdtempSync(join(tmpdir(),'p9-budget-'));try{const path=join(dir,'input.md');if(text!==null)writeFileSync(path,text);return spawnSync(process.execPath,['skills/spec-plan/scripts/check-authoring-budget.mjs',path],{encoding:'utf8'});}finally{rmSync(dir,{recursive:true,force:true});}}
test('budget reports an exact stable key set and independent small-case metrics',()=>{const r=run('R-ONE-001。\nR-ONE-001。\n');expect(r.status).toBe(0);const p=JSON.parse(r.stdout);expect(Object.keys(p)).toEqual(keys);expect(p.id_total).toBe(2);expect(p.id_unique).toBe(1);expect(p.id_repeat_ratio).toBe(2);expect(p.longest_line).toBe(10);expect(p.sentences).toBe(2);});
test('budget stays report-only for overlong repeated input',()=>{const r=run(('FR-BAD-001 '+ '过'.repeat(310)+'。\n').repeat(6));expect(r.status).toBe(0);const p=JSON.parse(r.stdout);expect(p.id_repeat_ratio).toBeGreaterThanOrEqual(5);expect(p.longest_line).toBeGreaterThan(300);expect(p.long_sentence_ratio).toBe(1);});
test('budget distinguishes the actual good and bad author sample pair',()=>{const text=readFileSync('skills/spec-plan/templates/phase-template.md','utf8');const sample=name=>text.split(`<!-- authoring-sample:${name} -->`)[1]?.match(/```markdown\n([\s\S]*?)\n```/)?.[1];expect(sample('good')).toBeTypeOf('string');const good=run(sample('good')),bad=run(sample('bad'));expect(good.status).toBe(0);expect(bad.status).toBe(0);expect(JSON.parse(good.stdout).id_repeat_ratio).toBeLessThan(2);expect(JSON.parse(bad.stdout).id_repeat_ratio).toBeGreaterThanOrEqual(5);});
test('budget unreadable input exits one',()=>expect(run(null).status).toBe(1));
