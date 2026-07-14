---
name: make-decision
version: 2.0.0
description: Clarify requirements with the user via structured debate/review护城河, then produce a decision log that captures the agreed direction and scope.
---

## Environment Variables

下列环境变量控制本 skill 的可选护城河动作。所有变量均有默认值，可在 shell 中用 `export VAR=value` 覆盖（override）。不在 `config/workflowhub.yaml` 注册表中登记。

| 变量名 | 默认值 | 说明 | override 方式 |
|---|---|---|---|
| `MAKE_DECISION_DEBATE_PATH` | `/Users/Hugh/Hugh/Project/debate` | 外部 debate skill 路径；路径不可达时自动降级跳过 debate（skipped），记录 `debate_path_invalid: true` | `export MAKE_DECISION_DEBATE_PATH=/path/to/debate` |
| `MAKE_DECISION_SKIP_DEBATE` | `0` | `=1` 时强制跳过所有 debate 轮次，直接记录 `debate_1: skipped` / `debate_2: skipped`；非 `0`/`1` 值视为 `0`（warn+log） | `export MAKE_DECISION_SKIP_DEBATE=1` |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | `0` | debate 技能读取此变量以决定模式：`=1` 启用五方法庭模式（debate 内部并发）；`=0` debate 自动降级单人三档；非 `0`/`1` 值视为 `0`（warn+log）。make-decision 本身不读此变量控制 S1，S1 模式由运行时 teams 能力自动判定 | `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |
| `WORKFLOWHUB_TASK_DIR` | （无默认值，缺失则 fail-loud） | 所有阶段跟踪文件的存储根目录（task_tracking_root）；通过 `core/task-dir-parser.mjs` 解析，优先级：`WORKFLOWHUB_TASK_DIR` 环境变量（直接 task root）→ `~/.workflowhub/config.json` 的 `task_dir` 字段；若 config `task_dir` 是全局 Knowledge 根且存在 `Projects/<project-key>/tasks`，解析器会基于当前 git remote / `repo_root_map` 返回项目级 task root；两者均缺失时 fail-loud 非零退出，不使用默认路径，不静默降级 | `export WORKFLOWHUB_TASK_DIR=/path/to/workflowhub-tracking` |

## Metrics — Stage Start（最前置步骤）

**在执行任何 S0 及后续步骤之前**，先调用 `metrics/collector.mjs` 的 `recordSkeleton` 落下本次执行骨架记录，传入 M4 十核心字段：

```js
import { recordSkeleton } from "metrics/collector.mjs";

