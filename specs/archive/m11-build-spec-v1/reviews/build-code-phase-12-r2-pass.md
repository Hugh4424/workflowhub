# codex advisor artifact

- Provider: codex
- Exit code: 0
- Created at: 2026-06-28T13:52:13.229Z

## Original task

Heterologous independent cross-engine code review, ROUND 2, of two prompt-only skill files (workflows/spec-specify/SKILL.md + templates/spec-template.md, workflows/spec-clarify/SKILL.md) for workflowhub M11 build-code Phase 1+2. You are NOT the author.

Round 1 you returned revise_required with 8 blocking findings. They were supposed to be fixed. Verify each is genuinely closed (not cosmetic), then check for NEW blocking defects.

R1 blocking findings (verify closed):
B1: spec-template.md had no 假设/Assumptions section though SKILL.md requires recording assumptions there. Fix: add explicit assumptions section + SKILL.md records each inferred default with source/rationale.
B2: validation step ran BEFORE Q1/Q2/Q3 clarification and could auto-resolve [NEEDS CLARIFICATION] by inference, gutting clarification. Fix: clarification flow must come before checklist validation; validation must not auto-resolve markers.
B3: template demanded implementation-shaped fields (module interfaces, deps, test boundaries, storage as file-path/db, affected files, change type) while SKILL.md forbids implementation detail and checklist checks 无实现细节泄露 — template impossible to satisfy. Fix: reword those fields to business/domain terms.
B4: SKILL.md 合理默认值示例 baked in OAuth2/session/RESTful API, contradicting 不提技术栈/API rule. Fix: product-term defaults (沿用现有机制 else NEEDS CLARIFICATION).
B5: spec-clarify interaction loop said record answer in memory 暂不写盘 then advance, contradicting required immediate incremental spec save. Fix: delete 暂不写盘; save after each accepted answer.
B6: spec-clarify allowed short-answer questions / Short row, weakening discipline. Fix: every question 2-5 mutually exclusive options; free text only as explicit Other w/ <=5-word constraint.
B7: spec-clarify input contract self-contradictory (task-id required, then spec-path usable, then only both-absent fatal). Fix: require exactly one of task-id|spec-path.
B8: spec-clarify missing-spec handling didn't fail-loud with concrete error. Fix: fail-loud "spec not found at <path>; run spec-specify first" and stop.

Also confirm decoupling still real (no actual git/.specify/check-prerequisites execution instruction; prohibition+attribution text is fine), and speckit quality mechanisms still preserved (spec-specify: key-concept/assumptions/<=3 NEEDS CLARIFICATION Q1Q2Q3/3-tier tailoring; spec-clarify: 10 dims Clear/Partial/Missing, one-at-a-time, max5, coverage summary).

Output top line `verdict: pass` | `verdict: revise_required` | `verdict: escalate_to_human`, then per-B1..B8 closed/not-closed with file:line, then any NEW blocking, then non-blocking. Be precise. If clean, say pass.

=== GIT DIFF (Phase 1+2, after fixes) ===
diff --git a/workflows/spec-clarify/SKILL.md b/workflows/spec-clarify/SKILL.md
new file mode 100644
index 0000000..72dd8f1
--- /dev/null
+++ b/workflows/spec-clarify/SKILL.md
@@ -0,0 +1,215 @@
+---
+name: spec-clarify
+description: 对当前 task 的 spec 执行 10 维歧义扫描，通过最多 5 题交互澄清（一次一题+推荐），逐题增量更新 spec，完成时输出覆盖率摘要。改造自 speckit-clarify，适配为 workflowhub 契约。
+---
+
+# spec-clarify
+
+> 改造自 speckit-clarify，适配为 workflowhub 契约：
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
+- **task-id**：用于推导 spec 路径 `specs/{task-id}/spec.md` 并标识 metrics 记录。
+- **spec-path**：显式指定 spec 文件路径。提供时直接使用，不派生 task-id。
+
+task-id 和 spec-path 必须**恰好提供一个**。同时提供或均缺失 → fail-loud："必须提供 task-id 或 spec-path 二者之一" 并停止。
+
+若仅提供 spec-path（无 task-id）：metrics 以 spec-path 为标识上报，不派生 task-id。
+
+## spec 定位
+
+- 优先使用 spec-path（提供时）。
+- 否则通过 task-id 推导：`specs/{task-id}/spec.md`。
+- **不执行** git 命令、不调 check-prerequisites.sh、不读 `.specify/` 目录或 `.specify/feature.json`。
+- 若 spec 文件不存在，fail-loud: "spec not found at <path>; run spec-specify first" 然后 stop。不创建、不推断 spec。
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
+- 每题须为多选题（2-5 互斥选项）；自由文本仅可作为显式 Other 选项（<=5 词），不可替代选项设计。
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
+| Other  | 提供不同选项（<=5 词） |
+
+- 表格后追加："回复选项字母（如 'A'），'yes' / 'recommended' 采纳推荐，或提供 Other 选项回答。"
+
+**用户回答后：**
+- 若回复 "yes" / "recommended" / "suggested"，采用之前声明的推荐/建议为答案。
+- 否则验证答案映射到某选项或符合 <=5 词约束。
+- 若歧义，快速消歧（仍属同一题，不推进）。
+- 确认后立即执行步骤 4 的增量更新（写入 spec 并保存），然后推进到下一题。
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
+- 若 spec 文件缺失，fail-loud: "spec not found at <path>; run spec-specify first" 然后 stop。不在此创建新 spec。
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
index 0000000..e92dff0
--- /dev/null
+++ b/workflows/spec-specify/SKILL.md
@@ -0,0 +1,165 @@
+---
+name: spec-specify
+description: Create or update a feature specification from a natural language feature description. Adapted from speckit-specify for the workflowhub contract — no git branch coupling, task-id parameterized.
+---
+
+# spec-specify
+
+> 本文件改造自 speckit-specify，适配为 workflowhub 契约：
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
+   2. **推断与假设**：对不明确点，基于上下文和行业惯例做合理推断，将每条推断及其来源（从功能描述的哪个部分推断）、理由（为什么选这个默认值）记录到 spec 的 `## 假设` 段。
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
+8. **[NEEDS CLARIFICATION] 交互格式**（Q1/Q2/Q3，保留 speckit-specify 原格式）：
+
+   当 spec 中存在 [NEEDS CLARIFICATION] 标记时：
+   - **一次性呈现全部题目**（最多 3 题），编号 Q1、Q2、Q3。
+   - **每题格式**：
+     - 所在章节及上下文（引用 spec 原文）
+     - 待澄清问题
+     - 3-5 个互斥选项（表格：选项 | 答案 | 影响），含推荐项（行标 **推荐**）+ 简短理由
+     - 等待用户一次性回答所有题目（如 "Q1: A, Q2: B, Q3: Custom - xxx"）
+   - 用户作答后，用其选择替换 spec 中对应的 [NEEDS CLARIFICATION] 标记。
+   - 澄清完成后进入步骤 9 验证检查清单。
+
+9. **验证检查清单**：对照检查清单逐项审查 spec：
+   - 若全部通过：标记 checklist 完成。
+   - 若有非 [NEEDS CLARIFICATION] 类失败项（如缺少验收场景、FR 不可测试）：
+     1. 更新 spec 解决各问题，最多迭代 3 次；
+     2. 3 次后仍未通过，记录剩余问题至 checklist notes 并警告用户。
+   - **[NEEDS CLARIFICATION] 类检查项**：不得通过更新 spec 自行消解澄清标记。若检查清单的"所有 [NEEDS CLARIFICATION] 标记已解决"项尚未通过，必须返回步骤 8 用 Q1/Q2/Q3 呈现给用户，或保持失败并注明"等待用户回答"。禁止通过推断替换 [NEEDS CLARIFICATION] 标记来绕过澄清。
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
+以下不必提问，直接取合理默认值（全部采用产品/领域口径，不写具体技术栈、协议或框架）：
+- 数据保留：行业的通行做法
+- 性能目标：行业同类产品常见体验水准（未指定时）
+- 错误处理：用户友好提示 + 适当降级
+- 认证方式：沿用现有产品认证机制；若无现有机制则标记 NEEDS CLARIFICATION
+- 集成模式：沿用已有集成通道；若无则假定为已有模块间协作方式，跨系统集成需澄清
diff --git a/workflows/spec-specify/templates/spec-template.md b/workflows/spec-specify/templates/spec-template.md
new file mode 100644
index 0000000..b292796
--- /dev/null
+++ b/workflows/spec-specify/templates/spec-template.md
@@ -0,0 +1,176 @@
+# 功能规格：[功能名]
+
+> 基于上游功能描述和 decision-log 生成。本文件由 spec-specify 自动填充。
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
+### 假设
+
+<!-- spec-specify 生成 spec 时做的每一条推断都记在这里。每条假设注明来源（从哪段功能描述推断的）和理由（为什么选这个默认值）。 -->
+
+- **假设 1**：<!-- 推断内容。来源：[功能描述中的哪个表述]。理由：[为什么这样假设]。 -->
+- **假设 2**：<!-- 推断内容。来源：...。理由：...。 -->
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
+     每模块写出：负责什么业务能力 / 对上下游提供什么 / 需要哪些业务能力 / 什么可独立验收。 -->
+
+### [模块名]
+
+- **负责什么**：<!-- 一句话，描述业务职责 -->
+- **对外提供什么业务能力**：<!-- 对上下游产出的业务结果 -->
+- **需要哪些上游业务能力**：<!-- 依赖哪些上游模块的业务输出 -->
+- **验收边界**：<!-- 什么可独立验收、不依赖下游 -->
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
+- **数据归属与生命周期约束（用户可见）**：<!-- 谁持有数据、数据多久失效或归档 -->
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
+<!-- 列出受影响的功能模块/业务区域及变更性质。
+     格式：业务区域 | 变更性质（新增/修改/删除）| 影响说明 -->
+
+- **受影响功能：[名称]**
+  - 既有行为：<!-- 现在是什么样的 -->
+  - 本需求影响：<!-- 会变成什么样 -->
+  - 回归要点：<!-- 什么不能坏 -->
+
+- **可能受冲击的业务规则**：<!-- 如有 -->
+- **明确无影响**：<!-- 哪些模块/系统不受影响 -->

