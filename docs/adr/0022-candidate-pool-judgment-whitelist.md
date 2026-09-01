# ADR 0022：M16 候选池 —— 判断白名单修订、两档分层与迭代简报

## 状态

Draft（workflowhub-m16-evolution-20260831 make-decision 阶段，待用户确认后 Accepted）

## 背景

roadmap 原版 M16（自进化候选池+迭代入口+负例库）的候选池 schema 白名单只允许
机器事实字段（pattern/frequency/severity/...refs），"不设自由文本方案字段"。
stage-reflection（ADR 0021）落地后，M16 的主要输入变成了**判断层记录**
（`quality/stage-reflection/<stage>.json` 的 judgments/interventions/lessons），
而不是 M15 遥测事实。若候选池仍只收机器事实，则"哪些 step/skill 该优化"这一用户
核心问题将失去主要数据源；若原样放开，则判断可能被当作事实消费，或聚合结果被
自评偏袒污染。m15-retirement 已退役遥测链，上游真实验证（stage-reflection AC-001）
仍为 deferred，因此候选池还必须诚实区分"机器信号"与"仅判断"。

## 决策

- **候选池条目允许引用判断层**，但必须原样保留 `record_kind=judgment`、
  `confidence`、`evidence_refs` 并存档来源（任务×stage×subject）；这是对 roadmap
  D31 白名单的**显式修订**，不是给判断脱敏。自由文本方案字段仍禁止（不产生"把 X
  改成 Y"）。
- **候选身份与生命周期**：每条候选带 `candidate_id`、`schema_version`、
  `observed_at`、`status`（open/verified/rejected/superseded）、`supersedes`、
  来源聚合引用；去重与陈旧规则（30 天窗口内同一 subject×classification 聚合并
  刷新 recent_seen；陈旧且无新证据的候选标注 stale）。杜绝长期聚合漂移。
- **两档分层**：机器信号强（零消费边、同 subject 重复介入≥2、机器门槛阈值命中）=
  建议行动档；仅判断=仅供参考档。页面与简报必须展示分层与 `judgment≠fact` 标注。
- **迭代简报**：`iteration-brief.md` 由模板+候选池/负例库/改动台账/外部 skill 检查
  渲染（零 AI 装配，不靠 LLM 现编方案）；"市场对照"预留槽位，实际调研按需由人
  触发；简报内容只给事实与证据引用，不改法。
- **消融与台账**：本期交付消融协议+`attempted-edits.jsonl`（必含
  decision_id/changed_surface/before|after_facts_ref/validation_method/revert_ref）
  与`negative-results.jsonl`（与 D24 eval 分域）；**remove 最终裁决权明确延期**，
  remove_candidate 在候选池标"待裁决"，不产生任何删除动作。
- **前期质量税**：作为口径定义+诚实聚合视图产出（后期人工介入按 interventions
  attribution/step_slug 归因上游 stage）；样本不足显示 insufficient_samples，
  不用因果结论伪装观测。
- 完成判据（用户拍板）：确定性测试+独立审查完成即结束；"step/skill 必要性"与
  "人工介入减少"本期标注【未验证，待真实任务数据】。

## 后果（trade-off）

- 优点：候选池直接消费判断层，回答用户"哪些 step/skill 该优化/该删"；机器信号
  与判断分层，读者一眼区分"值得动手"与"仅供参考"；改动全程可追溯
  （decision_id）；零 AI 聚合成本。
- 代价与风险：判断层自评偏袒仍在（两档+机器信号优先缓解，最终由消融定案）；
  上游真实验证未完成 → 候选/简报/质量税均带"待验证"状态（诚实标注，不装结论）；
  页面投影器为共享产物，改动需保持 stage-reflection 既有视图不变。
- 不违反"指标不当 gate"：候选池与简报不阻断任何推进；不违反 D30：判断永不写入
  机器事实通道。

## 三项判据

- 难以反转：是。D31 白名单修订改变 roadmap 治理边界与候选池 schema，后续任务
  普遍消费；如需回退须再走决策修订。
- 无背景会意外：是。只读候选池 schema 会看到"允许判断"而不知道这是对原白名单的
  显式修订与两档分层。
- 存在真实取舍：是。实用价值（判断入池）→ 换取白名单纯度放宽；机器信号强
  → 换取对自评偏袒的约束；零 AI 聚合 → 换取不能实时/深度归因。

## 关联

- 上游：ADR 0021（判断层）；roadmap M16（白名单被修订项 D31）；stage-reflection
  DEFER-001/002（候选池与消融裁决权交接）。
- 术语登记：CONTEXT.md 候选池/迭代简报/负例库/改动台账/消融实验/前期质量税。
