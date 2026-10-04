# 迁移表片段 6：治理文档面 + pre 归档清单 + G-3 汇总

- 编制：Card-06 build-plan 文档编制子代理（片段 6）。只读来源：认证 worktree `specs/workflowhub-thin-core-card-06-20260919/`、外置任务存储 `~/Knowledge/Projects/workflowhub/tasks/`（只读）。
- 主来源：`quality/evidence/research/2026-09-30-06-docs-pre-survivors.md`（§1 治理文档、§2 pre 数据、§3 幸存者、§4 G-3、§5 pre 入口点、附录 A 清单）。
- 次来源：`research/2026-09-30-01-…md` §6、`02-…md` §7、`03-…md` §8、`04-…md` §5、`05-…md` §2（G-3 候选 5 面合并为 25 项）。
- 决策依据：`decision-log.md` ADR-002/004/010/012/014/016/017/018/019/020/021/022。
- 文件清单口径：`git ls-files AGENTS.md CLAUDE.md CONTEXT.md CONSTITUTION.md constitution-checklist.md README.md docs` = **113 条**（docs 107 + 根 6）。`docs/adr/**` 39 条、`docs/research/**` 15 条均已计入。

## 0. 批次映射与计数

| 本表批次记号 | ADR-004 批次语义 | backup 标签 |
|---|---|---|
| B0/P1 | 批次 0 窄工具独立化 | `backup/card-06-b0` |
| B1/P2 | 批次 1 只保护流程形状的测试 | `backup/card-06-b1` |
| B2/P3 | 批次 2 workflows/steps+config（固定轮次/14 步锁） | `backup/card-06-b2` |
| B3/P4 | 批次 3 skills 旧绑定（wh-review 按 ADR-018 分工瘦身） | `backup/card-06-b3` |
| B4/P5 | 批次 4 runtime 机制核心（kernel/fact graph/completion/evidence） | `backup/card-06-b4` |
| B5/P6 | 批次 5 CLI 旧入口 + schemas（含身份哈希消费链） | `backup/card-06-b5` |
| B6/P7 | 批次 6 runtime 瘦身 + move-map 登记 | `backup/card-06-b6` |
| B7/P8 | 批次 7 治理文档 | `backup/card-06-b7` |

处置计数（113 条文档面）：

| 处置 | 数量 | 条目 |
|---|---:|---|
| NARROW | 11 | AGENTS.md、CONTEXT.md、CONSTITUTION.md、constitution-checklist.md、README.md、`docs/standard-workflow.md`、`docs/cli-tool-mapping.md`、`docs/human-brief-template.md`、`docs/reuse-registry.md`、`docs/contracts/task-context.md`、`docs/contracts/card-01-stage-material-interface.md` |
| DELETE | 1 | `docs/audit-contracts.md` |
| ARCHIVE→docs/archive/ | 35 | docs 根 9 + `docs/operations/*` 5 + `docs/superpowers/*` 11 + `docs/architecture/*` 10 |
| SURVIVOR | 61 | `CLAUDE.md`、`docs/adr/**`39、`docs/research/**`15、`docs/architecture` 2、`docs/multica-monitoring-sop.md`、`docs/skill-version-bump.md`、`docs/contracts/C2-scope-bounds.md`、`docs/templates/project-gitignore.md` |
| PENDING | 5 | `docs/architecture/{move-map,retention-manifest,control-plane-inventory}.json`、`docs/quality/*` 2 |
| **合计** | **113** | — |

- 其中「过时说明文档」ARCHIVE = **25**（docs 根 9 + operations 5 + superpowers 11）；`docs/architecture/*` 的 10 条是前任务证明/快照树认证产物（也 ARCHIVE，但归 B6/P7 而非 B7/P8）。
- 治理文档（权威现行）NARROW = 6：AGENTS.md、CONTEXT.md、CONSTITUTION.md、constitution-checklist.md、README.md、`docs/standard-workflow.md`。
- **测试/打包依赖（硬约束）**：`tools/cli/verify-structure.mjs` 校验 README/CONTEXT/CONSTITUTION/checklist 文本；`runtime/distribution/runner-release.mjs` 与 `runtime/evidence/invocation-identity.mjs` 打包或哈希 `AGENTS.md`/`CONSTITUTION.md`；约 12 个 doc-text 测试钉 `docs/standard-workflow.md`。故 **B7/P8 依赖 B1/P2（流程形状测试）与 B5/P6（身份哈希消费链）先落地**，下表逐条备注。

### 行格式

`| id | path | 现有消费者 | 目标消费者 | 处置 | 批次 | 回滚方式 | G-3 | card03 | 备注 |`

- `回滚方式`：NARROW / ARCHIVE 写 `git revert <Bn 提交>`、`git checkout backup/card-06-b<n> -- <path>`，ARCHIVE 另需 `git mv` 反向；SURVIVOR 写「不适用」。
- `card03`：以 `git diff --name-status main...task/workflowhub/workflowhub-thin-core-card-03-20260919` 判定；本面命中 4 条（AGENTS.md、CONTEXT.md、`docs/standard-workflow.md`、`docs/adr/0032-…`）。Card-03 分支新增的 `docs/adr/0034-subagent-dispatch-and-parallel-rules.md` 不在本 HEAD 清单内（合并后同样 SURVIVOR，归 Card-03 面）。
- `G-3`：引用第 4 节 `G3-NN`，无则 `—`。

## 1. 治理文档面逐文件迁移表（113 条）

### 1.1 仓库根目录（6）

| id | path | 现有消费者 | 目标消费者 | 处置 | 批次 | 回滚方式 | G-3 | card03 | 备注 |
|---|---|---|---|---|---|---|---|---|---|
| MT-7-001 | AGENTS.md | 19 个 .mjs 引用路径串，前 8：`core/__tests__/invocation-identity.test.mjs`、`core/__tests__/protected-paths.test.mjs`、`runtime/distribution/runner-release.mjs`（打包清单 L120）、`runtime/evidence/protected-paths.mjs` L21、`runtime/evidence/runner-identity.mjs` L67、`runtime/stage/stage-handlers.mjs` L2114、`runtime/task/git-worktree-snapshot.mjs` L639、`scripts/__tests__/task-bootstrap.test.mjs`；另 `tools/cli/verify-structure.mjs` L94 | 0（新治理文本不再被 runtime 读取） | NARROW | B7/P8 | `git revert <B7 提交>`；`git checkout backup/card-06-b7 -- AGENTS.md` | G3-11、G3-12 | card03-touch | 改「当前目录职责（Phase 8）」八分区、「当前治理边界」cohort pre/post 材料与 bridge 段、「本任务新增控制面登记」两条（结构化问答工具卡、accepted_risk confirm 语义扩展，改写明语义保留项）、「vNext 永久实施边界」七类 runtime 与 phase_progress 游标；ADR-010 开工横幅改挂 `CARD-06-IN-PROGRESS.md`。**依赖 B1/P2 + B5/P6**（runner-release 打包、runner-identity 存在性检查、verify-structure L94） |
| MT-7-002 | CLAUDE.md | `tools/cli/verify-structure.mjs` L94（存在性/术语） | 同左（不变） | SURVIVOR | — | 不适用 | — | — | 不动；仅「目录约定」段提 `core/scripts/schemas` 历史兼容区与 move-map 先行，若 move-map 退役（见 MT-7-076 PENDING）再改 1 行 |
| MT-7-003 | CONTEXT.md | 11 个 .mjs：`core/__tests__/protected-paths.test.mjs`、`runtime/evidence/protected-paths.mjs`、`tests/contract/post-cohort-governance-materials.test.mjs`、`tests/contract/stage-reflection-e2e-constructed.test.mjs`、`tests/contract/tier-c-deletion-boundary.test.mjs`、`tests/contract/ui-frontend-governance.test.mjs`、`tests/workflow-v2-contract.test.mjs`、`tools/architecture/reference-audit.mjs`；另 `tools/cli/verify-structure.mjs` L98-102（五段术语必须出现/排除术语不得出现） | 交互 stage 的术语查阅（人工/AI 阅读） | NARROW | B7/P8 | `git revert <B7 提交>`；`git checkout backup/card-06-b7 -- CONTEXT.md` | — | card03-touch | 删 L6-24 cohort 路线、L39 stage-reflection、L42-44 stage-handoff 固定写路径、L51 status_matrix、L102-107 执行身份认证/per_invocation、L118 journal+receipt、L123 交互完成记录、L131-137 stage outcome/host bridge、L155 步骤对照、L262 冻结事实集合、L275-278 3rd-review/wh-review 现行术语、L296-298 快照绑定终审、L379-384 阶段完成判据、L412-416 make-decision 完成谓词；历史段就地标「仅审计」；L421/L433 状态更新为已实施；保留 SD-03 7 值、两道人为门、5 窄工具、SD-07 审查点术语。**依赖 B1/P2 + B5/P6** |
| MT-7-004 | CONSTITUTION.md | 16 个 .mjs，前 8：`core/__tests__/invocation-identity.test.mjs`、`core/__tests__/protected-paths.test.mjs`、`runtime/distribution/runner-release.mjs` L121（打包）、`runtime/evidence/invocation-identity.mjs` L58（对 CONSTITUTION.md 取 sha256 = 材料身份哈希）、`runtime/evidence/protected-paths.mjs`、`scripts/__tests__/task-bootstrap.test.mjs`、`tests/contract/execution-identity.test.mjs`、`tests/contract/post-cohort-governance-materials.test.mjs`；另 `tools/cli/verify-structure.mjs` L20-60 | 0（材料身份哈希消费链随 B5/P6 删除） | NARROW | B7/P8 | `git revert <B7 提交>`；`git checkout backup/card-06-b7 -- CONSTITUTION.md` | G3-20 | — | 硬件级约束：**用户已确认 L176「身份与完整性所需现有绑定必须保留」可修订**（改为只保留 Git 提交号 + 不可逆授权核对）；仍须按其自身 Governance 同步规则执行：版本号 v1.9.1 → v1.10.0、修订记录、旧→新映射、checklist 22 条不增减。改 F3 L28-30、F4 L35、F6 L49、F7 L56-58、F8 L63-65、F9 L72、F11 L85-87、Q1 L93、Q2 L100-102、Q3 L107、治理边界 L172 七类、负向条款 L176；保留 close 三义 L194-202 与 F7 不可逆授权语义。**依赖 B5/P6**（invocation-identity 取 sha256、runner-release 打包） |
| MT-7-005 | constitution-checklist.md | 9 个 .mjs：`tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/post-cohort-governance-materials.test.mjs`、`tests/contract/spec-prd-skill-contract.test.mjs`、`tests/per-invocation-doc-contract.test.mjs`、`tests/stage-plan-task-contract-v3.test.mjs`、`tests/stage-risk-acceptance.test.mjs`、`tools/architecture/reference-audit.mjs`、`tools/architecture/verify-final-coverage.mjs`；另 `tools/cli/verify-structure.mjs` L52-60（逐条恰 1 个宪法锚点） | 同左（条目数 = 宪法条目数） | NARROW | B7/P8 | `git revert <B7 提交>`；`git checkout backup/card-06-b7 -- constitution-checklist.md` | G3-20 | — | 与宪法同批同步：改 F3 L11、F6 L14、F8 L16、F11 L19、Q2 L24 判据（去 cohort/认证/preflight）、L47-51 同步记录、L57 close 三义复核；条目数保持 22。**依赖 B1/P2 + B5/P6** |
| MT-7-006 | README.md | `tools/cli/verify-structure.mjs` L87（真实读取本文件；另 72 个 .mjs 命中「README.md」多为测试夹具自带 README） | 同左 | NARROW | B7/P8 | `git revert <B7 提交>`；`git checkout backup/card-06-b7 -- README.md` | — | — | 改 L7「按冻结 activation cohort 选择路线」、L24 `check` 说明、L28-31 pre/post 路线与 `stage-runtime status --action=begin` cohort 回显、L33-41 五阶段速览（删仅 pre 的 build-spec）、L45「已认证的 task worktree」与 host bridge；改为单一四阶段 + 规划两阶段路线。**依赖 B1/P2** |

