---
schema: "workflowhub-stage-handoff.v1"
task: "workflowhub-thin-core-card-07-20260919"
stage: "make-decision"
snapshot_tree: "b39f34baca116d036c52fdf42f914810a7ae66e3"
material_scope_revision: "revision-6794a460813661b2eecae4024ad5c4a7156bcd31333dfadb5bd311020904e39b"
reflection_status: "degraded"
authority: non_authoritative
retention: current_only
source_refs: [{"ref":"decision-log.md","sha256":"0244f20e2e4da85c65684ca4867377aa344b9db8e99bc4011471265daeacfd94"}]
---

> 非权威 current handoff，只以四材料和正式质量原件为准

## 1. 任务身份
- task: `workflowhub-thin-core-card-07-20260919`
- stage: `make-decision`
- reflection: `degraded`

## 2. 背景与目标
- 核心需求（摘录 `decision-log.md`）：
  - 把 make-decision 从「弱化版的记录工具」改成**有顺序、有节奏的头脑风暴流程**：先问清你的原始痛点 → 外部与内部调研（**当发散引擎用**）→ 发散 → 异源方向审查 → **再**和你谈大纲定方向 → 逐模块收口；并且**只把「重要 / 方向 / 模糊」三类问题拿来问你**，普通问题 agent 自己定、只说明所用的假设。
- 只摘录关键行、不复制材料全文；权威仍以四份当前材料为准。

## 3. 当前阶段与进度
- stage status: `completed`
- reflection status: `degraded`
- execution: 当前阶段由 WorkflowHub 当前会话直接执行；本次未使用外部 stage outcome。
- observation: make-decision 14 步全部执行；28 条决策获用户最终确认；4 轮配置 provider 异源审查（108 findings / 20 blocking）全部逐条处置；两个官方解析器非预期错误 0。详见 research/closeout-brief.md。

## 4. 重要决策
- D-001 用现有拓扑跑本卡（新拓扑尚未实现）· D-003 不回写母 PRD（main 零提交）· D-010 只定 decision-log 的「结构差异」
- D-002 官方 direction 审查前移到与用户谈大纲之前（与 manifest 顺序有偏差，已登记）· D-008 审查一律走项目配置 provider
- D-009 大纲=可证伪假设 · D-011 发散=先定角度再填 + origin 差集 + G-4 · D-013 开头不严进（最小入口 + agent 分析）
- D-015 调研=高级发散引擎（结论用大白话表格 + 标推荐/不推荐）· D-016 收敛=所需项齐备 + 只有重要/方向/模糊三类找用户
- D-018 复用现有校验器接生产路径（不新增第四套）· D-019 本卡承接旧机器物理删除 · D-021 台账只覆盖「会变成需求与验收」的部分
- D-023 分母=已知范围全量 + 明标「不是穷尽」· D-024~D-026 揭示协议 / 角度提供者 / 选项空间送审 · D-028 主会话执行模型（机制归 CARD-03）

## 5. 核心方案
- 用户明令的「分级提问」（只有重要/方向/模糊三类找用户）显著减少了交互轮次，且与外部调研「过度澄清是可测失效模式」的证据一致。
- 官方解析器（analyzeDecisionOutline / analyzeDecisionConvergence）+ 独立的阶段末语义检查，确实抓出了人读会漏掉的成对互斥。

## 6. 踩过的坑
- interaction aggregate 按 D-019 纳入删除面，本卡不产出该绑定；make-decision 的完成事实改由「逐字答复 + 4 轮审查 + 用户确认」承载，机器级批准校验能力缺失（承接 card-02 的 R-92）。
- 与 CARD-04 的 make-decision 写面冻结、card-02 新结构的生效时点尚未确定，二者都是 build-plan 前（不晚于 build-code）的强制前置。

## 7. 重要参考调研
- 当前正式来源指针：`decision-log.md#0244f20e2e4da85c65684ca4867377aa344b9db8e99bc4011471265daeacfd94`

## 8. 关键事实与数据状态
- current snapshot/material binding：`decision-log.md#0244f20e2e4da85c65684ca4867377aa344b9db8e99bc4011471265daeacfd94`

## 9. 成功与失败边界
- 成功：只表示本阶段或本 hook 的实际记录已写入。
- 失败、unavailable、unknown 和 stale 不得改写为完成。

## 10. 未决项与风险
- 未闭合 9 条（owner/trigger 见 decision-log 的未闭合项节）：79 条逐条处置 · 三个前置冻结 · G12 · G13 · G11 · G17 · G20 · OI-007 可执行细则 · 原子台账成本实测
- **D-009 部分失效**：5 个可证伪问题被证伪 4 条（80%，已过半），按规则应强制废弃重画，实际只做了逐条修正；其交付物 research/outline-r0.md 迟至阶段末才补建
- **结构性发现**：本卡材料反复出现「同一材料两处互斥、机器零报警」（与历史「收敛假绿」同型）；解析器对全部冲突零报警
- 与 CARD-04 的写面冻结、card-02 新结构生效时点未定 —— build-plan 前（不晚于 build-code）必须完成

## 11. 下一步动作
- 进入 build-spec（现有阶段；新拓扑尚未实现，本卡不能用自己的交付物跑自己）。消费 decision-log 的 核心需求/核心目标/已选方向/唯一 OI 大纲/三档结论/原始需求覆盖矩阵/承接与不承接清单。起草后必须跑一次独立一致性检查（不能只跑解析器）。

## 12. 待读文件清单
- `decision-log.md`
- `spec.md`
- `plan.md`
- `tasks.md`

## 13. 可自行判断与必须问用户的边界
- 可以自行判断：读取当前文件、正式原件和本 handoff 的指针。
- 必须问用户：产品方向、不可逆交付授权和超出当前材料的范围变化。
