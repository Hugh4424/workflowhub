---
name: verify-code
description: Run a full verification pass against the spec acceptance criteria and produce a final test report and verdict.
---

# verify-code

## Goal

Confirm that the implementation satisfies every acceptance criterion in the spec. Produce a final test report and an explicit pass/fail verdict before the change is considered deliverable.

## Scope boundary: verify-code vs verify-change

**`verify-code`** is this skill — stage 5, test-acceptance. It reads the spec's acceptance criteria and the implementation from `build-code`, runs the test suite, and writes `final-test-report.md` and `test-acceptance/summary.md`.

**`verify-change`** is a different concept — verifying a diff at code-review time (checking whether a proposed change is safe to merge). That is not this skill's responsibility. `verify-code` checks whether the code meets the spec; `verify-change` checks whether the diff is reviewable. If you are asked to "verify the change", confirm which meaning is intended before proceeding.

## What to do

### 1. 前置读取

**Path resolution (FR-TASKDIR-001)**: Resolve all task-dir paths via `parseTaskDir` — do not hard-code `tasks/{task-id}/`.

```javascript
// AC-16 consumable call — grep: parseTaskDir
import { parseTaskDir } from "./core/task-dir-parser.mjs";
const taskDir = parseTaskDir(); // reads config/workflowhub.yaml task_dir, falls back to ~/Knowledge/workflowhub/
```

Read `{taskDir}/{task-id}/stage-result-build-code.json`, extract `facts.tests.command`. If the command field is missing, surface an explicit error and stop. Do not proceed silently without a test command.

**Handoff 累积（补读上游）**：无条件读取以下三份上游产物，作为 build-code 结果之外的补充上下文：

- `specs/{task-id}/spec.md` 的验收标准部分 — 用于第 5.5 步核对实现是否覆盖每条验收标准。spec 产物按项目约定落在 `specs/{task-id}/`，不在 `taskDir` 下（`taskDir` 是 task-execution-record 目录，见 `config/workflowhub.yaml` 的 `task_dir`）；路径写法参考 `workflows/build-plan/SKILL.md` 读 spec 的方式。
- `{taskDir}/{task-id}/plan.md` — 了解原定实现步骤和范围边界。
- decision-log（`{taskDir}/{task-id}/decision-log.md` 或等价记录）— 了解最初决策与需求覆盖范围。

若某份文件缺失，记录在 `missing_items`，不阻断本阶段推进。

### 2. metrics 开始

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

These are the M4 record-schema core fields (`execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`). Use `metrics/collector.mjs` — do not hand-write a raw jsonl line with only `skill/stage/event/ts`.

### 3. fresh 测试执行

Call `node workflows/verify-code/capture.mjs` with the command extracted in step 1. Write the evidence to `{taskDir}/{task-id}/evidence/fresh-capture.json` (path resolved via `parseTaskDir` — see step 1). The capture script records: exit code, git SHA, Test Files line, content hash, timestamp, and command — all durable, externally-verifiable facts.

### 4. 鲜度校验

Call `freshness.mjs` `checkFreshness` to compare the build-code git_sha against current HEAD. If `anomaly_flags` is non-empty, output visible warnings at the skill boundary (FR-FRESH-004). The `stale_sha` anomaly is informational only — it does not block or change the verdict.

### 5. 浏览器验收 (SKIP branch)

Determine if the task has UI acceptance items. Check the spec for `ui_change: true` or explicit browser/QA acceptance criteria.

- **No UI items**: SKIP browser acceptance. Record in `missing_items`: `"browser-acceptance: no UI acceptance items"`. Continue to step 6 (FR-BROWSER-002/003).
- **UI items exist**: Invoke `isolated-browser-qa.md` to perform browser-based acceptance verification. Record its results in the evidence bundle.

### 5.5 验收标准逐条覆盖核对

基于步骤 1 补读到的 `specs/{task-id}/spec.md` 验收标准部分，逐条核对实现是否真的覆盖，而不是只声称读过：

