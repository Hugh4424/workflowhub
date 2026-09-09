# Decision Log — workflowhub-execution-acceleration-20260909

> 阶段：make-decision（进行中）
> 创建：2026-09-09
> 认证 worktree：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-execution-acceleration-20260909`
> 分支：`task/workflowhub/workflowhub-execution-acceleration-20260909`（基线 `1195bca08be4ef62e204ac764873b9e46a662432`）
> 原始需求来源：用户 2026-09-09 指令 + `/Users/Hugh/Downloads/workflowhub-execution-simplification-postmortem-20260909.md`（612 行只读复盘）

---

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 | 维度（requirement message class） |
| --- | --- | --- | --- | --- |
| R-001 | 阅读指定复盘文档，与用户一起思考如何改进 workflowhub 来解决这些问题 | 用户原话：「请帮我阅读…然后和我一起思考一下应该如何改进workflowhub来解决这些问题」 | covered（D-001） | goal |
| R-002 | 最重要的问题是**执行加速和减少阻塞** | 用户原话：「最重要的问题是执行加速和减少阻塞」 | covered（D-001） | goal |
| R-003 | 按标准 WorkflowHub 流程开始：先创建 worktree，再从 make-decision 开始，不跳阶段 | 用户原话：「请按标准 WorkflowHub 开始这个任务吧，先创建worktree，然后从 make-decision 开始，不要跳阶段」 | covered（D-001） | flow_or_surface |
| R-004 | 不依赖 build-spec 补需求；make-decision 就要梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项 | 用户原话：「也不要依赖 build-spec 补需求。先基于原始需求，在make-decision的过程中和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项」 | covered（D-001） | flow_or_surface |
| R-005 | 注意主会话上下文控制和子代理派发 | 用户原话：「注意主会话上下文控制和子代理派发」 | covered（D-002） | goal |
| R-006 | Talk 和 Grill 用大白话说明选项、后果和风险 | 用户原话：「Talk 和grill请用大白话说明选项、后果和风险」 | covered（D-001） | flow_or_surface |
| R-007 | 复盘结论：`quality_status=incomplete`、`product_release=not_released` 是最终事实，不能改写成通过 | 复盘 L21-24 | covered（D-003） | constraint_non_goal_defer |
| R-008 | 复盘根因：任务切分过大（83 文件/9063 行/20 AC/16 卡/24 tree） | 复盘 L85-95、根因树 L380-383 | deferred（DEFER-S4、D-010） | constraint_non_goal_defer |
| R-009 | 复盘根因：反馈环太慢（单测试集合 600–900s；45 次正式测试约 203 分钟） | 复盘 L109-126、L482-499 | deferred（DEFER-S3） | data_or_state |
| R-010 | 复盘根因：review 系统不具备大任务处理能力（665KB 包、prompt too long、600s outer shutdown 杀掉已完成 provider、错误分类过粗） | 复盘 L205-233、L412-432 | covered（D-001、D-004、D-005） | data_or_state |
| R-011 | 复盘根因：identity 过度失效（任何 source 改动即整包 stale，缺 repair delta/resolved 链） | 复盘 L235-251、L448-464 | covered（D-006、DEFER-S5） | data_or_state |
| R-012 | 复盘根因：事实生产与消费断裂（962 文件但 facts.jsonl=0、index reviews/tests 空、verify.json 仍 unknown） | 复盘 L304-321、L501-519 | covered（D-001、F-018 修正） | data_or_state |
| R-013 | 复盘根因：编排上下文膨胀（8.9 亿 token、root 4.61 亿、sleep 229/wait_agent 259/write_stdin 228） | 复盘 L339-359、L521-542 | covered（D-002、D-007） | goal |
| R-014 | 复盘建议：先让 review 在昂贵 dispatch 前可判定（preflight + 精确错误分类） | 复盘 L412-432、实施顺序 L600 | covered（D-004） | flow_or_surface |
| R-015 | 复盘建议：review 改异步 job、增量持久化 provider 结果、外层 timeout 不抹掉已完成成员 | 复盘 L434-446、L600 | covered（D-005） | data_or_state |
| R-016 | 复盘建议：建立 review + repair delta + disposition（只有越过原审查边界才重跑 full review） | 复盘 L448-464、L601 | deferred（DEFER-S5） | flow_or_surface |
| R-017 | 复盘建议：重做任务切分规则（软上限 5–15 生产文件/任务，一 Phase 一 seam） | 复盘 L466-480、L604 | deferred（DEFER-S4、D-010） | constraint_non_goal_defer |
| R-018 | 复盘建议：测试回到分钟级反馈（inner ≤120s / phase ≤300s / final 只跑一次 + 内容 hash 复用） | 复盘 L482-499、L602 | covered（D-007 契约与画像） | data_or_state |
| R-019 | 复盘建议：统一 current fact 写入与 close 读模型（artifact → facts → index → readback；orphan evidence 诊断） | 复盘 L501-519、L604 | covered（D-006） | data_or_state |
| R-020 | 复盘建议：压缩 agent 上下文（content-addressed task slice，禁止默认继承长历史） | 复盘 L521-542、L605 | covered（D-002、D-007） | goal |
| R-021 | 复盘建议：修复 close 最终态表达（plan prediction 与 execution result 分离；cleanup 矛盾） | 复盘 L544-549、L607 | deferred（DEFER-S7） | flow_or_surface |
| R-022 | 复盘建议实施顺序（7 步：preflight/错误分类/增量持久化 → repair 链 → 单一预算 owner → 慢测试分层 → fact 发布 → 切片与窄上下文 → close 表达） | 复盘 L598-606 | covered（D-010） | constraint_non_goal_defer |
| R-023 | 复盘运营指标基线（build-code <2h、verify <20m、inner p95<120s、phase p95<300s、preflight <5s、full review <250KB 且 <70% context、polling ≤3 events、trees ≤5–8、current-fact coverage 100%、root context <25%） | 复盘 L582-596 | covered（D-008） | success_failure_acceptance |
| R-024 | 宪法与治理边界：质量事实不是推进许可证；不新增 gate；新控制面须登记 owner/consumer/测试/删除条件 | CONSTITUTION.md / AGENTS.md / standard-workflow.md L7-21、L72-83 | covered（D-003、D-009） | constraint_non_goal_defer |
| R-025 | 测试硬规则：只跑受影响针对性测试；禁止无范围全量回归 | AGENTS.md「测试硬规则」；standard-workflow.md L310 | covered（D-001） | constraint_non_goal_defer |
| R-026 | 已发生真实 provider 失败且完成受认证路由修复时，允许本任务继续一次受限重试，不把材料/协议/漂移或零 provider attempt 失败伪装成路由修复 | 用户 2026-09-09 原话：「允许，纳入本任务，然后继续吧」；承接当前 integration review unavailable 阻塞 | covered（D-012） | flow_or_surface |

### 需求框架（先选一类，再逐步回填）

- **framework**：`functional`（背景→问题→目标→方案→验收→扩展）
- **选择理由**：本任务是「改进 workflowhub 执行链」的产品/工程改造决策，不是研究结论裁决；复盘的 8 条建议只是候选方案，不是既定裁决。研究（如需要）作为受影响节点的 `research` 子树挂载。
- **回填规则**：调研、Talk、审查、Grill 只能扩展已有节点；混合任务以 `functional` 为外层，在受影响节点下挂 `research` 子树。

| node_id | 节点 | status | evidence_status | evidence_owner | next_review_trigger |
| --- | --- | --- | --- | --- | --- |
| N-001 | 背景/问题：一次真实任务被设计成系统级大改，执行 25h20m、8.9 亿+ token、质量链未闭合 | confirmed | complete | 复盘文档 | — |
| N-002 | 目标：执行加速 + 减少阻塞（用户指定最高优先） | open | pending | 本阶段 Talk R1/R2 | 用户回答后 |
| N-003 | 方案：本次任务交付哪一段改进（review 链 / 测试链 / 事实链 / 切片与上下文） | open | pending | 本阶段 Talk R2 + 独立建议 | 方向确认后 |
| N-004 | 验收：用什么可证伪口径证明「变快了、不再阻塞」 | open | pending | 本阶段 Talk R2 + 复盘指标 | 方向确认后 |

## UI applicability

```json
{"result":"non_ui","sources":{"raw_requirement":{"conclusion":"non_ui","reason":"用户需求全部是执行成本、审查、测试、上下文与派发，无任何页面或交互诉求"},"project_inventory":{"conclusion":"non_ui","reason":"本仓无 web 前端应用（无 src/、apps/、web/，无前端框架依赖）；前端能力体现在面向消费者项目的 skills/ 技能族"},"planned_or_changed_frontend_fact":{"conclusion":"non_ui","reason":"本次改动落在 runtime/、skills/wh-review/、workflows/、tests/ 与文档，不新增页面或前端组件"}}}
```

三个来源都由证据合并得出（不是调用方标签）：原始需求无 UI 信号；仓库盘点确认本仓无前端应用；本次计划改动无前端事实。结论 `non_ui`。

## 目标

- 目标：在不新增 gate、不伪造质量事实的前提下，让 WorkflowHub 的一次真实任务执行更快、更少空等与返工。
- 排序依据：R-002（用户指定执行加速与减少阻塞为最重要）。

## 核心需求

- **核心需求**：让 WorkflowHub 的一次真实任务执行更快、更少空等与返工，同时不伪造质量事实、不新增 gate。
- **核心目标**：本次交付 S1（review 派发边界与结果耐久）+ S2（主会话编排与上下文经济）+ per-AC material-only 容忍；S3-S7 登记延期并逐条带 owner 与触发条件。
- **已选方向**：D-001 把程序拆成 7 个接缝、本次交付 S1+S2+per-AC；D-004 把 token/健康检查定为 dispatch 前置条件并新增 ADR 0025 只改两条冲突点。
- **范围**：只改执行成本，不改阶段划分、不新增控制面、不改 broker 内部 provider 协议、不改 close 授权语义。
- **验收**：D-008 内联指标表（基线/阈值/分母窗口/观测来源/pass-fail）+ D-011 定义的当前 task 本地 aggregate；不把缺失的 host telemetry 或真实任务复跑改写成通过。
- **未决与延期**：DEFER-S3..S7 与 OPEN-002/OPEN-003 逐条带 owner、触发条件、最小交付物与验收证据；本阶段没有未决的方向性歧义。

## 收敛检查

| 维度 | 用户答案 | 事实 | 可执行验收 |
| --- | --- | --- | --- |
| 目标 | 用户确认目标为执行加速与减少阻塞，且不得伪造质量事实（T-001、T-002） | R-002 → D-001；decision-log.md 目标节 | D-008 指标表第 4-6 行：root 上下文占比 <25%、长任务 ≤3 meaningful 事件且 sleep 轮询 0、worker 自足率 100% |
| 范围 | 用户确认本次交付 S1 + S2 + per-AC 容忍（T-004、T-008、GQ1） | R-004 → D-001；decision-log.md 范围节与非目标节 | D-001 交付边界 + 非目标清单：不改阶段划分、不新增 gate/第二 store、不改 broker 内部协议 |
| 方案 | 用户确认取舍：分次交付换取每段可独立验证；被拒方案：一次做完 S1-S7；未决项：OPEN-002 复跑对象由用户交付后选择（见 D-008） | D-001、D-004、D-005；decision-log.md 决定节 | D-008 复跑四场景 + 每 seam 的基线/阈值/观测来源/pass-fail |
| 验收 | 用户后续明确授权本任务不要求真实任务测试，改用当前 task 本地 aggregate；硬指标缺少 host telemetry 时保持 unavailable | R-023 → D-008；用户 2026-09-09 回复 → D-011 | 场景：当前认证 task 的 P1-P5 事实聚合；数据来源：当前 worktree targeted receipts 与源码；通过：本地合同、逐 AC 绑定和失败边界可判真；失败：缺 receipt、篡改 status 或把 live metric 缺失写成达标 |

## 成功/失败边界

> 每条边界标注所属接缝与可证伪口径（基线 / 阈值 / 观测来源 / pass-fail）。**不属于本次交付的边界不写在这里**，只写在对应 DEFER 条目内。

- 成功边界（S1，review 派发边界与结果耐久）：
  - **B-S1-1 派发前置拦截**：基线=本次实测 1 次 40 分钟全废；阈值=拦截调用 ≤5s 返回且 provider 调用数=0；观测来源=`blocked_before_dispatch` attempt + broker runtime 目录；pass=满足；fail=出现 provider 调用或耗时 >5s。
  - **B-S1-2 已完成结果可恢复**：基线=本次实测 4/4 completed 但 task store 无 attempt；阈值=恢复后 attempt 含 ≥1 个 completed 成员且可被同身份请求复用；观测来源=attempt.json `provider_results` + 复用标记；pass=可读回且复用；fail=读不回或需重新 dispatch。
  - **B-S1-3 非材料写入不再作废结果**：基线=本次实测写 1 次 decision-log 即作废；阈值=写 task store 证据文件 0 次漂移；观测来源=复跑实验 attempt；pass=结果被记录；fail=仍丢弃。
- 成功边界（S2，主会话编排与上下文经济）：
  - **B-S2-1 主会话上下文占比**：分母=该任务 root + 全部直系子代理已记录 input token；窗口=任务全程；阈值=root <25%（基线 51%）；观测来源=host 会话日志按 agent 汇总；pass=达标；fail=记录实际值，不改写成通过。
  - **B-S2-2 主会话不阻塞轮询**：分母=主会话 sleep/wait/poll 调用数；窗口=任务全程；阈值=长任务（>10 分钟）每任务 ≤3 次 meaningful 事件、sleep 轮询 0 次；观测来源=主会话工具调用计数；pass=达标；fail=未达标。
  - **B-S2-3 worker 自足**：分母=本次派发 worker 总数；阈值=100% brief 自足（不依赖父会话历史）+ 100% 返回 `结论+ref+hash` 且 ≤500 字；观测来源=brief 文件与返回记录；pass=达标；fail=未达标。
  - **B-S2-4 测试运行画像与分层契约**：本次只交付契约与一次不改行为的画像，**不承诺内环变快**；观测来源=画像数据 + 契约文本；pass=契约字段齐备且画像可复算。
- 成功边界（本次共同验收）：**一次真实小任务复跑**，口径见 D-008。
- 失败边界（不可协商）：
  - 把 `unavailable`/`incomplete` 改写成通过。
  - 新增 gate、第二 store、第五份材料或永久兼容桥。
  - 用未执行的测试、未返回的 provider 结果冒充证据。
  - 只改文档措辞而不改变真实执行成本（「看起来变快」）。
  - 重复造已有机制（brief / dispatch 边界 / 健康探测 / 测试分层）。
  - 引入被仓内拒绝的命名，或新增第五个 disposition。
  - **不得把「窄修复不再整包重审」当作本次交付边界**：该能力属于 DEFER-S5，验收写在 DEFER-S5 行内。

## 范围

- 当前范围（已定稿）：主题是「WorkflowHub 执行链的加速与去阻塞」；本次交付 S1 + S2 + per-AC 容忍（见 D-001/D-006）。
- 明确不在本阶段确定：具体文件边界、schema 字段、任务卡拆分（属 build-plan）；但本阶段必须定死方向、用户流程、页面范围、数据状态、成功/失败边界、非目标与延期项。
- 用户流程/结果只记索引和验收影响，细节进入 spec。

### 完整用户流程（本阶段必须形成）

使用者是「用 AI 宿主跑 WorkflowHub 任务的操盘者」。一次任务的可观察旅程：

1. 用户一句需求启动 → `task-bootstrap` 建认证 worktree + 外置 task store。
2. `make-decision`：Talk / Grill / 独立建议 / 用户确认 → `decision-log.md`。
3. `build-spec` → `spec.md`；`build-plan` → `plan.md` + `tasks.md`。
4. `build-code`：逐 phase 循环 RED → 实现 → GREEN → 测试 → 审查 → finding 处置 → 修复。
5. `verify-code`：当前实现的一次架构审查 + 一次异源代码 review + finding 处置。
6. `close`：用户单独授权后 commit / archive / merge / push / cleanup，并物理读回。

本任务要改的是这条旅程里的**执行成本**，不是它的阶段划分。**S1/S2 在第 4、5 步的具体触点**：① 派发前——主会话先做 dispatch 前置检查（预算/健康/身份），被拦下时只记录 `blocked_before_dispatch`，不进入 provider 等待；② 派发中——runtime 内部用 broker `start`/`status` 接管等待与恢复，主会话只收到一次调用结果（不 sleep、不轮询）；③ 结果落盘——非材料写入不再作废结果，材料变化仍记 `REVIEW_SOURCE_DRIFT` 并保留已完成成员事实；④ 主会话——只做交互/派发/整合/裁决，探查、测试、审查由窄上下文 worker 执行并只回 `结论+ref+hash`；⑤ 测试——第 4 步的测试命令按 `test runtime profile` 分层（本次只交付契约与画像，不改造 fixture）。阶段数、阶段职责、门禁语义不在改动范围。

### 页面范围（UI applicability，已定稿）

三个来源都指向非 UI：原始需求只谈执行/审查/测试/close 的工程成本（无任何页面或交互诉求）；仓库盘点显示本仓无 web 前端应用（无 `src/`、`apps/`、前端框架依赖），前端能力体现在面向消费者项目的 `skills/` 技能族；本任务的计划改动落在 `runtime/`、`skills/wh-review/`、`workflows/`、`tests/` 与文档，不新增页面。最终结论在 step 11 前按三输入规则重算并写入 `## UI applicability`。

