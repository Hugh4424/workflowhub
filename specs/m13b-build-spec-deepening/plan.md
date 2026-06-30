# 实施计划：m13b-build-spec-deepening

**Task ID**: `m13b-build-spec-deepening` | **Date**: 2026-06-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification `specs/m13b-build-spec-deepening/spec.md`
**Status**: Draft

---

## Overview

本计划实施 build-spec 质量事实契约深化（M13b）。目标是在 `workflows/build-spec/SKILL.md`（当前 M11 v1）中加入一套薄"质量事实契约"能力，覆盖 5 项质量事实输出（scope 边界 / 自检结果 / 独立审查摘要 / 未解风险 / handoff required_reads）、spec-ladder 档位判断、三层小节结构、7 条自检 + Spec-Purity grep、异源 3rd-review、TASK_TRACKING_ROOT 环境变量约定、以及若干辅助产物和交互规范。

所有改动集中在单一文件 `workflows/build-spec/SKILL.md`，加新增少量产物文件（spec-acceptance-count.json 等）。无跨系统依赖、无外部 API 合约，B 档规模。

---

## Technical Context

**Language/Version**: Markdown (SKILL.md), JSON (spec-acceptance-count.json)
**Primary Dependencies**: None（纯 SKILL.md 描述性内容，无代码依赖）
**Storage**: Filesystem `specs/m13b-build-spec-deepening/` + `workflows/build-spec/`
**Testing**: `npm test` (tests/five-skills-present.test.mjs) + grep 验证 AC-01~AC-22
**Target Platform**: workflowhub 工作流编排环境
**Project Type**: workflow orchestration skill deepening
**Performance Goals**: N/A（SKILL.md 为描述性文档，无性能指标）
**Constraints**: 宪法优先；所有检查为记录+浮现，无阻断门；不修改 spec-specify/spec-clarify 技能本体
**Scale/Scope**: 1 主文件修改（workflows/build-spec/SKILL.md）+ 3 产物文件新增（tasks.md, plan.md, cross-artifact-analysis.md 在 specs/ 目录），约 500-800 行 SKILL.md 增量

---

## Scope Boundary Verification

**IN（必须实现）**:

- `workflows/build-spec/SKILL.md` — 主产物，添加质量事实契约 5 项 + 所有 FR 覆盖内容
- `specs/m13b-build-spec-deepening/spec-acceptance-count.json` — AC 计数文件（已存在，可更新）

**禁止触碰（forbidden files）**:

- `skills/spec-specify/SKILL.md` — 不改
- `skills/spec-clarify/SKILL.md` — 不改
- `workflows/build-code/SKILL.md` — 不改
- `workflows/verify-code/SKILL.md` — 不改
- 任何其他已有 skill 或 workflow 文件

---

## Complexity Tracking

WHY: 改动集中在单文件 SKILL.md，但内容覆盖 24 个 FR，需要按 FR 域分节写入，不能随意拆文件。
TRADEOFF: 单文件较长（估计 500-800 行增量），但保持了技能的独立可搬运性（S7/S8）。
JUSTIFICATION: 宪法 F1 要求薄核心，SKILL.md 是技能层本体，在此处写入才符合 F1 架构；拆多文件反而增加维护面。

No other constitution violations requiring justification.

---

## Implementation Steps

### Phase 1: 基础结构与环境约定（Foundation）

**Purpose**: 写入 SKILL.md 的全局声明节——环境变量约定、参数约定、三层章节结构要求——其他所有 FR 都依赖这些基础定义。

**Step 1.1**: 在 SKILL.md 新增「环境变量与参数约定」节
- 文件：`workflows/build-spec/SKILL.md`
- 内容：TASK_TRACKING_ROOT 变量定义、默认值、降级行为（FR-TRACKING-001/002）；`--task-dir` 参数约定（FR-TASKDIR-001）
- FR 覆盖：FR-TRACKING-001, FR-TRACKING-002, FR-TASKDIR-001

**Step 1.2**: 在 SKILL.md 新增「Spec 三层结构要求」节
- 文件：`workflows/build-spec/SKILL.md`
- 内容：层 1 速读卡 / 层 2 正文 / 层 3 附录结构定义；Known Gaps 段要求（FR-STRUCTURE-001/002）
- FR 覆盖：FR-STRUCTURE-001, FR-STRUCTURE-002

