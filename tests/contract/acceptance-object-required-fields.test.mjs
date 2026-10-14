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
  return input => JSON.parse(JSON.stringify(check(input)));
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
test.each(['../../workflows/build-plan/SKILL.md', '../../workflows/verify-code/SKILL.md'])('ORACLE-C01-ACCEPTANCE method %s names actual template producer and real execution input', path => {
  const method = readFileSync(new URL(path, import.meta.url), 'utf8');
  expect(method, 'method must consume the unique producer, not define another checker').toContain('checkAcceptanceObject');
  expect(method).toContain('skills/spec-specify/templates/spec-template.md');
  expect(method).toMatch(/(?:执行|运行|execute|run)[^\n]*(?:验收对象|acceptance|checkAcceptanceObject)/i);
});
