import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {copyFileSync,mkdirSync,mkdtempSync,readFileSync,realpathSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {bootstrapTask} from '../../../../../tools/cli/task-bootstrap.mjs';
import {openTask} from '../../../../../runtime/task/task-handle.mjs';
import {openCurrentTaskWorkspace} from '../../../../../runtime/task/workspace.mjs';
import {runCapture} from '../../../../../workflows/build-code/capture.mjs';
import {collectTestInventory} from '../../../../../workflows/build-code/test-asset-inventory.mjs';

const current=process.cwd();
const root=realpathSync(mkdtempSync(join(tmpdir(),'workflowhub-t019-vitest-')));
const repo=join(root,'repo'),storage=join(root,'storage'),home=join(root,'home');
const hash=(raw)=>createHash('sha256').update(raw).digest('hex');
try {
  const clone=spawnSync('git',['clone','--shared','--local','--quiet',current,repo],{encoding:'utf8'});
  if(clone.status!==0)throw new Error(`isolated clone failed: ${clone.stderr}`);
  mkdirSync(storage); mkdirSync(home);
  // Dependencies remain a test-only link; they are not copied into runtime source.
  symlinkSync('/Users/Hugh/Hugh/Project/workflowhub/node_modules',join(repo,'node_modules'));
  const test='tests/contract/decision-log-census.test.mjs';
  const decision='specs/workflowhub-thin-core-card-04-20260919/decision-log.md';
  copyFileSync(join(current,test),join(repo,test));
  mkdirSync(join(repo,'specs/workflowhub-thin-core-card-04-20260919'),{recursive:true});
  copyFileSync(join(current,decision),join(repo,decision));
  const boot=bootstrapTask({project:'Inventory',task:'t019-vitest-json','target-repo':repo},
    {env:{HOME:home,WORKFLOWHUB_TASK_DIR:storage},home,cwd:repo});
  const task=openTask(boot.task_path,'Inventory','t019-vitest-json');
  const workspace=openCurrentTaskWorkspace(task);
  const runRoot=workspace.worktreeRoot;
  symlinkSync('/Users/Hugh/Hugh/Project/workflowhub/node_modules',join(runRoot,'node_modules'));
  mkdirSync(join(runRoot,'specs/workflowhub-thin-core-card-04-20260919'),{recursive:true});
  copyFileSync(join(current,test),join(runRoot,test));
  copyFileSync(join(current,decision),join(runRoot,decision));
  const registeredId=`${test} > decision-log 原始来源普查：分母非零（T009 gate） > 普查状态是 present（材料存在且被识别）`;
  const command=`npx vitest run ${test} --reporter=json`;
  let receipt;
  try {
    receipt=await runCapture(command,'quality/tests/t019-vitest-json.json',
      {task,workspace,registeredTestIds:[registeredId]});
  } catch (error) {
    const storedOnFailure=JSON.parse(task.readRecord('quality/tests/t019-vitest-json.json'));
    const rawOnFailure=task.readRecord(storedOnFailure.output_ref);
    console.log(JSON.stringify({capture_error:error.message,exit:storedOnFailure.exit_code,
      output_hash:storedOnFailure.output_hash,output_prefix:rawOnFailure.slice(0,1500),
      output_suffix:rawOnFailure.slice(-700)}));
    throw error;
  }
  const stored=JSON.parse(task.readRecord(receipt.receipt_ref));
  const originalOutput=task.readRecord(stored.output_ref);
  const originalReceiptRaw=task.readRecord(receipt.receipt_ref);
  writeFileSync(join(current,'quality/evidence/stage-quality/build-code/P9/T019-vitest-census-raw.output'),originalOutput);
  writeFileSync(join(current,'quality/evidence/stage-quality/build-code/P9/T019-vitest-census-receipt.json'),originalReceiptRaw);
  assert.equal(receipt.exit_code,0);
  assert.equal(receipt.test_inventory.status,'recorded');
  assert.equal(receipt.test_inventory.runner,'vitest');
  assert.equal(receipt.test_inventory.tests.length,6);
  assert.equal(receipt.test_inventory.tests.filter(x=>x.status==='passed').length,6);
  assert.equal(receipt.test_inventory.unmatched.length,5);
  assert.deepEqual(receipt.test_inventory.missing,[]);
  assert.equal(receipt.test_inventory.tests[0].full_id,registeredId);
  assert.equal(hash(originalOutput),stored.output_hash);
  assert.equal(hash(originalReceiptRaw),receipt.receipt_hash);
  console.log(JSON.stringify({positive:{command,exit:receipt.exit_code,runner:receipt.test_inventory.runner,
    tests:receipt.test_inventory.tests.length,registered:receipt.test_inventory.registered_test_ids.length,
    unmatched:receipt.test_inventory.unmatched.length,missing:receipt.test_inventory.missing.length,
    first_id:receipt.test_inventory.tests[0].full_id,output_hash:stored.output_hash,
    receipt_hash:receipt.receipt_hash,snapshot_tree:stored.snapshot_tree,source_digest:stored.source_digest}}));
  const outputPath=task.recordPath(stored.output_ref);
  const receiptPath=task.recordPath(receipt.receipt_ref);
  const collect=(candidate)=>collectTestInventory({task,workspace,receipt:candidate,registeredTestIds:[registeredId]});
  writeFileSync(outputPath,'tampered without hash update\n');
  assert.throws(()=>collect(receipt),/output hash mismatch/);
  console.log('NEGATIVE raw output tamper: output hash mismatch');
  function install(raw){
    writeFileSync(outputPath,raw);
    const next={...stored,output_hash:hash(raw)};
    const receiptRaw=`${JSON.stringify(next,null,2)}\n`;
    writeFileSync(receiptPath,receiptRaw);
    return {...receipt,output_hash:next.output_hash,receipt_hash:hash(receiptRaw)};
  }
  const base=JSON.parse(originalOutput);
  const wrongFile=structuredClone(base);
  wrongFile.testResults[0].name='/tmp/foreign-census.test.mjs';
  assert.throws(()=>collect(install(JSON.stringify(wrongFile))),/file does not match/);
  console.log('NEGATIVE foreign reporter file: rejected');
  const wrongCount=structuredClone(base);
  wrongCount.numTotalTests-=1;
  assert.throws(()=>collect(install(JSON.stringify(wrongCount))),/empty or inconsistent/);
  console.log('NEGATIVE inconsistent test count: rejected');
  const duplicate=structuredClone(base);
  duplicate.testResults[0].assertionResults.push(structuredClone(duplicate.testResults[0].assertionResults[0]));
  duplicate.numTotalTests+=1; duplicate.numPassedTests+=1;
  assert.throws(()=>collect(install(JSON.stringify(duplicate))),/duplicate Vitest runnable ID/);
  console.log('NEGATIVE duplicate full ID: rejected');
  const zero=structuredClone(base);
  zero.testResults[0].assertionResults=[]; zero.numTotalTests=0; zero.numPassedTests=0;
  assert.throws(()=>collect(install(JSON.stringify(zero))),/empty or inconsistent/);
  console.log('NEGATIVE zero tests: rejected');
  const skipped=structuredClone(base);
  skipped.testResults[0].assertionResults[0].status='skipped';
  skipped.numPassedTests-=1; skipped.numPendingTests+=1;
  const skippedInventory=collect(install(JSON.stringify(skipped)));
  assert.equal(skippedInventory.tests[0].status,'skipped');
  assert.deepEqual(skippedInventory.skipped,[registeredId]);
  console.log('CONTROL isolated JSON skipped status: retained, not a passed result');
  const todo=structuredClone(base);
  todo.testResults[0].assertionResults[0].status='todo';
  todo.numPassedTests-=1; todo.numTodoTests+=1;
  const todoInventory=collect(install(JSON.stringify(todo)));
  assert.equal(todoInventory.tests[0].status,'todo');
  console.log('CONTROL isolated JSON todo status: retained, not a passed result');
  assert.throws(()=>collect(install('not JSON\n')),/not one complete JSON document/);
  console.log('NEGATIVE non-JSON output: rejected');
  writeFileSync(outputPath,originalOutput);
  writeFileSync(receiptPath,originalReceiptRaw);
  writeFileSync(join(runRoot,decision),`${readFileSync(join(runRoot,decision),'utf8')}\nsource drift\n`);
  assert.throws(()=>collect(receipt),/stale against the current source snapshot/);
  console.log('NEGATIVE current source drift: stale receipt rejected');
} finally {
  rmSync(root,{recursive:true,force:true});
  console.log('CLEANUP isolated clone and task-store removed');
}
