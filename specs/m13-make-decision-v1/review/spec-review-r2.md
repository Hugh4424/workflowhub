# spec-review-r2: M13 make-decision 深化 Round-2 异源复核报告

**异源证明**
- 引擎：OpenAI Codex CLI（`codex exec`，model: codex 默认前沿 agentic 模型，reasoning_effort=high）
- 命令：`codex exec "<prompt>" -C /Users/Hugh/Hugh/Project/workflowhub -s read-only -c 'model_reasoning_effort="high"' --json`
- Token 消耗：63,245
- 评审者身份：Codex（与 spec 作者 Claude Sonnet 完全异源，非同一模型家族）
- 评审日期：2026-06-29

**评审对象**
- `specs/m13-make-decision-v1/spec.md`（修订版）
- `specs/m13-make-decision-v1/constitution-check.md`（修订版）
- 权威基线：`tasks/m13-make-decision-v1/decision-log.md`（version: final）

**R1 报告**：`specs/m13-make-decision-v1/review/spec-review-r1.md`

---

## 原始 Codex 输出（verbatim）

```
我会只读取你列出的 3 个仓库文件，不碰任何 skill 目录，也不修改文件。接下来逐条核对 F-01 到 F-15 的修复声明和现有文本是否一致。

[codex ran] /bin/bash -lc 'nl -ba specs/m13-make-decision-v1/constitution-check.md'
[codex ran] /bin/bash -lc 'nl -ba specs/m13-make-decision-v1/spec.md'
[codex ran] /bin/bash -lc 'nl -ba tasks/m13-make-decision-v1/decision-log.md'

我已经读完 3 个文件。当前主要风险不是"有没有写新 FR"，而是少数修复只改了 spec，权威 decision-log 里还残留旧表述，下面会按 R1 编号给状态。

ID: F-01 | STATUS: CLOSED | EVIDENCE: spec.md 已新增 FR-RESEARCH-00，明确 S1 仅 full 档执行、>=3 parallel sub-agents、产物路径 tasks/{task-id}/research/internal-research-summary.md、失败留痕继续、S2 必须读取该摘要。

ID: F-02 | STATUS: PARTIALLY_CLOSED | EVIDENCE: spec.md 的 FR-ACCEPT-01 已改成"记录模式，非阻断"，并要求 S4 后直接进入 S5。问题是权威 decision-log.md 的 D6 仍写着"S4 后 S5 前，未确认挡住流程但非机器gate"，这仍和"S9 唯一 hard gate"冲突。

ID: F-03 | STATUS: CLOSED | EVIDENCE: spec.md 已把 OPEN-1 标为 RESOLVED，并在 FR-RESEARCH-01 中规定 muyu get_sources 失败时立即停下、报告用户、等待明确指令。constitution-check.md 的 F3/S5 也同步改成"停下等人决策"，不再是假绿自动降级。

ID: F-04 | STATUS: CLOSED | EVIDENCE: FR-DEBATE-01 明确 debate 触发必须来自既有盲审 artifacts 的 finding ID，禁止审查前或审查外自造争点。违规时记录 debate_triggered_invalid:true 并跳过 debate。

ID: F-05 | STATUS: CLOSED | EVIDENCE: FR-TALK-02 已要求每个 talk turn 选项数量 <=4，并给出可扫描的 A/B/C/D 或 1/2/3/4 列表标记校验方式。

ID: F-06 | STATUS: CLOSED | EVIDENCE: FR-REVIEW-01 已要求每个 reviewer checkpoint 记录 reviewer_runtime_id、reviewer_source、source_family、fallback_used。三个角度必须有三个不同 source_family，且 fallback_used:true 时该角度失败并停下报告用户。

ID: F-07 | STATUS: PARTIALLY_CLOSED | EVIDENCE: FR-DEBATE-01/04 已补上 MAKE_DECISION_DEBATE_PATH、finding ID 输入、make-decision-debate-1.md 输出和 path/SKIP 降级行为。仍缺一个具体可执行的调用契约，例如调用哪个入口、命令格式、参数名或 stdin/stdout 文件协议，因此外部 repo contract 还不够落地。

ID: F-08 | STATUS: CLOSED | EVIDENCE: FR-GRILL-01 已把 grill-with-docs-lite 定义为纯委托薄壳，限制 <=40 行，并禁止加入 review、debate、research、decision 等业务逻辑。

ID: F-09 | STATUS: CLOSED | EVIDENCE: FR-DRAFT-01 已新增 S7 草稿产物 artifacts/make-decision-decision-log-draft.md，要求 7 节结构，并要求 orchestrator 发现追加到 ## orchestrator-findings，不得覆盖正文。

ID: F-10 | STATUS: CLOSED | EVIDENCE: FR-REVIEW-02 已改为三个独立输入 bundle 文件，并要求 input_hash、checkpoint 引用和 bundle 路径字符串交叉扫描，具备机器可校验性。

ID: F-11 | STATUS: CLOSED | EVIDENCE: FR-TALK-02 已从禁用单个短语改为结构性规则：每 turn 最多 1 个问号、最多 1 个疑问句、禁止枚举式多问题列表，并要求自动扫描产物。

ID: F-12 | STATUS: STILL_OPEN | EVIDENCE: Clarifications 说"11 步 = S0、S0.5、S2、S3、S4、S5、S6、S7、S8、S9、S10"，直接漏掉 S1。且当前 FR-FLOW-01 实际 numbered list 是 12 条，不是因为"S7 被拆成两条 bullet"；这个解释与现文不一致。

ID: F-13 | STATUS: CLOSED | EVIDENCE: FR-ENV-01 已给出 6 个 env var 的完整表格，包含默认值、允许值、非法值行为和作用。FR-ENV-02 也明确这些 env var 不进入 config/workflowhub.yaml。

ID: F-14 | STATUS: CLOSED | EVIDENCE: FR-LEDGER-01 已明确两个台账渲染点直接服务 S9 决策裁决，并说明 S9 展示内容追溯到第二次渲染产物。

ID: F-15 | STATUS: CLOSED | EVIDENCE: S1 已由 FR-RESEARCH-00 明确覆盖，包含执行条件、并发 sub-agent 数量、产物路径、失败行为和 S2 输入契约。

NEW BLOCKING ISSUES:
- spec.md 的 11 步说明现在自相矛盾：FR-FLOW-01 列出 12 个编号步骤，Clarifications 又说 11 步且漏掉 S1。这会让实现者无法判断 S1 是否属于正式主流程。
- spec.md 的 S3 触发条件冲突：FR-FLOW-01 说 S3 仅在 full 档且 S2 确认需要时触发；FR-FLOW-02 验收却说 full 档时 S1 和 S3 均必须执行。这会破坏"S2 门控外部调研"的核心设计。

VERDICT: revise_required

SUMMARY: 大多数 R1 修复已落到 spec，但仍有 S4 权威文档残留、debate 调用契约不完整、11/12 步与 S3 条件触发冲突，不能 pass。
```

