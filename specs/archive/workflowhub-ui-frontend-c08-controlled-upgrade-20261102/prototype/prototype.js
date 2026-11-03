/* =============================================================================
   C08 build-plan 原型交互与观察脚本（v2，原生 JS，无依赖）
   -----------------------------------------------------------------------------
   这个文件只做三件事：
   1) 在五个状态之间切换，并给每个状态准备一份可重放的初始画面；
   2) 用最小 JS 演示 C08 的目标行为（清详情 / 重试恢复 / 清筛选 / 换行对照）；
   3) 把焦点、页面横向溢出、抽屉节点与错误块的实测值写进观察台与 JSON。

   v2 按 2026-11-02 独立设计审查 F01–F14 修订：
   - A 重置后筛选值回到默认并重算列表（F01）；焦点目标态页内标注（F02）；
   - D 清除后焦点回「时段筛选」（F03）；关闭/Escape 实现最小焦点归还（F04）；
   - 行→详情按选中记录全量更新（F05）；A fixture 与筛选自洽（F06）；
   - E 计数/身份/只读行（F07）；完整 ID、唯一 id、失败 role=alert（F08）；
   - 台账规则按 spec 改为 `.ll-root .lg-warning`（F09）；
   - 未接线控件显示标记、复制按钮在 id 存在时可用（F11）；
   - 抽屉节点在关闭时真正移除，facts 分开报可见与节点数（F04）。

   它不是产品实现：真实行为在 React 组件与 useDrawerFocus / rAF 里。
   演示动作与真实实现的差距写在 README「可保真 / 不可保真」。
   ========================================================================== */
"use strict";

