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
  2. 精简 3rd-review 引擎（独立兄弟仓库 `$THIRD_REVIEW_REPO_ROOT`，非 workflowhub 仓库内路径，见 FR-THIRDREVIEW-001）：剥离所有 stage/轮次知识，只保留"收入参→调度审查 agent→返回结果"核心引擎
  3. 5 个 stage 的 SKILL.md 收尾步骤统一调用 `docs/human-brief-template.md`（D6）
  4. 现有 `§7`（build-code/SKILL.md 中的流程步骤段）改写为仅对 `§13` 的概念性导读，删除所有 numbered step 和 if/else 逻辑
  5. 搬迁 agenthub `verifiers/vibecoding/` 的 5 套 stage 专属合同到 wh-review，本期一次性完整搬迁落地（架构支持未来新增合同，但不稀释本期 5 套全部完成的验收口径）
- **最大影响面**：3rd-review 仓库的 `SKILL.md`（独立兄弟仓库 `$THIRD_REVIEW_REPO_ROOT/SKILL.md`，破坏性重构，非 workflowhub 仓库内路径，见 FR-THIRDREVIEW-001）+ workflowhub 仓库内 `skills/wh-review/`（全新）+ 5 个 stage SKILL.md 收尾段
- **验收信号**：各 stage 触发 wh-review 时传入正确 stage 标识，stage 专属合同被加载（日志可验证）；§7 不含任何 numbered step / if/else 逻辑（机器可检验）；审查轮次状态与报告均落盘任务目录

---

## 1. 问题陈述

当前：workflowhub 5 个 stage（make-decision / build-spec / build-plan / build-code / verify-code）触发异源审查时，均使用单一 3rd-review（独立兄弟仓库 `$THIRD_REVIEW_REPO_ROOT`，非 workflowhub 仓库内路径，见 FR-THIRDREVIEW-001）技能，且调用时未传递 stage 标识（`--checkpoint`）。

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
- 精简 3rd-review 仓库的 `SKILL.md`（独立兄弟仓库 `$THIRD_REVIEW_REPO_ROOT/SKILL.md`，非 workflowhub 仓库内路径，见 FR-THIRDREVIEW-001；删除 stage/轮次知识，保留纯引擎）
- 改写 build-code/SKILL.md §7：删除 numbered step / if/else，仅保留对 §13 的概念性导读
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

**UC-8 失败场景：关键输入缺失或结果不可解析（关联 FR-WHREVIEW-001/002/003/THIRDREVIEW-001、NFR-2）**
Given stage 标识缺失或为未知值，或 stage 对应的合同文件缺失，或 3rd-review 返回的 result-file 缺失/不可解析；
When wh-review 执行到对应校验点；
Then 按场景分别处理，不静默降级、不回退通用合同、不跳过校验继续推进：stage 标识缺失/未知 → 属于 wh-review 自身输入/配置错误，以非零退出码终止并输出明确错误信息（fail-loud，NFR-2）；stage 对应合同文件缺失 → 同样属于 wh-review 自身配置错误，以非零退出码终止并输出明确错误信息（fail-loud，NFR-2）；3rd-review 返回的 result-file 缺失/不可解析 → 属于 3rd-review 调用失败场景（不是 wh-review 自身故障），最终裁决直接判定为 `escalate_to_human`，触发原因写入报告/日志，wh-review 自身以退出码 0 正常返回（NFR-2 明确的例外条款，不适用 fail-loud 非零退出规则，权威定义见 FR-THIRDREVIEW-001/NFR-2）。

**UC-9 边界场景：第3轮末升级人工判定的边界行为（关联 FR-WHREVIEW-003、NFR-2）**
Given 异源审查进行到第3轮末；
When 升级人工条件（单轮 `blocking_count ≥ 3` 或 `fingerprint_repeated=true`，且连续3轮成立）被判定为满足；
Then wh-review 直接裁决 `escalate_to_human`，不进入第4轮；
Given 同一场景下升级人工条件在第3轮末被判定为不满足；
When wh-review 继续按轮次规则推进；
Then wh-review 进入第4轮并强制转为同源模式（`mode=same-source`），不再发起异源审查。

---

## 4. 功能需求（FR）

### FR-WHREVIEW-001 wh-review 技能创建

**描述**：新建 `skills/wh-review/` 模块作为 workflowhub 专属审查调度层。

**落盘路径解析（复用 FR-TASKDIR-001 契约 + 对齐 agenthub 归档规范）**：wh-review 的报告文件与轮次状态文件的根路径解析统一复用 `core/task-dir-parser.mjs`（`parseTaskDir()`），优先级与 FR-TASKDIR-001 一致：`WORKFLOWHUB_TASK_DIR` 环境变量 → `config/workflowhub.yaml` `task_dir` 字段 → 两者均缺失则 fail-loud、非零退出。wh-review 不得自行硬编码任务目录路径，也不得另造一套解析逻辑。

**task-id 来源契约（定死，本 spec 内所有 `tasks/{task-id}/...` 路径统一复用此解析结果）**：`task-id` 的值来源统一定义为——调用方（stage agent）在触发审查请求时，随 stage 标识一并显式传入的 `task_id` 参数，wh-review 只接收、透传，不做二次推导。该值须与调用方自身当前任务的 task-id 保持一致（即调用方从其上游 handoff 或自身运行环境中已持有的 task-id，直接透传给 wh-review）；wh-review 不得从工作目录名、`task_tracking_root` 目录结构或任何其他约定中反向解析出 task-id。`parseTaskDir()` 仅负责解析 `task_tracking_root`（任务跟踪根目录），不解析、也不参与 task-id 的确定——本 spec 中所有出现的 `tasks/{task-id}/...` 路径，均须通过 `path.join(task_tracking_root, "tasks", task_id, ...)` 拼接得到（`task_tracking_root` 为 `parseTaskDir()` 解析出的任务跟踪根目录，`tasks` 为其下固定的字面量子目录层，不得省略），`task_id` 直接复用调用方传入的显式参数值，不允许各处（报告落盘、route-decision 记录、人工确认 artifact 等）自行猜测或另行解析。若调用方未传入 `task_id` 参数，wh-review 须 fail-loud（非零退出+明确错误信息），不使用默认值或路径猜测兜底。

**落盘契约（定死，不再是待定选项）**：
1. **一次性输入 vs 持久证据（不再混同，权威定义见 FR-THIRDREVIEW-001"evidence/report 落盘路径规则"）**：wh-review 调用 3rd-review 引擎前，把序列化后的结构化三元组 `{mode, contract, materials}` 写入传给 `--diff` 的临时输入文件——**只有这份临时输入文件**才是消费后即完成使命的一次性中间产物，不落入 `parseTaskDir()` 解析出的 `task_tracking_root`，wh-review 执行完毕后可清理，不要求提交入库。3rd-review 引擎写入 `--output` 的单轮原始 `{verdict, findings, actual_mode}` JSON 则是**持久证据**，落盘于 `task_tracking_root` 下 `tasks/{task-id}/reviews/verdict-{stage}-{review_flow_id}-round-{total_round}.raw.json`（`{review_flow_id}` 定义见 FR-WHREVIEW-003"字段完整性、历史记录与自校验"，权威路径与命名规则见 FR-THIRDREVIEW-001"evidence/report 落盘路径规则"），须持久保留供 gate_cmd/人工审计读取，不属于可随意清理的临时产物。
2. **最终交付物（唯一权威路径）**：wh-review 必须把从 3rd-review 拿到的 verdict/findings 渲染成 agenthub 风格的扁平命名报告文件，落在 `parseTaskDir()` 解析出的 `task_tracking_root` 下的 `tasks/{task-id}/reports/` 目录（与 agenthub `tasks/{task}/reports/` 结构对齐），禁止嵌套时间戳目录。
3. **命名规则（round17 修复：消除"revise_required 既要求 -revise 后缀又说未终审无后缀"的自相矛盾）**：裁决枚举严格为 `pass`/`revise_required`/`escalate_to_human` 三值（见 FR-WHREVIEW-004），三者性质不同，文件名后缀须一一区分，不得共用同一后缀。报告文件名格式为 `<stage>--<review_flow_id>--<round>-{pass|revise|escalated}.md`，**后缀 100% 由该轮渲染报告时的当轮 verdict 决定，三态穷尽、无遗漏**：`pass`→`-pass`（终审通过）、`revise_required`→`-revise`（需继续修，非终审，但当轮已产出该裁决结果）、`escalate_to_human`→`-escalated`（升级人工）。verdict 枚举本身只有这 3 个值，wh-review 每一轮渲染报告时必然已从 3rd-review 或自身升级判断中拿到其中一个裁决结果，**不存在"本轮尚未产出裁决/进行中"的第 4 种无后缀状态**——此前版本"未终审时无后缀"的表述与"revise_required 用 -revise 后缀"相矛盾，予以删除。例如 `build-spec--1770412345678-a1b2--3-pass.md`（`pass`）、`build-spec--1770498888888-c3d4--2-revise.md`（同一 stage 另一次审查流程的 `revise_required`）、`build-spec--1770412345678-a1b2--4-escalated.md`（`escalate_to_human`）。`<stage>` 取 make-decision/build-spec/build-plan/build-code/verify-code 之一；`<review_flow_id>` 为本次审查流程的稳定唯一 ID，定义与生成规则见 FR-WHREVIEW-003"字段完整性、历史记录与自校验"；`<round>` 即 FR-WHREVIEW-003 定义的 `total_round`（总轮次计数器，异源与同源轮次均计入，恒等于 `heterologous_round + same_source_round`）。`total_round` 的计数范围是单次审查流程——即某个 stage 一次从发起审查到得出 `pass`/`escalate_to_human` 终态为止的完整流程：该 stage 每次发起新一轮审查流程时，`total_round` 从 1 重新计数；在同一次审查流程内部，`total_round` 不因异源/同源模式切换而重置。**由于 `total_round` 会在同一 stage 的每次新审查流程中复位，仅靠 `<stage>` 前缀无法区分同一 stage 先后发起的不同审查流程（round14 finding，订正此前"不会冲突"的错误断言）；文件名必须同时包含 `<review_flow_id>`，才能保证不同审查流程之间（无论是否同一 stage）不会因 `total_round` 复位而互相覆盖历史证据文件。**
4. **索引文件**：wh-review 必须在 `tasks/{task-id}/reports/report-index.md` 维护一份汇总索引（结构参照 agenthub `verifier-report-index.md`：seq/timestamp/stage/report_kind/verdict/report_path/summary 等列），每次渲染新报告后追加一行，不得覆盖历史记录。

**Given/When/Then**：
- Given 任意 stage agent 发起审查请求（stage 标识已传入）；
- When wh-review 被调用；
- Then wh-review 通过 `core/task-dir-parser.mjs` 解析出 task_tracking_root，完成 stage→合同查找、调用 3rd-review（`--diff` 临时输入产物落临时工作区，`--output` 原始 verdict JSON 落 `tasks/{task-id}/reviews/` 持久保留，见 FR-THIRDREVIEW-001）、轮次状态管理、报告渲染（最终产物落 `tasks/{task-id}/reports/`），返回裁决结果。

