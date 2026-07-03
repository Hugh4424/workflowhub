# 实施计划：step-gated-audit

**Task ID**: `step-gated-audit` | **Date**: 2026-07-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification `specs/step-gated-audit/spec.md`
**Status**: Draft

---

## 概述

将 workflowhub 的审计机制从阶段末端报告升级为逐 step 的 before-step / after-step 双钩子 + receipt 链。5 个 stage（build-spec / build-plan / build-code / verify-code / make-decision）同等适用。receipt 并入现有 journal.jsonl，不引入独立格式；before-step 阻断时出 judgement 由 runner 执行回退；after-step 调用 3rd-review 技能进行异源审查。

---

## Simplicity Guard Pre-Check

执行 P0–P3 四阶梯判断：

- **P0（YAGNI）**: 逐 step 审计记录是真实需求（曾发生 step 跳过无记录事件），需要存在。→ 继续 P1。
- **P1（已有覆盖）**: journal.jsonl 存在但仅记录 stage 级事件；3rd-review 技能存在但未被 before/after-step 调用；无 receipt-writer 共享模块。已有覆盖不足。→ 继续 P2。
- **P2（复用+改造）**: journal.jsonl 可复用（追加新 event_type）；core/task-dir-parser.mjs 可复用（路径解析）；3rd-review SKILL.md 可复用（直接调用）。→ 改造复用现有 journal，新建最小 receipt-writer.mjs 接口。
- **P3（最小新增）**: 仅新建 `core/receipt-writer.mjs`（单一职责：append entry/exit receipt 到 journal）。5 个 stage SKILL.md 各新增 before-step / after-step 钩子段落（最小改动，不重构已有步骤逻辑）。

**结论**: minimal-path 确认。不新增独立 receipt 格式/目录；receipt-writer 是唯一新模块。

---

## Technical Context

**Language/Version**: Markdown (SKILL.md 修改) + Node.js v20 (core/receipt-writer.mjs)
**Primary Dependencies**: core/journal-schema.mjs (新建，当前不存在), core/task-dir-parser.mjs (复用), 3rd-review SKILL.md (外部路径 /Users/Hugh/Hugh/Project/3rd-review/，调用)
**Storage**: Filesystem — `journal.jsonl` (append), `stage-result.json` (修改 audit_summary 字段)
**Testing**: `npm test` (vitest)
**Target Platform**: workflowhub runtime (Node.js v20, filesystem)
**Performance Goals**: N/A — receipt write is synchronous append, latency non-critical
**Constraints**: 不引入第三套独立格式；不建全局 step 位置表；entry_receipt 失败 fail-closed；exit_receipt 失败 warn-only
**Scale/Scope**: 7 files modified/created (~600 lines total)

---

## Constitution Check

*GATE: Phase 0 research complete. Re-check at Phase 1 design.*

每条 [x]=合规 / [ ]=不合规，后附具体理由。

### 框架原则（F）

