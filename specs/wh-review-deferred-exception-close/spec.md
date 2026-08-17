# 需求规格

## 目标

修复 acceptance evidence 和 verify-code 对“证据不足/延期”的语义，让系统停止把它们当成实现失败，从而避免无意义的重复审查、重复测试和 token 浪费。

## 范围

- `acceptance-evidence.v1` 的 `result` 支持 `pass`、`fail`、`inconclusive`、`deferred`。
- verify-code 只把 `fail` 计入 `failedEvidence`；`inconclusive` / `deferred` 必须保留在当前证据中，但不触发“失败证据”分支。
- stage-runner 生成 acceptance evidence 时保留当前 subject 状态的语义，不把 `inconclusive` / `deferred` 写成 `fail`。
- quality store、freshness 校验和 wh-review AC 汇总合同同步支持上述语义。
- freshness 和 quality store 对新结果按原值认证：`inconclusive` / `deferred` 不判成 `failed`，也不判成 `passed`；它们仍是未完成质量事实。review `unavailable` 保持 unavailable，不在本 mini-task 中转换。
- 普通 close 仍只接受满足质量谓词的 `passed` 事实；本修复不能把 inconclusive/deferred 变成通过。

## 不做的事

- 不改变五个正式 stage 的顺序和审查次数。
- 不新增新的 close 状态、公共命令或持久化控制面。
- 不替代 A/B 评测、独立审查、finding 处理或人工确认。
- 不修改公开监控文件，不运行 Multica，不重跑全量测试。

## 验收标准

1. 合法的 `pass`、`fail`、`inconclusive`、`deferred` acceptance evidence 都能通过基础合同校验；其他结果仍拒绝。
2. verify-code 处理 `inconclusive` / `deferred` 时不会把它们放进 `failedEvidence`，也不会生成“failed acceptance evidence”误报；它们仍不能让 acceptance predicate 通过。
3. stage-runner 生成的 acceptance evidence 与 subject 状态一致：`passed→pass`、`failed→fail`、`inconclusive→inconclusive`、`deferred→deferred`、`missing→deferred`（summary 保留 `actual_outcome: missing`）；未枚举状态报错。
4. freshness、quality store 和 wh-review AC 汇总对新结果保持一致，不把它们投影为 `pass`，也不静默丢失原始结果。
5. 普通 close 的现有严格门槛不变；聚焦测试能证明非通过状态仍不能 close。
6. 只运行与上述合同和路径直接相关的聚焦测试，并保留实际测试收据；不跑父任务全量测试。

## 回滚边界

如果实现尚未产生新的 `inconclusive` / `deferred` 记录，可以回退本 mini-task 代码并运行旧合同测试。如果已经产生新记录，不删除记录、不把它们改写成 `fail`；先保留兼容读取，或暂停回退并把记录与风险交给人工确认。父任务在回退完成且聚焦测试通过前，不重新绑定新快照。
