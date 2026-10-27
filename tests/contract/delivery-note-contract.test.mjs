// Frozen build-plan target test. DO NOT TOUCH after the recorded target RED; changes require an explicit reviewed request.
// Authored by build-plan before implementation. Encodes D-011 of
// specs/n7-route-delivery-closeout-experience-20261018/decision-log.md and AC-010 / AC-011 of the same task's spec.md
// Appendix A. The machine-checked Door and Blast Radius fields stay guarded by core/task-close.mjs and are asserted here
// only as surviving names, not as executed PR bodies.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const read = path => (existsSync(resolve(ROOT, path)) ? readFileSync(resolve(ROOT, path), 'utf8') : null);
const CLOSEOUT = 'skills/stage-close/SKILL.md';
const BUILD_CODE = 'workflows/build-code/SKILL.md';
const has = (body, token) => body.includes(token);

describe('ORACLE-P4-DELIVERY-NOTE delivery note content contract', () => {
  it('keeps the delivery note content contract in the closeout method only', () => {
    const body = read(CLOSEOUT) ?? '';
    expect(body.length, 'the closeout method must be readable').toBeGreaterThan(0);
    expect(has(body, '范围'), 'the closeout method carries the scope section').toBe(true);
    expect(has(body, '影响面'), 'the closeout method names the blast radius section').toBe(true);
    expect(has(body, '验证'), 'the closeout method carries the verification section').toBe(true);
    expect(has(body, '故意不做'), 'the scope section must state what is deliberately not done').toBe(true);
    expect(/已知红/u.test(body), 'the blast radius section names the known red it must list').toBe(true);
    expect(/真正执行关闭/u.test(body), 'the note is generated where the physical close actually runs').toBe(true);
  });

  it('keeps the machine-checked PR fields intact', () => {
    const body = read(CLOSEOUT) ?? '';
    expect(has(body, 'Door'), 'the machine field Door survives').toBe(true);
    expect(has(body, 'Blast Radius'), 'the machine field Blast Radius survives').toBe(true);
    expect(has(body, 'PR_DESCRIPTION_INCOMPLETE'), 'the refusal code is still named').toBe(true);
  });

  it('does not add or drop skill references in the closeout method', () => {
    const body = read(CLOSEOUT) ?? '';
    const refs = [...new Set(body.match(/skills\/[a-z][a-z0-9-]*\/SKILL\.md/gu) ?? [])].sort();
    expect(refs).toEqual([
      'skills/knowledge-graph/SKILL.md',
      'skills/norm-sync/SKILL.md',
      'skills/resolving-merge-conflicts/SKILL.md',
      'skills/spec-specify/SKILL.md',
    ]);
  });

  it('leaves only one sentence of fact in the implementation stage', () => {
    const body = read(BUILD_CODE) ?? '';
    expect(body.length, 'the implementation stage must be readable').toBeGreaterThan(0);
    expect(has(body, '本阶段不生成交付说明'), 'the implementation stage says it does not generate the note').toBe(true);
    expect(has(body, '真正执行关闭的阶段'), 'the implementation stage names where the note is generated').toBe(true);
    expect(has(body, 'Blast Radius'), 'the delivery note content contract no longer lives here').toBe(false);
  });
});
