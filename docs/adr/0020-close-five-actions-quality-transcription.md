# ADR 0020：`close` 回归五个交付动作，质量状态抄写而非裁判

## 状态

Accepted — 2026-08-29（修订 ADR 0018 的清理条款）

## 背景

ADR 0018 把 close 定为唯一完整交付动作并要求"全部物理事实成立后才写 completed.json"。
实践中该要求与 `workspace_mode=existing`（绑定已有工作目录）自相矛盾：existing 目录不是
任务创建的，删除被禁止，于是 existing 任务永远无法完成 close。同时 close 在实际实现中
兼任了质量裁判（质量缺口即拒绝）与风险登记（一整套 risk close 平行机制），导致正常
close 路径事实上不可达，所有任务都只能"强行风险 close"。

用户在 2026-08-29 的 Talk 中给出朴素定义："close 不就是在 verify-code 结束之后进行
提交、合并、归档、推送、清理动作的步骤吗"，并确认质量裁判职责归属 verify-code。

## 决策

- `close` = verify-code 之后的五个交付动作：提交、合并、归档、推送、清理；开始前一次
  人工确认清单（F7 不可逆授权底线不变）。
- 质量不归 close 裁判。verify-code 的人工确认已承担质量职责；close 把当时的质量状态
  如实抄写进完成记录：绿 = 正常完成；不绿 = 物理交付完成 + `quality_status` 保持
  `incomplete`、`product_release_status` 保持 `not_released`。不伪造通过，也不设平行
  的 risk close 机制。
- 清理规则一句话：框架自己创建的工作目录（deterministic 模式）才删除；绑定的已有目录
  （existing 模式）不删除、只记录为 not_applicable_recorded。判定使用 manifest 已有的
  `workspace_mode` 字段，删除前保留真实路径/common-dir/分支三重校验。**本条修订
  ADR 0018 的"全部物理事实成立"条款**：对 existing 模式，worktree/branch cleanup 事实
  以记录代替物理删除。
- close 计划的每一步落账，失败后可从断点续跑；手工完成的物理交付经核对后可补写
  `operations/close/completed.json`（只证物理交付，不漂白质量）。
- 完成宣称/推进资格/不可逆授权三者分离：completed.json 只证物理交付事实；质量完成宣称
  由 Q2 判据约束；archive/cleanup 等由 F7 授权约束。

## 责任与消费者

- 唯一用户入口不变：`tools/cli/task-close.mjs close`。
- 完成事实消费者：`operations/close/completed.json`（物理交付）与质量/发布各自的事实
  记录（语义状态），消费者不得把 completed.json 读成质量通过。
- 内部 `prepare`/`execute`/`resume`/`finalize` 仅为恢复与测试接口，不是额外用户审批
  流程（沿用 ADR 0018 边界）。

## 删除/保留条件

risk close 平行机制（risk plan 死路、恒 risk 入口）删除；手工补记能力（finalize）保留
至出现正式的可恢复执行链替代品为止。本 ADR 与 ADR 0018 冲突处以本 ADR 为准。
