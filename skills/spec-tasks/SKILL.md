---
kind: sub-skill  # helper sub-skill invoked within build-plan's stage; metrics covered by orchestrator per plan S4
name: spec-tasks
description: 将已验证的 spec.md 和 plan.md 转换为依赖排序的、可执行的任务列表 tasks.md，支持 --stage N 阶段分组。改编自 speckit-tasks，适配为 workflowhub 契约。
---

# spec-tasks

> 本文件改造自 speckit-tasks，适配为 workflowhub 契约：
> - 去 git 分支耦合，改用 task-id 参数推导产物路径；
> - 模板由 workflowhub 内置（`./templates/tasks-template.md`），不读目标项目 `.specify/`；
> - 保留依赖排序任务生成核心能力，移除 `.specify/` 和 git 分支推断。

## 输入

- **task-id**（必填，string 字面量）：任务 ID，用于推导产物路径 `specs/{task-id}/`。
  - **缺失时 fail-loud**：立即报错 "task-id required" 并停止执行，exit code 为非 0。不做分支推断回退，不做自动探测兼容层。
- **spec 路径**：由 task-id 推导，读取 `specs/{task-id}/spec.md`。
  - **spec.md 不存在时 fail-loud**：报错 "spec not found at specs/{task-id}/spec.md" 并停止，exit code 为非 0。
- **plan 路径**：由 task-id 推导，读取 `specs/{task-id}/plan.md`。
  - **plan.md 不存在时 fail-loud**：报错 "plan not found at specs/{task-id}/plan.md" 并停止，exit code 为非 0。
- **--stage N**（可选，正整数 N >= 1）：阶段分组参数。
  - 省略时不输出 `## Stage N` 阶段块标题，但仍按依赖关系排序并保留任务间的依赖标注。

## 工作流程

1. **检查 task-id 参数**：
   - 若 task-id 缺失或为空字符串 → 报错 "task-id required" 并停止（exit code 为非 0）。
   - 禁止执行任何 git 命令（含 checkout / branch）或 create-new-feature.sh 脚本。

2. **验证上游产物存在**：
   - 检查 `specs/{task-id}/spec.md` 是否存在；不存在时报错 "spec not found at specs/{task-id}/spec.md"，停止执行。
   - 检查 `specs/{task-id}/plan.md` 是否存在；不存在时报错 "plan not found at specs/{task-id}/plan.md"，停止执行。

3. **加载模板**：
   - 从 `skills/spec-tasks/templates/tasks-template.md`（仓库根路径，相对于本 SKILL.md 即 `./templates/tasks-template.md`）读取模板全文。
   - **若文件不存在**：报错 "template not found at skills/spec-tasks/templates/tasks-template.md" 并停止，不做 `.specify/` 回退，不调任何 speckit 脚本。

4. **读取 spec.md 并提取关键信息**：
   - 从 `specs/{task-id}/spec.md` 中提取：
     - 所有功能需求（FR）编号和描述；
     - 所有用户场景与用例（role / 前置条件 / 操作步骤 / 预期结果）；
     - 验收清单（success_criteria）。
   - 识别 FR 间的依赖关系（根据 spec 中的 "Given/When/Then" 场景和 FR 描述中的前置条件推断）。

5. **读取 plan.md 并提取技术上下文**：
   - 从 `specs/{task-id}/plan.md` 中提取实施计划信息：
     - 实现步骤（逐步骤描述）；
     - 文件清单（需创建或修改的文件）；
     - 验收映射（每步骤对应哪些 FR/AC）。

6. **生成依赖排序的任务列表**：
   - 按 FR 依赖关系排序生成任务——被依赖的任务排在前面，无依赖的任务可标记为并行（[P]）。
   - 每条任务必须：
     - 使用模板中的 checklist 格式：`- [ ] [TaskID] [P?] [Story?] Description with file path`；
     - 包含至少一个 FR 映射引用（`FR: FR-XXX-XXX`）；
     - 包含精确的文件路径。
   - 从前置步骤 5 中可为无法唯一确定任务的工作估算额外任务（如验证任务、范围边界检查任务）。

