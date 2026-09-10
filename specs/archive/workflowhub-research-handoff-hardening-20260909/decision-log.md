# Decision Log

- task_id: `workflowhub-research-handoff-hardening-20260909`
- stage: `make-decision`
- worktree: `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-research-handoff-hardening-20260909`
- baseline_commit: `1195bca08be4ef62e204ac764873b9e46a662432`
- task_dir: `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-research-handoff-hardening-20260909`
- 会话原始需求日期：2026-09-09
- 增量修订：2026-09-10（R-021…R-024 / D-010…D-013；见「模块 F」「增量诊断事实与纠正」「增量修订确认」）

## 核心需求

- 核心需求：WorkflowHub 在真实使用中反复出现"证据真实但状态卡住"的摩擦——外部调研做不彻底、stage 交接被假缺口阻塞、会话切换丢上下文；本任务要把这三类问题连同已复现的 material/UI 契约、review 预算归域与性能放大缺陷，在同一任务内收敛为可验收的方向与边界。
- 核心目标：调研可核验、stage 不再被假缺口阻塞、每阶段自动复盘并留下可续接的交接包；同时按宪法清理控制面成本，不新增会阻断推进的质量门。
- 已选方向：见「决定」区模块 A–F（D-001…D-013），增量修订见模块 F。

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | make-decision 的外部调研做得不彻底，有时 anysearch 技能无法使用或返回 402，导致完全无法做外部调研；要求检查 make-decision 的外部调研流程与逻辑是否有问题，并检查 anysearch 是否有问题 | “现在执行 workflowhub 的 make-decision 任务时，外部调研中总是做的不彻底，有的时候甚至显示 anysearch 技能无法使用或 402 错误导致根本不能进行外部调研，需要你检查一下 make-decision 的外部调研流程和逻辑有没有问题，再看看 anysearch 有没有问题” | 已覆盖：D-001/D-002/D-003 + AC1/AC2/AC3 |
| R-002 | 需要找到其他可以做外部深度调研的兜底方式 | “再看看有没有其他兜底的方式可以进行外部深度调研” | 已覆盖：D-003 + AC3 |
| R-003 | 现有 handoff 技能存档信息太少，丢失大部分任务信息和上下文，只有非常基础的信息；handoff 之后新会话只能靠四份核心文件了解任务，信息失真实严重 | “handoff 技能存档的信息太少了，丢失了大部分的任务信息和上下文，只有一些非常基础的信息，导致 handoff 之后，下一个会话只能通过 4 个核心文件来了解任务信息，整个信息失真的太厉害” | 已覆盖：D-009 + AC9 |
| R-004 | 需要设计一个新的 handoff 技能，放在 workflowhub 内部 | “我需要设计一个新的 handoff 技能，放在 workflowhub 内部” | 已覆盖：D-009 + AC9 |
| R-005 | 新 handoff 技能要在每个 stage 结束的时候自动调用 | “每个 stage 结束的时候自动调用” | 已覆盖：D-009 + AC9 |
| R-006 | handoff 文件存在 task_dir 的项目文件夹中 | “把 handoff 文件存在 task_dir 的项目文件夹中” | 已覆盖：D-009 + AC9 |
| R-007 | 在 stage 结尾通告 handoff 文件路径，方便用户基于该路径直接去新会话开始下一个 stage 的任务 | “在 stage 结尾的时候通告一下文件路径，方便我基于这个文件路径直接去新会话中开始下一个 stage 的任务” | 已覆盖：D-009 + R-020 + AC9 |
| R-008 | 按标准 WorkflowHub 流程开始任务：先创建 worktree，然后从 make-decision 开始，不跳阶段 | “请按标准 WorkflowHub 开始这个任务做这个两个问题的调研和改进吧，先创建 worktree，然后从 make-decision 开始，不要跳阶段” | 已覆盖：过程约束（Exit checks） |
| R-009 | 不要依赖 build-spec 补需求；先基于原始需求在 make-decision 中把需求梳理清楚 | “也不要依赖 build-spec 补需求。先基于原始需求，在 make-decision 的过程中和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项” | 已覆盖：T3-Q7=A + AC1–AC9 |
| R-010 | make-decision 过程中必须与用户一起梳理：完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项 | 同上 | 已覆盖：acceptance-draft §1/§1b/§2/§3/§4/§7 + AC1–AC9 |
| R-011 | 注意主会话上下文控制和子代理派发 | “注意主会话上下文控制和子代理派发” | 已覆盖：过程约束（质量边界） |
| R-012 | Talk 和 grill 请用大白话说明选项、后果和风险 | “Talk 和 grill 请用大白话说明选项、后果和风险” | 已覆盖：过程约束（26 条 Talk + 6 条 Grill） |
| R-013 | **新增需求**：stage 切换时总是出现各种阻塞，典型提示为：多个 outcome 都绑定同一当前 snapshot/material 且均为 authenticated completed → `deriveStageOutcomeStatuses()` 把合法重试判成 conflict → `deriveStageCompletion()` 又把 conflict 折叠成 stage_outcome missing → public status 仍是 `quality_status=in_progress`、`quality_missing=["stage_outcome"]`。要求一起调研根因、为什么总出现违反 workflowhub 的阻塞、应该如何处理 | 用户 2026-09-09 追加原文 | 已覆盖：D-004/D-005 + AC4/AC5 |
| R-014 | 已确认的方向选择：Q1=A（不加质量门，只做缺口披露）、Q2=B（anysearch 优先，失败降级到宿主 web_search/web_fetch）、Q3=A（新技能权威，旧 handoff 保留）、Q4=A+扩展（结构化区块+指针，并额外记重要决策/核心方案/踩的坑/重要参考调研）、Q5=A（publish 之后、stage-reflection 之前）、Q6=B（只覆盖四个作者阶段）、Q7=B（轻量落地，不进白名单 consumer 体系）、Q8=A（调研不进完成判据）、Q9=A（报告落 `quality/evidence/research/<sha256>.json`） | 用户 2026-09-09 Talk R1 回复 | 已覆盖：D-001…D-009 + AC1–AC9 |
| R-015 | Talk R2 确认：R2-Q1=A（三块一起交付）、R2-Q2=B（降级前先问一次）、R2-Q3=A（`quality/evidence/handoff/`）、R2-Q4=A（只落 taskPath）、R2-Q5=C（修误判 + 不折叠 missing + 修同毫秒 tie-break）、R2-Q6=同意非目标、R2-Q7=同意验收口径 | 用户 2026-09-09 Talk R2 回复 | 已覆盖：D-001…D-009 + AC1–AC9 |
| R-016 | **追加需求**：要求把阻塞问题调研得更清楚——为什么会有这些问题？即使有这些问题，`stage_outcome` / public status / `quality_status` / `quality_missing` 这些东西**为什么会阻塞任务推进**？这些东西是哪里来的对象？不但增加维护成本，而且违反 workflowhub 宪法。要求全局调研：这种 stage 交接、证据、流程之类的东西有多少？为什么会有？为什么又会阻塞推进？用户判断"workflowhub 宪法完全被忽视了" | 用户 2026-09-09 追加原文 | 已覆盖：D-007 + AC7 |
| R-017 | **追加需求**：另一个任务的官方 build-code 仍是 `quality_status=incomplete`，缺少 authenticated stage outcome、formal integration review 和 capability proof，要求一起调研 | 用户 2026-09-09 追加原文 | 已覆盖：D-006 + AC6 |
| R-018 | Talk R3 确认：T3-Q1=A（同一 task+stage+snapshot+material 的多个 completed attempt 内容等价，任意一个都满足完成；真冲突只认同 attempt 异字节）、T3-Q2=A（`integration_review` 谓词不动，只修投影标签）、T3-Q3=A（**必须给 stage-reflection 接生产 executor，让它每 stage 自动复盘并记录**；用户明确反对改为手动：改为手动等于永远不执行）、T3-Q4=B（21 处 skip 守卫先逐条分类再处理）、T3-Q5=A（handoff 放 stage 最末、reflection 之后） | 用户 2026-09-09 Talk R3 回复 | 已覆盖：D-004…D-008 + AC4–AC8 |
| R-019 | Grill 确认：G1=`stage-handoff`（技能名，产物=只读交接包，不替代"下游交接"/"用户完成卡"）、G2=B（只靠用户手动贴路径，不做自动发现）、G3=A（只做索引+结论+指针，不复述材料正文）、G4=A（reflection 先跑、handoff 后写，handoff 含复盘结论）、G5=A（handoff 失败记 unavailable 并照常通告，不阻断 stage 完成） | 用户 2026-09-09 Grill 回复 | 已覆盖：D-009 + AC9 |
| R-020 | **硬性验收项**：stage 结束时的大白话总结**必须包含 handoff 文件的完整路径**，方便用户直接复制到下一个会话 | 用户 2026-09-09 Grill 追加 | 已覆盖：D-009 + AC9 |
| R-021 | **增量需求**：把已复现的 material/UI 契约缺陷正式纳入——撤销"decision-log 缺 material-navigation"这一假事实；把 UI applicability 从自由文本改为结构化 producer contract，writer 在落盘当下使用与 reader 相同的 validator | 用户 2026-09-10 增量修订答复（采纳三分法：纠正事实 + consumer census 发现进本任务）；证据 `runtime/stage/stage-handlers.mjs:78-85`、`runtime/task/material-workspace.mjs:134-143`、`runtime/stage/stage-content-contracts.mjs:508-530,1661-1704` | 已覆盖：D-010 |
| R-022 | **增量需求**：review budget history 先按可证明的 namespace/subject 归域；无关旧损坏不阻断当前 dispatch，当前损坏或不可归域损坏继续 fail-closed | 用户 2026-09-10 增量修订答复；证据 `runtime/review/review-record-route.mjs:428-496,541-561`；针对性 fixture 2 passed / 46 skipped 验证坏 history 时 `runner.calls=0` | 已覆盖：D-011 |
| R-023 | **增量需求**：慢测与 Git spawn 放大按性能事实处理；为 authenticated workspace identity 校验与 official fixture 建性能预算，不削弱边界校验 | 用户 2026-09-10 Talk T4-Q1=**A 纳入本任务**；证据 整文件 exit 130、单 fixture 12–13.5s、上游 seed case 54.8s、约 796 次 Git child process | 已覆盖：D-012 |
| R-024 | **增量需求**：纠正外部根因文档"根因 A"的错误机制，并把 `quality/verify.json` 无生产 publisher、`publishVerifySummary` 缺 canonical-root guard 登记为控制面清单发现 | 用户 2026-09-10 增量修订答复 + Talk T4-Q2=**A**、T4-Q3=**A**；证据 `tools/cli/stage-runtime.mjs:246,261,326,341`、`runtime/stage/completion-predicates.mjs:820`、`runtime/evidence/quality-store.mjs:77-79,238-244` | 已覆盖：D-013 |

### 需求框架（先选一类，再逐步回填）

- **framework**：`functional`（背景→问题→目标→方案→验收→扩展）；本任务含调研子树（R-001/R-002 的失败模式诊断），在受影响节点下挂 `research` 子树。
- **选择理由**：交付物是两个可落地的能力改进（调研链路加固 + 新 handoff 技能），不是纯研究结论；但调研部分是决策的证据来源，需要按 `问题→论断→证据→裁决` 展开。
- **回填规则**：调研、Talk、审查、Grill 只能扩展已有节点；混合任务以 `functional` 为外层，在受影响节点下挂 `research` 子树。

| node_id | 节点 | status | evidence_status | evidence_owner | next_review_trigger |
| --- | --- | --- | --- | --- | --- |
| N-001 | 背景/问题：make-decision 外部调研不彻底、anysearch 不可用/402 | **confirmed** | **evidenced**（F-001/F-002/F-012） | 子代理 A + C | 已闭合；材料变更时重评 |
| N-002 | 目标：调研链路可稳定做深度外部调研，且有兜底 | **confirmed** | **evidenced**（D-001…D-003 + AC1–AC3） | 主会话 + 用户 | 已闭合 |
| N-003 | 方案：新 handoff 技能设计与自动调用点 | **confirmed** | **evidenced**（D-009 + AC9 + G1–G6） | 子代理 B + 主会话 | 已闭合 |
| N-004 | 验收：stage 末通告路径、新会话可续接、调研深度可核验 | **confirmed** | **evidenced**（AC1–AC9 + acceptance-draft） | 主会话 | 已闭合 |
| N-005 | research 子树：anysearch 失败模式与兜底方案 | **confirmed** | **evidenced**（F-002 + D-003） | 子代理 C | 已闭合 |
| N-006 | 阻塞子树：stage 切换假缺口与控制面成本 | **confirmed** | **evidenced**（F-004/F-006…F-011 + D-004…D-008） | 子代理 D/E/F/G/H/I/J | 已闭合 |

## 目标

- 目标：让 WorkflowHub 的**外部调研可核验**、**stage 切换不再被假缺口阻塞**、**每阶段自动复盘并留下可续接的交接包**；同时按宪法 F5/F8/F11 清理控制面成本，不新增任何会阻断推进的质量门。
- 目标分解（与决定对应）：调研链路（D-001/D-002/D-003）、阻塞与完成语义（D-004/D-005/D-006）、控制面治理（D-007）、自动复盘（D-008）、交接包（D-009）、增量修订（D-010/D-011/D-012/D-013）。
- 详细目标与验收判据见 `acceptance-draft.md` §5（AC1–AC9）。

## 成功/失败边界

- 成功边界（本阶段判定）：26 条 Talk 有真实答复、6 条 Grill 有真实答复、调研完成并落盘、13 条决定齐全且互相一致、**FND-001…FND-055 全部有处置**（其中 FND-030…FND-053 为本轮 spec-analyze 复查发现）、用户真实确认、interaction aggregate 绑定当前 decision-log、stage-end spec-analyze 的 finding 在本 stage 修复或如实保留。
- 失败边界（必须如实保留、不得改写）：调研工具不可用且用户未批准降级 → `unavailable`；provider 不可用 → `integration_review: unavailable`（不满足谓词但不阻断推进）；reflection/handoff 失败 → 记真实状态 + 阶段末披露；同 attempt 异字节或不同 attempt 语义签名不一致 → 真冲突 fail-loud；用户拒绝 → `declined`。
- 三分边界（推进资格 / 阶段完成 / 整体交付）见 `acceptance-draft.md` §2b。

## 范围

### step 1 load-context（完成）

已读取并核对：`workflows/make-decision/SKILL.md`（377 行）、`workflows/make-decision/steps.json`（14 步）、
`workflows/make-decision/skill-deps.yaml`（6 个技能 + 3 个外部能力）、`docs/standard-workflow.md`（369 行）、
`skills/workflowhub-host-protocol/SKILL.md`、`AGENTS.md`、`CONSTITUTION.md` 引用、`skills/decision-log/`。

任务身份与工作区（已认证）：

| 事实 | 值 |
| --- | --- |
| project / task | `workflowhub` / `workflowhub-research-handoff-hardening-20260909` |
| worktree | `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-research-handoff-hardening-20260909` |
| branch | `task/workflowhub/workflowhub-research-handoff-hardening-20260909` |
| baseline_commit | `1195bca08be4ef62e204ac764873b9e46a662432` |
| task_dir（全局 storage root） | `/Users/Hugh/Hugh/Knowledge` |
| taskPath（用户说的"项目文件夹"） | `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-research-handoff-hardening-20260909` |
| 四份材料位置 | `<worktree>/specs/<task-id>/`（worktree 内） |

### step 2 triage-scope（本步）

- 当前范围：
  1. 诊断并加固 `make-decision` 的外部调研流程与逻辑（R-001）；
  2. 诊断 anysearch 技能的可用性与失败模式（R-001）；
  3. 给出可用的外部深度调研兜底方案（R-002）；
  4. 在 workflowhub 仓库内新增一个自动调用、落盘 taskPath 的新 handoff 技能（R-003~R-007）；
  5. 全过程按标准 stage 推进、不跳阶段、不依赖 build-spec 补需求（R-008/R-009）；
  6. 与用户逐项梳理用户流程、页面范围、数据状态、成功/失败边界、非目标与延期项（R-010）。
- 用户流程/结果只记索引和验收影响，细节进入 spec：本任务没有面向最终用户的页面；只有 agent/人可观察的 CLI 与文件产物。**页面范围 = 无 UI 页面**（UI applicability 需按三输入规则计算后写入 `## UI applicability`）。

### 已确认的关键事实（证据，待子代理补齐后定稿）

