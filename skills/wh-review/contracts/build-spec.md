# Build Spec 审查合同

provider 只能审查冻结材料，不得访问真实仓库、运行 Git 或读取宿主绝对路径。

## 必需材料

- `review-instructions.md`：stage、审查问题和输出格式。
- 原始用户需求。
- 已批准决策。
- 待审 spec，至少包含范围、非目标和验收标准。
- 可选的 `context_map` / `evidence_map` 优化；提供时仅交付 map 明确选择的现有接口、约束或复用点片段。本阶段不得默认附带 diff 或完整当前文件，maps 缺失仍须调用 provider。
- 与本次审查有关的 reviewer 技能文件；UI scope 才包含 UI reviewer 技能。
- `manifest.json`：列出 provider 可见的每个文件及其 byte size、SHA-256，并据此计算 `material_id`。

如果这是已有 `pass` 基线后的增量审查，当前必需材料仍由 runner 完整校验，
每次审查都完整交付当前材料；材料变化后重新调用会产生新的不可变 attempt，
不读取上一轮结果，也不生成增量材料或增量审查范围。

`context_map` 和 `evidence_map` 是可选优化。提供时每张 map 都必须有
`state: complete|unknown`、简短 `summary` 和逐项 `entries`（`id`、`subject`、
`rationale`、`disposition`）；map-level `unknown` 必须同时说明 `unknown_reason`，不能
伪装成完整上下文。`complete` entry 必须有可验证 anchors（id、snapshot path、行区间、
role、reason）；`not_applicable` 或 `unknown` entry 必须有受限 `reason_code` 和理由，
不能用自由文本 `not_needed_reason` 绕过 anchor。runner 仅交付 complete anchor 的片段，
不按目录或文件全文扩张材料。缺失 maps 不返回 `MATERIAL_INCOMPLETE`，也不阻止
provider 调用。

缺少任一必需材料时，本次 attempt 返回 `unavailable`，并写入
`quality/reviews/attempts/*` 作为不可变质量事实；它没有 findings，也不能写成
“没有问题”。补齐后重新调用会产生新的质量事实。可选材料不存在时，
`review-instructions.md` 必须说明未提供及原因。

首轮 findings 是质量事实，不是 stage gate。主 agent 应直接修复；普通修复不做二审。
外置审计记录若存在，缺失或不能验证时明确为
`unverified`，不得声称已修复或通过。材料变化后的新 attempt 仍完整交付当前材料。
若修改方向、验收、接口、schema、状态、安全、并发、拓扑、phase 顺序或测试策略，
新 attempt 的事实只供改进，不循环也不阻断 stage 推进。

每个 canonical/reportable finding（包括普通和严重）都必须有一个 disposition：`fixed`、
`rejected_invalid`、`accepted_risk` 或 `needs_human`；没有可绑定 ledger 时显示
`unverified`。`accepted_risk` 必须绑定当前 finding、review、snapshot 和真实用户风险确认。
严重 finding 额外决定是否暂停正式完成，普通 finding 不能因此被丢掉。这描述处理事实，
不把 provider findings 转成“审查通过”。

## 处置边界

build-spec 只消费可信异源 advice，不要求 provider `pass` 或 findings=[]。无最终文本、timeout、路径/协议错误、坏 JSON 和其他 transport failure 只能记录为 `unavailable`/`incomplete`，不能变成空 findings 或通过。普通规格修复不自动追求二审；只有被审主题真实变化且确需新意见时才产生新的普通 attempt，记录性材料变化不强制重审。

## 审查重点

- 每项原始需求和批准决策是否进入 spec。
- 已批准决策是否先分成 locked、unresolved 和 newly discovered ambiguity；locked 内容、顺序、选项和推荐是否原样保留且未被重问。
- 每次 clarification 是否只处理一个决策轴，并按依赖顺序处理多个轴；是否只针对 unresolved 或 new ambiguity。
- 所有候选项与 locked 决定冲突时，是否返回上游矛盾而不是展示假选项；上游已有选项和推荐时是否保持单轴保真。
- 成功、失败和边界场景是否清楚。
- 验收是否客观、可判断。
- 范围、非目标、状态和接口责任是否一致。
- 是否伪造来源，或未经批准扩大、缩减范围。
- `simplicity-guard` 和 `plan-ceo-review` 是同一 wh-review packet 内的可选 advisory
  lens。它们以只读技能文件随 packet 提供，provider 在同一 findings 中报告具体问题；
  不单独调用、不生成 `*-facts`、invocation receipt、dispatcher 或独立 runtime。
  lens 缺失只记录为材料事实，不阻止同 task 继续工作。
- 发现上述内容实质扩大实现或维护面时，报告具体删除或缩减 finding，不得以补充更多
  要求、通用框架或未来兼容层代替删除。

审查顺序固定为：需求覆盖 → 完整用户旅程和状态 → 失败/恢复/幂等边界 → 可打破的验收
断言 → 范围和长期维护成本。重点是找“做完以后仍然不能交付”的缺口，例如成功路径能
走通但重试会重复写入、失败后无法恢复、AC 只能看文件存在而不能证明行为。不要把 packet
格式、快照或 receipt 本身当成质量目标；它们只有在遮住上述语义时才报告。

## 输出

输出遵循 `provider-protocol.md` 的最小 reviewer JSON：只包含 `findings`。不要求 checklist、summary、verdict、skillResults、bundle hash、finding 生命周期或模型回显材料 hash。
