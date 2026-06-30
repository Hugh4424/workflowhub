# spec-review-r1: M13 make-decision 深化 独立评审报告

**异源证明**
- 引擎：OpenAI Codex CLI（`codex exec`，model: codex 默认前沿 agentic 模型，reasoning_effort=high）
- 命令：`timeout 540 codex exec "<prompt>" -C /Users/Hugh/Hugh/Project/workflowhub -s read-only -c 'model_reasoning_effort="high"' --json`
- Token 消耗：23,060
- 评审者身份：Codex（与 spec 作者 Claude Sonnet 完全异源，非同一模型家族）

**评审对象**
- `specs/m13-make-decision-v1/spec.md`
- `specs/m13-make-decision-v1/constitution-check.md`
- `specs/m13-make-decision-v1/baseline-report.md`
- 基线对照：`tasks/m13-make-decision-v1/decision-log.md`（version: final）

**评审日期**：2026-06-29

---

## 原始 Codex 输出（verbatim）

```json
{
  "verdict": "revise_required",
  "summary": "The spec does not faithfully implement the authoritative decisions: it omits S1, contradicts the only-hard-gate rule, and marks unresolved behavior as complete.",
  "findings": [
    {
      "id": "F-01",
      "severity": "blocking",
      "location": "FR-FLOW-01 vs D1",
      "problem": "D1 requires S1 internal research with at least 3 sub-agents, but FR-FLOW-01 skips S1 and no other FR covers the 3-sub-agent requirement.",
      "fix": "Add an explicit S1 FR defining when it runs, required minimum of 3 sub-agents, expected artifacts, failure behavior, and how S1 output feeds S2."
    },
    {
      "id": "F-02",
      "severity": "blocking",
      "location": "FR-ACCEPT-01 vs D6 / FR-ACCEPT-02",
      "problem": "FR-ACCEPT-01 makes S4 confirmation a blocking gate, while D6 and FR-ACCEPT-02 say S9 is the only hard gate. These cannot both be true.",
      "fix": "Make D6 authoritative: either change S4 confirmation to record-only non-blocking, or explicitly amend D6/FR-ACCEPT-02 to allow S4 as a second hard gate."
    },
    {
      "id": "F-03",
      "severity": "blocking",
      "location": "OPEN-1 / FR-RESEARCH-01 / constitution-check F3 and S5",
      "problem": "OPEN-1 says muyu get_sources failure behavior is unresolved, but F3 and S5 are checked as if auto-degrade to anysearch is decided. These are false-greens.",
      "fix": "Resolve OPEN-1 first. Then update FR-RESEARCH-01 and constitution-check so they state exactly one behavior: stop-and-wait or auto-degrade to single path."
    },
    {
      "id": "F-04",
      "severity": "major",
      "location": "D4 / FR-DEBATE-*",
      "problem": "D4 prohibits self-manufactured dispute points before review to trigger debate, but no FR covers this prohibition.",
      "fix": "Add an FR requiring debate triggers to reference existing reviewed artifacts only, with artifact IDs and finding IDs, and rejecting pre-review manufactured dispute seeds."
    },
    {
      "id": "F-05",
      "severity": "major",
      "location": "D6",
      "problem": "D6 requires interaction simplicity with no more than 4 options, but no FR or acceptance criterion enforces option count.",
      "fix": "Add an FR limiting user-facing choice sets to 4 options maximum, with a machine-checkable artifact scan or schema validation."
    },
    {
      "id": "F-06",
      "severity": "major",
      "location": "D3 / FR-REVIEW-01",
      "problem": "D3 requires 3rd-review heterogeneous-source chain and no same-source fallback. FR-REVIEW-01 only requires independent reviewer_runtime_id, which does not prove source heterogeneity or forbid fallback.",
      "fix": "Add fields for reviewer_source, runtime_id, fallback_used, and source_family; require three distinct source families and fail if any same-source fallback is used."
    },
    {
      "id": "F-07",
      "severity": "major",
      "location": "D2 / FR-DEBATE-03",
      "problem": "D2 says debate must use an external repo, but FR-DEBATE-03 only says debate is in reuse-registry.md. That does not specify external repo use or verification.",
      "fix": "Add an FR that names the external debate repo contract: location, invocation method, expected output artifact, and downgrade behavior if unavailable."
    },
    {
      "id": "F-08",
      "severity": "major",
      "location": "D2 / FR-GRILL-01",
      "problem": "D2 says grill is a thin shell, but FR-GRILL-01 only constrains line count and exit condition. It does not prevent adding logic inside grill.",
      "fix": "Add an FR stating grill-with-docs-lite may only delegate to the existing grill mechanism and must not duplicate review, debate, research, or decision logic."
    },
    {
      "id": "F-09",
      "severity": "major",
      "location": "D1 / S7 requirements",
      "problem": "D1 defines S7 as talk#3 + grill + draft + orchestrator + debate2, but the FRs cover talk, grill, orchestrator, and Gate2 only loosely; there is no explicit draft artifact contract.",
      "fix": "Add an FR for the S7 draft: artifact path, required sections, inputs consumed, and how orchestrator findings attach to it."
    },
    {
      "id": "F-10",
      "severity": "major",
      "location": "FR-REVIEW-02",
      "problem": "The acceptance criterion 'no cross-refs between angle artifacts' depends on semantic judgment and may not reliably fail when false, violating the requirement that checks actually fail on violation.",
      "fix": "Replace it with machine-checkable isolation rules: separate input bundles, no artifact-path references across angle outputs, no shared scratch file, and recorded input hash per angle."
    },
    {
      "id": "F-11",
      "severity": "major",
      "location": "FR-TALK-02",
      "problem": "The criterion only bans phrases like '以下几个问题', but batching can happen without that phrase. It is not a reliable falsifiable test for one-question-at-a-time.",
      "fix": "Define a structural check: each talk turn may contain exactly one question mark or one question object, and must not contain enumerated question lists or multiple interrogative clauses."
    },
    {
      "id": "F-12",
      "severity": "minor",
      "location": "FR-FLOW-01",
      "problem": "The spec says 11 steps but lists 12 bullets because S7 is split into S7 and S7续. The explanation may be understandable, but it invites implementation drift.",
      "fix": "Represent S7 as one step with named subphases, or renumber the flow consistently and stop calling it 11 steps."
    },
    {
      "id": "F-13",
      "severity": "major",
      "location": "FR-ENV-01 / D5",
      "problem": "D5 says six env vars are optional with safe defaults, but FR-ENV-01 only says six env vars. Optionality and defaults are not specified.",
      "fix": "List all six env vars with default values, allowed values, invalid-value behavior, and proof that none are required for the default path."
    },
    {
      "id": "F-14",
      "severity": "minor",
      "location": "FR-LEDGER-*",
      "problem": "Ledger requirements look heavier than the stated threat if they require multiple render points and line-by-line S9 display without defining what user decision this changes.",
      "fix": "Keep the ledger if it directly supports S9 review; otherwise reduce it to a single append-only artifact plus one S9 render."
    },
    {
      "id": "F-15",
      "severity": "major",
      "location": "Scope / S1",
      "problem": "The missing S1 cannot be treated as an intentional scope cut because D1 is authoritative and explicitly includes it.",
      "fix": "Either implement S1 in the FR list or update the authoritative decision log to remove S1 before claiming coverage."
    }
  ]
}
```

