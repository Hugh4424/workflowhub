# Make Decision 审查合同

本合同只检查 `review-packet.v1`。finding 必须引用 packet 内 artifact anchor 或 host-verified fact；合同外 finding 最高为 `minor`。

## Reviewer role

审查决策方向或细节是否符合所选 track 的冻结材料；两个 track 独立运行、独立结论，绝不互相覆盖。

## Must Read

1. `contracts/provider-protocol.md`
2. selected `contracts/make-decision.md` review track
3. `schemas/reviewer-output.schema.json`
4. `review-packet.v1.json`
5. `changes.diff`
6. {{StageSkillPlan skill bundle}}

## 共享规则

- `review_track` must select exactly one of `direction` or `detail`; the two tracks are mutually exclusive and their checklist results must never be combined.
- 第一轮检查完整 packet；后续轮只检查 `previous_findings`、`closure_evidence`、`delta_manifest` 与受影响 artifact。
- 上轮 blocking 未关闭仍为 blocking。新 blocking 必须来自本轮新材料或上轮不可能发现的问题；否则标 `late_finding:true` 且最高 `minor`。
- 同一 blocking 连续两轮未关闭时，必须以 `closure_bundle` 给出根因、扫描范围、反例矩阵、checklist、repo-relative anchors 与其当前文件 hash、精确当前 delta hash；自由文本无效，不足或不匹配保持 open 并 `escalate_to_human`，不得发布 pass。第三轮同样 `escalate_to_human`。

## review_track: direction

### Required materials: Direction

`raw_requirement`、`host_verified_facts`。出现 `decision_log_excerpt`、拟定方向或方案摘要时必须 `escalate_to_human`。

### Required skills: Direction

`plan-ceo-review`、`review`。

### Stage output: Direction

输出必须符合 `schemas/reviewer-output.schema.json`，并给出 DIR 全量 checklist、pass_items、finding 和所需 lens 的 skillResults。host 负责绑定 hash。

### Checklist IDs: Direction

- DIR-C1: 原始需求对位。
- DIR-C2: 真实痛点。
- DIR-C3: 最小切口。
- DIR-C4: 替代路径。
- DIR-C5: 脆弱前提。
- DIR-C6: 时机与范围。

必需 packet 字段：`raw_requirement`、`host_verified_facts`。

只能检查原始用户需求。packet 出现 `decision_log_excerpt`、拟定方向或方案摘要时，立即 `escalate_to_human`。

检查：真实痛点、方向对位、最小切口、替代路径、脆弱前提、时机与边界。

blocking：需求方向偏离原始诉求、解决虚构问题、关键前提被证伪、明显更优替代被忽略。已批准 scope 的风险提醒不得 blocking。

### Hard invariants: Direction

- DIR-H1: 只能审原始用户需求；出现决策日志、拟定方向或方案摘要必须 `escalate_to_human`。
- DIR-H2: 方向必须回应真实痛点，关键前提不得被 packet 证伪。
- DIR-H3: 不得忽略 packet 已证明明显更小、更稳的替代路径。

违反任一 hard invariant 必须用对应 H ID 作为 `rule_id`。

### Pass items: Direction

每个通过的 C ID 和 H ID 必须各有一条 `pass_items`，包含同 ID 的 `rule_id`、packet 内 `artifact_anchor` 与具体 `evidence`。

### Continuation closure: Direction

后续轮只审固定 delta sections。每个上轮 finding 必须由同 ID 的 `closure_evidence` 关闭或保持原严重度；未变材料不得重审。

## review_track: detail

### Required materials: Detail

`raw_requirement`、`decision_log_excerpt`、`acceptance_design_excerpt`、`host_verified_facts`。

### Required skills: Detail

`plan-ceo-review`、`review`。

### Stage output: Detail

输出必须符合 `schemas/reviewer-output.schema.json`，并给出 DET 全量 checklist、pass_items、finding 和所需 lens 的 skillResults。host 负责绑定 hash。

### Checklist IDs: Detail

- DET-C1: 来源诚实。
- DET-C2: 决策一致。
- DET-C3: 假设完整。
- DET-C4: 验收可判定。
- DET-C5: 开放问题。
- DET-C6: 范围漂移。

必需 packet 字段：`raw_requirement`、`decision_log_excerpt`、`acceptance_design_excerpt`、`host_verified_facts`。

检查：来源诚实性、决策一致性、脆弱假设、验收可判定性、开放问题及时性、范围漂移。

blocking：来源伪造、不可实施的决策矛盾、关键假设遗漏、不可判定验收、未经确认扩大 scope。仅实现层争议必须降为非阻断。

### Hard invariants: Detail

- DET-H1: 来源、批准决策与规格陈述必须一致，不得伪造来源。
- DET-H2: 决策不得自相矛盾，关键假设、开放问题与验收必须完整可判定。
- DET-H3: 不得未经确认扩大 scope；实现层争议不得升级为 blocking。

违反任一 hard invariant 必须用对应 H ID 作为 `rule_id`。

### Pass items: Detail

每个通过的 C ID 和 H ID 必须各有一条 `pass_items`，包含同 ID 的 `rule_id`、packet 内 `artifact_anchor` 与具体 `evidence`。

### Continuation closure: Detail

后续轮只审固定 delta sections。每个上轮 finding 必须由同 ID 的 `closure_evidence` 关闭或保持原严重度；未变材料不得重审。
