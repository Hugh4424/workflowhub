---
name: build-plan
description: Break the spec into an ordered implementation plan and a task list that developers can execute phase by phase. v1 upgraded: orchestrates spec-plan, spec-tasks, spec-analyze sub-skills, performs constitution compliance check (21 clauses), M10 baseline comparison (5 metrics), and includes a human review checkpoint before stage-result.
---

# build-plan

## Goal

Take the spec from `build-spec` and decompose it into a concrete plan (`plan.md`) and a sequenced task list (`tasks.md`). The plan is the bridge between requirements and code.

v1 upgrade: orchestrates three sub-skills (spec-plan, spec-tasks, spec-analyze) adapted from speckit-plan/speckit-tasks/speckit-analyze, adds constitution compliance check against `constitution-checklist.md` (21 clauses), M10 baseline comparison (5 metrics), and a human review checkpoint before producing stage-result.

## What to do

The v1 build-plan workflow executes the following steps sequentially. Generation steps (Steps 0, 2-7, 9-10: spec-research, data-contracts, spec-plan, spec-tasks, spec-analyze, constitution check, baseline comparison, F10 gate, plan-reviewer, file identification) must complete before moving to the next. Failure in any generation step before the stage-result write results in stage failure (non-zero exit, no success stage-result), with the exception of spec-research, data-contracts, and plan-reviewer failures, which are recorded and escalated non-blocking.

The human review checkpoint (Step 8) is distinct: in non-interactive environments, on explicit skip, or on timeout, `review.state="pending"` is a valid terminal state — stage-result is produced normally. "Pending" is NOT a stage failure.

### Step 0: Call spec-research sub-skill

Call the `spec-research` skill located at `skills/spec-research/SKILL.md`:
- Pass the explicit `task-id` parameter and a concise `feature_desc` summarising the feature goal.
- spec-research calls `core/task-dir-parser.mjs` to locate the task directory, then writes `specs/{task-id}/research.md`
- If `skip_research: true` is provided with a `skip_reason`, record the reason and continue; do not treat skip as failure
- If spec-research fails, **record the failure and escalate to human** (non-blocking) — do not hard-stop the pipeline. The build-plan stage continues, but the missing research.md must be acknowledged in stage-result `facts.research_ref` or `missing_items`
- Reference the research output path in stage-result `facts.research_ref` when it exists

### Step 1: Read upstream inputs

Read the spec from upstream `build-spec`:
- `specs/{task-id}/spec.md` — the authoritative feature specification
- If the spec does not exist, fail with clear error: "spec not found at specs/{task-id}/spec.md"
- Read the decision log from the task directory for any constraints the spec may not capture.

**task_dir parser (AC-16)**: Before reading any task-tracking file, call `core/task-dir-parser.mjs` to obtain the base path. Do not hard-code `tasks/{task-id}/`.

```javascript
// AC-16 consumable call — grep: parseTaskDir
import { parseTaskDir } from "./core/task-dir-parser.mjs";
const taskDir = parseTaskDir(); // reads config/workflowhub.yaml task_dir, falls back to ~/Knowledge/workflowhub/
```

The `task-id` must be explicitly provided. If missing, fail with "task-id required" and non-zero exit. No git branch inference fallback.

### Step 1.5: Produce data-contracts

Before decomposing the spec into implementation steps, capture the data contracts that cross the feature boundary:
- Read `specs/{task-id}/spec.md` and extract every input/output schema, API surface, file format, or shared data structure mentioned
- Write a concise `specs/{task-id}/data-contracts.md` containing: (a) contract name, (b) owner side, (c) consumer side, (d) required fields/types, (e) validation rules, (f) version or compatibility notes
- If the spec contains no cross-boundary data contract, write `specs/{task-id}/data-contracts.md` with a single-line statement "No cross-boundary data contracts identified" — the file must still exist so downstream steps can rely on it
- If extraction fails or the contract is ambiguous, **record the failure and escalate to human** (non-blocking); do not block spec-plan/spec-tasks from continuing
- Reference the data-contracts path in stage-result `facts.data_contracts_ref`

