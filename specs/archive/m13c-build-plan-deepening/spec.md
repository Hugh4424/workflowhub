---
task_id: m13c-build-plan-deepening
milestone: M13c
stage: build-spec
source_decision_log: tasks/m13c-build-plan-deepening/decision-log.md
status: draft
spec_version: 1.0.0
---

# 功能规格：build-plan 深化（M13c）

> 基于 decision-log.md（m13c-build-plan-deepening，D1-D10，user_decision:true，S9='同意' 已批准，2026-07-01）。
> 本文件不可覆盖项目级规则。CONSTITUTION.md 优先。

---

## 层 1 — 速读卡（30 秒看懂）

**一句话需求**：在 `workflows/build-plan/SKILL.md` 里补四类质量缺口——research 先行、data-contracts 落盘、四阶梯复用判断、独立工程审查——同时在各子 skill 补齐 ambiguity_items、no-placeholder 铁律、STOP/Knowledge 标签，以及新建 `simplicity-guard` 共享技能并接入 build-spec。

**核心改动点**：
- 新建 `skills/spec-research/SKILL.md`（Phase 0 research 先行，产出 research.md）
- `workflows/build-plan/SKILL.md` Phase 1 新增 data-contracts 步骤（产出 data-contracts.md）
- `skills/spec-plan/`（或等效前置逻辑）前置 simplicity-guard 四阶梯判断，结论写 minimal-path 字段
- `workflows/build-plan/SKILL.md` 新增步骤调用 3rd-review plan-reviewer（非新 skill），产出 plan-eng-review.md
- `skills/spec-analyze/SKILL.md` facts 新增 ambiguity_items[] 及升级路径
- `skills/spec-tasks/SKILL.md` 强化 no-placeholder 铁律
- tasks.md 六节格式含 STOP/Knowledge 标签 + upstream_delta 字段（软要求）
- `reuse-registry.md` 新增 upstream_delta 列，spec-research 登记
- D1 的 task_dir 解析器在本次实现范围内交付并有测试覆盖
- `skills/simplicity-guard/SKILL.md` 已新建（M13b 已落盘），build-spec 已接入

**档位判断（spec-ladder）**：B 档
- 跨多个 skill 文件 + 新建 skill + 修订 workflow，无跨系统外部依赖、无外部 API/协议合约、无多 repo/多团队协调
- C 档判断条件（跨系统边界、引入外部依赖、破坏性变更）均不满足

**F10 反过度工程四问（对各新增机制）**：
1. spec-research：防御选型盲区导致的方向返工（已在 agenthub 执行记录中多次命中）
2. data-contracts：防止 tasks.md 分解前契约漂移（现有无对应机制）
3. simplicity-guard：防止重复造轮子（现有无统一四阶梯判断入口）
4. plan-reviewer（复用 3rd-review）：防止工程可行性未评估（现有 3rd-review 基础设施已存在，D3 决策复用而非新建，维护成本低）
结论：各机制均有真实历史失败案例支撑，无"机器可校验本身"驱动的过度基建。

---

## 层 2 — 正文

### 1. 问题陈述

build-plan 当前缺四类质量保障：
1. 无 research 前置：技术选型在 plan 阶段才发现盲区，返工成本高
2. 无 data-contracts：core data models 和 API 契约在 tasks.md 分解前未落盘，任务分解前提不稳
3. 无复用阶梯判断：每次 spec-plan 直接进入方案设计，重复造轮子
4. 无独立工程审查：plan 合理性（技术风险/时间估算/依赖顺序）无独立评估

### 2. 背景与目标

- **背景**：M13b 已完成 build-spec 质量事实契约深化；M13c 在其基础上补 build-plan 侧缺口。simplicity-guard skill 已在 M13b/D9 决策中新建并接入 build-spec。
- **目标**：补齐上述四类缺口，引入 spec-research、data-contracts、simplicity-guard 四阶梯、plan-reviewer（复用 3rd-review），同时更新相关子 skill（spec-analyze、spec-tasks）和注册表（reuse-registry.md）。

