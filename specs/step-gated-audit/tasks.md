# Tasks: step-gated-audit

**Task ID**: `step-gated-audit`
**Input**: `specs/step-gated-audit/spec.md` + `specs/step-gated-audit/plan.md`
**Date**: 2026-07-03
**Stage grouping**: `--stage 3`
**Tests**: `npm test` (vitest)

**Organization**: Tasks grouped by dependency layer — infrastructure first, then 5-stage hooks (parallelizable), then aggregation/compliance.

---

## Stage 1

**Purpose**: 基础设施 — journal schema 扩展 + receipt-writer 新模块。所有 Stage 2 任务依赖此阶段完成。

- [ ] T001 新建 `core/journal-schema.mjs`（该文件当前不存在，操作为 NEW）：定义 event_type 枚举，含 `step_entry`、`step_exit`、`step_auto_rollback` 及已有 stage 级事件类型；schema 版本号 v1 起始。(stage:1, depends:无) FR: FR-SGA-004, FR-SGA-006

- [ ] T002 新建 `core/receipt-writer.mjs`：实现 `writeEntryReceipt(taskId, payload): Promise<void>`（fail-closed，写入失败 throw）和 `writeExitReceipt(taskId, payload): Promise<void>`（warn-only，写入失败 journal warn 不 throw）；路径解析通过 `core/task-dir-parser.mjs`；no third-party deps。(stage:1, depends:T001) FR: FR-SGA-001, FR-SGA-002, FR-SGA-004, FR-SGA-013

- [ ] T003 [P] 为 `core/receipt-writer.mjs` 编写单元测试：覆盖 writeEntryReceipt fail-closed 路径、writeExitReceipt warn-only 路径、payload 字段校验（step_id 格式、check_status 枚举）。(stage:1, depends:T002) FR: FR-SGA-001, FR-SGA-002, FR-SGA-013

---

## Stage 2

**Purpose**: 5 个 stage SKILL.md 各自新增 before-step / after-step 钩子段落。T004–T008 可全部并行（互不依赖，各自修改独立文件）。

- [ ] T004 [P] 修改 `workflows/build-spec/SKILL.md`：新增 `## Before-Step Hook` 段落（读上游 exit_receipt → 判断 check_status → 调用 writeEntryReceipt → blocked 时出 judgement）；新增 `## After-Step Hook` 段落（调用 3rd-review → 调用 writeExitReceipt 含 10 字段 review 子记录）；step_id 格式 `bs.{step_type}.{seq}`；说明 writer_namespace / executor_namespace 对比规则（warn 不阻断）。(stage:2, depends:T001,T002) FR: FR-SGA-001, FR-SGA-002, FR-SGA-003, FR-SGA-007, FR-SGA-008, FR-SGA-009, FR-SGA-010, FR-SGA-013, FR-SGA-014, FR-SGA-015

- [ ] T005 [P] 修改 `workflows/build-plan/SKILL.md`：同 T004 模式；step_id 格式 `bp.{step_type}.{seq}`。(stage:2, depends:T001,T002) FR: FR-SGA-001, FR-SGA-002, FR-SGA-003, FR-SGA-007, FR-SGA-008, FR-SGA-009, FR-SGA-010, FR-SGA-013, FR-SGA-014, FR-SGA-015

- [ ] T006 [P] 修改 `workflows/build-code/SKILL.md`：同 T004 模式，额外说明 before-step 须在 phase-manifest 加载完毕后触发（FR-SGA-011）；step_id 格式 `bc.{step_type}.ph{N}`（seq_label 来自 phase-manifest 动态序号）；明确 phase-manifest 集成仅适用 build-code（FR-SGA-012）。(stage:2, depends:T001,T002) FR: FR-SGA-001~009, FR-SGA-010, FR-SGA-011, FR-SGA-012, FR-SGA-013~015

- [ ] T007 [P] 修改 `workflows/verify-code/SKILL.md`：同 T004 模式；step_id 格式 `vc.{step_type}.{seq}`。(stage:2, depends:T001,T002) FR: FR-SGA-001, FR-SGA-002, FR-SGA-003, FR-SGA-007, FR-SGA-008, FR-SGA-009, FR-SGA-010, FR-SGA-013, FR-SGA-014, FR-SGA-015