**验收标准**：
- AC1-1：`skills/wh-review/SKILL.md` 存在且包含 stage→合同映射表（5 条）。
- AC1-2（行为验证）：给定不传 stage 标识的调用，wh-review 以非零退出码终止并输出明确错误信息；给定传入已知 stage 标识的调用，wh-review 正常完成，不报错。两种情况的实际行为可通过集成测试或手动测试复现；断言：前者 exit code ≠ 0，后者 exit code = 0。
- AC1-3（行为验证）：给定一次完整审查调用完成后，最终报告文件落盘路径为 `parseTaskDir()` 解析得到的 `task_tracking_root` 下的 `tasks/{task-id}/reports/`，而非硬编码，也不落在 3rd-review 产出的原始临时工作区目录；断言：该目录下存在至少一个报告文件，且文件内容包含 `verdict` 字段，可通过机器验证（脚本检查目录非空且解析出 `verdict` 字段）或人工检查确认；具体验证脚本/命令示例不在本 spec 正文列出，留待后续 test-strategy 文档给出。
- AC1-4（静态验证）：wh-review 实现代码 import `core/task-dir-parser.mjs` 的 `parseTaskDir`，代码中不存在任务目录路径硬编码字符串或另造的路径解析逻辑；可 grep 验证。
- AC1-5（行为验证，可判定的渲染约束；round17 修复：后缀改为必填，三态穷尽不再允许无后缀）：给定 wh-review 完成一次渲染后，生成的 stage report 文件名必须匹配正则 `^(make-decision|build-spec|build-plan|build-code|verify-code)--[a-z0-9-]+--\d+-(pass|revise|escalated)\.md$`（`<stage>--<review_flow_id>--<round>-{pass|revise|escalated}` 四段结构，见 FR-WHREVIEW-001"命名规则"；`<stage>` 前缀本轮修复收紧为 make-decision/build-spec/build-plan/build-code/verify-code 五个枚举值的选择组，此前 `[a-z-]+` 过宽，任何非法 stage 名如 `foo-stage` 也能通过；后缀由此前的可选 `(-pass|-revise|-escalated)?` 改为必填 `-(pass|revise|escalated)`，因 verdict 三态穷尽、每轮渲染必有其一，不存在无后缀的中间态）；断言：对 `tasks/{task-id}/reports/` 目录下除 `report-index.md` 外的所有报告文件名运行该正则，全部匹配（`report-index.md` 为独立命名的索引文件，不参与该正则校验）；同时断言 `verdict=revise_required` 的渲染结果文件名后缀为 `-revise`、`verdict=escalate_to_human` 的渲染结果文件名后缀为 `-escalated`，两者不得产出相同后缀；同时 `report-index.md` 中存在对应每份 stage report 的索引行。

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

**route-decision 记录文件契约（定死，AC2-2/AC-D4 验收依据；round17 修复：与 FR-WHREVIEW-007 两段式调用流程对齐，写入拆分为两次，消除"准备阶段算不出 materials hash"的自相矛盾）**：
- **路径**：`tasks/{task-id}/reviews/route-decision-{stage}-{review_flow_id}.json`（`task-id` 来源见 FR-WHREVIEW-001"task-id 来源契约"；round19 修复：路径按 `stage`+`review_flow_id` 隔离为独立文件，不再是单一全局文件，`review_flow_id` 在第一次写入前已生成，详见 data-contracts.md Contract 3"跨 stage/跨流程隔离结论"——不再依赖 FR-STAGE-001 未定义的"stage 严格串行"假设）。
- **写入时机（两次写入，非一次性）**：
  - **第一次写入（对应 FR-WHREVIEW-007 步骤1"准备"）**：此时 materials/diff 尚未生成，wh-review 只写入此刻已确定的字段：`stage`、`contract_path`、`contract_hash`、`timestamp`、`input_mode`、`review_flow_id`、`total_round`；`review_input_hash` 字段必须显式存在但留空占位（空字符串或 `null`），不得整体省略该键。
  - **第二次写入（对应 FR-WHREVIEW-007 步骤3"执行审查"，须在真正调用 3rd-review 引擎之前完成）**：提示词生成子代理产出 prompt 文件、`materials` 内容确定后，wh-review 基于该实际 `materials` 计算 `review_input_hash`，就地回填/更新到同一份 `route-decision-{stage}-{review_flow_id}.json`（更新该字段，不重写其余字段，不新建文件）。整体仍满足"必须在调用 3rd-review 引擎之前完成写入"的约束，不得延后到审查返回之后再补写。
- **完整性校验时机**：下方"最小字段集六项均非空"的完整性校验只在第二次写入（执行阶段）结束后检查；准备阶段结束时 `review_input_hash` 为空属于预期中间态，不视为不合规。
- **最小字段集**（执行阶段结束后六项均非空，缺任意一项视为不合规）：`stage`（本次触发审查的 stage 标识）、`contract_path`（所选合同文件的源路径）、`contract_hash`（该合同文件内容的 hash 或版本锚点）、`timestamp`（写入时刻的 ISO 8601 时间戳）、`input_mode`（本次调用的 mode 取值，`full`/`incremental`/`same-source` 之一）、`review_input_hash`（本次传给 3rd-review 的 materials 材料包内容 hash，准备阶段留空、执行阶段回填，用于比对记录与实际审查包一致性）。
- **覆盖规则**：同一 `review_flow_id` 内每次重复上述两阶段写入流程均整体覆盖同一物理文件的上一次记录；跨轮的路由历史轨迹由报告/轮次状态文件承担，`route-decision-{stage}-{review_flow_id}.json` 只保留该流程最近一次路由决策，不承担跨轮审计职责；不同 `review_flow_id`（新发起流程、resume 重跑）因路径隔离而写入不同物理文件，不会互相覆盖，不依赖"stage 严格串行"假设（详见 data-contracts.md Contract 3）。

**验收标准**：
- AC2-1：5 套合同文件均存在于 `skills/wh-review/contracts/`。
- AC2-2：传入任意已知 stage 时，route-decision 记录文件（按上述路径/字段契约落盘）中含所选合同源路径 + hash（或版本锚点），可机器 grep 验证（非通用合同）。
- AC2-3：传入未知 stage 时，fail-loud 而非静默回退。

---

### FR-WHREVIEW-003 审查降级机制

**描述**：wh-review 管理审查轮次与降级逻辑。轮次状态须使用三个独立计数器分别追踪、落盘在 wh-review 自身的轮次状态文件中，供 stop/escalate 规则可机器审计：`heterologous_round`（异源轮次计数，仅异源审查完成后递增）、`same_source_round`（同源轮次计数，仅切换到同源模式后、每轮同源审查完成后递增，切换前为 0）、`total_round`（总轮次计数，异源与同源轮次均使其递增，用于报告文件命名与跨模式的整体轮次追溯，不因模式切换而复位，恒等于 `heterologous_round + same_source_round`）。

**落盘路径（定死，权威声明，AC3-1~AC3-4 及 §6/AC-D10/AC-D10.1 验收依据）**：轮次状态文件固定落盘于 `tasks/{task-id}/reviews/round-state.json`（`task-id` 来源见 FR-WHREVIEW-001"task-id 来源契约"；与 FR-WHREVIEW-002 定义的 `route-decision-{stage}-{review_flow_id}.json` 共享同一 `tasks/{task-id}/reviews/` 目录结构，不另设新目录）。plan.md/tasks.md/data-contracts.md 中所有对轮次状态文件路径的引用均以本条款为唯一权威来源，不得另行定义或改写。

**字段完整性、历史记录与自校验（定死，权威声明，本轮修复 round7-10 反复出现的"覆盖式存储丢历史"与"无 stage 自校验"两个缺口，AC3-5/AC-D10/AC-D10.2 验收依据）**：轮次状态文件除三计数器与 `mode`/`actual_mode`/`verdict`/`report_path`/`blocking_count`/`fingerprint_repeated`/`post_review_action` 外，还须落盘以下字段（字段全集类型定义见 data-contracts.md Contract 4）：
- `review_flow_id`（本轮修复新增，权威声明，消除"不同审查流程之间因 `total_round` 复位而产生文件名撞车"的缺口，round14 finding）：字符串，标识"本次审查流程"的稳定唯一 ID，仅含 `[a-z0-9-]` 字符（避免破坏文件名解析）。生成时机：某 stage 发起一次全新审查流程时（即该 stage 当前没有处于进行中的流程、`total_round` 即将从1重新计数时）由 wh-review 生成一次，推荐格式 `{十进制毫秒时间戳}-{4位随机十六进制}`（如 `1770412345678-a1b2`），具体生成算法由实现自行选择，只需保证同一 `task-id` 下先后发起的不同审查流程之间该值不重复。生命周期：同一审查流程内（从发起到得出 `pass`/`escalate_to_human` 终态为止，含异源转同源的模式切换）该值保持不变，不因轮次递增或模式切换而重新生成；下一次全新审查流程发起时须重新生成一个新值。用途：报告文件名（FR-WHREVIEW-001 命名规则）、`prompt-r{N}.md`（FR-WHREVIEW-007）、人工确认 artifact（FR-D2-001）、raw verdict 证据文件（FR-THIRDREVIEW-001）、文档快照文件（FR-WHREVIEW-006）五类跨轮持久化 artifact 的文件名均须纳入该字段，以在 `total_round` 复位场景下与历史流程的同名文件区分，避免覆盖历史证据。
- `stage`：触发本次审查的 stage 标识，取值 make-decision/build-spec/build-plan/build-code/verify-code 之一，由触发方在每次写入时显式提供，不得留空、不得由 wh-review 自行猜测。orchestrator 恢复/重启读取该文件前，须先校验该字段与调用方自身当前 stage 一致；不一致须 fail-loud 报错并终止，不得静默假定该文件属于当前 stage 继续消费。
- `history`：数组字段，每轮写入时把该轮快照（至少含 `round_type`〈`heterologous`/`same-source`〉、`round_index`〈对应 `heterologous_round` 或 `same_source_round` 当轮取值〉、`total_round`、`verdict`、`blocking_count`、`fingerprint_repeated`）追加进数组，不覆盖历史条目；文件顶层的 `heterologous_round`/`same_source_round`/`total_round`/`verdict`/`blocking_count`/`fingerprint_repeated` 等字段仍代表"最新一轮"值供快速读取，`history` 供跨轮连续性判定（见下方"升级人工触发条件"）读取最近轮次。
- `finding_fingerprints`（本轮新增，追踪粒度细化到单条 finding，字段全集类型定义见 data-contracts.md Contract 4）：对象数组，元素结构 `{finding_fingerprint: string, first_seen_round: integer, consecutive_unresolved_rounds: integer, last_status: "open"|"resolved", diagnosed: boolean}`。`finding_fingerprint` 为该 blocking finding 的稳定指纹，基于其定位点（`file`+`line` 或等效定位锚点）与问题类别（`category`）做 hash 得出，与措辞变化无关；每轮审查完成后，wh-review 须将本轮 blocking findings 逐一计算指纹并与已有条目比对：指纹存在且本轮仍为 blocking → `consecutive_unresolved_rounds` 递增、`last_status="open"`；指纹存在但本轮已不在 blocking 列表中 → `last_status="resolved"`，`consecutive_unresolved_rounds` 归零；指纹不存在 → 新增条目、`consecutive_unresolved_rounds=1`。该数组只追加/更新已有条目，不删除历史指纹记录。
- `root_cause_diagnoses`：数组字段，每次触发"根因诊断"步骤（见下方"升级人工触发条件"finding 级信号）时追加一条记录，结构 `{finding_fingerprint: string, triggered_round: integer, diagnosis: string, category: "subsystem_design_defect"|"prior_fix_direction_wrong"|"other", fix_attempt_round: integer, resolved: boolean}`，不覆盖已有条目。