### 数据状态（本阶段必须形成）

| 对象 | 状态集合 | 现在由谁产生/消费 |
| --- | --- | --- |
| review 请求 | `initial` / `focused` / `phase`（校验器还认 `narrow_diff`，无生产者） | 生产者 `review-record-route.mjs:572-573`；校验器 `stage-content-evidence.mjs:254` |
| provider 结果 | `completed` / `failed` / `cancelled` | broker `3rd-review`（`broker.mjs:59,255,284`）→ caller 逐条落盘（整组返回后） |
| 审查聚合 | `available` / `available-with-failures` / `unavailable` | `simple-review-runner.mjs:548-581`；`unavailable` 绝不等于 pass |
| 规范 review 结果 | `clean` / `resolved` / findings | `review-record-route.mjs:764-771`；完成判据只接受 `recorded` + `clean|resolved` |
| 事实新鲜度 | `current` / `stale`（事实级全有全无） | `freshness.mjs:706-768`；例外：verify-code `code_review` + `resolved` 可跨 tree |
| 阶段 outcome | 绑定 task/stage/run/attempt/material/snapshot/manifest/producer | `stage-agent-outcome-adapter.mjs:641,744-790` |
| task store 读模型 | `quality/facts/<digest>.json`、`quality/evidence/stage-outcomes/`、`quality/reviews/{attempts,results}`、`quality/tests/` | 权威读模型；`facts.jsonl`/`index.json`/`verify.json` 是 legacy 或 stub |
| broker 运行态 | `/tmp/3rd-review/<runtime_id>/state.json` + `raw/<provider>/*.stdout|stderr` | broker 自己维护；公共 ref 只导出 sha256 |

### 状态与唯一写入者（FND-007 修复）

| 状态 | 含义 | 唯一写入者（既有） | 允许的转移 | 下游可消费 |
| --- | --- | --- | --- | --- |
| `blocked_before_dispatch` | 未花 provider 调用即判定本次不可执行 | `review-record-route.mjs`（`recordSimpleReviewRequest`） | → `unavailable`（记录 attempt） | 不可当 pass |
| `dispatched` / `running` | 已派出，未终态 | broker 运行态（`/tmp/3rd-review/<runtime_id>/state.json`） | → `completed` / `failed` / `cancelled` | 不可消费 |
| `completed`（per-provider） | 单个 provider 已产出 | **两个不同存储、各自唯一写入者**：broker 只写自己的运行态（`/tmp/3rd-review/<runtime_id>/state.json` + raw，不进 task store）；WorkflowHub task store 的成员事实唯一写入者是 `review-record-route.mjs` 的 create-only 落盘 | → 聚合 | 是（仅作成员事实） |
| `partial` | 至少一个成员可用、至少一个失败 | `simple-review-runner` 聚合 | → `available` 事实 | 是，但永不等于 pass |
| `available` / `unavailable` | 聚合语义结果 | `review-record-route.mjs` | → canonical result | `available` 才可被下游引用 |
| `drift`（`REVIEW_SOURCE_DRIFT`） | dispatch 期间材料/树变化 | `review-record-route.mjs:616` | → 丢弃或按新身份重挂（S1 目标） | 当前：不可消费且无 attempt |
| canonical result `clean` / `resolved` / findings | 被记录的审查结果 | `review-record-route.mjs` 唯一 publication | → 完成判据 | 是 |
| 完成判据 | 只接受 `recorded` + `clean|resolved` 且身份当前 | `completion-predicates.mjs` | — | 决定 `completed` |
| disposition | `fixed` / `rejected_invalid` / `accepted_risk` / `needs_human`（闭集） | 各 stage 材料 | — | 不得新增第五个 |

页面范围：`none`（本任务不改任何页面）。入口只有 CLI/route：`task-bootstrap`、`stage-runtime`（`doctor`/`status`/`run`/`review`/`verify`/`confirm`/`authorize`）、`wh-review-cli`、broker `3rd-review` 的 `doctor`/`run`/`start`/`status`/`cancel`。

### 不确定性登记

| uncertainty_id | 不确定性 | 影响 | 谁解决 |
| --- | --- | --- | --- |
| U-001 | 本次任务的交付单元大小（只修 review 入口 / review 链整体 / 全面改造 / 先修测试） | 直接决定是否会重演复盘警告的「单任务过大」 | 用户（Talk R1） |
| U-002 | 「窄修复不再整包重审」的边界判定规则（文件集子集？独立窄审查？人工确认？） | 决定是否可能被滥用成假 resolved | 本阶段 + 独立建议审查 |
| U-003 | preflight 阈值来源（provider 真实 context 上限、文件/字节预算） | 阈值靠猜就会误杀正常 review | 本阶段核实（子代理事实） |
| U-004 | 慢测试根因与改造量（acceptance 类 600–900s） | 决定是否纳入本次任务、还是独立任务 | 子代理事实 + 用户 |
| U-005 | 事实发布断裂的真实位置（facts.jsonl=0 / index 空 / verify.json unknown） | 决定 review 结果能否被下游消费，是否与 review 链耦合 | 子代理事实 |
| U-006 | 是否需要真正的异步 job 控制面，还是「一次有界阻塞调用 + 增量落盘」就够 | 决定是否新增控制面（宪法要求登记 owner/consumer/删除条件） | 宿主能力核实 + 用户 |

## 方案候选（程序级，待 Talk R2/R3 与审查收敛）

用户 R1 回复要求「abc 都要」并新增「上下文管理 / 子代理委派 / 并行派发」轴。为避免重演复盘的「单任务过大」，把整体目标拆成 5 个可独立交付、可独立验证的接缝（seam），本次任务只交付其中一个（或两个），其余登记为延期项与触发条件。

| seam | 目标 | 关键机制（候选） | 可证伪验收 | 依赖 |
| --- | --- | --- | --- | --- |
| S1 review 派发边界与结果耐久 | 注定失败的审查不派出；外层被杀后已完成 provider 结果不丢、可复用；**审查期间写材料不再作废整次结果** | caller 侧 per-provider token/上下文预算 + 健康接线（复用 brokerProbe 与已有输入边界）；用 broker 已有 `start`/`status` 恢复已完成成员（ADR 0007:51 已定未实现）；**解耦 `REVIEW_SOURCE_DRIFT`（按 dispatch 冻结的材料包身份校验）**；补齐上下文溢出与超时分类；按 seam 分片；新增 ADR 0025 显式修订 ADR 0007:34-35 与 standard-workflow.md:82 | 预检 ≤5s 返回具体原因且零 provider 调用；模拟外层 kill 后已完成结果仍可读回并复用；dispatch 期间写非材料文件不再丢弃结果 | 无 |
| S2 主会话派发者模式与上下文经济 | 主会话只做交互/派发/整合/裁决；研发、测试、审查在窄上下文子代理里做 | 内容寻址任务切片 brief（目标/允许文件/输入/返回 schema/禁止继承历史）；worker 有界返回（结论+ref+hash）；并行上限与依赖排序；主会话禁止内联长输出 | root token 占比 <25%；长任务 ≤3 个 meaningful 事件、无 sleep/poll；brief 自足率 100% | 无（但与 S1 同任务时验收要分列） |
| S3 测试反馈环回到分钟级 | inner ≤120s、phase ≤300s；final/CI 只跑一次 | hermetic fixture 替换真实 git/子进程；放开并行度；按内容闭包 hash 复用；flaky 治理 | 目标测试集合实测 p95 达标 | 无 |
| S4 任务切片与预算闭合 | 单任务有可执行大小上限；预算只有一个不可绕过的裁决点 | 切片软上限写成可检查规则；`narrow_diff` 补生产者或删除；关闭 result-only / 裸 CLI 旁路 | build-plan lint 能拒绝超限卡；预算旁路关闭后仍可重放 | 无 |
| S5 repair delta 与事实小修 | 窄修复 → 一等 `resolved` 证据；AC 事实不再被无关材料变动打 stale；close 记录不自相矛盾 | repair delta 绑定原件；per-AC 事实加 material-only 容忍；close 分离 plan prediction 与 execution result；对齐 `verify.json` 权威声明与 writer | 合同测试 + 一次窄修复复跑 | 建议在 S1 之后 |
| S6 Phase 循环瘦身与 RED/GREEN 证据卫生 | 每个 Phase 的 RED/GREEN/capture/review/finding-repair 成本可接受；Phase review 可复用 | RED 只留简要 failure signature；证据按 consumer 去重；phase review 结果可被后续 phase 复用 | phase 证据数量与耗时画像；review 复用率 | 依赖 S1 |
| S7 事实小修与 close 最终态表达 | `verify.json` 权威声明与 writer 对齐；close 四域显示；cleanup 记录不再自相矛盾 | 对齐声明或补 writer；close 记录分离 plan prediction / execution result；cleanup 补做用独立事件 | 合同测试 + 一次 close 读回 | 独立 |

**不新增 gate、不新增第二 store、不改阶段划分**：每个 seam 都走现有 owner 与唯一 publication 路径；新控制面（若有）在 build-spec/plan 登记 owner、consumer、测试、删除条件。

### 复盘条目 → 处置（完整覆盖矩阵，逐条，不静默丢弃）

