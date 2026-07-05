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
  5. 搬迁 agenthub `verifiers/vibecoding/` 的 5 套 stage 专属合同到 wh-review，逐步扩充
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
- 搬迁 agenthub verifiers/vibecoding 5 套 stage 专属合同（逐步扩充到位）
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

**Given/When/Then**：
- Given 任意 stage agent 发起审查请求（stage 标识已传入）；
- When wh-review 被调用；
- Then wh-review 完成 stage→合同查找、调用 3rd-review、轮次状态管理、报告渲染，返回裁决结果。

**验收标准**：
- AC1-1：`skills/wh-review/SKILL.md` 存在且包含 stage→合同映射表（5 条）。
- AC1-2：wh-review 调用时若 stage 标识缺失，fail-loud 报错，不静默回退到通用合同。
- AC1-3：每次审查完成后报告落盘路径在任务目录下可查。

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
- AC2-1：5 套合同文件均存在于 `skills/wh-review/contracts/`（或同等路径）。
- AC2-2：传入任意已知 stage 时，合同路由日志显示对应专属合同路径（非通用合同）。
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

**Given/When/Then**：
- Given 第1轮审查已完成，verdict=revise_required；
- When 发起第2轮审查；
- Then wh-review 构造 Delta Package，以 `mode=incremental` 调用 3rd-review。

**验收标准**：
- AC3-1：轮次状态文件（或字段）可读，记录当前轮次号和模式。
- AC3-2：第2轮+ Delta Package 存在且仅包含变更材料。
- AC3-3：连续3轮每轮 `blocking_count ≥ 3` 或 `fingerprint_repeated=true` 时，触发 `escalate_to_human` 裁决（机器可验证：第3轮末升级条件满足时不进入第4轮）。
- AC3-4：第3轮末升级条件满足时，裁决为 `escalate_to_human`，不进入同源模式（优先级规则可机器验证）。

---

### FR-WHREVIEW-004 裁决枚举与报告渲染

**描述**：wh-review 的最终裁决仅含三种枚举值，报告由 render-review-report.mjs 渲染后落盘。

裁决枚举：`pass` / `revise_required` / `escalate_to_human`

**Given/When/Then**：
- Given 3rd-review 返回 findings；
- When wh-review 综合轮次与 findings 做裁决；
- Then 裁决值严格为枚举三值之一，报告以6章结构落盘当前任务目录。

**报告最小章节结构（占位名清单，render-review-report.mjs 须输出以下6章）**：
1. Summary（审查摘要：verdict、轮次、模式）
2. Blocking Issues（blocking 级问题列表，含指纹字段）
3. Minor Issues（minor 级问题列表）
4. Pass Items（通过项列表）
5. Delta（本轮相较上轮的变更说明，第1轮留空）
6. Metadata（task-name、round_number、mode、contract、timestamp）

实际章节名以 agenthub 原实现为准；build-plan 阶段核实后在 wh-review SKILL.md 中固化。

**验收标准**：
- AC4-1：裁决字段只含三值之一，其他值视为错误。
- AC4-2：报告文件路径可预测（任务目录下固定子路径）。
- AC4-3：报告含上述6章结构（章节名在 wh-review SKILL.md 中明确定义，可机器 grep 验证）。

---

### FR-THIRDREVIEW-001 3rd-review 精简为纯引擎

**描述**：精简 `skills/3rd-review/SKILL.md`，剥离所有 stage/轮次知识，只保留纯审查引擎接口。

**方案A 定案架构（装配职责100%在 wh-review 侧）**：

wh-review 负责：
1. 接收 stage 标识，从 `skills/wh-review/contracts/` 读取对应合同内容
2. 将合同内容 + 待审材料（materials）拼装为一份完整审查包（单一文件，纯文本，无任何 stage 语义）
3. 将装配好的审查包路径传给 standalone.sh 的 `--input`

3rd-review 收到的只是一份已装配好的纯文本输入，不含任何 stage 标识或合同路由信息，实现真正的零 stage 知识纯引擎。

**真实 CLI 调用形态（方案A，不传 --checkpoint）**：

```
standalone.sh \
  --input=<wh-review装配好的审查包路径> \
  --output-root=<output-dir> \
  --task-name=<task-name> \
  --review-runner=<runner-cmd> \
  [--max-revise-rounds=N]
```

