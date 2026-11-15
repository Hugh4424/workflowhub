// ORACLE-DATA-DISCIPLINE（客户端页面态面）
// 本文件只证明固定样本页的客户端状态判定：真实模式首次打开不显示合成成功记录、
// 2xx 的畸形读取不冒充空态、写入只在收到与请求一致的真实回执时报告成功、
// 客户端预算到期后迟到响应不得覆盖超时态。它不证明真实浏览器渲染、其它视口或外部服务。
// 受控输入都在本文件内的假 DOM + 假传输里；原样本 app.js 只按原字节载入，不被改写。
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {join} from 'node:path';
import {describe, it, expect} from 'vitest';

const APP = join(process.cwd(), 'tests/fixtures/design-port-sample/prototype/app.js');
const wait = (ms) => new Promise((done) => setTimeout(done, ms));

function element(tag, attrs = {}) {
  const attributes = new Map(Object.entries(attrs));
  const handlers = new Map();
  const node = {
    tagName: tag.toUpperCase(),
    children: [],
    textContent: '',
    dataset: {},
    __handlers: handlers,
    classList: {
      toggle(name, on) {
        const set = new Set((attributes.get('class') || '').split(/\s+/).filter(Boolean));
        if (on) set.add(name); else set.delete(name);
        attributes.set('class', [...set].join(' '));
      },
    },
    append(...items) { node.children.push(...items); },
    replaceChildren(...items) {
      node.children = items;
      node.textContent = items.map((item) => item && item.__text !== undefined ? item.__text : (item.textContent || '')).join('');
    },
    setAttribute(name, value) { attributes.set(name, String(value)); },
    removeAttribute(name) { attributes.delete(name); },
    getAttribute(name) { return attributes.has(name) ? attributes.get(name) : null; },
    addEventListener(type, fn) { if (!handlers.has(type)) handlers.set(type, []); handlers.get(type).push(fn); },
    remove() { node.__removed = true; },
  };
  return node;
}

// One controlled page instance: only the element surface app.js touches, no browser claim.
function page({action = 'read', recordId = 'sample-01', value = '', timeoutMs = null, fetchImpl}) {
  const ids = {button: 'next-sample', panel: 'result-panel', content: 'result-content', number: 'state-number', label: 'state-label', status: 'status-message', note: 'action-note'};
  const byId = {};
  for (const [key, id] of Object.entries(ids)) byId['#' + id] = element(key === 'button' ? 'button' : 'p');
  byId['#result-panel'].setAttribute('data-legacy-hook', 'sample-result');
  byId['#result-panel'].setAttribute('aria-busy', 'false');
  byId['#next-sample'].textContent = '读取下一份样例';
  const stateItems = ['success', 'empty', 'error'].map((kind) => element('li', {'data-state': kind}));
  const sampleTags = [element('p', {'data-sample-tag': 'page'}), element('p', {'data-sample-tag': 'block'})];
  const document = {
    documentElement: {dataset: {}},
    querySelector: (selector) => byId[selector] ?? null,
    querySelectorAll: (selector) => selector === '[data-state]' ? stateItems : selector === '[data-sample-tag]' ? sampleTags : [],
    createElement: (tag) => element(tag),
    createTextNode: (text) => ({__text: String(text)}),
  };
  const search = new URLSearchParams({mode: 'real', action, recordId});
  if (value) search.set('value', value);
  if (timeoutMs) search.set('timeoutMs', String(timeoutMs));
  const location = {href: `http://127.0.0.1:8768/index.html?${search}`, origin: 'http://127.0.0.1:8768'};
  const window = {location, fetch: fetchImpl, setTimeout, clearTimeout};
  const sandbox = {window, document, URL, AbortController, setTimeout, clearTimeout, console};
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(APP, 'utf8'), sandbox);
  return {
    byId,
    sampleTags,
    click: () => (byId['#next-sample'].__handlers.get('click') || []).forEach((fn) => fn()),
    state: () => byId['#result-panel'].getAttribute('data-state'),
    content: () => byId['#result-content'].textContent,
    status: () => byId['#status-message'].textContent,
  };
}
const json = (status, body) => ({ok: status >= 200 && status < 300, status, text: async () => body});
const readBody = (records) => JSON.stringify({records});

