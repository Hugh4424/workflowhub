# Decision Log — workflowhub-execution-acceleration-deferred-20260909

> 阶段：make-decision（进行中）
> 创建：2026-09-09
> 认证 worktree：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-execution-acceleration-deferred-20260909`
> 分支：`task/workflowhub/workflowhub-execution-acceleration-deferred-20260909`（基线 `1195bca08be4ef62e204ac764873b9e46a662432`）
> task store：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-execution-acceleration-deferred-20260909`
> 原始需求来源：用户 2026-09-09 指令 + `/Users/Hugh/Downloads/workflowhub-execution-simplification-postmortem-20260909.md`（665 行，其中 L616-665 为前序任务回写的「处置与延期登记」）
> 前序任务材料（只读事实）：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-execution-acceleration-20260909/specs/workflowhub-execution-acceleration-20260909/decision-log.md`

---

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 | 维度（requirement message class） |
| --- | --- | --- | --- | --- |
| R-001 | 阅读指定复盘文档（含末尾「处置与延期登记」四节） | 用户原话：「请查看/Users/Hugh/Downloads/workflowhub-execution-simplification-postmortem-20260909.md」 | covered（D-001） | goal |
| R-002 | 前序任务已完成该文档「前面几个任务」的设计（事实背景） | 用户原话：「我在另一个 @workflowhub执行加速 任务中进行了这个文档的前面几个任务的设计」 | covered（F-001；D-001） | constraint_non_goal_defer |
| R-003 | 本次要做「剩下的功能」的设计 | 用户原话：「希望你和我开始剩下的功能的设计」 | covered（D-001：S3/S4/S7 设计+实施） | goal |
| R-004 | 按标准 WorkflowHub 流程：先创建 worktree，再从 make-decision 开始，不跳阶段 | 用户原话：「请按标准 WorkflowHub 开始这个任务吧，先创建worktree，然后从 make-decision 开始，不要跳阶段」 | covered（D-001） | flow_or_surface |
| R-005 | 不依赖 build-spec 补需求 | 用户原话：「也不要依赖 build-spec 补需求」 | covered（D-002） | flow_or_surface |
| R-006 | make-decision 中一起梳理：完整用户流程、页面范围、数据状态、成功/失败边界、非目标、延期项 | 用户原话：「先基于原始需求，在make-decision的过程中和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项」 | covered（各对应定稿节） | flow_or_surface |
| R-007 | 注意主会话上下文控制和子代理派发 | 用户原话：「注意主会话上下文控制和子代理派发」 | covered（D-002） | goal |
| R-008 | Talk 和 Grill 用大白话说明选项、后果和风险 | 用户原话：「Talk 和grill请用大白话说明选项、后果和风险」 | covered（D-002） | flow_or_surface |
| R-009 | DEFER-S3 测试反馈环实际改造 | 复盘 L639 | covered with revision（D-002/D-003；不含结果复用） | data_or_state |
| R-010 | DEFER-S4 任务切片上限 + 预算唯一裁决点 | 复盘 L640 | covered with revision（D-004/D-005；advisory 不硬拒） | constraint_non_goal_defer |
| R-011 | DEFER-S5 一等 repair delta 与 `resolved` 链 | 复盘 L641 | deferred（D-010/DEFER-S5） | flow_or_surface |
| R-012 | DEFER-S6 Phase 循环瘦身与 RED/GREEN 证据卫生 | 复盘 L642 | deferred（D-010/DEFER-S6） | flow_or_surface |
| R-013 | DEFER-S7 事实小修与 close 最终态表达 | 复盘 L643 | covered with revision（D-006/D-007） | flow_or_surface |
| R-014 | 复盘第三优先：review + repair delta + disposition | 复盘 L448-464 | deferred（D-010/DEFER-S5） | flow_or_surface |
| R-015 | 复盘第四优先：重做任务切分规则 | 复盘 L466-480 | covered with revision（D-004；>10 文件+目标/跨 Phase 三信号） | constraint_non_goal_defer |
| R-016 | 复盘第五优先：测试分层、fake、复用与证据 | 复盘 L482-499 | partial：分层/fake/薄真实/final once 纳入 D-002/D-003；reuse 延期；RED hygiene 随 S6 延期 | data_or_state |
| R-017 | 复盘第六优先提出 producer/index/readback/orphan 与四域 | 复盘 L501-519 | **covered（部分采纳）**：四域与实际受改 writer 的 fail-loud/readback 纳入 D-007/B-S7；旧 index-current/orphan 投影已被前序 vNext 单写决定推翻，不恢复 | data_or_state |
| R-018 | 复盘第八优先提出 close plan/result、cleanup correction、CLI 文案顺序 | 复盘 L544-549 | **covered（部分采纳）**：plan/result 与 CLI 顺序纳入；独立 correction/event 与 vNext 禁 historical correction 冲突，改用同 plan step records + live inspect 派生 | flow_or_surface |
| R-019 | 复盘运营指标 | 复盘 L582-596 | covered（D-003/D-005/D-007，逐项处置）：inner/phase→S3；full-review 重试→S4 正式预算；current-fact coverage→S7 唯一逐 AC 权威；polling/trees/root-context 属 S2/S6 或运营层，随相应延期而不纳入当前验收 | success_failure_acceptance |
| R-020 | 复盘建议实施顺序（7 步） | 复盘 L598-606 | partially_superseded：按当前无前置 seam 改为 S3→S4-slicing→S4-review-budget→S7；repair/S6 随依赖延期（D-001） | constraint_non_goal_defer |
| R-021 | 治理边界：质量事实不是推进许可证；不新增 gate；新机制须登记职责/consumer/owner/测试/删除条件；不新增双写或永久兼容桥 | CONSTITUTION.md；AGENTS.md「当前治理边界」「vNext 永久实施边界」；docs/standard-workflow.md L7-21 | covered（D-003） | constraint_non_goal_defer |
| R-022 | 测试硬规则：只跑受影响针对性测试；禁止无范围全量回归 | AGENTS.md「测试硬规则」；docs/standard-workflow.md L310 | covered（D-003） | constraint_non_goal_defer |
| R-023 | 审查 dispatch 中材料变化触发 `REVIEW_SOURCE_DRIFT` | 复盘 L650 | deferred：S1 已拥有 preflight 修复；剩余 repair/phase 行为随 DEFER-S5/S6，当前 S4 只保留不可伪造 import provenance（D-005/D-010） | data_or_state |
| R-024 | 同 run/同快照多个 completed outcome 判 conflict | 前序 decision-log「阶段末验证」节 | covered as constraint：S7 逐 AC 与 physical 矩阵均在并列/冲突时 fail-closed；S6 进一步瘦身延期（D-007/D-010） | data_or_state |
| R-025 | 前序任务已定契约：S1/S2/per-AC 的 D-001..D-010 与「风险与延期交接」表是本次的既成约束，不得与之冲突 | 前序 decision-log「决定」「风险与延期交接」节 | covered（D-001、D-003） | constraint_non_goal_defer |
| R-026 | 前序 RISK-001 的人工硬拦截规则 | 前序 decision-log RISK-001 | covered（partially_superseded）：保留 >10 与单 seam 目标，改为 D-004 的三信号/三态/强制解释/exit 0，不再停手或硬拒 | constraint_non_goal_defer |

### 需求框架（先选一类，再逐步回填）

- **framework**：`functional`（背景→问题→目标→方案→验收→扩展）
- **选择理由**：本任务是「把复盘剩余延期项变成可交付决策」的产品/工程决策，不是研究结论裁决；复盘的 8 条建议与前序任务已定的 S1/S2 契约都是候选与约束，不是既定裁决。研究（如需要）作为受影响节点的 `research` 子树挂载。
- **回填规则**：调研、Talk、审查、Grill 只能扩展已有节点；混合任务以 `functional` 为外层，在受影响节点下挂 `research` 子树。

| node_id | 节点 | status | evidence_status | evidence_owner | next_review_trigger |
| --- | --- | --- | --- | --- | --- |
| N-001 | 背景/问题：复盘剩余五项延期项（S3–S7）尚未有决策，且 S1/S2 只完成设计未实现 | confirmed | complete | 复盘 L616-665 + 前序 decision-log | — |
| N-002 | 目标：本次要拿到什么（设计覆盖哪些 seam、交付单元怎么切） | open | pending | 本阶段 Talk R1/R2 | 用户回答后 |
| N-003 | 方案：每个 seam 的具体做法（测试分层与 fixture、切片上限与预算 owner、repair delta、phase 证据卫生、close 四域） | open | pending | 本阶段 Talk R2/R3 + 独立建议 + 仓库事实 | 方向确认后 |
| N-004 | 验收：用什么可证伪口径证明每个 seam 达标 | open | pending | 本阶段 Talk R2 + 复盘指标 R-019 | 方向确认后 |
| N-005 | 扩展/延期：本次不做与再次延期的条目（含依赖 S1 落地后才能做的部分） | open | pending | 本阶段 Talk R2 + D-0xx | 方向确认后 |

## UI applicability

```json
{"result":"non_ui","sources":{"raw_requirement":{"conclusion":"non_ui","reason":"用户需求全部是执行成本、测试反馈环、任务切片、审查修复链、阶段证据与 close 读模型，没有任何页面或交互诉求"},"project_inventory":{"conclusion":"non_ui","reason":"仓库盘点无 web 前端应用（无 src/、apps/、web/，无前端框架依赖；package.json 依赖仅 ajv/js-yaml + vitest/markdownlint）"},"planned_or_changed_frontend_fact":{"conclusion":"non_ui","reason":"本次候选改动落在 tests/、vitest 配置、runtime/review、runtime/evidence、runtime/stage、workflows/build-plan、workflows/build-code、tools/cli（close/status 文本输出）与文档，不新增页面或前端组件"}}}
```

三个来源都由证据合并得出（不是调用方标签）：原始需求无 UI 信号；仓库盘点确认本仓无前端应用；候选改动无前端事实。结论 `non_ui`。

## 目标

- 目标：把复盘剩余的五项延期项（S3–S7）变成可交付、可验收、可排期的决策，且不新增 gate、不伪造质量事实。
- 排序依据：R-003（用户要求设计「剩下的功能」）+ R-020（复盘建议实施顺序）。

## 核心需求

- **核心需求**：让 WorkflowHub 的执行反馈环（测试、任务切片、finding 修复、阶段证据、close 读模型）从「每次重演昂贵循环」变成「分钟级反馈 + 可复用结果 + 单一裁决点」。
- **核心目标**：本任务设计并实施 S3（测试反馈环）、S4（切片检查 + review 预算唯一裁决点）、S7（事实与 close 最终态）；每个 seam 一个串行 Phase、独立 RED/GREEN/证据/review。S5/S6 保留契约骨架，等 S1 实施后各自独立立项。
- **范围**：只动执行成本与事实表达；不动五阶段划分、public command 集合、close 授权语义、broker 内部 provider 协议。
- **验收**：每个 seam 都有基线/阈值/观测来源/pass-fail + 针对性合同测试 + 一次真实复跑；n=1 只称达到/未达到阈值。
- **未决与延期**：S5、S6、跳过式测试结果复用已延期；其 owner、触发条件、最小交付物与验收证据见「风险与延期交接」。

## 范围

### 完整用户流程

现状端到端旅程（一次真实任务）：

```text
make-decision（Talk/研究/审查/确认）
→ build-spec（spec.md）
→ build-plan（plan.md + tasks.md）
→ build-code（每 Phase：写 RED → 最小实现 → 跑聚焦 GREEN → 每 Phase 一次 review → 处置 finding → capture）
→ verify-code（当前实现的一次代码 review + finding 处置）
→ close（人工授权 commit/merge/archive/push/cleanup）
```

当前任务改造后的目标旅程（一次真实任务）：

1. build-plan 写完 plan/tasks 后，引用 `skills/test-routing-advisor` 的唯一 runtime-profile 契约为测试集合标注 `inner|medium|large`；不得复制阈值或能力许可。
2. build-plan 同时由现有 `validatePlanTaskContract` 读取 `精确文件`、Phase/`Verify.Target`、跨 Phase 文件交集和 `task risk`，返回 `within_budget|explained_overage|unexplained_overage`，命令始终 exit 0。
3. 若 overage，CLI/status 展示命中信号；用户在该 task 的现有 `task risk` 写 `slice-advisory` 四项 marker（reason/impact/owner/recheck）后重读。`unexplained_overage` 是质量缺口，不是推进 gate。
4. build-code 每 Phase 按实际 changed files 重跑 advisor；如 profile 变化，保留旧值/新值/理由。S3、S4-slicing、S4-review-budget、S7 各一个串行 Phase，不能把两个 owner 合在同一 Phase。
5. 开发者先跑 hermetic inner；涉及真实 git/argv/cwd/raw output/取消/端口时跑 phase/medium 薄真实集合；只显示 command、exit、receipt 与实测值，不做 hash 跳过。
6. inner 任一文件 5 次最大值或集合 nearest-rank p95 >60s、phase/medium >300s 时显示 fail/incomplete，但允许在同一 task 继续修复（60s 是 D-012 于 2026-09-10 修订后的现行值；原 120s 见 D-002/T-007 历史）。
7. `status` 始终并列 `work_progress/stage_quality/product_release/physical_delivery`；verify/release 只读 current 的 per-AC 产品结果权威 —— 该权威按 main 已建立的唯一 writer 契约发布（`runtime/stage/completion-predicates.mjs:375-381,1119-1123`），本任务核对这条权威链不被绕过（D-006 修订）。
8. 尚无 close plan 时 physical=`not_started`。用户调用 close 时，先看到四域与 plan 冻结的质量/release 快照，再一次确认清单，由运行时逐项请求既有不可逆授权。
9. close 失败时显示未完成物理项与 next action；resume 使用同一 plan，按既有 step records + live probe 重读，不覆盖失败事实，也不新增 correction/recovery 状态机。
10. 所有物理项满足后，唯一 completed record 只写执行结果；CLI 成功文案先说 physical delivery completed，再如实显示 `stage_quality`/`product_release`；existing workspace 显示 `not_applicable_recorded` 且不删除。

当前任务的四个实现 seam：S3、S4-slicing、S4-review-budget、S7。S5 finding repair 与 S6 phase evidence 已移至延期交接，不是当前流程触点。

### 页面范围

- 页面：`none`（见 `## UI applicability`，结论 `non_ui`）。
- 唯一「界面」是 CLI 文本输出：`status`（`tools/cli/stage-runtime.mjs:514-601`）、`doctor`（同文件 607-618）、`close`（`tools/cli/task-close.mjs:116-121,174`）。
- 本任务可能改变的可见输出：`status` 的四域并列、close 成功文案顺序、阶段末披露文本。不新增页面、不新增 CLI 子命令。

### 数据状态（本阶段必须形成）

| 对象 | 现状（路径/行号） | 当前写者 | 当前消费者 | 本任务候选改动 |
| --- | --- | --- | --- | --- |
| 测试 receipt | `quality/tests/<name>.json` + `output/<name>.output`；`runtime/evidence/canonical-receipt-writer.mjs:230` 已有 `reusableTestCapture` | capture writer | phase/final aggregate、verify | 只做分层与 hermetic 化；不做闭包 hash 跳过 |
| 测试分层契约 | 前序 D-007 设计了 `test runtime profile`；本任务 D-002 指定 `skills/test-routing-advisor` 为唯一权威 | test-routing-advisor | spec-tasks/build-plan/build-code/CI | 落地单一契约，不新造第二套 |
| 任务卡切片 advisory | 现无上限；已有 `validatePlanTaskContract` 与 `task risk` | build-plan 原文 writer；validator 派生，不持久化第二状态 | build-plan/status/build-code | S4 从现有字段派生三信号/三态 |
| review request kind / budget | route 生成 initial/focused/phase；`narrow_diff` 无生产者 | `recordSimpleReviewRequest` 正式派发链 | dispatch；stage handler 只消费 | 删除 dead kind 与重复裁决 |
| result-only review import | `recordSimpleReviewResult` 可从 caller result 自建 attempt/result，但无既存 attempt provenance | authenticated task route | canonical review consumer | 必须绑定既有 immutable attempt/request/material/evidence/provider-output hashes，否则只能非权威导入 |
| finding 处置与 repair | 既有 `finding_dispositions`/`resolved` 链 | stage handler/freshness | verify-code | 不改；DEFER-S5 |
| stage outcome | `quality/evidence/stage-outcomes/...` | stage publication | status/close/product_release | S7 只改四域聚合，不改 outcome 协议 |
| verify summary | main 合并后 `quality/verify.json` 已是 per-AC 产品结果权威（`completion-predicates.mjs:375-381,1119-1123`）；`TaskKernel.publishVerifySummary`（`task-kernel-implementation.mjs:742`）是唯一 canonical writer；`task-store.mjs:250-262` 每任务初始化 stub；`tests/contract/verify-publication.test.mjs:30-81` 断言唯一 writer | TaskKernel 唯一 canonical writer | product-release/status reader | S7 只核对既有「唯一权威 + 唯一 writer」不被绕过；不新增 writer、不删除权威、不改历史 bytes（D-006 修订） |
| 逐 AC current fact | producer `stage-runner.mjs:1427-1499,2003-2031` 写 acceptance evidence + `kind=acceptance_criterion` quality fact；reader `completion-predicates.mjs:723-795` 认证 current AC | stage-runner/TaskKernel 唯一质量写链 | product release/status | S7 只读核对：逐 AC 证据链与 verify summary 权威的分工（证据 vs 发布权威）不被越权改写（D-006 修订） |
| close 记录 | `core/task-close.mjs:1224-1231`（含 `close_mode`）与 `:1778`（无 `close_mode`）；`physical_state` 内 `worktree_cleanup` 布尔与 `cleanup.{skipped\|removed\|incomplete}` 并存（1708-1725，白名单 `77-82`） | close writer | status/审计 | S7：plan prediction 与 execution result 分离 |
| 四域读模型 | `status` 输出 stage progress + quality_status + product_release_status + status_groups（`stage-runtime.mjs:514-601`）；physical delivery 只在 close 显示 | status/doctor | 人 | S7：四域并列 |

