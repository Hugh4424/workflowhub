---
name: build-code
description: Implement each task phase using TDD, collect RED and GREEN evidence, then run one independent review per phase.
---
<!-- markdownlint-disable MD029 MD040 -->

# build-code

## Receipt wiring

Before any stage work, create shared `workflow_run_id`, `run_id`, `attempt_id`, `step_id` and call `writeEntryReceipt`. After the durable stage-result is written, call `writeExitReceipt` with the same IDs. Never emit the exit receipt before the durable result.

## Executable canonical sequence (v2)

`steps.json` is the only executable topology. For every step: emit `step_entry` with `stage_slug: "build-code"`, integer `step_id`, the shared `attempt_id`, and `manifest_schema_version: "2.0.0"`; emit exactly one paired terminal `step_exit` carrying the returned `entry_journal_entry_id`. A retry uses a new `attempt_id`; a skipped or terminal non-success outcome keeps its reason. Do not execute an unmapped label.

### Step 1 — read-plan

Load the approved plan.

### Step 2 — write-red-tests

Write a failing test.

### Step 3 — implement-change

Implement the minimal scoped change.

### Step 4 — run-green-tests

Run and capture passing tests.

### Step 5 — scan-diff

Scan the implementation diff.

### Step 6 — review-change

Obtain independent code review evidence.

### Step 7 — commit-implementation

Record the implementation commit.

### Step 8 — publish-code-result

Persist the build-code handoff.

## Legacy reference

## Goal

Implement the change described by the upstream stage-result. The upstream may be `build-plan` (full path) or `make-decision` directly (slim path — small tasks that skip design and planning). Read the upstream `stage-result` first and consume its `facts` keys to understand scope and constraints.

Each phase follows a strict RED → implement → GREEN cycle. No phase is done without both evidence files. After GREEN, wh-review returns a formal result reference for `facts.review`.

## Local skill resolution and capability boundary

调用方必须显式传入 `workflowhub_package_root`。本 stage 只读取同目录 `skill-deps.yaml`，将技能 realpath 限制在 `${workflowhub_package_root}/skills/`，并通过 `{name,resolved_skill_path,resolved_bundle_paths,bundle_hash,source_manifest,package_root}` payload 调用。禁止只传名称、HOME/cwd fallback、全局同名覆盖或远程 prompt。

本 stage 的本地技能为 `wh-review`，条件技能为 `test-routing-advisor`、`diagnosing-bugs`、`review-response`。Node、git、shell、目标项目测试命令、宿主原生 subagent 与 review provider/凭据是 runtime/external capability，不是 skill。非简单 phase 需要独立上下文；宿主不支持时 fail loud 并转人工，禁止静默 inline。测试异常、实现异常、finding 根因未知或重复修复失败时必须调用 `diagnosing-bugs`；`revise_required` 时必须调用 `review-response` 后沿同一 review continuation 重审。

## What to do

### 0. 路径解析纪律

Before reading, searching, creating, or writing any task execution record, call `core/task-record-paths.mjs` and treat the returned `task_root` as the only directory for this task's execution records. This helper calls `parseTaskDir()` internally and resolves `~/.workflowhub/config.json` global Knowledge roots to `Projects/<project-key>/tasks`.

```javascript
// AC-16 consumable call — grep: resolveTaskRecordPaths
import { resolveTaskRecordPaths } from "./core/task-record-paths.mjs";
const taskRecords = resolveTaskRecordPaths(taskId);
const taskDir = taskRecords.task_tracking_root;
const taskRoot = taskRecords.task_root;
```

All task execution files (`worktree.json`, `stage-result-*.json`, evidence, reviews, journal, decision-log, build-code-summary) must be read/written through `taskRecords.*` or under `path.join(taskRoot, ...)`. Do not search repo-local `tasks/` as a fallback unless `resolveTaskRecordPaths(taskId).task_tracking_root` returned that directory.

### 1. 前置读取

Read the `stage-result` produced by the previous stage and extract the relevant `facts`:

- If upstream is **`build-plan`** (full path): read `facts.plan_ref` (path to `plan.md`) and `facts.tasks_ref` (path to `tasks.md`), then read `tasks.md` to obtain the ordered phase list. `facts.tasks` is the M6 summary/count field; do **not** treat it as a file path.
- If upstream is **`make-decision`** (slim path): read `facts.decision` (the decision text) and `facts.scope` (the bounded change area). `tasks.md` and `plan.md` do not exist on the slim path; derive implementation work directly from these two keys.

The full path exposes a richer fact surface; the slim path is intentionally leaner. Adapt accordingly and never assume a key exists — check before reading.

