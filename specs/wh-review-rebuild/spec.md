# 功能规格：wh-review-rebuild — 异源审查两层架构重设计

**功能名**: `wh-review-rebuild`
**来源**: 上游 decision-log `wh-review-rebuild/decision-log.md`
**状态**: 草稿（spec-specify 初稿）
**spec-ladder 档位**: C 档（大改动：新引入 wh-review 组件、跨 3rd-review/workflowhub 5 stage 系统边界、破坏性重构 §7）

---

## 速读卡（30 秒看懂这个需求）

- **一句话需求**：将 workflowhub 的异源审查机制重设计为两层架构——3rd-review 瘦身为纯审查引擎、wh-review 新建为 workflowhub 专属调度层——解决审查完成状态不可追踪、报告未生成、stage 专属合同从未被路由的根本缺陷。
- **核心改动点**：
  1. 新建 `skills/wh-review/` 模块：拥有 stage→合同映射（5 套）、轮次状态、降级/升级逻辑、Delta Package 构造、报告渲染
  2. 精简 `skills/3rd-review/`：剥离所有 stage/轮次知识，只保留"收入参→调度审查 agent→返回结果"核心引擎
  3. 5 个 stage 的 SKILL.md 收尾步骤统一调用 `docs/human-brief-template.md`（D6）
  4. 现有 `§7`（3rd-review SKILL.md 中的流程步骤段）改写为仅对 `§13` 的概念性导读，删除所有 numbered step 和 if/else 逻辑
  5. 搬迁 agenthub `verifiers/vibecoding/` 的 5 套 stage 专属合同到 wh-review，本期一次性完整搬迁落地（架构支持未来新增合同，但不稀释本期 5 套全部完成的验收口径）
- **最大影响面**：`skills/3rd-review/SKILL.md`（破坏性重构）+ `skills/wh-review/`（全新）+ 5 个 stage SKILL.md 收尾段
- **验收信号**：各 stage 触发 wh-review 时传入正确 stage 标识，stage 专属合同被加载（日志可验证）；§7 不含任何 numbered step / if/else 逻辑（机器可检验）；审查轮次状态与报告均落盘任务目录

---

## 1. 问题陈述

当前：workflowhub 5 个 stage（make-decision / build-spec / build-plan / build-code / verify-code）触发异源审查时，均使用单一 `skills/3rd-review` 技能，且调用时未传递 stage 标识（`--checkpoint`）。

问题：
- **stage 专属合同从未被路由**：3rd-review 靠 `--checkpoint=<stage>` 前缀匹配路由到专属合同，标识缺失导致匹配失败、回退通用合同；`verifiers/vibecoding/` 下已实现的 11 份 stage 专属合同在 workflowhub 中从未被使用。
- **审查完成状态不可追踪**：无轮次状态管理，无法判断审查是否完成、完成了几轮。
- **审查报告基本未生成**：agenthub 中已实现的报告渲染机制（render-review-report.mjs）未迁移至 workflowhub，退化为一次性通用输出。
- **分轮全量/增量、成本降级、升级人工机制全部丢失**：迁移时遗漏，3rd-review 在 workflowhub 中退化为一次性通用审查。

> 来源原文：decision-log §1 背景（2026-07-05）。注：`--checkpoint` 路由缺失问题已于 commit e96c257 修复，本需求不修旧 bug，直接重设计。

---

## 2. 背景、目标和边界

### 背景

workflowhub 是一套多阶段 AI 工作流编排系统，包含 5 个核心 stage。每个 stage 都需要异源审查来保证质量。现有 3rd-review 技能源自 agenthub，迁移时丢失了关键机制，导致审查质量保障实际失效。

本期在已有 worktree（分支：`workflowhub/wh-review-rebuild`）中完成改动，不新建 worktree。

### 目标

1. 建立 wh-review（workflowhub 专属）：负责 stage→合同映射、轮次状态、降级/升级、Delta Package 构造、报告渲染。
2. 精简 3rd-review（全局通用）：去除所有 stage/轮次知识，仅保留纯审查引擎接口——输入 `{mode, contract, materials}`，返回 `{verdict, findings, actual_mode}`。
3. 使审查完成状态可追踪、审查报告可落盘、stage 专属合同被正确路由。
4. 5 个 stage 收尾步骤统一（D6），避免各自为政。

### 边界

**In-scope**：
- 新建 `skills/wh-review/` 技能模块（SKILL.md + 5 套专属合同 + 报告模板 + 渲染脚本）
- 精简 `skills/3rd-review/SKILL.md`（删除 stage/轮次知识，保留纯引擎）
- 改写 3rd-review §7：删除 numbered step / if/else，仅保留对 §13 的概念性导读
- 5 个 stage SKILL.md 收尾步骤统一调用 `docs/human-brief-template.md`
- stage→合同映射实现：make-decision←intake / build-spec←design / build-plan←plan / build-code←code / verify-code←test-acceptance
- 搬迁 agenthub verifiers/vibecoding 5 套 stage 专属合同（5 套均在本期交付，搬迁后初版质量可能偏弱需适配，适配点在 build-plan 阶段确认——见 Known Gaps；来源：decision-log D1）
- 审查降级机制：第1轮全量 → 第2轮起增量+降级 → 异源最多3轮 → 连续3轮 blocking 或指纹重复 → 升级人工
- 裁决枚举：pass / revise_required / escalate_to_human
- 报告渲染：移植 render-review-report.mjs，6章结构，落盘任务目录
- make-decision 专属合同须覆盖 intake 判据 C1-C6
- verify-code 专属合同须覆盖新鲜性判据 F1-F6
- D2 人工确认门：make-decision / build-plan / verify-code 的 pass 路径触发人工确认，不自动推进
- build-spec / build-code 的 pass 路径可自动推进