### 3. 边界（IN / OUT scope）

**IN scope**：
- 新建 `skills/spec-research/SKILL.md`，Phase 0 调用，产出 research.md
- `workflows/build-plan/SKILL.md` Phase 1 新增 data-contracts 步骤
- spec-plan 前置阶段调用 simplicity-guard，结论写 minimal-path 字段
- build-plan 新增步骤调用 3rd-review plan-reviewer，产出 plan-eng-review.md
- spec-analyze 新增 ambiguity_items[] 及升级路径（facts 字段）
- spec-tasks 强化 no-placeholder 铁律
- tasks.md 六节格式含 STOP/Knowledge 标签 + upstream_delta（软要求）
- reuse-registry.md 新增 upstream_delta 列，spec-research 登记
- D1 task_dir 解析器（config/workflowhub.yaml 中 task_dir 值的实际消费逻辑）交付并有测试覆盖

**OUT scope（明确不做）**：
- Knowledge task.md 跨阶段上下文载体机制（D6 延后）
- STOP/Knowledge 六节格式的机器强校验门（D5 延后）
- 新建独立 spec-plan-review skill（D3：改为复用 3rd-review）
- stage-step-audit 只读审计工具（D8 follow-on）
- 大白话规则系统性写入全部 5 个 SKILL.md（D10 follow-on，只做了 grill-with-docs 一处）
- S3 外部双路调研（D7：全跳过，不计入验收缺口）

### 4. 用户场景

**场景 4.1：spec-research Phase 0 先行**
- Given build-plan 开始执行，When spec-research skill 被调用，Then 产出 research.md 文件（含技术选型分析），后续步骤以此为输入，不再在 plan 阶段才发现选型盲区。

**场景 4.2：data-contracts 步骤先于 tasks.md 执行**
- Given Phase 1 开始，When data-contracts 步骤运行，Then core data models 和 API 契约写入 data-contracts.md，tasks.md 分解基于已确认契约，不出现契约漂移。

**场景 4.3：simplicity-guard 四阶梯判断**
- Given spec-plan 执行前置判断，When simplicity-guard SKILL.md 被调用，Then 输出 P0/P1/P2/P3 阶梯结论，写入 minimal-path 字段；若 P1 已有覆盖则直接复用，禁止重写。

**场景 4.4：3rd-review plan-reviewer 独立审查**
- Given plan 产出后，When plan-reviewer 被调用（复用 3rd-review 基础设施），Then 产出 plan-eng-review.md（技术风险/时间估算/依赖顺序三维度），审查失败按 D4 口径记录+升级人工，不硬阻断流程。

**场景 4.5：spec-analyze ambiguity_items[] 升级路径**
- Given spec-analyze 执行完成，When 检查 stage-result.facts，Then 含 ambiguity_items[] 列表及每项的升级路径说明（人工确认 / 下一轮迭代 / 可接受歧义）。

**场景 4.6：spec-tasks no-placeholder 铁律**
- Given spec-tasks 产出 tasks.md，When 检查任务分解，Then 无任何 TODO/TBD/placeholder 标记；发现时记录为阻断项（不允许继续分解），强制人工解决后再推进。

**场景 4.7：STOP/Knowledge 标签 + upstream_delta 字段**
- Given tasks.md 存在 STOP 或 Knowledge 类型任务，When 检查格式，Then 含 STOP/Knowledge 标签 + upstream_delta 字段（软要求，缺失时记录 warn 不阻断）。

**场景 4.8：task_dir 解析器生效**
- Given config/workflowhub.yaml 配置了 task_dir，When 任意 skill 在读取任务跟踪文件前调用解析器，Then 实际读写路径来自 task_dir 配置值而非 repo 内硬编码路径，且有测试覆盖。

