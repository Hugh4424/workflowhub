---
user_decision: true
rebuild_note: 本文件为 2026-07-06 补写重建，因原 make-decision 阶段 S10 落盘校验缺失导致原文件未生成，内容整理自 issue ZHI-93 评论记录
---

# decision-log — wh-review-rebuild

---

## 1. 原始需求（原文）

> 来源：issue ZHI-93 背景描述 + S4 台账渲染（原始需求逐条存档已落盘于 tasks/wh-review-rebuild/research/internal-research-summary.md）

**任务名称**：wh-review-rebuild

**原始需求核心描述**（verbatim，来自任务发起背景）：

1. 当前 workflowhub 的 5 个 stage（make-decision / build-spec / build-plan / build-code / verify-code）在调用 3rd-review 时路由机制存在问题，原始设计意图是：每个 stage 走各自专属合同（11 份），实际效果退回通用合同，导致审查质量退化。
2. 3rd-review 当前设计耦合了 stage 感知、轮次管理、降级逻辑等 workflowhub 专属概念，导致其可复用性差、维护成本高。
3. 需求要求：将审查引擎整体重设计为两层架构——3rd-review 做纯引擎，workflowhub 专属调度逻辑抽出来建一个新的 wh-review 层。
4. 本任务不修旧 bug，只做重设计。验收标准由原需求给出，要求新 wh-review + 瘦身 3rd-review 组合能在 workflowhub 里端到端跑通。

**S1 调研补充发现**（已在 ZHI-93 评论中与用户确认）：2026-07-04 的提交（e96c257）已补上 `--checkpoint=<stage>` 参数，路由理论上已能正确生效。用户确认：不影响，继续重设计。

---

## 2. 问题与目标

**核心问题**：3rd-review 当前把引擎能力和 workflowhub 专属调度逻辑耦合在一起，导致：
- 维护边界不清晰，stage 专属合同管理困难
- 轮次状态、降级机制、Delta Package 构造等逻辑无处安放
- 其他场景无法复用 3rd-review 引擎

**明确目标**：
1. 将 3rd-review 重构为纯引擎层：输入 `{mode, contract, materials}`，输出 `{verdict, findings, actual_mode}`，不感知 stage / 轮次概念，可被任何调用方使用。
2. 新建 wh-review，作为 workflowhub 专属调度层：负责 stage→合同映射、轮次状态、降级/升级逻辑、Delta Package 构造、报告渲染。
3. 两者组合后在 workflowhub 5 个 stage 的审查流程里端到端可用。

---

## 3. 决策记录

### D1 — 两层架构方向

| 字段 | 内容 |
|---|---|
| 决策 | 采用两层架构：3rd-review 瘦身为纯引擎 + 新建 wh-review 专属调度层 |
| 来源证据 | ZHI-93 comment 38de51de（S4 方向草案）+ comment 625680c5（用户确认"继续重设计"）|
| 分类 | 原文要求 |
| 状态 | 接受 |

**3rd-review 瘦身后接口**：
- 输入：`{mode, contract, materials}`
- 输出：`{verdict, findings, actual_mode}`
- 不知道 stage / 轮次 / workflowhub 专属概念

**wh-review 新建职责**：
- stage → 合同映射（5 组：make-decision→intake / build-spec→design / build-plan→plan / build-code→code / verify-code→test-acceptance）
- 5 套专属合同（从 agenthub 的 verifiers/vibecoding 搬过来再补强）
- 轮次状态管理
- 降级/升级逻辑
- Delta Package 构造
- 报告渲染（报告6章结构，脚本渲染）

---

### D2 — stage→合同映射（5 组）

| 字段 | 内容 |
|---|---|
| 决策 | 5 个 stage 分别映射到对应合同类型 |
| 来源证据 | ZHI-93 comment 38de51de（S4 方向草案，mapping 列出）|
| 分类 | 衍生 |
| 状态 | 接受 |

| stage | 合同类型 |
|---|---|
| make-decision | intake |
| build-spec | design |
| build-plan | plan |
| build-code | code |
| verify-code | test-acceptance |

**D2 补充**（来自 grill 环节，comment ea507a20）：
- 只有 build-spec 和 build-code 审查通过（pass）后自动推进到下一个 stage
- 其余 3 个 stage（make-decision / build-plan / verify-code）审查完成后需人工确认后才推进
- 来源证据：ZHI-93 comment e4f27f16（用户明确："审查通过（pass）能自动推进到下一个 stage 只有 build-spec 和 build-code"）

---

### D3 — 降级机制

| 字段 | 内容 |
|---|---|
| 决策 | 采用三级降级/升级规则 |
| 来源证据 | ZHI-93 comment 38de51de（S4 方向草案）|
| 分类 | 原文要求 |
| 状态 | 接受 |

具体规则：
1. **第 1 轮**：必须全量异源（heterologous）审查
2. **第 2 轮起**：可用增量 Delta Package 降级
3. **异源上限**：最多 3 轮，到顶强制转同源（same-source）；同源结果在报告里显式标 `actual_mode=same-source`，留人工复核口子
4. **升级人工触发条件**：连续 3 轮出现大量 blocking 意见，或同一个问题反复出现

---

### D4 — 裁决结果枚举