**Out-of-scope**：
- 修复旧 `--checkpoint` 路由缺失 bug（已于 commit e96c257 修复，不在本期范围）
- 新增非 workflowhub 系统的审查支持
- 修改 agenthub 侧的任何文件
- 3rd-review 以外的其他共享技能改动
- UI/可视化界面
- 实时通知或推送机制

---

## 3. 用户角色与场景

### 角色

- **stage agent**：运行 workflowhub 某个 stage（make-decision / build-spec / build-plan / build-code / verify-code）的 AI agent，需要在收尾时触发审查。
- **reviewer agent**：由 wh-review 调度、执行异源审查的独立 AI agent（异源保证客观性）。
- **human orchestrator**：在 escalate_to_human 路径或 D2 人工确认门处介入，做最终裁决的人。

### 核心场景

**UC-1 stage 触发审查**
Given stage agent 完成 build-code 的主体工作；
When stage agent 调用 wh-review 并传入 `stage=build-code`；
Then wh-review 加载 `code` 合同，调度 reviewer agent，返回 `{verdict, findings}`，报告落盘任务目录。

**UC-2 审查降级**
Given wh-review 已完成第1轮全量异源审查，verdict=revise_required；
When 触发第2轮审查；
Then wh-review 构造 Delta Package（仅变更部分），以增量模式调用 3rd-review，降低成本。

**UC-3 升级人工**
Given 连续3轮审查出现大量 blocking 或指纹重复 blocking；
When wh-review 检测到升级触发条件；
Then wh-review 裁决 `escalate_to_human`，停止自动推进，通知 human orchestrator。

**UC-4 D2 人工确认门**
Given wh-review 对 make-decision 审查返回 verdict=pass；
When stage agent 准备推进下一 stage；
Then 触发人工确认流程（不自动推进），等待 human orchestrator 明确批准。

**UC-5 stage 专属合同路由**
Given wh-review 被调用时传入 `stage=build-spec`；
When wh-review 进行合同查找；
Then 加载 `design` 合同（而非通用合同），合同路由日志可验证。

**UC-6 3rd-review 作为纯引擎**
Given wh-review 构造好 `{mode, contract, materials}`；
When wh-review 调用 3rd-review；
Then 3rd-review 仅执行环境探测 + 调度 + 返回 `{verdict, findings, actual_mode}`，不感知 stage、轮次。

**UC-7 报告渲染**
Given wh-review 从 3rd-review 收到 findings；
When wh-review 调用 render-review-report.mjs；
Then 生成 6 章结构报告，落盘当前任务目录（路径可查）。

---

## 4. 功能需求（FR）

### FR-WHREVIEW-001 wh-review 技能创建

**描述**：新建 `skills/wh-review/` 模块作为 workflowhub 专属审查调度层。

**落盘路径解析（复用 FR-TASKDIR-001 契约 + 对齐 agenthub 归档规范）**：wh-review 的报告文件与轮次状态文件的根路径解析统一复用 `core/task-dir-parser.mjs`（`parseTaskDir()`），优先级与 FR-TASKDIR-001 一致：`WORKFLOWHUB_TASK_DIR` 环境变量 → `config/workflowhub.yaml` `task_dir` 字段 → 两者均缺失则 fail-loud、非零退出。wh-review 不得自行硬编码任务目录路径，也不得另造一套解析逻辑。

**落盘契约（定死，不再是待定选项）**：
1. **中间产物（非最终交付物）**：3rd-review/standalone.sh 原始产出的 `tasks/{task-name}-{timestamp}-{rand}/reviews/verdict*.json`、`report*.md` 等文件是临时工作区产物，wh-review 读取消费后即完成使命；这些文件不落入 `parseTaskDir()` 解析出的 `task_tracking_root`，不算最终审查记录，wh-review 执行完毕后可清理，不要求提交入库。
2. **最终交付物（唯一权威路径）**：wh-review 必须把从 3rd-review 拿到的 verdict/findings 渲染成 agenthub 风格的扁平命名报告文件，落在 `parseTaskDir()` 解析出的 `task_tracking_root` 下的 `tasks/{task-id}/reports/` 目录（与 agenthub `tasks/{task}/reports/` 结构对齐），禁止嵌套时间戳目录。
3. **命名规则**：报告文件名格式为 `<stage>-review-<round>[-pass|-failed].md`，例如 `build-spec-review-1.md`（未终审）、`build-spec-review-3-pass.md`（通过）、`build-spec-review-2-failed.md`（拒绝）。`<stage>` 取 make-decision/build-spec/build-plan/build-code/verify-code 之一；`<round>` 为当前审查轮次的整数序号，从 1 开始，不跨 stage 复位。
4. **索引文件**：wh-review 必须在 `tasks/{task-id}/reports/report-index.md` 维护一份汇总索引（结构参照 agenthub `verifier-report-index.md`：seq/timestamp/stage/report_kind/verdict/report_path/summary 等列），每次渲染新报告后追加一行，不得覆盖历史记录。