### 1.2 `docs/` 根目录（16）

| id | path | 现有消费者 | 目标消费者 | 处置 | 批次 | 回滚方式 | G-3 | card03 | 备注 |
|---|---|---|---|---|---|---|---|---|---|
| MT-7-007 | docs/3rd-review-error-and-recovery.md | 无代码消费者（仅 `docs/architecture/repository-inventory.tsv` 记录） | 0（历史只读可查） | ARCHIVE→docs/archive/ | B7/P8 | `git revert <B7 提交>`；`git checkout backup/card-06-b7 -- <path>`；`git mv docs/archive/3rd-review-error-and-recovery.md docs/` | — | — | 旧 broker/3rd-review 异常恢复说明，机制已删；AC-32 历史原件只读可查 |
| MT-7-008 | docs/3rd-review-provider-contract.md | 无 | 0 | ARCHIVE→docs/archive/ | B7/P8 | 同上（`git mv` 反向） | — | — | 旧 provider 合同随旧 broker 退出正常路径（ADR-018 后文档审查面由 wh-review 现行实现承担） |
| MT-7-009 | docs/3rd-review-redesign-draft.md | 无 | 0 | ARCHIVE→docs/archive/ | B7/P8 | 同上 | — | — | 旧 3rd-review 重设计草案（v1），描述已删 broker/sealed contract |
| MT-7-010 | docs/3rd-review-redesign-v2.md | 无 | 0 | ARCHIVE→docs/archive/ | B7/P8 | 同上 | — | — | 同上（v2），随旧链路整组归档 |
| MT-7-011 | docs/audit-contracts.md | `tests/host-independence.test.mjs` | 0（测试随 B1/P2 删/改） | DELETE | B7/P8 | `git revert <B7 提交>`；`git checkout backup/card-06-b7 -- docs/audit-contracts.md` | — | — | 全文 = `steps.json` 唯一拓扑权威 + journal/entry-exit receipt 唯一观察事实 + requirement ledger hash 与 stale 传播，均为已删机制；报告 §1.6 判 DELETE（若要保历史可改 ARCHIVE） |
| MT-7-012 | docs/cli-tool-mapping.md | 无代码消费者 | 0（人工阅读） | NARROW | B7/P8 | `git revert <B7 提交>`；`git checkout backup/card-06-b7 -- docs/cli-tool-mapping.md` | — | — | 改「按冻结 cohort 选 pre 五阶段 / post 四阶段」为单一路线；公共工具表改为 5 窄工具 + `confirm`/`authorize` |
| MT-7-013 | docs/freeze-and-retire.md | 无代码消费者 | 0（历史只读可查） | ARCHIVE→docs/archive/ | B7/P8 | 同上（`git mv` 反向） | — | — | agenthub 冻结退役规则（N₁=3/N₂=5、五局三胜指标、基线快照）属已结束的 m 系/agenthub era，无现行 route 引用；报告 §1.6 因「与 Card-06 删除面无关」判 SURVIVOR，本表按「过时说明文档」统一归口归档，避免 era 文档与现行文档混放 |
| MT-7-014 | docs/human-brief-template.md | 无代码消费者 | 各交互 stage 的大白话输出规则 | NARROW | B7/P8 | `git revert <B7 提交>`；`git checkout backup/card-06-b7 -- docs/human-brief-template.md` | — | — | 大白话摘要模板现行保留（Card-03「证据只留原始件」同源）；只改 L97「计划 hash 只在内部」为窄工具④的 Git 提交号核对（ADR-020） |
| MT-7-015 | docs/migration-and-fallback.md | `tests/host-independence.test.mjs` | 0（历史只读可查） | ARCHIVE→docs/archive/ | B7/P8 | 同上 | — | — | canonical cutover + `audit_summary_hash` tuple + 四分支判定（D8/D11）= 已删机制 |
| MT-7-016 | docs/multica-monitoring-sop.md | 无代码消费者（正文引用 `skills/wh-review/contracts/provider-protocol.md`） | 同左（wh-review 文档面按 ADR-018 保留） | SURVIVOR | — | 不适用 | — | — | 不动；Multica 事实口径（Issue/run/评论不作阶段完成证明）现行有效，与 G3-17 的 `dirty_worktree`/`main_origin_mismatch` 阻断同属必留 |
| MT-7-017 | docs/plain-language-mechanism-design.md | 无代码消费者 | 0（历史只读可查） | ARCHIVE→docs/archive/ | B7/P8 | 同上 | — | — | 「三 gate 两 auto」含仅 pre 的 build-spec 自动放行与「Handoff 累积」，路线已删；大白话原则已由 Card-03 证据硬规则与 `docs/human-brief-template.md` 承接 |
| MT-7-018 | docs/reuse-registry.md | `tests/p0-foundation-contracts.test.mjs`、`tests/reuse-registry.test.mjs` | 0（测试随 B1/P2 删/改） | NARROW | B7/P8 | `git revert <B7 提交>`；`git checkout backup/card-06-b7 -- docs/reuse-registry.md` | — | — | 把「X3 保持独立 3rd-review broker，经 wh-review 薄入口声明 ≥1.2.0 依赖」改为历史条目（ADR-018：文档审查面由 wh-review 现行实现承担） |
| MT-7-019 | docs/skill-version-bump.md | 无代码消费者 | 同左 | SURVIVOR | — | 不适用 | — | — | 不动；现行 skill manifest 版本规则，ADR-013 只删 catalog↔skill-bundle 双层 hash、不删版本规则（「记在每个 execution record」一句可在后续单独收） |
| MT-7-020 | docs/stage-atomic-step-inventory.md | `tests/p0-foundation-contracts.test.mjs`、`tests/workflow-v2-contract.test.mjs`（流程形状测试） | 0（历史只读可查） | ARCHIVE→docs/archive/ | B7/P8 | 同上 | — | — | 固定步骤锁的文档面（`steps.json` 唯一拓扑权威 + legacy section mapping + fail-closed）；报告 §1.6 允许 DELETE 或 ARCHIVE，本表取 ARCHIVE 以保历史可查 |
| MT-7-021 | docs/standard-workflow.md | 12：`AGENTS.md`、`docs/adr/0023-…`、`docs/architecture/move-map.json`、`findings.md`、`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`、`tests/contract/governance-review-dispatch-boundary.test.mjs`、`tests/contract/post-cohort-governance-materials.test.mjs`、`tests/contract/stage-reflection-e2e-constructed.test.mjs`、`stage-reflection-skill-contract`、`tier-c-deletion-boundary`、`workflow-quality-regression`、`tests/fixtures/stage-reflection/ac-mapping.md` | 各 stage 流程说明（人工阅读） | NARROW | B7/P8 | `git revert <B7 提交>`；`git checkout backup/card-06-b7 -- docs/standard-workflow.md` | — | card03-touch | 改 L5/L12-22「先记住三条规则」、L29-42 cohort 表、L44-54 十读取入口、L56-121 通用执行合同（**L84 wh-review 退出正常路径必改**）、L123-185 make-decision（对齐 Card-07 现状）、L187-229 build-spec 节删或挪历史附注、L231-268 build-plan 去 pre 双写、L270-319 build-code 删 `authenticate-current-task-completion` 与快照绑定、L321-360 verify-code 删 receipt、L362-369 mini-task、L371-392 close 五动作**保留**、L394-402 四层状态按 projection 去留改写。**依赖 B1/P2**（12 个 doc-text 测试） |
| MT-7-022 | docs/wh-review-e2e.md | 无代码消费者 | 0（历史只读可查） | ARCHIVE→docs/archive/ | B7/P8 | 同上 | — | — | 旧 wh-review e2e 记录基于已删的 sealed contract/snapshot 机制；AC-32 历史原件只读可查（wh-review 本体按 ADR-018 保留，归档的是这份旧 e2e 说明） |

### 1.3 `docs/adr/**`（39）— 全部 SURVIVOR 原位保留（append-only，规则 1）

