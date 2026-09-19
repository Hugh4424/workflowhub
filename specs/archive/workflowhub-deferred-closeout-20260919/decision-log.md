# decision-log.md — workflowhub-deferred-closeout-20260919

## 任务身份

- task_id: `workflowhub-deferred-closeout-20260919`
- project: `workflowhub`
- **任务类型**: 普通任务
- target_repo_root: `/Users/Hugh/Hugh/Project/workflowhub`
- worktree_root: `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-deferred-closeout-20260919`
- branch: `task/workflowhub/workflowhub-deferred-closeout-20260919`
- baseline_commit: `160778878912124c292f1beb0e5008299c396743`
- task_store: `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-deferred-closeout-20260919`
- 当前阶段: `make-decision`

### 类型声明来源

用户在 2026-09-19 的结构化问答中原话选定「普通任务」。本字段为纯声明，不由路径、请求措辞、文件名、hash 或历史记录推断。

## 原始需求

用户在 2026-09-19 本会话的原话（逐字保留，作为唯一需求权威）：

> 我当前正在进行“/Users/Hugh/Hugh/Project/workflowhub-workflowhub-cost-baseline-and-blocker-close-20260917/specs/workflowhub-cost-baseline-and-blocker-close-20260917”任务，这个任务遗留了一些任务，我现在想要开始进行设计和规划：/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md
>
> 请你先仔细阅读和调研这些文件内容，然后我希望现在按标准 WorkflowHub 开始这个改进任务，先创建worktree，然后从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求。先基于原始需求，在make-decision的过程中和我一起仔细梳理完整需求流程、页面范围、数据状态、成功/失败边界、非目标和延期项，Talk 和grill请用大白话说明选项、后果和风险。注意主会话只进行子代理任务派发和交互类技能的执行，不要进行大量阅读和执行任务，保证主会话上下文控制和执行质量。

用户随后补充的三条范围口径（逐字保留）：

> 尽量一个任务做完，不要浪费那么多时间做那么多任务

> 普通任务

> 已经判死或不用再做的任务，就不要放在当前任务规划范围内了

**需求覆盖矩阵（逐条对应 OI 与决定）**

| source_id | 需求/约束摘要 | 来源引用/原文摘录 | 消息类别 | 关联 OI | 处理状态 |
|---|---|---|---|---|---|
| R-001 | 承接 `workflowhub-cost-baseline-and-blocker-close-20260917` 遗留的后续入口清单 | 用户原文：「这个任务遗留了一些任务，我现在想要开始进行设计和规划」＋入口清单路径 | goal | OI-01 | covered |
| R-002 | 尽量合并成一个任务做完，不做成一堆小任务 | 用户原文：「尽量一个任务做完，不要浪费那么多时间做那么多任务」 | flow_or_surface | OI-01、OI-02、OI-03 | covered |
| R-003 | 已经判死或不用再做的项不得进入本任务规划范围 | 用户原文：「已经判死或不用再做的任务，就不要放在当前任务规划范围内了」 | constraint_non_goal_defer | OI-04、OI-11、OI-12 | covered |
| R-004 | 按标准 WorkflowHub 执行，先建 worktree，从 make-decision 开始，不跳阶段 | 用户原文：「按标准 WorkflowHub 开始这个改进任务，先创建worktree，然后从 make-decision 开始，不要跳阶段」 | flow_or_surface | OI-01、OI-03 | covered |
| R-005 | 不依赖 build-spec 补需求，需求必须在 make-decision 内闭合 | 用户原文：「也不要依赖 build-spec 补需求」 | success_failure_acceptance | OI-03、OI-20、OI-21 | covered |
| R-006 | 完整梳理需求流程、页面范围、数据状态、成功/失败边界、非目标和延期项 | 用户原文：「和我一起仔细梳理完整需求流程、页面范围、数据状态、成功/失败边界、非目标和延期项」 | data_or_state | OI-01、OI-24；固定六类别全覆盖 | covered |
| R-007 | Talk 与 Grill 用大白话说明选项、后果和风险 | 用户原文：「Talk 和grill请用大白话说明选项、后果和风险」 | flow_or_surface | OI-02、OI-07、OI-10、OI-22 | covered |
| R-008 | 主会话只做子代理派发与交互类技能执行，不做大量阅读和执行 | 用户原文：「主会话只进行子代理任务派发和交互类技能的执行，不要进行大量阅读和执行任务」 | flow_or_surface | OI-27 | covered |
| R-009 | 入口清单 §1 的 DEF-01～DEF-09 均为终态，不是待办 | 入口清单 §1 L15-27；§7 读取规则 L290 | constraint_non_goal_defer | OI-04 | covered |
| R-010 | 入口清单 §4 的 7+1 项须逐条给出处置 | 入口清单 §4 L144-208 | goal | OI-05～OI-12 | covered |
| R-011 | 入口清单 §4.9 的 F4～F12 须逐条给出可见处置 | 入口清单 §4.9 L205-239 | constraint_non_goal_defer | OI-19、OI-21、OI-23、OI-25 | covered |

### 处置口径（逐条对应需求）

| 维度 | 用户原话要点 | 本任务处置 |
|---|---|---|
| 问题 | 「这个任务遗留了一些任务」 | 消费入口清单 §4，对 7+1 项逐条给出终态处置（OI-05～OI-12） |
| 期望 | 「尽量一个任务做完」 | 活跃候选合并为一个任务；已判死/锁死项不进范围（OI-01、OI-02） |
| 约束 | 「已经判死或不用再做的任务，就不要放在当前任务规划范围内了」 | 4.5 非目标、4.8 延期、DEF-01～09 终态（OI-04、OI-11、OI-12） |
| 约束 | 「不要跳阶段，也不要依赖 build-spec 补需求」 | 五阶段顺序执行；方向与验收在本阶段定死（OI-03、OI-20、OI-21） |
| 约束 | 「和我一起仔细梳理完整需求流程、页面范围、数据状态、成功/失败边界、非目标和延期项」 | 固定六类别全覆盖，每类有 OI 或 empty 理由（本文件 `## 唯一 OI 大纲`） |
| 约束 | 「Talk 和grill请用大白话说明选项、后果和风险」 | 每张选项卡写含义、直接后果、主要风险（见 `## 三轮 talk`、`## grill`） |
| 约束 | 「主会话只进行子代理任务派发和交互类技能的执行」 | 重活派子代理；主会话只执行官方 CLI 步骤与 Talk/Grill |

## 核心需求

- 核心需求：把上一个任务遗留下来、仍然可做的改进项收口成同一个任务，并对其中确实造成阻塞的严格判定按证据逐条拆掉或放松。
- 核心目标：让后续 build-spec / build-plan / build-code 直接消费本阶段已确认的方向与边界，不需要回头补需求。
- 已选方向：六个活跃候选合并为一个任务；只拆有事故证据的严格判定、身份类检查只统一算法不加严，验收只用既有针对性测试。

## 需求权威更新（2026-09-19 talk-round-1，用户真实答复）

主会话于 2026-09-19 以结构化问答卡一次发出 4 个互相独立的单轴问题；用户真实答复如下，选项标签逐字保留。

| 轴 | 用户所选选项（逐字） | 含义 | 直接后果 | 主要风险 |
|---|---|---|---|---|
| 合并还是拆分 | 装进一个任务（推荐） | 六个活跃候选一次做完 | 一套材料、一次确认、一条验收链，不重复读同一批文件 | 改动面大，第一块可独立验证的成果出现得晚，中途容易失焦 |
| 4.7 范围依据 | 先复核 diff，复核结论出来再定范围 | 本步不裁定 4.7 范围，先出只读复核事实 | 事实最扎实，避免照过期清单重复劳动 | 多一轮往返，范围要到 talk-round-2 才收敛 |
| 4.3 边界（P-D-030③） | 披露 + 接通既有取消接口 | 披露 broker 既有成员级事实，并调用 3rd-review 既有取消接口真正终止卡死成员 | 能真正止损 | 与入口清单 OI-10/OI-23 否决 `cancelManaged` 的既有表述冲突，且既有测试断言该路径「绝不调用」，须连带裁定；跨过仅披露的边界后属行为变更 |
| 跨仓写入边界 | 改 + 测试 + 在该仓开分支 commit | 本任务可改 3rd-review 工作树、跑测试，并在该仓开分支提交 | 改动有归属、可追溯 | commit 属跨仓不可逆动作，须在 step 11 显式授权后方可执行；分支管理需另约定 |

### 宿主问答工具降级事实

本宿主的结构化问答工具返回用户真实选择，但不提供 `reply_ref` / `reply_hash` 凭证。按 `talk-with-zhipeng` 契约的降级路径处理：以文本卡登记真实答复，如实记录工具降级事实，**未伪造**工具调用、答案或回复凭证。

### 用户本轮答复带来的两项必须裁定事项

1. **`cancelManaged` 矛盾（方向级）**：用户选择「披露 + 接通既有取消接口」，与入口清单 OI-10/OI-23 中否决接通该路径的既有结论冲突；且本仓已有测试断言该路径绝不调用。须在 talk-round-2 裁定：既有测试断言是否修改、以哪一份表述为准。
2. **跨仓 commit 授权边界（不可逆）**：用户选择「改 + 测试 + 在该仓开分支 commit」。该授权在 step 11 `approve-decision` 显式确认前不生效；step 11 之前不得对 `/Users/Hugh/Hugh/Project/3rd-review` 执行任何 commit/push。

## 需求权威更新（2026-09-19 talk-round-2 与增量裁定）

主会话于 2026-09-19 以结构化问答卡发出 talk-round-2 各轴问题；用户真实答复（含自由文本）逐字保留如下。

| 轴 | 用户答复（逐字） | 处理 |
|---|---|---|
| 4.1 前置裁定 | 这个决策太复杂了，在workflowhub中不应该有这么复杂的流程。我把上一个任务已经提交到main了，请你合并到当前分支，再检查一下这个决策到底是什么意思？应该如何处理？ | 已溯源并交用户裁定（见下） |
| 4.6 范围 | 同样检查一下新的提交合并后，当前任务还有多少要做的 | 已现场复核（见 F-008） |
| 4.7 收哪几项 | 全收 8 项 | 范围＝现场复核出的 8 项（OI-10 收敛） |
| privatePathPattern 处置 | 回退，不准做任何加严！无论是workflowhub或3rd-review，我不允许任何严格的的判断出现！避免总是因为各种东西出现阻塞和失败，这是时间浪费的大头！ | 回退该新增 token；本任务不新增任何加严 |
| 验收可否证伪 | 尽量简单！不要加任何强硬的验收，我被workflowhub一大堆的验收和收集搞怕了，现在整个workflowhub复杂到恐怖，完全无法维护 | 验收保持简单，不新增验收机制（OI-29） |

### 增量裁定（2026-09-19，同一轮追问）

| 轴 | 用户答复（逐字） | 处理 |
|---|---|---|
| 「不准加严」的边界 | 先列出「哪些严格判定真的造成过阻塞」，只拆有事故证据的 | 形成 F-001 实测计数与「5 项拆除 + 6 项放宽」处置清单（原记 7 项放宽，其中第 7 项已由合并 `d8c74fdc` 修复） |
| 4.1 处置 | 整体砍掉，记为「已被你否决」，只在非目标登记 | OI-05 / OI-13 关闭为 not_applicable |

### 严格判定处置裁定（2026-09-19）

- 用户选「5 项拆 + 7 项松，全做」（现场复算后更正为 5 项拆除 + 6 项放宽：第 7 项已由合并 `d8c74fdc` 修复）
- 用户选「零触发红线保留，不拆」
- 用户逐字口径：「我不允许任何严格的的判断出现！无论是workflowhub或3rd-review…避免总是因为各种东西出现阻塞和失败，这是时间浪费的大头！」

### cancelManaged 溯源更正（重要）

上一个任务材料中「否决接通 cancelManaged」**不是用户决定，而是 agent 推断**（依据为既有测试断言 `tests/review/review-managed-lifecycle.test.mjs:441-466`、归档 `workflowhub-execution-simplification-20260907/decision-log.md:330` 的 D12、以及 D-030③）。同一任务的 OI-11 (`specs/archive/workflowhub-cost-baseline-and-blocker-close-20260917/decision-log.md:1210`) 反而**要求**调用它；审查 finding D7 (`:1740`) 把这对互斥登记为「未修复」。因此用户在 2026-09-19 talk-round-1 选择「披露 + 接通既有取消接口」是**纠正 agent 越权推断**，不是推翻用户自己的决定。

## 需求权威更新（2026-09-19 合并 main）

- 用户原话：「我把上一个任务已经提交到main了，请你合并到当前分支」
- 执行事实：任务 worktree 从 `160778878912124c292f1beb0e5008299c396743` **fast-forward** 合并到 `fcb7078fbdada5e672298006a96037f99b655b2e`（3 个提交：`e74d9a72` merge 上一任务、`d8c74fdc` ephemeral workspace snapshot、`fcb7078f` archive specs）。合并前该分支无独有提交，故为干净快进；本任务材料 `specs/workflowhub-deferred-closeout-20260919/` 为未跟踪文件，未受影响。
- 影响：合并带来 64 个文件、+8534/−1288 行，其中包括上游任务的实现（`runtime/review/review-output.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-runner.mjs`、`skills/wh-review/**`、多处 tests、`workflows/make-decision/SKILL.md`、`docs/standard-workflow.md`）。**因此本任务在 step 1–4 于 `16077887` 上取得的一切实测数字全部作废，已在 step 4 于新 HEAD 上重做。**
- 上一任务材料现存于 `specs/archive/workflowhub-cost-baseline-and-blocker-close-20260917/`（四份材料均在），本任务引用其时必须带任务名（该材料自身在 `:1793` 记录了 D-006②/D-007 编号撞车警告）。

## 需求权威更新（2026-09-19 talk-round-2 第二批与合并后复核裁定）

### 1) 用户本轮四条裁定（逐字保留所选标签）
| 轴 | 用户所选（逐字） | 处理 |
- `4.6 合并后取舍` → 「以现场为准，只补真缺口（推荐）」
- `4.2 / 4.3 / 4.4 取舍` → 「三项都收，但 4.3/4.4 只做拆松没盖住的剩余（推荐）」
- `拆松验收口径` → 「只用既有针对性测试，不做前后计数」
- `合并新增严格判定` → 「只拆有旁证的那几处，其余登记观察（推荐）」
- `bounds 分叉` → 「对齐到宽松侧，删掉 skill 那份新增的 fail-closed 抛出（推荐）」

### 2) 合并后现场复核结论（事实）
- **DEF-09 已闭合**：`quality-verify.v1` 字面量已从 `tests/e2e/ui-e2e-contract-dogfood.test.mjs` 消失（该文件零命中）；剩余 4 处命中在 `tests/contract/tier-c-deletion-boundary.test.mjs:55,81,97,113`，均为**反向守卫断言**（断言该对象不得复活），属对的安全网，保留。
- **4.6 现场终态**：缺陷1（stage 行过期）**已修**——写侧改用 `runtime/stage/stage-runner.mjs:1144-1147` 的 `ctx.kernel.currentVNextMaterialScopeRevision(stage)`，读侧只披露 `provenance:{status:"stale"}`（`runtime/stage/completion-predicates.mjs:664-684`），全仓已无 `execution_record_row_material_stale`；缺陷2（路径身份）**已修**——改为内容绑定+互引（`runtime/stage/stage-handlers.mjs:2104-2113`，镜像 `runtime/evidence/freshness.mjs:70-79`），文件名不再是身份的一部分；缺陷4（`direction_change` 终态）**已修**（`runtime/stage/stage-content-contracts.mjs:451` 现接受 `fixed`）。三条修法均来自 `16077887` 的祖先提交，**合并没有改变它们的结论**。
- **4.6 唯一真缺口＝缺陷3**：跳过已被披露，但只进 `facts` 不进 `errors`——`runtime/stage/stage-content-contracts.mjs:5962`（`let specAnalyzeSkip = null`）、`:5989-5994`（make-decision 分支写 `{status:"skipped", reason:"decision-log has no Markdown headings…"}`）、`:6009-6012`（build-spec 分支）、`:6036`（以 `facts.spec_analyze` 暴露）；状态仍由 `:6018-6020` 算作 `inconsistent`，无 `errors` 条目；`hasMarkdownHeadings`（`:3511`）仍是唯一判别。
- **4.3 合并已交付部分**：`runStaticPreflight` provider 循环与 `blocked_provider_results`（`skills/wh-review/scripts/simple-review-runner.mjs:906-946`）、新的 `validateManagedHealthProviders` 与 `managedHealthMemberFields = ["status","error","last_progress_at_ms"]`（`skills/wh-review/scripts/review-provider-client.mjs:180,621-666`）、`PROCESS_STALLED` 记为 broker 侧终态（`:954`）、`consumeMemberFailure`（`simple-review-runner.mjs:531-556`）。**仍未做**：一次即熔断；`cancelManaged` 仍被故意不调用（`simple-review-runner.mjs:574-582`）；没有供阶段路由消费的聚合健康预检结论。
- **4.4 合并已交付部分**：`runtime/review/review-output.mjs` 整体重写（severity 别名映射、`findNestedFindings`、JSONL 行解析、单 fence 解析、首个有效候选回退），并新增 path 正则 `/^[a-z][a-z\d+.-]*:/i` 守卫（`:27`）。**仍未写清**：红线边界未成文；未知 severity 的 finding 现改为**静默丢弃**（`return null`），而不是报错——这一行为变化尚未登记为规格。
- **§5 数字再次漂移**（合并后）：`stage-content-contracts.mjs` 7191、`stage-handlers.mjs` 4268、`stage-runner.mjs` 3689、`review-record-route.mjs` 1889、`completion-predicates.mjs` 937；导出 82、字节 381412；`steps.json` 16、`skill-deps` 9、`runtime/adapters/` 2 个、t3 plan 4/4 均不变；`runtime/schemas/quality-verify.v1.json` 仍不存在。
- **DEF-04 的零漂移前提已破**：`skills/wh-review/scripts/review-input-bounds.mjs` 现为 **12702 B / sha256 `859b2a437407239e792a6a1ffbeedacdff5a1445934a2dbc3cb52ff17a289eeb`**，`runtime/review/review-input-bounds.mjs` 仍为 **11417 B / sha256 `c882ab9d8dfe6c90e2d545e282da093145baf0d8d2a312f3cafe3e58d74cc105`**，`diff` **63 行**；skill 那份在 `:110` **新增**了一个 runtime 没有的 fail-closed `MATERIAL_TOO_LARGE` 抛出。无任何测试断言两者字节等价。用户裁定：**对齐到宽松侧，删掉 skill 那份新增的 fail-closed 抛出**。

### 3) 合并新增的严格判定扫描（用户裁定：只拆有旁证的，其余登记观察）
以 `git diff 16077887..HEAD` 实测，合并**新增/收紧**了下列判定：
- `runtime/stage/stage-content-contracts.mjs:6491-6523`（`acceptanceExecutionErrors`，在 `:6829` 与 `:6929` 生效）：`tier=command/service` 的 `execution` 由可选变**必填**，并做未知键与 `timeout_ms` 正整数校验
- `runtime/stage/stage-runner.mjs:1612-1615`：direction/detail 审查证据必须来自 `result_ref`+`result_hash` 且两者过正则，否则候选被丢弃
- `runtime/stage/stage-runner.mjs:1706-1734`：新增 `expectedTrack` 身份校验
- `skills/wh-review/scripts/review-input-bounds.mjs:110`：**新增** fail-closed `MATERIAL_TOO_LARGE` 抛出
- `skills/wh-review/scripts/third-review-host-config.mjs:204-211`：**新增硬白名单** `SUPPORTED_PROVIDER_IDS`
- `skills/wh-review/scripts/review-provider-client.mjs:52-80,190-196,365-373,621-666`：`safeProviderErrorFacts` 拒未知字段、v3 attempt 拒未知键、`validateManagedHealthProviders` **要求 provider 集合精确匹配**并校验 `last_progress_at_ms` 边界
- `runtime/review/review-output.mjs:27`：path 正则新增拒绝 `scheme:` 前缀
- `runtime/review/schemas/attempt.schema.json:218-219`：新增 enum 型 `process_outcome`/`parse_outcome`
- `runtime/review/review-record-route.mjs:554-557`：`unavailable + REVIEW_WAIT_EXCEEDED + provider_attempts=0` 不再可复用，强制重派
- 五份 `workflows/*/SKILL.md` 与 `docs/standard-workflow.md`：新增「outcome 缺失须记为 unavailable」与 freeze 类流程约束

