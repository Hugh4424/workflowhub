---
name: spec-specify
description: Create or update a feature specification from a natural language feature description. Adapted from speckit-specify for the workflowhub contract — no git branch coupling, task-id parameterized.
---

# spec-specify

> 本文件改造自 speckit-specify，适配为 workflowhub 契约：
> - 去 git 分支耦合，改用 task-id 参数推导产物路径；
> - 模板由 workflowhub 内置（`./templates/spec-template.md`），不读目标项目 `.specify/`；
> - 接 workflowhub M4 metrics 系统（`metrics/collector.mjs`）的 recordSkeleton + updateOwnResult。
> - 核心质量机制完整保留：关键概念提取、假设记录、≤3 个 NEEDS CLARIFICATION、FR 可测试、质量检查清单、Q1/Q2/Q3 交互格式（3-5 互斥选项+推荐）。

## 输入

- **task-id**（必填，string 字面量）：任务 ID，用于推导产物路径 `specs/{task-id}/`。
  - **缺失时 fail-loud**：立即报错 "task-id required"，停止执行，不推测、不静默回退、不做分支推断。
- **功能描述文本**：来自上游 make-decision 产出的 decision-log 或用户直接提供的自然语言功能描述。

如果描述缺失或不清晰，先问一个精准问题再继续。

## 工作流程

1. **检查 task-id 参数**：
   - 若 task-id 缺失或为空字符串 → 报错 "task-id required" 并停止（exit code 为非 0）。
   - 不执行 git checkout / git branch / create-new-feature.sh。

2. **加载模板**：
   - 从 `./templates/spec-template.md`（本 SKILL.md 同目录下的相对路径）读取模板全文。
   - **若文件不存在**：报错 "template not found at ./templates/spec-template.md" 并停止，不做 `.specify/` 回退，不调任何 speckit 脚本。

3. **调用 metrics 记录骨架**：
   - 指令调用 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字面量填 `spec-specify`。
   - 传入 execution_id / skill_or_stage / stage / skill_version / executed / tokens / duration_ms / rework_rounds / human_intervention / friction_ref 十个核心字段种子：

   ```json
   {
     "execution_id": "<uuid>",
     "skill_or_stage": "spec-specify",
     "stage": "spec-specify",
     "skill_version": "1.0.0",
     "executed": true,
     "tokens": null,
     "duration_ms": null,
     "rework_rounds": 0,
     "human_intervention": false,
     "friction_ref": null
   }
   ```

   - metrics 写失败只 warn 不 throw，不阻断主流程。

4. **spec 生成步骤**（保留 speckit-specify 核心流程）：

   1. **提取关键概念**：从功能描述中识别角色（actors）、动作（actions）、数据（data）、约束（constraints）。
   2. **推断与假设**：对不明确点，基于上下文和行业惯例做合理推断，将每条推断及其来源（从功能描述的哪个部分推断）、理由（为什么选这个默认值）记录到 spec 的 `## 假设` 段。
   3. **[NEEDS CLARIFICATION] 标记**：
      - 仅当选择显著影响 spec 范围/安全/UX 且无合理默认值时使用。
      - **上限 3 个**。超过 3 个时，按优先级保留最重要的 3 个（范围 > 安全/隐私 > 用户体验 > 技术细节），其余做合理推断。
   4. **填充 spec**：按模板章节结构逐章填充，用功能描述中的具体内容替换占位注释。
   5. **FR 可测试性**：每条功能需求（FR）必须可测试、可验证。模糊需求应被"testable and unambiguous"检查项检出。

5. **三档裁剪指令**：
   - **A 档（硬门）**：以下五章必填，不可跳过——用户场景与用例、功能需求、不做和隐性必达、验收清单及未决问题、影响范围。
   - **B 档（条件触发）**：模块划分、关键实体、数据和生命周期、兼容性预留——仅在功能涉及对应内容时填写，不触发的内容标"本期不涉及（理由：功能无 XX 需要）"并去除非空壳。
   - **C 档（可精简）**：速读卡、问题陈述、背景目标和边界——必须填写但篇幅可控，各自 1-2 段。

6. **产物写入**：
   - 将 spec 写入 `specs/{task-id}/spec.md`（由 task-id 推导，不依赖 git branch）。
   - 路径中 `{task-id}` 用入参 task-id 字面量替换。

7. **质量检查清单生成**：
   - 生成文件 `specs/{task-id}/checklists/requirements.md`，含以下检查项：

     ```markdown
     # 规格质量检查清单：[功能名]

     用于在进入 plan 阶段前验证 spec 的完整性和质量。

     ## 内容质量

     - [ ] 无实现细节泄露（无编程语言、框架、API 名称）
     - [ ] 聚焦用户价值与业务需求
     - [ ] 非技术干系人可读
     - [ ] 所有必填章节已完成

     ## 需求完整性

     - [ ] 所有 [NEEDS CLARIFICATION] 标记已解决
     - [ ] 所有功能需求可测试、无歧义
     - [ ] 成功标准可度量
     - [ ] 成功标准不含实现细节
     - [ ] 所有验收场景已定义
     - [ ] 边界情况已标识
     - [ ] 范围已明确界定
     - [ ] 依赖和假设已记录

     ## 功能就绪

     - [ ] 每条功能需求有明确验收标准
     - [ ] 用户场景覆盖主要流程
     - [ ] 功能满足成功标准中定义的可度量目标
     - [ ] 无实现细节泄漏进规格书
     ```