| id | path | 现有消费者 | 目标消费者 | 处置 | 批次 | 回滚方式 | G-3 | card03 | 备注 |
|---|---|---|---|---|---|---|---|---|---|
| MT-7-023 | docs/adr/0001-two-layer-review-architecture.md | 无 | 无（历史决策记录） | SURVIVOR | — | 不适用 | — | — | 不动；两层审查（broker 分离）已取代，由 B7/P8 新增 Card-06 ADR 追加「由 Card-06 取代」一行 |
| MT-7-024 | docs/adr/0002-requirement-lineage-and-step-audit.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 不动；requirement lineage & step audit 属已删机制，靠 Card-06 ADR 取代注说明 |
| MT-7-025 | docs/adr/0002-v4-review-exception-state-matrix.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 不动；V4 审查异常矩阵已取代 |
| MT-7-026 | docs/adr/0003-explicit-task-root-and-upstream-lineage.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 不动；显式任务根与血缘已取代 |
| MT-7-027 | docs/adr/0004-minimal-run-model.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 不动；minimal run model 已取代 |
| MT-7-028 | docs/adr/0005-deterministic-task-directory.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 不动；确定性任务目录与单一 Task 上下文已实施，加取代注说明 kernel 消失后的落点 |
| MT-7-029 | docs/adr/0006-single-build-code-contract-with-composable-roles.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 不动；SD-07 每 phase 审查依据，ADR-014/019 显式必留 |
| MT-7-030 | docs/adr/0007-phase-and-integration-review-material-architecture.md | `tests/contract/governance-review-dispatch-boundary.test.mjs`、`tests/workflow-v2-contract.test.mjs` | 同左（B1/P2 后为新链测试） | SURVIVOR | — | 不适用 | — | — | 不动；SD-07 审查材料架构，必留边界 |
| MT-7-031 | docs/adr/0008-same-task-recovery-is-append-only.md | `tests/per-invocation-doc-contract.test.mjs` | 同左 | SURVIVOR | — | 不适用 | — | — | 不动；同任务恢复追加已废止，加取代注 |
| MT-7-032 | docs/adr/0009-same-snapshot-phase0-recovery-requires-explicit-intent.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 不动；同 snapshot Phase recovery（Superseded） |
| MT-7-033 | docs/adr/0009-stage-content-authority.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 不动；stage content authority 属 stage completion/认证面，加取代注 |
| MT-7-034 | docs/adr/0010-serious-review-disposition.md | 无 | 无 | SURVIVOR | — | 不适用 | G3-11 | — | 原文不动；其 `accepted_risk` / repair-or-risk 实现面处置见 G3-11（机器部分 DELETE，语义保留为 finding 处置值） |
| MT-7-035 | docs/adr/0011-authenticated-review-flow-generations.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 不动；认证 review-flow generation 属 OI-013 删除面，加取代注 |
| MT-7-036 | docs/adr/0012-task-local-monitoring-and-derived-projections.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 不动；任务本地监控与派生投影属已删机制 |
| MT-7-037 | docs/adr/0013-mini-task-compact-delivery-flow.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 原文不动；mini-task 依赖 task-close 与 cohort 材料，其去留在 G3-25 预处置中登记 |
| MT-7-038 | docs/adr/0014-vnext-current-material-authority-and-stage-local-repair.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 不动；vNext 根目录四材料（pre 形态）随 pre 退役，post 材料形态见 AGENTS.md vNext 边界 |
| MT-7-039 | docs/adr/0015-ui-design-source-and-initialization.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 不动；UI 设计源，不在删除面 |
| MT-7-040 | docs/adr/0016-external-first-frontend-component-quality.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 不动；前端组件质量，不在删除面 |
| MT-7-041 | docs/adr/0017-stage-quality-fact-freshness-scope.md | `tests/contract/tier-c-deletion-boundary.test.mjs` | 同左 | SURVIVOR | — | 不适用 | — | — | 不动；质量事实新鲜度范围属 freshness 链（B4/P5 删除面），加取代注 |
| MT-7-042 | docs/adr/0018-single-close-delivery.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 不动；close 唯一交付动作 = 不可逆授权必留语义 |
| MT-7-043 | docs/adr/0019-canonical-quality-ownership-and-compatibility.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 不动；质量事实单一归属与旧记录兼容属已删机制 |
| MT-7-044 | docs/adr/0020-close-five-actions-quality-transcription.md | `tests/contract/tier-c-deletion-boundary.test.mjs` | 同左 | SURVIVOR | — | 不适用 | — | — | 不动；close 五动作逐项授权必留（G3-02/窄工具④语义来源） |
| MT-7-045 | docs/adr/0021-stage-reflection-judgment-layer.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 不动；强制 reflection（REFL-001 事故来源）属已删机制 |
| MT-7-046 | docs/adr/0022-candidate-pool-judgment-whitelist.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 不动；候选池白名单属已删机制 |
| MT-7-047 | docs/adr/0023-stage-reflection-execution-and-status.md | `docs/standard-workflow.md`（反向引用） | 同左 | SURVIVOR | — | 不适用 | — | — | 不动；stage-reflection 执行闭环属已删机制 |
| MT-7-048 | docs/adr/0024-remove-host-session-binding.md | `tests/contract/session-binding-removed.test.mjs` | 同左 | SURVIVOR | — | 不适用 | — | — | 不动；移除宿主会话绑定与薄核心方向一致，保留 |
| MT-7-049 | docs/adr/0025-convergence-outline-and-close-loop.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 不动；收敛大纲与收口闭环属已删机制 |
| MT-7-050 | docs/adr/0025-planning-branch-and-maintainable-prd.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 不动；规划支线与可维护 PRD = 新路线依据 |
| MT-7-051 | docs/adr/0025-review-dispatch-preflight-boundaries.md | `tests/contract/governance-review-dispatch-boundary.test.mjs` | 同左（B1/P2 后为新链测试） | SURVIVOR | — | 不适用 | — | — | 不动；review dispatch preflight 属已删机制 |
| MT-7-052 | docs/adr/0026-equivalent-stage-outcome-attempts.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 不动；等价 stage outcome attempts 属已删机制 |
| MT-7-053 | docs/adr/0027-planning-task-question-boundary.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 不动；规划任务提问边界 = 新路线依据（结构化问答卡的文本契约来源之一） |
| MT-7-054 | docs/adr/0027-test-feedback-runtime-profile.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 原文不动；test runtime profile（`measure-test-runtime-profile.mjs` receipt）去留属 PENDING，不在本面裁定 |
| MT-7-055 | docs/adr/0028-plan-slicing-and-review-budget.md | `tests/contract/review-budget-deletion.test.mjs` | 同左 | SURVIVOR | — | 不适用 | — | — | 不动；计划切片与审查结果复用属已删机制 |
| MT-7-056 | docs/adr/0029-current-ac-and-close-state.md | `tests/contract/tier-c-deletion-boundary.test.mjs` | 同左 | SURVIVOR | — | 不适用 | — | — | 原文不动；`current-close-projection` 为 Card-08 幸存（见第 5 节），随 projection 去留的登记见 G3-23 |
| MT-7-057 | docs/adr/0030-mechanism-simplification-deletion-boundary.md | `tests/contract/tier-c-deletion-boundary.test.mjs` | 同左 | SURVIVOR | — | 不适用 | — | — | 不动；机制简化删除边界，Card-06 迁移表另起不复用其 `deletion-plan.json` |
| MT-7-058 | docs/adr/0031-hosted-method-toolkit-direction.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 不动；宿主承载方法工具包方向 = 新路线依据 |
| MT-7-059 | docs/adr/0031-review-check-downgrade-and-identity-boundary.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 不动；审查「非身份类严格判定」降级与身份边界属身份面，加取代注 |
| MT-7-060 | docs/adr/0032-review-chain-delegation-and-layer-contract.md | 无 | 无 | SURVIVOR | — | 不适用 | — | card03-touch | 不动；Card-05 新审查链（ADR-014/019 必留边界）；Card-03 分支改过本文件，合并后按 Card-03 文本为准 |
| MT-7-061 | docs/adr/0033-acceptance-truth-presentation-and-cohort-parity.md | 无 | 无 | SURVIVOR | — | 不适用 | — | — | 原文不动；标题含 cohort parity，cohort 消失后由 B7/P8 新增 Card-06 ADR 取代注覆盖，不改原文（ADR append-only） |

### 1.4 `docs/architecture/**`（15）