(function () {
  const STATES = ["A", "B", "C", "D", "E"];

  const CAPTIONS = {
    A: [
      ["问题", "重置筛选后，上一事件的详情抽屉仍挂着。"],
      ["旧行为", "重置只换查询，detailRecord 不清，抽屉继续显示旧事件。"],
      ["新行为", "两个重置入口先 setDetailRecord(null)，再交回原重置；焦点归还沿 triggerRef。"],
      ["通过判据", "点「重置筛选」后详情节点消失、筛选按重置后的值显示；焦点回筛选控件是目标态。"],
      ["目标态", "重置后焦点回筛选控件需要 C08 最小焦点修复；当前代码沿 triggerRef 回触发行。"]
    ],
    B: [
      ["问题", "定位失败后关闭抽屉再重试，只重算图表，抽屉不回来。"],
      ["旧行为", "重试只调图表重算，抽屉保持关闭，目标身份丢失。"],
      ["新行为", "retryChartFocus 走 navigateToPosition；同目标时直接重焦，身份保持 position-2。"],
      ["通过判据", "点「重试定位」后只出现 1 个抽屉、身份为 position-2、图表错误消失、焦点在抽屉内。"]
    ],
    C: [
      ["问题", "compact 浮层里的长错误继承外层 nowrap，窄屏撑出浮层。"],
      ["旧行为", "错误单行、超宽溢出；点「显示旧行为」可复现。"],
      ["新行为", "只加 .backtest-top-popover .backtest-top-error 的 normal / anywhere / max-width:100%。"],
      ["通过判据", "长错误在 300px 内换行；错误块 scrollWidth ≤ clientWidth；页面无横向滚动。"]
    ],
    D: [
      ["问题", "清除筛选只重置筛选，详情抽屉还开着；焦点可能落回已移除的行。"],
      ["旧行为", "clear() 不动 setSignal(null)，抽屉留在旧信号上。"],
      ["新行为", "清除时先关闭详情，再把 triggerRef 指向仍挂载的「时段筛选」，然后重置筛选。"],
      ["通过判据", "点「清除筛选」后抽屉消失、五个筛选控件回到默认、焦点在时段筛选（按 spec 的实盘 clear() 契约）。"]
    ],
    E: [
      ["问题", ".lg-warning 的长错误文本不换行，窄屏溢出。"],
      ["旧行为", "共享类无换行/断词约束，长 token 撑出容器；基线对照块可见。"],
      ["新行为", "按 spec 的告警样式契约只加 .ll-root .lg-warning 的 min-width/max-width/anywhere。"],
      ["通过判据", "台账内错误块 scrollWidth ≤ clientWidth、页面无滚动；台账外基线块保持旧行为。"]
    ]
  };

  /* ---------- 合成 fixture：每条可点记录都有完整内容 ---------- */

  const A_RECORDS = {
    "evt-a1b2c3d4-5e6f-47a8-9b0c-1d2e3f4a5b6c": {
      time: "2026/11/2 09:12:44",
      iso: "2026-11-02T09:12:44+08:00",
      outcome: "失败",
      tone: "failure",
      message: "数据同步失败：目录键 catalog:nq:20261101 校验不通过（错误码 DATA_SYNC_CHECKSUM_MISMATCH）。",
      fields: [
        ["事件 ID", "evt-a1b2c3d4-5e6f-47a8-9b0c-1d2e3f4a5b6c"],
        ["事件类型", "data.sync_failed"],
        ["业务对象", "数据 · catalog:nq:20261101"],
        ["运行 ID", "sync-20261102-01"],
        ["事件时间", "2026/11/2 09:12:44"],
        ["动作", "失败"],
        ["结果", "失败"],
        ["状态", "checksum_mismatch"],
        ["错误码", "DATA_SYNC_CHECKSUM_MISMATCH"],
        ["来源组件", "data-sync-worker"],
        ["目录键", "catalog:nq:20261101"],
        ["Schema 版本", "3"],
        ["因果 ID", "cause-91a2b3c4d5e6"]
      ],
      relatedLabel: "数据 · catalog:nq:20261101",
      relatedCode: "catalog.nq.20261101"
    },
    "evt-7c2e9f10-8a3b-4c5d-9e6f-0a1b2c3d4e5f": {
      time: "2026/11/2 09:55:10",
      iso: "2026-11-02T09:55:10+08:00",
      outcome: "成功",
      tone: "success",
      message: "数据同步完成：目录键 catalog:nq:20261101 已写入 1,284 条，校验通过。",
      fields: [
        ["事件 ID", "evt-7c2e9f10-8a3b-4c5d-9e6f-0a1b2c3d4e5f"],
        ["事件类型", "data.sync_completed"],
        ["业务对象", "数据 · catalog:nq:20261101"],
        ["运行 ID", "sync-20261102-01"],
        ["事件时间", "2026/11/2 09:55:10"],
        ["动作", "已完成"],
        ["结果", "成功"],
        ["状态", "synced"],
        ["错误码", "—"],
        ["来源组件", "data-sync-worker"],
        ["目录键", "catalog:nq:20261101"],
        ["Schema 版本", "3"],
        ["因果 ID", "cause-3f9d2e1c0b7a"]
      ],
      relatedLabel: "数据 · catalog:nq:20261101",
      relatedCode: "catalog.nq.20261101"
    }
  };

  const D_SIGNALS = {
    "sig-20261102-9f3a2c71-4d2b-4f1e-8a6c-0b7d9e4c1a55": {
      state: "已发送", tone: "ok", account: "acct-7f3c", accountShort: "··7f3c",
      symbol: "NQZ6", contract: "NQZ6", direction: "多 2", directionTone: "ok",
      dedupe: "未命中重复", judged: "2026-11-02 08:12:05 CT",
      dedupeId: "sig-20261102-9f3a2c71", sentLine: "2026-11-02 08:12:05 已发送"
    },
    "sig-20261102-4b8d1e26-7c90-4a35-b1f2-6d8e0c9a2b74": {
      state: "待确认", tone: "warn", account: "acct-2b91", accountShort: "··2b91",
      symbol: "NQZ6", contract: "NQZ6", direction: "空 1", directionTone: "bad",
      dedupe: "未命中重复", judged: "2026-11-02 08:31:48 CT",
      dedupeId: "sig-20261102-4b8d1e26", sentLine: "2026-11-02 08:31:48 已发送"
    },
    "sig-20261102-1a2b3c4d-5e6f-4788-99aa-bbccddeeff00": {
      state: "重复", tone: "muted", account: "acct-7f3c", accountShort: "··7f3c",
      symbol: "NQZ6", contract: "NQZ6", direction: "多 1", directionTone: "ok",
      dedupe: "命中重复（首次 sig-20261102-9f3a2c71）", judged: "2026-11-02 09:02:21 CT",
      dedupeId: "sig-20261102-1a2b3c4d", sentLine: "2026-11-02 09:02:21 已发送"
    }
  };

  const B_POSITIONS = {
    "position-1": {
      result: "赢单", tone: "win", pnl: "+$286.00", side: "多头", holding: "12 根 K",
      exit: "目标止盈", market: "趋势", entry: "突破", delta: "+41", cum: "+188",
      maeMfe: "6 / 18 tick",
      direction: "日线趋势向上，5 分钟突破前高后跟随。",
      entryText: "突破前高 1 tick，成交足迹放大后入场。"
    },
    "position-2": {
      result: "损单", tone: "loss", pnl: "−$412.50", side: "空头", holding: "18 根 K",
      exit: "移动止损", market: "趋势", entry: "回调", delta: "−38", cum: "−212",
      maeMfe: "14 / 6 tick",
      direction: "日线趋势向上，但 5 分钟结构转弱，按规则允许逆势小仓。",
      entryText: "回调至前高下方 2 tick，出现卖压足迹后入场。"
    }
  };

  const B_ORDER = ["position-1", "position-2"];

  const logEntries = [];
  let current = "A";
  let legacyC = false;
  let legacyE = false;
  const drawerCache = {};
  const drawerTriggers = { A: null, B: null, D: null };
  let currentB = "position-2";

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function stateRoot(key) { return $('.proto-state[data-state="' + key + '"]'); }
  function layerId(key) { return "layer-" + String(key).toLowerCase(); }
  function text(el, value) { if (el) el.textContent = value; }

  function describeFocus() {
    const el = document.activeElement;
    if (!el || el === document.body) return "body（无焦点）";
    const tag = el.tagName.toLowerCase();
    const id = el.id ? "#" + el.id : "";
    let cls = "";
    if (el.classList && el.classList.length) {
      const names = Array.prototype.filter.call(el.classList, function (name) { return name.indexOf("proto-") !== 0; }).slice(0, 2);
      if (names.length) cls = "." + names.join(".");
    }
    const label = el.getAttribute("aria-label");
    let content = "";
    if (el.tagName === "SELECT") {
      content = el.selectedOptions && el.selectedOptions[0] ? "选中「" + el.selectedOptions[0].textContent.trim() + "」" : "";
    } else {
      content = (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 16);
      content = content ? "「" + content + "」" : "";
    }
    return tag + cls + id + (label ? '[aria-label="' + label + '"]' : "") + content;
  }

  function pageOverflow() {
    const de = document.documentElement;
    return Math.max(0, de.scrollWidth - de.clientWidth, document.body.scrollWidth - de.clientWidth);
  }

  function focusEl(el) {
    if (!el) return;
    el.focus({ preventScroll: true });
    el.classList.remove("proto-focus-flash");
    void el.offsetWidth;
    el.classList.add("proto-focus-flash");
    window.setTimeout(function () { el.classList.remove("proto-focus-flash"); }, 1200);
  }

  /* ---------- 抽屉：关闭时真正移除节点，打开时放回 ---------- */

  function initDrawerCache() {
    ["A", "B", "D"].forEach(function (key) {
      const layer = document.getElementById(layerId(key));
      drawerCache[key] = layer ? layer.querySelector("aside") : null;
      if (drawerCache[key]) drawerCache[key].setAttribute("data-drawer-key", key);
    });
  }

  function drawerNode(key) {
    const layer = document.getElementById(layerId(key));
    return layer ? layer.querySelector('aside[data-drawer-key="' + key + '"]') : null;
  }

  function openDrawer(key, trigger) {
    const layer = document.getElementById(layerId(key));
    const aside = drawerNode(key) || drawerCache[key];
    if (!layer || !aside) return null;
    if (!aside.isConnected) layer.appendChild(aside);
    layer.hidden = false;
    if (trigger) drawerTriggers[key] = trigger;
    return aside;
  }

  function focusDrawerClose(key) {
    const aside = drawerNode(key);
    if (!aside) return;
    const close = aside.querySelector("header button, .drawer-close, .pb-ui-drawer-close");
    if (close) focusEl(close);
  }

  function detachDrawer(key) {
    const node = drawerNode(key);
    if (node && node.parentNode) node.parentNode.removeChild(node);
  }

  function restoreFocusFrom(key) {
    const trigger = drawerTriggers[key];
    const usable = trigger && trigger.isConnected && !trigger.disabled && trigger.getClientRects().length > 0;
    if (usable) { focusEl(trigger); return { target: "trigger", label: describeFocus() }; }
    const heading = stateRoot(current) ? stateRoot(current).querySelector("h1, h2") : null;
    if (heading) { heading.tabIndex = -1; focusEl(heading); return { target: "heading", label: describeFocus() }; }
    return { target: "none", label: describeFocus() };
  }

  function focusWord(focusInfo) {
    if (!focusInfo) return "未移动";
    if (focusInfo.target === "trigger") return "回触发控件";
    if (focusInfo.target === "heading") return "回页面标题（触发控件不可用）";
    return "未移动（无可用标题）";
  }

  function closeDrawer(key, options) {
    const opts = options || {};
    const layer = document.getElementById(layerId(key));
    if (!layer || layer.hidden) return { closed: false, focus: null };
    detachDrawer(key);
    layer.hidden = true;
    const focusInfo = opts.restoreFocus !== false ? restoreFocusFrom(key) : null;
    return { closed: true, focus: focusInfo };
  }

  function anyOpenDrawer() {
    const layer = document.getElementById(layerId(current));
    if (!layer || layer.hidden) return null;
    if (layer.getClientRects().length === 0) return null;
    if (!layer.querySelector("aside")) return null;
    return current;
  }

  function drawerStatesAll() {
    const out = {};
    ["A", "B", "D"].forEach(function (key) {
      const layer = document.getElementById(layerId(key));
      out[key] = {
        visible: !!layer && !layer.hidden,
        nodes: layer ? layer.querySelectorAll("aside").length : 0
      };
    });
    return out;
  }

  /* ---------- A：筛选、列表与详情 ---------- */

  function readFiltersA() {
    const entity = $("#filter-a-entity").selectedOptions[0].textContent.trim();
    const outcome = $("#filter-a-outcome").selectedOptions[0].textContent.trim();
    const action = $("#filter-a-action").selectedOptions[0].textContent.trim();
    return {
      entity: entity === "全部对象" ? "" : entity,
      outcome: outcome === "全部结果" ? "" : outcome,
      keyword: $("#filter-a-keyword").value.trim(),
      eventType: $("#filter-a-event-type").value.trim(),
      action: action === "全部动作" ? "" : action,
      start: $("#filter-a-start").value,
      end: $("#filter-a-end").value
    };
  }

  function dateInWindow(row, start, end) {
    const t = Date.parse(row.dataset.time);
    if (!Number.isFinite(t)) return true;
    if (start && Number.isFinite(Date.parse(start)) && t < Date.parse(start)) return false;
    if (end && Number.isFinite(Date.parse(end)) && t > Date.parse(end)) return false;
    return true;
  }

  function applyFiltersA() {
    const q = readFiltersA();
    const rows = $$("#rows-a .business-log-table-row");
    let visible = 0;
    rows.forEach(function (row) {
      const ok = (!q.entity || q.entity === row.dataset.entity)
        && (!q.outcome || q.outcome === row.dataset.outcome)
        && (!q.keyword || row.textContent.toLowerCase().indexOf(q.keyword.toLowerCase()) !== -1)
        && (!q.eventType || q.eventType === row.dataset.eventType)
        && (!q.action || q.action === row.dataset.action)
        && dateInWindow(row, q.start, q.end);
      row.hidden = !ok;
      if (ok) visible += 1;
    });
    text($("#count-a"), "共 " + visible + " 条");
    $("#empty-a").hidden = visible !== 0;
    const advancedActive = [q.eventType, q.action, q.start, q.end].filter(Boolean).length;
    text($("#toggle-advanced-a"), advancedActive ? "筛选 · " + advancedActive : "筛选");
  }

  function renderADetail(record) {
    const outcome = $("#detail-a-outcome");
    outcome.className = "business-log-outcome is-" + record.tone;
    text(outcome, record.outcome);
    const timeEl = $("#detail-a-time");
    timeEl.setAttribute("datetime", record.iso);
    text(timeEl, record.time);
    text($("#detail-a-message"), record.message);
    const dl = $("#detail-a-fields");
    dl.textContent = "";
    record.fields.forEach(function (pair) {
      const row = document.createElement("div");
      row.className = "business-log-detail-field";
      const dt = document.createElement("dt");
      dt.textContent = pair[0];
      const dd = document.createElement("dd");
      dd.textContent = pair[1];
      row.appendChild(dt);
      row.appendChild(dd);
      dl.appendChild(row);
    });
    text($("#detail-a-related-label"), record.relatedLabel);
    text($("#detail-a-related-code"), record.relatedCode);
  }

  function openA(row, focusClose) {
    const record = A_RECORDS[row.dataset.eventId];
    if (!record) return;
    openDrawer("A", row);
    renderADetail(record);
    if (focusClose) focusDrawerClose("A");
  }

  function initialFiltersA() {
    $("#filter-a-entity").selectedIndex = 1;
    $("#filter-a-outcome").selectedIndex = 1;
    $("#filter-a-action").selectedIndex = 1;
    $("#filter-a-keyword").value = "CHECKSUM";
    $("#filter-a-event-type").value = "data.sync_failed";
    $("#filter-a-start").value = "2026-11-01T00:00";
    $("#filter-a-end").value = "2026-11-02T23:59";
    $("#toggle-advanced-a").setAttribute("aria-expanded", "true");
    $("#proto-advanced-a").hidden = false;
  }

  function resetFiltersA() {
    $("#filter-a-entity").selectedIndex = 0;
    $("#filter-a-outcome").selectedIndex = 0;
    $("#filter-a-action").selectedIndex = 0;
    $("#filter-a-keyword").value = "";
    $("#filter-a-event-type").value = "";
    $("#filter-a-start").value = "";
    $("#filter-a-end").value = "";
    applyFiltersA();
    closeDrawer("A", { restoreFocus: false });
    focusEl($("#reset-a"));
    const values = readFiltersA();
    log("A 重置筛选：详情节点=0；筛选已按重置后的值显示（对象=" + (values.entity || "全部对象")
      + " / 结果=" + (values.outcome || "全部结果") + " / 关键词=空 / 事件类型=空 / 动作="
      + (values.action || "全部动作") + "）；列表显示 " + $$("#rows-a .business-log-table-row:not([hidden])").length
      + " 条；焦点=重置筛选按钮（目标态：需 C08 最小焦点修复；当前代码沿 triggerRef 回触发行）");
    refresh();
  }

  /* ---------- D：信号详情 ---------- */

  function renderDDetail(id) {
    const record = D_SIGNALS[id];
    if (!record) return;
    text($("#detail-d-id"), id);
    const badge = $("#detail-d-badge");
    badge.className = "lm-badge lm-tone-" + record.tone;
    text(badge, record.state);
    const account = $("#detail-d-account");
    account.setAttribute("title", record.account);
    text(account, record.accountShort);
    text($("#detail-d-symbol"), record.symbol);
    text($("#detail-d-contract"), record.contract);
    text($("#detail-d-direction"), record.direction);
    text($("#detail-d-dedupe"), record.dedupe);
    text($("#detail-d-judged"), record.judged);
    text($("#detail-d-dedupe-id"), record.dedupeId);
    text($("#detail-d-sent"), record.sentLine);
    text($("#detail-d-judged-line"), record.judged + " · " + record.state);
    const copy = $("#detail-d-copy");
    copy.disabled = !id;
    copy.dataset.signalId = id;
    text($("#detail-d-copy-status"), "");
  }

  function openD(id, trigger, focusClose) {
    openDrawer("D", trigger);
    renderDDetail(id);
    if (focusClose) focusDrawerClose("D");
  }

  function clearFiltersD() {
    $("#range-d").selectedIndex = 0;
    $("#role-d").selectedIndex = 0;
    $("#sym-d").selectedIndex = 0;
    $("#acct-d").selectedIndex = 0;
    $("#life-d").selectedIndex = 0;
    $("#clear-d").hidden = true;
    closeDrawer("D", { restoreFocus: false });
    focusEl($("#range-d"));
    log("D 清除筛选：详情节点=0；筛选值已重置（时段=" + $("#range-d").selectedOptions[0].textContent.trim()
      + " / 账户角色=" + $("#role-d").value + "）；焦点=时段筛选（按 spec 的实盘 clear() 契约）");
    refresh();
  }

  /* ---------- B：头寸抽屉与导航 ---------- */

  function renderBPosition(id) {
    const record = B_POSITIONS[id];
    if (!record) return;
    currentB = id;
    const aside = drawerNode("B") || drawerCache.B;
    if (aside) aside.setAttribute("aria-label", "头寸 " + id + " 复盘");
    text($("#detail-b-identity"), id);
    const result = $("#detail-b-result");
    result.className = "drawer-result " + record.tone;
    text(result, record.result);
    text($("#detail-b-pnl"), record.pnl);
    const pnlCell = $("#detail-b-pnl-cell");
    pnlCell.className = record.tone;
    text(pnlCell, record.pnl);
    text($("#detail-b-side"), record.side);
    text($("#detail-b-holding"), record.holding);
    text($("#detail-b-exit"), record.exit);
    text($("#detail-b-market"), record.market);
    text($("#detail-b-entry"), record.entry);
    text($("#detail-b-delta"), record.delta);
    text($("#detail-b-cum"), record.cum);
    text($("#detail-b-maemfe"), record.maeMfe);
    text($("#detail-b-explain-direction"), record.direction);
    text($("#detail-b-explain-entry"), record.entryText);
  }

  function openB(id, trigger, focusClose) {
    openDrawer("B", trigger);
    renderBPosition(id);
    $("#chart-error-b").hidden = true;
    if (focusClose) focusDrawerClose("B");
  }

  function failB() {
    closeDrawer("B", { restoreFocus: false });
    $("#chart-error-b").hidden = false;
    currentB = "position-2";
  }

  /* ---------- 度量 ---------- */

  function drawerState(key) {
    const layer = document.getElementById(layerId(key));
    const visible = !!layer && !layer.hidden;
    const nodes = layer ? layer.querySelectorAll("aside").length : 0;
    return { visible: visible, nodes: nodes };
  }

  function measureA() {
    const d = drawerState("A");
    const values = $$('[aria-label="对象"],[aria-label="结果"],[aria-label="关键词"],[aria-label="事件类型"],[aria-label="动作"],[aria-label="开始时间"],[aria-label="结束时间"]', stateRoot("A"))
      .map(function (el) { return el.getAttribute("aria-label") + "=" + el.value; }).join(" / ");
    const visibleRows = $$("#rows-a .business-log-table-row:not([hidden])").length;
    const drawer = drawerNode("A");
    const width = d.visible && drawer ? Math.round(drawer.getBoundingClientRect().width) : 0;
    return {
      text: "详情可见=" + (d.visible ? 1 : 0) + " · 抽屉节点=" + d.nodes + " · 宽=" + width + "px · 列表 " + visibleRows + " 条 · " + values,
      data: { drawerVisible: d.visible, drawerNodesInDom: d.nodes, drawerWidthPx: width, visibleRows: visibleRows, filterValues: values }
    };
  }

  function measureB() {
    const d = drawerState("B");
    const drawer = drawerNode("B");
    const chart = $("#chart-b");
    const c = chart.getBoundingClientRect();
    const dr = d.visible && drawer ? drawer.getBoundingClientRect() : null;
    const overlap = dr ? Math.max(0, Math.min(c.right, dr.right) - Math.max(c.left, dr.left)) : 0;
    const fraction = c.width ? (c.width - overlap) / c.width : 0;
    return {
      text: "详情可见=" + (d.visible ? 1 : 0) + " · 抽屉节点=" + d.nodes + " · 宽=" + (dr ? Math.round(dr.width) : 0) + "px · 图表可见比例=" + fraction.toFixed(2) + " · 身份=" + currentB,
      data: {
        drawerVisible: d.visible, drawerNodesInDom: d.nodes,
        drawerWidthPx: dr ? Math.round(dr.width) : 0,
        chartWidthPx: Math.round(c.width),
        chartVisibleFraction: Number(fraction.toFixed(3)),
        drawerIdentity: currentB
      }
    };
  }

  function measureC() {
    const pop = $("#popover-c");
    const err = $("#error-c");
    const pw = Math.round(pop.getBoundingClientRect().width);
    return {
      text: "浮层宽=" + pw + "px · 错误块 scrollWidth=" + err.scrollWidth + " / clientWidth=" + err.clientWidth + " · 浮层溢出差=" + (pop.scrollWidth - pop.clientWidth) + "px · 模式=" + (legacyC ? "旧行为" : "新行为"),
      data: {
        popoverWidthPx: pw,
        errorScrollWidth: err.scrollWidth,
        errorClientWidth: err.clientWidth,
        errorOverflowPx: Math.max(0, err.scrollWidth - err.clientWidth),
        popoverOverflowPx: Math.max(0, pop.scrollWidth - pop.clientWidth),
        mode: legacyC ? "legacy" : "new"
      }
    };
  }

  function measureD() {
    const d = drawerState("D");
    const drawer = drawerNode("D");
    const scroll = $(".ll-signal-scroll", stateRoot("D"));
    const copy = $("#detail-d-copy");
    return {
      text: "详情可见=" + (d.visible ? 1 : 0) + " · 抽屉节点=" + d.nodes + " · 宽=" + (d.visible && drawer ? Math.round(drawer.getBoundingClientRect().width) : 0) + "px · 时段=" + $("#range-d").selectedOptions[0].textContent.trim() + " · 账户角色=" + $("#role-d").value + " · 宽表局部横滚=" + Math.max(0, scroll.scrollWidth - scroll.clientWidth) + "px",
      data: {
        drawerVisible: d.visible, drawerNodesInDom: d.nodes,
        drawerWidthPx: d.visible && drawer ? Math.round(drawer.getBoundingClientRect().width) : 0,
        timeRange: $("#range-d").selectedOptions[0].textContent.trim(),
        accountRole: $("#role-d").value,
        tableLocalScrollPx: Math.max(0, scroll.scrollWidth - scroll.clientWidth),
        copyDisabled: copy ? copy.disabled : null,
        copyStatus: $("#detail-d-copy-status") ? $("#detail-d-copy-status").textContent.trim() : ""
      }
    };
  }

  function measureE() {
    const warning = $("#warning-e");
    const baseline = $("#warning-baseline");
    const computed = window.getComputedStyle(warning);
    return {
      text: "台账错误 scrollWidth=" + warning.scrollWidth + " / clientWidth=" + warning.clientWidth + " · max-width=" + computed.maxWidth + " · 基线块 scrollWidth=" + baseline.scrollWidth + " / clientWidth=" + baseline.clientWidth + " · 模式=" + (legacyE ? "旧行为" : "新行为"),
      data: {
        ledgerWarningScrollWidth: warning.scrollWidth,
        ledgerWarningClientWidth: warning.clientWidth,
        ledgerWarningOverflowPx: Math.max(0, warning.scrollWidth - warning.clientWidth),
        ledgerWarningMaxWidth: computed.maxWidth,
        ledgerWarningOverflowWrap: computed.overflowWrap,
        baselineScrollWidth: baseline.scrollWidth,
        baselineClientWidth: baseline.clientWidth,
        baselineOverflowPx: Math.max(0, baseline.scrollWidth - baseline.clientWidth),
        mode: legacyE ? "legacy" : "new"
      }
    };
  }

  const MEASURE = { A: measureA, B: measureB, C: measureC, D: measureD, E: measureE };

  function refresh() {
    const chrome = $(".proto-chrome");
    const chromeHeight = chrome ? Math.round(chrome.getBoundingClientRect().height) : 0;
    if (chrome) document.documentElement.style.setProperty("--proto-chrome-h", chromeHeight + "px");
    const cssVarPx = Math.round(parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue("--proto-chrome-h")) || 0);
    const activeLayer = document.getElementById(layerId(current));
    const drawerTopPx = activeLayer ? Math.round(activeLayer.getBoundingClientRect().top) : null;
    const m = MEASURE[current]();
    const overflow = pageOverflow();
    text($("#obs-state"), current);
    text($("#obs-viewport"), window.innerWidth + "×" + window.innerHeight);
    text($("#obs-focus"), describeFocus());
    text($("#obs-overflow"), overflow + "px" + (overflow === 0 ? "（无横向滚动）" : "（有横向滚动）"));
    text($("#obs-geometry"), m.text);
    document.body.dataset.protoState = current;

    $("#proto-facts").textContent = JSON.stringify({
      prototype: "C08 build-plan 五状态静态原型（v3）",
      state: current,
      viewport: { width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio },
      focus: describeFocus(),
      pageOverflowPx: overflow,
      measurements: m.data,
      drawerStates: drawerStatesAll(),
      chrome: { heightPx: chromeHeight, cssVarPx: cssVarPx, drawerLayerTopPx: drawerTopPx },
      toggles: { stateC: legacyC ? "legacy" : "new", stateE: legacyE ? "legacy" : "new" },
      syntheticData: true,
      note: "焦点与几何是静态原型实测；焦点目标是原型 JS 显式设置，不代表产品运行，也不替代 build-code 证据。"
    }, null, 2);
    renderLog();
  }

  function renderLog() {
    const ol = $("#obs-log");
    if (!ol) return;
    ol.textContent = "";
    logEntries.slice(-10).forEach(function (entry) {
      const li = document.createElement("li");
      li.textContent = entry;
      ol.appendChild(li);
    });
  }

  function log(message) {
    logEntries.push(message);
    text($("#obs-action"), message);
    renderLog();
  }

  /* ---------- 状态切换 ---------- */

  function renderCaption(key) {
    const host = $("#proto-caption");
    host.textContent = "";
    CAPTIONS[key].forEach(function (pair) {
      const item = document.createElement("div");
      item.className = "proto-note-item";
      const b = document.createElement("b");
      b.textContent = pair[0];
      const span = document.createElement("span");
      span.textContent = pair[1];
      item.appendChild(b);
      item.appendChild(span);
      host.appendChild(item);
    });
  }

  function setToggle(demo, active) {
    $$('[data-demo="' + demo + '"]').forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  function setLegacyC(value) {
    legacyC = value;
    stateRoot("C").classList.toggle("proto-legacy-c", value);
    setToggle("c-legacy", value);
    setToggle("c-new", !value);
  }

  function setLegacyE(value) {
    legacyE = value;
    stateRoot("E").classList.toggle("proto-legacy-e", value);
    setToggle("e-legacy", value);
    setToggle("e-new", !value);
  }

  function resetDemoButtons() {
    $$("[data-demo]").forEach(function (btn) {
      if (btn.dataset.demo === "c-legacy" || btn.dataset.demo === "c-new" || btn.dataset.demo === "e-legacy" || btn.dataset.demo === "e-new") return;
      btn.setAttribute("aria-pressed", "false");
    });
  }

  function initState(key) {
    if (key === "A") {
      initialFiltersA();
      applyFiltersA();
      openA($("#rows-a .business-log-table-row"), false);
    } else if (key === "B") {
      failB();
      detachDrawer("B");
      drawerTriggers.B = null;
    } else if (key === "C") {
      setLegacyC(false);
      $("#popover-c").hidden = false;
      $("#trigger-c").setAttribute("aria-expanded", "true");
    } else if (key === "D") {
      $("#range-d").selectedIndex = 1;
      $("#role-d").selectedIndex = 1;
      $("#sym-d").selectedIndex = 1;
      $("#acct-d").selectedIndex = 1;
      $("#life-d").selectedIndex = 0;
      $("#clear-d").hidden = false;
      const firstRow = $(".ll-signal-row", stateRoot("D"));
      openD(firstRow.dataset.signalId, firstRow, false);
    } else if (key === "E") {
      setLegacyE(false);
    }
    resetDemoButtons();
  }

  function showState(key) {
    current = key;
    ["A", "B", "D"].forEach(function (other) {
      if (other === key) return;
      closeDrawer(other, { restoreFocus: false });
      drawerTriggers[other] = null;
    });
    $$(".proto-state").forEach(function (section) { section.hidden = section.dataset.state !== key; });
    $$(".proto-tab").forEach(function (tab) { tab.setAttribute("aria-pressed", String(tab.dataset.state === key)); });
    renderCaption(key);
    initState(key);
    log("切换到状态 " + key);
    if (window.history && window.history.replaceState) window.history.replaceState(null, "", "#" + key);
    refresh();
  }

  /* ---------- 绑定 ---------- */

  function bind() {
    $$(".proto-tab").forEach(function (tab) {
      tab.addEventListener("click", function () { showState(tab.dataset.state); });
    });

    /* A：行打开详情、可关闭、可 Escape、筛选联动 */
    $$("#rows-a .business-log-table-row").forEach(function (row) {
      function openRow() {
        openA(row, true);
        log("A 打开详情：行 " + row.dataset.eventId + "；焦点=抽屉关闭按钮");
        refresh();
      }
      row.addEventListener("click", openRow);
      row.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openRow(); }
      });
    });
    $("#close-a").addEventListener("click", function () {
      const result = closeDrawer("A", { restoreFocus: true });
      log("A 关闭详情：抽屉节点已移除；焦点" + focusWord(result.focus) + "；" + (result.focus ? result.focus.label : "") + "（原型最小归还）");
      refresh();
    });
    $("#layer-a").addEventListener("click", function (event) {
      if (event.target !== event.currentTarget) return;
      const result = closeDrawer("A", { restoreFocus: true });
      log("A 点遮罩关闭：抽屉节点已移除；焦点" + focusWord(result.focus) + "；" + (result.focus ? result.focus.label : ""));
      refresh();
    });
    $("#reset-a").addEventListener("click", resetFiltersA);
    $("#toggle-advanced-a").addEventListener("click", function () {
      const open = $("#toggle-advanced-a").getAttribute("aria-expanded") === "true";
      $("#proto-advanced-a").hidden = open;
      $("#toggle-advanced-a").setAttribute("aria-expanded", String(!open));
      log("A 筛选面板" + (open ? "收起" : "展开") + "：aria-expanded=" + String(!open));
      refresh();
    });
    ["entity", "outcome", "keyword", "event-type", "action", "start", "end"].forEach(function (name) {
      const el = $("#filter-a-" + name);
      el.addEventListener(el.tagName === "SELECT" ? "change" : "input", function () {
        const hadDrawer = drawerState("A").visible;
        if (hadDrawer) closeDrawer("A", { restoreFocus: false });
        applyFiltersA();
        log("A 筛选变更：详情" + (hadDrawer ? "已清（真实 onFilterChange 先清 detailRecord）" : "保持关闭")
          + "；列表重算 " + $$("#rows-a .business-log-table-row:not([hidden])").length + " 条；焦点留在当前筛选控件");
        refresh();
      });
    });

    /* B：失败/重试/关闭/Escape/导航 */
    $("#retry-b").addEventListener("click", function () {
      openB("position-2", $("#retry-b"), true);
      log("B 重试定位：错误块隐藏；抽屉恢复 1 个、节点 1；身份 position-2；焦点=抽屉关闭按钮");
      refresh();
    });
    $("#close-b").addEventListener("click", function () {
      const result = closeDrawer("B", { restoreFocus: true });
      log("B 关闭抽屉：节点已移除；焦点" + focusWord(result.focus) + "；" + (result.focus ? result.focus.label : ""));
      refresh();
    });
    $("#layer-b").addEventListener("click", function (event) {
      if (event.target !== event.currentTarget) return;
      const result = closeDrawer("B", { restoreFocus: true });
      log("B 点遮罩关闭：节点已移除；焦点" + focusWord(result.focus) + "；" + (result.focus ? result.focus.label : ""));
      refresh();
    });
    $$('[data-open-position]').forEach(function (btn) {
      btn.addEventListener("click", function () {
        openB(btn.dataset.openPosition, btn, true);
        log("B 打开复盘抽屉：身份=" + btn.dataset.openPosition + "；节点=1；焦点=关闭评论");
        refresh();
      });
    });
    $$('[data-nav]').forEach(function (btn) {
      btn.addEventListener("click", function () {
        const kind = btn.dataset.nav;
        const index = B_ORDER.indexOf(currentB);
        const next = kind === "prev" ? B_ORDER[(index - 1 + B_ORDER.length) % B_ORDER.length]
          : kind === "loss" ? "position-2" : B_ORDER[(index + 1) % B_ORDER.length];
        renderBPosition(next);
        log("B 订单导航：" + kind + " → 身份=" + next + "；焦点留在导航按钮");
        refresh();
      });
    });

    /* C：浮层开关与旧/新行为 */
    $("#trigger-c").addEventListener("click", function () {
      const open = $("#trigger-c").getAttribute("aria-expanded") === "true";
      $("#popover-c").hidden = open;
      $("#trigger-c").setAttribute("aria-expanded", String(!open));
      log("C 浮层" + (open ? "关闭" : "打开") + "：aria-expanded=" + String(!open));
      refresh();
    });

    /* D：行→详情、关闭、Escape、清除 */
    $$('[data-state="D"] .ll-signal-row').forEach(function (row) {
      function openRow() {
        openD(row.dataset.signalId, row, true);
        log("D 打开信号详情：" + row.dataset.signalId + "；焦点=抽屉关闭按钮");
        refresh();
      }
      row.addEventListener("click", openRow);
      row.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openRow(); }
      });
    });
    $("#close-d").addEventListener("click", function () {
      const result = closeDrawer("D", { restoreFocus: true });
      log("D 关闭详情：节点已移除；焦点" + focusWord(result.focus) + "；" + (result.focus ? result.focus.label : ""));
      refresh();
    });
    $("#layer-d").addEventListener("click", function (event) {
      if (event.target === event.currentTarget) {
        const result = closeDrawer("D", { restoreFocus: true });
        log("D 点遮罩关闭：节点已移除；焦点" + focusWord(result.focus) + "；" + (result.focus ? result.focus.label : ""));
        refresh();
      }
    });
    $("#clear-d").addEventListener("click", clearFiltersD);

    $("#detail-d-copy").addEventListener("click", function () {
      const button = $("#detail-d-copy");
      const id = button.dataset.signalId;
      if (!id) return;
      const status = $("#detail-d-copy-status");
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        text(status, "复制失败，请手动选择信号 ID");
        log("D 复制信号 ID：剪贴板不可用（原型如实报告）");
        refresh();
        return;
      }
      navigator.clipboard.writeText(id).then(function () {
        text(status, "信号 ID 已复制");
        log("D 复制信号 ID：成功（id=" + id + "）");
        refresh();
      }).catch(function () {
        text(status, "复制失败，请手动选择信号 ID");
        log("D 复制信号 ID：剪贴板写入被拒绝（原型如实报告）");
        refresh();
      });
    });

    /* Escape：关闭最上面的抽屉并归还焦点 */
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      const key = anyOpenDrawer();
      if (!key) return;
      event.preventDefault();
      const result = closeDrawer(key, { restoreFocus: true });
      log(key + " Escape 关闭：节点已移除；焦点" + focusWord(result.focus) + "；" + (result.focus ? result.focus.label : "") + "（原型最小归还）");
      refresh();
    });

    /* 未接线控件：可见标记 + 明确日志，不假装执行 */
    document.addEventListener("click", function (event) {
      const unwired = event.target.closest("[data-unwired]");
      if (!unwired) return;
      event.preventDefault();
      log("原型未接线：" + (unwired.dataset.unwiredName || "该控件") + " 未执行（只作状态展示）");
      refresh();
      return;
    });

    /* 演示栏 */
    document.addEventListener("click", function (event) {
      const btn = event.target.closest("[data-demo]");
      if (!btn) return;
      const demo = btn.dataset.demo;
      if (demo === "a-open") {
        const row = $("#rows-a .business-log-table-row:not([hidden])");
        if (!row) { log("A 重新打开详情：当前筛选没有可打开的行"); refresh(); return; }
        openA(row, true);
        log("A 重新打开详情：节点=1；焦点=关闭按钮");
      } else if (demo === "b-fail") {
        failB();
        log("B 还原失败态：错误块显示；抽屉可见=0、节点=0");
      } else if (demo === "d-open") {
        const dRow = $('.ll-signal-row', stateRoot("D"));
        openD(dRow.dataset.signalId, dRow, true);
        log("D 重新打开详情：节点=1；焦点=关闭按钮");
      } else if (demo === "c-legacy") {
        setLegacyC(true);
        log("C 切到旧行为：错误单行 nowrap；请对比错误块 scrollWidth 与浮层溢出差");
      } else if (demo === "c-new") {
        setLegacyC(false);
        log("C 切到新行为：错误换行 + 任意断词；错误块 scrollWidth 应等于 clientWidth");
      } else if (demo === "e-legacy") {
        setLegacyE(true);
        log("E 切到旧行为：台账 .lg-warning 无断词；请对比 scrollWidth");
      } else if (demo === "e-new") {
        setLegacyE(false);
        log("E 切到新行为：按 spec 只加 .ll-root .lg-warning 的换行；基线块保持旧行为");
      } else if (demo === "reset-state") {
        initState(current);
        log("重放状态 " + current + " 的初始画面");
      }
      refresh();
    });

    window.addEventListener("resize", function () { refresh(); });
    if (window.ResizeObserver && $(".proto-chrome")) {
      new window.ResizeObserver(function () { refresh(); }).observe($(".proto-chrome"));
    }
    document.addEventListener("focusin", function () { text($("#obs-focus"), describeFocus()); });
    window.addEventListener("hashchange", function () {
      const key = (window.location.hash || "").replace("#", "").toUpperCase();
      if (STATES.indexOf(key) !== -1 && key !== current) showState(key);
    });
  }

  function boot() {
    initDrawerCache();
    bind();
    /* 绑定后再摘下未打开状态的抽屉节点：B/D 初始就是关闭的，DOM 应与可见状态一致 */
    detachDrawer("B");
    detachDrawer("D");
    const initial = (window.location.hash || "").replace("#", "").toUpperCase();
    showState(STATES.indexOf(initial) !== -1 ? initial : "A");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