**旁证结论**：「`validateManagedHealthProviders` 要求 provider 集合精确匹配」与已实测触发 **80 次**的 `PROTOCOL_INCOMPATIBLE`（配置漂移触发）同轴，**属可拆**。其余新增项刚上线、无事故证据，登记为**观察项**，本次不拆。

同时合并也**放宽**了若干处（记录以便后续判断）：`runtime/stage/stage-handlers.mjs:1747-1753` AC 覆盖不再要求每个场景 `executed`（叶节点 `passed` 为权威）；`runtime/stage/stage-runner.mjs:1661-1692` 确认/行可在 execution-record-only 与 stage-material-only 快照差量间复用，`material_revision` 不一致时在树可复用时被容忍；`:1817` 与 `:2425` 去掉了 `{fresh:true}`（减少 `FORMAL_SNAPSHOT_MISMATCH` 误报）；`runtime/evidence/freshness.mjs` 删除死掉的 `bindFreshness`/`assertFresh`；`skills/wh-review/scripts/wh-review-cli.mjs` **−636 行**（删掉 task-bound e2e 审查路径）。

## 需求权威更新（2026-09-19 step 6 方向审查结果与新增阻塞裁定）

### 1) 方向审查结果：recorded but unavailable（零 finding）
- 命令：`node tools/cli/stage-runtime.mjs review --action=record --stage=make-decision --project=workflowhub --task=workflowhub-deferred-closeout-20260919 --input=/tmp/direction-review-request.json`，exit code 0，stderr 空。
- stdout 关键字段：`status="recorded"`、`reused=false`、`dispatch_state="blocked_before_dispatch"`、`semantic_status="unavailable"`、`partial=true`、`pair_id="e12d39e5-f30d-4f1e-858c-ece646795ae2"`。
- 证据 ref：红 `quality/reviews/attempts/4c8c0f63-caef-54c1-ada9-7f31aaf5aa14/attempt.json`、蓝 `quality/reviews/attempts/45223bbe-b0b3-5dab-a0f8-20cbe7e9673c/attempt.json`；两者 `result_ref` 均为 **null**；对报告 `quality/reviews/reports/make-decision-simple-f6d7b132-a35d-5985-a19a-dcd0bc2957c4.md`。
- 错误逐字：`{"code":"PROTOCOL_INCOMPATIBLE","message":"PROTOCOL_INCOMPATIBLE: 3rd-review managed lifecycle envelope is invalid"}`。
- 派发事实：eligible group 为 `kimi/coding`、`antigravity/flash`（`codex/luna` 因 host 同源被排除）；broker 侧 `kimi/coding` **failed / RATE_LIMITED**（"provider process exited with 1"），`antigravity/flash` 在客户端拒绝时仍为 `running`。**broker 已建好 bundle 并写好两个 provider workspace**，说明材料与请求形状被接受，卡点纯粹在跨仓 material_id 规范化。
- **零条红/蓝 finding**。按 `skills/wh-review/SKILL.md:88`，unavailable 不等于空 findings，**不是 pass**，不得记为通过或批准。因失败为确定性，**未重试**（只有具体问题改变时才允许重试）。

### 2) 确定性根因（跨仓 material_id 规范化不一致）
- WorkflowHub 侧期望 `material_id = 49706015bc2cf3888ebdd3656d6bde73af90719f81551095dfc8c65bb93edc56`（`runtime/review/review-packet-identity.mjs:121-157`，`createSimpleReviewPacket` / `reviewPacketMaterialId`）。
- 3rd-review 侧发布 `material_id = 6628e10504100be3a76e914a2bc0cda096cc86e64032738a913050cde5089f97`（`/Users/Hugh/Hugh/Project/3rd-review/lib/attachments.mjs:110-116` 的 `canonicalWorkflowHubMaterialId`，`broker.mjs:171` 回显；子代理已从交付的 `manifest.json` 独立重算出同一值）。
- `skills/wh-review/scripts/review-provider-client.mjs:687` 要求两者**严格相等**，不等即于 `:691` 抛出 `PROTOCOL_INCOMPATIBLE`；两个角色同样失败，失败发生在初始 `state:"starting"` 信封处，早于任何终态分组。
- 该轴即 `## 调研` F-001 已实测触发 **80 次**的 `PROTOCOL_INCOMPATIBLE`。本次为**当场复现**，且为**完全阻断**级别（结果为空、无 provider 输出）。

### 3) 用户裁定
用户 2026-09-19 裁定：**把「两边材料 ID 严格相等」纳入本任务拆除/放宽范围**。

### 4) talk-round-3 裁定（2026-09-19）
- **F4 错误码统一** → 用户选：「统一成 PROCESS_TIMEOUT，把真实原因存为 cause_code」。含义：对外只保留一个错误码 `PROCESS_TIMEOUT`，print timeout 的真实原因以 `cause_code` 原样保留；下游重发门与恢复策略无需改。裁定：`3rd-review/lib/adapters/antigravity.mjs:7-8` 不再单独产出 `PROVIDER_PRINT_TIMEOUT` 作为对外码；`lib/provider-failure.mjs:67` 的映射保持 `PROCESS_TIMEOUT` 并把 print-timeout 事实写入 `cause_code`。
- **既有安全断言处置** → 用户选：「改断言：从「绝不调用」改为「只在源漂移事实下调用」+ 补墙钟禁止断言」。含义：`tests/review/review-managed-lifecycle.test.mjs:441-467` 的「cancelManaged 绝不调用」守卫改写为「仅在源漂移事实下调用」；同时必须**补一条新断言禁止因墙钟计时而调用**，否则 D-030③ 只剩口头约束。

## 需求权威更新（2026-09-19 step 10 细节审查结果）

### 细节审查结果：recorded but unavailable（零 finding，同根因）
- 合法材料键（与 direction 轨不同）：`runtime/review/stage-materials.json:78-86` `stages["make-decision"].tracks.detail` 要求 `["raw_requirement","approved_direction","draft_spec_or_acceptance","review_instructions"]`，可选 `["context_map","evidence_map"]`；`review_instructions` 由 runner 生成。方向轨的 `objective_facts`/`convergence_outline` **在本轨非法**。契约见 `skills/wh-review/contracts/make-decision.md:60-93`，其中 `:96-97` 要求 `approved_direction` 与当前 `decision-log.md` 逐字节一致。
- 请求：`/tmp/detail-review-request.json`，仅含 `stage="make-decision"`、`review_track="detail"`、`host_provider="codex/luna"`、`materials={raw_requirement, approved_direction, draft_spec_or_acceptance}`。`approved_direction` ＝当前 `decision-log.md` 全文（逐字节，sha256 相等，122233 字节）；`draft_spec_or_acceptance` ＝`## 决定` 段逐字节 + 31 条 OI 终态记录投影（62353 字符）；当时有 8 条 OI（OI-03,14,15,19,20,21,23,27）因其状态为 open/not_applicable/deferred 而无 selected_disposition；这些 OI 已在 step 12 前的材料修复中全部终结，现 31 条 OI 均带 selected_disposition。
- 预检：`unknown=[]`、`missing=[]`；host 侧冻结的 packet `material_id = ef13b63ef6c9741e223c9801c9b76216cc98fe99ae9cc32da4c23ec36560a737`；包 221345 字节（< 2 MiB 上限）。
- 命令：`node tools/cli/stage-runtime.mjs review --action=record --stage=make-decision --project=workflowhub --task=workflowhub-deferred-closeout-20260919 --input=/tmp/detail-review-request.json`，exit code 0。
- 结果：`status="recorded"`、`reused=false`、`dispatch_state="blocked_before_dispatch"`、`pair_id="3bb73395-c217-4cf5-8677-8cb8d92cadc8"`、`semantic_status="unavailable"`、`partial=true`。
- refs：红 `quality/reviews/attempts/ebb891c3-3478-53a2-a098-852314e00e81/attempt.json`、蓝 `quality/reviews/attempts/2c12c9e4-64d8-514a-a031-861576417fbe/attempt.json`；两者 `result_ref` **均为 null**；对报告 `quality/reviews/reports/make-decision-simple-691fe276-7f1e-5719-a6b4-cf9fb76958b5.md`。
- 错误逐字：`{"code":"PROTOCOL_INCOMPATIBLE","message":"PROTOCOL_INCOMPATIBLE: 3rd-review managed lifecycle envelope is invalid"}`。
- **根因与 step 6 相同，不是新缺陷**：broker 侧 `/tmp/3rd-review/e52cca8d-.../managed/public.json` 与 `.../3fb3a8b8-.../managed/public.json` 均报 `material_id = 1bb7d0bbcfe4b10b4063448b4e5293230d0baf3d5c294debac7ac60adeff51fe`，且 `request_id`/`runtime_id` **匹配**；唯一失败的合取项就是 `skills/wh-review/scripts/review-provider-client.mjs:687` 的严格相等（`:691` 抛出）。方向轨为 `6628e105…`（broker）vs `49706015…`（host）；细节轨为 `1bb7d0bb…` vs `ef13b63e…`。摘要值不同只因冻结材料集不同，机制一致。
- **零条款 finding**：`result_ref` 双 null，两份角色报告 findings 为空。**不是 pass**，不得记为通过或批准。
- 未重试（确定性失败）。未修改任何跟踪文件。

### 两次审查的合并结论
方向审查（step 6）与细节审查（step 10）**双双 unavailable，同一根因**。因此：修复跨仓 `material_id` 规范化是让本阶段获得任何独立审查建议的**前置条件**；该修复已由 OI-30/D-017 决定，且其方向（对齐到 3rd-review 公开 v3 算法并冻结、不得取消比较）已由 grill G-001 裁定。

## 需求权威更新（2026-09-19 step 11 用户最终确认）

### 用户最终确认（逐字保留）
- 用户在 2026-09-19 的结构化问答卡上选择：**「确认接受，签发」**。
- 用户同时确认不可逆授权范围：**「授权：开分支 + commit（不 push）」**——即授权对 `/Users/Hugh/Hugh/Project/3rd-review` 开分支并 commit，**不 push**；该授权的对象是 OI-22 / D-011。
- 确认绑定语义：本确认绑定**当前 `decision-log.md` 的内容范围**；后续材料细化不使其失效，真正方向改变仍需新的真实答复。
- 宿主问答工具降级事实：宿主工具返回用户真实选择，但不提供 `reply_ref` / `reply_hash`；按 `talk-with-zhipeng` 契约的降级路径处理，**未伪造**工具调用、答案或回复凭证。确认对象的 content-addressed ref/hash 由 step 11 的官方 `confirm` 入口与 interaction aggregate 单向绑定。
- 未确认内容：无。

### 重新签发（材料修订后，2026-09-19）

- 用户原话：**「确认接受修订后的材料，重新签发」**
- 该确认是本阶段**当前有效**的确认：绑定当前材料字节（sha256 `dc1f26db9c53cf0437c2be73689f91d594d770d3a59c90d5533abd250b7c6457`）与对应 `material_revision`；由官方 `confirm` 入口登记，并已由本阶段 `human_confirmation` 质量事实绑定。
- **授权延续**：用户此前授权的「开分支 + commit（不 push）」在本任务范围内**继续有效**，未因重新签发而撤销；push 仍不在授权内。
- 过程更正：`confirm` 的 SKILL 标准命令会产出 `subject_ref` 为空、不可绑定的确认；必须附带 `--attempt=specs/<task>/decision-log.md` 才能绑定到决策。此为本阶段实测发现，登记为观察项。

## 需求权威更新（2026-09-19 step 12 语义检查处置）

step 12 的语义检查透镜（`stage-end-spec-analyze`）对原始需求 + 本材料 + 入口清单运行，共产出 10 条 finding（F-01..F-10）。其中只有 F-03（覆盖缺口）改变决定，已由用户 2026-09-19 裁定「纳入范围（推荐）」正式批准进入本任务范围；其余 9 条均为既定方向内的一致性/登记性修复，用户裁定「全部修完，再请一次确认（推荐）」。逐条处置如下：

| finding_id | 类别 | 严重度 | 处置 |
|---|---|---|---|
| F-01 | inconsistency | HIGH | 已修：`## 范围` 重写 |
| F-02 | inconsistency | HIGH | 已修：`## 风险与延期交接` DEF-003 改为 OI-25 终态 |
| F-03 | coverage | HIGH | **用户裁定纳入范围**：`一次即熔断` 与 `供阶段路由消费的聚合健康预检结论` 补入 OI-07；见 `## 需求权威更新` 本条 |
| F-04 | inconsistency | MED | 已修：放宽计数统一为 6（第 4 项放宽已由合并 `d8c74fdc` 修复）；OI-28 acceptance 重新锚定 |
| F-05 | inconsistency | MED | 已修：`## 最终确认` 补记本次重新签发原话与授权延续 |
| F-06 | underdefined | MED | 已修：OPEN-014/015 补触发条件与关闭条件 |
| F-07 | constitution-alignment | LOW | 已修：ADR 登记补 consumer 与删除/保留条件；修掉悬空锚点 |
| F-08 | duplication | LOW | 已修：`## 收敛检查` 方案行去重 |
| F-09 | inconsistency | LOW | 已修：step 10 段落标注为历史时态 |
| F-10 | inconsistency | LOW | 已修：ADR 与 D-017/G-001 措辞统一为「3 个哈希实现 + 4 个相等点」 |

step 12 的发布路径在仅会话内模型下不存在（`tools/cli/stage-runtime.mjs:1092` 明确拒绝 `receipts.stage_outcomes`；`spec_analyze` 唯一来源是被 CLI 拒绝的外部 stage-outcome 路径），故其质量事实如实记为 missing/unavailable，未伪造发布。

step 14 stage-reflection：本阶段复盘由 on_stage_end 钩子在发布事务内执行，结果为 `unavailable`（`reason_code: executor_absent`），并已发布可用性事实 `quality/evidence/stage-reflection-availability/e5c6b763a92f8465b6affe498921a004f385ad74356831422119bcb8f7fc9cd0.json`；未伪造复盘判断。

## 需求框架

- **framework**：`functional`（背景→问题→目标→方案→验收→扩展）
- **选择理由**：本任务是对既有 workflowhub 机制、审查管线与阶段运行时做改进与收口，属于功能/工作流变更；入口清单提供的是证据与提案而非研究论断，故不选 `research` 外层框架。§4.9 的 F4～F12 属于证据未闭合的实现细节，挂到受影响的 solution/acceptance 节点下，不新建平行需求列表。
- **回填规则**：调研、Talk、审查、Grill 只能扩展已有节点；不得另建需求列表。

| node_id | 节点 | status | evidence_status | evidence_owner | next_review_trigger |
|---|---|---|---|---|---|
| N-background | 背景 | confirmed | none | make-decision | 无 |
| N-problem | 问题 | open | pending | make-decision | talk-round-1 收敛 |
| N-goal | 目标 | open | pending | make-decision | talk-round-1/2 收敛 |
| N-solution | 方案 | open | pending | make-decision + build-spec | step 4 调研完成 |
| N-acceptance | 验收 | open | pending | make-decision | talk-round-2 收敛 |
| N-extension | 扩展 | open | pending | make-decision | step 12 spec-analyze |

## 唯一 OI 大纲

`outline_version: v2`；`task_id: workflowhub-deferred-closeout-20260919`；共 **31** 条 OI 记录（OI-01～OI-31）。

大纲只存在于本份 `decision-log.md`；不得另建需求账本、状态机或第五份材料。

### 框架节点（六节点）

| framework_node | oi_ids | empty | reason |
|---|---|---|---|
| background | OI-01 | false | |
| problem | OI-02, OI-03, OI-04 | false | |
| goal | OI-05, OI-06, OI-07, OI-08, OI-09, OI-10, OI-11, OI-12, OI-28 | false | |
| solution | OI-13, OI-14, OI-15, OI-16, OI-17, OI-18, OI-19, OI-30 | false | |
| acceptance | OI-20, OI-21, OI-22, OI-23, OI-24, OI-29 | false | |
| extension | OI-25, OI-26, OI-27, OI-31 | false | |

### 固定类别（六类）

| category | oi_ids | empty | reason |
|---|---|---|---|
| complete_user_flow | OI-01, OI-02, OI-05, OI-27 | false | |
| page_scope | OI-24 | false | |
| data_state | OI-06, OI-09, OI-10, OI-13, OI-14, OI-15, OI-16, OI-17, OI-18, OI-19, OI-23, OI-30 | false | |
| success_failure_boundary | OI-03, OI-07, OI-08, OI-20, OI-21, OI-26, OI-28, OI-29, OI-31 | false | |
| non_goals | OI-04, OI-11, OI-22 | false | |
| deferred | OI-12, OI-25 | false | |

### OI 记录

```yaml
- oi_id: OI-01
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: complete_user_flow
  source: "用户原话：「尽量一个任务做完，不要浪费那么多时间做那么多任务」＋「已经判死或不用再做的任务，就不要放在当前任务规划范围内了」；入口清单 §4 L144-208"
  question: "本任务权威在范围集合是否＝入口清单 §4 的 4.1、4.2、4.3、4.4、4.6、4.7 六项，且 4.5 为非目标、4.8 为延期、§1 DEF-01～DEF-09 为终态？"
  status: confirmed
  impact_dimensions: [scope]
  requires_user_decision: true
  visible_group_id: talk-r1
  selected_disposition: "范围＝{4.1, 4.2, 4.3, 4.4, 4.6, 4.7}；4.5 非目标；4.8 延期；DEF-01～DEF-09 终态不进范围"
  evidence: "用户 2026-09-19 原话两条；入口清单 §1 L15-27、§4 L144-208、§7 L290"
  acceptance: "`## 范围` 与 `## 非目标` 两节列出的项与上述集合逐条一致；`## 决定` 中不出现 4.5/4.8 的施工条目"
  counterexample: "若材料或后续 diff 出现以 4.5 为目标的拆文件/搬家改动，或出现 4.8 的成本采集改动，即判本 OI 失败"
- oi_id: OI-02
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: complete_user_flow
  source: "用户原话：「尽量一个任务做完」；入口清单 §4 L148-196"
  question: "六个活跃候选是否构成一个可完成的单任务，还是必须拆分为多个任务？"
  status: confirmed
  impact_dimensions: [scope, acceptance]
  requires_user_decision: true
  visible_group_id: talk-r1
  selected_disposition: "确认为单任务：六个活跃候选合并为一个任务，任务内部按依赖排成可独立验证的执行序"
  evidence: "用户 2026-09-19 talk-round-1 答复「装进一个任务（推荐）」"
  acceptance: "材料只存在一套 OI 大纲与一个任务范围；不产生第二份任务或第二套材料"
  counterexample: "若为此拆出第二个任务目录/第二套材料，即判本 OI 失败"
