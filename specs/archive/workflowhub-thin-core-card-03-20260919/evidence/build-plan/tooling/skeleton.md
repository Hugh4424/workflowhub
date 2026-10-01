# CARD-03 build-plan 骨架（主会话定稿，子代理不得改动本文件的编号、归属、依赖）

工作树 WT = /Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919
卡目录 CD = WT/specs/workflowhub-thin-core-card-03-20260919
材料契约（必读 §0 十条硬规则 + 卡片 17 字段）：/tmp/card03-bp/contract.md
自检命令：node /tmp/card03-bp/validate-post.mjs WT CD
剩余工作清单（含 G1–G24 锚点）：/tmp/card03-bp/remaining.md
基线红输出（已跑过、可直接引用，不必重跑）：/tmp/card03-bp/red/*.txt
范例（照抄格式）：WT/specs/archive/workflowhub-thin-core-card-07-20260919/{spec.md,phases/P1.md,phases/index.md}
需求来源：CD/decision-log.md（R 表 :96-117；§二十 路线裁决；## 决定 :874-890）、CD/design.md、PRD = WT/specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:299-310（FR-11…FR-15、AC-11…AC-15）

## 用户已裁决的路线（decision-log §二十，不得重开）
- G1 材料集按阶段区分（make-decision 只要 decision-log.md）+ 回归测试
- G2 schema 扩到校验器 8 值 + 一致性测试（acceptance-result-machine-classes.test.mjs 冻结，不改）
- G3 删除 diff-scanner C2_IRREVERSIBLE_GIT_RULES
- G10/G12/G13 不加新动词/新状态/新控制面：异步走现有 review 入口；失效结果记 unavailable+原因；审查包只收窄选取范围
- G18 删逐文件 sha，保留聚合摘要（运行时计算的 canonical file-closure hash，不另存逐文件值）
- G22 删 plan-template.md / tasks-template.md，修引用它们的测试
- 默认不做：退役表机器读数、M5 机器拦截、§18.5 两条、repository-inventory.tsv（冻结）
- 约束：card-04 B-02 不加阻塞门；B-06 不加哈希绑定/回执/快照/材料身份门；B-08 不加 schema 新字段/CLI 动词/控制面（G2 是扩已有枚举到已冻结的 8 值，不是新字段）

## Phase 划分（写集按"领地"划分，路径只能属于一个 Phase）

| Phase | 标题 | 领地（只能写这些，精确路径由该 Phase 作者核实后列出） | 依赖 | 任务 |
| --- | --- | --- | --- | --- |
| P1 | 派活方法文本落地与文档归位 | workflows/{make-decision,build-spec,build-plan,build-code,verify-code}/SKILL.md（及确需改的同目录 steps.json）、AGENTS.md、CONTEXT.md、docs/standard-workflow.md、docs/stage-atomic-step-inventory.md、根目录 HANDOFF-make-decision-card07.md / HANDOFF-make-decision.md / findings.md / progress.md / task_plan.md 及其 git mv 目标 docs/archive/retired-root-progress/*、tests/p0-foundation-contracts.test.mjs、新测试 tests/contract/card03-dispatch-method.test.mjs | none | T001, T002 |
| P2 | skill 包去逐文件 sha 与旧模板删除 | skills/*/skill-bundle.json（全部 39 个）、skills/catalog.yaml、skills/spec-plan/**、skills/spec-tasks/**、runtime/adapters/local-skill-resolver.mjs、runtime/evidence/check-skill-closure.mjs、runtime/evidence/skill-static-deps.mjs、runtime/distribution/*.mjs、tools/architecture/clean-install.mjs、tools/architecture/complexity-report.mjs、core/__tests__/check-skill-closure.test.mjs、core/__tests__/skill-static-deps.test.mjs、tests/skill-provenance-strict.test.mjs、tests/integration/distribution-closure.test.mjs、tests/integration/runner-clean-install*.mjs、tests/contract/filled-plan-task-production.test.mjs、tests/contract/ui-frontend-governance*.mjs、tests/contract/material-producer-consumer-roundtrip.test.mjs、scripts/__tests__/smoke-local-skill-dispatch.test.mjs、tests/contract/spec-prd-skill-contract.test.mjs、docs/architecture/move-map.json、新测试 tests/contract/card03-skill-bundle-closure.test.mjs | none | T003, T004, T005 |
| P3 | T-018 运行时快照绑定收缩 | runtime/evidence/quality-fact.mjs、runtime/evidence/canonical-evidence-validators.mjs、runtime/evidence/research-report.mjs、runtime/evidence/freshness.mjs、runtime/stage/stage-runner.mjs、tools/cli/stage-runtime.mjs、docs/quality/business-case-catalog.json、workflows/build-code/case-reconciliation.mjs、workflows/build-code/targeted-capture.mjs、tests/contract/business-case-source-binding.test.mjs、tests/contract/review-budget-deletion.test.mjs、新测试 tests/contract/card03-runtime-binding.test.mjs | none | T006, T007 |
| P4 | 审查编排修复 | runtime/review/**（review-record-route.mjs、review-input-bounds.mjs、schemas/ac-evidence-summary.schema.json 等）、skills/wh-review/scripts/*.mjs（不含任何 skill-bundle.json）、tests/contract/review-materials-contract.test.mjs、tests/contract/governance-review-dispatch-boundary.test.mjs、新测试 tests/contract/card03-review-orchestration.test.mjs、tests/contract/ac-evidence-schema-domain.test.mjs | P2 | T008, T009, T010, T011 |
| P5 | 残留缺陷与既有红 | runtime/task/material-workspace.mjs、workflows/build-code/diff-scanner.mjs、tests/build-code-diff-only.test.mjs、tests/contract/post-phase-contract.test.mjs、tests/contract/phase-quality-handoff.test.mjs、tests/contract/build-code-apply-contract.test.mjs、tests/contract/review-step-forward-progress.test.mjs、runtime/stage/stage-agent-outcome-adapter.mjs、tests/contract/verify-code-binding-derivation.test.mjs（仅在确需改时）、新测试 tests/contract/material-set-per-stage.test.mjs | P2, P3 | T012, T013, T014 |
| P6 | CARD-03 当前范围验收 | tests/acceptance/card-03-current.mjs、tests/acceptance/card-03-current.test.mjs | P1, P2, P3, P4, P5 | T015（唯一 acceptance_role: acceptance 卡） |

P4 依赖 P2 的原因：P4 改 skills/wh-review/scripts/*，P2 先让 skill-bundle.json 不再随文件内容变（去逐文件 sha），P4 不必碰 bundle。P4 不得在 skills/wh-review 下新增/删除文件（那会改 bundle 的 files 列表，属于 P2）。
若某项修复必须改别的 Phase 领地里的文件：不要写进自己的写集，在卡片 STOP/风险里写明"需回到 Pn owner"，并在回报里告诉主会话。

## 任务、FR、AC、ORACLE 编号（全局固定，不得增删改号）

| Task | Phase | 内容（对应条目） | FR | AC | ORACLE |
| --- | --- | --- | --- | --- | --- |
| T001 | P1 | 五个正式阶段 SKILL 各加"按工作类型派子代理"方法章节并引用 AGENTS.md 唯一权威；AGENTS.md 补三条可观察条款（不整份继承上下文、不空转轮询、跨 Phase 不全量快照绑定）；G-1 两侧落地；OI-002 连续上下文返修条款（OI-001/002/005/011） | FR-DISP-001 | AC-DISP-001 | ORACLE-DISP-001 |
| T002 | P1 | 小修与归位：T-023 CONTEXT.md:258-262；F-9 workflows/make-decision/SKILL.md:345-346；T-027 docs/stage-atomic-step-inventory.md:13-26,:42-54 + tests/p0-foundation-contracts.test.mjs:55；T-029 根目录五个过程文件 git mv 到 docs/archive/retired-root-progress/ + AGENTS.md 一行；T-030 workflows/build-plan/SKILL.md:209-215；G14 build-code SKILL finding 分级消费 | FR-DISP-003 | AC-DISP-003 | ORACLE-DISP-003 |
| T003 | P2 | G18 删 skills/*/skill-bundle.json 的 files[].sha256，保留运行时聚合摘要；改所有逐文件 sha 消费方 | FR-SKL-001 | AC-SKL-001 | ORACLE-SKL-001 |
| T004 | P2 | G22 删 skills/spec-plan/templates/plan-template.md、skills/spec-tasks/templates/tasks-template.md 并修引用测试；G24 material-producer-consumer-roundtrip.test.mjs:15 红 + check:skill-closure 3 条既有红（check-skill-closure.mjs:703-704） | FR-SKL-002 | AC-SKL-002 | ORACLE-SKL-002 |
| T005 | P2 | phase-template.md 增加工作包声明字段（接口符号、合并责任、progress_cursor；OI-004/OI-009/SD-11）并修 :12 MD028、:14 MD032 | FR-DISP-002 | AC-DISP-002 | ORACLE-DISP-002 |
| T006 | P3 | G5 T-018 冻结候选（quality-fact.mjs:48；canonical-evidence-validators.mjs:251,:322-328,:397-399,:433；research-report.mjs:22；freshness.mjs；stage-runner.mjs；stage-runtime.mjs H-1）收缩跨 Phase 全量快照绑定；G6 残余全量绑定并入；G17 business-case-catalog source.revision 稳定锚；G19 稳定锚绑定轴（design.md:1397-1405、:2507-2508）。注意 card-04 C-18 validateAcceptanceEvidence 链（freshness.mjs:56/:710） | FR-RT-001 | AC-RT-001 | ORACLE-RT-001 |
| T007 | P3 | G15 tools/cli/stage-runtime.mjs:2006 allowedRunFields 残留 "review_budget"（对照 tests/contract/review-budget-deletion.test.mjs:90/:92/:98） | FR-RT-002 | AC-RT-002 | ORACLE-RT-002 |
| T008 | P4 | G11 派发前契约预检（review-record-route.mjs recordSimpleReviewRequest）；G12 失效结果记 unavailable+原因（simple-review-runner.mjs）；G10 异步走现有 review 入口（design.md:3374-3375）；G13 审查包只收窄选取范围（review-input-bounds.mjs） | FR-REV-001 | AC-REV-001 | ORACLE-REV-001 |
| T009 | P4 | G16 review-record-route 三缺陷（allowHistoricalPartialCoverage :1305/:1792/:1898；importCanonicalReviewResult 只导入）先核实 CARD-05 后是否仍在；G20 同一三元组语义审查复用 | FR-REV-002 | AC-REV-002 | ORACLE-REV-002 |
| T010 | P4 | G4 skills/wh-review/stage-skill-plan.json 与 runner（skills/wh-review/scripts/review-materials.mjs:59）一致：改 runner，不改被冻结的 plan 与 stage-routing-and-concrete-testing.test.mjs:92-93 | FR-SKL-003 | AC-SKL-003 | ORACLE-SKL-003 |
| T011 | P4 | G2 runtime/review/schemas/ac-evidence-summary.schema.json:32-34 的 result/leaf_result/status 枚举扩到 runtime/evidence/acceptance-evidence-validator.mjs:6 的 8 值 + 一致性测试 | FR-FIX-002 | AC-FIX-002 | ORACLE-FIX-002 |
| T012 | P5 | G1 runtime/task/material-workspace.mjs:9/:13 材料集按阶段区分，make-decision 只要 decision-log.md，post 且 build-plan 及之后仍要 spec.md + phases/index.md + 回归测试（复现 decision-log §十九 `post Phase index is missing`） | FR-FIX-001 | AC-FIX-001 | ORACLE-FIX-001 |
| T013 | P5 | G3 删 workflows/build-code/diff-scanner.mjs:20-29 C2_IRREVERSIBLE_GIT_RULES 死规则，tests/build-code-diff-only.test.mjs 保持绿 | FR-FIX-003 | AC-FIX-003 | ORACLE-FIX-003 |
| T014 | P5 | G21 T-031 四条既有红（decision-log :75；build-code-apply-contract.test.mjs:15/:31/:57；review-step-forward-progress.test.mjs:97） | FR-FIX-004 | AC-FIX-004 | ORACLE-FIX-004 |
| T015 | P6 | CARD-03 当前范围验收：PRD AC-11…AC-15 真实跑；上述全部 ORACLE 汇总；基线红不新增（基线 33 文件 / 15 失败文件 / 38 失败测试 + skill-closure 3 条，其中本卡修掉的应转绿） | FR-ACC-001 | AC-ACC-001 | ORACLE-ACC-001 |

Consumer 文本（index 与 Phase 头必须逐字一致）：
- P1：build-code 主会话与五阶段执行者、verify-code 方法文本回读。
- P2：skill resolver、check:skill-closure、分发打包、P4 的 wh-review 脚本改动。
- P3：stage-runner 质量事实写入、verify-code 证据校验。
- P4：build-plan / build-code / verify-code 的 review 步骤。
- P5：stage reflect、build-code diff 扫描、既有测试基线。
- P6：verify-code 最终验收与 CARD-03 收口。

semantic anchor：phase-p1 … phase-p6。
evidence_path 统一放 quality/tests/<card>/Pn/...（写 N/A 以外的具体路径；build-plan 不写回执）。