describe('ORACLE-DATA-DISCIPLINE real mode never starts on synthetic success', () => {
  it('shows an empty idle state before any real response', () => {
    const view = page({fetchImpl: async () => json(200, readBody([{name: '真实', value: '真实值'}]))});
    expect(view.state()).toBe('idle');
    expect(view.content()).not.toContain('成功结果样例');
    expect(view.content()).not.toContain('浏览器内置合成数据');
    expect(view.status()).not.toContain('已读取成功样例');
    // No request was sent on open: the page cannot have a real result yet.
    expect(view.sampleTags.filter((tag) => !tag.__removed)).toHaveLength(0);
  });
});

describe('ORACLE-DATA-DISCIPLINE malformed 2xx reads never pose as the empty state', () => {
  for (const [label, body] of [['missing records', '{}'], ['null body', 'null'], ['records not an array', '{"records":"none"}'], ['records object', '{"records":{"0":{}}}']]) {
    it(`turns a 2xx ${label} into an error, not a zero-record empty state`, async () => {
      const view = page({fetchImpl: async () => json(200, body)});
      view.click();
      await wait(40);
      expect(view.state()).toBe('error');
      expect(view.status()).not.toContain('零条记录');
      expect(view.content()).toMatch(/records|响应体/);
    });
  }
  it('keeps a real empty array as the empty state', async () => {
    const view = page({fetchImpl: async () => json(200, readBody([]))});
    view.click();
    await wait(40);
    expect(view.state()).toBe('empty');
    expect(view.content()).toContain('服务返回零条记录');
  });
});

describe('ORACLE-DATA-DISCIPLINE a 2xx write without a matching receipt is not success', () => {
  for (const [label, body] of [['an empty body', ''], ['a null receipt', 'null'], ['a receipt missing receipt_id', '{"recordId":"sample-01","value":"legacy-write","requestId":"req-x","source":"service_store"}']]) {
    it(`rejects ${label}`, async () => {
      const view = page({action: 'write', value: 'legacy-write', fetchImpl: async () => json(200, body)});
      view.click();
      await wait(40);
      expect(view.state()).toBe('error');
      expect(view.status()).not.toContain('写入已完成');
      expect(view.content()).not.toContain('回执：');
    });
  }
  it('rejects a receipt bound to another request', async () => {
    const view = page({action: 'write', value: 'legacy-write', fetchImpl: async () => json(200, JSON.stringify({receipt_id: 'rcpt-01', recordId: 'sample-01', value: 'legacy-write', requestId: 'req-other', source: 'service_store'}))});
    view.click();
    await wait(40);
    expect(view.state()).toBe('error');
    expect(view.status()).not.toContain('写入已完成');
  });
  it('accepts only a receipt echoed for this request', async () => {
    const view = page({action: 'write', value: 'legacy-write', fetchImpl: async (url, init) => {
      const request = JSON.parse(init.body);
      return json(200, JSON.stringify({receipt_id: 'rcpt-01', recordId: request.recordId, value: request.value, requestId: request.requestId, status: 'stored', source: 'service_store'}));
    }});
    view.click();
    await wait(40);
    expect(view.state()).toBe('receipt');
    expect(view.status()).toContain('写入已完成');
  });
});

describe('ORACLE-DATA-DISCIPLINE the client budget aborts and late bytes never overwrite', () => {
  it('shows the timeout state and ignores a transport that resolves after the budget', async () => {
    const view = page({recordId: 'timeout', timeoutMs: 25, fetchImpl: () => new Promise((resolve) => {
      setTimeout(() => resolve(json(200, readBody([{name: '迟到', value: '不应展示'}]))), 100);
    })});
    view.click();
    await wait(50);
    expect(view.state()).toBe('timeout');
    await wait(160);
    expect(view.state()).toBe('timeout');
    expect(view.content()).not.toContain('迟到');
  });
  it('shows the timeout state when the transport honours the abort signal', async () => {
    const view = page({recordId: 'timeout', timeoutMs: 25, fetchImpl: (url, init) => new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve(json(200, readBody([{name: '迟到', value: '不应展示'}]))), 100);
      init.signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(Object.assign(new Error('aborted'), {name: 'AbortError'}));
      }, {once: true});
    })});
    view.click();
    await wait(50);
    expect(view.state()).toBe('timeout');
    await wait(160);
    expect(view.state()).toBe('timeout');
  });
  it('keeps a real in-budget success as success', async () => {
    const view = page({fetchImpl: async () => json(200, readBody([{name: '记录名称', value: '真实值'}]))});
    view.click();
    await wait(40);
    expect(view.state()).toBe('success');
  });
});
