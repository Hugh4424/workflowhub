---
name: stage-reflection
description: 会话内、非阻断的阶段末过程复盘；输出带证据的结构化判断，不生成质量裁决。
version: 1.0.0
---

# stage-reflection

## 目的与边界

本技能在当前正式 stage 的步骤结束时由当前主会话执行一次。它回答：哪些
step/skill 帮助了工作、需要改进、造成阻塞、引发人工介入、应该简化，以及现在
就能简化什么。输出是 judgment layer，永远 `judgment != fact`；它不是质量分数、
grade、质量 verdict、release/acceptance 结论，也不阻断 stage、repair 或 close。

复盘不改变五阶段拓扑，不增加 stage，不启动第二个 Agent，也不创建新的状态机。
它只准备 judgment JSON，再交给现有公共 `run` 行为的 `reflect` action 做机器闭环。
当前 checkout 若尚未提供该 route，要如实记录 unavailable，并等待 P2 的 route 实现；
不要用私有脚本替代公共入口。

## 输入：三个只读来源

只消费当前会话已经保留的最小事实，不读取完整 transcript，也不读四份材料全文
（`decision-log.md`、`spec.md`、`plan.md`、`tasks.md`）。三个来源是：

1. **当前 session memory**：本次会话真实发生的判断、阻塞、修复、等待、用户回复和失败；
2. **lessons/** 索引：`<storageRoot>/Projects/<proj>/lessons/` 下当前 stage 的 JSONL，
   保留 raw/merged 原文和引用；旧 lesson 是背景，不是当前事实；
3. **current stage step/skill outcome**：当前 stage 的 `step_outcomes`、`skill_outcomes`、
   失败/未启动/超时摘要和 `human-confirmation.v3` 确认事实。

输入缺失必须显式保留 `unknown`，不能用编号、文件存在、默认成功或历史任务补全。
冷启动允许 `evidence_refs: []`，但相应判断的 `confidence` 不能是 `high`。

## 六个结构化区块

判断 JSON 必须携带下列六个区块。每个区块使用当前 v2 schema 的形状：

```json
{
  "state": "observed | none_observed | unknown",
  "unknown_reason": "仅 state=unknown 时必填",
  "items": [
    {
      "summary": "一条可复核的简短判断",
      "evidence_refs": ["quality/evidence/<真实文件>.json"],
      "confidence": "high | medium | low"
    }
  ]
}
```

- `what_helped`：哪些 step/skill 或做法实际帮助了本阶段；
- `what_to_improve`：哪些 step/skill 需要改变，以及改变什么；
- `blockers`：哪里阻塞、等待或导致失败；
- `intervention_reasons`：用户为什么纠正、补充、停止或重定向；
- `what_to_simplify`：哪些步骤、技能或交接可以更简单；
- `simplifiable_now`：不需新决定、现在即可安全简化的事项。

`state=none_observed` 表示已经检查过且没有观察到该类事实，不等于没读到输入；
`state=unknown` 必须带非空 `unknown_reason`，说明缺了什么以及为什么不能判断。
当前 `structured_block` schema 没有把 `not_applicable` 作为第三种区块 state，因此
不要发明 `state=not_applicable`。确实不适用时，在区块 `items` 中写出带原因的
`not_applicable` 摘要；能使用该枚举的事实栏（例如 `status_matrix`）则使用
`state=not_applicable` 并绑定证据。这样“不适用”可见，且不被伪装成 observed、
none_observed 或 unknown。

每个 item 都写真实 `evidence_refs` 和 `confidence`。证据引用必须是当前 task/stage
可复核的安全引用；引用不存在时不能补猜。`confidence` 表示这条判断的把握，不是
分数或质量等级。判断条目仍必须有 `subject_id`、`subject_kind`、
`classification`、`severity`、`reason`、`evidence_refs`、`confidence` 和
`next_review_trigger`；`subject_kind` 只能是 `step` 或 `skill`，classification 只能是
`keep|optimize|simplify|merge|remove_candidate|add|needs_evidence`。

## 事实投影与判断输入

优先输出 `runtime/schemas/stage-reflection.v2.json`；v1
`runtime/schemas/stage-reflection.v1.json` 仍可读以兼容旧记录。v2 judgment JSON
还携带三件套：

- `status_matrix`：`code`、`verify`、`physical_close`、`acceptance`、`release` 五栏；
  每栏是 `state`（`completed|failed|not_applicable|unknown`）和 `evidence_refs`。
  它只记录状态事实，禁止从它推导质量结论；
- `identity`：`task_id`、`worktree`、`branch`、`attempt`、`snapshot_tree`、
  `material_revision` 的当前快照；
- `source_completeness`：`compaction`、`truncation`、`visible_scope` 和
  `unknown_reasons`。看不到、压缩或截断时如实写 `unknown` 及原因。

顶层 `stage_status`、`status`、`error`、`judgments`、`interventions`、`lessons_added`
也必须符合 schema。`status:failed` 要有非空 `error.summary`；部分可验证输入导致
`status:degraded`。机器事实由机器前奏填充，主会话不把判断写入 `facts.jsonl`，
也不把 `ok` 猜出来。

## 人工介入归因

从 `human-confirmation.v3` 读取用户真实 `reply_text` 和 `step_slug`，保留
`confirmation_ref`、`attribution`、`confidence`。没有 v3 事实时必须写
`reply_text=null`，且 confidence 只能是 medium 或 low；不能猜用户意图，也不能重写
confirmation 事实。`intervention_reasons` 区块仍要明确是 observed、none_observed，
还是带理由的 unknown/not_applicable。

## 阶段末公共入口与机器顺序

主会话先按上面的输入和六个区块产出 judgment JSON，然后调用唯一的公共阶段末入口：

```sh
run --action=reflect
```

这不是另一个 public behavior，也不是新命令类别；JSON 是本次 route 的判断输入。
机器负责 raw 前奏、schema/完整性校验、教训合并和 immutable 发布；主会话负责判断
内容。复盘失败或 unavailable 是非阻断事实，不翻转 stage 状态，不阻断 close。

### validator 的真实消费边行为

主会话不直接派生消费边。`tools/cli/validate-stage-reflection.mjs` 在
`validateReflectionValue` 内部调用 `deriveConsumptionEdges`（实现位于
`tools/cli/derive-consumption-edges.mjs`），再按当前 project/task 取边。消费边的实际
规则是：较早 subject 的 `output_refs` 只有在较晚 subject 的 `input_refs` 中出现同一
引用时才形成 edge；每个 output 还保留 `consumer_count` 和
`consumption_status`。

- validator 扫描五个 stage 的当前 stage-outcome 文件；所有 stage 文件有效且每个声明
  output 都存在时，`consumer_scan.status=complete`、`coverage_status=complete`，并可
  产生 `zero_consumption_proof`；
- 任一 stage outcome 缺失/损坏，或 output 文件缺失时，扫描是 partial/unknown，
  `zero_consumption_proof` 为 false。单个 output 没找到后续输入边时也标
  `consumption_status=unknown`，不能称为零消费；
- 只有完整扫描证明、近 30 天内有已登记 output 且每个 consumer count 都是 0 时，
  `remove_candidate` 才可能通过消费信号；还必须有人工 rejected 或同一 step 的至少
  两次人工介入，否则 validator 改成 `needs_evidence`。LLM 不能把 unknown 当 zero；
- 缺失 judgment 证据引用会记录 missing ref、把 high confidence 降为 medium，并把
  终态降为 `status:degraded`；缺失 confirmation 的 intervention 会回写
  `reply_text=null` 和非 high confidence。v2 缺少六区块或三件套时，validator 产生
  显式 completeness annotation，不替会话生成内容。

因此，技能只描述并引用 validator 的派生结果，不重复调用
`derive-consumption-edges.mjs`，不声称“没有找到边”就是 unused，也不手工写
`consumer_scan` 的零消费证明。

## lessons 生命周期与失败语义

机器 raw 前奏使用 `append-lesson-observation.mjs` 追加 `raw_observation`；技能不重复
追加。只有判断经 validator 通过并完成发布后，机器才按 `entry_id` 去重合并为
`merged_lesson`，保留 `occurrence_count`、`source_refs` 和 `supersedes`，并把对应 raw
行标记 merged。`status:failed`、超时、技能未启动或 validator unavailable 时不合并
lessons；原始失败事实留在 stage outcome 和 raw JSONL。

同字节提交应保持幂等，异字节 immutable 路径冲突必须明确失败且不覆盖。无执行器或未
调度时使用真实 `unavailable`/`not_scheduled` 事实，不写假失败判断；这些状态不产生
judgments、interventions 或 lessons。任何 unavailable、failed、degraded、unknown 和
not_applicable 都必须在交接和下游消费中原样可见。

## 完成检查

在交接前逐项确认：

1. 六个区块都出现，且每个区块状态明确；
2. 每个 observed 判断和 judgment 都有真实 evidence refs 与 confidence；
3. unknown 有 `unknown_reason`，not_applicable 有明确文字/原因，不能静默留空；
4. v2 三件套的状态、身份和来源完整性只记录事实，不推导质量结论；
5. 已准备 judgment JSON，并尝试公共 `run --action=reflect`；route 不可用时如实交接
   dependency，不调用替代私有命令；
6. 机器 validator 的 annotations、missing refs、消费边 coverage 和最终 status 被
   原样接受，不把它们改写为通过。

本技能只交接判断、证据引用和真实机器结果；页面或 M16 只能消费已发布记录与 lessons
索引，不能从 judgment 反推出质量通过或产品发布。