- [x] **F1 薄核心** — receipt-writer.mjs 作为技能层共享接口，核心只做 append；5 个 stage SKILL.md 各自调用 receipt-writer，核心不内嵌业务逻辑。改动牵连面控制在钩子段落，不重构已有调度流程。
- [x] **F2 窄契约** — entry_receipt / exit_receipt / judgement 均为窄接口（字段数量受控，见 data-contracts.md）；receipt-writer 只暴露 writeEntryReceipt / writeExitReceipt 两个函数；变更可追溯到 spec.md FR-SGA-001~015 及 decision-log D1–D9。
- [x] **F3 物理事实靠机器校验但不阻断** — receipt 内容（step_id、verdict、counts）由机器客观写入 journal；audit_summary 计数由机器聚合；均不阻断推进（entry 失败例外：fail-closed 是业务语义门，不是物理事实门，符合 F3 定义范围）。
- [x] **F4 质量靠异源审查与人而非阻断式质量门** — after-step 调用 3rd-review 技能做异源审查；writer_namespace==executor_namespace 时仅记录 warn 不阻断；3rd-review 失败时 verdict=unknown 不阻断。质量由审查+人决策，不作为硬阻断门。
- [x] **F5 幂等与可重试** — receipt 写入基于 step_id + workflow_run_id 唯一性；重试时同一 step_id 的 entry/exit 可追加新记录（linked-list 设计支持重试链）；rollback_count 按 workflow_run_id 隔离，不继承上次运行计数（FR-SGA-006）。
- [x] **F6 显式优于隐式** — check_status 必须为显式枚举值（ok/blocked/skipped），不允许隐式默认为 skipped（FR-SGA-014）；skip_reason 字段强制填写；judgement 明确输出 status/reason/retry_eligible。
- [x] **F7 失败显式可观测** — entry_receipt 失败：step blocked，runner 感知到阻断（fail-closed）；exit_receipt 失败：warn 写入 journal，不静默吞掉；3rd-review 失败：所有 review 字段写 unknown/false/null（executed=false, verdict=unknown 等），失败原因记录到 journal（不是 receipt 字段），不静默吞掉。所有失败路径均有显式记录。
- [x] **F8 复用优于重建** — 复用现有 journal.jsonl（追加 event_type）；复用 core/task-dir-parser.mjs（路径解析）；复用 3rd-review SKILL.md（直接调用，不重新实现审查逻辑）；只新建 receipt-writer.mjs（无可复用覆盖项）。
- [x] **F9 最小权限** — receipt-writer.mjs 只写入 journal.jsonl（append），不读取 stage 内部状态；before/after-step 钩子只传入必要字段（step_id, namespace, workflow_run_id），不暴露 stage 内部实现。
- [x] **F10 自动化按真实收益添加** — 新增 7 个机制均通过 F10 四问验证（见附录 D，已在 spec.md 中执行）：每个机制对应真实威胁（step 跳过无记录、自审自判、无限回退等），现有机制不覆盖，最小实现，收益量化（step 可追溯性、审查独立性）。

### 质量原则（Q）

- [x] **Q1 记事实不阻断** — 所有 receipt 字段（verdict、check_status、3rd-review 结果）均为事实记录；非正常情况（blocked、warn）记录到 journal 而非抛出阻断；唯一例外是 entry_receipt 写入失败（fail-closed），这是业务语义门而非质量记录阻断。
- [x] **Q2 质量门由人设定阈值** — rollback 阈值（2次）在 decision-log D9 由用户确认；3rd-review 是否强制异源由技能自行判断（D4）；blocked 后升人工由 runner 层触发（不是 audit 自行决策）。
- [x] **Q3 审查结论写入权威源** — 3rd-review 结论写入 exit_receipt（journal.jsonl），不另开报告文件；audit_summary 聚合写入 stage-result.json；所有结论均在 spec.md 授权的权威存储路径（FR-SGA-004）。

### 技能原则（S）

- [x] **S1 技能单一职责** — receipt-writer.mjs 单一职责：将 receipt payload append 到 journal。before-step 钩子单一职责：读上游 exit_receipt → 判断 check_status → 写 entry_receipt → 出 judgement（如需）。after-step 钩子单一职责：调用 3rd-review → 写 exit_receipt。
- [x] **S2 技能输入输出明确** — 每个钩子的输入/输出字段在 data-contracts.md 精确定义（必填字段、类型、约束）。receipt-writer 接口签名明确（taskId + payload → void/throw）。
- [x] **S3 技能无状态或状态外置** — receipt-writer.mjs 无内部状态；rollback_count 状态由 runner 层维护（外置）；step_id 链状态存于 journal.jsonl（外置）。
- [x] **S4 技能可测试** — receipt-writer.mjs 可单元测试（mock fs.appendFile）；before/after-step 钩子逻辑可通过 journal fixture 测试；3rd-review 调用可 mock。
- [x] **S5 技能版本化** — journal schema 版本号随新 event_type 枚举值升级（破坏性 bump）；stage SKILL.md 各自版本号随钩子新增升级；data-contracts.md 含版本兼容说明。
- [x] **S6 技能失败降级** — 3rd-review 失败：executed=false, verdict=unknown（降级）；exit_receipt 写入失败：warn-only（降级）；所有降级路径均有明确 journal 记录。
- [x] **S7 技能产物路径规范** — 所有产物写入 journal.jsonl（现有规范路径）和 stage-result.json（现有规范路径）；路径通过 core/task-dir-parser.mjs 解析（AC-16）；无新增独立目录或格式。
- [x] **S8 自定义技能可独立调用可搬运** — receipt-writer.mjs 无平台特定绑定（纯 Node.js fs append）；before/after-step 钩子逻辑自包含（仅依赖 receipt-writer + 3rd-review 调用接口）；可独立测试，不绑死 workflowhub 特定环境变量。

