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
| `MAKE_DECISION_SKIP_BLIND_REVIEW` | `0` | `=1` 时跳过盲审（3rd-review）护城河，记录 `blind_review: skipped`；非 `0`/`1` 值视为 `0`（warn+log） | `export MAKE_DECISION_SKIP_BLIND_REVIEW=1` |
| `THIRD_REVIEW_RUNNER` | `run-heterologous-review.mjs` | 自定义 reviewer runner 文件路径；文件不可达时记录 `runner_invalid`，用默认 runner，继续 | `export THIRD_REVIEW_RUNNER=/path/to/runner.mjs` |
| `REVIEW_DISPATCH_CONFIG` | （空，走内置默认调度） | 允许值：有效 JSON/YAML **配置文件路径**；文件不可达或解析失败时记录 `dispatch_config_invalid`，用默认调度继续；缺省为空时 3rd-review 使用内部默认调度 | `export REVIEW_DISPATCH_CONFIG=/path/to/dispatch.json` |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | `0` | debate 技能读取此变量以决定模式：`=1` 启用五方法庭模式（debate 内部并发）；`=0` debate 自动降级单人三档；非 `0`/`1` 值视为 `0`（warn+log）。make-decision 本身不读此变量控制 S1，S1 模式由运行时 teams 能力自动判定 | `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |
| `TASK_TRACKING_ROOT` | `~/Knowledge/workflowhub/` | 所有阶段跟踪文件的存储根目录；未设置时记录 warn 和 `tracking_root_fallback`，继续使用默认路径；目录不存在时尝试 `mkdir -p`，失败也只 warn 不停止 | `export TASK_TRACKING_ROOT=/path/to/workflowhub-tracking` |

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

**目标**：加载当前任务上下文，建立调研基础。

1. 读取以下背景材料（如存在）：
   - `CONTEXT.md`（项目术语与约定）
   - 当前 `task-id` 对应的任务描述与原始输入
   - 已有 decision-log、research 文件（如存在）
   - `tasks/{task-id}/` 目录下已有产物
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
    "decision_log_path": "tasks/<task>/decision-log.md"
  },
  "missing_items": [],
  "user_decision": true,
  "reason": "User confirmed direction and scope."
}
```

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

**目标**：通过一次独立 3rd-review 对 S4 产物做盲审，产出 3 条审查建议，并根据结果决定是否触发第一次 debate。S5 不要求三条审查链。

### 0. MAKE_DECISION_SKIP_BLIND_REVIEW 快速跳过分支

若 `MAKE_DECISION_SKIP_BLIND_REVIEW=1`：
- 跳过以下单次盲审（### 1）和结果整理（### 2）全部步骤。
- 写 journal 事件：`event: "s5_blind_review_skipped", reason: "MAKE_DECISION_SKIP_BLIND_REVIEW=1"`。
- S5 产出以空审查集合视为"无 blocking 发现"：`direction_divergence: false`，`findings: []`。
- 第一次 debate 门控（### 4）仍正常执行，但因无 blocking findings，通常记 `debate_1: skipped`。
- 直接跳至 S6，S6/S7 以上述产出为输入。

### 1. 单次独立盲审

**入口检测（THIRD_REVIEW_RUNNER）**：读取 `THIRD_REVIEW_RUNNER` 环境变量（默认 `run-heterologous-review.mjs`）。若设置了该变量，检查对应文件是否可达；文件不可达时写 journal 事件 `event: "runner_invalid", runner: "<值>"`，并回退使用默认 runner `run-heterologous-review.mjs`，继续执行，不阻断流程。

**入口检测（REVIEW_DISPATCH_CONFIG）**：读取 `REVIEW_DISPATCH_CONFIG` 环境变量（默认为空，走内置默认调度）。若设置了该变量，检查对应配置文件是否可达且可解析；文件不可达或解析失败时写 journal 事件 `event: "dispatch_config_invalid", config: "<值>"`，并回退使用内置默认调度，继续执行，不阻断流程。若未设置（空），直接使用内置默认调度。

启动一条独立 3rd-review 链：

- `skills/intake-decision-review/SKILL.md`：同时审查方向合理性、问题框架设定、范围边界合理性。

审查输入必须与主上下文隔离：只给 S4 已落盘产物和必要任务背景，不给本轮 agent 的推理过程或未落盘草稿。

审查结果必须包含以下字段：

