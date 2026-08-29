# 实现计划：M15 流程退化与成本诊断看板

- **Input**：`specs/m15-process-degradation-dashboard/decision-log.md`、`specs/m15-process-degradation-dashboard/spec.md`
- **Template version**：`plan-task.v3`

## Quick Read

- **Goal**：每次受支持的 WorkflowHub stage 结束后，把可核实运行事实追加到该 task 的 `facts.jsonl`，再旁路发布 project/global 快照和一个可手动刷新读取的静态 HTML。
- **Non-goals**：不做自动修复、质量评分、候选优先级、Claude/多 CLI、完整 skills inventory、旧 AgentHub 前端或本地服务；来源：D-001、D-004、D-006、D-007、D-010、DEF-001～004。
- **Before**：legacy fact 合同只有十个固定字段；production transcript registry 为空；旧 collector 只写 retired `indexes/*`；当前没有 M15 consumer 或真实静态页。
- **After**：legacy facts 仍可读；新增严格 monitoring fact；Codex 来源只能由 launcher 私域登记；诊断、投影和页面均可从 canonical facts 重建；缺失保持 missing/unknown/partial/stale/conflict。
- **Main risk**：当前 Codex Desktop 没有向 CLI 暴露 transcript read capability；没有真实 binding 时只能如实生成 missing，不能完成 AC-E2E-001。
- **Next step**：先写 P1 RED，锁定 legacy 兼容、来源绑定、去重和失败语义；若实现只能靠扫描 `~/.codex/sessions`，立即 STOP 回 decision-log。

## Technical Context

### Global Constraints

- **Verified facts**：`TaskHandle` 已有 task lock 与原子写；`TaskKernel.publishCanonicalRecord` 已有 content-addressed evidence 写；stage/step/skill expected topology 已有只读合同；旧 registry 为空；`task-fact.v1` 拒绝额外字段。
- **Language / runtime**：Node.js `v24.14.0`，ESM；Vitest 为现有测试执行器。
- **Primary dependencies**：只复用 Node 标准库、现有 TaskHandle/TaskKernel、stage manifests 和 quality records；不增加 npm 依赖。
- **Storage / state**：canonical facts 只在 `taskPath/facts.jsonl`；supporting evidence 只在 `quality/evidence/monitoring/`；project/global/html 都是可删可重建派生物。
- **Testing**：Vitest 定向 RED/GREEN；并发测试 singleFork/noFileParallelism；页面验收由 build-code 按 `isolated-browser-qa` 执行且不复用登录态。
- **Target environment**：macOS 本地 file 页面；storage root 来自 launcher 配置，不硬编码用户路径；classic `data.js` 与 HTML 同级。
- **Scale / scope**：所有已认证 project 的派生 monitoring namespace；root rebuild 是锁内全量扫描，不增量改共享数组。
- **Unresolved facts**：真实 Codex transcript reader 尚无当前 host 注入点。P4 只允许新增私域 JS capability 参数；若真实 host 仍不能提供 read capability，AC-E2E-001 保持 incomplete，禁止目录猜测。

## Code Anchors

- **Verified anchors**：`runtime/task/task-store.mjs:207-250` legacy fact append/index；`runtime/task/task-handle.mjs:291-370,415-462` lock/atomic write；`runtime/task/task-kernel-implementation.mjs:214` canonical evidence；`runtime/stage/step-manifest.mjs:4-107` stage/step topology；`runtime/stage/stage-skill-runtime.mjs:7` skill trigger；`tools/cli/stage-runtime.mjs:238-290` private dependency injection seam。
- **Existing interfaces**：`stageRuntimeCliMain(argv, services)` 已接收私有 services；`runOfficialStage(stage, context, invocation, publication)` 返回 stage result；`TaskHandle.withRecordLock` 和 atomic writer 保持唯一写边界。
- **Read now**：上述 anchors、ADR 0012、M14a taxonomy、current decision/spec。
- **Must read before task**：每张卡列出的精确 symbols；P4 还要读当前 Codex host adapter 是否能传 `monitoringSourceBinding`。
- **Context mode**：Full — 涉及 schema、runtime、并发投影和 file 页面 seam，但不改五阶段业务合同。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
|---|---|---|---|
| task lock/atomic | reuse | `runtime/task/task-handle.mjs` | 防半写，不造第二锁 |
| canonical append | extend | `runtime/task/task-store.mjs` | legacy + typed monitoring facts |
| source injection | extend | `tools/cli/stage-runtime.mjs` | 私域 service，不加 public stage |
| topology read | reuse | `runtime/stage/*manifest*` | 只读固定合同 |
| monitoring contract | new | `runtime/evidence/monitoring-facts.mjs` | 唯一 consumer 为 diagnostics/projector；若事实并回 legacy 合同可删除 |
| Codex adapter | new | `runtime/evidence/codex-transcript-adapter.mjs` | 只解析登记来源；M17 通用 adapter 替代时删除 |
| diagnostics | new | `runtime/evidence/monitoring-diagnostics.mjs` | 页面需要确定性派生；被数据库查询层替代时删除 |
| projector/view | new | `runtime/evidence/monitoring-projector.mjs` | 无服务页面 consumer；改用服务/DB 时整层删除 |

