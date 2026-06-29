# 实施计划：{task-id}

**Task ID**: `{task-id}` | **Date**: {date} | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/{task-id}/spec.md`
**Status**: Draft
<!-- 生成时替换 {task-id} 为实际的 task-id 字面量，{date} 为当前日期 -->

## Summary

<!-- 1-2 段。一句话概括这个计划要做什么，然后简要说明为什么要这样设计。 -->

## Technical Context

<!-- 技术环境信息。每个字段填写具体值，不可得时写 "N/A" 并注明原因。 -->

**Language/Version**: <!-- 如 Markdown, Node.js v20 -->
**Primary Dependencies**: <!-- 主要依赖，无依赖写 "None" -->
**Storage**: <!-- 产物存储方式，如 Filesystem — `specs/{task-id}/` -->
**Testing**: <!-- 测试命令，如 `npm test` -->
**Target Platform**: <!-- 目标运行环境 -->
**Project Type**: <!-- 项目类型，如 AI workflow orchestration tool -->
**Performance Goals**: <!-- 性能目标，无目标写 "N/A" -->
**Constraints**: <!-- 约束条件 -->
**Scale/Scope**: <!-- 改动规模，如 "3 new files, ~500 lines" -->

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Every plan MUST explicitly answer these gates. For workflowhub, the applicable gates are the project's own 21-clause constitution (CONSTITUTION.md). This section fills all 21 clauses from constitution-checklist.md.

### Framework Principles (F)

- [ ] **F1 薄核心** — 判据：核心只做调度编排，重活下沉技能层。<!-- 本计划的判据说明 -->
- [ ] **F2 窄契约** — 判据：模块间走窄而明确的接口。<!-- 判据说明 -->
- [ ] **F3 物理事实靠机器校验但不阻断** — 判据：物理事实机器客观采集且不阻断。<!-- 判据说明 -->
- [ ] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。<!-- 判据说明 -->
- [ ] **F5 gate 谨慎添加出事再补无用则移除** — 判据：关卡按需添加，无用即移除。<!-- 判据说明 -->
- [ ] **F6 统一外置执行记录** — 判据：进度/指标/回溯统一记录可回溯。<!-- 判据说明 -->
- [ ] **F7 推进与不可逆操作不自动越过人** — 判据：推进/不可逆操作经人边界确认。<!-- 判据说明 -->
- [ ] **F8 简单优先** — 判据：选更简单依赖更少的方案，不写掩盖问题的兜底。<!-- 判据说明 -->
- [ ] **F9 可证伪不假绿** — 判据：检查在"实际为假"时真报失败、缺数据标未知。<!-- 判据说明 -->
- [ ] **F10 自动化按真实收益添加，不为"机器可校验"本身堆基建** — 判据：自动化真实收益大于长期维护成本。<!-- 判据说明 -->

### Quality Principles (Q)

- [ ] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。<!-- 判据说明 -->
- [ ] **Q2 gate 三类划分** — 判据：关卡分入口校验/记录采集/人工确认三类。<!-- 判据说明 -->
- [ ] **Q3 异源审查加人工把关** — 判据：质量裁决由独立来源独立上下文产出，无自审自判。<!-- 判据说明 -->

### Skill Principles (S)

- [ ] **S1 能用外部就不造轮子** — 判据：优先复用外部技能。<!-- 判据说明 -->
- [ ] **S2 外部技能可针对项目改造合宪** — 判据：外部技能按需改造至合宪。<!-- 判据说明 -->
- [ ] **S3 迭代时保持最新并就地检查** — 判据：迭代时查更新/更优，来源路径写进技能文件。<!-- 判据说明 -->
- [ ] **S4 自定义技能必须有指标系统** — 判据：自研技能配套指标纳入统一执行记录。<!-- 判据说明 -->
- [ ] **S5 自定义技能方便子代理调用省主上下文** — 判据：自研技能便于子代理调用，减少主上下文占用。<!-- 判据说明 -->
- [ ] **S6 自定义技能参考市面方案不闭门造车** — 判据：自研技能参考成熟方案优化。<!-- 判据说明 -->
- [ ] **S7 一阶段一技能一工作流一文件夹** — 判据：阶段/工作流一一对应独立、按目录约定。<!-- 判据说明 -->
- [ ] **S8 自定义技能可独立调用可搬运** — 判据：自研技能可独立调用、可跨宿主搬运、不绑死环境。<!-- 判据说明 -->

**Constitution Check Result**: <!-- [x]/21 clauses addressed. [x] pass, [x] fail. -->

## Project Structure

### Documentation (this feature)

```text
specs/{task-id}/
├── spec.md                  # Build-spec output (authoritative)
├── plan.md                  # This file (spec-plan workflow output)
├── tasks.md                 # spec-tasks workflow output
└── ...
```

### Source Code (repository root)

```text
<!-- 列出需要创建或修改的文件树。标注 NEW/MODIFY/UNCHANGED -->
```

**Structure Decision**: <!-- 说明目录结构选择的理由，关联宪法条款（如 S7）。 -->

## Complexity Tracking

> <!-- 记录设计中的复杂度取舍和潜在问题。
>     对每个超出简单方案的决策：说明 WHY（为什么选更复杂方案）、TRADEOFF（代价是什么）、JUSTIFICATION（为什么值得）。
>     格式示例：
>     - WHY: [原因]
>     - TRADEOFF: [代价]
>     - JUSTIFICATION: [合理性论证]
>     无违规时填 "No constitution violations requiring justification." -->

## Implementation Steps

<!-- 实施步骤按 Phase 分组。每个 Phase 包含若干 Step，每个 Step 说明做什么、涉及哪些文件、映射到哪些 FR。 -->

### Phase 1: Setup / Foundation

<!-- 基础设施、依赖、配置、项目骨架搭建 -->

#### Step 1.1: [步骤名]

<!-- 描述该步骤要完成的工作内容。 -->

**Files**: <!-- 涉及文件列表 -->
**Maps to**: <!-- 对应的 FR 编号 -->

#### Step 1.2: [步骤名]

<!-- 同上。按需补充更多步骤。 -->

### Phase 2: Core Implementation

<!-- 主功能实现（按 User Story 或 FR 优先级分组） -->

#### Step 2.1: [步骤名]

<!-- 描述该步骤要完成的工作内容。 -->

**Files**: <!-- 涉及文件列表 -->
**Maps to**: <!-- 对应的 FR 编号 -->

### Phase 3: Polish / Verification

<!-- 收尾、打磨、测试补充、文档更新 -->

#### Step 3.1: [步骤名]

<!-- 描述该步骤要完成的工作内容。 -->

**Files**: <!-- 涉及文件列表 -->
**Maps to**: <!-- 对应的 FR 编号 -->

### Scope Boundary Verification

<!-- 明确列出不可触碰的文件和路径（FR-SCOPE）。 -->

**DO NOT TOUCH**:
- `workflows/build-code/SKILL.md`
- `workflows/verify-code/SKILL.md`
- <!-- 补充其他受保护路径 -->

## F10 Anti-Over-Engineering Gate

Applied to every new mechanism proposed in this plan before finalizing.

| Mechanism | Q1: What real threat does this defend against? | Q2: Does any existing mechanism already cover it? | Q3: Can it be bypassed? | Q4: What is the long-term maintenance cost? | Keep? |
|---|---|---|---|---|---|
| <!-- 机制名 --> | <!-- 真实威胁？ --> | <!-- 已有覆盖？ --> | <!-- 可绕过？ --> | <!-- 长期维护成本？ --> | <!-- KEEP/PRUNE --> |

**F10 Gate Result**: <!-- N mechanisms evaluated, N kept, N pruned. -->

## Verification Mapping

| Step | Maps to FRs | Verified by AC |
|---|---|---|
| Step 1: [步骤名] | <!-- FR-XXX-001, FR-XXX-002 --> | <!-- AC1, AC2 --> |
| Step 2: [步骤名] | <!-- FR-XXX-003 --> | <!-- AC3 --> |
