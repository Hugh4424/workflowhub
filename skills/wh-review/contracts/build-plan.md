# Build Plan 审查合同

provider 只能审查冻结材料，不得访问真实仓库、运行 Git 或读取宿主绝对路径。

## 必需材料

- `review-instructions.md`：stage、审查问题和输出格式。
- 已批准 spec 和验收标准。
- 待审 plan，至少包含 phase、任务、依赖和验证方式。
- 与 plan 一一对应的 `draft_tasks`；它是独立冻结材料，审查任务拆分、依赖和验收能否真正执行。
- 仅由 `context_map` 明确选择的模块边界、依赖、接口或测试约定片段；本阶段不得默认附带 diff 或完整当前文件。
- 与本次审查有关的 reviewer 技能文件。
- `manifest.json`：列出 provider 可见的每个文件及其 byte size、SHA-256，并据此计算 `material_id`。

如果这是已有 `pass` 基线后的增量审查，当前必需材料仍由 runner 完整校验，
但 provider packet 只放 `review_delta`、审查指令和其中列出的变更内容；未变化
材料已由基线覆盖，不重复放入或审查。

`wh_review.v2` 路由还必须给出 `context_map` 和 `evidence_map`。每张 map 都有
`state: complete|unknown`、简短 `summary` 和逐项 `entries`（`id`、`subject`、
`rationale`、`disposition`）；map-level `unknown` 必须同时说明 `unknown_reason`，不能伪装成完整上下文。
`complete` 条目必须有可验证 anchors（id、snapshot path、行区间、role、reason）；
`not_applicable` 或 `unknown` 条目必须给出受限 `reason_code` 和理由，不能用自由文本
`not_needed_reason` 绕过锚点；runner 仅交付 complete anchor 的片段，不按目录或文件全文
扩张材料。

缺少任一必需材料时，本次 attempt 返回 `unavailable`，并以已认证 attempt action
留在当前 review flow；它没有语义 verdict，也不能写成“审查通过”。补齐后可在同一
flow 重跑。可选材料不存在时，`review-instructions.md` 必须说明未提供及原因。

首轮 `revise_required` 是质量事实，不是 stage pass gate。主 agent 应直接修复；普通
修复不做二审。可选 response ledger 仅写外置审计记录，缺失或不能验证时明确为
`unverified`，不得声称已修复或通过。已有 `pass` 基线后若新增或修改材料，runner
生成 `review_delta`，只审查新增内容及其直接影响，不重新审查未变化内容。无法安全
生成 delta 时才回退一次完整初始审查。若修改方向、验收、接口、schema、状态、安全、
并发、拓扑、phase 顺序或测试策略，增量审查仍须覆盖受影响的直接关系；第二轮 finding
同样只供改进，不循环也不阻断 stage 推进。`accepted_risk` 仅记录，必须在本阶段的
人类确认摘要中显式展示。

人类审查卡按 finding 显示一个 disposition：`fixed`、`rejected_invalid`、
`accepted_risk`；没有可绑定 ledger 时显示 `unverified`。这描述处理事实，不把
provider verdict 转成“审查通过”。

审查结果用于暴露问题和记录处置；阶段是否推进由正式 stage contract 与证据决定。

## 审查重点

- 每项需求是否落到具体任务和可判断的验证。
- phase、依赖和生产者/消费者顺序是否可执行。
- 接口、状态、失败路径、并发和回退是否遗漏。
- 验证是否能在行为错误时失败，而不是只检查文件存在。
- 是否引入 spec 未要求的抽象、兼容层或范围。
- 必须用 `simplicity-guard` 对每个新增模块、入口、状态、迁移和发布机制执行
  P0-P3；优先删除、直接复用或手术式改造。
- scope creep、重复已有能力、没有故障证据的长期能力，或修订后仍无理由保留
  的旧内容，实质扩大实现或维护面时必须 `revise_required`。

## 输出

输出遵循 `provider-protocol.md` 的最小 reviewer JSON：`verdict`、`summary`、`findings`。不要求 checklist、pass items、skillResults、bundle hash、finding 生命周期或模型回显材料 hash。