**规则**：
- `heterologous_round = 1`：强制全量异源审查
- `heterologous_round ≥ 2`：构造 Delta Package，以增量模式调用 3rd-review
- 异源审查最多3轮（`heterologous_round` 上限为3）；`heterologous_round` 达到3且不满足升级条件时，转入同源模式，`same_source_round` 从1开始计数
- **升级人工触发条件（精确定义，round14 修复：拆分为轮级粗粒度信号与 finding 级细粒度信号两类，避免"整轮 blocking 指纹集合是否完全相同"这一粗粒度判据掩盖单条 finding 反复出现、其余 findings 已变化的情况；round16 修复：两类信号的"连续N轮"阈值不再共用同一个 N——轮级信号仍为连续3轮，finding 级信号阈值降为连续2轮）**："连续N轮"在异源阶段指连续N个 `heterologous_round`，在同源阶段指连续N个 `same_source_round`，两类计数器分别独立比较，不跨阶段合并；轮级信号 N=3，finding 级信号 N=2（阈值不同的原因见下方 finding 级信号段"round16 修复"说明）：
  - **轮级信号（沿用不变）**：单轮 `blocking_count ≥ 3`，且该条件在连续3轮均成立 → 直接触发 `escalate_to_human`。
  - **finding 级信号（round14 修复替代原"`fingerprint_repeated = true` 连续3轮直接升级人工"判据；round16 二次修复：触发阈值从3降为2，消除"诊断+重试分支永远走不到"的死代码缺陷）**：当 `finding_fingerprints`（见上方"字段完整性、历史记录与自校验"）中某条记录的 `consecutive_unresolved_rounds` 达到2（即同一条 blocking finding 的指纹连续2轮 `last_status="open"`）时，wh-review **不得**直接裁决 `escalate_to_human`；须先触发"根因诊断"步骤：要求诊断该 finding 反复出现的根本原因（`subsystem_design_defect`〈同一子系统设计缺陷〉或 `prior_fix_direction_wrong`〈历轮修复方向本身错误〉二者之一，或标注 `other` 并注明具体原因），把诊断结论追加写入 `root_cause_diagnoses` 数组（含触发轮次 `triggered_round`），并针对该根因发起一次定向修复尝试（对应记录 `fix_attempt_round`，即修复尝试提交后触发的下一轮审查轮次——该轮次恰为该 finding 首次达到 `consecutive_unresolved_rounds=2` 所在阶段的第3轮，等于该阶段轮次硬顶3，仍在硬顶之内，必有空间执行，不再需要"下一轮不存在"的兜底处理）；仅当该修复尝试对应轮次审查完成后，该 `finding_fingerprint` 在 `finding_fingerprints` 中仍为 `last_status="open"`（即诊断+修复尝试后仍未解决）时，方裁决 `escalate_to_human`，并将 `root_cause_diagnoses` 对应条目的 `resolved` 置为 `false`；若修复尝试后该 finding 已闭合（`last_status="resolved"`），则该条目 `resolved` 置为 `true`，不触发 `escalate_to_human`，流程按其余 findings 情况继续正常判定降级/升级。`fingerprint_repeated`（轮级、整轮指纹集合是否完全相同的布尔字段，定义见 Contract 4）自 round14 起不再直接触发升级人工，仅作报告/排查用的粗粒度参考信号。**round16 修复：删除"优先级例外"条款**——round14 曾引入"若某条 finding 的 `consecutive_unresolved_rounds` 首次达到3恰好发生在其所在阶段终审轮末、该阶段已无下一轮可供修复尝试，则跳过诊断+重试直接升级"的例外分支；该例外条款实际上覆盖了所有情形（因为阈值3恰等于阶段轮次硬顶3，某 finding 首次达到"连续3轮未解决"必然发生在该阶段最后一轮），导致"先诊断、下一轮内重试、仍不行才升级"这条正常分支永远无触发空间、从未真正执行过。阈值降为2后，某 finding 首次达到 `consecutive_unresolved_rounds=2` 时其所在阶段最迟发生在该阶段第2轮末，此时该阶段轮次硬顶为3，必然还有第3轮空间可供开展定向修复尝试，"先诊断+下一轮内重试、仍不行才升级"三步流程恒可在阶段轮次硬顶内走完，不再存在"终审轮无下一轮可用"的场景，因此该例外条款不再需要，本轮予以删除，不保留任何变体。
  - **判定实现（本轮修复）**：轮级信号的连续性判定必须从轮次状态文件的 `history` 数组读取——按 `round_type` 过滤出与当前阶段（异源/同源）匹配的历史快照，取最近3条按 `round_index` 升序核对，全部满足 `blocking_count ≥ 3` 方触发升级；`history` 中同类型快照不足3条时不得判定为满足（数据不足不得误判为满足）。不得仅依赖顶层覆盖式存储的单一最新快照做该判定，因其在写入下一轮时即丢失前序轮次信息，无法支撑"连续"语义。finding 级信号的连续性判定直接从 `finding_fingerprints` 数组对应条目的 `consecutive_unresolved_rounds` 字段读取，不依赖 `history`。
- **优先级规则**：每轮末先判升级人工条件，满足则直接升级，不再进入下一轮同源切换；不满足升级条件时，再按轮次判断是否转同源。即：`heterologous_round = 3` 末如满足升级条件，直接升级人工，`same_source_round` 不启动；不满足时才切换到同源模式，`same_source_round` 从1开始计数。**round16 修复**：阈值改为2后，finding 级信号不会再与本条"阶段终审轮升级"产生表面冲突——某 finding 首次达到 `consecutive_unresolved_rounds=2` 必发生在阶段第1或第2轮末，触发诊断+下一轮定向修复尝试；若该修复尝试对应轮次恰为该阶段终审轮（第3轮）且尝试后仍未解决，finding 级信号自身"仍未解决则升级"的结论与阶段终审轮硬顶的强制升级结论天然一致，直接按 finding 级信号规则裁决 `escalate_to_human` 即可，不再需要任何"优先级例外"条款。
- **同源模式终止规则**：同源审查最多3轮（`same_source_round` 上限为3，独立计数，不与 `heterologous_round` 合并）；`same_source_round = 3` 末若仍非 pass，强制裁决 `escalate_to_human`，不允许无限循环。同源模式下轮级/finding 级升级触发条件与异源相同（定义见上方"升级人工触发条件"），但因 `same_source_round` 上限为3，实际触发时机为：`same_source_round = 3` 末仍非 pass → 直接升级人工，无需等待3轮连续条件；此强制升级不因某条 finding 的根因诊断+修复尝试仍在进行中而豁免——**round16 修复**：阈值改为2后，该 finding 的诊断+修复尝试最迟在 `same_source_round=2` 末触发、`same_source_round=3` 完成重试，若该轮仍未解决，finding 级信号自身规则与本条终止规则的结论一致，均为升级人工，不存在需要豁免的冲突场景，"优先级例外"条款已删除，不再引用。**这三个计数器均由 wh-review 自身独立维护、落盘在其轮次状态文件中，不依赖、也不透传给 3rd-review 引擎内部的任何轮次参数或字段——3rd-review 引擎调用入口对 round/stage 保持零知识（见 FR-THIRDREVIEW-001），本条款的三计数器是 wh-review 侧的调用方状态，不改变该零知识约定（见 GAP-6）。**

**Given/When/Then**：
- Given `heterologous_round = 1` 审查已完成，verdict=revise_required；
- When 发起下一轮异源审查；
- Then wh-review 构造 Delta Package，以 `mode=incremental` 调用 3rd-review，`heterologous_round` 递增为2，`total_round` 同步递增。

**验收标准**：
- AC3-1（行为验证）：给定一次完整审查调用结束后，轮次状态文件存在，且 `heterologous_round`、`same_source_round`、`total_round` 三字段均为非负整数（处于异源阶段时 `same_source_round=0`，反之处于同源阶段时 `heterologous_round` 保持在切换时的定值不再递增）、`mode` 字段取值在 `{full, incremental, same-source}` 三值之内；断言：文件可机器 parse，四字段（三计数器 + `mode`）均非空非 null，且 `total_round = heterologous_round + same_source_round`。
- AC3-2（行为验证）：给定 `heterologous_round = 1` 审查 verdict=revise_required 后触发下一轮，Delta Package 文件存在；断言：Delta Package 文件大小 > 0 且不等于第1轮全量材料包大小（即非全量复制）。
- AC3-3（行为验证，本轮修复：不再纳入 `fingerprint_repeated`，该信号已改由 AC3-6 的 finding 级机制承接）：给定模拟连续3轮每轮满足轮级升级条件（`blocking_count ≥ 3`），wh-review 在 `heterologous_round = 3` 末返回 `escalate_to_human` 并不切换同源模式；断言：轮次状态文件 `heterologous_round` 最终值 ≤ 3、`same_source_round = 0`、`total_round = heterologous_round`，裁决字段 = `escalate_to_human`。
- AC3-4（行为验证）：给定 `heterologous_round = 3` 末升级条件满足，wh-review 裁决为 `escalate_to_human`，不切换同源模式；断言：裁决字段 = `escalate_to_human`，`mode` 字段 ≠ `same-source`，`same_source_round = 0`（与 AC3-3 可共用同一测试场景）。
- AC3-5（行为验证，本轮新增）：①给定连续3轮均满足单轮升级条件的模拟场景，断言升级判定逻辑实际读取轮次状态文件的 `history` 数组中最近3条同类型（`heterologous`/`same-source`）快照逐一核验，而非仅使用覆盖后的顶层单一快照字段；②给定轮次状态文件 `history` 数组中同类型快照不足3条，断言不满足升级条件（数据不足不得误判为满足）；③给定恢复读取轮次状态文件时其 `stage` 字段与调用方当前 stage 不一致，断言 wh-review/orchestrator fail-loud 报错退出，不采用该文件内容继续推进。
- AC3-6（行为验证，round14 新增，finding 级指纹追踪 + 根因诊断改判；round16 修复：阈值3改为2，删除⑤"优先级例外"验证点）：①给定某条 blocking finding 的 `finding_fingerprint` 在 `finding_fingerprints` 中连续2轮 `last_status="open"`（`consecutive_unresolved_rounds=2`）的模拟场景，断言 wh-review 在该轮末**不**直接裁决 `escalate_to_human`，而是向 `root_cause_diagnoses` 追加一条含 `diagnosis`/`category`/`triggered_round` 的记录，并驱动下一轮审查作为该根因的定向修复尝试（`fix_attempt_round` 对应该下一轮）；②给定修复尝试对应轮次审查完成后该 `finding_fingerprint` 在 `finding_fingerprints` 中转为 `last_status="resolved"`，断言裁决字段**不**为 `escalate_to_human`，且对应 `root_cause_diagnoses` 条目 `resolved=true`；③给定修复尝试对应轮次审查完成后该 `finding_fingerprint` 仍为 `last_status="open"`，断言裁决字段 = `escalate_to_human`，且对应 `root_cause_diagnoses` 条目 `resolved=false`；④断言 `fingerprint_repeated=true` 单独出现（未达到 finding 级连续2轮条件）时不触发 `escalate_to_human`，验证该字段已不再是直接升级判据；⑤（round16 修复，替换原"优先级例外"行为验证，验证诊断+重试路径在阶段轮次硬顶内可达）给定某 finding 在 `heterologous_round=1` 首次出现并判为 blocking、`heterologous_round=2` 末仍为 blocking（`consecutive_unresolved_rounds=2`，触发①所述诊断+定向修复尝试，`fix_attempt_round=3`）、`heterologous_round=3`（该阶段轮次硬顶，仍在硬顶内）为修复尝试对应审查轮次的模拟场景，断言：若该轮该 finding 转为 `last_status="resolved"`，裁决字段不为 `escalate_to_human`（对应②）；若该轮仍为 `last_status="open"`，裁决字段 = `escalate_to_human`（对应③）——两种结果均在 `heterologous_round ≤ 3` 硬顶内产生，不依赖任何"终审轮无下一轮"的例外分支，验证"诊断→下一轮重试→仍不行才升级"路径在阶段轮次硬顶内真实可达。

---

### FR-WHREVIEW-004 裁决枚举与报告渲染

**描述**：wh-review 的最终裁决仅含三种枚举值，报告由 render-review-report.mjs 渲染后落盘。

裁决枚举：`pass` / `revise_required` / `escalate_to_human`

**Given/When/Then**：
- Given 3rd-review 返回 findings；
- When wh-review 综合轮次与 findings 做裁决；
- Then 裁决值严格为枚举三值之一，报告以6章结构落盘当前任务目录。

**报告章节结构（章数=6 已由 decision-log D1 确认；具体章节名称/顺序/每章最小必要信息点由本 spec 当场定案作为验收基线）**：

decision-log D1 目标节原文仅确认"报告脚本渲染（移植render-review-report.mjs），6章结构，落盘任务目录"——即章节总数为6，未列出具体章节名称、顺序或每章语义。本 spec 在此基础上，将下列6章的名称、顺序及每章须含的最小必要信息点，作为本期验收基线当场定案，不再依赖 build-plan 阶段才产出的 `wh-review/SKILL.md` 最终定义作为验收依据：

1. Summary（审查摘要：verdict、轮次、模式）
2. Blocking Issues（blocking 级问题列表，含指纹字段）
3. Minor Issues（minor 级问题列表）
4. Pass Items（通过项列表）
5. Delta（本轮相较上轮的变更说明，第1轮留空）
6. Metadata（task-name、heterologous_round、same_source_round、total_round、mode、actual_mode、contract_path、contract_hash、timestamp）

build-plan 阶段仍可在 agenthub 原实现（render-review-report.mjs）中核实上述章节的具体渲染实现细节、完善渲染脚本，但不得改变本 spec 已定案的6章名称、顺序及最小必要信息点这一验收基线；若发现渲染实现与本基线冲突，以本 spec 基线为准，渲染脚本据此调整，而非反向修改验收标准。