**Step 1.3**: 在 SKILL.md 新增「FR 编号格式与 AC 计数」节
- 文件：`workflows/build-spec/SKILL.md`
- 内容：FR-{DOMAIN}-NNN 编号规范；spec-acceptance-count.json 三字段产出步骤（FR-NUMBERING-001, FR-ACCOUNT-001）
- FR 覆盖：FR-NUMBERING-001, FR-ACCOUNT-001

### Phase 2: 核心质量机制（Core Implementation）

**Purpose**: 写入 spec 构建流水线、spec-ladder、质量事实契约 5 项定义、自检、审查等核心 FR，依赖 Phase 1 的基础节定义。

**Step 2.1**: 在 SKILL.md 新增「spec 构建流水线」节
- 文件：`workflows/build-spec/SKILL.md`
- 内容：spec-specify → spec-clarify → 平台约束比对 → 扎根 decision-log 流程（FR-BUILD-001）
- FR 覆盖：FR-BUILD-001

**Step 2.2**: 在 SKILL.md 新增「Spec-Ladder 反过度工程」节
- 文件：`workflows/build-spec/SKILL.md`
- 内容：A/B/C 档定义、档位判断步骤、F10 四问在档位判断时执行（FR-LADDER-001/002）
- FR 覆盖：FR-LADDER-001, FR-LADDER-002

**Step 2.3**: 在 SKILL.md 新增「质量事实契约 5 项定义」节
- 文件：`workflows/build-spec/SKILL.md`
- 内容：5 项字段定义（scope 边界/自检结果/独立审查摘要/未解风险/handoff required_reads），禁止阻断语义（FR-CONTRACT-001/002）
- FR 覆盖：FR-CONTRACT-001, FR-CONTRACT-002

**Step 2.4**: 在 SKILL.md 新增「7 条自检 + Spec-Purity grep」节
- 文件：`workflows/build-spec/SKILL.md`
- 内容：7 条自检逐条列表（1-7 编号）、Spec-Purity grep 检测目标（代码块/路径/shell 命令）（FR-SELFCHECK-001/002）
- FR 覆盖：FR-SELFCHECK-001, FR-SELFCHECK-002

**Step 2.5**: 在 SKILL.md 新增「异源 3rd-review 独立审查」节
- 文件：`workflows/build-spec/SKILL.md`
- 内容：异源引擎执行、产出 verdict+findings、记入质量事实契约第 3 项，禁止自审自判（FR-REVIEW-001/002）
- FR 覆盖：FR-REVIEW-001, FR-REVIEW-002

**Step 2.6**: 在 SKILL.md 新增「scope-triage 高危词浮现」节
- 文件：`workflows/build-spec/SKILL.md`
- 内容：高危词检测黑名单、浮现位置+建议、非阻断语义（FR-SCOPETRIAGE-001）
- FR 覆盖：FR-SCOPETRIAGE-001

**Step 2.7**: 在 SKILL.md 新增「spec↔decision-log 一致性检查」节
- 文件：`workflows/build-spec/SKILL.md`
- 内容：逐条对照 KEEP 列表、差异记录未解风险、非阻断（FR-ALIGN-001）
- FR 覆盖：FR-ALIGN-001

### Phase 3: 辅助规范与验收（Polish / Verification）

**Purpose**: 写入交互规范、摩擦捕获、artifact-first、行为验证要求等辅助 FR；验证 AC 覆盖和 scope boundary。依赖 Phase 2 的核心节。

**Step 3.1**: 在 SKILL.md 新增「交互规范」节
- 文件：`workflows/build-spec/SKILL.md`
- 内容：REQ-COMM-01（大白话+选项后果）、REQ-COMM-02（勤报进度）（FR-COMM-001/002）
- FR 覆盖：FR-COMM-001, FR-COMM-002

**Step 3.2**: 在 SKILL.md 新增「摩擦捕获 + Artifact-First + 行为验证要求」节
- 文件：`workflows/build-spec/SKILL.md`
- 内容：[FRICTION] 条目格式（FR-FRICTION-001）；长报告存文件传路径规范（FR-ARTIFACT-001）；FR 场景格式要求（FR-BEHAV-001/002）
- FR 覆盖：FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002

**Step 3.3**: AC 验证（grep 核对）
- 对 `workflows/build-spec/SKILL.md` 运行 grep 核对 AC-01 至 AC-22
- 验证 scope boundary（禁止触碰文件未被改动）
- 确认每条任务至少引用 1 个 FR

---

## Verification Mapping

