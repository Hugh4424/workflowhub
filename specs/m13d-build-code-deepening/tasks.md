# Tasks: m13d-build-code-deepening

**Input**: Design documents `specs/m13d-build-code-deepening/`
**Prerequisites**: spec.md (authoritative, 3rd-reviewed), plan.md, data-contracts.md
**Tests**: `npm test`（现有套件）+ 新增 `tests/m13d-build-code-deepening.test.mjs`
**Organization**: 按 plan.md 的 3 个 Phase 组织（非用户故事型任务，无独立可测用户故事拆分——本任务为单一 workflow 内多能力叠加）

## Format: `- [ ] [TaskID] [P?] Description (stage:N, depends:<task-ids>) FR: FR-XXX-XXX`

- **[P]**: 文件独立、无依赖，可并行
- 每条任务引用 spec.md 中至少一条 FR

## Path Conventions

- **Workflow skill**: `workflows/build-code/SKILL.md`
- **Capture**: `workflows/build-code/capture.mjs`
- **Registry**: `skills/reuse-registry.md`
- **Artifacts**: `specs/m13d-build-code-deepening/`
- **Constitution**: `constitution-checklist.md`, `CONSTITUTION.md`

---

## Stage 1

**Purpose**: 基础设施——技能来源统一 + 指标字段扩展，二者互不依赖，可并行

- [ ] T001 [P] 合并根目录 `reuse-registry.md` + `config/reuse-registry.md` 为唯一权威版本 `skills/reuse-registry.md`，新增 checkpoint-protocol / review-trigger / verdict-handler / test-routing-advisor 4 条来源记录，删除旧两份文件；**同步更新 5 个现有测试文件中硬编码的旧路径引用**（`tests/reuse-registry.test.mjs`、`tests/m12-reuse-registry.test.mjs`、`tests/five-skills-present.test.mjs`、`tests/moat-skills.test.mjs`、`tests/m13-make-decision.test.mjs`）——仅改路径常量指向 `skills/reuse-registry.md`，断言逻辑/行内容不变（独立审查 Step 10 文件核对发现：这些测试硬编码 root/config 路径，逐字执行"删除旧两份文件"会使其失败，而 spec.md Scenario H 明确要求消除重复文件，故迁移测试路径属于实现 FR-REUSE-001 的必要范围而非新增 scope） (stage:1, depends:none) FR: FR-REUSE-001
- [ ] T002 [P] 在 `workflows/build-code/capture.mjs` 新增 `commit_sha`/`base_sha`/`head_sha`/`risk_level` 四字段（值不可得写 `null`，字段必须存在），不改动现有 7 个字段 (stage:1, depends:none) FR: FR-METRICS-001 (upstream_delta: 来自 specs/m13d-build-code-deepening/data-contracts.md §4 字段契约)

**Checkpoint**: `skills/reuse-registry.md` 存在且含 4 条新记录；`capture.mjs` 输出对象含新四字段。

---

## Stage 2

**Purpose**: build-code/SKILL.md 主体新增三大质量能力章节（同文件顺序编辑，不可并行）

