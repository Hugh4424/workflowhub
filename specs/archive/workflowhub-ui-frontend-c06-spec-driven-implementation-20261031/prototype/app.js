(() => {
  "use strict";

  const byId = (id) => document.getElementById(id);
  const startInput = byId("start-at");
  const endInput = byId("end-at");
  const timeError = byId("time-error");
  const preview = byId("query-preview");
  const previewStatus = byId("preview-status");
  const applyStatus = byId("apply-status");
  const advancedFields = byId("advanced-fields");
  const filterToggle = byId("filter-toggle");
  const stateContainer = byId("state-container");
  const readyContent = byId("ready-content");
  const listCount = byId("list-count");
  const fixtureState = byId("fixture-state");
  const filterIds = ["entity-type", "outcome", "keyword", "event-type", "action"];
  const fixtureTimeMs = new Date("2026-08-30T12:00:00Z").getTime();
  let query = { limit: 50 };

  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "浏览器本地时区";
  byId("time-zone-hint").textContent = `本地时间（${zone}）；提交时转换为 UTC。`;
  byId("fixture-time").textContent = new Date("2026-08-30T12:00:00Z").toLocaleString("zh-CN", { hour12: false });

  function parseLocalDateTime(input) {
    const value = input.value.trim();
    if (value === "") return { value: undefined, milliseconds: undefined };
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
    if (!match) return { error: `${input.getAttribute("aria-label")}格式无效，请输入有效的本地日期和时间。` };
    const [, year, month, day, hour, minute] = match.map(Number);
    const parsed = new Date(year, month - 1, day, hour, minute, 0, 0);
    const sameLocalTime = parsed.getFullYear() === year
      && parsed.getMonth() === month - 1
      && parsed.getDate() === day
      && parsed.getHours() === hour
      && parsed.getMinutes() === minute;
    if (Number.isNaN(parsed.getTime()) || !sameLocalTime) {
      return { error: `${input.getAttribute("aria-label")}不是有效的本地日期和时间。` };
    }
    return { value: parsed.toISOString(), milliseconds: parsed.getTime() };
  }

  function showTimeErrors(invalidInputs, message, moveFocus) {
    for (const input of [startInput, endInput]) input.removeAttribute("aria-invalid");
    for (const input of invalidInputs) input.setAttribute("aria-invalid", "true");
    timeError.textContent = message;
    timeError.hidden = invalidInputs.length === 0;
    if (invalidInputs.length > 0) {
      applyStatus.textContent = "未应用：请修正时间错误";
      if (moveFocus) invalidInputs[0].focus();
      return false;
    }
    return true;
  }

  function draftQuery() {
    const next = { limit: 50 };
    for (const id of filterIds) {
      const value = byId(id).value.trim();
      if (value !== "") next[id.replaceAll("-", "_")] = value;
    }
    const start = parseLocalDateTime(startInput);
    const end = parseLocalDateTime(endInput);
    if (start.value) next.start_at = start.value;
    if (end.value) next.end_at = end.value;
    return { next, start, end };
  }

  function renderDraftPreview() {
    const { next, start, end } = draftQuery();
    const invalidInputs = [];
    const messages = [];
    if (start.error) {
      invalidInputs.push(startInput);
      messages.push(start.error);
    }
    if (end.error) {
      invalidInputs.push(endInput);
      messages.push(end.error);
    }
    if (invalidInputs.length === 0 && start.milliseconds !== undefined && end.milliseconds !== undefined && start.milliseconds > end.milliseconds) {
      invalidInputs.push(startInput, endInput);
      messages.push("开始时间不能晚于结束时间。");
    }
    for (const input of [startInput, endInput]) input.removeAttribute("aria-invalid");
    for (const input of invalidInputs) input.setAttribute("aria-invalid", "true");
    timeError.textContent = messages.join(" ");
    timeError.hidden = messages.length === 0;
    preview.textContent = JSON.stringify(next, null, 2);
    previewStatus.textContent = invalidInputs.length > 0
      ? "草稿含错误；列表保留上次应用"
      : "草稿未应用；点“查询”后更新列表、计数和空态";
    applyStatus.textContent = invalidInputs.length > 0 ? "未应用：请修正时间错误" : "未应用筛选变更";
  }

  function renderPreview(status) {
    preview.textContent = JSON.stringify(query, null, 2);
    previewStatus.textContent = status;
  }

  function applyFilters(moveFocus = true) {
    const { next, start, end } = draftQuery();
    const invalidInputs = [];
    const messages = [];
    if (start.error) {
      invalidInputs.push(startInput);
      messages.push(start.error);
    }
    if (end.error) {
      invalidInputs.push(endInput);
      messages.push(end.error);
    }
    if (invalidInputs.length === 0 && start.milliseconds !== undefined && end.milliseconds !== undefined && start.milliseconds > end.milliseconds) {
      invalidInputs.push(startInput, endInput);
      messages.push("开始时间不能晚于结束时间。");
    }
    if (!showTimeErrors(invalidInputs, messages.join(" "), moveFocus)) return false;
    query = next;
    renderPreview("已应用：本地输入已转换为 UTC；列表、计数和空态已更新");
    applyStatus.textContent = "已应用筛选";
    updateActiveFilterCount();
    renderAppliedList();
    return true;
  }

  function updateActiveFilterCount() {
    const count = [query.event_type, query.action, query.start_at, query.end_at].filter(Boolean).length;
    filterToggle.textContent = count ? `筛选 · ${count}` : "筛选";
    const descriptions = [];
    if (query.event_type) descriptions.push(`事件类型：${query.event_type}`);
    if (query.action) descriptions.push(`动作：${query.action}`);
    if (query.start_at) descriptions.push(`开始时间：${new Date(query.start_at).toLocaleString("zh-CN", { hour12: false })}`);
    if (query.end_at) descriptions.push(`结束时间：${new Date(query.end_at).toLocaleString("zh-CN", { hour12: false })}`);
    filterToggle.title = descriptions.join("；") || "事件类型、动作与时间筛选";
  }

  function actionButton(label, id) {
    const button = document.createElement("button");
    button.type = "button";
    button.id = id;
    button.className = "pb-ui-action";
    button.textContent = label;
    return button;
  }

  function renderFixture(kind) {
    const isReady = kind === "ready";
    readyContent.hidden = !isReady;
    listCount.hidden = !isReady;
    stateContainer.hidden = isReady;
    stateContainer.replaceChildren();
    if (isReady) return;

    const fixture = {
      loading: { label: "正在读取业务日志…", tone: "neutral", role: "status" },
      empty: { label: "还没有业务日志", tone: "neutral", role: "status" },
      filter_no_result: { label: "没有符合条件的日志", tone: "neutral", role: "status", action: ["重置筛选", "state-reset"] },
      history_unavailable: { label: "此时间段早于业务日志记录起点", recovery: "请调整时间范围或清除筛选。", tone: "warning", role: "status", action: ["清除全部筛选", "state-reset"] },
      error: { label: "业务日志读取失败", tone: "danger", role: "alert", action: ["重新加载", "state-retry"] },
    }[kind];
    stateContainer.className = `pb-ui-async-state pb-ui-async-state-${fixture.tone} business-log-state business-log-state-${kind}`;
    stateContainer.setAttribute("role", fixture.role);
    const label = document.createElement("span");
    label.textContent = fixture.label;
    stateContainer.append(label);
    if (fixture.recovery) {
      const recovery = document.createElement("span");
      recovery.className = "pb-ui-state-recovery";
      recovery.textContent = fixture.recovery;
      stateContainer.append(recovery);
    }
    if (fixture.action) stateContainer.append(actionButton(...fixture.action));
  }

  function renderAppliedList() {
    const startMs = query.start_at ? new Date(query.start_at).getTime() : undefined;
    const endMs = query.end_at ? new Date(query.end_at).getTime() : undefined;
    const outside = (startMs !== undefined && fixtureTimeMs < startMs)
      || (endMs !== undefined && fixtureTimeMs > endMs);
    const text = "回测已完成";
    const mismatched = (query.entity_type && query.entity_type !== "backtest")
      || (query.outcome && query.outcome !== "success")
      || (query.event_type && query.event_type !== "backtest.completed")
      || (query.action && query.action !== "completed")
      || (query.keyword && !text.includes(query.keyword));
    if (outside || mismatched) {
      renderFixture("filter_no_result");
      listCount.hidden = false;
      listCount.textContent = "共 0 条（当前筛选）";
      return;
    }
    renderFixture("ready");
    listCount.hidden = false;
    listCount.textContent = "共 1 条";
  }

  filterToggle.addEventListener("click", () => {
    const willOpen = advancedFields.hidden;
    advancedFields.hidden = !willOpen;
    filterToggle.setAttribute("aria-expanded", String(willOpen));
  });

  for (const id of filterIds) {
    byId(id).addEventListener("input", renderDraftPreview);
    byId(id).addEventListener("change", renderDraftPreview);
  }
  for (const input of [startInput, endInput]) {
    input.addEventListener("input", renderDraftPreview);
    input.addEventListener("change", renderDraftPreview);
  }

  function resetFilters() {
    for (const id of filterIds) byId(id).value = "";
    startInput.value = "";
    endInput.value = "";
    query = { limit: 50 };
    showTimeErrors([], "", false);
    renderPreview("空筛选查询预览（未发请求）");
    applyStatus.textContent = "已重置并显示全部日志";
    updateActiveFilterCount();
    fixtureState.value = "ready";
    renderAppliedList();
  }

  byId("apply-filters").addEventListener("click", () => applyFilters(true));
  byId("reset-filters").addEventListener("click", resetFilters);
  fixtureState.addEventListener("change", () => {
    renderFixture(fixtureState.value);
    if (fixtureState.value === "ready") renderAppliedList();
  });
  stateContainer.addEventListener("click", (event) => {
    if (event.target.id === "state-retry") {
      fixtureState.value = "ready";
      renderAppliedList();
    }
    if (event.target.id === "state-reset") resetFilters();
  });

  renderDraftPreview();
  renderPreview("初始查询预览（未发请求）");
  renderAppliedList();
  document.documentElement.dataset.prototypeReady = "true";
})();