**补读上游（handoff 累积）：** Regardless of which path was taken, unconditionally also read `specs/{task-id}/spec.md` and the decision-log under the current task directory. These are supplementary context on top of `plan.md`/`tasks.md` (or `decision`/`scope` on the slim path) — they do not replace the `facts` keys above and do not change the existing facts-consumption logic. If `spec.md` or the decision-log is missing, log a non-blocking note and continue; this is additive context, not a new gate.

### 2. TDD 证据

For each implementation unit, run the repository's real test command before and after
the minimum implementation. Save command, exit code, stdout/stderr summary, timestamp,
and relevant test names under the task evidence directory. No special capture wrapper is
required.

Sequence per phase:

1. **Write tests first** — ensure the test file exists and the assertions describe the intended behavior before any implementation code is written.
2. **Collect RED evidence** — run the targeted test and save the failing assertion and exit code.
3. **Implement** the minimum code needed to make the tests pass. Do not add production code unrelated to the failing tests.
4. **Collect GREEN evidence** — rerun the same targeted test and save its passing output and exit code.
5. Do not advance to the next phase until the current one has both RED and GREEN evidence files on disk.

### 3. 假绿检测

RED must show the intended new assertion failing; GREEN must show that same assertion
passing and at least one test executed. Otherwise mark the evidence invalid, diagnose,
and rerun using the repository-local `skills/diagnosing-bugs/SKILL.md`. wh-review receives the saved evidence as material but does not replace this
basic test check.

### 4. diff-only 越界检测

After each phase, compare `git status --short` and `git diff --stat` with the declared
scope in `docs/contracts/C2-scope-bounds.md`. No separate diff scanner or caller-built
review diff is used.

**If violations are found: STOP immediately.** Do not auto-proceed. Show the violation type and affected paths to the user and wait for **explicit human confirmation** before continuing. This is enforced by FR-DIFF-002 — no automated bypass is permitted.

### 5. worktree 路径可配置

The skill accepts a caller-provided `worktree_root` config key that specifies the absolute path to the implementation worktree. Never hardcode a path. Never resolve upward to the workflowhub tooling checkout — the worktree is always the provided `worktree_root` and all file operations are scoped to it. This is enforced by FR-WT-001.

If `worktree_root` is absent from the caller config, fail fast with a clear error rather than guessing.

### 6. 子任务派发后端

Use the host's native subagent/independent-context capability to run implementation work outside the main coordinator context. This is an external capability declared by the stage manifest, not a skill and not a package dependency. It is the only dispatch route. When the required host capability is unavailable, fail loud and escalate to human; do not inline a non-trivial phase.

When dispatching implementation work, regardless of backend:

- Pass **ABSOLUTE paths** for all file references (source files, evidence output paths, task dir).
- Pass the configured `worktree_root`.
- Include the phase TASK_SLICE, allowed paths, RED/GREEN evidence output paths, and the required PHASE_RESULT format.
- Require the phase executor to complete the current phase end to end: RED, implementation, GREEN, diff scan, independent review, PHASE_RESULT, and phase-gate.
- File-changing and no-change phases may both remain uncommitted. They record only whether the phase changed files; the one ordinary implementation commit is created by verify-code after the final approved review still matches the worktree.
- The implementer returns its PHASE_RESULT summary, artifact paths, phase record, and phase-gate result. The orchestrating skill (this SKILL.md) reads those outputs and verifies them before proceeding.

### 7. Review fact

After GREEN, run wh-review with the complete current materials. Record only its formal
`{result_ref,snapshot_tree}` in `facts.review`. An unavailable attempt creates no result.

### 9. 事实包产出

When all phases are complete, assemble the stage-result content as a structured facts package in memory (a draft — do **not** write it to disk yet) (FR-PKG-001/002/003). The required keys are:

- `facts.changed` — **array** of changed file paths (one entry per file, not a comma-joined string).
- `facts.tests` — **struct** with at minimum `{ passed: <n>, total: <n>, files: [...], command: <string>, risk_level: <P0|P1|P2|P3|null> }`. The `command` field is required for verify-code downstream consumption (M9 C1). For multi-phase tasks, also include `phases: [{ phase_id, risk_level }, ...]` so each phase's risk level is traceable (FR-RISK-001).
- `facts.review` — 仅 `{ result_ref, snapshot_tree }`；消费者必须打开正式 result，不得复制 verdict。
- `facts.worktree_root` — **absolute path string** for the task implementation worktree that downstream stages must enter before reading or verifying implementation artifacts.
- `facts.task_tracking_root` — **absolute path string** for the task execution-record root used to locate `{task-id}` stage artifacts. This must be explicit; downstream stages must not infer it from their current checkout.
- `facts.phase_completion` — **struct** copied from accepted PHASE_RESULT records: `{ phase_records: [{ phase_id, changed }] }`. `changed` is a boolean; it contains no commit SHA, private review ref, or raw review path.