**验收标准**：
- AC4-1：裁决字段只含三值之一，其他值视为错误。
- AC4-2（行为验证）：给定任意一次完整审查裁决，报告文件路径固定为 `parseTaskDir()` 解析出的 `task_tracking_root` 下 `tasks/{task-id}/reports/` 子路径（拼接规则本身不因 stage、轮次不同而改变）；断言：连续对两个不同 stage/轮次发起审查，两次报告路径均可由同一条固定拼接规则推导得出，且不落在 3rd-review 临时工作区或硬编码测试路径下；若报告文件缺失、或路径不符合该固定拼接规则，则判不通过。
- AC4-3（行为验证）：报告章节标题数量=6，章节名称与顺序与本节所列6章清单（Summary/Blocking Issues/Minor Issues/Pass Items/Delta/Metadata）一致，且每章至少包含本清单为其列出的最小必要信息点（如 Summary 含 verdict/轮次/模式；Metadata 含 task-name/heterologous_round/same_source_round/total_round/mode/actual_mode/contract_path/contract_hash/timestamp）；可机器 grep 报告文件章节标题与关键信息字段验证，无需比对任何 build-plan 阶段才产出的外部文档；章节数≠6，或名称/顺序与本清单不一致，或任一章缺失清单要求的最小信息点，均判不通过。

---

### FR-WHREVIEW-005 round2+ 新发现降级规则（收敛核心，照抄 agenthub 原版机制）

**描述**：round7-13 审查反复未收敛的根因调研发现，新方案缺了 agenthub 原版真正让审查3轮收敛的核心机制之一——round2+ 审查中新出现的 blocking finding，默认应降级为 minor（不阻断 pass），仅特定例外仍算 blocking。本 FR 把该判据显式定义为硬性条款，写入 3rd-review 调用所依据的各 stage 专属合同（FR-WHREVIEW-002），使裁决可落地执行，而非仅停留在 wh-review 自身逻辑里。

**规则定义**：
- 适用范围：`total_round ≥ 2`（异源 round2/round3 与同源模式各轮均适用）。
- 默认规则：本轮 3rd-review 产出的某条 finding，若其 `finding_fingerprint`（定义见 FR-WHREVIEW-003）未出现在上一轮（`total_round - 1`）报告的 Blocking Issues/Minor Issues/Pass Items 任一列表中（即"round2+ 新出现的 finding"），且本轮被判为 blocking，则**默认降级为 minor**：不计入本轮 `blocking_count`，不阻断本轮裁决为 `pass`。
- 例外（满足以下三类之一，仍算 blocking，不降级）：
  (a) **本轮改动新引入的问题**：该 finding 的定位点落在本轮 diff / Delta Package 实际改动的文件范围内（上一轮之后才新增或修改的内容引入的问题）。
  (b) **上一轮审查范围内客观无法发现的问题**：该 finding 所依赖的上下文/证据在上一轮 materials 中确实不存在或不可见（如依赖本轮才补充的外部信息或运行时行为），非"上一轮遗漏"。
  (c) **触碰架构边界 / scope boundary 违规**：该 finding 属于 spec.md §9 Scope Boundary 或架构边界定义范畴内的越界问题，严重度不因"round2+ 新发现"而降级。
- 3rd-review 裁决时须为每条命中"round2+ 新发现"判定的 finding，在报告 Blocking Issues/Minor Issues 对应条目中显式标注判定依据：`降级为 minor（默认规则）` 或 `维持 blocking（命中例外 a/b/c，注明具体理由）`，供人工核查，不得只给出裁决结果而不给依据。

**Given/When/Then**：
- Given `total_round ≥ 2`，本轮产出一条上一轮三类列表均未出现的新 finding，且判定为 blocking；
- When 该 finding 不满足例外 (a)(b)(c) 任一；
- Then 该 finding 须重分类为 minor，不计入 `blocking_count`，不阻断本轮裁决为 `pass`（其余 blocking findings 情况仍独立正常判定）。

**验收标准**：
- AC-DOWNGRADE-1（合同落地性）：5 套 stage 专属合同文本（FR-WHREVIEW-002）均须包含本规则的默认降级判据与 (a)(b)(c) 三类例外定义，可 grep 命中相关判据关键词；任一 stage 合同缺失视为不通过。
- AC-DOWNGRADE-2（行为验证，默认降级）：给定模拟 round2 场景——某 finding_fingerprint 未出现在 round1 报告任一列表、本轮判 blocking、不落在本轮 diff 改动范围内、非"客观无法发现"、不触碰 scope boundary——断言最终归类为 minor，不计入 `blocking_count`。
- AC-DOWNGRADE-3（行为验证，例外 a）：同上场景但该 finding 定位点落在本轮实际改动文件内，断言仍归类为 blocking、计入 `blocking_count`。
- AC-DOWNGRADE-4（行为验证，例外 c）：给定该 finding 命中 scope boundary 越界判定，断言仍归类为 blocking，不因"round2+ 新发现"降级。

---

### FR-WHREVIEW-006 文档类审查 Delta Package 快照机制

**描述**：spec.md/data-contracts.md/plan.md/tasks.md 等文档类审查对象，round2+ 不再拼接文档全文送审，改为传"文档快照 diff"——round(N-1) 快照与 round N 当前内容做文本 diff，作为本轮 Delta Package materials 的构成部分（与 FR-WHREVIEW-003 既有"第2轮起增量降级构造 Delta Package"条款配合，本 FR 是文档类审查对象专属的快照生成与存放规则补充）。

**快照存放路径**：`tasks/{task-id}/reviews/snapshots/{doc}-{review_flow_id}-r{N}.md`；`{doc}` 取被审文档的基础文件名（不含目录与扩展名，如 `spec`/`plan`/`tasks`/`data-contracts`）；`{review_flow_id}` 为本次审查流程的稳定唯一 ID（定义与生成规则见 FR-WHREVIEW-003"字段完整性、历史记录与自校验"）；`{N}` 为该文档本次参与审查对应的 `total_round`。

**生成时机**：每轮审查提交（即调用 3rd-review 引擎）之前，wh-review 自动生成当轮文档快照——把当前工作区对应文档的完整内容原样落盘至上述路径，不依赖人工手工触发；快照一经生成不得覆盖或删除。**注意**：`total_round` 会在同一 stage 每次发起新审查流程时从 1 重新计数，仅靠 `{doc}-r{N}.md`（不含 `{review_flow_id}`）不足以保证各轮文件名天然不冲突——同一 stage 先后两次审查流程都可能各自产出 `{doc}-r1.md`（round14 finding，订正此前"各轮独立文件名，天然不冲突"的错误断言）；文件名纳入 `{review_flow_id}` 后才能保证不同审查流程之间不会覆盖彼此的历史快照。

**Given/When/Then**：
- Given 本轮待审查对象属于文档类（spec.md/data-contracts.md/plan.md/tasks.md 之一）且 `total_round ≥ 2`；
- When wh-review 装配本轮 `materials`；
- Then `materials` 内容改为 round(N-1) 快照（`{doc}-r{N-1}.md`）与当前文档内容的文本 diff，而非文档全文；若 round(N-1) 快照缺失（如该文档首次发起 round2 审查、round1 未落快照），fail-loud 报错，不得静默退化为全文拼接。

**验收标准**：
- AC-SNAPSHOT-1：`total_round = 1` 时不生成 diff，materials 仍为全文（沿用现状）；调用 3rd-review 前必须落盘当轮快照 `{doc}-{review_flow_id}-r1.md`。
- AC-SNAPSHOT-2（行为验证）：`total_round ≥ 2` 时，断言 materials 内容为 round(N-1) 快照 vs 当前文档的文本 diff（非全文），且调用前已落盘当轮快照 `{doc}-{review_flow_id}-r{N}.md`。
- AC-SNAPSHOT-3（fail-loud）：给定 round(N-1) 快照文件缺失，断言 wh-review 报错退出，不静默回退为全文送审。
- AC-SNAPSHOT-4：快照文件命名与路径符合 `tasks/{task-id}/reviews/snapshots/{doc}-{review_flow_id}-r{N}.md` 规则（`{review_flow_id}` 定义见 FR-WHREVIEW-003），可用 `ls`/`find` 等机器手段验证。

---

### FR-WHREVIEW-007 审查提示词文件生成子代理机制

**描述**：各 stage 主 agent（make-decision/build-spec/build-plan/build-code/verify-code 五者之一，stage 执行 agent 本身）在调用 wh-review 执行实际审查前，须派生一个子代理，基于当前 stage 的审查合同（`contract_path`，见 FR-WHREVIEW-002）与当前 materials/diff（含 FR-WHREVIEW-006 文档快照 diff），生成完整的审查提示词文件并写入磁盘；wh-review 再读取该文件内容传给 3rd-review，而非由 stage 主 agent 自己在其主上下文中拼装提示词。目的：减少 stage 主 agent 自身的上下文消耗，避免其主上下文直接持有大段合同与 materials 全文。

**round16 修复：两段式调用流程，消除 `review_flow_id`/`total_round` 循环依赖**——round14 版本要求子代理在调用 wh-review 之前就把 `review_flow_id`/`total_round` 写进文件名，但这两个字段是 FR-WHREVIEW-003 定义的"由 wh-review 在发起新审查流程时生成/递增"的字段，子代理在 wh-review 尚未被调用时根本无法确定性获得，形成循环依赖。修复为以下三步：

- **步骤1（准备）**：stage 主 agent 先以"准备模式"调用 wh-review（复用 wh-review 现有入口，附加准备语义，不新增独立可执行文件）。wh-review 在此步完成三件事并返回给调用方：①分配或复用 `review_flow_id`（同一进行中审查流程复用既有值，全新流程生成新值，规则见 FR-WHREVIEW-003"字段完整性、历史记录与自校验"）；②计算下一个 `total_round`（读取 round-state.json 当前值 +1，流程首次调用为1）；③解析 `contract_path`（**直接复用 FR-WHREVIEW-002 已定义的 stage→合同映射路由逻辑，并完成 route-decision-{stage}-{review_flow_id}.json 的第一次写入——此时只写入 `stage`/`contract_path`/`contract_hash`/`timestamp`/`input_mode`/`review_flow_id`/`total_round`，`review_input_hash` 留空占位，两阶段写入规则见 FR-WHREVIEW-002"route-decision 记录文件契约"，见 Contract 3；FR-WHREVIEW-007 不重新实现 FR-WHREVIEW-002 的路由逻辑，只消费其解析结果**）。这三个值可写入临时 `tasks/{task-id}/reviews/round-prep.json` 或作为调用返回值，具体落盘形式由实现选择，但调用方必须能确定性获得三者。
- **步骤2（生成 prompt）**：stage 主 agent 拿到步骤1返回的 `review_flow_id`/`total_round`/`contract_path` 后，派生审查提示词生成子代理，子代理使用这三个已知值（而非自行猜测或重新计算）读取 `contract_path` 与当前 materials/diff，生成完整审查提示词文件并写入磁盘，路径按步骤1提供的值拼出。
- **步骤3（执行审查）**：stage 主 agent 再调用 wh-review 执行实际审查，把步骤2产出的 prompt 文件路径传入；wh-review 读取该文件获取 `materials`，并在真正调用 3rd-review 引擎之前基于该实际 `materials` 计算 `review_input_hash`，完成 route-decision-{stage}-{review_flow_id}.json 的第二次写入（就地回填该字段，见 FR-WHREVIEW-002"route-decision 记录文件契约"）；`contract` 字段仍以步骤1中 wh-review 自己解析并已写入 route-decision-{stage}-{review_flow_id}.json 的 `contract_path`/`contract_hash` 为准，不信任、也不重新解析子代理传入或自行推断的 contract 路径，避免 contract 解析出现双重权威。

**触发者**：各 stage 主 agent，步骤1/步骤3触发时机均为该 stage 收尾、准备调用 wh-review 前后；步骤2（派生子代理）发生在步骤1返回之后、步骤3之前。

**输入契约**：步骤1（准备调用）输入 `stage`；步骤2（提示词生成子代理）接收步骤1返回的 `contract_path`/`review_flow_id`/`total_round`，以及当前 materials/diff。

**输出契约**：步骤1返回 `{review_flow_id, total_round, contract_path}` 三元组。步骤2子代理将装配完成的完整审查提示词（含合同规则原文与本轮送审材料）写入 `tasks/{task-id}/reviews/prompt-{review_flow_id}-r{N}.md`（`{review_flow_id}`/`{N}` 均取步骤1返回值，非子代理自行生成或猜测），并把该路径返回给 stage 主 agent；stage 主 agent 自身上下文不直接持有合同/materials 全文，仅持有该文件路径。