recordSkeleton({
  execution_id:        "<uuid>",        // 本次执行唯一 ID
  skill_or_stage:      "make-decision", // M4 核心字段
  stage:               "make-decision", // M4 核心字段
  skill_version:       "2.0.0",         // M4 核心字段
  executed:            true,            // M4 核心字段
  tokens:              null,            // M4 核心字段（阶段结束后 updateOwnResult 补填）
  duration_ms:         null,            // M4 核心字段（阶段结束后补填）
  rework_rounds:       0,               // M4 核心字段
  human_intervention:  true,            // M4 核心字段（本 skill 强制含人确认）
  friction_ref:        null,            // M4 核心字段
}, cfg);
```

阶段结束时调用 `updateOwnResult` 补填 `tokens`、`duration_ms`。

# make-decision

## Goal

Work with the user to surface the real problem, agree on the narrowest viable scope, and capture every significant choice in the decision log. The output is the single authoritative source for what the change is trying to do and why.

## What to do

本 skill 执行完整 12 步深化决策流程（S0–S10）。交互语义分三类：

1. **推进硬门（唯一）**：S9 用户批准是唯一不可逆推进硬门——必须经人确认才能推进到 S10 落盘，符合宪法"推进/不可逆操作经人确认"原则。
2. **交互澄清等待**：S2/S4/S7 是与用户对话收集输入的交互澄清等待——属于正常对话交互，不是推进门；每处均有默认/继续行为，不视为"阻断推进"。
3. **致命输入停止**：S3（`get_sources` 无法核实）和 S5（关键前置文件缺失）在输入不可用时按 let-it-crash 原则停下报错——属于"输入不可用的致命停止"，不是质量门，不同于推进硬门。

其余步骤失败均记录后继续推进（非阻断）。

---

## S0 背景扎根

**task record path bootstrap (AC-16 / FR-TASKDIR-001)**: 在读取、搜索、创建、或写入任何任务执行记录前，必须先通过 `core/task-record-paths.mjs` 解析当前任务目录；该入口内部调用 `parseTaskDir()`，并把 `~/.workflowhub/config.json` 的全局 Knowledge `task_dir` 自动落到 `Projects/<project-key>/tasks`。

```javascript
// AC-16 consumable call — grep: resolveTaskRecordPaths
import { resolveTaskRecordPaths } from "./core/task-record-paths.mjs";
const taskRecords = resolveTaskRecordPaths(taskId);
const taskDir = taskRecords.task_tracking_root;
const taskRoot = taskRecords.task_root;
```

本 skill 中所有 `tasks/{task-id}/` 路径均为文档速记写法。运行时必须使用 `taskRecords.*` 或 `path.join(taskRoot, ...)` 构造实际路径。不得在 repo-local `tasks/` 下查找或落盘任务执行记录，除非 `resolveTaskRecordPaths(taskId).task_tracking_root` 本身返回的就是该目录。

**目标**：加载当前任务上下文，建立调研基础。

1. 读取以下背景材料（如存在）：
   - `CONTEXT.md`（项目术语与约定）
   - 当前 `task-id` 对应的任务描述与原始输入
   - 已有 decision-log、research 文件（如存在）
   - `{taskDir}/{task-id}/` 目录下已有产物
2. 汇总背景要点：问题域、已知约束、核心术语。
3. 写 journal 事件：`event: "s0_context_loaded"`

---

## S0.5 scope-triage 分档

**目标**：判定本次决策的规模档位（lite 或 full），决定后续路径。

**分档逻辑**：
- **lite 档**：需求范围窄、影响面小、无跨模块依赖、用户明确不需要调研。
  - 仅跳过 S1 内部调研（记录 `s1: skipped: scope=lite`）和 S3 外部调研（记录 `s3: skipped: scope=lite`）。
  - S2 talk#1 以空内部调研上下文进入，S4–S10 正常执行。
- **full 档**：需求影响面广、跨模块、技术决策复杂、或不确定性高。
  - 执行完整 S0–S10 所有步骤，包含 S1 内部调研和 S3 外部调研。
- **无 quick 档**：不存在 quick 档概念，只有 lite 和 full。

写 journal 事件：`event: "s0_5_scope", scope: "lite"` 或 `event: "s0_5_scope", scope: "full"`

---

## S1 内部调研（full 档专属）

**触发条件**：仅当 S0.5 判定为 full 档时执行；lite 档记录 `s1: skipped: scope=lite` 后跳过，直接进 S2。

**目标**：在 S2 talk#1 之前，通过并发子代理完成内部调研，为 talk 提供有依据的上下文。

**执行模式选择**（由运行时 teams 能力自动判定）：

- **sub-agent 模式**（首选，运行时 teams 能力可用时）：
  1. 并发派发 **≥3 sub-agents**（可跨 agent 分组），分别覆盖以下五类内容：
     1. **领域背景与术语澄清**：相关概念定义、核心术语、问题域知识。
     2. **历史先例与经验教训**：类似决策的先例、已知陷阱、历史教训。
     3. **codebase 相关实现**：当前约束、接口、路由、受影响模块的实际代码现状。
     4. **外部生态最佳实践**：业界参考方案、标准做法、最佳实践。
     5. **已知风险与反向案例**：known risk、失败案例、反向证据。
  2. 汇总 sub-agents 产出，写入 `tasks/{task-id}/research/internal-research-summary.md`（含每类来源标记、sub-agent 执行记录、汇总结论）。
  3. 写 journal 事件：`event: "s1_complete", s1_mode: "subagent"`

- **inline_serial 模式**（兜底，运行时 teams 能力不可用时）：
  1. 在当前上下文内**串行**逐一完成同样五类内容的调研切片，覆盖：
     1. 领域背景与术语澄清
     2. 历史先例与经验教训
     3. codebase 相关实现
     4. 外部生态最佳实践
     5. 已知风险与反向案例
  2. 将五类切片汇总，写入 `tasks/{task-id}/research/internal-research-summary.md`（同 sub-agent 模式格式）。
  3. 写 journal 事件：`event: "s1_complete", s1_mode: "inline_serial"`

**失败处理**（非阻断）：
- sub-agent 模式：任一 sub-agent 失败 → 记录该 agent ID 和原因到 `internal-research-summary.md`，继续合并其余产出；全部失败 → 写 journal 事件 `event: "s1_all_agents_failed", reason: "<失败原因>"`, `s1_mode: "subagent"`，继续推进到 S2。
- inline_serial 模式：任一切片失败 → 记录失败切片编号和原因，继续其余切片；全部失败 → 写 journal 事件 `event: "s1_all_agents_failed", reason: "<失败原因>"`, `s1_mode: "inline_serial"`，继续推进到 S2。
- 无论成功或失败，S1 均非阻断，必须继续到 S2。

---

## S2 第一次对话（呈现内部调研摘要，询问是否查外部资料）

**目标**：向用户呈现内部调研摘要，收集"是否需要外部双路调研"的判断，完成第一轮对话。对话执行参照 in-repo skill：`skills/talk-with-zhipeng/SKILL.md`。

**三轮结构**：本阶段是第一轮，后续 S4 完成第二轮，S7 完成第三轮；三轮均使用 `skills/talk-with-zhipeng/` 的一次只问一个问题、按影响排序原则。

**执行步骤**：

1. 先向用户呈现 `tasks/{task-id}/research/internal-research-summary.md` 的短摘要。
   - 小范围任务：直接说明"这次范围很小，已跳过内部调研"，不把内部标记暴露给用户。
2. 按影响排序（FR-TALK-02），一次只问一个问题（FR-TALK-01）。面向用户时只给大白话选项：
   - **小范围任务**：不再询问是否查外部资料，因为后续本来就会跳过。记录跳过外部调研事件，原因写为"小范围任务"，然后进入下一步。
   - **需要认真查证的任务**：问用户："要不要再查一轮外部资料来补证据？"
3. 等待用户回答（仅需要认真查证的任务）：
   - **推荐：需要查**。后果：多花一点时间，但方向更稳，后面分歧会少一些；用户确认后继续 S3 外部调研。
   - **可选：不查**。后果：推进更快，但如果背景判断不够全，后面可能返工；记录 `s3: skipped(user_decision)`，直接进 S4。

---

## S3 双路外部调研（条件触发）

**触发条件**：S2 Q1 用户确认需要，**且** S0.5 为 full 档。
lite 档无论用户是否同意，均记录 `s3: skipped: scope=lite` 后跳过。

**执行步骤**：

1. **路径 A — muyu-search-mcp**：
   - 调用时必须传 `extra_sources 3`（FR-RESEARCH-01）。
   - 调用后必须执行 `get_sources` 校验；`get_sources` 无法核实时，**立即执行以下停止流程**，不得自动降级：
     1. 写入失败产物 `tasks/{task-id}/artifacts/s3_get_sources_unverified.md`，内容必须包含：
        - 失败搜索路径（search path）
        - 实际使用的查询（query）
        - 原始错误信息（raw error）
        - 时间戳
     2. 写 journal 事件：`event: "s3_get_sources_unverified", search_path: "<路径>", query: "<查询>", raw_error: "<原始错误>"`
     3. 向用户报告失败并等待指令；**在用户显式解决（确认跳过或提供替代来源）前，不得进入 S4 及后续任何阶段**。
   - 若单路返空：记录该路为空，继续另一路；**双路均返空则立即执行以下停止流程**：
     1. 写入 artifacts 文件 `tasks/{task-id}/artifacts/make-decision-dual-research-empty.md`，内容须包含 `dual_research_empty: true` 字段。
     2. 写 journal 事件：`event: "s3_dual_research_empty"，dual_research_empty: true`
     3. 向用户报告：两路外部调研（muyu-search-mcp 和 anysearch）均返空，无法合成摘要。
     4. 等待用户显式指令（确认跳过 S3 或提供替代来源）；**在用户显式解决前，不得进入 S4 及后续任何阶段，绝不合成摘要**。

2. **路径 B — anysearch**：
   - 独立并行调用，不依赖路径 A 结果。

3. **仅在非双路空时**：汇总双路产出，写入 `tasks/{task-id}/research/external-research-summary.md`。若双路均空已触发停止流程，则跳过本步，不合成摘要。

**跳过事件**：用户不需要时记录 `s3: skipped(user_decision)`；lite 档时记录 `s3: skipped: scope=lite`。

---

## S4 第二次对话：收拢方向（台账渲染点①）

**目标**：向用户展示调研汇总与初步方向，通过第二轮对话收拢方向；完成台账渲染点①。对话执行参照 in-repo skill：`skills/talk-with-zhipeng/SKILL.md`。

**执行步骤**：

1. 汇总 S1/S3 调研产出（或空/跳过说明），向用户展示方向摘要。
2. 按影响排序，**一次只问一个问题**（FR-TALK-01/02）：
   向用户询问："你是否认同当前方向草案？有没有必须补充的硬约束，或需要排除的内容？"
   - **推荐：确认当前方向，并补充必要约束**。后果：后续审查和落盘都有明确依据，返工概率最低。
   - **可选：先调整方向**。后果：当前流程会多一轮整理，但能避免把不认可的方向写进最终记录。
   - **可选：暂时拿不准**。后果：先把不确定点记入开放问题，后续在 S9 前必须再次确认。
3. 接收用户回答后，记录 journal 事件 `event: "s4_baseline_recorded"`（非阻断，不等确认直接继续）。
4. **台账渲染点①**：将用户原始需求/聊天原文落盘为：
   `tasks/{task-id}/artifacts/make-decision-original-context.md`
   内容：逐条列出原始需求、初始状态标注。
   S5 依赖此文件存在（S5 开始前必须已落盘）。

---

### Phase A — Scope triage（legacy reference）

> 以下为 M7 基线兼容参考（原组件路径：`skills/scope-triage/SKILL.md`），新流程请以 S0–S10 各节为准。

1. Research the current landscape (existing code, docs, constraints) before asking questions.
2. Ask focused questions to pin down: what is broken or missing, who is affected, what the smallest deliverable is, and what the biggest unknowns are.
3. Classify each candidate requirement as **in-scope** or **out-of-scope**:
   - In-scope: directly addresses the stated problem, within the user-confirmed effort boundary.
   - Out-of-scope: speculative, future-looking, or adds cost without fixing the stated problem (YAGNI).
4. Propose a direction in plain language — what will change, why, and what "done" looks like.
5. Wait for the user to confirm the direction before moving on.

### Phase B — Decision log (see `skills/decision-log/SKILL.md` for full detail)

Follow the canonical 7-section structure defined in `skills/decision-log/SKILL.md` exactly:

1. Converge the confirmed direction and scope into a structured decision log file.
2. Write the file to `tasks/<task>/decision-log.md` using the canonical 7 Chinese sections from `skills/decision-log/SKILL.md`:
   1. **原始需求（原文）** — verbatim user requirement text.
   2. **问题与目标** — the core problem being solved and the explicit goal.
   3. **决策记录** — one entry per decision; each entry MUST carry a non-empty `来源证据` field. The chosen direction maps to facts key `decision`.
   4. **假设** — explicit assumptions not stated in the requirement.
   5. **明确不做** — items explicitly excluded, with brief reason each. The in/out boundary maps to facts key `scope`.
   6. **开放问题** — items still ambiguous or awaiting approval.
   7. **验收标准** — acceptance criteria verifiable after implementation.
3. Record the path of this file as facts key `decision_log_path`.
4. Record `flow_profile` in `decision-log.md` as a 字符串 field on the task's decision record, using `full_vibecoding` or `fast_make_decision_to_code` as the suggested values. This is an informational placeholder only.

## Produce stage-result

When the stage is complete, write a `stage-result` record with:

```json
{
  "status": "success",
  "error_code": "",
  "retryable": false,
  "facts": {
    "decision": "<one-sentence summary of the agreed direction>",
    "scope": "<brief description of what is in scope and what is explicitly excluded>",
    "decision_log_path": "tasks/<task>/decision-log.md",
    "flow_profile": "<full_vibecoding | fast_make_decision_to_code>"
  },
  "missing_items": [],
  "user_decision": true,
  "reason": "User confirmed direction and scope."
}
```

`facts.flow_profile` contract:

- `flow_profile` is required and must be a 字符串. If the field is 缺失 or 非字符串, fail-loud before handing off to downstream stages.
- Suggested values are `full_vibecoding` and `fast_make_decision_to_code`, but this round does 不做枚举约束; 枚举校验逻辑接入推迟.
- Downstream build-spec/build-plan/build-code/verify-code may read `flow_profile` as 只读 context only: 不得写入, 不得校验, 不得据此分支, 不得阻断.
- `flow_profile` 本轮不驱动任何行为差异.

Also record a metrics entry via the collector. Call `recordSkeleton` at stage start and `updateOwnResult` at stage end, passing at minimum:

```json
{
  "execution_id": "<uuid>",
  "skill_or_stage": "make-decision",
  "stage": "make-decision",
  "skill_version": "2.0.0",
  "executed": true,
  "tokens": null,
  "duration_ms": null,
  "rework_rounds": 0,
  "human_intervention": true,
  "friction_ref": null
}
```

These are the M4 record-schema core fields (`execution_id`, `skill_or_stage`, `stage`, `skill_version`, `executed`, `tokens`, `duration_ms`, `rework_rounds`, `human_intervention`, `friction_ref`). Use `metrics/collector.mjs` — do not hand-write a raw jsonl line with only `skill/stage/event/ts`.

---

## S5 单次独立盲审（3 条建议）+ 第一次 debate 门控

**前提**：`tasks/{task-id}/artifacts/make-decision-original-context.md` 必须已存在（由 S4 台账渲染点①落盘）。S5 开始前检查，缺失则报错停止。

**目标**：以 `ReviewRoundFacade` 的 direction/detail V4 flows 审查 S4 产物。

### 1. 单次独立盲审

Build two V4 packets and call `ReviewRoundFacade` for the isolated `direction` and
`detail` flows. The first has only the raw requirement; the second adds the decision
log. Provider material stays packet-only.

- `skills/intake-decision-review/SKILL.md`：同时审查方向合理性、问题框架设定、范围边界合理性、技术可行性（D8 新增第四维 `feasibility`）。

审查结果必须包含以下字段：

```
packet_hash: <冻结 review-packet.v1 的哈希，用于隔离验证>
findings: <V4 finding 数组，带 provider 证据>
```

每条 `findings` 建议必须包含：

```
finding_id: <稳定 ID>
severity: <blocking|non_blocking>
summary: <问题摘要>
recommendation: <可执行建议>
evidence: <对应 S4 内容或调研依据>
```

### 2. 结果整理与失败语义

- 若 provider 失败或材料不完整 → 记录 transport/packet diagnostic，不生成语义结论，也不降级为其他审查路径。
- 若 `findings` 中出现四类角度（direction/framing/scope/feasibility）之外的标签，或某角度整体未被审查（而非"该角度确实无发现"），视为审查输出不合格，要求 reviewer 重跑或补齐；不自行编造建议，也不因怕超限而截断真实问题。
- 审查结果只由 private receipt 与公开 core receipt 表示：
  - `direction_divergence`: `true`/`false`（方向分歧标记）
  - `findings`: V4 合并 finding 及 provider 证据

写 journal 事件：`event: "s5_blind_review_done"`。

### 3. Blocking 留痕格式

凡 blocking 事项必须按固定三行格式留痕：

```
反对 X：<反对的具体内容>
决定 Y：<用户最终决定>
理由 Z：<决定的理由>
```

缺则留痕不完整，S10 落盘前须补全（S10 落盘前完成，否则视为 incomplete blocking 留痕）。

### 4. Debate 门控（第一次 debate）

**入口检测（CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS）**：调用 debate 技能前，记录 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` 的当前状态——已设置（`=1`）还是未设置/`=0`——写 journal 事件 `event: "debate_env_checked", agent_teams: "<当前值>"`，并透传给 debate 技能，由 debate 技能决定启用五方法庭模式（`=1`）或自动降级单人三档（`=0`）。make-decision 本身不读此变量控制 debate 是否触发。