| id | path | 现有消费者 | 目标消费者 | 处置 | 批次 | 回滚方式 | G-3 | card03 | 备注 |
|---|---|---|---|---|---|---|---|---|---|
| MT-7-062 | docs/architecture/move-map.json | 15：`AGENTS.md`、`CLAUDE.md`、`README.md`、`docs/operations/deferred-tasks-m17.md`、`runtime/evidence/workflow-evolution.mjs`、`tests/contract/repository-governance.test.mjs`、`tests/contract/tier-c-deletion-boundary.test.mjs`、`tests/contract/ui-frontend-governance.test.mjs`、`workflow-evolution-candidates/-governance/workflow-quality-regression` 测试、`tests/fixtures/workflow-evolution/run-browser-qa.sh`、`tests/integration/governance-diagnostics-non-gate.test.mjs`、`tools/architecture/phase0-deletion-disposition.mjs`、`tools/cli/build-reflection-page.mjs` L563/L671 | 批次 6 的目录职责登记（唯一事实 → 待定） | PENDING | B6/P7 | 决定后按 NARROW/ARCHIVE 同法：`git revert <B6 提交>`；`git checkout backup/card-06-b6 -- <path>` | — | — | 含 `sha256_before/after`（402 entries）与 ADR-016 冲突：ADR-003 要求批次 6「以 move-map 登记澄清 runtime 名称」——续用（去哈希字段）还是冻结归档 + 另起普通文本登记，build-plan 待定 |
| MT-7-063 | docs/architecture/deletion-plan.json | `tests/contract/tier-c-deletion-boundary.test.mjs`、`tests/integration/governance-diagnostics-non-gate.test.mjs`、`tools/architecture/phase0-deletion-disposition.mjs` | 0（历史只读可查） | ARCHIVE→docs/archive/ | B6/P7 | `git revert <B6 提交>`；`git checkout backup/card-06-b6 -- <path>`；`git mv` 反向 | — | — | 前任务 Phase 0 删除计划（DEL-01~12 + `c6_amendment`）；policy「缺证明或用户确认一律 KEEP」冻结为历史，本卡迁移表另起不复用 |
| MT-7-064 | docs/architecture/retention-manifest.json | `tests/integration/governance-diagnostics-non-gate.test.mjs`、`tools/architecture/phase0-deletion-disposition.mjs`、`tools/architecture/reference-audit.mjs`、`tools/architecture/retention-audit.mjs` | 批次 6 削删后的留存量表 | PENDING | B6/P7 | 同上 | — | — | `retain` 整目录保留 `runtime/evidence/`、`runtime/review/`、`tests/` 与本卡删除面正面冲突，且把 bridge/stage-review-disposition 标 KEEP；必须改写 retain 或整体退役，否则 `retention-audit.mjs`/`reference-audit.mjs` 把删除报成违例 |
| MT-7-065 | docs/architecture/control-plane-inventory.json | `docs/adr/0029-…`、`tests/contract/control-plane-governance.test.mjs`、`tests/contract/current-close-projection-readback.test.mjs`、`tests/contract/review-budget-deletion.test.mjs`、`tests/contract/tier-c-deletion-boundary.test.mjs` | 删后逐条 disposition 改写的登记表 | PENDING | B6/P7 | 同上 | — | — | 12 controls 逐条改 disposition；`current-close-projection` 与 Card-08 幸存一致（第 5 节） |
| MT-7-066 | docs/architecture/complexity-baseline.json | `tools/architecture/{inventory,complexity-report,retention-audit,phase0-deletion-disposition}.mjs` | 0（只读冻结） | ARCHIVE→docs/archive/ | B6/P7 | 同上 | — | — | 前任务复杂度基线，不再作为任何门的输入 |
| MT-7-067 | docs/architecture/final-complexity-report.json | 同上 | 0 | ARCHIVE→docs/archive/ | B6/P7 | 同上 | — | — | 含 `snapshot_tracked_tree_sha256` 的快照树认证产物，只读冻结 |
| MT-7-068 | docs/architecture/deletions-proof.json | 同上 | 0 | ARCHIVE→docs/archive/ | B6/P7 | 同上 | — | — | 前任务删除证明（aggregate sha256），只读冻结 |
| MT-7-069 | docs/architecture/legacy-import-proof.json | 同上 | 0 | ARCHIVE→docs/archive/ | B6/P7 | 同上 | — | — | 多 aggregate sha256 的 import 证明，只读冻结 |
| MT-7-070 | docs/architecture/history-inventory.json | `tools/architecture/history-inventory.mjs`、`tools/architecture/retention-audit.mjs`、`tests/integration/history-read-only.test.mjs` | 0 | ARCHIVE→docs/archive/ | B6/P7 | 同上 | — | — | 465 文件字节 oracle，历史快照只读 |
| MT-7-071 | docs/architecture/repository-inventory.tsv | `tools/architecture/inventory.mjs`、`tests/contract/repository-inventory.test.mjs` | 0 | ARCHIVE→docs/archive/ | B6/P7 | 同上 | — | — | 仓库盘点 TSV，只读冻结 |
| MT-7-072 | docs/architecture/final-coverage-audit.md | `tools/architecture/verify-final-coverage.mjs`、`tools/architecture/{complexity-report,retention-audit}.mjs` | 0 | ARCHIVE→docs/archive/ | B6/P7 | 同上 | — | — | 前任务最终覆盖率审计，只读冻结 |
| MT-7-073 | docs/architecture/legacy-task-inventory.json | `tests/contract/legacy-zero.test.mjs`、`tests/integration/history-read-only.test.mjs`、`tools/architecture/inventory.mjs` | 0 | ARCHIVE→docs/archive/ | B6/P7 | 同上 | — | — | 历史口径 106 任务（legacy 66 / unsupported 40）、`active_count` 91、`user_confirmation: pending`，与第 2 节 124 项口径不同；保留只读并在 `README-ARCHIVED.md` 说明 |
| MT-7-074 | docs/architecture/test-asset-inventory.md | 无 | 0 | ARCHIVE→docs/archive/ | B6/P7 | 同上 | — | — | CARD-04 P9 盘点，只读 |
| MT-7-075 | docs/architecture/real-entry-inventory.md | 无代码消费者 | 同左（人工阅读） | SURVIVOR | — | 不适用 | — | — | 不动；SD-05「真实入口实跑」依据，保留 |
| MT-7-076 | docs/architecture/test-asset-governance-rules.md | `vitest.config.mjs` L26（注释） | 同左 | SURVIVOR | — | 不适用 | — | — | 不动；真实测试/验收规则，保留（与 `docs/quality/*` 的 PENDING 不同，本文件是规则不是机器消费清单） |

### 1.5 `docs/contracts/**`（3）

| id | path | 现有消费者 | 目标消费者 | 处置 | 批次 | 回滚方式 | G-3 | card03 | 备注 |
|---|---|---|---|---|---|---|---|---|---|
| MT-7-077 | docs/contracts/C2-scope-bounds.md | `workflows/build-code/diff-scanner.mjs`（文档引用） | 同左 | SURVIVOR | — | 不适用 | — | — | 不动；diff-scanner 有界改动合同 = 窄工具①范围核对依据（G3-21 必留） |
| MT-7-078 | docs/contracts/card-01-stage-material-interface.md | `tests/integration/card-01-dual-journey.test.mjs` | 0（测试随 B1/P2 删/改） | NARROW | B7/P8 | `git revert <B7 提交>`；`git checkout backup/card-06-b7 -- docs/contracts/card-01-stage-material-interface.md` | — | — | 删 cohort 材料接口（pre 四材料 / post 三件），改为单一材料形态描述 |
| MT-7-079 | docs/contracts/task-context.md | `tests/per-invocation-doc-contract.test.mjs` | 同左 | NARROW | B7/P8 | 同上 | — | — | 去 kernel 措辞与 L25「每次调用认证与遗留迁移」整段，保留 `storageRoot`/`taskPath` 路径解析（= 窄工具①） |

### 1.6 `docs/quality/**`（2）

| id | path | 现有消费者 | 目标消费者 | 处置 | 批次 | 回滚方式 | G-3 | card03 | 备注 |
|---|---|---|---|---|---|---|---|---|---|
| MT-7-080 | docs/quality/business-case-catalog.json | 10：`runtime/stage/stage-runner.mjs`、`tools/cli/stage-runtime.mjs` L1404、`workflows/build-code/{capture,case-reconciliation,targeted-capture}.mjs`、测试 `build-code-case-reconciliation`、`build-code-targeted-capture`、`business-case-catalog`、`business-case-source-binding` | 待定（F-007 裁定） | PENDING | B2/P3 | 决定后按 NARROW/ARCHIVE 同法：`git revert <B2 提交>`；`git checkout backup/card-06-b2 -- <path>` | — | — | 去留取决于 F-007 对 `workflows/build-code/{capture,case-reconciliation,targeted-capture}.mjs` 的裁定；真实命令采集若留为窄工具②则本体保留（与 G3-14 同批） |
| MT-7-081 | docs/quality/test-asset-registry.json | 10：`workflows/build-code/{case-reconciliation,case-selection,test-asset-inventory}.mjs`、测试 `build-code-case-*`、`build-code-test-registry`、`card04-final-aggregate` | 待定（F-007 裁定） | PENDING | B2/P3 | 同上 | — | — | 同 MT-7-080；机器消费清单，随 build-code case 机制裁定 |

### 1.7 `docs/operations/**`（5）

| id | path | 现有消费者 | 目标消费者 | 处置 | 批次 | 回滚方式 | G-3 | card03 | 备注 |
|---|---|---|---|---|---|---|---|---|---|
| MT-7-082 | docs/operations/claude-e2e-sample.md | 无 | 0（历史只读可查） | ARCHIVE→docs/archive/ | B7/P8 | `git revert <B7 提交>`；`git checkout backup/card-06-b7 -- <path>`；`git mv` 反向 | — | — | M17 运维留档（outcome-packet 样例），机制已删 |
| MT-7-083 | docs/operations/clean-install-archive.md | 无 | 0 | ARCHIVE→docs/archive/ | B7/P8 | 同上 | — | — | M17 干净安装留档 |
| MT-7-084 | docs/operations/codex-support-verification.md | 无 | 0 | ARCHIVE→docs/archive/ | B7/P8 | 同上 | — | — | M17 codex 支持验证留档 |
| MT-7-085 | docs/operations/deferred-tasks-m17.md | `docs/architecture/move-map.json`（反向引用） | 0 | ARCHIVE→docs/archive/ | B7/P8 | 同上 | — | — | M17 延期任务留档；move-map 引用随 B6/P7 一并处置 |
| MT-7-086 | docs/operations/old-tree-archive.md | 无 | 0 | ARCHIVE→docs/archive/ | B7/P8 | 同上 | — | — | M17 旧树归档留档 |

### 1.8 `docs/superpowers/**`（11）

| id | path | 现有消费者 | 目标消费者 | 处置 | 批次 | 回滚方式 | G-3 | card03 | 备注 |
|---|---|---|---|---|---|---|---|---|---|
| MT-7-087 | docs/superpowers/plans/2026-07-12-wh-review-v4-implementation.md | 仅 `docs/architecture/repository-inventory.tsv` 记录 | 0（历史只读可查） | ARCHIVE→docs/archive/ | B7/P8 | `git revert <B7 提交>`；`git checkout backup/card-06-b7 -- <path>`；`git mv` 反向 | — | — | wh-review V4 实施计划，V4/sealed contract 机制已删 |
| MT-7-088 | docs/superpowers/plans/2026-07-13-unstaged-review-snapshots.md | 同上 | 0 | ARCHIVE→docs/archive/ | B7/P8 | 同上 | — | — | unstaged review snapshot 设计，快照机制已删 |
| MT-7-089 | docs/superpowers/plans/2026-07-13-wh-review-v4-design-gap-closure.md | 同上 | 0 | ARCHIVE→docs/archive/ | B7/P8 | 同上 | — | — | V4 设计缺口闭合计划 |
| MT-7-090 | docs/superpowers/plans/2026-07-14-review-delivery-plan.md | 同上 | 0 | ARCHIVE→docs/archive/ | B7/P8 | 同上 | — | — | review delivery 计划 |
| MT-7-091 | docs/superpowers/plans/2026-07-15-wh-review-quality-repair.md | 同上 | 0 | ARCHIVE→docs/archive/ | B7/P8 | 同上 | — | — | wh-review 质量修复计划 |
| MT-7-092 | docs/superpowers/plans/2026-07-15-wh-review-sealed-contract-recovery.md | 同上 | 0 | ARCHIVE→docs/archive/ | B7/P8 | 同上 | — | — | sealed contract 恢复计划（机制已删） |
| MT-7-093 | docs/superpowers/plans/2026-07-15-wh-review-simple-reliable-plan.md | 同上 | 0 | ARCHIVE→docs/archive/ | B7/P8 | 同上 | — | — | wh-review 简化计划（历史计划，被 ADR-018 取代） |
| MT-7-094 | docs/superpowers/specs/2026-07-12-wh-review-v4-redesign-design.md | 同上 | 0 | ARCHIVE→docs/archive/ | B7/P8 | 同上 | — | — | V4 重设计稿 |
| MT-7-095 | docs/superpowers/specs/2026-07-14-local-skill-closure-design.md | 同上 | 0 | ARCHIVE→docs/archive/ | B7/P8 | 同上 | — | — | local skill closure 设计（双层 hash 校验机器已随 ADR-013 删除） |
| MT-7-096 | docs/superpowers/specs/2026-07-15-wh-review-simple-reliable-design.md | 同上 | 0 | ARCHIVE→docs/archive/ | B7/P8 | 同上 | — | — | 自标「现行简化设计（2026-09-28）」，仍属旧 wh-review 简化稿；归档时必须追加历史标注，否则仍像现行路径 |
| MT-7-097 | docs/superpowers/specs/2026-07-15-wh-review-simple-reliable-review.md | 同上 | 0 | ARCHIVE→docs/archive/ | B7/P8 | 同上 | — | — | 上述设计的评审记录 |

