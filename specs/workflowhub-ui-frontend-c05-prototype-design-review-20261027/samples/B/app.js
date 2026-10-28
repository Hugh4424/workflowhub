(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const scenarios = ['default', 'loading', 'empty', 'error', 'cancel', 'boundary', 'permission', 'duplicate', 'partial', 'unknown'];
  const symbols = ['NQ', 'GC', 'ES', 'CL', 'ZN'];
  const accounts = [{ id: '4821', role: 'leader', quantity: 1 }, { id: '7204', role: 'follower', quantity: 1 }, { id: '9043', role: 'follower', quantity: 1 }];
  const instruments = { NQ: ['纳斯达克100', 'NQZ6', '21,430.25'], GC: ['黄金', 'GCZ6', null], ES: ['标普500', 'ESZ6', '5,734.50'], CL: ['原油', 'CLX6', '68.72'], ZN: ['10年期国债', 'ZNZ6', '112.125'] };
  const words = { requested: '已发出 · 等待生效', confirmed: '读回确认已清仓', failed: '未生效', unknown: '结果未知', partial: '部分成功 · 存在未生效/结果未知' };
  const resultWords = { waiting: '等待读回', confirmed: '已清仓', failed: '未生效', unknown: '结果未知' };
  const descriptions = { loading: '正在加载品种监控…', empty: '暂无品种数据', error: '平台读取失败；本地模拟命令可查看失败读回。', cancel: '取消反馈场景：确认前取消不创建命令；已发送请求不能由本地关闭撤销。', permission: '权限边界演示：许可与账户关系分开显示。', duplicate: '重复意图仅生成一条命令；查询原命令不重发。', partial: '部分结果按账户分别读回，未确认持仓保留。', unknown: '结果未知时只查询原命令，不自动重发。' };
  const params = new URL(location.href).searchParams;
  const scenario = scenarios.includes(params.get('state')) ? params.get('state') : 'default';
  const rawPermission = params.get('permission') ?? (scenario === 'permission' ? 'deny' : 'allow');
  const permission = ['allow', 'close_only', 'deny'].includes(rawPermission) ? rawPermission : 'missing';
  const role = params.get('role') === 'follower' ? 'follower' : 'leader', stress = params.get('stress') === '1';
  const state = { tab: '品种监控', selected: null, commands: [], intents: new Set(), nextId: 1, generation: 0, timers: new Set() };
  const drawer = $('dialog.drawer'), confirm = $('dialog.confirm');
  let detailTrigger = null, confirmTrigger = null, sent = false;
  const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const relation = value => value === 'leader' ? '主账户（leader）' : '跟随账户（follower）';
  const quantity = value => value === null ? '未提供' : `${value} 手`;
  function gate(symbol) {
    const reason = role === 'follower' ? '当前本地跟随账户视角为只读；不是生产RBAC' : permission === 'deny' ? '许可拒绝，不能发送' : permission === 'missing' ? '许可未提供，无法确认可发送' : symbol === 'GC' ? 'GC受控拒绝场景，不发送' : permission === 'close_only' ? '仅允许平仓，不允许开仓' : '允许平仓';
    return { canClose: role !== 'follower' && ['allow', 'close_only'].includes(permission) && symbol !== 'GC', reason };
  }
  function accountRows(rows, results = false) {
    return rows.map(account => `<tr><td>${esc(account.id)}</td><td>${relation(account.role)}</td><td>${quantity(account.quantity)}</td>${results ? `<td>${resultWords[account.result]}</td><td>${esc(account.proof ?? '未取得')}</td>` : ''}</tr>`).join('');
  }
  function commandTable(command) {
    return `<div class="table-scroll" role="region" tabindex="0" aria-label="命令 ${command.id} 账户结果，可横向滚动"><table><thead><tr><th>账户</th><th>关系</th><th>持仓</th><th>结果</th><th>读回证据</th></tr></thead><tbody>${accountRows(command.accounts, true)}</tbody></table></div>`;
  }
  function renderLamp() {
    const last = state.commands.at(-1);
    $('.readback-lamp').textContent = '读回 · ' + (last ? `${last.id} ${last.symbol} ${words[last.status]}` : '尚无命令');
    $('#tab-命令历史').textContent = `命令历史 ${state.commands.length}`;
  }
  function renderPanel() {
    const activeCommand = document.activeElement?.closest('[data-command-id]')?.dataset.commandId;
    const content = $('#live-content');
    content.setAttribute('aria-labelledby', 'tab-' + state.tab);
    for (const button of document.querySelectorAll('[role="tab"]')) {
      const selected = button.id === 'tab-' + state.tab;
      button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
    }
    if (state.tab === '品种监控') {
      content.innerHTML = scenario === 'loading' ? '<p role="status">加载中，请稍候</p>' : scenario === 'empty' ? '<p class="empty">暂无品种；返回默认状态可恢复合成fixture。</p>' : `<section class="symbol-grid" aria-label="品种列表">${symbols.map(symbol => {
        const [name, contract, price] = instruments[symbol];
        return `<article class="symbol-card" data-symbol="${symbol}"><header><div><h2>${symbol}</h2><p>${name}</p></div><span class="chip">${symbol === 'GC' ? '待核对' : '模拟在线'}</span></header><p class="price">${price ?? '价格未提供'}</p><p class="muted">${contract} · ${accounts.length} 账户</p><div class="mini-bars" aria-hidden="true">${[18,25,20,35,28,43,36,50,44,60].map(height => `<span style="height:${height}px"></span>`).join('')}</div>${stress ? `<details><summary>完整品种说明</summary><p class="long-value">${(`${name}·合成监控fixture，真实平台未连接。`).repeat(16)}</p></details>` : ''}<button class="primary" data-action="detail" aria-label="查看 ${symbol} 品种详情">查看 ${symbol} 详情</button></article>`;
      }).join('')}</section>`;
    } else if (state.tab === '命令历史') {
      content.innerHTML = state.commands.length ? state.commands.map(command => `<article class="command" data-command-id="${command.id}"><header><h2 tabindex="-1">${command.id} · ${command.symbol}</h2><span role="status">${words[command.status]}</span></header>${commandTable(command)}<button data-action="query" data-id="${command.id}" ${command.pending ? 'disabled' : ''}>${command.pending ? '正在查询' : '查询读回'}</button></article>`).join('') : '<p class="empty">暂无命令</p>';
    } else {
      content.innerHTML = '<section><h2>命令台账</h2>' + (state.commands.length ? state.commands.map(command => `<article class="command"><h3>${command.id} · ${command.symbol} · ${words[command.status]}</h3>${commandTable(command)}</article>`).join('') : '<p class="empty">暂无台账</p>') + '</section>';
    }
    renderLamp();
    if (activeCommand && !document.querySelector('dialog:modal')) {
      const command = state.commands.find(item => item.id === activeCommand);
      const selector = `[data-command-id="${activeCommand}"] ${command?.pending ? 'h2' : 'button'}`;
      $(selector)?.focus();
    }
  }
  function selectTab(tab) { state.tab = tab; renderPanel(); }
  function openDetail(symbol, trigger) {
    state.selected = symbol; detailTrigger = trigger;
    const [name, contract, price] = instruments[symbol], access = gate(symbol);
    $('#symbol-title').textContent = symbol + ' 品种详情';
    $('#symbol-content').innerHTML = `<p class="muted">${name} · ${contract}</p><dl class="facts"><div><dt>价格</dt><dd>${price ?? '未提供'}</dd></div><div><dt>许可</dt><dd>${permission === 'missing' ? '未提供' : permission}</dd></div></dl><p>${access.reason}。判定来源：本地模拟许可与顶部演示视角，未连接真实权限。</p><p class="muted">4821为主账户（leader），7204、9043为跟随账户（follower）；这些是合成账户关系，不等于生产RBAC。确认时将再次列出本品种的三个作用账户。</p><div class="table-scroll" role="region" tabindex="0" aria-label="账户持仓，可横向滚动"><table><thead><tr><th>账户</th><th>关系</th><th>初始模拟持仓</th></tr></thead><tbody>${accountRows(accounts)}</tbody></table></div>`;
    drawer.querySelector('[data-action="open-confirm"]').disabled = !access.canClose;
    drawer.showModal(); drawer.querySelector('[data-action="close-detail"]').focus();
  }
  function closeDetail() {
    drawer.close();
    if (detailTrigger?.isConnected) detailTrigger.focus();
    else $(`[data-symbol="${state.selected}"] button`)?.focus();
  }
  function openConfirm(trigger) {
    if (!state.selected || !gate(state.selected).canClose) return;
    confirmTrigger = trigger; sent = false;
    $('#consequence').textContent = `${state.selected}：仅发出清仓请求，持仓不会被本页面改为零。平台结果须读回确认，失败或未知不自动重发。`;
    $('#scope-title').textContent = `本次范围：${state.selected} · ${accounts.length} 个合成账户`;
    $('#scope-accounts').innerHTML = accountRows(accounts);
    $('#confirmation-word').value = ''; confirm.querySelector('[data-action="send"]').disabled = true;
    confirm.showModal(); confirm.querySelector('[data-action="cancel-confirm"]').focus();
  }
  function cancelConfirm() { confirm.close(); if (confirmTrigger?.isConnected && drawer.open) confirmTrigger.focus(); }
  function send() {
    const symbol = state.selected;
    if (sent || !symbol || $('#confirmation-word').value !== '单品种清仓' || !gate(symbol).canClose) return;
    sent = true;
    let command = state.commands.find(item => item.symbol === symbol);
    if (!state.intents.has(symbol)) {
      command = { id: `MOCK-CMD-${String(state.nextId++).padStart(4, '0')}`, symbol, status: 'requested', revision: 0, pending: false, accounts: accounts.map(account => ({ ...account, result: 'waiting', proof: null })) };
      state.intents.add(symbol); state.commands.push(command);
    }
    confirm.close(); drawer.close(); selectTab('命令历史');
    $(`[data-command-id="${command.id}"] button`)?.focus();
  }
  function query(id) {
    const command = state.commands.find(item => item.id === id);
    if (!command || command.pending) return;
    command.pending = true; renderPanel();
    const generation = state.generation;
    const settle = () => {
      if (generation !== state.generation || !state.commands.includes(command)) return;
      command.status = scenario === 'unknown' ? 'unknown' : scenario === 'partial' ? 'partial' : scenario === 'error' ? 'failed' : 'confirmed';
      command.accounts = command.accounts.map((account, index) => {
        const result = command.status === 'partial' ? index === 0 ? 'confirmed' : index === 1 ? 'failed' : 'unknown' : command.status;
        return { ...account, result, quantity: result === 'confirmed' ? 0 : account.quantity, proof: result === 'confirmed' ? `MOCK-PROOF-${command.id}-${account.id}` : null };
      });
      command.pending = false; command.revision++; renderPanel();
    };
    if (scenario === 'boundary') { const timer = setTimeout(() => { state.timers.delete(timer); settle(); }, 1000); state.timers.add(timer); }
    else settle();
  }
  function cleanup() { state.generation++; for (const timer of state.timers) clearTimeout(timer); state.timers.clear(); }
  addEventListener('pagehide', cleanup);
  function setQuery(key, value) { const url = new URL(location.href); url.searchParams.set(key, value); location.assign(url.href); }
  $('#scenario').innerHTML = scenarios.map(value => `<option>${value}</option>`).join('');
  $('#permission').innerHTML = ['allow', 'close_only', 'deny', 'missing'].map(value => `<option>${value}</option>`).join('');
  $('#scenario').value = scenario; $('#permission').value = permission; $('#role').value = role;
  $('#scenario').addEventListener('change', event => setQuery('state', event.target.value));
  $('#permission').addEventListener('change', event => setQuery('permission', event.target.value));
  $('#role').addEventListener('change', event => setQuery('role', event.target.value));
  $('#reset').addEventListener('click', () => { cleanup(); const url = new URL(location.href); url.searchParams.set('state', 'default'); url.searchParams.set('permission', 'allow'); url.searchParams.set('role', 'leader'); location.assign(url.href); });
  $('#confirmation-word').addEventListener('input', () => { confirm.querySelector('[data-action="send"]').disabled = sent || $('#confirmation-word').value !== '单品种清仓' || !gate(state.selected).canClose; });
  drawer.addEventListener('cancel', event => { event.preventDefault(); closeDetail(); });
  confirm.addEventListener('cancel', event => { event.preventDefault(); cancelConfirm(); });
  document.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button || button.disabled) return;
    if (button.getAttribute('role') === 'tab') { selectTab(button.id.slice(4)); return; }
    const action = button.dataset.action;
    if (action === 'detail') openDetail(button.closest('[data-symbol]').dataset.symbol, button);
    else if (action === 'close-detail') closeDetail();
    else if (action === 'open-confirm') openConfirm(button);
    else if (action === 'cancel-confirm') cancelConfirm();
    else if (action === 'send') send();
    else if (action === 'query') query(button.dataset.id);
  });
  document.querySelector('[role="tablist"]').addEventListener('keydown', event => {
    const names = ['品种监控', '命令历史', '台账'], index = names.indexOf(state.tab);
    const next = event.key === 'ArrowRight' ? names[(index + 1) % 3] : event.key === 'ArrowLeft' ? names[(index + 2) % 3] : event.key === 'Home' ? names[0] : event.key === 'End' ? names[2] : null;
    if (next) { event.preventDefault(); selectTab(next); $('#tab-' + next).focus(); }
  });
  if (descriptions[scenario]) { const node = document.createElement('p'); node.className = 'scenario ' + scenario; node.setAttribute('role', scenario === 'error' ? 'alert' : 'status'); node.textContent = descriptions[scenario]; $('#scenario-result').append(node); }
  renderPanel();
})();
