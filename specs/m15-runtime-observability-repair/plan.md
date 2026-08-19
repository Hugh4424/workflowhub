# M15 真实记录链与看板交付修复：工程计划

- **Template version**：`plan-task.v3`
- **当前阶段**：`build-plan`
- **输入材料**：`decision-log.md` 已确认需求与选择；`spec.md` 已锁定用户流程、状态、范围、验收和延期。
- **阶段口径**：本计划只把已确认的 M15 需求拆成实现任务，不改需求，不执行代码，不处理历史数据，不提前实现 M16。

## Quick Read

- **要交付的结果**：一条新任务从正式 WorkflowHub `run` 入口开始，能在同一个 task 下留下真实的 run、attempt、stage、source status 和 canonical facts；投影和 HTML 只读这份 facts，并把“流程没发生”和“没采到”分开显示。
- **真实入口边界**：用户正常使用 WorkflowHub 的当前会话就是唯一入口；不要求用户另开或手动启动“Stage Agent”。项目级 Codex hook 只登记 host 给出的精确 `session_id`、`transcript_path` 和 `cwd`；同一会话的私有事件命令记录 manifest step/skill 边界，`stage-runtime run` 自动调用现有 bridge 和 outcome adapter。WorkflowHub 不在 runtime 内启动另一个 Agent，也不扫描 session 目录或猜 task/run/session；不能提供的字段保留 `unavailable`/`unknown`，不能用模板或平均值补齐。外部项目不属于本任务，禁止调用、修改、构建、测试或同步。
- **根因对应**：当前成功 run 没有保证先初始化 facts store；生产入口没有真实 source resolver；sidecar 按 topology 把没有 outcome 的 step/skill 批量写成 missing/unknown；投影没有固定的样本分母和视图字段覆盖；页面仍有固定五阶段、硬编码未拆分和 `innerHTML` 等旧契约。T001 先用 fresh public run 和只读 caller trace 复核这些判断；若证据不成立，保留 `unknown/incomplete/unavailable`，不按假设修复。
- **实施顺序**：Phase 1 先修正式入口、来源状态、canonical facts 和 attempt 幂等；Phase 2 再修 projection、诊断、样本充分性、成本拆分和四区页面；最后在同一任务内用 fresh 入口做端到端回放、删除派生物重建和浏览器验收。
- **Non-goals**：不回写历史任务；不做 M16 经验回路、候选池、候选排序、自动改法、质量分、canary、版本选择、线上回退、多 CLI、外部 registry 更新或新的事实存储；不增加用户可见的 Stage Agent 启动命令。来源：`decision-log.md` 的 D-005～D-007、`spec.md` 的“明确不做与默认必须成立”、AC-011 及 M17/M17a 延期交接。
- **停止条件**：如果 fresh 任务不能稳定产生并绑定 task/run/attempt/stage，或页面不能读回同一任务，本期只记录真实证据缺口和延期，不能宣称 M15 基础链完成，M16 不得消费这条链。
- **交接**：build-code 只按本计划执行；先做 RED，再做同命令 GREEN；宿主未证明的事件能力保持 `unavailable`、`unsupported` 或 `unknown`，不能为了页面好看补零。

## Technical Context

### Global Constraints

- `facts.jsonl` 是 task-local canonical facts 唯一权威；project JSON、global snapshot、`data.js` 和 HTML 都是可重建派生物。
- 只写 fresh task；不扫描 `~/.codex/sessions`，不按路径、时间或目录猜来源，不回填或修正历史 task。
- 生产入口仍只有公开的 `doctor/status/run/review/verify/confirm/authorize` 语义；source resolver 只能是正式 launcher 注入的私有能力，不能新增 public `record-*` 或第二条 writer 路径。
- 事实状态与页面状态分开。事实只使用 `present`、`missing`、`skipped`、`not_applicable`、`unknown`、`unavailable`、`unsupported`、`conflict`、`incomplete`；`pending`、`evidence_gap`、`out_of_order`、`failed`、`partial`、`stale`、`fatal` 只能是派生诊断或 UI 状态。
- 所有 token、duration、retry、tool use、stage、skill 和问题记录必须带稳定归属键、来源引用、coverage 和 reason/value；未知不转成零或成功。
- 页面只加载一次同一份 snapshot；切区保持筛选，浏览器原生刷新回默认筛选；来源文本使用文本节点展示，不能作为 HTML 或脚本注入。
- 本轮 build-plan 只做设计事实；测试、浏览器验收、真实 fresh task 和正式质量裁决由 build-code/verify-code 产生。

### Current Failure Facts

- `tools/cli/stage-runtime.mjs` 只在 missing-stage-outcome 异常分支显式调用 `initializeTaskStore`，成功 run 的 sidecar 直接读写 facts，导致真实成功入口可能没有 canonical facts store。
- `runMonitoringSidecar` 的默认 `services` 只有在 host 明确提供当前 Codex source 时才可读取；当前正常会话没有自动 caller，测试却手工注入 `createRegisteredCodexSource`，因此“测试能写”不能证明“正常会话能采”。
- `stageMonitoringFacts` 不能从 topology 猜执行事实；没有正常会话产生的 step/skill outcome 时必须记录采集缺口，不能把它解释成流程退化。
- `runtime/evidence/monitoring-facts.mjs` 和 `runtime/schemas/monitoring-fact.v1.json` 仍使用旧的六状态集合；projection/diagnostics/page 也把 `partial`、`fatal` 混在事实和 UI 语义中。
- `monitoring-diagnostics.mjs` 的 automation 比例没有显式适用机会分母，trend 小样本边界不完整；projector 没有固定四个视图的 required fields 与 sample sufficiency。
- `runtime/evidence/monitoring-page.html` 仍固定展示旧阶段结构、duration 写死“未拆分”，过滤器不足七类，并残留 `innerHTML`；这些都是当前 M15 页面消费层的可见遗漏。

### Data and Lifecycle

