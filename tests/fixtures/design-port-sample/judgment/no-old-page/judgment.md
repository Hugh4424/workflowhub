# 有稿判断：无旧页

## 三链分别是什么？

- 页面链：没有旧页，新页入口直接对应用户任务。
- 数据链：新页到旧接口 `/records` 的读取与写入对应。
- 功能链：主操作到结果区回执的消费路径。

## 六项判断写了什么？

1. 旧页现状：没有旧页，改造或重写不适用，理由见下。
2. 改造或重写：不适用；旧页不存在，不需要迁移旧结构。
3. 设计稿来源：样本 `prototype/`，角色是样本设计源。
4. 可用性：三档结论为直接套用，无硬条件命中。
5. 适配项：无。
6. 去向与负责人：进入实施，负责人是样本实施 owner。

## 为什么改造或重写不适用？

旧页不存在，没有可改造或可重写的对象。
不适用理由必须写明，不能省略这一项。

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
  "old_pages": [],
  "no_old_page_reason": "没有旧页，改造或重写不适用；旧页不存在",
  "chains": {
    "page": "页面链：没有旧页，新页入口直接对应用户任务",
    "data": "数据链：新页到 /records 的对应可读",
    "function": "功能链：主操作到回执消费的路径可读"
  },
  "checks": {
    "old_page_state": "没有旧页",
    "disposition_basis": "改造或重写不适用，理由是没有旧页",
    "design_source": "样本 prototype/ 充当样本设计源",
    "availability": "直接套用，无硬条件命中",
    "adaptation": "没有适配项",
    "handoff": "进入实施，负责人是样本实施 owner"
  },
  "verdict": "direct",
  "hard_conditions": [],
  "adaptation_items": [],
  "destinations": [],
  "next": "进入实施，按稿生成新页",
  "owner": "样本实施 owner",
  "pending_confirmation": {
    "status": "none",
    "reason": ""
  }
}
```