**该文件与 Contract 1 三元组的关系（本轮修复，消除与 Contract 1"`mode`/`contract` 必须独立显式字段"的表面冲突，round14 finding）**：`prompt-{review_flow_id}-r{N}.md` 是一份**辅助性、可读性优先的审查提示词文本**，供审查引擎/审查 agent 阅读理解上下文使用，其内容天然是合同原文与 materials/diff 拼装在一起的混合纯文本——**它不是、也不作为 `{mode, contract, materials}` 三元组的唯一权威来源**。wh-review 调用 3rd-review 引擎组装该三元组时：
- `mode` 由 wh-review 自身根据当轮 `round-state.json` 判定值独立赋值（`full`/`incremental`/`same-source`），不依赖对该文件的解析获得；
- `contract` 由 wh-review 独立读取 `route-decision-{stage}-{review_flow_id}.json` 记录的 `contract_path`/`contract_hash`（见 Contract 3）赋值，不依赖对该文件的解析获得；
- `materials` 字段取该文件的纯文本内容（或其子集），该内容可以（且预期会）包含合同原文以便审查方阅读，这不违反 Contract 1 的校验规则——Contract 1 禁止的是"`mode`/`contract` 坍缩进 materials 后不再作为独立字段传递"，而非禁止 materials 文本中出现合同原文。

三者仍作为三个独立字段整体序列化传给 3rd-review 引擎（见 Contract 1"传输方式"），`prompt-{review_flow_id}-r{N}.md` 只负责供给其中的 `materials`。

**Given/When/Then**：
- Given 某 stage 主 agent 已完成本 stage 工作，准备发起审查；
- When 该 stage 主 agent 先以准备模式调用 wh-review，取得 `{review_flow_id, total_round, contract_path}`；
- Then wh-review 在准备调用中完成 `review_flow_id` 分配/复用、`total_round` 计算、`contract_path` 解析（复用 FR-WHREVIEW-002 路由逻辑）并返回三元组；stage 主 agent 拿到三元组后派生审查提示词生成子代理，子代理用这三个已知值（而非自行计算）读取 `contract_path` 与当前 materials/diff，写出 `tasks/{task-id}/reviews/prompt-{review_flow_id}-r{total_round}.md`；stage 主 agent 自身进程内不直接拼接合同/materials 全文；stage 主 agent 再调用 wh-review 执行实际审查并传入该 prompt 文件路径，wh-review 读取该路径文件内容作为 `materials` 字段来源，`mode`/`contract` 两个独立字段仍分别来自 round-state.json/准备调用已写入的 route-decision-{stage}-{review_flow_id}.json，三者一并完成后续调用。

**验收标准**：
- AC-PROMPT-1（落盘路径）：`prompt-{review_flow_id}-r{N}.md` 路径固定为 `tasks/{task-id}/reviews/prompt-{review_flow_id}-r{N}.md`，可机器校验存在性。
- AC-PROMPT-2（行为验证）：给定某 stage 收尾触发审查，断言调用链中存在一次独立子代理派生产出该文件、且该文件在 wh-review 读取之前已落盘（非 stage 主 agent 进程内直接拼接后传参）。
- AC-PROMPT-3（fail-loud）：wh-review 读取 `prompt-{review_flow_id}-r{N}.md` 失败或文件不存在时报错退出，不静默回退为空 materials。
- AC-PROMPT-4（三元组字段独立性，round14 新增）：断言 wh-review 传给 3rd-review 引擎的 `mode`/`contract` 字段值分别可追溯至 `round-state.json`/`route-decision-{stage}-{review_flow_id}.json`，不依赖对 `prompt-{review_flow_id}-r{N}.md` 文本内容的解析提取；即便该文件缺失合同原文的可读格式标记，`mode`/`contract` 字段值仍不受影响。
- AC-PROMPT-5（两段式调用顺序，round16 新增，修复循环依赖）：断言调用链中存在一次先于提示词生成子代理派生的"准备"调用，且该调用返回的 `review_flow_id`/`total_round` 与最终落盘的 `prompt-{review_flow_id}-r{N}.md` 文件名中的值完全一致（即子代理消费的是准备调用返回值，而非自行生成或猜测）；且步骤3实际执行审查时使用的 `contract_path`/`contract_hash` 可追溯至准备调用阶段写入的 route-decision-{stage}-{review_flow_id}.json，与提示词生成子代理无关，验证 contract 解析权威唯一。
- AC-PROMPT-6（route-decision-{stage}-{review_flow_id}.json 两阶段写入，round17 新增）：断言步骤1准备调用结束后落盘的 route-decision-{stage}-{review_flow_id}.json 中 `stage`/`contract_path`/`contract_hash`/`timestamp`/`input_mode` 已非空，但 `review_input_hash` 为空（空字符串或 `null`）；断言步骤3执行审查、真正调用 3rd-review 引擎之前，同一份 route-decision-{stage}-{review_flow_id}.json 的 `review_input_hash` 已回填为基于实际 `materials` 计算的非空 hash 值，且其余五个字段值未被覆盖改变。

---

### FR-THIRDREVIEW-001 3rd-review 精简为纯引擎

**描述**：精简 3rd-review 仓库的 `SKILL.md`（独立兄弟仓库 `$THIRD_REVIEW_REPO_ROOT/SKILL.md`，非 workflowhub 仓库内路径，仓库根目录发现规则见下方"Runner 发现与可执行调用规则"），剥离所有 stage/轮次知识，只保留纯审查引擎接口。

**结构化三元组架构（decision-log D1 口径，非"方案A/纯文本审查包"）**：

wh-review 调用 3rd-review 引擎时，须显式传入结构化三元组 `{mode, contract, materials}`：`mode`（full/incremental/same-source）与 `contract`（本次审查依据的合同内容或路径+hash）必须是独立的显式字段，`materials` 字段可以是 wh-review 组装好的完整审查材料包（文本内容），但不得把 `mode`/`contract` 也坍缩进这份纯文本材料、让 3rd-review 失去对本次审查依据合同与模式的路由感知。

3rd-review 引擎不感知 stage 名称、轮次号等 workflowhub 专属知识（零 stage/轮次知识），但通过显式 `contract`/`mode` 字段获知本次依据哪份合同、以何种模式审查，返回 `{verdict, findings, actual_mode}`。

**集成入口冻结（本条款为本期硬性约束，不再推给 build-plan 阶段决定）**：

wh-review 与 3rd-review 的集成边界，统一收敛为**单次调用接口**：wh-review 显式传入结构化三元组 `{mode, contract, materials}`，3rd-review 引擎完成一次审查后返回 `{verdict, findings, actual_mode}`；一次调用、一次返回，引擎内部无循环、无跨调用状态记忆，**不接收、不解析** stage 名称、轮次号，或任何形态的 `--checkpoint` 字符串前缀参数——contract 由 wh-review 在调用前完全解析装配好，以显式字段传入，3rd-review 引擎不做 stage→合同的路由匹配。这一入口**不是** `standalone.sh` 的内部多轮 revise 循环：wh-review 每一轮自己发起一次这个单次调用，自行维护轮次状态与升级判定；wh-review 绝不调用 `standalone.sh` 让它自己的循环去跑多轮，避免双重循环失控（`standalone.sh` 的 revise 循环历史上存在轮次上限比较缺失的 bug，见 FR-THIRDREVIEW-003）。

3rd-review 引擎当前实现中若仍存在以 `--checkpoint` 字符串前缀匹配路由到 stage 专属合同、或内部硬编码 stage→合同对照表的遗留逻辑，均属本期"瘦身"清理目标，须移除或替换为仅接收显式 `contract` 字段，不再以任何形式解析 stage 名称（与本条款"零 stage/轮次知识"要求一致）。

**调用语义契约（decision-log D1 结构化三元组口径）**：

wh-review 在调用 3rd-review 引擎前，须完成以下装配并满足以下约束：

- **输入**：结构化三元组 `{mode, contract, materials}`——`mode`、`contract` 必须作为独立显式字段传入，不得坍缩进纯文本；`materials` 字段可以是 wh-review 组装好的完整审查材料包（文本内容）。
- **禁止传入**：stage 名称或轮次号（如 `--checkpoint=<stage>`）——stage 身份判断与 stage→合同映射须在调用前由 wh-review 完全完成；3rd-review 引擎不做 stage 路由，但仍通过显式 `contract` 字段获知本次审查依据的合同。
- **输出**：3rd-review 引擎须返回结构化裁决 `{verdict, findings, actual_mode}`；以结构化 `verdict` 字段为主权威判定，进程级快速判断为辅；二者不一致时 fail-loud，不静默择一。
- **结果文件缺失处理**：result-file 缺失或不可解析时，最终裁决统一直接判定为 `escalate_to_human`（不引入 `unknown` 这一裁决态，裁决枚举仍严格为 `pass | revise_required | escalate_to_human`，见 FR-WHREVIEW-004），触发原因须写入报告/日志。
- **轮次控制**：wh-review 须自行维护轮次计数并强制停止，不依赖 3rd-review 引擎侧的轮次上限参数（已知该参数在引擎内部无效，见 Known Gaps GAP-6）。

**Runner 发现与可执行调用规则（本轮新增，落实抽象三元组的真实入口）**：

- **Runner 发现规则**：3rd-review 与 workflowhub 为独立仓库，wh-review 不得硬编码调用方本机的 runner 绝对路径。发现规则复用既有的 `THIRD_REVIEW_RUNNER` 环境变量：设置时取该值作为可执行入口（文件名或路径）；未设置时使用约定默认值 `run-heterologous-review.mjs`，按仓库约定路径（3rd-review 仓库的 `scripts/` 目录）解析。
- **3rd-review 仓库根目录发现规则（兄弟目录约定，本轮修复 round12 硬编码本机路径回归）**：上述"3rd-review 仓库"本身的根目录定位不得硬编码任何开发者本机绝对路径，须遵循兄弟目录约定——3rd-review 仓库默认与 workflowhub 仓库以兄弟目录形式并列检出于同一父目录下。发现规则复用既有的 `THIRD_REVIEW_REPO_ROOT` 环境变量：设置时取该值作为仓库根目录（用于非约定路径场景的显式 override）；未设置时按兄弟目录约定自动推导默认路径——取 workflowhub 仓库根目录的上一级目录下的 `3rd-review` 子目录（等价表达式：`path.resolve(workflowhubRepoRoot, '..', '3rd-review')`）。未设置本身不构成失败条件，仅当最终推导出的默认路径在文件系统上也不存在时才报错，可通过显式设置 `THIRD_REVIEW_REPO_ROOT` override 到实际仓库位置。
- **调用格式**：`node <runner> --diff=<file> --output=<file>`，全部参数为 `--flag=value` 形式，不使用空格分隔多个 token。canonical runner 入口**不含** `--checkpoint` 或任何 stage/round 相关 flag——3rd-review 引擎调用入口对 round/stage 保持零知识，不接受、不解析、也不需要 round 或 stage 相关字段；轮次信息完全由 wh-review 自行维护，不透传给引擎。
  - `--diff`：必填。wh-review 将装配好的结构化三元组 `{mode, contract, materials}` 整体序列化（如 JSON）后写入该文件，作为审查引擎的完整输入——`mode`/`contract` 不是通过独立 CLI flag 传递，而是随 `--diff` 文件内容一并传入。
  - `--output`：必填。3rd-review 引擎本轮审查结果 JSON 的唯一落盘路径，由 wh-review 指定。
  - **canonical 入口不保留 `--checkpoint`**：本条款所述唯一 canonical runner 调用入口（wh-review 唯一使用的入口）不接受、不定义 `--checkpoint` 参数——stage 身份已在 `contract` 字段中体现，不通过 checkpoint 传递。若确需在脱离 wh-review 的独立调试场景中按 stage 前缀路由合同，该能力须落在独立的 wrapper 脚本或 debug-only 脚本中实现，不属于本条款定义的 canonical runner 入口，也不得反向在 canonical 入口上暴露任何 stage/round 参数。