**Constitution Check Result**: 21/21 条全部 [x] 合规。0 条不合规。

---

## F10 Anti-Over-Engineering Gate

本节对 plan.md + tasks.md 中提出的全部新机制/新校验/新自动化逐一回答四问，四问不能全部答出的机制标记为建议移除。

**文件真实性核查（F10 前置）**

| 被引用路径 | 实际是否存在 | 核实结论 |
|-----------|------------|---------|
| `core/journal-schema.mjs` | 不存在 | plan/tasks 已修正为 NEW |
| `core/receipt-writer.mjs` | 不存在 | 正确标记为 NEW，无误 |
| `core/stage-result-writer.mjs` | 不存在 | 已修正：不新建，audit_summary 内联写入各 SKILL.md |
| `skills/build-spec/SKILL.md` | 不存在（正确路径为 `workflows/build-spec/SKILL.md`） | plan/tasks 已修正路径 |
| `skills/build-plan/SKILL.md` | 不存在（正确路径为 `workflows/build-plan/SKILL.md`） | plan/tasks 已修正路径 |
| `skills/build-code/SKILL.md` | 不存在（正确路径为 `workflows/build-code/SKILL.md`） | plan/tasks 已修正路径 |
| `skills/verify-code/SKILL.md` | 不存在（正确路径为 `workflows/verify-code/SKILL.md`） | plan/tasks 已修正路径 |
| `skills/make-decision/SKILL.md` | 不存在（正确路径为 `workflows/make-decision/SKILL.md`） | plan/tasks 已修正路径 |
| `skills/3rd-review/SKILL.md` | 不存在（外部工具路径 `/Users/Hugh/Hugh/Project/3rd-review/`） | plan/tasks 已修正为外部路径引用 |
| `workflows/make-decision/SKILL.md` | 存在 | 现有 SKILL.md 中 journal 写入为内联指令（非共享模块），各 stage 同模式 |
| `core/task-dir-parser.mjs` | 存在 | 复用，无误 |

**结论**：发现 9 处不存在的文件引用（5 条路径前缀错误 `skills/` → `workflows/`，1 条 `core/journal-schema.mjs` 误标 MODIFY，1 条 `core/stage-result-writer.mjs` 误以为存在，1 条 `skills/3rd-review` 误当本仓库内置技能，1 条 `core/receipt-writer.mjs` 正确）。plan.md 和 tasks.md 已全部修正。

---

### 机制 1：before/after-step receipt 写入（core/receipt-writer.mjs + journal event_type）

**四问分析**

1. **防什么真实威胁**：已观察到的失败模式 — step 跳过无任何记录，事后无法区分"已执行完成"与"直接跳过"。m10 baseline 中 missed_step_rate=0.05（4 任务均值），对应 step 被跳过未被检测的情况。这是已发生的具体事件，非假设。

2. **现有机制是否覆盖**：现有 journal.jsonl 仅记录 stage 级事件（stage_enter/stage_exit），不含 step 级 entry/exit。make-decision SKILL.md 的 journal 写入为内联指令（event: "s0_context_loaded" 等），无 step 级通用覆盖。未覆盖。

3. **能否被轻易绕过**：SKILL.md 内 before/after-step 钩子段落需手工在每个 stage 的每个步骤前后调用，若遗漏则不记录。绕过方式是"不调用钩子"——但这正是 audit 检测目标：journal 缺失本身就是可观测事实（missed_step_rate 上升），不是静默通过。**不构成形式主义**。

4. **长期维护成本**：5 个 SKILL.md 各新增 before-step/after-step 段落，receipt-writer.mjs 为轻量 append-only 模块（无第三方依赖）。每次新增 stage 需同步新增钩子段落——这是固定模式，有显式 checklist（T004-T008）。维护成本低且可控。

**结论**：通过四问。保留。

---

### 机制 2：judgement 输出 + rollback 计数隔离

**四问分析**

1. **防什么真实威胁**：before-step blocked 时当前行为是升人工等待，缺乏自动恢复路径。m10 数据 rework_rounds=6.075，部分 rework 来自 blocked step 没有 rollback 机制导致手动重来整段。已观察到的具体失败：blocked 后无法自动 rollback 到上一 step 重试。

