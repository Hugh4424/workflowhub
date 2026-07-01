---
task_id: m13a-moat-skills
stage: build-plan
artifact: cross-artifact-analysis
generated_by: spec-analyze
---

# 跨产物一致性分析报告

> 扫描范围：specs/m13a-moat-skills/spec.md、specs/m13a-moat-skills/plan.md、specs/m13a-moat-skills/tasks.md
> 报告只读，不阻断下游推进。

---

## Coverage Summary

| 产物 | FR 覆盖 | AC 覆盖 | 任务覆盖 |
|---|---|---|---|
| spec.md | 32 FR / 32 AC 定义源 | — | — |
| plan.md | 所有 32 FR 均有 Step 映射 | 所有 AC 均在 Verification Mapping 出现 | 10 Steps (Phase 1-4) |
| tasks.md | T001-T010 共覆盖 32 FR | T001-T010 共覆盖所有 AC | 10 任务 / 4 阶段 |

---

## Findings

### FIND-001

- **type**: ambiguity
- **source_artifact**: spec.md
- **target_artifact**: tasks.md
- **fr_or_task_id**: FR-TEST-004 / T007
- **line_or_anchor**: spec.md §场景 3.4 / tasks.md T007 "恰好 3 条"负例断言

**说明**：spec.md 中 FR-TEST-004 在场景 3.4 描述"返回恰好 3 条 findings"，同时在验收标准 AC-14 要求测试文件 grep 命中 `恰好.*3\|exactly.*3\|findings.*length.*3\|3.*findings`。tasks.md T007 对此有对应断言，但 FR-TEST-004 中还提及"（d）SKILL.md 缺少单次调用声明 → 断言报红"，与 FR-TEST-004 标题（"恰好 3 条"）存在双重语义（"恰好 3 条"和"单次调用"混入同一 FR）。plan.md Step 3.1 将两者分拆为独立断言，与 spec 原文语义一致但结构更清晰。

**严重级别**：LOW — 不影响实施，plan/tasks 已正确处理，记录供人审查。

### FIND-002

- **type**: ambiguity
- **source_artifact**: spec.md
- **target_artifact**: plan.md
- **fr_or_task_id**: AC-28
- **line_or_anchor**: spec.md §AC-28 / plan.md Verification Mapping AC-28(1)(2)

**说明**：spec.md AC-28 是两层断言：(1) tests/moat-skills.test.mjs 存在且 grep `不得编造\|不自行编造\|缺角度\|重跑\|rerun` 命中；(2) intake-decision-review SKILL.md 本身含等义硬证据。plan.md 和 tasks.md 均以 AC-28(1)/AC-28(2) 标记区分，但原 spec.md 未拆分编号，存在引用歧义。当前处理方式（拆分标记）比 spec 更精确，不构成矛盾，但与 spec 原文引用格式不一致。

**严重级别**：LOW — 已妥善处理，记录供人审查。

### FIND-003

- **type**: inconsistency
- **source_artifact**: spec.md
- **target_artifact**: tasks.md
- **fr_or_task_id**: FR-COMM-002 / T006
- **line_or_anchor**: spec.md §FR-COMM-002 / tasks.md T006

**说明**：spec.md FR-COMM-002 要求 S4 用户交互改写为大白话，但 spec.md 中对 S4 的描述较简略（未明确列出"遇到什么问题时"的触发条件），而 tasks.md T006 补充了"遇到问题时给出选项"的描述。这是 tasks.md 对 spec.md 的合理诠释，但存在轻微词义延伸。

**严重级别**：LOW — plan/tasks 诠释与 spec 意图一致，不需修改。

---

---

### FIND-004

- **type**: ambiguity
- **source_artifact**: spec.md
- **target_artifact**: plan.md / tasks.md
- **fr_or_task_id**: FR-MCP-001 / FR-MCP-002 / T009
- **line_or_anchor**: spec.md §FR-MCP-001~002 / plan.md Step 4.1 / tasks.md T009

**说明**：spec.md FR-MCP-001 要求 `.mcp.json` 声明 `muyu-search-mcp` command/args，但 RISK-06 明确指出"该 server 当前仅存在于用户级 Claude 配置，未在 repo 内可达的 mcp 配置文件中"，真实 command/args 需 build-code 阶段从用户级配置提取。plan.md Step 4.1 和 tasks.md T009 均已记录此提取动作，但具体路径（如 `~/.claude/claude_desktop_config.json`）未在 spec 或 plan 中硬编码——这是合理的（避免本机路径入库），但 build-code 实施者需自行定位用户级配置源文件。

**严重级别**：LOW — 不阻断；build-code 实施者按 RISK-06 说明从用户级 MCP 配置提取即可。

---

### FIND-005

- **type**: ambiguity
- **source_artifact**: spec.md
- **target_artifact**: tasks.md
- **fr_or_task_id**: FR-SEARCH-002 / T010
- **line_or_anchor**: spec.md §FR-SEARCH-002 / tasks.md T010

**说明**：spec.md FR-SEARCH-002 要求 make-decision S3 路径 B 切换为 in-repo anysearch 引用，但 spec.md 未明确标注 S3 路径 B 的当前行号/锚点（RISK-07 提示约行 168）。tasks.md T010 仅描述 anysearch 文件搬入，未明确包含 S3 路径 B 的引用切换动作。该动作目前隐含在 T004/T005（make-decision 引用切换）范围内，但 T004 FR 映射未列 FR-SEARCH-002。

**严重级别**：LOW — 建议 build-code 阶段实施 T004/T005 时同时处理 S3 路径 B 的 anysearch 切换，或将 FR-SEARCH-002 补入 T005 映射；不修改本 tasks.md（已记录+浮现）。

---

## Metrics

- 扫描发现总数：5
- CRITICAL：0
- HIGH：0
- MEDIUM：0
- LOW：5
- 发现上限（50）：未超出

---

## Next Actions

- FIND-001~003：三条原有 LOW 级别发现，build-code 阶段按原建议处理。
- FIND-004（FR-MCP-001/002 command/args 来源）：build-code 实施者参照 RISK-06，从用户级 Claude MCP 配置提取真实 command/args 写入 `.mcp.json`，鉴权秘密走 env 引用。
- FIND-005（FR-SEARCH-002 S3 路径 B 切换归属）：build-code 实施 T004/T005 时，同步处理 make-decision S3 路径 B 的 anysearch in-repo 引用切换；T010 负责文件搬入，T005 负责引用切换，两者配合完成 FR-SEARCH-002。

