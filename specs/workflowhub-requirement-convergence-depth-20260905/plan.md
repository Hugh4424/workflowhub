# 实现计划：工作流需求收敛深度改造（审查深化/争议对话/debate v2/调研机制/决策记录/执行模型）

- **Input**：`specs/workflowhub-requirement-convergence-depth-20260905/decision-log.md`、`specs/workflowhub-requirement-convergence-depth-20260905/spec.md`
- **Template version**：`plan-task.v4`
- **Implementation baseline（post-main sync）**：当前 worktree 已于 2026-09-05 fast-forward 到 `main@189f89e8d8a5e5775cc29d828531f0a0222985ec`。该基线包含 M17 repo-skills/multicli 合并提交 `218d6b7d` 及归档提交 `189f89e8`；M17 不改变本任务的 FR/AC、依赖顺序或生产范围，本任务只消费其最新基线，不重做 M17。
- **Carry-forward implementation edits**：当前 worktree 另有两处 build-plan 期间产生、尚未提交的范围内修复：`skills/wh-review/scripts/review-provider-client.mjs` 的 `WH_REVIEW_BROKER_TIMEOUT_MS` 覆盖（默认 600s 不变）与 `runtime/stage/stage-handlers.mjs` 的 `decisionLog` 传递。它们不新增 FR/AC；build-code 首个实现快照必须保留并单独核对，不能从“未提交”推断已完成。

## Quick Read

- **Goal**：make-decision direction/detail 审查升级为红蓝两次组请求（同一逻辑 review fact，pair_id/role 元数据+同 material 校验+incomplete 降级标注）；争议 findings 经 debate 裁决与问答工具化对话送达用户并写回闭环；debate v2 宿主中立可运行；deep-research R0-R5 契约落地；decision-log 需求框架+模块分组+链字段轻量告警；执行模型与测试硬规则成文。28 FR/28 AC 全部有验证路径（test 可执行门 / evidence 真实运行观察 / manual 核对，逐行见追溯表）。
- **Non-goals**：来源：spec 第 10 节非目标 + decision-log 拒绝方案/非目标 + X-001~X-004 延期；不新增 stage/gate/公共入口类/第五材料（spec 第 10 节非目标 1-6，D-602）；不改 build-plan/build-code/verify-code 审查与对话流程（X-002）；不做跨 provider 交叉质询（X-001）；不升 decision-entry.v2 schema（X-003）；review/debate 不作 pass 门（D-303）。
- **Before**：每审查面单次组请求、无争议概念、detail 后直接 approve、debate 零调用方且依赖 Claude teammate、调研无完成契约、materialIdForInput 与 broker 算法不一致（含 manifest 条目+未排序）、accepted_risk 无公共路由、aggregate stage==="make-decision" 硬编码。
- **After**：红蓝 pair 契约生效且 AC-011 审计同步；争议→debate→talk→写回闭环；debate 4 独立子代理+文件 mailbox 跨宿主；R0-R5 调研契约+content-addressed 落盘；decision-log 骨架/模块/链字段+不阻断告警；M/S/B/P 执行矩阵成文。
- **Main risk**：契约演进改动面大（合同+多处测试+AC-011），遗漏一处即纸面合规（RISK-03）；红蓝 2× 成本逼近客户端超时窗（RISK-01）。
- **Next step**：P1/T101 RED——material_id 对齐回归测试（`npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`，预期非零）。

## Current build-plan review rebaseline

- **Review source**：当前快照的异源 build-plan review 为 `quality/reviews/results/build-plan-simple-92cb2a45-3144-404c-b676-b15075f31177.json`，状态 `available`，19 条 finding；旧 review/confirmation 只作历史 provenance，不复用作当前确认。
- **Disposition rule**：F-0345015c845d、F-26b6ecdbbf10、F-2c3da105372c、F-4f9fca64d7cd、F-52c7e1d99ec9、F-64cb6b540715、F-6c37434b179a、F-76a960647e83、F-7d58960fe53c、F-9c2f3234bf7d、F-a1dde9119b36、F-a4b91a505a5f、F-b31b9fef0179、F-b9493406382d、F-bed91b27ecf7、F-d6f0e7a79001、F-d94682bd2338、F-ddaebbd86d3a：`fixed`，对应修复落在本文件与 tasks.md 的边界、依赖、任务 oracle 和证据路径中。
- **Upstream handoff**：F-6dd4a4347653 为 `needs_human`——spec.md 的 RISK-01/OPEN-01 仍同时出现“4/5 failed”和“3/5 completed”两种计数；build-plan 不改 spec，接受前必须由 make-decision/spec owner 统一唯一事实。
- **Acceptance boundary**：真实 broker 往返、真实 stage/host 交互、每 phase 的开发/测试绿/用户确认/异源审查均改为明确的 build-code 观察任务；没有当前外部证据时写 `unavailable`/`incomplete`，不把本地文本或旧 dogfood 记录宣称为 acceptance-green。

## Technical Context

### Global Constraints

- **Verified facts**：审查合同真实路径=`skills/wh-review/contracts/make-decision.md` 与 `skills/wh-review/contracts/build-spec.md`；`simple-review-runner.mjs` runSimpleReview L357/runGroup L390-397/materialIdForInput L191-205（不排序+含 manifest 条目）；broker 侧 3rd-review `lib/attachments.mjs` canonicalWorkflowHubMaterialId L18-26（排除 manifest.json+canonical-evidence.json+按 path Buffer.compare 排序）；`runtime/review/canonical-review-result.mjs` aggregateCanonicalProviderResults L100、clusterRecord L66-98、sameCluster L59-65（path+overlap≥0.7）；`runtime/review/stage-review-disposition.mjs` validateReportableFindingDispositions L67、accepted_risk 需 authorizedRiskFindingIds L94-96；`runtime/task/task-kernel-implementation.mjs` acceptReviewRisk L942；`runtime/stage/stage-content-contracts.mjs` validateInteractionAggregateContract L1865（L1870 硬编码 stage==="make-decision"；round_count L1895-1900 已动态）；`runtime/evidence/check-skill-closure.mjs` L9 MAKE_DECISION_ONLY_SKILLS（值为 talk-with-zhipeng 与 grill-with-docs 两项）（T-023：常量不动）；`tools/cli/run-checks.mjs` L80-122 硬编码 6 checker；decision-log 机器强制=16 h2（REQUIRED_MAIN_SECTIONS L25-28）+validateMain L2060-2072+validateDecisionLogContract L2123；main 同步后的 `review-materials.mjs` 为 stageReviewFocus L958、directionMode 分支 L963/L966/L969、build-spec 分支 L978-979、reviewInstructionsFor L996。
- **Language / runtime**：Node.js（ESM .mjs）；测试框架=vitest（全仓测试文件均 `import from "vitest"`；无 node --test 测试）。
- **Primary dependencies**：vitest（测试）、js-yaml（契约测试解析）；无新增依赖。
- **Storage / state**：review 原始结果/调研报告/交互 receipt 落盘任务追踪目录质量证据区（content-addressed）；debate 产物落盘任务共享目录轮次区；四材料为当前真相，旧记录只读保留。
- **Testing**：只跑受影响针对性测试（D-607 硬规则）；`gate_cmd` 精确到测试文件 `npx vitest run <精确路径>`；禁止 `npm test`/`test:safe` 全量，除用户/CI 明确要求。
- **Target environment**：本仓 worktree；debate v2 目标宿主=DSH（实测可用）/Codex/Multica（降级路径）；DSH 原生父子消息仅作加速。
- **Scale / scope**：8 phase、54 个既有文件修改+4 个新文件（MODIFY 条目数为 File Boundary 实测值）；不涉及任何前端/页面（non_ui）。
- **Unresolved facts**：grok/pi 两 provider 蓝队残余身份失败（OPEN-01，条件性义务，build-code 阶段按再现情况处理）；Codex/Multica 文件共享能力为文档级证据（PFACT-17 inferred，靠降级路径兜底）。

## Code Anchors

- **Verified anchors**：`skills/wh-review/scripts/simple-review-runner.mjs:runSimpleReview(L357)/runGroup(L390-397)/materialIdForInput(L191-205)`；`runtime/review/canonical-review-result.mjs:aggregateCanonicalProviderResults(L100)/clusterRecord(L66-98)/sameCluster(L59-65)`；main 同步后的 `skills/wh-review/scripts/review-materials.mjs:stageReviewFocus(L958)/reviewInstructionsFor(L996)/directionMode 分支(L963/L966/L969)/build-spec 分支(L978-979)`；`runtime/stage/stage-content-contracts.mjs:validateInteractionAggregateContract(L1865)/validateMain(L2060-2072)/validateDecisionLogContract(L2123)`；`runtime/review/stage-review-disposition.mjs:validateReportableFindingDispositions(L67)`；`runtime/task/task-kernel-implementation.mjs:acceptReviewRisk(L942)`；`tools/cli/stage-runtime.mjs`（confirm 路由）；`runtime/evidence/check-skill-closure.mjs:L9`；`tools/cli/run-checks.mjs:runAggregate(L80-122)/runChecker`（checker 脚本=tools/cli/<name>.mjs）。
- **Existing interfaces**：review result/attempt schema=`runtime/review/schemas/result.schema.json`、`runtime/review/schemas/attempt.schema.json`（无 pair_id/role/disputed）；acceptReviewRisk 签名 `{stage,reviewResultRef,findingId,cardRef,cardHash,selectedOption,replyRef,replyHash}`；run-checks checker 契约=`tools/cli/<checker-name>.mjs` 被 spawnSync 调用、exit code 聚合进 failures；skill-bundle.json 通用结构 `{schema_version:1,skill,files}`，当前 `wh-review` bundle 另含 `runtime_dependencies`，P2 必须保留该字段；repository-inventory.tsv 表头 `path/disposition/reason/sha256`。
- **Read now**：`skills/wh-review/contracts/make-decision.md`、`skills/wh-review/contracts/build-spec.md`、`runtime/review/schemas/result.schema.json`、`runtime/review/schemas/attempt.schema.json`、`skills/wh-review/scripts/simple-review-runner.mjs` L180-410。
- **Must read before task**：`runtime/review/canonical-review-result.mjs` L55-110（P2）；`runtime/review/stage-review-disposition.mjs` L60-100、`tools/cli/stage-runtime.mjs` confirm 段（P3）；`skills/debate/SKILL.md` L43/L55-61/L204-210（P4）；`workflows/make-decision/SKILL.md` Talk 节（P3）、调研条款节（"Research is an input to Talk, not a review." 段）（P5）、Procedure 节内 "Completion and fact writing" 节前（P6）；`tools/cli/run-checks.mjs` L108-122（P7）。
- **Context mode**：Lite — 锚点已由 build-spec 阶段逐行核实并列明行号，执行期按 phase 只读本 phase 锚点段，符合上下文守恒规则⑥（主会话旧步骤不回读）。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| 组请求与 provider 编排 | reuse | `simple-review-runner.mjs:runGroup` | 红蓝=两次组请求复用同一通道，无 per-provider prompt 通道（PFACT-01） |
| 材料脱敏 | reuse | `redactProviderHostPaths`（material-redaction 测试） | 已合入 main（5c4a3b3f/6090fbc5），本任务只保持回归 |
| 红蓝 pair 语义 | extend | `result.schema.json`/`attempt.schema.json`+`runSimpleReview` | 可选字段 pair_id/role/disputed，缺省不影响既有消费 |
| 争议标注 | extend | `canonical-review-result.mjs:clusterRecord` | provenance 层可选标注，reportable findings 语义不变 |
| material_id 算法 | extend | `materialIdForInput(L191-205)` 对齐 broker canonical | D-605 修复项；旧记录只读不回溯 |
| accepted_risk 公共通道 | extend | `task-kernel-implementation.mjs:acceptReviewRisk(L942)`+confirm 路由 | 既有 confirm 语义扩展，不新增公共 behavior 名（D-203/OPEN-02） |
| findings 处置对话承载 | reuse | `skills/spec-clarify` | T-023 定案：复用承载，不新增技能、grill 独占不变 |
| aggregate 动态轮数 | reuse | `stage-content-contracts.mjs:round_count(L1895-1900)` | round_count 动态校验已存在（L1895-1900），Talk4 条件轮无需代码改动（build-plan 实测核实） |
| debate v2 | extend（重写） | `skills/debate/SKILL.md`、`skills/debate/references/*` | 去 Claude teammate 依赖，宿主中立 |
| mailbox 消息格式 | new | 任务共享目录单消息单文件 JSON | consumer=debate 角色交锋与裁决书引用；owner=debate 技能；测试=debate skill-contract 测试；删除条件=debate 机制被替代 |
| deep-research 技能 | new | `skills/deep-research/`（不存在） | consumer=make-decision 调研条款；owner=make-decision 主会话；测试=技能文本断言+登记检查；删除条件=调研机制被替代 |
| decision-log 链字段告警 checker | new | `tools/cli/check-decision-log-chain.mjs` | consumer=run-checks 汇总（告警不阻断）；owner=decision-log 技能；测试=tests/contract/decision-log-chain-warnings.test.mjs；删除条件=链字段机制被替代或升 v2 |
| 需求框架 preset | extend | `skills/decision-log/SKILL.md`+模板 | 2 类 preset 起步，文本层，不动 16 h2 机器强制 |

## Solution Design

### Overview

全链路按"契约基础→红蓝双发→争议对话→（并行）debate v2/决策记录→调研机制→执行模型→治理登记"推进。P1 先修地基：result/attempt schema 增加可选 pair_id/role/disputed 字段，materialIdForInput 对齐 broker 规范算法（排除 manifest.json+canonical-evidence.json、按 path Buffer.compare 排序），使后续红蓝 pair 有元数据载体且严格冻结路径不再 MATERIAL_INCOMPLETE。

P2 在 P1 之上实现红蓝双发：runSimpleReview 对 make-decision direction/detail 两面各发 red+blue 两次组请求（同一 pair_id、role 元数据随请求/结果携带），运行时校验同 pair 同 material_id（不一致记 partial），任一侧 partial/failed 记 available-with-failures 并标注 blue_incomplete/red_incomplete；聚合=红蓝 findings 并集+provider×角色标注，争议判定（共识∪分歧三态矩阵）落入 clusterRecord provenance 层 disputed/consensus 可选标注。review-materials.mjs 在当前 main 基线的 directionMode 分支（L963/L966/L969）增加 role 指令分支；contracts/make-decision.md 重述"一个逻辑 review fact=红蓝两次组请求"，contracts/build-spec.md 写明单次+边界+指令强化+"AC 可判断性与验收盲区"专项；全部契约测试与 AC-011 审计行成对改。P2 的文本/断言门不提前宣称 AC-REV-004 或 AC-GOV-001 的真实运行观察已完成。