2. **现有机制是否覆盖**：现有 runner 无 step 级 rollback 计数或自动回退逻辑；blocked 只能整 stage 失败或升人工。未覆盖。

3. **能否被轻易绕过**：rollback_count 由 runner 层维护（非 audit 层），阈值（2次）为 decision-log D9 人工设定。绕过需要 runner 不更新 rollback_count，而这会导致无限 rollback 循环暴露——**不构成形式主义**。

4. **长期维护成本**：rollback_count 状态在 runner 层（内存或从 journal 读），每次 rollback 事件写 journal（step_auto_rollback event_type）。未来若修改阈值，只改 decision-log + runner 层参数，SKILL.md 无感知。维护成本合理。

**结论**：通过四问。保留。

---

### 机制 3：writer_namespace / executor_namespace 对比（防自审自判检测）

**四问分析**

1. **防什么真实威胁**：exit_receipt 的 3rd-review 审查者与 step 执行者为同一 agent（自审自判）。CONSTITUTION.md F4 明确禁止自审自判；已在历史 task 中出现同一 agent 既执行又审查的情况（review-cost-deep-reduction 任务中记录）。已发生，非假设。

2. **现有机制是否覆盖**：现有 3rd-review 调用未做 namespace 对比检查；没有机制检测"调用者是否就是被审对象"。未覆盖。

3. **能否被轻易绕过**：agent 可以声明任意 writer_namespace。若 agent 故意伪造 namespace 不同，检测失效。但伪造是主动欺骗行为，超出本机制防护范围；机制目标是检测无意识的自审，warn 记录后由人审查——**不构成完全形式主义**，但需接受"主动伪造无法防"的局限。

4. **长期维护成本**：namespace 字段写入 exit_receipt（2 个字段：writer_namespace, executor_namespace），对比逻辑在 receipt-writer 或 after-step 钩子内（3 行比较 + warn）。极低维护成本。

**结论**：通过四问。保留。注意：该机制防被动自审，不防主动伪造，已有明确记录（warn-only，不阻断）。

---

### 机制 4：core/receipt-writer.mjs 作为共享模块（而非各 stage 自行内联）

**四问分析**

1. **防什么真实威胁**：5 个 stage 各自实现 journal append 会导致 5 套格式 drift，历史 journal 写入已出现字段名不一致（spec.md 研究阶段发现 event_type 命名分歧）。具体失败：audit_summary 聚合计算依赖统一字段名，字段 drift 导致计数错误。

2. **现有机制是否覆盖**：现有 journal 写入为各 SKILL.md 内联（make-decision 的 `event: "s0_context_loaded"` 等），无跨 stage 统一接口，无字段约束。未覆盖 step 级 receipt 的统一性问题。

3. **能否被轻易绕过**：stage 可以不调用 receipt-writer 而自行内联写入——但这属于实现偏离，被 T013 边界验证检测（验证日志中 step_entry/step_exit 是否走统一接口）。不构成静默形式主义。

4. **长期维护成本**：receipt-writer.mjs 接口仅 2 个函数，依赖 core/task-dir-parser.mjs（已有）+ fs.appendFile。新增 stage 只需 import 并调用，无改接口需求。维护成本极低。

**结论**：通过四问。保留。

---

### 机制 5：core/journal-schema.mjs 新建（event_type 枚举集中定义）

**四问分析**

1. **防什么真实威胁**：event_type 字符串散落在各 SKILL.md 内联指令中，出现过拼写不一致（spec.md research.md 中记录的 "step_auto-rollback" vs "step_auto_rollback" 分歧）。聚合计算时 event_type 过滤失效导致 rollback 计数漏统计。

2. **现有机制是否覆盖**：无集中 schema 文件；各 stage SKILL.md 各自定义字符串常量，无交叉检查。未覆盖。

3. **能否被轻易绕过**：SKILL.md 引用 journal-schema.mjs 中的常量后，拼写错误在 Node.js import 阶段即报错（非 undefined 静默）。不构成形式主义。

4. **长期维护成本**：journal-schema.mjs 为单一枚举文件（~20 行），新增 event_type 只改此文件，SKILL.md 引用不变。维护成本极低。

**结论**：通过四问。保留。

---

### F10 汇总

