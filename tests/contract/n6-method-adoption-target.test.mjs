// N6 ADR-005/006, AC-012/054/056/058/059: actual adoption metadata, not method effectiveness.
// Source coordinates are independent literals from confirmed decision + external-source originals.
// YAML parsing follows the existing catalog consumer. No new persistent fields/schema are required.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { expect, test } from 'vitest';
import { resolveLocalSkill, validateSkillBundle } from '../../runtime/adapters/local-skill-resolver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = path => readFileSync(join(root, path), 'utf8');
const catalog = () => yaml.load(read('skills/catalog.yaml'));
const addy = 'https://github.com/addyosmani/agent-skills';
function nonempty(value, label) {
  expect(typeof value, label).toBe('string');
  expect(value.trim(), label).not.toBe('');
}
function adopted(source) {
  expect(Array.isArray(source.adopted), 'adopted source sections use the existing array field').toBe(true);
  expect(source.adopted.length, 'a source pin alone does not identify adopted material').toBeGreaterThan(0);
  for (const item of source.adopted) nonempty(item, 'adopted item');
}
for (const [name, sourcePath] of [
  ['talk-with-zhipeng', 'skills/idea-refine/SKILL.md'],
  ['grill-with-docs', 'skills/interview-me/SKILL.md'],
]) {
  test(`P2: ${name} registers its N6 Addy source and actual portable consumer`, () => {
    const entry = catalog().skills.find(item => item.name === name);
    expect(entry, 'existing local skill registration').toBeDefined();
    expect(resolveLocalSkill(root, entry.path)).toBe(join(root, entry.path));
    expect(() => validateSkillBundle(root, `skills/${name}/skill-bundle.json`, entry.path)).not.toThrow();
    const source = entry.upstream?.find(item => item.github_url === addy && item.path === sourcePath);
    expect(source, `${name}: N6 source ${sourcePath} must be registered`).toBeDefined();
    expect(source.commit).toBe('aeac41d4d005999432bb7312f7ff06383a91d59d');
    expect(source.license).toBe('MIT');
    adopted(source);
    expect(read('skills/reuse-registry.md')).toContain(sourcePath);
    expect(read('THIRD_PARTY_NOTICES.md')).toContain('addyosmani/agent-skills');
  });
}
test('P2: source ban on offering options is explicitly not adopted for N6', () => {
  const entries = catalog().skills.filter(item => ['talk-with-zhipeng', 'grill-with-docs'].includes(item.name));
  const outcomes = entries.flatMap(entry => entry.upstream ?? [])
    .filter(source => source.github_url === addy).map(source => source.review_outcome ?? '');
  // An ordinary source review string or a source-named reuse paragraph/table row carries the decision.
  // Do not introduce a rejected-clause machine field or infer adoption from method keywords.
  const reuseRecords = read('skills/reuse-registry.md').split(/\n\s*\n/u)
    .filter(block => /(?:idea-refine|interview-me|addyosmani\/agent-skills)/u.test(block));
  expect([...outcomes, ...reuseRecords].some(record => /不采用/u.test(record)
    && /不许给用户列选项/u.test(record)), 'the source clause 不许给用户列选项 needs an explicit 不采用 record').toBe(true);
});
test('P4: prototype capability records the N6 source, adopted scope and actual AGENTS owner boundary', () => {
  const entry = catalog().capability_decisions.find(item => (item.upstream ?? []).some(source =>
    source.github_url === 'https://github.com/backnotprop/pstack'
    && source.path === 'skills/poteto-mode/playbooks/prototype.md'));
  expect(entry, 'N6 technical sketch needs its own capability decision, not the unrelated matt-prototype watch entry').toBeDefined();
  expect(entry.status).toBe('absorbed');
  expect(entry.local_path).toContain('AGENTS.md');
  const source = entry.upstream.find(item => item.github_url === 'https://github.com/backnotprop/pstack'
    && item.path === 'skills/poteto-mode/playbooks/prototype.md');
  adopted(source);
  // Current capability entries carry owner/consumer/retirement in local_changes or linked reuse prose.
  // Preserve that human-readable convention instead of adding dedicated metadata fields.
  const reuse = read('skills/reuse-registry.md').split(/\n\s*\n/u)
    .filter(block => block.includes(entry.name) || block.includes('skills/poteto-mode/playbooks/prototype.md')).join('\n');
  const boundary = `${entry.local_changes ?? ''}\n${reuse}`;
  expect(boundary).toMatch(/(?:owner|维护者|责任人|负责者)\s*[:：=＝]?\s*\S+/iu);
  expect(boundary).toMatch(/(?:consumer|消费者|使用者)\s*[:：=＝]?\s*\S+/iu);
  expect(boundary).toMatch(/(?:delete.condition|删除条件|退役条件)\s*[:：=＝]?\s*\S+/iu);
  expect(read('THIRD_PARTY_NOTICES.md')).toContain('skills/poteto-mode/playbooks/prototype.md');
  // Method outcomes still require the independent full positive/negative consumer cases in P4.
});
