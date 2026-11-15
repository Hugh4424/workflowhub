# 有稿判断：适配后套用

## 三链分别是什么？

- 页面链：旧列表页与旧详情页到目标页的入口与组件对应。
- 数据链：两个页面区域到旧接口 `/records` 的读取与写入对应。
- 功能链：用户操作到结果区回执的消费路径。

## 六项判断写了什么？

1. 旧页现状：旧列表页与旧详情页都仍在，路由可读。
2. 改造或重写：两页都改造，保留原有入口与主操作。
3. 设计稿来源：样本 `prototype/`，角色是样本设计源。
4. 可用性：三档结论为适配后套用，无硬条件命中。
5. 适配项：共四项，逐项有来源与去向。
6. 去向与负责人：进入实施，负责人是样本实施 owner。

## 适配项多于三项为什么仍可套用？

硬条件优先于数量。四项都可通过适配层处理，没有命中任何硬条件，
因此结论仍是适配后套用，不按项数改成不能用。

## 结论与去向是什么？

结论是适配后套用。下一步进入实施；负责人是样本实施 owner。

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
      "disposition": "adapt",
      "reason": "保留列表入口，替换结果区样式",
      "basis": "旧列表页入口与当前样式字节"
    },
    {
      "page": "records-detail",
      "disposition": "adapt",
      "reason": "保留详情返回路径，替换内容区网格",
      "basis": "旧详情页返回路径与当前样式字节"
    }
  ],
  "no_old_page_reason": "",
  "chains": {
    "page": "页面链：两个旧页入口与目标页组件对应可读",
    "data": "数据链：两个页面区域到 /records 的对应可读",
    "function": "功能链：主操作到回执消费的路径可读"
  },
  "checks": {
    "old_page_state": "旧列表页与旧详情页都仍在，路由可读",
    "disposition_basis": "两页都改造，保留入口与主操作",
    "design_source": "样本 prototype/ 充当样本设计源",
    "availability": "适配后套用，无硬条件命中",
    "adaptation": "四项适配，逐项有来源与去向",
    "handoff": "进入实施，负责人是样本实施 owner"
  },
  "verdict": "adapt",
  "hard_conditions": [],
  "adaptation_items": [
    "结果区样式改为新稿细线网格",
    "列表行数据字段改由适配层映射",
    "详情返回路径保留旧路由",
    "主操作文案按新稿替换"
  ],
  "destinations": [],
  "next": "进入实施，先做适配层再做页面",
  "owner": "样本实施 owner",
  "pending_confirmation": {
    "status": "none",
    "reason": ""
  }
}
```