## Solution Design

### Overview

P1 先把 `facts.jsonl` 扩成 legacy v1 与严格 monitoring v1 的判别读取/追加。Codex adapter 只接收 launcher 私域 capability：公开 opaque ref、task/run/session、format/schema/CLI/adapter versions 和 `read()`；realpath 不落 public fact。token 按 message ID 去重，tool use 按 tool-use ID 去重。

P2 读取 canonical facts、quality refs 和固定 stage/step/skill topology，机械派生九域 failure、成本、自动化、人工和趋势。它不写修法、severity、root cause 或质量分；来源冲突分别保留并标 conflict。

P3 为每个 task 原子写 project 独占 projection，再在 root lock 内全量重建 flat JSONL、固定赋值 data.js 和固定 HTML。页面打开时读取一次；用户用浏览器原生刷新获取新快照。

P4 只在 `stageRuntimeCliMain` 的既有私有 services seam 接入 `monitoringSourceBinding`，在正式 stage publication 成功后旁路调用采集和投影。旁路失败不回滚 stage 事实，但必须留下 monitoring warning/stale 状态；没有真实 reader 时保持 missing。

### Module responsibilities

#### Monitoring facts and Codex adapter

- **Responsibility**：验证事实合同、追加 canonical facts、解析已登记 transcript。
- **Consumes**：TaskHandle、stage result、registered source binding。
- **Produces**：monitoring facts 与 supporting evidence refs。
- **Must not decide**：不得选择 transcript、扫描目录或改 quality 原始事实。

#### Deterministic diagnostics

- **Responsibility**：按 topology/taxonomy/grain 计算诊断、成本与趋势。
- **Consumes**：canonical facts、quality refs、M14a taxonomy、step/skill contracts。
- **Produces**：可重算 diagnostic items。
- **Must not decide**：不输出修法、分数、severity 或模型判断。

#### Projector and static view

- **Responsibility**：发布 project/global 派生快照和只读页面。
- **Consumes**：认证 task identity 与 canonical facts。
- **Produces**：per-task JSON、global JSONL、data.js、HTML。
- **Must not decide**：不反向发现 canonical task，不回写 runtime，不成为 task identity index。

#### Stage sidecar hook

- **Responsibility**：在正式 stage 写成功后调用旁路链并公开 warning。
- **Consumes**：stage result、storageRoot、可选 host binding。
- **Produces**：monitoring sidecar outcome。
- **Must not decide**：不改变 stage completion、quality verdict 或五阶段顺序。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：`collectMonitoringFacts(ctx,{registeredSource,now})`；`deriveMonitoringDiagnostics({facts,topology,taxonomy,filters})`；`publishTaskMonitoringProjection({storageRoot,task,facts})`；`rebuildGlobalMonitoringSnapshot({storageRoot})`。monitoring fact 使用严格 envelope + typed variant；legacy v1 原样读取。
- **Data flow / state**：stage success → canonical facts/evidence → project task JSON → root JSONL/data.js/html。canonical failure 为 failed/partial；projection failure 保留旧 snapshot 并标 stale/error，不回滚 stage 或 facts。
- **API contract**：N/A — 无 HTTP/API 服务；host 只通过进程内私域 service capability 注入 source binding。
- **UI / external code**：固定四区、共享筛选、状态/错误/coverage/generated time、证据 refs；页面不轮询、不自动 reload、不提供自定义刷新按钮。
- **Fail-loud behavior**：path escape、identity/binding conflict、顶层 schema 不兼容、raw path 泄露立即拒绝新 publication；普通未登记、ENOENT、unsupported、read error、坏行保持 missing/unknown/partial。

## File Boundary

### NEW