**Given/When/Then**：
- Given 任意 stage agent 发起审查请求（stage 标识已传入）；
- When wh-review 被调用；
- Then wh-review 通过 `core/task-dir-parser.mjs` 解析出 task_tracking_root，完成 stage→合同查找、调用 3rd-review（中间产物落临时工作区）、轮次状态管理、报告渲染（最终产物落 `tasks/{task-id}/reports/`），返回裁决结果。

**验收标准**：
- AC1-1：`skills/wh-review/SKILL.md` 存在且包含 stage→合同映射表（5 条）。
- AC1-2（行为验证）：给定不传 stage 标识的调用，wh-review 以非零退出码终止并输出明确错误信息；给定传入已知 stage 标识的调用，wh-review 正常完成，不报错。两种情况的实际行为可通过集成测试或手动测试复现；断言：前者 exit code ≠ 0，后者 exit code = 0。
- AC1-3（行为验证）：给定一次完整审查调用完成后，最终报告文件落盘路径为 `parseTaskDir()` 解析得到的 `task_tracking_root` 下的 `tasks/{task-id}/reports/`，而非硬编码，也不落在 3rd-review/standalone.sh 的原始时间戳目录；断言：`ls tasks/{task-id}/reports/` 命令返回至少一个报告文件，且文件内容含 `verdict` 字段。
- AC1-4（静态验证）：wh-review 实现代码 import `core/task-dir-parser.mjs` 的 `parseTaskDir`，代码中不存在任务目录路径硬编码字符串或另造的路径解析逻辑；可 grep 验证。
- AC1-5（行为验证，可判定的渲染约束）：给定 wh-review 完成一次渲染后，生成的报告文件名必须匹配正则 `^[a-z-]+-review-\d+(-pass|-failed)?\.md$`；断言：对 `tasks/{task-id}/reports/` 下所有报告文件名运行该正则，全部匹配；同时 `report-index.md` 中存在对应该文件的索引行。

---

### FR-WHREVIEW-002 stage→合同映射（5 套）

**描述**：wh-review 维护 stage→合同的 5 条映射，并搬迁对应合同文件。

映射表：
| stage | 合同 |
|---|---|
| make-decision | intake |
| build-spec | design |
| build-plan | plan |
| build-code | code |
| verify-code | test-acceptance |

**Given/When/Then**：
- Given wh-review 收到 `stage=build-plan`；
- When 进行合同查找；
- Then 加载 `plan` 合同，日志中合同路径可验证。

**验收标准**：
- AC2-1：5 套合同文件均存在于 `skills/wh-review/contracts/`。
- AC2-2：传入任意已知 stage 时，route-decision 记录文件中含所选合同源路径 + hash（或版本锚点），可机器 grep 验证（非通用合同）。
- AC2-3：传入未知 stage 时，fail-loud 而非静默回退。

---

### FR-WHREVIEW-003 审查降级机制

**描述**：wh-review 管理审查轮次与降级逻辑。

**规则**：
- 第1轮：强制全量异源审查
- 第2轮起：构造 Delta Package，以增量模式调用 3rd-review
- 异源审查最多3轮；第4轮起强制转同源
- **升级人工触发条件（精确定义）**：单轮 `blocking_count ≥ 3`，或 `fingerprint_repeated = true`（当轮 blocking 指纹集合与上轮完全相同），且上述条件在**连续3轮**均成立 → 触发 `escalate_to_human`
- **优先级规则**：每轮末先判升级人工条件，满足则直接升级，不再进入下一轮同源切换；不满足升级条件时，再按轮次判断是否转同源。即：第3轮末如满足升级条件，直接升级人工，不进入第4轮；不满足时才进入第4轮同源模式。
- **同源模式终止规则**：同源审查最多3轮（独立计数，不与异源轮次合并）；第4轮起（同源第3轮末）若仍非 pass，强制裁决 `escalate_to_human`，不允许无限循环。同源模式下升级条件与异源相同（单轮 `blocking_count ≥ 3` 或 `fingerprint_repeated=true` 连续3轮成立），但因总轮次上限为3，实际触发时机为：同源第3轮末仍非 pass → 直接升级人工，无需等待3轮连续条件。**此计数由 wh-review 独立维护，不依赖 3rd-review 引擎内部的轮次上限参数（见 GAP-6）。**

**Given/When/Then**：
- Given 第1轮审查已完成，verdict=revise_required；
- When 发起第2轮审查；
- Then wh-review 构造 Delta Package，以 `mode=incremental` 调用 3rd-review。