### 状态与唯一写入者（原则，细节由 D 条目定）

- 每个对象只允许一个 current writer；新对象必须同时写明 owner、consumer、测试与删除条件（R-021）。
- 事实状态保持 `unknown`/`unavailable`/`incomplete` 时不改写为通过；诊断不是推进许可证。
- 不可逆授权边界不变：commit/merge/push/cleanup 仍需人工确认。

### 不确定性登记

| id | 不确定内容 | 为什么影响方向 | 谁解决 |
| --- | --- | --- | --- |
| U-001 | S1 未实施时是否纳入 S5/S6 | closed | T-008：移出本任务，各自延期 |
| U-002 | 本任务交付层级 | closed | T-008/D-001：S3+S4+S7 设计并实施 |
| U-003 | S4 切片检查强制力 | closed | T-003/GQ7：exit 0 advisory 三态 |
| U-004 | S3 是否做内容 hash 跳过 | closed | T-010：不做，DEFER-REUSE |
| U-005 | runtime profile 命名与 owner | closed | GQ8/D-002：与 test tier 正交，test-routing-advisor 权威 |
| U-006 | cleanup 补做表达 | closed | 不新增 correction/event；复用同 plan step records + live inspect + 唯一 completed 派生最终态，遵守 vNext 禁 historical correction |
| U-007 | 验收口径 | closed | T-006/GQ2/D-008：硬指标+合同测试+真实复跑；S3 5 次窗口 |

## 收敛检查

| 维度 | 用户答案 | 事实 | 可执行验收 |
| --- | --- | --- | --- |
| 目标 | 用户答案：设计「剩下的功能」（R-003）；R1 先选五项全覆盖，R3 采纳独立审查后将当前交付收敛为 S3+S4+S7，S5/S6 延期（T-008） | `decision-log.md:R-003`、D-001、D-010 | 场景：本任务收口；数据来源：R-003/T-008；通过：S3/S4/S7 都有 D 条目和可证伪边界；失败：任一当前项无决定或延期项无交接 |
| 范围 | 用户答案：设计与实施 S3+S4+S7；每 Phase 一个 seam 串行（T-005/T-008）；不实施 S1/S2/S5/S6；无新需求 | `decision-log.md:D-001`、D-010、R-021、R-022 | 场景：生成后续实施计划；数据来源：D-001/D-010；通过：四个串行 Phase 且不含延期项；失败：扩大当前范围或遗漏非目标 |
| 方案 | 用户答案：验收口径为硬指标+合同测试+一次真实复跑（T-006）；inner 上限**现行为跟随 main 唯一 runtime 画像权威的 60s**（2026-09-10 由 D-012 修订；T-007/T-009 原先选择的 120s 为历史事实，双指标口径不变）；取舍：先做可测量、可迁移的 S3/S4/S7，不抢跑依赖 S1 的工作；被拒方案：S5/S6 与跳过式结果复用当前实施；未决项：均已延期并有 owner/trigger/minimum/acceptance，无未决方向 | `decision-log.md:D-002`、D-003、D-004、D-005、D-010 | 场景：按四个 seam 实施；数据来源：D-002..D-010；通过：每个 seam 只有一个 authority/consumer 合同；失败：新增 gate、第二 store、双写或无 provenance 复用 |
| 验收 | 用户答案：切片检查不卡推进、超限必须解释（T-003），其余按 B-S3/B-S4/B-S7 的真实合同和复跑判定；无新需求 | `decision-log.md:B-S3-1`、B-S4-1、B-S7-1 | 场景：执行目标 seam 验证；数据来源：合同测试、性能 receipt、当前 quality facts 与 live inspect；通过：各 B 条目的 pass 条件全部成立；失败：任一 fail 条件发生或事实为 missing/stale/conflict/unavailable |

## 成功/失败边界

> 每条边界标注所属 seam 与可证伪口径（基线 / 阈值 / 观测来源 / pass-fail）。不属于本任务交付的边界不写在这里。

- 成功边界（S3 测试反馈环）：
  - **B-S3-1 inner 单文件硬上限**：基线=`tests/contract/acceptance-execution-tier.test.mjs` 单次实测 **727.90s**（F-015）；阈值=inner profile 的每个文件在同一基准机独立 5 次中**最大值 ≤60s**（2026-09-10 由 D-012 从 120s 修订为 60s，跟随 main 已实现的唯一 runtime 画像权威；120s 仅为本条历史值）；冷启动另列、不混淆；观测来源=性能 receipt（机器/Node/Vitest/缓存口径 + 5 次原始样本）；pass=所有文件达标；fail=任一文件 >60s。
  - **B-S3-2 inner 集合 p95**：基线=当前无耗时基线；阈值=同一基准机 5 个**独立进程**的 wall-clock 原始样本，运行前均清理 Vitest transform cache 但不清 OS page cache；第一轮同时标记 cold observation、仍计入统计；p95 用 nearest-rank `sorted[ceil(0.95*n)-1]`（n=5 即最大值），≤60s（2026-09-10 由 D-012 从 120s 修订为 60s；测量协议与 nearest-rank 口径不变）；profile 成员由 advisor 解析后的文件列表随 receipt 固定；观测来源=同一性能 receipt；pass=达标；fail=记录实际值，不改写成通过。
  - **B-S3-3 phase/medium 反馈**：基线=慢集合 727.90s；测量协议同 B-S3-2；阈值=包含薄真实 git/进程/端口合同的 medium/phase 集合 5 轮最大值/p95 均 ≤300s；观测来源=同上。
  - **B-S3-4 hermetic + 薄真实层**：inner 的真实 subprocess/网络/DB/文件系统调用=0；phase/CI 保留最小真实 git、argv/cwd/raw stdout/stderr、进程组取消、端口释放合同；观测来源=代码扫描 + 合同测试；pass=两层边界都满足；fail=inner 偷跑真实资源或真实边界无覆盖。
  - **B-S3-5 不做结果复用**：本任务不得根据内容闭包跳过本应执行的测试；观测来源=writer/runner 代码扫描；pass=无 skip-on-hash 生产路径；fail=出现未授权复用。
- 成功边界（S4 切片上限与预算唯一裁决点）：
  - **B-S4-1 切片检查**：基线=全仓无上限检查（F-003/F-018）；阈值=扩展既有 `validatePlanTaskContract`，复用现有字段检测三类信号：单卡 `精确文件` 去重 >10、单 Phase 涉及 >1 个 `Verify.Target`、同一文件被多个 Phase 修改；输出 `within_budget|explained_overage|unexplained_overage` 且永远 exit 0。overage 聚合规则：任一命中且缺任一 marker→`unexplained_overage`；全部命中的相关卡都有完整 marker→`explained_overage`；无命中→`within_budget`。解释必须是现有 `task risk` 中可确定解析的单行：`slice-advisory: reason="..."; impact="..."; owner="..."; recheck="..."`。原文是唯一持久事实，三态由 validator/status 现场派生，不新增 store；观测来源=validator/status 合同测试 + 本任务 `tasks.md` 自检；pass=本任务最终无 `unexplained_overage` 且该状态在 stage_quality/status 可见、exit 仍为 0；fail=未显示、自检未跑、另存第二状态或阻断推进。
  - **B-S4-2 预算唯一裁决点**：基线=正规路径以外存在 result-only/bare 调用，但两者语义不同（F-019）；阈值=`recordSimpleReviewRequest→readCanonicalBudgetHistory→validateReviewBudget` 是唯一正式 provider 派发预算 owner；删除不可达 `narrow_diff`；stage handler 只消费 owner 结果、不另算。result-only 要成为 canonical/current，必须引用既有 immutable `attempt_ref`，并逐项匹配 request_key、task/stage、material revision/id、authenticated evidence hash、provider identity 与 provider output hash；任何缺失/不匹配/stale import 只能保留为 `authoritative:false` 外部输入，不能创建 canonical result/current fact。裸 CLI 同样不得进入 current fact；观测来源=成功/缺 ref/错 material/错 provider/预算耗尽但复用命中的合同矩阵；pass=正式派发不可绕预算、合法复用不耗回合、导入不可伪造 attempt；fail=第二个正式裁决点或无 provenance 的 canonical import。
- 成功边界（S7 事实与 close 最终态）：
  - **B-S7-1 per-AC 唯一权威与唯一 writer 不被绕过**：基线（2026-09-09 立项时的旧契约快照，已被 main 合并推翻）=初始化 stub + 无生产调用的发布 writer；main 合并后事实=`quality/verify.json` 已是 per-AC 产品结果权威（`runtime/stage/completion-predicates.mjs:375-381,1119-1123`），唯一 canonical writer 是 `TaskKernel.publishVerifySummary`（`runtime/task/task-kernel-implementation.mjs:742`，兼容实现 `runtime/evidence/quality-store.mjs:238` 在 canonical root 被 `tests/contract/verify-publication.test.mjs:30-81` 拒绝），`runtime/task/task-store.mjs:250-262` 每任务初始化 stub，已登记在 `docs/architecture/control-plane-inventory.json:12`（owner=quality store、disposition=retain、删除条件=唯一 writer contract 被正式替代）。阈值=核对这条已建立的权威链不被绕过：任何生产读/写仍只经 canonical 认证（task/stage/material-scope revision/snapshot/evidence 逐项绑定、stage=verify-code、`source_digest` 与 leaf hash 校验）而非另建第二权威；不新增 writer、不新增第二 summary 权威、不出现绕过 canonical writer 的落盘路径；旧任务/旧 `quality/verify.json` bytes 只读保留、不改写。观测来源=生产反向引用扫描（`runtime core tools skills scripts config workflows package.json`）+ `tests/contract/verify-publication.test.mjs` 唯一 writer 断言 + `docs/architecture/control-plane-inventory.json` 登记一致性；pass=唯一权威与唯一 writer 均成立且无旁路；fail=出现第二个 writer/第二权威、canonical 认证步骤被放宽或绕过。
  - **B-S7-2 close plan/execution 表达**：基线=existing workspace 的满足布尔与 skipped 对象同屏易被看成矛盾。阈值=plan 只保留 close 前 quality/release 风险快照，completed 只写执行结果；公开 physical 值按矩阵唯一派生：无 plan=`not_started`；有 plan 未完成/cleanup 失败=`incomplete`；deterministic 成功=`removed`；existing workspace=`not_applicable_recorded`；读失败=`unavailable`（身份不足=`unknown`）。resume 不新增 correction/event：复用同 plan 的 immutable step records，live probe 后补齐既有 step record，最后 live inspect，全满足才写唯一 completed。任何单一公开视图不得同时输出矛盾 cleanup 布尔/对象。
  - **B-S7-3 四域与 CLI 顺序**：`status` 稳定输出 `work_progress` / `stage_quality` / `product_release` / `physical_delivery`；close 成功文本先说物理交付结果，再显示 quality/release，不把 physical completed 漂白成质量完成。观测来源=deterministic/existing/failure/resume/legacy/read-failure 合同矩阵 + 一次真实 `status→close fail/resume→status` 读回；pass=每种路径唯一可解释；fail=缺域、次序错误、矛盾字段或语义漂白。
  - **B-S7-4 producer/index/orphan 边界**：R-017 的「artifact→facts append→index current ref/hash→readback」来自旧投影设想，已被前序 F-018/D-010 的 vNext 单写模型推翻，且 task index 不再承担 current 指针；本任务不恢复该链、不新增 `ORPHAN_EVIDENCE_NOT_INDEXED` 控制面。现有 canonical writer 任一步失败必须 fail-loud/`record_failed` 且不得宣称 current；只对本任务实际改动的逐 AC/review import/close/status writer 做原子写与 readback 负向测试。
- 失败边界（全 seam 共用）：
  - 任一 seam 的实际结果未达阈值时，记录实际值并保持 `incomplete`/`unknown`，不得改写成通过。
  - 不得为达标而新增 gate、伪造事实、跳过证据或复用旧结果冒充本次结果。

## 非目标