- `runtime/schemas/monitoring-fact.v1.json`
- `runtime/schemas/monitoring-projection.v1.json`
- `runtime/evidence/monitoring-facts.mjs`
- `runtime/evidence/codex-transcript-adapter.mjs`
- `runtime/evidence/monitoring-diagnostics.mjs`
- `runtime/evidence/monitoring-projector.mjs`
- `tests/m15-monitoring-facts.test.mjs`
- `tests/m15-codex-transcript-adapter.test.mjs`
- `tests/m15-monitoring-diagnostics.test.mjs`
- `tests/m15-monitoring-projector.test.mjs`
- `tests/m15-monitoring-integration.test.mjs`

### MODIFY

- `runtime/task/task-store.mjs`
- `runtime/evidence/fact-collector.mjs`
- `tools/cli/stage-runtime.mjs`
- `docs/architecture/move-map.json`

### DO NOT TOUCH

- `runtime/schemas/task-fact.v1.json` — legacy 合同保持可读，不原地扩字段。
- `core/fact-indexes.mjs` — 复用既有 `artifact` 枚举；只修 producer，不放宽 validator。
- `config/transcript-sources.mjs`、`config/runtime-fact-sources.mjs`、`config/runtime-fact-v2-sources.mjs` — 不把空 registry 变成全局目录发现器。
- `tools/cli/collect-task-facts.mjs` — 不保留第二生产入口。
- `runtime/stage/stage-runner.mjs`、`runtime/stage/stage-handlers.mjs` — 不把监控塞进核心 publication/completion。
- `workflows/*/steps.json`、`workflows/*/skill-deps.yaml` — 不改固定 stage/step/skill 合同。

## Technical Decisions

### DEC-001 — 判别式 facts 兼容

- **Problem**：legacy v1 太窄，但原地扩展会破坏旧 reader。
- **Options**：原地改 v1；复活 indexes；在同一 `facts.jsonl` 加严格 monitoring variant。
- **Selected**：extend — 同一 authority 读取两个明确版本。
- **Reason**：满足单一权威和 legacy 可读，避免 compatibility bridge。
- **Consequence / risk**：task-store validator 复杂度增加，必须逐 variant 测试。
- **Fallback**：删除未发布的 monitoring rows/代码，legacy 路径不变。
- **F10 disposition**：keep。

### DEC-002 — 私域 source capability

- **Problem**：当前 CLI 无 transcript binding，目录猜测会串 session。
- **Options**：扫描 native sessions；新增 public CLI 路由；复用 `stageRuntimeCliMain` 私有 service injection。
- **Selected**：extend — 只加私域 `monitoringSourceBinding` dependency。
- **Reason**：不新增 public stage/命令，也不泄露 realpath。
- **Consequence / risk**：当前 host 不注入时只能 missing，真实 E2E 可能暂时 incomplete。
- **Fallback**：不传 binding，旁路链仍发布 source unavailable。
- **F10 disposition**：keep。

### DEC-003 — 一模块拥有投影与静态页面

- **Problem**：file 页面不能 fetch/枚举目录，又不应加本地服务。
- **Options**：server；Directory Picker；projector 同时发布 data.js 与固定 HTML。
- **Selected**：new — `monitoring-projector.mjs`。
- **Reason**：唯一 consumer 是本地页面；无进程/端口生命周期。
- **Consequence / risk**：root lock 和安全序列化需专门测试。
- **Fallback**：删除 project/global/html 派生物，不影响 canonical facts。
- **F10 real threat**：并发半写、file CORS、脚本注入会让页面不可信。
- **F10 existing cover**：TaskHandle 原子写只覆盖 taskPath，不覆盖跨 project root。
- **F10 bypassable**：是；删除派生层即可，runtime 不消费它。
- **F10 maintenance cost**：两个 schema、一个 projector、定向并发和浏览器测试。
- **F10 disposition**：keep。

## Test Strategy

设计阶段不执行下列命令。P1～P4 每组 RED/GREEN 使用相同命令和 oracle；RED 必须因目标断言失败而非 setup 失败。

| Target | Task | Role | gate / exit | Oracle / evidence |
|---|---|---|---|---|
| facts/source | T001/T002 | RED/GREEN | focused vitest / 1→0 | ORACLE-M15-FACT / `quality/tests/m15/p1.json` |
| diagnostics | T003/T004 | RED/GREEN | focused vitest / 1→0 | ORACLE-M15-DIAG / `quality/tests/m15/p2.json` |
| projection/view | T005/T006 | RED/GREEN | focused vitest / 1→0 | ORACLE-M15-PROJ / `quality/tests/m15/p3.json` |
| stage seam | T007/T008 | RED/GREEN | focused vitest / 1→0 | ORACLE-M15-E2E / `quality/tests/m15/p4.json` |
| current snapshot | T009 | FINAL | `npm test` / 0 | ORACLE-FINAL / `quality/tests/m15/final.json` |

