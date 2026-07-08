# 实施计划：wh-quality-convergence

**Task ID**: `wh-quality-convergence` | **Date**: 2026-07-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/wh-quality-convergence/spec.md`
**Status**: Draft

## Summary

收敛 workflowhub 全链路交付质量：把 receipt 校验从"只查格式"真升为"核验真实工作发生"（git diff + 测试结果比对）；新增 project-key 索引（manifest 追加式，不改变目录结构）；task_dir 配置持久化到 `~/.workflowhub/config.json`；新增 flow_profile 占位字段。全程不引入新阻断型质量门，失败路径统一为"报错停下不静默兜底"。本计划覆盖 build-plan 可规划范围，D1-B/D3-B/D5 的实现代码推迟到 build-code 阶段。

## Technical Context

**Language/Version**: Markdown (spec/plan/tasks), JavaScript (Node.js v20+, implementation)
**Primary Dependencies**: None new — only existing workflowhub dependencies (vitest for tests)
**Storage**: Filesystem — `specs/wh-quality-convergence/`, `core/`, `scripts/`, `contracts/`
**Testing**: `npm test` (vitest)
**Target Platform**: CLI (Node.js), CI/CD pipeline
**Project Type**: AI workflow orchestration tool
**Performance Goals**: N/A — quality convergence, not performance optimization
**Constraints**: CONSTITUTION.md 21 clauses mandatory; F4 无阻断型质量门; F9 可证伪不假绿; D1-D6 已批准决策不能推翻
**Scale/Scope**: 3-5 files modified, 1-2 new files, ~400-600 lines total

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Framework Principles (F)

- [x] **F1 薄核心** — 判据：本次改动在 core/task-index.mjs 新增、scripts/validate-stage-result.mjs 扩展，core/ 层模块各自独立，不改编排层。
- [x] **F2 窄契约** — 判据：task-index.mjs 只暴露 appendTaskIndex/lookupProjectKey 两个函数；config.json 只定义 task_dir 字段；接口窄而明确。
- [x] **F3 物理事实靠机器校验但不阻断** — 判据：receipt 真核验由 validate-stage-result.mjs 校验证据存在性（机器客观采集），校验结果仅记录浮现不阻断跨 stage 推进。
- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：不新增跨 stage 强制审批门；review 步骤仍走 wh-review 异源审查 + 人工确认（F7）。
- [x] **F5 gate 谨慎添加出事再补无用则移除** — 判据：新增机制均由原始 issue 明确根因驱动（D1 真实 receipt 形同虚设、D3 project-key 隔离缺失、D5 沙箱不可见），非预先堆砌。
- [x] **F6 统一外置执行记录** — 判据：metrics/collector.mjs 已有全流程指标记录入口，本 plan 新增指标不违背此原则。
- [x] **F7 推进与不可逆操作不自动越过人** — 判据：build-plan 阶段 Step 9 保留人工确认硬门（七要素摘要 + 请确认），不自动通过。
- [x] **F8 简单优先** — 判据：manifest 索引选追加式文件而非目录重构（更简单）；receipt 校验基于既有 validate-stage-result.mjs 扩展而非重写。
- [x] **F9 可证伪不假绿** — 判据：receipt 校验在证据缺失时如实报错，不伪造"通过"；task_dir 读取失败时报错，不静默套默认值。
- [x] **F10 自动化按真实收益添加，不为"机器可校验"本身堆基建** — 判据：见下文 F10 gate 评估表，所有新增机制均有真实问题根因。

### Quality Principles (Q)

- [x] **Q1 记事实而非阻断** — 判据：receipt 校验结果、task_dir 解析结果均只记录到 stage-result facts，不跨 stage 阻断推进。
- [x] **Q2 gate 三类划分** — 判据：build-plan 入口校验（Stage 1）、记录采集（Step 5 宪法检查/Step 6 baseline）、人工确认（Step 9）三类明确分离。
- [x] **Q3 异源审查加人工把关** — 判据：plan-eng-review 已通过 3rd-review 异源审查独立产出再交人工确认。

### Skill Principles (S)

- [x] **S1 能用外部就不造轮子** — 判据：spec-research/spec-plan/spec-tasks/spec-analyze 均复用既有 skill，不重新发明。
- [x] **S2 外部技能可针对项目改造合宪** — 判据：各子 skill 已改造适配 workflowhub 契约（去 git 分支耦合、改路径推导）。
- [x] **S3 迭代时保持最新并就地检查** — 判据：本 plan 消费最新版 build-spec 产出 spec.md（2026-07-08 最终审查）。
- [x] **S4 自定义技能必须有指标系统** — 判据：build-plan 阶段记录 metrics 到 metrics/collector.mjs。
- [x] **S5 自定义技能方便子代理调用省主上下文** — 判据：各子 skill（spec-plan/tasks/analyze）均接受 task-id 参数调用，不依赖主上下文状态。
- [x] **S6 自定义技能参考市面方案不闭门造车** — 判据：speckit 系列 skill 参考 speckit 市面方案改造。
- [x] **S7 一阶段一技能一工作流一文件夹** — 判据：build-plan 独立于 workflows/build-plan/，不侵入其他 stage。
- [x] **S8 自定义技能可独立调用可搬运** — 判据：各子 skill 可被任意 stage 按 task-id 参数调用，不绑死特定编排流程。

**Constitution Check Result**: 21/21 clauses addressed. 21 pass, 0 fail.

## Project Structure

### Documentation (this feature)

```text
specs/wh-quality-convergence/
├── spec.md                    # Build-spec output (authoritative, 355 lines)
├── plan.md                    # This file (spec-plan output)
├── tasks.md                   # spec-tasks output
├── research.md                # spec-research output
├── data-contracts.md          # Build-plan Step 1.5 output
├── baseline-report.md         # Build-spec output (M10 baseline)
├── constitution-check.md      # Build-spec output
└── tasks/
    └── builds-spec-review-*/  # Build-spec review artifacts
