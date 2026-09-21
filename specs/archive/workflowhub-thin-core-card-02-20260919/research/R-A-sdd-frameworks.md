# R-A：主流 SDD（规格驱动开发）框架的文档设计与结构调研

> 调研日期：2026-09-20
> 调研者：技术调研员（子代理）
> 调研方法：优先一手来源（官方仓库原始模板文件、官方文档站、官方工程博客）；二手来源（专家文章、issue、社区博客）均显式标注。
> 本报告的目标读者：需要设计「让能力较弱的模型照文档写代码」的规格/计划/任务文档体系的项目（如 workflowhub）。

## 0. 阅读指南与评估维度

### 0.1 本报告对每个框架统一回答的七个问题

1. 框架名 + 官方链接（primary source）
2. 文档清单与各自职责
3. **模板/结构原文摘录**（重点，尽量贴原文骨架）
4. 长度约定或实际样例长度
5. 它解决什么问题
6. 已知批评 / 局限（带来源）
7. 对「让低智力模型照文档写代码」的适配性（有没有专门考虑）

### 0.2 「低智力模型适配性」的判据（本报告自建）

本报告用下面 9 条判据去检查每个框架，因为「弱模型能不能照文档干活」本质上是**文档是否把推理负担前置**的问题：

| 判据 | 含义 |
| --- | --- |
| C1 结构强制 | 模板是否把章节骨架写死，弱模型只需填空 |
| C2 粒度强制 | 是否强制把工作拆到「一次会话能做完」的粒度 |
| C3 上下文控制 | 是否有明确的「每次只读哪些文件/只跑哪些任务」的上下文预算策略 |
| C4 不确定性外显 | 是否强制用 `[NEEDS CLARIFICATION]`、提问等标记未知，而不是让模型猜 |
| C5 措辞规范化 | 是否用受控自然语言（EARS、Given/When/Then、checkbox 格式）压缩表达自由度 |
| C6 可执行校验 | 文档是否被翻译成可运行的测试/属性（executable specification） |
| C7 逐任务停顿 | 是否强制「做一个任务就停」，避免弱模型自作主张连做 |
| C8 单次一问 | 是否把澄清做成一次问少数几个问题（弱模型的提问质量差） |
| C9 反过度设计 | 是否有明确的「不要加没要求的东西」约束 |

### 0.3 术语澄清：SDD 的三个层次

Thoughtworks 的 Birgitta Böckeler 在 Martin Fowler 站点上给出目前最被广泛引用的分层（该文也被 Spec Kit 官方文档自身引用）：

- **Spec-first**：先写好规格，然后用它做当前任务；任务完成后规格可以丢掉。
- **Spec-anchored**：规格在任务完成后继续保留，用于后续演进与维护。
- **Spec-as-source**：规格是唯一的「源文件」，人只编辑规格，代码完全由规格再生成。

来源：<https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html>（专家二手来源，但被 Spec Kit 官方文档 <https://github.com/github/spec-kit/blob/main/docs/concepts/spec-persistence.md> 引用，可信度高）

**重要结论（先说）**：市面上主流框架几乎都只做到 spec-first；只有 Tessl 明确宣称要做 spec-anchored 并向 spec-as-source 探索。这对「弱模型」场景很关键——如果规格是一次性消耗品，那么为弱模型积累的「可复用文档资产」是拿不到的。

---

## 1. GitHub Spec Kit

### 1.1 官方链接

| 类型 | 链接 |
| --- | --- |
| 仓库 | <https://github.com/github/spec-kit> |
| 官方文档站 | <https://github.github.io/spec-kit/> |
| 方法论长文（一手） | <https://github.com/github/spec-kit/blob/main/spec-driven.md> |
| 命令参考（一手） | <https://github.com/github/spec-kit/blob/main/docs/reference/agentic-sdd.md> |
| 复杂度与上下文策略（一手） | <https://github.com/github/spec-kit/blob/main/docs/concepts/complex-features.md> |
| 规格持久化模型（一手） | <https://github.com/github/spec-kit/blob/main/docs/concepts/spec-persistence.md> |
| 模板目录（一手原文） | <https://github.com/github/spec-kit/tree/main/templates> |
| 官方发布博客 | <https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/> |

### 1.2 定位与流程

Spec Kit 把自己定位为「给 AI 编码代理一套结构化流程、可复用模板和可记录产出」的开源工具箱。README 明确说明它提供**三个互相独立的入口**，而不是三个必经阶段：

1. **Spec-Driven Development**（核心内置）：`Constitution once per project; specify → plan → tasks → implement → converge per feature.`
2. **Bug fixing**（opt-in 扩展 `specify extension add bug`）：`assess → fix → test`，产出落在 `.specify/bugs/<slug>/`。
3. **Idea assessment**（opt-in 扩展 `specify extension add assess`）：`intake → research → define → shape → decide`，产出落在 `.specify/assessments/<slug>/`，结论是 `go / needs-clarification / kill`。

完整命令链（一手，命令参考页原文）：

```text
/speckit.constitution -> /speckit.specify -> /speckit.clarify -> /speckit.plan -> /speckit.checklist -> /speckit.tasks -> /speckit.analyze -> /speckit.implement -> /speckit.converge
```

| 命令 | 作用 | 是否必需 |
| --- | --- | --- |
| `/speckit.constitution` | 建立/更新项目原则（宪法） | 每项目一次 |
| `/speckit.specify` | 从自然语言描述生成 `spec.md`，只管 what/why | 必需 |
| `/speckit.clarify` | 就规格中欠明确处最多问 5 个问题，答案写回 `spec.md` | 可选质量门 |
| `/speckit.plan` | 生成技术实现计划与设计产物 | 必需（可在 specify 后） |
| `/speckit.checklist` | 生成「需求的单元测试」清单 | 可选质量门 |
| `/speckit.tasks` | 生成依赖有序的 `tasks.md` | 必需 |
| `/speckit.analyze` | 只读跨产物一致性分析（spec/plan/tasks） | 可选质量门 |
| `/speckit.implement` | 逐阶段执行任务，回写 `[X]` | 必需 |
| `/speckit.converge` | 评估代码与产物差距，**append-only** 追加遗漏任务 | 可选收尾 |
| `/speckit.taskstoissues` | 把 tasks 转成 GitHub issue | 可选 |

注意：Spec Kit 近期（main 分支）已把命令从 `/specify` 这类形态迁移为 **agent skills** 形态（`/speckit-*` 或 `/skill:speckit-*` 等，视集成而定），并引入了 `converge`、bug/assess 扩展、presets/extensions/bundles 定制体系。旧的博客与教程仍在讲 `/specify /plan /tasks /implement`，二者是同一流程的不同世代版本。

### 1.3 文档清单与各自职责

一个 Spec Kit 项目初始化后会得到 `.specify/`（模板、脚本、配置、扩展）与 `memory/constitution.md`。每个特性在 `specs/<NNN-feature-name>/` 下生成一组文档：

| 文件 | 由谁生成 | 职责 |
| --- | --- | --- |
| `memory/constitution.md` | `/speckit.constitution` | 项目级不可协商原则；后续每阶段都要对照检查 |
| `specs/<feature>/spec.md` | `/speckit.specify` | 用户场景、功能需求（FR-###）、成功标准（SC-###）、假设；**禁止写技术栈/API/代码结构** |
| `specs/<feature>/checklists/requirements.md` | `/speckit.specify` 自动生成，`/speckit.clarify` 复评 | 内置「规格质量清单」，16 条固定检查项 |
| `specs/<feature>/checklists/<domain>.md` | `/speckit.checklist` | 自定义「需求质量」评审清单，**reviewer-owned**，`[x]` 表示需求质量通过（不是实现完成） |
| `specs/<feature>/plan.md` | `/speckit.plan` | 技术上下文、宪法检查门、项目结构、复杂度追踪 |
| `specs/<feature>/research.md` | `/speckit.plan` Phase 0 | 把 NEEDS CLARIFICATION 逐条变成「Decision / Rationale / Alternatives considered」 |
| `specs/<feature>/data-model.md` | `/speckit.plan` Phase 1 | 实体、字段、关系、校验规则、状态迁移 |
| `specs/<feature>/contracts/` | `/speckit.plan` Phase 1 | 对外接口契约（API/CLI/事件等） |
| `specs/<feature>/quickstart.md` | `/speckit.plan` Phase 1 | 端到端可运行验证脚本/场景（**只允许验证指南，不允许贴实现代码**） |
| `specs/<feature>/tasks.md` | `/speckit.tasks` | 严格格式的任务清单；`/speckit.converge` 只允许在末尾追加 `## Phase N: Convergence` |
| `specs/<epic>/roadmap.md` | 手工（spec-of-specs 约定） | 超大特性分解成子规格的路线图 |

### 1.4 模板/结构原文摘录

#### 1.4.1 `templates/spec-template.md`（规格模板骨架）

原文（保留英文，去掉了注释块中的示例，注释以 HTML 注释形式存在于模板中）：

```markdown
# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`
**Created**: [DATE]
**Status**: Draft
**Input**: User description: "$ARGUMENTS"

## User Scenarios & Testing *(mandatory)*
### User Story 1 - [Brief Title] (Priority: P1)
[Describe this user journey in plain language]
**Why this priority**: [...]
**Independent Test**: [...]
**Acceptance Scenarios**:
1. **Given** [initial state], **When** [action], **Then** [expected outcome]

### Edge Cases
- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Requirements *(mandatory)*
### Functional Requirements
- **FR-001**: System MUST [specific capability, e.g., "allow users to create accounts"]
...
*Example of marking unclear requirements:*
- **FR-006**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]

### Key Entities *(include if feature involves data)*
- **[Entity 1]**: [What it represents, key attributes without implementation]

## Success Criteria *(mandatory)*
### Measurable Outcomes
- **SC-001**: [Measurable metric, e.g., "Users can complete account creation in under 2 minutes"]

## Assumptions
- [Assumption about target users, ...]
```

模板内嵌的关键约束（原文注释）：

```text
IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
you should still have a viable MVP (Minimum Viable Product) that delivers value.
```

#### 1.4.2 `templates/plan-template.md`（计划模板骨架）

```markdown
# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