- 不改五个 stage 的划分、顺序与职责；不新增 stage。
- 不新增 public runtime command（仅 `doctor`/`status`/`run`/`review`/`verify`/`confirm`/`authorize` 七类）。
- 不新增 gate、不把质量事实当推进许可证、不引入阻断推进的新门；切片检查永远 exit 0。
- 不新增第二 store、不双写、不建永久 compatibility bridge。
- 不改 close 的不可逆授权语义（人工确认仍是唯一授权），不把 physical delivery 解释成质量完成。
- 不实现 S1/S2/S5/S6；S1/S2 属前序任务，S5/S6 等 S1 落地后独立立项。
- 不做跳过式测试结果复用（content-closure reuse/TIA）；S3 只做 hermetic 化、分层与并行。
- 不改 broker 内部 provider 协议；不把裸 `wh-review` 纳入任务预算，也不允许其 `authoritative:false` 结果成为 current fact。
- 不新增 `consumer_seam` / `production_files` 卡片字段；复用 `精确文件`、`Verify.Target`、Phase 文件交集和 `task risk`。
- 不新增 `quality/verify.json` writer、不删除其既有权威、不把它降级为只读审计对象（D-006 修订：main 已补 writer，本任务只核对既有「唯一权威 + 唯一 writer」不被绕过）。
- 不要求「认证 make-decision 的需求来源」，也不要求宿主写身份绑定 transcript（D-011）：本宿主该投影只能如实 `unavailable`。
- 不跑无范围全量回归测试（R-022）；final/CI 的一次跨 seam 验证必须按计划明确列出消费者集合。

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-001 | 前序任务状态 | `workflowhub-execution-acceleration-20260909` 的 `specs/` 只有 `decision-log.md`；make-decision 阶段末验证 passed/completed；S1/S2/per-AC **只完成设计、未实施** | confirmed | D-001 |
| F-002 | 接缝依赖（前序登记） | S3=无依赖；S4=无依赖；S5=建议在 S1 之后；S6=依赖 S1；S7=独立 | confirmed | D-001 |
| F-003 | 切片上限现状 | 全仓无文件数/seam/卡片数上限（前序 F-013 ABSENT）；RISK-001 只有人工规则 | confirmed | D-005 |
| F-004 | 测试热点 | `tests/contract/acceptance-execution-tier.test.mjs` 单次 600–900s；含 13 次真实 `git init` + 真实 Node 子进程（8s 轮询）；`vitest.config.mjs` `maxForks:2`；`runner-clean-install` 真实 `npm --offline` | confirmed | D-004 |
| F-005 | 分层契约（前序 D-007 已钉死） | `test runtime profile` 三属性：时长上限、能力许可（网络/DB/文件系统/子进程）、运行位置（本地/CI）；`inner`=≤60s 且四项能力全禁；`medium`=≤300s 仅 localhost；`large`=仅 CI；与 `test tier`（simple\|feature\|fullstack）正交、不复用其名 | confirmed | D-002/D-003 |
| F-006 | 预算与旁路 | `validateReviewBudget` 认识 `narrow_diff` 但全仓无生产者；`review --action=record` 直带 result 与裸 `wh-review` CLI 可绕过预算；`REVIEW_RETRY_BUDGET_EXHAUSTED` 只在正规请求路径产生 | confirmed | D-006 |
| F-007 | S5 现状 | `runtime/evidence/freshness.mjs:187 authenticateCodeReviewRepairs`；`runtime/stage/stage-runner.mjs:478 codeReviewRepairResolution` 返回 clean/findings/resolved/unavailable；`resolved` 仅允许 verify-code/code_review（`runtime/evidence/quality-fact.mjs:52-55`）；`resolved` 跳过 snapshot 比对（`freshness.mjs:603`）；`finding_dispositions` 是 quality fact 而非独立文件（producer `runtime/stage/stage-handlers.mjs:3344/3439/3595/3743`） | confirmed | D-007 |
| F-008 | S6 现状 | `workflows/build-code/SKILL.md:165-232` 要求每 Phase：Phase Card → 实现前 capture RED → 聚焦 GREEN → 一次 review → 四态处置 → handoff；`findReusableReview`（`runtime/review/review-record-route.mjs:194`）与 `reusableTestCapture`（`runtime/evidence/canonical-receipt-writer.mjs:230`）已存在；无「按 consumer 去重」通用机制；`corrected-red`/`final-*` 无规范约束 | confirmed | D-008 |
| F-009 | S7 现状 | `quality/verify.json` 两个 writer：`runtime/evidence/quality-store.mjs:238 publishVerifySummary`（仓内非测试调用点 0）与 `runtime/task/task-store.mjs:241-262` 初始化 stub；consumer `runtime/stage/completion-predicates.mjs:338` 要求 `material_revision/snapshot_tree/source_digest/criteria`；`core/task-close.mjs:1708-1725` 的 `physical_state` 同时含 `worktree_cleanup` 布尔与 `cleanup.{skipped\|removed\|incomplete}`；`status`/`doctor` 不显示 physical delivery（`tools/cli/stage-runtime.mjs:514-618`）。**合并后复核（2026-09-10）**：verify 部分已被推翻——main 已补 per-AC 权威与唯一 writer（`completion-predicates.mjs:375-381,1119-1123`、`tests/contract/verify-publication.test.mjs:30-81`、`runtime/task/task-store.mjs:250-262`、`docs/architecture/control-plane-inventory.json:12`），故旧「无生产调用的发布 writer」描述不再成立；close/status 矛盾部分仍成立 | confirmed（2026-09-09 快照；合并后复核见本行末） | D-009 → D-006 修订 |
| F-010 | 既有调研的可靠性 | 前序四份 `research-report.v1` 的 `review.status` 均为 `pending`（未经 R5 独立复核）；引用它们等于引用自评置信度 | confirmed | D-010 |
| F-011 | 既有调研覆盖 | S3/S4/S6 覆盖较好（分层、hermetic 优先、文件数软上限+机器检查+强制解释、证据引用式去重、phase review 复用）；S5 仅间接；S7 零覆盖 | confirmed | D-004..D-009 |
| F-012 | 真实缺口 | G1 假 git/假子进程与真实 fixture 在缺陷检出上的等价性无证据；G2 内容闭包复用键的安全粒度无证据；G6 增量/delta 代码审查的缺陷逃逸率无直接证据 | 一次有界新调研（见下） | D-004、D-007 |
| F-013 | 契约冲突 G3 | 前序 D-007 已定 `inner ≤60s` 且 R-EXT-03 原文亦为 ≤60s，而复盘/R-016 写「inner 30–120s」；R-025 禁止与前序契约冲突 | **用户 2026-09-09 由 T-007 显式 Supersedes 为 120s；该数值已于 2026-09-10 由 D-012 修订回 60s**（现行值=跟随 main 唯一 runtime 画像权威 60s） | D-002 → D-012 |
| F-014 | 设计张力 G5 | R-EXT-02 明确「不应写死『禁止按层拆』」，而前序 RISK-001「单卡只允许一个 consumer seam」接近写死；需在设计中调和 | 设计内调和（D-005） | D-005 |
| F-015 | 本次实测（S3 基线） | 在本任务 worktree 用 `npx vitest run tests/contract/acceptance-execution-tier.test.mjs` 复跑一次，实测单次 **727.90s**（1121 行、55 test、1 fork）；最慢单测 L429=52896ms、L971=33094ms、L765-800 共 11 例各 ~14s | confirmed | D-004、D-010 |
| F-016 | 有界调研（G1/G2/G6） | 报告 `quality/evidence/research/13114d0f72db5386d98626362d75051f214f4db5c2e06c39891e6fa4a9c8fcad.json`（sha256 `13114d0f…`）：三问均只有方向性证据、无受控量化；假 git/子进程等价性、false-skip 率、delta-only 逃逸率**均无直接证据** | confirmed（`review.status=pending`） | D-004、D-007 |
| F-017 | 测试面规模 | `tests/` 247 文件、其中 `*.test.mjs` 184；全仓非归档 `*.test.mjs` 241（contract 97、根 52、integration 22、e2e 7、close 3、review 2、left-shift 1）；87 个测试文件 import `node:child_process`，64 个调用真实 git；全仓 0 个 `.concurrent`；`vitest.config.mjs` 无 `testTimeout`/`hookTimeout`；无耗时基线 | confirmed | D-004 |
| F-018 | 任务卡字段 | 卡字段为 `精确文件` + `boundary`（files/symbols/regions）+ `Phase` 块；**不存在**「生产文件清单」或「consumer seam」字段名；`tools/cli` 下无 tasks.md 卡片校验脚本；卡片校验在 `runtime/stage/stage-content-contracts.mjs`（`validatePlanTaskContract` L5337 等，消费点 `stage-handlers.mjs:3472-3483`），facts 只有 `task_count`、无阈值 | confirmed | D-005 |
| F-019 | 预算旁路与 dead kind | 生产 kind 只有 `phase`/`focused`/`initial`（`review-record-route.mjs:572-573`）；`narrow_diff` 在 `stage-content-evidence.mjs:254` 有校验分支但**全仓 0 生产者**，且 `authenticateBudgetContext`（`review-record-route.mjs:365`）只允许三种 → 该 kind 无法落盘；旁路① `review --action=record` 带 result（`stage-runtime.mjs:667-690` → `recordSimpleReviewResult`，`budgetContext=null`）；旁路② 裸 `wh-review` CLI（`skills/wh-review/scripts/wh-review-cli.mjs:988-998` → `runBareReview`，写 `~/.workflowhub/review-sink`、`authoritative:false`）；`REVIEW_RETRY_BUDGET_EXHAUSTED` 无消费者/无断言测试 | confirmed | D-006 |
| F-020 | 复用与预算交互 | `findReusableReview`（`review-record-route.mjs:194-211`）复用键 = requestKey（含 stage/track/kind/scope/subject/phase_id/route_identity/host_provider/material_id/证据 hash）+ 同源；复用返回在预算阻断之前 → 复用不消耗预算，预算耗尽时仍可返回复用结果 | confirmed | D-006 |
| F-021 | preflight 实测 | 本阶段第一次方向审查按 detail 材料形状提交，被既有 preflight 在派发前拦下：`dispatch_state=blocked_before_dispatch`、`error.code=MATERIAL_INCOMPLETE`（缺 `objective_facts`）、**provider 调用 0**、`review_budget.attempt_created=false`、counts 全 0；修复材料后重发即成功 | confirmed | D-006、B-S4-2 |
| F-024 | 本机 DSH 真实 transcript 实测（合并后） | session `da25f1a9-6a10-491a-8a8f-4f67158beea6` 的 `session.v3.jsonl.zstd` 共 95 行事件；`type=user/message` 且 `data.source.kind=user`（其余 kind：`agent-instructions`/`plugin`/`skill-catalog`）的真实用户消息 **7 条**，**7 条全部不含** `data.task_id`/`data.session_id`/`data.stage`；⇒ `runtime/evidence/host-session-transcript.mjs:24-56` 的机械选择在本宿主取不到任何需求消息（`buildHostRequirementAuthentication` 返回 `null`） | confirmed（2026-09-10 实测） | D-011 |
| F-025 | 本机宿主集成实测（合并后） | DSH Desktop 2.0.7 的 `Contents/Resources/app.asar` 中 `workflowhub` 匹配数 **0**（`grep -c` 与 `strings \| grep -ci` 均为 0）⇒ 本宿主不会为 workflowhub 写身份绑定的 user/message 字段，也没有 workflowhub 阶段集成 | confirmed（2026-09-10 实测） | D-011 |
| F-026 | merge main 后的 verify 权威实测（S7 改向依据） | `quality/verify.json` 在 main 已是 per-AC 产品结果权威：`completion-predicates.mjs:375-381,1119-1123`（认证 summary 自身 source binding 与每个 leaf/hash）；唯一 canonical writer `TaskKernel.publishVerifySummary`（`task-kernel-implementation.mjs:742`；兼容实现 `quality-store.mjs:238` 在 canonical root 抛错）；`tests/contract/verify-publication.test.mjs:30-81` 断言唯一 writer、幂等与 kernel-owned 拒绝；`runtime/task/task-store.mjs:250-262` 每任务初始化 stub；登记 `docs/architecture/control-plane-inventory.json:12` | confirmed（2026-09-10 实测） | D-006 |

### 外部调研（复用前序 R-EXT-01..04 + 一次有界新调研）

- **复用前序四份报告**（refs 见「阶段 step 结果」step 4；`review.status=pending`）：R-EXT-01（读并行写串行、上限跟独立可验证单元挂钩、2KB 预览去重）、R-EXT-02（文件数上升审查有效性下降、20+ 文件才明显、METR 时长信号、规模上限不是质量机制、不应写死禁止按层拆）、R-EXT-03（Small ≤60s 禁网络/DB/文件系统/外部系统、hermetic 消除 flaky、TIA 只能附加、flaky 随规模陡升、隔离是并行代价、可复现才可复用）、R-EXT-04（引用式优于内联、前缀字节一致才命中、约 32K 上下文腐烂）。
- **新增有界调研**（G1/G2/G6 三问，一次派发，12 次工具调用；报告 `quality/evidence/research/13114d0f72db5386d98626362d75051f214f4db5c2e06c39891e6fa4a9c8fcad.json`，sha256 `13114d0f…`，6625 bytes，`review.status=pending`）：见下「有界调研结果」。

### 有界调研结果（G1/G2/G6）

- **G1 进程内替身 vs 真实 git/子进程**：方向性证据一致——过度使用测试替身会降低对真实交互的保证度（假绿风险上升）。Fowler/Meszaros 替身分类学（强·概念）；Google《Don't Overuse Mocks》（中，无量化）；Hora & Robbes MSR'26 大样本相关性「agent 提交 36% 引入 mock，原文称 less effective at validating real interactions」（强·相关性/弱·因果）；契约测试被推荐为真实交互边界（中·实践共识）。**无直接证据**：以 fake 替换真 git/子进程导致缺陷检出率下降的受控测量。
- **G2 复用键必须覆盖什么**：Bazel 官方 action key = 输入文件 + 输出名 + 命令行 + 环境变量，并自列三类已知假命中（构建中输入被改、env 未白名单、工作区外工具未被追踪）；Nx hash 覆盖源码 + 依赖项目文件 + 工作区配置 + 外部依赖版本 + OS/CPU 架构 + CLI 参数；Turborepo 用 inputs/deferred hashing。据此，键至少须覆盖：输入闭包内容 hash（含传递依赖）、工具链/依赖版本、命令行参数、显式白名单环境变量、OS/架构、生成物、**非文件输入**（DB seed/fixture、时区/时间、网络目标）。Datadog 官方承认 TIA 默认配置可能跳过受影响测试。**无直接证据**：真实项目上的实测 false-skip 率数字。
- **G3 只审 delta 的缺陷逃逸**：McIntosh MSR'14（review coverage/participation 越低，事后缺陷越多，强）；SmartBear 200–400 LOC 上限（中）；Fregnan EMSE'22（约 90% 评审改动只涉可维护性；多数改动不由 reviewer 评论触发，强/中）。**无直接证据**：delta-only review 相对完整 change 的缺陷逃逸率（未见对比实验）。
- **本任务的处置原则**：上述三问都缺受控量化，因此 S3 的 hermetic 化必须保留一条「真实交互」薄层与契约测试，S5 的 delta 复验必须带边界条件与可回退到 full review 的规则；两者都不能声称「等价」。研究只作 Talk/决策输入，不是质量通过。

## grill

### 领域文档与接口核对（先核实，再提问）

- **术语事实**：`CONTEXT.md:70-82` 已定义 execution record、close 三义、review closure；`CONTEXT.md:117-118` 定义 Stage Agent outcome；`docs/standard-workflow.md:38-49` 的四域唯一名称是 `work_progress` / `stage_quality` / `product_release` / `physical_delivery`。仓内尚无 `test runtime profile`、`review budget`、任务切片/超限解释的领域定义。
- **术语冲突**：`docs/standard-workflow.md:346-359` 又说 close「只有一个含义」，与 `CONTEXT.md:73-79` / `CONSTITUTION.md:174-182` 的 close 三义冲突；本任务不重定义 close，只在可见输出中坚持四域分离，并登记文档修复。
- **接口核实**：S3 的真实/替身边界已核到 `tests/contract/acceptance-execution-tier.test.mjs:65-83,323-350,482-590,623-653,735-848,876-910`；S4 的切片 validator owner 已核到 `runtime/stage/stage-content-contracts.mjs:4958-4974,5337-5537`，预算派发 owner 链已核到 `runtime/review/review-record-route.mjs:428-579`；S7 四域读函数分别是 `deriveStageProgress`、`deriveStageCompletion`、`deriveCurrentProductRelease` 与 `inspectDeliveryCloseState`。
- **ADR 核对**：仓内编号 0025 已被三份并存 ADR 占用（`0025-convergence-outline-and-close-loop.md`、`0025-planning-branch-and-maintainable-prd.md`、`0025-review-dispatch-preflight-boundaries.md`，其中第三份为 Accepted 且被 `tests/contract/governance-review-dispatch-boundary.test.mjs:6` 断言），`0026-equivalent-stage-outcome-attempts.md` 已占用 0026；因此**可用编号从 0027 起**。前序 decision-log 的「待建 ADR 0025」是未落盘开放项，不能当现存约束。S3、S4、S7 三组决定均满足 ADR 三条件（难反转=true、无背景会意外=true、真实取舍=true），本任务创建 `0027-test-feedback-runtime-profile.md`、`0028-plan-slicing-and-review-budget.md`、`0029-current-ac-and-close-state.md`；编号已由用户在 2026-09-10 确认，内容边界由本阶段决定。
- **相关 ADR**：ADR 0007（phase/integration review 材料；review 非 gate、packet 不设时间/文件上限）需由 S4 显式修订；ADR 0017（质量事实新鲜度与单写）需由 S7 修订；ADR 0018 被 ADR 0020 修订，S7 的 close 表达须继续遵守「物理交付与质量分离」「existing workspace 不删除、只记录 not_applicable_recorded」。

### Grill 问答

| grill_id | 决策轴 | 用户选择 | 后果/风险处置 | source/evidence |
| --- | --- | --- | --- | --- |
| GQ1 | S3 的真实/替身边界 | **A：快层用替身，系统边界保留薄真实层** | 纯逻辑、错误矩阵、provider 回包进程内；真实 git/argv/cwd/raw stdout/stderr/进程组取消/端口释放保留最小合同集合放 phase/CI；不宣称 fake 等价 | 用户 2026-09-09 回复；F-004/F-016；代码锚点见上 |
| GQ2 | 性能样本窗口 | **A：同一基准机独立跑 5 次，冷启动单列** | 文件硬上限看 5 次最大值；集合 p95 用全部原始样本；同时报告机器信息与冷/热口径；代价是验收本身较慢 | 用户回复；B-S3-1 |
| GQ3 | 切片超限度量 | **A：复用现有字段，文件+目标+跨 Phase 三种信号** | `精确文件` 去重 >10、单 Phase 涉及 >1 个 `Verify.Target`、同一文件被多个 Phase 修改即 advisory；解释写现有 `task risk`，至少含为什么不能拆/影响/owner/下次复查条件；不新增 schema 字段 | 用户回复；F-018 |
| GQ4 | review 预算覆盖入口 | **A：只管正式任务派发；裸命令明确非正式** | `recordSimpleReviewRequest` 是唯一正式预算 owner；删除不可达 `narrow_diff`；result-only 只导入已发生结果、不消耗派发预算；裸 `wh-review` 保持 `authoritative:false` 且不得进入 current fact。风险：人工裸跑仍可花钱 | 用户回复；F-019/F-020 |
| GQ5 | `verify.json` 处置 | **A：移除生产依赖，逐 AC facts 唯一权威** | 原答复：旧 `quality/verify.json` 只读审计；新任务不再初始化/发布/读取为 product AC authority；迁移相关测试，禁止补 writer 形成双写。**2026-09-10 修订（D-006，用户确认）**：merge main 后事实反转——main 已补唯一 writer 与发布合同测试，故本任务不再做移除型诉求，改为核对既有「唯一权威 + 唯一 writer」不被绕过 | 用户回复（原）；用户 2026-09-10 修订确认；F-009/合并后复核；`tests/contract/verify-publication.test.mjs:30-81` |
| GQ6 | 无 close plan 时 physical 域 | **A：`not_started`** | 正常未进入 close 与数据不可读分开；`unknown/unavailable` 留给真实缺失或读失败 | 用户回复；四域接口核对 |
| GQ7 | advisory 切片检查输出 | **A：exit 0 + 三态结构化结果** | `within_budget` / `explained_overage` / `unexplained_overage`；未解释超限进入阶段质量缺口与 status 提醒，但不阻止同 task 修复或继续 | 用户回复；T-003 |
| GQ8 | `test runtime profile` 唯一权威 | **A：`skills/test-routing-advisor`** | spec-tasks/build-plan/build-code/CI 都引用同一可搬运契约，不复制到顶层 config 或 build-code；本组决定落盘为 ADR 0027 | 用户回复；F-005；2026-09-10 ADR 编号确认 |

