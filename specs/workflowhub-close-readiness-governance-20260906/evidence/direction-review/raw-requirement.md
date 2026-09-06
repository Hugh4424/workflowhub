# Raw Requirement — workflowhub-close-readiness-governance-20260906

任务：WorkflowHub 收口治理改造（诊断 + 聚焦改造）

## 用户原始需求（原话摘录）

1. "我最近在执行 workflowhub 任务的时候，发现这些任务执行到最后都有一些问题，verify-code时会发现一大堆问题导致任务无法继续，最终只能进行风险close"
2. "请检查这些任务的过程以及'/Users/Hugh/Downloads/workflowhub-m17-missing-stage-close-analysis-20260905.md'的总结文件，帮我看看workflowhub是出了什么问题？"
3. "请按标准 WorkflowHub 开始这个任务吧，先创建worktree，然后从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求"
4. "先基于原始需求，在make-decision的过程中和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项"
5. "Talk 请用大白话说明选项、后果和风险；decision-log 记录原始需求、关键事实、选择、理由和延期交接"
6. "1：我们之前一起做了'...workflowhub-requirement-convergence-depth-20260905'任务，把make-decision阶段做了很强的更新升级，请你基于当前make-decision的执行情况，帮我看看这个任务实现的效果如何？"（问题1，R-007）
7. "2：之前在 PB｜T12｜只读复盘与统计 与 WH-需求收敛强化 等任务时，make-decision阶段还算可以控制，可是到了build-spec和build-plan阶段缺花费了大量的时间和token，一个任务的spec和plan阶段要花费好几亿token，请你帮我看看为什么会这样？应该如何优化？是不是也可以进行类似make-decision一样的上下文管理和子代理派发优化？"（问题2，R-008）
8. "3：我目前的workflowhub流程主要靠make-decision阶段把需求彻底确定，然后靠着高智力模型在build-spec和build-plan阶段设计详细的执行方案，后面build-code和verify-code阶段派出智力一般的模型来执行。一次来提高token效率和节约成本，请帮我看看目前这个思路执行的效果如何？"（问题3，R-009；后续澄清：真实含义=审计 decision-log/spec/plan/tasks 是否足够清晰专业详细，足够后面 build-code 和 verify-code 使用低智力模型也能保证交付质量，不是记录各 stage 模型使用）
9. "请基于上述三个问题帮我仔细分析，可以从make-decision第一步开始，重新收敛一些新需求，放在当前任务的里一起开发"（R-010）
10. "先质量后效率，另外我希望这些新需求也能按照make-decision的步骤从talk到审查到grill都完整进行一遍，保证这些需求能和之前的verify-code质量问题保持一样的质量"（R-010 流程要求）

## 关键背景：总结文件与核查结论（以核查为准）

- 总结文件（Downloads/workflowhub-m17-missing-stage-close-analysis-20260905.md，作者=上一任务）诊断 8 类根因（完成/质量两套判定逻辑、同一缺口五层重复投影、前置阶段 advisory 延迟暴露、build-plan 只查静态验收卡、最终 aggregate 太晚、verify-code 命名易误解、内部协议在错误边界失败、证据归档与 current-fact 选择断裂），并推荐改造方案 A-G 与实施顺序。
- 本任务独立只读核查 4 个真实任务（workflowhub-requirement-convergence-depth-20260905、workflowhub-m17-repo-skills-multicli-20260903、make-decision-requirement-convergence-20260828、paperbuilder-v2-t09-pause-resume-checkpoint），结论：
  - 框架性根因成立：同一缺口多文本投影（同文件 2 次/M17 跨 3 文件 1-6 次）；存在逐投影 current selector 但无唯一结构化 gap 源与稳定 gap_id；确认事实与缺口判定断裂（任务1 有 2 份 human-confirmation 仍被投影 missing）；桥接入口无 agent_run_id===attempt_id 校验；测试收据写入边界不绑当前快照；总结文件局部断言（333 个 fact、E2E dispatch 前失败、blocked 标记、任务1"风险 close"表述）与 task store 不符。
  - 任务1 实为标准 close（用户确认"执行 standard close，接受 quality incomplete"），M17 为 manual-risk-close(delivered_with_risk)。

## 硬约束

- 宪法：公共入口仅七类（doctor/status/run/review/verify/confirm/authorize）；禁新 store、持久 selector 对象、compatibility bridge、第二状态机、历史 runtime branch、第五材料；质量裁决独立来源；记录事实不阻断推进；简单优先可证伪；推进/不可逆操作经人确认。
- 本任务不修改历史任务记录；不做页面/前端 UI；不改宪法 close 三义。
