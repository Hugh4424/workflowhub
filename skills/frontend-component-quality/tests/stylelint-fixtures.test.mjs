import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const frontend = process.env.PAPERBUILDER_FRONTEND;
if (!frontend || !isAbsolute(frontend)) throw new Error('PAPERBUILDER_FRONTEND must name an absolute frontend directory');
if (!statSync(frontend).isDirectory()) throw new Error('PAPERBUILDER_FRONTEND must be a directory');
const stylelint = (await import(pathToFileURL(createRequire(join(frontend, 'package.json')).resolve('stylelint')))).default;
const configPath = join(frontend, 'stylelint.config.mjs');
const fixtures = join(dirname(fileURLToPath(import.meta.url)), 'fixtures/stylelint');
const config = (await import(pathToFileURL(configPath))).default;
async function check(file, settings = config) {
  const path = join(fixtures, file);
  const result = await stylelint.lint({ files: path, config: settings });
  assert.equal(result.results.length, 1, `fixture must exist and be checked: ${file}`);
  assert.equal(result.results[0].source, path);
  assert.equal(result.results[0].parseErrors.length, 0);
  assert.equal(result.results[0].invalidOptionWarnings.length, 0);
  return result.results[0].warnings;
}
function expectsRule(warnings, rule, line) {
  const issue = warnings.find(item => item.rule === rule);
  assert.ok(issue, `expected ${rule}`);
  assert.equal(issue.line, line);
  assert.ok(issue.column > 0);
}
for (const [file, rule, line] of [['illegal/duplicate-selectors.css', 'no-duplicate-selectors', 2], ['illegal/important-without-reason.css', 'declaration-no-important', 1]]) {
  test(`${file} is rejected with location`, async () => expectsRule(await check(file), rule, line));
  test(`${file} loses its expected diagnostic when the rule is deleted`, async () => {
    const withoutRule = { ...config, rules: { ...config.rules, [rule]: null } };
    const warnings = await check(file, withoutRule);
    assert.throws(() => expectsRule(warnings, rule, line), /expected /);
  });
}
for (const file of ['legal/scoped.css', 'legal/important-with-reason.css']) {
  test(`${file} is accepted`, async () => assert.deepEqual(await check(file), []));
}

test('a missing fixture cannot be mistaken for a clean file', async () => {
  await assert.rejects(check('illegal/missing.css'));
});

test('an important disable without a reason is reported', async () => {
  const result = await stylelint.lint({ code: '/* stylelint-disable-next-line declaration-no-important */\n.item { color: red !important; }\n', config });
  const diagnostic = result.results[0].warnings.find(item => item.rule === '--report-descriptionless-disables');
  assert.ok(diagnostic, 'a disable must explain its reason');
  assert.equal(diagnostic.line, 1);
  assert.ok(diagnostic.column > 0);
});