测试 blueprint：行为、状态/数据流、错误/恢复、路径与隐私、并发/原子、跨模块 seam、来源/coverage 均适用；用户取消与权限 UI 不适用，因为页面无写操作和账号权限。P3/P4 另由 `isolated-browser-qa` 验 file URL、手动刷新、四区筛选、状态和注入字符串；浏览器事实不能由 Vitest 代替。

AC-004 的 evidence oracle 是 P1 测试记录中的 `field_ownership_audit`：逐字段核对 monitoring schema 的 owner/source/view/version metadata，断言 taxonomy 恰为九域且 schema/collector/adapter/skill version 分离。AC-016/AC-018 的 manual oracle 是 P3 记录中的 `manual_view_acceptance`：人工核查默认落点、四区共享筛选、task 下钻与六种恢复状态，并绑定隔离浏览器截图/观察 refs；机器测试不能代替这两项人工判定。

## Rollback and Recovery

- **Global recovery rule**：只回滚本计划 NEW/MODIFY 文件；保留四材料、既有 task facts、quality facts 和 review 原始记录；删除派生 project/global/html 可恢复。
- **删除证明**：不删除任何既有 canonical 文件或历史事实；只允许清理本计划生成且可由 `facts.jsonl` 重建的 project/global/html 派生物。
- **Irreversible boundaries**：commit/push/merge/archive/cleanup 均未授权；build-code 不执行。
- **Recovery owner**：每个 GREEN card owner 先恢复同 Phase RED 的断言，再删除/回退本 Phase 实现；跨 Phase 失败从最近 producer 开始。

### Engineering Risk Handoff

- **PLAN-RISK-001**：真实 Codex binding 不可用
  - **Affected IDs**：FR-SOURCE-001～002、FR-E2E-001、T007～T009
  - **Trigger**：host 无法传 task/run/session-bound `read()` capability
  - **Consequence**：成本事实只能 missing，AC-E2E-001 incomplete
  - **Mitigation or STOP**：保留私域 seam；禁止扫描/mtime/cwd 猜测；build-code 到 P4 前读回真实 host capability
  - **Handling Stage**：build-code
  - **Verification**：fresh Codex task 的 binding 与 fact refs 可回指
- **PLAN-RISK-002**：projector 并发或半写
  - **Affected IDs**：FR-PROJ-001～003、T005～T006
  - **Trigger**：两个 task 同时发布或 projector 中途失败
  - **Consequence**：global 快照丢 task 或页面读半文件
  - **Mitigation or STOP**：per-task 独占文件；root 锁内全量 rebuild + temp/fsync/rename
  - **Handling Stage**：build-code
  - **Verification**：并发与注入失败测试只读完整旧/新快照
- **PLAN-RISK-003**：Git ancestor 缺失
  - **Affected IDs**：AC-E2E-001、T009
  - **Trigger**：snapshot/close 读取缺失对象
  - **Consequence**：代码可测但不能正式 close
  - **Mitigation or STOP**：repo maintenance 恢复对象；未恢复保持 incomplete
  - **Handling Stage**：verify-code
  - **Verification**：所需 commit 可 `git cat-file -e`

## Implementation Order

P1 facts/source → P2 diagnostics → P3 projection/view → P4 stage seam/real E2E。每条边都是 producer-before-consumer；P4 最后接核心入口，避免未验证的 sidecar 影响真实 stage。

## Dependencies and Parallelism

- **Dependencies**：P2 依赖 P1 fact contract；P3 依赖 P1/P2 投影输入；P4 依赖全部纯模块已绿。
- **Parallel work**：不安排并行写；schema、diagnostics、projector 和 stage seam 虽分文件，但合同和 oracle 串行，减少双口径。
- **Test routing fact**：independent advisor returned `feature` because changes stay in one monitoring domain; P3/P4 still use fullstack-slice-testing plus isolated-browser-qa for the runtime→file-page seam.
- **External dependencies**：真实 Codex host binding 与隔离浏览器；缺 binding 为 missing/incomplete，不允许 fallback 扫描。

## Requirement and Verification Traceability

