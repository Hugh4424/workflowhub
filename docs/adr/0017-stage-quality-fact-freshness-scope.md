# ADR-0017: 固定阶段质量事实的新鲜度范围

## C6 修订

2026-09-13：active `quality/verify.v1` object graph、`product_release` 与
`status_groups` 纳入 C6 removal 口径；不可变 `specs/archive/**`、`docs/research/**` 仅保留为
历史/研究来源。

## 决定

质量事实只保留在 `facts.jsonl` 的 K2 当前阶段行，并保存身份/完整性所需字段；
`material_digest`、`snapshot_tree`、`decision_revision` 是 provenance/integrity 字段，
不再作为 freshness selector 或失效触发器。调用者不能伪造 K2 行或具名 ref。

当前状态只读取 K2 当前行与 K1–K6 具名 ref；材料变化不再触发下游事实失效或自动重跑。

## 唯一消费者与责任

- 当前记录写入者：`facts.jsonl` canonical task writer。
- 读取消费者：K2 当前行 reader、`stage-runtime status`、正式 close 投影和 K5 历史证据 reader。
- `evaluateFactFreshness`、`deriveCurrentProductRelease` 与 `quality/verify.json` 不再属于 active consumer graph。
- 质量事实仍是事实，不是新的状态机或推进许可证；缺失保持 `unknown`/`unavailable`/`incomplete`，不能变成通过。

ADR-0029 进一步规定 K2 当前行、K5 具名证据 ref 和三域 close 读模型：本 ADR 不另建
freshness 控制面、产品发布 writer、current selector 或 close 状态。

## 证据与测试

- `tests/integration/verify-freshness-selection.test.mjs` 覆盖下游新增、上游修改和伪造 scope。
- `tests/integration/vnext-official-stage-run.test.mjs` 覆盖宿主结果到官方质量事实的闭环。

## 删除条件

C6 的 active freshness scope/object graph removal 须以 T54/T55 结构化 proof 收口；不得恢复
`quality-verify.v1.json`、`product_release` 或 `status_groups`，除非有新的决策、当前 consumer
证据和完整回滚边界。
