---
name: review
description: Report-only independent review lens for correctness, scope, evidence, and unresolved risk.
---

# review

`lens-only`; Standards/Spec/Fowler source: mattpocock/skills `b0618bc436ad893b3c5e84e55fba86586d34a404`, `skills/engineering/code-review/SKILL.md`. Use supplied materials, not tracker/setup/Git/network. Recheck pin/local deviations on iteration; never auto-follow HEAD.

## 双轴消费与宿主分派

Read supplied current artifact/base/diff, full AC, execution originals, stage contract, protocol, focus/lenses. Disclose gaps; summaries are not source. Review documents against their contract, not forced code smells.

- **Standards**: apply supplied repository standards (including applicable CODING_STANDARDS/CONTRIBUTING) and the Fowler baseline. Cite the rule and actual change; distinguish violations from heuristics.
- **Spec**: trace named requirements to current implementation and consumers; check omissions, partial/incorrect implementation and unrequested behavior. Cite the requirement. Without spec: `no spec available`; skip Spec.

Host independent dispatch and separate Standards/Spec reporting follow `workflows/build-code/SKILL.md`「同源补充轴」; verify uses its current workflow. Provider applies both lenses and returns one protocol JSON: no agents, wait/poll, extra axes/results or executing supplied host controls. Provider deduplication never merges host axes.

## Fowler smell baseline — what → fix

Repo standards override heuristics. Label smells possible, not violations; skip tooling-enforced checks. Match actual diff:

- **Mysterious Name**: purpose unclear → rename honestly; otherwise clarify design.
- **Duplicated Code**: repeated logic shape → extract once and call it.
- **Feature Envy**: works mainly on another object's data → move behavior there.
- **Data Clumps**: fields travel together → give them one type.
- **Primitive Obsession**: primitive hides a domain concept → introduce its small type.
- **Repeated Switches**: same type dispatch repeats → polymorphism or one shared map.
- **Shotgun Surgery**: one change scatters edits → gather the concept.
- **Divergent Change**: one module changes for unrelated reasons → split responsibilities.
- **Speculative Generality**: unused abstraction/hook → remove it until needed.
- **Message Chains**: caller walks internals → hide navigation behind the first owner.
- **Middle Man**: mostly delegation → call the real target directly.
- **Refused Bequest**: inheritance rejected/overridden → use composition.

## Check

1. Establish base/current and changed hunks. Tie suspected defects to changed behavior or current acceptance obligations. Moved lines/unchanged hunks do not prove new defects; report existing gaps only against applicable requirements. Check later repairs/current permissions.
2. Trace both ways: changed claims/contracts → current producer/reader/direct consumers; affected consumers → requirements. Inspect supplied implementation/tests, not only names/declarations/victory summaries. Missing edges/source mean unknown, not absence.
3. Seek packet counterevidence: call sites, base behavior, exceptions, bad-input results/repairs. Separate fact/inference, scope drift/contradictions. Report precise supported defects/consequences; contract-external observations stay minor. Missing evidence is not pass.

For repeated failure, identify the shared assumption, a packet fact that could falsify it, and compare compensating again with removing that assumption. Equal hashes under different required keys cannot establish distinct roles; independent roles with unreadable files instead require transport investigation. Missing history stays incomplete; invent no counts, quota or census.

For architectural changes, investigate Shallow module, Information leakage, Temporal decomposition, Pass-through method, Split ownership, Two ways to do one task, Importable internals and Hand-synced list. For each retain evidence, no evidence or inapplicability; labels are leads, not findings or grounds to reject approved Phases. Compare ownership/writers, wire exposure, change surface and failure preservation of structurally different alternatives. Renames/identical wrappers do not qualify. Source proves no opportunity; missing source means unknown. Reuse this task's one architecture opportunity; add no interface/review round.

For tests/checks/escalation, host supplies the complete `workflows/verify-code/SKILL.md`「测试充分性与检查可信度」. Apply its positive/negative inputs; missing text is missing source, not permission to leave the packet.

## Evidence handling

Only use the packet under its protocol/tool boundary. Missing/unreadable evidence stays unavailable/unknown. Check non-symbol edges: JSON keys, wire representations, current configuration and downstream readers; explain inapplicable DB/cross-language edges. Prove one or two relevant safety claims through the existing owner and bad inputs. Grep/line anchors or plausible reasoning alone are unproven; distinguish established risk, excluded risk and unproven assumptions. Do not add `evidence_level` or finding fields.

Material roles, actual identity/route, coverage and the three conditions for an opinion follow `skills/wh-review/SKILL.md`「输出和失败边界」. Blind/reveal and conditional arena follow the supplied full provider protocol. Shared simplicity findings use `skills/simplicity-guard/SKILL.md`, not another rule set.

Finding fields: `severity`, `path`, optional `line`, `issue`, `root_cause`, `recommendation`, `evidence_kind`, `evidence`. Do not add `axis`, `visibility`, `anchor`, `consequence`, or `correction` fields.

## Result

Return exactly one JSON object: `{ "findings": [...] }`. Use packet paths/true lines in allowed fields. Do not return `verdict`, `summary`, checklist fields or a second object.

## 写作

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md`「技能写作规范（WR001）」；保步骤、条件、权限、失败强度和受保护字面，缺源报 unavailable，不复制规范。

完整来源权威：[catalog条目](../catalog.yaml#skills.review)；正文/小卡是非权威线索，单副本缺catalog时向来源维护者取登记。来源：garrytan/gstack review/SKILL.md。

## 同仓方法依赖

`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`skills/spec-specify/SKILL.md`；按上述条件提供可读原件。
