import { readFileSync } from 'node:fs';

export async function stageFor(file) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length === 0) throw new Error('task facts file is empty');
  const row = JSON.parse(lines[lines.length - 1]);
  if (!row || typeof row.stage !== 'string' || row.stage === '') {
    throw new Error('last task fact has no stage');
  }
  return row.stage;
}