## Summary
[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context
**Language/Version**: [e.g., Python 3.11 ... or NEEDS CLARIFICATION]
**Primary Dependencies**: [...]
**Storage**: [...]
**Testing**: [...]
**Target Platform**: [...]
**Project Type**: [...]
**Performance Goals**: [...]
**Constraints**: [...]
**Scale/Scope**: [...]

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*
[Gates determined based on constitution file]

## Project Structure
### Documentation (this feature)
```text
specs/[###-feature]/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (NOT created by the plan command)
```
### Source Code (repository root)
**Structure Decision**: [...]

## Complexity Tracking
> **Fill ONLY if Constitution Check has violations that must be justified**
| Violation | Why Needed | Simpler Alternative Rejected Because |
```

#### 1.4.3 `templates/tasks-template.md`（任务模板骨架）

模板开头就写死了**格式契约**（原文）：

```markdown
## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions
```

阶段骨架（原文结构）：

```markdown
## Phase 1: Setup (Shared Infrastructure)
- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize [language] project with [framework] dependencies
- [ ] T003 [P] Configure linting and formatting tools

## Phase 2: Foundational (Blocking Prerequisites)
**⚠️ CRITICAL**: No user story work can begin until this phase is complete
- [ ] T004 Setup database schema and migrations framework
...
**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP
**Goal**: [...]
**Independent Test**: [...]
### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**
- [ ] T010 [P] [US1] Contract test for [endpoint] in tests/contract/test_[name].py
### Implementation for User Story 1
- [ ] T012 [P] [US1] Create [Entity1] model in src/models/[entity1].py
- [ ] T014 [US1] Implement [Service] in src/services/[service].py (depends on T012, T013)
**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

## Phase N: Polish & Cross-Cutting Concerns
## Dependencies & Execution Order
## Parallel Example: User Story 1
## Implementation Strategy  (MVP First / Incremental Delivery / Parallel Team Strategy)
```

`/speckit.tasks` 命令中还有一条**强制的 checklist 格式**（原文，含 ✅/❌ 示例）：

```text
- [ ] [TaskID] [P?] [Story?] Description with file path

✅ CORRECT: `- [ ] T012 [P] [US1] Create User model in src/models/user.py`
❌ WRONG: `- [ ] Create User model` (missing ID and Story label)
❌ WRONG: `- [ ] T001 [US1] Create model` (missing file path)
```

#### 1.4.4 `templates/constitution-template.md`（宪法模板骨架）

```markdown
# [PROJECT_NAME] Constitution
## Core Principles
### [PRINCIPLE_1_NAME]     <!-- Example: I. Library-First -->
[PRINCIPLE_1_DESCRIPTION]
### [PRINCIPLE_2_NAME]     <!-- Example: II. CLI Interface -->
...
### [PRINCIPLE_5_NAME]     <!-- Example: V. Observability, VI. Versioning & Breaking Changes, VII. Simplicity -->
## [SECTION_2_NAME]        <!-- Example: Additional Constraints, Security Requirements ... -->
## [SECTION_3_NAME]        <!-- Example: Development Workflow, Review Process, Quality Gates ... -->
## Governance
**Version**: [CONSTITUTION_VERSION] | **Ratified**: [RATIFICATION_DATE] | **Last Amended**: [LAST_AMENDED_DATE]
```

`spec-driven.md` 中把宪法展开为**九条 Article**（Library-First / CLI Interface Mandate / Test-First Imperative / IV–VI 项目自定义 / VII Simplicity / VIII Anti-Abstraction / IX Integration-First Testing），并给出 Phase -1 的三个门（Simplicity Gate、Anti-Abstraction Gate、Integration-First Gate）。注意这是方法论文档的叙述，在当前 `templates/plan-template.md` 中对应位置只保留了通用的 `## Constitution Check` 一节。

#### 1.4.5 `templates/checklist-template.md`（需求质量清单）

```markdown
# [CHECKLIST TYPE] Checklist: [FEATURE NAME]
**Purpose**: ... **Created**: [DATE] **Feature**: [Link to spec.md]
**Review Ownership**: This checklist is a reviewer-owned requirements-quality review artifact.
**Marker Semantics**: `[x]` means the criterion has been reviewed and satisfied for requirements quality.
                    It does not mean implementation work is complete.
## [Category 1]
- [ ] CHK001 First checklist item with clear action
```

`/speckit.checklist` 命令里对「清单是需求的单元测试」有大量正反例约束，最硬的一条是：

```text
🚫 ABSOLUTELY PROHIBITED:
- ❌ Any item starting with "Verify", "Test", "Confirm", "Check" + implementation behavior
- ❌ References to code execution, user actions, system behavior
- ❌ "Displays correctly", "works properly", "functions as expected"
✅ REQUIRED PATTERNS:
- ✅ "Are [requirement type] defined/specified/documented for [scenario]?"
```

### 1.5 长度约定（Spec Kit 的硬数字）

Spec Kit 的模板本身**不给 spec.md / plan.md 的字符数或行数上限**，但在命令脚本里给了一批可执行的数量约束，这是它最接近「长度约定」的东西：

| 约束 | 数值 | 出处 |
| --- | --- | --- |
| `[NEEDS CLARIFICATION]` 标记数量 | **最多 3 个**，超出则只保留影响最大的 3 个，其余自行合理默认 | `templates/commands/specify.md` |
| 澄清提问数量（specify 内联） | 最多 3 个（Q1/Q2/Q3） | 同上 |
| 澄清提问数量（`/speckit.clarify`） | 最多 5 个 | `docs/reference/agentic-sdd.md` |
| 内置 `checklists/requirements.md` 检查项 | 固定 16 条（Content Quality 4 + Requirement Completeness 8 + Feature Readiness 4） | `templates/commands/specify.md` |
| 自定义清单候选条目 | **soft cap 40**；超过则按风险/影响裁剪；>5 条低影响边缘用例合并成 1 条 | `templates/commands/checklist.md` |
| 清单条目的可追溯引用比例 | **≥80%** 的条目必须带 `[Spec §X.Y]` / `[Gap]` / `[Ambiguity]` 等引用 | 同上 |
| `/speckit.analyze` findings 上限 | **50 条**，超出汇总为 overflow | `templates/commands/analyze.md` |
| 规格质量校验重试次数 | 最多 3 轮 | `templates/commands/specify.md` |
| 澄清问题转写回 spec | 逐个替换而非重写全文 | 同上 |
| `/speckit.converge` 写入范围 | **append-only**，只允许追加 `## Phase N: Convergence`；无缺口时 `tasks.md` 必须**字节级不变** | `templates/commands/converge.md` |

经验性的「长度观」在 `spec-driven.md` 里表述为（引用了旧版 plan 模板的原文，当前模板已不再包含这句）：

```text
**IMPORTANT**: This implementation plan should remain high-level and readable.
Any code samples, detailed algorithms, or extensive technical specifications
must be placed in the appropriate `implementation-details/` file
```

也就是说 Spec Kit 的态度是「主文档保持高层可读，细节外置到子文件」，而不是给一个行数上限。

### 1.6 它解决什么问题

- 把「模糊 prompt → 看起来对但跑不通的代码」换成「意图 → 规格 → 计划 → 任务 → 实现」的显式链条。官方博客的原话：`The issue isn't the coding agent's coding ability, but our approach. We treat coding agents like search engines when we should be treating them more like literal-minded pair programmers.`
- 用模板解决「模型不知道要问什么」的问题：强制 `[NEEDS CLARIFICATION]`、强制成功标准可度量且技术无关、强制用户故事可独立测试。
- 把组织级约束（安全、合规、设计系统）放进宪法和计划，让它们成为每次生成的输入。
- 提供跨产物的一致性检查（analyze）与补齐机制（converge），把「漏做」变成可发现的事实。

### 1.7 已知批评 / 局限

1. **产物爆炸、评审负担转向 Markdown**（专家批评，最有力）：Böckeler 实测后写道：`spec-kit created a LOT of markdown files for me to review. They were repetitive, both with each other, and with the code that already existed. ... Overall they were just very verbose and tedious to review.` 以及 `To be honest, I'd rather review code than all these markdown files.` 来源：<https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html>
2. **对问题规模不敏感**：同一篇实测里，一个 3–5 点的小故事被展开成大量需要评审的 Markdown，作者认为用「普通 AI 辅助编码」的时间更短、掌控感更强。
3. **「假掌控感」**：`Even with all of these files and templates and prompts and workflows and checklists, I frequently saw the agent ultimately not follow all the instructions.` 具体案例：plan 阶段的 research 把「已有代码的描述」当成新规格重新生成，造成重复实现。来源同上。
4. **社区对文件数量的抱怨**（一手 issue）：spec-kit issue #314 标题即 `It os creating too much files which are hard to verify and maintain`，请求「minimal way, or single file approach」，被标记 stale 后 **closed as not planned**。来源：<https://github.com/github/spec-kit/issues/314>
5. **大代码库/长项目会退化**（一手 issue）：issue #955 报告在实现一门 JIT 语言时，Sonnet 4.5 卡在项目初始化，GPT-5 Codex 撑到第三阶段后也开始退化，作者结论是「reached the project size limit for any AI to handle right now」，并建议「partition spec work ... in something like pipeline with separate contexts / chats」。来源：<https://github.com/github/spec-kit/issues/955>。GitHub 官方文档 `docs/concepts/complex-features.md` 事实上承认了同一现象：`agents can start to lose track of the plan, ignore tasks, or hallucinate — usually right before or after context compaction is triggered.`
6. **规格持久化策略未定**：官方自己承认 `Spec Kit does not prescribe how teams preserve or mutate spec.md, plan.md, and tasks.md after requirements change`，只给出三种模型（flow-back / flow-forward / living spec）让团队自选。对需要长期资产的团队，这是必须自行补齐的空白。来源：<https://github.com/github/spec-kit/blob/main/docs/concepts/spec-persistence.md>
7. **本质仍是 spec-first**：Böckeler 指出 spec-kit 为每个 spec 建分支，意味着规格的生命周期是「一次变更请求」，不是「一个特性的生命周期」。

### 1.8 对「让低智力模型照文档写代码」的适配性（Spec Kit 有专门考虑）

Spec Kit 是本次调研中**唯一在方法论文档里专门写了一节论证「模板如何约束 LLM」**的框架。`spec-driven.md` 的 `Template-Driven Quality: How Structure Constrains LLMs for Better Outcomes` 一节列出 7 条机制：

1. **阻止过早引入实现细节**：spec 模板强制标注 `✅ Focus on WHAT users need and WHY / ❌ Avoid HOW to implement`，防止模型直接跳到「用 React + Redux 实现」。
2. **强制外显不确定性**：`Mark all ambiguities: Use [NEEDS CLARIFICATION: specific question]` / `Don't guess`。原话：`This prevents the common LLM behavior of making plausible but potentially incorrect assumptions.`
3. **用清单做结构化自检**：把 checklist 当作规格的「unit tests」，让模型系统化自审。
4. **用宪法门做约束**：Phase -1 的 Simplicity / Anti-Abstraction / Integration-First 门，失败必须在 Complexity Tracking 里逐条解释。
5. **分层信息架构**：主文档保持高层，细节外置到 `implementation-details/`。
6. **测试先行的顺序约束**：`contracts/ → contract tests → integration tests → e2e → unit → source`，避免模型先写实现。
7. **禁止投机性特性**：`No speculative or "might need" features`。

除此之外，还有三条**直接针对低能力执行者**的机制（都在命令文本里可执行）：

- **任务粒度写到「无需额外上下文」**：`/speckit.tasks` 的完成标准原文是 `The tasks.md should be immediately executable - each task must be specific enough that an LLM can complete it without additional context.`
- **把约束逐字搬进任务描述**：`/speckit.tasks` 的任务生成规则第 3 条原文：`For each field with constraints in data-model.md (max length, nullable/required, enum values, validation rules), quote the constraint verbatim in the task description so it is not left to implementation-time discretion.` 这是明确的「不要让弱模型在执行时自行判断」。
- **上下文预算策略**：`docs/concepts/complex-features.md` 给出 4 个选项（限制每次 implement 的任务数/只跑一个阶段 → 委派子代理 → 两者结合 → 拆成 spec of specs），并配有 roadmap 模板，明确把「模型在上下文将满时开始丢任务、幻觉」当作一等工程问题处理。

**缺口**：Spec Kit 的默认命令链假设执行者是较强模型（它依赖模型自主遵守大段英文约束、自主判断「testable and unambiguous」）。弱模型场景下，`/speckit.analyze`、`/speckit.checklist` 这类「让模型自评」的环节最可能失效——官方也承认清单是 `interpreted by AI, so there is no 100% guarantee that they will be respected`（Böckeler 转述）。

---

## 2. Amazon Kiro

### 2.1 官方链接

| 类型 | 链接 |
| --- | --- |
| 产品站 | <https://kiro.dev/> |
| 规格总览（一手） | <https://kiro.dev/docs/specs/> |
| Feature Specs（一手） | <https://kiro.dev/docs/specs/feature-specs/> |
| Requirements-First 工作流（一手） | <https://kiro.dev/docs/specs/feature-specs/requirements-first/> |
| Correctness / 性质测试（一手） | <https://kiro.dev/docs/specs/correctness/> |
| Bugfix Specs（一手） | <https://kiro.dev/docs/specs/bugfix-specs/> |
| Quick Spec（一手） | <https://kiro.dev/docs/specs/quick-spec/> |
| Analyze Requirements（一手） | <https://kiro.dev/docs/specs/analyze-requirements/> |
| 最佳实践 FAQ（一手） | <https://kiro.dev/docs/specs/best-practices/> |
| 官方博客：property-based testing | <https://kiro.dev/blog/property-based-testing/> |
| EARS 原始定义（一手，Mavin/Rolls-Royce） | <https://alistairmavin.com/ears/> |

### 2.2 定位与流程

Kiro 是 AWS 出的 agentic IDE（含 CLI / Web / Mobile）。官方定义：`Specs or specifications are structured artifacts that formalize the development process for features and bug fixes in your application.`

三阶段流程（官方原文）：

```text
Requirements or Bug Analysis  →  Design  →  Tasks
```

- **Feature Specs** 有两个变体：**Requirements-First**（`Requirements → Design → Tasks`）和 **Design-First**（`Design → Requirements → Tasks`），创建时必须选定、不可中途切换。
- **Quick Spec**：一次性自动生成三份产物，阶段之间**没有 approval gate**，代价是把澄清问题全部前置。
- **Bugfix Specs**：用 `bugfix.md` 替代 `requirements.md`，三阶段同构。

Kiro 支持的规格类型对照（官方表格，节选）：

| 能力 | IDE | CLI | Web | Mobile |
| --- | --- | --- | --- | --- |
| Feature / Bugfix / Quick Spec | ✓ | ✓ | ✓ | — |
| 并行任务执行 | ✓ | ✓ | ✓ | — |
| Analyze Requirements | ✓ | ✓ | — | — |
| Correctness（性质测试） | ✓ | — | — | — |

并行执行机制（官方原文）：Kiro 会为 `tasks.md` 构建**依赖图**并分 **wave**：`Wave 1 - all tasks with no dependencies ... Wave N - continues until all tasks are complete. Waves execute sequentially; tasks within a wave execute concurrently.`

### 2.3 文档清单与各自职责

| 路径 | 职责 |
| --- | --- |
| `.kiro/specs/<feature>/requirements.md` | 用户故事 + EARS 格式验收标准 |
| `.kiro/specs/<feature>/bugfix.md` | 缺陷分析：Current Behavior (Defect) / Expected Behavior (Correct) / Unchanged Behavior (Regression Prevention) |
| `.kiro/specs/<feature>/design.md` | 架构、组件与接口、时序图（Mermaid）、数据模型、错误处理、测试策略 + **correctness properties** |
| `.kiro/specs/<feature>/tasks.md` | 编号 checkbox 任务清单，每条回引需求号 |
| `.kiro/steering/*.md` | 项目级「记忆库」（steering documents）：架构规则、TDD 规则、代码风格等，Kiro 自动读取 |
| `.kiro/hooks/*.kiro.hook` | 事件触发的自动化（如自动建 PR） |

Kiro 建议**一个仓库放多个 spec**，而不是一个巨型 spec：

```text
.kiro/specs/
├── user-authentication/   # Login, signup, password reset
├── product-catalog/       # Product listing, search, filtering
├── shopping-cart/         # Add to cart, quantity updates, checkout
├── payment-processing/    # Payment gateway integration, order confirmation
└── admin-dashboard/       # Product management, user analytics
```

spec 可版本化、可用 Git submodule / package reference 跨团队共享；在 chat 里用 `#spec` 上下文提供者整体引用三份文件。

### 2.4 模板/结构原文摘录

#### 2.4.1 `requirements.md` 结构（Kiro spec agent 的硬性约束）

Kiro 的 spec agent 对 `requirements.md` 的格式约束如下（来源为公开流传的 Kiro spec agent system prompt 快照，**非官方发布，属二手来源**，但与官方文档描述一致；链接：<https://gist.github.com/notdp/19822831b54190bd9c6b34f6b69fadeb>）：

```md
# Requirements Document

## Introduction

[Introduction text here]

## Requirements

### Requirement 1

**User Story:** As a [role], I want [feature], so that [benefit]

#### Acceptance Criteria
1. WHEN [event] THEN [system] SHALL [response]
2. IF [precondition] THEN [system] SHALL [response]

### Requirement 2

**User Story:** As a [role], I want [feature], so that [benefit]

#### Acceptance Criteria
1. WHEN [event] THEN [system] SHALL [response]
2. WHEN [event] AND [condition] THEN [system] SHALL [response]
```

硬约束原文：`The model MUST generate an initial version of the requirements document based on the user's rough idea WITHOUT asking sequential questions first`，并且每轮修改后 `MUST ask for explicit approval`，未获明确批准（"yes"/"approved"）不得进入下一阶段。

官方文档给出的真实样例（`requirements-first` 页）：

```markdown
## User Authentication
### User Registration
WHEN a user submits valid registration data THEN THE SYSTEM SHALL create a new user account
WHEN a user submits an email that already exists THEN THE SYSTEM SHALL display "Email already registered" error
WHEN a user submits invalid email format THEN THE SYSTEM SHALL display email validation error
```

#### 2.4.2 EARS 需求语法（Kiro 用的受控自然语言）

EARS = Easy Approach to Requirements Syntax，2009 年由 Rolls-Royce 的 Alistair Mavin 等人提出，用于约束自然语言需求的写法（原始来源：<https://alistairmavin.com/ears/>）。通用句式：

```text
While <optional pre-condition>, when <optional trigger>, the <system name> shall <system response>
```

五种模式（原文）：

| 模式 | 句式 | 例子 |
| --- | --- | --- |
| Ubiquitous（无关键字） | `The <system name> shall <system response>` | The mobile phone shall have a mass of less than XX grams. |
| State driven（While） | `While <precondition(s)>, the <system name> shall <system response>` | While there is no card in the ATM, the ATM shall display "insert card to begin". |
| Event driven（When） | `When <trigger>, the <system name> shall <system response>` | When "mute" is selected, the laptop shall suppress all audio output. |
| Optional feature（Where） | `Where <feature is included>, the <system name> shall <system response>` | Where the car has a sunroof, the car shall have a sunroof control panel on the driver door. |
| Unwanted behaviour（If/Then） | `If <trigger>, then the <system name> shall <system response>` | If an invalid credit card number is entered, then the website shall display "please re-enter credit card details". |
| Complex（组合） | `While <precondition(s)>, When <trigger>, the <system name> shall <system response>` | While the aircraft is on ground, when reverse thrust is commanded, the engine control system shall enable reverse thrust. |

规则集原文：`a requirement must have: Zero or many preconditions; Zero or one trigger; One system name; One or many system responses.` Kiro 只用了其中的 WHEN/IF/WHILE 子集。

Kiro 官方声称这样做的好处是 Clarity / Testability / Traceability / Completeness 四项。

**值得注意的批评**（二手来源，博客文章，非官方）：有分析指出 `EARS is requirements-syntax discipline, not a behavioral test you can run`——即 EARS 只是让句子长得规整，并不能自动保证需求正确。来源：<https://codemyspec.com/blog/kiro-specs-explained>

#### 2.4.3 `design.md` 结构

官方文档只说 `design.md` 包含架构、时序图、数据模型、接口、技术栈建议、错误处理、测试策略。Kiro spec agent 的强制章节清单是：

```text
- Overview
- Architecture
- Components and Interfaces
- Data Models
- Error Handling
- Testing Strategy
```

并要求 `SHOULD include diagrams or visual representations when appropriate (use Mermaid for diagrams if applicable)`，且 `SHOULD NOT create separate research files, but instead use the research as context for the design`。

#### 2.4.4 Correctness properties（Kiro 的独门设计）

Kiro 在 design 阶段从 EARS 需求中**抽取性质（properties）**，在实现阶段把它们变成**性质测试**（property-based testing，Python 用 Hypothesis）。官方原文的例子：

```text
2.3. WHILE the Traffic Control System is operating, THE Control Module SHALL maintain the
     invariant that at most one direction displays green

Property: Safety invariant - at most one green signal
*For any* sequence of operations (state transitions, emergency mode activation, timing updates),
at every point in time, at most one direction should have a green signal
**Validates: Requirements 2.3**
```

对应的可执行测试（官方博客原文）：

```python
def test_safety_invariant_at_most_one_green(timing_config: TimingConfig, operations: list):
    """Feature: traffic-control-system, Property 2: Safety invariant - at most one green signal
    Validates: Requirements 2.3
    """
    state_manager = SignalStateManager(timing_config)
    control_module = ControlModule(state_manager)
    assert control_module.validate_safety(), "Initial state should be safe"
    for operation in operations:
        ...
        green_count = sum(1 for state in all_states.values() if state == SignalState.GREEN)
        assert green_count <= 1, f"Safety violation: ..."
```

它明确宣称的常见性质「形状」包括：不变量（invariant）、往返（round trip，序列化/解析）、幂等（idempotence）。失败时用 **shrinking** 收窄到最小反例，再由 agent 定位根因。

官方也明确列了局限：

```text
- It provides evidence of correctness, not a proof. It is not formal verification.
- Identifying and defining useful properties takes work. A property that is too weak,
  or that states the wrong invariant, will pass while the real behavior is still wrong.
- Not every requirement maps cleanly to a property.
```

#### 2.4.5 `tasks.md` 结构（Kiro 的格式强制）

Kiro spec agent 对任务清单的约束原文（要点）：

```text
- The model MUST format the implementation plan as a numbered checkbox list with a maximum of two levels of hierarchy
- Top-level items (like epics) should be used only when needed
- Sub-tasks should be numbered with decimal notation (e.g., 1.1, 1.2, 2.1)
- Each item must be a checkbox
- Simple structure is preferred
- A clear objective as the task description that involves writing, modifying, or testing code
- Additional information as sub-bullets under the task
- Specific references to requirements from the requirements document (referencing granular sub-requirements, not just user stories)
- The model MUST ONLY include tasks that can be performed by a coding agent (writing code, creating tests, etc.)
- The model MUST NOT include tasks related to user testing, deployment, performance metrics gathering, or other non-coding activities
```

以及最关键的转化指令：

```text
Convert the feature design into a series of prompts for a code-generation LLM that will implement each step
in a test-driven manner. Prioritize best practices, incremental progress, and early testing, ensuring no big
jumps in complexity at any stage. Make sure that each prompt builds on the previous prompts, and ends with
wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step.
Focus ONLY on tasks that involve writing, modifying, or testing code.
```

官方给出的任务样例骨架：

```markdown
# Implementation Plan

- [ ] 1. Set up project structure and core interfaces
 - Create directory structure for models, services, repositories, and API components
 - Define interfaces that establish system boundaries
 - _Requirements: 1.1_

- [ ] 2. Implement data models and validation
- [ ] 2.1 Create core data model interfaces and types
  - Write TypeScript interfaces for all data models
  - Implement validation functions for data integrity
  - _Requirements: 2.1, 3.3, 1.2_

- [ ] 3.2 Implement repository pattern for data access
  - Code base repository interface
  - Implement concrete repositories with CRUD operations
  - Write unit tests for repository operations
  - _Requirements: 4.3_
```

任务的**唯一来源**是需求编号（`_Requirements: 2.1, 3.3, 1.2_`），需求文档中「granular sub-requirements」是可追溯的最小单元。

#### 2.4.6 `bugfix.md` 结构（三段式，值得借鉴）

```text
Current Behavior (Defect)
- WHEN [condition] THEN the system [incorrect behavior]

Expected Behavior (Correct)
- WHEN [condition] THEN the system SHALL [correct behavior]

Unchanged Behavior (Regression Prevention)
- WHEN [condition] THEN the system SHALL CONTINUE TO [existing behavior]
```

第三段是精髓：它把「不许改坏的东西」写成与需求同构的、可被性质测试覆盖的断言。

### 2.5 长度约定

Kiro 官方文档**没有给出任何字符数/行数/task 数上限**。可观察到的实际约定来自它的设计意图与实测记录：

| 约定 | 内容 | 出处 |
| --- | --- | --- |
| spec 粒度 | 「一个特性一个 spec 目录」，官方建议多建 spec 而不是一个巨型 spec | best-practices |
| 任务粒度 | 每个任务要「一个 coding agent 能执行、无需额外澄清」；官方博客里表述为 `Each task is small enough for Kiro to implement in one sitting` | spec agent 约束 / 社区文章 |
| 层次深度 | 任务清单**最多两级**（`1.` 与 `1.1`） | spec agent 约束 |
| 每次执行量 | 默认「一次只做一个任务，做完停下等用户 review」，不允许自动续做 | spec agent 约束 |
| 需求条数 | 无上限；实测反例：一个**小 bug**被展开成 **4 个 user story、16 条 acceptance criteria** | Böckeler 实测，<https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html> |

### 2.6 它解决什么问题

- 用**三份固定文件 + 固定阶段 + 强制逐阶段批准**，把「聊天里反复澄清」变成「文档里的显式共识」。官方对痛点的描述：`This back-and-forth conversation fills up the context window. By the time you get working code, there's no space left for the AI to help with the details.`
- 用 EARS 让需求「可直接翻译成测试用例」。
- 用 `tasks.md` 依赖图实现并行 wave 执行，缩短实现时间。
- 用性质测试把自然语言规格变成**可执行规格**，直接针对「AI 生成的代码是否真的符合意图」这个问题。
- Bugfix Spec 用「保持不变的既有行为」显式防回归。

### 2.7 已知批评 / 局限

1. **对问题规模不敏感（最有力的批评，专家实测）**：Böckeler 让 Kiro 修一个小 bug，`The requirements document turned this small bug into 4 "user stories" with a total of 16 acceptance criteria, including gems like "User story: As a developer, I want the transformation function to handle edge cases gracefully, so that the system remains robust when new category formats are introduced."` 结论是 `the workflow was like using a sledgehammer to crack a nut`。来源：<https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html>
2. **只是 spec-first，不是 spec-anchored**：该文指出 `It seems to be mostly spec-first, all the examples I have found use it for a task, or a user story, with no mention of how to use the requirements document in a spec-anchored way over time`。Kiro 官方 FAQ 也只讲「迭代当前 spec」，未讲跨版本维护。
3. **EARS 是措辞纪律不是验证手段**：见 2.4.2 的二手来源批评。
4. **性质测试有明确边界**：官方自认不是形式化验证，性质定义不佳会「通过但仍然是错的」，且部分需求（依赖外部服务、非确定性行为）不适合性质化。
5. **闭源、绑定 Kiro 产品**：制品格式（`.kiro/`）与 IDE 深度绑定，要求「设计稿导入」「MCP 导入」等能力时依赖 Kiro 自身；无 CLI 的 Correctness 能力（官方能力表里 CLI 为 `—`）。
6. **模型相关的现实体验差异**（弱二手来源，仅作参考）：Kiro 官方 dev.to 账号下的实践文章评论区提到默认 `Auto` 模型体验一般，作者改用 Claude Sonnet 4.5 后「follows the TDD rules very well」。来源：<https://dev.to/kirodotdev/stop-chatting-start-specifying-spec-driven-design-with-kiro-ide-3b3o>

### 2.8 对「让低智力模型照文档写代码」的适配性（Kiro 是本次调研里工程化程度最高的）

Kiro 的约束集合几乎逐条命中 0.2 节的判据，很多是**强制（MUST）而非建议（SHOULD）**：

| 判据 | Kiro 的具体机制 |
| --- | --- |
| C1 结构强制 | `requirements.md`/`design.md`/`tasks.md` 三份文件的章节骨架被写死（design 的 6 个章节为 MUST，tasks 的格式为 MUST） |
| C2 粒度强制 | 任务必须「a coding agent 能执行、无需额外澄清」；任务最多两级；禁止把用户测试/部署/性能采集等非编码活动写进任务 |
| C3 上下文控制 | 三阶段各读各的文件；`#spec` 整体注入三份文件；执行某任务时必须先读 requirements/design/tasks 三份；官方把「每任务一个独立上下文」作为并行 wave 的实现基础 |
| C4 不确定性外显 | 每个阶段结束必须用 `userInput` 工具请求批准，未获明确批准不得前进；`Analyze Requirements` 专门找模糊词、冲突约束、未声明假设、缺失边界用例 |
| C5 措辞规范化 | EARS 受控语法 + `_Requirements: 2.1_` 回引 + `- [ ] 1.2` 编号格式 |
| C6 可执行校验 | **correctness properties → 性质测试**，属性文本 `**Validates: Requirements 2.3**` 与需求双向可跳转；这直接补偿了弱模型「实现看起来对但语义错」的问题 |
| C7 逐任务停顿 | `Remember, it is VERY IMPORTANT that you only execute one task at a time. Once you finish a task, stop. Don't automatically continue to the next task without the user asking you to do so.` |
| C8 单次一问 | 阶段级批准是单点问题（"Do the requirements look good?"），而不是多问题问卷；`Analyze Requirements` 才流式抛问题 |
| C9 反过度设计 | 任务不得包含非编码活动；design 阶段包含技术栈与错误处理，明确把「怎么做」压在设计文档里，避免实现时自由发挥 |

**Kiro 最值得借鉴的一条**：它把「弱模型容易写错语义」的补偿放在**性质测试 + 需求号双向追溯**上，而不是放在「写更长的文档」上。这是与其他框架最本质的区别。

**Kiro 的缺口**：三个阶段的「批准」完全依赖人；如果没有人在环，弱模型自己生成的 requirements 错误会被原样放大到 design 和 tasks。此外 Kiro 不提供「任务级验收断言」的模板（只有需求号回引），验收仍依赖下一步的性质测试。

---

## 3. Tessl

### 3.1 官方链接（primary source）

| 类型 | 链接 |
| --- | --- |
| 官方文档站（索引） | <https://docs.tessl.io/> · <https://docs.tessl.io/llms.txt> |
| 核心概念 | <https://docs.tessl.io/introduction-to-tessl/core-concepts.md> |
| 配置文件参考 | <https://docs.tessl.io/reference/configuration.md> |
| 包管理器用法 | <https://docs.tessl.io/tutorials/using-tessl-as-a-package-manager.md> |
| 官方博客（SDD 愿景） | <https://tessl.io/blog/how-tessls-products-pioneer-spec-driven-development> |
| 官方博客（spec 长什么样） | <https://tessl.io/blog/tessl-launches-spec-driven-framework-and-registry> |
| Spec Registry | <https://tessl.io/registry> |
| 官方 SDD 方法论包（含 spec 格式原文） | <https://github.com/tesslio/spec-driven-development-tile> |
| spec 格式原文 | <https://raw.githubusercontent.com/tesslio/spec-driven-development-tile/main/docs/spec-format.md> |
| spec 风格指南原文 | <https://raw.githubusercontent.com/tesslio/spec-driven-development-tile/main/docs/spec-styleguide.md> |

**重要现状提示**：`docs.tessl.io/introduction-to-tessl/quick-start-guide-spec-registry` 与 `quick-start-guide-tessl-framework` 已 404；Tessl 文档站已改版为「agentic development 平台」（skills / plugins / registry / evals / observability），Core concepts 里已不再出现 "spec" 一词。**spec 这条产品线属于「框架」侧能力，官方称长期处于 closed beta**（Spec Registry 开放 beta、Tessl Framework closed beta）。引用时必须注明这是 beta 形态，不能当成稳定平台能力。

### 3.2 定位与流程

Tessl 的核心主张是 **spec-as-source（规格即源码）**：官方定义 SDD 为 `specs — not code — are the primary artifact. Specs describe intent in structured, testable language, and agents generate code to match them`（转引自 Böckeler 对官方文档的引用：<https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html>）。它是本次调研中唯一明确追求 spec-anchored 乃至 spec-as-source 的框架。

Tessl 用**两层资产**落地：

- **Spec Registry（规格注册表）**：收录 10,000+ 条 Usage Spec，让 agent 正确使用开源库，每条与所描述的库版本对齐；也支持团队发布自己的 spec pack 描述内部技术栈/库/API/策略。
- **Tessl Framework（框架）**：建三类资源——**Plans**（动手前先写行动计划，可审可改，执行中持续更新作为审计线索）、**Specs**（编码*之前*先写清意图）、**Tests**（给 spec 挂测试做回归护栏）。

方法论包的四步流程（原文）：`REQUIREMENT GATHERING`（读既有 spec、找歧义、**一次问一个问题**地访谈、写/改 spec）→ `STAKEHOLDER APPROVAL`（批准后才实现）→ `IMPLEMENTATION`（按已批准 spec 构建、创建与需求挂钩的测试、遵循 spec 中定义的 targets）→ `REVIEW`（核对需求满足、把新发现的需求回写 spec、确保测试被 spec 链接）。

执行层面靠 **MCP 工具 + steering 规则**，文件装进 `.tessl/` 目录，README 原文：`No special commands. No annotations. No framework.`

Registry 的发布/发现/复用方式：Tessl 把 agent 上下文当 npm/pip 管（`Tessl manages agent context the way npm or pip manages code dependencies.`）；发现靠语义搜索；安装支持 registry 名 / GitHub 仓库 / 本地目录三种来源；依赖写入 `tessl.json`，主版本默认 hold 住直到 `--force`；发布侧 `tessl skill publish --workspace <ws> [--public] [--bump patch|minor|major]`，**首次发布默认私有**。复用的关键是分层组合，README 原文：`Now your agent knows how to work (spec-driven methodology) and what tools to use correctly (Quarkus APIs). This prevents both process chaos and API hallucination.`

### 3.3 文档清单与各自职责

方法论包自身的目录职责（官方表格原文）：

| 类型 | 名称 | 职责 |
| --- | --- | --- |
| Skill | `requirement-gathering` | 写代码前访谈干系人、澄清模糊需求 |
| Skill | `spec-writer` | 从已澄清需求创建/更新 `.spec.md` |
| Skill | `spec-verification` | 验证实现与测试仍与 spec 同步 |
| Skill | `work-review` | 按已批准 spec 审查完成的工作 |
| Rule | `spec-before-code`（alwaysApply: Yes） | 没有已批准 spec 绝不开始实现 |
| Rule | `one-question-at-a-time`（alwaysApply: Yes） | 需求访谈每条消息只问一个问题 |
| Rule | `spec-format-compliance`（alwaysApply: No） | 确保 `.spec.md` 符合格式要求 |
| Docs | `docs/spec-format.md` | spec 文件组织方式：YAML frontmatter、targets、`[@test]` 链接 |
| Docs | `docs/spec-styleguide.md` | 写清晰可维护 spec 的最佳实践 |
| Script | `scripts/validate-specs.sh` | 校验 `.spec.md` 有必需 frontmatter 与结构 |
| Script | `scripts/check-spec-links.sh` | 校验 `[@test]` 链接与 targets 指向真实文件 |
| Evals | 9 个 scenario | 覆盖 spec 撰写、需求缺口分析、漂移检测、重构后失同步、「应绕过完整流程的琐碎改动」等 |

Tessl 平台侧的目录结构（`docs.tessl.io/reference/configuration.md` 原文）：

```text
.tessl/
|-- .gitignore                  # Ignores plugins/ and RULES.md (in managed mode)
|-- plugins/                      # Downloaded plugins
|   `-- workspace/
|       `-- plugin-name/
|           |-- .tessl-plugin/plugin.json
|           |-- evals
|           |-- rules/           # Rule files
|           `-- skills/          # Skill files
|               `-- skill-name/
|                   `-- SKILL.md
`-- RULES.md                    # Generated rules for agents (not committed to git)
```

### 3.4 模板/结构原文摘录

**（1）spec 文件骨架——frontmatter 字段清单**（`docs/spec-format.md` 原文）：

```markdown
---
name: Database Architecture
description: Key design patterns used across our data models
targets:
  - ../src/models/**/*.py
---
```

字段语义原文：`name` 人类可读特性名；`description` 一行摘要；`targets` 该 spec 描述的相对文件路径或 glob 列表，**`Required: All specs must have at least one target.`**

**（2）完整 spec 文档骨架**（官方样例 `<calculator.spec.md>`）：

```markdown
---
name: Calculator
description: Functional requirements for the calculator module
targets:
  - ../src/calculator.py
---

# Calculator

Performs basic arithmetic operations to two digits of precision.

```python
def add(a: int, b: int) -> int: ...
def subtract(a: int, b: int) -> int: ...
def multiply(a: int, b: int) -> int: ...
def divide(a: int, b: int) -> float: ...
```

`[@test] ../tests/calculator/test_basic_arithmetic.py`

## Error handling

- Division by zero should return `Nan`
  `[@test] ../tests/calculator/test_divide_by_zero.py`
- Non-numeric input should raise `TypeError`
  `[@test] ../tests/calculator/test_invalid_input_type.py`
```

即固定骨架为：**YAML frontmatter（3 字段）→ 一个 API 契约代码块 → `[@test]` 链接 → 按功能域分 `##` 小节 → 每条需求一个 `[@test]`**。`spec-writer` skill 要求 `Start with an API contract code block if there's a public interface`、`One spec per logical unit of functionality`、spec 落在项目 `specs/` 目录。

**（3）规则文件的 frontmatter 骨架**（`rules/spec-format-compliance.md` 原文）：

```markdown
---
alwaysApply: false
description: |
  Spec file formatting requirements. Use when creating, editing, or reviewing .spec.md files
  to ensure they follow the required format with YAML frontmatter, targets, and test links.
---

# Spec Format Compliance

## Required elements

1. **File extension**: `.spec.md`
2. **YAML frontmatter** with:
   - `name`: Human-readable feature name
   - `description`: One-line summary
   - `targets`: At least one relative path or glob pattern
3. **`[@test]` links** placed next to the requirements they verify

## Structural rules

- One spec per logical unit of functionality
- Specs live in the project's `specs/` directory
- Targets use relative paths from the spec file location
- Test links use relative paths from the spec file location
```

**（4）spec 的「三段式」结构与四个标记**（框架侧）。官方博客原文：`a typical Tessl spec has three parts: a description of the software component, a list of capabilities with linked tests, and an API showing how to use it`。四个关键标记：

- `[@generate](./src/index.ts)`：告诉 Tessl 从该 spec 生成代码到该文件；`@describe` 表示该 spec 描述既有代码而非生成。
- `- It adds two numbers together [@test](../tests/add.test.ts)`：自然语言能力 + 链接到验证它的测试。
- `ts { .api } export function add(a: number, b: number): number;`：定义组件公开 API。
- `[@use](./big-int.spec.md)`：导入其他 spec，在本 spec 内复用其功能。

**（5）`tile.json` 清单骨架**（旧格式原文；新版为 `.tessl-plugin/plugin.json`，官方提供 tile→plugin 迁移文档）：

```json
{
  "name": "tessl-labs/spec-driven-development",
  "version": "2.0.1",
  "summary": "Spec-driven workflow covering requirement gathering, spec authoring, implementation review, and verification — with skills, rules, and evaluation scenarios.",
  "private": false,
  "docs": "docs/index.md",
  "skills": {
    "requirement-gathering": { "path": "skills/requirement-gathering/SKILL.md" },
    "spec-writer": { "path": "skills/spec-writer/SKILL.md" },
    "spec-verification": { "path": "skills/spec-verification/SKILL.md" },
    "work-review": { "path": "skills/work-review/SKILL.md" }
  },
  "steering": {
    "spec-before-code": { "rules": "rules/spec-before-code.md" },
    "one-question-at-a-time": { "rules": "rules/one-question-at-a-time.md" },
    "spec-format-compliance": { "rules": "rules/spec-format-compliance.md" }
  }
}
```

### 3.5 长度约定 / 实际样例长度

**官方没有任何字数或行数硬指标**，长度约定全是定性表述：

- `description`：`One-line summary`。
- 整体：`simple yet powerful`、`written in natural language`。
- API 契约要 `in a compact, scannable format`。
- 风格指南 5 条：在 test 链接周围补上下文文字；用标题组织相关需求；行为/边界/约束要具体；测试要细粒度且 `[@test]` 贴在它验证的需求旁边；保持 spec 与实现同步。

实际样例长度：官方 `calculator.spec.md` 约 **20 行**；`spec-writer` SKILL.md 里的 `Shopping Cart` 完整样例约 **40 行**（3 个 `##` 小节、9 条需求、9 个 `[@test]`）。**spec 与代码是 1:1 映射**，生成的代码头部会打上 `// GENERATED FROM SPEC - DO NOT EDIT`（Böckeler 实测记录）。注意该 1:1 是 2025-09 beta 期形态，作者称 Tessl 正在试验其他版本。

### 3.6 它解决什么问题、已知批评与局限

官方定位解决的问题：agent **不可靠且过度自信**（`claim to understand it, and rush to start coding`，然后很快道歉并声称修好但其实没有）；用开源库时**幻觉 API 与版本混淆**；代码库变大后 agent **reward seeking**、修一个坏三个。解法是让 spec 成为一等公民、成为产品长期意图的「长期记忆」。

已知批评与局限（多为独立第三方评测，来源权威——Thoughtworks Distinguished Engineer Birgitta Böckeler 的实测报告）：

- **spec-as-source 可能同时继承 MDD 与 LLM 的缺点**：作者把 spec-as-source 类比 MDD（模型驱动开发），怀疑最终会「同时拿到 MDD 和 LLM 的双重缺点：不灵活 + 不确定性」。
- **即便「一 spec 一文件」这种低抽象层，非确定性依然存在**：同一 spec 多次生成结果不同，只能靠反复加细节提升可重复性——`That process reminded me of some of the pitfalls and challenges of writing an unambiguous and complete specification.`
- **SDD 术语尚未收敛**：作者警告 "spec" 已出现 semantic diffusion，甚至有人把它当「详细 prompt」的同义词。
- **产品成熟度**：Tessl Framework 长期 closed beta；文档站已从 spec 叙事转向 skills/plugins 叙事（本调研实测旧页 404）。方法论当前公开可运行形态主要是 `spec-driven-development-tile`（2.0.1）。

**Tessl 自己文档化的局限（一手）**：① 官方承认静态指令会腐化——`static instructions quietly go stale`，所以治理重心从「写好一份 spec」转到「给上下文一个生命周期」（build / evaluate / distribute / keep up to date）。② 供应链风险：从公共源安装 skill `exposes you to new supply-chain and prompt-injection risk`，安全扫描发现只警告不阻断（`warning rather than blocking`）。③ skill 会 `sprawl into overlapping, drifting copies with no enforced standard`。这三点说明：即使走「文档即源码」这条路，**产出物自身的版本 / 安全 / 去重治理才是长期成本中心**。

### 3.7 对「让低智力模型照文档写代码」的适配性

Tessl **没有针对「低智力模型」的专门考虑**；其假设是「你的 agent 已经很强，只是缺上下文」（官方博客：`LLMs are intelligent, but we don't want them to reinvent everything`）。但结构上有若干对弱模型友好的机制：

- **格式机器可校验，不靠模型自觉**：`.spec.md` 扩展名、3 个必需 frontmatter 字段、每个 spec ≥1 个 target、`[@test]` 相对路径，且配套 `validate-specs.sh` 与 `check-spec-links.sh` 做确定性校验。**弱模型写错格式会被脚本抓住。**
- **规则可机械执行**：`spec-before-code`（alwaysApply: Yes）把「没批准不许写码」变成常驻上下文；`one-question-at-a-time` 把访谈拆成单步。单步、单问、单文件是典型降低单次推理复杂度的设计。
- **`targets` 把「改哪些文件」外化成显式清单**，弱模型不需要自己推断作用范围。
- **粒度极低**：spec↔代码 1:1，官方与第三方评测都指出这「probably reduces amount of steps and interpretations the LLM has to do, and therefore the chance of errors」。
- **反面证据**：Registry 的 Usage Spec（10,000+ 条）本质是为弱上下文准备的「库用法说明书」——官方明确指出 LLM 训练数据 `doesn't contain newer projects, poorly separates framework versions`，这正是弱模型最需要的外部知识。但**没有任何官方文本承诺「用便宜/小模型也能跑通 SDD 流程」**。

结论：Tessl 的设计**间接**对弱模型友好（可校验格式 + 极小粒度 + 显式 targets），但没有把「低智力模型」当作目标场景做专门工程。

---

## 4. AWS AI-DLC（AI-Driven Development Life Cycle）

### 4.1 官方链接（primary source）

| 类型 | 链接 |
| --- | --- |
| 方法论首发（AWS DevOps Blog） | <https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/> |
| 开源工作流（AWS DevOps Blog） | <https://aws.amazon.com/blogs/devops/open-sourcing-adaptive-workflows-for-ai-driven-development-life-cycle-ai-dlc/> |
| 逐步实战（AWS DevOps Blog） | <https://aws.amazon.com/blogs/devops/building-with-ai-dlc-using-amazon-q-developer/> |
| 官方开源仓库 | <https://github.com/awslabs/aidlc-workflows>（MIT-0，v2.9.0） |
| 方法定义论文 | <https://prod.d13rzhkk8cj2z0.amplifyapp.com/> |
| 仓库文档：导论 | <https://raw.githubusercontent.com/awslabs/aidlc-workflows/main/docs/guide/00-introduction.md> |
| 仓库文档：阶段与产物 | <https://raw.githubusercontent.com/awslabs/aidlc-workflows/main/docs/guide/04-phases-and-stages.md> · <https://raw.githubusercontent.com/awslabs/aidlc-workflows/main/docs/guide/14-artifacts-reference.md> |
| 仓库文档：工作流档位与深度 | <https://raw.githubusercontent.com/awslabs/aidlc-workflows/main/docs/guide/workflow-profiles.md> · <https://raw.githubusercontent.com/awslabs/aidlc-workflows/main/docs/guide/05-scopes-and-depth.md> |
| 仓库文档：agent 名册 | <https://raw.githubusercontent.com/awslabs/aidlc-workflows/main/docs/guide/06-agents.md> |
| 实战样例（完整 transcript） | <https://raw.githubusercontent.com/awslabs/aidlc-workflows/main/docs/guide/16-worked-examples.md> |
| 白皮书 PDF | <https://github.com/awslabs/aidlc-workflows/blob/main/assets/AI-DLC-Workflows-2.0-Specification.pdf> |

**重要文档漂移提示**：2025 年 AWS 博客描述的是 **v1 形态（3 阶段 Inception / Construction / Operations + `aidlc-docs/` 单目录）**；2026 年的 `awslabs/aidlc-workflows` v2.9.0 已演进为 **5 阶段 33 stage + `aidlc/spaces/<space>/intents/<YYMMDD>-<label>/` 记录目录**。引用时必须注明版本，否则会得出互相矛盾的「阶段划分」与「产物命名」结论。

### 4.2 定位与流程

**v1 定位**：AI-DLC 是 "AI-centric" 的方法论，两个维度——**AI Powered Execution with Human Oversight** 与 **Dynamic Team Collaboration**。核心心智模型是「AI 创建计划 → 提出澄清问题 → 拿到人类确认后才实现」，对每个 SDLC 活动快速重复。三阶段：**Inception**（Mob Elaboration：业务意图 → 需求/stories/units）→ **Construction**（Mob Construction：逻辑架构、领域模型、代码方案与测试）→ **Operations**。术语替换：sprint → **bolt**，epic → **Unit of Work**。

**v2 定位**（README 原文）：

```text
AI-DLC turns AI coding assistants into structured, verifiable software-delivery workflows.
One harness-neutral core runs natively in Claude Code, Kiro CLI, Kiro IDE, Codex CLI, Cursor,
opencode, and GitHub Copilot.

- 5 phases and 33 stages from initialization through operation
- 14 agents: 11 domain experts, 2 reviewers, and an adaptive composer
- 11 workflow profiles for features, bug fixes, infrastructure, security, proofs of concept, ...
- Human approval gates and source-bound review evidence
- 102-event audit trail plus persistent state, team knowledge, and learned rules
- The same deterministic engine across every supported harness
```

5 阶段 33 stage：Initialization（0.1–0.3）→ Ideation（1.1–1.7）→ Inception（2.1–2.9）→ Construction（3.1–3.7）→ Operation（4.1–4.7）。每个阶段边界跑 **verification gate** 做自动可追溯性检查（产物齐全、需求→story 映射完整、无孤儿产物），失败则报告并询问继续还是回退。

### 4.3 文档清单与各自职责

**没有单一「三个核心 artifact」**——这是与 `requirements.md / design.md / tasks.md` 式工具最大的结构差异。v1 目录是 `aidlc-docs/`；v2 的产物目录原文（节选）：

```text
aidlc/spaces/<space>/intents/<YYMMDD>-<label>/   # one record dir per intent
  aidlc-state.md                    # Workflow state (commit)
  audit/                            # Audit trail — per-clone shards (commit)
  .aidlc-engine/                    # Framework state (gitignore)
  runtime-graph.json                # Execution telemetry view (gitignore)

  verification/                     # Phase boundary checks (commit)
    phase-check-initialization.md ... phase-check-operation.md

  initialization/   workspace-scaffold/ workspace-detection/ state-init/
  ideation/         intent-capture/ market-research/ feasibility/ scope-definition/
                    team-formation/ rough-mockups/ approval-handoff/
  inception/        practices-discovery/ requirements-analysis/ user-stories/
                    refined-mockups/ domain-design/ units-generation/
                    contract-design/ delivery-planning/
  construction/     {unit-name}/ functional-design/ nfr-requirements/ nfr-design/
                    infrastructure-design/ code-generation/
                    build-and-test/ ci-pipeline/
  operation/        deployment-pipeline/ environment-provisioning/ deployment-execution/
                    observability-setup/ incident-response/ performance-validation/
                    feedback-optimization/
```

产物按阶段落位（节选）：

| Stage | Key Artifacts |
| --- | --- |
| 1.1 Intent Capture | `intent-capture-questions.md`、`intent-statement.md`、`stakeholder-map.md` |
| 1.4 Scope Definition | `scope-document.md`、`intent-backlog.md` |
| 1.7 Approval & Handoff | `initiative-brief.md`、`decision-log.md` |
| 2.1 Reverse Engineering | 9 个文件：`business-overview.md`、`architecture.md`、`code-structure.md`、`api-documentation.md`、`component-inventory.md`、`technology-stack.md`、`dependencies.md`、`code-quality-assessment.md`、`reverse-engineering-timestamp.md` |
| 2.3 Requirements Analysis | `requirements.md` |
| 2.4 User Stories | `stories.md`、`personas.md` |
| 2.6 Domain Design | `components.md`、`decisions.md`（ADR 日志） |
| 2.7 Units Generation | `unit-of-work.md`、`unit-of-work-dependency.md`（DAG）、`unit-of-work-story-map.md` |
| 2.9 Delivery Planning | `bolt-plan.md`、`team-allocation.md`、`risk-and-sequencing-rationale.md`、`external-dependency-map.md` |
| 3.5 Code Generation | `code-generation-plan.md`、`code-generation-questions.md`、`unit-test-instructions.md`、`code-summary.md`、`traceability.json`、`source-manifest.json` |
| 3.6 Build and Test | `build-instructions.md`、`test-results.md` |

三条重要边界规则（原文）：

1. **代码不进 `aidlc/` 树**——`The aidlc/ tree holds only method, state, audit, and artifacts — never application code.` 生成的代码落在 workspace 的 code repos。
2. **团队知识不进 intent 记录目录**——放 space 级 `aidlc/spaces/<space>/knowledge/`，跨 intent 累积。
3. **Reverse Engineering 的 9 份产物也不进 intent 记录目录**——放 space 级 `codekb/<repo>/`，一个仓库一份共享 store。

### 4.4 模板/结构原文摘录

**（1）question 文件的固定形状**。每个收集用户输入的 stage 都产出一个 `{stage-name}-questions.md`。原文规则：`Questions use lettered options (A-E) plus a mandatory "X. Other (please specify)" option, with [Answer]: tags for recording responses.` 回答方式三选一：**Guide Me**（交互式，每批最多 4 个问题）/ **I'll Edit the File** / **Chat**，可中途切换，**问题文件始终是唯一真相来源**。真实样例：

```markdown
## Q1: Bug Severity Classification
How severe is this bug for your users?
A. Critical — causes data loss or security exposure
B. High — blocks a core workflow for affected users
C. Medium — degraded experience but workaround exists
D. Low — cosmetic or minor inconvenience
X. Other (please specify)

[Answer]:
```

**（2）带来源标记的产物正文**（每条断言必须带 `[desc]` / `[Q1]` 这类**内联来源标记**）：

```markdown
## Sources

- [desc] Initial description: "A notification service for our task management app..."
- [scope] Workflow-selected scope: `feature`.

## Q1. Which notification channels are in scope?
A. In-app only
B. In-app + email
C. In-app + email + push
D. In-app + email + push + SMS
X. Other

[Answer]: B. In-app + email
```

```markdown
## Target Customer

Task-management users receiving assignment, due-date, or comment events. [desc]

## Notification Channels

In-app notifications and optional email digests are in scope. [Q1]

## Assumptions & Open Questions

None.
```

无支撑内容要么转为追问、要么留在 `## Assumptions & Open Questions` 且需显式接受（配套 sensor：`aidlc-claim-sources.md`）。

**（3）Code Generation 计划文件**（v1 博客原文）：计划写在 `{unit-name}-code-generation-plan.md`，**`complete with check boxes`**，按序号拆成显式步骤（业务逻辑、API 层、数据层、测试、文档、部署文件），执行时勾选并保证 story 可追溯。

**（4）workflow profile 表**（11 档，节选）：

| Workflow profile | Best for | Stages | Depth | Test strategy |
| --- | --- | --- | --- | --- |
| Classic | V1-style ceremony，止于 Build and Test | 18 / 33 | Standard | Standard |
| Express | 最轻的 requirements→code→test 路径 | 10 / 33 | Minimal | Minimal |
| Feature | 完整生命周期的生产特性 | 33 / 33 | Standard | Standard |
| Enterprise | 受监管/高保证、全可追溯 | 33 / 33 | Comprehensive | Comprehensive |
| MVP | 真实首个产品增量，不含 Operation | 23 / 33 | Standard | Standard |
| Proof of concept | 验证可行性、最小有用路径 | 8 / 33 | Minimal | Minimal |
| Bugfix | 已知缺陷的聚焦修复 + 回归测试 | 9 / 33 | Minimal | Minimal |
| Refactor | 不改产品行为的改进 | 10 / 33 | Minimal | Minimal |

**（5）自定义 scope 的哨兵结构**（`Everything above the sentinel comment is yours to edit … Everything between the sentinels is generated`）：

````markdown
---
name: my-lean-feature
depth: Standard
keywords: []
---

# my-lean-feature

Whatever you want to write, including a "## Stage Grid" heading of your own.

<!-- BEGIN aidlc composed-scope-grid: generated by `aidlc engine graph compile` — reshape the plan through /aidlc compose, not by editing here -->

```json
{ "stages": { "intent-capture": "EXECUTE", "units-generation": "SKIP" } }
```

<!-- END aidlc composed-scope-grid -->
````

### 4.5 长度约定 / 实际样例长度

**深度层级即长度约定，官方给了明确量化口径**（`05-scopes-and-depth.md` 原文）：

```text
| Depth | Artifact Detail | When to Use |
| Minimal | Core essentials only. Short documents, key decisions, minimal supporting analysis. | Quick fixes, patches, proofs of concept |
| Standard | Balanced detail. Complete requirements, architecture decisions with rationale, thorough test plans. | Most features and MVPs |
| Comprehensive | Full enterprise detail. Exhaustive requirements, compliance matrices, detailed NFR specifications, complete audit documentation. | Regulated features, enterprise deployments |
```

`How depth affects stages` 原文：

```text
- **Minimal:** 1-2 page artifact, key decisions only, skip optional sections
- **Standard:** Complete artifact, all required sections, concise rationale
- **Comprehensive:** Expanded artifact, optional sections included, detailed justification, compliance cross-references
```

**最低档是「1-2 页」**——这是本调研中唯一一条带页面量级的官方产物长度约定。测试量也量化（三档 test strategy）：Minimal 走 "Nyquist model"，每个需求 1 个测试 + 每组件至少 1 个 happy-path，典型项目 **~5–15 个测试**；Standard 每组件 5–8 个测试（~75% unit / ~20% integration / ~5% E2E）；Comprehensive 每组件 10–15 个测试。三档均为 **soft guideline**（`Soft guideline — the agent can exceed when safety-critical context demands it`）。

实际样例长度：官方 bugfix walkthrough 的 9-stage 修复任务产出约 **10 个 markdown 文件**；feature walkthrough（33 stage）里单个 Unit 的规模是 **3 个源文件 + 4 个测试文件** 量级，全量测试 47 个通过、覆盖率 78%。

### 4.6 解决什么问题、已知批评与局限

官方定位解决的三类问题：① **one-size-fits-all workflows**（每个项目被迫走同一套刚性步骤）；② **workflow stages 缺乏弹性深度**；③ **工具过度自动化**，把人从关键验证/监督职责上挤走，造成 `process atrophy`。对应 **Principle 10（No Hard-Wired, Opinionated SDLC Workflows）**。解法是 **workflow scaffolds**（Amazon Q Rules / Kiro Steering Files）+ 每个决策门嵌人类审批 + 端到端可追溯。

已知局限（一手）：

- **强烈依赖强模型**。README 原文：`AI-DLC works best with capable reasoning models. The current recommended model is Claude Opus 4.8.` 这是官方对「弱模型」问题最直接的立场表露——不是适配弱模型，而是**要求强模型**。
- **单仓库/单执行假设**。issue #126《Provide namespaced organization for aidlc-docs to support multiple intent executions》提出：同项目跑第二次 intent、或 monorepo 并行跑两个组件时产物如何隔离？状态 Closed；v2 目录确实加了 `spaces/<space>/intents/<YYMMDD>-<label>/` 前缀，可视为回应。来源：<https://github.com/awslabs/aidlc-workflows/issues/126>
- **流程本身很重，token/上下文效率被显式工程化**。Amazon Q 实战文原文解释了为什么只把 `core-workflow.md` 放常驻 `.amazonq/rules`、其余规则动态加载：`This approach conserves Amazon Q's context window and token usage by retaining only the necessary information within the context at any given time`。
- **非确定性被官方承认**：`You'll also notice the probabilistic nature of large language models (LLMs), as the questions and artifacts generated by them will vary from one run to another for the same problem statement.`
- **人工门数量可观**：`feature` 33 stage ≈ **29 个 gate**。
- **reviewer 不阻断**，只出 verdict READY / NOT-READY 供人裁决：`the reviewer never blocks — the human always has final say.`
- **文档漂移**：2025 博客（3 阶段、`aidlc-docs/`）与 2026 仓库（5 阶段 33 stage、`aidlc/spaces/...`）不一致；大量第三方概述（如 Medium 文章）已过期，属二手来源。

### 4.7 对「让低智力模型照文档写代码」的适配性

AI-DLC **同样没有「低智力模型」专门适配章节，而且立场相反**——README 明写推荐 Claude Opus 4.8。不过它在**结构层面**有几处比 Tessl 更强的「托底」设计：

- **确定性引擎接管路由**：`A deterministic engine decides what happens next; the conductor carries it out`。下一步走哪个 stage、何时停止是引擎职责，弱模型只负责「把当前 stage 跑好」。这是把**流程控制权从模型手里拿走**。
- **不假设、必须先问**：`One rule instructed Amazon Q to avoid making assumptions on the user's behalf and instead ask clarifying questions. Since LLMs tend to make assumptions and rush towards outcomes, they must be explicitly instructed to align with the engineering rigor of the AI-DLC methodology.` 对策是强制提问，而非降低文档难度。
- **产物结构收敛为填空式模板**：question 文件是「A–E + 必选 X. Other + `[Answer]:`」的固定形状；Code Generation 计划是「numbered plan + check boxes」；自定义 scope 是「哨兵注释之间的生成区」。弱模型只是往固定槽位填内容。
- **确定性校验器兜底**：6 个 deterministic sensor（`aidlc-claim-sources`、`aidlc-required-sections`、`aidlc-upstream-coverage`、`aidlc-traceability`、`aidlc-linter`、`aidlc-type-check`），全部 **advisory**。弱模型漏章节、断追溯链会被**报出来**，但不阻断推进。
- **reviewer agent 是模型外的第二双眼睛**：`aidlc-product-lead-agent` 与 `aidlc-architecture-reviewer-agent` 以**独立 sub-agent** 运行，只读产物、不读建造者的 `memory.md` 或 plan（`it forms independent judgment`），bounded review loop 默认最多 2 轮，reviewer 有硬性 `maxTurns: 60`，超预算记为 NOT-READY 并在门上显示 `review did not complete within its turn budget`。
- **模型分层（`judgment` / `templated` tier）**：8 个高判断 agent 走 `judgment` tier，只有 delivery / pipeline-deploy / operations 走 `templated` tier；reviewer tier 在 Claude Code、Codex、opencode 上**固定 pin 一个中型模型 + medium effort**。AI-DLC 的模型策略是「**按 agent 职责分层**」，而不是「降低文档要求以适配弱模型」。
- **深度档位是给「任务难度」而非「模型智力」设计的**：Minimal / Standard / Comprehensive 的触发依据是任务风险与复杂度，官方从未把 depth 与模型能力挂钩。弱模型跑 `poc`（8 stage / Minimal / 1-2 页产物）在文档负担上更可行，但这是**任务档位红利，不是模型适配**。

一句话结论：**AI-DLC 对弱模型的答案是「把流程和校验变成确定性的，把判断力留给强模型和人」**；它不承诺弱模型能跑通，也不为弱模型简化文档。

### 4.8 Tessl 与 AI-DLC 横向对照

| 维度 | Tessl | AI-DLC |
| --- | --- | --- |
| 文档数量 | 极少（一份 spec ≈ 20–40 行，1 spec ↔ 1 代码文件） | 极多（33 stage，单任务 10+ 文件，`feature` 约 29 个 gate） |
| 模板强制度 | 强：3 个必填 frontmatter 字段 + 强制 ≥1 target + 脚本校验 | 强：question 文件 A–E/X 形状、计划 check box、哨兵生成区 |
| 校验机制 | `validate-specs.sh` + `check-spec-links.sh`（确定性） | 6 个 advisory sensor + 5 个 phase-check 文件（确定性） |
| 质量裁决者 | 人（stakeholder approval 门）+ work-review skill | 独立 reviewer sub-agent（独立上下文、不读建造者笔记）+ 人最终否决 |
| 对弱模型的立场 | 未表态；结构上间接友好 | 明确要求强模型（推荐 Opus 4.8）；靠确定性引擎 + 独立 reviewer 托底 |
| 产物与代码关系 | spec 可为源码，1:1 映射，`// GENERATED FROM SPEC - DO NOT EDIT` | 代码与文档**严格分离**：`aidlc/` 树 `never application code` |

## 5. 厂商官方立场：Anthropic / OpenAI / Google

> 这一节回答的是：三大模型厂商自己在「规格驱动 / 上下文工程」上推荐什么文档结构、给不给长度约定、有没有为弱执行者做过设计。

### 5.1 Anthropic

#### 官方链接

- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)（2025-09-29）
- [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices)
- [Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents)（2025-09-11）
- [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)（2025-06-13）
- [CLAUDE.md / memory 文档](https://code.claude.com/docs/en/memory)、[Plan mode 文档](https://code.claude.com/docs/en/permission-modes#analyze-before-you-edit-with-plan-mode)

#### 定位与推荐工作流

官方叙事是 **context engineering**（上下文工程），把它定位为 prompt engineering 的自然演进：不再纠结措辞，而是回答「什么样的上下文配置最可能产生期望行为」，最终目标是 `find the smallest set of high-signal tokens that maximize the likelihood of your desired outcome`。取用策略上，Claude Code 走混合式：`CLAUDE.md` 在会话开始被 `naively dropped into context`（预先注入），而 `glob` / `grep` 等原语让模型按需即时取文件。系统提示词被要求落在两个失败极端之间的 `right altitude`——既不是硬编码 if-else 的脆弱逻辑，也不是含糊到假定了共享上下文的高层套话，并建议用 `<background_information>`、`<instructions>`、`## Tool guidance` 之类分节划界。

编码场景落地为四阶段工作流 **Explore → Plan → Implement → Commit**：先在 plan mode（`Shift+Tab` 或 `claude --permission-mode plan`）只读探索代码与约束，再产出详细实施计划并用 `Ctrl+G` 在编辑器里改，人工批准后才允许写代码。官方同时明确 plan mode 有开销：改动能用一句话描述 diff、或范围清晰的小修应跳过计划；只有「方案不确定、跨多文件、不熟悉该代码」时才值得先计划。另一条被反复强调的是**可验证性**：给 Claude 一个能跑出 pass/fail 的检查（测试、构建、lint、截图对比），循环才能自己闭合。

#### 文档清单与职责

| 文档 | 职责与要点 | 来源 |
| --- | --- | --- |
| `CLAUDE.md` | 每会话开头注入的持久指令：构建/测试命令、代码风格、工作流规则、仓库礼仪 | [memory](https://code.claude.com/docs/en/memory) |
| `.claude/rules/*.md` | 用 `paths` frontmatter 做路径域规则，只在命中文件时加载，减少常驻噪音 | 同上 |
| `AGENTS.md` | 无 `CLAUDE.md` 时可被直接读取，或由 `CLAUDE.md` 里的 `@AGENTS.md` 导入，便于多工具共用一份 | 同上 |
| plan（plan mode 内产出） | 只读阶段产出的实施方案，人工批准前编辑被阻断 | [permission-modes](https://code.claude.com/docs/en/permission-modes) |
| `SPEC.md` | 大特性先由 Claude 反向访谈用户，把完整规格落盘；随后**开新会话**执行，获得干净上下文 | [best practices](https://code.claude.com/docs/en/best-practices) |
| `SKILL.md` / 子代理定义 | 按需加载的领域知识与可复用流程；子代理在独立上下文做调研与对抗性复核 | 同上 |

#### 模板/结构原文摘录

官方给出的 `CLAUDE.md` 骨架，强调短、可读、只写 Claude 推不出来的东西：

```markdown
# Code style
- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible (eg. import { foo } from 'bar')
# Workflow
- Be sure to typecheck when you're done making a series of code changes
- Prefer running single tests, and not the whole test suite, for performance
```

生成规格的官方提示词：

```text
I want to build [brief description]. Interview me in detail using the AskUserQuestion tool.
... Keep interviewing until we've covered everything, then write a complete spec to SPEC.md.
```

规格写作标准原文：`The most useful specs are **self-contained**: they name the files and interfaces involved, state what is out of scope, and end with an end-to-end verification step that proves the feature works.`

#### 长度约定

- `CLAUDE.md`：**target under 200 lines per file**；官方解释「更长文件消耗更多上下文并降低遵从度」，超过 4 MiB 会被直接跳过；拆分 `@` 导入只便于组织、不减少上下文占用。
- 自动记忆索引 `MEMORY.md`：每次会话只加载**前 200 行或 25KB**，超出被丢弃。
- 工具响应：Claude Code 默认把工具返回截断到 **25,000 tokens**。
- plan 文档与 `SPEC.md`：**未找到**行数或字数约定，只给了「自包含 + 明示 out of scope + 端到端验证」三条质量要求。

#### 解决的问题与局限

它要解决两个具体病症：上下文是有限资源、随 token 增长出现 **context rot**（注意力预算被摊薄，且该现象在所有模型上都存在）；以及「让 Claude 直接开写会写错问题」。针对超长任务，官方给出三种绕过上下文窗口的手段：**compaction**（接近上限时摘要后重开窗口，保留架构决策、未解 bug 与实现细节，附带最近访问的 5 个文件）、**结构化笔记**（待办清单、`NOTES.md`，把进度落到窗口之外按需读回）、**子代理架构**（子代理可烧掉数万 token 探索，只回传约 **1,000–2,000 token** 的蒸馏摘要）。

局限由官方自陈：`CLAUDE.md` 是上下文而非强制配置，**不保证遵从**，含糊或互相冲突的指令会被任意取舍；plan mode 增加开销；`over-specified CLAUDE.md` 被列为典型失败模式——文件太长时重要规则被噪音淹没；多代理架构成本高（约为普通对话的 **15× token**）。

#### 对低智力模型的适配性

官方没有「为弱模型写更明确计划」的专章，但有三处等价论述：

1. 结论段落直接写 `**smarter models require less prescriptive engineering**`——即规定性强度应随模型能力反向调节；反过来说，弱执行者需要更预设的脚手架。
2. 多代理篇要求给子代理的任务描述必须包含 `an objective, an output format, guidance on the tools and sources to use, and clear task boundaries`，并要求把「投入力度」写成显式规则（简单事实核查 1 个代理 3–10 次工具调用；复杂研究 >10 个子代理），因为 `agents struggle to judge appropriate effort`。
3. 指令必须 `concrete enough to verify`：用 `Use 2-space indentation` 而不是 `Format code properly`；用 ``Run `npm test` before committing`` 而不是 `Test your changes`——这正是把执行者默认当作不会自行推断的对象。

### 5.2 OpenAI

#### 官方链接

- [Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/)（2026-02-11，Ryan Lopopolo）
- [Using PLANS.md for multi-hour problem solving](https://developers.openai.com/cookbook/articles/codex_exec_plans)（ExecPlan 官方模板）
- [Custom instructions with AGENTS.md](https://learn.chatgpt.com/codex/agent-configuration/agents-md)
- <https://agents.md/>（开放格式，现由 Linux Foundation 下的 Agentic AI Foundation 托管）

> 抓取说明：`openai.com/index/harness-engineering/` 需 JS 渲染、抓取受限，正文经逐字镜像核对（[镜像](https://github.com/celesteanders/harness/blob/main/docs/research/260211_openai_harness_engineering_codex.md)），引用句与官方检索摘要一致。

#### 定位与推荐工作流

Harness engineering 的核心口号是 `**Humans steer. Agents execute.**`：人类的工作从写代码转为设计环境、指定意图、搭反馈回路。团队用五个多月、零行手写代码产出约百万行的内部产品（约 1500 个 PR，3 名工程师起步，平均每人每天 3.5 个 PR）。失败时的固定动作不是「再试一次」，而是追问「缺了哪项能力，如何让它对 agent 既可读又可强制」。反馈回路包括：每个 git worktree 可独立启动应用、把 Chrome DevTools Protocol 接入 agent runtime（DOM 快照、截图、导航）、为每个 worktree 提供临时可观测性栈（LogQL/PromQL），因此「确保服务启动在 800ms 内完成」这类提示词才变得可执行。仓库被当作智能体唯一的现实：`anything it can't access in-context while running effectively doesn't exist`，因此 Google Docs、Slack 讨论、口口相传的知识都必须编码成仓内 markdown。规划被提升为一等工件：小改动临时轻量计划，复杂工作写成带 progress 与 decision log 的 execution plan 并入库，active / completed / tech-debt 三处同仓版本化，配合小入口 + 逐层指路的 **progressive disclosure**。

#### 文档清单与职责与模板原文

`AGENTS.md` 是入口地图而非百科；`PLANS.md` 定义 ExecPlan 规范；`docs/` 是 system of record：

```text
AGENTS.md
ARCHITECTURE.md
docs/
├── design-docs/        (index.md, core-beliefs.md)
├── exec-plans/         (active/, completed/, tech-debt-tracker.md)
├── generated/          (db-schema.md)
├── product-specs/      (index.md, new-user-onboarding.md)
├── references/         (design-system-reference-llms.txt ...)
├── DESIGN.md  FRONTEND.md  PLANS.md  PRODUCT_SENSE.md
└── QUALITY_SCORE.md  RELIABILITY.md  SECURITY.md
```

ExecPlan 的必备章节骨架（原文）：

```markdown
# <Short, action-oriented description>
## Purpose / Big Picture
## Progress
- [x] (2025-10-01 13:00Z) Example completed step.
- [ ] Example incomplete step.
## Surprises & Discoveries
- Observation: …   Evidence: …
## Decision Log
- Decision: …  Rationale: …  Date/Author: …
## Outcomes & Retrospective
## Context and Orientation
## Plan of Work
## Concrete Steps
## Validation and Acceptance
## Idempotence and Recovery
## Artifacts and Notes
## Interfaces and Dependencies
```

文档还规定：整份 ExecPlan 必须是**一个** ` ```md ` 围栏块，内部不得再嵌套围栏；正文以散文为主，禁止清单、表格与长枚举（只有 `Progress` 允许且必须用复选框）；每个术语若非常识必须当场定义；里程碑要「goal, work, result, proof」地讲成故事。

#### 长度约定

- Harness：`AGENTS.md` **roughly 100 lines**，官方原话是 `give Codex a map, not a 1,000-page instruction manual`。
- Codex 文档：多层 `AGENTS.md` 由根向当前目录拼接，累计达到 `project_doc_max_bytes`（默认 **32 KiB**）即停止追加；接近上限时应拆到嵌套目录。
- ExecPlan：**未找到**行数上限，用「自包含」替代长度约束；官方称该模板曾让 Codex `work for more than seven hours from a single prompt`。
- 配套机制：`AGENTS.override.md` 可临时覆盖全局或目录级指令；`project_doc_fallback_filenames` 可把 `TEAM_GUIDE.md` 之类的既有文件名纳入发现列表；官方建议在离代码最近的 `AGENTS.md` 里加 `## Code Review Rules` 段。

#### 解决的问题与局限

解决的是多小时、跨会话任务的目标漂移，以及「知识停留在人和聊天工具里」的问题。官方也直陈单文件路线的四种失败：挤占上下文预算；`**Too much guidance becomes non-guidance**`（什么都重要就等于什么都不重要，代理退化为局部模式匹配）；`**It rots instantly**`（巨石手册变成无人维护的死规则墓地）；难以机械校验而被漂移拖垮。更根本的局限是模式复制：`**Codex replicates patterns that already exist in the repository—even uneven or suboptimal ones. Over time, this inevitably leads to drift.**` 团队为此一度每周花 20% 时间手动清 "AI slop"。作者在 "What we're still learning" 里承认：全代理仓库多年尺度上的架构一致性如何演进仍未知，那套端到端自治高度依赖其仓库特有的结构与工具，`**should not be assumed to generalize**`。

#### 对低智力模型的适配性（三家中最直接）

ExecPlan 规范原文要求：

- `Treat the reader as a **complete beginner** to this repository: they have only the current working tree and the single ExecPlan file you provide. There is no memory of prior plans and no external context.`
- `Every ExecPlan must enable a **complete novice** to implement the feature end-to-end without prior knowledge of this repo.`
- `The agent executing your plan … cannot infer what you meant from earlier milestones. **Repeat any assumption you rely on.** Do not point to external blogs or docs; if knowledge is required, **embed it in the plan itself** in your own words. … **Do not outsource key decisions to the reader.**`
- 验收只能写成人类可观察的行为（如「启动服务后访问 <http://localhost:8080/health> 返回 HTTP 200 与 body OK」），而不能写成内部属性（如「added a HealthCheck struct」）。

工程侧同样围绕弱执行者设计：自定义 lint 的错误信息直接把**修复指令注入模型上下文**；用刚性分层（Types → Config → Repo → Service → Runtime → UI）与 structural tests 把边界机械化，理由是 `Agents are most effective in environments with strict boundaries and predictable structure`；taste invariants 一旦编码即全局生效（`once encoded, they apply everywhere at once`）。

### 5.3 Google

#### 官方链接

- [Conductor: Introducing context-driven development for Gemini CLI](https://developers.googleblog.com/conductor-introducing-context-driven-development-for-gemini-cli/)（2025-12-17）
- [Evolving Spec-Driven Development: Conductor Now Supports Antigravity](https://developers.googleblog.com/evolving-spec-driven-development-conductor-now-supports-antigravity/)（2026-07-16）
- [Plan mode is now available in Gemini CLI](https://developers.googleblog.com/plan-mode-now-available-in-gemini-cli/)（2026-03-11）
- [Gemini CLI Plan Mode 文档](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/plan-mode.md)、[GEMINI.md 文档](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md)
- [Conductor 仓库](https://github.com/gemini-cli-extensions/conductor)、[Jules Getting started](https://jules.google/docs/)

#### 定位与推荐工作流

Google 官方把 SDD 命名为 **context-driven development**，口号 `Measure twice, code once`：把项目上下文从易失的聊天记录搬进仓库，让仓库成为 single source of truth。他们特别强调 brownfield 场景——既有代码库的历史与架构恰是 AI 工具最容易失手之处——因此 setup 会以交互式会话产出架构、规范与目标的基线文档。生命周期为 **Context → Spec & Plan → Implement**：先 `/conductor:setup` 一次建立产品、产品规范、技术栈与工作流四类上下文，再 `/conductor:new-track` 为一个 feature/bug 生成 `spec.md` 与 `plan.md`，人工批准后 `/conductor:implement` 逐条勾选执行；期间可用 `status` / `review` / `revert` 查看、复核、按 track/phase/task 回滚。

Gemini CLI 侧的 plan mode 是它的执行环境：只读工具集（`read_file`、`grep_search`、`glob` 及只读 MCP），用 `ask_user` 澄清需求而非猜测，写权限仅限 plans 目录下的 `.md`；计划文件可用 `Ctrl+X` 打开编辑，用户可直接改步骤或留内联评论，CLI 会检测改动并重出计划。2026-07 起 Conductor 从扩展改为 plugin，兼容 Antigravity 与 Claude Code。Jules 同样是「先出计划、人工批准后才改代码」，并自动读取仓库根的 `AGENTS.md`。

#### 文档清单与职责与模板原文

| 文档 | 职责与要点 |
| --- | --- |
| `conductor/index.md` | 根索引，指向全部上下文文档；协议第一步必须校验其链接文件是否齐全 |
| `conductor/product.md` / `product-guidelines.md` | 用户、产品目标、高层特性 / 文案、品牌、视觉规范 |
| `conductor/tech-stack.md` | 语言、数据库、框架；实现若偏离必须先改此文件并留日期说明 |
| `conductor/workflow.md` | 团队流程模板：TDD、覆盖率、提交与验证协议（可自定义） |
| `conductor/tracks.md` | track 注册表，记录每个 track 的状态与链接 |
| `conductor/tracks/<id>/spec.md` | 该 track 的需求（What/Why），批准后才进入计划 |
| `conductor/tracks/<id>/plan.md` | Phases → Tasks → Sub-tasks，带 `[ ]` 状态与 checkpoint SHA |
| `GEMINI.md` / `AGENTS.md` | CLI 每轮注入的层级上下文，支持 `@file.md` 导入、`context.fileName` 改名 |

Conductor 的 plan 结构约定（原文，`conductor-new-track` SKILL）：

```text
- [ ] Task: ...
  - [ ] ...
- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
```

`spec.md` 章节：Overview、Functional Requirements、Non-Functional Requirements（如有）、Acceptance Criteria、Out of Scope。`workflow.md` 把任务生命周期写死：`[ ]` → `[~]` → 先写失败测试（Red）→ 最小实现（Green）→ 覆盖率 >80% → 提交 → 用 `git notes` 附任务摘要 → 把 `[~]` 改成 `[x]` 并追加 commit SHA。

#### 长度约定

**未找到**行数或字节上限。`GEMINI.md` 文档只描述全局 `~/.gemini/GEMINI.md`、工作区父目录、JIT 三级加载与 `@` 导入，没有长度建议；Conductor 仓库反而在 `Note on Token Consumption` 中警告 SDD 会显著增加 token 消耗，建议用 `/stats model` 自查。

#### 解决的问题与局限

主要针对 brownfield 项目，以及「计划停在会话里、换机器就丢」的问题：状态落盘后可暂停、恢复、跨工具续用，并可安全回滚。局限：token 消耗明确升高；plan mode 的计划默认写在仓库外的 `~/.gemini/tmp/<project>/<session-id>/plans/`，要入库需改 `general.plan.directory` 并同步改 policy 放行写权限，且有 30 天自动清理；plan mode 可被 `/settings` 整体关闭或从 `Shift+Tab` 循环移除；`git notes`、>80% 覆盖率等要求写在模板里，属约定而非机器强制；「成功率更高」的结论只在官方博客给出，未见公开评测细节。

#### 对低智力模型的适配性

虽无「弱模型」字面论述，但有两条强信号：

1. **模型路由**：plan mode 期间自动路由到高推理 **Pro** 模型以产出稳健架构与高质量计划，计划批准退出后自动切到高速 **Flash** 模型执行——这等于官方默认实现「**强模型写规格、弱/快模型照规格落地**」的分工（[automatic model routing](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/plan-mode.md)）。这是三大厂商中唯一把该分工做成产品默认行为的。
2. **协议硬约束**：`new-track` SKILL 要求 `Precise Execution: Do not skip steps. Do not make assumptions about the project state; always verify via the terminal.`、`You MUST validate the success of every tool call`、提问必须给 2–4 个候选并带推荐项与 "Other"，文本聊天下禁止一次连问多题；`workflow.md` 则用 Red→Green、覆盖率门槛、「最多提两次修复否则必须停下报告」来限制执行者自由度。

### 5.4 三家小结

| 维度 | Anthropic | OpenAI | Google |
| --- | --- | --- | --- |
| 顶层概念 | context engineering | harness engineering | context-driven development |
| 常驻记忆文件 | `CLAUDE.md`（<200 行）+ `.claude/rules/*.md` | `AGENTS.md`（~100 行，32 KiB 合并上限）+ `PLANS.md` | `conductor/*.md` + `GEMINI.md`/`AGENTS.md` |
| 计划/规格文档 | plan mode 计划、`SPEC.md` | ExecPlan（`exec-plans/active|completed`）、`docs/product-specs/` | `tracks/<id>/spec.md` + `plan.md` |
| 显式长度约定 | CLAUDE.md <200 行；MEMORY.md 200 行/25KB；工具响应 25k tokens | AGENTS.md ~100 行；32 KiB 上限；ExecPlan 无行数但有「自包含」 | 无 |
| 弱执行者设计 | 「越强的模型需要越少的规定性工程」；指令要 concrete enough to verify | ExecPlan 明确写给 complete beginner、不外包关键决策、验收必须是可观察行为 | plan mode 自动 Pro 写计划 / Flash 执行；SKILL 禁止假设、必须验证每个工具调用 |

---



## 6. 其它有公开文档的 SDD 框架

本节覆盖 GitHub Spec Kit 与 Kiro 之外、有公开一手文档的开源框架。选择标准：① 有官方仓库/文档站；② 文档结构可被原文引用；③ 社区有实际使用记录。

### 6.1 OpenSpec（delta 式规格，最贴近 brownfield 的一种设计）

| 类型 | 链接 |
| --- | --- |
| 仓库 | <https://github.com/Fission-AI/OpenSpec> |
| README（一手） | <https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/README.md> |
| 概念全解（一手，结构与产物原文） | <https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/docs/concepts.md> |
| 写规格指南（一手，质量判据） | <https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/docs/writing-specs.md> |
| 命令说明 | <https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/docs/commands.md> |

**定位**：`Agree before you build`——在写代码前让人和 AI 就规格达成一致。五条自述哲学原文：

```text
→ fluid not rigid
→ iterative not waterfall
→ easy not complex
→ built for brownfield not just greenfield
→ scalable from personal projects to enterprises
```

**流程**（新版 `opsx` artifact-guided workflow）：`/opsx:explore`（无风险地想清楚）→ `/opsx:propose <idea>`（生成 proposal / specs / design / tasks）→ `/opsx:apply`（逐条实现并勾选）→ `/opsx:archive`（把 delta 合并回主 specs，change 移入 `changes/archive/<date>-<id>/`）。可选 `/opsx:verify`。注意 OpenSpec **没有阶段门**（`no phase gates`），产物依赖关系是「enabler 而非 gate」。

**文档清单与结构原文**：

```text
openspec/
├── specs/                     # 事实来源：系统当前行为
│   ├── auth/spec.md
│   ├── payments/spec.md
│   └── ui/spec.md
└── changes/                   # 提议中的修改，每个 change 一个文件夹
    ├── add-dark-mode/
    │   ├── proposal.md        # Why and what
    │   ├── design.md          # How (technical approach)
    │   ├── tasks.md           # Implementation checklist
    │   ├── .openspec.yaml     # 可选元数据：schema / created / skip_specs / retire_capabilities
    │   └── specs/ui/spec.md   # delta 规格
    └── archive/2025-01-24-add-2fa/   # 归档保留完整上下文
```

| 产物 | 回答的问题 | 内容 |
| --- | --- | --- |
| `proposal.md` | why + scope | Intent / Scope（In scope / Out of scope）/ Approach |
| delta `specs/**/spec.md` | what 在变 | `## ADDED` / `## MODIFIED` / `## REMOVED` / `## Purpose` 四类小节 |
| `design.md` | how | Technical Approach / Architecture Decisions（含 Decision 与理由）/ Data Flow / File Changes |
| `tasks.md` | steps | 分组 + 层级编号 `1.1` 的 checkbox 清单 |

**spec 的正文骨架（原文）**：

```markdown
# Auth Specification

## Purpose
Authentication and session management for the application.

## Requirements

### Requirement: User Authentication
The system SHALL issue a JWT token upon successful login.

#### Scenario: Valid credentials
- GIVEN a user with valid credentials
- WHEN the user submits login form
- THEN a JWT token is returned
- AND the user is redirected to dashboard
```

**delta 的正文骨架（原文）**：

```markdown
# Delta for Auth

## ADDED Requirements
### Requirement: Two-Factor Authentication
The system MUST support TOTP-based two-factor authentication.
#### Scenario: 2FA enrollment
- GIVEN a user without 2FA enabled
- WHEN the user enables 2FA in settings
- THEN a QR code is displayed ...

## MODIFIED Requirements
### Requirement: Session Expiration
The system MUST expire sessions after 15 minutes of inactivity.
(Previously: 30 minutes)

## REMOVED Requirements
### Requirement: Remember Me
(Deprecated in favor of 2FA. ...)
```

归档时的合并语义（原文表格）：`ADDED` 追加到主 spec；`MODIFIED` 替换旧版本；`REMOVED` 从主 spec 删除（删除最后一个需求即「retire capability」，会删掉整个 spec 文件，且必须在 `.openspec.yaml` 里显式写 `retire_capabilities: true`，否则归档中止）。

**schema 定义产物依赖图**（`openspec/schemas/spec-driven/schema.yaml`，可自定义；依赖是 enabler 不是 gate）：

```yaml
name: spec-driven
artifacts:
  - id: proposal
    generates: proposal.md
    requires: []
  - id: specs
    generates: specs/**/*.md
    requires: [proposal]
  - id: design
    generates: design.md
    requires: [proposal]        # 可与 specs 并行
  - id: tasks
    generates: tasks.md
    requires: [specs, design]
```

**长度约定**：官方**没有**行数/字数上限，但给了三条可操作的「规模」判据（一手原文）：

1. **一个 change 只能有一个意图**：`A good change has one intent you can say in a sentence.` 太长信号包括「proposal 的 scope 读起来像一串不相关特性」「review 要花一下午」「两个人做会撞车」「一半任务可以单独发布」。反向也要匹配仪式感：`a one-line typo fix doesn't need three requirements and a design doc. Match the ceremony to the stakes.`
2. **渐进严谨度（Progressive Rigor）**：默认 **Lite spec**（短行为需求 + 清晰范围与非目标 + 少量验收检查）；只有跨团队/跨仓、API 契约变更、迁移、安全隐私、歧义会导致昂贵返工时才用 **Full spec**。`Most changes should stay in Lite mode.`
3. **任务粒度**：`Keep tasks small enough to complete in one session`。

另外 `writing-specs.md` 给了需求与场景的质量判据（对弱模型非常有用）：一条需求只能有一个 `SHALL`/`MUST`（有三个 "and also" 就是三条需求）；必须可观察；强度用 RFC 2119（`MUST`/`SHALL` = 硬要求，`SHOULD` = 有正当理由可例外，`MAY` = 真可选）；验收测试是「一个没见过代码的测试者能否判断通过」。

**解决的问題**：AI 助手在需求只存在于聊天记录时不可预测；brownfield 里「改既有行为」才是常态，而全量重写规格既笨重又难 review。delta 机制让多个 change 可以并行修改同一份 spec 的不同需求而不冲突，reviewer 只看变更不看未变的上下文。

**已知批评 / 局限（官方自陈与对比）**：

- 官方在 README 里直接对比竞品：`vs. Spec Kit — Thorough but heavyweight. Rigid phase gates, lots of Markdown, Python setup. OpenSpec is lighter and lets you iterate freely.`、`vs. Kiro — Powerful but you're locked into their IDE and limited to Claude models.`
- `Stores`（把规划放进独立仓库、跨仓共享）仍是 **beta**。
- 没有阶段门是双刃剑：自由度换来了「什么时候算想清楚」缺乏强制检查点（对比 Spec Kit/cc-sdd 的分析门与 review 门）。
- 新版 `opsx` 与旧命令（`/opsx:new`、`/opsx:continue`、`/opsx:ff`、`/opsx:verify`）并存，profile 需手动切换，文档面较大。

**对低智力模型的适配性（官方立场是「用强模型 + 干净上下文」，与目标相反）**：README 的 Usage Notes 原文明确写：

```text
**Model selection**: OpenSpec works best with high-reasoning models. We recommend Codex 5.5 and Opus 4.7
for both planning and implementation.
**Context hygiene**: OpenSpec benefits from a clean context window. Clear your context before starting
implementation and maintain good context hygiene throughout your session.
```

但结构上它对弱执行者有几处实质帮助：**delta 让「改什么」有明确边界**（只写 ADDED/MODIFIED/REMOVED，不必读懂全量规格）；**schema 依赖图把产物创建顺序外化**（不用模型自己判断先写哪份）；**`## Purpose` / `## ADDED` 等固定小节名**是机器可校验的槽位；**Lite/Full 双档**允许按风险降仪式感；**「一个 change 一个意图」+「任务一次会话能做完」**直接限制单次推理规模。



### 6.2 BMAD-METHOD（现已改名「BMad Method」，从 agent 人设制转向 skill + 合同制）

| 类型 | 链接 |
| --- | --- |
| 仓库 | <https://github.com/bmad-code-org/BMAD-METHOD> |
| 官方文档站 | <https://docs.bmad-method.org/> |
| 选择规划路径（一手） | <https://docs.bmad-method.org/plan/choose-a-planning-path/> |
| 定义需求与规格（一手，`SPEC.md` 五字段原文） | <https://docs.bmad-method.org/plan/define-requirements-and-a-specification/> |

**重要版本提示**：BMAD 经历过一次**大改写**。2025 年社区常引用的形态是「agent 人设制」（Analyst / PM / Architect / SM / Dev / QA 六个角色 + PRD / architecture / story 文件 + `bmad/` 目录）。当前 main 分支的自我定位已变成 **`Agile Ai Driven Development — turn an idea or change request into working software without giving up the thinking.`**，实现方式是 **skills**（`npx skills add bmad-code-org/BMAD-METHOD` 或 Claude Code / Codex plugin marketplace），核心入口是 `bmad-spec`、`bmad-build` 等 skill，不再以「六个 agent 人设」为主线。引用 BMAD 时必须注明版本，否则会得出互相矛盾的结构描述。

**流程**：`Clarify → Plan → Build and verify → Learn and adjust`（官方交付循环）。关键设计是**按意图规模自选路径**：`Small changes go straight to build. Complex work gets the depth it needs.` 规划章节的技能是 `independent tools, not stages`（独立工具而非阶段），按缺口自选。

**文档清单与各自职责（一手，官方表格节选）**：

| Skill | 职责 | 产出 |
| --- | --- | --- |
| `bmad-brainstorming` | 引导式发散 | `brainstorm.html` + 可选 `brainstorm-intent.md` |
| `bmad-forge-idea` | 压测想法直到变硬/被证伪 | `forge-report.html`（每次）；`forged-idea.md`（想法变硬时） |
| `bmad-deep-recon` | 为决策做带引用的调研 | 带引用的 `research.md` |
| `bmad-product-brief` | 概念清晰时写产品愿景 | `brief.md` + `addendum.md` |
| `bmad-prfaq` | Amazon Working Backwards 法压测概念 | `prfaq-<project>.md` |
| `bmad-prd` | 创建/更新/校验 PRD（描述能力，不描述实现） | `prd.md`、`addendum.md`、`.memlog.md`；validate 产出 HTML + `.md` 报告 |
| `bmad-ux` | 记录产品外观与行为 | `DESIGN.md`、`EXPERIENCE.md`、`.memlog.md` |
| `bmad-spec` | 把任意意图压成**短合同**；按需拆 story | `SPEC.md` + `specs/spec-<slug>/` 伴随文件；可选 `stories.yaml` |
| `bmad-architecture` | 做跨部件一致性所需的技术决策 | `ARCHITECTURE-SPINE.md` |
| `bmad-create-epics-and-stories` | 拆成 epic 与 story | epic 文件（含 story） |
| `bmad-sprint-planning` | 实现前检查就绪度，并跟踪 story 状态 | PASS / CONCERNS / FAIL + `sprint-status.yaml` |

**模板结构原文摘录**——`SPEC.md` 的五个字段（原文）：`SPEC.md has five fields: Why, Capabilities (each with an intent and a success condition), Constraints, Non-goals, and Success signal.` 并规定：`Tables, diagrams, glossaries, and documents other skills already wrote sit beside it; the spec points at them rather than copying them.` 另有两条强约束：`bmad-spec is the only writer of SPEC.md. Do not hand-edit it; run the skill again with the change and it updates the spec in place, keeping capability IDs stable.` 以及每次运行后 `it reports assumptions it made and open questions it could not answer, for you to resolve`。

`bmad-spec` 的两种输入处理方式（原文）：`Rich input is extracted with no questions. Sparse input gets a choice: a best-effort draft where every gap becomes an open question, or a guided walk through the five fields.` 太薄的输入（"an app for hikers"）会被退回 `bmad-prd`。

**Story Breakdown**（把一份 spec 变成 epic）：`It walks the capabilities and constraints with you, proposes a story per independently reviewable slice, and asks for each one whether you want a checkpoint before or after implementation. The result is the ordered stories.yaml beside SPEC.md.`

**长度约定（本调研中少见的明确量化）**：

- `bmad-product-brief`：**1–2 页**（`a one- to two-page account of the product concept`）。
- `bmad-prd`：`Length scales with stakes, from about two pages for a hobby project to as long as the requirements need for a launch.`；技术选择放 `addendum.md` 而不进 PRD。
- **输入上限**：给 `bmad-spec` 的输入 `the practical ceiling is a few tens of thousands of tokens, roughly a 40-page document. Hand it a pile of raw documents several times that size and it silently loses the parts that mattered; condense them first.` 这是一条罕见的、明确指向「上下文超限会静默丢信息」的官方警告。
- 规模判据：`Work that spans several epics, or likely needs roughly 20 or more sessions, is a project.`；实现单位统一（Build 一次一个 story），更大规模只是「在其外围加共享上下文并重复该单位」。

**解决的问题**：`Coding assistants are effective at implementation, but they often turn unstated assumptions into code.` BMAD 的卖点是「不让你的思考被替代」——决策显式化、上下文可延续（`Durable context — Carry product and technical decisions forward instead of re-explaining them in every chat`）、按规模自适配流程。

**已知批评 / 局限**：官方自陈 `Dividing work can lose information: a requirement weakens, a constraint disappears, or two correct stories fail when combined.`（这正是 PRD / architecture / spec 存在的理由）；`bmad-build-auto` 只跑一个 session，且 `It does not choose the next story or own the backlog. Use it after the important implementation decisions are stable.`；此外 BMAD 生态模块化程度高（Builder / Test Architect / Loop / Game Dev Studio 等 6 个模块），上手面较大，且旧版文档与新版（skill 化）文档在社区中大量并存，容易误导。

**对低智力模型的适配性**：BMAD 未出现「弱模型」论述，但有三处结构收益：① **单一写者**（`bmad-spec` 是 `SPEC.md` 的唯一写者，且禁止手改）——避免多来源写同一份文件造成的漂移；② **意图不足即退回**（太薄→`bmad-prd`，太厚→先压缩）——把「输入不合格」变成显式分支而不是让模型硬做；③ **每次运行后强制报告假设与未解问题**——与 Spec Kit 的 `[NEEDS CLARIFICATION]`、cc-sdd 的 `NEEDS_CONTEXT` 同构（M5）。但它的实现单位是「一个 Build session 一个 story」，依赖于人挑选与排序 story，弱模型自主性有限。

### 6.3 agent-os（标准（standards）驱动的 SDD，v3 转向自动发现规范）

| 类型 | 链接 |
| --- | --- |
| 仓库 | <https://github.com/buildermethods/agent-os> |
| 官方文档站 | <https://buildermethods.com/agent-os> |
| 工作流（一手） | <https://buildermethods.com/agent-os/workflow> |
| shape-spec 命令原文（含完整目录结构） | <https://raw.githubusercontent.com/buildermethods/agent-os/main/commands/agent-os/shape-spec.md> |

**定位**：`Agent OS helps you shape better specs, keeps agents aligned in a lightweight system that fits how you already build.` 要解决的痛点：`Every time you prompt an AI coding agent, you're re-teaching it context that should already be known. ... none of that comes through when an agent scans your code.`

**核心循环（一手原文）**：`Discover → Inject → Build → Refine`——`Discover`（把代码库里的模式提取成 standards 文档）→ `Inject`（按当前工作智能注入相关 standards）→ `Build`（带着 standards 工作）→ `Refine`（模式演进后更新 standards）。

**四个斜杠命令**：`/discover-standards`、`/inject-standards`、`/plan-product`、`/shape-spec`（必须在 plan mode 下运行）。文档站另外提到 `Index Standards`（保持 standards 可发现）与 `Shape Spec`（在 plan mode 用结构化提问产出可持久化的 spec）。

**模板/结构原文摘录**——`shape-spec` 定义了一个完整的、**任务 1 恒为「保存 spec 文档」**的产物结构（原文）：

```text
agent-os/specs/{YYYY-MM-DD-HHMM-feature-slug}/
├── plan.md           # The full plan
├── shape.md          # Shaping decisions and context
├── standards.md      # Which standards apply and key points
├── references.md     # Pointers to similar code
└── visuals/          # Mockups, screenshots (if any)
```

```markdown
## Task 1: Save Spec Documentation

Create `agent-os/specs/{folder-name}/` with:
- **plan.md** — This full plan
- **shape.md** — Shaping notes (scope, decisions, context from our conversation)
- **standards.md** — Relevant standards that apply to this work
- **references.md** — Pointers to reference implementations studied
- **visuals/** — Any mockups or screenshots provided

## Task 2: [First implementation task]
```

`shape.md` 的固定结构（原文）：`## Scope` / `## Decisions` / `## Context`（Visuals / References / Product alignment）/ `## Standards Applied`（逐条列出 `api/response-format — [why it applies]`）。
`standards.md` 的规则是**把命中的 standard 文件全文内联**（`Include the full content of each relevant standard`）。
`references.md` 的固定结构：`## Similar Implementations`，每条含 `**Location:**` / `**Relevance:**` / `**Key patterns:**`（原文把「从参考实现里能借什么模式」显式写出来）。

其他约定：product 上下文放 `agent-os/product/`（`mission.md`、`roadmap.md`、`tech-stack.md`）；standards 索引用 `agent-os/standards/index.yml`，注入前必须先读索引再确认；`/shape-spec` 强制 `Always use AskUserQuestion tool when asking the user anything`、`Offer suggestions — Present options the user can confirm, adjust, or correct`、`Keep it lightweight — This is shaping, not exhaustive documentation`。

**长度约定**：**未找到**任何行数/字数上限。官方只给风格指令：`Keep shaping fast — Don't over-document. Capture enough to start, refine as you build.`、`Standards guide, not dictate`。

**解决的问题**：把「团队的隐式规范」变成 agent 可读的显式资产，并在写 spec 时就注入（`Better spec shaping — Enhanced shaping questions (run in plan mode) help you create stronger, more aligned specs that account for your product's mission and all your standards.`）。对 legacy 代码库尤其有用：`Bring pre-AI codebases into the modern era. Discover and document tribal knowledge that exists only in your code.`

**已知批评 / 局限**：① v3 的 README 极度精简，结构与模板细节只能从 `commands/` 原始文件与文档站拼出，官方没有一份完整的「目录与文件规格」页；② 依赖 standards 的质量——官方自己也承认 `Refine` 是循环的一部分，即 standards 会腐化（与 Tessl 的 `static instructions quietly go stale`、OpenAI 的 `It rots instantly` 是同一问题）；③ 工具集成以 Claude Code 为主（`designed primarily for Claude Code`），其它工具「直接引用 `agent-os/` 下的文件」；④ `worlds any AI coding tool that can read files` 的说法意味着没有跨工具的强制校验（对比 Tessl 的两个 shell 校验脚本）。

**对低智力模型的适配性**：agent-os 未提弱模型，但它的机制**天然适合弱执行者**：① `standards.md` 把「本项目该怎么写」**全文内联**到 spec 里，弱模型不需要去检索、也不需要推断（这正对应 M4「只喂相关上下文」）；② `references.md` 显式给出「参考实现的位置、相关性、可借模式」（M4/M11）；③ `shape.md` 把 shaping 决策与上下文落盘（M5：把不确定性从对话搬到文件）；④ Task 1 恒为「先保存文档再实现」——保证后续任何执行者（人或模型）都有同一份上下文（M1/M5）。缺口是：这些文件只靠约定生成，没有机器校验（对比 M2 的实现者 Tessl / AI-DLC）。

### 6.4 claude-flow / Ruflo（**不是**文档驱动的 SDD 框架，而是 agent meta-harness）

| 类型 | 链接 |
| --- | --- |
| 仓库 | <https://github.com/ruvnet/claude-flow> |
| README（一手） | <https://raw.githubusercontent.com/ruvnet/claude-flow/main/README.md> |

**结论：本项与本报告主题只有弱相关，理由是它的自我定位已经改变。** 该项目现名 **Ruflo**，自我描述为 `**An agent meta-harness for Claude Code and Codex.**`，核心心智模型是 `**Agent = Model + Harness.** The model writes; the harness gives it tools, memory, loops, sandboxes, and controls so it can actually work.` 它提供的是 100+ agents、swarm 协调、HNSW 向量记忆、插件市场（35 个插件）、federation 等**运行时/协调层**能力，而**不是**一套 `spec.md` / `plan.md` / `tasks.md` 式的文档规范。

它唯一与 SDD 文档相关的是插件列表中的：

- `ruflo-sparc` —— `Guided 5-phase development methodology with quality gates`（SPARC 五阶段方法论 + 质量门）
- `ruflo-docs` —— `Generate and maintain documentation automatically`
- `ruflo-goals` —— `Break big goals into plans and track progress`
- `ruflo-adr` —— `Track architecture decisions with a living record`

**模板/结构原文摘录**：**未找到**公开的 `spec.md` / `plan.md` / `tasks.md` 逐字模板。README 只给出架构分层（`Orchestration Layer → Swarm Coordination → 100+ Specialized Agents → Memory & Learning → LLM Providers`）与安装后的目录足迹（`Files in your workspace: .claude/, .claude-flow/, CLAUDE.md, helpers, settings`）。

**长度约定**：无。

**对低智力模型的适配性**：它的取向恰好相反——`ruflo-ruvllm` 支持本地小模型 + 智能路由，`ruflo-ruvllm` / model routing 解决的是「把任务路由到合适模型」，而不是「用文档把弱模型托住」。对本报告的可迁移价值：**把「路由到不同能力的模型」与「文档约束」视为两条独立防线**（这一视角与 Google plan mode 的 Pro/Flash 自动路由同类）。



### 6.5 cc-sdd（Kiro 兼容的开源 SDD，本次调研中「弱模型执行」工程化最深的一个）

| 类型 | 链接 |
| --- | --- |
| 仓库 | <https://github.com/gotalab/cc-sdd> |
| README（一手） | <https://raw.githubusercontent.com/gotalab/cc-sdd/main/README.md> |
| Skill Reference（一手，`/kiro-impl` 内部机制） | <https://raw.githubusercontent.com/gotalab/cc-sdd/main/docs/guides/skill-reference.md> |
| 设计理念（一手，含适用/不适用边界） | <https://raw.githubusercontent.com/gotalab/cc-sdd/main/docs/guides/why-cc-sdd.md> |
| requirements 模板原文 | <https://raw.githubusercontent.com/gotalab/cc-sdd/main/.kiro/settings/templates/specs/requirements.md> |
| design 模板原文 | <https://raw.githubusercontent.com/gotalab/cc-sdd/main/.kiro/settings/templates/specs/design.md> |
| tasks 模板原文 | <https://raw.githubusercontent.com/gotalab/cc-sdd/main/.kiro/settings/templates/specs/tasks.md> |
| implementer 提示模板原文（关键） | <https://raw.githubusercontent.com/gotalab/cc-sdd/main/tools/cc-sdd/templates/agents/antigravity-skills/skills/kiro-impl/templates/implementer-prompt.md> |

**定位**：`Turn approved specs into long-running autonomous implementation.` 自我描述为 **Kiro-inspired**，`Existing Kiro specs remain compatible and portable`，用同一套 17 个 Skill 支持 8 个 agent 平台（Claude Code / Codex 稳定，其余 beta）。核心主张与 Kiro 的分歧点写得很清楚：`cc-sdd treats the spec as a contract between parts of the system, not a master command document handed to the agent. **Code remains the source of truth.**` 即它明确**不**追求 spec-as-source。

**职责拆分（很值得借鉴的一条）**：把「规格 vs 设计」当一等区分——

- **规格（contract）**＝ `requirements.md` + `design.md` 里的 File Structure Plan + 任务上的 `_Boundary:_` / `_Depends:_` 注解。**人在这一层审批。**
- **设计（自由区）**＝ `design.md` 内部细节、`tasks.md` 排序、每个任务内部的实现。**agent 在这一层自由发挥。**

**流程**：`/kiro-discovery`（路由：扩展现有 spec / 直接实现不写 spec / 建一个新 spec / 拆成多个 spec）→ `/kiro-spec-init` → `/kiro-spec-requirements` → `/kiro-spec-design` → `/kiro-spec-tasks` → `/kiro-impl`（自主实现）→ `/kiro-validate-impl`（GO / NO-GO / MANUAL_VERIFY_REQUIRED）。

**模板原文摘录**：

```markdown
# Requirements Document
## Introduction
{{INTRODUCTION}}
## Requirements
### Requirement 1: {{REQUIREMENT_AREA_1}}
<!-- Requirement headings MUST include a leading numeric ID only (for example: "Requirement 1: ...").
     Alphabetic IDs like "Requirement A" are not allowed. -->
**Objective:** As a {{ROLE}}, I want {{CAPABILITY}}, so that {{BENEFIT}}
#### Acceptance Criteria
1. When [event], the [system] shall [response/action]
2. If [trigger], then the [system] shall [response/action]
3. While [precondition], the [system] shall [response/action]
4. Where [feature is included], the [system] shall [response/action]
5. The [system] shall [response/action]
```

```markdown
# Implementation Plan
## Task Format Template
### Major + Sub-task structure
- [ ] {{MAJOR_NUMBER}}. {{MAJOR_TASK_SUMMARY}}
- [ ] {{MAJOR_NUMBER}}.{{SUB_NUMBER}} {{SUB_TASK_DESCRIPTION}}{{SUB_PARALLEL_MARK}}
  - {{DETAIL_ITEM_1}}
  - _Requirements: {{REQUIREMENT_IDS}}_ *(IDs only; do not add descriptions or parentheses.)*
  - _Boundary: {{COMPONENT_NAMES}}_ *(Only for (P) tasks. Omit when scope is obvious.)*
  - _Depends: {{TASK_IDS}}_ *(Only for non-obvious cross-boundary dependencies. Most tasks omit this.)*
```

`design.md` 模板开头直接给了**长度上限**（见 6.5 下文）与「Summary → Scope → Decisions → Impacts/Risks」的固定阅读流：

```markdown
# Design Document Template
**Purpose**: Provide sufficient detail to ensure implementation consistency across different implementers,
preventing interpretation drift.
**Warning**: Approaching 1000 lines indicates excessive feature complexity that may require design
simplification or splitting into multiple specs.
...
## Overview
2-3 paragraphs max
...
## File Structure Plan     ← 直接驱动 tasks 的 _Boundary:_ 注解
## Requirements Traceability
## Components and Interfaces
## Data Models
## Error Handling
## Testing Strategy
```

**长度约定**：cc-sdd 是本调研中把长度写成**模板内联警告**的少数框架之一——`design.md` 接近 **1000 行**就是「特性过于复杂，应简化或拆成多个 spec」的信号；`Overview` 限 **2-3 段**；测试策略按 Unit / Integration / E2E 各 **3-5 项**。工程哲学侧的对应口号：`If the discipline feels like overhead, your specs are probably too big. Break them smaller.`

**「弱模型执行」机制（本报告最关注的发现）**——`/kiro-impl` 的自主实现循环把每个任务交给三个角色，且**每个角色都是全新上下文**：

```text
- Implementer — fresh execution context that builds a Task Brief from the spec, then implements with TDD (RED → GREEN)
- Reviewer   — independent pass that runs `git diff`, greps for TODOs, runs the test suite, and checks task-boundary compliance
- Debugger   — triggered when the implementer is BLOCKED, or when the reviewer rejects after 2 remediation rounds.
               Investigates root causes in a clean context (with web search). Max 2 debug rounds per task.
```

关键约束（原文）：`**1 task per iteration** — Each iteration processes a single task. This keeps context hygiene across long autonomous runs, makes /kiro-impl safe to re-run after interruption, and bounds the scope of review and debug passes.` 以及**跨任务学习传递**：`When a task reveals cross-cutting insights ... the finding is recorded under ## Implementation Notes in tasks.md and injected into subsequent implementer prompts.`

implementer 提示模板里有三条**直接针对「弱执行者」**的规则：

1. **只喂该任务的最小上下文**：`Read only the provided task-relevant steering; do not bulk-load unrelated skills or playbooks`；`Inspect existing code patterns only in the declared boundary`；`Read the referenced sections of requirements.md and design.md for this task`。
2. **先造 Task Brief 再写代码，缺信息必须立刻上报而不是猜**：`If any of these cannot be determined from the spec ... report as **NEEDS_CONTEXT** immediately with what's missing. Do not guess or fill gaps with assumptions.`
3. **结构化状态回报（父控制器解析固定字段）**，含 `RED_PHASE_OUTPUT`（证明测试先写）、`REQUIREMENTS_CHECKED` / `DESIGN_CHECKED`（精确到章节号）、`FILES_CHANGED`、`CONCERNS`、`BLOCKER` / `BLOCKER_REMEDIATION`、`MISSING`、`EVIDENCE`。并有强制自审清单：`Verify the implementation is NOT a mock, stub, placeholder, fake, or TODO-only path`、`Verify there are no TBD, TODO, or FIXME markers left in changed files`。

**对低智力模型的适配性**：cc-sdd 是本次调研中**最接近「为弱执行者设计」的框架**，虽然它同样没有「小模型」字样。它的手段不是「把文档写短」，而是：单任务单迭代 + 全新执行上下文 + 只喂相关章节 + 缺上下文即刻上报（而不是猜）+ 独立 reviewer + 失败自动 debug（限 2 轮）+ 学习写回 `tasks.md` 传给后续任务 + 任务带 `_Boundary:_`（可机械校验越界）。可直接迁移到「弱模型照文档写代码」的场景。

**局限（官方自陈）**：不适用于「单会话能装下的单人工作」「一次性原型」「vibe coding 更快」的场景；`/kiro-discovery` 可以合法返回「不需要 spec，直接实现」。另有固有限制：跨任务契约一致性靠 `/kiro-spec-batch` 的 cross-spec review 保障，仍属概率性检查；平台集成在 Claude Code / Codex 之外均为 beta。

---

## 7. 横向对比

### 7.1 文档集与流程对照

| 框架 | 核心文档集 | 流程 | 模板强制程度 | 官方长度约定 | 弱执行者专门机制 | 最有力的已知批评 |
| --- | --- | --- | --- | --- | --- | --- |
| **GitHub Spec Kit** | `constitution.md` + `spec.md` / `plan.md` / `tasks.md` / `research.md` / `data-model.md` / `quickstart.md` / `contracts/` / `checklists/` / `roadmap.md` | constitution（一次）→ specify → clarify → plan → checklist → tasks → analyze → implement → converge | 中：章节骨架 + 严格任务格式 + 宪法门 | 无字符量上限；有硬数字约束（澄清 ≤3、清单 soft cap 40、analyze ≤50 findings、converge append-only） | **有专章**：模板如何约束 LLM（7 条）；任务须「无需额外上下文即可执行」；约束逐字进任务描述；上下文预算 4 策略 + spec of specs | 产物爆炸、Markdown 评审负担重；对大代码库退化；本质仍是 spec-first（Böckeler 实测；官方 issue #314 / #955） |
| **Amazon Kiro** | `.kiro/specs/<f>/{requirements.md,design.md,tasks.md}`（bugfix 用 `bugfix.md`）+ `.kiro/steering/*.md` + `.kiro/hooks/*` | Requirements → Design → Tasks（或 Design-First / Quick Spec），每阶段人工批准 | 高：三文件章节 MUST、任务格式 MUST、非编码活动 MUST NOT | 无数字上限；任务「一个 sitting 能做完」、最多两级、一次只做一个任务 | **强**：逐任务停顿、阶段批准门、EARS 措辞约束、性质测试作可执行规格 | 对小问题过重（1 个小 bug → 4 stories / 16 AC）；EARS 只是措辞纪律；闭源绑定产品 |
| **Tessl** | `.spec.md`（frontmatter + API 契约 + `[@test]`）+ `.tessl/`（plugins / skills / RULES.md）+ `tessl.json` | requirement gathering（一次一问）→ stakeholder approval → implementation → review | 高（格式层面）：3 个必填 frontmatter 字段、≥1 target、`[@test]` 链接，且有 shell 脚本校验 | 无数字上限；`description` 一行；实际样例 20–40 行 | 间接：格式可脚本校验、单问单步、spec↔代码 1:1、targets 外化作用域 | spec-as-source 可能同时继承 MDD 的不灵活与 LLM 的非确定性；Framework 长期 closed beta、文档站已转向 skills/plugins |
| **AWS AI-DLC** | `aidlc/spaces/<space>/intents/<ts>-<label>/` 下按 33 个 stage 分目录（`requirements.md` 只是其中一份）；space 级 `knowledge/`、`codekb/<repo>/` | 5 阶段 33 stage / 11 profile，确定性引擎路由 + 29 个 gate（feature 档） | 高：question 文件 A–E/X 形状、code-gen 计划 checkbox、哨兵生成区 | **有量化口径**：depth=Minimal 时「1–2 page artifact」；测试量 Nyquist（每需求 1 测，典型 5–15 测），均为 soft guideline | 明确**不为**弱模型简化；靠确定性引擎 + 6 个 advisory sensor + 独立 reviewer sub-agent + 模型分层 | 官方要求强模型（推荐 Opus 4.8）；文档漂移严重（v1 3 阶段 vs v2 33 stage）；gate 数量多 |
| **cc-sdd** | `.kiro/specs/<f>/{requirements.md,design.md,tasks.md}`（Kiro 兼容）+ `brief.md` / `roadmap.md` | discovery → spec-init → requirements → design → tasks → impl（自主）→ validate-impl | 高：需求编号 MUST 为数字、任务 `_Boundary:_`/`_Depends:_` 注解、design 模板含长度警告 | **有**：design.md 接近 1000 行即需拆分；Overview 2–3 段；测试策略每类 3–5 项 | **最强**：单任务单迭代 + 全新 implementer/reviewer/debugger 上下文 + 只喂相关章节 + 缺信息即报 NEEDS_CONTEXT + `tasks.md` 的 `## Implementation Notes` 跨任务传递 + 结构化状态回报 | 不适用单人/原型场景；cross-spec 一致性仍是概率性检查；多平台集成为 beta |
| **Anthropic（厂商侧）** | `CLAUDE.md` + `.claude/rules/*.md` + plan + `SPEC.md` + `SKILL.md`/子代理 | explore → plan → implement → commit | 低（无固定模板，给质量要求） | `CLAUDE.md` <200 行；`MEMORY.md` 200 行/25KB；工具响应 25k tokens | 「smarter models require less prescriptive engineering」；指令要 concrete enough to verify；子代理任务须给出目标/输出格式/工具/边界 | CLAUDE.md 不保证遵从；over-specified 是典型失败模式；多代理约 15× token |
| **OpenAI（厂商侧）** | `AGENTS.md` + `docs/`（`exec-plans/`、`product-specs/`、`QUALITY_SCORE.md` …）+ `ARCHITECTURE.md` | Humans steer. Agents execute.；小改动轻量计划，复杂工作写 ExecPlan 入库 | 中高：ExecPlan 章节骨架、单一围栏块、正文禁清单 | `AGENTS.md` 约 100 行；多层合并 32 KiB 上限；ExecPlan 无行数但有「自包含」 | **最直接**：ExecPlan 明确写给 complete beginner、重复每个假设、不外包关键决策、验收必须是可观察行为；lint 错误注入修复指令；刚性分层 | Codex 复制仓库既有次优模式导致漂移；单文件指导会「rotting」；作者自陈「不应假设可泛化」 |
| **Google（厂商侧）** | `conductor/{index,product,tech-stack,workflow,tracks}.md` + `tracks/<id>/{spec.md,plan.md}` + `GEMINI.md`/`AGENTS.md` | Context → Spec & Plan → Implement | 中：spec.md 章节固定、plan 用 phases/tasks/subtasks + `[ ]` + checkpoint | **未找到**行数/字节约定；官方警告 SDD 显著增加 token | plan mode **自动路由**：Pro 写计划、Flash 执行；SKILL 禁止假设、必须验证每个工具调用、最多两次修复即停 | token 消耗高；计划默认落在仓外有 30 天清理；模板要求属约定非机器强制 |
| **OpenSpec** | `openspec/specs/<domain>/spec.md`（事实来源）+ `openspec/changes/<id>/{proposal.md,design.md,tasks.md,specs/**/spec.md,.openspec.yaml}` + `changes/archive/` | `/opsx:explore` → `/opsx:propose` → `/opsx:apply` → `/opsx:archive`（**无阶段门**，产物依赖是 enabler） | 中：requirement/scenario 固定小节（`## ADDED/MODIFIED/REMOVED`）、schema 定义产物依赖图 | 无数字上限；改用「一个 change 一个意图」「Lite / Full 双档严谨度」「任务一次会话内完成」 | 间接：delta 限定改动边界、schema 外化产物顺序、Lite 档降仪式感、Purpose/ADDED 是机器可校验槽位 | 官方自陈无阶段门即无强制检查点；Stores 跨仓共享仍 beta |
| **BMAD-METHOD** | `SPEC.md`（五字段）+ `specs/spec-<slug>/`（含 `stories.yaml`）+ `prd.md` / `addendum.md` / `brief.md` / `DESIGN.md` / `EXPERIENCE.md` / `ARCHITECTURE-SPINE.md` / `sprint-status.yaml` | Clarify → Plan → Build and verify → Learn and adjust；技能是「独立工具非阶段」，按缺口自选 | 中高：`SPEC.md` 五字段固定、唯一写者、规模分档（small→直接 build） | **有**：brief 1–2 页；PRD 约 2 页起随风险增长；**输入上限约 40 页 / 数万 tokens**，超限会静默丢信息 | 间接：单一写者防漂移、输入过薄/过厚都走显式分支、每次运行强制报告假设与未解问题 | 官方自陈拆分工作会丢信息；实现单位依赖人挑 story；新旧两代文档并存易误导 |
| **agent-os** | `agent-os/specs/<YYYY-MM-DD-HHMM-slug>/{plan.md,shape.md,standards.md,references.md,visuals/}` + `agent-os/product/{mission.md,roadmap.md,tech-stack.md}` + `agent-os/standards/index.yml` | Discover → Inject → Build → Refine；`/shape-spec`（必须在 plan mode）→ 批准 → 执行 | 中：Task 1 恒为「保存 spec 文档」，shape/standards/references 三段结构固定 | **未找到**任何行数上限；只有 `Don't over-document` 一类风格指令 | **强**：standards.md **全文内联**所需规范、references.md 显式给出「位置/相关性/可借模式」、shape.md 把决策落盘 | v3 无完整目录规格页；standards 会腐化；无格式校验脚本；以 Claude Code 为主 |
| **claude-flow / Ruflo** | 无文档规范（是 harness）：`.claude/`、`.claude-flow/`、`CLAUDE.md`；SPARC 插件提供 5 阶段方法论 | 插件化；`ruflo-sparc` = 5 阶段 + 质量门 | 低（非文档驱动） | 无 | 取向相反：靠 model routing 把任务分派给合适模型，而非用文档托住弱模型 | 定位已变为 agent meta-harness，与 SDD 文档设计弱相关 |

### 7.2 三个层次的现实分布（回应 0.3 节）

- **spec-first（全部）**：Spec Kit、Kiro、AI-DLC、cc-sdd、OpenSpec、BMAD 等都是先写规格再写码。
- **spec-anchored（少数）**：只有 Tessl 明确宣称；Spec Kit 官方承认「不规定规格在需求变更后如何保留/变更」，把选择权交给团队（flow-back / flow-forward / living spec 三模型）。
- **spec-as-source（仅 Tessl 探索）**：Tessl `[@generate]` 让 spec 生成代码，代码头部打 `// GENERATED FROM SPEC - DO NOT EDIT`；cc-sdd 明确反向表态 `Code remains the source of truth`。

### 7.3 长度约定的真实分布（本报告最实用的一张表）

| 类型 | 有硬数字的框架 | 具体数字 |
| --- | --- | --- |
| **规格/计划/任务文档本身** | AI-DLC、cc-sdd、BMAD | AI-DLC depth=Minimal「1–2 页」；cc-sdd `design.md` 接近 1000 行即需拆分；BMAD brief 1–2 页、PRD 从约 2 页起 |
| **常驻记忆/规则文件** | Anthropic、OpenAI | `CLAUDE.md` <200 行；`AGENTS.md` ~100 行、多层合并默认 32 KiB |
| **输入侧上限（给模型喂多少）** | BMAD | 「a few tens of thousands of tokens, roughly a 40-page document」是实际上限，超过会**静默丢失**关键部分 |
| **规格文档内部计数** | Spec Kit | 澄清标记 ≤3、清单 soft cap 40、analyze findings ≤50 |
| **无任何长度约定** | Kiro、Tessl、Google、OpenSpec、agent-os | — |

**关键观察**：**没有任何框架给「spec.md 不能超过 N 行」这类上限**。能看到的量化约定只有四种形态：① **常驻记忆文件的行/字节上限**（控制默认注入量）；② **输入侧上限**（BMAD 的 40 页，说明超限会静默丢信息）；③ **复杂度信号**（cc-sdd 的 1000 行警告、AI-DLC 的 1–2 页档位）；④ **文档内部计数**（Spec Kit 的澄清标记/清单/findings 上限）。这说明业界共识是：**控制「喂进去多少」与「拆到多细」比控制「写出来多少」更重要**。

---

## 8. 结论：「让低智力模型照文档写代码」的可迁移机制清单

按 0.2 节的判据整理，本次调研观察到 **12 条被至少两个框架独立验证过的机制**。括号内是实现该机制的框架。

| # | 机制 | 具体做法 | 实现者 |
| --- | --- | --- | --- |
| M1 | **结构强制（C1）** | 把章节骨架写进模板文件，模型只填空；空章节必须删除而不是留 N/A | Spec Kit、Kiro、cc-sdd、AI-DLC、Google |
| M2 | **格式机器校验（C1/C6）** | 用脚本/linter 校验格式与链接，不依赖模型自省 | Tessl（`validate-specs.sh`）、AI-DLC（6 sensor）、Spec Kit（checklist 计数）、OpenAI（自定义 lint 把修复指令注入上下文） |
| M3 | **粒度强制到「单任务单会话」（C2/C3）** | 每个任务必须是一个执行者无需额外澄清即可完成的最小单元 | Spec Kit（“specific enough that an LLM can complete it without additional context”）、Kiro（最多两级 + 一个 sitting）、cc-sdd（1 task per iteration） |
| M4 | **上下文预算策略（C3）** | 只喂当前任务相关章节；上下文将满时缩范围/派子代理/拆 spec | Spec Kit（complex-features 4 策略 + spec of specs）、cc-sdd（只读相关章节 + fresh context）、Anthropic（compaction/笔记/子代理）、OpenAI（progressive disclosure） |
| M5 | **不确定性外显（C4）** | 强制 `[NEEDS CLARIFICATION]` / `NEEDS_CONTEXT` / 结构化提问，禁止猜 | Spec Kit、Kiro（Analyze Requirements）、cc-sdd（NEEDS_CONTEXT 立即上报）、AI-DLC（A–E + X. Other + `[Answer]:`）、Tessl（one-question-at-a-time） |
| M6 | **受控自然语言（C5）** | EARS（When/If/While/Where + shall）或 Given/When/Then 压缩表达自由度 | Kiro、cc-sdd、Spec Kit（Given/When/Then） |
| M7 | **需求号双向追溯（C5/C6）** | 每个任务/测试回引精确的需求小节号，禁止另造别名 | Kiro（`_Requirements: 2.1_`）、cc-sdd（数字编号 MUST、`REQUIREMENTS_CHECKED`）、AI-DLC（inline `[desc]`/`[Q1]` 来源标记） |
| M8 | **可执行规格（C6）** | 把规格翻译成可运行断言（性质测试 / 契约测试 / quickstart 验证脚本） | Kiro（性质测试 + `Validates: Requirements 2.3`）、Spec Kit（quickstart.md + contracts）、cc-sdd（RED 证据）、Anthropic（pass/fail 检查） |
| M9 | **逐任务停顿（C7）** | 做完一个任务必须停下等 review，不许自动连做 | Kiro（VERY IMPORTANT 只做 one task）、cc-sdd（1 task per iteration + reviewer 门） |
| M10 | **独立上下文复核（C6/C7）** | 质量裁决由**不读建造者笔记**的独立 sub-agent 在独立上下文产出 | AI-DLC（reviewer sub-agent，`it forms independent judgment`，`maxTurns: 60`）、cc-sdd（independent reviewer + auto-debug 限 2 轮） |
| M11 | **验收写成可观察行为（C6/C9）** | 验收标准必须人能跑出 pass/fail，不能写成内部属性 | OpenAI（ExecPlan 硬规定）、Spec Kit（成功标准必须可度量且技术无关）、Kiro（EARS + 性质） |
| M12 | **反过度设计（C9）** | 显式禁止投机特性、禁止超出任务边界的改动 | Spec Kit（“No speculative or might need features”）、cc-sdd（do NOT expand scope beyond the assigned task and boundary）、Kiro（MUST NOT include non-coding tasks） |

### 8.1 三个反直觉发现

1. **「写更长的文档」不是弱模型的解法，「更小的上下文 + 机械校验」才是。** 量化上限几乎都加在**常驻记忆文件**（`CLAUDE.md` <200 行、`AGENTS.md` ~100 行）与**输入侧**（BMAD 约 40 页上限，并明确警告超过会静默丢信息）上；对 spec 本身只用「复杂度信号」（cc-sdd 1000 行警告、AI-DLC 1–2 页档位）而非硬上限。
2. **弱模型适配做得最好的不是大厂产品，而是 cc-sdd 这类「Kiro 兼容 + 自主实现循环」的小框架**。它给出了明确的执行者契约：全新上下文、只喂相关章节、缺信息立即上报、结构化状态回报、独立 reviewer、学习写回 `tasks.md`。Kiro 与 Spec Kit 都把「弱模型会退化」当作需要人工规避的问题，而不是用工程手段固化。
3. **官方产品里唯一把「强模型写规格、弱模型执行」做成默认行为的是 Google Gemini CLI 的 plan mode 自动路由（Pro 写计划 / Flash 执行）**；AI-DLC 只是把 reviewer pin 成中型模型；其余框架默认单一模型贯穿全流程。
4. **越强调「规格是资产」的框架，越把治理成本转移到文档自身。** Tessl 承认静态指令会 `quietly go stale`、OpenAI 承认单文件指导 `rots instantly`、agent-os 把 `Refine` 当作循环的一环、Spec Kit 干脆不规定规格的持久化模型——四家从不同角度承认同一件事：**规格资产的版本、去重与新鲜度治理，是长期成本中心，而不是「第一次写得好不好」。**

### 8.2 对本项目（workflowhub thin-core）的可迁移要点（调研者判断，非一手结论）

- **凭证安全**：本仓已有的「质量裁决由独立来源独立上下文产出，禁止自审自判」与 AI-DLC 的 reviewer sub-agent、cc-sdd 的 independent reviewer 是同一机制（M10），可以直接把这两个框架当作外部对标证据。
- **最省成本的改进方向**：M2（格式机器校验）+ M5（缺信息即报，禁止猜）+ M9（逐任务停顿）。三者都不需要新增控制面，只需在现有文档模板中加固定槽位与固定状态字。
- **不建议照搬的**：Spec Kit 的多产物文件树（已被官方 issue 与专家实测双重批评为评审负担）、AI-DLC 的 33 stage / 29 gate（需要确定性引擎与大量配套基础设施）、Tessl 的 spec-as-source（beta 且被质疑同时继承 MDD 与 LLM 的缺点）。

---

## 9. 来源性质说明

| 性质 | 来源 |
| --- | --- |
| **一手（官方仓库原始文件）** | `github/spec-kit` 的 `templates/*`、`templates/commands/*`、`docs/**`；`awslabs/aidlc-workflows` 的 `docs/guide/**`、`README`、`AGENTS.md`；`tesslio/spec-driven-development-tile` 的 `docs/*`、`rules/*`、`skills/*`、`README`；`gotalab/cc-sdd` 的 `.kiro/settings/templates/**`、`tools/cc-sdd/templates/**`、`docs/guides/**`；`Fission-AI/OpenSpec` 的 `README.md`、`docs/concepts.md`、`docs/writing-specs.md`；`buildermethods/agent-os` 的 `commands/agent-os/*.md`；`ruvnet/claude-flow` 的 `README.md` |
| **一手（官方文档站）** | `kiro.dev/docs/specs/**`、`kiro.dev/blog/property-based-testing`、`github.github.io/spec-kit/**`、`docs.tessl.io/**`、`code.claude.com/docs/**`、`developers.openai.com/cookbook/**`、`developers.googleblog.com`（Conductor / plan mode）、`aws.amazon.com/blogs/devops`（AI-DLC v1 系列）、`docs.bmad-method.org/plan/**`、`buildermethods.com/agent-os/**` |
| **一手（官方博客 / issue）** | `github.blog`（Spec Kit 发布）、`alistairmavin.com/ears`（EARS 原始定义）、`github.com/github/spec-kit/issues/314`、`/issues/955`、`github.com/awslabs/aidlc-workflows/issues/126` |
| **专家二手（被官方文档引用，可信度高）** | Birgitta Böckeler / Martin Fowler 站的 SDD 三工具实测：<https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html>（Spec Kit 官方 `docs/concepts/spec-persistence.md` 引用了其中的三层次划分） |
| **二手（已标注，仅作背景）** | Kiro spec agent system prompt 快照 gist（<https://gist.github.com/notdp/19822831b54190bd9c6b34f6b69fadeb>，非官方发布但与官方文档描述一致）；Kiro 官方 dev.to 账号下的实践文章及其评论；codemyspec 对 EARS 的分析；Medium 上的 SDD 框架综述与 AI-DLC 概述（部分已过期） |

**模板原文的获取程度（逐框架）**：

| 框架 | 模板原文获取程度 |
| --- | --- |
| GitHub Spec Kit | **完整逐字**（官方仓库 `templates/*`、`templates/commands/*` are raw 文件直读） |
| cc-sdd | **完整逐字**（官方仓库 `.kiro/settings/templates/**`、`tools/cc-sdd/templates/**` 直读） |
| OpenSpec | **完整逐字**（官方仓库 `docs/concepts.md`、`docs/writing-specs.md` 直读） |
| Tessl | **完整逐字**（官方 tile 仓库 `docs/spec-format.md`、`rules/spec-format-compliance.md` 直读） |
| AWS AI-DLC | **完整逐字**（官方仓库 `docs/guide/**` 直读；v1 部分取自 AWS 官方博客） |
| Anthropic / OpenAI / Google | 官网/官方文档站正文引用；OpenAI 的 harness 一文因需 JS 渲染，经逐字镜像核对后引用 |
| Amazon Kiro | **部分逐字**：官方文档给出章节清单与示例；`requirements.md` / `tasks.md` 的逐字骨架取自公开流传的 spec agent prompt 快照（已在 2.4.1 标注为非官方来源），可能与当前版本有偏差 |

**已知的本报告局限**：① Kiro 为闭源产品，其内部模板存在上述「部分逐字」的获取限制；② AI-DLC 的 v1 博客与 v2 仓库存在文档漂移，本报告两者都记录并标注了版本；③ 除 Kiro 外，各框架模板原文均为官方仓库/文档站一手文件；④ 未做实际使用验证，所有「实际样例长度」均来自官方或第三方已公开的样例与实测记录；⑤ 本报告对「低智力模型适配性」的判据（0.2 节 C1–C9）为调研者自建，框架本身的官方表述中并不存在该分类。
