# 规格质量检查清单：build-code 深化（M13d）

用于在进入 plan 阶段前验证 spec 的完整性和质量。

task_id: m13d-build-code-deepening
spec_path: specs/m13d-build-code-deepening/spec.md
generated_at: 2026-07-01

---

## 内容质量

- [x] 无实现细节泄露（无编程语言、框架、API 名称）— FR 均使用行为描述，无 JS/Node/git 函数名泄露；"DO NOT commit"为行为约束非实现细节
- [x] 聚焦用户价值与业务需求 — 所有 FR 从行为结果描述，不写"如何实现"
- [x] 非技术干系人可读 — 场景使用 Given/When/Then 自然语言
- [x] 所有必填章节已完成 — 速读卡 / 问题陈述 / 背景目标边界 / 用户场景 / FR / 影响范围 / 不做和隐性必达 / 验收清单 / Known Gaps 均存在

## 需求完整性

- [x] 所有 [NEEDS CLARIFICATION] 标记已解决 — 本 spec 无 [NEEDS CLARIFICATION] 标记（无人值守模式，歧义已转为 Known Gaps + 假设）
- [x] 所有功能需求可测试、无歧义 — 每条 FR 含 Given/When/Then 场景 + 明确 AC，AC 均含失败判据
- [x] 成功标准可度量 — AC 均为可判真伪的具体条件（文件存在/字段存在/值合规等）
- [x] 成功标准不含实现细节 — AC 描述文件和字段存在性，不描述代码实现
- [x] 所有验收场景已定义 — 27 条 AC 覆盖 9 个 FR 的主流程和边界情况
- [x] 边界情况已标识 — escalate_to_human 路径（mtime 违反、C 类升级、worktree checkout 失败）均有对应 AC
- [x] 范围已明确界定 — §2 边界明确排除 M13e 消费端、data-contracts.md 补齐、第二异源引擎
- [x] 依赖和假设已记录 — 附录 B Known Gaps 列出 3 条假设，均标注 "assumption, pending human confirm"

## 功能就绪

- [x] 每条功能需求有明确验收标准 — 9 个 FR 各含 2-4 条 AC，均可追溯
- [x] 用户场景覆盖主要流程 — 8 个场景（A-H）覆盖 9 个 FR 全部主流程
- [x] 功能满足成功标准中定义的可度量目标 — 验收清单表格中含失败判据列
- [x] 无实现细节泄漏进规格书 — 已检查：无 mjs/Node/git API/Shell 命令名泄露

## spec 结构检查（三层结构）

- [x] 层 1 速读卡（顶部 30 行内）：存在，含一句话需求 + 核心改动点 + 最大影响面 + 验收信号
- [x] 层 2 正文（问题陈述 / 背景 / FR / AC / 影响范围）：存在且完整
- [x] 层 3 附录（质量事实契约占位 / Known Gaps / 设计决策）：存在，附录 A/B/C 均已创建
- [x] Known Gaps 段必须存在：存在（附录 B，3 条已知未解风险）
- [x] FR 编号规范（FR-{DOMAIN}-NNN）：已检查，9 个 FR 均符合（RISK/SMOKE/ANTIFORGERY/REVIEW/COMMIT/WORKTREE/REUSE/METRICS）
- [x] 每个 FR 至少一条 Given/When/Then 场景：已检查，9 个 FR 均有场景
- [x] "明确不做"章节存在且覆盖 decision-log 全部三项：存在，§9 不做 1/2/3 与 decision-log §5 完全对应
- [x] decision-log 开放问题（M13c data-contracts.md）体现在 Known Gaps：存在（Known Gap #1）

## 无人值守模式歧义处理

无 [NEEDS CLARIFICATION] 标记。所有歧义点已转换为 Known Gaps + 假设并标注 "assumption, pending human confirm"：

1. M13c data-contracts.md 字段冲突风险 → Known Gap #1
2. reuse-registry.md 四技能来源 URL → Known Gap #2
3. 第二异源引擎不可用 → Known Gap #3（用户已确认，实为关闭状态）

---

检查结果：全部通过。可进入 build-plan 阶段，Known Gaps #1/#2 需在实施前跟进。
