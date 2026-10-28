// C01 P7 frozen oracle: the acceptance-object minimum check must be executable and wired.
// build-plan authors this test before implementation; build-code makes it GREEN without relaxing it.
// The checker itself must reuse the template-owned producer, never a second acceptance checker.
import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const root = fileURLToPath(new URL('../../', import.meta.url));
const cli = join(root, 'tools/cli/check-acceptance-object.mjs');
const marker = '<!-- c01-acceptance-object-check -->';
const tempDirs = new Set();

afterEach(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
  tempDirs.clear();
});

function tempDir(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.add(dir);
  return dir;
}

const acceptance = (object) => ['### 验收对象', '', '```json', JSON.stringify(object, null, 2), '```', ''].join('\n');
const valid = { workspace: 'PaperBuilder 本任务 worktree', service: 'frontend dev 5175 / API 5176', route: '/simulations', state: 'UiAsyncState ready', viewport: '1440x900' };

function fixture(object, { sources = {}, context = null } = {}) {
  const dir = tempDir('c01-acceptance-');
  writeFileSync(join(dir, 'spec.md'), `# 功能规格\n\n${acceptance(object)}`);
  // The context file is part of the fixture whenever sources are exercised, otherwise the
  // --check-sources case could never reach the checker.
  if (context !== null || Object.keys(sources).length > 0) {
    writeFileSync(join(dir, 'context.json'), JSON.stringify({ sources, ui_applicability: context }, null, 2));
  }
  return dir;
}

function run(args) {
  return spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' });
}

const output = (result) => {
  try { return JSON.parse(result.stdout); } catch { return null; }
};

test('ORACLE-P7-ACCEPT the checker reads the real template producer instead of redefining one', () => {
  const source = readFileSync(cli, 'utf8');
  expect(source).toContain('skills/spec-specify/templates/spec-template.md');
  expect(source).toContain(marker);
  expect(source).not.toMatch(/function\s+checkAcceptanceObject/u);
});

test('ORACLE-P7-ACCEPT a complete acceptance object passes and a missing viewport is named', () => {
  const okDir = fixture(valid);
  const ok = run(['--spec', join(okDir, 'spec.md')]);
  expect(ok.status, ok.stderr).toBe(0);
  expect(output(ok)).toMatchObject({ ok: true, missing_fields: [] });
  const broken = { ...valid };
  delete broken.viewport;
  const badDir = fixture(broken);
  const bad = run(['--spec', join(badDir, 'spec.md')]);
  expect(bad.status).toBe(1);
  expect(output(bad).missing_fields).toEqual(['viewport']);
});

test('ORACLE-P7-ACCEPT an empty owner is reported as the user, never silently blank', () => {
  const dir = fixture({ ...valid, owner: '   ' });
  const result = run(['--spec', join(dir, 'spec.md')]);
  expect(result.status).toBe(0);
  expect(output(result).object.owner).toBe('用户');
});

test('ORACLE-P7-ACCEPT a source that points at a missing file is named with its path', () => {
  const dir = fixture(valid, {
    // design_source resolves against the real worktree root; skills/catalog.yaml exists today.
    sources: { design_source: 'skills/catalog.yaml', missing_source: 'specs/design/not-there.md' },
  });
  const result = run(['--spec', join(dir, 'spec.md'), '--context', join(dir, 'context.json'), '--check-sources']);
  expect(result.status).toBe(1);
  const reported = output(result).missing_source_files ?? [];
  expect(reported.map((item) => `${item.key}:${item.path}`)).toContain('missing_source:specs/design/not-there.md');
  expect(reported.map((item) => `${item.key}:${item.path}`)).not.toContain('design_source:skills/catalog.yaml');
});

test('ORACLE-P7-ACCEPT a spec without an acceptance-object section fails loudly instead of passing', () => {
  const dir = tempDir('c01-acceptance-empty-');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'spec.md'), '# 功能规格\n\n没有验收对象节。\n');
  const result = run(['--spec', join(dir, 'spec.md')]);
  expect(result.status).toBe(2);
  expect(result.stderr).toMatch(/验收对象/u);
});

test('ORACLE-P7-ACCEPT build-code terminal names the actual command and input', () => {
  const method = readFileSync(join(root, 'workflows/build-code/SKILL.md'), 'utf8');
  expect(method).toContain('tools/cli/check-acceptance-object.mjs');
  expect(method).toContain('验收对象');
});
