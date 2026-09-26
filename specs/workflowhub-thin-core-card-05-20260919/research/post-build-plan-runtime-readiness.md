# CARD-05 post build-plan 运行环境修复记录

状态：进行中；本文件为非权威研究/修复记录，正式结果只由 task facts 与质量原件判定。

## 来源与边界

用户本轮先要求合入 workflowhub main、仅用 post build-plan 产 spec/Phase，继而明确要求把当前 task 的 pre 直接改成 post，并严格执行 build-plan 到完成。CARD-05 原 task.json 在创建时为 pre；本轮直接改为 post 并更新冻结时间。该手改方式不受 tools/cli/task-bootstrap.mjs 的现行合同支持，旧 pre 事实保留只读，不能把新的 cohort 值追溯写成创建时就已 post。

合并 main 后的公开技能已经声明 post build-plan 输出 spec.md、phases/P<n>.md、phases/index.md；实际 runtime 仍按 plan.md/tasks.md 读写。只改 task.json 会形成假 post，因此本轮在同一 task worktree 修复正式运行环境。此修复的 owner 为 WorkflowHub runtime；唯一 consumer 为当前及后续 post cohort 的 build-plan 正式材料写入、质量事实与 status。替代关系是现有 pre 四材料逻辑新增 cohort 分支，不新建 stage/store/public command。删除条件：正式 post 路径被经审查的统一材料合同取代且 pre 历史仍可读。

## 当前改动面（以 git diff 为准）

- core/artifact-dir.mjs：认证列出 Phase 实体，防符号链接/非文件。
- runtime/task/material-workspace.mjs：按 cohort 定材料路径、读写和 digest；pre 四材料保留。
- runtime/stage/stage-handlers.mjs：post build-plan 消费真实 spec/index/Phase，校验索引/Task 结构，产 spec_ref、phase_index_ref、phase_refs；pre handler 保留。
- runtime/stage/completion-predicates.mjs、runtime/task/task-kernel-implementation.mjs、runtime/evidence/quality-fact.mjs：post scope/revision/质量事实绑定。
- runtime/stage/stage-runner.mjs、tools/cli/stage-runtime.mjs：正式 worker、阶段材料当前性、status 与 handoff 读回。
- tests/contract/material-workspace.test.mjs、post-build-plan-handler-materials.test.mjs、post-build-plan-material-scope.test.mjs、post-quality-fact-scope.test.mjs：目标正反例；只跑这些及受影响的窄测试，不全量回归。

## 逐条核对

| 判据 | 当前事实/风险 |
| --- | --- |
| 任务身份 | CARD-05 任务 worktree、branch、HEAD 已核；main 快进合入。外置 task.json 的 post 为本轮用户直接修改，非原始 bootstrap 身份。 |
| 材料真实性 | 当前 spec/Phase/index 是草稿；`currentPostPhases` 已对五份实体返回 P1–P5。正式 `run` 尚未发布。 |
| 定向测试 | 底层 14/14、post handler 11/11、post scope 32/32、quality fact 3/3（具体命令/时间见本轮执行输出）；stage-runner 相关组合 41/42，唯一失败在干净 main 同样复现，不归因本次改动。 |
| 独立审查 | 已进行一次独立代码/材料检查，发现 status 空指针、Phase 写集与 gate 假绿、阶段末缺材料静默过滤；对应改动已修或正在定向复验。审查 findings 不是质量通过证明。 |
| 正式完成 | 仍缺当前决策绑定确认、post 来源语义分析的认证生产/消费、部分真实 RED、build-plan merged review、最终 spec-analyze、计划确认与 reflection。不得把结构检查或文件存在写为 build-plan completed。 |

## 修复与产品 Phase 的关系

这是为了让当前 task 可以正式执行 post build-plan 的运行环境修复，不属于 CARD-05 产品审查链 P1–P22 的交付宣称。CARD-05 的产品实现仍按 spec.md 与 Phase 权威文件推进。正式 stage 可用后，以当前材料/真实 review/用户确认执行；本记录不充当阶段结果，也不允许省略缺失质量事实。
