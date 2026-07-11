# Tasks: m14a-audit-contract-layer

**Input**: `spec.md`, `plan.md`, `research.md`, `data-contracts.md`
**Tests**: 使用仓库现有 Vitest（`npx vitest run tests/m14a-audit-contract-layer.test.mjs`）；不新增依赖。
**Organization**: 最多 3 个有序 stage；同 stage 的 `[P]` 项可并行，所有任务都映射至少一个 FR。

## Stage 1 — 基础契约

- [ ] T001 [US1] 完善 execution trace 身份/层次/上下文/时间结果/事实引用、provenance unknown、三版本及 collector 支持范围，文件 `specs/m14a-audit-contract-layer/execution-trace.schema.json` (stage:1, depends:无) FR: FR-CONTRACT-001, FR-CONTRACT-002, FR-CONTRACT-003, FR-CONTRACT-004, FR-CONTRACT-009
- [ ] T002 [P] [US3] 将 `specs/m14a-audit-contract-layer/quality-failure-taxonomy.md` 固化为九领域封闭词表，逐项填写 description/included_signals/excluded_meanings 和版本规则，不引入 severity/root cause/solution/algorithm (stage:1, depends:无) FR: FR-CONTRACT-005, FR-CONTRACT-009

## Stage 2 — Registry 与治理边界

- [ ] T003 [P] [US1] 完善 `specs/m14a-audit-contract-layer/skills-inventory.schema.json` 顶层与 skill entry 的 required/type/enum/additionalProperties/required_reads 约束，明确不要求 `index.mjs` 或等价入口 (stage:2, depends:T001) FR: FR-CONTRACT-006, FR-CONTRACT-009, FR-CONTRACT-010
- [ ] T004 [P] [US2] 完善 `specs/m14a-audit-contract-layer/harness-surface.md` 的 schema/orchestrator/skills/adapters/dashboard 五行及 risk/owner/permission/validation_method，定义四种 permission 只表达治理边界 (stage:2, depends:T002) FR: FR-CONTRACT-007, FR-CONTRACT-008, FR-CONTRACT-009

## Stage 3 — 可证伪验证与交付核对

- [ ] T005 [US2] 新增 `tests/m14a-audit-contract-layer.test.mjs`，验证两份 JSON 可解析、required/enum/version/provenance、九 failure domains、五 surfaces、四 permissions、unknown 语义和禁止项；断言必须在实际缺失/越界时失败 (stage:3, depends:T001,T002,T003,T004) FR: FR-CONTRACT-001, FR-CONTRACT-002, FR-CONTRACT-004, FR-CONTRACT-005, FR-CONTRACT-006, FR-CONTRACT-007, FR-CONTRACT-008, FR-CONTRACT-009
- [ ] T006 [P] [US1] 核对 `specs/m14a-audit-contract-layer/spec.md` 顶部 30 行速读卡、Known Gaps、字段归属表与 required_reads 路径，并确认实施回报只引用长报告路径 (stage:3, depends:T001,T002,T003,T004) FR: FR-CONTRACT-003, FR-CONTRACT-010, FR-STRUCTURE-001, FR-STRUCTURE-002, FR-ARTIFACT-001
- [ ] T007 [US2] 运行 `npx vitest run tests/m14a-audit-contract-layer.test.mjs`，记录真实结果；复查 git diff 仅含四份契约、`spec.md`、聚焦测试及本阶段计划产物（`plan.md`、`tasks.md`、`research.md`、`data-contracts.md`、cross-artifact analysis），无 parser/gate/权限系统/per-skill runtime/依赖变更 (stage:3, depends:T005,T006) FR: FR-CONTRACT-004, FR-ARTIFACT-001

## Dependencies & Execution Order

### Stage Dependencies

- Stage 1 无前置；T001、T002 可并行。
- Stage 2 依赖对应基础契约；T003 与 T004 可并行。
- Stage 3 在四份契约成型后执行；T005 与 T006 可并行，T007 最后执行。

### User Story Dependencies

- US1（下游按 required reads 使用契约）：T001 → T003 → T006。
- US2（审查者核查来源与治理边界）：T001/T002 → T004 → T005 → T007。
- US3（失败分类保持窄口径）：T002 → T005。
- 场景四“防止范围越界”由 T003、T004、T005、T007 的禁止项和 diff 核对共同覆盖。

### Parallel Opportunities

- T001 与 T002 可并行；T003 与 T004 可并行；T005 与 T006 可并行。
- 同文件任务不并行，避免 schema/文档冲突。

## Implementation Strategy

### MVP First

先完成 T001/T002，使执行事实、版本和失败领域具有权威窄口径；再补 registry/surface；最后用现有测试栈证明契约可证伪。

### Incremental Delivery

1. Stage 1：核心 trace + taxonomy 可独立审查。
2. Stage 2：inventory + surface 完成 D1–D6 契约集合。
3. Stage 3：静态回归、required reads 与 scope 证据齐备。

## Notes

- 不新增 parser、validator CLI、blocking CI gate、权限执行系统、诊断器、自进化建议或 per-skill runtime。
- `unknown` 是事实状态，不可替换为 `pass`、`0`、`-` 或 `--`。
- 所有示例优先 repo-relative/task-root-relative；不得把本机绝对路径固化为 schema 常量。