| fact_id | 事实 | 证据 |
| --- | --- | --- |
| FACT-001 | `research-inputs` 是条件步：`skill-deps.yaml` 中 deep-research 的 `trigger: proportionate_research`，`external_capabilities` 的 anysearch-api/web-fetch/muyu-search-mcp 均 `required_when: external_research_approved`、`absence_semantics: diagnostic` | `workflows/make-decision/skill-deps.yaml:11,21-24` |
| FACT-002 | stage-handlers 对缺失 research receipt 只写诊断，不视为失败 | `runtime/stage/stage-handlers.mjs:3249,3380,3502`；`runtime/stage/stage-handlers.mjs:3464` 文案 "no research receipt supplied" |
| FACT-003 | make-decision 的 `research` 是允许 receipt 之一，但不在必填集合 | `runtime/stage/stage-handlers.mjs:178` |
| FACT-004 | `deep-research` 已定义 R0–R5 深度调研契约（含 `research-report.v1`、内容寻址落盘、三角测量、独立复核） | `skills/deep-research/SKILL.md:18-99` |
| FACT-005 | deep-research 声明工具路由：外部发现=`anysearch`，外部原文=`web_fetch`，外部并行深读=独立子代理（≤4） | `skills/deep-research/SKILL.md:91-99` |
| FACT-006 | runtime 中**搜不到** `muyu-search-mcp` / `anysearch-api` / `web-fetch` 三个外部能力的任何实现（仅在 skill-deps 声明） | 全仓 grep 仅命中 `workflows/make-decision/skill-deps.yaml:23-24` |
| FACT-007 | anysearch 匿名可用：本机无 `ANYSEARCH_API_KEY`、无 `runtime.conf`，实测 `search` 成功返回 | 主会话实测 exit 0；`skills/anysearch/runtime.conf.example` 仅有模板 |
| FACT-008 | anysearch CLI 对 HTTP ≥400 只抛 `HTTP <code>: <json>`，无 402 专用处理、无重试/退避/降级 | `skills/anysearch/scripts/anysearch_cli.js:60-66` |
| FACT-009 | anysearch 后端对无效 key 返回 `isError:true` + `invalid_api_key`（HTTP 200），不是 402 | 主会话 curl 实测 |
| FACT-010 | 存在一个"调研做得很彻底"的真实历史样例（anysearch 两轮 8 组查询 + web_fetch 精读 3 篇原文），但它是普通 evidence 文档，不是 `research-report.v1`，也无校验 | `specs/workflowhub-ui-frontend-capability-20260904/evidence/research-vibecoding-best-practices.md:1-3`；`specs/workflowhub-ui-frontend-capability-20260904/decision-log.md:49` |
| FACT-011 | 现有 `handoff` 技能在仓库外（`~/.claude/skills/handoff/SKILL.md`，53 行），模板为 6 必填 + 1 可选节，硬预算 200–350 tokens | 子代理 B 测绘；`~/.claude/skills/handoff/SKILL.md:10-34` |
| FACT-012 | 现有 handoff 落盘 canonical 位置是 `$TASK_TRACKING_ROOT/tasks/<task_id>/.agenthub/handoff/` + `~/.local/state/handoffs/` 桥接；与 WorkflowHub taskPath 布局不重合 | `~/.claude/skills/handoff/SKILL.md:46-49`；子代理 B |
| FACT-013 | `receive-handoff` 默认只呈现 4 个节（Goal/Current State/Next Action/Pointers），要"展开"才给全部；其 P2 查找分支 `-maxdepth 3` 到不了实际深度 4，永不命中 | `~/.claude/skills/receive-handoff/SKILL.md:29-76,109-113`；子代理 B |
| FACT-014 | 每 stage 只能有一个 `on_stage_end` 步（`stage-runner.mjs:1021` 取第一个，且要求 `blocking===false`），该位已被 `stage-reflection` 占用 | `runtime/stage/stage-runner.mjs:1021,2127-2129`；子代理 B |
| FACT-015 | 能拿到已认证 stage outcome 的唯一自动插入点是 publish 步与 stage-reflection 之间的普通 step | 子代理 B；各 `workflows/*/steps.json` |
| FACT-016 | 新技能要写 taskPath 必须走受控 writer（TaskHandle/ArtifactDir），且 `skill-deps.yaml` 的 `consumer.target` 必须在 14 个白名单里 | `runtime/stage/stage-skill-runtime.mjs:10-25,52-61`；`runtime/task/task-handle.mjs:444,799` |
| FACT-017 | `build-plan/SKILL.md` 现有约束："Do not add a handoff field or a second record"——新机制必须是 steps.json 的普通 step + taskPath 质量区产物，不能给四份材料加 handoff 字段 | `workflows/build-plan/SKILL.md:246-247` |
| FACT-018 | taskPath 在 worktree 之外，四份材料在 worktree 内；task_dir 本身是全局根 `/Users/Hugh/Hugh/Knowledge` | `docs/adr/0005-deterministic-task-directory.md:57`；`docs/contracts/task-context.md:7-13` |

### 子代理 A（make-decision 调研链路）新增事实

| fact_id | 事实 | 证据 |
| --- | --- | --- |
| FACT-019 | 调研**不在** make-decision 的任何完成判据里，且测试**主动断言它必须不在** | `runtime/stage/completion-predicates.mjs:69-81`；`tests/contract/stage-completion.test.mjs:36` |
| FACT-020 | e2e 证明：不给 research receipt 也能 `status=completed`、`quality_status=completed` | `tests/e2e/vnext-five-stage-current.test.mjs:786-800` |
| FACT-021 | research 的命名空间被硬编码为 `quality/tests/`，且校验器按**测试回执**校验（必须有 command/exit_code/command_hash/`quality/tests/output/` 的 output_ref）→ deep-research R4 要求的 `research-report.v1` **结构上通不过** | `runtime/stage/stage-handlers.mjs:154,326-337,699-727`；`tests/step-manifest.test.mjs:174-195` |
| FACT-022 | 研究发布写入器 `completeMakeDecisionResearch` 是 `unsupported` | `runtime/task/task-kernel-implementation.mjs:971` |
| FACT-023 | 实证：全仓 + 5 个真实 task store **零个** research-report 产物；某历史 task 引用的三份报告文件实际不存在 | 子代理 A 实测；`specs/archive/workflowhub-requirement-convergence-depth-20260905/decision-log.md:774` |
| FACT-024 | 无任何 validator 检查研究深度：spec-analyze 对 make-decision 只要求 `original_requirement` + `decision_log`；`## 调研` 只做标题存在性检查；`validateDecisionLogContract` 仅测试调用 | `runtime/stage/stage-content-contracts.mjs:4489-4493,4940-4952,2424-2428,2479` |
| FACT-025 | 跳过成本 = 一句非空 reason，不要求 evidence；仓内 fixture 把"本决定无需新增调研。"固化为合规完整日志 | `runtime/stage/stage-runner.mjs:47,186-190`；`tests/stage-decision-contract.test.mjs:92-93` |
| FACT-026 | anysearch 技能**不在** make-decision 的 skill-deps，也不在宿主全局技能目录；`used_by_stages: []`、`owner_stage: []`，deep-research 只写名字不给路径 | `skills/catalog.yaml:30-44`；`repo-skills.manifest.json:22-34`；`workflows/make-decision/skill-deps.yaml:11`；`skills/deep-research/SKILL.md:26,93` |
| FACT-027 | 外部能力探针 `doctorCapabilities` 无生产调用者；`external_research_approved` 条件全仓无激活代码；所有能力被强制 `absence_semantics: diagnostic` | `runtime/evidence/capability-doctor.mjs:16-64`；`runtime/evidence/check-skill-closure.mjs:224-232` |
| FACT-028 | 402 未复现：匿名模式下 search/batch_search/get_sub_domains/vertical/extract 全 exit 0，连续 8 次 search 无一失败 → 属配额/限流型间歇失败 | 子代理 A 实测（2026-09-09） |
| FACT-029 | 402 无专用处理：Python CLI `raise_for_status()` → `HTTP Error: 402` + `exit(1)`；JS CLI `HTTP ${statusCode}` + `exit(1)`；无重试/退避/fallback provider；SKILL.md 承诺的换 key 重试无实现 | `skills/anysearch/scripts/anysearch_cli.py:70-92`；`anysearch_cli.js:62-67,100-106` |
| FACT-030 | deep-research 的高调用量策略（每问题≤3轮 × 中英双语 × ≤4 并行子代理）极易打满匿名配额；且 `batch_search` 不接受 `--max_results`，照抄 cheat sheet 会得到 `Unknown argument` + exit 1（易被误判为"技能不可用"） | `skills/deep-research/SKILL.md:24-35`；子代理 A 实测 |
| FACT-031 | 唯一历史真实 research receipt 是 `quality/tests/research.json`（测试型回执），不是研究报告 | `specs/archive/requirements-completeness-audit-20260804/decision-log.md:377-379` |
| FACT-032 | 上一轮（`workflowhub-requirement-convergence-depth-20260905`）已诊断过同一句话："调研浅薄靠人推……跳过只需一句话、无完成标准、无读原文要求"→ 说明上轮只改了文字契约，没改运行时强制力 | `specs/archive/workflowhub-requirement-convergence-depth-20260905/spec.md:68` |

### 子代理 C（anysearch 压测与兜底）新增事实

| fact_id | 事实 | 证据 |
| --- | --- | --- |
| FACT-033 | **402 未复现**：57 次网络尝试中 402/429 出现 **0 次**；主压测 24 次里 23 次真实 API 全 exit 0 | 子代理 C `/tmp/any_stress_log.tsv` |
| FACT-034 | **真实故障是本机 TLS 黑障**（19:07–19:20 约 13 分钟）：窗口内 example.com / api.github.com / anysearch 全部 HTTPS 超时，但 TCP `nc` 成功、ping 0% 丢包；故障后自动恢复 | 子代理 C；`Connection Error: Client network socket disconnected before secure TLS connection was established` |
| FACT-035 | 磁盘上存在有效 key（`~/.claude/skills/anysearch/.env`，600，38 字符），实测有效；但**仓库副本读不到**（loadEnv 只读 `<skill_dir>/.env`），且带 key 也救不了黑障 | 子代理 C 实测 |
| FACT-036 | `anysearch_cli.js` L59-65/79-81：非 JSON 响应体时**状态码被丢弃**（402 会变成 `Invalid JSON response`）；L66-69 丢弃 JSON-RPC error.code；L101-106 所有错误统一 `exit 1`；无重试/退避/Retry-After | `skills/anysearch/scripts/anysearch_cli.js` |
| FACT-037 | `req.setTimeout(30000)` **不覆盖 TLS 握手停顿**：实测挂死需外部 kill（exit 124） | 同上；子代理 C 实测 |
| FACT-038 | Node `https` 不读系统代理，4 个 CLI 全无代理支持；本机 `scutil --proxy` HTTPEnable=1/7897 | 子代理 C |
| FACT-039 | 四个 CLI 对同一 402 输出四种文本；ps1 **不检查状态码**，会把 402 误报成 `Connection Error: Unable to reach the API endpoint`；sh 用 `curl -s` 无 `--fail`，402 变 `API Error` | 子代理 C |
| FACT-040 | `batch_search` 上限 5 条查询：6 条 → exit 1 `Error: batch_search supports a maximum of 5 queries`（未发网络请求，属客户端上限，易被误判为"技能坏了"） | 子代理 C 实测 #19 |
| FACT-041 | `web_fetch`（DSH 宿主）**明确合规**（`skills/deep-research/SKILL.md:26,96`），是黑障期唯一存活通道（实测 HTTP 200）；`web_search` 可用但**全仓未被点名** | 子代理 C |
| FACT-042 | `muyu-search-mcp` 不可用：`.mcp.json` 需要 `MUYU_MCP_PATH`+`MUYU_API_KEY`+`TAVILY_API_KEY`+`FIRECRAWL_API_KEY`，环境变量全缺 | 子代理 C |
| FACT-043 | 契约缺口 3 处（与子代理 A 一致）：① R4 要求 `quality/evidence/research/<sha256>.json` 但命名空间只认 `quality/tests/`；② research 收据被 `testFacts` 校验，`research-report.v1` 无机器校验；③ `completeMakeDecisionResearch` 是 unsupported，且 `runtime/schemas/` 中不存在 research-report.v1 schema | 子代理 A + C |

### 子代理 D（stage 切换阻塞）主会话已复现的根因

| fact_id | 事实 | 证据 |
| --- | --- | --- |
| FACT-044 | 真实复现：task `workflowhub-execution-acceleration-20260909` 的 make-decision 下有 **4 个 outcome**，其中 attempt-2 与 attempt-3 的 `run_id`、`snapshot_tree`、`material_revision`、`material_hashes` **完全相同**且都是 `completed` | `~/Knowledge/.../tasks/workflowhub-execution-acceleration-20260909/quality/evidence/stage-outcomes/make-decision/` |
| FACT-045 | `deriveStageOutcomeStatuses()`：同一 stage 下 completed 候选 >1 → 直接返回 `conflict`，不区分"同一事实的重复重试"与"互相矛盾的事实" | `runtime/stage/completion-predicates.mjs:542`（注释在 :468-474） |
| FACT-046 | `deriveStageCompletion()`：`stageOutcomeMissing = requireStageOutcome && stageOutcomeStatus !== "completed"` → **conflict 被折叠成 missing**，`missing.push("stage_outcome")`、`predicates.stage_outcome.status="missing"` | `runtime/stage/completion-predicates.mjs:311-312,320-326` |
| FACT-047 | stage `run_id` 按 `task+stage` 确定性生成（`vnext-<sha256 前32>`），所以同一 stage 的每次重试都落在同一 run_id；每次重试写新的不可变 outcome → 只要快照/材料未变就必判 conflict | `runtime/stage/completion-predicates.mjs:491` |
| FACT-048 | 第二个独立触发点：`selectLatestTerminalObservation()` 以 `recorded_at` 毫秒排序，**时间戳相同也判 conflict**，且注释声明"deliberately never used as a tie-breaker" | `runtime/stage/completion-predicates.mjs:201-217` |
| FACT-049 | stage outcome 信封**没有任何时间戳字段**（`stage-agent-outcome-adapter.mjs:744-765` 全字段清单无 `recorded_at`/`created_at`），而 ref 是含 `attempt_id` 的整份 JSON 哈希 → 换 attempt 必然换 ref；投影层因此无法"挑最新"，只能 fail-closed | `runtime/stage/stage-agent-outcome-adapter.mjs:744-768`；`runtime/task/task-handle.mjs:597-621` |
| FACT-050 | 契约口径明确：下游只消费同一 task/阶段/材料 revision 的**最新 completed** 阶段结果；旧失败与旧结果只读保留，修复后不阻塞同任务重跑 | `specs/archive/governance-runtime-execution-chain-20260827/spec.md:288,532` |
| FACT-051 | `missing` 的权威语义是"**没有记录**"，不是"有多条记录"；retry 不覆盖、每次产生不可变新记录 | `specs/archive/workflowhub-delivery-flow-quality-v1/plan.md:86`；`tasks.md:417` |
| FACT-052 | 真 conflict 的权威定义只覆盖"同 attempt 同字节幂等 / 异字节 `BRIDGE_REPLAY_CONFLICT`"，不覆盖多 attempt | `docs/research/workflowhub-batch-governance-inventory-20260825.md:53`；`runtime/stage/stage-agent-outcome-adapter.mjs:770-789` |
| FACT-053 | `conflict` **不在**公开 stage_status 词表里（合法值只有 `completed/skipped/incomplete/unavailable/failed`），是投影层自造的越界取值 | `runtime/stage/stage-runner.mjs:48`；`specs/archive/workflowhub-close-readiness-governance-20260906/spec.md:674` |
| FACT-054 | 真实活体案例：`workflowhub-make-decision-hardening` 的 build-spec 有 **3 个** completed 信封绑定同一 tree+material（`…-current-3/4/5`）；`workflowhub-close-readiness-governance-20260906` 的 build-code 2 个；`workflowhub-execution-acceleration-20260909` 的 make-decision 2 个；`workflowhub-execution-simplification-20260907` 的 verify-code 2 个 | 子代理 D 全仓扫描 + 实测 |
| FACT-055 | 实测 public CLI 输出与用户原话逐字一致：`quality_status=in_progress`、`quality_missing=["stage_outcome"]`，其余 predicate 全部 satisfied | 子代理 D 在 `/tmp/wh-pristine` 实测 |
| FACT-056 | 测试覆盖缺口：`tests/contract/status-derivation.test.mjs:185-227` 是唯一多 ref 用例，靠"旧 tree"被过滤才通过；把 fixture 的 `oldTree` 换成 `currentTree` 立刻 RED | 子代理 D 实测 RED |
| FACT-057 | 同一 bug 还有第二个硬判定：`stage-runner.mjs:797` 的 "exactly one current completed build-code outcome"，会让 verify-code E2E review 抛硬错误 | `runtime/stage/stage-runner.mjs:797`；`skills/wh-review/scripts/wh-review-cli.mjs:276-292` |
| FACT-058 | 影响面：`status --action=begin|repair`（主症状）、`deriveStatusGroups` 的 next_action、`product_release` 派生（假 `stage_not_completed`/`stage_predicate_missing`）、`close` 的 quality_gaps、wh-review verify-code E2E；`run --action=execute` 不受影响（只认显式单 ref） | 子代理 D G 节 |
| FACT-059 | `deriveStageOutcomeStatuses` 的 `material_revision`/`material_scope_revisions` 是**死参数**（解构后零引用），材料绑定实际只由 `authenticate` 回调兜住 | `runtime/stage/completion-predicates.mjs:480-481,487-545` |
| FACT-060 | 附带发现：main 工作树有两个未提交改动（`runtime/review/review-record-route.mjs`、`tests/review/review-record-route.test.mjs`），会让 public CLI 直接加载失败（`reviewIdentityFromInput` 未导出）；与本 bug 无关，但会挡住任何人在 main 上跑 `status`。本任务 worktree 基于 committed HEAD，干净可用 | 子代理 D 附带发现；主会话已核实 |

### 子代理 E/F/G/H/I（全局控制面调研）新增事实

