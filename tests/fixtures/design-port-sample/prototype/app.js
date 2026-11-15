"use strict";

/**
 * 设计移植样本的客户端适配层（任务 2 首次交付，任务 3 原样生成）。
 *
 * 页面有两种模式：
 * - sample（默认）：使用页面内置、三层标注的合成数据；不发起网络请求；写操作被拒绝。
 * - real：同源 HTTP 调用旧接口；读取与写入都等待真实响应后，才通过同一个状态判定口
 *   进入 ViewModel；真实模式移除整页／区块／样例值三层标注。
 *
 * 状态只从 resolveViewModel 这一个判定口进入 ViewModel，render 只消费它。
 */

(function () {
  const SAMPLE_MODE = "sample";
  const REAL_MODE = "real";
  const READ_PATH = (recordId) => "/records/" + encodeURIComponent(recordId);
  const WRITE_PATH = "/records";

  const params = new URL(window.location.href).searchParams;
  const mode = params.get("mode") === REAL_MODE ? REAL_MODE : SAMPLE_MODE;
  const action = params.get("action") === "write" ? "write" : "read";
  const recordId = params.get("recordId") || "";
  const writeValue = params.get("value") || "";
  // 客户端读取预算：可配置，默认由页面给出；数据夹具声明的 timeout_ms 才是判定口径。
  // 预算到期必须由客户端自己中止，不能等迟到响应；页面文字不承担该语义。
  const DEFAULT_READ_TIMEOUT_MS = 7000;
  const requestedTimeout = Number(params.get("timeoutMs"));
  const readTimeoutMs = Number.isFinite(requestedTimeout) && requestedTimeout > 0
    ? requestedTimeout
    : DEFAULT_READ_TIMEOUT_MS;

  function endpointUrl(path) {
    return new URL(path, window.location.origin).href;
  }

  function timeoutError() {
    return Object.assign(new Error("READ_TIMEOUT"), { name: "AbortError", code: "TIMEOUT" });
  }

  function isTimeoutError(error) {
    return Boolean(error) && (error.name === "AbortError" || String(error.code || "").toUpperCase() === "TIMEOUT");
  }

  // 真正发射请求并套上中止定时器；预算到期由客户端先settle，即使传输层迟到
  // （或忽略 abort 信号），也不再有字节进入页面。
  async function fetchWithBudget(fetchImpl, url, init, timeoutMs) {
    const controller = new AbortController();
    let settled = false;
    let timer = null;
    const attempt = Promise.resolve()
      .then(() => fetchImpl(url, { ...init, signal: controller.signal }))
      .catch((error) => {
        if (isTimeoutError(error) || controller.signal.aborted) throw timeoutError();
        throw error;
      });
    // 迟到的拒绝由上面的竞速或这里吞掉，不产生未处理的 Promise 拒绝。
    attempt.catch(() => {});
    const budget = new Promise((resolve, reject) => {
      timer = setTimeout(function () {
        if (settled) return;
        settled = true;
        controller.abort();
        reject(timeoutError());
      }, timeoutMs);
    });
    try {
      const response = await Promise.race([attempt, budget]);
      settled = true;
      return response;
    } finally {
      if (timer !== null) clearTimeout(timer);
    }
  }

  class LegacySampleGateway {
    constructor({ fetchImpl, timeoutMs } = {}) {
      this.fetchImpl = fetchImpl || ((input, init) => window.fetch(input, init));
      this.timeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : readTimeoutMs;
    }

    async readRecord({ recordId } = {}) {
      if (typeof recordId !== "string" || recordId === "") {
        throw new Error("READ_RECORD_ID_REQUIRED");
      }
      const response = await fetchWithBudget(this.fetchImpl, endpointUrl(READ_PATH(recordId)), {
        method: "GET",
        headers: { accept: "application/json" },
      }, this.timeoutMs);
      const body = await response.text();
      if (!response.ok) {
        throw new Error("READ_FAILED:" + response.status + ":" + body.slice(0, 200));
      }
      return { status: response.status, record: body ? JSON.parse(body) : null };
    }

    async writeRecord({ recordId, value, requestId } = {}) {
      if (typeof recordId !== "string" || recordId === "") {
        throw new Error("WRITE_RECORD_ID_REQUIRED");
      }
      if (typeof requestId !== "string" || requestId === "") {
        throw new Error("WRITE_REQUEST_ID_REQUIRED");
      }
      const response = await fetchWithBudget(this.fetchImpl, endpointUrl(WRITE_PATH), {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ recordId: recordId, value: value, requestId: requestId }),
      }, this.timeoutMs);
      const body = await response.text();
      if (!response.ok) {
        throw new Error("WRITE_FAILED:" + response.status + ":" + body.slice(0, 200));
      }
      return { status: response.status, receipt: body ? JSON.parse(body) : null };
    }
  }

  const SAMPLE_INPUTS = [
    {
      kind: "success",
      number: "01",
      label: "成功",
      message: "已读取成功样例。",
      records: [
        { name: "记录名称", value: "成功结果样例" },
        { name: "数据来源", value: "浏览器内置合成数据" },
        { name: "用途", value: "检查成功态的内容与布局" },
      ],
    },
    {
      kind: "empty",
      number: "02",
      label: "空",
      message: "这份样例没有记录。",
      records: [],
      detail: "空态不补零，也不填入虚构记录。",
    },
    {
      kind: "error",
      number: "03",
      label: "错误",
      message: "合成读取失败，仅用于验证错误态。",
      records: [],
      detail: "这是有意合成的读取失败；没有发起真实请求。",
    },
  ];

  function resolveViewModel(input) {
    if (!input || typeof input !== "object") {
      return {
        kind: "error",
        number: "03",
        label: "错误",
        message: "没有可用输入。",
        records: [],
        detail: "输入缺失，不补造内容。",
        receipt: null,
      };
    }
    if (input.kind === "refused") {
      return {
        kind: "refused",
        number: "00",
        label: "拒绝写入",
        message: input.message || "样例模式拒绝写入，没有发起请求。",
        records: [],
        detail: input.detail || "",
        receipt: null,
      };
    }
    if (input.kind === "receipt") {
      return {
        kind: "receipt",
        number: "04",
        label: "写入回执",
        message: "写入已完成，结果来自真实响应。",
        records: [],
        detail: "",
        receipt: input.receipt,
      };
    }
    if (input.kind === "idle") {
      return {
        kind: "idle",
        number: "—",
        label: "待读取",
        message: input.message || "真实模式：尚未读取，点击按钮从同源接口读取。",
        records: [],
        detail: "",
        receipt: null,
      };
    }
    if (input.kind === "timeout") {
      return {
        kind: "timeout",
        number: "—",
        label: "超时",
        message: input.message || "读取超时。",
        records: [],
        detail: input.detail || "请求已由客户端中止，不展示迟到响应。",
        receipt: null,
      };
    }
    if (input.kind === "success") {
      return {
        kind: "success",
        number: input.number || "01",
        label: "成功",
        message: input.message || "已读取成功样例。",
        records: Array.isArray(input.records) ? input.records : [],
        detail: "",
        receipt: null,
      };
    }
    if (input.kind === "empty") {
      return {
        kind: "empty",
        number: input.number || "02",
        label: "空",
        message: input.message || "这份样例没有记录。",
        records: [],
        detail: input.detail || "空态不补零。",
        receipt: null,
      };
    }
    return {
      kind: "error",
      number: input.number || "03",
      label: "错误",
      message: input.message || "读取失败。",
      records: [],
      detail: input.detail || "没有真实结果，不填样例值。",
      receipt: null,
    };
  }

  // 读取结果形状只认实际数组：缺 records 或类型不对是未知失败，不是合法空态。
  // 与 check-data-discipline 的 resolveReadState 保持同一保守语义。
  function viewModelFromRead(response) {
    const record = response && response.record;
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      return resolveViewModel({
        kind: "error",
        message: "读取结果无法识别。",
        detail: "服务返回 2xx 但响应体不是记录对象；不当作空态。",
      });
    }
    if (!Array.isArray(record.records)) {
      return resolveViewModel({
        kind: "error",
        message: "读取结果无法识别。",
        detail: "服务返回 2xx 但缺少 records 数组；不当作零条记录。",
      });
    }
    const records = record.records;
    if (records.length === 0) {
      return resolveViewModel({ kind: "empty", detail: "服务返回零条记录。" });
    }
    return resolveViewModel({
      kind: "success",
      records: records.map((entry) => ({ name: String(entry.name || ""), value: String(entry.value || "") })),
      message: "已从旧接口读取记录。",
    });
  }

  // 回执必须是服务侧真的回了这一笔：有编号、与本次请求字段一致、来源是服务存储。
  // 只有 HTTP 2xx 不构成写入成功。
  function validReceipt(receipt, request) {
    if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) return null;
    if (typeof receipt.receipt_id !== "string" || receipt.receipt_id.trim() === "") return null;
    if (receipt.source !== "service_store") return null;
    if (receipt.recordId !== request.recordId) return null;
    if (String(receipt.value ?? "") !== String(request.value ?? "")) return null;
    if (receipt.requestId !== request.requestId) return null;
    return receipt;
  }

  const elements = {
    button: document.querySelector("#next-sample"),
    panel: document.querySelector("#result-panel"),
    content: document.querySelector("#result-content"),
    number: document.querySelector("#state-number"),
    label: document.querySelector("#state-label"),
    status: document.querySelector("#status-message"),
    stateItems: document.querySelectorAll("[data-state]"),
    note: document.querySelector("#action-note"),
  };

  if (!elements.button || !elements.panel || !elements.content || !elements.number
      || !elements.label || !elements.status) {
    throw new Error("SAMPLE_REQUIRED_ELEMENT_MISSING");
  }

  let pending = false;
  let sampleIndex = 0;
  let readGeneration = 0;
  const gateway = new LegacySampleGateway({});
  const idleButtonLabel = mode === REAL_MODE ? "读取真实记录" : "读取下一份样例";

  function setCurrentState(kind) {
    for (const item of elements.stateItems) {
      const active = item.getAttribute("data-state") === kind;
      item.classList.toggle("is-current", active);
      if (active) {
        item.setAttribute("aria-current", "step");
      } else {
        item.removeAttribute("aria-current");
      }
    }
  }

  function render(viewModel) {
    elements.number.textContent = viewModel.number;
    elements.label.textContent = viewModel.label;
    elements.status.textContent = viewModel.message;
    elements.panel.setAttribute("data-state", viewModel.kind);
    setCurrentState(viewModel.kind);

    const children = [];
    if (viewModel.records.length > 0) {
      const list = document.createElement("dl");
      list.className = "sample-values";
      for (const record of viewModel.records) {
        const row = document.createElement("div");
        row.className = "sample-values__row";
        const name = document.createElement("dt");
        const value = document.createElement("dd");
        name.textContent = record.name;
        if (mode === SAMPLE_MODE) {
          const tag = document.createElement("span");
          tag.className = "value-tag";
          tag.textContent = "样例值";
          value.append(tag);
        }
        value.append(document.createTextNode(record.value));
        row.append(name, value);
        list.append(row);
      }
      children.push(list);
    } else if (viewModel.detail) {
      const detail = document.createElement("p");
      const failure = viewModel.kind === "error" || viewModel.kind === "timeout";
      detail.className = failure ? "error-result" : "empty-result";
      detail.textContent = viewModel.detail;
      if (failure) {
        detail.setAttribute("role", "alert");
      }
      children.push(detail);
    }
    if (viewModel.receipt) {
      const receipt = document.createElement("p");
      receipt.className = "receipt-line";
      receipt.textContent = "回执：" + JSON.stringify(viewModel.receipt);
      children.push(receipt);
    }
    elements.content.replaceChildren(...children);
  }

  function apply(input) {
    render(resolveViewModel(input));
  }

  function setPending(next) {
    pending = next;
    if (next) {
      elements.button.setAttribute("aria-disabled", "true");
      elements.button.textContent = "正在读取…";
      elements.panel.setAttribute("aria-busy", "true");
    } else {
      elements.button.removeAttribute("aria-disabled");
      elements.button.textContent = idleButtonLabel;
      elements.panel.setAttribute("aria-busy", "false");
    }
  }

  function requireRecordId() {
    if (recordId !== "") return true;
    apply({ kind: "error", message: "缺少记录编号。", detail: "真实模式需要 recordId，未发起请求。" });
    return false;
  }

  async function runRealWrite() {
    if (!requireRecordId()) return;
    setPending(true);
    const request = {
      recordId: recordId,
      value: writeValue,
      requestId: "req-" + Date.now().toString(36),
    };
    try {
      const result = await gateway.writeRecord(request);
      const receipt = validReceipt(result && result.receipt, request);
      if (!receipt) {
        apply({
          kind: "error",
          message: "写入结果缺少有效回执。",
          detail: "服务返回 2xx，但回执缺失、编号为空或与本次请求不符；不报告写入成功。",
        });
        return;
      }
      apply({ kind: "receipt", receipt: receipt });
    } catch (error) {
      if (isTimeoutError(error)) {
        apply({ kind: "timeout", message: "写入超时。", detail: "请求已由客户端中止，未确认写入结果。" });
        return;
      }
      apply({ kind: "error", message: "写入失败。", detail: String(error.message) });
    } finally {
      setPending(false);
    }
  }

  async function runRealRead() {
    if (!requireRecordId()) return;
    const generation = ++readGeneration;
    setPending(true);
    try {
      const result = await gateway.readRecord({ recordId: recordId });
      // 超时中止后即使传输层迟到，也不允许旧请求覆盖当前页面状态。
      if (generation !== readGeneration) return;
      apply(viewModelFromRead(result));
    } catch (error) {
      if (generation !== readGeneration) return;
      if (isTimeoutError(error)) {
        apply({ kind: "timeout", message: "读取超时。", detail: "超过客户端预算仍未返回，请求已中止。" });
        return;
      }
      apply({ kind: "error", message: "读取失败。", detail: String(error.message) });
    } finally {
      if (generation === readGeneration) setPending(false);
    }
  }

  function runSample() {
    if (pending) return;
    if (action === "write") {
      apply({
        kind: "refused",
        message: "样例模式拒绝写入。",
        detail: "默认样例模式没有请求目标，因此不发起写入。",
      });
      return;
    }
    setPending(true);
    window.setTimeout(function () {
      sampleIndex = (sampleIndex + 1) % SAMPLE_INPUTS.length;
      apply(SAMPLE_INPUTS[sampleIndex]);
      setPending(false);
    }, 120);
  }

  elements.button.addEventListener("click", function () {
    if (pending) return;
    if (mode === REAL_MODE) {
      if (action === "write") {
        runRealWrite();
      } else {
        runRealRead();
      }
      return;
    }
    runSample();
  });

  if (mode === REAL_MODE) {
    for (const tag of document.querySelectorAll("[data-sample-tag]")) tag.remove();
    if (elements.note) elements.note.textContent = "真实模式：读取与写入都等待同源接口响应。";
    elements.button.textContent = idleButtonLabel;
    // 真实模式首次打开只有空闲态：没有任何真实响应前不显示合成成功记录。
    apply({ kind: "idle" });
  } else {
    apply(SAMPLE_INPUTS[sampleIndex]);
  }
  document.documentElement.dataset.sampleReady = "true";
  document.documentElement.dataset.sampleMode = mode;
  window.LegacySampleGateway = LegacySampleGateway;
  window.LegacySampleClientBudget = { read_timeout_ms: readTimeoutMs };
  window.resolveViewModel = resolveViewModel;
  window.viewModelFromRead = viewModelFromRead;
  window.sampleGateway = gateway;
})();