---

## 解析结果摘要

**裁决**：`revise_required`

**一句话总结**：spec 未忠实实现决策日志（漏掉 S1、S4 硬门控与"唯一 gate S9"矛盾、未解决行为被标记为已完成）。

### Blocking 问题（3 条）

| ID | 位置 | 问题 |
|----|------|------|
| F-01 | FR-FLOW-01 vs D1 | S1（内部调研≥3 sub-agents）在 FR-FLOW-01 中完全缺失，无任何 FR 覆盖 |
| F-02 | FR-ACCEPT-01 vs D6/FR-ACCEPT-02 | FR-ACCEPT-01 在 S4 设置了阻断门控，与 D6 和 FR-ACCEPT-02"S9 是唯一硬门控"直接矛盾 |
| F-03 | OPEN-1 / FR-RESEARCH-01 / constitution-check F3 & S5 | OPEN-1 明确标注 muyu 失败行为未解决，但 constitution-check 的 F3、S5 均标 [x] 为假绿（false-green） |

### Major 问题（9 条）

| ID | 位置 | 问题 |
|----|------|------|
| F-04 | D4 / FR-DEBATE-* | D4 禁止"审查前自造争点"，无任何 FR 覆盖此禁止规则 |
| F-05 | D6 | D6 要求"交互≤4选项"，无任何 FR 或 AC 强制执行 |
| F-06 | D3 / FR-REVIEW-01 | FR-REVIEW-01 仅要求独立 reviewer_runtime_id，未证明异源性，未禁止同源降级 |
| F-07 | D2 / FR-DEBATE-03 | FR-DEBATE-03 只说登记 reuse-registry，未规定外部 repo 合约（位置、调用方式、产物、降级） |
| F-08 | D2 / FR-GRILL-01 | FR-GRILL-01 只限行数和退出条件，未防止内部重复实现调研/盲审/辩论逻辑 |
| F-09 | D1 / S7 | S7 包含 draft 产物但无明确 FR（无 artifact 路径、无必填节、无 orchestrator 挂载方式） |
| F-10 | FR-REVIEW-02 | AC"不出现跨角度专属输入交叉引用"依赖语义判断，不可机器验证，违反 Q3 |
| F-11 | FR-TALK-02 | AC 只禁止"以下几个问题"字眼，LLM 可批量提问而不使用该短语，不可证伪 |
| F-13 | FR-ENV-01 / D5 | 6 个 env var 的默认值、可选性、无效值行为在 FR-ENV-01 中未规定（表格在 spec 正文中存在，但 FR 本身文本未明确约束） |
| F-15 | Scope / S1 | 缺失 S1 不可视为有意范围裁剪——D1 权威且显式包含 S1 |

### Minor 问题（2 条）

| ID | 位置 | 问题 |
|----|------|------|
| F-12 | FR-FLOW-01 | "11 步"但列 12 条 bullet，S7 拆成两条 bullet，实现者易产生漂移 |
| F-14 | FR-LEDGER-* | 台账双渲染点 + S9 逐条展示的收益未明确说明，可能过重 |

---

## Reviewer 说明

本次评审由 **OpenAI Codex**（`codex exec`，reasoning_effort=high，read-only sandbox）执行，与 spec 作者（Claude Sonnet 4.6）完全异源。Codex 仅接收 prompt 内联文本，未读取本仓库任何文件。

报告路径：`specs/m13-make-decision-v1/review/spec-review-r1.md`