---

## 解析结果摘要

**裁决**：`revise_required`

**一句话总结**：11 项 R1 问题已关闭，但 F-02/F-07/F-12 仍未完全修复，且引入 2 条新 blocking 问题（11/12步自相矛盾、S3 触发条件冲突）。

### F-01..F-15 逐条状态

| ID | 原级别 | R2 状态 | 简述 |
|----|--------|---------|------|
| F-01 | blocking | CLOSED | FR-RESEARCH-00 完整覆盖 S1 >=3 sub-agents、产物、失败行为、S2 输入契约 |
| F-02 | blocking | PARTIALLY_CLOSED | spec 改为非阻断，但 decision-log.md D6 仍写"S4 未确认挡住流程"，权威文档矛盾未解 |
| F-03 | blocking | CLOSED | OPEN-1 已标 RESOLVED，FR-RESEARCH-01 行为唯一，constitution-check F3/S5 不再假绿 |
| F-04 | major | CLOSED | FR-DEBATE-01 明确禁止预审查自造争点，debate_triggered_invalid:true 已覆盖 |
| F-05 | major | CLOSED | FR-TALK-02 <=4 选项，可机器扫描 |
| F-06 | major | CLOSED | source_family 三角度互异 + fallback_used:true = 失败，已落地 |
| F-07 | major | PARTIALLY_CLOSED | env var/降级行为已补，缺调用入口/命令格式/stdin-stdout 协议 |
| F-08 | major | CLOSED | 纯委托薄壳，<=40 行，禁止列表明确 |
| F-09 | major | CLOSED | FR-DRAFT-01 完整产物契约、7 节结构、orchestrator 追加节 |
| F-10 | major | CLOSED | 三个独立 bundle 文件 + input_hash + 路径字符串交叉扫描 |
| F-11 | major | CLOSED | 结构性规则：1 问号/turn、1 疑问句、无枚举多问、可自动扫描 |
| F-12 | minor | STILL_OPEN | Clarifications 11步列表漏掉 S1；FR-FLOW-01 实际 12 条，解释与文本不一致 |
| F-13 | major | CLOSED | 6 个 env var 完整表格：默认值、允许值、非法值行为 |
| F-14 | minor | CLOSED | FR-LEDGER-01 明确两次渲染直接服务 S9 裁决 |
| F-15 | major | CLOSED | 同 F-01，FR-RESEARCH-00 已覆盖 |

### 仍未关闭的 R1 问题（2 条）

| ID | 状态 | 问题 | 建议修复 |
|----|------|------|---------|
| F-02 | PARTIALLY_CLOSED | decision-log.md D6 仍说"S4 未确认挡住流程"与 S9 唯一 hard gate 矛盾 | 在 decision-log.md D6 中更新表述，或在 spec F-02 fix 中显式说明 decision-log 表述已被 spec 修订覆盖 |
| F-07 | PARTIALLY_CLOSED | debate 外部 repo 调用契约缺：入口命令、参数格式、stdin/stdout 文件协议 | 补充调用示例或接口 schema（哪个可执行文件/脚本、参数名、返回格式） |
| F-12 | STILL_OPEN | Clarifications 11步列表缺 S1；FR-FLOW-01 实际12条，解释自相矛盾 | 把 S1 加入 Clarifications 的 11步列表（实为 12步），或统一数字 |

### 新增 Blocking 问题（R2 新发现，2 条）

| ID | 严重性 | 位置 | 问题 | 建议修复 |
|----|--------|------|------|---------|
| NEW-01 | major | FR-FLOW-01 vs Clarifications | 11步/12步自相矛盾：Clarifications 列了 S0/S0.5/S2-S10 共 11 项（漏 S1），但 FR-FLOW-01 实际有 12 个编号步骤（含 S1）。实现者无法确定 S1 是否属于主流程 | 统一：如果 S1 是主流程（FR-RESEARCH-00 说是），Clarifications 里加上 S1，总步骤应为 12 |
| NEW-02 | major | FR-FLOW-01 vs FR-FLOW-02 | S3 触发条件冲突：FR-FLOW-01 说 S3 仅在 full 档 + S2 确认需要时触发（用户门控）；FR-FLOW-02 验收却说 full 档时 S1 和 S3 均必须执行（无用户门控）。破坏 S2 门控外部调研的核心设计 | 在 FR-FLOW-02 验收标准中明确 S3 是条件触发（需 S2 用户确认），不是 full 档自动执行 |
