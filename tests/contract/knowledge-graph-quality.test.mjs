import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const graphPath = join(root, 'graphify-out/graph.json');
const graphBytes = readFileSync(graphPath);
const graph = JSON.parse(graphBytes);
const nodes = graph.nodes;
const edges = graph.links ?? graph.edges;
const byId = new Map(nodes.map(node => [node.id, node]));
const walkJson = path => readdirSync(path, { withFileTypes: true }).flatMap(entry => {
  const child = join(path, entry.name);
  return entry.isDirectory() ? walkJson(child) : entry.name.endsWith('.json') ? [child] : [];
});

describe('ORACLE-P1-GRAPH-QUALITY actual persisted graph', () => {
  it('retains declared endpoints for every persisted relationship', () => {
    const dangling = edges.filter(edge => !byId.has(edge.source) || !byId.has(edge.target));
    expect(dangling, 'undeclared endpoints lose traversable relationships').toEqual([]);
  });

  it('keeps source-less external imports distinct from repository definitions', () => {
    const external = nodes.filter(node => node.external === true && node.type === 'external');
    expect(external.length).toBeGreaterThan(0);
    for (const node of external) {
      expect(node.source_file, node.id).toBe('');
      expect(edges.some(edge => edge.target === node.id &&
        ['imports', 'imports_from', 're_exports'].includes(edge.relation)), node.id).toBe(true);
    }
  });

  it('traces ArgumentParser to the real imported return annotation without inventing a definition file', () => {
    const source = readFileSync(join(root, 'skills/anysearch/scripts/anysearch_cli.py'), 'utf8');
    expect(source).toMatch(/^import argparse$/m);
    expect(source).toContain('def build_parser() -> argparse.ArgumentParser:');
    const target = nodes.find(node => node.label === 'ArgumentParser');
    expect(target).toBeDefined();
    expect(target.source_file).toBe('');
    const reference = edges.find(edge => edge.target === target.id && edge.relation === 'references' &&
      edge.source_file === 'skills/anysearch/scripts/anysearch_cli.py');
    expect(reference).toBeDefined();
    expect(byId.get(reference.source).label).toContain('build_parser');
  });

  it('preserves semantic relationship provenance even when its endpoints are defined elsewhere', () => {
    const crossFile = edges.filter(edge => edge._origin === 'semantic' && edge.source_file &&
      byId.get(edge.source)?.source_file && edge.source_file !== byId.get(edge.source).source_file);
    expect(crossFile.length).toBeGreaterThan(0);
    for (const edge of crossFile) {
      expect(existsSync(join(root, edge.source_file)), edge.source_file).toBe(true);
    }
  });

  it('reports observed cache/graph differences without equating a changed label with lost knowledge', () => {
    const files = walkJson(join(root, 'graphify-out/cache/semantic'));
    const labels = new Set(nodes.map(node => node.label));
    let cacheNodes = 0, absentIds = 0, absentLabels = 0;
    for (const file of files) {
      const cached = JSON.parse(readFileSync(file, 'utf8'));
      for (const node of cached.nodes ?? []) {
        cacheNodes++;
        if (!byId.has(node.id)) absentIds++;
        if (!labels.has(node.label)) absentLabels++;
      }
    }
    console.info(JSON.stringify({ graph_sha256: createHash('sha256').update(graphBytes).digest('hex'),
      graph_version: graph.graph?.graphify_version, built_at_commit: graph.built_at_commit,
      nodes: nodes.length, edges: edges.length, source_less: nodes.filter(node => !node.source_file).length,
      semantic_cache_entries: files.length, prompt_namespaces: [...new Set(files.map(file => dirname(file).split('/').at(-1)))],
      cached_nodes: cacheNodes, absent_cache_ids: absentIds, absent_cache_labels: absentLabels }));
    expect(files.length).toBeGreaterThan(0);
    expect(cacheNodes).toBeGreaterThan(0);
    expect(absentLabels).toBeGreaterThanOrEqual(absentIds);
  });
});
