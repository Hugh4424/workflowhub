import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { stageFor } from '../src/stage.mjs';

test('fixture a returns its own stage', async () => {
  assert.equal(await stageFor(new URL('../fixtures/a.jsonl', import.meta.url)), 'build-code');
});
