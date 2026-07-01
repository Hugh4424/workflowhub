# 跨产物一致性分析报告

## 摘要

扫描 spec.md（437行）/ plan.md / tasks.md 三产物，另在 Step 10 文件核对中补充扫描现有 tests/ 引用。发现 2 条 underdefined（均已当场修复，不再遗留：跨仓版本锁定 + 测试路径迁移冲突）、2 条 constitution-alignment（S3/S6 非阻断记录）、0 条 CRITICAL 遗留问题。字段命名、FR 覆盖率核对无 inconsistency/duplicate 发现。

## 发现项

| # | type | severity | source_artifact | target_artifact | fr_or_task_id | line_or_anchor | 描述 |
|---|------|----------|-----------------|-----------------|-----------------|---------------|------|
| 1 | underdefined | HIGH（已修复） | spec.md | plan.md | FR-SMOKE-001 | spec.md:L424 | spec 附录 A Known Gap #5 明确要求"跨仓库依赖需在 build-plan 阶段声明版本/路径锁定"，plan.md 初稿只写"跨仓复用 agenthub 内部技能"未锁定版本/路径。**处置**：分析过程中当场补齐，已在 plan.md 新增"Cross-Repo Dependency Lock"小节（锁定 commit f59b4b471df3522fcf46ec4f01c78874c90ded3c）+ tasks.md T004 同步补充，现已消除。 |
| 2 | constitution-alignment | CRITICAL（记录性，非阻断） | plan.md | CONSTITUTION.md | S3 | plan.md Constitution Check 章节 | S3"迭代时保持最新并就地检查"标记 `[ ]` 不达标：本轮未做市面同类方案版本核查，仅基于内部历史教训（m13a/m13c）设计。按 FR-CONSTITUTION-002 记录浮现，不阻断 stage-result。 |
| 3 | constitution-alignment | CRITICAL（记录性，非阻断） | plan.md | CONSTITUTION.md | S6 | plan.md Constitution Check 章节 | S6"参考市面方案不闭门造车"标记 `[ ]` 不达标：未见明确市面方案横向调研记录。同上，记录浮现不阻断。 |
| 4 | underdefined（已修复） | HIGH（已修复） | plan.md/tasks.md | 现有测试套件 | FR-REUSE-001 | tasks.md T001 | Step 10 文件引用核对发现：`tests/reuse-registry.test.mjs`、`tests/m12-reuse-registry.test.mjs`、`tests/five-skills-present.test.mjs`、`tests/m13-make-decision.test.mjs` 硬编码 `reuse-registry.md`（仓库根目录）路径，`tests/moat-skills.test.mjs` 硬编码 `config/reuse-registry.md` 路径；T001 原描述"删除旧两份文件"若逐字执行会使这 5 个测试文件断言失败，而 spec.md Scenario H 明确要求消除重复文件（不容许保留 root/config 旧文件作兼容垫片）。**处置**：已在 T001 及 plan.md Project Structure/1.1 补充"同步迁移 5 个测试文件路径常量（仅改路径，断言逻辑/内容不变）"，纳入 FR-REUSE-001 实现范围内，非新增 scope。 |

（共 4 条，未超 50 条上限，无需溢出摘要。）

## Coverage Summary

| Requirement Key | Task? | Task IDs | Notes |
|---|---|---|---|
| FR-RISK-001 | Yes | T003 | — |
| FR-SMOKE-001 | Yes | T004 | 已补版本/路径锁定 |
| FR-REVIEW-001 | Yes | T005 | — |
| FR-REVIEW-002 | Yes | T006 | — |
| FR-COMMIT-001 | Yes | T007 | — |
| FR-WORKTREE-001 | Yes | T008 | 协议确认，非新实现 |
| FR-REUSE-001 | Yes | T001 | — |
| FR-METRICS-001 | Yes | T002 | — |
| FR-ANTIFORGERY-001（已移除） | N/A | 无 | spec 已声明移除，tasks.md 正确未覆盖，非缺口 |
| FR-LADDER-002（F10流程要求，非代码FR） | N/A | 无 | 已在 plan.md Constitution/F10 Gate 章节满足，非 tasks.md 覆盖对象 |

## Constitution Alignment Issues

见上方发现项 #2、#3（S3、S6），已记录不阻断。

## Unmapped Tasks

无。T001-T010 每条均映射至少一条 spec.md FR。

## Metrics

- Total Requirements: 8（可执行代码类 FR，不含已移除的 FR-ANTIFORGERY-001 和流程性 FR-LADDER-002）
- Total Tasks: 10
- Coverage % (requirements >=1 task): 100%
- Ambiguity Count: 0
- Duplication Count: 0
- Critical Issues Count: 0（遗留）；分析/build-plan 阶段过程中发现并当场修复 2 条 HIGH underdefined（Known Gap #5 跨仓锁定 + Step 10 测试路径迁移），记录性 constitution-alignment 2 条（非阻断）

## Next Actions

**仅 LOW/MEDIUM/记录性发现，无遗留 CRITICAL**：可继续推进。

- 具体建议：S3/S6 两条非阻断记录留待下一轮迭代补充市面方案调研；无需现在处理，不影响本任务交付。

## 溢出摘要

无（发现总数 3 条，未超 50 条上限）。
