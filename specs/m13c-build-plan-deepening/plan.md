# 实施计划：m13c-build-plan-deepening

**Task ID**: `m13c-build-plan-deepening` | **Date**: 2026-07-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification `specs/m13c-build-plan-deepening/spec.md`
**Status**: Draft

## 概述

本计划为 build-plan 深化（M13c）的实施步骤。核心目标是在 `workflows/build-plan/SKILL.md` 补入四类质量缺口：Phase 0 research 先行（spec-research）、data-contracts 落盘、simplicity-guard 四阶梯接入、plan-reviewer 独立工程审查；同时在 spec-analyze 补 ambiguity_items[]、spec-tasks 强化 no-placeholder 铁律、新建 task_dir 解析器、更新 reuse-registry。

设计原则：最小化核心改动（薄核心），所有新能力下沉到独立 skill 层；失败语义统一为"记录+升级人工，非硬阻断"（F4/F3）。（non-blocking 指不设自动硬停门，不代表跳过 FR-RESEARCH-002 的暂停+人工升级步骤；缺失 research.md 时仍先暂停，经人工确认/升级后才可继续）

## Technical Context

**Language/Version**: Markdown (SKILL.md 文件), Node.js v20 (task_dir 解析器 + 测试)
**Primary Dependencies**: 已有 skills/spec-research 框架（如已存在则复用）; vitest (已在项目中)
**Storage**: Filesystem — `specs/m13c-build-plan-deepening/`, `skills/`, `workflows/build-plan/`, `config/`
**Testing**: `npx vitest run`（task_dir 解析器测试）
**Target Platform**: workflowhub 仓库内，本地 macOS / CI 兼容
**Project Type**: workflow orchestration tool — SKILL.md 文档 + Node.js 解析器
**Performance Goals**: N/A（无性能目标，文档类改动）
**Constraints**: 不新建 spec-plan-review skill（D3：复用 3rd-review）；所有失败为 non-blocking（D4）；task_dir 路径不硬编码（D1）
**Scale/Scope**: ~7 文件修订/新建，~300-500 行改动

## Constitution Check

宪法合规判定见 [`constitution-check.md`](./constitution-check.md)（21/21 通过，当前版 F1-F10 / Q1-Q3 / S1-S8 条款）。

## F10 Anti-Over-Engineering Gate

对本计划中 4 个新机制逐条回答 F10 四问。

### 机制 1：spec-research skill（新建 `skills/spec-research/SKILL.md`）

1. **防御什么真实威胁？** 技术选型盲区在 plan 阶段才暴露——M13b 执行记录中存在实例（调研缺失导致 plan 后期返工）。
2. **现有机制是否覆盖？** 无。build-plan 当前无 research 步骤，gap 已确认。
3. **可否被绕过（安全剧场）？** 低。新增步骤，绕过等于不执行，后果可见（research.md 缺失即可检测）。
4. **长期维护成本？** 低。独立 SKILL.md 文件，与其他 skill 无耦合；研究结果落盘 research.md，可被版本管理追踪。

**结论：合理引入，保留。**

### 机制 2：data-contracts 步骤（build-plan SKILL.md 新增步骤）

1. **防御什么真实威胁？** tasks.md 分解前契约漂移——make-decision 阶段调研记录显示 API 契约未落盘导致 tasks 分解不一致。
2. **现有机制是否覆盖？** 无。当前 build-plan 无数据契约落盘步骤。
3. **可否被绕过？** 低。作为 build-plan 步骤，跳过则 data-contracts.md 不存在，可检测。
4. **长期维护成本？** 低。仅在 workflow SKILL.md 新增一步骤描述，不引入新代码依赖。

**结论：合理引入，保留。**

### 机制 3：simplicity-guard 四阶梯接入（spec-plan 前置判断）

1. **防御什么真实威胁？** 过度工程——plan 阶段未做复用判断，导致重复实现已有能力（M13b spec-ladder 经验）。
2. **现有机制是否覆盖？** simplicity-guard SKILL.md 已由 M13b 创建（AC-19 确认），此处为接入调用，非新建。
3. **可否被绕过？** 低。spec-plan 前置调用，结论写入 minimal-path 字段，可 grep 验证。
4. **长期维护成本？** 极低。复用现有 skill，不新建任何文件。

**结论：合理引入（复用优先），保留。**

### 机制 4：plan-reviewer（复用 3rd-review 基础设施）

