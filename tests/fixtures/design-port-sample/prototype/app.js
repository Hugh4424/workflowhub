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

  function endpointUrl(path) {
    return new URL(path, window.location.origin).href;
  }

  class LegacySampleGateway {
    constructor({ fetchImpl } = {}) {
      this.fetchImpl = fetchImpl || ((input, init) => window.fetch(input, init));
    }

    async readRecord({ recordId } = {}) {
      if (typeof recordId !== "string" || recordId === "") {
        throw new Error("READ_RECORD_ID_REQUIRED");
      }
      const response = await this.fetchImpl(endpointUrl(READ_PATH(recordId)), {
        method: "GET",
        headers: { accept: "application/json" },
      });
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
      const response = await this.fetchImpl(endpointUrl(WRITE_PATH), {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ recordId: recordId, value: value, requestId: requestId }),
      });
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

  function viewModelFromRead(response) {
    const record = response && response.record;
    const records = Array.isArray(record && record.records) ? record.records : [];
    if (records.length === 0) {
      return resolveViewModel({ kind: "empty", detail: "服务返回零条记录。" });
    }
    return resolveViewModel({
      kind: "success",
      records: records.map((entry) => ({ name: String(entry.name || ""), value: String(entry.value || "") })),
      message: "已从旧接口读取记录。",
    });
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
  const gateway = new LegacySampleGateway({});

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
      detail.className = viewModel.kind === "error" ? "error-result" : "empty-result";
      detail.textContent = viewModel.detail;
      if (viewModel.kind === "error") {
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
      elements.button.textContent = "读取下一份样例";
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
    try {
      const result = await gateway.writeRecord({
        recordId: recordId,
        value: writeValue,
        requestId: "req-" + Date.now().toString(36),
      });
      apply({ kind: "receipt", receipt: result.receipt });
    } catch (error) {
      apply({ kind: "error", message: "写入失败。", detail: String(error.message) });
    } finally {
      setPending(false);
    }
  }

  async function runRealRead() {
    if (!requireRecordId()) return;
    setPending(true);
    try {
      const result = await gateway.readRecord({ recordId: recordId });
      apply(viewModelFromRead(result));
    } catch (error) {
      apply({ kind: "error", message: "读取失败。", detail: String(error.message) });
    } finally {
      setPending(false);
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
  }

  apply(SAMPLE_INPUTS[sampleIndex]);
  document.documentElement.dataset.sampleReady = "true";
  window.LegacySampleGateway = LegacySampleGateway;
  window.resolveViewModel = resolveViewModel;
  window.sampleGateway = gateway;
})();