### Grill 重排与结束

- 第一批 5 个独立问题回答后，剩余 frontier 从 5 项重排为 3 项：physical 未开始语义、advisory 输出三态、runtime profile owner；第二批全部回答后，high/medium 待回答项为 0。
- **四维范围裁决**：
  - 真实痛点：正面（证据；F-004/F-006/F-009）。
  - 复杂度/ROI：中性偏正（证据+主观；S3 727.90s 基线可量化，S4/S7 能复用现有 validator/readers；实际改动量待 build-plan）。
  - 风险与影响范围：有风险需限制范围（证据；跨 tests/review/close 三域，所以已按 T-008 移出 S5/S6并按 T-005 一 Phase 一 seam）。
  - 时机：正面（证据；DEFER-S3/S4/S7 的触发条件已满足）。
  - **verdict**：可以做，但必须保持 S3/S4/S7 三 seam、串行独立 Phase；任何 Phase 超限按 GQ3/GQ7 暴露。
  - 推翻条件：S4 检查发现任一 Phase `unexplained_overage`；S3 薄真实层无法在 medium≤300s 内运行；S7 发现生产存在绕过 canonical writer 的 `verify.json` 落盘路径或第二权威；任一情况回 make-decision 增量决策，不由 build-spec 猜。
  - 2026-09-10 增量：用户确认 `quality/verify.json` 的 per-AC 权威与唯一 writer 已由 main 建立，S7 的移除型诉求被修订为「核对既有权威不被绕过」（D-006）；另登记「需求来源认证是伪需求」判定（D-011）。
- **grill_summary**：`status=completed`；`direction_changing_challenges_resolved=true`；`requirement_coverage.status=complete`，五类原始消息均覆盖；`context=no-change`（本阶段尚未修改领域文件，新增术语与 close 冲突修订作为本任务实施交付）；`adr=created-not-yet`（三项判据全 true，ADR 需在本任务 build-spec/code 落盘；编号已由用户 2026-09-10 确认为 0027/0028/0029 —— 0025 有三份并存占用、0026 已占用）；`conflicts=resolved`。
- **Exit checks**：external_interfaces=`pass`；canonical_names=`pass`；failure_semantics=`pass`；scope_boundaries=`pass`。

## 审查处置

### step 6 方向审查（direction track，red/blue 各一次）

- 第一次提交：`pair_id=6eb0e09c-c54f-460f-9de6-0bb1997ed23a`，red attempt `quality/reviews/attempts/5d0bda44-b3ea-5d7f-a523-d41c32c94eb4/attempt.json`、blue attempt `quality/reviews/attempts/c48ae331-50fd-5c84-aae9-d77756ea724e/attempt.json`；两者 `terminal_status=unavailable`、`dispatch_state=blocked_before_dispatch`、`error.code=MATERIAL_INCOMPLETE`（缺 `objective_facts`）、**provider 调用数 0**。原因：调用方按 detail track 的材料形状提交（`approved_direction`/`draft_spec_or_acceptance`），而 direction track 按 `runtime/review/stage-materials.json` 只接受 `raw_requirement`+`objective_facts`。这是既有 preflight 生效的真实证据（对应 S1 的派发前拦截），也是 F-021。
- 修复后重发：`pair_id=484b1a76-5c2a-45b3-b408-81324cb74335`，`semantic_status=available`、`partial=true`、两 role 均 `coverage=satisfied`。
  - red attempt `quality/reviews/attempts/e379290b-fa0d-5ec2-a02c-cc4aa3e240db/attempt.json`；result `quality/reviews/results/make-decision-simple-e379290b-fa0d-5ec2-a02c-cc4aa3e240db.json`（12 findings）。
  - blue attempt `quality/reviews/attempts/048ebc38-1843-5fe1-a4ab-fab778037029/attempt.json`；result `quality/reviews/results/make-decision-simple-048ebc38-1843-5fe1-a4ab-fab778037029.json`（5 findings）。
  - report `quality/reviews/reports/make-decision-simple-038d05a3-b590-5e76-aa2d-c05faa8a30c6.md`。
  - provider 身份：`antigravity/flash` 与 `codex/luna`（两个 role 各收到两家）；finding 均带 `evidence_anchor_valid=true`（`provider_findings[].evidence_anchor_valid`）。
  - 预算：`review_budget.ok=true`、`counts` 全 0、`attempt_created=false`（首次 blocked 不消耗回合）。

### 方向审查争议清单（Talk R3 输入，不压缩为泛化摘要）

| 争议 | 红/蓝 finding | 争议点（原文要点） | 用户此前答复 | R3 处置 |
| --- | --- | --- | --- | --- |
| D-1 S5/S6 前置不满足 | FND-006、FND-015（均 blocking）、FND-005（major） | 「DEFER-S5/S6 的前置触发依赖 S1 落地，S1 未实施且本任务不实现 S1 本体，强行纳入会形成依赖死锁」 | T-004 选 A：五项都实施、端到端验收标注依赖 S1 | 交用户（R3 Q8） |
| D-2 五项打包过大 | FND-007、FND-016（major） | 「把 5 个跨领域延期项打包推进，违背最小可用范围，重蹈复盘『单任务范围过大』根因；应按单一维护者域拆任务，优先无前置阻塞的切片」 | T-001/T-002 选 B/C：五项全覆盖 + 本任务实施 | 交用户（R3 Q8） |
| D-3 inner 60s vs 120s | FND-001、FND-003、FND-017（blocking）、FND-014（major） | 「≤120s 与前序 `inner ≤60s` 直接冲突；若确需放宽必须显式 Supersedes + 用户确认，并补充迁移与验收测量定义」 | T-007 选 B：显式修订为 ≤120s（历史事实；**2026-09-10 已由 D-012 修订为跟随 main 的 ≤60s**） | 用户已确认修订方向；R3 Q9 定测量口径，并补 Supersedes；2026-09-10 D-012 把数值修订回 60s |
| D-4 S3 复用键与等价性 | FND-002（major）、FND-009（major） | 「hermetic 替换只有耗时关闭条件，缺缺陷检出等价证据；复用要定义覆盖全部 consumer 输入的闭包 hash、失效规则、来源链与 false-skip 验收」 | 未决（U-004） | 交用户（R3 Q10） |
| D-5 S4 拦截点 | FND-004（blocking） | 「『超限卡被拒』功能上是新准入 gate，与硬约束冲突；且当前没有生产文件清单/校验脚本/narrow_diff 生产者，result-only 与裸 CLI 还绕过预算，缺可执行的权威拦截点」 | T-003 选 A：不卡推进、必须解释 | 已在 D-005/D-006 明确；R3 只确认边界 |
| D-6 测试策略可证 | FND-008（major） | 「只跑受影响测试，但当前没有分层、consumer seam 或影响集合算法；拟改动横跨测试基建、review 路由与 close/evidence，无法证明一组针对性测试足以覆盖」 | T-006 选 A | D-004/D-008 补「变更→consumer 映射 + 分层集合」 |
| D-7 S7 关闭条件 | FND-010（major） | 「一次合同测试 + 一次 close 读回无法覆盖两个 verify.json writer、字段无稳定 writer、completed.json 矛盾、status 缺 physical delivery 的多条路径」 | T-006 选 A | D-009 扩为多路径合同测试 + 状态矩阵；2026-09-10 合并后 verify 部分改由 D-006 修订处理（唯一 writer 已成立 + 唯一 writer 合同断言） |
| D-8 前序契约来源不可核 | FND-011（major） | 「前序契约依赖路径已 redacted 的复盘文档，材料只有摘要，无法独立核验必须遵守的契约或 Supersedes 边界」 | — | 修复：decision-log 与 detail 材料显式引用前序 decision-log 路径与行号 |
| D-9 盲审无候选方向 | FND-012（blocking）、FND-013（blocking） | 「材料不含任何拟定方案或已选方向，无法判断方向是否解决问题、范围是否最小」 | — | 按合同处置：direction track 本就禁止候选方案；候选方向在 step 9 草稿、由 step 10 detail track 审查（`rejected_invalid`，附合同引用） |

### 审查处置表

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-001 | 红 F-13015acd4601 blocking：≤120s 与前序 ≤60s 冲突且无 Supersedes | 验收口径不确定 | fixed | T-007 + D-004 显式 Supersedes + 测量口径；现行阈值已于 2026-09-10 由 D-012 修订为 ≤60s；result `…e379290b….json` | make-decision / build-spec；retain |
| FND-002 | 红 F-17af2313e6f8 major：hermetic 替换只有耗时条件 | 变快但覆盖下降 | fixed | D-004：保留真实路径薄层 + 等价/回退验收 | build-code / tests；retain |
| FND-003 | 红 F-19c47e46c760 blocking：同上（重复聚类） | 同上 | fixed | 同 FND-001 | 同上；retain |
| FND-004 | 红 F-2783647eea74 blocking：切片上限是新 gate 且无权威拦截点 | 与治理冲突 | fixed | T-003 + D-005（advisory + 强制解释）+ D-006（预算唯一裁决点） | build-plan + review route；retain |
| FND-005 | 红 F-43caf6903ddd major：S5 依赖 S1 且缺 delta 逃逸证据 | 质量事实变推进许可 | needs_human | R3 Q8 + D-007 边界规则 | 用户 / runtime-review；retain |
| FND-006 | 红 F-5b2c6aeeddf3 blocking：S5/S6 依赖死锁 | 无法交付 | needs_human | R3 Q8 | 用户；retain |
| FND-007 | 红 F-609308ede352 major：五项打包过大 | 重演过大任务 | needs_human | R3 Q8 | 用户；retain |
| FND-008 | 红 F-b87f13fb0afa major：缺变更→consumer 影响映射 | 针对性测试无依据 | fixed | D-004/D-008：分层集合 + consumer 映射 | build-code；retain |
| FND-009 | 红 F-ba2993c9065a major：S6 复用可能以陈旧证据换指标 | 假绿 | fixed | D-008：复用仅限 input 未变 + false-skip 验收 | build-code；retain |
| FND-010 | 红 F-c36d3a27ae99 major：S7 关闭条件覆盖不足 | 缺陷漏检 | fixed | D-009：多路径合同测试 + 四域状态矩阵 | close/evidence；retain |
| FND-011 | 红 F-d2bf1a9f59c9 major：前序契约来源不可核 | 无法核验 Supersedes 边界 | fixed | 本文件与 detail 材料显式引用前序 decision-log 路径/行号 | make-decision；retain |
| FND-012 | 红 F-f25c6255f22d blocking：盲审无候选方向 | 无法判断方向 | rejected_invalid | direction track 合同禁止候选方案（`skills/wh-review/contracts/make-decision.md`）；候选方向在 step 9/step 10 审查 | make-decision；retain |
| FND-013 | 蓝 F-09168f76bae4 blocking：同上 | 同上 | rejected_invalid | 同 FND-012 | 同上；retain |
| FND-014 | 蓝 F-4076540c8d7a major：≤120s 静默放宽 | 验收标准不确定 | fixed | 同 FND-001；现行阈值已于 2026-09-10 由 D-012 修订为 ≤60s | 同上；retain |
| FND-015 | 蓝 F-5a5acb2a2bde blocking：S5/S6 前置不满足 | 无法交付 | needs_human | R3 Q8 | 用户；retain |
| FND-016 | 蓝 F-851b1ecc91ef major：五项打包过大 | 重演过大任务 | needs_human | R3 Q8 | 用户；retain |
| FND-017 | 蓝 F-d9d05ad35fb2 major：≤120s 与前序冲突无 Supersedes | 验收标准不确定 | fixed | 同 FND-001；现行阈值已于 2026-09-10 由 D-012 修订为 ≤60s | 同上；retain |

### step 10 细节审查（detail track，red/blue 各一次）

- pair `a15df62f-3e20-456c-8203-707a06a4eca1`，`semantic_status=available`、两 role `coverage=satisfied`、共 31 findings。
- red result `quality/reviews/results/make-decision-simple-50583c54-0d39-5e32-a899-a27651071064.json`（15）；blue result `quality/reviews/results/make-decision-simple-95b6efde-1409-5b51-a760-c4ea8745a3a2.json`（16）；combined report `quality/reviews/reports/make-decision-simple-c0e31534-674a-573e-a17f-afd29e743019.md`。
- 材料身份：`material_id=f1d12215…`、`material_revision=revision-b4326f84…`；审查前后 worktree 未漂移。以下 disposition 保留所有 finding，不以摘要覆盖来源。

| finding cluster（原 ID） | status | 实际修复/裁决 |
| --- | --- | --- |
| 目标流程缺失：F-12155b7c36c9, F-0b1d8a65d012 | fixed | 写入 10 步目标旅程，含 S4 解释交互、S3 profile/反馈、S7 status/close/fail/resume |
| R3 后残留 S5/S6：F-1bde1d96003d, F-e463eb420510, F-45db77d2b821, F-86d68cccd908 | fixed | 从当前成功边界删除；只保留 DEFER-S5/S6；候选表改最终处置 |
| verify 表述冲突：F-535d82d4121b | fixed | 数据状态统一为「per-AC 唯一权威 + 唯一 writer 不被绕过」（D-006 2026-09-10 修订；原「删除 verify.json 生产依赖」表述已被 merge main 的事实修订） |
| consumer/真实复跑未锁：F-1f25da7c6d01, F-ecc15f811340 | fixed | 新增四 seam 的变更→consumer→命令→真实复跑→receipt 矩阵；删除 OPEN-003 |
| 性能算子/测量不确定：F-6a80b6580f99, F-611a4f474e26 | fixed | 统一 `≤`；5 个独立进程、cache 口径、cold 计入、nearest-rank p95、profile 成员固定 |
| profile 权威未验：F-204a18c8683a | fixed | D-002/B-S3/矩阵锁定唯一 owner、三属性与四 consumer |
| S4 predicate/self-check 遗漏：F-7f8d05b9ff49, F-9c268d314296 | fixed | 钉死三信号、四 marker、本 tasks 自检、status 可见、exit 0 |
| S4 三态无读模型：F-fd83aafeb1a9, F-108f65e296e0 | fixed | `task risk` 原文唯一持久事实；validator/status 现场派生聚合，不新增 store |
| S4 一 Phase 两 seam：F-b0d6f66edfdc | fixed | D-001 改为四 Phase：S3/S4-slicing/S4-review-budget/S7 |
| close 矩阵不足：F-882644cc1977, F-c18fd0dc69e3 | fixed | B-S7 加 no-plan/planned/removed/existing/failure/resume/legacy/read-failure 与互斥公开值 |
| R-017/R-018 遗漏：F-ab9c1ef18f31, F-9df64feb10cc | fixed with prior-contract correction | 纳入四域、CLI 顺序、实际 writer fail-loud/readback；旧 index-current/orphan 被前序 vNext 决定推翻；独立 correction 与 vNext 禁令冲突，改用既有 step records+live inspect |
| replacement 合同：F-b38298c93096（blocking） | fixed | 补现有逐 AC producer、字段/认证/current/conflict/legacy 迁移矩阵；2026-09-10 合并后修订为核对 TaskKernel 唯一 writer 与 per-AC 唯一权威边界（唯一 writer 合同断言 + 生产反向扫描），不新增第二权威 |
| “无逐 AC producer”：F-dd926b51507f（blocking） | rejected_invalid | 生产链已在 `stage-runner.mjs:1427-1499,2003-2031`，测试在 `status-derivation.test.mjs:400-469,530-635`；问题仅是迁移合同未写全，已按上一项修 |
| result-only provenance：F-06e71662e6d0, F-fa2efb0920b9 | fixed | canonical import 必须绑定既有 attempt/request/material/evidence/provider-output hashes；否则 non-authoritative |
| ADR/文档交付：F-398de11c0004, F-533ec609cb83, F-9d7755fa1c3e, F-ef589bc035ed | fixed | 核实 ADR 0019 与 verify 无冲突并移出 Supersedes；D-009 纳入 scope/AC；2026-09-10 复核：0025 已有三份并存占用、0026 已占用，故新 ADR 编号确定为 0027/0028/0029（不再表示「下一可用编号」） |
| 错号/R-019 遗漏：F-3b29d5e0bdda, F-9474a7e032c8 | fixed | 旧 D-011/012 引用改 D-001..010；R-019 逐项分流到 S3/S4/S7 或 S2/S6 延期 |

- `needs_human=[]`：31 条均不要求新方向选择；因此**不触发第 4 轮 Talk**。两条 blocking 已分别 fixed / rejected_invalid，不声称审查为空或 pass。

