# Scope-revision review contract

This contract is for one temporary mid-task requirement revision raised during
`build-code` or `verify-code`. It is a review mode on the existing wh-review
route, not a new WorkflowHub stage, task, provider configuration, gate, ledger,
successor, reopen, or completion state.

The packet contains:

- `requirements/scope-revision.json` — the request, decision, affected IDs,
  impact matrix, risks, deferrals, and Constitution checks;
- `requirements/scope-revision/decision_log.md` — 受影响段落摘录；原文件路径、大小和 SHA-256
  在 `scope-revision.json` 中绑定；
- `requirements/scope-revision/spec.md` — 受影响段落摘录；
- `requirements/scope-revision/plan.md` — 受影响段落摘录；
- `requirements/scope-revision/tasks.md` — 受影响段落摘录。

这些不是四份材料的第二份副本。packet 只交付临时 revision 和直接影响所需的 bounded
excerpt；每个 excerpt 必须绑定对应当前原文件的 `source_path`、`source_bytes` 和
`source_sha256`，总 packet 超过 330 KiB 必须在 provider 调用前返回
`MATERIAL_INCOMPLETE`。

Judge these questions:

1. Is the temporary request real and understandable, or is it an accidental
   expansion caused by implementation wording?
2. Does the choice serve the current task's core goal and preserve the
   original scope/non-goals?
3. Do the four current materials agree on affected requirements, decisions,
   FR/AC/tasks, user flow, data/state, success/failure boundaries, and the
   return stage?
4. Are implementation, tests, review, delivery, risk, deferral, and
   Constitution impacts all accounted for?
5. Is the smallest same-task implementation path chosen, without inventing a
   second control plane or hiding unavailable evidence?
6. Does the consumer coverage account for the four current materials plus
   acceptance, implementation, tests, review, and delivery?
7. Does the communication record prove that Talk, Clarify, and Grill were done
   by the main agent and that the user response was not inferred from a
   sub-agent?

Do not judge whether the code already passes. Do not replace the normal
`build-code` or `verify-code` review. Do not request a second review merely
because the verdict is `revise_required`, `unavailable`, timeout, or a protocol
failure. Return findings only for concrete design/impact problems in this
temporary revision. The parent agent must preserve the original verdict and
then record a disposition for every finding.

Return only the standard reviewer JSON object with `verdict`, `summary`, and
`findings`. Findings must use the standard severity and anchor rules; an
unanchored major/blocking concern needs corroboration or remains a quality
fact rather than a gate.
