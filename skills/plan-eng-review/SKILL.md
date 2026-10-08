---
name: plan-eng-review
description: Report-only engineering-plan lens for sequencing, boundaries, failure modes, and verification.
kind: sub-skill
---

# plan-eng-review

Source: adapted from the project engineering review baseline. Mode: `advisory`, file-only.
Read the engineering draft during build-plan and return anchored observations for the existing wh-review merged document review. The caller supplies the allowed materials; this lens is read in that review, not a runner, separate provider invocation or work permit. Its presence does not establish that a stage consumer has loaded it.

## Required material

Review the current accepted specification, its global implementation design, all available Phase drafts and their task cards. In post tasks, engineering authorities are `spec.md` and `phases/P<n>.md`; `phases/index.md` only points to them. A draft index may be absent while cards are being authored; disclose this instead of inventing tasks. Historical plan/tasks remain read-only background. A provider pass does not supply missing engineering evidence.

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
   (a) 真实来源/生产者未核实 — every requirement row cites a real
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
   (h) 来源或适用范围缺失 — every downstream artifact has a readable source, applicable version when needed, and honest coverage limits.
   (i) 规模未知 — scale/range facts are stated, or explicitly `unknown` with an
       owner and a handling stage.
   Source reconciliation: walk the original-requirement list row by row; every
   R/FR/AC row must map to a concrete Task or carry an explicit
   not-doing/deferral reason with owner. Silent disappearance is a finding
   regardless of how good the written plan is.

10. 加删同价的读数（report-only）：对每条 finding 标注**删除类**（删代码/删文件/删任务/删材料）
    或非删除类，并在结果里报出两个条数；只报数，**不设配额**、不要求「删够多少」，
    也不许为凑数把正常删除写成 finding。规模读数直接引用既有反膨胀预算
    （`tools/architecture/complexity-report.mjs` 的 `budget()` 与
    `tests/contract/repository-inventory.test.mjs` 的 baseline / waiver），
    本技能不新写规模规则、不新增 gate，也不新增字段或计数产物。

## Result

Return anchored findings, affected FR/AC/task IDs, engineering consequence, and
the smallest corrective action to `wh-review`. Put IDs, consequences, corrective
actions and deletion-class labels in genuine finding prose; return only the
existing provider-protocol fields in one findings JSON. The host derives the
deleting / non-deleting finding totals from that JSON and reports both in its
existing presentation, including 0 / 0 for an empty findings array. Preserve
Check 10’s deletion categories; create neither extra protocol fields, invented
findings nor a separate count artifact. Never emit a separate pass, revise
decision, provider call, or stage result.

## 写作

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；保原步骤、条件、权限、失败强度和受保护字面，缺源如实 unavailable，不复制规范。