**验收标准**：
- AC3-1（行为验证）：给定一次完整审查调用结束后，轮次状态文件存在，且 `round_number` 字段为正整数、`mode` 字段取值在 `{full, incremental, same-source}` 三值之内；断言：文件可机器 parse、两字段非空非 null。
- AC3-2（行为验证）：给定第1轮审查 verdict=revise_required 后触发第2轮，Delta Package 文件存在；断言：Delta Package 文件大小 > 0 且不等于第1轮全量材料包大小（即非全量复制）。
- AC3-3（行为验证）：给定模拟连续3轮每轮满足升级条件（`blocking_count ≥ 3` 或 `fingerprint_repeated=true`），wh-review 在第3轮末返回 `escalate_to_human` 并不调用第4轮；断言：轮次状态文件 `round_number` 最终值 ≤ 3，裁决字段 = `escalate_to_human`。
- AC3-4（行为验证）：给定第3轮末升级条件满足，wh-review 裁决为 `escalate_to_human`，不切换同源模式；断言：裁决字段 = `escalate_to_human`，`mode` 字段 ≠ `same-source`（与 AC3-3 可共用同一测试场景）。

---

### FR-WHREVIEW-004 裁决枚举与报告渲染

**描述**：wh-review 的最终裁决仅含三种枚举值，报告由 render-review-report.mjs 渲染后落盘。

裁决枚举：`pass` / `revise_required` / `escalate_to_human`

**Given/When/Then**：
- Given 3rd-review 返回 findings；
- When wh-review 综合轮次与 findings 做裁决；
- Then 裁决值严格为枚举三值之一，报告以6章结构落盘当前任务目录。

**报告章节结构（6章，已定死——章数、顺序、每章语义不可更改；来源：decision-log D1 目标节"报告脚本渲染（移植render-review-report.mjs），6章结构，落盘任务目录"）**：
1. Summary（审查摘要：verdict、轮次、模式）
2. Blocking Issues（blocking 级问题列表，含指纹字段）
3. Minor Issues（minor 级问题列表）
4. Pass Items（通过项列表）
5. Delta（本轮相较上轮的变更说明，第1轮留空）
6. Metadata（task-name、round_number、mode、contract_path、contract_hash、timestamp）

build-plan 阶段核实 agenthub 原实现后，可在不违反本清单结构的前提下调整具体章节措辞（如副标题文案），但章数、顺序、每章语义不可更改。

**验收标准**：
- AC4-1：裁决字段只含三值之一，其他值视为错误。
- AC4-2：报告文件路径可预测（任务目录下固定子路径）。
- AC4-3：报告含上述6章结构（章节名在 wh-review SKILL.md 中明确定义，可机器 grep 验证）。

---

### FR-THIRDREVIEW-001 3rd-review 精简为纯引擎

**描述**：精简 `skills/3rd-review/SKILL.md`，剥离所有 stage/轮次知识，只保留纯审查引擎接口。

**结构化三元组架构（decision-log D1 口径，非"方案A/纯文本审查包"）**：

wh-review 调用 3rd-review 引擎时，须显式传入结构化三元组 `{mode, contract, materials}`：`mode`（full/incremental/same-source）与 `contract`（本次审查依据的合同内容或路径+hash）必须是独立的显式字段，`materials` 字段可以是 wh-review 组装好的完整审查材料包（文本内容），但不得把 `mode`/`contract` 也坍缩进这份纯文本材料、让 3rd-review 失去对本次审查依据合同与模式的路由感知。

3rd-review 引擎不感知 stage 名称、轮次号等 workflowhub 专属知识（零 stage/轮次知识），但通过显式 `contract`/`mode` 字段获知本次依据哪份合同、以何种模式审查，返回 `{verdict, findings, actual_mode}`。

**调用语义契约（decision-log D1 结构化三元组口径）**：

wh-review 在调用 3rd-review 引擎前，须完成以下装配并满足以下约束：

- **输入**：结构化三元组 `{mode, contract, materials}`——`mode`、`contract` 必须作为独立显式字段传入，不得坍缩进纯文本；`materials` 字段可以是 wh-review 组装好的完整审查材料包（文本内容）。
- **禁止传入**：stage 名称或轮次号（如 `--checkpoint=<stage>`）——stage 身份判断与 stage→合同映射须在调用前由 wh-review 完全完成；3rd-review 引擎不做 stage 路由，但仍通过显式 `contract` 字段获知本次审查依据的合同。
- **输出**：3rd-review 引擎须返回结构化裁决 `{verdict, findings, actual_mode}`；以结构化 `verdict` 字段为主权威判定，进程级快速判断为辅；二者不一致时 fail-loud，不静默择一。
- **结果文件缺失处理**：result-file 缺失或不可解析时，视为 `unknown`，触发 `escalate_to_human`。
- **轮次控制**：wh-review 须自行维护轮次计数并强制停止，不依赖 3rd-review 引擎侧的轮次上限参数（已知该参数在引擎内部无效，见 Known Gaps GAP-6）。

