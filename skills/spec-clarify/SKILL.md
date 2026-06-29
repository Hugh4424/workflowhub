---
name: spec-clarify
description: 对当前 task 的 spec 执行 10 维歧义扫描，通过最多 5 题交互澄清（一次一题+推荐），逐题增量更新 spec，完成时输出覆盖率摘要。改造自 speckit-clarify，适配为 workflowhub 契约。
---

# spec-clarify

> 改造自 speckit-clarify，适配为 workflowhub 契约：
> - 去 git / check-prerequisites / .specify 耦合
> - 以 task-id 参数化定位 spec
> - 保全文 speckit 质量机制

## 用途

spec 已存在但需要针对性澄清后再推进——在 build-plan 之前执行。

## 输入

- **task-id**：用于推导 spec 路径 `specs/{task-id}/spec.md` 并标识 metrics 记录。
- **spec-path**：显式指定 spec 文件路径。提供时直接使用，不派生 task-id。

task-id 和 spec-path 必须**恰好提供一个**。同时提供或均缺失 → fail-loud："必须提供 task-id 或 spec-path 二者之一" 并停止。

若仅提供 spec-path（无 task-id）：metrics 以 spec-path 为标识上报，不派生 task-id。

## spec 定位

- 优先使用 spec-path（提供时）。
- 否则通过 task-id 推导：`specs/{task-id}/spec.md`。
- **不执行** git 命令、不调 check-prerequisites.sh、不读 `.specify/` 目录或 `.specify/feature.json`。
- 若 spec 文件不存在，fail-loud: "spec not found at <path>; run spec-specify first" 然后 stop。不创建、不推断 spec。

## 执行步骤

### 1) 加载 spec 文件并执行结构化歧义扫描

读取 spec 文件全文。按以下 10 维分类逐维扫描，每维标注状态 **Clear / Partial / Missing**。生成内部覆盖度地图用于优先级排序（不直接输出原始地图，除非无需提问）。

**10 维歧义分类：**

**1. Functional Scope & Behavior**
- 核心用户目标与成功标准
- 显式不做范围声明
- 用户角色/角色区分

**2. Domain & Data Model**
- 实体、属性、关系
- 标识与唯一性规则
- 生命周期/状态转换
- 数据量级/规模假设

**3. Interaction & UX Flow**
- 关键用户旅程/操作序列
- 错误态/空态/加载态
- 可访问性或本地化说明

**4. Non-Functional Quality Attributes**（1 个顶级维度，含 6 子项）
- 性能（延迟、吞吐量目标）
- 可扩展性（水平/垂直扩展、限制）
- 可靠性与可用性（运行时间、恢复预期）
- 可观测性（日志、指标、追踪信号）
- 安全与隐私（认证/授权、数据保护、威胁假设）
- 合规/监管约束（如有）

**5. Integration & External Dependencies**
- 外部服务/API 及其失败模式
- 数据导入/导出格式
- 协议/版本假设

**6. Edge Cases & Failure Handling**
- 负向场景
- 限流/节流
- 冲突解决（如并发编辑）

**7. Constraints & Tradeoffs**
- 技术约束（语言、存储、托管）
- 显式取舍或拒绝的替代方案

**8. Terminology & Consistency**
- 规范术语表
- 已弃用同义词

**9. Completion Signals**
- 验收标准可测试性
- 可度量的 Definition of Done 指标

**10. Misc / Placeholders**
- TODO 标记/未解决决策
- 模糊形容词（"健壮""直观"）缺乏量化

对每维标注 Partial 或 Missing 的类别添加候选问题，除非：
- 澄清不会实质改变实现或验证策略
- 信息更适合推迟到规划阶段（内部备注）

### 2) 生成优先级候选问题队列

内部生成优先级排序的候选澄清问题队列（最多 10 个候选），按 (Impact * Uncertainty) 启发式排序。不一次性全部输出。

约束：
- 全程最多 5 题已问。
- 每题须为多选题（2-5 互斥选项）；自由文本仅可作为显式 Other 选项（<=5 词），不可替代选项设计。
- 仅纳入对架构、数据建模、任务分解、测试设计、UX 行为、运维就绪或合规验证有实质影响的题目。
- 保证分类覆盖平衡：优先覆盖最高影响的未解决类别；避免在单个高影响领域（如安全态势）未解决时问两个低影响题。
- 排除已答、无关风格偏好或纯计划层执行细节（除非阻塞正确性）。
- 优先选择能减少下游返工风险或防止验收测试错位的澄清。
- 若超过 5 个类别未解决，选 (Impact * Uncertainty) 最高的前 5。

### 3) 交互澄清循环

**一次只呈现一题**（ONE question at a time），不提前透露后续题目。

**多选题格式：**
- 分析所有选项，基于项目类型最佳实践/同类实现常见模式/安全与性能风险降低/spec 中可见目标与约束，确定最佳选项。
- **Recommended: Option [X] — <1-2 句理由>**
- 然后以 Markdown 表格呈现所有选项：

| Option | Description |
| ------ | ----------- |
| A      | <选项 A 描述> |
| B      | <选项 B 描述> |
| C      | <选项 C 描述>（最多 5 项） |
| Other  | 提供不同选项（<=5 词） |