## Final prompt

Heterologous independent cross-engine code review, ROUND 2, of two prompt-only skill files (workflows/spec-specify/SKILL.md + templates/spec-template.md, workflows/spec-clarify/SKILL.md) for workflowhub M11 build-code Phase 1+2. You are NOT the author.

Round 1 you returned revise_required with 8 blocking findings. They were supposed to be fixed. Verify each is genuinely closed (not cosmetic), then check for NEW blocking defects.

R1 blocking findings (verify closed):
B1: spec-template.md had no 假设/Assumptions section though SKILL.md requires recording assumptions there. Fix: add explicit assumptions section + SKILL.md records each inferred default with source/rationale.
B2: validation step ran BEFORE Q1/Q2/Q3 clarification and could auto-resolve [NEEDS CLARIFICATION] by inference, gutting clarification. Fix: clarification flow must come before checklist validation; validation must not auto-resolve markers.
B3: template demanded implementation-shaped fields (module interfaces, deps, test boundaries, storage as file-path/db, affected files, change type) while SKILL.md forbids implementation detail and checklist checks 无实现细节泄露 — template impossible to satisfy. Fix: reword those fields to business/domain terms.
B4: SKILL.md 合理默认值示例 baked in OAuth2/session/RESTful API, contradicting 不提技术栈/API rule. Fix: product-term defaults (沿用现有机制 else NEEDS CLARIFICATION).
B5: spec-clarify interaction loop said record answer in memory 暂不写盘 then advance, contradicting required immediate incremental spec save. Fix: delete 暂不写盘; save after each accepted answer.
B6: spec-clarify allowed short-answer questions / Short row, weakening discipline. Fix: every question 2-5 mutually exclusive options; free text only as explicit Other w/ <=5-word constraint.
B7: spec-clarify input contract self-contradictory (task-id required, then spec-path usable, then only both-absent fatal). Fix: require exactly one of task-id|spec-path.
B8: spec-clarify missing-spec handling didn't fail-loud with concrete error. Fix: fail-loud "spec not found at <path>; run spec-specify first" and stop.

Also confirm decoupling still real (no actual git/.specify/check-prerequisites execution instruction; prohibition+attribution text is fine), and speckit quality mechanisms still preserved (spec-specify: key-concept/assumptions/<=3 NEEDS CLARIFICATION Q1Q2Q3/3-tier tailoring; spec-clarify: 10 dims Clear/Partial/Missing, one-at-a-time, max5, coverage summary).

Output top line `verdict: pass` | `verdict: revise_required` | `verdict: escalate_to_human`, then per-B1..B8 closed/not-closed with file:line, then any NEW blocking, then non-blocking. Be precise. If clean, say pass.

=== GIT DIFF (Phase 1+2, after fixes) ===
diff --git a/workflows/spec-clarify/SKILL.md b/workflows/spec-clarify/SKILL.md
new file mode 100644
index 0000000..72dd8f1
--- /dev/null
+++ b/workflows/spec-clarify/SKILL.md
@@ -0,0 +1,215 @@
+---
+name: spec-clarify
+description: 对当前 task 的 spec 执行 10 维歧义扫描，通过最多 5 题交互澄清（一次一题+推荐），逐题增量更新 spec，完成时输出覆盖率摘要。改造自 speckit-clarify，适配为 workflowhub 契约。
+---
+
+# spec-clarify
+
+> 改造自 speckit-clarify，适配为 workflowhub 契约：
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
+- **task-id**：用于推导 spec 路径 `specs/{task-id}/spec.md` 并标识 metrics 记录。
+- **spec-path**：显式指定 spec 文件路径。提供时直接使用，不派生 task-id。
+
+task-id 和 spec-path 必须**恰好提供一个**。同时提供或均缺失 → fail-loud："必须提供 task-id 或 spec-path 二者之一" 并停止。
+
+若仅提供 spec-path（无 task-id）：metrics 以 spec-path 为标识上报，不派生 task-id。
+
+## spec 定位
+
+- 优先使用 spec-path（提供时）。
+- 否则通过 task-id 推导：`specs/{task-id}/spec.md`。
+- **不执行** git 命令、不调 check-prerequisites.sh、不读 `.specify/` 目录或 `.specify/feature.json`。
+- 若 spec 文件不存在，fail-loud: "spec not found at <path>; run spec-specify first" 然后 stop。不创建、不推断 spec。
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
+- 每题须为多选题（2-5 互斥选项）；自由文本仅可作为显式 Other 选项（<=5 词），不可替代选项设计。
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
+| Other  | 提供不同选项（<=5 词） |
+
+- 表格后追加："回复选项字母（如 'A'），'yes' / 'recommended' 采纳推荐，或提供 Other 选项回答。"
+
+**用户回答后：**
+- 若回复 "yes" / "recommended" / "suggested"，采用之前声明的推荐/建议为答案。
+- 否则验证答案映射到某选项或符合 <=5 词约束。
+- 若歧义，快速消歧（仍属同一题，不推进）。
+- 确认后立即执行步骤 4 的增量更新（写入 spec 并保存），然后推进到下一题。
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
+- 若 spec 文件缺失，fail-loud: "spec not found at <path>; run spec-specify first" 然后 stop。不在此创建新 spec。
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
index 0000000..e92dff0
--- /dev/null
+++ b/workflows/spec-specify/SKILL.md
@@ -0,0 +1,165 @@
+---
+name: spec-specify
+description: Create or update a feature specification from a natural language feature description. Adapted from speckit-specify for the workflowhub contract — no git branch coupling, task-id parameterized.
+---
+
+# spec-specify
+
+> 本文件改造自 speckit-specify，适配为 workflowhub 契约：
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
+   2. **推断与假设**：对不明确点，基于上下文和行业惯例做合理推断，将每条推断及其来源（从功能描述的哪个部分推断）、理由（为什么选这个默认值）记录到 spec 的 `## 假设` 段。
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
+8. **[NEEDS CLARIFICATION] 交互格式**（Q1/Q2/Q3，保留 speckit-specify 原格式）：
+
+   当 spec 中存在 [NEEDS CLARIFICATION] 标记时：
+   - **一次性呈现全部题目**（最多 3 题），编号 Q1、Q2、Q3。
+   - **每题格式**：
+     - 所在章节及上下文（引用 spec 原文）
+     - 待澄清问题
+     - 3-5 个互斥选项（表格：选项 | 答案 | 影响），含推荐项（行标 **推荐**）+ 简短理由
+     - 等待用户一次性回答所有题目（如 "Q1: A, Q2: B, Q3: Custom - xxx"）
+   - 用户作答后，用其选择替换 spec 中对应的 [NEEDS CLARIFICATION] 标记。
+   - 澄清完成后进入步骤 9 验证检查清单。
+
+9. **验证检查清单**：对照检查清单逐项审查 spec：
+   - 若全部通过：标记 checklist 完成。
+   - 若有非 [NEEDS CLARIFICATION] 类失败项（如缺少验收场景、FR 不可测试）：
+     1. 更新 spec 解决各问题，最多迭代 3 次；
+     2. 3 次后仍未通过，记录剩余问题至 checklist notes 并警告用户。
+   - **[NEEDS CLARIFICATION] 类检查项**：不得通过更新 spec 自行消解澄清标记。若检查清单的"所有 [NEEDS CLARIFICATION] 标记已解决"项尚未通过，必须返回步骤 8 用 Q1/Q2/Q3 呈现给用户，或保持失败并注明"等待用户回答"。禁止通过推断替换 [NEEDS CLARIFICATION] 标记来绕过澄清。
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
+以下不必提问，直接取合理默认值（全部采用产品/领域口径，不写具体技术栈、协议或框架）：
+- 数据保留：行业的通行做法
+- 性能目标：行业同类产品常见体验水准（未指定时）
+- 错误处理：用户友好提示 + 适当降级
+- 认证方式：沿用现有产品认证机制；若无现有机制则标记 NEEDS CLARIFICATION
+- 集成模式：沿用已有集成通道；若无则假定为已有模块间协作方式，跨系统集成需澄清
diff --git a/workflows/spec-specify/templates/spec-template.md b/workflows/spec-specify/templates/spec-template.md
new file mode 100644
index 0000000..b292796
--- /dev/null
+++ b/workflows/spec-specify/templates/spec-template.md
@@ -0,0 +1,176 @@
+# 功能规格：[功能名]
+
+> 基于上游功能描述和 decision-log 生成。本文件由 spec-specify 自动填充。
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
+### 假设
+
+<!-- spec-specify 生成 spec 时做的每一条推断都记在这里。每条假设注明来源（从哪段功能描述推断的）和理由（为什么选这个默认值）。 -->
+
+- **假设 1**：<!-- 推断内容。来源：[功能描述中的哪个表述]。理由：[为什么这样假设]。 -->
+- **假设 2**：<!-- 推断内容。来源：...。理由：...。 -->
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
+     每模块写出：负责什么业务能力 / 对上下游提供什么 / 需要哪些业务能力 / 什么可独立验收。 -->
+
+### [模块名]
+
+- **负责什么**：<!-- 一句话，描述业务职责 -->
+- **对外提供什么业务能力**：<!-- 对上下游产出的业务结果 -->
+- **需要哪些上游业务能力**：<!-- 依赖哪些上游模块的业务输出 -->
+- **验收边界**：<!-- 什么可独立验收、不依赖下游 -->
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
+- **数据归属与生命周期约束（用户可见）**：<!-- 谁持有数据、数据多久失效或归档 -->
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
+<!-- 列出受影响的功能模块/业务区域及变更性质。
+     格式：业务区域 | 变更性质（新增/修改/删除）| 影响说明 -->
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
verdict: pass

