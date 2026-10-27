// Frozen build-plan target test. DO NOT TOUCH after the recorded target RED; changes require an explicit reviewed request.
// Authored by build-plan before implementation. Every assertion below encodes a confirmed decision in
// specs/n7-route-delivery-closeout-experience-20261018/decision-log.md (D-006, D-007, ADR-002) and the
// acceptance criteria AC-002 / AC-003 of the same task's spec.md Appendix A.
// The assertions read the current bytes of the five workflow step manifests and the two method files; they do not
// prove that any stage actually ran the closeout, and they do not stand in for the independent human readback.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const read = path => (existsSync(resolve(ROOT, path)) ? readFileSync(resolve(ROOT, path), 'utf8') : null);
const readJson = path => JSON.parse(read(path));

const STAGES = [
  { stage: 'make-decision', count: 15 },
  { stage: 'build-plan', count: 12 },
  { stage: 'build-code', count: 12 },
  { stage: 'verify-code', count: 8 },
  { stage: 'build-prd', count: 6 },
];

describe('ORACLE-P1-CLOSEOUT-STEP stage closeout step and method contract', () => {
  it('names the last step of every route closeout with unchanged step counts and ids', () => {
    for (const { stage, count } of STAGES) {
      const manifest = readJson(`workflows/${stage}/steps.json`);
      expect(manifest.steps.length, `${stage} step count stays ${count}`).toBe(count);
      expect(manifest.steps.map(step => step.step_id)).toEqual(Array.from({ length: count }, (_, index) => index + 1));
      expect(manifest.steps.at(-1).step_slug, `${stage} last step is the closeout step`).toBe('closeout');
      expect(manifest.steps.at(-1).completion_evidence).toEqual([{ kind: 'phase_task_facts', uri_or_path: 'facts.jsonl' }]);
    }
  });

  it('records one stage cost inside every last-step description including build-prd', () => {
    for (const { stage } of STAGES) {
      const manifest = readJson(`workflows/${stage}/steps.json`);
      const last = JSON.stringify(manifest.steps.at(-1));
      expect(last, `${stage} last step names the closeout and its cost record`).toMatch(/收口/u);
      expect(last, `${stage} last step keeps the stage cost entry`).toMatch(/measure-main-agent-cost/u);
    }
  });

  it('makes stage-reflection the closeout body with the fixed five-step order and four outcome kinds', () => {
    const body = read('skills/stage-reflection/SKILL.md');
    expect(body, 'stage-reflection must be readable').not.toBeNull();
    expect(body).toMatch(/阶段收口/u);
    for (const token of ['无发现', '失败', '取消', '未采纳']) {
      expect(body, `closeout body states the "${token}" outcome kind`).toContain(token);
    }
    expect(body, 'closeout body records the stage cost step').toContain('记录阶段成本');
    const order = ['归纳', '分类', '记录阶段成本', '发布', '报告'].map(token => body.indexOf(token));
    expect(order.every(index => index >= 0), 'closeout order tokens all present').toBe(true);
    expect(order, 'closeout order is归纳→分类→记录阶段成本→发布→报告').toEqual([...order].sort((a, b) => a - b));
    expect(body, 'closeout body points the experience file at the business repo specs directory').toContain('specs/Improvements.md');
    expect(body, 'closeout body keeps the dedupe key instead of source ids').toContain('下次要改的那一步');
  });

  it('declares the handoff as a step published inside the closeout that stays independently readable', () => {
    const body = read('skills/stage-handoff/SKILL.md');
    expect(body, 'stage-handoff must be readable').not.toBeNull();
    expect(body).toMatch(/收口内部/u);
    expect(body, 'the handoff stays readable on its own').toMatch(/单独读取/u);
  });

  it('keeps the three skill wirings unchanged and never widens closeout past its three stages', () => {
    const catalog = read('skills/catalog.yaml');
    expect(catalog, 'catalog must be readable').not.toBeNull();
    const skills = yaml.load(catalog).skills;
    const byName = name => skills.find(entry => entry.name === name);
    expect(new Set(byName('stage-reflection').used_by_stages)).toEqual(
      new Set(['build-code', 'build-plan', 'build-prd', 'make-decision', 'verify-code']),
    );
    expect(new Set(byName('stage-handoff').used_by_stages)).toEqual(
      new Set(['make-decision', 'build-prd', 'build-plan', 'build-code', 'verify-code']),
    );
    expect(new Set(byName('stage-close').used_by_stages)).toEqual(new Set(['build-prd', 'verify-code', 'make-decision']));
    expect(byName('stage-reflection').dependency_closure).toContain('skills/stage-handoff');
    expect(byName('stage-close').dependency_closure.slice().sort()).toEqual([
      'skills/knowledge-graph', 'skills/norm-sync', 'skills/resolving-merge-conflicts', 'skills/spec-specify',
    ]);
  });
});
