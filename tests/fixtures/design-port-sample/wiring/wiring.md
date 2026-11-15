# 既有功能接线映射（样本）

## 这份映射记录什么？

记录样本页旧功能的「功能—接口—入口」三链，以及预期参数、真实回执、旧钩子与恢复方式。
人读表给人看，机器块给 `check-wiring.mjs` 读；两者描述同一事实，不互为第二权威。
断开的处理器、接错的接口或缺尝试记录的缺口都不得通过。

## 三链分别是什么？

一条功能要同时接回三个维度：功能（function）、接口（interface）、入口（entry）。
功能是页面调用的旧能力，接口是它真正请求的旧路径，入口是触发它的旧页面控件。
三者缺一即视为未接回；只删新增文件或只改页面外观不算接回。

## 样本有哪几条链？

样本有读取与写入两条功能链，都落在同一样本旧网关与 `/records` 旧接口上。
两条链共用同一个人工入口 `#next-sample`，读取走 `GET`，写入走 `POST`。
旧钩子是结果区 `#result-panel` 上的 `data-legacy-hook="sample-result"`，保持不变。

| 功能 | 接口 | 入口 | 预期参数 | 回执 | 旧钩子 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| readRecord | GET /records/:recordId | #next-sample | recordId=sample-01 | 响应记录 | sample-result | 已接回 |
| writeRecord | POST /records | #next-sample | recordId=sample-01、value=legacy-write、requestId=req-01 | 服务侧存储回执 | sample-result | 已接回 |

## 真实回执从哪里来？

写入回执来自 `POST /records` 的响应，并与服务侧存储里的同一条记录一致。
页面回显不是存储真相；没有回执就不能报告写入成功。
读取的真实结果来自 `GET /records/sample-01` 的实际响应，不是页面内置样例。

## 回退怎样才算恢复？

回退对象是临时副本内本任务适配器改动块，不是原对象。
撤回改动块后，重放旧参数、旧入口与旧钩子，旧页面与旧接口必须同时可读。
只删除新增文件而不恢复旧字节，不算回退；旧行为受损时失败。

## 校验器用，人可跳过

```json
{
  "schema_version": "1.0.0",
  "kind": "wiring-map",
  "version": "wiring-map.v1",
  "chain_dimensions": ["function", "interface", "entry"],
  "legacy_interface": "/records",
  "legacy_hooks": [
    {"selector": "#result-panel", "attribute": "data-legacy-hook", "value": "sample-result"}
  ],
  "source": {
    "legacy_gateway": "LegacySampleGateway",
    "legacy_interface": "/records",
    "client_adapter_ref": "tests/fixtures/design-port-sample/prototype/app.js",
    "port_output_record": "quality/evidence/build-code/P2/2026-11-15-001-p2-port-output.json"
  },
  "chains": [
    {
      "id": "read-record",
      "function": "LegacySampleGateway.readRecord",
      "interface": "GET /records/:recordId",
      "entry": "#next-sample",
      "expected_params": {"recordId": "sample-01"},
      "receipt_ref": "GET /records/sample-01 的实际响应",
      "hooks": [
        {"selector": "#result-panel", "attribute": "data-legacy-hook", "value": "sample-result"}
      ],
      "status": "wired",
      "attempt_ref": "tests/contract/design-port-wiring.test.mjs#read-wired",
      "review_ref": "quality/evidence/build-code/P3-data-wiring-readback.md#independent"
    },
    {
      "id": "write-record",
      "function": "LegacySampleGateway.writeRecord",
      "interface": "POST /records",
      "entry": "#next-sample",
      "expected_params": {"recordId": "sample-01", "value": "legacy-write", "requestId": "req-01"},
      "receipt_ref": "POST /records 的服务侧存储回执",
      "hooks": [
        {"selector": "#result-panel", "attribute": "data-legacy-hook", "value": "sample-result"}
      ],
      "status": "wired",
      "attempt_ref": "tests/contract/design-port-wiring.test.mjs#write-wired",
      "review_ref": "quality/evidence/build-code/P3-data-wiring-readback.md#independent"
    }
  ],
  "gaps": [],
  "recovery": {
    "object": "临时副本内本任务适配器改动块",
    "replay": ["readRecord sample-01", "writeRecord req-01", "#next-sample", "#result-panel[data-legacy-hook=sample-result]"],
    "restored": true,
    "ref": "tests/contract/design-port-wiring.test.mjs#recovery"
  }
}
```