| Item | Status | Evidence | Note |
|---|---|---|---|
| B1 | closed | [spec-template.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/templates/spec-template.md:43), [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:40) | 模板已有 `### 假设`；SKILL 要求每条推断记录来源和理由 |
| B2 | closed | [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:90), [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:102) | Q1/Q2/Q3 澄清在验证前；验证明确禁止自行消解澄清标记 |
| B3 | closed | [spec-template.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/templates/spec-template.md:91), [spec-template.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/templates/spec-template.md:114), [spec-template.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/templates/spec-template.md:165) | 已改为业务能力、关键实体、用户可见生命周期、业务影响范围 |
| B4 | closed | [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:158) | 默认值示例改为产品/领域口径；认证和集成都要求沿用现有机制，否则澄清 |
| B5 | closed | [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:130), [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:141), [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:156) | 删除“暂不写盘”逻辑；每题接受后立即写入并保存 |
| B6 | closed | [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:101), [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:117) | 每题 2-5 个互斥选项；Other 仅显式自由文本且 <=5 词 |
| B7 | closed | [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:17), [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:22) | 输入契约明确要求 task-id 和 spec-path 恰好一个 |
| B8 | closed | [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:31), [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:188) | 缺失 spec 时 fail-loud，错误文本具体，并停止 |

**Decoupling Check**

Pass. 没有实际执行 git、`.specify`、`check-prerequisites` 的指令。

证据：
- spec-specify 禁止 git / `.specify` / speckit 脚本：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:116)
- spec-specify 明确禁止项只是约束性文本，不算实际执行：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:123)
- spec-clarify 禁止 git / check-prerequisites / `.specify`：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:30), [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:200)

**Speckit Quality Mechanisms**

Pass.

spec-specify 保留：
- key-concept extraction：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:39)
- assumptions with source/rationale：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:40)
- <=3 NEEDS CLARIFICATION：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:41)
- Q1/Q2/Q3 clarification format：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:90)
- 3-tier tailoring：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:47)

spec-clarify 保留：
- 10 dimensions with Clear / Partial / Missing：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:37)
- one-at-a-time interaction：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:110)
- max 5 questions：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:100), [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:189)
- coverage summary：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:177)

**NEW Blocking**

None.

**Non-Blocking**

- Minor heading mismatch: spec-specify says assumptions go to `## 假设` at [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:40), while the template heading is `### 假设` under section 2 at [spec-template.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/templates/spec-template.md:43). This is not blocking because the section exists and is clearly named, but aligning the heading reference would reduce ambiguity.
- `spec-template.md` still uses “接口/字段/格式空间” in the compatibility reservation hint at [spec-template.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/templates/spec-template.md:130). It is acceptable in context, but “业务扩展点/数据项/格式空间” would be cleaner and less implementation-suggestive.


2026-06-28T13:50:37.557665Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T13:50:37.557682Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/anti-forgery-evidence/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T13:50:37.557684Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-28T13:50:37.557686Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/stage-summary/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T13:50:37.557687Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/verify-change/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T13:50:37.557688Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/handoff/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T13:50:37.557689Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/design-fidelity-component-contract/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T13:50:37.557690Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/capture-workflow-feedback/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T13:50:37.557690Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/tdd-red-green/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T13:50:37.557691Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/Hugh/CC/skills/pax-presentation-editable/SKILL.md: missing YAML frontmatter delimited by ---
2026-06-28T13:50:37.557692Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/neon-slides/SKILL.md: invalid YAML: mapping values are not allowed in this context at line 2 column 193
2026-06-28T13:50:37.557693Z ERROR codex_core::session::session: failed to load skill /Users/Hugh/.claude/skills/browser-use/SKILL.md: missing YAML frontmatter delimited by ---
OpenAI Codex v0.135.0
--------
workdir: /Users/Hugh/Hugh/Project/workflowhub
model: gpt-5.5
provider: openai
approval: never
sandbox: danger-full-access
reasoning effort: high
reasoning summaries: none
session id: 019f0e7f-0fb7-7733-b39f-7db2f4772bf6
--------
user
Heterologous independent cross-engine code review, ROUND 2, of two prompt-only skill files (workflows/spec-specify/SKILL.md + templates/spec-template.md, workflows/spec-clarify/SKILL.md) for workflowhub M11 build-code Phase 1+2. You are NOT the author.

Round 1 you returned revise_required with 8 blocking findings. They were supposed to be fixed. Verify each is genuinely closed (not cosmetic), then check for NEW blocking defects.

R1 blocking findings (verify closed):
B1: spec-template.md had no 假设/Assumptions section though SKILL.md requires recording assumptions there. Fix: add explicit assumptions section + SKILL.md records each inferred default with source/rationale.
B2: validation step ran BEFORE Q1/Q2/Q3 clarification and could auto-resolve [NEEDS CLARIFICATION] by inference, gutting clarification. Fix: clarification flow must come before checklist validation; validation must not auto-resolve markers.
B3: template demanded implementation-shaped fields (module interfaces, deps, test boundaries, storage as file-path/db, affected files, change type) while SKILL.md forbids implementation detail and checklist checks 无实现细节泄露 — template impossible to satisfy. Fix: reword those fields to business/domain terms.
B4: SKILL.md 合理默认值示例 baked in OAuth2/session/RESTful API, contradicting 不提技术栈/API rule. Fix: product-term defaults (沿用现有机制 else NEEDS CLARIFICATION).
B5: spec-clarify interaction loop said record answer in memory 暂不写盘 then advance, contradicting required immediate incremental spec save. Fix: delete 暂不写盘; save after each accepted answer.
B6: spec-clarify allowed short-answer questions / Short row, weakening discipline. Fix: every question 2-5 mutually exclusive options; free text only as explicit Other w/ <=5-word constraint.
B7: spec-clarify input contract self-contradictory (task-id required, then spec-path usable, then only both-absent fatal). Fix: require exactly one of task-id|spec-path.
B8: spec-clarify missing-spec handling didn't fail-loud with concrete error. Fix: fail-loud "spec not found at <path>; run spec-specify first" and stop.

Also confirm decoupling still real (no actual git/.specify/check-prerequisites execution instruction; prohibition+attribution text is fine), and speckit quality mechanisms still preserved (spec-specify: key-concept/assumptions/<=3 NEEDS CLARIFICATION Q1Q2Q3/3-tier tailoring; spec-clarify: 10 dims Clear/Partial/Missing, one-at-a-time, max5, coverage summary).

Output top line `verdict: pass` | `verdict: revise_required` | `verdict: escalate_to_human`, then per-B1..B8 closed/not-closed with file:line, then any NEW blocking, then non-blocking. Be precise. If clean, say pass.