### Step 2: Simplicity-guard pre-check and call spec-plan sub-skill

**Simplicity-guard pre-check**:
- Call the `simplicity-guard` skill located at `skills/simplicity-guard/SKILL.md`
- Pass the explicit `task-id` parameter and the path to `specs/{task-id}/spec.md`
- simplicity-guard evaluates reuse opportunities against existing skills/workflows and outputs a `minimal-path` field describing the smallest valid implementation path
- If simplicity-guard is unavailable, record `minimal-path: unavailable` and continue
- Use the `minimal-path` conclusion as a gating input to spec-plan: spec-plan must not introduce new files or mechanisms that contradict the minimal path without documenting the override rationale

**Call spec-plan sub-skill**:
- Call the `spec-plan` skill located at `skills/spec-plan/SKILL.md`
- Pass the explicit `task-id` parameter
- spec-plan reads `specs/{task-id}/spec.md`, applies its built-in template (`skills/spec-plan/templates/plan-template.md`), and writes `specs/{task-id}/plan.md`
- The generated plan.md must contain: (a) implementation steps (step-by-step what to do), (b) file list (files to create or modify), (c) acceptance mapping (each step maps to which FR/AC)
- If any required section is missing, fail: "plan.md missing required section: {section-name}"
- spec-plan does not depend on git branch, `.specify/`, or any per-project initialization

### Step 3: Call spec-tasks sub-skill

Call the `spec-tasks` skill located at `skills/spec-tasks/SKILL.md`:
- Pass the explicit `task-id` parameter and `--stage N` parameter (N is the number of stages, positive integer)
- spec-tasks reads `specs/{task-id}/spec.md` and `specs/{task-id}/plan.md`, applies its built-in template (`skills/spec-tasks/templates/tasks-template.md`), and writes `specs/{task-id}/tasks.md`
- The generated tasks.md must contain: (a) task list sorted by dependencies, (b) each task annotated with corresponding FR, (c) dependency relationships between tasks
- If spec-tasks was called with `--stage N`, tasks.md must contain stage grouping (`## Stage 1` ... `## Stage M` blocks where M <= N)
- If any required section is missing, fail: "tasks.md missing required content"
- spec-tasks does not depend on git branch or `.specify/`

### Step 4: Call spec-analyze sub-skill

Call the `spec-analyze` skill located at `skills/spec-analyze/SKILL.md`:
- Pass the explicit `task-id` parameter
- spec-analyze loads all three artifacts (`specs/{task-id}/spec.md`, `specs/{task-id}/plan.md`, `specs/{task-id}/tasks.md`) and performs a cross-file consistency scan
- Produces a read-only analysis report at `specs/{task-id}/cross-artifact-analysis.md`
- The report identifies four problem types: (a) inconsistency (FR in spec described differently in plan/tasks), (b) duplicate (same FR appears multiple times in tasks), (c) ambiguity (plan description conflicts with tasks implementation steps), (d) underdefined (plan references FR not in spec, tasks misses FR from spec)
- Each non-summary finding must contain all 5 fields: type, source_artifact, target_artifact, fr_or_task_id, line_or_anchor. Missing any field = invalid finding
- If no problems found, report writes "无一致性问题" (summary line only)
- The report is informational only — existence of findings does NOT block downstream progress
- Reference the report path in stage-result `facts.analysis_ref`

### Step 5: Constitution compliance check

Perform a constitution compliance check by reading `constitution-checklist.md` (located at the repo root). This is a non-blocking check — results are recorded but do not prevent normal completion.

**Procedure**:
1. Read `constitution-checklist.md` — 该文件含 21 条 (F1-F10, Q1-Q3, S1-S8) with pre-formatted `[ ]` checkboxes
2. For each of the 21 clauses, fill in:
   - Status: `[x]` (compliant) or `[ ]` (non-compliant)
   - Rationale (判据): a specific reason for the compliance decision, referencing actual design decisions in this plan
3. Write the filled checklist as part of the plan product (integrated into `plan.md` under a "Constitution Check" section, or as a separate constitution-check result section in stage-result)

