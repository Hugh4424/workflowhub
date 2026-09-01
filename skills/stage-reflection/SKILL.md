---
name: stage-reflection
description: 会话内、非阻断的阶段末过程复盘；输出带证据的判断，不生成质量裁决。
version: 1.0.0
---

# stage-reflection

## 目的与边界

本技能只回答“本阶段哪些 step/skill 值得保留、优化、简化或继续取证”。输出是
judgment layer，不是 fact layer：`judgment != fact`。不得写 `facts.jsonl`、质量分数、
grade、quality verdict、release/acceptance 结论，也不阻断 stage、repair 或 close。

触发条件是当前 stage 已有 step 序列结束后，由当前主会话执行一次。不得另起子代理，
不得读取完整 transcript，不读四份材料全文（`decision-log.md`、`spec.md`、`plan.md`、
`tasks.md`）；只消费当前会话已经保留的记忆和当前 stage 的窄投影。

## 输入（只读、三来源）

1. 当前 session memory：本次会话实际发生的判断、阻塞、修复、等待、用户回复和失败；
2. lessons 索引：`<storageRoot>/Projects/<proj>/lessons/` 下当前 stage JSONL，保留
   raw/merged 的原文与引用，不把旧 lesson 当作当前事实；
3. current stage step/skill outcome：当前 stage 的 `step_outcomes`、`skill_outcomes`、
   失败/未启动/超时摘要、`human-confirmation.v3` 的确认记录以及
   `derive-consumption-edges.mjs` 的派生结果。

输入缺失必须保留 `unknown`，不能用编号、文件存在、默认成功或历史任务补全。冷启动
允许 `evidence_refs: []`，但对应判断的 `confidence` 不能是 `high`。

复盘可被 M16 候选池消费的扫描证明必须使用
`consumer-scan-proof.v1`，明确 `project/task_id/expected_stage_set/scanned_at/scope_revision`
和 `coverage_status`；`partial`、`unknown`、`unavailable`、`stale` 均不得推导零消费。

## 机器前奏与顺序

主 runner 在调用本技能前，先无条件调用
`tools/cli/append-lesson-observation.mjs`。这是零 AI 成本的 raw_observation 前奏，
与主会话是否真正启动技能无关；技能超时、未启动或失败时，raw 仍必须已经落盘。
技能自身不重复追加 raw observation。

随后按顺序执行：

1. 调用 `tools/cli/derive-consumption-edges.mjs`，把后续 step 的 `input_refs` 与
   前置 step 的 `evidence_refs` 解析为当前任务消费边；单个无引用、未登记、缺记录或历史
   不可见时是 `unknown`，不是零消费、不是 unused。只有派生结果另有完整全阶段
   `consumer_scan.zero_consumption_proof` 时，机器 remove 门槛才可使用零消费事实；
2. 用三来源输入形成判断，输出 `quality/stage-reflection/<stage>.json`，结构必须
   符合 `runtime/schemas/stage-reflection.v1.json`；
3. 输出落盘后调用 `tools/cli/validate-stage-reflection.mjs`。它读取 outcome、
   confirmation 与派生结果，可把不满足硬信号的 `remove_candidate` 改为
   `needs_evidence`，把悬空引用的 confidence 降为非 high，并把 status 降为
   `degraded`；CLI 以原子方式把确定性降级结果回写到同一复盘文件，核验结果才是本次复盘终态。

## 输出判断

每条 judgment 必须包含 `subject_id`、`subject_kind`、classification、severity、reason、真实
`evidence_refs`、confidence 和 `next_review_trigger`。`subject_id` 是 step_slug 或 skill name，
`subject_kind` 只能是 `step` 或 `skill`。classification 只能是：

`keep|optimize|simplify|merge|remove_candidate|add|needs_evidence`

`remove_candidate` 不是删除命令。只有机器核验同时证明“30 天内零消费”与“人工
rejected 或同一 `step_slug` 的人工介入至少 2 次”时才保留；任一信号缺失、消费
unknown 或证据过期，都只能是 `needs_evidence`。LLM 不能自行把 unknown 当 zero。

`severity` 和 `confidence` 只表示这条判断的严重性与把握，不是分数或质量等级。
高 confidence 必须有至少一条可解析、绑定当前 task/stage 的 evidence ref；证据空或
悬空时由 validator 强制降级。

## intervention 归因

从 `human-confirmation.v3` 读取用户真实 `reply_text` 与 `step_slug`，并保留
`confirmation_ref`、`attribution`、`confidence`。v1/v2 没有这两个字段时，输出
`reply_text=null` 且 confidence 非 high；独立 authorize 没有前置 v3 时也走同样
降级，不能猜用户意图。confirmation 仍是事实来源，不能由本技能重写。

## lessons 生命周期

机器 raw 前奏只追加 `raw_observation`。复盘成功且 validator 通过后，才可按
`entry_id` 去重合并为 `merged_lesson`，保留 `occurrence_count`、`source_refs`、
`supersedes`，并把被合并 raw 行的 `merged` 置为 true。`status:failed`、超时、技能
未启动或 validator 不可用时，不合并 lessons、不写 merged 行；原始失败事实留在当前
stage outcome 和 raw JSONL。

## 失败与缺失语义

- 复盘执行失败：仍落 `status:failed`，`error.summary` 非空；runner 的
  `blocking:false` 使它不翻转 stage 状态、不阻断 close。
- 部分输入缺失：落 `status:degraded`，每个缺失维度写成 `unknown`，不要伪造结论。
- validator 失败：保留输入事实与错误摘要，不能把失败改称 `ok`；必要时只落
  degraded/failed 复盘记录。
- 任何 unavailable、failed、degraded、unknown 都必须在页面和下游交接中保持原样。

每次输出都明确“这是 judgment，不是 fact”，并把可以复核的证据 ref 放进判断条目。
页面或聚合器只能消费该文件和 lessons 索引，不能从它反推出质量通过或产品发布。