| Source / decision | FR + AC | Phase / Task | Exact files | Command / oracle |
|---|---|---|---|---|
| R-005/009/014/016; D-003/012/013 | FR-SOURCE-001, FR-SOURCE-002, FR-FACT-001, FR-FACT-002, FR-FACT-003, FR-FACT-004, FR-COST-001; AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-010, AC-SOURCE-001, AC-SOURCE-002, AC-FACT-001, AC-FACT-002, AC-FACT-003, AC-FACT-004, AC-COST-001 | P1 T001/T002 | facts schema/store/adapter + artifact producer | focused vitest / ORACLE-M15-FACT |
| R-006/010; D-001/002/006/013 | FR-DIAG-001, FR-DIAG-002, FR-DIAG-003, FR-COST-002, FR-COST-003; AC-007, AC-008, AC-009, AC-011, AC-012, AC-DIAG-001, AC-DIAG-002, AC-DIAG-003, AC-COST-002, AC-COST-003 | P2 T003/T004 | diagnostics + test | focused vitest / ORACLE-M15-DIAG |
| R-011/012; D-006/009/010/011 | FR-COST-001, FR-COST-002, FR-COST-003; AC-006, AC-010, AC-011, AC-012, AC-COST-001, AC-COST-002, AC-COST-003 | P1/P2 T001/T002/T003/T004 | adapter + diagnostics | P1 oracle ORACLE-M15-FACT; P2 oracle ORACLE-M15-DIAG |
| R-007/013; D-007/008/011 | FR-PROJ-001, FR-PROJ-002, FR-PROJ-003, FR-VIEW-001, FR-VIEW-002, FR-VIEW-003; AC-013, AC-014, AC-015, AC-016, AC-017, AC-018, AC-PROJ-001, AC-PROJ-002, AC-PROJ-003, AC-VIEW-001, AC-VIEW-002, AC-VIEW-003 | P3 T005/T006 | projector + test | focused vitest + browser / ORACLE-M15-PROJ |
| R-005/009; D-003/009/013 | FR-SOURCE-001, FR-SOURCE-002, FR-E2E-001; AC-001, AC-002, AC-019, AC-SOURCE-001, AC-SOURCE-002, AC-E2E-001 | P4 T007/T008/T009 | stage-runtime + integration test | focused/final / ORACLE-M15-E2E; ORACLE-FINAL; ORACLE-REPO-CHECK |

所有 19 个 FR 与 19 个 AC 均落入上述五行；每个 FR/AC 使用完整 ID，tasks.md 继续逐 ID 展开。

- **Source closure**：R-001,R-002,R-003,R-004,R-005,R-006,R-007,R-008,R-009,R-010,R-011,R-012,R-013,R-014,R-015,R-016；D-001,D-002,D-003,D-004,D-005,D-006,D-007,D-008,D-009,D-010,D-011,D-012,D-013。
- **AC alias closure**：AC-001,AC-002,AC-003,AC-004,AC-005,AC-006,AC-007,AC-008,AC-009,AC-010,AC-011,AC-012,AC-013,AC-014,AC-015,AC-016,AC-017,AC-018,AC-019；AC-SOURCE-001,AC-SOURCE-002,AC-FACT-001,AC-FACT-002,AC-FACT-003,AC-FACT-004,AC-DIAG-001,AC-DIAG-002,AC-DIAG-003,AC-COST-001,AC-COST-002,AC-COST-003,AC-PROJ-001,AC-PROJ-002,AC-PROJ-003,AC-VIEW-001,AC-VIEW-002,AC-VIEW-003,AC-E2E-001。

### Strict per-FR execution trace