```
reviewer_runtime_id: <唯一标识该 agent 运行实例>
reviewer_source: <来源标识>
fallback_used: <true|false>
input_hash: <审查输入内容的哈希，用于隔离验证>
findings: <恰好 3 条审查建议>
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

- 若 `fallback_used: true` → 视为本次审查失败，结果不采用，立即停下报告用户，**禁止静默降级**。
- 若 `findings` 不是恰好 3 条 → 视为审查输出不合格，要求 reviewer 重跑或补齐；不自行编造建议。
- 审查通过后写入 `tasks/{task-id}/artifacts/make-decision-review.md`：
  - `direction_divergence`: `true`/`false`（方向分歧标记）
  - `findings`: 恰好 3 条审查建议

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

**禁止行为（D4）**：debate 触发判定必须基于已存在 artifact 中的具体 finding ID 列表（争点来源），**严禁在审查完成前或审查外自行制造争点**。make-decision 只负责提取并传递 artifact 来源的 finding ID 列表（可为空）和相关上下文；是否触发、以及无有效争点时如何降级，均由 debate 技能 Step 1 自行裁决。

按以下优先顺序判定：

1. `MAKE_DECISION_SKIP_DEBATE=1` → 记 `debate_1: skipped`，跳过 debate，继续 S6。
2. `MAKE_DECISION_DEBATE_PATH` 不可达（路径无法访问）→ 写 journal 事件 `event: "debate_1_skipped", reason: "debate_path_invalid"` 和 `debate_path_invalid: true`，记录 `debate_1: skipped`，降级继续，不阻断流程。
3. 其余情况：提取审查 artifact（`make-decision-review.md`）中具体的 finding ID 列表（争点来源，可为空），传入 debate 技能 + Claude 决策 + decision-log 版本，由 debate 技能的 Step 1 自行判断是否触发；读回 debate 技能产出的裁决书。
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

退出条件：用户能复述四件事——做了什么 / 为何 / 不做什么 / 怎么验证。

纯委托（pure delegation）给 `skills/grill-with-docs/SKILL.md` 执行，退出逻辑由其内部控制，不在本 agent 内联展开。

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
  - 更新 `project-memory.json` 中受影响的字段。
  - 写 journal 事件：`event: "s8_context_synced"`
- 若无任何内容变更（决策与现有文档完全一致）：
  - 以上三个文件**不强制写入**。
  - 写 journal 事件：`event: "s8_context_no_change"`

---

## S9 用户批准（唯一硬门）

**S9 是全流程唯一强制确认硬门（FR-ACCEPT-02）。** 所有其它步骤均不得以"用户默认同意"为由自动放行；只有 S9 获得明确批准后，流程才可进入 S10。

### 1. 展示完整决策摘要

向用户展示完整决策摘要，内容须包含（**FR-ACCEPT-03**）：

- **方向**：已确认的解决方向（一句话）
- **范围**：明确本次做什么、不做什么
- **关键约束**：影响实施的硬约束
- **待办列表台账**：台账所有条目逐条核对（接受 / 丢弃 / 新想法候选）

### 2. 等待用户明确确认

- 等待用户明确"同意"或等效确认（如"ok"、"approve"、"确认"、"通过"）。
- 用户未确认时**无限等待**；不确认就不继续，**不得自动通过**，不得以超时为由继续。
- 写 journal 事件：`event: "s9_user_approved", s9_user_approved: true`

### 3. 错误声明

**明确写入**：跳过 S9 直接进入 S10 视为**错误**（error）；任何绕过此硬门的行为均违反本 skill 契约。

---

## S10 decision-log 落盘 + stage end updateOwnResult

**目标**：将最终决策落盘为规范的 `decision-log.md`，并通过 `metrics/collector.mjs` 记录 M4 指标。

### 1. 落盘前检查

落盘前检查审查产物完整性：

- 若存在 `severity: blocking` 的审查意见，但对应审查产物（`make-decision-review.md` 及 debate 裁决书）中**缺少**三行留痕格式：
  ```
  反对 X：<内容>
  决定 Y：<内容>
  理由 Z：<内容>
  ```
  则**不得**标记"落盘完整"，须先补全三行留痕后再继续。

### 2. 确定写入根目录

读取 `TASK_TRACKING_ROOT` 来确定本次任务跟踪文件写入根目录：

- 若 `TASK_TRACKING_ROOT` 已设置：使用该值作为跟踪根目录，并基于它推导 `tasks/{task-id}/decision-log.md` 等路径。
- 若 `TASK_TRACKING_ROOT` 未设置：记录 warn，不停止；使用默认根目录 `~/Knowledge/workflowhub/`，并写 journal 事件 `event: "tracking_root_fallback", default: "~/Knowledge/workflowhub/"`。
- 若目录不存在：尝试 `mkdir -p`；创建失败时 warn 不停止，并继续按当前可写路径策略记录失败事实。

### 3. 产出 decision-log.md

产出 `tasks/{task-id}/decision-log.md`，包含 7 节结构 + 执行环境字段：

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
- `TASK_TRACKING_ROOT` 是否触发 `tracking_root_fallback`

文件顶部 frontmatter 包含字段：

```yaml
user_decision: true
```

### 4. 调用 metrics/collector.mjs updateOwnResult

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