make-decision **委托 debate 技能自己判断是否触发**（debate 技能内部执行 Step 1 触发判定 + 环境自动判定五方法庭/单人三档）。make-decision 在**主调用层**执行 debate，不下派子代理。

**禁止行为（D4）**：debate 触发判定只基于 V4 core receipt 的 finding ID 列表，严禁在审查外自行制造争点。

按以下优先顺序判定：

1. `MAKE_DECISION_SKIP_DEBATE=1` → 记 `debate_1: skipped`，跳过 debate，继续 S6。
2. `MAKE_DECISION_DEBATE_PATH` 不可达（路径无法访问）→ 写 journal 事件 `event: "debate_1_skipped", reason: "debate_path_invalid"` 和 `debate_path_invalid: true`，记录 `debate_1: skipped`，降级继续，不阻断流程。
3. 其余情况：提取 core receipt 中具体的 finding ID 列表，传入 debate 技能 + Claude 决策 + decision-log 版本。
   - debate 技能触发时：产出 `tasks/{task-id}/artifacts/make-decision-debate-1.md`（含裁决书），写 journal 事件 `event: "debate_1_triggered"`。
   - debate 技能不触发时：写 journal 事件 `event: "debate_1_skipped", reason: "<debate 技能返回的 skip reason>"`。