- oi_id: OI-03
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: success_failure_boundary
  source: "入口清单 §4.1 L154、§4.2 L160、§4.3 L167；用户原话：「不要跳阶段，也不要依赖 build-spec 补需求」"
  question: "当 4.2 硬性排在 4.1 之后、4.3 又依赖 D-030③ 裁定时，本任务的「完成」边界如何定义，才算没有把需求推给下游？"
  status: confirmed
  impact_dimensions: [acceptance]
  requires_user_decision: true
  visible_group_id: talk-r2
  selected_disposition: "本任务完成边界＝材料四份口径齐全且用户已确认；实现细节不构成方向级未决"
  evidence: "用户 2026-09-19「确认接受，签发」；本文件 `## 最终确认`"
  acceptance: "`## 决定` 中每条已定 OI 均有 D 条目，且 `## 收敛检查` 四行均有真实答复或显式未决"
  counterexample: "若以「留给 build-spec」代替方向级结论，即判失败"
- oi_id: OI-04
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: non_goals
  source: "入口清单 §1 L15-27（DEF-01～DEF-09 终态表）；§7 读取规则 L290「§1 的 DEF-* 已全部判终态，不得当作待办直接执行」"
  question: "DEF-01～DEF-09 是否确实全部为终态、不构成待办？"
  status: confirmed
  impact_dimensions: [ordinary_detail]
  requires_user_decision: false
  selected_disposition: "确认为终态，不进本任务范围；只在 `## 非目标` 登记一行，不为其建立施工 OI；本条为事实核验，不是范围决策，故 impact 记为 ordinary_detail"
  evidence: "入口清单 §1 L17-27 终态表；DEF-01～DEF-07 判取消、DEF-08 已登记、DEF-09 已闭合"
  acceptance: "`## 非目标` 含 DEF-01～DEF-09 终态说明；`## 决定` 中无复活 verify.json / 拆 stage 巨人文件 / 改阶段协议 的条目"
  counterexample: "若本任务出现复活 `quality/verify.json`、拆分 `stage-content-contracts.mjs`、或修改 `workflows/build-code/steps.json` 的改动，即判失败"
- oi_id: OI-05
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: complete_user_flow
  source: "入口清单 §4.1 L148-154；输入文件 followup-tasks §3、build-verify-blocker-root-cause §7、m17-missing-stage-close-analysis L226-250"
  question: "4.1 `workflowhub-quality-terminal-closure` 的「正交质量终态 + canonical publisher + close-readiness 预检」三项各自的确切边界是什么？"
  status: not_applicable
  impact_dimensions: [goal, scope, acceptance]
  requires_user_decision: true
  visible_group_id: talk-r1
  selected_disposition: "整体砍掉：4.1 要建的正交终态状态机已被用户 Q13/R6 明确否决（改为用字段承接）；其主输入方案亦被用户整体否决。本任务不实施 4.1 主体。"
  evidence: "specs/workflowhub-mechanism-simplification-20260910/decision-log.md:125,1744,1745；prd.md:164；用户 2026-09-19 裁定「整体砍掉」"
  acceptance: "本任务不新增任何终态状态机、谓词表或状态字段；diff 中不出现 `completed_with_quality_unavailable`"
  counterexample: "若本任务新增正交终态状态机或第二个 status projection，即判失败"
  reason: "4.1 主体已被用户整体砍掉，无可交付项，见 `## 非目标` 第 1 条"
  counterexample_boundary: "若本任务新增正交终态状态机、第二个 status projection 或相关 schema，本条失效并须重算"
- oi_id: OI-06
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: data_state
  source: "入口清单 §4.2 L156-161；followup-tasks L128-150"
  question: "4.2 `workflowhub-material-binding-digest` 的 behavior / governance digest 拆分边界是什么，历史兼容必须保住什么？"
  status: confirmed
  impact_dimensions: [scope, acceptance]
  requires_user_decision: true
  visible_group_id: talk-r2
  selected_disposition: "收入本任务：做 behavior / governance digest 拆分，方向是减少 churn（格式类改动不再让测试/审查失效）；历史兼容最后做"
  evidence: "用户 2026-09-19 talk-round-2 第二批裁定；F-009"
  acceptance: "拆分后 behavior / governance 两轴成立且历史材料仍可读；既有针对性测试通过"
  counterexample: "若格式类改动仍使测试或审查失效，或历史材料不可读，即判失败"
- oi_id: OI-07
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: success_failure_boundary
  source: "入口清单 §4.3 L163-168；§2.4 L129-131；D-030③ 见 specs/archive/workflowhub-mechanism-simplification-t2-20260911/decision-log.md:457"
  question: "4.3 中哪一部分受 D-030③ 约束需要重新裁定，哪一部分（仅披露既有 broker 成员级事实）是可做的？"
  status: confirmed
  impact_dimensions: [scope, acceptance]
  requires_user_decision: true
  visible_group_id: talk-r1
  selected_disposition: "披露 broker 既有成员级事实 + 接通 3rd-review 既有取消接口；须与 OI-10/OI-23 的否决表述及既有测试断言一并裁定（见 需求权威更新）；范围更正：墙钟守卫在 tests/review/review-managed-lifecycle.test.mjs:526-558，「绝不取消」守卫共 6 处（:378,:433,:478,:507,:540,:584），须逐处改为「仅源漂移事实下调用」并新增禁止墙钟调用断言；step 12 语义检查发现 §4.3 核心目标尚有两项无处置，经用户 2026-09-19 裁定纳入本任务范围：① 一次即熔断（同指纹不重复派发、缺可派发 provider 时不再盲目重发）；② 供阶段路由消费的聚合健康预检结论（预检裁决被 stage routing 消费，而非只写诊断）"
  evidence: "用户 2026-09-19 talk-round-1 答复「披露 + 接通既有取消接口」；溯源更正：上一个任务对 cancelManaged 的「否决」是 agent 推断而非用户决定（见 需求权威更新 ### cancelManaged 溯源更正）；用户 2026-09-19 step 12 处置裁定；F-003"
  acceptance: "取消接口在源漂移事实下被调用且新增禁止因墙钟调用的断言（6 处守卫逐处改写）；同指纹不重复派发；聚合健康预检结论被阶段路由消费；既有针对性测试通过"
  counterexample: "若仍因墙钟计时调用取消、或同指纹被重复派发、或预检结论只写诊断未被路由消费，即判失败"
- oi_id: OI-08
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: success_failure_boundary
  source: "入口清单 §4.4 L170-175；用户已确认方向「宽容格式、7 条红线不动」（入口清单 L174）"
  question: "4.4 `workflowhub-review-output-tolerance` 中「有界提取异源建议」与「7 条红线不动」的确切分界在哪里？"
  status: confirmed
  impact_dimensions: [scope, acceptance]
  requires_user_decision: true
  visible_group_id: talk-r2
  selected_disposition: "收入本任务，但只做「5 项拆除 + 6 项放宽」未覆盖的剩余部分（合并已交付别名/JSONL/嵌套/单 fence 解析）；剩余＝把宽容边界与 7 条红线的关系写成规格，并处置「未识别严重度静默丢弃」这一未登记的行为变化"
  evidence: "用户 2026-09-19 talk-round-2 第二批裁定「三项都收，但 4.3/4.4 只做拆松没盖住的剩余」；F-009"
  acceptance: "宽容边界与 7 条红线的关系在 spec 成文，未识别严重度的处置写成规格条目"
  counterexample: "若 7 条红线被改动，或未识别严重度仍为无记录静默丢弃，即判失败"
- oi_id: OI-09
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: data_state
  source: "入口清单 §4.6 L185-189；workflowhub-defects-from-paperbuilder-m1.md L19/L179/L258/L347"
  question: "4.6 的四条结构缺陷中，哪几条仍在范围内、哪几条与已修堵点同根已闭合？（合并后现场复核：缺陷1/4 已修、缺陷3 部分已修、缺陷2 仅搬家；待 talk-round-3 收敛取舍）"
  status: confirmed
  impact_dimensions: [scope, acceptance]
  requires_user_decision: true
  visible_group_id: talk-r2
  selected_disposition: "以现场为准，只补真缺口：只做缺陷3 的窄判别（跳过须进 errors / 或把无标题正文判为 MATERIAL_INCOMPLETE）；缺陷1/2/4 记为已修并附证据"
  evidence: "用户 2026-09-19 裁定「以现场为准，只补真缺口」；F-009 现场复核"
  acceptance: "跳过同时进 facts.spec_analyze 与 errors，状态与账目一致；针对性测试通过"
  counterexample: "若跳过仍只进 facts，或新增 hasMarkdownHeadings 以外的判别面，即判失败"
- oi_id: OI-10
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: data_state
  source: "入口清单 §2.2 L105-117、§2.3 L119-127；本任务 step 1 现场实测：3rd-review HEAD a96f28b 工作树有 8 个未提交改动文件"
  question: "4.7 的真实剩余范围是什么？入口清单 §2.2/§2.3 描述的状态已被工作树现状推翻，须按现场 diff 重新推导（范围裁定依赖 step 4 现场 diff 复核；用户已选「先复核再定范围」）"
  status: confirmed
  impact_dimensions: [scope, acceptance]
  requires_user_decision: true
  visible_group_id: talk-r1
  selected_disposition: "全收现场复核出的 8 项剩余；范围以现场 diff 为准，不照入口清单 §2.3 的过期状态"
  evidence: "用户 2026-09-19 talk-round-2 答复「全收 8 项」；F-007 现场复核"
  acceptance: "现场复核出的 8 项各有落地条目；不照入口清单 §2.3 的过期状态表重做"
  counterexample: "若全量重做已完成的修法，或漏掉 8 项任一项，即判失败"
- oi_id: OI-11
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: non_goals
  source: "入口清单 §4.5 L177-183「DEF-01 已判取消，故该提案同步作废或需重新论证」；DEF-01 L32-34"
  question: "4.5 `workflowhub-stage-giant-slicing` 是否确认不进本任务范围？"
  status: confirmed
  impact_dimensions: [scope]
  requires_user_decision: true
  visible_group_id: talk-r1
  selected_disposition: "确认为非目标，不进范围。解锁条件：满足 DEF-01 触发条件①真实维护事故 / ②consumer 证据 / ③新可观测判据，或用户显式推翻该取消结论"
  evidence: "用户原话「已经判死或不用再做的任务，就不要放在当前任务规划范围内了」；DEF-01 L29-34 取消理由"
  acceptance: "本任务 diff 中不出现 `stage-content-contracts.mjs` / `stage-runner.mjs` / `review-record-route.mjs` 的拆文件或搬家改动"
  counterexample: "若以「拆文件/加统一层/改名」形式落地原提案的 ≤3000 行目标，即判失败"
- oi_id: OI-12
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: deferred
  source: "入口清单 §4.8 L198-203；m15-retirement decision-log:318；m17-repo-skills-multicli decision-log:277"
  question: "4.8 `workflowhub-cost-baseline-remeasure` 是否确认延后、且本任务不产出任何收益数字？"
  status: deferred
  impact_dimensions: [scope]
  requires_user_decision: true
  visible_group_id: talk-r1
  selected_disposition: "延后，不进范围。解锁条件：出现新的治理决定重新授权度量通道（m15-retirement 已整删监控/遥测件、m17 拒绝恢复）"
  evidence: "入口清单 §4.8 前置裁定（硬）；本任务不新增采集面、不产出收益数字"
  acceptance: "本任务 diff 中不新增任何采集/遥测/度量文件或字段，材料中不出现 before/after 收益数字"
  counterexample: "若出现新的成本采集面或收益数字作为结论，即判失败"
  owner: "下一轮任务（需新的治理决定重新授权度量通道）"
  trigger_condition: "用户或治理显式重新授权成本度量通道"
  scope_boundary: "4.8 成本重测的全部采集面与收益数字"
  impact: "本任务无 before/after 基线，后续成本判断继续缺可复核原件"
  follow_up_acceptance: "重测在既有采集面内完成且不新增遥测件"
- oi_id: OI-13
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: data_state
  source: "入口清单 §4.1；本任务 step 1 实测：`completed_with_quality_unavailable` 在 runtime/ core/ tools/ tests/ skills/ 零命中（NOT DOCUMENTED）"
  question: "4.1 的终态由哪个既有模块承载，是否会新增持久对象或 schema？"
  status: not_applicable
  impact_dimensions: [ordinary_detail]
  requires_user_decision: false
  selected_disposition: "随 OI-05 一并关闭：不新增终态对象，故无 owner 模块可选；本条为归属细节，不是范围决策，故 impact 记为 ordinary_detail"
  reason: "4.1 不新增终态对象，故无 owner 模块可选"
  counterexample_boundary: "若新增终态对象或 schema，本条失效并须重算"
- oi_id: OI-14
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: data_state
  source: "入口清单 §4.2；本任务 step 1 实测：`behavior_digest` / `governance_digest` 零命中（NOT DOCUMENTED）；runtime/task/material-workspace.mjs:42-61"
  question: "4.2 的 behavior/governance digest 确切定义、producer、唯一 consumer 与历史兼容规则是什么？"
  status: confirmed
  impact_dimensions: [scope, acceptance]
  requires_user_decision: true
  visible_group_id: talk-r2
  selected_disposition: "方向已定：behavior / governance 两轴拆分；具体字段名、producer 与历史兼容规则属实现细节，在已确认方向内由 build-spec 细化"
  evidence: "用户 2026-09-19「三项都收」；F-009"
  acceptance: "spec 中出现 behavior / governance 两轴拆分且不新增第二套摘要"
  counterexample: "若新增第二套摘要或让格式类改动继续使测试失效，即判失败"
- oi_id: OI-15
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: data_state
  source: "入口清单 §4.4；skills/wh-review/scripts/review-output.mjs、review-materials.mjs；runtime/review/review-output.mjs"
  question: "4.4 对歧义抽取、多候选 findings、JSONL 混合有效/无效记录的确定性规则是什么？"
  status: confirmed
  impact_dimensions: [scope, acceptance]
  requires_user_decision: true
  visible_group_id: talk-r2
  selected_disposition: "方向已定：歧义抽取与多候选的确定性规则由 build-spec 在已确认的宽容边界内成文；合并已交付别名 / JSONL / 嵌套 / 单 fence 解析"
  evidence: "用户 2026-09-19「三项都收」；F-009"
  acceptance: "spec 中出现歧义与多候选的确定性规则，且不放宽 7 条红线"
  counterexample: "若以「略过不表」代替规则，或放宽任一红线，即判失败"
- oi_id: OI-16
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: data_state
  source: "paperbuilder-m1 缺陷 1；runtime/stage/completion-predicates.mjs:618 `deriveExecutionOutcomes`"
  question: "4.6 缺陷 1 的 execution-outcome 谓词元数（1 元 vs 4 元）修复边界是什么？"
  status: not_applicable
  impact_dimensions: [ordinary_detail]
  requires_user_decision: false
  selected_disposition: "已修：写侧改用 per-stage scope revision（runtime/stage/stage-runner.mjs:1144-1147），读侧改为披露 provenance stale；本任务不重做"
  reason: "缺陷1 已由合并修复（`runtime/stage/stage-runner.mjs:1144-1147`），本任务不重做"
  counterexample_boundary: "若 diff 再现 execution-outcome 谓词元数改动，本条失效"
- oi_id: OI-17
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: data_state
  source: "paperbuilder-m1 缺陷 3（静默跳过，L258-343）；skills/spec-analyze/SKILL.md:49,83-84；runtime/stage/stage-runner.mjs:496,1896"
  question: "4.6 缺陷 3：分析器在材料未提供或非正文时静默跳过内容检查的确切位置与修法边界？"
  status: confirmed
  impact_dimensions: [ordinary_detail]
  requires_user_decision: false
  selected_disposition: "唯一真缺口：跳过当前只进 facts.spec_analyze 不进 errors，且判别只靠 hasMarkdownHeadings；修法按用户「只补真缺口」口径收敛为窄判别修复"
  evidence: "F-009；用户 2026-09-19 裁定"
  acceptance: "两个分支的跳过都写入 errors，hasMarkdownHeadings 判别面不变"
  counterexample: "若无标题正文仍被静默跳过且无 errors 条目，即判失败"
- oi_id: OI-18
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: data_state
  source: "runtime/stage/stage-content-contracts.mjs:450-461；runtime/stage/stage-handlers.mjs:2407"
  question: "4.6 缺陷 4：`direction_change` finding 的终态处置路径如何补齐？"
  status: not_applicable
  impact_dimensions: [ordinary_detail]
  requires_user_decision: false
  selected_disposition: "已修：runtime/stage/stage-content-contracts.mjs:451 现接受 fixed；本任务不重做"
  reason: "缺陷4 已修（`runtime/stage/stage-content-contracts.mjs:451` 现接受 fixed），本任务不重做"
  counterexample_boundary: "若 diff 再现 direction_change 终态处置改动，本条失效"
- oi_id: OI-19
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: data_state
  source: "入口清单 §4.9 F10 L223/L235（red F-e98d8633a90a、blue F-c085e273aebd）"
  question: "F10：若新增持久 attempt 字段，其字段名/类型/枚举/生产者/唯一 consumer/历史兼容与迁移规则是什么？"
  status: not_applicable
  impact_dimensions: [ordinary_detail]
  requires_user_decision: true
  visible_group_id: talk-r2
  selected_disposition: "不新增持久 attempt 字段，本项关闭"
  reason: "用户明确不接受新增 schema；F10 的持久 attempt 字段不实施"
  counterexample_boundary: "若本任务新增 attempt 字段或 schema，本条失效并须重算"
- oi_id: OI-20
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: success_failure_boundary
  source: "入口清单 §4.1～§4.7 各自的验证面；用户原话：「每条修复写出逐项通过/失败判据」语义来源同源 R-005"
  question: "每个候选的针对性验证面是什么，用哪条既有测试/命令证明通过、什么算失败？"
  status: confirmed
  impact_dimensions: [acceptance]
  requires_user_decision: true
  visible_group_id: talk-r2
  selected_disposition: "验收只由既有针对性测试证明，不新建账本、计数脚本或采集面"
  evidence: "用户 2026-09-19「只用既有针对性测试，不做前后计数」；F-001"
  acceptance: "每个候选指明其既有针对性测试文件"
  counterexample: "若本任务新增任何验收机制、账本或采集面，即判失败"
- oi_id: OI-21
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: success_failure_boundary
  source: "入口清单 §4.9 F6 L219/L231、F8 L221/L233、F9 L222/L234"
  question: "F6/F8/F9 的不可证伪验收是否替换为有确定性命令/退出码的判据？"
  status: confirmed
  impact_dimensions: [acceptance]
  requires_user_decision: true
  visible_group_id: talk-r2
  selected_disposition: "不替换为新的确定性判据集，也不新增强硬验收；不可证伪的表述不作为验收，只作为方向性目标登记"
  evidence: "用户 2026-09-19「尽量简单！不要加任何强硬的验收」"
  acceptance: "材料中不出现新建的验收清单或机制"
  counterexample: "若为 F6/F8/F9 新建验收机制或账本，即判失败"
- oi_id: OI-22
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: non_goals
  source: "入口清单 §2.2 L117「本任务已获用户显式授权改动该仓」；本任务 step 1 实测：3rd-review 工作树存在 8 个未提交改动文件"
  question: "本任务对 `/Users/Hugh/Hugh/Project/3rd-review` 的写入边界是什么，是否包含 commit/push？"
  status: confirmed
  impact_dimensions: [scope, acceptance]
  requires_user_decision: true
  visible_group_id: talk-r1
  selected_disposition: "本任务可改 3rd-review 工作树并跑测试，并在该仓开分支 commit；commit/push 属不可逆动作，须 step 11 显式授权后方可执行；经用户 2026-09-19 step 11 显式确认，授权范围确定为「开分支 + commit（不 push）」，push 不在本次授权内"
  evidence: "用户 2026-09-19 talk-round-1 答复「改 + 测试 + 在该仓开分支 commit」；用户 2026-09-19 step 11 确认"
  acceptance: "step 11 之前 3rd-review 无任何 commit/push；授权后提交落在该仓独立分支"
  counterexample: "若在 step 11 授权前对 3rd-review 执行 commit/push，即判失败"
