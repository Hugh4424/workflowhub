// N6 ADR-012 / AC-072..078, 106..107, 114, 121: one local contract suite.
// TCR-N6-PAGE-ORACLE-SPLIT: core and conditional template keep the original assertions.
// Metadata and portable payload checks do not prove visual or natural-language quality.
// A core-only run excludes template cases explicitly; it cannot claim full-scope GREEN.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { expect, test } from 'vitest';
import { validateSkillBundle } from '../../runtime/adapters/local-skill-resolver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const skillPath = 'skills/answer-as-page/SKILL.md';
const bundlePath = 'skills/answer-as-page/skill-bundle.json';
const templatePath = 'templates/overview-template.html';
const read = path => readFileSync(join(root, path), 'utf8');
function required(path) {
  expect(existsSync(join(root, path)), `N6 target artifact must exist: ${path}`).toBe(true);
  return read(path);
}

test('core: N6 page skill: portable named skill has only name and description in frontmatter', () => {
  const body = required(skillPath);
  const front = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(body);
  expect(front, 'a standalone skill needs readable frontmatter').not.toBeNull();
  const meta = yaml.load(front[1]);
  expect(Object.keys(meta).sort()).toEqual(['description', 'name']);
  expect(meta.name).toBe('answer-as-page');
  expect(typeof meta.description).toBe('string');
  expect(meta.description.trim()).not.toBe('');
  expect(body).toMatch(/^#{1,3} .*?(?:依赖|Dependencies)/imu);
  expect(body).toContain('skills/spec-specify/SKILL.md');
  expect(body).toContain('WR001');
});

test('core: N6 page skill: bundle distributes portable skill metadata without bundled runtime', () => {
  required(skillPath);
  const bundle = JSON.parse(required(bundlePath));
  const files = bundle.files.map(entry => typeof entry === 'string' ? entry : entry.path);
  expect(bundle.schema_version).toBe(1);
  expect(bundle.skill).toBe('answer-as-page');
  expect(files).toContain('SKILL.md');
  expect(files.filter(path => /\.(?:mjs|cjs|js)$/u.test(path)), 'the upstream renderer is excluded').toEqual([]);
  expect(() => validateSkillBundle(root, bundlePath, skillPath)).not.toThrow();
});

test('template: N6 page skill: bundle distributes the caller-filled single-file template offline', () => {
  required(skillPath);
  const bundle = JSON.parse(required(bundlePath));
  const files = bundle.files.map(entry => typeof entry === 'string' ? entry : entry.path);
  expect(files).toContain(templatePath);
  expect(() => validateSkillBundle(root, bundlePath, skillPath)).not.toThrow();
  const template = required(`skills/answer-as-page/${templatePath}`);
  expect(template).toMatch(/<!doctype html>/iu);
  expect(template).toMatch(/<style(?:\s|>)/iu);
  expect(template).not.toMatch(/<(?:script|link|iframe|img)\b[^>]*(?:src|href)\s*=\s*["'](?:https?:)?\/\//iu);
  expect(template).not.toMatch(/@import\s|url\(\s*["']?https?:/iu);
});

// The fixed upstream vocabulary is an input, not read from the adapted implementation.
// Every matched row must explain its information shape and a use/boundary rule.
// Independent reader cases remain necessary to judge those explanations semantically.
test('core: N6 page skill: all seventeen component choices carry explanatory rules rather than names alone', () => {
  const body = required(skillPath);
  const rows = body.split('\n').filter(line => /^\s*\|/u.test(line))
    .map(line => line.split('|').slice(1, -1).map(cell => cell.replace(/`/gu, '').trim()));
  const kinds = [
    /\bflow\b/iu, /\ber\b/iu, /\bsequence\b/iu, /\btree\b/iu,
    /\btimeline\b/iu, /\blimits\b/iu, /\bchart\b/iu, /\bannot\b/iu,
    /\bkv\b/iu, /\bcallout\b/iu, /\bask\b/iu, /(?:Markdown\s*表|table)/iu,
    /(?:\bimage\b|图片)/iu, /(?:引用.*代码|代码.*引用|code.reference)/iu,
    /(?:变更标记|change.mark)/iu, /\bdiff\b/iu, /(?:不存在.*代码|新.*代码|new.code)/iu,
  ];
  const matched = kinds.map(kind => rows.find(row => kind.test(row[0] ?? '')));
  for (const [index, row] of matched.entries()) {
    expect(row, `component ${kinds[index]} needs its own explanatory row`).toBeDefined();
    expect(row.length, `component ${kinds[index]} needs information-shape and boundary cells`).toBeGreaterThanOrEqual(3);
    for (const cell of row.slice(1, 3)) {
      expect(cell, `component ${kinds[index]} must explain a real rule`).not.toMatch(/^(?:|[-—]|N\/A|TBD|TODO|待补|说明|适用场景|边界)$/iu);
      expect(cell).not.toBe(row[0]);
    }
  }
  expect(new Set(matched).size, 'seventeen names cannot alias one omnibus row').toBe(17);
});

test('core: N6 page skill: catalog fixes adaptation, MIT provenance and standalone consumers', () => {
  const catalog = yaml.load(read('skills/catalog.yaml'));
  const entries = catalog.skills.filter(entry => entry.name === 'answer-as-page');
  expect(entries, 'one real callable adapted skill must be registered').toHaveLength(1);
  const entry = entries[0];
  expect(entry.path).toBe(skillPath);
  expect(entry.status).toBe('adapted');
  expect(entry.used_by_stages).toEqual([]);
  const source = entry.upstream?.find(item => item.github_url === 'https://github.com/QingYunA/answer-me-with-html');
  expect(source, 'the migrated design has its own upstream, separate from pstack').toBeDefined();
  for (const key of ['commit', 'commit_url', 'license', 'reviewed_at', 'review_outcome', 'path', 'skill_url']) {
    expect(typeof source[key], `source ${key} is readable`).toBe('string');
    expect(source[key].trim(), `source ${key} is not empty`).not.toBe('');
  }
  expect(source.commit).toMatch(/^[a-f0-9]{40}$/u);
  expect(source.license).toBe('MIT');
  expect(source.adopted?.length).toBeGreaterThan(0);
  expect(Object.hasOwn(source, 'content_sha256'), 'adaptation is not byte-vendoring').toBe(false);
  expect(entry.dependency_closure).not.toContain('skills/answer-as-page');
  for (const dependency of entry.dependency_closure ?? []) expect(existsSync(join(root, dependency, 'SKILL.md'))).toBe(true);
});

test('core: N6 page skill: responsibility registration names real consumers, owner and retirement boundary', () => {
  const entries = JSON.parse(read('docs/architecture/move-map.json')).entries;
  const entry = entries.find(item => item.destination === skillPath);
  expect(entry, 'new skill responsibility must be registered before delivery').toBeDefined();
  expect(entry.role).toBe('production');
  for (const key of ['responsibility', 'owner', 'consumer', 'delete_condition', 'retention_basis']) {
    expect(typeof entry[key], `registered ${key} is readable`).toBe('string');
    expect(entry[key].trim(), `registered ${key} is not empty`).not.toBe('');
  }
  expect(entry.consumer).toMatch(/用户/iu);
  expect(entry.consumer).toMatch(/(?:总览|驾驶舱|页面)/iu);
  expect(read('skills/reuse-registry.md')).toContain('answer-as-page');
  expect(read('THIRD_PARTY_NOTICES.md')).toContain('QingYunA/answer-me-with-html');
});

// The same host/offline assertions cover both original payloads, now separately named.
function assertPortablePayload(active) {
  expect(active).not.toMatch(/\$\{?(?:CLAUDE_SKILL_DIR|CLAUDE_PROJECT_DIR|AM_HOME)\}?|~\/(?:\.claude|\.answer-me-with-html)|\/Users\/|\/home\//u);
  expect(active).not.toMatch(/(?:node\s+[^\n]*am\.mjs|am\s+(?:theme\s+add|clean|update)\b)/u);
  expect(active).not.toMatch(/<script\b[^>]+src\s*=/iu);
}

test('core: N6 page skill: active body contains no upstream host paths, background commands or bundled renderer', () => {
  assertPortablePayload(required(skillPath));
});

test('template: N6 page skill: active template contains no upstream host paths, background commands or bundled renderer', () => {
  assertPortablePayload(required(`skills/answer-as-page/${templatePath}`));
});