=== GIT DIFF (Phase 1+2, after fixes) ===
diff --git a/workflows/spec-clarify/SKILL.md b/workflows/spec-clarify/SKILL.md
new file mode 100644
index 0000000..72dd8f1
--- /dev/null
+++ b/workflows/spec-clarify/SKILL.md
@@ -0,0 +1,215 @@
+---
+name: spec-clarify
+description: 对当前 task 的 spec 执行 10 维歧义扫描，通过最多 5 题交互澄清（一次一题+推荐），逐题增量更新 spec，完成时输出覆盖率摘要。改造自 speckit-clarify，适配为 workflowhub 契约。
+---
+
+# spec-clarify
+
+> 改造自 speckit-clarify，适配为 workflowhub 契约：
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
+- **task-id**：用于推导 spec 路径 `specs/{task-id}/spec.md` 并标识 metrics 记录。
+- **spec-path**：显式指定 spec 文件路径。提供时直接使用，不派生 task-id。
+
+task-id 和 spec-path 必须**恰好提供一个**。同时提供或均缺失 → fail-loud："必须提供 task-id 或 spec-path 二者之一" 并停止。
+
+若仅提供 spec-path（无 task-id）：metrics 以 spec-path 为标识上报，不派生 task-id。
+
+## spec 定位
+
+- 优先使用 spec-path（提供时）。
+- 否则通过 task-id 推导：`specs/{task-id}/spec.md`。
+- **不执行** git 命令、不调 check-prerequisites.sh、不读 `.specify/` 目录或 `.specify/feature.json`。
+- 若 spec 文件不存在，fail-loud: "spec not found at <path>; run spec-specify first" 然后 stop。不创建、不推断 spec。
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
+- 每题须为多选题（2-5 互斥选项）；自由文本仅可作为显式 Other 选项（<=5 词），不可替代选项设计。
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
+| Other  | 提供不同选项（<=5 词） |
+
+- 表格后追加："回复选项字母（如 'A'），'yes' / 'recommended' 采纳推荐，或提供 Other 选项回答。"
+
+**用户回答后：**
+- 若回复 "yes" / "recommended" / "suggested"，采用之前声明的推荐/建议为答案。
+- 否则验证答案映射到某选项或符合 <=5 词约束。
+- 若歧义，快速消歧（仍属同一题，不推进）。
+- 确认后立即执行步骤 4 的增量更新（写入 spec 并保存），然后推进到下一题。
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
+- 若 spec 文件缺失，fail-loud: "spec not found at <path>; run spec-specify first" 然后 stop。不在此创建新 spec。
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
index 0000000..e92dff0
--- /dev/null
+++ b/workflows/spec-specify/SKILL.md
@@ -0,0 +1,165 @@
+---
+name: spec-specify
+description: Create or update a feature specification from a natural language feature description. Adapted from speckit-specify for the workflowhub contract — no git branch coupling, task-id parameterized.
+---
+
+# spec-specify
+
+> 本文件改造自 speckit-specify，适配为 workflowhub 契约：
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
+   2. **推断与假设**：对不明确点，基于上下文和行业惯例做合理推断，将每条推断及其来源（从功能描述的哪个部分推断）、理由（为什么选这个默认值）记录到 spec 的 `## 假设` 段。
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
+8. **[NEEDS CLARIFICATION] 交互格式**（Q1/Q2/Q3，保留 speckit-specify 原格式）：
+
+   当 spec 中存在 [NEEDS CLARIFICATION] 标记时：
+   - **一次性呈现全部题目**（最多 3 题），编号 Q1、Q2、Q3。
+   - **每题格式**：
+     - 所在章节及上下文（引用 spec 原文）
+     - 待澄清问题
+     - 3-5 个互斥选项（表格：选项 | 答案 | 影响），含推荐项（行标 **推荐**）+ 简短理由
+     - 等待用户一次性回答所有题目（如 "Q1: A, Q2: B, Q3: Custom - xxx"）
+   - 用户作答后，用其选择替换 spec 中对应的 [NEEDS CLARIFICATION] 标记。
+   - 澄清完成后进入步骤 9 验证检查清单。
+
+9. **验证检查清单**：对照检查清单逐项审查 spec：
+   - 若全部通过：标记 checklist 完成。
+   - 若有非 [NEEDS CLARIFICATION] 类失败项（如缺少验收场景、FR 不可测试）：
+     1. 更新 spec 解决各问题，最多迭代 3 次；
+     2. 3 次后仍未通过，记录剩余问题至 checklist notes 并警告用户。
+   - **[NEEDS CLARIFICATION] 类检查项**：不得通过更新 spec 自行消解澄清标记。若检查清单的"所有 [NEEDS CLARIFICATION] 标记已解决"项尚未通过，必须返回步骤 8 用 Q1/Q2/Q3 呈现给用户，或保持失败并注明"等待用户回答"。禁止通过推断替换 [NEEDS CLARIFICATION] 标记来绕过澄清。
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
+以下不必提问，直接取合理默认值（全部采用产品/领域口径，不写具体技术栈、协议或框架）：
+- 数据保留：行业的通行做法
+- 性能目标：行业同类产品常见体验水准（未指定时）
+- 错误处理：用户友好提示 + 适当降级
+- 认证方式：沿用现有产品认证机制；若无现有机制则标记 NEEDS CLARIFICATION
+- 集成模式：沿用已有集成通道；若无则假定为已有模块间协作方式，跨系统集成需澄清
diff --git a/workflows/spec-specify/templates/spec-template.md b/workflows/spec-specify/templates/spec-template.md
new file mode 100644
index 0000000..b292796
--- /dev/null
+++ b/workflows/spec-specify/templates/spec-template.md
@@ -0,0 +1,176 @@
+# 功能规格：[功能名]
+
+> 基于上游功能描述和 decision-log 生成。本文件由 spec-specify 自动填充。
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
+### 假设
+
+<!-- spec-specify 生成 spec 时做的每一条推断都记在这里。每条假设注明来源（从哪段功能描述推断的）和理由（为什么选这个默认值）。 -->
+
+- **假设 1**：<!-- 推断内容。来源：[功能描述中的哪个表述]。理由：[为什么这样假设]。 -->
+- **假设 2**：<!-- 推断内容。来源：...。理由：...。 -->
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
+     每模块写出：负责什么业务能力 / 对上下游提供什么 / 需要哪些业务能力 / 什么可独立验收。 -->
+
+### [模块名]
+
+- **负责什么**：<!-- 一句话，描述业务职责 -->
+- **对外提供什么业务能力**：<!-- 对上下游产出的业务结果 -->
+- **需要哪些上游业务能力**：<!-- 依赖哪些上游模块的业务输出 -->
+- **验收边界**：<!-- 什么可独立验收、不依赖下游 -->
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
+- **数据归属与生命周期约束（用户可见）**：<!-- 谁持有数据、数据多久失效或归档 -->
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
+<!-- 列出受影响的功能模块/业务区域及变更性质。
+     格式：业务区域 | 变更性质（新增/修改/删除）| 影响说明 -->
+
+- **受影响功能：[名称]**
+  - 既有行为：<!-- 现在是什么样的 -->
+  - 本需求影响：<!-- 会变成什么样 -->
+  - 回归要点：<!-- 什么不能坏 -->
+
+- **可能受冲击的业务规则**：<!-- 如有 -->
+- **明确无影响**：<!-- 哪些模块/系统不受影响 -->
2026-06-28T13:50:38.463301Z ERROR rmcp::transport::worker: worker quit with fatal: Transport channel closed, when AuthRequired(AuthRequiredError { www_authenticate_header: "Bearer resource_metadata=\"https://mcp.figma.com/.well-known/oauth-protected-resource\",scope=\"mcp:connect\",authorization_uri=\"https://api.figma.com/.well-known/oauth-authorization-server\"" })
hook: SessionStart
hook: SessionStart Completed
hook: UserPromptSubmit
hook: UserPromptSubmit Completed
codex
我会按你列的 B1-B8 逐条复核实际文件行号，再扫一遍是否有新的阻断问题。重点只看这三个 prompt-only 文件，不扩大范围。
exec
/bin/bash -lc "nl -ba workflows/spec-specify/templates/spec-template.md | sed -n '1,220p'" in /Users/Hugh/Hugh/Project/workflowhub
exec
/bin/bash -lc "nl -ba workflows/spec-specify/SKILL.md | sed -n '1,220p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
     1	---
     2	name: spec-specify
     3	description: Create or update a feature specification from a natural language feature description. Adapted from speckit-specify for the workflowhub contract — no git branch coupling, task-id parameterized.
     4	---
     5	
     6	# spec-specify
     7	
     8	> 本文件改造自 speckit-specify，适配为 workflowhub 契约：
     9	> - 去 git 分支耦合，改用 task-id 参数推导产物路径；
    10	> - 模板由 workflowhub 内置（`./templates/spec-template.md`），不读目标项目 `.specify/`；
    11	> - 接 workflowhub M4 metrics 系统（`metrics/collector.mjs`）的 recordSkeleton + updateOwnResult。
    12	> - 核心质量机制完整保留：关键概念提取、假设记录、≤3 个 NEEDS CLARIFICATION、FR 可测试、质量检查清单、Q1/Q2/Q3 交互格式（3-5 互斥选项+推荐）。
    13	
    14	## 输入
    15	
    16	- **task-id**（必填，string 字面量）：任务 ID，用于推导产物路径 `specs/{task-id}/`。
    17	  - **缺失时 fail-loud**：立即报错 "task-id required"，停止执行，不推测、不静默回退、不做分支推断。
    18	- **功能描述文本**：来自上游 make-decision 产出的 decision-log 或用户直接提供的自然语言功能描述。
    19	
    20	如果描述缺失或不清晰，先问一个精准问题再继续。
    21	
    22	## 工作流程
    23	
    24	1. **检查 task-id 参数**：
    25	   - 若 task-id 缺失或为空字符串 → 报错 "task-id required" 并停止（exit code 为非 0）。
    26	   - 不执行 git checkout / git branch / create-new-feature.sh。
    27	
    28	2. **加载模板**：
    29	   - 从 `./templates/spec-template.md`（本 SKILL.md 同目录下的相对路径）读取模板全文。
    30	   - **若文件不存在**：报错 "template not found at ./templates/spec-template.md" 并停止，不做 `.specify/` 回退，不调任何 speckit 脚本。
    31	
    32	3. **调用 metrics 记录骨架**：
    33	   - 指令调用 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字面量填 `spec-specify`。
    34	   - 传入 execution_id / skill_or_stage / stage / skill_version / executed / tokens / duration_ms / rework_rounds / human_intervention / friction_ref 十个核心字段种子。
    35	   - metrics 写失败只 warn 不 throw，不阻断主流程。
    36	
    37	4. **spec 生成步骤**（保留 speckit-specify 核心流程）：
    38	
    39	   1. **提取关键概念**：从功能描述中识别角色（actors）、动作（actions）、数据（data）、约束（constraints）。
    40	   2. **推断与假设**：对不明确点，基于上下文和行业惯例做合理推断，将每条推断及其来源（从功能描述的哪个部分推断）、理由（为什么选这个默认值）记录到 spec 的 `## 假设` 段。
    41	   3. **[NEEDS CLARIFICATION] 标记**：
    42	      - 仅当选择显著影响 spec 范围/安全/UX 且无合理默认值时使用。
    43	      - **上限 3 个**。超过 3 个时，按优先级保留最重要的 3 个（范围 > 安全/隐私 > 用户体验 > 技术细节），其余做合理推断。
    44	   4. **填充 spec**：按模板章节结构逐章填充，用功能描述中的具体内容替换占位注释。
    45	   5. **FR 可测试性**：每条功能需求（FR）必须可测试、可验证。模糊需求应被"testable and unambiguous"检查项检出。
    46	
    47	5. **三档裁剪指令**：
    48	   - **A 档（硬门）**：以下五章必填，不可跳过——用户场景与用例、功能需求、不做和隐性必达、验收清单及未决问题、影响范围。
    49	   - **B 档（条件触发）**：模块划分、关键实体、数据和生命周期、兼容性预留——仅在功能涉及对应内容时填写，不触发的内容标"本期不涉及（理由：功能无 XX 需要）"并去除非空壳。
    50	   - **C 档（可精简）**：速读卡、问题陈述、背景目标和边界——必须填写但篇幅可控，各自 1-2 段。
    51	
    52	6. **产物写入**：
    53	   - 将 spec 写入 `specs/{task-id}/spec.md`（由 task-id 推导，不依赖 git branch）。
    54	   - 路径中 `{task-id}` 用入参 task-id 字面量替换。
    55	
    56	7. **质量检查清单生成**：
    57	   - 生成文件 `specs/{task-id}/checklists/requirements.md`，含以下检查项：
    58	
    59	     ```markdown
    60	     # 规格质量检查清单：[功能名]
    61	
    62	     用于在进入 plan 阶段前验证 spec 的完整性和质量。
    63	
    64	     ## 内容质量
    65	
    66	     - [ ] 无实现细节泄露（无编程语言、框架、API 名称）
    67	     - [ ] 聚焦用户价值与业务需求
    68	     - [ ] 非技术干系人可读
    69	     - [ ] 所有必填章节已完成
    70	
    71	     ## 需求完整性
    72	
    73	     - [ ] 所有 [NEEDS CLARIFICATION] 标记已解决
    74	     - [ ] 所有功能需求可测试、无歧义
    75	     - [ ] 成功标准可度量
    76	     - [ ] 成功标准不含实现细节
    77	     - [ ] 所有验收场景已定义
    78	     - [ ] 边界情况已标识
    79	     - [ ] 范围已明确界定
    80	     - [ ] 依赖和假设已记录
    81	
    82	     ## 功能就绪
    83	
    84	     - [ ] 每条功能需求有明确验收标准
    85	     - [ ] 用户场景覆盖主要流程
    86	     - [ ] 功能满足成功标准中定义的可度量目标
    87	     - [ ] 无实现细节泄漏进规格书
    88	     ```
    89	
    90	8. **[NEEDS CLARIFICATION] 交互格式**（Q1/Q2/Q3，保留 speckit-specify 原格式）：
    91	
    92	   当 spec 中存在 [NEEDS CLARIFICATION] 标记时：
    93	   - **一次性呈现全部题目**（最多 3 题），编号 Q1、Q2、Q3。
    94	   - **每题格式**：
    95	     - 所在章节及上下文（引用 spec 原文）
    96	     - 待澄清问题
    97	     - 3-5 个互斥选项（表格：选项 | 答案 | 影响），含推荐项（行标 **推荐**）+ 简短理由
    98	     - 等待用户一次性回答所有题目（如 "Q1: A, Q2: B, Q3: Custom - xxx"）
    99	   - 用户作答后，用其选择替换 spec 中对应的 [NEEDS CLARIFICATION] 标记。
   100	   - 澄清完成后进入步骤 9 验证检查清单。
   101	
   102	9. **验证检查清单**：对照检查清单逐项审查 spec：
   103	   - 若全部通过：标记 checklist 完成。
   104	   - 若有非 [NEEDS CLARIFICATION] 类失败项（如缺少验收场景、FR 不可测试）：
   105	     1. 更新 spec 解决各问题，最多迭代 3 次；
   106	     2. 3 次后仍未通过，记录剩余问题至 checklist notes 并警告用户。
   107	   - **[NEEDS CLARIFICATION] 类检查项**：不得通过更新 spec 自行消解澄清标记。若检查清单的"所有 [NEEDS CLARIFICATION] 标记已解决"项尚未通过，必须返回步骤 8 用 Q1/Q2/Q3 呈现给用户，或保持失败并注明"等待用户回答"。禁止通过推断替换 [NEEDS CLARIFICATION] 标记来绕过澄清。
   108	
   109	10. **调用 metrics 更新**：
   110	    - 指令调用 `metrics/collector.mjs` 的 `updateOwnResult`，更新 executed / tokens / duration_ms 等实际值。
   111	    - stage 字段保持 `spec-specify`。
   112	    - 写失败只 warn 不 throw。
   113	
   114	11. **报告完成**：输出 task-id、spec 产物路径、checklist 结果、是否可就绪进入下一阶段（spec-clarify 或 build-plan）。
   115	
   116	## 去耦约束
   117	
   118	本 skill 已从 speckit-specify 解耦，硬性约束如下：
   119	- **不执行 git 命令**：不执行 git checkout / git branch / git fetch / git ls-remote / create-new-feature.sh 或任何等效 git 操作。
   120	- **不读 `.specify/` 目录**：不从目标项目 `.specify/` 读取任何文件（模板、脚本、配置）。
   121	- **不调用 speckit 脚本**：不执行任何 `speckit-*` 前缀的脚本或命令行工具。
   122	
   123	> 注：以上声明为约束性禁止指令，不构成 speckit 脚本的"实际执行"——验证阶段按此 grep。
   124	
   125	## 产出
   126	
   127	- `specs/{task-id}/spec.md`：结构化功能规格书
   128	- `specs/{task-id}/checklists/requirements.md`：质量检查清单
   129	
   130	## 下一步
   131	
   132	- **澄清**：用 spec-clarify 消除歧义。
   133	- **编排**：build-spec SKILL.md 将本 skill 作为第一步，output 为下游 spec-clarify 的输入。
   134	
   135	## 通用原则
   136	
   137	- 关注**用户需要什么**（WHAT）和**为什么**（WHY），不关注**怎么实现**（HOW）——不提技术栈、API、代码结构。
   138	- 面向业务干系人撰写，非开发者。
   139	- 不做嵌入 spec 内部的 checklist（那是独立 skill 的产出）。
   140	- 成功标准必须：可度量（含具体指标）、技术无关（不提框架/语言/数据库）、用户视角（从用户/业务角度描述结果）、可验证（无需了解实现细节即可检验）。
   141	
   142	### 成功标准示例
   143	
   144	**好**：
   145	- "用户可在 3 分钟内完成结账"
   146	- "系统支持 10,000 并发用户"
   147	- "95% 搜索在 1 秒内返回结果"
   148	
   149	**差**（含实现细节）：
   150	- "API 响应时间低于 200ms"（太技术化）
   151	- "数据库承载 1000 TPS"（实现细节）
   152	- "React 组件高效渲染"（框架特定）
   153	
   154	### [NEEDS CLARIFICATION] 优先级
   155	
   156	当需要超过 3 个 NEEDS CLARIFICATION 时，保留优先级：范围 > 安全/隐私 > 用户体验 > 技术细节。其余做合理推断。
   157	
   158	### 合理默认值示例
   159	
   160	以下不必提问，直接取合理默认值（全部采用产品/领域口径，不写具体技术栈、协议或框架）：
   161	- 数据保留：行业的通行做法
   162	- 性能目标：行业同类产品常见体验水准（未指定时）
   163	- 错误处理：用户友好提示 + 适当降级
   164	- 认证方式：沿用现有产品认证机制；若无现有机制则标记 NEEDS CLARIFICATION
   165	- 集成模式：沿用已有集成通道；若无则假定为已有模块间协作方式，跨系统集成需澄清

 succeeded in 0ms:
     1	# 功能规格：[功能名]
     2	
     3	> 基于上游功能描述和 decision-log 生成。本文件由 spec-specify 自动填充。
     4	
     5	**功能名**: `{task-id}`
     6	**来源**: 上游 decision-log 决策记录
     7	**状态**: 草稿
     8	<!-- 生成时替换 {task-id} 为实际的 task-id 字面量 -->
     9	
    10	## 速读卡（30 秒看懂这个需求）
    11	
    12	<!-- 一句话需求 + 核心改动点 + 最大影响面 + 验收信号。全部必填，但篇幅可控。 -->
    13	
    14	- **一句话需求**：<!-- 用一句话说清这个功能要做什么 -->
    15	- **核心改动点**：<!-- 2-5 条，每条一句话 -->
    16	- **最大影响面**：<!-- 哪个模块/子系统最受影响 -->
    17	- **验收信号**：<!-- 如何判断"做完了、做对了" -->
    18	
    19	## 1. 问题陈述
    20	
    21	<!-- 1-2 段。描述当前状态和待解决问题，不涉及解决方案。 -->
    22	
    23	当前：<!-- 现状描述 -->。
    24	
    25	问题：<!-- 痛点/差距 -->。
    26	
    27	## 2. 背景、目标和边界
    28	
    29	### 背景
    30	
    31	<!-- 为什么现在做、与已有系统的关系。 -->
    32	
    33	### 目标
    34	
    35	<!-- 本功能完成后能做到什么，用可验证结果描述。 -->
    36	
    37	### 非目标（明确不做）
    38	
    39	<!-- 本期明确不做的事项。每条单独一行。 -->
    40	1. <!-- 不做事项 1 -->
    41	2. <!-- 不做事项 2 -->
    42	
    43	### 假设
    44	
    45	<!-- spec-specify 生成 spec 时做的每一条推断都记在这里。每条假设注明来源（从哪段功能描述推断的）和理由（为什么选这个默认值）。 -->
    46	
    47	- **假设 1**：<!-- 推断内容。来源：[功能描述中的哪个表述]。理由：[为什么这样假设]。 -->
    48	- **假设 2**：<!-- 推断内容。来源：...。理由：...。 -->
    49	
    50	## 3. 用户场景与用例
    51	
    52	<!-- 角色 + 操作步骤 + 预期结果。覆盖正常路径、失败路径、边界路径。
    53	     每条场景含：（1）场景名；（2）角色；（3）前置条件；（4）操作步骤；（5）预期结果。 -->
    54	
    55	### 场景一：[场景名]（正常路径）
    56	
    57	- **角色**：<!-- 谁执行这个操作 -->
    58	- **前置条件**：<!-- Given 状态 -->
    59	- **操作步骤**：<!-- When 做了什么 -->
    60	- **预期结果**：<!-- Then 发生了什么 -->
    61	
    62	### 场景二：[场景名]（失败/边界路径）
    63	
    64	- **角色**：<!-- 谁执行 -->
    65	- **前置条件**：<!-- Given -->
    66	- **操作步骤**：<!-- When -->
    67	- **预期结果**：<!-- Then -->
    68	
    69	<!-- 按需补充更多场景 -->
    70	
    71	## 4. 功能需求
    72	
    73	<!-- 按功能域分组，编号 FR-{域缩写}-NNN。每条 FR 必须可测试。
    74	     溯源规则：每条 FR 标注来源（decision-log 决策编号或上游描述）。
    75	
    76	     示例格式：
    77	     #### 域：XXXX
    78	     - **FR-XX-001**：[需求描述]。来源：D-XX-1。
    79	       - **场景**：Given xxx, When xxx, Then xxx。
    80	     - **FR-XX-002**：[需求描述]。来源：用户描述 §3。
    81	       - **场景**：Given xxx, When xxx, Then xxx。
    82	-->
    83	
    84	### 域：XXX（给人读的域说明）
    85	
    86	- **FR-XXX-001**：[需求描述]。来源：<!-- 填写来源 -->。
    87	  - **场景**：Given <!-- 前置 -->, When <!-- 操作 -->, Then <!-- 预期 -->。
    88	
    89	<!-- 按功能域补充更多 FR -->
    90	
    91	## 5. 模块划分（条件触发）
    92	
    93	<!-- 仅当功能涉及多模块时有此章节；不触发时填 "本期不涉及（理由：功能无多模块交互需要）"。
    94	     每模块写出：负责什么业务能力 / 对上下游提供什么 / 需要哪些业务能力 / 什么可独立验收。 -->
    95	
    96	### [模块名]
    97	
    98	- **负责什么**：<!-- 一句话，描述业务职责 -->
    99	- **对外提供什么业务能力**：<!-- 对上下游产出的业务结果 -->
   100	- **需要哪些上游业务能力**：<!-- 依赖哪些上游模块的业务输出 -->
   101	- **验收边界**：<!-- 什么可独立验收、不依赖下游 -->
   102	
   103	## 6. 关键实体（条件触发）
   104	
   105	<!-- 仅当功能涉及数据实体时有此章节。每实体描述其字段和关系。
   106	     不触发时填 "本期不涉及（理由：功能无数据实体定义需要）"。 -->
   107	
   108	### [实体名]
   109	
   110	- **定义**：<!-- 一句话 -->
   111	- **字段**：<!-- 关键字段列表 -->
   112	- **关系**：<!-- 与其他实体的关联 -->
   113	
   114	## 7. 数据和生命周期（条件触发）
   115	
   116	<!-- 仅当功能涉及数据流或持久化时有此章节。
   117	     不触发时填 "本期不涉及（理由：功能无数据生命周期需要）"。 -->
   118	
   119	- **数据粒度**：<!-- 单次操作/单任务/全局 -->
   120	- **数据时效**：<!-- 实时/批/归档 -->
   121	- **数据归属与生命周期约束（用户可见）**：<!-- 谁持有数据、数据多久失效或归档 -->
   122	- **清理策略**：<!-- 保留期/淘汰规则 -->
   123	
   124	## 8. 兼容性预留（条件触发）
   125	
   126	<!-- 仅当功能需向后兼容或未来扩展预留时有此章节。
   127	     不触发时填 "本期不涉及（理由：功能无兼容性/扩展预留需要）"。 -->
   128	
   129	- **向后兼容**：<!-- 对已有消费方的影响 -->
   130	- **扩展预留**：<!-- 为未来留的接口/字段/格式空间 -->
   131	
   132	## 9. 不做和隐性必达
   133	
   134	### 明确不做
   135	
   136	> 以下逐条继承自 decision-log 的非目标声明。design/plan/build 阶段不得逾越。
   137	
   138	1. <!-- 不做事项 -->
   139	2. <!-- 不做事项 -->
   140	
   141	### 隐性必达
   142	
   143	<!-- 不能明写在 FR 里但必须成立的约束。如：不改某个外部系统、不引入新类别的门禁、测试套件不全绿即失败。 -->
   144	
   145	- **隐性必达 1**：<!-- 约束描述 -->
   146	- **隐性必达 2**：<!-- 约束描述 -->
   147	
   148	## 10. 验收清单及未决问题
   149	
   150	### 验收检查（success_criteria）
   151	
   152	<!-- 逐条可手动或命令验证。每条含失败判据，均可判真伪。
   153	     格式：AC1 ... ACn，每条标注可追溯到哪条 FR。 -->
   154	
   155	- [ ] **AC1**：<!-- 验收条目描述。反向：[失败条件] --> ← FR-XX-001
   156	- [ ] **AC2**：<!-- 验收条目描述。反向：[失败条件] --> ← FR-XX-002
   157	
   158	### 未决风险和问题
   159	
   160	<!-- 开放问题列表。已决问题标注 ~~删除线~~ + 简记决定摘要。 -->
   161	
   162	- **~~未决 1（主题）—— 已决~~**：<!-- 决定摘要 -->
   163	- **未决 2（主题）**：<!-- 待处理问题及影响 -->
   164	
   165	## 11. 影响范围（业务性质）
   166	
   167	<!-- 列出受影响的功能模块/业务区域及变更性质。
   168	     格式：业务区域 | 变更性质（新增/修改/删除）| 影响说明 -->
   169	
   170	- **受影响功能：[名称]**
   171	  - 既有行为：<!-- 现在是什么样的 -->
   172	  - 本需求影响：<!-- 会变成什么样 -->
   173	  - 回归要点：<!-- 什么不能坏 -->
   174	
   175	- **可能受冲击的业务规则**：<!-- 如有 -->
   176	- **明确无影响**：<!-- 哪些模块/系统不受影响 -->