**场景 4.9：reuse-registry.md 更新**
- Given spec-research 新建，When 检查 reuse-registry.md，Then 含 spec-research 的登记行，且有 upstream_delta 列。

### 5. 功能需求（FR）

#### FR-RESEARCH（spec-research skill）

**FR-RESEARCH-001**：新建 `skills/spec-research/SKILL.md`，接受 task-id 和功能描述文本为输入，产出 `specs/{task-id}/research.md`。
- 场景：Given build-plan Phase 0 调用 spec-research，When 执行完成，Then `specs/{task-id}/research.md` 存在，内含技术选型分析结论。

**FR-RESEARCH-002**：spec-research 产出的 research.md 必须作为 build-plan Phase 1+ 的输入，不可跳过直接进入 data-contracts 或 tasks.md。
- 场景：Given research.md 缺失，When build-plan 尝试继续 Phase 1，Then 报告"research.md missing"，暂停并升级人工，不自动跳过。

**FR-RESEARCH-003**：spec-research 外部调研步骤（S3 双路调研）在用户明确要求时可跳过，跳过决定写入 research.md 的 note 字段，不计入验收缺口（D7）。
- 场景：Given 用户配置 skip_external_research=true，When spec-research 执行，Then 跳过双路调研，note 字段标记"外部调研已跳过（D7）"，research.md 仍产出。

#### FR-DATACONTRACTS（data-contracts 步骤）

**FR-DATACONTRACTS-001**：`workflows/build-plan/SKILL.md` Phase 1 新增 data-contracts 步骤，产出 `specs/{task-id}/data-contracts.md`，内含 core data models 和 API 契约定义。
- 场景：Given Phase 1 开始，When data-contracts 步骤执行，Then data-contracts.md 产出，且时序先于 tasks.md 分解。

**FR-DATACONTRACTS-002**：tasks.md 分解步骤必须在 data-contracts.md 已产出且非空后才能执行；data-contracts.md 缺失时记录 warn 并升级人工（escalate_to_human），tasks.md 生成步骤继续执行，不硬停。
- 场景：Given data-contracts.md 缺失，When tasks.md 分解步骤触发，Then 记录 warn，escalate_to_human，tasks.md 生成步骤继续执行（non-blocking escalation，不阻断推进）。

#### FR-SIMPLICITY（simplicity-guard 接入）

**FR-SIMPLICITY-001**：spec-plan 阶段（或等效前置逻辑）在方案设计前调用 `skills/simplicity-guard/SKILL.md`，结论写入 stage-result.facts 的 minimal-path 字段。
- 场景：Given spec-plan 执行，When simplicity-guard 四阶梯判断完成，Then minimal-path 字段存在，值为 P0/P1/P2/P3 之一及理由摘要。

**FR-SIMPLICITY-002**：simplicity-guard 判断结论为 P1（已有覆盖）时，禁止重写已有能力；判断结论写入 minimal-path 字段后推进到下一步，不阻断。
- 场景：Given 已有能力覆盖需求（P1），When simplicity-guard 判断完成，Then minimal-path="P1: 直接复用 [已有能力名]"，不产出新代码。

#### FR-PLANREVIEW（plan-reviewer 工程审查）

**FR-PLANREVIEW-001**：`workflows/build-plan/SKILL.md` 新增步骤，复用 3rd-review 的 plan-reviewer（`verifiers/vibecoding/plan-reviewer.md` + `plan-reviewer-contract.md`），在 plan 产出后调用，产出 `specs/{task-id}/plan-eng-review.md`。
- 场景：Given plan 产出完成，When plan-reviewer 被调用，Then plan-eng-review.md 存在，内含技术风险/时间估算/依赖顺序三维度评估。

**FR-PLANREVIEW-002**：plan-reviewer 审查失败或不可用时，降级记录 unknown + 原因，升级人工，不硬阻断流程（D4 口径）。
- 场景：Given plan-reviewer 不可用，When 审查步骤执行，Then 记录"plan-reviewer unavailable"，升级人工，plan 阶段继续推进（non-blocking escalation）。