This draft is held in memory and carried forward; it is **not** persisted here. The actual file write happens exactly once at §16 step 5. The durable path, resolved via `parseTaskDir` (AC-16), is `{taskDir}/{task-id}/stage-result-build-code.json`. Do not hard-code `tasks/{task-id}/`, and do not write this file at this step.

Example shape (the content to assemble now, to be written later at §16):

```json
{
  "status": "success",
  "error_code": "",
  "retryable": false,
  "facts": {
    "changed": ["core/text-utils.mjs", "tests/text-utils.test.mjs"],
    "tests": { "passed": 12, "total": 12, "files": ["tests/text-utils.test.mjs"], "command": "pnpm exec vitest run tests/text-utils.test.mjs", "risk_level": "P1", "phases": [{ "phase_id": "phase-1", "risk_level": "P1" }] },
    "review": { "result_ref": "reviews/results/<result>.json", "snapshot_tree": "<git-tree>" },
    "worktree_root": "/absolute/path/to/worktree",
    "task_tracking_root": "/absolute/path/to/task-records",
    "phase_completion": {
      "phase_records": [{ "phase_id": "phase-1", "changed": true }]
    }
  },
  "missing_items": [],
  "user_decision": false,
  "reason": "All phases implemented with RED→GREEN evidence and a formal review result."
}
```

### 10. metrics 記録

Record metrics via `metrics/collector.mjs`. Call `recordSkeleton` at stage start (before any implementation work) and `updateOwnResult` at stage end (after the stage-result is written). Fields must align with the M4 record-schema:

```json
{
  "execution_id": "<uuid>",
  "skill_or_stage": "build-code",
  "stage": "build-code",
  "skill_version": "1.0.0",
  "executed": true,
  "tokens": null,
  "duration_ms": null,
  "rework_rounds": 0,
  "human_intervention": false,
  "friction_ref": null
}
```

Do not hand-write a raw jsonl line. Use the collector API only.

### 11. P0-P3 风险定级 (FR-RISK-001)

During §1 pre-read, inspect `facts.tasks` for the ordered phase list. Each phase descriptor may carry a `risk_level` field (P0, P1, P2, P3). Derive and record the risk level as follows:

1. If `phase.risk_level` is present and is one of `P0|P1|P2|P3`, use it.
2. If it is missing, malformed, or out of range, log a non-blocking warning and default to `P2`. Do **not** halt build-code because of a classification failure.
3. Write the current phase's `risk_level` into the per-phase evidence:
   - RED and GREEN evidence records contain `risk_level`.
   - GREEN evidence also records the tested source tree or current HEAD as diagnostic metadata; phase completion does not require an implementation commit.
4. When assembling the stage-result, set `facts.tests.risk_level` to the current phase's level and append `{ phase_id, risk_level }` to `facts.tests.phases` for multi-phase traceability.

**P0 coverage prompt:** For any phase classified as `P0`, emit an explicit log line such as:

```
[P0-risk] phase <phase_id>: behavior must be covered by tests in the current phase.
```

This log is a traceability record, not a blocking gate. Classification failures are recorded in `missing_items` or phase notes, never used to stop execution.

### 12. L2 集成冒烟 (FR-SMOKE-001)

After **all** implementation phases have GREEN evidence, trigger an L2 integration smoke step before writing the final stage-result.

1. 使用 stage manifest 解析出的本地 `skills/test-routing-advisor/SKILL.md` 与 bundle，在独立上下文调用，并传完整 resolved-path payload。
   - 输入固定为 changed files、phase count、test command；不加载 backend/frontend/full-chain 执行器。
2. The advisor selects one of three routing tiers: `simple`, `feature`, or `fullstack`.
3. Persist the report to `{taskDir}/{task-id}/evidence/l2-integration-test-report.json` with exactly these fields:
   - `routing_tier`: one of `simple|feature|fullstack`
   - `routing_rationale`: non-empty string explaining why this tier was chosen (traceability requirement AC-SMOKE-003)
   - `result`: `pass` or `fail`
   - `ts`: ISO-8601 timestamp
4. If the smoke run fails or the advisor cannot be reached, record the failure in `missing_items` and continue. L2 smoke is a fact-recording step, not a blocking gate.

### 13. Single code review flow (FR-REVIEW-001)

