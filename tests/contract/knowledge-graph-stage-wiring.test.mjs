import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { validateSkillBundle } from '../../runtime/adapters/local-skill-resolver.mjs';

const root = resolve(import.meta.dirname, '../..');
const stages = ['make-decision', 'build-prd', 'build-plan', 'build-code', 'verify-code'];

describe('ORACLE-KG-STAGE portable stage discovery', () => {
  it.each(stages)('%s resolves the graph method through its actual dependency manifest', stage => {
    const base = `workflows/${stage}`;
    const manifest = yaml.load(readFileSync(resolve(root, base, 'skill-deps.yaml'), 'utf8'));
    const prompt = readFileSync(resolve(root, base, 'SKILL.md'), 'utf8');
    const graph = manifest.skills.filter(skill => skill.name === 'knowledge-graph');
    expect(graph, `ORACLE-KG-STAGE:${stage}: no graph capability reachable from stage manifest`).toHaveLength(1);
    expect(graph[0].path).toBe('skills/knowledge-graph/SKILL.md');
    expect(typeof graph[0].trigger).toBe('string');
    expect(graph[0].trigger.trim().length).toBeGreaterThan(0);
    validateSkillBundle(root, 'skills/knowledge-graph/skill-bundle.json', graph[0].path);
    expect(prompt, `ORACLE-KG-STAGE:${stage}: host cannot discover the declared method`).toContain(graph[0].path);
    if (stage === 'build-prd' || stage === 'verify-code') {
      const closeout = manifest.skills.filter(skill => skill.name === 'stage-close');
      expect(closeout, `ORACLE-KG-STAGE:${stage}: shared closeout is unreachable`).toHaveLength(1);
      expect(closeout[0].path).toBe('skills/stage-close/SKILL.md');
      expect(typeof closeout[0].trigger).toBe('string');
      expect(closeout[0].trigger.trim().length).toBeGreaterThan(0);
      validateSkillBundle(root, 'skills/stage-close/skill-bundle.json', closeout[0].path);
      expect(prompt).toContain(closeout[0].path);
    }
  });
});
