---
name: make-decision
description: Clarify a real product direction through Talk, proportionate research, independent review, and user confirmation.
version: 3.0.0
---

# Make Decision

## Purpose

Turn the original requirement into one readable, user-confirmed direction. The
result must state the problem, scope, non-goals, success criteria, important
trade-offs, risks, and unresolved items. It creates the first current material:
`decision-log.md`.

## Working rule

The current materials are the source of truth:

1. `decision-log.md`
2. `spec.md`
3. `plan.md`
4. `tasks.md`

At this stage, author the decision log from the original requirement and current
facts. Later stages may revise it in the same task. Old accepted records,
receipts, reviews, snapshots, generations, worktrees, and runner
history are read-only audit records. They never license or block ordinary work.

Keep three questions separate:

- Can work continue? Read the current materials and fix or extend them.
- Can a formal record be published? Its current task, workspace, runtime, and
  declared write set must be structurally authentic; fail loudly if not.
- Can this stage be called complete? Its real Talk, needed research, independent
  review (or real `unavailable`), user confirmation, and handoff must exist.

## Runtime boundary

Use only the launcher-supplied `StageContext`. Do not infer task identity from
cwd, Git, branch, issue number, or directory scanning. `make-decision` alone
may call `prepare` to create or validate the authenticated CandidateWorkspace;
that is a write-boundary check, not a historical-progress gate.

The launcher owns paths, TaskKernel records, execution identity, and metrics.
Use `ctx.kernel` for records and `ctx.candidateWorkspace` only for permitted
product files. Do not copy runner files into the target repository or pass
`--runner-root`. Caller-owned temporary inputs stay under an OS temporary
directory; canonical records stay TaskKernel-owned.

The current public sequence is `run`, `confirm`, then `authorize` when an
irreversible operation needs authorization. There is no public `prepare`,
`start-run`, or accepted-result writer. `confirm` must contain a real human answer.
A rejected confirmation is an honest result; preserve it and revise the
current material if needed.

## Procedure

1. Read the original requirement and current facts. Run the stage preflight and
   publish only the current decision facts and quality facts.
2. Run real `talk-with-zhipeng` conversation(s). Ask only questions whose
   answers could change direction. Do not invent user answers. Finish when
   direction-changing ambiguity is resolved or explicitly recorded.
3. Research only when it can materially change the direction and is authorized.
   Use a frozen, non-sensitive request. Otherwise record a clear skip reason.
   Report the few findings that changed scope, constraints, or risk.
4. Run `grill-with-docs` after Talk Round 3 to check the current domain and
   documentation facts before drafting the decision record.
5. Draft `decision-log.md`. For every load-bearing decision, record its source,
   facts and constraints, choice and rationale, affected scope, consequences,
   risks, rejected alternatives, non-goals, and unresolved items. Use plain
   language and update `CONTEXT.md` or an ADR only when that documentation is
   genuinely needed.
6. Run independent review through `wh-review`. The direction track receives a
   blind packet: requirement, objective facts, constraints, and non-goals only.
   The detail track reviews the current decision material. Record the actual
   result as returned: `unavailable`, failure, or a finding is never `pass`.
7. Address valid findings in the same task. Repair them, reject invalid ones
   with evidence, or let the user explicitly accept a concrete risk. A finding
   never requires a new task or repeat review solely to manufacture a pass. If
   the current material changes,
   update it and run only the review or check genuinely affected by that change.
8. Publish the current decision receipt and facts using the runtime's declared
   schema. Publication must reject wrong task/workspace/runtime bindings,
   mismatched content, or false execution identity. Missing historical evidence
   is disclosed as audit debt, not used to prevent work.
9. Present a short decision card: direction, scope, non-goals, success criteria,
   main risks, review facts, and unresolved items. Ask for explicit accept or
   reject and record the real answer with `confirm`; use `authorize` only for
   a separately authorized irreversible operation.

## Review and quality

`wh-review` is the only review-provider owner. Review is independent quality
evidence, not an automatic pass gate. Major or blocking actionable findings
require one real user choice: repair first (recommended) or accept the stated
risk. The latter keeps the original verdict and never excuses structural
publication errors.

Do not claim completion until all declared components have actually run (or a
conditional one has a recorded skip reason), the review fact is real, and the
user confirmation and handoff are real. Completion is distinct from commit,
push, merge, archive, or cleanup; those need separate authorization.

## Communication and handoff

Use the user's language and concise plain-language cards. Talk questions offer
2–3 meaningful choices only when a user decision is needed. Review cards name
the subject, actual providers, verdict, important findings, intended
disposition, and next step. Keep paths, hashes, refs, and commands in formal
records.

Report completion through the runtime-owned renderer and `skill-deps.yaml`:
every always component is `executed`; every conditional component is `executed`
or `trigger=false — reason`. Do not invent a parallel completion state machine.

## Metrics

Use only the launcher-issued metrics capability. Record entry and exit; metric
write failures are warnings and must not fabricate success.