**Completeness requirement (FR-CONSTITUTION-003)**:
- ALL 21 clauses must be present — missing any clause = incomplete output failure
- Each clause must have a status (`[x]` or `[ ]`) — no status = incomplete output failure
- Each clause must have rationale text — no rationale = incomplete output failure
- `[ ]` WITH rationale IS valid output (records non-compliance, does not block)

**不阻断语义 (FR-CONSTITUTION-002)**:
- 宪法检查结果仅记录浮现供人审查，不阻断推进
- 不达标项 (`[ ]` items) 不阻断 stage-result（status 仍可为 success）
- The check is about recording facts (Q1: 记事实而非阻断), NOT about passing a quality gate

### Step 6: M10 baseline comparison

Produce an M10 baseline comparison table with 5 metrics: missed_step_rate, test_execution_rate, review_execution_rate, rework_rounds, rework_proxy_count.

**Baseline values** (from `specs/archive/m10-baseline-switch/baseline-report.md`):
| Metric | M10 Baseline |
|---|---|
| missed_step_rate | 0.05 |
| test_execution_rate | 0.8295 |
| review_execution_rate | 1 |
| rework_rounds | 6.075 |
| rework_proxy_count | 25.25 |

**M12 values at build-plan stage** — ALL 5 values are `unknown` because:
- **missed_step_rate**: `unknown` — 仅 upstream make-decision/build-spec 两段已完成且已落盘，全五段值待 verify-code 完成后才可计算
- **test_execution_rate**: `unknown` — build-plan 阶段无测试执行数据，待 build-code/verify-code
- **review_execution_rate**: `unknown` — review 阶段尚未执行
- **rework_rounds**: `unknown` — 全流程未完成，无返工数据
- **rework_proxy_count**: `unknown` — 全流程未完成，无代理返工数据

**Delta column**: For all 5 rows, delta = `unknown` (delta is unknown when M12 values are unknown; do not fabricate direction).

**Output format**: A 5-row comparison table with 4 columns:
| 指标名 | M12 实值 | M10 baseline | delta |
|---|---|---|---|
| missed_step_rate | unknown（仅 upstream make-decision/build-spec 两段已完成且已落盘，全五段值待 verify-code 完成后才可计算） | 0.05 | unknown |
| test_execution_rate | unknown（build-plan 阶段无测试执行数据，待 build-code/verify-code） | 0.8295 | unknown |
| review_execution_rate | unknown（review 阶段尚未执行） | 1 | unknown |
| rework_rounds | unknown（全流程未完成，无返工数据） | 6.075 | unknown |
| rework_proxy_count | unknown（全流程未完成，无代理返工数据） | 25.25 | unknown |

**Rules**:
- The metric name `rework_proxy_count` MUST use this exact name — no aliases
- DO NOT use placeholder values (0, "-", "--") for unknown metrics — write `unknown` + reason. 不得使用占位值（0、-、--），不可得必写 `unknown` + 原因。
- DO NOT reference build-plan's own not-yet-written metrics, nor build-code/verify-code metrics — only upstream data (make-decision, build-spec stage-result records) is available at this stage
- Threshold is human-set (由人设定), not hardcoded in this skill
- Non-blocking: metric deviations do NOT block stage-result

### Step 7: F10 anti-over-engineering gate

For every new mechanism, validation, CI check, gate, schema, dependency, or automation proposed in the plan, answer all four questions. If you cannot answer all four, remove it from the plan.

1. **What real threat does this defend against?** — Name a specific, observed failure mode. Hypothetical threats do not justify new infrastructure.
2. **Does any existing mechanism already cover it?** — Prefer what already exists. A second mechanism for the same problem doubles the maintenance surface.
3. **Can it be bypassed, making it security-theatre?** — If the bypass is trivial, the mechanism is not protecting anything real.
4. **What is the long-term maintenance cost?** — Every task added to the plan will need to be maintained. If the cost exceeds the benefit, exclude it.

If the answer to Q1 is "none in particular" or the answer to Q4 is "high and ongoing", remove the item from the plan before finalising.