- **超时策略**：wh-review 对每次 runner 调用设置超时上限（可配置，默认值由 build-plan 阶段结合 3rd-review 实际耗时核实），超时未返回则终止子进程。
- **不可达/失败语义**：runner 文件不存在、不可执行、进程以非零码退出、调用超时、或 `--output` 结果文件缺失/不可解析——均归入既有"结果文件缺失处理"规则，统一判定为 `escalate_to_human`，触发原因写入报告/日志，不静默降级为其他裁决。
- **失败路径 raw artifact 合成规则（定死，消除"失败场景引擎未产出 `--output` 却要求下游读取该文件"的自相矛盾，round12 finding）**：上述失败场景（runner 缺失/不可执行、非零退出、超时、`--output` 缺失或不可解析）中，3rd-review 引擎从未产出真实的 `--output` 文件，wh-review 不得假装该文件存在。此时 wh-review 必须自行合成一份"失败元数据"JSON，写入与正常场景完全相同的落盘路径 `tasks/{task-id}/reviews/verdict-{stage}-{review_flow_id}-round-{total_round}.raw.json`（`{review_flow_id}` 定义见 FR-WHREVIEW-003"字段完整性、历史记录与自校验"；见下方"evidence/report 落盘路径规则"），字段至少含：`verdict: "escalate_to_human"`、`synthetic: true`（显式标注本文件由 wh-review 合成、非 3rd-review 引擎真实产出，与真实引擎输出区分）、`failure_reason`（string，枚举 `runner-missing`/`non-zero-exit`/`timeout`/`output-unparseable` 之一，标明具体触发原因）。3rd-review 引擎正常完成审查时产出的真实 `--output` 内容落盘至同一路径，但不含 `synthetic` 字段（或显式为 `false`）。两种来源的文件统一落在同一路径、统一含 `verdict` 字段，下游 gate_cmd/人工审计只需从该路径读取 `.verdict` 字段判定，无需分裂成"读引擎真实产出"与"读失败元数据"两套逻辑，仅内容来源（引擎真实产出 vs wh-review 合成）不同。data-contracts.md Contract 2、plan.md、tasks.md 中对该文件的引用均以本条款为唯一权威来源，不得另行定义或产生歧义。
- **结果 schema**：`--output` 文件为单轮 JSON，至少含 `verdict`、`findings`（数组，元素含 `severity`/`file`/`line`/`issue`/`recommendation` 等字段）字段；引擎版本可能另含 `threatAuditor` 等辅助字段，wh-review 至少解析 `verdict` 与 `findings` 作为裁决依据，其余字段原样保留供追溯（示例参照当前命名规则下的产出路径 `tasks/{task-id}/reviews/verdict-build-spec-{review_flow_id}-round-1.raw.json`，权威路径定义见下方"evidence/report 落盘路径规则"）。
- **evidence/report 落盘路径规则（定死，权威声明，本轮修复 round7-10 反复出现的跨 stage 覆盖缺口；本轮进一步修复 round14 同 stage 跨流程覆盖缺口）**：`--output` 指向的单轮原始 JSON 落在任务目录下的证据路径 `tasks/{task-id}/reviews/verdict-{stage}-{review_flow_id}-round-{total_round}.raw.json`（`total_round` 为 FR-WHREVIEW-003 定义的总轮次计数器，由 wh-review 自行维护，不透传给 3rd-review 引擎；`{stage}` 为触发本次审查的 stage 标识，取值 make-decision/build-spec/build-plan/build-code/verify-code 之一；`{review_flow_id}` 为本次审查流程的稳定唯一 ID，定义与生成规则见 FR-WHREVIEW-003"字段完整性、历史记录与自校验"）。**加入 `{stage}` 维度的原因**：同一 `task_id` 下不同 stage 各自独立发起审查流程时，`total_round` 均从1重新计数（见 data-contracts.md Contract 4 版本兼容说明），若文件名不含 stage 维度，后一个 stage 的 round-1 证据文件会覆盖前一个 stage 的同名文件，导致历史证据丢失；加入 `{stage}` 后消除了**跨 stage**的撞车风险。**加入 `{review_flow_id}` 维度的原因（round14 finding，订正此前"加入 `{stage}` 后彻底消除该文件名撞车风险"的错误断言）**：仅有 `{stage}` 维度并不能消除**同一 stage 先后发起多次独立审查流程**时的撞车风险——同一 stage 的第二次审查流程发起时，`total_round` 同样从1重新计数（见 FR-WHREVIEW-001"命名规则"），若无 `{review_flow_id}` 区分，会覆盖同一 stage 第一次审查流程遗留的 `round-1` 证据文件。加入 `{review_flow_id}` 后，跨 stage 与同 stage 跨审查流程两类撞车风险均被消除。plan.md/tasks.md/data-contracts.md 中所有对该证据文件路径的引用均以本条款为唯一权威来源，不得另行定义或改写。render-review-report.mjs 渲染后的最终报告落在 `tasks/{task-id}/reports/`（与 AC1-3、AC4-2 落盘规则一致，文件名本身已含 `<stage>`/`<review_flow_id>` 维度，见 FR-WHREVIEW-001/FR-WHREVIEW-004）。

**Given/When/Then**：
- Given wh-review 接收到 stage 标识和待审材料；
- When wh-review 读取对应合同文件、将合同源路径 + hash（或版本锚点）写入 route-decision 记录文件，再组装显式的 `mode`、`contract` 字段与 `materials` 材料包，调用 3rd-review 引擎；
- Then 3rd-review 引擎依据显式 `mode`/`contract` 字段与 `materials` 内容完成审查并返回结构化 `{verdict, findings, actual_mode}`，wh-review 以结构化 verdict 字段为准裁决，全程不感知 stage 名称或轮次号。

**验收标准**：
- AC5-1：3rd-review SKILL.md 不含 stage 名称枚举（make-decision / build-spec 等）。机器校验不依赖对 SKILL.md 文本做"先排除含'不接受/不解析/不需要/不含/零知识/剥离'等说明性词的整行，再对剩余行模糊搜索 stage/round/checkpoint 概念词"式关键词过滤——该方案按整行匹配排除，真实违规代码行只要与说明性词凑巧同行即会被一并放过（见 round7 审查发现）。改为直接对 3rd-review 调用入口（`run-heterologous-review.mjs`/`standalone.sh`）做 CLI 契约集成测试：断言其只接受 `--diff=<file> --output=<file>` 两个参数，传入 `--stage`/`--round`/`--checkpoint` 等多余参数后断言被忽略或触发非零退出+明确报错；并对源码中实际的 `yargs`/`process.argv` flag 定义/解析代码行做精确 grep（而非对文档整行做模糊关键词扫描），断言命中的 flag 名集合恰为 `{diff, output}`。
- AC5-2：3rd-review SKILL.md 不含轮次管理逻辑（round/Delta Package 等）。机器校验方式同 AC5-1，以 3rd-review 调用入口的 CLI 契约集成测试 + 源码精确 flag 定义 grep 为准，不再使用对 SKILL.md 文本的关键词过滤方案。
- AC5-3（行为验证）：给定任意 stage 标识调用 wh-review，wh-review 传给 3rd-review 引擎的调用中显式包含非空 `mode` 与 `contract` 字段（未坍缩进 materials 纯文本），且不含 stage 名称或轮次号——可通过集成测试或日志追踪验证（辅证：调用日志 grep 可见独立的 mode/contract 字段，且不含 stage 名称枚举）。
- AC5-4（行为验证）：给定触发强制停止条件（如达到轮次上限），wh-review 实际停止调用 3rd-review 引擎，不进入下一轮——可通过轮次状态文件验证（AC-D10）；辅证：wh-review 实现含独立轮次计数器，不依赖引擎内部轮次上限参数。

---

### FR-THIRDREVIEW-002 §7 改写

**描述**：改写 build-code/SKILL.md 中的 §7，删除所有流程步骤和 if/else 逻辑，仅保留对 §13 的概念性导读。原 §7 中的降级规则不得删除，需迁移保留为 §13 的补充说明。

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

### FR-THIRDREVIEW-003 standalone.sh revise 循环机制整体删除

**描述**：3rd-review 仓库的 `standalone.sh`（第206-413行）历史遗留的 revise 循环机制——即单次调用内部根据 verdict 结果自动判断"是否继续下一轮"并 while/for 循环重跑审查——本期予以**彻底删除**，而非限流缓解。该循环历史上曾因轮次上限比较缺失而失控（已实测复现：一次跑到44轮才因意外崩溃停止，另一次连续跑6轮未停被人工中断），但本期不修复循环本身、不加回轮次上限比较，而是从架构上删除该循环，彻底消除此类风险。

删除后的行为：`standalone.sh`（或任何其他承担 3rd-review 调用入口职责的 runner）每次调用只产出一轮审查结果并返回，不再包含"verdict 不通过就自动进入下一轮"的循环逻辑。若需要下一轮审查，须由外部调用方（wh-review 或其他 workflowhub 主 agent）在本次调用结束、拿到本轮 verdict 之后，根据本轮结果重新设计/组装下一轮审查提示词与材料包，显式发起一次新的独立调用触发——3rd-review 引擎自身不感知、也不判断"是否还有下一轮"。

**来源标注**：本条经用户在 issue 评论（2026-07-06）明确批准纳入本期范围（原范围外的旧 bug 修复），并给出比"限制循环次数"更强的指令——不是限流，而是彻底删除循环机制；decision-log 文件本身的批准记录由用户本人另行补录，本 FR 暂以 issue 决议为准。

**Given/When/Then**：
- Given 3rd-review 单次调用（无论通过 `standalone.sh` 还是其他 runner 入口）返回 `verdict=revise_required`；
- When 该次调用进程返回；
- Then 进程即终止，不存在任何基于该 verdict 判断"是否继续下一轮"的循环体自动发起下一次审查；下一轮由外部调用方另行显式发起。

**验收标准**：
- AC-THIRDREVIEW3-1（静态验证）：`standalone.sh`（或本期承担 3rd-review 调用入口职责的等价 runner 脚本）代码中，审查调用入口函数内不存在以 verdict 结果（如 `revise_required`）为条件的 while/for 循环包裹审查调用逻辑；可通过代码路径静态检查/grep 验证：入口函数体内搜索不到"以 verdict 为循环条件"的循环结构（如以 `revise_required` 为条件的 while/for、或循环体内依据 verdict 决定 `continue` 进入下一轮等模式）。
- AC-THIRDREVIEW3-2（行为验证）：给定一次单次调用返回 `verdict=revise_required`，断言该次进程返回后即终止（不出现同一进程内自动发起的第二轮调用记录，不出现循环产生的第二份 `--output` 结果文件）；下一轮审查须由外部调用方在本次调用结束后另行显式发起，方视为通过。

---

### FR-THIRDREVIEW-004 threatAuditor 语义误判防护

**描述**：3rd-review 引擎（或其 schema-drift/threatAuditor 检测逻辑）在判定某处文本是否构成"违反契约的 blocking 问题"时，不得仅凭关键词黑名单（如文本中出现 `soft-fail`/`optional`/`warning-only` 等词汇）就无条件判定为 blocking。命中上述词汇本身不构成充分证据，须结合上下文语义与所在设计意图（例如 `CONSTITUTION.md` F3"物理事实靠机器校验但不阻断"、Q1"记事实而非阻断"等宪法条款所允许的合法非阻断式记录场景）综合判断该处是否真的违反契约，避免把合法的"质量事实记录不阻断审查主流程"设计误判为 blocking。

同时，该语义判断不得反向退化为"整体关闭该检查项"来敷衍——即便文本不含上述敏感词，只要实质违反契约（如真的跳过必要校验、真的静默降级裁决），threatAuditor 仍须正确判定为 blocking。

**Given/When/Then**：
- Given 一段包含 `soft-fail`/`optional`/`warning-only` 等词汇，但语义符合"质量事实记录不阻断审查主流程"设计意图（如仅描述指标写入失败时记录警告、不阻断审查裁决本身）的合法文本；
- When threatAuditor 对该文本执行 schema-drift/blocking 判定；
- Then threatAuditor 不判定该处为 blocking。
- Given 一段真实违反契约的文本（即便不含上述敏感词，例如实质描述了跳过必要校验或静默降级审查裁决）；
- When threatAuditor 对该文本执行判定；
- Then threatAuditor 仍正确判定该处为 blocking。