1. **防御什么真实威胁？** plan 工程可行性未经独立评估——时间估算、技术风险、依赖顺序无独立核查，导致 build-code 阶段才暴露问题（历史记录）。
2. **现有机制是否覆盖？** 3rd-review plan-reviewer 基础设施已存在（D3 决策：复用替代新建）；不新建 skill，不引入新维护面。
3. **可否被绕过？** 低。plan-reviewer 调用结果写入 plan-eng-review.md，缺失时记录 unavailable + 升级人工（non-blocking，FR-PLANREVIEW-002）。
4. **长期维护成本？** 极低。复用外部 3rd-review 基础设施，workflowhub 侧仅维护"调用约定"描述。

**结论：合理引入（已最优化：复用替代新建），保留。**

**F10 Gate 结论：4 个新机制全部通过，无项被移除。**

---

### 机制 5：task_dir 解析器（新建 `core/task-dir-parser.mjs`）

1. **现有机制能解决吗？** 不能——现有 SKILL.md 均硬编码路径，无统一读取 config 的机制，D2 事故根因。
2. **不加会怎样？** 各 SKILL.md 继续硬编码，跨机器/用户配置失效，AC-16 无法验证。
3. **最小实现？** 单一函数读取 `config/workflowhub.yaml` task_dir 字段，带默认回退，无第三方依赖。
4. **会不会造成新复杂度？** 不会——函数≤20行，接口唯一（返回绝对路径字符串），消费者仅做路径替换。

**结论：合理引入，已最简实现。**

## Project Structure

### Documentation (this feature)

```text
specs/m13c-build-plan-deepening/
├── spec.md                    — Build-spec output (authoritative)
├── plan.md                    — 本文件 (spec-plan workflow output)
├── tasks.md                   — spec-tasks workflow output
├── cross-artifact-analysis.md — spec-analyze output
├── research.md                — spec-research Phase 0 output (新建于 build-code)
├── data-contracts.md          — data-contracts 步骤 output (新建于 build-code)
└── plan-eng-review.md         — plan-reviewer output (新建于 build-code)
```

### Source Code (repository root)

```text
skills/spec-research/
└── SKILL.md                   [NEW] Phase 0 research skill

workflows/build-plan/
└── SKILL.md                   [MODIFY] 新增 Phase 0/data-contracts/plan-reviewer 步骤

skills/spec-analyze/
└── SKILL.md                   [MODIFY] stage-result.facts 新增 ambiguity_items[]

skills/spec-tasks/
└── SKILL.md                   [MODIFY] 强化 no-placeholder 铁律，STOP/Knowledge 约定

skills/simplicity-guard/
└── SKILL.md                   [UNCHANGED] M13b 已落盘，无需修改

workflows/build-spec/
└── SKILL.md                   [UNCHANGED] M13b/D9 已接入 simplicity-guard

reuse-registry.md              [MODIFY] 新增 upstream_delta 列，spec-research 登记行

config/workflowhub.yaml        [UNCHANGED content, new consumer] task_dir 字段已存在，新增解析器消费者

core/task-dir-parser.mjs       [NEW] task_dir 解析器实现（建议路径，build-code 阶段确定）
core/task-dir-parser.test.mjs  [NEW] task_dir 解析器测试（vitest）
```

**Structure Decision**: `core/` 目录放置跨 skill 共享工具。task_dir 解析器不属于任何单一 skill，放 `skills/` 不合语义。宪法 S1（能用外部就不造轮子）：YAML 解析复用 Node.js 标准库，不引入第三方依赖；工具文件直接放项目内，符合 S1 落地手法。宪法 S2（外部技能可针对项目改造合宪）：task_dir 解析器无外部 skill 来源，不适用 S2；目录结构本身与宪法目录约定（`skills/workflows/config/`）相容，`core/` 作为基础设施扩展层，config/ 内容不改动。

## Complexity Tracking

> WHY: plan-reviewer 依赖外部 3rd-review 路径（/Users/Hugh/Hugh/Project/3rd-review/verifiers/vibecoding/），在 workflowhub 仓库中不存在。
> TRADEOFF: build-code 阶段需验证该路径可访问；不可访问时走 record+escalate_to_human（non-blocking）。
> JUSTIFICATION: D3 决策明确"复用替代新建"，引入跨仓路径依赖是最低维护成本选项；AC 中明确要求 build-plan/build-code 调用前须验证路径可访问性。

> WHY: task_dir 解析器需要多个 skill（spec-research、spec-analyze、spec-tasks 等）在读写任务跟踪文件前调用它，涉及改造面较广。
> TRADEOFF: 改造多个 SKILL.md 需同步更新，有漏改风险。
> JUSTIFICATION: spec 附录 A FRICTION 建议"最小化到单一解析函数"，减少改造面；task_dir 解析器本身实现简单（读 yaml → 返回路径），测试覆盖作为验证手段。