- oi_id: OI-23
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: data_state
  source: "入口清单 §4.9 F12 L225/L237（red F-645d7bc4ecf4、blue F-9df331856d3e）"
  question: "F12：OI-20 的「8 文件 9 行」与其自身枚举（4 文件）不一致，净行数账目如何重算？"
  status: not_applicable
  impact_dimensions: [ordinary_detail]
  requires_user_decision: false
  selected_disposition: "随上一任务归档，本项关闭"
  reason: "F12 的净行数账目属上一任务的内部记账，本任务不含该改动"
  counterexample_boundary: "若本任务出现对应行数改动，本条失效并须重算"
- oi_id: OI-24
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: page_scope
  source: "三输入规则（workflows/make-decision/SKILL.md:76-98）；step 1 现场实测仓库清单"
  question: "本任务是否存在任何页面/前端界面范围？"
  status: confirmed
  impact_dimensions: [ordinary_detail]
  requires_user_decision: false
  selected_disposition: "non_ui：原始需求无页面诉求；仓库无可运行前端应用、无路由、无前端框架依赖；六个候选均无计划中的前端改动；本条为三输入适用性事实，沿用 t3:OI-18 既有惯例记为 ordinary_detail"
  evidence: "本文件 `## UI applicability` 的 fenced JSON；package.json 依赖仅 ajv/js-yaml，devDeps 仅 markdownlint-cli2/vitest；全仓唯一 .html 为 tools/cli/build-reflection-page-template.html"
  acceptance: "`## UI applicability` 的 result 恒为 non_ui；本任务改动不落在任何前端文件"
  counterexample: "若出现新增页面/路由/前端依赖，或把 result 改成 ui 而无三输入证据，即判失败"
- oi_id: OI-25
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: deferred
  source: "入口清单 §4.9 L217-218,220,224,229-230,232,236（F4/F5/F7/F11）"
  question: "F4/F5/F7/F11 是交 build-spec/build-code 处置，还是必须在本阶段定案？（F5 cancelManaged 已由用户 talk-round-1 裁定「接通」解决；F7 「31 vs 72/24」已由现场复算澄清：33 attempts / 72 provider attempts / 24 failed 精确可复核；F11 属仓外文件表述、按契约不入材料；剩余 F4：adapter 产出 PROVIDER_PRINT_TIMEOUT 而 provider-failure 映射为 PROCESS_TIMEOUT，须二选一并写出映射）"
  status: confirmed
  impact_dimensions: [ordinary_detail]
  requires_user_decision: true
  visible_group_id: talk-r2
  selected_disposition: "F5 已由用户 talk-round-1 裁定「接通既有取消接口」解决；F7 已由现场复算澄清（33 attempts / 72 provider attempts / 24 failed 精确可复核）；F11 属仓外文件表述、按契约不入材料；F4 裁定为统一成 PROCESS_TIMEOUT 并把 print timeout 真实原因存入 cause_code"
  evidence: "用户 2026-09-19 talk-round-3 裁定；F-003"
  acceptance: "对外只产 PROCESS_TIMEOUT，真实原因保留在 cause_code；针对性测试通过"
  counterexample: "若仍有对外 PROVIDER_PRINT_TIMEOUT，或真实原因丢失，即判失败"
- oi_id: OI-26
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: success_failure_boundary
  source: "用户在 2026-09-19 结构化问答中的声明；skills/decision-log/SKILL.md:19-31"
  question: "本阶段是只问方向，还是可以问到实现细节？"
  status: confirmed
  impact_dimensions: [scope]
  requires_user_decision: true
  visible_group_id: talk-r1
  selected_disposition: "普通任务：保持既有提问与产物粒度，可以追问能改变实现的实现细节"
  evidence: "用户 2026-09-19 原话「普通任务」；本文件 `## 任务身份` 的唯一声明"
  acceptance: "`readTaskTypeFromDecisionLog` 回读结果＝普通任务"
  counterexample: "若回读结果不是 普通任务，或材料中出现第二条类型声明，即判失败"
- oi_id: OI-27
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: complete_user_flow
  source: "入口清单 §2.4 L129-131；用户原话：「主会话只进行子代理任务派发和交互类技能的执行」"
  question: "除 4.3/4.7 的跨仓部分外，§2 是否还要求任何 workflowhub 仓内的改动？（合并后现场：4.7 的 WorkflowHub 侧已把 process_outcome/parse_outcome 全链打通——runtime/review/schemas/attempt.schema.json:218-219、runtime/review/review-record-route.mjs:788-789,802-803、skills/wh-review/scripts/review-result.mjs:207-213、review-provider-client.mjs:365-373；PROVIDER_PRINT_TIMEOUT 仍非本仓产出）"
  status: confirmed
  impact_dimensions: [scope]
  requires_user_decision: true
  visible_group_id: talk-r1
  selected_disposition: "§2 剩余改动全在 3rd-review 侧；WorkflowHub 侧的 process_outcome / parse_outcome 链已由合并打通，本任务不再新增仓内改动"
  evidence: "F-009；F-014"
  acceptance: "本任务仓内 diff 不新增 §2 未列出的改动"
  counterexample: "若出现计划外的仓内机制改动，即判失败"
- oi_id: OI-28
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: success_failure_boundary
  source: "用户 2026-09-19 裁定：5 项拆除 + 6 项放宽全做；零触发红线保留"
  question: "哪些严格判定真的造成过阻塞，本任务拆/松到什么范围？"
  status: confirmed
  impact_dimensions: [scope, acceptance]
  requires_user_decision: true
  visible_group_id: talk-r2
  selected_disposition: "5 项拆除 + 6 项放宽全做；3 条零触发红线（③⑥⑦）保留不拆；禁止任何新增加严；另经合并后扫描裁定：合并新增的 11 处严格判定中，只有「validateManagedHealthProviders 要求 provider 集精确匹配」有旁证（与已触发 80 次的 PROTOCOL_INCOMPATIBLE 同轴）属可拆，其余登记为观察项不拆；两份 review-input-bounds.mjs 分叉按用户裁定对齐到宽松侧并删除 skill 侧新增的 fail-closed 抛出；另经 step 6 当场复现裁定：把跨仓「两边材料 ID 严格相等」一并纳入拆除/放宽范围；grill 裁定（G-002..G-005）：不在允许清单内的键丢弃+记显式事实；未锚定 finding 丢弃+记显式事实；20 分钟墙钟维持不动仅登记不一致；错误码注册表保持开放，注册表外的码原样透传并标为未分类；放宽清单修正：原处置表第 9 行（OUTPUT_INVALID 空 catch）已验证由合并提交 d8c74fdc 修复，本任务不做，实际需做 5 项拆除 + 6 项放宽"
  evidence: "F-001/F-002/F-003/F-007；用户 talk-round-2 与增量裁定原话；F-010；F-011；F-012；F-013"
  acceptance: "`## 调研` 的处置清单逐项列出 5 项拆除与 6 项放宽，且 ADR-0031 的逐条决定与之一致；diff 中不出现任何新增的严格判定；3 条零触发红线未被改动"
  counterexample: "若本任务新增任何严格判定，或改动了 ③⑥⑦ 三条零触发红线，即判失败"
- oi_id: OI-29
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: success_failure_boundary
  source: "用户 2026-09-19 原话：「尽量简单！不要加任何强硬的验收…完全无法维护」"
  question: "拆除/放宽严格判定如何证明真的生效，同时不新增任何验收机制或采集面？"
  status: confirmed
  impact_dimensions: [acceptance]
  requires_user_decision: true
  visible_group_id: talk-r3
  selected_disposition: "只用既有针对性测试，不做前后计数、不新增任何验收机制或采集面"
  evidence: "用户 2026-09-19 裁定「只用既有针对性测试，不做前后计数」；F-013、F-014"
  acceptance: "验收只由既有针对性测试证明；材料中不出现新的账本、计数脚本或采集面"
  counterexample: "若本任务新增任何验收机制、计数脚本或采集面，即判失败"
- oi_id: OI-30
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: data_state
  source: "step 6 方向审查当场复现：skills/wh-review/scripts/review-provider-client.mjs:687 严格相等 → :691 抛 PROTOCOL_INCOMPATIBLE；F-011；用户 2026-09-19 裁定纳入"
  question: "跨仓 material_id 规范化不一致导致审查完全阻断：修哪一侧、按什么规则对齐？"
  status: confirmed
  impact_dimensions: [scope, acceptance]
  requires_user_decision: true
  visible_group_id: talk-r3
  selected_disposition: "纳入本任务：消除「两边 material_id 必须严格相等」这一阻断。先只读查清哪一侧的规范化规则是权威（wh-review 的 reviewPacketMaterialId vs 3rd-review 的 canonicalWorkflowHubMaterialId），再按该规则对齐另一侧；不得靠放宽为「不比较」来实现。；grill 裁定（G-001）：对齐到 3rd-review 公开 v3 算法并冻结，不得取消比较；范围更正为 3 个哈希实现 + 4 个相等点"
  evidence: "F-011；skills/wh-review/scripts/review-provider-client.mjs:687,691；runtime/review/review-packet-identity.mjs:121-157；3rd-review/lib/attachments.mjs:110-116；F-012；F-014（step 10 细节审查同根因 unavailable）"
  acceptance: "修后同一次 make-decision 方向审查 dispatch 不再出现 blocked_before_dispatch 的 PROTOCOL_INCOMPATIBLE；既有针对性测试通过"
  counterexample: "若通过删除该比较、或把两侧任一侧的规范化改成与另一侧不一致的第三套规则来实现，即判失败"
- oi_id: OI-31
  task_id: workflowhub-deferred-closeout-20260919
  outline_version: v2
  category: success_failure_boundary
  source: "grill G-006 用户裁定：立 ADR"
  question: "本方向的边界规则是否需要一份可引用的 ADR？"
  status: confirmed
  impact_dimensions: [scope]
  requires_user_decision: true
  visible_group_id: grill
  selected_disposition: "立 ADR：不承载身份/顺序/hash/必需产物绑定的检查一律降级为质量事实；身份类检查不改宽松度、只统一算法"
  evidence: "用户 2026-09-19 grill G-006；F-012"
  acceptance: "ADR 文件存在于 docs/adr/ 且其决定行与本条 selected_disposition 一致"
  counterexample: "若无 ADR 文件、或 ADR 决定行把身份类检查也写成可放宽，即判失败"
```

## 目标

- 目标：把入口清单 §4 中**仍然可做的六个活跃候选**收口为一个任务，逐条界定边界、验收与拒绝面，使后续 build-spec / build-plan / build-code 只消费已确认方向，不替本阶段补需求。
- 目标不是：重开已判死项、恢复已删除的度量/验收对象、或新增控制面。

## 成功/失败边界

- 成功边界：见 `## 唯一 OI 大纲` 中每条 OI 的 `acceptance`；整体以「六个候选各自给出可观察的通过/失败判据 + 逐条处置」为准，验收账本沿用既有 `acceptance_criterion` facts。
- 失败边界：把未决方向静默交给 build-spec；复活 `quality/verify.json`/`quality-verify.v1` 或第二套验收账本；新增 stage / public command / schema / 持久对象 / gate / 双写；产出无原件的收益数字。
- 本条为 step 1 初步边界，Talk round 2 收敛后由 `## 收敛检查` 的「验收」行定稿。

## 范围

- 当前范围＝{4.2, 4.3, 4.4, 4.6, 4.7} 加严格判定 5 项拆除 + 6 项放宽；4.1 已砍（见 `## 非目标` 第 1 条）；4.5 非目标、4.8 延期；D-030③ 边界已裁定（披露 + 接通既有取消接口，20 分钟墙钟维持）。
- 执行序：4.7 八项与严格判定拆除/放宽为主线；4.2 收入；4.3 含新增两项（一次即熔断、聚合健康预检结论）；4.4 只做拆松未覆盖的剩余；4.6 只补缺陷3 窄判别。
- 用户流程/结果只记索引和验收影响，细节进入 spec。

## 非目标

1. **4.1 `workflowhub-quality-terminal-closure` —— 已被用户否决，非目标**。用户 Q13/R6 明确选择「用字段承接，不要用状态机承接」；其主输入方案 `workflowhub-followup-tasks-20260910.md` 已被用户整体否决。解锁条件：用户显式推翻该否决，或改用既有字段承接。
2. **任何新增的严格判定 / 加严 —— 非目标**。用户 2026-09-19 原话：「我不允许任何严格的的判断出现！无论是workflowhub或3rd-review」。
3. **任何新增的强硬验收 / 采集面 —— 非目标**。用户原话：「不要加任何强硬的验收，我被workflowhub一大堆的验收和收集搞怕了」。
4. **4.5 `workflowhub-stage-giant-slicing` —— 判死，非目标**。DEF-01 已取消，原提案作废（入口清单 §4.5 L181、DEF-01 L29-34）。解锁条件：DEF-01 触发条件①真实维护事故 / ②consumer 证据 / ③新可观测判据，或用户显式推翻取消结论。
5. **DEF-01～DEF-09 —— 全终态**（入口清单 §1 L15-27），不是交付物，只在本节登记。
6. 不复活 `quality/verify.json` / `quality-verify.v1` 或任何第二套验收账本（DEF-05 L60、DEF-08 L79-84；C6 删除边界）。
7. 不新增 stage、public command、schema、持久对象、gate 或双写（AGENTS.md vNext 边界；CONSTITUTION）。
8. 不新增任何统计 / 度量 / 遥测采集面（m15-retirement、m17 治理决定）。
9. 不写入 `specs/archive/**`（只读）。
10. 不在无对应触发条件时重开 DEF-02 / DEF-06 / DEF-07。

## UI applicability

```json
{
  "result": "non_ui",
  "sources": {
    "raw_requirement": { "result": "non_ui", "fact": "用户原话与入口清单 §4 全部候选均为 workflowhub 机制、治理、审查管线与阶段运行时条目，原始需求中不含任何页面、交互或前端组件诉求" },
    "project_inventory": { "result": "non_ui", "fact": "step 1 现场实测：仓库无可运行前端应用，package.json 依赖仅 ajv/js-yaml、devDeps 仅 markdownlint-cli2/vitest，无 React/Vue/Svelte/Vite/Next，runtime/ core/ tools/ 无 router/route 模块；全仓唯一 .html 为 tools/cli/build-reflection-page-template.html（生成物模板，非应用）" },
    "planned_or_changed_frontend_fact": { "result": "non_ui", "fact": "六个候选的改动面全部落在 runtime/**、core/**、skills/wh-review/**、tools/cli/** 与跨仓 3rd-review/lib/**，无计划中的前端文件改动" }
  }
}
```

## 收敛检查

| 维度 | 用户答案 | 事实或材料引用 | 可执行验收 |
|---|---|---|---|
| 目标 | 用户已确认：「尽量一个任务做完，不要浪费那么多时间做那么多任务」——把仍可做的候选合成一个任务完成，不铺成一堆小任务；用户 2026-09-19 追加：「已经判死或不用再做的任务，就不要放在当前任务规划范围内了」并砍掉 4.1 | OI-01、OI-02；`## 原始需求` R-002；`## 范围` | 场景：核对本任务交付是否覆盖六个活跃候选；数据来源：`## 唯一 OI 大纲` 的 OI-05～OI-10；通过：六个候选各有终态处置与验收判据；失败：任一候选无处置，或把范围外项（4.5/4.8）当交付物 |
| 范围 | 用户已确认：「已经判死或不用再做的任务，就不要放在当前任务规划范围内了」——4.5 非目标、4.8 延期、DEF-01～09 终态；4.1 已移入非目标；新增严格判定拆除/放宽（5 项拆除 + 6 项放宽）为范围内工作 | OI-04/D-003、OI-11/D-009、OI-12；`## 非目标`；`## 风险与延期交接` | 场景：核对 diff 与范围清单；数据来源：`## 范围` 与 `## 非目标`；通过：diff 不落在 4.5/4.8 目标上，非目标七条可逐条核验；失败：出现拆文件/搬家式改动、成本采集面、或第二套验收账本 |
| 方案 | 用户已答（talk-round-1/2）：单任务；4.7 全收 8 项；4.3 走披露+接通既有取消接口；跨仓可改+测试+开分支 commit（授权延后 step 11）；4.1 砍掉；严格判定 5 项拆除 + 6 项放宽，零触发红线 ③⑥⑦ 保留；合并新增严格判定只拆有旁证的 1 处、其余观察；bounds 分叉对齐宽松侧；4.6 以现场为准只补缺陷3；4.2/4.3/4.4 三项都收但 4.3/4.4 只做剩余；step 6 审查 unavailable（零 finding，非 pass），其暴露的跨仓 material_id 严格相等阻断已裁定纳入拆除范围；talk-round-3 裁定：F4 统一为 PROCESS_TIMEOUT + cause_code；取消断言改为「仅源漂移事实下调用」并补禁止墙钟调用断言；grill（G-001..G-006）裁定：material_id 对齐并冻结、不在允许清单内的键丢弃留痕、未锚定 finding 丢弃留痕、20 分钟墙钟维持、注册表开放、立 ADR；取舍：保留 20 分钟墙钟等待不动，换取取消调用边界不引入新增判定；被拒方案：照入口清单 §2.3 的过期状态给 4.7 定范围、照缺陷报告原文把 4.6 四条全做、靠删除 material_id 比较消除阻断；未决项：material_id 算法的书面权威定义（OPEN-014）与两条显式事实的形状（OPEN-015）交 build-spec 落地时冻结 | D-004、D-008、F-007、F-009、F-013、F-014 | 场景：核对四个轴的选择是否逐条落到 `## 决定` 与 `## 非目标`；数据来源：`## 需求权威更新` 与 `## 三轮 talk`；通过：四条选择各有对应条目且无被静默改写；失败：出现与用户答复不一致的处置，或未经 step 11 授权就执行跨仓 commit |
| 验收 | 已由用户裁定：只用既有针对性测试，不做前后计数；不新增任何强硬的验收、账本或采集面；DEF-09 已由合并闭合，无需再动；step 11 用户最终确认「确认接受，签发」，并授权跨仓开分支 + commit（不 push） | OI-20、OI-21、OI-03；R-005 | 场景：核对各候选是否可直接用既有针对性测试判定通过或失败（不做前后计数、不新增验收面）；数据来源：各候选既有针对性测试与 `tools/cli` 检查命令；通过：每个候选给出场景/数据来源/通过条件/失败条件四元；失败：出现无确定性判据的验收（如仅写「恢复成功率」） |


## 决定

本节是 make-decision 的决定索引：`### D-NNN` 与已决（`status: confirmed`）的 OI 一一对应，按模块分组，不复制 spec 内容。
`source_type/reference/exact_excerpt` 逐字取自 `## 需求权威更新` / `## grill` 记录的用户答复，或取自 `## 调研` 的 F-0xx 事实行。
`approval_binding` 记录用户确认状态；content-addressed ref/hash 由 step 11 的 interaction aggregate 单向绑定，不回填到本文件。

### 范围与合并

