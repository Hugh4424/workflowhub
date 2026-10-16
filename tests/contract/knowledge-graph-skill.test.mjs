import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { test } from 'vitest';
import yaml from 'js-yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = p => readFileSync(resolve(root, p), 'utf8');

test('ORACLE-P2: knowledge-graph is discoverable through the existing skill catalog and complete bundle', () => {
  const catalog = yaml.load(read('skills/catalog.yaml'));
  const entries = catalog.skills.filter(s => s.name === 'knowledge-graph');
  assert.equal(entries.length, 1, 'target: one callable knowledge-graph skill registered in existing catalog');
  assert.equal(entries[0].path, 'skills/knowledge-graph/SKILL.md');
  const bundlePath = 'skills/knowledge-graph/skill-bundle.json';
  assert.ok(existsSync(resolve(root, bundlePath)), 'target: registered skill has a distributable bundle');
  const bundle = JSON.parse(read(bundlePath));
  assert.equal(bundle.schema_version, 1);
  assert.equal(bundle.skill, 'knowledge-graph');
  assert.ok(bundle.files.includes('SKILL.md'));
  for (const p of bundle.files) {
    assert.ok(!p.startsWith('/') && !p.split('/').includes('..'), 'bundle stays portable');
    assert.ok(existsSync(resolve(root, 'skills/knowledge-graph', p)), `bundle member readable: ${p}`);
  }
});

test('ORACLE-P2: graph conflict rule delegates only graph.json and installs no hook', () => {
  const result = spawnSync('git', ['check-attr', 'merge', '--', 'graphify-out/graph.json', 'graphify-out/manifest.json'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^graphify-out\/graph\.json: merge: graphify$/m, 'target: graph payload has declared graphify conflict handling');
  assert.match(result.stdout, /^graphify-out\/manifest\.json: merge: unspecified$/m, 'manifest must not be passed to graph-only compose');
});

test('ORACLE-P2: only durable graph payload is eligible; machine artifacts stay ignored', () => {
  const durable = ['graph.json', 'manifest.json', '.graphify_analysis.json', 'cache/semantic/sample.json'];
  const machine = ['cache/ast/sample.json', 'cache/stat-index.json', '.graphify_ast.json', '.graphify_chunk_1.json', 'GRAPH_REPORT.md', 'unrecognized-machine-state.tmp'];
  for (const [paths, expected] of [[durable, 1], [machine, 0]]) {
    for (const p of paths) {
      const result = spawnSync('git', ['check-ignore', '--no-index', '-q', `graphify-out/${p}`], { cwd: root, encoding: 'utf8' });
      assert.equal(result.status, expected, `target: ${p} ignored=${expected === 0}; ${result.stderr}`);
    }
  }
});