**FR-PLANREVIEW-003**：不得新建独立 spec-plan-review skill（D3）；必须复用 3rd-review 已有 plan-reviewer 基础设施。
- 场景：Given 工程审查需求，When 实现时，Then 调用路径为 3rd-review plan-reviewer，无新 skill 文件创建。

#### FR-ANALYZE（spec-analyze ambiguity_items）

**FR-ANALYZE-001**：`skills/spec-analyze/SKILL.md` 的 stage-result.facts 新增 ambiguity_items[] 数组，每项含歧义描述和升级路径说明。
- 场景：Given spec-analyze 执行完成，When 读取 stage-result，Then facts.ambiguity_items 字段存在（可为空数组），每个非空项含 description 和 escalation_path。

**FR-ANALYZE-002**：ambiguity_items 升级路径可选值：human_confirm / next_iteration / acceptable_ambiguity；缺失时记录 warn 写入 quality contract，不阻断。
- 场景：Given spec-analyze 发现歧义项，When 产出 stage-result，Then 每项 ambiguity_items 有 escalation_path 字段，值为三选一。

#### FR-TASKS（spec-tasks no-placeholder）

**FR-TASKS-001**：`skills/spec-tasks/SKILL.md` 强化 no-placeholder 铁律：tasks.md 中禁止出现 TODO/TBD/placeholder/待定/暂缺等标记；发现时将该任务条目标记为阻断项（blocking_item:true），记录为 friction，同时在 stage-result 中设置 human_intervention=true（升级人工，供 build-code 消费前解决），spec-tasks 步骤本身仍正常完成 tasks.md 写入，不阻断 spec-tasks 或 build-plan stage 的推进。
- 场景：Given tasks.md 含 "TODO: 待确认"，When spec-tasks 自检运行，Then 将该任务条目标记为 blocking_item:true，记录 friction，stage-result.human_intervention=true，spec-tasks 步骤继续完成 tasks.md 写入，不阻断 stage 推进。

**FR-TASKS-002**：tasks.md 中 STOP/Knowledge 类型任务须含 upstream_delta 字段（软要求，D5）；缺失时记录 warn，不阻断。
- 场景：Given tasks.md 含 STOP 类型任务且 upstream_delta 字段缺失，When 格式检查运行，Then 记录 warn "upstream_delta missing on STOP task"，流程继续。

#### FR-REGISTRY（reuse-registry 更新）

**FR-REGISTRY-001**：`reuse-registry.md` 新增 upstream_delta 列，并为 spec-research skill 添加登记行。
- 场景：Given spec-research 新建，When 检查 reuse-registry.md，Then 含 spec-research 行，upstream_delta 列有值。

#### FR-TASKDIR（task_dir 解析器）

**FR-TASKDIR-001**：实现 task_dir 配置解析器，读取 `config/workflowhub.yaml` 中 task_dir 字段，所有 skill 在读取任务跟踪文件前必须通过该解析器取得路径，不得硬编码绝对路径。
- 场景：Given config/workflowhub.yaml task_dir=/data/wf-tasks，When 任意 skill 读写任务跟踪文件，Then 路径为 /data/wf-tasks/ 下，不写入 repo 内路径。

**FR-TASKDIR-002**：task_dir 解析器须有测试覆盖（D1 验收标准第 9 条），测试覆盖默认值回退和显式配置两个场景。
- 场景：Given task_dir 未配置，When 解析器调用，Then 回退到默认路径（~/Knowledge/workflowhub/），测试 green。

### 6. 不做 / 非目标

- Knowledge task.md 跨阶段上下文载体（D6 延后）
- STOP/Knowledge 六节格式机器强校验门（D5 延后）
- 新建 spec-plan-review skill（D3 复用 3rd-review）
- stage-step-audit 审计工具（D8 follow-on）
- 大白话规则系统性写入全部 stage SKILL.md（D10 follow-on）
- 外部双路调研（D7 全跳过）

