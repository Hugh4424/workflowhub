# Raw Requirement — workflowhub-review-flow-repair-20260906

> 生成日期：2026-09-06
> 来源：用户在主会话的原始表述（make-decision direction 审查用原始需求证据）
> 任务材料路径：specs/workflowhub-review-flow-repair-20260906/

## 原始需求（用户原话摘录）

1. 配置层面："为什么'/Users/Hugh/.config/workflowhub/config.json'里面为什么要记录完整的'profiles'？每个provider为什么要记录'priority'？这都没必要吧，wh-review调用的是'/Users/Hugh/.config/3rd-review/config.json'里的配置，只要'/Users/Hugh/.config/3rd-review/config.json'里面有正确的provider配置不就可以了吗？"
2. 阻塞不合理："为什么审查时候经常有各种真实阻塞：wh-review doctor 不是 reviewer 内容问题，而是本机 opencode/v4flash 配置与 3rd-review 配置不一致，无法安全生成当前审查结果。有的时候'priority'有问题也产生阻塞？很不合理。"
3. 耗时："现在审查特别浪费时间，往往一次审查要10多分钟，还经常因为各种原因失败。"
4. 不落盘："现在审查也极少在task_dir文件中留下审查结果，导致我追溯问题都很难。"
5. 重复审查："现在审查很多时候会进行很多次，规定只进行一次，但是往往会忘掉，总是追求'没有findings'或因为状态或快照变了，又要重新审查，太浪费时间和token了。"
6. 调研先行："请把这些文件和问题都仔细调研分析，看看审查流程到底是什么问题，应该怎样的修复？"（附四份根因分析文档：workflowhub-review-process-root-cause-analysis-20260905.md / PaperBuilder-T08审查流程根因调研.md / t09-review-process-root-cause-analysis.md / workflowhub-m17-review-process-root-cause-analysis-20260905.md）
7. 流程约束："请按标准 WorkflowHub 开始这个任务吧，先创建worktree，然后从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求。先基于原始需求，在make-decision的过程中和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项。注意主会话上下文控制和子代理派发。Talk 和grill请用大白话说明选项、后果和风险。"
8. 范围指正（talk R2/Q4 用户答复）："请检查'/Users/Hugh/Hugh/Project/workflowhub-workflowhub-close-readiness-governance-20260906/specs/workflowhub-close-readiness-governance-20260906'任务的内容，里面对审查次数已经进行了重新设计吧，应该等待这个任务做完，合并进来比较合适。我们当前的任务就不用再重复开发这个逻辑了。"

## 已确认方向（talk/grill 收敛摘要，详见 decision-log.md T 表/G 表/D 表）

- 废除 wh_review.profiles/priority，provider 定义单一事实源=3rd-review config；路由顺序=列表顺序（T-001/D-001）。
- preflight 秒级快速失败（静态必败边界、白名单错误码、blocked_before_dispatch；T-002/D-002）。
- 每次审查调用强制落盘（四类状态；拦截/复用/裸跑 sink/幂等去重；T-003/T-006/G-002/G-004/D-003）。
- schema 宽读严写（priority optional、terminal_status+blocked/reused、dispatch_state；D-004）。
- 存量记录一次性失效接受（G-001/D-005）；E2E 取路由第一个 provider（G-003/D-006）。
- 重审/预算逻辑归 close-readiness（T-004/D-007）；只改 workflowhub 侧（T-005/D-008）。