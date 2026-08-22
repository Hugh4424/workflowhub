# ADR-0017: 固定阶段质量事实的新鲜度范围

## 决定

质量事实继续只写入现有 `quality/facts/` 命名空间，并同时保存全局四材料 revision 与由运行时固定的 `material_scope` / `material_scope_revision`。调用者不能自定义、缩小、重排或伪造阶段范围。

阶段范围由 `runtime/stage/completion-predicates.mjs` 的 `STAGE_FACT_MATERIALS` 唯一拥有：上游材料变化会使下游事实失效；只新增下游材料不会误伤已完成的上游事实。

## 唯一消费者与责任

- 唯一写入者：`TaskKernel.publishVNextQualityFact`。
- 读取消费者：`evaluateFactFreshness`、`deriveCurrentProductRelease`、`stage-runtime status`、正式 close 投影。
- 质量事实仍是事实，不是新的状态机或推进许可证；scope 校验失败保持 stale/失败，不能变成通过。

## 证据与测试

- `tests/integration/verify-freshness-selection.test.mjs` 覆盖下游新增、上游修改和伪造 scope。
- `tests/integration/vnext-official-stage-run.test.mjs` 覆盖宿主结果到官方质量事实的闭环。

## 删除条件

只有当所有当前质量事实、状态投影和 close 消费者都不再需要区分全局 revision 与阶段范围，并完成迁移证据后，才能删除 scope 字段；在此之前不得新增第二套 freshness 控制面。
