---
name: verify-code
description: Run a full verification pass against the spec acceptance criteria, produce a final test report and V4 packet review before stage-result commit.
---

# verify-code

## Goal

Confirm that the implementation satisfies every acceptance criterion in the spec. Produce a final test report and an explicit pass/fail verdict before the change is considered deliverable.

## Scope boundary: verify-code vs verify-change

**`verify-code`** is this skill — stage 5, test-acceptance. It reads the spec's acceptance criteria and the implementation from `build-code`, runs the test suite, and writes `final-test-report.md` and `test-acceptance/summary.md`.

**`verify-change`** is a different concept — verifying a diff at code-review time (checking whether a proposed change is safe to merge). That is not this skill's responsibility. `verify-code` checks whether the code meets the spec; `verify-change` checks whether the diff is reviewable. If you are asked to "verify the change", confirm which meaning is intended before proceeding.

## What to do

### 1. 阶段开始 trace

Before any other verify-code step, append one JSON line to
`evidence/stage-summary.jsonl`:

```json
{"event":"stage_summary","phase":"start","ts":"<ISO8601>"}
```

Write this inline from this workflow step; there is no separate stage-summary
skill. The exact first-line payload must include `"event":"stage_summary"` and
`"phase":"start"` so the execution trace is machine-checkable.

### 2. 前置读取

**Path resolution (FR-TASKDIR-001)**: Resolve all task execution record paths via `core/task-record-paths.mjs` and treat `taskRecords.task_root` as the final task execution-record directory — do not hard-code repo-local `tasks/{task-id}/`.

```javascript
// AC-16 consumable call — grep: resolveTaskRecordPaths
import { resolveTaskRecordPaths } from "./core/task-record-paths.mjs";
const taskRecords = resolveTaskRecordPaths(taskId);
const taskDir = taskRecords.task_tracking_root;
const taskRoot = taskRecords.task_root;
```

All task execution files (`worktree.json`, `stage-result-*.json`, evidence, reviews, final-test-report, journal, decision-log) must be read/written through `taskRecords.*` or under `path.join(taskRoot, ...)`. Do not search repo-local `tasks/` as a fallback unless `resolveTaskRecordPaths(taskId).task_tracking_root` returned that directory.

Read `{taskDir}/{task-id}/stage-result-build-code.json`, extract `facts.tests.command`. If the command field is missing, surface an explicit error and stop. Do not proceed silently without a test command.

Also read the task spec metadata for `ui_change`, `risk_level`, and
`no_browser_test: true`. The `no_browser_test: true` flag is the only skip-trace
marker that suppresses missing L3 report alarms for non-UI work.

**Handoff 累积（补读上游）**：无条件读取以下三份上游产物，作为 build-code 结果之外的补充上下文：

- `specs/{task-id}/spec.md` 的验收标准部分 — 用于第 8.5 步核对实现是否覆盖每条验收标准。spec 产物按项目约定落在代码仓库 `specs/{task-id}/`，不在 `taskDir` 下（`taskDir` 是最终项目 task_tracking_root，由 `parseTaskDir()` 解析）；路径写法参考 `workflows/build-plan/SKILL.md` 读 spec 的方式。
- `{taskDir}/{task-id}/plan.md` — 了解原定实现步骤和范围边界。
- decision-log（`{taskDir}/{task-id}/decision-log.md` 或等价记录）— 了解最初决策与需求覆盖范围。

若某份文件缺失，记录在 `missing_items`，不阻断本阶段推进。

### 3. metrics 开始

At stage start, call `metrics/collector.mjs` `recordSkeleton`, passing a seed with all 10 core fields:

```json
{
  "execution_id": "<uuid>",
  "skill_or_stage": "verify-code",
  "stage": "verify-code",
  "skill_version": "1.0.0",
  "executed": true,
  "tokens": null,
  "duration_ms": null,
  "rework_rounds": 0,
  "human_intervention": false,
  "friction_ref": null
}
```

## V4 Review Round

Use `ReviewRoundFacade` through `runReviewRound()` only:

```js
await runReviewRound({
  task_id: taskId,
  task_tracking_root: taskRecords.task_tracking_root,
  stage: "verify-code",
  review_flow_id: "verify-code-flow",
  packet,
});
```

