#!/usr/bin/env bash
# Scenario only; invoke inside the existing isolated-browser-qa --run lifecycle.
# No service/browser launch, backend calls, live accounts or storage seeding.
# Independent sources: decision/PRD C05; source SimulationBoard sample/archives;
# PaperBuilder live-cockpit.tsx:131-158 (cancel, exact confirmation, requested != effect).
# Parent-supplied public mock contract fixes routes/state selector and visible command ids.
# This script does not prove source fidelity, backend trading or human approval.
set -euo pipefail
: "${BROWSER_QA_SESSION:?existing isolated QA session required}"
: "${BROWSER_QA_ENGINE:?selected QA engine required}"
: "${C05_TASK_ROOT:?authenticated task root required}"
: "${C05_PROTOTYPE_URL:?UI author must supply the ready service URL}"
: "${C05_VIEWPORT_WIDTH:?explicit source-selected viewport width required}"
: "${C05_VIEWPORT_HEIGHT:?explicit observed viewport height required}"
if [[ "$BROWSER_QA_ENGINE" != agent-browser ]]; then
  printf '%s\n' 'Harness input failure: this scenario supports only the selected agent-browser engine.' >&2
  exit 2
fi
node --input-type=module - "${1:-all}" <<'NODE'
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { openTask } from './runtime/task/task-handle.mjs';

const task = openTask(process.env.C05_TASK_ROOT, {
  projectName: 'workflowhub', taskId: 'workflowhub-ui-frontend-c05-prototype-design-review-20261027',
});
const base = new URL(process.env.C05_PROTOTYPE_URL);
if (!['http:', 'https:'].includes(base.protocol) || !['127.0.0.1', 'localhost'].includes(base.hostname)
  || base.username || base.password) throw new Error('HARNESS: an explicit credential-free localhost mock URL is required');