### 1.9 `docs/research/**`（15）— 全部 SURVIVOR 只读保留（规则 1）

| id | path | 现有消费者 | 目标消费者 | 处置 | 批次 | 回滚方式 | G-3 | card03 | 备注 |
|---|---|---|---|---|---|---|---|---|---|
| MT-7-098 | docs/research/ai-cli-host-skill-distribution.md | 无代码消费者 | 同左（只读调研） | SURVIVOR | — | 不适用 | — | — | 不动；`docs/research/**` 整片只读保留 |
| MT-7-099 | docs/research/claude-code-plugin-system-research-2026-09-05.md | 无 | 同左 | SURVIVOR | — | 不适用 | — | — | 不动；调研报告只读 |
| MT-7-100 | docs/research/design-md-executable-source-research-2026-08-22.md | 无 | 同左 | SURVIVOR | — | 不适用 | — | — | 不动 |
| MT-7-101 | docs/research/m18-skill-plugin-distribution-ecosystem-research-2026-09-03.md | 无 | 同左 | SURVIVOR | — | 不适用 | — | — | 不动 |
| MT-7-102 | docs/research/reviews/workflow-path-claude-code.json | 无 | 同左 | SURVIVOR | — | 不适用 | — | — | 不动；`reviews/` 子目录同属只读 |
| MT-7-103 | docs/research/reviews/workflow-path-kimi.json | 无 | 同左 | SURVIVOR | — | 不适用 | — | — | 不动 |
| MT-7-104 | docs/research/reviews/workflow-path-opencode.json | 无 | 同左 | SURVIVOR | — | 不适用 | — | — | 不动 |
| MT-7-105 | docs/research/ui-delivery-contract-external-practices-2026-08-22.md | 无 | 同左 | SURVIVOR | — | 不适用 | — | — | 不动 |
| MT-7-106 | docs/research/ui-frontend-simple-workflow-design-2026-08-22.md | 无 | 同左 | SURVIVOR | — | 不适用 | — | — | 不动 |
| MT-7-107 | docs/research/workflow-path-architecture-blind-review.md | 无 | 同左 | SURVIVOR | — | 不适用 | — | — | 不动 |
| MT-7-108 | docs/research/workflowhub-batch-governance-inventory-20260825.md | 无 | 同左 | SURVIVOR | — | 不适用 | — | — | 不动 |
| MT-7-109 | docs/research/workflowhub-batch-governance-simplification-design-20260825.md | 无 | 同左 | SURVIVOR | — | 不适用 | — | — | 不动 |
| MT-7-110 | docs/research/workflowhub-branch-worktree-audit-20260825.md | 无 | 同左 | SURVIVOR | — | 不适用 | — | — | 不动 |
| MT-7-111 | docs/research/workflowhub-execution-first-redesign-20260825.md | 无 | 同左 | SURVIVOR | — | 不适用 | — | — | 不动 |
| MT-7-112 | docs/research/workflowhub-wh-review-material-identity-incident-20260825.md | 无 | 同左 | SURVIVOR | — | 不适用 | — | — | 不动；材料身份事故调研，是本卡 OI-013 删除哈希的原始依据，只读保留 |

### 1.10 `docs/templates/**`（1）

| id | path | 现有消费者 | 目标消费者 | 处置 | 批次 | 回滚方式 | G-3 | card03 | 备注 |
|---|---|---|---|---|---|---|---|---|---|
| MT-7-113 | docs/templates/project-gitignore.md | `tests/contract/close-sidecar-and-archive.test.mjs` | 同左 | SURVIVOR | — | 不适用 | — | — | 不动；新项目 sidecar `.gitignore` 模板，与删除面无关（close sidecar 预检属 G3-02 必留语义） |

## 2. pre 归档清单（124 项，只读归档）

### 2.1 口径与形态