---

## S6 展示盲审/debate 结果给用户

**目标**：独立展示步骤（独立展示步骤），向用户呈现 S5 单次盲审的 3 条审查建议与 debate 裁决。

**执行步骤**：

1. 展示单次盲审 findings 摘要，包含 3 条审查建议。
2. 展示 `direction_divergence` 状态（divergence 是否存在）。
3. 展示 debate 裁决结论或 skip 原因：
   - 若 debate 已触发：展示 `make-decision-debate-1.md` 的裁决结论（skipped 时说明 skip 原因）。
   - 若 `debate_1: skipped`：说明 skipped 原因。
4. 不等确认，展示完即继续（continue immediately，不阻断）。

写 journal 事件：`event: "s6_results_shown"`

---

## S7 第三次对话 → grill → draft → orchestrator → 第二次 debate

**目标**：依序完成深度追问、专项核查、决策日志草稿、orchestrator 审查、第二次 debate 门控。

### 1. 第三次对话（按影响排序追问）

依赖 S5/S6 产物，不得在 S7 之前执行（must not execute before S7）。

- 综合 S5 的 3 条审查建议与 S6 展示结论，按影响排序生成第三轮追问清单；对话执行参照 `skills/talk-with-zhipeng/SKILL.md`。
- 一次只问一个问题（FR-TALK-01/02），等待用户回答。

写 journal 事件：`event: "s7_talk3_done"`

### 2. grill（纯委托 grill-with-docs）

退出条件：用户须对四件事——做了什么 / 为何 / 不做什么 / 怎么验证——逐条确认（或对全部四条整体回复"以上都对"），单一是非题式回复（例如只回一句"对"而未指明针对哪几条）不算确认，须追问澄清到位。

纯委托（pure delegation）给 `skills/grill-with-docs/SKILL.md` 执行，退出逻辑（含其内部客观 checklist）由其内部控制，不在本 agent 内联展开。

**成功分支**：
- 产出：`tasks/{task-id}/artifacts/make-decision-grill-with-docs.md`（grill 会话记录）
- 写 journal 事件：`event: "s7_grill_done", s7_grill_done: true`

**失败/不可达分支**（非阻断）：
- 当 `skills/grill-with-docs/` 路径不可达或调用失败时：
  1. 创建 `tasks/{task-id}/artifacts/make-decision-grill-with-docs.md`，内容写明失败原因（路径不可达 / 调用错误 / 错误信息）。
  2. 写 journal 事件：`event: "s7_grill_done", s7_grill_done: false, reason: "<失败原因>"`
  3. 以该失败产物作为降级输入，继续进入 draft 步骤，不阻断主流程。

### 3. draft（决策日志草稿）

产出：`tasks/{task-id}/artifacts/make-decision-decision-log-draft.md`

草稿正文须引用 `make-decision-grill-with-docs.md` 路径（作为核查来源依据）。

草稿包含 7 节：

1. **原始需求** — 原始需求原文
2. **问题与目标** — 核心问题与目标
3. **决策**（D1–D6）— 各项决策条目
4. **假设** — 明确假设
5. **明确不做** — 明确排除项
6. **开放问题** — 待定事项
7. **验收标准** — 可验证的验收标准

写 journal 事件：`event: "s7_draft_complete"`

### 4. orchestrator 审查 + 第二次 debate

**orchestrator 实现**：本步骤的 orchestrator 审查由 `skills/intake-review-orchestrator/SKILL.md` 承担（ZHI-93 遗漏加固机制），不是抽象占位描述。调用时按其"审查合同"组装 `materials`：`draft`（S7.3 产出的 decision-log 草稿）、`s4_baseline`（S4 原始需求台账）、`authoritative_definitions`（decision-log 权威定义表）、`s5_findings`（S5 单次盲审结果）。`intake-review-orchestrator` 不设跳过分支，S7 draft 产出后必须执行一次。