| 机制 | 四问通过 | 建议 |
|------|---------|------|
| before/after-step receipt 写入 | 是 | 保留 |
| judgement 输出 + rollback 计数隔离 | 是 | 保留 |
| writer/executor namespace 对比（防自审） | 是（含局限说明） | 保留 |
| core/receipt-writer.mjs 共享模块 | 是 | 保留 |
| core/journal-schema.mjs 枚举集中定义 | 是 | 保留 |

**结论**：5 个机制全部通过四问。无建议移除项。文件真实性核查发现 9 处路径/存在性错误，已全部修正。

---

## Project Structure

### Documentation (this feature)

```text
specs/step-gated-audit/
├── spec.md           (authoritative, input)
├── research.md       (Step 0 output)
├── data-contracts.md (Step 1.5 output)
├── plan.md           (this file)
├── tasks.md          (Step 3 output)
└── cross-artifact-analysis.md (Step 4 output)
```

### Source Code Changes

```text
core/
├── journal-schema.mjs     NEW    — 新建；定义含 step_entry/step_exit/step_auto_rollback 的 event_type 枚举（该文件当前不存在）
└── receipt-writer.mjs     NEW    — 统一 receipt 写入接口

workflows/
├── build-spec/SKILL.md    MODIFY — 新增 before-step / after-step 钩子段落
├── build-plan/SKILL.md    MODIFY — 新增 before-step / after-step 钩子段落
├── build-code/SKILL.md    MODIFY — 新增 before-step / after-step 钩子 + phase-manifest 集成说明
├── verify-code/SKILL.md   MODIFY — 新增 before-step / after-step 钩子段落
└── make-decision/SKILL.md MODIFY — 新增 before-step / after-step 钩子段落
```

**Scope Boundary — 不可触碰**:
- `core/stage-result-writer.mjs`（不存在，不新建；audit_summary 追加规则内联写在各 stage SKILL.md 中）
- 3rd-review 技能（外部工具，路径 `/Users/Hugh/Hugh/Project/3rd-review/`，只调用不修改）
- `core/task-dir-parser.mjs`（只调用，不修改）
- journal.jsonl 的已有 event_type（只追加新类型，不修改已有）

---

## Complexity Tracking

**WHY receipt-writer.mjs 作为共享模块而非各 stage 自行实现**:
TRADEOFF：增加一个跨 stage 共享依赖。
JUSTIFICATION：5 个 stage 各自实现 journal append 会导致 5 处 schema drift 风险；共享模块是 F2（窄契约）和 F8（复用）的合理应用，且 receipt-writer 接口极窄（2 个函数），耦合面小。

**WHY entry_receipt 失败 fail-closed 而非 warn-only**:
TRADEOFF：entry 失败会阻断 step 执行（比 warn 更严格）。
JUSTIFICATION：FR-SGA-013 明确决策，decision-log D8 确认；若 entry 失败仍执行 step，则该 step 在 audit 链中不可见，与本 feature 根本目标矛盾（step 跳过无记录的原始问题）。

---

## Implementation Steps

### Phase 1: 基础设施（journal schema + receipt-writer）

#### Step 1.1 — 新建 core/journal-schema.mjs

**做什么**: 新建 `core/journal-schema.mjs`（该文件当前不存在于 core/ 目录，需 NEW 而非 MODIFY）；在 event_type 枚举中定义 `step_entry`、`step_exit`、`step_auto_rollback` 及已有 stage 级事件类型；schema 版本号从 v1 起始。
**涉及文件**: `core/journal-schema.mjs` (NEW)
**映射 FR**: FR-SGA-004, FR-SGA-006
**映射 AC**: AC-004

#### Step 1.2 — 新建 core/receipt-writer.mjs

**做什么**: 实现 `writeEntryReceipt(taskId, payload): Promise<void>`（fail-closed）和 `writeExitReceipt(taskId, payload): Promise<void>`（warn-only）。路径解析通过 `core/task-dir-parser.mjs`。
**涉及文件**: `core/receipt-writer.mjs` (NEW), `core/task-dir-parser.mjs` (read-only)
**映射 FR**: FR-SGA-001, FR-SGA-002, FR-SGA-004, FR-SGA-013
**映射 AC**: AC-001, AC-002, AC-004

---

### Phase 2: 5 Stage SKILL.md 钩子集成

#### Step 2.1 — build-spec/SKILL.md 新增钩子