用户 R2 回复要求「原始需求文件中不止 S1 和 S2 的问题，请仔细阅读检查」。以下把复盘文档中**每一条**可识别的问题/建议逐条映射到处置；未落入本次任务的都写明 seam 与触发条件。

| # | 复盘条目（出处） | 处置 | seam |
| --- | --- | --- | --- |
| B1 | 单任务范围过大：83 文件 / 9063 行 / 20 AC / 16 卡 / 跨 5 子系统（L85-95） | 延期：写成可检查的切片上限 | S4 |
| B2 | 把阶段内审查和证据采集乘到每个 Phase（L97-107） | 延期：Phase 循环瘦身 | S6 |
| B3 | 测试集合已慢到不能当内循环（L109-126） | 本次只做性能画像 + 分层契约；实际改造延期 | S3（契约切片并入本次 S2） |
| B4 | RED/GREEN 证据与真实诊断混在一起，文件名带人工语义（L127-135） | 延期：RED 只留简要 failure signature | S6 |
| B5 | 主会话承担过多轮询与整合（229 sleep / 259 wait_agent / 228 write_stdin，L137-152） | **本次处置** | S2 |
| B6 | Phase review 形成「付费等待、不能复用」的中间层（L154-164） | 本次处置入口与耐久；可复用性随 S5/S6 收敛 | S1 + S6 |
| V1 | 五次 verify attempt 的真实序列（L168-203） | **本次处置**：让 producer 能在合理成本内产出可认证语义结果 | S1 |
| V2 | 输入体积失控：665KB / 624KB diff / 73 文件 / Grok 122 万 input token（L205-215） | **本次处置**：per-provider token/上下文预算 + 按 seam 分片 | S1 |
| V3 | 外层 timeout 杀掉仍可能成功的 provider（L217-221） | **本次处置**：用 broker 现有 `start`/`status`，已完成结果可恢复 | S1 |
| V4 | 错误分类过粗：prompt too long→health failed；response timeout→process nonzero（L223-233） | **本次处置**：补齐上下文溢出与超时分类 | S1 |
| V5 | 成功结果没有可持续的「修复后 resolved」链（L235-251） | 延期：一等 repair delta | S5 |
| V6 | retry budget 既不完整又可绕过（L253-257） | 延期：预算唯一裁决点（含 `narrow_diff` 生产/删除） | S4 |
| V7 | completion predicate 没错，producer 链没完成（L259-269） | **本次处置** | S1 |
| C1 | close 职责不含质量漂白（L282-302） | 保持现状（非目标） | — |
| C2 | close 暴露的质量空洞：verify.json 权威声明无 writer（L304-321，经 F-018 修正） | 延期：事实小修 | S7 |
| C3 | close 自身状态一致性瑕疵：`worktree_cleanup=true` 与 `cleanup.skipped=true` 并存（L323-337） | 延期：最终态表达 | S7 |
| T1 | token 放大器 1：root 主会话持续 25 小时（L351） | **本次处置** | S2 |
| T2 | 放大器 2-4：子代理继承完整历史 / 重新读仓与材料（L352-355） | **本次处置**：brief 自足、禁止继承历史 | S2 |
| T3 | 放大器 5：长测试与 broker 通过高频 polling 回传（L356） | **本次处置**：有界事件 + 不内联长输出 | S2 + S1 |
| T4 | 放大器 6：每次 source/material 改动后重新构造和审查大包（L357） | 本次部分处置（分片/预算）；复用延期 | S1 + S5 |
| P1 | 细计划内部漂移（phase_review result_ref_pattern 与真实返回不一致，L107） | 延期：build-plan lint | S4 |
| P2 | 定义 evidence path 但 facts/index/current selector 没消费（L363-374 表） | 经 F-018 修正：读模型本身是满的；仅 verify.json 声明问题 | S7 |
| P3 | 定义 retry budget 但 route 与 validator kind 不闭合（L369） | 延期 | S4 |
| P4 | 定义新鲜度但把所有 source/material edit 都提升为 full-review 失效条件（L370） | 延期：repair delta + AC 事实容忍 | S5 |
| P5 | 最终三分片只是把超时任务切开，没消除慢测试与重复覆盖（L371） | 延期 | S3 |
| O1 | 优化方案 1：review 在昂贵 dispatch 前可判定（L412-432） | **本次处置** | S1 |
| O2 | 优化方案 2：review 改异步 job、增量持久化、外层 timeout 不抹掉已完成成员（L434-446） | **本次处置**（用 broker 现有 `start`/`status`，不新造协议） | S1 |
| O3 | 优化方案 3：review + repair delta + disposition（L448-464） | 延期 | S5 |
| O4 | 优化方案 4：重做任务切分规则（L466-480） | 延期 | S4 |
| O5 | 优化方案 5：测试回到分钟级（L482-499） | 本次只做契约与画像 | S3 |
| O6 | 优化方案 6：统一 current fact 写入与 close 读模型（L501-519） | 经 F-018 修正后缩小为事实小修；orphan 诊断保留为候选 | S7 |
| O7 | 优化方案 7：压缩 agent 上下文（L521-542） | **本次处置** | S2 |
| O8 | 优化方案 8：修复 close 最终态表达（L544-549） | 延期 | S7 |
| N1 | 建议的新执行流程 5 步（L551-580） | 由 S2（派发/上下文）+ S4（切片）+ S1（review 门）+ S5（repair）+ S7（close）共同实现 | 跨 seam |
| N2 | 运营指标 10 项（L582-596） | 采纳为**程序级指标**，按 seam 分配到验收；本次至少覆盖 preflight <5s、polling ≤3、root context <25%、trees ≤5-8 | 跨 seam |
| N3 | 建议实施顺序 7 步（L598-606） | 采纳为程序执行顺序；本次对应其第 1 步（preflight/错误分类/增量持久化）与第 7 步中的上下文部分 | 跨 seam |
| N4 | 根因树 6 分支（L376-408） | 全部映射到 S1-S7；无未处置分支 | 跨 seam |

**结论**：本矩阵共 **37 项**（B1-B6=6、V1-V7=7、C1-C3=3、T1-T4=4、P1-P5=5、O1-O8=8、N1-N4=4），逐条列出、无静默丢弃。**更正**：step 10 审查材料里曾写「40 项」，是计数错误（实际 37），此处以 37 为准。本次处置 B5/B6/V1-V4/V7/T1-T3/O1/O2/O7 + per-AC 容忍（原 S5 的一部分，见 D-006），其余进入 S3-S7 并在「风险与延期交接」表逐条带 owner/触发条件/最小交付物/验收证据。

### 本阶段钉死的契约（不留给 build-spec 补）

| 契约 | 钉死内容 | 依据 |
| --- | --- | --- |
| drift 唯一转移 | dispatch 期间**非材料文件写入**：不触发漂移，结果正常记录；dispatch 期间**材料文件变化**：触发 `REVIEW_SOURCE_DRIFT`，写一条 `unavailable` attempt 并保留已完成成员事实（不再静默丢弃、不再只有两种未决选择） | D-005；F-021 |
| per-AC 容忍规则 | AC 事实容忍 `material_revision` 变化，**不容忍** `snapshot_tree`、证据 hash、AC 结果本身变化；容忍后事实仍标记来源 revision | D-006；F-017 |
| test runtime profile | 三个必填属性：时长上限、能力许可（网络/DB/文件系统/子进程）、运行位置（本地/CI）。`inner`=≤60s 且四项能力全禁；`medium`=≤300s 仅 localhost；`large`=仅 CI。与 `test tier`（simple\|feature\|fullstack）正交，不复用其名 | GQ2；R-EXT-03 |
| fan-out 预算 | 并行只读 worker 上限 3（硬顶 6）；写阶段串行（同一时刻 1 个写者）；单 worker 返回 ≤500 字 + ref + hash；每个 phase 的 worker 数 ≤6，超限停手报告 | D-002；R-EXT-01 |
| 复跑对象选择规则 | 当前任务不执行真实任务复跑；P6 只消费当前认证 task 的本地 targeted facts。真实任务与 host telemetry 仍可在后续独立验证中补齐，不作为本次完成依据 | D-008 → D-011 |

### 领域文档核对（grill-with-docs 前置输入，只读子代理）

**关键结论：S1/S2 的大部分「新机制」在仓内已经存在，问题不是缺机制，而是已有机制没被遵守/没被接线。** 因此 S1/S2 的措辞与交付物必须改为「补齐与强制已有机制」，不得再造重复控制面。

| id | 发现 | 证据 | 对方向的影响 |
| --- | --- | --- | --- |
| G-001 | 内容寻址 brief 已存在：`stage-input-packet.v1` + `packet_freeze_hash`，主会话只保留 ref/hash/≤500 字摘要 | `workflows/build-plan/SKILL.md:75-81`、`workflows/build-spec/SKILL.md:92-98`、`AGENTS.md:15`、`workflows/make-decision/SKILL.md:327` | S2 不新建 brief 机制，改为强制使用已有 packet + 补齐缺口 |
| G-002 | dispatch 前预算已存在：输入边界 + 330KiB 上限 + 「必须在 dispatch 前失败」 | `skills/wh-review/scripts/review-input-bounds.mjs:3-8`、`skills/wh-review/contracts/build-code.md:63` | S1 不新建 preflight，改为补 token/上下文维度与健康维度 |
| G-003 | broker 健康探测已存在：`brokerProbe` | `skills/wh-review/scripts/third-review-host-config.mjs:507` | S1 只做接线与失败分类，不新建探测 |
| G-004 | 测试分层已存在：`test tier = simple|feature|fullstack` | `skills/test-routing-advisor/SKILL.md:3,33` | **命名冲突**：时长分层不得复用 `test tier` 一词，须作为其子属性或另起名 |
| G-005 | `dispatcher` 是仓内**明确拒绝**的概念 | `workflows/build-code/SKILL.md:80`、`skills/wh-review/contracts/build-plan.md:59`、`specs/archive/workflowhub-review-flow-repair-20260906/plan.md:19` | S2 不得自称 dispatcher；沿用「阶段协调 / 主会话 / 工头」等既有词 |
| G-006 | `resolved` 已是 verify-code 结果，且四个 disposition 是闭集 | `workflows/verify-code/SKILL.md:86,113`、`CONTEXT.md:82` | S5 不得新增第五个 disposition；只能把 `resolved` 语义写清 |
| G-007 | ADR 0007 明文：「packet-plan 不设 byte/token/时间/输出量/文件数上限，也不参与放行判断」；且「对同一 request ID 轮询公共 status，不用外层 wall-clock 预算取消健康审查」 | `docs/adr/0007-...:34-35,51` | **S1 的预算检查会反向推翻 ADR 0007**；S1 的 start/status 恢复恰好是 ADR 0007 已定但未实现的设计 |
| G-008 | ADR 0007 已定义 repair resolution：记录 resolution + 聚焦验证，不自动再 dispatch | `docs/adr/0007-...:76-78` | S5 是补齐 ADR 0007 的既定语义，不是新机制 |
| G-009 | ADR 0011：同 subject/materials/chain/policy 复用既有结果；run metadata 不是复用身份 | `docs/adr/0011-...:16` | S1 的复用必须按 ADR 0011 身份，不得用 runtime_id 当复用键 |
| G-010 | ADR 0021：stage-reflection 不做独立子代理、不读 transcript 全文 | `docs/adr/0021-...:17-19` | S2 的派发规则必须为 stage-reflection 保留例外 |
| G-011 | `docs/standard-workflow.md:82`：「时间和 token 只作诊断 … 不设统一预算 gate」 | `docs/standard-workflow.md:82` | S1 的预算检查必须表述为 **dispatch 前置条件**（不参与放行判断），并走 ADR 修订 |
| G-012 | broker CLI 真实契约（从 usage 与代码核实）：`start --request-id`、`status --runtime-id`、`cancel --runtime-id` 均存在 | `3rd-review/scripts/3rd-review.mjs:11,54-62` | 出口检查 (i) 可解决：能力真实存在，只是 workflowhub 的适配层没用 |
| G-013 | 出口检查 (ii)/(iv) 未过：`test tier` 命名权威冲突；本方向尚无写死的「不做什么」 | 见 G-004；`specs/archive/workflowhub-review-flow-repair-20260906/plan.md:19` 先例 | 必须在本阶段钉死命名与范围边界 |

**grill 四项退出检查最终状态（GQ2/GQ3 裁决后）**：(i) 外部接口核实 = 通过（G-012，读的是真实 CLI 契约而非文档假设）；(ii) 命名唯一权威 = 通过（GQ2 裁决另立正交的 `test runtime profile`，不复用 `test tier`；D-009 钉死命名约束）；(iii) 失败语义 = 通过（unavailable 永不等于 pass，且不阻断修复）；(iv) 范围边界 = 通过（「非目标」节已定稿并写明 owner）。四项全部通过，与 grill_summary 的 `exit_checks` 一致。

**ADR 判断（三项判据）**：S1 的预算/健康 dispatch 前置条件——难以反转（反向推翻 ADR 0007:34-35 与 `standard-workflow.md:82`）、无背景会意外、存在真实取舍——**三项全真，需要一个新 ADR（0025）**；(b)/(c) 类内容多为已有机制，只需 CONTEXT.md 修订，不建新 ADR。



## 非目标