`packet` carries only supplemental context such as acceptance/design excerpt and host
test evidence. The host captures the canonical source diff, changed-file manifest and
hashes from the trusted task worktree; callers must not supply source fields. Providers
review only the sealed `review-packet.v1`. Do not run git, read the real repository, request absolute
paths, or write reports. Keep raw provider evidence below
`<task>/reviews/private/round-.../`; record cancellation with
`cancel_source` separately from semantic verdicts. Continuations retain the initial
runtime; a new flow requires human-approved reset. An unpublished `runReviewRound()`
return is transport/packet evidence only: it has no semantic verdict. After host
dispositions, its published return is `{ semantic_verdict, core_receipt_hash,
needs_human }`; only that published object can control this stage.

## End V4 Review Round

These are the M4 record-schema core fields (`execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`). Use `metrics/collector.mjs` — do not hand-write a raw jsonl line with only `skill/stage/event/ts`.

### 4. fresh 测试执行

Call `node workflows/verify-code/capture.mjs` with the command extracted in step 2. Write the evidence to `{taskDir}/{task-id}/evidence/fresh-capture.json` (path resolved via `parseTaskDir` — see step 2). The capture script records: exit code, git SHA, Test Files line, content hash, timestamp, and command — all durable, externally-verifiable facts.

Treat this run as the L1/L2 evidence source for the follow-up test-strategy
step. Preserve the command output summary and any AC references from the L2
report or fresh capture so they can be passed to the independent strategy
sub-agent.

### 5. 鲜度校验

Call `freshness.mjs` `checkFreshness` to compare the build-code git_sha against current HEAD. If `anomaly_flags` is non-empty, output visible warnings at the skill boundary (FR-FRESH-004). The `stale_sha` anomaly is informational only — it does not block or change the verdict.

Also call the phase-1 freshness expansion (`checkEvidenceFreshness`) with the
phase report, RED report, GREEN report, L2 report, and any available L3 report.
Pass the spec skip flag as `noBrowserTest` (or `skipL3`) when metadata contains
`no_browser_test: true`; in that case freshness records an informational
`intentional_skip` for `l3-iron` and must not add a missing L3 report to
`mtime_violations[]`. It must use the same `git_sha + content_hash` cross-check
semantics as `freshness.mjs` and write/read `mtime_violations[]`. Any violation
in segments 1/2/3/4 or non-skipped `l3-iron` is a D7 red condition.

### 6. test-strategy 子代理与机器核查

After L1/L2 evidence exists and before trace-check or L3, invoke
`skills/test-strategy/SKILL.md` as an independent sub-agent. Provide:

- `ui_change`: boolean from spec metadata or explicit UI acceptance evidence.
- `risk_level`: `low | medium | high` from the task metadata or build-code
  facts.
- L2 report summary: concise fresh-capture/L2 findings, including AC IDs,
  coverage gaps, failures, and skipped items.

The sub-agent must write `test-strategy.md` in the current task evidence
directory. The file must include YAML front-matter with `ac_routes`.

Immediately after the sub-agent returns, run a machine check:

1. Read the authoritative spec AC list.
2. Parse `test-strategy.md` YAML front-matter.
3. For every spec AC ID matching `^AC-\d+$`, require a route in `ac_routes`.
4. Require every route value to be `P0`, `P1`, `P2`, `P3`, or `skip`.
5. Require every key in `ac_routes` to exist in the spec AC list.

Failure lines are fixed and must be emitted exactly:

- `MISSING_ROUTE: {AC_ID} has no route in test-strategy.md`
- `UNKNOWN_AC: {AC_ID} not found in spec AC list`

`test-strategy 机器核查失败` is a D7 red trigger. A sub-agent timeout or missing
`test-strategy.md` is yellow and maps to `unknown` unless a separate red
condition is present.

### 7. trace-check 查痕

After test-strategy machine checking and before browser/L3 execution, run
trace-check over `evidence/` and write `trace-check-report.json`.

The trace-check logic must scan each required phase report and check:

1. The report file exists.
2. `exit_code == 0`.
3. `git_sha + content_hash` cross-validation matches the same freshness logic
   used by `freshness.mjs`.
4. The evidence is correlated to this run by either a current journal reference
   or by the `capture.mjs 调用链`.

`trace-check-report.json` must include:

