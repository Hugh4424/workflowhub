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

## 第二轮需求（R-011，2026-09-06 用户追加）

11. "好的，基于调研出的这些问题，我们先回到make-decision阶段，看看是否需要新增一些改进需求，避免以后build-spec和build-plan继续浪费时间做决策收敛的工作，让build-spec和build-plan能更高效的基于冻结的decision-log进行规格和计划设计。这次调研发现的问题，我们都在make-decision中想办法解决或设计新的需求，在当前任务中实现！"
12. （Talk R1 确认答复，T-025~T-031）：范围=全部纳入当前任务；决策冻结=强制前置校验+回退；findings=分类+强制路由；needs_human=只能作为暂停态；review=一次初始+一次focused；usage=轻量记录无预算机制；跨阶段=统一协议，但用户明确担忧"回退重跑整阶段太浪费"→ 确认=增量决策+局部继续（方向级缺口：问用户1个问题→追加1条D→重新冻结→从受影响节继续；已确认部分不重跑不重写）。

## 本次 build-spec 复盘事实（第二轮调研依据）

- build-spec 阶段 wall≈5.3 小时（13:35-18:52），纯审查约 76 分钟；review 执行约 16 次（≥48 provider 调用），findings 18→13→17→11→10→12→12→10→12→5→5→4 不收敛；2 次 broker TIMEOUT、1 次 0 字节空输出、多轮 kimi RATE_LIMITED、多轮 antigravity 空 findings 桩。
- 根因：①上游 decision-log 批准状态不唯一（头部 awaiting vs 正文 accepted）；②方向级/规格级问题在 review 才暴露，build-spec 自己"翻译中做决策"；③needs_human 被当处置终点；④无 review 预算/收敛规则；⑤completed provider usage=null，无法回答"浪费在哪"。
- 相关事实来源：任务 store quality/reviews、quality/evidence/stage-outcomes、spec.md 当前 141KB/24 FR/24 AC。
