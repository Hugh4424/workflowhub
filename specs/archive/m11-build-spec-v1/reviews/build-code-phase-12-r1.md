# codex advisor artifact

- Provider: codex
- Exit code: 0
- Created at: 2026-06-28T13:47:00.419Z

## Original task

You are doing a heterologous, independent, cross-engine code review of two NEW prompt-only skill files for workflowhub milestone M11 build-code Phase 1+2. You are NOT the author. Be adversarial and concrete.

CONTEXT: M11 ports two speckit skills into workflowhub as prompt-only SKILL.md files (no .mjs):
- spec-specify (workflows/spec-specify/SKILL.md + templates/spec-template.md): adapted from speckit-specify. Must: accept required task-id param (fail-loud if missing), load template from ./templates/spec-template.md (fail-loud if absent), output specs/{task-id}/spec.md + checklists/requirements.md, preserve speckit quality mechanisms (key-concept extraction, assumption recording, <=3 NEEDS CLARIFICATION with Q1/Q2/Q3 3-5-option+recommendation format, testable FRs, 3-tier tailoring), decouple from git (NO git checkout/branch/create-new-feature.sh, NO reading .specify/, NO speckit script calls), wire metrics (recordSkeleton + updateOwnResult, stage=spec-specify).
- spec-clarify (workflows/spec-clarify/SKILL.md): adapted from speckit-clarify. Must: accept task-id/spec-path (fail-loud), preserve ALL 10 ambiguity dimensions each tagged Clear/Partial/Missing, one-question-at-a-time discipline, max 5 questions, per-question recommendation+rationale+2-5 options, incremental spec update (## Clarifications), coverage summary (Resolved/Deferred/Clear/Outstanding), decouple (NO check-prerequisites.sh, NO .specify/, NO git), wire metrics (stage=spec-clarify).

Project constitution: thin-core, narrow-contract, simple-first, let-it-crash (fail-loud no hidden fallback), record-fact-not-block, no over-engineering (F10).

Review the diff below. Judge: (1) Are speckit quality mechanisms genuinely preserved, not gutted? (2) Is decoupling real (no residual git/.specify/script dependency in the actual instructions, vs prohibition declarations which are required)? (3) task-id fail-loud actually specified? (4) Any instruction that contradicts itself or the constitution? (5) Template usable and complete? Be precise. Output top line `verdict: pass` | `verdict: revise_required` | `verdict: escalate_to_human`, then blocking findings with file:line, then non-blocking notes.

=== GIT DIFF (Phase 1+2) ===
diff --git a/workflows/spec-clarify/SKILL.md b/workflows/spec-clarify/SKILL.md
new file mode 100644
index 0000000..044db6c
--- /dev/null
+++ b/workflows/spec-clarify/SKILL.md
@@ -0,0 +1,218 @@
+---
+name: spec-clarify
+description: 对当前 task 的 spec 执行 10 维歧义扫描，通过最多 5 题交互澄清（一次一题+推荐），逐题增量更新 spec，完成时输出覆盖率摘要。改造自 speckit-clarify，适配为 workflowhub 契约。
+---
+
+# spec-clarify
+
+> 改造自 `~/.claude/skills/speckit-clarify/SKILL.md`，适配为 workflowhub 契约：
+> - 去 git / check-prerequisites / .specify 耦合
+> - 以 task-id 参数化定位 spec
+> - 保全文 speckit 质量机制
+
+## 用途
+
+spec 已存在但需要针对性澄清后再推进——在 build-plan 之前执行。
+
+## 输入
+
+- **task-id**（必填）：用于推导 spec 路径 `specs/{task-id}/spec.md`。缺失时 fail-loud："task-id required" 并停止。
+- **spec-path**（可选）：显式指定 spec 文件路径。提供时直接使用，不通过 task-id 推导。
+- 用户的澄清意图或约束（来自对话上下文）。
+
+若 task-id 和 spec-path 均缺失，fail-loud："缺少 task-id 或 spec-path，无法定位 spec" 并停止。
+
+## spec 定位
+
+- 优先使用 spec-path（提供时）。
+- 否则通过 task-id 推导：`specs/{task-id}/spec.md`。
+- **不执行** git 命令、不调 check-prerequisites.sh、不读 `.specify/` 目录或 `.specify/feature.json`。
+- 若 spec 文件不存在，指示先执行 spec-specify 生成 spec，不在此 skill 内创建新 spec。
+
+## 执行步骤
+
+### 1) 加载 spec 文件并执行结构化歧义扫描
+
+读取 spec 文件全文。按以下 10 维分类逐维扫描，每维标注状态 **Clear / Partial / Missing**。生成内部覆盖度地图用于优先级排序（不直接输出原始地图，除非无需提问）。
+
+**10 维歧义分类：**
+
+**1. Functional Scope & Behavior**
+- 核心用户目标与成功标准
+- 显式不做范围声明
+- 用户角色/角色区分
+
+**2. Domain & Data Model**
+- 实体、属性、关系
+- 标识与唯一性规则
+- 生命周期/状态转换
+- 数据量级/规模假设
+
+**3. Interaction & UX Flow**
+- 关键用户旅程/操作序列
+- 错误态/空态/加载态
+- 可访问性或本地化说明
+
+**4. Non-Functional Quality Attributes**（1 个顶级维度，含 6 子项）
+- 性能（延迟、吞吐量目标）
+- 可扩展性（水平/垂直扩展、限制）
+- 可靠性与可用性（运行时间、恢复预期）
+- 可观测性（日志、指标、追踪信号）
+- 安全与隐私（认证/授权、数据保护、威胁假设）
+- 合规/监管约束（如有）
+
+**5. Integration & External Dependencies**
+- 外部服务/API 及其失败模式
+- 数据导入/导出格式
+- 协议/版本假设
+
+**6. Edge Cases & Failure Handling**
+- 负向场景
+- 限流/节流
+- 冲突解决（如并发编辑）
+
+**7. Constraints & Tradeoffs**
+- 技术约束（语言、存储、托管）
+- 显式取舍或拒绝的替代方案
+
+**8. Terminology & Consistency**
+- 规范术语表
+- 已弃用同义词
+
+**9. Completion Signals**
+- 验收标准可测试性
+- 可度量的 Definition of Done 指标
+
+**10. Misc / Placeholders**
+- TODO 标记/未解决决策
+- 模糊形容词（"健壮""直观"）缺乏量化
+
+对每维标注 Partial 或 Missing 的类别添加候选问题，除非：
+- 澄清不会实质改变实现或验证策略
+- 信息更适合推迟到规划阶段（内部备注）
+
+### 2) 生成优先级候选问题队列
+
+内部生成优先级排序的候选澄清问题队列（最多 10 个候选），按 (Impact * Uncertainty) 启发式排序。不一次性全部输出。
+
+约束：
+- 全程最多 5 题已问。
+- 每题须可回答为：多选题（2-5 互斥选项）或短回答（<=5 词）。
+- 仅纳入对架构、数据建模、任务分解、测试设计、UX 行为、运维就绪或合规验证有实质影响的题目。
+- 保证分类覆盖平衡：优先覆盖最高影响的未解决类别；避免在单个高影响领域（如安全态势）未解决时问两个低影响题。
+- 排除已答、无关风格偏好或纯计划层执行细节（除非阻塞正确性）。
+- 优先选择能减少下游返工风险或防止验收测试错位的澄清。
+- 若超过 5 个类别未解决，选 (Impact * Uncertainty) 最高的前 5。
+
+### 3) 交互澄清循环
+
+**一次只呈现一题**（ONE question at a time），不提前透露后续题目。
+
+**多选题格式：**
+- 分析所有选项，基于项目类型最佳实践/同类实现常见模式/安全与性能风险降低/spec 中可见目标与约束，确定最佳选项。
+- **Recommended: Option [X] — <1-2 句理由>**
+- 然后以 Markdown 表格呈现所有选项：
+
+| Option | Description |
+| ------ | ----------- |
+| A      | <选项 A 描述> |
+| B      | <选项 B 描述> |
+| C      | <选项 C 描述>（最多 5 项） |
+| Short  | 提供不同短回答（<=5 词） |
+
+- 表格后追加："回复选项字母（如 'A'），'yes' / 'recommended' 采纳推荐，或提供自己的短回答。"
+
+**短回答格式（无有意义离散选项时）：**
+- **Suggested: <建议答案> — <简短理由>**
+- 然后输出："Format: Short answer (<=5 words). 回复 'yes' / 'suggested' 采纳建议，或提供自己的回答。"
+
+**用户回答后：**
+- 若回复 "yes" / "recommended" / "suggested"，采用之前声明的推荐/建议为答案。
+- 否则验证答案映射到某选项或符合 <=5 词约束。
+- 若歧义，快速消歧（仍属同一题，不推进）。
+- 确认后记录到工作内存（暂不写盘），推进到下一题。
+
+**停止提问条件：**
+- 所有关键歧义提前解决（剩余队列不再必要）
+- 用户发出完成信号（"done""good""no more"）
+- 达到 5 题上限
+
+若起始即无可问题目，立即报告"未检测到需正式澄清的关键歧义"，输出覆盖度摘要后建议推进。
+
+### 4) 增量更新 spec
+
+每接受一题答案后立即写入 spec：
+
+- **维护 spec 内存表示**（启动时加载一次）及原始文件内容。
+- **首个答案写入时**：
+  - 确保 spec 存在 `## Clarifications` 节（若缺失，创建在概述/上下文节之后）。
+  - 在其下创建（若不存在）`### Session YYYY-MM-DD` 子标题（当天日期）。
+- **追加一行**：`- Q: <问题> → A: <最终答案>`
+- **立即将澄清整合到最相关章节**：
+  - 功能歧义 → 更新或新增功能需求（FR）条目
+  - 用户交互/角色区分 → 更新用户故事或角色相关节，附加澄清的角色、约束或场景
+  - 数据形态/实体 → 更新数据模型（添加字段、类型、关系），保留顺序
+  - 非功能约束 → 在非功能/质量属性节添加或修改可度量标准（将模糊形容词转为指标或显式目标）
+  - 边缘情况/负面流程 → 在边界情况/错误处理节新增条目
+  - 术语冲突 → 全文规范化术语；仅在必要时保留原称（加注"（旧称 "X"）"一次）
+- 若澄清导致早期歧义陈述失效，**替换而非重复**；不留过时矛盾文字。
+- **每题答案后保存 spec 文件**（原子覆盖），以降低上下文丢失风险。
+- 保持格式：不重排无关章节，不变更标题层级。
+- 每条澄清保持简洁可测试（避免叙事膨胀）。
+
+### 5) 校验
+
+每题写入后及最终校验：
+- Clarifications 节每题恰好一条记录（无重复）
+- 已问（已采纳）问题总数 ≤ 5
+- 已更新节无不应用新答案解决的模糊占位符
+- 无矛盾遗留（已移除的替代选项不再出现）
+- Markdown 结构有效；仅允许新增 `## Clarifications`、`### Session YYYY-MM-DD`
+- 术语一致性：所有更新章节使用同一规范术语
+
+### 6) 完成报告
+
+提问循环结束后输出：
+
+- 已问与已回答问题数
+- 更新后的 spec 路径
+- 触及的章节列表
+- **覆盖率摘要表格**：每维标注状态——
+  - **Resolved**：原为 Partial/Missing，本次已解决
+  - **Deferred**：超出题数配额或更适合规划阶段
+  - **Clear**：原本已充分
+  - **Outstanding**：仍为 Partial/Missing 但影响较低
+- 若存在 Outstanding 或 Deferred，建议是否继续推进 build-plan 或后续重新运行 spec-clarify。
+- 建议下一步动作。
+
+### 行为规则
+
+- 若无有意义的歧义（或全部潜在问题影响低），回复"未检测到需正式澄清的关键歧义"并建议推进。
+- 若 spec 文件缺失，指示先执行 spec-specify（不在此创建新 spec）。
+- **全程不超过 5 题**（单题澄清重试不计入新题）。
+- 避免推测性技术栈问题，除非缺失会阻塞功能清晰度。
+- 尊重用户提前终止信号（"stop""done""proceed"）。
+- 若未问任何题即覆盖完整，输出压缩覆盖度摘要（全部 Clear）后建议推进。
+- 若配额用尽仍有未解决的高影响类别，在 Deferred 中显式标注并附理由。
+
+## metrics 接入
+
+- **阶段开始时**：调 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字段填 `spec-clarify`。
+- **阶段结束时**：调 `updateOwnResult`，写失败只 warn 不 throw。
+
+## 去耦约束
+
+本 skill 不依赖 speckit 基础设施：
+- 不调 `check-prerequisites.sh`
+- 不读 `.specify/` 目录或 `.specify/feature.json`
+- 不执行 git 命令
+
+spec 定位全部通过 task-id 推导或显式 spec-path，不依赖分支环境。
+
+## 输出物
+
+- 更新后的 `specs/{task-id}/spec.md`（含澄清追加和章节整合）
+
+## 下一步
+
+澄清完成后，推进到 **build-plan** 生成实现计划。
diff --git a/workflows/spec-specify/SKILL.md b/workflows/spec-specify/SKILL.md
new file mode 100644
index 0000000..ff41375
--- /dev/null
+++ b/workflows/spec-specify/SKILL.md
@@ -0,0 +1,164 @@
+---
+name: spec-specify
+description: Create or update a feature specification from a natural language feature description. Adapted from speckit-specify for the workflowhub contract — no git branch coupling, task-id parameterized.
+---
+
+# spec-specify
+
+> 本文件改造自 `~/.claude/skills/speckit-specify/SKILL.md`，适配为 workflowhub 契约：
+> - 去 git 分支耦合，改用 task-id 参数推导产物路径；
+> - 模板由 workflowhub 内置（`./templates/spec-template.md`），不读目标项目 `.specify/`；
+> - 接 workflowhub M4 metrics 系统（`metrics/collector.mjs`）的 recordSkeleton + updateOwnResult。
+> - 核心质量机制完整保留：关键概念提取、假设记录、≤3 个 NEEDS CLARIFICATION、FR 可测试、质量检查清单、Q1/Q2/Q3 交互格式（3-5 互斥选项+推荐）。
+
+## 输入
+
+- **task-id**（必填，string 字面量）：任务 ID，用于推导产物路径 `specs/{task-id}/`。
+  - **缺失时 fail-loud**：立即报错 "task-id required"，停止执行，不推测、不静默回退、不做分支推断。
+- **功能描述文本**：来自上游 make-decision 产出的 decision-log 或用户直接提供的自然语言功能描述。
+
+如果描述缺失或不清晰，先问一个精准问题再继续。
+
+## 工作流程
+
+1. **检查 task-id 参数**：
+   - 若 task-id 缺失或为空字符串 → 报错 "task-id required" 并停止（exit code 为非 0）。
+   - 不执行 git checkout / git branch / create-new-feature.sh。
+
+2. **加载模板**：
+   - 从 `./templates/spec-template.md`（本 SKILL.md 同目录下的相对路径）读取模板全文。
+   - **若文件不存在**：报错 "template not found at ./templates/spec-template.md" 并停止，不做 `.specify/` 回退，不调任何 speckit 脚本。
+
+3. **调用 metrics 记录骨架**：
+   - 指令调用 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字面量填 `spec-specify`。
+   - 传入 execution_id / skill_or_stage / stage / skill_version / executed / tokens / duration_ms / rework_rounds / human_intervention / friction_ref 十个核心字段种子。
+   - metrics 写失败只 warn 不 throw，不阻断主流程。
+
+4. **spec 生成步骤**（保留 speckit-specify 核心流程）：
+
+   1. **提取关键概念**：从功能描述中识别角色（actors）、动作（actions）、数据（data）、约束（constraints）。
+   2. **推断与假设**：对不明确点，基于上下文和行业惯例做合理推断，将推断依据记录到 spec 的"假设"段。
+   3. **[NEEDS CLARIFICATION] 标记**：
+      - 仅当选择显著影响 spec 范围/安全/UX 且无合理默认值时使用。
+      - **上限 3 个**。超过 3 个时，按优先级保留最重要的 3 个（范围 > 安全/隐私 > 用户体验 > 技术细节），其余做合理推断。
+   4. **填充 spec**：按模板章节结构逐章填充，用功能描述中的具体内容替换占位注释。
+   5. **FR 可测试性**：每条功能需求（FR）必须可测试、可验证。模糊需求应被"testable and unambiguous"检查项检出。
+
+5. **三档裁剪指令**：
+   - **A 档（硬门）**：以下五章必填，不可跳过——用户场景与用例、功能需求、不做和隐性必达、验收清单及未决问题、影响范围。
+   - **B 档（条件触发）**：模块划分、关键实体、数据和生命周期、兼容性预留——仅在功能涉及对应内容时填写，不触发的内容标"本期不涉及（理由：功能无 XX 需要）"并去除非空壳。
+   - **C 档（可精简）**：速读卡、问题陈述、背景目标和边界——必须填写但篇幅可控，各自 1-2 段。
+
+6. **产物写入**：
+   - 将 spec 写入 `specs/{task-id}/spec.md`（由 task-id 推导，不依赖 git branch）。
+   - 路径中 `{task-id}` 用入参 task-id 字面量替换。
+
+7. **质量检查清单生成**：
+   - 生成文件 `specs/{task-id}/checklists/requirements.md`，含以下检查项：
+
+     ```markdown
+     # 规格质量检查清单：[功能名]
+
+     用于在进入 plan 阶段前验证 spec 的完整性和质量。
+
+     ## 内容质量
+
+     - [ ] 无实现细节泄露（无编程语言、框架、API 名称）
+     - [ ] 聚焦用户价值与业务需求
+     - [ ] 非技术干系人可读
+     - [ ] 所有必填章节已完成
+
+     ## 需求完整性
+
+     - [ ] 所有 [NEEDS CLARIFICATION] 标记已解决
+     - [ ] 所有功能需求可测试、无歧义
+     - [ ] 成功标准可度量
+     - [ ] 成功标准不含实现细节
+     - [ ] 所有验收场景已定义
+     - [ ] 边界情况已标识
+     - [ ] 范围已明确界定
+     - [ ] 依赖和假设已记录
+
+     ## 功能就绪
+
+     - [ ] 每条功能需求有明确验收标准
+     - [ ] 用户场景覆盖主要流程
+     - [ ] 功能满足成功标准中定义的可度量目标
+     - [ ] 无实现细节泄漏进规格书
+     ```
+
+8. **验证检查清单**：对照检查清单逐项审查 spec：
+   - 若全部通过：标记 checklist 完成。
+   - 若有失败项（含 [NEEDS CLARIFICATION] 未解决）：
+     1. 更新 spec 解决各问题，最多迭代 3 次；
+     2. 3 次后仍未通过，记录剩余问题至 checklist notes 并警告用户。
+
+9. **[NEEDS CLARIFICATION] 交互格式**（Q1/Q2/Q3，保留 speckit-specify 原格式）：
+
+   当 spec 中存在 [NEEDS CLARIFICATION] 标记时：
+   - **一次性呈现全部题目**（最多 3 题），编号 Q1、Q2、Q3。
+   - **每题格式**：
+     - 所在章节及上下文（引用 spec 原文）
+     - 待澄清问题
+     - 3-5 个互斥选项（表格：选项 | 答案 | 影响），含推荐项（行标 **推荐**）+ 简短理由
+     - 等待用户一次性回答所有题目（如 "Q1: A, Q2: B, Q3: Custom - xxx"）
+   - 用户作答后，用其选择替换 spec 中对应的 [NEEDS CLARIFICATION] 标记。
+   - 澄清完成后重新跑验证检查清单。
+
+10. **调用 metrics 更新**：
+    - 指令调用 `metrics/collector.mjs` 的 `updateOwnResult`，更新 executed / tokens / duration_ms 等实际值。
+    - stage 字段保持 `spec-specify`。
+    - 写失败只 warn 不 throw。
+
+11. **报告完成**：输出 task-id、spec 产物路径、checklist 结果、是否可就绪进入下一阶段（spec-clarify 或 build-plan）。
+
+## 去耦约束
+
+本 skill 已从 speckit-specify 解耦，硬性约束如下：
+- **不执行 git 命令**：不执行 git checkout / git branch / git fetch / git ls-remote / create-new-feature.sh 或任何等效 git 操作。
+- **不读 `.specify/` 目录**：不从目标项目 `.specify/` 读取任何文件（模板、脚本、配置）。
+- **不调用 speckit 脚本**：不执行任何 `speckit-*` 前缀的脚本或命令行工具。
+
+> 注：以上声明为约束性禁止指令，不构成 speckit 脚本的"实际执行"——验证阶段按此 grep。
+
+## 产出
+
+- `specs/{task-id}/spec.md`：结构化功能规格书
+- `specs/{task-id}/checklists/requirements.md`：质量检查清单
+
+## 下一步
+
+- **澄清**：用 spec-clarify 消除歧义。
+- **编排**：build-spec SKILL.md 将本 skill 作为第一步，output 为下游 spec-clarify 的输入。
+
+## 通用原则
+
+- 关注**用户需要什么**（WHAT）和**为什么**（WHY），不关注**怎么实现**（HOW）——不提技术栈、API、代码结构。
+- 面向业务干系人撰写，非开发者。
+- 不做嵌入 spec 内部的 checklist（那是独立 skill 的产出）。
+- 成功标准必须：可度量（含具体指标）、技术无关（不提框架/语言/数据库）、用户视角（从用户/业务角度描述结果）、可验证（无需了解实现细节即可检验）。
+
+### 成功标准示例
+
+**好**：
+- "用户可在 3 分钟内完成结账"
+- "系统支持 10,000 并发用户"
+- "95% 搜索在 1 秒内返回结果"
+
+**差**（含实现细节）：
+- "API 响应时间低于 200ms"（太技术化）
+- "数据库承载 1000 TPS"（实现细节）
+- "React 组件高效渲染"（框架特定）
+
+### [NEEDS CLARIFICATION] 优先级
+
+当需要超过 3 个 NEEDS CLARIFICATION 时，保留优先级：范围 > 安全/隐私 > 用户体验 > 技术细节。其余做合理推断。
+
+### 合理默认值示例
+
+以下不必提问，直接取合理默认值：
+- 数据保留：行业的通行做法
+- 性能目标：标准 web/移动应用预期（未指定时）
+- 错误处理：用户友好提示 + 适当降级
+- 认证方式：web 应用标准 session 或 OAuth2
+- 集成模式：RESTful API（除非另有说明）
diff --git a/workflows/spec-specify/templates/spec-template.md b/workflows/spec-specify/templates/spec-template.md
new file mode 100644
index 0000000..93cf37e
--- /dev/null
+++ b/workflows/spec-specify/templates/spec-template.md
@@ -0,0 +1,169 @@
+# 功能规格：[功能名]
+
+> 基于 SPEC.md 生成。本文件由 spec-specify 根据上游功能描述自动填充。
+
+**功能名**: `{task-id}`
+**来源**: 上游 decision-log 决策记录
+**状态**: 草稿
+<!-- 生成时替换 {task-id} 为实际的 task-id 字面量 -->
+
+## 速读卡（30 秒看懂这个需求）
+
+<!-- 一句话需求 + 核心改动点 + 最大影响面 + 验收信号。全部必填，但篇幅可控。 -->
+
+- **一句话需求**：<!-- 用一句话说清这个功能要做什么 -->
+- **核心改动点**：<!-- 2-5 条，每条一句话 -->
+- **最大影响面**：<!-- 哪个模块/子系统最受影响 -->
+- **验收信号**：<!-- 如何判断"做完了、做对了" -->
+
+## 1. 问题陈述
+
+<!-- 1-2 段。描述当前状态和待解决问题，不涉及解决方案。 -->
+
+当前：<!-- 现状描述 -->。
+
+问题：<!-- 痛点/差距 -->。
+
+## 2. 背景、目标和边界
+
+### 背景
+
+<!-- 为什么现在做、与已有系统的关系。 -->
+
+### 目标
+
+<!-- 本功能完成后能做到什么，用可验证结果描述。 -->
+
+### 非目标（明确不做）
+
+<!-- 本期明确不做的事项。每条单独一行。 -->
+1. <!-- 不做事项 1 -->
+2. <!-- 不做事项 2 -->
+
+## 3. 用户场景与用例
+
+<!-- 角色 + 操作步骤 + 预期结果。覆盖正常路径、失败路径、边界路径。
+     每条场景含：（1）场景名；（2）角色；（3）前置条件；（4）操作步骤；（5）预期结果。 -->
+
+### 场景一：[场景名]（正常路径）
+
+- **角色**：<!-- 谁执行这个操作 -->
+- **前置条件**：<!-- Given 状态 -->
+- **操作步骤**：<!-- When 做了什么 -->
+- **预期结果**：<!-- Then 发生了什么 -->
+
+### 场景二：[场景名]（失败/边界路径）
+
+- **角色**：<!-- 谁执行 -->
+- **前置条件**：<!-- Given -->
+- **操作步骤**：<!-- When -->
+- **预期结果**：<!-- Then -->
+
+<!-- 按需补充更多场景 -->
+
+## 4. 功能需求
+
+<!-- 按功能域分组，编号 FR-{域缩写}-NNN。每条 FR 必须可测试。
+     溯源规则：每条 FR 标注来源（decision-log 决策编号或上游描述）。
+
+     示例格式：
+     #### 域：XXXX
+     - **FR-XX-001**：[需求描述]。来源：D-XX-1。
+       - **场景**：Given xxx, When xxx, Then xxx。
+     - **FR-XX-002**：[需求描述]。来源：用户描述 §3。
+       - **场景**：Given xxx, When xxx, Then xxx。
+-->
+
+### 域：XXX（给人读的域说明）
+
+- **FR-XXX-001**：[需求描述]。来源：<!-- 填写来源 -->。
+  - **场景**：Given <!-- 前置 -->, When <!-- 操作 -->, Then <!-- 预期 -->。
+
+<!-- 按功能域补充更多 FR -->
+
+## 5. 模块划分（条件触发）
+
+<!-- 仅当功能涉及多模块时有此章节；不触发时填 "本期不涉及（理由：功能无多模块交互需要）"。
+     每模块写出：负责什么 / 对外接口 / 依赖谁 / 测试边界。 -->
+
+### [模块名]
+
+- **负责什么**：<!-- 一句话 -->
+- **对外接口**：<!-- 产什么/收什么 -->
+- **依赖谁**：<!-- 调用路径 -->
+- **测试边界**：<!-- 什么可独立测 -->
+
+## 6. 关键实体（条件触发）
+
+<!-- 仅当功能涉及数据实体时有此章节。每实体描述其字段和关系。
+     不触发时填 "本期不涉及（理由：功能无数据实体定义需要）"。 -->
+
+### [实体名]
+
+- **定义**：<!-- 一句话 -->
+- **字段**：<!-- 关键字段列表 -->
+- **关系**：<!-- 与其他实体的关联 -->
+
+## 7. 数据和生命周期（条件触发）
+
+<!-- 仅当功能涉及数据流或持久化时有此章节。
+     不触发时填 "本期不涉及（理由：功能无数据生命周期需要）"。 -->
+
+- **数据粒度**：<!-- 单次操作/单任务/全局 -->
+- **数据时效**：<!-- 实时/批/归档 -->
+- **存储位置**：<!-- 文件路径/数据库 -->
+- **清理策略**：<!-- 保留期/淘汰规则 -->
+
+## 8. 兼容性预留（条件触发）
+
+<!-- 仅当功能需向后兼容或未来扩展预留时有此章节。
+     不触发时填 "本期不涉及（理由：功能无兼容性/扩展预留需要）"。 -->
+
+- **向后兼容**：<!-- 对已有消费方的影响 -->
+- **扩展预留**：<!-- 为未来留的接口/字段/格式空间 -->
+
+## 9. 不做和隐性必达
+
+### 明确不做
+
+> 以下逐条继承自 decision-log 的非目标声明。design/plan/build 阶段不得逾越。
+
+1. <!-- 不做事项 -->
+2. <!-- 不做事项 -->
+
+### 隐性必达
+
+<!-- 不能明写在 FR 里但必须成立的约束。如：不改某个外部系统、不引入新类别的门禁、测试套件不全绿即失败。 -->
+
+- **隐性必达 1**：<!-- 约束描述 -->
+- **隐性必达 2**：<!-- 约束描述 -->
+
+## 10. 验收清单及未决问题
+
+### 验收检查（success_criteria）
+
+<!-- 逐条可手动或命令验证。每条含失败判据，均可判真伪。
+     格式：AC1 ... ACn，每条标注可追溯到哪条 FR。 -->
+
+- [ ] **AC1**：<!-- 验收条目描述。反向：[失败条件] --> ← FR-XX-001
+- [ ] **AC2**：<!-- 验收条目描述。反向：[失败条件] --> ← FR-XX-002
+
+### 未决风险和问题
+
+<!-- 开放问题列表。已决问题标注 ~~删除线~~ + 简记决定摘要。 -->
+
+- **~~未决 1（主题）—— 已决~~**：<!-- 决定摘要 -->
+- **未决 2（主题）**：<!-- 待处理问题及影响 -->
+
+## 11. 影响范围（业务性质）
+
+<!-- 列出受影响的功能模块/文件及变更类型。
+     格式：模块名 | 文件 | 变更类型（新增/修改/删除）| 影响说明 -->
+
+- **受影响功能：[名称]**
+  - 既有行为：<!-- 现在是什么样的 -->
+  - 本需求影响：<!-- 会变成什么样 -->
+  - 回归要点：<!-- 什么不能坏 -->
+
+- **可能受冲击的业务规则**：<!-- 如有 -->
+- **明确无影响**：<!-- 哪些模块/系统不受影响 -->

## Final prompt

You are doing a heterologous, independent, cross-engine code review of two NEW prompt-only skill files for workflowhub milestone M11 build-code Phase 1+2. You are NOT the author. Be adversarial and concrete.

CONTEXT: M11 ports two speckit skills into workflowhub as prompt-only SKILL.md files (no .mjs):
- spec-specify (workflows/spec-specify/SKILL.md + templates/spec-template.md): adapted from speckit-specify. Must: accept required task-id param (fail-loud if missing), load template from ./templates/spec-template.md (fail-loud if absent), output specs/{task-id}/spec.md + checklists/requirements.md, preserve speckit quality mechanisms (key-concept extraction, assumption recording, <=3 NEEDS CLARIFICATION with Q1/Q2/Q3 3-5-option+recommendation format, testable FRs, 3-tier tailoring), decouple from git (NO git checkout/branch/create-new-feature.sh, NO reading .specify/, NO speckit script calls), wire metrics (recordSkeleton + updateOwnResult, stage=spec-specify).
- spec-clarify (workflows/spec-clarify/SKILL.md): adapted from speckit-clarify. Must: accept task-id/spec-path (fail-loud), preserve ALL 10 ambiguity dimensions each tagged Clear/Partial/Missing, one-question-at-a-time discipline, max 5 questions, per-question recommendation+rationale+2-5 options, incremental spec update (## Clarifications), coverage summary (Resolved/Deferred/Clear/Outstanding), decouple (NO check-prerequisites.sh, NO .specify/, NO git), wire metrics (stage=spec-clarify).

Project constitution: thin-core, narrow-contract, simple-first, let-it-crash (fail-loud no hidden fallback), record-fact-not-block, no over-engineering (F10).

Review the diff below. Judge: (1) Are speckit quality mechanisms genuinely preserved, not gutted? (2) Is decoupling real (no residual git/.specify/script dependency in the actual instructions, vs prohibition declarations which are required)? (3) task-id fail-loud actually specified? (4) Any instruction that contradicts itself or the constitution? (5) Template usable and complete? Be precise. Output top line `verdict: pass` | `verdict: revise_required` | `verdict: escalate_to_human`, then blocking findings with file:line, then non-blocking notes.

=== GIT DIFF (Phase 1+2) ===
diff --git a/workflows/spec-clarify/SKILL.md b/workflows/spec-clarify/SKILL.md
new file mode 100644
index 0000000..044db6c
--- /dev/null
+++ b/workflows/spec-clarify/SKILL.md
@@ -0,0 +1,218 @@
+---
+name: spec-clarify
+description: 对当前 task 的 spec 执行 10 维歧义扫描，通过最多 5 题交互澄清（一次一题+推荐），逐题增量更新 spec，完成时输出覆盖率摘要。改造自 speckit-clarify，适配为 workflowhub 契约。
+---
+
+# spec-clarify
+
+> 改造自 `~/.claude/skills/speckit-clarify/SKILL.md`，适配为 workflowhub 契约：
+> - 去 git / check-prerequisites / .specify 耦合
+> - 以 task-id 参数化定位 spec
+> - 保全文 speckit 质量机制
+
+## 用途
+
+spec 已存在但需要针对性澄清后再推进——在 build-plan 之前执行。
+
+## 输入
+
+- **task-id**（必填）：用于推导 spec 路径 `specs/{task-id}/spec.md`。缺失时 fail-loud："task-id required" 并停止。
+- **spec-path**（可选）：显式指定 spec 文件路径。提供时直接使用，不通过 task-id 推导。
+- 用户的澄清意图或约束（来自对话上下文）。
+
+若 task-id 和 spec-path 均缺失，fail-loud："缺少 task-id 或 spec-path，无法定位 spec" 并停止。
+
+## spec 定位
+
+- 优先使用 spec-path（提供时）。
+- 否则通过 task-id 推导：`specs/{task-id}/spec.md`。
+- **不执行** git 命令、不调 check-prerequisites.sh、不读 `.specify/` 目录或 `.specify/feature.json`。
+- 若 spec 文件不存在，指示先执行 spec-specify 生成 spec，不在此 skill 内创建新 spec。
+
+## 执行步骤
+
+### 1) 加载 spec 文件并执行结构化歧义扫描
+
+读取 spec 文件全文。按以下 10 维分类逐维扫描，每维标注状态 **Clear / Partial / Missing**。生成内部覆盖度地图用于优先级排序（不直接输出原始地图，除非无需提问）。
+
+**10 维歧义分类：**
+
+**1. Functional Scope & Behavior**
+- 核心用户目标与成功标准
+- 显式不做范围声明
+- 用户角色/角色区分
+
+**2. Domain & Data Model**
+- 实体、属性、关系
+- 标识与唯一性规则
+- 生命周期/状态转换
+- 数据量级/规模假设
+
+**3. Interaction & UX Flow**
+- 关键用户旅程/操作序列
+- 错误态/空态/加载态
+- 可访问性或本地化说明
+
+**4. Non-Functional Quality Attributes**（1 个顶级维度，含 6 子项）
+- 性能（延迟、吞吐量目标）
+- 可扩展性（水平/垂直扩展、限制）
+- 可靠性与可用性（运行时间、恢复预期）
+- 可观测性（日志、指标、追踪信号）
+- 安全与隐私（认证/授权、数据保护、威胁假设）
+- 合规/监管约束（如有）
+
+**5. Integration & External Dependencies**
+- 外部服务/API 及其失败模式
+- 数据导入/导出格式
+- 协议/版本假设
+
+**6. Edge Cases & Failure Handling**
+- 负向场景
+- 限流/节流
+- 冲突解决（如并发编辑）
+
+**7. Constraints & Tradeoffs**
+- 技术约束（语言、存储、托管）
+- 显式取舍或拒绝的替代方案
+
+**8. Terminology & Consistency**
+- 规范术语表
+- 已弃用同义词
+
+**9. Completion Signals**
+- 验收标准可测试性
+- 可度量的 Definition of Done 指标
+
+**10. Misc / Placeholders**
+- TODO 标记/未解决决策
+- 模糊形容词（"健壮""直观"）缺乏量化
+
+对每维标注 Partial 或 Missing 的类别添加候选问题，除非：
+- 澄清不会实质改变实现或验证策略
+- 信息更适合推迟到规划阶段（内部备注）
+
+### 2) 生成优先级候选问题队列
+
+内部生成优先级排序的候选澄清问题队列（最多 10 个候选），按 (Impact * Uncertainty) 启发式排序。不一次性全部输出。
+
+约束：
+- 全程最多 5 题已问。
+- 每题须可回答为：多选题（2-5 互斥选项）或短回答（<=5 词）。
+- 仅纳入对架构、数据建模、任务分解、测试设计、UX 行为、运维就绪或合规验证有实质影响的题目。
+- 保证分类覆盖平衡：优先覆盖最高影响的未解决类别；避免在单个高影响领域（如安全态势）未解决时问两个低影响题。
+- 排除已答、无关风格偏好或纯计划层执行细节（除非阻塞正确性）。
+- 优先选择能减少下游返工风险或防止验收测试错位的澄清。
+- 若超过 5 个类别未解决，选 (Impact * Uncertainty) 最高的前 5。
+
+### 3) 交互澄清循环
+
+**一次只呈现一题**（ONE question at a time），不提前透露后续题目。
+
+**多选题格式：**
+- 分析所有选项，基于项目类型最佳实践/同类实现常见模式/安全与性能风险降低/spec 中可见目标与约束，确定最佳选项。
+- **Recommended: Option [X] — <1-2 句理由>**
+- 然后以 Markdown 表格呈现所有选项：
+
+| Option | Description |
+| ------ | ----------- |
+| A      | <选项 A 描述> |
+| B      | <选项 B 描述> |
+| C      | <选项 C 描述>（最多 5 项） |
+| Short  | 提供不同短回答（<=5 词） |
+
+- 表格后追加："回复选项字母（如 'A'），'yes' / 'recommended' 采纳推荐，或提供自己的短回答。"
+
+**短回答格式（无有意义离散选项时）：**
+- **Suggested: <建议答案> — <简短理由>**
+- 然后输出："Format: Short answer (<=5 words). 回复 'yes' / 'suggested' 采纳建议，或提供自己的回答。"
+
+**用户回答后：**
+- 若回复 "yes" / "recommended" / "suggested"，采用之前声明的推荐/建议为答案。
+- 否则验证答案映射到某选项或符合 <=5 词约束。
+- 若歧义，快速消歧（仍属同一题，不推进）。
+- 确认后记录到工作内存（暂不写盘），推进到下一题。
+
+**停止提问条件：**
+- 所有关键歧义提前解决（剩余队列不再必要）
+- 用户发出完成信号（"done""good""no more"）
+- 达到 5 题上限
+
+若起始即无可问题目，立即报告"未检测到需正式澄清的关键歧义"，输出覆盖度摘要后建议推进。
+
+### 4) 增量更新 spec
+
+每接受一题答案后立即写入 spec：
+
+- **维护 spec 内存表示**（启动时加载一次）及原始文件内容。
+- **首个答案写入时**：
+  - 确保 spec 存在 `## Clarifications` 节（若缺失，创建在概述/上下文节之后）。
+  - 在其下创建（若不存在）`### Session YYYY-MM-DD` 子标题（当天日期）。
+- **追加一行**：`- Q: <问题> → A: <最终答案>`
+- **立即将澄清整合到最相关章节**：
+  - 功能歧义 → 更新或新增功能需求（FR）条目
+  - 用户交互/角色区分 → 更新用户故事或角色相关节，附加澄清的角色、约束或场景
+  - 数据形态/实体 → 更新数据模型（添加字段、类型、关系），保留顺序
+  - 非功能约束 → 在非功能/质量属性节添加或修改可度量标准（将模糊形容词转为指标或显式目标）
+  - 边缘情况/负面流程 → 在边界情况/错误处理节新增条目
+  - 术语冲突 → 全文规范化术语；仅在必要时保留原称（加注"（旧称 "X"）"一次）
+- 若澄清导致早期歧义陈述失效，**替换而非重复**；不留过时矛盾文字。
+- **每题答案后保存 spec 文件**（原子覆盖），以降低上下文丢失风险。
+- 保持格式：不重排无关章节，不变更标题层级。
+- 每条澄清保持简洁可测试（避免叙事膨胀）。
+
+### 5) 校验
+
+每题写入后及最终校验：
+- Clarifications 节每题恰好一条记录（无重复）
+- 已问（已采纳）问题总数 ≤ 5
+- 已更新节无不应用新答案解决的模糊占位符
+- 无矛盾遗留（已移除的替代选项不再出现）
+- Markdown 结构有效；仅允许新增 `## Clarifications`、`### Session YYYY-MM-DD`
+- 术语一致性：所有更新章节使用同一规范术语
+
+### 6) 完成报告
+
+提问循环结束后输出：
+
+- 已问与已回答问题数
+- 更新后的 spec 路径
+- 触及的章节列表
+- **覆盖率摘要表格**：每维标注状态——
+  - **Resolved**：原为 Partial/Missing，本次已解决
+  - **Deferred**：超出题数配额或更适合规划阶段
+  - **Clear**：原本已充分
+  - **Outstanding**：仍为 Partial/Missing 但影响较低
+- 若存在 Outstanding 或 Deferred，建议是否继续推进 build-plan 或后续重新运行 spec-clarify。
+- 建议下一步动作。
+
+### 行为规则
+
+- 若无有意义的歧义（或全部潜在问题影响低），回复"未检测到需正式澄清的关键歧义"并建议推进。
+- 若 spec 文件缺失，指示先执行 spec-specify（不在此创建新 spec）。
+- **全程不超过 5 题**（单题澄清重试不计入新题）。
+- 避免推测性技术栈问题，除非缺失会阻塞功能清晰度。
+- 尊重用户提前终止信号（"stop""done""proceed"）。
+- 若未问任何题即覆盖完整，输出压缩覆盖度摘要（全部 Clear）后建议推进。
+- 若配额用尽仍有未解决的高影响类别，在 Deferred 中显式标注并附理由。
+
+## metrics 接入
+
+- **阶段开始时**：调 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字段填 `spec-clarify`。
+- **阶段结束时**：调 `updateOwnResult`，写失败只 warn 不 throw。
+
+## 去耦约束
+
+本 skill 不依赖 speckit 基础设施：
+- 不调 `check-prerequisites.sh`
+- 不读 `.specify/` 目录或 `.specify/feature.json`
+- 不执行 git 命令
+
+spec 定位全部通过 task-id 推导或显式 spec-path，不依赖分支环境。
+
+## 输出物
+
+- 更新后的 `specs/{task-id}/spec.md`（含澄清追加和章节整合）
+
+## 下一步
+
+澄清完成后，推进到 **build-plan** 生成实现计划。
diff --git a/workflows/spec-specify/SKILL.md b/workflows/spec-specify/SKILL.md
new file mode 100644
index 0000000..ff41375
--- /dev/null
+++ b/workflows/spec-specify/SKILL.md
@@ -0,0 +1,164 @@
+---
+name: spec-specify
+description: Create or update a feature specification from a natural language feature description. Adapted from speckit-specify for the workflowhub contract — no git branch coupling, task-id parameterized.
+---
+
+# spec-specify
+
+> 本文件改造自 `~/.claude/skills/speckit-specify/SKILL.md`，适配为 workflowhub 契约：
+> - 去 git 分支耦合，改用 task-id 参数推导产物路径；
+> - 模板由 workflowhub 内置（`./templates/spec-template.md`），不读目标项目 `.specify/`；
+> - 接 workflowhub M4 metrics 系统（`metrics/collector.mjs`）的 recordSkeleton + updateOwnResult。
+> - 核心质量机制完整保留：关键概念提取、假设记录、≤3 个 NEEDS CLARIFICATION、FR 可测试、质量检查清单、Q1/Q2/Q3 交互格式（3-5 互斥选项+推荐）。
+
+## 输入
+
+- **task-id**（必填，string 字面量）：任务 ID，用于推导产物路径 `specs/{task-id}/`。
+  - **缺失时 fail-loud**：立即报错 "task-id required"，停止执行，不推测、不静默回退、不做分支推断。
+- **功能描述文本**：来自上游 make-decision 产出的 decision-log 或用户直接提供的自然语言功能描述。
+
+如果描述缺失或不清晰，先问一个精准问题再继续。
+
+## 工作流程
+
+1. **检查 task-id 参数**：
+   - 若 task-id 缺失或为空字符串 → 报错 "task-id required" 并停止（exit code 为非 0）。
+   - 不执行 git checkout / git branch / create-new-feature.sh。
+
+2. **加载模板**：
+   - 从 `./templates/spec-template.md`（本 SKILL.md 同目录下的相对路径）读取模板全文。
+   - **若文件不存在**：报错 "template not found at ./templates/spec-template.md" 并停止，不做 `.specify/` 回退，不调任何 speckit 脚本。
+
+3. **调用 metrics 记录骨架**：
+   - 指令调用 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字面量填 `spec-specify`。
+   - 传入 execution_id / skill_or_stage / stage / skill_version / executed / tokens / duration_ms / rework_rounds / human_intervention / friction_ref 十个核心字段种子。
+   - metrics 写失败只 warn 不 throw，不阻断主流程。
+
+4. **spec 生成步骤**（保留 speckit-specify 核心流程）：
+
+   1. **提取关键概念**：从功能描述中识别角色（actors）、动作（actions）、数据（data）、约束（constraints）。
+   2. **推断与假设**：对不明确点，基于上下文和行业惯例做合理推断，将推断依据记录到 spec 的"假设"段。
+   3. **[NEEDS CLARIFICATION] 标记**：
+      - 仅当选择显著影响 spec 范围/安全/UX 且无合理默认值时使用。
+      - **上限 3 个**。超过 3 个时，按优先级保留最重要的 3 个（范围 > 安全/隐私 > 用户体验 > 技术细节），其余做合理推断。
+   4. **填充 spec**：按模板章节结构逐章填充，用功能描述中的具体内容替换占位注释。
+   5. **FR 可测试性**：每条功能需求（FR）必须可测试、可验证。模糊需求应被"testable and unambiguous"检查项检出。
+
+5. **三档裁剪指令**：
+   - **A 档（硬门）**：以下五章必填，不可跳过——用户场景与用例、功能需求、不做和隐性必达、验收清单及未决问题、影响范围。
+   - **B 档（条件触发）**：模块划分、关键实体、数据和生命周期、兼容性预留——仅在功能涉及对应内容时填写，不触发的内容标"本期不涉及（理由：功能无 XX 需要）"并去除非空壳。
+   - **C 档（可精简）**：速读卡、问题陈述、背景目标和边界——必须填写但篇幅可控，各自 1-2 段。
+
+6. **产物写入**：
+   - 将 spec 写入 `specs/{task-id}/spec.md`（由 task-id 推导，不依赖 git branch）。
+   - 路径中 `{task-id}` 用入参 task-id 字面量替换。
+
+7. **质量检查清单生成**：
+   - 生成文件 `specs/{task-id}/checklists/requirements.md`，含以下检查项：
+
+     ```markdown
+     # 规格质量检查清单：[功能名]
+
+     用于在进入 plan 阶段前验证 spec 的完整性和质量。
+
+     ## 内容质量
+
+     - [ ] 无实现细节泄露（无编程语言、框架、API 名称）
+     - [ ] 聚焦用户价值与业务需求
+     - [ ] 非技术干系人可读
+     - [ ] 所有必填章节已完成
+
+     ## 需求完整性
+
+     - [ ] 所有 [NEEDS CLARIFICATION] 标记已解决
+     - [ ] 所有功能需求可测试、无歧义
+     - [ ] 成功标准可度量
+     - [ ] 成功标准不含实现细节
+     - [ ] 所有验收场景已定义
+     - [ ] 边界情况已标识
+     - [ ] 范围已明确界定
+     - [ ] 依赖和假设已记录
+
+     ## 功能就绪
+
+     - [ ] 每条功能需求有明确验收标准
+     - [ ] 用户场景覆盖主要流程
+     - [ ] 功能满足成功标准中定义的可度量目标
+     - [ ] 无实现细节泄漏进规格书
+     ```
+
+8. **验证检查清单**：对照检查清单逐项审查 spec：
+   - 若全部通过：标记 checklist 完成。
+   - 若有失败项（含 [NEEDS CLARIFICATION] 未解决）：
+     1. 更新 spec 解决各问题，最多迭代 3 次；
+     2. 3 次后仍未通过，记录剩余问题至 checklist notes 并警告用户。
+
+9. **[NEEDS CLARIFICATION] 交互格式**（Q1/Q2/Q3，保留 speckit-specify 原格式）：
+
+   当 spec 中存在 [NEEDS CLARIFICATION] 标记时：
+   - **一次性呈现全部题目**（最多 3 题），编号 Q1、Q2、Q3。
+   - **每题格式**：
+     - 所在章节及上下文（引用 spec 原文）
+     - 待澄清问题
+     - 3-5 个互斥选项（表格：选项 | 答案 | 影响），含推荐项（行标 **推荐**）+ 简短理由
+     - 等待用户一次性回答所有题目（如 "Q1: A, Q2: B, Q3: Custom - xxx"）
+   - 用户作答后，用其选择替换 spec 中对应的 [NEEDS CLARIFICATION] 标记。
+   - 澄清完成后重新跑验证检查清单。
+
+10. **调用 metrics 更新**：
+    - 指令调用 `metrics/collector.mjs` 的 `updateOwnResult`，更新 executed / tokens / duration_ms 等实际值。
+    - stage 字段保持 `spec-specify`。
+    - 写失败只 warn 不 throw。
+
+11. **报告完成**：输出 task-id、spec 产物路径、checklist 结果、是否可就绪进入下一阶段（spec-clarify 或 build-plan）。
+
+## 去耦约束
+
+本 skill 已从 speckit-specify 解耦，硬性约束如下：
+- **不执行 git 命令**：不执行 git checkout / git branch / git fetch / git ls-remote / create-new-feature.sh 或任何等效 git 操作。
+- **不读 `.specify/` 目录**：不从目标项目 `.specify/` 读取任何文件（模板、脚本、配置）。
+- **不调用 speckit 脚本**：不执行任何 `speckit-*` 前缀的脚本或命令行工具。
+
+> 注：以上声明为约束性禁止指令，不构成 speckit 脚本的"实际执行"——验证阶段按此 grep。
+
+## 产出
+
+- `specs/{task-id}/spec.md`：结构化功能规格书
+- `specs/{task-id}/checklists/requirements.md`：质量检查清单
+
+## 下一步
+
+- **澄清**：用 spec-clarify 消除歧义。
+- **编排**：build-spec SKILL.md 将本 skill 作为第一步，output 为下游 spec-clarify 的输入。
+
+## 通用原则
+
+- 关注**用户需要什么**（WHAT）和**为什么**（WHY），不关注**怎么实现**（HOW）——不提技术栈、API、代码结构。
+- 面向业务干系人撰写，非开发者。
+- 不做嵌入 spec 内部的 checklist（那是独立 skill 的产出）。
+- 成功标准必须：可度量（含具体指标）、技术无关（不提框架/语言/数据库）、用户视角（从用户/业务角度描述结果）、可验证（无需了解实现细节即可检验）。
+
+### 成功标准示例
+
+**好**：
+- "用户可在 3 分钟内完成结账"
+- "系统支持 10,000 并发用户"
+- "95% 搜索在 1 秒内返回结果"
+
+**差**（含实现细节）：
+- "API 响应时间低于 200ms"（太技术化）
+- "数据库承载 1000 TPS"（实现细节）
+- "React 组件高效渲染"（框架特定）
+
+### [NEEDS CLARIFICATION] 优先级
+
+当需要超过 3 个 NEEDS CLARIFICATION 时，保留优先级：范围 > 安全/隐私 > 用户体验 > 技术细节。其余做合理推断。
+
+### 合理默认值示例
+
+以下不必提问，直接取合理默认值：
+- 数据保留：行业的通行做法
+- 性能目标：标准 web/移动应用预期（未指定时）
+- 错误处理：用户友好提示 + 适当降级
+- 认证方式：web 应用标准 session 或 OAuth2
+- 集成模式：RESTful API（除非另有说明）
diff --git a/workflows/spec-specify/templates/spec-template.md b/workflows/spec-specify/templates/spec-template.md
new file mode 100644
index 0000000..93cf37e
--- /dev/null
+++ b/workflows/spec-specify/templates/spec-template.md
@@ -0,0 +1,169 @@
+# 功能规格：[功能名]
+
+> 基于 SPEC.md 生成。本文件由 spec-specify 根据上游功能描述自动填充。
+
+**功能名**: `{task-id}`
+**来源**: 上游 decision-log 决策记录
+**状态**: 草稿
+<!-- 生成时替换 {task-id} 为实际的 task-id 字面量 -->
+
+## 速读卡（30 秒看懂这个需求）
+
+<!-- 一句话需求 + 核心改动点 + 最大影响面 + 验收信号。全部必填，但篇幅可控。 -->
+
+- **一句话需求**：<!-- 用一句话说清这个功能要做什么 -->
+- **核心改动点**：<!-- 2-5 条，每条一句话 -->
+- **最大影响面**：<!-- 哪个模块/子系统最受影响 -->
+- **验收信号**：<!-- 如何判断"做完了、做对了" -->
+
+## 1. 问题陈述
+
+<!-- 1-2 段。描述当前状态和待解决问题，不涉及解决方案。 -->
+
+当前：<!-- 现状描述 -->。
+
+问题：<!-- 痛点/差距 -->。
+
+## 2. 背景、目标和边界
+
+### 背景
+
+<!-- 为什么现在做、与已有系统的关系。 -->
+
+### 目标
+
+<!-- 本功能完成后能做到什么，用可验证结果描述。 -->
+
+### 非目标（明确不做）
+
+<!-- 本期明确不做的事项。每条单独一行。 -->
+1. <!-- 不做事项 1 -->
+2. <!-- 不做事项 2 -->
+
+## 3. 用户场景与用例
+
+<!-- 角色 + 操作步骤 + 预期结果。覆盖正常路径、失败路径、边界路径。
+     每条场景含：（1）场景名；（2）角色；（3）前置条件；（4）操作步骤；（5）预期结果。 -->
+
+### 场景一：[场景名]（正常路径）
+
+- **角色**：<!-- 谁执行这个操作 -->
+- **前置条件**：<!-- Given 状态 -->
+- **操作步骤**：<!-- When 做了什么 -->
+- **预期结果**：<!-- Then 发生了什么 -->
+
+### 场景二：[场景名]（失败/边界路径）
+
+- **角色**：<!-- 谁执行 -->
+- **前置条件**：<!-- Given -->
+- **操作步骤**：<!-- When -->
+- **预期结果**：<!-- Then -->
+
+<!-- 按需补充更多场景 -->
+
+## 4. 功能需求
+
+<!-- 按功能域分组，编号 FR-{域缩写}-NNN。每条 FR 必须可测试。
+     溯源规则：每条 FR 标注来源（decision-log 决策编号或上游描述）。
+
+     示例格式：
+     #### 域：XXXX
+     - **FR-XX-001**：[需求描述]。来源：D-XX-1。
+       - **场景**：Given xxx, When xxx, Then xxx。
+     - **FR-XX-002**：[需求描述]。来源：用户描述 §3。
+       - **场景**：Given xxx, When xxx, Then xxx。
+-->
+
+### 域：XXX（给人读的域说明）
+
+- **FR-XXX-001**：[需求描述]。来源：<!-- 填写来源 -->。
+  - **场景**：Given <!-- 前置 -->, When <!-- 操作 -->, Then <!-- 预期 -->。
+
+<!-- 按功能域补充更多 FR -->
+
+## 5. 模块划分（条件触发）
+
+<!-- 仅当功能涉及多模块时有此章节；不触发时填 "本期不涉及（理由：功能无多模块交互需要）"。
+     每模块写出：负责什么 / 对外接口 / 依赖谁 / 测试边界。 -->
+
+### [模块名]
+
+- **负责什么**：<!-- 一句话 -->
+- **对外接口**：<!-- 产什么/收什么 -->
+- **依赖谁**：<!-- 调用路径 -->
+- **测试边界**：<!-- 什么可独立测 -->
+
+## 6. 关键实体（条件触发）
+
+<!-- 仅当功能涉及数据实体时有此章节。每实体描述其字段和关系。
+     不触发时填 "本期不涉及（理由：功能无数据实体定义需要）"。 -->
+
+### [实体名]
+
+- **定义**：<!-- 一句话 -->
+- **字段**：<!-- 关键字段列表 -->
+- **关系**：<!-- 与其他实体的关联 -->
+
+## 7. 数据和生命周期（条件触发）
+
+<!-- 仅当功能涉及数据流或持久化时有此章节。
+     不触发时填 "本期不涉及（理由：功能无数据生命周期需要）"。 -->
+
+- **数据粒度**：<!-- 单次操作/单任务/全局 -->
+- **数据时效**：<!-- 实时/批/归档 -->
+- **存储位置**：<!-- 文件路径/数据库 -->
+- **清理策略**：<!-- 保留期/淘汰规则 -->
+
+## 8. 兼容性预留（条件触发）
+
+<!-- 仅当功能需向后兼容或未来扩展预留时有此章节。
+     不触发时填 "本期不涉及（理由：功能无兼容性/扩展预留需要）"。 -->
+
+- **向后兼容**：<!-- 对已有消费方的影响 -->
+- **扩展预留**：<!-- 为未来留的接口/字段/格式空间 -->
+
+## 9. 不做和隐性必达
+
+### 明确不做
+
+> 以下逐条继承自 decision-log 的非目标声明。design/plan/build 阶段不得逾越。
+
+1. <!-- 不做事项 -->
+2. <!-- 不做事项 -->
+
+### 隐性必达
+
+<!-- 不能明写在 FR 里但必须成立的约束。如：不改某个外部系统、不引入新类别的门禁、测试套件不全绿即失败。 -->
+
+- **隐性必达 1**：<!-- 约束描述 -->
+- **隐性必达 2**：<!-- 约束描述 -->
+
+## 10. 验收清单及未决问题
+
+### 验收检查（success_criteria）
+
+<!-- 逐条可手动或命令验证。每条含失败判据，均可判真伪。
+     格式：AC1 ... ACn，每条标注可追溯到哪条 FR。 -->
+
+- [ ] **AC1**：<!-- 验收条目描述。反向：[失败条件] --> ← FR-XX-001
+- [ ] **AC2**：<!-- 验收条目描述。反向：[失败条件] --> ← FR-XX-002
+
+### 未决风险和问题
+
+<!-- 开放问题列表。已决问题标注 ~~删除线~~ + 简记决定摘要。 -->
+
+- **~~未决 1（主题）—— 已决~~**：<!-- 决定摘要 -->
+- **未决 2（主题）**：<!-- 待处理问题及影响 -->
+
+## 11. 影响范围（业务性质）
+
+<!-- 列出受影响的功能模块/文件及变更类型。
+     格式：模块名 | 文件 | 变更类型（新增/修改/删除）| 影响说明 -->
+
+- **受影响功能：[名称]**
+  - 既有行为：<!-- 现在是什么样的 -->
+  - 本需求影响：<!-- 会变成什么样 -->
+  - 回归要点：<!-- 什么不能坏 -->
+
+- **可能受冲击的业务规则**：<!-- 如有 -->
+- **明确无影响**：<!-- 哪些模块/系统不受影响 -->

## Raw output

```text
verdict: revise_required

**Blocking Findings**

1. `workflows/spec-specify/templates/spec-template.md:3` + `workflows/spec-specify/SKILL.md:40`

   spec-specify says it must record assumptions into the spec 的“假设”段, but the template has no `## 假设` / `## Assumptions` section. That means one required speckit quality mechanism is not genuinely preserved in the actual output shape. An agent must either invent an off-template section or drop assumptions.

   Fix: add an explicit assumptions section to `spec-template.md`, and make `SKILL.md` say every inferred default must be recorded there with source/rationale.

2. `workflows/spec-specify/SKILL.md:90-106`

   The validation step runs before the Q1/Q2/Q3 clarification flow and says failures, including unresolved `[NEEDS CLARIFICATION]`, should be fixed by updating the spec for up to 3 iterations. That conflicts with the later instruction to present unresolved `[NEEDS CLARIFICATION]` markers to the user in Q1/Q2/Q3 format.

   This can cause the skill to silently “resolve” clarification markers by inference instead of asking, which guts the required clarification mechanism.

   Fix: handle Q1/Q2/Q3 clarification before checklist validation. Validation must not auto-resolve `[NEEDS CLARIFICATION]`; it should fail until the user answers or the marker is removed through the required flow.

3. `workflows/spec-specify/templates/spec-template.md:84-94`, `workflows/spec-specify/templates/spec-template.md:107-115`, `workflows/spec-specify/templates/spec-template.md:158-161`, `workflows/spec-specify/SKILL.md:136-139`

   The template requires implementation-shaped content: module interfaces, dependencies, test boundaries, storage location as “文件路径/数据库”, affected files, and change type. But the skill also says the spec must focus on WHAT/WHY and avoid implementation details, and the generated checklist checks for “无实现细节泄露”.

   This makes the template internally impossible to satisfy: a correctly filled template can fail its own quality gate.

   Fix: either remove implementation-specific fields from the spec template, or rename/scope them as business/domain impact only. For example, replace “文件” with “受影响能力/业务区域”, and replace “存储位置：文件路径/数据库” with user-visible data ownership/lifecycle constraints.

4. `workflows/spec-specify/SKILL.md:157-164`

   The “合理默认值示例” introduces specific implementation defaults: OAuth2, session auth, RESTful API. That directly contradicts the same file’s “不关注怎么实现 / 不提技术栈、API、代码结构” rule.

   It also risks baking arbitrary architecture into a prompt-only spec skill, which violates simple-first and narrow-contract.

   Fix: rewrite defaults in product terms. Example: “认证方式：沿用现有产品认证机制；若无现有机制则标记 NEEDS CLARIFICATION”，not OAuth2/session.

5. `workflows/spec-clarify/SKILL.md:133` vs `workflows/spec-clarify/SKILL.md:144-160`

   The interaction loop says after accepting an answer, record it in working memory and “暂不写盘”, then advance to the next question. The next section says every accepted answer must immediately update and save the spec.

   That directly contradicts the required incremental spec update behavior.

   Fix: delete the “暂不写盘” instruction. After each accepted answer, update `## Clarifications`, integrate the answer into the relevant section, save the spec, then continue.

6. `workflows/spec-clarify/SKILL.md:100`, `workflows/spec-clarify/SKILL.md:121`, `workflows/spec-clarify/SKILL.md:125-127`

   spec-clarify allows short-answer questions when no discrete options exist, and the multiple-choice table includes a `Short` row. The milestone requirement says each question must have recommendation + rationale + 2-5 options.

   This weakens the speckit clarification discipline. Short answers are harder to validate, harder to integrate consistently, and easier for the agent to over-interpret.

   Fix: require 2-5 mutually exclusive options for every clarification question. If free text is allowed, it should be an explicit “Other” option with a <=5-word constraint, not a replacement for option design.

7. `workflows/spec-clarify/SKILL.md:19-23`

   The input contract contradicts itself. It says `task-id` is required, then says `spec-path` can be used directly, then says only the absence of both is fatal.

   This fails narrow-contract and makes task identity ambiguous for metrics, output reporting, and default spec location.

   Fix: choose one contract:
   - **Recommended**: require exactly one of `task-id` or `spec-path`; if `spec-path` is supplied without `task-id`, derive no task-id and report metrics with the explicit path.
   - Alternative: require `task-id` always, and allow `spec-path` only as an override for file location.

8. `workflows/spec-clarify/SKILL.md:30`, `workflows/spec-clarify/SKILL.md:190-191`

   Missing spec handling says to “指示先执行 spec-specify”, but does not explicitly say to stop/fail-loud with a concrete error. The milestone requires fail-loud behavior for missing locating input/spec.

   Fix: say exactly: `fail-loud: "spec not found at <path>; run spec-specify first" and stop. Do not create or infer a spec.`

**Non-Blocking Notes**

- Decoupling is mostly real. I do not see an actual instruction to run git, read `.specify/`, run `check-prerequisites.sh`, or call speckit scripts. The residual references are prohibition/source-attribution text, which is acceptable.

- `workflows/spec-specify/SKILL.md:8` and `workflows/spec-clarify/SKILL.md:8` reference local source paths under `~/.claude/skills/...`. That is not an execution dependency, but it is unnecessary in a portable workflowhub skill. Prefer replacing it with “Adapted from speckit” without a local absolute path.

- `workflows/spec-specify/SKILL.md:25` says “exit code 为非 0” inside a prompt-only skill. That is directionally fine, but prompt-only skills may not own a process exit code. Better wording: stop immediately and report the exact error string; if invoked by a runner, the runner should mark non-zero.

- Metrics wiring is present by name and stage, but still underspecified operationally. The files say to call `metrics/collector.mjs`, `recordSkeleton`, and `updateOwnResult`, but do not give an invocation shape or minimum payload example. Not blocking for a prompt-only port, but a later runner may interpret this inconsistently.

- The spec-specify quality checklist is reasonable, but because the template currently demands implementation details, the checklist can become performative. Fix the template first; otherwise checklist pass/fail will depend on agent taste.

- `workflows/spec-specify/templates/spec-template.md:3` says “基于 SPEC.md 生成”, but the skill input is a feature description or decision-log, not necessarily `SPEC.md`. This is confusing and should be changed to “基于上游功能描述生成”.


2026-06-28T13:44:07.584213Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T13:44:07.584234Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/anti-forgery-evidence/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T13:44:07.584236Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-28T13:44:07.584237Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/stage-summary/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T13:44:07.584238Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/verify-change/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T13:44:07.584240Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/handoff/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T13:44:07.584241Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/design-fidelity-component-contract/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T13:44:07.584243Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/capture-workflow-feedback/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T13:44:07.584244Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/tdd-red-green/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T13:44:07.584245Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T13:44:07.584246Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-28T13:44:07.584248Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/browser-use/SKILL.md: missing YAML frontmatter delimited by ---
OpenAI Codex v0.135.0
--------
workdir: /Users/Hugh/Hugh/Project/workflowhub
model: gpt-5.5
provider: openai
approval: never
sandbox: danger-full-access
reasoning effort: high
reasoning summaries: none
session id: 019f0e79-1e10-7090-a996-8c74efa974d8
--------
user
You are doing a heterologous, independent, cross-engine code review of two NEW prompt-only skill files for workflowhub milestone M11 build-code Phase 1+2. You are NOT the author. Be adversarial and concrete.

CONTEXT: M11 ports two speckit skills into workflowhub as prompt-only SKILL.md files (no .mjs):
- spec-specify (workflows/spec-specify/SKILL.md + templates/spec-template.md): adapted from speckit-specify. Must: accept required task-id param (fail-loud if missing), load template from ./templates/spec-template.md (fail-loud if absent), output specs/{task-id}/spec.md + checklists/requirements.md, preserve speckit quality mechanisms (key-concept extraction, assumption recording, <=3 NEEDS CLARIFICATION with Q1/Q2/Q3 3-5-option+recommendation format, testable FRs, 3-tier tailoring), decouple from git (NO git checkout/branch/create-new-feature.sh, NO reading .specify/, NO speckit script calls), wire metrics (recordSkeleton + updateOwnResult, stage=spec-specify).
- spec-clarify (workflows/spec-clarify/SKILL.md): adapted from speckit-clarify. Must: accept task-id/spec-path (fail-loud), preserve ALL 10 ambiguity dimensions each tagged Clear/Partial/Missing, one-question-at-a-time discipline, max 5 questions, per-question recommendation+rationale+2-5 options, incremental spec update (## Clarifications), coverage summary (Resolved/Deferred/Clear/Outstanding), decouple (NO check-prerequisites.sh, NO .specify/, NO git), wire metrics (stage=spec-clarify).

Project constitution: thin-core, narrow-contract, simple-first, let-it-crash (fail-loud no hidden fallback), record-fact-not-block, no over-engineering (F10).

Review the diff below. Judge: (1) Are speckit quality mechanisms genuinely preserved, not gutted? (2) Is decoupling real (no residual git/.specify/script dependency in the actual instructions, vs prohibition declarations which are required)? (3) task-id fail-loud actually specified? (4) Any instruction that contradicts itself or the constitution? (5) Template usable and complete? Be precise. Output top line `verdict: pass` | `verdict: revise_required` | `verdict: escalate_to_human`, then blocking findings with file:line, then non-blocking notes.

=== GIT DIFF (Phase 1+2) ===
diff --git a/workflows/spec-clarify/SKILL.md b/workflows/spec-clarify/SKILL.md
new file mode 100644
index 0000000..044db6c
--- /dev/null
+++ b/workflows/spec-clarify/SKILL.md
@@ -0,0 +1,218 @@
+---
+name: spec-clarify
+description: 对当前 task 的 spec 执行 10 维歧义扫描，通过最多 5 题交互澄清（一次一题+推荐），逐题增量更新 spec，完成时输出覆盖率摘要。改造自 speckit-clarify，适配为 workflowhub 契约。
+---
+
+# spec-clarify
+
+> 改造自 `~/.claude/skills/speckit-clarify/SKILL.md`，适配为 workflowhub 契约：
+> - 去 git / check-prerequisites / .specify 耦合
+> - 以 task-id 参数化定位 spec
+> - 保全文 speckit 质量机制
+
+## 用途
+
+spec 已存在但需要针对性澄清后再推进——在 build-plan 之前执行。
+
+## 输入
+
+- **task-id**（必填）：用于推导 spec 路径 `specs/{task-id}/spec.md`。缺失时 fail-loud："task-id required" 并停止。
+- **spec-path**（可选）：显式指定 spec 文件路径。提供时直接使用，不通过 task-id 推导。
+- 用户的澄清意图或约束（来自对话上下文）。
+
+若 task-id 和 spec-path 均缺失，fail-loud："缺少 task-id 或 spec-path，无法定位 spec" 并停止。
+
+## spec 定位
+
+- 优先使用 spec-path（提供时）。
+- 否则通过 task-id 推导：`specs/{task-id}/spec.md`。
+- **不执行** git 命令、不调 check-prerequisites.sh、不读 `.specify/` 目录或 `.specify/feature.json`。
+- 若 spec 文件不存在，指示先执行 spec-specify 生成 spec，不在此 skill 内创建新 spec。
+
+## 执行步骤
+
+### 1) 加载 spec 文件并执行结构化歧义扫描
+
+读取 spec 文件全文。按以下 10 维分类逐维扫描，每维标注状态 **Clear / Partial / Missing**。生成内部覆盖度地图用于优先级排序（不直接输出原始地图，除非无需提问）。
+
+**10 维歧义分类：**
+
+**1. Functional Scope & Behavior**
+- 核心用户目标与成功标准
+- 显式不做范围声明
+- 用户角色/角色区分
+
+**2. Domain & Data Model**
+- 实体、属性、关系
+- 标识与唯一性规则
+- 生命周期/状态转换
+- 数据量级/规模假设
+
+**3. Interaction & UX Flow**
+- 关键用户旅程/操作序列
+- 错误态/空态/加载态
+- 可访问性或本地化说明
+
+**4. Non-Functional Quality Attributes**（1 个顶级维度，含 6 子项）
+- 性能（延迟、吞吐量目标）
+- 可扩展性（水平/垂直扩展、限制）
+- 可靠性与可用性（运行时间、恢复预期）
+- 可观测性（日志、指标、追踪信号）
+- 安全与隐私（认证/授权、数据保护、威胁假设）
+- 合规/监管约束（如有）
+
+**5. Integration & External Dependencies**
+- 外部服务/API 及其失败模式
+- 数据导入/导出格式
+- 协议/版本假设
+
+**6. Edge Cases & Failure Handling**
+- 负向场景
+- 限流/节流
+- 冲突解决（如并发编辑）
+
+**7. Constraints & Tradeoffs**
+- 技术约束（语言、存储、托管）
+- 显式取舍或拒绝的替代方案
+
+**8. Terminology & Consistency**
+- 规范术语表
+- 已弃用同义词
+
+**9. Completion Signals**
+- 验收标准可测试性
+- 可度量的 Definition of Done 指标
+
+**10. Misc / Placeholders**
+- TODO 标记/未解决决策
+- 模糊形容词（"健壮""直观"）缺乏量化
+
+对每维标注 Partial 或 Missing 的类别添加候选问题，除非：
+- 澄清不会实质改变实现或验证策略
+- 信息更适合推迟到规划阶段（内部备注）
+
+### 2) 生成优先级候选问题队列
+
+内部生成优先级排序的候选澄清问题队列（最多 10 个候选），按 (Impact * Uncertainty) 启发式排序。不一次性全部输出。
+
+约束：
+- 全程最多 5 题已问。
+- 每题须可回答为：多选题（2-5 互斥选项）或短回答（<=5 词）。
+- 仅纳入对架构、数据建模、任务分解、测试设计、UX 行为、运维就绪或合规验证有实质影响的题目。
+- 保证分类覆盖平衡：优先覆盖最高影响的未解决类别；避免在单个高影响领域（如安全态势）未解决时问两个低影响题。
+- 排除已答、无关风格偏好或纯计划层执行细节（除非阻塞正确性）。
+- 优先选择能减少下游返工风险或防止验收测试错位的澄清。
+- 若超过 5 个类别未解决，选 (Impact * Uncertainty) 最高的前 5。
+
+### 3) 交互澄清循环
+
+**一次只呈现一题**（ONE question at a time），不提前透露后续题目。
+
+**多选题格式：**
+- 分析所有选项，基于项目类型最佳实践/同类实现常见模式/安全与性能风险降低/spec 中可见目标与约束，确定最佳选项。
+- **Recommended: Option [X] — <1-2 句理由>**
+- 然后以 Markdown 表格呈现所有选项：
+
+| Option | Description |
+| ------ | ----------- |
+| A      | <选项 A 描述> |
+| B      | <选项 B 描述> |
+| C      | <选项 C 描述>（最多 5 项） |
+| Short  | 提供不同短回答（<=5 词） |
+
+- 表格后追加："回复选项字母（如 'A'），'yes' / 'recommended' 采纳推荐，或提供自己的短回答。"
+
+**短回答格式（无有意义离散选项时）：**
+- **Suggested: <建议答案> — <简短理由>**
+- 然后输出："Format: Short answer (<=5 words). 回复 'yes' / 'suggested' 采纳建议，或提供自己的回答。"
+
+**用户回答后：**
+- 若回复 "yes" / "recommended" / "suggested"，采用之前声明的推荐/建议为答案。
+- 否则验证答案映射到某选项或符合 <=5 词约束。
+- 若歧义，快速消歧（仍属同一题，不推进）。
+- 确认后记录到工作内存（暂不写盘），推进到下一题。
+
+**停止提问条件：**
+- 所有关键歧义提前解决（剩余队列不再必要）
+- 用户发出完成信号（"done""good""no more"）
+- 达到 5 题上限
+
+若起始即无可问题目，立即报告"未检测到需正式澄清的关键歧义"，输出覆盖度摘要后建议推进。
+
+### 4) 增量更新 spec
+
+每接受一题答案后立即写入 spec：
+
+- **维护 spec 内存表示**（启动时加载一次）及原始文件内容。
+- **首个答案写入时**：
+  - 确保 spec 存在 `## Clarifications` 节（若缺失，创建在概述/上下文节之后）。
+  - 在其下创建（若不存在）`### Session YYYY-MM-DD` 子标题（当天日期）。
+- **追加一行**：`- Q: <问题> → A: <最终答案>`
+- **立即将澄清整合到最相关章节**：
+  - 功能歧义 → 更新或新增功能需求（FR）条目
+  - 用户交互/角色区分 → 更新用户故事或角色相关节，附加澄清的角色、约束或场景
+  - 数据形态/实体 → 更新数据模型（添加字段、类型、关系），保留顺序
+  - 非功能约束 → 在非功能/质量属性节添加或修改可度量标准（将模糊形容词转为指标或显式目标）
+  - 边缘情况/负面流程 → 在边界情况/错误处理节新增条目
+  - 术语冲突 → 全文规范化术语；仅在必要时保留原称（加注"（旧称 "X"）"一次）
+- 若澄清导致早期歧义陈述失效，**替换而非重复**；不留过时矛盾文字。
+- **每题答案后保存 spec 文件**（原子覆盖），以降低上下文丢失风险。
+- 保持格式：不重排无关章节，不变更标题层级。
+- 每条澄清保持简洁可测试（避免叙事膨胀）。
+
+### 5) 校验
+
+每题写入后及最终校验：
+- Clarifications 节每题恰好一条记录（无重复）
+- 已问（已采纳）问题总数 ≤ 5
+- 已更新节无不应用新答案解决的模糊占位符
+- 无矛盾遗留（已移除的替代选项不再出现）
+- Markdown 结构有效；仅允许新增 `## Clarifications`、`### Session YYYY-MM-DD`
+- 术语一致性：所有更新章节使用同一规范术语
+
+### 6) 完成报告
+
+提问循环结束后输出：
+
+- 已问与已回答问题数
+- 更新后的 spec 路径
+- 触及的章节列表
+- **覆盖率摘要表格**：每维标注状态——
+  - **Resolved**：原为 Partial/Missing，本次已解决
+  - **Deferred**：超出题数配额或更适合规划阶段
+  - **Clear**：原本已充分
+  - **Outstanding**：仍为 Partial/Missing 但影响较低
+- 若存在 Outstanding 或 Deferred，建议是否继续推进 build-plan 或后续重新运行 spec-clarify。
+- 建议下一步动作。
+
+### 行为规则
+
+- 若无有意义的歧义（或全部潜在问题影响低），回复"未检测到需正式澄清的关键歧义"并建议推进。
+- 若 spec 文件缺失，指示先执行 spec-specify（不在此创建新 spec）。
+- **全程不超过 5 题**（单题澄清重试不计入新题）。
+- 避免推测性技术栈问题，除非缺失会阻塞功能清晰度。
+- 尊重用户提前终止信号（"stop""done""proceed"）。
+- 若未问任何题即覆盖完整，输出压缩覆盖度摘要（全部 Clear）后建议推进。
+- 若配额用尽仍有未解决的高影响类别，在 Deferred 中显式标注并附理由。
+
+## metrics 接入
+
+- **阶段开始时**：调 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字段填 `spec-clarify`。
+- **阶段结束时**：调 `updateOwnResult`，写失败只 warn 不 throw。
+
+## 去耦约束
+
+本 skill 不依赖 speckit 基础设施：
+- 不调 `check-prerequisites.sh`
+- 不读 `.specify/` 目录或 `.specify/feature.json`
+- 不执行 git 命令
+
+spec 定位全部通过 task-id 推导或显式 spec-path，不依赖分支环境。
+
+## 输出物
+
+- 更新后的 `specs/{task-id}/spec.md`（含澄清追加和章节整合）
+
+## 下一步
+
+澄清完成后，推进到 **build-plan** 生成实现计划。
diff --git a/workflows/spec-specify/SKILL.md b/workflows/spec-specify/SKILL.md
new file mode 100644
index 0000000..ff41375
--- /dev/null
+++ b/workflows/spec-specify/SKILL.md
@@ -0,0 +1,164 @@
+---
+name: spec-specify
+description: Create or update a feature specification from a natural language feature description. Adapted from speckit-specify for the workflowhub contract — no git branch coupling, task-id parameterized.
+---
+
+# spec-specify
+
+> 本文件改造自 `~/.claude/skills/speckit-specify/SKILL.md`，适配为 workflowhub 契约：
+> - 去 git 分支耦合，改用 task-id 参数推导产物路径；
+> - 模板由 workflowhub 内置（`./templates/spec-template.md`），不读目标项目 `.specify/`；
+> - 接 workflowhub M4 metrics 系统（`metrics/collector.mjs`）的 recordSkeleton + updateOwnResult。
+> - 核心质量机制完整保留：关键概念提取、假设记录、≤3 个 NEEDS CLARIFICATION、FR 可测试、质量检查清单、Q1/Q2/Q3 交互格式（3-5 互斥选项+推荐）。
+
+## 输入
+
+- **task-id**（必填，string 字面量）：任务 ID，用于推导产物路径 `specs/{task-id}/`。
+  - **缺失时 fail-loud**：立即报错 "task-id required"，停止执行，不推测、不静默回退、不做分支推断。
+- **功能描述文本**：来自上游 make-decision 产出的 decision-log 或用户直接提供的自然语言功能描述。
+
+如果描述缺失或不清晰，先问一个精准问题再继续。
+
+## 工作流程
+
+1. **检查 task-id 参数**：
+   - 若 task-id 缺失或为空字符串 → 报错 "task-id required" 并停止（exit code 为非 0）。
+   - 不执行 git checkout / git branch / create-new-feature.sh。
+
+2. **加载模板**：
+   - 从 `./templates/spec-template.md`（本 SKILL.md 同目录下的相对路径）读取模板全文。
+   - **若文件不存在**：报错 "template not found at ./templates/spec-template.md" 并停止，不做 `.specify/` 回退，不调任何 speckit 脚本。
+
+3. **调用 metrics 记录骨架**：
+   - 指令调用 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字面量填 `spec-specify`。
+   - 传入 execution_id / skill_or_stage / stage / skill_version / executed / tokens / duration_ms / rework_rounds / human_intervention / friction_ref 十个核心字段种子。
+   - metrics 写失败只 warn 不 throw，不阻断主流程。
+
+4. **spec 生成步骤**（保留 speckit-specify 核心流程）：
+
+   1. **提取关键概念**：从功能描述中识别角色（actors）、动作（actions）、数据（data）、约束（constraints）。
+   2. **推断与假设**：对不明确点，基于上下文和行业惯例做合理推断，将推断依据记录到 spec 的"假设"段。
+   3. **[NEEDS CLARIFICATION] 标记**：
+      - 仅当选择显著影响 spec 范围/安全/UX 且无合理默认值时使用。
+      - **上限 3 个**。超过 3 个时，按优先级保留最重要的 3 个（范围 > 安全/隐私 > 用户体验 > 技术细节），其余做合理推断。
+   4. **填充 spec**：按模板章节结构逐章填充，用功能描述中的具体内容替换占位注释。
+   5. **FR 可测试性**：每条功能需求（FR）必须可测试、可验证。模糊需求应被"testable and unambiguous"检查项检出。
+
+5. **三档裁剪指令**：
+   - **A 档（硬门）**：以下五章必填，不可跳过——用户场景与用例、功能需求、不做和隐性必达、验收清单及未决问题、影响范围。
+   - **B 档（条件触发）**：模块划分、关键实体、数据和生命周期、兼容性预留——仅在功能涉及对应内容时填写，不触发的内容标"本期不涉及（理由：功能无 XX 需要）"并去除非空壳。
+   - **C 档（可精简）**：速读卡、问题陈述、背景目标和边界——必须填写但篇幅可控，各自 1-2 段。
+
+6. **产物写入**：
+   - 将 spec 写入 `specs/{task-id}/spec.md`（由 task-id 推导，不依赖 git branch）。
+   - 路径中 `{task-id}` 用入参 task-id 字面量替换。
+
+7. **质量检查清单生成**：
+   - 生成文件 `specs/{task-id}/checklists/requirements.md`，含以下检查项：
+
+     ```markdown
+     # 规格质量检查清单：[功能名]
+
+     用于在进入 plan 阶段前验证 spec 的完整性和质量。
+
+     ## 内容质量
+
+     - [ ] 无实现细节泄露（无编程语言、框架、API 名称）
+     - [ ] 聚焦用户价值与业务需求
+     - [ ] 非技术干系人可读
+     - [ ] 所有必填章节已完成
+
+     ## 需求完整性
+
+     - [ ] 所有 [NEEDS CLARIFICATION] 标记已解决
+     - [ ] 所有功能需求可测试、无歧义
+     - [ ] 成功标准可度量
+     - [ ] 成功标准不含实现细节
+     - [ ] 所有验收场景已定义
+     - [ ] 边界情况已标识
+     - [ ] 范围已明确界定
+     - [ ] 依赖和假设已记录
+
+     ## 功能就绪
+
+     - [ ] 每条功能需求有明确验收标准
+     - [ ] 用户场景覆盖主要流程
+     - [ ] 功能满足成功标准中定义的可度量目标
+     - [ ] 无实现细节泄漏进规格书
+     ```
+
+8. **验证检查清单**：对照检查清单逐项审查 spec：
+   - 若全部通过：标记 checklist 完成。
+   - 若有失败项（含 [NEEDS CLARIFICATION] 未解决）：
+     1. 更新 spec 解决各问题，最多迭代 3 次；
+     2. 3 次后仍未通过，记录剩余问题至 checklist notes 并警告用户。
+
+9. **[NEEDS CLARIFICATION] 交互格式**（Q1/Q2/Q3，保留 speckit-specify 原格式）：
+
+   当 spec 中存在 [NEEDS CLARIFICATION] 标记时：
+   - **一次性呈现全部题目**（最多 3 题），编号 Q1、Q2、Q3。
+   - **每题格式**：
+     - 所在章节及上下文（引用 spec 原文）
+     - 待澄清问题
+     - 3-5 个互斥选项（表格：选项 | 答案 | 影响），含推荐项（行标 **推荐**）+ 简短理由
+     - 等待用户一次性回答所有题目（如 "Q1: A, Q2: B, Q3: Custom - xxx"）
+   - 用户作答后，用其选择替换 spec 中对应的 [NEEDS CLARIFICATION] 标记。
+   - 澄清完成后重新跑验证检查清单。
+
+10. **调用 metrics 更新**：
+    - 指令调用 `metrics/collector.mjs` 的 `updateOwnResult`，更新 executed / tokens / duration_ms 等实际值。
+    - stage 字段保持 `spec-specify`。
+    - 写失败只 warn 不 throw。
+
+11. **报告完成**：输出 task-id、spec 产物路径、checklist 结果、是否可就绪进入下一阶段（spec-clarify 或 build-plan）。
+
+## 去耦约束
+
+本 skill 已从 speckit-specify 解耦，硬性约束如下：
+- **不执行 git 命令**：不执行 git checkout / git branch / git fetch / git ls-remote / create-new-feature.sh 或任何等效 git 操作。
+- **不读 `.specify/` 目录**：不从目标项目 `.specify/` 读取任何文件（模板、脚本、配置）。
+- **不调用 speckit 脚本**：不执行任何 `speckit-*` 前缀的脚本或命令行工具。
+
+> 注：以上声明为约束性禁止指令，不构成 speckit 脚本的"实际执行"——验证阶段按此 grep。
+
+## 产出
+
+- `specs/{task-id}/spec.md`：结构化功能规格书
+- `specs/{task-id}/checklists/requirements.md`：质量检查清单
+
+## 下一步
+
+- **澄清**：用 spec-clarify 消除歧义。
+- **编排**：build-spec SKILL.md 将本 skill 作为第一步，output 为下游 spec-clarify 的输入。
+
+## 通用原则
+
+- 关注**用户需要什么**（WHAT）和**为什么**（WHY），不关注**怎么实现**（HOW）——不提技术栈、API、代码结构。
+- 面向业务干系人撰写，非开发者。
+- 不做嵌入 spec 内部的 checklist（那是独立 skill 的产出）。
+- 成功标准必须：可度量（含具体指标）、技术无关（不提框架/语言/数据库）、用户视角（从用户/业务角度描述结果）、可验证（无需了解实现细节即可检验）。
+
+### 成功标准示例
+
+**好**：
+- "用户可在 3 分钟内完成结账"
+- "系统支持 10,000 并发用户"
+- "95% 搜索在 1 秒内返回结果"
+
+**差**（含实现细节）：
+- "API 响应时间低于 200ms"（太技术化）
+- "数据库承载 1000 TPS"（实现细节）
+- "React 组件高效渲染"（框架特定）
+
+### [NEEDS CLARIFICATION] 优先级
+
+当需要超过 3 个 NEEDS CLARIFICATION 时，保留优先级：范围 > 安全/隐私 > 用户体验 > 技术细节。其余做合理推断。
+
+### 合理默认值示例
+
+以下不必提问，直接取合理默认值：
+- 数据保留：行业的通行做法
+- 性能目标：标准 web/移动应用预期（未指定时）
+- 错误处理：用户友好提示 + 适当降级
+- 认证方式：web 应用标准 session 或 OAuth2
+- 集成模式：RESTful API（除非另有说明）
diff --git a/workflows/spec-specify/templates/spec-template.md b/workflows/spec-specify/templates/spec-template.md
new file mode 100644
index 0000000..93cf37e
--- /dev/null
+++ b/workflows/spec-specify/templates/spec-template.md
@@ -0,0 +1,169 @@
+# 功能规格：[功能名]
+
+> 基于 SPEC.md 生成。本文件由 spec-specify 根据上游功能描述自动填充。
+
+**功能名**: `{task-id}`
+**来源**: 上游 decision-log 决策记录
+**状态**: 草稿
+<!-- 生成时替换 {task-id} 为实际的 task-id 字面量 -->
+
+## 速读卡（30 秒看懂这个需求）
+
+<!-- 一句话需求 + 核心改动点 + 最大影响面 + 验收信号。全部必填，但篇幅可控。 -->
+
+- **一句话需求**：<!-- 用一句话说清这个功能要做什么 -->
+- **核心改动点**：<!-- 2-5 条，每条一句话 -->
+- **最大影响面**：<!-- 哪个模块/子系统最受影响 -->
+- **验收信号**：<!-- 如何判断"做完了、做对了" -->
+
+## 1. 问题陈述
+
+<!-- 1-2 段。描述当前状态和待解决问题，不涉及解决方案。 -->
+
+当前：<!-- 现状描述 -->。
+
+问题：<!-- 痛点/差距 -->。
+
+## 2. 背景、目标和边界
+
+### 背景
+
+<!-- 为什么现在做、与已有系统的关系。 -->
+
+### 目标
+
+<!-- 本功能完成后能做到什么，用可验证结果描述。 -->
+
+### 非目标（明确不做）
+
+<!-- 本期明确不做的事项。每条单独一行。 -->
+1. <!-- 不做事项 1 -->
+2. <!-- 不做事项 2 -->
+
+## 3. 用户场景与用例
+
+<!-- 角色 + 操作步骤 + 预期结果。覆盖正常路径、失败路径、边界路径。
+     每条场景含：（1）场景名；（2）角色；（3）前置条件；（4）操作步骤；（5）预期结果。 -->
+
+### 场景一：[场景名]（正常路径）
+
+- **角色**：<!-- 谁执行这个操作 -->
+- **前置条件**：<!-- Given 状态 -->
+- **操作步骤**：<!-- When 做了什么 -->
+- **预期结果**：<!-- Then 发生了什么 -->
+
+### 场景二：[场景名]（失败/边界路径）
+
+- **角色**：<!-- 谁执行 -->
+- **前置条件**：<!-- Given -->
+- **操作步骤**：<!-- When -->
+- **预期结果**：<!-- Then -->
+
+<!-- 按需补充更多场景 -->
+
+## 4. 功能需求
+
+<!-- 按功能域分组，编号 FR-{域缩写}-NNN。每条 FR 必须可测试。
+     溯源规则：每条 FR 标注来源（decision-log 决策编号或上游描述）。
+
+     示例格式：
+     #### 域：XXXX
+     - **FR-XX-001**：[需求描述]。来源：D-XX-1。
+       - **场景**：Given xxx, When xxx, Then xxx。
+     - **FR-XX-002**：[需求描述]。来源：用户描述 §3。
+       - **场景**：Given xxx, When xxx, Then xxx。
+-->
+
+### 域：XXX（给人读的域说明）
+
+- **FR-XXX-001**：[需求描述]。来源：<!-- 填写来源 -->。
+  - **场景**：Given <!-- 前置 -->, When <!-- 操作 -->, Then <!-- 预期 -->。
+
+<!-- 按功能域补充更多 FR -->
+
+## 5. 模块划分（条件触发）
+
+<!-- 仅当功能涉及多模块时有此章节；不触发时填 "本期不涉及（理由：功能无多模块交互需要）"。
+     每模块写出：负责什么 / 对外接口 / 依赖谁 / 测试边界。 -->
+
+### [模块名]
+
+- **负责什么**：<!-- 一句话 -->
+- **对外接口**：<!-- 产什么/收什么 -->
+- **依赖谁**：<!-- 调用路径 -->
+- **测试边界**：<!-- 什么可独立测 -->
+
+## 6. 关键实体（条件触发）
+
+<!-- 仅当功能涉及数据实体时有此章节。每实体描述其字段和关系。
+     不触发时填 "本期不涉及（理由：功能无数据实体定义需要）"。 -->
+
+### [实体名]
+
+- **定义**：<!-- 一句话 -->
+- **字段**：<!-- 关键字段列表 -->
+- **关系**：<!-- 与其他实体的关联 -->
+
+## 7. 数据和生命周期（条件触发）
+
+<!-- 仅当功能涉及数据流或持久化时有此章节。
+     不触发时填 "本期不涉及（理由：功能无数据生命周期需要）"。 -->
+
+- **数据粒度**：<!-- 单次操作/单任务/全局 -->
+- **数据时效**：<!-- 实时/批/归档 -->
+- **存储位置**：<!-- 文件路径/数据库 -->
+- **清理策略**：<!-- 保留期/淘汰规则 -->
+
+## 8. 兼容性预留（条件触发）
+
+<!-- 仅当功能需向后兼容或未来扩展预留时有此章节。
+     不触发时填 "本期不涉及（理由：功能无兼容性/扩展预留需要）"。 -->
+
+- **向后兼容**：<!-- 对已有消费方的影响 -->
+- **扩展预留**：<!-- 为未来留的接口/字段/格式空间 -->
+
+## 9. 不做和隐性必达
+
+### 明确不做
+
+> 以下逐条继承自 decision-log 的非目标声明。design/plan/build 阶段不得逾越。
+
+1. <!-- 不做事项 -->
+2. <!-- 不做事项 -->
+
+### 隐性必达
+
+<!-- 不能明写在 FR 里但必须成立的约束。如：不改某个外部系统、不引入新类别的门禁、测试套件不全绿即失败。 -->
+
+- **隐性必达 1**：<!-- 约束描述 -->
+- **隐性必达 2**：<!-- 约束描述 -->
+
+## 10. 验收清单及未决问题
+
+### 验收检查（success_criteria）
+
+<!-- 逐条可手动或命令验证。每条含失败判据，均可判真伪。
+     格式：AC1 ... ACn，每条标注可追溯到哪条 FR。 -->
+
+- [ ] **AC1**：<!-- 验收条目描述。反向：[失败条件] --> ← FR-XX-001
+- [ ] **AC2**：<!-- 验收条目描述。反向：[失败条件] --> ← FR-XX-002
+
+### 未决风险和问题
+
+<!-- 开放问题列表。已决问题标注 ~~删除线~~ + 简记决定摘要。 -->
+
+- **~~未决 1（主题）—— 已决~~**：<!-- 决定摘要 -->
+- **未决 2（主题）**：<!-- 待处理问题及影响 -->
+
+## 11. 影响范围（业务性质）
+
+<!-- 列出受影响的功能模块/文件及变更类型。
+     格式：模块名 | 文件 | 变更类型（新增/修改/删除）| 影响说明 -->
+
+- **受影响功能：[名称]**
+  - 既有行为：<!-- 现在是什么样的 -->
+  - 本需求影响：<!-- 会变成什么样 -->
+  - 回归要点：<!-- 什么不能坏 -->
+
+- **可能受冲击的业务规则**：<!-- 如有 -->
+- **明确无影响**：<!-- 哪些模块/系统不受影响 -->
2026-06-28T13:44:08.425403Z ERROR rmcp::transport::worker: worker quit with fatal: Transport channel closed, when AuthRequired(AuthRequiredError { www_authenticate_header: "Bearer resource_metadata=\"https://mcp.figma.com/.well-known/oauth-protected-resource\",scope=\"mcp:connect\",authorization_uri=\"https://api.figma.com/.well-known/oauth-authorization-server\"" })
hook: SessionStart
hook: SessionStart Completed
hook: UserPromptSubmit
hook: UserPromptSubmit Completed
codex
verdict: revise_required

**Blocking Findings**

1. `workflows/spec-specify/templates/spec-template.md:3` + `workflows/spec-specify/SKILL.md:40`

   spec-specify says it must record assumptions into the spec 的“假设”段, but the template has no `## 假设` / `## Assumptions` section. That means one required speckit quality mechanism is not genuinely preserved in the actual output shape. An agent must either invent an off-template section or drop assumptions.

   Fix: add an explicit assumptions section to `spec-template.md`, and make `SKILL.md` say every inferred default must be recorded there with source/rationale.

2. `workflows/spec-specify/SKILL.md:90-106`

   The validation step runs before the Q1/Q2/Q3 clarification flow and says failures, including unresolved `[NEEDS CLARIFICATION]`, should be fixed by updating the spec for up to 3 iterations. That conflicts with the later instruction to present unresolved `[NEEDS CLARIFICATION]` markers to the user in Q1/Q2/Q3 format.

   This can cause the skill to silently “resolve” clarification markers by inference instead of asking, which guts the required clarification mechanism.

   Fix: handle Q1/Q2/Q3 clarification before checklist validation. Validation must not auto-resolve `[NEEDS CLARIFICATION]`; it should fail until the user answers or the marker is removed through the required flow.

3. `workflows/spec-specify/templates/spec-template.md:84-94`, `workflows/spec-specify/templates/spec-template.md:107-115`, `workflows/spec-specify/templates/spec-template.md:158-161`, `workflows/spec-specify/SKILL.md:136-139`

   The template requires implementation-shaped content: module interfaces, dependencies, test boundaries, storage location as “文件路径/数据库”, affected files, and change type. But the skill also says the spec must focus on WHAT/WHY and avoid implementation details, and the generated checklist checks for “无实现细节泄露”.

   This makes the template internally impossible to satisfy: a correctly filled template can fail its own quality gate.

   Fix: either remove implementation-specific fields from the spec template, or rename/scope them as business/domain impact only. For example, replace “文件” with “受影响能力/业务区域”, and replace “存储位置：文件路径/数据库” with user-visible data ownership/lifecycle constraints.

4. `workflows/spec-specify/SKILL.md:157-164`

   The “合理默认值示例” introduces specific implementation defaults: OAuth2, session auth, RESTful API. That directly contradicts the same file’s “不关注怎么实现 / 不提技术栈、API、代码结构” rule.

   It also risks baking arbitrary architecture into a prompt-only spec skill, which violates simple-first and narrow-contract.

   Fix: rewrite defaults in product terms. Example: “认证方式：沿用现有产品认证机制；若无现有机制则标记 NEEDS CLARIFICATION”，not OAuth2/session.

5. `workflows/spec-clarify/SKILL.md:133` vs `workflows/spec-clarify/SKILL.md:144-160`

   The interaction loop says after accepting an answer, record it in working memory and “暂不写盘”, then advance to the next question. The next section says every accepted answer must immediately update and save the spec.

   That directly contradicts the required incremental spec update behavior.

   Fix: delete the “暂不写盘” instruction. After each accepted answer, update `## Clarifications`, integrate the answer into the relevant section, save the spec, then continue.

6. `workflows/spec-clarify/SKILL.md:100`, `workflows/spec-clarify/SKILL.md:121`, `workflows/spec-clarify/SKILL.md:125-127`

   spec-clarify allows short-answer questions when no discrete options exist, and the multiple-choice table includes a `Short` row. The milestone requirement says each question must have recommendation + rationale + 2-5 options.

   This weakens the speckit clarification discipline. Short answers are harder to validate, harder to integrate consistently, and easier for the agent to over-interpret.

   Fix: require 2-5 mutually exclusive options for every clarification question. If free text is allowed, it should be an explicit “Other” option with a <=5-word constraint, not a replacement for option design.

7. `workflows/spec-clarify/SKILL.md:19-23`

   The input contract contradicts itself. It says `task-id` is required, then says `spec-path` can be used directly, then says only the absence of both is fatal.

   This fails narrow-contract and makes task identity ambiguous for metrics, output reporting, and default spec location.

   Fix: choose one contract:
   - **Recommended**: require exactly one of `task-id` or `spec-path`; if `spec-path` is supplied without `task-id`, derive no task-id and report metrics with the explicit path.
   - Alternative: require `task-id` always, and allow `spec-path` only as an override for file location.

8. `workflows/spec-clarify/SKILL.md:30`, `workflows/spec-clarify/SKILL.md:190-191`

   Missing spec handling says to “指示先执行 spec-specify”, but does not explicitly say to stop/fail-loud with a concrete error. The milestone requires fail-loud behavior for missing locating input/spec.

   Fix: say exactly: `fail-loud: "spec not found at <path>; run spec-specify first" and stop. Do not create or infer a spec.`

**Non-Blocking Notes**

- Decoupling is mostly real. I do not see an actual instruction to run git, read `.specify/`, run `check-prerequisites.sh`, or call speckit scripts. The residual references are prohibition/source-attribution text, which is acceptable.

- `workflows/spec-specify/SKILL.md:8` and `workflows/spec-clarify/SKILL.md:8` reference local source paths under `~/.claude/skills/...`. That is not an execution dependency, but it is unnecessary in a portable workflowhub skill. Prefer replacing it with “Adapted from speckit” without a local absolute path.

- `workflows/spec-specify/SKILL.md:25` says “exit code 为非 0” inside a prompt-only skill. That is directionally fine, but prompt-only skills may not own a process exit code. Better wording: stop immediately and report the exact error string; if invoked by a runner, the runner should mark non-zero.

- Metrics wiring is present by name and stage, but still underspecified operationally. The files say to call `metrics/collector.mjs`, `recordSkeleton`, and `updateOwnResult`, but do not give an invocation shape or minimum payload example. Not blocking for a prompt-only port, but a later runner may interpret this inconsistently.

- The spec-specify quality checklist is reasonable, but because the template currently demands implementation details, the checklist can become performative. Fix the template first; otherwise checklist pass/fail will depend on agent taste.

- `workflows/spec-specify/templates/spec-template.md:3` says “基于 SPEC.md 生成”, but the skill input is a feature description or decision-log, not necessarily `SPEC.md`. This is confusing and should be changed to “基于上游功能描述生成”.
hook: Stop
hook: Stop Completed
tokens used
32,883

```

## Concise summary

Provider completed successfully. Review the raw output for details.

## Action items

- Review the response and extract decisions you want to apply.
- Capture follow-up implementation tasks if needed.
