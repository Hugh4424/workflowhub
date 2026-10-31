import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stageFor } from '../src/stage.mjs';

// 三条决定性输入在测试里现造，不读交付自带的 fixtures：
// 交付删掉或改掉 fixtures 也躲不开，门禁只认 R-PILOT-001 的字面要求。
function factsFile(t, name, body) {
  const dir = mkdtempSync(join(tmpdir(), 'stage-gate-'));
  const file = join(dir, name);
  writeFileSync(file, body, 'utf8');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return file;
}

function isExplicitError(error) {
  return error instanceof Error && error.message.trim() !== '';
}

test('fixture a returns its own stage', async () => {
  assert.equal(await stageFor(new URL('../fixtures/a.jsonl', import.meta.url)), 'build-code');
});

// 决定性输入一：多行 JSONL，末条 stage 与首条不同。必须读末条。
test('multi-line facts: last row decides, not the first row that carries a stage', async (t) => {
  const file = factsFile(t, 'last-differs.jsonl', [
    '{"task_id":"task-c","stage":"build-code","at":"2026-10-31T02:00:00Z"}',
    '{"task_id":"task-c","stage":"review","at":"2026-10-31T03:00:00Z"}',
    '',
  ].join('\n'));
  assert.equal(await stageFor(file), 'review');
});

// 决定性输入二：空文件。必须明确报错，不得静默返回默认阶段。
test('empty facts file must raise, not fall back to a default stage', async (t) => {
  const file = factsFile(t, 'empty.jsonl', '');
  await assert.rejects(() => stageFor(file), isExplicitError);
});

// 决定性输入三：末条无 stage（前一条有）。必须报错，不得回退到早期行。
test('last row without stage must raise, not fall back to an earlier row', async (t) => {
  const file = factsFile(t, 'no-stage-last.jsonl', [
    '{"task_id":"task-d","stage":"build-code","at":"2026-10-31T04:00:00Z"}',
    '{"task_id":"task-d","at":"2026-10-31T05:00:00Z"}',
    '',
  ].join('\n'));
  await assert.rejects(() => stageFor(file), isExplicitError);
});
