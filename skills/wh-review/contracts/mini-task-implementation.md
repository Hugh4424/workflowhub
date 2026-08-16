# mini-task implementation review

这是 mini-task 的最终实施审查，不是五阶段 stage，也不是方案审查。

## 实施审查重点

- 当前 diff/snapshot 是否实现冻结的四份材料和逐 AC trace。
- 受影响测试命令、实际结果、跳过理由、coverage limits、真实用户结果和剩余风险是否真实且相互一致。
- AC 标为 `not_applicable` 时必须给受限 `reason_code`（`out_of_scope`、`no_ui`、`no_code_change`、`no_runtime_path` 或 `deferred_scope`）和具体 `not_applicable_reason`；它不会自动算作通过。
- 失败、unavailable、same-source 或证据缺口是否被如实保留，是否有越界改动或静默遗漏。

如果返回 finding，mini-task 必须逐条记录 `fixed`、`rejected_invalid`、`accepted_risk` 或
`needs_human`；普通 finding 不能省略，`accepted_risk` 必须绑定当前 finding/review/snapshot
并有真实用户风险确认。审查事实不等于实现通过，最终交付仍由测试、AC、例外和人工确认共同决定。

沿用 build-code 的“需求符合度 → 真实正确性 → 必要性”三轴，再补真实用户结果和小功能
边界。优先找会让用户结果错误、让原有流程退化、让失败无法恢复或让改动悄悄扩大范围的
问题；不把快照、材料清单和流程记录本身当成审查目标。

## 复审边界

- 只做一次 implementation review；只有真实修复或审查主题真实变化后，才允许一次聚焦复审。
- 重复 finding、主体没有变化，或没有可信终态时，不得机械重试；必须如实保留 `needs_human`、`unavailable` 或 `incomplete`。

## 变更文件 anchor 例外

mini-task implementation 的完整 `changes.diff`/snapshot 是实施主体本身；它不是五阶段
build-code 的 phase subject。因此，`ac_trace` 可以用变更文件作为补充的 bounded context
anchor，不要求标准 phase contract 的 `outside_diff_reason`，也不得用这个 context 替代完整
diff。provider 仍以 `changes.diff` 为变更行的唯一权威；context 只是帮助阅读的重复片段，必须
保留当前 snapshot hash 和 anchor 绑定。

只返回 findings；不要输出 verdict、pass/fail、summary 或第二个 JSON。