```json
{
  "missing_ac_coverage": [],
  "checked_phases": [],
  "violations": []
}
```

Each violation should carry enough machine-readable detail for D7, including
the AC ID when known, reason, file path, and observed exit code. If spec metadata
contains `no_browser_test: true`, trace-check must record that skip fact and not
add a missing L3 report to `missing_ac_coverage`. Without `no_browser_test:
true`, a missing required L3 report contributes to `missing_ac_coverage`.

### 8. 浏览器验收

Determine if the task has UI acceptance items. Check the spec for `ui_change: true` or explicit browser/QA acceptance criteria.

- **No UI items**: SKIP browser acceptance. Record in `missing_items`: `"browser-acceptance: no UI acceptance items"`. If the spec also contains `no_browser_test: true`, trace-check must treat the missing L3 report as an intentional skip.
- **UI items exist**: Directly invoke the existing isolated-browser-qa skill via `workflows/verify-code/isolated-browser-qa.md`. Do not modify or replace the browser engine. Store screenshots under `evidence/screenshots/` and require the machine-readable report at `l3-e2e-report.json`. The report must include `git_sha` and `flaky_failure`.

After L3 completes, enforce the L3 iron law by reading `l3-e2e-report.json` and
call `freshness.mjs` `checkL3IronLaw` with that report and the current HEAD.
The required operation is: append the returned `segment: "l3-iron"` record into `mtime_violations[]` before the stage-result color decision. If `l3-e2e-report.json` is missing when L3 is required, append `segment: "l3-iron"` with `reason: "missing_report"` to `mtime_violations[]`. Any L3 git_sha mismatch or non-skipped missing L3 report
is a red condition. If `flaky_failure` is `true` and no red condition is
present, classify the result as yellow.

### 8.5 验收标准逐条覆盖核对

基于步骤 2 补读到的 `specs/{task-id}/spec.md` 验收标准部分，逐条核对实现是否真的覆盖，而不是只声称读过：

- 把验收标准拆成条目列表（每条一行）。
- 对每一条，标注：覆盖状态（`covered` / `not_covered` / `partial`）+ 证据（对应的测试用例名、fresh-capture 结果，或具体代码位置；没有证据的不能标 `covered`）。
- 生成一份逐条覆盖清单（表格或列表均可），写入 `final-test-report.md`（步骤 12 落盘的同一份报告，不另起新文件/新格式）。
- 若某条验收标准算不出覆盖状态（如证据缺失），标 `not_covered` 并记入 `missing_items`，不阻断本阶段推进。
- 这份覆盖清单同时是步骤 9 明文摘要"原始需求覆盖情况"那一条的事实来源。

## Close 章节：5 步骤序列总览（严格顺序）

verify-code 阶段的收尾（close）流程严格按以下 5 个步骤顺序执行，任一步骤失败均按其自身契约处理，不得跳步或乱序：

① **入口校验**（对应 §8 common + active-only）：进入 close 流程前，先执行 common 校验（worktree.json 六字段全非空、路径为绝对路径、值域校验，其中 `branch` 须匹配 `^workflowhub/[a-z]+(-[a-z]+){1,2}$`，与 build-code §17 common 校验口径一致）。**`status` 前置约束**：close 流程仅允许 `status="active"` 的任务继续；`status="cleaned"` 视为已归档任务重入，直接 fail-loud，不得进入步骤②-④。`status="active"` 时须额外执行 active-only 校验，与 §17 build-code 消费 6 字段前的 active-only 校验口径一致（不得弱化）：worktree 目录存在性、以 `target_repo_root` 为准执行的 `git worktree list --porcelain` 注册、分支名匹配、同仓校验（该 worktree 的 commondir 须与 `target_repo_root` 同源；linked worktree 的 gitdir 本身与主仓库不同属正常现象，不作为判定依据，只校验 commondir）。以上任一校验失败（含 common 校验失败、`status="cleaned"` 重入、active-only 校验失败）即 fail-loud，跳过步骤②-④（不执行质量记录、3rd-review、任何不可逆动作），仅进入步骤⑤ 落盘（stage-result 的 `verdict` 字段固定写 `escalate_to_human`，并记录 `needs_human=true` 与该失败事实），不得继续执行 merge 等后续动作。