**Given/When/Then**：
- Given wh-review 接收到 stage 标识和待审材料；
- When wh-review 读取对应合同文件、将合同源路径 + hash（或版本锚点）写入 route-decision 记录文件，再组装显式的 `mode`、`contract` 字段与 `materials` 材料包，调用 3rd-review 引擎；
- Then 3rd-review 引擎依据显式 `mode`/`contract` 字段与 `materials` 内容完成审查并返回结构化 `{verdict, findings, actual_mode}`，wh-review 以结构化 verdict 字段为准裁决，全程不感知 stage 名称或轮次号。

**验收标准**：
- AC5-1：3rd-review SKILL.md 不含 stage 名称枚举（make-decision / build-spec 等）。
- AC5-2：3rd-review SKILL.md 不含轮次管理逻辑（round/Delta Package 等）。
- AC5-3（行为验证）：给定任意 stage 标识调用 wh-review，wh-review 传给 3rd-review 引擎的调用中显式包含非空 `mode` 与 `contract` 字段（未坍缩进 materials 纯文本），且不含 stage 名称或轮次号——可通过集成测试或日志追踪验证（辅证：调用日志 grep 可见独立的 mode/contract 字段，且不含 stage 名称枚举）。
- AC5-4（行为验证）：给定触发强制停止条件（如达到轮次上限），wh-review 实际停止调用 3rd-review 引擎，不进入下一轮——可通过轮次状态文件验证（AC-D10）；辅证：wh-review 实现含独立轮次计数器，不依赖引擎内部轮次上限参数。

---

### FR-THIRDREVIEW-002 §7 改写

**描述**：改写 3rd-review SKILL.md 中的 §7，删除所有流程步骤和 if/else 逻辑，仅保留对 §13 的概念性导读。

**机器可检验规则**：§7 不含任何 numbered step（`1.`/`2.`/`- [ ]` 等枚举格式）、if/else 逻辑关键字，也不含用于绕过上述检测的等价顺序步骤表述——包括中文步骤词（如"第一步/首先/其次/然后/接着/随后/最后/再"等）与英文等价词（如 `step 1`/`first ... then`/`next`/`finally`）。

**Given/When/Then**：
- Given §7 改写完成；
- When 对 §7 内容运行模式匹配；
- Then 不命中 `^\s*\d+\.` 或 `/\bif\b.*\belse\b/` 等 step/条件分支模式，也不命中中文步骤词模式（如 `第[一二三四五六七八九十]+步|首先|其次|然后|接着|随后|最后`）或英文步骤词模式（如 `\bstep\s*\d+\b|\bfirst\b.*\bthen\b|\bfinally\b|\bnext\b`）。

**验收标准**：
- AC6-1：§7 文本不含 numbered list（`1. 2. 3.`）。
- AC6-2：§7 文本不含 if/else/条件分支逻辑描述。
- AC6-3：§7 文本包含明确的"单次调用语义参见 §13"或等价表述。
- AC6-4（新增）：§7 文本不含等价顺序步骤词绕过表达（中文"第一步/首先/其次/然后/接着/最后"或英文 `step 1`/`first...then`/`finally`/`next` 等）；可机器 grep 上述扩展规则验证。

---

### FR-STAGE-001 5 个 stage 收尾统一

**描述**：5 个 stage 的 SKILL.md 收尾步骤统一调用 `docs/human-brief-template.md`，禁止各自实现不一致的收尾逻辑。

**Given/When/Then**：
- Given 任意 stage（如 build-plan）完成主体工作；
- When 执行收尾步骤；
- Then 调用 `docs/human-brief-template.md` 生成标准收尾摘要，不走自定义收尾逻辑。

**验收标准**：
- AC7-1：5 个 stage 的 SKILL.md 收尾段均含对 `docs/human-brief-template.md` 的调用引用。
- AC7-2：逐一核实后无 stage 使用自定义收尾模板（与 human-brief-template 不一致）。

---

### FR-D2-001 D2 人工确认门

**描述**：make-decision / build-plan / verify-code 的 pass 路径须触发人工确认，不得自动推进。build-spec / build-code 的 pass 路径可自动推进（auto-advance）。

**Given/When/Then**：
- Given wh-review 对 make-decision 返回 verdict=pass；
- When stage agent 准备推进；
- Then 触发人工确认流程（挂起等待 human orchestrator 明确批准），不自动进入下一 stage。

**验收标准**：
- AC8-1（行为验证，主验收）：给定一个 verdict=pass 的模拟审查结果，make-decision / build-plan / verify-code 的执行流程实际停在人工确认门——即流程暂停、等待人工回应，不自动调用下一阶段。可通过集成测试或端到端冒烟复现。
- AC8-2（行为验证，主验收）：给定一个 verdict=pass 的模拟审查结果，build-spec / build-code 的执行流程实际自动推进到下一阶段，无需人工干预，且 stage-result 状态正确落盘。可通过集成测试或端到端冒烟复现。
- AC8-3（辅证）：make-decision / build-plan / verify-code 的 pass 分支代码中不存在自动推进逻辑（grep/代码审查，辅助 AC8-1 的静态确认）。

---

### FR-INTAKE-001 intake 合同覆盖 C1-C6

**描述**：wh-review 的 intake（make-decision 专属）合同实现须覆盖 C1-C6 全部判据，且合同机器可消费字段非空。