**入口检测（CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS）**：调用 debate 技能前，记录 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` 的当前状态——已设置（`=1`）还是未设置/`=0`——写 journal 事件 `event: "debate_env_checked", agent_teams: "<当前值>"`，并透传给 debate 技能，由 debate 技能决定启用五方法庭模式（`=1`）或自动降级单人三档（`=0`）。make-decision 本身不读此变量控制 debate 是否触发。

make-decision **委托 debate 技能自己判断是否触发**（与 S5 相同，debate 技能在主调用层执行，不下派子代理）。

**禁止行为（D4）**：debate 触发判定必须基于 orchestrator 产出 artifact 中的具体 finding ID 列表（争点来源），**严禁在审查外自行制造争点**。make-decision 只负责提取并传递 orchestrator 产出的 finding ID 列表（可为空）和相关上下文；是否触发、以及无有效争点时如何降级，均由 debate 技能 Step 1 自行裁决。

- orchestrator 审查草稿，将 findings **附加**到草稿末尾 `## orchestrator-findings` 节，**不覆盖正文**（不覆盖）。
- 按以下优先顺序执行第二次 debate 门控（make-decision 不自行判断 blocking 有无，由 debate 技能 Step 1 自判触发）：
  1. `MAKE_DECISION_SKIP_DEBATE=1` → 写 journal 事件 `event: "debate_2_skipped", reason: "MAKE_DECISION_SKIP_DEBATE=1"`，跳过。
  2. `MAKE_DECISION_DEBATE_PATH` 不可达 → 写 journal 事件 `event: "debate_2_skipped", reason: "debate_path_invalid"` 和 `debate_path_invalid: true`，记录 `debate_2: skipped`，降级继续。
  3. 其余情况：提取 orchestrator 产出 artifact 中的 finding ID 列表（争点来源，可为空），传入 debate 技能 + Claude 决策 + decision-log 版本，由 debate 技能的 Step 1 自行判断是否触发；读回裁决书。
     - debate 技能触发时：产出 `tasks/{task-id}/artifacts/make-decision-debate-2.md`，写 journal 事件 `event: "debate_2_triggered"`。
     - debate 技能不触发时：写 journal 事件 `event: "debate_2_skipped", reason: "<debate 技能返回的 skip reason>"`。

---

## S8 台账渲染点② + CONTEXT 同步

**目标**：S7 完成后，逐条渲染台账终态，并将决策上下文同步到项目文档。

### 1. 渲染点②——台账全量渲染

S7 结束后，逐条渲染台账（ledger）所有条目，写入 `tasks/{task-id}/artifacts/make-decision-ledger-final.md`：

- 每一条目须有明确状态（接受 / 丢弃 / 待定），**无"状态未知"条目**。
- 所有"丢弃"条目**必须**含驳回理由；禁止静默丢弃（**FR-LEDGER-02**）。
- 若渲染过程中发现条目状态不清晰，须在台账末尾追加说明，不得留白。

### 2. 新想法回退判定（FR-LEDGER-03）

- 产出新 task 候选列表（可为空列表），写入台账末尾 `## 新想法候选` 节。
- 新想法**不得**自动扩大当前 task 范围；须走回退路径（backtrack）单独立项或留作 backlog。
- 候选列表为空时，记录 `新想法候选: []`；不可缺失该节。

### 3. 同步 CONTEXT.md / ADR / project-memory.json

- 若 S7 产出导致项目方向、术语、决策有实质变更：
  - 更新 `CONTEXT.md` 中受影响的术语或背景描述。
  - 若有架构决策，补写 ADR 条目（追加，不覆盖历史）。
  - `project-memory.json` 二选一，不可默认跳过：要么同步更新其中受影响的字段，要么显式写入"本次无需变更"及理由（例如该变更不涉及 project-memory.json 记录的字段范围）。CONTEXT.md/ADR 有更新但 project-memory.json 既未同步、也未显式写理由，视为遗漏，须补齐后才能继续。
  - 写 journal 事件：`event: "s8_context_synced"`
- 若无任何内容变更（决策与现有文档完全一致）：
  - 以上三个文件**不强制写入**。
  - 写 journal 事件：`event: "s8_context_no_change"`

---

## S9 用户批准（唯一硬门）

**S9 是全流程唯一强制确认硬门（FR-ACCEPT-02）。** 所有其它步骤均不得以"用户默认同意"为由自动放行；只有 S9 获得明确批准后，流程才可进入 S10。

### 1. 展示完整决策摘要（大白话七要素 + 请确认）

向用户展示完整决策摘要，**内容须包含（FR-ACCEPT-03）**，格式按 `docs/human-brief-template.md` 的"七要素 + A. 决策 gate 阶段结尾"输出：全篇大白话中文（当对方是高中生），不出现内部产物名/字段名/编号（如 `decision-log.md`、`s9_user_approved`、`FR-ACCEPT-03` 等——要提就翻成人话）。七要素与本阶段已有内容的对应关系：

1. **这阶段做了什么**——用一句话说清本次沟通/澄清做了什么。
2. **审了几次、结论是什么**——把 S5 独立盲审 + debate_1/debate_2 是否触发、每轮的结论（或"未触发，直接通过"）翻成大白话说清楚，不出现"blind review"/"debate"这类内部名词。
3. **这个 task 要解决什么**——原始需求要解决的问题（一句话）。
4. **准备怎么做**——即原有的**方向**（已确认的解决方向，一句话）与**范围**（明确本次做什么、不做什么），以及**关键约束**（影响实施的硬约束）。
5. **原始需求覆盖情况**——覆盖了原始需求的哪些点、有没有遗漏、有没有额外加的；内容来自**待办列表台账**（台账所有条目逐条核对：接受 / 丢弃 / 新想法候选），用大白话说清楚，不直接甩"台账"这个词的原始条目格式，而是说人话（比如"你要的 X、Y、Z 都覆盖了，额外加了一条 W"）。
6. **现在结果**——决策沟通已完成，等待用户拍板。
7. **下一步**——用户确认后进入 S10 落盘决策记录。

七要素之后，加"请确认"结尾块（模板 A 类）：
```
请确认：
- **推荐：继续** —— 后果：<写清继续会发生什么，如"进入落盘阶段，把这次讨论定下来的方案正式记录">
- 修改后继续 —— 后果：<写清会按用户意见重做哪部分>
- 暂停 —— 后果：<写清不推进、保留什么>
```

若上述某个要素的信息暂缺（例如本次未触发任何审查、或台账为空），只如实写"这项本阶段没有/为空"，照常展示、照常等确认；**信息不全不是不能展示的理由，也不得因此额外拦一道机器判断**——展示是否完整由人看了自己判断，不新增自动核查步骤。

### 2. 等待用户明确确认

- 等待用户明确"同意"或等效确认（如"ok"、"approve"、"确认"、"通过"，对应上面的"继续"）。
- 用户未确认时**无限等待**；不确认就不继续，**不得自动通过**，不得以超时为由继续。
- 用户选"修改后继续"或"暂停"：按用户意见处理后再回到本步重新展示确认，不写 `s9_user_approved: true`。
- 用户选"继续"：写 journal 事件：`event: "s9_user_approved", s9_user_approved: true`

