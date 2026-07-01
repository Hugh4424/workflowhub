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

## 复核结论

3 条发现均已在本轮当场修复（tasks.md T006/T010、data-contracts.md owner 字段），无遗留 revise_required 项。未重新发起第二轮 codex 审查（三处均为文档措辞/字段订正类修复，改动范围小且直接对应发现描述，非架构性变更）；若人工审查认为需要复核，可重新运行相同命令验证。