1. 正常 WorkflowHub 会话开始阶段时，私有执行上下文自动登记 task/run/attempt/stage；用户不执行额外命令。正式 `run` 仍是唯一 public writer seam，先保证 task-local facts store 存在，再调用唯一 monitoring sidecar。
2. 项目级 hook 把精确 source handoff 留在临时 host 状态中；当前会话的私有事件命令把 step/skill 边界留在同一临时状态中。`stage-runtime run` 以明确的 project/task/stage context 读取这一条 handoff，自动调用现有 bridge/adapter；adapter 只认证绑定，不启动 Agent、不扫描 session、不猜路径。解析结果与 task/run/attempt/session 绑定。
3. 每个 manifest step 和 declared skill 的开始、结束、结果、证据、duration 和真实 usage 都挂在同一执行编号；token 无法精确归因时记录未归因事实，不拆给 step/skill。
4. stage、source、step、skill、quality、cost 和 health 事实追加到同一 `facts.jsonl`；同一 `fact_id` 幂等，重试产生新 `attempt_id`，冲突事实并存。
5. projector 从 task facts 生成 project projection，再从 project projections 重建 global snapshot、`data.js` 和 HTML；任何派生失败都不改 facts。
6. 页面把 snapshot 状态映射为 loading、ready、empty_valid、partial、stale、fatal，并为四个视图分别计算 fixed required fields、范围内任务数和 sample sufficiency。
7. fresh E2E 逐段保存 task/run/attempt/stage/source/facts/projection/data/page 的受控引用；删除的只允许是隔离环境里的派生物。

## Code Anchors

- `tools/cli/stage-runtime.mjs`：正式 stage `run`、`runMonitoringSidecar`、missing-outcome fallback、task store 初始化、project/global 发布入口；P1 唯一 runtime writer seam。
- `runtime/evidence/codex-transcript-adapter.mjs`：registered Codex source 的身份、读取、格式/版本、task/run/session binding、去重和 conflict 事实；P1 source contract owner。
- `runtime/evidence/monitoring-facts.mjs` 与 `runtime/schemas/monitoring-fact.v1.json`：canonical fact creator、validator、status enum、typed value 和 source contract；P1 fact contract owner。
- `runtime/evidence/monitoring-diagnostics.mjs`：stage/step/skill/failure/cost/automation/trend 派生；P2 diagnostic owner。
- `runtime/evidence/monitoring-projector.mjs` 与 `runtime/schemas/monitoring-projection.v1.json`：task projection、global rebuild、immutable derived output、schema validation；P2 projection owner。
- `runtime/evidence/monitoring-page.html`：四区静态页面、共享筛选、状态/coverage/errors、受控证据引用和文本安全边界；P2 view owner。
- `runtime/stage/stage-agent-outcome-adapter.mjs`：正常 WorkflowHub 会话的私有结果接入契约；只接收当前会话已经产生的 step/skill/spec-analyze 结果，绑定当前 snapshot/materials/manifest 后经 `TaskKernel` 写入；不作为用户入口。
- `tools/host/workflowhub-stage-agent-bridge.mjs`、`tools/host/workflowhub-stage-agent-protocol.mjs`：保留为私有会话接线实现；必须由正常 WorkflowHub 会话自动调用，不能要求用户单独启动。
- `.codex/hooks.json`、`tools/host/workflowhub-codex-session-hook.mjs`、`tools/host/workflowhub-codex-session-state.mjs`、`tools/host/workflowhub-codex-session-event.mjs`：项目级 Codex source handoff 和同一会话 step/skill 边界；只写临时 host 状态，不是 facts writer，SessionEnd 后不作为历史事实保留。
- `tests/m15-monitoring-integration.test.mjs`、`tests/m15-codex-transcript-adapter.test.mjs`、`tests/m15-monitoring-facts.test.mjs`：P1 RED/GREEN 和 fresh entry evidence。
- `tests/m15-monitoring-diagnostics.test.mjs`、`tests/m15-monitoring-projector.test.mjs`：P2 RED/GREEN、schema、projection、page contract 和重建证据。
- `runtime/evidence/fact-collector.mjs`、`tools/cli/collect-task-facts.mjs`、`workflows/verify-code/metrics-writer.mjs`、`metrics/collector.mjs`：M10/M14b caller 的只读追踪锚点；它们是否真正接入当前正式入口由 T001 evidence 证明，不自动升级为本轮 writer。
- 已核对但本轮不改：`runtime/task/task-store.mjs` 的 append/lock/idempotency、`metrics/collector.mjs`、M14b collector、三个空 source registry、`docs/adr/0012-task-local-monitoring-and-derived-projections.md`、历史 M14/M15 specs。它们不是新的事实 writer；若实现发现已有 contract 不足，先 STOP 回到本计划对应文件边界。

## Solution Design

### A. 把记录动作接回正常会话入口

- 在正常 stage outcome 成功、失败和 missing-outcome 三条路径统一保证 `initializeTaskStore` 先于 sidecar；保留原始 stage run 错误，monitoring 不能吞掉执行错误。
- 正常会话 host 自动向现有 private `services` 注入当前 source 和执行上下文；没有 source 时仍写一条与 task/run/attempt 绑定的 `source_status`，状态和 reason 明确为未登记/不可用；不把空 source 伪装为 present。
- stage、step、skill 事实必须来自同一正常会话的生命周期事件或受控 outcome。没有真实事件时记录 `unknown`/`unavailable`/`unsupported`/`incomplete` 及原因，不把整张 topology 当成已发生的执行清单。

### B. 固定 canonical fact 语义

- 统一九种事实状态；旧的 `partial`/`fatal` 只在 projection/UI 派生层表达。新增事实不再把 UI 状态写进事实状态。
- 每条事实保留 `task_id`、`project_name`、`run_id`、`attempt_id`、`stage`、必要的 step/skill/version、稳定 `fact_id`、source、coverage、value/reason、evidence refs。
- 同粒度不同来源不择值；保留各自记录和 `conflict`，projector 只能按 contract 生成 conflict/partial/fatal 解释。
- `attempt_id` 是 retry 的硬边界；相同 attempt 内按 manifest order 判断顺序；相同 `fact_id` 重放不重复追加。

