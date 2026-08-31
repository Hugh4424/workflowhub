# ADR 0021：stage-reflection 过程观察层 —— 会话内判断、事实分层、机器信号定门槛

## 状态

Accepted — 2026-08-30（workflowhub-stage-reflection-20260830 make-decision 阶段）

## 背景

M15 监控链（per-provider transcript 遥测、token/耗时采集、看板投影）被 m15-retirement
任务退役后，用户需要一种轻量机制生产"每个 stage 该往哪优化"的证据：哪些 step/skill
对流程有帮助、哪里能简化、历史的坑是否重犯、人工为什么介入。市面方法（消融基线、
流程挖掘、消费图、Agent-as-a-Judge）的共同结论是：机器硬信号做预筛、因果实验做定案、
LLM 只做辅助归因；但完整消融成本高，不能常驻每 stage。

## 决策

- 新增 stage 级 `stage-reflection` 步骤：在 authoring stage 结束时由当前执行会话
  自动运行（框架 manifest 声明 step + skill outcome 通道），不做独立子代理、不读
  transcript 全文、不读四份材料全文。
- 输出是**判断层**而不是**事实层**：写 `quality/stage-reflection/<stage>.json`，
  每条判断必须带证据引用与置信度，身份标注为 judgment；不得混入 facts.jsonl
  （守 D30：关键事实禁止 LLM 推断）。
- 判断分类六类：keep / optimize / simplify / merge / remove_candidate / add。
  `remove_candidate` 只有机器硬信号支持时才允许出现（零消费边 + 人工否定/重复介入），
  纯 LLM 直觉只能标记 needs_evidence；删与不删的最终裁决权留在未来 M16 消融实验
  与人工复核，复盘器只产出候选与证据包。
- 人工介入原文采集：升级 human-confirmation 记录（新增 reply_text + stage/step
  锚点），单一写入源，不双写。
- 产出消费链：由现有 stage outcome 的 input_refs/evidence_refs 派生消费边
  （纯脚本，零新增埋点）；无引用时判 unknown，不判"无用"。
- 全局教训索引 `<storageRoot>/Projects/<proj>/lessons/`：机器无条件追加原始观察，
  复盘成功后才合并去重写回（失败只留 failed 记录，不污染索引）；冷启动不预填历史。
- M15 页面保留（m15-retirement 保留其页面与投影逻辑），本任务只换数据源：
  任务视图（各 stage 判断摘要）+ overall pending 视图（按频次×严重度排序，
  带来源任务 ref）→ 作为未来 M16 数据输入。
- 自审边界：本机制是**过程观察**，不是质量裁决；质量裁决仍归 review/verify
  （independent context）。自评偏差由"remove 机器门槛 + M16 消融定案"兜底。

## 后果（trade-off）

- 优点：每 stage 一次轻量 LLM 判断即可覆盖"值得提升/历史坑/可简化/必要性候选"；
  数据分层清晰（事实层零 AI 成本、判断层带证据）；页面与 M16 共享同一数据源。
- 代价与风险：自评偏差保留（由 machine gate + 消融兜底）；判断质量依赖会话记忆
  完整性（无 transcript 回看，可能漏记）；冷启动阶段多数信号为 unknown，只能
  产出低置信候选（如实标注，不装结论）。
- 不违反"指标不当 gate"：复盘器失败/缺失只落 status 记录，不阻断 stage/close。
- 不违反"禁止自审自判"：判断层不是质量裁决；remove 裁决权在人工与消融实验；
  判断文件明确标注 judgment 非 fact。

## 三项判据

- 难以反转：否。stage-reflection 步骤可从 manifest 移除；confirmation 升级向后
  兼容旧记录；lessons 索引可重建。
- 无背景会意外：是。stage 结束自动多一次 LLM 判断、confirmation 记录升级，若无
  本 ADR，只看代码会不知道"为什么会话内自评、为什么 remove 有门槛"。
- 存在真实取舍：是。成本（每 stage 一次判断）→ 换取每 stage 优化证据；自评偏差
  → 换取零独立子代理成本；判断层而非事实层 → 换 D30 合规。

## 关联

- 取代/接替：ADR 0012（task-local monitoring，M15 采集链）已由 m15-retirement
  退役，本 ADR 记录替代它的判断层机制，不双写两套监控。
