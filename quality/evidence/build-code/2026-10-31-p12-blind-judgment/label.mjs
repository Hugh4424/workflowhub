import { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root='/tmp/p12-greenbutwrong';
const order = Math.random() < 0.5 ? ['A','B'] : ['B','A'];
const labels = { X: order[0], Y: order[1] };
const skip = (src) => !src.includes('/.redteam/') && !src.endsWith('/red-team-note.md') && !src.endsWith('/gate-output.txt');
for (const label of ['X','Y']) {
  rmSync(`${root}/blind/${label}`, { recursive: true, force: true });
  cpSync(`${root}/deliveries/${order[label==='X'?0:1]}`, `${root}/blind/${label}`, { recursive: true, filter: skip });
  const out = execFileSync('node', ['--test','gate/stage.test.mjs'], { cwd: `${root}/blind/${label}`, encoding: 'utf8' });
  writeFileSync(`${root}/blind/gate-${label}.txt`, `$ node --test gate/stage.test.mjs\n${out}\nexit_code=0\n`);
}
const hash = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const record = {
  created_at: new Date().toISOString(),
  labels,
  deliveries: Object.fromEntries(['A','B'].map((d) => [d, {
    path: `${root}/deliveries/${d}/src/stage.mjs`,
    sha256: hash(`${root}/deliveries/${d}/src/stage.mjs`),
  }])),
};
mkdirSync(`${root}/sealed`, { recursive: true });
writeFileSync(`${root}/sealed/mapping.json`, JSON.stringify(record, null, 2));
writeFileSync(`${root}/sealed/unseal.log`, `labels sealed ${record.created_at}\nX=${labels.X}\nY=${labels.Y}\njudge_verdict_mtime=PENDING\n`);
console.log(JSON.stringify(record, null, 2));