const mode = process.argv[2];
if (!['all', 'records', 'live', 'states', 'async'].includes(mode)) throw new Error('HARNESS: unknown scenario');
const width = Number(process.env.C05_VIEWPORT_WIDTH), height = Number(process.env.C05_VIEWPORT_HEIGHT);
if (![1440, 1024, 640].includes(width) || !Number.isInteger(height) || height < 300) {
  throw new Error('HARNESS: use one of the three source-selected widths and an explicit valid height');
}
const session = process.env.BROWSER_QA_SESSION;
let reachedPage = false, assertions = 0;
const observed = [];
function check(condition, message) {
  assertions += 1;
  assert.ok(condition, `ORACLE-PROTOTYPE-JOURNEY: ${message}`);
}
function ab(...args) {
  const argv = ['--session', session, '--json', ...args];
  const start = Date.now();
  const run = spawnSync('agent-browser', argv, { encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024 });
  console.log(JSON.stringify({ kind: 'browser_command', argv, exit: run.status, signal: run.signal,
    duration_ms: Date.now() - start, stdout: run.stdout ?? '', stderr: run.stderr ?? '' }));
  if (run.error || run.status !== 0) throw new Error(`HARNESS: browser command unavailable: ${args.join(' ')}; ${run.error?.message ?? run.stderr}`);
  let result;
  try { result = JSON.parse(run.stdout); } catch { throw new Error(`HARNESS: command did not return JSON: ${args.join(' ')}`); }
  if (result.success === false) throw new Error(`HARNESS: browser command rejected: ${JSON.stringify(result.error)}`);
  return result.data ?? result;
}
function scalar(data, key) {
  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') return data;
  if (data && Object.hasOwn(data, key)) return data[key];
  throw new Error(`HARNESS: missing ${key} in CLI output`);
}
function snapshot(scope) {
  if (scope?.includes('dialog:modal')) {
    const matches = Number(scalar(ab('get', 'count', scope), 'count'));
    check(matches === 1, 'one actual top modal scoped snapshot, found ' + matches);
  }
  const value = ab('snapshot', ...(scope ? ['-s', scope] : []));
  const text = scalar(value, 'snapshot');
  if (typeof text !== 'string' || !text.trim()) throw new Error('HARNESS: empty/unreadable accessibility snapshot');
  return text;
}
function ref(role, name, scope) {
  // Ref lifetime is this call only. Read again after every navigation/rerender.
  const text = snapshot(scope);
  const byRef = new Map();
  for (const match of text.matchAll(/(?:^|\n)\s*-\s+(\S+)\s+"([^"\n]*)"[^\n]*\[(?:[^,\]\n]+,\s*)*ref=(e\d+)(?:,\s*[^,\]\n]+)*\]/g)) {
    const previous = byRef.get(match[3]);
    if (previous && previous[0].trim() !== match[0].trim()) {
      throw new Error('HARNESS: conflicting snapshot rows for ref ' + match[3]);
    }
    byRef.set(match[3], match);
  }
  const matches = [...byRef.values()]
    .filter(([, actualRole, actualName]) => actualRole === role
      && (typeof name === 'string' ? actualName.replace(/\s/g, '') === name.replace(/\s/g, '') : name.test(actualName)));
  check(matches.length === 1, `one accessible ${role} ${String(name)}; found ${matches.length}`);
  return `@${matches[0][3]}`;
}
const click = (role, name, scope) => ab('click', ref(role, name, scope));
const enabled = (role, name, scope) => scalar(ab('is', 'enabled', ref(role, name, scope)), 'enabled');
const text = selector => scalar(ab('get', 'text', selector), 'text');
const count = selector => Number(scalar(ab('get', 'count', selector), 'count'));
const url = () => new URL(String(scalar(ab('get', 'url'), 'url')));
const pageContent = () => count('main') ? 'main' : '.source-prototype';
const sample = process.env.C05_SAMPLE;
if (!['A', 'B'].includes(sample) || base.search || base.hash
  || !(process.env.C05_BASELINE === '1' ? base.pathname.endsWith('/empty-baseline.html') : base.pathname.endsWith('/index.html'))) {
  throw new Error('HARNESS: explicit A/B static index file (or healthy empty-baseline file) required');
}
function targetFor(path) {
  const logical = new URL(path, base.origin), target = new URL(base.href);
  for (const key of logical.searchParams.keys()) if (logical.searchParams.getAll(key).length !== 1) throw new Error('HARNESS: ambiguous logical query ' + key);
  target.search = logical.search;
  if (sample === 'A') {
    if (!['/simulation', '/workbench'].includes(logical.pathname)) throw new Error('HARNESS: wrong A logical page');
    const id = logical.searchParams.get('simId');
    if (logical.pathname === '/workbench' && (!id || logical.searchParams.getAll('simId').length !== 1)) throw new Error('HARNESS: workbench id required, no default');
    if (logical.pathname === '/simulation' && id !== null) throw new Error('HARNESS: unexpected simulation id');
    target.searchParams.delete('simId');
    target.hash = logical.pathname === '/workbench' ? 'workbench?simId=' + encodeURIComponent(id) : 'simulation';
  } else {
    if (logical.pathname !== '/live') throw new Error('HARNESS: wrong B logical page');
    target.hash = '';
  }
  return target;
}
function sameTarget(current, expected) {
  const query = value => JSON.stringify([...value.searchParams.entries()].sort());
  return current.origin === expected.origin && current.pathname === expected.pathname
    && current.hash === expected.hash && query(current) === query(expected);
}
function onPage(page, id) {
  const current = url();
  if (current.origin !== base.origin || current.pathname !== base.pathname || current.searchParams.has('simId')) return false;
  if (page === 'simulation') return current.hash === '#simulation';
  if (page === 'workbench') {
    if (!current.hash.startsWith('#workbench?')) return false;
    const query = new URLSearchParams(current.hash.slice('#workbench?'.length));
    return query.getAll('simId').length === 1 && query.get('simId') === id;
  }
  return page === 'live' && current.hash === '';
}
function navigate(path) {
  const expected = targetFor(path);
  ab('open', expected.href);
  const http = new URL(expected.href); http.hash = '';
  const status = spawnSync('curl', ['--silent', '--output', '/dev/null', '--write-out', '%{http_code}', http.href], {encoding:'utf8'});
  console.log(JSON.stringify({kind:'navigation_http',logical_input:path,actual_file:http.href,exit:status.status,http_status:status.stdout}));
  if(status.status!==0||status.stdout!=='200')throw new Error('HARNESS: target static file must return HTTP200');
  if(process.env.C05_BASELINE!=='1')ab('wait', '.prototype-controls');
  const current = url();
  const tree = snapshot();
  if (!sameTarget(current, expected) || (process.env.C05_BASELINE==='1' ? count('[data-c05-empty-baseline]')!==1 : !/combobox "Mock\s*状态"/.test(tree))) {
    throw new Error('HARNESS: expected static file, query, logical hash and DOM-ready identity not reached');
  }
  reachedPage = true;
  observed.push({ path: current.pathname + current.search + current.hash, viewport: { width, height }, title: scalar(ab('get', 'title'), 'title') });
}
async function screenshot(label) {
  const temp = realpathSync(mkdtempSync(join(tmpdir(), 'prototype-qa-image-')));
  try {
    const file = join(temp, 'screen.png');
    ab('screenshot', file);
    const path = await task.appendRecord({ dir: 'quality/evidence', slug: `prototype-${label}-${width}`, ext: 'png', bytes: readFileSync(file) });
    console.log(JSON.stringify({ kind: 'screenshot_original', path, viewport: { width, height } }));
  } finally {
    if (dirname(temp) !== realpathSync(tmpdir()) || !basename(temp).startsWith('prototype-qa-image-')) {
      throw new Error('HARNESS: refusing cleanup outside owned temporary screenshot directory');
    }
    rmSync(temp, { recursive: true, force: true });
  }
}
function openDetail() {
  click('button', '查看 NQ 品种详情');
  check(snapshot().includes('dialog "NQ 品种详情"'), 'NQ detail dialog opens for chosen symbol');
}
function openConfirmation() {
  click('button', '单品种清仓', 'dialog:modal:not(:has(~ dialog:modal))');
  check(snapshot().includes('dialog "确认单品种清仓"'), 'dangerous action has a separate confirmation dialog');
  check(/仅发出|发出.*请求|不会.*零/.test(text('dialog:modal:not(:has(~ dialog:modal))')), 'confirmation retains requested-versus-effective warning');
}
function fillConfirmation(value) {
  ab('fill', ref('textbox', '确认文字', 'dialog:modal:not(:has(~ dialog:modal))'), value);
}
function history() { click('tab', /^命令历史(?:\s*\d+)?$/); }
function commandCount() { return count('[data-command-id]'); }
function commandText() { return text('[data-command-id="MOCK-CMD-0001"]'); }