### 3. 错误声明

**明确写入**：跳过 S9 直接进入 S10 视为**错误**（error）；任何绕过此硬门的行为均违反本 skill 契约。

---

## S10 decision-log 落盘 + stage end updateOwnResult

**目标**：将最终决策落盘为规范的 `decision-log.md`，并通过 `metrics/collector.mjs` 记录 M4 指标。

### 1. 落盘前检查

落盘前检查审查产物完整性：

- 若存在 `severity: blocking` 的审查意见，但 core receipt 及 debate 裁决书中**缺少**三行留痕格式：
  ```
  反对 X：<内容>
  决定 Y：<内容>
  理由 Z：<内容>
  ```
  则**不得**标记"落盘完整"，须先补全三行留痕后再继续。

### 2. 确定写入根目录

通过 `core/task-record-paths.mjs` 解析 `taskRecords`，以确定本次任务跟踪文件写入根目录：

- 优先级 1：`WORKFLOWHUB_TASK_DIR` 环境变量（已设置且非空时直接作为 task_tracking_root 使用，无 `/tasks` 后缀截断）
- 优先级 2：`~/.workflowhub/config.json` 的 `task_dir` 字段；若该值是全局 Knowledge 根且存在 `Projects/<project-key>/tasks`，`resolveTaskRecordPaths(taskId)` 必须返回项目级 task_tracking_root
- 两者均缺失：fail-loud，非零退出，明确报错；无默认路径，不静默降级
- 获取 `taskRecords` 后使用 `taskRecords.decision_log`、`taskRecords.journal`、`taskRecords.worktree_json` 等路径，不得再额外拼接一层 repo-local `tasks/`

### 3. 产出 decision-log.md

产出 `taskRecords.decision_log`，包含 7 节结构 + 执行环境字段：

1. **原始需求**——用户原始需求原文（verbatim）
2. **问题与目标**——核心问题与明确目标
3. **决策记录**——每项决策条目（D1–Dn），含来源证据
4. **假设**——明确假设（非需求原文中说明的前提）
5. **明确不做**——明确排除项，每项附简短理由
6. **开放问题**——仍存在歧义或待人确认的事项
7. **验收标准**——可验证的验收标准

**执行环境**字段（小节，写在 7 节之后）：记录本次执行中 7 个 env var 的检测结果，包含：
- 每个 env var 是否已设置、实际值（未设置时标注"使用默认值"）
- 检测过程中触发的降级事件（如 `dispatch_config_invalid`、`debate_path_invalid`、`runner_invalid`）及对应 env var 名称
- `WORKFLOWHUB_TASK_DIR` 是否已设置（未设置则 fail-loud，无降级）

文件顶部 frontmatter 包含字段：

```yaml
user_decision: true
```

### 4. S10 落盘后机器级自检（非 LLM 审查，脚本级 fail-loud）

decision-log.md 写入动作执行完毕后，不得只凭"执行了写命令"就判定完成，必须真跑以下机器级自检：

1. **落盘存在性校验**：真跑一次 `parseTaskDir()` 解析出的路径，对 `{taskDir}/{task-id}/decision-log.md` 做真实文件存在性校验（例如 `test -f` / `fs.existsSync` 或等价真实检测），不是 agent 凭记忆或凭"应该已经写了"主观判断。校验失败（文件不存在或路径不对）视为 S10 未完成，fail-loud 报错，不得静默继续。
2. **占位符扫描**：对落盘后的 decision-log.md 全文做占位符词表 grep 扫描（词表至少包含 `[占位符]`、`TBD`、`待后续` 等），若命中出现在决策性字段（第 3 节决策记录、第 7 节验收标准、权威定义表、外部依赖接口核实记录）中，直接 fail-loud，不得放行落盘。
3. **校验留痕**：本步骤实际执行的校验命令与校验结果，必须写进收尾评论/journal，不得只写"已校验"这类无证据结论。

### 5. 调用 metrics/collector.mjs updateOwnResult

调用 `metrics/collector.mjs` 的 `updateOwnResult`，写入 M4 十核心字段：

| 字段 | 说明 |
|---|---|
| `execution_id` | 本次执行 ID |
| `skill_or_stage` | `make-decision` |
| `stage` | `make-decision` |
| `skill_version` | SKILL.md 顶部 version 字段 |
| `executed` | `true` |
| `tokens` | 本次消耗 token 数 |
| `duration_ms` | 总耗时（毫秒） |
| `rework_rounds` | debate/review 轮次数 |
| `human_intervention` | `true`（S9 有人工确认） |
| `friction_ref` | 如有摩擦点记录路径，否则 `null` |

业务字段（`user_decision`、`s9_approved`、`debate_triggered` 等）放入 `facts` / 扩展字段，不覆盖 M4 核心字段。

写失败时 **warn 不 throw**（`console.warn` 记录错误，不中断流程）。

写 journal 事件：`event: "s10_decision_log_complete"`

---

## Worktree 规则（make-decision 阶段职责）

本节即 worktree 规则章节，定义 make-decision 阶段涉及 worktree 生命周期的完整规则（R1-R7）。

**task-id 归一化步骤（先归一化，再校验分支命名）**：branch 命名校验前必须先对 task-id 做归一化（normalize），步骤依次为：①小写（lower case，全部转小写）；②非字母数字字符折叠为连字符；③合并连续连字符为单个连字符（连续连字符须合并，例如 `--` → `-`）；④去除首尾连字符（去除首尾连字符，例如结尾的 `-` 须去掉）。归一化完成后才允许进入分支命名校验步骤。例如 "Worktree Unification" 归一化后得到 "worktree-unification"；"--foo--bar--" 归一化后得到 "foo-bar"。