This gate reflects constitution rule F10. Cautionary example: a predecessor system accumulated ~95,000 lines of gate code, spent ~50% of commits fixing the gates themselves, and recorded over a dozen deadlocks. Plan tasks for real work, not to feed automation for its own sake.

**If F10 removes or materially alters plan/tasks entries**: re-execute Steps 2-4 (spec-plan, spec-tasks, spec-analyze) to keep cross-artifact consistency aligned with the final artifacts before proceeding to plan-reviewer and human review.

### Step 8: Plan-reviewer step

Invoke the independent plan engineering reviewer via the `3rd-review` infrastructure:
- Before calling, verify that the cross-repository path `/Users/Hugh/Hugh/Project/3rd-review/verifiers/vibecoding/` is accessible (e.g., directory exists and is readable)
- If the path is not accessible, **record `plan-eng-review.md` as unavailable and escalate to human** (non-blocking); do not block the stage
- If accessible, call the plan-reviewer with: `specs/{task-id}/plan.md`, `specs/{task-id}/tasks.md`, and `specs/{task-id}/cross-artifact-analysis.md`
- The reviewer writes `specs/{task-id}/plan-eng-review.md` with an independent engineering verdict
- If the reviewer call fails or times out, **record the failure and escalate to human** (non-blocking); stage-result still succeeds
- Reference the plan-eng-review path (or `unavailable`) in stage-result `facts.plan_review_ref`

### Step 9: 人审检查点 (Human review checkpoint)

**停顿等待人工确认 — PAUSE HERE for human review confirmation.**

This is the ONE AND ONLY human review checkpoint in the build-plan v1 workflow. The following artifacts have been produced, F10-gated, plan-reviewed, and are ready for review:

- `specs/{task-id}/plan.md`
- `specs/{task-id}/tasks.md`
- `specs/{task-id}/cross-artifact-analysis.md`
- `specs/{task-id}/research.md` (or a recorded skip reason)
- `specs/{task-id}/data-contracts.md` (or unavailable record)
- `specs/{task-id}/plan-eng-review.md` (or unavailable record)
- Constitution compliance check results (21 clauses)
- M10 baseline comparison table
- Simplicity-guard `minimal-path` conclusion

**How to handle the pause**:

- **Interactive mode** (terminal available, stdin readable): Present the artifacts to the human reviewer and prompt for: approve, reject, or skip. Wait for their response before continuing.
- **Non-interactive mode** (no terminal, stdin not readable): Record `review.state="pending"` immediately and continue. Do NOT block indefinitely.
- **Explicit skip**: If the human or runtime explicitly signals "skip", record pending and continue.
- **Timeout**: If no response is received within a reasonable time (judged by the executor, not hardcoded), record pending and continue.

`review.state="pending"` IS a valid terminal state — it records that the checkpoint was reached but confirmation was not obtained. Stage-result is produced normally with pending. "Pending" is NOT a stage failure.

**Review object** — after receiving confirmation (or resolving to pending), populate the `review` object in stage-result JSON:

```json
"review": {
  "state": "<pending|approved|rejected>",
  "reviewer": "<name or agent identifier, empty string if pending>",
  "timestamp": "<RFC3339 timestamp of confirmation, empty string if pending>",
  "decision": "<non-empty human-readable decision description>",
  "notes": "<free-text notes, can be empty string>"
}
```

**Review state rules**:
- **approved**: Human confirmed approval. `review.state="approved"`. `review.reviewer` and `review.timestamp` must be non-empty. `review.decision` describes the approval reason (e.g. "plan/tasks 产物通过、宪法检查无不符项、baseline 对照阈值符合预期"). Stage-result `status` determined by process result (can be success).
- **rejected**: Human confirmed rejection. `review.state="rejected"`. `review.reviewer` and `review.timestamp` must be non-empty. `review.decision` describes the rejection reason. Stage-result `status="failure"`, `reason` records the rejection. This is a factual record, not a blocking gate — human decides whether to re-run.
- **pending**: No human confirmation received (non-interactive environment, explicit skip, or timeout). `review.state="pending"`. `review.reviewer` and `review.timestamp` may be empty strings. `review.decision` MUST be: "检查点已触达但未获确认". `review.notes` may be empty. Stage-result is still produced normally — `pending` IS a valid state, do NOT omit stage-result because review is pending.