| FR | AC | Phase / task | implementation surface | verification / state |
|---|---|---|---|---|
| FR-SOURCE-001 | AC-SOURCE-001 | P1 T001/T002; P4 T007/T008 | facts + registered source + sidecar | focused source tests; host binding unknown when absent |
| FR-SOURCE-002 | AC-SOURCE-002 | P1 T001/T002; P4 T007/T008 | adapter failure states | malformed/read/binding tests; real host incomplete |
| FR-FACT-001 | AC-FACT-001 | P1 T001/T002 | monitoring fact schema/store | focused fact tests |
| FR-FACT-002 | AC-FACT-002 | P1 T001/T002 | taxonomy and field matrix | schema metadata audit; M14a source retained |
| FR-FACT-003 | AC-FACT-003 | P1 T001/T002 | quality-owner observation refs | quality facts remain owner-owned |
| FR-FACT-004 | AC-FACT-004 | P1 T001/T002 | grain/source/version/conflict | conflict and identity tests |
| FR-DIAG-001 | AC-DIAG-001 | P2 T003/T004 | stage/step/skill diagnostics | deterministic diagnostics tests |
| FR-DIAG-002 | AC-DIAG-002 | P2 T003/T004 | nine-domain failure derivation | domain fixtures; current real facts unknown |
| FR-DIAG-003 | AC-DIAG-003 | P2 T003/T004 | status and coverage rendering | missing/partial/fatal tests |
| FR-COST-001 | AC-COST-001 | P1/P2 T001–T004 | token/tool/duration/retry aggregation | dedup/conflict tests |
| FR-COST-002 | AC-COST-002 | P2 T003/T004 | high cost vs proven waste | token conflict tests |
| FR-COST-003 | AC-COST-003 | P2 T003/T004 | origin denominator and trends | automation/trend tests |
| FR-PROJ-001 | AC-PROJ-001 | P3 T005/T006 | per-task projection | identity/rebuild tests |
| FR-PROJ-002 | AC-PROJ-002 | P3 T005/T006 | global JSONL/data.js rebuild | atomic/lock tests |
| FR-PROJ-003 | AC-PROJ-003 | P3 T005/T006 | safe data.js and text page | injection/static-page tests |
| FR-VIEW-001 | AC-VIEW-001 | P3 T005/T006 | four views and seven filters | browser/manual evidence; current manual verdict incomplete |
| FR-VIEW-002 | AC-VIEW-002 | P3 T005/T006 | open-once and manual refresh | browser/manual evidence |
| FR-VIEW-003 | AC-VIEW-003 | P3 T005/T006 | loading/empty/partial/stale/fatal | state tests; current browser evidence incomplete |
| FR-E2E-001 | AC-E2E-001 | P4 T007/T008/T009 | real Codex five-stage chain | fixture seam green; real host binding unknown/incomplete |

### Deferred/open handoff closure

| id | status | owner | trigger | handoff / consumer | close / retain condition |
|---|---|---|---|---|---|
| OPEN-001 | closed | make-decision | D-005/D-007/D-008/D-011 | build-spec consumes flow/state contract | retain decision and spec flow/state |
| OPEN-002 | closed | make-decision | D-002 | build-spec consumes fixed five-stage rule | retain stage/step/skill contract |
| OPEN-003 | closed | make-decision | D-006/D-011 | build-spec consumes metric denominator rules | retain formulas and insufficient-samples rule |
| OPEN-004 | closed | make-decision | F-003 input audit | build-plan/build-code consume unavailable-input fact | retain incomplete input evidence |
| OPEN-005 | closed | make-decision | D-003 user scope choice | build-plan consumes same-task repair boundary | retain no successor and no scope expansion |
| OPEN-006 | closed | make-decision | D-004 user source choice | build-code consumes Codex-only adapter boundary | retain Claude/multi-CLI deferral to M17 |
| OPEN-007 | closed | make-decision | D-005 failure contract | build-code consumes fatal/partial semantics | retain fail-loud and partial rules |
| OPEN-008 | closed | make-decision | D-006 waste rule | build-code consumes mechanical-only waste | retain no quality score or inferred waste |
| OPEN-009 | closed | make-decision | D-007 static-page choice | build-code consumes fixed HTML/manual refresh | retain no server/auto polling |
| OPEN-010 | closed | make-decision | D-008/D-012 authority choice | build-code consumes facts→projection→data.js chain | retain derived-only global outputs |
| OPEN-011 | closed | make-decision | D-009 E2E requirement | verify-code consumes fresh-host evidence | retain unknown/incomplete until binding exists |
| OPEN-012 | closed | make-decision | D-010 source registration | build-code consumes launcher opaque binding | retain no native-session scan |
| OPEN-013 | closed | make-decision | D-012 single authority | build-code/verify-code consume facts.jsonl authority | retain supporting evidence only |

## Governance Synchronization Matrix

