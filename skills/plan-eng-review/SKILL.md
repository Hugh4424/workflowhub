---
name: plan-eng-review
description: Report-only engineering-plan lens for sequencing, boundaries, failure modes, and verification.
kind: sub-skill
---

# plan-eng-review

Source: adapted from the project engineering review baseline. Mode:
`advisory`, file-only, no stage result and no provider verdict. build-plan calls
it directly after the plan draft and before test routing; wh-review only reads
the resulting fact and remains the sole independent provider review authority.
It remains a lens-only observation source, not a runner or progression gate.

## Required material

Review the accepted specification, the complete draft plan, and any available
early task outline for the same frozen snapshot. At this point `tasks.md` may
not exist yet because this skill intentionally runs before `test-routing-advisor`
and `spec-tasks`; missing tasks are therefore an expected stage-order fact, not
a reason to invent task details. Do not accept a provider pass as a replacement
for missing plan evidence.

## Check

1. Map requirements to discrete tasks and objective verification.
2. Validate module ownership and boundary direction against Code Anchors and the
   declared reuse → extend → new decision.
3. Check every changed interface, function signature, CLI, event, and schema
   against an exact current anchor and an explicit consumer.
4. Trace state transitions and data flow, including invalid transitions,
   concurrency assumptions, and fail-loud behavior.
5. Check task dependency order, file ownership, and whether every parallel
   `[P]` claim has independent inputs and non-overlapping files.
6. Check every behavior change has an implementation-before RED and a
   post-implementation GREEN with an exact executable command, expected exit,
   evidence path, and observable oracle. Reject placeholder or default full
   suite commands.

6a. 对每一条预写红测，问三句并把答案写进 finding 的 prose：
    (a) 它是**因目标行为**失败的吗——失败的断言名指向本 Task 要改的那个行为？
    (b) 它是夹具/环境/收集失败吗（缺少依赖、路径不存在、配置未建、collect error）？——这类**不是 RED**，只能记 `unavailable`。
    (c) 它本来就通过吗——那不是红测，是既存行为的现状证据，不能计入本阶段 RED。
    三类分不清时按 `unavailable` 处理。禁止把「命令返回非零」当作 RED。
7. Identify failure modes, rollback/recovery boundaries, irreversible actions,
   and whether rollback preserves accepted artifacts.
8. Check implementation effect: the planned consumer must actually use the new
   contract; schema parsing or file presence alone is not proof.

9. Omission-class sweep: quality checks above assume the plan contains
   everything it should; this check looks for what is MISSING. Walk all nine
   historical omission classes and answer each explicitly — anchored evidence,
   `none_observed` with what was compared, or `not_checked`. A skipped class
   is itself a finding:
   (a) 真实来源/生产者未认证 — every requirement row cites an authenticated
       source; a requirement with no real source is a finding.
   (b) 真实消费者/入口不存在 — every named consumer/entry point is verified to
       exist and to actually read the declared interface.
   (c) 验收场景/业务 oracle 缺失 — every behavior change carries a concrete
       scenario and a named oracle, not a restated intention.
   (d) 预写测试/冻结断言与实现冲突 — prewritten tests and frozen assertions do
       not contradict the planned implementation.
   (e) 受保护写面/跨卡授权未定 — every protected write surface has an owner and
       a stated authorization boundary.
   (f) 材料字段与语义不足 — material fields carry the semantics their consumers
       need; missing semantics are named, not assumed.
   (g) 读回/负控/隐藏失败边界 — readback and negative controls exist where a
       failure could stay silent.
   (h) 版本·身份·绑定缺失 — versions, identities, and evidence bindings are
       declared for every artifact a downstream stage must trust.
   (i) 规模未知 — scale/range facts are stated, or explicitly `unknown` with an
       owner and a handling stage.
   Reconciliation gate: walk the original-requirement list row by row; every
   R/FR/AC row must map to a concrete Task or carry an explicit
   not-doing/deferral reason with owner. Silent disappearance is a finding
   regardless of how good the written plan is.

## Result

Return anchored findings, affected FR/AC/task IDs, engineering consequence, and
the smallest corrective action to `wh-review`. Never emit a separate pass,
revise decision, provider call, or stage result.
