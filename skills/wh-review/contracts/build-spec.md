# Build Spec 审查合同

provider 只能审查冻结材料，不得访问真实仓库、运行 Git 或读取宿主绝对路径。

## 必需材料

- `review-instructions.md`：stage、审查问题和输出格式。
- 原始用户需求。
- 已批准决策。
- 待审 spec，至少包含范围、非目标和验收标准。
- 仅由 `context_map` 明确选择的现有接口、约束或复用点片段；本阶段不得默认附带 diff 或完整当前文件。
- 与本次审查有关的 reviewer 技能文件；UI scope 才包含 UI reviewer 技能。
- `manifest.json`：列出 provider 可见的每个文件及其 byte size、SHA-256，并据此计算 `material_id`。

如果这是已有 `pass` 基线后的增量审查，当前必需材料仍由 runner 完整校验，
但 provider packet 只放 `review_delta`、审查指令和其中列出的变更内容；未变化
材料已由基线覆盖，不重复放入或审查。

`wh_review.v2` 路由还必须给出 `context_map` 和 `evidence_map`。每张 map 都有
`state: complete|unknown`、简短 `summary` 和逐项 `entries`（`id`、`subject`、
`rationale`、`disposition`）；map-level `unknown` 必须同时说明 `unknown_reason`，不能
伪装成完整上下文。`complete` entry 必须有可验证 anchors（id、snapshot path、行区间、
role、reason）；`not_applicable` 或 `unknown` entry 必须有受限 `reason_code` 和理由，
不能用自由文本 `not_needed_reason` 绕过 anchor。runner 仅交付 complete anchor 的片段，
不按目录或文件全文扩张材料。

缺少任一必需材料时，本次 attempt 返回 `unavailable`，并以已认证 attempt action
留在当前 review flow；它没有语义 verdict，也不能写成“审查通过”。补齐后可在同一
flow 重跑。可选材料不存在时，`review-instructions.md` 必须说明未提供及原因。

首轮 `revise_required` 是质量事实，不是 stage pass gate。主 agent 应直接修复；普通
修复不做二审。可选 response ledger 仅写外置审计记录，缺失或不能验证时明确为
`unverified`，不得声称已修复或通过。已有 `pass` 基线后若新增或修改材料，runner
生成 `review_delta`，只审查新增内容及其直接影响，不重新审查未变化内容。无法安全
生成 delta 时才回退一次完整初始审查。若修改方向、验收、接口、schema、状态、安全、
并发、拓扑、phase 顺序或测试策略，增量审查仍须覆盖受影响的直接关系；第二轮 finding
同样只供改进，不循环也不阻断 stage 推进。

人类审查卡按 finding 显示一个 disposition：`fixed`、`rejected_invalid`、
`accepted_risk`；没有可绑定 ledger 时显示 `unverified`。这描述处理事实，不把
provider verdict 转成“审查通过”。

## 审查重点

- 每项原始需求和批准决策是否进入 spec。
- 已批准决策是否先分成 locked、unresolved 和 newly discovered ambiguity；locked 内容、顺序、选项和推荐是否原样保留且未被重问。
- 每次 clarification 是否只处理一个决策轴，并按依赖顺序处理多个轴；是否只针对 unresolved 或 new ambiguity。
- 所有候选项与 locked 决定冲突时，是否返回上游矛盾而不是展示假选项；上游已有选项和推荐时是否保持单轴保真。
- 成功、失败和边界场景是否清楚。
- 验收是否客观、可判断。
- 范围、非目标、状态和接口责任是否一致。
- 是否伪造来源，或未经批准扩大、缩减范围。
- `simplicity-guard`、`plan-ceo-review` 和条件 UI `plan-design-review` 已在
  build-spec 的 wh-review 之前由 stage-owned dispatcher 执行；本次 provider
  只读取这些 invocation facts 和冻结 spec，不重复调用或重复计数。若事实缺失，
  报材料/调用事实缺口，不自行补做 lens。
- 发现上述内容实质扩大实现或维护面时必须 `revise_required`，不得以补充更多
  要求、通用框架或未来兼容层代替删除。

## 输出

输出遵循 `provider-protocol.md` 的最小 reviewer JSON：`verdict`、`summary`、`findings`。不要求 checklist、pass items、skillResults、bundle hash、finding 生命周期或模型回显材料 hash。
