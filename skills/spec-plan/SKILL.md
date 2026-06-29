---
kind: sub-skill  # helper sub-skill invoked within build-plan's stage; metrics covered by orchestrator per plan S4
name: spec-plan
description: Generate an implementation plan from a feature specification. Adapted from speckit-plan for the workflowhub contract — no git branch coupling, task-id parameterized, template loaded from internal path.
---

# spec-plan

> 本文件改造自 speckit-plan，适配为 workflowhub 契约：
> - 去 git 分支耦合，改用 task-id 参数推导产物路径；
> - 模板由 workflowhub 内置（`skills/spec-plan/templates/plan-template.md`），不读目标项目 `.specify/`；
> - 输入取自上游 build-spec 产出的 spec.md，输出 plan.md 到 `specs/{task-id}/plan.md`。
> - 核心规划能力保留：从 spec 提取 Technical Context、填充 Constitution Check（21 条）、生成 Implementation Steps、F10 Gate、Verification Mapping。

## 输入

- **task-id**（必填，string 字面量）：任务 ID，用于推导产物路径 `specs/{task-id}/`。
  - **缺失时 fail-loud**：立即报错 "task-id required"，停止执行，不推测、不静默回退、不做分支推断。
  - **不执行 git 命令**：不执行 git checkout / git branch / create-new-feature.sh / setup-plan.sh 或任何等效 git 操作。

如果 task-id 缺失或为空字符串，报错 "task-id required" 并停止（exit code 为非 0）。

## 工作流程

1. **检查 task-id 参数**：
   - 若 task-id 缺失或为空字符串 → 报错 "task-id required" 并停止（exit code 为非 0）。
   - 不执行任何 git 操作。

2. **检查 spec.md 是否存在**：
   - 推导路径 `specs/{task-id}/spec.md`。
   - 若文件不存在 → 报错 "spec not found at specs/{task-id}/spec.md" 并停止（exit code 为非 0）。

3. **加载模板**：
   - 从 `skills/spec-plan/templates/plan-template.md`（workflowhub 内部路径）读取模板全文。
   - **若文件不存在**：报错 "template not found at skills/spec-plan/templates/plan-template.md" 并停止，不做 `.specify/` 回退。

4. **填充 plan.md 步骤**（保留 speckit-plan 核心流程，去 `.specify/` 和 git 依赖）：

   1. **提取 Technical Context**：从 spec.md 中逐字段识别以下技术环境信息，填入模板 `## Technical Context` 章节：
      - **Language/Version**：实现语言及版本（如 `Node.js v20`）
      - **Primary Dependencies**：主要依赖项（如 `express`；无依赖写 `"None"`）
      - **Storage**：产物/数据存储方式（如 `Filesystem — specs/{task-id}/`）
      - **Testing**：测试框架与命令（如 `npm test`）
      - **Target Platform**：目标运行环境（如 `Linux server`、`CI/CD pipeline`）
      - **Project Type**：项目类型（如 `AI workflow orchestration tool`）
      - **Performance Goals**：性能目标（不可得写 `"N/A"`）
      - **Constraints**：约束条件（如 `文件数量限制`、`宪法合规`）
      - **Scale/Scope**：改动规模估算（如 `3 new files, ~500 lines`）
      每个字段必须从 spec.md 提取或写 `"N/A"` + 原因。不可确定项标记为 `"NEEDS CLARIFICATION"` 并在 Complexity Tracking 中记录。**绝对禁止凭空编造**（不可得不编）。

   2. **填充 Constitution Check**：从 `constitution-checklist.md` 读取 21 条（F1-F10 / Q1-Q3 / S1-S8），逐条填入模板 `## Constitution Check` 章节。每条含 `[x]` 或 `[ ]` 勾选状态 + 判据文字。21 条必须全部在场，不得缺条。

   3. **提取 Project Structure**：根据 spec 中的模块划分和影响范围，推导需要创建或修改的文件树，标注 NEW/MODIFY/UNCHANGED，填入 `## Project Structure` 章节。

   4. **生成 Implementation Steps**：将 spec 中的 User Scenarios 和 FR 转化为有序的实施步骤，按 Phase 分组填入模板 `## Implementation Steps`：
      - **Phase 1: Setup / Foundation** — 基础设施、依赖安装、配置、项目骨架
      - **Phase 2: Core Implementation** — 按 User Story 或 FR 优先级排列的核心功能实现
      - **Phase 3: Polish / Verification** — 收尾、打磨、测试补充、文档更新
      每个 Phase 包含若干 Step，每步说明：做什么、涉及哪些文件、映射到哪些 FR。Phase 分组确保实施有清晰的里程碑和依赖顺序。

   5. **检查 Scope Boundary**：根据 spec 中的 FR-SCOPE 要求，在 `### Scope Boundary Verification` 下明确列出不可触碰的文件和路径（如 `workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md` 等）。

   6. **生成 Verification Mapping**：将每个 Implementation Step 映射到对应的 FR 编号和 AC（验收标准）编号，填入 `## Verification Mapping` 章节。

   7. **Complexity Tracking**：如果实现设计存在宪法违规需说明的情况，填入 `## Complexity Tracking` 章节；无违规时填 "No constitution violations requiring justification."。

5. **F10 Anti-Over-Engineering Gate**：
   - 对本计划中提出的每一个新机制，回答 F10 gate 四问：
     1. **What real threat does this defend against?**（防御的真实威胁是什么？）
     2. **Does any existing mechanism already cover it?**（已有机制是否覆盖？）
     3. **Can it be bypassed?**（可否被绕过？）
     4. **What is the long-term maintenance cost?**（长期维护成本如何？）
   - 将评估结果填入模板 `## F10 Anti-Over-Engineering Gate` 章节表格，每行标注 KEEP 或 PRUNE。

6. **产物写入**：
   - 将填充完成的 plan 写入 `specs/{task-id}/plan.md`（由 task-id 推导，不依赖 git branch）。
   - 路径中 `{task-id}` 用入参 task-id 字面量替换。

7. **报告完成**：输出 task-id、plan.md 产物路径、Constitution Check 勾选状态（`[x]` 数 / 21）、F10 Gate 机制评估数。

## 去耦约束

本 skill 已从 speckit-plan 解耦，硬性约束如下：
- **不执行 git 命令**：不执行 git checkout / git branch / git fetch / git ls-remote / create-new-feature.sh / setup-plan.sh 或任何等效 git 操作。
- **不读 `.specify/` 目录**：不从目标项目 `.specify/` 读取任何文件（模板、脚本、配置）。
- **模板从 workflowhub 内部加载**：模板路径固定为 `skills/spec-plan/templates/plan-template.md`，不做 `.specify/` 回退。

## 产出

- `specs/{task-id}/plan.md`：结构化实施计划，含 Summary、Technical Context、Constitution Check（21 条）、Project Structure、Implementation Steps、F10 Gate、Verification Mapping。

## 下一步

- **生成 tasks**：用 spec-tasks 将 plan.md 分解为依赖排序的任务列表。
- **编排**：build-plan SKILL.md 将本 skill 作为流程步骤之一，output 为下游 spec-tasks 和 spec-analyze 的输入。