### 7. 验收条件（AC）

- [ ] **AC-01**：`skills/spec-research/SKILL.md` 文件存在，内含 task-id 输入要求和 research.md 产出约定。
- [ ] **AC-02**：`workflows/build-plan/SKILL.md` 含 Phase 0 调用 spec-research 的步骤，可 grep 到 "spec-research"。
- [ ] **AC-03**：`workflows/build-plan/SKILL.md` Phase 1 含 data-contracts 步骤，产出 data-contracts.md，可 grep 到 "data-contracts"。
- [ ] **AC-04**：data-contracts 步骤在 tasks.md 分解步骤之前，SKILL.md 中顺序可验证。
- [ ] **AC-05**：spec-plan 阶段（或等效前置逻辑）含 simplicity-guard 调用，可 grep 到 "simplicity-guard"。
- [ ] **AC-06**：spec-plan stage-result.facts 含 minimal-path 字段定义，可 grep 到 "minimal-path"。
- [ ] **AC-07**：`workflows/build-plan/SKILL.md` 含 plan-reviewer 调用步骤，可 grep 到 "plan-reviewer"，且不创建新 skill 文件。
- [ ] **AC-08**：plan-reviewer 产出路径为 `specs/{task-id}/plan-eng-review.md`，文件路径约定可 grep。
- [ ] **AC-09**：plan-reviewer 失败时按 D4 口径处理（记录+升级人工，非硬阻断），SKILL.md 中失败语义可验证。
- [ ] **AC-10**：`skills/spec-analyze/SKILL.md` stage-result.facts 含 ambiguity_items[] 字段定义，可 grep 到 "ambiguity_items"。
- [ ] **AC-11**：ambiguity_items 每项含 escalation_path，可选值为 human_confirm / next_iteration / acceptable_ambiguity，可 grep 到 "escalation_path"。
- [ ] **AC-12**：`skills/spec-tasks/SKILL.md` 含 no-placeholder 铁律说明，可 grep 到 "no-placeholder" 或 "TODO.*禁止"。
- [ ] **AC-13**：spec-tasks 自检发现 placeholder 时标记为 blocking item，SKILL.md 中 blocking item 语义可验证（注意：blocking item 是对任务条目的标记，非阻断 stage 推进的门禁）。
- [ ] **AC-14**：tasks.md 格式含 STOP/Knowledge 标签 + upstream_delta 字段约定（软要求说明可 grep）。
- [ ] **AC-15**：`reuse-registry.md` 含 upstream_delta 列，spec-research 行存在。
- [ ] **AC-16**：`config/workflowhub.yaml` task_dir 字段被真实消费者（解析器）读取，验收证据须为"可执行的 task_dir 解析器被实际调用"（代码级 grep 命中），文档或注释单独存在不构成通过条件。
- [ ] **AC-17**：task_dir 解析器有测试覆盖，测试文件存在且 `npx vitest run` 绿（须包含 task_dir parser 对应测试用例 green），不接受笼统 npm test 表述。
- [ ] **AC-18**：全部改动通过独立异源审查（codex / 3rd-review），审查产物路径存在。
- [ ] **AC-19**：`skills/simplicity-guard/SKILL.md` 已存在（M13b 已落盘），build-spec SKILL.md 含 simplicity-guard 引用（F8 checklist）。