| fact_id | 事实 | 证据 |
| --- | --- | --- |
| FACT-061 | **"阻塞很多"是仓库自己命名并量化过的缺陷**：close-readiness 任务已诊断"同一缺口多文本投影……'阻塞很多'观感确由重复投影放大" | `specs/archive/workflowhub-close-readiness-governance-20260906/decision-log.md:681,635` |
| FACT-062 | 该缺陷今天仍成立：`quality_gaps`/`release_gaps`/`product_release_reasons` 是**同一数组别名**（`stage-runtime.mjs:326,340,341,343,598`），且契约测试把重复固化了 | 主会话核实 |
| FACT-063 | **11 个用户可见状态字段没有一个是真的推进许可证**：`quality_missing`/`product_release_status`/`status_groups.actionable_now`/`next_action` **零消费者**；`work_release` **不存在**；`continuation_allowed` 设 false 不阻止任何事；`quality_status` 唯一分支在独立架构诊断工具 | 子代理 F B 节 |
| FACT-064 | `work_status`/`continuation_allowed` 只由四材料是否可读决定，与质量事实无关（`work_authority: current-four-materials-and-plan-tasks`） | `runtime/stage/completion-predicates.mjs:925-942` |
| FACT-065 | **死门**：`assertStageCompleted` 无生产调用者（仅测试）；`validateStageFacts`/`validatePhaseCompletion`/`buildPlanTaskContract(V2)`/`authenticatedTestSnapshotCommit`/`publishReviewFactIntent` 同样零生产调用者 | `completion-predicates.mjs:944-948`；子代理 F A-neg 节 |
| FACT-066 | **守卫静默失效**：`findingDispositions` 声明 6 参（`stage-handlers.mjs:2009`），4 个调用点全部只传 2 参（`:3252/3384/3550/3695`）→ stale 检查恒真、不可达；其负向 oracle 被 `it.skip`（`tests/final-cutover-guards.red.test.mjs` 共 21 处 skip） | 子代理 I S-1 |
| FACT-067 | **宪法审计结论**：用户的"宪法完全被忽视"**不成立**；准确说法是"宪法最核心的不阻断承诺被遵守（11 项可举证），但它自己要求的登记纪律（唯一 consumer/owner/删除条件）被系统性忽视"。真违规 2 项、登记漂移 4 项、设计取舍 4 项 | 子代理 G E 节 |
| FACT-068 | 真违规①：`core/` 兼容区承载活的生产控制面（含可拒绝全部 stage 启动的 `assertRuntimeAuthority`），6 个文件在 move-map 中无 owner/consumer/delete_condition | `AGENTS.md:37`；`CLAUDE.md:23`；`move-map.json` `excluded-not-in-T052` |
| FACT-069 | 真违规②：`quiesceRuntime`/`rebindRuntimeRoot`/`assertLegacyBridgeReadOnly` 无生产消费者，且 `AGENTS.md:59` 明令禁止 rebind | `core/runtime-mode.mjs:49,54,66` |
| FACT-070 | **规模**：38 个 schema（12 个无 loader）、65 个 runtime 模块 30,848 行、40 个 tools 模块 9,623 行、184 个测试文件 47,412 行；真实任务库 69,127 个文件，其中 `stage-outcome-proofs` **18,258**、quality facts 6,199、acceptance 6,133、identity/executions 5,606 | 子代理 E A 节 + 主会话核实 |
| FACT-071 | **零实例的声明型对象**：`e2e_binding`、`audits/**`、`risk-acceptances|risk-cards|risk-replies`、workflow-evolution 全套、`monitoring-fact.v1`、entry/exit receipts + `journal.jsonl` | 子代理 E C-5 |
| FACT-072 | **空转**：`facts.jsonl` 最新 4 个 store 均 0 行（`readTaskFacts` 被 import 但零调用）；`index.json` 的 facts/reviews/tests 三数组恒 0、`archives` 永空 | 子代理 E C-6 |
| FACT-073 | **生长模式**：事故→加一层防护（从不收紧既有那条，同类缺陷修两次：调用真实性 2026-07-14 + 2026-08-28）；删除条件普遍写成"当替代机制被经审查地取代时"（无可观测触发点）→ 永久保留；唯一可执行删除机制是反向 oracle（禁名 + `required_final: 0`），只覆盖 recovery 家族 | 子代理 I F 节 |
| FACT-074 | **删除机制确实存在且用过**：`deletions-proof.json` 记录 22 个已删文件 + 负向 oracle；`complexity-baseline.json#hard_gates` 有 forbidden_paths/forbidden_symbols + `required_final: 0` | 子代理 I D-0 |
| FACT-075 | **build-code 的完成谓词**：`risk_tests_fresh`(test)、`acceptance_criteria`、`stage_end_spec_analyze`、`finding_dispositions`、`integration_review`(review)；`integration_review` 是**唯一用户定义的实现门** | `runtime/stage/completion-predicates.mjs:94-98,104-107` |
| FACT-076 | `integration_review` 的满足条件：需要 `wh_review.v2` 来源、`fact.status === "recorded"` 的审查事实；**`unavailable` 不满足** | `completion-predicates.mjs:182-189` |
| FACT-077 | `requireFinalIntegrationReview` 本身**接受** `unavailable` 并明说"does not block stage progression"——即投影层与 handler 层对同一件事的语义不一致 | `stage-handlers.mjs:1929-1935` |
| FACT-078 | 真实 store 现状：最近两个任务的 build-code outcome 全是 `unavailable`（`workflowhub-execution-acceleration-20260909`、`workflowhub-execution-simplification-20260907`）；更早的 `workflowhub-close-readiness-governance-20260906` 有 3 个 `completed` | 主会话实测 |
| FACT-079 | **"capability proof" 不是本仓任何谓词/事实/schema**：全仓 grep（排除 specs/archive）无 `capability_proof`；`STAGE_PREDICATES["build-code"]` 不含它。它要么来自宿主/Stage Agent 自造术语，要么指向 `skill-deps.yaml` 的 `external_capabilities` 声明 | 主会话 grep + 子代理 J 已核实（F-011） |

### 不确定性与待澄清

- U-001：402 的真实来源（anysearch 匿名限流？宿主侧额度？）——子代理 C 压测中。
- U-002：`web_search` / `web_fetch` 作为 Stage Agent 的可用性边界（DSH 宿主有，外部宿主不一定有）。
- U-003：新 handoff 技能是否需要登记新的 `consumer.target`（白名单之外的 target 会被 runtime 直接拒绝）。
- U-004：`muyu-search-mcp` 是否还存在于用户环境（历史 m13 规格里的另一条调研通道）。

## 非目标

1. 不改仓库外 `~/.claude/skills/handoff` 与 `receive-handoff`。
2. 不新增 stage、不新增质量门、不改四份材料既有 schema、不引入新状态机/ledger/投影。
3. 本阶段不做 commit/push/merge/archive/cleanup/close。
4. verify-code 的 handoff 不在本轮（DEFER-001）。
5. 不把 `capability proof` 升格为 build-code 谓词。
6. 不做"自动补写缺失事实"的兜底。

（与 `acceptance-draft.md` §4 同源；以本表为准。）

## 决定

决定区按需求框架的方案模块使用 `### <module>` 分组；每组内按
`需求/question → facts/constraints → option → decision → feature/consumer → acceptance`
链序排列。跨模块依赖写 `D-ID + derived_from`，根决定写 `derived_from: []`。

### 模块 A：外部调研链路（D1/D2/D3）

```text
module: research-chain
requirement_ids: [R-001, R-002, R-014, R-015]
derived_from: []
artifacts: [spec.md#FR-RESEARCH]
```

#### D-001 调研产物落点与事实路由
- requirement_ids: [R-001, R-002, R-014, R-015]
- question/final_option: deep-research 要求的 `research-report.v1` 该落在哪、怎么被 runtime 承认？
- recommendation/plain_language: 报告写 `quality/evidence/research/<sha256>.json`（内容寻址，sha256 = 报告原始 canonical JSON 字节），并给 research 一条独立的、被承认的事实路由；不再借用"测试回执"契约。
- decision: 采纳 Q9=A。`quality/evidence/research/` 用既有 `TaskKernel.publishCanonicalRecord`（vNext 只要求 `quality/` 前缀，`runtime/task/task-kernel-implementation.mjs:687-710` 已允许）；research 事实不再硬编码进 `quality/tests/`（`runtime/stage/stage-handlers.mjs:154`），也不再套 `testFacts` 的 command/exit_code 契约（`:699-727`）。
- source_type/reference/exact_excerpt: 代码证据 `stage-handlers.mjs:154,693,699-727`；`task-kernel-implementation.mjs:971`（`completeMakeDecisionResearch` = unsupported）；`skills/deep-research/SKILL.md:46-74`。
- approval_binding: 用户 Talk R1 Q9=A + Talk R2 R2-Q6 同意非目标。
- facts_and_constraints: 本任务已实测写出 `quality/evidence/research/400fb7c4….json`（31 sources / 14 evidence），证明路径可写；但当前没有任何 runtime reader 承认它。
- Logic: 报告无处可放（现状）→ 研究无法成为事实 → 给独立命名空间与事实 kind → 报告可被 spec-analyze 与阶段末披露消费。
- choice_reason/impact: 比"继续塞进 quality/tests/"简单且语义正确；比"新增研究发布写入器"少一个控制面（复用 `publishCanonicalRecord`）。
- consequences_and_risks: 需要改 `stage-handlers.mjs` 的 NAMESPACE 与 research receipt 校验分支；若实现不当可能让 research 事实绕过现有认证——必须在当前 stage 补回归测试。
- rejected_alternatives: ① 保持 `quality/tests/` 硬塞测试回执（要伪造 command/exit_code，违反 F9）；② 两处都写（两套真相）；③ 新增 `completeMakeDecisionResearch` 专用写入器（F11 反例）。
- unresolved_items/owner: 未决项 OPEN-001 的 owner=**build-spec**（承接阶段）；本决定自身 owner=make-decision（已在本 stage 闭合）。
- feature/consumer: `research-report.v1` 事实 → spec-analyze 与阶段末披露；acceptance: AC1。
- replacement/delete: **替代关系**=替代原先借用 `quality/tests/` 测试回执路径的做法；**删除条件**=当 research 事实改由其它已登记命名空间承载、且现有 reader 全部迁移并验证后删除 `quality/evidence/research/`；深度校验只做最小结构校验（字段存在 + hash 一致），不构成推进 gate。
- Supersedes: 无。

#### D-002 调研的"完成度"不进完成判据，但必须可见
- requirement_ids: [R-001, R-014, R-015]
- question/final_option: 调研要不要变成质量门？
- recommendation/plain_language: 不加门。调研该做却没做、做得不彻底，只在阶段末**如实显示为缺口与待补问题**，不影响阶段能否完成。
- decision: 采纳 Q1=A + Q8=A。`research` 继续**不在** `STAGE_PREDICATES`；新增的是"调研事实 + 缺口披露"，不是新谓词、不是新 gate。披露必须由 D-001 的机器可读事实生成，而不是自由文本。
- source_type/reference/exact_excerpt: `runtime/stage/completion-predicates.mjs:69-81`（无 research）；`tests/contract/stage-completion.test.mjs:36`（断言必须无 research）；宪法 F11「辅助事实缺失不得单独阻止正常工作」。
- approval_binding: 用户 Talk R1 Q1=A、Q8=A。
- facts_and_constraints: 现状"跳过成本=一句非空 reason"（`stage-runner.mjs:47,186-190`），fixture 把"本决定无需新增调研。"固化为合规。
- Logic: 无强制力（现状）→ 但完全不管会复发 → 改为"可见但不阻断" → 用户能看见风险且不卡流程。
- choice_reason/impact: 与宪法一致；代价是仍需人工判断"该不该调研"，机器无法裁决。
- consequences_and_risks: 若披露只是文字义务，可能再次被一句"无需调研"糊过去。
- rejected_alternatives: ① 把 research 加进完成判据（与宪法冲突）；② 只修产物落点不加披露（没人看照样白搭）。
- unresolved_items/owner: 未决项 OPEN-008 的 owner=build-spec；本决定自身 owner=make-decision（已在本 stage 闭合）。
- feature/consumer: 阶段末六项摘要的"剩余风险/未决"栏；acceptance: AC2。
- Supersedes: 无。

#### D-003 anysearch 失败语义与兜底降级
- requirement_ids: [R-001, R-002, R-014, R-015]
- question/final_option: anysearch 挂了怎么继续做外部调研？
- recommendation/plain_language: anysearch 仍是首选；失败时**先重试一次**，仍失败就**问一次用户**再降级到宿主 `web_search`/`web_fetch`，并把降级事实留痕；工具用法错误（如 `batch_search` 超过 5 条）与"技能不可用"必须区分。
- decision: 采纳 Q2=B + R2-Q2=B，并补齐审查意见：统一失败回执（保留 HTTP 状态、区分 TLS 黑障/超时/HTTP 状态/配额/用法错误）、单次与总时限；`web_search` **与** `web_fetch` 一并登记进 `skills/deep-research/SKILL.md` 工具路由表。
- source_type/reference/exact_excerpt: 实测 57 次调用 402 出现 0 次、真实故障为本机 TLS 黑障约 13 分钟；`skills/anysearch/scripts/anysearch_cli.js:59-65,79-81,101-106`（非 JSON 时丢状态码、统一 exit 1、无重试、无代理）；`skills/deep-research/SKILL.md:26,96` 只点名 anysearch + web_fetch。
- approval_binding: 用户 Talk R1 Q2=B、Talk R2 R2-Q2=B、R2-Q3=A（handoff 落点，与本决定的降级目标路径无关但同轮确认）；Talk R3 续 T3-Q4=B 只影响死门/守卫处置，不改变本决定。
- facts_and_constraints: 本机无 `ANYSEARCH_API_KEY`、无 `runtime.conf`（匿名低配额）；磁盘上有可用 key 但仓库副本读不到；`batch_search` 上限 5 条。
- Logic: 402/黑障不可区分（现状）→ 分类 + 重试 + 用户批准的降级 → 调研不再"整段做不了"。
- choice_reason/impact: 比"自动静默降级"多一次用户确认，符合用户"降级前先问"的选择；比"只修 anysearch"多一条真兜底。
- consequences_and_risks: 用户不在场时降级会卡住——必须在同 stage 记录"等待用户批准"并允许继续其它工作；降级结果质量弱于 anysearch，需在报告里标注工具来源。
- rejected_alternatives: ① 自动降级不问（用户已否决）；② 只登记 web_search 不登记 web_fetch（审查指出的遗漏）；③ 把 muyu-search-mcp 当兜底（本机四环境变量全缺）。
- unresolved_items/owner: 未决项 OPEN-002 的 owner=build-spec；本决定自身 owner=make-decision（已在本 stage 闭合）。
- feature/consumer: deep-research 工具路由表 + anysearch 调用壳；acceptance: AC3。
- Supersedes: 无。

### 模块 B：stage 交接阻塞与完成语义（D4/D5/D6）

#### D-004 冲突判据从"数量"改为"身份矛盾"
- derived_from: []
- requirement_ids: [R-013, R-016, R-018]
- question/final_option: 同一 stage 的多个 authenticated completed outcome 该算冲突吗？
- recommendation/plain_language: 不算。同一 task+stage+当前 snapshot+当前材料下，多个 completed attempt 内容等价，**任意一个都满足完成**；真冲突有两类：① 同一 attempt_id 出现异字节；② 不同 attempt 的语义签名不一致（build-spec Clarify 1A）。
- decision: 采纳 T3-Q1=A。`deriveStageOutcomeStatuses` 只在同 attempt 异字节时返回 conflict；其余 ≥1 completed → completed；把"存在多个 attempt"作为只读事实披露（如 `attempt_count`），不新增 selector/successor/时间戳字段。**③ 不同 attempt 的 completed cohort 若出现多个语义签名 → public `failed` + diagnostic conflict，消费者 fail-loud、不挑 winner（build-spec Clarify 1A）。**
- source_type/reference/exact_excerpt: `runtime/stage/completion-predicates.mjs:542`（>1 即 conflict）、`:468-474`（注释把多 envelope 叫 conflict）；契约层相反：`specs/archive/governance-runtime-execution-chain-20260827/spec.md:288`「下游只消费同一 task、同一阶段和当前材料 revision 的最新 completed 阶段结果」；`specs/archive/workflowhub-delivery-flow-quality-v1/plan.md:86`「每次 stage/snapshot 产生不可变新记录，retry 不覆盖」；真 conflict 的定义已由 build-spec Clarify 1A 扩展为两类（同 attempt 异字节 / 不同 attempt 语义签名不一致）；原始诊断只定义在 `docs/research/workflowhub-batch-governance-inventory-20260825.md:53` + `runtime/stage/stage-agent-outcome-adapter.mjs:770-789`；`AGENTS.md:59` 禁 selector/successor。
- approval_binding: 用户 Talk R3 T3-Q1=A。
- facts_and_constraints: 真实 store 已有 4 个阶段出现同绑定多 completed（`workflowhub-make-decision-hardening/build-spec` 3 个、`close-readiness-governance-20260906/build-code` 2 个、`execution-acceleration-20260909/make-decision` 2 个、`execution-simplification-20260907/verify-code` 2 个）；outcome ref 含 attempt_id 且 ADR 0024 要求每次重试新 attempt_id。
- Logic: 多 attempt（合法）→ 被判 conflict（现状）→ 按身份判冲突 → 合法重试不再阻塞。
- choice_reason/impact: 不新增任何持久字段即可回答"下游怎么消费最新"——同一快照同一材料下内容等价，无需排序；跨快照场景由 `isStageSnapshotCurrent` 过滤。
- consequences_and_risks: 若未来出现"同一快照同一材料但内容语义矛盾"的 completed outcome，本决定会放行——需在 spec 明确"内容等价"判据并对真矛盾 fail-loud。**已由 build-spec Clarify 1A 拍板**：不同 attempt 语义签名不一致即 public `failed` + diagnostic conflict。
- rejected_alternatives: ① 加 `attempt_seq`/时间戳 + latest selector（新增持久字段 + 违反 AGENTS.md:59）；② 写入端同绑定去重复用旧 ref（违反 ADR 0024、抹掉 provenance）；③ 保持 exactly-one。
- unresolved_items/owner: 未决项 OPEN-003 的 owner=build-spec；本决定自身 owner=make-decision（已在本 stage 闭合）。
- feature/consumer: `status` 的 `quality_status`/`quality_missing`；acceptance: AC4。
- Supersedes: 无。