`review.decision` MUST be non-empty in ALL three states (pending writes the fixed string above).

### Step 10: Identify all files and modules

Identify all files and modules that will be touched by the plan. For deletions or renames, scan for every reference in code, config, tests, and docs.

Every task in tasks.md must reference at least one FR from the spec. Check the plan against any list of forbidden files before finalising.

## Produce a stage-result

When the stage is complete, write a `stage-result` record with:

```json
{
  "status": "success",
  "error_code": "",
  "retryable": false,
  "facts": {
    "plan_ref": "<relative path to plan.md>",
    "tasks": "<number of tasks or brief list of phase titles>",
    "tasks_ref": "<relative path to tasks.md>",
    "analysis_ref": "<relative path to cross-artifact-analysis.md>",
    "research_ref": "<relative path to research.md or unavailable>",
    "data_contracts_ref": "<relative path to data-contracts.md or unavailable>",
    "plan_review_ref": "<relative path to plan-eng-review.md or unavailable>",
    "minimal_path": "<simplicity-guard minimal-path conclusion or unavailable>"
  },
  "missing_items": [],
  "user_decision": false,
  "reason": "Plan and task list produced via spec-plan/spec-tasks, cross-artifact analyzed, constitution check completed, baseline comparison recorded, research/data-contracts/plan-reviewer recorded, simplicity-guard minimal-path captured, human review checkpoint cleared.",
  "review": {
    "state": "<pending|approved|rejected>",
    "reviewer": "",
    "timestamp": "",
    "decision": "检查点已触达但未获确认",
    "notes": ""
  }
}
```

**Field preservation (M6 contract — FR-BP-003, FR-SKELETON-002)**:
- `status`, `error_code`, `retryable`, `missing_items`, `user_decision`, `reason` — M6 fields, preserved unchanged
- `facts.plan_ref` — M6 field, kept
- `facts.tasks` — M6 field, kept
- `facts.tasks_ref` — v1 NEW field (points to tasks.md)
- `facts.analysis_ref` — v1 NEW field (points to cross-artifact-analysis.md)
- `facts.research_ref` — v1 NEW field (points to research.md or unavailable)
- `facts.data_contracts_ref` — v1 NEW field (points to data-contracts.md or unavailable)
- `facts.plan_review_ref` — v1 NEW field (points to plan-eng-review.md or unavailable)
- `facts.minimal_path` — v1 NEW field (simplicity-guard minimal-path conclusion or unavailable)
- `review` — v1 NEW object (with state, reviewer, timestamp, decision, notes)

Do NOT delete or rename any M6 field.

## Metrics recording

Also record a metrics entry via the collector. Call `recordSkeleton` at stage start and `updateOwnResult` at stage end, passing at minimum:

```json
{
  "execution_id": "<uuid>",
  "skill_or_stage": "build-plan",
  "stage": "build-plan",
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

## 人工放行摘要（Plain-language summary for human approval）

build-plan 所有产物完成后，在 stage-result comment 或独立文件 `{taskDir}/{task-id}/plan-summary.md` 中写一份给人看的摘要。（路径通过 `parseTaskDir` 解析，见 Step 0 AC-16 块）

**要求**：
- 用大白话中文，高中生能看懂，不用工程术语
- 控制在一页以内（400字以内）
- 结构固定，三段：
  1. **在解决什么问题**：用一两句话说清楚这个任务是要解决什么问题、为什么要做
  2. **要做什么东西**（来自 spec）：列出 2-5 个核心要求，白话描述
  3. **准备怎么做**（来自 plan）：列出实施步骤的大白话版本，几步、各步做什么
- 写完后在 stage-result 的 comment 里贴出来，供人类审阅后决定是否放行继续执行

这个摘要是人工放行的依据，必须包含，缺少则 stage 不完整。