| Surface | Actual files | Change | Tasks | Reason |
|---|---|---|---|---|
| architecture map | `docs/architecture/move-map.json` | change | T002 | 登记新 owner/consumer/delete |
| constitution | `CONSTITUTION.md` | no change | none | 无新原则 |
| stage contracts | `workflows/*` | no change | none | 五阶段/step/skill 固定 |
| task identity | `runtime/task/task-handle.mjs` | no change | none | 复用现有 lock/atomic |
| legacy indexes | `core/fact-indexes.mjs` | no change | none | 不复活第二权威 |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"368817c2910a36e63d3ab4642c30270abdecef15dee7caf8050e778f095919ca","id":"CONSTITUTION","version":"2026-08-03","clause_count":21}`
- **F1**：监控为 stage publication 后旁路；核心 runner/handler 不改。
- **F2**：四个窄函数和两个严格 schema，不暴露 raw transcript path。
- **F3**：canonical facts 仍经 TaskHandle；projection 失败不伪装 publication。
- **F4**：诊断/review 只产事实，不锁 same-task 修复。
- **F5**：不加 gate；所有测试命令只判事实。
- **F6**：facts/evidence 统一外置 taskPath；不永久绑定 runner。
- **F7**：build-plan 仍需用户真实回复；不可逆操作另行授权。
- **F8**：复用 lock/atomic/topology/quality owner，不复制 runner。
- **F9**：missing/unknown/partial/stale/conflict 均可证伪，不写假绿。
- **F10**：只新增有真实页面 consumer 的四模块；均写删除条件。
- **Q1**：真实 E2E、逐 AC、review 缺失时不报完成。
- **Q2**：四材料、结构 publication、质量完成分别记录。
- **Q3**：build-plan 使用独立 wh-review；本地检查不冒充 verdict。
- **S1**：复用 Node/Vitest/现有 runtime，不引入同类库。
- **S2**：N/A — 不引入外部技能实现。
- **S3**：实现前读 current anchors，不依赖历史快照当前性。
- **S4**：N/A — 不新增自定义 workflow skill。
- **S5**：N/A — 不新增自定义 workflow skill。
- **S6**：N/A — 不新增自定义 workflow skill。
- **S7**：五阶段目录不变，监控不是第六阶段。
- **S8**：Codex adapter 与 projector 接口不依赖 Claude 私有目录。

## Phase P1 — Canonical facts 与 Codex source

### Goal

legacy v1 继续可读，新 monitoring facts 与已登记 Codex 来源可严格验证、追加、去重和诚实降级。

### Files

- **NEW**：`runtime/schemas/monitoring-fact.v1.json`、`runtime/evidence/monitoring-facts.mjs`、`runtime/evidence/codex-transcript-adapter.mjs`、`tests/m15-monitoring-facts.test.mjs`、`tests/m15-codex-transcript-adapter.test.mjs`
- **MODIFY**：`runtime/task/task-store.mjs`、`runtime/evidence/fact-collector.mjs`、`docs/architecture/move-map.json`
- **DO NOT TOUCH**：`runtime/schemas/task-fact.v1.json`、`core/fact-indexes.mjs`、source config registries

### Tasks

- `T001`：RED 锁定 fact/source/legacy 兼容失败。
- `T002`：GREEN 实现 schema、adapter、append 与架构登记。

### Verify

ORACLE-M15-FACT

`./node_modules/.bin/vitest run tests/m15-monitoring-facts.test.mjs tests/m15-codex-transcript-adapter.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED exit 1，GREEN exit 0；ORACLE-M15-FACT；证据 `quality/tests/m15/p1.json`。

- **oracle**：ORACLE-M15-FACT；T001/T002 使用同一 oracle。

### Knowledge

token/message 与 tool-use 去重键不同；quality 原始事实不复制；私域 realpath 不落 fact/evidence。

### STOP

若需要原地改 legacy schema、复活 indexes、扫描 session 目录或新增 public CLI route，回 decision/spec。

### Done

定向测试真实记录 legacy/present/missing/partial/fatal/conflict；artifact `material` mismatch 已修成受控 `artifact`；P1 evidence 含逐字段 ownership/taxonomy/version audit；架构 map 有 owner/consumer/delete，未执行 P2。

### Risks and rollback

validator 分支误拒 legacy；先回退 task-store monitoring branch，新文件可删除，legacy 数据不改。

## Phase P2 — 确定性退化与成本派生

### Goal

从 canonical facts 和固定 topology 派生九域、成本、自动化、人工、常见问题与趋势，不产生修法或评分。

### Files

- **NEW**：`runtime/evidence/monitoring-diagnostics.mjs`、`tests/m15-monitoring-diagnostics.test.mjs`
- **MODIFY**：N/A — 本 Phase 纯新模块
- **DO NOT TOUCH**：M14a archive taxonomy、stage/step/skill manifests

### Tasks

- `T003`：RED 覆盖 stage/step/skill、九域、grain、冲突和样本不足。
- `T004`：GREEN 实现纯函数派生。

### Verify

ORACLE-M15-DIAG