② **质量事实记录**（对应 §8.5 + §9）（final-test-report, warn 不阻断, needs_human=true）：记录 `final-test-report.md`（含步骤 8.5 逐条覆盖清单）；§9 产出七要素明文停顿摘要。质量事实记录本身若出现非致命异常，只 warn 不阻断流程；若发现需要人工介入的问题，设置 `needs_human=true` 并继续往下记录，不因此中止。

**当前轮 wh-review 前的候选闭环写法**：步骤②到步骤③之间，当前轮
wh-review 的 pass core receipt 尚不存在，禁止把 `final-test-report.md` 或
`stage-result-verify-code.json` 写成已通过 wh-review。此时只能表达候选态：
fresh acceptance 可写 `pass`，但 `review_status` 必须写
`pending_current_wh_review`，`stage-result.status` 用 `unknown`，并明确
`close_ready_for_merge_gate=false`、merge/cleanup blocked until current
wh-review pass。不得让 `facts.review.semantic_verdict=pass` 指向上一轮
`revise_required` core receipt。当前轮 wh-review 返回 semantic `pass` 后，才允许在步骤⑤
最终落盘时把 `review_status=pass`、`status=success` 写入 stage-result。

③ **V4 review 与唯一实现提交**：在人工确认 merge 前，由 host 从当前 task worktree 的临时-index tree 构建 canonical packet 并调用 `ReviewRoundFacade`。provider 只读 packet，不能读取 worktree、运行 git 或接收输出路径。只有 public core receipt 的语义结论可供后续人工决策；transport、packet 或取消问题不会伪造 verdict。若 semantic verdict 为 `pass`，必须先用同一个 final flow 调用 `wh-review-cli.mjs verify-final`，确认当前临时-index tree 仍等于刚获通过的 tree；不相等就停止并回到 review。只有该命令成功后，才能在 task worktree 执行一次普通实现提交：`git add -A && git commit -m "workflowhub(verify-code): finalize {task-id}"`。verify-final 本身永不提交；build-code 不得提前提交。

④ **不可逆动作 8 步线性序列**（严格顺序，仅在步骤三 verdict=pass 且用户确认后执行）：
  1. 归档 commit：先执行 repo 内规格归档移动 `git mv specs/{task-id} specs/archive/{task-id}`（若 `specs/{task-id}` 不存在则 fail-loud；若 `specs/archive/{task-id}` 已存在则 fail-loud，不得覆盖），再提交归档 commit。commit message 精确为 `workflowhub(close): archive {task-id}`；close 不是独立 stage，不得使用 `workflowhub(verify-code)` 前缀；提交产生的 commit_sha 须记入本阶段 stage-result 的 `facts.close_commit_sha` 字段，字段路径与 close 流程共用同一命名，不得使用其他别名。该 commit 的 diff 必须包含 `specs/{task-id}/` 到 `specs/archive/{task-id}/` 的 rename/move；只提交测试报告或任务执行记录不算完成归档。
     - 历史补归档例外：仅当一次性清理多个已完成历史 task spec 且这些 task 已经不处于活跃 stage 时，允许 batch archive commit，message 可为 `workflowhub(close): archive completed specs`。batch gate 必须同时满足：①每个被移动目录都是 `specs/{task-id}` 到 `specs/archive/{task-id}` 的 rename/move；②`specs/` 顶层除 `archive/` 外无已完成 task 目录残留；③可执行测试不因归档被静默排除（若归档目录下存在 `*.test.*`，须迁到活跃 `tests/` 或保证仍被测试发现）；④`npm test` 通过；⑤batch commit push 前必须有异源 3rd-review `verdict=pass`。任一条件不满足，不得 push。
  2. 切主 checkout（切换到主分支）
  3. no-ff merge（`git merge --no-ff`，将任务分支合入主分支）
  4. 移除 worktree 目录（`git worktree remove`）；命令成功后检查被移除 worktree 的父级目录，若父级目录因此变空，须执行 `rmdir` 清理该空容器；父级目录非空时不得删除
  5. push main（推送主分支到远端）
  6. 删远端分支（存在则删；不存在则 skip 并记录 info，不视为失败）
  7. 删本地分支
  8. 更新 worktree.json 的 `status=cleaned`