## 三轮 talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001（R1 覆盖范围） | 本次设计覆盖哪几项：A 五项全覆盖但 S5/S6 只到契约层 / B 五项全覆盖且 S5/S6 写具体做法 / C 只做 S3+S4+S7 | 见提问卡：B 的风险是 S1 未实现时细节易返工、材料变长 | 用户选择：**B（五项全覆盖，S5/S6 也写具体做法）** | 本阶段范围锁定 S3–S7 五项；S5/S6 必须给出具体做法，不得只写「待 S1 后细化」 | 用户 2026-09-09 回复 |
| T-002（R1 交付边界） | 本任务线交付到哪一步：A 只出决策 / B 设计+最小一项实施 / C 设计+全部五项实施 | 见提问卡：C 的风险是重演「单任务过大」 | 用户选择：**C（设计 + 本任务内实施全部五项）** | 本任务交付边界 = 决策 + S3–S7 五项实施；实施必须按 seam 分 phase，并让 S4 的切片检查先作用于本任务自身（详见 R2 待定项） | 用户 2026-09-09 回复 |
| T-003（R1 S4 强制力） | 切片上限多硬：A 机器检查+超限必须解释、不卡推进 / B 硬拒绝超限卡 / C 只记录不解释 | 见提问卡：A 的风险是「没人看就溜过去」；B 与「不新增 gate」冲突 | 用户选择：**A（机器检查 + 超限必须写拆不动的原因，不卡推进）** | S4 的切片检查 = 事实诊断 + 强制解释字段，不新增 gate；前序登记的 close 条件「超限卡被拒」被本次修订为「超限必须解释且可见」，需在 D 条目中显式 `Supersedes` | 用户 2026-09-09 回复 |
| T-004（R2 S1 依赖） | S1/S2 未实施时 S5/S6 怎么实施与验收：A 五项都实施、S5/S6 端到端验收标注依赖 S1 / B S5/S6 只做设计与骨架 / C 本任务顺手实现 S1/S2 | 见提问卡：A 的风险是「验收待补」可能被忘；C 会变 7 seam 大任务 | 用户选择：**A（五项都实施，S5/S6 端到端验收标注依赖 S1）** | S5/S6 的代码在本任务实施；其端到端验收事实必须标注「依赖 S1 未落地」，缺真实 review 复跑时保持 incomplete，不写成通过 | 用户 2026-09-09 回复 |
| T-005（R2 本任务切片） | 本任务自己 5 个 seam 怎么切：A 一 phase 一 seam 串行 + S4 检查先作用于自身 / B 按依赖分两批 / C 按文件耦合分组 | 见提问卡：B/C 会让一个 phase 同时碰多个 seam 的验收口径 | 用户选择：**A（一个 phase 一个 seam，串行）** | 实施切分锁定：每 phase 一个 seam、独立 RED/GREEN/证据/review；本任务 tasks.md 必须先通过 S4 切片检查（自证） | 用户 2026-09-09 回复 |
| T-006（R2 验收口径） | 怎么算做成了：A 硬指标+合同测试+一次真实复跑 / B 只做合同测试+耗时 / C 只出诊断画像 | 见提问卡：B 有「合同测试全绿但真实任务失败」的历史 | 用户选择：**A（硬指标 + 合同测试 + 一次真实复跑）** | 每个 seam 的验收 = 基线/阈值/观测来源/pass-fail + 针对性合同测试 + 一次真实复跑；n=1 只称达标/未达标 | 用户 2026-09-09 回复 |
| T-007（R2 内环上限冲突） | inner 上限按哪个数：A 沿用前序 `inner ≤60s` / B 显式修订为 ≤120s / C 双轨 60s+限时 120s | 见提问卡：B 属改前序契约，需显式修订文档/ADR，且与外部调研 60s 结论相反 | 用户选择：**B（显式修订为 `inner ≤120s`）**——2026-09-09 的真实历史回复，不改写；**该数值已于 2026-09-10 由 D-012 修订为跟随 main 的 `inner ≤60s`** | 本任务必须写 `Supersedes` 修订前序 D-007 的 `inner ≤60s`，并同步文档/ADR；能力许可（网络/DB/文件系统/子进程全禁）保持不变；风险如实登记。2026-09-10 更新：`Supersedes` 仍成立但数值改为 60s（D-012），能力许可与双指标不变 | 用户 2026-09-09 回复；2026-09-10 D-012 修订 |
| T-008（R3 审查争议：S5/S6 与打包） | 审查两路均主张 S5/S6 移出 + 按维护者域拆任务：A 采纳 / B 折中（S5/S6 只出契约）/ C 维持五项都实施 | 见提问卡：A 符合审查与复盘教训，代价是分次交付 | 用户选择：**A（采纳审查，S5/S6 移出本任务，只做 S3+S4+S7）** | **本任务交付边界改为 S3+S4+S7（设计 + 实施）**；S5/S6 只在本任务留下契约骨架与延期登记，实施等 S1 落地后各自独立立项 | 用户 2026-09-09 回复；FND-005/006/007/015/016 |
| T-009（R3 inner 测量口径） | ≤120s 量什么：A 文件级硬上限 + 集合级 p95 都测 / B 只看集合 p95 / C 只看单文件上限 | 见提问卡：A 最严、需两个指标 | 用户选择：**A（文件级硬上限 + 集合级 p95 都测）**（测量口径仍现行有效；当时的 120s 数值已由 D-012 于 2026-09-10 修订为 60s） | B-S3-1 拆成两条：单文件硬上限；`inner` 集合 p95；两条都要实测。现行阈值由 D-012 定为 60s（原 120s） | 用户 2026-09-09 回复；2026-09-10 D-012 修订数值；FND-001/003/014/017 |
| T-010（R3 测试结果复用） | S3 的跳过式复用做不做：A 不做，只做 hermetic+分层+并行 / B 只对 final 层 / C 全部层 | 见提问卡：C 收益大但无漏检率证据、审查已点名 | 用户选择：**A（不做跳过式复用）** | S3 范围收窄为 hermetic 化 + 分层路由 + 并行度；跳过式结果复用登记为延期（DEFER-REUSE，带研究给出的键清单与 false-skip 验收要求） | 用户 2026-09-09 回复；FND-009 |

## S3–S7 最终处置表

| seam | 内容 | 依赖 | 触发（前序登记） | 本任务候选处置 |
| --- | --- | --- | --- | --- |
| S3 | 测试反馈环：hermetic fixture、薄真实合同层、runtime profile、文件并行与 5 次性能测量；**不含结果复用** | 依赖前序 D-007 分层契约并显式修订 inner 上限 | 画像 + 分层契约已落地 | **本任务设计+实施（Phase S3）** |
| S4 | 任务切片 advisory 检查（三信号/三态/超限解释）+ review 预算唯一正式派发 owner | 两者 owner/consumer 不同，必须拆开 | 当前任务 build-plan/review 需要 | **本任务设计+实施（Phase S4-slicing + Phase S4-review-budget）** |
| S5 | 一等 repair delta 与 `resolved` 链 | S1 落地并产出可靠语义 review | S1 产出可靠语义 review 后 | **延期独立任务** |
| S6 | Phase 循环瘦身与 RED/GREEN 证据卫生 | S1 完成；可消费 S5 repair 链 | S1 完成后 | **延期独立任务** |
| S7 | 核对 per-AC 产品结果权威与唯一 writer 不被绕过（main 已建立）；close plan/execution 表达；status 四域并列 | 独立 | 下一次 close/verify consumer 将触发 | **本任务设计+实施（Phase S7）**；2026-09-10 修订：原「移除 verify.json 生产依赖」诉求已解，见 D-006 |

### 延期条目 → 处置（覆盖矩阵，逐条，不静默丢弃）

| 条目 | 来源 | 本任务处置 |
| --- | --- | --- |
| DEFER-S3 | 复盘 L639 | 当前实施：D-002/D-003 |
| DEFER-S4 | 复盘 L640 | 当前实施，拆成 S4-slicing 与 S4-review-budget：D-004/D-005 |
| DEFER-S5 | 复盘 L641 | 延期独立任务：D-010/DEFER-S5 |
| DEFER-S6 | 复盘 L642 | 延期独立任务：D-010/DEFER-S6 |
| DEFER-S7 | 复盘 L643 | 当前实施：D-006/D-007 |
| 复盘优化方案 3（repair delta） | 复盘 L448-464 | → S5 |
| 复盘优化方案 4（任务切分规则） | 复盘 L466-480 | → S4 |
| 复盘优化方案 5（测试分钟级反馈） | 复盘 L482-499 | → S3 |
| 复盘优化方案 6（current fact 写入与 close 读模型） | 复盘 L501-519 | → S7；其中「`verify.json` 声明/ writer 不一致」已由 merge main 补 writer 解决（见 D-006 修订），本任务只保留「既有权威与唯一 writer 不被绕过」核对 |
| 复盘优化方案 8（close 最终态表达） | 复盘 L544-549 | → S7 |
| 复盘运营指标 | 复盘 L582-596 | → 本任务验收口径（U-007） |
| 复盘实施顺序 | 复盘 L598-606 | → 本任务排期依据（D-001 候选） |
| 前序 RISK-001 人工拦截规则 | 前序 decision-log | → S4 输入 |
| 前序 F-021 `REVIEW_SOURCE_DRIFT` | 复盘 L650 + 前序 decision-log | → S5/S6 设计约束（不重复造 S1 已解耦的部分） |
| 前序 F-018 `verify.json` 缺陷 | 前序 decision-log | → 已由 merge main 补唯一 writer 解决；本任务只做「既有权威与唯一 writer 不被绕过」核对（D-006 修订） |
| 需求来源认证（make-decision） | 本任务 2026-09-10 用户确认 + 合并后实测 | → 判定为伪需求；延期/交接登记 DEFER-REQ-AUTH（D-011） |
| 前序「同 run 同快照 >1 completed outcome 判 conflict」 | 前序 decision-log | → S6/S7 设计约束 |

## 决定

> 以下每条均使用 `decision-entry.v1` 文本字段。`module` / `requirement_ids` / `derived_from` / `artifacts` 只记录因果链，不新增 runtime schema 或 gate。

### D-001 当前交付收敛为 S3 + S4 + S7