| 字段 | 内容 |
|---|---|
| 决策 | 裁决结果只有三种枚举值 |
| 来源证据 | ZHI-93 comment 38de51de（S4 方向草案）|
| 分类 | 原文要求 |
| 状态 | 接受 |

三种裁决：
- `pass`：通过
- `revise_required`：打回重做
- `escalate_to_human`：转人工处理

---

### D5 — 报告结构

| 字段 | 内容 |
|---|---|
| 决策 | 审查报告采用 6 章结构，脚本渲染 |
| 来源证据 | ZHI-93 comment 38de51de（S4 方向草案）|
| 分类 | 衍生 |
| 状态 | 接受 |

报告 6 章结构（由 wh-review 负责渲染，模板脚本化）。具体章节内容在 build-spec 阶段详细设计。

---

### D6 — 统一收尾模板

| 字段 | 内容 |
|---|---|
| 决策 | 5 个 stage 统一收尾模板使用 docs/human-brief-template.md，已核实现状满足要求 |
| 来源证据 | ZHI-93 comment ea507a20（grill 环节，用户与 agent 对话确认）|
| 分类 | 衍生 |
| 状态 | 接受 |

备注：收尾类型分派规则（哪些 stage 自动推进、哪些需人工确认）已写入 D2 补充，避免被误读为文档不一致。

---

### D7 — 验收标准补充

| 字段 | 内容 |
|---|---|
| 决策 | 验收标准增加一条：测试方案必须能验证新 wh-review + 瘦身 3rd-review 组合端到端可用 |
| 来源证据 | ZHI-93 comment ea507a20（grill 最终确认）|
| 分类 | 新增 |
| 状态 | 接受 |

---

## 4. 假设

1. 3rd-review 现有代码可以被重构而无需完全重写（make-decision 阶段不对实现方式做硬性约束，留给 build-code 阶段判断）。
2. agenthub 的 verifiers/vibecoding 目录下已有可用的合同基础，wh-review 直接搬过来再补强即可。
3. e96c257 提交已修复 checkpoint 路由问题，本任务不再以"修复路由"为目标，而是以架构重设计为目标。
4. 5 个 stage 的 SKILL.md 更新和测试方案编写属于 build-plan / build-code 阶段的工作，不在本阶段（make-decision）输出。

---

## 5. 明确不做

| 排除项 | 理由 |
|---|---|
| 修旧 bug（包括 checkpoint 路由问题） | 原始需求明确声明"本任务不修旧 bug，只做重设计" |
| 外部调研（S3 跳过） | 用户明确指示"不用再查外部资料，直接进入下一步收拢方向"，记 s3_skipped(user_decision) |
| 更新 5 stage SKILL.md | 属于 build-plan / build-code 阶段工作，make-decision 阶段只出决策日志 |
| 编写测试方案 | 同上，后续阶段落地 |
| 扩展至 workflowhub 5 个 stage 以外的其他场景 | 超出本任务范围 |

---

## 6. 开放问题

本阶段已通过充分 grill 环节，用户于 ZHI-93 最终评论中明确批准（"继续"）。当前无未决开放问题。

以下事项在 build-spec / build-code 阶段需要进一步明确：
- 报告 6 章结构的具体章节内容和模板细节
- wh-review 与 3rd-review 的代码边界（接口契约）
- Delta Package 的具体构造方式
- 测试方案的覆盖范围

---

## 7. 验收标准

来源：原始需求 + D7 补充

1. 3rd-review 重构后作为纯引擎可用：输入 `{mode, contract, materials}`，输出 `{verdict, findings, actual_mode}`，不包含任何 stage / workflowhub 专属逻辑。
2. 新建 wh-review 实现 5 个 stage→合同映射、轮次状态管理、三级降级/升级规则、Delta Package 构造、报告渲染。
3. 裁决结果严格为三种枚举值：`pass` / `revise_required` / `escalate_to_human`。
4. 降级规则正确执行：第 1 轮全量异源；第 2 轮起可降级；异源不超过 3 轮；same-source 报告有显式标注。
5. build-spec 和 build-code 两个 stage 审查 pass 后能自动推进；其余 3 个 stage 需人工确认后推进。
6. 测试方案能验证新 wh-review + 瘦身 3rd-review 组合在 workflowhub 里端到端可用。

---

## 执行环境（S10 记录）

| 环境变量 | 状态 |
|---|---|
| WORKFLOWHUB_TASK_DIR | 本次补写重建，使用 config/workflowhub.yaml task_dir 字段（/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/） |
| MAKE_DECISION_SKIP_DEBATE | 本次执行中 S5 盲审两次 escalate_to_human，用户拍板按 A 跳过（s5_blind_review_skipped） |
| MAKE_DECISION_SKIP_BLIND_REVIEW | 未设置（原执行中尝试执行，非环境变量跳过） |
| MAKE_DECISION_DEBATE_PATH | 未检测到使用，debate 未触发 |
| THIRD_REVIEW_RUNNER | 未检测到覆盖 |
| REVIEW_DISPATCH_CONFIG | 未检测到设置 |

降级事件：S5 盲审两次均 escalate_to_human，第二次确认为结构性问题（原始需求本身包含方案描述），用户确认跳过（journal: s5_blind_review_skipped）。S3 外部调研用户决策跳过（journal: s3_skipped: user_decision）。