7. **处理 --stage N 阶段分组**（若传入）：
   - 解析 `--stage` 参数：N 必须为正整数（N >= 1）；若 N 不是正整数则报错 "invalid --stage value: N must be a positive integer" 并停止。
   - 按依赖关系将任务分组到有序阶段中——`--stage N` 表示"将任务划分为**最多 N 个有序阶段**"：
     - **阶段序号连续**：从 `## Stage 1` 开始，依次递增，不跳跃。
     - **实际阶段块数 <= N**：当任务的实际依赖深度不足 N 层时，只产出实际可分的阶段数，不得为凑齐 N 块而制造虚假阶段或割裂真实依赖链（如依赖链仅 2 层但传入 N=4，只产出 2 个 `## Stage` 块）。
     - 每个阶段以 `## Stage N` 二级标题起块，块内列出该阶段的任务项。
     - 同阶段内任务可并行。
   - 每条任务标注阶段序号和依赖关系，格式为：
     ```
     - [ ] T001 任务描述 (stage:1, depends:无)
     - [ ] T003 任务描述 (stage:2, depends:T001,T002)
     ```
   - **依赖有效性约束**：
     - depends 中引用的所有任务 ID 必须存在（在 tasks.md 的任务列表中可找到）；
     - 被依赖任务的 stage 序号必须 <= 当前任务的 stage 序号（阶段排前面或同阶段）。
   - 若省略 `--stage` 参数：
     - 不输出 `## Stage N` 阶段块标题；
     - 任务列表仍按依赖排序（被依赖的任务在前）；
     - 保留 `(stage:N, depends:<task-ids>)` 格式的依赖标注——所有任务归入单一隐式阶段，`depends` 标注仍用于体现依赖拓扑。

8. **按模板结构组织 tasks.md**：
   - 使用步骤 3 加载的模板结构，将生成的内容填入：
     - 模板中的 `{task-id}` 占位符替换为实际的 task-id 字面量；
     - 按模板的 Phase 结构（Setup → Foundational → User Story phases → Polish）组织任务；
     - 填充 Dependencies & Execution Order 章节（Phase Dependencies / User Story Dependencies / Parallel Opportunities）；
     - 填充 Implementation Strategy 章节。
   - 使用规范格式写入 tasks.md：`- [ ] T001 任务描述  FR: FR-XXX-XXX`；并行任务加 `[P]` 标记；按用户故事分组加上 `[US1]` 等标签。

9. **产物写入**：
   - 将 tasks.md 写入 `specs/{task-id}/tasks.md`（由 task-id 推导，不依赖 git branch）。
   - 路径中 `{task-id}` 用入参 task-id 字面量替换。

10. **报告完成**：
    - 输出 task-id、tasks.md 产物路径、总任务数、各用户故事任务数、并行机会数、各故事独立测试标准、建议 MVP 范围（通常仅 User Story 1）。
    - 格式验证：确认所有任务遵循 checklist 格式（checkbox、TaskID、标签、文件路径）。

## 去耦约束

本 skill 已从 speckit-tasks 解耦，硬性约束如下：
- **不执行 git 命令**：禁止执行任何 git 命令（含 checkout / branch / rev-parse）、create-new-feature.sh、check-prerequisites.sh 等脚本。
- **不读 `.specify/` 目录**：不从目标项目 `.specify/` 读取任何文件（模板、脚本、配置）。
- **不调用 speckit 脚本**：不执行任何 `speckit-*` 前缀的脚本或命令行工具。

> 注：以上声明为约束性禁止指令，不构成 speckit 脚本的"实际执行"——验证阶段按此 grep。

## 产出

- `specs/{task-id}/tasks.md`：依赖排序的任务列表（含 checklist 格式、FR 映射、阶段分组）

## 下一步

- **分析**：用 spec-analyze 对 spec/plan/tasks 三产物做跨文件一致性扫描。

## 通用原则

- 任务必须可独立执行——每条任务足够具体，LLM 无需额外上下文即可完成。
- 按用户故事组织——每个用户故事应可独立实现和测试。
- 优先考虑并行机会——不同文件、无依赖关系的任务标记 [P]。
- 每条任务至少引用一条 spec.md 中的 FR。
- 不碰 build-code / verify-code 等执行阶段的技能路径——tasks.md 只描述要做什么，不自己执行。

## --stage N 阶段分组约束速查

| 约束项 | 要求 |
|--------|------|
| N 值校验 | N 必须为正整数（N >= 1），否则报错停止 |
| 阶段序号 | 从 `## Stage 1` 开始，连续递增不跳跃 |
| 块数上限 | 实际阶段块数 <= N，依赖深度不足时块数可小于 N，不强制凑齐 N 块 |
| 任务标注 | 每条任务标注 `(stage:N, depends:<task-ids>)` |
| 依赖有效性 | depends 中引用的任务 ID 必须存在；被依赖任务的 stage 序号必须 <= 当前任务的 stage 序号 |
| 省略 --stage | 不输出 `## Stage N` 阶段块标题，但仍按依赖排序，保留 `(stage:N, depends:<task-ids>)` 依赖标注 |