- **口径**：非 post（无 `task.json.activation_cohort` 字段或旧形态无 `task.json`）且无 `operations/close/completed.json`。
- **decision-log 原口径「117 项」不可复现**：四种口径分别为 124（非 post 且无 `completed.json`）、116（非 post 且无 `operations/close`）、118（非 post、无 `completed.json`、无 `results/verify-code`）、82（有 `task.json` 的 pre 且无 `completed.json`），**无单一口径得 117**；F-008 原始清单未落盘（ADR-009）。本表以 124 项显式口径为归档对象，117 标为「未复现的旧口径」。
- **归档形态取 A（ADR-012 下限）**：只在存储根 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/` 写一份 `README-ARCHIVED.md`（为什么归档、本 124 项清单 = 纯文本目录名 + 最后修改日期、只读查阅方式、接续归 Card-08），**不改任何目录、不改权限、不移动**。
  - 其余候选利弊（报告 §2.4）：**B** README + `chmod -R a-w` 真正防写、可逆，但与 post 任务同父目录，父目录无法只读，且会复制 Card-09 ①「只读目录导致 cleanup 删不掉」的痛点，并改动文件 mode；**C** 移入 `../tasks-archive/` 活跃/历史物理分离最清晰，但破坏 `~/.workflowhub/task-index.json`（112 条）与 facts/quality 内绝对路径引用、`resolveCanonicalTaskPath` 找不到旧任务、移动不可原子回滚，与 CARD-08「不借迁移动用户文件」精神有张力；**D** macOS `chflags uchg` 防写最强但不可搬运（SD-04）、清理需先解锁。
- **计数说明**：`Projects/`（含一份嵌套的 simplicity-close-repair 残留）与 `lessons/`（`make-decision.jsonl`）不是任务目录，一并只读保留但从「任务」计数剔除 → **任务口径 122**。
- 已 close 的 pre 任务 44 项历史只读保留，不在本清单内（报告附录 A 附列）。另有 `/Users/Hugh/Hugh/Knowledge/activation/card-01.json` 激活标记，pre 退役后失去消费者，随 pre 机制一并归档。
- 批次列统一写 `B7/P8`（治理文档批）；报告 §2.3 的 A/B/C/D 月分批见下表统计，仅用于执行时分段核对，不构成额外阶段。

| 月分批 | 最后修改月 | 项数 |
|---|---|---:|
| A | 2026-06 | 7 |
| B | 2026-07 | 85 |
| C | 2026-08 | 22 |
| D | 2026-09 | 10 |
| **合计** | — | **124** |

### 2.2 逐项清单

`| id | 目录名 | 最后修改月 | 处置 | 批次 | 回滚方式 | G-3 | card03 | 备注 |`

| id | 目录名 | 最后修改月 | 处置 | 批次 | 回滚方式 | G-3 | card03 | 备注 |
|---|---|---|---|---|---|---|---|---|
| PRE-001 | `m10-baseline-switch` | 2026-06 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 A） |
| PRE-002 | `m2-microkernel` | 2026-06 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 A） |
| PRE-003 | `m3-narrow-contract` | 2026-06 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 A） |
| PRE-004 | `m4-metrics-foundation` | 2026-06 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 A） |
| PRE-005 | `m5-quality-mechanism` | 2026-06 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 A） |
| PRE-006 | `m6-five-stage-skeleton` | 2026-06 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 A） |
| PRE-007 | `m8-build-code` | 2026-06 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 A） |
| PRE-008 | `m11-build-spec-v1` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-009 | `m12-build-plan-v1` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-010 | `m13a-moat-skills` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-011 | `m9-verify-code` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-012 | `verify-code-work1-hook-review-20260703T073122Z-da8c04` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-013 | `verify-code-work1-hook-review-20260703T073637Z-e8f128` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-014 | `m13-make-decision-v1` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-015 | `m1-scaffold` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-016 | `m13b-build-spec-deepening` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-017 | `m13c-build-plan-deepening` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-018 | `m13d-build-code-deepening` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-019 | `m13e-verify-code-deepening` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-020 | `m7-intake-v1` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-021 | `multica-cost-review` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-022 | `step-gated-audit` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-023 | `wh-review-rebuild` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-024 | `worktree-unification` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-025 | `repo-root-cleanup-20260709T071500Z` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-026 | `m14a-spec-review-wh-fix-1783691538698` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-027 | `m14a-wh-review-acceptance-1783689955377` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-028 | `m14a-wh-review-e2e-82acb86` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-029 | `m14a-wh-review-e2e-82acb86-claude` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-030 | `m14a-wh-review-final-1783690575795` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-031 | `wh-review-e2e-20260710-build-spec` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-032 | `wh-review-e2e-final` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-033 | `wh-review-m14a-43adf99-e2e` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-034 | `m14a-spec-dual-claude-20260711T0025` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-035 | `m14a-spec-dual-kimi-20260711T0025` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-036 | `review-fix-20260711` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-037 | `wh-quality-convergence` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-038 | `ZHI-138` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-039 | `make-decision-audit` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-040 | `m14a-audit-contract-layer` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-041 | `m14b-fact-collection` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-042 | `multica-isolation-recovery` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-043 | `multica-isolation-recovery-v2` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-044 | `multica-minimal-recovery-v4` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-045 | `v4-gap-final-advice-review-20260717` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-046 | `v4-gap-final-advice-review-20260717-v2` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-047 | `m14b-fact-collection-g2` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-048 | `multica-isolation-recovery-v3` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-049 | `prompt-root-init-review-20260719` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-050 | `prompt-root-init-review-20260719-v2` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-051 | `flow-reliability-cli-guidance-review-20260720` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-052 | `flow-reliability-cli-guidance-review-20260720-v2` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-053 | `flow-reliability-cli-guidance-review-20260720-v3` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-054 | `flow-reliability-current-tree-review-20260720000708` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-055 | `flow-reliability-current-tree-review-20260720000735` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-056 | `preaccept-build-repair-guidance-review-20260720` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-057 | `preaccept-build-repair-guidance-review-20260720-v2` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-058 | `self-contained-stage-skill-review-20260720` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-059 | `multica-flow-reliability-final` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-060 | `interaction-quality-amendment` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-061 | `stage-interaction-handoff-completeness` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-062 | `multica-workflowhub-reliability` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-063 | `test-parallel-batch` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-064 | `multica-38f9c897-c4e8-4c13-b4ba-4609fc05f035` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-065 | `multica-3a84ec8b-4601-4fda-8cc9-eefd8350ae5b` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-066 | `multica-5e184887-46f6-4b95-aa9b-878f2e2379c5` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-067 | `multica-6a6ee876-9efa-4a47-933b-9b866a4dfab6` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-068 | `multica-7c039943-bff7-4047-87c8-a02799634564` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-069 | `multica-a0bd3b63-89e7-4519-bfbb-05235ee0434a` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-070 | `multica-b166d00d-23e4-474f-bee8-de1291129fc4` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-071 | `multica-f8ca63bb-a3a0-4d8d-b478-838398b0f2a6` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-072 | `multica-f8ca63bb-a3a0-4d8d-b478-838398b0f2a6-restart-20260724` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-073 | `multica-f8ca63bb-a3a0-4d8d-b478-838398b0f2a6-runnerfix-20260724` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-074 | `multica-workflowhub-reliability-v2` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-075 | `wh-review-bundle-closure-skill-sync` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-076 | `wh-review-materials-v3` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-077 | `build-plan-baseline-rebind` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-078 | `multica-006caae8-09ee-43cd-98ba-fca3f0b94077` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-079 | `multica-1fb79706-c6d9-4284-9e55-d4a4cc9e37a4` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-080 | `multica-296db234-125d-40eb-96d5-abf702d2dbe4` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-081 | `multica-ZHI-850` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-082 | `multica-ZHI-851` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-083 | `multica-ZHI-851-contract-revision-01` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-084 | `multica-ZHI-891` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-085 | `close-conflict-simple` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-086 | `fix-wh-review-predispatch-v2-20260727` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-087 | `review-foundation-baseline` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-088 | `review-foundation-baseline-v2` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-089 | `make-decision-bootstrap-repair` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-090 | `multica-identity-materials-state` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-091 | `review-flow-reset` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-092 | `review-entry-aggregation-simplification` | 2026-07 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 B） |
| PRE-093 | `workflowhub-complexity-governance-v2` | 2026-08 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 C） |
| PRE-094 | `workflowhub-complexity-governance-v3-20260802` | 2026-08 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 C） |
| PRE-095 | `requirements-completeness-review-20260805` | 2026-08 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 C） |
| PRE-096 | `m15-process-degradation-dashboard` | 2026-08 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 C） |
| PRE-097 | `_discarded-m16-experience-loop-repair` | 2026-08 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 C） |
| PRE-098 | `m15-verification-receipt-boundary` | 2026-08 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 C） |
| PRE-099 | `m15-verify-entry-wiring-20260815` | 2026-08 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 C） |
| PRE-100 | `m15-runtime-observability-repair-live-20260815` | 2026-08 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 C） |
| PRE-101 | `m15-verify-entry-wiring-live-20260815` | 2026-08 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 C） |
| PRE-102 | `m15-verify-receipt-entry-live-20260816` | 2026-08 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 C） |
| PRE-103 | `m15-verify-receipt-entry-live-20260816-2` | 2026-08 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 C） |
| PRE-104 | `m15-verify-receipt-entry-live-20260816-3` | 2026-08 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 C） |
| PRE-105 | `wh-review-adversarial-quality-cost-redesign` | 2026-08 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 C） |
| PRE-106 | `wh-review-deferred-exception-close` | 2026-08 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 C） |
| PRE-107 | `m15-runtime-observability-repair` | 2026-08 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 C） |
| PRE-108 | `workflowhub-core-delivery-boundary-repair-20260819` | 2026-08 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 C） |
| PRE-109 | `workflowhub-standard-stage-flow-hardening-20260820` | 2026-08 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 C） |
| PRE-110 | `trust-recovery-frontend-followup` | 2026-08 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 C） |
| PRE-111 | `workflowhub-local-object-integrity-recovery-20260824` | 2026-08 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 C） |
| PRE-112 | `make-decision-requirement-convergence-20260828` | 2026-08 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 C） |
| PRE-113 | `Projects` | 2026-08 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 C） |
| PRE-114 | `agenthub-extraction-program` | 2026-08 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 C） |
| PRE-115 | `ui-e2e-delivery-contract-20260830` | 2026-09 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 D） |
| PRE-116 | `workflowhub-m16-evolution-20260831` | 2026-09 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 D） |
| PRE-117 | `workflowhub-stage-reflection-usability-20260901` | 2026-09 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 D） |
| PRE-118 | `workflowhub-m17-repo-skills-multicli-20260903` | 2026-09 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 D） |
| PRE-119 | `lessons` | 2026-09 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 D） |
| PRE-120 | `workflowhub-close-readiness-governance-20260906` | 2026-09 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 D） |
| PRE-121 | `workflowhub-ui-b0-baseline-t01` | 2026-09 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 D） |
| PRE-122 | `workflowhub-ui-t02-m0-foundation-20260908` | 2026-09 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 D） |
| PRE-123 | `workflowhub-mechanism-simplification-20260910` | 2026-09 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 D） |
| PRE-124 | `workflowhub-thin-core-rebuild-planning-20260919` | 2026-09 | 只读归档 | B7/P8 | 不适用 | — | 否 | 归档对象，不改动（月分批 D） |

## 3. 仓库内 pre cohort 机制入口点（报告 §5）

### 3.1 判定源（决定 pre/post 的地方）

| 文件:行 | 机制 | 批次 |
|---|---|---|
| `tools/cli/task-bootstrap.mjs` L40-77、L226 | `resolveCard01Activation` 读 `<storageRoot>/activation/card-01.json`，缺失/无效 → `pre`；写 `activation_cohort`/`_frozen_at`/`entry_release_commit`；`activation_cohort_observation` 诊断 | B4/P5 |
| `runtime/task/task-topology.mjs` L97-120 | `readActivationCohort`（非 post 一律 pre）、`resolveTopology`/`validateStageForTopology`（pre 五阶段 / post 四阶段） | B4/P5 |
| `runtime/task/material-workspace.mjs` L43-60、L120、L163 | `materialFilesForCohort`（pre = 四材料）、`materialDigestAxes`、`inspectMaterialWorkspace` | B4/P5 |
| `runtime/stage/stage-context.mjs` L8、L38、L92-94、L269 | 上下文按 cohort 装配 | B4/P5 |

### 3.2 分支消费点（`activation_cohort ?? "pre"` 等）

| 文件 | 命中数 | 代表行 | 批次 |
|---|---:|---|---|
| `tools/cli/stage-runtime.mjs` | 47 | L54、85-86、173-190、524、809-861（`deriveNamedStatusRefs`/`deriveStatusRootCauses` 默认 pre）、1056 | B4/P5（CLI 瘦身随 B5/P6） |
| `runtime/stage/stage-runner.mjs` | 46 | L323-349、539、742、1236、1348、1639-1692、1824、2284、2387-2434（`handoffDeclaration`）、3074-3097、3205、3420、3802、4163-4191、4486-4511、4640、4870、5073-5080 | B4/P5 |
| `runtime/stage/stage-agent-outcome-adapter.mjs` | 20 | L211-250、332、469、564、656、725、769、866、1138、1156 | B4/P5 |
| `runtime/task/git-worktree-snapshot.mjs` | 14 | L35-37、265、269、434-524、597（`captureGitWorktreeSnapshot`/`captureExecutionSnapshot`/`assertCurrentSourceDigest` 带 cohort 参数） | B4/P5 |
| `runtime/stage/stage-handlers.mjs` | 14 | L100、1612、2100、2186-2187、2794、3766、3962、4160-4222 | B4/P5 |
| `runtime/stage/completion-predicates.mjs` | 14 | L21-28、47-55、1016-1028 | B4/P5 |
| `runtime/review/integration-review-subject.mjs` | 13 | L41-68、387-445 | B4/P5 |
| `runtime/task/task-kernel-implementation.mjs` | 11 | L694-731、919、981、1036、1056 | B4/P5 |
| `runtime/stage/stage-content-contracts.mjs` | 11 | L5923-5924、6455、6510、6534、6566、6640 | B4/P5 |
| `skills/wh-review/scripts/review-materials.mjs` | 10 | L916-949、1966-2015、2138 | B3/P4（ADR-018 按分工瘦身；技能内代码，非 runtime 分支） |
| `runtime/review/review-record-route.mjs` | 8 | L212-214、1399-1407（`bindBuildPlanReviewCohort`） | B4/P5 |
| `tools/cli/task-close.mjs` / `core/task-close.mjs` | 7 / 4 | L141-182 / L994-999 | B5/P6 / B4/P5 |
| `runtime/review/provider-material-projection.mjs` | 7 | L80-88（`reviewActivationCohort`） | B4/P5 |
| `runtime/evidence/canonical-receipt-writer.mjs` | 6 | L400、488、518-520、736、750 | B4/P5 |
| `runtime/evidence/freshness.mjs` | 5 | L1872 等 | B4/P5 |
| `runtime/stage/stage-handoff.mjs` | 4 | L21、174、181、298 | B4/P5 |
| `skills/wh-review/scripts/simple-review-runner.mjs` | 4 | L367、470、691、729 | B3/P4 |
| `workflows/build-code/change-scope.mjs` / `test-asset-inventory.mjs` | 2 / 1 | L158、180 / L51 | B2/P3 |
| `runtime/task/workspace.mjs`、`runtime/evidence/quality-fact.mjs`、`runtime/evidence/invocation-identity.mjs` | 各 1 | L368 / L54 / L47 | B4/P5 |

### 3.3 文档 / 技能 / 配置层入口

| 对象 | 命中 | 批次 |
|---|---|---|
| `workflows/build-plan/{SKILL.md(9), steps.json(3: L5,10,11)}` | 12 | B2/P3 |
| `workflows/build-code/{SKILL.md(5), steps.json(2: L5,17)}` | 7 | B2/P3 |
| `workflows/build-spec/SKILL.md(3)` | 3 | B2/P3 |
| `workflows/verify-code/SKILL.md(2)` | 2 | B2/P3 |
| `skills/catalog.yaml`（L305、329、361、393） | 4 | B2/P3 |
| `skills/spec-analyze/{SKILL.md(11), packet-lens.md(3)}` | 14 | B2/P3 |
| `skills/spec-specify/SKILL.md(10)` | 10 | B2/P3 |
| `skills/spec-plan/SKILL.md(3)` + `templates/{phase,plan}-template.md` | 3+ | B2/P3 |
| `skills/spec-tasks/SKILL.md(2)` + `templates/{tasks,index}-template.md` | 2+ | B2/P3 |
| `skills/decision-log/SKILL.md(2)` | 2 | B2/P3 |
| `skills/stage-reflection/SKILL.md(1)` | 1 | B2/P3 |
| `skills/testing-system-blueprint/SKILL.md(1)` | 1 | B2/P3 |
| `skills/wh-review/contracts/build-plan.md(2)` | 2 | B2/P3（文本面；wh-review 本体按 ADR-018 B3/P4 瘦身） |
| 治理文档：`AGENTS.md`、`CONSTITUTION.md`、`CONTEXT.md`、`README.md`、`constitution-checklist.md`、`docs/standard-workflow.md`、`docs/cli-tool-mapping.md`、`docs/contracts/card-01-stage-material-interface.md`、`docs/stage-atomic-step-inventory.md`、`docs/adr/0033-…` | — | B7/P8（本表 §1 逐条） |
| 测试：43 个测试文件含 cohort，名称直指的有 `tests/contract/activation-cohort.test.mjs`、`post-cohort-*`（7）、`post-review-cohort-binding`、`stage-agent-outcome-post-cohort`、`tests/integration/card-01-dual-journey.test.mjs` 等 | 43 | B1/P2 |
| 外部数据：`/Users/Hugh/Hugh/Knowledge/activation/card-01.json`（激活标记）；126 个 `task.json` 无 cohort 字段 | — | B7/P8（归档时只读保留，不改文件） |

## 4. G-3 汇总（25 项）

- 来源：5 个调研面的 G-3 候选合并去重（`01` §6 16 项、`02` §7 14 项、`03` §8 12 项、`04` §5 12 项、`05` §2 14 项 → 合并为 25 项）。
- **用户确认状态一律为「待审查时确认」**：ADR-022 已裁定 25 项预处置**不在 build-plan 定死**，留到后续独立审查逐项裁定；本表只登记候选、预处置建议与批次。
- 预处置口径：`B0/P1` 窄工具独立化、`B2/P3` workflows/skills 文本、`B3/P4` skills 旧绑定、`B4/P5` runtime 机制核心、`B5/P6` CLI/schemas、`B7/P8` 治理文档。

| G3-NN | 对象 | 安全职责 | 预处置 | 批次 | 用户确认状态 |
|---|---|---|---|---|---|
| G3-01 | kernel 不可逆授权：`runtime/task/task-kernel-implementation.mjs` 的 `publishIrreversibleAuthorization`（L1091-1094 revision/快照绑定）与 `consumeIrreversibleAuthorization`（L1110-1160 一次性消费/同 step 幂等） | 不可逆授权防错绑/防过期/防重放 | 抽为窄工具④；ADR-020 只核对 Git HEAD，不绑 material_revision/snapshot_tree | B0/P1（抽取）→ B4/P5（删 kernel） | 待审查时确认 |
| G3-02 | task-close 执行器与 close 旁路：`core/task-close.mjs` `executeClosePlan`/`sourceWorktreeStatus` L2155/`createTaskWorktreeRemoval`/`inspectWorktreeCleanup`、`close.execution.lock`、`git-worktree-snapshot.mjs` `assertNoCloseExecutionSidecars`/`listCloseExecutionSidecarPaths` | 不可逆 Git 执行互斥、脏源/脏目标预检、worktree 清理、close sidecar 残留预检 | NARROW 改接①④⑤，语义全保留 | B4/P5（core）+ B5/P6（`tools/cli/task-close.mjs`） | 待审查时确认 |
| G3-03 | 原子写系列：`task-handle.mjs` `writeAtomicAt`/`writeRecordAtomic` + 祖先目录 dev/ino 复核 + `readRegularFileNoFollow`/`assertInside`（O_NOFOLLOW/O_DIRECTORY）、`core/artifact-dir` `writeAtomic`、`material-workspace` `replaceMaterialAtomic` | 原子写、防 symlink/TOCTOU/路径逃逸 | 合一进窄工具③ | B4/P5 | 待审查时确认 |
| G3-04 | 记录锁/store 锁/claim 锁：`task-handle.mjs` `withRecordLockAt`/`lockOwnerDeadOrExpired`/claim 锁、`task-store.mjs` `withStoreLock`、`review-record-route.mjs` `IN_PROCESS_REQUEST_LOCKS`/`requestLockHash`、`canonical-receipt-writer.mjs` `withRecordLock(TEST_CAPTURE_LOCK_REF)` | 互斥、陈旧锁回收（pid/host/machine_id）、防重复派发、测试采集并发 | 合一进窄工具⑤ | B4/P5 | 待审查时确认 |
| G3-05 | `runtime/evidence/workflow-evolution.mjs` 的 `acquireProjectLock`/`assertProjectLockCurrent` | project lock（反思/lesson 并发写） | DELETE | B4/P5 | 待审查时确认 |
| G3-06 | `core/runtime-mode.mjs` `assertRuntimeAuthority`/`quiesceRuntime`/`assertLegacyBridgeReadOnly`（`stage-runtime.mjs` L11 调用） | 运行模式切换互斥、静默期防并发写、历史 bridge 只读 | DELETE | B4/P5 | 待审查时确认 |
| G3-07 | `runtime/evidence/protected-paths.mjs`（`PROTECTED_PATHS`=CONSTITUTION/AGENTS/CONTEXT，`findViolation`；生产零消费者） | protected-paths 改动提醒 | DELETE | B4/P5 | 待审查时确认 |
| G3-08 | `runtime/evidence/write-boundary-preflight.mjs` `assertWriteBoundary`、`runtime/task/workspace.mjs` `prepareTaskWorkspace` L425 path/branch 冲突拒绝、`inspectTargetStatus`、`inspectWorktreeCleanup` | 写边界一致性、冲突拒绝、脏目标预检 | 并入窄工具① | B4/P5 | 待审查时确认 |
| G3-09 | `runtime/evidence/canonical-receipt-writer.mjs` `captureTests` 的测试前后快照比对（L750-751） | 防测试命令改动被测代码 | DELETE（进损失清单） | B4/P5 | 待审查时确认 |
| G3-10 | `task-kernel-implementation.mjs` `publishHumanConfirmation`（`withStoreLock` 临界区）与 human-confirmation 记录形状（v3 内联） | 人为门①的并发一致性 + 记录落点 | 抽为 human-confirm 记录（窄工具④/人为门①的实现），临界区语义保留 | B0/P1（抽取）→ B4/P5（删除原实现） | 待审查时确认 |
| G3-11 | accepted_risk 机器部分：`prepareReviewRiskPause`/`acceptReviewRisk`、`runtime/review/stage-review-disposition.mjs` `buildRiskAcceptance`/`validateRiskAcceptance`、`completion-predicates.mjs` L215-218、`docs/adr/0010`、`risk-acceptance.v1.json`、build-plan `steps.json` step 10、verify-code `steps.json` step 7 | accepted_risk / 风险暂停（AGENTS.md 登记控制面） | DELETE 机器部分；语义保留为 finding 处置值（IO 契约文本保留） | B4/P5 + B3/P4（skill 合同文本） | 待审查时确认 |
| G3-12 | 结构化问答卡机器校验：`stage-content-contracts` `validateInteractionQuestionBatch`、`stage-content-evidence` `validateTalkQuestion`、`stage-agent-outcome-adapter` `validateStageAgentInteractionRounds`、`runtime/schemas/interaction-completion.v1.json`（rich-v1 question batch）、spec-clarify/talk-with-zhipeng/grill-with-docs 的 `reply_ref`/`reply_hash` | 结构化问答工具卡（AGENTS.md 登记控制面） | DELETE 机器校验；IO 契约文本保留 | B4/P5 + B2/P3 | 待审查时确认 |
| G3-13 | 审查中断信号处理：`tools/cli/stage-runtime.mjs` `runReviewRecordWithSignalHandling`；请求锁哈希：`review-record-route.mjs` `IN_PROCESS_REQUEST_LOCKS`/`requestLockHash` | 中断时保证记录 flush；防重复派发 | 保留信号处理；请求锁哈希改用窄工具⑤ | B4/P5（runtime）+ B5/P6（CLI） | 待审查时确认 |
| G3-14 | `workflows/build-code/targeted-runner.mjs` 进程组 TERM/超时 kill/8MiB 输出上限；workspace-runner 进程组保护 | 孤儿进程与输出体量保护（窄工具②安全边界） | 并入窄工具② | B2/P3 | 待审查时确认 |
| G3-15 | review 路径脱敏与边界：`skills/wh-review/scripts/review-materials.mjs` L1119 realpath/symlink/nlink、L1184 renameSync 原子写、L2151 `redactProviderHostPaths`；`review-source.mjs` L69/206/220-221 | 数据外发前脱敏、路径包含边界 | 保留（只删材料身份哈希） | B3/P4 | 待审查时确认 |
| G3-16 | `skills/wh-review/scripts/third-review-host-config.mjs` `atomicReplace`（L75-78）+ 预期 hash 守卫的用户 `~/.config` 配置迁移/恢复（L26-151，realpath/symlink 校验） | 用户全局配置原子写 + 防覆盖 | 保留 | B3/P4 | 待审查时确认 |
| G3-17 | `skills/workflowhub-multica-sync/scripts/multica-skill-sync.mjs` `dirty_worktree`/`main_origin_mismatch` 同步阻断（L368-370） | 同步前阻断脏工作树/主仓 origin 不一致 | 保留（改提示词正则时不得丢） | B2/P3 | 待审查时确认 |
| G3-18 | build-prd `steps.json` step 5 四 revision + 展示稿 hash + `human_approved` | confirm 人为门的版本绑定（「此答复批准此版本」= SD-12 ②） | DELETE 绑定（进损失清单②） | B2/P3 | 待审查时确认 |
| G3-19 | build-plan `steps.json` step 11 `self_check oracle-provenance-prewritten-irreversible` | 不可逆动作前的 oracle 预写自检 | DELETE | B2/P3 | 待审查时确认 |
| G3-20 | `CONSTITUTION.md` F7 + close 三义 L194-202 + 负向条款 L176「身份与完整性所必需的现有绑定仍须保留」 | 不可逆授权的宪法文本 | B7/P8 修宪（**用户已确认可改**：改为只保留 Git 提交号与不可逆授权核对；版本号/修订记录/映射/22 项 checklist 同步） | B7/P8 | 待审查时确认 |
| G3-21 | `workflows/build-code/diff-scanner.mjs` 危险 diff 预检（git push、依赖文件、.env.production） | 危险改动识别（窄工具①/④前置扫描） | 保留 | B2/P3 | 待审查时确认 |
| G3-22 | `runtime/adapters/local-skill-resolver.mjs` 路径包含/符号链接逃逸检查（+ `smoke-local-skill-dispatch.mjs` resolved path 断言） | 防技能包路径逃出 `skills/` | 保留（删 hash 比对） | B4/P5 | 待审查时确认 |
| G3-23 | 外置 pre 任务的 `operations/close/manual-risk-close.json`（5 个）与 `locks/` 目录 | accepted_risk 历史记录、锁 | 只读保留（归档形态 A：不改目录、不改权限，不改其可读性） | B7/P8 | 待审查时确认 |
| G3-24 | `tools/cli/check-task-record-paths.mjs`（静态禁止 caller 传 storage/task path、禁止未登记直写者） | 受保护路径静态防护 | DELETE | B5/P6 | 待审查时确认 |
| G3-25 | `skills/mini-task/scripts/mini-task-runner.mjs`：`task-close-confirmation.v1`/`authorizeResumeOperations`（L742）、`withRecordLock("locks/close.execution.lock")`（L759）、「HEAD changed before authorized commit/merge」漂移预检（L770-808） | 不可逆授权 + 锁 + 漂移预检 | NARROW 改接①④⑤ | B3/P4 | 待审查时确认 |

**阈值结论**：G-3 候选总数 **25 项 > decision-log 推翻阈值 16 项**，已在 build-plan 重估批次计划；**结论是批次顺序不变，只把预处置一次性提前到 build-plan，批次内 G-3 扫描收窄为「未预处置的新发现」**（ADR-022 ①；ADR-006 停下回报协议不变）。

## 5. Card-08 / Card-09 幸存者

### 5.1 Card-08「记录完整性回读检查」在当前仓库的对应物

| 路径：函数 | 作用 | 批次 | 理由 / 附注 |
|---|---|---|---|
| `runtime/task/task-store.mjs`：`readTaskFacts`/`parseFactRecords`/`validateStageRow`（L168-235）、`writeStageRow`（L417-450，保留 `phase_progress`）、`atomicWrite`（L64）、`withStoreLock` | 单文件接续记录读写；坏 JSON 行/未知字段直接抛错；原子写 + 锁 | B4/P5（NARROW 为窄版） | 40 个文件 import；行 schema 仍含 `material_digest`/`snapshot_tree`，NARROW 时须改；G3-03/G3-04 |
| `tools/cli/stage-runtime.mjs`：`derivePhaseProgressStatus`（L1014-1028）+ status 读回 `phaseProgressReadback`（L1697-1711，读不到 facts 报 `facts_jsonl_unreadable`） | 读回 build-code 续跑游标，判 `current`/`stale`（`material_revision_mismatch`） | B5/P6（函数需搬出宿主文件） | 当前唯一「发现陈旧接续记录」的现成检查且非阻断；**冲突**：stale 判据是 `material_revision`（材料内容哈希），与 OI-013 冲突——它只是读回信号、非推进前置，是否算「校验机器」需 build-plan 定（PENDING）；消费者 `tests/contract/stage-progress-contract.test.mjs` |
| `tools/cli/stage-runtime.mjs`：`currentPostPhaseMaterialState`/游标写入校验（L1054-1125，目标 phase/task 必须在当前 index 内） | 写入时拒绝指向不存在 Phase 的游标 | B5/P6 | 属「不完整记录」检查；依赖 `validatePostPhaseContract`（post 合同校验，去留随 F-007） |
| `runtime/task/portable-workflow-run.mjs`：`TERMINAL_STATES`（L8，恰好 SD-03 7 值）、`projectPortableWorkflowStatus`/`readLatestPortableTerminal` | build-prd 便携工作流的 7 值终态读回 | B4/P5（改写而非原样保留） | 仓库里唯一现成的 7 值实现，无 kernel import（只 import `node:*`）；结果文件名用 sha256（`STEP_RESULT_REF`）与 ADR-016 普通文件名规则冲突，须改写；消费者 `tools/cli/stage-runtime.mjs`、`tests/contract/portable-workflow-run.test.mjs`、`tests/acceptance/card-01-current.mjs`、`tests/integration/card-01-dual-journey.test.mjs` |
| `runtime/stage/current-close-projection.mjs`（273 行）：`deriveCurrentCloseProjection`、`derivePhysicalDeliveryStatus` | 只读组合 close 计划 + 物理事实读回；readback 完整则当前状态跟随 readback；自述不拥有存储、不写记录 | B4/P5（调用链去 kernel） | F-007 已判幸存（OI-017）；调用方 `tools/cli/task-close.mjs` L175-179 经 `createTaskKernel` 取快照 → 需去 kernel；测试 `current-close-projection-readback`、`close-remote-branch-cleanup`、`four-domain-close-status`、`tier-c-deletion-boundary` |

幸存测试（真实失败/数据完整性，非流程形状，B1/P2 后保留）：`tests/contract/stage-progress-contract.test.mjs`、`tests/contract/current-close-projection-readback.test.mjs`、`tests/contract/portable-workflow-run.test.mjs`、`tests/integration/minimal-task-storage.test.mjs`、`tests/integration/quality-store-concurrency.test.mjs`。

### 5.2 Card-09 ③「减少材料与证据写入量」

Writing-volume sources（**这些是删除对象，不是幸存者**；删它们本身就是写入量下降来源）：

| 写入源 | 路径模式 | 位置 | 批次 |
|---|---|---|---|
| stage-quality 证据 + acceptance 镜像 | `quality/evidence/stage-quality/<stage>/<subject>-<hash>.json`、`quality/evidence/acceptance/<stage>/…` | `runtime/stage/stage-runner.mjs` L2239/L2259（另 L2850、L2908、P5 L4720-4771、P10 L5218） | B4/P5 |
| stage-quality-missing | `quality/evidence/stage-quality-missing/<stage>/…` | `stage-runner.mjs` L3281-3291 | B4/P5 |
| reflection availability | `quality/evidence/stage-reflection-availability/<hash>.json` | `runtime/stage/stage-reflect.mjs` L483-502 | B4/P5 |
| targeted capture | `quality/evidence/build-code-targeted/{raw,case,manifest}-<hash>` | `workflows/build-code/targeted-capture.mjs` L22-244 | B2/P3 |

需要显式保留（幸存者）：

| 文件/对象 | 批次 | 理由 |
|---|---|---|
| `runtime/task/task-store.mjs`（单文件 `facts.jsonl`，同 stage 原位替换） | B4/P5（NARROW） | 写入量最小的记录形态本身；Card-09 削减以它为落点 |
| `runtime/evidence/quality-store.mjs`：`publishQualityFact` | B4/P5（NARROW） | 若新记录层继续用 `quality/facts`，它是唯一 writer；须按 ADR-016 改普通文件名（当前内容寻址） |
| 真实命令原始输出的单份写入（窄工具②；当前混在 `targeted-capture.mjs` 里） | B2/P3 | Card-03「证据只留原始件」要求每类事实只留一份原始件；②剥离后留一个 writer |
| `runtime/review/review-output.mjs` `MAX_REVIEWER_OUTPUT_BYTES`（128 KiB） | B3/P4 | 审查输出体量上限，与写入量直接相关；属 Card-05 新链 |
| `AGENTS.md`「证据硬规则」段 + `docs/standard-workflow.md` `### 证据只留原始件`（均 **card03-touch**） | B7/P8 | 写入量削减的现行规则来源，批次 7 改写治理文档时**不得删** |
| Card-03 `specs/workflowhub-thin-core-card-03-20260919/attachments/A3b-volume.md` | — | 现成的「修复前」文件数基线 |