P3 闭环争议对话：acceptReviewRisk 经既有 confirm 语义扩展接公共路由（tools/cli/stage-runtime.mjs 路由+task-kernel 接线，不新增公共 behavior 名）；stage-review-disposition 支持 needs_human→user_decided 写回（答复绑定 finding：source=user_reply+evidence_ref=reply_ref）；workflows/make-decision 三件套落 Talk3 强绑定与 Talk4 触发条件式；build-spec findings 处置对话复用 spec-clarify 承载（check-skill-closure 仅契约文本调整、L9 常量不动）；talk-with-zhipeng/grill-with-docs/spec-clarify 三技能写入问答工具 IO 契约与降级文本。P4（并行）重写 debate 为宿主中立 v2；P5 新建 deep-research 并改调研条款；P6 写执行模型节；P7 升级 decision-log 技能/模板并新增不阻断告警 checker；P8 落 AGENTS.md 硬规则、CONTEXT.md 术语与治理登记。

### Module responsibilities

#### wh-review 红蓝调度与聚合

- **Responsibility**：对 direction/detail 执行红蓝两次组请求、pair 元数据与同 material 校验、incomplete 降级标注、findings 并集聚合与争议标注
- **Consumes**：审查合同（contracts/*.md）、材料包（脱敏后）、provider 组请求结果
- **Produces**：一个逻辑 review fact（含 pair_id/role/available-with-failures/incomplete 标注）、provenance 层 disputed/consensus 标注
- **Must not decide**：不作质量 verdict、不作推进门；不修改 broker 协议

#### 审查材料与指令

- **Responsibility**：按 stage×role 生成审查指令（红=盲审/正常、蓝=对抗性），build-spec 指令强化+验收专项
- **Consumes**：stageReviewFocus、合同文本、材料清单
- **Produces**：per-role 审查指令文本
- **Must not decide**：不决定 findings 处置、不改变 single_round 语义适用面（红蓝仅 make-decision 两面）

#### 争议对话与处置写回

- **Responsibility**：Talk3/Talk4 触发与材料绑定、build-spec findings 处置对话承载、答复写回 finding 处置、accepted_risk 公共通道
- **Consumes**：争议清单+debate 裁决书存疑项、宿主问答工具答复（reply_ref/reply_hash）、既有 confirm 语义
- **Produces**：user_decided 处置记录（source=user_reply）、accepted_risk 落盘证据+认证 receipt 绑定、interaction aggregate（动态轮数）
- **Must not decide**：不新增 stage/gate/公共 behavior 名；不推断用户意图（中止=user_deferred）

#### debate v2

- **Responsibility**：4 独立上下文子代理（甲/乙/丙/丁）立场书+文件 mailbox 交锋（2 轮封顶）+反偏见硬约束+裁决分级建议
- **Consumes**：争议 findings（实现级）、rubric、任务共享目录
- **Produces**：不可变落盘产物（立场书/交锋记录/裁决书含裁决者标注）、存疑清单
- **Must not decide**：方向级/影响验收级争议（必达用户）；主代理不得裁决（法官禁言）；不设"辩论通过"门

#### deep-research

- **Responsibility**：R0 缺口规划→R1 迭代检索→R2 并行深读→R3 三角测量→R4 落盘→R5 独立复核的调研契约
- **Consumes**：工具路由表（外部 anysearch+web_fetch+子代理深读；内部 glob+grep+read+git+ast-grep）、骨架缺口
- **Produces**：research-report.v1（content-addressed 落盘任务质量证据区）、复核结论
- **Must not decide**：不作推进 gate；纯 agent 无工具检索=不合格事实记录不阻断

#### decision-log 结构与告警

- **Responsibility**：需求框架 2 类 preset 骨架、决定区模块 h3 分组、文本层链字段（derived_from/module/requirement_ids/artifacts）、轻量格式/存在性告警
- **Consumes**：decision-log.md 文本、既有 validateMain/validateDecisionLogContract
- **Produces**：模板与技能文本、run-checks 告警输出（不 exit 1）
- **Must not decide**：不动 decision-entry.v1 schema（按 spec PFACT-12 的 20 个必填字段口径保留）、不破坏 16 h2 机器强制、不进 gate

#### 治理文档与登记

- **Responsibility**：AGENTS.md 测试硬规则与新控制面登记、CONTEXT.md 术语、catalog.yaml/repository-inventory.tsv/skill-bundle.json 同步
- **Consumes**：各 phase 实际改动清单
- **Produces**：治理文本与登记行
- **Must not decide**：不新增第二份非目标清单（spec 第 10 节唯一权威）

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：`result.schema.json`/`attempt.schema.json` 增可选 `pair_id`(string)/`role`(enum:red|blue)/`disputed`(boolean) 字段，缺省向后兼容；mailbox 消息=单消息单文件 JSON `{from,to,round,seq,body|body_ref,ts}`，按 `debate/round-N/mailbox/` 轮次目录组织；research-report.v1 字段=问题/决策轴/轮次/关键来源（分层+是否读原文）/证据/置信度/未决项/覆盖度/饱和说明/内外部比例/一手来源率/复核状态，命名=内容 sha256；问答问题卡入参 `question_id/axis/options(≤3)/recommended`、出参 `answers+reply_ref/reply_hash`；告警 checker 输出=告警行+exit 0（永不进 failures）。
- **Data flow / state**：材料→脱敏→material_id（规范算法）→红蓝两次组请求（pair）→结果（pair_id/role）→聚合（并集+角色标注+争议标注）→review fact→争议分流（方向级→Talk3/4 用户；实现级→debate→裁决书）→答复写回（user_decided/accepted_risk+receipt）→decision-log 登记；调研 R0-R5→research-report 落盘→decision-log 只引 path+hash。
- **API contract**：N/A — 无网络 API；公共行为面仅 confirm 语义扩展（七类公共行为不变，不新增第八类）。
- **UI / external code**：N/A — non_ui（spec 第 2 节 UI 适用性三方一致结论）。
- **Fail-loud behavior**：material 不一致→partial 不伪装完整红蓝；全部 unavailable→如实记录+根因修复后同编成重试一次；accepted_risk 缺认证 receipt→处置校验 fail-loud；aggregate 结构错误→validateInteractionAggregateContract 拒绝 publication；debate 2 轮未决→存疑清单呈用户不静默。

#### Blueprint 维度核对

- **行为结果**：适用——红蓝 pair 契约、争议写回、告警不阻断均以可观察行为定义验收（见 Test Strategy oracle）。
- **状态数据流**：适用——review fact 状态（available/available-with-failures+incomplete/unavailable）、finding 处置状态（needs_human→user_decided）、talk 生命周期（user_deferred）均为既有事实模型内取值，不新增状态机。
- **错误/取消/恢复**：适用——SCN-002/003/004/006 七条状态转移规则（D-604）落入合同文本；取消=user_deferred 进风险表；恢复=同编成重试一次。
- **权限/安全**：适用——accepted_risk 与不可逆操作必须显式授权（SCN-007）；材料脱敏防宿主路径泄漏（FR-REV-007）；身份降级保留原始错误码。
- **并发/原子性**：适用——并行上限=研究 4/debate 4/红蓝 2；同 pair 两次请求共享 material 语义身份（竞态 SCN-008）；mailbox 单消息单文件避免写冲突；reports immutable。
- **跨模块 seam**：适用——wh-review↔broker 仅 material_id 规范算法对齐（不改协议）；debate↔宿主仅文件 mailbox+可选原生消息加速；checker↔run-checks 仅 spawnSync+exit code 窄口。
- **可观测性来源**：适用——所有降级/不合格/告警事实落盘任务质量证据区；stage-reflection 增调研深度维度；复盘产物暴露链字段结构维度。
- **UI 维度**：N/A — 本任务 non_ui（原始需求/项目盘点/前端事实三方一致），不改任何页面或前端。

## UI Delivery Contract (仅 UI phase/task 使用)

- **UI applicability**：`N/A — non_ui`（decision-log UI applicability 已记录三方一致结论；本任务不改任何页面或前端）。
- **Component action**：N/A — non_ui。
- **Real consumer**：N/A — non_ui。
- **State owner**：N/A — non_ui。
- **Typed ViewModel**：N/A — non_ui。
- **CSS/token owner**：N/A — non_ui。
- **Fixture / viewport**：N/A — non_ui。
- **Browser / a11y / performance**：N/A — non_ui。
- **Screenshot handoff**：N/A — non_ui（无页面可截图）。
- **Coverage limits**：不覆盖任何浏览器、视觉、前端 API 范围。
- **N/A / unknown reason**：产品=workflowhub 编排工具本身，本任务全部改动为运行时脚本/技能文本/契约/测试/治理文档，无 UI 交付面。

### Design-gap handoff (不改变 Design.md 权威)

- **design_status**：`not_approved` — non_ui 任务无 Design.md 材料。
- **missing_items / reason**：`[]` — non_ui 无设计缺项。
- **fallback_visual_basis**：N/A — non_ui。
- **constraints / assumptions**：无 UI 交互与 label；实现假设=宿主问答工具能力按 FR-TALK-005 降级路径兜底。
- **rework_risk / human_confirmation**：无 UI 返工风险；人工确认走既有三处正常确认（F7），非 UI 不新增日常确认。
- **current_material_ref / design_revision**：`specs/workflowhub-requirement-convergence-depth-20260905/decision-log.md`、`specs/workflowhub-requirement-convergence-depth-20260905/spec.md`、`specs/workflowhub-requirement-convergence-depth-20260905/plan.md`；Design.md 版本=N/A（不存在）。
- **visible_labels**：N/A — non_ui。
- **preview_refs / fixture_refs / viewport_refs / screenshot_refs**：N/A — non_ui。
- **responsive / a11y**：N/A — non_ui。

## File Boundary

### NEW

- `skills/deep-research/SKILL.md`（P5；R0-R5 契约+停止条件+工具路由+降级语义）
- `skills/deep-research/skill-bundle.json`（P5；结构为 schema_version=1/skill/files 三字段）
- `tools/cli/check-decision-log-chain.mjs`（P7；链字段轻量格式/存在性告警 checker，告警只打印不 exit 1）
- `tests/contract/decision-log-chain-warnings.test.mjs`（P7；checker RED/GREEN 测试）

### MODIFY

- `runtime/review/schemas/result.schema.json`（P1；可选 pair_id/role/disputed）
- `runtime/review/schemas/attempt.schema.json`（P1；可选 pair_id/role）
- `skills/wh-review/scripts/simple-review-runner.mjs`（P1 materialIdForInput 对齐；P2 红蓝调度+pair 校验+incomplete 标注）
- `runtime/review/canonical-review-result.mjs`（P2；clusterRecord disputed/consensus 标注+聚合角色标注）
- `skills/wh-review/scripts/review-materials.mjs`（P2；role 指令分支+build-spec 指令强化与验收专项）
- `skills/wh-review/contracts/make-decision.md`（P2；红蓝契约重述）
- `skills/wh-review/contracts/build-spec.md`（P2；单次边界+指令强化+AC 专项）
- `skills/wh-review/skill-bundle.json`（P2；保留 M17 的 runtime_dependencies，并同步全部受影响文件 sha256）
- `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`（P1/P2）
- `skills/wh-review/scripts/__tests__/review-runner.test.mjs`（P2；聚合层断言）
- `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`（P2）
- `skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs`（P2）
- `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`（P2）
- `skills/wh-review/scripts/__tests__/material-redaction.test.mjs`（P1；回归口径核对）
- `skills/wh-review/scripts/__tests__/schema-validator.test.mjs`（P1；schema 可选字段断言）
- `tests/requirements-completeness-audit-acceptance.test.mjs`（P2；AC-011 审计行与契约语义成对改）
- `tests/contract/review-materials-contract.test.mjs`（P2；role 指令分支断言）
- `tools/cli/stage-runtime.mjs`（P3；confirm 路由接 acceptReviewRisk）
- `runtime/task/task-kernel-implementation.mjs`（P3；confirm 语义扩展接线，不新增公共 behavior 名）
- `runtime/review/stage-review-disposition.mjs`（P3；needs_human→user_decided 写回+答复绑定）
- `runtime/evidence/check-skill-closure.mjs`（P3；仅契约文本/说明调整，L9 MAKE_DECISION_ONLY_SKILLS 常量行不动）
- `workflows/make-decision/SKILL.md`（P3 Talk3/Talk4；P5 调研条款节（"Research is an input to Talk, not a review." 段）改写；P6 执行规划节插入 Procedure 节内、"Completion and fact writing" 节前）
- `workflows/make-decision/steps.json`（P3；Talk4 条件式轮次）
- `workflows/make-decision/skill-deps.yaml`（P3；Talk4 依赖声明）
- `workflows/build-spec/SKILL.md`（P3；findings 处置对话=复用 spec-clarify vs Talk/Grill 独占分工段）
- `skills/talk-with-zhipeng/SKILL.md`（P3；问答工具 IO 契约+降级文本）
- `skills/talk-with-zhipeng/skill-bundle.json`（P3）
- `skills/grill-with-docs/SKILL.md`（P3；问答工具 IO 契约+降级文本）
- `skills/grill-with-docs/skill-bundle.json`（P3）
- `skills/spec-clarify/SKILL.md`（P3；问答工具 IO 契约+findings 处置批次承载说明+降级文本）
- `skills/spec-clarify/skill-bundle.json`（P3）
- `tests/stage-interaction-contract.test.mjs`（P3；aggregate 动态轮数）
- `tests/contract/make-decision-interaction-publication.test.mjs`（P3）
- `tests/stage-risk-acceptance.test.mjs`（P3；accepted_risk confirm 通道+写回）
- `tests/integration/distribution-closure.test.mjs`（P3；closure 契约文本同步）
- `skills/debate/SKILL.md`（P4；去 Claude teammate 依赖 L43/L55-61/L204-210，宿主中立重写）
- `skills/debate/references/role-spawn-templates.md`（P4；4 独立子代理+mailbox）
- `skills/debate/references/arbitration-protocol.md`（P4；裁决分级+2 轮封顶+复核）
- `skills/debate/references/output-template.md`（P4；裁决者标注+幸存/被驳引用）
- `skills/debate/references/anti-bias-guardrails.md`（P4；匿名化/交换顺序/rubric/预算声明/保留分歧）
- `skills/debate/skill-bundle.json`（P4）
- `skills/debate/__tests__/skill-contract.test.mjs`（P4；宿主中立断言）
- `skills/spec-research/SKILL.md`（P5；与 deep-research 分工注明）
- `skills/spec-research/skill-bundle.json`（P5）
- `skills/stage-reflection/SKILL.md`（P5；调研深度维度插入六区块内，不新增 gate）
- `skills/stage-reflection/skill-bundle.json`（P5）
- `skills/decision-log/SKILL.md`（P7；需求框架 2 preset+模块分组+链字段）
- `skills/decision-log/skill-bundle.json`（P7）
- `skills/decision-log/templates/decision-log-template.md`（P7）
- `tools/cli/run-checks.mjs`（P7；L115 后追加 decision-log 告警 checker，不阻断语义=只打印不进 failures 不 exit 1）
- `skills/catalog.yaml`（P4 debate 条目同步；P5 deep-research 登记，格式参考 spec-research 条目；保留 M17 已有 metrics_enabled 与既有条目）
- `docs/architecture/repository-inventory.tsv`（P4/P5；新文件登记 path/disposition/reason/sha256）
- `AGENTS.md`（P8；在 M17 已有规则与当前治理边界之后追加测试硬规则和两条新控制面登记，不覆盖 M17 的 Stage Agent/vNext 约束）
- `CONTEXT.md`（P8；核心概念术语节 L23 登记争议 findings/红蓝审查/需求框架/决策链）

### CARRY-FORWARD INTO build-code

- `skills/wh-review/scripts/review-provider-client.mjs`（build-plan 期间已有 env timeout 覆盖；默认 600s 不变；无新增 FR/AC）
- `runtime/stage/stage-handlers.mjs`（build-plan 期间已有 `decisionLog` 传递修复；无新增 FR/AC）

### DO NOT TOUCH

- `runtime/schemas/decision-entry.v1.json` — 按 spec PFACT-12 的 20 个必填字段口径，schema 不动（D-104/X-003；链字段只在文本层）
- `runtime/evidence/check-skill-closure.mjs` 的 L9 `MAKE_DECISION_ONLY_SKILLS` 常量行 — T-023 定案仅契约文本调整
- `/Users/Hugh/Hugh/Project/3rd-review` — 外部仓，本任务不动（仅作为算法对齐参照系只读）
- `CONSTITUTION.md`、`constitution-checklist.md` — 宪法与清单只读绑定，不在本任务修订
- `skills/wh-review/contracts/provider-protocol.md` — broker 协议面不改（D-601 边界）
- `specs/workflowhub-requirement-convergence-depth-20260905/decision-log.md`、`spec.md` — 四材料中 decision-log/spec 在 build-plan 只读，仅产出本 plan.md
- 旧 task 记录、旧 receipt、旧 review、历史 snapshot — 只读保留（治理边界）

## Technical Decisions

### DEC-001 — 红蓝 pair 语义落点（schema 可选字段+runner 调度）

- **Problem**：红蓝两次组请求需被识别为同一逻辑 review fact，且结果需携带角色与争议标注，现有 result/attempt schema 无对应字段。
- **Options**：a) 新增 v2 schema（拒绝：无新机器消费者，违反 X-003 边界）；b) 既有 schema 加可选字段；c) 旁路文件记录（拒绝：双写真相）。
- **Selected**：extend — b) result/attempt schema 增可选 pair_id/role/disputed。
- **Reason**：可选字段缺省不影响既有消费方（spec 第 9 节命名预留），是最小充分改动。
- **Consequence / risk**：字段语义需合同文本同步定义，否则纸面合规（RISK-03，靠成对测试兜底）。
- **Fallback**：字段引发兼容问题时回退为仅 attempt 层携带，result 层由聚合推导。

### DEC-002 — material_id 算法对齐（D-605）

- **Problem**：materialIdForInput 含 manifest 条目且不排序，broker canonicalWorkflowHubMaterialId 排除 manifest+按 path 排序，严格冻结路径真实往返 MATERIAL_INCOMPLETE。
- **Options**：a) 修 WH 侧对齐 broker；b) 修 broker 对齐 WH（拒绝：外部仓不动）；c) 双算法兼容层（拒绝：永久 bridge 违反治理边界）。
- **Selected**：extend — 修 WH 侧 materialIdForInput（排除 manifest.json+canonical-evidence.json、按 path Buffer.compare 排序）。
- **Reason**：broker 侧为规范算法参照系，WH 单向对齐最简单；旧记录只读不回溯。
- **Consequence / risk**：material_id 变化使既有 receipt 绑定失效，需以新材料重建确认（SCN-008 已覆盖）。
- **Fallback**：对齐后真实往返仍失败则 STOP 回 build-spec（RISK-02 关闭条件）。

### DEC-003 — accepted_risk 公共通道=confirm 语义扩展（D-203/OPEN-02）

- **Problem**：kernel.acceptReviewRisk 无公共路由，用户接受风险无公共通道。
- **Options**：a) 新增公共 behavior 名（拒绝：公共行为只有七类，宪法红线）；b) 既有 confirm 语义扩展；c) 私有流程节点（拒绝：用户授权必须走公共通道）。
- **Selected**：extend — confirm 语义扩展，stage-runtime 路由+task-kernel 接线，治理登记 owner/consumer/删除条件。
- **Reason**：复用既有授权语义，不扩张公共行为面；OPEN-02 已定稿此口径。
- **Consequence / risk**：confirm 语义边界需在合同文本写明，防止被滥用为通用写回通道。
- **Fallback**：路由接线冲突时回退为 risk-pause 卡+人工确认材料重建，公共通道延期评估。

### DEC-004 — build-spec findings 处置对话承载=复用 spec-clarify（T-023）

- **Problem**：build-spec 需 findings 处置对话，但被 closure 常量/两组测试/aggregate 硬校验三处锁定不可 Talk 类交互。
- **Options**：a) talk-with-zhipeng 进 build-spec（拒绝：D-202 早期措辞被 T-023 收窄）；b) 新增技能（拒绝：非目标）；c) 复用 spec-clarify 承载。
- **Selected**：reuse — spec-clarify 承载"基于争议发现的规格澄清批次"，closure 仅契约文本调整、L9 常量不动、grill 独占不变。
- **Reason**：生命周期沿用既有 stage outcome 校验与交互 receipt，零新控制面。
- **Consequence / risk**：spec-clarify 文本需明确"不是 Talk/Grill/Clarify 原语义扩张"，防止语义漂移。
- **Fallback**：复用产生语义混淆时回 build-spec 重新定稿承载方式（不得私自扩张）。

### DEC-005 — debate mailbox 文件格式（new）

- **Problem**：跨宿主（DSH/Codex/Multica）子代理通信无通用协议，Claude teammate 依赖已失效。
- **Options**：a) 宿主原生消息协议（拒绝：Codex 仅 collab 无法自定义）；b) 文件 mailbox；c) 第三方消息队列（拒绝：引入基础设施）。
- **Selected**：new — 任务共享目录单消息单文件 JSON（from/to/round/seq/body|body_ref/ts），DSH 原生消息仅加速，降级=父代理串行转发。
- **Reason**：共享文件系统是跨宿主最小公分母（PFACT-06），OPEN-02 已定稿格式。
- **Consequence / risk**：非 DSH 宿主角色独立性打折（RISK-05），降级事实必须记录。
- **Fallback**：无共享文件系统时父代理串行转发并记录降级。
- **F10 real threat**：真实威胁=debate 在 Codex/Multica 完全不可用、角色交锋无证据留痕（PFACT-05 零调用方现状）。
- **F10 existing cover**：既有 cover=无（旧技能依赖不可用宿主特性）；本格式由 debate skill-contract 测试断言字段与轮次目录结构。
- **F10 bypassable**：可被绕过（子代理不写文件直接口述）——缓解=裁决书必须引用 mailbox 交锋记录为证据，无引用即降级事实记录。
- **F10 maintenance cost**：维护成本=单 JSON 格式+轮次目录约定，无运行时基建；成本低于收益。
- **F10 disposition**：`keep`

### DEC-006 — deep-research 新技能（new）

- **Problem**：调研无完成契约、无读原文要求、纯 agent 无工具检索效果差（PFACT-08），spec-research 仅 16 行被动应答。
- **Options**：a) 扩写 spec-research（拒绝：其定位=后续阶段点状疑问通道，混淆分工）；b) 新建 deep-research；c) 仅改 make-decision 调研条款文本（拒绝：无契约载体、无法登记）。
- **Selected**：new — skills/deep-research（R0-R5+停止条件+工具路由+落盘+复核）。
- **Reason**：新能力须登记职责/consumer/owner/删除条件（治理边界），独立技能是最干净的登记单元。
- **Consequence / risk**：新增 catalog/inventory/bundle 三处登记义务；技能文本腐烂风险靠 stage-reflection 调研深度维度暴露。
- **Fallback**：技能不被真实消费时按登记删除条件移除，调研条款回退为引用 decision-log 口径。
- **F10 real threat**：真实威胁=调研浅薄导致决策依据薄、验收盲区返工（PFACT-11 用户确认的返工主因）。
- **F10 existing cover**：既有 cover=make-decision 调研条款（无完成标准）；新技能由技能文本断言+登记检查+R4 落盘产物覆盖。
- **F10 bypassable**：可被跳过——缓解=跳过必须论证成文、纯 agent 无工具检索记不合格事实（不阻断但留痕）。
- **F10 maintenance cost**：维护成本=单个 SKILL.md+bundle，无代码；R0-R5 已在本任务 dogfood 实证（PFACT-16）。
- **F10 disposition**：`keep`

### DEC-007 — decision-log 链字段告警 checker（new）

- **Problem**：文本层链字段无机器校验会腐烂无感（RISK-04），但升 v2 schema 被 X-003 排除。
- **Options**：a) v2 机器强制（拒绝：无真实机器消费者）；b) run-checks 追加阻断 checker（拒绝：违反"告警不阻断"定稿）；c) 不阻断告警 checker。
- **Selected**：new — tools/cli/check-decision-log-chain.mjs，run-checks L115 后注册，只打印告警不进 failures、exit 0。
- **Reason**：轻量告警+复盘暴露是"不升 schema"约束下的最大可观测性；OPEN-02 已定稿此口径。
- **Consequence / risk**：告警可能被忽略（RISK-04）——靠 stage-reflection 结构维度二次暴露；告警失效触发 X-003 评估。
- **Fallback**：checker 误报过多时收窄规则到"存在性格式"两类，不得升级为阻断。
- **F10 real threat**：真实威胁=链字段腐烂导致决策链不可追溯且无人察觉。
- **F10 existing cover**：既有 cover=无；新 checker 由 tests/contract/decision-log-chain-warnings.test.mjs 故意缺失/非法用例覆盖。
- **F10 bypassable**：可被绕过（告警不阻断）——这是定稿语义而非缺陷；绕过后果由复盘维度暴露。
- **F10 maintenance cost**：维护成本=单 checker 脚本+单测试文件，接入既有 run-checks 汇总零新入口。
- **F10 disposition**：`keep`

### DEC-008 — 需求框架 preset 与链字段（extend，文本层）

- **Problem**：decision-log 扁平、决策无链，阅读者无法判断需求考虑是否清楚。
- **Options**：a) 改机器强制 schema（拒绝：X-003）；b) 文本层 preset 骨架+模块 h3+链字段；c) 外置索引文件（拒绝：第二份真相）。
- **Selected**：extend — skills/decision-log SKILL.md+模板，功能类/研究类 2 preset 起步，不破坏 16 h2/覆盖矩阵/五维/R-NNN 索引。
- **Reason**：本任务 decision-log 已试运行该结构（PFACT-16 样本），文本层改动可证伪（既有结构校验全绿为 oracle）。
- **Consequence / risk**：文本层靠自律+告警，长期腐烂风险见 DEC-007。
- **Fallback**：preset 与任务类型不匹配时用精简骨架，验证后再增补（spec 第 9 节容器预留）。

## Test Strategy

设计 RED/GREEN，不在 build-plan 执行命令。两者使用同一 `gate_cmd` 和
oracle identity；`gate_cmd` 只是测试命令，不是工作许可证。

**硬规则（D-607/FR-GOV-004）**：所有 gate_cmd 精确到测试文件（`npx vitest run <精确路径>`）；禁止 `npm test`/`npm run test:safe` 全量回归，除用户或 CI 守卫明确要求。每个行为改动一对 RED/GREEN 同 gate_cmd 同 oracle；文本类改动 role=N/A+可执行断言命令（契约测试或 grep 断言）。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| FR-REV-006/AC-REV-006 | T101 | RED | `npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` / `1` | ORACLE-MATID-01：fixture 含 manifest 条目+乱序 path，断言排除+Buffer.compare 排序且与 broker 算法输出一致；当前算法不一致失败；`quality/tests/p1-matid-red.log` |
| FR-REV-006/AC-REV-006 | T102 | GREEN | `npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` / `0` | ORACLE-MATID-01：同一断言通过+真实 broker 往返 fixture 不 MATERIAL_INCOMPLETE；`quality/tests/p1-matid-green.log` |
| FR-REV-003（字段载体） | T103 | RED | `npx vitest run skills/wh-review/scripts/__tests__/schema-validator.test.mjs` / `1` | ORACLE-SCHEMA-PAIR-01：断言 result/attempt 接受 pair_id/role/disputed 可选字段且缺省兼容；当前无字段失败；`quality/tests/p1-schema-red.log` |
| FR-REV-003（字段载体） | T104 | GREEN | `npx vitest run skills/wh-review/scripts/__tests__/schema-validator.test.mjs` / `0` | ORACLE-SCHEMA-PAIR-01：同一断言通过+负例（非法 role 值拒绝）；`quality/tests/p1-schema-green.log` |
| FR-REV-007/AC-REV-007 | T105 | GREEN（回归） | `npx vitest run skills/wh-review/scripts/__tests__/material-redaction.test.mjs` / `0` | ORACLE-REDACT-01：材料无宿主绝对路径+identity_degraded 保留原始错误码（已入 main 项回归确认）；`quality/tests/p1-redaction-green.log` |
| FR-REV-001/002/AC-REV-001/002 | T201 | RED | `npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` / `1` | ORACLE-REDBLUE-01：direction/detail 各 red+blue 两次组请求、同一 pair_id、role 元数据随结果携带、无空 findings 复审；当前单次失败；`quality/tests/p2-redblue-red.log` |
| FR-REV-001/002/AC-REV-001/002 | T202 | GREEN | `npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` / `0` | ORACLE-REDBLUE-01：同一断言通过；`quality/tests/p2-redblue-green.log` |
| FR-REV-003/AC-REV-003 | T203 | RED | `npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` / `1` | ORACLE-PAIRMAT-01：故意 material 不一致用例记 partial、不伪装完整红蓝；`quality/tests/p2-pairmat-red.log` |
| FR-REV-003/AC-REV-003 | T204 | GREEN | `npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` / `0` | ORACLE-PAIRMAT-01：同一断言通过+一致时不标 partial；`quality/tests/p2-pairmat-green.log` |
| FR-REV-003/AC-REV-003 | T205 | RED | `npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` / `1` | ORACLE-INCOMPLETE-01：蓝队失败标 blue_incomplete、红队失败标 red_incomplete、available-with-failures、完成集范围显式标注；`quality/tests/p2-incomplete-red.log` |
| FR-REV-003/AC-REV-003 | T206 | GREEN | `npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` / `0` | ORACLE-INCOMPLETE-01：同一断言通过+单成员失败其余照用（规则⑦）；`quality/tests/p2-incomplete-green.log` |
| FR-REV-005/AC-REV-005 | T207 | RED | `npx vitest run skills/wh-review/scripts/__tests__/review-runner.test.mjs` / `1` | ORACLE-DISPUTED-01：共识（≥2 provider）与分歧（severity/evidence_kind 冲突、一提出一沉默）均识别，disputed/consensus 落 provenance 层，reportable findings 语义不变；`quality/tests/p2-disputed-red.log` |
| FR-REV-005/AC-REV-005 | T208 | GREEN | `npx vitest run skills/wh-review/scripts/__tests__/review-runner.test.mjs` / `0` | ORACLE-DISPUTED-01：同一断言通过+聚合=并集+provider×角色标注；`quality/tests/p2-disputed-green.log` |
| FR-REV-004/AC-REV-004 | T209 | RED | `npx vitest run tests/contract/review-materials-contract.test.mjs` / `1` | ORACLE-BSINSTR-01：build-spec 指令含横向第三路/隐藏前提/防虚假共识/纵向否定+"AC 可判断性与验收盲区"专项；role 分支生成红/蓝指令变体；`quality/tests/p2-bsinstr-red.log` |
| FR-REV-004/AC-REV-004 | T210 | GREEN | `npx vitest run tests/contract/review-materials-contract.test.mjs` / `0` | ORACLE-BSINSTR-01：同一断言通过；`quality/tests/p2-bsinstr-green.log` |
| FR-GOV-001/AC-GOV-001 | T211 | N/A（文本） | `npx vitest run skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs` / `0` | ORACLE-CONTRACT-01：合同文本↔断言成对（make-decision.md 重述红蓝语义、build-spec.md 写明单次+边界+专项）；语法与测试同 PR 更新；`quality/tests/p2-contracts-green.log` |
| FR-GOV-001/AC-GOV-001 | T212 | N/A（文本） | `npx vitest run tests/requirements-completeness-audit-acceptance.test.mjs` / `0` | ORACLE-AC011-01：AC-011 审计 marker=single_round 语义行与合同红蓝重述成对改（L26 附近），审计反映新契约语义；`quality/tests/p2-ac011-green.log` |
| FR-TALK-004/AC-TALK-004 | T301 | RED | `npx vitest run tests/stage-risk-acceptance.test.mjs` / `1` | ORACLE-RISKCONFIRM-01：accepted_risk 经 confirm 语义扩展公共通道完成、证据落盘、绑定认证 receipt；当前无路由失败；`quality/tests/p3-risk-red.log` |
| FR-TALK-004/AC-TALK-004 | T302 | GREEN | `npx vitest run tests/stage-risk-acceptance.test.mjs` / `0` | ORACLE-RISKCONFIRM-01：同一断言通过+不新增公共 behavior 名（负例：公共行为清单仍七类）；`quality/tests/p3-risk-green.log` |
| FR-TALK-004/AC-TALK-004 | T303 | RED | `npx vitest run tests/stage-risk-acceptance.test.mjs` / `1` | ORACLE-WRITEBACK-01：needs_human 答复后写回 user_decided、处置记录含 source=user_reply+evidence_ref=reply_ref；`quality/tests/p3-writeback-red.log` |
| FR-TALK-004/AC-TALK-004 | T304 | GREEN | `npx vitest run tests/stage-risk-acceptance.test.mjs` / `0` | ORACLE-WRITEBACK-01：同一断言通过+accepted_risk 缺 receipt fail-loud；`quality/tests/p3-writeback-green.log` |
| FR-TALK-001/002/AC-TALK-001/002 | T305 | N/A（文本+结构） | `npx vitest run tests/stage-interaction-contract.test.mjs tests/contract/make-decision-interaction-publication.test.mjs` / `0` | ORACLE-AGGROUND-01：aggregate 按实际轮数动态校验（无争议=3、有争议≥4，与落盘 round_count=5 事实一致）；Talk3 材料绑定争议清单成文、Talk4 触发条件式成文；`quality/tests/p3-aggregate-green.log` |
| FR-TALK-003/AC-TALK-003 | T306/T307 | N/A（文本） | `npx vitest run tests/integration/distribution-closure.test.mjs` / `0` | ORACLE-CLOSURE-01：closure 契约文本反映"findings 处置对话=复用 spec-clarify"、L9 常量未变（grep 断言 `MAKE_DECISION_ONLY_SKILLS` 内容）、grill 独占不变；`quality/tests/p3-closure-green.log` |
| FR-TALK-005/AC-TALK-005 | T308 | N/A（文本） | `grep -q 'question_id' skills/talk-with-zhipeng/SKILL.md && grep -q 'reply_ref' skills/grill-with-docs/SKILL.md && grep -q 'reply_hash' skills/spec-clarify/SKILL.md && echo PASS` / `0` | ORACLE-TALKIO-01：三技能文本含 IO 契约字段（question_id/axis/options≤3/recommended；answers+reply_ref/reply_hash）与降级文本卡记录义务；`quality/tests/p3-talkio-green.log` |
| FR-DEB-001~003/AC-DEB-001~003 | T401 | RED | `npx vitest run skills/debate/__tests__/skill-contract.test.mjs` / `1` | ORACLE-DEBATE-01：断言 SKILL.md 无 Claude teammate 依赖措辞、含 4 独立子代理+mailbox 格式+法官禁言+2 轮封顶+降级路径；当前含 teammate 依赖失败；`quality/tests/p4-debate-red.log` |
| FR-DEB-001~003/AC-DEB-001~003 | T402 | GREEN | `npx vitest run skills/debate/__tests__/skill-contract.test.mjs` / `0` | ORACLE-DEBATE-01：同一断言通过+references 四件套含匿名化/交换顺序/rubric/预算声明/保留分歧/裁决分级；`quality/tests/p4-debate-green.log` |
| FR-RES-001~003/AC-RES-001~003 | T501/T502/T506 | N/A（文本+登记） | `node -e "const b=require('./skills/deep-research/skill-bundle.json');if(b.schema_version!==1)process.exit(1)" && grep -q 'R0 缺口' skills/deep-research/SKILL.md && grep -q 'R5 独立复核' skills/deep-research/SKILL.md && grep -q 'research-report.v1' skills/deep-research/SKILL.md && echo PASS` / `0`；T506 再执行 catalog/inventory/bundle 字节哈希一致性检查 | ORACLE-DEEPRES-01：SKILL.md 含 R0-R5/停止条件/工具路由表/跳过论证/降级记录；bundle 合法；catalog/inventory 登记与 bundle 字节一致；`quality/evidence/build-plan-or-T501.log`、`quality/evidence/build-plan-or-T502.log`、`quality/tests/p5-register-green.log` |
| FR-RES-004/AC-RES-004 | T505 | N/A（文本） | `grep -q '一手来源率' skills/stage-reflection/SKILL.md && grep -q 'not_applicable' skills/stage-reflection/SKILL.md && echo PASS` / `0` | ORACLE-REFLECT-01：调研深度四维（一手来源率/收敛率/未决项数/工具使用记录）+缺省标注+不新增 gate 声明；`quality/tests/p5-reflect-green.log` |
| FR-GOV-005/AC-GOV-005 | T601 | N/A（文本） | `grep -q 'M/S/B/P' workflows/make-decision/SKILL.md && grep -q '研究 4' workflows/make-decision/SKILL.md && echo PASS` / `0` | ORACLE-EXECMODEL-01：执行器矩阵+上下文守恒 6 规则+并行上限（研究4/debate4/红蓝2）+≤500 字回传成文，插入 Procedure 节内；`quality/tests/p6-execmodel-green.log` |
| FR-DLOG-003/AC-DLOG-003 | T703 | RED | `npx vitest run tests/contract/decision-log-chain-warnings.test.mjs` / `1` | ORACLE-DLOGWARN-01：故意缺失/非法链字段/引用不存在用例产生告警且 exit 0、不升 schema、不进 gate；checker 不存在失败；`quality/tests/p7-dlogwarn-red.log` |
| FR-DLOG-003/AC-DLOG-003 | T704 | GREEN | `npx vitest run tests/contract/decision-log-chain-warnings.test.mjs` / `0` | ORACLE-DLOGWARN-01：同一断言通过+run-checks 汇总中该 checker 不进 failures（注入断言）；`quality/tests/p7-dlogwarn-green.log` |
| FR-DLOG-001/002/AC-DLOG-001/002 | T701/T702 | N/A（文本） | `npx vitest run tests/stage-decision-contract.test.mjs` / `0` | ORACLE-DLOGSTRUCT-01：既有 decision-log 机器强制（16 h2/覆盖恰好一次/五维/R-NNN 索引）在模板改动后仍全绿（结构不被破坏为 oracle）；`quality/evidence/build-plan-or-T701.log`、`quality/evidence/build-plan-or-T702.log`（逐卡独立证据） |
| FR-GOV-004/AC-GOV-004 | T801 | N/A（文本） | `grep -q '只跑受影响针对性测试' AGENTS.md && grep -q '禁止全量' AGENTS.md && echo PASS` / `0` | ORACLE-AGENTRULE-01：硬规则成文含例外=用户/CI 明确要求+引 docs/standard-workflow.md L310；`quality/tests/p8-agents-green.log` |
| FR-GOV-006/AC-GOV-006 | T802/T803 | N/A（文本） | `grep -q '红蓝审查' CONTEXT.md && grep -q '结构化问答工具卡' AGENTS.md && grep -q 'confirm 语义扩展' AGENTS.md && echo PASS` / `0` | ORACLE-GOVREG-01：CONTEXT.md 四术语登记；AGENTS.md 治理边界节两条新控制面登记（owner/consumer/删除条件齐全）；`quality/evidence/build-plan-or-T802.log`、`quality/evidence/build-plan-or-T803.log`（逐卡独立证据） |

## Rollback and Recovery

- 删除证明：本任务不涉及删除（no deletion）——全部改动为新增文件或修改既有文件，无删除项；若 build-code 出现删除需求须 STOP 回本 plan。

- **Global recovery rule**：全部改动为文本/脚本层；回滚=`git revert` 单 phase 提交（每 phase 独立提交，revert 粒度=phase）；只回滚当前实现，保留四份材料（decision-log/spec/plan/tasks）与既有质量事实（旧 review/receipt/测试结果只读不回溯）。
- **Irreversible boundaries**：commit/push/merge/archive/cleanup 需用户显式 authorize（SCN-007/F7）；accepted_risk 落盘经 confirm 通道后不可自动撤销，撤销需新的用户决定写回；material_id 算法变更不回溯旧记录（新值向前生效）。
- **Recovery owner**：phase 内测试失败→该 phase 实施子代理修复或 revert 该 phase；契约/审计不一致（纸面合规）→回 build-spec 对应合同文本核对；material_id 回归失败→STOP 回 build-spec（RISK-02 关闭条件）。

### Engineering Risk Handoff

- **PLAN-RISK-001**：红蓝两次组请求 2× 成本逼近客户端超时窗（承 RISK-01）
  - **Affected IDs**：FR-REV-001、FR-REV-002；AC-REV-001、AC-REV-002；T201~T206
  - **Trigger**：审查材料大或 provider 响应慢；蓝队失败概率实证高于红队（4/5）
  - **Consequence**：review fact 记 unavailable/partial+blue_incomplete，审查深度打折
  - **Mitigation or STOP**：如实记录可重试（同编成 1 次）；蓝队编成与超时预算 build-code 按实证调整；不延长超时窗；超时事件均有 unavailable/partial 记录否则 STOP
  - **Handling Stage**：build-code
  - **Verification**：真实运行中超时事件记录齐全且可重试（ORACLE-INCOMPLETE-01 负例覆盖）
- **PLAN-RISK-002**：契约演进纸面合规（承 RISK-03）
  - **Affected IDs**：FR-GOV-001；AC-GOV-001；T211、T212、T307
  - **Trigger**：合同文本与测试断言/AC-011 审计更新不同步
  - **Consequence**：文义合规但行为未变，验收失真
  - **Mitigation or STOP**：每 phase 验收核对"合同↔断言↔审计"三者一致清单；任一脱节该 phase 不得判 Done
  - **Handling Stage**：build-code
  - **Verification**：AC-GOV-001 核对记录（ORACLE-CONTRACT-01/ORACLE-AC011-01/ORACLE-CLOSURE-01）
- **PLAN-RISK-003**：共享文件串行冲突——workflows/make-decision/SKILL.md 被 P3/P5/P6 三个 phase 修改
  - **Affected IDs**：T305、T504、T601；FR-TALK-001/002、FR-RES-001、FR-GOV-005
  - **Trigger**：P5/P6 未等 P3 落定即并行改同一文件
  - **Consequence**：合并冲突或条款互相覆盖，契约文本失真
  - **Mitigation or STOP**：严格按依赖序 P3→P5→P6 串行改该文件；每 phase 改后跑该文件相关断言（ORACLE-AGGROUND-01/ORACLE-EXECMODEL-01）
  - **Handling Stage**：build-code
  - **Verification**：三 phase 各自提交 diff 不重叠段区间（P3=Talk 节、P5=调研条款节、P6=执行规划节插入区，均按文本锚点界定）
- **PLAN-RISK-004**：链字段文本层腐烂（承 RISK-04）
  - **Affected IDs**：FR-DLOG-003；AC-DLOG-003；T703、T704
  - **Trigger**：告警被忽略长期不维护
  - **Consequence**：决策链结构退化不可追溯
  - **Mitigation or STOP**：告警+stage-reflection 结构维度双重暴露；告警失效触发 X-003 评估（回 make-decision）
  - **Handling Stage**：build-code
  - **Verification**：ORACLE-DLOGWARN-01 告警输出存在+复盘产物结构维度可见
- **PLAN-RISK-005**：debate 非 DSH 宿主降级角色独立性打折（承 RISK-05）
  - **Affected IDs**：FR-DEB-001；AC-DEB-001；T401
  - **Trigger**：Codex/Multica 无共享文件系统或消息能力（PFACT-17 inferred）
  - **Consequence**：防偏强度下降，裁决可信度打折
  - **Mitigation or STOP**：降级路径（父代理串行转发）如实记录；DSH 优先；降级产物结构不完整则该次 debate 记 incomplete
  - **Handling Stage**：build-code
  - **Verification**：降级运行有记录且产物结构完整（ORACLE-DEBATE-01 降级断言）

## Implementation Order

producer-before-consumer 顺序：**P1→P2→P3** 为主串行链（P1 schema 字段与 material_id 是 P2 pair 校验的 producer；P2 红蓝 findings 与争议标注是 P3 对话材料的 producer）。**P4（debate v2）与 P7（决策记录）输入独立**；P4 的技能文件可与 P2/P3 并行，但 T403 先收敛共享登记文件，P5 才能启动。**P5 依赖 P3 和 T403**（共享 workflows/make-decision/SKILL.md，且调研条款引用争议对话产物口径），**P6 依赖 P5**（同一文件第三次修改+执行规划引用调研机制），**P8 治理登记部分依赖 P3**（治理登记引用 P3 落地的两条新控制面）；**T804 全局终验依赖全部前序 phase（P1-P7）完成**（含并行分支 P4 末卡 T403 与 P7 末卡 T704 在 T804 前汇合）。

串行原因：P1→P2 是 schema/算法 producer→consumer；P2→P3 是争议清单 producer→对话 consumer；P4→P5 是 catalog/inventory 共享登记的单 owner 收敛；P3→P5→P6 是同一文件防冲突串行（PLAN-RISK-003）。

## Dependencies and Parallelism

- **Dependencies**：P1(schema/material_id)→P2(红蓝调度)；P2(争议标注/合同)→P3(对话闭环)；P4/T403→P5(共享 catalog/inventory 登记先收敛)；P3→P5(共享 make-decision/SKILL.md)；P5→P6(同文件+调研机制引用)；P3→P8(治理登记引用 P3 落地的两条新控制面，即 P2→P3→P8)；P2 合同文本→P7 无依赖（decision-log 技能独立）；T804 全局终验依赖 P1-P7 全部 phase 完成。
- **Parallel work**：P4 的技能文件与 P7 可继续和 P2/P3 并行；P4 的 T403 对 \`skills/catalog.yaml\`、\`docs/architecture/repository-inventory.tsv\` 负唯一合并 owner，P5 不再与 P4 并行写这两处文件；P7 不触碰这两文件。
- **External dependencies**：3rd-review broker（只读参照，算法口径已核实 L18-26）；宿主问答工具（DSH ask_user_question 已实证，无工具宿主按降级文本卡）；anysearch/web_fetch（外部调研工具，不可用按 FR-RES-003 显式降级记录）。absence semantics：外部工具缺失→降级事实记录，不阻断推进。

## Requirement and Verification Traceability

| Source / decision | FR | AC | Phase / Task | Depends on | Exact files | Command / oracle |
| --- | --- | --- | --- | --- | --- | --- |
| R-001/R-006/R-017；D-101 | FR-REV-001 | AC-REV-001 | P2 / T201、T202 | T105 | `skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/contracts/make-decision.md` | `npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` / ORACLE-REDBLUE-01 |
| R-002/R-017；D-101 | FR-REV-002 | AC-REV-002 | P2 / T201、T202 | T105 | `skills/wh-review/scripts/simple-review-runner.mjs` | 同上 / ORACLE-REDBLUE-01 |
| R-017；D-101 | FR-REV-003 | AC-REV-003 | P1 / T103、T104；P2 / T203~T206 | T101、T102 | `runtime/review/schemas/result.schema.json`、`runtime/review/schemas/attempt.schema.json`、`skills/wh-review/scripts/simple-review-runner.mjs` | `npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` / ORACLE-SCHEMA-PAIR-01、ORACLE-PAIRMAT-01、ORACLE-INCOMPLETE-01 |
| R-005/R-011；D-102 | FR-REV-004 | AC-REV-004 | P2 / T209、T210、T211、T805 | none（P2 内） | `skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/contracts/build-spec.md` | `npx vitest run tests/contract/review-materials-contract.test.mjs` + T805 real host observation / ORACLE-BSINSTR-01 |
| R-003/R-004/R-005；D-103 | FR-REV-005 | AC-REV-005 | P2 / T207、T208 | T104 | `runtime/review/canonical-review-result.mjs` | `npx vitest run skills/wh-review/scripts/__tests__/review-runner.test.mjs` / ORACLE-DISPUTED-01 |
| R-001/R-002/R-005；D-605 | FR-REV-006 | AC-REV-006 | P1 / T101、T102；T805 | none | `skills/wh-review/scripts/simple-review-runner.mjs`（materialIdForInput L191-205） | `npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` + T805 live broker observation / ORACLE-MATID-01 |
| R-001/R-002/R-017；D-606 | FR-REV-007 | AC-REV-007 | P1 / T105 | none（已入 main，回归确认） | `skills/wh-review/scripts/simple-review-runner.mjs` | `npx vitest run skills/wh-review/scripts/__tests__/material-redaction.test.mjs` / ORACLE-REDACT-01 |
| R-003/R-008；D-201 | FR-TALK-001 | AC-TALK-001 | P3 / T305、T805 | T208 | `workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`workflows/make-decision/skill-deps.yaml` | `npx vitest run tests/contract/make-decision-interaction-publication.test.mjs` + T805 real host observation / ORACLE-AGGROUND-01 |
| R-004；D-201 | FR-TALK-002 | AC-TALK-002 | P3 / T305、T805 | T208 | `workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json` | `npx vitest run tests/stage-interaction-contract.test.mjs` + T805 real host observation / ORACLE-AGGROUND-01 |
| R-005/R-009/R-015；D-202（T-023） | FR-TALK-003 | AC-TALK-003 | P3 / T306、T307、T805 | T208 | `workflows/build-spec/SKILL.md`、`runtime/evidence/check-skill-closure.mjs`（文本）、`skills/spec-clarify/SKILL.md` | `npx vitest run tests/integration/distribution-closure.test.mjs` + T805 real host observation / ORACLE-CLOSURE-01 |
| R-003/R-004/R-005/R-015；D-203 | FR-TALK-004 | AC-TALK-004 | P3 / T301~T304 | none（P3 内） | `tools/cli/stage-runtime.mjs`、`runtime/task/task-kernel-implementation.mjs`、`runtime/review/stage-review-disposition.mjs` | `npx vitest run tests/stage-risk-acceptance.test.mjs` / ORACLE-RISKCONFIRM-01、ORACLE-WRITEBACK-01 |
| R-015；D-204 | FR-TALK-005 | AC-TALK-005 | P3 / T308、T805 | none（P3 内） | `skills/talk-with-zhipeng/SKILL.md`、`skills/grill-with-docs/SKILL.md`、`skills/spec-clarify/SKILL.md` | grep 断言命令 + T805 real host observation / ORACLE-TALKIO-01 |
| R-006/R-007/R-008；D-301 | FR-DEB-001 | AC-DEB-001 | P4 / T401、T403、T805 | none（P4 技能文件可并行；T403 登记先收敛） | `skills/debate/SKILL.md`、`skills/debate/references/role-spawn-templates.md` | `npx vitest run skills/debate/__tests__/skill-contract.test.mjs` + T805 host/downgrade observation / ORACLE-DEBATE-01 |
| R-006；D-302 | FR-DEB-002 | AC-DEB-002 | P4 / T402、T805 | T401 | `skills/debate/references/anti-bias-guardrails.md` | 同上 + T805 host observation / ORACLE-DEBATE-01 |
| R-003/R-004/R-005/R-006；D-303 | FR-DEB-003 | AC-DEB-003 | P4 / T402、T805 | T401 | `skills/debate/references/arbitration-protocol.md`、`skills/debate/references/output-template.md` | 同上 + T805 host observation / ORACLE-DEBATE-01 |
| R-009/R-013/R-016/R-019；D-401 | FR-RES-001 | AC-RES-001 | P5 / T501、T503、T504、T805 | T305、T403 | `skills/deep-research/SKILL.md`、`skills/spec-research/SKILL.md`、`workflows/make-decision/SKILL.md` | node+grep 断言命令 + T805 real research observation / ORACLE-DEEPRES-01 |
| R-013；D-402 | FR-RES-002 | AC-RES-002 | P5 / T501、T502、T805 | T501、T403 | `skills/deep-research/SKILL.md`、`skills/deep-research/skill-bundle.json` | 同上 + T805 real research observation / ORACLE-DEEPRES-01 |
| R-016/R-019；D-403 | FR-RES-003 | AC-RES-003 | P5 / T501、T805 | T501 | `skills/deep-research/SKILL.md`（工具路由表） | 同上 + T805 real research observation / ORACLE-DEEPRES-01 |
| R-009；D-404 | FR-RES-004 | AC-RES-004 | P5 / T505 | none（P5 内） | `skills/stage-reflection/SKILL.md` | grep 断言命令 / ORACLE-REFLECT-01 |
| R-014；D-501 | FR-DLOG-001 | AC-DLOG-001 | P7 / T701 | none（并行） | `skills/decision-log/SKILL.md`、`skills/decision-log/templates/decision-log-template.md` | `npx vitest run tests/stage-decision-contract.test.mjs` / ORACLE-DLOGSTRUCT-01 |
| R-014；D-502 | FR-DLOG-002 | AC-DLOG-002 | P7 / T702 | T701 | 同上 | 同上 / ORACLE-DLOGSTRUCT-01+人工阅读（manual） |
| R-014；D-104 | FR-DLOG-003 | AC-DLOG-003 | P7 / T703、T704 | T701 | `tools/cli/check-decision-log-chain.mjs`（NEW）、`tools/cli/run-checks.mjs`、`tests/contract/decision-log-chain-warnings.test.mjs`（NEW） | `npx vitest run tests/contract/decision-log-chain-warnings.test.mjs` / ORACLE-DLOGWARN-01 |
| R-006/R-007/R-011；D-601 | FR-GOV-001 | AC-GOV-001 | P2 / T211、T212；P3 / T307 | T210 | `skills/wh-review/contracts/make-decision.md`、`skills/wh-review/contracts/build-spec.md`、`tests/requirements-completeness-audit-acceptance.test.mjs` | `npx vitest run tests/requirements-completeness-audit-acceptance.test.mjs` 等三合同测试 / ORACLE-CONTRACT-01、ORACLE-AC011-01 |
| R-003/R-004/R-005/R-017；D-604 | FR-GOV-002 | AC-GOV-002 | P2 / T205、T206（规则②③⑦ 测试门）、T211（合同文本）、T805（规则①④⑤⑥真实观察） | T206 | `skills/wh-review/contracts/make-decision.md`、`skills/wh-review/contracts/build-spec.md` | 失败注入用例=ORACLE-INCOMPLETE-01/ORACLE-PAIRMAT-01；无测试门规则=真实运行观察（evidence）；逐规则映射见下表 |
| R-018；D-603 | FR-GOV-003 | AC-GOV-003 | 全 phase；P8 / T805 产出 ledger、T804 汇总核对 | 全部 T | `quality/`（各 phase 验收记录） | phase-evidence-ledger 四类字段检查（每 phase 四类完成证据或 unavailable/incomplete）/ AC-GOV-003 核对 |
| R-011；D-607 | FR-GOV-004 | AC-GOV-004 | P8 / T801 | none（P8 内） | `AGENTS.md` | grep 断言命令 / ORACLE-AGENTRULE-01 |
| R-020；D-608 | FR-GOV-005 | AC-GOV-005 | P6 / T601、T805 | T504 | `workflows/make-decision/SKILL.md`（执行规划节） | grep 断言命令 + T805 runtime adherence observation / ORACLE-EXECMODEL-01 |
| R-011；D-602 | FR-GOV-006 | AC-GOV-006 | P8 / T802、T803 | T302、T308 | `AGENTS.md`、`CONTEXT.md` | grep 断言命令 / ORACLE-GOVREG-01（manual 核对一致） |
| R-010（锚定 spec 第 10 节"默认必须成立"第 1 条；A-04 定案口径，无 D 回链） | 贯穿性流程约束 | AC-GOV-003、AC-GOV-005 | 全 phase；P6 / T601、P8 / T804 | 全部 T | `workflows/make-decision/SKILL.md`、`quality/` | 本 plan 按标准五阶段排程+phase 验收记录核对 / 同 AC-GOV-003、AC-GOV-005 oracle |
| R-012（锚定 spec 第 10 节"默认必须成立"第 2 条；A-04 定案口径，无 D 回链） | 贯穿性文档与交互风格约束 | AC-TALK-005、AC-DLOG-001 | P3 / T308；P7 / T701 | none | `skills/talk-with-zhipeng/SKILL.md` 等三技能、`skills/decision-log/SKILL.md` | grep 断言（大白话选项后果/风险条款；模板记录原始需求/事实/理由/延期交接）/ ORACLE-TALKIO-01、ORACLE-DLOGSTRUCT-01 |

### FR-GOV-002 七规则验证归属

| 规则 | 内容摘要 | 验证承接（任务/oracle 或观察） | 证据 |
| --- | --- | --- | --- |
| ① | 无争议无分歧→不入 debate 不入 talk，主 agent 直接修复+登记 | build-code 真实运行观察（无测试门；合同文本由 T211/ORACLE-CONTRACT-01 成文） | `quality/evidence/p2-rule-observations.md` |
| ② | 任一侧 partial/failed→available-with-failures 标注 incomplete，debate 输入=已完成集并告知用户 | T203~T206 失败注入（ORACLE-PAIRMAT-01/ORACLE-INCOMPLETE-01） | `quality/tests/p2-pairmat-{red,green}.log`、`quality/tests/p2-incomplete-{red,green}.log` |
| ③ | 红蓝两次组请求全部 unavailable→根因修复后同编成重试一次 | T205/T206（ORACLE-INCOMPLETE-01 负例）+build-code 真实运行观察 | `quality/tests/p2-incomplete-{red,green}.log`+`quality/evidence/p2-rule-observations.md` |
| ④ | debate 无裁决或 2 轮未决→存疑清单入用户，不静默 | build-code 真实运行观察（无测试门） | `quality/evidence/p2-rule-observations.md` |
| ⑤ | 用户中止 talk→已答保留、未答标 user_deferred 进风险表 | build-code 真实运行观察（无测试门） | `quality/evidence/p2-rule-observations.md` |
| ⑥ | 问答工具不可用→降级文本卡并记录工具降级事实 | T308 降级文本成文（ORACLE-TALKIO-01）+build-code 真实运行观察（无测试门） | `quality/tests/p3-talkio-green.log`+`quality/evidence/p2-rule-observations.md` |
| ⑦ | 单成员失败→其余成员结果照用、partial 事实保留 | T205/T206（ORACLE-INCOMPLETE-01 单成员失败用例） | `quality/tests/p2-incomplete-{red,green}.log` |

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| 宪法与清单 | `CONSTITUTION.md`、`constitution-checklist.md` | no change | — | 只读绑定（真实 hash 见 Constitution Check）；本任务不修订条款 |
| 审查合同 | `skills/wh-review/contracts/make-decision.md`、`skills/wh-review/contracts/build-spec.md` | change | T211、T212 | 红蓝重述+单次边界+专项；provider-protocol.md no change（broker 协议不动） |
| 技能闭包契约 | `runtime/evidence/check-skill-closure.mjs` | change（仅文本） | T307 | T-023：L9 常量行不动，仅契约文本/说明调整 |
| 技能 bundle 登记 | `skills/wh-review/skill-bundle.json`、`skills/talk-with-zhipeng/skill-bundle.json`、`skills/grill-with-docs/skill-bundle.json`、`skills/spec-clarify/skill-bundle.json`、`skills/debate/skill-bundle.json`、`skills/spec-research/skill-bundle.json`、`skills/stage-reflection/skill-bundle.json`、`skills/decision-log/skill-bundle.json`、`skills/deep-research/skill-bundle.json` | change | T211、T308、T403、T502、T503、T505、T701、T704 | F-019：技能文件改动须同步 bundle sha256 |
| 技能目录与仓库盘点 | `skills/catalog.yaml`、`docs/architecture/repository-inventory.tsv` | change | T403、T502、T506 | deep-research 新登记+debate 条目同步；inventory 登记 path/disposition/reason/sha256 |
| 运行时 schema | `runtime/review/schemas/result.schema.json`、`runtime/review/schemas/attempt.schema.json` | change | T104 | 可选字段向后兼容；decision-entry.v1.json no change |
| 交互 aggregate 校验 | `runtime/stage/stage-content-contracts.mjs` | no change | — | round_count 动态校验已存在（stage-content-contracts L1895-1900），Talk4 条件轮无需代码改动（build-plan 实测核实） |
| 检查工具 | `tools/cli/run-checks.mjs`、`tools/cli/check-decision-log-chain.mjs` | change | T703、T704 | 告警 checker 追加（不阻断语义）；6 既有 checker 行为不变 |
| 协作规则与术语 | `AGENTS.md`、`CONTEXT.md` | change | T801~T803 | 测试硬规则+两条新控制面登记+四术语登记 |
| 工作流入口 | `workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`workflows/make-decision/skill-deps.yaml`、`workflows/build-spec/SKILL.md` | change | T305、T306、T504、T601 | Talk3/Talk4+调研条款+执行规划+分工段；核心零改动（S7） |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"bf61be16d4d67c582258e7731a335cdca20749764d5a18607f4cd8e98c26ebcb","id":"CONSTITUTION","version":"2026-08-30 治理同步","clause_count":22}`
- 配套校验文件：`CONSTITUTION.md` SHA-256=`e400d447d94a68fc629ac05acb23c807e34a5c929a5bd723c91c9b02dfc16732`，两文件均为本 plan 起草时 `shasum -a 256` 实测值。
- **F1**：核心只做调度——红蓝调度/写回落在既有 runner/kernel 扩展，无新增核心模块；能力（调研/辩论/记录）全部下沉技能层。
- **F2**：窄契约——schema 仅加 3 个可选字段；mailbox=单文件 JSON；checker↔run-checks 仅 spawnSync+exit code；wh-review↔broker 仅算法口径对齐。
- **F3**：四材料决定推进——本 plan 为第四材料之一；aggregate/receipt 结构校验（validateInteractionAggregateContract）保持写成功前 fail-loud。
- **F4**：review/debate 不作 pass gate 成文（FR-DEB-003/非目标 4）；serious finding 保留 repair-or-risk（accepted_risk 通道+user_decided 写回不阻止同任务修复）。
- **F5**：未新增任何 gate；decision-log 告警显式不阻断不进 gate；唯一新 checker 为告警性质（真实收益=防腐烂）。
- **F6**：正式写入认证当次干净已提交内容语义不变；material_id 新值向前生效，旧身份记录不当准入 gate。
- **F7**：三处正常确认不增不减（non_ui 无第四处 UI 确认）；accepted_risk 与 commit/push/merge 均经既有 confirm/authorize 独立授权，无自动路径。
- **F8**：全程选更简单方案——复用 spec-clarify 承载、confirm 语义扩展、文本层链字段，均优于新技能/新 behavior/v2 schema 备选。
- **F9**：每个行为改动一对 RED/GREEN 同 gate_cmd 同 oracle，RED 预期非零来自真实缺失；unavailable/partial/incomplete 如实记录不漂白。
- **F10**：三个 new 机制（mailbox/deep-research/告警 checker）均完成 F10 四问（DEC-005/006/007），均为无基建文本/单脚本方案，维护成本低于真实收益。
- **F11**：正常任务执行路径不变（单发阶段维持 single_round）；两个新控制面（问答工具卡、confirm 语义扩展）已登记 owner/consumer/删除条件（FR-GOV-006/T803）；辅助事实缺失不升级为阻塞。
- **Q1**：finding 不锁死修复——needs_human→user_decided 写回后同 task 继续；测试/审查缺失保持 unavailable/incomplete 不报完成（AC-GOV-002）。
- **Q2**：四材料只证明可工作；aggregate 结构错误拒绝 publication；完整质量工作（每 phase 四类完成证据）才证明 phase 完成；不可逆操作独立授权。
- **Q3**：质量裁决异源——每 phase 一次异源审查（红或蓝）；debate 裁决=独立上下文+独立复核子代理，主代理只登记（禁自审自判）。
- **S1**：能用外部就不造轮子——复用 anysearch/web_fetch/git/rg/ast-grep 既有工具与 spec-clarify 技能，重型知识图谱/embedding 栈不默认（FR-RES-003）。
- **S2**：debate v2 重写保留原技能壳与四件套结构，改造至宿主中立合宪形态。
- **S3**：debate 重写参考本任务 DSH 实测与 Codex 官方讨论（PFACT-06 来源行号已录 decision-log F-007/F-008）。
- **S4**：debate/deep-research 产物落盘任务追踪目录纳入统一执行记录（research-report content-addressed、debate 轮次区不可变）。
- **S5**：执行模型（P6）强制子代理承载重活、主会话只收 ref+hash+≤500 字结构化摘要。
- **S6**：红蓝对抗/debate 反偏见（匿名化/交换顺序/rubric）参考市面红队与多角色辩论成熟做法（decision-log 调研 RS-001 落盘引用）。
- **S7**：一阶段一技能一工作流一文件夹不变；deep-research 为独立技能文件夹；核心零改动可加装。
- **S8**：debate v2 跨宿主可搬运（文件 mailbox+降级路径）；deep-research 无宿主绑定；问答工具卡有无工具降级文本。

## Phase P1 — 契约基础与 material_id 一致性

### Goal

result/attempt schema 携带可选 pair_id/role/disputed 字段（缺省兼容）；materialIdForInput 与 broker 规范算法一致（排除 manifest.json+canonical-evidence.json、按 path Buffer.compare 排序）；严格冻结路径真实往返不再 MATERIAL_INCOMPLETE；脱敏与错误码保留回归绿。

### Files

- **NEW**：N/A — 本 phase 全部为既有文件修改。
- **MODIFY**：`runtime/review/schemas/result.schema.json`、`runtime/review/schemas/attempt.schema.json`、`skills/wh-review/scripts/simple-review-runner.mjs`（materialIdForInput L191-205）、`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/schema-validator.test.mjs`、`skills/wh-review/scripts/__tests__/material-redaction.test.mjs`（口径核对）
- **DO NOT TOUCH**：`/Users/Hugh/Hugh/Project/3rd-review`（只读参照）、`runtime/review/canonical-review-result.mjs`（P2 才动）、`skills/wh-review/contracts/*.md`（P2 才动）

### Tasks

- `T101：RED——material_id 对齐回归测试（含 manifest 条目+乱序 fixture、真实 broker 往返 fixture），预期非零`
- `T102：GREEN——materialIdForInput 对齐 broker canonical 算法，同测试转绿`
- `T103：RED——schema 可选字段断言（接受 pair_id/role/disputed+缺省兼容+非法 role 拒绝），预期非零`
- `T104：GREEN——result/attempt schema 增加可选字段，同测试转绿`
- `T105：回归——material-redaction 测试转绿确认脱敏与 identity_degraded 错误码保留未受影响`

### Verify

- `npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` → expected_exit 0（ORACLE-MATID-01；RED 证据 `quality/tests/p1-matid-red.log`、GREEN `quality/tests/p1-matid-green.log`）
- `npx vitest run skills/wh-review/scripts/__tests__/schema-validator.test.mjs` → expected_exit 0（ORACLE-SCHEMA-PAIR-01；`quality/tests/p1-schema-{red,green}.log`）
- `npx vitest run skills/wh-review/scripts/__tests__/material-redaction.test.mjs` → expected_exit 0（ORACLE-REDACT-01；`quality/tests/p1-redaction-green.log`）

### Knowledge

broker 规范算法=排除 manifest.json 与 canonical-evidence.json、按 path Buffer.compare 排序（3rd-review lib/attachments.mjs L18-26 只读参照）；material_id 变化使既有 receipt/确认绑定失效，需以新材料重建确认（SCN-008），P2 pair 校验依赖此算法输出；schema 可选字段缺省不影响既有消费方。

### STOP

真实 broker 往返 fixture 在对齐后仍 MATERIAL_INCOMPLETE（RISK-02 未关闭）→ 停止并回 `specs/.../spec.md`（FR-REV-006 验收口径）+decision-log D-605；禁止改 broker 侧或加兼容 bridge。

### Done

三条 gate_cmd 绿、RED/GREEN 证据成对落盘质量测试区；material_id 算法与脱敏回归的文本/断言部分可判，AC-REV-006 的真实 broker 往返仍由 build-code 观察任务确认；AC-REV-007 回归确认；旧 material_id 记录只读保留未回溯；本 phase 一次异源审查（红或蓝）完成并记录。

### Risks and rollback

- affected IDs：FR-REV-006/AC-REV-006（T101/T102）；trigger=算法对齐引入排序边界 case；consequence=真实往返失败；mitigation=fixture 覆盖空材料/单文件/manifest 混入三类边界；rollback=`git revert` 本 phase 提交，schema 字段为可选、revert 不影响既有消费。

## Phase P2 — 红蓝双发审查

### Goal

direction/detail 两面各执行红+蓝两次组请求构成同一逻辑 review fact；pair_id/role 元数据随请求/结果携带；同 pair 同 material_id 运行时校验（不一致记 partial）；blue_incomplete/red_incomplete 降级标注；聚合=并集+provider×角色标注+disputed/consensus 争议标注落地 clusterRecord；build-spec 单次+指令强化+"AC 可判断性与验收盲区"专项；合同/测试/AC-011 审计三者成对转绿。

### Files

- **NEW**：N/A — 本 phase 全部为既有文件修改。
- **MODIFY**：`skills/wh-review/scripts/simple-review-runner.mjs`、`runtime/review/canonical-review-result.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/contracts/make-decision.md`、`skills/wh-review/contracts/build-spec.md`、`skills/wh-review/skill-bundle.json`、`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`tests/requirements-completeness-audit-acceptance.test.mjs`、`tests/contract/review-materials-contract.test.mjs`
- **DO NOT TOUCH**：`skills/wh-review/contracts/provider-protocol.md`（broker 协议不动）、`runtime/schemas/decision-entry.v1.json`、`runtime/stage/stage-content-contracts.mjs`（本任务不动：round_count 动态校验已存在，Talk4 条件轮无需代码改动）、其余阶段合同（build-plan/build-code/verify-code/mini-task-*）

### Tasks

- `T201：RED——红蓝调度契约测试（direction/detail 各两次组请求、同一 pair_id、role 元数据），预期非零`
- `T202：GREEN——runSimpleReview/runGroup 红蓝调度实现，同测试转绿`
- `T203：RED——同 pair 同 material_id 校验测试（故意不一致记 partial），预期非零`
- `T204：GREEN——pair material 校验实现，同测试转绿`
- `T205：RED——blue_incomplete/red_incomplete 降级标注测试（含单成员失败其余照用），预期非零`
- `T206：GREEN——available-with-failures+incomplete 标注实现，同测试转绿`
- `T207：RED——聚合=并集+provider×角色标注+disputed/consensus 标注测试（含一提出一沉默用例），预期非零`
- `T208：GREEN——clusterRecord 争议标注与聚合实现，同测试转绿`
- `T209：RED——review-materials role 指令分支与 build-spec 专项断言，预期非零`
- `T210：GREEN——reviewInstructionsFor 仿 directionMode 分支加 role+build-spec 指令强化与专项，同测试转绿`
- `T211：合同成对——contracts/make-decision.md 重述红蓝契约+contracts/build-spec.md 单次边界与专项，三合同测试同步转绿+bundle sha256 同步`
- `T212：AC-011 审计成对——requirements-completeness-audit-acceptance.test.mjs L26 marker=single_round 语义行随合同红蓝重述同步改`

### Verify

- `npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` → 0（ORACLE-REDBLUE-01/ORACLE-PAIRMAT-01/ORACLE-INCOMPLETE-01；`quality/tests/p2-*-{red,green}.log`）
- `npx vitest run skills/wh-review/scripts/__tests__/review-runner.test.mjs` → 0（ORACLE-DISPUTED-01）
- `npx vitest run tests/contract/review-materials-contract.test.mjs` → 0（ORACLE-BSINSTR-01）
- `npx vitest run skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs` → 0（ORACLE-CONTRACT-01）
- `npx vitest run tests/requirements-completeness-audit-acceptance.test.mjs` → 0（ORACLE-AC011-01）

### Knowledge

红蓝仅适用 make-decision direction/detail 两面，其余阶段维持 single_round（合同文本必须写明边界）；聚合输入=完成集（蓝队 partial 时 debate 输入=已完成集）；争议送用户过滤规则=方向级/影响验收→用户、实现级分歧→debate、实现级共识→主 agent 直接修复+登记；同一 pair 两次请求共享 material 语义身份是 P3 对话材料可信的前提。

### STOP

合同文本与测试断言/AC-011 审计任一脱节（纸面合规，RISK-03）→ 停止并回 `specs/.../spec.md` FR-GOV-001 核对；聚合标注改变 reportable findings 语义 → 回 spec.md FR-REV-005 口径。

### Done

五条 gate_cmd 绿、RED/GREEN 证据成对；AC-REV-001/002/003/005 的文本/断言部分可判，AC-REV-004 与 AC-GOV-001 的真实运行观察留给 build-code；合同↔断言↔审计三者一致核对记录落盘；本 phase 一次异源审查完成并记录。

### Risks and rollback

- affected IDs：FR-REV-001~005、FR-GOV-001；trigger=蓝队超时（RISK-01 实证 4/5 失败）；consequence=审查深度打折但语义不破；mitigation=incomplete 标注+同编成重试 1 次+不延长超时窗；rollback=`git revert` 本 phase 提交（schema 字段保留不影响，合同文本随 revert 回退）。

## Phase P3 — 争议对话闭环

### Goal

accepted_risk 经既有 confirm 语义扩展公共通道完成并绑定认证 receipt；needs_human 答复写回 user_decided（source=user_reply+evidence_ref=reply_ref）；Talk3 强绑定方向争议清单+debate 存疑项；Talk4 触发条件式（仅方向级/影响验收级争议）落地三件套；build-spec findings 处置对话=复用 spec-clarify（closure 仅文本、grill 独占不变）；三技能问答工具 IO 契约与降级文本成文；aggregate 动态轮数校验绿。

### Files

- **NEW**：N/A — 本 phase 全部为既有文件修改。
- **MODIFY**：`tools/cli/stage-runtime.mjs`、`runtime/task/task-kernel-implementation.mjs`、`runtime/review/stage-review-disposition.mjs`、`runtime/evidence/check-skill-closure.mjs`（仅文本）、`workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`workflows/make-decision/skill-deps.yaml`、`workflows/build-spec/SKILL.md`、`skills/talk-with-zhipeng/SKILL.md`、`skills/talk-with-zhipeng/skill-bundle.json`、`skills/grill-with-docs/SKILL.md`、`skills/grill-with-docs/skill-bundle.json`、`skills/spec-clarify/SKILL.md`、`skills/spec-clarify/skill-bundle.json`、`tests/stage-risk-acceptance.test.mjs`、`tests/stage-interaction-contract.test.mjs`、`tests/contract/make-decision-interaction-publication.test.mjs`、`tests/integration/distribution-closure.test.mjs`、`skills/grill-with-docs/SKILL.md`、`skills/grill-with-docs/skill-bundle.json`、`skills/spec-clarify/SKILL.md`、`skills/spec-clarify/skill-bundle.json`、`skills/talk-with-zhipeng/SKILL.md`、`skills/talk-with-zhipeng/skill-bundle.json`、`workflows/make-decision/SKILL.md`、`workflows/make-decision/skill-deps.yaml`、`workflows/make-decision/steps.json`
- **DO NOT TOUCH**：`runtime/evidence/check-skill-closure.mjs` L9 常量行、`runtime/stage/stage-content-contracts.mjs`（round_count 动态校验已存在 L1895-1900，Talk4 条件轮无需代码改动）、`runtime/schemas/decision-entry.v1.json`、`skills/wh-review/contracts/*.md`（P2 已定稿，本 phase 不重开）、公共行为清单（不新增第八类 behavior）

### Tasks

- `T301：RED——accepted_risk 经 confirm 公共通道路由测试（无路由失败），预期非零`
- `T302：GREEN——stage-runtime confirm 路由+task-kernel 接线（不新增公共 behavior 名），同测试转绿`
- `T303：RED——needs_human→user_decided 写回测试（source=user_reply+evidence_ref=reply_ref），预期非零`
- `T304：GREEN——stage-review-disposition 写回实现（accepted_risk 缺 receipt fail-loud），同测试转绿`
- `T305：make-decision 三件套——Talk3 强绑定争议清单+Talk4 触发条件式+aggregate 动态轮数口径对齐，interaction 两测试转绿`
- `T306：workflows/build-spec/SKILL.md 分工段——findings 处置对话=复用 spec-clarify vs Talk/Grill 独占`
- `T307：check-skill-closure 契约文本调整（L9 常量不动）+closure/provenance 受影响测试同步转绿`
- `T308：talk-with-zhipeng/grill-with-docs/spec-clarify 问答工具化文本（IO 契约：入 question_id/axis/options≤3/recommended；出 answers+reply_ref/reply_hash；无工具降级文本卡并记录）+三 bundle 同步`

### Verify

- `npx vitest run tests/stage-risk-acceptance.test.mjs` → 0（ORACLE-RISKCONFIRM-01/ORACLE-WRITEBACK-01；`quality/tests/p3-*-{red,green}.log`）
- `npx vitest run tests/stage-interaction-contract.test.mjs tests/contract/make-decision-interaction-publication.test.mjs` → 0（ORACLE-AGGROUND-01）
- `npx vitest run tests/integration/distribution-closure.test.mjs` → 0（ORACLE-CLOSURE-01，含 L9 常量未变 grep 断言）
- `grep -q 'question_id' skills/talk-with-zhipeng/SKILL.md && grep -q 'reply_ref' skills/grill-with-docs/SKILL.md && grep -q 'reply_hash' skills/spec-clarify/SKILL.md && echo PASS` → 0（ORACLE-TALKIO-01）

### Knowledge

confirm 语义扩展的边界=仅 accepted_risk 授权与既有确认语义，不得扩张为通用写回通道；治理登记（owner=build-spec 及相关 stage；consumer=处置校验 receipt 绑定检查；删除条件=风险接收机制被替代）在 P8/T803 落 AGENTS.md；build-spec 对话生命周期=沿用既有 stage outcome 侧校验与交互 receipt、aggregate 不升 v2；用户中止=已答保留+未答 user_deferred 进风险表（SCN-004）。

### STOP

公共行为面被扩张（出现第八类 behavior 或 confirm 语义被滥用）→ 回 `specs/.../spec.md` FR-TALK-004 与 decision-log D-203；grill 独占边界被破坏或 aggregate 被升 v2 → 回 spec.md FR-TALK-003（T-023 定案口径）。

### Done

四条 gate_cmd 绿、RED/GREEN 证据成对；AC-TALK-001~005 中 003/004 可判通过（001/002/005 待真实运行观察证据）；写回闭环与 receipt 绑定结构检查通过；本 phase 一次异源审查完成并记录。

### Risks and rollback

- affected IDs：FR-TALK-001~005；trigger=confirm 路由与既有确认流程冲突；consequence=确认 receipt 绑定失效；mitigation=路由仅接 acceptReviewRisk 单点+材料变更重建确认（SCN-008）；rollback=`git revert` 本 phase 提交（kernel 接线为增量代码，revert 后 acceptReviewRisk 回到无公共路由的既有事实状态）。

## Phase P4 — debate v2（宿主中立重写）

### Goal

skills/debate 去除 Claude teammate 依赖，重写为 4 独立上下文子代理（甲/乙/丙/丁）+文件 mailbox（单消息单文件 JSON：from/to/round/seq/body|body_ref/ts）+主代理法官禁言+2 轮封顶+共享 FS 前提+降级路径记录；references 四件套落入反偏见硬约束（匿名化/交换顺序/rubric/预算声明/保留分歧）与裁决分级（方向级→用户；实现级→辩论角色按 rubric 出建议+独立复核子代理复核、主代理只登记；评委不是第 5 角色）；bundle/catalog/inventory 同步。

### Files

- **NEW**：N/A — 本 phase 全部为既有文件修改。
- **MODIFY**：`skills/debate/SKILL.md`、`skills/debate/references/role-spawn-templates.md`、`skills/debate/references/arbitration-protocol.md`、`skills/debate/references/output-template.md`、`skills/debate/references/anti-bias-guardrails.md`、`skills/debate/skill-bundle.json`、`skills/debate/__tests__/skill-contract.test.mjs`、`skills/catalog.yaml`（debate 条目）、`docs/architecture/repository-inventory.tsv`（同步行）、`skills/debate/references/anti-bias-guardrails.md`、`skills/debate/references/arbitration-protocol.md`、`skills/debate/references/output-template.md`、`skills/debate/references/role-spawn-templates.md`
- **DO NOT TOUCH**：`skills/debate/pk-rules.ts`、`skills/debate/pk-rules.test.ts`、`skills/debate/LICENSE`、`skills/debate/examples/`（本 phase 不重开）；任何运行时代码（debate 为纯技能层）

### Tasks

- `T401：RED——skill-contract 测试新断言（无 teammate 措辞、4 子代理+mailbox+法官禁言+2 轮封顶+降级路径），预期非零`
- `T402：GREEN——SKILL.md 宿主中立重写（L43/L55-61/L204-210 改写）+references 四件套修订（反偏见+裁决分级），同测试转绿`
- `T403：mailbox 格式契约段落（单消息单文件 JSON 字段表+轮次目录+body_ref 长正文规则+降级=父代理串行转发并记录）+bundle/catalog/inventory 同步`

### Verify

- `npx vitest run skills/debate/__tests__/skill-contract.test.mjs` → 0（ORACLE-DEBATE-01；`quality/tests/p4-debate-{red,green}.log`）

### Knowledge

DSH 原生父子消息实测可用但仅作加速，mailbox 文件为权威交锋记录（裁决书必须引用）；Codex 仅 collab、Multica @mention，跨宿主运行性靠降级路径兜底（PFACT-17 inferred）；2 轮封顶未决→存疑清单呈用户不静默（SCN-005）；debate 在 make-decision 的接线（6b/10b）由 P3 三件套引用本技能文本完成。

### STOP

重写后仍依赖任何单一宿主特性（teammate 或 DSH 私有 API 作为必要前提）→ 回 `specs/.../spec.md` FR-DEB-001；出现第 5 个评委角色或"辩论通过"门措辞 → 回 spec.md FR-DEB-003。

### Done

gate_cmd 绿、RED/GREEN 证据成对；AC-DEB-001/002/003 的文本与结构部分可判（DSH 真实运行实证已由本任务 dogfood 提供，PFACT-16）；catalog/inventory/bundle 三处登记一致；本 phase 一次异源审查完成并记录。

### Risks and rollback

- affected IDs：FR-DEB-001~003；trigger=非 DSH 宿主无共享 FS（RISK-05）；consequence=角色独立性打折；mitigation=降级路径成文+降级事实记录义务写入 SKILL.md；rollback=`git revert` 本 phase 提交（纯技能文本，零运行时影响）。

## Phase P5 — 调研机制（deep-research）

### Goal

新建 skills/deep-research（R0 缺口问题/R1-R2 并行深读/R3 三角测量/R4 落盘 research-report.v1 content-addressed 到任务质量证据区/R5 独立复核；停止条件=≤3 轮/问题+连续 2 轮无新增=饱和+时间盒；跳过需论证；工具路由表=外部 anysearch+web_fetch+子代理深读、内部 glob+grep+read+git+ast-grep；纯 agent 无工具检索=不合格事实记录不阻断）；spec-research 注明分工；make-decision 调研条款节（"Research is an input to Talk, not a review." 段）改写引用契约；stage-reflection 增调研深度维度（不新增 gate）；catalog/inventory 登记。

### Files

- **NEW**：`skills/deep-research/SKILL.md`、`skills/deep-research/skill-bundle.json`
- **MODIFY**：`skills/spec-research/SKILL.md`、`skills/spec-research/skill-bundle.json`、`workflows/make-decision/SKILL.md`（调研条款节，"Research is an input to Talk, not a review." 段）、`skills/stage-reflection/SKILL.md`、`skills/stage-reflection/skill-bundle.json`（六区块内插入调研深度维度）、`skills/catalog.yaml`（deep-research 登记，格式参考 spec-research 条目）、`docs/architecture/repository-inventory.tsv`（两行新登记）
- **DO NOT TOUCH**：`workflows/make-decision/SKILL.md` 的 Talk 节与执行规划节插入区（P3 已改/P6 待改，本 phase 只动调研条款节）、`runtime/`（调研为纯技能层）、`skills/spec-research/SKILL.md` 的既有调用契约（只补分工注明）

### Tasks

- `T501：NEW skills/deep-research/SKILL.md——R0-R5 子流程契约+停止条件预算+跳过论证义务+工具路由表+降级记录语义`
- `T502：NEW skills/deep-research/skill-bundle.json（{schema_version:1,skill,files}）+bundle 合法性断言通过`
- `T503：skills/spec-research/SKILL.md 注明分工（build-plan 轻量规划问题 vs deep-research=make-decision 深度调研）+bundle 同步`
- `T504：workflows/make-decision/SKILL.md 调研条款节（"Research is an input to Talk, not a review." 段）改写（引用 R0-R5 契约、R0 缺口由需求框架骨架生成）`
- `T505：skills/stage-reflection/SKILL.md 增调研深度维度（一手来源率/收敛率/OPEN 数/工具使用记录；缺省 not_applicable；不新增 gate）+bundle 同步`
- `T506：catalog.yaml+repository-inventory.tsv 登记（含 sha256）`

### Verify

- `node -e "const b=require('./skills/deep-research/skill-bundle.json');if(b.schema_version!==1)process.exit(1)" && grep -q 'R0 缺口' skills/deep-research/SKILL.md && grep -q 'R5 独立复核' skills/deep-research/SKILL.md && grep -q 'research-report.v1' skills/deep-research/SKILL.md && echo PASS` → 0（ORACLE-DEEPRES-01；`quality/evidence/build-plan-or-T501.log`、`quality/evidence/build-plan-or-T502.log`）；catalog/inventory 的 deep-research 登记只在 T506 完成后核对，不提前作为 T501/T502 gate。
- `grep -q '一手来源率' skills/stage-reflection/SKILL.md && grep -q 'not_applicable' skills/stage-reflection/SKILL.md && echo PASS` → 0（ORACLE-REFLECT-01）

### Knowledge

research-report.v1 落盘=任务质量证据区 content-addressed（命名=内容 sha256 与字节一致），decision-log 只引 path+hash 不复制正文；本任务已 dogfood 实证 R0-R5 跑通+三版落盘+R5 复核 8 条处置（PFACT-16），技能文本以实证口径为准；P6 执行规划节将引用本 phase 的并行上限（研究 4）。

### STOP

调研契约被写成推进 gate 或 pass 判据（违反 F4/FR-RES-001 边界）→ 回 `specs/.../spec.md` FR-RES-001；与 spec-research 分工混淆（两个技能同一消费场景）→ 回 decision-log D-401 分工口径。

### Done

两条断言命令通过；AC-RES-001/002/003/004 文本与登记部分可判（真实调研运行证据已由本任务 dogfood 提供）；catalog/inventory/bundle 三处一致；本 phase 一次异源审查完成并记录。

### Risks and rollback

- affected IDs：FR-RES-001~004；trigger=工具不可用（anysearch/web_fetch 缺席）；consequence=调研降级但不可静默；mitigation=降级显式记录义务写入工具路由表；rollback=`git revert` 本 phase 提交+按登记删除条件移除 skills/deep-research/（NEW 目录整体删除）。

## Phase P6 — 执行模型（make-decision 调度器）

### Goal

workflows/make-decision/SKILL.md 执行规划节成文（插入点=Procedure 节内、"Completion and fact writing" 节前）：M/S/B/P 执行器矩阵+上下文守恒 6 规则（全量产物落盘 ref+sha256+≤500 字摘要/子代理回传强制结构化/并行上限=研究 4+debate 4+红蓝 2/交互 M 独占/候选外包+裁决分级/主会话旧步骤不回读）。

### Files

- **NEW**：N/A — 本 phase 全部为既有文件修改。
- **MODIFY**：`workflows/make-decision/SKILL.md`（仅执行规划节插入区）
- **DO NOT TOUCH**：`workflows/make-decision/SKILL.md` 的 Talk 节（P3 定稿）与调研条款（P5 定稿）、`workflows/make-decision/steps.json`、`runtime/`（执行模型为文本层约束，不改阶段契约）

### Tasks

- `T601：执行规划节成文——M/S/B/P 矩阵（14 步 step×executor）+上下文守恒 6 规则+摘要模板口径（研究/草稿/汇总≤500 字；复核类一行一条 finding）+并行上限，grep 断言通过`

### Verify

- `grep -q 'M/S/B/P' workflows/make-decision/SKILL.md && grep -q '研究 4' workflows/make-decision/SKILL.md && echo PASS` → 0（ORACLE-EXECMODEL-01；`quality/tests/p6-execmodel-green.log`）

### Knowledge

矩阵口径以 decision-log 的 "Step×Executor 矩阵" 节与 "上下文守恒规则" 节为唯一事实源（D-608/OPEN-02 已定稿摘要模板）；执行方式约束不改变阶段契约（FR-GOV-005 范围边界）；本任务运行方式已实证符合（PFACT-16）。

### STOP

执行模型被写成运行时强制（新增校验代码或 gate）→ 回 `specs/.../spec.md` FR-GOV-005 范围边界（仅文本约束）；与 P3/P5 已改段落行区间重叠冲突 → 按 PLAN-RISK-003 串行规则重排。

### Done

断言命令通过；AC-GOV-005 文本部分可判（运行一致性已由本任务实证）；本 phase 一次异源审查完成并记录。

### Risks and rollback

- affected IDs：FR-GOV-005；trigger=文本与既有 Procedure 节结构冲突；consequence=技能文本自相矛盾；mitigation=插入点限定 Procedure 节内、"Completion and fact writing" 节前+改后人工通读 Procedure 节一次；rollback=`git revert` 本 phase 提交（单文件单节）。

## Phase P7 — 决策记录结构（需求框架+模块分组+链字段告警）

### Goal

skills/decision-log SKILL.md+模板升级：组合式需求框架 2 类 preset（功能类=背景-问题-目标-方案-验收-扩展；研究类=问题-论断-证据-裁决）+决策挂骨架节点+节点待补证据声明式标记；决定区按模块 h3 分组+D-ID+derived_from 跨模块引用；文本层链字段 derived_from/module/requirement_ids/artifacts；run-checks 新增不阻断告警 checker（RED/GREEN 成对）；既有机器强制边界（16 h2/覆盖/五维/R-NNN）全绿不破。

### Files

- **NEW**：`tools/cli/check-decision-log-chain.mjs`、`tests/contract/decision-log-chain-warnings.test.mjs`
- **MODIFY**：`skills/decision-log/SKILL.md`、`skills/decision-log/skill-bundle.json`、`skills/decision-log/templates/decision-log-template.md`、`tools/cli/run-checks.mjs`（L115 后注册告警 checker）
- **DO NOT TOUCH**：`runtime/schemas/decision-entry.v1.json`（按 spec PFACT-12 的 20 个必填字段口径不动）、`runtime/stage/stage-content-contracts.mjs` 的 REQUIRED_MAIN_SECTIONS L25-28 与 validateMain L2060-2072（16 h2 机器强制不改）、既有 6 个 checker 行为

### Tasks

- `T701：decision-log SKILL.md+模板——需求框架 2 preset+决策挂节点+待补证据标记（文本层，不破坏 16 h2）`
- `T702：决定区模块 h3 分组+链序+跨模块 D-ID+derived_from 引用+链字段四字段写法`
- `T703：RED——checker 测试（故意缺失/非法/引用不存在用例告警且 exit 0、不升 schema、不进 gate），checker 不存在预期非零`
- `T704：GREEN——check-decision-log-chain.mjs 实现+run-checks.mjs 注册（只打印不进 failures 不 exit 1），同测试转绿+bundle 同步`

### Verify

- `npx vitest run tests/contract/decision-log-chain-warnings.test.mjs` → 0（ORACLE-DLOGWARN-01；`quality/tests/p7-dlogwarn-{red,green}.log`）
- `npx vitest run tests/stage-decision-contract.test.mjs` → 0（ORACLE-DLOGSTRUCT-01：模板改动后既有 decision-log 结构校验全绿，证明机器强制边界未破）

### Knowledge

告警 checker 语义=告警只打印不 exit 1、不升 schema、不进 gate（OPEN-02 定稿），run-checks 注册段必须显式不写进 failures 数组；链字段仅在文本层，decision-entry.v1 机器消费者无感；本任务 decision-log 已是试运行样本（PFACT-16），模板以样本结构为准。

### STOP

告警被实现为阻断（exit 非 0 或进 failures）→ 回 `specs/.../spec.md` FR-DLOG-003 边界；模板改动导致 16 h2/覆盖矩阵/五维/R-NNN 任一校验红 → 回 decision-log D-501/D-502 与 spec.md FR-DLOG-001 边界（X-003 不得提前触发）。

### Done

两条 gate_cmd 绿、RED/GREEN 证据成对；AC-DLOG-001/003 可判通过、AC-DLOG-002 待人工阅读（manual）；run-checks 汇总中该 checker 告警不阻断实证记录；本 phase 一次异源审查完成并记录。

### Risks and rollback

- affected IDs：FR-DLOG-001~003；trigger=链字段长期不维护腐烂（RISK-04）；consequence=决策链退化；mitigation=告警+复盘结构维度双重暴露、告警失效触发 X-003 评估；rollback=`git revert` 本 phase 提交+删除两个 NEW 文件（checker 与测试），run-checks 注册段随 revert 回退。

## Phase P8 — 治理登记与文档

### Goal

AGENTS.md"给 agent 的规则"节增测试硬规则（只跑受影响针对性测试、禁止全量 vitest/test:safe，除用户/CI 明确要求；引 docs/standard-workflow.md L310）；CONTEXT.md 核心概念术语节登记四术语（争议 findings/红蓝审查/需求框架/决策链）；AGENTS.md 当前治理边界节登记两条新控制面（结构化问答工具卡、accepted_risk confirm 语义扩展，各含 owner/consumer/删除条件）；各 phase 验收记录汇总核对（FR-GOV-003）。

### Files

- **NEW**：N/A — 本 phase 全部为既有文件修改。
- **MODIFY**：`AGENTS.md`（L11 规则节后+当前治理边界节）、`CONTEXT.md`（核心概念术语节 L23）
- **READ-ONLY INPUTS**：`skills/decision-log/templates/decision-log-template.md`、`tests/contract/decision-log-chain-warnings.test.mjs`、`workflows/make-decision/SKILL.md`；P8 只核对其事实，不在本 phase 修改
- **DO NOT TOUCH**：`AGENTS.md` 既有治理边界条目（只追加不改写）、`docs/standard-workflow.md`（只引用不修改）、`CONSTITUTION.md`、`constitution-checklist.md`、spec 第 10 节（非目标唯一权威，不在 AGENTS.md 复制第二份清单）

### Tasks

- `T801：AGENTS.md 测试硬规则成文（只跑受影响针对性测试+禁止全量+例外=用户/CI 明确要求+引 standard-workflow.md L310），grep 断言通过`
- `T802：CONTEXT.md 术语登记（争议 findings/红蓝审查/需求框架/决策链，每条一句话定义+回指 spec）`
- `T803：AGENTS.md 治理边界节两条新控制面登记（问答工具卡 owner=各交互 stage 主会话/consumer=stage outcome 交互校验/删除条件=机制被替代；confirm 语义扩展 owner=build-spec 及相关 stage/consumer=处置校验 receipt 绑定检查/删除条件=风险接收机制被替代）`
- `T804：各 phase 验收记录汇总核对（只读 T805 的 phase-evidence-ledger，每 phase 四类完成证据：开发+契约/测试绿+用户验收+异源审查；失败 phase 有 unavailable 记录）`
- `T805：真实 broker/host/dogfood 观察与 phase-evidence-ledger（AC-REV-004/006、AC-TALK-001~005、AC-DEB-001~003、AC-RES-001~003；缺外部依赖则保留 unavailable）`

### Verify

- `grep -q '只跑受影响针对性测试' AGENTS.md && grep -q '禁止全量' AGENTS.md && echo PASS` → 0（ORACLE-AGENTRULE-01；`quality/tests/p8-agents-green.log`）
- `grep -q '红蓝审查' CONTEXT.md && grep -q '结构化问答工具卡' AGENTS.md && grep -q 'confirm 语义扩展' AGENTS.md && echo PASS` → 0（ORACLE-GOVREG-01；`quality/evidence/build-plan-or-T802.log`、`quality/evidence/build-plan-or-T803.log`）

### Knowledge

D-607 硬规则的例外只有"用户或 CI 守卫明确要求"，本任务后续全部验证（含 phase 验收）按此执行并留记录（AC-GOV-004 证据）；新控制面登记是 FR-GOV-006 的强制义务，删除条件触发时回 make-decision 评估移除；R-010/R-012 两条贯穿性约束的锚定=spec 第 10 节"默认必须成立"（A-04 定案口径），验收分别挂 AC-GOV-003/005 与 AC-TALK-005/AC-DLOG-001。

### STOP

出现第二份非目标清单（AGENTS.md 复制 spec 第 10 节内容）→ 回 `specs/.../spec.md` 第 10 节唯一权威口径；治理登记缺 owner/consumer/删除条件任一要素 → 回 spec.md FR-GOV-006。

### Done

两条断言命令通过；AC-GOV-004/006 可判通过；T805 的真实观察与 phase ledger 已记录，AC-GOV-003 只在 ledger 四类字段齐全或明确 unavailable/incomplete 后汇总；本 phase 一次异源审查完成并记录；全任务 28 FR/28 AC 的 Traceability 表逐行可核对。

### Risks and rollback

- affected IDs：FR-GOV-003/004/006；trigger=硬规则与既有 AGENTS.md 条目表述冲突；consequence=规则歧义被绕过；mitigation=只追加不改写既有条目+例外口径逐字写清；rollback=`git revert` 本 phase 提交（纯文档追加，零行为影响）。

## Phase P9 — 当前四阻塞修复与重跑

### Goal

只修复当前 verify-code 质量链中已定位的四类阻塞：Stage Agent 结果缺失的可诊断性、wh-review broker 失败时的路由事实保留、human confirmation 的外部完成条件、以及 unavailable Stage Agent outcome 内层代码审查身份为空导致的二次 `stage_outcome_invalid`。复用现有 bridge、ReviewProviderClient、TaskKernel、`confirm` 路由和官方 stage runtime；不把 unavailable 改写为通过，不新增 stage/gate/public command/状态源/第五材料。

### Files

- **NEW**：N/A — 只修既有控制面和回归测试。
- **MODIFY**：`runtime/stage/stage-agent-outcome-adapter.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`tests/contract/host-outcome-bridge.test.mjs`、`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`。
- **READ-ONLY INPUTS**：`runtime/stage/stage-runner.mjs`、`tools/cli/stage-runtime.mjs`、`runtime/task/task-kernel-implementation.mjs`、`skills/wh-review/scripts/review-provider-client.mjs`、当前 task store 的 canonical quality facts。
- **DO NOT TOUCH**：`CONSTITUTION.md`、`constitution-checklist.md`、`runtime/stage/stage-runner.mjs` 的 fail-closed 身份校验、`runtime/task/task-kernel-implementation.mjs` 的 confirm 语义、外部 `3rd-review` broker、旧 quality records；不新增 Stage Agent runner。

### Tasks

- `T901：修复 unavailable verify-code 内层 code_review 的 snapshot_tree/material_revision 为空；继续复用 stage publisher 捕获的同一 identity，增加 current-bound unavailable 回归测试。`
- `T902：强化现有 Stage Agent bridge 的 producer 边界；缺 session/unavailable 时给出明确 bridge 诊断，unavailable 记录保留 source_id/source_family；不猜测、不扫描旧 session、不自动伪造 dsh-code-review。`
- `T903：强化现有 wh-review 失败事实；broker 已选 provider 失败时保留 provider_selection，回归默认 600s 外层等待与 `deadline_ms:null`，不增加重试/新生命周期控制面。`
- `T904：外部闭环交接；只接受真实 dsh-code-review session、真实 wh-review semantic result、当前 verify-code e2e acceptance 和用户当前确认，任一缺失继续记 unavailable/missing/incomplete，不能由代码代填。`
- `T905：修复后只重跑一次官方 verify-code/status 与受影响定向测试，确认 `stage_outcome_invalid` 不再由内层空 identity 触发，并列出仍需外部完成的阻塞。`

### Verify

- `npx vitest run tests/contract/host-outcome-bridge.test.mjs` → 0（ORACLE-P9-BRIDGE-01）。
- `npx vitest run skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs` → 0（ORACLE-P9-WHREVIEW-01）。
- 官方 `stage-runtime run --action=execute --stage=verify-code` 与 `stage-runtime status` 只运行一次；`stage_outcome_diagnostic.reason` 不得再是由 inner null identity 引起的 `stage_outcome_invalid`。

### Knowledge

Stage Agent、异源 provider 和用户确认是外部生产者/用户事实。F1/F10 禁止把它们的 runner、重试、后台生命周期或新状态机塞回 WorkflowHub；F4/F9/Q1 要求缺失事实保持 unavailable/missing/incomplete。T901 只修 serializer，T902/T903 只提高现有边界的可诊断性；若外部事实仍缺，P9 可以物理完成但当前任务不能宣称 acceptance-green。

### STOP

需要放宽 `stage-runner` 当前 identity 校验、把 broker timeout/cancel 改成 clean、自动写 human confirmation、启动第二个 Stage Agent/worker、或新增 public command/gate → 停止并回 decision-log/spec，不在本 phase 越界。

### Done

T901/T902/T903 的定向测试通过；官方重跑能区分 valid unavailable 与 invalid outcome；T904 只有收到四类真实外部事实后才可完成，否则保留缺失项；T905 输出当前质量状态与剩余阻塞，不把机器测试绿当 acceptance-green。

### Risks and rollback

- affected IDs：当前 verify-code 的质量事实绑定与失败可诊断性，不新增 FR/AC；trigger=host serializer、bridge 输入或 broker transport 失败；consequence=真实 unavailable 被二次误报 invalid，或 provider 路由无法追溯；mitigation=同一 identity 绑定、显式 producer 错误、保留 provider_selection、回归测试；rollback=`git revert` P9 代码/测试变更，旧 canonical records 只读保留不删除。