### D-001
- question/final_option: 本任务权威范围＝入口清单 §4 的哪几项？→ 4.1、4.2、4.3、4.4、4.6、4.7 六项为范围；4.5 非目标；4.8 延期；§1 DEF-01～DEF-09 终态不进范围（对应 OI-01）
- recommendation/plain_language: 推荐；只把还能做的六件事装进一个任务，判死的（4.5）和不能产的（4.8 收益数字）不碰
- decision: 范围＝{4.1, 4.2, 4.3, 4.4, 4.6, 4.7}（4.1 随后被用户整体砍掉，见 OI-05）；4.5 非目标、4.8 延期、DEF-01～DEF-09 只登记终态
- source_type/reference/exact_excerpt: 用户原话：「尽量一个任务做完，不要浪费那么多时间做那么多任务」＋「已经判死或不用再做的任务，就不要放在当前任务规划范围内了」
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: 入口清单 §1 L15-27 终态表、§4 L144-208；入口清单 §7 L290 读取规则；R-001/R-002/R-004/R-006
- Logic: 遗留 7+1 项中混有已判死项 -> 用户要求合并并排除判死项 -> 取 4.1/4.2/4.3/4.4/4.6/4.7 -> `## 范围` 与 `## 非目标` 可逐条核验
- choice_reason/impact: 用户直选；影响=整套材料与验收链的范围边界
- consequences_and_risks: 范围仍大且 4.1 后被砍，须及时回写；缓解=每项各有 OI acceptance 与 counterexample
- rejected_alternatives: 按入口清单 §2.3 过期状态给 4.7 定范围；把 4.5/4.8 当交付物
- unresolved_items/owner: 4.1 与 4.7 的最终范围在本阶段内收敛；owner=make-decision 主会话
- Supersedes: none
module: 范围与合并
requirement_ids: [R-001, R-002, R-004, R-006]
derived_from: []
artifacts: []

### D-002
- question/final_option: 六个候选是拆成多个任务还是装进一个任务？→ 装进一个任务（对应 OI-02）
- recommendation/plain_language: 推荐；一套材料、一次确认、一条验收链，不重复读同一批文件
- decision: 六个活跃候选合并为单任务，任务内部按依赖排成可独立验证的执行序
- source_type/reference/exact_excerpt: 用户 2026-09-19 talk-round-1 选择「装进一个任务（推荐）」；原话「尽量一个任务做完」
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: 用户原话两条；F-002 记录跨任务重复确认造成的 67.4 分钟空等、一条回复被要求确认 4 次
- Logic: 候选共享同一批文件与同一阻断轴 -> 拆任务会重复读同一批材料 -> 合并为单任务 -> 只有一套大纲与一条验收链
- choice_reason/impact: 用户直选；影响=任务形态与材料数量
- consequences_and_risks: 改动面大、首块可独立验证成果出现得晚；缓解=按依赖排序并逐项给 acceptance
- rejected_alternatives: 拆成两个/三个任务（talk-round-1 已否决，会重复确认并丢失事实链）
- unresolved_items/owner: 无
- Supersedes: none
module: 范围与合并
requirement_ids: [R-002, R-007]
derived_from: [D-001]
artifacts: []

### D-011
- question/final_option: `/Users/Hugh/Hugh/Project/3rd-review` 的写入边界？→ 可改工作树 + 跑测试 + 在该仓开分支 commit；commit/push 待 step 11 授权（对应 OI-22）
- recommendation/plain_language: 推荐；改动有归属、可追溯，但不可逆动作留到用户点确认之后
- decision: 3rd-review 工作树可改可测；提交必须落在该仓独立分支，且只在 step 11 显式授权后执行
- source_type/reference/exact_excerpt: 用户 2026-09-19 talk-round-1 选择「改 + 测试 + 在该仓开分支 commit」
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: 入口清单 §2.2 L117 已获授权改该仓；F-007 工作树 8 个未提交改动文件（+517/−88）；本文件「跨仓 commit 授权边界（不可逆）」条目
- Logic: 4.3/4.7 的实现落在 3rd-review -> 需要改工作树权限 -> 但 commit 不可逆 -> 授权延后到 step 11
- choice_reason/impact: 用户直选；影响=跨仓改动面与提交归属
- consequences_and_risks: 未提交改动与已提交改动混淆，或提前 commit；缓解=step 11 前禁止任何 commit/push
- rejected_alternatives: 只改工作树不提交；只读另开任务
- unresolved_items/owner: step 11 approve-decision 授权；owner=用户
- Supersedes: none
module: 范围与合并
requirement_ids: [R-007]
derived_from: []
artifacts: []

### D-012
- question/final_option: 本任务是否有页面/前端范围？→ 没有，non_ui（对应 OI-24）
- recommendation/plain_language: 推荐；原始需求全是机制/治理/审查管线条目，仓库里没有可运行的前端应用
- decision: `## UI applicability` 的 result 恒为 non_ui；本任务改动不落在任何前端文件
- source_type/reference/exact_excerpt: 三输入规则（`workflows/make-decision/SKILL.md:76-98`）实测：`package.json` 依赖仅 ajv/js-yaml、devDeps 仅 markdownlint-cli2/vitest，全仓唯一 `.html` 为 `tools/cli/build-reflection-page-template.html`
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: 三输入结果均为 non_ui；六个候选改动面在 `runtime/**`、`core/**`、`skills/wh-review/**`、`tools/cli/**` 与 3rd-review `lib/**`
- Logic: 无页面诉求 + 无前端框架/路由 -> 三输入一致 non_ui -> 不新增前端文件 -> 页面范围为零
- choice_reason/impact: 证据直判（requires_user_decision=false）；影响=范围与验收面
- consequences_and_risks: 后续若引入页面改动会与本节矛盾；缓解=counterexample 已把新增页面/路由/前端依赖判为失败
- rejected_alternatives: 把 result 改成 ui 而无三输入证据
- unresolved_items/owner: 无
- Supersedes: none
module: 范围与合并
requirement_ids: [R-006]
derived_from: []
artifacts: []

### D-014
- question/final_option: 本阶段只问方向还是可问到实现细节？→ 普通任务：保持既有提问与产物粒度，可追问能改变实现的细节（对应 OI-26）
- recommendation/plain_language: 推荐；本任务要裁定的是实现级判定（阈值/字段/错误码），只问方向定不下来
- decision: 按「普通任务」执行本阶段的提问与产物粒度
- source_type/reference/exact_excerpt: 用户 2026-09-19 原话「普通任务」（本文件 `## 任务身份` 的唯一类型声明）
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: `skills/decision-log/SKILL.md:19-31`；唯一声明行为 `- **任务类型**: 普通任务`
- Logic: 拆除/放宽对象落在实现层 -> 只问方向无法定案 -> 选普通任务粒度 -> 可以问到能改变实现的细节
- choice_reason/impact: 用户直选；影响=本阶段提问深度与产物粒度
- consequences_and_risks: 若材料出现第二条类型声明，回读为 unknown 会导致阶段失败；缓解=保持唯一声明
- rejected_alternatives: 规划任务（只问方向层，覆盖不了实现级裁定）
- unresolved_items/owner: 无
- Supersedes: none
module: 范围与合并
requirement_ids: []
derived_from: []
artifacts: []

### D-019
- question/final_option: 当 4.2 硬性排在 4.1 之后、4.3 又依赖 D-030③ 裁定时，本任务的「完成」边界如何定义，才算没有把需求推给下游？→ 完成边界＝材料四份口径齐全且用户已确认；实现细节不构成方向级未决（对应 OI-03）
- recommendation/plain_language: 推荐；把「做完」定义成四份材料口径齐全并已由用户确认，而不是把方向留给 build-spec
- decision: 本任务完成边界＝材料四份口径齐全且用户已确认；实现细节不构成方向级未决
- source_type/reference/exact_excerpt: 用户 2026-09-19 结构化答复「确认接受，签发」；用户原话「不要跳阶段，也不要依赖 build-spec 补需求」；本文件 `## 最终确认`
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: 入口清单 §4.1 L154、§4.2 L160、§4.3 L167；R-004、R-005；本文件 `## 最终确认`
- Logic: 4.2 硬排 4.1 之后且 4.3 依赖 D-030③ -> 下游不能替本阶段补需求 -> 完成边界须在本阶段定死 -> 材料四份口径齐全且用户确认即算完成
- choice_reason/impact: 用户直选；影响=本阶段收口判据与 build-spec 的输入边界
- consequences_and_risks: 若把方向级未决留给 build-spec，等于违反「不依赖 build-spec 补需求」；缓解=每条已定 OI 均有 D 条目
- rejected_alternatives: 以「留给 build-spec」代替方向级结论
- unresolved_items/owner: 无（用户已签发）
- Supersedes: none
module: 范围与合并
requirement_ids: [R-004, R-005]
derived_from: []
artifacts: []

### D-024
- question/final_option: 除 4.3/4.7 的跨仓部分外，§2 是否还要求任何 workflowhub 仓内的改动？→ 不要求；§2 剩余改动全在 3rd-review 侧（对应 OI-27）
- recommendation/plain_language: 推荐；本仓的 process_outcome / parse_outcome 链已由合并打通，不再新增仓内改动
- decision: §2 剩余改动全在 3rd-review 侧；WorkflowHub 侧的 process_outcome / parse_outcome 链已由合并打通，本任务不再新增仓内改动
- source_type/reference/exact_excerpt: 用户原话「主会话只进行子代理任务派发和交互类技能的执行」；F-009；F-014
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: 入口清单 §2.4 L129-131；F-009（合并后现场：`runtime/review/schemas/attempt.schema.json:218-219`、`runtime/review/review-record-route.mjs:788-789,802-803`、`skills/wh-review/scripts/review-result.mjs:207-213`、`review-provider-client.mjs:365-373` 已打通）
- Logic: §2 原列多处仓内改动 -> 合并已打通 process_outcome/parse_outcome 全链 -> 现场复核后剩余均属 3rd-review 侧 -> 本任务不再新增仓内改动
- choice_reason/impact: 事实直判 + 用户口径；影响=本任务仓内 diff 边界与主会话职责
- consequences_and_risks: 若仓内出现计划外机制改动，会超出本条边界；缓解=counterexample 已把计划外仓内改动判为失败
- rejected_alternatives: 在 WorkflowHub 侧再补一套 process_outcome/parse_outcome 改动
- unresolved_items/owner: 无
- Supersedes: none
module: 范围与合并
requirement_ids: [R-008]
derived_from: [D-019]
artifacts: []

### 严格判定拆除与放宽

### D-013
- question/final_option: F4/F5/F7/F11 交下游还是本阶段定案？→ F5/F7/F11 已澄清，F4 定案：统一成 `PROCESS_TIMEOUT`，真实原因存 `cause_code`（对应 OI-25）
- recommendation/plain_language: 推荐；对外只留一个码，真正的原因照样留着，下游重发门不用改
- decision: 对外只保留 `PROCESS_TIMEOUT`；print timeout 真实原因以 `cause_code` 原样保留；`3rd-review/lib/adapters/antigravity.mjs:7-8` 不再单独产出 `PROVIDER_PRINT_TIMEOUT` 作为对外码；`lib/provider-failure.mjs:67` 的映射保持 `PROCESS_TIMEOUT` 并把 print-timeout 事实写入 `cause_code`
- source_type/reference/exact_excerpt: 用户 2026-09-19 talk-round-3 选择「统一成 PROCESS_TIMEOUT，把真实原因存为 cause_code」
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: F-012：`PROVIDER_PRINT_TIMEOUT` 未注册（唯一注册表 `skills/wh-review/scripts/review-result.mjs:144-170`）、`cause_code` 已有先例（`simple-review-runner.mjs:1082-1083,1507`）；F-003 复算 provider attempt 事实
- Logic: adapter 产出一个未注册码而 provider-failure 映射成 `PROCESS_TIMEOUT` -> 同一事实两个对外名 -> 统一对外码并把真实原因放进 `cause_code` -> 下游门不用改且原始事实不丢
- choice_reason/impact: 用户直选；影响=3rd-review `lib/adapters/antigravity.mjs`、`lib/provider-failure.mjs` 与错误码消费面
- consequences_and_risks: 若有下游按 `PROVIDER_PRINT_TIMEOUT` 分支会失效（当前无此消费者）；缓解=真实原因仍在 `cause_code`
- rejected_alternatives: 保留两个对外码（同一事实两个名字）；收紧错误码注册表把未注册码判失败（违 G-005）
- unresolved_items/owner: 无（F5/F7/F11 已澄清；F11 属仓外文件表述、按契约不入材料）
- Supersedes: none
module: 严格判定拆除与放宽
requirement_ids: [R-011]
derived_from: []
artifacts: []

### D-015
- question/final_option: 哪些严格判定真造成过阻塞，本任务拆/松到什么范围？→ 5 项 REMOVE + 6 项 RELAX 全做（处置表第 9 行＝第 4 项放宽已由合并修复）（对应 OI-28）
- recommendation/plain_language: 推荐；只拆有真实事故记录的，零触发的红线不动
- decision: 做 5 项 REMOVE + 6 项 RELAX；③⑥⑦ 三条零触发红线保留；不新增任何严格判定；合并新增的 11 处只拆「provider 集精确匹配」1 处（有旁证），其余登记观察；两份 `review-input-bounds.mjs` 对齐宽松侧并删除 skill 侧新增的 fail-closed 抛出；跨仓「两边材料 ID 严格相等」纳入拆除/放宽范围；错误码注册表保持开放（未知码透传标 unknown）；材料未知键与未锚定 finding 均「丢弃 + 记显式事实」
- source_type/reference/exact_excerpt: 用户逐字口径「我不允许任何严格的的判断出现！无论是workflowhub或3rd-review…避免总是因为各种东西出现阻塞和失败，这是时间浪费的大头！」；talk-round-2 第二批「只拆有旁证的那几处，其余登记观察（推荐）」「对齐到宽松侧，删掉 skill 那份新增的 fail-closed 抛出（推荐）」
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: F-001 实测触发计数（`MATERIAL_INCOMPLETE` 153、`PROTOCOL_INCOMPATIBLE` 80、`PROVIDER_OUTPUT_INVALID` 75、`PUBLIC_RESULT_INVALID` 52、`OUTPUT_INVALID` 42、`MATERIAL_FORBIDDEN` 38 等，且只有 `attempt.json` 是真实触发记录）；F-010 合并新增/收紧 11 处、放宽 6 处；F-013 处置表第 9 行已由 `d8c74fdc` 修复
- Logic: 用户要拆掉造成阻塞的严格判定 -> 只有 `attempt.json` 计数可作事故证据 -> 按证据拆 5 项、松 6 项 -> 阻塞面下降且零触发红线不被臆测改动
- choice_reason/impact: 用户直选；影响=`runtime/stage`、`runtime/review`、`skills/wh-review`、3rd-review `lib` 多文件
- consequences_and_risks: 放宽可能让真缺陷漏过；缓解=丢弃类改动必须记显式事实，身份类检查只统一算法不放宽（D-017）
- rejected_alternatives: 新增任何严格判定；拆除零事故证据的三条红线（③ quorum、⑥ 信封必需键、⑦ finding 证据字段）；收紧错误码注册表；缩短或删除 20 分钟墙钟等待；把 `secret|data` 加严保留；把两份 `review-input-bounds.mjs` 同步到严格侧
- unresolved_items/owner: 每条处置的落地点与测试由 build-spec/build-code 定；owner=build-code
- Supersedes: none
module: 严格判定拆除与放宽
requirement_ids: []
derived_from: []
artifacts: []

### D-016
- question/final_option: 拆松如何证明生效且不新增验收机制？→ 只用既有针对性测试，不做前后计数（对应 OI-29）
- recommendation/plain_language: 推荐；别再给运维加一套要维护的验收账
- decision: 验收只由既有针对性测试证明；不新增账本、计数脚本或采集面
- source_type/reference/exact_excerpt: 用户原话「尽量简单！不要加任何强硬的验收，我被workflowhub一大堆的验收和收集搞怕了，现在整个workflowhub复杂到恐怖，完全无法维护」；talk-round-2 第二批选择「只用既有针对性测试，不做前后计数」
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: F-002 成本事实（67.4 分钟空等、164 个文件写入、一条回复确认 4 次）；AGENTS.md 测试硬规则「只跑受影响针对性测试」
- Logic: 用户拒绝新增验收/采集面 -> 仍需可证伪的通过证据 -> 用既有针对性测试 -> 生效可证且维护面不增加
- choice_reason/impact: 用户直选；影响=验收口径与测试范围
- consequences_and_risks: 既有测试覆盖不到的处置可能缺证据；缓解=缺证据如实记 unknown，不伪造通过
- rejected_alternatives: 做前后计数并新增采集面；只用文字断言生效（不可证伪）
- unresolved_items/owner: 逐项对应用哪条既有测试由 build-spec/build-code 映射；owner=build-code
- Supersedes: none
module: 严格判定拆除与放宽
requirement_ids: []
derived_from: [D-015]
artifacts: []

### D-022
- question/final_option: 每个候选的针对性验证面是什么，用哪条既有测试/命令证明通过、什么算失败？→ 只用既有针对性测试，不新建账本、计数脚本或采集面（对应 OI-20）
- recommendation/plain_language: 推荐；每个候选指名一条已有测试，别为验收再造新账本
- decision: 验收只由既有针对性测试证明，不新建账本、计数脚本或采集面
- source_type/reference/exact_excerpt: 用户 2026-09-19 选择「只用既有针对性测试，不做前后计数」；F-001
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: F-001（严格判定实测触发计数）；AGENTS.md 测试硬规则「只跑受影响针对性测试」；R-005
- Logic: 拆松需要可证伪的通过证据 -> 用户拒绝新增验收机制 -> 逐项指名既有针对性测试 -> 生效可证且维护面不增加
- choice_reason/impact: 用户直选；影响=验收口径与测试范围
- consequences_and_risks: 既有测试覆盖不到的处置可能缺证据；缓解=缺证据如实记录，不伪造通过
- rejected_alternatives: 新建验收账本或采集面；做前后计数
- unresolved_items/owner: 逐项对应用哪条既有测试由 build-spec/build-code 映射；owner=build-code
- Supersedes: none
module: 严格判定拆除与放宽
requirement_ids: [R-005]
derived_from: [D-015]
artifacts: []

### D-023
- question/final_option: F6/F8/F9 的不可证伪验收是否替换为有确定性命令/退出码的判据？→ 不替换、也不新增强硬验收；不可证伪的表述只作方向性目标登记（对应 OI-21）
- recommendation/plain_language: 推荐；别为这三条再造判据集，简单为先
- decision: 不替换为新的确定性判据集，也不新增强硬验收；不可证伪的表述不作为验收，只作为方向性目标登记
- source_type/reference/exact_excerpt: 用户 2026-09-19 原话「尽量简单！不要加任何强硬的验收」；入口清单 §4.9 F6 L219/L231、F8 L221/L233、F9 L222/L234
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: 入口清单 §4.9 F6/F8/F9；R-005；D-016 已定不新增验收机制
- Logic: F6/F8/F9 原表述不可证伪 -> 用户拒绝加严与新增验收 -> 不替换判据集、只登记方向性目标 -> 材料不出现新建验收清单
- choice_reason/impact: 用户直选；影响=验收面与材料篇幅
- consequences_and_risks: 不可证伪目标无法作为通过判据；缓解=只登记为目标，不计入验收
- rejected_alternatives: 为 F6/F8/F9 新建确定性判据集或账本
- unresolved_items/owner: 无
- Supersedes: none
module: 严格判定拆除与放宽
requirement_ids: [R-005]
derived_from: [D-015]
artifacts: []

### 跨仓材料身份

