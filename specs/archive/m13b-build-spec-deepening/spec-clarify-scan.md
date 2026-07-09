# spec-clarify 10 维歧义扫描

> task_id: m13b-build-spec-deepening | spec: specs/m13b-build-spec-deepening/spec.md
> 扫描时间: 2026-06-30 | 来源: decision-log D1-D8（user_decision:true，S9='A' 批准）

---

## 扫描方法

对 spec.md 执行 10 维歧义扫描，优先从 decision-log + stage-result 解决歧义（锁定决策 = 人的答案）。无法从决策文档解决的歧义列为 OPEN QUESTION。

---

## 维度 1：功能边界（scope）

**扫描结论**：RESOLVED

- IN/OUT 列表在 spec 第 2 节明确列出，IN 18 项、OUT 8 项。
- 来源：decision-log D1-D8 KEEP/CUT 列表，stage-result facts.scope in/out。
- 无歧义残留。

---

## 维度 2：用户角色与权限

**扫描结论**：RESOLVED

- 两个角色：编排者（人或主 AI）、执行代理（被派 build-spec 的助手）。
- 无权限管理需求，无歧义。
- 来源：spec 场景 3.1-3.10 角色定义。

---

## 维度 3：数据模型与格式

**扫描结论**：RESOLVED（有一处轻微待确认，见 OQ-1）

- spec-acceptance-count.json：三字段 ac_count/fr_count/counted_at，格式已定。
- 质量事实契约 5 项：字段名已定，值格式（字符串/列表/表格）未完全锁定。
- **OQ-1**（OPEN）：质量事实契约第 2 项（自检结果）和第 3 项（独立审查摘要）在 SKILL.md 中是用 Markdown 表格还是 JSON 块记录？decision-log 未明确格式，只说"记录事实"。建议：Markdown 表格（可读性优先），待 build-plan 确认。

---

## 维度 4：错误处理与降级

**扫描结论**：RESOLVED

- metrics 写入失败：warn 不 throw（FR-TRACKING-001，collector.mjs FR-GUARD-001）。
- TASK_TRACKING_ROOT 未设置：降级到默认路径 + warn（FR-TRACKING-001）。
- Spec-Purity grep 命中：warn + 记录，不阻断（FR-SELFCHECK-002）。
- decision-log 缺失：沿用 M11 v1 规则，stop + 报错（现有行为不改）。
- 无歧义残留。

---

## 维度 5：性能与规模

**扫描结论**：NOT APPLICABLE

- build-spec 为提示词/文档编排，无性能指标约束。
- spec-acceptance-count.json 的计数对象是文档行数，规模极小。
- 无需量化性能目标。

---

## 维度 6：安全与隐私

**扫描结论**：RESOLVED

- TASK_TRACKING_ROOT 指向本地 Knowledge 目录，不存 repo，不含敏感数据。
- 无跨用户权限需求，无外部 API 调用，无安全歧义。

---

## 维度 7：集成与依赖

**扫描结论**：RESOLVED（有一处待确认，见 OQ-2）

- 已知依赖：metrics/collector.mjs（recordSkeleton），skills/spec-specify/SKILL.md，CONSTITUTION.md。
- 不改动 spec-specify、spec-clarify 技能文件（spec 第 5 节明确）。
- **OQ-2**（OPEN）：`TASK_TRACKING_ROOT` 默认值 `~/Knowledge/workflowhub/` — 若用户 home 目录不可写，SKILL.md 应如何处理？decision-log 说"warn 不 throw"，但目录不存在时是否自动 `mkdir -p`？建议：SKILL.md 加"自动 mkdir -p，失败则 warn"，待 build-plan 确认。

---

## 维度 8：可测试性与验收

**扫描结论**：RESOLVED

- 18 条 AC 均有明确验证方式（grep / JSON schema / 正则 / 文件存在性）。
- FR 场景均有 Given/When/Then 格式，可人工或工具核对。
- 无歧义残留。

---

## 维度 9：向下兼容与演进

**扫描结论**：RESOLVED

- 现有 spec-specify/spec-clarify 不改动，向下兼容。
- 现有 spec.md 格式向下兼容（新增附录，不删已有章节）。
- M11 v1 AC 不回归（spec 第 7 节影响范围）。

---

## 维度 10：命名与术语一致性

**扫描结论**：RESOLVED（有一处待确认，见 OQ-3）

- "独立三角度审查"命名已锁定（FR-REVIEW-002），不出现 source_family 相关宣称。
- FR-{DOMAIN}-NNN 格式已锁定（FR-NUMBERING-001）。
- **OQ-3**（OPEN）：SKILL.md 深化版本的 `skill_version` 应为 `2.0.0` 还是 `1.1.0`？decision-log 未明确版本号语义（是语义化版本还是里程碑编号）。建议：`2.0.0`（因引入质量事实契约为较大功能扩展），待人工确认。

---

## 已解决歧义汇总

| # | 维度 | 歧义描述 | 解决来源 |
|---|------|----------|---------|
| R1 | 功能边界 | IN/OUT 18+8 项 | decision-log D1-D8 KEEP/CUT |
| R2 | 角色 | 编排者/执行代理 | spec 场景定义 |
| R3 | 错误降级 | metrics/TASK_TRACKING_ROOT 失败处理 | decision-log D6 + collector.mjs FR-GUARD-001 |
| R4 | 阻断语义 | 所有检查为记录+浮现，无阻断 | decision-log D1 + CONSTITUTION F4/F5 |
| R5 | 审查命名 | 独立三角度审查（1-AI-3-angle） | decision-log D3 |
| R6 | FR 编号格式 | FR-{DOMAIN}-NNN | decision-log D8 |
| R7 | AC 计数文件格式 | 三字段 JSON | decision-log D8 item⑦ |
| R8 | 向下兼容 | 不改 spec-specify/spec-clarify | spec 第 5 节 Non-Goals |

---

## OPEN QUESTIONS（无法从 decision-log 解决）

| ID | 维度 | 问题 | 建议默认值 |
|----|------|------|-----------|
| OQ-1 | 数据格式 | 质量事实契约第 2/3 项在 SKILL.md 中用 Markdown 表格还是 JSON 块？ | Markdown 表格（可读性优先） |
| OQ-2 | 集成依赖 | TASK_TRACKING_ROOT 目录不存在时是否自动 `mkdir -p`？失败如何处理？ | 自动 `mkdir -p`，失败 warn 不 throw |
| OQ-3 | 版本命名 | SKILL.md 深化版本号：`2.0.0` 还是 `1.1.0`？ | `2.0.0`（较大功能扩展） |

**处理原则**：3 条 OQ 均为低风险，有合理默认值，不阻断 build-plan 推进。build-plan 阶段可就默认值向人确认，或直接采用建议值。