- 不新增第六个 stage、不新增 gate、不新增第二 store 或双写（R-024）。
- 不把 `unavailable`/`incomplete`/`unknown` 改写成通过，不伪造证据（R-007、R-024）。
- **非目标（已定稿，非候选）**：不改 3rd-review 内部 provider 协议本身——本次只消费其既有 `doctor`/`run`/`start`/`status`/`cancel` CLI 契约，任何需要改 broker 内部的改动一律另开任务（owner=broker 维护者）。
- **非目标（已定稿，非候选）**：不在本任务改 close 的授权语义与不可逆动作边界——本次只登记 close 最终态表达为 DEFER-S7，不改授权流程（owner=close 维护者）。
- 不用「只改文档措辞」冒充执行成本下降（失败边界）。
- **不新建与已有机制重复的控制面**：内容寻址 brief 已有 `stage-input-packet.v1`；dispatch 前边界已有 `review-input-bounds`；健康探测已有 `brokerProbe`；测试分层已有 `test-routing-advisor`（G-001..G-004）。
- **不引入被仓内明确拒绝的命名**：不得把主会话改称 `dispatcher`（G-005）；不得为时长分层复用 `test tier` 一词（G-004）；不得新增第五个 disposition（G-006）。
- **不把预算检查做成放行 gate**：只作 dispatch 前置条件，不参与放行判断；若与 ADR 0007 冲突，走 ADR 修订而不是静默推翻（G-007、G-011）。

## 决定

> 每个条目使用 `decision-entry.v1` 字段；`module/requirement_ids/derived_from/artifacts` 是文本层链记录，不是运行时门禁。

### D-001 程序拆成 7 个接缝，本次交付 S1 + S2 + per-AC 容忍