## Implementation Steps

### Phase 1: 基础设施（Foundation）

**目的**: 建立新 skill 和解析器，为后续步骤提供基础。

#### Step 1.1：新建 `skills/spec-research/SKILL.md`

**做什么**: 创建 Phase 0 research skill 文件，包含 task-id 输入要求、research.md 产出约定、跳过选项（FR-RESEARCH-003）。
**涉及文件**: `skills/spec-research/SKILL.md`（NEW）
**FR 映射**: FR-RESEARCH-001, FR-RESEARCH-002, FR-RESEARCH-003
**AC 映射**: AC-01

#### Step 1.2：新建 task_dir 解析器 + 测试

**做什么**: 在 `core/task-dir-parser.mjs` 实现单一解析函数，读取 `config/workflowhub.yaml` 中 task_dir 字段，回退默认路径 `~/Knowledge/workflowhub/`；写对应 vitest 测试（默认值回退 + 显式配置两个场景）。
**涉及文件**: `core/task-dir-parser.mjs`（NEW）, `core/task-dir-parser.test.mjs`（NEW）
**FR 映射**: FR-TASKDIR-001, FR-TASKDIR-002
**AC 映射**: AC-16, AC-17
**AC-16 验证口径**：须在各消费者 SKILL.md 文件中 grep 到对 `core/task-dir-parser.mjs` 的调用说明（import 或调用字样），文档/注释单独存在不通过；须由 T010 执行代码级 grep 验证命中。

### Phase 2: 核心 SKILL.md 修订

**目的**: 修订 build-plan、spec-analyze、spec-tasks 三个核心文件。

#### Step 2.1：修订 `workflows/build-plan/SKILL.md`

**做什么**:
- 新增 Phase 0（Step 0）：调用 spec-research，产出 research.md
- Phase 1 新增 data-contracts 步骤：在 spec-plan 之前，写 data-contracts.md
- 新增 plan-reviewer 步骤（Step N+1）：调用 3rd-review plan-reviewer，产出 plan-eng-review.md；失败按 D4 口径（记录+升级人工，non-blocking）
- spec-plan 步骤前增加 simplicity-guard 前置调用，结论写入 minimal-path 字段

**涉及文件**: `workflows/build-plan/SKILL.md`（MODIFY）
**FR 映射**: FR-RESEARCH-001, FR-DATACONTRACTS-001/002, FR-SIMPLICITY-001/002, FR-PLANREVIEW-001/002/003
**AC 映射**: AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09

#### Step 2.2：修订 `skills/spec-analyze/SKILL.md`

**做什么**: 在 stage-result.facts 新增 ambiguity_items[] 数组字段，每项含 description + escalation_path（可选值：human_confirm / next_iteration / acceptable_ambiguity）；缺失时 warn，不阻断。
**涉及文件**: `skills/spec-analyze/SKILL.md`（MODIFY）
**FR 映射**: FR-ANALYZE-001, FR-ANALYZE-002
**AC 映射**: AC-10, AC-11

#### Step 2.3：修订 `skills/spec-tasks/SKILL.md`

**做什么**: 强化 no-placeholder 铁律（禁止 TODO/TBD/placeholder/待定/暂缺）；发现时标记 blocking_item:true，记录 friction，stage-result.human_intervention=true，但不阻断 spec-tasks 或 build-plan stage 推进；新增 STOP/Knowledge 标签约定 + upstream_delta 字段（软要求，缺失 warn）。
**涉及文件**: `skills/spec-tasks/SKILL.md`（MODIFY）
**FR 映射**: FR-TASKS-001, FR-TASKS-002
**AC 映射**: AC-12, AC-13, AC-14

### Phase 3: 收尾与配套

**目的**: 更新 reuse-registry，确认 simplicity-guard 已接入，做最终验证。

#### Step 3.1：更新 `reuse-registry.md`

**做什么**: 新增 upstream_delta 列，为 spec-research 添加登记行（含 upstream_delta 值）。
**涉及文件**: `reuse-registry.md`（MODIFY）
**FR 映射**: FR-REGISTRY-001
**AC 映射**: AC-15

#### Step 3.2：确认 simplicity-guard 和 build-spec 接入状态