### C. 让投影和诊断说清“没有数据”

- 在 projection contract 中增加 view-level readiness：`in_scope_task_count`、固定 required fields、字段覆盖状态、sample sufficiency、reason 和 source refs。每个视图单独判断 `sufficient`、`insufficient`、`empty_valid` 或 `unknown`。
- failure domain 只从已登记且适用的 missing、明确 out-of-order、required artifact mismatch 和 health value 进入；采集不可用、冲突、合法跳过、样本不足只进入 evidence-gap/problem 提示。
- automation 使用明确的适用机会分母；没有分母或分子分母冲突时为 `unknown`；trend 需要同一范围内至少两个兼容 time buckets；count 小于 2 不叫常见。
- duration、token、retry、tool use 按 transcript/session/stage/skill/subagent 的 stable identity 分开聚合，缺少身份或来源就显示 unavailable/insufficient，不拼接或猜测。

### D. 让页面和 facts 同步

- 页面改成四区：任务总览、流程退化、成本归因、常见问题与趋势；七类共享筛选为 global、project、task、stage、skill、version、time-window。
- 默认任务总览；task row 可下钻到流程退化和成本；切区保留筛选，原生刷新恢复默认；页面只读一次 `data.js` snapshot。
- 顶部固定显示 snapshot state、generated time、coverage、errors、in-scope task count 和每个视图的 sample sufficiency；`partial` 不展示为 workflow failure。
- 所有可点击证据只携带 opaque ref，由受控 evidence panel 用 `textContent` 展示；禁止 `innerHTML` 和来源文本直接进入 DOM。

### E. fresh 证明和重建

- fresh test 从用户正常使用的 WorkflowHub 会话进入；会话内部自动调用现有 private `run`/bridge/adapter，不要求用户手工启动 Stage Agent。若当前 Codex host 没有可绑定的 source 或 step/skill usage，必须保存诚实 unavailable/unsupported/unknown 证据，不能把测试注入当生产证明。
- 记录 facts hash，校验 project/global/data/page 都能回指这份 facts；在隔离 storage 中删除派生物后重建，比较 facts hash、projection 内容和 page input，确认不写历史 task。
- 浏览器验收由 `isolated-browser-qa` 在 build-code 执行；本计划只固定场景、输入、oracle 和证据路径，不在 build-plan 运行浏览器。

### F. 根因核验先于修复

- T001 的第一步不是改代码，而是用一个隔离 fresh task 走 public `stage-runtime` `run`，保存 task/run/attempt/stage/source/session 绑定、Expected topology、facts→projection→HTML 读回和当前九个 failure domains/health 字段的只读证据。
- 同一张证据卡要追踪 M10/M14b 的 `fact-collector`、`collect-task-facts`、`metrics-writer` caller：明确哪些是独立旧 CLI、哪些被正式 `run` 调用、哪些 registry 为空。证据不足时把结论标为 `unknown/incomplete`，不把“没有 caller”直接当修复前提。
- fresh 证据必须确认“正常会话是否自动调用正式 run/sidecar、是否产生当前 source 和 step/skill 事件”；只证明 bridge 能接收一份手工结果不算 caller。source capability 未证明时只修自动接入和缺失语义，不凭空制造 source caller。

## File Boundary

### MODIFY

- `runtime/stage/stage-agent-outcome-adapter.mjs`：唯一会话结果接入 adapter；不启动 Agent、不读取 session 目录、不创建第二套 writer。
- `tools/cli/stage-runtime.mjs`
- `runtime/stage/stage-runner.mjs`
- `tools/host/workflowhub-stage-agent-bridge.mjs`
- `tools/host/workflowhub-stage-agent-protocol.mjs`
- `workflows/make-decision/SKILL.md`
- `workflows/build-spec/SKILL.md`
- `workflows/build-plan/SKILL.md`
- `workflows/build-code/SKILL.md`
- `workflows/verify-code/SKILL.md`
- `runtime/evidence/codex-transcript-adapter.mjs`
- `runtime/evidence/monitoring-facts.mjs`
- `runtime/schemas/monitoring-fact.v1.json`
- `tests/m15-monitoring-integration.test.mjs`
- `tests/m15-codex-transcript-adapter.test.mjs`
- `tests/m15-monitoring-facts.test.mjs`
- `runtime/evidence/monitoring-diagnostics.mjs`
- `runtime/evidence/monitoring-projector.mjs`
- `runtime/schemas/monitoring-projection.v1.json`
- `runtime/evidence/monitoring-page.html`
- `tests/m15-monitoring-diagnostics.test.mjs`
- `tests/m15-monitoring-projector.test.mjs`
- `tests/integration/vnext-official-stage-run.test.mjs`
- `tests/e2e/vnext-five-stage-current.test.mjs`
- `specs/m15-runtime-observability-repair/tasks.md`

### DO NOT TOUCH

- `runtime/task/task-store.mjs`、`metrics/collector.mjs`、`tools/cli/collect-task-facts.mjs`、`runtime/evidence/monitoring-collector.mjs`：不增加第二个 writer；现有 canonical append contract 先复用。
- `config/transcript-sources.mjs`、`config/runtime-fact-sources.mjs`、`config/runtime-fact-v2-sources.mjs`：当前没有已证明的生产 source capability，不用空 registry 冒充接入完成。
- `docs/adr/0012-task-local-monitoring-and-derived-projections.md`：现有 ADR 已覆盖本轮 authority、source registration、projection 和静态页面边界。
- `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub-monitor.html`、历史 M14/M15 specs、历史 task facts 和任何 archive：历史只读，不重建、不回填、不替换。
- M16 经验回路、候选池、候选排序、自动改法、质量分、canary、版本选择、线上回退、多 CLI、M17/M17a registry：全部延期，不在本轮添加控制面。

