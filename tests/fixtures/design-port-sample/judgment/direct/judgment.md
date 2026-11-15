# 有稿判断：直接套用

## 三链分别是什么？

- 页面链：旧页 `records-list` 到目标页 `sample-page` 的入口与组件对应。
- 数据链：结果区到旧接口 `/records` 的读取与写入对应。
- 功能链：用户操作“读取下一份样例”到结果区的回执消费。

## 六项判断写了什么？

1. 旧页现状：旧页仍在，路由与主按钮可读。
2. 改造或重写：重写旧页结构，原因是旧结构不符合新稿网格。
3. 设计稿来源：样本 `prototype/`，角色是样本设计源。
4. 可用性：三档结论为直接套用，无硬条件命中。
5. 适配项：无。
6. 去向与负责人：进入实施，负责人是样本实施 owner。

## 结论与去向是什么？

结论是直接套用。下一步进入实施；负责人是样本实施 owner。

## 机器字段（校验器用，人可跳过）

```json
{
  "schema_version": "1.0.0",
  "design_source": {
    "role": "sample_design_source",
    "ref": "tests/fixtures/design-port-sample/prototype",
    "availability": "present"
  },
  "old_pages": [
    {
      "page": "records-list",
      "disposition": "rebuild",
      "reason": "旧结构不符合新稿网格",
      "basis": "旧页 DOM 与样式的当前字节"
    }
  ],
  "no_old_page_reason": "",
  "chains": {
    "page": "页面链：旧页入口与组件对应可读",
    "data": "数据链：结果区到 /records 的读取与写入对应可读",
    "function": "功能链：主按钮到结果区回执的消费路径可读"
  },
  "checks": {
    "old_page_state": "旧页仍在，路由与主按钮可读",
    "disposition_basis": "重写旧页，依据旧结构不符合新稿网格",
    "design_source": "样本 prototype/ 充当样本设计源",
    "availability": "直接套用，无硬条件命中",
    "adaptation": "没有适配项",
    "handoff": "进入实施，负责人是样本实施 owner"
  },
  "verdict": "direct",
  "hard_conditions": [],
  "adaptation_items": [],
  "destinations": [],
  "next": "进入实施，按稿生成页面",
  "owner": "样本实施 owner",
  "pending_confirmation": {
    "status": "none",
    "reason": ""
  }
}
```