**C1-C6 判据**（来源 decision-log D4）：
- C1：原始需求原文引用（至少一处，不可仅概括）
- C2：决策有证据支撑（每条 KEEP 结论须附具体理由）
- C3：范围边界明确划分 in/out（各至少一条且互不重叠）
- C4：无悬挂开放问题（0 个未解决或已标注不阻断+跟进）
- C5：方向与上游输入一致（方向结论需覆盖用户明确要求全部条目，无未授权范围扩张）
- C6：决策产物格式可机器消费（需含 decision/scope.in/scope.out/open_questions 等标准字段且非空）

**验收标准**：
- AC9-1（静态验证）：intake 合同文件中 C1、C2、C3、C4、C5、C6 六个判据各有对应字段或检查项，缺任意一项即不通过；可 grep 合同文件验证。
- AC9-2（静态验证）：合同文件中 `decision`、`scope.in`、`scope.out`、`open_questions` 四个标准字段均存在且值非空字符串（`""` 或缺失均视为不通过）；可机器 parse 验证。

---

### FR-TESTACCEPTANCE-001 test-acceptance 合同覆盖 F1-F6

**描述**：wh-review 的 test-acceptance（verify-code 专属）合同须覆盖新鲜性判据 F1-F6。

**F1-F6 判据**（来源 decision-log D5）：
- F1：代码提交晚于最新 decision-log 更新
- F2：测试覆盖最新验收标准全集（spec.md AC-ID 在 test-strategy.md 中有非空路由）
- F3：无引用已废弃字段/接口
- F4：fresh-capture git_sha 与当前 HEAD 一致
- F5：L2/RED/GREEN 报告 content_hash 未变
- F6：测试命令与 build-code 产物记录一致

**验收标准**：
- AC10-1（静态验证）：test-acceptance 合同文件中 F1、F2、F3、F4、F5、F6 六个判据各有对应字段或检查项，缺任意一项即不通过；可 grep 合同文件验证。
- AC10-2（行为验证）：给定一次 verify-code 执行后，fresh-capture 记录的 `git_sha` 与当前 HEAD 一致，且 `evidence` 字段中引用的 build-code 产物路径均存在于实际文件系统；断言：`git_sha == $(git rev-parse HEAD)` 且 evidence 路径 `ls` 均返回非空。

---

### FR-TEST-001 端到端测试方案

**描述**：build-plan 阶段须设计可执行测试方案，verify-code 阶段执行验证，覆盖 wh-review + 精简后 3rd-review 组合。

**Given/When/Then**：
- Given 全流程实现完成；
- When 运行端到端冒烟用例；
- Then 至少一个完整 stage（如 build-spec）调用 wh-review，返回正确 stage 合同路由日志，可本地复现。

**验收标准**：
- AC11-1：测试方案文档（test-strategy.md 或等价）存在且含端到端冒烟用例描述。
- AC11-2：至少一个端到端冒烟用例可在 workflowhub 本地跑通。

---

## 5. 非功能需求

- **NFR-1 可追踪性**：每次审查触发必须产生可持久化的轮次状态记录和审查报告，工具调用日志可回溯。
- **NFR-2 fail-loud**：stage 标识缺失、合同文件缺失、3rd-review 调用失败等错误场景，均须非零退出+明确错误信息，不静默降级。
- **NFR-3 独立复用**：精简后的 3rd-review 须可在无 wh-review 的场景下独立调用，接口不依赖 workflowhub 内部数据结构。
- **NFR-4 长期维护成本可接受**：引入 wh-review 新层的维护成本已在 spec 序言（spec-ladder C 档判定）中承认并记录；后续每次 stage 合同变更须同步更新映射表，成本在可接受范围内。

---

## 6. 数据流与状态

```
stage agent
  └──调用──▶ wh-review (stage=build-spec)
               ├── 合同查找: build-spec → design 合同
               ├── 构造 materials（全量/Delta Package）
               ├── 调用──▶ 3rd-review {mode, contract, materials}
               │              └── 返回 {verdict, findings, actual_mode}
               ├── 轮次状态更新（落盘）
               ├── 调用 render-review-report.mjs → 报告落盘
               └── 返回裁决: pass | revise_required | escalate_to_human
```

**轮次状态字段**（最小集）：`round_number`、`mode`（full/incremental/same-source）、`verdict`、`report_path`、`blocking_count`、`fingerprint_repeated`

---

## 6.5 指标与统一执行记录（CONSTITUTION.md S4/F6）

wh-review 复用仓库已有的统一执行记录机制 `metrics/collector.mjs`（`recordSkeleton` / `updateOwnResult`，M4 十核心字段：`execution_id`、`skill_or_stage`、`stage`、`skill_version`、`executed`、`tokens`、`duration_ms`、`rework_rounds`、`human_intervention`、`friction_ref`），不新增独立指标底座。