#### D-005 执行事实永不进入 missing/predicates
- derived_from: [D-004]
- requirement_ids: [R-013, R-018]
- question/final_option: `conflict`/`unavailable` 被折叠成 `stage_outcome missing` 怎么办？
- recommendation/plain_language: 执行事实（stage outcome 状态）不再冒充"缺失的质量谓词"；它有自己的标签，缺口归因也正确。
- decision: 采纳 R2-Q5=C + T3-Q2=A。`deriveStageCompletion` 的 `missing`/`predicates` 只能由 `STAGE_PREDICATES` 与条件谓词构成；`stage_outcome` 从**谓词命名空间**移出，改为同一 `status` 投影内的独立披露字段 `execution_outcome{status,blocking:false}`（**不新增投影对象、不新增持久文件、不新增控制面**，只是把原本被错误塞进 predicates 的执行事实放回它自己的字段），`unavailable` 落 `external_unavailable` 而非 `actionable_now`；同时修 `selectLatestTerminalObservation` 的同毫秒 tie-break（改为显式 `ambiguous` 而不是静默 conflict）。
- source_type/reference/exact_excerpt: `runtime/stage/completion-predicates.mjs:311-312`、`:320-326`、`:201-217`；`tools/cli/stage-runtime.mjs:313-325`（无 fact 的 subject 落 `actionable_now`）。
- approval_binding: 用户 Talk R2 R2-Q5=C、Talk R3 T3-Q2=A。
- facts_and_constraints: 实测 build-code 在 `stage_outcome_status=unavailable` 时 `next_action="stage_outcome"`，而真实缺口是外部宿主未提交——归因错误。
- Logic: 折叠（现状）→ 用户看到假 missing 与错的下一个动作 → 分离执行事实与质量谓词 → 缺口真实且归因正确。
- choice_reason/impact: 纯投影层改动，不新增对象；比"只改标签"更彻底（同时修正分组归因）。
- consequences_and_risks: 不能单独把 conflict 判成 satisfied（会让 `quality_status` 直接变 completed，等于假绿）——本决定只做"移出谓词命名空间"，不放宽任何真实谓词。
- rejected_alternatives: ① 只把 conflict 翻成 satisfied（F9 假绿）；② 保持现状。
- feature/consumer: `status` 的 `execution_outcome` 与 `status_groups`；acceptance: AC5。
- unresolved_items/owner: `execution_outcome` 字段形状与 `ambiguous` 取值由 build-spec 定稿（owner=build-spec，见 OPEN-007）。
- Supersedes: 无。

#### D-006 build-code 三项缺口的处理
- derived_from: [D-005]
- requirement_ids: [R-017, R-018]
- question/final_option: build-code 的 authenticated stage outcome / formal integration review / capability proof 怎么处理？
- recommendation/plain_language: 三项性质不同——前两项是"真没做"或"投影标签错"，第三项**不是本仓的谓词**，明确禁止升格。
- decision: 采纳子代理 J 结论。① `stage_outcome`：谓词不放松，只修投影标签与归因（并入 D-005）；② `integration_review`：谓词**不动**（只认 `recorded`），`unavailable` 是宪法允许的完成路径但**不满足该谓词**，同时修"同一份 review 在两个派生对象里结论相反"（envelope 的 `skill_outcomes[wh-review]` 因缺宿主生命周期事件恒 unavailable，而 fact 已 recorded）；③ `capability proof`：**禁止**升格为 build-code 谓词（它是另一任务 worktree 未提交改动里的 `workflowhub-test-profile.v1` 字段，本仓无生产者）。
- source_type/reference/exact_excerpt: `runtime/stage/completion-predicates.mjs:94-98,182-190`；`runtime/stage/stage-handlers.mjs:1929-1935`（unavailable「does not block stage progression」）；`runtime/stage/stage-agent-outcome-adapter.mjs:916-947,964-968`；真实 store：m16-evolution snapshot 3429169c 的 4 项谓词全 satisfied 却因 envelope incomplete 而未达 5/5；158 个任务中**无一** build-code 达到 5/5。
- approval_binding: 用户 Talk R3 T3-Q2=A（T-021）+ R-017 追加需求。
- facts_and_constraints: 本环境 provider 可用（前三阶段有真实多 provider attempt+result），故 integration_review 属"能做没做"而非环境死锁。
- Logic: 三个缺口混在一起看（现状）→ 分类处置 → 真缺口如实显示、投影错误修正、非谓词禁止升格。
- choice_reason/impact: 不放松完成判据，同时修掉"两套投影结论相反"的真 bug。
- consequences_and_risks: envelope 的 skill 行修复涉及 `stage-agent-outcome-adapter`，改动面较窄但有回归风险。
- rejected_alternatives: ① 让 `unavailable` 满足 `integration_review` 谓词（审查两次 blocking 反对）；② 把 capability proof 加进谓词（立刻造出死谓词）。
- unresolved_items/owner: 未决项 OPEN-009 的 owner=build-spec；本决定自身 owner=make-decision（已在本 stage 闭合）。
- feature/consumer: build-code 完成判据与 envelope 投影；acceptance: AC6。
- Supersedes: 无。

### 模块 C：控制面治理与精简（D7）

#### D-007 死门、静默失效与治理登记一并修
- derived_from: []
- requirement_ids: [R-016, R-018]
- question/final_option: 控制面膨胀、死代码、静默失效、登记漂移怎么办？
- recommendation/plain_language: 删掉零调用者的死门；把静默失效的守卫修回可用；补齐宪法要求的登记；重复投影收敛成一个来源。
- decision: 采纳 R3-Q1=D + R3-Q6=A + **T3-Q4=B（取代 R3-Q4=A）** + R3-Q5=B。① 删除约 10 处零生产调用者的死门（`assertStageCompleted`、`validateStageFacts`、`validatePhaseCompletion`、`authenticatedTestSnapshotCommit` 整段等）——这部分按 T3-Q4=B 属"零调用者、无替代覆盖需求"的确定性删除；② 修 `findingDispositions` 的 6 参声明只传 2 参；③ **21 处 skip 守卫先逐条分类**（当前契约断言→恢复；已废弃旧 gate→显式退役并写替代覆盖；需未来 cutover→延后），不一次性全恢复；④ 重复投影别名收敛为一个派生源；⑤ 治理登记：core/ 兼容区活控制面补 owner/consumer/删除条件（或迁移）、删除 `quiesceRuntime`/`rebindRuntimeRoot`/`assertLegacyBridgeReadOnly`、move-map 补登 7 个漏登文件、修 `task-close` 矛盾条目；⑥ **交付可审计的控制面清单**（每个对象 → 生产者/消费者/owner/阻塞路径/保留或删除决策）。
- source_type/reference/exact_excerpt: 子代理 E/F/G/H/I 报告；`CONSTITUTION.md:42,63,84,172`；`AGENTS.md:37,47,62`；`runtime/stage/stage-handlers.mjs:2009` 与 4 个只传 2 参的调用点 `:3252/3384/3550/3695`；`tests/final-cutover-guards.red.test.mjs` 21 处 `it.skip`。
- approval_binding: 用户 Talk R3 R3-Q1=D、R3-Q5=B、R3-Q6=A，以及 Talk R3 续 T3-Q4=B（**以最新的 T3-Q4=B 为准，取代 R3-Q4=A**）。
- facts_and_constraints: 删除机制存在且用过（`deletions-proof.json` 22 个已删文件 + `complexity-baseline.json` 反向 oracle）；38 个 schema 中 12 个无 loader；`facts.jsonl` 最新 4 个 store 全 0 行。
- Logic: 事故→加层、层不退役（现状）→ 逐项分类处置 + 交付清单 → 成本可见、可审计、可继续退役。
- choice_reason/impact: 符合用户"不但增加维护成本，而且违反宪法"的判断；把"删/留"决策写成可审计清单。
- consequences_and_risks: 改动面最大，必须分期（P0/P1/P2）并只跑针对性测试；禁止全量回归（AGENTS.md 测试硬规则）。
- rejected_alternatives: ① 只删零调用者代码、不碰登记；② 一次性删 21 处 skip 守卫；③ 不碰治理债务。
- unresolved_items/owner: 未决项 OPEN-010 的 owner=build-plan；本决定自身 owner=make-decision（已在本 stage 闭合）。
- feature/consumer: 控制面清单 + 治理登记；acceptance: AC7。
- Supersedes: 无。

### 模块 D：自动复盘（D8）

#### D-008 stage-reflection 必须自动真跑
- derived_from: []
- requirement_ids: [R-018]
- question/final_option: 每 stage 结束的复盘要不要自动执行？
- recommendation/plain_language: 要。每 stage 结束时**自动复盘并记录**；不允许改成"手动可选"。
- decision: 采纳 T3-Q3=A（用户明确反驳"改为手动等于永远不执行"）。给生产路径注入 `stageReflectionExecutor`（现状只在测试注入，`tools/cli/stage-runtime.mjs:437-443`），使五个 stage 的 `on_stage_end` 自动产出并发布 reflection；必须带超时与失败隔离，失败记 `failed`/`unavailable` 且**不阻断** stage 完成（保持 `blocking:false`）。
- source_type/reference/exact_excerpt: `runtime/stage/stage-runner.mjs:1021`、`:2127-2131`、`:2145-2154`；`CONTEXT.md:37-44`；`docs/adr/0023`。
- approval_binding: 用户 Talk R3 T3-Q3=A 原文反驳。
- facts_and_constraints: `quality/stage-reflection/` 已有 51 个实例（多来自手动/历史导入）；真实 store 里自动路径恒 unavailable。
- Logic: 无 executor（现状）→ 自动路径恒不执行 → 注入生产 executor + 失败隔离 → 每 stage 真复盘。
- choice_reason/impact: 满足用户"自动复盘并记录"的硬要求；代价是阶段末多一个可能失败的动作，故必须非阻断 + 超时。
- consequences_and_risks: 若 executor 依赖模型调用，会引入 token 成本与延迟；必须设超时并把超时记为 `unavailable`。
- rejected_alternatives: ① 改为手动可选（用户明确否决）；② 保持现状。
- unresolved_items/owner: 未决项 OPEN-004 的 owner=build-plan；本决定自身 owner=make-decision（已在本 stage 闭合）。
- feature/consumer: 五个 stage 的 `on_stage_end` 自动复盘；acceptance: AC8。
- Supersedes: 无。

### 模块 E：新 handoff 技能（D9）

#### D-009 `stage-handoff` 技能与自动调用
- derived_from: [D-008]
- requirement_ids: [R-003, R-004, R-005, R-006, R-007, R-019, R-020]
- question/final_option: 新 handoff 技能叫什么、放哪、怎么自动调用、写什么？
- recommendation/plain_language: 新增仓库内技能 `stage-handoff`；四个作者阶段在 stage 最末（reflection 之后）自动生成一份**只读交接包**，落在 taskPath 的 `quality/evidence/handoff/<stage>.md`；阶段末大白话总结**必须打印完整路径**。
- decision: 采纳 Q3=A + Q4=A+扩展 + Q5=A（经 T3-Q5 修正为 reflection 之后）+ Q6=B + Q7=B + R2-Q3=A + R2-Q4=A + G1:A + G2:B + G3:A + G4:A + G5:A + R-020 + **T3-Q6=B** + **T3-Q7=A**。具体：
  1. 技能名 `stage-handoff`，定位=只读交接产物，不替代"下游交接"（四份材料仍是唯一正式事实）、不替代"用户完成卡"（`CONTEXT.md:319`）。
  2. 落点 `<taskPath>/quality/evidence/handoff/<stage>.md`，稳定文件名、原子写；taskPath 在 worktree 之外。**本条的“保留旧版本”已被 build-spec 阶段用户 Clarify 2B 取代**：每次成功生成原子覆盖、不保留历史版本（见 `spec.md` Clarify 2B）。
  3. **自动调用（T3-Q6=B 修正）**：不新增 `steps.json` 节点。`stage-handoff` 作为 **stage-reflection hook 的产物之一**，在同一 `on_stage_end` hook 内、reflection 发布之后执行；因此天然拿到复盘结论，且不占用/不新增第二个 hook，也不改变五阶段拓扑。
  4. 覆盖范围：make-decision / build-spec / build-plan / build-code 四个作者阶段；verify-code 不在本轮范围（Q6=B，登记为非目标 DEFER-001）。
  5. 内容=13 个固定区块，只做索引+结论+指针，不复述材料正文：任务身份 / 背景与目标 / 当前阶段与进度（含每步证据路径）/ 重要决策 / 核心方案 / 踩过的坑 / 重要参考调研（报告路径+hash+关键结论）/ 关键事实与数据状态 / 成功与失败边界 / 未决项与风险 / 下一步动作 / 待读文件清单 / 可自行判断与必须问用户的边界。
  6. 发现契约：**只靠用户手动贴路径**（G2=B），不做自动读取、不改四份材料结构。
  7. 失败语义：写失败记 `unavailable` 并在阶段末通告"未生成 + 原因"，**不阻断** stage 完成（G5=A）；reflection 自身失败时 handoff 仍尝试生成，并在文件中标注 reflection 不可用。
  8. 阶段末大白话总结必须包含 handoff 文件的完整绝对路径（R-020）。
  9. **验收颗粒度（T3-Q7=A）**：make-decision 负责把需求边界、用户流程、数据状态、成功/失败边界、AC 通过判据锁死到"可验收"颗粒度（见 `specs/<task-id>/acceptance-draft.md`）；具体字段名、时限数值、schema 细节属实现参数，留 build-spec，但**每一项都必须在验收文档里有明确 owner 与退出条件**。
- source_type/reference/exact_excerpt: `workflows/make-decision/steps.json:18`（`on_stage_end` 已被 stage-reflection 占用）；`runtime/stage/stage-runner.mjs:1021,2127-2129`；`runtime/stage/stage-skill-runtime.mjs:10-25`（14 个白名单 consumer）；`docs/adr/0005-deterministic-task-directory.md:57`；旧 handoff 证据 `~/.claude/skills/handoff/SKILL.md:10-53`、`~/.claude/skills/receive-handoff/SKILL.md:29-76,109-113`。
- approval_binding: 用户 Talk R1 Q3-Q7、Talk R2 R2-Q3/Q4、Talk R3 T3-Q5、Grill G1-G5、R-020。
- facts_and_constraints: 现有 149 个 handoff 文件都在仓库外且与 taskPath 不重合；四份材料在 worktree 内，taskPath 在外；`build-plan/SKILL.md:246-247` 明确"Do not add a handoff field or a second record"。
- Logic: 旧 handoff 太薄（现状）→ 新会话只剩四份材料 → 结构化交接包 + 稳定落点 + 路径通告 → 新会话可直接续接。
- choice_reason/impact: 轻量落地（不进白名单 consumer 体系）避免动核心；代价是"是否真写了"少一层机器校验。
- consequences_and_risks: ① 若做成"第二事实源"会违反 F3/Q2——所以只做索引+指针；② handoff 与 reflection 同处一个 hook，任一方失败都不阻断 stage，但需保证 handoff 失败不影响 reflection 结果的发布；③ 手动贴路径依赖用户习惯。
- rejected_alternatives: ① 复用旧 `handoff` 技能名（与 `CONTEXT.md:319` 撞义）；② 全文自包含（第二事实源）；③ 自动发现读取（用户选 B）；④ 覆盖 verify-code（Q6=B 排除）；⑤ 给四份材料加 handoff 字段（`build-plan/SKILL.md:246-247` 禁止）。
- unresolved_items/owner: 未决项 OPEN-005 的 owner=**build-spec**（承接阶段）；本决定自身 owner=make-decision（已在本 stage 闭合）；**不新增 steps.json 节点**。
- feature/consumer: 下一会话/用户读 handoff；acceptance: AC9。
- replacement/delete: 替代关系=无（新增 current-view 能力）；删除条件=连续 3 个 task 的 handoff 读取方为 0（`deriveConsumptionEdges` 完整扫描 + 人工复核），或读取方改由其他机制承担时删除。
- Supersedes: 无（第 2 条的“保留旧版本”被 build-spec Clarify 2B 取代；见该条内注）。

### 模块 F：增量修订（material/UI 契约、review 预算归域、性能预算、canonical 投影纠正）

```text
module: incremental-revision
requirement_ids: [R-021, R-022, R-023, R-024]
derived_from: []
artifacts: [spec.md, plan.md, tasks.md]
```

> 本模块是 2026-09-10 的**增量修订**：不改变 D-001…D-009 已接受方向，只把已复现的新缺陷正式纳入同一任务。新增 FR/AC 编号与任务卡由 build-spec/build-plan 分配（不得由本文件臆造）。

