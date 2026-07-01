# 审查报告 — spec-20260701T032953Z-fa393e (round 1)

- verdict: revise_required
- provenance: single-context

## Summary

需要修订。主要问题是多个核心规则存在阻断/非阻断语义冲突，plan-reviewer 依赖路径未确定，task_dir 迁移范围和验收不匹配。这些会直接影响 build-plan 后续实现和验收。

## Findings

- [high] 位置: spec.md:160 | 问题: FR-DATACONTRACTS-002 同时要求 data-contracts.md 缺失时“记录 warn”“流程暂停”“升级人工”“非阻断门”。这些语义互相冲突：暂停流程就是阻断继续执行，但又标成 non-blocking escalation。 | 建议: 明确一种语义。推荐改为：data-contracts.md 缺失时记录 warn、生成人工升级记录、暂停 tasks.md 分解，直到人工确认；不要再称为 non-blocking。若确实非阻断，则必须允许 tasks.md 继续，并说明风险记录位置。
- [high] 位置: spec.md:222 | 问题: FR-TASKS-001 要求 placeholder 发现后“阻止后续阶段启动”，但 AC-13 又说明 blocking item 只是任务条目标记，“非阻断 stage 推进的门禁”。同一规则在 FR 和 AC 中相反，执行方无法判断是否应停流程。 | 建议: 统一为一个规则。推荐保留 no-placeholder 为硬规则：发现 TODO/TBD/placeholder/待定/暂缺即暂停后续阶段，标记 blocking item，并要求人工修复后继续。然后删除 AC-13 中“非阻断 stage 推进”的说明。
- [high] 位置: spec.md:182 | 问题: FR-PLANREVIEW-001 把 3rd-review plan-reviewer 的路径写死为 verifiers/vibecoding/plan-reviewer.md + plan-reviewer-contract.md，但附录又说明这些文件在当前 workflowhub 仓库中不存在，引用方式待确认。核心验收依赖一个未确定路径，会导致实现阶段卡住或各自解释。 | 建议: 在 spec 内先确定引用方式：外部绝对路径、repo 内复制、符号链接、还是配置项。推荐新增明确契约：workflowhub 通过配置字段引用 /Users/Hugh/Hugh/Project/3rd-review/verifiers/vibecoding/plan-reviewer.md，若路径不存在则记录 unavailable 并升级人工；不要把不存在的 repo 相对路径作为必然存在的验收项。
- [medium] 位置: spec.md:235 | 问题: FR-TASKDIR-001 要求“所有 skill”读取任务跟踪文件前都必须通过 task_dir 解析器，但影响范围和验收只覆盖 task_dir 解析器存在、能 grep 到消费者。范围太大、验收太弱，无法证明“所有 skill”都已迁移，也容易漏掉旧硬编码路径。 | 建议: 缩小或补强验收。推荐明确本轮只迁移 build-plan 流程涉及的 skill：build-plan、spec-research、spec-plan、spec-analyze、spec-tasks；并增加验收：这些文件不得出现旧硬编码任务目录，且测试覆盖显式配置和默认回退。
- [medium] 位置: spec.md:136 | 问题: 场景 4.8 说“任意 skill”读写路径都来自 task_dir，但 FR-TASKDIR-002 的默认路径是 ~/Knowledge/workflowhub/。未说明 task_dir 解析器是否允许绝对路径、相对路径、~ 展开、环境变量、路径不存在时是否创建或报错。 | 建议: 补充解析规则：支持绝对路径和 ~ 展开；相对路径以 repo root 或 cwd 为基准二选一；路径不存在时 let it crash 还是创建目录必须明确。推荐 let it crash，并输出明确错误。
- [medium] 位置: spec.md:173 | 问题: FR-SIMPLICITY-001 要求 minimal-path 字段值为 P0/P1/P2/P3 之一，但场景 4.3 又要求输出 P0/P1/P2/P3 阶梯结论；未定义四个档位的语义来源和字段结构，只写“之一及理由摘要”。后续实现可能写成字符串、对象或混合格式，影响下游消费。 | 建议: 定义 minimal-path 的稳定结构。推荐：minimal_path:{level:"P0|P1|P2|P3",reason:"...",reuse_target:"..."}。同时统一字段名使用 minimal_path 或 minimal-path，避免 Markdown 字段名和代码字段名不一致。
- [low] 位置: spec.md:45 | 问题: 速读卡写“tasks.md 六节格式含 STOP/Knowledge 标签 + upstream_delta 字段（软要求）”，但 OUT scope 又说 STOP/Knowledge 六节格式机器强校验门延后。当前没有说明“六节格式”具体是哪六节，且软要求如何人工检查不清楚。 | 建议: 如果本轮只做软约定，就把“六节格式”降为文档约定，并列出六节名称；验收只检查 SKILL.md 中有格式说明和 warn 语义，不要求机器校验。
- [low] 位置: spec.md:311 | 问题: AC-17 要求“npm test 绿”，但 spec 没有说明该仓库一定使用 npm，也没有限定测试命令归属。若项目不是 Node 测试栈，该验收会变成无关硬约束。 | 建议: 改成项目实际测试命令或更通用表述。推荐：task_dir 解析器测试通过；若仓库已有 npm test，则纳入 npm test，否则使用对应测试命令并在 plan 中固化。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 见上方 Findings

