# M15 真实记录链与看板交付修复 — decision log

> 阶段：make-decision（决策已确认；Talk、方向审查、Grill、详细审查和阶段末 spec-analyze 已完成；待正式发布）
> 任务：`m15-runtime-observability-repair`
> 当前目标：修复 M15 及其前置 M10/M14 的真实交付链，为未来单独启动 M16 提供可靠事实基础。

## 原始需求

- R-001：重新阅读 `roadmap`、`decision-log` 和 M0 调研，结合 M15 看板遗漏，找出 M15 做差的根本原因和遗漏。
- R-002：检查 M15 之前的功能是否没有正常交付；用代码证据和一次真实新任务确认记录动作是否接入真实任务执行入口，不预先把结论写成事实。
- R-003：完成当前 WorkflowHub 代码、M10、M14、M15 实现的详细调研，并核对原始需求和期望。
- R-004：基于调研结果设计完整修复方案，重点解决真实任务执行、记录、投影和页面验收断链。
- R-005：按标准 WorkflowHub 从 `make-decision` 开始，不跳阶段，不依赖 `build-spec` 偷补需求。
- R-006：Talk 用大白话说明选项、后果和风险；`decision-log.md` 记录原始需求、关键事实、选择、理由和延期交接。
- R-007：先梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项。
- R-008：历史数据不用处理；修复重点是新任务从真实入口开始能不能完整记录。
- R-009：M16 的经验回路和自进化候选池是后续任务，不是当前实现范围；本任务只提供可靠事实基础和明确交接。

## 关键事实

事实来源：