**做什么**: 在 SKILL.md 中新增 `## Before-Step Hook` 和 `## After-Step Hook` 段落，描述：before-step 读上游 exit_receipt → 判断 check_status → 调用 receipt-writer.writeEntryReceipt → 若 blocked 则出 judgement；after-step 调用 3rd-review → 调用 receipt-writer.writeExitReceipt（含 review 10 字段）。step_id 格式 `bs.{step_type}.{seq}`。
**涉及文件**: `workflows/build-spec/SKILL.md`（实际路径；该文件存在）
**映射 FR**: FR-SGA-001, FR-SGA-002, FR-SGA-003, FR-SGA-007, FR-SGA-008, FR-SGA-009, FR-SGA-010
**映射 AC**: AC-001, AC-002, AC-003, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011

#### Step 2.2 — build-plan/SKILL.md 新增钩子

**做什么**: 同 Step 2.1 模式，step_id 格式 `bp.{step_type}.{seq}`。
**涉及文件**: `workflows/build-plan/SKILL.md`（实际路径；该文件存在）
**映射 FR**: FR-SGA-001~009, FR-SGA-010
**映射 AC**: AC-001~012（同 build-spec 适用集）

#### Step 2.3 — build-code/SKILL.md 新增钩子 + phase-manifest 集成

**做什么**: 同 Step 2.1 模式，额外说明 before-step 须在 phase-manifest 加载完毕后触发（FR-SGA-011）；step_id 格式 `bc.{step_type}.ph{N}`，seq_label 来自 phase-manifest 动态序号。
**涉及文件**: `workflows/build-code/SKILL.md`（实际路径；该文件存在）
**映射 FR**: FR-SGA-001~009, FR-SGA-010, FR-SGA-011, FR-SGA-012
**映射 AC**: AC-001~012（含 build-code 专属）

#### Step 2.4 — verify-code/SKILL.md 新增钩子

**做什么**: 同 Step 2.1 模式，step_id 格式 `vc.{step_type}.{seq}`。
**涉及文件**: `workflows/verify-code/SKILL.md`（实际路径；该文件存在）
**映射 FR**: FR-SGA-001~009, FR-SGA-010
**映射 AC**: AC-001~012

#### Step 2.5 — make-decision/SKILL.md 新增钩子

**做什么**: 同 Step 2.1 模式，step_id 格式 `md.{step_type}.{seq}`。
**涉及文件**: `workflows/make-decision/SKILL.md`（实际路径；该文件存在）
**映射 FR**: FR-SGA-001~009, FR-SGA-010
**映射 AC**: AC-001~012

---

### Phase 3: audit_summary 聚合与收尾

#### Step 3.1 — stage-result.json audit_summary 字段

**做什么**: 在各 stage 的 stage-result 写入逻辑中追加 `audit_summary`，含 5 个计数字段（total/passed/blocked/skipped/rollback）。不修改已有 stage-result 字段。
**涉及文件**: `core/stage-result-writer.mjs`（如不存在则在各 stage SKILL.md 中说明追加规则）
**映射 FR**: FR-SGA-005, FR-SGA-006
**映射 AC**: AC-004, AC-005, AC-006

#### Step 3.2 — rollback_count 隔离与阈值逻辑

**做什么**: 确认 runner/workflow 层按 workflow_run_id 隔离 rollback_count，阈值 2 次升人工。在 SKILL.md 钩子说明中明确 runner 行为契约（audit 出 judgement，runner 执行 rollback 计数检查）。
**涉及文件**: 各 stage SKILL.md（钩子说明段落）
**映射 FR**: FR-SGA-003, FR-SGA-006
**映射 AC**: AC-003, AC-006

#### Step 3.3 — skip 语义与 FR-SGA-014/015 合规

**做什么**: 确认各 stage SKILL.md 钩子段落中：skipped 必须有授权方 + skip_reason；prev/next 指针必须填写；无全局 step 位置表。
**涉及文件**: 各 stage SKILL.md（钩子说明段落，检查）
**映射 FR**: FR-SGA-014, FR-SGA-015
**映射 AC**: AC-011, AC-012

---

## Verification Mapping