- R1 task_tracking_root 读取：make-decision 阶段须通过 `parseTaskDir()`（`core/task-dir-parser.mjs`）读取最终 task_tracking_root，遵循 env var 直接根优先、`~/.workflowhub/config.json` 的 `task_dir` 次之、config 全局 Knowledge 根自动解析到 `Projects/<project-key>/tasks`、两者缺失 fail-loud 的顺序。**target_repo_root 不等于当前 checkout 上下文**：make-decision 阶段被调用时所在的 checkout 目录（例如沙箱临时 workdir）不得被默认当作 target_repo_root——该目录可能只是临时产物，非用户可见的持久 clone；target_repo_root 的真实来源须完全依照 R2 定义的 config 查表流程解析，不允许任何阶段绕过 R2 直接假定"当前工作目录即 target_repo_root"。
- R2 target_repo_root 探测与固化：解析逻辑须为通用的"探测 remote → 查表 → 校验"流程，不得在判断分支里写死任何具体仓库名（`repo_root_map` 里允许存在具体仓库条目，但代码/规则本身的判断逻辑必须是遍历查表的通用写法）。执行时序为「① 在当前 checkout 上下文执行 `git remote get-url origin`（或等价方式）取得该 checkout 的 git remote origin url → ② 读取 `~/.workflowhub/config.json` 的 `repo_root_map` 字段（结构为 `{"<git remote url>": "<持久本地 clone 路径>"}`），以①取得的 remote url 为 key 在该表中查找 → ③ 命中：取对应 value 作为候选 target_repo_root，须依次校验（a）该路径存在（`fs.existsSync` 或等价）、（b）该路径是合法 git 仓库（`git rev-parse --show-toplevel` 可执行且指向自身）、（c）该仓库的 `git remote get-url origin` 与①取得的 url 一致；三项全部通过才允许固化为 target_repo_root，任一项失败按未命中处理 → ④ 未命中（`repo_root_map` 中无此 remote url 对应 key，或候选路径三项校验未全部通过）：不得静默 fallback 到当前沙箱 checkout 路径或任何猜测路径，须 fail-loud 并 escalate_to_human，报错须附带该 remote url 与 `repo_root_map` 现有 key 列表，等待人工补充映射或确认后再继续 → ⑤ target_repo_root 固化后，按 R4 创建 worktree → ⑥ 基于该 target_repo_root 执行 `git worktree list --porcelain`，校验刚创建的 worktree 的 `worktree_root`/`branch`/同仓关系（commondir 须同源；linked worktree 的 gitdir 本身与主仓库不同属正常现象，不作为判定依据，只校验 commondir）→ ⑦ 校验通过后按 R5 首次写入 worktree.json」。任一环节不一致须 fail-loud，不得固化、不得跳步。**步骤⑥/⑦失败时的清理契约**：步骤⑥校验失败，或步骤⑦首次写入 `worktree.json` 失败，均须按顺序执行两步清理（`git worktree remove` 只移除 worktree 目录，不会删除本地分支，须显式补第二步）：(a) `git worktree remove` 清理步骤⑤刚创建的 worktree；该命令成功后须检查被移除 worktree 的父级目录，若父级目录因此变空，须执行 `rmdir` 清理该空容器；父级目录非空时不得删除。(b) 若步骤⑥校验涉及的分支为本次新建（非复用已有分支），额外执行 `git branch -D` 删除该本地分支。两步任一失败均单独记录失败详情（区分是 worktree 清理失败还是分支删除失败），并 escalate_to_human 附带残留路径/分支名，不得静默吞掉分支残留。固化后的 `target_repo_root` 后续阶段不再重新探测，直接读取该固化值。
- R3 分支命名 `workflowhub/{task-id}`：task-id 先执行归一化（见上文步骤①-④）完成后才继续。
  分支命名正则校验分两层：① 归一化产物本身（task-id slug，不含 `workflowhub/` 前缀）须满足正则 `^[a-z]+(-[a-z]+){1,2}$`（纯小写英文字母，连字符分隔，2-3 段，不允许数字，与 decision-log D3 及 spec.md §274/321 保持一致）；② 拼接 `workflowhub/` 前缀后得到的最终分支名须满足正则 `^workflowhub/[a-z]+(-[a-z]+){1,2}$`。下游（build-code §17 / verify-code）对 `branch` 字段的校验统一引用②的最终分支名正则，不引用①的裸 slug 正则。校验顺序须在归一化之后，不得颠倒。
- R4 worktree 创建时机：仅在 make-decision 阶段首次决定进入实现流程时创建 worktree（`git worktree add`），不得在其余阶段重复创建。**触发条件覆盖 debate 中途临时实现场景**：用户在 S5/S7 debate 等中途环节临时要求当场实现代码改动，同样视为"决定进入实现流程"——不因为这个决定发生在 S10 落盘之前、发生在 debate 环节中途、或用户措辞不是"进入实现阶段"而免于本规则。触发后必须先完整走完 R2-R5（探测并固化 target_repo_root → 建分支 → `git worktree add` 建 worktree → 首次写入 worktree.json）再动代码，不得在决策阶段用来跑 debate/审查的临时或复用 worktree 里直接改代码；已经违规改动的，须先按本节流程补建专属 worktree/分支/worktree.json，再把改动迁移过去。
- **worktree_root 路径公式（R4 创建与 R5 首次写入之间的强制约束）**：`worktree_root = path.dirname(target_repo_root) + '/' + {repo目录名}-{task-id}`（`{repo目录名}` 取 target_repo_root 的 basename，`{task-id}` 用 R3 已归一化的 slug）。即 worktree 必须建在 target_repo_root 的平行兄弟目录下，单层目录名，不得嵌套多层子目录（不得出现类似 `{task-id}/worktree/{repo名}` 这种3层结构），也不得建在 task_tracking_root（task_dir）下面。参考先例：agenthub apply 阶段的 worktree 隔离修复（`../{repo-name}-{feature}` 平行目录规则）。R4 执行 `git worktree add` 与 R5 首次写入 `worktree.json` 的 `worktree_root` 字段均须遵循本公式，不得各写各的。
- R5 worktree.json 首次写入：worktree.json 首次写入须包含 6 个字段，且一次性满足下游（build-code §17 / verify-code close①）common 校验，不得写出下游必然拒收的值：`target_repo_root`（绝对路径）、`worktree_root`（绝对路径，须满足上方 worktree_root 路径公式）、`branch`（R3 归一化+正则校验后的合法值）、`created_by_stage="make-decision"`、`push_policy`（固定值 `"verify-code-only"`，其他值 fail-loud，不得为空）、`status="active"`。写入须为原子操作（先写临时文件再 rename，或等价的写后校验+替换机制），避免进程中断留下半写/损坏的 `worktree.json`；若写入过程中发现磁盘上已残留部分写入或损坏的 `worktree.json`，须先删除该残留文件再重试或转入下方清理契约，不得让 build-code/verify-code 读到半写文件。
- R6 存在性/冲突检测：使用 `git worktree list --porcelain` 检测 worktree 是否已存在或冲突；发现僵尸 worktree（目录不存在但仍在 git 记录中）须 fail-loud 报错退出；发现路径/分支被其他 worktree 占用同样须 fail-loud，不得静默覆盖。
- R7 提交边界：在审查修复完成、`verify-final` 成功、当前 final flow 已获得 published semantic `pass` 且人工明确确认继续之前，make-decision 不得在 `target_repo_root` 或 `worktree_root` 执行 `git add`、`git commit` 或 `git merge`。decision-log 等目标仓库改动保留在同一 task worktree，供后续完整未提交 diff 和 R2 续跑使用；不得为本阶段结束制造中间提交或提前合并。唯一的普通实现提交由 `verify-code` 统一执行：满足上述条件后，才在该 task worktree 执行一次 `git add -A && git commit -m "workflowhub(verify-code): finalize {task-id}"`。`task_tracking_root` 下的写入（task 子目录、`worktree.json`、journal 等）照常落盘，不构成提交理由。target_repo_root 侧的 `git worktree add`/分支创建（R4）本身不构成"文件变更"。
**task 子目录创建职责**：make-decision 阶段负责幂等地创建 task_tracking_root 下的 task 子目录（`{task_tracking_root}/{task-id}/`）；若父目录（task_tracking_root）不存在，须 fail-loud 报错退出，不得自动创建父目录；若该 task 已处于 `status=cleaned`（已归档）状态，须 fail-loud 报错 "task 已归档"，不得继续复用。