async function records() {
  navigate('/simulation?state=default');
  check(count('[data-simulation-id="sim-001"]') === 1, 'source sim-001 exists, not a count-only substitute');
  check(/NQ.*吸收反转/.test(text('[data-simulation-id="sim-001"]')), 'source record identity remains visible');
  const archiveRef = ref('button', /^(?:历史\/归档|归档历史|归档)(?:\s+\d+)?$/);
  const expanded = String(scalar(ab('get', 'attr', archiveRef, 'aria-expanded'), 'value'));
  check(expanded === 'false', 'archive is initially collapsed');
  ab('click', archiveRef);
  for (const id of ['sim-004', 'sim-005']) check(count(`[data-simulation-id="${id}"]`) === 1, `${id} is available after archive disclosure`);
  await screenshot('simulation-archive');
  click('button', '打开工作台', '[data-simulation-id="sim-001"]');
  ab('wait', '[aria-label="返回"]');
  check(onPage('workbench', 'sim-001'), 'selected source record routes to its own workbench');
  if (count('[role="tablist"][aria-label="工作台面板"]')) click('tab', '详情', '[role="tablist"][aria-label="工作台面板"]');
  const body = text(pageContent());
  check(/NQ/.test(body), 'workbench retains selected symbol');
  check(/模拟权益曲线|权益曲线/.test(body), 'workbench presents the equity chart surface');
  check(/模拟表现|收益|胜率/.test(body), 'workbench presents metrics rather than a screenshot-only shell');
  // Independent source/TCR216: navigate the actual visible panel, then pair fixed event rows.
  if (count('[role="tablist"][aria-label="工作台面板"]')) click('tab', '订单', '[role="tablist"][aria-label="工作台面板"]');
  click('button', '最新事件');
  if (count('[aria-label="展开"]')) click('button', '展开');
  ab('wait', 'ol');
  check(scalar(ab('is', 'visible', 'ol'), 'visible') === true, 'selected run timeline is visible');
  check(onPage('workbench', 'sim-001') && /NQ/.test(text(pageContent())), 'timeline remains on the chosen sim-001 NQ workbench');
  const eventRows = Array.from({ length: count('ol > li') }, (_, i) => text('ol > li:nth-child(' + (i + 1) + ')'));
  check(eventRows.length === 7 && /09:30:00/.test(eventRows[0]) && /运行启动/.test(eventRows[0])
    && /14:52:03/.test(eventRows[6]) && /最后确认行情/.test(eventRows[6]), 'visible timeline pairs fixed first and last source events in order');
  await screenshot('workbench');
  click('button', '返回');
  ab('wait', '[data-simulation-id="sim-001"]');
  check(onPage('simulation'), 'back returns to the simulation record list');
}

