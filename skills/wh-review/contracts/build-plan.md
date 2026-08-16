# Build Plan 审查合同

provider 只能审查冻结材料，不得访问真实仓库、运行 Git 或读取宿主绝对路径。

## 必需材料

- `review-instructions.md`：stage、审查问题和输出格式。
- 已批准 spec 和验收标准。
- 待审 plan，至少包含 phase、任务、依赖和验证方式。
- 与 plan 一一对应的 `draft_tasks`；它是独立冻结材料，审查任务拆分、依赖和验收能否真正执行。
- 可选的 `context_map` / `evidence_map` 优化；提供时仅交付 map 明确选择的模块边界、依赖、接口或测试约定片段。本阶段不得默认附带 diff 或完整当前文件，maps 缺失仍须调用 provider。
- 与本次审查有关的 reviewer 技能文件。
- `manifest.json`：列出 provider 可见的每个文件及其 byte size、SHA-256，并据此计算 `material_id`。

如果这是已有 `pass` 基线后的增量审查，当前必需材料仍由 runner 完整校验，
每次审查都完整交付当前材料；材料变化后重新调用会产生新的不可变 attempt，
不读取上一轮结果，也不生成增量材料或增量审查范围。

`context_map` 和 `evidence_map` 是可选优化。提供时每张 map 都必须有
`state: complete|unknown`、简短 `summary` 和逐项 `entries`（`id`、`subject`、
`rationale`、`disposition`）；map-level `unknown` 必须同时说明 `unknown_reason`，不能伪装成完整上下文。
`complete` 条目必须有可验证 anchors（id、snapshot path、行区间、role、reason）；
`not_applicable` 或 `unknown` 条目必须给出受限 `reason_code` 和理由，不能用自由文本
`not_needed_reason` 绕过锚点；runner 仅交付 complete anchor 的片段，不按目录或文件全文
扩张材料。缺失 maps 不返回 `MATERIAL_INCOMPLETE`，也不阻止 provider 调用。

缺少任一必需材料时，本次 attempt 返回 `unavailable`，并写入
`quality/reviews/attempts/*` 作为不可变质量事实；它没有 findings，也不能写成
“没有问题”。补齐后重新调用会产生新的质量事实。可选材料不存在时，
`review-instructions.md` 必须说明未提供及原因。

首轮 findings 是质量事实，不是 stage gate。主 agent 应直接修复；普通修复不做二审。
外置审计记录若存在，缺失或不能验证时明确为
`unverified`，不得声称已修复或通过。材料变化后的新 attempt 仍完整交付当前材料。
若修改方向、验收、接口、schema、状态、安全、并发、拓扑、phase 顺序或测试策略，
新 attempt 的事实只供改进，不循环也不阻断 stage 推进。`accepted_risk` 仅记录，必须
在本阶段的人类确认摘要中显式展示。

每个 canonical/reportable finding（包括普通和严重）都必须有一个 disposition：`fixed`、
`rejected_invalid`、`accepted_risk` 或 `needs_human`；没有可绑定 ledger 时显示
`unverified`。`accepted_risk` 必须绑定当前 finding、review、snapshot 和真实用户风险确认。
严重 finding 额外决定是否暂停正式完成，普通 finding 不能因此被丢掉。这描述处理事实，
不把 provider findings 转成“审查通过”。

审查结果用于暴露问题和记录处置；阶段是否推进由正式 stage contract 与证据决定。

## 处置边界

build-plan 只消费可信异源 advice，不要求 provider `pass` 或 findings=[]。无最终文本、timeout、路径/协议错误、坏 JSON 和其他 transport failure 只能记录为 `unavailable`/`incomplete`，不能变成空 findings 或通过。普通计划修复不自动追求二审；记录性 decision-log、plan、tasks 或 receipt 变化不强制重审，除非被审主题真实变化并且确需新意见。

## 审查重点

- 每项需求是否落到具体任务和可判断的验证。
- phase、依赖和生产者/消费者顺序是否可执行。
- 接口、状态、失败路径、并发和回退是否遗漏。
- 验证是否能在行为错误时失败，而不是只检查文件存在。
- 是否引入 spec 未要求的抽象、兼容层或范围。
- `simplicity-guard` 在适用时作为同一 wh-review packet 内的 advisory lens。它不单独
  调用、不生成 `*-facts`、invocation receipt、dispatcher 或独立 runtime；lens 缺失只记录
  为事实，不成为继续工作的前置条件。
- scope creep、重复已有能力、没有故障证据的长期能力，或修订后仍无理由保留的旧内容，
  报告具体删除或缩减 finding。

审查顺序固定为：任务是否形成“需求 → 实现 → 真实消费者 → 验证”的因果链 → 依赖和
顺序 → 接口/数据/状态的交接 → 失败、回滚和重试 → 是否真的需要新增能力。重点找计划
无法落地、验证测不到行为、漏掉直接消费者、顺序导致半成品可被使用，以及为了审查或
证据治理新增控制面的情况。不要因为任务卡字段、snapshot lineage 或流程痕迹不够漂亮
而消耗审查预算。

## 输出

输出遵循 `provider-protocol.md` 的最小 reviewer JSON：只包含 `findings`。不要求 checklist、summary、verdict、skillResults、bundle hash、finding 生命周期或模型回显材料 hash。