- **不传 `--checkpoint` 参数**——stage 路由与合同选择完全由 wh-review 在调用前完成
- 无 `--engine` / `--output` 参数（这两个参数不存在于 standalone.sh）
- `review-runner` 走 `<runner> --prompt-file=<path> --result-file=<out.json> --review-request-id=<id>` 契约
- exit code 语义：`0` = pass，`1` = revise_required，`2` = escalate_to_human

**⚠️ 已知 standalone.sh bug（wh-review 实现须规避）**：`--max-revise-rounds` 参数只在 CLI 解析和 manifest 记录中出现，standalone.sh revise 循环体（约 206-420 行）从未检查该上限，导致 revise_required 时无限循环（实测 round 33+ 仍未停止）。此 bug 不在本期 scope 内修复。**wh-review 必须自己做轮次计数并强制停止，不能依赖 standalone.sh 的 `--max-revise-rounds`。** 详见 Known Gaps GAP-6。

**Given/When/Then**：
- Given wh-review 接收到 stage 标识和待审材料；
- When wh-review 读取对应合同文件、拼装审查包、调用 `standalone.sh --input=<审查包路径> --output-root=<dir> --task-name=<name> --review-runner=<cmd>`（无 --checkpoint）；
- Then standalone.sh 完成审查并以 exit code 0/1/2 返回，全程不感知 stage 名称、轮次号或合同路由（这些信息已由 wh-review 在调用前封装进审查包）。

**验收标准**：
- AC5-1：3rd-review SKILL.md 不含 stage 名称枚举（make-decision / build-spec 等）。
- AC5-2：3rd-review SKILL.md 不含轮次管理逻辑（round/Delta Package 等）。
- AC5-3：wh-review 实现调用 standalone.sh 时命令行不含 `--checkpoint` 参数，且审查包（--input 文件）中含正确合同内容（可机器 grep 验证调用命令 + 审查包内容）。
- AC5-4：wh-review 实现含独立轮次计数器，不依赖 standalone.sh `--max-revise-rounds` 做强制停止（AC-D10 轮次状态文件验证）。

---

### FR-THIRDREVIEW-002 §7 改写

**描述**：改写 3rd-review SKILL.md 中的 §7，删除所有流程步骤和 if/else 逻辑，仅保留对 §13 的概念性导读。

**机器可检验规则**：§7 不含任何 numbered step（`1.`/`2.`/`- [ ]` 等枚举格式）或 if/else 逻辑关键字。

**Given/When/Then**：
- Given §7 改写完成；
- When 对 §7 内容运行模式匹配；
- Then 不命中 `^\s*\d+\.` 或 `/\bif\b.*\belse\b/` 等 step/条件分支模式。

**验收标准**：
- AC6-1：§7 文本不含 numbered list（`1. 2. 3.`）。
- AC6-2：§7 文本不含 if/else/条件分支逻辑描述。
- AC6-3：§7 文本包含明确的"单次调用语义参见 §13"或等价表述。

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
- AC8-1：make-decision / build-plan / verify-code 的 pass 分支代码中不存在自动推进逻辑。
- AC8-2：build-spec / build-code 的 pass 分支正常自动推进（auto-advance 可验证）。

---

### FR-INTAKE-001 intake 合同覆盖 C1-C6

**描述**：wh-review 的 intake（make-decision 专属）合同实现须覆盖 C1-C6 全部判据，且合同机器可消费字段非空。

**C1-C6 判据**（来源 decision-log D4）：
- C1：原始需求原文引用（至少一处，不可仅概括）
- C2：决策有证据支撑（每条 KEEP 结论须附具体理由）
- C3：范围边界明确划分 in/out（各至少一条且互不重叠）
- C4：无悬挂开放问题（0 个未解决或已标注不阻断+跟进）
- C5：关键假设已记录（非真实约束的假设须标注可能失效）
- C6：非目标明确声明（至少一条）

**验收标准**：
- AC9-1：intake 合同文件存在 C1-C6 全部判据字段。
- AC9-2：可机器消费的标准字段（decision / scope.in / scope.out / open_questions）均非空。

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
- AC10-1：test-acceptance 合同文件存在 F1-F6 全部判据字段。
- AC10-2：fresh-capture/evidence 机制与 build-code 产物记录字段对齐可验证。

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