async function live() {
  navigate('/live?state=default&permission=allow&role=leader');
  check(count('[data-symbol="NQ"]') === 1, 'ORACLE-SAMPLE-B: NQ card begins the actual four-step journey');
  history(); check(commandCount() === 0, 'fresh mock command history is empty');
  click('tab', '品种监控'); openDetail(); openConfirmation();
  check(enabled('button', '确认单品种清仓', 'dialog:modal:not(:has(~ dialog:modal))') === false, 'empty confirmation cannot submit');
  fillConfirmation('单品种清');
  check(enabled('button', '确认单品种清仓', 'dialog:modal:not(:has(~ dialog:modal))') === false, 'inexact confirmation cannot submit');
  click('button', '取消', 'dialog:modal:not(:has(~ dialog:modal))');
  check(!snapshot().includes('dialog "确认单品种清仓"'), 'cancel dismisses confirmation');
  // The detail may remain open; Escape is a user action, not DOM mutation.
  ab('press', 'Escape'); history(); check(commandCount() === 0, 'cancel creates no command');

  for (const [permission, role] of [['deny', 'leader'], ['missing', 'leader'], ['allow', 'follower']]) {
    navigate(`/live?state=default&permission=${permission}&role=${role}`); openDetail();
    check(enabled('button', '单品种清仓', 'dialog:modal:not(:has(~ dialog:modal))') === false, `${permission}/${role} cannot send a close command`);
    ab('press', 'Escape'); history(); check(commandCount() === 0, 'permission/read-only path leaves command history empty');
  }
  for (const state of ['default', 'partial', 'unknown', 'duplicate']) {
    navigate(`/live?state=${state}&permission=close_only&role=leader`);
    openDetail();
    const positionsBefore = text('dialog:modal:not(:has(~ dialog:modal)) table').match(/(?:\d+ 手|未提供)/g);
    check(Array.isArray(positionsBefore) && positionsBefore.length === 3, 'declared three-account position sample is observable before submission');
    check(enabled('button', '单品种清仓', 'dialog:modal:not(:has(~ dialog:modal))') === true, 'close_only still permits closing a position');
    openConfirmation(); fillConfirmation('单品种清仓');
    check(enabled('button', '确认单品种清仓', 'dialog:modal:not(:has(~ dialog:modal))') === true, 'exact confirmation permits the declared mock action');
    // Two real click events exercise rapid duplicate intent; no private handler calls.
    ab('dblclick', ref('button', '确认单品种清仓', 'dialog:modal:not(:has(~ dialog:modal))'));
    ab('wait', '--text', '发出'); ab('press', 'Escape'); history();
    check(commandCount() === 1, 'one symbol intent creates exactly one visible command');
    const requested = commandText();
    const requestedPositions = text('[data-command-id="MOCK-CMD-0001"] table').match(/(?:\d+ 手|未提供)/g);
    check(JSON.stringify(requestedPositions) === JSON.stringify(positionsBefore), 'requested preserves every observed position before readback; no guessed quantity');
    check(/等待生效|requested/.test(requested), 'submitted command remains requested, not confirmed effective');
    check(!/读回确认已清|全部已清仓/.test(requested), 'request does not falsely announce all positions cleared');
    click('button', '查询读回', '[data-command-id="MOCK-CMD-0001"]');
    check(commandCount() === 1, 'query reads the original command instead of resubmitting');
    const result = commandText();
    const accounts = text('[data-command-id="MOCK-CMD-0001"] table');
    for (const account of ['4821', '7204', '9043']) check(accounts.includes(account), `readback preserves declared mock account ${account}`);
    if (state === 'partial') {
      check(/部分成功/.test(result) && /未知|未生效/.test(result), 'partial response retains unresolved outcomes');
      check(!/全部已清仓|全部成功/.test(result), 'partial response cannot become global success');
      check(/4821[\s\S]*?0 手[\s\S]*?7204[\s\S]*?1 手[\s\S]*?9043[\s\S]*?1 手/.test(accounts), 'partial readback clears only the confirmed account and preserves other quantities');
    } else if (state === 'unknown') {
      check(/结果未知/.test(result), 'unknown readback remains visible');
      check(!/全部已清仓|读回确认已清/.test(result), 'unknown readback is not synthesized into success');
      check(JSON.stringify(accounts.match(/(?:\d+ 手|未提供)/g)) === JSON.stringify(positionsBefore), 'unknown readback preserves original positions rather than filling zero');
    } else {
      check(/已清仓|已清|confirmed/.test(result), 'successful mock readback is visible after querying');
    }
    click('button', '查询读回', '[data-command-id="MOCK-CMD-0001"]');
    check(commandCount() === 1, 'repeat readback does not create another command');
    click('tab', '台账');
    const ledger = text('[role="tabpanel"]');
    check(ledger.includes('MOCK-CMD-0001') && ledger.includes('NQ'), 'ledger exposes the same command and symbol');
    if (state === 'partial') check(/部分成功/.test(ledger) && /未知|未生效/.test(ledger), 'ledger preserves partial account results');
    if (state === 'unknown') check(/结果未知/.test(ledger) && !/读回确认已清|全部已清仓/.test(ledger), 'ledger does not convert unknown to success');
    click('tab', '品种监控');
    const monitor = text('main');
    check(/读回/.test(monitor), 'readback state remains observable alongside monitoring');
    if (state === 'unknown') check(/结果未知/.test(monitor), 'readback light does not announce confirmed after unknown response');
    await screenshot(`live-${state}`);
  }
  await asyncBoundary();
}

