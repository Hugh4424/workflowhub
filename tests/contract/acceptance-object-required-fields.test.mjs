// C01 frozen oracle: execute the template-owned producer, never a test-local checker.
// Missing producer is document-source RED; missing-field behavioral results stay unavailable until it exists.
import { expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const template = new URL('../../skills/spec-specify/templates/spec-template.md', import.meta.url);
const marker = '<!-- c01-acceptance-object-check -->';
const fields = ['workspace', 'service', 'route', 'state', 'viewport'];
const valid = () => ({ workspace: '/owned/project', service: 'http://127.0.0.1:3000', route: '/workbench', state: 'default', viewport: { width: 1280, height: 800 } });
function producer() {
  const text = readFileSync(template, 'utf8');
  expect(text.split(marker).length - 1, 'ORACLE-C01-ACCEPTANCE-SOURCE: exactly one extractable template producer').toBe(1);
  const tail = text.slice(text.indexOf(marker) + marker.length);
  const block = tail.match(/^\s*(`{3,}|~{3,})(?:javascript|js)\s*\n([\s\S]*?)\n\1[ \t]*(?:\n|$)/);
  expect(block, 'ORACLE-C01-ACCEPTANCE-SOURCE: executable JavaScript fence immediately follows marker').not.toBeNull();
  expect(block[2], 'ORACLE-C01-ACCEPTANCE-SOURCE: named template producer').toMatch(/export\s+function\s+checkAcceptanceObject\s*\(/);
  // Only remove the declared export syntax. All validation logic comes from the actual author-owned template.
  const body = block[2].replace(/export\s+function\s+checkAcceptanceObject\b/, 'function checkAcceptanceObject');
  const check = runInNewContext(body + '\ncheckAcceptanceObject;', Object.create(null), { timeout: 1000 });
  expect(typeof check, 'ORACLE-C01-ACCEPTANCE-SOURCE: runnable producer').toBe('function');
  return (input, context) => JSON.parse(JSON.stringify(check(input, context)));
}
test('ORACLE-C01-ACCEPTANCE-SOURCE template exposes one runnable actual producer', () => { producer(); });
test('ORACLE-C01-ACCEPTANCE valid object is consumed without losing real inputs', () => {
  const input = { ...valid(), owner: '设计维护者' }, result = producer()(input);
  expect(result).toMatchObject({ ok: true, missing_fields: [], object: input });
});
test.each(fields)('ORACLE-C01-ACCEPTANCE missing %s produces named deterministic error fact', field => {
  const input = valid(); delete input[field];
  expect(producer()(input)).toMatchObject({ ok: false, missing_fields: [field] });
});
test.each(fields.flatMap(field => [undefined, null, '', '   '].map(value => [field, value])))('ORACLE-C01-ACCEPTANCE empty %s=%s cannot silently pass', (field, value) => {
  expect(producer()({ ...valid(), [field]: value })).toMatchObject({ ok: false, missing_fields: [field] });
});
test('ORACLE-C01-ACCEPTANCE owner defaults visibly to user and supplied owner is preserved', () => {
  const check = producer();
  for (const owner of [undefined, null, '', '   ']) expect(check({ ...valid(), owner }).object.owner).toBe('用户');
  expect(check({ ...valid(), owner: '真实设计owner' }).object.owner).toBe('真实设计owner');
});
test('ORACLE-C01-ACCEPTANCE all missing fields are reported in stable independent-source order', () => {
  expect(producer()({})).toMatchObject({ ok: false, missing_fields: fields });
});
test.each(['../../workflows/build-plan/SKILL.md', '../../workflows/build-code/SKILL.md'])('ORACLE-C01-ACCEPTANCE method %s names actual template producer and real execution input', path => {
  const method = readFileSync(new URL(path, import.meta.url), 'utf8');
  expect(method, 'method must consume the unique producer, not define another checker').toContain('checkAcceptanceObject');
  expect(method).toContain('skills/spec-specify/templates/spec-template.md');
  expect(method).toMatch(/(?:执行|运行|execute|run)[^\n]*(?:验收对象|acceptance|checkAcceptanceObject)/i);
});

// TCR-SHARED-CLI-001, independently approved: append CLI cases; all 31 original Web assertions above stay verbatim.
// Constructed source mappings exercise structure/ref resolution only. They do not certify real non-UI facts or an implemented/running CLI.
const cliFields = ['workspace', 'state', 'cli.command', 'cli.entry_ref', 'cli.sample_ref', 'cli.oracle_ref'];
const cliRefFields = ['entry_ref', 'sample_ref', 'oracle_ref'];
const uiSourceNames = ['raw_requirement', 'project_inventory', 'planned_or_changed_frontend_fact'];
const cliValid = () => ({
  workspace: '/owned/cli-project', state: { scenario: 'planned CLI acceptance', execution: 'not_run' },
  cli: { command: 'node tools/cli/planned-command.mjs --session=/owned/sample.jsonl', entry_ref: 'authority#/entry', sample_ref: 'samples#/one', oracle_ref: 'authority#/oracle' },
  owner: 'CLI设计维护者',
});
function cliContext() {
  return {
    ui_applicability: {
      raw_requirement: { ui_scope: false, source_ref: 'requirements', reason: 'constructed requirement describes local CLI output' },
      project_inventory: { ui_scope: false, source_ref: 'inventory', reason: 'constructed inventory contains a Node entry' },
      planned_or_changed_frontend_fact: { ui_scope: false, source_ref: 'frontend', reason: 'constructed changed surface has no frontend' },
    },
    sources: {
      requirements: 'Constructed CLI requirement source, read by this test fixture.',
      inventory: { entry: 'tools/cli/planned-command.mjs' },
      frontend: ['Constructed frontend applicability source.'],
      authority: { entry: { planned_path: 'tools/cli/planned-command.mjs', execution: 'not_run' }, oracle: { rule: 'compare original required counts and explicit missing facts' } },
      samples: { one: { source_ref: '/owned/sample.jsonl', role: 'constructed acceptance sample reference' } },
    },
  };
}
function cliSet(input, field, value, remove = false) {
  const [head, tail] = field.split('.'), target = tail ? input[head] : input, key = tail ?? head;
  if (remove) delete target[key]; else target[key] = value;
}
function expectWebFallback(context, input = cliValid()) {
  expect(producer()(input, context)).toMatchObject({ ok: false, missing_fields: ['service', 'route', 'viewport'] });
}
function freezeFixture(value) {
  if (value && typeof value === 'object') { for (const item of Object.values(value)) freezeFixture(item); Object.freeze(value); }
  return value;
}

test('ORACLE-C01-CLI legitimate three-source non-UI object passes with nested CLI fields and planned execution untouched', () => {
  const input = cliValid(), result = producer()(input, cliContext());
  expect(result, 'ORACLE-C01-CLI-TARGET: valid real-shape CLI acceptance must not require fictional Web fields').toEqual({ ok: true, missing_fields: [], object: input });
  expect(result.object.state.execution).toBe('not_run');
  expect(Object.keys(result).sort()).toEqual(['missing_fields', 'object', 'ok']);
});
test.each(cliFields)('ORACLE-C01-CLI missing %s is reported by its exact field path', field => {
  const input = cliValid(); cliSet(input, field, undefined, true);
  expect(producer()(input, cliContext())).toMatchObject({ ok: false, missing_fields: [field] });
});
test.each(cliFields.flatMap(field => [undefined, null, '', '   '].map(value => [field, value])))('ORACLE-C01-CLI empty %s=%s remains a required missing fact', (field, value) => {
  const input = cliValid(); cliSet(input, field, value);
  expect(producer()(input, cliContext())).toMatchObject({ ok: false, missing_fields: [field] });
});
test('ORACLE-C01-CLI all missing paths preserve the six-field order', () => {
  expect(producer()({}, cliContext())).toMatchObject({ ok: false, missing_fields: cliFields });
});
test.each([undefined, null, '', 'CLI', [], 42, false])('ORACLE-C01-CLI invalid cli container %s reports all four nested fields without throwing', cli => {
  expect(producer()({ ...cliValid(), cli }, cliContext())).toMatchObject({ ok: false, missing_fields: cliFields.slice(2) });
});
test('ORACLE-C01-CLI top-level command/ref aliases cannot replace the nested cli object', () => {
  const input = cliValid(); Object.assign(input, input.cli); delete input.cli;
  expect(producer()(input, cliContext())).toMatchObject({ ok: false, missing_fields: cliFields.slice(2) });
});
test.each([[], {}, 0, false, ['node', 'entry.mjs']])('ORACLE-C01-CLI non-text command %s is rejected', command => {
  const input = cliValid(); input.cli.command = command;
  expect(producer()(input, cliContext())).toMatchObject({ ok: false, missing_fields: ['cli.command'] });
});
test.each(cliRefFields.flatMap(field => ['missing-source', 'authority#/missing', 'authority#not-a-pointer', 'authority#/bad~2escape', 'authority#/toString', 'authority#/__proto__/entry'].map(ref => [field, ref])))('ORACLE-C01-CLI %s cannot resolve invalid/non-own ref %s', (field, ref) => {
  const input = cliValid(); input.cli[field] = ref;
  expect(producer()(input, cliContext())).toMatchObject({ ok: false, missing_fields: ['cli.' + field] });
});
test.each(cliRefFields.flatMap(field => [undefined, null, '', '   ', {}, [], 0, false].map(value => [field, value])))('ORACLE-C01-CLI %s cannot treat empty/primitive source %s as an authority', (field, value) => {
  const input = cliValid(), context = cliContext(); input.cli[field] = 'empty-target'; context.sources['empty-target'] = value;
  expect(producer()(input, context)).toMatchObject({ ok: false, missing_fields: ['cli.' + field] });
});
test('ORACLE-C01-CLI RFC6901 escaped own paths and direct material keys remain usable', () => {
  const input = cliValid(), context = cliContext(); context.sources.escaped = { 'a/b': { '~key': ['actual constructed material text'] } };
  input.cli.entry_ref = 'escaped#/a~1b/~0key/0'; input.cli.sample_ref = 'requirements';
  expect(producer()(input, context)).toMatchObject({ ok: true, missing_fields: [], object: input });
});
test('ORACLE-C01-CLI inherited material keys cannot satisfy an authority reference', () => {
  const input = cliValid(), context = cliContext(); Object.setPrototypeOf(context.sources, { inherited_material: 'not an own source' }); input.cli.entry_ref = 'inherited_material';
  expect(producer()(input, context)).toMatchObject({ ok: false, missing_fields: ['cli.entry_ref'] });
});
test('ORACLE-C01-CLI one actual material ref may be shared without a new independent-source gate', () => {
  const context = cliContext(); for (const name of uiSourceNames) context.ui_applicability[name].source_ref = 'requirements';
  expect(producer()(cliValid(), context)).toMatchObject({ ok: true, missing_fields: [] });
});
test.each(uiSourceNames)('ORACLE-C01-CLI absent %s context source falls back to all Web requirements', name => {
  const context = cliContext(); delete context.ui_applicability[name]; expectWebFallback(context);
});
test.each(uiSourceNames.flatMap(name => [undefined, null, true, 'false', 'unknown', 0].map(scope => [name, scope])))('ORACLE-C01-CLI non-false %s scope=%s cannot exempt Web fields', (name, scope) => {
  const context = cliContext(); context.ui_applicability[name].ui_scope = scope; expectWebFallback(context);
});
test.each(uiSourceNames.flatMap(name => [undefined, null, '', '   ', 0].map(reason => [name, reason])))('ORACLE-C01-CLI missing/non-text %s reason=%s cannot exempt Web fields', (name, reason) => {
  const context = cliContext(); context.ui_applicability[name].reason = reason; expectWebFallback(context);
});
test.each(uiSourceNames.flatMap(name => [undefined, null, '', 'missing-source', 'authority#not-pointer', 'authority#/bad~2escape', 'authority#/toString'].map(ref => [name, ref])))('ORACLE-C01-CLI invalid %s source_ref=%s cannot exempt Web fields', (name, ref) => {
  const context = cliContext(); context.ui_applicability[name].source_ref = ref; expectWebFallback(context);
});
test.each(uiSourceNames.flatMap(name => [undefined, null, '', '   ', {}, [], 0, false].map(value => [name, value])))('ORACLE-C01-CLI %s empty/primitive cited source=%s cannot select non-UI', (name, value) => {
  const context = cliContext(); context.ui_applicability[name].source_ref = 'bad-scope-target'; context.sources['bad-scope-target'] = value; expectWebFallback(context);
});
test.each([undefined, null, {}, [], 0, 'CLI', { ui_applicability: {} }, { ui_applicability: cliContext().ui_applicability }, { sources: cliContext().sources }])('ORACLE-C01-CLI invalid/incomplete context %s falls back without adding context TypeErrors', context => {
  expectWebFallback(context);
});
test('ORACLE-C01-CLI a UI source dominates conflicting non-UI declarations and keeps original Web behavior', () => {
  const context = cliContext(); context.ui_applicability.project_inventory.ui_scope = true;
  expectWebFallback(context);
  const web = { ...valid(), cli: cliValid().cli };
  expect(producer()(web, context)).toMatchObject({ ok: true, missing_fields: [], object: { ...web, owner: '用户' } });
});
test('ORACLE-C01-CLI kind/non_UI/input.ui_applicability labels alone cannot select CLI', () => {
  const input = { ...cliValid(), kind: 'CLI', non_UI: true, ui_applicability: cliContext().ui_applicability };
  for (const context of [undefined, { kind: 'CLI', non_UI: true }, { ...cliContext(), ui_applicability: undefined, kind: 'CLI' }]) expectWebFallback(context, input);
});
test('ORACLE-C01-CLI owner defaults visibly and provided owner stays unchanged', () => {
  const check = producer();
  for (const owner of [undefined, null, '', '   ']) expect(check({ ...cliValid(), owner }, cliContext()).object.owner).toBe('用户');
  expect(check({ ...cliValid(), owner: '真实CLI owner' }, cliContext()).object.owner).toBe('真实CLI owner');
});
test('ORACLE-C01-CLI producer leaves frozen input/context and planned not_run values untouched', () => {
  const input = freezeFixture(cliValid()), context = freezeFixture(cliContext()), beforeInput = JSON.stringify(input), beforeContext = JSON.stringify(context);
  const result = producer()(input, context);
  expect(result).toMatchObject({ ok: true, missing_fields: [], object: input });
  expect(JSON.stringify(input)).toBe(beforeInput); expect(JSON.stringify(context)).toBe(beforeContext); expect(result.object.state.execution).toBe('not_run');
});
test.each([undefined, null, [], 'CLI', 0, false])('ORACLE-C01-CLI original invalid input %s still throws independently of valid CLI context', input => {
  expect(() => producer()(input, cliContext())).toThrow(/acceptance input must be an object/);
});