### D-017
- question/final_option: 跨仓 `material_id` 规范化不一致导致审查完全阻断：修哪一侧、按什么规则对齐？→ 对齐到 3rd-review 公开 v3 算法并冻结；不得取消比较（对应 OI-30）
- recommendation/plain_language: 推荐；让两边算同一个哈希，而不是干脆不比
- decision: 改 WorkflowHub 侧 `runtime/review/review-packet-identity.mjs:121-157` 与 `3rd-review/lib/attachments.mjs:18-26` 一致（排除 `canonical-evidence.json`、`authenticated-evidence.json`、`review-instructions.md`）并冻结算法；范围＝3 个哈希实现 + 4 个相等点
- source_type/reference/exact_excerpt: grill G-001 用户所选（逐字）「对齐到 3rd-review 公开 v3 算法并冻结（推荐）」；step 6 当场复现错误逐字 `{"code":"PROTOCOL_INCOMPATIBLE","message":"PROTOCOL_INCOMPATIBLE: 3rd-review managed lifecycle envelope is invalid"}`
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: F-011/F-012：WorkflowHub 侧期望 `49706015bc2cf3888ebdd3656d6bde73af90719f81551095dfc8c65bb93edc56`、3rd-review 侧发布 `6628e10504100be3a76e914a2bc0cda096cc86e64032738a913050cde5089f97`；`skills/wh-review/scripts/review-provider-client.mjs:687` 要求严格相等，不等即于 `:691` 抛 `PROTOCOL_INCOMPATIBLE`；该轴历史触发 80 次；`CONSTITUTION.md:28`
- Logic: 两边各算一套哈希且客户端要求严格相等 -> 每次 dispatch 都在起始信封处被拒 -> 对齐到公开 v3 算法并冻结 -> 同一材料得到同一 ID，审查可派发
- choice_reason/impact: 用户直选；影响=`review-packet-identity.mjs`、`review-materials.mjs`、4 个相等点、跨仓 3rd-review
- consequences_and_risks: v3 算法目前只在 3rd-review 未提交工作树里，无稳定提交点可钉；冻结后若要改需再裁定
- rejected_alternatives: 取消 `material_id` 比较（违 `CONSTITUTION.md:28`，用户明确否决）；让任一侧改成第三套规则（counterexample 判失败）；让 3rd-review 反向消费 WorkflowHub 的摘要
- unresolved_items/owner: `material_id` 算法的书面权威定义（OPEN-014，grill 记 unresolved）；owner=build-spec/build-code 落地时冻结为契约
- Supersedes: none
module: 跨仓材料身份
requirement_ids: []
derived_from: []
artifacts: []

### 候选收口（4.2/4.3/4.4/4.6/4.7）

### D-004
- question/final_option: 4.2 `workflowhub-material-binding-digest` 收不收、做到什么边界？→ 收；做 behavior/governance digest 拆分，方向是减少 churn，历史兼容最后做（对应 OI-06）
- recommendation/plain_language: 推荐；让格式类改动不再让测试/审查失效，同时保住老材料可读
- decision: 做 behavior / governance digest 拆分；历史兼容规则最后落地
- source_type/reference/exact_excerpt: 用户 2026-09-19 talk-round-2 第二批选择「三项都收，但 4.3/4.4 只做拆松没盖住的剩余（推荐）」；F-009
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: 入口清单 §4.2 L156-161；followup-tasks L128-150；step 1 实测 `behavior_digest`/`governance_digest` 零命中（NOT DOCUMENTED）
- Logic: digest 把行为与治理绑成一个值 -> 格式类改动即触发失效 -> 拆成 behavior/governance 两轴 -> churn 下降且历史兼容可控
- choice_reason/impact: 用户直选；影响=`runtime/task/material-workspace.mjs` 一带的材料绑定与测试
- consequences_and_risks: 两个 digest 的边界与历史材料兼容规则未细化；缓解=方向已定，细节交 build-spec
- rejected_alternatives: 不拆（格式类改动继续造成无谓失效）；只做历史兼容不做拆分（未解决 churn 根因）；新增 `material_digest` wire 字段（违 ADR-0017 与不新增 wire 协议边界）
- unresolved_items/owner: digest 确切定义/producer/唯一 consumer/历史兼容（OI-14 仍 open）；owner=build-spec
- Supersedes: none
module: 候选收口（4.2/4.3/4.4/4.6/4.7）
requirement_ids: [R-010]
derived_from: []
artifacts: []

### D-005
- question/final_option: 4.3 的边界？→ 披露 broker 既有成员级事实 + 接通 3rd-review 既有取消接口（对应 OI-07）
- recommendation/plain_language: 推荐；先让人看见哪个成员卡住，再真的把卡死成员停掉，能真正止损
- decision: 披露面只用 broker 既有字段；接通 `cancelManaged` 终止卡死成员；6 处「绝不调用」守卫改为「仅源漂移事实下调用」并补禁止因墙钟计时而调用的断言；20 分钟墙钟维持不动、只登记不一致
- source_type/reference/exact_excerpt: 用户 2026-09-19 talk-round-1 选择「披露 + 接通既有取消接口」；talk-round-3 选择「改断言：从「绝不调用」改为「只在源漂移事实下调用」+ 补墙钟禁止断言」
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: F-012 取消守卫实为 6 处（`tests/review/review-managed-lifecycle.test.mjs:378,433,478,507,540,584`）、墙钟守卫 `:526-558`；D-030③ 与 OI-10/OI-23 的「否决」经溯源为 agent 推断而非用户决定
- Logic: 成员卡死只披露不终止不能止损 -> 用户要接通既有取消接口 -> 既有守卫断言「绝不调用」 -> 同轮裁定改断言并加墙钟禁令 -> 披露与终止均不越墙钟边界
- choice_reason/impact: 用户两轮直选；影响=3rd-review broker 调用点 + 本仓测试与文档
- consequences_and_risks: 跨仓行为变更且与既有守卫冲突；若以墙钟停滞判定实现终止会变成新增加严（已由断言禁令挡住）
- rejected_alternatives: 只披露（不能止损）；再加本仓停滞终态（新增判定）；因墙钟超时而调用取消（已补禁令断言）；缩短或删除 20 分钟墙钟等待（G-004 裁定维持）
- unresolved_items/owner: 6 处守卫改写与墙钟禁令断言的落地点交 build-spec/build-code；owner=build-code
- Supersedes: none
module: 候选收口（4.2/4.3/4.4/4.6/4.7）
requirement_ids: [R-007, R-010]
derived_from: []
artifacts: []

### D-006
- question/final_option: 4.4 `workflowhub-review-output-tolerance` 做什么？→ 收，但只做「5 项拆除 + 6 项放宽」未覆盖的剩余（对应 OI-08）
- recommendation/plain_language: 推荐；合并已交付别名/JSONL/嵌套/单 fence 解析，剩下的是把宽容边界写成规格并处置静默丢弃
- decision: 只补齐剩余：把宽容边界与 7 条红线的关系写成规格，并处置「未知 severity 静默丢弃」这一未登记的行为变化
- source_type/reference/exact_excerpt: 用户 2026-09-19 talk-round-2 第二批选择「三项都收，但 4.3/4.4 只做拆松没盖住的剩余（推荐）」；F-006 引用户 grill-G2 原话「确认这个边界：宽容格式，7 条红线不动」
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: F-009：`runtime/review/review-output.mjs` 已整体重写（severity 别名映射、`findNestedFindings`、JSONL 解析、单 fence 解析），`:27` 新增 scheme 前缀守卫；未知 severity 现 `return null` 静默丢弃；F-006 七条红线中 ③⑥⑦ 零触发
- Logic: 合并已交付大部分宽容抽取 -> 重复做会白干 -> 只补剩余 -> 宽容边界成文且静默丢弃有处置，7 条红线仍不动
- choice_reason/impact: 用户直选；影响=`runtime/review/review-output.mjs` 的解析契约与规格文字
- consequences_and_risks: 「未知 severity 静默丢弃」若不落规格，会成为无记录的行为漂移；缓解=本项即该剩余
- rejected_alternatives: 重做全部 4.4 抽取（重复施工）；动 7 条红线（用户已确认不动）
- unresolved_items/owner: 未知 severity 的处置形状与多候选确定性规则（OI-15 仍 open）；owner=build-spec
- Supersedes: none
module: 候选收口（4.2/4.3/4.4/4.6/4.7）
requirement_ids: [R-010]
derived_from: []
artifacts: []

### D-007
- question/final_option: 4.6 四条结构缺陷收哪几条？→ 以现场为准，只补真缺口（唯一真缺口＝缺陷3）（对应 OI-09）
- recommendation/plain_language: 推荐；缺陷1/2/4 已被合并修好，照缺陷报告原文全做就是重复劳动
- decision: 只做缺陷3 的窄判别；缺陷1/2/4 记为已修并附证据
- source_type/reference/exact_excerpt: 用户 2026-09-19 裁定「以现场为准，只补真缺口（推荐）」；F-008/F-009 现场复核
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: F-009：缺陷1 已修（`runtime/stage/stage-runner.mjs:1144-1147`）、缺陷4 已修（`stage-content-contracts.mjs:451` 接受 `fixed`）、缺陷2 已改为内容绑定+互引（`stage-handlers.mjs:2104-2113`）；缺陷3 跳过只进 `facts` 不进 `errors`
- Logic: 缺陷报告行号已全部漂移且部分已修 -> 照原文全做会重复施工 -> 以现场复核为准 -> 只补缺陷3、其余留证据
- choice_reason/impact: 用户直选；影响=`runtime/stage/stage-content-contracts.mjs` 的 spec_analyze 分支
- consequences_and_risks: 缺陷2 的严格检查仍在（内容绑定版）；若后续判定其为残留阻断需另立裁定
- rejected_alternatives: 照缺陷报告原文四条全做（重复劳动且行号漂移）；信任缺陷报告而不做现场复核
- unresolved_items/owner: 缺陷3 的具体判别法由 D-010 收窄；owner=build-spec/build-code
- Supersedes: none
module: 候选收口（4.2/4.3/4.4/4.6/4.7）
requirement_ids: [R-010]
derived_from: []
artifacts: []

### D-008
- question/final_option: 4.7 的真实剩余范围？→ 全收现场复核出的 8 项，不照入口清单 §2.3 的过期状态（对应 OI-10）
- recommendation/plain_language: 推荐；先看工作树实际剩什么再定范围，避免重复做完已完成的修法
- decision: 4.7 范围＝现场 diff 复核出的 8 项剩余；不按入口清单 §2.3 表全量重做
- source_type/reference/exact_excerpt: 用户 2026-09-19 talk-round-2 答复「全收 8 项」；talk-round-1 选择「先复核 diff，复核结论出来再定范围」
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: F-007：3rd-review HEAD `a96f28b` 工作树 8 个未提交改动文件（+517/−88）；已做 `--print-timeout=20m`、`parse(stdout,stderr)`→`PROVIDER_PRINT_TIMEOUT`、print-timeout 正则、`same_session_repair`、预写 attempt；部分 `review_mode` 重发门、私有路径整组扫描、逐层 `Promise.all`；未做心跳过期判死、`PROCESS_STALLED` 接终态、取消接线、迟到结果；新增未提交加严 `privatePathPattern` 加 `secret|data`
- Logic: 入口清单 §2.3 状态被工作树现状推翻 -> 照旧表会重复或漏项 -> 按现场 diff 重推 -> 范围=8 项剩余
- choice_reason/impact: 用户直选；影响=跨仓 4.7 施工清单
- consequences_and_risks: 8 项未提交改动无稳定提交点；若上游弃用工作树，范围需重推
- rejected_alternatives: 照 §2.3 表全量重做（重复已完成修法并可能冲突）；只按已提交内容定范围（会漏掉未提交的 8 项）
- unresolved_items/owner: 8 项的逐项修法与验收由 build-spec/build-code 落地；owner=build-code
- Supersedes: none
module: 候选收口（4.2/4.3/4.4/4.6/4.7）
requirement_ids: [R-007, R-010]
derived_from: []
artifacts: []

### D-010
- question/final_option: 4.6 缺陷3「分析器静默跳过」的修法边界？→ 窄判别修复：跳过须进 `errors`，或把无标题正文判为 `MATERIAL_INCOMPLETE`（对应 OI-17）
- recommendation/plain_language: 推荐；只把「悄悄跳过」改成「看得见的跳过」，不加新机制
- decision: 只修缺陷3 的窄判别；不改 `hasMarkdownHeadings` 以外的判别面，不新增检查
- source_type/reference/exact_excerpt: F-009：跳过只进 `facts.spec_analyze` 不进 `errors`——`runtime/stage/stage-content-contracts.mjs:5962`（`let specAnalyzeSkip = null`）、`:5989-5994`、`:6009-6012`、`:6036`；状态仍由 `:6018-6020` 算作 `inconsistent`；`hasMarkdownHeadings`（`:3511`）仍是唯一判别
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: F-009 现场行号；D-007 已定只补缺陷3
- Logic: 跳过被披露但只进 facts -> inconsistent 状态与 errors 账目不对称 -> 窄修（跳过同时进 errors，或无标题正文判 `MATERIAL_INCOMPLETE`）-> 状态与账目一致
- choice_reason/impact: 用户口径「只补真缺口」；影响=`runtime/stage/stage-content-contracts.mjs` 的 make-decision/build-spec 分支
- consequences_and_risks: 新写错误码可能成为新的阻断面；缓解=沿用既有码并保持既有针对性测试口径
- rejected_alternatives: 新增独立判别或新检查（违「不新增加严」）；不修（跳过继续只进 facts）
- unresolved_items/owner: 用哪个既有码、写到哪一层由 build-spec 定；owner=build-spec
- Supersedes: none
module: 候选收口（4.2/4.3/4.4/4.6/4.7）
requirement_ids: [R-010]
derived_from: [D-007]
artifacts: []

### D-020
- question/final_option: 4.2 的 behavior/governance digest 确切定义、producer、唯一 consumer 与历史兼容规则？→ 方向已定：behavior / governance 两轴拆分；细节由 build-spec 在已确认方向内细化（对应 OI-14）
- recommendation/plain_language: 推荐；先把两轴拆开定方向，字段名与历史兼容规则交给 build-spec 在方向内落地
- decision: 方向已定：behavior / governance 两轴拆分；具体字段名、producer 与历史兼容规则属实现细节，在已确认方向内由 build-spec 细化
- source_type/reference/exact_excerpt: 用户 2026-09-19 talk-round-2 第二批选择「三项都收，但 4.3/4.4 只做拆松没盖住的剩余（推荐）」；用户 2026-09-19「三项都收」；F-009
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: 入口清单 §4.2 L156-161；followup-tasks L128-150；F-009（step 1 实测 `behavior_digest`/`governance_digest` 零命中）
- Logic: digest 把行为与治理绑成一个值 -> 格式类改动即触发失效 -> 拆成 behavior/governance 两轴 -> churn 下降且细节留在同一方向内
- choice_reason/impact: 用户直选；影响=`runtime/task/material-workspace.mjs` 一带的材料绑定与测试
- consequences_and_risks: 字段名与历史兼容未细化；缓解=方向已定，spec 成文即可核验
- rejected_alternatives: 不拆（格式类改动继续造成无谓失效）；新增 `material_digest` wire 字段（违 ADR-0017 与不新增 wire 协议边界）
- unresolved_items/owner: 字段名/producer/历史兼容由 build-spec 落地；owner=build-spec
- Supersedes: none
module: 候选收口（4.2/4.3/4.4/4.6/4.7）
requirement_ids: [R-010]
derived_from: [D-004]
artifacts: []

### D-021
- question/final_option: 4.4 对歧义抽取、多候选 findings、JSONL 混合有效/无效记录的确定性规则？→ 方向已定：确定性规则在已确认的宽容边界内成文；合并已交付别名 / JSONL / 嵌套 / 单 fence 解析（对应 OI-15）
- recommendation/plain_language: 推荐；规则写成规格条目，但不动 7 条红线
- decision: 方向已定：歧义抽取与多候选的确定性规则由 build-spec 在已确认的宽容边界内成文；合并已交付别名 / JSONL / 嵌套 / 单 fence 解析
- source_type/reference/exact_excerpt: 用户 2026-09-19 talk-round-2 第二批选择「三项都收，但 4.3/4.4 只做拆松没盖住的剩余（推荐）」；用户 grill-G2 原话「确认这个边界：宽容格式，7 条红线不动」；F-009
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: F-009（`runtime/review/review-output.mjs` 已重写：severity 别名映射、`findNestedFindings`、JSONL 解析、单 fence 解析）；F-006 红线 ③⑥⑦ 零触发
- Logic: 宽容抽取已大部交付 -> 缺的是确定性规则成文 -> 在既有宽容边界内成文 -> 歧义与多候选可复核且红线不动
- choice_reason/impact: 用户直选；影响=`runtime/review/review-output.mjs` 的解析契约与规格文字
- consequences_and_risks: 若以「略过不表」代替规则，歧义处置不可复核；缓解=规则写成规格条目并保留 7 条红线
- rejected_alternatives: 重做全部 4.4 抽取（重复施工）；动 7 条红线（用户已确认不动）
- unresolved_items/owner: 规则文字由 build-spec 成文；owner=build-spec
- Supersedes: none
module: 候选收口（4.2/4.3/4.4/4.6/4.7）
requirement_ids: [R-010]
derived_from: [D-006]
artifacts: []

### 非目标与延期

### D-003
- question/final_option: DEF-01～DEF-09 是否构成待办？→ 全部终态，不进范围（对应 OI-04）
- recommendation/plain_language: 推荐；已经收口的九项只登记一行，不重新开工
- decision: DEF-01～DEF-09 确认为终态；只在 `## 非目标` 登记，不为其建立施工 OI
- source_type/reference/exact_excerpt: 入口清单 §7 读取规则 L290「§1 的 DEF-* 已全部判终态，不得当作待办直接执行」；§1 L15-27 终态表（DEF-01～DEF-07 判取消、DEF-08 已登记、DEF-09 已闭合）
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: 用户原话「已经判死或不用再做的任务，就不要放在当前任务规划范围内了」；F-009 记 DEF-09 已由合并闭合（`quality-verify.v1` 字面量只剩反向守卫断言）
- Logic: 入口清单 §7 明令不得当待办 -> 用户又要求排除判死项 -> 全部只登记终态 -> 范围不被死项占用
- choice_reason/impact: 文件规则 + 用户口径；影响=范围与施工清单
- consequences_and_risks: 若后续出现 DEF-02/06/07 的触发条件，需另立裁定才能重开
- rejected_alternatives: 把 DEF-01～DEF-09 重新排成待办（违 §7 读取规则与用户口径）
- unresolved_items/owner: 无
- Supersedes: none
module: 非目标与延期
requirement_ids: [R-003, R-009]
derived_from: []
artifacts: []

### D-009
- question/final_option: 4.5 `workflowhub-stage-giant-slicing` 是否进范围？→ 非目标，不进范围（对应 OI-11）
- recommendation/plain_language: 推荐；DEF-01 已判取消，提案同步作废，除非出现真实事故证据
- decision: 4.5 确认为非目标；解锁需满足 DEF-01 触发条件①真实维护事故 / ②consumer 证据 / ③新可观测判据，或用户显式推翻
- source_type/reference/exact_excerpt: 用户原话「已经判死或不用再做的任务，就不要放在当前任务规划范围内了」；入口清单 §4.5 L181「DEF-01 已判取消，故该提案同步作废或需重新论证」
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: DEF-01 L29-34 取消理由；R-010 要求 §4 逐条给出处置
- Logic: DEF-01 已取消 -> 原提案失去前置 -> 用户要求排除判死项 -> 4.5 只登记非目标
- choice_reason/impact: 文件前置裁定 + 用户口径；影响=diff 不得出现拆文件/搬家式改动
- consequences_and_risks: 巨人文件继续存在；若真出现维护事故，需按解锁条件另开任务
- rejected_alternatives: 以「拆文件/加统一层/改名」落地 ≤3000 行目标（counterexample 判失败）
- unresolved_items/owner: 无
- Supersedes: none
module: 非目标与延期
requirement_ids: [R-003, R-010]
derived_from: [D-001]
artifacts: []

### 文档与 ADR