`./node_modules/.bin/vitest run tests/m15-monitoring-diagnostics.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED exit 1，GREEN exit 0；ORACLE-M15-DIAG；证据 `quality/tests/m15/p2.json`。

ORACLE-M15-DIAG

- **oracle**：ORACLE-M15-DIAG；T003/T004 使用同一 oracle。

### Knowledge

future stage=pending；step 必须有 outcome；skill trigger=false+reason 合法；高成本不等于浪费。

### STOP

若需要 LLM、severity/root cause/solution、自由文本聚合或新 taxonomy，回 make-decision。

### Done

九域正反例、版本不可比、count<2、未知分母、多来源 conflict 均有可判事实。

### Risks and rollback

grain 双算；保留纯输入 fixture，删除派生模块不影响 canonical facts。

## Phase P3 — Project/global projection 与静态页面

### Goal

并发 task 只能发布完整旧/新快照；固定 HTML 通过同级 data.js 展示四区并由浏览器手动刷新。

### Files

- **NEW**：`runtime/schemas/monitoring-projection.v1.json`、`runtime/evidence/monitoring-projector.mjs`、`tests/m15-monitoring-projector.test.mjs`
- **MODIFY**：N/A — 本 Phase 不接 stage seam
- **DO NOT TOUCH**：canonical task lookup、旧 frontend shell、任何本地 server

### Tasks

- `T005`：RED 覆盖并发、半写、stale、序列化、file 页面和刷新。
- `T006`：GREEN 实现 project/root/html publication。

### Verify

ORACLE-M15-PROJ

`./node_modules/.bin/vitest run tests/m15-monitoring-projector.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED exit 1，GREEN exit 0；ORACLE-M15-PROJ；证据 `quality/tests/m15/p3.json`。另按 isolated-browser-qa 读取真实 file 页面。

ORACLE-M15-PROJ

- **oracle**：ORACLE-M15-PROJ；T005/T006 使用同一 oracle，人工页面验收另绑定截图证据。

### Knowledge

root 只扫 derived monitoring namespace；project 每 task 独占；data.js 固定赋值并安全序列化。

### STOP

若页面需要 fetch、目录授权、服务端或 project/global 被 runtime 反向消费，回 plan/spec。

### Done

两个 task 并发不丢数据；浏览器刷新前旧、刷新后新；partial/stale/fatal 和注入字符串真实可见；AC-016/AC-018 manual verdict 绑定截图/观察 refs。

### Risks and rollback

全局锁陈旧或静态页注入；删除派生输出并重建，不改 canonical facts。

## Phase P4 — Stage sidecar 与 fresh Codex 全链

### Goal

每次正式 stage publication 后旁路更新监控；至少一个 fresh Codex task 从真实 binding 贯通 facts→projection→HTML。

### Files

- **NEW**：`tests/m15-monitoring-integration.test.mjs`
- **MODIFY**：`tools/cli/stage-runtime.mjs`
- **DO NOT TOUCH**：`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-handlers.mjs`、五阶段 manifests

### Tasks

- `T007`：RED 证明 stage success 尚未触发旁路且失败不回滚规则未实现。
- `T008`：GREEN 接入私域 binding 和 post-publication sidecar，完成真实任务验收。
- `T009`：FINAL 在 current snapshot 执行聚合测试、check、隔离浏览器和逐 AC 回放。

### Verify

ORACLE-M15-E2E

P4 focused：`./node_modules/.bin/vitest run tests/m15-monitoring-integration.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`，RED 1/GREEN 0，ORACLE-M15-E2E，`quality/tests/m15/p4.json`。FINAL：`npm test` exit 0，ORACLE-FINAL，`quality/tests/m15/final.json`。另执行 `npm run check` exit 0，ORACLE-REPO-CHECK，记录 `quality/tests/m15/check.json`；该命令依次覆盖 markdownlint、structure、run-checks、skill closure 和 skill package smoke，不代替行为测试。isolated-browser-qa 另记真实观察/evidence。

ORACLE-M15-E2E

- **oracle**：ORACLE-M15-E2E（T007/T008）、ORACLE-FINAL 与 ORACLE-REPO-CHECK（T009）。

### Knowledge

sidecar 是 warning-only；无 binding 时 source unavailable；真实 binding 缺失则不能完成 AC-E2E-001。

### STOP

真实 host 无法提供 read capability、需要 native session 扫描、sidecar 改变 stage quality/completion、Git snapshot 读缺失对象时停止并保留 incomplete。

### Done

fresh Codex 五阶段任务所有承诺事实可回指；页面读取最新完整快照；19 AC 有真实 evidence；review/verify 继续独立。

### Risks and rollback

入口 wiring 影响正常 stage；先移除 `stageRuntimeCliMain` sidecar 调用，P1～P3 纯模块和 canonical facts 保留，stage 行为恢复。
