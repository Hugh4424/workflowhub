import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,readFileSync,realpathSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {bootstrapTask} from '../../../../../tools/cli/task-bootstrap.mjs';
import {openTask} from '../../../../../runtime/task/task-handle.mjs';
import {openCurrentTaskWorkspace} from '../../../../../runtime/task/workspace.mjs';
import {runCapture} from '../../../../../workflows/build-code/capture.mjs';
import {collectTestInventory} from '../../../../../workflows/build-code/test-asset-inventory.mjs';

const hash=(raw)=>createHash('sha256').update(raw).digest('hex');
const root=realpathSync(mkdtempSync(join(tmpdir(),'workflowhub-t019-negative-')));
const repo=join(root,'repo'),storage=join(root,'storage'),home=join(root,'home');
const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','pipe']});
try {
  mkdirSync(repo); mkdirSync(storage); mkdirSync(home); mkdirSync(join(repo,'tests'));
  git('init','-q','-b','main');
  git('config','user.name','T019 negative fixture');
  git('config','user.email','t019@example.test');
  writeFileSync(join(repo,'tests','cases.test.mjs'), [
    "import { describe, it } from 'node:test';",
    "describe('suite', () => {",
    "  it('present', () => {});",
    "  it('skipped', {skip:true}, () => {});",
    "});", "",
  ].join('\n'));
  git('add','.'); git('commit','-qm','two real Node tests');
  const boot=bootstrapTask({project:'Inventory',task:'t019-negative','target-repo':repo},
    {env:{HOME:home,WORKFLOWHUB_TASK_DIR:storage},home,cwd:repo});
  const task=openTask(boot.task_path,'Inventory','t019-negative');
  const workspace=openCurrentTaskWorkspace(task);
  const receipt=await runCapture('node --test --test-reporter=tap tests/cases.test.mjs',
    'quality/tests/t019-negative.json',{task,workspace});
  const ids=['tests/cases.test.mjs > suite > present','tests/cases.test.mjs > suite > skipped'];
  const inventory=collectTestInventory({task,workspace,receipt,registeredTestIds:[ids[0],'tests/cases.test.mjs > suite > vanished']});
  assert.equal(inventory.status,'recorded');
  assert.deepEqual(inventory.unmatched,[ids[1]]);
  assert.deepEqual(inventory.missing,['tests/cases.test.mjs > suite > vanished']);
  assert.deepEqual(inventory.skipped,[ids[1]]);
  console.log('PASS real Node TAP: distinct observed/registered, missing, and skipped classifications');
  assert.throws(()=>collectTestInventory({task,workspace,receipt,registeredTestIds:[ids[0],ids[0]]}),/unique nonempty/);
  console.log('PASS duplicate registration rejected');
  const originalReceipt=JSON.parse(task.readRecord(receipt.receipt_ref));
  const originalOutput=task.readRecord(originalReceipt.output_ref);
  writeFileSync(task.recordPath(originalReceipt.output_ref),'tampered output\n');
  assert.throws(()=>collectTestInventory({task,workspace,receipt,registeredTestIds:[]}),/output hash mismatch/);
  console.log('PASS tampered canonical output rejected');
  function installSyntheticTap(output){
    writeFileSync(task.recordPath(originalReceipt.output_ref),output);
    const stored={...originalReceipt,output_hash:hash(output)};
    const raw=`${JSON.stringify(stored,null,2)}\n`;
    writeFileSync(task.recordPath(receipt.receipt_ref),raw);
    return {...receipt,output_hash:stored.output_hash,receipt_hash:hash(raw)};
  }
  const duplicate=installSyntheticTap('TAP version 13\n# Subtest: dup\nok 1 - dup\n# Subtest: dup\nok 2 - dup\n1..2\n# tests 2\n# suites 0\n# pass 2\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n');
  assert.throws(()=>collectTestInventory({task,workspace,receipt:duplicate,registeredTestIds:[]}),/duplicate Node TAP runnable ID/);
  console.log('PASS isolated synthetic TAP duplicate full ID rejected');
  const zero=installSyntheticTap('TAP version 13\n1..0\n# tests 0\n# suites 0\n# pass 0\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n');
  assert.throws(()=>collectTestInventory({task,workspace,receipt:zero,registeredTestIds:[]}),/missing, truncated, or inconsistent/);
  console.log('PASS isolated synthetic TAP zero tests rejected');
  const malformed=installSyntheticTap('TAP version 13\n# Subtest: orphan\n1..1\n# tests 1\n# pass 1\n# fail 0\n# skipped 0\n# todo 0\n');
  assert.throws(()=>collectTestInventory({task,workspace,receipt:malformed,registeredTestIds:[]}),/missing, truncated, or inconsistent/);
  console.log('PASS isolated synthetic TAP missing result rejected');
  writeFileSync(task.recordPath(originalReceipt.output_ref),originalOutput);
  writeFileSync(task.recordPath(receipt.receipt_ref),`${JSON.stringify(originalReceipt,null,2)}\n`);
} finally {
  rmSync(root,{recursive:true,force:true});
  console.log('CLEANUP isolated temp task/repo removed');
}
