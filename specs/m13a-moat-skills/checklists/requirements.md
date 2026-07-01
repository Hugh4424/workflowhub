# 质量 Checklist — m13a-moat-skills

> 来源：spec-specify 质量检查要求；对照 specs/m13a-moat-skills/spec.md v1.0.0
> 状态：待实现阶段核查（record-only，非阻断门）

---

## 一、文档质量

- [ ] 无实现细节泄露（无编程语言、框架、API 名称进入 FR 正文）
- [ ] 聚焦用户价值与业务需求，不描述"如何实现"
- [ ] 非技术干系人可读（FR 描述用业务语言）
- [ ] 所有必填章节已完成（速读卡 / 序言 / 问题陈述 / 背景目标边界 / 用户场景 / FR / 非目标 / 验收条件 / 影响范围 / 附录）

---

## 二、需求完整性

- [ ] 所有 [NEEDS CLARIFICATION] 标记已解决（当前：0 条残留）
- [ ] 所有功能需求可测试、无歧义（每条 FR 含 Given/When/Then 或等义可测断言）
- [ ] 成功标准可度量（AC 条目可 grep/stat/测试验证）
- [ ] 成功标准不含实现细节
- [ ] 所有验收场景已定义（正常路径 / 失败路径 / 降级路径 / 可证伪测试）
- [ ] 边界情况已标识（fallback_used、findings 不足、文件缺失、env 未设置）
- [ ] 范围已明确界定（Scope IN/OUT 均已列出）
- [ ] 依赖和假设已记录（附录 Known Gaps + decision-log §4 假设）

---

## 三、功能就绪

- [ ] 每条功能需求有明确验收标准（FR↔AC 映射完整，共 22 条 FR / 22 条 AC）
- [ ] 用户场景覆盖主要流程（9 个场景，含正常路径、失败路径、降级路径、可证伪）
- [ ] 功能满足可度量目标（AC 均为 grep/文件存在/测试报红等可机械验证项）
- [ ] 无实现细节泄漏进规格书

---

## 四、FR 编号自检

| 域 | 编号范围 | 数量 | 断号检查 |
|---|---|---|---|
| MOAT | FR-MOAT-001~003 | 3 | 无断号 |
| TALK | FR-TALK-001~003 | 3 | 无断号 |
| GRILL | FR-GRILL-001~003 | 3 | 无断号 |
| REVIEW | FR-REVIEW-001~004 | 4 | 无断号 |
| MAKEDEC | FR-MAKEDEC-001~003 | 3 | 无断号 |
| TEST | FR-TEST-001~005 | 5 | 无断号 |
| TRACKING | FR-TRACKING-001~002 | 2 | 无断号 |
| COMM | FR-COMM-001~003 | 3 | 无断号 |
| **合计** | | **22** | |

---

## 五、AC 编号自检