```

### Source Code (repository root)

```text
workflowhub/
├── core/
│   ├── task-index.mjs                    # NEW — manifest index (append/lookup)
│   ├── __tests__/
│   │   └── task-index.test.mjs           # NEW — task-index tests
│   └── task-dir-parser.mjs               # MODIFY — add config.json read (build-code)
├── scripts/
│   └── validate-stage-result.mjs         # MODIFY — add receipt verification
├── contracts/
│   ├── stage-result.contract.json        # UNCHANGED — flow_profile written to make-decision decision-log facts
│   └── facts-subschema.json              # UNCHANGED — flow_profile not in contracts schema
├── workflows/
│   ├── build-spec/SKILL.md               # MODIFY — add receipt verification step
│   ├── build-plan/SKILL.md               # MODIFY — add receipt verification step
│   ├── build-code/SKILL.md               # MODIFY — add receipt verification step
│   └── verify-code/SKILL.md              # MODIFY — add receipt verification step
├── tests/
│   └── receipt-verification.test.mjs     # NEW — receipt verification tests
├── config/
│   └── workflowhub.yaml                  # UNCHANGED — task_dir stays as-is, build-code updates for config.json
└── ~/.workflowhub/
    └── config.json                       # NEW — task_dir config file (build-code)
```

**Structure Decision**: 遵循 S7 一阶段一技能一工作流一文件夹约定。新增 core/task-index.mjs 作为独立模块，不侵入既有 core/ 模块。扩展 validate-stage-result.mjs 而非新建校验脚本（F8 简单优先）。

## Complexity Tracking

No constitution violations requiring justification.

## Implementation Steps

### Phase 1: Setup / Foundation

#### Step 1.1: 定义 flow_profile 字段和 facts schema

flow_profile 由 make-decision 写入该任务的 decision-log.md（facts.flow_profile 字段），下游只读取不校验不分支。修改 make-decision SKILL.md 增加 flow_profile 写入步骤。

**Files**: `workflows/make-decision/SKILL.md` (MODIFY)
**Maps to**: FR-FLOWPROFILE-001 — flow_profile 由 make-decision 写入 decision-log facts，非 contracts schema

#### Step 1.2: receipt 真核验 — validate-stage-result.mjs 扩展

在 `scripts/validate-stage-result.mjs` 中新增 `getRealChangedFiles()`（git diff 获取实际变更文件）和 `verifyReceipts()`（比对声明与真实变更）。入口：每个 stage 落盘后调用，证据缺失时的失败路径为"报错停下"，不默认通过。

**Files**: `scripts/validate-stage-result.mjs` (MODIFY), `tests/receipt-verification.test.mjs` (NEW)
**Maps to**: FR-RECEIPT-001, FR-RECEIPT-002

#### Step 1.3: 四阶段 SKILL.md 接入 receipt 校验

在 build-spec、build-plan、build-code、verify-code 四个 SKILL.md 的 stage-result 落盘步骤后，增加 receipt 校验调用（调用 Step 1.2 产出的 verifyReceipts）。

**Files**: `workflows/build-spec/SKILL.md` (MODIFY), `workflows/build-plan/SKILL.md` (MODIFY), `workflows/build-code/SKILL.md` (MODIFY), `workflows/verify-code/SKILL.md` (MODIFY)
**Maps to**: FR-RECEIPT-001, FR-RECEIPT-002

### Phase 2: Core Implementation

#### Step 2.1: 新建 core/task-index.mjs

实现 `appendTaskIndex(taskId, projectKey, repoUrl)` 和 `lookupProjectKey(taskId)` 两个函数。追加式写入 `~/.workflowhub/task-index.json`，冲突时报错停下。

**Files**: `core/task-index.mjs` (NEW), `core/__tests__/task-index.test.mjs` (NEW)
**Maps to**: FR-PROJECTINDEX-001, FR-PROJECTINDEX-002

#### Step 2.2: config.json | FR-TASKDIR-001, FR-TASKDIR-002, FR-TASKDIR-003 | AC4

新建 `~/.workflowhub/config.json`（用户显式配置，无默认值，读不到/格式错 fail-loud），修改 `core/task-dir-parser.mjs` 加入 config.json 读取路径（WORKFLOWHUB_TASK_DIR → config.json → fail-loud 优先级链（spec FR-TASKDIR-001/003, AC4））。注意解决现有测试禁止 home 兜底的冲突 — 按 fail-loud 方向调整测试预期。

**Files**: `~/.workflowhub/config.json` (NEW), `core/task-dir-parser.mjs` (MODIFY), `core/__tests__/task-dir-parser.test.mjs` (MODIFY)
**Maps to**: FR-TASKDIR-001, FR-TASKDIR-002, FR-TASKDIR-003

### Phase 3: Polish / Verification

#### Step 3.1: 回归测试与边界覆盖

运行全量测试确保旧功能不回归。对 receipt 校验补充边界用例：空 diff、测试未跑、证据声明不匹配、no_code_change 声明缺失。对 task-index 补充并发写入和文件损坏场景。

**Files**: `tests/receipt-verification.test.mjs` (NEW), `core/__tests__/task-index.test.mjs` (NEW), `core/__tests__/task-dir-parser.test.mjs` (MODIFY)
**Maps to**: FR-RECEIPT-002 (AC1-AC4), FR-PROJECTINDEX-002 (AC1-AC3), FR-TASKDIR-002 (AC1-AC3)

### Scope Boundary Verification

**DO NOT TOUCH**:
- `workflows/make-decision/SKILL.md` — 上游阶段，不变更（仅例外：Step 1.1 flow_profile 字段追加到 facts，不涉逻辑变更）
- `workflows/build-spec/SKILL.md` 的现有 constitution 流程 — 只增加 receipt 校验步骤
- `skills/wh-review/` — 异源审查底层设施不变更
- `core/worktree-reuse-guard.mjs` — D6 维持现状
- `core/worktree-context.mjs` — 无变更需求
- `skills/intake-decision-review/` — 改名推迟到 build-code 后
- `skills/wh-review/contracts/intake.md` — FR-TASKDIR-001 条款同步推迟到 build-code

## F10 Anti-Over-Engineering Gate

| Mechanism | Q1: What real threat does this defend against? | Q2: Does any existing mechanism already cover it? | Q3: Can it be bypassed? | Q4: What is the long-term maintenance cost? | Keep? |
|---|---|---|---|---|---|
| receipt 真核验 | D1: 校验只查格式不查真实工作（历史已发生多次空跑） | No — 现有校验仅验证 schema | 绕不过 — 证据缺失时 fail-loud | 低 — 复用现有 validate-stage-result.mjs | KEEP |
| flow_profile 字段 | D2: 无区分 full/fast 模式的标记位，后续自动化无依据 | No — 不存在 | N/A — 仅占位不驱动行为 | 低 — 单字段 schema 变更 | KEEP |
| manifest 索引 | D3: 多项目 task-id 无法反查 project-key/repo | No — 现有目录结构无索引 | 破坏索引文件会报错停下 | 低 — 追加式文件，无定期维护 | KEEP |
| config.json task_dir 持久化 | D5: Multica 沙箱看不到 WORKFLOWHUB_TASK_DIR env var | No — 仅有 env var 和 yaml fallback | 读不出时报错，不静默 | 低 — 单字段配置文件 + 解析器修改 | KEEP |

**F10 Gate Result**: 4 mechanisms evaluated, 4 kept, 0 pruned.



### Governance Sync Matrix

本 plan 按 7 个固定分类逐类判断改动范围（合同要求）：

| 分类 | 改/不改 | 原因 | Task ID |
|------|---------|------|---------|
| 项目规则（CLAUDE.md/AGENTS.md） | 不改 | 本计划不修改项目规则文件 | N/A |
| workflow 定义（stage SKILL.md） | 改 | build-plan/build-code/verify-code/build-spec 四个 SKILL.md 增加 receipt 校验步骤；make-decision SKILL.md 追加 flow_profile facts 写入（字段级追加，非逻辑变更） | T010-T013, T002 |
| reviewer contract（审查合同） | 不改 | 审查基础设施不变更 | N/A |
| schema（stage-result.contract.json/facts-subschema.json） | 不改 | flow_profile 在 make-decision decision-log facts 写入，非 contracts schema | N/A |
| runtime config（config.json） | 改 | 新建 ~/.workflowhub/config.json 持久化 task_dir | T008-T009 |
| knowledge/doc | 不改 | 文档随代码更新，无需独立治理变更 | N/A |
| automation gates/CI/hooks | 不改 | 无新增 gate/CI/hook | N/A |

### 接口签名锚点（SIG）

| SIG ID | 模块 | 当前签名描述 | 对应 Task |
|--------|------|-------------|-----------|
| SIG-001 | `scripts/validate-stage-result.mjs` | 导出 `validateStageResult({stage, stageResultPath, worktreeRoot})`，exit code 0/1。需扩展 `getRealChangedFiles()` / `verifyReceipts()` | T004, T005 |
| SIG-002 | `core/task-dir-parser.mjs` | 导出 `parseTaskDir()`，优先级：WORKFLOWHUB_TASK_DIR env → yaml.task_dir → fail-loud。需新增 config.json 读取路径 | T008 |
| SIG-003 | `contracts/stage-result.contract.json` | 定义 `{status, error_code, retryable, facts, missing_items, user_decision, reason, review}` schema。flow_profile 字段加在 stage-result facts（由 make-decision 写入），本 stage schema 不变更 | N/A |
| SIG-004 | `workflows/build-plan/SKILL.md` step 8 | wh-review Phase 1 (prepareRoundState) + Phase 2 (invoke-review-engine) 调用点。需保证 stage-result 落盘后校验入口正确 | T011 |

## Verification Mapping

| Step | Maps to FRs | Verified by AC |
|---|---|---|
| Step 1.1: flow_profile | FR-FLOWPROFILE-001 | AC2
| Step 1.2: receipt verification | FR-RECEIPT-001, FR-RECEIPT-002 | AC1
| Step 1.3: SKILL.md wiring | FR-RECEIPT-001, FR-RECEIPT-002 | AC1
| Step 2.1: task-index.mjs | FR-PROJECTINDEX-001, FR-PROJECTINDEX-002 | AC3
| Step 2.2: config.json | FR-TASKDIR-001, FR-TASKDIR-002, FR-TASKDIR-003 | AC4
| Step 3.1: regression tests | All FRs | AC1-AC4