## 7. 影响范围

| 模块 | 变更类型 | 说明 |
|---|---|---|
| `skills/wh-review/` | 新建 | 核心新模块，含 SKILL.md + 5 合同 + 报告模板 + 渲染脚本 |
| `skills/3rd-review/SKILL.md` | 破坏性重构 | 剥离 stage/轮次知识，精简为纯引擎；§7 改写 |
| `skills/make-decision/SKILL.md` | 收尾段修改 | 统一调用 human-brief-template.md |
| `skills/build-spec/SKILL.md` | 收尾段修改 | 统一调用 human-brief-template.md |
| `skills/build-plan/SKILL.md` | 收尾段修改 | 统一调用 human-brief-template.md |
| `skills/build-code/SKILL.md` | 收尾段修改 | 统一调用 human-brief-template.md |
| `skills/verify-code/SKILL.md` | 收尾段修改 | 统一调用 human-brief-template.md |
| `docs/human-brief-template.md` | 可能新建/确认存在 | 若不存在须作为前置依赖创建 |

**不改动**：agenthub 侧任何文件；workflowhub 其他非列出模块。

---

## 8. 兼容性预留

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

- AC-D1：3rd-review SKILL.md 不含 stage 名称枚举、不含轮次管理逻辑 → 可机器 grep 验证
- AC-D2：§7 不含 numbered step / if/else 逻辑 → 可机器 grep 验证
- AC-D3：wh-review/SKILL.md 存在 stage→合同映射表（5 条全覆盖）
- AC-D4：5 个 stage 传入对应标识后，审查报告中合同路径为对应专属合同（非通用）
- AC-D5：make-decision / build-plan / verify-code pass 路径不自动推进（代码/文档可查）
- AC-D6：5 个 stage SKILL.md 收尾段均含 human-brief-template.md 引用
- AC-D7：端到端冒烟用例可本地跑通，覆盖 wh-review + 精简 3rd-review 组合
- AC-D8：intake 合同覆盖 C1-C6 全部判据字段
- AC-D9：test-acceptance 合同覆盖 F1-F6 全部判据字段
- AC-D10：轮次状态文件存在，记录 round_number / mode / verdict / report_path

### 未决问题

- **OPEN-1**（已按方案A彻底解决）：原问题为"3rd-review 靠 --checkpoint 做 stage 路由/合同匹配，参数文档不一致"。方案A从根本上消除该问题：wh-review 自行读取合同并装配审查包，调用 standalone.sh 时不传 --checkpoint，3rd-review 完全不感知 stage 和合同路由，路由不一致问题不复存在。无需 build-plan 阶段另建 tracking issue。

---

## Known Gaps

- 5 套 stage 专属合同从 agenthub verifiers/vibecoding 搬迁后可能需要适配 workflowhub 数据结构，具体适配点在 build-plan 阶段确认。
- render-review-report.mjs 的6章结构名称未在 decision-log 中明确列出，build-plan 阶段需在 agenthub 原实现中核实并在 SKILL.md 中定义。
- `docs/human-brief-template.md` 是否已存在未经确认，若不存在须作为前置依赖在 build-plan 中标出。
- （spec-clarify 补充）**GAP-4**（已在本期 spec 解决）：降级触发条件中"大量"已在 FR-WHREVIEW-003 中明确为"单轮 blocking_count ≥ 3 或 fingerprint_repeated=true，连续3轮成立"。
- （spec-clarify 补充）**GAP-5**（已在本期 spec 解决）：同源切换与升级人工的优先级已在 FR-WHREVIEW-003 中明确：升级人工判定先于同源切换判定（第3轮末先判升级条件，满足则直接升级，不进入第4轮同源模式）。
- （3rd-review 实测发现）**GAP-6**：standalone.sh `--max-revise-rounds` 参数在 revise 循环体（约 206-420 行）中从未生效，导致 revise_required 时无限循环（实测 round 33+ 未停止）。此 bug 不在本期修复 scope 内。wh-review 实现须自行做轮次计数并强制停止，不能依赖 standalone.sh 的 `--max-revise-rounds`（见 FR-THIRDREVIEW-001 AC5-4）。