#### D-010 material/UI producer contract（撤销 navigation 假事实）
- module: incremental-revision
- derived_from: []
- requirement_ids: [R-021]
- question/final_option: "decision-log 缺 material-navigation"是真缺陷吗？UI applicability 该怎么定？
- recommendation/plain_language: 不是。生产路径会把 `decision-log.md` 键转成 `decision-log`，packet writer 对 `decision-log` 本身不要求 material navigation；此前报错来自诊断 harness 用了错误键名。真缺陷是 UI applicability 的 writer/reader 形状冲突，必须改成结构化 producer contract。
- decision: 采纳。① **撤销**"decision-log 缺 material-navigation"这一诊断；下游 `plan.md:5,301` 与 `tasks.md:5` 的对应陈述必须在 build-plan 阶段更正，不得据此再绕过 packet；② `## UI applicability` 的三个 source 改为**结构化对象**（显式 `conclusion: non_ui` + evidence），机器结论不再依赖自然语言否定词；③ 登记该 fact 的控制面：producer=make-decision、reader=`readUiApplicabilityFromDecisionLog`/`validateUiApplicability`、consumer=final packet readiness 与五阶段 UI 判定、owner=make-decision、删除条件=被经审查的替代机制取代；④ writer 必须在落盘当下调用**与 reader 相同的** `validateUiApplicability`，不允许只在读取端校验；落盘调用点=make-decision 发布 decision-log 的 stage handler 路径（已登记在 T014 文件边界内）；若该路径最终不在本期范围，则本条降级为“仅由生产 packet 入口校验”并同步 OPEN-013。
- source_type/reference/exact_excerpt: 代码证据 `runtime/stage/stage-handlers.mjs:78-85`（生产键去 `.md`）、`runtime/task/material-workspace.mjs:134-143`（`decision-log` 免 navigation）、`runtime/stage/stage-content-contracts.mjs:508-530`（`sourceConclusion` 支持对象显式 conclusion）、`:1661-1704`（三输入合并 + declared/derived 冲突判定）。
- approval_binding: 用户 2026-09-10 增量修订答复（采纳三分法：纠正事实 + census 发现进本任务）。
- facts_and_constraints: 用正确生产键构建 packet 成功；用 `decision-log.md` 直传才得到 `decision-log.md material navigation is incomplete`。当前三个 source 是中文自由文本，reader 的英文词法规则把"无 UI 描述"里的 `UI` 当正向信号推出 `ui`，与顶层 `non_ui` 冲突并投影为 `missing`。
- Logic: harness 键名错误 → 被误判为材料缺陷 → 从真实 producer 入口复现证伪 → 修 producer 形状而非补脆弱正则。
- choice_reason/impact: 改 producer contract 比扩永久兼容正则简单且可证伪；影响 `## UI applicability` 事实形状、final packet readiness 与 UI 判定。
- consequences_and_risks: 只改本次 JSON 而不锁 writer 侧共享 validator，下次仍会写出冲突形状；source 缺失/unknown **不得**默认 `non_ui`。
- rejected_alternatives: ① 继续用自由文本 + 补更多中文正则；② 保留"navigation 缺失"结论并在 plan/tasks 里绕过 packet；③ 用手写对象代替生产 `buildStageInputPacket` 做 readiness 验证。
- unresolved_items/owner: OPEN-013（source 结构字段名与三类负例 fixture）owner=build-spec。
- feature/consumer: final packet readiness + 五阶段 UI 判定；acceptance: 新增 AC（owner=build-spec）——场景=中文"无 UI"结构化 source 重算；数据来源=decision-log `## UI applicability` JSON + 生产 packet 构建入口；通过=declared 与 derived 均为 `non_ui` 且 packet 构建成功；失败=自由文本导致 derived=`ui`/冲突，或 source 缺失仍得 `non_ui`。
- Supersedes: 无（撤销的是诊断结论，不是既有决定）。

#### D-011 review budget history 的 namespace 归域
- module: incremental-revision
- derived_from: [D-006]
- requirement_ids: [R-022]
- question/final_option: 全任务历史里存在无关坏记录时，当前 review 该不该直接返回 `REVIEW_RETRY_BUDGET_UNKNOWN`？
- recommendation/plain_language: 不该。先证明历史属于谁，再应用对应语义：无关损坏只披露、不消耗、不阻断当前 namespace；当前损坏或无法归域才 fail-closed。
- decision: 采纳三分支。① 可证明属于另一 stage/track/kind/phase/subject 的坏历史 → 保留原字节并披露 integrity unavailable，当前 runner **恰好 dispatch 一次**；② 与当前精确 identity/subject 相同的损坏 → **零 dispatch**，返回 `REVIEW_RECORD_INCOMPLETE` 并指出损坏 ref；③ 损坏严重到无法归域 → **零 dispatch**，继续 `REVIEW_RETRY_BUDGET_UNKNOWN`，不猜预算。历史坏字节只读保留，不迁移、不覆盖、不写兼容 bridge。
- source_type/reference/exact_excerpt: `runtime/review/review-record-route.mjs:428-496,541-561`（全历史校验早于 namespace 隔离）；`<taskPath>/quality/reviews/attempts/attempt-md-direction-20260909/attempt.json`、`attempt-md-detail-20260909/attempt.json`（历史 advisory 聚合，缺 `schema_version/task_id/attempt_id/snapshot_tree/material_revision/terminal_status/report_ref`）；针对性 fixture 2 passed / 46 skipped 验证坏 history 时 `runner.calls=0`。
- approval_binding: 用户 2026-09-10 增量修订答复。
- facts_and_constraints: 当前请求在 `validateReviewBudget` 与 `runRound` 之前返回 `REVIEW_RETRY_BUDGET_UNKNOWN`，provider 调用数为 0，也不会生成新的 authenticated unavailable attempt/ref。
- Logic: 严格校验本身正确 → 作用域错误让无关历史成为全局锁 → 先证归属再 fail-closed → 当前 namespace 不再被历史污染。
- choice_reason/impact: 比"放宽校验"安全、比"迁移历史"简单；影响 `FR-REVIEW-002`/`AC-REVIEW-001` 与 T005/T006 的生产文件边界。
- consequences_and_risks: "无关坏历史可继续"若被误读成"忽略所有损坏"，会把真实预算/身份问题洗成 dispatch——三分支必须各自具备 runner-count 与错误码 oracle（见 RISK-005）。
- rejected_alternatives: ① 跳过所有坏记录继续跑；② 先迁移/删除历史坏字节；③ 猜一个预算继续跑。
- unresolved_items/owner: OPEN-014（namespace 分类键与最小可读身份）owner=build-spec。
- feature/consumer: review dispatch 与预算读取；acceptance: 新增 AC（owner=build-spec）——场景=历史坏记录 + 当前请求；数据来源=canonical attempts 目录与 budget history reader；通过=无关时 runner=1、当前损坏时 runner=0 且报 `REVIEW_RECORD_INCOMPLETE`；失败=无关历史导致零 dispatch，或当前损坏仍 dispatch。
- Supersedes: 无（扩展 D-006② 的 dispatch 语义；"`integration_review` 只认 recorded"不变）。

#### D-012 性能预算：慢测与 Git spawn 放大按性能事实处理
- module: incremental-revision
- derived_from: []
- requirement_ids: [R-023]
- question/final_option: 慢测和重复 Git spawn 当死锁处理还是当性能事实处理？
- recommendation/plain_language: 当性能事实。为 authenticated identity 校验与 official fixture 建预算，减少同一 operation 内重复同步 Git spawn，但不得削弱边界校验。
- decision: 采纳 T4-Q1=**A（纳入本任务）**。① 新增**独立**性能 FR/AC 与独立 RED/GREEN 卡，不塞进既有 T003/T004 常规 gate；② 生产侧优先在**单次 authenticated operation 内**缓存已校验的 workspace identity，或把多次 getter 校验改为显式边界/批次校验；跨 operation、身份变化与写入边界**必须重新校验**；③ 测试侧共享一次 official fixture、对纯 payload mutation 做表驱动，并把 execution seam 的相同语义断言下沉到轻量 fixture；④ 为单 helper 建 Git spawn 与 wall-time oracle，"upstream outcome 非 current 仍可运行"保留精确 `-t` 回归，建议 60 秒硬上限。
- source_type/reference/exact_excerpt: `tests/contract/acceptance-execution-tier.test.mjs` 整文件 180 秒后人工终止 exit 130（该运行保持 `unknown`，不得写成 failed）；单 `runOfficialBrowserAcceptance()` 约 12–13.5 秒、上游 seed case 约 54.8 秒、调试观察约 796 次 Git child process；`runtime/task/workspace.mjs:349-370`（`worktreeRoot` getter 每次读取都 `validate()`）、`runtime/task/task-kernel-implementation.mjs:526-558`。
- approval_binding: 用户 2026-09-10 Talk T4-Q1=**A**。
- facts_and_constraints: 不是 import/collection 阻塞、锁等待、无限循环或退出句柄泄漏；同一完整 fixture 被普通场景、verify 场景与约 18 个 mutation case 重复至少 20 次。
- Logic: 整文件超时（现象）→ 先证伪死锁 → 定位重复 full fixture + 同步 Git spawn → 建预算与 oracle → 反馈环回到可接受区间。
- choice_reason/impact: 纳入本任务可避免未来重复阻塞；代价是多一张卡，且必须防止"为提速削弱身份校验"。
- consequences_and_risks: 缓存过久会漏掉身份变化 → 缓存严格限于单 authenticated operation，并保留 mutation/identity-change 负例（见 RISK-006）。
- rejected_alternatives: ① 把整文件塞进常规 gate（稳定制造四分钟以上反馈环）；② 只登记为覆盖限制（本任务继续被拖慢）；③ 删除 worktree identity/snapshot 校验换速度。
- unresolved_items/owner: OPEN-015（性能预算数值与 spawn / wall-time oracle 形式）owner=build-plan。
- feature/consumer: authenticated workspace identity 校验与 official fixture；acceptance: 新增 AC（owner=build-spec）——场景=重复执行同一 authenticated operation 与完整 fixture；数据来源=Git spawn 计数与 wall-time 测量；通过=单 fixture 的 wall-time 与 spawn 次数落在预算内且身份变化负例仍 fail-loud；失败=超预算，或提速后身份/快照校验被跳过。
- Supersedes: 无。

#### D-013 canonical 投影机制纠正与 verify publisher 缺口
- module: incremental-revision
- derived_from: [D-007]
- requirement_ids: [R-024]
- question/final_option: 外部根因文档"根因 A：producer 绕过 canonical writer 导致 index/facts 空 → missing/unknown"成立吗？`quality/verify.json` 永久 unknown 怎么办？
- recommendation/plain_language: 根因 A 不成立。状态与完成度**不读** `index.json`、**不读** `facts.jsonl`，它们为空不造成任何 missing 谓词。真断点是 `quality/verify.json` 没有生产 publisher，且 `publishVerifySummary` 缺少 canonical-root guard。
- decision: 采纳。① 登记"根因 A 机制证伪"，**禁止**按该机制给 `index.json.facts`/`facts.jsonl` 补写（二者当前无状态消费者，补写属新增控制面，违反 D-007 与 `NG-002`）；② `quality/verify.json` 是既有 per-AC 权威（`completion-predicates.mjs:820` 读它），**补生产 publisher** 并纳入 D-007 的控制面清单逐项处置，**不退役**；③ 给 `publishVerifySummary` 补 canonical-root guard 或删除，消除可写进 canonical task root 的第二 writer；④ 登记 CLI gap 归并（T4-Q2=**A**）：`quality_gaps` 与 `release_gaps` 是同一数组对象，须按 root cause 归并后展示。
- source_type/reference/exact_excerpt: `tools/cli/stage-runtime.mjs:246,261`（status 走目录扫描）、`runtime/task/task-handle.mjs:678-700`（`readdirSync` 取 quality fact refs）、`runtime/stage/completion-predicates.mjs:820`（按字节读 verify）、`runtime/evidence/quality-store.mjs:77-79`（canonical task root 直接抛错）、`:238-244`（`publishVerifySummary` 无 guard）、`tools/cli/stage-runtime.mjs:326,341`（同一数组对象）。
- approval_binding: 用户 2026-09-10 增量修订答复 + Talk T4-Q2=**A**、T4-Q3=**A**。
- facts_and_constraints: `readTaskIndex` 仅出现在 `task-store.mjs`/`quality-store.mjs`；`facts.jsonl` 仅 `core/task-close.mjs` 读且只承载 protocol-error trace；`publishVerifySummary` 全仓（排除 tests）仅定义无调用；`quality/verify.json` 除初始化 `task-store.mjs:261-262` 外无人可写。
- Logic: 症状真实（index/facts 空、verify unknown）→ 外部文档给出错误因果箭头 → 按真实 reader 链复现证伪 → 修真断点（publisher / 第二 writer）而非新增无消费者写入。
- choice_reason/impact: 避免把一个错误机制写进实现；影响 D-007 清单、verify 投影与 CLI gap 展示。
- consequences_and_risks: 若照原文档实施，会给 index/facts 增加无人读取的写入，形成新的双写与控制面膨胀（见 RISK-007）。
- rejected_alternatives: ① 给 canonical writer 增加 index/facts 第二次写；② 直接退役 `quality/verify.json`（它在 `completion-predicates.mjs:820` 有真实 consumer）；③ 手写 JSON 把 verify 状态改绿。
- unresolved_items/owner: OPEN-016（verify publisher 实现点与 canonical guard 方案）owner=build-plan。
- feature/consumer: 控制面清单（D-007 交付物）+ verify 投影 + CLI gap 展示；acceptance: 新增 AC（owner=build-spec）——场景=发布一份 verify 摘要 / 一个根因触发多条 gap；数据来源=canonical task root 与 CLI status 输出；通过=verify 摘要经唯一 writer 写入且状态可读、同一根因默认只显示一次；失败=出现能写 canonical root 的第二 writer，或 index/facts 被补成第二权威。
- Supersedes: 无。

### 增量诊断事实与纠正（2026-09-10）

| 事实 | 原主张（来源） | 核实结论 | 证据 | 处置 |
| --- | --- | --- | --- | --- |
| NAV-FALSE | `decision-log.md` 缺 material-navigation 合同（`plan.md:5,301`、`tasks.md:5`） | **证伪**：生产路径把键去 `.md`，`decision-log` 免 navigation；报错来自诊断 harness 键名错误 | `stage-handlers.mjs:78-85`、`material-workspace.mjs:134-143` | D-010；**已于 build-plan 阶段更正**：`plan.md:5`、`tasks.md:5` 现为 `recorded` 并注明 harness 键名错误 |
| UI-SHAPE | UI applicability 三个 source 形状不符 reader | **成立**：中文自由文本被英文词法规则推成 `ui`，与顶层 `non_ui` 冲突并投影为 `missing` | `stage-content-contracts.mjs:508-530,1661-1704` | D-010；本文件 `## UI applicability` 已改为结构化 source |
| RC-A-MECH | 外部根因文档：producer 绕过 canonical writer → index/facts 空 → `missing`/`unknown` | **机制证伪**：status/completion 不读 `index.json`、不读 `facts.jsonl` | `stage-runtime.mjs:246,261`、`task-handle.mjs:678-700`、`completion-predicates.mjs:820` | D-013 |
| VERIFY-PUB | （外部文档未提）verify.json 永久 `unknown` | **成立**：`publishVerifySummary` 零生产调用者 | `quality-store.mjs:238`、`task-store.mjs:261-262` | D-013 |
| SECOND-WRITER | （外部文档未提）可写 canonical task root 的第二 writer | **成立**：`publishVerifySummary` 缺 canonical-root guard | `quality-store.mjs:77-79` vs `:238-244` | D-013 |
| GAP-ALIAS | （外部文档低估）一个根因被复制成多条红字 | **成立**：`quality_gaps` 与 `release_gaps` 是同一数组对象 | `stage-runtime.mjs:326,341` | D-013 |

## UI applicability

```json
{
  "result": "non_ui",
  "sources": {
    "raw_requirement": {
      "conclusion": "non_ui",
      "evidence": "R-001…R-024 全部是调研链路、stage 阻塞与完成语义、控制面治理、自动复盘、handoff 与三项增量修复的请求；无一条提出页面、交互或前端需求。"
    },
    "project_inventory": {
      "conclusion": "non_ui",
      "evidence": "workflowhub 是面向命令行 AI 助手的编排工具；仓库无页面路由或前端技术栈，交互面为 CLI 输出与文件产物。"
    },
    "planned_or_changed_frontend_fact": {
      "conclusion": "non_ui",
      "evidence": "本任务改动集中在 runtime/、tools/cli/、skills/、workflows/ 与 taskPath 产物（含新增性能预算与 canonical publisher 修复），不涉及任何前端文件。"
    }
  }
}
```

三输入均以显式 `conclusion` 声明 `non_ui`（2026-09-10 增量修订改为结构化 source：此前自由文本会让 reader 的英文词法规则把"无 UI 描述"里的 `UI` 当正向信号推出 `ui`，与顶层 `non_ui` 冲突并投影为 `missing`），因此不触发 F7 的 UI 设计确认。若后续 spec/plan 引入前端改动，需按同一三输入规则重算。

## 收敛检查