After GREEN, build one complete material bundle and call wh-review once for the
`build-code` attempt. It aggregates only valid semantic provider
results; it never synthesizes a pass or substitutes a local reviewer.

### 14. Revision handling (FR-REVIEW-002)

Open the formal result referenced by `result_ref`. For `revise_required`, invoke local
`skills/review-response/SKILL.md`, verify each finding, make the minimum fix, refresh
tests, and invoke `wh-review-cli run` again with the complete current materials.
`previous_runtime_ids` may be supplied only as an optimization; the new attempt remains
valid without continuation. Repeated unknown root causes escalate to a human. There is
no reset, flow repair, or second review path.

### 15. phase 完成留痕

每个 phase 结束时保留 `PHASE_RESULT.phase_records[]` 的 `{ phase_id, changed }`，并写/更新完成事实草稿。允许 tracked、staged、unstaged 和 untracked 修改保留在 task worktree；不得为通过 phase-gate 创建临时、空白或 phase-scoped commit。

phase executor invokes the workflowhub package's phase gate script from the workflowhub tooling/package root, passing the task worktree path as data:

```bash
node <workflowhub_package_root>/scripts/phase-gate.mjs <phase-result-json> <worktree_root> --review-data-root=<task_root>
```

Only after this command returns ok may the coordinator treat that draft as accepted completion and advance to the next phase. A failure means the phase facts are incomplete or contradictory; stop, return the same phase to the phase executor, and fix the phase result or missing artifact before advancing. This check covers only RED/GREEN evidence, diff scan result, and the referenced formal review result; it intentionally does not require a commit or a clean worktree.

### 16. 自动进度摘要（人向，问题 1+2）

This is a separate path from the escalation handling in §14 above and does not change it. It only applies on the **normal pass path** — when all phases are GREEN and the final two-stage review verdict is `pass` (no `revise_required`, no `escalate_to_human`), **and** all phase records in §15 have passed phase-gate.

When that condition holds:

1. Produce a plain-language progress brief for the human using `docs/human-brief-template.md`'s **七要素 (seven elements)** only:
   1. 这阶段做了什么 / 2. 审了几次、结论是什么 / 3. 这个 task 要解决什么 / 4. 准备怎么做（或已怎么做）/ 5. 原始需求覆盖情况 / 6. 现在结果 / 7. 下一步。
2. Do not use the "请确认" (decision-gate) ending — build-code is an auto-advance stage, not a decision gate. Close the brief with exactly the **B-type ending** from the template:
   > 本阶段已通过异源审查，自动进入下一阶段。以上仅供你了解进度，无需操作。
3. Follow the template's hard rules: plain Chinese a high-schooler can follow, no internal artifact names/field names/IDs (translate them into human terms).
4. **Landing point (explicit):** write the brief text to `{taskDir}/{task-id}/build-code-summary.md`. This is the durable artifact. (Consistent with how other build-code artifacts resolve under `{taskDir}/{task-id}/...` via `parseTaskDir`, e.g. the stage-result path below.)
5. This brief is informational only — it is not a quality gate and does not block advancing. **This is the single point where the stage-result is persisted to disk.** Take the in-memory facts draft assembled in §9, fill in the phase records accepted by §15, and write the final stage-result to `{taskDir}/{task-id}/stage-result-build-code.json` (resolved via `parseTaskDir`, AC-16). Then run Receipt verification below.

### Receipt verification

After writing stage-result, call:

```js
const { verifyReceipts } = await import("../../scripts/validate-stage-result.mjs");
const baseRef = process.env.WORKFLOWHUB_DIFF_BASE;
if (!baseRef) {
  process.stderr.write("[receipt] FAIL: WORKFLOWHUB_DIFF_BASE is required so committed build-code work is verified against the task branch base\n");
  process.exit(1);
}
const receiptResult = verifyReceipts("build-code", "<stageResultPath>", "<worktreeRoot>", { baseRef });
if (!receiptResult.ok) {
  process.stderr.write(`[receipt] FAIL: ${receiptResult.errors.join("; ")}\n`);
  process.exit(1);
}
```

Only after `receiptResult.ok` is true, proceed automatically into `verify-code`.

### 17. worktree.json 复用协议 (FR-WORKTREE-001)

Before starting implementation, locate the worktree descriptor at `taskRecords.worktree_json`.

**Normal path:**

1. **File exists and is valid JSON** with a valid `worktree_root` pointing to an existing directory → reuse it. Do not re-clone or re-checkout.

**Missing file — fail-loud (FR-WORKTREE-FAILLOUD-007):**