**做什么**: grep 确认 `skills/simplicity-guard/SKILL.md` 存在（AC-19）；确认 `workflows/build-spec/SKILL.md` 已含 simplicity-guard 引用（M13b 已落盘，本步仅核实，无需改动）。
**涉及文件**: `skills/simplicity-guard/SKILL.md`（UNCHANGED）, `workflows/build-spec/SKILL.md`（UNCHANGED）
**FR 映射**: FR-SIMPLICITY-001, FR-SIMPLICITY-002
**AC 映射**: AC-19

#### Step 3.3：plan-reviewer 跨仓路径验证约定

**做什么**: 在 `workflows/build-plan/SKILL.md` plan-reviewer 步骤中明确"调用前验证 /Users/Hugh/Hugh/Project/3rd-review/verifiers/vibecoding/ 路径可访问；不可访问时记录 unavailable + 升级人工，不硬阻断流程"（FR-PLANREVIEW-003/AC-09 口径）。
**涉及文件**: `workflows/build-plan/SKILL.md`（已在 Step 2.1 一并处理）
**FR 映射**: FR-PLANREVIEW-003
**AC 映射**: AC-07, AC-09

## M10 Baseline Comparison

> Per SKILL.md Step 6：所有 unknown 值使用确切原因说明，不使用占位值。

| Metric | M13c build-plan 阶段 | M10 Baseline | 方向与 Delta |
|--------|---------------------|--------------|-------------|
| missed_step_rate | unknown — build-plan 阶段产物尚未进入 build-code/verify-code 执行，missed_step_rate 需从 verify-code stage-result 的 step 执行记录中计算，当前数据不可得 | 0.05 | unknown |
| test_execution_rate | unknown — 需从 verify-code 阶段的测试执行记录中计算，当前 build-plan 阶段无测试执行数据可用 | 0.8295 | unknown |
| review_execution_rate | unknown — build-plan 阶段 review checkpoint 设为 pending（非交互模式），review_invoked=false；build-code/verify-code 的 review_execution_rate 数据尚未产生，无法从当前上游 stage-result 记录中计算 | 1 | unknown |
| rework_rounds | unknown — 当前 build-plan 为首次执行（round 1），但最终 rework_rounds 需等 build-code 和 verify-code 执行完毕后汇总；仅 make-decision/decision-log 记录已有数据（合计 1 轮），build-plan/build-code/verify-code 轮数尚未产生 | 6.075 | unknown（进行中） |
| rework_proxy_count | unknown — rework_proxy_count 需从 task-metrics.jsonl 跨 stage 汇总计算，build-code/verify-code 数据尚未产生，无法计算 | 25.25 | unknown |

> 注：所有 5 项在 build-plan 阶段均为 unknown，原因明确（上游 build-code/verify-code 数据尚未产生）。unknown 不阻断推进（F3/Q1）。

## Scope Boundary Verification

以下文件 **不可触碰**（本计划明确排除）：

- `workflows/build-code/SKILL.md` — 不在本次改动范围
- `workflows/verify-code/SKILL.md` — 不在本次改动范围
- `workflows/make-decision/SKILL.md` — 不在本次改动范围
- `workflows/build-spec/SKILL.md` — M13b 已落盘，本次仅读取确认（Step 3.2），不改动
- `skills/simplicity-guard/SKILL.md` — M13b 已落盘，本次仅确认存在（Step 3.2），不改动

## Verification Mapping

| Step | Maps to FRs | Verified by AC |
|------|-------------|----------------|
| Step 1.1：新建 spec-research SKILL.md | FR-RESEARCH-001/002/003 | AC-01 |
| Step 1.2：task_dir 解析器 + 测试 | FR-TASKDIR-001/002 | AC-16, AC-17 |
| Step 2.1：修订 build-plan SKILL.md（Phase 0 + data-contracts + simplicity-guard + plan-reviewer） | FR-RESEARCH-001, FR-DATACONTRACTS-001/002, FR-SIMPLICITY-001/002, FR-PLANREVIEW-001/002/003 | AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09 |
| Step 2.2：修订 spec-analyze SKILL.md | FR-ANALYZE-001/002 | AC-10, AC-11 |
| Step 2.3：修订 spec-tasks SKILL.md | FR-TASKS-001/002 | AC-12, AC-13, AC-14 |
| Step 3.1：更新 reuse-registry.md | FR-REGISTRY-001 | AC-15 |
| Step 3.2：确认 simplicity-guard + build-spec 接入 | FR-SIMPLICITY-001/002 | AC-19 |
| Step 3.3：plan-reviewer 跨仓路径验证约定（已含于 Step 2.1）| FR-PLANREVIEW-003 | AC-09 |
| AC-18（独立异源审查）| — | 由 codex/3rd-review 产物路径验证 |