- 表格后追加："回复选项字母（如 'A'），'yes' / 'recommended' 采纳推荐，或提供 Other 选项回答。"

**用户回答后：**
- 若回复 "yes" / "recommended" / "suggested"，采用之前声明的推荐/建议为答案。
- 否则验证答案映射到某选项或符合 <=5 词约束。
- 若歧义，快速消歧（仍属同一题，不推进）。
- 确认后立即执行步骤 4 的增量更新（写入 spec 并保存），然后推进到下一题。

**停止提问条件：**
- 所有关键歧义提前解决（剩余队列不再必要）
- 用户发出完成信号（"done""good""no more"）
- 达到 5 题上限

若起始即无可问题目，立即报告"未检测到需正式澄清的关键歧义"，输出覆盖度摘要后建议推进。

### 4) 增量更新 spec

每接受一题答案后立即写入 spec：

- **维护 spec 内存表示**（启动时加载一次）及原始文件内容。
- **首个答案写入时**：
  - 确保 spec 存在 `## Clarifications` 节（若缺失，创建在概述/上下文节之后）。
  - 在其下创建（若不存在）`### Session YYYY-MM-DD` 子标题（当天日期）。
- **追加一行**：`- Q: <问题> → A: <最终答案>`
- **立即将澄清整合到最相关章节**：
  - 功能歧义 → 更新或新增功能需求（FR）条目
  - 用户交互/角色区分 → 更新用户故事或角色相关节，附加澄清的角色、约束或场景
  - 数据形态/实体 → 更新数据模型（添加字段、类型、关系），保留顺序
  - 非功能约束 → 在非功能/质量属性节添加或修改可度量标准（将模糊形容词转为指标或显式目标）
  - 边缘情况/负面流程 → 在边界情况/错误处理节新增条目
  - 术语冲突 → 全文规范化术语；仅在必要时保留原称（加注"（旧称 "X"）"一次）
- 若澄清导致早期歧义陈述失效，**替换而非重复**；不留过时矛盾文字。
- **每题答案后保存 spec 文件**（原子覆盖），以降低上下文丢失风险。
- 保持格式：不重排无关章节，不变更标题层级。
- 每条澄清保持简洁可测试（避免叙事膨胀）。

### 5) 校验

每题写入后及最终校验：
- Clarifications 节每题恰好一条记录（无重复）
- 已问（已采纳）问题总数 ≤ 5
- 已更新节无不应用新答案解决的模糊占位符
- 无矛盾遗留（已移除的替代选项不再出现）
- Markdown 结构有效；仅允许新增 `## Clarifications`、`### Session YYYY-MM-DD`
- 术语一致性：所有更新章节使用同一规范术语

### 6) 完成报告

提问循环结束后输出：

- 已问与已回答问题数
- 更新后的 spec 路径
- 触及的章节列表
- **覆盖率摘要表格**：每维标注状态——
  - **Resolved**：原为 Partial/Missing，本次已解决
  - **Deferred**：超出题数配额或更适合规划阶段
  - **Clear**：原本已充分
  - **Outstanding**：仍为 Partial/Missing 但影响较低
- 若存在 Outstanding 或 Deferred，建议是否继续推进 build-plan 或后续重新运行 spec-clarify。
- 建议下一步动作。

### 行为规则

- 若无有意义的歧义（或全部潜在问题影响低），回复"未检测到需正式澄清的关键歧义"并建议推进。
- 若 spec 文件缺失，fail-loud: "spec not found at <path>; run spec-specify first" 然后 stop。不在此创建新 spec。
- **全程不超过 5 题**（单题澄清重试不计入新题）。
- 避免推测性技术栈问题，除非缺失会阻塞功能清晰度。
- 尊重用户提前终止信号（"stop""done""proceed"）。
- 若未问任何题即覆盖完整，输出压缩覆盖度摘要（全部 Clear）后建议推进。
- 若配额用尽仍有未解决的高影响类别，在 Deferred 中显式标注并附理由。

## metrics 接入

- **阶段开始时**：调 `metrics/collector.mjs` 的 `recordSkeleton`，stage 字段填 `spec-clarify`，传入 M4 十个核心字段种子：

```json
{
  "execution_id": "<uuid>",
  "skill_or_stage": "spec-clarify",
  "stage": "spec-clarify",
  "skill_version": "1.0.0",
  "executed": true,
  "tokens": null,
  "duration_ms": null,
  "rework_rounds": 0,
  "human_intervention": false,
  "friction_ref": null
}
```

- **阶段结束时**：调 `updateOwnResult`，写失败只 warn 不 throw。

## 去耦约束

本 skill 不依赖 speckit 基础设施：
- 不调 `check-prerequisites.sh`
- 不读 `.specify/` 目录或 `.specify/feature.json`
- 不执行 git 命令

spec 定位全部通过 task-id 推导或显式 spec-path，不依赖分支环境。

## 输出物

- 更新后的 `specs/{task-id}/spec.md`（含澄清追加和章节整合）

## 下一步

澄清完成后，推进到 **build-plan** 生成实现计划。