async function asyncBoundary() {
  // Independent154/280: native keyboard actions must really expose the race window.
  const key = (role, name, scope) => { ab('focus', ref(role, name, scope)); ab('press', 'Enter'); };
  const triggered = (condition, reason) => { if (!condition) { const error = new Error('INCOMPLETE-ASYNC: ' + reason); error.name = 'CoverageNotTriggered'; throw error; } };
  async function pendingQuery(label) {
    navigate('/live?state=boundary&permission=allow&role=leader');
    openDetail(); openConfirmation(); fillConfirmation('单品种清仓');
    click('button', '确认单品种清仓', 'dialog:modal:not(:has(~ dialog:modal))');
    ab('press', 'Escape'); history();
    check(commandCount() === 1 && /MOCK-CMD-0001.*NQ/.test(commandText()), label + ': original id belongs to NQ');
    const table = text('[data-command-id="MOCK-CMD-0001"] table');
    check((table.match(/1 手/g) ?? []).length === 3 && !table.includes('MOCK-PROOF'), label + ': requested preserves three original positions without proof');
    check(enabled('button', '查询读回', '[data-command-id="MOCK-CMD-0001"]') === true, label + ': original query is enabled');
    const started = Date.now();
    key('button', '查询读回', '[data-command-id="MOCK-CMD-0001"]');
    const pending = commandText();
    triggered(pending.includes('正在查询') && /等待生效/.test(pending), label + ': query pending was not observed');
    check(enabled('button', '正在查询', '[data-command-id="MOCK-CMD-0001"]') === false, label + ': pending query prevents concurrent query');
    const pendingTable = text('[data-command-id="MOCK-CMD-0001"] table');
    check((pendingTable.match(/1 手/g) ?? []).length === 3 && !pendingTable.includes('MOCK-PROOF'), label + ': pending has not fabricated effective positions');
    console.log(JSON.stringify({kind:'async_pending',label,started,observed_at:Date.now(),command:'MOCK-CMD-0001',symbol:'NQ',pending}));
    return started;
  }
  const started = await pendingQuery('switch');
  key('tab', '品种监控'); key('button', '查看 GC 品种详情');
  const gc = text('dialog:modal:not(:has(~ dialog:modal))');
  triggered(snapshot().includes('dialog "GC 品种详情"') && /等待生效/.test(text('.readback-lamp')), 'GC was not shown while original NQ query was pending');
  check(gc.includes('GCZ6') && /价格[\s\S]*未提供/.test(gc), 'GC keeps its contract and missing price during NQ query');
  check((text('dialog:modal:not(:has(~ dialog:modal)) table').match(/1 手/g) ?? []).length === 3, 'GC begins with its own three original quantities');
  console.log(JSON.stringify({kind:'async_switch_before_settle',started,gc_observed_at:Date.now(),gc,lamp:text('.readback-lamp')}));
  ab('wait', '--text', '读回确认已清仓');
  check(snapshot().includes('dialog "GC 品种详情"') && text('dialog:modal:not(:has(~ dialog:modal))').includes('GCZ6'), 'late NQ result cannot replace the selected GC object');
  check((text('dialog:modal:not(:has(~ dialog:modal)) table').match(/1 手/g) ?? []).length === 3, 'late NQ proof cannot clear GC positions');
  check(/MOCK-CMD-0001.*NQ.*读回确认已清仓/.test(text('.readback-lamp')), 'global feedback legitimately reports the original NQ command');
  ab('press', 'Escape'); history();
  check(commandCount() === 1 && /MOCK-CMD-0001.*NQ/.test(commandText()), 'late response retains one original NQ command');
  const settled = text('[data-command-id="MOCK-CMD-0001"] table');
  for (const account of ['4821','7204','9043']) check(settled.includes('MOCK-PROOF-MOCK-CMD-0001-' + account), 'late readback proof stays bound to NQ and account ' + account);
  check((settled.match(/0 手/g) ?? []).length === 3, 'only the original NQ command has three confirmed zero quantities');
  click('tab', '台账'); check(/MOCK-CMD-0001.*NQ/.test(text('[role="tabpanel"]')), 'ledger keeps the same late NQ command');
  await screenshot('live-late-switch');

  const resetStarted = await pendingQuery('reset');
  key('button', '重置样本');
  ab('wait', '--text', '尚无命令'); ab('wait', '.prototype-controls');
  const resetAt = Date.now();
  triggered(resetAt - resetStarted < 1000, 'reset DOM ready did not precede the original 1000ms fixture settle window');
  check(onPage('live') && url().searchParams.get('state') === 'default' && url().searchParams.get('permission') === 'allow' && url().searchParams.get('role') === 'leader', 'reset navigates to the default fresh component in the same static file');
  console.log(JSON.stringify({kind:'async_reset_before_settle',started:resetStarted,reset_dom_ready_at:resetAt,elapsed_ms:resetAt-resetStarted}));
  history(); check(commandCount() === 0 && /暂无命令/.test(text('[role="tabpanel"]')), 'fresh history explicitly shows no command after reset');
  ab('wait', '1200');
  check(commandCount() === 0 && /暂无命令/.test(text('[role="tabpanel"]')), 'old late result cannot revive a command in fresh history');
  click('tab', '台账'); check(/暂无台账/.test(text('[role="tabpanel"]')), 'fresh ledger remains explicitly empty after the old fixture window');
  check(/尚无命令/.test(text('.readback-lamp')) && !text('main').includes('MOCK-PROOF'), 'reset feedback does not revive old proof or confirmed state');
  click('tab', '品种监控'); openDetail();
  check((text('dialog:modal:not(:has(~ dialog:modal)) table').match(/1 手/g) ?? []).length === 3, 'reset keeps the original fresh NQ quantities');
  await screenshot('live-late-reset');
}