| Step | Maps to FRs | Verified by AC |
|------|-------------|----------------|
| Step 1.1 | FR-TRACKING-001, FR-TRACKING-002, FR-TASKDIR-001 | AC-06, AC-13, AC-22 |
| Step 1.2 | FR-STRUCTURE-001, FR-STRUCTURE-002 | AC-14, AC-20 |
| Step 1.3 | FR-NUMBERING-001, FR-ACCOUNT-001 | AC-07, AC-08, AC-17, AC-18 |
| Step 2.1 | FR-BUILD-001 | AC-19 |
| Step 2.2 | FR-LADDER-001, FR-LADDER-002 | AC-02 |
| Step 2.3 | FR-CONTRACT-001, FR-CONTRACT-002 | AC-01, AC-16 |
| Step 2.4 | FR-SELFCHECK-001, FR-SELFCHECK-002 | AC-03, AC-04 |
| Step 2.5 | FR-REVIEW-001, FR-REVIEW-002 | AC-05 |
| Step 2.6 | FR-SCOPETRIAGE-001 | AC-11 |
| Step 2.7 | FR-ALIGN-001 | AC-12 |
| Step 3.1 | FR-COMM-001, FR-COMM-002 | AC-10 |
| Step 3.2 | FR-FRICTION-001, FR-ARTIFACT-001, FR-BEHAV-001, FR-BEHAV-002 | AC-09, AC-15 |
| Step 3.3 | All 24 FRs | AC-01 ~ AC-22 |

---

## Project Structure

### Documentation (this feature)

```text
specs/m13b-build-spec-deepening/
├── spec.md                    Build-spec output (authoritative, SSOT)
├── plan.md                    This file (spec-plan output)
├── tasks.md                   spec-tasks output
├── cross-artifact-analysis.md spec-analyze output
├── baseline-report.md         M10 baseline comparison (upstream)
├── spec-acceptance-count.json AC/FR count file (NEW, AC-17)
└── checklists/
    └── requirements.md        Quality checklist
```

### Source Code (repository root)

```text
workflows/build-spec/
└── SKILL.md                   MODIFY — add 24 FR sections (~500-800 lines)

specs/m13b-build-spec-deepening/
└── spec-acceptance-count.json EXISTS (update if needed)
```

**Structure Decision**: 单文件 SKILL.md 修改符合 F1 薄核心（重活在技能层），产物落 specs/ 目录符合目录约定。

---

## Constitution Check

> 21 条全部填写。[x] = 符合，[ ] = 不符合。每条含判据。

- [x] **F1 薄核心** — 判据：本 spec 改动集中在 `workflows/build-spec/SKILL.md` 技能层，核心调度零改动；质量事实契约、自检、审查均下沉到 SKILL.md，核心只做调度。符合 F1 薄核心。

- [x] **F2 窄契约** — 判据：SKILL.md 通过 task-id / --task-dir 参数与上下游通信，接口极窄（只传 task-id 和路径），不暴露内部实现逻辑。符合 F2 窄契约。

- [x] **F3 物理事实靠机器校验但不阻断** — 判据：Spec-Purity grep、scope-triage grep、7 条自检均为机器执行并客观记录结论（pass/warn/unknown），明确要求不阻断推进（FR-CONTRACT-002, FR-SELFCHECK-001/002）。符合 F3。

- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：FR-REVIEW-001/002 要求异源引擎在独立上下文产出 verdict，所有检查结论浮现供人判断，明确禁止阻断（spec 第 5 节「不做」第 1 条）。符合 F4。

- [x] **F5 gate 谨慎添加出事再补无用则移除** — 判据：spec 明确 OUT 列表（无阻断门、无 3 source_family 多重审查、无 TodoWrite 仪式），CUT 了全部 agenthub 阻断门（D3），无新增 gate 机制。符合 F5。

- [x] **F6 统一外置执行记录** — 判据：FR-TRACKING-001/002 新增 TASK_TRACKING_ROOT 约定，所有 stage 通过该变量写入跟踪文件到 repo 外路径（~/Knowledge/workflowhub/），不硬编码路径。符合 F6。

- [x] **F7 检查可证伪** — 判据：AC-01~AC-22 全部可用 grep 或 JSON schema 验证，非绿灯式假通过；Spec-Purity grep "实际为假时报 warn"是真实失败（FR-SELFCHECK-002）。符合 F7。

- [x] **F8 变更可追溯** — 判据：所有 FR 可追溯到 decision-log D1-D8（附录 C 覆盖表），spec 头部明确 source 来源（execution_id 1DCFFB01）。符合 F8。

