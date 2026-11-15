# 有稿判断：不能用

## 三链分别是什么？

- 页面链：旧页 `records-list` 到目标页的入口对应可读，但目标页未定。
- 数据链：旧接口 `/records` 的读取与写入边界可读。
- 功能链：主操作到回执消费的路径可读。

## 六项判断写了什么？

1. 旧页现状：旧页仍在，路由可读。
2. 改造或重写：重写旧页结构，原因是旧结构与新稿方向冲突。
3. 设计稿来源：样本 `prototype/`，角色是样本设计源。
4. 可用性：三档结论为不能用；硬条件是关键交互无法移植。
5. 适配项：无，命中硬条件后不再累计适配项。
6. 去向与负责人：给两条去向与负责人，等方向 owner 选择。

## 为什么不能用？

样本稿的关键交互依赖页面外的宿主能力，不改业务方向就无法移植。
命中硬条件“关键交互无法移植”，因此不能用；不能用必须给两条去向与负责人。

## 结论与去向是什么？

结论是不能用。两条去向分别回方向 owner 与设计源 owner：
其一改业务交互边界，其二换一版可移植的稿件。下一步停在这里等选择。

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
    "handoff": "两条去向与负责人交方向 owner 选择"
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
  "owner": "方向 owner",
  "pending_confirmation": {
    "status": "none",
    "reason": ""
  }
}
```
