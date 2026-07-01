# plan-eng-review — 独立工程审查记录

## 元数据

- task_id: m13d-build-code-deepening
- 审查时间: 2026-07-01
- 审查方式：异源独立审查（codex，非降级），沿用 build-spec 阶段已验证可用的调用方式
- 调用命令：`timeout 280 codex exec review --uncommitted -o /tmp/codex-plan-review-output.md`
- 审查对象：本阶段（build-plan）产出的未提交改动 —— `research.md`（新增）、`data-contracts.md`（新增）、`plan.md`（新增）、`tasks.md`（新增）、`cross-artifact-analysis.md`（新增）、`baseline-report.md`（修改追加）
- 禁止自审自判（FR-REVIEW-002 / 宪法 Q3）：verdict 由 codex 独立上下文产出，本 agent 未参与裁决，仅执行发现项的落地修复

## verdict：revise_required（3 条 P2 级发现，均非 blocking）

### 发现 1 — T006 缺人工暂停语义
- 位置：`tasks.md:41`
- 问题：C 类升级触发 escalate_to_human 后，任务描述只写"触发升级+记录"，未明确要求暂停自动推进等待人工确认，可能被实现为"记录后继续自动重试"，违反手动 gate 设计意图（对应 AC-REVIEW-006）。
- **处置**：已修订 T006，显式加入"escalate_to_human 触发后必须暂停自动推进、等待人工确认（不可只写记录后自动继续下一轮重试循环）"。

### 发现 2 — data-contracts.md owner 路径与仓库实际不符
- 位置：`data-contracts.md:27-31`
- 问题：契约 owner 写"metrics/capture.mjs"（沿用 spec.md 泛称），但仓库实际文件是 `workflows/build-code/capture.mjs`，无 `metrics/capture.mjs`，可能导致实现/验证阶段找错文件。
- **处置**：已订正 owner 字段为 `workflows/build-code/capture.mjs`，并注明 spec.md 泛称来源，避免歧义。

### 发现 3 — T010 测试任务遗漏两个 verdict 文件
- 位置：`plan.md:178-181`（对应 tasks.md T010）
- 问题：声称覆盖"evidence 五件套"测试，但只列了 RED/GREEN/L2 report 三项，遗漏 `spec-compliance-verdict.md`/`code-quality-verdict.md` 的 verdict/findings 字段测试。
- **处置**：已修订 T010，显式列出五件套全部字段测试项（含 d/e 两个 verdict 文件的 verdict/findings 字段）。

## 第一轮复核结论

3 条发现均已在本轮当场修复（tasks.md T006/T010、data-contracts.md owner 字段），无遗留 revise_required 项。

## 第二轮独立审查（commit 552cc53，按用户要求"修改后继续审查直到 pass"补跑）

- 审查时间: 2026-07-01（同日续跑）
- 调用命令：`timeout 280 codex exec review --commit 552cc53 -o /tmp/codex-plan-review-round2.md`（对象为已提交的 build-plan 全部产物，非 --uncommitted，因第一轮修复已随 Step10 一并提交）
- verdict：revise_required（3 条 P2 级发现，均非 CRITICAL）

### 发现 4 — l2-integration-test-report.json 契约缺路由理由字段
- 位置：`data-contracts.md:11`
- 问题：AC-SMOKE-003 要求记录档位选择理由，但契约只要求 routing_tier/result/ts，T010 测试也只断言 routing_tier/result，实现可合规却漏掉可追溯性字段。
- **处置**：契约新增必填字段 `routing_rationale`（非空字符串），T010 同步补断言，Verification Mapping 补 AC-SMOKE-003。

### 发现 5 — T008 worktree.json 复用协议缺损坏/失败分支
- 位置：`tasks.md:43`
- 问题：只覆盖存在/不存在两种情况，遗漏文件损坏（JSON 解析失败或 worktree_root 非法）与 checkout 失败两类，可能导致复用错误路径且无察觉。
- **处置**：T008 补充异常路径——损坏文件 escalate_to_human 停止推进，checkout 失败不写半成品 worktree.json。

### 发现 6 — plan.md 2.4 节遗漏人工暂停语义重申
- 位置：`plan.md` 2.4 verdict-handler 小节
- 问题：tasks.md T006 已有暂停要求，但 plan.md 作为主实施依据本节只写"触发升级+记录"，未重申暂停要求，且 Verification Mapping 未列 AC-REVIEW-006。
- **处置**：2.4 节正文补充"escalate_to_human 触发后必须暂停自动推进、等待人工确认"，Verification Mapping 增补 AC-REVIEW-006。

## 第二轮复核结论

3 条发现（编号 4/5/6）已全部当场修复，涉及 data-contracts.md、tasks.md（T008、T010）、plan.md（2.4 节 + Verification Mapping）。所有改动为契约字段补充/任务描述补充，未改变既定架构方向。已复跑第三轮审查验证收敛（见下）。