| 维度 | 用户答案 | 材料/事实引用 | 可执行验收 |
| --- | --- | --- | --- |
| 目标 | 用户 2026-09-10 确认增量方向：把已复现的三项缺陷与机制纠正纳入同一任务，不拆成多个后续小任务 | R-021…R-024、D-010…D-013、decision-log.md#模块F | 场景=同一任务内继续修复；数据来源=四材料可读 + taskPath 事实；通过=每条增量决定都有 owner/consumer/删除条件；失败=把修复推给未登记的新任务 |
| 范围 | 用户 2026-09-10 选择：性能修复纳入本任务、CLI 根因归并纳入本任务、verify publisher 补写并纳入 D-007 清单 | R-023、R-024、D-012、D-013 | 场景=本任务新增三类工作；数据来源=Talk T4-Q1/Q2/Q3 答复；通过=三类工作各有独立卡与 oracle；失败=把其中任一项静默留给后续任务 |
| 方案 | 用户 2026-09-10 选择结构化 source + 三分支归域 + 单 operation 缓存；取舍=改动面变大换取不再被慢测与假红字拖住；被拒方案=按外部文档给 index/facts 补写、跳过所有坏历史、删除身份校验换速度；未决项=OPEN-013…OPEN-016 均有 owner 与退出条件 | D-010…D-013、拒绝方案表、未决项表 | 场景=增量实现；数据来源=decision-log 决定区与未决项表；通过=每条决定都写了取舍、被拒方案与未决项处置；失败=只写结论不写取舍 |
| 验收 | 用户 2026-09-10 确认判据方向由本 stage 锁定、字段细节留 build-spec | D-010…D-013 的 feature/consumer 行 | 场景=逐项验收；数据来源=生产 reader/packet/CLI 输出；通过=每项通过条件明确（declared=derived=non_ui、无关历史 runner=1、预算内）；失败=任一负例未覆盖 |

### 需求 → 决定 → 验收 覆盖矩阵（R-001…R-024）

| 需求 | 决定 | 验收 | 说明 |
| --- | --- | --- | --- |
| R-001 调研不彻底 + anysearch/402 | D-001/D-002/D-003 | AC1/AC2/AC3 | 产物落点、缺口披露、失败分类与兜底 |
| R-002 外部深度调研兜底 | D-003 | AC3 | anysearch 优先 → 重试一次 → 用户批准 → web_search/web_fetch |
| R-003 旧 handoff 信息失真 | D-009 | AC9 | 13 区块 + 只做索引/结论/指针 |
| R-004 新技能放 workflowhub 内部 | D-009 | AC9 | `skills/stage-handoff/` |
| R-005 每 stage 结束自动调用 | D-009 | AC9 | 作为 reflection hook 产物，不新增 steps.json 节点 |
| R-006 落 taskPath 项目文件夹 | D-009 | AC9 | `<taskPath>/quality/evidence/handoff/<stage>.md` |
| R-007 stage 结尾通告路径 | D-009 + R-020 | AC9 | 六项摘要必须含完整绝对路径 |
| R-008 按标准流程、不跳阶段 | 过程约束（不设 AC） | 可观察判据：steps.json 顺序与实际执行记录一致 | owner=主会话；不设 AC |
| R-009 不依赖 build-spec 补需求 | T3-Q7=A | AC1–AC9 | 需求边界/流程/状态/边界锁在 make-decision |
| R-010 梳理用户流程/页面范围/数据状态/边界/非目标/延期 | acceptance-draft §1/§1b/§2/§3/§4/§7 | AC1–AC9 | 全部在验收文档里 |
| R-011 主会话上下文控制 + 子代理派发 | 过程约束（不设 AC） | 可观察判据：重读型动作均有子代理执行证据 | owner=主会话；不设 AC |
| R-012 Talk/Grill 用大白话讲选项后果风险 | 过程约束（不设 AC） | 可观察判据：每轮 Talk/Grill 的每个选项含含义/后果/风险 | owner=主会话；不设 AC |
| R-013 stage 切换阻塞 | D-004/D-005 | AC4/AC5 | 冲突判据改为身份矛盾；执行事实移出谓词 |
| R-014 Talk R1 方向选择 | D-001…D-009 | AC1–AC9 | Q1–Q9 |
| R-015 Talk R2 方向选择 | D-001…D-009 | AC1–AC9 | R2-Q1…Q7 |
| R-016 控制面为何阻塞/是否违宪 | D-007 | AC7 | 清单 + 死门 + 静默失效 + 登记 |
| R-017 build-code 三项缺口 | D-006 | AC6 | 分类处置 + 禁止升格 capability proof |
| R-018 Talk R3 方向选择 | D-004…D-008 | AC4–AC8 | T3-Q1…Q7 |
| R-019 Grill 方向选择 | D-009 | AC9 | G1–G5 |
| R-020 阶段末必须给 handoff 路径 | D-009 | AC9 | 硬性验收项 |
| R-021 material/UI 契约纠正 | D-010 | 新增 AC（owner=build-spec） | 撤销 navigation 假事实 + 结构化 UI source + writer 侧共享 validator |
| R-022 review budget 归域 | D-011 | 新增 AC（owner=build-spec） | 三分支：无关=dispatch 一次、当前损坏=零 dispatch、不可归域=budget unknown |
| R-023 慢测/性能预算 | D-012 | 新增 AC（owner=build-spec） | 独立 RED/GREEN 卡；Git spawn 与 wall-time oracle；不削弱身份校验 |
| R-024 机制纠正与 census 发现 | D-013 | 新增 AC（owner=build-spec） | 禁止 index/facts 补写；verify publisher + canonical guard；CLI 根因归并 |

## 三轮 talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 | R1-Q1 调研要不要变硬（A 只做缺口披露 / B 半强制 / C 真强制） | C 与宪法冲突；A 可能治不了病 | **A** | 无 | 用户 2026-09-09 Talk R1 回复 |
| T-002 | R1-Q2 兜底顺序（A 双通道并行 / B anysearch 优先再降级 / C 只修 anysearch） | A 多花额度；C 会复发 | **B** | 无 | 同上 |
| T-003 | R1-Q3 新技能与旧 handoff 关系（A 新技能权威 / B 替换 / C 并存） | B 动仓库外技能风险高；C 易用错 | **A** | 无 | 同上 |
| T-004 | R1-Q4 handoff 厚度（A 结构化+指针 / B 尽量全 / C 保持薄） | B 变第二事实源且烧上下文；C 等于没改 | **A + 扩展**（加重要决策/核心方案/踩的坑/重要参考调研） | 13 区块定稿 | 同上 |
| T-005 | R1-Q5 自动调用点（A publish 后 reflection 前 / B publish 处 / C 手动） | A 信息最全；B 缺反思；C 原痛点 | **A**（后经 T-014 修正为 reflection 之后） | 见 T-014 | 同上 |
| T-006 | R1-Q6 覆盖范围（A 五阶段 / B 四作者阶段 / C 试点） | B 漏 verify-code | **B** | verify-code 登记为非目标 | 同上 |
| T-007 | R1-Q7 是否走正式 skill 注册（A 正式 / B 轻量 / C 先 A 再减） | A 改动面大；B 机器校验弱 | **B** | 不进白名单 consumer 体系 | 同上 |
| T-008 | R1-Q8 调研是否进完成判据（A 不进 / B 进 / C 只修落点） | B 违宪；C 没人看 | **A** | 无 | 同上 |
| T-009 | R1-Q9 研究报告落点（A `quality/evidence/research/` / B `quality/tests/` / C 两处） | B 伪造回执；C 两套真相 | **A** | 无 | 同上 |
| T-010 | R2-Q1 交付边界（A 三块一起 / B 前置修复 / C 只诊断） | — | **A** | 无 | 用户 2026-09-09 Talk R2 回复 |
| T-011 | R2-Q2 降级是否每次问（A 自动 / B 先问 / C 先重试再自动） | 用户不在场会卡住 | **B** | 无 | 同上 |
| T-012 | R2-Q3/Q4 handoff 落点与是否桥接旧目录 | — | **A / A** | 只落 taskPath | 同上 |
| T-013 | R2-Q5 阻塞修复边界（A 只修误判 / B 再修折叠 / C 再修 tie-break） | B 是必须的 | **C** | 无 | 同上 |
| T-014 | R3-Q1 交付边界（A 只修阻断 / B +清死代码 / C +治理登记 / D C+reflection 二选一） | D 改动面最大 | **D** | 五模块交付 | 用户 2026-09-09 Talk R3 回复 |
| T-015 | R3-Q2 reflection 处置（A 接 executor / B 撤声明 / C 保持） | — | **A**（经 T-020 重申） | 无 | 同上 |
| T-016 | R3-Q3 integration_review（A 允许 unavailable / B 保持 / C 降 advisory） | A 会模糊"未做"与"完成" | **A**（经 T-021 收敛为"谓词不动、只修投影"） | 见 T-021 | 同上 |
| T-017 | R3-Q4 死门（A 删除 / B 标注 / C 不动） | — | **A** | 无 | 同上 |
| T-018 | R3-Q5 21 处 skip 守卫（A 全恢复 / B 先分类 / C 保持） | A 可能把质量门装回来 | **B** | 无 | 同上 |
| T-019 | R3-Q6 治理债务（A 一并修 / B 只记录 / C 不碰） | A 改动面大但用户要求 | **A** | 无 | 同上 |
| T-020 | T3-Q1 多个 completed attempt 如何"消费最新"（A 无需排序 / B 加 attempt_seq / C 保持 exactly-one） | B 新增持久字段；C 原痛点 | **A** | 无 | 同上 |
| T-021 | T3-Q2 integration_review 改什么（A 谓词不动只修标签 / B 改谓词 / C 降 advisory） | B 会被审查两次 blocking 反对 | **A** | 与 T-016 收敛 | 同上 |
| T-022 | T3-Q3 reflection 是否接生产 executor（A 接 / B 转手动 / C 保持） | 用户反驳："改为手动执行的话，就会变成永远不执行！我需要的是每个 stage 结束自动复盘并记录" | **A** | 无 | 同上 |
| T-023 | T3-Q4 21 处 skip 守卫（A 全恢复 / B 先分类 / C 保持） | — | **B** | 无 | 同上 |
| T-024 | T3-Q5 handoff 时机与命名（A reflection 后+稳定名+入口读取 / B reflection 前+hash 名 / C 两份） | A 含反思结论 | **A** | handoff 排在 reflection 之后 | 同上 |
| T-025 | T3-Q6 handoff 如何排在 reflection 之后（A 扩引擎为有序 hook 列表 / B 合并为 reflection hook 产物 / C 降为 reflection 之前的普通 step） | A 改核心；C 丢失复盘结论 | **B** | 不新增 steps.json 节点；handoff 由 stage-reflection hook 产出 | 用户 2026-09-09 Talk R3 续 |
| T-026 | T3-Q7 AC 颗粒度（A 锁需求边界+可验收判据 / B 连字段名数值也定 / C 只写标题） | B 变成半份 spec；C 被审查反对 | **A** | 新增 `acceptance-draft.md`（AC1–AC9） | 同上 |

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-001 | make-decision 外部调研链路（子代理 A，只读全仓诊断） | 调研无完成判据且被测试反向断言；R4 产物无合法落点；无深度校验；跳过成本一句话 | completed | D-001/D-002 |
| F-002 | anysearch 可用性与失败模式（子代理 C，57 次网络实测） | 402 零次复现；真实故障为本机 TLS 黑障；CLI 丢状态码/无重试/无代理；黑障期 web_fetch 是唯一存活通道 | completed | D-003 |
| F-003 | handoff/receive-handoff 现状测绘（子代理 B） | 6 节 + 200-350 token 指路条；receive 默认只显示 4 节且不读材料/task store；P2 查找分支永不命中 | completed | D-009 |
| F-004 | stage 切换阻塞根因（子代理 D，真实 store 复现） | 投影层把多 attempt 当多真相；conflict 被折叠成 missing；4 个阶段真实中招 | completed | D-004/D-005 |
| F-005 | 本任务调研报告（内容寻址） | `quality/evidence/research/400fb7c40c6d168c23aeb17fb6ec1cc2ec9fe80849454e624662ee43e6d713ea.json`（sha256 `400fb7c4…`，31 sources / 14 evidence，triangulation=confirmed，saturation=saturated） | completed | D-001 |
| F-006 | 控制面对象全量清单（子代理 E） | ≥40 类持久对象、38 个 schema（12 无 loader）、24 个派生投影、7 个公共命令；任务库 69,127 文件；stage-outcome-proofs 18,258 | completed | D-007 |
| F-007 | 阻断面全图（子代理 F） | 11 个用户可见状态字段无一为推进许可证；4 个零消费者；`work_release` 不存在；约 1197 处 throw 中质量事实驱动拒绝仅 4 处 | completed | D-005/D-007 |
| F-008 | 宪法合规审计（子代理 G） | "宪法完全被忽视"不成立；真违规 2 项（core/ 活控制面未登记、3 个僵尸函数）+ 登记漂移 4 项 + 设计取舍 4 项 | completed | D-007 |
| F-009 | 历史考古（子代理 I） | 事故→加层、层不退役；删除条件无触发点；守卫静默失效（6 参函数只传 2 参、21 处 skip）；删除机制存在且用过（22 个已删文件） | completed | D-007 |
| F-010 | 精简/退役设计（子代理 H） | 死门约 10 处；重复投影 4 个别名；`stage_outcome` 合成谓词可退役为独立披露字段；Option 2 单独做会假绿 | completed | D-005/D-007 |
| F-011 | build-code 三项缺口（子代理 J） | 真实缺 5 项；无死谓词；158 个任务无一达 5/5；capability proof 不是谓词；envelope 与 fact 对同一份 review 结论相反 | completed | D-006 |
| F-012 | 方向审查（wh-review direction track，8 provider 调用） | 25 条 findings（2 blocking / 19 major / 4 minor）；2 个 Grok provider `PROVIDER_HEALTH_FAILED`；4 个 provider 完成；attempt=`quality/reviews/attempts/attempt-md-direction-20260909/attempt.json` | completed（25 条按聚合规则并入 FND-001…FND-017，逐条映射见下方聚合说明） | 见审查处置 |
| F-014 | 细节审查 v1（detail track，8 provider 调用） | 33 条 findings（8 blocking / 21 major / 4 minor）；2 个 Grok 失败、6 个完成；attempt=`attempt-md-detail-20260909/attempt.json` | completed（FND-018…FND-026） | 见审查处置 |
| F-015 | 细节审查 v2（提交缺陷修正后） | 41 条 findings（1 blocking / 28 major / 12 minor）；2 个 Grok 失败、6 个完成 | completed（blocking 为 approval 矛盾，FND-021） | 见审查处置 |
| F-016 | 细节审查 v3（再次修正后） | 36 条 findings（3 blocking / 22 major / 11 minor）；2 个 Grok 失败、6 个完成 | completed（FND-027…FND-029） | 见审查处置 |
| F-017 | stage-end spec-analyze（独立子代理，lens-only） | status=**inconsistent**；29 条 finding（1 CRITICAL / 9 HIGH / 16 MEDIUM / 3 LOW）；coverage 17/20 | completed，findings 在本 stage 处置（FND-030…） | 见审查处置 |
| F-013 | research-report 的独立复核 | **merged → F-005；未决项 OPEN-011** | 已合并（终态） | D-001 |

**调研落盘事实**：本报告按 `skills/deep-research/SKILL.md` R4 的字段集写入 `quality/evidence/research/<sha256>.json`，写入后回读校验 hash 一致。
同时如实记录：该路径**不被当前 runtime 的 research 命名空间承认**（`runtime/stage/stage-handlers.mjs:154` 只认 `quality/tests/`），研究发布写入器是 `unsupported`（`runtime/task/task-kernel-implementation.mjs:971`），且 `runtime/schemas/` 中不存在 `research-report.v1` schema——这三处正是待修缺口。

## grill

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 | `handoff` 在本项目已有正式含义（`CONTEXT.md:319` 的"下游交接"、"用户完成卡"） | 新技能名定为 `stage-handoff`，定位=只读交接产物，不替代"下游交接"/"用户完成卡" | 不需要新 ADR（沿用 F3/Q2 边界） | 用户 Grill G1 回复 |
| G-002 | 审查指出"只通告路径"不足以让新会话找到 handoff | 采纳用户选择 G2=B：只靠用户手动贴路径，不做自动读取、不改四份材料结构；残余风险登记 RISK-001 | 非目标登记 | 用户 Grill G2 回复 |
| G-003 | handoff 若复述材料正文会变成第二事实源 | 采纳 G3=A：只做索引+结论+指针，材料仍是唯一真相 | F3/Q2 | 用户 Grill G3 回复 |
| G-004 | reflection 与 handoff 都在 stage 最末，顺序未定 | 采纳 G4=A：reflection 先跑、handoff 后写，handoff 含复盘结论 | 与 D-008 一致 | 用户 Grill G4 回复 |
| G-005 | handoff 调用失败会不会阻断 stage | 采纳 G5=A：记 `unavailable` + 通告未生成原因，不阻断 stage 完成 | 宪法 F11"记录事实而非阻断" | 用户 Grill G5 回复 |
| G-006 | 阶段末总结只说"handoff 已生成"够不够 | 硬性要求：总结必须含 handoff 文件**完整绝对路径**，便于复制到下一个会话 | R-020 | D-009 + AC9 |