**幂等复用前的 target_repo_root 一致性校验（FR-WORKTREE-MAKEDECISION-002 延伸）**：`{task_tracking_root}/{task-id}/worktree.json` 已存在且 `status=active` 时，不得仅凭 task-id 相同就静默复用——须先比对该 worktree.json 中记录的 `target_repo_root` 与本次调用（R2 探测得到）的 `target_repo_root` 是否完全一致；调用 `core/worktree-reuse-guard.mjs` 的 `checkWorktreeReuse(worktreeJsonPath, currentTargetRepoRoot, taskId)` 执行该判定：一致则返回 `{action: "reuse"}`，按现有 worktree.json 继续；不一致（同一 task-id 撞到不同项目）则 fail-loud 退出，报错须包含 task-id、worktree.json 中记录的 target_repo_root、本次调用的 target_repo_root 三项，提示用户更换 task-id 或核实目标仓库，不得把新一轮请求静默接到旧项目的仓库/worktree 上；worktree.json 不存在时返回 `{action: "create"}`，走 R4/R5 首次创建路径。

---

## Journal 事件流规范（S0–S10 全覆盖）

每个步骤 S0–S10 在 SKILL.md 中均有明确 journal 写入指令。事件统一写入 `tasks/{task-id}/journal.jsonl`，格式为：`{"event": "<稳定事件 key>", "<字段>": "<值>", ...}`。稳定 key 遵循 `s{N}_{event}` 命名；字段为结构化 kv。

lite 档跳过的 S1 / S3 均有对应 `event: "s1_skipped"` / `event: "s3_skipped"` journal 事件。

### 完整事件清单

| 稳定事件 key | 触发步骤 | 关键附加字段 | 说明 |
|---|---|---|---|
| `s0_context_loaded` | S0 | — | 背景加载完成 |
| `s0_5_scope` | S0.5 | `scope: "lite"` / `scope: "full"` | 分档判定结果 |
| `s1_complete` | S1（full 档） | `s1_mode: "subagent"` / `s1_mode: "inline_serial"` | 内部调研完成 |
| `s1_skipped` | S1（lite 档） | `reason: "scope=lite"` | lite 档跳过内部调研 |
| `s1_all_agents_failed` | S1（full 档） | `reason: "<原因>"`, `s1_mode: "subagent"/"inline_serial"` | 内部调研全部失败（非阻断） |
| `s2_talk1_complete` | S2 | — | Talk#1 完成 |
| `s3_complete` | S3（full 档） | — | 外部调研完成 |
| `s3_skipped` | S3（lite 档） | `reason: "scope=lite"` | lite 档跳过外部调研 |
| `s3_get_sources_unverified` | S3 | `search_path`, `query`, `raw_error` | get_sources 校验失败（阻断直至用户解决） |
| `s4_talk2_complete` | S4 | — | Talk#2 完成（如有） |
| `s4_baseline_recorded` | S4 | — | 台账渲染点①落盘 |
| `s5_blind_review_done` | S5 | — | 单次盲审完成 |
| `debate_1_triggered` | S5 | — | 第一次 debate 触发 |
| `debate_1_skipped` | S5 | `reason: "MAKE_DECISION_SKIP_DEBATE=1"` / `"debate_path_invalid"` / `"no_blocking_findings"` | 第一次 debate 跳过 |
| `s6_results_shown` | S6 | — | 审查结果展示 |
| `s7_talk3_done` | S7 | — | talk#3 完成 |
| `s7_grill_done` | S7 | `s7_grill_done: true/false`, `reason: "<失败原因>"（失败时）` | grill-with-docs-lite 完成或失败 |
| `s7_draft_complete` | S7 | — | 决策日志草稿完成 |
| `debate_2_triggered` | S7 | — | 第二次 debate 触发 |
| `debate_2_skipped` | S7 | `reason: "MAKE_DECISION_SKIP_DEBATE=1"` / `"debate_path_invalid"` / `"no_blocking_findings"` | 第二次 debate 跳过 |
| `s8_context_synced` | S8 | — | CONTEXT 已同步 |
| `s8_context_no_change` | S8 | — | CONTEXT 无变化 |
| `s9_user_approved` | S9 | `s9_user_approved: true` | 用户明确批准 |
| `s10_decision_log_complete` | S10 | — | decision-log 落盘完成 |

## V4 Review Round

Use `ReviewRoundFacade` through `runReviewRound()` only. The provider receives one
`review-packet.v1`; it must review only that packet. Do not run git, read the real
repository, request absolute paths, or write review reports in the provider workspace.
The facade owns `<task>/reviews/private/round-.../` evidence, provider status and
`cancel_source`. An unpublished call returns transport/packet evidence only, never a
semantic verdict. After host dispositions, the published return is `{ semantic_verdict,
core_receipt_hash, needs_human }`; only it may control public stage decisions.

Run two isolated flows in order. They never share a runtime:

```js
await runReviewRound({ stage: "make-decision", review_track: "direction", review_flow_id: "make-decision-flow", packet });
await runReviewRound({ stage: "make-decision", review_track: "detail", review_flow_id: "make-decision-flow", packet });
```

The direction packet contains only the original requirement. The detail packet may add
the decision log. The shared flow id is the aggregation group; each track still has its
own runtime, receipt, and continuation. Later rounds use `continuation: true` with the
same flow id; reset requires an explicit human approval reference. Consume only the
group-scoped aggregate `stage-result-make-decision-<review_flow_id>.json`; never read a
fixed make-decision stage-result path.

## End V4 Review Round