exec
/bin/bash -lc "nl -ba workflows/spec-clarify/SKILL.md | sed -n '1,260p'" in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
     1	---
     2	name: spec-clarify
     3	description: 对当前 task 的 spec 执行 10 维歧义扫描，通过最多 5 题交互澄清（一次一题+推荐），逐题增量更新 spec，完成时输出覆盖率摘要。改造自 speckit-clarify，适配为 workflowhub 契约。
     4	---
     5	
     6	# spec-clarify
     7	
     8	> 改造自 speckit-clarify，适配为 workflowhub 契约：
     9	> - 去 git / check-prerequisites / .specify 耦合
    10	> - 以 task-id 参数化定位 spec
    11	> - 保全文 speckit 质量机制
    12	
    13	## 用途
    14	
    15	spec 已存在但需要针对性澄清后再推进——在 build-plan 之前执行。
    16	
    17	## 输入
    18	
    19	- **task-id**：用于推导 spec 路径 `specs/{task-id}/spec.md` 并标识 metrics 记录。
    20	- **spec-path**：显式指定 spec 文件路径。提供时直接使用，不派生 task-id。
    21	
    22	task-id 和 spec-path 必须**恰好提供一个**。同时提供或均缺失 → fail-loud："必须提供 task-id 或 spec-path 二者之一" 并停止。
    23	
    24	若仅提供 spec-path（无 task-id）：metrics 以 spec-path 为标识上报，不派生 task-id。
    25	
    26	## spec 定位
    27	
    28	- 优先使用 spec-path（提供时）。
    29	- 否则通过 task-id 推导：`specs/{task-id}/spec.md`。
    30	- **不执行** git 命令、不调 check-prerequisites.sh、不读 `.specify/` 目录或 `.specify/feature.json`。
    31	- 若 spec 文件不存在，fail-loud: "spec not found at <path>; run spec-specify first" 然后 stop。不创建、不推断 spec。
    32	
    33	## 执行步骤
    34	
    35	### 1) 加载 spec 文件并执行结构化歧义扫描
    36	
    37	读取 spec 文件全文。按以下 10 维分类逐维扫描，每维标注状态 **Clear / Partial / Missing**。生成内部覆盖度地图用于优先级排序（不直接输出原始地图，除非无需提问）。
    38	
    39	**10 维歧义分类：**
    40	
    41	**1. Functional Scope & Behavior**
    42	- 核心用户目标与成功标准
    43	- 显式不做范围声明
    44	- 用户角色/角色区分
    45	
    46	**2. Domain & Data Model**
    47	- 实体、属性、关系
    48	- 标识与唯一性规则
    49	- 生命周期/状态转换
    50	- 数据量级/规模假设
    51	
    52	**3. Interaction & UX Flow**
    53	- 关键用户旅程/操作序列
    54	- 错误态/空态/加载态
    55	- 可访问性或本地化说明
    56	
    57	**4. Non-Functional Quality Attributes**（1 个顶级维度，含 6 子项）
    58	- 性能（延迟、吞吐量目标）
    59	- 可扩展性（水平/垂直扩展、限制）
    60	- 可靠性与可用性（运行时间、恢复预期）
    61	- 可观测性（日志、指标、追踪信号）
    62	- 安全与隐私（认证/授权、数据保护、威胁假设）
    63	- 合规/监管约束（如有）
    64	
    65	**5. Integration & External Dependencies**
    66	- 外部服务/API 及其失败模式
    67	- 数据导入/导出格式
    68	- 协议/版本假设
    69	
    70	**6. Edge Cases & Failure Handling**
    71	- 负向场景
    72	- 限流/节流
    73	- 冲突解决（如并发编辑）
    74	
    75	**7. Constraints & Tradeoffs**
    76	- 技术约束（语言、存储、托管）
    77	- 显式取舍或拒绝的替代方案
    78	
    79	**8. Terminology & Consistency**
    80	- 规范术语表
    81	- 已弃用同义词
    82	
    83	**9. Completion Signals**
    84	- 验收标准可测试性
    85	- 可度量的 Definition of Done 指标
    86	
    87	**10. Misc / Placeholders**
    88	- TODO 标记/未解决决策
    89	- 模糊形容词（"健壮""直观"）缺乏量化
    90	
    91	对每维标注 Partial 或 Missing 的类别添加候选问题，除非：
    92	- 澄清不会实质改变实现或验证策略
    93	- 信息更适合推迟到规划阶段（内部备注）
    94	
    95	### 2) 生成优先级候选问题队列
    96	
    97	内部生成优先级排序的候选澄清问题队列（最多 10 个候选），按 (Impact * Uncertainty) 启发式排序。不一次性全部输出。
    98	
    99	约束：
   100	- 全程最多 5 题已问。
   101	- 每题须为多选题（2-5 互斥选项）；自由文本仅可作为显式 Other 选项（<=5 词），不可替代选项设计。
   102	- 仅纳入对架构、数据建模、任务分解、测试设计、UX 行为、运维就绪或合规验证有实质影响的题目。
   103	- 保证分类覆盖平衡：优先覆盖最高影响的未解决类别；避免在单个高影响领域（如安全态势）未解决时问两个低影响题。
   104	- 排除已答、无关风格偏好或纯计划层执行细节（除非阻塞正确性）。
   105	- 优先选择能减少下游返工风险或防止验收测试错位的澄清。
   106	- 若超过 5 个类别未解决，选 (Impact * Uncertainty) 最高的前 5。
   107	
   108	### 3) 交互澄清循环
   109	
   110	**一次只呈现一题**（ONE question at a time），不提前透露后续题目。
   111	
   112	**多选题格式：**
   113	- 分析所有选项，基于项目类型最佳实践/同类实现常见模式/安全与性能风险降低/spec 中可见目标与约束，确定最佳选项。
   114	- **Recommended: Option [X] — <1-2 句理由>**
   115	- 然后以 Markdown 表格呈现所有选项：
   116	
   117	| Option | Description |
   118	| ------ | ----------- |
   119	| A      | <选项 A 描述> |
   120	| B      | <选项 B 描述> |
   121	| C      | <选项 C 描述>（最多 5 项） |
   122	| Other  | 提供不同选项（<=5 词） |
   123	
   124	- 表格后追加："回复选项字母（如 'A'），'yes' / 'recommended' 采纳推荐，或提供 Other 选项回答。"
   125	
   126	**用户回答后：**
   127	- 若回复 "yes" / "recommended" / "suggested"，采用之前声明的推荐/建议为答案。
   128	- 否则验证答案映射到某选项或符合 <=5 词约束。
   129	- 若歧义，快速消歧（仍属同一题，不推进）。
   130	- 确认后立即执行步骤 4 的增量更新（写入 spec 并保存），然后推进到下一题。
   131	
   132	**停止提问条件：**
   133	- 所有关键歧义提前解决（剩余队列不再必要）
   134	- 用户发出完成信号（"done""good""no more"）
   135	- 达到 5 题上限
   136	
   137	若起始即无可问题目，立即报告"未检测到需正式澄清的关键歧义"，输出覆盖度摘要后建议推进。
   138	
   139	### 4) 增量更新 spec
   140	
   141	每接受一题答案后立即写入 spec：
   142	
   143	- **维护 spec 内存表示**（启动时加载一次）及原始文件内容。
   144	- **首个答案写入时**：
   145	  - 确保 spec 存在 `## Clarifications` 节（若缺失，创建在概述/上下文节之后）。
   146	  - 在其下创建（若不存在）`### Session YYYY-MM-DD` 子标题（当天日期）。
   147	- **追加一行**：`- Q: <问题> → A: <最终答案>`
   148	- **立即将澄清整合到最相关章节**：
   149	  - 功能歧义 → 更新或新增功能需求（FR）条目
   150	  - 用户交互/角色区分 → 更新用户故事或角色相关节，附加澄清的角色、约束或场景
   151	  - 数据形态/实体 → 更新数据模型（添加字段、类型、关系），保留顺序
   152	  - 非功能约束 → 在非功能/质量属性节添加或修改可度量标准（将模糊形容词转为指标或显式目标）
   153	  - 边缘情况/负面流程 → 在边界情况/错误处理节新增条目
   154	  - 术语冲突 → 全文规范化术语；仅在必要时保留原称（加注"（旧称 "X"）"一次）
   155	- 若澄清导致早期歧义陈述失效，**替换而非重复**；不留过时矛盾文字。
   156	- **每题答案后保存 spec 文件**（原子覆盖），以降低上下文丢失风险。
   157	- 保持格式：不重排无关章节，不变更标题层级。
   158	- 每条澄清保持简洁可测试（避免叙事膨胀）。
   159	
   160	### 5) 校验
   161	
   162	每题写入后及最终校验：
   163	- Clarifications 节每题恰好一条记录（无重复）
   164	- 已问（已采纳）问题总数 ≤ 5
   165	- 已更新节无不应用新答案解决的模糊占位符
   166	- 无矛盾遗留（已移除的替代选项不再出现）
   167	- Markdown 结构有效；仅允许新增 `## Clarifications`、`### Session YYYY-MM-DD`
   168	- 术语一致性：所有更新章节使用同一规范术语
   169	
   170	### 6) 完成报告
   171	
   172	提问循环结束后输出：
   173	
   174	- 已问与已回答问题数
   175	- 更新后的 spec 路径
   176	- 触及的章节列表
   177	- **覆盖率摘要表格**：每维标注状态——
   178	  - **Resolved**：原为 Partial/Missing，本次已解决
   179	  - **Deferred**：超出题数配额或更适合规划阶段
   180	  - **Clear**：原本已充分
   181	  - **Outstanding**：仍为 Partial/Missing 但影响较低
   182	- 若存在 Outstanding 或 Deferred，建议是否继续推进 build-plan 或后续重新运行 spec-clarify。
   183	- 建议下一步动作。
   184	
   185	### 行为规则
   186	
   187	- 若无有意义的歧义（或全部潜在问题影响低），回复"未检测到需正式澄清的关键歧义"并建议推进。
   188	- 若 spec 文件缺失，fail-loud: "spec not found at <path>; run spec-specify first" 然后 stop。不在此创建新 spec。
   189	- **全程不超过 5 题**（单题澄清重试不计入新题）。
   190	- 避免推测性技术栈问题，除非缺失会阻塞功能清晰度。
   191	- 尊重用户提前终止信号（"stop""done""proceed"）。
   192	- 若未问任何题即覆盖完整，输出压缩覆盖度摘要（全部 Clear）后建议推进。
   193	- 若配额用尽仍有未解决的高影响类别，在 Deferred 中显式标注并附理由。
   194	
   195	## metrics 接入
   196	
   197	- **阶段开始时**：调 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字段填 `spec-clarify`。
   198	- **阶段结束时**：调 `updateOwnResult`，写失败只 warn 不 throw。
   199	
   200	## 去耦约束
   201	
   202	本 skill 不依赖 speckit 基础设施：
   203	- 不调 `check-prerequisites.sh`
   204	- 不读 `.specify/` 目录或 `.specify/feature.json`
   205	- 不执行 git 命令
   206	
   207	spec 定位全部通过 task-id 推导或显式 spec-path，不依赖分支环境。
   208	
   209	## 输出物
   210	
   211	- 更新后的 `specs/{task-id}/spec.md`（含澄清追加和章节整合）
   212	
   213	## 下一步
   214	
   215	澄清完成后，推进到 **build-plan** 生成实现计划。