## 审查处置

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-001 | direction review blocking ×2：多个 completed attempt 时下游如何"消费最新"未定义 | 若不管会让"合法重试"与"只消费最新"契约冲突 | fixed | D-004 采纳 T3-Q1=A + Clarify 1A：同快照同材料的 completed attempt 内容等价、任意一个满足完成；真冲突=同 attempt 异字节或不同 attempt 语义签名不一致；不新增排序字段 | owner=make-decision；consumer=build-spec；retain |
| FND-002 | direction review major：`integration_review=unavailable` 满足谓词会假绿 | 会把"未做"写成"完成" | fixed | D-006 改为"谓词不动（只认 recorded），只修投影标签与两套投影结论相反的问题" | owner=make-decision；consumer=build-spec；retain |
| FND-003 | direction review major：D4 接 reflection executor 属范围外且新增故障面 | 可能引入新的阶段末阻塞 | fixed | D-008 保留自动执行（用户明确要求），但强制超时 + 失败隔离 + 非阻断 | owner=make-decision；consumer=build-plan；retain |
| FND-004 | direction review minor：D2 只登记 `web_search` 漏了 `web_fetch` | 降级后无法抓正文 | fixed | D-003 补登记两者 | owner=make-decision；consumer=build-spec；retain |
| FND-005 | direction review minor：模块数"四个"与正文五个不符 | 文档不一致 | fixed | 本决定区已按六模块（A–F）组织 | owner=make-decision；consumer=—；retain |
| FND-006 | direction review major：D2 缺端到端可观测路径与失败分类/时限 | 黑障时重试只会延长阻塞 | fixed | D-003 增加统一失败回执 + 单次/总时限（数值在 build-spec 定稿） | owner=make-decision；consumer=build-spec；retain |
| FND-007 | direction review major：D1 未定义 R0–R5 的机器可验收结果/覆盖/失败回执/哈希规则 | 无法证明调研深度 | fixed | D-001/D-002 明确报告 schema 与 canonical JSON 哈希规则、缺口披露由机器事实生成；细节在 build-spec | owner=make-decision；consumer=build-spec；retain |
| FND-008 | direction review major：D5 未定义 handoff 的发现/读取契约与旧格式优先级 | 新会话仍找不到 | accepted_risk | 用户明确选 G2=B（只手动贴路径）；风险登记为 RISK-001 | owner=user；consumer=—；retain |
| FND-009 | direction review major：handoff 在 reflection 前会缺反思结论 | handoff 不完整 | fixed | T3-Q5=A / G4=A：reflection 先跑、handoff 后写 | owner=make-decision；consumer=build-plan；retain |
| FND-010 | direction review major：D4 未交付全局控制面清单 | 治理未闭合 | fixed | D-007 增加"可审计控制面清单"交付项 | owner=make-decision；consumer=build-plan；retain |
| FND-011 | direction review major：D4 漏 `findingDispositions` 6 参只传 2 参 | 静默失效继续 | fixed | D-007 纳入修复项 | owner=make-decision；consumer=build-code；retain |
| FND-012 | direction review major：一次性恢复 21 处 skip 守卫可能把质量门装回来 | 违宪风险 | fixed | T3-Q4=B：先逐条分类（恢复/退役+替代覆盖/延后） | owner=make-decision；consumer=build-plan；retain |
| FND-013 | direction review major：D5 未定义命名/幂等/原子写入/失败行为 | handoff 可能缺失或被覆盖 | fixed | D-009 第 2、7 条已定；runner 调用点细节在 build-plan | owner=make-decision；consumer=build-plan；retain |
| FND-014 | direction review major：D5 只覆盖四阶段，与"每个 stage"原需求有差 | verify-code 仍会丢上下文 | accepted_risk | 用户 Q6=B 明确只覆盖四个作者阶段；登记为 DEFER-001 | owner=user；consumer=—；retain |
| FND-015 | direction review major：D3 的"最新"排序无可靠依据 | 可能静默选错 | fixed | 同 FND-001：同快照同材料下不需要排序 | owner=make-decision；consumer=build-spec；retain |
| FND-016 | 子代理 J：`capability proof` 不是本仓谓词 | 若升格会立刻造出死谓词 | fixed | D-006 明确禁止升格 | owner=make-decision；consumer=build-spec；retain |
| FND-017 | 子代理 J：158 个任务无一 build-code 达 5/5 | 完成判据存在结构性问题 | fixed | D-006 修 envelope 与 fact 结论相反的问题；剩余结构问题登记 RISK-002 | owner=make-decision；consumer=build-code；retain |
| FND-018 | detail review v1 blocking：`draft_spec_or_acceptance` 与 `approved_direction` 字节完全相同，缺 AC/用户流程/数据状态/边界 | 审查看到的是"没有验收标准" | fixed | 新增 `acceptance-draft.md`（UF-1..UF-3、页面范围、数据状态、边界、AC1–AC9）；提交缺陷由我方造成并已修正 | owner=make-decision；consumer=build-spec；retain |
| FND-019 | detail review v1/v3 blocking：reflection 与 handoff 的生命周期顺序在 `on_stage_end` 单步约束下不可实现 | handoff 拿不到复盘结论 | fixed | T3-Q6=B：handoff 作为 reflection hook 的产物，不新增 steps.json 节点；D-009 已改写并删除残留描述 | owner=make-decision；consumer=build-plan；retain |
| FND-020 | detail review v1 blocking：把规格细节推给 build-spec 违反 R-009/R-010 | 需求未在 make-decision 收敛 | fixed | T3-Q7=A：AC 锁到可验收颗粒度（AC1–AC9）；实现参数留 build-spec 但每项有 owner 与退出条件 | owner=make-decision；consumer=build-spec；retain |
| FND-021 | detail review v3 blocking：D-007 的 approval_binding 同时引用 R3-Q4=A 与 T3-Q4=B，自相矛盾 | 治理范围不清 | fixed | 以最新的 T3-Q4=B 为准，取代 R3-Q4=A；死门删除与 skip 守卫分类分开表述 | owner=make-decision；consumer=build-plan；retain |
| FND-022 | detail review v3 major：AC8 只覆盖四阶段，与 D-008 的五阶段矛盾 | verify-code 复盘缺验收 | fixed | AC8 改为五个 stage 的 reflection，handoff 仍只四阶段 | owner=make-decision；consumer=build-spec；retain |
| FND-023 | detail review v3 major：验收草案缺"页面范围" | R-010 未覆盖 | fixed | 新增"§1b 页面范围与交互表面"，明确无 UI 页面、三类交互表面 | owner=make-decision；consumer=build-spec；retain |
| FND-024 | detail review v3 major：AC1/AC2/AC9 判据过弱（未定义深度下限、机器事实来源、新鲜度） | 可被空报告糊过去 | fixed | AC1 补来源数/一手来源/原文定位/三角测量下限；AC2 要求披露由机器事实生成；AC9 要求内容与当前 snapshot/material 绑定 | owner=make-decision；consumer=build-spec；retain |
| FND-025 | detail review v3 major：D-005 的 `execution_outcome` 与"不新增投影"非目标冲突 | 非目标与决定互相打脸 | fixed | 明确 `execution_outcome` 是既有 `status` 投影内的字段重排，不是新投影对象/新持久文件/新控制面 | owner=make-decision；consumer=build-spec；retain |
| FND-026 | detail review v3 major：UF-1 无答复分支状态不一致 | 状态模型歧义 | fixed | 统一为"记 `awaiting_user_approval` 并在阶段末列为 unavailable 待补项"，两者是同一事实的两种表述 | owner=make-decision；consumer=build-spec；retain |
| FND-027 | detail review v4 blocking：研究失败态未闭环（`completed`/`skipped`/`unavailable` 与"保持 incomplete"冲突），无答复/拒绝降级/工具失败缺机器可读事实 | 阶段摘要无法据事实生成 | fixed | 数据状态改为三态互斥穷尽，且 `skipped`/`unavailable` 同样内容寻址落盘；AC2 相应改写 | owner=make-decision；consumer=build-spec；retain |
| FND-028 | detail review v4 blocking：未定义"推进资格 / 阶段完成 / 整体交付"三者的边界，UF-2 未说明失败态能否进下一 stage | 可能与宪法 F3/Q2 冲突 | fixed | 新增 §2b 三分边界表，明确"下一 stage 只看四材料可读 + 工头调度" | owner=make-decision；consumer=build-spec；retain |
| FND-029 | detail review v4 blocking：§1b 把"摘要缺项"写成阻断 stage 完成，自相矛盾且违反非目标第 2 项 | 引入新的质量门 | fixed | 改为"如实披露缺失项与原因，不阻断 stage 完成" | owner=make-decision；consumer=build-spec；retain |
| FND-030 | spec-analyze CRITICAL：AC8 判据可被"真实执行失败"解释而永远通过（假绿） | 缺陷仍在也能过 | fixed | AC8 改为正向证据判据：必须有生产 executor 运行证据；`unavailable` 且 reason 为 `executor_not_injected`/`not_scheduled` → 直接判 AC8 失败 | owner=make-decision；consumer=build-spec；retain |
| FND-031 | spec-analyze HIGH：原始需求表 11 条仍写"待处理"，与覆盖矩阵/已确认互相否定 | 下游误判需求未收敛 | fixed | 逐条更新为最终处置（D-ID + AC-ID 或"过程约束"），与覆盖矩阵同源 | owner=make-decision；consumer=build-spec；retain |
| FND-032 | spec-analyze HIGH：目标/成功失败边界/非目标三节仍是占位 | R-009/R-010 交付物缺失 | fixed | 三节已回填（目标分解、成功/失败边界、三分边界指针） | owner=make-decision；consumer=build-spec；retain |
| FND-033 | spec-analyze HIGH：§2b 把 AC1/AC8 列为"直接影响阶段完成"，与 D-002/D-008 相反 | 等于加了完成门 | fixed | §2b 改为"只有 AC4/AC5/AC6 改变完成投影"；AC1/AC8 只约束本任务最终交付判定 | owner=make-decision；consumer=build-spec；retain |
| FND-034 | spec-analyze HIGH：AC1 未定义合法 `skipped` 分支 | 合法跳过被判失败 | fixed | AC1 增加 skipped 分支：以内容寻址 skip 记录为通过条件 | owner=make-decision；consumer=build-spec；retain |
| FND-035 | spec-analyze HIGH：缺 `## UI applicability` 节 | F7 判定悬空 | fixed | 补 `## UI applicability`（三输入 → `non_ui`） | owner=make-decision；consumer=build-spec；retain |
| FND-036 | spec-analyze HIGH：RISK-004 仍描述已被 T3-Q6=B 取消的 steps.json 新增节点 | 会把下游引向错误做法 | fixed | RISK-004 改写为"handoff 与 reflection 同 hook 的相互影响" | owner=make-decision；consumer=build-plan；retain |
| FND-037 | spec-analyze HIGH：方向审查 25 条 findings 与处置行数不符（16 行） | 处置无法复核 | fixed | 补审查事实 F-012/F-014…F-017 + 下方聚合说明（25 条按主题聚合为 17 行，blocking 逐条独立） | owner=make-decision；consumer=build-spec；retain |
| FND-038 | spec-analyze MEDIUM：D-005 缺 unresolved_items/owner | 字段形状无 owner | fixed | 补 unresolved_items/owner（OPEN-007） | owner=make-decision；consumer=build-spec；retain |
| FND-039 | spec-analyze MEDIUM：D-002/D-006/D-007 的下游项未登记为 OPEN | 交接易丢 | fixed | 补 OPEN-008/OPEN-009/OPEN-010 | owner=make-decision；consumer=build-plan；retain |
| FND-040 | spec-analyze MEDIUM：同一未决项两个 owner（make-decision vs build-spec） | 责任不清 | fixed | 统一为"未决项 owner=承接阶段"；决定自身 owner 与未决项 owner 分开表述 | owner=make-decision；consumer=build-spec；retain |
| FND-041 | spec-analyze MEDIUM：D-006/D-009 缺 derived_from、模块标题编号范围错 | 依赖关系不可见 | fixed | 补 derived_from；模块标题改为实际 D 编号范围 | owner=make-decision；consumer=build-spec；retain |
| FND-042 | spec-analyze MEDIUM：D-006 approval_binding 错引 T3-Q3；T-016 交叉引用错为 T-019 | 批准绑定错位 | fixed | 改为 T3-Q2=A（T-021） | owner=make-decision；consumer=build-spec；retain |
| FND-043 | spec-analyze MEDIUM：stage outcome 取值表漏 skipped、保留 conflict、引入未登记 ambiguous | 词表不一致 | fixed | 在 §2 明确取值集合与 public 词表关系；conflict/ambiguous 仅内部标签，不进入 public status | owner=make-decision；consumer=build-spec；retain |
| FND-044 | spec-analyze MEDIUM：完全无 outcome 的 stage 是否算完成未定 | 隐藏门或假绿 | fixed | D-005 与 §2b 明确：`stage_outcome` 不是完成谓词；缺失时 `execution_outcome.status=unavailable` 如实呈现，不改变 `STAGE_PREDICATES` 的完成判定 | owner=make-decision；consumer=build-spec；retain |
| FND-045 | spec-analyze MEDIUM：AC7 判据过弱且未覆盖 D-007 ④⑤ | 核心交付无验收 | fixed | AC7 改为"逐项给出删除/保留结论并按结论落地"，纳入别名收敛与登记补齐 | owner=make-decision；consumer=build-spec；retain |
| FND-046 | spec-analyze MEDIUM：审查处置表缺 evidence_ref | provenance 无法回溯 | fixed | 表头保留 next_action/evidence_ref，并在 F-012/F-014…F-017 登记各轮 attempt 路径与 findings 数 | owner=make-decision；consumer=build-spec；retain |
| FND-047 | spec-analyze MEDIUM：`stage-handoff` 删除条件无可观测触发点 | 复刻本任务诊断出的反模式 | fixed | 删除条件改为"连续 3 个 task 的 handoff 读取方为 0（完整消费边扫描 + 人工复核），或读取方改由其他机制承担时删除" | owner=make-decision；consumer=build-plan；retain |
| FND-048 | spec-analyze MEDIUM：D-001 新增持久命名空间未写替代关系与删除条件 | 违反 AGENTS.md:62 | fixed | 补替代关系（替代原 `quality/tests/` 借用路径）与删除条件；说明深度校验只做最小结构校验、不构成 gate | owner=make-decision；consumer=build-spec；retain |
| FND-049 | spec-analyze MEDIUM：`acceptance-draft.md` 未登记 owner/consumer/保留条件 | 与"四材料唯一真相"边界张力 | fixed | 登记 owner=make-decision、consumer=build-spec、合并条件（build-spec 完成后并入 spec.md 并转只读） | owner=make-decision；consumer=build-spec；retain |
| FND-050 | spec-analyze LOW：`findingDispositions` 守卫性质未定 | 可能变成新门 | fixed | 明确为**记录型**守卫：如实标记 stale finding，不阻断推进；AC7 加一条可观察判据 | owner=make-decision；consumer=build-code；retain |
| FND-051 | spec-analyze LOW：D-004 的 `attempt_count` 披露未进数据状态/AC4 | 披露无法验收 | fixed | 数据状态与 AC4 补该只读披露字段 | owner=make-decision；consumer=build-spec；retain |
| FND-052 | spec-analyze LOW：降级四态与 research 三态映射未定义 | 等待期语义模糊 | fixed | 明确：等待期 research 事实=`unavailable` 且 reason=`awaiting_user_approval`；获批后写新的 `completed` 记录（不覆盖旧记录） | owner=make-decision；consumer=build-spec；retain |
| FND-053 | spec-analyze LOW：R-015/R-018 与 Talk 行不能一一对应 | 答复可追溯性 | fixed | Talk 表补 R2-Q6/Q7 行，R-018 补记 T3-Q6/Q7 属"R3 续" | owner=make-decision；consumer=build-spec；retain |
| FND-054 | spec-analyze 第二轮复查（14 条：1 HIGH/8 MEDIUM/5 LOW） | 非目标未回填等 | fixed | FND-030…FND-053 逐项修复：非目标 6 条回填、derived_from 补全、owner 统一、模块标题、F-013 终态、成功边界计数、R-008/011/012 判据、evidence_ref 注记、RISK-004 同步、OPEN-007…011、UF-1 改写、AC4 前置条件 | owner=make-decision；consumer=build-spec；retain |
| FND-055 | spec-analyze 第三轮复查：status=**consistent**，覆盖率 20/20，无 CRITICAL/HIGH，余 3 MEDIUM/7 LOW | 仍有登记口径残留 | fixed | 修：stage-handoff 删除条件改为可观测触发点 + 补替代关系；处置表结构恢复；模块 A 标题；未决项三处指针；U-001/U-003/U-004 收敛；R-018 补 T3-Q6/Q7；RISK 权威指针。剩余 LOW 登记为 OPEN-012 | owner=make-decision；consumer=build-spec；retain |

> 说明：evidence_ref 统一由"调研"表的 F-012/F-014…F-017 承担（各轮 attempt 路径 + findings 数）；本表只写 next_action，逐行 finding 级引用见对应 attempt 文件。

### 方向审查 25 条 findings 的聚合说明（供 FND-037 复核）

| 聚合行 | 覆盖的原始 findings 主题 |
| --- | --- |
| FND-001 | 2 条 blocking：多个 completed attempt 的"最新"消费语义（×2） |
| FND-002 | `integration_review=unavailable` 假绿（×3，含中英各一） |
| FND-003 | reflection executor 范围与故障面（×2） |
| FND-004 | web_fetch 漏登记 |
| FND-005 | 模块数量不一致（×2） |
| FND-006 | anysearch 失败分类/时限/端到端路径（×2） |
| FND-007 | R0–R5 可验收定义与哈希规则（×2） |
| FND-008 | handoff 发现契约 |
| FND-009 | handoff 与 reflection 顺序 |
| FND-010 | 控制面清单缺失 |
| FND-011 | findingDispositions arity |
| FND-012 | 21 处 skip 守卫分类 |
| FND-013 | handoff 命名/幂等/原子写 |
| FND-014 | 只覆盖四阶段 |
| FND-015 | 排序依据不可靠（与 FND-001 同源） |
| FND-016 | capability proof 非谓词 |
| FND-017 | 158 个任务无一 5/5 |