## Technical Decisions

### DEC-A — 复用现有 stage-runtime sidecar

- **Selected**：在现有正式 `run` 的 sidecar seam 上补初始化、真实 source 能力和状态语义。
- **Why**：它已经是唯一同时拥有 task context、stage outcome、TaskStore、projector 和 global rebuild 的生产位置。
- **Rejected**：把 M10/M14b collector 接成并行 writer，或新增 monitoring service/record CLI。
- **Consequence**：build-code 需要证明公开 `run` 经过同一 seam；source capability 仍可能诚实 unavailable，但不再出现“成功 run 没有记录动作”的静默断链。

### DEC-B — 事实九状态，页面六状态

- **Selected**：facts 使用九种事件状态，diagnostics 和 UI 另行派生六种页面状态。
- **Why**：原始事实必须保留“未发生、合法跳过、不可用、不支持、冲突、不完整”的区别；把 `partial`/`fatal` 写进事实会混淆根因和页面可用性。
- **Rejected**：继续扩张旧六状态，或把所有非 present 统一成 missing。
- **Consequence**：fact schema、adapter、stage producer、diagnostics、projector 和 tests 必须一起更新，避免单边迁移。

### DEC-C — 固定视图字段和分母

- **Selected**：projection 为四个视图输出固定 required fields、in-scope task count、field coverage 和 sample sufficiency。
- **Why**：页面不能用“有几条记录”猜覆盖率；没有分母或字段身份时，正确答案是 insufficient/unknown。
- **Rejected**：继续让 HTML 自行计数或把缺失字段显示为零。
- **Consequence**：schema 会变严，旧 projection 不能作为本轮新事实的完成证据；派生物可在 fresh task 中重建。

### DEC-D — 测试复用现有文件，fresh 场景补到正式入口

- **Selected**：把 public run、fresh replay、rebuild 和 browser input 场景补入现有 M15 integration/projector 测试文件。
- **Why**：不新增第二套 test harness，不扩大 move-map 和长期维护面。
- **Rejected**：新增 fixture-only E2E runner 或独立 history repair script。
- **Consequence**：同一测试文件会同时包含 unit/integration/fullstack slice；每个行为仍用同命令 RED/GREEN 配对，browser 操作用独立 QA 技能产生 evidence。

### DEC-E — 未证明当前会话能力保持缺失状态

- **Selected**：没有真实 registered source 时显示 `unavailable`/`unsupported`/`unknown` 和 reason，不补齐 transcript、skill 或 tool 数据。
- **Why**：当前正常会话没有证明的自动 source/step/skill caller；把 fixture 或用户手工启动当生产接入会复现 M15 的根因。
- **Rejected**：扫描本机 session 目录、按时间拼 source、用测试 source 当生产默认值。
- **Consequence**：某些 fresh 页面可能是 partial，但这是真实能力边界；后续 M16 只能消费有来源、有 coverage、有状态的事实。

### DEC-F — 正常会话自动提交结果，runtime 只认证和落盘

- **Selected**：复用窄的 `stage-agent-outcome-adapter.mjs`，但把它接到正常 WorkflowHub 会话的私有生命周期；当前会话 host 自动提交已经执行的结果，adapter 只校验当前绑定并调用既有 `TaskKernel`。
- **Why**：用户真正使用的是当前会话；把结果交给一个需要另外启动的 Stage Agent 会继续绕开真实入口。把 Agent 启动逻辑塞进 runtime 仍违反薄核心边界，所以只补会话接线，不增加第二个 Agent 或第二个 writer。
- **Rejected**：要求用户另开 Stage Agent、在 runtime 内启动 Codex/Agent、扫描 session 目录、把测试 helper 提升为生产 producer、或新增独立 facts writer。
- **Consequence**：adapter contract 仍可在仓库内先验收；只有正常会话自动调用并生成 current stage outcome 后，入口链 AC-001/AC-010 才能正式闭合。没有该调用时必须保留 `incomplete/unavailable`。

## Test Strategy

### Routing and test tiers

- P1 使用 `fullstack-slice-testing`：同一命令覆盖 public `stage-runtime` run、TaskStore 初始化、registered source binding、canonical facts 和 attempt/idempotency；补充现有 adapter/fact contract assertions。
- P2 使用 `fullstack-slice-testing` 加页面 contract assertions：同一 snapshot 经过 diagnostics/projector/schema 进入 static HTML；浏览器场景由 `isolated-browser-qa` 在 build-code 执行。
- 这是 test-routing-advisor 的方法选择，不是质量 gate；build-plan 不运行测试，不把测试未执行写成通过。

### Final aggregate scope

最终验收必须逐项保留命令、exit、当前 snapshot、task/material hashes 和 evidence ref：

- `npm run check`。
- 五个 M15 focused test：`tests/m15-codex-transcript-adapter.test.mjs`、`tests/m15-monitoring-facts.test.mjs`、`tests/m15-monitoring-integration.test.mjs`、`tests/m15-monitoring-diagnostics.test.mjs`、`tests/m15-monitoring-projector.test.mjs`。
- `npx vitest run tests/integration/vnext-official-stage-run.test.mjs --passWithNoTests=false`。
- `npx vitest run tests/e2e/vnext-five-stage-current.test.mjs --passWithNoTests=false`；若输入仍由 fixture stage outcome 组成，只能记为 contract E2E，不能替代 T014 的正常会话真实证据。
- `isolated-browser-qa`：从当前 fresh projection 打开 `/Users/Hugh/Hugh/Project/workflowhub-monitor.html`，验证四区、筛选、下钻、刷新、状态/coverage 和 evidence 文本，证据放 `quality/tests/verify-code/m15-browser/`。
- `npm test -- --run` 的已知失败只能作为基线架构漂移事实记录；不得改写为 M15 通过，也不得用它掩盖上述 M15 scope 的结果。基线失败需列出原始失败文件和是否触及本轮文件。