### D-018
- question/final_option: 本方向的边界规则要不要立 ADR？→ 立；不承载身份/顺序/hash/必需产物绑定的检查一律降级为质量事实，身份类检查只统一算法不改宽松度（对应 OI-31）
- recommendation/plain_language: 推荐；未来读者会问「为什么把 fail-closed 检查拆了」，需要一份可引用的规则
- decision: 创建 ADR `docs/adr/0031-review-check-downgrade-and-identity-boundary.md`，决定行＝非身份类检查降级为质量事实、身份类检查不改宽松度只统一算法
- source_type/reference/exact_excerpt: 用户 2026-09-19 grill G-006 所选（逐字）「立，写为：不承载身份/顺序/hash/必需产物绑定的检查一律降级为质量事实；身份类检查不改宽松度、只统一算法（推荐）」
- approval_binding: accepted：用户 2026-09-19 结构化答复「确认接受，签发」；绑定当前 decision-log.md 内容范围；content-addressed ref/hash 由 step 11 interaction aggregate 单向绑定
- facts_and_constraints: F-012 grill 领域核实；ADR 0007/0010/0017/0025/0028 经核实兼容；三项判据（难以反转/无背景会意外/存在真实取舍）均为真
- Logic: 拆除 fail-closed 检查是难反转的安全边界改动 -> 需要可引用规则 -> 立 ADR -> 后续任务引用同一规则而不是重开争论
- choice_reason/impact: 用户直选；影响=`docs/adr/` 与后续同类处置
- consequences_and_risks: ADR 与 D-030③（不在任何 ADR 里）的表述不一致仍需登记（G-004）
- rejected_alternatives: 不立 ADR（三项判据均真，未来会重复争论）；写进 `CONTEXT.md`（属治理规则，非新术语）
- unresolved_items/owner: ADR 文件落笔由本阶段文档动作交付；owner=make-decision
- Supersedes: none
module: 文档与 ADR
requirement_ids: []
derived_from: [D-015, D-017]
artifacts: []

### 未形成决定的 OI

- OI-05（not_applicable）：4.1 主体已被用户整体砍掉，只登记非目标
- OI-12（deferred）：4.8 成本重测延后，本任务不产出收益数字
- OI-13（not_applicable）：随 OI-05 一并关闭，不新增终态对象
- OI-16（not_applicable）：4.6 缺陷1 已由合并修复，本任务不重做
- OI-18（not_applicable）：4.6 缺陷4 已由合并修复，本任务不重做
- OI-19（not_applicable）：用户不接受新增 schema，F10 持久 attempt 字段不实施
- OI-23（not_applicable）：F12 净行数账目属上一任务内部记账，本任务不含该改动

## 三轮 talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
|---|---|---|---|---|---|
| T-001 | 合并还是拆分（单任务 / 拆两个 / 拆三个） | 单任务＝一套材料一次确认，风险是改动面大、首块可验证成果晚 | 「装进一个任务（推荐）」 | round 1 答 4 题；4.7 范围题转为依赖 step 4 复核 | 用户 2026-09-19 结构化答复；本文件 `## 需求权威更新` |
| T-002 | 4.7 范围依据（以工作树现状为准 / 照 §2.3 表全量重做 / 先复核再定） | 照旧表重做＝重复已完成修法并可能冲突 | 「先复核 diff，复核结论出来再定范围」 | 新增依赖：4.7 范围推迟到 step 4 复核后 | 用户 2026-09-19 结构化答复；step 1 实测 8 个未提交改动文件 |
| T-003 | 4.3 边界（只披露 / 披露+取消接口 / 再加本仓停滞终态） | 接通取消接口＝与 OI-10/OI-23 及既有测试断言冲突 | 「披露 + 接通既有取消接口」 | 新增方向级矛盾，进入 talk-round-2 | 用户 2026-09-19 结构化答复 |
| T-004 | 跨仓写入边界（只工作树 / 开分支 commit / 只读另开任务） | 开分支 commit＝跨仓不可逆动作 | 「改 + 测试 + 在该仓开分支 commit」 | 授权延后到 step 11 才生效 | 用户 2026-09-19 结构化答复 |

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 OI |
|---|---|---|---|---|
| F-001 | 严格判定真实触发计数 | 扫描全部 49 个任务库的 `quality/reviews/attempts/*/attempt.json`（attempt 级 + member 级）实测：`MATERIAL_INCOMPLETE` 153、`PROTOCOL_INCOMPATIBLE` 80、`PROVIDER_OUTPUT_INVALID` 75、`PUBLIC_RESULT_INVALID` 52、`OUTPUT_INVALID` 42、`MATERIAL_FORBIDDEN` 38、`RATE_LIMITED` 28、`EVIDENCE_ANCHOR_INVALID` 20、`REVIEW_SOURCE_DRIFT` 10、`MATERIAL_TOO_LARGE` 7、`REQUEST_INVALID` 6、`REVIEW_WAIT_EXCEEDED` 3、`REVIEW_MATERIAL_MISMATCH` 2；`PROVIDER_OUTPUT_SCHEMA_INVALID` 与 `PROVIDER_PACKET_INCOMPLETE` 均 **0**。**方法纪律（必须保留）**：只有 `attempt.json` 是真实触发记录；`quality/evidence/interactions/*.json` 等聚合文件只是在引用错误码清单，把它们计入会系统性放大所有数字。 | covered | OI-28 |
| F-002 | 单次最贵事件 | 收口窗口 `11:29:22→12:36:48` = **67.4 分钟**（主会话纯空等 62.7 分钟／13 次 sleep）；一条完全相同的用户回复被要求**确认 4 次**（4 个不同 material_revision/snapshot_tree）；交互聚合 3 次、reflection 2 次、材料草稿 3 次；共写 164 个文件（占该 store 46%）。跨阶段：247 次 vNext 确认、build-plan 8 组 rebind、`workflowhub-simplicity-close-repair-20260829` 5 次确认/201.6 分钟。来源 `specs/archive/workflowhub-cost-baseline-and-blocker-close-20260917/decision-log.md:1429`。 | covered | OI-28、OI-29 |
| F-003 | 入口清单数字复算（§7.2 硬要求） | 「493 provider-分钟」实为**全部 72 次 provider attempt 的总耗时**（含成功），**真实浪费 146.7 分钟**，入口清单把浪费夸大约 3.4 倍；「33 attempts / 72 provider attempts / 24 failed」**精确可复核**；「12 次 antigravity 失败」次数精确，但其 stderr 原文（原始 `/tmp` 文件）已不存在，**字节不可复核**；「`PUBLIC_RESULT_INVALID` 8 次、kimi×5/codex×3」的**拆分不可复核**，实测 **kimi 6 / codex 2**，且所引耗时区间与实际不符；「重跑 8 次／37.9 分钟」**已被上一任务自身判定不可复核**（`decision-log.md:406,:1140,:1558`，RK-7 `:1786`），**不得复活**。 | covered | OI-28、OI-29 |
| F-004 | 4.1 的 D-006② 溯源（引用陷阱） | 4.1 文档所指 `D-006②` **不是** `workflowhub-cost-baseline-and-blocker-close-20260917` 的 D-006（那条讲证据重采级联）；真身见 `specs/archive/workflowhub-research-handoff-hardening-20260909/decision-log.md:331`：「② `integration_review`：谓词**不动**（只认 `recorded`），`unavailable` 是宪法允许的完成路径但**不满足该谓词**」。其 `rejected_alternatives` ① 明确否决「让 `unavailable` 满足谓词」。性质＝**内部记账**，非产品行为；采纳该支路成本 0 个文件。 | covered | OI-05、OI-13 |
| F-005 | 4.1 已被用户否决（两次） | `specs/workflowhub-mechanism-simplification-20260910/decision-log.md:1745`：「新增终态状态机 `completed_with_quality_unavailable` … 用户 Q13/R6 明确选择「**用字段承接，不要用状态机承接**」」；`:125` R6 逐字：「**用户否掉的是 followup 方案整体**…真实缺口不在「新终态状态」这个对象上，而在「质量缺失这件事的表示」上」；`:1744`：「`workflowhub-followup-tasks-20260910.md` 整体方案 \| 用户（R-001）\|「就算实施了，未来也一样会出现很多阻塞和问题」——它继承「加法」倾向」。`prd.md:164` E-3 已把该状态机改由 K2 行字段 `review_origin` 承接。4.1 的**主要输入文件正是被否掉的那份 followup 方案**。 | covered | OI-05、OI-13 |
| F-006 | 「7 条红线」真实且已枚举 | 见 `specs/archive/workflowhub-cost-baseline-and-blocker-close-20260917/decision-log.md:137-144`，来源为用户 grill-G2 原话「确认这个边界：宽容格式，7 条红线不动」。七条均为**审查标准 fail-closed 规则**，无一条是终态状态。其中 ③ quorum、⑥ 信封必需键、⑦ finding 证据字段**零次触发**（无事故证据）。 | covered | OI-08、OI-28 |
| F-007 | 4.7 现场 diff 复核 | `3rd-review` HEAD `a96f28b` 工作树 8 个未提交改动文件（+517/−88），**未提交**。**已做**：`--print-timeout=20m`、`parse(stdout,stderr)`→`PROVIDER_PRINT_TIMEOUT`、print-timeout 正则、`same_session_repair`、预写 attempt 记录。**部分**：`review_mode` 重发门（仅 `PROCESS_TIMEOUT` 开）、整组私有路径扫描仍在、达标即产出仍是逐层 `Promise.all`。**未做**：心跳过期判死、`PROCESS_STALLED` 接终态、取消接线、迟到结果。**新增未提交加严**：`lib/workflowhub-result-v3.mjs:32` `privatePathPattern` 加了 `secret\|data`（零触发、未执行、误杀风险高）。 | covered | OI-10、OI-28 |
| F-008 | 4.6 合并后状态 | 缺陷报告 `/Users/Hugh/Downloads/workflowhub-defects-from-paperbuilder-m1.md` 的四条：缺陷1（stage 行过期）修法**已落地**（`runtime/stage/stage-runner.mjs:1144-1145` 改用 per-stage scope helper）；缺陷4（`direction_change` 终态）**已修**（`runtime/stage/stage-content-contracts.mjs:450-452` 接受 `fixed\|user_decided\|accepted_risk`，`stage-handlers.mjs:2407-2410` 加 material-revision 守卫）；缺陷3（静默跳过）**部分已修**（`:5978-6002` 现写 `specAnalyzeSkip`，经 `:6036` 以 `facts.spec_analyze` 暴露，但 `hasMarkdownHeadings`（`:3511`）仍是唯一判别）；缺陷2（路径身份）严格检查**未删除**，现位于 `stage-handlers.mjs:2107`，比较互相引用的 `result_ref`。报告原文引用的行号**已全部漂移**。 | covered | OI-09、OI-16、OI-17、OI-18 |
| F-009 | 合并后重评 | 见「需求权威更新（…合并后复核裁定）」第 2 条：DEF-09 已闭合；4.6 缺陷1/2/4 已修、缺陷3 部分；4.3/4.4 已有相当部分被合并交付；§5 数字再次漂移；DEF-04 零漂移前提已破（两份 bounds 分叉 63 行，skill 侧多一个 fail-closed 抛出）。 | covered | OI-06、OI-08、OI-09、OI-16、OI-17、OI-18、OI-28 |
| F-010 | 合并新增严格判定扫描 | 见上第 3 条：合并新增/收紧 11 处判定，同时放宽 6 处；其中「health 要求 provider 集精确匹配」与已触发 80 次的 `PROTOCOL_INCOMPATIBLE` 同轴，属可拆；其余登记观察。 | covered | OI-28 |
| F-011 | 审查链路当场复现的完全阻断 | 见本文件「需求权威更新（2026-09-19 step 6 方向审查结果与新增阻塞裁定）」：方向审查 dispatch 返回 `PROTOCOL_INCOMPATIBLE`、`dispatch_state=blocked_before_dispatch`、`semantic_status=unavailable`、`result_ref=null`（红/蓝皆然）；根因是跨仓 material_id 规范化不一致 + 客户端严格相等；该轴历史触发 80 次。 | covered | OI-28、OI-30 |
| F-012 | grill 领域核实 | 见 `## grill`：既有术语与 ADR 逐条核实（`CONTEXT.md:98-99,282-283,285-286,380-381,383-384`；ADR 0007/0010/0017/0025/0028 兼容）；`material_id` 无书面权威、实为 3 哈希实现 + 4 相等点；`PROVIDER_PRINT_TIMEOUT` 未注册；`cause_code` 已有先例（`simple-review-runner.mjs:1082-1083,1507`）；`PHASE_DIFF_MAX_DELIVERY_BYTES` 确为死代码；取消守卫实为 6 处。 | covered | OI-28、OI-30 |
| F-013 | RELAX #9 引用核实 | 材料原引 `simple-review-runner.mjs:1315-1316` 的空 `catch{}` 在 HEAD **不存在**；该 catch 真实存在于 `16077887`，已由 `d8c74fdc`（经 `e74d9a72`）删除并改为 `catch (error)` + `parse_error`；`runtime/review/review-output.mjs:9-12,14-19` 新增 `safeParseError`/`parse_error`；测试锁定 `simple-review-runner.test.mjs:1666`。结论：该项**已由合并修复，本任务不做**。另发现残留观察项见 `### 观测项`。 | covered | OI-28 |
| F-014 | step 10 细节审查结果 | 见「需求权威更新（2026-09-19 step 10 细节审查结果）」：detail 轨合法材料键与 direction 轨不同；预检 `unknown=[] missing=[]`；dispatch `blocked_before_dispatch`、`semantic_status=unavailable`、`result_ref` 双 null；根因与 step 6 同一 `material_id` 严格相等，`request_id`/`runtime_id` 匹配故无第二缺陷。 | covered | OI-28、OI-30 |

### 严格判定处置清单（5 项拆除 + 6 项放宽需做；处置表第 9 行（第 4 项放宽）已由合并修复）

| # | 动作 | 判定 | 位置 | 事故证据 | 代价 |
|---|---|---|---|---|---|
| 1 | 整组私有路径扫描 → 改为仅成员级，组记为 partial | REMOVE | `3rd-review/lib/workflowhub-result-v3.mjs:200` | 摧毁 `dcafe3e3` 整组（两个成员双双 `PUBLIC_RESULT_INVALID`） | 33.5 分钟/次；该仓自己的测试 `test/managed-session-lifecycle.test.mjs:146-155` 已断言成员隔离，代码与自身测试意图矛盾 |
| 2 | 新增 `secret\|data` token | REMOVE | `3rd-review/lib/workflowhub-result-v3.mjs:32` | 未提交、零触发、`/data` `/secret` 是普通正文词，误杀风险高 | 0 |
| 3 | 死代码 `PHASE_DIFF_MAX_DELIVERY_BYTES` | REMOVE | `skills/wh-review/scripts/review-materials.mjs:57` | 全仓零 consumer | 0（但其 330 KiB 文案被真实失败引用） |
| 4 | `review_mode` 重发门 | REMOVE | `3rd-review/lib/broker.mjs:1243,1282,1387`、`lib/recovery-policy.mjs:14` | 所有阶段都是 `single_round`/`full_only` ⇒ 除 `PROCESS_TIMEOUT` 外恢复被全关；12 次 antigravity 失败从未重发 | 146.7 provider-分钟 |
| 5 | `EVIDENCE_ANCHOR_INVALID` 全轮升级 | REMOVE | `skills/wh-review/scripts/simple-review-runner.mjs:1475` | 3 次 attempt／5 次成员触发；上一任务材料 `decision-log.md:1128` 自述为「路径口径自相矛盾导致的**误判**」 | 55.0 provider-分钟 |
| 6 | 私有路径只扫结构化字段、不扫成员正文 | RELAX | `3rd-review/lib/workflowhub-result-v3.mjs:37,47,179`；`broker.mjs:104-113` | | |
| 7 | 身份降级时保留原始 provider 错误码 + `cause_code`，不覆写成 `PUBLIC_RESULT_INVALID` | RELAX | `3rd-review/lib/broker.mjs:454-475` | | 47.3 provider-分钟 |
| 8 | `MATERIAL_INCOMPLETE`(153) / `MATERIAL_FORBIDDEN`(38)：键名近似误用改为「警告 + 丢弃未知键」，不再派发前中止 | RELAX | `skills/wh-review/scripts/review-materials.mjs:372,2001,2007` | | |
| 9 | 不做（已验证由合并修复） | 已由合并修复：空 catch 已被 catch (error) + parse_error 取代 | `skills/wh-review/scripts/simple-review-runner.mjs`（pre-merge 版 `:1315-1316`；HEAD 已无该 catch）；`runtime/review/review-output.mjs:9-12,14-19` | pre-merge 上真实存在；合并提交 d8c74fdc（经 e74d9a72）修复；测试锁定 skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs:1666 | 0（无需再做） |
| 10 | `PROTOCOL_INCOMPATIBLE`(80)：区分「多了未知 provider」与「少了已配置 provider」 | RELAX | `3rd-review/lib/broker.mjs` request/health 路径 | | |
| 11 | 材料 revision / snapshot 确认绑定：复用 `isExecutionRecordOnlyMaterialDelta` / `isStageMaterialOnlySnapshotDelta` 的读侧对称 | RELAX | `runtime/stage/stage-runner.mjs:1681`；`git-worktree-snapshot.mjs:503-526` | | 67.4 分钟级联 + 一条回复确认 4 次 |
| 12 | `REVIEW_WAIT_EXCEEDED` 20 分钟墙钟等待 | RELAX | `skills/wh-review/scripts/simple-review-runner.mjs:40,521` | | 3 次触发，每次 ≤20 分钟 |

### 保留不拆（无事故证据，拆之属臆测）

- 红线 ③ `minimum_heterologous`/quorum：零触发（`skills/wh-review/scripts/simple-review-runner.mjs:184-201` 等）
- 红线 ⑥ 信封/组/成员必需键：零触发（`3rd-review/lib/workflowhub-result-v3.mjs:170,176,182`）
- 红线 ⑦ 非 minor finding 必须有 `evidence_kind`/`evidence`/`root_cause`：零可归因触发（`runtime/review/review-output.mjs:18-21,29-34`）
- `MAX_REVIEWER_OUTPUT_BYTES`（128 KiB）：无孤立触发记录，归因未知
- `PROVIDER_OUTPUT_SCHEMA_INVALID` / `PROVIDER_PACKET_INCOMPLETE`：零触发，但无法判断是「无人用」还是「不可达」

### 观测项（非本任务目标）

- `3rd-review` 未提交的 `broker.mjs` 非终态 `exactKeys` 从未执行；上一任务 `:1788` RK-9 警告「新增 BR 字段可让旧 WH 触发 `PUBLIC_RESULT_INVALID`」——属未验证风险，本任务只登记。
- `runtime/review/review-record-route.mjs:647-657` 的 `recordError` 仍把 `parse_error` 从**类型化 attempt 记录**中丢弃（`runtime/review/schemas/attempt.schema.json` 要求 `{code,message}` 且 `additionalProperties:false`）。真实原因仍保留在报告 markdown（`reviewReportBody` `:583`，调用点 `:912`/`:1504`）。该位置**与合并前逐字节相同**，属 schema 边界的设计选择，**无事故证据**，本任务不改。
- 官方 `confirm` 入口在未传 `--attempt` 时产出 `subject_ref=null` 的不可绑定确认（`runtime/task/task-kernel-implementation.mjs:113`/`:707` 要求其等于 decision ref）；正确用法需显式传 `--attempt=<decision-log ref>`。本次实测发现，无既有测试覆盖该缺陷路径。

## grill

