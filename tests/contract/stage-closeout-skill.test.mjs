import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { validateSkillBundle } from '../../runtime/adapters/local-skill-resolver.mjs';

const root = resolve(import.meta.dirname, '../..');
const catalog = () => yaml.load(readFileSync(resolve(root, 'skills/catalog.yaml'), 'utf8'));

describe('ORACLE-KG-P3 standalone closeout discovery and portable closure', () => {
  it('discovers one callable stage-closeout bundle through the current catalog', () => {
    const entries = catalog().skills.filter(skill => skill.name === 'stage-closeout');
    expect(entries, 'ORACLE-KG-P3: shared callable closeout capability is not registered').toHaveLength(1);
    const entry = entries[0];
    expect(entry.path).toBe('skills/stage-closeout/SKILL.md');
    expect(entry.standalone, 'ORACLE-KG-P3: closeout must remain independently invocable').toBe(true);
    expect(existsSync(resolve(root, entry.path)), 'ORACLE-KG-P3: registered method must be readable').toBe(true);
    const result = validateSkillBundle(root, 'skills/stage-closeout/skill-bundle.json', entry.path);
    expect(result.bundle.skill).toBe('stage-closeout');
    expect(result.bundle.files, 'ORACLE-KG-P3: pure method does not package a second Git executor').toEqual(['SKILL.md']);
    expect(new Set(entry.used_by_stages)).toEqual(new Set(['build-prd', 'verify-code']));
  });

  it('resolves its declared graph dependency with the existing bundle consumer', () => {
    const entry = catalog().skills.find(skill => skill.name === 'stage-closeout');
    expect(entry, 'ORACLE-KG-P3: missing shared closeout owner').toBeDefined();
    expect(entry.dependency_closure).toEqual(expect.arrayContaining(['skills/stage-closeout', 'skills/knowledge-graph']));
    expect(new Set(entry.dependency_closure).size).toBe(entry.dependency_closure.length);
    for (const locator of entry.dependency_closure) {
      expect(locator, 'ORACLE-KG-P3: dependency must stay repository-relative').toMatch(/^skills\/[a-z][a-z0-9-]*$/);
      const name = locator.slice('skills/'.length);
      const dependency = catalog().skills.find(skill => skill.name === name);
      expect(dependency, `ORACLE-KG-P3: undeclared dependency ${name}`).toBeDefined();
      const result = validateSkillBundle(root, `${locator}/skill-bundle.json`, dependency.path);
      expect(result.bundle.skill).toBe(name);
    }
  });
});
