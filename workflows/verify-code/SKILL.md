---
name: verify-code
description: Independently verify the current implementation, then present a verification conclusion for user confirmation.
version: 3.0.0
---

# Verify Code

## Purpose

Verify the current implementation independently. This stage does not repair
code, rewrite task materials, or turn historical records into permission to
proceed.

## What allows work to start

Read the current `decision-log.md`, `spec.md`, `plan.md`, and `tasks.md` in the
same task. All four must exist and be readable. If one is missing or unreadable,
name it and stop this verification attempt.

Historical results, reviews, run history, branch history, and runner history
are read-only audit context. They never block a new verification attempt and
never prove the current implementation correct.

## 原始需求回放

先做一张精简的反向回放表，再做 AC 判断。至少覆盖：

- 原始 `R*/F*/D*` 关系、五份报告需求点和 `INC-001` 到 `INC-015`；
- 每项对应的当前 Design（FR/AC）、plan/task、证据引用、当前 snapshot 和
  provenance；
- 完整用户流程：入口、关键页面/操作、数据与状态变化、成功结果、失败/恢复
  结果，以及用户最终能看到什么；
- 每项的真实状态：`pass`、`fail`、`unknown`、`deferred` 或 `unavailable`。

回放必须反向从原始需求开始核对 Design、实现、测试和用户结果，不能只从
spec/AC 往回推。原始需求没有对应 Design、任务、证据、用户流程或 provenance
时，保留具体缺口并记为 `unknown`/`deferred`；证据缺失不能算 pass。把“未实现”、
“延期”和“暂时无法验证”分开，不得用聚合测试绿替代逐项回放。

R3 的研究事实还必须绑定 `quality/tests/research.json` 及其期望 sha256
`422f4044bfc68952c8ca917057e6930e51f7825943b49a0727e1b2936457ffe0`；文件缺失、
哈希不匹配或 receipt 不可读时，只能记录 `unknown/incomplete`，不能把研究完成
或测试通过当成替代证据。

正式 verification receipt 的 `requirement_replay` 必须按上述原始来源逐项
记录 `source_id`、真实状态、当前 `snapshot_tree`、关联的 `linked_ids`（Design/任务 ID）、
canonical `evidence_refs` 和简短理由。`pass` 必须有证据；`fail`、`unknown`、
`unavailable` 必须继续显示为未解决，`deferred` 只能用于明确的非目标/延期项。
这份回放是当前 verify-code 的事实，不另造需求台账或推进门槛。

## Independent verification

1. Read the four current materials and identify the planned work, acceptance
   criteria, open risks, and the completion rows in `tasks.md`.
2. Inspect the current implementation and diff. Independently compare it with
   the current materials. Do not trust an earlier builder summary.
3. Check for a current passing full-suite receipt first. It is reusable only
   when its source/test-contract digest and observed snapshot match the
   current candidate. If it matches, consume the receipt and do not run the
   suite again. Otherwise, record the complete-test fact as passed, failed, or
   unknown when it is actually available. A stale or missing receipt is a
   visible quality warning, not a reason to stop stage progression or return to
   build-code. Focused tests belong to build-code.
   The current complete test command and its observed snapshot are the only
   basis for the final verification test fact.
   Do not rerun the full suite because of a material-only edit, task-row
   completion, evidence synchronization, review unavailability, or handoff
   formatting. After a failed suite, run only affected tests while repairing;
   a new full suite requires a changed production/test-contract candidate and
   a new final verification boundary.
4. Check every applicable acceptance criterion against observed evidence.
   State `pass`, `fail`, or `unknown` for each one; do not infer coverage from
   an aggregate green test run.
   Every AC must have its own observable scenario, oracle, actual outcome, named
   implementation/test anchor, and stated coverage limit. Repeating only
   “npm test passed” or one shared implementation receipt is not AC evidence;
   if the result is not specific, keep it `unknown/incomplete`.
   `context_map` and `evidence_map` marked `complete` must cover every AC they
   claim to support with complete, readable anchors. If this is a CLI/runtime
   task with no browser surface, record `browser_qa=not_applicable` and why;
   UI-scope work must include real isolated browser evidence.
