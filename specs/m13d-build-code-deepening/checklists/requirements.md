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
- [x] 所有验收场景已定义 — 24 条 AC 覆盖 8 个 FR 的主流程和边界情况（FR-ANTIFORGERY-001 已按用户决策移除）
- [x] 边界情况已标识 — escalate_to_human 路径（C 类升级、worktree checkout 失败）均有对应 AC
- [x] 范围已明确界定 — §2 边界明确排除 M13e 消费端、data-contracts.md 产出（属 M13d 自身 build-plan 阶段职责）、第二异源引擎
- [x] 依赖和假设已记录 — 附录 B Known Gaps 共 5 条，其中 #1/#2 已核实关闭，#3 用户已确认关闭，#4/#5 待人工跟进

## 功能就绪

- [x] 每条功能需求有明确验收标准 — 8 个 FR 各含 2-4 条 AC，均可追溯
- [x] 用户场景覆盖主要流程 — 7 个场景覆盖 8 个 FR 全部主流程（场景 C 随 FR-ANTIFORGERY-001 一并移除）
- [x] 功能满足成功标准中定义的可度量目标 — 验收清单表格中含失败判据列
- [x] 无实现细节泄漏进规格书 — 已检查：无 mjs/Node/git API/Shell 命令名泄露

## spec 结构检查（三层结构）

- [x] 层 1 速读卡（顶部 30 行内）：存在，含一句话需求 + 核心改动点 + 最大影响面 + 验收信号
- [x] 层 2 正文（问题陈述 / 背景 / FR / AC / 影响范围）：存在且完整
- [x] 层 3 附录（质量事实契约占位 / Known Gaps / 设计决策）：存在，附录 A/B/C 均已创建
- [x] Known Gaps 段必须存在：存在（附录 B，5 条，#1/#2 已核实关闭，#3 用户确认关闭，#4/#5 待跟进）
- [x] FR 编号规范（FR-{DOMAIN}-NNN）：已检查，8 个 FR 均符合（RISK/SMOKE/REVIEW/COMMIT/WORKTREE/REUSE/METRICS，ANTIFORGERY 已按用户决策移除）
- [x] 每个 FR 至少一条 Given/When/Then 场景：已检查，8 个 FR 均有场景
- [x] "明确不做"章节存在且覆盖 decision-log 全部三项：存在，§9 不做 1/2/3 与 decision-log §5 完全对应
- [x] decision-log 开放问题（M13c data-contracts.md）体现在 Known Gaps：存在（Known Gap #1，经用户澄清后已核实为阶段顺序理解错误，非真实缺口，已关闭）

## 无人值守模式歧义处理

无 [NEEDS CLARIFICATION] 标记。所有歧义点已转换为 Known Gaps + 假设：

1. M13c data-contracts.md 字段冲突风险 → Known Gap #1（已关闭：核实为阶段顺序理解错误，M13d 自己的 data-contracts.md 在其自身 build-plan 阶段产出）
2. reuse-registry.md 技能来源 → Known Gap #2（已关闭：三技能均为本项目自研，无需来源 URL）
3. 第二异源引擎不可用 → Known Gap #3（用户已确认，关闭状态）
4. 3rd-review(codex) 两次超时未跑成 → Known Gap #4（待人工排查根因后补跑）
5. test-routing-advisor 来源不明 → Known Gap #5（待人工补充）

---

检查结果：全部通过。可进入 build-plan 阶段，Known Gaps #4/#5 需在实施前跟进（#1/#2/#3 均已关闭）。