**验收标准**：
- AC-THIRDREVIEW4-1（行为验证）：给定包含 `soft-fail`/`optional`/`warning-only` 等词汇、但语义符合 F3/Q1 合法非阻断设计意图的文本样例，threatAuditor 断言不判定为 blocking；断言：判定结果中不含该样例对应的 blocking 项。
- AC-THIRDREVIEW4-2（行为验证）：给定不含上述敏感词、但实质违反契约（真实跳过必要校验或静默降级裁决）的文本样例，threatAuditor 断言仍正确判定为 blocking；断言：判定结果中含该样例对应的 blocking 项，不因"整体关闭该检查"而漏判。

---

### FR-STAGE-001 5 个 stage 收尾统一（回归保护项，非待改造项）

**描述**：decision-log D6 已确认 5 个 stage 的 SKILL.md 收尾步骤统一调用 `docs/human-brief-template.md` 的现状已满足要求，不是本期待改造的缺陷。本条 FR 的定位是回归保护：本期其他改动（尤其 §7 改写、wh-review 接入）不得破坏这一现状统一调用。

**Given/When/Then**：
- Given 任意 stage（如 build-plan）完成主体工作，且本期改动已落地；
- When 执行收尾步骤；
- Then 仍然调用 `docs/human-brief-template.md` 生成标准收尾摘要，不因本期改动引入自定义收尾逻辑或退化为不一致实现。

**验收标准**：
- AC7-1（回归验证）：逐一核实 make-decision/build-spec/build-plan/build-code/verify-code 共 5 个 stage 的 SKILL.md 收尾段；断言：5 个中必须全部 5 个仍含对 `docs/human-brief-template.md` 的调用引用，0 个允许回退——发现任意 1 个 stage 收尾段缺失该引用即判不通过。
- AC7-2（回归验证）：逐一核实上述 5 个 stage 的收尾实现；断言：5 个中必须全部 5 个使用统一的 `human-brief-template.md` 调用，不存在任何与其不一致的自定义收尾模板——发现任意 1 个 stage 使用不一致的自定义收尾逻辑即判不通过。

---

### FR-D2-001 D2 人工确认门

**描述**：make-decision / build-plan / verify-code 的 pass 路径须触发人工确认，不得自动推进。build-spec / build-code 的 pass 路径可自动推进（auto-advance）。除三值裁决枚举（`pass`/`revise_required`/`escalate_to_human`）外，wh-review 须在轮次状态文件中额外落盘一个机器可读的显式状态字段 `post_review_action`，取值为 `await_human_confirmation`（pass 但停在人工确认门，等待人工批准）或 `auto_advance`（pass 且允许自动推进），用于 orchestrator 重启后可确定性判断本次 pass 裁决应暂停还是继续，不依赖裁决枚举本身区分这两种 pass 语义。

**post_review_action 赋值规则**：
- `verdict=pass` 且 `stage ∈ {make-decision, build-plan, verify-code}` → `post_review_action=await_human_confirmation`
- `verdict=pass` 且 `stage ∈ {build-spec, build-code}` → `post_review_action=auto_advance`
- `verdict=revise_required` 或 `verdict=escalate_to_human` → `post_review_action` 字段不适用（留空或不写入），因该字段仅用于区分 pass 语义下的两种推进策略。

**人工批准后的恢复机制**：当 `post_review_action=await_human_confirmation` 时，orchestrator 须暂停在人工确认门，等待 human orchestrator 显式批准；批准动作须落盘为一份人工确认 artifact（路径 `tasks/{task-id}/reviews/human-confirmation-{stage}-{review_flow_id}-{total_round}.json`，`{review_flow_id}` 为本次审查流程的稳定唯一 ID，定义与生成规则见 FR-WHREVIEW-003"字段完整性、历史记录与自校验"——加入该维度是为了避免同一 stage 先后发起多次审查流程时因 `total_round` 复位而覆盖前一次流程遗留的批准态 artifact；至少含 `approved_by`、`approved_at`、`stage`、`review_flow_id`、`total_round` 字段）。orchestrator 重启后须先校验轮次状态文件的 `stage` 字段与自身当前 stage 一致（不一致须 fail-loud 报错并终止，不得静默假定该文件属于当前 stage，见 FR-WHREVIEW-003"字段完整性、历史记录与自校验"条款），校验通过后再读取其中的 `post_review_action` 字段：取值为 `auto_advance` 则直接推进；取值为 `await_human_confirmation` 则检查对应人工确认 artifact 是否已存在且 `stage`/`review_flow_id`/`total_round` 与当前一致——存在且匹配则视为已批准、恢复推进，不存在则继续停留在人工确认门，不得自动推进替代人工批准。

**Given/When/Then**：
- Given wh-review 对 make-decision 返回 verdict=pass；
- When stage agent 准备推进；
- Then wh-review 将 `post_review_action` 落盘为 `await_human_confirmation`，触发人工确认流程（挂起等待 human orchestrator 明确批准并落盘人工确认 artifact），不自动进入下一 stage。

**验收标准**：
- AC8-1（行为验证，主验收）：给定一个 verdict=pass 的模拟审查结果，make-decision / build-plan / verify-code 的执行流程实际停在人工确认门——即流程暂停、等待人工回应，不自动调用下一阶段；轮次状态文件中 `post_review_action` 字段落盘为 `await_human_confirmation`。可通过集成测试或端到端冒烟复现。
- AC8-2（行为验证，主验收）：给定一个 verdict=pass 的模拟审查结果，build-spec / build-code 的执行流程实际自动推进到下一阶段，无需人工干预，且 stage-result 状态正确落盘；轮次状态文件中 `post_review_action` 字段落盘为 `auto_advance`。可通过集成测试或端到端冒烟复现。
- AC8-3（行为验证，辅证 AC8-1）：给定 verdict=pass 但对应人工确认 artifact（`human-confirmation-{stage}-{review_flow_id}-{total_round}.json`）尚未生成的场景，make-decision / build-plan / verify-code 的推进判断（T023a 消费 T011b 的读取函数）实际返回"停在确认门/不推进"，不因 verdict=pass 而绕过批准态校验——复用 AC8-4 的重启恢复行为测试用例验证实际控制流是否经过批准态 artifact 存在性判断，不依赖对 SKILL.md 源码做字符串字面量搜索。
- AC8-4（行为验证，orchestrator 重启恢复）：给定 `post_review_action=await_human_confirmation` 且对应人工确认 artifact 尚未生成，模拟 orchestrator 重启；断言：orchestrator 读取轮次状态文件后仍停在人工确认门，不自动推进。给定人工确认 artifact 已生成且 `stage`/`review_flow_id`/`total_round` 与当前一致，模拟 orchestrator 重启；断言：orchestrator 恢复推进到下一 stage。给定轮次状态文件的 `stage` 字段与调用方当前 stage 不一致（本轮新增），模拟 orchestrator 重启；断言：orchestrator fail-loud 报错退出，不采用该文件内容恢复推进，且不因 `post_review_action` 或人工确认 artifact 存在而绕过该项前置校验。

---

### FR-INTAKE-001 intake 合同覆盖 C1-C6

**描述**：wh-review 的 intake（make-decision 专属）合同实现须覆盖 C1-C6 全部判据，且合同机器可消费字段非空。

**C1-C6 判据**（来源 decision-log D4）：
- C1：原始需求原文引用（至少一处，不可仅概括）
- C2：决策有证据支撑（每条"选X非Y"结论需附至少一条具体理由，如技术约束/风险评估/用户表态；裸断言视为不通过）
- C3：范围边界明确划分 in/out（各至少一条且互不重叠）
- C4：无悬挂开放问题（0 个未解决或已标注不阻断+跟进）
- C5：方向与上游输入一致（方向结论需覆盖用户明确要求全部条目，无未授权范围扩张）
- C6：决策产物格式可机器消费（需含 decision/scope.in/scope.out/open_questions 等标准字段且非空）

**验收标准**：
- AC9-1（静态验证）：intake 合同文件中 C1、C2、C3、C4、C5、C6 六个判据各有对应字段或检查项，缺任意一项即不通过；可 grep 合同文件验证。
- AC9-2（行为验证，实例级）：intake 合同文件本身只需定义对 `decision`、`scope.in`、`scope.out`、`open_questions` 四个字段的检查规则（合同文件本身不要求填有具体实例值，字段类型定义见 data-contracts.md Contract 7）；给定一个被审的 make-decision 产物实例，校验：`decision` 字段存在且为非空字符串（`""` 或缺失均视为不通过）；`scope.in`、`scope.out` 字段存在且均为非空数组（数组本身非空，且数组内每个元素均为非空字符串，`[]` 或缺失均视为不通过）；`open_questions` 字段存在且为可机器 parse 的数组（允许为空数组，若非空则每个元素须为非空字符串）；四字段均可机器 parse；断言：对实例文件运行合同定义的检查规则，四个字段全部通过。

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
- AC10-2（行为验证）：给定一次 verify-code 执行后，fresh-capture 记录的 `git_sha` 与当前 HEAD 一致，且 `evidence` 字段中引用的 build-code 产物路径均存在于实际文件系统；断言：记录的 `git_sha` 与执行时刻代码库的当前提交一致，且 evidence 字段引用的每个产物路径在文件系统中均存在，可通过机器验证或人工检查确认；具体验证脚本/命令示例不在本 spec 正文列出，留待后续 test-strategy 文档给出。

---

### FR-TEST-001 端到端测试方案

**描述**：build-plan 阶段须设计可执行测试方案，verify-code 阶段执行验证，覆盖 wh-review + 精简后 3rd-review 组合。

**Given/When/Then**：
- Given 全流程实现完成；
- When 运行端到端冒烟用例；
- Then 至少一个完整 stage（如 build-spec）调用 wh-review，返回正确 stage 合同路由日志，可本地复现。

**验收标准**：
- AC11-1：测试方案文档（test-strategy.md 或等价）存在且含端到端冒烟用例描述。
- AC11-2（行为验证）：make-decision/build-spec/build-plan/build-code/verify-code 共 5 个 stage 中，至少 1 个（1 out of 5）完整端到端冒烟用例可在 workflowhub 本地实际跑通（进程正常退出、生成报告文件、裁决字段非空）；断言：其余未纳入本轮冒烟覆盖的 stage 不得因 wh-review/3rd-review 本期接口变更而在主流程中报错或阻塞——冒烟覆盖数 <1，或任意 1 个未覆盖 stage 因接口变更报错，均判不通过。

---

## 5. 非功能需求

- **NFR-1 可追踪性**：每次审查触发必须产生可持久化的轮次状态记录和审查报告，工具调用日志可回溯。
- **NFR-2 fail-loud**：stage 标识缺失、合同文件缺失等 wh-review 自身代码缺陷/配置错误场景，须非零退出+明确错误信息，不静默降级。**3rd-review 调用失败（runner 不存在/非零退出/超时/`--output` 缺失或不可解析）不适用本条**——该类场景按 FR-THIRDREVIEW-001 定义统一映射为 `escalate_to_human` 裁决，wh-review 自身以退出码 0 正常返回该裁决结果（视为审查流程的正常终态之一，而非 wh-review 自身故障），不要求非零退出。
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

**轮次状态字段**（最小集）：`heterologous_round`、`same_source_round`、`total_round`（三者定义见 FR-WHREVIEW-003）、`mode`（full/incremental/same-source）、`actual_mode`（3rd-review 引擎实际执行的模式，用于与请求的 `mode` 比对，降级为 same-source 时须显式体现为 `actual_mode=same-source`）、`verdict`、`report_path`、`blocking_count`、`fingerprint_repeated`、`post_review_action`（D2 人工确认门推进信号，定义见 FR-D2-001，随本文件一同落盘，字段全集见 data-contracts.md Contract 4）

---

## 6.5 指标与统一执行记录（CONSTITUTION.md S4/F6）

wh-review 复用仓库已有的统一执行记录机制 `metrics/collector.mjs`（`recordSkeleton` / `updateOwnResult`，M4 十核心字段：`execution_id`、`skill_or_stage`、`stage`、`skill_version`、`executed`、`tokens`、`duration_ms`、`rework_rounds`、`human_intervention`、`friction_ref`），不新增独立指标底座。