最终成功 oracle 不是“所有宿主字段都有数字”，而是：正常 WorkflowHub 会话自动调用 adapter 产出 current stage outcome/source，public `run` 能回读同一 task 的 canonical facts，projection/HTML 读同一输入，Codex 不可用能力诚实显示 `unavailable/unsupported/unknown`，历史 task 未写入；step/skill 核心字段任一缺失都保持 `incomplete`。

### Required scenarios

- 正常 fresh run：成功入口写入 stage/source status，task/run/attempt 绑定一致。
- 没有 source resolver、source reader 失败、格式/版本不支持、binding 冲突、权限失败：状态和 reason 各自可见。
- step/skill outcome 明确 present、skipped、not_applicable、missing、unknown、unavailable、unsupported、incomplete；没有 outcome 不被 topology 批量冒充 missing。
- retry 使用不同 attempt；同一 attempt 的重复 fact 不重复追加；不同来源同粒度 conflict 并存。
- 四视图的足量、字段不足、合法空范围、任务数缺失/冲突和兼容时间桶不足。
- 九个 failure domains、automation 分母、cost identity、duration 拆分、少于两个样本不称常见。
- 删除 task/project/global/data/page 派生物后的 facts hash 不变、projection 可重建、失败不写 facts、历史 task 目录无变化。
- 浏览器 loading/ready/empty_valid/partial/stale/fatal、七类筛选、切区保留筛选、原生刷新回默认、证据 ref 文本安全和页面无 `innerHTML`。

### RED/GREEN oracle policy

- 每个行为任务都先提交能复现遗漏的 RED assertion，再用相同 `gate_cmd` 和相同 oracle 跑 GREEN；RED 预期非零，GREEN 预期 `0`。
- RED/GREEN 是 build-code 的执行事实，不是 build-plan 的结果；build-plan 只固定命令、输入、预期和 evidence path。
- 独立审查只提供一次异源建议；建议会记录事实和处置，不为 build-spec/build-plan 反复追求“pass”。只有 build-code 才按严格审查闭环处理。

## Rollback and Recovery

### Safe rollback

- 代码改动只落在本计划 MODIFY 文件；回滚时按同一 task 的提交边界恢复这些文件，不删除历史 task、facts 或 archive。
- 派生 projection/global/data/page 可以在隔离 storage 中删除后从 canonical facts 重建；canonical facts 失败时保留原文件并停止发布，不用页面结果覆盖它。
- 若 source capability 证明失败，保留 source status 的 `unavailable`/`unsupported`/`unknown` 事实和 evidence，不把它降级成空成功；问题交给 host integration owner。

### Engineering Risk Handoff

- **Affected IDs**：PFACT-001、PFACT-002、PFACT-003、PFACT-007、PFACT-008；FR-CHAIN-001～002、FR-FACT-001～002、FR-VIEW-001～002、FR-DIAG-001、FR-COST-001、FR-PROJ-001、FR-E2E-001、FR-HANDOFF-001；AC-001～AC-011。
- **Trigger**：fresh public run 缺 task/run/attempt/stage binding、source resolver 没有真实 caller、facts append 失败、projection contract 不兼容、或浏览器读不到同一 task snapshot。
- **Consequence**：只能声称记录链或页面的局部事实；不能声称 M15 基础交付闭合，不能让 M16 消费未知质量的事实。
- **Mitigation or STOP**：先保留 canonical facts 和明确错误；停止当前行为任务，补真实 caller/contract 证据；若宿主能力仍不存在，交接 `unavailable`/`unsupported`/`unknown` 及 owner，不创建扫描器或第二 writer。
- **Handling Stage**：build-code 处理实现与 RED/GREEN；verify-code 处理 fresh 端到端、浏览器和重建结论；方向变化回 make-decision。
- **Verification**：AC-001、AC-002、AC-004、AC-006、AC-009、AC-010 的受控 evidence refs、facts/projection hash、浏览器 QA artifact 和历史写入边界检查。

## Phase 1 — 正式入口与 canonical facts

### Goal

让正式 stage `run` 在成功、失败和缺 outcome 路径都真实写入 task-local facts，并让 source、stage、step、skill、quality 的事实状态、绑定、attempt 和幂等语义符合 spec。

### Files

- **MODIFY**：`tools/cli/stage-runtime.mjs`
- **MODIFY**：`runtime/evidence/codex-transcript-adapter.mjs`
- **MODIFY**：`runtime/evidence/monitoring-facts.mjs`
- **MODIFY**：`runtime/schemas/monitoring-fact.v1.json`
- **MODIFY**：`tests/m15-monitoring-integration.test.mjs`
- **MODIFY**：`tests/m15-codex-transcript-adapter.test.mjs`
- **MODIFY**：`tests/m15-monitoring-facts.test.mjs`

### Tasks

- T001/T002：T001 先做 fresh public run、source/caller/投影链根因核验；确认后再修复成功入口未初始化 facts store、source status 未落盘的问题。
- T003/T004：先用状态和 topology 场景重现并修复九状态、显式适用性、source binding 和 schema 不一致。
- T005/T006：先用重试、重复事件、冲突来源和 fresh history boundary 重现并修复 attempt/idempotency 语义。
- T007：汇总 Phase 1 的 focused RED/GREEN、fresh entry 和 contract evidence。

### Verify

所有 P1 行为卡使用同一条 focused Vitest 命令做 RED/GREEN；GREEN 必须证明 public `stage-runtime` run 经过 sidecar、facts hash 有稳定来源且没有历史写入。真实宿主 source capability 若不存在，oracle 必须看到明确 unavailable/unsupported/unknown，而不是失败被吞掉。

### Knowledge

P1 的唯一事实 writer 是 `facts.jsonl`；`runtime/task/task-store.mjs` 的 append/lock/idempotency 作为既有能力复用。测试不得直接把 `runMonitoringSidecar` 当作 public entry 的替代证明。

### STOP

