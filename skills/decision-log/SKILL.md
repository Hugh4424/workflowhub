---
name: decision-log
description: Converge all make-decision inputs into a structured decision log, producing the single authoritative requirement source for all downstream phases.
---

<!-- component skill — physically independent, can be invoked independently by foreman or subagent -->
<!-- source/origin: external-adapted; source path: packages/core/agenthub/skills/decision-log/SKILL.md -->

# decision-log

This is a **component skill**. It does NOT produce its own `stage-result`. The calling collector or foreman is responsible for writing all stage-level records. This skill produces only the decision-log artifact that the caller consumes.

## Goal

Read all make-decision inputs (original requirement text, upstream conversations, direction-confirmation exchanges) and converge them into a single structured decision log file `tasks/<task-id>/decision-log.md`. This file becomes the **sole authoritative requirement source** for all downstream phases (build-spec / build-plan / build-code / verify-code). Downstream phases do not re-read the raw make-decision inputs — decision-log already captures every load-bearing claim and its reasoning chain.

## Input

- Requirement text, user story, or original-context content (from `make-decision` or direct user input).
- Any upstream conversation records (talk-with-zhipeng, grill-with-docs-lite, direction-confirmation exchanges) relevant to the current task.

## Output — artifact file

Produce `tasks/<task-id>/decision-log.md` with exactly **7 sections** in this order:

1. **原始需求（原文）** — verbatim user requirement text, covering all approval rounds (not only the first message).
2. **问题与目标** — the core problem being solved and the explicit goal for this change.
3. **决策记录** — one entry per decision. Each entry MUST carry a non-empty `来源证据` field:
   - `来源类型`: one of `原文要求` / `衍生` / `新增`
   - `来源证据`: verbatim quote (for `原文要求`) OR full reasoning chain (for `衍生`) OR attribution (for `新增`)
   - `用户批准`: yes / no / pending
   - **Dead rule**: decisions with `来源类型=新增` AND `用户批准=否` MUST NOT appear in any FR in the spec; they belong only in section 6 (开放问题) or section 7 (明确不做).
   - **Conflict rule**: later clarifications override earlier ones. Keep the earlier text but mark it `superseded` and cite the overriding approval.
   - **权威定义表**（新增子节，附属于第 3 节）: table of `字段/路径/命名 → 值 → 唯一来源文件`. Any field/path/name expected to be reused by multiple downstream artifacts MUST have exactly one row here. If a later spec/plan re-defines the same concept differently, that re-definition is a decision-log violation and must be rejected (打回), not silently reconciled.
   - **外部依赖接口核实记录**（新增子节，附属于第 3 节）: for every decision that involves calling an external script/tool, the entry MUST state "已读取目标工具真实 CLI/源码，接口为 XXX" with the concrete interface description. Writing only "计划调用 XXX" (a plan/intent, not a verified fact) is insufficient and MUST be treated as an open item, not a settled decision.
4. **假设** — explicit assumptions made that are not stated in the requirement.
5. **明确不做** — items explicitly excluded from this change, with a brief reason each.
6. **开放问题** — items still ambiguous or awaiting user approval.
7. **验收标准** — acceptance criteria that can be verified after implementation.

At least one decision record in section 3 MUST carry a non-empty `来源证据` entry. A decision-log with zero source evidence is invalid.

## What to do

1. Collect all make-decision input sources listed above.
2. For each decision or constraint identified, classify it (`原文要求` / `衍生` / `新增`) and record the evidence.
3. Resolve ambiguous items: ask ONE focused question per item; do not assume.
4. Write the 7-section `tasks/<task-id>/decision-log.md` file.
5. Do NOT expand scope beyond what the inputs explicitly authorise (YAGNI).
6. **落盘后存在性自检**: after issuing the write, actually verify the file exists at the expected path (e.g. grep/stat the real path) before treating this step as done. Having "executed a write command" is NOT sufficient evidence of completion — confirm the artifact is really on disk at the expected location.

## "agenthub-clean" requirement

This skill is a **pure prompt** — no runtime entry point, no executable code, no agenthub-internal coupling. It must remain invocable by any foreman or subagent without any harness dependency.

## Metric record — caller responsibility

This skill does NOT write its own `stage-result`. The calling collector MUST write ONE independent metric record with `"stage": "decision-log"` (never `"make-decision"`). Use `metrics/collector.mjs` — do not hand-write a raw jsonl line.

Call `recordSkeleton` at invocation start and `updateOwnResult` at completion, passing at minimum:

```json
{
  "execution_id": "<uuid>",
  "skill_or_stage": "decision-log",
  "stage": "decision-log",
  "skill_version": "1.0.0",
  "executed": true,
  "tokens": null,
  "duration_ms": null,
  "rework_rounds": 0,
  "human_intervention": false,
  "friction_ref": null
}
```

These are the M4 record-schema core fields (`execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`). Use `metrics/collector.mjs` — do not hand-write a raw jsonl line with only `skill/stage/event/ts`.