- 调用时机：wh-review 每次被 stage 调用触发审查前，调用 `recordSkeleton` 落一条骨架记录；本轮审查裁决完成后，调用 `updateOwnResult` 写入实测值。写入失败须记录警告但不阻断审查流程本身（与各 SKILL.md 现有约定一致）。**设计意图说明**：这是有意为之的非阻断式事实记录门（fact-recording gate，仅记录事实、不阻塞审查主流程推进），不是校验疏漏——依据 `CONSTITUTION.md` F3（物理事实靠机器校验但不阻断）与 Q1（记事实而非阻断），质量相关的物理事实（此处为指标写入）应自动采集并浮现，但采集本身不应反过来卡死审查主流程；记录失败只代表"事后可见的遗漏"，结果记入质量事实契约，推进判断由人工基于记录决定，不代表审查裁决本身可以被降级或跳过。
- wh-review 需落入 M4 字段的关键信息：轮次状态中的 `total_round` 落入 `rework_rounds`；本轮审查耗时落入 `duration_ms`；是否触发 `escalate_to_human` 落入 `human_intervention`；`verdict`/`mode` 等 M4 字段之外的信息保留在 wh-review 自身的轮次状态文件中，作为 metrics 记录之外的可回溯锚点。

**验收标准**：
- AC-METRICS-1（静态验证）：wh-review 实现中存在对 `metrics/collector.mjs` 的 `recordSkeleton`/`updateOwnResult` 调用，不手写独立的指标文件或另建指标底座；可 grep 验证。
- AC-METRICS-2（行为验证）：给定一次完整审查调用完成后，对应 metrics 记录含 M4 十核心字段全集，且 `rework_rounds` 与本次轮次状态文件中的 `total_round` 一致。

---

## 7. 影响范围

本章描述本需求会改变或破坏的既有业务行为与用户场景（文件路径见§9"不做"小节）。

### 7.1 审查触发方式变化

- **当前行为**：5 个 stage（make-decision/build-spec/build-plan/build-code/verify-code）各自直接调用 3rd-review，传 `--checkpoint=<stage>` 或不传，导致路由失败回退通用合同，stage 专属合同从未生效。
- **变更后行为**：5 个 stage 一律通过 wh-review 触发审查；wh-review 完成合同路由并记录 route-decision，3rd-review 引擎不感知 stage 身份。现有直接调用 3rd-review 并传 stage 参数的调用方须迁移到 wh-review。

### 7.2 pass 后推进与人工确认规则变化

- **当前行为**：make-decision/build-plan/verify-code 三个 stage 在 verdict=pass 后是否停在人工确认门、行为不一致或未实现。
- **变更后行为**：make-decision/build-plan/verify-code 在 verdict=pass 后必须停在人工确认门，等人工明确回应才推进；build-spec/build-code 在 verdict=pass 后自动推进，不等人工。违反该规则的现有逻辑须修正。
- **注记（round14 专项设计确认）**：经 round14 专项设计复核，已确认 build-spec/build-code 自动推进、make-decision/build-plan/verify-code 人工确认门的划分符合要求，此范围维持不变，不做实质改动。

### 7.3 报告落盘与轮次追踪行为变化

- **当前行为**：审查报告基本未生成，审查完成与否无法追踪，无轮次状态记录。
- **变更后行为**：每次审查须落盘报告（含 verdict/findings/heterologous_round/same_source_round/total_round/mode 等字段），全量审查在首轮执行，后续轮次按指纹判断是否可增量；wh-review 强制维护轮次上限，不依赖引擎侧参数。

### 7.4 3rd-review 单次调用语义变化

- **当前行为**：build-code/SKILL.md §7 含 stage/轮次路由逻辑，调用方需了解其内部合同路由机制。
- **变更后行为**：3rd-review 精简为纯引擎，接收完整审查包、返回结构化 verdict，不感知 stage 或轮次。单次调用语义详见"调用语义契约"小节（见 FR-THIRDREVIEW-001）。调用方迁移到 wh-review 后不再直接依赖 3rd-review 内部路由。

### 7.5 既有调用方迁移影响

- 任何已按 `--checkpoint=<stage>` 形态直接调用 3rd-review 的代码，切换后须改为调用 wh-review 并传 stage 标识；wh-review 负责装配合同和审查包。
- 保留现状：5 个 stage SKILL.md 收尾已统一调用 `docs/human-brief-template.md`，本次不做新的行为改造，只新增回归保护（T023b 行为级验证），确保 wh-review/D2 门接入不破坏这条既有统一调用路径。

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
| make-decision intake 合同判据 | 无结构化判据，intake 合同未强制覆盖具体检查项 | 收紧为 C1-C6 强制卡口，六项判据缺任意一项即不通过（见 FR-INTAKE-001） | 破坏性（校验收紧） |
| verify-code 合同判据 | 无结构化新鲜性判据 | 收紧为 F1-F6 强制卡口，六项判据缺任意一项即不通过（见 FR-TESTACCEPTANCE-001） | 破坏性（校验收紧） |
| build-code §7/§13 调用语义 | §7 含 stage/轮次路由 numbered step 和 if/else 分支逻辑，调用方需了解内部路由机制 | §7 精简为对 §13 的概念性导读，不含任何流程步骤/条件分支，单次调用语义详见 §13（见 FR-THIRDREVIEW-002、7.4节） | 破坏性（接口/文档语义变更） |
| 3rd-review 返回结果文件缺失/不可解析时的处理路径 | 无此路径，result-file 缺失/不可解析时行为未定义 | result-file 缺失或不可解析时最终裁决直接判定为 `escalate_to_human`（不新增 `unknown` 裁决态）；轮次状态文件与报告记录须体现该次裁决为升级人工，日志/报告中标注触发原因，等待人工介入 | 新增能力（fail-loud 路径） |

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

- AC-D1（行为验证）：给定 wh-review 调用 3rd-review 引擎的实际调用记录，校验调用参数中不含 `stage` 或 `round` 字段（须遵守 FR-THIRDREVIEW-001"禁止传入 stage 名称或轮次号"的约定）；且 3rd-review 引擎返回的结果结构中不含任何 stage 枚举字段。辅证：3rd-review SKILL.md grep 不含 stage 名称枚举、不含轮次管理逻辑。
- AC-D2（行为验证）：对精简后的 build-code/SKILL.md §7，执行端到端调用，调用方无需感知 §7 中的任何 step 序号或 if/else 分支即可完成调用。辅证：§7 文本 grep 不含 numbered step / if/else 逻辑。
- AC-D3：wh-review/SKILL.md 存在 stage→合同映射表（5 条全覆盖）
- AC-D4（行为验证）：5 个 stage 传入对应标识后，实际调用流程中 route-decision 记录文件含对应专属合同源路径 + hash（非通用合同），且该记录与实际审查包内容一致——可通过集成测试或日志追踪验证（辅证：可机器 grep route-decision 文件内容）。
- AC-D5（行为验证）：同 AC8-1——给定 verdict=pass，make-decision / build-plan / verify-code 执行流程实际停在人工确认门。辅证：代码/文档可查 pass 路径不含自动推进逻辑。
- AC-D6（行为验证）：给定一次完整的 stage 收尾执行，5 个 stage 均实际生成符合 human-brief-template.md 模板结构的产出物；辅证：5 个 stage SKILL.md 收尾段均含 human-brief-template.md 引用。
- AC-D7：端到端冒烟用例可本地跑通，覆盖 wh-review + 精简 3rd-review 组合
- AC-D8：intake 合同覆盖 C1-C6 全部判据字段
- AC-D9：test-acceptance 合同覆盖 F1-F6 全部判据字段
- AC-D10：轮次状态文件存在，记录 heterologous_round / same_source_round / total_round / mode / actual_mode / verdict / report_path / blocking_count / fingerprint_repeated / post_review_action / stage / history（字段全集与类型定义见 data-contracts.md Contract 4；`stage`/`history` 为本轮修复新增字段）
- AC-D10.1（行为验证）：给定一次因升级人工条件不满足而降级为同源模式的审查轮次，该轮的轮次状态文件与报告 Metadata 章节均须显式展示 `actual_mode=same-source`；断言：两处文件均可 grep 到该字段且取值一致。
- AC-D10.2（行为验证，本轮新增）：给定连续多轮审查，每轮结束后轮次状态文件的 `history` 数组须追加一条快照（不覆盖已有条目），数组长度随轮次单调递增；断言：`jq '.history | length'` 在第 N 轮结束后返回值 = 该 stage 当次审查流程已完成的轮次数。给定轮次状态文件被读取用于恢复/升级判定，断言：读取方先校验 `stage` 字段与自身当前 stage 一致，不一致即 fail-loud，细则同 AC3-5/AC8-4。
- AC-D11（静态验证）：wh-review 复用 `core/task-dir-parser.mjs` 解析任务目录路径，不硬编码、不另造解析逻辑（见 FR-WHREVIEW-001 AC1-4）。
- AC-D12（静态验证）：wh-review 复用 `metrics/collector.mjs` 统一执行记录机制记录审查指标，不新增独立指标底座（见 §6.5 AC-METRICS-1/2）。
- AC-D13（静态+行为验证）：`standalone.sh`（或等价 runner 入口）审查调用入口函数内不存在以 verdict 为条件的循环包裹逻辑，单次调用只产出一轮结果即返回，不自动发起下一轮（见 FR-THIRDREVIEW-003 AC-THIRDREVIEW3-1/2）。
- AC-D14（行为验证）：threatAuditor 对含 `soft-fail`/`optional`/`warning-only` 等词汇但语义合法（符合 F3/Q1 非阻断设计意图）的文本不误判 blocking；对不含上述词汇但实质违反契约的文本仍正确判定 blocking（见 FR-THIRDREVIEW-004 AC-THIRDREVIEW4-1/2）。

### 未决问题

- **OPEN-1**（已按 decision-log D1 结构化三元组口径解决）：原问题为"3rd-review 靠 --checkpoint 做 stage 路由/合同匹配，参数文档不一致"。本期方案从根本上消除该问题：wh-review 完成 stage→合同映射后，调用 3rd-review 引擎时显式传入 `{mode, contract, materials}` 三元组；3rd-review 不做 stage 路由、不感知 stage 名称或轮次号，但通过显式 `contract` 字段获知本次审查依据的合同，路由不一致问题不复存在。**待跟进事项**：`standalone.sh` 实际调用参数/返回结构与 3rd-review SKILL.md 文档描述存在不一致，当前范围不阻断，build-plan 阶段需为此建 tracking issue 跟踪。

---

## Known Gaps

- 5 套 stage 专属合同从 agenthub verifiers/vibecoding 搬迁后可能需要适配 workflowhub 数据结构，具体适配点在 build-plan 阶段确认。
- （已在本期 spec 解决，不再是 gap）render-review-report.mjs 的6章结构名称未在 decision-log 中明确列出；本期 spec 已在 FR-WHREVIEW-004"报告章节结构"小节直接定案6章名称、顺序及每章最小必要信息点作为验收基线，不再依赖 build-plan/SKILL.md 补充定义（build-plan 阶段仅需核实渲染实现细节，不得改变本基线）。
- `docs/human-brief-template.md` 是否已存在未经确认，若不存在须作为前置依赖在 build-plan 中标出。
- （spec-clarify 补充）**GAP-4**（已在本期 spec 解决）：降级触发条件中"大量"已在 FR-WHREVIEW-003 中明确为"单轮 blocking_count ≥ 3 或 fingerprint_repeated=true，连续3轮成立"。
- （spec-clarify 补充）**GAP-5**（已在本期 spec 解决）：同源切换与升级人工的优先级已在 FR-WHREVIEW-003 中明确：升级人工判定先于同源切换判定（第3轮末先判升级条件，满足则直接升级，不进入第4轮同源模式）。
- （3rd-review 实测发现）**GAP-6**（已在本期 spec 解决，不再是 gap）：3rd-review 引擎内部的轮次上限参数实测不生效（`standalone.sh` revise 循环从不比较 `ROUND` 与 `MAX_REVISE_ROUNDS`），revise_required 时可能无限循环。本期已通过两条 FR 解决：集成边界层面，wh-review 只走 `run-heterologous-review.mjs` 单次调用接口、自行维护轮次计数并强制停止，不依赖 3rd-review 内部循环（见 FR-THIRDREVIEW-001"集成入口冻结"小节、AC5-4）；根治层面，本期不采取"加回轮次上限比较"这种限流缓解式修复，而是将 `standalone.sh`（或等价 runner 入口）自身的 revise 循环机制整体删除——每次调用只产出一轮结果即返回，下一轮由外部调用方显式发起，从架构上彻底消除无限循环风险（见 FR-THIRDREVIEW-003）。