若 task/run/attempt/stage 任一绑定来自 caller 猜测、成功 run 仍不能建立 facts store、或 source reader 只能靠目录扫描获得，停止 P1 实现并把真实缺口交给 host integration owner。

### Done

public run、missing-outcome fallback 和直接 sidecar 的语义已经统一；新 facts 只有九种事实状态；同 attempt 重放幂等、retry 分离、冲突保留；P1 focused GREEN 和 fresh entry evidence 已保存。

### Risks and rollback

状态 enum 和 source contract 变严可能暴露旧 fixture；只更新本轮 fresh 测试和生产 writer，不改历史 facts。若 append 或 source 解析失败，保留 canonical facts 原文件，回滚只恢复 P1 MODIFY 文件。

## Phase 2 — projection、诊断与四区页面

### Goal

让 project/global projection、诊断和 static HTML 只按已证明 facts 展示四区、七类筛选、成本拆分、问题/趋势、sample sufficiency 和六种 UI 状态，并保留 facts 可重建和安全回链。

### Files

- **MODIFY**：`runtime/evidence/monitoring-diagnostics.mjs`
- **MODIFY**：`runtime/evidence/monitoring-projector.mjs`
- **MODIFY**：`runtime/schemas/monitoring-projection.v1.json`
- **MODIFY**：`runtime/evidence/monitoring-page.html`
- **MODIFY**：`tests/m15-monitoring-diagnostics.test.mjs`
- **MODIFY**：`tests/m15-monitoring-projector.test.mjs`

### Tasks

- T008/T009：先用分母、字段覆盖、九 domain、trend 和 rebuild 场景重现并修复 diagnostics/projection contract。
- T010/T011：先用页面状态、四区、七类筛选、下钻、成本拆分和文本安全场景重现并修复 HTML consumer。
- T012：汇总 Phase 2 的 focused RED/GREEN、重建和页面 contract evidence。

### Verify

P2 先验证 projection schema 和 diagnostics，再验证 HTML；同一 snapshot 必须在四区共享筛选、状态映射、字段覆盖和 evidence ref 上保持一致。build-code 的 `isolated-browser-qa` 必须按 loading/六状态、七筛选、切区保留、刷新回默认、task 下钻、证据文本安全和清理要求产生 `quality/tests/build-code/m15-browser/` 证据；不能以字符串检查代替浏览器。

### Knowledge

project/global/data.js/HTML 都是 derived；sample sufficiency 的分母和 required fields 必须由 projection 提供，不能让 HTML 自行猜。`partial` 表示记录或投影不完整，不等于流程退化。

### STOP

若 projector 需要读取页面、历史快照或第二份 facts 才能补 coverage，若页面只能用空白计数推断退化，或 evidence ref 不能回到受控来源，停止 P2 并回到对应 contract owner。

### Done

四区和七类筛选可由同一 snapshot 驱动；loading/ready/empty_valid/partial/stale/fatal 映射、generated time、coverage、errors、in-scope task count 和四视图 sample sufficiency 均可验证；cost/trend/domain/rebuild 安全边界已覆盖。

### Risks and rollback

projection schema 变严会让旧派生物不可作为新交付证据；只在隔离 fresh storage 重建派生物，不触碰历史 facts。页面问题回滚只恢复 P2 MODIFY 文件，canonical facts 不随页面回滚。

## Phase 3 — 正常会话自动 outcome 与正式验收

### Goal

把正常 WorkflowHub 会话的真实执行边界、Codex source、canonical outcome 和页面串成一条自动链；用户不手工启动第二个 Agent。没有正常会话自动调用和真实 step/skill usage 时，不宣称 M15 正式完成。

### Files