- 原始规划：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/agenthub-extraction-program/artifacts/roadmap.md`
- 原始决策：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/agenthub-extraction-program/artifacts/decision-log.md`
- M0 调研：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/agenthub-extraction-program/artifacts/M0/`
- 综合调研：`/Users/Hugh/Hugh/Project/workflowhub/docs/research/m16-experience-loop-repair-research.md`
- 历史 M15 页面基线：`/Users/Hugh/Hugh/Project/workflowhub/specs/m15-process-degradation-dashboard/spec.md`；这里只作为已存在页面契约的对照，不作为本任务已确认的当前决策来源。

已确认的内部事实：

1. 调研代码显示 M15 页面可以展示已有事实，但真实任务执行入口自动注册并提供宿主 source 尚未被 fresh task 证明；主要测试存在手工注入 fixture。**状态：research_evidence，待 fresh task 验证，不先下 workflow 退化结论。**
2. 调研代码显示 runtime 能记录部分 stage/quality 事实，但宿主内部真实 step/skill 事件不是 runtime 自己能猜出的；当前缺失语义存在把“采集器没有接上”扩大成大量 workflow `missing/unknown` 的风险。**状态：research_evidence，待 source capability 验证。**
3. 调研代码显示 M14b collector 只有独立调用方、M10 metrics writer 缺少完整生产 caller 证据。**状态：research_evidence，待真实入口 caller 追踪和 fresh task 验证。**
4. 当前 M15 投影为 `partial`，只能证明记录链不完整，不能直接证明 workflow 退化。**状态：current projection fact；不把它升级为 workflow 结论。**
5. M0 已经记录过无 caller、dead/orphan、只修写入不验证固定读取路径等问题；M10-M15 重复了“文件存在/局部测试通过 ≠ 生产链路接通”。**状态：historical research evidence，作为风险输入。**
6. 当前四份材料和任务 `facts.jsonl` 才是正式事实边界；页面、投影和报告必须可删除、可重建，不能成为第二套真相。**状态：current governance constraint。**

包内可复核的代码摘要（只说明当前代码形状，不替代 fresh task 证据）：`runtime/stage/step-manifest.mjs` 声明固定 stage 顺序 `make-decision → build-spec → build-plan → build-code → verify-code`；`runtime/evidence/monitoring-diagnostics.mjs` 声明九个 `failure_domain`；`runtime/schemas/monitoring-fact.v1.json` 的 `health` value 具有 `domain/status/friction_type/error_code/configured/used/expected/actual/mismatch` 字段；`runtime/evidence/monitoring-projector.mjs` 的 problem 记录具有 `domain/friction_type/error_code/count/source_refs`。这些是代码审查锚点，source registration、caller 和宿主事件是否在真实入口闭合仍是 `unknown/incomplete`，要由 D-003 的 fresh task 证明。

## 当前用户流程

新任务从正式 WorkflowHub 入口开始 → runtime 生成任务/run/attempt/stage 等事实 → 宿主 adapter 注册并提供已证明可采集的 source → 任务结束后追加 artifact/test/review/verify 事实 → 页面从 canonical task facts 重建投影 → 用户查看数据是否真实、完整或不可用 → 用户能区分“流程真的失败”和“记录链不可用” → 将已证明的事实交接给未来独立的 M16 任务。

本任务不把问题候选、经验回路或改动试验做出来；只保证未来 M16 读取到的事实不再是伪造的退化数据。

## 范围

当前范围是：修复 M15 新任务真实记录链、canonical facts 到静态 HTML 的投影链、历史 M15 四区/筛选/状态契约和一条 fresh task 的真实浏览器验收；只接入已证明的 Codex 能力，不处理历史回填，不实现 M16。

## 页面范围

页面和验收范围沿用历史 M15 完整基线：视图 `FR-VIEW-001`～`FR-VIEW-003` / `AC-VIEW-016`～`AC-VIEW-018`，诊断状态 `FR-DIAG-003` / `AC-DIAG-009`，问题聚合与趋势 `FR-COST-003` / `AC-COST-012`，真实链 `FR-E2E-001` / `AC-019 (AC-E2E-001)`；本任务负责补齐实现和真实验收，不在后续阶段重新发明这些范围。

- 一个无需服务的静态 HTML，固定四个可切换区：任务总览、流程退化、成本归因、常见问题与趋势。
- 共享筛选：全局、project、task、stage、skill、version、time-window；切区保留筛选，浏览器原生刷新后回默认。
- 任务总览：task、stage 时序、结果状态、样本充分性；可带 task 范围下钻到退化区和成本区。
- 流程退化：stage evidence gap、step `missing`/`out_of_order`/`skipped`/`not_applicable`、required skill、artifact、taskPath/worktree、review、verify、handoff、transcript completeness。
- 成本归因：按 transcript/session/stage/skill/subagent 展示 token、duration、retry、tool_use，并回指受控来源。
- 常见问题与趋势：只按受控 `failure_domain`、`friction_type`、`error_code` 聚合；展示 outcome/process/efficiency，不生成质量分或改法。
- 页面状态（UI 唯一枚举）：`loading`、`ready`、`empty_valid`、`partial`、`stale`、`fatal`；始终显示 generated time、coverage、errors。
- 事件状态（事实唯一枚举）：`present`、`missing`、`skipped`、`not_applicable`、`unknown`、`unavailable`、`unsupported`、`conflict`、`incomplete`。页面和投影不得另造第二套事件状态。

页面判定规则：只有来源已登记、事件适用性已知、且来源声明支持该事件时，`missing`、明确的 out-of-order 或 required artifact mismatch 才进入“流程退化”区；`skipped`/`not_applicable` 只按带理由的事实展示，不能自动当成退化。来源未登记、能力未声明、`unavailable`、`unsupported`、`unknown`、`conflict`、`incomplete` 进入“采集不可用/证据不足”提示，不进入流程退化统计；`partial`、`stale`、`fatal` 是页面/投影状态，不是 workflow 退化。

诊断条目与事实状态分层：`out_of_order`、`evidence_gap`、`pending`、`failed` 等是由已登记事实和 expected topology 派生的诊断结果，不加入事实唯一枚举；它们必须保留来源事实、coverage 和 reason。这样“事实没有采到”和“已采到但顺序/结果不对”不会混成一个状态。

### 历史 M15 页面基线逐项映射

以下映射把历史契约绑定到当前方向，避免把历史文件整份当作当前已确认决策：

| 历史条目 | 原始承诺 | 当前 M15 解释 |
| --- | --- | --- |
| `FR-VIEW-001` / `AC-VIEW-016` | 四区、七类共享筛选、默认任务总览、task 下钻、受控证据回链 | D-001 保留；实际能力不足只显示明确状态 |
| `FR-VIEW-002` / `AC-VIEW-017` | 打开时读取一次，浏览器原生刷新读新快照 | D-001 保留；不做轮询/自定义刷新 |
| `FR-VIEW-003` / `AC-VIEW-018` | loading/ready/empty valid/partial/stale/fatal 与 coverage/errors | 当前 UI 唯一状态集；`empty` 统一为 `empty_valid` |
| `FR-DIAG-003` / `AC-DIAG-009` | 状态、coverage、errors 不互相替代；含 insufficient samples | 支持当前样本充分性判定；不把 unknown 当 0 |
| `FR-COST-003` / `AC-COST-012` | 三个问题键确定性聚合、分母不足 unknown、count<2 不称常见 | 绑定下方 canonical health 字段，不让页面自由造词 |
| `FR-E2E-001` / `AC-019 (AC-E2E-001)` | fresh Codex 贯通事实到 HTML | D-002/D-004 修订“每类都必须 present”为“每类都有诚实状态；基础链必须 present” |

历史来源锚点：`specs/m15-process-degradation-dashboard/spec.md` 的上述 FR/AC；`specs/m15-process-degradation-dashboard/decision-log.md:83,97` 的“页面范围”与 `insufficient_samples` 条目。

## Expected topology（流程退化判定的唯一基线）

本任务不允许 build-spec 自行发明 expected topology。判定基线固定为：

- **阶段顺序**：`runtime/stage/step-manifest.mjs` 的 `CANONICAL_STAGE_SLUGS`，当前顺序是 `make-decision`、`build-spec`、`build-plan`、`build-code`、`verify-code`；owner 是 WorkflowHub stage runtime，M15 只读消费。
- **阶段与 step**：每个 `workflows/<stage>/steps.json` 的 `schema_version=2.0.0`、`stage_slug`、`steps[].step_id`、`step_slug`、`order`、`depends_on`、`entry_conditions`、`completion_evidence`、`observable_result`；`validateAllStageManifests()` 是结构校验 owner。step 顺序只能按 manifest 的连续 `order` 判断。
- **技能与触发**：每个 `workflows/<stage>/skill-deps.yaml` 的 `skills[]` 是 expected skill topology，字段 `name/path/execution/trigger/bundle/owner` 是 required contract；`trigger=false` 只有带 reason 才是合法 `not_applicable`，`trigger=true` 没有 executed 或明确 unavailable truth 才能形成缺口。
- **artifact/quality 期望**：step manifest 的 `completion_evidence` 和当前阶段已有 `decision-log.md/spec.md/plan.md/tasks.md/quality/*` 合同是 expected evidence；review/test/verify 的原始记录仍由 quality owner 持有，M15 只读其状态和受控 ref，不另建一套 artifact topology。
- **顺序、重试和缺失**：顺序在同一 `run_id + attempt_id` 内按 manifest `order` 判断；每次重试必须有独立 `attempt_id`，重复同一事件按 `fact_id` 幂等。未来 stage 是 `pending`，不能报成缺失；只有观察到更后阶段却缺更前阶段，才是 `evidence_gap`；已登记且适用的 step 顺序错误才是 `out_of_order`。
- **owner/消费者边界**：manifest/skill-deps 的维护者保持既有 owner；runtime 负责观察事实，M15 collector/projector 只负责采集和派生，不能改 topology，也不能把目录扫描、时间顺序或 cwd 猜测当 expected truth。

## 数据状态

- 来源：`unregistered`、`registered`、`unavailable`、`conflict`。`unregistered` 是“入口没有登记 source”这一真实状态，不得静默映射成成功；页面统一进入采集不可用提示，若连覆盖分母也不可得则投影为 `unknown`。
- 事件唯一枚举：`present`、`missing`、`skipped`、`not_applicable`、`unknown`、`unavailable`、`unsupported`、`conflict`、`incomplete`。
- 运行：每次重试有独立 `attempt_id`；重放同一事件幂等。
- 投影唯一枚举：`current`、`partial`、`stale`、`unknown`、`fatal`。
- UI 与投影映射：投影尚未可读时是 UI `loading`；`current` 且范围内有可用任务是 `ready`；`current` 且范围合法但没有任务是 `empty_valid`；`partial` 或 `unknown` 映射 UI `partial` 并显示缺口原因；`stale` 映射 UI `stale`；`fatal` 映射 UI `fatal`。历史 M15 的 `empty` 统一解释为当前 UI 的 `empty_valid`，不再新增 `empty`。
- UI 状态触发条件：`stale` 表示 canonical facts 的输入 hash/revision 已晚于投影记录的 input hash/revision，或新 facts 已追加但尚未重新发布；保留旧快照并显示 generated time/coverage/error。`fatal` 表示 data.js 缺失、顶层 schema/合同不兼容、投影重建失败，或 source identity/path/security 校验失败；不显示伪完整结果，直到上游发布兼容快照。
- 事件到页面的映射：`present`、来源已登记且适用的 `missing`/明确 out-of-order/required artifact mismatch 可进入流程退化统计；`skipped`、`not_applicable` 只展示带理由事实；`unknown`、`unavailable`、`unsupported`、`conflict`、`incomplete` 进入采集不可用/证据不足提示，不进入流程退化统计。
- 常见问题与趋势的受控字段绑定：`failure_domain` 只接受 M14a/当前诊断实现的九个值 `task_dir`、`worktree`、`review`、`verify`、`handoff`、`transcript`、`skill_missing`、`artifact_missing`、`token_waste`；`friction_type` 和 `error_code` 只从 `runtime/schemas/monitoring-fact.v1.json` 的 `health` value 字段读取，并由 `runtime/evidence/monitoring-projector.mjs` 的 `problem` schema 传递，页面不接受自由文本输入或自行补值；字段缺失/unknown 只展示未分类事实，不进入“常见”聚合。
- 缺失来源不能推断为 0；`unknown`、`unavailable`、`incomplete` 不能改写成成功或失败。
- 样本充分性（不是质量评分）由当前筛选的 `in_scope_task_count`、所选视图需要的字段覆盖状态和 time-window 共同决定：有至少一条范围内任务且该视图所需字段均有可回指的完整覆盖时为 `sufficient`；有任务但任一所需字段为 `unavailable`、`unsupported`、`unknown`、`conflict` 或 `incomplete` 时为 `insufficient`；筛选合法但没有范围内任务时使用 `empty_valid`，不把它叫样本不足；任务数或覆盖分母缺失/冲突时为 `unknown`。页面必须同时显示判定、任务数、覆盖字段和原因，不能凭记录条数猜测。
- 各视图的 required field set 固定如下，不能由页面运行时临时猜：任务总览需要 `task_id`、`project_name`、`run_id`、`attempt_id`、stage fact 的 `value.outcome`、`source.status`、`coverage`；流程退化需要 Expected topology 加上 `stage/step/skill/artifact/health/review/verify` facts 的 `status`、`reason/error`、`coverage`、`evidence_refs`；成本归因按所选维度需要对应 `session_id`/`subagent_id`/`stage`/`skill_id` 与 `token.message_id`、`tool_use.tool_use_id`、`duration.duration_ms`、`retry.retry_id`，并要求 `source` 和 `attempt_id`；常见问题与趋势需要 `health.domain`、`health.friction_type`、`health.error_code`、`observed_at`、`coverage`、`source_refs`，趋势还必须有至少两个兼容 time bucket 和可用分母。字段为 unavailable/unsupported/unknown/incomplete 时，该视图只能是 `insufficient` 或 `unknown`，不能报 `sufficient`。

## 成功边界（已确认）

以下验收口径已完成阶段末一致性检查，并经用户最终确认，后续阶段按此执行：

- 一条全新的真实任务从正式入口开始，不手工调用 collector、不靠 fixture。
- runtime 自动写入它真正负责的 task/run/attempt/stage/artifact/test/review/verify 事实。
- 宿主只注册已经证明能提供的 session/transcript/tool/step/skill 等能力；不能提供的明确写 `unavailable`、`unsupported` 或 `unknown`，并带原因和覆盖范围。
- 一条 fresh task 必须闭合“真实正式入口 → canonical facts/evidence → project/global projection → 静态 HTML/真实浏览器”的完整链路。
- 基础链 `task/run/attempt/stage/source status/page state` 必须真实跑通；宿主事件类别不要求全部为 `present`，但每一类都必须有诚实状态，不能漏掉后假装没有该类数据。
- 只有证据证明来源已登记且事件适用时，才按流程退化统计 `missing`、out-of-order 或 required artifact mismatch；source 不可用时只报告记录链问题，不生成一串虚假的 workflow 退化。
- 重试、重复事件、断开 source、投影删除重建都有可验证结果。
- 页面真实实现历史 M15 已承诺的视图和筛选，并通过真实浏览器交互验收；不能用页面字符串存在代替浏览器验收。
- 任务总览的样本充分性按本日志“数据状态”中的固定规则计算；真实浏览器验收至少要看到 `sufficient`、`insufficient`、`empty_valid` 或 `unknown` 之一，同时能读到 `in_scope_task_count`、所需字段覆盖和原因；它不是质量评分，也不能用任务条数单独替代覆盖判断。
- 记录 fresh task 的 `facts.jsonl` 内容 hash，删除 project/global/data.js 派生文件，再只用同一份 canonical facts 全量重建；重建前后投影/data.js 内容一致，facts 行数与 hash 不变，历史 task 文件没有任何写入。

## 时序与方向失效前提

- 证据闭合顺序固定为：先验证真实入口/source/task-run-session 绑定 → 再验证 runtime 的 run/attempt/stage 事实 → 再验证 M14b/M10 caller 和宿主能力状态 → 再验证 facts→projection→HTML → 最后做真实浏览器与删除重建验收；后一步不能替代前一步。这里约束的是证据如何闭合，不约束 build-spec/build-plan 的实现排序、命令或具体文件改动。
- 这不是一次性承诺“所有宿主字段都能采到”。验证发现 source/caller 断链就修对应入口；验证只能证明宿主能力不可用就保留 `unavailable/unsupported/unknown`，页面进入 `partial`，不把流程退化统计扩大。
- 关键前提：正式入口至少能稳定生成并绑定 `task/run/attempt/stage` 基础链，且同一 fresh task 能被页面读回。若该前提失败，本任务只能交付证据缺口和明确延期，不能宣称 M15 基础交付完成；M16 不得消费这条未闭合链。
- 时机边界：本阶段只确认方向和验收口径；实现顺序、命令和具体文件改动留给后续标准阶段，但不得改变这里的 topology、状态和基础链前提。

## 失败或不完整边界

- 只在测试里手工注入 source，真实入口仍无 caller。
- 只证明文件存在、局部测试通过或页面字符串存在，没有一条真实新任务跑通。
- 把 source 未注册变成 step/skill 大量 `missing/unknown`，再据此宣称 workflow 退化。
- 继承历史 M15 的“每个宿主类别都必须产生记录”作为硬要求；本任务改为每类必须有诚实状态，未证明能力允许保持 `unavailable/unsupported/unknown`。
- 重试复用旧 attempt，重复事件重复计数，或重建只能依赖生成投影。
- 页面继续缺少 M15 规定的视图/筛选，或用字符串断言代替浏览器验收。
- 把未知数据填成 0、成功或失败；把 `partial` 隐藏成 `current`。

## 非目标

- 不处理历史数据，不回填旧 M14-M15 任务。
- 不实现 M16 经验回路、自进化候选池、问题候选聚合或改动试验。
- 不自动修改、批准、上线或回退生产 skill。
- 本任务不调用、修改、构建、测试或同步任何外部项目；验收只针对 WorkflowHub 的 M15 看板记录链、投影和页面。历史质量记录中的外部 host 名称只作不可变 provenance，不构成本次执行授权。
- 不把尚未由真实宿主证明的 transcript/tool/token/subagent/step/skill 能力写成已交付能力。
- 不新增 candidate ledger、successor/predecessor、selector、snapshot lineage 或新的公共流程阶段。
- 不用新页面或新投影替代 canonical task facts。

## 风险与延期交接

- 宿主事件能力 spike：负责人是当前修复/验证实现者；触发条件是拿到真实 adapter/source 的稳定注册、事件样本、task 绑定和读取回放证据；消费者是后续 M15 能力扩展或 M16；关闭条件是同一 fresh task 中该能力达到 `present` 并通过完整链路验收；在关闭前保持 `unavailable/unsupported/unknown`。
- M16 候选发现、decision 绑定、改前改后比较、经验回流：交接给未来独立的 M16 `make-decision` 任务；触发条件是本任务完成并有可消费的 canonical facts；消费者是 M16；关闭条件由 M16 自己决定，本任务不补写阈值和 case。
- 自动 canary、稳定版本选择、线上回退：负责人是后续版本/发布能力工作；触发条件是 repo-local skill 具备真实版本切换、止损和回退证据；消费者是后续发布任务；当前保持延期，不声称支持。
- 外部 skill registry 更新检查：交接给 M17a；未具备时页面必须显示 `unavailable`；本任务不新增 registry 控制面。

## 调研输入

本轮不重新发明 M15 需求；既有 M15 decision-log/spec 只作为历史页面契约和原始需求输入，当前方向由本日志和用户 Talk 选择决定：

- 既有 M15 原始决定要求：同一任务先修 M14b 所需 producer/source/index，再做真实诊断与看板；当前 task facts 是唯一权威；M15 只接当前 Codex，不实现多 CLI；至少一条 fresh Codex 真实任务必须完整走到 HTML。
- 既有 M15 页面基线明确：单页四区、七类共享筛选、静态 `data.js`、手动浏览器刷新、`loading/ready/empty/partial/stale/fatal` 状态、历史任务只显示 partial/missing。
- 当前调研确认真正风险在真实入口、source 注册、宿主事件和 M14b/M10 caller 证据未闭合；所以必须先验证根因，再按证据修 producer/source/projector/page。
- M0 的无 caller、dead/orphan、只修写入不验证固定读取路径等教训作为事实和风险输入，不作为质量通过门槛，也不把历史数据迁移纳入当前任务。

## Talk Round 1

### 当前问题

这次 M15 修复，页面范围要做到哪里？数据链修复是必做项，分歧只在是否同时把 M15 原本承诺的页面视图、筛选和真实浏览器验收补齐。

### 选项

1. **只修真实记录链**：把真实入口、source、run/attempt、缺失语义和投影重建修好；页面只做必要的小改动。
   - 后果：范围最小，能先证明数据是真的。
   - 风险：看板仍可能不满足 M15 原先的页面约定，用户仍然看不全。
2. **记录链 + M15 页面契约一起修（推荐）**：除接通真实记录外，补齐 M15 规定的视图、筛选、数据状态提示，并用一条真实新任务做浏览器验收。
   - 后果：M15 才算完整交付，未来 M16 有可靠入口可读。
   - 风险：比只接线多一些工作，但仍不进入 M16。
3. **把 M16 入口也一起做**：在 M15 修复中顺便加入问题候选、经验回路或自进化候选池。
   - 后果：表面上更连续，但会把两个不同目标混在一次交付里。
   - 风险：边界失控，M15 还没证明真实采集，就开始消费不可靠数据。

### 本轮结果

- 用户真实回复：`2`。
- 选择：记录链 + M15 页面契约一起修；M16 不在本任务。
- 开始队列：`[页面契约范围]`；本轮只处理一个决策轴。
- 回答后重排：不适用。单题已闭合；页面契约、真实记录链和 M16 边界按回答落入当前范围，未另开第二题。
- 确认边界：本轮确认了页面范围选择，没有把 hash 重建、样本充分性和 fresh E2E 的具体成功口径伪装成用户已单独确认；这些内容仍是当前决策草稿，统一留到阶段末 spec-analyze 后的最终确认。

## Talk Round 2

### 当前问题

M15 页面要展示很多宿主内部事实，但当前 Codex 运行时并没有证明每一类事件都能稳定提供。首版应怎样处理这条能力边界？

### 选项

1. **保留原承诺，全部都必须采到**：继续把 step、skill、session、subagent、token、duration、retry、tool_use 等都当成首版硬要求。
   - 后果：页面字段最完整，但需要扩展宿主接线和事件协议。
   - 风险：如果宿主实际不给某些事件，就会再次用 fixture 或猜测填空。
2. **先做真实能力确认，再按能力交付（推荐）**：只有真实宿主能稳定提供的事件才列为已支持；不能提供的显示 `unavailable/unsupported/unknown`，但 run/attempt/stage 和页面状态链仍必须真实跑通。
   - 后果：页面可能有明确空缺，但每个数字都说得清来源，后续可逐类补能力。
   - 风险：首版看起来不如原计划“全”，需要把未支持项和交接写清楚。
3. **只保留 task facts，暂时放弃宿主 transcript 成本视图**：只修 canonical facts 和页面基本诊断。
   - 后果：最容易落地，但会删掉 M15 原本的成本归因和 transcript/session 视图。
   - 风险：偏离已确认的 M15 需求。

### 本轮结果

- 用户真实回复：`2`。
- 选择：先证明真实宿主能力，再按能力交付；未证明能力明确显示 unavailable/unsupported/unknown。
- 开始队列：`[宿主能力边界]`；本轮只处理一个决策轴。
- 回答后重排：不适用。单题已闭合；能力确认和缺失语义进入决定，未把 M16 或实现细节提前带入 Talk。

## Talk Round 3

### 审查后唯一待确认问题

我们是否把“先验证根因，再决定修什么”正式写成当前 M15 修复的第一道边界？

### 选项

1. **采用验证优先（推荐）**：先用代码证据和一条 fresh Codex 真实任务闭合最小证据清单；确认入口断链后修复，确认只是来源不可用时就保留 `unknown/incomplete`，不把它写成 workflow 退化。
   - 后果：不会修错问题，页面也不会把采集故障伪装成流程故障。
   - 风险：前置验证可能发现只能证明“没采到”，不能证明“流程坏了”，届时修复范围要收窄。
2. **保持“入口已断”作为当前事实**：直接按现有调研结论进入修复，不再把根因验证作为独立边界。
   - 后果：推进更快。
   - 风险：可能把来源不可用误报成 workflow 退化。
3. **拆成两个任务**：当前只做根因验证，另起任务修复和补页面。
   - 后果：边界最干净。
   - 风险：重复走 WorkflowHub 阶段，当前任务可能只交一份报告。

### 本轮结果

- 用户真实回复：`1`。
- 选择：验证优先；不把尚未证明的“入口断链”写成事实；本任务仍保留经证据支持的修复和页面交付范围。
- 开始队列：`[根因是否已证实]`；本轮只处理一个决策轴。
- 回答后重排：不适用。单题已闭合；验证优先成为 D-003，Grill 再单独处理基础链交付边界。

## 决定

### D-001：记录链与页面一起交付

- **问题/最终选项**：M15 修复是否同时补齐页面契约和真实浏览器验收？选择 `2`。
- **用户选择来源**：当前会话 Talk Round 1 真实回复 `2`。
- **事实来源**：历史 M15 页面基线 `spec.md` 的 `FR-VIEW-001`～`FR-VIEW-003`、`AC-VIEW-016`～`AC-VIEW-018`；当前 R-004、R-007、R-008、R-009。
- **决定**：真实记录链、M15 四区页面、共享筛选、状态提示和一条 fresh 真实任务的浏览器验收都属于当前任务；M16 不属于当前任务。
- **Logic**：原 M15 页面契约 + 用户选择 2 → 数据链与消费端必须一起验收 → 才能交付可核实的 M15，而不是只交一个 producer 或空页面。
- **理由/影响**：范围覆盖 producer/source、canonical facts、projection、静态页面和真实浏览器验收；不改变 M16 的独立边界。
- **后果/风险**：范围比单纯接线大；宿主能力不足时必须显示 unavailable/unsupported，不能扩大承诺或造数据。
- **拒绝方案**：只修记录链会留下页面缺口；把 M16 一起做会混淆交付边界。
- **延期交接**：M16 另起任务从 `make-decision` 开始；本任务只提供可追溯事实和页面消费基础。
- **未决项/负责人**：四区和共享筛选的真实实现与浏览器证明，负责人为后续本任务 build/verify；完成条件为 fresh task 端到端验收材料可读。
- **Supersedes**：none。
- **approval_binding**：Talk 选择已记录；最终确认已完成，详见“最终确认”节及当前任务质量事实。

### D-002：按真实能力交付，不猜宿主事件

- **问题/最终选项**：首版如何处理尚未被真实 Codex 运行证明的事件能力？选择 `2`。
- **用户选择来源**：当前会话 Talk Round 2 真实回复 `2`。
- **事实来源**：当前 R-002、R-003、R-004、R-009；调研报告关于 `stage-runner`、Codex adapter、M14b/M10 caller 和 M15 projection 的结论。
- **决定**：只有真实宿主稳定提供并能绑定到当前 task/run 的事件才列为 `supported/present`；不能提供的事件显示 `unavailable`、`unsupported` 或 `unknown`，不使用 fixture、目录猜测或语义推断填充。run/attempt/stage 以及页面状态链仍必须真实跑通。
- **Logic**：生产 caller 尚未证明覆盖所有宿主事件 → 不能把原字段清单当事实 → 先验证能力并分层声明 → 避免再次交付“字段存在但没有数据”的假完整看板。
- **理由/影响**：诚实交付可证明子集；影响 source registration、Codex adapter、事实状态、页面能力提示、E2E 验收和延期清单，不删除 M15 成本视图方向。
- **后果/风险**：首版可能显示明确能力空缺；收益是每个数字可追溯，未来可按真实 adapter 能力补齐。
- **拒绝方案**：全部事件硬采会诱发 fixture/猜测；只做 task facts 会偏离已确认的 M15 成本归因需求。
- **延期交接**：未被真实能力 spike 证明的事件延期，不得写成当前完成；多 CLI 留给 M17；M16 仍另起任务。
- **未决项/负责人**：每类事件实际状态和原因，负责人为本任务真实 source/adapter 验证；完成条件为 fresh task 的 capability matrix 与事实回放一致。
- **Supersedes**：none；本决定约束历史 M15 spec 中“宿主类别都必须产生记录”的旧硬口径，改为“每类都有诚实状态”。
- **approval_binding**：Talk 选择已记录；最终确认已完成，详见“最终确认”节及当前任务质量事实。

### D-003：先验证根因，再决定修复动作

- **问题/最终选项**：是否把“先验证根因，再决定修什么”作为当前 M15 修复的第一道边界？选择 `1`。
- **用户选择来源**：当前会话 Talk Round 3 真实回复 `1`。
- **事实来源**：方向审查 finding `F-3eeba2cef979`；当前 R-001、R-002；调研报告的代码证据和缺失的 fresh full-chain 证据。
- **决定**：先闭合最小证据清单：真实 source/task-run-session 绑定、runtime run/attempt/stage 事实、Expected topology 的 stage/step/skill/artifact 基线、已声明宿主事件、M14b/M10 正常 caller、facts→projection→HTML 完整链路，以及 `failure_domain` 九值和 `health` 字段绑定是否与当前实现一致。只有证据证明入口断链，才进入对应修复；若只能证明来源不可用或证据不足，则保持 `unknown/incomplete`，不把它称为 workflow 退化；若代码实际值与当前候选契约不一致，以 fresh task 证据修订契约，不静默错绑。
- **Logic**：独立审查指出原始文字包含未证实前提 + 用户要求先检查 → 将根因验证置于修复之前 → 避免错误修复和错误诊断，同时保留 M15 页面交付方向。
- **理由/影响**：不拆成两个 WorkflowHub 任务，但在当前任务内部把检查与修复分开；影响第一阶段验收、范围收窄条件、失败状态和页面消费。
- **后果/风险**：验证可能证明只是采集链缺失，届时流程退化范围必须收窄；若确认断链，按证据修 producer/source/projector/page。前置验证会耗时，但避免重做。
- **拒绝方案**：直接假定入口已断会把采集缺口误报为流程退化；拆成两个任务会重复走流程并延迟已确定的页面修复。
- **延期交接**：M16 仍另起任务；未证实宿主能力仍延期，不能进入当前完成声明。
- **未决项/负责人**：根因证据和对应修复范围，负责人为本任务 build/verify；完成条件为 evidence packet 能逐项回答最小证据清单，包括 topology、`failure_domain` 九值和 `health` 字段绑定；若 fresh task 发现候选代码摘要不成立，负责人必须按事实修订当前契约。
- **Supersedes**：supersedes R-002 中任何把“入口未接入”当作既定事实的旧措辞；保留 R-002 的检查目标。
- **approval_binding**：Talk 选择已记录；最终确认已完成，详见“最终确认”节及当前任务质量事实。

### D-004：基础链可交付，宿主细节保持诚实缺失

- **问题/最终选项**：真实 Codex 暂时无法稳定绑定宿主内部事件时，基础 M15 是否仍可交付？选择 `1`。
- **用户选择来源**：当前会话 Grill 真实回复 `1`。
- **事实来源**：D-002；Grill 退出检查；现有 CONTEXT.md 和 ADR 0012 对 taskPath、registered source、facts、projection、HTML 及失败语义的定义。
- **决定**：只要真实 task、run、attempt、stage、来源状态和页面状态链跑通，M15 基础交付可以完成；transcript、session、step、skill 等未能稳定绑定的细节必须显示 `unavailable/unsupported/unknown`，不能把它们当成 workflow 退化，也不能把空白伪装成完整。
- **Logic**：D-002 按真实能力交付 + Grill 明确基础链与宿主细节分层 → 基础事实可交付、不可证明的细节保持缺失 → M15 不被宿主未承诺接口整体卡死，也不产生假数据。
- **理由/影响**：保留真实记录和页面闭环，把宿主能力边界交给后续 adapter 工作；影响成功标准、页面提示、数据状态和延期交接。
- **后果/风险**：首版可能是 `partial`，但用户能区分“没采到”与“流程没发生”；M16 只能消费已证明事实，不能依赖未支持事件。
- **拒绝方案**：宿主细节缺失就整体不交付会把基础链一起卡死；永久删除宿主事件会偏离已确认的 M15 页面范围。
- **延期交接**：未稳定绑定的宿主事件继续留在 unavailable/unsupported/unknown，待真实 adapter 能力被证明后再扩展；M16 只消费已证明事实。
- **未决项/负责人**：基础链端到端证据和宿主能力矩阵，负责人为本任务 build/verify；完成条件为 fresh task、投影和浏览器证据可互相回指。
- **Supersedes**：none；refines D-002 的成功边界。
- **approval_binding**：Grill 选择已记录；最终确认已完成，详见“最终确认”节及当前任务质量事实。

## 方向审查（Talk Round 2 后）

- **review_ref**：`quality/reviews/results/make-decision-direction-14cc62ed8025dad3e2353274a387e8c54c032591-6b8f28a2-5ca7-4458-bccd-dd89d29edf60.json`
- **review_status**：`available`；异源 advice，仅作事实，不是通过门槛。
- **实际覆盖**：`opencode/v4flash` 有效；`codex/luna` 因与当前宿主同源而排除，记录为 `SAME_SOURCE`，不能冒充第二个独立意见。

### Finding 处置

- **F-3eeba2cef979（major）**：有效。原始需求文字把“真实入口未接入”写成已确认前提，但 source 注册、宿主事件和完整 E2E 未闭合。已修正 R-002，并由 Talk Round 3 选择验证优先；**状态：fixed，用户已确认**。
- **F-3f778d92b79e（minor）**：有效。已把根因确认的最小证据清单写入成功边界、D-003 和延期交接；证据不足保持 `unknown/incomplete`。**状态：fixed**。
- **F-c109923e968e（minor）**：有效。已明确历史 M15 四区、共享筛选和 loading/ready/empty/partial/stale/fatal 状态是当前复用基线，不在后续阶段重新定义。**状态：fixed**。

## Grill 结果

- **Grill 问题**：如果真实 Codex 暂时无法稳定绑定宿主内部的 transcript、session、step、skill 等事件，M15 基础交付怎么办？
- **Grill 选项**：`1` 基础链只要真实 task/run/attempt/stage、来源状态和页面状态链跑通就可交付，未证明的宿主细节显示 unavailable/unsupported/unknown；`2` 宿主细节没有全部采齐就整体不交付。
- **用户真实回复**：`1`。
- **回答后的结论**：基础链可以交付；宿主细节不稳定时必须诚实缺失，不得把缺失算成 workflow 退化。该结论落入 D-004。
- **开始队列/重排**：本次 Grill 只有一个挑战轴 `[基础链是否被宿主细节整体阻塞]`；用户回答后直接收敛为 D-004，没有未处理的并列挑战。
- **status**：`completed`。
- **direction_changing_challenges_resolved**：`true`。
- **CONTEXT.md**：`no-change`。现有术语已经定义 `taskPath`、registered source、facts.jsonl、monitoring evidence、derived projection、missing/unknown/skip fact；本次只应用既有术语，没有新增领域概念。
- **ADR**：`not-needed`。现有 `docs/adr/0012-task-local-monitoring-and-derived-projections.md` 已覆盖 canonical facts、source binding、project/root projection、静态 HTML 和失败语义；本次是 M15 任务边界和验收收敛，不新增架构控制面。
- **ADR 三项判据**：难以反转=`false`；无背景会意外=`false`；存在真实取舍=`true`。已有 ADR 足够，不重复创建。
- **冲突**：`resolved`。旧 M15 文字中的“入口未接入”已改为“先验证再修”；M15 页面四区/共享筛选/状态集沿用既有契约；M16 作为后续独立任务。
- **退出检查**：外部接口=`research_checked（当前 WorkflowHub public runtime、TaskHandle、Codex adapter 边界已核对；source registration、caller 和宿主事件的生产闭合仍待 fresh task，保持 unknown/incomplete）`；规范名称=`pass（taskPath、facts.jsonl、monitoring evidence、project/root projection 与 data.js 均有唯一权威）`；失败语义=`pass（missing/unknown/unavailable/unsupported/partial/stale/fatal 已区分）`；范围边界=`pass（M15 修复与页面契约在内，历史数据和 M16 在外）`。

## 决策草稿状态

- **最近详细审查**：`quality/reviews/results/make-decision-detail-e9bf3ebe2aab16891756d1867e1d21ca239f6aa1-9387ed09-0c5a-48f8-aed5-8b0a64c22353.json`；有效异源 reviewer 为 `opencode/v4flash`，`codex/luna` 记录为 `SAME_SOURCE`，不能当第二个独立意见。
- **F-cc247501a849（minor）**：已修复。页面范围首段已明确包含视图、诊断状态、问题聚合/趋势和 fresh E2E 的完整历史基线。
- **F-8a6857a95714（minor）**：已关闭。此前待用户确认的样本充分性、facts hash 删除重建、fresh E2E 口径已在最终确认中逐项提出并获用户确认。
- **F-2a2355a94baa（minor）**：已修复。页面范围和逐项映射统一使用 `AC-VIEW-016`～`AC-VIEW-018`，不再同时使用 `AC-VIEW-001`～`AC-VIEW-003`。
- **F-2e7a65c36845（minor）**：已修复。D-003 的最小证据清单加入 `failure_domain` 九值、`health` 字段和实现一致性验证；当前代码摘要只作候选锚点，fresh task 不一致时必须修订，不是先验硬承诺。
- **F-58b92a00d623（minor）**：已修复。已把“证据闭合顺序”和“后续实现排序”明确分开；前者是 D-003 的边界，后者留给 build-spec/build-plan。
- **F-91a4cca569ec（minor）**：已关闭。成功边界已从草案转为已确认，用户已确认样本充分性、facts hash 删除重建和 fresh E2E 浏览器口径。

- 当前内容是 make-decision 的需求回放、三轮 Talk 记录、调研事实、方向审查、四个决定和 Grill 结果。
- 当前详细审查已按新材料重跑；最后一轮意见已逐项修复或转为明确的最终确认问题。
- 阶段末 `spec-analyze` 已完成：结果 `consistent`，9/9 条原始需求完成当前材料语义和证据绑定。
- 用户已完成最终确认；当前任务只等待本阶段正式发布，不由 `build-spec` 偷补需求。
- 当前仍没有代码实现许可；正式发布只表示决定已确认，不表示 M15 代码已经完成。

## 最终确认

已完成。用户原话：`确认，继续吧`。

本次确认逐项接受：

1. 是否按 D-001～D-004 的范围、非目标和延期交接推进当前 M15 修复；
2. 是否接受“样本充分性”按视图字段覆盖、任务范围和 time-window 判定，并显示 `sufficient/insufficient/empty_valid/unknown`；
3. 是否接受 fresh task 的 `facts.jsonl` hash、删除派生投影后只用同一份 canonical facts 重建，且前后结果一致、历史 task 不写入；
4. 是否接受 fresh Codex 真实任务闭合“正式入口 → facts/evidence → project/global projection → HTML/浏览器”，宿主未证明能力只显示 `unavailable/unsupported/unknown`，基础链仍必须真实跑通。

这是当前 M15 决策的最终确认，不是代码开始，也不启动 M16。后续阶段只能消费本日志，不能重新发明需求或把 M16 提前带入。

## 质量边界

当前内容是 make-decision 的需求回放、Talk 记录、调研事实、审查和已确认决策，等待本阶段正式发布；不是 spec、plan 或代码完成声明。

## 本轮重新进入 make-decision（2026-08-16）

### 触发与历史处理

- **用户实际回复**：`好的，按照推荐继续吧，从make-decision开始`。
- **本次含义**：允许当前 M15 修复重新进入 make-decision；不是代码实现许可，不是 M16 启动，也不是正式 close。
- **历史处理**：本文件前面的旧 Talk、旧审查、旧确认和旧 stage-outcome 保留为历史事实，不改写、不删除；它们不能替代本轮对真实页面和真实采集结果的验证。旧记录里“决策已确认/待正式发布”的文字不等于 M15 已交付。
- **当前任务边界**：只处理 M15 的新任务真实记录链、投影和原始 UI 契约；不回填历史数据，不实现 M16，不读取或修改 Multica。

### 本轮重新核对的关键事实

1. 历史 M15 任务在真实浏览器中选中后显示 `0/63` steps、`0/30` skills、Token `未采集`，行名只是固定拓扑，不是执行事实。
2. 当前 fresh repair 任务虽然有阶段级结果和总 token，但 `breakdown.step`、`breakdown.skill` 为空，`duration_ms` 为 `null`；这不能证明 step/skill 的真实 token、耗时或证据已接入。
3. 当前 Codex transcript adapter 只有在原始事件明确带有 stage/step/skill 时才会归因；当前真实事件没有稳定的 step/skill 边界。stage-agent bridge 接收外部 execution outcome，尚未证明 WorkflowHub 正式任务入口会自动产生并提交这些 outcome。
4. 当前页面的默认任务、布局、信息层级和原始 UI 设计不一致；页面能显示拓扑名和部分总量，不等于 M15 页面契约已实现。
5. 因此当前结论只能是“真实记录链和页面交付仍未闭合”；不能把采集缺口直接写成 workflow 退化，也不能把空白写成成功。

### 步骤记录

#### Step 1 — load-context

- **结果**：已重新读取当前 make-decision 包、原始 M15 修复材料、当前代码、任务事实、浏览器结果和原始 UI 目录。
- **coverage_disposition**：`current`；本轮复用已有原始需求和调研事实，并追加当前 fresh 浏览器/数据链事实。
- **实际用户回复**：`no_new_requirement`；本轮触发语句只授权重新进入 make-decision。
- **延期/非目标**：历史回填、M16、Multica 均留在本任务外。

#### Step 2 — triage-scope

- **结果**：当前问题不是“再补几个页面字段”，而是“真实执行入口 → 记录事件 → step/skill 归因 → 投影 → 页面”没有形成可验收闭环；页面样式偏离原始 UI 是同一交付缺口的消费端表现。
- **coverage_disposition**：`current`；M15 真实数据链和原始 UI 契约在内，M16 与历史数据在外。
- **实际用户回复**：`no_new_requirement`；当前范围沿用用户此前明确的 M15-only、无历史处理、从 make-decision 开始的要求。
- **仍需 Talk 决定的唯一方向轴**：M15 的完成门槛是否必须包含一条 fresh 真实任务中可回指的 step/skill 状态、token、耗时和证据；如果宿主当前不给这些边界，是否允许在当前 M15 内先修真实执行入口/事件桥接，而不是把页面交付为一张明确但仍不可用的 `unavailable` 看板。

### 本轮未完成声明

- 尚未开始本轮 Talk Round 1 的新方向选择；不能把旧日志里的 D-002/D-004 直接当作本轮对当前真实缺口的最终决定。
- 尚未重新生成本轮 interaction aggregate；不能声称 make-decision 已完成。
- 尚未进入 build-spec、build-plan、build-code 或 verify-code；本轮不允许跳阶段。

#### Step 3 — talk-round-1

- **问题**：M15 什么才算完成？
- **推荐选项**：`1`，本轮必须接通真实 step/skill 数据。
- **用户实际回复**：`1`。
- **选择**：一条新的真实任务必须能显示每个 step/skill 的真实状态、token、耗时和证据；如果宿主当前没有这些边界，本任务必须先修真实执行入口和事件桥，而不是把页面交付成只有 `unavailable` 的空看板。
- **大白话含义**：页面不能只显示“有 63 个步骤、30 个技能”这种目录名；必须能回答某次真实任务每一步、每个技能到底有没有执行、花了多少 token、用了多久、证据在哪里。
- **后果**：工作范围会包含真实入口、事件边界、归因、投影和 UI；M15 的完成时间会比只补页面更长，但交付结果才可用于排查和后续 M16。
- **风险**：如果当前宿主确实不给 step/skill 的开始、结束和 usage 边界，必须先补接线或明确记录失败，不能用平均分摊、目录顺序、fixture 或空值冒充真实数据。
- **队列重排**：已关闭“是否允许以 step/skill unavailable 收口”这一轴；下一队列是 `[真实执行入口和 step/skill 事件边界调研]`，然后才决定具体修复动作。
- **coverage_disposition**：`current`；这是用户对当前 M15 完成门槛的真实选择，不是旧日志推断。
- **Approval binding**：当前 Talk 选择已记录；最终 make-decision 确认尚未发生。

### D-005：M15 必须交付真实 step/skill 事实

- **问题/最终选项**：M15 是否允许在 step/skill 没有真实状态、token、耗时和证据时收口？选择 `1`：不允许。
- **Recommendation**：推荐；它直接对应用户反复指出的“页面看不见具体数据，不能验收”的核心问题。
- **Plain-language meaning**：固定拓扑名不算执行记录；每个真实任务的 step/skill 必须有可回指的执行结果和成本事实，缺口必须先修真实入口或明确失败，不能把空看板当成完成。
- **Decision**：当前 M15 的完成边界提升为：fresh 真实任务闭合正式入口 → step/skill 事件 → canonical facts/evidence → projection → 原始 UI 页面；step/skill 的状态、token、耗时、证据必须来自真实事件或受控 outcome，不能推算。
- **Source**：用户实际回复 `1`；当前浏览器事实 `0/63`、`0/30`；当前 repair projection 的 `breakdown.step=0`、`breakdown.skill=0`、`duration_ms=null`。
- **Facts and constraints**：历史数据不回填；M16 不在当前范围；Multica 不在当前范围；`unavailable/unknown` 只能表示真实能力或采集失败，不能成为本任务的默认完成形态。
- **Logic**：用户核心问题是无法确认真实执行 → 只有真实 step/skill 证据才能确认 → 当前 M15 必须修入口和事件链 → 页面只消费可回指事实。
- **Impact**：影响 WorkflowHub 正式任务入口、stage-agent host bridge、Codex adapter、facts schema、token/duration attribution、projection、原始 UI 和 fresh browser E2E；不改变 M16 的独立任务边界。
- **Rejected alternatives**：`2` 只交基础链会继续留下不可用看板；`3` 延期到 M16 会把 M15 的核心承诺继续拖延。
- **Unresolved**：真实 host 是否已经有可用的 step/skill start/end/usage 事件；如果没有，当前 M15 要补到哪一个最小 host 接口；负责人为本任务后续调研与实现。
- **Supersedes**：在当前 M15 完成边界内 supersedes 旧 D-004 中“宿主细节缺失时基础链仍可交付”的宽松收口；旧 D-004 保留为历史决策事实，不改写。
- **Approval binding**：Talk Round 1 已由用户选择；最终决定卡尚未确认。

#### Step 4 — research-inputs

- **结果**：内部代码、M0/M10/M14/M15 材料和外部官方资料均已核对；研究结果支持继续修真实入口和事件边界，不支持把固定拓扑或比例分摊当作真实记录。
- **实际用户回复**：`no_new_requirement`；本步是 Talk Round 1 选择后的必要事实研究，不新增用户方向。
- **coverage_disposition**：`current`；研究结论已落入当前决策草稿，仍待 Talk Round 2 选择具体接线方向。

##### 内部研究结论

1. `tools/host/workflowhub-stage-agent-bridge.mjs:6-10` 明确说明 bridge 只接收外部已经产生的 execution result，不启动 agent、不解析 skill、不扫描 session、不猜 source。
2. `tools/host/workflowhub-stage-agent-protocol.mjs:69-109` 生成的是待替换模板：step/skill cost 都是 `unavailable`，evidence 是 `stage-agent-template`，不是本次执行结果。
3. `runtime/stage/stage-runner.mjs:376-381` 的 stage runner 读取外部提交的 outcome；它不执行宿主 Stage Agent，因此不可能自己产生每个 step/skill 的开始、结束和 usage。
4. `runtime/evidence/codex-transcript-adapter.mjs` 只有在原始 payload 已带 `stage/step/skill` 时才会绑定归因；当前真实 transcript 没有稳定的这些字段。`tools/cli/stage-runtime.mjs` 在 source 缺失时仍会批量生成拓扑缺口，导致一个采集断点膨胀成大量 step/skill `missing/unknown`。
5. `docs/research/m16-experience-loop-repair-research.md:225-250,252-292,374-382` 已记录：M10/M14 caller 没接正式入口；测试 fixture 和局部绿不能证明生产链；修复顺序应先做真实 host capability spike，再接入口、修正缺失语义、重建投影、做 fresh E2E。

##### 外部研究结论（AnySearch，官方资料）

1. OpenAI Codex 官方 hooks 文档：Codex 可在 `SessionStart`、`SessionEnd`、`PreToolUse`、`PostToolUse`、`SubagentStart`、`SubagentStop`、`Stop` 等生命周期点运行 hook。它能提供宿主生命周期观察入口，但文档没有把 WorkflowHub 的 stage/step/skill 语义自动赋给这些事件；后半句是结合本项目的工程推论。来源：`https://developers.openai.com/codex/hooks`。
2. OpenAI Agents SDK 官方 tracing 文档：默认 trace/span 能覆盖 task、agent、turn、generation、function/tool 等层级，并带开始/结束时间和 token usage；也支持 custom span。它证明“要做成本归因必须有明确 span 边界”的设计方向，但当前 WorkflowHub 使用的是 Codex CLI host bridge，不是 Agents SDK，不能直接当成本地已有能力。来源：`https://openai.github.io/openai-agents-js/guides/tracing/`。
3. OpenAI Agents 官方 observability 文档把 tracing 定位为调试真实 workflow 的结构化记录，覆盖 model call、tool call、handoff、guardrail 和 custom span；这支持把 M15 的采集挂在真实执行边界，而不是从最终文本倒推。来源：`https://developers.openai.com/api/docs/guides/agents/integrations-observability`。

##### 研究后的直接结论

- Codex hooks/tracing 可以作为 host source 的候选入口，但不能替 WorkflowHub 自己发出稳定的 `stage/step/skill` 生命周期事件。
- 要满足 D-005，当前最小可行方向是：WorkflowHub 正式 stage 入口生成并绑定 task/run/attempt/stage/step/skill context；真实 host 在该 context 下报告 start/end/result/usage；adapter 只接收有 source ref 的结构化事件；facts 和页面只读这些事实。
- 如果真实 host 只能提供 session/tool/transcript，不能提供 step/skill usage，就必须在 fresh spike 中明确失败；不能用 Codex hook 的时间顺序、目录顺序或平均分摊补出 step/skill 成本。
- **研究状态**：`available`；没有把外部资料当成本地实现证明，也没有新增公共命令或第二套事实存储。

#### Step 5 — talk-round-2

- **问题**：真实 step/skill 数据应该怎样接入？
- **推荐选项**：`1`，由 WorkflowHub 正式执行入口统一发出 step/skill 边界，host adapter 回报真实 usage。
- **用户实际回复**：`1`。
- **选择**：WorkflowHub 负责生成并传播 task/run/attempt/stage/step/skill context；每个 step/skill 需要明确开始、结束、结果、token、耗时和证据边界；host 只能提交真实 source 绑定的 usage，adapter、facts、projection 和页面不得猜测或分摊。
- **大白话含义**：不能等任务最后结束了再拿一份“看起来像结果”的模板填页面；任务执行到哪一步，系统就必须知道当前上下文，结束时把这个上下文和真实成本一起写下来。
- **后果**：后续实现必须同时改正式 stage 入口、host bridge/protocol、Codex source adapter、canonical facts、projection、原始 UI 和 fresh E2E；不会只改页面。
- **风险**：Codex host 可能只能提供整轮或整次调用的 token，不能精确分到 skill；这种情况下必须在 fresh capability spike 中暴露为失败或不可归因，不能把总量平均摊给各 step/skill。
- **队列重排**：Talk Round 2 已关闭“入口接线方式”这一轴；下一步先做一次异源方向 advice，再用 Talk Round 3 处理其盲点、冲突和剩余风险。
- **coverage_disposition**：`current`；用户选择同时覆盖架构方向和页面真实可用性目标。
- **Approval binding**：Talk Round 2 已由用户选择；最终 make-decision 确认尚未发生。

### D-006：正式入口负责发出 step/skill 上下文

- **问题/最终选项**：step/skill 的真实边界由谁产生？选择 `1`：WorkflowHub 正式执行入口产生，host adapter 只回报真实 usage。
- **Recommendation**：推荐；它让每条成本和证据从产生位置开始绑定，避免继续依赖手工 outcome 或静态模板。
- **Plain-language meaning**：系统自己知道“现在正在执行哪个 step/skill”，host 只提供它实际看到的 token、工具、session 和时间；两者用同一 task/run/attempt 关联。
- **Decision**：建立一个由现有 stage runtime 私有实现承载的执行上下文传播和 step/skill 生命周期记录；不新增公共第八类命令，不新增第二套事实存储。每个事件必须有 source、task/run/attempt 和证据回链；无法精确归因的 usage 保留为未归因事实，不拆给 step/skill。
- **Source**：用户实际回复 `1`；AnySearch 官方资料确认 hooks/tracing 需要明确生命周期/span，但不会自动生成 WorkflowHub 语义；当前代码 bridge/runner 不产生真实 step/skill outcome。
- **Facts and constraints**：M15 只处理新任务；历史不回填；M16 不提前实现；Multica 不在范围；当前四份材料和 `facts.jsonl` 是唯一事实源；评审只提供 advice。
- **Logic**：当前外部 outcome producer 未接通 → 继续依赖外部模板会复现空看板 → 正式入口必须先产生稳定上下文 → host adapter 才能把真实 usage 绑定到正确对象 → 页面才能显示可核实结果。
- **Impact**：影响 stage runtime 私有执行路径、host bridge/protocol、source registry、Codex adapter、monitoring fact schema/attribution、projection 和 UI；不引入 OTel 作为新的 WorkflowHub 控制面，外部 tracing 只作可选 source/设计参考。
- **Rejected alternatives**：`2` 继续外部最终 outcome 会保留当前 producer 断链；`3` 引入通用 OTel 会扩大范围且不能替代 WorkflowHub step/skill 语义。
- **Unresolved**：Codex host 可提供的最小 usage 粒度、step/skill 生命周期如何在真实入口传播、并发/重试/子代理如何保持唯一绑定；由后续 direction advice、Grill 和实现阶段按事实继续收敛。
- **Supersedes**：在当前 M15 修复范围内 supersedes 旧 D-002 关于“宿主细节只按能力存在即可交付”的宽松路径；旧历史记录保留。
- **Approval binding**：Talk Round 2 已由用户选择；最终决定卡尚未确认。

#### Step 6 — direction-advice

- **review_ref**：`quality/reviews/results/make-decision-direction-68652f83f384e7c390bc4ddd24358ff9172a2557-03fb4ded-b4e2-4d50-b81c-4a8c5780f7b9.json`
- **attempt_ref**：`quality/reviews/attempts/03fb4ded-b4e2-4d50-b81c-4a8c5780f7b9/attempt.json`
- **report_ref**：`quality/reviews/reports/03fb4ded-b4e2-4d50-b81c-4a8c5780f7b9.md`
- **review_status**：`available`；终态 `semantic`；这是异源 advice，不是通过门槛，也不替用户做决定。
- **实际覆盖**：`parallel_external`；2/1 个有效 reviewer（`opencode/v4flash`、`codex/luna`）；无重试、无超时、无 provider unavailable、无 `SAME_SOURCE` 排除。
- **实际传输事实**：`opencode/v4flash` 在 113231ms 完成，usage 为 total 4042/input 1661/output 449/reasoning 12/cache read 1920；`codex/luna` 在 145361ms 完成，usage unavailable。未把 unavailable 改写成 0。

##### 原始 findings 与处置

- **F-3bb396b11e16（major/actionable）**：`“可核实”`没有定义谁是权威、什么是合法关联、0 和 unknown 如何区分、证据怎样回链。**当前处置：`needs_human`；在 Talk Round 3 固定字段权威和验收语义。**
- **F-48c61a0ae6d8（major/actionable）**：`“正式入口”`没有定义清楚；当前 bridge 和 runner 都可能被误称为入口。**当前处置：`needs_human`；在 Talk Round 3 固定真实 E2E 的唯一入口。**
- **F-65e96f7cf11a（major/actionable）**：原始页面的四区、共享筛选、状态和证据行为没有在本轮盲审材料里写成可验收条件。**当前处置：`needs_human`；沿用本日志已有原始 UI 基线，并在 Talk Round 3 明确不允许以新页面替代。**
- **F-e6e3c71533d7（major/needs_corroboration）**：step/skill 的 token 和耗时权威来源尚未被 fresh 全链证明；如果 host 只能给整轮成本，D-005 的硬要求可能暂时无法满足。**当前处置：`needs_human`；不得放宽要求，先用真实入口和真实 host capability 证明或暴露失败。**
- **F-f05e8cc60d2b（major/actionable）**：当前 `breakdown.step=0`、`breakdown.skill=0`、`duration_ms=null`，还没有 fresh 全链成功标准，不能宣称结果已实现。**当前处置：`needs_human`；把 fresh E2E 的成功/失败边界写入后续当前材料。**
- **F-ea6a9ed44f65（major/actionable）**：内部事实摘要缺少逐项可追溯的路径、记录或行锚点。**当前处置：`needs_human`；后续材料和实现证据必须回到代码、facts、review 或浏览器记录。**
- **F-20fa702a756b（minor/nonblocking）**：objective facts 混合了观察事实、系统断言和硬约束，且没有逐事实来源。**当前处置：`needs_human`；不改变方向，补齐事实类型和来源。**
- **F-4d2156c4ea55（minor/nonblocking）**：原始四区、共享筛选、状态和证据链接是否仍在范围内没有在盲审包中逐项重申。**当前处置：`needs_human`；按用户此前确认的 M15 原始 UI 契约保留，不新增页面范围。**

- **advice 结论**：审查没有否定“WorkflowHub 正式入口发边界、host 回报真实 usage”这个方向；它指出该方向还缺三条硬定义：唯一正式入口、每个字段的权威来源与缺失语义、原始 UI 的可验收范围。当前不进入代码，也不把 review 写成 pass。
- **coverage_disposition**：`current`；审查事实已记录，剩余方向问题交 Talk Round 3。
- **实际用户回复**：`no_new_requirement`；本步只记录异源建议，不新增用户需求。

#### Step 7 — talk-round-3

- **问题**：什么才算 M15 的真实正式入口？
- **推荐选项**：`1`，只有真实的 WorkflowHub `run` 执行链算正式入口：`WorkflowHub run → stage runtime → 私有 bridge → host → facts → projection → 页面`。
- **用户实际回复**：`1`。
- **选择**：正式证据必须从 WorkflowHub 真实 `run` 入口开始；直接调用 bridge、手工提交 stage outcome、fixture、局部脚本和只加载 HTML 都不算生产链闭合。
- **大白话含义**：不能再拿“bridge 能接收一份结果”当作“真实任务已经接入”。必须从用户真正启动任务的地方开始，系统一路记录到页面。
- **后果**：后续实现要接真实 `run` 启动链，给每次 task/run/attempt 绑定 stage/step/skill 上下文，再让 bridge 和 host 回报真实事件；fresh E2E 也必须从这个入口启动，不能从 bridge 或已有 facts 开始。
- **风险**：如果真实 host 仍不能回传 step/skill 的 token、耗时、状态和证据，fresh E2E 会失败；这表示当前 M15 仍未完成，不能用 `unavailable` 把硬性要求绕过去，也不能用总量平均分配。
- **排除项**：`2` 会继续允许绕开真实任务入口，容易重现当前假数据；`3` 会引入外部启动加旁路注册的双入口，增加并发、重试和子代理串绑风险。
- **coverage_disposition**：`current`；这是用户对当前 M15 真实交付边界的实际选择。
- **Approval binding**：Talk Round 3 已由用户选择；还要经过 Grill 和最终确认，不能把本步直接当作 make-decision 完成。

### D-007：真实 WorkflowHub run 才是 M15 的验收起点

- **问题/最终选项**：生产闭环从哪里开始？选择 `1`：从真实 WorkflowHub `run` 入口开始。
- **Recommendation**：推荐；它直接堵住当前“只调用 bridge/只生成模板/只加载页面却宣称接入”的漏洞。
- **Decision**：M15 的 fresh 任务必须由真实 WorkflowHub `run` 入口启动，并在同一条链上产生 task/run/attempt、stage/step/skill 上下文、host source 事件、canonical facts、derived projection 和原始 UI 页面结果。bridge 是私有适配器，不是独立的生产入口。
- **Source**：用户实际回复 `1`；方向审查 F-48c61a0ae6d8 指出 formal entry 未定义；当前代码事实见 `runtime/stage/stage-runner.mjs:376-381`、`tools/host/workflowhub-stage-agent-bridge.mjs:6-10`。
- **Facts and constraints**：直接 bridge、手工 outcome、fixture、静态 HTML、旧 facts 重放均不能作为 fresh 生产链证据；历史不回填；M16 和 Multica 不在范围。
- **Logic**：当前 bridge 只转交外部结果，runner 也不启动 host → 绕过真实 run 就无法证明任务执行 → 必须以真实 run 作为唯一验收起点 → 所有后续事实必须能回指这次 run。
- **Impact**：影响实际 run launcher、stage runtime 私有上下文、bridge/protocol、Codex adapter、facts/projection、原始 UI 和端到端测试；不新增公共第八类命令，不新增第二事实存储。
- **Rejected alternatives**：外部最终 outcome 作为入口；bridge 单独作为入口；外部 host 加旁路注册作为第二入口。
- **Unresolved**：真实 `run` 当前调用链的具体 host 调用点、step/skill 生命周期传播方式、host usage 粒度、并发/重试/子代理唯一绑定，下一步先通过 Grill 和实现前 capability spike 继续验证。
- **Supersedes**：在当前 M15 修复范围内 supersedes 旧材料中允许 bridge/外部 outcome 单独证明接入的宽松解释；旧历史事实保留。
- **Approval binding**：Talk Round 3 已由用户选择；最终 make-decision 确认尚未发生。

## Grill 结果（本轮）

### Grill 问题 1：host 只能给整次任务的 token 怎么办？

- **场景**：真实 WorkflowHub `run` 已启动任务，但 Codex host 只能返回整次任务的总 token，不能说明每个 step/skill 各自用了多少。
- **推荐选项**：`1`，M15 不能因此收口；总量可以记录为“未归因成本”，但不能平均分给 step/skill，也不能把页面交付成已完成。
- **用户实际回复**：`1`。
- **结论**：M15 的 fresh 验收必须证明 step/skill 的真实 token、耗时、状态和证据。host 只能提供整次总量时，系统必须保留这个总量并明确标成未归因，同时把 M15 继续标为未完成，直到真实 host 事件能绑定到对应 step/skill。
- **禁止做法**：按步骤数量平均分配、按时间比例分配、用目录顺序猜测、用 `0` 或空白冒充已采集。
- **coverage_disposition**：`current`；用户已明确选择，方向性风险已收敛。
- **CONTEXT.md**：`no-change`；没有新增领域术语，只明确现有“未归因/缺失”事实不能冒充完成。

### Grill 问题 2：任务中途失败或重试，step/skill 的记录怎么算？

- **场景**：一个 step 执行失败后重试，或者一个 skill 被调用两次；页面要不要把两次记录合在一起？失败的那次要不要隐藏？
- **推荐选项**：`1`，每次实际执行都单独记录；页面默认按最终结果汇总，但必须能展开看到每次尝试、失败原因、token、耗时和证据。

请回复 `1`、`2` 或 `3`：

1. 每次执行单独保留，最终结果另做汇总（推荐）。
2. 只保留最后一次，前面的失败记录不显示。
3. 把多次执行直接合并成一个总数，不保留尝试过程。

### Grill 问题 2 结果：失败和重试必须保留

- **用户实际回复**：`1`。
- **结论**：每次真实执行都单独保留；最终状态可以汇总，但不能覆盖失败尝试。每次尝试都要有自己的状态、token、耗时、失败原因和证据，页面需要能从汇总展开到具体尝试。
- **原因**：否则无法判断“第一次失败、第二次成功”还是“只有第二次真的执行过”，也无法为后续经验回路提供可靠事实。
- **coverage_disposition**：`current`；本轮 Grill 选择已记录。

### Grill 问题 3：两个 step/skill 同时运行怎么办？

- **场景**：任务里两个 step 同时执行，或者同一个 skill 被两个子任务同时调用。如果事件先后顺序混乱，系统怎么保证 token、耗时和证据不会串到另一个 step/skill？
- **推荐选项**：`1`，每次实际执行都生成唯一的执行编号；所有开始、结束、token、失败和证据都必须带这个编号，并且同时带上它属于哪个 task、run、attempt、step、skill。页面按编号归类，不按事件到达顺序猜。

请回复 `1`、`2` 或 `3`：

1. 每次执行用唯一编号绑定全部数据（推荐）。
2. 按事件到达顺序配对，先到的算前一个。
3. 遇到并发就合并成一个 step/skill 记录。

### Grill 问题 3 结果：每次执行必须独立绑定

- **用户实际回复**：`1`。
- **用户补充的原始目标**：所有 step 和 skill 的执行都要仔细统计；最终要知道每个 step/skill 的成本，以及它对整体流程的影响，用于后续优化整个流程。
- **结论**：每次执行都必须有唯一编号；开始、结束、状态、token、耗时、失败、重试和证据全部用这个编号绑定，不能按到达顺序猜，也不能把并发执行合成一条。页面同时提供单次记录、按 step 汇总、按 skill 汇总和全任务总量，并且不能重复计算总量。
- **对后续 M16 的意义**：M15 先把真实成本和运行影响记录准确；M16 再基于这些事实做经验回路和候选池，不能反过来用 M16 的评分掩盖 M15 的采集缺口。
- **coverage_disposition**：`current`；用户补充的优化目标纳入当前 M15 的数据完整性要求，但不提前实现 M16。

### Grill 问题 4：M15 里的“影响”具体记录什么？

- **场景**：你说要知道 step/skill 对整体流程的影响。当前 M15 应该先记录哪些能直接从真实执行证明的影响？
- **推荐选项**：`1`，M15 只记录运行事实：成功/失败、是否重试、是否阻塞后续步骤、token、耗时、证据，以及它在全任务成本中的占比。以后 M16 再基于这些事实做经验评分、优化建议和候选池。

请回复 `1`、`2` 或 `3`：

1. 先记录可证明的运行影响，优化评分放到 M16（推荐）。
2. M15 现在就加入质量评分和优化建议。
3. 只记录 token 和耗时，不记录成功、失败、重试和阻塞影响。

### Grill 问题 4 结果：M15 先记录运行事实

- **用户实际回复**：`1`。
- **结论**：M15 只记录真实可证明的运行影响：成功/失败、重试、是否阻塞后续、token、耗时、证据和全任务成本占比。经验评分、优化建议和候选池留给 M16。
- **原因**：先把“发生了什么”记准，后面才有资格判断“怎么优化”；不能用还没有证据的评分掩盖采集问题。
- **coverage_disposition**：`current`；M15/M16 边界已进一步固定。

### Grill 问题 5：某个 step/skill 没有数据时，页面显示什么？

- **场景**：某个 step 没执行、执行了但没有回传成本、执行失败、宿主不支持细粒度 token，或者记录还没传完。这些情况不能都显示成同一个 `0`。
- **推荐选项**：`1`，分别显示真实状态：未执行、成功、失败、重试中、数据未到、宿主不支持、无法归因等；没有证据就显示缺失原因，不显示 `0`，也不把它算进“已采集”的分母。

请回复 `1`、`2` 或 `3`：

1. 区分不同缺失原因，不能用 0 代替（推荐）。
2. 没有数据统一显示 0，方便计算。
3. 没有数据的 step/skill 直接隐藏。

### Grill 问题 5 结果：缺失原因不能混成 0

- **用户实际回复**：`1`。
- **结论**：step/skill 必须区分未执行、成功、失败、重试中、数据未到、宿主不支持和无法归因等状态；没有证据时显示具体缺失原因，不显示 `0`，也不算作已采集。
- **原因**：`0 token` 可能代表真的没花 token，也可能代表根本没采到数据；两者不能混为一谈。
- **coverage_disposition**：`current`；缺失语义已收敛。

### Grill 问题 6：step/skill 的总数和覆盖率怎么算？

- **场景**：不同任务的 step/skill 数量可能不同。页面不能再把固定的 `63` steps、`30` skills 当成所有任务的总数，也不能只显示已经采到的项目来制造高覆盖率。
- **推荐选项**：`1`，总数来自当前选中任务的真实 manifest；“已采集”只统计当前这次 run/attempt 中有完整真实证据的 step/skill；没执行、数据缺失、不支持和无法归因分别显示，分母不能偷偷缩小。

请回复 `1`、`2` 或 `3`：

1. 每个任务使用自己的真实清单，分母固定，缺失单独显示（推荐）。
2. 沿用页面当前固定的 63 steps、30 skills。
3. 只统计已经采到数据的 step/skill。

### Grill 问题 6 结果：覆盖率使用当前任务自己的清单

- **用户实际回复**：`1`。
- **结论**：每个任务从自己的真实 manifest 取得 step/skill 总数；当前 run/attempt 中有完整证据的才算已采集；缺失、不支持、无法归因单独显示；分母不能因为缺数据而缩小。
- **原因**：固定拓扑会把目录名冒充执行记录，只统计已采集项目又会把缺口藏掉。
- **coverage_disposition**：`current`；覆盖率分母已收敛。

### Grill 问题 7：页面详情到底对应哪一次任务？

- **场景**：页面左边可能有多个任务、多个 run 和多次重试。右边详情如果把不同任务的数据混在一起，就无法判断某个 step/skill 的 token 和失败到底属于哪次执行。
- **推荐选项**：`1`，详情只显示用户明确选中的 task + run + attempt；左侧可以显示各任务摘要，但不能把其他任务的 step/skill、token 或失败混进当前详情。没有明确选择时显示“请选择任务”，不自动拼接一份看似完整的总览。

请回复 `1`、`2` 或 `3`：

1. 详情严格绑定选中的 task/run/attempt（推荐）。
2. 自动取所有数据里最新的一份。
3. 把多个任务合并成一张总表。

### 对 Grill 问题 7 的纠正

- **用户质疑**：`一个完整的workflowhub任务怎么会有多次记录呢？`
- **事实核对**：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/m15-runtime-observability-repair/task.json` 只有一个 `task_id`，且明确是 `record_model: vnext-single-write`。`facts.jsonl` 中的多行不是多条任务，而是同一个任务执行过程里的不同事实，例如 stage、step、skill、token、tool、失败和证据；这些事实都带同一个 `task_id`，有些还带执行编号。
- **当前代码依据**：`runtime/evidence/monitoring-facts.mjs` 把 stage/step/skill/session/token/tool_use/duration/retry 等定义为不同事实类型；这意味着“一条任务”本来就会有多条明细记录，但不等于用户要看到多条任务。
- **纠正后的大白话结论**：用户看到的主页面应该是一条完整 WorkflowHub 任务。多条明细只是在后台支撑这条任务的步骤、技能、成本和证据；只有真的发生失败重试时，才在对应步骤下面展开重试过程。不能把内部执行编号变成让用户自己选择的复杂入口。
- **当前页面的问题**：它把不同任务、旧记录和修复记录混在一起，又把明细压成固定拓扑，所以看起来像“有很多记录但没有一条完整任务”。这是页面组织和数据筛选问题，不是需求要求用户管理多个任务。
- **原问题处理**：撤回 `task + run + attempt` 作为用户界面选择题；这几个字段继续留在后台用于防止数据串联，但不暴露为普通用户的主操作。

### Grill 问题 7（改成大白话）

- **问题**：页面是否应该只展示一条用户选中的完整 WorkflowHub 任务？后台的多条明细只用于显示 step/skill 成本和证据；只有真的重试时，才在对应位置展开重试过程？
- **推荐选项**：`1`。

请回复 `1` 或 `2`：

1. 主页面只看一条完整任务，后台明细自动归到它下面（推荐）。
2. 让用户自己在多条内部记录之间切换。

### Grill 问题 7 结果：用户只看一条完整任务

- **用户实际回复**：`1`。
- **结论**：主页面只展示一条用户选中的完整 WorkflowHub 任务；后台多条事实自动归到这条任务下面，用于显示 step/skill、成本和证据。内部执行编号不作为普通用户的主操作；只有确实发生重试时，才在对应 step/skill 下展开重试过程。
- **原因**：用户关心的是“这条任务做得怎么样”，不是管理后台事件记录。内部编号只负责防止数据串错。
- **coverage_disposition**：`current`；页面主视图边界已收敛。

### Grill 问题 8：任务还在执行时，页面显示什么？

- **场景**：任务还没结束，step/skill 和 token 还在不断产生；或者任务已经结束，但有些数据没有传回来。页面怎么显示，才能不把半成品当成完成？
- **推荐选项**：`1`，页面明确显示“执行中、数据还在收集、已完成、部分缺失、数据过期或失败”等状态。只有真实任务结束并完成必需数据检查，才显示完成；缺的数据要说明原因。

请回复 `1`、`2` 或 `3`：

1. 明确显示当前状态，未完成就不冒充完成（推荐）。
2. 直接显示最近一次已有结果，当成完成。
3. 数据没齐就整页空白。

### Grill 问题 8 结果：页面必须诚实显示任务状态

- **用户实际回复**：`1`。
- **结论**：页面必须明确区分执行中、数据收集中、已完成、部分缺失、数据过期和失败。只有真实任务结束且必需数据检查完成，才能显示完成；缺失数据要说明原因，不能用最近快照冒充最新完成结果，也不能用整页空白掩盖问题。
- **原因**：用户需要知道“任务还没结束”“任务结束但数据没回来”和“任务真的成功”是三件不同的事。
- **coverage_disposition**：`current`；页面状态边界已收敛。

### Grill 问题 9：同一笔 token 怎么避免算两次？

- **场景**：一个 skill 在某个 step 里执行。页面既要显示这个 skill 花了多少 token，也要显示这个 step 花了多少 token，还要显示整个任务总 token。怎么保证总数不被重复加大？
- **推荐选项**：`1`，同一笔真实成本只记一次。step 视图和 skill 视图只是从不同角度查看它；整个任务总量只按原始执行记录加一次，页面明确说明各层是查看方式，不是再加一遍。

请回复 `1`、`2` 或 `3`：

1. 原始成本只算一次，step/skill 只是不同查看角度（推荐）。
2. step 总量和 skill 总量相加，作为任务总量。
3. 只显示任务总量，不显示 step/skill 成本。

### Grill 问题 9 结果：总成本只按原始记录计算一次

- **用户实际回复**：`1`。
- **结论**：同一笔真实成本只计算一次。step 视图和 skill 视图只是查看同一笔成本的不同角度；任务总量只按原始执行记录相加，不能把 step 总量和 skill 总量再次相加。
- **原因**：否则页面显示的总 token 会比真实任务多，后续优化判断会被错误数据带偏。
- **coverage_disposition**：`current`；成本汇总规则已收敛。

### Grill 问题 10：每个 step/skill 的证据要能查到哪里？

- **场景**：页面显示某个 step 成功、用了 1000 token、耗时 10 秒。用户点击证据后，应该能看到这次真实执行对应的来源，而不是一个通用模板链接。
- **推荐选项**：`1`，每条状态、成本和耗时都链接到这次真实执行的具体证据；如果没有具体证据，就明确显示“证据缺失”，不能用通用模板、目录名或旧记录冒充。

请回复 `1`、`2` 或 `3`：

1. 每条数据都回到对应的真实证据（推荐）。
2. 所有 step/skill 共用一个总证据链接。
3. 页面不需要证据链接，只显示数字。

### Grill 问题 10 的冲突记录

- **用户实际回复**：`3`。
- **冲突**：这个选择会让页面只显示数字，不提供核对来源；它和用户此前反复确认的“无证据不能接受”、D-005 的“状态/token/耗时/证据必须可回查”，以及原始 UI 的证据区域冲突。
- **当前处置**：`needs_human`；暂不把 `3` 写成最终决定。若真的没有证据，页面上的数字无法证明是真的，M15 仍然不能按当前原始需求完成。
- **大白话后果**：你看到一个 step 显示 `1000 token / 10 秒`，但点不到、查不到它来自哪次真实执行；这和现在“页面数字不可信”的问题没有本质区别。

### Grill 问题 10 重新确认结果：显示证据编号和来源

- **用户重新回复**：`2`。
- **结论**：页面不要求点击跳转，但每条 step/skill 状态、token 和耗时必须显示可手动核对的证据编号和来源；没有对应证据就显示证据缺失，不能只给数字。
- **原因**：保留页面简洁，同时让用户能判断数字是否来自真实执行。
- **coverage_disposition**：`current`；已解决此前“只显示数字”与原始可核查要求的冲突。

### Grill 问题 11：证据编号有了，但内容打不开怎么办？

- **场景**：页面有证据编号和来源，但来源文件不存在、内容损坏、权限不可读，或者编号指向旧记录。这样的数字能不能算已证明？
- **推荐选项**：`1`，不能算已证明。页面显示“证据不可用”，相关数据标成部分缺失；任务不能因为有一个编号就显示完整完成。

请回复 `1`、`2` 或 `3`：

1. 编号和内容都能核对才算有证据（推荐）。
2. 只要有编号就算有证据。
3. 证据打不开时隐藏这一行。

### Grill 问题 11 结果：证据必须能实际核对

- **用户实际回复**：`1`。
- **结论**：证据编号存在不代表证据有效；只有编号和内容都能核对，才算有证据。来源不存在、损坏、不可读或指向旧记录时，页面显示“证据不可用”，相关数据进入部分缺失，任务不能显示完整完成。
- **原因**：防止系统用一个看似正规的编号掩盖事实链断裂。
- **coverage_disposition**：`current`；证据有效性边界已收敛。

## Grill 收口

- **status**：`completed`。
- **本轮已解决的实际问题**：真实入口、每次执行的唯一绑定、失败/重试/并发、运行影响、缺失状态、覆盖率分母、单任务主视图、执行中状态、成本不重复计算、证据编号和证据可用性。
- **未引入的内容**：M16 经验评分、优化建议、自进化候选池；历史数据回填；Multica；第二套公共入口或第二套事实存储。
- **CONTEXT.md**：`no-change`；本轮只是把已有运行事实、证据和缺失语义收紧，没有新增领域术语。
- **ADR**：`not-needed`；现有 ADR 已覆盖事实、来源、投影和失败语义，本轮没有新增难以逆转的架构决策。
- **当前状态**：Grill 已完成，但 make-decision 仍未完成；还要记录完整方案审查、检查材料一致性，再向用户做最终确认。

## 决策草稿（Grill 后，待最终确认）

### 原始需求回放

- 当前要修的是 M15 监控看板，不是 M16；不处理历史数据，不修改 Multica。
- 用户要看到一条完整 WorkflowHub 任务的真实执行细节：每个 step、每个 skill 的状态、token、耗时、失败/重试和证据，并能知道它们对整条任务成本和运行结果的影响。
- 页面必须恢复原始 UI 的信息层级和范围，不能用固定拓扑、模板数据、总量数字或空白页面代替真实记录。
- 当前完成前提是 fresh 的真实 WorkflowHub 任务从正式入口启动，一路写入真实事实、投影并在浏览器页面显示；历史记录不能证明本次修复完成。

### 用户看到的完整流程

1. 用户打开监控页，选中一条完整 WorkflowHub 任务；页面不要求用户理解后台执行编号。
2. 页面先显示这条任务当前状态：执行中、数据收集中、已完成、部分缺失、数据过期或失败。
3. 页面按原始 UI 显示任务概览、成本、问题/影响、阶段和详细内容；右侧详情只属于当前这条任务。
4. 用户展开阶段、step 和 skill，看到每次真实执行的状态、token、耗时、失败/重试信息和证据编号/来源。
5. 用户按 step 或按 skill 查看成本，也能看整条任务总成本；同一笔原始成本只计算一次。
6. 任务有失败或重试时，默认结果仍然清楚，但失败尝试保留在对应 step/skill 下供核对。

### 页面范围

- 保留原始 UI 的四个主要信息区、任务列表、共享筛选、状态展示、问题/影响展示和证据展示；当前修复不另造一套与原型无关的页面结构。
- 任务主视图只展示一条用户选中的完整任务；后台明细自动归入该任务，内部执行编号不作为主操作。
- step/skill 详情必须来自当前任务自己的真实清单和真实执行事实；不能继续使用所有任务共用的固定 `63/30` 拓扑。
- 页面显示证据编号和来源，不强制点击跳转；编号对应的内容必须能手动核对。编号存在但内容打不开时显示“证据不可用”。

### 后台数据规则

- 真实 WorkflowHub `run` 是唯一 fresh 验收起点；直接调用 bridge、手工提交 outcome、fixture、旧 facts 重放和单独加载 HTML 都不算生产闭环。
- WorkflowHub 正式入口为每次执行绑定唯一上下文；真实 host 回报它实际看到的 token、耗时、工具和结果；adapter 只能接收有来源的真实事件。
- 每次 step/skill 执行都有唯一编号；开始、结束、结果、token、耗时、失败、重试和证据都带这个编号，避免并发或事件乱序串数据。
- 同一个任务可以有很多后台事实行，因为每个 stage/step/skill/token/tool/duration/evidence 都要单独记录；这不等于用户要看到多条任务。
- 失败和重试都保留；最终状态可以汇总，但不能覆盖失败尝试。
- 总数来自当前任务的真实 manifest；已采集只统计本次真实执行有完整证据的项目，缺失项目不能从分母中删除。
- 缺失原因必须区分：未执行、数据未到、宿主不支持、无法归因、失败、重试中、证据缺失或证据不可用；这些都不能显示为 `0`。
- 任务总成本只按原始执行记录计算一次；step 和 skill 是不同查看角度，不能把两层总量再次相加。
- M15 的“影响”只记录可直接证明的运行事实：成功/失败、重试、是否阻塞后续、token、耗时、证据和全任务成本占比；经验评分、优化建议和候选池留给 M16。

### 成功边界

只有同时满足下面条件，M15 才能完成：

- fresh 真实任务由 WorkflowHub `run` 入口启动；
- 同一条链能回到该任务的真实执行上下文；
- 每个实际执行的 step/skill 都有可核对的状态、token、耗时和证据；
- 失败、重试、并发执行不会串数据，且每次尝试都能展开查看；
- 任务总量、step 总量、skill 总量不重复计算；
- 覆盖率分母来自当前任务真实清单，缺失原因可见；
- canonical facts、投影和 HTML 页面使用同一份 fresh 事实；
- 浏览器从真实任务入口到最终页面完成端到端验证，并且页面符合原始 UI 范围；
- 证据编号和来源能够手动核对；证据打不开时必须显示缺失，不能显示完整完成。

### 失败边界

- 只能得到整次任务总 token，不能绑定到 step/skill：记录为未归因成本，M15 不完成。
- 只有 bridge 能接收模板 outcome，真实 `run` 没有经过它：不算接入。
- 只有固定 step/skill 名称，没有真实执行事实：不算采集。
- token、耗时或证据用平均分配、目录顺序、旧记录或模板补出：视为错误数据。
- 任务结束但必需数据没有回来：显示部分缺失或证据不可用，不显示完整完成。
- 页面只显示总量、没有 step/skill 明细，或把不同任务混在一起：不满足 M15。

### 非目标和延期

- 不处理历史数据、不回填旧任务、不删除旧记录。
- 不实现 M16 经验回路、经验评分、优化建议和自进化候选池；本 M15 只把真实运行事实记准。
- 不读取、不修改、不修复 Multica。
- 不新增公共第八类命令，不引入第二套事实存储，不把 OTel 或其他通用 tracing 变成新的 WorkflowHub 控制面。
- 不把内部执行编号变成用户必须操作的多任务/多记录选择器。

### 主要风险和延期交接

- 当前最大风险是 Codex host 是否真的能回传 step/skill 级别的 token、耗时、状态和证据；必须先做真实 capability spike，不能靠单测或模板猜测。
- 如果真实 host 只能给整轮成本，保留未归因事实并继续修接线；不能降低 M15 的已确认完成标准。
- 并发、失败重试和子代理的唯一绑定需要在真实执行中验证；无法验证时显示具体缺失，不宣称完成。
- build-spec 只能把本草稿细化成可测试规格，不能重新发明入口、字段来源、缺失语义、页面范围或把 M16 带进来。

### 当前草稿状态

- **status**：`draft_pending_final_confirmation`。
- **当前材料**：原始需求、事实、三轮 Talk、异源 direction advice、Grill 结果和本决策草稿均已记录。
- **仍未完成**：detail advice、stage-end spec-analyze、用户对最终决策卡的实际确认、interaction aggregate。

## 详细审查后的材料修复

### Step 10 — detail-advice

- **review_ref**：`quality/reviews/results/make-decision-detail-68652f83f384e7c390bc4ddd24358ff9172a2557-9224b7e4-8c51-4118-8a79-51e728929e5b.json`
- **attempt_ref**：`quality/reviews/attempts/9224b7e4-8c51-4118-8a79-51e728929e5b/attempt.json`
- **report_ref**：`quality/reviews/reports/9224b7e4-8c51-4118-8a79-51e728929e5b.md`
- **review_status**：`available`；终态 `semantic`；只作 advice，不是通过门槛。
- **实际覆盖**：`parallel_external`；2/1 个有效 reviewer（`opencode/v4flash`、`codex/luna`）；无超时、无重试、无 provider unavailable、无 `SAME_SOURCE` 排除。
- **实际传输事实**：`codex/luna` 完成 150138ms，usage unavailable；`opencode/v4flash` 完成 148089ms，usage total 3722/input 1670/output 132/reasoning 0/cache read 1920。没有把 unavailable 当成 0。

#### Findings 记录与处置

- **F-8cf83d482887（blocking）**：本次 detail packet 只给了压缩方向摘要，没有可读 decision-log，导致三轮 Talk、逐项决定和 Grill 退出检查无法核验。**处置：`fixed`（材料装配修复）；下一次 detail packet 改为交付本文件的可读全文，旧 attempt 仍保留为历史事实。**
- **F-c22e1e3f4e53（major）**：验收草案漏掉“运行影响”。**处置：`fixed`；补进运行影响的具体定义、显示内容和事实来源。**
- **F-4ffb2b8d3a56（major）**：没有写清 run、step、skill、重试、并发的唯一身份和父子关系。**处置：`fixed`；补进执行身份、父子关系、重试关系和隔离规则。**
- **F-967c6e0aa81f（major）**：执行编号和成本去重键不可判定。**处置：`fixed`；补进执行编号、事件编号、成本来源编号和去重规则。**
- **F-3675ae07f0c9（major）**：总 token 不重复的规则不够具体。**处置：`fixed`；补进原始成本归属、重试计费、并发计费和整轮成本不可代替明细的边界。**
- **F-425babb2c759（major）**：任务自己的清单和 runtime manifest 没有区分。**处置：`fixed`；明确任务清单是覆盖率分母，runtime manifest 只能报告观察结果，不能改变分母。**
- **F-5e89525b0a4a（major）**：状态没有归属、触发条件、优先级和终止条件。**处置：`fixed`；补进任务、step/skill 的状态规则和完成优先级。**
- **F-7554a4d6b5e0（major）**：原始页面范围和非目标还不够具体。**处置：`fixed`；补进页面文件、原始 UI 参考、单任务主视图、四区/筛选/状态/证据范围，以及历史/M16/Multica 禁止项。**
- **F-2d563050b50f（minor）**：状态词和“模板/固定拓扑”没有定义。**处置：`fixed`；补进状态触发条件，并定义模板和固定拓扑不能冒充执行事实。**
- **本次处理方式**：修改的是当前决策材料，不是源码；不重复调用审查来追求空 findings。由于修复了 detail packet 和验收定义，按合同只做一次新的完整 detail advice，记录新的真实结果。

### 验收定义补充（用于后续 build-spec，不是新增需求）

#### 1. 一次执行如何唯一识别

- `task_id` 表示任务本身；同一任务的所有明细必须使用同一个 `task_id`。
- `run_id` 表示一次从真实 WorkflowHub `run` 入口开始到结束的完整运行；不同运行不能混在一起。
- `attempt_id` 表示这次运行中的一次尝试；如果失败后重试，新尝试使用新的 `attempt_id`，并记录它重试的是哪一次旧尝试。失败尝试不能被覆盖。
- 每次真正执行一个 step 或 skill，都必须有唯一的“执行编号”；同一个 skill 执行两次、两个并发子任务执行同一个 skill，都必须得到不同编号。该编号从开始事件一直沿用到结束、成本、失败、重试和证据。
- 每条开始、结束、token、工具、耗时和结果事件还必须有自己的“事件编号”；同一事件重复收到时，只保留一份，不按事件到达顺序配对。
- skill 执行必须能回到它所属的 step；step、skill、事件都必须同时能回到 task、run、attempt。没有完整父子关系的记录只能标成无法归因，不能塞入某个 step/skill。
- 并发不靠先到先配对；靠唯一执行编号和父子关系配对。不同 task 或不同 run 的记录不能互相引用。
- 具体字段放在哪个现有事实结构，由 build-spec 细化；但“每次执行有唯一编号、每个事件有唯一编号、父子关系完整”是不可放宽的验收条件。

#### 2. 成本怎么计算

- canonical cost 是真实 host 产生的一条原始成本事实；它必须带来源编号、执行编号或明确的未归因标记。
- 去重键是“来源编号 + 来源事件编号”；相同来源事件重复写入不能重复计费。不同 attempt 的真实 token 都算入整条任务实际成本，因为它们确实消耗过资源。
- step 总成本是属于该 step 执行编号的原始成本之和；skill 总成本是属于该 skill 执行编号的原始成本之和；同一笔成本在 step 视图和 skill 视图中可以被看到，但任务总量只从原始成本事实加一次。
- 并发事件各自按自己的来源编号计费；不按时间顺序合并，不按 step 数量平均分配。
- host 只能给整轮 token、不能绑定 step/skill 时：整轮 token 可以记录为未归因总量，但不能产生 step/skill 成本，且不能满足 M15 完成条件。
- 没有来源编号、来源内容不可读或执行编号不完整的成本，显示未归因/证据不可用，不进入“已核实的 step/skill 成本”。

#### 3. 覆盖率分母从哪里来

- 分母只来自当前选中任务自己的任务清单：任务定义明确列出的 step/skill，且该清单能从当前任务事实中核对。
- runtime manifest 是实际运行时看到的条目，只能作为观察结果；它不能新增任务清单项目、删除任务清单项目或缩小分母。
- 任务清单不存在、损坏或不可读时，覆盖率显示 unknown，不改用已观察条目或固定 `63/30`。
- 清单中的条件分支如果本次没有执行，仍留在分母中，显示未执行；不能因为没执行就从分母删除。
- 已采集的分子只算本次 run/attempt 有完整状态、成本和证据的项目；缺失、不支持、无法归因、证据不可用分别显示。

#### 4. 状态什么时候成立

- **执行中**：真实 run 尚未结束，且对应 task/step/skill 仍有未结束的执行编号。
- **数据收集中**：真实 run 已触发结束或 host 已停止发送，但事实收集窗口仍未完成；此时不能显示完整完成。
- **已完成**：真实 run 正常结束，任务清单中要求记录的 step/skill 都有状态、token、耗时和可核对证据，没有未处理的并发或身份冲突。
- **部分缺失**：任务/step/skill 已有部分真实事实，但至少一个要求字段缺失、未归因或证据不可用；这不是成功，也不是 0。
- **数据过期**：页面使用的投影不是当前 fresh facts 的最新投影，或任务仍在执行但页面的事实水位长时间没有更新；显示旧数据但不能标成最新完成。具体时间阈值由 build-spec 根据现有 freshness 机制细化。
- **失败**：真实 run 或最后一次有效尝试以失败结束；之前失败后后来成功时，主状态可显示成功，但失败尝试和它造成的成本/阻塞影响必须保留。
- **未执行**：任务清单中有该项目，但本次 run 没有对应开始事件；它算缺失，不算 0。
- **宿主不支持/无法归因**：真实 host 或绑定关系明确说明不能提供该字段；保留事实和原因，不伪造数字。
- 任务主状态的优先级是：真实失败先显示失败；任务已结束但有必需缺失显示部分缺失；任务未结束显示执行中/数据收集中；所有要求满足才显示已完成。数据过期是数据质量提示，不能覆盖真实失败或把半成品变成完成。

#### 5. “运行影响”显示什么

- 对 step/skill 显示：是否成功、是否失败、失败次数、是否重试、是否阻塞后续、自己的 token、耗时、证据和占任务已核实成本的比例。
- 对任务显示：总 token、总耗时、失败/重试次数、被阻塞的后续项目、已核实成本和未归因成本。
- 这些都是事实汇总，不是质量评分；没有直接事实就显示未知，不生成“好/坏”分数。经验评分和候选池留给 M16。

#### 6. 页面和非目标的可判定范围

- 当前页面入口是 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub-monitor.html`，其数据投影是 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub-monitor-data.js`；视觉和信息层级以 `/Users/Hugh/Downloads/Redesign Clearer Information Page` 为参考，保留原始四区、任务列表、共享筛选、状态、问题/影响和证据区域。
- 页面主视图一次只展示一条完整任务；后台明细自动归入它，失败重试只在对应 step/skill 下展开。
- “模板”指没有 fresh 真实来源的预置 outcome 或示例记录；“固定拓扑”指仅凭页面预置的 step/skill 名称生成的行。两者可以作为页面布局，但不能提供状态、成本、耗时或证据。
- 历史数据不回填；M16 不实现；Multica 不读取、不修改、不验收。这三项写入非目标和测试范围，任何改动都算越界。

### Step 10b — 修订材料后的 detail-advice

- **review_ref**：`quality/reviews/results/make-decision-detail-68652f83f384e7c390bc4ddd24358ff9172a2557-beb4c9a3-2ea7-496c-bcb2-1ea65147141a.json`
- **attempt_ref**：`quality/reviews/attempts/beb4c9a3-2ea7-496c-bcb2-1ea65147141a/attempt.json`
- **report_ref**：`quality/reviews/reports/beb4c9a3-2ea7-496c-bcb2-1ea65147141a.md`
- **review_status**：`available`；终态 `semantic`；只作 advice，不是通过门槛，也不再为了空 findings 循环审查。
- **实际覆盖**：`parallel_external`；1/1 个有效 reviewer（`codex/luna`）。`opencode/v4flash` 返回 `PROVIDER_OUTPUT_INVALID`，耗时 177305ms，没有可用 findings；没有把它改写成空意见。
- **实际传输事实**：`codex/luna` 完成 214396ms，usage unavailable；`opencode/v4flash` 失败，usage unavailable。当前 review 仍有真实的单一有效异源意见，覆盖事实保持可见。

#### 本次 findings 与处置

- **F-9281522d3a24（blocking）**：当前材料仍是草稿，同时保留旧的“已确认”历史文字。**处置：`needs_human`；这不是靠改文档冒充解决，必须等用户对本轮最终决策卡实际确认，并生成 interaction aggregate。**
- **F-b6f6b5e69f50（major）**：真实 `run` 入口和 host step/skill 能力尚未被 fresh 任务证明。**处置：`fixed`（补进明确 capability spike 的通过/失败证据）；运行能力本身仍是当前最大风险，未证明前不宣称可交付。**
- **F-0fe8e5f12677（major）**：条件分支/未执行项目与完成条件关系不清。**处置：`fixed`；补进 `not_applicable`、未执行、数据缺失的区别，以及它们对分母和完成条件的影响。**
- **F-12d23bcd7198（major）**：原始 UI 缺少可执行范围。**处置：`fixed`；补进页面入口、数据投影、原型相对文件名、四个页面区域、交互和必显字段。**
- **F-bd5bf64e2d4b（major）**：证据编号和来源的有效性规则不完整。**处置：`fixed`；补进不可变来源、事件/执行编号、定位、内容 hash、可读性和浏览器显示规则。**
- **F-cdc39e3125ae（major）**：新 UI 状态词没有映射到既有事实状态。**处置：`fixed`；补进 canonical fact status 到页面状态的唯一派生映射，页面不得自行造第二套事实状态。**
- **本次结论**：材料缺口已修复；host 能力仍需 build-code 前的真实 capability spike 和后续 fresh E2E 证明。该未决事实不能被文档写成已完成。

### capability spike：进入 build-code 前必须完成的真实小实验

这不是审查通过条件，而是确认“当前 host 能不能真的做到”的最小实验证据：

1. 从真实 WorkflowHub `run` 入口启动一条新的、不会读取历史 facts 的小任务。
2. 证明该入口自动产生一个新的 task/run/attempt 关联，并自动注册真实 host source；直接调用 bridge 不算。
3. 至少执行一个 step 和一个 skill，分别拿到开始、结束、成功/失败、token、耗时、证据编号和来源；每一条都能回到同一个执行编号。
4. 强制制造一次失败后重试，并验证两次执行都保留、重试关系正确、成本只计算各自真实发生的一次。
5. 同时运行两个不同执行，验证事件乱序时仍不会串到另一个 step/skill。
6. 通过 canonical facts、projection 和浏览器检查：页面显示每个 step/skill 的真实状态、成本、影响和证据编号；整条任务总量不重复。
7. 任意一项失败都记录具体缺口，M15 保持未完成；不能用整轮 token、平均分配、模板或旧记录替代。

### 条件项目和完成条件

- `not_applicable`：当前任务清单明确写明该项目不适用于这次 run，并且有可核对的适用性证据；它仍留在任务清单和分母中，但不要求 token/耗时，要求有适用性证据，算作“已解释”而不是“已执行”。
- `未执行`：项目适用于这次 run，但没有开始事件；它留在分母中，显示缺失，阻止“完整完成”。
- `数据缺失/证据不可用`：项目执行过或应该执行，但要求字段或证据没回来；显示部分缺失，阻止“完整完成”。
- `已完成`：所有适用项目都有状态、token、耗时和可核对证据；不适用项目都有适用性证据；没有身份冲突和未处理的必需缺口。
- 这样既不会把条件分支误报为失败，也不会把应该执行但没记录的项目藏掉。

### 原始 UI 的可执行范围

- **页面入口**：用户提供的 `workflowhub-monitor.html`；页面数据来自 `workflowhub-monitor-data.js`。
- **仓库内行为参考**：`runtime/evidence/monitoring-page.html`、`runtime/evidence/monitoring-projector.mjs`、`runtime/evidence/monitoring-diagnostics.mjs`；这些是实现/投影参考，不是伪造的用户任务数据。
- **视觉参考**：用户提供的 `Redesign Clearer Information Page/src/App.tsx` 和同目录样式/资源；不能只保留当前页面的临时布局。
- **四个区域**：左侧任务列表；任务标题/当前状态/覆盖率与基本统计；成本、问题和运行影响；五个阶段及其 step/skill 明细。
- **保留交互**：搜索任务、按项目筛选、按状态筛选、选择一条任务、默认展开当前阶段、手动展开其他阶段、展开失败/重试明细、查看证据编号和来源。
- **每行必显**：名称、状态、结果说明、token、耗时、证据编号/来源；缺失显示原因，不显示 0。顶部同时显示任务状态、覆盖率、总 token、总耗时、失败/重试和未归因成本。
- **浏览器验收**：从页面入口加载真实 fresh projection，选择一条任务，核对四个区域、状态映射、step/skill 行、成本和证据编号；不接受截图、静态 fixture 或只验证页面能打开。

### 证据最小合同

- 每个证据必须有不可变的 `evidence_ref`、`source_id/source_version`、对应的 `event_id` 或执行编号、可定位信息、内容 hash 和可读取状态。
- 页面显示编号和来源；不强制跳转，但测试必须能用编号和来源在 canonical facts/证据存储中找到同一条内容。
- 编号存在但内容不存在、hash 不匹配、来源版本不一致、定位不到或不可读：证据状态为不可用，相关数据不计入完成覆盖。
- 一个通用模板、目录名、旧任务记录或只有数字的页面行都不算证据。

### 页面状态和既有事实状态的唯一映射

- 事实 `present` 且 run/执行仍未结束 → 页面 `执行中`。
- 事实收集未结束或仍有必需事件未落盘 → 页面 `数据收集中`。
- 事实 `present`、所有适用项目字段和证据完整、无冲突 → 页面 `已完成`。
- 事实为 `missing/unknown/unavailable/unsupported/incomplete/conflict`，或证据不可用 → 页面 `部分缺失`，并显示具体原因。
- 任务清单项目为 `not_applicable` → 页面 `不适用`；项目为 `skipped` 且有合法理由 → 页面 `已跳过`；适用但没有开始事件 → 页面 `未执行`。
- 真实 run 的结果为失败 → 页面 `失败`；失败后重试成功时主状态按最终结果显示，但历史失败和影响仍展开可见。
- 当前投影不是最新 facts，或仍在执行但事实水位停止更新 → 在以上状态旁显示 `数据过期` 提示；它是数据质量提示，不另造一套事实状态。
- 页面只做上述派生，不直接把事实 `0`、空字符串或缺行解释成成功。

### Step 11 — stage-end-spec-analyze

- **skill**：`spec-analyze`；报告型一致性检查，不是通过门槛。
- **实际输入**：当前原始需求 `R-001`～`R-009`、本 decision-log、当前修订后的状态/成本/身份/UI/证据定义和真实审查事实。
- **decision-log hash**：`e36ea0d9b107822f435b9ddc6deed69665beae1df8fa0f8d48984318be2ff844`。
- **snapshot binding**：`68652f83f384e7c390bc4ddd24358ff9172a2557`；decision-log evidence hash 与当前材料一致。
- **实际结果**：`status=consistent`；`findings=[]`；9/9 条原始需求有语义和证据绑定；0 条语义偏差、0 条证据问题。
- **六句结果**：当前阶段已完成需求回放、研究、三轮 Talk、Grill 和 detail advice 修复；原始需求 9/9 已覆盖；与当前决策材料和实际调研事实一致；本阶段补齐了执行身份、成本去重、状态映射、条件分支、页面范围、证据合同和审查传输事实；剩余风险是 host capability spike、fresh E2E、用户最终确认和 interaction aggregate；下一阶段只能消费本日志，不能重新发明需求。
- **注意**：`consistent` 只说明当前材料内部一致，不代表 host 已经具备能力，不代表代码已修复，也不代表 M15 已完成。

## 本轮最终确认（2026-08-16）

- **用户实际回复**：`确认`。
- **确认含义**：确认本轮最终决策卡，按当前 M15-only 方案进入下一阶段 `build-spec`；不是代码完成声明，不是 M15 正式交付，不是历史数据处理，不是 M16 启动，也不授权修改 Multica。
- **用户确认的硬边界**：真实 WorkflowHub `run` 作为 fresh 起点；每个 step/skill 的真实状态、token、耗时、失败/重试、运行影响和证据；并发/重试不串；总成本不重复；缺失不当 0；任务清单固定分母；原始 UI 范围；host 能力不足时保持未完成。
- **用户确认的页面原则**：主页面展示一条完整任务；后台明细自动归入；证据显示编号和来源，内容不可核对时显示证据不可用。
- **延期交接**：build-spec 只能把本决策写成可测试规格；build-code 前先做真实 capability spike；M16 只接收可靠事实，不在本任务实现。
- **当前阶段状态**：用户确认已收到；interaction aggregate 待按当前 decision-log hash 写入，随后才能发布本次 decision。
- **coverage_disposition**：`current`；本步已执行并记录真实结果。