| Step | Maps to FRs | Verified by AC |
|------|-------------|----------------|
| 1.1 journal-schema.mjs | FR-SGA-004, FR-SGA-006 | AC-004 |
| 1.2 receipt-writer.mjs | FR-SGA-001, FR-SGA-002, FR-SGA-004, FR-SGA-013 | AC-001, AC-002, AC-004 |
| 2.1 build-spec hooks | FR-SGA-001~009, FR-SGA-010 | AC-001~012 |
| 2.2 build-plan hooks | FR-SGA-001~009, FR-SGA-010 | AC-001~012 |
| 2.3 build-code hooks + phase-manifest | FR-SGA-001~009, FR-SGA-010, FR-SGA-011, FR-SGA-012 | AC-001~012 |
| 2.4 verify-code hooks | FR-SGA-001~009, FR-SGA-010 | AC-001~012 |
| 2.5 make-decision hooks | FR-SGA-001~009, FR-SGA-010 | AC-001~012 |
| 3.1 audit_summary | FR-SGA-005, FR-SGA-006 | AC-004, AC-005, AC-006 |
| 3.2 rollback count isolation | FR-SGA-003, FR-SGA-006 | AC-003, AC-006 |
| 3.3 skip + pointer compliance | FR-SGA-014, FR-SGA-015 | AC-011, AC-012 |

---

## 涉及文件/模块清单

| 文件路径 | 变动类型 | 关联 FR |
|---------|---------|---------|
| `core/journal-schema.mjs` | NEW（当前不存在） | FR-SGA-004, FR-SGA-006 |
| `core/receipt-writer.mjs` | NEW | FR-SGA-001, FR-SGA-002, FR-SGA-004, FR-SGA-013 |
| `workflows/build-spec/SKILL.md` | MODIFY | FR-SGA-001~010, FR-SGA-013~015 |
| `workflows/build-plan/SKILL.md` | MODIFY | FR-SGA-001~010, FR-SGA-013~015 |
| `workflows/build-code/SKILL.md` | MODIFY | FR-SGA-001~012, FR-SGA-013~015 |
| `workflows/verify-code/SKILL.md` | MODIFY | FR-SGA-001~010, FR-SGA-013~015 |
| `workflows/make-decision/SKILL.md` | MODIFY | FR-SGA-001~010, FR-SGA-013~015 |

**只读（不修改）**:
- `core/task-dir-parser.mjs` — 路径解析，复用
- 3rd-review 技能 — 外部工具，实际路径 `/Users/Hugh/Hugh/Project/3rd-review/`（不在本仓库 skills/ 或 workflows/ 下，只调用不修改）
- `specs/step-gated-audit/spec.md` — 权威输入

**不存在（已确认）**:
- `core/stage-result-writer.mjs` — 不存在，audit_summary 追加规则写在各 stage SKILL.md 中（不新建此模块）

**删除/改名**:
- 无删除/改名。receipts/ 目录禁止创建（FR-SGA-004）。

---

## Scope Boundary Verification

不可触碰（IN SCOPE 之外）:
- 3rd-review 技能（外部工具，路径 `/Users/Hugh/Hugh/Project/3rd-review/`，只调用不修改；不在本仓库路径下）
- journal.jsonl 的已有 event_type（只追加不修改）
- stage-result.json 的向后兼容层（只追加 audit_summary，不改已有字段）
- rollback 阈值配置化（OUT scope，硬编码 2 次）
- receipt 加密/防篡改（OUT scope）
- skipped 授权链详细设计（OUT scope，FR-SGA-014 仅要求有授权方，细节留 build-plan）

---

## M10 Baseline Comparison

**基线来源**: `specs/archive/m10-baseline-switch/baseline-report.md`（4 个历史任务均值）
**当前阶段**: build-plan — 全流程未完成，5 项 M12 实值均为 unknown（原因见各行）

| 指标名 | M12 实值 | M10 baseline | delta |
|--------|---------|-------------|-------|
| missed_step_rate | unknown（仅 upstream make-decision/build-spec 两段已完成且已落盘，全五段值待 verify-code 完成后才可计算） | 0.05 | unknown |
| test_execution_rate | unknown（build-plan 阶段无测试执行数据，待 build-code/verify-code） | 0.8295 | unknown |
| review_execution_rate | unknown（review 阶段尚未执行） | 1 | unknown |
| rework_rounds | unknown（全流程未完成，无返工数据） | 6.075 | unknown |
| rework_proxy_count | unknown（全流程未完成，无代理返工数据） | 25.25 | unknown |

**说明**: delta 列全部 unknown，原因是 M12 实值 unknown；不得使用占位值（0、-、--）。阈值由人设定，此处仅记录事实，不阻断推进。