- [x] **F9 不假绿** — 判据：FR-CONTRACT-001 明确"值可为 unknown 但禁止字段缺失"，FR-SELFCHECK-002 明确示例块不自动豁免、同等 warn——不允许任何伪通过路径。符合 F9。

- [x] **F10 自动化按真实收益添加** — 判据：spec 只加入 grep 类轻量自动化（Spec-Purity grep、scope-triage grep），无新增 CI gate、无复杂 runner；F10 四问在 spec-ladder 档位判断时显式执行（FR-LADDER-002）。见本文档 F10 Gate 节详细回答。符合 F10。

- [x] **Q1 记事实而非阻断** — 判据：质量事实契约 5 项全部为"记录+浮现"语义，FR-CONTRACT-002 明确禁止"若未通过则停止"语义。符合 Q1。

- [x] **Q2 独立审查独立上下文** — 判据：FR-REVIEW-002 明确"禁止自审自判"、"禁止单一 AI 切换视角替代异源审查"，审查由独立异源引擎（如 codex）在独立上下文产出。符合 Q2。

- [x] **Q3 人可见可干预** — 判据：所有 warn/偏差/gap 均浮现到质量事实契约供人判断；FR-ARTIFACT-001 要求长报告存文件传路径，人可读取。符合 Q3。

- [x] **S1 技能有明确输入输出契约** — 判据：FR-BUILD-001 明确 spec 构建流水线 I/O；FR-TASKDIR-001 明确 --task-dir 参数与回退规则；质量事实契约 5 项字段明确为输出契约。符合 S1。

- [x] **S2 技能失败须 fail-loud** — 判据：spec-specify 失败时 build-spec 明确"stop and surface the error"（现有 SKILL.md Step 2）；metrics 失败时 warn 不 block（让真正失败浮现而非沉默）。符合 S2。

- [x] **S3 技能幂等** — 判据：SKILL.md 改动为描述性内容，多次运行 build-spec 只是覆盖产物文件，不累积副作用；TASK_TRACKING_ROOT 路径写入是追加记录非状态机。符合 S3。

- [x] **S4 技能不依赖运行时状态** — 判据：所有输入均从 task-id / --task-dir 参数推导（FR-TASKDIR-001），不依赖 git branch、.specify/ 初始化等运行时状态（spec-plan/spec-tasks/spec-analyze 同样去耦）。符合 S4。

- [x] **S5 技能颗粒度合适** — 判据：SKILL.md 深化的每个 FR 覆盖一个功能域，按 Phase 分节实施；质量事实契约 5 项为一个合理的原子单元，不切割成过细的微服务。符合 S5。

- [x] **S6 技能版本可追溯** — 判据：现有 SKILL.md 有 name/description frontmatter，深化后需新增 version 字段；T014 显式 grep SKILL.md frontmatter 确认 `version` 字段写入（T014 验收步骤中明确列出该检查）；spec 本身有 spec_version: 1.0.0。符合 S6（由 T014 真实核查，非假设）。

- [x] **S7 自研技能独立可调用** — 判据：改动仅在 `workflows/build-spec/SKILL.md`，不引入跨 repo 依赖，不绑定特定 git 分支；TASK_TRACKING_ROOT 有明确默认值回退，技能在无特殊环境时仍可运行。符合 S7。

- [x] **S8 自定义技能可独立调用可搬运** — 判据：build-spec SKILL.md 深化后仍是独立可调用的技能文件，不绑死 workflowhub 特有基础设施（TASK_TRACKING_ROOT 只是约定，技能不硬依赖其存在）。符合 S8。

**Constitution Check Result**: 21/21 clauses addressed. 21 [x] pass, 0 [ ] fail.

---

## M10 Baseline Comparison

> 数据来源约定：只引用上游 make-decision / build-spec stage-result 数据。当前任务处于 build-plan 阶段，build-code/verify-code 数据尚未产出，不引用。