**pre-merge revise_required 契约**：若步骤三（3rd-review）判定为 `revise_required`（或 `escalate_to_human`），则步骤④的 8 步动作全部跳过，不执行任何一步，设置 `needs_human=true`，直接进入步骤⑤ 落盘。

**不可逆动作中途失败契约**：步骤④ 8 步序列一旦开始执行，若任意一步中途失败，须立即停止，不回滚已完成的步骤，也不自动重试或自动续跑剩余步骤，触发 `escalate_to_human`，并在落盘产物中明确记录失败发生在第几步（失败步骤编号）。`status` 字段在整个 8 步期间维持 `active` 不变，直到步骤 8 成功完成才写 `cleaned`——`status` 仅用于 close 入口的 re-entry 拦截判断，不作为"已完成到第几步"的证据；后续如何处理（是否手动补齐剩余步骤、是否手动回滚）由人工依据落盘的失败步骤编号逐一核实当前 git/worktree 实际状态后裁决，本契约不承诺任何步骤的幂等重跑安全性。

⑤ **stage-result 落盘**（task_tracking_root，含 verdict 字段）：调用 `assembleStageResult` + `writeStageResult`，将结果写入 `task_tracking_root` 下对应 task 的 stage-result 产物（即该阶段的 stage-result.json，具体路径详见 §12：`stage-result-verify-code.json`），必须包含 `verdict` 字段（`pass` / `revise_required` / `escalate_to_human`）。无论步骤④是否执行（merge 完成或 revise_required 阻止），stage-result 文件都必须存在，不得跳过落盘。

### 9. 明文停顿 (收尾确认)

Before asking for confirmation, produce a plain-language decision brief following `docs/human-brief-template.md`'s seven elements, filled with this stage's facts:

1. 这阶段做了什么 — 跑了测试、核对了验收标准。
2. 本次 fresh 测试执行的通过/失败结论。
3. 这个 task 要解决什么 — 取自 spec.md / decision-log 的原始需求。
4. 已经怎么做 — build-code 的实现概述。
5. 原始需求覆盖情况 — 取自第 8.5 步产出的逐条覆盖清单，写清覆盖了哪些、有没有遗漏、有没有额外加的。
6. 现在结果 — 测试通过/失败、verdict。
7. 下一步 — 即将进行 3rd-review 独立审查（step 10），审查通过后再询问是否确认合并（step 11）。

全大白话中文，不出现内部产物名/字段名/编号（该模板的硬规则）。

摘要内容若有字段缺失（如覆盖情况算不出来），只记录 `missing_items` 并在摘要里显眼标注缺失，不阻断本步继续推进；本步骤只展示测试结果摘要，不要求人确认 merge（merge 确认在 step 11，发生在 3rd-review 通过之后）。

### 10. V4 独立审查

**在人工确认 merge 之前**，build the canonical total diff packet and call
`ReviewRoundFacade` for the `verify-code` flow. Providers receive only that packet;
they do not access the worktree. A non-pass semantic result is surfaced to the human
before any irreversible action.

After the current flow returns semantic `pass`, run `verify-final` before any
`git add` or commit. Set `task_tracking_root` from the already parsed
`taskRecords.task_tracking_root`; never infer it from the current checkout. Its input
identifies the trusted task worktree and the approved flow; it never accepts a caller
diff or commits:

```bash
node <workflowhub_package_root>/skills/wh-review/scripts/wh-review-cli.mjs verify-final <<'JSON'
{"task_id":"<task-id>","task_tracking_root":"<taskRecords.task_tracking_root>","stage":"verify-code","review_flow_id":"verify-code-flow"}
JSON
git add -A
git commit -m "workflowhub(verify-code): finalize <task-id>"
```

If `verify-final` reports `WORKTREE_DRIFT_AFTER_REVIEW`, do not commit. Re-run the
review from the changed worktree. This is the only ordinary implementation commit;
the later close archive commit remains a separate close action.

**执行规则：** provider 只见 `review-packet.v1` 与冻结 skill bundle；不能读取 worktree、执行 git、请求绝对路径或写报告。私有 raw/session/status 只在 round receipt 中保存。

**Verdict handling:**

