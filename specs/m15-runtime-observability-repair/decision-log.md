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