| Metric | M10 Baseline | M13b Current Value | Direction | Notes |
|--------|-------------|-------------------|-----------|-------|
| missed_step_rate | 0.05 | unknown | — | 原因：m13b 为 build-spec 深化规格阶段，make-decision stage-result 及 build-spec stage-result 中未记录此指标的采集值；需 build-code/verify-code 阶段运行后由 collector 采集 |
| test_execution_rate | 0.8295 | unknown | — | 原因：同上，test 执行率在 verify-code 阶段采集，build-plan 阶段尚无数据 |
| review_execution_rate | 1 | unknown | — | 原因：同上，make-decision stage-result 无此字段采集记录；D4 明确恢复异源审查但实际运行数据在 build-spec 执行后产出 |
| rework_rounds | 6.075 | unknown | — | 原因：rework_rounds 为 checkpoint_request 代理推导，build-plan 阶段无有效 journal 事件可用；decision-log 记录 make-decision 运行一次且无返工，但未以 stage-result 格式记录此指标 |
| rework_proxy_count | 25.25 | unknown | — | 原因：同 rework_rounds，weak_proxy 来源为 journal checkpoint_request，m13b build-plan 阶段无对应 journal 数据 |

> 所有 5 项均为 unknown。原因一致：build-plan 阶段处于规划期，上游 make-decision / build-spec 的 stage-result JSON 未记录这 5 项指标的采集值（metrics 采集在 build-code → verify-code 阶段落盘）。阈值判定留待 test-acceptance 阶段人工设定（non-blocking，D12 原则）。

---

## F10 Anti-Over-Engineering Gate

> 对 plan 中提出的每个新机制逐条回答 F10 四问。无法全部回答的项已移除。

### 机制 1：质量事实契约 5 项字段（FR-CONTRACT-001）

1. **防御的真实威胁**：build-spec 产出无系统化质量浮现，spec 质量盲区（自检遗漏、审查偏差、已知 gap）对下游不可见，导致 build-plan / build-code 在错误基础上推进。M13b 决策前实证：M11 build-spec 无此机制。
2. **已有机制是否覆盖**：未覆盖。现有 SKILL.md 仅有 constitution check，无 scope 边界声明、无 7 条自检、无 3rd-review 记录、无 handoff required_reads。
3. **是否可绕过成为 security-theatre**：不构成安全剧场——字段为"记录+浮现"语义，不阻断流程；即使值为 unknown 也合法，不存在伪通过路径（F9）。
4. **长期维护成本**：低。字段为描述性 Markdown，不引入代码或 CI runner；人工填写，随 spec 改动即可更新。

**结论**：保留。

### 机制 2：spec-ladder A/B/C 档位判断（FR-LADDER-001）

1. **防御的真实威胁**：spec 过度工程（为单文件改动写全量 C 档 spec，浪费且无益），或欠规格（跨系统改动用 A 档导致关键章节缺失）。历史案例：agenthub 过度工程记录（~95,000 行 gate 代码）。
2. **已有机制是否覆盖**：未覆盖。M11 SKILL.md 无档位判断。
3. **是否可绕过**：判断结论为描述性记录，不强制阻断，故不存在绕过安全门的问题。
4. **长期维护成本**：低。三档定义为静态 Markdown，A/B/C 边界稳定，不随每次任务改动。

**结论**：保留。

### 机制 3：7 条自检 + Spec-Purity grep（FR-SELFCHECK-001/002）

1. **防御的真实威胁**：spec 遗漏 FR-{DOMAIN}-NNN 格式、缺少 Given/When/Then 场景、混入实现代码（Spec-Purity 问题）——这些在 M11 实证中有出现（spec 含 shell 命令）。
2. **已有机制是否覆盖**：未覆盖。现有 SKILL.md 无自检步骤。
3. **是否可绕过**：自检为记录性质，warn 不阻断；grep 为机器执行，不存在"能绕过"的安全问题。
4. **长期维护成本**：低。7 条为固定清单，Spec-Purity grep 是简单正则，不引入新 runner。

**结论**：保留。

### 机制 4：异源 3rd-review 独立审查（FR-REVIEW-001/002）

1. **防御的真实威胁**：自审自判导致盲点——同一上下文同时写 spec 和审 spec，发现不了方向偏差。历史实证：agenthub spec 自审后仍出现与 decision-log 偏差需返工。
2. **已有机制是否覆盖**：未覆盖。M11 SKILL.md 无独立审查步骤。
3. **是否可绕过**：无阻断门，审查结论为 unknown 时记录 unknown 继续，不存在安全剧场。
4. **长期维护成本**：低。复用现有 3rd-review 基础设施（单一异源引擎），不新增 source_family（D4 决策）。

**结论**：保留。

### 机制 5：TASK_TRACKING_ROOT 环境变量约定（FR-TRACKING-001）