async function states() {
  const cases = ['default', 'loading', 'empty', 'error', 'cancel', 'boundary', 'permission', 'duplicate', 'partial', 'unknown'];
  for (const route of (process.env.C05_SAMPLE === 'B' ? ['/live'] : ['/simulation', '/workbench?simId=sim-001'])) {
    for (const state of cases) {
      const target = new URL(route, base.origin); target.searchParams.set('state', state); target.searchParams.set('stress', '1');
      navigate(target.pathname + target.search);
      check(scalar(ab('get', 'value', ref('combobox', 'Mock状态')), 'value') === state, `state selector exposes ${state}`);
      const content = text(pageContent());
      const expected = { loading: /加载|载入/, empty: /暂无|没有|空/, error: /失败|错误|重试/,
        cancel: /取消/, permission: /权限|只读|拒绝/, partial: /部分/, unknown: /未知|未确认/ }[state];
      if (expected) check(expected.test(content), `${route}/${state} has an observable result beyond the selector`);
      // Keyboard/select recovery must change actual URL, not only a local control value.
      ab('select', ref('combobox', 'Mock状态'), 'default');
      const recovered = targetFor(target.pathname + target.search); recovered.searchParams.set('state', 'default');
      check(sameTarget(url(), recovered), 'state recovery synchronizes the same static file, logical page and query');
      ab('wait', '.prototype-controls');
      check(scalar(ab('get', 'value', ref('combobox', 'Mock状态')), 'value') === 'default', 'state control recovered');
      if (state === 'boundary') await screenshot(`${target.pathname.slice(1)}-stress`);
    }
  }
}