codex
已拿到实际行号。现在我会做一次针对性 grep，确认没有残留的旧耦合执行指令、`.specify` 回退、短答问题、暂不写盘等旧问题。
exec
/bin/bash -lc "rg -n \"git|check-prerequisites|\\.specify|create-new-feature|暂不写盘|Short|short-answer|短答|OAuth|session|REST|API|数据库|React|module interface|affected files|change type|file-path|db|[[]NEEDS CLARIFICATION[]]\" workflows/spec-specify/SKILL.md workflows/spec-specify/templates/spec-template.md workflows/spec-clarify/SKILL.md" in /Users/Hugh/Hugh/Project/workflowhub
 exited 2 in 0ms:
rg: regex parse error:
    (?:git|check-prerequisites|\.specify|create-new-feature|暂不写盘|Short|short-answer|短答|OAuth|session|REST|API|数据库|React|module interface|affected files|change type|file-path|db|[[]NEEDS CLARIFICATION[]])
                                                                                                                                                                                  ^^
error: unclosed character class

exec
/bin/bash -lc 'rg -n "必须恰好提供一个|spec not found|每题须为多选题|每题答案后保存|一次只呈现一题|10 维|Clear / Partial / Missing|Resolved|Deferred|Outstanding|recordSkeleton|updateOwnResult" workflows/spec-clarify/SKILL.md workflows/spec-specify/SKILL.md workflows/spec-specify/templates/spec-template.md' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
workflows/spec-specify/SKILL.md:11:> - 接 workflowhub M4 metrics 系统（`metrics/collector.mjs`）的 recordSkeleton + updateOwnResult。
workflows/spec-specify/SKILL.md:33:   - 指令调用 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字面量填 `spec-specify`。
workflows/spec-specify/SKILL.md:110:    - 指令调用 `metrics/collector.mjs` 的 `updateOwnResult`，更新 executed / tokens / duration_ms 等实际值。
workflows/spec-clarify/SKILL.md:3:description: 对当前 task 的 spec 执行 10 维歧义扫描，通过最多 5 题交互澄清（一次一题+推荐），逐题增量更新 spec，完成时输出覆盖率摘要。改造自 speckit-clarify，适配为 workflowhub 契约。
workflows/spec-clarify/SKILL.md:31:- 若 spec 文件不存在，fail-loud: "spec not found at <path>; run spec-specify first" 然后 stop。不创建、不推断 spec。
workflows/spec-clarify/SKILL.md:37:读取 spec 文件全文。按以下 10 维分类逐维扫描，每维标注状态 **Clear / Partial / Missing**。生成内部覆盖度地图用于优先级排序（不直接输出原始地图，除非无需提问）。
workflows/spec-clarify/SKILL.md:39:**10 维歧义分类：**
workflows/spec-clarify/SKILL.md:101:- 每题须为多选题（2-5 互斥选项）；自由文本仅可作为显式 Other 选项（<=5 词），不可替代选项设计。
workflows/spec-clarify/SKILL.md:110:**一次只呈现一题**（ONE question at a time），不提前透露后续题目。
workflows/spec-clarify/SKILL.md:156:- **每题答案后保存 spec 文件**（原子覆盖），以降低上下文丢失风险。
workflows/spec-clarify/SKILL.md:178:  - **Resolved**：原为 Partial/Missing，本次已解决
workflows/spec-clarify/SKILL.md:179:  - **Deferred**：超出题数配额或更适合规划阶段
workflows/spec-clarify/SKILL.md:181:  - **Outstanding**：仍为 Partial/Missing 但影响较低
workflows/spec-clarify/SKILL.md:182:- 若存在 Outstanding 或 Deferred，建议是否继续推进 build-plan 或后续重新运行 spec-clarify。
workflows/spec-clarify/SKILL.md:188:- 若 spec 文件缺失，fail-loud: "spec not found at <path>; run spec-specify first" 然后 stop。不在此创建新 spec。
workflows/spec-clarify/SKILL.md:193:- 若配额用尽仍有未解决的高影响类别，在 Deferred 中显式标注并附理由。
workflows/spec-clarify/SKILL.md:197:- **阶段开始时**：调 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字段填 `spec-clarify`。
workflows/spec-clarify/SKILL.md:198:- **阶段结束时**：调 `updateOwnResult`，写失败只 warn 不 throw。

