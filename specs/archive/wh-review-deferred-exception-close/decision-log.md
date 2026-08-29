# Mini-task：让 verify-code 正确处理“证据不足”和“延期”

## 原始需求

当前 workflowhub 的 verify-code 不应因为证据不足、A/B 评测未完成或人工确认未完成，就把所有阶段重新审查、重新测试，直到伪装成 pass。除 build-code 的每个 phase 外，其他阶段只做一轮异源审查；审查结果应保留为 finding、inconclusive 或 unavailable，不应自动变成失败并触发重复工作。

本 mini-task 只修复这个流程缺口：让 acceptance evidence 能表达 `inconclusive` / `deferred`，让 verify-code 把它们记录为“尚未证明”而不是“业务失败”，同时保持普通 close 严格失败闭环。不得修改公开监控文件，不得接触 Multica，不得新增正式 stage 或第五份任务材料。

## 已确认事实

- 父任务当前快照的 v56 全量测试已经通过；本 mini-task 不重复跑全量测试。
- 父任务当前 verify-code 的 AC-02、AC-19、AC-20 是真实的 inconclusive，不是实现失败。
- `runtime/evidence/acceptance-evidence-validator.mjs` 现在只接受 `pass` / `fail`。
- `runtime/stage/stage-handlers.mjs` 现在只把 `fail` 放入 `failedEvidence`，但上游无法合法写入 `inconclusive` / `deferred`。
- `runtime/stage/stage-runner.mjs` 会把所有非 `passed` 的 acceptance subject 都写成 `result: fail`，造成语义压扁。
- `core/task-close.mjs` 的普通 close 本来就要求完整质量事实；本 mini-task 不降低这个门槛。明确风险接受仍走现有、与普通 close 分开的人工风险收口路径。

## 选择与理由

选择做一个边界很小的合同修复：扩展 acceptance evidence 的结果枚举，并在验证、汇总、stage 生成、quality store 和 freshness 校验中保留 `inconclusive` / `deferred` 的原义；只有 `fail` 才算失败证据。这样既停止无意义的重试，又不会把没有证明的 AC 误判为通过。

stage subject 状态集合冻结为 `passed`、`failed`、`inconclusive`、`deferred`、`missing`：前四种分别映射为 `pass`、`fail`、`inconclusive`、`deferred`；`missing` 表示没有可用事实，映射为 `deferred` 并保留 `missing` 的实际状态。其他状态直接报错，不再走 catch-all 的 `fail`。

不新增 selector、snapshot lineage、successor、reopen、replacement review 或新的公共命令；不修改审查次数配置；不修改普通 close 的六项质量门槛。未证明的 AC 仍然会让普通 close 保持 incomplete，只有明确人工确认的风险收口才可使用既有人工风险路径。review 本身的 `unavailable` 继续由现有 wh-review 记录为 unavailable；它不在本 mini-task 里被改写成 acceptance 结果，也不触发 WorkflowHub 外层重试。

## 延期与交接

- 父任务的 AC-02、AC-19、AC-20 是否最终证明，仍由父任务使用已有 v56 收据和用户确认决定；本 mini-task 不伪造 A/B 结果。
- 父任务当前 `needs_human` finding 不由本 mini-task 自动关闭。
- mini-task 完成后，父任务必须在合并后的新代码快照上做一次聚焦重绑定和一次独立 review；不重跑父任务全量测试。
- 如果变更尚未合并就需要回退，先停止父任务重绑定，保留已写入的不可变新结果；只有确认没有新枚举记录，或运行兼容读取后，才回到旧代码。不得删除或改写历史质量事实。