try {
  ab('set', 'viewport', String(width), String(height));
  ab('console', '--clear');
  if (mode === 'all' || mode === 'records') await records();
  if (mode === 'all' || mode === 'live') await live();
  if (mode === 'all' || mode === 'states') await states();
  if (mode === 'async') await asyncBoundary();
  console.log(JSON.stringify({ kind: 'scenario_assertions', result: 'passed', mode, assertions, observed,
    coverage_limits: ['mock only, no backend trading', 'visual fidelity needs source comparison',
      'a11y audit requires independent disposition', 'performance is command timing, not web-vitals',
      'document overflow and full focus trap need separate browser observations', 'human approval not obtained by tests'] }));
} catch (error) {
  console.error(JSON.stringify({ kind: 'scenario_failure', reachedPage, assertions, name: error.name, message: error.message }));
  process.exitCode = 1;
} finally {
  // Preserve observations even when a behavior assertion failed. Outer runner owns cleanup.
  if (reachedPage) for (const args of [['console'], ['errors'], ['network', 'requests'], ['a11y', '--tags', 'wcag2a,wcag2aa']]) {
    try { ab(...args); } catch (error) { console.error(JSON.stringify({ kind: 'observation_unavailable', args, reason: error.message })); process.exitCode = 1; }
  }
}
NODE
