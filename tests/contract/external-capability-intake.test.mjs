// C01 P1 frozen oracle: external capability intake and registration.
// build-plan authors this test before implementation; build-code makes it GREEN without relaxing it.
// Dependency-free on purpose: this worktree has no node_modules, so the oracle reads the real
// catalog bytes and asserts the recorded fields instead of importing a YAML parser.
import { expect, test } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (relative) => readFileSync(join(root, relative), 'utf8');

const packages = [
  {
    name: 'spec-driven-production',
    commit: '000b04a2a3553bddcf991b3dc42f9a5a2746fa6f',
    sourceUrl: 'https://modelscope.cn/skills/WenjiaWang/spec-driven-production',
    license: null,
    localPath: 'skills/external/spec-driven-production',
    entry: 'skills/external/spec-driven-production/SKILL.md',
  },
  {
    name: 'material-agent-readiness-eval-markdown',
    commit: 'b62e87f3f91868033106b21f6398f0fd6d3d2043',
    sourceUrl: 'https://modelscope.cn/skills/WenjiaWang/material-agent-readiness-eval',
    license: null,
    localPath: 'skills/external/material-agent-readiness-eval-markdown',
    entry: 'skills/external/material-agent-readiness-eval-markdown/SKILL.md',
  },
  {
    name: 'design-tokens',
    commit: 'c259656c76d9758d7ead46b0d2f125cbe84f8665',
    sourceUrl: 'https://github.com/julianoczkowski/designer-skills',
    license: 'Apache-2.0',
    localPath: 'skills/external/design-tokens',
    entry: 'skills/external/design-tokens/SKILL.md',
  },
];

const vendoredFiles = {
  'spec-driven-production': [
    'README.md',
    'SKILL.md',
    'agents/openai.yaml',
    'assets/templates/【模板】SDD 首轮需求输入文档.md',
    'assets/templates/【模板】Spec 评审文档.md',
    'docs/compatibility.md',
    'docs/review-2026-09-20.md',
    'references/collaborative-review.md',
    'references/design-spec.md',
    'references/engineering-spec.md',
    'references/execution.md',
    'references/experience-spec.md',
    'references/sources.md',
    'scripts/check_skill.py',
    'tests/test_check_skill.py',
  ],
  'material-agent-readiness-eval-markdown': [
    'SKILL.md',
    'agents/openai.yaml',
    'assets/material-agent-readiness-eval-markdown-report-template.html',
    'assets/report-locales.json',
    'references/assessment-profiles.md',
    'references/audit-method.md',
    'references/layer-model.md',
    'references/report-format.md',
    'scripts/build-report.mjs',
    'scripts/readiness-model.mjs',
    'scripts/scan_markdown.py',
    'scripts/validate-report.mjs',
  ],
  'design-tokens': [
    'SKILL.md',
  ],
};

// Slice one capability_decisions list item by its leading "  - name:" line.
function catalogBlock(name) {
  const lines = read('skills/catalog.yaml').split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^\\s*-\\s+name:\\s*${name}\\s*$`).test(line));
  if (start < 0) return null;
  const indent = lines[start].match(/^\s*/)[0];
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (new RegExp(`^${indent}-\\s+name:`).test(lines[index])) { end = index; break; }
  }
  return lines.slice(start, end).join('\n');
}

test('ORACLE-P1-INTAKE each package has an offline readable in-repo copy', () => {
  for (const item of packages) {
    expect(existsSync(join(root, item.entry)), `ORACLE-P1-INTAKE missing vendored entry ${item.entry}`).toBe(true);
    expect(read(item.entry).length, `${item.entry} must contain real bytes`).toBeGreaterThan(100);
  }
});

test('ORACLE-P1-INTAKE the whole text closure is copied, not just the entry file', () => {
  for (const [name, files] of Object.entries(vendoredFiles)) {
    for (const file of files) {
      const path = `skills/external/${name}/${file}`;
      expect(existsSync(join(root, path)), `ORACLE-P1-INTAKE missing closure file ${path}`).toBe(true);
      expect(read(path).length, `${path} must not be empty`).toBeGreaterThan(0);
    }
  }
});

test('ORACLE-P1-INTAKE external README records the seven registration fields per package', () => {
  const index = read('skills/external/README.md');
  for (const item of packages) {
    expect(index, `ORACLE-P1-INTAKE README must name ${item.name}`).toContain(item.name);
    expect(index, `ORACLE-P1-INTAKE README must pin ${item.commit}`).toContain(item.commit);
    expect(index, `ORACLE-P1-INTAKE README must name local path ${item.localPath}`).toContain(item.localPath);
    expect(index, `ORACLE-P1-INTAKE README must carry the real upstream URL ${item.sourceUrl}`).toContain(item.sourceUrl);
  }
  expect(index, 'ORACLE-P1-INTAKE README must state that vendored scripts are not executed').toMatch(/不执行|not executed/u);
});

test('ORACLE-P1-INTAKE catalog records every package as an absorbed capability', () => {
  for (const item of packages) {
    const block = catalogBlock(item.name);
    expect(block, `ORACLE-P1-INTAKE catalog must hold an entry named ${item.name}`).toBeTruthy();
    expect(block, `${item.name} must be absorbed`).toMatch(/status:\s*absorbed/u);
    expect(block, `${item.name} must record the local path`).toContain(item.localPath);
    expect(block, `${item.name} must record the pinned commit`).toContain(item.commit);
    expect(block, `${item.name} must record the real upstream URL`).toContain(item.sourceUrl);
    expect(block, `${item.name} must carry a license field even when the license is unstated`).toMatch(/\n\s*license:/u);
    if (item.license === null) expect(block, `${item.name} must not claim a license it does not have`).toMatch(/license:\s*(?:null|~|"")/u);
    else expect(block).toContain(item.license);
    expect(block, `${item.name} needs a readable update policy`).toMatch(/update_policy:\s*\S/u);
    expect(block, `${item.name} needs recorded local changes`).toMatch(/local_changes:\s*\S/u);
  }
});

test('ORACLE-P1-INTAKE reusable registry points at the vendored capabilities', () => {
  expect(read('skills/reuse-registry.md')).toContain('skills/external/');
});

test('ORACLE-P1-INTAKE PRD stops forbidding what the accepted decision now allows', () => {
  const prd = read('specs/workflowhub-ui-frontend-release-20261020/prd.md');
  expect(prd, 'ORACLE-P1-INTAKE the old blanket ban must be replaced by the accepted copy rule').not.toContain('不复制未知许可语料');
  expect(prd).toMatch(/skills\/external\//u);
  expect(prd).toMatch(/未声明许可|许可状态/u);
});
