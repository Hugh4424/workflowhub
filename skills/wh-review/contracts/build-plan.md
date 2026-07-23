# Build Plan 审查合同

provider 只能审查冻结材料，不得访问真实仓库、运行 Git 或读取宿主绝对路径。

## 必需材料

- `review-instructions.md`：stage、审查问题和输出格式。
- 已批准 spec 和验收标准。
- 待审 plan，至少包含 phase、任务、依赖和验证方式。
- 仅由 `context_map` 明确选择的模块边界、依赖、接口或测试约定片段；本阶段不得默认附带 diff 或完整当前文件。
- 与本次审查有关的 reviewer 技能文件。
- `manifest.json`：列出 provider 可见的每个文件及其 byte size、SHA-256，并据此计算 `material_id`。

`wh_review.v2` 路由还必须给出 `context_map` 和 `evidence_map`。每张 map 都有
`state: complete|unknown`、简短 `summary` 和逐项 `entries`（`id`、`subject`、
`rationale`）；`unknown` 必须同时说明 `unknown_reason`，不能伪装成完整上下文。`context_map` 的
每个 `complete` 条目必须有可验证 anchors（id、snapshot path、行区间、role、reason）；
runner 仅交付这些片段，不按目录或文件全文扩张材料。

缺少任一必需材料时，本次 attempt 返回 `unavailable`。补齐后直接重跑，不创建或修复永久 flow。可选材料不存在时，`review-instructions.md` 必须说明未提供及原因。

首轮 `revise_required` 是质量事实，不是 stage pass gate。主 agent 应直接修复；普通
修复不做二审。可选 response ledger 仅写外置审计记录，缺失或不能验证时明确为
`unverified`，不得声称已修复或通过。若修改方向、验收、接口、schema、状态、安全、
并发、拓扑、phase 顺序或测试策略时，才最多再做一次首轮高强度完整审查；第二轮 finding
同样只供改进，不循环也不阻断 stage 推进。`accepted_risk` 仅记录，必须在本阶段的
人类确认摘要中显式展示。

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