- question/final_option: 一次做完所有复盘问题，还是拆成可独立交付的接缝？→ 拆 7 接缝，本次交付 S1+S2，并把 per-AC 容忍前移进本次。
- recommendation/plain_language: 推荐。「都要做」不等于「一次做完」；上次失败就是一次打包。
- decision: 程序固定 S1-S7；本次交付 S1（review 派发边界与结果耐久，含漂移解耦与 ADR 0025）、S2（主会话编排与上下文经济，完整实现）、per-AC material-only 容忍；S3-S7 延期并带 owner/触发条件。
- source_type/reference/exact_excerpt: 用户 T-004「我选C，但是原始需求文件中不止S1和S2的问题，请仔细阅读检查」；T-008「B. 前移进本次范围」；GQ1「B. S2 保持完整实现」。
- approval_binding: 待 step 11 用户确认（host-visible ref/hash）。
- facts_and_constraints: 复盘 L85-95（83 文件/9063 行/20 AC/16 卡）；R-EXT-02（文件数 ≤10、目标 ≤5；METR 时长拐点）。
- Logic: 单任务过大 → 上次失败 → 约束=不得再打包 → 选择=拆 7 接缝 + 本次 3 个工作流 → 预期=每个工作流可独立验证。
- choice_reason/impact: 用户明确要求全做但接受分次；影响=任务面显著变大，必须由 build-plan 的切片检查兜住。
- consequences_and_risks: 代价=整体收益分次交付；风险=RISK-001（本次 3 个工作流仍可能过大），处置=build-plan 可执行切片检查，超限即拆。
- rejected_alternatives: 只做 S1（用户否）；只做 S2（用户否）；一次做 5 个（复盘警告）；S2 降级为契约（GQ1 用户否）。
- unresolved_items/owner: 若 build-plan 判定超限需拆，由用户裁定拆分点。
- Supersedes: none
- module: scope
- requirement_ids: [R-002, R-008, R-017]
- derived_from: []
- artifacts: [spec.md#范围]

### D-002 主会话只做四件事，实现阶段唯一写者

- question/final_option: 主会话自己做多少活？→ 只做交互、派发、整合、裁决；探查/测试/审查派给窄上下文子代理；实现阶段唯一写者，不并行写。
- recommendation/plain_language: 推荐。主会话像工头：说话、派活、收摘要、做裁决；不亲自搬砖，也不让多人同时砌同一面墙。
- decision: 采纳 T-005 选择 A，并叠加研究约束「读并行、写串行」。
- source_type/reference/exact_excerpt: 用户 T-005「A. 只做四件事 + 写保持单线程」；R-EXT-01。
- approval_binding: 待 step 11。
- facts_and_constraints: 复盘 root 4.61 亿 token（约 51%）、229 sleep / 259 wait_agent / 228 write_stdin；R-EXT-04（成本不是主杠杆、质量才是）。
- Logic: root 占一半 token → 主会话上下文必须小 → 选择=四件事 + 引用式返回 + 写单线程 → 预期=root 占比 <25%、无 sleep/poll。
- choice_reason/impact: 研究一致支持；影响=所有阶段执行方式。
- consequences_and_risks: 代价=派发有开销（约 7× token），需 fan-out 预算；风险=把写也并行会冲突（已禁止）。
- rejected_alternatives: 主会话可做小改动（滑坡）；不设红线（等于复盘前状态）。
- unresolved_items/owner: fan-out 预算数值待 build-plan。
- Supersedes: none
- module: execution-model
- requirement_ids: [R-005, R-013, R-020]
- derived_from: [D-001]
- artifacts: [spec.md#FR-execution-model]

### D-003 不重复造已有机制；S1/S2 以「补齐 + 强制」为主

- question/final_option: 新增机制还是补齐已有机制？→ 后者。
- recommendation/plain_language: 推荐。内容寻址 brief、dispatch 前边界、健康探测、测试分层都已存在；问题是没被遵守，再加一套只会更重。
- decision: S1/S2 一律先复用已有 owner 与唯一 publication；只补确认缺失的维度（token/上下文估算、已完成结果恢复、上下文经济强制）。
- source_type/reference/exact_excerpt: G-001..G-004；CONSTITUTION.md:172；AGENTS.md:47。
- approval_binding: 待 step 11。
- facts_and_constraints: 治理「没有当前消费者的重复控制面不新增」。
- Logic: 已有机制存在但没被遵守 → 不得重复造 → 补齐+强制 → 预期=不新增控制面即可降本。
- choice_reason/impact: 直接对应治理约束；影响=交付物形态（接线与检查为主）。
- consequences_and_risks: 代价=必须写「可执行强制」；风险=强制被误读成新 gate（须写明不参与放行判断）。
- rejected_alternatives: 新造 brief/健康探测/分层。
- unresolved_items/owner: 强制的落地形态待 build-spec。
- Supersedes: none
- module: mechanism-reuse
- requirement_ids: [R-024]
- derived_from: [D-001]
- artifacts: [spec.md#FR-mechanism-reuse]

### D-004 S1 的 token/健康检查 = dispatch 前置条件，并新增 ADR 0025 只改两条冲突点

- question/final_option: 预算/健康检查是放行 gate 还是 dispatch 前置条件？→ 前置条件，且显式修订 ADR。
- recommendation/plain_language: 推荐。它只回答「这趟值不值得花 provider 调用」，不回答「阶段算不算通过」。
- decision: 失败记录 `blocked_before_dispatch` 与具体错误码，不参与放行判断；新增 ADR 0025 只修订两条冲突点（ADR 0007:34-35 的上限禁令、standard-workflow.md:82 的不设预算 gate）；ADR 0007:51 的 status 轮询在 S1 材料单独说明。
- source_type/reference/exact_excerpt: 用户 T-007「A. 硬前置 + 显式修订 ADR」；GQ3「A. 只改两条冲突点」；G-007/G-011。
- approval_binding: 待 step 11。
- facts_and_constraints: 既有 `blocked_before_dispatch` 语义（`review-record-route.mjs:559,578,590`）；已登记的 330KiB 硬边界。
- Logic: 昂贵动作前判定 ≠ 放行判断 → 前置条件 + ADR 修订 → 预期=不新增 gate 且不静默推翻旧决定。
- choice_reason/impact: 兼顾治理与目标；影响=runtime + 治理文档。
- consequences_and_risks: 代价=多一份 ADR 与措辞要求；风险=表述不清被读成 gate。
- rejected_alternatives: 直接加硬门；只作诊断（用户否）；推迟到 S4（用户否）；静默改代码不修 ADR。
- unresolved_items/owner: ADR 0025 标题与正文待 build-spec。
- Supersedes: none
- module: review-dispatch
- requirement_ids: [R-014, R-024]
- derived_from: [D-003]
- artifacts: [spec.md#FR-review-dispatch, docs/adr/0025-*.md]

### D-005 S1 纳入 REVIEW_SOURCE_DRIFT 解耦

- question/final_option: 是否把落盘校验从「工作区动态文件硬比对」改为「按 dispatch 冻结的材料包身份校验」？→ 纳入 S1。
- recommendation/plain_language: 推荐。本次实测里，只写了一次 decision-log 就让 40 分钟的审查结果全废；只做恢复不改校验，恢复回来的结果还会被再丢一次。
- decision: S1 交付漂移校验解耦：非材料写入不再触发漂移；材料本身变化仍照旧判定。
- source_type/reference/exact_excerpt: 用户 T-009「A. 纳入 S1」；F-021 实测；FND-002。
- approval_binding: 待 step 11。
- facts_and_constraints: `review-record-route.mjs:616`；broker 侧 3 个 runtime 4/4 completed；task store 无 attempt。
- Logic: 实测结果被丢弃 → 恢复能力形同虚设 → 解耦校验 → 预期=审查期间写非材料文件不再作废结果。
- choice_reason/impact: 唯一能兑现成功边界的选择；影响=runtime/review。
- consequences_and_risks: 代价=S1 范围略增；风险=「什么算材料写入」必须定义清楚。
- rejected_alternatives: 不纳入并删承诺；只做最小解耦（用户否）。
- unresolved_items/owner: 材料写入边界定义待 build-spec。
- Supersedes: none
- module: review-durability
- requirement_ids: [R-015, R-016]
- derived_from: [D-004]
- artifacts: [spec.md#FR-review-durability]

### D-006 per-AC material-only 容忍前移进本次

- question/final_option: per-AC 事实容忍留在 S5 还是前移？→ 前移进本次。
- recommendation/plain_language: 推荐（用户裁定）。否则「一次真实小任务复跑」可能在终态被 AC missing 挡住。
- decision: 本次交付 per-AC 事实的 material-only 容忍；S5 缩小为 repair delta + resolved 链。
- source_type/reference/exact_excerpt: 用户 T-008「B. 前移进本次范围」；FND-001（RED-1）。
- approval_binding: 待 step 11。
- facts_and_constraints: F-017（per-AC 事实缺 material-only 容忍，`freshness.mjs:271-272,714-726`）。
- Logic: 复跑需要走通终态验收 → AC 事实不能因无关材料变动 stale → 前移 → 预期=复跑可闭环。
- choice_reason/impact: 用户裁定；影响=freshness 语义与测试。
- consequences_and_risks: 代价=范围扩大且动到判据；风险=容忍边界若过宽会掩盖真实 stale。
- rejected_alternatives: 保持延期（用户否）；先做最小实验（用户否）。
- unresolved_items/owner: 容忍的精确规则待 build-spec。
- Supersedes: none
- module: evidence-freshness
- requirement_ids: [R-011, R-019]
- derived_from: [D-001]
- artifacts: [spec.md#FR-freshness]

### D-007 S2 保持完整实现，并交付 test runtime profile 契约

- question/final_option: S2 交付深度？→ 完整实现。
- recommendation/plain_language: 推荐（用户裁定）。S2 的收益要在真实任务里才看得见，只交契约兑现不了。
- decision: S2 完整实现主会话编排与上下文经济规则；并交付测试运行画像 `test runtime profile`（与 `test tier` 正交）与一次不改行为的测试性能画像。
- source_type/reference/exact_excerpt: 用户 GQ1「B. S2 保持完整实现」；GQ2「A. 另立 test runtime profile」；FND-004/FND-006。
- approval_binding: 待 step 11。
- facts_and_constraints: R-EXT-01（读并行写串行、上限 3-5/6-8）；R-EXT-03（60/300/900s 分层）；F-011/F-012（测试热点与复用）。
- Logic: 上下文经济必须落到真实执行 → 完整实现 → 预期=root 占比下降、无 sleep/poll。
- choice_reason/impact: 用户裁定；影响=skills/workflows 与测试契约。
- consequences_and_risks: 代价=本次范围变大；风险=RISK-001。
- rejected_alternatives: 只交契约；整体拆成独立任务（用户否）。
- unresolved_items/owner: test runtime profile 的字段与检查待 build-spec。
- Supersedes: none
- module: execution-model
- requirement_ids: [R-013, R-018, R-020]
- derived_from: [D-002]
- artifacts: [spec.md#FR-execution-model, spec.md#FR-test-profile]

### D-008 验收：硬指标 + 一次真实小任务复跑

- question/final_option: 怎么证明做成了？→ 每个工作流给基线/阈值/观测来源/pass-fail，并做一次真实小任务复跑。
- recommendation/plain_language: 推荐。数字要有分母和窗口，复跑要能复现本次实测的漂移场景。
- decision: 验收按下列**内联指标表**执行（不引用外部编号）；复跑必须覆盖四项场景。
- **内联验收指标表**：

| seam | 指标 | 基线 | 阈值 | 分母/窗口 | 观测来源 | pass/fail |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | 派发前置拦截 | 1 次 40 分钟全废 | ≤5s 且 provider 调用=0 | 每次被拦请求 / 单次 | `blocked_before_dispatch` attempt + broker runtime 目录 | 满足=pass |
| S1 | 已完成结果可恢复 | 4/4 completed 但无 attempt | ≥1 成员可读回并复用 | 每次中断 / 单次 | attempt.json `provider_results` | 可读回且复用=pass |
| S1 | 非材料写入不漂移 | 写 1 次即作废 | 漂移 0 次 | 每次 dispatch / 单次 | 复跑 attempt | 结果被记录=pass |
| S2 | root 上下文占比 | 51% | <25% | root+直系子代理 input token / 任务全程 | host 会话日志按 agent 汇总 | 达标=pass |
| S2 | 主会话阻塞轮询 | 229 sleep / 259 wait / 228 write_stdin | 长任务 ≤3 meaningful 事件、sleep 轮询 0 | 主会话工具调用数 / 任务全程 | 主会话调用计数 | 达标=pass |
| S2 | worker 自足率 | 未测 | 100% brief 自足 + 100% 返回 ≤500 字+ref+hash | 本次派发 worker 数 / 单次任务 | brief 与返回记录 | 达标=pass |
| per-AC | 容忍生效 | AC 事实被无关材料变动打 stale | 容忍 material_revision、不容忍 snapshot_tree/证据 hash/AC 结果 | 每次材料变动 / 单次 | AC 质量事实 freshness 字段 | 容忍正确=pass |

- **复跑四场景**：① 注定失败的审查被 ≤5s 拦下且零 provider 调用；② 调用方中途被杀后已完成成员可读回复用；③ dispatch 期间写非材料文件（如 task store 证据）结果仍被记录；④ 无关材料变动后 AC 事实不再 stale。
- 样本量：n=1 真实任务 + 仓库内 fixture；不称统计显著，只称达到/未达到阈值。
- source_type/reference/exact_excerpt: 用户 T-002「A. 硬指标 + 一次真实小任务复跑」；FND-003/FND-008。
- approval_binding: 待 step 11。
- facts_and_constraints: 复盘运营指标表（L582-596）；R-EXT-03/04 的阈值。
- Logic: 无口径就无法验收 → 定义口径 + 复跑 → 预期=结论可证伪。
- choice_reason/impact: 用户裁定；影响=所有工作流的验收。
- consequences_and_risks: 代价=多一次真实任务；风险=复跑样本量 n=1，不称统计显著。
- rejected_alternatives: 只靠合同测试；只出诊断（用户否）。
- unresolved_items/owner: 复跑用哪个真实小任务待 build-plan。
- Supersedes: none
- module: acceptance
- requirement_ids: [R-023]
- derived_from: [D-001]
- artifacts: [spec.md#AC]

### D-009 命名约束

- question/final_option: 用哪些词？→ 不用 `dispatcher`、不把时长分层叫 `test tier`、不新增第五个 disposition。
- recommendation/plain_language: 推荐。仓里这些词已经有别的意思，或已被明确拒绝。
- decision: 主会话编排角色沿用「阶段协调/主会话」；时长与隔离分类命名 `test runtime profile`；disposition 保持四元闭集。
- source_type/reference/exact_excerpt: G-004/G-005/G-006；GQ2。
- approval_binding: 待 step 11。
- facts_and_constraints: `build-code/SKILL.md:80`、`CONTEXT.md:82`、`test-routing-advisor/SKILL.md:3`。
- Logic: 命名冲突会污染下游 → 钉死唯一名 → 预期=多处引用不歧义。
- choice_reason/impact: 治理与可维护性；影响=文档与任务卡。
- consequences_and_risks: 代价=需在 CONTEXT/技能层登记新词；风险=若 build-spec 另起名会造成第二套词汇。
- rejected_alternatives: 复用 test tier；新增第五个 disposition；用 dispatcher。
- unresolved_items/owner: 无。
- Supersedes: none
- module: naming
- requirement_ids: [R-024]
- derived_from: [D-003]
- artifacts: [spec.md#术语]

### D-010 延期项 S3-S7 的 owner 与触发条件

- question/final_option: 延期的 S3-S7 怎么管？→ 逐条写 owner、触发条件、最小交付物、验收证据。
- recommendation/plain_language: 推荐。只说「以后做」等于没说。
- decision: 见「风险与延期交接」表 DEFER-S3..S7；触发前不得改变本次 S1/S2 范围。
- source_type/reference/exact_excerpt: FND-006（RED-7/蓝4/蓝5）。
- approval_binding: 待 step 11。
- facts_and_constraints: 治理要求延期项带 owner/触发条件/消费者/关闭条件。
- Logic: 空头延期不可执行 → 逐条登记 → 预期=可审计。
- choice_reason/impact: 审查一致要求；影响=后续任务排期。
- consequences_and_risks: 代价=维护延期表；风险=触发条件若模糊会重新膨胀。
- rejected_alternatives: 保持占位声明。
- unresolved_items/owner: 无。
- Supersedes: none
- module: deferral
- requirement_ids: [R-022]
- derived_from: [D-001]
- artifacts: [plan.md#DEFER]

### D-011 本任务 P6 改用当前 task 本地 aggregate

- **question/final_option**：没有可授权的真实小任务和 host usage，是否继续让 P6 以真实复跑作为完成前置？→ 否；本任务改用当前认证 task 的本地 aggregate。
- **decision**：P6 的 acceptance command 只读取当前 worktree 的认证材料、当前实现和已经产生的 targeted test facts，逐 AC 生成实际 assertion。AC-COORD-001/004 的 host telemetry 缺失必须显式保留为 `unavailable`，本地 aggregate 只证明“缺失被正确暴露”，不宣称达到 live ratio/polling 阈值；真实任务、host usage 和 live 指标留作后续 evidence，不再阻塞本次代码与 verify-code。
- **source_type/reference/exact_excerpt**：用户 2026-09-09 回复：「我授权，调整P6验收契约，不需要真实任务测试了，继续想办法把别的阻塞和遗漏做完吧，直到所有开发任务完成，verify-code通过，可以close为止」。
- **approval_binding**：当前用户回复；本决策只改变本任务 P6 的验收输入，不改变“不伪造 unavailable/不新增 gate”的总约束。
- **facts_and_constraints**：P1-P5 targeted receipts 已存在且 exit=0；当前没有 `WORKFLOWHUB_REAL_TASK_ID`、`WORKFLOWHUB_REAL_TASK_PATH`、`WORKFLOWHUB_HOST_USAGE_REF`；`AC-COORD-001/004` 的 live 指标因此不可计算。
- **Logic**：把不可获得的真实任务当成必需输入会持续阻塞同 task 修复 → 改为可审计的本地合同 aggregate → 仍保留 live metric 缺失和后续验证边界。
- **choice_reason/impact**：用户明确授权；影响 spec/plan/tasks 的 P6 acceptance_data 与 harness，不改变生产运行时、public command 或 quality fact 的 unavailable 语义。
- **consequences_and_risks**：本次能判真本地事实与 AC 绑定，但不能声称真实任务或 live 指标达标；风险是把本地合同误读成真实运行证明，故输出必须带 `coverage_limits` 和 `unavailable` 原因。
- **rejected_alternatives**：继续等待真实 task；用 fixture 或合成 usage 冒充真实任务；把缺失 telemetry 默认成零或达标。
- **unresolved_items/owner**：真实任务与 host telemetry 的后续证据由用户/host instrumentation owner 负责；不阻塞本次实现和 verify-code。
- **Supersedes**：D-008 仅关于“真实任务复跑是本次 acceptance 前置”的部分；D-008 的硬指标定义仍保留作后续可复算口径。
- **module**：acceptance / build-code
- **requirement_ids**：[R-023]
- **derived_from**：[D-008]
- **artifacts**：[spec.md#AC-DELIVERY-001, plan.md#Phase-P6, tasks.md#T013]

### D-012 真实 provider 失败后的受认证 route repair 只增加一次预算

- **question/final_option**：同一材料修订的审查预算已由真实 provider 失败消耗，但宿主随后修复了实际路由，是否仍永久阻塞当前 task？→ 否；只允许一次由 canonical history 与宿主当前路由共同证明的 `route_repair` 重试。
- **decision**：扩展既有非 phase review budget validator 与 route，不新增 public command、gate、store 或 request 自报字段。候选前次 attempt 必须是同 task/stage/subject/material revision、已真实 dispatched、terminal unavailable/failed，且所有已选择 provider 都有受认证 failed/cancelled 成员事实、没有 semantic output；当前宿主重新计算的 `route_identity` 必须与前次 canonical attempt 不同。同一 material revision 最多消费一次 `route_repair`。`provider_attempts=[]`、blocked-before-dispatch、status/runtime/protocol/material/closure/drift/mismatch 错误均不合格；phase review 继续按每 revision 一次，不在本增量中扩展。
- **source_type/reference/exact_excerpt**：用户 2026-09-09 回复：「允许，纳入本任务，然后继续吧」。
- **approval_binding**：当前用户回复；仅授权把受限 retry 语义纳入本任务并继续实现/验证，不授权 commit、push、merge、archive、cleanup 或物理 close。
- **facts_and_constraints**：现有 route budget 只按 material revision/kind 计数；request key 与 canonical attempt 已有宿主派生 `route_identity`、dispatch state、terminal/error/provider facts；历史 `provider_attempts=[]` 的 unavailable attempt 不能证明真实 provider failure。
- **Logic**：真实路由修复改变可执行条件，但材料不一定改变 → 永久沿用已消耗预算会制造假阻塞 → 只信 canonical failed member facts 与宿主重算 route identity，并限制一次，可恢复同时避免调用方自报和无限重派。
- **choice_reason/impact**：最小扩展现有 budget seam；影响 `review-record-route`、budget validator、定向测试和最终 aggregate；不改变 review 质量语义。
- **consequences_and_risks**：错误放宽会导致重复 provider 调用；因此失败分类、route identity 差异、同修订单次上限任一不可认证即 fail closed。
- **rejected_alternatives**：把所有 unavailable 都当可重试；仅凭配置文件变化；允许 request 提交 `route_repaired=true`；提高所有审查轮次上限；修改材料制造新 revision。
- **unresolved_items/owner**：无方向性未决；实现阶段只需确定既有 canonical member 字段的精确读取路径。
- **Supersedes**：D-010 中 S4「单一预算 owner」仅关于本条阻塞的延期部分；其余切片预算工作仍延期。
- **module**：review budget / route
- **requirement_ids**：[R-026]
- **derived_from**：[D-003, D-005]
- **artifacts**：[spec.md#FR-REVIEW-005, spec.md#AC-REVIEW-006, plan.md#Phase-P3-R, tasks.md#T014]

## 三轮 talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001（R1 痛点优先） | 这次先消哪块痛：A review 白等白丢 / B 测试回到分钟级 / C 修完 finding 不用整包重审 | 见提问卡 | 用户原文：「abc都要，同时要解决build-code和verify-code阶段的上下文管理、子代理委派制度和并行派发制度」 | 新增一条高影响轴「编排/上下文/派发」；A/B/C 不再互斥，改为程序级范围 | 用户 2026-09-09 回复 |
| T-002（R1 成功标准） | A 硬指标 + 一次真实小任务复跑 / B 只靠合同测试 / C 只出诊断 | 见提问卡 | 用户选择：**A** | 验收口径锁定为「硬指标 + 真实复跑」 | 用户 2026-09-09 回复 |
| T-003（R1 是否需要调研） | A 只做窄核实 / B 完整外部调研 / C 跳过 | 见提问卡 | 用户原文：「我希望你对复杂任务执行提效、主会话派发者模式、子代理派发制度进行一些调研。提高效率和减少token消耗是我最看重的，主会话上下文管理很重要，不要一直在主会话执行所有task的研发、测试、审查工作，质量低，上下文比较满的时候消耗也很大」 | 触发 step 4 四路并行调研；新增最高优先轴「主会话上下文与派发」 | 用户 2026-09-09 回复 |
| T-004（R2 交付单元） | A 只做 S1 / B 只做 S2 / C S1+S2 | 见提问卡 | 用户原文：「我选C，但是原始需求文件中不止S1和S2的问题，请仔细阅读检查」 | **本次交付 S1+S2 两个接缝**；追加要求：对复盘做逐条覆盖审计（见上方覆盖矩阵）；S3-S7 登记延期 | 用户 2026-09-09 回复 |
| T-005（R2 主会话红线） | A 只做四件事 + 写单线程 / B 可做小改动 / C 不设红线 | 见提问卡 | 用户选择：**A** | 主会话边界锁定为「交互、派发、整合、裁决」；实现阶段唯一写者 | 用户 2026-09-09 回复 |
| T-006（R2 测试处置） | A 性能画像 + 分层契约 / B 直接改造 fixture / C 不动 | 见提问卡 | 用户选择：**A** | 本次只交付分层契约与性能画像；实际改造延期到 S3 | 用户 2026-09-09 回复 |
| T-007（R3 token 检查定位） | A 硬前置 + 显式修订 ADR / B 只作非阻断诊断 / C 推迟到 S4 | 见提问卡 | 用户选择：**A** | S1 增加「dispatch 前置条件 + 新增 ADR 0025 修订 ADR 0007:34-35 与 standard-workflow.md:82」；失败记录 `blocked_before_dispatch`，不参与放行判断 | 用户 2026-09-09 回复 |
| T-008（R3 per-AC 容忍） | A 保持延期 / B 前移进本次 / C 先做最小实验 | 见提问卡 | 用户选择：**B** | per-AC material-only 容忍**前移进本次**；S5 相应缩小为「repair delta + resolved 链」 | 用户 2026-09-09 回复 |
| T-009（R3 漂移解耦） | A 纳入 S1 / B 不纳入删承诺 / C 只做最小解耦 | 见提问卡 | 用户选择：**A** | S1 增加 `REVIEW_SOURCE_DRIFT` 解耦（按 dispatch 冻结的材料包身份校验） | 用户 2026-09-09 回复 |

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-001 复盘文档（只读） | 失败现象与规模 | 25h20m、8.9 亿+ token、build-code 11h46m、45 次正式测试约 203 分钟、16 次 canonical review、24 个 build-code tree、962 个 task store 文件但 facts.jsonl=0 | completed | N-001 |
| F-002 当前 review 调用链（`skills/wh-review/scripts/simple-review-runner.mjs`） | dispatch 边界与现有 preflight | 已有静态 preflight（route L472/选择 L480/必需材料 L492/禁止材料 L505）与 330KB 硬上限 `MATERIAL_TOO_LARGE`（L237-240）；材料 preflight 可跳过（L448-458）；**无 provider 健康探测** | completed | N-003 |
| F-003 输入边界（`review-input-bounds.mjs:3-8`） | 包体预算 | 仅 verify-code 生效：300KiB 输入 / 150KiB diff / 160KiB 内联 / 96KiB 上下文；**无 token 计数、无 per-provider context window 判定** | completed | N-003 |
| F-004 错误分类（`simple-review-runner.mjs:548-581`） | 真实错误 vs 记录分类 | 归一靠消息正则：`/prompt too long|input token limit|context length|token limit/` → `REVIEW_INPUT_TOO_LARGE`，`/timeout|timed out|deadline exceeded/` → `REVIEW_EXECUTION_TIMEOUT`；**broker 侧 Grok 上下文溢出被适配器写成通用 `PROVIDER_HEALTH_FAILED`（`3rd-review/lib/adapters/grok.mjs:40,42`），消息里没有上述关键词，正则不触发** | completed | N-003 |
| F-005 | 部分结果持久化（`review-record-route.mjs:723-731`、`simple-review-runner.mjs:680-687`） | 外层被杀时结果是否保留 | completed 成员逐条 create-only 落盘，但**只在整组返回之后**；调用抛错时 `provider_results: []`，已完成成员全丢；无增量落盘（`review-provider-client.mjs:93,98,316`）。**本阶段实测复现**：2026-09-09 00:56 起的 direction review，至 01:11 时 broker 侧 `antigravity/flash`、`codex/luna`、`pi/v4flash` 均已 `completed` 且结果已落 `/tmp/3rd-review/<runtime_id>/`，但 workflowhub 的 `run` 调用仍在阻塞等待 `grok/grok`，调用方拿不到任何已完成结果 | completed | N-003 |
| F-006 broker 能力（`3rd-review`，只读） | 是否已有异步 job | **已有 `start`（detached）+ `status`/`cancel`**；每个 provider 完成即写 `state.json` 与 raw stdout/stderr；`run` 是一次阻塞调用；`max_prompt_bytes` 配置存在但**未被使用**（`attachments.mjs:117`）；**无 token 估算、无 context window** | completed | N-003、U-006 |
| F-007 预算闭合（`review-record-route.mjs:572-573` vs `stage-content-evidence.mjs:254`） | retry budget 唯一裁决点 | 生产者只发 `phase|focused|initial`，校验器理解 `narrow_diff`（无生产者）；旁路：result-only record（`stage-runtime.mjs:684-688`）、裸 `wh-review-cli.mjs run`（L966）、smoke 工具 | completed | N-003 |
| F-008 包体组装（`wh-review-cli.mjs:466-470`） | 大 diff 是否分片 | 无条件计算**所有改动文件的完整 diff**，之后才压缩；无按 seam/模块分片、无 review scope 声明 | completed | N-003 |
| F-009 freshness（`freshness.mjs:706-768`、`601-607`） | 失效范围 | 事实级全有全无：任一依赖 stale 则整条事实 stale；例外：verify-code 的 code_review `review_status=resolved` 可绑定不同 snapshot_tree | completed | N-003 |
| F-010 repair 现状（`stage-agent-outcome-adapter.mjs:508`、`freshness.mjs:206-243`） | repair delta 是否已存在 | stage outcome 的 `code_review.result.repairs[]` 已存在，逐文件重算 reviewed tree→current tree 的 hash 并校验受影响测试 receipt；**缺一等持久 repair-delta 对象**，`resolved` 仅限 verify-code/code_review | completed | N-003 |
| F-011 测试热点（`vitest.config.mjs:14`、`acceptance-execution-tier.test.mjs:64-73,631-650`） | 慢的根因 | 全仓 `maxForks: 2`；acceptance 类 13 次真实 `git init` 仓库 + 真实 Node 子进程（含挂起子/孙进程与 8s 轮询）；`runner-clean-install` 真实 `npm --offline` | completed | N-003 |
| F-012 测试复用（`canonical-receipt-writer.mjs:230-296`） | 未受影响结果能否复用 | 复用按 ref + command/output/source hash，仅 verify-code 的 `npm test` 有额外候选；人工命名 ref（corrected-red、final-*）必然重新记录 | completed | N-003 |
| F-013 切片规则（全仓） | 是否已有大小上限 | **ABSENT**：宪法/标准流程/build-plan 均无文件数、seam、卡片数上限；`simplicity-guard` 明确禁止按 LOC 裁决 | completed | N-003 |
| F-014 close 记录（`core/task-close.mjs:1705-1713`） | 最终态表达 | existing workspace 强制 `worktree_cleanup: true`，同时 `cleanup={skipped:true,reason:...}`；已被 `tests/close/close-contract.test.mjs:225-236` 断言固定 | completed | N-003 |
| F-015 治理约束（CONSTITUTION.md / AGENTS.md / standard-workflow.md） | 什么被禁止/限制 | 质量事实不是许可证；不新增 gate；新控制面须登记 owner/consumer/测试/删除条件；不得双写/第二 store；禁止 replacement review/reopen/recovery 链；只跑受影响测试；不可逆动作单独授权 | completed | N-003、R-024 |
| F-016 基线来源（`git log -S`） | 哪些复盘建议已实现 | 330KB 上限、verify-code 输入边界、错误归一、预算前置、completed 成员落盘均由 **`f36571b6`（上次失败任务自己的提交）** 引入；即复盘建议的一部分已在当前基线 | completed | N-003 |
| F-017 AC 覆盖生产者链（`stage-handlers.mjs:1469-1587,3618-3645,3750`；`stage-runner.mjs:2008-2031`） | 20 个 AC 是否结构性无法通过 | **推翻复盘的说法**：per-AC 行可以 `covered→passed`，真实生产路径存在。`missing` 硬编码只出现在「vNext 且缺 implementation/tests receipts」这一支的**聚合 subject**（`3618-3619`、`3645`）；两支 receipts 齐全时走 `3750` 的条件判断。复盘说的 `acceptance_result_missing` 归因也不对：骨架行产生的是 `acceptance_result_not_pass:AC-x:missing`（`completion-predicates.mjs:677-680`）。**真实脆弱点**：per-AC 事实没有 material-only 容忍（`freshness.mjs:271-272,714-726`），build-code 之后任何材料/tree 变动会让全部 AC 事实 stale，复现「20 个全 missing」；另有 id 正则不一致（`stage-content-contracts.mjs:16` 允许裸 `AC1`，`completion-predicates.mjs:791` 要求带连字符） | completed | U-005 |
| F-018 index/facts 读模型（`task-store.mjs:114-130,296-332`；`quality-fact.mjs:70-94`；`quality-store.mjs:77-79,238`） | 962 文件 / facts=0 / index 空 / verify unknown 是否真缺陷 | **推翻复盘的说法**：这是 vNext 单写模型的**预期结果**，不是事实断裂。`facts.jsonl` 只记录协议错误；`index.json` 是 legacy stub 且明确拒绝 canonical vNext root；`quality/verify.json` 是 bootstrap stub。该任务**真实读模型是满的**：`quality/facts` 67、`stage-outcomes` 15、`quality/reviews` 47、`quality/tests` 92；close plan 如实写了 `quality_status=incomplete`、`not_released`。**唯一真实小缺陷**：`verify.json` 仍被文档与判据当成 per-AC 权威（`completion-predicates.mjs:815-838`），而它的 writer 在生产路径没有调用者 | completed | U-005 |
| F-019 broker 可恢复性（`3rd-review` 只读核实） | 外层被杀后能否读回已完成结果 | **可行路径**：`start` 返回可持久化的 `runtime_id`（同一 `request_id` 幂等重连），之后 `status --runtime-id` 在终态返回 `group.providers[].output`（真实输出文本）；`continuation.runtime_id` 还能复用原 provider 会话。**不可行**：`run` 是进程内执行、runtime_id 只在最终 stdout 出现，调用方被杀后磁盘没有 output。`doctor` 只给 `ready|unavailable|disabled`，**不含 context window / token 上限** | completed | N-003 |
| F-020 interaction aggregate 契约（`stage-content-contracts.mjs:2215-2270`） | 本阶段收尾必须产出什么 | 当前强制形状需要 `original_requirement` + `decision` + `confirmation` + `talk` + `grill` + `advice`；`round_count` 必须等于 `lifecycle_rounds.length`（**2 轮合法**，代码无最少 3 轮）；每轮必须是 `ask→wait→reply→resume` 四事件；`card_ref/card_hash` 只做格式校验；写入 `quality/evidence/interactions/<sha256>.json`；前置命令 `confirm --action=decision` | completed | step 11 |
| F-021 | **本阶段实测复现（2026-09-09 00:56–01:35）**：step 6 方向审查的真实代价 | 发起时有界材料包（约 12KB，只提交本阶段字节）；provider 侧真实运行约 40 分钟，broker 侧至少 3 个 runtime 显示 4/4 或 3/4 provider `completed`（`bcfd9fa2`、`47d8e4c9`、`794d89f7` 全部 completed，`d15d9c48` 除 grok failed 外均 completed）；期间主会话为记录暂停状态写了一次 `decision-log.md`，触发 `REVIEW_SOURCE_DRIFT`（`review-record-route.mjs:616`），**整次审查结果被丢弃**：task store 里既无 attempt 也无 result（`quality/reviews/` 只剩 request-locks）。这与复盘 P5 完全同类（「审查期间主会话修改材料，写入时 REVIEW_SOURCE_DRIFT」）。三点结论：① 材料写入与审查 dispatch 之间存在**无提示的互相毁灭**；② 已完成 provider 结果**无法通过公共路径恢复**（F-005）；③ 审查期间「不要动当前材料」这一约束**只存在于人的记忆里，没有机制保证** | completed | V5、F-005、U-002 |

### 外部调研（deep-research R0-R5，四路并行，全部读原文）

R0 缺口来自需求框架四维（业务目标/流程/数据状态/成功失败/约束），只保留会改变方向的问题。四份报告落在 `quality/evidence/research/<sha256>.json`（内容寻址，写入后回读校验）：

| research_id | 问题（决策轴） | ref / sha256 | 关键结论（会改变什么） |
| --- | --- | --- | --- |
| R-EXT-01 | 主会话派发者 + 子代理 worker 何时有效、何时有害 | `quality/evidence/research/7229262a5df0ba115dfeaaf3b2f02e550b4112a457a93d50998250137f3d66fb.json` | **读并行、写串行**：读重/独立任务适合并行子代理（上限 3–5，硬顶 6–8）；有依赖的写决策必须单线程，否则产生冲突决策。**主会话在实现阶段应保持唯一写者/决策线程，派发只用于探查、测试、审查**。worker 必须返回产物 + 轻量引用，不回传轨迹。子代理隔离不是免费的（agent teams 约 7× token） |
| R-EXT-02 | 变更规模 vs 结果，切片上限 | `quality/evidence/research/acdf85b22f00bf9171cb539a9068907427e999e536472e165b15d8d3825fef43.json` | 文件数上限 ≤10（目标 ≤5）证据最强（Google 90% <10 文件；Microsoft 效应在 ≥20 文件才明显）；行数上限只有人工审查证据；**对代理最强的信号是时长**（METR：人类等价 <4 分钟≈100% 成功，>4 小时 <10%）——25 小时远在可靠区外。规模上限不是质量机制，必须与覆盖/测试同批 |
| R-EXT-03 | 测试快速反馈设计 | `quality/evidence/research/5195aefdbbb6462de8a51d591061fdd558eed64cc0735f1abf91f85afb2276fd.json` | 用**运行时+能力**强制分层：inner ≤60s 且禁网络/DB/文件系统/子进程、medium ≤300s 仅 localhost、large 900s+ 仅 CI；本地与 CI 反馈目标 <10 分钟；flaky 随规模陡升（0.5%/1.6%/14%）；hermetic fixture 优于缓存/TIA；TIA/缓存只能作为**附加**机制并保留全量运行 |
| R-EXT-04 | token 成本与质量退化的真实驱动 | `quality/evidence/research/f8fd7bfa903b6237e4be59cef15df01a1fc788cb330a08c8e5c9de5df46b708a.json` | **成本不是主要杠杆，质量才是**：873.2M/894.6M 是缓存命中（约 0.1×），8.97 亿更像「同一上下文重发 100+ 次」。真正杠杆：减少重发次数、缩小上下文、**保持缓存前缀字节稳定**（压缩会破坏缓存，实测 98% 未命中）；引用式返回显著优于内联（99.40% vs 88.12%）；上下文腐烂是实测现象（约 32K 后差距打开） |

四份报告的 `review.status` 均为 `pending`（R5 独立复核尚未执行，按 step 6/10 的审查步骤处理）；未饱和项与反例已随报告保留。

## grill

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| GQ1（范围再平衡） | 本次已含 S1（扩了漂移解耦 + token 前置 + ADR 0025）+ S2 + per-AC 容忍 | 用户选择 **B：S2 保持完整实现**（不降级、不拆任务） | 风险登记 RISK-001：build-plan 必须用可执行切片检查拦住，必要时再拆 | 用户 2026-09-09 回复 |
| GQ2（时长分层命名） | 审查否决复用 `test tier`；但 CONTEXT.md 中并无 `test tier` 条目（它属于 skills/test-routing-advisor 的工程概念） | 用户选择 **A：另立 `test runtime profile`（测试运行画像）**，与 test tier 正交 | CONTEXT.md **no-change**（工程概念不属领域术语表；与既有 test tier 同样落在技能层） | 用户 2026-09-09 回复；`grep test tier CONTEXT.md` 无命中 |
| GQ3（ADR 0025 范围） | ADR 0007:34-35 与 standard-workflow.md:82 与 S1 的 dispatch 前置拦截冲突 | 用户选择 **A：只改两条冲突点**（上限禁令 + 不设预算 gate），说明拦截不参与放行判断 | ADR **created**：0025；ADR 0007:51 的 status 轮询仍在 S1 材料单独说明 | 用户 2026-09-09 回复 |

**grill_summary**：`status=completed`；`direction_changing_challenges_resolved=true`；`context={status:no-change, reason:测试运行画像是工程分类而非领域术语，CONTEXT.md 亦无 test tier 条目, file_references:[]}`；`adr={status:created, reason:显式修订 ADR 0007:34-35 与 standard-workflow.md:82, file_references:["docs/adr/0025-*.md（待 build-spec 撰写）"]}`；`conflicts={status:resolved, disposition:命名冲突按 GQ2 另立正交名；治理冲突按 GQ3 显式修订 ADR}`；`requirement_coverage={status:complete, message_classes:[goal, flow_or_surface, data_or_state, success_failure_acceptance, constraint_non_goal_defer], uncovered:[]}`；`exit_checks={external_interfaces:pass, canonical_names:pass, failure_semantics:pass, scope_boundaries:pass}`。

## 审查处置

> 来源：step 6 direction-advice 一次独立异源审查（红/蓝双角色，`available`/`partial`，19 条）。`status` 取值：`fixed` / `rejected_invalid` / `accepted_risk` / `needs_human`。

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-001（RED-1） | 延期 S5 的 per-AC material-only 容忍，导致「一次真实小任务复跑」在终态验收仍可能被 AC missing 阻断 | 复跑无法闭环 | fixed（R3 裁决前移进本次，T-008） | 本次交付 per-AC material-only 容忍；S5 缩小为 repair delta + resolved 链 | 用户 / spec / retain |
| FND-002（RED-2、BLUE-1） | S1 未包含 `review-record-route.mjs:616` 的 `REVIEW_SOURCE_DRIFT` 解耦；本次实测 40 分钟结果因一次材料写入被丢弃 | 恢复能力形同虚设 | fixed（R3 裁决纳入 S1，T-009） | S1 增加「按 dispatch 时冻结的 packet/材料身份校验，而不是与工作区动态文件硬比对」 | 用户 / build-spec / retain |
| FND-003（RED-3、BLUE-9） | 成功边界遗漏用户确认的「一次真实小任务复跑」 | 验收口径偏离用户决定 | fixed | 成功边界补入复跑验收路径，并把 token/轮询指标限定在 S1/S2 所辖范围 | 本阶段 / spec / retain |
| FND-004（RED-4、BLUE-6） | 把时长/隔离分层写成已有 `test tier` 的子属性，会覆盖其闭合语义 | 命名冲突、语义混淆 | fixed | 另设正交的 **test runtime profile（测试运行画像）**，不复用 `test tier` 一词 | 本阶段 / spec / retain |
| FND-005（RED-5、RED-6、BLUE-2、BLUE-8） | token/健康检查作为 dispatch 前置条件与 ADR 0007:34-35、standard-workflow.md:82 冲突；「不参与放行判断」不足以消除争议 | 治理违规风险 | fixed（R3 裁决硬前置 + 显式修订 ADR，T-007） | 新增 ADR 0025 显式修订 ADR 0007:34-35 与 standard-workflow.md:82；失败记录 `blocked_before_dispatch`，不参与放行判断 | 用户 / spec + build-spec / retain |
| FND-006（RED-7、BLUE-4、BLUE-5） | 延期项只写「各自带 owner 与触发条件」，正文没有具体 owner/trigger | 延期不可执行、范围可能重新膨胀 | fixed | 本文档「风险与延期交接」逐条补 owner/触发/最小交付物/验收证据 | 本阶段 / spec / retain |
| FND-007（RED-8） | 未把完整用户流程、页面/入口范围、数据状态写成可验收契约；状态机与 disposition 未显式建模 | 下游无法直接消费 | fixed（部分） | 新增「状态与写入者」表；页面范围写 `none` 并列出 CLI/route | 本阶段 / spec / retain |
| FND-008（RED-9、BLUE-7） | 成功边界不可证伪：`root token <25%` 无分母与窗口；「不靠 sleep/poll」无计数口径 | 无法验收 | fixed | 每个 seam 给出基线/阈值/观测来源/pass-fail；明确允许的 status 查询与最大调用次数 | 本阶段 / spec / retain |
| FND-009（RED-10） | S1 只写「用 broker start/status 恢复」，未定义 request 身份、漂移语义、唯一落盘路径与异步重新进入 | 实测 P5 仍可原样发生 | fixed（纳入 S1） | S1 定义跨 broker/WorkflowHub 生命周期契约：start 返回 request id + packet/chain/policy hash；status 只重挂同一身份；最终只走现有 publication | 本阶段 / build-spec / retain |
| FND-010（BLUE-3） | 「强制已有机制」不是可交付契约：没有既有 owner/入口/失败落点/测试/删除条件 | 实现者可能只改文档或新增重复检查 | fixed | 逐控制项列出既有 owner、唯一 consumer、执行入口、非放行失败记录、针对性测试、删除条件 | 本阶段 / build-spec / retain |

### step 6 审查逐条映射（19 条，可审计）

| finding | 组 | status | 落地位置 |
| --- | --- | --- | --- |
| RED-1 | FND-001 | fixed | D-006；DEFER-S5 缩小 |
| RED-2 | FND-002 | fixed | D-005；契约表「drift 唯一转移」 |
| RED-3 | FND-003 | fixed | 成功/失败边界「本次共同验收」 |
| RED-4 | FND-004 | fixed | D-009；契约表「test runtime profile」 |
| RED-5 | FND-005 | fixed | D-004 |
| RED-6 | FND-005 | fixed | D-004 |
| RED-7 | FND-006 | fixed | DEFER-S3..S7 |
| RED-8 | FND-007 | fixed | 「状态与唯一写入者」+「完整用户流程」 |
| RED-9 | FND-008 | fixed | 成功/失败边界逐条口径 |
| RED-10 | FND-009 | fixed | D-005；契约表 |
| BLUE-1 | FND-002 | fixed | D-005 |
| BLUE-2 | FND-005 | fixed | D-004 |
| BLUE-3 | FND-010 | fixed | 契约表 + D-003 |
| BLUE-4 | FND-006 | fixed | DEFER-S3..S7 |
| BLUE-5 | FND-006 | fixed | DEFER-S3..S7 |
| BLUE-6 | FND-004 | fixed | D-009 |
| BLUE-7 | FND-008 | fixed | 成功/失败边界 |
| BLUE-8 | FND-005 | fixed | D-004 |
| BLUE-9 | FND-003 | fixed | 成功/失败边界 |

### step 10 审查逐条映射（36 条，可审计）

| 组 | findings | 问题 | status | 修复 |
| --- | --- | --- | --- | --- |
| A 成功边界与 DEFER-S5 矛盾 | RED-1、RED-13、RED-19、BLUE-4、BLUE-11、BLUE-16 | 「窄修复不再整包重审」被写成本次边界，但该能力在 DEFER-S5 | fixed | 从本次边界删除，改为失败边界里的明确禁止项；能力验收移入 DEFER-S5 |
| B 边界仍是草案且不可证伪 | RED-12、RED-17、BLUE-3 | 标题仍写「草案，待收敛」，指标无分母/窗口 | fixed | 去草案；每条边界标注接缝 + 基线/阈值/观测来源/pass-fail |
| C 关键契约推给 build-spec | RED-3、RED-4、BLUE-1、BLUE-7、BLUE-8、BLUE-14 | 材料边界、per-AC 规则、profile 字段、fan-out、复跑对象、验收指标都待定 | fixed | 新增「本阶段钉死的契约」表；D-008 内联指标口径；ADR 正文措辞记 OPEN-003 |
| D 处置与覆盖审计不可追溯 | RED-6、RED-14、RED-10、BLUE-2、BLUE-17 | 19 条处置被压成计数；覆盖项数 37/40 矛盾且无逐条映射 | fixed | 本两张逐条映射表；更正为 37 项 |
| E RISK-003 残留已否决分支 | RED-5、RED-15、BLUE-6、BLUE-15 | 风险行仍写「或降为诊断」，与 D-004 冲突 | fixed | RISK-003 改为「已由用户裁决关闭」 |
| F 非目标候选未定稿 | RED-7、RED-11、RED-18、BLUE-5、BLUE-9 | 两条非目标仍标「候选，待确认」 | fixed | 定稿为非目标并写明 owner |
| G 切片风控依赖已延期机制 | RED-9、BLUE-12 | RISK-001 处置依赖 S4；切片口径未定 | fixed | RISK-001 改为本次可操作的人工拦截规则（>10 文件拒卡、单卡单 seam、三工作流不混 phase） |
| H 缺完整用户流程 | RED-8 | 只列了入口命令，没有端到端流程 | fixed | 「完整用户流程」节补 S1/S2 触点（派发前检查、恢复、认证、派发与整合） |
| I ADR 0007:51 悬空 | RED-16 | status 轮询归属与 S2 无轮询承诺冲突 | fixed | RISK-004：runtime 内部轮询 ≠ 主会话轮询，不占 S2 范围 |
| J drift/状态表不闭合 | RED-2、BLUE-10、BLUE-13 | drift 转移二选一未定；completed 状态出现双写入者表述 | fixed | 契约表定唯一转移；状态表区分 broker 运行态与 WorkflowHub task store 事实 |



## 最终确认

- 状态：**accepted**
- 用户原文与 host-visible 绑定：「批准，请把延期内容在原始md中写清楚」
- canonical confirmation：`quality/confirmations/f6a7e316dc1874f4c22a4e2faae28b53715d17fb84fdd14dad183d62b5d75a75.json`（`human-confirmation.v3`，`decision=accepted`，subject=`decision-log.md`）
- interaction aggregate：`quality/evidence/interactions/4118476f794630900b80ec33f03c26493aa7ec30b6d0c28e9011a2ee0fb0bf74.json`（3 轮 talk + 1 轮 grill + detail advice）
- 按用户要求，处置与延期已回写原始复盘文档：`/Users/Hugh/Downloads/workflowhub-execution-simplification-postmortem-20260909.md` 末尾新增「处置与延期登记（2026-09-09 由 make-decision 回写）」四节（本次处置 / 延期 S3-S7 / 被推翻或修正的结论 / 验收口径），不改写原文正文。
- 未确认内容：无。

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | trigger / 后果 / 最小交付物 | owner / handoff / close |
| --- | --- | --- | --- |
| DEFER-S3 | 测试反馈环实际改造（hermetic fixture 替换真实 git/子进程、放开并行度、内容闭包复用） | trigger：本次测试运行画像 + 分层契约落地后。后果：内环仍 10-15 分钟。最小交付物：目标集合 p95 达标证据 | owner=测试基础设施维护者（本仓 tests/ 与 vitest 配置）；handoff=独立任务，消费者=test runtime profile 契约与 phase 测试命令；close=实测 p95 ≤120s（inner）/≤300s（phase） |
| DEFER-S4 | 任务切片上限 + 预算唯一裁决点（`narrow_diff` 生产者补齐或删除、关闭 result-only 与裸 CLI 旁路） | trigger：下一个真实任务的 build-plan 需要可检查的切片上限时。后果：单任务仍可能过大。最小交付物：可执行切片检查 + 预算旁路关闭 | owner=build-plan + review 路由维护者；handoff=独立任务，消费者=build-plan 卡检查与 review 路由；close=超限卡被拒；旁路关闭后仍可重放 |
| DEFER-S5 | 一等 repair delta 与 `resolved` 链（per-AC material-only 容忍已按 T-008 前移进本次，不再属于 S5） | trigger：S1 产出可靠语义 review 后。后果：窄修复仍需整包重审。最小交付物：repair delta 绑定 + resolved 链 | owner=runtime/review + runtime/evidence 维护者；handoff=独立任务，消费者=verify-code code_review 判据；close=窄修复后无需 full review 即可得到 `resolved` |
| DEFER-S6 | Phase 循环瘦身与 RED/GREEN 证据卫生 | trigger：S1 完成后。后果：每个 Phase 仍重复采集与审查。最小交付物：RED failure signature + 证据按 consumer 去重 + phase review 复用 | owner=build-code 流程维护者；handoff=独立任务，消费者=build-code phase 循环；close=phase 证据数量与耗时画像下降 |
| DEFER-S7 | 事实小修与 close 最终态表达（`verify.json` 权威声明对齐、close 四域显示、cleanup 矛盾） | trigger：下一次 close 或 `verify.json` 被消费时。后果：审计无法只看一份记录。最小交付物：声明与 writer 对齐 + close 记录分离 plan/execution | owner=close 与 evidence 维护者；handoff=独立任务，消费者=close 读模型与 verify.json 判据；close=合同测试 + 一次 close 读回 |
| RISK-001 | S1+S2+per-AC 三个工作流同任务仍可能过大 | trigger：build-plan 阶段生产文件数超过软上限（研究建议 ≤10，目标 ≤5）或 phase 跨两个以上 consumer seam。后果：重演过大任务。**本次可操作的人工拦截规则（不依赖已延期的 S4）**：① 任一 phase 卡的生产文件数 >10 即拒绝并拆卡；② 单张卡只允许一个 consumer seam；③ 三个工作流不得混进同一 phase；④ 超限时由主会话停手并交用户裁定拆分点 | owner=本任务主会话 + 用户裁定；handoff=build-plan 卡检查；close=build-plan 不再产出超限卡 |
| RISK-002 | 审查期间写当前材料会丢弃整次审查结果（F-021 实测） | trigger：dispatch 期间任何 worktree 写入。后果：40 分钟结果作废。处置：D-005 解耦 + 本阶段冻结纪律；复跑实验必须验证 | owner=runtime/review（S1）；handoff=D-005 漂移解耦实现；close=复跑实验中写非材料文件不再丢弃结果 |
| RISK-003 | token/健康检查与 ADR 0007 的冲突 | **已由用户裁决关闭**：D-004 定为硬前置 + ADR 0025 只改两条冲突点（ADR 0007:34-35 与 standard-workflow.md:82）；「降为诊断」已在 D-004 的 rejected_alternatives 中被否决，不再作为可选分支 | owner=无（已关闭）；handoff=n/a（无下游动作）；close=已关闭（D-004 + GQ3 裁决） |
| RISK-004 | ADR 0007:51 的「对同一 request ID 轮询公共 status」此前悬空，且与 S2「主会话不阻塞轮询」可能冲突 | **已在本阶段定论**：轮询 broker status 由 **runtime 内部**执行，属于 B-S1-2 的实现手段，**不是主会话轮询**；B-S2-2 的计数只统计主会话侧调用。因此不新增治理修订，也不占用 S2 范围 | owner=runtime/review（S1 实现）；handoff=B-S1-2 恢复实现；close=已关闭（本阶段定论，无需新 ADR） |

### 质量边界

- 质量事实：本阶段产出 decision-log 与 stage outcome；缺事实保持 unknown/unavailable。
- 推进资格：质量事实不是推进许可证；方向未确认不得交接 build-spec。
- 完成判据：Talk 收敛 + 审查记录 + 用户真实确认 + interaction aggregate。
- 不可逆授权边界：本阶段不做 commit/merge/push/cleanup。

## 未决项

| item_id | 未决内容 | 状态/原因 | owner / trigger / handoff / close |
| --- | --- | --- | --- |
| OPEN-001 | 本次任务交付哪一段改进（review / 测试 / 事实 / 切片） | closed：已由 T-004/T-008/GQ1 裁决为 S1+S2+per-AC 容忍 | owner=用户（已裁决）；trigger=已触发（R2/R3 与 GQ1）；handoff=本阶段 D-001/D-006；close=已关闭（交付边界写进 D-001 与非目标） |
| OPEN-002 | 真实小任务与 host telemetry 的后续验证样本 | deferred：D-011 已取消其作为本次 P6 前置；当前 task 使用本地 aggregate | owner=用户/host instrumentation；trigger=后续需要 live 指标或真实任务证据时；handoff=D-008 硬指标口径；close=另一次认证复跑记录 task id、usage、四场景和阈值结果 |
| OPEN-003 | ADR 0025 的标题与正文措辞 | open：两条冲突点已钉死（ADR 0007:34-35、standard-workflow.md:82），措辞属 build-spec | owner=build-spec 主会话；trigger=build-spec 撰写 ADR 0025 时；handoff=spec.md 的 ADR 章节；close=ADR 0025 落盘且只改两条冲突点 |

## 阶段 step 结果

| step | 状态 | 实际做了什么 | 证据/引用 |
| --- | --- | --- | --- |
| 1 load-context | completed | 建立认证 worktree（分支 `task/workflowhub/workflowhub-execution-acceleration-20260909`，基线 `1195bca0`）；读取 portable workflow `workflows/make-decision/SKILL.md`、`steps.json`、`skill-deps.yaml` 与依赖技能 `decision-log`/`talk-with-zhipeng`/`grill-with-docs`/`wh-review`；读取原始需求（用户指令 + 复盘文档 612 行）；运行 `doctor --action=workspace --stage=make-decision` 确认工作区与存储可用 | worktree；task store `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-execution-acceleration-20260909`；doctor 输出 |
| 2 triage-scope | completed | 写入本阶段范围、6 项不确定性与非目标草案；把复盘 25 条来源登记为 R-001..R-025，并选定 `functional` 需求框架 | 本文档「范围/不确定性登记/非目标/需求框架」 |
| 3 talk-round-1 | completed | 先核实现有实现与可查事实（6 组子代理只读事实：review 调用链、身份与事实发布、测试与切片与 close、治理约束、broker 能力、AC 覆盖与读模型），再只向用户询问无法自行确定的方向问题；收到 3 条真实回复（T-001..T-003），其中两条为自由文本 | F-001..F-018；T-001..T-003 |
| 4 research-inputs | completed | 按 `deep-research` R0-R5 执行四路并行调研：主会话派发者模式、复杂任务切片实证、测试快速反馈设计、token/上下文经济学；每路要求读原文、留定位、给冲突与置信度；四份 `research-report.v1` 内容寻址落盘并回读校验 | R-EXT-01..04（四份 ref/sha256 见「外部调研」节） |
| 5 talk-round-2 | completed | 用一组互不依赖的问题收敛交付单元、主会话红线与测试处置；收到 3 条真实回复（T-004..T-006）；按回复要求追加「复盘逐条覆盖审计」 | T-004..T-006；覆盖矩阵 B1-N4 |
| 6 direction-advice | completed（第一次 unavailable，第二次 available） | 第一次 2026-09-09 00:56 发起、01:35 以 `REVIEW_SOURCE_DRIFT` 结束且结果未记录（F-021）；按 A 路径冻结材料后重试，第二次返回 `semantic_status=available`、`partial=true`，红/蓝双角色均可用，共 19 条 findings | red attempt `quality/reviews/attempts/672be21d-548a-5c00-a013-0dfe7ab29f14/attempt.json`、result `quality/reviews/results/make-decision-simple-672be21d-548a-5c00-a013-0dfe7ab29f14.json`；blue attempt `quality/reviews/attempts/f3574852-959f-5599-a249-c2b331d3866b/attempt.json`、result `quality/reviews/results/make-decision-simple-f3574852-959f-5599-a249-c2b331d3866b.json`；report `quality/reviews/reports/make-decision-simple-64f6df40-cae6-548e-a413-2f4e0f00ea0f.md`；pair_id `e8d6fc23-33ad-4a4f-82b7-7409701389ca` |

| 7 talk-round-3 | completed | 用一组互不依赖的问题处理 direction review 的争议：token 检查定位、per-AC 容忍是否前移、漂移解耦是否纳入 S1；收到 3 条真实回复（T-007..T-009） | T-007..T-009 |
| 8 grill-with-docs | completed | 先用只读子代理核对 CONTEXT.md/ADR/治理文档（G-001..G-013），再做一轮 frontier 问答：范围再平衡、时长分层命名、ADR 0025 范围（GQ1..GQ3）；返回 grill_summary 与四项退出检查 | grill 表 + grill_summary；`grep test tier CONTEXT.md` 无命中 |
| 9 write-decision-draft | completed | 写 D-001..D-010（含 question/final_option、source 原文、facts、Logic、consequences、rejected、unresolved、Supersedes 与文本层链字段） | 本文档「决定」节 |
| 10 detail-advice | completed | 对决定草稿做一次独立异源细节审查（有界包 24KB），返回 36 条 findings（红 19/蓝 17）；逐条映射处置：10 组修复（成功边界、可证伪口径、契约钉死、逐条审计、风险表清洗、非目标定稿、切片拦截规则、用户流程、轮询定论、drift 状态） | red result `quality/reviews/results/make-decision-simple-5f6573af-...json`；blue result `...-770bec69-...json`；逐条映射表见「审查处置」 |
| 11 approve-decision | completed | 呈现最终决策卡并取得用户真实确认（「批准，请把延期内容在原始md中写清楚」）；记录 canonical confirmation；用 kernel API 发布 interaction aggregate；把处置与延期回写原始复盘文档 | confirmation `quality/confirmations/f6a7e316...json`；aggregate `quality/evidence/interactions/4118476f...json`（quality_fact `quality/facts/24b894b2...json`）；复盘文档新增四节 |
| 12 stage-end-spec-analyze | completed | 按 `skills/spec-analyze/SKILL.md` 对 make-decision 包做 lens 检查：25 条原始需求逐条语义+证据覆盖、五项收敛维度、大白话结束卡、DEFER/OPEN 逐条 owner/触发/交接/关闭条件；发现并修复 4 项缺口（缺四维收敛表、UI applicability 三来源未结构化、原始需求覆盖矩阵缺合法处置列、step 10 映射表漏 BLUE-15），修复后复查一致 | lens 结果见当前 stage outcome 的 `spec_analyze.result`（`quality/evidence/stage-outcomes/make-decision/`） |
| 13 publish-decision | completed | 发布 stage outcome（绑定当前 task/stage/attempt/run/material/snapshot/manifest/producer 与真实 spec_analyze 结果），并逐条处置 55 条审查 finding | 当前 outcome `quality/evidence/stage-outcomes/make-decision/713f7552ff02a14c2d2d558959b1bd5e33c322a810fad5359fd4b236a476b09e.json`（attempt `attempt-make-decision-stage-agent-20260909-3`；早前的 `9338e33b…`、`019c4b31…` 为历史） |
| 14 stage-reflection | completed | 按 `stage-reflection` 产出 `stage-reflection.v2` judgment JSON（六区块 + status_matrix/identity/source_completeness + interventions），经公共 `run --action=reflect` 发布 | reflection `quality/stage-reflection/make-decision/df7629104da59a3db212bc61440c2e35b00cbecc44484d4260b8436042ab1b34.json`（sha256 `cb4ab2b3…`；validator status `degraded`：缺 ref 降级与消费边扫描 partial，非通过也非阻断） |

### 阶段末验证（机器读回）

- `run --action=execute --stage=make-decision`：`quality_status=passed`、`missing_items=[]`、`completion=completed`、`stage_outcome_status=completed`、无 `quality_warnings`。
- 11 项 quality predicate 全部 `satisfied`：scope、non_goals、risks、ui_applicability、requirement_coverage、goal_achievement、acceptance_clarity、solution_convergence、plain_language_card、stage_end_spec_analyze、human_confirmation。
- **已知真实瑕疵（不隐藏）**：确认记录绑定材料修订，而 spec-analyze 修复发生在首次确认之后，导致本阶段一度出现两个「当前快照」的 stage outcome；`deriveStageOutcomeStatuses` 对「同一 run + 同一快照 >1 个 completed」判为 `conflict`，会把 `stage_outcome` 记为 missing。处置：让材料前进一代（本验证节），使旧 outcome 成为历史、只剩一个当前 outcome。该现象与 RISK-002 同类（材料写入与发布互相失效），已在 S1 范围内。


### 暂停与恢复记录（2026-09-09）

- 用户先指示「暂停一下任务，等我通知」，随后补充「审查完成后，再暂停一下任务」。
- 在飞的 step 6 方向审查以 **`REVIEW_SOURCE_DRIFT` 结束，结果未记录**（F-021）。暂停时无 attempt_ref/result_ref。
- 用户随后指示「可以继续了」。恢复动作按预先给出的 **A 路径**执行：先冻结当前材料，再按公共合同**重新请求一次** direction review。
- **冻结纪律（本次实测教训）**：审查 dispatch 期间不得写入 worktree 中任何文件（包括 `decision-log.md`），否则会再次触发 `REVIEW_SOURCE_DRIFT` 并丢弃整次结果（F-021）。这条纪律本身是待解决的机制缺口（S1 结果耐久 + S5 freshness），不是本阶段的新 gate。
- 已完成：step 1-11；10 组事实核实（F-001..F-021）；四路外部调研（R-EXT-01..04）；复盘 37 项覆盖矩阵；领域文档核对（G-001..G-013）；一次 direction review（19 findings）与一次 detail review（36 findings）全部逐条处置；用户最终确认与 interaction aggregate 已落盘。
- 未完成：step 14（stage-reflection，由官方 run 在本 outcome 发布后执行；本 outcome 如实记 `unavailable`，不写成完成）。