### 8. 影响范围

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `skills/spec-research/SKILL.md` | 新建 | Phase 0 research skill |
| `workflows/build-plan/SKILL.md` | 修订 | Phase 0 调用 spec-research，Phase 1 加 data-contracts，加 plan-reviewer 步骤 |
| `skills/spec-analyze/SKILL.md` | 修订 | facts 新增 ambiguity_items[] |
| `skills/spec-tasks/SKILL.md` | 修订 | 强化 no-placeholder 铁律，tasks.md 格式 STOP/Knowledge 约定 |
| `reuse-registry.md` | 修订 | 新增 upstream_delta 列，spec-research 登记 |
| `config/workflowhub.yaml` | 新增消费者 | task_dir 字段被解析器真实消费 |
| task_dir 解析器实现文件 | 新建 | 具体路径待 build-plan 阶段确定 |
| `skills/simplicity-guard/SKILL.md` | 已存在（M13b） | 无需修改 |
| `workflows/build-spec/SKILL.md` | 已接入（M13b/D9） | 无需修改 |

---

## 层 3 — 附录

### 附录 A：质量事实契约

#### 1. scope 边界

**IN**：spec-research、data-contracts、simplicity-guard 接入、plan-reviewer（复用 3rd-review）、spec-analyze ambiguity_items、spec-tasks no-placeholder、STOP/Knowledge 软要求、reuse-registry 更新、task_dir 解析器。

**OUT**：Knowledge task.md 载体、机器强校验门、spec-plan-review 新 skill、stage-step-audit、大白话规则系统性补丁（D8/D10 follow-on）、外部双路调研（D7）。

**裁剪机制**：D3（复用替代新建）、D4（记录+升级人工替代硬阻断）、D5/D6（延后）、D7（跳过）。

#### 2. 自检结果

| # | 检查项 | 结论 |
|---|--------|------|
| 1 | spec-ladder 档位已声明且有依据 | pass（B 档，依据在速读卡）|
| 2 | 所有 FR 使用 FR-{DOMAIN}-NNN 格式 | pass（FR-RESEARCH/DATACONTRACTS/SIMPLICITY/PLANREVIEW/ANALYZE/TASKS/REGISTRY/TASKDIR）|
| 3 | 每个 FR 至少有一条 Given/When/Then 场景 | pass（逐条已写场景）|
| 4 | 五章硬门完整（速读卡/FR/不做/验收/影响范围）| pass |
| 5 | spec↔decision-log 覆盖率（D1-D10 全覆盖）| pass（见附录 C）|
| 6 | 无 [NEEDS CLARIFICATION] 残留 | pass |
| 7 | Known Gaps 段存在 | pass（见附录 B）|