- **MODIFY**：`runtime/stage/stage-agent-outcome-adapter.mjs`、`runtime/stage/stage-runner.mjs`、`tools/cli/stage-runtime.mjs`
- **MODIFY**：`tools/host/workflowhub-stage-agent-bridge.mjs`
- **MODIFY**：`tools/host/workflowhub-stage-agent-protocol.mjs`
- **NEW**：`.codex/hooks.json`、`tools/host/workflowhub-codex-session-hook.mjs`、`tools/host/workflowhub-codex-session-state.mjs`、`tools/host/workflowhub-codex-session-event.mjs`
- **MODIFY**：`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`
- **MODIFY**：`tests/integration/vnext-official-stage-run.test.mjs`、`tests/m15-codex-session-hook.test.mjs`
- **MODIFY**：`tests/e2e/vnext-five-stage-current.test.mjs`
- **MODIFY**：`specs/m15-runtime-observability-repair/tasks.md`
- **READ ONLY**：`tools/cli/stage-runtime.mjs`、`runtime/evidence/monitoring-projector.mjs`、`runtime/evidence/monitoring-page.html`
- **EVIDENCE ONLY**：`quality/evidence/stage-outcomes/build-code/cf48b572236eae101b3b72955851badb39f7f2cece67568ab174410ace2fa658.json`、`quality/verify-code/`、`quality/tests/build-code/`、`specs/m15-runtime-observability-repair/tasks.md`、`tests/e2e/vnext-five-stage-current.test.mjs`
- **READ ONLY**：`runtime/stage/stage-runner.mjs`、`runtime/task/task-store.mjs`、`runtime/evidence/canonical-receipt-writer.mjs`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`

### Tasks

- T013：定义并验证 adapter contract；拒绝错误绑定、stale snapshot、缺失逐步结果、fixture 和第二 writer。
- T014：把 adapter 接入正常 WorkflowHub 会话的私有生命周期；正常会话自动产生 current stage/step/skill outcome 和当前 source，用户不手工启动 Stage Agent。
- T015：执行 formal acceptance，核对 public run、facts、projection、HTML、浏览器和历史边界；不把 advisory review 写成 pass。
- T016：按 Final aggregate scope 汇总所有命令、exit、oracle、证据和基线失败边界。

### Verify

T013 由 integration contract test 证明，T014 必须有正常 WorkflowHub 会话自动调用路径和非 fixture 的 stage outcome/source ref，T015/T016 才能引用该 ref 做正式验收。`tests/helpers/stage-outcome.mjs` 只能作为测试输入，不能满足 T014。

### Knowledge

执行证据的 owner 是当前 WorkflowHub 会话及其 Codex host 接线；WorkflowHub runtime 只持有认证后的 canonical outcome 和事实。没有自动会话 caller 或 host receipt 时，M15 基础链仍是不完整事实。

### STOP

若只能手工构造 outcome、要求用户另开 Stage Agent、使用 fixture、扫描 session、猜 path，或 adapter 绕过 `TaskKernel` 直接写 facts，停止并把 T014 记为 `incomplete/unavailable`。

### Done

T013 contract 通过；T014 有正常会话自动产生的 current outcome/source；T015/T016 逐项完成并且 AC-001、AC-010 有可回读证据。Codex 部分能力不可用仍以诚实状态展示，但 step/skill 核心硬要求未满足时不能 close。

### Risks and rollback

adapter 只新增正常会话接入边界，不改变 public stage 语义；失败时保留 canonical facts 和原始 host 错误，删除范围仅限隔离派生物。若本机没有自动会话调用，不回退到 fixture，保留 incomplete 并交接 host integration owner。

## Implementation Order

1. P1-T001/T002：先让成功和失败的正式 run 都有 canonical facts store 和 source status。
2. P1-T003/T004：统一九状态、显式 outcome、source binding、reason 和 schema。
3. P1-T005/T006：锁定 retry、attempt、fact-id 幂等、冲突保留和无历史写入。
4. P1-T007：收集 Phase 1 的 RED/GREEN 和 fresh entry 证据摘要。
5. P2-T008/T009：先改 diagnostics、projection 和 projection schema，让数据 contract 先于页面。
6. P2-T010/T011：再改 HTML 四区、共享筛选、成本拆分、状态映射和文本安全。
7. P2-T012：执行全量 focused aggregate，确认所有 FR/AC 都有 task/oracle/evidence path。
8. build-code 完成后才进入 verify-code；verify-code 必须使用 current snapshot 和正常会话自动产生的 outcome，不能复用本计划的 fixture 结果或历史页面。
9. T013/T014/T015/T016 是同一 current task 的修复与验收卡，不新增 public stage；T014 未完成时，正式结果只能是 `incomplete`。

## Dependencies and Parallelism

- 所有任务串行，`并行：否`；原因是 P1 改变 fact contract，P2 依赖 P1 的状态和 identity 语义，且同一测试文件需要按 RED/GREEN 顺序修改。
- T002 依赖 T001 的 RED；T004 依赖 T003；T006 依赖 T005；T009 依赖 T008；T011 依赖 T010；每个 GREEN 必须引用前一个 RED 的实际失败证据。
- P2 不改 P1 文件；P1 的 stage/source/fact owner 与 P2 的 diagnostics/projector/page owner 分开，避免同时写同一文件。
- Codex host source/usage capability 是外部依赖。能力不存在不阻塞同任务修复，但必须把结果记录为 unavailable/unsupported/unknown，不能伪造 present；用户不需要手工补数据。
- browser QA 依赖 build-code 的本地静态页面输入和 `isolated-browser-qa` skill；本阶段只设计，不调用浏览器。

## Requirement and Verification Traceability

| 来源 | 计划落点 | FR | AC | 验证 oracle |
| --- | --- | --- | --- | --- |
| R-001～R-004 / D-003 | P1 入口与 facts | FR-CHAIN-001、FR-CHAIN-002、FR-FACT-001、FR-FACT-002、FR-E2E-001 | AC-001～AC-004、AC-010、AC-019 | M15_ENTRY_CHAIN、M15_FACT_CONTRACT |
| R-004、R-007、R-008 / D-001 | P2 四区和筛选 | FR-VIEW-001、FR-VIEW-002、FR-VIEW-003 | AC-005、AC-006、AC-010 | M15_PAGE_CONTRACT |
| R-003、R-004、R-009 / D-002 | P1/P2 缺失语义 | FR-CHAIN-002、FR-FACT-002、FR-DIAG-001、FR-DIAG-003 | AC-002、AC-004、AC-007 | M15_FACT_CONTRACT、M15_DIAGNOSTICS |
| R-008、R-009 / D-004 | P2 projection 与交接 | FR-COST-001、FR-COST-003、FR-PROJ-001、FR-HANDOFF-001 | AC-008、AC-009、AC-011 | M15_DIAGNOSTICS、M15_REBUILD |
| M15-BASELINE | P2 兼容页面范围 | FR-VIEW-001、FR-VIEW-002、FR-VIEW-003 | AC-005、AC-006、AC-008 | M15_PAGE_CONTRACT |

所有当前 spec 中的 FR/AC 都在 tasks.md 的 task 卡中反向出现；旧编号 FR-VIEW-003、FR-DIAG-003、FR-COST-003、AC-019 只作为历史映射覆盖，不产生第二套需求。

## Governance Synchronization Matrix

| 材料/事实 | 本计划处理 | 不做的事 | 后续 owner |
| --- | --- | --- | --- |
| `decision-log.md` | 只读取 R-001～R-009、D-001～D-004 和延期交接 | 不重开 Talk，不改选择 | make-decision，方向变化时回退 |
| `spec.md` | 逐 FR/AC 拆 phase、task、oracle | 不用 build-plan 补需求 | build-plan 当前材料 |
| `plan.md` / `tasks.md` | 唯一工程计划和执行任务真相 | 不创建第五份需求材料 | build-code 消费 |
| 旧 M14/M15 记录 | 只读作为根因证据 | 不回填、不当当前质量证 | verify-code 只核对边界 |
| quality review / analyzer | 记录异源建议、处置和未知 | 不当推进许可证，不追求非 build-code pass | stage outcome quality facts |
| M16 handoff | 只交接有来源、粒度、coverage、缺口的事实 | 不实现经验回路或候选池 | 未来 M16 task |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"368817c2910a36e63d3ab4642c30270abdecef15dee7caf8050e778f095919ca","id":"CONSTITUTION","version":"1.5.0","clause_count":21}`
- **F1**：只在现有 stage-runtime sidecar、TaskStore、projector 和页面消费者上补缺口，不新增核心控制面。
- **F2**：固定 source、fact、projection、page contract；不允许隐式路径扫描和自由字段。
- **F3**：四材料继续分工；本阶段只写 plan/tasks，正式发布和实现状态分开记录。
- **F4**：review 只保留异源建议和处置；不把建议变成推进许可证，也不反复追求 pass。
- **F5**：只增加能阻止 M15 误报的 schema、coverage、fresh E2E 和 browser evidence；无收益的 gate 不新增。
- **F6**：所有执行事实通过 task-local facts/evidence 记录，project/global/page 只做派生。
- **F7**：build-plan 结束等待用户实际回复；不可逆 Git 操作不在本计划授权。
- **F8**：先复用现有 writer、adapter、projector、测试文件，再做窄扩展。
- **F9**：unknown、unavailable、unsupported、incomplete、insufficient 和失败保持原样，RED 不假绿。
- **F10**：不为 M16 预建 candidate ledger、selector、自动回滚或 registry；新增字段只服务当前 M15 消费者。
- **Q1**：测试、审查和 analyzer 都是质量事实，不是“能不能继续”的许可证；缺失保持 unknown/incomplete。
- **Q2**：推进资格、完成质量、页面状态、正式发布和 Git close 分离。
- **Q3**：build-code 才进入严格实现审查；其他阶段只取一次异源建议并记录处置。
- **S1**：复用现有 WorkflowHub runtime、`isolated-browser-qa` 和测试技能，不造通用框架。
- **S2**：外部测试技能只按本项目的真实入口、facts authority 和安全边界落地。
- **S3**：实现时就在本计划文件边界和当前 schema 上检查，不复制旧页面契约。
- **S4**：本轮自定义监控扩展以 coverage、sample sufficiency、hash rebuild 和 fresh E2E 为指标。
- **S5**：任务按 P1/P2、文件 owner 和 RED/GREEN 卡拆分，便于子代理独立执行。
- **S6**：source registration、append-only facts、derived projection 和 browser QA 采用已核对的项目/外部惯例。
- **S7**：本轮只推进 build-plan 计划文件；build-code、verify-code 各自保留阶段边界。
- **S8**：所有决策、命令、oracle 和 evidence path 可脱离本对话被 build-code/verify-code 读取。