1. **防御的真实威胁**：任务跟踪文件（task-metrics.jsonl）硬编码到 repo 内或固定绝对路径，导致多用户/多环境时路径冲突、文件误提交 repo（decision-log §2 问题背景：TASK_TRACKING_ROOT 一直没做导致没正确留存任务执行记录）。
2. **已有机制是否覆盖**：未覆盖。M11 SKILL.md 无此变量约定。
3. **是否可绕过**：变量为约定（非强制代码 hook），子阶段可不遵守；但约定本身有 FR-TRACKING-002 覆盖面，后续 audit 可 grep 验证（AC-22）。
4. **长期维护成本**：低。仅是 SKILL.md 声明性约定，无代码实现；各 stage 执行时按约定取变量。

**结论**：保留。

### 机制 6：spec-acceptance-count.json（FR-ACCOUNT-001）

1. **防御的真实威胁**：AC 和 FR 数量靠人记忆，spec 更新后数量漂移不可见；下游 build-plan 无法快速核查覆盖度。
2. **已有机制是否覆盖**：未覆盖。
3. **是否可绕过**：JSON 文件可不存在，但 AC-17 提供可验证的 grep 检查点，不存在安全剧场。
4. **长期维护成本**：极低。3 字段 JSON 文件，随 spec 产出时 grep 计数写入。

**结论**：保留。

### 机制 7：scope-triage 高危词 grep（FR-SCOPETRIAGE-001）

1. **防御的真实威胁**：spec 写入阻断语义词（"不能继续"、"blocking gate"）被执行代理当成规则执行，导致宪法违规。
2. **已有机制是否覆盖**：未覆盖。
3. **是否可绕过**：grep 为记录性浮现，非阻断；高危词作为黑名单内容列举本身不违规（AC-16 口径），不存在误报安全剧场。
4. **长期维护成本**：低。简单 grep，黑名单静态维护。

**结论**：保留。

**F10 移除项**：无。所有 7 个机制均通过四问，全部保留。

---

## Step 9: File Identification & Task-FR Coverage Check

### 文件识别

**需要新增/修改的文件**：
1. `workflows/build-spec/SKILL.md` — MODIFY（主产物）
2. `specs/m13b-build-spec-deepening/spec-acceptance-count.json` — EXISTS/UPDATE

**build-plan 产物文件（本阶段**）：
3. `specs/m13b-build-spec-deepening/plan.md` — 本文件
4. `specs/m13b-build-spec-deepening/tasks.md` — spec-tasks 产出
5. `specs/m13b-build-spec-deepening/cross-artifact-analysis.md` — spec-analyze 产出

### 禁止文件检查

以下文件不得出现在任何任务中：`skills/spec-specify/SKILL.md`、`skills/spec-clarify/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`。确认 tasks.md 中无这些文件的修改任务。

### FR 覆盖矩阵（24 FRs）

| FR | 覆盖 Step | 覆盖 Task（tasks.md） |
|----|------------|----------------------|
| FR-BUILD-001 | Step 2.1 | T007 |
| FR-CONTRACT-001 | Step 2.3 | T005 |
| FR-CONTRACT-002 | Step 2.3 | T005 |
| FR-LADDER-001 | Step 2.2 | T006 |
| FR-LADDER-002 | Step 2.2 | T006 |
| FR-STRUCTURE-001 | Step 1.2 | T002 |
| FR-STRUCTURE-002 | Step 1.2 | T002 |
| FR-SELFCHECK-001 | Step 2.4 | T008 |
| FR-SELFCHECK-002 | Step 2.4 | T008 |
| FR-REVIEW-001 | Step 2.5 | T009 |
| FR-REVIEW-002 | Step 2.5 | T009 |
| FR-BEHAV-001 | Step 3.2 | T013 |
| FR-BEHAV-002 | Step 3.2 | T013 |
| FR-FRICTION-001 | Step 3.2 | T013 |
| FR-TASKDIR-001 | Step 1.1 | T001 |
| FR-TRACKING-001 | Step 1.1 | T001 |
| FR-TRACKING-002 | Step 1.1 | T001 |
| FR-NUMBERING-001 | Step 1.3 | T003 |
| FR-ACCOUNT-001 | Step 1.3 | T004 |
| FR-ARTIFACT-001 | Step 3.2 | T013 |
| FR-COMM-001 | Step 3.1 | T012 |
| FR-COMM-002 | Step 3.1 | T012 |
| FR-SCOPETRIAGE-001 | Step 2.6 | T010 |
| FR-ALIGN-001 | Step 2.7 | T011 |

全部 24 FR 均有对应 Step 和 Task 覆盖，无遗漏。