codex
第一条 grep 正则写法有误，未产生有效结论；我会用固定字符串列表重跑，避免误报漏报。
exec
/bin/bash -lc 'rg -n -F -e git -e check-prerequisites -e .specify -e create-new-feature -e 暂不写盘 -e Short -e short-answer -e 短答 -e OAuth -e session -e REST -e API -e 数据库 -e React -e "module interface" -e "affected files" -e "change type" -e "file-path" -e db -e "[NEEDS CLARIFICATION]" workflows/spec-specify/SKILL.md workflows/spec-specify/templates/spec-template.md workflows/spec-clarify/SKILL.md' in /Users/Hugh/Hugh/Project/workflowhub
 succeeded in 0ms:
workflows/spec-specify/SKILL.md:3:description: Create or update a feature specification from a natural language feature description. Adapted from speckit-specify for the workflowhub contract — no git branch coupling, task-id parameterized.
workflows/spec-specify/SKILL.md:9:> - 去 git 分支耦合，改用 task-id 参数推导产物路径；
workflows/spec-specify/SKILL.md:10:> - 模板由 workflowhub 内置（`./templates/spec-template.md`），不读目标项目 `.specify/`；
workflows/spec-specify/SKILL.md:26:   - 不执行 git checkout / git branch / create-new-feature.sh。
workflows/spec-specify/SKILL.md:30:   - **若文件不存在**：报错 "template not found at ./templates/spec-template.md" 并停止，不做 `.specify/` 回退，不调任何 speckit 脚本。
workflows/spec-specify/SKILL.md:41:   3. **[NEEDS CLARIFICATION] 标记**：
workflows/spec-specify/SKILL.md:53:   - 将 spec 写入 `specs/{task-id}/spec.md`（由 task-id 推导，不依赖 git branch）。
workflows/spec-specify/SKILL.md:66:     - [ ] 无实现细节泄露（无编程语言、框架、API 名称）
workflows/spec-specify/SKILL.md:73:     - [ ] 所有 [NEEDS CLARIFICATION] 标记已解决
workflows/spec-specify/SKILL.md:90:8. **[NEEDS CLARIFICATION] 交互格式**（Q1/Q2/Q3，保留 speckit-specify 原格式）：
workflows/spec-specify/SKILL.md:92:   当 spec 中存在 [NEEDS CLARIFICATION] 标记时：
workflows/spec-specify/SKILL.md:99:   - 用户作答后，用其选择替换 spec 中对应的 [NEEDS CLARIFICATION] 标记。
workflows/spec-specify/SKILL.md:104:   - 若有非 [NEEDS CLARIFICATION] 类失败项（如缺少验收场景、FR 不可测试）：
workflows/spec-specify/SKILL.md:107:   - **[NEEDS CLARIFICATION] 类检查项**：不得通过更新 spec 自行消解澄清标记。若检查清单的"所有 [NEEDS CLARIFICATION] 标记已解决"项尚未通过，必须返回步骤 8 用 Q1/Q2/Q3 呈现给用户，或保持失败并注明"等待用户回答"。禁止通过推断替换 [NEEDS CLARIFICATION] 标记来绕过澄清。
workflows/spec-specify/SKILL.md:119:- **不执行 git 命令**：不执行 git checkout / git branch / git fetch / git ls-remote / create-new-feature.sh 或任何等效 git 操作。
workflows/spec-specify/SKILL.md:120:- **不读 `.specify/` 目录**：不从目标项目 `.specify/` 读取任何文件（模板、脚本、配置）。
workflows/spec-specify/SKILL.md:137:- 关注**用户需要什么**（WHAT）和**为什么**（WHY），不关注**怎么实现**（HOW）——不提技术栈、API、代码结构。
workflows/spec-specify/SKILL.md:140:- 成功标准必须：可度量（含具体指标）、技术无关（不提框架/语言/数据库）、用户视角（从用户/业务角度描述结果）、可验证（无需了解实现细节即可检验）。
workflows/spec-specify/SKILL.md:150:- "API 响应时间低于 200ms"（太技术化）
workflows/spec-specify/SKILL.md:151:- "数据库承载 1000 TPS"（实现细节）
workflows/spec-specify/SKILL.md:152:- "React 组件高效渲染"（框架特定）
workflows/spec-specify/SKILL.md:154:### [NEEDS CLARIFICATION] 优先级
workflows/spec-clarify/SKILL.md:9:> - 去 git / check-prerequisites / .specify 耦合
workflows/spec-clarify/SKILL.md:30:- **不执行** git 命令、不调 check-prerequisites.sh、不读 `.specify/` 目录或 `.specify/feature.json`。
workflows/spec-clarify/SKILL.md:66:- 外部服务/API 及其失败模式
workflows/spec-clarify/SKILL.md:203:- 不调 `check-prerequisites.sh`
workflows/spec-clarify/SKILL.md:204:- 不读 `.specify/` 目录或 `.specify/feature.json`
workflows/spec-clarify/SKILL.md:205:- 不执行 git 命令