Spec-Purity grep：本 spec 不含代码块（无 ``` 包围的实现代码）、无 shell 命令（$ / && / | 特征）。结论：**warn**（非 pass）。命中行：附录 A 含绝对路径引用 `/Users/Hugh/Hugh/Project/3rd-review/verifiers/vibecoding/`，属外部依赖引用，非代码示例；需人工确认该引用是否改为 repo-relative 声明或保留为已知外部依赖说明。

#### 3. 异源 3rd-review 独立审查摘要

- **审查状态**：已完成（2026-07-01，lightweight 模式，codex 引擎）
- **verdict**：escalate_to_human（底层三轮均为 revise_required，revise 循环达上限 3 轮未收敛）
- **blocking findings**：3 条（high）— FR-TASKS-001 vs AC-13 语义矛盾、FR-DATACONTRACTS-002 阻断/非阻断混用、plan-reviewer 跨仓库路径依赖未解
- **non-blocking findings**：3 条（medium）— Spec-Purity 绝对路径自检失实、AC-16 文档替代可执行验收、AC-17 npm test 依赖未确认
- **审查产物路径**：`specs/m13c-build-plan-deepening/3rd-review-report.md`
- **原始 verdict JSON**：`specs/m13c-build-plan-deepening/3rd-review-work/tasks/spec-20260701T032953Z-fa393e/reviews/verdict-round-3.json`
- **约束（FR-CONTRACT-002）**：本审查结果为记录+浮现语义，不阻断推进
- **findings**：unknown
- **R3 修复透明度**：R3 findings 已本轮全部修复（FR-TASKS-001、FR-DATACONTRACTS-002、plan-reviewer 跨仓依赖、Spec-Purity warn、AC-16、AC-17 共 6 项）；未再跑第 4 轮异源复审。记录透明，可要求补审。

#### 4. 未解风险

- [FRICTION] D1 task_dir 解析器：涉及多个 skill 的读取逻辑改造，实现规模较大，具体拆分方式待 build-plan 阶段落实 | 建议：build-plan 时优先评估是否可最小化到单一解析函数
- [RISK] D8/D10 follow-on 任务（stage-step-audit、大白话规则）：尚未获得用户单独立项批准，不影响本轮验收，但需用户确认是否打包到下一里程碑
- [RISK] plan-reviewer 基础设施（verifiers/vibecoding/plan-reviewer.md）：需在 build-code 阶段确认路径存在且可调用
- [RISK] verifiers/vibecoding/plan-reviewer.md 及 plan-reviewer-contract.md 在当前 workflowhub 仓库中不存在（已 Glob 确认，2026-07-01）；D3"复用 3rd-review plan-reviewer"决策的实现前提（文件路径）待 build-plan 阶段核实或新建（源文件位于 /Users/Hugh/Hugh/Project/3rd-review/verifiers/vibecoding/，需确认引用方式：符号链接 / 复制 / 路径约定）
- [RISK][跨仓依赖] plan-reviewer 相关文件（verifiers/vibecoding/plan-reviewer.md、plan-reviewer-contract.md）当前不在 workflowhub 仓库，依赖外部路径 /Users/Hugh/Hugh/Project/3rd-review；build-plan/build-code 调用前必须先验证该路径可访问，不可访问时同样走 record+escalate_to_human（non-blocking，对应 FR-PLANREVIEW-002 口径）。新增 AC：build-plan/build-code 调用 plan-reviewer 前须验证外部路径可访问；不可访问时记录 unavailable + 升级人工，不硬阻断流程。

scope-triage 高危词检测：未发现"阻断"/"blocking gate"/"强制门"/"必须停止"的执行语义命中。pass。

#### 5. handoff required_reads

下游 build-plan 必读：
- `specs/m13c-build-plan-deepening/spec.md`（本文件）
- `tasks/m13c-build-plan-deepening/decision-log.md`
- `skills/simplicity-guard/SKILL.md`（四阶梯判断树）
- `workflows/build-plan/SKILL.md`（当前版本，改动基线）
- `skills/spec-analyze/SKILL.md`（改动基线）
- `skills/spec-tasks/SKILL.md`（改动基线）
- `reuse-registry.md`（upstream_delta 列改动基线）
- `config/workflowhub.yaml`（task_dir 字段当前值）

---

### 附录 B：Known Gaps

- plan-reviewer 调用路径（verifiers/vibecoding/plan-reviewer.md 是否为正确路径）待 build-code 阶段核实
- task_dir 解析器的具体实现文件路径和模块接口留待 build-plan 阶段确定
- D8（stage-step-audit）和 D10（大白话规则系统性补丁）两项 follow-on 任务，尚待用户批准单独立项

---

### 附录 C：Decision-Log 覆盖率（D1-D10）

| 决策 | 类型 | 覆盖 | 对应 FR |
|------|------|------|---------|
| D1（task_dir 解析器） | 衍生 | KEEP | FR-TASKDIR-001/002 |
| D2（清理误建 worktree）| 流程修正 | 无需 FR | — |
| D3（不新建 plan-review skill，复用 3rd-review）| 衍生 | KEEP | FR-PLANREVIEW-003 |
| D4（失败语义：记录+升级人工，非硬阻断）| 衍生 | KEEP | FR-PLANREVIEW-002, FR-DATACONTRACTS-002 |
| D5（STOP/Knowledge 软要求）| 原文 | KEEP | FR-TASKS-002 |
| D6（Knowledge task.md 不做）| 衍生 | CUT | OUT scope |
| D7（外部调研跳过）| 原文 | KEEP | FR-RESEARCH-003 |
| D8（stage-step-audit follow-on）| 新增 | CUT | OUT scope，Known Gaps |
| D8.1（grill-with-docs 大白话补丁）| 衍生 | 已在 M13b 执行 | — |
| D9（simplicity-guard 新建并接入 build-spec）| 原文 | KEEP | FR-SIMPLICITY-001/002，AC-19 |
| D10（大白话规则系统性补丁 follow-on）| 新增 | CUT | OUT scope，Known Gaps |

原始需求各点覆盖：
- P0-1 spec-research → FR-RESEARCH-001/002/003
- P0-2 data-contracts → FR-DATACONTRACTS-001/002
- P0-3 simplicity-guard 四阶梯 → FR-SIMPLICITY-001/002
- P1-1 plan-reviewer（复用 3rd-review）→ FR-PLANREVIEW-001/002/003
- P1-2 ambiguity_items → FR-ANALYZE-001/002
- P1-3 no-placeholder 铁律 → FR-TASKS-001
- P2 STOP/Knowledge upstream_delta → FR-TASKS-002

---

### 附录 D：Spec-Ladder 档位判断

**结论：B 档（中等）**

判断依据：
- 改动牵连面：5 个文件修订 + 1 个新建 skill + 1 个解析器新建，跨多个子 skill 和 workflow
- 无跨系统边界：全部在 workflowhub 仓库内
- 无外部 API / 协议合约引入
- 无多 repo / 多团队协调
- C 档三项判断条件（跨系统边界、新引入外部依赖、破坏性变更）均不满足

B 档要求：完整三层 spec。已满足。

---

### 附录 E：baseline 对照表

| Metric | M13c Actual | M10 Baseline | Direction Delta |
|--------|-------------|--------------|-----------------|
| missed_step_rate | unknown | 0.05 | unknown |
| test_execution_rate | unknown | 0.8295 | unknown |
| review_execution_rate | unknown | 1 | unknown |
| rework_rounds | 0 | 6.075 | -6.075（更好）|
| rework_proxy_count | unknown | 25.25 | unknown |

注：本 spec 为初稿阶段，任务尚未进入 build-code / verify-code，missed_step_rate / test_execution_rate / review_execution_rate / rework_proxy_count 四项无法从现有 metrics 数据计算，标记 unknown。rework_rounds=0 为当前值（spec 初稿，尚未经历返工）。unknown 不阻断推进（F3/Q1）。

---

### 附录 F：F10 反过度工程分析（逐机制）

**spec-research skill**
1. 防御真实威胁：技术选型盲区在 plan 阶段才暴露（M13b 执行记录中有实例）
2. 现有覆盖：无（build-plan 当前无 research 步骤）
3. 可绕过性：低（为新增步骤，绕过等于不执行，后果可见）
4. 长期维护成本：低（独立 skill 文件，与其他 skill 无耦合）
结论：合理引入

**data-contracts 步骤**
1. 防御真实威胁：tasks.md 分解前契约漂移（make-decision 阶段调研记录）
2. 现有覆盖：无
3. 可绕过性：低
4. 长期维护成本：低（仅 workflow 新增一步骤）
结论：合理引入

**plan-reviewer（复用 3rd-review）**
1. 防御真实威胁：plan 工程可行性未独立评估
2. 现有覆盖：3rd-review plan-reviewer 已存在，D3 决策为复用而非新建
3. 可绕过性：低
4. 长期维护成本：极低（复用现有，无新 skill 维护成本）
结论：合理引入，且已最优化（复用替代新建）

**task_dir 解析器**
1. 防御真实威胁：任务记录误写入 repo（D2 执行事故）
2. 现有覆盖：config 字段存在但无消费者，gap 已确认
3. 可绕过性：中（各 skill 可绕过不调用），测试覆盖作为验证手段
4. 长期维护成本：低（单一解析函数，各 skill 引用）
结论：合理引入，测试覆盖降低绕过风险