- [ ] T008 [P] 修改 `workflows/make-decision/SKILL.md`：同 T004 模式；step_id 格式 `md.{step_type}.{seq}`。(stage:2, depends:T001,T002) FR: FR-SGA-001, FR-SGA-002, FR-SGA-003, FR-SGA-007, FR-SGA-008, FR-SGA-009, FR-SGA-010, FR-SGA-013, FR-SGA-014, FR-SGA-015

---

## Stage 3

**Purpose**: audit_summary 聚合、rollback 计数隔离、合规收尾、全套测试验证。

- [ ] T009 追加 `audit_summary` 字段到 stage-result 写入逻辑：含 5 个计数字段（total_step_count, passed_step_count, blocked_step_count, skipped_step_count, rollback_count）；不修改 stage-result.json 已有字段（additive only）。若 `core/stage-result-writer.mjs` 不存在，则在各 stage SKILL.md 中补充说明追加规则。(stage:3, depends:T004,T005,T006,T007,T008) FR: FR-SGA-005, FR-SGA-006

- [ ] T010 [P] 确认 rollback 计数隔离语义写入各 stage SKILL.md 钩子说明：workflow_run_id 隔离；rollback_count 由 runner 维护（audit 只出 judgement，不执行 rollback）；连续 2 次无效升人工；新 workflow_run_id 从 0 计数。(stage:3, depends:T004,T005,T006,T007,T008) FR: FR-SGA-003, FR-SGA-006

- [ ] T011 [P] 合规检查（skip 语义 + local-pointer 链）：逐一核对 T004–T008 产出的 SKILL.md 钩子段落，确认：skipped 必须有授权方 + skip_reason 非空；entry_receipt 含 prev_step_id / next_step_id；无全局 step 位置表引用。记录检查结果。(stage:3, depends:T004,T005,T006,T007,T008) FR: FR-SGA-014, FR-SGA-015

- [ ] T012 运行完整测试套件 `npm test`：确认 T003 的 receipt-writer 单元测试通过；确认 journal-schema 变更不破坏已有测试；记录任何失败。(stage:3, depends:T009,T010,T011) FR: FR-SGA-001~015 (全覆盖验收)

- [ ] T013 [P] 范围边界验证：确认无 `receipts/` 目录创建；确认外部 3rd-review 工具（路径 `/Users/Hugh/Hugh/Project/3rd-review/`，不在本仓库内）未被修改；确认 journal.jsonl 已有 event_type 未被修改（只追加）；确认无全局 step 位置表引入。(stage:3, depends:T009,T010,T011) FR: FR-SGA-004, FR-SGA-015

---

## Dependencies & Execution Order

### Stage Dependencies

- **Stage 1** (T001→T002→T003): 无前置，立即启动。T003 依赖 T002，其余串行。
- **Stage 2** (T004–T008): 全部依赖 Stage 1 完成（T001+T002）。T004–T008 可完全并行。
- **Stage 3** (T009–T013): 依赖 Stage 2 全部完成（T004–T008）。T009 单独先跑；T010/T011/T013 并行；T012 依赖 T009/T010/T011。

### Parallel Opportunities

- T004–T008: 5 个 SKILL.md 修改完全独立，可同时派 5 个子代理并行执行。
- T010, T011, T013: 在 T009 完成后可并行运行。

### Critical Path

T001 → T002 → T004(or any of 04-08) → T009 → T012

---

## Verification Matrix

| Task | AC coverage |
|------|-------------|
| T001 | AC-004 (journal event_type 新增) |
| T002 | AC-001, AC-002, AC-004 (receipt 写入路径) |
| T003 | AC-001, AC-002, AC-004 (单元测试) |
| T004–T008 | AC-001, AC-002, AC-003, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011 |
| T006 (build-code) | AC-007 (step_id format), AC-008 (phase-manifest) |
| T009 | AC-004, AC-005, AC-006 |
| T010 | AC-003, AC-006 |
| T011 | AC-011, AC-012 |
| T012 | 全套 AC-001~012 回归 |
| T013 | AC-004, AC-012 (scope boundary) |