| Verdict | Action |
|---|---|
| `pass` | Proceed to step 11 (人工确认 merge gate). |
| `revise_required` | **Do not proceed to merge.** Surface all findings to user immediately. Write stage-result with `review_status=revise_required`, `needs_human=true`, and the full findings list. Set `user_decision=false`. Skip step 11 (no merge gate shown). Go directly to step 12 to write stage-result. After N=2 failed rerun rounds with no resolution, escalate to human. |
| `escalate_to_human` | Surface findings immediately. Set `needs_human=true`. Write stage-result with findings. Skip step 11. Go to step 12. |

Provider unavailable, cancellation, timeout and material failure remain transport or packet diagnostics. They do not grant merge permission and do not produce a semantic review fact.

After the host has dispositioned the private findings, map the published CLI return
directly into `stage-result.facts.review`:

```js
const published = await runReviewRound({
  task_id: taskId,
  task_tracking_root: taskRecords.task_tracking_root,
  stage: "verify-code",
  review_flow_id: "verify-code-flow",
  packet,
  dispositions,
});
const review = published.semantic_verdict
  ? { core_receipt_hash: published.core_receipt_hash, semantic_verdict: published.semantic_verdict, needs_human: published.needs_human }
  : { diagnostic: published.transport, needs_human: true };
stageResult.facts.review = review;
```

Only the published semantic result may drive merge handling. An unpublished transport
or packet result writes a diagnostic and `needs_human:true`; it never becomes a
pass-like review fact.

### 11. 人工确认 merge gate

**Only reached when the V4 core receipt semantic verdict is `pass`.** If it is `revise_required`, `escalate_to_human`, or absent, skip this step entirely and go to step 12.

Step 9 already showed the plain-language brief (七要素) without asking for confirmation, because at that point the review outcome (step 10) was not yet known — this is the correct order (never ask "confirm merge" before knowing whether review passed). Now that the verdict is known, this is the actual D2 human-confirmation gate: append `docs/human-brief-template.md`'s 决策 gate 阶段结尾（A 类）"请确认：" block to a short recap of the seven elements' 现在结果/下一步 (updated with the now-known review verdict), then:

```
请确认：
- 推荐：继续 —— 独立审查已通过，执行 merge 并清理 worktree。
- 暂停 —— 不执行 merge，保留当前状态，人工另行处理。
```

- **User confirms（选择"继续"）**: Execute the merge and branch deletion. Set `user_decision=true`. Before deleting remote/local branch, verify the task branch's target commit is included in main; if verification fails, stop close, do not delete any branch, set `needs_human=true`.
- **User rejects（选择"暂停"）**: Set `user_decision=false`, skip all irreversible operations, proceed to step 12 to write the stage-result with the rejection reason (FR-CLOSE-002). Do not exit early.

Wait for explicit user confirmation before proceeding (FR-CLOSE-001/003). Do not execute merge or delete without user consent.

### 12. stage-result 落盘

Call `facts-assembly.mjs` `assembleStageResult` + `writeStageResult`. Write the stage-result to `{taskDir}/{task-id}/stage-result-verify-code.json` (FR-PATH-001). The `final-test-report.md` goes to `{taskDir}/{task-id}/test/` (FR-PATH-002) and must include the step 8.5 逐条覆盖清单 as one of its sections. Both paths resolved via `parseTaskDir` — see step 2.

**必须处理两条落盘路径：**

**路径 A — merge 完成（V4 semantic pass + user_decision=true）：**
```json
{
  "status": "success",
  "error_code": "",
  "retryable": false,
  "facts": {
    "verdict": "pass",
    "review_status": "pass",
    "evidence_ref": "<relative path to final-test-report.md>"
  },
  "missing_items": [],
  "user_decision": true,
  "reason": "All acceptance criteria verified and documented."
}
```

**路径 B — revise_required 阻止 merge（merge 未发生）：**
```json
{
  "status": "failed",
  "error_code": "review_revise_required",
  "retryable": true,
  "facts": {
    "verdict": "revise_required",
    "review_status": "revise_required",
    "findings": ["<finding 1>", "<finding 2>", "..."],
    "core_receipt_hash": "<sha256>"
  },
  "missing_items": ["<blocked items>"],
  "user_decision": false,
  "needs_human": true,
  "reason": "V4 semantic revise_required: merge blocked. Human must confirm fixes and continue the review flow before merge."
}
```

