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
    expect(new Set(entry.used_by_stages)).toEqual(new Set(['build-prd', 'verify-code', 'make-decision']));
  });

  it('resolves its declared graph dependency with the existing bundle consumer', () => {
    const entry = catalog().skills.find(skill => skill.name === 'stage-closeout');
    expect(entry, 'ORACLE-KG-P3: missing shared closeout owner').toBeDefined();
    const expectedDependencies = ['skills/knowledge-graph', 'skills/norm-sync', 'skills/resolving-merge-conflicts', 'skills/spec-specify'];
    const body = readFileSync(resolve(root, entry.path), 'utf8');
    const localBody = body.replace(/\[[^\]]*\]\(https?:\/\/[^)]+\)/gu, '')
      .replace(/https?:\/\/[^\s<>`]+/gu, '');
    const bodyDependencies = [...new Set([...localBody.matchAll(/\bskills\/([a-z][a-z0-9-]*)\/SKILL\.md\b/gu)]
      .map(match => `skills/${match[1]}`))];
    expect(bodyDependencies.sort(), 'ORACLE-KG-P3: actual body method references must match the two independent sources').toEqual(expectedDependencies);
    expect(entry.dependency_closure.slice().sort()).toEqual(expectedDependencies);
    expect(bodyDependencies).not.toContain('skills/stage-closeout');
    expect(entry.dependency_closure).not.toContain('skills/stage-closeout');
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

  it('selects and verifies the configured GitHub PR route before writing', () => {
    const entry = catalog().skills.find(skill => skill.name === 'stage-closeout');
    const body = readFileSync(resolve(root, entry.path), 'utf8');
    expect(body).toContain('`runtime/interface/run-command.mjs`');
    expect(body).toContain('`gh auth status --hostname <host>`');
    expect(body).toContain('gh pr list --repo <owner/repo>');
    expect(body).toContain('--json number,url,state,headRefName,baseRefName,headRefOid,baseRefOid');
    expect(body).toContain('gh pr view <number-or-URL> --repo <owner/repo>');
    expect(body).toContain('存在多个open匹配项，或只有closed匹配项时，也停止');
    expect(body).toContain('读回命令失败、状态变化、字段不符或OID不符，报告具体差异并停止PR路径');
    expect(body).toContain('gh pr create --repo <owner/repo>');
    expect(body).toContain('Resource not accessible by integration');
    expect(body).toContain('不安装或扩大应用权限');
  });
});