- [ ] T003 在 `workflows/build-code/SKILL.md` 新增 P0-P3 风险定级步骤：读 `facts.tasks` 定级写入 `facts.tests[].risk_level`，P0 触发覆盖提示日志，定级失败仅记录不阻断 (stage:2, depends:T002) FR: FR-RISK-001
- [ ] T004 在 `workflows/build-code/SKILL.md` 新增 L2 集成冒烟步骤：所有 phase GREEN 后调用 agenthub `test-routing-advisor` 生成 `l2-integration-test-report.json`，档位选择理由可追溯，失败不阻断；跨仓依赖锁定 commit `f59b4b471df3522fcf46ec4f01c78874c90ded3c`（`https://github.com/Hugh4424/AgentHub.git` `packages/core/agenthub/skills/test-routing-advisor/SKILL.md`） (stage:2, depends:T003) FR: FR-SMOKE-001
- [ ] T005 在 `workflows/build-code/SKILL.md` 新增两阶段独立审查拆分：3rd-review 拆两个独立子代理产出 `spec-compliance-verdict.md`/`code-quality-verdict.md`，任一失败不终止另一个 (stage:2, depends:T004) FR: FR-REVIEW-001
- [ ] T006 在 `workflows/build-code/SKILL.md` 新增 verdict-handler A/B/C 升级分类逻辑：同一子代理连续 3 次 `revise_required` 触发 C 类 escalate_to_human——**escalate_to_human 触发后必须暂停自动推进、等待人工确认**（AC-REVIEW-006 手动停止要求，不可只写记录后自动继续下一轮重试循环），产出结构化升级记录 (stage:2, depends:T005) FR: FR-REVIEW-002
- [ ] T007 在 `workflows/build-code/SKILL.md` 新增原子提交留痕说明：提交时机收敛在 orchestrating skill，实现子代理禁止自行 commit，`commit_sha`/`base_sha`/`head_sha` 写入 GREEN.json (stage:2, depends:T006,T002) FR: FR-COMMIT-001
- [ ] T008 在 `workflows/build-code/SKILL.md` 确认/补充 worktree.json 复用协议说明：存在即复用不重复拉取，不存在按 make-decision 规则自建 (stage:2, depends:T007) FR: FR-WORKTREE-001

**Checkpoint**: `workflows/build-code/SKILL.md` 含全部 6 个新章节，字段命名与 data-contracts.md 一致。

---

## Stage 3

**Purpose**: 收尾核对 + 测试补充（两条任务文件独立，可并行）

- [ ] T009 [P] 核对 `workflows/build-code/SKILL.md` 修订内容与 `data-contracts.md` 五类契约字段命名完全一致，无别名（尤其 `rework_proxy_count` 禁止别名） (stage:3, depends:T008) FR: 跨 FR-RISK-001/FR-SMOKE-001/FR-METRICS-001
- [ ] T010 [P] 新增 `tests/m13d-build-code-deepening.test.mjs`：断言 evidence **五件套全部**字段存在性 + 枚举值合法性——(a) phase-N-RED.json risk_level 合法值, (b) phase-N-GREEN.json risk_level/commit_sha/base_sha/head_sha 存在, (c) l2-integration-test-report.json routing_tier/result 合法值, (d) spec-compliance-verdict.md verdict(pass/revise_required) + findings 字段存在, (e) code-quality-verdict.md verdict(pass/revise_required) + findings 字段存在（此前遗漏 d/e 两项，独立审查发现后补齐） (stage:3, depends:T008) FR: AC-RISK-001, AC-SMOKE-001, AC-METRICS-001~003, AC-REVIEW-001

**Checkpoint**: `npm test` 全绿，字段一致性核对无发现别名问题。

---

## Dependencies & Execution Order

### Phase Dependencies

- **Stage 1**: 无依赖，T001/T002 可并行立即开始
- **Stage 2**: 依赖 Stage 1（T002 提供 risk_level/commit_sha 等字段基础），T003-T008 同文件顺序执行
- **Stage 3**: 依赖 Stage 2 全部完成，T009/T010 可并行

### Parallel Opportunities

- Stage 1: T001（reuse-registry.md）与 T002（capture.mjs）文件独立，标记 [P]
- Stage 3: T009（文档核对）与 T010（新增测试文件）文件独立，标记 [P]
- Stage 2 六条任务同改 `workflows/build-code/SKILL.md` 一个文件，不可并行，严格顺序 T003→T004→T005→T006→T007→T008

## Implementation Strategy

1. 完成 Stage 1（基础设施：来源统一 + 字段扩展）
2. 完成 Stage 2（六个质量能力章节顺序写入 SKILL.md）
3. 完成 Stage 3（一致性核对 + 单测），`npm test` 全绿即可交付 verify-code 阶段

## Notes

- [P] 任务 = 不同文件、无依赖
- 每条任务至少引用一条 spec.md 中的 FR
- 不碰 `workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/verify-code/SKILL.md`——scope-red-line 文件（见 plan.md Scope Boundary Verification）
- 第二异源审查引擎不在本任务范围（用户已确认接受单引擎）