| grill_id | axis | 用户所选（逐字） | 结论/后果/风险 | source/evidence |
|---|---|---|---|---|
| G-001 | `material_id` 权威 | 「对齐到 3rd-review 公开 v3 算法并冻结（推荐）」 | 改 WorkflowHub 侧 `runtime/review/review-packet-identity.mjs:121-157` 使其与 `3rd-review/lib/attachments.mjs:18-26` 一致（排除 `canonical-evidence.json`、`authenticated-evidence.json`、`review-instructions.md`），并冻结算法；**不得取消比较**（`CONSTITUTION.md:28`）。风险：3rd-review 那套算法目前只在未提交工作树里，没有稳定提交点可钉 | 用户 2026-09-19；`docs/research/workflowhub-wh-review-material-identity-incident-20260825.md:10-11,28`；F-011 |
| G-002 | 材料未知键处置 | 「未知键改为丢弃，但必须记一条显式事实（推荐）」 | 不中止、不静默：丢弃 + 记显式事实；真正的 `rule.forbidden` 键与固定指令模板不符仍失败。风险：需定义丢弃事实的形状 | 用户 2026-09-19；F-001（`MATERIAL_INCOMPLETE` 153 / `MATERIAL_FORBIDDEN` 38） |
| G-003 | 未锚定 finding 降级目标 | 「丢掉那条 finding + 记显式事实，不影响其它 finding 与成员（推荐）」 | 不再把整轮判失败；该 finding 不进结论并留痕。风险：必须明确其事实形状，且不得让编造 finding 静默进入结论 | 用户 2026-09-19；F-001（`EVIDENCE_ANCHOR_INVALID` 20 次 / 55 provider-分钟） |
| G-004 | 20 分钟墙钟等待 | 「维持 20 分钟不动，只登记注释与归档不一致（推荐）」 | 不改判定；登记源码注释（`skills/wh-review/scripts/simple-review-runner.mjs` 附近）与归档 `specs/archive/workflowhub-mechanism-simplification-t2-20260911/decision-log.md:457`（D-030③）的表述不一致这一事实。风险：20 分钟空等仍会发生（实测 3 次） | 用户 2026-09-19 |
| G-005 | 错误码注册表 | 「注册表保持开放：未知码原样透传并标 unknown（推荐）」 | 不新增严格判定；`PROVIDER_PRINT_TIMEOUT`（未注册，唯一注册表在 `skills/wh-review/scripts/review-result.mjs:144-170`）与 `RATE_LIMITED` 原样透传并标 `unknown`，与 `CONTEXT.md:282-283`「原始错误码必须原样保留」一致 | 用户 2026-09-19 |
| G-006 | 是否立 ADR | 「立，写为：不承载身份/顺序/hash/必需产物绑定的检查一律降级为质量事实；身份类检查不改宽松度、只统一算法（推荐）」 | 已按该一行决定创建 ADR（文件引用见 `## 文档结果`） | 用户 2026-09-19 |

### 两处材料更正（grill 现场核实）

- **取消断言的范围更正**：本材料此前写的 `tests/review/review-managed-lifecycle.test.mjs:441-467` **不准确**。真正的墙钟守卫在 `:526-558`；「绝不取消」守卫共 **6 处**：`:378`、`:433`、`:478`、`:507`、`:540`、`:584`。任何放宽必须改这 6 处，而不是一个区间。其中 `:540` 的 double 抛出文本为 `caller-side wall-clock termination is forbidden`；`:599-600` 断言 `calls` 不含 `cancel` 且 `vi.setSystemTime(1_200_000)`。
- **`material_id` 的规模更正**：不是「一处修不好」，而是 **3 个互不相同的哈希实现 + 4 个独立相等点**。三个实现：`skills/wh-review/scripts/review-materials.mjs:840-843`（`canonicalMaterialManifest`，`:2211-2212` 过滤 `canonical-evidence.json`）、`runtime/review/review-packet-identity.mjs:121-156`（**未对齐**，仍把 `review-instructions.md` 与 `authenticated-evidence.json` 算入，并带 `version`/`surface` manifest）、`3rd-review/lib/attachments.mjs:18-26`（`target`→`path`、`size`→`bytes` 重命名后排序）。四个相等点：`skills/wh-review/scripts/review-provider-client.mjs:687`、`simple-review-runner.mjs:680`、`:1397`、`runtime/review/review-record-route.mjs:146`。`material_id` 的算法在任何契约里**都没有写明**（`3rd-review/docs/` 只写 `"sha256"`）。

### 四项客观退出检查（grill 契约要求）

- 外部依赖接口已核实真实定义：**pass** —— `3rd-review/lib/broker.mjs:795` `cancelManaged(runtime_id)`（唯一生产调用点 `3rd-review.mjs:62`）；WorkflowHub 侧 `skills/wh-review/scripts/review-provider-client.mjs:899` 对象参数版（生产调用点 **0**）；`review_mode` 门位置已逐行核实。
- 涉及字段/路径命名已有唯一权威定义：**unresolved** —— `material_id` 算法无书面权威（唯一线索是 `docs/research/workflowhub-wh-review-material-identity-incident-20260825.md:28` 指向 3rd-review 公开 v3 算法，而该 checkout 未提交）。已由 G-001 裁定方向，权威定义待 build-spec/build-code 落地时冻结成契约。
- 失败路径/异常语义明确：**pass（附风险登记）** —— 12 项处置各自的新失败行为已逐条核实；其中「材料未知键丢弃」有静默通过风险，已由 G-002 以「必须记显式事实」闭合；「未锚定 finding」为最高风险项，已由 G-003 闭合。
- 范围边界「做什么/不做什么」写死：**pass** —— 见 `## 非目标`；grill 另确认三项零事故证据检查（quorum ③、信封必需键 ⑥、finding 证据字段 ⑦）本次保留不动。

### 与现有术语/ADR 的冲突及处理

- `CONTEXT.md:380-381` 正式写边界：本方向触及的是 review-packet 检查而非核心 publication，**不冲突**；例外是 `material_id` 属身份检查，故 G-001 只统一算法不放宽。
- `CONTEXT.md:98-99` 审查闭环「一轮独立异源审查 + 仅当无任何语义建议且具体传输/材料问题已改变才允许重发」：移除 `review_mode` 重发门**扩展**了它（传输问题确实变了），但需防「问题未变仍重发」。
- `CONTEXT.md:282-283`「原始错误码必须原样保留；分类只用于汇总，不能覆盖原始事实」：当前 `PROVIDER_PRINT_TIMEOUT`→`PROCESS_TIMEOUT` 覆写与 `PUBLIC_RESULT_INVALID` 覆写**违反**该条；本方向使其**回到合规**。
- `CONTEXT.md:285-286`「模型调用失败与 finding 证据无效是两层事实」：当前把 finding 级缺陷升级为整轮失败**违反**该条；本方向使其**回到合规**。
- `CONTEXT.md:383-384` 阶段完成判据：放宽后仍必须保留 `partial`/`unavailable`，不得宣称完成。
- ADR `0007:4-7`（identity/hash/snapshot/scope/material 绑定保持 fail-closed）**兼容**——只缩小爆炸半径，不动身份。
- ADR `0025:9-15,25`（派发前拒绝记 `blocked_before_dispatch`、不新增公共 stage/command/store/broker 协议/重复 writer）、ADR `0028:35-38`（`recordSimpleReviewRequest` 是唯一 owner）、ADR `0010:11`（身份/顺序/hash/必需产物错绑继续 fail-loud）、ADR `0017`（material_digest/snapshot_tree 不再是 freshness 触发）**均兼容**。
- `D-030③` **不在任何 ADR 里**，只在 `specs/archive/workflowhub-mechanism-simplification-t2-20260911/decision-log.md:457`；G-004 选择维持现状并登记不一致。
- 冲突处理：以上冲突均已在 grill 内闭合，无需用户再次回答。

## 审查处置

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
|---|---|---|---|---|---|
| FND-001 | 方向审查（step 6）无可消费结果：`PROTOCOL_INCOMPATIBLE` / `blocked_before_dispatch` / `result_ref=null`（红 `4c8c0f63-caef-54c1-ada9-7f31aaf5aa14`、蓝 `45223bbe-b0b3-5dab-a0f8-20cbe7e9673c`） | 本阶段拿不到方向级独立建议 | `unavailable`（不是 pass、不是空 findings） | 修复跨仓 `material_id` 后可重派；本次不重试 | owner=make-decision；consumer=stage completion；retain（provenance） |
| FND-002 | 细节审查（step 10）无可消费结果：同根因 `PROTOCOL_INCOMPATIBLE` / `blocked_before_dispatch` / `result_ref=null`（红 `ebb891c3-3478-53a2-a098-852314e00e81`、蓝 `2c12c9e4-64d8-514a-a031-861576417fbe`） | 本阶段拿不到细节级独立建议 | `unavailable`（不是 pass、不是空 findings） | 修复跨仓 `material_id` 后可重派；本次不重试 | owner=make-decision；consumer=stage completion；retain（provenance） |
本次两条审查均 unavailable，无 finding 可处置；这属于如实事实，不阻断本阶段收口，也不得被记为通过。

## 最终确认

- 状态：`accepted`
- 用户原文与 host-visible 绑定：第一次为 `用户 2026-09-19 结构化答复「确认接受，签发」`；本阶段**当前有效**的第二次（重新签发）为 `「确认接受修订后的材料，重新签发」`，绑定当前材料字节 sha256 `dc1f26db9c53cf0437c2be73689f91d594d770d3a59c90d5533abd250b7c6457` 与对应 `material_revision`；同时授权 `「授权：开分支 + commit（不 push）」`（对象 OI-22 / D-011，重新签发后继续有效）。宿主问答工具不提供 `reply_ref`/`reply_hash`，按降级路径登记，未伪造凭证；content-addressed 绑定由 step 11 interaction aggregate 承载。
- 未确认内容：无。

## 拒绝方案

| 选项 | 拒绝理由 | 关联 D |
|---|---|---|
| 按入口清单 §2.3 的过期状态给 4.7 定范围 | §2.3 描述已被 3rd-review 工作树现状推翻（8 个未提交改动文件已含大部分修法），照旧表会重复施工或漏掉真实残留（F-007） | D-008 / OI-10 |
| 照缺陷报告原文把 4.6 四条全做 | 报告引用行号已全部漂移，缺陷1/4 已修、缺陷2 已改为内容绑定+互引，全做即重复劳动（F-008、F-009） | D-007 / OI-09 |
| 4.1 按源文件重建正交终态状态机 | 用户 Q13/R6 明确选择「用字段承接，不要用状态机承接」，其主输入 followup 方案已被整体否决；一旦新增终态状态机即判失败（F-005） | OI-05（not_applicable） |
| 取消 `material_id` 比较 | 违 `CONSTITUTION.md:28`；用户 grill G-001 明确「不得取消比较」，且 OI-30 的 counterexample 已把「靠删除比较实现」判为失败 | D-017 / OI-30 |
| 让 3rd-review 反向消费 WorkflowHub 的摘要（改由一侧产出、另一侧读取） | 身份必须由两侧各自独立算出才可比较；改为一侧消费另一侧摘要等于取消独立比较面，与 G-001「对齐算法并冻结」及 ADR-0025 的重复 writer 禁令冲突 | D-017 / OI-30 |
| 新增 `material_digest` wire 字段 | 不新增持久对象、schema 或 wire 协议（AGENTS.md vNext 边界、ADR-0025）；且 ADR-0017 已定 `material_digest`/`snapshot_tree` 不再是 freshness 触发 | D-004 / OI-14、D-017 |
| 缩短或删除 20 分钟墙钟等待 | 用户 grill G-004 选择「维持 20 分钟不动，只登记注释与归档不一致」；改判定会新增严格判定并牵动取消调用边界 | D-005、D-015 / OI-28 |
| 收紧错误码注册表 | 用户 grill G-005 选择「注册表保持开放：未知码原样透传并标 unknown」；收紧即新增严格判定，且违 `CONTEXT.md:282-283`「原始错误码必须原样保留」 | D-013、D-015 / OI-25、OI-28 |
| 拆除零事故证据的三条红线（③ quorum、⑥ 信封必需键、⑦ finding 证据字段） | 三条均零触发、无事故证据，拆之属臆测；用户裁定「只拆有旁证的，其余登记观察」「零触发红线保留，不拆」 | D-015 / OI-28 |
| 新增任何严格判定（含合并新增的 11 处一并保留/收紧） | 用户逐字口径「我不允许任何严格的的判断出现！无论是workflowhub或3rd-review」；其中仅 provider 集精确匹配有旁证可拆，其余登记观察（F-010） | D-015 / OI-28 |
| 新增任何验收机制或采集面（含拆松前后计数脚本） | 用户原话「不要加任何强硬的验收…完全无法维护」；裁定「只用既有针对性测试，不做前后计数」 | D-016 / OI-29 |
| 把 `secret\|data` 加严 token 保留 | 该 token 未提交、零触发，`/data` `/secret` 是普通正文词，误杀风险高；用户裁定「回退，不准做任何加严」 | D-015 / OI-28 |
| 把两份 `review-input-bounds.mjs` 同步到严格侧 | 用户裁定「对齐到宽松侧，删掉 skill 那份新增的 fail-closed 抛出」；skill 侧 `MATERIAL_TOO_LARGE` 抛出为零触发新增加严（F-009） | D-015 / OI-28 |

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
|---|---|---|---|
| RISK-001 | 入口清单 §2.2/§2.3 描述的 3rd-review 状态已被其工作树现状推翻（8 个未提交改动文件已含大部分修法） | 若照 §2.3 表定范围，会重复施工或漏掉真实残留 | 本任务 step 4 现场复算 / make-decision owner |
| DEF-001 | 4.5 `workflowhub-stage-giant-slicing` 判死，不进范围 | 解锁：DEF-01 触发条件①/②/③ 或用户显式推翻 | 下一轮任务 owner |
| DEF-002 | 4.8 `workflowhub-cost-baseline-remeasure` 延期，不产出收益数字 | 解锁：新的治理决定重新授权度量通道 | 用户裁定 + 下一轮任务 |
| DEF-003 | F4/F5/F7/F11 已终结（F5 接通取消已裁定、F7 计数已现场复算澄清、F11 属仓外文件、F4 统一为 PROCESS_TIMEOUT + cause_code）；不再交下游处置 | 无（已闭合） | 已闭合（OI-25 / D-013） |

### 质量边界

- 质量事实：step 1 只依赖只读调研与用户真实答复；尚无 provider 审查事实。
- 推进资格：无。质量事实缺失不阻断同 task 修复，也不构成完成宣称。
- 完成判据：本阶段完成判据见 `## 成功/失败边界` 与各 OI `acceptance`。
- 不可逆授权边界：跨仓 3rd-review 的 commit/push 属不可逆动作，须 Step 11 用户显式授权（OI-22）。

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
|---|---|---|---|
| OPEN-001 | 合并还是拆分（OI-02）——已由 talk-round-1 裁定为单任务 | 方向级问题 | 已解决：用户 talk-round-1（2026-09-19） |
| OPEN-002 | 4.3 的 D-030③ 边界（OI-07）——已裁定为披露+接通取消接口，但其与 OI-10/OI-23 及既有测试断言的矛盾待裁定 | 方向级矛盾 | 用户，talk-round-2 |
| OPEN-003 | 4.7 真实剩余范围（OI-10）——已由现场 diff 复核收敛为 8 项 | 已解决 | 用户 talk-round-2（2026-09-19）+ 现场复核 |
| OPEN-004 | 跨仓 3rd-review 写入边界（OI-22）——已裁定为改+测试+开分支 commit | 不可逆动作授权待生效 | 用户，step 11 approve-decision |
| OPEN-005 | §2 是否还有 workflowhub 仓内改动（OI-27）——合并后现场已查明 WorkflowHub 侧已打通 process_outcome/parse_outcome；剩余为 3rd-review 侧 | 已由调研澄清 | step 4 调研（2026-09-19） |
| OPEN-006 | 完成边界与验收口径（OI-03、OI-20、OI-21）——已由用户裁定：只用既有针对性测试，不做前后计数 | 已解决 | 用户 talk-round-2 第二批（2026-09-19） |
| OPEN-007 | F4/F5/F7/F11 处置归属（OI-25）——F5/F7/F11 已澄清，仅剩 F4 错误码映射待定 | 大部分已解决 | 用户，talk-round-3 |
| OPEN-008 | 既有测试断言「取消路径绝不调用」是否修改（OI-07 连带）——已裁定：改写为「只在源漂移事实下调用」并补一条禁止因墙钟调用的断言 | 已解决 | 用户 talk-round-3（2026-09-19） |
| OPEN-009 | 4.6 合并后取舍（OI-09）——已裁定「以现场为准，只补真缺口」 | 已解决 | 用户 talk-round-2 第二批（2026-09-19） |
| OPEN-010 | 4.2/4.3/4.4 取舍与验收（OI-06、OI-08、OI-20、OI-21）——已裁定三项都收、4.3/4.4 只做剩余 | 已解决 | 用户 talk-round-2 第二批（2026-09-19） |
| OPEN-011 | 拆松如何证明生效（OI-29）——已裁定只用既有针对性测试 | 已解决 | 用户 talk-round-2 第二批（2026-09-19） |
| OPEN-012 | F4 错误码映射（OI-25）——已裁定统一成 PROCESS_TIMEOUT + cause_code | 已解决 | 用户 talk-round-3（2026-09-19） |
| OPEN-013 | 跨仓 material_id 规范化以哪一侧为权威（OI-30）——已裁定：对齐到 3rd-review 公开 v3 算法并冻结 | 已解决 | 用户 grill G-001（2026-09-19） |
| OPEN-014 | material_id 算法的书面权威定义（唯一权威未成文，当前只有研究事件记录指向未提交的 3rd-review checkout） | 命名唯一权威缺口，grill 记为 unresolved | build-spec/build-code 落地时冻结为契约；触发条件：material_id 算法的书面权威被冻结成契约时；关闭条件：契约文件出现且两侧实现对同一 packet 产出同一值 |
| OPEN-015 | 「未知键丢弃」与「未锚定 finding 丢弃」两条显式事实的形状与字段名 | 实现细节，方向已定 | build-spec；触发条件：build-spec 定义丢弃事实字段时；关闭条件：两类丢弃事实各有字段名与唯一 consumer 并在 spec 中成文 |

## Supersedes

无。本任务为新建任务，不承接任何 successor/predecessor 或历史纠正关系。

## 文档结果

- CONTEXT.md：**no change**。理由：本方向使代码回到 `CONTEXT.md:282-283` 与 `:285-286` 已写明的语义合规，未引入领域专家会使用的新术语；新引入的「身份类检查 vs 非身份类检查」边界属治理规则，按 grill 契约写入 ADR 而非 CONTEXT.md。四项受影响既有术语（正式写边界、审查闭环、审查执行结果、审查发现结果）已逐条核实为**兼容或回到合规**。
- ADR：**created** —— `docs/adr/0031-review-check-downgrade-and-identity-boundary.md`。**登记**：owner＝make-decision（本任务）；真实 consumer＝后续所有消费 review 失败语义的阶段（build-code / verify-code）与 3rd-review 错误码映射；保留条件＝身份类检查仍 fail-loud 且非身份类检查已降级为质量事实；删除条件＝该边界被经审查的替代机制取代时。
- ADR 三项判据：难以反转＝真；无背景会意外＝真；存在真实取舍＝真。
- 术语/ADR 冲突及处理：见 `## grill` 的「与现有术语/ADR 的冲突及处理」；全部已在 grill 内闭合。
- 不复制 spec 的边界：本文件只做决策索引，不复制页面流、接口字段、任务步骤与测试过程。另：`D-030③` 与「不新增第二套 review dispatcher」两条约束**在仓库里都没有书面 ADR**（后者零命中），最近的可引用规则是 ADR-0025 的重复 writer 禁令与 ADR-0028 的 owner 条款——见 `## grill` 的「与现有术语/ADR 的冲突及处理」。

### Exit checks

- 上下文一致：待 step 12 spec-analyze
- owner/接口一致：待 step 12 spec-analyze
- 失败语义明确：待 step 12 spec-analyze
- 范围与延期明确：待 step 12 spec-analyze