- 调用时机：wh-review 每次被 stage 调用触发审查前，调用 `recordSkeleton` 落一条骨架记录；本轮审查裁决完成后，调用 `updateOwnResult` 写入实测值。写入失败须 warn 但不阻断审查流程本身（与各 SKILL.md 现有约定一致）。
- wh-review 需落入 M4 字段的关键信息：轮次状态中的 `round_number` 落入 `rework_rounds`；本轮审查耗时落入 `duration_ms`；是否触发 `escalate_to_human` 落入 `human_intervention`；`verdict`/`mode` 等 M4 字段之外的信息保留在 wh-review 自身的轮次状态文件中，作为 metrics 记录之外的可回溯锚点。

**验收标准**：
- AC-METRICS-1（静态验证）：wh-review 实现中存在对 `metrics/collector.mjs` 的 `recordSkeleton`/`updateOwnResult` 调用，不手写独立的指标文件或另建指标底座；可 grep 验证。
- AC-METRICS-2（行为验证）：给定一次完整审查调用完成后，对应 metrics 记录含 M4 十核心字段全集，且 `rework_rounds` 与本次轮次状态文件中的 `round_number` 一致。

---

## 7. 影响范围

本章描述本需求会改变或破坏的既有业务行为与用户场景（文件路径见§9"不做"小节）。

### 7.1 审查触发方式变化

- **当前行为**：5 个 stage（make-decision/build-spec/build-plan/build-code/verify-code）各自直接调用 3rd-review，传 `--checkpoint=<stage>` 或不传，导致路由失败回退通用合同，stage 专属合同从未生效。
- **变更后行为**：5 个 stage 一律通过 wh-review 触发审查；wh-review 完成合同路由并记录 route-decision，3rd-review 引擎不感知 stage 身份。现有直接调用 3rd-review 并传 stage 参数的调用方须迁移到 wh-review。

### 7.2 pass 后推进与人工确认规则变化

- **当前行为**：make-decision/build-plan/verify-code 三个 stage 在 verdict=pass 后是否停在人工确认门、行为不一致或未实现。
- **变更后行为**：make-decision/build-plan/verify-code 在 verdict=pass 后必须停在人工确认门，等人工明确回应才推进；build-spec/build-code 在 verdict=pass 后自动推进，不等人工。违反该规则的现有逻辑须修正。

### 7.3 报告落盘与轮次追踪行为变化

- **当前行为**：审查报告基本未生成，审查完成与否无法追踪，无轮次状态记录。
- **变更后行为**：每次审查须落盘报告（含 verdict/findings/round_number/mode 等字段），全量审查在首轮执行，后续轮次按指纹判断是否可增量；wh-review 强制维护轮次上限，不依赖引擎侧参数。

### 7.4 3rd-review 单次调用语义变化

- **当前行为**：3rd-review SKILL.md §7 含 stage/轮次路由逻辑，调用方需了解其内部合同路由机制。
- **变更后行为**：3rd-review 精简为纯引擎，接收完整审查包、返回结构化 verdict，不感知 stage 或轮次。单次调用语义详见"调用语义契约"小节（见 FR-THIRDREVIEW-001）。调用方迁移到 wh-review 后不再直接依赖 3rd-review 内部路由。

### 7.5 既有调用方迁移影响

- 任何已按 `--checkpoint=<stage>` 形态直接调用 3rd-review 的代码，切换后须改为调用 wh-review 并传 stage 标识；wh-review 负责装配合同和审查包。
- 5 个 stage SKILL.md 的收尾段须统一切换为调用 human-brief-template.md，原有不一致的收尾逻辑失效。

**不改动**：agenthub 侧任何文件；workflowhub 其他未列出的业务流程。

---

## 8. Business Impact Scope

### 受影响的现有业务行为

| 受影响业务 | 当前行为 | 本次变更后行为 | 影响严重度 |
|---|---|---|---|
| 5 stage 异源审查触发 | 直接调用 3rd-review，无 stage 标识，审查报告未生成 | 改为通过 wh-review 触发；报告落盘；专属合同正确路由 | 破坏性（接口变更） |
| build-spec/build-code pass 路径 | 行为不确定 | 审查通过后自动推进到下一 stage | 行为明确化 |
| make-decision/build-plan/verify-code pass 路径 | 行为不确定 | 审查通过后停在人工确认门，不自动推进 | 行为明确化 |
| 3rd-review 调用合同路由 | 靠 checkpoint 参数前缀匹配；参数缺失时回退通用合同 | 路由逻辑移入 wh-review；3rd-review 不再感知 stage | 破坏性（接口变更） |
| 审查轮次状态 | 无状态记录 | wh-review 维护轮次状态文件，可追踪 | 新增能力 |

### 不受影响的范围

- agenthub 侧所有文件不变。
- workflowhub 5 stage 的主体逻辑（非收尾段）不变。
- 3rd-review 作为独立引擎仍可在无 wh-review 场景下单独调用。

---

## 8.5. 兼容性预留

- **向后兼容**：3rd-review 精简后接口变更（剥离 stage/轮次参数），调用方须切换到 wh-review。现有直接调用 3rd-review 并传 stage 参数的代码（如有）需迁移到 wh-review 调用。
- **扩展预留**：wh-review stage→合同映射表设计为可配置/可扩展，未来新增 stage 只需添加映射条目，不改引擎代码。

---

## 9. 不做和隐性必达