## 方案 A 的当前实施修正（2026-08-18）

### Goal

让同一条正常 Codex 会话在阶段切换、工作目录变化或不同的官方 CLI 进程之间仍复用同一个 source binding；不要求用户重复输入 task，不启动 Stage Agent，也不扫描 transcript 目录。

### Exact boundary

- **MODIFY**：`tools/host/workflowhub-codex-session-state.mjs`、`tools/host/workflowhub-codex-session-event.mjs`、`tests/m15-codex-session-hook.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`。
- **REUSE**：现有临时 session handoff；只新增按精确 `session_id` 定位 handoff 的临时索引，不新增 canonical facts、公共命令或任务目录对象。该索引的唯一 consumer 是 stage-runtime 和私有 session event，owner 是 `workflowhub-codex-session-state.mjs`，SessionEnd/临时目录清理时一并失效；未来移除跨 cwd handoff 时删除它。
- **DO NOT TOUCH**：历史 facts、外部项目、Multica、M16、旧页面派生物。

### Design

1. Codex hook 登记 session 时，同时保存一个由精确 `session_id` 定位的临时 handoff 位置。
2. 后续 stage-runtime、私有 step/skill 事件和 spec-analyze 命令优先用当前 host 提供的精确 `CODEX_THREAD_ID` 找回同一个 handoff；如果没有精确索引，才按当前目录走现有路径，不能枚举目录猜来源。
3. 绑定内容仍只有一份：原始 handoff 文件里的 session、task、transcript 和事件；索引只存位置，不复制事件。
4. 找不到精确 session 或绑定不一致时继续 fail-loud；不能读到另一个 task，也不能把 source missing 写成完成。
5. 显式传入未知或已失效的 `session_id` 时只返回 `unregistered`，绝不退回当前目录的另一份 handoff；只有 SessionStart 为新会话建立 handoff 时，才允许清理失效 locator 后使用当前目录。

### Verify

- RED：从一个目录登记并绑定 session，再从另一个目录读取同一 session，现有实现必须失败，锁定“按 cwd 找不到同一 source”的断点。
- GREEN：同一场景从五个阶段的官方 CLI 入口分别回读 source、step/skill 事件和 token/duration；再验证错误 session/task 不会串入。
- 真实限制：该测试只证明代码允许跨阶段 handoff；M15 最终仍需一条用户正常新 Codex 会话的真实五阶段回放，当前会话已绑定其他 task，不能冒充。
- 安全回归：未知精确 `session_id` 不得读到当前会话；SessionEnd 失效 locator，避免失效临时路径在新会话中复用。

### STOP

如果实现需要扫描 `/tmp`、`~/.codex/sessions` 或按时间挑文件，或需要新增 public `record-*`/第二 facts writer，立即停止并回退本修正；继续保持真实 source 缺失为 incomplete/unavailable。

### Done

代码测试证明同一精确 session binding 可跨阶段复用，且错误绑定 fail-closed；随后才重新跑一条真正新鲜的 M15 五阶段会话。五阶段真实 source 未全部 `present` 前，不能把 T015/T016 改成完成，不能 close。

### Tasks

- **T017**：RED 锁定跨工作目录阶段切换时 source handoff 丢失。
- **T018**：GREEN 让精确 session binding 跨目录、跨阶段复用，并回读真实 step/skill 成本。
- **依赖**：T017 → T018 → T015 → T016；T014 的历史 incomplete 事实保留，不被新测试覆盖。