| 编号 | 对应 FR 域 | 可验证方式 |
|---|---|---|
| AC-01 | MOAT/TALK | stat/ls |
| AC-02 | MOAT/GRILL | stat/ls |
| AC-03 | MOAT/REVIEW | stat/ls |
| AC-04 | GRILL | stat/ls |
| AC-05 | GRILL | stat/ls |
| AC-06 | MOAT | grep `^name:` |
| AC-07 | MOAT | grep 宿主依赖关键词为空 |
| AC-08 | MOAT | grep `/Users/\|/home/` 在三个 skill 目录全部文件为空（覆盖 macOS /Users/ 与 Linux /home/） |
| AC-09 | TALK | grep 影响排序关键词 |
| AC-10 | MAKEDEC | grep intake-decision-review |
| AC-11 | MAKEDEC | grep grill-with-docs |
| AC-12 | MAKEDEC | grep talk-with-zhipeng 在 S2/S4/S7 各段命中（≥3 处，逐段断言）；旧外部 talk 路径 grep 为空 |
| AC-13 | REVIEW | tests/moat-skills.test.mjs 存在 + grep `direction.*framing.*scope\|三.*角度` 命中（测试文件含三角度断言） |
| AC-14 | REVIEW | tests/moat-skills.test.mjs 存在 + grep `恰好.*3\|exactly.*3\|findings.*length.*3` 命中（测试文件含恰好3条断言） |
| AC-15 | REVIEW | tests/moat-skills.test.mjs 存在 + grep `fallback_used` 命中（测试文件含 fallback_used 停止断言） |
| AC-16 | REVIEW | tests/moat-skills.test.mjs 存在 + grep `单次\|single.*call\|once\|calledOnce` 命中（测试文件含单次调用断言） |
| AC-17 | TRACKING | grep TASK_TRACKING_ROOT |
| AC-18 | TRACKING | grep tracking_root_fallback |
| AC-19 | TEST | npm test 全量绿 |
| AC-20 | TEST | 删文件后断言报红（可证伪） |
| AC-21 | COMM | grep 推荐 在 S2/S4 段落；framing\|scope 作为独立术语直接暴露给用户为空 |
| AC-22 | TALK | grep gbrain 为空（与 AC-07 可合并） |
| AC-23 | COMM | grep 不确认\|not confirmed\|等待确认 在 S9 段落命中 |
| AC-24 | REGISTRY | `config/reuse-registry.md` 中三条记录各自名称+in-repo 路径同处一行（grep 逐行断言三条均命中，路径非绝对路径） |
| AC-25 | REGISTRY | (a) grep `/Users/\|/home/` 在 config/reuse-registry.md 为空（覆盖 macOS /Users/ 与 Linux /home/）；(b) grep `~/.claude\|multica-agenthub\|gbrain\|office-hours` 为空（四类全覆盖，两类分别检测） |
| AC-26 | TALK | grep `输入\|步骤\|执行协议` 和 `talk` 在 talk-with-zhipeng SKILL.md 命中（搬运硬证据） |
| AC-27 | GRILL | grep `grill` 和 `输入\|输出\|步骤` 在 grill-with-docs SKILL.md 命中（搬运硬证据） |
| AC-28 | TEST | 两层断言均须通过：(1) tests/moat-skills.test.mjs 存在 + grep `不得编造\|缺角度\|重跑\|rerun` 命中；(2) intake-decision-review SKILL.md 三组 AND 断言全命中（FR-TEST-004(e) 负例，RED/GREEN 证据属 build-code） |

AC 共 28 条，无断号，无重复。

---

## 六、决策覆盖检查（decision-log D1–D6）

| 决策 | 类型 | 对应 FR | 覆盖状态 |
|---|---|---|---|
| D1 护城河 skill 数量 6→3 | KEEP | FR-MOAT-001, FR-TALK-001~003, FR-GRILL-001~003, FR-REVIEW-001~004 | 已覆盖 |
| D2 引用切换 S5/S7/talk | KEEP | FR-MAKEDEC-001~003 | 已覆盖 |
| D3 intake-decision-review 契约 | KEEP | FR-REVIEW-001~004 | 已覆盖 |
| D4 测试契约 | KEEP | FR-TEST-001~005 | 已覆盖 |
| D5 TASK_TRACKING_ROOT env | KEEP | FR-TRACKING-001~002 | 已覆盖 |
| D6 大白话改写 | KEEP | FR-COMM-001~003 | 已覆盖 |

所有 D1-D6 均为 KEEP，全部有 FR 覆盖。

---

## 七、宪法合规自检（record-only）

| 宪法条款 | 相关 FR | 评估 |
|---|---|---|
| F1 薄核心 | FR-MOAT-001（能力下沉到 skills/） | 符合：护城河能力从主 skill 内联迁移到独立 skill 文件 |
| F2 窄契约 | FR-REVIEW-001~004（三角度明确接口） | 符合：intake-decision-review 接口窄且明确（3 条/三类） |
| F4 记录事实而非阻断 | FR-TEST-001~005（测试报红是记录，非阻断主流程） | 符合：所有质量检查为记录+浮现 |
| F5 可证伪 | FR-TEST-001（文件删除后报红）, AC-20 | 符合：断言在实际为假时真报失败 |
| F10 反过度工程 | 见序言四问 | 符合：四问全通过 |

评估为 record-only，非阻断。

---

## 八、Spec-Purity 扫描

- 本 spec 含 grep 命令示意（如 `grep "影响排序"`）：性质为文档说明，非 shell 可执行命令，不含代码块（无 ``` 围栏）。
- 人工确认：可接受，记录为 warn，不阻断。

---

*checklist 状态：draft — 待实现阶段核查后逐条勾选*