### 明确不做

1. 不修复旧 `--checkpoint` 路由 bug（已于 commit e96c257 修复，不在本期）
2. 不支持 agenthub 侧文件变更
3. 不新增 UI/可视化界面
4. 不实现实时通知或推送机制
5. 不对 workflowhub 5 个 stage 以外的第三方 stage 提供合同支持

### 隐性必达

- **隐性必达 1**：3rd-review 精简后仍须能在无 wh-review 的场景下独立调用（FR-THIRDREVIEW-001 NFR-3）。
- **隐性必达 2**：不引入新类别的阻断式质量门（F4/F5 宪法原则，所有新门禁须有明确 benefit 理由）。
- **隐性必达 3**：5 个 stage SKILL.md 改动后测试套件须维持全绿（若有自动化测试覆盖）。

---

## 10. 验收清单及未决问题

### 验收检查（success_criteria）

- AC-D1（行为验证）：给定含 stage 名称的测试调用，3rd-review 引擎返回的结果中不含任何 stage 枚举字段；且对同一审查包，去掉/加上 stage 参数的两次调用返回结果一致。辅证：3rd-review SKILL.md grep 不含 stage 名称枚举、不含轮次管理逻辑。
- AC-D2（行为验证）：对精简后的 3rd-review §7，执行端到端调用，调用方无需感知 §7 中的任何 step 序号或 if/else 分支即可完成调用。辅证：§7 文本 grep 不含 numbered step / if/else 逻辑。
- AC-D3：wh-review/SKILL.md 存在 stage→合同映射表（5 条全覆盖）
- AC-D4（行为验证）：5 个 stage 传入对应标识后，实际调用流程中 route-decision 记录文件含对应专属合同源路径 + hash（非通用合同），且该记录与实际审查包内容一致——可通过集成测试或日志追踪验证（辅证：可机器 grep route-decision 文件内容）。
- AC-D5（行为验证）：同 AC8-1——给定 verdict=pass，make-decision / build-plan / verify-code 执行流程实际停在人工确认门。辅证：代码/文档可查 pass 路径不含自动推进逻辑。
- AC-D6（行为验证）：给定一次完整的 stage 收尾执行，5 个 stage 均实际生成符合 human-brief-template.md 模板结构的产出物；辅证：5 个 stage SKILL.md 收尾段均含 human-brief-template.md 引用。
- AC-D7：端到端冒烟用例可本地跑通，覆盖 wh-review + 精简 3rd-review 组合
- AC-D8：intake 合同覆盖 C1-C6 全部判据字段
- AC-D9：test-acceptance 合同覆盖 F1-F6 全部判据字段
- AC-D10：轮次状态文件存在，记录 round_number / mode / verdict / report_path
- AC-D11（静态验证）：wh-review 复用 `core/task-dir-parser.mjs` 解析任务目录路径，不硬编码、不另造解析逻辑（见 FR-WHREVIEW-001 AC1-4）。
- AC-D12（静态验证）：wh-review 复用 `metrics/collector.mjs` 统一执行记录机制记录审查指标，不新增独立指标底座（见 §6.5 AC-METRICS-1/2）。

### 未决问题

- **OPEN-1**（已按 decision-log D1 结构化三元组口径解决）：原问题为"3rd-review 靠 --checkpoint 做 stage 路由/合同匹配，参数文档不一致"。本期方案从根本上消除该问题：wh-review 完成 stage→合同映射后，调用 3rd-review 引擎时显式传入 `{mode, contract, materials}` 三元组；3rd-review 不做 stage 路由、不感知 stage 名称或轮次号，但通过显式 `contract` 字段获知本次审查依据的合同，路由不一致问题不复存在。无需 build-plan 阶段另建 tracking issue。

---

## Known Gaps

- 5 套 stage 专属合同从 agenthub verifiers/vibecoding 搬迁后可能需要适配 workflowhub 数据结构，具体适配点在 build-plan 阶段确认。
- render-review-report.mjs 的6章结构名称未在 decision-log 中明确列出，build-plan 阶段需在 agenthub 原实现中核实并在 SKILL.md 中定义。
- `docs/human-brief-template.md` 是否已存在未经确认，若不存在须作为前置依赖在 build-plan 中标出。
- （spec-clarify 补充）**GAP-4**（已在本期 spec 解决）：降级触发条件中"大量"已在 FR-WHREVIEW-003 中明确为"单轮 blocking_count ≥ 3 或 fingerprint_repeated=true，连续3轮成立"。
- （spec-clarify 补充）**GAP-5**（已在本期 spec 解决）：同源切换与升级人工的优先级已在 FR-WHREVIEW-003 中明确：升级人工判定先于同源切换判定（第3轮末先判升级条件，满足则直接升级，不进入第4轮同源模式）。
- （3rd-review 实测发现）**GAP-6**：3rd-review 引擎内部的轮次上限参数实测不生效，revise_required 时可能无限循环。此 bug 不在本期修复 scope 内。wh-review 实现须自行做轮次计数并强制停止，不能依赖 3rd-review 引擎的内部轮次上限参数（见 FR-THIRDREVIEW-001 AC5-4）。