- question/final_option: 本任务交付什么？→ S3/S4/S7 设计并实施；S5/S6/结果复用延期；一个 Phase 一个 seam。
- recommendation/plain_language: 只做三条没有前置死锁、能独立验收的线，别再打成大包。
- decision: 实施采用四个串行 Phase：S3、S4-slicing、S4-review-budget、S7；各自 RED/GREEN、证据与 review；S4-slicing 检查本任务自身。
- source_type/reference/exact_excerpt: 用户 T-008「S5/S6 移出本任务，只做 S3+S4+S7」；T-005「一个 phase 一个 seam，串行」；T-010「不做跳过式复用」。
- approval_binding: accepted（用户 Step 11 实际批准；后续仅允许不改变方向的机械收口修复）。（待 step 11 最终确认）。
- facts_and_constraints: F-002 依赖；FND-005/006/007/015/016 一致指出 S5/S6 前置死锁与五项打包风险。
- Logic: 无前置的三 seam 先交付 → 依赖 S1 的 seam 后移 → 避免重演过大任务。
- choice_reason/impact: 消除依赖死锁并缩小实现/审查面；影响 tests、build-plan/review route、close/status 三域。
- consequences_and_risks: 分次交付；S5/S6 收益延后，必须保留可执行延期登记。
- rejected_alternatives: 五项同包；S5/S6 只在本任务做骨架；本任务连 S1/S2 一起实施。
- unresolved_items/owner: 精确文件切片由 build-plan 负责，但不得改变三 seam 边界。
- Supersedes: 修订本任务早期 T-001/T-002/T-004 的五项同包选择；不改写历史回复。
- module: scope
- requirement_ids: [R-003, R-009, R-010, R-013, R-020, R-025]
- derived_from: []
- artifacts: [spec.md#scope, plan.md#phases, tasks.md]

### D-002 S3 的 test runtime profile 权威与 inner 上限

- question/final_option: profile 谁权威、inner 多快？→ `skills/test-routing-advisor` 唯一权威；单文件硬上限和集合 p95 都 ≤60s。**2026-09-10 由 D-012 修订**：本条原定 ≤120s，现行为 ≤60s（跟随 main 唯一 runtime 画像权威）。
- recommendation/plain_language: 一处定义、各处引用；60 秒用两把尺都测（原写「120 秒」，数值已由 D-012 修订，双指标不变）。
- decision: profile 三属性为时长上限、能力许可、运行位置；inner 仍禁网络/DB/文件系统/子进程；spec-tasks/build-plan/build-code/CI 不复制契约。**现行时长上限：`inner ≤60s`、`medium ≤300s`（D-012，2026-09-10 修订；本条原值 120s 不再有效）。**
- source_type/reference/exact_excerpt: GQ8「test-routing-advisor 唯一权威」；T-007「显式修订为 inner ≤120s」（2026-09-09 历史选择，数值已由 D-012 修订为 `inner ≤60s`）；T-009「文件级硬上限 + 集合级 p95 都测」（口径不变）。
- approval_binding: accepted（用户 Step 11 实际批准；后续仅允许不改变方向的机械收口修复）。**2026-09-10 数值修订由 D-012 承接，不改变本条方向。**
- facts_and_constraints: F-005 前序 profile；F-013 的 60/120 冲突；仓内当前无 runtime profile 实现。2026-09-10 补充：main 已把 60s 落成唯一 runtime 画像契约（`runtime/stage/stage-content-contracts.mjs:59`），故 120s 不再是可跟随的唯一权威值。
- Logic: 单一权威防漂移 + 显式修订解冲突 → 可稳定路由与验收；2026-09-10 起「单一权威」同时意味着单一数值（60s），不再保留第二份 120s。
- choice_reason/impact: 原为「用户接受放宽阈值以匹配现实内环，同时保留资源禁用保证」；**该放宽已于 2026-09-10 由 D-012 撤回**（用户选择跟随 main 的 60s），资源禁用与双指标保证不变。
- consequences_and_risks: 原登记「相对前序 60s 反馈更慢；外部调研支持 60s 而非 120s」的风险已由 D-012 移除（2026-09-10 数值回归 60s）；本条保留该历史风险登记，现行风险见 RISK-001。
- rejected_alternatives: 2026-09-09 当时被拒的「保持 ≤60s」已由 D-012 于 2026-09-10 采纳为现行方向；仍被拒的是 60/120 双轨过渡与把契约复制到 build-code 或顶层 config。
- unresolved_items/owner: 无方向未决；字段与引用位置由 build-spec 细化。
- Supersedes: **原文本为「精确修订前序任务 `workflowhub-execution-acceleration-20260909` D-007 的 `inner=≤60s` 为 `inner=≤120s`；能力许可与运行位置不变」。该数值修订已于 2026-09-10 被 D-012 再次修订为 `inner=≤60s`（跟随 main 已落地的唯一 runtime 画像契约 `TEST_RUNTIME_PROFILE_LIMITS_MS.inner = 60_000`），因此本条现行效力仅为：profile 唯一权威=`skills/test-routing-advisor`、能力许可（禁网络/DB/文件系统/子进程）、运行位置与双指标（单文件 5 次最大值 + 集合 nearest-rank p95）保持不变；≤120s 不再作为现行要求。**
- module: S3/test-routing
- requirement_ids: [R-009, R-016, R-019, R-025]
- derived_from: [D-001]
- artifacts: [skills/test-routing-advisor/SKILL.md, docs/adr/0027-test-feedback-runtime-profile.md, spec.md#test-runtime-profile]

### D-003 S3 用 hermetic 快层 + 薄真实合同层

- question/final_option: 怎样加速且不假称替身等价？→ 快层 hermetic，系统边界留薄真实层；同机独立 5 次、冷启动单列。
- recommendation/plain_language: 大头用替身提速，git/进程真交互留最小验真。
- decision: inner 的真实外部调用为 0；phase/CI 覆盖真实 git/workspace、argv/cwd/raw stdout/stderr、非零/坏输出、进程组取消与端口释放；记录机器/Node/Vitest/缓存口径、5 次原始值、最大值与 p95。
- source_type/reference/exact_excerpt: GQ1「快层用替身，系统边界保留薄真实层」；GQ2「同一基准机独立跑 5 次，冷启动单列」。
- approval_binding: accepted（用户 Step 11 实际批准；后续仅允许不改变方向的机械收口修复）。。
- facts_and_constraints: F-015 基线 727.90s；F-016 无 fake 等价量化；F-017 测试面大且 87 文件用 child_process。
- Logic: 隔离换速度 + 薄真实层守交互风险 → 既可分钟级反馈又不漂白覆盖。
- choice_reason/impact: 对当前慢文件直接可验证；改 tests、fixture 与 vitest 路由，不做 TIA。
- consequences_and_risks: fake 仍可能漏真实缺陷；只能称两层分别达标，不能称等价。
- rejected_alternatives: 全部真实；全部 fake；按内容 hash 跳过测试。
- unresolved_items/owner: 最小真实用例清单由 S3 Phase owner 按已核代码锚点实现。
- Supersedes: none
- module: S3/tests
- requirement_ids: [R-009, R-016, R-019, R-022]
- derived_from: [D-002]
- artifacts: [tests/contract/acceptance-execution-tier.test.mjs, test-fixtures, quality/tests/performance-profile]

### D-004 S4 用现有字段做 advisory 切片检查

- question/final_option: 超限如何处理？→ 复用现有字段检测三类信号，exit 0 输出三态。
- recommendation/plain_language: 照亮坏切片但不设新门；超限必须把拆不动原因写清。
- decision: 扩展现有 `validatePlanTaskContract`：单卡 `精确文件` 去重 >10、单 Phase >1 个 `Verify.Target`、同一文件被多个 Phase 修改即 overage；输出 `within_budget|explained_overage|unexplained_overage`；解释写现有 `task risk`，至少含为什么不能拆/影响/owner/下次复查条件；未解释 overage 进入质量缺口/status 提醒但不卡推进。
- source_type/reference/exact_excerpt: T-003「机器检查 + 超限必须写拆不动的原因，不卡推进」；GQ3「复用现有字段」；GQ7「exit 0 + 三态结构化结果」。
- approval_binding: accepted（用户 Step 11 实际批准；后续仅允许不改变方向的机械收口修复）。。
- facts_and_constraints: F-003/F-018 无上限与 checker；现有 validator 已由 build-plan consumer 调用；不新增 gate/schema 字段。
- Logic: 现有 validator + 结构化 advisory → 暴露过大任务且不成为许可证。
- choice_reason/impact: 最小改造并可先自检本任务 tasks.md。
- consequences_and_risks: 提醒可能被忽略；依赖 `Verify.Target` 与 `task risk` 如实填写。
- rejected_alternatives: 硬拒绝；只打印文字；新增 `consumer_seam`/`production_files` 字段。
- unresolved_items/owner: 无方向未决。
- Supersedes: **精确修订前序 D-010/DEFER-S4 的「超限卡被拒」为 advisory 三态；超限必须解释且可见，但不阻止推进。**
- module: S4/build-plan
- requirement_ids: [R-010, R-015, R-021, R-026]
- derived_from: [D-001]
- artifacts: [runtime/stage/stage-content-contracts.mjs, spec.md#slice-advisory, tasks.md, docs/adr/0028-plan-slicing-and-review-budget.md]

### D-005 S4 预算只在正式 review 派发点裁决

- question/final_option: 谁裁决正式预算？→ `recordSimpleReviewRequest` 链是唯一正式 owner；删除不可达 `narrow_diff`。
- recommendation/plain_language: 正式派发只走一扇门；导入结果和个人裸跑不冒充正式事实。
- decision: 所有正式 provider 派发经过 `readCanonicalBudgetHistory→validateReviewBudget`；stage handler 只消费该结果、不重算；合法 result-only import 不耗派发预算，但要成为 canonical/current 必须绑定并复验既有 immutable attempt 的 request/material/evidence/provider-output provenance，缺失/不匹配只能 `authoritative:false`；裸 `wh-review` 同样禁止成为 current fact；已有 review 复用不耗回合；删除 validator/context 中不可达的 `narrow_diff`。
- source_type/reference/exact_excerpt: GQ4「只管正式任务派发；裸命令明确非正式」。
- approval_binding: accepted（用户 Step 11 实际批准；后续仅允许不改变方向的机械收口修复）。。
- facts_and_constraints: F-006/F-019/F-020；F-021 证明 preflight 可零 provider 拦截且不耗预算。
- Logic: 统一正式创建点计回合 + 非正式入口明确降格 → 单一裁决、无伪旁路。
- choice_reason/impact: 关闭正式预算绕行，保留技能便携与诊断能力。
- consequences_and_risks: 人工裸跑仍可能花钱，但不能污染任务事实。
- rejected_alternatives: 补 `narrow_diff` 生产者；result-only/裸 CLI 都算正式任务预算；另建本机预算。
- unresolved_items/owner: 无方向未决。
- Supersedes: none
- module: S4/runtime-review
- requirement_ids: [R-010, R-021]
- derived_from: [D-004]
- artifacts: [runtime/review/review-record-route.mjs, runtime/evidence/stage-content-evidence.mjs, review budget contract tests, docs/adr/0028-plan-slicing-and-review-budget.md]

### D-006 S7 核对 per-AC 唯一权威与唯一 writer 不被绕过

- question/final_option: `quality/verify.json` 与 per-AC 权威怎么处理？→ 保留 main 已建立的单一权威与唯一 writer，本任务只核对它不被绕过。
- recommendation/plain_language: 这份权威 main 已经建好了、也只有一个写入者；我们要做的是看住它，别让任何人另开后门写第二份或绕过认证。
- decision: `quality/verify.json` 是 main 已建立的 per-AC 产品结果权威，唯一 canonical writer 是 `TaskKernel.publishVerifySummary`；本任务不新增 writer、不新增第二小结权威、不删除既有权威、不改写历史 bytes；被核对项=（a）`completion-predicates.mjs` 的 summary 认证步骤（task/stage/material-scope revision/snapshot/`source_digest`/leaf hash 逐项绑定，`evidence_ref === "quality/verify.json"` 自指被拒）不被放宽或绕过；（b）无 canonical writer 之外的落盘路径（仓内非测试调用点为 0，canonical root 被 writer 合同测试拒绝）；（c）`docs/architecture/control-plane-inventory.json:12` 的登记（owner=quality store、disposition=retain、删除条件=唯一 writer contract 被正式替代）与实际一致。核对方式=生产反向引用扫描 + `tests/contract/verify-publication.test.mjs` 合同断言；本阶段不跑实现测试，只把该检查写成 S7 Phase 的验收口径（B-S7-1）。
- source_type/reference/exact_excerpt: 用户 2026-09-10 确认（S7 改向）；main 事实 `completion-predicates.mjs:375-381,1119-1123`、`tests/contract/verify-publication.test.mjs:30-81`、`runtime/task/task-store.mjs:250-262`、`docs/architecture/control-plane-inventory.json:12`。
- approval_binding: accepted（用户 2026-09-10 方向修订确认；保留用户 Step 11 的原批准事实，修订后语义以本条为准）。
- facts_and_constraints: F-009（2026-09-09 旧快照）+ 合并后复核（2026-09-10）：旧「无生产调用的发布 writer / 双 writer」已不成立，merge main 已补唯一 writer 与发布合同测试；父任务原延期原文为「verify.json 权威声明与 writer 对齐…对齐声明或补 writer」（`specs/archive/workflowhub-execution-acceleration-20260909/decision-log.md:184`），main 已补 writer → 该延期项已解。
- Logic: 事实反转 → 维持现有唯一权威而非推倒它 → 本任务只做「不被绕过」的核对，避免把已解问题重做成新的移除型控制面。
- choice_reason/impact: 尊重 main 已合入的事实与既有合同测试；影响面从「迁移 consumer、删除读写路径」缩小为「扫描并核对边界」。
- consequences_and_risks: 若确有一条被绕过的落盘路径，`completion-predicates` 的认证步骤就形同虚设；反向扫描必须给出逐条分类（current vs audit_only vs test_only）。
- rejected_alternatives: 保留旧方向（移除生产依赖/不补 writer；与 main 已成立的事实和唯一 writer 合同测试直接冲突，故被本条修订）；另建第二个 summary 权威或平行 writer；改写历史 `quality/verify.json` bytes。
- unresolved_items/owner: 无方向未决；扫描清单与命中分类由 S7 Phase owner 证据化。
- Supersedes: **修订本任务早期 GQ5「移除生产依赖，逐 AC facts 唯一权威」与 D-006 原文的移除型诉求**（理由：merge main 后事实反转）；同时**解除父任务 DEFER-S7 的「对齐 `verify.json` 权威声明与 writer 或补 writer」延期项**（main 已补 writer，延期条件已满足）；ADR 0017 与 ADR 0019 的既有分工不受本条改写，继续有效。
- module: S7/verify-publication
- requirement_ids: [R-013, R-017, R-021]
- derived_from: [D-001]
- artifacts: [runtime/stage/completion-predicates.mjs, tests/contract/verify-publication.test.mjs, runtime/task/task-store.mjs, docs/architecture/control-plane-inventory.json, docs/adr/0029-current-ac-and-close-state.md]

### D-007 S7 分开 close 预测/执行并在 status 显示四域

- question/final_option: close 与未开始如何表达？→ plan 保存收口前快照，completed 只写执行结果；status 四域并列；无 plan 时 physical=`not_started`。
- recommendation/plain_language: 计划是计划、结果是结果；没开始不等于数据坏了。
- decision: `status` 稳定输出 `work_progress/stage_quality/product_release/physical_delivery`；physical 矩阵按 B-S7-2；cleanup 补做复用同一 plan 的 immutable step records + live probe/inspect，**不新增 correction/event/historical recovery 对象**；existing workspace 仍不删除；CLI 成功文案先物理结果、后质量/发布。
- source_type/reference/exact_excerpt: GQ6「not_started」；GQ5 的单写选择；F-009 的 close/status 事实。
- approval_binding: accepted（用户 Step 11 实际批准；后续仅允许不改变方向的机械收口修复）。。
- facts_and_constraints: ADR 0018/0020 要求 close 物理事实与质量分离；四域读函数已存在，CLI 只缺 physical 聚合。
- Logic: 分离 prediction/execution + 四域同屏 → 消除表面矛盾且不漂白质量。
- choice_reason/impact: 人能读出实际交付、阶段质量与发布状态，复用现有 readers。
- consequences_and_risks: 旧 completed 记录需只读兼容派生；字段迁移不可改写历史。
- rejected_alternatives: 同字段混写；无 plan=`unknown|unavailable`；补第二状态机。
- unresolved_items/owner: 无方向未决。
- Supersedes: 修订 ADR 0017 中冲突 reader 语义（经 ADR 0029 精确落盘）；遵守 ADR 0018/0020，不改变 close 授权与 existing workspace 清理规则；2026-09-10 修订：与 D-006 一致，只做四域核对与 plan/execution 分离，不触碰唯一 writer 边界。
- module: S7/close-status
- requirement_ids: [R-013, R-017, R-018, R-021]
- derived_from: [D-006]
- artifacts: [core/task-close.mjs, tools/cli/stage-runtime.mjs, close/status contract tests]

### D-008 验收是硬指标 + 针对性合同测试 + 真实复跑

- question/final_option: 怎样算完成？→ 每 seam 的基线/阈值/观测/pass-fail + 合同测试 + 一次真实复跑；S3 另做 5 次性能窗口。
- recommendation/plain_language: 既看契约也看真实运行；没达标就如实失败。
- decision: 采用本文件 B-S3/B-S4/B-S7；S3 文件 max 与集合 p95≤60s（2026-09-10 由 D-012 从 120s 修订为 60s；测量协议与双指标不变）、phase≤300s；S4 验三态与所有正式派发入口；S7 验 consumer 迁移、多 close 路径、四域矩阵；n=1 只称达到/未达到阈值。
- source_type/reference/exact_excerpt: T-006「硬指标 + 合同测试 + 一次真实复跑」；GQ2 的五次测量。
- approval_binding: accepted（用户 Step 11 实际批准；后续仅允许不改变方向的机械收口修复）。。
- facts_and_constraints: R-019/R-022；FND-008/010 要求 consumer 映射与多路径覆盖。
- Logic: 量化性能 + 合同锁语义 + 实跑防纸面通过。
- choice_reason/impact: 可证伪且不冒充统计结论。
- consequences_and_risks: 验收耗时；未达阈值保持 `incomplete/unknown`，不会挡同 task 修复。
- rejected_alternatives: 只合同测试；只画像；无范围全量回归。
- unresolved_items/owner: 真实复跑对象由 build-plan 选首个 ≤10 文件、单 seam fixture 或当前任务真实路径。
- Supersedes: none
- module: acceptance
- requirement_ids: [R-019, R-021, R-022]
- derived_from: [D-002, D-003, D-004, D-005, D-006, D-007]
- artifacts: [spec.md#acceptance, quality/tests, quality/evidence]

### D-009 S3/S4/S7 需要 ADR 与术语修订（编号已定为 0027/0028/0029）

- question/final_option: 哪些文档落盘？→ 为 S3/S4/S7 的不可逆取舍创建 ADR，并补 CONTEXT/standard-workflow 术语冲突。
- recommendation/plain_language: 难反转的取舍写 ADR，统一词义写 CONTEXT；已被占用的 ADR 编号不能复用。
- decision: 登记 profile 权威与 inner 上限（2026-09-09 原登记为 120s 修订，**2026-09-10 由 D-012 修订为跟随 main 的 60s**）、advisory/预算 owner、per-AC 权威/唯一 writer/四域；修正 standard-workflow「close 一个含义」与宪法/CONTEXT 三义冲突；ADR 0025/0026 已被占用，不能作为现有输入，新 ADR 为 0027/0028/0029。
- source_type/reference/exact_excerpt: Grill 核对：三组 ADR 判据全 true；仓内 0025 三份并存、0026 已占用；用户 2026-09-10 确认新编号。
- approval_binding: accepted（用户 Step 11 实际批准；后续仅允许不改变方向的机械收口修复）。。
- facts_and_constraints: ADR 0007/0017 有冲突处需修订；ADR 0018/0020 必须遵守。
- Logic: 持久语义写入唯一领域文档 → 后续实现和消费者不再猜。
- choice_reason/impact: 防止同一概念多套定义。
- consequences_and_risks: 文档修订面增加；必须精确写冲突条款而非泛化 supersede。
- rejected_alternatives: 不建 ADR；沿用不存在的编号「ADR 0025」（当时的下一可用号，后被 main 的两组 0025/0026 占用，2026-09-10 复核后改为 0027/0028/0029）；复制规则到多个文件。
- unresolved_items/owner: 无方向未决；编号已由用户 2026-09-10 确认落盘为 0027/0028/0029（原先「由 build-spec 定编号」的机械性开放项就此关闭）。
- Supersedes: 新 ADR 将精确修订 ADR 0007/0017 的冲突条款；不替代 ADR 0018/0020；不触碰已 Accepted 的 `0025-review-dispatch-preflight-boundaries.md`。
- module: docs/governance
- requirement_ids: [R-021, R-025]
- derived_from: [D-002, D-004, D-005, D-006, D-007]
- artifacts: [CONTEXT.md, docs/standard-workflow.md, docs/adr/0027-test-feedback-runtime-profile.md, docs/adr/0028-plan-slicing-and-review-budget.md, docs/adr/0029-current-ac-and-close-state.md]

### D-010 S5/S6/跳过式结果复用分别延期

- question/final_option: 延期什么、何时重启？→ 三项各自登记 owner/trigger/minimum deliverable/acceptance evidence。
- recommendation/plain_language: 依赖没到或证据不足就单独立项，别塞进当前三 seam。
- decision: 见「风险与延期交接」的 DEFER-S5/DEFER-S6/DEFER-REUSE。
- source_type/reference/exact_excerpt: T-008「S5/S6 移出本任务」；T-010「不做跳过式复用」。
- approval_binding: accepted（用户 Step 11 实际批准；后续仅允许不改变方向的机械收口修复）。。
- facts_and_constraints: F-002 前置；F-016 三问均无受控量化。
- Logic: 前置未满足/漏检风险未知 → 延期到可验证时再做。
- choice_reason/impact: 避免范围失控与假绿。
- consequences_and_risks: 收益延后；延期项若无人认领会遗失。
- rejected_alternatives: 本任务实现 S5/S6；立即全层复用。
- unresolved_items/owner: 后续 task 创建由对应 owner 在 trigger 满足时发起。
- Supersedes: none
- module: defer
- requirement_ids: [R-011, R-012, R-014, R-016, R-023, R-024]
- derived_from: [D-001]
- artifacts: [decision-log.md#风险与延期交接]

### D-011 「认证 make-decision 的需求来源」判定为伪需求（方向判定 + 延期/交接）

- question/final_option: workflowhub 任务要不要「认证 make-decision 的需求来源」、要不要宿主写身份绑定 transcript？→ 都不要，判定为伪需求。
- recommendation/plain_language: 别让任务去认证「用户的需求是哪来的」；也别要求宿主把身份写进会话记录。这两件事在真实宿主上做不到，硬要求只会逼人编事实。
- decision: （a）**真需求**=decision-log「原始需求」节对用户真实需求（`R-*` + 原话/来源引用）的如实认证，保持现状、继续有效；（b）**伪需求**=要求宿主 transcript 的每条用户消息自带 `data.task_id`/`session_id`/`stage` 身份绑定，并以此认证需求来源；（c）本任务不实现、不要求任何宿主侧身份绑定写入，也不因该投影缺失而阻断推进；无法认证时如实保持 `unavailable`（依据 R-021：质量事实不是推进许可证，缺失不得被伪造为完成）；（d）该判定登记为延期/交接项 DEFER-REQ-AUTH，留给未来的宿主集成任务（若真要做，前提是宿主自己写出身份字段，而不是要求人补写）；（e）准确表述其影响面：make-decision step 12 的 stage-end 一致性检查把「认证需求投影」列为输入之一（`workflows/make-decision/SKILL.md:386-391`），本宿主该输入缺失 ⇒ 该检查项**无法诚实 completed，只能如实 unavailable/未校验**；它不构成 stage 失败的判据，也不得被写成通过。
- source_type/reference/exact_excerpt: 用户 2026-09-10 明确判定；main 事实 `runtime/evidence/host-session-transcript.mjs:24-56`（`data.task_id !== taskId || data.session_id !== sessionId || data.stage !== stage` 即丢弃）；bridge 事实 `tools/host/workflowhub-stage-agent-bridge.mjs:461-486`（该投影是 opt-in，`session.source` 未提供时结果 `null`）；本机实测见 facts_and_constraints；ADR 0024 已把「不读取或扫描宿主会话」定为 accepted。
- approval_binding: accepted（用户 2026-09-10 方向判定确认）。
- facts_and_constraints: F-024（本机 DSH 实测：真实用户消息 7 条、全部无身份字段）、F-025（DSH Desktop app.asar 无 workflowhub 集成）、F-026（main 的 verify 唯一 writer/权威事实）。
- Logic: 宿主不写身份 → 契约必然取不到 → 伪需求；把认证对象改成 decision-log 里用户真实需求原文 → 可核验且不依赖宿主 → 真需求。这样既不伪造事实，也不新增控制面。
- choice_reason/impact: 避免为了「认证」去补一套宿主/人肉身份绑定写入；影响面为零（不改 runtime、不改 skill、不新增 schema），只登记判定与交接。
- consequences_and_risks: 未来若宿主具备身份字段，该延期项可按 trigger 重启；在此之前任何声称「需求来源已认证」的说法都必须是 unavailable/不适用，不能算 pass。
- rejected_alternatives: 要求用户或宿主在 transcript 里补写 `task_id/session_id/stage`（等于让人伪造机器事实，违反 provenance 与治理边界）；把该投影缺失当作推进 gate；为了凑出投影而扫描/猜测宿主会话（与 ADR 0024 冲突）。
- unresolved_items/owner: trigger=宿主侧原生写出身份绑定的 user/message 字段；minimum=宿主产出的 `task_id/session_id/stage` 与当前 task/stage/session 逐条一致、且注入内容（skill-catalog/agent-instructions/subagent-settled/goal）不被计入；acceptance=真实 transcript 上取到非空投影且注入消息全部被拒；owner=宿主集成方（DSH/Codex 等）；consumer=make-decision step 12 的认证需求投影；close=本任务按 unavailable 如实披露，不在本任务做。
- Supersedes: 不在本任务范围内回改 ADR 0024 与 `stage-end-spec-analyze` 的既有措辞（属历史事实与既有契约）；本条只登记方向判定与延期，**不新增第五份材料、不新增 gate、不新增控制面**。
- module: make-decision/requirement-source
- requirement_ids: [R-001, R-021, R-025]
- derived_from: [D-001]
- artifacts: [decision-log.md#风险与延期交接, runtime/evidence/host-session-transcript.mjs, tools/host/workflowhub-stage-agent-bridge.mjs]

### D-012 inner 上限跟随 main 的唯一 runtime 画像权威回归 ≤60s

- question/final_option: inner 上限按哪一个数？→ **跟随 main 已实现的唯一 runtime 画像权威：`inner ≤60s`**；medium 仍为 ≤300s。
- recommendation/plain_language: main 上现在只有一套 runtime 画像契约，里面 inner 写的就是 60 秒；我们不再另立「120 秒」这个数，直接跟随它，省得文档和运行时两个数字打架。
- decision: 本任务 S3 的 inner 时长上限与 main 已实现的 `runtime/stage/stage-content-contracts.mjs:59` 的 `TEST_RUNTIME_PROFILE_LIMITS_MS.inner = 60_000` 保持一致：单文件五次最大值 ≤60s、集合 nearest-rank p95 ≤60s；medium 继续 ≤300s。profile 三属性（时长上限、能力许可、运行位置）、唯一权威（`skills/test-routing-advisor`）、能力许可（禁真实网络/DB/文件系统/子进程）、运行位置（本地高频反馈为主）与双指标（单文件 5 次最大值 + 集合 nearest-rank p95）全部不变。另记事实：`tools/cli/run-checks.mjs:111` 另有一份同一数值的复制，本任务不新增第三份复制，也不把该复制升格为第二权威。
- source_type/reference/exact_excerpt: 用户 2026-09-10 明确选择「跟随 main」；main 事实 `runtime/stage/stage-content-contracts.mjs:59`（`inner: 60_000`，`medium: 300_000`）与 `tools/cli/run-checks.mjs:111`。
- approval_binding: accepted（用户 2026-09-10 方向选择确认；不改写 2026-09-09 的历史回复事实）。
- facts_and_constraints: F-005（前序 profile 契约原本即 `inner ≤60s`）；F-013（60/120 冲突经过）；D-002/T-007（2026-09-09 曾显式选择 120s）；main 现已把 60s 落成唯一 runtime 画像契约，`inner` 的现行唯一权威值即 60s。
- Logic: 单一权威必须同时是单一数值 → 不再维护第二个 inner 阈值 → 文档与 runtime 契约不漂移。
- choice_reason/impact: 用户推翻 2026-09-09 的放宽选择，改回 60s；影响面=S3 的阈值文字与验收口径（spec §5.2/FR-S3-06/07/AC-S3-02/03、ADR 0027 落盘值），不改 profile 权威、能力许可、运行位置、双指标与测量协议。
- consequences_and_risks: inner 反馈窗口回到更严的 60s，S3 的拆分与文件级并行必须真的达到该值；未达标时按 B-S3-1/B-S3-2 如实记 fail/incomplete，不得为达标放宽数值、改口径或伪造事实。
- rejected_alternatives: 继续用 120s（与 main 已实现的唯一契约冲突，等于维护第二个数值）；60/120 双轨过渡（产生双权威）；把 60s 复制进本任务文档并当作新契约来源（复制会漂移，权威仍是 test-routing-advisor 与 main 的 runtime 契约）。
- unresolved_items/owner: 无方向未决；`docs/adr/0027-test-feedback-runtime-profile.md`、spec.md 与本文件的落盘文字按本条机械同步。
- Supersedes: **显式修订 D-002 中 inner 数值的部分（`inner ≤120s` → `inner ≤60s`）以及 T-007（2026-09-09 用户选择 B「显式修订为 `inner ≤120s`」）所确立的 120s 数值；修订原因=main 已落地单一 runtime 画像契约 `60_000`，用户 2026-09-10 选择跟随该唯一权威。保持不变的部分：能力许可（禁网络/DB/文件系统/子进程）、运行位置（本地高频反馈）、双指标（单文件 5 次最大值 + 集合 nearest-rank p95）、测量协议（5 个独立进程、cold 单列、cache 口径）与 medium ≤300s。历史事实（T-007 的真实回复原文）不改写。**
- module: S3/test-routing
- requirement_ids: [R-009, R-016, R-019, R-025]
- derived_from: [D-002]
- artifacts: [spec.md#test-runtime-profile, docs/adr/0027-test-feedback-runtime-profile.md, skills/test-routing-advisor/SKILL.md, runtime/stage/stage-content-contracts.mjs]

## 拒绝方案

| 选项 | 拒绝理由 | 关联 D |
| --- | --- | --- |
| S3–S7 五项在一个任务实施 | S5/S6 前置依赖 S1 未满足；两路独立审查均指出依赖死锁与重演大任务 | D-001 |
| S5/S6 在本任务只做实现骨架 | 仍扩大当前维护者域且无法端到端验收；契约骨架留在延期项即可 | D-001/D-010 |
| inner 保持 ≤60s（2026-09-09 的拒绝项） | 当时理由=用户明确选择显式修订为 ≤120s；风险如实登记。**该拒绝已于 2026-09-10 被 D-012 推翻：用户改选跟随 main 的唯一 runtime 画像权威，现行 inner 上限就是 ≤60s** | D-002/D-012 |
| S3 全 fake 或全真实 | 前者假绿风险，后者很难达分钟级；采用快层+薄真实层 | D-003 |
| S3 用内容 hash 跳过测试 | 无公开 false-skip 数字且已有官方假命中警告 | D-003/D-010 |
| S4 硬拒绝超限卡 | 构成新 gate，违反治理；采用 advisory 三态 | D-004 |
| 新增切片字段 | 扩大 schema/consumer；现有字段足以给出三信号 | D-004 |
| 补 `narrow_diff` 生产者或第二预算 | 当前不可达分支无 consumer，裸 CLI 非正式；新增会扩大控制面 | D-005 |
| 补 `quality/verify.json` writer（本任务自己造第二个 writer） | 会与 main 已建立的唯一 canonical writer 形成双写；本任务只核对既有唯一 writer 不被绕过 | D-006 |
| physical 无 plan 显示 unknown/unavailable | 会把正常未开始误报成未知/故障 | D-007 |
| 要求宿主写身份绑定 transcript 并以此认证 make-decision 需求来源 | 本机实测 7/7 真实用户消息无身份字段、宿主无 workflowhub 集成 ⇒ 契约取不到值，只能靠人/宿主伪造；判定为伪需求 | D-011 |
| 因需求来源投影 `unavailable` 而阻断 make-decision | 质量事实不是推进许可证；缺失应如实披露而非变成新 gate | D-011 |

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | trigger / 后果 / 最小交付物 / 验收证据 | owner / consumer / close |
| --- | --- | --- | --- |
| DEFER-S5 | 一等 repair delta 与 `resolved` 链 | trigger=S1 落地并产出可靠语义 review；后果=窄修复仍可能整包重审；minimum=原 finding ref/hash + 最小 diff + finding 测试 + 当前 tree + 越界 full-review 回退；acceptance=一次窄修复得到 resolved + 一次越界触发 full review | owner=runtime/review + runtime/evidence；consumer=verify-code code_review 判据；close=两场景真实复跑 |
| DEFER-S6 | Phase 循环瘦身与 RED/GREEN 证据卫生 | trigger=S1 完成且可消费可靠 phase review；后果=Phase 仍重复采集；minimum=RED failure signature + 按 consumer 引用去重 + input 未变时复用 phase review；acceptance=证据数/耗时下降 + 一次 phase 复跑 | owner=build-code；consumer=build-code phase loop；close=画像达标且无陈旧事实 |
| DEFER-REUSE | 跳过式测试结果复用/TIA | trigger=能证明闭包键与 false-skip；后果=暂时仍需真实执行 inner/phase；minimum=command+传递输入/工具链/env/OS/非文件输入 hash 与失效规则；acceptance=变更每类输入都能失效缓存、不得把 fail→pass，并测 false-skip | owner=测试基础设施；consumer=test runner/CI；close=独立任务实测 |
| RISK-001 | inner 放宽为 120s 与外部 60s 建议相反 | 后果=反馈可能更慢；mitigation=文件 max 与集合 p95 双指标 + 5 次样本。**2026-09-10 由 D-012 关闭：数值回归 main 的 ≤60s，该放宽风险不再成立；保留历史登记** | owner=S3；close=两指标均达标（现行阈值 60s） |
| RISK-002 | advisory 不阻断，可能被忽略 | trigger=`unexplained_overage`；后果=再次形成大任务；mitigation=status/阶段质量缺口必须显示 | owner=build-plan/host；close=本任务 tasks.md 无 unexplained overage |
| RISK-003 | 若有绕过 canonical writer 的 `verify.json` 落盘路径，release 判定会被污染 | trigger=生产反向引用扫描发现 canonical writer 之外的 reader/writer 或第二权威；后果=发布判定基于未认证 bytes | owner=S7；close=反向扫描逐条分类 + `tests/contract/verify-publication.test.mjs` 唯一 writer 断言 + 控制面登记核对（D-006 修订后） |
| DEFER-REQ-AUTH | 「认证 make-decision 需求来源 / 宿主写身份绑定 transcript」判定为伪需求 | trigger=宿主侧原生写出身份绑定的 `user/message` 字段（`task_id`、`session_id`、`stage` 三者齐备）；后果=在此之前该认证投影只能 `unavailable`，不得被伪造为通过；minimum=宿主产出的身份字段与当前 task/stage/session 逐条一致且注入消息（skill-catalog/agent-instructions/subagent-settled/goal）全部被拒；acceptance=真实 transcript 取到非空投影且注入消息全拒 | owner=宿主集成方（DSH/Codex 等）；consumer=make-decision step 12 认证需求投影；close=本任务按 unavailable 如实披露，交由未来独立任务 |

### 质量边界

- 质量事实：review/test/性能/overage 都只记录事实，`unavailable` 不等于通过。
- 推进资格：advisory、审查 finding、性能不达标不阻止同 task 修复；不得伪造完成。
- 完成判据：D-008 的每 seam 可证伪验收 + per-AC 产品结果权威（唯一 writer 边界成立，D-006 修订）+ verify-code current code review。
- 不可逆授权边界：commit/merge/archive/push/cleanup 仍由人确认，本任务不改。

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OPEN-001 | S3/S4/S7 的精确 symbol 级切片 | 文件/consumer/测试面已由下表锁定，仅剩函数级定位 | build-plan 只能在锁定 consumer 内细化，不能换验收面 |
| OPEN-002 | 新 ADR 的最终编号与拆分 | **closed（2026-09-10 用户确认）**：0025 已有三份并存占用、0026 已占用，故新 ADR 定为 `0027-test-feedback-runtime-profile.md`、`0028-plan-slicing-and-review-budget.md`、`0029-current-ac-and-close-state.md`；不再是未决项 | 用户在 2026-09-10 确认编号；build-spec 只做机械落盘，不得改变 D-002/D-004/D-005/D-006/D-007 的语义 |
| OPEN-003 | 「认证 make-decision 需求来源」是否作为本任务要求 | **closed（2026-09-10 用户判定伪需求）**：本宿主无法诚实完成（F-024/F-025）；登记为 DEFER-REQ-AUTH，不在本任务实现，也不阻断推进 | 用户 2026-09-10 判定；本任务只如实保持 `unavailable` |

### 变更 → consumer → 针对性测试与真实复跑矩阵

| seam | 锁定生产改动/consumer | 针对性命令（文件如拆分则 NEW） | 锁定真实复跑与证据 |
| --- | --- | --- | --- |
| S3 | `skills/test-routing-advisor` profile → spec-tasks/build-plan/build-code/CI；acceptance fixture → inner/phase runner | `npx vitest run tests/contract/acceptance-execution-tier.test.mjs` 的拆分后 inner/phase 文件（NEW）+ advisor 合同测试 | 同一基准机 inner 与 phase 各按 B-S3-2 跑 5 次；`quality/tests` receipt + 原始 output + performance profile |
| S4-slicing | `runtime/stage/stage-content-contracts.mjs` → build-plan/stage_quality/status | `npx vitest run tests/stage-plan-task-contract-v3.test.mjs tests/contract/status-derivation.test.mjs` | 对本任务最终 `tasks.md` 跑真实 validator/status readback；结果不得为 unexplained |
| S4-review-budget | `runtime/review/review-record-route.mjs` + budget validator → formal dispatch/stage consumer | `npx vitest run tests/review/review-record-route.test.mjs`（若现有名不同，NEW 专项文件只能覆盖同 consumer） | 本任务发起一次正式 review request；验证 attempt/result refs、预算 history、合法复用与非法 import 拒绝 |
| S7 | per-AC 权威/唯一 writer 边界 → verify/status/release（核对，不改写）；close projection → task-close/status | `npx vitest run tests/contract/verify-publication.test.mjs tests/contract/status-derivation.test.mjs tests/close/close-contract.test.mjs tests/integration/vnext-delivery-close.test.mjs` | 隔离 fixture 中真实 `status→close cleanup failure→resume→status`，并覆盖 existing workspace；另做生产反向引用扫描（逐条分类 current/audit_only/test_only）+ 控制面登记核对；保存 status JSON、step/completed records |
| REQ-AUTH（D-011） | `runtime/evidence/host-session-transcript.mjs` + `tools/host/workflowhub-stage-agent-bridge.mjs` → make-decision step 12 认证需求投影（**本任务不改**） | 本任务不跑：判定为伪需求；如需复核只读 `npx vitest run tests/contract/dsh-requirement-source.test.mjs`（既有文件，不由本任务改） | 本机真实 transcript 实测（F-024/F-025）：7/7 真实用户消息无身份字段、`app.asar` 无 workflowhub 集成 ⇒ 投影 `unavailable`；本任务只如实披露，不补宿主写入 |

## publish-decision 阶段末披露

### 大白话交接卡

1. **本阶段做了什么**：按顺序完成 3 轮 Talk、一次有界研究、方向 red/blue 审查、两批 Grill、决策草稿、细节 red/blue 审查、真实用户批准和 stage-end semantic analysis；没有进入 build-spec。
2. **决定与理由**：当前实施 S3、S4-slicing、S4-review-budget、S7 四个串行 Phase；把依赖 S1 或缺 false-skip 证据的 S5/S6/reuse 移出，避免再次形成大任务和假绿。
3. **覆盖情况**：R-001..R-026 均有 covered/deferred/partially_superseded 去向；页面范围为 non_ui；完整旅程、数据状态、成功失败边界、非目标、延期、consumer/test/replay 矩阵都已定稿。
4. **质量事实**：方向审查 17 findings，已通过 Talk/决定逐项处置；细节审查 31 findings（含 2 blocking），30 fixed、1 因现有逐 AC producer 代码事实而 rejected_invalid、0 needs_human。审查是 advice，不称 provider pass。
5. **剩余风险**：inner 原由 60s 放宽至 120s 的风险已由 D-012 于 2026-09-10 关闭（现行阈值回归 main 的 ≤60s）；advisory 可能被忽略；fake 不等价；若有绕过 canonical writer 的 `verify.json` 落盘路径会污染 release 判定（D-006 修订后）；均有 B-S3/S4/S7 的 fail 条件与真实复跑。
6. **延期**：DEFER-S5、DEFER-S6、DEFER-REUSE、DEFER-REQ-AUTH 均有 owner/trigger/minimum/acceptance，触发前不得塞回当前任务。
7. **下游不得猜**：build-spec 只允许细化 OPEN-001 symbol 切片；不得改四 Phase、阈值（现行 inner ≤60s，见 D-012）、三态、预算 owner、per-AC 权威/唯一 writer 边界、physical 矩阵、真实/替身边界或延期范围。ADR 编号已定（0027/0028/0029），build-spec 不得另起编号。
8. **执行遗漏披露**：研究报告的独立复核仍为 `review.status=pending`，所以研究只作方向输入；interaction aggregate 的现有 public CLI route 缺失，本阶段按 make-decision 技能规定用现有 TaskKernel direct writer，未新增命令/记录替代物；未运行实现测试（make-decision 不改生产代码）；未执行 commit/merge/archive/push/cleanup（未获不可逆操作授权）。**make-decision step 12 的「认证需求投影」输入在本宿主为 `unavailable`**（F-024/F-025：真实用户消息 7/7 无 `task_id/session_id/stage`，DSH Desktop `app.asar` 无 workflowhub 集成），该检查项无法诚实 completed、也不能被写成通过，已按 D-011 判定为伪需求并登记 DEFER-REQ-AUTH；其余 Step 1–12 无未完成/跳过/unknown/unavailable。
9. **2026-09-10 方向修订披露（merge main 后）**：本阶段材料原为旧契约产物，经用户确认真实完成后修订三项——(a) S7 改向：不再要求移除 `quality/verify.json` 的 current 权威，改为核对 main 已建立的 per-AC 唯一权威与唯一 writer 不被绕过（D-006，Supersedes 原 GQ5/旧 D-006；同时解除父任务 DEFER-S7 的「对齐声明或补 writer」延期项，依据 `specs/archive/workflowhub-execution-acceleration-20260909/decision-log.md:184`）；(b) ADR 编号：因 main 已占用三个 0025 与 0026，本任务三份新 ADR 定为 0027/0028/0029（D-009、OPEN-002 closed）；(c) 新增 D-011「需求来源认证是伪需求」判定与 DEFER-REQ-AUTH 交接。本次修订未删除任何历史事实与已批准决定，改动处均写明修订原因与 Supersedes 关系。本轮**不引入 OI 大纲**、不新增第五份材料。
10. **2026-09-10 阈值修订披露（merge main 后第二轮）**：用户明确选择**跟随 main**，把 inner 上限从 D-002/T-007 的 ≤120s 修订回 **≤60s**（medium 仍 ≤300s），依据 main 已实现的唯一 runtime 画像权威 `runtime/stage/stage-content-contracts.mjs:59`（`TEST_RUNTIME_PROFILE_LIMITS_MS.inner = 60_000`；`tools/cli/run-checks.mjs:111` 为同一数值的既有复制）。新增 **D-012** 承接该方向级 `Supersedes`（显式修订 D-002 的 inner 数值部分与 T-007 的 120s 选择）；能力许可（禁网络/DB/文件系统/子进程）、运行位置、双指标（单文件 5 次最大值 + 集合 nearest-rank p95）与测量协议不变；T-007 的原始用户回复作为历史事实保留不改写。所有把 120s 当现行要求的表述（D-002、B-S3-1/B-S3-2、D-008、D-009、拒绝方案、RISK-001、spec §5.2/FR-S3-06/07/08/AC-S3-02/03/SCN-S3-01/§14.1）均已带「已于 2026-09-10 由 D-012 修订为 60s」标记并改为 60s。

## 文档结果

- CONTEXT.md：`no-change-yet`；本阶段核出 runtime profile/四域/close 三义冲突，作为本任务实施交付，引用 `CONTEXT.md:70-82,117-118`。
- ADR：`created-not-yet`；S3/S4/S7 三组均满足 hard-to-reverse=true、surprising=true、real-tradeoff=true；编号已由用户 2026-09-10 确认为 `0027-test-feedback-runtime-profile.md`（S3 profile 权威）、`0028-plan-slicing-and-review-budget.md`（S4 切片/预算 owner）、`0029-current-ac-and-close-state.md`（S7 per-AC 权威与 close 状态）；0025 已有三份并存占用、0026 已占用，不复用。
- ADR 落盘值：`0027-test-feedback-runtime-profile.md` 的画像阈值必须写 `inner ≤60s` / `medium ≤300s`（2026-09-10 由 D-012 修订；原 120s 不再有效）。
- 术语/ADR 冲突：ADR 0007/0017 冲突处须精确修订（经 0027/0028/0029 落盘）；ADR 0018/0020 继续有效；standard-workflow close 单义与 CONTEXT/CONSTITUTION 三义须统一。
- 需求来源认证：`no-change`；D-011 判定「要求宿主写身份绑定 transcript 并据此认证 make-decision 需求来源」为伪需求，本任务不实现、不新增控制面；当前投影在本宿主如实 `unavailable`（F-024/F-025），交接为 DEFER-REQ-AUTH。
- 不复制 spec 的边界：本文件只钉方向、owner、consumer、状态与验收；字段 schema/函数签名/任务步骤留给后续同一方向细化。

### Exit checks

- 上下文一致：pass（S3/S4/S7 与原始需求及前序延期登记一致；S5/S6/reuse 有完整 handoff；2026-09-10 修订已登记：S7 改向=per-AC 唯一权威/唯一 writer 不被绕过、ADR 编号 0027/0028/0029、需求来源认证判定为伪需求 DEFER-REQ-AUTH、inner 上限由 D-012 修订为跟随 main 的 60s）。
- owner/接口一致：pass（profile=test-routing-advisor；slice=existing plan validator；budget=formal request writer；AC=main 已建立的 per-AC 权威 + TaskKernel 唯一 writer；physical=close reader）。
- 失败语义明确：pass（性能 fail、三态 overage、budget unavailable、physical not_started/unknown/unavailable 分开；需求来源投影 unavailable 不阻断推进且不冒充通过）。
- 范围与延期明确：pass（当前三 seam；三项延期 + DEFER-REQ-AUTH；非目标定稿；不引入 OI 大纲、不新增第五份材料）。

## 阶段 step 结果

| step | 状态 | 实际做了什么 | 证据/引用 |
| --- | --- | --- | --- |
| 1 load-context | completed | 用 `tools/cli/task-bootstrap.mjs` 建立认证 worktree（分支 `task/workflowhub/workflowhub-execution-acceleration-deferred-20260909`，基线 `1195bca0`）与 task store；读取 `workflows/make-decision/SKILL.md`、`steps.json`、`skill-deps.yaml` 与依赖技能 `decision-log`/`talk-with-zhipeng`/`grill-with-docs`/`wh-review`；读取原始需求与复盘文档（665 行，含 L616-665 处置与延期登记）；读取前序任务 decision-log 的覆盖矩阵、D-010 与「风险与延期交接」；派发只读子代理核实现状（S3+S4、S5+S6+S7、前序 decision-log 结构、既有调研覆盖） | worktree；task store；本文件「原始需求」R-001..R-026 |
| 2 triage-scope | completed | 写入本阶段目标/核心需求草稿、范围、完整用户流程五触点（T-1..T-5）、页面范围 `none`、数据状态 10 类对象、状态与唯一写入者原则、不确定性 U-001..U-007、非目标 9 条、S3–S7 接缝表与延期条目覆盖矩阵 | 本文档「目标/核心需求/范围/非目标/方案候选」 |
| 3 talk-round-1 | completed | 先核实现状事实，再只问无法自行确定的方向问题；一轮 3 个互不依赖问题（覆盖范围、交付边界、S4 强制力）全部收到真实回复（T-001..T-003） | T-001..T-003；F-001..F-021 |
| 4 research-inputs | completed | 先判定既有四路调研（R-EXT-01..04，`review.status=pending`）对 S3–S7 的覆盖：S3/S4/S6 可复用、S5 仅间接、S7 零覆盖；再对三个真实缺口（G1 假 git/子进程等价性、G2 复用键粒度、G6 delta-only 逃逸率）派发一次有界调研（12 次工具调用），报告内容寻址落盘 | R-EXT-01..04（前序 task store）；新增报告 `quality/evidence/research/13114d0f…json`（sha256 `13114d0f…`，6625 bytes，`review.status=pending`）；F-012、F-016 |
| 5 talk-round-2 | completed | 研究后一轮 4 个互不依赖问题（S1 依赖与验收、本任务切片、验收口径、inner 上限契约冲突）全部收到真实回复（T-004..T-007） | T-004..T-007；F-013、F-016 |
| 6 direction-advice | completed（第一次 blocked_before_dispatch，第二次 available） | 第一次按 detail 材料形状提交，被既有 preflight 在派发前拦下（`MATERIAL_INCOMPLETE`、provider 调用 0、不消耗预算）；补齐 `objective_facts` 并按 direction track 合同重发后取得 red/blue 两 role `available`、共 17 条 findings（含 9 类方向争议） | pair `484b1a76…`；red result `…e379290b….json`、blue result `…048ebc38….json`；report `…038d05a3….md`；F-021；「审查处置」节 |
| 7 talk-round-3 | completed | 将 red/blue 的 9 类争议逐项展开，用一组 3 个互不依赖问题处理范围死锁/任务过大、inner 测量口径、跳过式复用风险；用户采纳审查把 S5/S6 移出本任务，锁定 S3+S4+S7；inner 同时测文件硬上限与集合 p95；结果复用延期 | T-008..T-010；FND-005/006/007/009/015/016 |
| 8 grill-with-docs | completed | 两个只读子代理核对 CONTEXT/ADR/标准流程和三 seam 的真实接口；第一批 5 问钉死 S3 真/假边界、性能窗口、S4 超限度量、预算覆盖入口、verify.json 去留（该问的原始答复「移除生产依赖」已由 2026-09-10 的 D-006 修订为「核对既有唯一权威/唯一 writer 不被绕过」）；重排后第二批 3 问钉死 physical `not_started`、advisory 三态、runtime profile owner；完成四维范围裁决与四项 exit checks | GQ1..GQ8；`CONTEXT.md`/ADR 0007/0017/0018/0020；grill_summary |
| 9 write-decision-draft | completed | 将全部真实回答、研究、方向审查与 Grill 结论写成 D-001..D-010；定稿范围/用户流程/页面/数据状态/成功失败边界/非目标/拒绝方案/延期项/文档结果；每条决定包含来源、逻辑、后果风险、被拒方案、Supersedes 与 downstream artifacts | D-001..D-010；B-S3/B-S4/B-S7；DEFER-S5/S6/REUSE；OPEN-001..002 |
| 10 detail-advice | completed | detail track 两 role available/coverage satisfied，共 31 findings（2 blocking）；逐条聚为 16 簇并处置：30 fixed、1 rejected_invalid（“无逐 AC producer”被代码生产链反证）、0 needs_human；补目标旅程、current authority/physical 矩阵、S4 派生语法、result import provenance、consumer/test/replay 矩阵与 R-017..019 分流；不触发第4轮 Talk | pair `a15df62f…`；red `…50583c54….json`；blue `…95b6efde….json`；本文件 step 10 处置表 |
| 11 approve-decision | completed | 向用户展示最终八点决策卡、四 Phase 结构性修正、代价与风险；用户真实选择「批准，按此进入 make-decision 收口」；确认绑定当前 decision-log 内容范围；Talk round_count=3，conditional R4 未触发；interaction aggregate 通过现有 TaskKernel writer 发布（public CLI 无 interaction action，未伪造替代命令） | confirmation `quality/confirmations/67ed2242….json`；interaction `quality/evidence/interactions/58fbb4a4….json`；quality fact `quality/facts/f017a91f….json` |
| 12 stage-end-spec-analyze | completed（首次 material_incomplete，修复后 consistent） | 首次语义分析发现 3 个文档内部冲突：approval 仍 pending、S4 单/双 Phase 不一、R-020/023/024/026 仍 open；全部为机械收口且不改方向。修复后重新绑定确认与 aggregate；第二次分析逐项核验原需/决定/确认身份，`status=consistent`、`new_gaps=[]` | first analysis 结果保留于本会话执行事实；current confirmation/interaction 同 step 11；第二次分析 evidence anchors `decision-log:L66-192,L316-341,L393-630` |
| 13 publish-decision | completed（材料发布） | 写入「publish-decision 阶段末披露」八项交接卡，逐项披露范围、理由、覆盖、质量事实、风险、延期、下游不得猜和所有未完成/不适用事实；未调用任何不可逆 delivery 操作 | 本文件「publish-decision 阶段末披露」；正式 stage outcome 在最终 current revision 上发布 |
| 14 post-merge direction revision | completed（2026-09-10 用户确认真实完成的修订，非例行步骤） | merge main 后本任务材料仍为旧契约产物，用户逐项确认真实完成三项**方向修订**并写入本文件：(a) **S7 改向**——不再要求移除 `quality/verify.json` 的 current 权威，改为核对 main 已建立的 per-AC 唯一权威与唯一 writer 不被绕过（重写 D-006、B-S7-1、数据状态/非目标/处置矩阵/风险/披露，Supersedes 原 GQ5 与旧 D-006；解除父任务 DEFER-S7 的「对齐声明或补 writer」延期项，依据 `specs/archive/workflowhub-execution-acceleration-20260909/decision-log.md:184`，main 已补 writer：`completion-predicates.mjs:375-381,1119-1123`、`tests/contract/verify-publication.test.mjs:30-81`、`runtime/task/task-store.mjs:250-262`、`docs/architecture/control-plane-inventory.json:12`）；(b) **ADR 编号**——main 已占用三个 `0025-*`（含 Accepted 的 `0025-review-dispatch-preflight-boundaries.md`，被 `tests/contract/governance-review-dispatch-boundary.test.mjs:6` 断言）与 `0026-equivalent-stage-outcome-attempts.md`，本任务三份新 ADR 定为 `0027-test-feedback-runtime-profile.md`、`0028-plan-slicing-and-review-budget.md`、`0029-current-ac-and-close-state.md`（D-009、OPEN-002 closed）；(c) **需求来源认证判定为伪需求**——新增 D-011 与 DEFER-REQ-AUTH：不要求认证 make-decision 需求来源、不要求宿主写身份绑定 transcript，本宿主该投影只能如实 `unavailable`。同时修复本文件唯一 markdownlint 违规（原 L128 表格列数） | 本文件修订处（D-006/D-009/D-011、B-S7-1、数据状态、非目标、处置矩阵、风险与延期、OPEN-002、文档结果、Exit checks）与「publish-decision 阶段末披露」第 9 项；facts F-024/F-025/F-026；`markdownlint-cli2` 0 违规；本轮不引入 OI 大纲、不新增第五份材料 |
| 15 post-merge threshold reversion | completed（2026-09-10 用户确认真实完成的修订，非例行步骤） | 用户明确选择**跟随 main**，把 inner 上限从 D-002/T-007 的 `≤120s` 修订回 `≤60s`（medium 仍 ≤300s）：新增 **D-012** 承接方向级 `Supersedes`（显式修订 D-002 的 inner 数值部分与 T-007 的 120s 选择，原因=main 已落地唯一 runtime 画像契约），并同步本文件内所有把 120s 当现行要求的位置（目标旅程第 6 步、收敛检查方案行、B-S3-1/B-S3-2、F-013、方向审查 D-3、FND-001/014/017、T-007/T-009 结论行、D-002 全条、D-008、D-009、拒绝方案、RISK-001、大白话交接卡第 5 项、Exit checks、披露第 10 项）；能力许可、运行位置、双指标与测量协议不变，T-007 原始回复与 120s 相关历史事实一字未删，只在被修订处加「已于 2026-09-10 由 D-012 修订为 60s」标记 | 用户 2026-09-10 选择；main 事实 `runtime/stage/stage-content-contracts.mjs:59`（`inner: 60_000`）与 `tools/cli/run-checks.mjs:111`；本文件 D-012；`spec.md` §5.2/FR-S3-06/07/AC-S3-02/03/SCN-S3-01/§14.1；`markdownlint-cli2` 0 违规 |