2. **File does not exist** → do **not** create a worktree. Output a clear error to stderr:

   ```
   ERROR [FR-WORKTREE-001]: worktree.json not found at expected path: {taskDir}/{task-id}/worktree.json
   make-decision stage must complete successfully before build-code can proceed.
   ```

   Trigger `escalate_to_human`, stop build-code progression immediately, and record the missing path in `missing_items`. Do **not** silently fall back to creating a new worktree.

**Exception paths:**

3. **Corrupted file:** If `worktree.json` cannot be parsed as JSON, or if `worktree_root` is missing / not a string / empty string / points to a non-existent path / is not a git worktree directory, do **not** read the corrupted content and do **not** guess a path. Trigger `escalate_to_human`, stop build-code progression, and record the corruption details in `missing_items`.

The `worktree_root` config key passed to this skill (see §5) must always match the path recorded in `worktree.json`. Never resolve upward to the workflowhub tooling checkout.

**消费 6 字段前的 common 校验（全字段非空、绝对路径、值域）：** 读取 `worktree.json` 后，在消费 `target_repo_root`、`worktree_root`、`branch`、`created_by_stage`、`push_policy`、`status` 六字段之前，须先执行 common 校验：①全字段非空（六个字段均不得为空字符串或 `null`）；②路径字段（`target_repo_root`、`worktree_root`）须为绝对路径（以 `/` 开头）；③各字段值域校验（`status` ∈ `{active, cleaned}`；`push_policy` ∈ 预定义枚举；`created_by_stage` ∈ `{make-decision}`——本字段记录首次创建 worktree.json 的阶段，当前唯一合法值为 `make-decision`（R4/R5 规定 worktree 仅在 make-decision 阶段创建）；`branch` 须匹配 make-decision R3 定义的规范化分支正则 `^workflowhub/[a-z]+(-[a-z]+){1,2}$`）。任一项校验失败即触发 `escalate_to_human`，停止 build-code 推进，并在 `missing_items` 记录具体失败字段。**`status` 前置约束**：common 校验通过后，build-code 仅允许 `status="active"` 的任务继续推进；`status="cleaned"` 视为已归档任务重入，直接 `escalate_to_human`/fail-loud，停止 build-code 推进，不得复用陈旧 worktree.json 继续后续步骤（与 verify-code close 的 re-entry 约束保持一致）。

**`status=active` 时的 active-only 校验：** common 校验通过且 `status="active"` 时，须额外执行 active-only 校验：①`worktree_root` 目录存在性（目录须实际存在于文件系统）；②该 worktree 已在 `target_repo_root` 对应仓库的 `git worktree list --porcelain` 输出中注册（`worktree_root` 出现在某条目的 `worktree` 行——须以 `target_repo_root` 为准跑该命令，不得用任意其他仓库的注册记录替代）；③分支名匹配（该 worktree 条目对应的 `branch` 与 `worktree.json` 中记录的 `branch` 一致）；④同仓校验（该 worktree 的 commondir 须与 `target_repo_root` 同源，防止 `worktree.json` 被错误固化到另一仓库后仍被当作有效记录放行；linked worktree 的 gitdir 本身与主仓库不同属正常现象，不作为判定依据，只校验 commondir）。四项任一失败同样触发 `escalate_to_human`，停止推进，记录失败详情于 `missing_items`。

## Canonical v1 step sequence

`steps.json` is the executable canonical topology. The detailed legacy material above maps to the continuous, one-action sequence: 1 read-plan, 2 write-red-tests, 3 implement-change, 4 run-green-tests, 5 scan-diff, 6 review-change, 7 commit-implementation, 8 publish-code-result. Each step declares entry conditions, completion evidence, observable result, and dependencies. Unknown legacy actions fail closed and use `docs/migration-and-fallback.md`.

## Review

After fresh tests pass, call the only production entry:

```bash
node <workflowhub_package_root>/skills/wh-review/scripts/wh-review-cli.mjs run <build-code-review-input.json>
```

The JSON input sets `stage="build-code"`; `materials` contains the content or parsed JSON
loaded from the task's `approved_spec`, `acceptance_criteria`, and `test_evidence` files. The CLI itself captures the
complete current source and diff; callers must not provide or precompute either one.
Providers read only the frozen bundle. Store the returned
`{result_ref,snapshot_tree}` in `facts.review`. Only a formal passing result advances.

## End Review

## Workflow friction

发现流程卡点立即追加到 `path.join(taskRoot, "friction.md")`：`[FRICTION] <stage>/<step>: <卡点> | impact: <影响> | suggestion: <建议或 none>`。将该文件路径写入 metrics/stage-result 的 `friction_ref`；无记录时为 `null`。只记录事实，不恢复外部 feedback skill，不因记录失败掩盖原始错误。