路径 B 须在 `stageResult.facts.review = reviewFact` 赋值后、`writeStageResult` 调用前确保 `needs_human=true` 字段写入。无论哪条路径，stage-result 文件必须存在，不得因未 merge 而跳过落盘。

**路径 C — 当前轮 wh-review 输入候选态（仅用于步骤③前，不是最终完成态）：**
```json
{
  "status": "unknown",
  "error_code": "wh_review_pending",
  "retryable": true,
  "facts": {
    "verdict": "pass",
    "review_status": "pending_current_wh_review",
    "evidence_ref": "test/final-test-report.md",
    "close_ready_for_merge_gate": false
  },
  "missing_items": ["current wh-review pending"],
  "user_decision": false,
  "needs_human": false,
  "reason": "Fresh acceptance passed; current wh-review must pass before merge gate."
}
```

路径 C 的存在是为了解决 current core receipt 的时序自引用问题；不得把它当作 merge 许可。

D7 color semantics must stay compatible with the current stage-result contract:
use `success|failed|unknown`, not new status enum values. Never write `green`, `yellow`, or `red` to `stage-result.status`.

- all checks pass -> `success`
- yellow condition -> `unknown`
- red condition -> `failed`

The color decision is a machine-hard-condition evaluation only, not an LLM
judgment. Red conditions include any freshness segment `content_hash` mismatch,
L3 git_sha mismatch, non-skipped missing L3 report, `missing_ac_coverage[]`
containing a critical AC, and `test-strategy 机器核查失败`. Yellow conditions
include `flaky_failure=true`, a test-strategy timeout or missing
`test-strategy.md`, or explicitly non-critical missing coverage when no red
condition exists. A browser-acceptance SKIP due to no UI scope in the spec is
not a yellow condition — it is a scope exclusion (recorded in `missing_items`
for traceability only) and does not change the color; if all other checks pass,
the result is `success`. unknown/yellow does not block progression by itself and does
not auto-approve irreversible actions. failed/red escalates for human confirmation and waits; do not automatically continue past a failed/red result.

### 13. metrics 结束

Call `updateOwnResult` to finalize the metrics record, then call `import("./metrics-writer.mjs").then(m => m.runMetricsWriter({ taskDir, taskId, verdict, executionId }))` to record task-metrics.jsonl for M10 baseline comparison. Metrics write failure only warns — it does not throw (FR-METRICS-002, F3).

### 14. 阶段结束 trace

After the stage-result and metrics end steps, append the final JSON line to
`evidence/stage-summary.jsonl`:

```json
{"event":"stage_summary","phase":"end","ts":"<ISO8601>"}
```

Then machine-validate the trace file: `stage_summary 行数必须等于 2`; 第 1 行 `phase` 必须是 `start`，第 2 行 `phase` 必须是 `end`. A count or ordering mismatch is a visible quality fact in the final report.

## Produce a stage-result

When verification is complete, write a `stage-result` record with:

```json
{
  "status": "success",
  "error_code": "",
  "retryable": false,
  "facts": {
    "verdict": "pass",
    "evidence_ref": "<relative path to final-test-report.md>",
    "close_commit_sha": "<commit_sha produced by close 步骤①归档 commit; present only when close ran>"
  },
  "missing_items": [],
  "user_decision": true,
  "reason": "All acceptance criteria verified and documented."
}
```

Also record a metrics entry via the collector. Call `recordSkeleton` at stage start and `updateOwnResult` at stage end, passing at minimum:

> **M10 wiring**: After calling `recordSkeleton` and `updateOwnResult`, also call `../../workflows/verify-code/metrics-writer.mjs` `runMetricsWriter({ taskDir, taskId, verdict, executionId })` to record task-metrics.jsonl for baseline comparison (FR-COLL-001).

```json
{
  "execution_id": "<uuid>",
  "skill_or_stage": "verify-code",
  "stage": "verify-code",
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

### Receipt verification

After writing stage-result, call:

```js
const { verifyReceipts } = await import("../../scripts/validate-stage-result.mjs");
const receiptResult = verifyReceipts("verify-code", "<stageResultPath>", "<worktreeRoot>");
if (!receiptResult.ok) {
  process.stderr.write(`[receipt] FAIL: ${receiptResult.errors.join("; ")}\n`);
  process.exit(1);
}
```