5. Run one independent `wh-review` semantic/code review over the frozen current packet:
   four materials, current diff, test results, AC evidence, and open risks.
   Record the returned verdict and findings exactly. If the provider is
   unavailable, record `unavailable`; do not invent a pass or substitute an
   unrequested provider.
6. Before handoff, the main agent must inspect every review finding and record
   its disposition: `fixed`, `rejected_invalid`, `accepted_risk`, or
   `needs_human`. A valid implementation finding returns to the same current
   build-code Task for repair; it does not become a new task. An unresolved
   serious finding needs exact risk acceptance, while the original verdict
   remains unchanged. A review that is unavailable or invalid gets an explicit
   incomplete disposition; it is never silently skipped.
7. Produce a short verification summary: current snapshot, tests, per-AC result,
   review result, unresolved risks, and a clear overall conclusion. Keep stage
   progression and the formal acceptance conclusion separate.

Review is a quality fact, not a license to claim completion. The disposition
step is required for an honest handoff, but it is not a hidden quality gate:
normal same-task repair and progression remain possible while quality is
incomplete. An
authenticated actionable major/blocking finding must be repaired, or the user
must explicitly accept that specific risk before the conclusion can claim the
work is accepted. Ordinary findings, invalid output, timeout, and unavailable
review remain visible facts; they do not create a repair gate or a new task.
If either review is unavailable, show its canonical review attempt and exact
terminal reason. It remains a visible incomplete quality fact, never a pass and
never a reason to replay build-code, invent a fallback record, or block normal
repair. Historical provider output may be cited only as audit context.

## Lightweight scope revision from verify-code

If verification shows that the original requirement, user flow/result, FR/AC,
data/state boundary, success/failure boundary, non-goal, or delivery plan is
wrong or incomplete, do not silently patch the implementation or start the full
five-stage scope-revision loop. The main agent must Talk/Clarify/Grill with the
user directly; these communication skills must never be delegated to a child
agent.

Keep the same task and update the four current materials together:

1. `decision-log.md` records the temporary request, choice, core-goal relation,
   affected IDs, risks and deferred handoff;
2. `spec.md` records affected flow, data/state, success/failure, FR/AC and
   non-goals;
3. `plan.md` records implementation, dependency, test, review and delivery
   impact;
4. `tasks.md` records the bounded same-task change and its checks.

Then run one wh-review `scope_revision` packet. Its dedicated prompt/contract
reviews the temporary change in the context of the whole task: goal alignment,
four-material consistency, affected implementation/test/review/delivery scope,
risk, deferral and Constitution compliance. It does not decide whether code
already passes. `pass`, `revise_required`, `unavailable`, timeout and protocol
failure remain facts; do not repeat the review until `pass`. The main agent
analyzes each finding once and records its disposition, then returns to the
affected build-code or verify-code work. No successor, reopen, new ledger,
provider configuration or public stage is created.

## Verdict and handoff

- **Pass candidate**: the current implementation matches the four materials,
  the current complete test suite is green, every applicable AC is `pass`, and the independent
  review has no unresolved actionable major/blocking finding.
- **Fail or unknown**: record the exact fail/unknown evidence as a quality
  warning. Continue the same task according to the current `plan.md` and
  `tasks.md`; only an explicit user decision about formal acceptance changes
  the final conclusion.

Before asking for the verify-code conclusion, explain in plain language what
was checked, what passed, what did not, and what remains unknown. The user must
see this handoff summary before any later confirmation or close action.

Do not create another task or any historical-evidence progression mechanism.
Historical evidence remains audit-only. A failure never authorizes close
operations.

## Confirmation and close

Present the summary to the user for the normal verify-code confirmation. The
user confirmation accepts only this verification conclusion; it does not
authorize commit, push, merge, archive, worktree cleanup, branch deletion, or
any other irreversible action. Obtain separate explicit authorization before
each requested close operation.

## Keep it simple

Use the smallest direct check that answers a real acceptance question. Do not
add schemas, gates, retry loops, provider rounds, or automation merely to make
the process machine-checkable. Before adding a mechanism, answer:

1. What real threat does this defend against?
2. Does any existing mechanism already cover it?
3. Can it be bypassed?
4. What is the long-term maintenance cost?

If the mechanism is not justified by a real observed problem, do not add it.