## 最终确认

- 状态：**accepted**
- 用户原文（2026-09-09，host-visible）：**"批准，请确认整个decision-log包括了handoff问题、外部调研问题、所有stage阻塞问题的决策和方案"**
- host-visible 绑定：用户在 approve-decision 步骤的真实答复，绑定本 decision-log 当前内容范围（D-001…D-009 + `acceptance-draft.md` AC1–AC9 + 覆盖矩阵）。
- 确认前的覆盖核对（2026-09-09，主会话执行）：三类问题逐一核对通过——
  - ① handoff 问题（R-003/R-004/R-005/R-006/R-007/R-019/R-020）→ **D-009 + AC9**；
  - ② 外部调研问题（R-001/R-002）→ **D-001/D-002/D-003 + AC1/AC2/AC3**；
  - ③ stage 阻塞问题（R-013/R-016/R-017/R-018）→ **D-004/D-005/D-006/D-007/D-008 + AC4/AC5/AC6/AC7/AC8**。
- 核对中当场修复的两个自身缺陷：
  1. 每个决定的 `requirement_ids` 字段在替换模板时被丢失（全部为空）→ 已逐条补回，并新增"需求 → 决定 → 验收 覆盖矩阵"（R-001…R-020）；
  2. 覆盖核对脚本最初用子串匹配产生假命中（`R-009` 被误判为 `D-009`）→ 改为按字段精确解析后重核。
- 未确认内容：无（本决定区全部内容已获确认）。
- 后续材料细化不使该批准失效；**真正方向改变仍需新的真实答复**。

## 增量修订确认（2026-09-10）

- 状态：**accepted**（2026-09-10 用户确认；增量范围，**不改变** 2026-09-09 已接受的 D-001…D-009 方向）。
- 用户原文（2026-09-10，host-visible，Talk T4 批次）：
  - T4-Q1：**A 纳入本任务**——性能修复新增独立 FR/AC 与独立 RED/GREEN 卡。
  - T4-Q2：**A 纳入本任务**——CLI gap 按 root cause 归并展示。
  - T4-Q3：**A 补 publisher + 纳入 D-007 清单**——`quality/verify.json` 不退役。
  - 范围口径原文：「可以按照你的三分法来，但是需要把后续要进行的任务整理成一个md文件…尽可能1-2个任务把所有遗漏任务做完最好」；后续任务合并稿落 `~/Downloads/workflowhub-followup-tasks-20260910.md`。
- 绑定范围：R-021…R-024 + D-010…D-013 + 本文件「增量诊断事实与纠正」表。
- 与 2026-09-09 最终确认的关系：**两条记录都保留**；本次只做增量，不 supersede 任何既有决定。
- 用户最终确认原文（2026-09-10，host-visible）：**「确认，写入 accepted」**——针对 R-021…R-024 + D-010…D-013 的增量修订整体。
- 未确认内容：无（本增量区整体已获确认；2026-09-09 的 D-001…D-009 确认记录原样保留）。
- 本次增量修订的执行边界（如实披露，未执行项不得当作已完成）：
  - 未重跑 Talk R1–R3、未新增调研、未跑 Grill（方向答复只来自 T4 三问）；
  - 未对 D-010…D-013 重新发起 direction/detail review，也未重跑 stage-end spec-analyze；
  - 未生成新的 interaction aggregate，未产生 canonical stage outcome；
  - 因此 make-decision 的**正式 completion 仍为 unproven/incomplete**，但同一 task 可继续修复（F11 / D-002 口径）。
- 后续材料细化不使该批准失效；真正方向改变仍需新的真实答复。

## 拒绝方案

| 选项 | 拒绝理由 | 关联 D |
| --- | --- | --- |
| 把 research 加进 make-decision 完成判据 | 与宪法"不引入会阻断推进的质量门"冲突；需改 `tests/contract/stage-completion.test.mjs:36` 的反向断言 | D-002 |
| 研究报告继续塞进 `quality/tests/` 当测试回执 | 需伪造 command/exit_code，违反 F9 不伪造质量事实 | D-001 |
| 新增 `completeMakeDecisionResearch` 专用写入器 | F11 反例：为一个校验再加 writer；复用 `publishCanonicalRecord` 已足够 | D-001 |
| anysearch 失败自动静默降级 | 用户明确要求降级前先问一次（R2-Q2=B） | D-003 |
| 只登记 `web_search` 不登记 `web_fetch` | 降级后无法抓正文（审查 FND-004） | D-003 |
| 给 stage outcome 加时间戳/`attempt_seq` + latest selector | 新增持久字段并违反 `AGENTS.md:59` 禁止 selector/successor；同快照同材料下无排序需求 | D-004 |
| 写入端同绑定去重复用旧 outcome ref | 违反 ADR 0024 与 `docs/reuse-registry.md:21`，并抹掉 provenance | D-004 |
| 保持 `exactly-one` 判定 | 就是用户当前的痛点 | D-004 |
| 只把 `conflict` 判成 satisfied 以消除 missing | 会让 `quality_status` 直接变 completed，等于假绿，违反 F9/Q1 | D-005 |
| 让 `unavailable` 满足 `integration_review` 谓词 | 审查两次 blocking 反对；会模糊"未做"与"完成" | D-006 |
| 把 `capability proof` 升格为 build-code 谓词 | 本仓无生产者，会立刻造出死谓词 | D-006 |
| 把 stage-reflection 改为手动可选 | 用户原文反驳："改为手动执行的话，就会变成永远不执行" | D-008 |
| 复用旧 `handoff` 技能名 | 与 `CONTEXT.md:319` 的"下游交接"撞义 | D-009 |
| handoff 全文自包含 | 会变成第二事实源，违反 F3/Q2，且烧新会话上下文 | D-009 |
| 给四份材料加 handoff 字段 | `workflows/build-plan/SKILL.md:246-247` 明确禁止 | D-009 |
| 给 `index.json.facts`/`facts.jsonl` 补写以消除"空数组" | 二者当前无状态消费者；补写属新增控制面与双写，违反 D-007 与 `NG-002` | D-013 |
| 放宽或跳过全部坏 history 让当前 review 直接 dispatch | 会把真实预算与身份问题洗成成功 | D-011 |
| 迁移或删除历史坏 review 字节 | 破坏 provenance；本任务只隔离，不覆盖历史 | D-011 |
| 删除 worktree identity/snapshot 校验以换测试速度 | 违反 fail-closed 边界 | D-012 |
| 把慢测整文件塞进常规 gate | 稳定制造四分钟以上反馈环 | D-012 |
| 继续用自由文本 + 补更多中文正则推断 UI | 对中文否定不可靠，且是永久兼容负担 | D-010 |

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| RISK-001 | handoff 只靠用户手动贴路径（G2=B），新会话不会自动发现 | 用户忘记贴路径时会话仍只能读四份材料 | 用户习惯；如需自动化，另开任务评估（涉及改 stage 入口） |
| RISK-002 | 158 个真实任务无一 build-code 达 5/5；D-006 只修 envelope 与 fact 结论相反的问题 | 修复后仍可能因真实缺 AC/审查而无法完成 | build-code 实施阶段验证；owner=make-decision 决定范围 |
| RISK-003 | anysearch 降级需用户批准，用户不在场时会卡住调研 | 记录"等待批准"并继续其它工作 | 实施阶段在 spec 明确等待语义 |
| RISK-004 | handoff 与 reflection 同处一个 hook，任一方失败可能互相影响 | 需保证 handoff 失败不阻断 reflection 结果发布，反之亦然 | build-plan/build-code |
| RISK-005 | "无关坏历史可继续 dispatch"被误写成"忽略所有损坏" | 会把真实预算/身份问题洗成 dispatch | spec/测试：三分支全部具备 runner-count 与错误码 oracle |
| RISK-006 | 为提速缓存 workspace identity 过久，漏掉身份变化 | 破坏 fail-loud 边界 | build-code：缓存严格限于单 authenticated operation，保留 mutation/identity-change 负例 |
| RISK-007 | 照外部根因文档给 `index.json.facts`/`facts.jsonl` 补写 | 形成无人读取的第二权威与双写 | 本任务：D-013 明确禁止；实现评审按此拒绝 |
| RISK-008 | 增量修订后四材料 hash 与 tasks `versioned_refs` 全部变化 | 旧 review/test/outcome 不再 current，形成重新认证循环 | build-spec/build-plan：统一重算并通过 current packet |
| DEFER-001 | verify-code 不在本轮 handoff 覆盖范围（Q6=B） | verify-code 阶段仍会丢上下文 | 后续任务评估 |
| DEFER-002 | `muyu-search-mcp` 本机不可用，是否正式退役未定 | 不影响本轮兜底（已有 web_search/web_fetch） | 后续任务 |

> 风险/延期以本表为**权威登记**；`acceptance-draft.md` §7 只作摘要指针。

### step 14 stage-reflection 的真实执行结果（2026-09-09）

- 主会话已按 `stage-reflection` 技能产出 `stage-reflection.v2` judgment JSON（六个区块 + `status_matrix` + `identity` + `source_completeness`），并调用唯一公共入口 `run --action=reflect`。
- 机器返回：`status: unavailable`、`reason_code: **executor_absent**`、`persisted: false`、`error: "reflection requires exactly one explicit authenticated executor outcome"`。
- 已落盘不可变 availability 事实：`quality/evidence/stage-reflection-availability/86f7629293daa3702ff13cfd1174a813a0cc228f3aa14befaccb3c67e8f73f2e.json`（sha256 `86f76292…`）。
- 判定：这是**非阻断的真实失败事实**，按契约原样保留，不改成通过、不阻断本 stage 交接。
- 对 D-008 的意义：现场验证了"生产路径缺 executor → 自动复盘永远 unavailable"，正是 D-008 要修的缺陷本身；修复后本 stage 的复盘应可重跑并产出 `ok`/`degraded`。
- 根因证据：`tools/cli/stage-runtime.mjs:437-445`（`services.stageReflectionExecutor === undefined` 时直接返回空对象）。

### 质量边界

- 质量事实：本阶段产出 direction-advice 审查事实（25 findings，8 次 provider 调用中 4 完成 / 2 `PROVIDER_HEALTH_FAILED`）、detail-advice 三轮审查事实（33/41/36 findings）、研究事实 F-005…F-011、stage 末 spec-analyze 三轮事实（第一轮 inconsistent 29 条 → 第二轮 inconsistent 14 条 → 第三轮 **consistent**，覆盖率 20/20，无 CRITICAL/HIGH）。
- 推进资格：四份材料可读即可继续；上述质量事实不是推进许可证。
- 完成判据：Talk 收敛、调研完成或如实标注、Grill 完成、决定区完整、用户真实确认、interaction aggregate 绑定当前 decision-log。
- 不可逆授权边界：本阶段不做 commit/push/merge/archive/cleanup；这些需另经 `authorize`。

## 未决项

按 T3-Q7=A：需求边界、用户流程、数据状态、成功/失败边界与 AC 判据已在 `acceptance-draft.md` 锁死；以下按"原因"列分三类（实现参数 / 实施判断 / 复核类），每项均有 owner 与退出条件。

| item_id | 未决内容 | 原因 | 谁在何时解决 | 退出条件 |
| --- | --- | --- | --- | --- |
| OPEN-001 | research 事实 NAMESPACE 与 receipt kind 命名 | 实现参数 | build-spec | `spec.md` 给出命名且 runtime 校验通过 |
| OPEN-002 | anysearch 失败回执的单次/总时限数值 | 实现参数 | build-spec | 数值写入 spec 且被实现引用 |
| OPEN-003 | "内容等价"的精确比对字段 | 实现参数 | build-spec | 字段写入 spec 且有针对测试 |
| OPEN-004 | reflection executor 实现方式 | 实现参数 | build-plan | plan 给出实现路径与超时/失败语义 |
| OPEN-005 | `stage-handoff` 在 reflection hook 内的调用点与 13 区块字段名 | 实现参数 | build-spec | spec 给出字段表且 handoff 生成通过 |
| OPEN-006 | 21 处 skip 守卫逐条分类结果 | 实施判断 | build-plan/build-code | 每条有恢复/退役/延后结论 |
| OPEN-007 | `execution_outcome` 字段形状与 `ambiguous` 取值 | 实现参数 | build-spec | 字段形状写入 spec 且 AC5 可核验 |
| OPEN-008 | 调研缺口披露字段的具体形状（D-002） | 实现参数 | build-spec | 字段形状写入 spec 且 AC2 可核验 |
| OPEN-009 | envelope skill 行修复方案（D-006） | 实现参数 | build-spec | 方案写入 spec 且"两套投影结论一致"有测试 |
| OPEN-010 | 控制面清单格式与分期边界（D-007） | 实施判断 | build-plan | 清单格式与 P0/P1/P2 边界写入 plan |
| OPEN-011 | research-report 的独立复核（deep-research R5） | 复核待做 | 本 stage 主会话 | 复核结论落盘并更新报告 `review.status` |
| OPEN-012 | spec-analyze 第三轮剩余的 LOW 级登记项（finding 计数与处置行对账、逐行 evidence_ref 粒度） | 登记精度 | build-spec | 对账说明或逐行引用写入 spec 附录 |
| OPEN-013 | UI applicability source 的结构字段名与三类负例 fixture（结构化 non-ui 通过 / 声明与 source 结论冲突 fail-loud / source 缺失不得假填 non_ui） | 实现参数 | build-spec | 字段名写入 spec，三类负例有测试 |
| OPEN-014 | review budget history 的 namespace 分类键与最小可读身份（必须能区分 unrelated / current / unclassifiable，不靠路径猜测） | 实现参数 | build-spec | 规则写入 spec，三分支各有 runner-count 与错误码 oracle |
| OPEN-015 | 性能预算数值与 Git spawn / wall-time oracle 形式 | 实现参数 | build-plan | 数值与 oracle 写入 plan，身份变化负例仍 fail-loud |
| OPEN-016 | `quality/verify.json` 的生产 publisher 实现点与 canonical-root guard 方案 | 实现参数 | build-plan | 方案写入 plan，"唯一 writer"有负例测试 |

## Supersedes

无（本任务不 supersede 任何既有决定；2026-09-10 的增量修订只新增 R-021…R-024 / D-010…D-013，被拒方案已在上表登记。唯一的条款级取代是 D-009 第 2 条的“保留旧版本”被 build-spec Clarify 2B 取代，见该条内注）。

## 文档结果

- CONTEXT.md：**需要更新**。新增术语 `stage-handoff`（阶段交接包）与 `research-report` 事实；并在"关系与边界"处明确它与"下游交接"、"用户完成卡"的区别。理由：`CONTEXT.md:319` 已有"下游交接"定义，不新增术语会产生歧义。
- ADR：**需要一份**。主题=「多 attempt 的 stage outcome 不构成冲突」（记录 D-004 + Clarify 1A 的判据：等价 completed 不构成冲突；真冲突=同 attempt 异字节或不同 attempt 语义签名不一致）。理由：它推翻了 `completion-predicates.mjs:468-474` 的既有注释语义，属于"难以逆转、没有上下文会惊讶、存在真实取舍"的决定。
- ADR criteria：hard to reverse=是（改投影语义影响 status/close/release 三处派生）；surprising without context=是（注释原本说多 envelope 是 conflict）；genuine trade-off=是（不新增排序字段 vs 契约要求"消费最新"）。
- 术语/ADR 冲突及处理：`handoff` 一词冲突→新术语 `stage-handoff`；`stage_outcome` 冲突语义→ADR 记录。
- 不复制 spec 的边界：本文件只写决定、理由、风险与指针；FR/AC 细节、文件边界、测试命令一律进 `spec.md`/`plan.md`/`tasks.md`。
- 2026-09-10 增量修订：**不新增术语、不需要新 ADR**（D-010…D-013 都是既有控制面的形状/作用域修复，不推翻 D-004 的 ADR 主题）。

### Exit checks

- 上下文一致：是（六模块 A–F 与 R-001…R-024 逐条对应，见"决定"区各模块的 `requirement_ids`）。
- owner/接口一致：是（每个 D 都写了 owner；新控制面 `stage-handoff` 的 owner=stage 主会话、consumer=下一会话/用户，删除条件=连续 3 个 task 的 handoff 读取方为 0（`deriveConsumptionEdges` 完整扫描 + 人工复核），或读取方改由其他机制承担时删除）。
- 失败语义明确：是（调研 skipped/unavailable、anysearch 失败分类、handoff 写失败 `unavailable` 不阻断、reflection 超时 `unavailable` 不阻断）。
- 范围与延期明确：是（非目标见"拒绝方案"与 DEFER-001/002；OPEN-001…OPEN-016 已指明 owner 与阶段）。
- 增量修订一致：是（R-021…R-024 ↔ D-010…D-013 ↔ 覆盖矩阵 ↔ OPEN-013…OPEN-016 ↔ 本文件 RISK-005…RISK-008 逐条对应；注意 `spec.md` 的 RISK-001…010 是它自己的编号空间，本文件 RISK-005…008 对应 `spec.md` RISK-007…010；`## UI applicability` 已改为结构化 source 且 `## 收敛检查` 四维表齐备）。
