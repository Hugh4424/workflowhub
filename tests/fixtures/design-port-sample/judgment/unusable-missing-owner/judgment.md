# 有稿判断：不能用但缺负责人

## 这份样本故意缺什么？

这是受控负例：三链、六项判断、三档结论与下一步都在，只缺负责人。
它用于证明缺负责人时施工前置会拒绝，不是可用于施工的合法判断。

## 三链分别是什么？

- 页面链：旧页 `records-list` 到目标页的入口对应可读。
- 数据链：旧接口 `/records` 的读取与写入边界可读。
- 功能链：主操作到回执消费的路径可读。

## 六项判断写了什么？

1. 旧页现状：旧页仍在，路由可读。
2. 改造或重写：重写旧页结构。
3. 设计稿来源：样本 `prototype/`，角色是样本设计源。
4. 可用性：三档结论为不能用。
5. 适配项：无。
6. 去向与负责人：两条去向与各自负责人可读，页面级负责人缺失。

## 结论与去向是什么？

结论是不能用；两条去向与下一步可读，但页面级负责人缺失，所以不得施工。

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
      "reason": "旧结构与新稿方向冲突",
      "basis": "旧页 DOM 与当前方向记录的对照"
    }
  ],
  "no_old_page_reason": "",
  "chains": {
    "page": "页面链：旧页入口与目标页对应可读",
    "data": "数据链：旧接口读取与写入边界可读",
    "function": "功能链：主操作到回执消费的路径可读"
  },
  "checks": {
    "old_page_state": "旧页仍在，路由可读",
    "disposition_basis": "重写旧页，依据旧结构与新稿方向冲突",
    "design_source": "样本 prototype/ 充当样本设计源",
    "availability": "不能用，硬条件是关键交互无法移植",
    "adaptation": "命中硬条件后不再累计适配项",
    "handoff": "两条去向与下一步可读，页面级负责人缺失"
  },
  "verdict": "unusable",
  "hard_conditions": [
    "interaction_unportable"
  ],
  "adaptation_items": [],
  "destinations": [
    {
      "option": "改业务交互边界",
      "owner": "方向 owner",
      "next": "回 make-decision 重开方向"
    },
    {
      "option": "换一版可移植的稿件",
      "owner": "设计源 owner",
      "next": "重新提供可移植样本"
    }
  ],
  "next": "停止施工，等方向 owner 选择去向",
  "pending_confirmation": {
    "status": "none",
    "reason": ""
  }
}
```