8. **[NEEDS CLARIFICATION] 交互格式**（Q1/Q2/Q3，保留 speckit-specify 原格式）：

   当 spec 中存在 [NEEDS CLARIFICATION] 标记时：
   - **一次性呈现全部题目**（最多 3 题），编号 Q1、Q2、Q3。
   - **每题格式**：
     - 所在章节及上下文（引用 spec 原文）
     - 待澄清问题
     - 3-5 个互斥选项（表格：选项 | 答案 | 影响），含推荐项（行标 **推荐**）+ 简短理由
     - 等待用户一次性回答所有题目（如 "Q1: A, Q2: B, Q3: Custom - xxx"）
   - 用户作答后，用其选择替换 spec 中对应的 [NEEDS CLARIFICATION] 标记。
   - 澄清完成后进入步骤 9 验证检查清单。

9. **验证检查清单**：对照检查清单逐项审查 spec：
   - 若全部通过：标记 checklist 完成。
   - 若有非 [NEEDS CLARIFICATION] 类失败项（如缺少验收场景、FR 不可测试）：
     1. 更新 spec 解决各问题，最多迭代 3 次；
     2. 3 次后仍未通过，记录剩余问题至 checklist notes 并警告用户。
   - **[NEEDS CLARIFICATION] 类检查项**：不得通过更新 spec 自行消解澄清标记。若检查清单的"所有 [NEEDS CLARIFICATION] 标记已解决"项尚未通过，必须返回步骤 8 用 Q1/Q2/Q3 呈现给用户，或保持失败并注明"等待用户回答"。禁止通过推断替换 [NEEDS CLARIFICATION] 标记来绕过澄清。

10. **调用 metrics 更新**：
    - 指令调用 `metrics/collector.mjs` 的 `updateOwnResult`，更新 executed / tokens / duration_ms 等实际值。
    - stage 字段保持 `spec-specify`。
    - 写失败只 warn 不 throw。

11. **报告完成**：输出 task-id、spec 产物路径、checklist 结果、是否可就绪进入下一阶段（spec-clarify 或 build-plan）。

## 去耦约束

本 skill 已从 speckit-specify 解耦，硬性约束如下：
- **不执行 git 命令**：不执行 git checkout / git branch / git fetch / git ls-remote / create-new-feature.sh 或任何等效 git 操作。
- **不读 `.specify/` 目录**：不从目标项目 `.specify/` 读取任何文件（模板、脚本、配置）。
- **不调用 speckit 脚本**：不执行任何 `speckit-*` 前缀的脚本或命令行工具。

> 注：以上声明为约束性禁止指令，不构成 speckit 脚本的"实际执行"——验证阶段按此 grep。

## 产出

- `specs/{task-id}/spec.md`：结构化功能规格书
- `specs/{task-id}/checklists/requirements.md`：质量检查清单

## 下一步

- **澄清**：用 spec-clarify 消除歧义。
- **编排**：build-spec SKILL.md 将本 skill 作为第一步，output 为下游 spec-clarify 的输入。

## 通用原则

- 关注**用户需要什么**（WHAT）和**为什么**（WHY），不关注**怎么实现**（HOW）——不提技术栈、API、代码结构。
- 面向业务干系人撰写，非开发者。
- 不做嵌入 spec 内部的 checklist（那是独立 skill 的产出）。
- 成功标准必须：可度量（含具体指标）、技术无关（不提框架/语言/数据库）、用户视角（从用户/业务角度描述结果）、可验证（无需了解实现细节即可检验）。

### 成功标准示例

**好**：
- "用户可在 3 分钟内完成结账"
- "系统支持 10,000 并发用户"
- "95% 搜索在 1 秒内返回结果"

**差**（含实现细节）：
- "API 响应时间低于 200ms"（太技术化）
- "数据库承载 1000 TPS"（实现细节）
- "React 组件高效渲染"（框架特定）

### [NEEDS CLARIFICATION] 优先级

当需要超过 3 个 NEEDS CLARIFICATION 时，保留优先级：范围 > 安全/隐私 > 用户体验 > 技术细节。其余做合理推断。

### 合理默认值示例

以下不必提问，直接取合理默认值（全部采用产品/领域口径，不写具体技术栈、协议或框架）：
- 数据保留：行业的通行做法
- 性能目标：行业同类产品常见体验水准（未指定时）
- 错误处理：用户友好提示 + 适当降级
- 认证方式：沿用现有产品认证机制；若无现有机制则标记 NEEDS CLARIFICATION
- 集成模式：沿用已有集成通道；若无则假定为已有模块间协作方式，跨系统集成需澄清