- 把验收标准拆成条目列表（每条一行）。
- 对每一条，标注：覆盖状态（`covered` / `not_covered` / `partial`）+ 证据（对应的测试用例名、fresh-capture 结果，或具体代码位置；没有证据的不能标 `covered`）。
- 生成一份逐条覆盖清单（表格或列表均可），写入 `final-test-report.md`（步骤 8 落盘的同一份报告，不另起新文件/新格式）。
- 若某条验收标准算不出覆盖状态（如证据缺失），标 `not_covered` 并记入 `missing_items`，不阻断本阶段推进。
- 这份覆盖清单同时是步骤 6 明文摘要"原始需求覆盖情况"那一条的事实来源。

### 6. 明文停顿 (收尾确认)

Before asking for confirmation, produce a plain-language decision brief following `docs/human-brief-template.md`'s seven elements, filled with this stage's facts:

1. 这阶段做了什么 — 跑了测试、核对了验收标准。
2. 审了几次、结论是什么 — 3rd-review 轮数 + 结论，以及本次 fresh 测试执行的通过/失败结论。
3. 这个 task 要解决什么 — 取自 spec.md / decision-log 的原始需求。
4. 已经怎么做 — build-code 的实现概述。
5. 原始需求覆盖情况 — 取自第 5.5 步产出的逐条覆盖清单，写清覆盖了哪些、有没有遗漏、有没有额外加的。
6. 现在结果 — 测试通过/失败、verdict。
7. 下一步 — 等待人确认合并。

全大白话中文，不出现内部产物名/字段名/编号（该模板的硬规则）。

摘要结尾使用模板"A. 决策 gate 阶段"格式给出"请确认"块，具体问是否确认合并 + 删分支这两个不可逆动作，每个选项写清含义和后果，例如：

```
请确认：
- **推荐：确认合并并删除分支** —— 后果：把 <feature-branch> 合并进 <target-branch>，然后删除 <feature-branch>，之后无法撤销。
- 只合并、暂不删分支 —— 后果：完成合并，但保留 <feature-branch> 以备回退。
- 暂停，不合并 —— 后果：本次改动留在原分支，不动 <target-branch>，你可以先看代码或提出修改。
```

摘要内容若有字段缺失（如覆盖情况算不出来），只记录 `missing_items` 并在摘要里显眼标注缺失，不阻断本步继续向人发出确认请求；是否合并的裁决权仍完全在人，机器不做二次质量判断。

Wait for explicit user confirmation before proceeding (FR-CLOSE-001/003). Do not execute merge or delete without user consent.

### 7. 收尾执行

- **User confirms**: Execute the merge and branch deletion. Set `user_decision=true`.
- **User rejects**: Set `user_decision=false`, terminate the skill, and record the reason in the stage-result (FR-CLOSE-002).

### 8. stage-result 落盘

Call `facts-assembly.mjs` `assembleStageResult` + `writeStageResult`. Write the stage-result to `{taskDir}/{task-id}/stage-result-verify-code.json` (FR-PATH-001). The `final-test-report.md` goes to `{taskDir}/{task-id}/test/` (FR-PATH-002) and must include the step 5.5 逐条覆盖清单 as one of its sections. Both paths resolved via `parseTaskDir` — see step 1.

The stage-result record has this structure:

```json
{
  "status": "success",
  "error_code": "",
  "retryable": false,
  "facts": {
    "verdict": "pass",
    "evidence_ref": "<relative path to final-test-report.md>"
  },
  "missing_items": [],
  "user_decision": true,
  "reason": "All acceptance criteria verified and documented."
}
```

### 9. metrics 结束

Call `updateOwnResult` to finalize the metrics record, then call `import("./metrics-writer.mjs").then(m => m.runMetricsWriter({ taskDir, taskId, verdict, executionId }))` to record task-metrics.jsonl for M10 baseline comparison. Metrics write failure only warns — it does not throw (FR-METRICS-002, F3).

## Produce a stage-result

When verification is complete, write a `stage-result` record with:

```json
{
  "status": "success",
  "error_code": "",
  "retryable": false,
  "facts": {
    "verdict": "pass",
    "evidence_ref": "<relative path to final-test-report.md>"
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
