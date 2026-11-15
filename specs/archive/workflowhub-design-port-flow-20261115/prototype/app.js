"use strict";

/**
 * @typedef {"success" | "empty" | "error"} SampleStateKey
 * @typedef {Object} SampleRecord
 * @property {string} name
 * @property {string} value
 * @typedef {Object} SampleViewModel
 * @property {SampleStateKey} key
 * @property {string} number
 * @property {string} label
 * @property {string} message
 * @property {SampleRecord[]} records
 * @property {string} detail
 */

/** @type {ReadonlyArray<SampleViewModel>} */
const sampleStates = Object.freeze([
  {
    key: "success",
    number: "01",
    label: "成功",
    message: "已读取成功结果样例。",
    records: [
      { name: "记录名称", value: "成功结果样例" },
      { name: "数据来源", value: "浏览器内置合成数据" },
      { name: "用途", value: "检查成功态的内容与布局" },
    ],
    detail: "",
  },
  {
    key: "empty",
    number: "02",
    label: "空",
    message: "这份样例没有记录。",
    records: [],
    detail: "空态不补零，也不填入虚构记录。",
  },
  {
    key: "error",
    number: "03",
    label: "错误",
    message: "合成读取失败，仅用于验证错误态。",
    records: [],
    detail: "这是有意合成的读取失败；没有发起真实请求。",
  },
]);

const button = document.querySelector("#next-sample");
const panel = document.querySelector("#result-panel");
const resultContent = document.querySelector("#result-content");
const stateNumber = document.querySelector("#state-number");
const stateLabel = document.querySelector("#state-label");
const statusMessage = document.querySelector("#status-message");
const stateItems = document.querySelectorAll("[data-state]");

if (!button || !panel || !resultContent || !stateNumber || !stateLabel || !statusMessage) {
  throw new Error("PROTOTYPE_REQUIRED_ELEMENT_MISSING");
}

let currentIndex = 0;
let pending = false;

function makeValueTag() {
  const tag = document.createElement("span");
  tag.className = "value-tag";
  tag.textContent = "样例值";
  return tag;
}

/** @param {SampleViewModel} viewModel */
function render(viewModel) {
  stateNumber.textContent = viewModel.number;
  stateLabel.textContent = viewModel.label;
  statusMessage.textContent = viewModel.message;
  panel.dataset.state = viewModel.key;

  for (const item of stateItems) {
    if (item.getAttribute("data-state") === viewModel.key) {
      item.setAttribute("aria-current", "step");
    } else {
      item.removeAttribute("aria-current");
    }
  }

  if (viewModel.records.length > 0) {
    const list = document.createElement("dl");
    list.className = "sample-values";
    for (const record of viewModel.records) {
      const row = document.createElement("div");
      const name = document.createElement("dt");
      const value = document.createElement("dd");
      name.textContent = record.name;
      value.append(makeValueTag(), document.createTextNode(record.value));
      row.append(name, value);
      list.append(row);
    }
    resultContent.replaceChildren(list);
  } else {
    const detail = document.createElement("p");
    detail.className = viewModel.key === "error" ? "error-result" : "empty-result";
    detail.textContent = viewModel.detail;
    if (viewModel.key === "error") {
      detail.setAttribute("role", "alert");
    }
    resultContent.replaceChildren(detail);
  }
}

button.addEventListener("click", () => {
  if (pending) return;
  pending = true;
  button.setAttribute("aria-disabled", "true");
  button.textContent = "正在读取…";
  panel.setAttribute("aria-busy", "true");
  stateLabel.textContent = "读取中";
  statusMessage.textContent = "正在读取浏览器内置样例。";

  window.setTimeout(() => {
    currentIndex = (currentIndex + 1) % sampleStates.length;
    render(sampleStates[currentIndex]);
    pending = false;
    button.removeAttribute("aria-disabled");
    button.textContent = "读取下一份样例";
    panel.setAttribute("aria-busy", "false");
  }, 320);
});

render(sampleStates[currentIndex]);
document.documentElement.dataset.prototypeReady = "true";