**时序风险与处置（用户要求）**：AC-45 要求「同一任务前后对比」。若 B4/P5 先删掉证据包装，Card-09 就失去「修复前」对照。故 **Card-09 写入量基线必须在 B4/P5 首删之前采集一次文件数**，写法：

```bash
find <task> -type f | wc -l
```

（沿用 A3b 口径：Card-04 任务目录 7469 文件 / 173 MB，其中 `quality/evidence/stage-quality/` 6580 文件占 97%；也可由 Card-09 直接引用 A3b 作为基线，二者取其一须在 Card-09 build-plan 明确。）

## 6. 归属说明（不在本片段列行）

- ADR-010 的「card-06 删除进行中」开工横幅**不写进 `AGENTS.md`**，改为新建独立文件 `CARD-06-IN-PROGRESS.md`（NEW，批次 `B0/P1`），收口时删除。该条目属**片段 1 的面**，本片段不列行，仅在此说明，避免与 MT-7-001（AGENTS.md NARROW）重复登记。
- 本表不含 `THIRD_PARTY_NOTICES.md`、`HANDOFF-make-decision.md`、`HANDOFF-make-decision-card07.md`、`findings.md`、`progress.md`、`task_plan.md`（不在片段 6 的文件面：`git ls-files AGENTS.md CLAUDE.md CONTEXT.md CONSTITUTION.md constitution-checklist.md README.md docs`）。
- `specs/archive/**`（94 目录 / 897 文件）为只读区，不入表。
- `docs/adr/0034-subagent-dispatch-and-parallel-rules.md` 仅存在于 Card-03 分支，合并后同样 SURVIVOR 原位保留，归 Card-03 面。