codex
verdict: pass

| Item | Status | Evidence | Note |
|---|---|---|---|
| B1 | closed | [spec-template.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/templates/spec-template.md:43), [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:40) | 模板已有 `### 假设`；SKILL 要求每条推断记录来源和理由 |
| B2 | closed | [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:90), [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:102) | Q1/Q2/Q3 澄清在验证前；验证明确禁止自行消解澄清标记 |
| B3 | closed | [spec-template.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/templates/spec-template.md:91), [spec-template.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/templates/spec-template.md:114), [spec-template.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/templates/spec-template.md:165) | 已改为业务能力、关键实体、用户可见生命周期、业务影响范围 |
| B4 | closed | [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:158) | 默认值示例改为产品/领域口径；认证和集成都要求沿用现有机制，否则澄清 |
| B5 | closed | [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:130), [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:141), [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:156) | 删除“暂不写盘”逻辑；每题接受后立即写入并保存 |
| B6 | closed | [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:101), [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:117) | 每题 2-5 个互斥选项；Other 仅显式自由文本且 <=5 词 |
| B7 | closed | [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:17), [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:22) | 输入契约明确要求 task-id 和 spec-path 恰好一个 |
| B8 | closed | [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:31), [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:188) | 缺失 spec 时 fail-loud，错误文本具体，并停止 |

**Decoupling Check**

Pass. 没有实际执行 git、`.specify`、`check-prerequisites` 的指令。

证据：
- spec-specify 禁止 git / `.specify` / speckit 脚本：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:116)
- spec-specify 明确禁止项只是约束性文本，不算实际执行：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:123)
- spec-clarify 禁止 git / check-prerequisites / `.specify`：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:30), [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:200)

**Speckit Quality Mechanisms**

Pass.

spec-specify 保留：
- key-concept extraction：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:39)
- assumptions with source/rationale：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:40)
- <=3 NEEDS CLARIFICATION：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:41)
- Q1/Q2/Q3 clarification format：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:90)
- 3-tier tailoring：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:47)

spec-clarify 保留：
- 10 dimensions with Clear / Partial / Missing：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:37)
- one-at-a-time interaction：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:110)
- max 5 questions：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:100), [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:189)
- coverage summary：[SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-clarify/SKILL.md:177)

**NEW Blocking**

None.

**Non-Blocking**

- Minor heading mismatch: spec-specify says assumptions go to `## 假设` at [SKILL.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/SKILL.md:40), while the template heading is `### 假设` under section 2 at [spec-template.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/templates/spec-template.md:43). This is not blocking because the section exists and is clearly named, but aligning the heading reference would reduce ambiguity.
- `spec-template.md` still uses “接口/字段/格式空间” in the compatibility reservation hint at [spec-template.md](/Users/Hugh/Hugh/Project/workflowhub/workflows/spec-specify/templates/spec-template.md:130). It is acceptable in context, but “业务扩展点/数据项/格式空间” would be cleaner and less implementation-suggestive.
hook: Stop
hook: Stop Completed
tokens used
27,419

```

## Concise summary

Provider completed successfully. Review the raw output for details.

## Action items

- Review the response and extract decisions you want to apply.
- Capture follow-up implementation tasks if needed.
