# build-prd review contract

This is one dedicated non-stage review of a complete `build-prd` PRD. It is a
report/provider-fact surface, not a formal stage and not a completion gate.
本次只执行一次完整 PRD 审查；它不是第五 formal stage，也不创建 canonical stage attempt/result。

## Review identity

- The review kind is `build_prd` and the surface is `build-prd`.
- `build-prd` is a top-level sibling under `non_stage`; it is not in the five
  formal stages, `REVIEW_STAGES`, or any canonical stage attempt/result.
- The caller submits one complete PRD packet. The packet must not masquerade as
  `build-plan` by substituting `approved_spec`, `draft_plan`, `draft_tasks`, or
  a code diff.
- The existing heterologous broker makes one group request. The caller keeps
  provider identities, transport outcomes, partial coverage, and unavailable
  errors as facts. No second review flow, retry-for-clean-findings loop, or
  quality gate is created here.

## Required packet materials

The provider-visible bundle contains only the complete PRD review surface:

- `decision_log`: the frozen parent decision and source binding.
- `prd`: the complete current PRD body, including the appendix B decision
  coverage table（附录 B 决策覆盖表）.
- `task_map`: the result-oriented task map and card ownership/dependencies.
- `design_facts`: applicable UI/non-UI and design confirmation facts, including
  an explicit unavailable or not-applicable state when relevant.
- `quality_facts`: existing review, coverage, and quality limitations. These are
  facts to inspect, not a pass signal.
- `review-instructions.md`: the fixed instructions generated for this surface.

`raw_requirement` is optional on this surface: it is not in `required`. When it is
provided, it must be the original requirement text (the PRD card's original text
or the user's own words), not a summary and not a substitute for `prd`; the
reviewer checks the PRD coverage against that original text. When it is absent,
the reviewer records the coverage limit in evidence and writes a finding that
the original requirement could not be verified; it must not infer the original
requirement from the PRD itself. 缺原文或只给摘要时，PRD 覆盖判定记 `incomplete`，
不记 `pass`。把该键升为 `required` 需先有真实生产者，当前不设硬门。

Optional source, confirmation, delivery, analyze, reflection, and bounded map
facts may be supplied only when declared by the material matrix. `source_facts`
stays optional in the matrix, but its content is mandatory when the PRD replaces
an old file: 替换旧件时 `source_facts` 必含旧件全文、调研三类事实（已知／未知／冲突，各带来源）
与风险事实；只给摘要或节选不算提供旧件。The appendix B decision coverage table still
travels with `prd`. A review that lacks the old file records `incomplete` for
old-file fidelity instead of writing `pass`; 缺旧件或只给摘要记 `incomplete`，不写 `pass`，
也不得声称覆盖完整。
Build-plan materials, engineering task rows, changes/diff, and canonical stage evidence
are forbidden on this surface.

## Review focus

Review in this order: complete PRD coverage and task ownership, user result and
card boundaries, dependencies and handoff, applicable design/source facts,
acceptance and failure criteria, old-file fidelity when the PRD replaces an old
file, and unnecessary scope. Coverage is checked by sampling the appendix B
decision coverage table against the cards (覆盖抽读), not by reading only the
new file; 旧件保真 compares the old file's thresholds, negations, and failure
boundaries with the new cards. `simplicity-guard`,
product-direction, and applicable design lenses are one packet-level lens set;
they are not extra provider calls. Findings must be concrete and anchored to
the submitted bundle.

## Debate, analysis, and reflection

Only a substantive product-direction disagreement may be proposed for debate;
ordinary corrections and implementation disagreements do not trigger debate.
Debate is bounded to at most 2 rounds (two rounds maximum) and an unresolved issue remains
`needs_human`. Consistency analysis and end reflection are report-only facts;
they do not invoke another provider review, create a second flow, or become a
gate. A review with no findings is advice, not planning completion.

## Failure and provenance

`unavailable`, `partial`, provider failure, transport failure, missing material,
and coverage limits remain visible with their original provider/error facts.
They must never be rewritten as `pass`, empty findings, or a canonical stage
completion. This implementation returns the provider fact/report only; the
existing canonical attempt/result schemas and record route intentionally do not
persist `build_prd` as a formal stage.

Return exactly one findings JSON object when a provider responds. Do not emit a
verdict, summary, pass/fail label, checklist, or second JSON object.
